// 2D art: framed paintings (procedural canvases), easels, mosaics, stained glass,
// wall installations and neon sign art.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, tube, setup, done, fin, mainMat, accentMat, roughen, vnoise, paintedPlane, artFn, ART_STYLES, PALETTES, mergeGeometries, rng } from './common.js';
import { clip } from '../../core/animation.js';
import { lampGroup, lampTracks, glowMaterial } from '../../core/lamps.js';

const _up = new THREE.Vector3(0, 1, 0);
const C = (h) => new THREE.Color(h);
const dbl = (m) => { const c = m.clone(); c.side = THREE.DoubleSide; return c; };

/** Rounded square-section beam between two points. */
export function beam(a, b, w, d, mat, parent) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const m = new THREE.Mesh(roundedBox(w, dir.length(), d, Math.min(w, d) * 0.3, 2), mat);
  m.position.copy(va).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(_up, dir.normalize());
  parent.add(m);
  return m;
}

/** Flat ring (rect frame) W×H outside, hw×hh hole, extruded to depth along Z. */
export function rectRing(W, H, hw, hh, depth, bevel = 0.004) {
  const s = new THREE.Shape([new THREE.Vector2(-W / 2, -H / 2), new THREE.Vector2(W / 2, -H / 2), new THREE.Vector2(W / 2, H / 2), new THREE.Vector2(-W / 2, H / 2)]);
  s.holes.push(new THREE.Path([new THREE.Vector2(-hw / 2, -hh / 2), new THREE.Vector2(-hw / 2, hh / 2), new THREE.Vector2(hw / 2, hh / 2), new THREE.Vector2(hw / 2, -hh / 2)]));
  return extrudeOutline(s, depth, { bevel, segments: 2 });
}

/** Ring from an outline polygon (pts) scaled outward by (sx, sy) about the origin. */
function polyRing(pts, sx, sy, depth, bevel = 0.004) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x * sx, y * sy)));
  s.holes.push(new THREE.Path(pts.slice().reverse().map(([x, y]) => new THREE.Vector2(x, y))));
  return extrudeOutline(s, depth, { bevel, segments: 2 });
}

/** Outline polygons (centred on origin) for panels. */
export function outline(kind, w, h, n = 48) {
  const pts = [];
  if (kind === 'round') for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([Math.cos(a) * w / 2, Math.sin(a) * h / 2]); }
  else if (kind === 'arch') {
    const r = w / 2, yb = h / 2 - r;
    pts.push([-w / 2, -h / 2], [w / 2, -h / 2]);
    for (let i = 0; i <= n / 2; i++) { const a = (i / (n / 2)) * Math.PI; pts.push([Math.cos(a) * r, yb + Math.sin(a) * r]); }
  } else if (kind === 'pointed') {
    const yb = h / 2 - w * 0.85;
    pts.push([-w / 2, -h / 2], [w / 2, -h / 2]);
    const R = w; // two arcs centred at opposite spring points
    for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.acos(0.5); pts.push([-w / 2 + Math.cos(a) * R, yb + Math.sin(a) * R * 0.98]); }
    for (let i = 11; i >= 0; i--) { const a = (i / 12) * Math.acos(0.5); pts.push([w / 2 - Math.cos(a) * R, yb + Math.sin(a) * R * 0.98]); }
  } else if (kind === 'octagon') for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i / 8) * Math.PI * 2; pts.push([Math.cos(a) * w / 2 / Math.cos(Math.PI / 8), Math.sin(a) * h / 2 / Math.cos(Math.PI / 8)]); }
  else pts.push([-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]);
  // dedupe consecutive
  return pts.filter((p, i) => { const q = pts[(i + 1) % pts.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-5; });
}

export function pip(pts, x, y) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

/** Sutherland–Hodgman: clip polygon by convex polygon `clipPts` (CCW). */
function clipPoly(subject, clipPts) {
  let out = subject;
  for (let i = 0; i < clipPts.length && out.length; i++) {
    const a = clipPts[i], b = clipPts[(i + 1) % clipPts.length];
    const inside = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
    const inter = (p, q) => {
      const x1 = p[0], y1 = p[1], x2 = q[0], y2 = q[1], x3 = a[0], y3 = a[1], x4 = b[0], y4 = b[1];
      const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
      return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
    };
    const inp = out;
    out = [];
    for (let k = 0; k < inp.length; k++) {
      const P = inp[k], Q = inp[(k + 1) % inp.length];
      const pi = inside(P), qi = inside(Q);
      if (pi) out.push(P);
      if (pi !== qi) out.push(inter(P, Q));
    }
  }
  return out;
}
const area = (p) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0) / 2);

/** Two small feet that let a vertical panel stand (panel bottom at y = 0). */
function feet(parent, W, mat, depth = 0.18) {
  for (const s of [-1, 1]) mesh(roundedBox(0.05, 0.035, depth, 0.01), mat, { parent, at: [s * W * 0.3, 0.0175, 0], name: 'foot' });
  return 0.03;
}

/* ================================ PAINTINGS ================================ */

export const PAINTING_VARIANTS = Object.fromEntries(ART_STYLES.map((s) => [s, {}]));
const SIZES = { landscape: [0.9, 0.6], seascape: [0.9, 0.55], sunset: [0.8, 0.6], 'night-sky': [0.9, 0.6], portrait: [0.5, 0.65], 'still-life': [0.55, 0.7], geometric: [0.6, 0.6], dots: [0.6, 0.6], 'color-field': [0.6, 0.9], stripes: [1.0, 0.5], abstract: [0.8, 0.8] };

/** Wrap an art fn with an aged look (yellowed varnish + craquelure). */
function aged(fn) {
  const sep = C('#8a6a3a');
  return (u, v) => {
    const c = fn(u, v).clone().lerp(sep, 0.35);
    const n = Math.abs(vnoise(u * 30, v * 30, 3) - 0.5);
    if (n < 0.02) c.multiplyScalar(0.55);
    return c;
  };
}

