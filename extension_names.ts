import { shuffleArray } from "./extension_math";
import {
  townNames,
  cityNames,
} from './data_names';
import sendMessage from "./extension_messages";

let townNameMap = new Map();
let cityNameMap = new Map();

export function applyTownNames(town_t_indexes){
  townNameMap = new Map();

  let shuffledNames = shuffleArray(townNames);
  for(let i = 0; i < town_t_indexes.length; i++){
    let name = shuffledNames[i];
    if(!name) { sendMessage('WARN', '<names> Not enough town names in db, aborting.'); return; }

    townNameMap.set(town_t_indexes[i], name);

  }

  return townNameMap;
}

export function applyCityNames(city_t_indexes){
  cityNameMap = new Map();

  let shuffledNames = shuffleArray(cityNames);
  for(let i = 0; i < city_t_indexes.length; i++){
    let name = shuffledNames[i];
    if(!name) { sendMessage('WARN', '<names> Not enough city names in db, aborting.'); return; }

    cityNameMap.set(city_t_indexes[i], name);

  }

  return cityNameMap;
}

export function getCityName(t_i){
  return cityNameMap.get(t_i);
}
export function getTownName(t_i){
  return townNameMap.get(t_i);
}