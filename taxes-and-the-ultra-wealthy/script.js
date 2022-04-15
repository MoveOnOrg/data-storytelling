// to test any rounds d3.selectAll('.nav-div').attr('playable',1)

const tooltipTexts = {
    propublicaSource: "Based on ProPublica's report on wealth and taxes of the 25 richest Americans (2014-2018). Click the \"get started\" button below to learn more.",
    salaryGameHint: "A large salary is taxed at a pretty high rate, but investment gains may never be taxed. <strong>Slide the slider all the way to the other end to see what happens</strong>.",
    futureTaxes: "This is showing taxes owed in the current year. As we'll soon see, the ultra wealthy can find other ways to avoid taxes when they can choose their timing.",
    nurseTab: "Slide the slider all the way to the other end before moving on to The Nurse" ,
    spendGameHint: "When you sell a stock or other investments you have to pay capital gains taxes. If you don't sell your investments, you don't owe any taxes at all.",
    fileTaxesGameHint: "Check these checkboxes and see how to chart changes",
    fileTaxesSvgGameHint: "Check the checkboxes above to see how this chart changes"
}


/***********************************************************/
/*** GENERAL HELPER FUNCTIONS AND UNIVERSAL INTERACTIONS ***/
/***********************************************************/

function focusOn(focusString){
    d3.select(focusString).node().focus()
}
// currently only overlay is opening screen, but these helper functions should help if we want to put them back elsewhere. 
function showOverlay(selectString, focusString) {
    d3.select('#overlay-background').style('display','block')
    d3.select(selectString).style('display','block')
    focusOn(focusString)
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
    hideOverlays();
    console.log('about to focus on current="1"')
    d3.select('#image-nav').style('display','block')
    focusOn('.nav-div[current="1"]') // add backup for break the cycle when none are current
    d3.selectAll('section.game').style('display','none')
})

d3.select('img.faceoff')
    .on('mouseover', function(){d3.select(this).attr('src', 'faceoff.png')})
    .on('mouseleave', function(){d3.select(this).attr('src', 'faceoff2.png')})

// for all nav div's go to appropriate game if playable="1"
d3.selectAll('div.nav-div')
    .on('click',function(){
        let curGame = d3.select(this).attr('game')
        if(d3.select(this).attr('playable') == '1') {
            hideOverlays()
            d3.select('#image-nav').style('display','none')
            d3.select('section.game[game="'+curGame+ '"]').style('display','block')
            focusOn('.player-tabs button[game="'+ curGame +'"][player="ceo"]')
        }
    })

d3.selectAll('div.interaction-response')
    .on('click',function(){
        const responseDiv = d3.select(this);
        responseDiv.classed('shrink', !responseDiv.classed('shrink'));
    })

/* d3.select('button.help')
    .on('click', function() {
        showOverlay('section.overlay#nav-help', '')
    })
*/ 
d3.select('body')
    .on('keydown',function(e){
        if(e.key == 'Enter') {
            document.activeElement.click();
        }
    })

d3.select('section.overlay#share .share-block button.close')
    .on('click', hideOverlays)


/******************************/
/*** START GAME INTERACTION ***/
/******************************/

d3.selectAll('button#get-started').on('click',hideOverlays)

d3.select('button#unlock-all-challenges').on('click',() => {
    d3.selectAll('.nav-div').attr('playable',1)
    hideOverlays()
})


/******************************/
/*** EARN GAME INTERACTIONS ***/
/******************************/

function adjustOwedBar(pct, player){
    d3.select('section.game-body[game="earn"][player="' + player + '"] .results span.inner-bar').style('width', pct + '%')
    d3.select('section.game-body[game="earn"][player="' + player + '"] .results span.annotation')
        .html(Math.round(pct) + '% of ' + (player == 'nurse' ? 'income' : 'income'))
} 

