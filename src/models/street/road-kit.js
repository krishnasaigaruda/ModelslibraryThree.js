// Road kit: modular road pieces on a 12 m tile grid.
//
//   Every piece is centred on the origin, sits on y = 0 and its footprint is a whole number
//   of 12 m tiles (12, 24 or 36 m). Roads always enter a tile edge on a tile centre line, so
//   pieces snap edge to edge: a standard street is 7 m of asphalt (2 × 3.5 m lanes), a 0.15 m
//   kerb and a 2.35 m sidewalk each side. Heights: ground 0.05, asphalt 0.06, sidewalk 0.20.
//
//   Static geometry (slabs, kerbs, paint, rails, walls, trees) is merged into one
//   multi-material mesh ('road-surface'). Streetlights, crossing gates and lamps are separate
//   meshes that reach down to y = 0 (poles run through decks and pillars), so nothing floats.
//
//   Trims: new · worn · wet · snowy · night (lit lights) · country (verges, no kerbs) ·
//   city (pavers, trees in pits, lights) · suburban (grass strip, trees) · lht (left-hand traffic).
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { group, lathe, rng, jitter, normalizeOptions, pickVariant, finalize, roundedBox } from '../../core/utils.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { clip, rotateTrack } from '../../core/animation.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const HR = 3.5; // half road width (2 lanes)
const GY = 0.05; // ground / verge top
const AY = 0.06; // asphalt top
const PY = 0.066; // paint top
const SY = 0.2; // sidewalk top
const CW = 0.15; // kerb width
const V2 = (x, y) => new THREE.Vector2(x, y);
const PI = Math.PI;

/* -------------------------------- trims -------------------------------- */

const BASE = {
  asphalt: '#3b3c3f', ar: 0.9, paint: '#ecebe4', yellow: '#e8b20c', conc: '#c3bfb7', curb: '#a8a49c', pavers: '#b7aa9a', grass: '#5f7f3c',
  edge: 'curb', walk: 'plain', fill: 'grass', lights: false, lit: false, trees: false, posts: false, H: 1, fade: 0, lstyle: 'cobra', lamp: 'fog', leaf: '#4f7a34',
};
export const ROAD_KIT_TRIMS = {
  new: { asphalt: '#1d1e21', paint: '#ffffff', yellow: '#ffc20e', conc: '#d6d3cc', curb: '#cfccc5', studs: true, lstyle: 'modern', lamp: 'white' },
  worn: { asphalt: '#646462', ar: 0.98, paint: '#bdb8aa', yellow: '#a88d3e', conc: '#a39e93', curb: '#8f8a81', fade: 0.5, cracks: true, potholes: true, weeds: true, grass: '#6f7a40' },
  wet: { asphalt: '#222427', wet: true, conc: '#8b8882', curb: '#7d7973', pavers: '#857a6e', puddles: true, grass: '#47662c' },
  snowy: { snow: true, asphalt: '#46484c', leaf: '#c9d3cd' },
  night: { lights: true, lit: true, asphalt: '#2b2c2f', lstyle: 'cobra' },
  country: { edge: 'verge', posts: true, lstyle: 'wood', grass: '#6a8a3e' },
  city: { walk: 'pavers', fill: 'pavers', lights: true, trees: 'pit', bollards: true, lstyle: 'modern', lamp: 'white', manholes: true },
  suburban: { walk: 'lawn', trees: 'lawn', grass: '#5c8a3a' },
  lht: { H: -1, yellow: '#ecebe4' },
};

/* ------------------------------- textures ------------------------------- */

const TEX = new Map();
function ctex(key, metres, draw, px = 256) {
  if (typeof document === 'undefined') return null;
  if (TEX.has(key)) return TEX.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const g = c.getContext('2d');
  draw(g, px, rng(key));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / metres, 1 / metres);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  TEX.set(key, t);
  return t;
}
function speck(g, px, r, n, lo, hi, size = 2) {
  for (let i = 0; i < n; i++) {
    const v = Math.round(lo + r() * (hi - lo));
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(r() * px, r() * px, size * (0.5 + r()), size * (0.5 + r()));
  }
}
function bricks(g, px, r, rows, cols, mortar, lo, hi) {
  g.fillStyle = mortar;
  g.fillRect(0, 0, px, px);
  const h = px / rows;
  const w = px / cols;
  for (let j = 0; j < rows; j++) {
    for (let i = -1; i < cols; i++) {
      const v = Math.round(lo + r() * (hi - lo));
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(i * w + (j % 2) * (w / 2) + 1.5, j * h + 1.5, w - 3, h - 3);
    }
  }
}
const TEXTURES = {
  asphalt: [3, (g, px, r) => { g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, px, px); speck(g, px, r, 6000, 150, 255, 2); speck(g, px, r, 1800, 80, 140, 1.5); }],
  slabs: [3, (g, px, r) => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, px, px); speck(g, px, r, 2500, 200, 255, 1.5); g.fillStyle = '#8f8f8f'; for (let i = 0; i <= 2; i++) { g.fillRect(i * px / 2 - 1, 0, 2, px); g.fillRect(0, i * px / 2 - 1, px, 2); } }],
  pavers: [1.6, (g, px, r) => bricks(g, px, r, 16, 4, '#8a8a8a', 200, 255)],
  brick: [1.8, (g, px, r) => bricks(g, px, r, 24, 6, '#d8d4cc', 120, 200)],
  grass: [2, (g, px, r) => { g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, px, px); speck(g, px, r, 9000, 140, 255, 2.5); }],
  gravel: [1, (g, px, r) => { g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, px, px); speck(g, px, r, 5000, 110, 255, 4); }],
  panels: [4, (g, px, r) => { g.fillStyle = '#e2e2e2'; g.fillRect(0, 0, px, px); speck(g, px, r, 3000, 190, 250, 1.5); g.fillStyle = '#9a9a9a'; for (let i = 0; i < 2; i++) g.fillRect(i * px / 2, 0, 3, px); g.fillRect(0, px / 2, px, 2); }],
  tactile: [0.6, (g, px) => { g.fillStyle = '#e0e0e0'; g.fillRect(0, 0, px, px); g.fillStyle = '#ffffff'; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { g.beginPath(); g.arc((i + 0.5) * px / 8, (j + 0.5) * px / 8, px / 30, 0, 7); g.fill(); } }],
};

function decalTex(name) {
  return ctex(`decal-${name}`, 1, (g, px) => {
    g.clearRect(0, 0, px, px);
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#ffffff';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    if (name === 'bike') {
      g.lineWidth = px * 0.035;
      for (const x of [0.28, 0.72]) { g.beginPath(); g.arc(px * x, px * 0.62, px * 0.16, 0, 7); g.stroke(); }
      g.beginPath(); g.moveTo(px * 0.28, px * 0.62); g.lineTo(px * 0.45, px * 0.4); g.lineTo(px * 0.66, px * 0.4); g.lineTo(px * 0.72, px * 0.62); g.moveTo(px * 0.45, px * 0.4); g.lineTo(px * 0.52, px * 0.62); g.lineTo(px * 0.66, px * 0.4); g.stroke();
      g.beginPath(); g.arc(px * 0.55, px * 0.22, px * 0.06, 0, 7); g.fill();
    } else if (name === 'wheelchair') {
      g.lineWidth = px * 0.06;
      g.beginPath(); g.arc(px * 0.45, px * 0.62, px * 0.2, 0.3, 5.2); g.stroke();
      g.beginPath(); g.moveTo(px * 0.42, px * 0.3); g.lineTo(px * 0.45, px * 0.55); g.lineTo(px * 0.68, px * 0.55); g.lineTo(px * 0.78, px * 0.8); g.stroke();
      g.beginPath(); g.arc(px * 0.42, px * 0.17, px * 0.07, 0, 7); g.fill();
    } else if (name === 'rxr') {
      g.lineWidth = px * 0.05;
      g.beginPath(); g.moveTo(px * 0.15, px * 0.08); g.lineTo(px * 0.85, px * 0.92); g.moveTo(px * 0.85, px * 0.08); g.lineTo(px * 0.15, px * 0.92); g.stroke();
      g.font = `bold ${px * 0.3}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('R', px * 0.22, px * 0.5); g.fillText('R', px * 0.78, px * 0.5);
    } else {
      g.font = `bold ${px * 0.42}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.save(); g.scale(1, 1.8); g.fillText(name.toUpperCase(), px / 2, px / 3.6); g.restore();
    }
  });
}

/* ------------------------------- materials ------------------------------- */

const OFF = (f) => ({ polygonOffset: true, polygonOffsetFactor: f, polygonOffsetUnits: f });
function std(name, color, roughness, tex, extra = {}) {
  const T = tex && TEXTURES[tex] ? ctex(tex, TEXTURES[tex][0], TEXTURES[tex][1]) : null;
  return new THREE.MeshStandardMaterial({ name, color: M.toColor(color), roughness, map: T, ...extra });
}
function shade(c, k) {
  const col = M.toColor(c);
  return k < 0 ? col.multiplyScalar(1 + k) : col.lerp(new THREE.Color('#ffffff'), k);
}
function makeMat(K, key) {
  const T = K.T;
  const snow = () => std('snow', '#f3f6fa', 0.6);
  const wetk = T.wet ? 0.45 : 1;
  if (key.startsWith('decal:')) return std(key, '#ffffff', 0.5, null, { map: decalTex(key.slice(6)), transparent: true, depthWrite: false, ...OFF(-4) });
  switch (key) {
    case 'asphalt': return T.wet
      ? new THREE.MeshPhysicalMaterial({ name: 'asphalt-wet', color: M.toColor(T.asphalt), roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.15, map: ctex('asphalt', ...TEXTURES.asphalt) })
      : std('asphalt', T.asphalt, T.ar, 'asphalt');
    case 'patch': return std('asphalt-patch', shade(T.asphalt, -0.35), 0.85, 'asphalt', OFF(-1));
    case 'hole': return std('pothole', '#141414', 1, 'gravel', OFF(-2));
    case 'crack': return std('crack', '#151617', 1, null, OFF(-3));
    case 'paint': return std('paint-white', T.paint, 0.55 * wetk, null, OFF(-2));
    case 'yellow': return std('paint-yellow', T.yellow, 0.55 * wetk, null, OFF(-2));
    case 'blue': return std('paint-blue', '#1f5fb4', 0.6 * wetk, null, OFF(-1));
    case 'busred': return std('bus-lane', T.fade ? '#8a4a40' : '#a8302a', 0.8 * wetk, 'asphalt', OFF(-1));
    case 'bikegreen': return std('bike-lane', T.fade ? '#5a7a5a' : '#2f8a4e', 0.8 * wetk, 'asphalt', OFF(-1));
    case 'rubber': return std('crossing-panel', '#2a2a2a', 0.85, 'panels');
    case 'conc': return T.snow ? snow() : std('sidewalk', T.conc, 0.9 * wetk, 'slabs');
    case 'pavers': return T.snow ? snow() : std('pavers', T.pavers, 0.88 * wetk, 'pavers');
    case 'grass': return T.snow ? snow() : std('grass', T.grass, 1, 'grass');
    case 'gravel': return T.snow ? snow() : std('gravel', '#9b9285', 1, 'gravel');
    case 'dirt': return std('dirt', T.wet ? '#4f3d2b' : '#7a6248', T.wet ? 0.5 : 1, 'gravel');
    case 'curb': return std('kerb', T.curb, 0.75 * wetk);
    case 'tactile': return std('tactile-paving', '#e2b21a', 0.7, 'tactile');
    case 'snow': return snow();
    case 'puddle': return new THREE.MeshPhysicalMaterial({ name: 'puddle', color: '#2c333a', roughness: 0.03, metalness: 0.25, clearcoat: 1, ...OFF(-4) });
    case 'mud': return new THREE.MeshPhysicalMaterial({ name: 'muddy-water', color: '#4a3d2e', roughness: 0.05, clearcoat: 1, ...OFF(-4) });
    case 'water': return new THREE.MeshPhysicalMaterial({ name: 'water', color: '#2b5566', roughness: 0.06, metalness: 0.1, clearcoat: 1 });
    case 'metal': return M.metal('#34363a', 0.55);
    case 'galv': return M.metal('#a6abb0', 0.4);
    case 'rail': return M.metal('#7a746c', 0.35);
    case 'steelpaint': return M.paint(T.snow ? '#3d5a6e' : T.fade ? '#6e5a48' : '#2f6f8a', { metallic: 0.3, roughness: 0.5 });
    case 'concrete': return T.snow ? std('concrete', '#c9c7c2', 0.9, 'panels') : std('concrete', T.fade ? '#a39f96' : '#bab6ad', 0.9, 'panels');
    case 'portal': return std('tunnel-portal', '#a9a59c', 0.9, 'panels');
    case 'tiles': return std('tunnel-tiles', '#d9d6cc', 0.4, 'slabs');
    case 'earth': return std('earth', '#6b5a45', 1, 'gravel');
    case 'stone': return std('stone', T.snow ? '#a9a8a6' : '#8e887e', 0.85, 'gravel');
    case 'cobble': return new THREE.MeshPhysicalMaterial({ name: 'cobblestone', color: '#ffffff', roughness: T.wet ? 0.15 : 0.8, clearcoat: T.wet ? 1 : 0 });
    case 'mortar': return std('mortar', '#6c6862', 1, 'gravel');
    case 'brick': return std('brick', T.fade ? '#7a4a3c' : '#9a4b36', 0.9, 'brick');
    case 'wood': return M.wood('#8a6a46');
    case 'bark': return std('bark', '#4f3b2a', 1);
    case 'leaf': return M.foliage(T.leaf);
    case 'white': return std('white', '#f1f1ed', 0.45);
    case 'black': return std('black', '#18191b', 0.6);
    case 'red': return std('red', '#c4202a', 0.45);
    case 'amber': return std('reflector', '#ff8a1c', 0.3, null, { emissive: '#ff6a00', emissiveIntensity: 0.25 });
    case 'sign': return std('sign-blue', '#1d4f9c', 0.4);
    default: return std(key, '#888888', 0.8);
  }
}

