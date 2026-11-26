/*
 * Vegetables: root veg, alliums, brassicas, fruiting veg, squash, mushrooms and greens.
 * Lathe/sweep bodies with vertex-colour skins, real cut faces (shared with fruit) and
 * trims for varieties and kitchen states (bunch, sliced, halved, grilled, carved…).
 */
import {
  THREE, PI, TAU, mesh, group, curveTube, roundedBox, lathe, sweep, scatter, leafGeo, ballGeo, cached, jitter,
  waxy, velvet, flesh, glaze, leafy, phys, woodMat, ceramic, bowl, board, plate, vcolor, fbm, toColor, make, mottle, gradient,
  clip, numberTrack, extrudeOutline, foil, cream,
} from './common.js';
import { produce, surfacePoints } from './cut.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';

const C = (h) => toColor(h);
const stemMat = (c = '#6a8a3a') => phys(c, { rough: 0.7, name: 'stem' });
function rnd(seed) { let a = 0; for (const ch of seed) a = (a * 31 + ch.charCodeAt(0)) | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const paint2 = (a, b, amt = 0.5, extra) => (c, x, y, z, t, n) => { c.set(a).lerp(C(b), Math.min(1, Math.max(0, (n - 0.3) * amt * 2))); if (extra) extra(c, x, y, z, t, n); };

/* ---------------------------------------------------------- lathe veg specs */
const CUT = {
  tomato: { kind: 'tomato', flesh: '#e8322a', flesh2: '#f86a4a', seed: '#f7a07a', rind: '#d82a20', rindW: 0.08 },
  yellowtomato: { kind: 'tomato', flesh: '#f6c62a', flesh2: '#ffe07a', seed: '#fff0b0', rind: '#f0b81a', rindW: 0.08 },
  greentomato: { kind: 'tomato', flesh: '#a8c84a', flesh2: '#d8e88a', seed: '#f0f0c0', rind: '#8ab83a', rindW: 0.08 },
  onion: { kind: 'onion', flesh: '#f6f2e0', flesh2: '#e2dcbc', seed: '#fff', rind: '#f2ead0', rindW: 0.02 },
  redonion: { kind: 'onion', flesh: '#f2e6f0', flesh2: '#9a3a6a', seed: '#fff', rind: '#8a2a5a', rindW: 0.03 },
  potato: { kind: 'potato', flesh: '#f6e6a8', flesh2: '#efdc98', seed: '#fff', rind: '#e8d498', rindW: 0.02 },
  sweet: { kind: 'potato', flesh: '#f78a2a', flesh2: '#f8a84a', seed: '#fff', rind: '#e8782a', rindW: 0.02 },
  beet: { kind: 'beet', flesh: '#9a1240', flesh2: '#c8407a', seed: '#fff', rind: '#7a0e30', rindW: 0.02 },
  goldbeet: { kind: 'beet', flesh: '#f6b82a', flesh2: '#fad66a', seed: '#fff', rind: '#e0a020', rindW: 0.02 },
  radish: { kind: 'radish', flesh: '#fbf8f0', flesh2: '#f0eadc', seed: '#fff', rind: '#e02a5a', rindW: 0.03 },
  eggplant: { kind: 'eggplant', flesh: '#f2ecd0', flesh2: '#e8dfb8', seed: '#a8946a', rind: '#3a1a3a', rindW: 0.02 },
  cucumber: { kind: 'cucumber', flesh: '#c8e08a', flesh2: '#eef6c8', seed: '#f8f8e0', rind: '#2f5a1e', rindW: 0.04 },
  zucchini: { kind: 'zucchini', flesh: '#eef0c8', flesh2: '#f8f8e0', seed: '#e8e6b8', rind: '#3a6a1e', rindW: 0.03 },
  carrot: { kind: 'carrot', flesh: '#f27a1a', flesh2: '#f8a040', seed: '#fff', rind: '#e86a12', rindW: 0.02 },
  pumpkin: { kind: 'melon', flesh: '#f78a1a', flesh2: '#f8b04a', seed: '#f3e6b8', rind: '#e87a12', rindW: 0.06 },
  butternut: { kind: 'melon', flesh: '#f8981a', flesh2: '#f8b04a', seed: '#f3e6b8', rind: '#e8b878', rindW: 0.03 },
  cabbage: { kind: 'cabbage', flesh: '#e6f0b8', flesh2: '#f6f8e0', seed: '#fff', rind: '#9cc45a', rindW: 0.03 },
  redcabbage: { kind: 'cabbage', flesh: '#7a2a6a', flesh2: '#f2e6f0', seed: '#fff', rind: '#5a1a4a', rindW: 0.03 },
};
const LV = {
  tomato: { ctrl: [[0, 0.003], [0.02, 0.002], [0.034, 0.012], [0.038, 0.03], [0.033, 0.047], [0.018, 0.055], [0.004, 0.054], [0, 0.052]], mat: (o) => waxy('#fff', { rough: 0.2, cc: 1, ...o }), ribs: 0.0012 },
  roma: { ctrl: [[0, 0.002], [0.014, 0.004], [0.024, 0.02], [0.026, 0.045], [0.022, 0.07], [0.01, 0.08], [0, 0.079]], mat: (o) => waxy('#fff', { rough: 0.2, cc: 1, ...o }) },
  onion: { ctrl: [[0, 0.003], [0.015, 0.002], [0.034, 0.016], [0.04, 0.035], [0.032, 0.056], [0.012, 0.072], [0.004, 0.085], [0, 0.088]], mat: (o) => phys('#fff', { rough: 0.45, cc: 0.4, sheen: 0.4, ...o, name: 'skin' }), ns: 40 },
  shallot: { ctrl: [[0, 0.002], [0.01, 0.002], [0.019, 0.014], [0.02, 0.03], [0.014, 0.045], [0.005, 0.058], [0, 0.06]], mat: (o) => phys('#fff', { rough: 0.45, cc: 0.4, ...o, name: 'skin' }) },
  potato: { ctrl: [[0, 0], [0.012, 0.003], [0.026, 0.015], [0.03, 0.045], [0.027, 0.07], [0.014, 0.083], [0, 0.085]], mat: (o) => velvet('#fff', { rough: 0.9, sheen: 0.3, ...o }), lie: true, flat: 0.75, lumpy: 0.12 },
  sweet: { ctrl: [[0, 0], [0.008, 0.008], [0.022, 0.035], [0.027, 0.07], [0.022, 0.105], [0.008, 0.13], [0, 0.135]], mat: (o) => velvet('#fff', { rough: 0.85, ...o }), lie: true, flat: 0.85, lumpy: 0.08, bend: 0.01 },
  beet: { ctrl: [[0, 0], [0.004, 0.006], [0.02, 0.018], [0.034, 0.04], [0.032, 0.058], [0.018, 0.068], [0.006, 0.07], [0, 0.07]], mat: (o) => velvet('#fff', { rough: 0.7, ...o }) },
  radish: { ctrl: [[0, 0], [0.003, 0.004], [0.012, 0.01], [0.018, 0.022], [0.016, 0.034], [0.006, 0.04], [0, 0.04]], mat: (o) => waxy('#fff', { rough: 0.3, ...o }) },
  daikon: { ctrl: [[0, 0], [0.008, 0.02], [0.022, 0.12], [0.028, 0.24], [0.026, 0.3], [0, 0.305]], mat: (o) => waxy('#fff', { rough: 0.5, ...o }), lie: true },
  eggplant: { ctrl: [[0, 0], [0.024, 0.006], [0.042, 0.04], [0.042, 0.09], [0.03, 0.15], [0.018, 0.19], [0.012, 0.205], [0, 0.21]], mat: (o) => waxy('#fff', { rough: 0.15, cc: 1, ccr: 0.05, ...o }), lie: true, bend: 0.02 },
  cucumber: { ctrl: [[0, 0], [0.012, 0.004], [0.022, 0.03], [0.024, 0.11], [0.022, 0.19], [0.012, 0.215], [0, 0.218]], mat: (o) => waxy('#fff', { rough: 0.4, ...o }), lie: true, bumps: 0.0012, bend: 0.008 },
  zucchini: { ctrl: [[0, 0], [0.014, 0.004], [0.02, 0.04], [0.022, 0.12], [0.02, 0.19], [0.012, 0.21], [0, 0.212]], mat: (o) => waxy('#fff', { rough: 0.35, ...o }), lie: true },
  carrot: { ctrl: [[0, 0], [0.002, 0.01], [0.007, 0.06], [0.013, 0.13], [0.016, 0.17], [0.014, 0.182], [0, 0.185]], mat: (o) => phys('#fff', { rough: 0.6, cc: 0.2, ...o, name: 'skin' }), lie: true, rings: true },
  pumpkin: { ctrl: [[0, 0.01], [0.06, 0.002], [0.12, 0.03], [0.15, 0.09], [0.13, 0.16], [0.07, 0.19], [0.02, 0.18], [0, 0.175]], mat: (o) => phys('#fff', { rough: 0.5, cc: 0.4, ...o, name: 'skin' }), ribs: 0.012, ribN: 10, seg: 64 },
  butternut: { ctrl: [[0, 0.002], [0.04, 0.006], [0.058, 0.04], [0.05, 0.09], [0.034, 0.13], [0.033, 0.2], [0.024, 0.24], [0, 0.245]], mat: (o) => phys('#fff', { rough: 0.55, ...o, name: 'skin' }), lie: true },
  cabbage: { ctrl: [[0, 0.004], [0.04, 0.004], [0.075, 0.03], [0.085, 0.075], [0.072, 0.12], [0.04, 0.145], [0, 0.15]], mat: (o) => phys('#fff', { rough: 0.45, cc: 0.4, ...o, name: 'leaf' }), veins: true, seg: 48 },
  garlic: { ctrl: [[0, 0.004], [0.012, 0.0], [0.026, 0.01], [0.03, 0.024], [0.024, 0.04], [0.01, 0.052], [0.003, 0.06], [0, 0.062]], mat: (o) => phys('#fff', { rough: 0.6, sheen: 0.6, sheenColor: '#ffffff', ...o, name: 'skin' }), ribs: 0.0025, ribN: 9 },
};
const COLS = {
  tomato: ['#d8221a', '#ef4a2a'], 'tomato-green': ['#7aa83a', '#b8c84a'], 'tomato-yellow': ['#f2b81a', '#f8d03a'], 'tomato-heirloom': ['#b8301a', '#5a6a2a'],
  onion: ['#c88a3a', '#e6b06a'], 'onion-red': ['#7a1e4a', '#a8406a'], 'onion-white': ['#f2eee0', '#e6e0c8'], shallot: ['#b86a4a', '#d89a6a'],
  potato: ['#c8a46a', '#a8844a'], 'potato-red': ['#a8323a', '#c85a4a'], sweet: ['#a8482a', '#c86a3a'],
  beet: ['#5a0e2a', '#7a1a3a'], 'beet-golden': ['#e0a02a', '#c8822a'], radish: ['#d81e4a', '#f05a7a'], daikon: ['#f6f4ec', '#e8e8d8'],
  eggplant: ['#2a0e2e', '#4a1a4e'], 'eggplant-white': ['#f4f2ea', '#e8e2d0'], 'eggplant-striped': ['#6a2a6a', '#f2e6f0'],
  cucumber: ['#2a5a1a', '#4a7a2a'], zucchini: ['#2f5a1a', '#5a8a3a'], 'zucchini-yellow': ['#f2c42a', '#f8d84a'],
  carrot: ['#ef6a12', '#f88a2a'], 'carrot-purple': ['#4a1a4a', '#6a2a5a'], 'carrot-yellow': ['#f2c02a', '#f8d44a'],
  pumpkin: ['#ef7a12', '#f89a3a'], 'pumpkin-white': ['#f2eee2', '#e2dcc8'], 'pumpkin-green': ['#3a5a2a', '#6a7a3a'], butternut: ['#e8b878', '#f0c890'],
  cabbage: ['#a8cc6a', '#d8e8a0'], 'cabbage-red': ['#5a1e5a', '#8a3a7a'], 'cabbage-savoy': ['#6a9a3a', '#a8c86a'],
  garlic: ['#f4f0e6', '#e8d8d0'], 'garlic-purple': ['#f0e8e6', '#b87a9a'],
};
const LCACHE = new Map();
function lv(name, col = name, cut = name) {
  const key = `${name}|${col}|${cut}`;
  if (LCACHE.has(key)) return LCACHE.get(key);
  const s = LV[name];
  const [a, b] = COLS[col] ?? COLS[name];
  let skin = paint2(a, b, 0.6);
  if (col === 'eggplant-striped') skin = (c, x, y, z, t, n) => { const an = Math.atan2(x, z); c.set(Math.sin(an * 7 + n * 4) > 0 ? a : b); };
  if (name === 'carrot') skin = (c, x, y, z, t, n) => { c.set(a).lerp(C(b), n * 0.5); if (Math.sin(y * 900 + n * 4) > 0.93) c.multiplyScalar(0.8); };
  if (name === 'pumpkin' || name === 'garlic' || name === 'onion' || name === 'shallot') skin = (c, x, y, z, t, n) => { const an = Math.atan2(x, z); const r = Math.cos(an * (s.ribN ?? 14)); c.set(a).lerp(C(b), 0.5 + r * 0.25 + (n - 0.5) * 0.5); if (name === 'garlic' && col === 'garlic-purple') c.lerp(C(b), Math.max(0, 0.6 - t)); };
  if (name === 'cabbage') skin = (c, x, y, z, t, n) => { const an = Math.atan2(x, z); const v = Math.abs(Math.sin(an * 4 + t * 3 + n * 2)); c.set(a).lerp(C(b), v < 0.12 ? 0.9 : n * 0.4); };
  if (name === 'cucumber') skin = (c, x, y, z, t, n) => { c.set(a).lerp(C(b), Math.max(0, n - 0.45) * 2); if (fbm(x * 300, y * 300, z * 300) > 0.7) c.lerp(C('#c8d890'), 0.5); };
  if (name === 'zucchini' && col === 'zucchini') skin = (c, x, y, z, t, n) => { c.set(a).lerp(C(b), fbm(x * 400, y * 60, z * 400) > 0.6 ? 0.8 : 0.1); };
  const cutKey = { tomato: col === 'tomato-yellow' ? 'yellowtomato' : col === 'tomato-green' ? 'greentomato' : 'tomato', roma: 'tomato', shallot: col === 'shallot' ? 'redonion' : 'onion', onion: col === 'onion-red' ? 'redonion' : 'onion', potato: 'potato', sweet: 'sweet', beet: col === 'beet-golden' ? 'goldbeet' : 'beet', radish: 'radish', daikon: 'radish', cabbage: col === 'cabbage-red' ? 'redcabbage' : 'cabbage' }[name] ?? name;
  const cc = { ...(CUT[cutKey] ?? CUT.potato) };
  if (name === 'daikon') cc.rind = '#f6f4ec';
  if (name === 'eggplant' && col === 'eggplant-white') cc.rind = '#f4f2ea';
  if (name === 'zucchini' && col === 'zucchini-yellow') cc.rind = '#f2c42a';
  if (name === 'carrot' && col !== 'carrot') { cc.flesh = COLS[col][0]; cc.flesh2 = COLS[col][1]; cc.rind = COLS[col][0]; }
  const displace = (v, t, an) => {
    const r = Math.hypot(v.x, v.z) || 1e-6;
    let k = 0;
    if (s.ribs) k -= Math.pow(Math.abs(Math.sin(an * (s.ribN ?? 6) / 2)), 0.6) * s.ribs * Math.sin(Math.min(1, t * 1.2) * PI) * -1 + s.ribs;
    if (s.bumps && fbm(v.x * 500, v.y * 500, v.z * 500) > 0.68) k += s.bumps;
    if (s.lumpy) k += (fbm(v.x * 60 + 5, v.y * 60, v.z * 60) - 0.5) * r * s.lumpy * 2;
    if (s.rings) k -= Math.max(0, Math.sin(v.y * 700)) ** 8 * 0.0008;
    v.x += (v.x / r) * k; v.z += (v.z / r) * k;
    if (s.flat) v.z *= s.flat;
    if (s.bend) v.z += Math.sin(t * PI) * s.bend;
  };
  const p = produce({ ...s, key: `veg-${key}`, skin, cut: cc, displace });
  p.spec = s;
  LCACHE.set(key, p);
  return p;
}
function place(parent, p, { at = [0, 0, 0], rotY = 0, name = 'veg', bites } = {}) {
  const holder = group(name, { parent, at, rot: [0, rotY, 0] });
  const g = group(`${name}_b`, { parent: holder });
  p.whole(g, { name: `${name}_skin`, bites });
  if (p.spec.lie) { g.rotation.z = PI / 2; g.position.set((p.H + p.Y0) / 2, p.R * (p.spec.flat ?? 1) * 0 + p.R, 0); }
  else g.position.y = -p.Y0;
  return { holder, g };
}

/* ---------------------------------------------------------- tops & details */
function calyx(parent, y, { n = 5, len = 0.018, color = '#3f7a22', stem = true } = {}) {
  for (let i = 0; i < n; i++) mesh(leafGeo(len, len * 0.32, { cup: 0, curl: -0.6 }), leafy(color), { parent, at: [0, y, 0], rot: [0, (i / n) * TAU, 0.15], name: `sepal${i}` });
  if (stem) mesh(new THREE.CylinderGeometry(0.0018, 0.0025, 0.012, 8), stemMat(color), { parent, at: [0, y + 0.005, 0], name: 'stem' });
}
function carrotTop(holder, y, scale = 1) {
  const m = leafy('#3f8a2a');
  const parent = group('greens', { parent: holder, at: [0, y, 0], rot: [0, 0, PI / 2] });
  y = 0;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU, L = (0.1 + (i % 3) * 0.03) * scale;
    curveTube([[0, 0, 0], [L * 0.3, Math.cos(a) * 0.006, Math.sin(a) * 0.01], [L * 0.7, Math.cos(a) * 0.02, Math.sin(a) * 0.03], [L, Math.cos(a) * 0.03 - 0.01, Math.sin(a) * 0.05]], 0.0012 * scale, m, { parent, segments: 10, radialSegments: 5, name: `frond${i}` }).position.set(y, 0, 0);
    for (let k = 0; k < 4; k++) mesh(leafGeo(0.018 * scale, 0.008 * scale, { serrate: 0.6, cup: 0.1 }), m, { parent, at: [y + L * (0.45 + k * 0.17), Math.cos(a) * 0.02 * (0.6 + k * 0.2) - k * 0.002, Math.sin(a) * 0.03 * (0.7 + k * 0.2)], rot: [a, k, 0.4], name: `leaflet${i}_${k}` });
  }
}
function onionTop(parent, y, p) {
  mesh(new THREE.ConeGeometry(0.004, 0.012, 8), phys('#a8743a', { rough: 0.9 }), { parent, at: [0, y + 0.004, 0], name: 'neck' });
  for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; curveTube([[0, p.Y0 + 0.002, 0], [Math.cos(a) * 0.006, p.Y0 - 0.002, Math.sin(a) * 0.006], [Math.cos(a) * 0.01, p.Y0 - 0.002, Math.sin(a) * 0.01]], 0.0006, phys('#e8dcb8', { rough: 1 }), { parent, segments: 4, radialSegments: 4, name: `root${i}` }); }
}

