// Shared helpers for the 'items' category (everyday objects): trims, materials, canvas
// patterns/labels, hollow shells, straps, and the "settle on the ground" wrapper.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { clip, spinTrack, rotateTrack, moveTrack, scaleTrack, numberTrack, wave, pingPong } from '../../core/animation.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { brandEmblem } from '../../core/brand.js';

export { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant };
export { clip, spinTrack, rotateTrack, moveTrack, scaleTrack, numberTrack, wave, pingPong, lampGroup, lampTracks, LAMP_ON, brandEmblem };

/*
 * Trims: one shared vocabulary for the whole category; every catalog entry picks the
 * names that make sense for it. Each trim = palette (p primary, s secondary, a accent)
 * + material family (mat) + SHAPE knobs every builder must read so the silhouette changes:
 *   k      overall scale            w / h / d  proportion multipliers (width / height / depth)
 *   round  corner-radius factor     detail     0 plain … 2 lots of hardware (buckles, studs, stitching)
 *   worn   0..1 sag/dent/fade       pattern    'stripes' | 'dots' | 'check' | 'floral' | 'camo' | 'tartan' | 'leopard'
 *   slim / chunky / soft / rugged / lux flags for builders to branch on.
 * Builders: `const { o, variant, trim, T } = setup(options, VARIANTS, 'type', basePalette)`;
 * use `tm(T, 'p')` for the body, `tm(T, 's')` for trim parts, `tm(T, 'a')` for accents,
 * `fin(T, colour, kind)` to force a material family.
 */
