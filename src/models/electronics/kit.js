// Shared kit for the 'electronics' category: trim styles, screens (canvas content + 'on' glow),
// LEDs (core/lamps.js), RGB strips, instanced keys, vents, ports, bumpers and the device wrapper.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, extrudeOutline, lathe, curveTube, tube, cushion, normalizeOptions, pickVariant, finalize, rng } from '../../core/utils.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { brandEmblem } from '../../core/brand.js';
import { clip, spinTrack, rotateTrack, moveTrack, numberTrack, pingPong, wave } from '../../core/animation.js';

export { THREE, M, mesh, group, roundedBox, extrudeOutline, lathe, curveTube, tube, cushion, clip, spinTrack, rotateTrack, moveTrack, numberTrack, pingPong, wave };
export const PI = Math.PI;

/** Every type gets these trims: colour family + parts (bumpers, RGB, cracks, tape, chunky retro…). */
export const TRIMS = ['black', 'white', 'gold', 'retro', 'rugged', 'gaming', 'damaged', 'kids', 'lit'];

const PAL = {
  base: (c) => ({ body: M.metal(c ?? '#a4a7ad', 0.3), body2: M.plastic('#2a2c30', 0.5), accent: M.metal('#cfd2d6', 0.25), bezel: '#0b0c0e' }),
  black: () => ({ body: M.plastic('#1b1c1f', 0.42), body2: M.plastic('#0f1012', 0.5), accent: M.metal('#3b3c40', 0.3), bezel: '#060607' }),
  white: () => ({ body: M.plastic('#eef0f2', 0.32), body2: M.plastic('#d5d8dc', 0.4), accent: M.metal('#d8dbe0', 0.22), bezel: '#f4f5f6' }),
  gold: () => ({ body: M.metal('#d8b46e', 0.24), body2: M.plastic('#f1e8d4', 0.4), accent: M.metal('#f2dca4', 0.18), bezel: '#0b0a08' }),
  retro: () => ({ body: M.matte('#dacfb2', 0.7), body2: M.matte('#6d5b48', 0.7), accent: M.plastic('#c8532a', 0.5), bezel: '#3b352c' }),
  rugged: () => ({ body: M.plastic('#4c5737', 0.72), body2: M.rubber(), accent: M.plastic('#ff6a13', 0.6), bezel: '#121310' }),
  gaming: () => ({ body: M.plastic('#141519', 0.38), body2: M.plastic('#24252c', 0.45), accent: M.emissive('#ff2bd6', 1.6), bezel: '#050506' }),
  damaged: () => ({ body: M.metal('#7d8085', 0.68), body2: M.matte('#2b2c2f', 0.9), accent: M.metal('#56595d', 0.7), bezel: '#0a0a0b' }),
  kids: () => ({ body: M.plastic('#2fb0ff', 0.45), body2: M.plastic('#ffd23f', 0.5), accent: M.plastic('#ff4f7a', 0.5), bezel: '#1b2a3a' }),
};

/** Trim style object T. */
export function style(o, trim) {
  const p = (PAL[trim] ?? PAL.base)(trim ? null : o.color);
  const T = { trim, [trim || 'plain']: true, ...p };
  T.dark = M.plastic('#141517', 0.5);
  T.black = M.plastic('#0c0c0d', 0.35);
  T.rubber = M.rubber();
  T.metal = M.metal('#b9bcc1', 0.3);
  T.port = M.matte('#050506', 0.6);
  T.bezelMat = new THREE.MeshPhysicalMaterial({ color: p.bezel, roughness: 0.15, clearcoat: 1, name: 'bezel' });
  T.isTrim = !!trim;
  return T;
}

/* ------------------------------ screen content ------------------------------ */

const PALS = [['#1d2b64', '#f8cdda'], ['#0f2027', '#2c5364'], ['#ff512f', '#dd2476'], ['#11998e', '#38ef7d'], ['#3a1c71', '#ffaf7b'], ['#355c7d', '#c06c84']];

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

