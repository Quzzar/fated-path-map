
import seedrandom from 'seedrandom';
import sendMessage from './extension_messages';

let isSeeded = false;
export function seedRandom(seed){
  sendMessage('LOG', `Seeding random with "${seed}"`)
  isSeeded = true;
  seedrandom(seed, { global: true });
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
export function getRandomDouble(min: number, max: number) {
  if(!isSeeded) { sendMessage('WARN', 'Generating random without seed!'); }
  return Math.random() * (max - min) + min;
}

/**
* Returns a random integer between min (inclusive) and max (inclusive).
* The value is no lower than min (or the next integer greater than min
* if min isn't an integer) and no greater than max (or the next integer
* lower than max if max isn't an integer).
* Using Math.round() will give you a non-uniform distribution!
*/
export function getRandomInt(min: number, max: number) {
  if(!isSeeded) { sendMessage('WARN', 'Generating random without seed!'); }
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

///

export function getRandomElement(array: any[]){
  if(!isSeeded) { sendMessage('WARN', 'Generating random without seed!'); }
  return array[Math.floor(Math.random()*array.length)];
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
export function shuffleArray(a: any[]) {
  if(!isSeeded) { sendMessage('WARN', 'Generating random without seed!'); }
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
  return a;
}

///

// Push into FlatQueue (MinQueue only) but trying to get result as a MaxQueue
// WARNING: This does change internal priority! Use getPriorityFlatQueueforMax()
export function pushFlatQueueforMax(queue, key, priority, no_negative_adder = 100) {
  let n = priority + no_negative_adder;// Add to make not negative
  if (n <= 0) {
    console.warn(`Max FlatQueue priority is still negative, adding "${no_negative_adder}" was not large enough! NOT displaying data correctly!!!`);
  }
  queue.push(key, 1 / n);
}
export function getPriorityFlatQueueforMax(falsePriority, no_negative_adder = 100) {
  return (1 - falsePriority*no_negative_adder) / falsePriority;
}

export function toMatrix(arr, width) {
  return arr.reduce((rows, key, index) => (index % width == 0 ? rows.push([key])
    : rows[rows.length - 1].push(key)) && rows, []);
}

export function distanceBetween(x1, y1, x2, y2) {
  return Math.sqrt((Math.pow(x1 - x2, 2)) + (Math.pow(y1 - y2, 2)))
};

export function coordCenterBetween(x1, y1, x2, y2) {
  let x_diff = x1 - x2;
  let y_diff = y1 - y2;
  return {
    x: x1 - x_diff/2,
    y: y1 - y_diff/2,
  };
};

export function clamp(x, lo, hi) {
  if (x < lo) { x = lo; }
  if (x > hi) { x = hi; }
  return x;
}

export function unorderedPairingFunction(x , y){
  return x * y + Math.trunc(Math.pow(Math.abs(x - y) - 1, 2) / 4);
}

export function scaleBetween(unscaledNum, min, max, minAllowed, maxAllowed) {
  return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
}