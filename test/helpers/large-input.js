'use strict';
// Builds a GeoJSON text of about `bytes` characters for the large-file test (invented features).
function make(bytes) {
  const parts = ['{"type":"FeatureCollection","features":[']; let size = parts[0].length, i = 0;
  while (size < bytes) {
    const x = 10 + (i % 1000) / 1000, y = 50 + (i % 700) / 1000;
    const f = '{"type":"Feature","id":' + i + ',"properties":{"name":"site ' + i + '","note":"' + 'x'.repeat(40) + '"},"geometry":{"type":"Polygon","coordinates":[[[' + x + ',' + y + '],[' + (x + 0.001) + ',' + y + '],[' + (x + 0.001) + ',' + (y + 0.001) + '],[' + x + ',' + (y + 0.001) + '],[' + x + ',' + y + ']]]}}';
    parts.push((i ? ',' : '') + f); size += f.length + 1; i++;
  }
  parts.push(']}');
  return parts.join('');
}
module.exports = { make };
