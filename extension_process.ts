
import FlatQueue from 'flatqueue';
import TriangleMesh from '@redblobgames/dual-mesh';
import sendMessage from './extension_messages';
import {
  pushFlatQueueforMax,
  getPriorityFlatQueueforMax,
  distanceBetween,
  getRandomDouble,
  getRandomInt,
  clamp,
  scaleBetween,
  getRandomElement,
  unorderedPairingFunction,
  coordCenterBetween,
} from './extension_math';
import { getCityName, getTownName } from './extension_names';
import { CONFIG } from './extension_map';

let render_params: { mountain_height: number } | null = null;
let MAP: any = null;
let MESH: TriangleMesh | null = null;

let MARKERS_CANVAS: HTMLCanvasElement | null = null;

export function initProcess(_MAP, _MESH, _MARKERS_CANVAS, _render_params){

  MAP = _MAP;
  MESH = _MESH;

  MARKERS_CANVAS = _MARKERS_CANVAS;
  render_params = _render_params;

}


/**
 * Finds the best triangles for cities
 *
 * @param {number} cityCount - number of cities to find
 * @returns {[number]} - returns t_indexes for top cityCount city triangles
 */
export function determineCities(cityCount: number, existingCities?: number[]) {
  if(CONFIG == null) { return []; }

  /* City location algo, based on http://mewo2.com/notes/terrain/

    * Water flux - we want cities to be preferentially located on rivers, so high water flux gets a bonus
    * Distance from other cities - we want cities to be spread out, so penalize locations which are too close to an existing city
    * Distance from the edge of the MAP - the other two criteria alone tend to push cities to the MAP edge, which isn't ideal, so penalize locations too close to the edge
      
  */

  let goodRiverMap = findGoodRivers();

  ///
  if (existingCities == null) { existingCities = []; }

  const generatingTowns = (existingCities.length > 0) ? true : false;
  const total_city_indexes = JSON.parse(JSON.stringify(existingCities));
  const new_city_indexes: number[] = [];

  for (let cityNum = 0; cityNum < cityCount; cityNum++) {

    let cityAppealQueue = new FlatQueue();
    for (let t_i = 0; t_i < MAP.mesh.numTriangles; t_i++) {
      if (total_city_indexes.includes(t_i)) { continue; }
      if (MAP.t_elevation[t_i] <= CONFIG.placement.city.min_elevation) { continue; }

      let coords = MAP.mesh._t_vertex[t_i]; // [x,y], 0 - 1000

      let cityAppeal = 0;

      let flow = goodRiverMap.get(t_i);
      if (flow != null) {
        cityAppeal += CONFIG.placement.city.near_river_bonus + CONFIG.placement.city.near_river_flow_bonus * flow;
      }

      ///

      let cityDistanceQueue = new FlatQueue();
      for (let ct_i of total_city_indexes) {
        let city_coords = MAP.mesh._t_vertex[ct_i];
        cityDistanceQueue.push(ct_i, distanceBetween(coords[0], coords[1], city_coords[0], city_coords[1]));
      }

      let nearest_city_distance = cityDistanceQueue.peekValue();
      if (nearest_city_distance) {

        /*
        let x_value = 1-(nearest_city_distance / 1415); // 0-1: larger value, larger penalty
        x_value = clamp((x_value - 0.5)*2, 0, 1);

        //let nearPenalty = -1*Math.pow((1-(nearest_city_distance / 1415))-1, 2)+1;
        //let nearPenalty = (3*Math.pow(x_value, 2) - 2*Math.pow(x_value, 3) - Math.pow(x_value - 1, 2) + 1) / 2;
        */
        //let penalty = CONFIG.placement.city.near_city_penalty * Math.pow((nearest_city_distance / 1415) - 1, 2) + 1;

        //good one let penalty = CONFIG.placement.city.near_city_penalty * (1 / (nearest_city_distance / 1415));

        const mod = (generatingTowns) ? 0.3 : 1.0;
        let penalty = CONFIG.placement.city.near_city_penalty * (mod / (nearest_city_distance / 1415));

        const minDistance = (generatingTowns) ? CONFIG.placement.city.min_town_distance : CONFIG.placement.city.min_city_distance;

        if (nearest_city_distance <= minDistance) {
          cityAppeal -= 1000;
        } else {
          cityAppeal -= penalty;
        }
        // 1415 = max distance = approx result of distanceBetween(0, 0, 1000, 1000)
      }

      ///

      /*
        0, 0               x, 0             1000, 0                
  
        0, y               x, y             1000, y
  
        0, 1000            x, 1000          1000, 1000
        Find smallest distance between edges
      */
      let nearest_edge_distance = Math.min(
        distanceBetween(coords[0], coords[1], coords[0], 0),
        distanceBetween(coords[0], coords[1], coords[0], 1000),
        distanceBetween(coords[0], coords[1], 0, coords[1]),
        distanceBetween(coords[0], coords[1], 1000, coords[1])
      );
      if (nearest_edge_distance < 1) { nearest_edge_distance = 1; }
      cityAppeal -= CONFIG.placement.city.near_edge_penalty * (1 / (nearest_edge_distance / 500));
      // 500 = max distance = 1000 / 2

      pushFlatQueueforMax(cityAppealQueue, t_i, cityAppeal, 10000);

    }

    //console.log('Priority: ' + getPriorityFlatQueueforMax(cityAppealQueue.peekValue(), 10000));
    //console.log('Flow: '+goodRiverMap.get(cityAppealQueue.peek()));

    let city_index: number = cityAppealQueue.pop();

    //console.log('Town #'+city_index+': '+MAP.t_elevation[city_index]);

    total_city_indexes.push(city_index);
    new_city_indexes.push(city_index);

  }

  console.log(new_city_indexes);

  return new_city_indexes;

}