/** Builds a framed canvas centred at origin (faces +Z). Returns { g, W, H } (outer size). */
export function framedCanvas(parent, T, w, h, fn, { name = 'painting' } = {}) {
  const g = group(name, { parent });
  const tr = T.trim;
  mesh(roundedBox(w, h, 0.025, 0.003), fin(T, '#f2eee6', 'fabric'), { parent: g, name: 'canvas' });
  const art = paintedPlane(w - 0.004, h - 0.004, fn);
  art.position.z = 0.0127;
  art.name = 'art';
  g.add(art);
  let f = 0.035, W = w, H = h;
  const ring = (fw, depth, mat, { z = 0, bevel = 0.004, hole = 0.008, rough = 0 } = {}) => {
    const geo = rectRing(w + 2 * fw, h + 2 * fw, w - hole, h - hole, depth, bevel);
    if (rough) roughen(geo, rough, 40);
    return mesh(geo, mat, { parent: g, at: [0, 0, z] });
  };
  if (tr === 'glass') {
    f = 0;
    mesh(roundedBox(w, h, 0.006, 0.002), fin(T, '#eaf4f8', 'glass'), { parent: g, at: [0, 0, 0.019] });
    for (const x of [-1, 1]) for (const y of [-1, 1]) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 16).rotateX(Math.PI / 2), M.chrome(), { parent: g, at: [x * (w / 2 - 0.03), y * (h / 2 - 0.03), 0.012] });
  } else if (tr === 'gold') {
    f = 0.1;
    const gm = fin(T, '', 'gold');
    ring(0.1, 0.05, gm, { bevel: 0.014 });
    ring(0.025, 0.06, gm, { bevel: 0.008, z: 0.004 });
    for (const x of [-1, 1]) for (const y of [-1, 1]) mesh(new THREE.SphereGeometry(0.035, 16, 10).scale(1, 1, 0.5), gm, { parent: g, at: [x * (w / 2 + 0.06), y * (h / 2 + 0.06), 0.028] });
    const crest = [];
    for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI; crest.push([Math.cos(a) * 0.11, Math.sin(a) * 0.07 * (1 + 0.25 * Math.sin(a * 7))]); }
    mesh(extrudeOutline(crest, 0.03, { bevel: 0.006, segments: 2 }), gm, { parent: g, at: [0, h / 2 + 0.08, 0.005] });
  } else if (tr === 'marble') {
    f = 0.07;
    ring(0.07, 0.045, fin(T, '#efebe4', 'marble'), { bevel: 0.01 });
    ring(0.018, 0.052, fin(T, '#b8b0a2', 'stone'), { z: 0.003 });
  } else if (tr === 'bronze') {
    f = 0.022;
    ring(0.022, 0.05, fin(T, '#6e4a2a', 'bronze'), { bevel: 0.003 });
  } else if (tr === 'wood') {
    f = 0.055;
    ring(0.055, 0.04, M.wood('oak'), { bevel: 0.008 });
    ring(0.01, 0.042, fin(T, '', 'gold'), { z: 0.002, bevel: 0.002 });
  } else if (tr === 'concrete') {
    f = 0.02;
    const gm = fin(T, '#55565a', 'steel');
    const geo = rectRing(w + 0.064, h + 0.064, w + 0.024, h + 0.024, 0.045, 0.002);
    mesh(geo, gm, { parent: g, at: [0, 0, -0.004] });
    mesh(roundedBox(w + 0.03, h + 0.03, 0.006, 0.002), gm, { parent: g, at: [0, 0, -0.0155] });
  } else if (tr === 'pop-art') {
    f = 0.08;
    ring(0.08, 0.06, fin(T, '#ffd400', 'pop'), { bevel: 0.025 });
    ring(0.02, 0.064, fin(T, '#ff2f6d', 'pop'), { z: 0.004, bevel: 0.006 });
  } else if (tr === 'weathered') {
    f = 0.075;
    ring(0.075, 0.045, fin(T, '#7a6a52', 'weathered'), { bevel: 0.01, rough: 0.008 });
  } else {
    ring(0.035, 0.035, fin(T, '#1e1d1c', 'paint'), { bevel: 0.004 });
  }
  W = w + 2 * f; H = h + 2 * f;
  return { g, W, H };
}

export function createPainting(options = {}) {
  const { o, variant, trim, T } = setup(options, PAINTING_VARIANTS, 'painting');
  const root = group(`painting-${variant}`);
  const [w, h] = SIZES[variant];
  let fn = artFn(variant, 1 + ART_STYLES.indexOf(variant), { pop: T.pop });
  if (T.rough) fn = aged(fn);
  const { g, W, H } = framedCanvas(root, T, w, h, fn);
  g.position.y = H / 2 + 0.02;
  feet(root, W, fin(T, '#141414', 'paint'), 0.16 + 0.04 * (H > 0.9));
  return done(root, 'painting', variant, o, [], T);
}

/* ================================== EASELS ================================== */

export const EASEL_VARIANTS = { 'a-frame': {}, 'h-frame': {}, 'field-tripod': {}, tabletop: {}, 'french-box': {} };