/* ------------------------------ kit context ------------------------------ */

function kit(variant, T, seed) {
  const K = { root: group(`road-kit-${variant}`), T, H: T.H, r: rng(seed), parts: new Map(), lamps: {}, extraTracks: [], anims: [] };
  K.add = (key, g) => { if (!K.parts.has(key)) K.parts.set(key, []); K.parts.get(key).push(g); };
  K.lamp = (name, kind) => (K.lamps[name] ??= lampGroup(name, kind));
  return K;
}

function norm(g) {
  const x = g.index ? g.toNonIndexed() : g;
  for (const n of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(n)) x.deleteAttribute(n);
  if (!x.attributes.normal) x.computeVertexNormals();
  if (!x.attributes.uv) x.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2));
  x.clearGroups();
  x.morphAttributes = {};
  return x;
}

/** One mesh, one group per material key. */
function multi(K, name, parts, parent = K.root) {
  const keys = [...parts.keys()];
  const geos = keys.map((k) => mergeGeometries(parts.get(k).map(norm), false));
  const m = new THREE.Mesh(geos.length > 1 ? mergeGeometries(geos, true) : geos[0], keys.length > 1 ? keys.map((k) => makeMat(K, k)) : makeMat(K, keys[0]));
  m.name = name;
  parent.add(m);
  return m;
}

/* --------------------------------- paths --------------------------------- */
// A path gives position + unit tangent by arc length. Lateral offset u is along n = (tz, -tx).

function line(x0, z0, x1, z1) {
  const L = Math.hypot(x1 - x0, z1 - z0);
  const tx = (x1 - x0) / L;
  const tz = (z1 - z0) / L;
  return { L, step: 3, at: (s) => ({ x: x0 + tx * s, z: z0 + tz * s, tx, tz }) };
}
function arc(cx, cz, R, a0, a1) {
  const d = Math.sign(a1 - a0);
  return {
    L: Math.abs(a1 - a0) * R,
    step: Math.max(0.35, Math.min(1.5, R * 0.07)),
    at: (s) => { const a = a0 + (d * s) / R; return { x: cx + R * Math.cos(a), z: cz + R * Math.sin(a), tx: -Math.sin(a) * d, tz: Math.cos(a) * d }; },
  };
}
function spline(pts) {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const L = c.getLength();
  return {
    L, step: 0.6, pts,
    at: (s) => { const t = Math.min(1, Math.max(0, s / L)); const p = c.getPointAt(t); const d = c.getTangentAt(t); return { x: p.x, z: p.z, tx: d.x, tz: d.z }; },
  };
}
const W = (p, s, u) => { const f = p.at(s); return [f.x + f.tz * u, f.z - f.tx * u]; };

/* ------------------------------ geometry ops ------------------------------ */

const area = (P) => P.reduce((a, [x, y], i) => { const [x2, y2] = P[(i + 1) % P.length]; return a + x * y2 - x2 * y; }, 0) / 2;

/** Sweep a closed (u, y) profile along a path. */
function sweep(K, path, prof, key, { s0 = 0, s1 = path.L, smooth = false, caps = true, yfn = null, step } = {}) {
  if (s1 - s0 < 1e-3) return;
  const P = area(prof) < 0 ? [...prof].reverse() : prof;
  const n = Math.max(1, Math.ceil((s1 - s0) / (step ?? path.step)));
  const pos = [];
  const uv = [];
  const idx = [];
  const F = [];
  for (let i = 0; i <= n; i++) { const s = s0 + ((s1 - s0) * i) / n; F.push([s, path.at(s)]); }
  const vert = ([s, f], u, y) => {
    pos.push(f.x + f.tz * u, yfn ? yfn(s, u, y) : y, f.z - f.tx * u);
    uv.push(u + y * 0.5, s);
    return pos.length / 3 - 1;
  };
  const m = P.length;
  if (smooth) {
    const b0 = pos.length / 3;
    F.forEach((fr) => P.forEach(([u, y]) => vert(fr, u, y)));
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const a = b0 + i * m + j; const b = b0 + i * m + ((j + 1) % m); idx.push(a, b, b + m, a, b + m, a + m); }
  } else {
    for (let j = 0; j < m; j++) {
      const [u0, y0] = P[j];
      const [u1, y1] = P[(j + 1) % m];
      const b0 = pos.length / 3;
      F.forEach((fr) => { vert(fr, u0, y0); vert(fr, u1, y1); });
      for (let i = 0; i < n; i++) { const a = b0 + i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    }
  }
  if (caps) {
    const tris = THREE.ShapeUtils.triangulateShape(P.map(([u, y]) => V2(u, y)), []);
    for (const [fr, flip] of [[F[0], true], [F[n], false]]) {
      const b0 = pos.length / 3;
      P.forEach(([u, y]) => vert(fr, u, y));
      for (const t of tris) {
        let [a, b, c] = t;
        if (area([P[a], P[b], P[c]]) < 0) [b, c] = [c, b];
        if (flip) [b, c] = [c, b];
        idx.push(b0 + a, b0 + b, b0 + c);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  K.add(key, g);
}
const rect = (a, b, y0, y1) => [[Math.min(a, b), y0], [Math.max(a, b), y0], [Math.max(a, b), y1], [Math.min(a, b), y1]];
const band = (K, p, a, b, y0, y1, key, o) => sweep(K, p, rect(a, b, y0, y1), key, o);

/** Horizontal slab from a world (x, z) polygon. */
function slab(K, pts, y0, y1, key, holes = []) {
  const sh = new THREE.Shape(pts.map(([x, z]) => V2(x, -z)));
  holes.forEach((h) => sh.holes.push(new THREE.Path(h.map(([x, z]) => V2(x, -z)))));
  const g = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false, curveSegments: 4 });
  g.rotateX(-PI / 2);
  g.translate(0, y0, 0);
  K.add(key, g);
}
const box = (K, x0, x1, z0, z1, y0, y1, key) => slab(K, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y0, y1, key);
/** Wall-like slab: (z, y) side profile extruded along x from x0 to x1. */
function xslab(K, x0, x1, zy, key) {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(zy.map(([z, y]) => V2(-z, y))), { depth: x1 - x0, bevelEnabled: false, curveSegments: 12 });
  g.rotateY(PI / 2);
  g.translate(x0, 0, 0);
  K.add(key, g);
}
/** Rotate (yaw) + translate a local (x, z) polygon. */
const xf = (pts, x, z, yaw = 0) => pts.map(([a, b]) => [x + a * Math.cos(yaw) + b * Math.sin(yaw), z - a * Math.sin(yaw) + b * Math.cos(yaw)]);
const circle = (cx, cz, r, n = 48, a0 = 0, a1 = 2 * PI) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(a0 + ((a1 - a0) * i) / n), cz + r * Math.sin(a0 + ((a1 - a0) * i) / n)]);
const arcPts = (cx, cz, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos(a0 + ((a1 - a0) * i) / n), cz + r * Math.sin(a0 + ((a1 - a0) * i) / n)]);
function blob(cx, cz, rx, rz, r, n = 14) {
  const ph = r() * 6;
  return Array.from({ length: n }, (_, i) => { const a = (i / n) * 2 * PI; const k = 1 + 0.22 * Math.sin(2 * a + ph) + 0.12 * Math.sin(3 * a + ph * 2) + (r() - 0.5) * 0.15; return [cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k]; });
}
/** Place a geometry (built around its own origin) at (x, y, z) with yaw. */
const put = (g, x, y, z, yaw = 0) => g.rotateY(yaw).translate(x, y, z);

/* -------------------------------- paint -------------------------------- */

function paintLine(K, p, u, w, key = 'paint', { dash = 0, gap = 0, s0 = 0, s1 = p.L, phase = 0, yb = 0 } = {}) {
  const prof = rect(u - w / 2, u + w / 2, yb + AY - 0.008, yb + PY);
  const fade = K.T.fade;
  if (!dash) {
    if (!fade) return sweep(K, p, prof, key, { s0, s1 });
    for (let s = s0; s < s1; s += 1.5) if (K.r() > fade * 0.45) sweep(K, p, prof, key, { s0: s, s1: Math.min(s1, s + 1.5 - K.r() * 0.6) });
    return;
  }
  for (let s = s0 + phase; s < s1; s += dash + gap) {
    const a = Math.max(s0, s);
    const b = Math.min(s1, s + dash);
    if (b - a > 0.05 && !(fade && K.r() < fade * 0.4)) sweep(K, p, prof, key, { s0: a, s1: b });
  }
}
const paintPoly = (K, pts, key = 'paint', yb = 0) => slab(K, pts, yb + AY - 0.008, yb + PY, key);
const ARROW = [[-0.13, 0], [0.13, 0], [0.13, 3], [0.5, 2.9], [0, 4.6], [-0.5, 2.9], [-0.13, 3]];
const arrow = (K, x, z, yaw, yb = 0) => paintPoly(K, xf(ARROW, x, z, yaw).map(([a, b]) => [a, b]), 'paint', yb);
function decal(K, name, x, z, w, l, yaw = 0, yb = 0) {
  if (typeof document === 'undefined') return;
  const g = new THREE.PlaneGeometry(w, l).rotateX(-PI / 2);
  K.add(`decal:${name}`, put(g, x, yb + PY + 0.002, z, yaw));
}
function studs(K, p, u, { s0 = 0, s1 = p.L, yb = 0 } = {}) {
  for (let s = s0 + 1; s < s1; s += 6) {
    const [x, z] = W(p, s, u);
    const f = p.at(s);
    K.add('white', put(roundedBox(0.1, 0.03, 0.16, 0.012), x, yb + AY + 0.012, z, Math.atan2(f.tx, f.tz)));
  }
}

/* -------------------------------- props -------------------------------- */

/** Streetlight (separate mesh from y = 0): arm points along local +x. */
function streetlight(K, x, z, yaw, { h = 8, style = K.T.lstyle, double = false, base = 0 } = {}) {
  const g = group('streetlight', { parent: K.root, at: [x, 0, z] });
  g.rotation.y = yaw;
  const parts = new Map();
  const add = (k, geo) => { if (!parts.has(k)) parts.set(k, []); parts.get(k).push(geo); };
  const poleK = style === 'wood' ? 'wood' : style === 'lantern' ? 'black' : 'galv';
  const heads = [];
  if (style === 'lantern') {
    const top = base + 4.2;
    add(poleK, new THREE.CylinderGeometry(0.06, 0.09, top, 12, Math.ceil(top / 0.4)).translate(0, top / 2, 0));
    add(poleK, lathe([[0.001, base], [0.2, base], [0.2, base + 0.15], [0.12, base + 0.3], [0.1, base + 0.9], [0.001, base + 0.9]], 16));
    add(poleK, lathe([[0.001, top - 0.05], [0.12, top], [0.2, top + 0.55], [0.26, top + 0.62], [0.06, top + 0.85], [0.001, top + 0.9]], 8));
    heads.push({ at: [0, top + 0.3, 0.15], normal: [0, 0, 1], w: 0.22, h: 0.4 });
    heads.push({ at: [0, top + 0.3, -0.15], normal: [0, 0, -1], w: 0.22, h: 0.4 });
  } else {
    const top = base + h;
    add(poleK, new THREE.CylinderGeometry(style === 'wood' ? 0.11 : 0.065, style === 'wood' ? 0.14 : 0.11, top, 14, Math.ceil(top / 0.5)).translate(0, top / 2, 0));
    if (style !== 'wood') add(poleK, lathe([[0.001, base], [0.22, base], [0.22, base + 0.12], [0.13, base + 0.5], [0.001, base + 0.5]], 16));
    const arm = style === 'modern' ? 0.9 : style === 'wood' ? 1.1 : 1.8;
    for (const d of double ? [1, -1] : [1]) {
      if (style === 'modern') {
        add(poleK, new THREE.CylinderGeometry(0.04, 0.04, arm, 8).rotateZ(PI / 2).translate((d * arm) / 2, top - 0.05, 0));
        add(poleK, roundedBox(0.75, 0.08, 0.32, 0.03).translate(d * (arm + 0.3), top - 0.05, 0));
        heads.push({ at: [d * (arm + 0.3), top - 0.09, 0], normal: [0, -1, 0], w: 0.6, h: 0.22 });
      } else {
        const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, top - 0.9, 0), new THREE.Vector3(0, top + 0.05, 0), new THREE.Vector3(d * arm, top + 0.05, 0));
        add(poleK, new THREE.TubeGeometry(c, 12, style === 'wood' ? 0.05 : 0.045, 8));
        const head = lathe([[0.001, -0.07], [0.16, -0.07], [0.2, 0], [0.12, 0.08], [0.001, 0.1]], 16).scale(2.1, 1, 1).translate(d * (arm + 0.3), top + 0.05, 0);
        add('galv', head);
        heads.push({ at: [d * (arm + 0.3), top - 0.02, 0], normal: [0, -1, 0], w: 0.5, h: 0.24 });
      }
    }
  }
  multi(K, 'streetlight-pole', parts, g);
  const lg = K.lamp('streetlights', K.T.lamp);
  for (const hd of heads) lg.add(g, { ...hd, depth: 0.03, bezel: style !== 'lantern' });
  // light pool on the ground (additive, invisible until lit)
  K.poolMat ??= new THREE.MeshBasicMaterial({ name: 'light_pool', color: K.T.lamp === 'white' ? '#cfe4ff' : '#ffc070', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, map: poolTex() });
  const lx = style === 'lantern' ? 0 : style === 'modern' ? 1.2 : 2.1;
  for (const d of double ? [1, -1] : [1]) {
    const pool = new THREE.Mesh(new THREE.CircleGeometry(style === 'lantern' ? 3 : 5.5, 32).rotateX(-PI / 2), K.poolMat);
    pool.position.set(d * lx, base + PY + 0.02, 0);
    pool.userData.noShadow = true;
    pool.name = K.poolNamed ? 'light_pool_n' : 'light_pool';
    K.poolNamed = true;
    g.add(pool);
  }
  return g;
}
function poolTex() {
  return ctex('pool', 1, (g, px) => { const gr = g.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, px, px); }, 128);
}
/** Light at path station s, lateral u, arm pointing back across the road. */
function lightAt(K, p, s, u, o = {}) {
  const [x, z] = W(p, s, u);
  const f = p.at(s);
  const sg = Math.sign(u) || 1;
  return streetlight(K, x, z, Math.atan2(-sg * f.tx, -sg * f.tz) + (o.flip ? PI : 0), o);
}

