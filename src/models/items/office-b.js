// Everyday items, office & school (part B): calculators, globes, lunchboxes, water bottles,
// books & paper reading matter, tickets & paper goods.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, extrudeOutline, setup, done, fin, tm, hw, vessel, openBox, labelPlane, textDraw, canvasTex, clip, rotateTrack, moveTrack, spinTrack, numberTrack, pingPong, lampGroup, lampTracks } from './common.js';
import { hard, latheX, topLabel } from './office-a.js';

const css = (c) => M.toColor(c).getStyle();
const paperMat = (c = '#f6f4ee') => new THREE.MeshStandardMaterial({ name: 'paper', color: c, roughness: 0.9 });

/* =============================== CALCULATORS =============================== */

export const CALCULATOR_VARIANTS = {
  basic: { p: '#2a2b2e', s: '#45484e', a: '#e8702a' },
  scientific: { p: '#1f2a3a', s: '#3a4558', a: '#e8b23a' },
  'desk-calculator': { p: '#d9d6cf', s: '#4a4d52', a: '#e8702a' },
  'printing-calculator': { p: '#e9e6df', s: '#5a5d62', a: '#c42a2a' },
};

function keypad(parent, { cols, rows, w, d, kw, kd, kh, y = 0, matAt }) {
  const g = group('keys', { parent, at: [0, y, 0] });
  const geos = new Map();
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const key = `${kw}`;
    if (!geos.has(key)) geos.set(key, roundedBox(kw, kh, kd, Math.min(kh * 0.45, kw * 0.3)));
    mesh(geos.get(key), matAt(i, j), { parent: g, at: [-w / 2 + (i + 0.5) * (w / cols), kh / 2 - kh * 0.2, -d / 2 + (j + 0.5) * (d / rows)] });
  }
  return g;
}

export function createCalculator(options = {}) {
  const { o, variant, T } = setup(options, CALCULATOR_VARIANTS, 'calculator');
  const root = group(`calculator-${variant}`);
  const k = T.k * (T.chunky ? 1.15 : 1);
  const bodyM = hard(T, 'p');
  const keyM = M.plastic(T.trim === 'white' ? '#f4f3ef' : T.trim === 'kids' ? T.s : T.s, 0.45);
  const opM = M.plastic(T.a, 0.4);
  const eqM = M.plastic(T.trim === 'kids' ? '#2fbf5a' : T.a, 0.4);
  const kidsCols = ['#ff4d6d', '#2b7de1', '#ffcc1e', '#2fbf5a'];
  const matAt = (cols, rows) => (i, j) => (T.trim === 'kids' ? M.plastic(kidsCols[(i + j) % 4], 0.4) : i === cols - 1 ? (j === rows - 1 ? eqM : opM) : j === 0 ? M.plastic('#8e939a', 0.45) : keyM);
  const lcd = T.trim === 'retro' ? { bg: '#0f1a14', fg: '#3dff8a' } : T.trim === 'neon' ? { bg: '#0d0d12', fg: '#ff2bd6' } : { bg: '#a9b89a', fg: '#1d2a1d' };
  const dispDraw = (txt) => (g, w, h) => { g.fillStyle = lcd.bg; g.fillRect(0, 0, w, h); g.fillStyle = lcd.fg; g.font = `${h * 0.7}px monospace`; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(txt, w * 0.95, h * 0.55); };
  const sloped = variant === 'desk-calculator' || variant === 'printing-calculator';
  if (!sloped) {
    const sci = variant === 'scientific';
    const W = (sci ? 0.08 : 0.075) * k * T.w, D = (sci ? 0.165 : 0.12) * k, H = (sci ? 0.016 : 0.011) * (T.slim ? 0.6 : 1) * k;
    mesh(roundedBox(W, H, D, Math.min(H * 0.45, 0.004 * T.round)), bodyM, { parent: root, at: [0, H / 2, 0], name: 'body' });
    mesh(roundedBox(W * 0.86, 0.0012, D * 0.2, 0.0005), M.plastic('#1b1b1d', 0.3), { parent: root, at: [0, H + 0.0004, -D * 0.33], name: 'bezel' });
    const disp = labelPlane(W * 0.78, D * 0.13, dispDraw(sci ? '3.14159265' : '1234.56'), { bg: lcd.bg, emissive: 0.25, px: 256 });
    disp.name = 'display'; disp.rotation.x = -Math.PI / 2; disp.position.set(0, H + 0.0011, -D * 0.33); root.add(disp);
    if (!sci) mesh(roundedBox(W * 0.4, 0.0008, D * 0.05, 0.0003), new THREE.MeshPhysicalMaterial({ color: '#3a2a2a', roughness: 0.2, metalness: 0.4, clearcoat: 1 }), { parent: root, at: [W * 0.18, H + 0.0002, -D * 0.45], name: 'solar' });
    const cols = sci ? 5 : 4, rows = sci ? 8 : 5;
    const kw = (W * 0.84) / cols * (T.chunky ? 0.85 : 0.75), kd = (D * (sci ? 0.62 : 0.6)) / rows * (sci ? 0.62 : 0.7);
    keypad(root, { cols, rows, w: W * 0.84, d: D * (sci ? 0.62 : 0.6), kw, kd, kh: 0.003 * (T.chunky ? 1.6 : 1), matAt: matAt(cols, rows) }).position.set(0, H, D * 0.15);
  } else {
    const print = variant === 'printing-calculator';
    const W = (print ? 0.2 : 0.15) * k * T.w, D = (print ? 0.26 : 0.19) * k, hf = 0.012 * k, hb = (print ? 0.05 : 0.035) * k * (T.slim ? 0.7 : 1);
    const prof = [[-D / 2, 0], [D / 2, 0], [D / 2, hf * 0.7], [D / 2 - 0.004, hf], [-D / 2 + 0.006, hb], [-D / 2, hb - 0.004]];
    const bodyG = extrudeOutline(prof, W, { bevel: 0.003 * T.round }).rotateY(-Math.PI / 2);
    mesh(bodyG, bodyM, { parent: root, name: 'body' });
    const a = Math.atan2(hb - hf, D - 0.01);
    const pad = group('pad', { parent: root, at: [0, (hf + hb) / 2 + 0.0035, 0], rot: [a, 0, 0] });
    const disp = labelPlane(W * 0.7, D * 0.12, dispDraw(print ? '00000.00' : '98765.43'), { bg: lcd.bg, emissive: 0.25, px: 256 });
    disp.name = 'display'; disp.rotation.x = -Math.PI / 2; disp.position.set(-W * 0.05, 0.0002, -D * 0.33); pad.add(disp);
    mesh(roundedBox(W * 0.8, 0.002, D * 0.17, 0.0008), M.plastic('#1b1b1d', 0.3), { parent: pad, at: [-W * 0.05, -0.0008, -D * 0.33], name: 'bezel' });
    const cols = print ? 6 : 5, rows = 5;
    keypad(pad, { cols, rows, w: W * 0.85, d: D * 0.62, kw: (W * 0.85) / cols * 0.78, kd: (D * 0.62) / rows * 0.75, kh: 0.006 * (T.chunky ? 1.4 : 1), matAt: matAt(cols, rows), y: -0.002 }).position.z = D * 0.13;
    if (print) {
      // paper roll holder at the back + tape
      const ry = hb + 0.03 * k, rz = -D / 2 + 0.01;
      for (const s of [-1, 1]) mesh(roundedBox(0.006, 0.04 * k, 0.03 * k, 0.002), M.plastic(T.s, 0.5), { parent: root, at: [s * 0.04 * k, hb + 0.012 * k, rz], name: 'arm' });
      mesh(new THREE.CylinderGeometry(0.028 * k, 0.028 * k, 0.057 * k, 32).rotateZ(Math.PI / 2), paperMat('#f8f6f0'), { parent: root, at: [0, ry, rz], name: 'paper-roll' });
      mesh(new THREE.CylinderGeometry(0.006 * k, 0.006 * k, 0.086 * k, 16).rotateZ(Math.PI / 2), M.plastic('#2a2b2e', 0.5), { parent: root, at: [0, ry, rz] });
      const tape = mesh(roundedBox(0.056 * k, 0.0004, 0.07 * k, 0.0001), paperMat('#f8f6f0'), { parent: root, at: [0, ry + 0.028 * k - 0.004, rz + 0.032 * k], rot: [0.75, 0, 0], name: 'tape' });
      tape.position.y = hb + 0.035 * k;
      mesh(roundedBox(0.07 * k, 0.006, 0.012, 0.002), M.plastic('#1b1b1d', 0.4), { parent: root, at: [0, hb + 0.003, rz + 0.03 * k], name: 'slot' });
    }
  }
  return done(root, 'calculator', variant, o, () => [clip('on', 1, [numberTrack('display.material.emissiveIntensity', 1, () => 0.9)])]);
}

