

export default function handleViewport() {

  window.visualViewport?.addEventListener('resize', () => {

    let scale = window.visualViewport?.scale as number;

    if (scale > 2.4) {
      toggleCanvas('mapgen4-overlay-hover1', true);
      toggleCanvas('mapgen4-overlay-hover2', true);
    } else if (scale > 0.25) {
      toggleCanvas('mapgen4-overlay-hover1', false);
      toggleCanvas('mapgen4-overlay-hover2', true);
    } else {
      toggleCanvas('mapgen4-overlay-hover1', false);
      toggleCanvas('mapgen4-overlay-hover2', false);
    }

  });

  // If visualViewport doesn't exist, hide just hover2
  if (!window.visualViewport) {
    toggleCanvas('mapgen4-overlay-hover1', false);
    toggleCanvas('mapgen4-overlay-hover2', true);
  }

}

function toggleCanvas(id, hide) {
  const canvas = document.getElementById(id);
  if (canvas) {
    if(hide) {
      canvas.style.display = `none`;
    } else {
      canvas.style.display = `block`;
    }
  }
}


/*
const MAX_SCROLL_HEIGHT = 500;
setInterval(function () {
  if ((window.pageYOffset || document.documentElement.scrollTop) > MAX_SCROLL_HEIGHT) {
    window.scrollTo({
      top: MAX_SCROLL_HEIGHT,
      left: window.pageXOffset || document.documentElement.scrollLeft,
      behavior: "smooth"
    });
  }
}, 1000);
*/


/*
//let foundBorders = new Map<number, {coords: {x:number, y:number}, t_i_1: number, t_i_2: number}>();
for (let r_i = 0; r_i < MAP.mesh.numRegions; r_i++) {

  // Sampling t_i from r_i
  let t_i = MESH.r_circulate_t([], r_i)[0];
  let data = regions.get(t_i);
  if(data == null) { continue; }



  console.log(MESH.t_circulate_t([], t_i));



  
  for(const nt_i of MESH.t_circulate_t([], t_i)){
    if(regions.get(nt_i)?.region_ct_i != data.region_ct_i){

      let coords_t_i = getScreenCoordsWithT(t_i);
      let coords_nt_i = getScreenCoordsWithT(nt_i);

      foundBorders.set(unorderedPairingFunction(t_i, nt_i), {
        coords: coordCenterBetween(coords_t_i.x, coords_t_i.y, coords_nt_i.x, coords_nt_i.y),
        t_i_1: t_i,
        t_i_2: nt_i,
      });

      drawCircleEmpty(coordCenterBetween(coords_t_i.x, coords_t_i.y, coords_nt_i.x, coords_nt_i.y), 5, getCityRGBA(cityColors.get(data.region_ct_i), 0.2));

    }
  }
  
}*/

/*
let polyPoints = '';
for(const [pair, data] of foundBorders.entries()){
  polyPoints += `${data.coords.x} ${data.coords.y},`;
}
Canvg.fromString(MARKERS_CANVAS_CTX, `
  <svg>
    <polygon points="${polyPoints}" fill="none" stroke="black" stroke-width="4" />
  </svg>
`).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });
*/
/*
 
 let drawnBorders = new Map();
 for(const [pair, data] of foundBorders.entries()){
   drawnBorders.set(pair, 0);
 }
 
 let drawnPairPairs = new Set();
 
 function findNearestBorders(s_pair, s_data){
   
   let minQueue = new FlatQueue();
 
   for(const [pair, data] of foundBorders.entries()){
     if(s_pair === pair) { continue; }
     if(drawnPairPairs.has(unorderedPairingFunction(s_pair, pair))) { continue; }
     if(drawnBorders.get(pair) >= 2) { continue; }
 
     let distance = distanceBetween(s_data.coords.x, s_data.coords.y, data.coords.x, data.coords.y);
     minQueue.push(pair, distance);
 
   }
 
   return {
     pair_c1: minQueue.pop(),
     //pair_c2: minQueue.pop(),
   };
 }
 
 for(const [pair, data] of foundBorders.entries()){
   if(drawnBorders.get(pair) >= 2) { continue; }
 
   let borders = findNearestBorders(pair, data);
   
   drawSolidLine(data.coords, foundBorders.get(borders.pair_c1)?.coords, 'black');
   //drawSolidLine(data.coords, foundBorders.get(borders.pair_c2)?.coords, 'black');
 
   drawnPairPairs.add(unorderedPairingFunction(pair, borders.pair_c1));
 
   drawnBorders.set(pair, drawnBorders.get(pair)+1);
   drawnBorders.set(borders.pair_c1, drawnBorders.get(borders.pair_c1)+1);
 
 }
 
 */



/*
let count = 0;
let drawnRoad = new Set();
for (const [t_i, connected] of roads.entries()) {

for (const [nt_i, destinations] of connected.entries()) {
  let pair = unorderedPairingFunction(t_i, nt_i);
  if (drawnRoad.has(pair)) { continue; }

  //drawDottedLine(getScreenCoordsWithT(t_i), getScreenCoordsWithT(nt_i));
  count++;
  drawnRoad.add(pair);

}

}
console.log('Old Road Paths: '+count);
*/