export const TRIMS = {
  // ---- materials
  leather: { p: '#6b3d22', s: '#3a2214', a: '#c9a25a', mat: 'leather', detail: 2, round: 1.2 },
  canvas: { p: '#b9a77f', s: '#5d4a32', a: '#8a6b3c', mat: 'canvas', detail: 1, soft: true },
  nylon: { p: '#2f4f7a', s: '#16181c', a: '#f2a516', mat: 'nylon', detail: 1, soft: true },
  denim: { p: '#3c5a86', s: '#c9c3b5', a: '#c88a3a', mat: 'canvas', detail: 1, soft: true, pattern: 'denim' },
  plastic: { p: '#e8402f', s: '#f4f4f2', a: '#1f6fd6', mat: 'plastic', round: 1.4, h: 0.95 },
  metal: { p: '#b9bec6', s: '#55595f', a: '#2a2c30', mat: 'metal', round: 0.6, detail: 1 },
  steel: { p: '#c9ced4', s: '#3d4045', a: '#1c1d20', mat: 'metal', round: 0.5, slim: true },
  wooden: { p: '#a5733f', s: '#5b3a24', a: '#2a2018', mat: 'wood', round: 0.8 },
  bamboo: { p: '#d1b072', s: '#8a6a34', a: '#3b2f1d', mat: 'wood', slim: true },
  glass: { p: '#cfe6ea', s: '#9aa0a6', a: '#2a2c30', mat: 'glass' },
  ceramic: { p: '#f1ede4', s: '#2c5e8a', a: '#c8702f', mat: 'ceramic', round: 1.2 },
  paper: { p: '#c9a878', s: '#f3ead8', a: '#7a5534', mat: 'paper', round: 0.3 },
  kraft: { p: '#b58a57', s: '#e9dfcc', a: '#3a2c1e', mat: 'paper', round: 0.3, rugged: true },
  rubber: { p: '#2b2d31', s: '#e7c21a', a: '#d63a2a', mat: 'rubber', chunky: true, round: 1.5 },
  velvet: { p: '#5b1f4d', s: '#c9a24a', a: '#2b0f26', mat: 'velvet', soft: true, round: 1.4 },
  'faux-fur': { p: '#ece4d8', s: '#bfb3a2', a: '#8c7e6c', mat: 'fur', soft: true, chunky: true, round: 1.6 },
  corduroy: { p: '#9a6a3c', s: '#5a3b20', a: '#e4c48e', mat: 'velvet', soft: true, pattern: 'cord' },
  knit: { p: '#d8cbb3', s: '#8c4a3a', a: '#4a5d6e', mat: 'fabric', soft: true, chunky: true, pattern: 'knit' },
  cotton: { p: '#f4f1ea', s: '#9db8cf', a: '#e3a3a8', mat: 'fabric', soft: true },
  silk: { p: '#c2304a', s: '#f2d6a2', a: '#2a1420', mat: 'silk', soft: true, slim: true },
  gold: { p: '#d6a93c', s: '#f3e2a8', a: '#8a6a1c', mat: 'gold', lux: true, detail: 2 },
  silver: { p: '#c9ccd2', s: '#8e939a', a: '#2e3036', mat: 'silver', lux: true, detail: 1 },
  'rose-gold': { p: '#d9967f', s: '#f4d4c4', a: '#8a4a3a', mat: 'rosegold', lux: true, slim: true },
  brass: { p: '#b8913f', s: '#5a4320', a: '#2a2018', mat: 'brass', detail: 1 },
  copper: { p: '#b5653a', s: '#6b3a22', a: '#2a1a12', mat: 'copper', detail: 1 },
  terracotta: { p: '#b8603a', s: '#8a4428', a: '#e6c9a8', mat: 'matte', round: 0.8 },
  carbon: { p: '#1c1d20', s: '#34373d', a: '#d63a2a', mat: 'carbon', slim: true },
  // ---- sizes / ages
  mini: { k: 0.68, round: 1.5, chunky: true, p: '#ff7aa8', s: '#ffd23f', a: '#3fb6ff', mat: 'plastic' },
  small: { k: 0.8, p: '#4f7fbf', s: '#e9e6df', a: '#f0b53a' },
  large: { k: 1.3, w: 1.1, p: '#4d5b3a', s: '#2b2f24', a: '#c49a3a', detail: 1 },
  xl: { k: 1.55, w: 1.15, h: 0.95, p: '#7a2c2c', s: '#2b1d1d', a: '#d9b85a', chunky: true },
  kids: { k: 0.72, round: 1.6, chunky: true, p: '#ffcc1e', s: '#2b7de1', a: '#ff4d6d', mat: 'plastic', pattern: 'dots' },
  travel: { k: 0.75, w: 0.9, p: '#2f3a45', s: '#e46a2c', a: '#c9ced4', slim: true },
  tall: { h: 1.35, w: 0.85, p: '#3b6e5a', s: '#e6e1d4', a: '#b7782c' },
  wide: { w: 1.35, h: 0.85, p: '#5a4a7a', s: '#e9e3f2', a: '#f2b84a' },
  slim: { w: 0.75, d: 0.7, slim: true, p: '#22262c', s: '#9aa0a8', a: '#e44d3a' },
  vintage: { p: '#7d5b3c', s: '#e2d3b0', a: '#8a2f22', mat: 'leather', worn: 0.45, detail: 2, round: 0.9 },
  retro: { p: '#e9a33a', s: '#2f6f6a', a: '#c9452e', round: 1.5, chunky: true },
  modern: { p: '#e9e9e6', s: '#2a2b2e', a: '#3da5d9', round: 0.7, slim: true, mat: 'plastic' },
  worn: { p: '#8f8270', s: '#4b4239', a: '#7a3d2c', worn: 1, detail: 1 },
  rustic: { p: '#8a6a48', s: '#3e3226', a: '#b87a3a', mat: 'wood', worn: 0.6, rugged: true },
  luxury: { p: '#141414', s: '#d6a93c', a: '#7a1426', lux: true, detail: 2, mat: 'leather' },
  rugged: { p: '#4a5232', s: '#1c1d1a', a: '#e46a1c', rugged: true, chunky: true, detail: 2, round: 0.7 },
  sport: { p: '#1b1d22', s: '#d8ff2a', a: '#e8402f', slim: true, detail: 1 },
  // ---- colours / patterns (always paired with a shape change)
  striped: { p: '#f2efe8', s: '#1f3f73', a: '#c8302a', pattern: 'stripes', w: 1.05 },
  'polka-dot': { p: '#e8435a', s: '#fdfaf2', a: '#1d1d1d', pattern: 'dots', round: 1.4 },
  checked: { p: '#c8302a', s: '#f6f1e6', a: '#1d1d1d', pattern: 'check', h: 0.92 },
  tartan: { p: '#1f4a35', s: '#b0202a', a: '#e8c34a', pattern: 'tartan', detail: 1 },
  floral: { p: '#f3e6ef', s: '#d9577e', a: '#4f8a4a', pattern: 'floral', round: 1.3, soft: true },
  camo: { p: '#5a6640', s: '#3a3f2a', a: '#8a7a52', pattern: 'camo', rugged: true },
  leopard: { p: '#d9a85a', s: '#2a1c10', a: '#8a5a2a', pattern: 'leopard', lux: true },
  neon: { p: '#c8ff12', s: '#141518', a: '#ff2bd6', neon: true, slim: true },
  pastel: { p: '#b9dcd2', s: '#f6d3df', a: '#f4e3a1', round: 1.5, soft: true, k: 0.92 },
  black: { p: '#1a1b1e', s: '#2e3036', a: '#8d939c', round: 0.8 },
  white: { p: '#f4f3ef', s: '#d6d4cd', a: '#9aa0a8', round: 1.1 },
  red: { p: '#c42a2a', s: '#f2ede4', a: '#1b1b1d', h: 1.08 },
  blue: { p: '#2457b8', s: '#f0f0ec', a: '#f2b83a', w: 1.08 },
  green: { p: '#2f7a4a', s: '#ece6d2', a: '#d98a2a', d: 1.1 },
  pink: { p: '#f08fb2', s: '#fff1f6', a: '#9a3a6a', round: 1.4, k: 0.95 },
  yellow: { p: '#f4c21a', s: '#262626', a: '#e8402f', chunky: true },
  orange: { p: '#ee7a22', s: '#2a2b2e', a: '#f4f1ea', rugged: true },
  purple: { p: '#6a3fa0', s: '#f0e8f8', a: '#f2b84a', round: 1.2 },
  // ---- party / festive
  festive: { p: '#b3202a', s: '#1f6a3a', a: '#e8c34a', pattern: 'stripes', detail: 2 },
  birthday: { p: '#3fb6ff', s: '#ff7aa8', a: '#ffd23f', pattern: 'dots', round: 1.3 },
  glitter: { p: '#c9a2e8', s: '#f4d4f0', a: '#ffffff', mat: 'glitter', lux: true },
};

