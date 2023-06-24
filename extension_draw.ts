
import { Canvg } from 'canvg';
import TriangleMesh from '@redblobgames/dual-mesh';
import sendMessage from './extension_messages';
import { roundPathCorners } from './utils_path_rounding';
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
import {
  forest1Data,
  forest2Data,
  forest3Data,
  forest4Data,
  forest5Data,
  forest6Data,
  forest7Data,
  forest8Data,

  forest1Png,
  forest2Png,
  forest3Png,
  forest4Png,
  forest5Png,
  forest6Png,
  forest7Png,
  forest8Png, // @ts-ignore
} from './data_images';
import { applyCityNames, applyTownNames, getCityName, getTownName } from './extension_names';
import { BIOMES, buildSvgPaths, getBiome, getScreenCoordsWithR, getScreenCoordsWithT, getSideBetweenTriangles } from './extension_process';
import { CONFIG } from './extension_map';


let MAP: any = null;
let MESH: TriangleMesh | null = null;

let MARKERS_CANVAS_CTX: CanvasRenderingContext2D | null = null;
let FOLIAGE_CANVAS_CTX: CanvasRenderingContext2D | null = null;
let HOVER1_CANVAS_CTX: CanvasRenderingContext2D | null = null;
let HOVER2_CANVAS_CTX: CanvasRenderingContext2D | null = null;


export function initDraw(_MAP, _MESH, _MARKERS_CANVAS_CTX, _FOLIAGE_CANVAS_CTX, _HOVER1_CANVAS_CTX, _HOVER2_CANVAS_CTX){

  MAP = _MAP;
  MESH = _MESH;

  MARKERS_CANVAS_CTX = _MARKERS_CANVAS_CTX;
  FOLIAGE_CANVAS_CTX = _FOLIAGE_CANVAS_CTX;
  HOVER1_CANVAS_CTX = _HOVER1_CANVAS_CTX;
  HOVER2_CANVAS_CTX = _HOVER2_CANVAS_CTX;

}

///

export function drawBiomes(){
  if(!MESH) { return; }
  
  let visitedTs = new Set();

  function getPrimaryBiome(r_i, percentage) {
    if (MESH == null) { return null; }
    if (getRandomDouble(0, 1) <= 0.50) { return null; }

    let nearbyTs = new Set<number>();
    let nr_indexes = MESH.r_circulate_r([], r_i);
    for (let nr_i of nr_indexes) {
      if (nr_i == r_i) { continue; }
      let nnr_indexes = MESH.r_circulate_r([], nr_i);
      for (let nnr_i of nnr_indexes) {
        if (nnr_i == nr_i) { continue; }
        let et_indexes = MESH.r_circulate_t([], nnr_i);
        for (let et_i of et_indexes) {
          if (visitedTs.has(et_i)) { return null; }
          nearbyTs.add(et_i);
        }
      }
    }

    //console.log(nearbyTs.size);

    let collectData = new Map();

    for (let t_i of nearbyTs) {
      if (MAP.t_elevation[t_i] <= 0) { return null; }

      let biome = getBiome(t_i);
      if (biome == BIOMES.COAST) { return null; }

      let biomeCount = collectData.get(biome);
      if (biomeCount) {
        biomeCount++;
        collectData.set(biome, biomeCount);
      } else {
        biomeCount = 1;
        collectData.set(biome, biomeCount);
      }
    }

    //console.log(collectData);

    for (const [biome, count] of collectData.entries()) {
      if (count >= Math.floor(percentage * nearbyTs.size)) {

        nearbyTs.forEach(t_i => visitedTs.add(t_i));
        return biome;

      }
    }
    return null;
  }

  for (let r_i = 0; r_i < MAP.mesh.numRegions; r_i++) {

    let primaryBiome = getPrimaryBiome(r_i, 0.90);

    if (primaryBiome != null) {


      if (primaryBiome == BIOMES.TEMPERATE_DECIDUOUS_FOREST) {
        drawForest(getScreenCoordsWithR(r_i));
      } else if (primaryBiome == BIOMES.TROPICAL_SEASONAL_FOREST) {
        drawForest(getScreenCoordsWithR(r_i));
      } else if (primaryBiome == BIOMES.TEMPERATE_RAIN_FOREST) {
        drawForest(getScreenCoordsWithR(r_i));
      } else if (primaryBiome == BIOMES.TROPICAL_RAIN_FOREST) {
        drawForest(getScreenCoordsWithR(r_i));
      }

      //console.log(primaryBiome.name);

      //drawCircleEmpty(getScreenCoordsWithR(r_i), 20, primaryBiome.color);
    }

    // Sampling t_i from r_i
    let biome = getBiome(MESH.r_circulate_t([], r_i)[0]);

    if (biome != BIOMES.COAST && biome != BIOMES.SHALLOW_OCEAN && biome != BIOMES.DEEP_OCEAN) {
      //drawCircleFilled(getScreenCoordsWithR(r_i), 5, biome.color);
    } else if (biome == BIOMES.COAST) {
      drawCircleFilled(getScreenCoordsWithR(r_i), 5, biome.color);
    }

  }

}

