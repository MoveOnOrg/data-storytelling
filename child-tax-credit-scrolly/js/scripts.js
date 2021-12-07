/**** CHART FUNCTIONS *****/
const chart = d3.select('#chart');
const chartStep = chart.selectAll('.step');

function updateChart(index) {
	const sel = chart.select(`[data-index='${index}']`);
	const width = sel.attr('data-width');
	chartStep.classed('is-active', (d, i) => i === index);
	chart.select('.bar-inner').style('width', width);
}

function initChart() {
	Stickyfill.add(d3.select('.sticky').node());

	enterView({
		selector: chartStep.nodes(),
		offset: 0.5,
		enter: el => {
			const index = +d3.select(el).attr('data-index');
			updateChart(index);
		},
		exit: el => {
			let index = +d3.select(el).attr('data-index');
			index = Math.max(0, index - 1);
			updateChart(index);
		}
	});
}

/**** MAP FUNCTIONS *****/
const map = d3.select('#map');
const mapStep = map.selectAll('.step');

function initMap() {
	Stickyfill.add(d3.select('.sticky').node());

	enterView({
		selector: mapStep.nodes(),
		offset: 0.5,
		enter: el => {
			const index = +d3.select(el).attr('data-index');
			updateMap(index);
		},
		exit: el => {
			let index = +d3.select(el).attr('data-index');
			index = Math.max(0, index - 1);
			updateMap(index);
		}
	});
}

function updateMap(index) {
	const sel = map.select(`[data-index='${index}']`);
	const width = sel.attr('data-width');
	mapStep.classed('is-active', (d, i) => i === index);
	map.select('.bar-inner').style('width', width);
}



initChart();
initMap();