/** Resolve options → { o, variant, trim, T }. base = per-type default palette/knobs. */
export function setup(options, VARIANTS, type, base = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VARIANTS, o.variant, type);
  const trim = o.trim && TRIMS[o.trim] ? o.trim : null;
  const V = VARIANTS[variant] || {};
  const T = { k: 1, w: 1, h: 1, d: 1, round: 1, detail: 0, worn: 0, ...base, ...V, ...(trim ? TRIMS[trim] : {}), trim };
  if (!trim && o.color) T.p = o.color;
  T.p ??= '#4f7fbf'; T.s ??= '#e9e6df'; T.a ??= '#2a2b2e';
  T.mat ??= 'plastic';
  T.r = rng(`${type}-${variant}-${trim}`);
  return { o, variant, trim, T, V };
}

const _fade = new THREE.Color('#b8ad98');
/** Material of a family (kind) in a colour, honouring T.worn / T.neon / T.pattern (pattern only when T.patternOn). */
export function fin(T, color, kind = T.mat, { pattern = null, rough } = {}) {
  const c = M.toColor(color);
  if (T.worn && !['metal', 'gold', 'silver', 'brass', 'copper', 'rosegold', 'glass'].includes(kind)) c.lerp(_fade, 0.3 * T.worn);
  const map = pattern ? patternTex(pattern, c, M.toColor(T.s), M.toColor(T.a)) : null;
  const P = (o) => new THREE.MeshPhysicalMaterial({ color: map ? '#ffffff' : c, map, ...o });
  const S = (o) => new THREE.MeshStandardMaterial({ color: map ? '#ffffff' : c, map, ...o });
  let m;
  switch (kind) {
    case 'leather': m = P({ name: 'leather', roughness: rough ?? (T.worn ? 0.75 : 0.5), clearcoat: T.worn ? 0.05 : 0.3, clearcoatRoughness: 0.5 }); break;
    case 'canvas': m = P({ name: 'canvas', roughness: 0.95, sheen: 0.5, sheenRoughness: 0.8, sheenColor: c.clone().lerp(new THREE.Color(1, 1, 1), 0.3) }); break;
    case 'nylon': m = P({ name: 'nylon', roughness: 0.6, sheen: 0.8, sheenRoughness: 0.4, sheenColor: c.clone().lerp(new THREE.Color(1, 1, 1), 0.4) }); break;
    case 'fabric': m = P({ name: 'fabric', roughness: 0.95, sheen: 1, sheenRoughness: 0.6, sheenColor: c.clone().lerp(new THREE.Color(1, 1, 1), 0.3) }); break;
    case 'velvet': m = P({ name: 'velvet', roughness: 0.9, sheen: 1, sheenRoughness: 0.3, sheenColor: c.clone().lerp(new THREE.Color(1, 1, 1), 0.5) }); break;
    case 'fur': m = P({ name: 'fur', roughness: 1, sheen: 1, sheenRoughness: 0.9, sheenColor: new THREE.Color('#ffffff') }); break;
    case 'silk': m = P({ name: 'silk', roughness: 0.35, sheen: 1, sheenRoughness: 0.2, sheenColor: c.clone().lerp(new THREE.Color(1, 1, 1), 0.6) }); break;
    case 'metal': m = M.metal(c, T.worn ? 0.6 : rough ?? 0.3); break;
    case 'chrome': m = T.worn ? M.metal('#a7a39b', 0.55) : M.chrome(); break;
    case 'gold': m = M.metal('#d6a93c', 0.2); break;
    case 'silver': m = M.metal('#cfd2d8', 0.18); break;
    case 'rosegold': m = M.metal('#d9967f', 0.22); break;
    case 'brass': m = M.metal('#b8913f', T.worn ? 0.55 : 0.28); break;
    case 'copper': m = M.metal('#b5653a', T.worn ? 0.55 : 0.28); break;
    case 'wood': m = P({ name: 'wood', roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.45 }); break;
    case 'glass': m = M.glass({ tint: color, opacity: 0.45 }); m.roughness = 0.05; m.metalness = 0; break;
    case 'ceramic': m = P({ name: 'ceramic', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 }); break;
    case 'paper': m = S({ name: 'paper', roughness: 0.92 }); break;
    case 'rubber': m = S({ name: 'rubber', roughness: 0.9 }); break;
    case 'matte': m = S({ name: 'matte', roughness: 0.85 }); break;
    case 'carbon': m = P({ name: 'carbon', roughness: 0.3, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 }); break;
    case 'glitter': m = P({ name: 'glitter', roughness: 0.25, metalness: 0.6, clearcoat: 1, iridescence: 0.6 }); break;
    case 'gloss': m = P({ name: 'gloss', roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.1 }); break;
    default: m = P({ name: 'plastic', roughness: rough ?? 0.42, clearcoat: 0.3, clearcoatRoughness: 0.3 });
  }
  if (T.neon && !['metal', 'chrome', 'glass'].includes(kind)) { m.emissive = c.clone(); m.emissiveIntensity = 0.3; }
  return m;
}

