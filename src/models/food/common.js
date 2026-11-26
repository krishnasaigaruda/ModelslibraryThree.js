/*
 * Shared helpers for the Food & Drink category: appetising materials, vertex-colour
 * variation, canvas labels/textures (guarded for Node), hollow vessels with liquid,
 * plates/bowls/boards, instanced scatter (sprinkles, seeds) and steam.
 */
import * as THREE from 'three';
import { mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant, jitter } from '../../core/utils.js';
import { toColor } from '../../core/materials.js';
import { moveTrack, scaleTrack, numberTrack, rotateTrack, spinTrack, clip } from '../../core/animation.js';

export { THREE, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant, jitter, toColor };
export { moveTrack, scaleTrack, numberTrack, rotateTrack, spinTrack, clip };

export const HAS_DOC = typeof document !== 'undefined';
export const PI = Math.PI;
export const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ noise */
function hash3(x, y, z) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1440662683)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const sm = (t) => t * t * (3 - 2 * t);
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
}
export function fbm(x, y, z, oct = 3) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * noise3(x * f, y * f, z * f); a *= 0.5; f *= 2.03; }
  return s / (1 - 0.5 ** oct);
}

/** Paint vertex colours: fn(x, y, z, colorOut, i). Material must use vertexColors. */
export function vcolor(geo, fn) {
  const pos = geo.attributes.position;
  const arr = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    fn(pos.getX(i), pos.getY(i), pos.getZ(i), c, i);
    arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}
const _ca = new THREE.Color(), _cb = new THREE.Color();
/** Vertical gradient + noise mottling between colours. stops: [[t, '#hex'], ...] over y∈[y0,y1]. */
export function gradient(geo, stops, { y0, y1, axis = 'y', noise = 0, scale = 30, dark } = {}) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const lo = y0 ?? bb.min[axis], hi = y1 ?? bb.max[axis];
  const cols = stops.map(([t, h]) => [t, toColor(h)]);
  return vcolor(geo, (x, y, z, c) => {
    const v = { x, y, z }[axis];
    const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo || 1)));
    let k = 0;
    while (k < cols.length - 2 && t > cols[k + 1][0]) k++;
    const [ta, ca] = cols[k], [tb, cb] = cols[Math.min(k + 1, cols.length - 1)];
    c.copy(ca).lerp(cb, Math.min(1, Math.max(0, (t - ta) / (tb - ta || 1))));
    if (noise) {
      const n = fbm(x * scale, y * scale, z * scale, 3) - 0.5;
      c.multiplyScalar(1 + n * noise * 2);
      if (dark) c.lerp(_ca.set(dark), Math.max(0, n) * noise);
    }
  });
}
/** Flat colour with noise variation (crumb, crust, skin mottling). */
export function mottle(geo, color, { noise = 0.15, scale = 40, alt, altAmt = 0.5 } = {}) {
  const base = toColor(color);
  const a = alt ? toColor(alt) : null;
  return vcolor(geo, (x, y, z, c) => {
    const n = fbm(x * scale, y * scale, z * scale, 3);
    c.copy(base).multiplyScalar(1 + (n - 0.5) * noise * 2);
    if (a) c.lerp(a, Math.max(0, n - 0.5) * 2 * altAmt);
  });
}