function tree(K, x, z, s = 1, y0 = 0) {
  const r = K.r;
  K.add('bark', new THREE.CylinderGeometry(0.08 * s, 0.14 * s, 3.2 * s, 8, 4).translate(x, y0 + 1.6 * s, z));
  for (let i = 0; i < 4; i++) {
    const g = jitter(new THREE.IcosahedronGeometry((0.95 + r() * 0.4) * s, 1), r, 0.12);
    const a = i * 2.1 + r();
    g.translate(x + (i ? Math.cos(a) * 0.6 * s : 0), y0 + (i ? 3.3 + r() * 0.6 : 4.0) * s, z + (i ? Math.sin(a) * 0.6 * s : 0));
    K.add('leaf', g);
  }
}
function shrub(K, x, z, s = 0.6, y0 = GY) {
  const g = jitter(new THREE.IcosahedronGeometry(s, 1), K.r, 0.18);
  g.scale(1, 0.75, 1).translate(x, Math.max(y0 + s * 0.5, s * 0.9), z);
  K.add('leaf', g);
}
function bollard(K, x, z, y0 = SY) {
  K.add('black', lathe([[0.001, 0], [0.1, 0], [0.1, y0 + 0.75], [0.11, y0 + 0.8], [0.07, y0 + 0.95], [0.001, y0 + 0.97]], 14).translate(x, 0, z));
  K.add('white', new THREE.CylinderGeometry(0.103, 0.103, 0.06, 14).translate(x, y0 + 0.62, z));
}
function delineator(K, x, z, yaw) {
  K.add('white', put(roundedBox(0.12, 1.05, 0.12, 0.02), x, 0.525, z, yaw));
  K.add('black', put(roundedBox(0.126, 0.22, 0.126, 0.02), x, 0.82, z, yaw));
  K.add('amber', put(roundedBox(0.04, 0.12, 0.13, 0.01), x, 0.82, z, yaw));
}
function rock(K, x, z, s) {
  const g = jitter(new THREE.DodecahedronGeometry(s, 0), K.r, 0.3);
  g.scale(1, 0.6, 1).translate(x, s * 0.62, z);
  K.add('stone', g);
}
/** W-beam guard rail along a path at lateral u (posts every 2 m). */
function guardRail(K, p, u, { s0 = 0, s1 = p.L, yb = 0 } = {}) {
  const sg = Math.sign(u);
  for (let s = s0 + 0.5; s < s1; s += 2) {
    const [x, z] = W(p, s, u + sg * 0.08);
    const f = p.at(s);
    K.add('galv', put(roundedBox(0.15, 0.78 + yb, 0.1, 0.015), x, (0.78 + yb) / 2, z, Math.atan2(f.tx, f.tz)));
  }
  const w = [[0, 0.45], [0.06, 0.5], [0, 0.6], [0.06, 0.7], [0, 0.78], [0.015, 0.78], [0.075, 0.7], [0.015, 0.6], [0.075, 0.5], [0.015, 0.45]];
  sweep(K, p, w.map(([a, y]) => [u - sg * a, y + yb]), 'galv', { s0, s1 });
}
const JERSEY = [[-0.3, 0], [0.3, 0], [0.3, 0.08], [0.1, 0.33], [0.08, 0.82], [-0.08, 0.82], [-0.1, 0.33], [-0.3, 0.08]];
const jersey = (K, p, u, o = {}) => sweep(K, p, JERSEY.map(([a, y]) => [u + a, y + (o.yb ?? 0)]), 'concrete', o);
/** Wooden post-and-rail fence along a path. */
function fence(K, p, u, { s0 = 0, s1 = p.L } = {}) {
  for (let s = s0 + 0.3; s < s1; s += 2.4) { const [x, z] = W(p, s, u); K.add('wood', new THREE.CylinderGeometry(0.06, 0.07, 1.2, 7).translate(x, 0.6, z)); }
  for (const y of [0.5, 0.95]) sweep(K, p, rect(u - 0.03, u + 0.03, y, y + 0.1), 'wood', { s0, s1 });
}
function signPost(K, x, z, yaw, key = 'sign') {
  K.add('galv', new THREE.CylinderGeometry(0.035, 0.035, 2.6, 8, 6).translate(x, 1.3, z));
  K.add(key, put(roundedBox(0.6, 0.6, 0.03, 0.04), x, 2.35, z, yaw).translate(0, 0, 0));
}

/* ---------------------------- street sections ---------------------------- */

/** Kerb + sidewalk (or verge) bands on one side (sd = ±1) of a path, from |u| = hr out to `outer`. */
function edge(K, p, sd, hr, outer, { s0 = 0, s1 = p.L, yb = 0 } = {}) {
  const T = K.T;
  const o = { s0, s1 };
  if (T.edge === 'curb') {
    const prof = [[hr, yb], [hr + CW, yb], [hr + CW, yb + SY], [hr + 0.035, yb + SY], [hr, yb + SY - 0.035]];
    sweep(K, p, prof.map(([u, y]) => [sd * u, y]), 'curb', o);
    if (T.walk === 'lawn' && outer - hr > 2.2) {
      band(K, p, sd * (hr + CW), sd * (hr + 1.3), yb, yb + SY - 0.02, 'grass', o);
      band(K, p, sd * (hr + 1.3), sd * outer, yb, yb + SY, 'conc', o);
    } else band(K, p, sd * (hr + CW), sd * outer, yb, yb + SY, T.walk === 'pavers' ? 'pavers' : 'conc', o);
  } else {
    band(K, p, sd * hr, sd * Math.min(outer, hr + 0.7), yb, yb + AY - 0.004, 'gravel', o);
    if (yb) band(K, p, sd * (hr + 0.7), sd * outer, yb, yb + GY, 'grass', o);
  }
}
/** Weather / wear overlays on a carriageway between lateral offsets ua..ub. */
function weather(K, p, ua, ub, { s0 = 0, s1 = p.L, yb = 0, lanes, banks = [ua, ub] } = {}) {
  const T = K.T;
  const r = K.r;
  const L = s1 - s0;
  const rs = () => s0 + 0.6 + r() * (L - 1.2);
  const ru = (m = 0.4) => ua + m + r() * (ub - ua - 2 * m);
  if (T.cracks) {
    for (let i = 0; i < Math.ceil(L / 5); i++) {
      const s = rs();
      const u = ru();
      const pts = [];
      let a = r() * PI * 2;
      let [x, z] = W(p, s, u);
      for (let k = 0; k < 6; k++) { pts.push([x, z]); a += (r() - 0.5) * 1.2; x += Math.cos(a) * 0.5; z += Math.sin(a) * 0.5; }
      sweep(K, spline(pts), rect(-0.012, 0.012, yb + AY - 0.004, yb + PY + 0.001), 'crack', { caps: false });
    }
    for (let i = 0; i < Math.max(1, Math.round(L / 10)); i++) { const s = rs(); const u = ru(1); sweep(K, p, rect(u - 0.6 - r(), u + 0.6, yb + AY - 0.004, yb + AY + 0.003), 'patch', { s0: Math.max(s0, s - 1), s1: Math.min(s1, s + 0.6 + r()) }); }
  }
  if (T.potholes) {
    for (let i = 0; i < Math.max(1, Math.round(L / 9)); i++) { const [x, z] = W(p, rs(), ru(0.8)); slab(K, blob(x, z, 0.3 + r() * 0.3, 0.25 + r() * 0.25, r), yb + AY - 0.004, yb + AY + 0.002, 'hole'); }
  }
  if (T.puddles) {
    for (let i = 0; i < Math.ceil(L / 4); i++) { const [x, z] = W(p, rs(), r() < 0.6 ? (r() < 0.5 ? ua + 0.5 : ub - 0.5) : ru(0.6)); slab(K, blob(x, z, 0.5 + r() * 0.8, 0.35 + r() * 0.5, r), yb + AY - 0.004, yb + AY + 0.004, 'puddle'); }
  }
  if (T.snow) {
    const lc = lanes ?? [];
    if (!lanes) for (let u = ua + 1.75; u < ub; u += 3.5) lc.push(u);
    const bare = lc.flatMap((c) => [[c - 1.05, c - 0.55], [c + 0.55, c + 1.05]]).sort((a, b) => a[0] - b[0]);
    let u0 = ua;
    const noise = (s, u, y) => (y > yb + AY ? y + 0.012 * Math.sin(s * 2.1 + u * 3.3) + 0.008 * Math.sin(s * 5.7 - u * 1.9) : y);
    const snowBand = (a, b) => { if (b - a > 0.05) sweep(K, p, rect(a, b, yb + AY - 0.005, yb + AY + 0.028), 'snow', { s0, s1, yfn: noise, step: 0.5 }); };
    for (const [a, b] of bare) { snowBand(u0, Math.max(u0, a)); u0 = Math.max(u0, b); }
    snowBand(u0, ub);
    for (const u of banks) {
      const sg = u > (ua + ub) / 2 ? 1 : -1;
      const prof = Array.from({ length: 9 }, (_, i) => { const t = (i / 8) * PI; return [u - sg * (0.45 + 0.45 * Math.cos(t)) + sg * 0.02, yb + AY - 0.004 + Math.sin(t) * 0.32]; });
      sweep(K, p, prof, 'snow', { s0, s1, smooth: true, step: 0.4, yfn: (s, uu, y) => yb + AY - 0.004 + (y - yb - AY + 0.004) * (1 + 0.35 * Math.sin(s * 1.7 + uu) + 0.2 * Math.sin(s * 4.3)) });
    }
  }
}
/** Furniture along a 2-lane street: lights, trees, posts, drains, bollards. */
function furnish(K, p, hr, { sides = [1, -1], s0 = 0, s1 = p.L, lights = K.T.lights, drains = true } = {}) {
  const T = K.T;
  const L = s1 - s0;
  const n = Math.max(1, Math.round(L / 12));
  const curb = T.edge === 'curb';
  for (let i = 0; i < n; i++) {
    const sa = s0 + (L * (i + 0.25)) / n;
    const sb = s0 + (L * (i + 0.75)) / n;
    sides.forEach((sd, k) => {
      if (lights) lightAt(K, p, k ? sb : sa, sd * (hr + (curb ? 0.55 : 1.4)));
      const st = k ? sa : sb;
      if (T.trees && curb) {
        const u = sd * (hr + (T.walk === 'lawn' ? 0.72 : 0.95));
        const [x, z] = W(p, st, u);
        if (T.trees === 'pit') { const f = p.at(st); slab(K, xf([[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]], x, z, Math.atan2(f.tx, f.tz)), 0, SY + 0.006, 'metal'); }
        tree(K, x, z, 1);
      }
      if (T.posts && !curb) for (const s of [sa, sb]) { const [x, z] = W(p, s, sd * (hr + 1.1)); delineator(K, x, z, 0); }
      if (T.bollards && curb) { const [x, z] = W(p, st + 2.5, sd * (hr + 0.45)); bollard(K, x, z); }
      if (drains && curb && i === 0 && k === 0) {
        const [x, z] = W(p, s0 + L / 2, sd * (hr - 0.22));
        const f = p.at(s0 + L / 2);
        const yaw = Math.atan2(f.tx, f.tz);
        K.add('metal', put(roundedBox(0.42, 0.03, 0.9, 0.01), x, AY + 0.001, z, yaw));
        for (let j = 0; j < 6; j++) K.add('black', put(new THREE.BoxGeometry(0.32, 0.012, 0.04), x, AY + 0.015, z, yaw).translate(...rotXZ(0, -0.32 + j * 0.13, yaw)));
      }
    });
  }
  if (T.manholes) { const [x, z] = W(p, s0 + L * 0.4, 1.75 * K.H); slab(K, circle(x, z, 0.33, 24), AY - 0.004, AY + 0.006, 'metal'); }
}
const rotXZ = (a, b, yaw) => [a * Math.cos(yaw) + b * Math.sin(yaw), 0, -a * Math.sin(yaw) + b * Math.cos(yaw)];