/* ---------------------------------------------------------- non-lathe builders */
function floret(parent, { color = '#3e7a2a', bud = '#4a8a32', at = [0, 0, 0], s = 1, name = 'floret', rand, cauli = false, romanesco = false }) {
  const g = group(name, { parent, at });
  const st = sweep([[0, 0, 0], [0.002 * s, 0.03 * s, 0], [0.004 * s, 0.055 * s, 0]], { r: (t) => (0.012 - t * 0.004) * s, sides: 10, seg: 6 });
  mesh(st, phys(cauli ? '#e8e8c8' : '#8ab85a', { rough: 0.6 }), { parent: g, name: `${name}_stalk` });
  const items = [];
  const cnt = romanesco ? 18 : 26;
  for (let i = 0; i < cnt; i++) {
    const a = rand() * TAU, k = Math.sqrt(rand());
    const R = 0.032 * s;
    items.push({ at: [Math.cos(a) * R * k * 0.9 + 0.004 * s, 0.055 * s + Math.sqrt(1 - k * k) * 0.02 * s, Math.sin(a) * R * k * 0.9], scale: (0.6 + rand() * 0.5) * s, rot: [rand(), rand(), rand()] });
  }
  items.push({ at: [0.004 * s, 0.056 * s, 0], scale: s });
  const geo = romanesco ? cached('romcone', () => new THREE.ConeGeometry(0.009, 0.018, 7)) : cached(cauli ? 'cauliball' : 'brocball', () => jitter(new THREE.IcosahedronGeometry(0.011, 1), rnd('b'), 0.18));
  scatter(g, geo, phys(cauli ? color : bud, { rough: cauli ? 0.8 : 0.9, sheen: 0.5, sheenColor: '#d8e8b0', flat: !cauli }), items, `${name}_buds`);
  return g;
}
function corn(parent, { at = [0, 0, 0], rotY = 0, husk = 'none', state = 'raw', white = false, rand, name = 'corn', s = 1 }) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const L = 0.2 * s, R = 0.024 * s;
  const kern = white ? '#f4ecc0' : state === 'grilled' ? '#e8a830' : '#f2c632';
  const cob = sweep([[-L / 2, 0, 0], [L / 2, 0, 0]], { r: (t) => R * (t < 0.06 ? 0.6 + t * 6.5 : t > 0.9 ? 0.55 + (1 - t) * 4.5 : 1), seg: 24, sides: 18 });
  mesh(cob, phys('#e8d8a0', { rough: 0.8 }), { parent: g, at: [0, R, 0], name: `${name}_cob` });
  const items = [];
  const rows = 14, cols = Math.round(32 * s);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const t = (i + 0.5) / cols;
    if (husk === 'eaten' && t > 0.25 && t < 0.7 && j < 9) continue;
    const a = (j / rows) * TAU + (i % 2) * (PI / rows);
    const rr = R * (t < 0.08 ? 0.6 + t * 5 : t > 0.9 ? 0.55 + (1 - t) * 4.5 : 1) * 0.96;
    const col = state === 'grilled' && fbm(i * 0.5, j * 0.7, 1) > 0.62 ? '#4a2a10' : white && rand() > 0.85 ? '#f2c632' : kern;
    items.push({ at: [-L / 2 + t * L, R + Math.sin(a) * rr, Math.cos(a) * rr], rot: [-a, 0, 0], color: col });
  }
  // kernels sized to pack the cob tightly in straight rows (no gaps showing the cob)
  const kw = (L / cols) * 1.02, kt = ((TAU * R) / rows) * 1.05;
  // smooth plump kernel: a squashed sphere, sunk into the cob so only its rounded crown shows
  const kGeo = cached(`kernelS${rows}x${cols}${s}`, () => {
    const k = new THREE.SphereGeometry(0.5, 12, 9);
    k.scale(kw * 1.08, 0.0085 * s, kt * 1.08);
    k.translate(0, 0.0012 * s, 0);
    k.computeVertexNormals();
    return k;
  });
  scatter(g, kGeo, glaze('#ffffff', { rough: 0.22, cc: 0.7 }), items, `${name}_kernels`);
  // closed, rounded ends (the cob was an open tube)
  for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(R * 0.62, 16, 10), phys('#e8d8a0', { rough: 0.8 }), { parent: g, at: [sx * L / 2, R, 0], scale: [0.5, 1, 1], name: `${name}_end` });
  if (state === 'buttered') mesh(roundedBox(0.03, 0.01, 0.02, 0.003), cream('#f8e08a'), { parent: g, at: [0.02, R * 2 + 0.003, 0], rot: [0, 0.3, 0], name: 'butter' });
  if (husk === 'peeled' || husk === 'full') {
    const hm = leafy(husk === 'full' ? '#9cc45a' : '#d8d08a', { rough: 0.7 });
    // husk leaves are solid and two-sided (they read as see-through film otherwise)
    Object.assign(hm, { transparent: false, opacity: 1, transmission: 0, side: THREE.DoubleSide });
    for (let k = 0; k < (husk === 'full' ? 8 : 5); k++) {
      const a = (k / (husk === 'full' ? 8 : 5)) * TAU;
      const pts = husk === 'full'
        ? [[-L / 2 - 0.02, R, 0], [-L * 0.2, R + Math.sin(a) * R * 1.15, Math.cos(a) * R * 1.15], [L * 0.3, R + Math.sin(a) * R * 1.05, Math.cos(a) * R * 1.05], [L / 2 + 0.02, R + Math.sin(a) * R * 0.3, Math.cos(a) * R * 0.3]]
        : [[-L / 2 + 0.01, R + Math.sin(a) * R, Math.cos(a) * R], [-L / 2 - 0.04, R + Math.sin(a) * R * 1.6, Math.cos(a) * R * 2.0], [-L / 2 - 0.1, 0.004 + Math.max(0, Math.sin(a)) * R * 1.2, Math.cos(a) * R * 3]];
      mesh(sweep(pts, { r: (t) => R * 0.55 * Math.sin(Math.max(0.15, Math.min(1, t * 1.3)) * PI * 0.9 + 0.1), ell: [1, 0.08], sides: 10, seg: 16 }), hm, { parent: g, name: `${name}_husk${k}` });
    }
    if (husk === 'full') for (let k = 0; k < 6; k++) curveTube([[L / 2 + 0.015, R, 0], [L / 2 + 0.04, R + (k - 3) * 0.003, (k - 2.5) * 0.004], [L / 2 + 0.06, 0.004, (k - 2.5) * 0.008]], 0.0006, phys('#a8743a', { rough: 1 }), { parent: g, segments: 6, radialSegments: 3, name: `${name}_silk${k}` });
  }
  return g;
}
function leafHead(parent, { kind = 'iceberg', rand, at = [0, 0, 0] }) {
  // layered cupped leaves (lettuce / savoy / romaine)
  const g = group(kind, { parent, at });
  const cols = { iceberg: ['#cfe69a', '#9cc45a'], romaine: ['#6aa83a', '#d8ec9a'], 'red-leaf': ['#7a2a3a', '#9ac45a'], butterhead: ['#a8d06a', '#e2f0a8'], savoy: ['#5a8a32', '#a8c86a'] }[kind];
  const romaine = kind === 'romaine';
  const layers = romaine ? 9 : 14;
  for (let i = 0; i < layers; i++) {
    const f = i / layers; // 0 = outer
    const R = romaine ? 0.03 : 0.075 * (1 - f * 0.55);
    const H = romaine ? 0.24 * (1 - f * 0.2) : 0.12 * (1 - f * 0.4);
    const open = romaine ? 0.25 : 1 - f;
    const th = PI * (0.42 + 0.28 * (1 - open));
    const geo = new THREE.SphereGeometry(1, 20, 12, 0, TAU * (romaine ? 0.42 : 0.55 + f * 0.3), PI - th, th);
    const pp = geo.attributes.position;
    for (let k = 0; k < pp.count; k++) {
      const x = pp.getX(k), y = pp.getY(k), z = pp.getZ(k);
      const ruffle = 1 + Math.sin(Math.atan2(x, z) * (kind === 'red-leaf' ? 14 : 9) + y * 6) * (0.04 + (y + 1) * 0.05) * (kind === 'iceberg' ? 0.4 : 1);
      pp.setXYZ(k, x * R * ruffle, (y + 1) * H, z * R * ruffle);
    }
    geo.computeVertexNormals();
    gradient(geo, [[0, cols[1]], [0.55, cols[1]], [1, cols[0]]], { noise: 0.15, scale: 60 });
    if (kind === 'red-leaf') gradient(geo, [[0, '#cfe69a'], [0.5, '#8ab84a'], [1, '#6a1e2e']], { noise: 0.2, scale: 50 });
    const m = mesh(geo, leafy('#fff', { vc: true, rough: 0.45, cc: 0.5 }), { parent: g, rot: [0, i * 2.4 + rand() * 0.3, 0], name: `leaf${i}` });
    m.position.y = 0.002 + f * 0.012;
  }
  mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.01, 12), phys('#e8ecc0', { rough: 0.6 }), { parent: g, at: [0, 0.005, 0], name: 'core' });
  return g;
}
function mushroom(parent, { kind = 'button', at = [0, 0, 0], rotY = 0, rotX = 0, name = 'mushroom', s = 1 }) {
  const g = group(name, { parent, at, rot: [rotX, rotY, 0] });
  const spec = {
    button: { capR: 0.022, capH: 0.016, stemH: 0.022, stemR: 0.008, cap: '#efe6d8', gill: '#c8a888', stem: '#f2ece0' },
    brown: { capR: 0.024, capH: 0.016, stemH: 0.022, stemR: 0.008, cap: '#8a5a3a', gill: '#6a4a3a', stem: '#e8dcc8' },
    portobello: { capR: 0.06, capH: 0.022, stemH: 0.03, stemR: 0.014, cap: '#6a4a32', gill: '#3a2a20', stem: '#e2d6c0' },
    shiitake: { capR: 0.03, capH: 0.012, stemH: 0.03, stemR: 0.006, cap: '#7a4a2a', gill: '#efe2c8', stem: '#e8dcc0' },
    'fly-agaric': { capR: 0.04, capH: 0.022, stemH: 0.07, stemR: 0.01, cap: '#d8201a', gill: '#f6f2e6', stem: '#f6f2e6' },
    chanterelle: { capR: 0.026, capH: -0.01, stemH: 0.035, stemR: 0.009, cap: '#f2a830', gill: '#f2b84a', stem: '#f2b84a' },
    enoki: { capR: 0.005, capH: 0.004, stemH: 0.09, stemR: 0.0018, cap: '#f6f2e0', gill: '#f6f2e0', stem: '#f6f2e0' },
  }[kind];
  const k = s;
  const stem = lathe([[0, 0], [spec.stemR * 1.25 * k, 0], [spec.stemR * 1.1 * k, spec.stemH * 0.2 * k], [spec.stemR * k, spec.stemH * k], [0, spec.stemH * k]], 16);
  mesh(stem, velvet(spec.stem, { rough: 0.7 }), { parent: g, name: `${name}_stem` });
  const R = spec.capR * k, Hc = spec.capH * k;
  const capPts = Hc > 0
    ? [[0, 0], [R * 0.4, 0.001], [R * 0.85, -Hc * 0.05], [R, Hc * 0.15], [R * 0.85, Hc * 0.65], [R * 0.45, Hc * 0.97], [0, Hc]]
    : [[0, 0.004 * k], [R * 0.5, 0.008 * k], [R, 0.016 * k], [R * 1.02, 0.02 * k], [R * 0.6, 0.012 * k], [0, 0.008 * k]];
  const capGeo = lathe(capPts, 28);
  gradient(capGeo, [[0, spec.gill], [0.3, spec.cap], [1, spec.cap]], { noise: 0.15, scale: 80 / k });
  mesh(capGeo, velvet('#fff', { vc: true, rough: kind === 'fly-agaric' ? 0.3 : 0.75, sheen: 0.4 }), { parent: g, at: [0, spec.stemH * k, 0], name: `${name}_cap` });
  if (kind === 'fly-agaric') {
    const r2 = rnd(name);
    const pts = [];
    for (let i = 0; i < 22; i++) { const a = r2() * TAU, d = Math.sqrt(r2()) * 0.85; pts.push({ at: [Math.cos(a) * R * d, spec.stemH * k + Hc * Math.sqrt(1 - d * d * 0.8) * 0.97, Math.sin(a) * R * d], scale: 0.8 + r2() * 0.6 }); }
    scatter(g, cached('wart', () => new THREE.SphereGeometry(0.0022, 8, 5).scale(1, 0.5, 1)), velvet('#f8f4ea'), pts, `${name}_spots`);
    mesh(new THREE.CylinderGeometry(spec.stemR * 1.4 * k, spec.stemR * k, 0.006 * k, 16, 1, true), velvet('#f6f2e6', { side: THREE.DoubleSide }), { parent: g, at: [0, spec.stemH * k * 0.75, 0], name: `${name}_ring` });
  }
  return g;
}
function pepper(parent, { color = '#d81e1a', at = [0, 0, 0], half = false, rings = false, name = 'pepper', rotY = 0 }) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const ctrl = [[0, 0.006], [0.016, 0.002], [0.034, 0.012], [0.04, 0.04], [0.042, 0.075], [0.036, 0.09], [0.014, 0.094], [0.006, 0.086], [0, 0.085]];
  const pts = [];
  { const c = new THREE.SplineCurve(ctrl.map(([r, y]) => new THREE.Vector2(r, y))); for (const p of c.getSpacedPoints(26)) pts.push(new THREE.Vector2(Math.max(p.x, 1e-4), p.y)); }
  const lobes = (geo, inward = 0) => {
    const pp = geo.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
      const an = Math.atan2(x, z), r = Math.hypot(x, z) || 1e-6;
      const lobe = Math.pow(Math.abs(Math.cos(an * 2)), 0.7) * 0.004 - 0.003 - inward;
      const bottomLobe = y < 0.012 ? Math.cos(an * 4) * 0.002 : 0;
      const k = (r + lobe + bottomLobe) / r;
      pp.setXYZ(i, x * k, y + (y < 0.01 ? Math.cos(an * 4) * 0.003 * (1 - y / 0.01) : 0), z * k);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const skin = waxy(color, { rough: 0.15, cc: 1, ccr: 0.04 });
  const innerMat = phys(toColor(color).lerp(new THREE.Color(1, 1, 1), 0.45), { rough: 0.5, side: THREE.BackSide, name: 'flesh' });
  if (rings) {
    for (let i = 0; i < 4; i++) {
      const rg = new THREE.TorusGeometry(0.036, 0.003, 6, 40).scale(1, 1, 1.8).rotateX(PI / 2);
      lobes(rg, 0.001);
      mesh(rg, skin, { parent: g, at: [(i - 1.5) * 0.05, 0.0055, (i % 2) * 0.02], name: `${name}_ring${i}` });
    }
    return g;
  }
  if (half) {
    const outer = lobes(new THREE.LatheGeometry(pts, 40, 0, PI));
    const inner = lobes(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(1e-4, p.x - 0.004), p.y)), 40, 0, PI), 0);
    const hg = group(`${name}_half`, { parent: g });
    mesh(outer, skin, { parent: hg, name: `${name}_skin` });
    mesh(inner, innerMat, { parent: hg, name: `${name}_wall` });
    // seed core
    mesh(new THREE.SphereGeometry(0.011, 12, 8).scale(1, 1.3, 1), phys('#f4eed0', { rough: 0.7 }), { parent: hg, at: [0.004, 0.074, 0], name: `${name}_core` });
    scatter(hg, cached('pseed', () => new THREE.SphereGeometry(0.002, 6, 4).scale(1, 0.4, 1)), phys('#f6eebc', { rough: 0.5 }), Array.from({ length: 18 }, (_, i) => ({ at: [0.006 + (i % 3) * 0.003, 0.064 + (i % 6) * 0.004, ((i % 5) - 2) * 0.004], rot: [i, i * 2, 0] })), `${name}_seeds`);
    mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.02, 8), stemMat('#3a6a1e'), { parent: hg, at: [0, 0.098, 0], name: `${name}_stem` });
    hg.rotation.z = -PI / 2; hg.position.set(-0.045, 0.042, 0);
    return g;
  }
  mesh(lobes(new THREE.LatheGeometry(pts, 40)), skin, { parent: g, name: `${name}_skin` });
  curveTube([[0, 0.084, 0], [0.002, 0.1, 0], [0.008, 0.112, 0]], 0.0045, stemMat('#3a6a1e'), { parent: g, segments: 8, radialSegments: 8, name: `${name}_stem` });
  mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.005, 12), stemMat('#4a7a2a'), { parent: g, at: [0, 0.086, 0], name: `${name}_cap` });
  return g;
}
function chili(parent, { color = '#c8121a', at = [0, 0, 0], rotY = 0, name = 'chili', s = 1 }) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const pts = [[0, 0.01, 0], [0.03, 0.008, 0.004], [0.07, 0.005, 0.012], [0.1, 0.004, 0.025]].map(([x, y, z]) => [x * s, y * s, z * s]);
  mesh(sweep(pts, { r: (t) => 0.008 * s * Math.min(1, (1 - t) * 1.6 + 0.05) * (t < 0.06 ? 0.75 + t * 4 : 1), sides: 14, seg: 24 }), waxy(color, { rough: 0.12, cc: 1 }), { parent: g, at: [0, 0.0, 0], name: `${name}_body` });
  curveTube([[0, 0.01 * s, 0], [-0.01 * s, 0.014 * s, 0], [-0.02 * s, 0.022 * s, 0.002]], 0.0016 * s, stemMat('#3a7a22'), { parent: g, segments: 8, radialSegments: 6, name: `${name}_stem` });
  mesh(new THREE.SphereGeometry(0.0055 * s, 10, 6, 0, TAU, 0, PI / 2).rotateZ(PI / 2), stemMat('#3a7a22'), { parent: g, at: [0.002 * s, 0.01 * s, 0], name: `${name}_cap` });
  return g;
}
function asparagus(parent, { color = '#5a8a2a', tip = '#5a4a6a', at = [0, 0, 0], n = 9, banded = true, grilled = false, rand }) {
  const g = group('asparagus', { parent, at });
  const spears = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, rr = i === 0 ? 0 : 0.009 + (i % 2) * 0.004;
    const z = Math.cos(a) * rr, y = 0.007 + Math.sin(a) * rr * 0.6 + (i === 0 ? 0 : 0.006);
    const L = 0.2 + rand() * 0.02;
    const sp = sweep([[-L / 2, y, z], [L / 2, y + 0.002, z]], { r: (t) => 0.006 * (t > 0.88 ? 0.5 + (1 - t) * 4 : 1), sides: 10, seg: 16 });
    vcolor(sp, (x, yy, zz, c) => { const t = (x + L / 2) / L; c.set(color).lerp(C('#c8d8a0'), Math.max(0, 0.3 - t) * 2).lerp(C(tip), t > 0.86 ? 0.7 : 0); if (grilled && Math.sin(x * 160) > 0.9) c.set('#2a1e10'); });
    mesh(sp, phys('#fff', { vc: true, rough: 0.5, cc: 0.4 }), { parent: g, name: `spear${i}` });
    spears.push(y);
  }
  if (banded) mesh(new THREE.TorusGeometry(0.02, 0.004, 6, 24).rotateY(PI / 2).scale(1, 0.85, 1), phys('#7a3ad8', { rough: 0.6 }), { parent: g, at: [-0.03, 0.014, 0], name: 'band' });
  return g;
}
function peaPod(parent, { open = true, at = [0, 0, 0], rotY = 0, name = 'pod' }) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const L = 0.09;
  const pts = [[-L / 2, 0.006, 0], [0, 0.009, 0.004], [L / 2, 0.006, 0]];
  const geo = sweep(pts, { r: (t) => 0.009 * Math.sin(Math.max(0.05, t) * PI) ** 0.6, ell: open ? [1.6, 1] : [1, 0.75], sides: 16, seg: 24 });
  if (open) {
    // open the pod: keep the lower half of the section
    const pp = geo.attributes.position;
    for (let i = 0; i < pp.count; i++) if (pp.getY(i) > 0.008) pp.setY(i, 0.008 - (pp.getY(i) - 0.008) * 0.2);
    geo.computeVertexNormals();
  }
  mesh(geo, waxy('#6ab83a', { rough: 0.4, side: THREE.DoubleSide }), { parent: g, name: `${name}_shell` });
  if (open) scatter(g, cached('pea', () => new THREE.SphereGeometry(0.0055, 12, 8)), waxy('#7cc84a', { cc: 0.6 }), Array.from({ length: 7 }, (_, i) => ({ at: [-L * 0.33 + (i * L * 0.66) / 6, 0.0085, 0.0015] })), `${name}_peas`);
  return g;
}

