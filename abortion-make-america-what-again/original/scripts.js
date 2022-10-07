function getScrollProportion() {
    var h = document.documentElement, 
        b = document.body,
        st = 'scrollTop',
        sh = 'scrollHeight';
    let scrollProp = (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight);
    let imgMargins = scrollFunction(scrollProp);
    d3.select('#timeline').style('margin-left',imgMargins[0] +'px')
    d3.select('#timeline').style('margin-top',imgMargins[1] + 'px' )
    requestAnimationFrame(getScrollProportion)
    return scrollProp; 
}
scrollFunction = function(x) { 
    const cutPoints = [0.05, 0.45, 0.55]
    const xRange = [-3700, 1000]
    const yRange = [300, -300]
    let scaleX, scaleY; 
    if (x < cutPoints[0]){ 
        scaleX = d3.scaleLinear().domain([0.0,cutPoints[0]]).range([xRange[0], xRange[0]])
        scaleY = d3.scaleLinear().domain([0.0,cutPoints[0]]).range([yRange[0], yRange[0]])
    } else if(x < cutPoints[1]) { 
       scaleX = d3.scaleLinear().domain([cutPoints[0],cutPoints[1]]).range([xRange[0], xRange[1]])
       scaleY = d3.scaleLinear().domain([cutPoints[0],cutPoints[1]]).range([yRange[0], yRange[0]])
    } else if (x< cutPoints[2]) { 
       scaleX = d3.scaleLinear().domain([cutPoints[1],cutPoints[2]]).range([xRange[1], xRange[1]])
       scaleY = d3.scaleLinear().domain([cutPoints[1],cutPoints[2]]).range([yRange[0], yRange[1]])
    } else { 
       scaleX = d3.scaleLinear().domain([cutPoints[2],1]).range([xRange[1], xRange[0]-1000])
       scaleY = d3.scaleLinear().domain([cutPoints[2],1]).range([yRange[1], yRange[1]])
    }
  
    return [scaleX(x), scaleY(x)]
  } 

requestAnimationFrame(getScrollProportion)
