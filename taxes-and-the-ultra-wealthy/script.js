


function showAndScrollTo(element){
    element.style('display','block');
    element.node().scrollIntoView(true);
}

d3.select('button#get-started')
    .on('click',()=> showAndScrollTo(d3.select('#game-round1')))

d3.select('button#continue-to2')
    .on('click',()=> showAndScrollTo(d3.select('#game-round2')))

d3.select('button#continue-to3')
    .on('click',()=> showAndScrollTo(d3.select('#game-round3')))

function adjustOwedBar(pct, round){
    d3.select('section#game-round' + round + ' .results span.inner-bar').style('height', pct + '%')
    d3.select('section#game-round' + round + ' .results span.annotation')
        .html(Math.round(pct) + '%<br />of pay')
} 
function unhideRoundExplain(round) {
    let curExplanation = d3.select('#game-explain-round' + round)

    curExplanation.select('h2')
        .style('font-size','0rem')
        .style('visibility','visible')
        .transition()
        .style('font-size','3rem')
        .on('end', function() {
            d3.select(this)
                .transition()
                .style('font-size','2rem')
                .on('end', ()=> {
                    curExplanation.style('visibility','visible')
                })
        })

}

const controlsRound1 = d3.select('#game-round1 .controls')
const salaryInput  = controlsRound1.select('input#salary')
const stockOptionsInput  = controlsRound1.select('input#stock-options')

salaryInput.on('input', function() {
        let curValue = d3.select(this).property('value')
        stockOptionsInput.property('value',50-curValue)
        d3.select('label[for=salary]').text('$' + curValue + (curValue>0 ? ' Million' : ' ') + ' in salary')
        d3.select('label[for=stock-options]').text('$' + (50 - curValue) + (curValue<50 ? ' Million' : ' ') + ' in stock options')
        adjustOwedBar(curValue*2*0.35, 1)
        if(curValue == 0){unhideRoundExplain(1)}
    })

stockOptionsInput.on('input', function() {
        let curValue = d3.select(this).property('value')
        salaryInput.property('value',50-curValue)
        d3.select('label[for=stock-options]').text('$' + curValue + (curValue>0 ? ' Million' : ' ') + ' in stock options')
        d3.select('label[for=salary]').text('$' + (50 - curValue) + (curValue<50 ? ' Million' : ' ') + ' in salary')
        adjustOwedBar((50-curValue)*2*0.35, 1)
        if(curValue == 50){unhideRoundExplain(1)}

    })


const controlsRound2 = d3.select('#game-round2 .controls')
const salaryInputRound2  = controlsRound2.select('input#salary-nurse')
const stockOptionsInputRound2 = controlsRound2.select('input#stock-options-nurse')

salaryInputRound2.on('input', function() {
    let targetValue = d3.select(this).property('value')
    let curValue = d3.max([targetValue, 75])
    d3.select(this).property('value', curValue)
    stockOptionsInputRound2.property('value',90-curValue)
    d3.select('label[for=salary-nurse]').text('$' + curValue + (curValue>0 ? 'K' : '') + ' in salary')
    d3.select('label[for=stock-options-nurse]').text('$' + (90 - curValue) + (curValue<90 ? 'K' : '') + ' in stock options')
    adjustOwedBar(18 * curValue/90, 2)
    if(targetValue < 75){unhideRoundExplain(2)}
})

stockOptionsInputRound2.on('input', function() {
    let targetValue = d3.select(this).property('value')
    let curValue = d3.min([targetValue, 15])
    d3.select(this).property('value', curValue)
    salaryInputRound2.property('value',90-curValue)

    d3.select('label[for=stock-options-nurse]').text('$' + curValue + (curValue>0 ? 'K' : ' ') + ' in stock options')
    d3.select('label[for=salary-nurse]').text('$' + (90 - curValue) + (curValue<90 ? 'K' : ' ') + ' in salary')
    adjustOwedBar(18 * (90-curValue)/90, 2)
    if(targetValue > 15){unhideRoundExplain(2)}
})

const stocksSvg = d3.select('#stocks-svg') 
const playStocks = d3.select('#stocks-play')
const moneyTowardsYachtDiv = d3.select('#money-towards-yacht')