/* ================================== GLOBES ================================== */

export const GLOBE_VARIANTS = { 'desk-globe': {}, 'floor-globe': {}, 'illuminated-globe': {}, 'mini-globe': {} };

const LAND = [[-100, 48, 34, 18], [-112, 35, 14, 12], [-85, 30, 8, 8], [-75, 45, 10, 8], [-150, 63, 14, 7], [-60, -12, 16, 18], [-68, -35, 8, 14], [-42, 72, 13, 7], [12, 50, 14, 8], [25, 60, 10, 8], [18, 8, 18, 16], [28, -15, 12, 14], [45, 25, 10, 8], [90, 50, 42, 16], [100, 30, 22, 10], [78, 20, 7, 9], [105, 12, 8, 8], [135, -25, 15, 10], [140, 37, 4, 7], [115, 0, 10, 4], [0, -84, 180, 7], [47, -20, 3, 6]];
const _mapCache = new Map();
function mapTex(ocean, land, line) {
  if (typeof document === 'undefined') return null;
  const key = `${ocean}|${land}|${line}`;
  if (_mapCache.has(key)) return _mapCache.get(key);
  const t = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = ocean; g.fillRect(0, 0, w, h);
    let s = 11; const R = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    g.fillStyle = land;
    for (const [lon, lat, rx, ry] of LAND) {
      for (let i = 0; i < 9; i++) {
        const x = ((lon + 180 + (R() - 0.5) * rx) / 360) * w, y = ((90 - lat + (R() - 0.5) * ry) / 180) * h;
        g.beginPath(); g.ellipse(x, y, (rx / 360) * w * (0.4 + R() * 0.5), (ry / 180) * h * (0.4 + R() * 0.5), R() * 3, 0, 7); g.fill();
      }
    }
    g.strokeStyle = line; g.globalAlpha = 0.35; g.lineWidth = 1;
    for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo((i * w) / 12, 0); g.lineTo((i * w) / 12, h); g.stroke(); }
    for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, (i * h) / 6); g.lineTo(w, (i * h) / 6); g.stroke(); }
    g.globalAlpha = 1;
  });
  _mapCache.set(key, t);
  return t;
}

export function createGlobe(options = {}) {
  const { o, variant, T } = setup(options, GLOBE_VARIANTS, 'globe', { p: '#2f6fb8', s: '#5b3a24', a: '#c9a25a', mat: 'wood' });
  const root = group(`globe-${variant}`);
  const pal = {
    vintage: ['#d9c79a', '#a8743f', '#6b4a2a'], modern: ['#1b2a44', '#f4f3ef', '#9aa0a8'], kids: ['#3fb6ff', '#5ad65a', '#ffffff'],
    black: ['#141518', '#d6a93c', '#d6a93c'], gold: ['#14284a', '#d6a93c', '#d6a93c'],
  }[T.trim] ?? ['#3a78c2', '#7fb26a', '#ffffff'];
  const tex = mapTex(...pal);
  const illum = variant === 'illuminated-globe';
  const globeM = new THREE.MeshPhysicalMaterial({ name: 'globe', color: tex ? '#ffffff' : pal[0], map: tex, roughness: T.trim === 'vintage' ? 0.6 : 0.3, clearcoat: T.trim === 'vintage' ? 0.2 : 0.8 });
  if (illum) { globeM.emissive = new THREE.Color('#ffffff'); globeM.emissiveMap = tex; globeM.emissiveIntensity = tex ? 0.05 : 0; if (!tex) globeM.emissive = M.toColor(pal[0]); }
  const standM = T.trim === 'kids' ? M.plastic('#ff4d6d', 0.4) : T.trim === 'modern' ? M.metal('#c9ccd2', 0.2) : T.trim === 'black' ? M.plastic('#141414', 0.3) : T.lux || T.trim === 'gold' ? M.metal('#d6a93c', 0.22) : variant === 'mini-globe' ? M.plastic('#2a2b2e', 0.4) : M.wood(T.trim === 'vintage' ? '#5b3a24' : '#7a4a2a');
  const arcM = T.trim === 'modern' ? M.metal('#c9ccd2', 0.2) : T.trim === 'kids' ? M.plastic('#ffcc1e', 0.4) : T.trim === 'black' ? M.metal('#2a2b2e', 0.3) : M.metal('#c9a25a', 0.3);
  const tilt = 0.41;
  const R = { 'desk-globe': 0.15, 'floor-globe': 0.22, 'illuminated-globe': 0.13, 'mini-globe': 0.05 }[variant] * T.k;
  const gap = Math.max(0.003, R * 0.04), Rm = R + gap;
  let cy;
  if (variant === 'floor-globe') {
    cy = 0.62 * T.k + R;
    // tripod legs + stretcher + horizon ring
    const ringR = R + gap * 3;
    mesh(new THREE.TorusGeometry(ringR, 0.012 * T.k, 10, 64).rotateX(Math.PI / 2), standM, { parent: root, at: [0, cy, 0], name: 'horizon-ring' });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.3;
      const c = Math.cos(a), s = Math.sin(a);
      curveTube([[c * ringR, cy, s * ringR], [c * (ringR + 0.02), cy - 0.25 * T.k, s * (ringR + 0.02)], [c * (ringR - 0.03), cy - 0.5 * T.k, s * (ringR - 0.03)], [c * (ringR + 0.06), 0.015, s * (ringR + 0.06)]], 0.016 * T.k, standM, { parent: root, segments: 24, radialSegments: 10 });
      mesh(new THREE.SphereGeometry(0.02 * T.k, 12, 8), standM, { parent: root, at: [c * (ringR + 0.06), 0.015, s * (ringR + 0.06)] });
      tubeBetween(root, [c * (ringR - 0.02), cy - 0.45 * T.k, s * (ringR - 0.02)], [0, cy - 0.47 * T.k, 0], 0.008 * T.k, standM);
    }
    mesh(new THREE.SphereGeometry(0.025 * T.k, 12, 10), standM, { parent: root, at: [0, cy - 0.47 * T.k, 0] });
    // full meridian ring sitting in the horizon ring, globe inside
    const tg = group('tilt', { parent: root, at: [0, cy, 0], rot: [0, 0, tilt] });
    mesh(new THREE.TorusGeometry(Rm + 0.004, 0.006 * T.k, 8, 64), arcM, { parent: tg, name: 'meridian' });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.004, 0.004, gap + 0.01, 8), arcM, { parent: tg, at: [0, s * (R + gap / 2), 0] });
    const sph = mesh(new THREE.SphereGeometry(R, 64, 40), globeM, { parent: tg, name: 'globe' });
    // meridian rests in a notch support at the bottom
    tubeBetween(root, [0, cy - 0.47 * T.k, 0], [Math.sin(tilt) * (Rm + 0.004), cy - Math.cos(tilt) * (Rm + 0.004), 0], 0.008 * T.k, standM);
    return done(root, 'globe', variant, o, () => [clip('spin', 6, [spinTrack(sph, 'y', 6)])]);
  }
  // table globes: base + stem + half meridian
  const baseR = R * (variant === 'mini-globe' ? 0.8 : 0.65) * (T.trim === 'modern' ? 0.85 : 1);
  let topY;
  if (illum || T.trim === 'modern' || T.trim === 'kids') {
    mesh(lathe([[0, 0], [baseR, 0], [baseR, R * 0.06], [baseR * 0.9, R * 0.12], [0, R * 0.13]], 48), standM, { parent: root, name: 'base' });
    topY = R * 0.13;
  } else {
    mesh(lathe([[0, 0], [baseR, 0], [baseR * 1.02, R * 0.04], [baseR * 0.85, R * 0.08], [baseR * 0.55, R * 0.12], [baseR * 0.35, R * 0.2], [R * 0.08, R * 0.24], [0, R * 0.24]], 48), standM, { parent: root, name: 'base' });
    topY = R * 0.24;
  }
  cy = topY + R * 0.25 + Rm * Math.cos(tilt) + 0.004;
  const bx = Math.sin(tilt) * Rm, by = cy - Math.cos(tilt) * Rm;
  tubeBetween(root, [0, topY - 0.002, 0], [0, by - 0.004, 0], Math.max(0.003, R * 0.04), standM);
  tubeBetween(root, [0, by - 0.006, 0], [bx, by, 0], Math.max(0.0025, R * 0.03), standM);
  const tg = group('tilt', { parent: root, at: [0, cy, 0], rot: [0, 0, tilt] });
  mesh(new THREE.TorusGeometry(Rm, Math.max(0.0015, R * 0.018), 8, 64, Math.PI).rotateZ(-Math.PI / 2), arcM, { parent: tg, name: 'meridian' });
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(Math.max(0.0012, R * 0.012), Math.max(0.0012, R * 0.012), gap + 0.004, 8), arcM, { parent: tg, at: [0, s * (R + gap / 2), 0] });
  const sph = mesh(new THREE.SphereGeometry(R, 64, 40), globeM, { parent: tg, name: 'globe' });
  if (T.detail >= 2 || T.trim === 'gold') mesh(new THREE.SphereGeometry(Math.max(0.003, R * 0.04), 10, 8), arcM, { parent: tg, at: [0, Rm + R * 0.03, 0] });
  if (illum) {
    const sw = lampGroup('switch', 'green');
    sw.add(root, { at: [0, R * 0.07, baseR * 0.97], normal: [0, 0, 1], w: 0.008, h: 0.006, depth: 0.003, shape: 'round', bezel: false, glowSize: 0.03 });
    return done(root, 'globe', variant, o, () => [
      clip('on', 1, [numberTrack('globe.material.emissiveIntensity', 1, () => 0.9), ...lampTracks('switch', 2.4)]),
      clip('spin', 6, [spinTrack(sph, 'y', 6)]),
    ]);
  }
  return done(root, 'globe', variant, o, () => [clip('spin', 6, [spinTrack(sph, 'y', 6)])]);
}