export function drawTownsAndCities(city_t_indexes, town_t_indexes){

  let cityColors = new Map();
  for (let ct_i of city_t_indexes) {
    cityColors.set(ct_i, {
      r: getRandomInt(0, 255),
      g: getRandomInt(0, 255),
      b: getRandomInt(0, 255),
    });
  }
  function getCityRGBA(ct_i, a) {
    let cityColor = cityColors.get(ct_i);
    return `rgba(${cityColor.r},${cityColor.g},${cityColor.b},${a})`
  }

  ///

  for (let i = 0; i < city_t_indexes.length; i++) {
    drawCircleFilled(getScreenCoordsWithT(city_t_indexes[i]), CONFIG.render.city_size, getCityRGBA(city_t_indexes[i], 1.0));

    let textCoords = getScreenCoordsWithT(city_t_indexes[i]);
    textCoords.y -= 50;
    drawTextLocation(textCoords, getCityName(city_t_indexes[i]), '2.2em');
  }

  for (let i = 0; i < town_t_indexes.length; i++) {
    drawCircleFilled(getScreenCoordsWithT(town_t_indexes[i]), CONFIG.render.town_size, `black`);

    let textCoords = getScreenCoordsWithT(town_t_indexes[i]);
    textCoords.y -= 25;
    drawTextLocation(textCoords, getTownName(town_t_indexes[i]), '1.5em');
  }

}

export function drawRoads(roads){
  if (MARKERS_CANVAS_CTX == null) { return; }

  let paths = '';
  for(let d of buildSvgPaths(roads, false)){
    paths += `<path d="${roundPathCorners(d, 0.5, true)}" fill="none" stroke="black" stroke-width="2" stroke-dasharray="8" />`;
  }

  Canvg.fromString(MARKERS_CANVAS_CTX, `
    <svg>
      ${paths}
    </svg>
  `).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });

}

export function drawBorders(regions){
  if (MESH == null || HOVER1_CANVAS_CTX == null || HOVER2_CANVAS_CTX == null) { return; }

  let borderSides = new Set<number>();

  for (const [t_i, data] of regions.entries()) {
    for (const nt_i of MESH.t_circulate_t([], t_i)) {

      if (regions.get(nt_i)?.region_ct_i !== data.region_ct_i) {

        let side = getSideBetweenTriangles(t_i, nt_i);
        if (side == null) { console.warn('Some bug with getting region side!'); continue; }
        if (MESH.s_ghost(side)) { continue; }

        borderSides.add(side);

      }

    }
  }

  let borders = new Map();

  function addBorder(r_i, nr_i) {
    let connected: Map<number, boolean> | undefined = borders.get(r_i);
    if (connected) {
      connected.set(nr_i, true);
    } else {
      borders.set(r_i, new Map().set(nr_i, true));
    }
  }

  for (const side of borderSides) {

    let br_i = MESH.s_begin_r(side);
    let er_i = MESH.s_end_r(side);

    addBorder(br_i, er_i);
    addBorder(er_i, br_i);

  }


  // let borderPaths = '';
  let regionPaths = '';
  for(let d of buildSvgPaths(borders, true)){
    //borderPaths += `<path d="${roundPathCorners(d, 0.5, true)}" fill="none" stroke="white" stroke-width="2" />`;
    regionPaths += `<path d="${roundPathCorners(d, 0.5, true)}" fill="none" stroke="white" stroke-width="6" />`;
  }

  /*
  Canvg.fromString(HOVER1_CANVAS_CTX, `
    <svg>
      ${borderPaths}
    </svg>
  `).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });
  */

  Canvg.fromString(HOVER2_CANVAS_CTX, `
    <svg>
      ${regionPaths}
    </svg>
  `).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });

}

