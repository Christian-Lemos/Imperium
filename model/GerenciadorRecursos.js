
/**
 * @typedef {Object} Producao
 * @property {number} ferro
 * @property {number} cristal
 * @property {number} uranio
 * @property {number} eletronica
 * @property {number} combustivel
 * @property {number} comida
 */

const baseFerro = Math.ceil(60 / 6);
const baseMinaFerro = Math.ceil(90 / 6);

const baseCristal = Math.ceil(30 / 6);
const baseMinaCristal = Math.ceil(55 / 6);

const baseEletronica  = Math.ceil(15 / 6);
const baseEletronicaFabrica = Math.ceil(30 / 6);

const baseUranio = Math.ceil(6 / 6);
const baseMinaUranio = (18 / 6);

const baseCombustivel = Math.ceil(0 / 6);
const baseSintetizadorCombustivel = Math.ceil(12 / 6);

const baseComida = Math.ceil(78 / 6);
const baseFazenda = Math.ceil(48 / 6)

const baseEnergia = 100;

/**
 * 
 * @param {number} totalFerro 
 * @param {number} totalCristal 
 * @param {number} totalUranio 
 * @description Calcula o tempo de construção em segundos
 * @returns {number}
 */
function GetTempoConstrucao(totalFerro, totalCristal, totalUranio)
{
    return Math.ceil(((totalFerro + totalCristal + totalUranio * 2) / 5000 ) * 3600)
}

/**
 * 
 * @param {number} nivelMinaFerro 
 * @param {number} nivelMinaCristal 
 * @param {number} nivelMinaUranio 
 * @param {number} nivelFabricaEletronica 
 * @param {number} nivelSintetizador 
 * @param {number} nivelFazenda 
 * @description Calcula o consumo total de energia
 * @returns {number}
 */
function GetConsumoTotal(nivelMinaFerro, nivelMinaCristal, nivelMinaUranio, nivelFabricaEletronica, nivelSintetizador, nivelFazenda)
{
    return GetConsumoMinaFerro(nivelMinaFerro) + GetConsumoMinaCristal(nivelMinaCristal) + GetConsumoMinaUranio(nivelMinaUranio) + GetConsumoFabricaEletronica(nivelFabricaEletronica) + GetConsumoSintetizadorCombustivel(nivelSintetizador) + GetConsumoFazenda(nivelFazenda);
}


/**
 * @param {Object} [niveis] Os niveis dos edificios consumidores
 * @param {number} [niveis.minaFerro] 
 * @param {number} [niveis.minaCristal]
 * @param {number} [niveis.minaUranio]
 * @param {number} [niveis.fabricaEletronica]
 * @param {number} [niveis.sintetizador]
 * @param {number} [niveis.fazenda]
 * @param {Object} [posSol] O vetor de posição do sol
 * @param {number} [posSol.x] 
 * @param {number} [posSol.y]
 * @param {Object} [posPlaneta] O vetor de posição do planeta
 * @param {number} [posPlaneta.x] 
 * @param {number} [posPlaneta.y]
 * @param {number} intensidadeSolar A intensidade solar do setor
 * @description Retorna a produção de recursos
 * @returns {Producao} Retorno um Integer da produção de ferro do planeta
 */
function GetProducaoTotal(niveis, nivelPlanta, nivelReator, posSol, posPlaneta, intensidadeSolar)
{
    let energiaTotal = GetEnergia(nivelPlanta, nivelReator, posSol, posPlaneta, intensidadeSolar)
    let consumo = GetConsumoTotal(niveis.minaFerro, niveis.minaCristal, niveis.minaUranio, niveis.fabricaEletronica, niveis.sintetizador, niveis.fazenda);

    return {
        
        ferro : GetProducaoFerro(niveis.minaFerro, consumo, energiaTotal), 
        cristal : GetProducaoCristal(niveis.minaFerro, consumo, energiaTotal),
        uranio : GetProducaoUranio(niveis.minaUranio, consumo, energiaTotal),
        eletronica : GetProducaoEletronica(niveis.fabricaEletronica, consumo, energiaTotal),
        comida : GetProducaoComida (niveis.fazenda, consumo, energiaTotal),
        combustivel : GetProducaoCombustivel(niveis.sintetizador, consumo, energiaTotal)
    }
}




