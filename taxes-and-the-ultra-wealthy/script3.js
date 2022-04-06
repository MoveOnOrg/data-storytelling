// to test any rounds d3.selectAll('.nav-div').attr('playable',1)



const tooltipTexts = {
    salaryGameHint: "A large salary is taxed at a pretty high rate, but stock options aren't taxed until they're used. <strong>Slide the slider all the way to the other end to see what happens</strong>",
    salaryGameHintNurse: "Yeah yeah, nurses can’t choose to get their pay in stock options, but let’s just pretend.",
    futureTaxes: "This is showing taxes owed in the current year. As we'll soon see, the ultra wealthy can find other ways to avoid taxes when they can choose their timing.",
    nurseTab: "Slide the slider all the way to the other end before moving on to The Nurse" ,
    spendGameHint: "When you sell a stock or other investment you have to pay Capital Gains taxes. These taxes are lower than income taxes, but if you never sell at all you don't owe taxes on your investment gains.",
    fileTaxesGameHint: "Click these buttons and see how to chart changes",
    fileTaxesSvgGameHint: "Click the buttons below to see how this chart changes"
}


/***********************************************************/
/*** GENERAL HELPER FUNCTIONS AND UNIVERSAL INTERACTIONS ***/
/***********************************************************/


// currently only overlay is opening screen, but these helper functions should help if we want to put them back elsewhere. 
function showOverlay(selectString) {
    d3.select('#overlay-background').style('display','block')
    d3.select(selectString).style('display','block')
}
function hideOverlays() {
    d3.select('#overlay-background').style('display','none')
    d3.selectAll('.overlay').style('display','none')
}

// this animates the h2 in a .interaction-response section, and then unhides the rest of the section. 
function animateInteractionResponse(gameSection) {
    // if range can keep move transition keeps being triggered. Disabling the range for duration of animation helps. 
    gameSection.selectAll('input[type="range"]').attr('disabled',true)
    gameSection.select('.interaction-response').style('visibility','visible')
        .transition().style('opacity',1)
    gameSection.select('img.character-full').attr('src', gameSection.attr('player') + '_full_reacted.png')
    gameSection.select('.interaction-response h2')
        .style('font-size', '0rem')
        .style('visibility','visible')
        .transition().style('font-size', '3rem')
        .on('end', function() {
            d3.select(this)
            .transition()
            .style('font-size','2rem')
            .on('end', ()=> {
                gameSection.transition().delay(200).duration(100).select('.interaction-response .interaction-content').style('visibility','visible')
                gameSection.selectAll('input[type="range"]').attr('disabled',null)
            })
        })
}

// Toggling between player tabs for all different games (ceo/nurse)

function activatePlayerTab(player, game){
    d3.selectAll('.player-tabs button[game="'+ game +'"]').attr('active','0')
    d3.selectAll('section.game-body[game="'+ game +'"]').style('display','none')
    d3.select('.player-tabs button[player="'+ player +'"][game="'+ game +'"]').attr('active','1')
    d3.select('section.game-body[player="'+ player +'"][game="'+ game +'"]').style('display','block')
}

d3.selectAll('.player-tabs button')
    .on('click', function() {
        let curPlayer = d3.select(this).attr('player')
        let curGame = d3.select(this).attr('game')
        if (d3.select(this).attr('playable')== "1"){
            activatePlayerTab(curPlayer, curGame)
        }
    })

// for all buttons classed 'return-to-image-nav' return to main nav screen and makePlayable any nav-sections the button indicates
d3.selectAll('.return-to-image-nav').on('click',function(){
    console.log('hi')
    hideOverlays();
    d3.select('#image-nav').style('display','block')
    d3.selectAll('#main-games-nav div.nav-div[current="1"]').attr('current','0')
    d3.selectAll('#main-games-nav div.nav-div[current="0"] img.nav-img').attr('src',"nav-page-lost-round.png")

    d3.selectAll('section.game').style('display','none')
    let makePlayable = d3.select(this).attr('make-playable')
    if(makePlayable){
        d3.selectAll('section#image-nav div.nav-div[game="'+ makePlayable +'"]').attr('playable',"1").attr('current','1')
        d3.selectAll('section#image-nav div.nav-div[game="'+ makePlayable +'"] img').attr('src', 'nav-page-main-img.png')
    }
})

