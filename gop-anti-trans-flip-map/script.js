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
        const radius = (1-spacing/2) * hexContainerWidth / 21; 
        const initialHexTranslate = [ radius * (1+spacing), radius * Math.sin( 60 * Math.PI/180) * (1+spacing) ]
        const rowHeight = radius * ( 1 + spacing ) + ( radius * Math.cos( 60 * Math.PI/180))
        const hexColumnWidth = 2 * radius * ( 1 + (spacing / 2) ) * Math.sin( 60 * Math.PI/180)

    d3.select('div.maps-wrapper')
      .style('height', hexContainerHeight * 2.3 + 'px')
      .style('width', hexContainerWidth + 'px' )
    d3.selectAll('svg').attr('width', hexContainerWidth + 'px').attr('height', hexContainerHeight + 'px')
    
    const headlines = [
        [{field: 'gov', match: 'R', headline: 'Republican-Controlled States'},
        {field: 'antiTrans', match: 1, headline: 'Passed Anti-Trans Legislation In 2023'}],
        [{field: 'gov', match: 'D', headline: 'Democrat-Controlled States'},
        {field: 'discrimProtection', match: 1, headline: 'Banned Anti-Trans Discrimination'}]
    ]
    const svg1 = d3.select('svg#map1')
    //const svgLabel = svg1

    d3.selectAll('.maps-wrapper>svg').data(headlines)
        .join('svg')
        .each(function(d,i){
            d3.select(this)
                .select('text.headline').attr('x', '50%').attr('y', '8%')
                .text(headlines[0][i].headline)
            d3.select(this)
                .selectAll('g').data(dataCombined).join('g')
                .attr('transform', d0 => 'translate(' +
                    (initialHexTranslate[0] + (d0.col * hexColumnWidth) + ((d0.row % 2 == 1) ? (hexColumnWidth/2) : 0))
                  + ', ' +
                    (initialHexTranslate[1] + d0.row * rowHeight)
                  + ')')
                .each(function(d1){
                    d3.select(this).append('path').attr('d', d3.line()(hexagon(radius)))
                        .attr('fill', d1[headlines[0][i].field] == headlines[0][i].match ? '#ea1c24' : "#DDD")
                    d3.select(this).append('text').attr('class','state-label').attr('fill','white')
                        .text(d1.statecode)  
                })
        })

    function getScrollProportion() {
        var h = document.documentElement, 
            b = document.body,
            st = 'scrollTop',
            sh = 'scrollHeight';
        let scrollProp = (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight);
        update()
        requestAnimationFrame(getScrollProportion)
        scrollP = scrollProp; 
    }
    let showRepublicans = 0
    let midTransition = false
    let prevScrollP = 0
    let scrollP = 0; 

    function flipMap(){
        showRepublicans = (showRepublicans + 1) % 2
        d3.selectAll('svg')
          .each(function(_,i){
              d3.select(this).selectAll('g>path')
              .transition()
              .delay(d=> (d.row + d.col) * 30)
              .style('transform', 'rotate3d(0,1,0, ' + (showRepublicans ? '180deg' : '0deg') +  ')')
              .style('fill',(d) => (d[headlines[showRepublicans][i].field] == headlines[showRepublicans][i].match ? (showRepublicans ? '#00abff': '#ea1c24' ) : "#CCC"))
              d3.selectAll('svg>text.headline').transition().duration(400)
                  .style('opacity',0)
                  .on('end', function(d,i) {
                      d3.select(this).text(headlines[showRepublicans][i].headline)
                        .transition().duration(400)
                        .style('opacity',1)
                        .on('end', () => {midTransition = false; prevScrollP = scrollP })
                  })
          })
    }
    d3.select('button#flip').on('click', function() {
        flipMap()
    })

    update = function() {
        if(!midTransition){
            //console.log('scrollP', scrollP,'prevScrollP', prevScrollP, 'showRepublicans', showRepublicans)
            if((scrollP>prevScrollP | scrollP >=.99) & !showRepublicans){
                midTransition = true
                flipMap()
            } else if ((scrollP<prevScrollP | scrollP ==0) & showRepublicans){
                midTransition = true
                flipMap()
            } else {
                prevScrollP = scrollP; // in the other if cases this happens at end of transition
            }
        }

    }
//    let mapState = 'Republican'

    /*update = function(scrollP) { 
        if(!midTransition){// | scrollP== 0 | scrollP == 1){
            if(scrollP>prevScrollP & mapState == 'Republican'){
                midTransition = true;
                flipMap()
                d3.select('body')
                    .transition().style('background-color', 'black')
                    .on('end', ()=>  {
                        midTransition = false
                        mapState = 'Democratic'
                    })
            } else if (scrollP<prevScrollP & mapState == 'Democratic'){
                midTransition = true;
                flipMap()

                d3.select('body')
                    .transition().style('background-color', 'white')
                    .on('end', ()=>  {
                        midTransition = false
                        mapState = 'Republican'
                    })
            }    
            prevScrollP = scrollP

        }
    }*/
    getScrollProportion()
  
  })