export function createEasel(options = {}) {
  const { o, variant, trim, T } = setup(options, EASEL_VARIANTS, 'easel', { p: '#b8874f', finish: 'wood' });
  const root = group(`easel-${variant}`);
  const woodM = T.trim === 'pop-art' || T.kids ? fin(T, T.p, T.kids ? 'plastic' : 'pop') : T.trim && !['bronze', 'gold', 'weathered'].includes(T.trim) ? mainMat(T) : T.rough ? fin(T, '#8a7458', 'weathered') : M.wood(T.trim === 'bronze' ? 'walnut' : T.trim === 'gold' ? 'black' : 'oak');
  const hw = T.trim === 'gold' ? fin(T, '', 'gold') : T.trim === 'bronze' ? fin(T, '#8a5a30', 'bronze') : T.kids ? fin(T, T.s, 'plastic') : fin(T, '#3a3b3e', 'steel');
  const e = group('easel', { parent: root });
  const k = T.chunky ? 1.4 : T.slim ? 0.75 : 1;
  const bw = 0.04 * k;
  const style = ['abstract', 'landscape', 'portrait', 'still-life', 'sunset'][Object.keys(EASEL_VARIANTS).indexOf(variant)];
  const fn = artFn(style, 7, { pop: T.pop || T.kids });
  let tray, mastTop, tilt = 0, cw = 0.6, ch = 0.75, mastZ = 0;
  if (variant === 'a-frame' || variant === 'tabletop') {
    const s = variant === 'tabletop' ? 0.42 : 1;
    const H = 1.75 * s;
    tilt = 0.1;
    const apex = [0, H, 0];
    for (const x of [-1, 1]) beam([x * 0.34 * s, 0, 0.0], [x * 0.05 * s, H, -H * tilt], bw * Math.sqrt(s), bw * Math.sqrt(s), woodM, e);
    beam([0, 0, -0.62 * s], [0, H - 0.04 * s, -H * tilt - 0.02], bw * Math.sqrt(s), bw * Math.sqrt(s), woodM, e);
    beam([0, 0.02 * s, 0], [0, H, -H * tilt], bw * 1.1 * Math.sqrt(s), bw * 0.9 * Math.sqrt(s), woodM, e);
    // cross brace between front legs
    beam([-0.27 * s, 0.35 * s, -0.035 * s], [0.27 * s, 0.35 * s, -0.035 * s], bw * 0.7, bw * 0.6, woodM, e);
    tray = { y: 0.72 * s, z: -0.72 * s * tilt, w: 0.62 * s };
    mastTop = H;
    cw = variant === 'tabletop' ? 0.3 : 0.6; ch = variant === 'tabletop' ? 0.36 : 0.75;
    void apex;
    if (variant === 'tabletop') mesh(roundedBox(0.5, 0.03, 0.4, 0.008), woodM, { parent: e, at: [0, 0.015, -0.12] });
  } else if (variant === 'h-frame') {
    const H = 1.9;
    for (const x of [-1, 1]) {
      mesh(roundedBox(bw * 1.6, bw * 1.6, 0.7, 0.01), woodM, { parent: e, at: [x * 0.3, bw * 0.8, -0.15] });
      mesh(roundedBox(bw * 1.5, H, bw * 1.5, 0.01), woodM, { parent: e, at: [x * 0.22, H / 2 + bw * 1.2, -0.15] });
      beam([x * 0.22, H * 0.5, -0.15 + bw * 0.6], [x * 0.3, bw * 1.5, 0.15], bw * 0.8, bw * 0.8, woodM, e);
      beam([x * 0.22, H * 0.5, -0.15 - bw * 0.6], [x * 0.3, bw * 1.5, -0.45], bw * 0.8, bw * 0.8, woodM, e);
      mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 16), M.rubber(), { parent: e, at: [x * 0.3, 0.015, 0.15] });
    }
    for (const y of [0.25, H * 0.98]) mesh(roundedBox(0.5, bw * 1.4, bw * 1.2, 0.01), woodM, { parent: e, at: [0, y, -0.15] });
    mesh(roundedBox(bw * 1.6, H - 0.25, bw * 1.2, 0.01), woodM, { parent: e, at: [0, 0.25 + (H - 0.25) / 2, -0.12] });
    tray = { y: 0.75, z: -0.12 + bw * 0.6, w: 0.7 };
    mastTop = H; mastZ = -0.12 + bw * 0.6; cw = 0.75; ch = 0.9;
  } else if (variant === 'field-tripod') {
    const H = 1.55;
    tilt = 0.08;
    const lm = T.trim ? woodM : fin(T, '#b9bcc0', 'steel');
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + Math.PI / 2; tube([Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45 - 0.2], [0, H * 0.72, -0.2], 0.012 * k, lm, { parent: e }); tube([Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45 - 0.2], [Math.cos(a) * 0.3, H * 0.25, Math.sin(a) * 0.3 - 0.2], 0.016 * k, hw, { parent: e }); }
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16), hw, { parent: e, at: [0, H * 0.72, -0.2] });
    beam([0, H * 0.72, -0.2 + 0.03], [0, H, -0.2 + 0.03], 0.025 * k, 0.018 * k, lm, e);
    beam([0, H * 0.45, -0.2 + 0.03], [0, H * 0.72, -0.2 + 0.03], 0.025 * k, 0.018 * k, lm, e);
    tray = { y: H * 0.5, z: -0.2 + 0.03 + 0.009, w: 0.45 };
    mastTop = H; mastZ = -0.2 + 0.039; tilt = 0; cw = 0.45; ch = 0.55;
  } else {
    // french box: sketch box on three legs
    const H = 0.85;
    for (const x of [-1, 1]) tube([x * 0.28, 0, 0.18], [x * 0.17, H, 0.0], 0.014 * k, woodM, { parent: e });
    tube([0, 0, -0.42], [0, H, -0.08], 0.014 * k, woodM, { parent: e });
    mesh(roundedBox(0.46, 0.12, 0.32, 0.01), woodM, { parent: e, at: [0, H + 0.06, -0.03], name: 'box' });
    mesh(roundedBox(0.2, 0.03, 0.006, 0.004), hw, { parent: e, at: [0, H + 0.06, 0.13] });
    for (const x of [-1, 1]) mesh(new THREE.SphereGeometry(0.012, 10, 8), hw, { parent: e, at: [x * 0.12, H + 0.06, 0.135] });
    mesh(roundedBox(0.46, 0.32, 0.03, 0.008), woodM, { parent: e, at: [0, H + 0.12 + 0.14, -0.2], rot: [-0.25, 0, 0] });
    beam([0, H + 0.12, -0.15], [0, H + 0.95, -0.24], 0.03, 0.02, woodM, e);
    tray = { y: H + 0.12, z: -0.13, w: 0.46 };
    mastTop = H + 0.95; mastZ = -0.14; tilt = 0.11; cw = 0.4; ch = 0.5;
  }
  // tray / ledge
  const ty = tray.y;
  mesh(roundedBox(tray.w, 0.025, 0.07, 0.006), woodM, { parent: e, at: [0, ty, tray.z + 0.02], name: 'tray' });
  mesh(roundedBox(tray.w, 0.03, 0.012, 0.004), woodM, { parent: e, at: [0, ty + 0.025, tray.z + 0.05] });
  // canvas resting on the tray, leaning on the mast
  const cv = group('canvas-holder', { parent: e, at: [0, ty + 0.0115, tray.z + 0.02 + 0.0 + (variant === 'h-frame' || variant === 'field-tripod' ? 0.006 : 0)] });
  cv.rotation.x = -tilt;
  const c = group('canvasG', { parent: cv });
  mesh(roundedBox(cw, ch, 0.022, 0.003), fin(T, '#f2eee6', 'fabric'), { parent: c, at: [0, ch / 2, 0.011 - 0.004] });
  const art = paintedPlane(cw - 0.004, ch - 0.004, fn);
  art.position.set(0, ch / 2, 0.022 - 0.004 + 0.0004);
  c.add(art);
  // top clamp sliding on the mast
  const clampY = ty + ch * Math.cos(tilt) + 0.01;
  const zAt = (y) => (variant === 'a-frame' || variant === 'tabletop' ? -y * tilt : variant === 'french-box' ? -0.15 - (y - 0.97) * 0.11 : mastZ);
  mesh(roundedBox(0.1, 0.04, 0.06, 0.008), woodM, { parent: e, at: [0, Math.min(clampY, mastTop - 0.03), zAt(Math.min(clampY, mastTop - 0.03)) + 0.03], name: 'clamp' });
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 12).rotateZ(Math.PI / 2), hw, { parent: e, at: [0.065, Math.min(clampY, mastTop - 0.03), zAt(Math.min(clampY, mastTop - 0.03)) + 0.03] });
  // brass hardware
  mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 12).rotateZ(Math.PI / 2), hw, { parent: e, at: [tray.w / 2 + 0.01, ty, tray.z + 0.02] });
  if (T.kids) mesh(new THREE.SphereGeometry(0.03, 12, 10), fin(T, T.a, 'plastic'), { parent: e, at: [0, mastTop + 0.02, zAt(mastTop)] });
  return done(root, 'easel', variant, o, [], T);
}