/* ------------------------------------------------------------------ materials */
const lighten = (hex, k = 0.35) => toColor(hex).lerp(new THREE.Color(1, 1, 1), k);
export function phys(color, o = {}) {
  const vc = !!o.vc;
  return new THREE.MeshPhysicalMaterial({
    name: o.name ?? 'food',
    color: vc ? new THREE.Color(1, 1, 1) : toColor(color),
    roughness: o.rough ?? 0.5,
    metalness: o.metal ?? 0,
    clearcoat: o.cc ?? 0,
    clearcoatRoughness: o.ccr ?? 0.25,
    sheen: o.sheen ?? 0,
    sheenRoughness: o.sheenR ?? 0.5,
    sheenColor: o.sheen ? (o.sheenColor ? toColor(o.sheenColor) : vc ? new THREE.Color(0.22, 0.2, 0.18) : lighten(color ?? '#ffffff', 0.5).multiplyScalar(0.6)) : new THREE.Color(0, 0, 0),
    vertexColors: vc,
    map: o.map ?? null,
    transparent: (o.opacity ?? 1) < 1 || !!o.transparent,
    opacity: o.opacity ?? 1,
    depthWrite: o.depthWrite ?? (o.opacity ?? 1) >= 0.6,
    side: o.side ?? THREE.FrontSide,
    emissive: o.emissive ? toColor(o.emissive) : new THREE.Color(0, 0, 0),
    emissiveIntensity: o.emissiveIntensity ?? 1,
    flatShading: !!o.flat,
  });
}
/** Waxy fruit skin (apple, pepper, tomato, eggplant). */
export const waxy = (c, o = {}) => phys(c, { rough: 0.32, cc: 0.7, ccr: 0.2, sheen: 0.2, ...o, name: 'skin' });
/** Matte/velvet skin (peach, kiwi, potato). */
export const velvet = (c, o = {}) => phys(c, { rough: 0.8, sheen: 1, sheenR: 0.4, ...o, name: 'skin' });
/** Juicy flesh: soft sheen fakes subsurface warmth. */
export const flesh = (c, o = {}) => phys(c, { rough: 0.38, cc: 0.35, ccr: 0.4, sheen: 0.7, sheenR: 0.3, ...o, name: 'flesh' });
/** Baked crust (bread, pastry, cookie). */
export const crust = (c, o = {}) => phys(c, { rough: 0.72, sheen: 0.2, sheenR: 0.6, sheenColor: '#6a5030', ...o, name: 'crust' });
/** Egg-washed / glossy bake. */
export const gloss = (c, o = {}) => phys(c, { rough: 0.35, cc: 0.6, ccr: 0.3, sheen: 0.3, ...o, name: 'glazed' });
/** Sugar glaze, chocolate coating, syrup. */
export const glaze = (c, o = {}) => phys(c, { rough: 0.18, cc: 1, ccr: 0.08, ...o, name: 'glaze' });
/** Buttercream / frosting / cream. */
export const cream = (c, o = {}) => phys(c, { rough: 0.55, sheen: 0.6, sheenR: 0.5, ...o, name: 'cream' });
export const leafy = (c, o = {}) => phys(c, { rough: 0.5, cc: 0.4, ccr: 0.35, side: THREE.DoubleSide, ...o, name: 'leaf' });
export const meat = (c, o = {}) => phys(c, { rough: 0.55, cc: 0.4, ccr: 0.45, sheen: 0.3, ...o, name: 'meat' });
export const ceramic = (c = '#f6f4ef', o = {}) => phys(c, { rough: 0.16, cc: 1, ccr: 0.05, ...o, name: 'ceramic' });
export const clearGlass = (tint = '#eef6f8', o = {}) => phys(tint, { rough: 0.03, cc: 1, ccr: 0.02, opacity: 0.28, depthWrite: false, ...o, name: 'glass' });
export const liquid = (c, o = {}) => phys(c, { rough: 0.06, cc: 1, ccr: 0.03, ...o, name: 'liquid' });
export const plasticMat = (c, o = {}) => phys(c, { rough: 0.4, cc: 0.2, ...o, name: 'plastic' });
export const paperMat = (c, o = {}) => phys(c, { rough: 0.85, ...o, name: 'paper' });
export const metalMat = (c = '#c9ccd1', o = {}) => phys(c, { rough: 0.3, metal: 0.95, ...o, name: 'metal' });
export const foil = (c = '#d9dadf', o = {}) => phys(c, { rough: 0.22, metal: 1, ...o, name: 'foil' });
export const woodMat = (c = '#b8874f', o = {}) => phys(c, { rough: 0.6, cc: 0.25, ccr: 0.5, ...o, name: 'wood' });