export type Regions = Map<number, { cost: number, region_ct_i: number }>;

/**
 * Finds regions
 *
 * @param {[number]} cities - t_indexes of cities
 * @returns {Regions} - returns 
 */
export function determineRegions(cities) {
  if(CONFIG == null) { return; }

  let goodRiverMap = findGoodRivers();

  function calcuateCost(t_i, nt_i) {
    if(CONFIG == null) { return; }

    let totalCost = 0;

    totalCost += CONFIG.placement.border.flat_cost;

    // Slope cost
    let slopeCost = isDownHill(t_i, nt_i) ? CONFIG.placement.border.slope_downhill_cost : CONFIG.placement.border.slope_uphill_cost;

    totalCost += slopeCost * Math.abs(getSlope(t_i, nt_i));

    // River cost
    let flow = goodRiverMap.get(nt_i);
    if (flow != null && MAP.t_elevation[nt_i] > 0) {
      totalCost += CONFIG.placement.border.river_flow_cost * flow;
    }

    // Shoreline cost
    if ((MAP.t_elevation[t_i] > 0 && MAP.t_elevation[nt_i] <= 0)
      || (MAP.t_elevation[t_i] <= 0 && MAP.t_elevation[nt_i] > 0)) {
      totalCost += CONFIG.placement.border.shoreline_cost;
    }

    // Water cost
    if (MAP.t_elevation[nt_i] <= 0) {
      totalCost += CONFIG.placement.border.water_cost;
    }

    return totalCost;

  }

  let finalRoutes = new Map() as Regions;

  for (let ct_i of cities) {

    let routes = dijkstraAllData(ct_i, calcuateCost);
    for (const [t_i, cost] of routes.distances.entries()) {

      let finalData = finalRoutes.get(t_i);
      if (finalData == null || finalData.cost > cost) {
        finalRoutes.set(t_i, {
          cost: cost,
          region_ct_i: ct_i,
        });
      }

    }

  }

  return finalRoutes;

}

type Connections = Map<number, Map<number, number>>;
export type Roads = Map<number, Connections>;