function tubeBetween(parent, a, b, r, mat) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 12), mat);
  m.position.copy(va).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  parent.add(m);
  return m;
}

/* ================================ LUNCHBOXES ================================ */

export const LUNCHBOX_VARIANTS = {
  'metal-lunchbox': { p: '#c42a2a', s: '#f2b83a', a: '#2457b8', mat: 'metal' },
  'bento-box': { p: '#1b1b1d', s: '#a8302a', a: '#f4f3ef' },
  'insulated-lunch-bag': { p: '#2d5a8a', s: '#c9ccd2', a: '#1b1b1d', mat: 'nylon' },
  'kids-lunchbox': { p: '#2fbf5a', s: '#ffcc1e', a: '#ff4d6d' },
};

function foodBits(parent, W, D, y, T) {
  // rice, egg roll, broccoli, tomato, carrot sticks
  mesh(cushion(W * 0.45, 0.025, D * 0.85, { radius: 0.01, bulge: 0.3 }), M.matte('#f6f4ee', 0.95), { parent, at: [-W * 0.24, y + 0.0125, 0], name: 'rice' });
  mesh(new THREE.SphereGeometry(0.006, 10, 8), M.matte('#1b1b1d'), { parent, at: [-W * 0.24, y + 0.03, 0] });
  mesh(roundedBox(0.035, 0.02, 0.025, 0.006), M.matte('#f2c84a', 0.7), { parent, at: [W * 0.18, y + 0.01, -D * 0.2] });
  for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(0.011, 10, 8), M.matte('#3f8a3a', 0.9), { parent, at: [W * 0.3 + (i % 2) * 0.012, y + 0.011, D * 0.18 + i * 0.008] });
  mesh(new THREE.SphereGeometry(0.012, 14, 10), M.plastic('#d8262b', 0.3), { parent, at: [W * 0.08, y + 0.012, D * 0.22] });
  void T;
}

