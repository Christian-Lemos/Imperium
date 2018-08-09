var models = require('./DBModels');
var cron = require('node-cron');
var GR = require('./GerenciadorRecursos');
var io = require('./io');
var MUtils = require('./DBModelsUtils')
/**
 * @type {Array.<{planetaID : number, edificioID : number, timeout : NodeJS.Timer}>}
 * @description Array que armazena as construções para serem executadas (timeout)
 */
var construcoes = new Array();
/**
 * @description Cron job para adicionar recursos para os jogadores
 */
var adicionarRecurso = cron.schedule('*/10 * * * * *', function()
{
    if(models.isReady())
    {

        models.Usuario.findAll({attributes : ['id']}).then((usuarios) => {
            
            usuarios.forEach((usuario) =>
            {
                models.Setor.findAll({where : {usuarioID :usuario.id}, attributes: ['id', 'solPosX', 'solPosY', 'solPosX', 'intensidadeSolar']}).then((setores) =>
                {
                    setores.forEach((setor) =>
                    {
                        models.Planeta.findAll({where : {colonizado : true, setorID : setor.id}}).then((planetas) =>
                        {
                            planetas.forEach((planeta) =>
                            {
                                let producao = GR.GetProducaoTotal({
                                    fabricaEletronica : planeta.fabricaEletronica,
                                    fazenda : planeta.fazenda,
                                    minaCristal : planeta.minaCristal,
                                    minaFerro : planeta.minaFerro,
                                    minaUranio : planeta.minaUranio,
                                    sintetizador : planeta.sintetizadorCombustivel
                                }, planeta.plantaSolar, planeta.reatorFusao, {
                                    x: setor.solPosX,
                                    y : setor.solPosY
                                }, {
                                    x : planeta.posX,
                                    y : planeta.posY
                                }, setor.intensidadeSolar);
                                let updateFerro = producao.ferro + planeta.recursoFerro; 
                                let updateCristal = producao.cristal + planeta.recursoCristal;
                                let updateEletronica = producao.eletronica + planeta.recursoEletronica;
                                let updateComida = producao.comida + planeta.recursoComida;
                                let updateUranio = producao.uranio + planeta.recursoUranio;
                                let updateComustivel = producao.combustivel + planeta.recursoCombustivel;
                                let update = {
                                    recursoFerro : updateFerro, 
                                    recursoCristal : updateCristal,
                                    recursoEletronica : updateEletronica, 
                                    recursoCombustivel : updateComustivel,
                                    recursoComida : updateComida,
                                    recursoUranio : updateUranio
                                }
                                models.Planeta.update(update, {where : {id : planeta.id}});
                                io.EmitirParaSessao(usuario.id, 'recurso-planeta ' + planeta.id, update);
                            });
                        })  
                    }) 
                });
            })  
        });
    }
})

/**
 * @param {number} edificioID 
 * @param {number} planetaID 
 * @param {number} duracao 
 * @return {NodeJS.Timer}
 */
function CriarConstrucaoTimer(edificioID, planetaID, duracao)
{
    return setTimeout(() => 
    {
        models.Planeta.findOne({where : {id : planetaID}}).then((planeta) =>{

            let edificio = GR.EdificioIDParaString(edificioID); 
            planeta[edificio] = planeta[edificio] + 1;
            planeta.save();
            MUtils.GetUsuarioPlaneta(planetaID).then((usuario) =>
            {
                io.EmitirParaSessao(usuario.id, 'edificio-melhoria-completa', {planetaID : planetaID, edificioID : edificioID});
            });
            
        });
        RemoverConstrucao(planetaID, edificioID);
    }, duracao * 1000);
}


/**
 * @param {number} planetaID O ID do planeta da construção
 * @param {number} edificio O ID do edificio
 * @param {number} duracao A duração da construção em segundos
 * @param {function} callback callback(err, construcao)
 * @description Adiciona uma construção à um planeta
 */
function AdicionarConstrucao(planetaID, edificioID, duracao, callback)
{
    if(typeof(edificioID) !== 'number')
    {
        callback("O edificioID precisa ser um número");
    }

    else if(GR.VerificarIDEdificio(edificioID) === false)
    {
        callback("edificioID inválido", null)
    }
    else
    {
        models.Construcao.create({planetaID : planetaID, edificioID : edificioID, duracao : duracao}).then((construcao)=>
        {
            let timer = CriarConstrucaoTimer(edificioID, planetaID, duracao)
            construcoes.push({planetaID : planetaID, edificioID : edificioID, timeout : timer});
            if(typeof(callback) == 'function')
                callback(null, construcao)
        }).catch((err) =>
        {
            callback(err, null);
        });
    }
}

/**
 * @param {number} idPlaneta O id da construção
 * @param {number} idEdificio O id do edificio
 * @description Remove uma construção de um planeta
 */
function RemoverConstrucao(idPlaneta, idEdificio)
{
    for(let i = 0; i < construcoes.length; i++)
    {
        if(construcoes[i].planetaID == idPlaneta && construcoes[i].edificioID == idEdificio)
        {
            clearTimeout(construcoes[i].timeout);
            models.Construcao.destroy({where : {planetaID : construcoes[i].planetaID, edificioID : construcoes[i].edificioID}});
            construcoes.splice(i, 1);
            break;
        }
    }
}

var recuperarConstrucoes = setInterval(() =>{
    if(models.isReady())
    {
        clearInterval(recuperarConstrucoes);
        models.Construcao.findAll({}).then((construcoesModel) =>{
            
            for(let i = 0; i  < construcoesModel.length; i++)
            {
                let timer = CriarConstrucaoTimer(construcoesModel[i].edificioID, construcoesModel[i].planetaID, construcoesModel[i].duracao);
                construcoes.push({planetaID : construcoesModel[i].planetaID, edificioID : construcoesModel[i].edificioID, timeout : timer});
                construcoesModel[i].inicio = new Date();
                construcoesModel[i].save();
            }
            
        });
    }
}, 5000)

   

module.exports = {
    Recursos : adicionarRecurso,
    AdicionarConstrucao : AdicionarConstrucao,
    RemoverConstrucao : RemoverConstrucao
}