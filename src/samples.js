'use strict';
// The sample files of the Open Sample commands. All data is invented for this product; it names no real company, person or system.

const SAMPLES = {
 "openSample": {
  "title": "Open Sample File",
  "fileName": "city-logistics.geojson",
  "languageId": "json",
  "text": "{\n  \"type\": \"FeatureCollection\",\n  \"features\": [\n    {\n      \"type\": \"Feature\",\n      \"id\": \"depot-1\",\n      \"properties\": {\n        \"name\": \"North Depot\",\n        \"capacity\": 420,\n        \"open\": true\n      },\n      \"geometry\": {\n        \"type\": \"Point\",\n        \"coordinates\": [\n          13.38886,\n          52.51703\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"id\": \"route-7\",\n      \"properties\": {\n        \"name\": \"Route 7\",\n        \"capacity\": null\n      },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [\n            13.38886,\n            52.51703\n          ],\n          [\n            13.40495,\n            52.52001\n          ],\n          [\n            13.40495,\n            52.52001\n          ],\n          [\n            13.43312,\n            52.50979\n          ]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"id\": \"zone-a\",\n      \"properties\": {\n        \"name\": \"Delivery Zone A\",\n        \"open\": false\n      },\n      \"geometry\": {\n        \"type\": \"Polygon\",\n        \"coordinates\": [\n          [\n            [\n              13.36,\n              52.5\n            ],\n            [\n              13.36,\n              52.53\n            ],\n            [\n              13.42,\n              52.53\n            ],\n            [\n              13.42,\n              52.5\n            ],\n            [\n              13.36,\n              52.5\n            ]\n          ]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": {\n        \"name\": \"Pickup point\",\n        \"capacity\": 15\n      },\n      \"geometry\": {\n        \"type\": \"Point\",\n        \"coordinates\": [\n          52.5145,\n          13.3501\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": {\n        \"name\": \"Planned site\"\n      },\n      \"geometry\": null\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": {\n        \"name\": \"Survey line\"\n      },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [\n            13.300000123,\n            52.48\n          ],\n          [\n            13.32,\n            52.4812345678\n          ]\n        ]\n      }\n    }\n  ]\n}"
 }
};

/** The sample with the given id, or null. */
function sampleFor(id) { return SAMPLES[id] || null; }

module.exports = { sampleFor: sampleFor, SAMPLE_IDS: Object.keys(SAMPLES) };