export function createLunchbox(options = {}) {
  const { o, variant, T } = setup(options, LUNCHBOX_VARIANTS, 'lunchbox');
  const root = group(`lunchbox-${variant}`);
  const k = T.k * (T.rugged ? 1.15 : 1);
  let anims = [];
  if (variant === 'bento-box') {
    const W = 0.18 * k * T.w, D = 0.11 * k, H = 0.05 * k * T.h, t = 0.003;
    const bm = T.mat === 'wood' || T.trim === 'retro' ? M.wood(T.trim === 'retro' ? '#8a3f26' : T.p) : T.mat === 'metal' ? M.metal('#c9ced4', 0.25) : hard(T, 'p', 'gloss');
    const inner = T.trim === 'retro' ? M.plastic('#1b1b1d', 0.2) : hard(T, 's', 'gloss');
    openBox(W, H, D, t, bm, { parent: root, r: 0.012 * T.round, floorMat: inner, name: 'tier1' });
    mesh(roundedBox(t, H * 0.85, D - 2 * t, 0.001), inner, { parent: root, at: [0.0, H * 0.43, 0] });
    foodBits(root, W, D, t, T);
    const t2 = group('tier2', { parent: root, at: [W * 1.08, 0, 0] });
    openBox(W, H * 0.8, D, t, bm, { parent: t2, r: 0.012 * T.round, floorMat: inner });
    mesh(roundedBox(W - 2 * t, H * 0.7, t, 0.001), inner, { parent: t2, at: [0, H * 0.35, 0] });
    for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(0.014, 12, 10), M.matte(['#e8702a', '#d8262b', '#f2c84a', '#7fb26a'][i]), { parent: t2, at: [-W * 0.3 + i * W * 0.18, t + 0.013, -D * 0.25] });
    for (let i = 0; i < 3; i++) mesh(roundedBox(0.05, 0.012, 0.012, 0.004), M.matte('#d9a85a'), { parent: t2, at: [-W * 0.15 + i * 0.008, t + 0.006 + i * 0.012 * 0.9, D * 0.22], rot: [0, i * 0.3, 0] });
    // lid behind with band + chopsticks on top
    const lid = group('lid', { parent: root, at: [W * 0.5, 0, -D * 1.15] });
    mesh(roundedBox(W + 0.004, 0.012, D + 0.004, Math.min(0.005, 0.012 * T.round * 0.45)), bm, { parent: lid, at: [0, 0.006, 0], name: 'lid-top' });
    mesh(roundedBox(0.02, 0.0135, D + 0.006, 0.002), M.fabric(T.trim === 'kids' ? '#ff4d6d' : T.a), { parent: lid, at: [0, 0.0068, 0], name: 'band' });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.0025, 0.0035, 0.2 * k, 10).rotateZ(Math.PI / 2), M.wood(T.trim === 'retro' ? '#1b1b1d' : '#c9a06a'), { parent: lid, at: [0, 0.016, s * 0.008] });
    anims = () => [clip('open', 3, [moveTrack(lid, 3, (t3) => [0, pingPong(t3) * 0.06, 0])])];
  } else if (variant === 'insulated-lunch-bag') {
    const W = 0.24 * k * T.w, H = 0.18 * k * T.h, D = 0.15 * k, t = 0.008;
    const bm = tm(T, 'p', T.mat === 'metal' || T.mat === 'plastic' ? 'nylon' : undefined);
    const lining = M.metal('#cfd3d8', 0.4);
    openBox(W, H, D, t, bm, { parent: root, r: 0.03 * T.round, floorMat: lining, name: 'bag' });
    openBox(W - 2 * t, H - 0.01, D - 2 * t, 0.002, lining, { parent: root, at: [0, t, 0], r: 0.025, name: 'lining' });
    // sandwich + apple inside
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 3).rotateX(Math.PI / 2), M.matte('#e8c88a'), { parent: root, at: [-W * 0.12, t + 0.05, 0], rot: [0, 0, 0.3] });
    mesh(new THREE.SphereGeometry(0.035, 20, 14), M.plastic('#c4202a', 0.3), { parent: root, at: [W * 0.22, t + 0.035, 0] });
    const lid = group('lid', { parent: root, at: [0, H, -D / 2] });
    mesh(cushion(W, 0.03, D, { radius: 0.012, bulge: 0.15 }), bm, { parent: lid, at: [0, 0.012, D / 2], name: 'lid-top' });
    strapHandle(lid, W * 0.45, 0.04, [0, 0.03, D / 2], T.trim === 'rugged' ? M.fabric('#1b1b1d') : M.fabric(T.a));
    mesh(roundedBox(W * 0.98, 0.006, 0.01, 0.002), M.plastic(T.a, 0.6), { parent: root, at: [0, H - 0.003, D / 2 - 0.004], name: 'zip' });
    mesh(roundedBox(W * 0.6, H * 0.45, 0.02, 0.008), fin(T, T.trim ? T.s : '#1b1b1d', T.mat === 'nylon' || !T.trim ? 'nylon' : T.mat), { parent: root, at: [0, H * 0.35, D / 2 + 0.008], name: 'pocket' });
    lid.rotation.x = -0.55;
    anims = () => [clip('open', 3, [rotateTrack(lid, 'x', 3, (t3) => pingPong(t3) * 0.5)])];
  } else {
    const metal = variant === 'metal-lunchbox';
    const W = (metal ? 0.22 : 0.2) * k * T.w, H = (metal ? 0.1 : 0.075) * k * T.h, D = (metal ? 0.11 : 0.14) * k, t = metal ? 0.0012 : 0.003;
    const bm = metal ? (T.trim === 'kids' || T.trim === 'pastel' ? hard(T, 'p', 'gloss') : fin(T, T.p, 'metal', { rough: 0.25, pattern: T.pattern })) : hard(T, 'p', T.mat === 'metal' ? 'metal' : 'gloss');
    const r = (metal ? 0.008 : 0.025) * T.round;
    openBox(W, H, D, t, bm, { parent: root, r, name: 'box' });
    const lidH = (metal ? (T.trim === 'retro' || T.rugged ? 0.045 : 0.03) : 0.03) * k;
    const lid = group('lid', { parent: root, at: [0, H, -D / 2] });
    const shell = openBox(W, lidH, D, t, metal ? bm : hard(T, 's', 'gloss'), { parent: lid, r, name: 'lid-shell' });
    shell.rotation.x = Math.PI; shell.position.set(0, lidH, D / 2);
    // handle on the lid
    const hm = T.rugged ? M.plastic('#1b1b1d', 0.6) : metal ? M.metal('#c9ccd2', 0.25) : M.plastic(T.a, 0.4);
    for (const s of [-1, 1]) mesh(roundedBox(0.014, 0.008, 0.012, 0.003), hm, { parent: lid, at: [s * W * 0.22, lidH + 0.003, D / 2] });
    curveTube([[-W * 0.22, lidH + 0.006, D / 2], [-W * 0.2, lidH + 0.03 * k, D / 2], [W * 0.2, lidH + 0.03 * k, D / 2], [W * 0.22, lidH + 0.006, D / 2]], T.rugged ? 0.006 : 0.004, hm, { parent: lid, segments: 24 });
    // latches on front
    const lm = M.metal('#c9ccd2', 0.25);
    for (const s of metal ? [0] : [-1, 1]) mesh(roundedBox(0.02, 0.026, 0.004, 0.0015), metal ? lm : M.plastic(T.trim ? T.a : T.s, 0.4), { parent: root, at: [s * W * 0.3, H - 0.004, D / 2 + 0.0015], name: 'latch' });
    // printed panel on the front
    const art = labelPlane(W * 0.8, H * 0.65, (g, w, h) => {
      g.fillStyle = css(T.s); g.fillRect(0, 0, w, h);
      g.fillStyle = css(T.a); for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w * (0.12 + i * 0.16), h * (0.3 + (i % 2) * 0.35), h * 0.12, 0, 7); g.fill(); }
      g.fillStyle = '#ffffff'; g.font = `bold ${h * 0.22}px sans-serif`; g.textAlign = 'center'; g.fillText(metal ? 'LUNCH' : 'YUM!', w / 2, h * 0.62);
    }, { px: 256 });
    art.position.set(0, H * 0.45, D / 2 + 0.0004); root.add(art);
    if (!metal) mesh(roundedBox(D - 2 * t, H * 0.7, t, 0.001), hard(T, 's', 'gloss'), { parent: root, at: [W * 0.15, H * 0.35, 0], rot: [0, Math.PI / 2, 0] });
    lid.rotation.x = -0.9;
    anims = () => [clip('open', 3, [rotateTrack(lid, 'x', 3, (t3) => pingPong(t3) * 0.9)])];
  }
  return done(root, 'lunchbox', variant, o, anims);
}

function strapHandle(parent, w, h, at, mat) {
  const g = group('handle', { parent, at });
  curveTube([[-w / 2, 0, 0], [-w / 2 + 0.01, h, 0], [w / 2 - 0.01, h, 0], [w / 2, 0, 0]], 0.006, mat, { parent: g, segments: 24 }).scale.z = 0.4;
  return g;
}

/* =============================== WATER BOTTLES =============================== */

export const WATER_BOTTLE_VARIANTS = {
  'sports-bottle': { p: '#2b7de1', s: '#f4f3ef', a: '#1b1b1d' },
  'steel-bottle': { p: '#3b6e5a', s: '#c9ccd2', a: '#1b1b1d', mat: 'metal' },
  'glass-bottle': { p: '#d9eef0', s: '#3b6e5a', a: '#c9a06a', mat: 'glass' },
  'kids-bottle': { p: '#ff7aa8', s: '#3fb6ff', a: '#ffd23f' },
  thermos: { p: '#2f5a3a', s: '#c9ccd2', a: '#1b1b1d', mat: 'metal' },
  'travel-mug': { p: '#1b1b1d', s: '#c9ccd2', a: '#e8702a', mat: 'metal' },
  'tumbler-with-straw': { p: '#b9dcd2', s: '#f4f3ef', a: '#e8a0b4', mat: 'metal' },
};