/* ================================== MOSAICS ================================== */

export const MOSAIC_VARIANTS = { geometric: {}, sun: {}, waves: {}, fish: {}, flower: {}, random: {} };

function mosaicFn(v, pal, r) {
  switch (v) {
    case 'sun': return (u, w) => { const x = u - 0.5, y = w - 0.5, d = Math.hypot(x, y), a = Math.atan2(y, x); if (d < 0.16) return C('#f7c21c'); if (d < 0.2) return C('#e8701e'); if (d < 0.42 && Math.cos(a * 12) > 0.3) return C('#f2a81e'); return d < 0.48 ? C('#2a5fa8') : C('#1b3d73'); };
    case 'waves': return (u, w) => { const k = Math.sin(u * 12 + Math.sin(w * 7) * 1.5) * 0.04; const b = Math.floor((w + k) * 7); return [C('#0d3b66'), C('#1f6fb2'), C('#58a4d6'), C('#e8f4f8'), C('#58a4d6'), C('#1f6fb2'), C('#0d3b66'), C('#0d3b66')][Math.max(0, Math.min(7, b))]; };
    case 'fish': return (u, w) => { const x = (u - 0.45) / 0.28, y = (w - 0.5) / 0.15; if (Math.hypot(u - 0.6, w - 0.53) < 0.025) return C('#111111'); if (x * x + y * y < 1) return Math.sin(u * 40) > 0.4 ? C('#f2f2f2') : C('#ef7a1a'); if (u < 0.2 && u > 0.06 && Math.abs(w - 0.5) < (0.2 - u) * 1.2) return C('#ef7a1a'); return Math.hypot(u - 0.8, w - 0.8) < 0.03 || Math.hypot(u - 0.85, w - 0.7) < 0.02 ? C('#bfe6f2') : C(w < 0.12 ? '#c9a76b' : '#2b7fa8'); };
    case 'flower': return (u, w) => { const x = u - 0.5, y = w - 0.58, d = Math.hypot(x, y), a = Math.atan2(y, x); if (d < 0.07) return C('#f7c21c'); if (d < 0.25 * Math.abs(Math.cos(a * 2.5)) + 0.05) return C('#d6336c'); if (Math.abs(u - 0.5) < 0.02 && w < 0.4) return C('#2f8a3a'); if (Math.hypot(u - 0.42, w - 0.25) < 0.06 || Math.hypot(u - 0.58, w - 0.2) < 0.06) return C('#3fa34d'); return C('#f3ead8'); };
    case 'random': return () => pal[Math.floor(r() * pal.length)];
    default: return (u, w) => { const d = Math.max(Math.abs(u - 0.5), Math.abs(w - 0.5)) + Math.abs(Math.abs(u - 0.5) - Math.abs(w - 0.5)) * 0.4; return pal[Math.floor(d * 10) % pal.length]; };
  }
}

export function createMosaic(options = {}) {
  const { o, variant, trim, T } = setup(options, MOSAIC_VARIANTS, 'art-mosaic');
  const root = group(`mosaic-${variant}`);
  const r = T.r;
  const pal = (T.pop ? ['#ff2f6d', '#ffd400', '#1e8fff', '#111111', '#ffffff'] : PALETTES[Object.keys(MOSAIC_VARIANTS).indexOf(variant) % PALETTES.length]).map(C);
  const shape = { marble: 'round', gold: 'arch', bronze: 'octagon', glass: 'round', weathered: 'rect' }[T.trim] ?? 'rect';
  const w = 0.62, h = shape === 'arch' ? 0.8 : 0.62;
  const pts = outline(shape, w, h);
  const P = group('mosaic', { parent: root });
  // grout board
  const board = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  mesh(extrudeOutline(board, 0.02, { bevel: 0.002, segments: 1 }), fin(T, T.trim === 'concrete' ? '#6f6d69' : '#cfc9bd', 'concrete'), { parent: P });
  // tiles
  const ts = T.trim === 'concrete' ? 0.045 : T.kids ? 0.05 : 0.026;
  const fn = mosaicFn(variant, pal, r);
  const geos = [];
  const col = new THREE.Color();
  for (let y = -h / 2 + ts / 2; y < h / 2; y += ts) {
    for (let x = -w / 2 + ts / 2; x < w / 2; x += ts) {
      const jx = (r() - 0.5) * ts * 0.12, jy = (r() - 0.5) * ts * 0.12;
      const cx = x + jx, cy = y + jy;
      const s2 = ts * 0.44;
      if (![[cx - s2, cy - s2], [cx + s2, cy - s2], [cx + s2, cy + s2], [cx - s2, cy + s2]].every(([a, b]) => pip(pts, a, b))) continue;
      if (T.rough && r() < 0.12) continue;
      const g = new THREE.BoxGeometry(ts * 0.86, ts * 0.86, 0.008 + r() * 0.002).toNonIndexed();
      if (T.trim === 'glass') g.rotateZ(Math.PI / 4).scale(0.75, 0.75, 1);
      g.rotateZ((r() - 0.5) * 0.15);
      g.translate(cx, cy, 0.0135);
      col.copy(fn(x / w + 0.5, y / h + 0.5)).multiplyScalar(0.9 + r() * 0.2);
      if (T.rough) col.lerp(C('#b8ad98'), 0.35);
      const n = g.attributes.position.count;
      const ca = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) ca.set([col.r, col.g, col.b], i * 3);
      g.setAttribute('color', new THREE.BufferAttribute(ca, 3));
      g.deleteAttribute('uv');
      geos.push(g);
    }
  }
  const tm = new THREE.MeshPhysicalMaterial({ name: 'tiles', vertexColors: true, roughness: T.trim === 'glass' ? 0.08 : T.rough ? 0.8 : 0.3, clearcoat: T.rough ? 0 : 0.6, metalness: T.trim === 'gold' ? 0.55 : 0 });
  mesh(mergeGeometries(geos), tm, { parent: P, name: 'tiles' });
  // frame following the outline
  const sx = (w / 2 + 0.035) / (w / 2), sy = (h / 2 + 0.035) / (h / 2);
  const fm = T.trim === 'wood' ? M.wood('walnut') : T.trim ? mainMat(T) : M.wood('oak');
  mesh(polyRing(pts, sx, sy, 0.035, 0.005), fm, { parent: P, at: [0, 0, 0.004] });
  const yb = Math.min(...pts.map((p) => p[1])) * sy;
  P.position.y = -yb + 0.02;
  // round panels need a cradle
  if (shape === 'round' || shape === 'octagon') mesh(roundedBox(0.3, 0.05, 0.16, 0.012), fin(T, '#1a1a1a', 'paint'), { parent: root, at: [0, 0.025, 0] });
  feet(root, w, fin(T, '#1a1a1a', 'paint'));
  return done(root, 'art-mosaic', variant, o, [], T);
}

