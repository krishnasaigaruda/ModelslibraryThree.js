/*
 * Shared kit for the toys category: trim specs (colourway + material + shape
 * modifiers), toy materials, a factory wrapper that grounds the model, and a
 * few reusable parts (wheels, canvas textures, emissive screens).
 */
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mesh, group, roundedBox, cushion, lathe, curveTube, extrudeOutline, tube, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { clip, spinTrack, rotateTrack, moveTrack, scaleTrack, numberTrack, wave, pingPong } from '../../core/animation.js';

export { THREE, M, mergeGeometries, mesh, group, roundedBox, cushion, lathe, curveTube, extrudeOutline, tube, rng, lampGroup, lampTracks };
export { clip, spinTrack, rotateTrack, moveTrack, scaleTrack, numberTrack, wave, pingPong };

/* ------------------------------ trims ------------------------------ */
// pal: [main, second, third, fourth, light, dark]
export const TRIMS = {
  classic: { kind: 'plastic', pal: ['#d62828', '#1d4ed8', '#f4c20d', '#2a9d3c', '#f7f5f0', '#222222'], style: 'plastic' },
  wooden: { kind: 'wood', pal: ['#b8432f', '#2e6da4', '#e0ad3a', '#4f8a3c', '#ead6b3', '#5b3a24'], style: 'wood', round: 1.6, stretch: [1.06, 0.94, 1.06] },
  natural: { kind: 'rawwood', pal: ['maple', 'walnut', 'oak', 'cherry', 'pine', '#3a2a1c'], style: 'wood', round: 1.4 },
  pastel: { kind: 'soft', pal: ['#f4a9bf', '#9fd2ee', '#fbe39a', '#b4e2c4', '#fffaf2', '#8f7f9a'], style: 'soft', round: 2 },
  neon: { kind: 'neon', pal: ['#ff2fb3', '#19e3ff', '#d4ff1e', '#ff8a00', '#2a2238', '#0d0b12'], style: 'neon', round: 0.6, stretch: [0.96, 1.06, 0.96] },
  tin: { kind: 'metal', pal: ['#b3202a', '#1f4f8f', '#e7c14a', '#2e7d5b', '#ece4cf', '#2a2a2a'], style: 'tin', round: 0.45 },
  vintage: { kind: 'metal', pal: ['#9a4a3a', '#4f6e7d', '#c8a25a', '#6b7a4f', '#e3d7bd', '#3a312a'], style: 'tin', round: 0.5, stretch: [1.04, 0.96, 1.04] },
  plush: { kind: 'plush', pal: ['#d98fa8', '#8cb6d9', '#f2d27a', '#9ccf9c', '#f8f1e6', '#5d4a44'], style: 'plush', round: 3, puff: true, stretch: [1.1, 0.9, 1.1] },
  mini: { kind: 'plastic', pal: ['#e85d04', '#3a86ff', '#ffbe0b', '#06d6a0', '#f1f1f1', '#1b1b1b'], style: 'mini', scale: 0.55, round: 0.7, stretch: [0.9, 1.12, 0.9] },
  jumbo: { kind: 'soft', pal: ['#ff4d4d', '#2f80ed', '#ffd600', '#27ae60', '#ffffff', '#333333'], style: 'jumbo', scale: 1.8, round: 2.6, stretch: [1.18, 0.86, 1.18] },
  gold: { kind: 'gold', pal: ['#d4a73a', '#1c1c1c', '#f0e6c8', '#8a1c1c', '#f5f0e0', '#121212'], style: 'luxe', round: 0.8 },
  chrome: { kind: 'chrome', pal: ['#c9ced6', '#14161a', '#3a7bd5', '#d0312d', '#f2f2f2', '#0c0c0c'], style: 'luxe', round: 0.6 },
  glow: { kind: 'glow', pal: ['#7dff6a', '#6af0ff', '#f6ff6a', '#ff6ad5', '#dfffe0', '#18221a'], style: 'neon', round: 1 },
  rainbow: { kind: 'plastic', pal: ['#e63946', '#f77f00', '#fcbf49', '#2a9d8f', '#4361ee', '#7209b7'], style: 'rainbow', round: 1.2 },
  crystal: { kind: 'clear', pal: ['#7fd3ff', '#ff8fd0', '#b5ff9e', '#ffe680', '#f2fbff', '#2b3a4a'], style: 'crystal', round: 1 },
  space: { kind: 'metal', pal: ['#c9ced6', '#1b2a4a', '#ff6b1a', '#4fc3f7', '#f2f2f2', '#0f1420'], style: 'space', round: 0.7, stretch: [0.95, 1.08, 0.95] },
  candy: { kind: 'plastic', pal: ['#ff5c8a', '#ffffff', '#6ad1ff', '#ffd23f', '#fff4f8', '#7a2348'], style: 'candy', round: 2.2 },
  marble: { kind: 'stone', pal: ['#ece8e1', '#2b2b2e', '#c8b89a', '#5a6b73', '#ffffff', '#141414'], style: 'luxe', round: 0.7 },
  travel: { kind: 'plastic', pal: ['#2b2d42', '#ef233c', '#edf2f4', '#8d99ae', '#f7f7f7', '#111111'], style: 'mini', scale: 0.6, round: 0.8 },
  retro: { kind: 'plastic', pal: ['#e76f51', '#264653', '#e9c46a', '#2a9d8f', '#f4e9d8', '#2b2118'], style: 'tin', round: 0.9, stretch: [1.08, 0.92, 1.08] },
  royal: { kind: 'paint', pal: ['#4b1d6b', '#d4a73a', '#f3e6c8', '#1c3f8a', '#fbf6ea', '#1a1024'], style: 'luxe', round: 1 },
  ocean: { kind: 'plastic', pal: ['#0077b6', '#48cae4', '#ffd166', '#06d6a0', '#f1faee', '#023047'], style: 'plastic', round: 1.3 },
  jungle: { kind: 'plastic', pal: ['#386641', '#f2a541', '#a7c957', '#bc4749', '#f2e8cf', '#1f2a1c'], style: 'plastic', round: 1.2 },
  dark: { kind: 'paint', pal: ['#1d1d22', '#c1121f', '#8d99ae', '#f4a261', '#d9d9d9', '#09090b'], style: 'neon', round: 0.6 },
};