const controlsEarnCeo = d3.select("section.game-body[game='earn'][player='ceo']")
const earnSliderCeo  = controlsEarnCeo.select('.controls input#salary-stock')
let sliderTooltip = d3.select('.slider-tooltip')
let sliderRect;
let sliderOuterRect ; 

earnSliderCeo.on('input', function(event) {
    sliderRect = earnSliderCeo.node().getBoundingClientRect(); 
    sliderOuterRect = controlsEarnCeo.select('div.salary-slider').node().getBoundingClientRect(); 

    let curValue = d3.select(this).property('value')
    controlsEarnCeo.select('label div.in-stock-options').html(2* curValue + '% in<br />investment gains')
    controlsEarnCeo.select('label div.in-salary').html(2*(50 - curValue) + '% in<br />salary')
    adjustOwedBar((50-curValue)*2*0.35, 'ceo')
    if(curValue < 20){
        d3.select('.slider-tooltip').style('opacity',0)
    } else if(curValue >= 20 & curValue<50){
        sliderTooltip.text(curValue > 35 ? 'Almost there!' : 'Keep going...').style('opacity',1)
        let sliderTooltipRect = sliderTooltip.node().getBoundingClientRect();
        sliderTooltip
            .style('top', -(sliderTooltipRect.height + 20) + 'px')
            .style('left', (9 * (25-curValue)/25) // to deal with 18px width of thumb 
                       + (sliderOuterRect.width * 0.1) // to deal with 10% margin-left
                       + (sliderRect.width * (curValue/50) ) // to deal with overall position along slider
                       - (sliderTooltipRect.width/2) // to deal with width of tooltip itself 
                       + 'px')
    } else if(curValue == 50){
        d3.select('.slider-tooltip').style('opacity',0)
        d3.select('section.game-body[player="ceo"][game="earn"]').call(animateInteractionResponse)
        d3.select('button[game="earn"][player="nurse"]').attr('playable','1')
        d3.select('button[game="earn"][player="nurse"]').call(removeTooltip)    
    }
})

const controlsEarnNurse = d3.select("section.game-body[game='earn'][player='nurse']")
const earnSliderNurse  = controlsEarnNurse.select(' .controls input#salary-stock-nurse')

