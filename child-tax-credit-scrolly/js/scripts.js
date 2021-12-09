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
const height = width * 0.6;
// d3.select('.map-step:first-of-type').style('margin-top', -Math.round(height) + 'px') // trying to raise first map step so it wasn't below the map, but this raised it too much.

const colorScale = d3.scaleSequential()
.interpolator(d3.interpolateLab('rgb(234,28,36)', "black"))
.domain([20.5,0]); // hard-coded max

const bgColor = "#005680" ;//"#222"

function initMap(d) {
	const shapesWithData = d.shapesWithData;
	const usMesh = d.usMesh;
	const projection = d3.geoAlbersUsa()
		.fitSize([width*mapScale, height*mapScale], usMesh)

	const legendSvg = d3.select('#childPovertyMap')
		.append("svg").attr("viewBox", [0, 0, width, 200]).style('background-color', bgColor);
	legendSvg.append('text').text('PERCENT OF CHILDREN IN POVERTY').attr('y',50).attr('x',width/2)
		.attr("text-anchor","middle").attr("font-size","1.5em").attr("fill","white").attr("font-weight","bold")
	const povertyRates = [0, 5, 10, 15, 20];
	legendSvg.append('g').selectAll('rect').data(povertyRates).join('rect')
		.attr('x', (d,i) => width / 2 +  width / 13 * (i + 0.5 - povertyRates.length/2)  - width / 60)
		.attr('y', 80)
		.attr('width', width / 40).attr('height', width / 40)
		.attr("fill",d=> colorScale(d))
	legendSvg.append('g').selectAll('text').data(povertyRates).join('text')
		.text(d=> d + "%")
		.attr('x', (d,i) => width / 2 +  width / 13 * (i + 0.5 - povertyRates.length/2) )
		.attr('y', 140)
		.attr("fill","white").attr("font-weight","bold")
		.attr("font-size","1.3em")
		.attr("text-anchor","middle")


	const svg = d3.select('#childPovertyMap')
		.append("svg").attr("viewBox", [0, 0, width, height]).style('background-color', bgColor);

	const clipPath = svg.append('clipPath').attr('id', "myClip")
		//.append('rect').attr('x',0).attr('y',0).attr('width','100%')
		.append('rect').attr('x',0).attr('y',0).attr('height','100%')

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
		.attr('x1', width).attr('x2', width).attr('y1', 0).attr('y2', height)
		.attr('stroke','white').attr('stroke-width','3px').attr('opacity',0)

	Stickyfill.add(d3.select('.sticky').node());

	enterView({
		selector: mapStep.nodes(),
		offset: 0.0,
		enter: el => {
			const index = +d3.select(el).attr('data-index');
			updateMap(index);
		},
		progress: function(el, progress) {
			if (d3.select(el).attr('show-map') == "1"){ // I manually added this attribute to the text step I want to transition the map
				//d3.select('#map-intro').style('opacity', 1-progress)
				console.log(d3.min([1, progress*2]));
				d3.select('#childPovertyMap').style('opacity', d3.min([1, progress*2]));
			}
			if (d3.select(el).attr('progress-map-step') == "1"){ // I manually added this attribute to the text step I want to transition the map
				progressMap(progress, clipPath, clipPathLine, svgMapBefore);
			}
		}
	});
}
function progressMap(progress,clipPath, clipPathLine, svgMapBefore) {
	clipPathLine.attr('x1', width - (width * progress)).attr('x2',  width - (width * progress))
		.attr('opacity', progress < 0.9 ? 10 * progress : progress > 0.9 ? 1 - 10 * (progress - 0.9)  : 1)
	clipPath.attr('width', (1 - progress)*100 + '%')
	svgMapBefore.attr("clip-path", "url(#myClip)")
}

function updateMap(index) {
	const sel = map.select(`[data-index='${index}']`);
	const width = sel.attr('data-width');
	mapStep.classed('is-active', (d, i) => i === index);
	map.select('.bar-inner').style('width', width);
}



initChart();

//https://data-storytelling.s3.us-west-1.amazonaws.com/dataForExport.json
// d3.json("/child-tax-credit-scrolly/data/dataForExport.json") // pre-processed in https://observablehq.com/d/f29d297e1299dbac
d3.json('https://raw.githubusercontent.com/MoveOnOrg/data-storytelling/main/child-tax-credit-scrolly/data/dataForExport.json')
	.then( function (d) {
		initMap(d);
});