const DRAW = {
  desktop(g, w, h, R) {
    const [a, b] = R.pick(PALS);
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, a); gr.addColorStop(1, b);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(R() * w, R() * h, h * (0.2 + R() * 0.3), 0, 7); g.fill(); }
    for (let i = 0; i < 2; i++) {
      const x = w * (0.08 + i * 0.3 + R() * 0.1), y = h * (0.1 + R() * 0.15), ww = w * 0.45, hh = h * 0.5;
      g.fillStyle = 'rgba(0,0,0,0.25)'; rr(g, x + 6, y + 8, ww, hh, 8); g.fill();
      g.fillStyle = '#f4f6f9'; rr(g, x, y, ww, hh, 8); g.fill();
      g.fillStyle = '#d9dee6'; g.fillRect(x, y + 8, ww, h * 0.05);
      ['#ff5f57', '#febc2e', '#28c840'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(x + 12 + k * 14, y + 8 + h * 0.025, 4, 0, 7); g.fill(); });
      g.fillStyle = '#9aa4b2'; for (let l = 0; l < 6; l++) g.fillRect(x + 14, y + h * 0.1 + l * hh * 0.12, ww * (0.4 + R() * 0.5), 4);
    }
    g.fillStyle = 'rgba(255,255,255,0.35)'; rr(g, w * 0.25, h * 0.88, w * 0.5, h * 0.09, 10); g.fill();
    for (let i = 0; i < 8; i++) { g.fillStyle = `hsl(${R() * 360},70%,55%)`; rr(g, w * 0.27 + i * w * 0.058, h * 0.895, w * 0.045, h * 0.07, 6); g.fill(); }
  },
  game(g, w, h, R) {
    const hue = R() * 360;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, `hsl(${hue},70%,55%)`); gr.addColorStop(1, `hsl(${hue + 40},80%,80%)`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(w * 0.8, h * 0.2, h * 0.08, 0, 7); g.fill();
    for (let l = 0; l < 3; l++) {
      g.fillStyle = `hsl(${hue + 120 + l * 15},45%,${38 - l * 9}%)`; g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += w / 12) g.lineTo(x, h * (0.55 + l * 0.12) - Math.sin(x / w * 7 + l * 2 + R()) * h * 0.06);
      g.lineTo(w, h); g.fill();
    }
    g.fillStyle = '#e8402a'; g.fillRect(w * 0.3, h * 0.66, w * 0.05, h * 0.1); g.fillStyle = '#ffd7a8'; g.fillRect(w * 0.31, h * 0.6, w * 0.03, h * 0.06);
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(w * 0.03, h * 0.04, w * 0.3, h * 0.06);
    g.fillStyle = '#ff3355'; g.fillRect(w * 0.04, h * 0.05, w * 0.2, h * 0.04);
    g.fillStyle = '#fff'; g.font = `bold ${Math.round(h * 0.07)}px monospace`; g.fillText(`SCORE ${R.int(1000, 99999)}`, w * 0.6, h * 0.09);
  },
  home(g, w, h, R) {
    const [a, b] = R.pick(PALS);
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `300 ${Math.round(w * 0.2)}px sans-serif`; g.fillText(`${R.int(7, 11)}:${R.int(10, 59)}`, w / 2, h * 0.17);
    const s = w / 4.6;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
      g.fillStyle = `hsl(${R() * 360},70%,${50 + R() * 15}%)`; rr(g, w * 0.07 + c * s * 1.1, h * 0.26 + r * s * 1.25, s * 0.85, s * 0.85, s * 0.22); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.3)'; rr(g, w * 0.05, h * 0.86, w * 0.9, h * 0.11, w * 0.08); g.fill();
  },
  watch(g, w, h, R) {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    ['#ff2d55', '#a6ff00', '#00d8ff'].forEach((c, i) => {
      g.strokeStyle = c; g.lineWidth = w * 0.06; g.lineCap = 'round'; g.globalAlpha = 0.25; g.beginPath(); g.arc(cx, cy, w * (0.4 - i * 0.075), 0, 7); g.stroke();
      g.globalAlpha = 1; g.beginPath(); g.arc(cx, cy, w * (0.4 - i * 0.075), -PI / 2, -PI / 2 + PI * 2 * (0.4 + R() * 0.55)); g.stroke();
    });
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `bold ${Math.round(w * 0.13)}px sans-serif`; g.fillText(`${R.int(1, 12)}:${R.int(10, 59)}`, cx, cy + w * 0.05);
  },
  eink(g, w, h, R) {
    g.fillStyle = '#e4e3dc'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2a2a'; g.font = `bold ${Math.round(w * 0.06)}px serif`; g.fillText(`Chapter ${R.int(1, 30)}`, w * 0.08, h * 0.09);
    g.fillStyle = '#555'; for (let l = 0; l < 26; l++) g.fillRect(w * 0.08, h * 0.13 + l * h * 0.032, w * (l % 7 === 6 ? 0.5 : 0.84), h * 0.012);
  },
  camera(g, w, h, R) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fb8e8'); gr.addColorStop(0.55, '#d9ecf7'); gr.addColorStop(0.56, '#5b8a3a'); gr.addColorStop(1, '#2e4d1d');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3d5a2a'; g.beginPath(); g.arc(w * 0.3, h * 0.56, h * 0.18, PI, 0); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5;
    for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(w * i / 3, 0); g.lineTo(w * i / 3, h); g.moveTo(0, h * i / 3); g.lineTo(w, h * i / 3); g.stroke(); }
    g.strokeStyle = '#7dff5a'; g.lineWidth = 3; g.strokeRect(w * 0.42, h * 0.38, w * 0.16, h * 0.24);
    g.fillStyle = '#fff'; g.font = `${Math.round(h * 0.07)}px monospace`; g.fillText('ISO 200  1/250  f2.8', w * 0.04, h * 0.95);
    g.fillStyle = '#ff3b30'; g.beginPath(); g.arc(w * 0.93, h * 0.08, h * 0.035, 0, 7); g.fill();
  },
  code(g, w, h, R) {
    g.fillStyle = '#1e1f26'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2c36'; g.fillRect(0, 0, w * 0.18, h);
    const cols = ['#c792ea', '#82aaff', '#c3e88d', '#f78c6c', '#89ddff', '#ffcb6b'];
    for (let l = 0; l < 28; l++) {
      let x = w * 0.22 + (R() < 0.5 ? w * 0.04 : 0) * R.int(0, 3);
      const y = h * 0.04 + l * h * 0.034;
      for (let k = 0; k < R.int(1, 4); k++) { const ww = w * (0.04 + R() * 0.15); g.fillStyle = R.pick(cols); g.fillRect(x, y, ww, h * 0.016); x += ww + w * 0.015; }
    }
  },
  retro(g, w, h, R) {
    g.fillStyle = '#031a08'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#39ff6a'; g.font = `${Math.round(h * 0.075)}px monospace`;
    const lines = ['READY.', 'LOAD "*",8,1', 'SEARCHING...', 'RUN', '> ' + 'HELLO WORLD', `${R.int(3000, 64000)} BYTES FREE`, '_'];
    lines.forEach((t, i) => g.fillText(t, w * 0.05, h * 0.13 + i * h * 0.12));
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 2);
  },
  dash(g, w, h, R) {
    g.fillStyle = '#0e1726'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) { g.fillStyle = '#18243a'; rr(g, w * (0.04 + i * 0.32), h * 0.06, w * 0.28, h * 0.22, 8); g.fill(); g.fillStyle = ['#4fd1c5', '#f6ad55', '#fc8181'][i]; g.font = `bold ${Math.round(h * 0.09)}px sans-serif`; g.fillText(`${R.int(10, 99)}%`, w * (0.07 + i * 0.32), h * 0.21); }
    g.fillStyle = '#18243a'; rr(g, w * 0.04, h * 0.34, w * 0.92, h * 0.6, 8); g.fill();
    g.strokeStyle = '#63b3ed'; g.lineWidth = 3; g.beginPath();
    for (let x = 0; x <= 20; x++) g.lineTo(w * (0.07 + x * 0.043), h * (0.85 - 0.4 * (0.5 + 0.5 * Math.sin(x * 0.7 + R() * 0.6))));
    g.stroke();
  },
  video(g, w, h, R) {
    DRAW.camera(g, w, h, R);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, h * 0.86, w, h * 0.14);
    g.fillStyle = '#ff2d2d'; g.fillRect(w * 0.04, h * 0.92, w * 0.5, h * 0.025); g.fillStyle = '#666'; g.fillRect(w * 0.54, h * 0.92, w * 0.42, h * 0.025);
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.moveTo(w * 0.46, h * 0.38); g.lineTo(w * 0.56, h * 0.5); g.lineTo(w * 0.46, h * 0.62); g.fill();
  },
  boot(g, w, h, R) {
    g.fillStyle = '#05060a'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.45, r = Math.min(w, h) * 0.13;
    const gr = g.createConicGradient ? g.createConicGradient(0, cx, cy) : null;
    if (gr) { ['#ff5fa2', '#ffd23f', '#3fc3ff', '#c86bff', '#ff5fa2'].forEach((c, i) => gr.addColorStop(i / 4, c)); g.strokeStyle = gr; } else g.strokeStyle = '#3fc3ff';
    g.lineWidth = r * 0.45; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    g.fillStyle = '#333'; rr(g, w * 0.35, h * 0.72, w * 0.3, h * 0.02, 4); g.fill(); g.fillStyle = '#ddd'; rr(g, w * 0.35, h * 0.72, w * 0.3 * (0.3 + R() * 0.6), h * 0.02, 4); g.fill();
  },
  vr(g, w, h, R) {
    DRAW.game(g, w / 2, h, R);
    g.drawImage(g.canvas, 0, 0, w / 2, h, w / 2, 0, w / 2, h);
  },
};