/* ------------------------------------------------------------------ canvas */
const texCache = new Map();
/** Cached canvas texture; returns null in Node. draw(ctx, w, h). */
export function canvasTex(key, w, h, draw, { repeat, srgb = true } = {}) {
  if (!HAS_DOC) return null;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  texCache.set(key, t);
  return t;
}
const FONT = '"Helvetica Neue", Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
/**
 * Brand-free product label. spec: { bg, fg, accent, brand, name, sub, motif, w, h, serif, wrap }
 * Designed to wrap around a cylinder (wrap=true repeats the panel twice) or a flat face.
 */
export function labelTex(spec) {
  const { bg = '#ffffff', fg = '#222', accent = '#d33', brand = '', name = '', sub = '', motif = 'band', w = 512, h = 256, serif = false, wrap = false, fruit } = spec;
  return canvasTex(`label:${JSON.stringify(spec)}`, w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const panels = wrap ? 2 : 1;
    for (let p = 0; p < panels; p++) {
      const ox = (p * w) / panels, pw = w / panels;
      g.save(); g.translate(ox, 0);
      drawMotif(g, motif, pw, h, accent, fg);
      if (fruit) { g.fillStyle = fruit; g.beginPath(); g.arc(pw * 0.5, h * 0.66, h * 0.13, 0, TAU); g.fill(); g.fillStyle = '#3d8a2c'; g.beginPath(); g.ellipse(pw * 0.53, h * 0.52, h * 0.05, h * 0.02, -0.5, 0, TAU); g.fill(); }
      g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
      const fs = Math.min(h * 0.24, (pw * 1.5) / Math.max(4, brand.length));
      g.font = `${serif ? 'italic bold' : 'bold'} ${fs}px ${serif ? SERIF : FONT}`;
      if (brand) g.fillText(brand, pw / 2, h * 0.3);
      g.font = `${h * 0.11}px ${FONT}`;
      if (name) g.fillText(name.toUpperCase(), pw / 2, fruit ? h * 0.88 : h * 0.6);
      g.font = `${h * 0.07}px ${FONT}`;
      if (sub) g.fillText(sub, pw / 2, h * 0.85);
      g.restore();
    }
  });
}
function drawMotif(g, motif, w, h, accent, fg) {
  g.fillStyle = accent; g.strokeStyle = accent;
  if (motif === 'band') { g.fillRect(0, h * 0.44, w, h * 0.3); g.globalAlpha = 0.25; g.fillRect(0, 0, w, h * 0.06); g.fillRect(0, h * 0.94, w, h * 0.06); g.globalAlpha = 1; }
  else if (motif === 'stripes') { for (let x = -h; x < w; x += h * 0.22) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h * 0.11, h); g.lineTo(x + h * 0.11 + h, 0); g.lineTo(x + h, 0); g.fill(); } g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(w * 0.12, h * 0.12, w * 0.76, h * 0.76); }
  else if (motif === 'dots') { for (let y = 10; y < h; y += 26) for (let x = (y / 26) % 2 ? 13 : 0; x < w; x += 26) { g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); } g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.4, h * 0.38, 0, 0, TAU); g.fill(); }
  else if (motif === 'wave') { g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, h * 0.62 + Math.sin(x / w * TAU * 2) * h * 0.08); g.lineTo(w, h); g.fill(); }
  else if (motif === 'sun') { g.save(); g.translate(w / 2, h * 0.62); for (let i = 0; i < 16; i++) { g.rotate(TAU / 16); g.fillRect(0, -3, h, 6); } g.restore(); g.globalAlpha = 0.85; g.fillStyle = '#fff'; g.fillRect(0, h * 0.15, w, h * 0.3); g.globalAlpha = 1; }
  else if (motif === 'frame') { g.lineWidth = h * 0.04; g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12); g.lineWidth = h * 0.012; g.strokeRect(h * 0.11, h * 0.11, w - h * 0.22, h - h * 0.22); }
  else if (motif === 'check') { const s = h / 8; for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) if (((x + y) / s) % 2 < 1) g.fillRect(x, y, s, s); g.fillStyle = '#fff'; g.fillRect(w * 0.15, h * 0.18, w * 0.7, h * 0.62); }
  void fg;
}
/** Multi-face box art: front with big name, side panels plain. */
export function boxArt(spec) {
  const { bg = '#ffcc00', fg = '#222', accent = '#e03', brand = '', name = '', bowl = '#f3e0b0', w = 256, h = 384 } = spec;
  return canvasTex(`box:${JSON.stringify(spec)}`, w, h, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, bg); grd.addColorStop(1, accent); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(w * 0.8, h * 0.15, w * 0.5, 0, TAU); g.fill();
    g.fillStyle = fg; g.textAlign = 'center'; g.font = `bold ${w * 0.16}px ${FONT}`; g.fillText(brand, w / 2, h * 0.16);
    g.font = `bold ${w * 0.11}px ${FONT}`; g.fillText(name.toUpperCase(), w / 2, h * 0.3);
    // bowl of cereal illustration
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(w / 2, h * 0.66, w * 0.38, h * 0.08, 0, 0, TAU); g.fill();
    g.fillStyle = bowl; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(w / 2 + (Math.sin(i * 7.1) * w * 0.32), h * 0.64 + Math.cos(i * 3.3) * h * 0.045, w * 0.035, 0, TAU); g.fill(); }
    g.fillStyle = '#f2f2f2'; g.beginPath(); g.moveTo(w * 0.12, h * 0.68); g.quadraticCurveTo(w / 2, h * 0.92, w * 0.88, h * 0.68); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.font = `${w * 0.06}px ${FONT}`; g.fillText('whole grain · 375 g', w / 2, h * 0.95);
  });
}

