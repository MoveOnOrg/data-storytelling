const smallerScreen = window.innerWidth < 775;
const width = d3.min([window.innerWidth, 1175])
d3.select('.wrapper').style('width', d3.min([width, window.innerHeight / 0.7]) + 'px')
const mapHeight = width*0.7 // 6/5 //* 610 / 975;
const mapScreenHeightProp = mapHeight/window.innerWidth;
const mapTopVh  = !smallerScreen ? .1 :
 ((window.innerHeight * 0.5) - (mapHeight * 0.5))/ window.innerHeight;
const mapTopToScreenBottomVh = 1 - mapTopVh;



let texts;
if (new URLSearchParams(window.location.search).get('version')== 'moms') {
  texts = [
    {top:  10/610, right: 50/975, html: "<h3><span>Stripping 100K MoveOn members<br />of our reproductive freedom</span></h3>"},
    {top:  110/610, right: 70/975, html: "<b>10K</b> of us are <b class='smaller'>22 or younger<b>"},
    {top:  110/610, right: 70/975, html: "<b>45K</b> of us are <b class='smaller'>parents<b>"},
    {top:  110/610, right: 70/975, html: "<b>60K</b> of us are <b class='smaller'>BIPOC<b>"},
    {top:  110/610, right: 70/975, html:"<b>1500</b> of us have <b class='smaller'>graduate degrees<b>" },
    {top:  110/610, right: 70/975, html: "<b>30K</b> of us did not finish schooling beyond <b class='smaller'>high school<b>"},
  ]
} else {
  texts = [
    {top:  10/610, right: 50/975, html: "<h3><span>Stripping 2 million Georgia voters<br />of our reproductive freedom</span></h3>"},
    {top:  110/610, right: 70/975, html: "<b>500K</b> of us are <b class='smaller'>22 or younger<b>"},
    {top:  110/610, right: 70/975, html: "<b>800K</b> of us are <b class='smaller'>parents<b>"},
    {top:  110/610, right: 70/975, html: "<b>990K</b> of us are <b class='smaller'>BIPOC<b>"},
    {top:  110/610, right: 70/975, html:"<b>30K</b> of us have <b class='smaller'>graduate degrees<b>" },
    {top:  110/610, right: 70/975, html: "<b>230K</b> of us did not finish schooling beyond <b class='smaller'>high school<b>"},
  ]    
} 
//console.log(texts)
// array of text initial positions. On smaller screens each text gets window height. On larger screens, each gets height - ending position 
const initialOffsets = d3.cumsum(texts.map((d,i)=> (smallerScreen ? mapTopToScreenBottomVh  : (i == 0 ? 1.1/mapTopToScreenBottomVh : (1 -  ( d.top /* * mapScreenHeightProp */))))))
const maxOffset = d3.max(initialOffsets)
//console.log(mapTopToScreenBottomVh, initialOffsets, maxOffset)

d3.select('.wrapper').style('top', 100*mapTopVh + 'vh')
d3.select('#full-height-for-scroll').style('height', 100*(1 + maxOffset) + "vh")

const svg = d3.select('.wrapper>svg')
if(!smallerScreen){svg.style('width', '70%')}
const mapG = svg.append('g').attr('fill','none').attr('stroke','#000')
    .attr('stroke-linejoin','round').attr('stroke-linecap','round')
const bubblesG = svg.append('g').attr('fill','#A52A2A66').attr('id', 'bubbles-g')
const sparklesG = svg.append('g')
const textsDiv = d3.select('.wrapper>div#scrolling-texts')
const weVote = d3.select('.wrapper>#we-vote') 

textsDiv.selectAll('div').data(texts).join('div')
    .attr('class','map-text').html(d=> d.html) 
    .style('top',(d,i)=> smallerScreen ? (100 * initialOffsets[i] + "%")  : (100 * (d.top + initialOffsets[i]) ) + '%')
    .style('left',d=> smallerScreen ? "5%" : 100*d.left + '%').style('right',d=> d.right * 100  + '%')
    .style('text-align', (d,i)=> i==0 ? 'right' : 'left')
    .style('padding', '4px')
    .style('border-radius', '4px')

let bubbles; 
d3.json('abortion-data-we-are-the-GA.json')
    .then( function (d) {
    d3.select('.scroll-arrow').style('opacity', 1)
    const GAPath = d.GAPath;
    const GACountiesPath = d.GACountiesPath; 
    bubbles = d.bubbles; 
    //console.log('bubbles.length', bubbles.length)
    mapG.append('path')
        .attr('fill','#eee')
        .attr('stroke','#aaa')
        .attr("stroke-width","0.5")
        .attr("d", GAPath)
    mapG.append('path')
        .attr("stroke-width","0.5")
        .attr('stroke','#ccc')
        .attr("d", GACountiesPath)
    bubblesG.selectAll('circle')
        .data(bubbles)
        .join('circle')
        .attr("transform", d=> `translate(${d.coords})`)
        .attr("r", d =>  d.radius * 0.75)
        //.attr('fill-opacity',0.4) // now assigning this as part of fill color with 66 at end of hex
        .attr('stroke','white')
        .attr('stroke-width',0.5)
        .attr('stroke-opacity',1)
    });