/*
{
let maxQueue = new FlatQueue();
let minQueue = new FlatQueue();
for (let t_i = 0; t_i < MAP.mesh.numTriangles; t_i++) {
pushFlatQueueforMax(maxQueue, t_i, MAP.t_elevation[t_i]);
minQueue.push(t_i, MAP.t_elevation[t_i]);
}
console.log(`Max Elevation: ${getPriorityFlatQueueforMax(maxQueue.peekValue())}`);
console.log(`Min Elevation: ${minQueue.peekValue()}`);
}
{
let maxQueue = new FlatQueue();
let minQueue = new FlatQueue();
for (let t_i = 0; t_i < MAP.mesh.numTriangles; t_i++) {
if (MAP.t_elevation[t_i] > 0) {
  pushFlatQueueforMax(maxQueue, t_i, MAP.t_moisture[t_i]);
  minQueue.push(t_i, MAP.t_moisture[t_i]);
}
}
console.log(`Max Land Moisture: ${getPriorityFlatQueueforMax(maxQueue.peekValue())}`);
console.log(`Min Land Moisture: ${minQueue.peekValue()}`);
}
{
let maxQueue = new FlatQueue();
for (let t_i = 0; t_i < MAP.mesh.numTriangles; t_i++) {
if (MAP.t_elevation[t_i] > 0) {

  let surroundingSlope = [];
  for (let nt_i of MESH.t_circulate_t([], t_i)) {
    surroundingSlope.push(Math.abs(getSlope(t_i, nt_i)));
  }
  let maxSlope = Math.max(...surroundingSlope);

  pushFlatQueueforMax(maxQueue, t_i, maxSlope);
}
}
console.log(`Max Land Slope: ${getPriorityFlatQueueforMax(maxQueue.peekValue())}`);
}
*/




/*
let collectData = new Map();
for (let biome of Object.keys(BIOMES)) {
  collectData.set(BIOMES[biome].name, 0);
}

// collectData.set(biome.name, collectData.get(biome.name) + 1);

console.log(collectData);
*/



/*
{
let queue = new FlatQueue();
for (let i = 0; i < MAP.r_elevation.length; i++) {
pushFlatQueueforMax(queue, i, MAP.r_elevation[i]);
}

for (let i = 0; i < 30; i++) {
let r_index = queue.pop();
drawCircleFilled(getScreenCoordsWithR(r_index), 5, 'brown');
}
}
*/


/*
{
  let queue = new FlatQueue();
  for (let i = 0; i < MAP.t_flow.length; i++) {
    pushFlatQueueforMax(queue, i, MAP.t_flow[i]);
  }

  for (let i = 0; i < Math.floor(MAP.t_flow.length * 0.1); i++) {
    let t_index = queue.pop();
    drawCircleFilled(getScreenCoordsWithT(t_index), 5, 'orange');
  }
}
*/




/**
 * Calculates the shortest path between st_i and et_i
 *
 * @param {Number} st_i - start triangle index
 * @param {Number} et_i - end triangle index
 * @param {function(t_i, nt_i)} calcuateCost - calcuates the cost between two triangle
 * @returns {number[]} - returns an array of t_i's
 */
/*
function dijkstraShortest(st_i, et_i, calcuateCost) {

  const nodes = new FlatQueue()
  const previous = {};
  const distances = new Map();
  if (MESH == null) { return []; }

  let smallest;

  // Building up initial state
  for (let t_i = 0; t_i < MAP.mesh.numTriangles; t_i++) {

    if (t_i === st_i) {
      distances.set(t_i, 0);
      nodes.push(t_i, 0);
    }
    else {
      distances.set(t_i, Infinity);
      nodes.push(t_i, Infinity);
    }
    previous[t_i] = null;

  }

  let path: number[] = [];
  while (nodes.length > 0) { // As long as there is something to visit

    smallest = nodes.pop();

    if (smallest === et_i) {
      while (previous[smallest]) {      // Building up the Path
        path.push(smallest);
        smallest = previous[smallest];
      }
      break;
    }

    if (smallest || distances.get(smallest) !== Infinity) {

      for (let neighbor of MESH.t_circulate_t([], smallest)) {

        // Calculate new distance to neighboring node

        let newDistance = distances.get(smallest) + calcuateCost(smallest, neighbor);

        if (newDistance < distances.get(neighbor)) {
          distances.set(neighbor, newDistance); // Updating new smallest distance to neighbor
          previous[neighbor] = smallest;      // Updating previous - how we got to neighbor
          nodes.push(neighbor, newDistance); // Equeue in PQ with new priority
        }
      }
    }
  }

  return path;

}*/




/*
function findRoad(roads: Roads, t_index: number, dt_index: number){

  let path: number[] = [t_index];

  function followRoad(ct_i: number){
    if(ct_i === dt_index) { return path; }

    let connected = roads.get(ct_i);
    if(!connected){ return null; }

    console.log(connected);

    for(const [nt_i, destinations] of connected.entries()){
      for(const [dt_i, distance] of destinations.entries()){
        if(dt_i === dt_index){
          path.push(nt_i);
          console.log(nt_i+': '+dt_i+', '+distance);
          return followRoad(nt_i);
        }
      }
    }

    return null;

  }

  return followRoad(t_index);

}
*/



/*

function isInOcean(coords){

  let rgba = readPixel(coords);
  console.log(coords);
  console.log(rgba);
  if(rgba.b > (rgba.g+5) && rgba.b > (rgba.r+5)){
    return true;
  } else {
    return false;
  }

}

function readPixel(coords){

  let pixel = new Uint8Array(4);
  GL_CANVAS_CTX.readPixels(coords.x, coords.y, 1, 1, GL_CANVAS_CTX.RGBA, GL_CANVAS_CTX.UNSIGNED_BYTE, pixel);
  return {
    r: pixel[0],
    g: pixel[1],
    b: pixel[2],
    a: pixel[3],
  };

}*/