export function createWaterBottle(options = {}) {
  const { o, variant, T } = setup(options, WATER_BOTTLE_VARIANTS, 'water-bottle');
  const root = group(`water-bottle-${variant}`);
  const k = T.k, w = T.w * (T.slim ? 0.85 : T.chunky ? 1.12 : 1), h = T.h * (T.slim ? 1.1 : 1);
  const bodyM = variant === 'glass-bottle' && !T.trim ? M.glass({ tint: '#d9eef0', opacity: 0.35 }) : T.mat === 'metal' || T.mat === 'silver' ? fin(T, T.p, 'metal', { rough: 0.35, pattern: T.pattern }) : hard(T, 'p', T.mat === 'glass' ? 'glass' : T.trim === 'black' ? 'matte' : undefined);
  if (bodyM.transparent) bodyM.side = THREE.DoubleSide;
  const capM = hard(T, 's', T.mat === 'metal' && variant !== 'steel-bottle' ? 'plastic' : undefined);
  const accM = M.plastic(T.a, 0.45);
  const cap = group('cap', { parent: root });
  let H;
  const ribs = (r, y0, y1, n) => { for (let i = 0; i < n; i++) mesh(new THREE.TorusGeometry(r, r * 0.04, 6, 40).rotateX(Math.PI / 2), accM, { parent: root, at: [0, y0 + ((y1 - y0) * (i + 0.5)) / n, 0] }); };
  if (variant === 'sports-bottle' || variant === 'kids-bottle') {
    const kids = variant === 'kids-bottle';
    const R = (kids ? 0.038 : 0.036) * k * w; H = (kids ? 0.15 : 0.22) * k * h;
    mesh(vessel([[R * 0.9, 0], [R, R * 0.2], [R, H * 0.35], [R * 0.88, H * 0.5], [R, H * 0.65], [R, H * 0.85], [R * 0.75, H * 0.95], [R * 0.7, H]], 0.002, 0.002, 40), bodyM, { parent: root, name: 'bottle' });
    cap.position.y = H - 0.002;
    mesh(lathe([[0, 0], [R * 0.78, 0], [R * 0.8, H * 0.08], [R * 0.6, H * 0.1], [0, H * 0.1]], 32), capM, { parent: cap });
    if (kids) {
      mesh(new THREE.CylinderGeometry(R * 0.12, R * 0.15, H * 0.12, 12), accM, { parent: cap, at: [0, H * 0.15, R * 0.2], rot: [0.3, 0, 0], name: 'straw' });
      mesh(new THREE.TorusGeometry(R * 0.45, R * 0.07, 8, 24), capM, { parent: cap, at: [0, H * 0.1 + R * 0.4, -R * 0.35], rot: [0, Math.PI / 2, 0], name: 'loop' });
    } else {
      mesh(lathe([[0, 0], [R * 0.3, 0], [R * 0.25, H * 0.05], [R * 0.15, H * 0.08], [0, H * 0.08]], 24), accM, { parent: cap, at: [0, H * 0.1, 0], name: 'nozzle' });
    }
    if (T.detail || T.trim === 'sport') ribs(R * 1.0, H * 0.15, H * 0.32, 3);
  } else if (variant === 'steel-bottle' || variant === 'glass-bottle') {
    const R = 0.036 * k * w; H = (variant === 'glass-bottle' ? 0.22 : 0.25) * k * h;
    mesh(vessel([[R * 0.95, 0], [R, R * 0.15], [R, H * 0.78], [R * 0.7, H * 0.86], [R * 0.6, H * 0.9]], 0.002, 0.003, 40), bodyM, { parent: root, name: 'bottle' });
    cap.position.y = H * 0.9 - 0.002;
    mesh(lathe([[0, 0], [R * 0.66, 0], [R * 0.68, H * 0.1], [R * 0.6, H * 0.11], [0, H * 0.11]], 32), variant === 'glass-bottle' ? M.wood(T.trim ? T.s : '#c9a06a') : capM, { parent: cap });
    mesh(new THREE.TorusGeometry(R * 0.35, R * 0.08, 8, 24), variant === 'glass-bottle' ? M.plastic(T.trim ? T.a : '#3b6e5a', 0.6) : capM, { parent: cap, at: [0, H * 0.11 + R * 0.3, 0], name: 'loop' });
    if (variant === 'glass-bottle') mesh(lathe([[R * 1.06, H * 0.12], [R * 1.08, H * 0.15], [R * 1.08, H * 0.6], [R * 1.06, H * 0.63], [R * 0.99, H * 0.63], [R * 0.99, H * 0.12]], 40), new THREE.MeshStandardMaterial({ name: 'silicone', color: T.trim ? T.a : '#3b6e5a', roughness: 0.75 }), { parent: root, name: 'sleeve' });
    else if (T.detail || T.trim === 'sport') ribs(R * 1.0, H * 0.3, H * 0.5, 4);
  } else if (variant === 'thermos') {
    const R = 0.042 * k * w; H = 0.28 * k * h;
    mesh(vessel([[R * 0.95, 0], [R, R * 0.15], [R, H * 0.82], [R * 0.8, H * 0.86], [R * 0.75, H * 0.88]], 0.002, 0.003, 40), bodyM, { parent: root, name: 'flask' });
    mesh(lathe([[R * 1.01, H * 0.05], [R * 1.01, H * 0.15], [0, H * 0.15], [0, H * 0.05]], 40), accM, { parent: root, name: 'base-band' });
    cap.position.y = H * 0.86;
    mesh(vessel([[R * 0.95, 0], [R * 1.03, H * 0.04], [R * 1.05, H * 0.2]], 0.002, 0.003, 40).rotateX(Math.PI).translate(0, H * 0.2, 0), capM, { parent: cap, name: 'cup-lid' });
    if (T.rugged || T.detail) {
      for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(R * 0.1, R * 0.1, R * 0.08, 10).rotateZ(Math.PI / 2), accM, { parent: root, at: [s * R * 1.0, H * 0.72, 0] });
      curveTube([[-R * 1.03, H * 0.72, 0], [-R * 1.25, H * 0.5, 0], [-R * 1.03, H * 0.25, 0]], R * 0.07, accM, { parent: root, segments: 16 });
    }
  } else {
    const tumbler = variant === 'tumbler-with-straw';
    const Rt = (tumbler ? 0.05 : 0.04) * k * w, Rb = (tumbler ? 0.034 : 0.032) * k * w; H = (tumbler ? 0.25 : 0.18) * k * h;
    mesh(vessel([[Rb, 0], [Rb * 1.02, H * 0.06], [Rb * 1.05, H * 0.4], [Rt, H * 0.95], [Rt, H]], 0.002, 0.003, 48), bodyM, { parent: root, name: 'cup' });
    cap.position.y = H - 0.002;
    mesh(lathe([[0, 0], [Rt * 1.03, 0], [Rt * 1.03, H * 0.06], [Rt * 0.8, H * 0.08], [0, H * 0.08]], 40), capM, { parent: cap, name: 'lid' });
    // handle
    const hy0 = tumbler ? H * 0.25 : H * 0.3, hy1 = tumbler ? H * 0.82 : H * 0.75;
    const rOut = (y) => Rb + (Rt - Rb) * Math.max(0, (y - H * 0.4) / (H * 0.55));
    if (tumbler || T.detail || T.chunky) curveTube([[rOut(hy1) * 0.98, hy1, 0], [rOut(hy1) + 0.035 * k, hy1 - 0.005, 0], [rOut(hy0) + 0.035 * k, hy0 + 0.005, 0], [rOut(hy0) * 0.98, hy0, 0]], tumbler ? 0.008 : 0.006, accM.clone(), { parent: root, segments: 24, name: 'handle' }).scale.z = 0.7;
    if (tumbler) mesh(new THREE.CylinderGeometry(0.0035, 0.0035, H * 0.95, 12), new THREE.MeshPhysicalMaterial({ color: T.a, roughness: 0.2, transparent: true, opacity: 0.8 }), { parent: cap, at: [Rt * 0.25, H * 0.25, 0], rot: [0, 0, -0.08], name: 'straw' });
    else mesh(roundedBox(Rt * 0.5, 0.004, Rt * 0.25, 0.0015), M.plastic('#1b1b1d', 0.5), { parent: cap, at: [0, H * 0.08 + 0.001, Rt * 0.55], name: 'sip' });
  }
  if (T.pattern || T.trim === 'kids') { /* body carries the pattern map via hard()/fin() */ }
  return done(root, 'water-bottle', variant, o, () => [clip('open', 2, [moveTrack(cap, 2, (t) => [0, pingPong(t) * 0.04, 0]), rotateTrack(cap, 'y', 2, (t) => pingPong(t) * 3)])]);
}

/* ============================== BOOKS & READING ============================== */

export const BOOKS_VARIANTS = {
  'book-stack': { p: '#8a1f2a', s: '#efe6d2', a: '#d6a93c' },
  'open-book': { p: '#1f4a35', s: '#f4efe2', a: '#d6a93c' },
  magazine: { p: '#e8402f', s: '#f4f3ef', a: '#1b1b1d' },
  newspaper: { p: '#ece8dd', s: '#1b1b1d', a: '#8a8a8a' },
  'comic-book': { p: '#ffcc1e', s: '#2457b8', a: '#d8262b' },
  map: { p: '#e8e0c4', s: '#3d8fd6', a: '#7fb26a' },
};

function hardcover(parent, W, D, t, coverM, pageM, { at = [0, 0, 0], rotY = 0, title, ct = 0.0025 } = {}) {
  const g = group('book', { parent, at, rot: [0, rotY, 0] });
  mesh(roundedBox(W, ct, D, ct * 0.45), coverM, { parent: g, at: [0, ct / 2, 0] });
  mesh(roundedBox(W - 0.006, t - 2 * ct, D - 0.008, 0.001), pageM, { parent: g, at: [0.002, t / 2, 0] });
  mesh(roundedBox(W, ct, D, ct * 0.45), coverM, { parent: g, at: [0, t - ct / 2, 0], name: 'cover' });
  const sp = new THREE.CylinderGeometry(t / 2, t / 2, D, 16, 1, false, Math.PI, Math.PI).rotateX(Math.PI / 2);
  mesh(sp, coverM, { parent: g, at: [-W / 2 + 0.001, t / 2, 0], name: 'spine' });
  if (title) {
    const l = labelPlane(W * 0.6, D * 0.25, title, { px: 128 });
    l.rotation.x = -Math.PI / 2; l.position.set(0.004, t + 0.0002, -D * 0.15); g.add(l);
  }
  return g;
}