/** Standard 2-lane centre line (yellow dashed / double for RHT, white dashed for LHT). */
function centre(K, p, o = {}) {
  const T = K.T;
  if (T.H > 0) {
    if (T.edge === 'verge') { paintLine(K, p, -0.1, 0.1, 'yellow', o); paintLine(K, p, 0.1, 0.1, 'yellow', o); }
    else paintLine(K, p, 0, 0.12, 'yellow', { dash: 3, gap: 9, phase: 1.5, ...o });
  } else paintLine(K, p, 0, 0.12, 'paint', { dash: 4, gap: 8, phase: 1, ...o });
  if (T.studs) studs(K, p, 0, o);
}
/** Asphalt + edges + overlays for a standard street on a path. */
function street(K, p, { hr = HR, sides = [1, -1], outer = 6, s0 = 0, s1 = p.L, yb = 0, wear = true } = {}) {
  band(K, p, -hr, hr, yb, yb + AY, 'asphalt', { s0, s1 });
  sides.forEach((sd) => edge(K, p, sd, hr, outer, { s0, s1, yb }));
  if (K.T.edge !== 'curb') sides.forEach((sd) => paintLine(K, p, sd * (hr - 0.2), 0.12, 'paint', { s0, s1, yb }));
  if (wear) weather(K, p, -hr, hr, { s0, s1, yb, banks: sides.map((sd) => sd * hr) });
}

/** Kerbed corner block for junctions (quadrant sx, sz), inner corner radius rc. */
function corner(K, sx, sz, { half = 6, hr = HR, rc = 2 } = {}) {
  const shape = (d) => {
    const e = hr + d;
    const pts = [[half, half], [half, e], ...arcPts(hr + rc, hr + rc, rc - d, -PI / 2, -PI, 8), [e, half]];
    return pts.map(([x, z]) => [x * sx, z * sz]);
  };
  slab(K, shape(0), 0, SY, 'curb');
  slab(K, shape(CW), 0, SY + 0.004, K.T.walk === 'pavers' ? 'pavers' : 'conc');
}
/** Paint rectangle in an arm-local frame (arm k points along +z rotated by k·90°). */
const armRect = (K, k, x0, x1, z0, z1, key = 'paint') => paintPoly(K, xf([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], 0, 0, (k * PI) / 2), key);
/** Stop line (RHT) or give-way double dashes (LHT) for traffic approaching along arm k. */
function stopLine(K, k, z, hr = HR) {
  const H = K.H;
  const a = H > 0 ? 0.15 : -hr + 0.15;
  const b = H > 0 ? hr - 0.15 : -0.15;
  if (H > 0) armRect(K, k, a, b, z, z + 0.4);
  else for (const dz of [0, 0.45]) for (let x = a; x < b - 0.2; x += 0.9) armRect(K, k, x, Math.min(b, x + 0.6), z + dz, z + dz + 0.2);
}
function zebra(K, k, z0, z1, hr = HR) {
  for (let x = -hr + 0.35; x < hr - 0.3; x += 1.0) armRect(K, k, x, x + 0.5, z0, z1);
}

/* -------------------------------- pieces -------------------------------- */

function base(K, w, l, key = K.T.fill) {
  box(K, -w / 2, w / 2, -l / 2, l / 2, 0, key === 'grass' || key === 'water' ? GY : GY + 0.001, key === 'pavers' && K.T.edge !== 'curb' ? 'grass' : key);
}

function pStraight(K) {
  base(K, 12, 12);
  const p = line(0, -6, 0, 6);
  street(K, p);
  centre(K, p);
  furnish(K, p, HR);
}

function pCurve(K, N) {
  const S = 12 * N;
  const c = S / 2;
  const R = S - 6;
  base(K, S, S);
  const p = arc(c, -c, R, PI, PI / 2);
  street(K, p, { outer: HR + 2.5 });
  if (K.T.edge === 'curb') {
    const fill = K.T.fill;
    if (R > HR + 2.6) band(K, p, HR + 2.5, R, 0, SY - 0.01, fill);
    const ro = R + HR + 2.5;
    if (ro < S - 0.05) slab(K, [[c - ro, -c], [-c, -c], [-c, c], [c, c], ...arcPts(c, -c, ro, PI / 2, PI, Math.ceil(ro)).slice(0, -1)], 0, SY - 0.01, fill);
  }
  centre(K, p);
  furnish(K, p, HR, { drains: true });
  if (K.T.H !== 0 && N > 1) { // curve warning chevrons on the outside
    for (let s = p.L * 0.3; s < p.L * 0.75; s += p.L / 6) {
      const [x, z] = W(p, s, -(HR + 1.2));
      const f = p.at(s);
      const yaw = Math.atan2(f.tx, f.tz) + PI / 2;
      K.add('galv', new THREE.CylinderGeometry(0.035, 0.035, 1.6, 8, 4).translate(x, 0.8, z));
      K.add('amber', put(roundedBox(0.5, 0.6, 0.03, 0.03), x, 1.35, z, yaw));
    }
  }
}

function pT(K) {
  const T = K.T;
  base(K, 12, 12);
  const p = line(-6, 0, 6, 0); // +u = -z
  band(K, p, -HR, HR, 0, AY, 'asphalt');
  if (T.edge === 'curb') box(K, -6, 6, HR - 0.05, 6, 0, AY, 'asphalt');
  else box(K, -HR, HR, HR - 0.05, 6, 0, AY, 'asphalt');
  const stub = line(0, 6, 0, HR);
  if (T.edge === 'curb') { edge(K, p, 1, HR, 6); corner(K, 1, 1); corner(K, -1, 1); }
  else {
    edge(K, p, 1, HR, 6);
    edge(K, p, -1, HR, 6, { s1: 6 - HR });
    edge(K, p, -1, HR, 6, { s0: 6 + HR });
    for (const sd of [1, -1]) { edge(K, stub, sd, HR, 6); paintLine(K, stub, sd * (HR - 0.2), 0.12); }
    paintLine(K, p, HR - 0.2, 0.12);
    paintLine(K, p, -(HR - 0.2), 0.12, 'paint', { s1: 6 - HR });
    paintLine(K, p, -(HR - 0.2), 0.12, 'paint', { s0: 6 + HR });
  }
  centre(K, p, { s1: 6 - HR - 0.6 });
  centre(K, p, { s0: 6 + HR + 0.6 });
  stopLine(K, 0, HR + 0.5);
  weather(K, p, -HR, HR, { banks: [HR] });
  furnish(K, p, HR, { sides: [1] });
}

function pCross(K) {
  const T = K.T;
  base(K, 12, 12);
  if (T.edge === 'curb') box(K, -6, 6, -6, 6, 0, AY, 'asphalt');
  else { box(K, -6, 6, -HR, HR, 0, AY, 'asphalt'); box(K, -HR, HR, -6, 6, 0, AY, 'asphalt'); }
  for (let k = 0; k < 4; k++) {
    if (T.edge === 'curb') { zebra(K, k, HR + 0.3, HR + 1.9); stopLine(K, k, HR + 2.1); }
    else stopLine(K, k, HR + 0.5);
  }
  if (T.edge === 'curb') { for (const sx of [1, -1]) for (const sz of [1, -1]) corner(K, sx, sz); }
  else {
    for (let k = 0; k < 4; k++) {
      const yaw = (k * PI) / 2;
      const [x0, z0] = xf([[0, 6]], 0, 0, yaw)[0];
      const [x1, z1] = xf([[0, HR]], 0, 0, yaw)[0];
      const arm = line(x0, z0, x1, z1);
      for (const sd of [1, -1]) { edge(K, arm, sd, HR, 6); paintLine(K, arm, sd * (HR - 0.2), 0.12); }
    }
  }
  weather(K, line(-6, 0, 6, 0), -HR, HR, { banks: [] });
  if (T.lights) streetlight(K, 5.2, 5.2, (3 * PI) / 4);
  if (T.trees && T.edge === 'curb') tree(K, -5, -5, 0.9, 0);
  if (T.bollards) for (const [x, z] of [[4.1, 5.5], [5.5, 4.1], [-4.1, -5.5], [-5.5, -4.1]]) bollard(K, x, z);
}

function pRoundabout(K) {
  const T = K.T;
  const H = K.H;
  const RI = 7.5;
  const RO = 14.5;
  base(K, 36, 36);
  slab(K, circle(0, 0, RO, 72), 0, AY, 'asphalt', [circle(0, 0, RI - 0.1, 48).reverse()]);
  for (let k = 0; k < 4; k++) slab(K, xf([[-HR, 12], [HR, 12], [HR, 18], [-HR, 18]], 0, 0, (k * PI) / 2), 0, AY, 'asphalt');
  // island: truck apron, kerb ring, grass mound and centrepiece
  slab(K, circle(0, 0, RI, 48), 0, AY + 0.04, 'stone', [circle(0, 0, 6.15, 40).reverse()]);
  K.add('curb', lathe([[6.0, 0], [6.2, 0], [6.2, SY], [6.0, SY]], 48));
  K.add(T.walk === 'pavers' ? 'pavers' : 'grass', lathe([[0.001, 0.9], [2.5, 0.8], [4.5, 0.55], [6.0, SY + 0.02], [6.0, 0], [0.001, 0]].reverse(), 48));
  if (T.walk === 'pavers') {
    K.add('concrete', roundedBox(1.6, 1.0, 1.6, 0.08).translate(0, 1.3, 0));
    K.add('steelpaint', new THREE.TorusGeometry(1.4, 0.16, 12, 40).translate(0, 3.2, 0));
    K.add('steelpaint', new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8).translate(0, 2.0, 0));
  } else if (T.edge === 'verge') { rock(K, 0.6, 0.2, 1.0); rock(K, -0.7, -0.4, 0.8); K.add('stone', new THREE.DodecahedronGeometry(0.7, 0).translate(0, 0.9, 0.2)); }
  else tree(K, 0, 0, 1.2, 0.6);
  for (let a = 0; a < 6; a++) shrub(K, Math.cos(a) * 4.3, Math.sin(a) * 4.3, 0.5, 0.5);
  // lane divider + outer edge
  const ring = arc(0, 0, 11, 0, 2 * PI);
  paintLine(K, ring, 0, 0.12, 'paint', { dash: 2, gap: 3 });
  if (T.edge !== 'curb') { paintLine(K, arc(0, 0, RO - 0.25, 0, 2 * PI), 0, 0.12); paintLine(K, arc(0, 0, RI + 0.25, 0, 2 * PI), 0, 0.12); }
  // circulation arrows: RHT anticlockwise from above (island on the driver's left), LHT clockwise
  const d = H > 0 ? -1 : 1;
  for (let k = 0; k < 4; k++) {
    const a = PI / 4 + (k * PI) / 2;
    for (const rr of [9.25, 12.75]) arrow(K, rr * Math.cos(a), rr * Math.sin(a), Math.atan2(-Math.sin(a) * d, Math.cos(a) * d) + PI, 0);
  }
  for (let k = 0; k < 4; k++) {
    const yaw = (k * PI) / 2;
    // splitter island
    const isl = (dd) => xf([[-0.25 + dd, 15 + dd], [0.25 - dd, 15 + dd], [1.2 - dd, 18], [-1.2 + dd, 18]], 0, 0, yaw);
    slab(K, isl(0), 0, SY, 'curb');
    slab(K, isl(0.12), 0, SY + 0.004, T.walk === 'pavers' ? 'pavers' : 'grass');
    // give-way dashes on the entry lane (driver's side) and entry arrow
    for (let x = 1.4; x < HR - 0.2; x += 0.9) paintPoly(K, xf([[H * x, 14.55], [H * (x + 0.5), 14.55], [H * (x + 0.5), 14.85], [H * x, 14.85]], 0, 0, yaw));
    arrow(K, ...xf([[H * 2.3, 17.8]], 0, 0, yaw)[0], yaw + PI);
    if (T.edge === 'verge') {
      const [x0, z0] = xf([[0, 18]], 0, 0, yaw)[0];
      const [x1, z1] = xf([[0, 13.8]], 0, 0, yaw)[0];
      const arm = line(x0, z0, x1, z1);
      for (const sd of [1, -1]) { edge(K, arm, sd, HR, 6); paintLine(K, arm, sd * (HR - 0.2), 0.12); }
    }
  }
  if (T.edge === 'curb') {
    for (let k = 0; k < 4; k++) {
      const sx = k & 1 ? -1 : 1;
      const sz = k & 2 ? -1 : 1;
      const shape = (dd) => {
        const e = HR + dd;
        const rr = RO + dd;
        const t1 = Math.asin(e / rr);
        return [[e, 18], [18, 18], [18, e], ...arcPts(0, 0, rr, t1, PI / 2 - t1, 16), [e, 18]].slice(0, -1).map(([x, z]) => [x * sx, z * sz]);
      };
      slab(K, shape(0), 0, SY, 'curb');
      slab(K, shape(CW), 0, SY + 0.004, T.walk === 'pavers' ? 'pavers' : T.walk === 'lawn' ? 'grass' : 'conc');
      if (T.trees) tree(K, sx * 15, sz * 15, 1);
    }
  }
  weather(K, ring, -HR, HR, { banks: [] });
  for (let k = 0; k < 4; k++) { const a = PI / 4 + (k * PI) / 2; streetlight(K, 16.3 * Math.cos(a), 16.3 * Math.sin(a), Math.atan2(Math.sin(a), -Math.cos(a))); }
}