export function drawRegionNames(city_t_indexes, regions){
  if(HOVER2_CANVAS_CTX == null) { return; }

  let categorizedRegions = new Map();
  for(let ct_i of city_t_indexes){
    categorizedRegions.set(ct_i, []);
  }

  for (const [t_i, data] of regions.entries()) {
    categorizedRegions.get(data.region_ct_i).push(getScreenCoordsWithT(t_i));
  }

  let finalRegions = new Map();
  for(const [ct_i, coordsArray] of categorizedRegions){

    let averageCoords = { x: 0, y: 0 };
    for(let coords of coordsArray){
      averageCoords.x += coords.x;
      averageCoords.y += coords.y;
    }
    averageCoords.x = averageCoords.x / coordsArray.length;
    averageCoords.y = averageCoords.y / coordsArray.length;

    finalRegions.set(ct_i, averageCoords);
  }


  let svgText = '';
  for(const [ct_i, averageCoords] of finalRegions){
    svgText += `<text x="${averageCoords.x}" y="${averageCoords.y}" fill="white" font-size="4.5em" dominant-baseline="middle" text-anchor="middle">${getCityName(ct_i)}</text>`;
  }

  Canvg.fromString(HOVER2_CANVAS_CTX, `
    <svg>
      <rect width="4096" height="4096" fill="rgba(0,0,0,0.3)" />
      ${svgText}
    </svg>
  `).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });

}

///

export function drawCircleFilled(coords, size, color) {
  if (MARKERS_CANVAS_CTX == null) { return; }

  Canvg.fromString(MARKERS_CANVAS_CTX, `
    <svg>
      <circle cx="${coords.x}" cy="${coords.y}" r="${size}" fill="${color}" stroke="black" stroke-width="1" />
    </svg>
  `).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });

}

export function drawCircleEmpty(coords, size, color) {
  if (MARKERS_CANVAS_CTX == null) { return; }

  Canvg.fromString(MARKERS_CANVAS_CTX, `
    <svg>
      <circle cx="${coords.x}" cy="${coords.y}" r="${size}" fill="none" stroke="${color}" stroke-width="4" />
    </svg>
  `).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });

}

export function drawTextLocation(coords, text, size){
  if (HOVER1_CANVAS_CTX == null) { return; }

  Canvg.fromString(HOVER1_CANVAS_CTX, `
    <svg>
      <text x="${coords.x}" y="${coords.y}" font-size="${size}" fill="white" dominant-baseline="middle" text-anchor="middle">${text}</text>
    </svg>
  `).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });

}

export function drawHexagon(coords, size, color) {
  if (MARKERS_CANVAS_CTX == null) { return; }

  size = size * 2;

  let _coords = {
    x: coords.x - size * 0.5,
    y: coords.y - size * 0.5,
  }

  Canvg.fromString(MARKERS_CANVAS_CTX, `
    <svg>
      <polygon points="${_coords.x + size * 0.5} ${_coords.y + 0}, ${_coords.x + size} ${_coords.y + size * 0.25}, ${_coords.x + size} ${_coords.y + size * 0.75}, ${_coords.x + size * 0.5} ${_coords.y + size}, ${_coords.x + 0} ${_coords.y + size * 0.75}, ${_coords.x + 0} ${_coords.y + size * 0.25}" fill="${color}" />
    </svg>
  `).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });

}

export function drawDottedLine(coords_1, coords_2) {
  if (MARKERS_CANVAS_CTX == null) { return; }

  Canvg.fromString(MARKERS_CANVAS_CTX, `
  <svg>
    <path d="M${coords_1.x},${coords_1.y} L${coords_2.x},${coords_2.y}" fill="none" stroke="black" stroke-width="2" stroke-dasharray="8" />
  </svg>
  `).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });

}

export function drawSolidLine(coords_1, coords_2, color) {
  if (MARKERS_CANVAS_CTX == null) { return; }

  Canvg.fromString(MARKERS_CANVAS_CTX, `
  <svg>
    <path d="M${coords_1.x},${coords_1.y} L${coords_2.x},${coords_2.y}" fill="none" stroke="${color}" stroke-width="4" />
  </svg>
  `).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });

}

export function drawForest(coords) {
  if (FOLIAGE_CANVAS_CTX == null) { return; }

  let scale = 0.77;

  let forest = getRandomElement([
    { png: forest1Png, size: forest1Data },
    { png: forest2Png, size: forest2Data },
    { png: forest3Png, size: forest3Data },
    //{png: forest4Png, size: forest4Data},
    //{png: forest5Png, size: forest5Data},
    { png: forest6Png, size: forest6Data },
    { png: forest7Png, size: forest7Data },
    { png: forest8Png, size: forest8Data },
  ]); // TODO, make art assets less uniform and less verticle (more flat)

  let width = scale * forest.size.width;
  let height = scale * forest.size.height;

  Canvg.fromString(FOLIAGE_CANVAS_CTX, `
    <svg>
      <g>
        <image crossorigin="anonymous" href="data:image/png;charset=utf-8;base64,${forest.png}" x="${coords.x - (width / 2)}" y="${coords.y - (height / 2)}" width="${width}" height="${height}" />
      </g>
    </svg>
  `).start({ ignoreClear: true, ignoreMouse: true, ignoreDimensions: true });

  //drawCircleEmpty(coords, 20, 'black');

}

