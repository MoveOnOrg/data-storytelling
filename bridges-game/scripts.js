mapboxgl.accessToken = 'pk.eyJ1IjoiZXJpa2F3ZWkiLCJhIjoiY2pqb2kzeXJoMmM1eDNsc280YnBub2d6aCJ9.DapwlemDz4dhkDIG7sNdwQ';
let mapboxStyle = 'styles/adolphej/ckyd79eal0lyb16lol8hq1gfz';
let isFlying = false;
let startLocation = '';
let destinationOptions = [];
let endLocation = '';
let point = '';

const destinations = [{"location":"Blue Ox Music Festival, Eau Claire, Wisconsin","lat":"44.78786668","lon":"-91.58057528","type":"Festival","inMilwaukee":"0"},{"location":"Cranberry Festival, Warrens, WI","lat":"44.13143685","lon":"-90.50164398","type":"Festival","inMilwaukee":"0"},{"location":"State Capitol , Madison, WI","lat":"43.07400405","lon":"-89.38512782","type":"Landmark","inMilwaukee":"0"},{"location":"Bayfield WI to Kayak the Apostle Islands","lat":"46.80806885","lon":"-90.81405375","type":"Outdoors","inMilwaukee":"0"},{"location":"Cave of the Mounds (west of Madison)","lat":"43.01680179","lon":"-89.81429772","type":"Outdoors","inMilwaukee":"0"},{"location":"Lake Minocqua - fishing, boating, etc","lat":"45.86445439","lon":"-89.70855847","type":"Outdoors","inMilwaukee":"0"},{"location":"Mississippi River Dinner Cruise in La Crosse","lat":"43.81792238","lon":"-91.2564382","type":"Outdoors","inMilwaukee":"0"},{"location":"Wisconsin Dells - “The Waterpark Capital of the World”","lat":"43.62780295","lon":"-89.77790092","type":"Outdoors","inMilwaukee":"0"},{"location":"Wisconsin's biggest waterfall in Pattison State Park","lat":"46.53719434","lon":"-92.1187448","type":"Outdoors","inMilwaukee":"0"},{"location":"Lambeau Field - Green Bay Packers","lat":"44.49924888","lon":"-88.05973531","type":"Sports","inMilwaukee":"0"},{"location":"Great Lakes Distillery, Milwaukee","lat":"43.02648595","lon":"-87.9187747","type":"Other","inMilwaukee":"1"},{"location":"Harley-Davidson Museum, Milwaukee","lat":"43.03135815","lon":"-87.91662288","type":"Other","inMilwaukee":"1"},{"location":"Milwaukee Art Museum","lat":"43.03987028","lon":"-87.89751278","type":"Other","inMilwaukee":"1"},{"location":"Milwaukee Zoo","lat":"43.03126493","lon":"-88.04098476","type":"Other","inMilwaukee":"1"},{"location":"Fiserv Forum - home to NBA Champion Milwaukee Bucks","lat":"43.04501176","lon":"-87.91750192","type":"Sports","inMilwaukee":"1"}];

const zoom = 5;
const center = [-89.35, 43.05];
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
	placeholder: 'Search for places in Wisconsin',
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
function animatePath(routes) {
	// this is the path the camera will look at
	const targetRoute = routes;
	// this is the path the camera will move along
	const cameraRoute = routes;//simplifyRouteForCameraPanning(routes);

	const animationDuration = 10000;
	const cameraAltitude = 65000; // 15000;
	// get the overall distance of each route so we can interpolate along them
	const routeDistance = turf.lineDistance(turf.lineString(targetRoute));
	const cameraRouteDistance = turf.lineDistance(
		turf.lineString(cameraRoute)
	);
	 
	let start, requestAnimID;
	function frame(time) {
		if (!start) start = time;
		// phase determines how far through the animation we are
		const phase = (time - start) / animationDuration;
		 
		// phase is normalized between 0 and 1
		// when the animation is finished, reset start to loop the animation
		if (phase > 1) {
			// wait 1.5 seconds before looping
			setTimeout(() => {
				//start = 0.0;
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
			cameraRouteDistance * phase
		).geometry.coordinates;
		 
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
		camera.lookAtPoint({
			lng: alongRoute[0],
			lat: alongRoute[1]
		});
		map.setFreeCameraOptions(camera);

		// Update point geometry to a new position 
		const point = {
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
		map.getSource('point').setData(point);
		 
		requestAnimID = window.requestAnimationFrame(frame);
	}
	 
	window.requestAnimationFrame(frame);
}

function animationComplete() {
	document.getElementById('popup').style.display = 'block';
}


async function getRoute() {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${startLocation[0]},${startLocation[1]};${endLocation.lon},${endLocation.lat}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
  );
  const json = await query.json();
  const data = json.routes[0];
  const routeCoords = data.geometry.coordinates;
  const routeGeojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: routeCoords
    }
  };

  const routeSpacedAlongFrames = setRouteToNFrames(routeGeojson);
  console.log('routeSpacedAlongFrames', routeSpacedAlongFrames);
  const nearbyBridges = bridgesWithinMinMiles(bridges, 5, routeGeojson, routeSpacedAlongFrames); 
  console.log('nearbyBridges', nearbyBridges);

  // if the route already exists on the map, we'll reset it using setData
  if (map.getSource('route')) {
    map.getSource('route').setData(routeGeojson);
  }
  // otherwise, we'll make a new request
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
        'line-color': '#00ABFF',
        'line-width': 5,
        'line-opacity': 0.75
      }
    });
  }

  // add all the bridges (all at once for now, just to look) 
  map.addLayer({
		id: 'bridges',
		type: 'circle',
		source: {
		type: 'geojson',
		data: {
			type: 'FeatureCollection',
			features: nearbyBridges.map(d=> {
			return {
				type: 'Feature',
				properties: {},
				geometry: {
				type: 'Point',
				coordinates: d.coord
				}
			}
			})
		}
		},
		paint: {
		'circle-radius': 10,
		'circle-color': 'black'
		}
	});

  animatePath(routeGeojson.geometry.coordinates);

  console.log('routeGeojson coords', routeGeojson.geometry.coordinates);
}