export function determineRoads(cities, towns) {

  let routes: Roads = new Map();

  let goodRiverMap = findGoodRivers();

  function calcuateCost(t_i, nt_i) {
    if(CONFIG == null) { return; }
    if (MESH && MESH.t_ghost(nt_i)) { return Infinity; }

    let totalCost = 0;

    if (hasRoad(routes, t_i, nt_i)) {
      totalCost += CONFIG.placement.road.road_cost;
    } else if (goodRiverMap.get(nt_i) && MAP.t_elevation[nt_i] > 0) {
      totalCost += CONFIG.placement.road.river_cost;
    } else {
      totalCost += CONFIG.placement.road.normal_cost;
    }

    if (MAP.t_elevation[nt_i] <= 0) {
      totalCost += CONFIG.placement.road.water_cost;
    } else {
      totalCost += CONFIG.placement.road.slope_cost * Math.abs(getSlope(t_i, nt_i));
    }

    return totalCost;

  }

  function addToRoutes(dijkstraData, t_i, ot_i) {

    let path: number[] = [ot_i];
    let path_t_i = ot_i as number;
    while (dijkstraData.previous.get(path_t_i)) {
      path_t_i = dijkstraData.previous.get(path_t_i);
      path.push(path_t_i);
    }

    for (let i = 0; i < path.length; i++) {

      let connected: Connections | undefined = routes.get(path[i]);
      if (connected) {

        if (path[i + 1]) {

          let value = connected.get(path[i + 1]);
          if (value) {
            value.set(t_i, path.length - i - 1);
          } else {
            connected.set(path[i + 1], new Map().set(t_i, path.length - i - 1));
          }

        }

      } else {

        connected = new Map();
        if (path[i + 1]) {
          connected.set(path[i + 1], new Map().set(t_i, path.length - i - 1));
        }

        routes.set(path[i], connected);

      }

    }

  }

  let locations = [].concat(cities, towns);

  console.log('>Locations ' + locations.length);
  console.log(locations);

  for (let t_i of locations) {

    let dijkstraData = dijkstraAllData(t_i, calcuateCost);

    let farthestLoc = { ot_i: -1, distance: Number.MIN_VALUE };
    for (let ot_i of locations) {
      if (t_i === ot_i) { continue; }

      let t_i_coords = MAP.mesh._t_vertex[t_i];
      let ot_i_coords = MAP.mesh._t_vertex[ot_i];

      let distance = distanceBetween(t_i_coords[0], t_i_coords[1], ot_i_coords[0], ot_i_coords[1]);
      if (distance > farthestLoc.distance) {
        farthestLoc = { ot_i: ot_i, distance: distance };
      }
    }
    if (farthestLoc.ot_i === -1) { continue; }

    addToRoutes(dijkstraData, t_i, farthestLoc.ot_i);
  }

  for (let t_i of locations) {

    let dijkstraData = dijkstraAllData(t_i, calcuateCost);

    for (let ot_i of locations) {
      if (t_i === ot_i) { continue; }
      addToRoutes(dijkstraData, t_i, ot_i);
    }
  }

  return routes;

}

/**
 * Find all "good" rivers
 *
 * @returns {Map<Number, Number>} - returns a map key=t_index, value=flow
 */
export function findGoodRivers() {

  let bestRiverQueue = new FlatQueue();
  for (let t_i = 0; t_i < MAP.mesh.numTriangles; t_i++) {
    if (MAP.t_elevation[t_i] > 0) {
      pushFlatQueueforMax(bestRiverQueue, t_i, MAP.t_flow[t_i]);
    }
  }

  let goodRiverMap = new Map();
  for (let i = 0; i < Math.floor(MAP.mesh.numTriangles * 0.1); i++) {
    let t_index = bestRiverQueue.pop();
    goodRiverMap.set(t_index, MAP.t_flow[t_index]);
  }

  return goodRiverMap;

}

/**
 * Calculates the cost to traveling to each triangle
 *
 * @param {Number} st_i - base triangle index
 * @param {function(t_i, nt_i)} calcuateCost - calcuates the cost between two triangle
 * @returns {Map<Number, Number>} - returns a map key=t_index, value=cost to travel there
 */