export function trimSpec(trim, o = {}, isBase = !trim) {
  const t = TRIMS[trim] ?? TRIMS.classic;
  const pal = [...t.pal];
  if (o.color != null && isBase) pal[0] = o.color;
  if (o.accentColor != null) pal[1] = o.accentColor;
  return { name: trim ?? 'base', round: 1, scale: 1, puff: false, stretch: null, ...t, pal };
}

/* ------------------------------ materials ------------------------------ */
const _cache = new Map();
export function toyMat(kind, color) {
  const key = `${kind}|${color}`;
  if (_cache.has(key)) return _cache.get(key);
  let m;
  const c = M.toColor(color in M.WOODS ? M.WOODS[color] : color);
  switch (kind) {
    case 'wood': m = new THREE.MeshPhysicalMaterial({ name: 'painted-wood', color: c, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5 }); break;
    case 'rawwood': m = M.wood(color); break;
    case 'soft': m = new THREE.MeshPhysicalMaterial({ name: 'soft-plastic', color: c, roughness: 0.6, sheen: 0.4, sheenColor: c.clone().lerp(new THREE.Color(1, 1, 1), 0.5) }); break;
    case 'neon': m = new THREE.MeshStandardMaterial({ name: 'neon-plastic', color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.4 }); break;
    case 'glow': m = new THREE.MeshStandardMaterial({ name: 'glow-plastic', color: c, emissive: c, emissiveIntensity: 0.6, roughness: 0.5 }); break;
    case 'metal': m = new THREE.MeshPhysicalMaterial({ name: 'tin', color: c, metalness: 0.55, roughness: 0.32, clearcoat: 0.6 }); break;
    case 'gold': m = new THREE.MeshStandardMaterial({ name: 'gold', color: c, metalness: 1, roughness: 0.22 }); break;
    case 'chrome': m = new THREE.MeshStandardMaterial({ name: 'chrome', color: c, metalness: 1, roughness: 0.14 }); break;
    case 'plush': m = M.fabric(c); break;
    case 'clear': m = new THREE.MeshPhysicalMaterial({ name: 'clear-plastic', color: c, roughness: 0.08, transmission: 0.6, transparent: true, opacity: 0.72, thickness: 0.01, clearcoat: 1 }); break;
    case 'stone': m = new THREE.MeshPhysicalMaterial({ name: 'marble', color: c, roughness: 0.25, clearcoat: 0.8 }); break;
    case 'paint': m = M.paint(c, { metallic: 0.2, roughness: 0.35 }); break;
    default: m = new THREE.MeshPhysicalMaterial({ name: 'plastic', color: c, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.2 });
  }
  _cache.set(key, m);
  return m;
}
export const plain = (color, rough = 0.5) => new THREE.MeshStandardMaterial({ color: M.toColor(color), roughness: rough });
export const RUBBER = M.rubber();
export const CHROME = M.chrome();
export const BLACK = M.plastic('#151515', 0.4);
export const WHITE = M.plastic('#f5f5f2', 0.4);