/** Canvas texture for screen content (null in Node). */
export function screenTex(kind, aspect, seed) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  const w = aspect >= 1 ? 512 : Math.round(512 * aspect), h = aspect >= 1 ? Math.round(512 / aspect) : 512;
  c.width = Math.max(64, w); c.height = Math.max(64, h);
  const g = c.getContext('2d');
  (DRAW[kind] ?? DRAW.desktop)(g, c.width, c.height, rng(seed));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function crackTex(seed) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const R = rng(seed);
  const cx = 120 + R() * 270, cy = 120 + R() * 270;
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 14; i++) {
    let x = cx, y = cy, a = R() * PI * 2;
    g.lineWidth = 1 + R() * 2; g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 8; s++) { a += (R() - 0.5) * 0.8; x += Math.cos(a) * 40; y += Math.sin(a) * 40; g.lineTo(x, y); }
    g.stroke();
  }
  for (let r = 18; r < 90; r += 24) { g.lineWidth = 1; g.beginPath(); for (let k = 0; k <= 12; k++) { const a = k / 12 * PI * 2; g.lineTo(cx + Math.cos(a) * r * (0.8 + R() * 0.4), cy + Math.sin(a) * r * (0.8 + R() * 0.4)); } g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------ device context ------------------------------ */

export function makeCtx(o, T, seed) {
  const ctx = { o, T, seed, R: rng(seed), screens: [], lamps: new Map(), extra: [], n: {} };
  ctx.uid = (b) => { const k = ctx.n[b] ?? 0; ctx.n[b] = k + 1; return k ? `${b}_${k}` : b; };
  return ctx;
}

/**
 * Screen plane (or disc). Faces +Z of `at/rot` frame. Content glows on the 'on' animation;
 * 'lit' trim shows it on by default; 'damaged' adds a crack overlay.
 */
export function screen(ctx, par, w, h, { at = [0, 0, 0], rot = [0, 0, 0], content = 'desktop', round = false, bright = 1, curve } = {}) {
  const { T } = ctx;
  const name = ctx.uid('screen');
  const kind = T.retro && content !== 'eink' && content !== 'watch' ? 'retro' : T.gaming && /desktop|home|code|dash/.test(content) ? 'game' : content;
  const tex = screenTex(kind, w / h, `${ctx.seed}-${name}`);
  const eink = kind === 'eink';
  const mat = new THREE.MeshPhysicalMaterial({
    name: 'screen', color: eink ? '#ffffff' : '#07090c', map: eink ? tex : null, roughness: eink ? 0.8 : 0.1, metalness: eink ? 0 : 0.15,
    clearcoat: eink ? 0 : 1, emissive: tex ? '#ffffff' : kind === 'retro' ? '#2fbf55' : '#3d5f92', emissiveMap: tex,
    emissiveIntensity: T.lit ? bright * 1.1 : eink ? 0 : 0.16,
  });
  if (eink && !tex) mat.color.set('#dcdbd3');
  let geo;
  if (curve) {
    const th = w / curve;
    geo = new THREE.CylinderGeometry(curve, curve, h, 40, 1, true, PI - th / 2, th);
    geo.translate(0, 0, curve);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
    mat.side = THREE.BackSide;
  } else geo = round ? new THREE.CircleGeometry(w / 2, 48) : new THREE.PlaneGeometry(w, h);
  const m = mesh(geo, mat, { parent: par, at, rot, name });
  ctx.screens.push({ name, bright: eink ? 0.25 : bright });
  if (T.damaged && !curve) {
    const ov = mesh(round ? new THREE.CircleGeometry(w / 2, 48) : new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: crackTex(ctx.seed), transparent: true, depthWrite: false, color: crackTex(ctx.seed) ? '#ffffff' : '#000000', opacity: crackTex(ctx.seed) ? 1 : 0 }),
      { parent: m, at: [0, 0, 0.0004], name: ctx.uid('crack') });
    ov.renderOrder = 2;
  }
  return m;
}

