/**** CHART FUNCTIONS *****/
const chart = d3.select('#chart');
const chartStep = chart.selectAll('.step');
const bar = chart.selectAll('.bar');
let resetTimeout;

function updateChart(index) {
	clearTimeout(resetTimeout);

	const sel = chart.select(`[data-index='${index}']`);
	const width = sel.attr('data-width');
	const barChart = d3.select('.bar-chart');
	const chartRow = barChart.select(`.chart-row:nth-child(${index+1})`);

	//bar.classed('is-active', (d, i) => i === index);
	chartStep.classed('is-active', (d, i) => i === index);
	barChart.style('opacity', 1);
	chartRow.style('opacity', 1);
	chartRow.select('.bar-fill').style('width', width);
	chartRow.select('.value').style('opacity', 1);
}

function initChart() {
	Stickyfill.add(chart.select('.sticky').node());

	enterView({
		selector: chartStep.nodes(),
		offset: 0.2,
		enter: el => {
			const index = +d3.select(el).attr('data-index');
			updateChart(index);
		},
		exit: el => {
			let index = +d3.select(el).attr('data-index');
			index = Math.max(0, index - 1);
			if (index<1) resetChart();
		}
	});
}

function resetChart() {
	const barChart = d3.select('.bar-chart');
	barChart.style('opacity', 0);
	resetTimeout = setTimeout(function() {
		const bar = barChart.selectAll('.chart-row');
		bar.style('opacity', 0);
		bar.select('.bar-fill').style('width', 0);
		bar.select('.value').style('opacity', 0);
	}, 700);
}


/**** MAP FUNCTIONS *****/
const map = d3.select('#map');
const mapStep = map.selectAll('.map-step');

const mapScale = .93;
const width = map.node().offsetWidth;
const height = width * 0.7;

const colorScale = d3.scaleSequential()
.interpolator(d3.interpolateLab('rgb(234,28,36)', "black"))
.domain([20.5,0]); // hard-coded max 

const bgColor = "#005680" ;//"#222"

function initMap(d) {
	const shapesWithData = d.shapesWithData;
	const usMesh = d.usMesh; 
	const projection = d3.geoAlbersUsa()
		.fitSize([width*mapScale, height*mapScale], usMesh) 
	
	const svg = d3.select('#childPovertyMap')
		.append("svg").attr("viewBox", [0, 0, width, height]).style('background-color', bgColor);

	const clipPath = svg.append('clipPath').attr('id', "myClip")
		.append('rect').attr('x',0).attr('y',0).attr('width','100%')

	const svgMapAfter = svg.append('g').selectAll( "path" )
		.data( shapesWithData )
		.enter()
		.append( "path" )
		.attr("class", 'poly')
		.attr("id", d => 'poly' + d.id)
		.attr( "fill", d => colorScale(d.pct_after))
		.attr( "stroke", "#DDD")
		.attr( "d", d3.geoPath().projection(projection) )

	const svgMapBefore = svg.append('g').selectAll( "path" )
		.data( shapesWithData )
		.enter()
		.append( "path" )
		.attr("class", 'poly')
		.attr("id", d => 'poly' + d.id)
		.attr( "fill", d => colorScale(d.pct_before))
		.attr( "stroke", "#DDD")
		.attr( "d", d3.geoPath().projection(projection) )

	const clipPathLine = svg.append('line')
		.attr('x1', 0).attr('x2', width).attr('y1', height).attr('y2', height)
		.attr('stroke','white').attr('stroke-width','3px')
	
	Stickyfill.add(d3.select('.sticky').node());

	enterView({
		selector: mapStep.nodes(),
		offset: 0.0,
		enter: el => {
			const index = +d3.select(el).attr('data-index');
			updateMap(index);
		},
		progress: function(el, progress) {
			if (d3.select(el).attr('progress-map-step') == "1"){ // I manually added this attribute to the text step I want to transition the map
				progressMap(progress, clipPath, clipPathLine, svgMapBefore);
			}
		}
	});
}
function progressMap(progress,clipPath, clipPathLine, svgMapBefore) {
	clipPathLine.attr('y1', height - (height * progress)).attr('y2',  height - (height * progress))
	clipPath.attr('height', (1 - progress)*100 + '%')
	svgMapBefore.attr("clip-path", "url(#myClip)")
}

function updateMap(index) {
	const sel = map.select(`[data-index='${index}']`);
	const width = sel.attr('data-width');
	mapStep.classed('is-active', (d, i) => i === index);
	map.select('.bar-inner').style('width', width);
}



initChart();

d3.json("/child-tax-credit-scrolly/data/dataForExport.json") // pre-processed in https://observablehq.com/d/f29d297e1299dbac
	.then( function (d) {
		initMap(d);
});
