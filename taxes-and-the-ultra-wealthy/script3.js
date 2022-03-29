// to test any rounds d3.selectAll('.nav-div').attr('playable',1)



const tooltipTexts = {
    salaryGameHint: "A large salary is taxed at a pretty high rate, but stock options aren't taxed until they're used. <strong>Slide the slider all the way to the other end to see what happens</strong>",
    futureTaxes: "This is showing taxes owed in the current year. As we'll soon see, the ultra wealthy can find other ways to avoid taxes when they can choose their timing.",
    nurseTab: "Slide the slider all the way to the other end before moving on to The Nurse" ,
    spendGameHint: "When you sell a stock or other investment you have to pay Capital Gains taxes. These taxes are lower than income taxes, but if you never sell at all you don't owe taxes on your investment gains."
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
    d3.select('#image-nav').style('display','flex')
    d3.selectAll('section.game').style('display','none')
    let makePlayable = d3.select(this).attr('make-playable')
    if(makePlayable){
        d3.selectAll('section#image-nav div[game="'+ makePlayable +'"]').attr('playable',"1")
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
            d3.select('#earn-nurse-tab').attr('playable','1')
            d3.select('#earn-nurse-tab').call(removeTooltip)    
        }
    })

const controlsEarnNurse = d3.select("section.game-body[game='earn'][player='nurse']")
const earnSliderNurse  = controlsEarnNurse.select(' .controls input#salary-stock-nurse')

earnSliderNurse.on('input', function() {
        let targetValue = d3.select(this).property('value')
        let curValue = d3.min([targetValue, 15])    
        d3.select(this).property('value', curValue)
        controlsEarnNurse.select('label div.in-stock-options').html('$' + curValue + (curValue>0 ? 'K' : ' ') + '<br />in stock options')
        controlsEarnNurse.select('label div.in-salary').html('$' + (90 - curValue) + (curValue<90 ? 'K' : ' ') + '<br />in salary')
        adjustOwedBar(18 * (90-curValue)/90, 'nurse')
        
        if(curValue >= 15){
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
        console.log('hi')
        let curValue = d3.select(this).property('value')
        adjustOwedBarSpend((1-curValue)*20, 'ceo')

        if(curValue == 1){
            d3.select('section.game-body[player="ceo"][game="spend"]').call(animateInteractionResponse)
            d3.select('#spend-nurse-tab').attr('playable','1')
            d3.select('#spend-nurse-tab').call(removeTooltip)    
        }
    })

const controlsInputNurse = d3.select("section.game-body[game='spend'][player='nurse']")
const spendInputNurse  = controlsInputNurse.select('.controls .spend-toggle input#spend-input')
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

d3.selectAll('section.game-body[player="ceo"][game="spend"] .interaction-response button')
    .on('click', ()=>{
        activatePlayerTab('nurse', 'spend')
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
d3.select('#future-taxes-hint').call(showTooltip, tooltipTexts.futureTaxes)
d3.select('#earn-nurse-tab').call(showTooltip, tooltipTexts.nurseTab)
d3.select('#spend-game-hint').call(showTooltip, tooltipTexts.spendGameHint)