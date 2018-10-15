const models = require('./../model/DBModels');
const cron = require('node-cron');
const GR = require('./shared/GerenciadorRecursos');
const io = require('./../model/io');
const MUtils = require('./DBModelsUtils')
const ranking = require('./Ranking')
const Bluebird = require('bluebird')
const edificioBuiler = require('./../prefabs/EdificioBuilder')
const edificioPrefab = require('./../prefabs/Edificio')
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
                                let promessas = []
                                promessas.push(
                                    new Bluebird((resolve) => {
                                        models.RecursosPlanetarios.findOne({where : {planetaID : planeta.id}})
                                            .then(recursos => resolve(recursos.dataValues))
                                    })
                                )
                                promessas.push(
                                    new Bluebird((resolve) => {
                                        models.Edificios.findOne({where : {planetaID : planeta.id}})
                                            .then(edificios => resolve(edificios.dataValues))
                                    })
                                )
                                Bluebird.all(promessas)
                                    .then((retorno) => {
                                        let recursos = retorno[0]
                                        let edificios = retorno[1]
                                        
                                        let isp = edificioBuiler.getIntensidadeSolarPlaneta({x : setor.solPosX, y : setor.solPosY}, {x : planeta.posX, y : planeta.posY}, setor.intensidadeSolar);
                                        let true_edificios = {};
                                        for(let chave in edificioPrefab)
                                        {
                                            let edit = edificioBuiler.getEdificio(chave)
                                            if(edit != null)
                                            {
                                                edit.nivel = edificios[chave]
                                        
                                                true_edificios[chave] = edit;
                                            }
                                            
                                        }
                                        let producao = edificioBuiler.getProducao(true_edificios, isp);
                                        let capacidade = producao.capacidade
        
                                        let soma = producao.ferro + recursos.recursoFerro;
                                        let updateFerro = (soma < capacidade) ? soma : capacidade; 

                                        soma = producao.cristal + recursos.recursoCristal;
                                        let updateCristal = (soma < capacidade) ? soma : capacidade; 
                                        
                                        soma = producao.componente + recursos.recursoComponente;
                                        let updateComponentes = (soma < capacidade) ? soma : capacidade; 
                                        
                                        soma = producao.titanio + recursos.recursoTitanio;
                                        let updateTitanio = (soma < capacidade) ? soma : capacidade; 
        
                                        
                                        let update = {
                                            recursoFerro : updateFerro, 
                                            recursoCristal : updateCristal,
                                            recursoTitanio : updateTitanio, 
                                            recursoComponente : updateComponentes
                                        }
        
                                        models.RecursosPlanetarios.update(update, {where : {planetaID : planeta.id}});
                                        io.EmitirParaSessao(usuario.id, 'recurso-planeta' + planeta.id, update);
                                    })
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
            models.Edificios.findOne({where : {planetaID : planetaID}})
                .then((edi) => {
                    edi[edificio] = edi[edificio] + 1
                    edi.save().then(() => {
                        MUtils.GetUsuarioPlaneta(planeta).then((usuario) =>
                        {
                            let custo = GR.GetCustoEdificioPorId(edificioID, edi[edificio]);
                            ranking.AdicionarPontos(usuario, custo, ranking.TipoPontos.pontosEconomia);
                            io.EmitirParaSessao(usuario.id, 'edificio-melhoria-completa', {planetaID : planetaID, edificioID : edificioID});
                        });
                    });
                })  
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