/** Trim material for a role: 'p' body (gets the trim pattern), 's' secondary, 'a' accent. kind overrides family. */
export function tm(T, role = 'p', kind) {
  return fin(T, T[role], kind ?? T.mat, { pattern: role === 'p' ? T.pattern : null });
}
/** Hardware material (zips, buckles, rivets): gold for lux, dark for stealthy palettes, else nickel. */
export function hw(T) {
  if (T.lux || T.mat === 'gold') return M.metal('#d6a93c', 0.22);
  if (T.mat === 'brass' || T.trim === 'vintage') return M.metal('#b8913f', 0.35);
  if (T.trim === 'black' || T.trim === 'carbon') return M.metal('#2a2b2e', 0.3);
  return M.metal('#c9ccd2', T.worn ? 0.55 : 0.25);
}

/* ------------------------------ canvas helpers ------------------------------ */

/** Canvas texture (null in Node). draw(ctx, w, h). */
export function canvasTex(w, h, draw, { repeat } = {}) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

const _patCache = new Map();
/** Repeating pattern texture (null in Node). */
export function patternTex(kind, p, s, a) {
  if (typeof document === 'undefined') return null;
  const hex = (c) => `#${c.getHexString()}`;
  const key = `${kind}|${hex(p)}|${hex(s)}|${hex(a)}`;
  if (_patCache.has(key)) return _patCache.get(key);
  const t = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = hex(p); g.fillRect(0, 0, w, h);
    const R = rng(key);
    if (kind === 'stripes') { g.fillStyle = hex(s); for (let i = 0; i < 4; i++) g.fillRect(i * 32, 0, 14, h); }
    else if (kind === 'dots') { g.fillStyle = hex(s); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(x * 32 + (y % 2) * 16 + 8, y * 32 + 16, 7, 0, 7); g.fill(); } }
    else if (kind === 'check' || kind === 'tartan') {
      g.globalAlpha = 0.55; g.fillStyle = hex(s);
      for (let i = 0; i < 4; i++) { g.fillRect(i * 32, 0, 16, h); g.fillRect(0, i * 32, w, 16); }
      if (kind === 'tartan') { g.globalAlpha = 0.9; g.fillStyle = hex(a); for (let i = 0; i < 4; i++) { g.fillRect(i * 32 + 22, 0, 3, h); g.fillRect(0, i * 32 + 22, w, 3); } }
      g.globalAlpha = 1;
    } else if (kind === 'floral') {
      for (let i = 0; i < 9; i++) {
        const x = R() * w, y = R() * h;
        g.fillStyle = hex(i % 3 ? s : a);
        for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.26) * 6, y + Math.sin(k * 1.26) * 6, 5, 0, 7); g.fill(); }
        g.fillStyle = '#f4d23a'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill();
      }
    } else if (kind === 'camo' || kind === 'leopard') {
      for (let i = 0; i < 26; i++) {
        const x = R() * w, y = R() * h, r = 6 + R() * (kind === 'camo' ? 14 : 6);
        g.fillStyle = hex(kind === 'camo' ? (i % 2 ? s : a) : a);
        g.beginPath(); g.ellipse(x, y, r, r * 0.7, R() * 3, 0, 7); g.fill();
        if (kind === 'leopard') { g.strokeStyle = hex(s); g.lineWidth = 3; g.stroke(); }
      }
    } else if (kind === 'denim' || kind === 'cord' || kind === 'knit') {
      g.globalAlpha = 0.18; g.strokeStyle = kind === 'denim' ? '#ffffff' : '#000000';
      for (let i = -h; i < w; i += kind === 'cord' ? 8 : 4) { g.beginPath(); if (kind === 'cord') { g.moveTo(i, 0); g.lineTo(i, h); } else if (kind === 'knit') { g.moveTo(i, 0); g.lineTo(i + 4, 8); g.lineTo(i, 16); } else { g.moveTo(i, 0); g.lineTo(i + h, h); } g.lineWidth = kind === 'cord' ? 3 : 1; g.stroke(); }
      if (kind === 'knit') for (let y = 16; y < h; y += 16) g.drawImage(g.canvas, 0, 0, w, 16, 0, y, w, 16);
      g.globalAlpha = 1;
    }
  }, { repeat: [3, 3] });
  _patCache.set(key, t);
  return t;
}