///Ferro
/**
 * @param {number} nivelMina
 * @param {number} consumoEnergiaTotal O total de energia produzida por todos os edificios consumidores
 * @param {number} totalEnergiaProduzida O total de energia produzida no planeta
 * @returns {number}
 */
function GetProducaoFerro(nivelMina, consumoEnergiaTotal, totalEnergiaProduzida)
{
    let multiplicador = (totalEnergiaProduzida - consumoEnergiaTotal < 0) ? (totalEnergiaProduzida / consumoEnergiaTotal) : 1
    return Math.ceil((baseMinaFerro * nivelMina * Math.pow(1.1, nivelMina)) * multiplicador) + baseFerro
}

/**
 * 
 * @param {number} nivelMinaFerro O Nível da mina de ferro do planeta
 * @returns {{ferro : number, cristal : number, uranio : number}} 
 */
function GetCustoUpgradeMinaFerro (nivelMinaFerro)
{
    var custoFerro = Math.ceil((172 * Math.pow(1.6, (nivelMinaFerro - 1))));
    var custoCristal = Math.ceil((65 * Math.pow(1.4, (nivelMinaFerro - 1))));
    return {ferro : custoFerro, cristal : custoCristal, uranio : 0};
}


/**
 * @param {number} nivelMina O nivel da mina de ferro
 * @description Calcula o consumo de energia da mina de ferro
 * @returns {number}
 */
function GetConsumoMinaFerro (nivelMina)
{
    return Math.ceil(20 * nivelMina * Math.pow(1.1, nivelMina));
}



// Cristal
/**
 * @param {number} nivelMina O Nível da mina de cristal do planeta
 * @returns {number} Retorno um Integer da produção de cristal do planeta
 */
function GetProducaoCristal (nivelMina, consumoEnergiaTotal, totalEnergiaProduzida)
{
    let multiplicador = (totalEnergiaProduzida - consumoEnergiaTotal < 0) ? (totalEnergiaProduzida / consumoEnergiaTotal) : 1
    return Math.ceil((baseMinaCristal * nivelMina * Math.pow(1.1,nivelMina)) * multiplicador) + baseCristal
}

/**
 * @param {number} nivelMina O Nível da mina de cristal do planeta
 * @returns {{ferro : number, cristal : number, uranio : number} 
 */
function GetCustoUpgradeMinaCristal (nivelMina)
{
    var custoFerro = Math.ceil((185 * Math.pow(1.5, (nivelMina - 1))));
    var custoCristal = Math.ceil((92 * Math.pow(1.5, (nivelMina - 1))));
    return {ferro : custoFerro, cristal : custoCristal, uranio : 0};
}
/**
 * @param {number} nivelMina O nivel da mina de cristal
 * @description Calcula o consumo de energia da mina de cristal
 * @returns {number}
 */
function GetConsumoMinaCristal (nivelMina)
{
    return Math.ceil(20 * nivelMina * Math.pow(1.1, nivelMina));
}

//Eletronica

/**
 * @param {number} nivelFabrica O Nível da fabrica de eletronicas do planeta
 * @returns {number} Retorno um Integer da produção de eletronicas do planeta
 */
function GetProducaoEletronica(nivelFabrica, consumoEnergiaTotal, totalEnergiaProduzida)
{
    let multiplicador = (totalEnergiaProduzida - consumoEnergiaTotal < 0) ? (totalEnergiaProduzida / consumoEnergiaTotal) : 1
    return Math.ceil((baseEletronicaFabrica * nivelFabrica * Math.pow(1.1, nivelFabrica)) * multiplicador ) + baseEletronica
}

/**
 * @param {number} nivelMina O Nível da mina de cristal do planeta
 * @returns {{ferro : number, cristal : number, uranio : number}} 
 */
