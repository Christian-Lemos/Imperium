let largura = 180;
let altura = 170;
let $ = require('jquery')
const utils = require('./../../../../generic/modules/utils')
const observer = require('./../../../../generic/modules/observer')
const navePrefabs = require('./../../../../../../prefabs/Nave')

let setorSelecionado;

function getGalaxiaInfo(callback = () => {})
{
    $.ajax({
        url : 'mapa/get-galaxia',
        method : 'GET',
        dataType : 'JSON',
        success : function(resposta)
        {
            callback(resposta);
        }
    })
}

function encontrarPrefab(nomeTabela)
{
    for(let prefab in navePrefabs)
    {
        let obj = navePrefabs[prefab];
        if(nomeTabela == obj.nome_tabela)
        {
            return obj;
        }
    }
    return null
}


function getCentroSetor(JSetor)
{
    let attrPontos = JSetor.attr('points');
    let pontosArr = attrPontos.trim().split(' ');
    let maiorX = 0;
    let menorX = 9999999999999999999999;

    let maiorY = 0;
    let menorY = 99999999999999999999999;
    
    for(let pontoMapa of pontosArr)
    {
        let posicoes = pontoMapa.split(','); //x = [0] e y = [1]
        
        if(posicoes[0] > maiorX)
        {
            maiorX = posicoes[0]
        }
        if(posicoes[0] < menorX)
        {
            menorX = posicoes[0]
        }

        if(posicoes[1] > maiorY)
        {
            maiorY = posicoes[1]
        }
        if(posicoes[1] < menorY)
        {
            menorY = posicoes[1]
        }
    }
    
    let centroX = Number(((maiorX - menorX) / 2)) + Number(menorX)
    let centroY = Number((maiorY - menorY) / 2) + Number(menorY)

    return {
        posX : centroX,
        posY : centroY
    }
}

function encontrarRota(setor)
{
    let params = {
        origemPosX : window.setorinfo.setor.posX,
        origemPosY : window.setorinfo.setor.posY,
        destinoPosX: setor.setor.posX,
        destinoPosY: setor.setor.posY
    }

    $.ajax({
        url : 'militar/path',
        method : 'GET',
        data: params,
        dataType : 'JSON',
        success : function(rota)
        {
            let htmlRota = ''; 
            let setorAtual = $(`.mapa-setor[data-posicao="${window.setorinfo.setor.posX} ${ window.setorinfo.setor.posY}"]`)
            let centroAtual = getCentroSetor(setorAtual);
            let centroAnterior = centroAtual;
            for(let ponto of rota)
            {
                let centro = getCentroSetor($(`.mapa-setor[data-posicao="${ponto.posX} ${ponto.posY}"]`));

                htmlRota += `<line class = "mapa-path" x1="${centroAnterior.posX}" y1="${centroAnterior.posY}" x2="${centro.posX}" y2="${centro.posY}" style="stroke:rgb(255,0,0);stroke-width:2" />`
                centroAnterior = centro;
            }
            $(".mapa-path").remove();
            $(".mapa-svg").html($(".mapa-svg").html() + htmlRota)
        }
    })
}

function MontarFrota()
{
    
    $.ajax({
        url : "militar/frota",
        method : "GET",
        data: {planetaid : window.planeta.id},
        dataType : "JSON",
        success : (unidades) => {
            console.log(unidades);
            delete unidades.usuarioID
            delete unidades.planetaID
            delete unidades.id
            delete unidades.operacaoID
            delete unidades.relatorioID
            let htmlString = ''
            for(let unidade in unidades)
            {
                let prefab = encontrarPrefab(unidade)
                let disabled = unidades[unidade] > 0 ? "" : "disabled"
                let value = disabled ? ""  : "value = '0'"
                htmlString += 
                `
                    <div class = "form-group">
                        <label class = "imperium-label">${prefab.nome}</label>
                        <input type = "number" class = "form-control imperium-input" name = "${unidade}" ${value} min= "0" max = "${unidades[unidade]}" ${disabled}/>
                    </div>
                `
                
            }
            $("#div-frota").html(htmlString)
        },
        error : (err) => {
            utils.GerarNotificacao(err.responseText, "danger");
        }
    })
}




