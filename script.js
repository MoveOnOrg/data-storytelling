const smallerScreen = window.innerWidth < 975;

const width = d3.min([window.innerWidth, 975])
const mapHeight = width * 610 / 975;
const mapScreenHeightProp = mapHeight/window.innerWidth;
const mapTopVh  = ((window.innerHeight * 0.5) - (mapHeight * 0.5))/ window.innerHeight;
const mapTopToScreenBottomVh = 1 - mapTopVh;

const texts = [
    {top:  10/610, right: 50/975, html: "<b class='larger'>We are the 1 million MoveOn Members</b><br />of reproductive age <b>whose right to abortion<br /> has been stripped</b> this summer"},
    {top:  90/610, left: 50/975, html: "<b>100K</b> of us are under <b class='smaller'>22 or younger<b>"},
    {top:  175/610, left: 700/975, html: "<b>450K</b> of us are <b class='smaller'>parents<b>"},
    {top:  350/610, left: 730/975, html: "<b>300K</b> of us are <b class='smaller'>BIPOC<b>"},
    {top:  195/610, left: 265/975, html:"<b>20K</b> of us have <b class='smaller'>graduate degrees<b>" },
    {top:  290/610, left: 10/975, html: "<b>180K</b> of us did not finish schooling <b class='smaller'>beyond high school.<b>"},
]
console.log(texts)
// array of text initial positions. On smaller screens each text gets window height. On larger screens, each gets height - ending position 
const initialOffsets = d3.cumsum(texts.map((d,i)=> (smallerScreen ? mapTopToScreenBottomVh  : (i == 0 ? 1.1/mapTopToScreenBottomVh : (1 -  ( d.top * mapScreenHeightProp ))))))
const maxOffset = d3.max(initialOffsets)
console.log(mapTopToScreenBottomVh, initialOffsets, maxOffset)

const bubblesIn = function(x) { 
    const [start,end] = [0.1,0.2]
    if (x < start) return 0 
    if (x > end) return 1 
    let scale = d3.scaleLinear().domain([start,end]).range([0,1])
    return scale(x) 
}

d3.select('.wrapper').style('top', 100*mapTopVh + 'vh')

d3.select('#full-height-for-scroll').style('height', 100*(1 + maxOffset) + "vh")

const svg = d3.select('.wrapper>svg')
const mapG = svg.append('g').attr('fill','none').attr('stroke','#000')
    .attr('stroke-linejoin','round').attr('stroke-linecap','round')
const bubblesG = svg.append('g').attr('fill','brown')
const textsDiv = d3.select('.wrapper>div#scrolling-texts')
const weVote = d3.select('.wrapper>#we-vote') 

textsDiv.selectAll('div').data(texts).join('div')
    .attr('class','map-text').html(d=> d.html) 
    .style('top',(d,i)=> smallerScreen ? (100 * initialOffsets[i] + "%")  : (100 * (d.top + initialOffsets[i]) ) + '%')
    .style('left',d=> smallerScreen ? "5%" : 100*d.left + '%').style('right',d=> d.right * 100  + '%')
    .style('text-align', (d,i)=> i==0 ? 'right' : 'left')
    .style('color', (d,i)=> i==0 ? 'black' : 'brown')
    .style('background-color', (d,i)=> i==0 ? 'revert' : '#FFFFFFAA')
    .style('padding', '4px')
    .style('border-radius', '4px')

d3.json('abortion-data-we-are-the.json')
    .then( function (d) {
    d3.select('.scroll-arrow').style('opacity', 1)
    const nationPath = d.nationPath;
    const statesPath = d.statesPath; 
    const bubbles = d.bubbles; 
    mapG.append('path')
        .attr('fill','#eee')
        .attr('stroke','#aaa')
        .attr("stroke-width","0.5")
        .attr("d", nationPath)
    mapG.append('path')
        .attr("stroke-width","0.5")
        .attr('stroke','#ccc')
        .attr("d", statesPath)
    bubblesG.selectAll('circle')
        .data(bubbles)
        .join('circle')
        .attr("transform", d=> `translate(${d.coords})`)
        .attr("r", d => d.radius)
        .attr('fill-opacity',0.4)
        .attr('stroke','white')
        .attr('stroke-width',0.5)
        .attr('stroke-opacity',1)
    });

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
    }
    

    bubblesG.attr('opacity',bubblesIn(frame))

    let textFrame = d3.min([1,frame/finishTextsFrame]);
    textsDiv
        .selectAll('div')
        .style('top',(d,i)=> (
                d3.max([(smallerScreen ? -3 : d.top ), 
                        (smallerScreen ? 0 : d.top ) + initialOffsets[i] - (textFrame* maxOffset) ]
                    ) * 100 + '%'))
        .style('background-color', (d,i)=> (i==0 | initialOffsets[i] <= (textFrame * maxOffset) ? 'revert' : '#FFFFFFAA' ) )
    
    d3.select(".map-text#banned-abortion") 
        .style('top',(d,i)=> ( - (textFrame* maxOffset) 
                    ) * 100 + '%')
    


    if(frame> goingBlueFrame && goingBlue == false){ 
    goingBlue = true; 
    textsDiv.transition().duration(smallerScreen ? 300 : 1200).style('opacity',0)
        .on('end', () => {
        weVote.transition().duration(1200).style('opacity',1)
        bubblesG.transition().delay(500).duration(1200).attr('fill','#00abff') 
            .on('end', () => {
                weVote.select('button').transition().style('opacity',1)
            })
    })
    } else if (frame <= goingBlueFrame && goingBlue == true ) { 
    goingBlue = false; 
    weVote.transition().duration(1200).style('opacity',0)
        .on('end', () => {
        textsDiv.transition().duration(1200).style('opacity',1)  
        bubblesG.transition().duration(1200).attr('fill','brown') 
        })
    }
}

requestAnimationFrame(getScrollProportion)