/* =============================== STAINED GLASS =============================== */

export const STAINED_VARIANTS = { 'rose-window': {}, arched: {}, quarry: {}, voronoi: {}, sunburst: {}, floral: {} };
const JEWEL = ['#b3122e', '#1f4fb5', '#e3a51a', '#1d8a4a', '#7a2a9a', '#e8682a', '#55b6d9'];

export function createStainedGlass(options = {}) {
  const { o, variant, trim, T } = setup(options, STAINED_VARIANTS, 'stained-glass');
  const root = group(`stained-${variant}`);
  const r = T.r;
  const shape = variant === 'rose-window' ? 'round' : variant === 'arched' ? 'arch' : variant === 'quarry' ? 'pointed' : 'rect';
  const w = variant === 'rose-window' ? 0.8 : variant === 'quarry' ? 0.5 : 0.62, h = variant === 'rose-window' ? 0.8 : variant === 'quarry' ? 1.1 : 0.92;
  const pts = outline(shape, w, h, 48);
  const pal = T.pop ? ['#ff2f6d', '#ffd400', '#1e8fff', '#22b04a'] : T.trim === 'glass' ? ['#dfeef2', '#f4e9d0', '#e3f0de', '#f1dde6'] : JEWEL;
  // cells
  let cells = [];
  const polar = (cx, cy, rings, counts, rot = 0) => {
    const out = [];
    for (let i = 0; i < rings.length - 1; i++) {
      const n = counts[i];
      for (let j = 0; j < n; j++) {
        const a0 = rot * i + (j / n) * Math.PI * 2, a1 = rot * i + ((j + 1) / n) * Math.PI * 2;
        const poly = [];
        const steps = Math.max(2, Math.ceil(24 / n));
        for (let s = 0; s <= steps; s++) { const a = a0 + ((a1 - a0) * s) / steps; poly.push([cx + Math.cos(a) * rings[i + 1], cy + Math.sin(a) * rings[i + 1]]); }
        if (rings[i] > 0) for (let s = steps; s >= 0; s--) { const a = a0 + ((a1 - a0) * s) / steps; poly.push([cx + Math.cos(a) * rings[i], cy + Math.sin(a) * rings[i]]); }
        else poly.push([cx, cy]);
        out.push({ poly, ring: i, k: j });
      }
    }
    return out;
  };
  if (variant === 'rose-window') cells = polar(0, 0, [0, 0.08, 0.2, 0.32, 0.42], [6, 12, 16, 24], 0.13).map((c) => ({ ...c, c: pal[(c.ring * 2 + (c.k % 2)) % pal.length] }));
  else if (variant === 'floral') cells = polar(0, 0.05, [0, 0.06, 0.18, 0.3, 0.7], [5, 10, 10, 12], 0.3).map((c) => ({ ...c, c: [pal[2], pal[0], pal[3], pal[1]][c.ring] }));
  else if (variant === 'sunburst') {
    const n = 14;
    for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI; cells.push({ poly: [[0, -h / 2], [Math.cos(a0) * 2, -h / 2 + Math.sin(a0) * 2], [Math.cos(a1) * 2, -h / 2 + Math.sin(a1) * 2]], c: pal[i % 2 ? 2 : 5 % pal.length] }); }
    cells = cells.map((c) => ({ ...c, poly: c.poly.map(([x, y]) => [x, y]) }));
    cells.push(...polar(0, -h / 2, [0, 0.14], [8]).map((c) => ({ ...c, c: C('#ffd23a'), front: true })));
  } else if (variant === 'voronoi') {
    const seeds = [];
    for (let y = 0; y < 6; y++) for (let x = 0; x < 4; x++) seeds.push([-w / 2 + (x + 0.5 + (r() - 0.5) * 0.7) * (w / 4), -h / 2 + (y + 0.5 + (r() - 0.5) * 0.7) * (h / 6)]);
    seeds.forEach((p, i) => {
      let poly = [[-w, -h], [w, -h], [w, h], [-w, h]];
      seeds.forEach((q, j) => {
        if (i === j) return;
        const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1];
        // half-plane: points closer to p → CCW clip edge perpendicular to pq
        poly = clipPoly(poly, [[mx + dy * 10, my - dx * 10], [mx - dy * 10, my + dx * 10], [mx - dy * 10 - dx * 10, my + dx * 10 - dy * 10], [mx + dy * 10 - dx * 10, my - dx * 10 - dy * 10]]);
      });
      cells.push({ poly, c: pal[i % pal.length] });
    });
  } else if (variant === 'quarry') {
    const d = w / 4;
    for (let j = -14; j <= 14; j++) for (let i = -4; i <= 4; i++) {
      const cx = i * d + ((j & 1) ? d / 2 : 0), cy = (j * d) / 2;
      cells.push({ poly: [[cx, cy - d / 2], [cx + d / 2, cy], [cx, cy + d / 2], [cx - d / 2, cy]], c: (i + j) % 5 === 0 ? pal[(i * 3 + j + 99) % pal.length] : T.trim === 'glass' ? pal[0] : '#d9e4c8' });
    }
  } else {
    // arched: grid of panes below + fan in the arch head
    const nx = 3, ny = 4, yb = h / 2 - w / 2;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x0 = -w / 2 + (i * w) / nx, x1 = x0 + w / nx, y0 = -h / 2 + (j * (yb + h / 2)) / ny, y1 = y0 + (yb + h / 2) / ny;
      cells.push({ poly: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], c: pal[(i + j * 2) % pal.length] });
    }
    cells.push(...polar(0, yb, [0, 0.1, w / 2 + 0.05], [4, 8]).filter((c) => c.poly.some(([, y]) => y > yb + 1e-3)).map((c) => ({ ...c, c: pal[(c.k + c.ring * 3) % pal.length] })));
  }
  // clip to outline (CCW) and drop empties
  const ccw = pts;
  cells = cells.map((c) => ({ ...c, poly: clipPoly(c.poly, ccw) })).filter((c) => c.poly.length >= 3 && area(c.poly) > 1e-4);
  if (T.rough) cells = cells.filter(() => r() > 0.08);
  const S = group('window', { parent: root });
  // panes grouped by colour
  const byCol = new Map();
  for (const c of cells) {
    const key = (typeof c.c === 'string' ? c.c : '#' + c.c.getHexString()) + (c.front ? '|front' : '');
    if (!byCol.has(key)) byCol.set(key, []);
    byCol.get(key).push(c);
  }
  const op = T.trim === 'concrete' ? 0.85 : T.rough ? 0.8 : 0.62;
  let pi = 0;
  for (const [key, list] of byCol) {
    const gs = list.map((c) => new THREE.ShapeGeometry(new THREE.Shape(c.poly.map(([x, y]) => new THREE.Vector2(x, y)))).translate(0, 0, c.front ? 0.003 : 0));
    const col = C(key.split('|')[0]);
    if (T.rough) col.lerp(C('#8c8270'), 0.4);
    const mat = new THREE.MeshPhysicalMaterial({ name: 'stained-pane', color: col, roughness: T.trim === 'glass' ? 0.5 : 0.12, transmission: 0.4, thickness: 0.004, transparent: true, opacity: op, side: THREE.DoubleSide, emissive: col, emissiveIntensity: 0.08 });
    mesh(mergeGeometries(gs), mat, { parent: S, name: `pane${pi++}` });
  }
  // lead came along every cell edge
  const lw = T.trim === 'concrete' ? 0.024 : T.pop ? 0.016 : 0.009;
  const leadM = T.trim === 'gold' ? fin(T, '', 'gold') : T.trim === 'bronze' ? fin(T, '#6e4a2a', 'bronze') : T.trim === 'concrete' ? fin(T, '#8d8a85', 'concrete') : M.metal('#2c2d30', 0.5);
  const lg = [];
  for (const c of cells) for (let i = 0; i < c.poly.length; i++) {
    const a = c.poly[i], b = c.poly[(i + 1) % c.poly.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-4) continue;
    const g = new THREE.BoxGeometry(len + lw * 0.8, lw, lw * 1.4).toNonIndexed();
    g.rotateZ(Math.atan2(b[1] - a[1], b[0] - a[0]));
    g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, c.front ? 0.003 : 0);
    g.deleteAttribute('uv');
    lg.push(g);
  }
  mesh(mergeGeometries(lg), leadM, { parent: S, name: 'lead' });
  // frame
  const sx = (w / 2 + 0.045) / (w / 2), sy = (h / 2 + 0.045) / (h / 2);
  const fm = T.trim === 'marble' ? fin(T, '#efebe4', 'marble') : T.trim === 'wood' || !T.trim ? M.wood('walnut') : T.pop ? fin(T, '#111111', 'pop') : T.trim === 'glass' ? fin(T, '#cfd2d6', 'steel') : mainMat(T);
  mesh(polyRing(pts, sx, sy, 0.04, 0.006), fm, { parent: S });
  const yb = Math.min(...pts.map((p) => p[1])) * sy;
  S.position.y = -yb + 0.05;
  // sill + feet
  mesh(roundedBox(shape === 'round' ? 0.42 : w + 0.12, 0.07, 0.2, 0.012), fm, { parent: root, at: [0, 0.035 + 0.0, 0] });
  if (shape === 'round') for (const s of [-1, 1]) beam([s * 0.18, 0.06, 0], [s * 0.3, 0.05 + 0.4 - 0.33, 0], 0.04, 0.05, fm, root);
  return done(root, 'stained-glass', variant, o, [], T);
}