/* ---------------------------------------------------------- factory */
export const VEG_VARIANTS = {
  carrot: {}, tomato: {}, cucumber: {}, zucchini: {}, lettuce: {}, cabbage: {}, broccoli: {}, cauliflower: {}, corn: {}, potato: {}, 'sweet-potato': {},
  onion: {}, garlic: {}, 'bell-pepper': {}, chili: {}, eggplant: {}, pumpkin: {}, butternut: {}, mushroom: {}, radish: {}, beet: {}, asparagus: {}, peas: {},
};
function slicedOnBoard(root, p, { n = 6, end = true, th } = {}) {
  const top = board(root, { w: 0.32, d: 0.2 });
  const g = group('on_board', { parent: root, at: [0, top, 0] });
  for (let i = 0; i < n; i++) {
    const y = p.Y0 + ((p.H - p.Y0) * (i + 2)) / (n + 4);
    p.round(g, { y, th: th ?? Math.max(0.004, p.R * 0.18), at: [-0.12 + i * p.R * 1.5 * 0.75 + p.R, 0, (i % 2) * 0.02 - 0.03], name: `slice_${i}` });
  }
  if (end) {
    if (p.spec.lie) p.halfUp(g, { at: [0.07, 0, 0.05], name: 'piece' });
    else p.halfCross(g, { at: [0.08, 0, 0.05], name: 'piece' });
  }
  return g;
}
function pileOf(root, fn, R, n = 4) {
  const pos = [[-R, 0, -R * 0.6], [R, 0, -R * 0.6], [0, 0, R * 1.1], [0, R * 1.3, -R * 0.1], [R * 2.1, 0, R * 0.6]];
  for (let i = 0; i < n; i++) fn(pos[i], i);
}

