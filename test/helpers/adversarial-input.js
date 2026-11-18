'use strict';
// Hostile and odd GeoJSON for the adversarial test (invented; payloads must come out as plain escaped text).
const PAY = ['x|y', '<b>y</b>', '[link](https://evil.test)', '<img src=https://evil.test/i.png>', '*b*', '_i_', '$x$', 'www.evil.test', '`code`'];
const cases = [];
PAY.forEach((p, i) => {
  cases.push({ name: 'payload ' + i, text: JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', id: p, properties: { name: p, [p]: p }, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } }, { type: 'Feature', properties: {}, geometry: { type: p, coordinates: [] } }] }) });
});
cases.push({ name: 'type payload', text: JSON.stringify({ type: '<b>x</b>|y' }) });
cases.push({ name: 'prototype names', text: JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { __proto__: 1, constructor: 2, toString: 'x', hasOwnProperty: null }, geometry: { type: 'Point', coordinates: [0, 0] } }] }).replace('"properties":{', '"properties":{"__proto__":1,') });
cases.push({ name: 'deep nesting', text: '{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":' + '['.repeat(20000) + ']'.repeat(20000) + '}}' });
cases.push({ name: 'huge numbers', text: JSON.stringify({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[1e308, -1e308], [0, 0], ['x', null]] } }) });
cases.push({ name: 'many collections', text: JSON.stringify({ type: 'GeometryCollection', geometries: Array.from({ length: 2000 }, () => ({ type: 'GeometryCollection', geometries: [{ type: 'Point', coordinates: [1, 1] }] })) }) });
module.exports = { cases };