export function dijkstraAllData(st_i, calcuateCost) {

  const nodes = new FlatQueue()
  const distances = new Map();
  const previous = new Map();
  if (MESH == null) { return { distances, previous }; }

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

    previous.set(t_i, null);

  }

  while (nodes.length > 0) { // As long as there is something to visit

    smallest = nodes.pop();

    if (smallest || distances.get(smallest) !== Infinity) {

      for (let neighbor of MESH.t_circulate_t([], smallest)) {

        // Calculate new distance to neighboring node

        let newDistance = distances.get(smallest) + calcuateCost(smallest, neighbor);

        if (newDistance < distances.get(neighbor)) {
          distances.set(neighbor, newDistance); // Updating new smallest distance to neighbor
          nodes.push(neighbor, newDistance); // Equeue in PQ with new priority
          previous.set(neighbor, smallest);
        }
      }
    }
  }

  return { distances, previous };

}


export function hasRoad(roads: Roads, t_index: number, t_next_index: number) {

  let connected = roads.get(t_index);
  if (connected) {
    for (const [t_i, destinations] of connected.entries()) {
      if (t_i === t_next_index) { return true; }
    }
  }
  return false;

}


/**
 * Gets slope between two t_indexes
 *
 * @param {Number} t_index - first triangle index
 * @param {Number} t_next_index - second triangle index
 * @returns {Number} - The slope difference between these two, range about: -0.15 to 0.15
 */
export function getSlope(t_index: number, t_next_index: number) {
  return MAP.t_elevation[t_next_index] - MAP.t_elevation[t_index];
}



export function isDownHill(t_index: number, t_next_index: number) {
  if (MESH == null) { return false; }
  let out_s = MAP.t_downslope_s[t_index];
  return (MESH.s_outer_t(out_s) === t_next_index);
}







export const BIOMES = {
  SNOW: { name: 'Snow', color: '#fff' },
  TUNDRA: { name: 'Tundra', color: '#ddddbb' },
  BARE: { name: 'Bare', color: '#000' },
  SCORCHED: { name: 'Scorched', color: '#000' },
  TAIGA: { name: 'Taiga', color: '#ccd4bb' },
  SHRUBLAND: { name: 'Shrubland', color: '#c4ccbb' },
  TEMPERATE_DESERT: { name: 'Temperate Desert', color: '#fff' },
  TEMPERATE_RAIN_FOREST: { name: 'Temperate Rain Forest', color: '#a4c4a8' },
  TEMPERATE_DECIDUOUS_FOREST: { name: 'Temperate Decidouus Forest', color: '#b4c9a9' },
  GRASSLAND: { name: 'Grassland', color: '#c4d4aa' },
  TROPICAL_RAIN_FOREST: { name: 'Tropical Rain Forest', color: '#9cbba9' },
  TROPICAL_SEASONAL_FOREST: { name: 'Tropical Seasonal Forest', color: '#a9cca4' },
  SUBTROPICAL_DESERT: { name: 'Subtropical Desert', color: '#fff' },
  COAST: { name: 'Coast', color: '#688ff2' },
  SHALLOW_OCEAN: { name: 'Shallow Ocean', color: '#4271e8' },
  DEEP_OCEAN: { name: 'Deep Ocean', color: '#2856ce' },
};
/*
const BIOMES = {
  SNOW: { name: 'Snow', color: '#f8f8f8' },
  TUNDRA: { name: 'Tundra', color: '#ddddbb' },
  BARE: { name: 'Bare', color: '#bbbbbb' },
  SCORCHED: { name: 'Scorched', color: '#999999' },
  TAIGA: { name: 'Taiga', color: '#ccd4bb' },
  SHRUBLAND: { name: 'Shrubland', color: '#c4ccbb' },
  TEMPERATE_DESERT: { name: 'Temperate Desert', color: '#e4e8ca' },
  TEMPERATE_RAIN_FOREST: { name: 'Temperate Rain Forest', color: '#a4c4a8' },
  TEMPERATE_DECIDUOUS_FOREST: { name: 'Temperate Decidouus Forest', color: '#b4c9a9' },
  GRASSLAND: { name: 'Grassland', color: '#c4d4aa' },
  TROPICAL_RAIN_FOREST: { name: 'Tropical Rain Forest', color: '#9cbba9' },
  TROPICAL_SEASONAL_FOREST: { name: 'Tropical Seasonal Forest', color: '#a9cca4' },
  SUBTROPICAL_DESERT: { name: 'Subtropical Desert', color: '#e9ddc7' },
  COAST: { name: 'Coast', color: '#688ff2' },
  SHALLOW_OCEAN: { name: 'Shallow Ocean', color: '#4271e8' },
  DEEP_OCEAN: { name: 'Deep Ocean', color: '#2856ce' },
};
*/