export const createVegetable = make('vegetable', VEG_VARIANTS, (ctx) => {
  const { variant, trim, root, rand, animations } = ctx;
  switch (variant) {
    case 'carrot': {
      const col = trim === 'purple' ? 'carrot-purple' : trim === 'yellow' ? 'carrot-yellow' : 'carrot';
      const p = lv('carrot', col);
      if (trim === 'sliced') { slicedOnBoard(root, p, { n: 8, th: 0.005 }); break; }
      if (trim === 'bunch') { for (let i = 0; i < 4; i++) { const { g } = place(root, p, { at: [0, i === 3 ? 0.028 : 0, (i % 3 - 1) * 0.03], rotY: (i - 1.5) * 0.12, name: `carrot${i}` }); carrotTop(g, p.H - 0.004); } mesh(new THREE.TorusGeometry(0.03, 0.003, 6, 20).rotateY(PI / 2), phys('#c8a060', { rough: 0.9 }), { parent: root, at: [-0.085, 0.02, 0], scale: [1, 0.9, 1.2], name: 'twine' }); break; }
      if (trim === 'baby') { pileOf(root, (q, i) => { const h = place(root, lv('carrot', col), { at: [q[0] * 0.6, q[1] * 0.4, q[2] * 0.6], rotY: i * 1.3, name: `baby${i}` }); h.holder.scale.setScalar(0.45); }, 0.03, 5); break; }
      const { g } = place(root, p);
      if (trim !== 'no-top') carrotTop(g, p.H - 0.004);
      break;
    }
    case 'tomato': {
      if (trim === 'vine') {
        const items = [];
        const stalk = curveTube([[-0.08, 0.05, 0], [-0.02, 0.055, 0.005], [0.04, 0.05, -0.005], [0.09, 0.045, 0]], 0.0022, stemMat('#4a7a2a'), { parent: root, segments: 20, radialSegments: 6, name: 'vine' });
        void stalk; void items;
        const sm = lv('tomato');
        for (let i = 0; i < 6; i++) { const x = -0.065 + i * 0.028; const h = place(root, sm, { at: [x, 0, (i % 2 ? 1 : -1) * 0.012], rotY: i, name: `cherry${i}` }); h.holder.scale.setScalar(0.48); curveTube([[x, 0.05, 0], [x, 0.04, (i % 2 ? 1 : -1) * 0.01], [x, 0.026, (i % 2 ? 1 : -1) * 0.012]], 0.0012, stemMat('#4a7a2a'), { parent: root, segments: 6, radialSegments: 4, name: `pedicel${i}` }); calyx(h.g, sm.H - 0.002, { len: 0.018, stem: false }); }
        break;
      }
      const name = trim === 'plum' ? 'roma' : 'tomato';
      const col = trim === 'green' ? 'tomato-green' : trim === 'yellow' ? 'tomato-yellow' : trim === 'heirloom' ? 'tomato-heirloom' : 'tomato';
      if (trim === 'heirloom') LV.tomato.ribs = 0.0035;
      const p = lv(name, col);
      LV.tomato.ribs = 0.0012;
      if (trim === 'halved') { p.halfCross(root, { at: [-0.042, 0, 0], name: 'halfA' }); p.halfCross(root, { at: [0.042, 0, 0], name: 'halfB' }); break; }
      if (trim === 'sliced') { slicedOnBoard(root, p, { n: 4, th: 0.008 }); break; }
      if (trim === 'pile') { pileOf(root, (q, i) => { const h = place(root, p, { at: q, rotY: i, name: `tomato${i}` }); calyx(h.g, p.H - 0.002); }, 0.038, 4); break; }
      const { g } = place(root, p);
      calyx(g, p.H - 0.002, { n: 6, len: 0.022 });
      break;
    }
    case 'cucumber': case 'zucchini': {
      const col = trim === 'yellow' ? 'zucchini-yellow' : variant;
      const p = lv(variant, col);
      if (trim === 'sliced') { slicedOnBoard(root, p, { n: 7, th: 0.005 }); break; }
      if (trim === 'halved') { p.halfUp(root, { at: [0, 0, -0.026], name: 'halfA' }); p.halfUp(root, { at: [0, 0, 0.026], rotY: PI, name: 'halfB' }); break; }
      if (trim === 'mini') { for (let i = 0; i < 3; i++) { const h = place(root, p, { at: [0, 0, (i - 1) * 0.03], name: `mini${i}` }); h.holder.scale.setScalar(0.55); } break; }
      if (trim === 'pile') { pileOf(root, (q, i) => place(root, p, { at: [q[0] * 0.2, q[1] * 0.75, q[2] * 1.1], rotY: (i - 1) * 0.15, name: `veg${i}` }), 0.024, 4); break; }
      if (trim === 'spiralized') { const b = plate(root, { r: 0.12 }); for (let i = 0; i < 9; i++) { const pts = []; for (let k = 0; k <= 30; k++) { const t = k / 30; pts.push([Math.cos(t * 12 + i) * 0.03 * (1 - t * 0.4) + (i % 3 - 1) * 0.02, b.top + 0.003 + Math.abs(Math.sin(t * 6 + i)) * 0.012, Math.sin(t * 12 + i) * 0.03 + (Math.floor(i / 3) - 1) * 0.02]); } curveTube(pts, 0.0022, flesh('#e2eeb0'), { parent: root, segments: 60, radialSegments: 5, name: `noodle${i}` }); } break; }
      place(root, p);
      if (variant === 'zucchini') mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.02, 8).rotateZ(PI / 2), stemMat('#8aa85a'), { parent: root, at: [p.H / 2 + 0.006, p.R, 0], name: 'stem' });
      break;
    }
    case 'lettuce': leafHead(root, { kind: trim ?? 'iceberg', rand }); break;
    case 'cabbage': {
      if (trim === 'napa') { leafHead(root, { kind: 'romaine', rand }); root.children[0].scale.set(1.6, 1, 1.6); break; }
      if (trim === 'savoy') { leafHead(root, { kind: 'savoy', rand }); break; }
      const col = trim === 'red' ? 'cabbage-red' : 'cabbage';
      const p = lv('cabbage', col);
      if (trim === 'halved') { p.halfUp(root, { at: [0, 0, -0.088], name: 'halfA' }); p.halfUp(root, { at: [0, 0, 0.088], rotY: PI, name: 'halfB' }); break; }
      if (trim === 'shredded') { const b = bowl(root, { r: 0.09, h: 0.06 }); const items = []; for (let i = 0; i < 200; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * 0.065; items.push({ at: [Math.cos(a) * d, b.floor + 0.004 + rand() * 0.035, Math.sin(a) * d], rot: [rand() * 3, rand() * 3, rand() * 3] }); } items.push({ at: [0, b.floor + 0.003, 0] }); scatter(root, cached('shred', () => new THREE.BoxGeometry(0.025, 0.0015, 0.003)), leafy(col === 'cabbage' ? '#d8eaa0' : '#7a2a6a'), items, 'shreds'); break; }
      place(root, p);
      // loose outer leaves
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; mesh(leafGeo(0.11, 0.09, { cup: 0.5, curl: -0.25 }), leafy(col === 'cabbage' ? '#7aa83a' : '#5a1e5a'), { parent: root, at: [Math.cos(a) * 0.035, 0.004, Math.sin(a) * 0.035], rot: [0, -a, 0.55], name: `outer${i}` }); }
      break;
    }
    case 'broccoli': case 'cauliflower': {
      const cauli = variant === 'cauliflower';
      const cc = cauli ? ({ purple: '#7a3a8a', orange: '#f2a03a', romanesco: '#a8d04a' }[trim] ?? '#f4eedc') : null;
      if (trim === 'florets') { const b = bowl(root, { r: 0.08, h: 0.05 }); for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; floret(root, { at: [Math.cos(a) * 0.03, b.floor, Math.sin(a) * 0.03], s: 0.5, name: `floret${i}`, rand, cauli, color: cc ?? '#3e7a2a' }).rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); } break; }
      const bud = trim === 'purple' ? '#5a3a7a' : '#3a6a26';
      const g = group('head', { parent: root });
      const parts = trim === 'romanesco' ? 7 : 9;
      for (let i = 0; i < parts; i++) {
        const a = (i / parts) * TAU;
        const f = floret(g, { at: [Math.cos(a) * 0.012, 0.03, Math.sin(a) * 0.012], s: 1.1, name: `floret${i}`, rand, cauli, color: cc ?? '#fff', bud, romanesco: trim === 'romanesco' });
        f.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      }
      mesh(lathe([[0, 0], [0.02, 0], [0.018, 0.03], [0.026, 0.045], [0, 0.045]], 16), phys(cauli ? '#e2e6c0' : '#7aa84a', { rough: 0.6 }), { parent: g, name: 'trunk' });
      if (cauli) for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; mesh(leafGeo(0.13, 0.07, { cup: 0.4, curl: -0.3 }), leafy('#5a8a3a'), { parent: g, at: [Math.cos(a) * 0.01, 0.012, Math.sin(a) * 0.01], rot: [0, -a, 0.9], name: `leaf${i}` }); }
      break;
    }
    case 'corn': {
      if (trim === 'baby') { for (let i = 0; i < 5; i++) corn(root, { at: [0, 0, (i - 2) * 0.022], rotY: (i - 2) * 0.1, rand, name: `baby${i}`, s: 0.45 }); break; }
      if (trim === 'on-plate') { const t = plate(root, { r: 0.13 }).top; corn(root, { at: [0, t, 0], state: 'buttered', rand }); break; }
      corn(root, { husk: trim === 'in-husk' ? 'full' : trim === 'husk-back' ? 'peeled' : trim === 'eaten' ? 'eaten' : 'none', state: trim === 'grilled' ? 'grilled' : trim === 'buttered' ? 'buttered' : 'raw', white: trim === 'white', rand });
      break;
    }
    case 'potato': case 'sweet-potato': {
      const sweetP = variant === 'sweet-potato';
      const col = sweetP ? 'sweet' : trim === 'red' ? 'potato-red' : 'potato';
      const p = lv(sweetP ? 'sweet' : 'potato', col);
      if (trim === 'halved') { p.halfUp(root, { at: [0, 0, -0.03], name: 'halfA' }); p.halfUp(root, { at: [0, 0, 0.03], rotY: PI, name: 'halfB' }); break; }
      if (trim === 'pile' || trim === 'sack') {
        if (trim === 'sack') { const v = bowl(root, { r: 0.1, h: 0.12, mat: phys('#b89a6a', { rough: 1, sheen: 0.6, side: THREE.DoubleSide, name: 'burlap' }), wall: 0.003, foot: false }); void v; for (let i = 0; i < 4; i++) { const a = i * 1.7; place(root, p, { at: [Math.cos(a) * 0.04, 0.003 + (i > 2 ? 0.05 : 0), Math.sin(a) * 0.04], rotY: a, name: `potato${i}` }); } }
        else pileOf(root, (q, i) => place(root, p, { at: q, rotY: i * 1.4, name: `potato${i}` }), 0.04, 5);
        break;
      }
      if (trim === 'baked') {
        const t = plate(root, { r: 0.12 }).top;
        const g = group('baked', { parent: root, at: [0, t, 0] });
        mesh(new THREE.SphereGeometry(0.05, 24, 12, 0, TAU, PI / 2, PI / 2).scale(1.1, 0.4, 0.8), foil(), { parent: g, at: [0, 0.02, 0], name: 'foil' });
        p.halfUp(g, { at: [0, 0.004, 0], name: 'potato' });
        mesh(roundedBox(0.02, 0.012, 0.016, 0.004), cream('#fae49a'), { parent: g, at: [0, p.R + 0.008, 0], name: 'butter' });
        scatter(g, cached('chive', () => new THREE.CylinderGeometry(0.001, 0.001, 0.006, 4).rotateZ(PI / 2)), leafy('#3a8a2a'), Array.from({ length: 16 }, (_, i) => ({ at: [((i % 5) - 2) * 0.01, p.R + 0.005, (Math.floor(i / 5) - 1.5) * 0.008], rot: [0, i, 0] })), 'chives');
        break;
      }
      if (trim === 'wedges') { const t = board(root); for (let i = 0; i < 6; i++) p.wedge(root, { angle: PI / 3, at: [-0.08 + (i % 3) * 0.07, t, i < 3 ? -0.04 : 0.04], rotY: i < 3 ? 0 : PI, name: `wedge${i}` }); break; }
      place(root, p);
      // eyes
      const eyes = surfacePoints(p.pts, 6, rand, { tMin: 0.2, tMax: 0.8 });
      const holder = root.children[0].children[0];
      scatter(holder, cached('eye', () => new THREE.SphereGeometry(0.0018, 6, 4)), phys('#6a4a2a', { rough: 1 }), eyes.map((e) => ({ at: [e.at[0] * 0.95, e.at[1], e.at[2] * 0.95 * (p.spec.flat ?? 1)] })), 'eyes');
      break;
    }
    case 'onion': {
      const col = trim === 'red' ? 'onion-red' : trim === 'white' ? 'onion-white' : 'onion';
      if (trim === 'spring') { for (let i = 0; i < 5; i++) { const z = (i - 2) * 0.012; const bulb = sweep([[-0.12, 0.008, z], [-0.1, 0.008, z], [0.1, 0.006, z * 1.5], [0.18, 0.005, z * 2.2]], { r: (t) => (t < 0.08 ? 0.007 * (0.4 + t * 8) : t < 0.25 ? 0.008 - (t - 0.08) * 0.02 : 0.0045), sides: 12, seg: 30 }); vcolor(bulb, (x, y, zz, c) => { const t = (x + 0.12) / 0.3; c.set(t < 0.2 ? '#f6f4ea' : '#4a9a2a').lerp(C('#c8e0a0'), t > 0.2 && t < 0.3 ? 0.6 : 0); }); mesh(bulb, phys('#fff', { vc: true, rough: 0.4, cc: 0.4 }), { parent: root, name: `scallion${i}` }); } break; }
      const p = lv(trim === 'shallot' ? 'shallot' : 'onion', trim === 'shallot' ? 'shallot' : col);
      if (trim === 'halved') { p.halfUp(root, { at: [0, 0, -0.042], name: 'halfA' }); p.halfUp(root, { at: [0, 0, 0.042], rotY: PI, name: 'halfB' }); break; }
      if (trim === 'rings') { const t = board(root); for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) { const r = 0.012 + k * 0.009; mesh(new THREE.TorusGeometry(r, 0.0025, 6, 32).rotateX(PI / 2), flesh(col === 'onion-red' ? '#d8a8c8' : '#f4f0dc', { opacity: 0.92, transparent: true }), { parent: root, at: [-0.1 + i * 0.05, t + 0.0025, (i % 2) * 0.03 - 0.015], name: `ring${i}_${k}` }); } break; }
      if (trim === 'pile') { pileOf(root, (q, i) => { const h = place(root, p, { at: q, rotY: i, name: `onion${i}` }); onionTop(h.g, p.H - 0.004, p); }, 0.04, 4); break; }
      const { g } = place(root, p);
      onionTop(g, p.H - 0.004, p);
      break;
    }
    case 'garlic': {
      const p = lv('garlic', trim === 'purple' ? 'garlic-purple' : 'garlic');
      const cloveGeo = cached('clove', () => { const g = new THREE.SphereGeometry(0.008, 14, 10); const pp = g.attributes.position; for (let i = 0; i < pp.count; i++) { const y = pp.getY(i); pp.setY(i, y * 2.2); const k = 1 - Math.max(0, y / 0.008) * 0.5; pp.setX(i, pp.getX(i) * k); pp.setZ(i, pp.getZ(i) * k * 0.8); } g.computeVertexNormals(); return g; });
      if (trim === 'cloves' || trim === 'peeled') {
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; mesh(cloveGeo, trim === 'peeled' ? flesh('#f6f0d0') : phys('#f2ece0', { rough: 0.6, sheen: 0.6, sheenColor: '#fff' }), { parent: root, at: [Math.cos(a) * 0.03, 0.007, Math.sin(a) * 0.03], rot: [0, a, PI / 2], name: `clove${i}` }); }
        if (trim === 'cloves') { const { g } = place(root, p, { at: [0, 0, 0] }); g.scale.setScalar(0.7); }
        break;
      }
      if (trim === 'braid') { for (let i = 0; i < 5; i++) { const { g } = place(root, p, { at: [(i - 2) * 0.05, 0, (i % 2) * 0.02], rotY: i, name: `bulb${i}` }); g.scale.setScalar(0.85); } curveTube([[-0.12, 0.03, 0.01], [0, 0.05, 0.03], [0.12, 0.03, 0.01]], 0.006, phys('#d8c8a0', { rough: 1 }), { parent: root, name: 'stalks' }); break; }
      const { g } = place(root, p);
      onionTop(g, p.H - 0.004, p);
      break;
    }
    case 'bell-pepper': {
      const color = { red: '#c8121a', yellow: '#f2b80a', orange: '#f2700a', green: '#2f7a1a' }[trim] ?? '#c8121a';
      if (trim === 'halved') { pepper(root, { color, half: true, at: [0, 0, -0.03], name: 'pA' }); pepper(root, { color: '#f2b80a', half: true, at: [0, 0, 0.05], rotY: PI, name: 'pB' }); break; }
      if (trim === 'rings') { const t = board(root); pepper(root, { color: '#c8121a', rings: true, at: [0, t, -0.04], name: 'r1' }); pepper(root, { color: '#f2b80a', rings: true, at: [0.02, t, 0.04], name: 'r2' }); break; }
      if (trim === 'trio') { pepper(root, { color: '#c8121a', at: [-0.045, 0, 0], name: 'p1' }); pepper(root, { color: '#f2b80a', at: [0.045, 0, -0.01], rotY: 1, name: 'p2' }); pepper(root, { color: '#2f7a1a', at: [0, 0, 0.07], rotY: 2, name: 'p3' }); break; }
      if (trim === 'stuffed') {
        const t = plate(root, { r: 0.13 }).top;
        for (const [i, x] of [[0, -0.045], [1, 0.045]]) {
          const g = pepper(root, { color: i ? '#f2b80a' : '#c8121a', at: [x, t, 0], name: `stuffed${i}` });
          g.scale.set(1, 0.85, 1);
          mesh(new THREE.SphereGeometry(0.034, 18, 10, 0, TAU, 0, PI / 2), phys('#b8502a', { rough: 0.7, vc: true }), { parent: g, at: [0, 0.084, 0], name: `filling${i}` });
          vcolor(g.children[g.children.length - 1].geometry, (xx, y, z, c) => c.set(fbm(xx * 300, y * 300, z * 300) > 0.55 ? '#f2e6c0' : '#a8402a'));
          mesh(new THREE.SphereGeometry(0.03, 16, 8, 0, TAU, 0, PI / 3), cream('#f6d36a'), { parent: g, at: [0, 0.092, 0], name: `cheese${i}` });
          g.remove(g.getObjectByName(`stuffed${i}_stem`));
        }
        break;
      }
      pepper(root, { color });
      break;
    }
    case 'chili': {
      const color = trim === 'green' ? '#3a8a22' : trim === 'yellow' ? '#f2c21a' : '#c8121a';
      if (trim === 'bunch') { for (let i = 0; i < 6; i++) chili(root, { color: i % 3 ? '#c8121a' : '#3a8a22', at: [0, 0, (i - 2.5) * 0.014], rotY: (i - 2.5) * 0.18, name: `chili${i}` }); break; }
      if (trim === 'dried') { for (let i = 0; i < 5; i++) chili(root, { color: '#7a120e', at: [0, 0, (i - 2) * 0.014], rotY: (i - 2) * 0.3, name: `chili${i}`, s: 0.8 }); break; }
      chili(root, { color, s: trim === 'jalapeno' ? 0.8 : 1.2 });
      if (trim === 'jalapeno') root.children[0].scale.set(1, 1.6, 1.6);
      break;
    }
    case 'eggplant': {
      const col = trim === 'white' ? 'eggplant-white' : trim === 'striped' ? 'eggplant-striped' : 'eggplant';
      const p = lv('eggplant', col);
      if (trim === 'halved') { p.halfUp(root, { at: [0, 0, -0.045], name: 'halfA' }); p.halfUp(root, { at: [0, 0, 0.045], rotY: PI, name: 'halfB' }); break; }
      if (trim === 'sliced') { slicedOnBoard(root, p, { n: 5, th: 0.01 }); break; }
      if (trim === 'grilled') { const t = plate(root, { r: 0.14 }).top; for (let i = 0; i < 4; i++) { const g = p.round(root, { y: 0.06 + i * 0.03, th: 0.009, at: [(i - 1.5) * 0.06, t, (i % 2) * 0.03], name: `grill${i}` }); g.scale.set(1.2, 1, 0.9); for (let k = -2; k <= 2; k++) mesh(new THREE.BoxGeometry(0.065, 0.0008, 0.004), phys('#2a1a10', { rough: 0.9 }), { parent: root, at: [(i - 1.5) * 0.06, t + 0.0092, (i % 2) * 0.03 + k * 0.012], rot: [0, 0.6, 0], name: `char${i}_${k}` }); } break; }
      const { holder } = place(root, p);
      if (trim === 'baby') holder.scale.setScalar(0.5);
      const cap = group('calyx', { parent: root.children[0].children[0], at: [0, p.H - 0.012, 0] });
      for (let i = 0; i < 5; i++) mesh(leafGeo(0.035, 0.022, { cup: 0.6, curl: 0.5 }), leafy('#3a6a22'), { parent: cap, rot: [0, (i / 5) * TAU, -1.2], name: `sepal${i}` });
      mesh(new THREE.CylinderGeometry(0.005, 0.007, 0.03, 8), stemMat('#4a6a2a'), { parent: cap, at: [0, 0.018, 0], name: 'stem' });
      break;
    }
    case 'pumpkin': case 'butternut': {
      if (variant === 'butternut') {
        const p = lv('butternut');
        if (trim === 'halved') { p.halfUp(root, { at: [0, 0, -0.06], name: 'halfA' }); p.halfUp(root, { at: [0, 0, 0.06], rotY: PI, name: 'halfB' }); break; }
        if (trim === 'cubed') { const b = bowl(root, { r: 0.08, h: 0.05 }); const items = []; for (let i = 0; i < 30; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * 0.05; items.push({ at: [Math.cos(a) * d, b.floor + 0.008 + rand() * 0.02, Math.sin(a) * d], rot: [rand(), rand(), rand()] }); } items.push({ at: [0, b.floor + 0.007, 0] }); scatter(root, cached('cube16', () => roundedBox(0.016, 0.016, 0.016, 0.002, 1)), flesh('#f8981a'), items, 'cubes'); break; }
        place(root, p);
        mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.02, 8).rotateZ(PI / 2), stemMat('#8a7a4a'), { parent: root, at: [-p.H / 2 - 0.006 + p.H, p.R, 0], name: 'stem' });
        break;
      }
      const col = trim === 'white' ? 'pumpkin-white' : trim === 'green' ? 'pumpkin-green' : 'pumpkin';
      const p = lv('pumpkin', col);
      const stem = (parent, s = 1) => curveTube([[0, p.H - 0.012, 0], [0.004 * s, p.H + 0.02 * s, 0], [0.016 * s, p.H + 0.04 * s, 0.004]], 0.01 * s, phys('#6a5a32', { rough: 0.9 }), { parent, segments: 10, radialSegments: 8, name: 'stem' });
      if (trim === 'mini' || trim === 'pile') {
        const pos = trim === 'mini' ? [[0, 0, 0]] : [[-0.06, 0, 0], [0.06, 0, 0.01], [0, 0, 0.09]];
        pos.forEach((q, i) => { const { holder, g } = place(root, i === 2 ? lv('pumpkin', 'pumpkin-white') : p, { at: q, rotY: i, name: `pumpkin${i}` }); holder.scale.setScalar(0.38); stem(g); });
        break;
      }
      if (trim === 'halved') { p.halfUp(root, { at: [0, 0, -0.16], name: 'halfA' }); p.halfUp(root, { at: [0, 0, 0.16], rotY: PI, name: 'halfB' }); break; }
      const { g } = place(root, p);
      stem(g);
      if (trim === 'carved') {
        const lamp = lampGroup('candle', 'amber');
        const shapes = [
          [[-0.06, 0.12], [-0.03, 0.12], [-0.045, 0.145]], [[0.03, 0.12], [0.06, 0.12], [0.045, 0.145]], [[-0.012, 0.1], [0.012, 0.1], [0, 0.118]],
          [[-0.07, 0.07], [-0.04, 0.055], [-0.02, 0.06], [-0.01, 0.045], [0.01, 0.045], [0.02, 0.06], [0.04, 0.055], [0.07, 0.07], [0.04, 0.035], [0, 0.03], [-0.04, 0.035]],
        ];
        shapes.forEach((sh) => {
          const geo = extrudeOutline(sh, 0.03, { bevel: 0.001, segments: 1 });
          geo.translate(0, 0, 0.13);
          lamp.add(g, { geometry: geo, depth: 0.02 });
        });
        lamp.meshes.forEach((m) => { m.material.color.set('#2a1406'); });
        animations.push(clip('on', 1.2, [...lampTracks('candle', LAMP_ON.amber), numberTrack('candle.material.emissiveIntensity', 1.2, (t) => 2 + Math.sin(t * TAU * 3) * 0.5 + Math.sin(t * TAU * 7) * 0.3, 24)]));
      }
      break;
    }
    case 'mushroom': {
      const kind = ['brown', 'portobello', 'shiitake', 'fly-agaric', 'chanterelle', 'enoki'].includes(trim) ? trim : 'button';
      if (trim === 'cluster' || kind === 'enoki') {
        const n = kind === 'enoki' ? 22 : 6;
        for (let i = 0; i < n; i++) { const a = rand() * TAU, d = (kind === 'enoki' ? 0.008 : 0.02) * Math.sqrt(rand()); mushroom(root, { kind, at: [Math.cos(a) * d, 0, Math.sin(a) * d], rotX: (rand() - 0.5) * 0.3, name: `m${i}`, s: kind === 'enoki' ? 0.8 + rand() * 0.3 : 0.6 + rand() * 0.6 }); }
        if (kind === 'enoki') mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.02, 14), velvet('#e6dcc0'), { parent: root, at: [0, 0.01, 0], name: 'base' });
        break;
      }
      if (trim === 'sliced') {
        const t = board(root);
        for (let i = 0; i < 5; i++) {
          const s = new THREE.Shape(); s.moveTo(-0.006, 0); s.lineTo(-0.006, 0.02); s.absellipse(0, 0.02, 0.022, 0.016, PI, 0, true); s.lineTo(0.006, 0.02); s.lineTo(0.006, 0); s.lineTo(-0.006, 0);
          const geo = extrudeOutline(s, 0.004, { bevel: 0.0008, segments: 1 });
          mesh(geo, velvet('#efe2cc'), { parent: root, at: [-0.08 + i * 0.04, t + 0.002, 0], rot: [-PI / 2, 0, 0.3 * i], name: `slice${i}` });
        }
        break;
      }
      if (trim === 'basket') {
        const b = bowl(root, { r: 0.08, h: 0.05, mat: woodMat('#c8a06a'), wall: 0.004, foot: false });
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; mushroom(root, { kind: 'brown', at: [Math.cos(a) * 0.035, b.floor, Math.sin(a) * 0.035], rotX: 0.3, rotY: a, name: `m${i}` }); }
        break;
      }
      mushroom(root, { kind, s: kind === 'portobello' ? 1 : 1.4 });
      break;
    }
    case 'radish': case 'beet': {
      const name = variant === 'beet' ? 'beet' : trim === 'daikon' ? 'daikon' : 'radish';
      const col = name === 'beet' && trim === 'golden' ? 'beet-golden' : name;
      const p = lv(name, col);
      const tops = (g, s = 1) => { for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; curveTube([[0, p.H - 0.003, 0], [Math.cos(a) * 0.01 * s, p.H + 0.04 * s, Math.sin(a) * 0.01 * s], [Math.cos(a) * 0.03 * s, p.H + 0.08 * s, Math.sin(a) * 0.03 * s]], 0.0015 * s, stemMat(name === 'beet' ? '#a8204a' : '#7aa84a'), { parent: g, segments: 8, radialSegments: 5, name: `stalk${i}` }); mesh(leafGeo(0.06 * s, 0.035 * s, { cup: 0.3, curl: 0.3 }), leafy(name === 'beet' ? '#3a6a2a' : '#5a9a3a'), { parent: g, at: [Math.cos(a) * 0.03 * s, p.H + 0.08 * s, Math.sin(a) * 0.03 * s], rot: [0, -a, -0.6], name: `leaf${i}` }); } };
      const tail = (g) => curveTube([[0, p.Y0 + 0.004, 0], [0.002, p.Y0 - 0.005, 0], [0.006, p.Y0 - 0.02, 0.002]], 0.0012, phys(COLS[col][0]), { parent: g, segments: 6, radialSegments: 4, name: 'taproot' });
      if (trim === 'halved') { p.halfCross(root, { at: [-p.R * 1.1, 0, 0], name: 'halfA' }); p.halfCross(root, { at: [p.R * 1.1, 0, 0], name: 'halfB' }); break; }
      if (trim === 'sliced') { slicedOnBoard(root, p, { n: 5 }); break; }
      if (trim === 'bunch') { for (let i = 0; i < 4; i++) { const { holder, g } = place(root, p, { at: [0, 0.0, (i - 1.5) * p.R * 2.05], name: `root${i}` }); holder.rotation.z = PI / 2 * 0; tops(g, 0.8); void holder; } break; }
      const { g } = place(root, p);
      if (name !== 'daikon') { tops(g); tail(g); g.position.y += 0.0; }
      if (name !== 'daikon') { g.position.y = -p.Y0 + 0.0; }
      break;
    }
    case 'asparagus': asparagus(root, { color: trim === 'white' ? '#f2eedc' : trim === 'purple' ? '#5a2a5a' : '#5a8a2a', tip: trim === 'white' ? '#e8e0c0' : '#5a4a6a', grilled: trim === 'grilled', banded: trim !== 'grilled', rand }); break;
    case 'peas': {
      if (trim === 'bowl') { const b = bowl(root, { r: 0.07, h: 0.045 }); const items = []; for (let i = 0; i < 90; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * 0.055; items.push({ at: [Math.cos(a) * d, b.floor + 0.005 + rand() * 0.02, Math.sin(a) * d] }); } items.push({ at: [0, b.floor + 0.005, 0] }); scatter(root, cached('pea', () => new THREE.SphereGeometry(0.0055, 12, 8)), waxy('#7cc84a', { cc: 0.6 }), items, 'peas'); break; }
      if (trim === 'closed') { for (let i = 0; i < 3; i++) peaPod(root, { open: false, at: [0, 0, (i - 1) * 0.02], rotY: (i - 1) * 0.2, name: `pod${i}` }); break; }
      peaPod(root, { open: true });
      if (trim === 'pile') { peaPod(root, { open: false, at: [0, 0, 0.025], rotY: 0.3, name: 'pod2' }); peaPod(root, { open: true, at: [0.01, 0, -0.025], rotY: -0.2, name: 'pod3' }); }
      break;
    }
    default: break;
  }
});
void mottle; void glaze; void ceramic; void ballGeo; void roundedBox;