const coverArt = (bg, fg, ac, title, kind) => (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (kind === 'comic') {
    g.fillStyle = ac; g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? w * 0.22 : w * 0.38; g.lineTo(w / 2 + Math.cos(a) * r, h * 0.55 + Math.sin(a) * r); } g.fill();
    g.fillStyle = fg; g.font = `bold ${h * 0.12}px sans-serif`; g.textAlign = 'center'; g.fillText('POW!', w / 2, h * 0.6);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h * 0.16); g.fillStyle = '#d8262b'; g.font = `bold ${h * 0.11}px sans-serif`; g.fillText(title, w / 2, h * 0.12);
  } else if (kind === 'news') {
    g.fillStyle = fg; g.font = `bold ${h * 0.09}px serif`; g.textAlign = 'center'; g.fillText(title, w / 2, h * 0.1);
    g.fillRect(w * 0.04, h * 0.13, w * 0.92, 3);
    g.font = `bold ${h * 0.05}px serif`; g.fillText('BIG NEWS TODAY', w / 2, h * 0.22);
    g.fillStyle = ac; g.fillRect(w * 0.06, h * 0.26, w * 0.5, h * 0.3);
    g.fillStyle = '#555'; for (let c = 0; c < 2; c++) for (let i = 0; i < 26; i++) g.fillRect(c ? w * 0.6 : w * 0.06, h * (0.6 + i * 0.014) - (c ? h * 0.34 : 0), (c ? w * 0.34 : w * 0.88) * (i % 7 === 6 ? 0.6 : 1), 2);
  } else {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, bg); gr.addColorStop(1, ac); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(w * 0.5, h * 0.62, w * 0.25, h * 0.25, 0, 0, 7); g.fill();
    g.fillStyle = fg; g.font = `bold ${h * 0.12}px sans-serif`; g.textAlign = 'center'; g.fillText(title, w / 2, h * 0.14);
  }
};

export function createBooks(options = {}) {
  const { o, variant, T } = setup(options, BOOKS_VARIANTS, 'books');
  const root = group(`books-${variant}`);
  const k = T.k;
  const pageM = paperMat(T.trim === 'vintage' || T.worn ? '#e3d3ae' : '#f6f2e6');
  const cov = (c) => (T.mat === 'leather' ? fin(T, c, 'leather') : T.trim === 'modern' ? M.matte(c, 0.6) : fin(T, c, 'canvas'));
  let anims = [];
  if (variant === 'book-stack') {
    const cols = T.trim === 'kids' ? ['#ff4d6d', '#2b7de1', '#ffcc1e', '#2fbf5a', '#9a4ad6'] : T.trim === 'modern' ? ['#f4f3ef', '#1b1b1d', '#e8702a', '#9aa0a8'] : T.trim === 'leather' ? ['#5a2a1a', '#3a2214', '#7a3a1a', '#1b1b1d'] : [T.p, '#1f4a35', '#2a3a6a', '#c9a24a', '#5a2a1a'];
    const n = T.trim === 'kids' ? 3 : T.trim === 'vintage' ? 5 : 4;
    let y = 0;
    for (let i = 0; i < n; i++) {
      const W = (0.16 + ((i * 37) % 5) * 0.01) * k * (T.trim === 'kids' ? 1.25 : 1), D = W * (T.trim === 'kids' ? 1.0 : 1.42), t = (0.025 + ((i * 13) % 4) * 0.008) * (T.trim === 'kids' ? 0.6 : 1) * (T.chunky ? 1.3 : 1);
      const c = cols[i % cols.length];
      hardcover(root, W, D, t, cov(c), pageM, { at: [((i * 7) % 3 - 1) * 0.008, y, ((i * 5) % 3 - 1) * 0.006], rotY: ((i * 29) % 7 - 3) * 0.05 * (T.worn ? 2 : 1), ct: T.trim === 'kids' ? 0.005 : 0.0025 });
      if (T.detail >= 2 || T.trim === 'vintage') mesh(roundedBox(0.004, 0.0008, D * 0.98, 0.0003), M.metal('#d6a93c', 0.25), { parent: root.children[root.children.length - 1], at: [-W * 0.35, t + 0.0003, 0] });
      y += t;
    }
  } else if (variant === 'open-book') {
    const W = 0.15 * k, D = 0.22 * k, t = 0.012 * (T.chunky ? 1.6 : 1), ct = 0.0025;
    const cm = cov(T.p);
    mesh(roundedBox(W * 2 + 0.012, ct, D + 0.006, ct * 0.45), cm, { parent: root, at: [0, ct / 2, 0], name: 'cover' });
    const curl = (u) => Math.sin(Math.max(0, Math.min(1, u)) * Math.PI * 0.5) ** 0.5;
    for (const s of [-1, 1]) {
      const g = new THREE.BoxGeometry(W, t, D, 24, 1, 1);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i);
        const u = (x / W + 0.5); // 0 at spine side for s=+1 after flip
        const uu = s > 0 ? u : 1 - u;
        const top = y > 0;
        const lift = t * 0.9 * curl(uu * 4) * (1 - uu * 0.4);
        p.setY(i, (top ? t * 0.35 + lift : 0) + (top ? 0 : 0));
        void x;
      }
      g.computeVertexNormals();
      mesh(g, pageM, { parent: root, at: [s * (W / 2 + 0.001), ct, 0], name: s < 0 ? 'pages-l' : 'pages-r' });
      const pl = new THREE.PlaneGeometry(W * 0.9, D * 0.9, 24, 1).rotateX(-Math.PI / 2);
      const q = pl.attributes.position;
      for (let i = 0; i < q.count; i++) { const u = q.getX(i) / (W * 0.9) + 0.5; const uu = s > 0 ? u : 1 - u; const ux = 0.05 + uu * 0.9; q.setY(i, t * 0.35 + t * 0.9 * curl(ux * 4) * (1 - ux * 0.4) + 0.0003); }
      pl.computeVertexNormals();
      const tex = canvasTex(256, 360, (g2, w, h) => { g2.fillStyle = css(pageM.color); g2.fillRect(0, 0, w, h); g2.fillStyle = '#3a3530'; for (let i = 0; i < 30; i++) g2.fillRect(w * 0.08, h * (0.08 + i * 0.028), w * (i % 9 === 8 ? 0.5 : 0.84), 3); });
      mesh(pl, new THREE.MeshStandardMaterial({ name: 'page-text', color: tex ? '#ffffff' : pageM.color, map: tex, roughness: 0.9 }), { parent: root, at: [s * (W / 2 + 0.001), ct, 0] });
    }
    mesh(roundedBox(0.004, 0.0006, 0.07, 0.0002), M.fabric(T.a === '#d6a93c' ? '#8a1f2a' : T.a), { parent: root, at: [0, ct + 0.0003, D / 2 + 0.03], name: 'ribbon' });
  } else if (variant === 'magazine' || variant === 'comic-book') {
    const comic = variant === 'comic-book';
    const W = (comic ? 0.17 : 0.21) * k * T.w, D = (comic ? 0.26 : 0.28) * k, t = (comic ? 0.003 : 0.006) * (T.chunky ? 1.6 : 1);
    const n = T.detail || T.trim === 'kids' ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const g = group('issue', { parent: root, at: [i * 0.03, i * t, i * 0.02], rot: [0, i * 0.22, 0] });
      const cols = [T.p, T.a, T.s];
      mesh(roundedBox(W, t, D, Math.min(0.0012, t * 0.4)), comic ? paperMat('#f4efe2') : new THREE.MeshPhysicalMaterial({ color: '#f4f3ef', roughness: 0.3, clearcoat: 0.6 }), { parent: g, at: [0, t / 2, 0] });
      const art = labelPlane(W * 0.995, D * 0.995, coverArt(css(cols[i % 3]), css(T.s === cols[i % 3] ? T.a : T.s), css(cols[(i + 1) % 3]), comic ? 'HERO' : 'STYLE', comic ? 'comic' : 'mag'), { px: 256, rough: comic ? 0.8 : 0.3 });
      art.rotation.x = -Math.PI / 2; art.position.set(0, t + 0.0002, 0); g.add(art);
    }
    if (T.worn) root.children[0].children[0].geometry.rotateX(0);
  } else if (variant === 'newspaper') {
    const W = 0.3 * k, D = 0.4 * k, t = 0.01 * (T.chunky ? 1.5 : 1);
    const rolled = T.trim === 'kids' || T.trim === 'vintage';
    const pm = paperMat(T.trim === 'vintage' ? '#e3d3ae' : T.p);
    if (rolled) {
      // rolled newspaper with a rubber band
      mesh(new THREE.CylinderGeometry(0.03 * k, 0.03 * k, D * 0.8, 24).rotateZ(Math.PI / 2), pm, { parent: root, at: [0, 0.03 * k, 0], name: 'roll' });
      const tex = canvasTex(512, 256, coverArt(css(pm.color), '#1b1b1d', '#8a8a8a', 'THE DAILY', 'news'));
      root.children[0].material = new THREE.MeshStandardMaterial({ color: tex ? '#ffffff' : pm.color, map: tex, roughness: 0.9 });
      mesh(new THREE.TorusGeometry(0.0305 * k, 0.0015, 6, 32).rotateY(Math.PI / 2), M.plastic(T.trim === 'kids' ? '#ff4d6d' : '#c4202a', 0.6), { parent: root, at: [0, 0.03 * k, 0] });
    } else {
      mesh(roundedBox(W, t, D, t * 0.45), pm, { parent: root, at: [0, t / 2, 0], name: 'paper' });
      mesh(new THREE.CylinderGeometry(t / 2, t / 2, D, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2), pm, { parent: root, at: [-W / 2, t / 2, 0], name: 'fold' });
      topLabel(root, W * 0.97, D * 0.97, coverArt(css(pm.color), '#1b1b1d', css(T.trim === 'festive' ? '#c4202a' : '#8a8a8a'), 'THE DAILY', 'news'), [0, t + 0.0002, 0], { px: 512 });
      if (T.detail) mesh(roundedBox(W * 0.95, 0.0015, D * 0.95, 0.0005), pm, { parent: root, at: [0.02, t + 0.001, 0.02], rot: [0, 0.12, 0] }).visible = false;
    }
  } else {
    // map: unfolded with accordion folds
    const n = T.trim === 'kids' ? 3 : 6, PW = 0.1 * k, D = 0.45 * k * (T.trim === 'kids' ? 0.7 : 1), t = 0.0005;
    const tex = canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = css(T.trim === 'vintage' ? '#d9c79a' : T.p); g.fillRect(0, 0, w, h);
      let s = 5; const R = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      g.fillStyle = css(T.a); for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(R() * w, R() * h, 30 + R() * 80, 20 + R() * 50, R() * 3, 0, 7); g.fill(); }
      g.strokeStyle = css(T.s); g.lineWidth = 8; g.beginPath(); g.moveTo(0, h * 0.7); for (let x = 0; x < w; x += 40) g.lineTo(x, h * 0.7 + Math.sin(x * 0.01) * 60); g.stroke();
      g.strokeStyle = '#c4202a'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(R() * w, 0); g.bezierCurveTo(R() * w, R() * h, R() * w, R() * h, R() * w, h); g.stroke(); }
      g.strokeStyle = '#555'; g.lineWidth = 1; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo((i * w) / 8, 0); g.lineTo((i * w) / 8, h); g.stroke(); }
      g.fillStyle = '#c4202a'; g.beginPath(); g.arc(w * 0.62, h * 0.4, 10, 0, 7); g.fill();
    });
    const a = T.worn ? 0.22 : 0.12;
    let x = 0, y = 0;
    for (let i = 0; i < n; i++) {
      const ang = i % 2 ? -a : a;
      const geo = new THREE.BoxGeometry(PW, t, D);
      const uv = geo.attributes.uv;
      for (let j = 0; j < uv.count; j++) uv.setX(j, (i + uv.getX(j)) / n);
      const m = new THREE.MeshStandardMaterial({ name: 'map', color: tex ? '#ffffff' : (T.trim === 'vintage' ? '#d9c79a' : T.p), map: tex, roughness: 0.85 });
      const cx = x + (Math.cos(ang) * PW) / 2, cyy = y + (Math.sin(ang) * PW) / 2;
      mesh(geo, m, { parent: root, at: [cx, cyy + t / 2, 0], rot: [0, 0, ang], name: `panel-${i}` });
      x += Math.cos(ang) * PW; y += Math.sin(ang) * PW;
    }
    root.children.forEach((c) => { c.position.x -= x / 2; });
  }
  return done(root, 'books', variant, o, anims);
}