// for all nav div's go to appropriate game if playable="1"
d3.selectAll('div.nav-div')
    .on('click',function(){
        let curGame = d3.select(this).attr('game')
        if(d3.select(this).attr('playable') == '1') {
            d3.select('#image-nav').style('display','none')
            d3.select('section.game[game="'+curGame+ '"]').style('display','block')
        }
    })

d3.selectAll('div.interaction-response')
    .on('click',function(){
        const responseDiv = d3.select(this);
        responseDiv.classed('expand', !responseDiv.classed('expand'));
    })

d3.select('body')
    .on('keydown',function(e){
        if(e.key == 'Enter') {
            document.activeElement.click();
        }
    })

/******************************/
/*** START GAME INTERACTION ***/
/******************************/

d3.select('button#get-started').on('click',hideOverlays)


/******************************/
/*** EARN GAME INTERACTIONS ***/
/******************************/

function adjustOwedBar(pct, player){
    d3.select('section.game-body[game="earn"][player="' + player + '"] .results span.inner-bar').style('width', pct + '%')
    d3.select('section.game-body[game="earn"][player="' + player + '"] .results span.annotation')
        .html(Math.round(pct) + '% of pay')
} 

const controlsEarnCeo = d3.select("section.game-body[game='earn'][player='ceo']")
const earnSliderCeo  = controlsEarnCeo.select('.controls input#salary-stock')

earnSliderCeo.on('input', function() {
    let curValue = d3.select(this).property('value')
    controlsEarnCeo.select('label div.in-stock-options').html('$' + curValue + (curValue>0 ? ' Million' : ' ') + '<br />in stock options')
    controlsEarnCeo.select('label div.in-salary').html('$' + (50 - curValue) + (curValue<50 ? ' Million' : ' ') + '<br />in salary')
    adjustOwedBar((50-curValue)*2*0.35, 'ceo')
    if(curValue == 50){
        d3.select('section.game-body[player="ceo"][game="earn"]').call(animateInteractionResponse)
        d3.select('button[game="earn"][player="nurse"]').attr('playable','1')
        d3.select('button[game="earn"][player="nurse"]').call(removeTooltip)    
    }
})

const controlsEarnNurse = d3.select("section.game-body[game='earn'][player='nurse']")
const earnSliderNurse  = controlsEarnNurse.select(' .controls input#salary-stock-nurse')

earnSliderNurse.on('input', function() {
    let targetValue = d3.select(this).property('value')
    let curValue = d3.min([targetValue, 5])    
    d3.select(this).property('value', curValue)
    controlsEarnNurse.select('label div.in-stock-options').html('$' + curValue + (curValue>0 ? 'K' : ' ') + '<br />in stock options')
    controlsEarnNurse.select('label div.in-salary').html('$' + (70 - curValue) + (curValue<70 ? 'K' : ' ') + '<br />in salary')
    adjustOwedBar(18 * (70-curValue)/70, 'nurse')
    
    if(curValue >= 5){
        d3.select('section.game-body[player="nurse"][game="earn"]').call(animateInteractionResponse)
    }
})

d3.selectAll('section.game-body[player="ceo"][game="earn"] .interaction-response button')
    .on('click', ()=>{
        activatePlayerTab('nurse', 'earn')
    })


/*******************************/
/*** SPEND GAME INTERACTIONS ***/
/*******************************/

function adjustOwedBarSpend(pct, player){
    d3.select('section.game-body[game="spend"][player="' + player + '"] .results span.inner-bar')
        .transition().style('width', pct + '%')
    d3.select('section.game-body[game="spend"][player="' + player + '"] .results span.annotation')
        .html(Math.round(pct) + '% of investment gains')
} 