function GetCustoUpgradeFabricaEletronica(nivelFabrica)
{
    var custoFerro = Math.ceil((112 * Math.pow(1.4, (nivelFabrica - 1))));
    var custoCristal = Math.ceil((145 * Math.pow(1.3, (nivelFabrica - 1))));
    var custoUranio = Math.ceil((36 * Math.pow(1.1, (nivelFabrica - 1))));
    return {ferro : custoFerro, cristal : custoCristal, uranio : custoUranio};
}



/**
 * @param {number} nivelFabrica O nivel da fabrica de eletrônica
 * @description Calcula o consumo de energia da fabrica de eletrônica
 * @returns {number}
 */
function GetConsumoFabricaEletronica (nivelFabrica)
{
    return Math.ceil(30 * nivelFabrica * Math.pow(1.1, nivelFabrica));
}

//Uranio
/**
 * @param {number} nivelMina O Nível da mina de urânio do planeta
 * @returns {number} Retorno um Integer da produção de uranio do planeta
 */
function GetProducaoUranio(nivelMina, consumoEnergiaTotal, totalEnergiaProduzida)
{
    let multiplicador = (totalEnergiaProduzida - consumoEnergiaTotal < 0) ? (totalEnergiaProduzida / consumoEnergiaTotal) : 1
    return Math.ceil((baseMinaUranio * nivelMina * Math.pow(1.1, nivelMina)) * multiplicador) + baseUranio
}

/**
 * @param {number} nivelMina O Nível da mina de urânio do planeta
 * @returns {{ferro : number, cristal : number, uranio : number}} 
 */
function GetCustoUpgradeMinaUranio(nivelMina)
{
    var custoFerro = Math.ceil((175 * Math.pow(2.1, (nivelMina - 1))));
    var custoCristal = Math.ceil((190 * Math.pow(1.2, (nivelMina - 1))));
    return {ferro : custoFerro, cristal : custoCristal, uranio : 0};
}


/**
 * @param {number} nivelMina O nivel da mina de urânio
 * @description Calcula o consumo de energia da mina de urânio
 * @returns {number}
 */
function GetConsumoMinaUranio (nivelMina)
{
    return Math.ceil(40 * nivelMina * Math.pow(1.1, nivelMina));
}


//Combustivel

/**
 * @param {number} nivelSintetizador O Nível do sintentizador de combustivel
 * @returns {number} Retorno um Integer da produção de combustivel do planeta
 */
function GetProducaoCombustivel(nivelSintetizador, consumoEnergiaTotal, totalEnergiaProduzida)
{
    let multiplicador = (totalEnergiaProduzida - consumoEnergiaTotal < 0) ? (totalEnergiaProduzida / consumoEnergiaTotal) : 1
    return Math.ceil((baseSintetizadorCombustivel * nivelSintetizador * Math.pow(1.1, nivelSintetizador)) * multiplicador) + baseCombustivel
}


/**
 * @param {number} nivelMina O Nível do sintentizador de combustivel
 * @returns {{ferro : number, cristal : number, uranio : number}} 
 */
function GetCustoUpgradeSintetizadorCombustivel(nivelSintetizador)
{
    var custoFerro = Math.ceil((175 * Math.pow(1.2, (nivelSintetizador - 1))));
    var custoCristal = Math.ceil((190 * Math.pow(2.1, (nivelSintetizador - 1))));
    var custoUranio = Math.ceil((70 * Math.pow(1.2, (nivelSintetizador - 1))));
    return {ferro : custoFerro, cristal : custoCristal, uranio : custoUranio};
}


/**
 * @param {number} nivelSintetizador O nivel do sintetizador de combustivel
 * @description Calcula o consumo de energia do sintetizador de combustivel
 * @returns {number}
 */
function GetConsumoSintetizadorCombustivel (nivelSintetizador)
{
    return Math.ceil(40 * nivelSintetizador * Math.pow(1.1, nivelSintetizador));
}


//Comida
/**
 * @param {number} nivelFazenda O Nível da fazenda
 * @returns {number}
 */