/* ============================= WALL INSTALLATION ============================= */

export const INSTALLATION_VARIANTS = { 'grid-tiles': {}, 'wave-slats': {}, 'mirror-discs': {}, 'string-art': {}, 'block-relief': {}, 'arc-rings': {} };

export function createWallInstallation(options = {}) {
  const { o, variant, trim, T } = setup(options, INSTALLATION_VARIANTS, 'wall-installation', { p: '#f2f0ea', finish: 'paint' });
  const root = group(`installation-${variant}`);
  const r = T.r;
  const W = 1.6, H = 1.8, D = 0.1, base = 0.08;
  const wallM = fin(T, T.trim === 'concrete' ? '#8d8a85' : T.pop ? '#111111' : '#f4f2ee', T.trim === 'concrete' ? 'concrete' : 'matte');
  mesh(roundedBox(W + 0.06, base, D + 0.16, 0.01), fin(T, '#2a2a2c', 'paint'), { parent: root, at: [0, base / 2, 0] });
  mesh(roundedBox(W, H, D, 0.01), wallM, { parent: root, at: [0, base + H / 2 - 0.002, 0], name: 'wall' }).userData.noDensify = true;
  // invisible flush front cap so contact checks see the face
  const cap = mesh(new THREE.PlaneGeometry(W - 0.02, H - 0.02, 26, 30), new THREE.MeshStandardMaterial({ name: 'cap', transparent: true, opacity: 0, depthWrite: false }), { parent: root, at: [0, base + H / 2, D / 2 + 0.0004], name: 'cap' });
  cap.userData.cap = true;
  const z0 = D / 2, cy = base + H / 2;
  const I = group('art', { parent: root });
  const popC = ['#ff2f6d', '#ffd400', '#1e8fff', '#22b04a', '#ffffff'];
  const em = (i) => (T.pop ? fin(T, popC[i % popC.length], 'pop') : T.trim ? (i % 4 === 3 ? accentMat(T) : mainMat(T)) : fin(T, ['#1c1c1e', '#c7a24a', '#9aa0a6', '#d9d4c8'][i % 4], i % 4 === 1 ? 'gold' : 'paint'));
  const sc = T.chunky ? 1.3 : T.pop ? 1.2 : 1;
  if (variant === 'grid-tiles') {
    const n = Math.round(6 / sc), s = 1.2 / n;
    const tg = roundedBox(s * 0.82, s * 0.82, 0.025, 0.008);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const t = mesh(tg, em(i + j), { parent: I, at: [-0.6 + (i + 0.5) * s, cy - 0.6 + (j + 0.5) * s, z0 + 0.0125] });
      t.rotation.set((r() - 0.5) * 0.25, (r() - 0.5) * 0.25, 0);
    }
  } else if (variant === 'wave-slats') {
    const n = Math.round(26 / sc);
    for (let i = 0; i < n; i++) {
      const x = -0.7 + (i / (n - 1)) * 1.4, d = 0.04 + 0.12 * (0.5 + 0.5 * Math.sin(i * 0.5));
      mesh(roundedBox(0.035 * sc, 1.4, d, 0.008), em(i), { parent: I, at: [x, cy, z0 + d / 2 - 0.001] });
    }
  } else if (variant === 'mirror-discs') {
    const mm = T.trim ? mainMat(T) : M.chrome();
    for (let i = 0; i < 14; i++) {
      const rad = (0.06 + r() * 0.12) * sc, x = (r() - 0.5) * (W - 0.4), y = cy + (r() - 0.5) * (H - 0.4), dz = 0.02 + r() * 0.05;
      mesh(new THREE.CylinderGeometry(0.008, 0.008, dz + 0.002, 8).rotateX(Math.PI / 2), M.metal('#555', 0.4), { parent: I, at: [x, y, z0 + dz / 2] });
      mesh(new THREE.CylinderGeometry(rad, rad, 0.012, T.facet ? 6 : 40).rotateX(Math.PI / 2), T.pop ? em(i) : mm, { parent: I, at: [x, y, z0 + dz + 0.006] });
    }
  } else if (variant === 'string-art') {
    const n = 48, R = 0.6;
    const pins = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pins.push([Math.cos(a) * R, cy + Math.sin(a) * R]); mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 6).rotateX(Math.PI / 2), M.metal('#9a8a6a', 0.3), { parent: I, at: [pins[i][0], pins[i][1], z0 + 0.015] }); }
    const step = 17;
    const gs = [[], [], []];
    for (let i = 0; i < n; i++) {
      const a = pins[i], b = pins[(i * step + 5) % n];
      const g = new THREE.CylinderGeometry(0.0015, 0.0015, Math.hypot(b[0] - a[0], b[1] - a[1]), 4);
      g.rotateZ(Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2).translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z0 + 0.015 + (i % 3) * 0.003);
      gs[i % 3].push(g);
    }
    gs.forEach((list, i) => mesh(mergeGeometries(list), T.trim ? (i ? mainMat(T) : accentMat(T)) : fin(T, ['#d6336c', '#1f6fb2', '#e3a51a'][i], 'paint'), { parent: I, name: `threads${i}` }));
    const ring = new THREE.TorusGeometry(R, 0.006, 6, 96);
    mesh(ring, M.metal('#9a8a6a', 0.3), { parent: I, at: [0, cy, z0 + 0.004] });
  } else if (variant === 'block-relief') {
    const s = 0.12 * sc, n = Math.floor(1.2 / s);
    const bg = roundedBox(s * 0.96, s * 0.96, 0.1, 0.006);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const d = 0.02 + 0.14 * Math.abs(Math.sin(i * 0.7 + j * 0.45 + r()));
      mesh(bg, em(Math.floor(d * 30)), { parent: I, at: [-0.6 + (i + 0.5) * s, cy - 0.6 + (j + 0.5) * s, z0 + d / 2 - 0.001], scale: [1, 1, d / 0.1] });
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const R = 0.12 + i * 0.09;
      mesh(new THREE.TorusGeometry(R, 0.022 * sc, 10, 64, Math.PI * (0.6 + 0.2 * (i % 3))).scale(1, 1, 0.5), em(i), { parent: I, at: [-0.15, cy - 0.15, z0 + 0.01], rot: [0, 0, i * 0.5] });
    }
  }
  return done(root, 'wall-installation', variant, o, [], T);
}