function startAnimation() {
	document.getElementById('overlay').style.display = 'none';
	getRoute();
}


// pick N destinations from all eligible destinations - ensuring that they are at least x distance from starting location, that not more than 1 is in Milwaukee and not more than 1 of the same type. 
function generateDestinationSet(dests, n) {
  let filteredDests = dests.slice().filter(d => turf.distance([d.lon, d.lat], startLocation, turfUnits) > 65) // 65 miles radius
  console.log('filteredDests', filteredDests)

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

// grab bridges within n miles of route and closest point on route to each bridge  
function bridgesWithinMinMiles(bridges, xMiles, route, routeSpacedAlongFrames) {
	return bridges.map(d => 
		({coord: [d.lon, d.lat], 
			avgDailyTraffic: +d.ADT_029,
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

// set marker and fly to starting location 
function flyToStartingLocation() {
	map.addLayer({
		id: 'point',
		type: 'circle',
		source: {
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
			}
			]
		}
		},
		paint: {
		'circle-radius': 10,
		'circle-color': '#EA1C24'
		}
	});
	isFlying = true;
	map.flyTo({
		center: startLocation,
		speed: 0.5,
		zoom: 9
	});
	/* when I had this in it broke the animate path. 
	map.on('moveend', () => {
		if (isFlying) {
			isFlying = false;
		}
	})*/
}

function init() {
	//set up static map
	var staticURL = `https://api.mapbox.com/${mapboxStyle}/static/-89.35,43.05,10/300x300?access_token=${mapboxgl.accessToken}`;
	/* temporarily comment out so that we can see the 	
      document.getElementById('static-map').style.backgroundImage = `url(${staticURL})`;
	  */

	
  //get page elements and set up event listeners
	const vehicles = document.querySelectorAll('input[type=radio][name="vehicle"]');
	const stepVehicle = document.getElementById('step-vehicle');
	const stepStart = document.getElementById('step-start');
	const stepEnd = document.getElementById('step-end');
	const btnGo = document.getElementById('btn-go');

	
	//vehicle select
	vehicles.forEach(vehicle => {
		vehicle.addEventListener('change', () => {
			stepVehicle.style.display = 'none';
			stepStart.style.display = 'block';
			console.log('vehicle', vehicle.value);
		});
	});

	//geocoder input
	geocoder.on('result', (event) => {
		startLocation = event.result.geometry.coordinates;
		flyToStartingLocation();
		stepStart.style.display = 'none';
		stepEnd.style.display = 'block';
		destinationOptions = generateDestinationSet(destinations, 3);
		destinationOptions.unshift({"location": "Select a destination", lat: '', lon: '', type: '', inMilwaukee: ''});
		d3.select('#destinationSelector').selectAll('option').data(destinationOptions).join('option').attr('value', (d,i)=> i).text(d=> d['location']);
		console.log('start', startLocation);
		console.log('destinationOptions', destinationOptions);
	});

	//destination select
	const destination = document.getElementById('destinationSelector');
	destination.addEventListener('change', (event) => {
		stepEnd.style.display = 'none';
		btnGo.style.display = 'block';
		endLocation = destinationOptions[event.target.value];
		console.log('end', endLocation);
	});

	//go button -- transition sneak-peek circle open then start animation
	btnGo.addEventListener('click', () => {
		btnGo.style.display = 'none';
		d3.select('#overlay').transition().duration(1000).ease(d3.easeQuadInOut)
			.styleTween( 'background', function() {
				return function(t) { 
				let currentPct = d3.interpolateNumber(20, 100)(t)
				return 'radial-gradient(circle at 50% 33%, transparent ' + currentPct +  '%, #E3F3FFD9 ' + currentPct +  '%)'
			}
		})
		.on("end", startAnimation);
	});
}


init();