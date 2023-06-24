/*
 * From http://www.redblobgames.com/maps/mapgen4/
 * Copyright 2018 Red Blob Games <redblobgames@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import param from './config';
import { makeMesh } from './mesh';
import Painting from './painting';
import Renderer from './render';
import { initWorkerHandler, workerHandler } from './fake_worker';
import {
  getRandomDouble,
  getRandomInt,
} from './extension_math';
import { newState, loadState } from './extension_state_manager';
import sendMessage from './extension_messages';
import { getPlayerData, setPlayerData } from './extension_player';

// [name, initialValue, min, max]
function getInitialParams() {
  return {
    elevation: [
      ['seed', getRandomInt(1, 1 << 30), 1, 1 << 30],
      ['island', -1 * Math.pow(getRandomDouble(0, 1) - 1, 2) + 1, 0, 1],
      ['noisy_coastlines', getRandomDouble(0, 0.04), 0, 0.1],
      ['hill_height', getRandomDouble(0, 0.025), 0, 0.1],
      ['mountain_jagged', getRandomDouble(0, 0.5), 0, 1],
      ['mountain_sharpness', getRandomDouble(10.2, 12), 9.5, 12.5],
      ['ocean_depth', getRandomDouble(1.2, 1.8), 1, 3],
    ],
    biomes: [
      ['wind_angle_deg', getRandomInt(0, 360), 0, 360],
      ['raininess', getRandomDouble(1.5, 1.5), 0, 2],
      ['rain_shadow', getRandomDouble(0.1, 1), 0.1, 2],
      ['evaporation', getRandomDouble(0.4, 0.6), 0, 1],
    ],
    rivers: [
      ['lg_min_flow', 2.7, -5, 5],
      ['lg_river_width', -2.7, -5, 5],
      ['flow', 0.2, 0, 1],
    ],
    render: [
      ['zoom', 0.21, 0.1, 2],
      ['x', 500, 0, 1000],
      ['y', 500, 0, 1000],
      ['light_angle_deg', 80, 0, 360],
      ['slope', 2, 0, 5],
      ['flat', 2.5, 0, 5],
      ['ambient', 0.25, 0, 1],
      ['overhead', 30, 0, 60],
      ['tilt_deg', 0, 0, 90],
      ['rotate_deg', 0, -180, 180],
      ['mountain_height', 50, 0, 250],
      ['outline_depth', 1, 0, 2],
      ['outline_strength', 15, 0, 30],
      ['outline_threshold', 0, 0, 100],
      ['outline_coast', 0, 0, 1],
      ['outline_water', 10.0, 0, 20], // things start going wrong when this is high
      ['biome_colors', 1, 0, 1],
    ],
  };
}


/** @typedef { import("./types").Mesh } Mesh */

/**
 * Starts the UI, once the mesh has been loaded in.
 *
 * @param {{mesh: Mesh, peaks_t: number[]}} _
 */
function main({ mesh, peaks_t }) {
  let render = new Renderer(mesh);

  /* set initial parameters */
  const initialParams = getInitialParams();

  for (let phase of ['elevation', 'biomes', 'rivers', 'render']) {
    for (let [name, initialValue, min, max] of initialParams[phase]) {
      param[phase][name] = initialValue;
    }
  }

  function redraw() {
    render.updateView(param.render);
  }

  /* Ask render module to copy WebGL into Canvas */
  /*
  function download() {
      render.screenshotCallback = () => {
          let a = document.createElement('a');
          render.screenshotCanvas.toBlob(blob => {
              // TODO: Firefox doesn't seem to allow a.click() to
              // download; is it everyone or just my setup?
              a.href = URL.createObjectURL(blob);
              a.setAttribute('download', `mapgen4-${param.elevation.seed}.png`);
              a.click();
          });
      };
      render.updateView(param.render);
  }
  */

  Painting.screenToWorldCoords = (coords) => {
    let out = render.screenToWorld(coords);
    return [out[0] / 1000, out[1] / 1000];
  };

  Painting.onUpdate = () => {
    generate();
  };

  let working = false;
  let workRequested = false;
  let elapsedTimeHistory = [];

  function processWorkerResults(resultData) {

    working = false;
    let { elapsed, numRiverTriangles, quad_elements_buffer, a_quad_em_buffer, a_river_xyuv_buffer } = resultData;
    elapsedTimeHistory.push(elapsed | 0);
    if (elapsedTimeHistory.length > 10) { elapsedTimeHistory.splice(0, 1); }
    //const timingDiv = document.getElementById('timing');
    //if (timingDiv) { timingDiv.innerText = `${elapsedTimeHistory.join(' ')} milliseconds`; }
    render.quad_elements = new Int32Array(quad_elements_buffer);
    render.a_quad_em = new Float32Array(a_quad_em_buffer);
    render.a_river_xyuv = new Float32Array(a_river_xyuv_buffer);
    render.numRiverTriangles = numRiverTriangles;
    render.updateMap();
    redraw();
    if (workRequested) {
      requestAnimationFrame(() => {
        workRequested = false;
        generate();
      });
    }

  }

  function updateUI() {
    let userHasPainted = Painting.userHasPainted();
  }

  function generate() {
    if (!working) {
      working = true;
      Painting.setElevationParam(param.elevation);
      updateUI();
      let workerResults = workerHandler({
        param,
        constraints: {
          size: Painting.size,
          constraints: Painting.constraints,
        },
        quad_elements_buffer: render.quad_elements.buffer,
        a_quad_em_buffer: render.a_quad_em.buffer,
        a_river_xyuv_buffer: render.a_river_xyuv.buffer,
      });
      processWorkerResults(workerResults);
    } else {
      workRequested = true;
    }
  }

  initWorkerHandler({ mesh, peaks_t, param });
  generate();

}

export function generateMap() {
  makeMesh().then((output) => {
    main(output);

    const canvasRiver = document.getElementById('mapgen4-river');
    if (canvasRiver) {
      canvasRiver.style.display = `none`;
    }

    const canvasScreenshot = document.getElementById('mapgen4-screenshot');
    if (canvasScreenshot) {
      canvasScreenshot.style.display = `none`;
    }

  });
}

window.newState = newState;
window.loadState = loadState;

window.setPlayerData = setPlayerData;
window.getPlayerData = getPlayerData;

window.onerror = function(message, url, lineNumber) {  
  sendMessage('WARN', `Error at [line #${lineNumber}]: ${message}`);
  return true;
};  
