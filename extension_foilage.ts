
import {
  getRandomDouble as getRandomRange
} from './extension_math';


  //let paths = `<path d="${generateForest(coords, 1)}" fill="${color}" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />`;

  /*
  let paths = '';
  for(let i = 0; i < 4; i++){

    let r = getRandomInt(1, size*20);
    let theta = getRandomDouble(0, 2*Math.PI);

    let x_offset = r * Math.cos(theta);
    let y_offset = r * Math.sin(theta);

    let new_coords = { x: coords.x+x_offset, y: coords.y+y_offset };

    let d = generateTree(new_coords, size);
    paths += `<path d="${d}" fill="${color}" stroke="black" stroke-width="0.1" stroke-linecap="round" stroke-linejoin="round" />`;

  }*/

export function generateForest(offset: { x: number, y: number }, scale: number){

  let path = '';

  for(let point of createPoints(6)){

    path += genCurve(offset, 1, {
      c_1: { x: 0.6667*point.x, y: 0.3333*point.y },
      c_2: { x: 1.3333*point.x, y: 0.6667*point.y },
      rel_end: point,
    });

  }

  return `M ${offset.x} ${offset.y} ${path}`

}



function createPoints(numPoints: number) {
  const points: any[] = [];

  // used to equally space each point around the circle
  const angleStep = (Math.PI * 2) / numPoints;
  // the radius of the circle
  const rad = 75;

  for (let i = 1; i <= numPoints; i++) {
    // x & y coordinates of the current point
    const theta = i * angleStep;

    const x = 100 + Math.cos(theta) * rad;
    const y = 100 + Math.sin(theta) * rad;

    // store the point's position
    points.push({
      x: x,
      y: y,
    });
  }

  return points;
}






export function generateTree(offset: { x: number, y: number }, scale: number){



  return hexTree(offset, scale);


}


function hexTree(offset: { x: number, y: number }, scale: number){

  let path = '';
  path += genCurve(offset, scale, {
    c_1: { x: 0.6667, y: -0.3333 },
    c_2: { x: 1.3333, y: -0.6667 },
    rel_end: { x: 2, y: -1 },
  });
  path += genCurve(offset, scale, {
    c_1: { x: 2.6667, y: -0.6667 },
    c_2: { x: 3.3333, y: -0.3333 },
    rel_end: { x: 4, y: 0 },
  });
  path += genCurve(offset, scale, {
    c_1: { x: 4, y: 0.6667 },
    c_2: { x: 4, y: 1.3333 },
    rel_end: { x: 4, y: 2 },
  });
  path += genCurve(offset, scale, {
    c_1: { x: 3.3333, y: 2.3333 },
    c_2: { x: 2.6667, y: 2.6667 },
    rel_end: { x: 2, y: 3 },
  });

  if(getRandomRange(0, 100) <= STUMP_CHANCE){
    path += ` L ${offset.x+2*scale} ${offset.y+4*scale} L ${offset.x+2*scale} ${offset.y+3*scale} `;
  }

  path += genCurve(offset, scale, {
    c_1: { x: 1.3333, y: 2.6667 },
    c_2: { x: 0.6667, y: 2.3333 },
    rel_end: { x: 0, y: 2 },
  });
  path += genCurve(offset, scale, {
    c_1: { x: 0, y: 1.3333 },
    c_2: { x: 0, y: 0.6667 },
    rel_end: { x: 0, y: 0 },
  });

  return `M ${offset.x} ${offset.y} ${path}`

}

interface CurveData {
  c_1: { x: number, y: number },
  c_2: { x: number, y: number },
  rel_end: { x: number, y: number },
}
const CURVE_MIN = 0.6;
const CURVE_MAX = 1.8;
const STUMP_CHANCE = 20;//%

function genCurve(offset: { x: number, y: number }, scale: number, data: CurveData){
  return ` C ${offset.x+data.c_1.x*getRandomRange(CURVE_MIN, CURVE_MAX)*scale} ${offset.y+data.c_1.y*getRandomRange(CURVE_MIN, CURVE_MAX)*scale} ${offset.x+data.c_2.x*getRandomRange(CURVE_MIN, CURVE_MAX)*scale} ${offset.y+data.c_2.y*getRandomRange(CURVE_MIN, CURVE_MAX)*scale} ${offset.x+data.rel_end.x*scale} ${offset.y+data.rel_end.y*scale} `;
}






