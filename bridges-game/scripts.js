mapboxgl.accessToken = 'pk.eyJ1IjoiZXJpa2F3ZWkiLCJhIjoiY2pqb2kzeXJoMmM1eDNsc280YnBub2d6aCJ9.DapwlemDz4dhkDIG7sNdwQ';
//const mapboxStyle = 'styles/tech-securemoveonorg/ckyujrsmv000r14lbcrbe604b';
const mapboxStyle = 'styles/tech-securemoveonorg/ckz7znk7t000815pipzqa20ng';
const frames = 400;
const bridgePopup = new mapboxgl.Popup({
		closeButton: false,
		closeOnClick: false
	});
let startLocation = '';
let endLocation = '';
let destinationOptions = [];
let fly1, fly2, fly3 = false;

let routeGeojson, nearbyBridges, routeSpacedAlongFrames, routeSimplified, routeBezier, vehicleIcon, startingPointSampleBridge;

const stepCorrect = document.getElementById('step-correct');
const vehicles = document.querySelectorAll('input[type=radio][name="vehicle"]');
const selectedVehicle = document.getElementById('selected-vehicle-holder');
const stepVehicle = document.getElementById('step-vehicle');
const stepStart = document.getElementById('step-start');
const titleText = document.querySelector('#overlay h1');
const stepText1 = document.getElementById('stepText1');
const stepSampleBridge = document.getElementById('step-sample-bridge');
const stepDestination = document.getElementById('step-destination');
const btnPickDest = document.getElementById('btn-pick-dest');
const btnGo = document.getElementById('btn-go');
const btnConfirm = document.getElementById('btn-confirm');
const stepDetails = document.getElementById('step-details');
const stepPlayGame = document.getElementById('step-play-game');
const btnDeny = document.getElementById('btn-deny');

const destinations = [{"location":"Blue Ox Music Festival, Eau Claire, Wisconsin","lat":"44.78786668","lon":"-91.58057528","type":"Festival","inMilwaukee":"0"},{"location":"Cranberry Festival, Warrens, WI","lat":"44.13143685","lon":"-90.50164398","type":"Festival","inMilwaukee":"0"},{"location":"State Capitol , Madison, WI","lat":"43.07400405","lon":"-89.38512782","type":"Landmark","inMilwaukee":"0"},{"location":"Bayfield WI to Kayak the Apostle Islands","lat":"46.80806885","lon":"-90.81405375","type":"Outdoors","inMilwaukee":"0"},{"location":"Cave of the Mounds (west of Madison)","lat":"43.01680179","lon":"-89.81429772","type":"Outdoors","inMilwaukee":"0"},{"location":"Lake Minocqua - fishing, boating, etc","lat":"45.86445439","lon":"-89.70855847","type":"Outdoors","inMilwaukee":"0"},{"location":"Mississippi River Dinner Cruise in La Crosse","lat":"43.81792238","lon":"-91.2564382","type":"Outdoors","inMilwaukee":"0"},{"location":"Wisconsin Dells - “The Waterpark Capital of the World”","lat":"43.62780295","lon":"-89.77790092","type":"Outdoors","inMilwaukee":"0"},{"location":"Wisconsin's biggest waterfall in Pattison State Park","lat":"46.53719434","lon":"-92.1187448","type":"Outdoors","inMilwaukee":"0"},{"location":"Lambeau Field - Green Bay Packers","lat":"44.49924888","lon":"-88.05973531","type":"Sports","inMilwaukee":"0"},{"location":"Great Lakes Distillery, Milwaukee","lat":"43.02648595","lon":"-87.9187747","type":"Other","inMilwaukee":"1"},{"location":"Harley-Davidson Museum, Milwaukee","lat":"43.03135815","lon":"-87.91662288","type":"Other","inMilwaukee":"1"},{"location":"Milwaukee Art Museum","lat":"43.03987028","lon":"-87.89751278","type":"Other","inMilwaukee":"1"},{"location":"Milwaukee Zoo","lat":"43.03126493","lon":"-88.04098476","type":"Other","inMilwaukee":"1"},{"location":"Fiserv Forum - home to NBA Champion Milwaukee Bucks","lat":"43.04501176","lon":"-87.91750192","type":"Sports","inMilwaukee":"1"}];

const zoom = 4.4;
const center = [-89.35, 44.91]; // from turf centroid of WI state - adjusted a bit
const bounds = [
  [-92.889427,42.491592],
  [-86.82352,47.3]
];

//init map
const map = new mapboxgl.Map({
  container: document.getElementById('map'),
  style: `mapbox://${mapboxStyle}`,
  center: center,
  minZoom: 1,
  zoom: zoom,
  //maxBounds: bounds
});
map.scrollZoom.enable();

//init geocoder for user input start
const geocoder = new MapboxGeocoder({
	accessToken: mapboxgl.accessToken, 
	mapboxgl: mapboxgl, 
	marker: false, 
	placeholder: 'Search a Wisconsin Address or Place',
	bbox: [-92.889427,42.491592, -86.82352,47.077252], 
	proximity: {
		longitude: -89.384373,
		latitude: 43.0747
	},
});
	 
//add geocoder to intro screen
const geocoderInput = document.getElementById('geocoder');
geocoder.addTo(geocoderInput);

// set units for turf calculations to miles: 
const turfUnits = {units: "miles"};

map.on('load', () => {});


/**************************/
/** https://docs.mapbox.com/mapbox-gl-js/example/free-camera-path **/
/**************************/
function animatePath() {
	map.setPaintProperty(
		'route', 
		'line-opacity',.7);
	// this is the path the camera will look at
	const targetRoute = routeSimplified.geometry.coordinates;
	// this is the path the camera will move along
	//const cameraRoute = routes;

	const cameraRoute = routeBezier.geometry.coordinates;
	//const cameraRoute = simplifyRouteForCameraPanning(routes);//routes;

	// get the overall distance of each route so we can interpolate along them
	const routeDistance = turf.lineDistance(turf.lineString(targetRoute));
	const cameraRouteDistance = turf.lineDistance(
		turf.lineString(cameraRoute)
	);

	const animationDuration = 50 * routeDistance;
	const cameraAltitude = 65000; // 15000;

	 
	let start, requestAnimID;
	let frameCount = 0;
	let notSmallDevice = d3.select('body').node().getBoundingClientRect().width > 481;

	function frame(time) {
		frameCount++;
		if (!start) start = time;
		// phase determines how far through the animation we are
		const phase = (time - start) / animationDuration;

		// phase is normalized between 0 and 1
		// when the animation is finished, reset start to loop the animation
		if (phase > 1) {

			// not sure if we need this timeout? 
			setTimeout(() => {
				window.cancelAnimationFrame(requestAnimID);
				animationComplete();
			}, 1000);
		}
		 
		// use the phase to get a point that is the appropriate distance along the route
		// this approach syncs the camera and route positions ensuring they move
		// at roughly equal rates even if they don't contain the same number of points
		
		const alongRoute = turf.along(
			turf.lineString(targetRoute),
			routeDistance * phase
		).geometry.coordinates;
		 
		const alongCamera = turf.along(
			turf.lineString(cameraRoute),
			cameraRouteDistance * d3.max([0, phase])
		).geometry.coordinates;

		//get next point along route to calculate bearing for vehicle position
		const nextRoute = turf.along(
			turf.lineString(targetRoute),
			(routeDistance * phase)+1
		).geometry.coordinates;

		 /* if we want to have the camera following the car we can set something like this, with the camera position using "alongCamera" and the camera.lookAtPoint using the "alongCameraNext" 
		const alongCamera = turf.along(
			turf.lineString(cameraRoute),
			cameraRouteDistance * d3.max([0, phase - 0.25])
		).geometry.coordinates;

		const alongCameraNext = turf.along(
			turf.lineString(cameraRoute),
			cameraRouteDistance * d3.min([1,(phase + 0.05)])
		).geometry.coordinates;
		*/
		map.setPaintProperty(
			'bridges', 
			'circle-opacity',  
			['case',['<=', ['get','frame'],frames * (phase + 0.02)], 1, 0]
		);

/*
		console.log('targetRoute', targetRoute, 'phase, frames, rounded ph*f',phase, frames, Math.round(phase*frames))
		const alongRoute = targetRoute[Math.round(phase*frames)]
		const cameraRoute = targetRoute[Math.round(phase*frames)]	
*/	
		const camera = map.getFreeCameraOptions();
	 
		// set the position and altitude of the camera
		camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
			{
				lng: alongCamera[0],
				lat: alongCamera[1]
			},
			cameraAltitude
		);
		 
		// tell the camera to look at a point along the route
		// no longer telling the camera to look anywhere 
		camera.lookAtPoint({
			lng: alongCamera[0], // to follow the car:  alongCameraNext[0],
			lat: alongCamera[1] // to follow the car: alongCameraNext[1]
		});
		/**/  
		map.setFreeCameraOptions(camera);

		// moving bunch of this to every 10th frame since lots of lagging on mobile. 
		if ( notSmallDevice || ( frameCount % 10 == 0 ) ) { 
		// Update vehicle icon to a new position and bearing
			const vehicleData = {
				'type': 'FeatureCollection',
				'features': [
					{
						'type': 'Feature',
						'properties': {},
						'geometry': {
							'type': 'Point',
							'coordinates': [alongRoute[0], alongRoute[1]]
						}
					}
				]
			};
			vehicleData.features[0].properties.bearing = turf.bearing(turf.point(alongRoute),turf.point(nextRoute)) - 90; //adjust for our side-facing icon
			map.getSource('vehicle').setData(vehicleData);

			
			d3.select('#miles-traveled').text(Math.round(routeDistance * d3.min([1,phase])))
			d3.select('#bridges-passed').text(nearbyBridges.filter(d=> 
				d.closestPointOnDetailedRoute.properties.index <= frames*phase).length
			)
			d3.select('#daily-crossings').text(
				d3.format(".2s")(
					d3.sum(nearbyBridges
						.filter(d=> 
					d.closestPointOnDetailedRoute.properties.index <= frames*phase)
						.map(d=>d.avgDailyTraffic)
				))
			)
		}
		requestAnimID = window.requestAnimationFrame(frame);
	}
	 
	window.requestAnimationFrame(frame);
}

function animationComplete() {
	document.getElementById('popup').style.display = 'block';

	// assign bridgePopup, but don't add it to the map yet.
	/* bridgePopup = new mapboxgl.Popup({
		closeButton: false,
		closeOnClick: false
	});
*/
	// set it up to show bridge details on mouse hover or click
	map.on('mouseenter', 'bridges', (e) => {
	// Change the cursor style as a UI indicator.
	map.getCanvas().style.cursor = 'pointer';
	// Copy coordinates array.
	const coordinates = e.features[0].geometry.coordinates.slice();
	const description = '<strong>Average Daily Crossings</strong><p>' + d3.format(',')(e.features[0].properties.avgDailyTraffic) + '</p><strong>Year Build/Reconstructed</strong><p>' + e.features[0].properties.yearBuiltOrReconstructed + '</p>';
	
	// Ensure that if the map is zoomed out such that multiple
	// copies of the feature are visible, the popup appears
	// over the copy being pointed to.
	while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
	coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
	}
	
	// Populate the popup and set its coordinates
	// based on the feature found.
	bridgePopup.setLngLat(coordinates).setHTML(description).addTo(map);
	});
	
	map.on('mouseleave', 'bridges', () => {
		map.getCanvas().style.cursor = '';
		bridgePopup.remove();
	});

}

