'use strict';
// GeoJSON Atlas core: RFC 7946 validation, properties, geometry quality and spherical measurements.

const esc = (s) => String(s).replace(/[\r\n]+/g, ' ').replace(/([\\`*_{}\[\]()#+!|<>~&$])/g, '\\$1')
  .split('://').join('\\:\\/\\/').replace(/(^|[^A-Za-z0-9])www\./gi, (m, pre) => pre + m.slice(pre.length, pre.length + 3) + '\\.');
const cell = (s) => { s = String(s == null ? '' : s); return s === '' ? '-' : esc(s); };
const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const GEOMS = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'];
const R_KM = 6371.0088;

function load(text) {
  let j;
  try { j = JSON.parse(String(text == null ? '' : text).replace(/^﻿/, '')); } catch (e) { return { err: 'the text is not JSON' }; }
  if (!isObj(j) || typeof j.type !== 'string') return { err: 'there is no top-level type member' };
  if (j.type !== 'FeatureCollection' && j.type !== 'Feature' && !GEOMS.includes(j.type)) return { err: 'type ' + esc(j.type) + ' is not a GeoJSON type' };
  return { j };
}
// Every feature as {path, feature}; a bare geometry counts as one feature without properties.
function featuresOf(j) {
  if (j.type === 'FeatureCollection') return (Array.isArray(j.features) ? j.features : []).map((f, i) => ({ path: 'features[' + i + ']', f }));
  if (j.type === 'Feature') return [{ path: '(root)', f: j }];
  return [{ path: '(root)', f: { type: 'Feature', geometry: j, properties: null, bare: true } }];
}
const isPos = (p) => Array.isArray(p) && p.length >= 2 && p.every((x) => typeof x === 'number' && Number.isFinite(x));

// Positions of a geometry (any depth) with their path, calling fn(pos, path).
function eachPosition(g, path, fn) {
  if (!isObj(g)) return;
  if (g.type === 'GeometryCollection') { (Array.isArray(g.geometries) ? g.geometries : []).forEach((x, i) => eachPosition(x, path + '.geometries[' + i + ']', fn)); return; }
  const walk = (c, p, depth) => { if (!Array.isArray(c)) return; if (depth === 0) { fn(c, p); return; } c.forEach((x, i) => walk(x, p + '[' + i + ']', depth - 1)); };
  const depth = { Point: 0, MultiPoint: 1, LineString: 1, MultiLineString: 2, Polygon: 2, MultiPolygon: 3 }[g.type];
  if (depth !== undefined) walk(g.coordinates, path + '.coordinates', depth);
}
function bboxOf(list) {
  let b = null;
  list.forEach(({ f }) => eachPosition(f.geometry, '', (p) => { if (!isPos(p) || p[0] < -180 || p[0] > 180 || p[1] < -90 || p[1] > 90) return; if (!b) b = [p[0], p[1], p[0], p[1]]; b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); }));
  return b;
}
const round = (x, n) => { const f = Math.pow(10, n); return Math.round(x * f) / f; };

// ---------------------------------------------------------------- validation (RFC 7946 structure)
function validate(j) {
  const p = [];
  if ('crs' in j) p.push(['(root)', 'the crs member is not part of RFC 7946 (coordinates are always WGS 84 longitude, latitude)']);
  if (j.type === 'FeatureCollection' && !Array.isArray(j.features)) p.push(['(root)', 'a FeatureCollection needs a features array']);
  featuresOf(j).forEach(({ path, f }) => {
    if (!isObj(f)) { p.push([path, 'a feature must be an object']); return; }
    if (!f.bare) {
      if (f.type !== 'Feature') p.push([path, 'type must be Feature']);
      if (!('geometry' in f)) p.push([path, 'a feature needs a geometry member (it may be null)']);
      if (!('properties' in f)) p.push([path, 'a feature needs a properties member (it may be null)']);
      else if (f.properties !== null && !isObj(f.properties)) p.push([path + '.properties', 'properties must be an object or null']);
    }
    if (f.geometry != null) checkGeometry(f.geometry, f.bare ? '(root)' : path + '.geometry', p);
  });
  return p;
}
function checkGeometry(g, path, p) {
  if (!isObj(g)) { p.push([path, 'a geometry must be an object or null']); return; }
  if (!GEOMS.includes(g.type)) { p.push([path, 'type ' + String(g.type) + ' is not a geometry type']); return; }
  if (g.type === 'GeometryCollection') {
    if (!Array.isArray(g.geometries)) p.push([path, 'a GeometryCollection needs a geometries array']);
    else g.geometries.forEach((x, i) => checkGeometry(x, path + '.geometries[' + i + ']', p));
    return;
  }
  if (!Array.isArray(g.coordinates)) { p.push([path, 'coordinates must be an array']); return; }
  const pos = (c, pp) => {
    if (!isPos(c)) { p.push([pp, 'a position needs 2 or 3 numbers']); return; }
    if (c.length > 3) p.push([pp, 'a position should not have more than 3 numbers']);
    const lonBad = c[0] < -180 || c[0] > 180, latBad = c[1] < -90 || c[1] > 90;
    if (latBad && !lonBad && Math.abs(c[0]) <= 90 && Math.abs(c[1]) <= 180) p.push([pp, 'latitude ' + c[1] + ' is out of range; longitude and latitude look swapped']);
    else { if (lonBad) p.push([pp, 'longitude ' + c[0] + ' is out of range (-180 to 180)']); if (latBad) p.push([pp, 'latitude ' + c[1] + ' is out of range (-90 to 90)']); }
  };
  const line = (c, pp) => { if (!Array.isArray(c)) { p.push([pp, 'a line must be an array of positions']); return; } c.forEach((x, i) => pos(x, pp + '[' + i + ']')); if (c.length < 2) p.push([pp, 'a line needs at least 2 positions']); };
  const ring = (c, pp) => {
    if (!Array.isArray(c)) { p.push([pp, 'a ring must be an array of positions']); return; }
    c.forEach((x, i) => pos(x, pp + '[' + i + ']'));
    if (c.length < 4) p.push([pp, 'a ring needs at least 4 positions']);
    else if (isPos(c[0]) && isPos(c[c.length - 1]) && (c[0][0] !== c[c.length - 1][0] || c[0][1] !== c[c.length - 1][1])) p.push([pp, 'a ring must end with its first position']);
  };
  const arr = (c, pp, fn) => { if (!Array.isArray(c)) { p.push([pp, 'must be an array']); return; } c.forEach((x, i) => fn(x, pp + '[' + i + ']')); };
  const c = g.coordinates, cp = path + '.coordinates';
  if (g.type === 'Point') pos(c, cp);
  else if (g.type === 'MultiPoint') arr(c, cp, pos);
  else if (g.type === 'LineString') line(c, cp);
  else if (g.type === 'MultiLineString') arr(c, cp, line);
  else if (g.type === 'Polygon') arr(c, cp, ring);
  else if (g.type === 'MultiPolygon') arr(c, cp, (x, pp) => arr(x, pp, ring));
}

// ---------------------------------------------------------------- measurements on the sphere
const rad = (d) => d * Math.PI / 180;
function haversine(a, b) {
  const dLat = rad(b[1] - a[1]), dLon = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
const lineLength = (c) => { let s = 0; for (let i = 1; i < c.length; i++) if (isPos(c[i - 1]) && isPos(c[i])) s += haversine(c[i - 1], c[i]); return s; };
// Signed ring area on the sphere, km²: negative = counterclockwise, positive = clockwise (the sign of this formula).
function ringArea(c) {
  let s = 0; const n = c.length; if (n < 4) return 0;
  for (let i = 0; i < n - 1; i++) { const a = c[i], b = c[i + 1]; if (!isPos(a) || !isPos(b)) return 0; s += rad(b[0] - a[0]) * (2 + Math.sin(rad(a[1])) + Math.sin(rad(b[1]))); }
  return s * R_KM * R_KM / 2;
}
const polygonArea = (rings) => (Array.isArray(rings) && rings.length ? Math.abs(ringArea(rings[0])) - rings.slice(1).reduce((t, r) => t + Math.abs(ringArea(r)), 0) : 0);
function measure(g) {
  const m = { length: 0, area: 0 };
  if (!isObj(g)) return m;
  const ok = (x) => Array.isArray(x);
  if (g.type === 'LineString' && ok(g.coordinates)) m.length += lineLength(g.coordinates);
  else if (g.type === 'MultiLineString' && ok(g.coordinates)) g.coordinates.forEach((l) => { if (ok(l)) m.length += lineLength(l); });
  else if (g.type === 'Polygon' && ok(g.coordinates)) { m.area += polygonArea(g.coordinates); if (ok(g.coordinates[0])) m.length += lineLength(g.coordinates[0]); }
  else if (g.type === 'MultiPolygon' && ok(g.coordinates)) g.coordinates.forEach((pg) => { if (ok(pg)) { m.area += polygonArea(pg); if (ok(pg[0])) m.length += lineLength(pg[0]); } });
  else if (g.type === 'GeometryCollection' && ok(g.geometries)) g.geometries.forEach((x) => { const y = measure(x); m.length += y.length; m.area += y.area; });
  return m;
}
const featureName = (f, path) => { const pr = isObj(f.properties) ? f.properties : {}; for (const k of ['name', 'title', 'label', 'id']) if (typeof pr[k] === 'string' || typeof pr[k] === 'number') return String(pr[k]); if (typeof f.id === 'string' || typeof f.id === 'number') return String(f.id); return path; };

// ---------------------------------------------------------------- reports
const BAD = (h, err) => '# ' + h + '\n\nThis file is not GeoJSON: ' + err + '.';

function reportSummary(text) {
  const L = load(text); const H = 'GeoJSON Summary'; if (L.err) return BAD(H, L.err);
  const fs = featuresOf(L.j); const types = new Map(); let nullGeom = 0, withId = 0;
  fs.forEach(({ f }) => { if (!isObj(f)) return; if (f.id !== undefined) withId++; const t = isObj(f.geometry) && typeof f.geometry.type === 'string' ? f.geometry.type : null; if (t === null) nullGeom++; else types.set(t, (types.get(t) || 0) + 1); });
  const b = bboxOf(fs.filter((x) => isObj(x.f)));
  let md = '# ' + H + '\n\n' + L.j.type + ' with ' + pl(fs.length, 'feature') + ' (' + withId + ' with an id, ' + nullGeom + ' without geometry).';
  md += '\n\nBounding box: ' + (b ? b.map((x) => round(x, 6)).join(', ') + ' (west, south, east, north).' : 'no valid positions.');
  md += '\n\n' + (types.size ? '| Geometry type | Features |\n| --- | ---: |\n' + GEOMS.filter((t) => types.has(t)).map((t) => '| ' + t + ' | ' + types.get(t) + ' |').concat([...types.keys()].filter((t) => !GEOMS.includes(t)).map((t) => '| ' + cell(t) + ' | ' + types.get(t) + ' |')).join('\n') : 'No geometries.');
  return md;
}

function reportValidation(text) {
  const L = load(text); const H = 'GeoJSON Validation'; if (L.err) return BAD(H, L.err);
  const p = validate(L.j);
  if (!p.length) return '# ' + H + '\n\nNo problems found.';
  return '# ' + H + '\n\n' + pl(p.length, 'problem') + ' found.\n\n| Location | Problem |\n| --- | --- |\n' + p.map((x) => '| ' + cell(x[0]) + ' | ' + cell(x[1]) + ' |').join('\n');
}

function reportProperties(text) {
  const L = load(text); const H = 'Properties'; if (L.err) return BAD(H, L.err);
  const fs = featuresOf(L.j).filter((x) => isObj(x.f)); const keys = new Map();
  const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  fs.forEach(({ f }) => { if (!isObj(f.properties)) return; for (const [k, v] of Object.entries(f.properties)) { if (!keys.has(k)) keys.set(k, { n: 0, types: new Set() }); const e = keys.get(k); e.n++; e.types.add(typeOf(v)); } });
  if (!keys.size) return '# ' + H + '\n\nNo feature has properties.';
  return '# ' + H + '\n\n' + (keys.size === 1 ? '1 property' : keys.size + ' properties') + ' across ' + pl(fs.length, 'feature') + '.\n\n| Property | Features | Missing | Types |\n| --- | ---: | ---: | --- |\n' +
    [...keys.entries()].sort((a, b) => b[1].n - a[1].n || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([k, e]) => '| ' + cell(k) + ' | ' + e.n + ' | ' + (fs.length - e.n) + ' | ' + [...e.types].sort().join(', ') + ' |').join('\n');
}

function reportQuality(text) {
  const L = load(text); const H = 'Geometry Quality'; if (L.err) return BAD(H, L.err);
  const f = [];
  featuresOf(L.j).forEach(({ path, f: ft }) => {
    if (!isObj(ft)) return;
    const gp = ft.bare ? '(root)' : path + '.geometry';
    if (!ft.bare && ft.geometry === null) f.push([path, 'null_geometry', 'the feature has no geometry']);
    const g = ft.geometry; if (!isObj(g)) return;
    const visit = (geom, gpath) => {
      if (!isObj(geom)) return;
      if (geom.type === 'GeometryCollection') { (Array.isArray(geom.geometries) ? geom.geometries : []).forEach((x, i) => visit(x, gpath + '.geometries[' + i + ']')); return; }
      if (Array.isArray(geom.coordinates) && geom.coordinates.length === 0) f.push([gpath, 'empty', geom.type + ' has no coordinates']);
      const rings = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates) ? geom.coordinates : [];
      rings.forEach((pg, k) => { if (!Array.isArray(pg)) return; const base = gpath + '.coordinates' + (geom.type === 'MultiPolygon' ? '[' + k + ']' : '');
        pg.forEach((rg, i) => { if (!Array.isArray(rg) || rg.length < 4) return; const a = ringArea(rg); if (a === 0) return;
          if (i === 0 && a > 0) f.push([base + '[0]', 'orientation', 'the exterior ring is clockwise; RFC 7946 asks for counterclockwise']);
          if (i > 0 && a < 0) f.push([base + '[' + i + ']', 'orientation', 'the hole is counterclockwise; RFC 7946 asks for clockwise']); }); });
      let prev = null, prevPath = '';
      const lines = [];
      eachPosition(geom, gpath, (pos, pp) => {
        if (!isPos(pos)) return;
        const parent = pp.replace(/\[\d+\]$/, '');
        if (prev && parent === prevPath.replace(/\[\d+\]$/, '') && prev[0] === pos[0] && prev[1] === pos[1] && geom.type !== 'MultiPoint' && geom.type !== 'Point') lines.push(pp);
        prev = pos; prevPath = pp;
        if (pos.slice(0, 2).some((x) => { const s = String(x); const d = s.includes('.') && !/e/i.test(s) ? s.split('.')[1].length : 0; return d > 7; })) f.push([pp, 'precision', 'more than 7 decimals (finer than 1 cm); the file is larger than it needs to be']);
      });
      lines.forEach((pp) => f.push([pp, 'duplicate_point', 'the same position as the one before it']));
    };
    visit(g, gp);
    if (Array.isArray(ft.bbox) || (ft.bare && Array.isArray(g.bbox))) {
      const bb = ft.bare ? g.bbox : ft.bbox; const real = bboxOf([{ f: ft }]);
      if (real && bb.length >= 4 && (real[0] < bb[0] || real[1] < bb[1] || real[2] > bb[bb.length / 2] || real[3] > bb[bb.length / 2 + 1])) f.push([path, 'bbox', 'the bbox member does not contain all positions']);
    }
  });
  if (L.j.type === 'FeatureCollection' && Array.isArray(L.j.bbox)) {
    const bb = L.j.bbox; const real = bboxOf(featuresOf(L.j).filter((x) => isObj(x.f)));
    if (real && bb.length >= 4 && (real[0] < bb[0] || real[1] < bb[1] || real[2] > bb[bb.length / 2] || real[3] > bb[bb.length / 2 + 1])) f.push(['(root)', 'bbox', 'the bbox member does not contain all positions']);
  }
  if (!f.length) return '# ' + H + '\n\nNo findings.';
  return '# ' + H + '\n\n' + pl(f.length, 'finding') + '.\n\n| Location | Check | Finding |\n| --- | --- | --- |\n' + f.map((x) => '| ' + cell(x[0]) + ' | ' + x[1] + ' | ' + cell(x[2]) + ' |').join('\n');
}

function reportMeasurements(text) {
  const L = load(text); const H = 'Measurements'; if (L.err) return BAD(H, L.err);
  const rows = []; let tl = 0, ta = 0;
  featuresOf(L.j).forEach(({ path, f }) => {
    if (!isObj(f) || !isObj(f.geometry)) return;
    const m = measure(f.geometry); if (!m.length && !m.area) return;
    tl += m.length; ta += m.area;
    rows.push('| ' + cell(featureName(f, path)) + ' | ' + cell(f.geometry.type) + ' | ' + round(m.length, 3).toFixed(3) + ' | ' + (m.area ? round(m.area, 3).toFixed(3) : '-') + ' |');
  });
  if (!rows.length) return '# ' + H + '\n\nNo lines or polygons to measure.';
  return '# ' + H + '\n\nLengths and areas on a sphere of radius 6371.0088 km (the mean Earth radius); polygon lengths are the length of the outer ring.\n\n' +
    '| Feature | Geometry | Length (km) | Area (km²) |\n| --- | --- | ---: | ---: |\n' + rows.join('\n') + '\n\nTotal: ' + round(tl, 3).toFixed(3) + ' km, ' + round(ta, 3).toFixed(3) + ' km².';
}

module.exports = { haversineKm: (a, b) => (isPos(a) && isPos(b) ? round(haversine(a, b), 3) : 0), ringAreaKm2: (c) => (Array.isArray(c) ? round(ringArea(c), 3) : 0),
  reportSummary, reportValidation, reportProperties, reportQuality, reportMeasurements };

// Caps every Markdown table of a report at 500 rows and says how many there were.
function capTables(md) {
  if (typeof md !== 'string') return md;
  const lines = md.split('\n'), out = [];
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    if (lines[i].startsWith('|') && /^\|[ :-]+\|/.test(lines[i + 1] || '')) {
      out.push(lines[++i]);
      let n = 0;
      while (i + 1 < lines.length && lines[i + 1].startsWith('|')) { i++; n++; if (n <= 500) out.push(lines[i]); }
      if (n > 500) { out.push(''); out.push('Showing the first 500 of ' + n + ' rows.'); }
    }
  }
  return out.join('\n');
}
for (const k of Object.keys(module.exports)) {
  if (k.startsWith('report')) { const f = module.exports[k]; module.exports[k] = function (text) { return capTables(f(text)); }; }
}