/** Small status LED via core/lamps.js; kind ∈ green|red|blue|amber|white. */
export function led(ctx, par, kind, { at, normal = [0, 0, 1], w = 0.004, h, shape = 'round', glow } = {}) {
  let L = ctx.lamps.get(kind);
  if (!L) {
    L = lampGroup(`led_${kind}`, kind);
    ctx.lamps.set(kind, L);
    if (ctx.T.lit) { L.lens.emissiveIntensity = 2.4; L.glow.opacity = 0.75; }
  }
  return L.add(par, { at, normal, w, h: h ?? w, depth: Math.min(w, h ?? w) * 0.4, shape, bezel: false, glowSize: glow ?? Math.max(w, h ?? w) * 5 + 0.01 });
}

/** Gaming RGB light strip (lamp group 'rgb') + neon line. */
export function rgb(ctx, par, { at, normal = [0, 0, 1], w = 0.1, h = 0.004, roll = 0 } = {}) {
  let L = ctx.lamps.get('rgb');
  if (!L) {
    L = lampGroup('rgb', 'blue');
    L.lens.emissiveIntensity = 1.6; L.lens.emissive.set('#7a3cff');
    ctx.lamps.set('rgb', L);
    if (ctx.T.lit) L.glow.opacity = 0.6;
  }
  return L.add(par, { at, normal, w, h, depth: h * 0.5, shape: 'strip', bezel: false, roll, glowSize: Math.max(w, h) * 1.4 });
}