/** Divided highway (n lanes per direction) along z, centred at x = xc. `rampSide` skips that outer edge. */
function highway(K, { W: Wd, n, L, xc = 0, rampSide = 0 }) {
  const T = K.T;
  const H = K.H;
  const p = line(xc, -L / 2, xc, L / 2); // +u = +x
  const med = n === 1 ? 0.45 : 0.9;
  const ins = med + (n === 1 ? 0.45 : 1.0);
  const out = ins + n * 3.6;
  const osh = Math.max(0.6, Math.min(2.5, Wd / 2 - out - 1.0));
  const eo = out + osh;
  band(K, p, -eo, eo, 0, AY, 'asphalt');
  jersey(K, p, 0);
  if (T.studs) { studs(K, p, ins - 0.35); studs(K, p, -ins + 0.35); }
  for (const sd of [1, -1]) {
    const fwd = sd === -H ? 1 : -1; // carriageway travel direction (+z or -z)
    paintLine(K, p, sd * (ins - 0.12), 0.15, H > 0 ? 'yellow' : 'paint');
    for (let k = 1; k < n; k++) paintLine(K, p, sd * (ins + k * 3.6), 0.15, 'paint', { dash: 3, gap: 9, phase: 4.5 });
    if (sd !== rampSide) {
      paintLine(K, p, sd * (out + 0.1), 0.2);
      if (T.studs) for (let s = 1; s < L; s += 1.2) { const [x, z] = W(p, s, sd * (out + 0.7)); K.add('paint', put(new THREE.BoxGeometry(0.6, 0.012, 0.15), x, AY + 0.003, z)); }
      if (T.walk === 'pavers') { guardRail(K, p, sd * (eo + 0.35)); sweep(K, p, rect(sd * (Wd / 2 - 0.5), sd * (Wd / 2 - 0.25), 0, 4), 'concrete'); }
      else if (T.edge === 'verge') { guardRail(K, p, sd * (eo + 0.35)); fence(K, p, sd * (Wd / 2 - 0.25)); }
      else guardRail(K, p, sd * (eo + 0.35));
      if (T.trees && Wd / 2 - eo > 2.5) for (let s = 3; s < L; s += 8) { const [x, z] = W(p, s, sd * (Wd / 2 - 1.1)); tree(K, x, z, 0.9); }
    }
    for (let k = 0; k < n; k++) {
      const u = sd * (ins + 1.8 + k * 3.6);
      for (const zz of [-L / 4, L / 4]) arrow(K, xc + u, zz - fwd * 2.3, fwd > 0 ? 0 : PI);
    }
    const lc = Array.from({ length: n }, (_, k) => ins + 1.8 + k * 3.6);
    if (sd > 0) weather(K, p, ins - 0.3, eo, { lanes: lc, banks: [ins - 0.3, eo] });
    else weather(K, p, -eo, -ins + 0.3, { lanes: lc.map((u) => -u), banks: [-eo, -ins + 0.3] });
  }
  if (T.lights) streetlight(K, xc, 0, 0, { h: 10, double: true, style: 'modern' });
  return { p, ins, out, eo };
}

function pHighway(K, n) {
  const Wd = 12 * n;
  base(K, Wd, 24);
  highway(K, { W: Wd, n, L: 24 });
}

function pRamp(K, off) {
  const X = -K.H; // ramp joins the outer edge of the +z carriageway
  base(K, 36, 36);
  const hw = highway(K, { W: 24, n: 2, L: 36, xc: -6 * X, rampSide: X });
  const edgeX = -6 + hw.out; // outer lane edge (X frame)
  const lane = edgeX + 1.8;
  const zf = (z) => (off ? -z : z);
  let pts = [[14.5, -18], [14.2, -12], [12, -6], [8, -1], [lane, 4], [lane, 6]].map(([x, z]) => [x * X, zf(z)]);
  if (off) pts = pts.reverse();
  const rp = spline(pts); // heading +z; +u = +x world
  const ou = X; // outer side sign in path frame
  band(K, rp, -1.8, 1.8, 0, AY, 'asphalt');
  band(K, rp, ou * 1.8, ou * 3.3, 0, AY, 'asphalt');
  band(K, rp, -ou * 1.8, -ou * 2.6, 0, AY, 'asphalt');
  paintLine(K, rp, ou * 1.9, 0.18);
  paintLine(K, rp, -ou * 1.9, 0.18, 'paint', off ? { s0: rp.L * 0.35 } : { s1: rp.L * 0.65 });
  guardRail(K, rp, ou * 3.65);
  // acceleration / deceleration lane taper
  const z0 = zf(6);
  const z1 = zf(18);
  slab(K, [[edgeX * X, z0], [(edgeX + 3.6) * X, z0], [(edgeX + 3.6) * X, z0 + (z1 - z0) * 0.2], [(edgeX + 0.2) * X, z1], [edgeX * X, z1]], 0, AY, 'asphalt');
  const taper = line((edgeX + 3.7) * X, z0, (edgeX + 0.25) * X, z1);
  paintLine(K, taper, 0, 0.2);
  const hp = line(edgeX * X, -18, edgeX * X, 18);
  paintLine(K, hp, 0.1 * X, 0.3, 'paint', { dash: 1, gap: 2, ...(off ? { s1: 18 } : { s0: 18 }) });
  paintLine(K, hp, 0.1 * X, 0.2, 'paint', off ? { s0: 18 } : { s1: 18 });
  guardRail(K, line((edgeX + 4.4) * X, zf(5) < zf(18) ? zf(5) : zf(18), (edgeX + 4.4) * X, zf(5) < zf(18) ? zf(18) : zf(5)), X * 0.01);
  // gore chevrons between the carriageway edge and the ramp
  const xr = (z) => { let best = pts[0]; for (let s = 0; s <= rp.L; s += 0.5) { const f = rp.at(s); if (Math.abs(f.z - z) < Math.abs(best[1] - z)) best = [f.x, f.z]; } return Math.abs(best[0]) - 2.0; };
  for (let z = -13; z < 1; z += 1.8) {
    const zz = zf(z);
    const a = edgeX + 0.25;
    const b = xr(zf(z + (off ? -1.2 : 1.2)));
    if (b - a > 0.5) sweep(K, line(a * X, zz, b * X, zf(z + 1.2)), rect(-0.15, 0.15, AY - 0.008, PY), 'paint');
  }
  arrow(K, ...W(rp, rp.L * (off ? 0.75 : 0.25), 0), Math.atan2(rp.at(rp.L * (off ? 0.75 : 0.25)).tx, rp.at(rp.L * (off ? 0.75 : 0.25)).tz));
  weather(K, rp, -1.8, 1.8, { banks: [] });
  if (K.T.lights || true) { const s = rp.L * 0.5; const [x, zz] = W(rp, s, ou * 4.6); const f = rp.at(s); streetlight(K, x, zz, Math.atan2(-ou * f.tx, -ou * f.tz), { h: 10, style: K.T.lstyle === 'wood' ? 'cobra' : K.T.lstyle }); }
}

function pOverpass(K) {
  const T = K.T;
  const D = 6.0; // deck slab bottom
  const Y = D + 0.55; // deck road base (asphalt sits on it)
  base(K, 12, 36);
  // road underneath, crossing along x
  const under = line(-6, 0, 6, 0);
  street(K, under, { outer: 6 });
  centre(K, under);
  // pier bents
  for (const z of [-11.5, 11.5]) {
    for (const x of [-4.2, 4.2]) K.add('concrete', new THREE.CylinderGeometry(0.6, 0.7, D - 0.8, 20, 6).translate(x, (D - 0.8) / 2, z));
    K.add('concrete', roundedBox(11.2, 0.9, 1.5, 0.12).translate(0, D - 0.8 - 0.35, z));
    K.add('concrete', roundedBox(1.8, 0.25, 1.8, 0.05).translate(-4.2, 0.12, z));
    K.add('concrete', roundedBox(1.8, 0.25, 1.8, 0.05).translate(4.2, 0.12, z));
  }
  for (const x of [-4, 0, 4]) K.add('steelpaint', roundedBox(0.5, 0.82, 36, 0.05, 1).translate(x, D - 0.4, 0));
  box(K, -6, 6, -18, 18, D, Y - 0.02, 'concrete');
  const p = line(0, -18, 0, 18);
  street(K, p, { outer: 5.6, yb: Y - AY + 0.0 });
  centre(K, p, { yb: Y - AY });
  for (const sd of [1, -1]) {
    sweep(K, p, [[5.6, Y - 0.1], [6.0, Y - 0.1], [6.0, Y + 1.0], [5.75, Y + 1.0], [5.6, Y + 0.3]].map(([u, y]) => [sd * u, y]), 'concrete');
    sweep(K, p, rect(sd * 5.82, sd * 5.92, Y + 1.0, Y + 1.25), 'galv');
  }
  // lights rise from the piers (poles run inside the columns)
  for (const z of [-11.5, 11.5]) streetlight(K, (z > 0 ? -1 : 1) * 4.4, z, z > 0 ? 0 : PI, { h: Y + 8, base: Y });
  if (T.trees) for (const z of [-15, 15]) for (const x of [-3.5, 3.5]) tree(K, x, z, 0.8);
}

function pBridge(K) {
  const T = K.T;
  const D = 7.5;
  const Y = D + 0.6;
  box(K, -6, 6, -18, 18, 0, GY, 'water');
  for (const z of [-12, 12]) {
    const pier = lathe([[0.001, 0], [1, 0], [1, D - 1.5], [1.2, D - 1.0], [1.2, D - 0.65], [0.001, D - 0.65]], 24).scale(5.2, 1, 1.4).translate(0, 0, z);
    K.add('concrete', pier);
  }
  for (const x of [-4.2, -1.4, 1.4, 4.2]) K.add('steelpaint', roundedBox(0.45, 0.66, 36, 0.05, 1).translate(x, D - 0.33, 0));
  box(K, -6, 6, -18, 18, D, Y - 0.02, 'concrete');
  const p = line(0, -18, 0, 18);
  street(K, p, { outer: 5.3, yb: Y - AY });
  centre(K, p, { yb: Y - AY });
  // tied steel arches with hangers and wind bracing
  const arch = (x) => Array.from({ length: 17 }, (_, i) => { const z = -17.5 + (35 * i) / 16; return [x, Y + 0.6 + 8 * (1 - (z / 17.5) ** 2), z]; });
  for (const sd of [1, -1]) {
    const x = sd * 5.75;
    sweep(K, p, rect(sd * 5.3, sd * 6.0, Y - 0.1, Y + 0.6), 'steelpaint');
    const c = new THREE.CatmullRomCurve3(arch(x).map((v) => new THREE.Vector3(...v)));
    K.add('steelpaint', new THREE.TubeGeometry(c, 64, 0.32, 10));
    for (let z = -14; z <= 14; z += 2) { const top = Y + 0.6 + 8 * (1 - (z / 17.5) ** 2); K.add('galv', new THREE.CylinderGeometry(0.04, 0.04, top - Y - 0.5, 6, 4).translate(x, (top + Y + 0.5) / 2, z)); }
    sweep(K, p, rect(sd * 5.28, sd * 5.33, Y, Y + 1.2), 'galv');
  }
  for (const z of [-6, 0, 6]) { const y = Y + 0.6 + 8 * (1 - (z / 17.5) ** 2); K.add('steelpaint', new THREE.CylinderGeometry(0.16, 0.16, 11.5, 8).rotateZ(PI / 2).translate(0, y, z)); }
  for (const z of [-12, 12]) streetlight(K, (z > 0 ? -1 : 1) * 4.6, z, z > 0 ? 0 : PI, { h: Y + 7, base: Y });
}

