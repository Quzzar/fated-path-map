
import sendMessage from "./extension_messages";
import { displayPlayer, initHandlePlayer } from "./extension_player";
import { Regions, Roads } from "./extension_process";
import { getSeed, setSeed } from "./extension_seed";
import handleViewport from "./extension_viewport";
import { generateMap } from "./mapgen4";

type Locations = Map<number, {x: number, y: number, name: string}>;

type WorldData = {
  version: string,
  seed: string,
  canvases: {
    foliage: string,
    markers: string,
    hover1: string,
    hover2: string,
  },
  mapData: {
    roads: Roads,
    regions: Regions,
    locations: Locations,
    cities: number[],
    towns: number[],
    dungeons: number[],
  }
};

const objToMap = (o) => new Map(Object.entries(o));
const mapToObj = (m) => [...m].reduce( (o,v)=>{ o[v[0]] = v[1]; return o; },{} );

export function saveState(roads: Roads, regions: Regions, cities: number[], towns: number[], dungeons: number[], locations: Locations): string | undefined {

  const FOLIAGE_CANVAS = document.getElementById('mapgen4-overlay-foliage') as HTMLCanvasElement;
  if (FOLIAGE_CANVAS == null) { sendMessage('WARN', '<save> FOLIAGE_CANVAS is null, aborting.'); return; }
  const FOLIAGE_CANVAS_CTX = FOLIAGE_CANVAS.getContext('2d');
  if (FOLIAGE_CANVAS_CTX == null) { sendMessage('WARN', '<save> FOLIAGE_CANVAS_CTX is null, aborting.'); return; }

  const MARKERS_CANVAS = document.getElementById('mapgen4-overlay-markers') as HTMLCanvasElement;
  if (MARKERS_CANVAS == null) { sendMessage('WARN', '<save> MARKERS_CANVAS is null, aborting.'); return; }
  const MARKERS_CANVAS_CTX = MARKERS_CANVAS.getContext('2d');
  if (MARKERS_CANVAS_CTX == null) { sendMessage('WARN', '<save> MARKERS_CANVAS_CTX is null, aborting.'); return; }

  const HOVER1_CANVAS = document.getElementById('mapgen4-overlay-hover1') as HTMLCanvasElement;
  if(HOVER1_CANVAS == null){ sendMessage('WARN', '<save> HOVER1_CANVAS is null, aborting.'); return; }
  const HOVER1_CANVAS_CTX = HOVER1_CANVAS.getContext('2d');
  if (HOVER1_CANVAS_CTX == null) { sendMessage('WARN', '<save> HOVER1_CANVAS_CTX is null, aborting.'); return; }

  const HOVER2_CANVAS = document.getElementById('mapgen4-overlay-hover2') as HTMLCanvasElement;
  if(HOVER2_CANVAS == null){ sendMessage('WARN', '<save> HOVER2_CANVAS is null, aborting.'); return; }
  const HOVER2_CANVAS_CTX = HOVER2_CANVAS.getContext('2d');
  if (HOVER2_CANVAS_CTX == null) { sendMessage('WARN', '<save> HOVER2_CANVAS_CTX is null, aborting.'); return; }

  // convert roads to obj-map version
  let objRoads = {};
  for(const [t_i, connected] of roads.entries()){
    let objConnected = {};
    for(const [nt_i, destinations] of connected.entries()){
      objConnected[nt_i] = mapToObj(destinations);
    }
    objRoads[t_i] = objConnected;
  }

  return JSON.stringify({
    version: '1.0',
    seed: getSeed(),
    canvases: {
      foliage: FOLIAGE_CANVAS.toDataURL('image/png'),
      markers: MARKERS_CANVAS.toDataURL('image/png'),
      hover1: HOVER1_CANVAS.toDataURL('image/png'),
      hover2: HOVER2_CANVAS.toDataURL('image/png'),
    },
    mapData: {
      roads: objRoads,
      regions: mapToObj(regions),
      locations: mapToObj(locations),
      cities: cities,
      towns: towns,
      dungeons: dungeons,
    }
  });

}



let loadType: 'NEW' | 'EXISTING'  = 'NEW';
export function getLoadType() {
  return loadType;
}

let loadData: WorldData | null = null;
export function getLoadData(){
  return loadData;
}


export function newState(seed){
  loadType = 'NEW';
  sendMessage('LOG', `New state being created!`);

  setSeed(seed);

  generateMap();

  handleViewport();
  initHandlePlayer();

  displayPlayer();

}

export function loadState(strSaveData){
  loadType = 'EXISTING';
  sendMessage('LOG', 'Loading from existing state!');

  loadData = JSON.parse(strSaveData) as WorldData;
  setSeed(loadData.seed);

  generateMap();

  handleViewport();
  initHandlePlayer();

  displayPlayer();

}