/** The library emblem, flush on a surface; `rot` turns +Z to the surface normal. */
export function emblem(par, size, at, rot = [0, 0, 0]) {
  const e = brandEmblem(size);
  e.position.set(...at); e.rotation.set(...rot);
  par.add(e);
  return e;
}

/** Row of vent slots (dark, slightly recessed look) on a face whose normal is +Z of the frame. */
export function vents(par, mat, { at = [0, 0, 0], rot = [0, 0, 0], n = 8, w = 0.003, h = 0.03, gap = 0.006, d = 0.002, vertical = true } = {}) {
  const g = group('vents', { parent: par, at, rot });
  const geo = roundedBox(vertical ? w : h, vertical ? h : w, d, Math.min(w, d) * 0.45, 1);
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * gap;
    mesh(geo, mat, { parent: g, at: vertical ? [o, 0, 0] : [0, o, 0] });
  }
  return g;
}

/** Port cut-outs: list of 'c' | 'a' | 'hdmi' | 'jack' | 'eth' | 'sd' along +X on a face with normal +Z. */
export function ports(par, mat, list, { at = [0, 0, 0], rot = [0, 0, 0], gap = 0.006 } = {}) {
  const g = group('ports', { parent: par, at, rot });
  const S = { c: [0.009, 0.0032], a: [0.0125, 0.0048], hdmi: [0.015, 0.0055], jack: [0.0035, 0.0035], eth: [0.016, 0.013], sd: [0.024, 0.0025], dc: [0.006, 0.006] };
  let x = 0;
  for (const p of list) {
    const [w, h] = S[p] ?? S.c;
    const geo = p === 'jack' || p === 'dc' ? new THREE.CylinderGeometry(w / 2, w / 2, 0.002, 16).rotateX(PI / 2) : roundedBox(w, h, 0.002, Math.min(w, h) * 0.45, 1);
    mesh(geo, mat, { parent: g, at: [x + w / 2, 0, 0] });
    x += w + gap;
  }
  g.children.forEach((c) => (c.position.x -= x / 2));
  return g;
}