/* ------------------------------ factory wrapper ------------------------------ */
/**
 * toyFactory(type, VARIANTS, build) → createX(options).
 * build(ctx) adds meshes to ctx.root; ctx.m(i) = trim material for palette slot i.
 * Shape modifiers (stretch/scale) are applied after build, then the model is grounded.
 */
export function toyFactory(type, variants, build, { base = 'classic' } = {}) {
  return (options = {}) => {
    const o = normalizeOptions(options);
    const variant = pickVariant(variants, o.variant, type);
    const T = trimSpec(o.trim ?? base, o, !o.trim);
    // base models can carry their own default palette / material per variant
    const vs = variants[variant] || {};
    if (!o.trim && vs.pal) { T.pal = [...vs.pal]; if (o.color != null) T.pal[0] = o.color; if (o.accentColor != null) T.pal[1] = o.accentColor; }
    if (!o.trim && vs.matKind) T.kind = vs.matKind;
    const root = group(`${type}-${variant}${o.trim ? `-${o.trim}` : ''}`);
    const body = group('toy', { parent: root });
    const anims = [];
    const ctx = {
      o, T, variant, v: variants[variant], root: body, anims, pal: T.pal,
      r: rng(`${type}:${variant}:${o.trim ?? ''}:${o.seed ?? 0}`),
      m: (i, kind) => toyMat(kind ?? T.kind, T.pal[((i % 6) + 6) % 6]),
      color: (i) => T.pal[((i % 6) + 6) % 6],
      box: (w, h, d, r = 0.1) => softBox(w, h, d, r, T),
      oneShot: [],
    };
    build(ctx);
    if (T.stretch) body.scale.set(...T.stretch);
    body.scale.multiplyScalar(T.scale ?? 1);
    ground(root, body);
    const obj = finalize(root, { type, variant, options: o, animations: anims });
    if (ctx.oneShot.length) obj.userData.premade.oneShot = ctx.oneShot;
    return obj;
  };
}

/** Shift `body` so its lowest solid point sits at y = 0. */
export function ground(root, body) {
  root.updateMatrixWorld(true);
  const b = new THREE.Box3();
  const tmp = new THREE.Box3();
  body.traverse((n) => {
    if (!n.isMesh || n.userData.noShadow || n.material?.blending === THREE.AdditiveBlending) return;
    if (!n.geometry.boundingBox) n.geometry.computeBoundingBox();
    tmp.copy(n.geometry.boundingBox).applyMatrix4(n.matrixWorld);
    b.union(tmp);
  });
  if (!b.isEmpty()) body.position.y -= b.min.y;
}

/** Rounded box that becomes a puffy cushion on plush trims; `r` is a fraction of the smallest side. */
export function softBox(w, h, d, r, T) {
  const k = Math.min(0.49, r * (T?.round ?? 1));
  const rr = Math.min(w, h, d) * k;
  return T?.puff ? cushion(w, h, d, { radius: Math.max(rr, Math.min(w, h, d) * 0.3), bulge: 0.18 }) : roundedBox(w, h, d, Math.max(rr, 1e-3), 3);
}