/* ------------------------------------------------------------------ geometry */
/** Lathe from r(t) sampled over t∈[0,1], y = t*h. Ends pinched to the axis when r(0)/r(1)≈0. */
export function profile(fnR, h, { n = 24, seg = 32, phiStart = 0, phiLength = TAU } = {}) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector2(Math.max(1e-4, fnR(t)), t * h)); }
  return new THREE.LatheGeometry(pts, seg, phiStart, phiLength);
}
/** Interpolate radius along a [[r,y],...] profile at height y. */
export function radiusAt(pts, y) {
  for (let i = 1; i < pts.length; i++) {
    const [r0, y0] = pts[i - 1], [r1, y1] = pts[i];
    if (y >= Math.min(y0, y1) && y <= Math.max(y0, y1) && y1 !== y0) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return pts[pts.length - 1][0];
}
/**
 * Genuinely hollow vessel: outer profile [[r,y]...] from base centre to rim.
 * Returns { geo, inner(y) → inner radius, floor (inner bottom y), rimY }.
 */
export function vessel(outer, wall = 0.004, { seg = 48, lip = true } = {}) {
  const pts = outer.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y));
  const [R, H] = outer[outer.length - 1];
  if (lip) pts.push(new THREE.Vector2(R - wall * 0.5, H + wall * 0.35));
  const floor = Math.max(wall, outer[0][1] + wall);
  const inner = [];
  for (let i = outer.length - 1; i >= 1; i--) {
    const [r, y] = outer[i];
    if (y < floor) continue;
    inner.push([Math.max(0.0005, r - wall), y]);
  }
  inner.push([Math.max(0.0005, radiusAt(outer, floor) - wall), floor]);
  inner.push([0, floor]);
  for (const [r, y] of inner) pts.push(new THREE.Vector2(r, y));
  const innerSorted = inner.slice().reverse().filter(([r]) => r > 0);
  const geo = new THREE.LatheGeometry(pts, seg);
  return { geo, inner: (y) => radiusAt(innerSorted, y), floor, rimY: H };
}
/** Liquid/contents filling an inner radius function from y0 to y1 (flat top, optional meniscus dome). */
export function fillGeo(inner, y0, y1, { seg = 48, dome = 0, n = 8 } = {}) {
  const pts = [new THREE.Vector2(0, y0)];
  for (let i = 0; i <= n; i++) { const y = y0 + ((y1 - y0) * i) / n; pts.push(new THREE.Vector2(Math.max(0.0005, inner(y) - 0.0004), y)); }
  if (dome) { const r = inner(y1) - 0.0004; for (let i = 1; i <= 6; i++) { const t = i / 6; pts.push(new THREE.Vector2(r * Math.cos((t * PI) / 2), y1 + dome * Math.sin((t * PI) / 2))); } }
  else pts.push(new THREE.Vector2(0, y1));
  return new THREE.LatheGeometry(pts, seg);
}
/** Flat disc lying in XZ (top surface), useful for liquid tops / caps. */
export function disc(r, seg = 40) {
  const g = new THREE.CircleGeometry(r, seg);
  g.rotateX(-PI / 2);
  return g;
}
/** Remap ShapeGeometry UVs to 0..1 over its bounding box. */
export function fitUV(geo) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox, uv = geo.attributes.uv, pos = geo.attributes.position;
  const sx = bb.max.x - bb.min.x || 1, sy = bb.max.y - bb.min.y || 1;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / sx, (pos.getY(i) - bb.min.y) / sy);
  return geo;
}
/** Instanced scatter: items = [{at, rot, scale}], all sharing geo+mat. */
export function scatter(parent, geo, mat, items, name) {
  const im = new THREE.InstancedMesh(geo, mat, items.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  items.forEach((it, i) => {
    p.set(...it.at);
    q.setFromEuler(e.set(...(it.rot ?? [0, 0, 0])));
    typeof it.scale === 'number' ? s.setScalar(it.scale) : s.set(...(it.scale ?? [1, 1, 1]));
    m.compose(p, q, s);
    im.setMatrixAt(i, m);
    if (it.color && im.setColorAt) im.setColorAt(i, toColor(it.color));
  });
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere?.();
  im.computeBoundingBox?.();
  if (name) im.name = name;
  parent.add(im);
  return im;
}
/** Points on the upper surface of a lathe shape: returns [{at, normal}] for top-ish placements. */
export function domePoints(n, rand, { r, y, h = 0, rMin = 0, rMax = 1 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = rand() * TAU;
    const k = Math.sqrt(rMin * rMin + rand() * (rMax * rMax - rMin * rMin));
    out.push({ at: [Math.cos(a) * r * k, y + h * Math.sqrt(Math.max(0, 1 - k * k)), Math.sin(a) * r * k], a, k });
  }
  return out;
}

/* ------------------------------------------------------------------ tableware */
/** Dinner plate: lathe with a rim; returns { g, top } (food surface height). */
export function plate(parent, { r = 0.13, color = '#f7f5f0', at = [0, 0, 0], deep = false, mat } = {}) {
  const h = deep ? 0.035 : 0.022;
  const geo = lathe([[0, 0.002], [r * 0.55, 0.0], [r * 0.6, 0.003], [r * 0.66, 0.006], [r * 0.7, 0.008], [r * 0.9, h * 0.75], [r, h], [r * 0.995, h + 0.003], [r * 0.9, h * 0.75 + 0.003], [r * 0.7, 0.011], [r * 0.65, 0.0105], [0, 0.0105]], 56);
  const g = mesh(geo, mat ?? ceramic(color), { parent, at, name: 'plate' });
  return { g, top: at[1] + 0.0105 };
}
/** Hollow bowl. Returns { g, inner(y), floor, rim }. */
export function bowl(parent, { r = 0.085, h = 0.07, color = '#f4f1ea', at = [0, 0, 0], mat, wall = 0.005, foot = true, flare = 1 } = {}) {
  const out = [];
  if (foot) out.push([0, 0], [r * 0.42, 0], [r * 0.44, 0.008], [r * 0.4, 0.01]);
  else out.push([0, 0], [r * 0.45, 0]);
  for (let i = 1; i <= 10; i++) { const t = i / 10; out.push([r * (0.42 + 0.58 * Math.pow(Math.sin((t * PI) / 2), 0.8 / flare)), 0.01 + (h - 0.01) * t]); }
  const v = vessel(out, wall);
  const g = mesh(v.geo, mat ?? ceramic(color), { parent, at, name: 'bowl' });
  return { g, inner: v.inner, floor: v.floor + at[1], rim: h + at[1], local: v };
}
/** Hollow cup/mug body from a simple shape. Returns { g, inner, floor, rim }. */
export function cup(parent, { rTop = 0.042, rBot = 0.032, h = 0.09, wall = 0.004, mat, at = [0, 0, 0], belly = 0, name = 'cup', seg = 48 } = {}) {
  const out = [[0, 0], [rBot * 0.92, 0], [rBot, 0.004]];
  for (let i = 1; i <= 10; i++) { const t = i / 10; out.push([rBot + (rTop - rBot) * t + Math.sin(t * PI) * belly, 0.004 + (h - 0.004) * t]); }
  const v = vessel(out, wall, { seg });
  const g = mesh(v.geo, mat ?? ceramic(), { parent, at, name });
  return { g, inner: v.inner, floor: v.floor + at[1], rim: h + at[1], local: v, outer: out };
}
/** C-shaped mug handle on +X side. */
export function handle(parent, { x, y0, y1, out = 0.03, r = 0.006, mat, name = 'handle' }) {
  const ym = (y0 + y1) / 2, hh = (y1 - y0) / 2;
  return curveTube([[x - 0.004, y1, 0], [x + out * 0.7, y1 + hh * 0.05, 0], [x + out, ym, 0], [x + out * 0.7, y0 - hh * 0.05, 0], [x - 0.004, y0, 0]], r, mat, { parent, segments: 24, radialSegments: 10, name });
}
/** Wooden board. */
export function board(parent, { w = 0.36, d = 0.24, t = 0.02, color = '#b9874f', at = [0, 0, 0], round = false } = {}) {
  const geo = round ? new THREE.CylinderGeometry(w / 2, w / 2, t, 48) : roundedBox(w, t, d, Math.min(0.03, t * 0.45), 3);
  if (!round) {
    // small handle tab
    const tab = roundedBox(0.06, t, 0.05, t * 0.45, 3);
    mesh(tab, woodMat(color), { parent, at: [at[0] + w / 2 + 0.02, at[1] + t / 2, at[2]] });
  }
  mottle(geo, color, { noise: 0.12, scale: 9, alt: '#7a5330', altAmt: 0.25 });
  mesh(geo, woodMat(color, { vc: true }), { parent, at: [at[0], at[1] + t / 2, at[2]], name: 'board' });
  return at[1] + t;
}
/** Paper napkin / wrapper square. */
export function napkin(parent, { w = 0.2, d = 0.2, color = '#ffffff', at = [0, 0, 0], rotY = 0 } = {}) {
  const geo = roundedBox(w, 0.003, d, 0.0012, 1);
  return mesh(geo, paperMat(color), { parent, at: [at[0], at[1] + 0.0015, at[2]], rot: [0, rotY, 0], name: 'napkin' });
}

/* ------------------------------------------------------------------ fx */
/** Steam wisps rising from a surface at height y. Returns tracks for a 'steam' clip. */
export function steam(parent, { at = [0, 0, 0], r = 0.03, n = 3, h = 0.09, name = 'steam' } = {}) {
  const g = group(name, { parent, at });
  const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, depthWrite: false, name: 'steam' });
  const tracks = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.6;
    const x0 = Math.cos(a) * r * 0.5, z0 = Math.sin(a) * r * 0.5;
    const pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([x0 + Math.sin(t * 5 + i) * 0.008, t * h, z0 + Math.cos(t * 4 + i * 2) * 0.006]); }
    const w = curveTube(pts, 0.0035 + 0.002 * (i % 2), mat, { parent: g, segments: 18, radialSegments: 6, name: `${name}_${i}` });
    tracks.push(scaleTrack(w, 2.4, (t) => [1 + 0.3 * Math.sin((t + i / n) * TAU), 0.8 + 0.4 * ((t + i / n) % 1), 1], 12));
  }
  tracks.push(numberTrack(`${name}_0.material.opacity`, 2.4, (t) => 0.12 + 0.08 * Math.sin(t * TAU), 12));
  return tracks;
}
/** Simple sesame/sprinkle geometry cache. */
const gcache = new Map();
export function cached(key, make) {
  if (!gcache.has(key)) gcache.set(key, make());
  return gcache.get(key);
}
export const sprinkleGeo = () => cached('sprinkle', () => new THREE.CapsuleGeometry(0.0011, 0.005, 2, 5).rotateZ(PI / 2));
export const seedGeo = () => cached('seed', () => new THREE.SphereGeometry(0.0016, 6, 4).scale(1, 0.45, 0.62));
export const ballGeo = (r = 1, w = 12, h = 8) => cached(`ball${r}-${w}`, () => new THREE.SphereGeometry(r, w, h));
export const SPRINKLES = ['#ff4f7b', '#ffd23f', '#3ec1ff', '#7be07b', '#b07cff', '#ffffff', '#ff8a3d'];