/** Flat rounded slab lying in XZ (w × d), thickness th, bottom at y. */
export function slab(par, mat, w, th, d, { at = [0, 0, 0], r, name } = {}) {
  const rad = r ?? Math.min(w, d) * 0.08;
  // rounded corners in plan, softly rounded edges
  const s = new THREE.Shape();
  const x = -w / 2, z = -d / 2, q = Math.min(rad, w / 2 - 1e-4, d / 2 - 1e-4);
  s.moveTo(x + q, z); s.lineTo(x + w - q, z); s.quadraticCurveTo(x + w, z, x + w, z + q); s.lineTo(x + w, z + d - q);
  s.quadraticCurveTo(x + w, z + d, x + w - q, z + d); s.lineTo(x + q, z + d); s.quadraticCurveTo(x, z + d, x, z + d - q); s.lineTo(x, z + q); s.quadraticCurveTo(x, z, x + q, z);
  const bev = Math.min(th * 0.35, q * 0.6);
  const geo = extrudeOutline(s, th, { bevel: bev, segments: 2 });
  geo.rotateX(PI / 2);
  const m = mesh(geo, mat, { parent: par, at: [at[0], at[1] + th / 2, at[2]], name });
  return m;
}

/** Hollow rounded-rect frame (bumper) in XZ plane: outer w×d, wall t, height th, bottom at y. */
export function frame(par, mat, w, th, d, t, { at = [0, 0, 0], r } = {}) {
  const rect = (W, D, q) => {
    const s = new THREE.Path();
    const x = -W / 2, z = -D / 2;
    s.moveTo(x + q, z); s.lineTo(x + W - q, z); s.quadraticCurveTo(x + W, z, x + W, z + q); s.lineTo(x + W, z + D - q);
    s.quadraticCurveTo(x + W, z + D, x + W - q, z + D); s.lineTo(x + q, z + D); s.quadraticCurveTo(x, z + D, x, z + D - q); s.lineTo(x, z + q); s.quadraticCurveTo(x, z, x + q, z);
    return s;
  };
  const q = r ?? Math.min(w, d) * 0.1;
  const shape = new THREE.Shape(rect(w, d, q).getPoints(6));
  shape.holes.push(new THREE.Path(rect(w - 2 * t, d - 2 * t, Math.max(q - t, 0.001)).getPoints(6).reverse()));
  const geo = extrudeOutline(shape, th, { bevel: Math.min(t, th) * 0.3, segments: 2 });
  geo.rotateX(PI / 2);
  return mesh(geo, mat, { parent: par, at: [at[0], at[1] + th / 2, at[2]] });
}