earnSliderNurse.on('input', function() {
    let targetValue = d3.select(this).property('value')
    let curValue = d3.min([targetValue, 8])    
    d3.select(this).property('value', curValue)
    controlsEarnNurse.select('label div.in-stock-options').html(curValue + '% in<br />investment gains')
    controlsEarnNurse.select('label div.in-salary').html((100 - curValue) + '% in<br />salary')
    adjustOwedBar(18 * (100-curValue)/100, 'nurse')
    
    if(curValue >= 8){
        d3.select('section.game-body[player="nurse"][game="earn"]').call(animateInteractionResponse)
        d3.selectAll('#main-games-nav div.nav-div[current="1"]').attr('current','0')
        d3.selectAll('#main-games-nav div.nav-div[game="earn"]').attr('current','0')
        d3.selectAll('#main-games-nav div.nav-div[current="0"] img.nav-img').attr('src',"nav-page-lost-round.png")
        d3.selectAll('#main-games-nav div.nav-div[game="spend"]').attr('current','1').attr('playable',"1")
            .select('img').attr('src', 'nav-page-main-img.png')

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

const spendCeo = d3.select("section.game-body[game='spend'][player='ceo']")
const spendInputCeo  = spendCeo.select('.controls .spend-toggle input#spend-input')
d3.select('section.game-body[game="spend"][player="ceo"] .results span.inner-bar')
    .style('width','20%') // even though it's in the css, initiating this here makes the transition smooth
spendInputCeo.on('input', function() {
    let isChecked = d3.select(this).property('checked')
    adjustOwedBarSpend((isChecked?0:1)*20, 'ceo')

    if(isChecked){
        d3.select('button[game="spend"][player="nurse"]').attr('playable','1')
        d3.select('button[game="spend"][player="nurse"]').call(removeTooltip) 
        spendCeo.call(animateInteractionResponse)
    }
})

const spendNurse = d3.select("section.game-body[game='spend'][player='nurse']")
const spendInputNurse = spendNurse.select('.controls .spend-toggle input#spend-input-nurse')
d3.select('section.game-body[game="spend"][player="ceo"] .results span.inner-bar')
.style('width','20%') // even though it's in the css, initiating this here makes the transition smooth
spendInputNurse.on('input', function() {
    let triedToCheck = d3.select(this).property('checked');
    d3.select(this).property('checked', false)

    if(triedToCheck){
        spendNurse.call(animateInteractionResponse)
        d3.selectAll('#main-games-nav div.nav-div[current="1"]').attr('current','0')
        d3.selectAll('#main-games-nav div.nav-div[game="spend"]').attr('current','0')
        d3.selectAll('#main-games-nav div.nav-div[current="0"] img.nav-img').attr('src',"nav-page-lost-round.png")
        d3.selectAll('#main-games-nav div.nav-div[game="file-taxes"]')
            .attr('current','1').attr('playable',"1")
            .select('img').attr('src', 'nav-page-main-img.png')
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
    if(btn == 'reset' || getProfit() == 140 ){
        curGame.select('.interaction-response').style('visibility','hidden')
        curGame.select('.interaction-response h2').text('Good Start!').style('visibility','hidden')
        curGame.selectAll('.interaction-response p').style('display','none')
        curGame.select('.interaction-response button').style('display','none')
        curGame.selectAll('.controls input[type="checkbox"]').property('checked', false)
    } else {
        curGame.selectAll('.interaction-response p').style('display','none')
        if(getProfit()==0){
            d3.select('#file-taxes-ceo-' + btn + '-p').style('display','block')
            d3.select('button[game="file-taxes"][player="nurse"]').attr('playable','1')
            curGame.select('#file-taxes-ceo-header').text('Goal achieved!')
            curGame.select('.interaction-response button').style('display','inline-block')
        } else {
            curGame.select('#file-taxes-ceo-header').text('Good start!')
            if(incomeBarPct < 98){
                d3.select('#file-taxes-ceo-income-p').style('display','block')
            } else if (expenseBarPct > 28){
                d3.select('#file-taxes-ceo-expense-p').style('display','block')
            }
        }
        curGame.call(animateInteractionResponse)
    }
}

d3.select("#file-taxes-ceo-income-btn")
    .on('click', function() {
        incomeBarPct = d3.select(this).property('checked') ? 63 : 98;
        updateSvg('income')
    })
d3.select("#file-taxes-ceo-expense-btn")
    .on('click', function() {
        expenseBarPct = d3.select(this).property('checked') ? 63 : 28;
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
        d3.select('#break-the-cycle').style('display','flex')
        d3.selectAll('#main-games-nav div.nav-div:not([current="0"])').attr('current','0')
        d3.selectAll('#main-games-nav div.nav-div[current="0"] img.nav-img').attr('src',"nav-page-lost-round.png")

    }
    curGame.call(animateInteractionResponse)
}
let incomeClicked = 0;
let expenseClicked = 0;
d3.select("#file-taxes-nurse-income-btn")
    .on('click', function() {
        incomeClicked = 1;
        d3.select(this).property('disabled', true).property('checked', false)
        d3.select('label[for="file-taxes-nurse-income-btn"]').style('text-decoration', 'line-through')
        fileTaxesInteractionResponseNurse('income')
    })
d3.select("#file-taxes-nurse-expense-btn")
    .on('click', function() {
        expenseClicked = 1;
        d3.select(this).property('disabled', true).property('checked', false)
        d3.select('label[for="file-taxes-nurse-expense-btn"]').style('text-decoration', 'line-through')
        fileTaxesInteractionResponseNurse('expense') 
    })

d3.select('#continue-to-break-cycle')
    .on('click', ()=> {
        hideOverlays();
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

// d3.selectAll('#rigged-system-cta button')
//     .on('click', () => {
//         alert("Congrats! You've reached the end what we've built so far. Currently working on these CTA's")
//     })

d3.select('button#share-page')
    .on('click', function() {
        showOverlay('section.overlay#share', '.share-item-facebook')
    })


/****************/
/*** TOOLTIPS ***/
/****************/

let tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);
let tooltipText = tooltip.append('div').attr('class', 'tooltip-text')
let tooltipPointer = tooltip.append('div').attr('class', 'tooltip-pointer')

function showTooltip(selection, curText){ 
    selection.classed('has-tooltip', true)
    selection
        .on('mouseover', function(event) {
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            tooltipText.html(curText);
        })
        .on('mousemove', function(event) {
            let rect = d3.select('.tooltip').node().getBoundingClientRect();
            let left = event.pageX - rect.width/2; 
            let pointerLeft = '50%';  
            if(left < 0 ){
                left = 0; 
                pointerLeft = event.pageX+'px';
            } else if((left + rect.width) > window.innerWidth){
                left = window.innerWidth - rect.width;
                pointerLeft = (event.pageX - left) + 'px';
            }
            tooltip
                .style('left', `${left}px`)
                .style('top', `${event.pageY - rect.height - 10}px`);
            tooltipPointer.style('left',pointerLeft)
        })
        .on('mouseout', function(d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0);
        })
        .on('keydown', function(event) {
            tooltipText.html(curText);
            let rect = d3.select('.tooltip').node().getBoundingClientRect();
            if (event.keyCode == 13){ // enter key
                let boundingRect = selection.node().getBoundingClientRect() ;
                tooltip
                    .style('left', `${document.body.scrollLeft + boundingRect.x + boundingRect.width/2 -rect.width/2}px`)
                    .style('top', `${document.body.scrollTop + (boundingRect.y - boundingRect.height/2) - rect.height}px`)
                    .transition().duration(200).style('opacity',1);
            } else if (event.keyCode == 27) { // escape key
                tooltip.transition().duration(200).style('opacity',0);
            }
        })
        .on('focusout', function() {
            tooltip.transition().duration(200).style('opacity',0);
        })
}
// this is to get the tooltip to go away with a click anywhere else on mobile. 
d3.select('html').on("click", function(event) {
    if(!(d3.select(event.target).classed("has-tooltip")) & tooltip.style('opacity') == 1){
        console.log('hiding tooltip')
        tooltip.transition().duration(200).style('opacity',0);
    }
});

function removeTooltip(selection){ 
    selection.classed('has-tooltip', false)
    selection
        .on('mouseover', () => {})
        .on('mousemove',  () => {})
        .on('mouseout',  () => {})
}

d3.select('#intro .source>span').call(showTooltip, tooltipTexts.propublicaSource)
d3.select('#salary-game-hint').call(showTooltip, tooltipTexts.salaryGameHint)
d3.select('#future-taxes-hint').call(showTooltip, tooltipTexts.futureTaxes)
d3.select('button[player="nurse"][game="earn"]').call(showTooltip, tooltipTexts.nurseTab)
d3.select('#spend-game-hint').call(showTooltip, tooltipTexts.spendGameHint)
d3.select('#file-taxes-game-hint').call(showTooltip, tooltipTexts.fileTaxesGameHint)
d3.select('svg[game="file-taxes"]').call(showTooltip, tooltipTexts.fileTaxesSvgGameHint)


/*******************/
/*** GA Tracking ***/
/*******************/
d3.selectAll('button').on('click.track', function(event) {
    let id = d3.select(this).attr('id');
    gaTrack(id);
    console.log(`${id} clicked`);
});


function gaTrack(id) {
    //google analytics code goes here
}