observer.Observar('userdata-ready',  () => {

    MontarFrota();
    $("#form-operacao-planeta").val(window.planeta.id)
    let galaxia;
    function gerarCasa(setor)
    {
        let p1 = {
            x: largura,
            y: altura / 2
        }
        let p2 = {
            x: largura / 2 + largura / 4,
            y: altura
        }
        let p3 = {
            x: largura / 4,
            y: altura
        }
        let p4 = {
            x: 0,
            y: altura / 2
        }
        let p5 = {
            x: largura / 4,
            y: 0
        }
        let p6 = {
            x: largura / 2 + largura / 4,
            y: 0
        }
        let pontos = [p1, p2, p3, p4, p5, p6]
        let offsetX = (setor.setor.posX) * (largura / 4 + largura / 2)
        let offsetY = altura * setor.setor.posY
        if(setor.setor.posX % 2 != 0)
        {
            offsetY += altura / 2
        }
        for (let i = 0; i < pontos.length; i++)
        {
            pontos[i].x += offsetX
            pontos[i].y += offsetY
        }

        let pontoTextoSetor = {
            x : offsetX + largura / 4,
            y : offsetY + largura / 2
        }
        let pontoTextoNick = {
            x : pontoTextoSetor.x,
            y : pontoTextoSetor.y + 15,
        }

        let pontoPlanetario = {
            x : offsetX  + 10 + largura / 4,
            y : offsetY + altura / 4
        }

        let cor_classe;
        
        if(setor.setor.usuarioID == null)
        {
            cor_classe = 'mapa-setor-sem'
        }
        else if(setor.setor.posX == window.setorinfo.setor.posX && setor.setor.posY == window.setorinfo.setor.posY)
        {
            cor_classe = "mapa-setor-atual"
        }
        else if(setor.setor.usuarioID == userdata.session.id)
        {
            cor_classe = 'mapa-setor-jogador'
        }
        else if(userdata.alianca != null && setor.setor.aliancaID == userdata.alianca.id)
        {
            cor_classe = 'mapa-setor-alianca'
        }
        else
        {
            cor_classe = 'mapa-setor-outro'
        }
        


        return {
            pontos : pontos,
            cor_classe : cor_classe,
            pontoTextoSetor : pontoTextoSetor,
            pontoPlanetario : pontoPlanetario,
            pontoTextoNick : pontoTextoNick
        }

    }
    function gerarHTMLMapa()
    {
        let htmlString = ""
        for(let i = 0; i < galaxia.setores.length; i++)
        {
            let casa = gerarCasa(galaxia.setores[i])
            let htmlPontos = ''
            for (let j = 0; j < casa.pontos.length; j++)
            {
                htmlPontos += casa.pontos[j].x + ',' + casa.pontos[j].y + ' '
            }
            let htmlPlanetario = ''
            if(galaxia.setores[i].setor.planetario == true)
            {
                let c1 = `<circle cx="${casa.pontoPlanetario.x}" cy="${casa.pontoPlanetario.y}" r="8" stroke="black" stroke-width="2" fill="white" />`
                let c2 = `<circle cx="${casa.pontoPlanetario.x}" cy="${casa.pontoPlanetario.y}" r="16" stroke="black" stroke-width="2" fill="transparent" />`
                let c3 = `<circle cx="${casa.pontoPlanetario.x}" cy="${casa.pontoPlanetario.y - 16}" r="2" stroke="black" stroke-width="2" fill="white" />`

                htmlPlanetario = c1 + c2 + c3
            }
            let nickSetor = galaxia.setores[i].setor.usuario != null ? galaxia.setores[i].setor.usuario.nick : ""
            htmlString += `<polygon data-index = "${i}" data-posicao = "${galaxia.setores[i].setor.posX} ${galaxia.setores[i].setor.posY}" class="mapa-setor ${casa.cor_classe}"  points="${htmlPontos}" stroke="black" stroke-width="2" stroke-linecap="butt"></polygon><text x="${casa.pontoTextoSetor.x}" y="${casa.pontoTextoSetor.y}" fill="black">${galaxia.setores[i].setor.nome}</text><text x="${casa.pontoTextoNick.x}" y="${casa.pontoTextoNick.y}" fill="black">${nickSetor}</text>${htmlPlanetario}`
        }

        let mapa = $(".mapa-svg")
        let largura_mapa = largura + ( (galaxia.galaxia_tamanho_x - 1) * (largura / 4 + largura / 2) )
        let altura_mapa = (galaxia.galaxia_tamanho_y + 1) * altura
        mapa.attr('width', largura_mapa ) 
        mapa.attr('height', altura_mapa )
        mapa.html(htmlString)

    }

    getGalaxiaInfo((info) => {
        galaxia = info;
        gerarHTMLMapa();
    })
    
    $(".mapa-svg").on('click', '.mapa-setor', function(){

        let setor = galaxia.setores[$(this).data('index')]
        encontrarRota(setor)
        setorSelecionado = setor
        let popup = $('.setor-popup')
        
        let classificacao = popup.find('.classificacao')
        let honra = popup.find('.honra')
        let ferias = popup.find('.ferias')
        let banido = popup.find('.banido')

        let planetario = popup.find('.planetario')
        let intensidade = popup.find('.intensidade-solar')
        let planetas = popup.find('.total-planetas')
        if(setor.setor.usuarioID == null)
        {
            $('.col-usuario').addClass('hidden')
        }
        
        else
        {
              
            $('.col-usuario').removeClass('hidden')
            let link = setor.setor.aliancaID != null ? `(<a href = 'paginaExterna?id=${setor.setor.aliancaID}' target = "_blank">${setor.setor.aliancaNome}</a>)` : ''
            popup.find('.col-usuario h2').html(`${setor.setor.usuario.nick} ${link}`)

            classificacao.text(setor.setor.usuario.classificacao)
            if(setor.setor.usuario.classificacao >= userdata.rank)
            {       
               
                classificacao.removeClass('text-danger')
                classificacao.addClass('text-success')
            }
            else
            {
                classificacao.addClass('text-danger')
                classificacao.removeClass('text-success')
            }

            honra.text(setor.setor.usuario.pontosHonra)
            if(setor.setor.usuario.pontosHonra >= 0)
            {
                honra.removeClass('text-danger')
                honra.addClass('text-success')
            }
            else
            {
                honra.addClass('text-danger')
                honra.removeClass('text-success')
            }

            ferias.text(setor.setor.usuario.ferias ? "Sim" : "Não")
            banido.text(setor.setor.usuario.banido ? "Sim" : "Não")
        }
        

        /////////////////////////////////////////////////////////////////////
        planetario.text(setor.setor.planetario ? "Sim" : "Não")
        if(setor.setor.planetario >= 0)
        {
            planetario.removeClass('text-danger')
            planetario.addClass('text-success')
        }
        else
        {
            planetario.addClass('text-danger')
            planetario.removeClass('text-success')
        }

        intensidade.text(setor.setor.intensidadeSolar)
        planetas.text(setor.planetas.length)
        popup.removeClass('hidden')
    })


    $(".btn-fechar-setor-popup").on('click', function(){
        $('.setor-popup').addClass("hidden")
    })
    $(".operacao-btn").on('click', function(){
        let operacao = $(this).data('operacao')
        $("#form-operacao-operacao").val(operacao)
        $("#form-operacao-setorDestino").val(setorSelecionado.setor.id)
        $("#modal-operacao").modal('show');
        
    })

    $("#form-operacao").on('submit', function(){
        let params = utils.FormToAssocArray($(this))
        $.ajax({
            url : 'militar/operacao',
            method : 'POST',
            data : params,
            success : function()
            {
                utils.GerarNotificacao("Operação iniciada com sucesso", "success")
            },
            error : function(err)
            {
                utils.GerarNotificacao(err.responseText, "danger")
            }
        })
    })

})