/* ================================= NEON SIGNS ================================= */

export const NEON_VARIANTS = {
  heart: { c: '#ff2236' }, star: { c: '#ffd21a' }, wave: { c: '#22e6ff' }, lightning: { c: '#ffe81a' }, smile: { c: '#ffd21a' },
  arrow: { c: '#ff2fa0' }, moon: { c: '#f4f6ff' }, 'art-word': { c: '#ff2fa0' }, eye: { c: '#22e6ff' }, spiral: { c: '#8dff2a' },
};

function neonPaths(v) {
  const P = [];
  const circ = (cx, cy, rr, a0 = 0, a1 = Math.PI * 2, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
  switch (v) {
    case 'heart': P.push({ pts: Array.from({ length: 48 }, (_, i) => { const t = (i / 48) * Math.PI * 2; return [16 * Math.sin(t) ** 3 * 0.016, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.016]; }), closed: true }); break;
    case 'star': P.push({ pts: Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? 0.11 : 0.27; return [Math.cos(a) * rr, Math.sin(a) * rr]; }), closed: true, sharp: true }); break;
    case 'wave': for (let k = 0; k < 3; k++) P.push({ pts: Array.from({ length: 40 }, (_, i) => [-0.3 + (i / 39) * 0.6, -0.1 + k * 0.1 + Math.sin(i / 39 * Math.PI * 3) * 0.04]) }); break;
    case 'lightning': P.push({ pts: [[0.06, 0.3], [-0.12, 0.0], [0.02, 0.0], [-0.07, -0.3], [0.14, 0.06], [0.0, 0.06], [0.1, 0.3]], closed: true, sharp: true }); break;
    case 'smile': P.push({ pts: circ(0, 0, 0.25, 0, Math.PI * 2, 48), closed: true }, { pts: circ(0, 0.0, 0.15, Math.PI * 1.15, Math.PI * 1.85, 20) }, { pts: [[-0.08, 0.06], [-0.08, 0.12]] }, { pts: [[0.08, 0.06], [0.08, 0.12]] }); break;
    case 'arrow': P.push({ pts: [[-0.3, 0], [0.25, 0]], sharp: true }, { pts: [[0.12, 0.12], [0.27, 0], [0.12, -0.12]], sharp: true }); break;
    case 'moon': P.push({ pts: [...circ(0, 0, 0.25, Math.PI * 0.3, Math.PI * 1.7, 36), ...circ(0.1, 0, 0.2, Math.PI * 1.55, Math.PI * 0.45, 30)], closed: true }); break;
    case 'art-word': P.push({ pts: [[-0.3, -0.13], [-0.22, 0.13], [-0.14, -0.13]], sharp: true }, { pts: [[-0.26, -0.03], [-0.18, -0.03]] }, { pts: [[-0.07, -0.13], [-0.07, 0.13], ...circ(-0.03, 0.065, 0.065, Math.PI / 2, -Math.PI / 2, 12), [0.03, -0.13]], sharp: true }, { pts: [[0.12, 0.13], [0.3, 0.13]] }, { pts: [[0.21, 0.13], [0.21, -0.13]] }); break;
    case 'eye': P.push({ pts: [...circ(0, -0.18, 0.32, Math.PI * 0.22, Math.PI * 0.78, 20), ...circ(0, 0.18, 0.32, Math.PI * 1.22, Math.PI * 1.78, 20)], closed: true }, { pts: circ(0, 0, 0.07, 0, Math.PI * 2, 24), closed: true }); break;
    default: P.push({ pts: Array.from({ length: 80 }, (_, i) => { const t = i / 79, a = t * Math.PI * 6; return [Math.cos(a) * 0.27 * t, Math.sin(a) * 0.27 * t]; }) });
  }
  return P;
}