function pTunnel(K) {
  const T = K.T;
  base(K, 12, 24);
  const p = line(0, -12, 0, 12);
  band(K, p, -HR, HR, 0, AY, 'asphalt');
  centre(K, p);
  // outside: normal street edges; inside: narrow raised walkways
  for (const sd of [1, -1]) {
    edge(K, p, sd, HR, 6, { s1: 12 });
    sweep(K, p, [[HR, 0], [4.9, 0], [4.9, 0.6], [HR, 0.6]].map(([u, y]) => [sd * u, y]), 'concrete', { s0: 11.4 });
  }
  weather(K, p, -HR, HR, { s1: 11.5 });
  if (T.edge !== 'curb') for (const sd of [1, -1]) paintLine(K, p, sd * (HR - 0.2), 0.12);
  const archArc = (rx, spring, ry, a0, a1, n = 20) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [rx * Math.cos(a), spring + ry * Math.sin(a)]; });
  // hill above the tunnel (earth around the bore), bore lining and portal headwall: simple U-shaped outlines
  const ext = (pts, z0, z1, key) => {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => V2(x, y))), { depth: z1 - z0, bevelEnabled: false, curveSegments: 12 });
    g.translate(0, 0, z0);
    K.add(key, g);
  };
  const outerArc = archArc(5.3, 4.2, 3.0, PI, 0);
  ext([[-6, 0], [-5.3, 0], ...outerArc, [5.3, 0], [6, 0], [6, 9], [-6, 9]], 0, 12, 'earth');
  ext([[-5.3, 0], [-4.9, 0], ...archArc(4.9, 4.2, 2.6, PI, 0), [4.9, 0], [5.3, 0], ...archArc(5.3, 4.2, 3.0, 0, PI)], 0, 12, 'tiles');
  ext([[-6, 0], [-5.3, 0], ...outerArc, [5.3, 0], [6, 0], [6, 9.6], [-6, 9.6]], -0.7, 0.02, 'portal');
  box(K, -6, 6, -0.7, 12, 9, 9.3, T.snow ? 'snow' : 'grass');
  K.add('portal', roundedBox(12.2, 0.5, 0.9, 0.08).translate(0, 9.75, -0.3));
  for (const sd of [1, -1]) xslab(K, sd > 0 ? 5.6 : -6, sd > 0 ? 6 : -5.6, [[0, 0], [0, 9.6], [-1.5, 9.6], [-6, 1.2], [-6, 0]], 'portal');
  for (let i = 0; i < 6; i++) shrub(K, -4.5 + i * 1.8, 2 + (i % 3) * 3.5, 0.8, 9.3);
  // tunnel lights: wall conduits from the walkway up to lamp boxes (always on)
  for (const z of [4, 9]) for (const sd of [1, -1]) {
    const g = group('tunnel-lamp', { parent: K.root, at: [sd * 4.55, 0, z] });
    const parts = new Map([['galv', [new THREE.CylinderGeometry(0.04, 0.04, 5.6, 8, 14).translate(0, 2.8, 0), roundedBox(0.2, 0.3, 1.0, 0.03).translate(-sd * 0.1, 5.5, 0)]]]);
    multi(K, 'tunnel-lamp-mount', parts, g);
    K.lamp('tunnel_lights', 'fog').add(g, { at: [-sd * 0.21, 5.5, 0], normal: [-sd, -0.3, 0], w: 0.8, h: 0.16, shape: 'strip', depth: 0.02 });
  }
  K.tunnelLit = true;
  if (T.lights) lightAt(K, p, 4, HR + 0.55);
}

function pDeadEnd(K) {
  const T = K.T;
  base(K, 12, 12);
  const p = line(0, -6, 0, 6);
  band(K, p, -HR, HR, 0, AY, 'asphalt', { s1: 10.2 });
  for (const sd of [1, -1]) edge(K, p, sd, HR, 6, { s1: T.edge === 'curb' ? 12 : 10 });
  if (T.edge === 'curb') {
    box(K, -HR - 0.01, HR + 0.01, 4, 4 + CW, 0, SY, 'curb');
    box(K, -HR, HR, 4 + CW - 0.01, 6, 0, SY + 0.004, T.walk === 'pavers' ? 'pavers' : 'conc');
  } else { for (const sd of [1, -1]) paintLine(K, p, sd * (HR - 0.2), 0.12, 'paint', { s1: 10 }); paintLine(K, line(-HR + 0.2, 4, HR - 0.2, 4), 0, 0.12); }
  centre(K, p, { s1: 6 });
  weather(K, p, -HR, HR, { s1: 10 });
  // end-of-road chevron board
  for (const x of [-1.4, 1.4]) K.add('galv', new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8, 4).translate(x, 0.8, 5.0));
  for (let i = 0; i < 6; i++) K.add(i % 2 ? 'white' : 'red', roundedBox(0.6, 0.45, 0.05, 0.02).translate(-1.5 + i * 0.6, 1.2, 4.95));
  furnish(K, p, HR, { s1: 10 });
  if (T.edge !== 'curb') shrub(K, 0, 5.6, 0.7);
}

function pCulDeSac(K) {
  const T = K.T;
  base(K, 24, 24);
  const C = 3;
  const RB = 9;
  const p = line(0, -12, 0, C);
  band(K, p, -HR, HR, 0, AY, 'asphalt');
  slab(K, circle(0, C, RB, 64), 0, AY, 'asphalt');
  centre(K, p, { s1: 8 });
  if (T.edge === 'curb') {
    const shape = (d) => {
      const e = HR + d;
      const rr = RB + d;
      const h = Math.sqrt(rr * rr - e * e);
      const tl = Math.atan2(-h, -e) + 2 * PI;
      const tr = Math.atan2(-h, e);
      return [[e, -12], [12, -12], [12, 12], [-12, 12], [-12, -12], [-e, -12], ...arcPts(0, C, rr, tl, tr, 48)];
    };
    slab(K, shape(0), 0, SY, 'curb');
    slab(K, shape(CW), 0, SY + 0.004, T.walk === 'pavers' ? 'pavers' : 'conc');
    if (T.walk === 'lawn') slab(K, [[HR + 2.5, -12], [12, -12], [12, -6], [HR + 2.5, -6]], 0, SY + 0.01, 'grass');
  } else {
    for (const sd of [1, -1]) paintLine(K, p, sd * (HR - 0.2), 0.12, 'paint', { s1: 12 + C - Math.sqrt(RB * RB - (HR - 0.2) ** 2) });
    paintLine(K, arc(0, C, RB - 0.25, -PI / 2 + 0.42, 1.5 * PI - 0.42), 0, 0.12);
  }
  // landscaped island
  K.add('curb', lathe([[2.8, 0], [3.0, 0], [3.0, SY], [2.8, SY]], 40).translate(0, 0, C));
  K.add('grass', lathe([[0.001, 0.4], [2.0, 0.32], [2.85, SY], [2.85, 0], [0.001, 0]].reverse(), 40).translate(0, 0, C));
  tree(K, 0, C, 1, 0.3);
  for (let a = 0; a < 5; a++) shrub(K, Math.cos(a * 1.3) * 1.8, C + Math.sin(a * 1.3) * 1.8, 0.4, 0.3);
  weather(K, p, -HR, HR, { banks: [HR, -HR] });
  weather(K, arc(0, C, 6, 0, 2 * PI), -2.9, 2.9, { banks: [] });
  for (const a of [0.25 * PI, 0.75 * PI]) streetlight(K, Math.cos(a) * (RB + 0.6), C + Math.sin(a) * (RB + 0.6), Math.atan2(Math.sin(a), -Math.cos(a)));
  if (T.trees) for (const x of [-8, 8]) tree(K, x, 9, 1);
}

function pParking(K, angled) {
  const T = K.T;
  const H = K.H;
  base(K, 24, 24);
  box(K, -12, 11, -11, 11, 0, AY, 'asphalt');
  // perimeter kerb + sidewalk (entry gap on the -x edge)
  const walk = T.walk === 'pavers' ? 'pavers' : 'conc';
  const ring = [[-12, 12, 11, 12], [-12, 12, -12, -11], [11, 12, -11, 11], [-12, -11, HR, 11], [-12, -11, -11, -HR]];
  if (T.edge === 'curb') for (const [x0, x1, z0, z1] of ring) { box(K, x0, x1, z0, z1, 0, SY, 'curb'); box(K, x0 + CW, x1 - CW, z0 + CW, z1 - CW, 0, SY + 0.004, walk); }
  else for (let x = -11; x <= 11; x += 2.2) for (const z of [-11.4, 11.4]) K.add('wood', new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8).translate(x, 0.3, z));
  // planted back strips with lights
  for (const sz of [1, -1]) {
    box(K, -10, 10, sz > 0 ? 8.7 : -9.6, sz > 0 ? 9.6 : -8.7, 0, SY, 'curb');
    box(K, -9.85, 9.85, sz > 0 ? 8.85 : -9.45, sz > 0 ? 9.45 : -8.85, 0, SY + 0.01, 'grass');
    for (const x of [-6, 6]) streetlight(K, x, sz * 9.15, sz > 0 ? PI / 2 : -PI / 2, { h: 9, double: true, style: T.lstyle === 'cobra' ? 'modern' : T.lstyle });
    for (const x of [-9, -3, 0, 3, 9]) shrub(K, x, sz * 9.15, 0.35, SY);
    if (T.trees) tree(K, 0, sz * 9.15, 0.8, SY);
  }
  // bays
  const bayW = 2.5;
  for (const sz of [1, -1]) {
    if (!angled) {
      for (let k = 0; k <= 7; k++) { const x = -9.5 + k * bayW; paintLine(K, line(x, sz * 3.6, x, sz * 8.4), 0, 0.12); }
      for (let k = 0; k < 7; k++) {
        const x = -9.5 + (k + 0.5) * bayW;
        K.add('concrete', roundedBox(1.7, 0.12, 0.22, 0.04).translate(x, AY + 0.06, sz * 7.9));
        if (k === 0) { paintPoly(K, [[x - 1.15, sz * 3.7], [x + 1.15, sz * 3.7], [x + 1.15, sz * 8.3], [x - 1.15, sz * 8.3]], 'blue'); decal(K, 'wheelchair', x, sz * 5.8, 1.4, 1.4, sz > 0 ? 0 : PI); }
      }
    } else {
      const dx = 4.8 / Math.tan(PI / 3);
      const step = bayW / Math.sin(PI / 3);
      for (let k = 0; k <= 6; k++) { const x = -9 + k * step; paintLine(K, line(x, sz * 3.6, x + dx, sz * 8.4), 0, 0.12); }
      for (let k = 0; k < 6; k++) { const x = -9 + (k + 0.5) * step + dx * 0.85; K.add('concrete', put(roundedBox(1.6, 0.12, 0.22, 0.04), x, AY + 0.06, sz * 7.9, sz * (PI / 2 - PI / 3) * 0)); }
    }
  }
  // aisle arrows: two-way (keep to the driver's side) or one-way for angled bays
  if (angled) for (const x of [-6, 2]) arrow(K, x, 0, PI / 2);
  else for (const x of [-6, 4]) { arrow(K, x - 2.3, H * 1.75, PI / 2); arrow(K, x + 2.3, -H * 1.75, -PI / 2); }
  weather(K, line(-12, 0, 11, 0), -11, 11, { banks: [] });
}

function pBusLane(K) {
  const H = K.H;
  base(K, 12, 12);
  const p = line(0, -6, 0, 6);
  street(K, p);
  centre(K, p);
  // bus lane = the lane carrying +z traffic (driver's side), solid wide line
  band(K, p, -H * 0.2, -H * (HR - 0.05), AY - 0.006, PY - 0.002, 'busred');
  paintLine(K, p, -H * 0.3, 0.25);
  decal(K, 'bus', -H * 1.85, -2.4, 1.6, 2.4, PI);
  decal(K, 'lane', -H * 1.85, 0.6, 1.6, 2.4, PI);
  const [x, z] = [-H * (HR + 0.8), 3];
  K.add('galv', new THREE.CylinderGeometry(0.04, 0.04, 2.9, 8, 6).translate(x, 1.45, z));
  K.add('sign', roundedBox(0.04, 0.45, 0.55, 0.02).translate(x, 2.6, z));
  furnish(K, p, HR);
}

function pBikeLane(K) {
  base(K, 12, 12);
  const p = line(0, -6, 0, 6);
  street(K, p);
  for (const sd of [1, -1]) {
    band(K, p, sd * 2.25, sd * (HR - 0.05), AY - 0.006, PY - 0.002, 'bikegreen');
    paintLine(K, p, sd * 2.2, 0.12, 'paint', { dash: 1, gap: 1 });
    decal(K, 'bike', sd * 2.85, sd * 2.5, 1.0, 1.0, sd > 0 ? PI : 0);
  }
  furnish(K, p, HR);
}