/** Flat plane carrying a canvas label (plain colour in Node). Faces +Z. Keep it ≤0.5 mm off its surface. */
export function labelPlane(w, h, draw, { bg = '#ffffff', emissive = 0, px = 256, rough = 0.5 } = {}) {
  const tex = canvasTex(px, Math.max(16, Math.round((px * h) / w)), draw);
  const mat = emissive
    ? new THREE.MeshStandardMaterial({ name: 'screen', color: tex ? '#ffffff' : bg, map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: tex ? emissive : 0.2, roughness: 0.4 })
    : new THREE.MeshStandardMaterial({ name: 'label', color: tex ? '#ffffff' : bg, map: tex, roughness: rough });
  if (emissive && !tex) mat.emissive = M.toColor(bg);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

/** Simple text label drawer for labelPlane: background, centred text lines. */
export const textDraw = (lines, { bg = '#ffffff', fg = '#1d1d1d', font = 'bold', border } = {}) => (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (border) { g.strokeStyle = border; g.lineWidth = Math.max(2, h * 0.04); g.strokeRect(g.lineWidth, g.lineWidth, w - 2 * g.lineWidth, h - 2 * g.lineWidth); }
  const L = Array.isArray(lines) ? lines : [lines];
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  L.forEach((t, i) => {
    const sz = Math.min(h / (L.length + 0.6) * (i === 0 ? 0.9 : 0.6), w / Math.max(4, t.length) * 1.6);
    g.font = `${i === 0 ? font : 'normal'} ${Math.round(sz)}px sans-serif`;
    g.fillText(t, w / 2, (h * (i + 0.8)) / (L.length + 0.6));
  });
};

/* ------------------------------ geometry helpers ------------------------------ */

/**
 * Hollow lathe vessel (cup, bucket, pot, jar, bin): outer profile [[r,y]...] from base to rim;
 * wall thickness t; floor thickness f. Returns a closed solid-walled geometry (inner surface included).
 */
export function vessel(profile, t = 0.004, f = t, segments = 40) {
  const out = profile.map(([r, y]) => [r, y]);
  const top = out[out.length - 1];
  const inner = out.slice().reverse().map(([r, y]) => [Math.max(0.0005, r - t), Math.max(y, f)]);
  const pts = [[0, 0], ...out, [top[0] - t * 0.5, top[1] + t * 0.3], ...inner, [0, f]];
  return lathe(pts, segments);
}

/**
 * Hollow rounded box container (open top): outer w×h×d, wall t. Built from a rounded-rect
 * outline extruded upward with a hole, plus a floor. Returns a Group of two meshes.
 */
export function openBox(w, h, d, t, mat, { r = Math.min(w, d) * 0.08, floorMat = mat, parent, at = [0, 0, 0], name } = {}) {
  const g = group(name ?? 'box', { parent, at });
  const rr = (W, D, R) => {
    const s = new THREE.Shape();
    R = Math.max(0.0005, Math.min(R, W / 2 - 1e-4, D / 2 - 1e-4));
    s.moveTo(-W / 2 + R, -D / 2); s.lineTo(W / 2 - R, -D / 2); s.quadraticCurveTo(W / 2, -D / 2, W / 2, -D / 2 + R);
    s.lineTo(W / 2, D / 2 - R); s.quadraticCurveTo(W / 2, D / 2, W / 2 - R, D / 2); s.lineTo(-W / 2 + R, D / 2);
    s.quadraticCurveTo(-W / 2, D / 2, -W / 2, D / 2 - R); s.lineTo(-W / 2, -D / 2 + R); s.quadraticCurveTo(-W / 2, -D / 2, -W / 2 + R, -D / 2);
    return s;
  };
  const outer = rr(w, d, r);
  const hole = rr(w - 2 * t, d - 2 * t, Math.max(0.0005, r - t));
  outer.holes.push(new THREE.Path(hole.getPoints(12)));
  const wall = new THREE.ExtrudeGeometry(outer, { depth: h, bevelEnabled: false, curveSegments: 12 });
  wall.rotateX(-Math.PI / 2);
  mesh(wall, mat, { parent: g, name: name ? `${name}-wall` : 'wall' });
  const fl = new THREE.ExtrudeGeometry(rr(w - t, d - t, r), { depth: t, bevelEnabled: false, curveSegments: 12 });
  fl.rotateX(-Math.PI / 2);
  mesh(fl, floorMat, { parent: g, name: name ? `${name}-floor` : 'floor' });
  return g;
}

/** Strap/handle: flat band following points (a tube squashed to w×t). */
export function strap(points, w, t, mat, { parent, name, segments = 32 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -t / 2); shape.lineTo(w / 2, -t / 2); shape.lineTo(w / 2, t / 2); shape.lineTo(-w / 2, t / 2); shape.lineTo(-w / 2, -t / 2);
  const geo = new THREE.ExtrudeGeometry(shape, { steps: segments, bevelEnabled: false, extrudePath: curve });
  const m = new THREE.Mesh(geo, mat);
  if (name) m.name = name;
  if (parent) parent.add(m);
  return m;
}

/** Torus ring lying flat (XZ) or standing; handy for key rings, chains, bangles. */
export function ring(R, r, mat, { parent, at, rot, name, seg = 32 } = {}) {
  return mesh(new THREE.TorusGeometry(R, r, 10, seg), mat, { parent, at, rot, name });
}

/** Rounded slab with a soft sag (blankets, towels, paper, cards): w × t × d, top domed by bulge. */
export function slab(w, t, d, { r, bulge = 0.1 } = {}) {
  return cushion(w, t, d, { radius: r ?? Math.min(t * 0.45, w / 2, d / 2), bulge });
}

/* ------------------------------- finishing ------------------------------- */

/**
 * Splits triangles whose longest edge exceeds maxEdge (all attributes interpolated) so big
 * flat faces have evenly spaced vertices (reliable surface-contact checks).
 */
export function densify(geo, maxEdge) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const names = Object.keys(g.attributes);
  const src = names.map((n) => g.attributes[n]);
  const out = names.map(() => []);
  const pos = g.attributes.position;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3();
  let changed = false;
  const read = (i) => src.map((a) => Array.from({ length: a.itemSize }, (_, k) => a.array[i * a.itemSize + k]));
  const emit = (tri) => tri.forEach((v) => v.forEach((arr, ai) => out[ai].push(...arr)));
  const mid = (u, v) => u.map((arr, ai) => arr.map((x, k) => (x + v[ai][k]) / 2));
  const split = (tri, depth) => {
    A.fromArray(tri[0][0]); B.fromArray(tri[1][0]); Cc.fromArray(tri[2][0]);
    const e = [A.distanceTo(B), B.distanceTo(Cc), Cc.distanceTo(A)];
    const m = Math.max(...e);
    if (m <= maxEdge || depth > 12) return emit(tri);
    changed = true;
    const i = e.indexOf(m);
    const [p, q, r] = [tri[i], tri[(i + 1) % 3], tri[(i + 2) % 3]];
    const M2 = mid(p, q);
    split([p, M2, r], depth + 1);
    split([M2, q, r], depth + 1);
  };
  for (let t = 0; t < pos.count; t += 3) split([read(t), read(t + 1), read(t + 2)], 0);
  if (!changed) return geo;
  const res = new THREE.BufferGeometry();
  names.forEach((n, ai) => res.setAttribute(n, new THREE.BufferAttribute(new Float32Array(out[ai]), src[ai].itemSize)));
  return res;
}