const controlsInputCeo = d3.select("section.game-body[game='spend'][player='ceo']")
const spendInputCeo  = controlsInputCeo.select('.controls .spend-toggle input#spend-input')
d3.select('section.game-body[game="spend"][player="ceo"] .results span.inner-bar')
    .style('width','20%') // even though it's in the css, initiating this here makes the transition smooth
spendInputCeo.on('input', function() {
    let curValue = d3.select(this).property('value')
    adjustOwedBarSpend((1-curValue)*20, 'ceo')

    if(curValue == 1){
        d3.select('section.game-body[player="ceo"][game="spend"]').call(animateInteractionResponse)
        d3.select('button[game="spend"][player="nurse"]').attr('playable','1')
        d3.select('button[game="spend"][player="nurse"]').call(removeTooltip)    
    }
})

const controlsInputNurse = d3.select("section.game-body[game='spend'][player='nurse']")
const spendInputNurse = controlsInputNurse.select('.controls .spend-toggle input#spend-input')
d3.select('section.game-body[game="spend"][player="ceo"] .results span.inner-bar')
.style('width','20%') // even though it's in the css, initiating this here makes the transition smooth
spendInputNurse.on('input', function() {
    let targetValue = d3.select(this).property('value');
    let curValue = 0
    d3.select(this).property('value', curValue)

    if(targetValue == 1){
        d3.select('section.game-body[player="nurse"][game="spend"]').call(animateInteractionResponse)
    }
})

d3.selectAll('section.game-body[player="ceo"][game="spend"] .interaction-response button')
    .on('click', ()=>{
        activatePlayerTab('nurse', 'spend')
    })


/*******************************/
/*** FILE TAXES INTERACTIONS ***/
/*******************************/

let incomeBarPct = 98
let expenseBarPct = 28
function getProfit(){
    return 2*(incomeBarPct-expenseBarPct)
}
const svg = d3.select('section.game-body[game="file-taxes"][player="ceo"] .controls svg')
function updateSvg(btn){
    svg.select('rect#income').transition().duration(1200).attr('width', incomeBarPct+'%')
    svg.select('rect#expense').transition().duration(1200).attr('width', expenseBarPct+'%')
    svg.select('text#profit-text').text( '$' + getProfit() + (getProfit()>0 ? 'M': '') +' in taxable profit')
        .transition().duration(1200).attr('x',incomeBarPct + "%")
    svg.select('line#profit').transition().duration(1200).attr('x1', expenseBarPct+'%').attr('x2', incomeBarPct+'%')
    // let incomeLineMid = expenseBarPct + (incomeBarPct-expenseBarPct)/2;
    svg.select('line#profit-inner-tab').transition().duration(1200).attr('x1', expenseBarPct+'%').attr('x2', expenseBarPct+'%')
    svg.select('line#profit-outer-tab').transition().duration(1200).attr('x1', incomeBarPct+'%').attr('x2', incomeBarPct+'%')
        .on('end', ()=>{
            fileTaxesInteractionResponseCeo(btn)
        })
} 
function fileTaxesInteractionResponseCeo(btn){
    let curGame = d3.select('section.game-body[player="ceo"][game="file-taxes"]')
    if(btn == 'reset'){
        curGame.select('.interaction-response').style('visibility','hidden')
        curGame.select('.interaction-response h2').text('Good Start!').style('visibility','hidden')
        curGame.selectAll('.interaction-response p').style('display','none')
        curGame.select('.interaction-response button').style('display','none')
    } else {
        curGame.selectAll('.interaction-response p').style('display','none')
        d3.select('#file-taxes-ceo-' + btn + '-p').style('display','block')
        if(getProfit()==0){
            d3.select('button[game="file-taxes"][player="nurse"]').attr('playable','1')
            d3.select('button[game="file-taxes"][player="nurse"]').call(removeTooltip)    
            curGame.select('#file-taxes-ceo-header').text('Goal achieved!')
            curGame.select('.interaction-response button').style('display','inline-block')
        }
        curGame.call(animateInteractionResponse)
    }
}

