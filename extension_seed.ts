import { seedRandom } from "./extension_math";

let _seed = 'default';

export function getSeed(){
  return _seed;
}

export function setSeed(seed: string){
  _seed = seed;
  seedRandom(_seed);
}

