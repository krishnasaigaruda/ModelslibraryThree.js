/*
 * Tech devices: computers, phones, wearables, audio/video, gaming, network, charging.
 * Real-world proportions (metres). Screens use a canvas UI texture (browser) and an
 * 'on' animation that lights them; small status LEDs use core/lamps.js lens + glow.
 * Trims change colourway AND shape / size (e.g. laptop: gaming, 2-in-1, rugged).
 */
import { THREE, M, mesh, group, roundedBox, curveTube, lathe, metalMat, plasticMat, glassMat, fabricMat, leatherMat } from './common.js';
import { finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { brandEmblem } from '../../core/brand.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { rotateTrack, spinTrack, numberTrack, clip, pingPong } from '../../core/animation.js';

/* ------------------------------ materials ------------------------------ */
const alu = (c = '#c8cacd', r = 0.32) => new THREE.MeshPhysicalMaterial({ name: 'primary', color: c, metalness: 1, roughness: r, clearcoat: 0.2 });
const shell = (c = '#1d1e21', r = 0.45) => new THREE.MeshPhysicalMaterial({ name: 'primary', color: c, roughness: r, clearcoat: 0.3, clearcoatRoughness: 0.4 });
const rubber = (c = '#141414') => new THREE.MeshStandardMaterial({ name: 'rubber', color: c, roughness: 0.9 });
const black = () => new THREE.MeshPhysicalMaterial({ name: 'bezel', color: '#07080a', roughness: 0.15, clearcoat: 1 });
const lensMat = () => new THREE.MeshPhysicalMaterial({ name: 'lens', color: '#0a0d14', roughness: 0.02, metalness: 0.3, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.5 });

const COLORWAYS = {
  silver: '#c8cacd', 'space-gray': '#5b5e63', midnight: '#1f2633', gold: '#d9c3a0', white: '#f2f2f0', black: '#1b1c1e',
  red: '#b3201c', blue: '#2a5db0', green: '#3f6b4c', pink: '#efc3cc', orange: '#e86a1a', purple: '#6a4fa3',
};

/* ------------------------------ screen UI ------------------------------ */
const texCache = new Map();
/** Plausible UI drawn on a canvas (browser only; Node gets a plain emissive screen). */
function screenTexture(kind, aspect = 1.6, seed = 1) {
  if (typeof document === 'undefined') return null;
  const key = `${kind}:${aspect.toFixed(2)}:${seed}`;
  if (texCache.has(key)) return texCache.get(key);
  const H = 256;
  const W = Math.round(H * aspect);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const grad = (a, b, vertical = true) => { const gr = vertical ? g.createLinearGradient(0, 0, 0, H) : g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
  const rr = (x, y, w, h, r, fill) => { g.fillStyle = fill; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
  if (kind === 'desktop') {
    g.fillStyle = grad('#3b6fd8', '#c86bff', false); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(W * (0.2 + i * 0.17), H * (0.7 - (i % 2) * 0.3), H * 0.35, 0, Math.PI * 2); g.fill(); }
    rr(W * 0.12, H * 0.14, W * 0.46, H * 0.56, 8, 'rgba(250,250,252,0.95)');
    rr(W * 0.12, H * 0.14, W * 0.46, H * 0.07, 8, '#e6e8ec');
    for (const [i, col] of ['#ff5f57', '#febc2e', '#28c840'].entries()) { g.fillStyle = col; g.beginPath(); g.arc(W * 0.14 + i * 12, H * 0.175, 4, 0, 7); g.fill(); }
    g.fillStyle = '#c9ccd2';
    for (let i = 0; i < 7; i++) g.fillRect(W * 0.15, H * (0.27 + i * 0.055), W * (0.18 + ((i * 37) % 20) / 100), 5);
    rr(W * 0.62, H * 0.3, W * 0.28, H * 0.44, 8, 'rgba(20,24,32,0.85)');
    g.fillStyle = '#7be36b'; for (let i = 0; i < 6; i++) g.fillRect(W * 0.64, H * (0.36 + i * 0.055), W * (0.08 + ((i * 53) % 13) / 100), 4);
    rr(W * 0.3, H * 0.9, W * 0.4, H * 0.07, 10, 'rgba(255,255,255,0.35)');
    for (let i = 0; i < 8; i++) rr(W * 0.315 + i * W * 0.048, H * 0.905, W * 0.035, H * 0.055, 6, ['#ff5fa2', '#ffd23f', '#3fc3ff', '#7be36b', '#7a6cff', '#ff8a4c', '#ffffff', '#c86bff'][i]);
  } else if (kind === 'phone') {
    g.fillStyle = grad('#ff8a4c', '#7a6cff'); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = `bold ${H * 0.09}px sans-serif`; g.textAlign = 'center'; g.fillText('9:41', W / 2, H * 0.16);
    const cols = 4;
    const s = W / (cols + 1);
    const colors = ['#34c759', '#0a84ff', '#ff9f0a', '#ff375f', '#5e5ce6', '#64d2ff', '#ffd60a', '#bf5af2', '#30d158', '#ff453a', '#ac8e68', '#ffffff'];
    for (let i = 0; i < 16; i++) rr(s * 0.6 + (i % cols) * s, H * 0.25 + Math.floor(i / cols) * s * 1.05, s * 0.72, s * 0.72, s * 0.18, colors[(i + seed) % colors.length]);
    rr(W * 0.06, H * 0.86, W * 0.88, H * 0.1, 14, 'rgba(255,255,255,0.3)');
  } else if (kind === 'game') {
    g.fillStyle = grad('#5ab6ff', '#ffe2b8'); g.fillRect(0, 0, W, H);
    g.fillStyle = '#4f8a3a'; g.beginPath(); g.moveTo(0, H * 0.7);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, H * (0.62 + 0.08 * Math.sin(x * 0.02 + seed)));
    g.lineTo(W, H); g.lineTo(0, H); g.fill();
    g.fillStyle = '#e94f4f'; rr(W * 0.45, H * 0.55, W * 0.06, H * 0.1, 3, '#e94f4f');
    g.fillStyle = '#fff'; g.font = `bold ${H * 0.07}px sans-serif`; g.fillText('SCORE 12450', W * 0.05, H * 0.1);
    rr(W * 0.75, H * 0.04, W * 0.2, H * 0.05, 4, '#ff5fa2');
  } else if (kind === 'watch') {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#ff5fa2'; g.lineWidth = H * 0.06; g.beginPath(); g.arc(W / 2, H / 2, H * 0.4, -Math.PI / 2, Math.PI * 0.9); g.stroke();
    g.strokeStyle = '#7be36b'; g.beginPath(); g.arc(W / 2, H / 2, H * 0.31, -Math.PI / 2, Math.PI * 0.4); g.stroke();
    g.strokeStyle = '#3fc3ff'; g.beginPath(); g.arc(W / 2, H / 2, H * 0.22, -Math.PI / 2, Math.PI * 1.2); g.stroke();
    g.fillStyle = '#fff'; g.font = `bold ${H * 0.13}px sans-serif`; g.textAlign = 'center'; g.fillText('10:09', W / 2, H * 0.55);
  } else if (kind === 'reader') {
    g.fillStyle = '#e9e7e0'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#3a3a3a'; g.font = `bold ${H * 0.05}px serif`; g.fillText('Chapter 3', W * 0.1, H * 0.12);
    for (let i = 0; i < 18; i++) g.fillRect(W * 0.1, H * (0.18 + i * 0.042), W * (i % 6 === 5 ? 0.45 : 0.8), H * 0.012);
  } else if (kind === 'camera') {
    g.fillStyle = grad('#1c2b3a', '#6c8a6e'); g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1;
    for (const f of [1 / 3, 2 / 3]) { g.beginPath(); g.moveTo(W * f, 0); g.lineTo(W * f, H); g.moveTo(0, H * f); g.lineTo(W, H * f); g.stroke(); }
    g.fillStyle = '#fff'; g.font = `${H * 0.07}px sans-serif`; g.fillText('ISO 400  1/250  f2.8', W * 0.05, H * 0.93);
    g.fillStyle = '#ff453a'; g.beginPath(); g.arc(W * 0.92, H * 0.08, H * 0.03, 0, 7); g.fill();
  } else {
    g.fillStyle = grad('#0e1a2b', '#244a7a'); g.fillRect(0, 0, W, H);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

function screenMat(kind, aspect, seed) {
  const map = screenTexture(kind, aspect, seed);
  const eInk = kind === 'reader';
  return new THREE.MeshPhysicalMaterial({
    name: 'screen', color: eInk ? '#ffffff' : '#050608', map: eInk ? map : null, emissive: '#ffffff', emissiveMap: eInk ? null : map,
    emissiveIntensity: eInk ? 0 : 0.06, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03,
  });
}

/** Screen plane (+Z facing) named 'screen' (first) so the 'on' animation lights every screen. */
let screenCount = 0;
function screen(parent, w, h, kind, at, seed = 1, mat) {
  const m = mesh(new THREE.PlaneGeometry(w, h), mat ?? screenMat(kind, w / h, seed), { parent, at });
  m.name = screenCount++ ? `screen_${screenCount}` : 'screen';
  return m;
}

function keyGrid(parent, w, d, rows, cols, at, mat, keyH = 0.004) {
  const kw = (w / cols) * 0.82;
  const kd = (d / rows) * 0.8;
  const geo = roundedBox(kw, keyH, kd, Math.min(kw, kd) * 0.18, 2);
  const im = new THREE.InstancedMesh(geo, mat, rows * cols);
  const m4 = new THREE.Matrix4();
  let i = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    m4.makeTranslation(at[0] - w / 2 + (c + 0.5) * (w / cols), at[1], at[2] - d / 2 + (r + 0.5) * (d / rows));
    im.setMatrixAt(i++, m4);
  }
  im.name = 'keys';
  parent.add(im);
  return im;
}

function led(parent, name, kind, at, normal = [0, 0, 1], size = 0.004) {
  const g = lampGroup(name, kind);
  g.add(parent, { at, normal, w: size, h: size, depth: 0.0015, shape: 'round', bezel: false, glowSize: size * 6 });
  return g;
}

function emblemAt(parent, size, at, rot) {
  const e = brandEmblem(size, { name: 'emblem' });
  e.position.set(...at);
  if (rot) e.rotation.set(...rot);
  parent.add(e);
  return e;
}

/* ------------------------------ variants ------------------------------ */
export const TECH_VARIANTS = {
  laptop: { trims: ['gaming', 'two-in-one', 'rugged', 'space-gray', 'gold', 'midnight'] },
  'desktop-pc': { trims: ['white', 'compact', 'workstation', 'retro', 'pink'] },
  monitor: { trims: ['ultrawide', 'curved', 'portrait', 'gaming', 'white', 'dual'] },
  keyboard: { trims: ['mechanical-rgb', 'compact', 'white', 'split', 'retro'] },
  mouse: { trims: ['gaming', 'vertical', 'white', 'trackball', 'pink'] },
  'gaming-setup': { trims: ['white', 'triple-monitor', 'streamer', 'compact'] },
  smartphone: { trims: ['pro', 'mini', 'foldable', 'rugged', 'blue', 'pink', 'green'] },
  tablet: { trims: ['pro-keyboard', 'mini', 'stylus', 'kids', 'space-gray'] },
  smartwatch: { trims: ['round', 'sport', 'gold', 'rugged', 'kids'] },
  'vr-headset': { trims: ['white', 'controllers', 'pro', 'tethered'] },
  earbuds: { trims: ['open', 'black', 'sport', 'pink'] },
  headphones: { trims: ['studio', 'gaming', 'on-ear', 'white', 'retro'] },
  'smart-speaker': { trims: ['mini', 'display', 'tall', 'black', 'orange'] },
  soundbar: { trims: ['subwoofer', 'compact', 'white', 'premium'] },
  projector: { trims: ['mini', 'short-throw', 'cinema', 'white'] },
  camera: { trims: ['mirrorless', 'zoom-lens', 'film', 'compact', 'white'] },
  'action-camera': { trims: ['mounted', 'rugged-case', 'white', '360'] },
  drone: { trims: ['mini', 'racing', 'pro', 'white', 'orange'] },
  'game-console': { trims: ['black', 'slim', 'retro', 'hybrid', 'red'] },
  controller: { trims: ['white', 'red', 'retro', 'pro', 'blue'] },
  'handheld-console': { trims: ['oled', 'retro', 'pc-handheld', 'lite', 'purple'] },
  router: { trims: ['mesh-node', 'gaming', 'white', 'modem'] },
  '3d-printer': { trims: ['enclosed', 'delta', 'resin', 'large'] },
  'server-rack': { trims: ['half', 'open-frame', 'white', 'network'] },
  'e-reader': { trims: ['large', 'cover', 'white', 'kids'] },
  'power-bank': { trims: ['slim', 'magnetic', 'rugged', 'white', 'station'] },
  'charging-dock': { trims: ['three-in-one', 'pad', 'stand', 'white'] },
};

export function createTech(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(TECH_VARIANTS, o.variant, 'tech');
  const trim = o.trim ?? null;
  const root = group(`tech-${variant}`);
  const anims = [];
  const oneShot = [];
  const onTracks = [];
  screenCount = 0;
  const col = (fallback) => o.color ?? COLORWAYS[trim] ?? fallback;
  const T = (name) => trim === name;
  const addOn = () => {
    // every screen (each has its own UI texture) lights up
    root.traverse((m) => {
      if (m.isMesh && /^screen(_\d+)?$/.test(m.name) && m.material.emissiveMap !== undefined && m.material.map == null) onTracks.push(numberTrack(`${m.name}.material.emissiveIntensity`, 1, () => 1.15, 1));
    });
  };

  switch (variant) {
    case 'laptop': {
      const gaming = T('gaming');
      const rugged = T('rugged');
      const W = gaming ? 0.36 : rugged ? 0.34 : 0.304;
      const D = gaming ? 0.26 : rugged ? 0.25 : 0.215;
      const bH = gaming ? 0.024 : rugged ? 0.03 : 0.011;
      const lH = gaming ? 0.012 : rugged ? 0.016 : 0.005;
      const C = gaming ? shell(o.color ?? '#151618', 0.5) : rugged ? shell(o.color ?? '#2e3133', 0.7) : alu(col('#c8cacd'));
      mesh(roundedBox(W, bH, D, bH * 0.45, 3), C, { parent: root, at: [0, bH / 2, 0] });
      keyGrid(root, W * 0.86, D * 0.4, 5, 15, [0, bH + 0.0012, -D * 0.1], plasticMat(gaming ? '#0d0d0f' : rugged ? '#1a1a1a' : '#202124', 0.6), 0.0016);
      mesh(roundedBox(W * 0.36, 0.0006, D * 0.26, 0.004, 2), new THREE.MeshPhysicalMaterial({ color: M.toColor(gaming ? '#1d1e20' : col('#c8cacd')).multiplyScalar(0.92), roughness: 0.25, metalness: gaming || rugged ? 0 : 1 }), { parent: root, at: [0, bH + 0.0003, D * 0.29] });
      if (gaming) {
        // RGB light bar on the front edge + rear vents
        const rgb = lampGroup('rgb', 'blue');
        rgb.add(root, { at: [0, bH * 0.45, D / 2 + 0.001], normal: [0, 0, 1], w: W * 0.6, h: 0.004, depth: 0.0015, shape: 'strip', bezel: false });
        for (let i = 0; i < 12; i++) mesh(roundedBox(0.012, bH * 0.5, 0.004, 0.001, 1), plasticMat('#050505'), { parent: root, at: [-W * 0.3 + i * 0.022, bH * 0.5, -D / 2 - 0.0005] });
        onTracks.push(...lampTracks('rgb', 3));
      }
      if (rugged) {
        for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(roundedBox(0.04, bH + lH + 0.008, 0.04, 0.012, 3), rubber('#e2651a'), { parent: root, at: [sx * (W / 2 - 0.012), (bH + lH) / 2, sz * (D / 2 - 0.012)] });
        curveTube([[-0.08, bH * 0.5, D / 2], [-0.07, bH * 0.5, D / 2 + 0.035], [0.07, bH * 0.5, D / 2 + 0.035], [0.08, bH * 0.5, D / 2]], 0.007, rubber(), { parent: root });
      }
      const angle = T('two-in-one') ? -Math.PI * 0.94 : -1.95;
      const lid = group('lid', { parent: root, at: [0, bH, -D / 2 + 0.002], rot: [Math.PI / 2 + angle, 0, 0] });
      mesh(roundedBox(W, D, lH, lH * 0.45, 3), C, { parent: lid, at: [0, D / 2, -lH / 2] });
      mesh(roundedBox(W - 0.006, D - 0.006, 0.0008, 0.004, 2), black(), { parent: lid, at: [0, D / 2, 0.0004] });
      screen(lid, W * 0.92, D * 0.86, gaming ? 'game' : 'desktop', [0, D / 2 + 0.004, 0.0011]);
      emblemAt(lid, gaming ? 0.04 : 0.03, [0, D * 0.55, -lH - 0.0003], [0, Math.PI, 0]);
      mesh(new THREE.CylinderGeometry(lH * 0.6, lH * 0.6, W * 0.7, 12).rotateZ(Math.PI / 2), C, { parent: root, at: [0, bH, -D / 2 + 0.003] });
      led(root, 'power_led', 'white', [W * 0.42, bH + 0.0005, D * 0.3], [0, 1, 0], 0.003);
      onTracks.push(...lampTracks('power_led', 3));
      anims.push(clip('close', 1.2, [rotateTrack(lid, 'x', 1.2, (t) => Math.PI / 2 + angle + Math.min(1, t * 1.1) * (-angle - 0.02), 16)]));
      oneShot.push('close');
      break;
    }
    case 'desktop-pc': {
      const s = T('compact') ? 0.62 : 1;
      const W = 0.21 * s;
      const H = 0.46 * s;
      const D = 0.45 * s;
      const retro = T('retro');
      const C = shell(o.color ?? (retro ? '#d8cfb6' : T('white') ? '#f1f1ef' : T('pink') ? '#efc3cc' : '#18191b'), retro ? 0.7 : 0.4);
      mesh(roundedBox(W, H, D, 0.01, 2), C, { parent: root, at: [0, H / 2 + 0.012, 0] });
      for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.014, 12), rubber(), { parent: root, at: [sx * (W / 2 - 0.025), 0.007, sz * (D / 2 - 0.04)] });
      if (retro) {
        mesh(roundedBox(W * 0.8, 0.012, 0.004, 0.001, 1), plasticMat('#2a2a2a'), { parent: root, at: [0, H * 0.82, D / 2 + 0.002] });
        mesh(roundedBox(W * 0.8, 0.03, 0.004, 0.002, 1), plasticMat('#bdb39a'), { parent: root, at: [0, H * 0.7, D / 2 + 0.002] });
        led(root, 'power_led', 'green', [W * 0.3, H * 0.2, D / 2 + 0.002], [0, 0, 1], 0.005);
      } else {
        // front mesh + side window into the case
        mesh(roundedBox(W * 0.82, H * 0.82, 0.004, 0.004, 1), new THREE.MeshStandardMaterial({ color: M.toColor(C.color).multiplyScalar(0.6), roughness: 0.8 }), { parent: root, at: [0, H / 2 + 0.012, D / 2 + 0.0015] });
        led(root, 'power_led', 'white', [0, H * 0.96, D / 2 + 0.003], [0, 0, 1], 0.005);
        if (!T('workstation')) {
          mesh(new THREE.PlaneGeometry(D * 0.86, H * 0.86).rotateY(Math.PI / 2), glassMat('#2a2f36', 0.35), { parent: root, at: [W / 2 + 0.0015, H / 2 + 0.012, 0] });
          const inner = group('internals', { parent: root, at: [0, 0.012, 0] });
          mesh(roundedBox(0.004, H * 0.8, D * 0.75, 0.002, 1), plasticMat('#1a2a1f', 0.6), { parent: inner, at: [-W / 2 + 0.012, H / 2, -0.01] });
          mesh(roundedBox(W * 0.55, 0.045, D * 0.6, 0.004, 2), shell('#222', 0.4), { parent: inner, at: [-W * 0.18, H * 0.42, 0] });
          mesh(roundedBox(0.03, 0.12 * s, 0.12 * s, 0.006, 2), metalMat('steel'), { parent: inner, at: [-W / 2 + 0.03, H * 0.72, -0.04] });
          const rgb = lampGroup('rgb', T('pink') ? 'red' : 'blue');
          for (const y of [0.3, 0.55, 0.8]) {
            mesh(new THREE.CylinderGeometry(0.055 * s, 0.055 * s, 0.022, 24).rotateZ(Math.PI / 2), plasticMat('#111'), { parent: inner, at: [0, H * y, -D / 2 + 0.02] });
            rgb.add(inner, { at: [W * 0.1, H * y, -D / 2 + 0.04], normal: [1, 0, 0], w: 0.09 * s, h: 0.09 * s, depth: 0.002, shape: 'round', bezel: false });
          }
          onTracks.push(...lampTracks('rgb', 2.4));
        }
      }
      emblemAt(root, 0.035 * s, [0, H * 0.12, D / 2 + 0.004]);
      onTracks.push(...lampTracks('power_led', 3));
      break;
    }
    case 'monitor': {
      const uw = T('ultrawide') || T('curved');
      const W = uw ? 0.82 : 0.54;
      const H = uw ? 0.36 : 0.32;
      const portrait = T('portrait');
      const C = shell(o.color ?? (T('white') ? '#f1f1ef' : '#1b1c1e'), 0.4);
      const screens = T('dual') ? [-0.29, 0.29] : [0];
      for (const sx of screens) {
        const head = group(screens.length > 1 ? `head_${sx > 0 ? 'R' : 'L'}` : 'head', { parent: root, at: [sx, 0.24 + (portrait ? W / 2 : H / 2), 0.02], rot: [0, -sx * 0.6, portrait ? Math.PI / 2 : 0] });
        if (T('curved')) {
          // 1800R curve: concave towards the viewer
          const R = 1.8;
          const shellG = new THREE.CylinderGeometry(R, R, H, 64, 1, true, Math.PI - W / (2 * R), W / R).translate(0, 0, R);
          const back = mesh(shellG, C, { parent: head, at: [0, 0, -0.012] });
          back.material = back.material.clone();
          back.material.side = THREE.DoubleSide;
          const scrG = new THREE.CylinderGeometry(R - 0.002, R - 0.002, H - 0.03, 64, 1, true, Math.PI - (W - 0.02) / (2 * R), (W - 0.02) / R).translate(0, 0, R - 0.002);
          const uv = scrG.attributes.uv;
          for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
          const sm = screenMat('game', W / H, 2);
          sm.side = THREE.BackSide;
          const sc = mesh(scrG, sm, { parent: head, at: [0, 0.006, -0.012 + 0.003] });
          sc.name = screenCount++ ? `screen_${screenCount}` : 'screen';
        } else {
          mesh(roundedBox(W, H, 0.022, 0.006, 2), C, { parent: head });
          screen(head, W - 0.016, H - 0.03, sx < 0 ? 'desktop' : T('gaming') ? 'game' : 'desktop', [0, 0.006, 0.0115], screens.length);
        }
        mesh(roundedBox(0.12, 0.12, 0.03, 0.01, 2), C, { parent: head, at: [0, 0, -0.03] });
        emblemAt(head, 0.025, [0, -H / 2 + 0.008, 0.0118]);
        if (sx === screens.at(-1)) led(head, 'power_led', 'white', [W / 2 - 0.03, -H / 2 + 0.006, 0.0115], [0, 0, 1], 0.003);
        curveTube([[0, 0.012, -0.08], [0, 0.12, -0.08], [0, 0.24 + (portrait ? W / 2 : H / 2), -0.045]], 0.018, C, { parent: root, segments: 12 }).position.x = sx;
        if (T('gaming')) {
          for (const s of [1, -1]) curveTube([[sx, 0.012, -0.08], [sx + s * 0.18, 0.004, 0.08]], 0.012, shell('#b3201c'), { parent: root, segments: 2 });
        } else mesh(roundedBox(0.24, 0.012, 0.18, 0.02, 2), C, { parent: root, at: [sx, 0.006, -0.05] });
      }
      onTracks.push(...lampTracks('power_led', 2));
      break;
    }
    case 'keyboard': {
      const compact = T('compact');
      const split = T('split');
      const mech = T('mechanical-rgb') || T('retro');
      const W = compact ? 0.3 : 0.44;
      const D = 0.13;
      const C = shell(o.color ?? (T('white') ? '#f2f2f0' : T('retro') ? '#d8cfb6' : '#1b1c1e'), 0.5);
      const keyMat = plasticMat(T('white') ? '#ffffff' : T('retro') ? '#efe8d4' : '#2a2b2e', 0.55);
      const halves = split ? [-0.13, 0.13] : [0];
      for (const hx of halves) {
        const hw = split ? W / 2 - 0.02 : W;
        const base = group(null, { parent: root, at: [hx, 0, 0], rot: [0, split ? -Math.sign(hx) * 0.18 : 0, 0] });
        mesh(roundedBox(hw, mech ? 0.03 : 0.012, D, 0.006, 2), C, { parent: base, at: [0, mech ? 0.015 : 0.006, 0] });
        keyGrid(base, hw - 0.02, D - 0.02, compact ? 5 : 6, Math.round((hw / 0.44) * 18), [0, (mech ? 0.03 : 0.012) + (mech ? 0.005 : 0.002), 0], keyMat, mech ? 0.01 : 0.003);
        if (T('mechanical-rgb')) {
          const rgb = lampGroup('rgb', 'blue');
          rgb.add(base, { at: [0, 0.008, D / 2 + 0.0008], normal: [0, 0, 1], w: hw - 0.02, h: 0.004, depth: 0.001, shape: 'strip', bezel: false });
        }
      }
      if (T('mechanical-rgb')) onTracks.push(...lampTracks('rgb', 3));
      emblemAt(root, 0.014, [W / 2 - 0.03, (mech ? 0.03 : 0.012) + 0.0006, -D / 2 + 0.008], [-Math.PI / 2, 0, 0]);
      break;
    }
    case 'mouse': {
      const C = shell(o.color ?? (T('white') ? '#f2f2f0' : T('pink') ? '#efc3cc' : '#1b1c1e'), 0.4);
      if (T('vertical')) {
        const g = new THREE.SphereGeometry(0.05, 32, 20);
        g.scale(0.7, 1.1, 1.2);
        mesh(g, C, { parent: root, at: [0, 0.05, 0], rot: [0, 0, -0.5] });
      } else if (T('trackball')) {
        const g = new THREE.SphereGeometry(0.06, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2);
        g.scale(0.9, 0.55, 1.15);
        mesh(g, C, { parent: root });
        mesh(new THREE.SphereGeometry(0.02, 24, 16), shell('#c0392b', 0.1), { parent: root, at: [-0.025, 0.03, 0.01] });
      } else {
        const g = new THREE.SphereGeometry(0.06, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2);
        g.scale(T('gaming') ? 0.6 : 0.52, 0.62, 1.0);
        mesh(g, C, { parent: root });
        mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.008, 16).rotateZ(Math.PI / 2), rubber(), { parent: root, at: [0, 0.034, -0.025] });
        mesh(new THREE.BoxGeometry(0.0012, 0.006, 0.04), plasticMat('#000'), { parent: root, at: [0, 0.033, -0.03] });
        if (T('gaming')) {
          led(root, 'rgb', 'blue', [0, 0.012, 0.055], [0, 0.3, 1], 0.012);
          onTracks.push(...lampTracks('rgb', 3));
          for (const z of [-0.01, -0.025]) mesh(roundedBox(0.004, 0.006, 0.012, 0.002, 1), plasticMat('#333'), { parent: root, at: [-0.029, 0.012, z] });
        }
      }
      emblemAt(root, 0.012, [0, 0.03, 0.03], [-Math.PI / 2 + 0.75, 0, 0]);
      break;
    }
    case 'gaming-setup': {
      const white = T('white');
      const C = shell(white ? '#f1f1ef' : '#151618', 0.5);
      const deskW = T('compact') ? 1.2 : 1.6;
      // desk with metal legs
      mesh(roundedBox(deskW, 0.03, 0.7, 0.01, 2), C, { parent: root, at: [0, 0.735, 0] });
      for (const sx of [1, -1]) {
        mesh(roundedBox(0.06, 0.72, 0.06, 0.006, 1), metalMat(white ? 'white' : 'black'), { parent: root, at: [sx * (deskW / 2 - 0.08), 0.36, 0] });
        mesh(roundedBox(0.08, 0.02, 0.62, 0.006, 1), metalMat(white ? 'white' : 'black'), { parent: root, at: [sx * (deskW / 2 - 0.08), 0.01, 0] });
      }
      // RGB strip under the desk edge
      const rgb = lampGroup('rgb', white ? 'blue' : 'red');
      rgb.add(root, { at: [0, 0.716, 0.35], normal: [0, 0, 1], w: deskW - 0.1, h: 0.006, depth: 0.002, shape: 'strip', bezel: false });
      const monitors = T('triple-monitor') ? [-0.58, 0, 0.58] : [0];
      for (const mx of monitors) {
        const head = group(null, { parent: root, at: [mx, 1.0, -0.18], rot: [0, -mx * 0.5, 0] });
        mesh(roundedBox(0.6, 0.35, 0.022, 0.006, 2), C, { parent: head });
        screen(head, 0.585, 0.32, 'game', [0, 0.006, 0.0115], 3);
        mesh(roundedBox(0.04, 0.27, 0.03, 0.008, 2), C, { parent: root, at: [mx, 0.85, -0.205] });
        mesh(roundedBox(0.2, 0.01, 0.15, 0.02, 2), C, { parent: root, at: [mx, 0.755, -0.22] });
      }
      // keyboard, mouse + pad
      mesh(roundedBox(0.8, 0.003, 0.32, 0.01, 2), fabricMat(white ? '#d9d9e0' : '#1b1c20'), { parent: root, at: [0.05, 0.7515, 0.12] });
      mesh(roundedBox(0.44, 0.025, 0.13, 0.006, 2), C, { parent: root, at: [-0.05, 0.765, 0.12] });
      keyGrid(root, 0.42, 0.11, 6, 18, [-0.05, 0.781, 0.12], plasticMat(white ? '#ffffff' : '#222', 0.55), 0.008);
      const mg = new THREE.SphereGeometry(0.06, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.55, 0.38, 1);
      mesh(mg, C, { parent: root, at: [0.33, 0.753, 0.12] });
      // tower on the desk
      if (!T('compact')) {
        mesh(roundedBox(0.21, 0.46, 0.42, 0.01, 2), C, { parent: root, at: [deskW / 2 - 0.2, 0.98, -0.08] });
        mesh(new THREE.PlaneGeometry(0.36, 0.4).rotateY(-Math.PI / 2), glassMat('#2a2f36', 0.4), { parent: root, at: [deskW / 2 - 0.306, 0.98, -0.08] });
        rgb.add(root, { at: [deskW / 2 - 0.31, 0.98, -0.08], normal: [-1, 0, 0], w: 0.12, h: 0.12, depth: 0.002, shape: 'round', bezel: false });
      }
      if (T('streamer')) {
        curveTube([[-deskW / 2 + 0.12, 0.75, -0.3], [-deskW / 2 + 0.12, 1.05, -0.3], [-deskW / 2 + 0.35, 1.15, -0.05]], 0.008, metalMat('black'), { parent: root });
        mesh(new THREE.CapsuleGeometry(0.025, 0.08, 6, 16).rotateX(-0.5), metalMat('black'), { parent: root, at: [-deskW / 2 + 0.36, 1.12, -0.02] });
        const ring = lampGroup('ringlight', 'white');
        ring.add(root, { at: [-0.45, 1.32, -0.3], normal: [0, 0, 1], w: 0.28, h: 0.28, depth: 0.01, shape: 'round' });
        mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.45, 10), metalMat('black'), { parent: root, at: [-0.45, 0.75 + 0.225, -0.31] });
        mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 20), metalMat('black'), { parent: root, at: [-0.45, 0.755, -0.31] });
        onTracks.push(...lampTracks('ringlight', 3));
      }
      emblemAt(root, 0.03, [0, 0.73, 0.351]);
      onTracks.push(...lampTracks('rgb', 3));
      break;
    }
    case 'smartphone': {
      const mini = T('mini');
      const fold = T('foldable');
      const rug = T('rugged');
      const W = mini ? 0.064 : rug ? 0.082 : 0.0715;
      const H = mini ? 0.131 : rug ? 0.165 : 0.1475;
      const Dp = rug ? 0.016 : fold ? 0.006 : 0.0078;
      const C = rug ? rubber('#2b2e30') : alu(col(T('pro') ? '#5b5e63' : '#c8cacd'), 0.2);
      // phone lies screen-up on the table (foldable stands half open)
      const body = group('phone', { parent: root, rot: fold ? [0, 0, 0] : [-Math.PI / 2, 0, 0], at: [0, fold ? 0 : Dp / 2, 0] });
      const half = (parent, h, y, kind) => {
        mesh(roundedBox(W, h, Dp, Math.min(0.009, W * 0.14), 3), C, { parent, at: [0, y, 0] });
        mesh(roundedBox(W - 0.002, h - 0.002, 0.0006, Math.min(0.008, W * 0.13), 2), black(), { parent, at: [0, y, Dp / 2 + 0.0002] });
        screen(parent, W - 0.006, h - 0.008, kind, [0, y, Dp / 2 + 0.0006], 2);
      };
      if (fold) {
        const lower = group(null, { parent: body, at: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] });
        half(lower, H / 2, H / 4, 'phone');
        const upper = group('upper', { parent: body, at: [0, Dp / 2, -0.0], rot: [-Math.PI / 2 + 1.8, 0, 0] });
        half(upper, H / 2, H / 4, 'game');
        mesh(new THREE.CylinderGeometry(Dp * 0.6, Dp * 0.6, W, 12).rotateZ(Math.PI / 2), C, { parent: body, at: [0, Dp * 0.4, 0] });
      } else {
        half(body, H, 0, 'phone');
        // camera island on the back
        const cam = group(null, { parent: body, at: [-W / 2 + 0.02, H / 2 - 0.02, -Dp / 2] });
        const lenses = T('pro') || rug ? [[-0.006, 0.006], [0.006, 0.006], [-0.006, -0.006]] : [[0, 0.006], [0, -0.006]];
        mesh(roundedBox(0.03, 0.03, 0.002, 0.007, 2), C, { parent: cam, at: [0, 0, -0.0008] });
        for (const [x, y] of lenses) {
          mesh(new THREE.CylinderGeometry(0.0055, 0.0058, 0.0025, 20).rotateX(Math.PI / 2), metalMat('black'), { parent: cam, at: [x, y, -0.002] });
          mesh(new THREE.CircleGeometry(0.0042, 20), lensMat(), { parent: cam, at: [x, y, -0.0033], rot: [0, Math.PI, 0] });
        }
        emblemAt(body, 0.012, [0, -0.01, -Dp / 2 - 0.0002], [0, Math.PI, 0]);
        if (rug) for (const sx of [1, -1]) for (const sy of [1, -1]) mesh(new THREE.SphereGeometry(0.008, 12, 8), rubber('#e2651a'), { parent: body, at: [sx * (W / 2 - 0.004), sy * (H / 2 - 0.004), 0] });
      }
      break;
    }
    case 'tablet': {
      const mini = T('mini');
      const kids = T('kids');
      const W = mini ? 0.135 : 0.25;
      const H = mini ? 0.195 : 0.178;
      const C = kids ? rubber(o.color ?? '#3d8bd9') : alu(col('#c8cacd'), 0.25);
      const stand = T('pro-keyboard');
      if (stand) {
        // keyboard folio with the tablet propped up
        mesh(roundedBox(W + 0.004, 0.008, H * 0.95, 0.004, 2), shell('#26282c', 0.6), { parent: root, at: [0, 0.004, 0.02] });
        keyGrid(root, W - 0.02, H * 0.55, 5, 14, [0, 0.0095, 0.05], plasticMat('#1a1a1a'), 0.002);
      }
      const tab = group('tablet', { parent: root, at: stand ? [0, 0.008, -H * 0.42] : kids ? [0, 0.02, 0] : [0, 0.0035, 0], rot: stand ? [-0.35, 0, 0] : [-Math.PI / 2, 0, 0] });
      const ty = stand ? H / 2 : 0;
      mesh(roundedBox(W, H, 0.0065, 0.012, 3), C, { parent: tab, at: [0, ty, 0] });
      mesh(roundedBox(W - 0.002, H - 0.002, 0.0006, 0.011, 2), black(), { parent: tab, at: [0, ty, 0.0034] });
      screen(tab, W - 0.016, H - 0.016, kids ? 'game' : 'desktop', [0, ty, 0.0038], 4);
      emblemAt(tab, 0.02, [0, ty, -0.0036], [0, Math.PI, 0]);
      if (kids) mesh(roundedBox(W + 0.04, H + 0.04, 0.04, 0.018, 4), rubber(o.color ?? '#3d8bd9'), { parent: tab, at: [0, ty, -0.012] });
      if (kids) curveTube([[-0.05, H / 2 + 0.015, -0.012], [0, H / 2 + 0.05, -0.012], [0.05, H / 2 + 0.015, -0.012]], 0.009, rubber(o.color ?? '#3d8bd9'), { parent: tab });
      if (T('stylus') || stand) mesh(new THREE.CapsuleGeometry(0.0045, 0.15, 4, 12).rotateZ(Math.PI / 2), shell('#f2f2f0', 0.3), { parent: root, at: [0, 0.0045, stand ? H * 0.5 + 0.03 : H / 2 + 0.012] });
      break;
    }
    case 'smartwatch': {
      const round = T('round') || T('gold');
      const C = T('gold') ? metalMat('gold') : T('rugged') ? metalMat('black') : alu(col('#1f2633'), 0.25);
      const strap = T('sport') ? rubber(o.color ?? '#e86a1a') : T('gold') ? leatherMat('#6b4226') : T('kids') ? rubber('#45b36b') : rubber('#2b2e33');
      const g = group('watch', { parent: root, at: [0, 0.0, 0] });
      // strap loop lying on the table
      const loop = [];
      for (let i = 0; i <= 32; i++) { const a = (i / 32) * Math.PI * 2; loop.push([0, 0.032 + Math.sin(a) * 0.032, Math.cos(a) * 0.026]); }
      const strapGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(loop.map((p) => new THREE.Vector3(...p)), true), 64, 0.0035, 8, true);
      strapGeo.scale(3.2, 1, 1);
      mesh(strapGeo, strap, { parent: g, rot: [0, 0, 0] });
      const face = group(null, { parent: g, at: [0, 0.066, 0] });
      const s = T('rugged') ? 1.15 : T('kids') ? 0.9 : 1;
      if (round) {
        mesh(new THREE.CylinderGeometry(0.022 * s, 0.022 * s, 0.011, 40), C, { parent: face });
        mesh(new THREE.CircleGeometry(0.019 * s, 40).rotateX(-Math.PI / 2), screenMat('watch', 1, 1), { parent: face, at: [0, 0.0056, 0] }).name = 'screen';
      } else {
        mesh(roundedBox(0.04 * s, 0.011, 0.045 * s, 0.009, 3), C, { parent: face });
        mesh(roundedBox(0.035 * s, 0.0008, 0.04 * s, 0.008, 2).translate(0, 0, 0), black(), { parent: face, at: [0, 0.0056, 0] });
        mesh(new THREE.PlaneGeometry(0.031 * s, 0.036 * s).rotateX(-Math.PI / 2), screenMat('watch', 0.86, 1), { parent: face, at: [0, 0.0062, 0] }).name = 'screen';
      }
      mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.004, 16).rotateZ(Math.PI / 2), C, { parent: face, at: [0.022 * s + 0.002, 0, 0] });
      if (T('rugged')) for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.6; mesh(roundedBox(0.006, 0.005, 0.004, 0.0015, 1), metalMat('steel'), { parent: face, at: [Math.cos(a) * 0.026, 0, Math.sin(a) * 0.026] }); }
      break;
    }
    case 'vr-headset': {
      const C = shell(o.color ?? (T('white') ? '#f2f2f0' : T('pro') ? '#c8cacd' : '#1b1c1e'), T('pro') ? 0.15 : 0.45);
      const visor = new THREE.SphereGeometry(0.1, 32, 20, -0.9, 1.8, 0.95, 1.25);
      visor.scale(1.0, 0.75, 0.9);
      const hz = 0.09;
      mesh(roundedBox(0.19, 0.105, 0.075, 0.035, 4), C, { parent: root, at: [0, hz, 0.0] });
      if (T('pro')) mesh(roundedBox(0.185, 0.095, 0.004, 0.035, 3), glassMat('#0a0c10', 0.92), { parent: root, at: [0, hz, 0.039] });
      mesh(roundedBox(0.17, 0.085, 0.03, 0.03, 3), fabricMat('#2a2b2e'), { parent: root, at: [0, hz, -0.045] });
      // head strap loop
      const pts = [];
      for (let i = 0; i <= 24; i++) { const a = Math.PI * (i / 24); pts.push([Math.cos(a) * 0.1, hz + 0.0, -0.05 - Math.sin(a) * 0.17]); }
      curveTube(pts, 0.012, T('pro') ? fabricMat('#7a7d82') : rubber('#26282b'), { parent: root, segments: 48 });
      for (const sx of [1, -1]) {
        mesh(new THREE.SphereGeometry(0.006, 10, 8), lensMat(), { parent: root, at: [sx * 0.06, hz - 0.03, 0.038] });
        mesh(new THREE.SphereGeometry(0.006, 10, 8), lensMat(), { parent: root, at: [sx * 0.085, hz + 0.035, 0.03] });
      }
      // rests on its lower edge + a small foot pad
      mesh(roundedBox(0.12, hz - 0.04, 0.05, 0.012, 2), rubber(), { parent: root, at: [0, (hz - 0.04) / 2, -0.02] });
      if (T('tethered')) curveTube([[0.0, hz + 0.05, -0.2], [0.05, hz + 0.02, -0.32], [0.15, 0.01, -0.36], [0.4, 0.008, -0.3]], 0.004, rubber(), { parent: root, segments: 32 });
      if (T('controllers') || T('pro')) {
        for (const sx of [1, -1]) {
          const ctrl = group(null, { parent: root, at: [sx * 0.2, 0, 0.06] });
          mesh(new THREE.CapsuleGeometry(0.018, 0.07, 6, 14).rotateX(Math.PI / 2 - 0.2), C, { parent: ctrl, at: [0, 0.02, 0] });
          mesh(new THREE.TorusGeometry(0.04, 0.007, 10, 32), C, { parent: ctrl, at: [0, 0.042, -0.06], rot: [0.2, 0, 0] });
          curveTube([[0, 0.03, -0.03], [0, 0.04, -0.045]], 0.008, C, { parent: ctrl });
        }
      }
      emblemAt(root, 0.03, [0, hz + 0.03, T('pro') ? 0.0415 : 0.0378]);
      led(root, 'power_led', 'white', [0.08, hz + 0.045, 0.034], [0, 0, 1], 0.003);
      onTracks.push(...lampTracks('power_led', 2.5));
      break;
    }
    case 'earbuds': {
      const C = shell(o.color ?? (T('black') ? '#1b1c1e' : T('pink') ? '#efc3cc' : '#f6f6f4'), 0.18);
      const sport = T('sport');
      const W = sport ? 0.07 : 0.06;
      const Hc = 0.045;
      mesh(roundedBox(W, Hc * 0.62, 0.022, 0.011, 4), C, { parent: root, at: [0, Hc * 0.31, 0] });
      const lid = group('lid', { parent: root, at: [0, Hc * 0.62, -0.011], rot: [T('open') ? -1.9 : 0, 0, 0] });
      mesh(roundedBox(W, Hc * 0.38, 0.022, 0.011, 4), C, { parent: lid, at: [0, Hc * 0.19, 0.011] });
      led(root, 'power_led', 'green', [0, Hc * 0.4, 0.0112], [0, 0, 1], 0.0025);
      for (const sx of [1, -1]) {
        const bud = group(null, { parent: root, at: [sx * 0.013, Hc * 0.62 + (T('open') ? 0.004 : -0.004), 0] });
        mesh(new THREE.SphereGeometry(0.008, 16, 12), C, { parent: bud });
        if (!sport) mesh(new THREE.CapsuleGeometry(0.0035, 0.014, 4, 8), C, { parent: bud, at: [0, -0.01, 0] });
        else mesh(new THREE.TorusGeometry(0.01, 0.002, 6, 20, Math.PI), C, { parent: bud, at: [0, 0.004, 0] });
      }
      emblemAt(root, 0.012, [0, Hc * 0.25, 0.0112]);
      onTracks.push(...lampTracks('power_led', 3));
      anims.push(clip('open', 1, [rotateTrack(lid, 'x', 1, (t) => -Math.min(1, t * 1.2) * 1.9, 12)]));
      oneShot.push('open');
      break;
    }
    case 'headphones': {
      const C = shell(o.color ?? (T('white') ? '#f2f2f0' : T('retro') ? '#8a5a3a' : T('studio') ? '#202124' : '#2d2f33'), 0.4);
      const onEar = T('on-ear');
      const r = onEar ? 0.032 : 0.045;
      const span = onEar ? 0.075 : 0.085;
      // band arch standing on the cups
      const pts = [];
      for (let i = 0; i <= 20; i++) { const a = Math.PI * (i / 20); pts.push([Math.cos(a) * span, r + 0.02 + Math.sin(a) * 0.14, 0]); }
      curveTube(pts, 0.009, T('retro') ? metalMat('steel') : C, { parent: root, segments: 40 });
      curveTube(pts.slice(5, 16).map(([x, y, z]) => [x * 0.98, y - 0.006, z]), 0.012, leatherMat(T('retro') ? '#5a3a24' : '#1a1a1a'), { parent: root, segments: 24 });
      for (const sx of [1, -1]) {
        const cup = group(`cup_${sx > 0 ? 'R' : 'L'}`, { parent: root, at: [sx * span, r, 0] });
        mesh(new THREE.CylinderGeometry(r, r, 0.035, 32).rotateZ(Math.PI / 2), C, { parent: cup, at: [sx * 0.01, 0, 0] });
        mesh(new THREE.TorusGeometry(r * 0.85, 0.012, 10, 32).rotateY(Math.PI / 2), leatherMat('#1a1a1a'), { parent: cup, at: [-sx * 0.012, 0, 0] });
        if (T('studio') || T('retro')) curveTube([[sx * 0.0, r * 0.9, 0], [sx * 0.0, r + 0.025, 0]], 0.005, metalMat('steel'), { parent: cup });
        emblemAt(cup, r * 0.8, [sx * 0.028, 0, 0], [0, sx * Math.PI / 2, 0]);
      }
      if (T('gaming')) {
        curveTube([[-span - 0.02, r - 0.01, 0.01], [-span - 0.03, r - 0.03, 0.07], [-span + 0.02, r - 0.03, 0.11]], 0.004, rubber(), { parent: root });
        mesh(new THREE.SphereGeometry(0.008, 12, 8), rubber(), { parent: root, at: [-span + 0.02, r - 0.03, 0.11] });
        const rgb = lampGroup('rgb', 'red');
        for (const sx of [1, -1]) rgb.add(root, { at: [sx * (span + 0.029), r, 0], normal: [sx, 0, 0], w: r * 1.3, h: r * 1.3, depth: 0.002, shape: 'round', bezel: false });
        onTracks.push(...lampTracks('rgb', 3));
      }
      break;
    }
    case 'smart-speaker': {
      const C = fabricMat(o.color ?? (T('black') ? '#2a2b2e' : T('orange') ? '#d9772f' : '#cfd0cc'));
      const top = shell(T('black') ? '#1b1c1e' : '#e9e9e6', 0.35);
      if (T('display')) {
        const g = new THREE.CylinderGeometry(0.06, 0.08, 0.11, 32, 1, false, 0, Math.PI);
        mesh(g, C, { parent: root, at: [0, 0.055, 0], rot: [0, -Math.PI / 2, 0] });
        const head = group(null, { parent: root, at: [0, 0.11, 0.02], rot: [-0.35, 0, 0] });
        mesh(roundedBox(0.2, 0.135, 0.012, 0.008, 2), top, { parent: head });
        screen(head, 0.18, 0.112, 'desktop', [0, 0, 0.0065], 5);
      } else {
        const mini = T('mini');
        const H = mini ? 0.045 : T('tall') ? 0.24 : 0.15;
        const R = mini ? 0.05 : T('tall') ? 0.055 : 0.07;
        mesh(lathe([[0, 0], [R * 0.9, 0], [R, R * 0.2], [R, H - R * 0.2], [R * 0.92, H], [0, H]], 48), C, { parent: root });
        mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.004, 48), top, { parent: root, at: [0, H + 0.001, 0] });
        const ringG = lampGroup('ring', 'blue');
        ringG.add(root, { at: [0, H + 0.0035, 0], normal: [0, 1, 0], w: R * 1.4, h: R * 1.4, depth: 0.001, shape: 'round', bezel: false });
        onTracks.push(...lampTracks('ring', 2));
        for (const a of [0, 1, 2, 3]) mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.002, 10), plasticMat('#888'), { parent: root, at: [Math.cos(a * 1.57) * R * 0.5, H + 0.004, Math.sin(a * 1.57) * R * 0.5] });
      }
      emblemAt(root, 0.016, [0, 0.03, T('display') ? 0.062 : (T('mini') ? 0.05 : T('tall') ? 0.055 : 0.07) + 0.0015]);
      break;
    }
    case 'soundbar': {
      const W = T('compact') ? 0.6 : T('premium') ? 1.2 : 0.9;
      const C = shell(o.color ?? (T('white') ? '#f1f1ef' : '#1b1c1e'), 0.5);
      mesh(roundedBox(W, 0.065, 0.1, 0.03, 4), C, { parent: root, at: [0, 0.0325 + 0.004, 0] });
      mesh(roundedBox(W - 0.03, 0.05, 0.002, 0.02, 3), fabricMat(T('white') ? '#dcdcd8' : '#2a2b2e'), { parent: root, at: [0, 0.0365, 0.05] });
      if (T('premium')) mesh(roundedBox(W - 0.02, 0.008, 0.08, 0.004, 2), metalMat('steel'), { parent: root, at: [0, 0.07, 0] });
      for (const sx of [1, -1]) mesh(roundedBox(0.05, 0.006, 0.05, 0.004, 1), rubber(), { parent: root, at: [sx * (W / 2 - 0.08), 0.003, 0] });
      led(root, 'power_led', 'white', [W / 2 - 0.06, 0.05, 0.0512], [0, 0, 1], 0.004);
      emblemAt(root, 0.022, [0, 0.0365, 0.0515]);
      if (T('subwoofer')) {
        mesh(roundedBox(0.22, 0.4, 0.4, 0.02, 3), C, { parent: root, at: [W / 2 + 0.25, 0.2, 0] });
        mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.006, 32).rotateZ(Math.PI / 2), fabricMat('#2a2b2e'), { parent: root, at: [W / 2 + 0.25 - 0.111, 0.2, 0] });
        mesh(roundedBox(W * 0.5 + 0.2, 0.004, 0.06, 0.002, 1), C, { parent: root, at: [W / 4 + 0.1, 0.002, -0.05] });
      }
      onTracks.push(...lampTracks('power_led', 3));
      break;
    }
    case 'projector': {
      const s = T('mini') ? 0.55 : T('cinema') ? 1.3 : 1;
      const C = shell(o.color ?? (T('white') || T('mini') ? '#f1f1ef' : '#2d2f33'), 0.4);
      const st = T('short-throw');
      const W = (st ? 0.5 : 0.3) * s;
      const H = (st ? 0.12 : 0.1) * s;
      const D = (st ? 0.32 : 0.24) * s;
      mesh(roundedBox(W, H, D, 0.015 * s, 3), C, { parent: root, at: [0, H / 2 + 0.01, 0] });
      for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.012, 12), rubber(), { parent: root, at: [sx * (W / 2 - 0.03 * s), 0.006, sz * (D / 2 - 0.03 * s)] });
      const beam = lampGroup('lamp', 'white');
      if (st) {
        mesh(roundedBox(W * 0.7, 0.006, D * 0.3, 0.003, 1), glassMat('#1a2a3a', 0.8), { parent: root, at: [0, H + 0.013, D * 0.25] });
        beam.add(root, { at: [0, H + 0.0165, D * 0.25], normal: [0, 1, 0.3], w: W * 0.4, h: 0.02, depth: 0.002, shape: 'strip', bezel: false });
        mesh(roundedBox(W * 0.9, H * 0.6, 0.004, 0.004, 1), fabricMat('#3a3b3e'), { parent: root, at: [0, H / 2 + 0.01, -D / 2 - 0.0015] });
      } else {
        mesh(new THREE.CylinderGeometry(0.035 * s, 0.04 * s, 0.03 * s, 32).rotateX(Math.PI / 2), metalMat('black'), { parent: root, at: [-W * 0.22, H / 2 + 0.01, D / 2 + 0.014 * s] });
        mesh(new THREE.CircleGeometry(0.028 * s, 32), lensMat(), { parent: root, at: [-W * 0.22, H / 2 + 0.01, D / 2 + 0.03 * s] });
        beam.add(root, { at: [-W * 0.22, H / 2 + 0.01, D / 2 + 0.031 * s], normal: [0, 0, 1], w: 0.05 * s, h: 0.05 * s, depth: 0.001, shape: 'round', bezel: false, glowSize: 0.25 * s });
        for (let i = 0; i < 6; i++) mesh(roundedBox(0.004, H * 0.5, 0.03 * s, 0.001, 1), plasticMat('#111'), { parent: root, at: [W / 2 + 0.0015, H / 2 + 0.01, -D * 0.2 + i * 0.015 * s] });
      }
      emblemAt(root, 0.03 * s, [W * 0.25, H / 2 + 0.01, D / 2 + 0.0015]);
      onTracks.push(...lampTracks('lamp', 4));
      break;
    }
    case 'camera': {
      const film = T('film');
      const mirrorless = T('mirrorless') || T('compact');
      const compact = T('compact');
      const W = compact ? 0.105 : mirrorless ? 0.128 : 0.14;
      const H = compact ? 0.06 : mirrorless ? 0.085 : 0.1;
      const D = compact ? 0.035 : 0.045;
      const C = film ? metalMat('steel') : shell(o.color ?? (T('white') ? '#e9e7e2' : '#18191b'), 0.6);
      const grip = leatherMat(film ? '#1a1a1a' : '#121212');
      mesh(roundedBox(W, H, D, 0.008, 3), C, { parent: root, at: [0, H / 2, 0] });
      if (film) mesh(roundedBox(W - 0.002, H * 0.5, D + 0.002, 0.004, 2), grip, { parent: root, at: [0, H * 0.45, 0] });
      if (!compact) {
        mesh(roundedBox(0.03, H * 0.95, D + 0.025, 0.012, 3), grip, { parent: root, at: [W / 2 - 0.016, H * 0.49, 0.01] });
        // prism hump (DSLR / film) or flat EVF
        if (!mirrorless) mesh(new THREE.CylinderGeometry(0.018, 0.032, 0.03, 4, 1).rotateY(Math.PI / 4).scale(1.2, 1, 0.9), C, { parent: root, at: [0, H + 0.014, 0] });
        else mesh(roundedBox(0.04, 0.018, 0.04, 0.006, 2), C, { parent: root, at: [-0.01, H + 0.008, -0.002] });
        mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 20), metalMat('steel'), { parent: root, at: [W / 2 - 0.025, H + 0.004, 0.005] });
        mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.007, 24), C, { parent: root, at: [-W / 2 + 0.025, H + 0.0035, 0] });
      }
      const lensL = T('zoom-lens') ? 0.13 : compact ? 0.02 : film ? 0.04 : 0.06;
      const lr = compact ? 0.02 : 0.033;
      const lens = group('lens', { parent: root, at: [compact ? 0.012 : -0.008, H * 0.47, D / 2] });
      mesh(new THREE.CylinderGeometry(lr, lr * 1.05, lensL, 40).rotateX(Math.PI / 2), film ? metalMat('steel') : metalMat('black'), { parent: lens, at: [0, 0, lensL / 2] });
      for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(lr * 1.03, lr * 1.03, 0.008, 40).rotateX(Math.PI / 2), rubber(), { parent: lens, at: [0, 0, lensL * (0.25 + i * 0.25)] });
      mesh(new THREE.CircleGeometry(lr * 0.8, 32), lensMat(), { parent: lens, at: [0, 0, lensL + 0.0005] });
      if (!film) {
        mesh(roundedBox(W * 0.6, H * 0.55, 0.003, 0.004, 1), black(), { parent: root, at: [-0.01, H * 0.5, -D / 2 - 0.001] });
        const sc = screen(root, W * 0.56, H * 0.5, 'camera', [-0.01, H * 0.5, -D / 2 - 0.0026], 6);
        sc.rotation.y = Math.PI;
      }
      emblemAt(root, 0.014, [-W / 2 + 0.018, H * 0.85, D / 2 + 0.0004]);
      led(root, 'rec_led', 'red', [W / 2 - 0.012, H * 0.8, -D / 2 - 0.0005], [0, 0, -1], 0.003);
      onTracks.push(...lampTracks('rec_led', 3, { blink: 1 }));
      break;
    }
    case 'action-camera': {
      const C = shell(o.color ?? (T('white') ? '#f1f1ef' : '#1b1c1e'), 0.55);
      const is360 = T('360');
      const W = is360 ? 0.046 : 0.071;
      const H = is360 ? 0.13 : 0.05;
      const D = is360 ? 0.024 : 0.034;
      const y0 = T('mounted') ? 0.06 : 0;
      if (T('mounted')) {
        mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.008, 24), rubber(), { parent: root, at: [0, 0.004, 0] });
        mesh(roundedBox(0.012, 0.06, 0.02, 0.004, 2), plasticMat('#222'), { parent: root, at: [0, 0.035, 0] });
      }
      mesh(roundedBox(W, H, D, 0.008, 3), C, { parent: root, at: [0, y0 + H / 2, 0] });
      if (T('rugged-case')) mesh(roundedBox(W + 0.012, H + 0.012, D + 0.012, 0.01, 3), glassMat('#d8e4ea', 0.35), { parent: root, at: [0, y0 + H / 2, 0] });
      for (const zs of is360 ? [1, -1] : [1]) {
        mesh(new THREE.SphereGeometry(0.014, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(zs * Math.PI / 2), lensMat(), { parent: root, at: [is360 ? 0 : -W * 0.2, y0 + (is360 ? H * 0.82 : H * 0.55), zs * D / 2] });
      }
      if (!is360) {
        screen(root, W * 0.4, H * 0.45, 'camera', [W * 0.22, y0 + H * 0.58, D / 2 + 0.0004], 7);
        mesh(roundedBox(0.012, 0.004, 0.008, 0.002, 1), shell('#d92f2f'), { parent: root, at: [W * 0.25, y0 + H + 0.002, 0] });
      }
      emblemAt(root, 0.01, [is360 ? 0 : W * 0.3, y0 + H * 0.18, D / 2 + 0.0004]);
      led(root, 'rec_led', 'red', [-W * 0.4, y0 + H * 0.88, D / 2 + 0.0004], [0, 0, 1], 0.0025);
      onTracks.push(...lampTracks('rec_led', 3, { blink: 1 }));
      break;
    }
    case 'drone': {
      const s = T('mini') ? 0.55 : T('pro') ? 1.5 : T('racing') ? 0.8 : 1;
      const C = shell(o.color ?? (T('white') ? '#f1f1ef' : T('orange') ? '#e86a1a' : T('racing') ? '#b3201c' : '#4a4d52'), 0.4);
      const arm = 0.17 * s;
      const legH = 0.05 * s;
      const body = group('body', { parent: root, at: [0, legH, 0] });
      mesh(roundedBox(0.09 * s, 0.045 * s, 0.17 * s, 0.02 * s, 3), C, { parent: body, at: [0, 0.03 * s, 0] });
      const props = [];
      for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const tip = [sx * arm * 0.7, 0.035 * s, sz * arm * 0.7];
        curveTube([[0, 0.03 * s, 0], tip], 0.008 * s, C, { parent: body, segments: 2 });
        mesh(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.02 * s, 16), metalMat('black'), { parent: body, at: [tip[0], tip[1] + 0.008 * s, tip[2]] });
        const p = group(`prop_${props.length}`, { parent: body, at: [tip[0], tip[1] + 0.02 * s, tip[2]] });
        for (const a of [0, Math.PI]) mesh(roundedBox(0.11 * s, 0.002, 0.014 * s, 0.006 * s, 2), plasticMat('#222', 0.4), { parent: p, at: [Math.cos(a) * 0.05 * s, 0, 0], rot: [0.12, 0, 0] });
        if (T('racing')) mesh(new THREE.TorusGeometry(0.065 * s, 0.004, 6, 32).rotateX(Math.PI / 2), C, { parent: body, at: [tip[0], tip[1] + 0.02 * s, tip[2]] });
        props.push(p);
        // landing leg
        curveTube([[tip[0] * 0.9, tip[1], tip[2] * 0.9], [tip[0] * 0.9, -legH + 0.004, tip[2] * 0.9]], 0.004 * s, plasticMat('#222'), { parent: body, segments: 2 });
      }
      if (!T('racing')) {
        const gimbal = group(null, { parent: body, at: [0, 0.0, 0.07 * s] });
        mesh(new THREE.SphereGeometry(0.018 * s, 16, 12), metalMat('black'), { parent: gimbal });
        mesh(new THREE.CircleGeometry(0.008 * s, 16), lensMat(), { parent: gimbal, at: [0, 0, 0.0185 * s] });
      }
      const navR = lampGroup('nav_led', 'red');
      for (const sx of [1, -1]) navR.add(body, { at: [sx * arm * 0.7, 0.02 * s, arm * 0.7], normal: [0, -1, 0], w: 0.006, h: 0.006, depth: 0.002, shape: 'round', bezel: false });
      emblemAt(body, 0.03 * s, [0, 0.0526 * s, 0], [-Math.PI / 2, 0, 0]);
      anims.push(clip('spin', 0.12, props.map((p, i) => spinTrack(p, 'y', 0.12, i % 2 ? -1 : 1))));
      anims.push(clip('hover', 3, [numberTrack('body.position[y]', 3, (t) => legH + 0.25 + 0.03 * Math.sin(t * Math.PI * 2), 24)]));
      onTracks.push(...lampTracks('nav_led', 3, { blink: 1 }));
      break;
    }
    case 'game-console': {
      const retro = T('retro');
      const hybrid = T('hybrid');
      const C = shell(o.color ?? (T('black') || T('slim') ? '#1b1c1e' : T('red') ? '#b3201c' : retro ? '#cfcac0' : '#f2f2f0'), 0.35);
      if (hybrid) {
        // dock + tablet console
        mesh(roundedBox(0.175, 0.105, 0.05, 0.01, 3), shell('#26282c'), { parent: root, at: [0, 0.0525, -0.005] });
        const tab = group(null, { parent: root, at: [0, 0.055, 0.03] });
        mesh(roundedBox(0.17, 0.1, 0.014, 0.006, 2), black(), { parent: tab });
        screen(tab, 0.155, 0.088, 'game', [0, 0, 0.0075], 8);
        for (const [sx, c] of [[1, '#e94f4f'], [-1, '#3fc3ff']]) mesh(roundedBox(0.034, 0.1, 0.022, 0.012, 3), shell(c), { parent: tab, at: [sx * 0.101, 0, 0] });
      } else if (retro) {
        mesh(roundedBox(0.26, 0.06, 0.2, 0.01, 2), C, { parent: root, at: [0, 0.03, 0] });
        mesh(roundedBox(0.12, 0.012, 0.09, 0.004, 1), shell('#6d6a66'), { parent: root, at: [0, 0.064, -0.02] });
        for (const x of [-0.07, -0.03]) mesh(roundedBox(0.03, 0.01, 0.015, 0.004, 1), shell('#7a2fa3'), { parent: root, at: [x, 0.062, 0.07] });
        led(root, 'power_led', 'red', [0.08, 0.04, 0.1015], [0, 0, 1], 0.005);
      } else {
        const slim = T('slim');
        const W = slim ? 0.08 : 0.104;
        const H = slim ? 0.29 : 0.39;
        const D = slim ? 0.25 : 0.26;
        const curve = new THREE.Shape();
        curve.moveTo(-D / 2, 0); curve.lineTo(D / 2, 0); curve.quadraticCurveTo(D / 2 + 0.02, H * 0.6, D / 2 - 0.01, H); curve.lineTo(-D / 2 + 0.01, H); curve.quadraticCurveTo(-D / 2 - 0.02, H * 0.6, -D / 2, 0);
        const g = new THREE.ExtrudeGeometry(curve, { depth: W - 0.01, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 3, curveSegments: 16 });
        g.translate(0, 0, -(W - 0.01) / 2).rotateY(Math.PI / 2);
        mesh(g, C, { parent: root, at: [0, 0.006, 0] });
        mesh(roundedBox(W * 0.5, H * 0.96, D * 0.96, 0.004, 1), shell('#18191b'), { parent: root, at: [0, H / 2 + 0.006, 0] });
        mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.01, 32), shell('#18191b'), { parent: root, at: [0, 0.005, 0] });
        led(root, 'power_led', 'blue', [0, H * 0.4, D / 2 + 0.012], [0, 0, 1], 0.004);
      }
      // controller next to it
      const pad = group(null, { parent: root, at: [0.22, 0, 0.1], rot: [0, -0.4, 0] });
      buildController(pad, C, retro ? 'retro' : 'modern');
      emblemAt(root, 0.022, hybrid ? [0, 0.08, 0.0205] : retro ? [0.1, 0.0601, 0.05] : [0, 0.1, (T('slim') ? 0.25 : 0.26) / 2 + 0.016], hybrid ? null : retro ? [-Math.PI / 2, 0, 0] : null);
      if (root.getObjectByName('power_led')) onTracks.push(...lampTracks('power_led', 3));
      break;
    }
    case 'controller': {
      const C = shell(o.color ?? (T('white') ? '#f2f2f0' : T('red') ? '#b3201c' : T('blue') ? '#2a5db0' : T('retro') ? '#cfcac0' : '#1b1c1e'), 0.35);
      buildController(root, C, T('retro') ? 'retro' : T('pro') ? 'pro' : 'modern');
      break;
    }
    case 'handheld-console': {
      const retro = T('retro');
      const pc = T('pc-handheld');
      const lite = T('lite');
      const C = shell(o.color ?? (retro ? '#c9c4b8' : T('purple') ? '#6a4fa3' : pc ? '#1b1c1e' : lite ? '#3fb3c9' : '#26282c'), 0.4);
      if (retro) {
        const dev = group(null, { parent: root, at: [0, 0.012, 0], rot: [-Math.PI / 2, 0, 0] });
        mesh(roundedBox(0.09, 0.148, 0.024, 0.008, 3), C, { parent: dev });
        mesh(roundedBox(0.07, 0.06, 0.002, 0.004, 1), shell('#4a4d52'), { parent: dev, at: [0, 0.035, 0.012] });
        screen(dev, 0.045, 0.04, 'game', [0, 0.035, 0.0132], 9);
        for (const [x, y] of [[0.018, -0.02], [0.03, -0.012]]) mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 16).rotateX(Math.PI / 2), shell('#8a2246'), { parent: dev, at: [x, y, 0.013] });
        mesh(roundedBox(0.022, 0.007, 0.004, 0.002, 1), shell('#222'), { parent: dev, at: [-0.022, -0.016, 0.013] });
        mesh(roundedBox(0.007, 0.022, 0.004, 0.002, 1), shell('#222'), { parent: dev, at: [-0.022, -0.016, 0.013] });
      } else {
        const W = pc ? 0.28 : lite ? 0.208 : 0.242;
        const Hh = pc ? 0.11 : 0.102;
        const dev = group(null, { parent: root, at: [0, 0.008, 0], rot: [-Math.PI / 2, 0, 0] });
        mesh(roundedBox(W * 0.68, Hh, 0.014, 0.006, 2), black(), { parent: dev });
        screen(dev, W * 0.6, Hh * 0.82, 'game', [0, 0, 0.0075], 10);
        for (const sx of [1, -1]) {
          mesh(roundedBox(W * 0.17, Hh, pc ? 0.03 : 0.016, pc ? 0.012 : 0.007, 3), lite ? C : shell(sx > 0 ? (o.color ?? (pc ? '#1b1c1e' : '#e94f4f')) : (o.color ?? (pc ? '#1b1c1e' : '#3fc3ff'))), { parent: dev, at: [sx * W * 0.42, 0, pc ? -0.006 : 0] });
          mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.006, 16).rotateX(Math.PI / 2), shell('#111'), { parent: dev, at: [sx * W * 0.42, sx * 0.02, 0.01] });
        }
      }
      break;
    }
    case 'router': {
      const C = shell(o.color ?? (T('white') || T('mesh-node') ? '#f2f2f0' : T('gaming') ? '#141416' : '#1d1e21'), 0.45);
      if (T('mesh-node')) {
        mesh(roundedBox(0.11, 0.11, 0.11, 0.035, 4), C, { parent: root, at: [0, 0.055, 0] });
        led(root, 'power_led', 'white', [0, 0.112, 0], [0, 1, 0], 0.006);
      } else if (T('modem')) {
        mesh(roundedBox(0.05, 0.2, 0.16, 0.008, 2), C, { parent: root, at: [0, 0.1 + 0.01, 0] });
        mesh(roundedBox(0.09, 0.01, 0.14, 0.004, 1), C, { parent: root, at: [0, 0.005, 0] });
        const leds = lampGroup('power_led', 'blue');
        for (let i = 0; i < 4; i++) leds.add(root, { at: [0.0255, 0.17 - i * 0.02, 0.05], normal: [1, 0, 0], w: 0.004, h: 0.004, depth: 0.001, shape: 'round', bezel: false });
      } else {
        const gaming = T('gaming');
        const W = gaming ? 0.3 : 0.22;
        mesh(roundedBox(W, 0.04, W * 0.62, 0.01, 2), C, { parent: root, at: [0, 0.02 + 0.006, 0] });
        for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 12), rubber(), { parent: root, at: [sx * W * 0.4, 0.003, sz * W * 0.24] });
        const n = gaming ? 8 : 4;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const x = gaming ? Math.cos(a) * W * 0.5 : -W * 0.4 + i * W * 0.27;
          const z = gaming ? Math.sin(a) * W * 0.31 : -W * 0.31;
          const ant = group(null, { parent: root, at: [x, 0.03, z], rot: [gaming ? Math.sin(a) * 0.3 : -0.12, 0, gaming ? -Math.cos(a) * 0.3 : 0] });
          mesh(new THREE.CapsuleGeometry(0.008, 0.15, 4, 10), C, { parent: ant, at: [0, 0.085, 0] });
          mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.018, 12), C, { parent: ant, at: [0, 0.006, 0] });
        }
        if (gaming) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.004, 24), shell('#b3201c', 0.3), { parent: root, at: [0, 0.047, 0] });
        const leds = lampGroup('power_led', gaming ? 'red' : 'green');
        for (let i = 0; i < 5; i++) leds.add(root, { at: [-W * 0.3 + i * 0.025, 0.026, W * 0.31 + 0.0005], normal: [0, 0, 1], w: 0.004, h: 0.004, depth: 0.001, shape: 'round', bezel: false });
      }
      emblemAt(root, 0.022, T('mesh-node') ? [0, 0.04, 0.0555] : T('modem') ? [0.0256, 0.05, 0] : [0, 0.046 + 0.0002, 0], T('mesh-node') ? null : T('modem') ? [0, Math.PI / 2, 0] : [-Math.PI / 2, 0, 0]);
      onTracks.push(...lampTracks('power_led', 3, { blink: 2 }));
      break;
    }
    case '3d-printer': {
      const large = T('large');
      const s = large ? 1.4 : 1;
      const C = shell(o.color ?? '#26282c', 0.45);
      const F = metalMat('black');
      if (T('resin')) {
        mesh(roundedBox(0.22, 0.12, 0.22, 0.01, 2), C, { parent: root, at: [0, 0.06, 0] });
        mesh(roundedBox(0.2, 0.3, 0.2, 0.01, 2), new THREE.MeshPhysicalMaterial({ color: '#ff8a1a', transparent: true, opacity: 0.45, roughness: 0.05 }), { parent: root, at: [0, 0.27, 0] });
        screen(root, 0.06, 0.035, 'desktop', [0.05, 0.08, 0.1105], 11);
        break;
      }
      if (T('delta')) {
        const R = 0.17;
        mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 3), C, { parent: root, at: [0, 0.04, 0] });
        mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 3), C, { parent: root, at: [0, 0.7, 0] });
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
          mesh(roundedBox(0.03, 0.62, 0.03, 0.004, 1), F, { parent: root, at: [Math.cos(a) * R * 0.75, 0.37, Math.sin(a) * R * 0.75] });
          curveTube([[Math.cos(a) * R * 0.7, 0.5, Math.sin(a) * R * 0.7], [0, 0.3, 0]], 0.003, metalMat('chrome'), { parent: root, segments: 2 });
        }
        mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.03, 16), F, { parent: root, at: [0, 0.29, 0] });
        mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.006, 40), glassMat('#cfd8dc', 0.8), { parent: root, at: [0, 0.083, 0] });
        break;
      }
      const W = 0.44 * s;
      const H = 0.47 * s;
      const D = 0.42 * s;
      mesh(roundedBox(W, 0.07, D, 0.01, 2), C, { parent: root, at: [0, 0.035, 0] });
      if (T('enclosed')) {
        for (const [x, z, ww, dd] of [[W / 2 - 0.01, 0, 0.02, D], [-W / 2 + 0.01, 0, 0.02, D], [0, -D / 2 + 0.01, W, 0.02]]) mesh(roundedBox(ww, H, dd, 0.006, 1), C, { parent: root, at: [x, H / 2 + 0.07, z] });
        mesh(roundedBox(W, 0.03, D, 0.006, 1), C, { parent: root, at: [0, H + 0.085, 0] });
        mesh(new THREE.PlaneGeometry(W - 0.04, H - 0.02), glassMat('#cfd8dc', 0.25), { parent: root, at: [0, H / 2 + 0.07, D / 2 - 0.005] });
      } else {
        for (const sx of [1, -1]) mesh(roundedBox(0.04, H, 0.03, 0.004, 1), F, { parent: root, at: [sx * (W / 2 - 0.04), H / 2 + 0.07, -0.05] });
        mesh(roundedBox(W - 0.04, 0.04, 0.04, 0.004, 1), F, { parent: root, at: [0, H + 0.07, -0.05] });
        // spool holder on top
        mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 32).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#e94f4f', roughness: 0.5 }), { parent: root, at: [0, H + 0.19, -0.05] });
        curveTube([[0, H + 0.09, -0.05], [0, H + 0.12, -0.05]], 0.008, F, { parent: root, segments: 2 });
      }
      const gantry = group('gantry', { parent: root, at: [0, 0.07 + H * 0.4, -0.05] });
      mesh(roundedBox(T('enclosed') ? W - 0.03 : W - 0.1, 0.025, 0.025, 0.004, 1), F, { parent: gantry });
      const head = group('printhead', { parent: gantry, at: [0, -0.01, 0.03] });
      mesh(roundedBox(0.06, 0.07, 0.05, 0.008, 2), C, { parent: head });
      mesh(new THREE.ConeGeometry(0.006, 0.014, 12).rotateX(Math.PI), metalMat('brass'), { parent: head, at: [0, -0.042, 0] });
      mesh(roundedBox(W * 0.6, 0.008, D * 0.6, 0.004, 1), new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', roughness: 0.4, clearcoat: 1 }), { parent: root, at: [0, 0.074, 0.02] });
      // little printed benchy-ish block in progress
      mesh(roundedBox(0.04, 0.025, 0.06, 0.008, 2), new THREE.MeshStandardMaterial({ color: '#e94f4f', roughness: 0.5 }), { parent: root, at: [0, 0.09, 0.02] });
      screen(root, 0.08, 0.05, 'desktop', [W * 0.28, 0.035, D / 2 + 0.0005], 12);
      anims.push(clip('print', 2, [numberTrack('printhead.position[x]', 2, (t) => (pingPong(t) - 0.5) * (W - 0.2), 32)]));
      break;
    }
    case 'server-rack': {
      const half = T('half');
      const H = half ? 1.0 : 2.0;
      const W = 0.6;
      const D = 1.0;
      const frame = metalMat(T('white') ? 'white' : 'black');
      const open = T('open-frame');
      for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(roundedBox(0.04, H, 0.04, 0.004, 1), frame, { parent: root, at: [sx * (W / 2 - 0.02), H / 2, sz * (D / 2 - 0.02)] });
      for (const y of [0.02, H - 0.02]) mesh(roundedBox(W, 0.04, D, 0.006, 1), frame, { parent: root, at: [0, y, 0] });
      if (!open) for (const sx of [1, -1]) mesh(roundedBox(0.012, H - 0.08, D - 0.08, 0.004, 1), frame, { parent: root, at: [sx * (W / 2 - 0.01), H / 2, 0] });
      // front + rear mounting rails the equipment bolts to
      for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(roundedBox(0.02, H - 0.06, 0.02, 0.003, 1), frame, { parent: root, at: [sx * (W / 2 - 0.05), H / 2, sz * (D / 2 - 0.06)] });
      for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(roundedBox(0.03, 0.02, 0.03, 0.003, 1), frame, { parent: root, at: [sx * (W / 2 - 0.035), 0.05, sz * (D / 2 - 0.045)] });
      const units = Math.floor((H - 0.12) / 0.09);
      const lights = lampGroup('status_led', 'green');
      const blue = lampGroup('net_led', 'blue');
      for (let i = 0; i < units; i++) {
        if (i % 5 === 4) continue;
        const y = 0.08 + i * 0.09;
        const net = T('network') && i % 2;
        mesh(roundedBox(W - 0.1, 0.085, D - 0.12, 0.004, 1), shell(net ? '#2a2b2e' : '#1b1c1e', 0.5), { parent: root, at: [0, y, 0] });
        mesh(roundedBox(W - 0.1, 0.08, 0.006, 0.003, 1), metalMat('steel'), { parent: root, at: [0, y, D / 2 - 0.06] });
        if (net) for (let k = 0; k < 12; k++) mesh(roundedBox(0.016, 0.014, 0.004, 0.001, 1), plasticMat('#111'), { parent: root, at: [-0.2 + k * 0.032, y, D / 2 - 0.056] });
        else for (let k = 0; k < 8; k++) mesh(roundedBox(0.045, 0.06, 0.003, 0.002, 1), plasticMat('#2a2b2e'), { parent: root, at: [-0.2 + k * 0.05, y, D / 2 - 0.056] });
        lights.add(root, { at: [W / 2 - 0.08, y + 0.02, D / 2 - 0.055], normal: [0, 0, 1], w: 0.005, h: 0.005, depth: 0.001, shape: 'round', bezel: false, glowSize: 0.02 });
        blue.add(root, { at: [W / 2 - 0.08, y - 0.01, D / 2 - 0.055], normal: [0, 0, 1], w: 0.005, h: 0.005, depth: 0.001, shape: 'round', bezel: false, glowSize: 0.02 });
      }
      if (!open) mesh(new THREE.PlaneGeometry(W - 0.06, H - 0.1), glassMat('#1a2026', 0.3), { parent: root, at: [0, H / 2, D / 2 - 0.004] });
      emblemAt(root, 0.05, [0, H - 0.02, D / 2 + 0.0002]);
      onTracks.push(...lampTracks('status_led', 3), ...lampTracks('net_led', 3, { blink: 3 }));
      break;
    }
    case 'e-reader': {
      const large = T('large');
      const W = large ? 0.135 : 0.116;
      const H = large ? 0.19 : 0.163;
      const C = shell(o.color ?? (T('white') ? '#f2f2f0' : T('kids') ? '#45b36b' : '#1d1e21'), 0.6);
      const dev = group('reader', { parent: root, at: [0, 0.005, 0], rot: [-Math.PI / 2, 0, 0] });
      mesh(roundedBox(W, H, 0.008, 0.008, 2), C, { parent: dev });
      screen(dev, W - 0.02, H - 0.03, 'reader', [0, 0.004, 0.0042], 13);
      emblemAt(dev, 0.012, [0, -H / 2 + 0.008, 0.0042]);
      if (T('cover') || T('kids')) {
        mesh(roundedBox(W + 0.008, H + 0.008, 0.004, 0.009, 2), leatherMat(T('kids') ? '#e94f4f' : '#7a4a2a'), { parent: dev, at: [0, 0, -0.006] });
        const flap = group(null, { parent: dev, at: [-W / 2 - 0.004, 0, -0.006], rot: [0, 2.6, 0] });
        mesh(roundedBox(W + 0.008, H + 0.008, 0.004, 0.009, 2), leatherMat(T('kids') ? '#e94f4f' : '#7a4a2a'), { parent: flap, at: [W / 2 + 0.004, 0, 0] });
      }
      break;
    }
    case 'power-bank': {
      const C = shell(o.color ?? (T('white') ? '#f2f2f0' : T('rugged') ? '#2b2e30' : '#1d1e21'), 0.45);
      if (T('station')) {
        mesh(roundedBox(0.3, 0.32, 0.2, 0.025, 3), C, { parent: root, at: [0, 0.16 + 0.01, 0] });
        curveTube([[-0.11, 0.33, 0], [-0.11, 0.38, 0], [0.11, 0.38, 0], [0.11, 0.33, 0]], 0.012, rubber(), { parent: root });
        screen(root, 0.08, 0.05, 'desktop', [0, 0.24, 0.1005], 14);
        for (let i = 0; i < 4; i++) mesh(roundedBox(0.018, 0.012, 0.004, 0.002, 1), plasticMat('#111'), { parent: root, at: [-0.09 + i * 0.03, 0.1, 0.1002] });
        for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(roundedBox(0.04, 0.012, 0.04, 0.006, 1), rubber(), { parent: root, at: [sx * 0.11, 0.006, sz * 0.07] });
      } else {
        const slim = T('slim');
        const mag = T('magnetic');
        const W = mag ? 0.065 : slim ? 0.07 : 0.075;
        const L = mag ? 0.1 : slim ? 0.14 : 0.15;
        const Hb = mag ? 0.012 : slim ? 0.01 : T('rugged') ? 0.028 : 0.022;
        mesh(roundedBox(W, Hb, L, Math.min(0.01, Hb * 0.45), 3), T('rugged') ? rubber('#2b2e30') : C, { parent: root, at: [0, Hb / 2, 0] });
        if (mag) mesh(new THREE.TorusGeometry(0.025, 0.0015, 6, 40).rotateX(Math.PI / 2), metalMat('steel'), { parent: root, at: [0, Hb + 0.0003, 0] });
        if (T('rugged')) for (const sz of [1, -1]) mesh(roundedBox(W + 0.006, Hb + 0.004, 0.02, 0.006, 2), rubber('#e2651a'), { parent: root, at: [0, Hb / 2, sz * (L / 2 - 0.008)] });
        const leds = lampGroup('power_led', 'blue');
        for (let i = 0; i < 4; i++) leds.add(root, { at: [-0.012 + i * 0.008, Hb + 0.0003, L / 2 - 0.015], normal: [0, 1, 0], w: 0.003, h: 0.003, depth: 0.0008, shape: 'round', bezel: false });
        onTracks.push(...lampTracks('power_led', 3));
      }
      emblemAt(root, 0.016, T('station') ? [0.09, 0.27, 0.1004] : [0, (T('magnetic') ? 0.012 : T('slim') ? 0.01 : T('rugged') ? 0.028 : 0.022) + 0.0003, -0.02], T('station') ? null : [-Math.PI / 2, 0, 0]);
      break;
    }
    case 'charging-dock': {
      const C = shell(o.color ?? (T('white') ? '#f2f2f0' : '#1d1e21'), 0.4);
      const ring = lampGroup('charge_led', 'white');
      if (T('pad')) {
        mesh(lathe([[0, 0], [0.05, 0], [0.052, 0.004], [0.05, 0.009], [0, 0.01]], 48), C, { parent: root });
        mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.0015, 48), fabricMat('#3a3b3e'), { parent: root, at: [0, 0.0102, 0] });
        ring.add(root, { at: [0, 0.004, 0.051], normal: [0, 0, 1], w: 0.004, h: 0.004, depth: 0.001, shape: 'round', bezel: false });
      } else if (T('stand')) {
        mesh(roundedBox(0.09, 0.01, 0.1, 0.004, 2), C, { parent: root, at: [0, 0.005, 0] });
        const back = group(null, { parent: root, at: [0, 0.008, -0.02], rot: [-0.3, 0, 0] });
        mesh(roundedBox(0.08, 0.14, 0.012, 0.006, 2), C, { parent: back, at: [0, 0.07, 0] });
        mesh(roundedBox(0.08, 0.008, 0.02, 0.003, 1), C, { parent: root, at: [0, 0.014, 0.03] });
        ring.add(back, { at: [0, 0.03, 0.0065], normal: [0, 0, 1], w: 0.004, h: 0.004, depth: 0.001, shape: 'round', bezel: false });
      } else {
        // 3-in-1: phone pad, watch puck, earbuds pad
        mesh(roundedBox(0.24, 0.012, 0.11, 0.01, 3), C, { parent: root, at: [0, 0.006, 0] });
        for (const x of [-0.07, 0.07]) mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.002, 40), fabricMat('#3a3b3e'), { parent: root, at: [x, 0.0125, 0] });
        mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.05, 16), metalMat('steel'), { parent: root, at: [0, 0.037, -0.02] });
        mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.008, 24).rotateX(Math.PI / 2 - 0.4), C, { parent: root, at: [0, 0.064, -0.015] });
        for (const x of [-0.11, 0.11]) ring.add(root, { at: [x, 0.006, 0.0552], normal: [0, 0, 1], w: 0.003, h: 0.003, depth: 0.001, shape: 'round', bezel: false });
      }
      emblemAt(root, 0.014, T('pad') ? [0, 0.0105, 0] : T('stand') ? [0, 0.0102, 0.02] : [0, 0.0122, 0.045], [-Math.PI / 2, 0, 0]);
      onTracks.push(...lampTracks('charge_led', 3));
      break;
    }
    default:
      break;
  }
  addOn();
  if (onTracks.length) anims.push(clip('on', 1, onTracks));
  const out = finalize(root, { type: 'tech', variant, options: o, animations: anims });
  if (oneShot.length) out.userData.premade.oneShot = oneShot;
  return out;
}