async function getRoute() {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${startLocation[0]},${startLocation[1]};${endLocation[0]},${endLocation[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}&overview=full`,
    { method: 'GET' }
  );
  const json = await query.json();
  const data = json.routes[0];
  const routeCoords = data.geometry.coordinates;

  routeSimplified = ({ type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: simplifyRouteForCameraPanning(routeCoords, 0.01)
	  }
	});

  const routeSuperSimplified = ({ type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: simplifyRouteForCameraPanning(routeCoords, 0.001)
	  }
	});
  routeBezier = turf.bezierSpline(routeSuperSimplified);

  routeGeojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: routeCoords
    }
  };

  routeSpacedAlongFrames = setRouteToNFrames(routeSimplified, frames); // instead of simplifying (routeGeojson);
  nearbyBridges = bridgesWithinMinMiles(bridges, 5, routeGeojson, routeSpacedAlongFrames); 

}


function startAnimation() {
	document.getElementById('overlay').style.display = 'none';
	  // if the route already exists on the map, we'll reset it using setData
  if (map.getSource('route')) {
    map.getSource('route').setData(routeGeojson);
  }
  // otherwise, we'll make a new request - but set opacity to 0. Will change when we start the animation. 
  else {
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: routeGeojson
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#00abff',
        'line-width': 5,
        'line-opacity': 0.0
      }
    });
  }

// add all the nearbyBridges with opacity = 0. Will update as we pass them 
  map.addSource('bridges', {
		type: 'geojson',
		data: {
			type: 'FeatureCollection',
			features: nearbyBridges.map((d,i)=> {
			return {
				type: 'Feature', 
				properties: {id: i, frame: d.closestPointOnDetailedRoute.properties.index, ...d},
				geometry: {
					type: 'Point',
					coordinates: d.coord
				}
			}
			})
		}

  })
  map.addLayer({
		id: 'bridges',
		type: 'circle',
		source: 'bridges',
		//'source-layer': 'bridgesSourceLayer',
		paint: {
			'circle-radius': 6,
			'circle-color': 'red',
			'circle-opacity': 0
		}
	});

	animatePath(); //getRoute();
}


// pick N destinations from all eligible destinations - ensuring that they are at least x distance from starting location, that not more than 1 is in Milwaukee and not more than 1 of the same type. 
function generateDestinationSet(dests, n) {
  let filteredDests = dests.slice().filter(d => turf.distance([d.lon, d.lat], startLocation, turfUnits) > 65) // 65 miles radius

  let primaryDestinations = [];
  let backupDestinations = [];
  let milwaukeeAdded = 0
  let destTypeAdded = new Map(filteredDests.map(d=> [d.type,0]));
  d3.shuffle(filteredDests.slice()).forEach( (d,i) => {
    if(milwaukeeAdded == 1 & d.inMilwaukee == '1'){
        backupDestinations.push(d) 
    } else if( destTypeAdded.get[d.type] ) {
        backupDestinations.push(d)
    } else { 
        primaryDestinations.push(d)
        milwaukeeAdded +=  +d.inMilwaukee; 
    }
    destTypeAdded.set(d.type, 1);
  })

  if(primaryDestinations.length < n) {
    return [...primaryDestinations , ...(backupDestinations.slice(0, n - primaryDestinations.length))]
  } else {
    return primaryDestinations.slice(0, n)
  }
}

// input route and N frames and output version of roote with points spaced evenly along n frames 
function setRouteToNFrames(route, n = 400) {
	const routeDistance = turf.length(route, turfUnits)
	return  {
	...route, 
	geometry: {type:"LineString", 
		coordinates : d3.range(n).map(d=> turf.along(route, routeDistance * d/n , turfUnits).geometry.coordinates)
		}
	}
}

// at the if they click the button to show all deficient bridges, run this to add them all. 
function addAllBridges() { 
	// add all the nearbyBridges with opacity = 0. Will update as we pass them 
  map.addLayer({
		id: 'allBridges',
		type: 'circle',
		source: {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: bridges.map((d,i)=> {
				return {
					type: 'Feature', 
					properties: {			
						avgDailyTraffic: d.avgDailyTraffic,
						yearBuiltOrReconstructed: d.year,
					},
					geometry: {
						type: 'Point',
						coordinates: [d.lon, d.lat]
					}
				}
				})
			}
		},
		paint: {
			'circle-radius': 5,
			'circle-color': 'red',
			'circle-opacity': 0.6
		}
	});

  map.on('mouseenter', 'allBridges', (e) => {
	// Change the cursor style as a UI indicator.
	map.getCanvas().style.cursor = 'pointer';
	// Copy coordinates array.
	const coordinates = e.features[0].geometry.coordinates.slice();
	const description = '<strong>Average Daily Crossings</strong><p>' + d3.format(',')(e.features[0].properties.avgDailyTraffic) + '</p><strong>Year Build/Reconstructed</strong><p>' + e.features[0].properties.yearBuiltOrReconstructed + '</p>';
	
	// Ensure that if the map is zoomed out such that multiple
	// copies of the feature are visible, the popup appears
	// over the copy being pointed to.
	while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
	coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
	}
	
	// Populate the popup and set its coordinates
	// based on the feature found.
	bridgePopup.setLngLat(coordinates).setHTML(description).addTo(map);
	});
	
	map.on('mouseleave', 'allBridges', () => {
		map.getCanvas().style.cursor = '';
		bridgePopup.remove();
	});
}

// grab bridges by proximity to starting point and average daily traffic.  
function bridgesFromStartingPoint(bridges, startingPoint){
  return bridges.map(d=> {
            let distance = turf.distance(startingPoint,  [d.lon, d.lat], turfUnits);
            return {...d,
  			   coord: [d.lon, d.lat] ,
               distance: distance,
               weightedValue: Math.sqrt(1/distance ) * Math.pow( d.avgDailyTraffic, 1/6) 
            }
  }).sort((a,b) => d3.descending(a.weightedValue, b.weightedValue))
}

// grab bridges within n miles of route and closest point on route to each bridge  
function bridgesWithinMinMiles(bridges, xMiles, route, routeSpacedAlongFrames) {
	return bridges.map(d => 
		({coord: [d.lon, d.lat], 
			avgDailyTraffic: d.avgDailyTraffic,
			yearBuiltOrReconstructed: d.year,
			distance: turf.pointToLineDistance([d.lon, d.lat],  route, turfUnits),
			closestPointOnDetailedRoute: turf.nearestPointOnLine(routeSpacedAlongFrames, [d.lon, d.lat], turfUnits)
		})
	).filter(d=> d.distance < xMiles)
}

// simplified route for camera to follow
function simplifyRouteForCameraPanning(route, smoothingQuantile = 0.35 ){
	 const routeGeojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: route
    }
  };
  let routeTopo = topojson.topology({ name: routeGeojson }); // convert to topojson
  let routePreSimplified = topojson.presimplify(routeTopo); // presimplify 
  let minWeight = topojson.quantile(routePreSimplified, smoothingQuantile); // get weight associated with quantile
  let routeSimplified = topojson.simplify(routePreSimplified, minWeight); // simplified topo
  let geojson = topojson.feature(routeSimplified, routeSimplified.objects.name); // convert back to geojson 
  return geojson.geometry.coordinates; // return geojson coordinates
}

/*
// set marker and fly to starting location 
function flyToLocation(coords, next, zoomLevel = 10.1) {
	fly1 = true;
	map.flyTo({
		center: coords,
		speed: 1.2,
		zoom: zoomLevel,
		// bearing: 0 // added this to try to repoint N after pointing at car along route, but didn't work.  
	});
	map.on('moveend', next)
}
*/

function flyToStartThenAddVehicle() {
	fly1 = true;
	map.flyTo({
		center: startLocation,
		speed: 1.2,
		zoom: 13,
	});
	map.on('moveend', ()=> {
		if(fly1){
			fly1=false
			stepCorrect.style.display = 'block';

			// adding vehicle
			if (!map.getSource('vehicle')) {
				map.addLayer({
					'id': 'vehicle',
					'source': {
						type: 'geojson',
						data: {
							type: 'FeatureCollection',
							features: [
							{
								type: 'Feature',
								properties: {},
								geometry: {
									type: 'Point',
									coordinates: startLocation
								}
							}]
						}
					},
					'type': 'symbol',
					'layout': {
						'icon-image': vehicleIcon,
						'icon-size': 0.25,
						'icon-rotate': ['get', 'bearing'],
						'icon-rotation-alignment': 'map',
						'icon-allow-overlap': true,
						'icon-ignore-placement': true
					}
				});
			}
		}
	})
}


function flyToSampleBridge() {
	fly2 = true;
	map.flyTo({
		center: startingPointSampleBridge.coord,
		speed: 1.2,
		zoom: 13,
	});
	map.on('moveend', ()=> {
		if(fly2){
		fly2=false;
		// adding sample bridge
			if (!map.getSource('sampleBridge')) {
				map.addLayer({
					'id': 'sampleBridge',
					'source': {
						type: 'geojson',
						data: {
							type: 'FeatureCollection',
							features: [
							{
								type: 'Feature',
								properties: {},
								geometry: {
									type: 'Point',
									coordinates: startingPointSampleBridge.coord
								}
							}]
						}
					},
					'type': 'circle',
					paint: {
						'circle-radius': 10,
						'circle-color': 'red',
						'circle-opacity': 0.8
					}
				});
			}
		}
	})
}

function transitionOverlayAndStart() {
	fly3 = true;
	map.flyTo({
		center: startLocation,
		speed: 1.2,
		zoom: 10.1,
	});
	map.on('moveend', ()=> {
	if(fly3){
	fly3=false;
	map.setPaintProperty('sampleBridge', 'circle-opacity',  0);	
	// or map.removeLayer('sampleBridge') -- not sure which is better approach
	const gradientY =  (d3.select('#overlay').node().getBoundingClientRect().height / 2) - 20;
	d3.select('#overlay').transition().duration(1000).ease(d3.easeQuadInOut)
		.styleTween( 'background', function() {
			return function(t) { 
			let currentPct = d3.interpolateNumber(18, 100)(t)
			let current
			return 'radial-gradient(circle at 50% ' +gradientY + 'px, rgba(0,0,99,'+ 0.15 * (1-t) + ')' + currentPct +  'vh, #2B3A61 ' + currentPct +  'vh)'
		}
	})
	.on("end", ()=> {
		d3.select('header').style('display', 'revert');
		startAnimation();
	}
	);
	}
	})	
}

function init() {
	//set up static map
	var staticURL = `https://api.mapbox.com/${mapboxStyle}/static/-89.35,43.05,10/300x300?access_token=${mapboxgl.accessToken}`;
	/* temporarily comment out so that we can see the 	
      document.getElementById('static-map').style.backgroundImage = `url(${staticURL})`;
	  */

	
  // set up event listeners


	d3.select('#get-started-button').on('click', () => {
		d3.select('#opening').transition().duration(900).ease(d3.easeLinear).style('opacity',0)
			.on('end', () => {
				stepVehicle.style.display = 'block';
				titleText.style.display = "none";
				stepText1.style.display = "block";
				})
	})
	//vehicle select
	vehicles.forEach(vehicle => {
		vehicle.addEventListener('change', () => {
			stepVehicle.style.display = 'none';
			vehicleIcon = vehicle.value;
			stepStart.style.display = 'block';
		});
	});


	function startSelected() {
		flyToStartThenAddVehicle(); 
		stepStart.style.display = 'none';
		destinationOptions = generateDestinationSet(destinations, 6);
		destinationOptions.unshift({"location": "Select a destination", lat: '', lon: '', type: '', inMilwaukee: ''});
		d3.select('#destinationSelector').selectAll('option').data(destinationOptions).join('option').attr('value', (d,i)=> i).text(d=> d['location']);
		startingPointSampleBridge = bridgesFromStartingPoint(bridges, startLocation)[0];
	}
	//geocoder input
	geocoder.on('result', (event) => {
		startLocation = event.result.geometry.coordinates;
		startSelected();
	});
	d3.select('#we-pick').on('click',()=> {
		startLocation = [-89.3838, 43.0748];
		startSelected();
	});

	//address confirm button
	btnConfirm.addEventListener('click', () => {
		stepCorrect.style.display = 'none';
		stepSampleBridge.style.display = 'block';
		flyToSampleBridge();
		d3.select('#example-bridge-crossing').text(d3.format(',')(startingPointSampleBridge.avgDailyTraffic))
	});

	//address deny button
	btnDeny.addEventListener('click', () => {
		stepCorrect.style.display = 'none';
		stepStart.style.display = 'block';
	});

	//address confirm button
	btnPickDest.addEventListener('click', () => {
		stepSampleBridge.style.display = 'none';
		stepDestination.style.display = 'block';
	});

	//destination select
	const destination = document.getElementById('destinationSelector');
	destination.addEventListener('change', (event) => {
		stepDestination.style.display = 'none';
		stepDetails.style.display = 'block';
				
		setTimeout(function () {
			btnGo.style.display = 'inline';
			stepDetails.style.display = 'none';
			stepPlayGame.style.display = 'block';
		}, 1000);
		endLocationDetails = destinationOptions[event.target.value];
		endLocation = [endLocationDetails.lon, endLocationDetails.lat];
		getRoute();
	});

	//go button -- transition sneak-peek circle open then start animation
	btnGo.addEventListener('click', () => {
		stepDetails.style.display = 'none';
		//flyToLocation(startLocation, transitionOverlayAndStart);
		transitionOverlayAndStart();
	});

	d3.select('#close-popup').on('click', () => {
		d3.select("#popup").style("visibility","hidden");
		d3.select("#show-all-bridges").style("visibility","visible");		
	});

	d3.select('#show-all-bridges').on('click', () => {
		d3.select("#show-all-bridges").style("visibility","hidden");
		addAllBridges();		
	});
}

const bridges = [{"lon":"-89.9370277777778","lat":"45.9820611111111","avgDailyTraffic":50,"year":1958},{"lon":"-91.7333333333333","lat":"45.4989444444444","avgDailyTraffic":13150,"year":1949},{"lon":"-91.658125","lat":"45.3036416666667","avgDailyTraffic":5550,"year":1972},{"lon":"-91.9758944444444","lat":"45.2806527777778","avgDailyTraffic":9701,"year":1980},{"lon":"-90.9660694444444","lat":"46.5785111111111","avgDailyTraffic":6800,"year":1977},{"lon":"-87.7888555555556","lat":"44.3493361111111","avgDailyTraffic":1421,"year":1948},{"lon":"-88.1180694444444","lat":"44.6463194444444","avgDailyTraffic":1605,"year":1949},{"lon":"-88.1292611111111","lat":"44.5335583333333","avgDailyTraffic":4770,"year":1968},{"lon":"-87.8283333333333","lat":"44.3433333333333","avgDailyTraffic":3146,"year":1957},{"lon":"-87.8267444444444","lat":"44.3430777777778","avgDailyTraffic":3146,"year":1957},{"lon":"-87.8266194444444","lat":"44.3349805555556","avgDailyTraffic":258,"year":1959},{"lon":"-87.9490972222222","lat":"44.2744805555556","avgDailyTraffic":913,"year":1976},{"lon":"-88.172","lat":"44.2500638888889","avgDailyTraffic":1928,"year":1986},{"lon":"-91.5527777777778","lat":"44.1319444444444","avgDailyTraffic":325,"year":1955},{"lon":"-91.6367444444444","lat":"44.5918694444444","avgDailyTraffic":4000,"year":1987},{"lon":"-91.6016111111111","lat":"44.07","avgDailyTraffic":117,"year":1928},{"lon":"-91.6708333333333","lat":"44.29","avgDailyTraffic":401,"year":1927},{"lon":"-92.2247305555556","lat":"45.7605","avgDailyTraffic":239,"year":1977},{"lon":"-88.0642888888889","lat":"44.1717333333333","avgDailyTraffic":6334,"year":1959},{"lon":"-88.1291666666667","lat":"44.1205555555556","avgDailyTraffic":1537,"year":1934},{"lon":"-91.3368638888889","lat":"44.9194638888889","avgDailyTraffic":5600,"year":1966},{"lon":"-90.9976666666667","lat":"45.1220833333333","avgDailyTraffic":318,"year":1939},{"lon":"-90.8005444444444","lat":"44.7694333333333","avgDailyTraffic":336,"year":1965},{"lon":"-90.8017027777778","lat":"44.7392277777778","avgDailyTraffic":336,"year":1975},{"lon":"-90.598175","lat":"44.8097194444444","avgDailyTraffic":2200,"year":1980},{"lon":"-90.615","lat":"44.56","avgDailyTraffic":3751,"year":1977},{"lon":"-90.4263444444445","lat":"44.842775","avgDailyTraffic":394,"year":1979},{"lon":"-90.4954722222222","lat":"44.7413666666667","avgDailyTraffic":3500,"year":1935},{"lon":"-90.6470055555556","lat":"44.9151416666667","avgDailyTraffic":394,"year":1948},{"lon":"-89.453475","lat":"43.3351611111111","avgDailyTraffic":26100,"year":1984},{"lon":"-89.05635","lat":"43.3580972222222","avgDailyTraffic":111,"year":1941},{"lon":"-89.0090027777778","lat":"43.3584777777778","avgDailyTraffic":179,"year":1932},{"lon":"-90.8417222222222","lat":"43.2742222222222","avgDailyTraffic":230,"year":2019},{"lon":"-90.7091111111111","lat":"43.1710638888889","avgDailyTraffic":2500,"year":1958},{"lon":"-90.8844222222222","lat":"43.1860944444444","avgDailyTraffic":580,"year":1975},{"lon":"-89.8166944444444","lat":"43.1076944444444","avgDailyTraffic":277,"year":1951},{"lon":"-89.7921111111111","lat":"43.1776944444444","avgDailyTraffic":1081,"year":1951},{"lon":"-89.6573333333333","lat":"42.9460555555556","avgDailyTraffic":2189,"year":1950},{"lon":"-89.7030833333333","lat":"42.9092222222222","avgDailyTraffic":1707,"year":1953},{"lon":"-89.6768888888889","lat":"42.9308888888889","avgDailyTraffic":1698,"year":1953},{"lon":"-89.1997777777778","lat":"43.0403888888889","avgDailyTraffic":5325,"year":1954},{"lon":"-89.0280277777778","lat":"42.9208055555556","avgDailyTraffic":94,"year":1954},{"lon":"-89.6190833333333","lat":"42.9154444444444","avgDailyTraffic":402,"year":1955},{"lon":"-89.4836388888889","lat":"43.1059722222222","avgDailyTraffic":36178,"year":1974},{"lon":"-89.2979722222222","lat":"42.8934444444444","avgDailyTraffic":919,"year":1957},{"lon":"-89.0210555555555","lat":"42.9352222222222","avgDailyTraffic":340,"year":1956},{"lon":"-89.7304444444444","lat":"42.9676111111111","avgDailyTraffic":1123,"year":1957},{"lon":"-89.0198055555555","lat":"43.0028888888889","avgDailyTraffic":1480,"year":1957},{"lon":"-89.6216111111111","lat":"43.0249722222222","avgDailyTraffic":528,"year":1958},{"lon":"-89.3354444444444","lat":"43.0482222222222","avgDailyTraffic":250,"year":1960},{"lon":"-89.3670277777778","lat":"42.9178916666667","avgDailyTraffic":17600,"year":1978},{"lon":"-89.5273055555556","lat":"42.9276111111111","avgDailyTraffic":6462,"year":1985},{"lon":"-89.2133333333333","lat":"43.1416388888889","avgDailyTraffic":1731,"year":1939},{"lon":"-89.7944722222222","lat":"43.2125277777778","avgDailyTraffic":720,"year":1939},{"lon":"-89.3620055555556","lat":"43.1945944444444","avgDailyTraffic":14700,"year":1979},{"lon":"-89.0867222222222","lat":"42.9000277777778","avgDailyTraffic":976,"year":1927},{"lon":"-89.2366944444444","lat":"43.0128611111111","avgDailyTraffic":1888,"year":1958},{"lon":"-88.8662972222222","lat":"43.4006055555556","avgDailyTraffic":1160,"year":1950},{"lon":"-88.4899027777778","lat":"43.5014888888889","avgDailyTraffic":727,"year":1953},{"lon":"-88.4299305555556","lat":"43.3110527777778","avgDailyTraffic":264,"year":1954},{"lon":"-88.9561472222222","lat":"43.3260194444444","avgDailyTraffic":422,"year":1956},{"lon":"-88.7344611111111","lat":"43.2170916666667","avgDailyTraffic":4400,"year":1959},{"lon":"-91.9576388888889","lat":"46.5033888888889","avgDailyTraffic":688,"year":1977},{"lon":"-92.1073416666667","lat":"44.9516555555556","avgDailyTraffic":1400,"year":1953},{"lon":"-91.6665611111111","lat":"44.8994888888889","avgDailyTraffic":50,"year":1937},{"lon":"-91.696025","lat":"44.7184222222222","avgDailyTraffic":3000,"year":1987},{"lon":"-91.6860638888889","lat":"45.1668333333333","avgDailyTraffic":659,"year":1934},{"lon":"-91.723875","lat":"45.1032138888889","avgDailyTraffic":330,"year":1934},{"lon":"-91.4765","lat":"44.6833055555556","avgDailyTraffic":666,"year":1954},{"lon":"-90.9433333333333","lat":"44.72675","avgDailyTraffic":358,"year":1959},{"lon":"-91.3528333333333","lat":"44.6974722222222","avgDailyTraffic":871,"year":1936},{"lon":"-91.1492777777778","lat":"44.7258333333333","avgDailyTraffic":666,"year":1948},{"lon":"-88.6539416666667","lat":"45.8615638888889","avgDailyTraffic":1200,"year":1976},{"lon":"-88.7192777777778","lat":"43.8345388888889","avgDailyTraffic":1700,"year":1972},{"lon":"-88.8683166666667","lat":"45.6886472222222","avgDailyTraffic":200,"year":1982},{"lon":"-90.4756361111111","lat":"42.7261777777778","avgDailyTraffic":5600,"year":1988},{"lon":"-90.5583333333333","lat":"43.0362222222222","avgDailyTraffic":519,"year":1958},{"lon":"-90.5711694444444","lat":"43.1992166666667","avgDailyTraffic":1200,"year":1958},{"lon":"-90.53975","lat":"43.0454722222222","avgDailyTraffic":519,"year":1984},{"lon":"-89.4796166666667","lat":"42.7700333333333","avgDailyTraffic":317,"year":1963},{"lon":"-90.0615777777778","lat":"43.1437611111111","avgDailyTraffic":3500,"year":1965},{"lon":"-90.3384444444444","lat":"42.8420833333333","avgDailyTraffic":580,"year":1939},{"lon":"-90.16225","lat":"46.1508611111111","avgDailyTraffic":740,"year":1967},{"lon":"-90.7981888888889","lat":"44.2755861111111","avgDailyTraffic":10400,"year":1968},{"lon":"-90.833575","lat":"44.4513166666667","avgDailyTraffic":2100,"year":1989},{"lon":"-91.1285277777778","lat":"44.0951","avgDailyTraffic":610,"year":1984},{"lon":"-90.8478027777778","lat":"44.4512194444444","avgDailyTraffic":1500,"year":1989},{"lon":"-90.8612805555556","lat":"44.4493138888889","avgDailyTraffic":1500,"year":1942},{"lon":"-90.8999277777778","lat":"44.1881222222222","avgDailyTraffic":99,"year":1923},{"lon":"-88.8420555555555","lat":"42.9274722222222","avgDailyTraffic":12180,"year":1973},{"lon":"-88.6914166666667","lat":"43.0853861111111","avgDailyTraffic":19600,"year":1964},{"lon":"-88.9302305555556","lat":"43.1009916666667","avgDailyTraffic":16500,"year":1965},{"lon":"-88.8891666666667","lat":"43.0872638888889","avgDailyTraffic":15800,"year":1965},{"lon":"-88.8600277777778","lat":"43.086825","avgDailyTraffic":800,"year":2008},{"lon":"-88.7266666666667","lat":"43.195","avgDailyTraffic":15136,"year":1981},{"lon":"-90.2617","lat":"43.8888972222222","avgDailyTraffic":873,"year":1959},{"lon":"-87.8262305555556","lat":"42.6540805555556","avgDailyTraffic":851,"year":1936},{"lon":"-87.7033888888889","lat":"44.5898611111111","avgDailyTraffic":540,"year":1954},{"lon":"-87.5657222222222","lat":"44.4775833333333","avgDailyTraffic":929,"year":1984},{"lon":"-87.6367222222222","lat":"44.3274166666667","avgDailyTraffic":493,"year":1978},{"lon":"-91.0751833333333","lat":"43.8341","avgDailyTraffic":2448,"year":1952},{"lon":"-90.9673","lat":"43.73","avgDailyTraffic":87,"year":1939},{"lon":"-91.0744472222222","lat":"43.8950333333333","avgDailyTraffic":3200,"year":1968},{"lon":"-91.1418666666667","lat":"44.0323666666667","avgDailyTraffic":262,"year":1939},{"lon":"-89.4021944444444","lat":"45.4178611111111","avgDailyTraffic":236,"year":1963},{"lon":"-89.8785333333333","lat":"45.4475888888889","avgDailyTraffic":404,"year":1962},{"lon":"-90.0427666666667","lat":"45.4573194444444","avgDailyTraffic":353,"year":1954},{"lon":"-89.8380305555555","lat":"45.1967888888889","avgDailyTraffic":272,"year":1966},{"lon":"-89.7385666666667","lat":"45.4372305555556","avgDailyTraffic":2200,"year":1967},{"lon":"-87.7169722222222","lat":"44.2560694444444","avgDailyTraffic":558,"year":1947},{"lon":"-88.0292194444445","lat":"43.9119444444444","avgDailyTraffic":4725,"year":1958},{"lon":"-87.9833972222222","lat":"43.9187861111111","avgDailyTraffic":293,"year":1972},{"lon":"-87.7439166666667","lat":"43.9140416666667","avgDailyTraffic":1171,"year":1935},{"lon":"-89.692675","lat":"45.1150083333333","avgDailyTraffic":4612,"year":1955},{"lon":"-89.6929527777778","lat":"45.1184388888889","avgDailyTraffic":4320,"year":1955},{"lon":"-89.7918527777778","lat":"45.0470333333333","avgDailyTraffic":984,"year":1957},{"lon":"-89.73395","lat":"44.9874833333333","avgDailyTraffic":1903,"year":1957},{"lon":"-89.8092861111111","lat":"45.0907083333333","avgDailyTraffic":635,"year":1957},{"lon":"-90.004525","lat":"44.8436833333333","avgDailyTraffic":625,"year":1959},{"lon":"-89.9640083333333","lat":"44.8215","avgDailyTraffic":656,"year":1960},{"lon":"-90.2174861111111","lat":"45.0122083333333","avgDailyTraffic":635,"year":1962},{"lon":"-89.4922527777778","lat":"45.0868361111111","avgDailyTraffic":492,"year":1964},{"lon":"-89.6298583333333","lat":"44.7141277777778","avgDailyTraffic":563,"year":1969},{"lon":"-89.5625194444444","lat":"44.714625","avgDailyTraffic":420,"year":1969},{"lon":"-89.6082333333333","lat":"44.7383472222222","avgDailyTraffic":666,"year":1969},{"lon":"-90.0144944444444","lat":"44.80395","avgDailyTraffic":625,"year":1975},{"lon":"-89.4917888888889","lat":"44.9645388888889","avgDailyTraffic":1435,"year":1979},{"lon":"-89.6980722222222","lat":"44.9607944444444","avgDailyTraffic":1005,"year":1985},{"lon":"-90.1196277777778","lat":"44.7351","avgDailyTraffic":110,"year":1937},{"lon":"-89.4682388888889","lat":"43.6445583333333","avgDailyTraffic":1340,"year":1966},{"lon":"-89.4858888888889","lat":"43.7357777777778","avgDailyTraffic":720,"year":1966},{"lon":"-87.9187027777778","lat":"43.1038305555556","avgDailyTraffic":6400,"year":1962},{"lon":"-87.9616833333333","lat":"43.1782611111111","avgDailyTraffic":18800,"year":1963},{"lon":"-88.0387527777778","lat":"42.9735722222222","avgDailyTraffic":4000,"year":1964},{"lon":"-88.0280305555556","lat":"42.9615527777778","avgDailyTraffic":6900,"year":1964},{"lon":"-87.968725","lat":"42.9613527777778","avgDailyTraffic":31300,"year":1966},{"lon":"-87.9210222222222","lat":"43.0710944444444","avgDailyTraffic":19600,"year":1964},{"lon":"-88.04505","lat":"43.1441083333333","avgDailyTraffic":9800,"year":1964},{"lon":"-88.0062388888889","lat":"43.1157222222222","avgDailyTraffic":13550,"year":1964},{"lon":"-88.0058416666667","lat":"43.1147138888889","avgDailyTraffic":13550,"year":1964},{"lon":"-88.032575","lat":"43.1361472222222","avgDailyTraffic":1600,"year":1965},{"lon":"-88.0024388888889","lat":"43.1125583333333","avgDailyTraffic":7000,"year":1965},{"lon":"-88.0028277777778","lat":"43.1119861111111","avgDailyTraffic":7000,"year":1965},{"lon":"-88.0479666666667","lat":"43.0849972222222","avgDailyTraffic":11300,"year":1968},{"lon":"-88.0044166666667","lat":"43.1667444444444","avgDailyTraffic":16000,"year":1969},{"lon":"-88.0553027777778","lat":"43.1209055555556","avgDailyTraffic":8994,"year":1970},{"lon":"-87.8887111111111","lat":"43.0600777777778","avgDailyTraffic":17300,"year":1975},{"lon":"-87.8879611111111","lat":"43.059375","avgDailyTraffic":9800,"year":1977},{"lon":"-87.9093166666667","lat":"42.9840972222222","avgDailyTraffic":22889,"year":1982},{"lon":"-88.017125","lat":"43.0294333333333","avgDailyTraffic":15500,"year":1934},{"lon":"-88.0346305555556","lat":"43.0605027777778","avgDailyTraffic":14800,"year":1934},{"lon":"-88.0349888888889","lat":"43.0602916666667","avgDailyTraffic":14800,"year":1934},{"lon":"-90.5218888888889","lat":"43.8154444444444","avgDailyTraffic":2600,"year":1954},{"lon":"-90.5168666666667","lat":"43.7870666666667","avgDailyTraffic":239,"year":1937},{"lon":"-87.8206416666667","lat":"44.953","avgDailyTraffic":1055,"year":1967},{"lon":"-88.2985166666667","lat":"44.8649416666667","avgDailyTraffic":1045,"year":1973},{"lon":"-87.9859638888889","lat":"44.9783527777778","avgDailyTraffic":251,"year":1976},{"lon":"-88.3830138888889","lat":"44.8731555555556","avgDailyTraffic":649,"year":1979},{"lon":"-89.3879","lat":"45.8576388888889","avgDailyTraffic":849,"year":1960},{"lon":"-89.435","lat":"45.8863888888889","avgDailyTraffic":1010,"year":1979},{"lon":"-89.8119444444444","lat":"45.6927777777778","avgDailyTraffic":354,"year":1984},{"lon":"-88.0049583333333","lat":"43.3374222222222","avgDailyTraffic":470,"year":1961},{"lon":"-87.9254555555556","lat":"43.3529722222222","avgDailyTraffic":500,"year":1972},{"lon":"-87.903","lat":"43.4102194444444","avgDailyTraffic":15400,"year":1974},{"lon":"-92.6727861111111","lat":"44.7177138888889","avgDailyTraffic":2300,"year":1970},{"lon":"-92.5785388888889","lat":"44.691575","avgDailyTraffic":244,"year":1979},{"lon":"-92.1663722222222","lat":"44.5878888888889","avgDailyTraffic":412,"year":1979},{"lon":"-92.5686861111111","lat":"44.6337361111111","avgDailyTraffic":278,"year":1983},{"lon":"-92.2369944444444","lat":"44.8421666666667","avgDailyTraffic":1145,"year":1989},{"lon":"-92.710825","lat":"45.3218694444444","avgDailyTraffic":5300,"year":1980},{"lon":"-89.4638472222222","lat":"44.6624861111111","avgDailyTraffic":660,"year":1954},{"lon":"-89.5181416666667","lat":"44.4536666666667","avgDailyTraffic":13900,"year":1969},{"lon":"-89.5186305555556","lat":"44.454125","avgDailyTraffic":21800,"year":1969},{"lon":"-89.5181","lat":"44.4568388888889","avgDailyTraffic":11700,"year":1969},{"lon":"-89.5186277777778","lat":"44.4572861111111","avgDailyTraffic":11600,"year":1969},{"lon":"-89.5277361111111","lat":"44.5232694444444","avgDailyTraffic":23500,"year":1968},{"lon":"-89.6073138888889","lat":"44.5188083333333","avgDailyTraffic":1171,"year":1971},{"lon":"-89.7472805555556","lat":"44.5756916666667","avgDailyTraffic":1365,"year":1975},{"lon":"-89.3064777777778","lat":"44.6282638888889","avgDailyTraffic":952,"year":1992},{"lon":"-90.4315583333333","lat":"45.4629305555556","avgDailyTraffic":102,"year":1959},{"lon":"-90.4125583333333","lat":"45.7006222222222","avgDailyTraffic":6300,"year":1971},{"lon":"-90.2879444444444","lat":"45.5531666666667","avgDailyTraffic":2100,"year":1978},{"lon":"-90.2843416666667","lat":"45.5533055555556","avgDailyTraffic":2100,"year":1978},{"lon":"-90.287725","lat":"45.5499888888889","avgDailyTraffic":2662,"year":1936},{"lon":"-88.2231638888889","lat":"42.7240305555556","avgDailyTraffic":8200,"year":1967},{"lon":"-88.0155361111111","lat":"42.7354638888889","avgDailyTraffic":10800,"year":1968},{"lon":"-88.010375","lat":"42.7341027777778","avgDailyTraffic":9600,"year":1968},{"lon":"-87.9821416666667","lat":"42.7319666666667","avgDailyTraffic":6000,"year":1968},{"lon":"-90.5718888888889","lat":"43.2046388888889","avgDailyTraffic":1400,"year":1958},{"lon":"-89.0588611111111","lat":"42.7203333333333","avgDailyTraffic":2996,"year":1953},{"lon":"-88.9403055555556","lat":"42.5730833333333","avgDailyTraffic":987,"year":1953},{"lon":"-88.79075","lat":"42.5956666666667","avgDailyTraffic":293,"year":1963},{"lon":"-88.9323611111111","lat":"42.8225833333333","avgDailyTraffic":1421,"year":1964},{"lon":"-89.1517222222222","lat":"42.8113333333333","avgDailyTraffic":209,"year":1966},{"lon":"-88.8013333333333","lat":"42.5364444444444","avgDailyTraffic":270,"year":1976},{"lon":"-89.0316666666667","lat":"42.6666666666667","avgDailyTraffic":16000,"year":1982},{"lon":"-91.1492777777778","lat":"45.5084166666667","avgDailyTraffic":781,"year":1967},{"lon":"-91.0082777777778","lat":"45.3017222222222","avgDailyTraffic":900,"year":1975},{"lon":"-92.2819916666667","lat":"44.9345694444444","avgDailyTraffic":16050,"year":1958},{"lon":"-92.2816027777778","lat":"44.9349111111111","avgDailyTraffic":16050,"year":1958},{"lon":"-92.2371861111111","lat":"44.9340722222222","avgDailyTraffic":16050,"year":1958},{"lon":"-92.2816361111111","lat":"45.1449305555556","avgDailyTraffic":3700,"year":1962},{"lon":"-92.7526944444444","lat":"44.9625083333333","avgDailyTraffic":87000,"year":2019},{"lon":"-92.6170861111111","lat":"44.9914444444444","avgDailyTraffic":2200,"year":1980},{"lon":"-89.636375","lat":"43.4815138888889","avgDailyTraffic":843,"year":1956},{"lon":"-89.791975","lat":"43.4530111111111","avgDailyTraffic":738,"year":1939},{"lon":"-91.1251777777778","lat":"45.9650194444444","avgDailyTraffic":900,"year":1970},{"lon":"-91.1813333333333","lat":"45.6713666666667","avgDailyTraffic":1085,"year":1972},{"lon":"-91.35225","lat":"45.7949361111111","avgDailyTraffic":434,"year":1976},{"lon":"-88.9055555555556","lat":"44.7222222222222","avgDailyTraffic":603,"year":1939},{"lon":"-89.1028333333333","lat":"44.8299444444445","avgDailyTraffic":1339,"year":1940},{"lon":"-88.7019444444445","lat":"44.8255555555556","avgDailyTraffic":900,"year":1934},{"lon":"-88.1006388888889","lat":"43.60285","avgDailyTraffic":505,"year":1992},{"lon":"-90.4392666666667","lat":"45.1326027777778","avgDailyTraffic":1500,"year":1987},{"lon":"-90.7801111111111","lat":"45.3560833333333","avgDailyTraffic":184,"year":1965},{"lon":"-90.8078333333333","lat":"45.1608611111111","avgDailyTraffic":758,"year":1971},{"lon":"-91.5231944444444","lat":"44.0748888888889","avgDailyTraffic":792,"year":1919},{"lon":"-91.16845","lat":"43.7169333333333","avgDailyTraffic":2278,"year":1983},{"lon":"-91.0180333333333","lat":"43.7060333333333","avgDailyTraffic":620,"year":1983},{"lon":"-89.2658888888889","lat":"46.0475","avgDailyTraffic":1370,"year":1955},{"lon":"-89.5541111111111","lat":"45.9896666666667","avgDailyTraffic":1167,"year":1962},{"lon":"-88.5450888888889","lat":"42.7346027777778","avgDailyTraffic":11700,"year":1966},{"lon":"-88.5325083333333","lat":"42.6634972222222","avgDailyTraffic":11600,"year":1975},{"lon":"-88.3573416666667","lat":"42.6480194444444","avgDailyTraffic":1620,"year":1938},{"lon":"-88.1576805555556","lat":"43.2213388888889","avgDailyTraffic":2400,"year":1969},{"lon":"-88.0540416666667","lat":"43.4691083333333","avgDailyTraffic":2400,"year":1952},{"lon":"-88.0810055555555","lat":"43.4245027777778","avgDailyTraffic":2500,"year":1952},{"lon":"-88.19495","lat":"43.0890055555556","avgDailyTraffic":4578,"year":1953},{"lon":"-88.4842194444444","lat":"43.0226666666667","avgDailyTraffic":5100,"year":1955},{"lon":"-88.0749305555556","lat":"43.1182472222222","avgDailyTraffic":14500,"year":1964},{"lon":"-88.2055361111111","lat":"43.07555","avgDailyTraffic":25350,"year":1966},{"lon":"-88.2930527777778","lat":"42.9336944444444","avgDailyTraffic":3500,"year":1965},{"lon":"-88.1993027777778","lat":"42.9185444444444","avgDailyTraffic":21650,"year":1969},{"lon":"-88.2481138888889","lat":"42.9019388888889","avgDailyTraffic":690,"year":1971},{"lon":"-88.2076166666667","lat":"43.0476555555556","avgDailyTraffic":19000,"year":1977},{"lon":"-88.3066972222222","lat":"42.8754861111111","avgDailyTraffic":9500,"year":1971},{"lon":"-88.3626638888889","lat":"43.1050694444444","avgDailyTraffic":20600,"year":1976},{"lon":"-88.4103777777778","lat":"43.1609527777778","avgDailyTraffic":622,"year":1983},{"lon":"-88.0838972222222","lat":"43.1675222222222","avgDailyTraffic":3300,"year":1937},{"lon":"-88.9331472222222","lat":"44.4498861111111","avgDailyTraffic":1671,"year":1949},{"lon":"-88.9024805555556","lat":"44.4221861111111","avgDailyTraffic":919,"year":1960},{"lon":"-89.0796138888889","lat":"44.3397305555556","avgDailyTraffic":20400,"year":1965},{"lon":"-89.1309277777778","lat":"44.5092888888889","avgDailyTraffic":3800,"year":1972},{"lon":"-89.0683055555556","lat":"44.1408694444444","avgDailyTraffic":1899,"year":1936},{"lon":"-88.9326527777778","lat":"44.1001916666667","avgDailyTraffic":1097,"year":1948},{"lon":"-88.6797","lat":"43.95565","avgDailyTraffic":730,"year":1954},{"lon":"-90.1252638888889","lat":"44.4808388888889","avgDailyTraffic":2600,"year":1936},{"lon":"-90.0206944444444","lat":"44.5551666666667","avgDailyTraffic":395,"year":1960},{"lon":"-88.8265666666667","lat":"44.9811833333333","avgDailyTraffic":470,"year":1973},{"lon":"-89.8983194444445","lat":"43.9735944444444","avgDailyTraffic":1345,"year":1950},{"lon":"-90.6555833333333","lat":"46.3275555555556","avgDailyTraffic":117,"year":1920},{"lon":"-91.6548583333333","lat":"45.4073083333333","avgDailyTraffic":872,"year":1974},{"lon":"-92.001525","lat":"45.4508722222222","avgDailyTraffic":47,"year":1920},{"lon":"-91.89225","lat":"45.2084527777778","avgDailyTraffic":457,"year":1984},{"lon":"-91.9625888888889","lat":"45.2922888888889","avgDailyTraffic":23,"year":1935},{"lon":"-91.6434444444445","lat":"45.4656416666667","avgDailyTraffic":94,"year":1960},{"lon":"-88.07795","lat":"44.5193166666667","avgDailyTraffic":769,"year":1968},{"lon":"-88.0695527777778","lat":"44.5745583333333","avgDailyTraffic":2007,"year":1978},{"lon":"-88.0711916666667","lat":"44.5774611111111","avgDailyTraffic":1657,"year":1978},{"lon":"-88.07795","lat":"44.5306833333333","avgDailyTraffic":11375,"year":1978},{"lon":"-91.65575","lat":"44.085","avgDailyTraffic":17,"year":1915},{"lon":"-91.8405555555556","lat":"44.5536111111111","avgDailyTraffic":86,"year":1928},{"lon":"-91.6158333333333","lat":"44.5677777777778","avgDailyTraffic":94,"year":1974},{"lon":"-91.55","lat":"44.2441666666667","avgDailyTraffic":205,"year":2012},{"lon":"-91.6986111111111","lat":"44.3711111111111","avgDailyTraffic":97,"year":1925},{"lon":"-92.3388888888889","lat":"45.7409666666667","avgDailyTraffic":47,"year":1929},{"lon":"-91.4075","lat":"44.9725","avgDailyTraffic":685,"year":1969},{"lon":"-91.4439722222222","lat":"45.1419166666667","avgDailyTraffic":74,"year":1971},{"lon":"-91.3912777777778","lat":"44.9369694444444","avgDailyTraffic":3180,"year":1934},{"lon":"-90.7063083333333","lat":"44.9733777777778","avgDailyTraffic":58,"year":1921},{"lon":"-90.5339416666667","lat":"44.8353305555556","avgDailyTraffic":92,"year":1930},{"lon":"-90.3872","lat":"44.6621416666667","avgDailyTraffic":116,"year":1967},{"lon":"-90.4106722222222","lat":"44.5970166666667","avgDailyTraffic":116,"year":1976},{"lon":"-90.4897222222222","lat":"44.5092194444444","avgDailyTraffic":58,"year":1960},{"lon":"-90.4967861111111","lat":"44.5000472222222","avgDailyTraffic":92,"year":1947},{"lon":"-90.4723416666667","lat":"44.8281194444444","avgDailyTraffic":92,"year":1956},{"lon":"-90.7616944444444","lat":"44.9007777777778","avgDailyTraffic":58,"year":1950},{"lon":"-89.0248638888889","lat":"43.5263444444444","avgDailyTraffic":197,"year":1910},{"lon":"-89.0771888888889","lat":"43.5981805555556","avgDailyTraffic":67,"year":1930},{"lon":"-89.1272583333333","lat":"43.6247166666667","avgDailyTraffic":81,"year":1930},{"lon":"-89.1367194444445","lat":"43.6293472222222","avgDailyTraffic":31,"year":1930},{"lon":"-89.5318472222222","lat":"43.3164111111111","avgDailyTraffic":2500,"year":1900},{"lon":"-89.5301111111111","lat":"43.3111138888889","avgDailyTraffic":79,"year":1900},{"lon":"-90.8365555555555","lat":"43.2921944444444","avgDailyTraffic":352,"year":1963},{"lon":"-91.19675","lat":"43.4212222222222","avgDailyTraffic":1175,"year":1935},{"lon":"-89.4615","lat":"42.87525","avgDailyTraffic":88,"year":1923},{"lon":"-89.8306111111111","lat":"42.8737777777778","avgDailyTraffic":58,"year":1929},{"lon":"-89.7816388888889","lat":"42.9810555555556","avgDailyTraffic":322,"year":1955},{"lon":"-89.1809166666667","lat":"42.9526944444444","avgDailyTraffic":58,"year":1962},{"lon":"-89.7563055555556","lat":"43.1118611111111","avgDailyTraffic":314,"year":1958},{"lon":"-89.2338333333333","lat":"43.0446111111111","avgDailyTraffic":418,"year":1930},{"lon":"-88.4339972222222","lat":"43.3545638888889","avgDailyTraffic":527,"year":1965},{"lon":"-88.4369055555556","lat":"43.3469944444444","avgDailyTraffic":527,"year":1949},{"lon":"-91.5877222222222","lat":"46.5503333333333","avgDailyTraffic":1,"year":1929},{"lon":"-91.9636111111111","lat":"46.2548611111111","avgDailyTraffic":107,"year":1963},{"lon":"-91.7373333333333","lat":"46.224","avgDailyTraffic":53,"year":1914},{"lon":"-91.7983055555556","lat":"46.2486388888889","avgDailyTraffic":10,"year":1945},{"lon":"-91.7676","lat":"44.7997361111111","avgDailyTraffic":1319,"year":1966},{"lon":"-91.8093916666667","lat":"45.1878","avgDailyTraffic":101,"year":1960},{"lon":"-91.7514194444445","lat":"44.6980694444444","avgDailyTraffic":101,"year":1970},{"lon":"-91.9000583333333","lat":"45.207125","avgDailyTraffic":203,"year":1947},{"lon":"-91.7689527777778","lat":"45.0250333333333","avgDailyTraffic":203,"year":1934},{"lon":"-92.1200722222222","lat":"45.139225","avgDailyTraffic":101,"year":1968},{"lon":"-91.1934166666667","lat":"44.73475","avgDailyTraffic":153,"year":1979},{"lon":"-91.2771444444444","lat":"44.768875","avgDailyTraffic":1025,"year":1971},{"lon":"-91.5003611111111","lat":"44.8216111111111","avgDailyTraffic":2141,"year":1967},{"lon":"-91.5244166666667","lat":"44.8381111111111","avgDailyTraffic":2667,"year":1965},{"lon":"-88.5333472222222","lat":"45.7524333333333","avgDailyTraffic":50,"year":1973},{"lon":"-88.4832583333333","lat":"43.7625361111111","avgDailyTraffic":1,"year":1927},{"lon":"-88.4681055555556","lat":"43.7243444444444","avgDailyTraffic":745,"year":1950},{"lon":"-88.4004666666667","lat":"43.5525027777778","avgDailyTraffic":247,"year":1970},{"lon":"-88.1606333333333","lat":"43.7622194444444","avgDailyTraffic":45,"year":1920},{"lon":"-88.7863","lat":"43.8324194444444","avgDailyTraffic":11,"year":1950},{"lon":"-88.8160833333333","lat":"45.6920277777778","avgDailyTraffic":26,"year":1924},{"lon":"-88.6299166666667","lat":"45.4403333333333","avgDailyTraffic":0,"year":1917},{"lon":"-90.6735555555556","lat":"42.9444722222222","avgDailyTraffic":50,"year":1910},{"lon":"-90.7247777777778","lat":"42.6760555555555","avgDailyTraffic":260,"year":1950},{"lon":"-90.7561666666667","lat":"43.0561388888889","avgDailyTraffic":212,"year":1950},{"lon":"-89.70165","lat":"42.54875","avgDailyTraffic":801,"year":1933},{"lon":"-89.5705833333333","lat":"42.5686666666667","avgDailyTraffic":411,"year":1956},{"lon":"-89.78275","lat":"42.62885","avgDailyTraffic":664,"year":1962},{"lon":"-89.5818","lat":"42.7414611111111","avgDailyTraffic":936,"year":1968},{"lon":"-89.60105","lat":"42.8061527777778","avgDailyTraffic":105,"year":1930},{"lon":"-89.78365","lat":"42.6347166666667","avgDailyTraffic":420,"year":1938},{"lon":"-89.7691944444444","lat":"42.8249","avgDailyTraffic":105,"year":1941},{"lon":"-89.5925","lat":"42.5908166666667","avgDailyTraffic":158,"year":1975},{"lon":"-89.7941833333333","lat":"42.5583833333333","avgDailyTraffic":717,"year":1961},{"lon":"-89.75155","lat":"42.5489666666667","avgDailyTraffic":611,"year":1953},{"lon":"-90.2555833333333","lat":"43.0619444444444","avgDailyTraffic":105,"year":1952},{"lon":"-90.1570833333333","lat":"43.1015","avgDailyTraffic":52,"year":1945},{"lon":"-90.0780833333333","lat":"42.9237222222222","avgDailyTraffic":155,"year":1966},{"lon":"-89.9164444444445","lat":"43.0928888888889","avgDailyTraffic":400,"year":1948},{"lon":"-91.0796944444444","lat":"44.5841888888889","avgDailyTraffic":23,"year":1909},{"lon":"-88.7662222222222","lat":"43.0506666666667","avgDailyTraffic":155,"year":1963},{"lon":"-87.8748833333333","lat":"42.6541666666667","avgDailyTraffic":3162,"year":1978},{"lon":"-87.850525","lat":"42.6537333333333","avgDailyTraffic":1836,"year":1978},{"lon":"-87.4703333333333","lat":"44.6079444444444","avgDailyTraffic":47,"year":1962},{"lon":"-87.5561388888889","lat":"44.5668611111111","avgDailyTraffic":52,"year":1928},{"lon":"-87.7285","lat":"44.3853611111111","avgDailyTraffic":1,"year":1901},{"lon":"-90.95375","lat":"43.7541","avgDailyTraffic":295,"year":1978},{"lon":"-91.0701166666667","lat":"43.75295","avgDailyTraffic":81,"year":1977},{"lon":"-91.1694333333333","lat":"44.0386166666667","avgDailyTraffic":785,"year":1976},{"lon":"-91.2556333333333","lat":"43.9878","avgDailyTraffic":3570,"year":1949},{"lon":"-90.9305","lat":"43.73185","avgDailyTraffic":106,"year":1930},{"lon":"-89.8418166666667","lat":"42.6027472222222","avgDailyTraffic":105,"year":1961},{"lon":"-89.8568805555555","lat":"42.6535","avgDailyTraffic":47,"year":1930},{"lon":"-89.8914166666667","lat":"42.5620333333333","avgDailyTraffic":23,"year":1930},{"lon":"-90.1947166666667","lat":"42.7824666666667","avgDailyTraffic":199,"year":1970},{"lon":"-89.1507777777778","lat":"45.1413333333333","avgDailyTraffic":1704,"year":1936},{"lon":"-89.1642222222222","lat":"45.1257222222222","avgDailyTraffic":1236,"year":1938},{"lon":"-88.8045555555556","lat":"45.1703055555556","avgDailyTraffic":6,"year":1916},{"lon":"-89.8276111111111","lat":"45.244275","avgDailyTraffic":101,"year":1973},{"lon":"-89.6680944444444","lat":"45.416975","avgDailyTraffic":444,"year":1921},{"lon":"-87.6803777777778","lat":"44.1783333333333","avgDailyTraffic":88,"year":1924},{"lon":"-87.6605527777778","lat":"44.2607416666667","avgDailyTraffic":47,"year":1981},{"lon":"-87.6104027777778","lat":"44.1975361111111","avgDailyTraffic":205,"year":1963},{"lon":"-89.88405","lat":"44.9803222222222","avgDailyTraffic":50,"year":1929},{"lon":"-89.8228027777778","lat":"44.9586555555556","avgDailyTraffic":100,"year":1940},{"lon":"-89.7576083333333","lat":"45.0100666666667","avgDailyTraffic":90,"year":1941},{"lon":"-89.9461111111111","lat":"44.9308638888889","avgDailyTraffic":47,"year":1931},{"lon":"-90.0955944444444","lat":"44.8224","avgDailyTraffic":180,"year":1937},{"lon":"-89.9642472222222","lat":"44.7057027777778","avgDailyTraffic":261,"year":1984},{"lon":"-87.9735","lat":"45.0666833333333","avgDailyTraffic":25,"year":1920},{"lon":"-88.0127222222222","lat":"45.4051388888889","avgDailyTraffic":50,"year":1920},{"lon":"-89.3462722222222","lat":"43.7426194444444","avgDailyTraffic":95,"year":1940},{"lon":"-89.2916083333333","lat":"43.6977194444444","avgDailyTraffic":47,"year":1950},{"lon":"-88.0367666666667","lat":"43.0749083333333","avgDailyTraffic":17500,"year":2019},{"lon":"-88.0362083333333","lat":"43.0751722222222","avgDailyTraffic":17500,"year":2019},{"lon":"-87.9896972222222","lat":"43.1046472222222","avgDailyTraffic":21700,"year":2019},{"lon":"-87.9196611111111","lat":"42.9025194444444","avgDailyTraffic":2310,"year":1970},{"lon":"-87.9200722222222","lat":"42.9072388888889","avgDailyTraffic":2310,"year":1970},{"lon":"-87.9849527777778","lat":"43.0311222222222","avgDailyTraffic":52,"year":1956},{"lon":"-87.9491916666667","lat":"43.1098222222222","avgDailyTraffic":1900,"year":1961},{"lon":"-87.9766388888889","lat":"43.0433388888889","avgDailyTraffic":1,"year":1976},{"lon":"-87.9998722222222","lat":"43.0243333333333","avgDailyTraffic":16843,"year":1939},{"lon":"-87.9101777777778","lat":"43.0373361111111","avgDailyTraffic":11544,"year":1978},{"lon":"-87.9409527777778","lat":"43.1120138888889","avgDailyTraffic":9623,"year":1955},{"lon":"-90.3968833333333","lat":"43.8276833333333","avgDailyTraffic":250,"year":1940},{"lon":"-90.4918833333333","lat":"43.7330166666667","avgDailyTraffic":54,"year":1978},{"lon":"-90.5407166666667","lat":"43.789","avgDailyTraffic":228,"year":1945},{"lon":"-90.6177","lat":"43.82985","avgDailyTraffic":109,"year":1960},{"lon":"-90.8167666666667","lat":"44.1003666666667","avgDailyTraffic":207,"year":1990},{"lon":"-88.4150638888889","lat":"45.3148305555556","avgDailyTraffic":50,"year":1928},{"lon":"-89.2655555555556","lat":"45.595","avgDailyTraffic":67,"year":1917},{"lon":"-88.2038083333333","lat":"44.5744916666667","avgDailyTraffic":963,"year":1968},{"lon":"-88.2418666666667","lat":"44.34595","avgDailyTraffic":94,"year":1907},{"lon":"-88.3982861111111","lat":"44.2564472222222","avgDailyTraffic":1057,"year":1967},{"lon":"-88.1917333333333","lat":"44.2992666666667","avgDailyTraffic":47,"year":1970},{"lon":"-88.3026166666667","lat":"44.3251333333333","avgDailyTraffic":625,"year":1911},{"lon":"-88.1907833333333","lat":"44.2922833333333","avgDailyTraffic":47,"year":1936},{"lon":"-92.0089638888889","lat":"44.6480138888889","avgDailyTraffic":978,"year":1971},{"lon":"-92.5783111111111","lat":"44.7293194444444","avgDailyTraffic":216,"year":1970},{"lon":"-92.24085","lat":"44.8445833333333","avgDailyTraffic":40,"year":1934},{"lon":"-92.3226194444444","lat":"44.7051611111111","avgDailyTraffic":112,"year":1972},{"lon":"-92.592","lat":"45.6396666666667","avgDailyTraffic":411,"year":1941},{"lon":"-92.453","lat":"45.2946666666667","avgDailyTraffic":1236,"year":1962},{"lon":"-92.507","lat":"45.2326666666667","avgDailyTraffic":668,"year":1975},{"lon":"-89.5502305555556","lat":"44.6286916666667","avgDailyTraffic":60,"year":1922},{"lon":"-89.8190888888889","lat":"44.5402611111111","avgDailyTraffic":133,"year":1930},{"lon":"-88.2960972222222","lat":"42.6976722222222","avgDailyTraffic":411,"year":1965},{"lon":"-87.9987361111111","lat":"42.7571722222222","avgDailyTraffic":94,"year":1973},{"lon":"-87.7775361111111","lat":"42.7646083333333","avgDailyTraffic":587,"year":1920},{"lon":"-87.8053027777778","lat":"42.7259444444444","avgDailyTraffic":11182,"year":1983},{"lon":"-88.1247416666667","lat":"42.7691888888889","avgDailyTraffic":94,"year":1964},{"lon":"-87.8652166666667","lat":"42.7678694444444","avgDailyTraffic":50,"year":1959},{"lon":"-90.4149722222222","lat":"43.3482222222222","avgDailyTraffic":94,"year":1974},{"lon":"-89.0836944444444","lat":"42.6864722222222","avgDailyTraffic":705,"year":1922},{"lon":"-88.9140833333333","lat":"42.672","avgDailyTraffic":158,"year":1923},{"lon":"-88.8033888888889","lat":"42.6063888888889","avgDailyTraffic":320,"year":1935},{"lon":"-88.8845833333333","lat":"42.6391111111111","avgDailyTraffic":75,"year":1936},{"lon":"-89.2133888888889","lat":"42.5635555555556","avgDailyTraffic":47,"year":1950},{"lon":"-89.2136944444444","lat":"42.55625","avgDailyTraffic":82,"year":1918},{"lon":"-89.1216111111111","lat":"42.7209722222222","avgDailyTraffic":105,"year":1937},{"lon":"-88.8571111111111","lat":"42.7416388888889","avgDailyTraffic":176,"year":1977},{"lon":"-90.9028333333333","lat":"45.4395555555556","avgDailyTraffic":542,"year":1976},{"lon":"-91.0793333333333","lat":"45.4075555555556","avgDailyTraffic":1302,"year":1975},{"lon":"-91.1323055555555","lat":"45.5523611111111","avgDailyTraffic":20,"year":1940},{"lon":"-90.7685944444444","lat":"45.6186388888889","avgDailyTraffic":15,"year":1910},{"lon":"-90.1128388888889","lat":"43.6067944444444","avgDailyTraffic":19,"year":1929},{"lon":"-89.8873222222222","lat":"43.2895333333333","avgDailyTraffic":270,"year":1969},{"lon":"-90.0399555555556","lat":"43.2787138888889","avgDailyTraffic":1662,"year":1969},{"lon":"-90.1529083333333","lat":"43.2518805555556","avgDailyTraffic":657,"year":1932},{"lon":"-90.2453333333333","lat":"43.6127333333333","avgDailyTraffic":15,"year":1929},{"lon":"-89.9176111111111","lat":"43.2768194444444","avgDailyTraffic":416,"year":1973},{"lon":"-90.2468861111111","lat":"43.5776194444444","avgDailyTraffic":7,"year":1940},{"lon":"-91.3955555555556","lat":"45.8752777777778","avgDailyTraffic":726,"year":1977},{"lon":"-91.3984166666667","lat":"46.0993055555556","avgDailyTraffic":43,"year":1950},{"lon":"-89.1177777777778","lat":"44.8255555555556","avgDailyTraffic":100,"year":1960},{"lon":"-89.1430555555556","lat":"44.8372222222222","avgDailyTraffic":101,"year":1922},{"lon":"-89.2038888888889","lat":"44.8244444444444","avgDailyTraffic":50,"year":1910},{"lon":"-89.0322222222222","lat":"44.8263888888889","avgDailyTraffic":120,"year":1965},{"lon":"-87.8502527777778","lat":"43.7542166666667","avgDailyTraffic":352,"year":1958},{"lon":"-87.9777111111111","lat":"43.7464944444444","avgDailyTraffic":2937,"year":1920},{"lon":"-88.0530166666667","lat":"43.7926333333333","avgDailyTraffic":881,"year":1935},{"lon":"-88.0838805555556","lat":"43.7768722222222","avgDailyTraffic":94,"year":1973},{"lon":"-88.0002666666667","lat":"43.6453166666667","avgDailyTraffic":205,"year":1922},{"lon":"-87.8711","lat":"43.6381055555556","avgDailyTraffic":585,"year":1929},{"lon":"-87.9065861111111","lat":"43.7330277777778","avgDailyTraffic":470,"year":1954},{"lon":"-87.8878694444444","lat":"43.5942944444444","avgDailyTraffic":47,"year":1920},{"lon":"-90.1361416666667","lat":"45.3679638888889","avgDailyTraffic":30,"year":1901},{"lon":"-90.1016388888889","lat":"45.2084444444444","avgDailyTraffic":58,"year":1935},{"lon":"-91.3137222222222","lat":"44.2059444444444","avgDailyTraffic":683,"year":1954},{"lon":"-91.4198888888889","lat":"44.33425","avgDailyTraffic":117,"year":1912},{"lon":"-91.4982222222222","lat":"44.2679166666667","avgDailyTraffic":23,"year":1950},{"lon":"-91.0435","lat":"43.5905","avgDailyTraffic":35,"year":1933},{"lon":"-90.9815333333333","lat":"43.48645","avgDailyTraffic":47,"year":1940},{"lon":"-88.7077722222222","lat":"42.5756527777778","avgDailyTraffic":150,"year":1939},{"lon":"-88.3846777777778","lat":"42.654525","avgDailyTraffic":352,"year":1920},{"lon":"-88.5637388888889","lat":"42.7752583333333","avgDailyTraffic":200,"year":1915},{"lon":"-91.8150222222222","lat":"45.9062638888889","avgDailyTraffic":47,"year":1925},{"lon":"-88.0906388888889","lat":"43.4957638888889","avgDailyTraffic":47,"year":1930},{"lon":"-88.1886805555556","lat":"43.4519638888889","avgDailyTraffic":47,"year":1910},{"lon":"-88.2926722222222","lat":"43.3537611111111","avgDailyTraffic":188,"year":1936},{"lon":"-88.1721","lat":"43.1075861111111","avgDailyTraffic":0,"year":1950},{"lon":"-88.1061638888889","lat":"43.0532305555556","avgDailyTraffic":4900,"year":1966},{"lon":"-88.8344916666667","lat":"44.6486277777778","avgDailyTraffic":125,"year":1930},{"lon":"-88.8655166666667","lat":"44.19915","avgDailyTraffic":35,"year":1927},{"lon":"-88.6955166666667","lat":"44.0113333333333","avgDailyTraffic":76,"year":1960},{"lon":"-88.51885","lat":"44.0219","avgDailyTraffic":115,"year":1921},{"lon":"-88.7851333333333","lat":"44.1214","avgDailyTraffic":40,"year":1960},{"lon":"-90.2977527777778","lat":"44.5126805555556","avgDailyTraffic":628,"year":1953},{"lon":"-90.05785","lat":"44.2489472222222","avgDailyTraffic":60,"year":1920},{"lon":"-89.9692888888889","lat":"44.5039916666667","avgDailyTraffic":441,"year":1961},{"lon":"-89.9458555555556","lat":"44.5179916666667","avgDailyTraffic":437,"year":1961},{"lon":"-90.0557666666667","lat":"44.6700111111111","avgDailyTraffic":120,"year":1992},{"lon":"-89.9633416666667","lat":"44.32825","avgDailyTraffic":2173,"year":1969},{"lon":"-90.3155805555556","lat":"44.5270527777778","avgDailyTraffic":0,"year":1906},{"lon":"-88.6705166666667","lat":"44.9354666666667","avgDailyTraffic":47,"year":1957},{"lon":"-88.6535333333333","lat":"44.9364833333333","avgDailyTraffic":23,"year":1979},{"lon":"-87.9756638888889","lat":"44.4479138888889","avgDailyTraffic":3531,"year":1949},{"lon":"-88.0343138888889","lat":"44.6348527777778","avgDailyTraffic":1498,"year":1953},{"lon":"-91.7035388888889","lat":"44.5767472222222","avgDailyTraffic":4100,"year":1936},{"lon":"-91.2083333333333","lat":"45.1069722222222","avgDailyTraffic":169,"year":1995},{"lon":"-90.7037444444445","lat":"44.9151027777778","avgDailyTraffic":580,"year":1959},{"lon":"-90.7349166666667","lat":"44.8430888888889","avgDailyTraffic":58,"year":1937},{"lon":"-90.60545","lat":"44.77025","avgDailyTraffic":1856,"year":1988},{"lon":"-90.9225527777778","lat":"44.5356083333333","avgDailyTraffic":58,"year":1936},{"lon":"-89.3125","lat":"43.4873055555556","avgDailyTraffic":6200,"year":1969},{"lon":"-91.2169166666667","lat":"43.3644416666667","avgDailyTraffic":1920,"year":1931},{"lon":"-89.3125194444444","lat":"43.1645833333333","avgDailyTraffic":2028,"year":1960},{"lon":"-89.7950833333333","lat":"43.0703888888889","avgDailyTraffic":105,"year":1961},{"lon":"-88.8935833333333","lat":"43.3799333333333","avgDailyTraffic":1160,"year":1947},{"lon":"-92.080825","lat":"44.9167638888889","avgDailyTraffic":110,"year":1958},{"lon":"-91.4990833333333","lat":"44.8141388888889","avgDailyTraffic":2597,"year":1979},{"lon":"-88.0823333333333","lat":"45.7848333333333","avgDailyTraffic":3193,"year":1973},{"lon":"-88.45","lat":"43.7733611111111","avgDailyTraffic":9211,"year":1973},{"lon":"-88.3847111111111","lat":"43.7690527777778","avgDailyTraffic":2834,"year":1955},{"lon":"-88.3801638888889","lat":"43.7690138888889","avgDailyTraffic":2834,"year":1955},{"lon":"-88.1708444444445","lat":"43.7593083333333","avgDailyTraffic":1122,"year":1960},{"lon":"-90.51175","lat":"43.1278055555556","avgDailyTraffic":583,"year":1950},{"lon":"-90.8382833333333","lat":"43.0647694444444","avgDailyTraffic":470,"year":1988},{"lon":"-90.8379777777778","lat":"42.8127583333333","avgDailyTraffic":850,"year":1988},{"lon":"-90.1943166666667","lat":"43.1636583333333","avgDailyTraffic":2200,"year":1968},{"lon":"-91.1163138888889","lat":"44.0916916666667","avgDailyTraffic":780,"year":1959},{"lon":"-88.6913055555556","lat":"43.0857305555556","avgDailyTraffic":19800,"year":1977},{"lon":"-90.0569861111111","lat":"43.7966527777778","avgDailyTraffic":17650,"year":1994},{"lon":"-87.7030833333333","lat":"44.556","avgDailyTraffic":1727,"year":1958},{"lon":"-91.1014","lat":"43.90645","avgDailyTraffic":2142,"year":1955},{"lon":"-89.1283027777778","lat":"45.162375","avgDailyTraffic":4800,"year":1988},{"lon":"-89.5575361111111","lat":"45.17775","avgDailyTraffic":2100,"year":1983},{"lon":"-89.7164222222222","lat":"45.1787916666667","avgDailyTraffic":6300,"year":1927},{"lon":"-87.8214222222222","lat":"44.0980527777778","avgDailyTraffic":1688,"year":1962},{"lon":"-89.3311111111111","lat":"44.8957138888889","avgDailyTraffic":871,"year":1955},{"lon":"-88.0633138888889","lat":"43.14055","avgDailyTraffic":14800,"year":1971},{"lon":"-87.9256416666667","lat":"42.9446722222222","avgDailyTraffic":8319,"year":1976},{"lon":"-87.9328805555556","lat":"43.0323388888889","avgDailyTraffic":13800,"year":1986},{"lon":"-88.4084611111111","lat":"44.9158888888889","avgDailyTraffic":540,"year":1938},{"lon":"-87.9229972222222","lat":"43.1970944444444","avgDailyTraffic":9500,"year":1966},{"lon":"-90.2580972222222","lat":"45.5180638888889","avgDailyTraffic":759,"year":2017},{"lon":"-90.1924388888889","lat":"43.1693777777778","avgDailyTraffic":2200,"year":1989},{"lon":"-90.1924583333333","lat":"43.1724166666667","avgDailyTraffic":2200,"year":1989},{"lon":"-92.751025","lat":"44.9625388888889","avgDailyTraffic":87000,"year":2019},{"lon":"-89.8077472222222","lat":"43.6119916666667","avgDailyTraffic":603,"year":1961},{"lon":"-89.800725","lat":"43.4528388888889","avgDailyTraffic":738,"year":1941},{"lon":"-89.8597305555555","lat":"43.4450916666667","avgDailyTraffic":1086,"year":1941},{"lon":"-88.3939444444445","lat":"44.6027416666667","avgDailyTraffic":1500,"year":1951},{"lon":"-88.5686111111111","lat":"44.7913888888889","avgDailyTraffic":6695,"year":1958},{"lon":"-91.2676388888889","lat":"44.1646666666667","avgDailyTraffic":1410,"year":1948},{"lon":"-91.5410472222222","lat":"44.0699416666667","avgDailyTraffic":6400,"year":1956},{"lon":"-91.0171694444444","lat":"43.7100722222222","avgDailyTraffic":620,"year":1983},{"lon":"-90.85035","lat":"43.68725","avgDailyTraffic":336,"year":1927},{"lon":"-88.6558333333333","lat":"42.6372111111111","avgDailyTraffic":2376,"year":1982},{"lon":"-88.3446416666667","lat":"43.4373805555555","avgDailyTraffic":16100,"year":1953},{"lon":"-88.1220277777778","lat":"43.3439916666667","avgDailyTraffic":1391,"year":1975},{"lon":"-88.3253027777778","lat":"43.0499944444444","avgDailyTraffic":2900,"year":1962},{"lon":"-88.1058","lat":"43.0894694444444","avgDailyTraffic":10300,"year":2019},{"lon":"-88.5344305555556","lat":"43.0613833333333","avgDailyTraffic":1133,"year":1941},{"lon":"-89.1534416666667","lat":"44.4641416666667","avgDailyTraffic":1275,"year":1956},{"lon":"-91.8189666666667","lat":"45.2733722222222","avgDailyTraffic":1199,"year":1932},{"lon":"-91.8693277777778","lat":"45.3372777777778","avgDailyTraffic":730,"year":1965},{"lon":"-91.4160055555556","lat":"46.5708416666667","avgDailyTraffic":47,"year":1945},{"lon":"-91.3612583333333","lat":"46.5060222222222","avgDailyTraffic":425,"year":1955},{"lon":"-91.8013888888889","lat":"44.4658333333333","avgDailyTraffic":173,"year":1970},{"lon":"-91.6036111111111","lat":"44.5533333333333","avgDailyTraffic":444,"year":1976},{"lon":"-91.3122777777778","lat":"44.9263055555556","avgDailyTraffic":222,"year":1940},{"lon":"-90.4639","lat":"45.0020305555556","avgDailyTraffic":58,"year":1974},{"lon":"-90.4564305555556","lat":"44.6367416666667","avgDailyTraffic":185,"year":1966},{"lon":"-90.6337138888889","lat":"44.510625","avgDailyTraffic":58,"year":1928},{"lon":"-90.4043333333333","lat":"44.5680166666667","avgDailyTraffic":58,"year":1930},{"lon":"-90.6894722222222","lat":"43.3463055555556","avgDailyTraffic":20,"year":1950},{"lon":"-89.1693888888889","lat":"43.0898611111111","avgDailyTraffic":2898,"year":1914},{"lon":"-89.4499444444445","lat":"43.0841111111111","avgDailyTraffic":1602,"year":1957},{"lon":"-88.8344555555556","lat":"43.2926166666667","avgDailyTraffic":31,"year":1920},{"lon":"-88.5357833333333","lat":"43.5586777777778","avgDailyTraffic":58,"year":1968},{"lon":"-91.296","lat":"44.6440555555556","avgDailyTraffic":358,"year":1984},{"lon":"-91.0720555555556","lat":"44.8571111111111","avgDailyTraffic":102,"year":1967},{"lon":"-91.3101666666667","lat":"44.6107777777778","avgDailyTraffic":205,"year":1979},{"lon":"-91.3671666666667","lat":"44.6526111111111","avgDailyTraffic":358,"year":1930},{"lon":"-91.0750833333333","lat":"44.8433333333333","avgDailyTraffic":102,"year":1970},{"lon":"-88.3656","lat":"43.6044","avgDailyTraffic":201,"year":1929},{"lon":"-88.5237","lat":"43.7661972222222","avgDailyTraffic":360,"year":1975},{"lon":"-88.4560277777778","lat":"43.77875","avgDailyTraffic":6890,"year":1968},{"lon":"-88.4494722222222","lat":"43.7761666666667","avgDailyTraffic":411,"year":1968},{"lon":"-88.4489166666667","lat":"43.7771111111111","avgDailyTraffic":3392,"year":1965},{"lon":"-88.4619444444444","lat":"43.7721388888889","avgDailyTraffic":6003,"year":1965},{"lon":"-88.4435277777778","lat":"43.7975277777778","avgDailyTraffic":587,"year":1927},{"lon":"-88.4317222222222","lat":"43.7879166666667","avgDailyTraffic":1762,"year":1926},{"lon":"-88.8203833333333","lat":"43.642175","avgDailyTraffic":159,"year":1931},{"lon":"-90.6301666666667","lat":"42.6833611111111","avgDailyTraffic":104,"year":1955},{"lon":"-90.6291111111111","lat":"43.1051111111111","avgDailyTraffic":53,"year":1920},{"lon":"-89.5429666666667","lat":"42.5213333333333","avgDailyTraffic":189,"year":1970},{"lon":"-89.78865","lat":"42.6928833333333","avgDailyTraffic":313,"year":1957},{"lon":"-89.5055166666667","lat":"42.6572166666667","avgDailyTraffic":432,"year":1961},{"lon":"-89.56905","lat":"42.5320666666667","avgDailyTraffic":559,"year":1956},{"lon":"-89.97625","lat":"43.0815555555556","avgDailyTraffic":390,"year":1940},{"lon":"-90.1724444444445","lat":"42.9396388888889","avgDailyTraffic":156,"year":1930},{"lon":"-90.9611666666667","lat":"44.2316111111111","avgDailyTraffic":163,"year":1963},{"lon":"-90.3372777777778","lat":"44.4126388888889","avgDailyTraffic":141,"year":1964},{"lon":"-90.6372777777778","lat":"44.1949166666667","avgDailyTraffic":250,"year":1956},{"lon":"-91.1620333333333","lat":"43.9739333333333","avgDailyTraffic":560,"year":1955},{"lon":"-89.1498888888889","lat":"45.1376944444444","avgDailyTraffic":1597,"year":1935},{"lon":"-89.1643888888889","lat":"45.1073611111111","avgDailyTraffic":314,"year":1967},{"lon":"-89.4666416666667","lat":"45.1805861111111","avgDailyTraffic":414,"year":1952},{"lon":"-89.718925","lat":"45.1710472222222","avgDailyTraffic":2032,"year":1967},{"lon":"-87.7654111111111","lat":"44.1347055555556","avgDailyTraffic":835,"year":1957},{"lon":"-87.8088694444444","lat":"43.9136138888889","avgDailyTraffic":50,"year":1918},{"lon":"-87.6807861111111","lat":"44.1747027777778","avgDailyTraffic":1204,"year":1964},{"lon":"-89.4026305555556","lat":"45.0884972222222","avgDailyTraffic":502,"year":1959},{"lon":"-89.82325","lat":"44.9732416666667","avgDailyTraffic":190,"year":1939},{"lon":"-89.4528472222222","lat":"45.00235","avgDailyTraffic":84,"year":1983},{"lon":"-90.198825","lat":"44.7805416666667","avgDailyTraffic":82,"year":1929},{"lon":"-87.9584722222222","lat":"45.0703611111111","avgDailyTraffic":75,"year":1925},{"lon":"-88.0268638888889","lat":"43.1557944444444","avgDailyTraffic":1700,"year":1988},{"lon":"-87.9261833333333","lat":"43.1041972222222","avgDailyTraffic":11440,"year":1997},{"lon":"-88.0124388888889","lat":"43.0387361111111","avgDailyTraffic":8712,"year":1934},{"lon":"-90.3524833333333","lat":"44.0208166666667","avgDailyTraffic":1199,"year":1955},{"lon":"-88.6410333333333","lat":"44.3343166666667","avgDailyTraffic":940,"year":1920},{"lon":"-88.2666","lat":"44.2770833333333","avgDailyTraffic":6464,"year":1981},{"lon":"-88.4041666666667","lat":"44.2566666666667","avgDailyTraffic":2972,"year":1969},{"lon":"-91.9113388888889","lat":"44.6304805555556","avgDailyTraffic":87,"year":1973},{"lon":"-92.354","lat":"45.4466666666667","avgDailyTraffic":10,"year":1965},{"lon":"-90.3977777777778","lat":"43.3444444444444","avgDailyTraffic":117,"year":1966},{"lon":"-89.0636111111111","lat":"42.8333333333333","avgDailyTraffic":300,"year":1968},{"lon":"-88.9100555555556","lat":"42.6043055555556","avgDailyTraffic":20,"year":1929},{"lon":"-90.8938055555556","lat":"45.461","avgDailyTraffic":531,"year":1962},{"lon":"-90.9976388888889","lat":"45.4499444444444","avgDailyTraffic":781,"year":1958},{"lon":"-90.8843333333333","lat":"45.518","avgDailyTraffic":141,"year":1964},{"lon":"-92.4631972222222","lat":"45.1224583333333","avgDailyTraffic":1116,"year":1979},{"lon":"-89.89625","lat":"43.4331277777778","avgDailyTraffic":125,"year":1930},{"lon":"-89.7984416666667","lat":"43.3620638888889","avgDailyTraffic":133,"year":1917},{"lon":"-91.3394722222222","lat":"46.1595277777778","avgDailyTraffic":30,"year":1914},{"lon":"-88.9466666666667","lat":"44.8555555555556","avgDailyTraffic":120,"year":1920},{"lon":"-87.8219666666667","lat":"43.6520416666667","avgDailyTraffic":270,"year":1931},{"lon":"-87.9912444444444","lat":"43.76625","avgDailyTraffic":47,"year":1966},{"lon":"-87.9716583333333","lat":"43.734575","avgDailyTraffic":141,"year":1970},{"lon":"-87.8790666666667","lat":"43.7765277777778","avgDailyTraffic":35,"year":1906},{"lon":"-90.2148611111111","lat":"45.3117777777778","avgDailyTraffic":638,"year":1926},{"lon":"-91.5160833333333","lat":"44.3736666666667","avgDailyTraffic":15,"year":1935},{"lon":"-91.4328888888889","lat":"44.2737222222222","avgDailyTraffic":58,"year":1975},{"lon":"-91.29225","lat":"44.4873055555556","avgDailyTraffic":108,"year":1950},{"lon":"-91.2349444444445","lat":"44.2634444444444","avgDailyTraffic":47,"year":1962},{"lon":"-91.369","lat":"44.2775833333333","avgDailyTraffic":47,"year":1963},{"lon":"-90.9428","lat":"43.65295","avgDailyTraffic":94,"year":1935},{"lon":"-90.9201","lat":"43.4451166666667","avgDailyTraffic":47,"year":1981},{"lon":"-90.9113","lat":"43.5296333333333","avgDailyTraffic":23,"year":1980},{"lon":"-90.4946833333333","lat":"43.6436833333333","avgDailyTraffic":292,"year":1960},{"lon":"-90.9828333333333","lat":"43.6909333333333","avgDailyTraffic":10,"year":1985},{"lon":"-88.4860277777778","lat":"42.497175","avgDailyTraffic":47,"year":1920},{"lon":"-88.4005972222222","lat":"43.4642305555556","avgDailyTraffic":47,"year":1927},{"lon":"-88.1280194444444","lat":"43.352175","avgDailyTraffic":205,"year":1930},{"lon":"-88.3899666666667","lat":"43.3206138888889","avgDailyTraffic":3638,"year":1974},{"lon":"-88.0774416666667","lat":"43.4893527777778","avgDailyTraffic":325,"year":1962},{"lon":"-88.2332527777778","lat":"43.4991777777778","avgDailyTraffic":728,"year":1930},{"lon":"-88.1714305555556","lat":"43.0526333333333","avgDailyTraffic":500,"year":1973},{"lon":"-88.1380555555556","lat":"43.0341666666667","avgDailyTraffic":4944,"year":1984},{"lon":"-88.138925","lat":"43.0312194444444","avgDailyTraffic":3708,"year":1986},{"lon":"-90.1188611111111","lat":"44.4823666666667","avgDailyTraffic":702,"year":1957},{"lon":"-90.11995","lat":"44.6305083333333","avgDailyTraffic":40,"year":1965},{"lon":"-89.7620027777778","lat":"46.0210638888889","avgDailyTraffic":20,"year":1994},{"lon":"-88.7040305555556","lat":"45.8999","avgDailyTraffic":50,"year":1980},{"lon":"-90.6538055555556","lat":"46.1039444444444","avgDailyTraffic":25,"year":1987},{"lon":"-90.9398138888889","lat":"46.6140611111111","avgDailyTraffic":7000,"year":1953},{"lon":"-91.5106166666667","lat":"46.2346583333333","avgDailyTraffic":900,"year":1982},{"lon":"-91.0865305555556","lat":"46.2311888888889","avgDailyTraffic":555,"year":1971},{"lon":"-91.0611305555556","lat":"46.4137694444444","avgDailyTraffic":75,"year":1984},{"lon":"-91.0530805555556","lat":"46.5372833333333","avgDailyTraffic":2100,"year":1982},{"lon":"-91.5446111111111","lat":"46.2870194444444","avgDailyTraffic":35,"year":1938},{"lon":"-88.0987861111111","lat":"44.4451138888889","avgDailyTraffic":6699,"year":1965},{"lon":"-91.9130305555556","lat":"44.3528777777778","avgDailyTraffic":990,"year":1986},{"lon":"-92.0241555555556","lat":"44.4340888888889","avgDailyTraffic":2300,"year":1991},{"lon":"-92.0344888888889","lat":"44.4343972222222","avgDailyTraffic":2300,"year":1990},{"lon":"-92.0445694444444","lat":"44.4347083333333","avgDailyTraffic":2300,"year":1991},{"lon":"-92.0477888888889","lat":"44.4347944444444","avgDailyTraffic":2300,"year":1990},{"lon":"-92.05265","lat":"44.4349388888889","avgDailyTraffic":2300,"year":1991},{"lon":"-92.0599138888889","lat":"44.4351611111111","avgDailyTraffic":2300,"year":1990},{"lon":"-91.1629527777778","lat":"45.1825888888889","avgDailyTraffic":710,"year":1962},{"lon":"-91.2141555555556","lat":"44.9294666666667","avgDailyTraffic":2300,"year":1992},{"lon":"-90.3268222222222","lat":"44.8513083333333","avgDailyTraffic":672,"year":1979},{"lon":"-90.4340694444444","lat":"45.0072722222222","avgDailyTraffic":979,"year":1995},{"lon":"-90.6402555555556","lat":"44.9516638888889","avgDailyTraffic":935,"year":1993},{"lon":"-91.1331944444444","lat":"43.1689444444444","avgDailyTraffic":219,"year":1986},{"lon":"-90.8444916666667","lat":"43.2333083333333","avgDailyTraffic":510,"year":1979},{"lon":"-89.7515277777778","lat":"43.1355555555556","avgDailyTraffic":1146,"year":1951},{"lon":"-89.7830555555555","lat":"43.0591388888889","avgDailyTraffic":440,"year":1961},{"lon":"-89.3303416666667","lat":"43.1067305555556","avgDailyTraffic":15000,"year":1964},{"lon":"-89.66025","lat":"43.1131111111111","avgDailyTraffic":1597,"year":1962},{"lon":"-89.1687222222222","lat":"42.8607777777778","avgDailyTraffic":654,"year":1963},{"lon":"-89.3496388888889","lat":"43.2163055555556","avgDailyTraffic":822,"year":1964},{"lon":"-89.5510555555555","lat":"43.1138055555556","avgDailyTraffic":117,"year":1966},{"lon":"-89.5663055555556","lat":"42.9729166666667","avgDailyTraffic":88,"year":1981},{"lon":"-89.2899444444444","lat":"42.8916666666667","avgDailyTraffic":146,"year":1941},{"lon":"-88.4287694444445","lat":"43.3291666666667","avgDailyTraffic":233,"year":1982},{"lon":"-92.1268","lat":"46.665975","avgDailyTraffic":2700,"year":1990},{"lon":"-92.0949583333333","lat":"45.1387527777778","avgDailyTraffic":406,"year":1955},{"lon":"-92.1091611111111","lat":"44.7802777777778","avgDailyTraffic":1300,"year":1989},{"lon":"-91.4535361111111","lat":"44.7951222222222","avgDailyTraffic":18600,"year":1988},{"lon":"-88.2122805555556","lat":"43.8157888888889","avgDailyTraffic":686,"year":1964},{"lon":"-91.0931388888889","lat":"42.9034166666667","avgDailyTraffic":901,"year":1963},{"lon":"-89.6305333333333","lat":"42.8146","avgDailyTraffic":590,"year":1976},{"lon":"-90.0147777777778","lat":"42.8853888888889","avgDailyTraffic":200,"year":1963},{"lon":"-90.1950583333333","lat":"46.4667555555556","avgDailyTraffic":2800,"year":1990},{"lon":"-91.0255","lat":"43.8248333333333","avgDailyTraffic":214,"year":1976},{"lon":"-89.0188472222222","lat":"45.3647638888889","avgDailyTraffic":329,"year":1969},{"lon":"-89.7767083333333","lat":"45.3237111111111","avgDailyTraffic":212,"year":1978},{"lon":"-89.8855722222222","lat":"45.1851472222222","avgDailyTraffic":292,"year":1980},{"lon":"-87.9253472222222","lat":"44.0752333333333","avgDailyTraffic":1033,"year":1961},{"lon":"-89.7670305555556","lat":"44.6867972222222","avgDailyTraffic":420,"year":1959},{"lon":"-90.2394222222222","lat":"44.9601222222222","avgDailyTraffic":261,"year":1984},{"lon":"-89.7949388888889","lat":"45.06155","avgDailyTraffic":50,"year":1991},{"lon":"-87.6356","lat":"45.1064833333333","avgDailyTraffic":8132,"year":2017},{"lon":"-89.2178416666667","lat":"43.8308166666667","avgDailyTraffic":3100,"year":1990},{"lon":"-89.4941638888889","lat":"43.8880833333333","avgDailyTraffic":2825,"year":1929},{"lon":"-87.9179333333333","lat":"43.1028305555556","avgDailyTraffic":108000,"year":1983},{"lon":"-87.9181","lat":"43.0999638888889","avgDailyTraffic":132000,"year":1974},{"lon":"-87.9982555555556","lat":"42.9622333333333","avgDailyTraffic":5800,"year":1966},{"lon":"-87.9882777777778","lat":"42.9620888888889","avgDailyTraffic":15100,"year":1966},{"lon":"-88.0553833333333","lat":"43.1343388888889","avgDailyTraffic":62000,"year":1986},{"lon":"-88.0548333333333","lat":"43.1338416666667","avgDailyTraffic":62000,"year":1986},{"lon":"-87.9237194444444","lat":"42.9943138888889","avgDailyTraffic":2305,"year":1992},{"lon":"-90.8406638888889","lat":"44.0912916666667","avgDailyTraffic":3500,"year":1989},{"lon":"-88.124075","lat":"44.9424666666667","avgDailyTraffic":201,"year":1981},{"lon":"-89.1255555555556","lat":"45.8327777777778","avgDailyTraffic":385,"year":1996},{"lon":"-92.0669722222222","lat":"44.6544277777778","avgDailyTraffic":233,"year":1985},{"lon":"-89.3068611111111","lat":"44.4672611111111","avgDailyTraffic":3438,"year":2006},{"lon":"-88.1671527777778","lat":"42.7637361111111","avgDailyTraffic":293,"year":1965},{"lon":"-90.4655555555556","lat":"43.4866666666667","avgDailyTraffic":316,"year":1954},{"lon":"-88.9748361111111","lat":"42.5278916666667","avgDailyTraffic":6730,"year":1990},{"lon":"-88.9849111111111","lat":"42.7173138888889","avgDailyTraffic":29500,"year":2015},{"lon":"-90.7204722222222","lat":"45.5913333333333","avgDailyTraffic":314,"year":1950},{"lon":"-91.155","lat":"45.3027777777778","avgDailyTraffic":662,"year":1949},{"lon":"-91.2803666666667","lat":"45.4821055555556","avgDailyTraffic":880,"year":1958},{"lon":"-90.9929361111111","lat":"45.3050083333333","avgDailyTraffic":527,"year":1959},{"lon":"-92.249425","lat":"44.9335972222222","avgDailyTraffic":16050,"year":2002},{"lon":"-90.4562222222222","lat":"45.0738888888889","avgDailyTraffic":553,"year":1970},{"lon":"-91.2261583333333","lat":"44.5793055555556","avgDailyTraffic":4300,"year":1965},{"lon":"-90.4175333333333","lat":"43.5637166666667","avgDailyTraffic":325,"year":1977},{"lon":"-88.7078111111111","lat":"42.5720305555556","avgDailyTraffic":235,"year":1956},{"lon":"-89.1148444444444","lat":"44.3560333333333","avgDailyTraffic":15150,"year":1996},{"lon":"-90.1398694444445","lat":"44.2499111111111","avgDailyTraffic":1100,"year":1981},{"lon":"-92.2519805555556","lat":"44.8673805555556","avgDailyTraffic":25,"year":1950},{"lon":"8.927","lat":"43.9480611111111","avgDailyTraffic":2,"year":1999},{"lon":"-91.8890444444445","lat":"45.4101944444444","avgDailyTraffic":470,"year":1965},{"lon":"-91.7933833333333","lat":"45.4155833333333","avgDailyTraffic":94,"year":1934},{"lon":"-92.0481722222222","lat":"45.4239861111111","avgDailyTraffic":23,"year":1950},{"lon":"-91.5643166666667","lat":"45.2695277777778","avgDailyTraffic":88,"year":1934},{"lon":"-91.9390555555556","lat":"45.4233833333333","avgDailyTraffic":47,"year":1980},{"lon":"-91.8258333333333","lat":"45.2733833333333","avgDailyTraffic":94,"year":1940},{"lon":"-91.9728055555556","lat":"45.284025","avgDailyTraffic":926,"year":1963},{"lon":"-92.0540166666667","lat":"45.2178111111111","avgDailyTraffic":20,"year":1935},{"lon":"-92.0720972222222","lat":"45.4306027777778","avgDailyTraffic":23,"year":1940},{"lon":"-91.6970083333333","lat":"45.4226","avgDailyTraffic":94,"year":1973},{"lon":"-91.7401305555556","lat":"45.2801111111111","avgDailyTraffic":82,"year":1981},{"lon":"-91.0635444444444","lat":"46.5492027777778","avgDailyTraffic":117,"year":1925},{"lon":"-91.4045305555556","lat":"46.7736472222222","avgDailyTraffic":53,"year":1950},{"lon":"-88.0804666666667","lat":"44.5210833333333","avgDailyTraffic":5158,"year":1970},{"lon":"-87.8973666666667","lat":"44.5019333333333","avgDailyTraffic":323,"year":1970},{"lon":"-91.7733333333333","lat":"44.3158333333333","avgDailyTraffic":271,"year":1952},{"lon":"-91.8902777777778","lat":"44.5133333333333","avgDailyTraffic":47,"year":1973},{"lon":"-91.835","lat":"44.4366666666667","avgDailyTraffic":47,"year":1915},{"lon":"-91.7538888888889","lat":"44.3780555555556","avgDailyTraffic":10,"year":1980},{"lon":"-91.8627777777778","lat":"44.5869444444444","avgDailyTraffic":10,"year":1979},{"lon":"-91.8172222222222","lat":"44.4838888888889","avgDailyTraffic":20,"year":1982},{"lon":"-92.6310277777778","lat":"45.7853333333333","avgDailyTraffic":205,"year":1977},{"lon":"-88.1838888888889","lat":"44.0933333333333","avgDailyTraffic":102,"year":1975},{"lon":"-91.0301111111111","lat":"44.9298055555556","avgDailyTraffic":392,"year":1960},{"lon":"-91.1644444444445","lat":"45.0673055555556","avgDailyTraffic":190,"year":1959},{"lon":"-91.4986388888889","lat":"45.1203611111111","avgDailyTraffic":190,"year":1934},{"lon":"-91.0656666666667","lat":"44.8717777777778","avgDailyTraffic":180,"year":2006},{"lon":"-91.2562083333333","lat":"44.8860805555556","avgDailyTraffic":392,"year":1959},{"lon":"-91.1860277777778","lat":"44.897","avgDailyTraffic":190,"year":1948},{"lon":"-90.9423611111111","lat":"44.96775","avgDailyTraffic":347,"year":1929},{"lon":"-91.5546944444444","lat":"44.9601111111111","avgDailyTraffic":390,"year":1954},{"lon":"-90.9224166666667","lat":"44.8856666666667","avgDailyTraffic":95,"year":1928},{"lon":"-91.4751388888889","lat":"44.9590555555556","avgDailyTraffic":169,"year":1950},{"lon":"-90.9226805555556","lat":"44.933475","avgDailyTraffic":417,"year":1961},{"lon":"-90.4600972222222","lat":"44.9876166666667","avgDailyTraffic":58,"year":1963},{"lon":"-90.9185472222222","lat":"44.8791277777778","avgDailyTraffic":58,"year":1958},{"lon":"-90.3567222222222","lat":"44.8934722222222","avgDailyTraffic":116,"year":1969},{"lon":"-90.4082888888889","lat":"44.8211416666667","avgDailyTraffic":58,"year":1959},{"lon":"-90.8913611111111","lat":"44.5251944444444","avgDailyTraffic":58,"year":1965},{"lon":"-90.578675","lat":"44.5292611111111","avgDailyTraffic":87,"year":1986},{"lon":"-90.5375555555556","lat":"44.5441944444444","avgDailyTraffic":58,"year":1988},{"lon":"-90.4164888888889","lat":"44.5937861111111","avgDailyTraffic":58,"year":1972},{"lon":"-90.4968333333333","lat":"44.5053888888889","avgDailyTraffic":92,"year":1957},{"lon":"-90.7411055555556","lat":"44.5487527777778","avgDailyTraffic":208,"year":1924},{"lon":"-90.6375277777778","lat":"44.8718611111111","avgDailyTraffic":25,"year":1965},{"lon":"-90.8882222222222","lat":"44.9736111111111","avgDailyTraffic":58,"year":1961},{"lon":"-90.4971388888889","lat":"44.698","avgDailyTraffic":58,"year":1967},{"lon":"-89.4354916666667","lat":"43.4558694444444","avgDailyTraffic":466,"year":1956},{"lon":"-89.4249111111111","lat":"43.6362222222222","avgDailyTraffic":500,"year":1958},{"lon":"-89.1197","lat":"43.3552194444444","avgDailyTraffic":56,"year":1961},{"lon":"-90.6906111111111","lat":"43.3454166666667","avgDailyTraffic":219,"year":1961},{"lon":"-90.7537944444444","lat":"43.2323666666667","avgDailyTraffic":94,"year":1930},{"lon":"-90.6816472222222","lat":"43.2692722222222","avgDailyTraffic":170,"year":1920},{"lon":"-90.6875833333333","lat":"43.3765","avgDailyTraffic":10,"year":1961},{"lon":"-89.8358055555556","lat":"43.1285555555556","avgDailyTraffic":176,"year":1974},{"lon":"-89.1655","lat":"43.0728055555556","avgDailyTraffic":47,"year":1973},{"lon":"-88.5461583333333","lat":"43.3851666666667","avgDailyTraffic":146,"year":1976},{"lon":"-88.4359472222222","lat":"43.3704222222222","avgDailyTraffic":58,"year":1965},{"lon":"-88.6941444444444","lat":"43.2730138888889","avgDailyTraffic":10,"year":1960},{"lon":"-91.8886111111111","lat":"46.549","avgDailyTraffic":86,"year":1925},{"lon":"-91.5811388888889","lat":"46.2620833333333","avgDailyTraffic":107,"year":1967},{"lon":"-91.9808111111111","lat":"44.962175","avgDailyTraffic":29,"year":1934},{"lon":"-92.1154388888889","lat":"44.9888361111111","avgDailyTraffic":203,"year":1940},{"lon":"-92.0848361111111","lat":"45.1451166666667","avgDailyTraffic":365,"year":1988},{"lon":"-91.2349166666667","lat":"44.6834444444444","avgDailyTraffic":153,"year":1953},{"lon":"-91.0975277777778","lat":"44.84","avgDailyTraffic":58,"year":1966},{"lon":"-88.8158888888889","lat":"45.6833611111111","avgDailyTraffic":30,"year":1921},{"lon":"-90.78225","lat":"43.0283888888889","avgDailyTraffic":53,"year":1919},{"lon":"-90.7133611111111","lat":"42.9198888888889","avgDailyTraffic":53,"year":1950},{"lon":"-90.8511111111111","lat":"42.6825555555556","avgDailyTraffic":240,"year":1890},{"lon":"-90.8737777777778","lat":"42.7724166666667","avgDailyTraffic":37,"year":1950},{"lon":"-90.8185277777778","lat":"42.9379722222222","avgDailyTraffic":102,"year":1950},{"lon":"-90.903","lat":"42.8872777777778","avgDailyTraffic":434,"year":1941},{"lon":"-90.4504444444444","lat":"42.6320277777778","avgDailyTraffic":50,"year":1950},{"lon":"-88.9051944444444","lat":"43.7314277777778","avgDailyTraffic":374,"year":1925},{"lon":"-90.3512777777778","lat":"42.8918333333333","avgDailyTraffic":327,"year":1973},{"lon":"-90.3265833333333","lat":"42.81725","avgDailyTraffic":145,"year":1929},{"lon":"-89.9340833333333","lat":"43.1129166666667","avgDailyTraffic":400,"year":1948},{"lon":"-90.4471944444444","lat":"46.4713888888889","avgDailyTraffic":38,"year":1924},{"lon":"-90.2637777777778","lat":"46.4858888888889","avgDailyTraffic":28,"year":1957},{"lon":"-91.2105833333333","lat":"43.9721333333333","avgDailyTraffic":1173,"year":1969},{"lon":"-91.1408833333333","lat":"43.7688333333333","avgDailyTraffic":40,"year":1961},{"lon":"-91.0449166666667","lat":"43.8287666666667","avgDailyTraffic":20,"year":1965},{"lon":"-90.1173333333333","lat":"42.6488972222222","avgDailyTraffic":88,"year":1964},{"lon":"-90.3086333333333","lat":"42.5500333333333","avgDailyTraffic":293,"year":1940},{"lon":"-90.1135333333333","lat":"42.5595055555556","avgDailyTraffic":88,"year":1930},{"lon":"-89.8601666666667","lat":"42.7379138888889","avgDailyTraffic":5,"year":1930},{"lon":"-89.4243333333333","lat":"45.37675","avgDailyTraffic":14,"year":1922},{"lon":"-89.4637333333333","lat":"45.5494333333333","avgDailyTraffic":113,"year":1922},{"lon":"-89.9699972222222","lat":"45.5367083333333","avgDailyTraffic":80,"year":1971},{"lon":"-89.46575","lat":"45.3076055555556","avgDailyTraffic":79,"year":1967},{"lon":"-89.7967444444444","lat":"45.1382111111111","avgDailyTraffic":66,"year":1920},{"lon":"-87.6704555555556","lat":"44.1332861111111","avgDailyTraffic":3906,"year":1958},{"lon":"-87.9783638888889","lat":"44.2257027777778","avgDailyTraffic":777,"year":1970},{"lon":"-89.8176416666667","lat":"45.1053138888889","avgDailyTraffic":30,"year":1940},{"lon":"-90.1591472222222","lat":"45.0765166666667","avgDailyTraffic":676,"year":1958},{"lon":"-90.2311972222222","lat":"44.9744777777778","avgDailyTraffic":185,"year":1952},{"lon":"-89.7333416666667","lat":"45.0164722222222","avgDailyTraffic":90,"year":1991},{"lon":"-89.7128888888889","lat":"44.9893666666667","avgDailyTraffic":90,"year":1955},{"lon":"-90.1784194444444","lat":"44.9164194444444","avgDailyTraffic":30,"year":1950},{"lon":"-90.2693472222222","lat":"44.8877638888889","avgDailyTraffic":90,"year":1955},{"lon":"-90.2552194444444","lat":"44.7789611111111","avgDailyTraffic":42,"year":1965},{"lon":"-89.6599527777778","lat":"44.8114083333333","avgDailyTraffic":170,"year":1972},{"lon":"-89.3405361111111","lat":"44.8911194444444","avgDailyTraffic":361,"year":1958},{"lon":"-90.2387444444444","lat":"44.6932055555556","avgDailyTraffic":47,"year":1947},{"lon":"-89.4277666666667","lat":"44.9155888888889","avgDailyTraffic":50,"year":1964},{"lon":"-90.0850833333333","lat":"44.6850277777778","avgDailyTraffic":90,"year":1956},{"lon":"-89.5164638888889","lat":"45.1196194444444","avgDailyTraffic":241,"year":1965},{"lon":"-90.2786166666667","lat":"45.0262388888889","avgDailyTraffic":90,"year":1930},{"lon":"-87.9375277777778","lat":"45.07825","avgDailyTraffic":75,"year":1966},{"lon":"-89.3196694444444","lat":"43.9377138888889","avgDailyTraffic":150,"year":1977},{"lon":"-87.94475","lat":"43.17025","avgDailyTraffic":1400,"year":1935},{"lon":"-87.9119166666667","lat":"43.0488638888889","avgDailyTraffic":2908,"year":1940},{"lon":"-87.9033388888889","lat":"43.0536111111111","avgDailyTraffic":9300,"year":1926},{"lon":"-90.37365","lat":"43.87175","avgDailyTraffic":250,"year":1940},{"lon":"-88.2616361111111","lat":"44.3489666666667","avgDailyTraffic":47,"year":1960},{"lon":"-88.5368","lat":"44.3665166666667","avgDailyTraffic":1127,"year":1958},{"lon":"-88.4486333333333","lat":"44.5370333333333","avgDailyTraffic":88,"year":1924},{"lon":"-88.2966805555556","lat":"44.3083666666667","avgDailyTraffic":205,"year":1966},{"lon":"-88.2927888888889","lat":"44.3139","avgDailyTraffic":1313,"year":1963},{"lon":"-87.8733055555555","lat":"43.4558333333333","avgDailyTraffic":58,"year":1951},{"lon":"-91.741125","lat":"44.6067027777778","avgDailyTraffic":93,"year":1977},{"lon":"-92.6410444444444","lat":"44.6577361111111","avgDailyTraffic":87,"year":1925},{"lon":"-92.4507111111111","lat":"44.6960777777778","avgDailyTraffic":25,"year":1920},{"lon":"-92.259","lat":"45.5973333333333","avgDailyTraffic":123,"year":1955},{"lon":"-92.167","lat":"45.4701666666667","avgDailyTraffic":43,"year":1977},{"lon":"-92.3786","lat":"45.42825","avgDailyTraffic":10,"year":1961},{"lon":"-92.239","lat":"45.4541666666667","avgDailyTraffic":20,"year":1952},{"lon":"-92.32","lat":"45.282","avgDailyTraffic":43,"year":1963},{"lon":"-92.199","lat":"45.7226666666667","avgDailyTraffic":43,"year":1964},{"lon":"-89.2499083333333","lat":"44.601375","avgDailyTraffic":60,"year":1918},{"lon":"-89.3125722222222","lat":"44.4691916666667","avgDailyTraffic":1268,"year":1908},{"lon":"-90.3643055555555","lat":"45.5337777777778","avgDailyTraffic":101,"year":1921},{"lon":"-90.2486388888889","lat":"45.6739444444444","avgDailyTraffic":58,"year":1936},{"lon":"-90.0786111111111","lat":"45.4666944444444","avgDailyTraffic":12,"year":1924},{"lon":"-88.0204805555556","lat":"42.6985944444444","avgDailyTraffic":1329,"year":1985},{"lon":"-89.0993055555555","lat":"42.6571111111111","avgDailyTraffic":411,"year":1918},{"lon":"-88.9225","lat":"42.5828888888889","avgDailyTraffic":1,"year":1910},{"lon":"-91.4266666666667","lat":"45.3641666666667","avgDailyTraffic":43,"year":1970},{"lon":"-91.3727222222222","lat":"45.3439166666667","avgDailyTraffic":54,"year":1978},{"lon":"-91.28","lat":"45.5366666666667","avgDailyTraffic":43,"year":1955},{"lon":"-92.5416611111111","lat":"44.8987444444444","avgDailyTraffic":436,"year":1965},{"lon":"-89.9413666666667","lat":"43.6298","avgDailyTraffic":1115,"year":1974},{"lon":"-90.0039666666667","lat":"43.4656972222222","avgDailyTraffic":136,"year":1967},{"lon":"-89.7706277777778","lat":"43.3447194444444","avgDailyTraffic":40,"year":1940},{"lon":"-90.0554166666667","lat":"43.293075","avgDailyTraffic":458,"year":1955},{"lon":"-90.925","lat":"45.8769666666667","avgDailyTraffic":21,"year":1970},{"lon":"-91.0284111111111","lat":"45.7671138888889","avgDailyTraffic":86,"year":1945},{"lon":"-90.9660972222222","lat":"45.8273888888889","avgDailyTraffic":43,"year":1970},{"lon":"-88.4266666666667","lat":"44.6027777777778","avgDailyTraffic":101,"year":1920},{"lon":"-88.1204111111111","lat":"43.772725","avgDailyTraffic":94,"year":1965},{"lon":"-91.2763611111111","lat":"44.4603055555556","avgDailyTraffic":412,"year":1960},{"lon":"-91.4306111111111","lat":"44.3883888888889","avgDailyTraffic":94,"year":1968},{"lon":"-91.19475","lat":"44.298","avgDailyTraffic":470,"year":1959},{"lon":"-91.1780277777778","lat":"44.2107222222222","avgDailyTraffic":80,"year":1964},{"lon":"-91.251","lat":"44.19375","avgDailyTraffic":20,"year":1980},{"lon":"-91.476","lat":"44.0653055555556","avgDailyTraffic":47,"year":1954},{"lon":"-91.4370833333333","lat":"44.2468888888889","avgDailyTraffic":20,"year":1950},{"lon":"-91.3328055555556","lat":"44.1646111111111","avgDailyTraffic":94,"year":1950},{"lon":"-91.4067777777778","lat":"44.2288055555556","avgDailyTraffic":47,"year":1962},{"lon":"-91.1778888888889","lat":"44.4226388888889","avgDailyTraffic":303,"year":1960},{"lon":"-91.2774722222222","lat":"44.4587222222222","avgDailyTraffic":412,"year":1968},{"lon":"-90.7837833333333","lat":"43.6445833333333","avgDailyTraffic":205,"year":1925},{"lon":"-90.68415","lat":"43.5584166666667","avgDailyTraffic":23,"year":1950},{"lon":"-90.4385333333333","lat":"43.5825166666667","avgDailyTraffic":20,"year":1969},{"lon":"-90.7064333333333","lat":"43.6551166666667","avgDailyTraffic":10,"year":1940},{"lon":"-90.8294666666667","lat":"43.4769","avgDailyTraffic":100,"year":1969},{"lon":"-90.9872222222222","lat":"43.4847666666667","avgDailyTraffic":47,"year":1955},{"lon":"-90.3525166666667","lat":"43.6342333333333","avgDailyTraffic":499,"year":1974},{"lon":"-89.2633333333333","lat":"46.0909722222222","avgDailyTraffic":228,"year":1962},{"lon":"-89.9370555555556","lat":"45.9820555555556","avgDailyTraffic":71,"year":1958},{"lon":"-88.4620666666667","lat":"42.5054111111111","avgDailyTraffic":94,"year":1920},{"lon":"-88.4876361111111","lat":"42.5600861111111","avgDailyTraffic":40,"year":1930},{"lon":"-88.3898166666667","lat":"43.4628888888889","avgDailyTraffic":58,"year":1925},{"lon":"-88.52335","lat":"44.1219833333333","avgDailyTraffic":35,"year":1960},{"lon":"-90.2183777777778","lat":"44.6563472222222","avgDailyTraffic":60,"year":1980},{"lon":"-90.1981055555556","lat":"44.5829527777778","avgDailyTraffic":47,"year":1979},{"lon":"-89.7970888888889","lat":"44.3513777777778","avgDailyTraffic":1704,"year":1994},{"lon":"-89.9619138888889","lat":"44.5982333333333","avgDailyTraffic":40,"year":1996},{"lon":"-90.9224361111111","lat":"46.636525","avgDailyTraffic":7000,"year":1986},{"lon":"-88.1523305555556","lat":"44.2700138888889","avgDailyTraffic":1319,"year":1969},{"lon":"-90.3160833333333","lat":"44.9783055555556","avgDailyTraffic":7100,"year":1981},{"lon":"-91.1551944444444","lat":"43.0510833333333","avgDailyTraffic":2258,"year":1955},{"lon":"-91.1549444444445","lat":"43.0511388888889","avgDailyTraffic":2258,"year":1955},{"lon":"-91.9426138888889","lat":"44.9074111111111","avgDailyTraffic":33200,"year":1983},{"lon":"-91.8907138888889","lat":"45.1845472222222","avgDailyTraffic":2600,"year":1987},{"lon":"-91.2769166666667","lat":"44.653","avgDailyTraffic":256,"year":1981},{"lon":"-88.26005","lat":"43.6518","avgDailyTraffic":3000,"year":1954},{"lon":"-89.5754333333333","lat":"42.5663666666667","avgDailyTraffic":548,"year":1958},{"lon":"-88.7810833333333","lat":"42.9468055555555","avgDailyTraffic":195,"year":1993},{"lon":"-90.1325638888889","lat":"44.1599416666667","avgDailyTraffic":970,"year":1981},{"lon":"-90.0004611111111","lat":"45.5549611111111","avgDailyTraffic":1900,"year":1968},{"lon":"-87.9506444444444","lat":"43.148425","avgDailyTraffic":26100,"year":1969},{"lon":"-91.3678583333333","lat":"45.434","avgDailyTraffic":3300,"year":1938},{"lon":"-90.8227833333333","lat":"45.378925","avgDailyTraffic":460,"year":1989},{"lon":"-90.134875","lat":"45.372275","avgDailyTraffic":390,"year":1989},{"lon":"-90.3252222222222","lat":"45.2082777777778","avgDailyTraffic":4900,"year":1986},{"lon":"-91.2129555555556","lat":"43.4527777777778","avgDailyTraffic":4400,"year":1960},{"lon":"-88.2578416666667","lat":"42.9344638888889","avgDailyTraffic":3200,"year":1980},{"lon":"-88.1257611111111","lat":"42.9518833333333","avgDailyTraffic":4200,"year":2009},{"lon":"-88.5425666666667","lat":"43.9814333333333","avgDailyTraffic":4800,"year":1977},{"lon":"-87.9480527777778","lat":"44.2847527777778","avgDailyTraffic":730,"year":1949},{"lon":"-90.9555555555556","lat":"44.8791666666667","avgDailyTraffic":63,"year":2002},{"lon":"-91.0850277777778","lat":"44.9525","avgDailyTraffic":106,"year":1970},{"lon":"-90.40555","lat":"45.0315222222222","avgDailyTraffic":58,"year":1962},{"lon":"-91.1899444444444","lat":"44.72","avgDailyTraffic":256,"year":1985},{"lon":"-88.4841888888889","lat":"43.8136277777778","avgDailyTraffic":1210,"year":1950},{"lon":"-88.3974777777778","lat":"43.5580805555556","avgDailyTraffic":58,"year":1930},{"lon":"-88.5239388888889","lat":"43.8756611111111","avgDailyTraffic":23,"year":1976},{"lon":"-88.3243833333333","lat":"43.9142083333333","avgDailyTraffic":510,"year":1989},{"lon":"-88.99475","lat":"45.6608333333333","avgDailyTraffic":60,"year":1930},{"lon":"-90.5858611111111","lat":"42.7915277777778","avgDailyTraffic":106,"year":1940},{"lon":"-89.3870333333333","lat":"42.6545805555556","avgDailyTraffic":699,"year":1940},{"lon":"-89.5758916666667","lat":"42.7678","avgDailyTraffic":211,"year":1949},{"lon":"-89.5422944444444","lat":"42.7120111111111","avgDailyTraffic":211,"year":1938},{"lon":"-89.3764388888889","lat":"42.7052638888889","avgDailyTraffic":105,"year":1962},{"lon":"-89.3708","lat":"42.50935","avgDailyTraffic":455,"year":1940},{"lon":"-91.0854166666667","lat":"44.3605555555556","avgDailyTraffic":119,"year":1935},{"lon":"-90.9490666666667","lat":"44.4883555555556","avgDailyTraffic":94,"year":1935},{"lon":"-91.0327888888889","lat":"44.1333916666667","avgDailyTraffic":35,"year":1935},{"lon":"-90.8507861111111","lat":"44.3001416666667","avgDailyTraffic":2820,"year":1961},{"lon":"-90.9969833333333","lat":"44.4039305555556","avgDailyTraffic":10,"year":1941},{"lon":"-88.6569722222222","lat":"42.9976944444444","avgDailyTraffic":58,"year":1920},{"lon":"-89.0038333333333","lat":"42.9121944444444","avgDailyTraffic":88,"year":1930},{"lon":"-88.5398888888889","lat":"43.093","avgDailyTraffic":176,"year":1951},{"lon":"-88.7936388888889","lat":"42.954","avgDailyTraffic":2537,"year":1960},{"lon":"-90.2354694444444","lat":"43.7388388888889","avgDailyTraffic":1035,"year":1925},{"lon":"-91.2360333333333","lat":"43.9261333333333","avgDailyTraffic":200,"year":1979},{"lon":"-89.2001111111111","lat":"45.2191388888889","avgDailyTraffic":240,"year":1996},{"lon":"-89.40225","lat":"45.3695555555556","avgDailyTraffic":236,"year":1963},{"lon":"-89.2730611111111","lat":"45.1817694444444","avgDailyTraffic":70,"year":1970},{"lon":"-87.6897222222222","lat":"44.2803138888889","avgDailyTraffic":47,"year":1971},{"lon":"-90.1030111111111","lat":"45.0692222222222","avgDailyTraffic":42,"year":1989},{"lon":"-90.2338333333333","lat":"44.9889777777778","avgDailyTraffic":85,"year":1961},{"lon":"-89.9306416666667","lat":"45.0237416666667","avgDailyTraffic":15,"year":1970},{"lon":"-89.7882694444444","lat":"44.8800444444444","avgDailyTraffic":80,"year":1964},{"lon":"-89.984475","lat":"44.9141638888889","avgDailyTraffic":261,"year":1968},{"lon":"-89.5581916666667","lat":"43.650125","avgDailyTraffic":80,"year":1970},{"lon":"-87.974425","lat":"43.1831416666667","avgDailyTraffic":2900,"year":1968},{"lon":"-88.0021388888889","lat":"42.9867416666667","avgDailyTraffic":456,"year":1954},{"lon":"-89.6635","lat":"44.3591111111111","avgDailyTraffic":545,"year":2007},{"lon":"-89.2840888888889","lat":"44.5941527777778","avgDailyTraffic":1065,"year":1979},{"lon":"-90.4988888888889","lat":"43.2608333333333","avgDailyTraffic":490,"year":1950},{"lon":"-91.3586944444444","lat":"45.3842777777778","avgDailyTraffic":86,"year":1965},{"lon":"-90.1697583333333","lat":"43.5331833333333","avgDailyTraffic":150,"year":1957},{"lon":"-90.1101305555556","lat":"43.4821111111111","avgDailyTraffic":155,"year":1950},{"lon":"-90.0023361111111","lat":"43.5658333333333","avgDailyTraffic":118,"year":1930},{"lon":"-89.1774722222222","lat":"44.8705305555556","avgDailyTraffic":100,"year":1943},{"lon":"-90.16775","lat":"45.2652222222222","avgDailyTraffic":1127,"year":1956},{"lon":"-90.2295833333333","lat":"45.1716388888889","avgDailyTraffic":58,"year":1972},{"lon":"-90.3578611111111","lat":"45.1629166666667","avgDailyTraffic":94,"year":1955},{"lon":"-90.5361666666667","lat":"45.0441111111111","avgDailyTraffic":92,"year":1960},{"lon":"-90.2636944444444","lat":"45.0648888888889","avgDailyTraffic":58,"year":1970},{"lon":"-90.27875","lat":"45.0481111111111","avgDailyTraffic":58,"year":1970},{"lon":"-90.5773333333333","lat":"45.0521388888889","avgDailyTraffic":29,"year":1950},{"lon":"-90.08525","lat":"45.1411111111111","avgDailyTraffic":58,"year":1960},{"lon":"-90.7041111111111","lat":"45.08925","avgDailyTraffic":256,"year":1960},{"lon":"-90.2120277777778","lat":"45.0625277777778","avgDailyTraffic":58,"year":1991},{"lon":"-91.2354722222222","lat":"44.5391111111111","avgDailyTraffic":47,"year":1986},{"lon":"-88.7746555555556","lat":"42.6306222222222","avgDailyTraffic":691,"year":1960},{"lon":"-88.1598722222222","lat":"43.3383055555556","avgDailyTraffic":7,"year":1940},{"lon":"-88.2231027777778","lat":"42.9552916666667","avgDailyTraffic":2350,"year":1932},{"lon":"-88.2159888888889","lat":"43.0471","avgDailyTraffic":117,"year":1950},{"lon":"-88.0817638888889","lat":"43.1092333333333","avgDailyTraffic":2837,"year":1988},{"lon":"-88.1107916666667","lat":"42.9954388888889","avgDailyTraffic":17164,"year":1969},{"lon":"-88.2859361111111","lat":"43.0928638888889","avgDailyTraffic":2448,"year":1940},{"lon":"-88.5413138888889","lat":"42.88595","avgDailyTraffic":471,"year":1978},{"lon":"-88.5480333333333","lat":"43.9734666666667","avgDailyTraffic":153,"year":1980}];

init();