/**
 * Trim add-ons for a flat device of footprint w×d, height th sitting at `at` (bottom):
 * rugged → orange corner bumpers + screws; kids → chunky silicone frame; damaged → duct tape on a corner.
 */
export function trimShell(ctx, par, w, th, d, { at = [0, 0, 0], r } = {}) {
  const { T } = ctx;
  const [x0, y0, z0] = at;
  if (T.rugged) {
    const c = Math.min(w, d) * 0.16, ct = Math.max(th * 1.25, 0.004);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      mesh(roundedBox(c, ct, c, Math.min(c, ct) * 0.3, 2), T.accent, { parent: par, at: [x0 + sx * (w / 2 - c * 0.35), y0 + ct / 2 - (ct - th) / 2, z0 + sz * (d / 2 - c * 0.35)] });
      mesh(new THREE.CylinderGeometry(c * 0.09, c * 0.09, ct * 0.06 + 0.0008, 10), T.metal, { parent: par, at: [x0 + sx * (w / 2 - c * 0.3), y0 + ct - (ct - th) / 2, z0 + sz * (d / 2 - c * 0.3)] });
    }
  } else if (T.kids) {
    frame(par, T.body2, w + Math.min(w, d) * 0.12, th * 1.2, d + Math.min(w, d) * 0.12, Math.min(w, d) * 0.08, { at: [x0, y0 - th * 0.1, z0], r: r ? r + Math.min(w, d) * 0.06 : undefined });
  } else if (T.damaged) {
    const tw = Math.min(w, d) * 0.5;
    mesh(roundedBox(tw, th + 0.0016, tw * 0.28, 0.0007, 1), M.matte('#9b9d9f', 0.95), { parent: par, at: [x0 + w / 2 - tw * 0.3, y0 + th / 2, z0 - d / 2 + tw * 0.3], rot: [0, PI / 4, 0] });
  }
}

/** Instanced key caps. rows: arrays of key widths in units; deck surface at local y=0. */
export function keyGrid(ctx, par, rows, { u = 0.019, gap = 0.0025, kh = 0.004, mat, modMat, at = [0, 0, 0], low = false } = {}) {
  const { T } = ctx;
  const g = group('keys', { parent: par, at });
  const cap = u - gap;
  const geo = roundedBox(1, kh, cap, Math.min(cap * 0.18, kh * 0.45), 2);
  geo.translate(0, kh / 2, 0);
  const alpha = [], mods = [];
  const width = Math.max(...rows.map((r) => r.reduce((a, b) => a + b, 0))) * u;
  rows.forEach((row, ri) => {
    let x = -width / 2;
    for (const k of row) {
      if (k > 0) (k === 1 || k === 1.5 && low ? alpha : mods).push([x + (k * u) / 2, (ri - (rows.length - 1) / 2) * u, k * u - gap]);
      x += Math.abs(k) * u;
    }
  });
  const m4 = new THREE.Matrix4();
  const make = (list, material, name) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, material, list.length);
    im.name = name;
    // drop a key on damaged trims
    list.forEach(([x, z, w], i) => {
      const miss = T.damaged && i === 7;
      m4.makeScale(w, miss ? 0.2 : 1, 1).setPosition(x, 0, z);
      im.setMatrixAt(i, m4);
    });
    g.add(im);
  };
  make(alpha, mat ?? (T.white || T.kids || T.retro ? M.plastic(T.retro ? '#efe7d2' : '#f6f7f8', 0.5) : M.plastic('#1a1b1e', 0.6)), 'keycaps');
  make(mods, modMat ?? (T.retro ? M.plastic('#8b7d68', 0.55) : T.kids ? T.accent : T.gaming ? M.plastic('#2a2b33', 0.4) : mat ?? M.plastic(T.white ? '#dfe2e6' : '#26272b', 0.6)), 'modkeys');
  if (T.gaming) {
    // glowing underplate (per-key RGB look)
    const tex = typeof document === 'undefined' ? null : (() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 32;
      const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 256, 0);
      ['#ff004c', '#ffb300', '#3dff6b', '#00c8ff', '#8a3dff', '#ff00c8'].forEach((cc, i) => gr.addColorStop(i / 5, cc));
      x.fillStyle = gr; x.fillRect(0, 0, 256, 32); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const plate = new THREE.MeshStandardMaterial({ color: '#111', emissive: tex ? '#ffffff' : '#c02cff', emissiveMap: tex, emissiveIntensity: 1.4, name: 'rgbplate' });
    mesh(new THREE.PlaneGeometry(width, rows.length * u).rotateX(-PI / 2), plate, { parent: g, at: [0, 0.0003, 0] });
  }
  return { group: g, width, depth: rows.length * u };
}

