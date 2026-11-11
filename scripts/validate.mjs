import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const elements = JSON.parse(readFileSync(new URL('../app/elements.json', import.meta.url), 'utf8'));
assert.equal(elements.length, 120);
assert.equal(elements.filter(e => !e.theoretical).length, 118);
assert.equal(new Set(elements.map(e => e.symbol)).size, 120);
assert.equal(new Set(elements.map(e => [e.column, e.row].join(','))).size, 120);
for (const [i, e] of elements.entries()) {
  assert.equal(e.number, i + 1);
  assert.equal(e.theoretical, e.number > 118);
  assert.equal(e.shells.reduce((a, b) => a + b, 0), e.number, e.name + ' electrons');
  e.shells.forEach(
      (count, n) => assert.ok(
          Number.isInteger(count) && count >= 0 && count <= 2 * (n + 1) ** 2,
          e.name + ' shell capacity'));
  assert.ok(e.column >= 1 && e.column <= 18);
  assert.ok(e.row >= 1 && e.row <= 10);
  assert.ok(e.summary && e.source.startsWith('https://'));
  if (e.melt !== null && e.boil !== null) assert.ok(e.melt < e.boil, e.name + ' temperatures');
}
for (const [z, column, row] of [
         [1, 1, 1], [2, 18, 1], [26, 8, 4], [57, 3, 8], [71, 17, 8], [89, 3, 9], [103, 17, 9],
         [118, 18, 7], [119, 1, 10], [120, 2, 10]]) {
  const e = elements[z - 1];
  assert.deepEqual([e.column, e.row], [column, row], e.name + ' position');
}
console.log(
    'Validated 118 confirmed records, 2 theoretical records, table positions and shell counts.');

const {heightMapping, metrics} = await import('../app/heights.js');
const carbon = elements[5], hydrogen = elements[0], cesium = elements[54];
assert.equal(metrics.radius.read(carbon), 67);
assert.equal(metrics.radius.read(cesium), 298);
assert.equal(metrics.radius.read(elements[86]), null);
assert.equal(metrics.mass.read(elements[42]), null, 'An isotope mass number is not an atomic weight');
assert.equal(metrics.liquid.read(carbon), null);
for (const key of Object.keys(metrics)) {
  const up = heightMapping(elements, key, 'up');
  const down = heightMapping(elements, key, 'down');
  const centered = heightMapping(elements, key, 'median');
  for (const e of elements) {
    const value = metrics[key].read(e);
    if (value == null) {
      assert.deepEqual([up.height(e), down.height(e), centered.height(e)], [null, null, null]);
    } else {
      assert.ok(up.height(e) >= 0 && up.height(e) <= 2.05);
      assert.equal(down.height(e), -up.height(e));
      assert.equal(Math.sign(centered.height(e)), Math.sign(value - centered.median));
    }
  }
}
assert.ok(heightMapping(elements, 'radius', 'up').height(cesium) > heightMapping(elements, 'radius', 'up').height(hydrogen));
console.log('Verified height calculations, sign conventions, and unavailable values.');