d3.select("#file-taxes-ceo-income-btn")
    .on('click', ()=> {
        incomeBarPct = 63;
        updateSvg('income')
    })
d3.select("#file-taxes-ceo-expense-btn")
    .on('click', ()=> {
        expenseBarPct = 63;
        updateSvg('expense') 
    })
d3.select("#file-taxes-ceo-reset")
    .on('click', ()=> {
        incomeBarPct = 98
        expenseBarPct = 28
        profit = getProfit()
        updateSvg('reset') 

    })
d3.selectAll('section.game-body[player="ceo"][game="file-taxes"] .interaction-response button')
    .on('click', ()=>{
        activatePlayerTab('nurse', 'file-taxes')
    })

function fileTaxesInteractionResponseNurse(btn){
    let curGame = d3.select('section.game-body[player="nurse"][game="file-taxes"]')
    curGame.selectAll('.interaction-response p').style('display','none')
    d3.select('#file-taxes-nurse-' + btn + '-p').style('display','block')
    if(incomeClicked & expenseClicked){
        curGame.select('.interaction-response button').style('display','inline-block')
    }
    curGame.call(animateInteractionResponse)
}
let incomeClicked = 0;
let expenseClicked = 0;
d3.select("#file-taxes-nurse-income-btn")
    .on('click', ()=> {
        incomeClicked = 1;
        fileTaxesInteractionResponseNurse('income')
    })
d3.select("#file-taxes-nurse-expense-btn")
    .on('click', ()=> {
        expenseClicked = 1;
        fileTaxesInteractionResponseNurse('expense') 
    })

d3.select('#continue-to-break-cycle')
    .on('click', ()=> {
        d3.select('#break-the-cycle')
            .style('display','flex')
        hideOverlays();
        d3.selectAll('#main-games-nav div.nav-div[current="1"]').attr('current','0')
        d3.selectAll('#main-games-nav div.nav-div[current="0"] img.nav-img').attr('src',"nav-page-lost-round.png")
    
        d3.select('#image-nav').style('display','block')
        d3.selectAll('section.game').style('display','none')        
    })


/*****************************/
/****** BREAK THE CYCLE ******/
/*****************************/
d3.select('#break-the-cycle button')
    .on('click', () => {
        d3.select('#image-nav').style('display','none')
        d3.selectAll('section.game[game="break-the-cycle"').style('display','block')        
    })


/****************/
/*** TOOLTIPS ***/
/****************/

let tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

function showTooltip(selection, curText){ 
    selection
        .on('mouseover', function(event) {
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            tooltip.html(curText);
        })
        .on('mousemove', function(event) {
            let rect = d3.select('.tooltip').node().getBoundingClientRect();
            tooltip
                .style('left', `${event.pageX - rect.width/2}px`)
                .style('top', `${event.pageY - rect.height - 10}px`);
        })
        .on('mouseout', function(d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0);
        })
}
function removeTooltip(selection){ 
    selection
        .on('mouseover', () => {})
        .on('mousemove',  () => {})
        .on('mouseout',  () => {})
}

d3.select('#salary-game-hint').call(showTooltip, tooltipTexts.salaryGameHint)
d3.select('#salary-game-hint-nurse').call(showTooltip, tooltipTexts.salaryGameHintNurse)
d3.select('#future-taxes-hint').call(showTooltip, tooltipTexts.futureTaxes)
d3.select('button[player="nurse"][game="earn"]').call(showTooltip, tooltipTexts.nurseTab)
d3.select('#spend-game-hint').call(showTooltip, tooltipTexts.spendGameHint)
d3.select('#file-taxes-game-hint').call(showTooltip, tooltipTexts.fileTaxesGameHint)
d3.select('svg[game="file-taxes"]').call(showTooltip, tooltipTexts.fileTaxesSvgGameHint)