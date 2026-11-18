'use strict';
// Contract tests: written from the specification examples. Do not edit; fix src/core.js instead.
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core');

const plain = (v) => JSON.parse(JSON.stringify(v === undefined ? null : v));

test('core exports every specified function', () => {
  for (const n of ["haversineKm", "ringAreaKm2", "reportSummary", "reportValidation", "reportProperties", "reportQuality", "reportMeasurements"]) assert.equal(typeof core[n], 'function', n);
});

test("haversineKm example 1", () => {
  assert.deepStrictEqual(plain(core.haversineKm([13.404954, 52.520008], [11.581981, 48.135125])), 504.414);
});

test("haversineKm example 2", () => {
  assert.deepStrictEqual(plain(core.haversineKm([0, 0], [0, 1])), 111.195);
});

test("haversineKm example 3", () => {
  assert.deepStrictEqual(plain(core.haversineKm([0, 0], "x")), 0);
});

test("ringAreaKm2 example 1", () => {
  assert.deepStrictEqual(plain(core.ringAreaKm2([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]])), -12363.718);
});

test("ringAreaKm2 example 2", () => {
  assert.deepStrictEqual(plain(core.ringAreaKm2([[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]])), 12363.718);
});

test("ringAreaKm2 example 3", () => {
  assert.deepStrictEqual(plain(core.ringAreaKm2([[0, 0], [1, 0], [0, 0]])), 0);
});