/* ============================ TICKETS & PAPER GOODS ============================ */

export const TICKET_VARIANTS = {
  ticket: { p: '#d8262b', s: '#f4efe2', a: '#1b1b1d' },
  'movie-ticket': { p: '#1f2a5a', s: '#f2b83a', a: '#f4f3ef' },
  'boarding-pass': { p: '#f4f3ef', s: '#2457b8', a: '#1b1b1d' },
  'poster-tube': { p: '#b58a57', s: '#1b1b1d', a: '#c4202a' },
  scroll: { p: '#e3d3ae', s: '#7a4a2a', a: '#8a1f2a' },
  receipt: { p: '#fbfaf5', s: '#2a2b2e', a: '#8a8a8a' },
};

function notchedTicket(W, D, notch) {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, -D / 2); s.lineTo(W / 2, -D / 2);
  s.lineTo(W / 2, -notch); s.absarc(W / 2, 0, notch, -Math.PI / 2, Math.PI / 2, true);
  s.lineTo(W / 2, D / 2); s.lineTo(-W / 2, D / 2);
  s.lineTo(-W / 2, notch); s.absarc(-W / 2, 0, notch, Math.PI / 2, -Math.PI / 2, true);
  s.lineTo(-W / 2, -D / 2);
  return s;
}