d3.json('dataProportionChangeFiltered.json')
	.then( function (data) {
        const stockValues = new Map(data)
        let stockChart= stocksSvg.append('g')
        let bars = stockChart.selectAll('rect').data(stockValues).join('rect')
        .attr('x',(d,i) => (10 + i*40 ))
        .attr('y',(d,i) => 520)
        .attr('height', 80)
        .attr('width', 30)
        .attr('fill', 'var(--blue-primary')
        
        let barText = stockChart.selectAll('text').data(stockValues).join('text')
            .attr('fill', 'white')
            .text(d => d[1].name)
            .attr('transform',(d,i) => "translate(" + (30 + i*40 ) + ",600) rotate(270)")
            .style('font-weight','bold')
            .style('pointer-events','none')

        let year = stocksSvg.append('text').attr('x',300).attr('y',40).text('2015').attr('font-size', '24px').attr('fill','white').attr('font-weight','bold')
        let stockTotalVal = stocksSvg.append('text').attr('x',200).attr('y',70).text('Total Stock Value: $50M').attr('font-size', '18px').attr('fill','white').attr('font-weight','bold')
        let hoveredStockValue = stocksSvg.append('text').attr('x',200).attr('y',120).attr('font-size', '18px').attr('fill','white').attr('font-weight','bold')
        //            hoveredStockValue.text(d[0]+ ': $' + 5 * d[1].valueChange[365] + "M")


        // add lines to chart
        stocksSvg.append('line').attr('x1',0).attr('x2',420).attr('y1',520).attr('y2',520).attr('stroke','white')
        stocksSvg.append('text').attr('x',410).attr('y',520).attr('font-size', '14px').attr('fill','white').attr('font-weight','bold').text('$5M')
        stocksSvg.append('line').attr('x1',0).attr('x2',420).attr('y1',600).attr('y2',600).attr('stroke','white')
        stocksSvg.append('text').attr('x',410).attr('y',600).attr('font-size', '14px').attr('fill','white').attr('font-weight','bold').text('$0')

        let moneyTowardsYacht = 0;

        playStocks.on('click', ()=> {
            //startingLine.attr('x1',0).attr('x2',420).attr('y1',520).attr('y2',520).attr('stroke','white')
            //startingLineAnnotation
            let transitionLength = 6000
            bars.transition().duration(transitionLength).ease(d3.easeLinear)
                .attrTween('y',d=> t=> 600 - 80 * d[1].valueChange[Math.floor(365*t)])
                .attrTween('height', d=> t=> 80 * d[1].valueChange[Math.floor(365*t)])
                .on('end', () => {
                    //d3.select('section.game#game-round3 .results .taxes-owed')
                    //    .style('visibility','visible')
                    bars
                    .on('mouseenter', function(event, d) {
                        d3.select(this).attr('fill', 'var(--blue-darker)')
                        hoveredStockValue.text(d[1].name+ ': $' + Math.round(10 * 5 * d[1].valueChange[365])/10 + "M")
                    })
                    .on('mouseleave', function(event, d) {
                        d3.select(this).attr('fill', 'var(--blue-primary)')
                        hoveredStockValue.text('')
                    })
                    .on('click', function(event,d) {
                        d3.select(this).attr('fill', 'var(--blue-darkest)')
                        moneyTowardsYacht += (5 * d[1].valueChange[365]);
                        moneyTowardsYachtDiv.style('visibility','visible').text('Money towards yacht: $' + Math.round(10 * moneyTowardsYacht)/10 + " Million")
                        if(moneyTowardsYacht >=8 ){unhideRoundExplain(3)}
                    })
                    d3.select('#stocks-annote').style('visibility','visible')
                    d3.select('#game-round3 .game-body').node().scrollIntoView(true);
                })
            year.transition().duration(transitionLength).ease(d3.easeLinear)
                .textTween(()=> t=> 2015 + Math.floor(6*t))
            stockTotalVal.transition().duration(transitionLength).ease(d3.easeLinear)
                .textTween(()=> t=> 'Total Stock Value: $' + 
                Math.round(d3.sum(Array.from(stockValues).map(d=> 5 * d[1].valueChange[Math.floor(365*t)])))
                 + 'M' )
        })
		;
});