test("reportSummary example 1", () => {
  const md = core.reportSummary("{\n  \"type\": \"FeatureCollection\",\n  \"crs\": { \"type\": \"name\", \"properties\": { \"name\": \"EPSG:4326\" } },\n  \"features\": [\n    { \"type\": \"Feature\", \"id\": 1, \"properties\": { \"name\": \"Central Park\", \"visitors\": 42000000 },\n      \"geometry\": { \"type\": \"Polygon\", \"coordinates\": [[[-73.9819, 40.7681], [-73.9580, 40.8006], [-73.9493, 40.7968], [-73.9730, 40.7644], [-73.9819, 40.7681]]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Ride\", \"surface\": null },\n      \"geometry\": { \"type\": \"LineString\", \"coordinates\": [[13.404954, 52.520008], [13.404954, 52.520008], [11.581981, 48.135125]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Swapped\" }, \"geometry\": { \"type\": \"Point\", \"coordinates\": [48.2082, 16.3738123456] } },\n    { \"type\": \"Feature\", \"properties\": null, \"geometry\": null },\n    { \"type\": \"Feature\", \"geometry\": { \"type\": \"Polygon\", \"coordinates\": [[[0, 0], [1, 0], [1, 1]]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Bad lat\" }, \"geometry\": { \"type\": \"Point\", \"coordinates\": [10, 95] } }\n  ]\n}\n");
  assert.equal(typeof md, 'string');
  for (const s of ["FeatureCollection with 6 features (1 with an id, 1 without geometry).", "Bounding box: -73.9819, 0, 48.2082, 52.520008 (west, south, east, north).", "| Geometry type | Features |", "| Point | 2 |", "| LineString | 1 |", "| Polygon | 2 |"]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportSummary example 2", () => {
  const md = core.reportSummary("nope");
  assert.equal(typeof md, 'string');
  for (const s of ["# GeoJSON Summary", "This file is not GeoJSON: the text is not JSON."]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportValidation example 1", () => {
  const md = core.reportValidation("{\n  \"type\": \"FeatureCollection\",\n  \"crs\": { \"type\": \"name\", \"properties\": { \"name\": \"EPSG:4326\" } },\n  \"features\": [\n    { \"type\": \"Feature\", \"id\": 1, \"properties\": { \"name\": \"Central Park\", \"visitors\": 42000000 },\n      \"geometry\": { \"type\": \"Polygon\", \"coordinates\": [[[-73.9819, 40.7681], [-73.9580, 40.8006], [-73.9493, 40.7968], [-73.9730, 40.7644], [-73.9819, 40.7681]]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Ride\", \"surface\": null },\n      \"geometry\": { \"type\": \"LineString\", \"coordinates\": [[13.404954, 52.520008], [13.404954, 52.520008], [11.581981, 48.135125]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Swapped\" }, \"geometry\": { \"type\": \"Point\", \"coordinates\": [48.2082, 16.3738123456] } },\n    { \"type\": \"Feature\", \"properties\": null, \"geometry\": null },\n    { \"type\": \"Feature\", \"geometry\": { \"type\": \"Polygon\", \"coordinates\": [[[0, 0], [1, 0], [1, 1]]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Bad lat\" }, \"geometry\": { \"type\": \"Point\", \"coordinates\": [10, 95] } }\n  ]\n}\n");
  assert.equal(typeof md, 'string');
  for (const s of ["4 problems found.", "| \\(root\\) | the crs member is not part of RFC 7946 \\(coordinates are always WGS 84 longitude, latitude\\) |", "| features\\[4\\] | a feature needs a properties member \\(it may be null\\) |", "| features\\[4\\].geometry.coordinates\\[0\\] | a ring needs at least 4 positions |", "| features\\[5\\].geometry.coordinates | latitude 95 is out of range; longitude and latitude look swapped |"]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportValidation example 2", () => {
  const md = core.reportValidation("{\"type\":\"Point\",\"coordinates\":[1,2]}");
  assert.equal(typeof md, 'string');
  for (const s of ["# GeoJSON Validation", "No problems found."]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportProperties example 1", () => {
  const md = core.reportProperties("{\n  \"type\": \"FeatureCollection\",\n  \"crs\": { \"type\": \"name\", \"properties\": { \"name\": \"EPSG:4326\" } },\n  \"features\": [\n    { \"type\": \"Feature\", \"id\": 1, \"properties\": { \"name\": \"Central Park\", \"visitors\": 42000000 },\n      \"geometry\": { \"type\": \"Polygon\", \"coordinates\": [[[-73.9819, 40.7681], [-73.9580, 40.8006], [-73.9493, 40.7968], [-73.9730, 40.7644], [-73.9819, 40.7681]]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Ride\", \"surface\": null },\n      \"geometry\": { \"type\": \"LineString\", \"coordinates\": [[13.404954, 52.520008], [13.404954, 52.520008], [11.581981, 48.135125]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Swapped\" }, \"geometry\": { \"type\": \"Point\", \"coordinates\": [48.2082, 16.3738123456] } },\n    { \"type\": \"Feature\", \"properties\": null, \"geometry\": null },\n    { \"type\": \"Feature\", \"geometry\": { \"type\": \"Polygon\", \"coordinates\": [[[0, 0], [1, 0], [1, 1]]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Bad lat\" }, \"geometry\": { \"type\": \"Point\", \"coordinates\": [10, 95] } }\n  ]\n}\n");
  assert.equal(typeof md, 'string');
  for (const s of ["3 properties across 6 features.", "| name | 4 | 2 | string |", "| surface | 1 | 5 | null |", "| visitors | 1 | 5 | number |"]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportQuality example 1", () => {
  const md = core.reportQuality("{\n  \"type\": \"FeatureCollection\",\n  \"crs\": { \"type\": \"name\", \"properties\": { \"name\": \"EPSG:4326\" } },\n  \"features\": [\n    { \"type\": \"Feature\", \"id\": 1, \"properties\": { \"name\": \"Central Park\", \"visitors\": 42000000 },\n      \"geometry\": { \"type\": \"Polygon\", \"coordinates\": [[[-73.9819, 40.7681], [-73.9580, 40.8006], [-73.9493, 40.7968], [-73.9730, 40.7644], [-73.9819, 40.7681]]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Ride\", \"surface\": null },\n      \"geometry\": { \"type\": \"LineString\", \"coordinates\": [[13.404954, 52.520008], [13.404954, 52.520008], [11.581981, 48.135125]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Swapped\" }, \"geometry\": { \"type\": \"Point\", \"coordinates\": [48.2082, 16.3738123456] } },\n    { \"type\": \"Feature\", \"properties\": null, \"geometry\": null },\n    { \"type\": \"Feature\", \"geometry\": { \"type\": \"Polygon\", \"coordinates\": [[[0, 0], [1, 0], [1, 1]]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Bad lat\" }, \"geometry\": { \"type\": \"Point\", \"coordinates\": [10, 95] } }\n  ]\n}\n");
  assert.equal(typeof md, 'string');
  for (const s of ["4 findings.", "| features\\[0\\].geometry.coordinates\\[0\\] | orientation | the exterior ring is clockwise; RFC 7946 asks for counterclockwise |", "| features\\[1\\].geometry.coordinates\\[1\\] | duplicate_point | the same position as the one before it |", "| features\\[2\\].geometry.coordinates | precision | more than 7 decimals \\(finer than 1 cm\\); the file is larger than it needs to be |", "| features\\[3\\] | null_geometry | the feature has no geometry |"]) assert.ok(md.includes(s), 'missing: ' + s);
});

test("reportMeasurements example 1", () => {
  const md = core.reportMeasurements("{\n  \"type\": \"FeatureCollection\",\n  \"crs\": { \"type\": \"name\", \"properties\": { \"name\": \"EPSG:4326\" } },\n  \"features\": [\n    { \"type\": \"Feature\", \"id\": 1, \"properties\": { \"name\": \"Central Park\", \"visitors\": 42000000 },\n      \"geometry\": { \"type\": \"Polygon\", \"coordinates\": [[[-73.9819, 40.7681], [-73.9580, 40.8006], [-73.9493, 40.7968], [-73.9730, 40.7644], [-73.9819, 40.7681]]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Ride\", \"surface\": null },\n      \"geometry\": { \"type\": \"LineString\", \"coordinates\": [[13.404954, 52.520008], [13.404954, 52.520008], [11.581981, 48.135125]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Swapped\" }, \"geometry\": { \"type\": \"Point\", \"coordinates\": [48.2082, 16.3738123456] } },\n    { \"type\": \"Feature\", \"properties\": null, \"geometry\": null },\n    { \"type\": \"Feature\", \"geometry\": { \"type\": \"Polygon\", \"coordinates\": [[[0, 0], [1, 0], [1, 1]]] } },\n    { \"type\": \"Feature\", \"properties\": { \"name\": \"Bad lat\" }, \"geometry\": { \"type\": \"Point\", \"coordinates\": [10, 95] } }\n  ]\n}\n");
  assert.equal(typeof md, 'string');
  for (const s of ["| Feature | Geometry | Length (km) | Area (km\u00b2) |", "| Central Park | Polygon | 9.955 | 3.509 |", "| Ride | LineString | 504.414 | - |", "Total: 736.759 km, 3.509 km\u00b2."]) assert.ok(md.includes(s), 'missing: ' + s);
});