export function createTicket(options = {}) {
  const { o, variant, T } = setup(options, TICKET_VARIANTS, 'ticket');
  const root = group(`ticket-${variant}`);
  const k = T.k;
  const gold = T.trim === 'gold';
  let anims = [];
  if (variant === 'ticket' || variant === 'movie-ticket' || variant === 'boarding-pass') {
    const board = variant === 'boarding-pass';
    const W = (board ? 0.2 : variant === 'movie-ticket' ? 0.14 : 0.11) * k * T.w, D = (board ? 0.08 : 0.055) * k, t = gold ? 0.0008 : 0.0004;
    const shape = variant === 'ticket' ? notchedTicket(W, D, D * 0.12) : notchedTicket(W, D, 0.0001);
    const n = T.trim === 'kids' ? 4 : T.trim === 'festive' ? 2 : 1;
    const bg = gold ? '#d6a93c' : css(T.p);
    for (let i = 0; i < n; i++) {
      const g = group('ticket', { parent: root, at: [T.trim === 'kids' ? i * W * 0.98 : i * 0.02, i * t * (T.trim === 'kids' ? 0 : 1.05), T.trim === 'kids' ? 0 : i * 0.015], rot: [0, T.trim === 'kids' ? 0 : i * 0.25, 0] });
      mesh(extrudeOutline(shape, t, { bevel: 0 }).rotateX(Math.PI / 2), gold ? M.metal('#d6a93c', 0.25) : fin(T, '#f4efe2', 'paper'), { parent: g, at: [0, t / 2, 0], name: 'ticket-card' });
      const draw = (g2, w, h) => {
        g2.fillStyle = bg; g2.fillRect(0, 0, w, h);
        g2.strokeStyle = css(T.s); g2.lineWidth = 3; g2.strokeRect(6, 6, w - 12, h - 12);
        g2.setLineDash([4, 4]); g2.beginPath(); g2.moveTo(w * 0.75, 0); g2.lineTo(w * 0.75, h); g2.stroke(); g2.setLineDash([]);
        g2.fillStyle = css(T.s); g2.textAlign = 'center'; g2.textBaseline = 'middle';
        if (board) {
          g2.font = `bold ${h * 0.2}px sans-serif`; g2.fillText('LON  →  NYC', w * 0.38, h * 0.35);
          g2.font = `${h * 0.1}px sans-serif`; g2.fillText('GATE 12   SEAT 14A   BOARDING 09:40', w * 0.38, h * 0.62);
          for (let x = 0; x < 40; x++) g2.fillRect(w * 0.79 + x * 3, h * 0.2, x % 3 ? 1 : 2, h * 0.6);
        } else {
          g2.font = `bold ${h * 0.24}px serif`; g2.fillText(variant === 'movie-ticket' ? 'CINEMA' : 'ADMIT ONE', w * 0.38, h * 0.42);
          g2.font = `${h * 0.12}px sans-serif`; g2.fillText(variant === 'movie-ticket' ? 'ROW F  SEAT 7' : 'Nº 004512', w * 0.38, h * 0.72);
          g2.save(); g2.translate(w * 0.875, h / 2); g2.rotate(-Math.PI / 2); g2.font = `bold ${h * 0.12}px sans-serif`; g2.fillText('Nº 4512', 0, 0); g2.restore();
        }
      };
      topLabel(g, W * 0.97, D * 0.9, draw, [0, t + 0.0002, 0], { px: 512 });
    }
  } else if (variant === 'poster-tube') {
    const L = 0.9 * k * (T.trim === 'kids' ? 0.6 : 1), R = 0.04 * k * (T.chunky ? 1.3 : 1);
    const tm2 = gold ? M.metal('#d6a93c', 0.25) : T.trim === 'festive' ? fin(T, T.p, 'paper', { pattern: 'stripes' }) : T.trim === 'kids' ? M.plastic('#2b7de1', 0.4) : fin(T, T.p, 'paper');
    mesh(latheX([[R * 0.95, -L / 2], [R, -L / 2 + 0.003], [R, L / 2 - 0.003], [R * 0.95, L / 2], [R * 0.85, L / 2], [R * 0.85, -L / 2], [R * 0.95, -L / 2]], 40), tm2, { parent: root, at: [0, R, 0], name: 'tube' });
    for (const s of [-1, 1]) mesh(latheX([[0, 0], [R * 1.06, 0], [R * 1.06, 0.035 * s], [0, 0.035 * s]], 32), M.plastic(T.trim === 'vintage' ? '#5a3a24' : T.s, 0.5), { parent: root, at: [s * (L / 2 - 0.02), R, 0], name: 'end-cap' });
    // carry strap
    const sm = M.fabric(T.trim === 'vintage' ? '#6b3d22' : T.a);
    for (const s of [-1, 1]) mesh(latheX([[R * 1.02, -0.012], [R * 1.02, 0.012], [0, 0.012], [0, -0.012]], 32), sm, { parent: root, at: [s * L * 0.3, R, 0] });
    curveTube([[-L * 0.3, R * 2.02, 0], [-L * 0.15, R * 2.3, 0], [L * 0.15, R * 2.3, 0], [L * 0.3, R * 2.02, 0]], 0.004, sm, { parent: root, segments: 24 }).scale.z = 2.5;
    topLabel(root, 0.12 * k, R * 1.0, textDraw(['POSTER'], { bg: '#f4f3ef', fg: '#1b1b1d' }), [0, R * 2 + 0.0004, 0], { px: 128 });
  } else if (variant === 'scroll') {
    const W = 0.24 * k * T.w, L = 0.3 * k, R = 0.018 * k * (T.chunky ? 1.3 : 1);
    const pm = fin(T, gold ? '#f3e2a8' : T.trim === 'festive' ? '#f4efe2' : T.p, 'paper');
    // two rolled ends + flat middle
    for (const s of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(R, R, W, 24).rotateZ(Math.PI / 2), pm, { parent: root, at: [0, R, s * L / 2], name: 'roll' });
      const rodM = gold ? M.metal('#d6a93c', 0.2) : M.wood(T.trim === 'vintage' ? '#3a2214' : T.s);
      mesh(new THREE.CylinderGeometry(R * 0.35, R * 0.35, W + 0.04, 12).rotateZ(Math.PI / 2), rodM, { parent: root, at: [0, R, s * L / 2] });
      for (const e of [-1, 1]) mesh(new THREE.SphereGeometry(R * 0.6, 12, 10), rodM, { parent: root, at: [e * (W / 2 + 0.024), R, s * L / 2] });
    }
    mesh(roundedBox(W * 0.98, 0.0008, L, 0.0003), pm, { parent: root, at: [0, 0.0004, 0], name: 'sheet' });
    topLabel(root, W * 0.85, L * 0.8, (g, w, h) => { g.fillStyle = css(pm.color); g.fillRect(0, 0, w, h); g.fillStyle = '#3a2a1a'; g.font = `italic bold ${h * 0.08}px serif`; g.textAlign = 'center'; g.fillText('Proclamation', w / 2, h * 0.14); for (let i = 0; i < 14; i++) g.fillRect(w * 0.1, h * (0.25 + i * 0.045), w * (i % 5 === 4 ? 0.5 : 0.8), 2); }, [0, 0.001, 0], { px: 256 });
    if (T.trim === 'festive' || T.lux || T.trim === 'vintage') mesh(lathe([[0, 0], [0.016, 0], [0.017, 0.002], [0.013, 0.004], [0, 0.004]], 20), M.plastic(T.a, 0.3), { parent: root, at: [W * 0.3, 0.0008, L * 0.3], name: 'seal' });
  } else {
    // receipt: long strip curling up at the end
    const W = 0.08 * k * (T.trim === 'kids' ? 0.8 : 1), L = 0.28 * k * (T.trim === 'festive' ? 1.6 : 1);
    const N = 48, curlR = 0.02 * k;
    const g = new THREE.PlaneGeometry(W, L, 1, N).rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const flat = L * 0.7;
    for (let i = 0; i < p.count; i++) {
      const s = p.getZ(i) + L / 2; // distance along strip
      if (s <= flat) { p.setY(i, 0.0005); p.setZ(i, s - L / 2); }
      else { const a = (s - flat) / curlR; p.setY(i, 0.0005 + curlR - Math.cos(a) * curlR); p.setZ(i, flat - L / 2 + Math.sin(a) * curlR); }
    }
    g.computeVertexNormals();
    const tex = canvasTex(128, 512, (g2, w, h) => {
      g2.fillStyle = gold ? '#f3e2a8' : css(T.p); g2.fillRect(0, 0, w, h);
      g2.fillStyle = '#2a2b2e'; g2.font = `bold ${w * 0.12}px monospace`; g2.textAlign = 'center'; g2.fillText('STORE', w / 2, h * 0.05);
      g2.font = `${w * 0.08}px monospace`; g2.textAlign = 'left';
      for (let i = 0; i < 18; i++) { g2.fillText(['MILK', 'BREAD', 'EGGS', 'APPLES', 'TEA', 'SOAP'][i % 6], w * 0.08, h * (0.1 + i * 0.03)); g2.fillText(`${(i * 1.37 + 0.99).toFixed(2)}`, w * 0.65, h * (0.1 + i * 0.03)); }
      g2.font = `bold ${w * 0.1}px monospace`; g2.fillText('TOTAL 28.40', w * 0.1, h * 0.7);
      for (let x = 0; x < 30; x++) g2.fillRect(w * 0.15 + x * 3, h * 0.75, x % 3 ? 1 : 2, h * 0.05);
    });
    const m = new THREE.MeshStandardMaterial({ name: 'receipt', color: tex ? '#ffffff' : (gold ? '#f3e2a8' : T.p), map: tex, roughness: 0.6, side: THREE.DoubleSide });
    mesh(g, m, { parent: root, name: 'receipt' });
    mesh(roundedBox(W, 0.0006, 0.01, 0.0002), m, { parent: root, at: [0, 0.0003, -L / 2 + 0.005] });
  }
  return done(root, 'ticket', variant, o, anims);
}