function GetProducaoComida(nivelFazenda, consumoEnergiaTotal, totalEnergiaProduzida)
{
    let multiplicador = (totalEnergiaProduzida - consumoEnergiaTotal < 0) ? (totalEnergiaProduzida / consumoEnergiaTotal) : 1
    return Math.ceil((baseFazenda * nivelFazenda * Math.pow(1.1, nivelFazenda)) * multiplicador) + baseComida
}

/**
 * @param {number} nivelFazenda O Nível da fazenda
 * @returns {{ferro : number, cristal : number, uranio : number}} 
 */
function GetCustoUpgradeFazenda(nivelFazenda)
{
    var custoFerro = Math.ceil((70 * Math.pow(1.7, (nivelFazenda - 1))));
    var custoCristal = Math.ceil((70 * Math.pow(1.7, (nivelFazenda - 1))));
    return {ferro : custoFerro, cristal : custoCristal, uranio : 0};
}

/**
 * @param {number} nivelFazenda O nivel da fazenda
 * @description Calcula o consumo de energia da fazenda
 * @returns {number}
 */
function GetConsumoFazenda (nivelFazenda)
{
    return Math.ceil(20 * nivelFazenda * Math.pow(1.1, nivelFazenda));
}


// Energia

    //Planta Solar

    /**
     * @param {number} nivelPlanta
     * @param {number} intensidadeSolarPlaneta A intensidade solar do planeta
     * @description Calcula a produção da planta de energia solar no planeta
     * @returns {number} 
    */
    function GetProducaoEnergiaPlantaSolar (nivelPlanta, intensidadeSolarPlaneta)
    {
        return Math.ceil(((70 * nivelPlanta * Math.pow(1.1, nivelPlanta)) * (intensidadeSolarPlaneta / 100)));
    }

    /**
     * @param {number} nivelPlanta
     * @returns {{ferro : number, cristal : number, uranio : number}} 
     */
    function GetCustoUpgradePlantaSolar(nivelPlanta)
    {
        var custoFerro = Math.ceil((120 * Math.pow(1.5, (nivelPlanta - 1))));
        var custoCristal = Math.ceil((170 * Math.pow(1.4, (nivelPlanta - 1))));
        return {ferro : custoFerro, cristal : custoCristal, uranio : 0};
    }

    /**
     * @param {number} nivelMina O Nível do sintentizador de combustivel
     * @returns {{ferro : number, cristal : number, uranio : number}} 
    */
    function GetCustoUpgradeReatorFusao(nivelReator)
    {
        var custoFerro = Math.ceil((210 * Math.pow(1.3, (nivelReator - 1))));
        var custoCristal = Math.ceil((210 * Math.pow(1.5, (nivelReator - 1))));
        var custoUranio = Math.ceil((150 * Math.pow(2, (nivelReator - 1))));
        return {ferro : custoFerro, cristal : custoCristal, uranio : custoUranio};
    }
    /**
     * @param {number} nivelReator
     * @description Calcula a produção do reator de fusão no planeta
     * @returns {number} 
    */
    function GetProducaoEnergiaReatorFusao(nivelReator)
    {
        return Math.ceil(((200 * nivelReator * Math.pow(1.1, nivelReator))));
    }

    /**
     * @param {Number} nivelPlanta O nível da planta solar do planeta
     * @param {Number} nivelReator O nível do reator de fusao do planeta
     * @param {Object} [posSol] A posição x e y do sol do sistema
     * @param {Number} [posSol.x] A posição do eixo X do sol
     * @param {Number} [posSol.y] A posição do eixo Y do sol
     * @param {Object} [posPlaneta] A posicao x e y do planeta
     * @param {Number} [posPlaneta.x] A posição do eixo X do planeta
     * @param {Number} [posPlaneta.y] A posição do eixo Y do planeta
     * @param {Number} instensidadeSol A intensidade solar do sistema
     * @description Calcula a produção de energia do planeta
     * @returns {number} A produção de energia do planeta
     */
    function GetEnergia(nivelPlanta, nivelReator, posSol, posPlaneta, instensidadeSol)
    {
        var intensidadeSolarPlaneta = GetIntensidadeSolarPlaneta(posSol, posPlaneta, instensidadeSol);
        return GetProducaoEnergiaPlantaSolar(nivelPlanta, intensidadeSolarPlaneta) + GetProducaoEnergiaReatorFusao(nivelReator) + baseEnergia;
    }

    /**
     * @param {Object} [posSol] A posição x e y do sol do sistema
     * @param {Number} [posSol.x] A posição do eixo X do sol
     * @param {Number} [posSol.y] A posição do eixo Y do sol
     * @param {Object} [posPlaneta] A posicao x e y do planeta
     * @param {Number} [posPlaneta.x] A posição do eixo X do planeta
     * @param {Number} [posPlaneta.y] A posição do eixo Y do planeta
     * @param {number} intensidadeS A intensidade solar do sistema
     * @description Calcula a intensidade solar que um planeta recebe
     * @returns {number} Intensidade em Integer
     */
    function GetIntensidadeSolarPlaneta (posSol, posPlaneta, intensidadeSol)
    {
        var distancia = 0;
        var x = posSol.x
        var y = posSol.y
        while(true)
        {
            
            if(x == posPlaneta.x && y == posPlaneta.y)
            {
                break;
            }
            if(x < posPlaneta.x)
            {
                x++;
            }
            else if(x > posPlaneta.x)
            {
                x--;
            }
            if(y < posPlaneta.y)
            {
                y++;
            }
            else if(x > posPlaneta.y)
            {
                y--;
            }
            distancia++;
        }
        return intensidadeSol - ( 9 * distancia);
    }