export const LAYOUT = {
  laptop: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75], [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25], [1.25, 1, 1.25, 5.5, 1.25, 1, 1, 1, 1.25]],
  sixty: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25], [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75], [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25]],
};
LAYOUT.tkl = [[1, -1, 1, 1, 1, 1, -0.5, 1, 1, 1, 1, -0.5, 1, 1, 1, 1, -0.25, 1, 1, 1], ...LAYOUT.sixty.map((r, i) => [...r, -0.25, ...(i < 2 ? [1, 1, 1] : i === 3 ? [-1, 1, -1] : i === 4 ? [1, 1, 1] : [-3])])];
LAYOUT.full = LAYOUT.tkl.map((r, i) => [...r, -0.25, ...(i === 0 ? [-4] : i === 5 ? [2, 1, 1] : [1, 1, 1, 1])]);

/* ------------------------------ device wrapper ------------------------------ */

/** The 'on' clip: screens fade up and glow, LEDs/RGB light. */
export function onClip(ctx, extra = []) {
  const tracks = [...extra];
  for (const s of ctx.screens) {
    tracks.push(numberTrack(`${s.name}.material.emissiveIntensity`, 3, (t) => s.bright * (t < 0.1 ? (t / 0.1) * 1.25 : 1.1 + 0.04 * Math.sin(t * 40)), 30));
  }
  for (const [kind, L] of ctx.lamps) tracks.push(...lampTracks(L.name, kind === 'rgb' ? 3 : 2.6, { glow: kind === 'rgb' ? 0.7 : 0.85, blink: kind === 'amber' ? 1 : 0 }));
  return tracks.length ? clip('on', 3, tracks) : null;
}

/**
 * Factory wrapper. build(g, { ctx, T, V, variant, o }) adds parts and returns extra clips.
 * The model is lifted so its lowest solid point sits on y=0.
 */
export function makeDevice(type, VARIANTS, build) {
  return (options = {}) => {
    const o = normalizeOptions(options);
    const variant = pickVariant(VARIANTS, o.variant, type);
    const trim = o.trim && TRIMS.includes(o.trim) ? o.trim : null;
    const T = style(o, trim);
    const ctx = makeCtx(o, T, `${type}-${variant}-${trim}`);
    const root = group(type);
    const g = group('body', { parent: root });
    const extra = build(g, { ctx, T, V: VARIANTS[variant], variant, o }) || [];
    root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const b = new THREE.Box3();
    root.traverse((m) => {
      if (!m.isMesh || m.userData.noShadow || m.material?.blending === THREE.AdditiveBlending) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      box.union(b.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld));
    });
    g.position.y = -box.min.y;
    const on = onClip(ctx, ctx.extra);
    return finalize(root, { type, variant, options: o, animations: [on, ...extra].filter(Boolean) });
  };
}

/** Pick screen content per variant default unless a trim forces it. */
export const pickContent = (ctx, def) => def;