function pCrosswalk(K) {
  const T = K.T;
  const H = K.H;
  base(K, 12, 12);
  const p = line(0, -6, 0, 6);
  band(K, p, -HR, HR, 0, AY, 'asphalt');
  const walk = T.walk === 'pavers' ? 'pavers' : 'conc';
  for (const sd of [1, -1]) {
    if (T.edge === 'curb') {
      edge(K, p, sd, HR, 6, { s1: 3.6 });
      edge(K, p, sd, HR, 6, { s0: 8.4 });
      // dropped kerb: flush crossing zone with tactile paving and two flares
      const x0 = sd > 0 ? HR : -6;
      const x1 = sd > 0 ? 6 : -HR;
      box(K, x0, x1, -1.6, 1.6, 0, AY + 0.025, walk);
      box(K, sd > 0 ? HR + 0.05 : -HR - 0.65, sd > 0 ? HR + 0.65 : -HR - 0.05, -1.5, 1.5, 0, AY + 0.03, 'tactile');
      for (const sz of [1, -1]) xslab(K, x0, x1, sz > 0 ? [[1.6, 0], [2.41, 0], [2.41, SY], [1.6, AY + 0.025]] : [[-2.41, 0], [-1.6, 0], [-1.6, AY + 0.025], [-2.41, SY]], walk);
    } else { edge(K, p, sd, HR, 6); paintLine(K, p, sd * (HR - 0.2), 0.12); }
  }
  for (let x = -HR + 0.35; x < HR - 0.3; x += 1.0) paintPoly(K, [[x, -1.5], [x + 0.5, -1.5], [x + 0.5, 1.5], [x, 1.5]]);
  // stop lines before the crossing for each direction; zig-zag approach lines for LHT
  paintPoly(K, [[-H * 0.15, -2.8], [-H * (HR - 0.15), -2.8], [-H * (HR - 0.15), -2.45], [-H * 0.15, -2.45]]);
  paintPoly(K, [[H * 0.15, 2.45], [H * (HR - 0.15), 2.45], [H * (HR - 0.15), 2.8], [H * 0.15, 2.8]]);
  if (H < 0) {
    for (const sd of [1, -1]) for (const u of [-(HR - 0.25), HR - 0.25]) {
      const zz = [];
      for (let z = 3.0; z <= 6; z += 0.75) zz.push([u + ((Math.round((z - 3) / 0.75) % 2) ? 0.25 : -0.25) * Math.sign(u), sd * z]);
      for (let i = 0; i < zz.length - 1; i++) sweep(K, line(zz[i][0], zz[i][1], zz[i + 1][0], zz[i + 1][1]), rect(-0.05, 0.05, AY - 0.008, PY), 'paint');
    }
    centre(K, p, { s1: 3 });
    centre(K, p, { s0: 9 });
  } else { centre(K, p, { s1: 3.2 }); centre(K, p, { s0: 8.8 }); }
  weather(K, p, -HR, HR, { banks: [HR, -HR] });
  // beacons (LHT: striped poles with amber globes) or crossing sign posts (RHT)
  for (const sd of [1, -1]) {
    const x = sd * (HR + 0.6);
    const z = sd * 2.0;
    if (H < 0) {
      const g = group('beacon', { parent: K.root, at: [x, 0, z] });
      const parts = new Map([['black', []], ['white', []]]);
      for (let i = 0; i < 9; i++) parts.get(i % 2 ? 'white' : 'black').push(new THREE.CylinderGeometry(0.06, 0.06, 0.31, 12, 1).translate(0, 0.155 + i * 0.3, 0));
      parts.get('black').push(new THREE.CylinderGeometry(0.1, 0.12, 0.25, 12).translate(0, 2.8, 0));
      multi(K, 'beacon-pole', parts, g);
      const lg = K.lamp('beacons', 'amber');
      lg.add(g, { at: [0, 2.92, 0], normal: [0, 1, 0], w: 0.34, h: 0.34, depth: 0.18, shape: 'round', bezel: false });
      K.beacons = true;
    } else {
      K.add('galv', new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8, 6).translate(x, 1.4, z));
      K.add('sign', put(roundedBox(0.6, 0.6, 0.03, 0.04), x, 2.5, z + sd * 0.04, 0));
      K.add('white', put(new THREE.CircleGeometry(0.2, 3), x, 2.5, z + sd * 0.06, sd > 0 ? 0 : PI));
    }
  }
  if (T.lights) streetlight(K, HR + 0.55, -3.5, PI);
  if (T.bollards) for (const sd of [1, -1]) for (const sz of [1, -1]) bollard(K, sd * (HR + 0.45), sz * 2.7);
}

function pRail(K) {
  const T = K.T;
  const H = K.H;
  base(K, 12, 12);
  const p = line(0, -6, 0, 6);
  band(K, p, -HR, HR, 0, AY, 'asphalt', { s1: 4.5 });
  band(K, p, -HR, HR, 0, AY, 'asphalt', { s0: 7.5 });
  for (const sd of [1, -1]) {
    edge(K, p, sd, HR, 6, { s1: 4.4 });
    edge(K, p, sd, HR, 6, { s0: 7.6 });
    if (T.edge !== 'curb') { paintLine(K, p, sd * (HR - 0.2), 0.12, 'paint', { s1: 4.4 }); paintLine(K, p, sd * (HR - 0.2), 0.12, 'paint', { s0: 7.6 }); }
  }
  // crossing panels, ballast + sleepers outside the road, rails across the whole tile
  box(K, -HR - 0.15, HR + 0.15, -1.5, 1.5, 0, AY + 0.005, 'rubber');
  for (const sd of [1, -1]) {
    box(K, sd > 0 ? HR + 0.15 : -6, sd > 0 ? 6 : -HR - 0.15, -1.6, 1.6, 0, GY + 0.005, 'gravel');
    for (let x = HR + 0.4; x < 6; x += 0.62) K.add('concrete', roundedBox(0.24, 0.06, 2.6, 0.02).translate(sd * x, 0.03, 0));
  }
  const rp = line(-6, 0, 6, 0);
  const railProf = (u) => [[u - 0.06, 0], [u + 0.06, 0], [u + 0.06, 0.012], [u + 0.01, 0.024], [u + 0.01, 0.045], [u + 0.035, 0.05], [u + 0.035, 0.085], [u - 0.035, 0.085], [u - 0.035, 0.05], [u - 0.01, 0.045], [u - 0.01, 0.024], [u - 0.06, 0.012]];
  for (const u of [-0.7175, 0.7175]) sweep(K, rp, railProf(u), 'rail');
  centre(K, p, { s1: 3.2 });
  centre(K, p, { s0: 8.8 });
  // approach markings + stop lines (driver's side)
  for (const [sd, z0] of [[1, 2.8], [-1, -2.8]]) {
    paintPoly(K, [[sd * H * 0.15, z0], [sd * H * (HR - 0.15), z0], [sd * H * (HR - 0.15), z0 + sd * 0.4], [sd * H * 0.15, z0 + sd * 0.4]]);
    decal(K, 'rxr', sd * H * 1.8, sd * 4.6, 2.2, 2.2, sd > 0 ? PI : 0);
  }
  weather(K, p, -HR, HR, { s1: 4.4 });
  weather(K, p, -HR, HR, { s0: 7.6 });
  // signal posts with crossbucks, flashing lights and animated boom gates
  const arms = [];
  [[1, 2.3], [-1, -2.3]].forEach(([sd, z], i) => {
    const x = sd * H * (HR + 0.7);
    const g = group(`gate-post-${i}`, { parent: K.root, at: [x, 0, z] });
    g.rotation.y = x > 0 ? PI : 0; // local +x points across the road
    const fz = x > 0 ? -sd : sd; // local z side facing the approaching traffic
    const parts = new Map([['white', []], ['red', []], ['black', []]]);
    parts.get('white').push(new THREE.CylinderGeometry(0.07, 0.09, 3.9, 12, 14).translate(0, 1.95, 0));
    parts.get('black').push(roundedBox(0.5, 0.6, 0.4, 0.05).translate(0, 0.3, 0));
    for (const a of [PI / 4, -PI / 4]) { parts.get('white').push(roundedBox(1.25, 0.22, 0.03, 0.02).rotateZ(a).translate(0, 3.5, fz * 0.09)); parts.get('red').push(roundedBox(1.0, 0.1, 0.035, 0.02).rotateZ(a).translate(0, 3.5, fz * 0.1)); }
    parts.get('black').push(roundedBox(1.1, 0.12, 0.12, 0.03).translate(0, 2.7, 0));
    for (const lx of [-0.42, 0.42]) parts.get('black').push(lathe([[0.001, -0.1], [0.17, -0.1], [0.17, 0.1], [0.001, 0.1]], 16).rotateX(PI / 2).translate(lx, 2.7, fz * 0.1));
    parts.get('black').push(roundedBox(0.3, 0.4, 0.3, 0.04).translate(0, 1.0, 0));
    multi(K, `gate-post-mesh-${i}`, parts, g);
    K.lamp('rail_L', 'red').add(g, { at: [-0.42, 2.7, fz * 0.205], normal: [0, 0, fz], w: 0.2, h: 0.2, shape: 'round', bezel: false, depth: 0.02 });
    K.lamp('rail_R', 'red').add(g, { at: [0.42, 2.7, fz * 0.205], normal: [0, 0, fz], w: 0.2, h: 0.2, shape: 'round', bezel: false, depth: 0.02 });
    const piv = group(`gate_arm_${i}`, { parent: g, at: [0, 1.0, -fz * 0.2] });
    piv.rotation.z = PI / 2 - 0.06;
    const ap = new Map([['white', []], ['red', []], ['black', []]]);
    ap.get('black').push(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 14).rotateX(PI / 2).translate(0, 0, fz * 0.06));
    ap.get('white').push(roundedBox(3.4, 0.09, 0.07, 0.02).translate(1.7 + 0.05, 0, 0));
    for (let k = 0; k < 4; k++) ap.get('red').push(roundedBox(0.4, 0.095, 0.075, 0.02).translate(0.6 + k * 0.8, 0, 0));
    ap.get('black').push(roundedBox(0.5, 0.18, 0.12, 0.03).translate(-0.3, 0, 0));
    multi(K, `gate-arm-mesh-${i}`, ap, piv);
    arms.push(piv);
  });
  const down = (t) => -(PI / 2 - 0.06) * (t < 0.15 ? t / 0.15 : t < 0.75 ? 1 : t < 0.9 ? 1 - (t - 0.75) / 0.15 : 0);
  K.anims.push(clip('gates', 10, arms.map((a) => rotateTrack(a, 'z', 10, down, 40))));
  const blinkR = [new THREE.NumberKeyframeTrack('rail_R.material.emissiveIntensity', [0, 0.5, 1], [0.25, 2.6, 0.25], THREE.InterpolateDiscrete), new THREE.NumberKeyframeTrack('rail_R_glow.material.opacity', [0, 0.5, 1], [0, 0.9, 0], THREE.InterpolateDiscrete)];
  K.anims.push(clip('flashing', 1, [...lampTracks('rail_L', 2.6, { blink: 1, off: 0.25 }), ...blinkR]));
  if (T.lights) streetlight(K, -H * (HR + 0.55), -5, H > 0 ? 0 : PI);
}

function pDirt(K) {
  const T = K.T;
  base(K, 12, 12);
  const p = line(0, -6, 0, 6);
  const ys = [GY + 0.005, GY + 0.03, GY + 0.006, GY + 0.035, GY + 0.04];
  const deep = T.cracks ? 0.02 : 0;
  const prof = [[-2.4, 0], [2.4, 0], [2.4, ys[0]], [1.8, ys[1]], [1.25, ys[2] - deep], [0.7, ys[3]], [0, ys[4]], [-0.7, ys[3]], [-1.25, ys[2] - deep], [-1.8, ys[1]], [-2.4, ys[0]]];
  sweep(K, p, prof, T.snow ? 'snow' : 'dirt', { step: 0.5, yfn: (s, u, y) => (y > GY ? y + 0.006 * Math.sin(s * 3.1 + u * 5) : y) });
  if (!T.snow) band(K, p, -0.35, 0.35, 0, GY + 0.055, 'grass', { yfn: (s, u, y) => (y > GY ? y + 0.01 * Math.sin(s * 4.7 + u * 9) : y), step: 0.4 });
  if (T.puddles) for (let i = 0; i < 4; i++) { const [x, z] = W(p, 1.5 + i * 3 + K.r(), (i % 2 ? 1 : -1) * 1.25); slab(K, blob(x, z, 0.3, 0.7 + K.r() * 0.5, K.r), 0, GY + 0.012, 'mud'); }
  if (T.snow) for (const u of [-1.25, 1.25]) band(K, p, u - 0.25, u + 0.25, 0, GY + 0.04, 'dirt');
  for (const sd of [1, -1]) {
    fence(K, p, sd * 5.5);
    for (let i = 0; i < 3; i++) rock(K, sd * (2.6 + K.r() * 1.5), -5 + K.r() * 10, 0.12 + K.r() * 0.15);
    shrub(K, sd * 4.3, -3 + sd * 2.5, 0.6);
  }
  if (T.lights) streetlight(K, 3.6, 0, PI, { style: 'wood', h: 7 });
}

