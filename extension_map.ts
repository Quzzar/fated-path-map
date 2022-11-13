import TriangleMesh from "@redblobgames/dual-mesh";
import { drawBiomes, drawBorders, drawRegionNames, drawRoads, drawTownsAndCities, initDraw } from "./extension_draw";
import { getRandomInt } from "./extension_math";
import sendMessage from "./extension_messages";
import { applyCityNames, applyTownNames } from "./extension_names";
import { determineCities, determineRegions, determineRoads, gatherLocations, initProcess, Regions } from "./extension_process";
import { getLoadData, getLoadType, saveState } from "./extension_state_manager";


export const CONFIG = {
  placement: {
    city: {
      city_count: 0, // updated on render
      town_count: 0, // updated on render

      near_river_bonus: 20,
      near_river_flow_bonus: 0.1,
      near_city_penalty: 0.2,
      near_edge_penalty: 0.1,
      min_elevation: 0,
      min_city_distance: 100,
      min_town_distance: 40,
    },
    border: {
      flat_cost: 1,
      slope_uphill_cost: 1,
      slope_downhill_cost: 8000,
      river_flow_cost: 10,
      shoreline_cost: 100,
      water_cost: 7,
      biome_cost: 20,
    },
    road: {
      normal_cost: 400,
      river_cost: 250,
      road_cost: 10,

      slope_cost: 10000,
      water_cost: 10000,
    }
  },
  render: {
    city_size: 30,
    town_size: 10,
  }

};

/**
 * Renders all overlay svgs
 *
 * @param {Map} map
 * @param {any} renderParams - global param.render
 */


export default function renderOverlay(map, renderParams){

  CONFIG.placement.city.city_count = getRandomInt(3, 8);
  CONFIG.placement.city.town_count = getRandomInt(40, 75);

  if(getLoadType() === 'NEW'){
    generateMap(map, renderParams);
  } else if(getLoadType() === 'EXISTING'){
    loadMap(map, renderParams);
  }

}

function generateMap(map, renderParams) {
  let render_params = renderParams;

  let MAP = map;
  if (MAP == null) { sendMessage('WARN', 'MAP is null, aborting.'); return; }

  let MESH = new TriangleMesh(map.mesh);
  if (MESH == null) { sendMessage('WARN', 'MESH is null, aborting.'); return; }

  let MARKERS_CANVAS = document.getElementById('mapgen4-overlay-markers') as HTMLCanvasElement;
  if (MARKERS_CANVAS == null) { sendMessage('WARN', 'MARKERS_CANVAS is null, aborting.'); return; }
  let MARKERS_CANVAS_CTX = MARKERS_CANVAS.getContext('2d');
  if (MARKERS_CANVAS_CTX == null) { sendMessage('WARN', 'MARKERS_CANVAS_CTX is null, aborting.'); return; }
  MARKERS_CANVAS_CTX.clearRect(0, 0, MARKERS_CANVAS.width, MARKERS_CANVAS.height);

  let FOLIAGE_CANVAS = document.getElementById('mapgen4-overlay-foliage') as HTMLCanvasElement;
  if (FOLIAGE_CANVAS == null) { sendMessage('WARN', 'FOLIAGE_CANVAS is null, aborting.'); return; }
  let FOLIAGE_CANVAS_CTX = FOLIAGE_CANVAS.getContext('2d');
  if (FOLIAGE_CANVAS_CTX == null) { sendMessage('WARN', 'FOLIAGE_CANVAS_CTX is null, aborting.'); return; }
  FOLIAGE_CANVAS_CTX.clearRect(0, 0, FOLIAGE_CANVAS.width, FOLIAGE_CANVAS.height);

  let HOVER1_CANVAS = document.getElementById('mapgen4-overlay-hover1') as HTMLCanvasElement;
  if (HOVER1_CANVAS == null) { sendMessage('WARN', 'HOVER1_CANVAS is null, aborting.'); return; }
  let HOVER1_CANVAS_CTX = HOVER1_CANVAS.getContext('2d');
  if (HOVER1_CANVAS_CTX == null) { sendMessage('WARN', 'HOVER1_CANVAS_CTX is null, aborting.'); return; }
  HOVER1_CANVAS_CTX.clearRect(0, 0, HOVER1_CANVAS.width, HOVER1_CANVAS.height);

  let HOVER2_CANVAS = document.getElementById('mapgen4-overlay-hover2') as HTMLCanvasElement;
  if (HOVER2_CANVAS == null) { sendMessage('WARN', 'HOVER2_CANVAS is null, aborting.'); return; }
  let HOVER2_CANVAS_CTX = HOVER2_CANVAS.getContext('2d');
  if (HOVER2_CANVAS_CTX == null) { sendMessage('WARN', 'HOVER2_CANVAS_CTX is null, aborting.'); return; }
  HOVER2_CANVAS_CTX.clearRect(0, 0, HOVER2_CANVAS.width, HOVER2_CANVAS.height);

  //let GL_CANVAS = /** @type{HTMLCanvasElement} */(document.getElementById('mapgen4'));
  //let GL_CANVAS_CTX = GL_CANVAS.getContext('webgl');

  initProcess(MAP, MESH, MARKERS_CANVAS, render_params);
  initDraw(MAP, MESH, MARKERS_CANVAS_CTX, FOLIAGE_CANVAS_CTX, HOVER1_CANVAS_CTX, HOVER2_CANVAS_CTX);
  
  console.log(MAP);

  ///

  console.log('Drawing biomes');
  drawBiomes();


  console.log('Processing towns & cities');
  let city_t_indexes = determineCities(CONFIG.placement.city.city_count);
  let town_t_indexes = determineCities(CONFIG.placement.city.town_count, city_t_indexes);

  applyCityNames(city_t_indexes);
  applyTownNames(town_t_indexes);

  console.log('Processing roads');
  let roads = determineRoads(city_t_indexes, town_t_indexes);
  console.log('Drawing roads');
  drawRoads(roads);

  console.log('Processing borders');
  let regions = determineRegions(city_t_indexes) as Regions;

  console.log('Drawing region names');
  drawRegionNames(city_t_indexes, regions);

  console.log('Drawing borders');
  drawBorders(regions);

  console.log('Drawing towns & cities');
  drawTownsAndCities(city_t_indexes, town_t_indexes);

  ///

  setTimeout(function(){
    sendMessage('FINISH-GENERATE', saveState(
      roads,
      regions,
      city_t_indexes,
      town_t_indexes,
      [],
      gatherLocations([...roads.keys()])
    ));
  }, 1000);

  //startPlayer(roads, city_t_indexes, town_t_indexes, []);

}