/**
 * Shifts the model so it rests on y = 0, densifies big flat faces, then finalizes.
 * Everyday items are small: faces larger than ~0.25 m get vertices every ~0.2 m.
 */
export function done(root, type, variant, o, animations = []) {
  root.updateMatrixWorld(true);
  const ws = new THREE.Vector3();
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.noShadow) return;
    const g = m.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    m.getWorldScale(ws);
    const s = g.boundingBox.getSize(new THREE.Vector3()).multiply(ws);
    const big = Math.max(s.x, s.y, s.z);
    if (big > 0.25 && g.attributes.position.count < 20000) {
      const lim = Math.max(0.12, big / 8);
      m.geometry = densify(g, lim / Math.max(1e-6, ws.length() / Math.sqrt(3)));
    }
  });
  // ground box ignores glow cards (lamp halos must not lift the model)
  const box = new THREE.Box3();
  root.traverse((m) => {
    if (!m.isMesh || m.userData.noShadow || m.material?.blending === THREE.AdditiveBlending) return;
    if (m.isInstancedMesh) { box.expandByObject(m); return; }
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    box.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));
  });
  if (box.isEmpty()) box.setFromObject(root);
  for (const c of root.children) c.position.y -= box.min.y;
  root.updateMatrixWorld(true);
  const anims = typeof animations === 'function' ? animations() : animations;
  return finalize(root, { type, variant, options: o, animations: anims });
}

/** Animation helpers that are common for items. */
export const anims = {
  /** hinge-open a node about an axis from 0 to angle and back (lids, flaps, doors). */
  open: (name, node, axis, angle, period = 3) => clip(name, period, [rotateTrack(node, axis, period, (t) => pingPong(t) * angle)]),
  spin: (name, node, axis = 'y', period = 2) => clip(name, period, [spinTrack(node, axis, period)]),
  /** gentle sway/wobble */
  sway: (name, node, axis = 'z', amp = 0.08, period = 2) => clip(name, period, [rotateTrack(node, axis, period, (t) => wave(t) * amp)]),
  /** lamp group on (steady) */
  on: (lampName, kind = 'white', period = 1) => clip('on', period, lampTracks(lampName, LAMP_ON[kind] ?? 3)),
};
