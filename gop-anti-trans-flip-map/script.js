function hexagon(r=1, translateXY= [0,0], vertical = true) { 
    return [0, 60, 120, 180, 240, 300, 360].map(d=> {
        const coords = [translateXY[0] + r* Math.cos(d * Math.PI/180), translateXY[1] + r * Math.sin(d * Math.PI/180)]
        return vertical ? coords.reverse() : coords
    })
}
    
const smallerScreen = window.innerWidth < 975;
d3.json('dataCombined.json')
    .then( function (dataCombined) {
        const hexContainerWidth = d3.min([window.innerWidth, window.innerHeight / (12/9)]);
        const hexContainerHeight = hexContainerWidth * 6/10 ; 
    const spacing = 0.15;
    const radius = (1-spacing/2) * 
      hexContainerWidth / 21; 
    const container = d3.select('div.wrapper')
      .style('position','relative')
      .style('height', hexContainerHeight * 2.3 + 'px')
      .style('width', hexContainerWidth + 'px' )
    
    const svg = container.append('svg').attr('width', hexContainerWidth + 'px').attr('height', hexContainerHeight + 'px')
      //.style('border', '3px solid yellow')
    const svgLabel = svg.append('text').attr('x', '50%').attr('y', '8%').style('font-size', smallerScreen ? '18px' : '24px').attr('text-anchor', 'middle').text("Republican-Controlled States")
    const initialHexTranslate = [ radius * (1+spacing), radius * Math.sin( 60 * Math.PI/180) * (1+spacing) ]
    const rowHeight = radius * ( 1 + spacing ) + ( radius * Math.cos( 60 * Math.PI/180))
    const hexColumnWidth = 2 * radius * ( 1 + (spacing / 2) ) * Math.sin( 60 * Math.PI/180)
    svg.selectAll('g').data(dataCombined)
      .join('g')
      .attr('transform', d => 'translate(' +
              (initialHexTranslate[0] + (d.col * hexColumnWidth) + ((d.row % 2 == 1) ? (hexColumnWidth/2) : 0))
            + ', ' +
              (initialHexTranslate[1] + d.row * rowHeight)
            + ')')
      .each(function(d,i){
        d3.select(this).append('path')
          .attr('d', d3.line()(hexagon(radius)))
          .attr('fill', (d,i) => d.gov == 'R' ? '#ea1c24' : "#DDD")
        d3.select(this).append('text').text(d.statecode)
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'central')
        .attr('fill','white')
      })
  
      container.append('hr')
      const svg2 = container.append('svg').attr('width', hexContainerWidth + 'px').attr('height', hexContainerHeight + 'px')
        //.style('border', '3px solid yellow')
    const svg2Label = svg2.append('text').attr('x', '50%').attr('y', '8%').style('font-size', smallerScreen ? '18px' : '24px').attr('text-anchor', 'middle').text("Passed Anti-Trans Legislation In 2023")
    svg2.selectAll('g').data(dataCombined)
      .join('g')
      .attr('transform', d => 'translate(' +
              (initialHexTranslate[0] + (d.col * hexColumnWidth) + ((d.row % 2 == 1) ? (hexColumnWidth/2) : 0))
            + ', ' +
              (initialHexTranslate[1] + d.row * rowHeight)
            + ')')
      .each(function(d,i){
        d3.select(this).append('path')
          .attr('d', d3.line()(hexagon(radius)))
          .attr('fill', (d,i) => d.antiTrans == 1 ? '#ea1c24' : "#DDD")
        d3.select(this).append('text').text(d.statecode)
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'central')
        .attr('fill','white')
      })
    let showingRepublicans = true
    d3.select('button#flip').on('click', function() {
      showingRepublicans = !showingRepublicans
      svg.selectAll('g>path').transition()
        .delay(d=> (d.row + d.col) * 30)
        .style('transform', 'rotate3d(0,1,0, ' + (showingRepublicans ? '0deg' : '180deg') +  ')')
        .style('fill',(d,i) => 
              showingRepublicans ?
               (d.gov == 'R' ? '#ea1c24' : "#CCC") :
               (d.gov == 'D' ? '#00abff' : "#CCC")
              )
      .on('end', function(){
        svgLabel.transition().duration(300)
          .style('opacity',0)
          .on('end', function() {
            d3.select(this).text(showingRepublicans ? 'Republican-Controlled States' : 'Democrat-Controlled States')
              .transition().duration(300)
              .style('opacity',1)
          })
      })
      svg2.selectAll('g>path').transition()
        .delay(d=> (d.row + d.col) * 30)
        .style('transform', 'rotate3d(0,1,0, ' + (showingRepublicans ? '0deg' : '180deg') +  ')')
        .style('fill',(d,i) => 
              showingRepublicans ?
               (d.antiTrans == 1 ? '#ea1c24' : "#DDD") :
               (d.discrimProtection == 1 ? '#00abff' : "#CCC")
              )
      .on('end', function(){
        svg2Label.transition().duration(300)
          .style('opacity',0)
          .on('end', function() {
            d3.select(this).text(showingRepublicans ? 'Passed Anti-Trans Legislation In 2023' : 'Banned Anti-Trans Discrimination')
              .transition().duration(300)
              .style('opacity',1)
          })
      })
      
    })
  
  })