export function createNeonSign(options = {}) {
  const { o, variant, trim, T, V } = setup(options, NEON_VARIANTS, 'neon-sign', { board: 'acrylic' });
  const root = group(`neon-${variant}`);
  const col = T.neon ?? (o.color && !trim ? o.color : V.c);
  const Wb = 0.72, Hb = 0.68;
  const S = group('sign', { parent: root });
  const baseM = fin(T, '#141416', 'paint');
  let zf;
  if (T.board === 'box') {
    mesh(roundedBox(Wb, Hb, 0.012, 0.004), baseM, { parent: S, at: [0, 0, 0] });
    const ring = rectRing(Wb + 0.04, Hb + 0.04, Wb - 0.01, Hb - 0.01, 0.1, 0.006);
    mesh(ring, fin(T, '#222226', 'steel'), { parent: S, at: [0, 0, 0.04] });
    zf = 0.006;
  } else if (T.board === 'brick') {
    mesh(roundedBox(Wb + 0.1, Hb + 0.1, 0.06, 0.006), fin(T, '#d9d4cb', 'concrete'), { parent: S, at: [0, 0, -0.024] });
    const bm = fin(T, '#8e3b26', 'clay');
    const bh = 0.065, bw = 0.2;
    for (let j = 0; j < Math.floor((Hb + 0.1) / (bh + 0.012)); j++) {
      const y = -(Hb + 0.1) / 2 + 0.006 + bh / 2 + j * (bh + 0.012);
      for (let x = -(Wb + 0.1) / 2 + (j % 2 ? 0.006 : -bw / 2); x < (Wb + 0.1) / 2 - 0.01; x += bw + 0.012) {
        const x0 = Math.max(x, -(Wb + 0.1) / 2 + 0.006), x1 = Math.min(x + bw, (Wb + 0.1) / 2 - 0.006);
        if (x1 - x0 < 0.03) continue;
        mesh(roundedBox(x1 - x0, bh, 0.02, 0.004), bm, { parent: S, at: [(x0 + x1) / 2, y, 0.006 + 0.0] });
      }
    }
    zf = 0.016;
  } else {
    mesh(roundedBox(Wb, Hb, 0.01, 0.02), fin(T, '#eef6fa', 'glass'), { parent: S, at: [0, 0, 0] });
    zf = 0.005;
  }
  // tubes (lamp group: one shared material, all light together)
  const lens = new THREE.MeshPhysicalMaterial({ name: 'neon-tube', color: col, emissive: col, emissiveIntensity: 0.3, roughness: 0.2, clearcoat: 1, toneMapped: false });
  const glow = glowMaterial('white');
  glow.color.set(col);
  const lg = lampGroup('neon', 'white', { lens, glow });
  const tr = 0.0065;
  for (const p of neonPaths(variant)) {
    const v3 = p.pts.map(([x, y]) => new THREE.Vector3(x, y, zf + tr + 0.001));
    const curve = p.sharp ? new THREE.CurvePath() : new THREE.CatmullRomCurve3(v3, !!p.closed, 'centripetal', 0.5);
    if (p.sharp) { const all = p.closed ? [...v3, v3[0]] : v3; for (let i = 0; i < all.length - 1; i++) curve.add(new THREE.LineCurve3(all[i], all[i + 1])); }
    const geo = new THREE.TubeGeometry(curve, p.sharp ? Math.max(8, v3.length * 8) : 120, tr, 8, !!p.closed && !p.sharp);
    lg.add(S, { geometry: geo, normal: [0, 0, 1], w: 0.12, h: 0.12, depth: 0.01 });
    // end caps / electrodes
    if (!p.closed) for (const e of [v3[0], v3[v3.length - 1]]) mesh(new THREE.SphereGeometry(tr * 1.4, 8, 6), fin(T, '#2a2a2c', 'plastic'), { parent: S, at: [e.x, e.y, e.z] });
  }
  // clear standoff clips at the board
  for (const x of [-1, 1]) for (const y of [-1, 1]) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 10).rotateX(Math.PI / 2), M.chrome(), { parent: S, at: [x * (Wb / 2 - 0.03), y * (Hb / 2 - 0.03), zf + 0.006] });
  S.position.y = Hb / 2 + 0.06 + (T.board === 'brick' ? 0.05 : 0);
  // floor stand + transformer box
  mesh(roundedBox(Wb * 0.7, 0.05, 0.22, 0.012), baseM, { parent: root, at: [0, 0.025, 0] });
  mesh(roundedBox(0.12, 0.06, 0.06, 0.01), baseM, { parent: root, at: [0, 0.07, -0.06] });
  for (const x of [-1, 1]) mesh(roundedBox(0.02, 0.06, 0.04, 0.004), M.chrome(), { parent: root, at: [x * Wb * 0.3, 0.075, 0], name: 'clamp' });
  return done(root, 'neon-sign', variant, o, () => [clip('on', 1, lampTracks('neon', 2.6)), clip('flicker', 1, lampTracks('neon', 2.6, { blink: 3 }))], T);
}