/** Build helper: wrap factory boilerplate. */
export function make(type, variants, build) {
  return (options = {}) => {
    const o = normalizeOptions(options);
    const variant = pickVariant(variants, o.variant, type);
    const trim = o.trim ?? null;
    const root = group(`${type}-${variant}${trim ? `-${trim}` : ''}`);
    const ctx = { o, variant, trim, v: variants[variant], root, animations: [], oneShot: [], rand: rng(`${type}:${variant}:${trim}`) };
    build(ctx);
    const obj = finalize(root, { type, variant, options: o, animations: ctx.animations });
    if (ctx.oneShot.length) obj.userData.premade.oneShot = ctx.oneShot;
    return obj;
  };
}

/**
 * Sweep a variable cross-section along a smooth path (bananas, croissants, sausages,
 * baguettes, pretzels). r(t) radius, ring(a, t) radial multiplier (ridges/lumps),
 * ell = [sx, sy] ellipse scaling of the section (in the frame's normal/binormal).
 * Ends are capped with fans (pinch r→0 at the ends for rounded tips).
 */
export function sweep(points, { r = () => 0.01, ring = () => 1, seg = 48, sides = 20, closed = false, caps = true, ell = [1, 1], twist = 0 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'centripetal');
  const fr = curve.computeFrenetFrames(seg, closed);
  const pos = [], uv = [], idx = [];
  const P = new THREE.Vector3();
  const rows = seg + 1;
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    curve.getPointAt(t, P);
    const N = fr.normals[i], B = fr.binormals[i];
    const rr = r(t);
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * TAU + twist * t;
      const m = rr * ring(a, t);
      const cx = Math.cos(a) * m * ell[0], cy = Math.sin(a) * m * ell[1];
      pos.push(P.x + N.x * cx + B.x * cy, P.y + N.y * cx + B.y * cy, P.z + N.z * cx + B.z * cy);
      uv.push(t, j / sides);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < sides; j++) {
    const a = i * (sides + 1) + j, b = a + sides + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  if (caps && !closed) {
    for (const [i, flip] of [[0, true], [seg, false]]) {
      const c = pos.length / 3;
      const t = i / seg;
      curve.getPointAt(t, P);
      pos.push(P.x, P.y, P.z); uv.push(t, 0.5);
      for (let j = 0; j < sides; j++) {
        const a = i * (sides + 1) + j;
        idx.push(c, a + 1, a, c, a, a + 1);
      }
    }
  }
  void rows;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
/** Smooth lathe through control points [[r,y],...] (spline-resampled). */
export function smoothLathe(ctrl, { n = 28, seg = 40, phiStart = 0, phiLength = TAU } = {}) {
  const pts = smoothPts(ctrl, n);
  return { geo: new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-4), y)), seg, phiStart, phiLength), pts };
}
export function smoothPts(ctrl, n = 28) {
  const c = new THREE.SplineCurve(ctrl.map(([r, y]) => new THREE.Vector2(r, y)));
  return c.getSpacedPoints(n).map((p) => [Math.max(0, p.x), p.y]);
}
/** Flat leaf geometry in XZ plane (length along +X), gently cupped. */
export function leafGeo(len = 0.05, wid = 0.02, { cup = 0.3, curl = 0.2, serrate = 0 } = {}) {
  return cached(`leaf${len}-${wid}-${cup}-${curl}-${serrate}`, () => {
    const s = new THREE.Shape();
    const n = 14;
    s.moveTo(0, 0);
    for (let i = 1; i <= n; i++) { const t = i / n; const w = Math.sin(t * PI) ** 0.8 * wid * 0.5 * (1 + (serrate && i % 2 ? serrate : 0)); s.lineTo(t * len, w); }
    for (let i = n - 1; i >= 1; i--) { const t = i / n; const w = Math.sin(t * PI) ** 0.8 * wid * 0.5 * (1 + (serrate && i % 2 ? serrate : 0)); s.lineTo(t * len, -w); }
    s.lineTo(0, 0);
    const g = new THREE.ShapeGeometry(s, 4);
    g.rotateX(-PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, (z / wid) ** 2 * wid * cup * 2 + (x / len) ** 2 * len * curl); }
    g.computeVertexNormals();
    return g;
  });
}
/** Push vertices of a convex-ish geometry inward where they fall inside bite spheres; recolours them. */
export function biteGeo(geo, bites, { centre = [0, 0, 0], color = '#f4ead0' } = {}) {
  const pos = geo.attributes.position;
  const col = geo.attributes.color;
  const O = new THREE.Vector3(...centre), p = new THREE.Vector3(), d = new THREE.Vector3(), q = new THREE.Vector3();
  const fc = toColor(color);
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    let hit = false;
    for (const b of bites) {
      const C = new THREE.Vector3(...b.at);
      if (p.distanceTo(C) >= b.r) continue;
      hit = true;
      d.copy(O).sub(p);
      const L = d.length();
      d.normalize();
      let lo = 0, hi = L;
      for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; q.copy(p).addScaledVector(d, m); q.distanceTo(C) < b.r ? (lo = m) : (hi = m); }
      p.addScaledVector(d, hi);
    }
    if (hit) { pos.setXYZ(i, p.x, p.y, p.z); if (col) col.setXYZ(i, fc.r, fc.g, fc.b); }
  }
  geo.computeVertexNormals();
  return geo;
}

/** Hollow rectangular tray/box (open top) of outer size w × h × d. */
export function trayBox(parent, w, h, d, mat, wall = 0.002, { at = [0, 0, 0], name = 'tray' } = {}) {
  const R = (w / 2) * Math.SQRT2;
  const v = vessel([[0, 0], [R * 0.97, 0], [R, Math.min(0.004, h * 0.1)], [R, h]], wall, { seg: 4 });
  v.geo.rotateY(PI / 4);
  v.geo.scale(1, 1, d / w);
  return mesh(v.geo, mat, { parent, at, name });
}