/* ------------------------------ parts ------------------------------ */
let _wheelN = 0;
/** Toy wheel with axis along X: tyre + hub. Returns group. */
export function wheel(parent, { r = 0.02, w = 0.012, at = [0, 0, 0], T, hub = '#d0d0d0', name, tyre = RUBBER } = {}) {
  const g = group(name ?? `wheel_${++_wheelN}`, { parent, at });
  if (T?.style === 'wood') {
    mesh(new THREE.CylinderGeometry(r, r, w, 24).rotateZ(Math.PI / 2), toyMat('rawwood', 'maple'), { parent: g });
    mesh(new THREE.CylinderGeometry(r * 0.25, r * 0.25, w * 1.3, 12).rotateZ(Math.PI / 2), toyMat('wood', T.pal[0]), { parent: g });
    return g;
  }
  const tg = new THREE.TorusGeometry(r * 0.72, r * 0.28, 10, 24).rotateY(Math.PI / 2);
  tg.scale(w / (r * 0.56), 1, 1);
  mesh(tg, T?.style === 'plush' ? toyMat('plush', T.pal[5]) : tyre, { parent: g });
  mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, w * 0.8, 18).rotateZ(Math.PI / 2), T?.style === 'luxe' || T?.style === 'tin' ? CHROME : toyMat('plastic', hub), { parent: g });
  return g;
}

/** Canvas texture (browser only). draw(ctx2d, w, h). */
export function canvasTex(w, h, draw, key) {
  if (typeof document === 'undefined') return null;
  if (key && _tex.has(key)) return _tex.get(key);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (key) _tex.set(key, t);
  return t;
}
const _tex = new Map();

/** Material with an optional canvas map. */
export function printMat(color, draw, key, { w = 256, h = 256, rough = 0.5 } = {}) {
  const map = canvasTex(w, h, draw, key);
  return new THREE.MeshStandardMaterial({ color: map ? '#ffffff' : M.toColor(color), map, roughness: rough });
}

/**
 * Emissive screen through lamps.js (named `name`, glow `name_glow`).
 * geometry is already placed in parent space; normal is the facing direction.
 * Returns the tracks for an 'on' clip.
 */
export function screen(parent, geometry, { name = 'screen', color = '#3a6cff', draw, key, normal = [0, 0, 1], intensity = 1.6 } = {}) {
  const map = draw ? canvasTex(256, 192, draw, key) : null;
  const lens = new THREE.MeshStandardMaterial({ name: `${name}_mat`, color: map ? '#ffffff' : M.toColor(color).multiplyScalar(0.4), map, emissive: map ? '#ffffff' : M.toColor(color), emissiveMap: map, emissiveIntensity: 0.35, roughness: 0.2 });
  const lg = lampGroup(name, 'white', { lens });
  lg.add(parent, { geometry, normal, depth: 0.002 });
  return lampTracks(name, intensity, { glow: 0.35 });
}

/** Little lit bulbs (lampGroup) — returns tracks blinking them. */
export function bulbs(parent, name, kind, spots, { r = 0.012, blink = 2 } = {}) {
  const lg = lampGroup(name, kind);
  for (const [at, normal] of spots) lg.add(parent, { at, normal, w: r * 2, h: r * 2, depth: r * 0.8, shape: 'round', bezel: false });
  return lampTracks(name, 3, { blink, off: 0.3 });
}

/** Merge a list of geometries (same material) into one mesh. */
export function merged(geos, mat, opts) {
  return mesh(mergeGeometries(geos.map((g) => (g.index ? g.toNonIndexed() : g))), mat, opts);
}

/** Pip/eye: small dark hemisphere. */
export function dot(parent, at, r, mat = BLACK, normal = [0, 0, 1]) {
  const m = mesh(new THREE.SphereGeometry(r, 10, 8), mat, { parent, at });
  m.scale.setComponent(normal[0] ? 0 : normal[1] ? 1 : 2, 0.45);
  return m;
}

/** Lathe a hollow cup/bucket: outer + inner wall with a rim, opening up. */
export function hollowLathe(rBottom, rTop, h, wall, segments = 40) {
  return lathe([[0, 0], [rBottom, 0], [rTop, h], [rTop - wall * 0.5, h + wall * 0.3], [rTop - wall, h], [rBottom - wall, wall], [0, wall]], segments);
}