/**
 * Gets biome from t_index
 *
 * @param {Number} t_index - triangle index
 * @returns {BIOME} - One of the biomes from BIOMES
 */
export function getBiome(t_index: number) {
  if (MESH == null) { return BIOMES.BARE; }
  /*
    Elevation: -1 to 1
    Land Moisture: 0 to 3
  */

  let real_moisture = clamp(MAP.t_moisture[t_index], 0, 3);

  let surroundingSlope: number[] = [];
  for (let nt_i of MESH.t_circulate_t([], t_index)) {
    surroundingSlope.push(Math.abs(getSlope(t_index, nt_i)));
  }
  let slope = Math.max(...surroundingSlope);
  if (slope >= 1) { slope = 0; }
  slope = clamp(slope, 0, 0.15);

  let moisture = scaleBetween(real_moisture, 0, 3, 0, 1.5) + -1 * scaleBetween(slope, 0, 0.15, -1.5, 1.5);
  let elevation = MAP.t_elevation[t_index];

  if (elevation > -0.5) {
    if (elevation > -0.1) {
      if (elevation > 0.001) {
        if (elevation > 0.25) {
          if (elevation > 0.5) {
            if (elevation > 0.75) {

              if (moisture > 1.5) {
                return BIOMES.SNOW;
              } else if (moisture > 1) {
                return BIOMES.TUNDRA;
              } else if (moisture > 0.5) {
                return BIOMES.BARE;
              } else {
                return BIOMES.SCORCHED;
              }

            } else {

              if (moisture > 2) {
                return BIOMES.TAIGA;
              } else if (moisture > 1) {
                return BIOMES.SHRUBLAND;
              } else {
                return BIOMES.TEMPERATE_DESERT;
              }

            }

          } else {

            if (moisture > 2.5) {
              return BIOMES.TEMPERATE_RAIN_FOREST;
            } else if (moisture > 1.5) {
              return BIOMES.TEMPERATE_DECIDUOUS_FOREST;
            } else if (moisture > 0.5) {
              return BIOMES.GRASSLAND;
            } else {
              return BIOMES.TEMPERATE_DESERT;
            }

          }

        } else {

          if (moisture > 2) {
            return BIOMES.TROPICAL_RAIN_FOREST;
          } else if (moisture > 1) {
            return BIOMES.TROPICAL_SEASONAL_FOREST;
          } else if (moisture > 0.5) {
            return BIOMES.GRASSLAND;
          } else {
            return BIOMES.SUBTROPICAL_DESERT;
          }

        }

      } else {
        return BIOMES.COAST;
      }
    } else {
      return BIOMES.SHALLOW_OCEAN;
    }
  } else {
    return BIOMES.DEEP_OCEAN;
  }

}


export function gatherLocations(ti_array: number[]){

  let map = new Map<number, {x: number, y: number, name: string}>();
  for(let t_i of ti_array){

    let name = getCityName(t_i);
    if(!name) { name = getTownName(t_i); };
    //if(!name) { name = getDungeonName(t_i); };
    if(!name) { name = 'Road'; };

    let coords = getScreenCoordsWithT(t_i);

    map.set(t_i, {
      x: coords.x,
      y: coords.y,
      name: name,
    });
  }
  return map;

}