function loadMap(map, renderParams) {
  let render_params = renderParams;

  const savedData = getLoadData();
  if(savedData == null) { sendMessage('WARN', '<load> savedData is null, aborting.'); return; }

  let MAP = map;
  if (MAP == null) { sendMessage('WARN', 'MAP is null, aborting.'); return; }

  let MESH = new TriangleMesh(map.mesh);
  if (MESH == null) { sendMessage('WARN', 'MESH is null, aborting.'); return; }

  const FOLIAGE_CANVAS = document.getElementById('mapgen4-overlay-foliage') as HTMLCanvasElement;
  if (FOLIAGE_CANVAS == null) { sendMessage('WARN', '<load> FOLIAGE_CANVAS is null, aborting.'); return; }
  const FOLIAGE_CANVAS_CTX = FOLIAGE_CANVAS.getContext('2d');
  if (FOLIAGE_CANVAS_CTX == null) { sendMessage('WARN', '<load> FOLIAGE_CANVAS_CTX is null, aborting.'); return; }

  const MARKERS_CANVAS = document.getElementById('mapgen4-overlay-markers') as HTMLCanvasElement;
  if (MARKERS_CANVAS == null) { sendMessage('WARN', '<load> MARKERS_CANVAS is null, aborting.'); return; }
  const MARKERS_CANVAS_CTX = MARKERS_CANVAS.getContext('2d');
  if (MARKERS_CANVAS_CTX == null) { sendMessage('WARN', '<load> MARKERS_CANVAS_CTX is null, aborting.'); return; }

  const HOVER1_CANVAS = document.getElementById('mapgen4-overlay-hover1') as HTMLCanvasElement;
  if(HOVER1_CANVAS == null){ sendMessage('WARN', '<load> HOVER1_CANVAS is null, aborting.'); return; }
  const HOVER1_CANVAS_CTX = HOVER1_CANVAS.getContext('2d');
  if (HOVER1_CANVAS_CTX == null) { sendMessage('WARN', '<load> HOVER1_CANVAS_CTX is null, aborting.'); return; }

  const HOVER2_CANVAS = document.getElementById('mapgen4-overlay-hover2') as HTMLCanvasElement;
  if(HOVER2_CANVAS == null){ sendMessage('WARN', '<load> HOVER2_CANVAS is null, aborting.'); return; }
  const HOVER2_CANVAS_CTX = HOVER2_CANVAS.getContext('2d');
  if (HOVER2_CANVAS_CTX == null) { sendMessage('WARN', '<load> HOVER2_CANVAS_CTX is null, aborting.'); return; }
  
  let foliageImage = new Image();
  foliageImage.src = savedData.canvases.foliage;
  foliageImage.onload = function(){
    FOLIAGE_CANVAS_CTX.drawImage(foliageImage, 0, 0);
  }

  let markersImage = new Image();
  markersImage.src = savedData.canvases.markers;
  markersImage.onload = function(){
    MARKERS_CANVAS_CTX.drawImage(markersImage, 0, 0);
  }

  let hover1Image = new Image();
  hover1Image.src = savedData.canvases.hover1;
  hover1Image.onload = function(){
    HOVER1_CANVAS_CTX.drawImage(hover1Image, 0, 0);
  }

  let hover2Image = new Image();
  hover2Image.src = savedData.canvases.hover2;
  hover2Image.onload = function(){
    HOVER2_CANVAS_CTX.drawImage(hover2Image, 0, 0);
  }

  initProcess(MAP, MESH, MARKERS_CANVAS, render_params);

  ///

  sendMessage('FINISH-LOAD');

}


