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