/**
 * Gets screen coords with t_index
 *
 * @param {Number} t_index - triangle index
 * @returns {x: number, y: number} - screen coords 0 ≤ x ≤ canvasWidth, 0 ≤ y ≤ canvasHeight 
 */
export function getScreenCoordsWithT(t_index) {
  if (MARKERS_CANVAS == null || render_params == null) { return { x: 0, y: 0 }; }

  let coords = MAP.mesh._t_vertex[t_index];
  let elevation = MAP.t_elevation[t_index];

  let diviser = 30;

  let x_adjust = (coords[0] - 500) / diviser;
  let y_adjust = (coords[1] - 500) / diviser;

  //console.log(coords[0]+' + '+x_adjust);
  //console.log(coords[1]+' + '+y_adjust);

  let _x = coords[0] + x_adjust;
  let _y = coords[1] + y_adjust;

  return {
    x: (_x / 1000) * MARKERS_CANVAS.width,
    y: (_y / 1000) * MARKERS_CANVAS.height - (3.4 * clamp(elevation, 0, 1) * render_params.mountain_height),
  };

}

/**
 * Gets screen coords with r_index
 *
 * @param {Number} r_index - region index
 * @returns {x: number, y: number} - screen coords 0 ≤ x ≤ canvasWidth, 0 ≤ y ≤ canvasHeight 
 */
export function getScreenCoordsWithR(r_index) {
  if (MARKERS_CANVAS == null || render_params == null) { return { x: 0, y: 0 }; }

  let coords = MAP.mesh._r_vertex[r_index];
  let elevation = MAP.r_elevation[r_index];

  let diviser = 30;

  let x_adjust = (coords[0] - 500) / diviser;
  let y_adjust = (coords[1] - 500) / diviser;

  //console.log(coords[0]+' + '+x_adjust);
  //console.log(coords[1]+' + '+y_adjust);

  let _x = coords[0] + x_adjust;
  let _y = coords[1] + y_adjust;

  return {
    x: (_x / 1000) * MARKERS_CANVAS.width,
    y: (_y / 1000) * MARKERS_CANVAS.height - (3.4 * clamp(elevation, 0, 1) * render_params.mountain_height),
  };

}

///

export function buildSvgPaths(pathData, isR_I){

  let paths: string[] = [];
  let visited = new Set();

  function followPath(i, prev_i, pathStr){

    let coords = (isR_I) ? getScreenCoordsWithR(i) : getScreenCoordsWithT(i);

    if(pathStr === ''){
      if(prev_i != null){
        let prev_coords = (isR_I) ? getScreenCoordsWithR(prev_i) : getScreenCoordsWithT(prev_i);
        pathStr = `M ${prev_coords.x} ${prev_coords.y} L ${coords.x} ${coords.y} `;
      } else {
        pathStr = `M ${coords.x} ${coords.y} `;
      }
    } else {
      pathStr += `L ${coords.x} ${coords.y} `;
    }

    if(visited.has(i)){
      if(pathStr !== ''){
        paths.push(pathStr);
      }
      return;
    }
    visited.add(i);

    let connected = pathData.get(i);
    if(!connected) { console.warn('Bug in followPath code, no connected!'); return; }

    let nextSteps: number[] = [];
    for (const [n_i, otherData] of connected.entries()) {
      if(n_i === prev_i){ continue; }
      nextSteps.push(n_i);
    }

    if(nextSteps.length != 1){

      paths.push(pathStr);

      for(let split of nextSteps){
        followPath(split, i, '');
      }

    } else {
      followPath(nextSteps[0], i, pathStr);
    }

  }

  followPath(pathData.keys().next().value, null, '');

  return paths;

}

///

export function getSideBetweenTriangles(t_i_1, t_i_2) {
  if (!MESH) { return null; }

  let t_1_sides = MESH.t_circulate_s([], t_i_1);
  let t_2_sides = MESH.t_circulate_s([], t_i_2);

  for (let s of t_1_sides) {
    if (t_2_sides.includes(MESH.s_opposite_s(s))) {
      return s;
    }
  }

  return null;
}

///