function pCobble(K) {
  const T = K.T;
  base(K, 12, 12);
  const p = line(0, -6, 0, 6);
  band(K, p, -HR, HR, 0, AY - 0.03, 'mortar');
  for (const sd of [1, -1]) edge(K, p, sd, HR, 6);
  // cobbles (instanced, colour varied); the worn trim loses a few
  const r = K.r;
  const geo = new THREE.IcosahedronGeometry(1, 1);
  geo.scale(0.1, 0.055, 0.1);
  const pts = [];
  for (let z = -5.9; z < 6; z += 0.21) for (let x = -HR + 0.12; x < HR - 0.05; x += 0.21) if (!(T.cracks && r() < 0.03)) pts.push([x + (r() - 0.5) * 0.03 + ((Math.round(z / 0.21) % 2) ? 0.1 : 0), z + (r() - 0.5) * 0.03]);
  const im = new THREE.InstancedMesh(geo, makeMat(K, 'cobble'), pts.length);
  im.name = 'cobbles';
  const m4 = new THREE.Matrix4();
  const c = new THREE.Color();
  const tint = T.snow ? '#9fa2a6' : '#7d776d';
  pts.forEach(([x, z], i) => {
    const s = 0.85 + r() * 0.3;
    m4.compose(new THREE.Vector3(Math.min(HR - 0.1, x), 0.058, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 3, 0)), new THREE.Vector3(s, 0.8 + r() * 0.2, s));
    im.setMatrixAt(i, m4);
    im.setColorAt(i, c.set(tint).offsetHSL((r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.12));
  });
  K.root.add(im);
  weather(K, p, -HR, HR, { banks: [HR, -HR] });
  furnish(K, p, HR, { drains: false, lights: T.lights || true, ...{} });
}

function pGravel(K) {
  const T = K.T;
  base(K, 12, 12);
  const p = line(0, -6, 0, 6);
  sweep(K, p, [[-1.3, 0], [1.3, 0], [1.3, GY + 0.02], [0, GY + 0.04], [-1.3, GY + 0.02]], T.snow ? 'snow' : 'gravel', { step: 1 });
  for (const sd of [1, -1]) sweep(K, p, rect(sd * 1.3, sd * 1.36, 0, GY + 0.07), 'wood');
  if (T.puddles) for (let i = 0; i < 3; i++) { const [x, z] = W(p, 2 + i * 4, (K.r() - 0.5) * 1.2); slab(K, blob(x, z, 0.4, 0.5, K.r), 0, GY + 0.045, 'puddle'); }
  if (T.cracks) for (let i = 0; i < 10; i++) shrub(K, (K.r() - 0.5) * 2.2, -5.5 + K.r() * 11, 0.08 + K.r() * 0.08, GY + 0.02);
  for (const sd of [1, -1]) for (let i = 0; i < 3; i++) shrub(K, sd * (2.2 + K.r() * 2.5), -5 + i * 4 + K.r(), 0.5 + K.r() * 0.4);
  tree(K, 4.2, 3, 1.1);
  if (T.lights) for (const z of [-3, 3]) streetlight(K, (z > 0 ? -1 : 1) * 1.8, z, 0, { style: 'lantern' });
}

function pDriveway(K) {
  const T = K.T;
  base(K, 12, 12, 'grass');
  const country = T.edge === 'verge';
  if (country) {
    for (const sd of [1, -1]) band(K, line(0, -6, 0, 6), sd * 0.55, sd * 1.75, 0, GY + 0.03, T.snow ? 'snow' : 'gravel');
  } else {
    const key = T.walk === 'pavers' ? 'pavers' : 'concrete';
    for (let i = 0; i < 4; i++) box(K, -1.8, 1.8, -6 + i * 3 + 0.006, -3 + i * 3 - 0.006, 0, GY + 0.08, T.snow ? 'snow' : key);
    for (const sd of [1, -1]) box(K, sd > 0 ? 1.8 : -2.0, sd > 0 ? 2.0 : -1.8, -6, 6, 0, GY + 0.09, 'brick');
    if (T.cracks) { sweep(K, spline([[-1.2, -5], [-0.4, -4], [0.3, -3.6], [1.1, -2.2]]), rect(-0.012, 0.012, GY + 0.07, GY + 0.083), 'crack', { caps: false }); slab(K, blob(0.3, 1.5, 0.5, 0.35, K.r), GY + 0.07, GY + 0.083, 'patch'); }
    if (T.puddles) slab(K, blob(-0.6, 2, 0.6, 0.4, K.r), GY + 0.07, GY + 0.085, 'puddle');
  }
  if (T.snow) for (const sd of [1, -1]) { const g = jitter(new THREE.IcosahedronGeometry(0.6, 1), K.r, 0.25); g.scale(1, 0.6, 2.2).translate(sd * 2.8, 0.25, -1); K.add('snow', g); }
  // flower beds, shrubs, mailbox post, garden lights
  for (const sd of [1, -1]) {
    box(K, sd > 0 ? 2.6 : -4.2, sd > 0 ? 4.2 : -2.6, 0, 5, 0, GY + 0.04, 'earth');
    for (let i = 0; i < 4; i++) shrub(K, sd * 3.4, 0.6 + i * 1.2, 0.45, GY + 0.03);
  }
  K.add('wood', roundedBox(0.1, 1.15, 0.1, 0.02).translate(2.6, 0.575, -5.3));
  K.add('black', roundedBox(0.24, 0.24, 0.48, 0.08).translate(2.6, 1.27, -5.3));
  tree(K, -4.5, -3.5, 1.1);
  for (const z of [-4, 0, 4]) for (const sd of [1, -1]) {
    if (!T.lights && z !== 0) continue;
    streetlight(K, sd * 2.25, z, 0, { style: 'lantern' });
  }
}

function pAlley(K) {
  const T = K.T;
  const city = T.walk === 'pavers';
  const country = T.edge === 'verge';
  base(K, 12, 12, 'concrete');
  const p = line(0, -6, 0, 6);
  sweep(K, p, [[-2.4, 0], [2.4, 0], [2.4, AY + 0.02], [0.3, AY - 0.005], [0, AY - 0.02], [-0.3, AY - 0.005], [-2.4, AY + 0.02]], country ? 'stone' : 'concrete', { step: 2 });
  K.add('metal', roundedBox(0.5, 0.03, 0.5, 0.01).translate(0, AY - 0.012, 1.5));
  weather(K, p, -2.3, 2.3, { banks: [-2.3, 2.3], lanes: [] });
  // building backs / walls on both sides
  const hgt = city ? 7 : country ? 2.2 : 5;
  for (const sd of [1, -1]) {
    const x0 = sd > 0 ? 2.4 : -6;
    const x1 = sd > 0 ? 6 : -2.4;
    box(K, x0, x1, -6, 6, 0, hgt, country ? 'stone' : 'brick');
    if (country) { sweep(K, p, rect(sd * 2.35, sd * 3.0, 0, hgt + 0.12), 'stone', {}); for (let i = 0; i < 4; i++) shrub(K, sd * 2.6, -5 + i * 3.3, 0.35, hgt); continue; }
    for (const z of [-3.5, 2.5]) {
      K.add('metal', roundedBox(0.08, 2.1, 1.0, 0.02).translate(sd * 2.38, 1.05 + 0.02, z));
      K.add('concrete', roundedBox(0.5, 0.16, 1.4, 0.03).translate(sd * 2.2, 0.08, z));
    }
    K.add('galv', new THREE.CylinderGeometry(0.05, 0.05, hgt, 10, Math.ceil(hgt / 0.5)).translate(sd * 2.32, hgt / 2, 0.4));
    if (city) for (let y = 3; y < hgt; y += 3) {
      K.add('metal', roundedBox(0.9, 0.06, 2.6, 0.02).translate(sd * 1.95, y, -1));
      for (const zz of [-2.25, 0.25]) K.add('metal', new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6).translate(sd * 1.55, y + 0.5, zz));
      sweep(K, line(sd * 1.55, -2.3, sd * 1.55, 0.3), rect(-0.02, 0.02, y + 0.98, y + 1.02), 'metal');
      K.add('metal', put(roundedBox(0.6, 0.05, 3.5, 0.02), sd * 1.95, y - 1.5, -1).rotateX(0));
      if (y + 3 < hgt) { const st = new THREE.BoxGeometry(0.6, 0.05, 3.6); st.rotateX(Math.atan2(3, 2.6)); K.add('metal', st.translate(sd * 1.95, y + 1.5, -1)); }
    }
    if (city) K.add('galv', roundedBox(0.7, 0.6, 0.9, 0.05).translate(sd * 2.05, 2.6, 4.2));
  }
  if (city) {
    // fire-escape stair supports reach the ground
    for (const sd of [1, -1]) K.add('metal', new THREE.CylinderGeometry(0.04, 0.04, hgt - 3 + 0.1, 6).translate(sd * 1.55, (hgt - 3) / 2 + 3, -2.25));
  }
  // wall lamps on conduits from the ground
  for (const [sd, z] of [[1, -1.5], [-1, 4.5]]) {
    if (country && !T.lights) continue;
    const g = group('wall-lamp', { parent: K.root, at: [sd * 2.3, 0, z] });
    const parts = new Map([['black', [new THREE.CylinderGeometry(0.03, 0.03, 3.6, 8, 10).translate(0, 1.8, 0), roundedBox(0.4, 0.06, 0.06, 0.02).translate(-sd * 0.2, 3.55, 0), roundedBox(0.3, 0.16, 0.3, 0.04).translate(-sd * 0.4, 3.5, 0)]]]);
    multi(K, 'wall-lamp-mount', parts, g);
    K.lamp('streetlights', T.lamp).add(g, { at: [-sd * 0.4, 3.42, 0], normal: [0, -1, 0], w: 0.22, h: 0.22, depth: 0.02, bezel: false });
  }
}

/* -------------------------------- variants -------------------------------- */

export const ROAD_KIT_VARIANTS = {
  straight: { build: pStraight },
  'curve-tight': { build: (K) => pCurve(K, 1) },
  'curve-medium': { build: (K) => pCurve(K, 2) },
  'curve-wide': { build: (K) => pCurve(K, 3) },
  't-junction': { build: pT },
  crossroads: { build: pCross },
  roundabout: { build: pRoundabout },
  'highway-2': { build: (K) => pHighway(K, 1) },
  'highway-4': { build: (K) => pHighway(K, 2) },
  'highway-6': { build: (K) => pHighway(K, 3) },
  'on-ramp': { build: (K) => pRamp(K, false) },
  'off-ramp': { build: (K) => pRamp(K, true) },
  overpass: { build: pOverpass },
  bridge: { build: pBridge },
  tunnel: { build: pTunnel },
  'dead-end': { build: pDeadEnd },
  'cul-de-sac': { build: pCulDeSac },
  'parking-lot': { build: (K) => pParking(K, false) },
  'parking-angled': { build: (K) => pParking(K, true) },
  'bus-lane': { build: pBusLane },
  'bike-lane': { build: pBikeLane },
  crosswalk: { build: pCrosswalk },
  'rail-crossing': { build: pRail },
  'dirt-road': { build: pDirt, unpaved: true },
  cobblestone: { build: pCobble, lstyle: 'lantern' },
  'gravel-path': { build: pGravel, unpaved: true },
  driveway: { build: pDriveway },
  alley: { build: pAlley, lstyle: 'lantern' },
};

export function createRoadKit(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(ROAD_KIT_VARIANTS, o.variant, 'road-kit');
  const V = ROAD_KIT_VARIANTS[variant];
  const trim = o.trim && ROAD_KIT_TRIMS[o.trim] ? o.trim : null;
  const T = { ...BASE, ...(V.lstyle ? { lstyle: V.lstyle } : {}), ...(trim ? ROAD_KIT_TRIMS[trim] : {}) };
  if (V.lstyle && trim !== 'country') T.lstyle = V.lstyle;
  if (T.walk === 'pavers' && V.lstyle) T.lstyle = V.lstyle;
  const K = kit(variant, T, `road-kit-${variant}-${trim}-${o.seed ?? 1}`);
  V.build(K);
  multi(K, 'road-surface', K.parts);
  // lamps: lit statically for the night trim (tunnels are always lit), plus an 'on' clip
  const on = [];
  for (const [name, lg] of Object.entries(K.lamps)) {
    if (name.startsWith('rail_')) continue;
    const kind = lg.kind;
    const lit = T.lit || name === 'tunnel_lights';
    if (name === 'beacons') { K.anims.push(clip('flash', 1, lampTracks('beacons', LAMP_ON.amber, { blink: 1 }))); continue; }
    if (lit) { lg.lens.emissiveIntensity = LAMP_ON[kind] ?? 3; lg.glow.opacity = 0.85; }
    on.push(...lampTracks(name, LAMP_ON[kind] ?? 3));
  }
  if (K.poolMat) {
    if (T.lit) K.poolMat.opacity = 0.3;
    on.push(new THREE.NumberKeyframeTrack('light_pool.material.opacity', [0, 1], [0.3, 0.3]));
  }
  if (on.length) K.anims.unshift(clip('on', 1, on));
  return finalize(K.root, { type: 'road-kit', variant, options: o, animations: K.anims });
}
