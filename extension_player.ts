
import { Canvg } from 'canvg';
import { locationPinSvg } from './data_images';
import { getRandomElement, getRandomInt } from './extension_math';
import sendMessage from './extension_messages';
import { getScreenCoordsWithT, Roads } from './extension_process';

let PLAYER_CANVAS: HTMLCanvasElement | null = null;
let PLAYER_CANVAS_CTX: CanvasRenderingContext2D | null = null;

export function initHandlePlayer() {

  PLAYER_CANVAS = document.getElementById('mapgen4-overlay-player') as HTMLCanvasElement;
  if (PLAYER_CANVAS == null) { sendMessage('WARN', 'PLAYER_CANVAS is null, aborting.'); return; }

  PLAYER_CANVAS_CTX = PLAYER_CANVAS.getContext('2d');

}

/*
let current_t_i = -1;
export function startPlayer(roads: Roads, cities: number[], towns: number[], dungeons: number[]) {
  if (PLAYER_CANVAS == null) { return; }

  for(let c of cities){
    let connected = roads.get(c);
    if(connected && connected.size === 0){
      console.log('City ('+getCityName(c)+', #'+c+') isn\'t connected!');
    }
  }
  for(let t of towns){
    let connected = roads.get(t);
    if(connected && connected.size === 0){
      console.log('Town ('+getTownName(t)+', #'+t+') isn\'t connected!');
    }
  }
  console.log(towns);
  console.log(roads);

  current_t_i = getRandomElement(towns);
  movePlayer(roads, cities, towns, dungeons);

  setInterval(() => {
    movePlayer(roads, cities, towns, dungeons);
  }, 1000);

}

function movePlayer(roads: Roads, cities: number[], towns: number[], dungeons: number[]){

  drawPlayer(getScreenCoordsWithT(current_t_i));

  let roadInfo = getRoadInfo(roads, current_t_i, cities, towns, dungeons);
  if(!roadInfo) { return; }

  let found = false;
  for(let path of roadInfo.paths){
    if(path.direction == 'SOUTH' || path.direction == 'SOUTH-EAST' || path.direction == 'SOUTH-WEST'){
      if(getRandomInt(0, 100) > 80){ break; }

      current_t_i = path.nt_i;
      found = true;
      break;
    }
  }

  if(!found && roadInfo.paths.length > 1){
    current_t_i = getRandomElement(roadInfo.paths).nt_i;
  }

  console.log(roadInfo);

}*/


let playerData = {
  version: '1.0',
  current_t_i: -1,
};

export function setPlayerData(newData){
  playerData = newData;
  displayPlayer();
  sendMessage('LOG', 'Updating player location! '+newData.current_t_i);
}

export function getPlayerData(){
  return playerData;
}

export function displayPlayer(){
  if(playerData.current_t_i === -1) { return; }
  drawPlayer(getScreenCoordsWithT(playerData.current_t_i));
}

function drawPlayer(coords) {
  if (PLAYER_CANVAS_CTX == null) { return; }

  let width = 30;
  let height = 30;

  Canvg.fromString(PLAYER_CANVAS_CTX, `
    <svg>
      <g>
        <image href="data:image/svg+xml,${locationPinSvg}" x="${coords.x - (width / 2)}" y="${coords.y - (height / 2) - 20}" width="${width}" height="${height}" />
      </g>
    </svg>
  `).start({ ignoreMouse: true, ignoreDimensions: true });

}