let isSparkling = 0; 
sparkleMap = function() {
    isSparkling = 1;
    if(bubbles != undefined ){

        /* this version I tried after the initial sparkle version did a throb effect... but I didn't really like it either 
        bubblesG.transition()
            .attr('fill', '#A52A2ACC')
            .on('end', () => {
                bubblesG.transition()
                    .attr('fill', '#A52A2A66')
                    .on('end', () => {isSparkling = 0 })
                })
        return ;
        */ 
        const curBubbles = d3.shuffle(bubbles)
        const curSparkles = sparklesG.selectAll('circle')
            .data(curBubbles)
            .join('circle')
            .attr("r", 2)
            .attr('fill','yellow')
            .attr("transform", d=> `translate(${d.coords})`)
            .attr('opacity', 0)
        curSparkles.transition()
            .duration(200)
            .delay((d,i) => i* 4)
            .attr('opacity',1)
        curSparkles.transition()
            .delay((d,i) => 200 + i* 4)
            .duration(800)
            .attr('opacity',0)
            .on('end', () => {isSparkling = 0})
    }
}
//svg.on('click', sparkleMap)

let goingBlue = false;
let hideArrow = false
const finishTextsFrame = smallerScreen ? 0.97: 0.85;
const goingBlueFrame = smallerScreen ? 0.98 : 0.86;

function getScrollProportion() {
    var h = document.documentElement, 
        b = document.body,
        st = 'scrollTop',
        sh = 'scrollHeight';
    let scrollProp = (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight);
    update(scrollProp)
    requestAnimationFrame(getScrollProportion)
    return scrollProp; 
}
update = function(frame) { 
    
    if(frame>0 & !hideArrow) {
        hideArrow = true; 
        d3.select('.scroll-arrow').transition().style('opacity',0)
        d3.select('#scrolling-texts').classed('inactive',false)
    }
    
    d3.select('footer .annotation').classed('inactive', frame < 0.1 || frame > goingBlueFrame)
   /* if (frame > 0.1) { 
        d3.select('footer')
            .text('Courts currently blocking bans in AZ, IN, OH & SC')
            .style('font-size', '.7rem')
    } else { 
        d3.select('footer')
            .html('<div class="annotation">Courts currently blocking bans in AZ, IN, OH & SC</div><br/>Paid for by MoveOn.org Political Action, <a href="https://front.moveon.org/about-moveon-political-action/">pol.moveon.org</a>, not authorized by any candidate or candidate\'s committee.')
            .style('font-size', '12pt')
    }*/


    bubblesG.classed('active', frame > 0.01)

    let textFrame = d3.min([1,frame/finishTextsFrame]);
    textsDiv
        .selectAll('div')
        .style('top',(d,i)=> (
                d3.max([(smallerScreen ? -3 : d.top ), 
                        (smallerScreen ? 0 : d.top ) + initialOffsets[i] - (textFrame* maxOffset) ]
                    ) * 100 + '%'))
        .classed('inactive',(d,i)=> (initialOffsets[i] <= (textFrame * maxOffset) ))
        .each(function(d,i) {
            if (i> 0 & !d3.select(this).classed("alreadySparkled") & !isSparkling){
                if ( (smallerScreen ? 0 : d.top ) + initialOffsets[i] - (textFrame* maxOffset) < (140/610) ){
                    d3.select(this).classed('alreadySparkled',true)
                    sparkleMap(); 
                }
            } else if(i> 0 & d3.select(this).classed("alreadySparkled")){
                if ( (smallerScreen ? 0 : d.top ) + initialOffsets[i] - (textFrame* maxOffset) > .95 ){
                    d3.select(this).classed('alreadySparkled',false)
                }
            }
        })

    d3.select(".map-text#banned-abortion") 
        .style('top',(d,i)=> ( - (textFrame* maxOffset) 
                    ) * 100 + '%')
    
    if(frame> goingBlueFrame && goingBlue == false){ 
    goingBlue = true; 
    textsDiv.transition().duration(smallerScreen ? 300 : 1200).style('opacity',0)
        .on('end', () => {
        weVote.transition().duration(1200).style('opacity',1)
        bubblesG.transition().delay(500).duration(1200).attr('fill','#00abff66') 
            .on('end', () => {
                weVote.select('a.btn').transition().style('opacity',1)
            })
    })
    } else if (frame <= goingBlueFrame && goingBlue == true ) { 
    goingBlue = false; 
    weVote.transition().duration(1200).style('opacity',0)
        .on('end', () => {
        textsDiv.transition().duration(1200).style('opacity',1)  
        bubblesG.transition().duration(1200).attr('fill','#A52A2A66') 
        })
    }
}
if (new URLSearchParams(window.location.search).get('version')== 'hide-all-texts'){
    d3.selectAll('h1').style('opacity',0)
    d3.selectAll('div').style('opacity',0)
    d3.select('#we-vote').style('display','none')
    d3.select('div.scroll-arrow').style('display','none')
    d3.select('div.wrapper').style('opacity',1)
}

requestAnimationFrame(getScrollProportion)