/** Gamepad lying flat on the table. kind: modern | pro | retro. */
function buildController(parent, C, kind) {
  const g = group(null, { parent, at: [0, 0, 0] });
  if (kind === 'retro') {
    mesh(roundedBox(0.12, 0.016, 0.055, 0.008, 3), C, { parent: g, at: [0, 0.008, 0] });
    mesh(roundedBox(0.026, 0.004, 0.008, 0.002, 1), shell('#222'), { parent: g, at: [-0.035, 0.017, 0] });
    mesh(roundedBox(0.008, 0.004, 0.026, 0.002, 1), shell('#222'), { parent: g, at: [-0.035, 0.017, 0] });
    for (const x of [0.03, 0.045]) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.005, 16), shell('#b3201c'), { parent: g, at: [x, 0.017, 0.004] });
    return g;
  }
  const body = new THREE.Shape();
  body.moveTo(-0.06, 0.02);
  body.bezierCurveTo(-0.08, 0.03, -0.09, -0.02, -0.075, -0.045);
  body.bezierCurveTo(-0.062, -0.06, -0.045, -0.04, -0.03, -0.02);
  body.lineTo(0.03, -0.02);
  body.bezierCurveTo(0.045, -0.04, 0.062, -0.06, 0.075, -0.045);
  body.bezierCurveTo(0.09, -0.02, 0.08, 0.03, 0.06, 0.02);
  body.lineTo(-0.06, 0.02);
  const geo = new THREE.ExtrudeGeometry(body, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 4, curveSegments: 16 });
  geo.rotateX(-Math.PI / 2);
  mesh(geo, C, { parent: g, at: [0, 0.01, 0] });
  for (const [x, z] of [[-0.035, -0.002], [0.018, 0.012]]) {
    mesh(new THREE.CylinderGeometry(0.009, 0.01, 0.01, 20), shell('#111'), { parent: g, at: [x, 0.032, z] });
    mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.003, 20), rubber(), { parent: g, at: [x, 0.038, z] });
  }
  const btn = ['#3fc3ff', '#e94f4f', '#7be36b', '#ffd23f'];
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.005, 14), shell(kind === 'pro' ? '#222' : btn[i]), { parent: g, at: [0.04 + Math.cos(a) * 0.011, 0.031, -0.01 + Math.sin(a) * 0.011] }); }
  mesh(roundedBox(0.02, 0.004, 0.02, 0.003, 1), shell('#222'), { parent: g, at: [-0.018, 0.03, 0.012] });
  emblemAt(g, 0.011, [0, 0.0291, -0.006], [-Math.PI / 2, 0, 0]);
  if (kind === 'pro') for (const sx of [1, -1]) mesh(roundedBox(0.008, 0.012, 0.022, 0.003, 1), metalMat('steel'), { parent: g, at: [sx * 0.03, 0.006, 0.02] });
  return g;
}