(function(exports){

    exports.GetProducaoFerro = GetProducaoFerro,
    exports.GetCustoUpgradeMinaFerro = GetCustoUpgradeMinaFerro,

    exports.GetProducaoCristal = GetProducaoCristal,
    exports.GetCustoUpgradeMinaCristal = GetCustoUpgradeMinaCristal,

    exports.GetIntensidadeSolarPlaneta = GetIntensidadeSolarPlaneta,
    exports.GetProducaoEnergiaPlantaSolar = GetProducaoEnergiaPlantaSolar,
    exports.GetProducaoEnergiaReatorFusao = GetProducaoEnergiaReatorFusao,
    exports.GetEnergia = GetEnergia,
    
    exports.GetProducaoEletronica = GetProducaoEletronica,
    exports.GetCustoUpgradeFabricaEletronica = GetCustoUpgradeFabricaEletronica,

    exports.GetProducaoUranio = GetProducaoUranio,
    exports.GetCustoUpgradeMinaUranio = GetCustoUpgradeMinaUranio,

    exports.GetProducaoCombustivel = GetProducaoCombustivel,
    exports.GetCustoUpgradeSintetizadorCombustivel = GetCustoUpgradeSintetizadorCombustivel,
    
    exports.GetProducaoComida = GetProducaoComida,
    exports.GetCustoUpgradeFazenda = GetCustoUpgradeFazenda,

    exports.GetCustoUpgradeReatorFusao = GetCustoUpgradeReatorFusao,
    exports.GetCustoUpgradePlantaSolar = GetCustoUpgradePlantaSolar,

    exports.GetConsumoFabricaEletronica = GetConsumoFabricaEletronica,
    exports.GetConsumoFazenda = GetConsumoFazenda,
    exports.GetConsumoMinaCristal = GetConsumoMinaCristal,
    exports.GetConsumoMinaFerro = GetConsumoMinaFerro,
    exports.GetConsumoMinaUranio = GetConsumoMinaUranio,
    exports.GetConsumoSintetizadorCombustivel = GetConsumoSintetizadorCombustivel,

    exports.GetProducaoTotal = GetProducaoTotal,
    exports.GetConsumoTotal = GetConsumoTotal,

    exports.GetTempoConstrucao = GetTempoConstrucao

}(typeof exports === 'undefined' ? this.GerenciadorRecursos = {} : exports));