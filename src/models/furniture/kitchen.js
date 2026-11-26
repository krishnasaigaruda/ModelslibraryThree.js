import {
  THREE, M, mesh, group, roundedBox, curveTube, lathe, STYLE, rectLoop,
  woodMat, metalMat, plasticMat, glassMat, enamel, stoneMat, stainless, ceramic, panelFront, barPull, knob, drawerBox,
} from './common.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { brandEmblem } from '../../core/brand.js';
import { spinTrack, rotateTrack, moveTrack, numberTrack, clip } from '../../core/animation.js';

/* ============================== helpers ============================== */

const ease = (t, k = 1.2) => { const s = Math.min(1, t * k); return s * s * (3 - 2 * s); };

function rr(s, x, y, w, h, r) {
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * Hollow appliance cabinet: rounded side/top/bottom walls, back plate and a front face with
 * rectangular openings (absolute x/y centres). Returns z of the front face's inner side.
 */
function cabinet(parent, w, h, d, F, { y0 = 0, cz = 0, r = 0.015, openings = [], frontT = 0.015, wall = 0.008, inner } = {}) {
  r = Math.min(r * (STYLE.cur?.edge ?? 1), 0.06, w / 4, h / 4);
  const walls = rr(new THREE.Shape(), -w / 2, 0, w, h, r);
  walls.holes.push(rr(new THREE.Path(), -w / 2 + wall, wall, w - 2 * wall, h - 2 * wall, Math.max(0.002, r - wall)));
  mesh(new THREE.ExtrudeGeometry(walls, { depth: d - frontT, bevelEnabled: false, curveSegments: 8 }), F, { parent, at: [0, y0, cz - d / 2] });
  mesh(new THREE.BoxGeometry(w - 2 * wall + 0.002, h - 2 * wall + 0.002, 0.006), inner ?? F, { parent, at: [0, y0 + h / 2, cz - d / 2 + 0.003] });
  const front = rr(new THREE.Shape(), -w / 2, 0, w, h, r);
  for (const o of openings) front.holes.push(rr(new THREE.Path(), o.x - o.w / 2, o.y - y0 - o.h / 2, o.w, o.h, o.r ?? 0.005));
  mesh(new THREE.ExtrudeGeometry(front, { depth: frontT, bevelEnabled: false, curveSegments: 8 }), F, { parent, at: [0, y0, cz + d / 2 - frontT] });
  return cz + d / 2 - frontT;
}

/** Five-wall interior box behind an opening (cx,cy,cw,ch), front edge at zF. */
function cavity(parent, cx, cy, cw, ch, zF, depth, mat, name, t = 0.004) {
  const zc = zF - depth / 2;
  mesh(new THREE.BoxGeometry(cw, t, depth), mat, { parent, at: [cx, cy - ch / 2 + t / 2, zc], name });
  mesh(new THREE.BoxGeometry(cw, t, depth), mat, { parent, at: [cx, cy + ch / 2 - t / 2, zc] });
  for (const s of [1, -1]) mesh(new THREE.BoxGeometry(t, ch, depth), mat, { parent, at: [cx + s * (cw / 2 - t / 2), cy, zc] });
  mesh(new THREE.BoxGeometry(cw, ch, t), mat, { parent, at: [cx, cy, zF - depth + t / 2] });
  return { floor: cy - ch / 2 + t, ceil: cy + ch / 2 - t, left: cx - cw / 2 + t, right: cx + cw / 2 - t, back: zF - depth + t, zc, iw: cw - 2 * t, depth: depth - t };
}

const _up = new THREE.Vector3(0, 1, 0);
/** Many straight wire rods merged into one mesh. segs = [[a, b], ...]. */
function wire(parent, segs, r, mat, name) {
  const geos = [];
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (const [a, b] of segs) {
    A.set(...a); B.set(...b);
    const len = A.distanceTo(B);
    if (len < 1e-5) continue;
    q.setFromUnitVectors(_up, B.clone().sub(A).normalize());
    m4.compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
    geos.push(new THREE.CylinderGeometry(r, r, len, 6, 1, true).applyMatrix4(m4));
  }
  return mesh(mergeGeometries(geos), mat, { parent, name });
}

/** Rectangular wire rack (oven/fridge style) in the XZ plane at y=0 of `parent`. */
function flatRack(parent, w, dep, mat, n = 9) {
  const hw = w / 2;
  const hd = dep / 2;
  const segs = [[[-hw, 0, -hd], [hw, 0, -hd]], [[hw, 0, -hd], [hw, 0, hd]], [[hw, 0, hd], [-hw, 0, hd]], [[-hw, 0, hd], [-hw, 0, -hd]]];
  for (let i = 1; i < n; i++) { const x = -hw + (i * w) / n; segs.push([[x, 0.003, -hd], [x, 0.003, hd]]); }
  segs.push([[-hw, 0.003, 0], [hw, 0.003, 0]]);
  return wire(parent, segs, 0.0028, mat);
}

/* ---- textures ---- */
const texCache = new Map();
/** Perforated-metal alpha mask (DataTexture, so it also works in Node). */
function holeMask(repeatX, repeatY, hole = 0.36) {
  const key = `hole:${hole}`;
  let base = texCache.get(key);
  if (!base) {
    const N = 16;
    const data = new Uint8Array(N * N * 4);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot(x + 0.5 - N / 2, y + 0.5 - N / 2) / N;
      const v = d < hole ? 0 : 255;
      data.set([v, v, v, 255], (y * N + x) * 4);
    }
    base = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    base.magFilter = THREE.LinearFilter;
    base.minFilter = THREE.LinearMipmapLinearFilter;
    base.generateMipmaps = true;
    base.needsUpdate = true;
    texCache.set(key, base);
  }
  const t = base.clone();
  t.repeat.set(repeatX, repeatY);
  t.needsUpdate = true;
  return t;
}

/** Canvas texture (browser only: Node gets null and callers fall back to plain materials). */
function canvasTex(key, W, H, draw) {
  if (typeof document === 'undefined') return null;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  draw(c.getContext('2d'), W, H);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

const SEG7 = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
function seg7Width(text, H) { let w = 0; for (const ch of text) w += ch === ':' ? H * 0.36 : H * 0.69; return w; }
function drawSeg7(g, text, x, y, H, on) {
  const W = H * 0.5;
  const t = H * 0.12;
  g.save();
  g.transform(1, 0, -0.1, 1, (y + H) * 0.1, 0);
  let cx = x;
  for (const ch of text) {
    if (ch === ':') {
      g.fillStyle = on;
      for (const fy of [0.3, 0.7]) { g.beginPath(); g.arc(cx + t * 1.2, y + H * fy, t * 0.6, 0, 7); g.fill(); }
      cx += H * 0.36;
      continue;
    }
    const S = {
      a: [cx + t * 1.1, y, W - t * 2.2, t], g: [cx + t * 1.1, y + H / 2 - t / 2, W - t * 2.2, t], d: [cx + t * 1.1, y + H - t, W - t * 2.2, t],
      f: [cx, y + t * 0.9, t, H / 2 - t * 1.4], e: [cx, y + H / 2 + t * 0.5, t, H / 2 - t * 1.4],
      b: [cx + W - t, y + t * 0.9, t, H / 2 - t * 1.4], c: [cx + W - t, y + H / 2 + t * 0.5, t, H / 2 - t * 1.4],
    };
    g.globalAlpha = 0.07; g.fillStyle = on; g.shadowBlur = 0;
    for (const k of 'abcdefg') g.fillRect(...S[k]);
    g.globalAlpha = 1; g.shadowColor = on; g.shadowBlur = H * 0.25;
    for (const k of SEG7[ch] ?? '') g.fillRect(...S[k]);
    cx += H * 0.69;
  }
  g.restore();
}

/** Glowing 7-segment display material ("12:00"). Mesh it and name it 'display'. */
function displayMat(text, color = '#58ff8c', intensity = 1.2, extra) {
  const map = canvasTex(`disp:${text}:${color}:${extra ?? ''}`, 256, 96, (g, W, H) => {
    g.fillStyle = '#000000'; g.fillRect(0, 0, W, H);
    const dh = H * 0.62;
    drawSeg7(g, text, (W - seg7Width(text, dh)) / 2 - (extra ? 18 : 0), (H - dh) / 2, dh, color);
    if (extra) { g.fillStyle = color; g.font = `bold ${H * 0.16}px sans-serif`; g.textAlign = 'right'; g.fillText(extra, W - 8, H * 0.32); }
  });
  return new THREE.MeshStandardMaterial({ name: 'display', color: '#000000', emissive: map ? '#ffffff' : color, emissiveMap: map, emissiveIntensity: map ? intensity : intensity * 0.35, roughness: 0.15 });
}

/** Printed label on a transparent background. */
function labelTex(text, fg, aspect) {
  const H = 64;
  const W = Math.round(H * aspect);
  return canvasTex(`lbl:${text}:${fg}:${W}`, W, H, (g) => {
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const size = text.length <= 2 ? H * 0.62 : Math.min(H * 0.48, (W * 1.5) / text.length);
    g.font = `bold ${size}px sans-serif`;
    g.fillText(text, W / 2, H / 2 + 2);
  });
}

/** Push button with a printed label facing +Z; back face at at[2]. */
function keyButton(parent, label, at, bw, bh, { bg = '#2a2c2f', fg = '#eeeeee', depth = 0.004 } = {}) {
  mesh(roundedBox(bw, bh, depth, Math.min(bw, bh) * 0.22, 2), plasticMat(bg, 0.4), { parent, at: [at[0], at[1], at[2] + depth / 2] });
  const tex = labelTex(label, fg, bw / bh);
  if (tex) mesh(new THREE.PlaneGeometry(bw * 0.94, bh * 0.9), new THREE.MeshStandardMaterial({ name: 'label', map: tex, transparent: true, roughness: 0.4, depthWrite: false }), { parent, at: [at[0], at[1], at[2] + depth + 0.0004] });
}

/** Printed dial scale (ticks + labels in a ring) on a plane facing +Z. */
function dialScale(parent, labels, at, size, fg = '#3a3d40') {
  const tex = canvasTex(`dial:${labels.join()}:${fg}`, 256, 256, (g, W) => {
    const c = W / 2;
    g.strokeStyle = fg; g.fillStyle = fg; g.lineWidth = 3;
    g.font = `bold ${labels.length > 8 ? 17 : 20}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = labels.length;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * 1.25 + (i / (n - 1)) * Math.PI * 1.5;
      g.beginPath(); g.moveTo(c + Math.cos(a) * 66, c + Math.sin(a) * 66); g.lineTo(c + Math.cos(a) * 78, c + Math.sin(a) * 78); g.stroke();
      g.fillText(labels[i], c + Math.cos(a) * 102, c + Math.sin(a) * 100);
    }
  });
  if (tex) mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ name: 'label', map: tex, transparent: true, roughness: 0.5, depthWrite: false }), { parent, at });
}

/** Rotary dial knob facing +Z with grip ridges and a pointer; back at at[2]. */
function rotaryDial(parent, at, r, mat, name) {
  const g = group(name, { parent, at });
  mesh(lathe([[0, 0], [r, 0], [r, r * 0.25], [r * 0.9, r * 0.75], [r * 0.82, r * 0.85], [0, r * 0.88]], 32).rotateX(Math.PI / 2), mat, { parent: g });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    mesh(new THREE.BoxGeometry(r * 0.12, r * 0.12, r * 0.55), mat, { parent: g, at: [Math.cos(a) * r * 0.93, Math.sin(a) * r * 0.93, r * 0.35] });
  }
  mesh(new THREE.BoxGeometry(r * 0.14, r * 0.7, r * 0.12), plasticMat('#c22b22', 0.4), { parent: g, at: [0, r * 0.42, r * 0.88] });
  return g;
}

const linerMat = (color = '#f2f4f5', name = 'liner', o = {}) => new THREE.MeshStandardMaterial({ name, color, roughness: 0.45, ...o });

/* ============================== KITCHEN ============================== */

export const KITCHEN_VARIANTS = {
  fridge: { finish: 'stainless' },
  'french-fridge': { finish: 'stainless' },
  'mini-fridge': { finish: 'white' },
  stove: { finish: 'stainless' },
  'sink-unit': { wood: 'white' },
  counter: { wood: 'walnut' },
  microwave: { finish: 'black' },
  dishwasher: { finish: 'stainless' },
};

function finishMat(f, color) {
  if (color) return enamel(color);
  if (f === 'white') return enamel('#f3f3f1');
  if (f === 'black') return new THREE.MeshPhysicalMaterial({ name: 'paint', color: '#151617', roughness: 0.3, clearcoat: 0.8 });
  return stainless();
}

/* ------------------------------- fridges ------------------------------- */

function waterDispenser(parent, at) {
  const g = group('dispenser', { parent, at });
  const dark = plasticMat('#1d1f21', 0.3);
  const black = plasticMat('#0b0c0d', 0.6);
  mesh(roundedBox(0.2, 0.32, 0.012, 0.025, 3), dark, { parent: g });
  mesh(roundedBox(0.16, 0.2, 0.004, 0.01, 2), black, { parent: g, at: [0, -0.03, 0.007] });
  mesh(roundedBox(0.17, 0.03, 0.045, 0.008, 2), dark, { parent: g, at: [0, 0.085, 0.028] });
  mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.02, 12), metalMat('chrome'), { parent: g, at: [0, 0.06, 0.03] });
  mesh(roundedBox(0.06, 0.1, 0.008, 0.004, 2), plasticMat('#3a3c3f', 0.4), { parent: g, at: [0, 0.0, 0.014] });
  mesh(roundedBox(0.17, 0.014, 0.05, 0.005, 2), dark, { parent: g, at: [0, -0.13, 0.03] });
  for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(0.15, 0.002, 0.004), black, { parent: g, at: [0, -0.122, 0.012 + i * 0.008] });
  const tex = canvasTex('dispIcons', 256, 64, (c, W, H) => {
    c.fillStyle = '#9fd8ff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 17px sans-serif'; ['WATER', 'CUBED', 'CRUSHED'].forEach((s, i) => c.fillText(s, (W / 3) * (i + 0.5), H / 2, (W / 3) * 0.86));
    c.fillRect(W / 6 - 30, H - 10, 60, 4);
  });
  mesh(new THREE.PlaneGeometry(0.16, 0.04), new THREE.MeshStandardMaterial({ name: 'label', color: '#000', emissive: tex ? '#ffffff' : '#2a6a9a', emissiveMap: tex, emissiveIntensity: 0.9 }), { parent: g, at: [0, 0.13, 0.0065] });
  return g;
}

/** Door bin: open-top translucent tray hanging on the door liner (back at z=0, opening -z). */
function doorBin(parent, bw, at, mat, { bottles = 0 } = {}) {
  const g = group(null, { parent, at });
  const bd = 0.085;
  const bh = 0.075;
  mesh(new THREE.BoxGeometry(bw, 0.005, bd), mat, { parent: g, at: [0, -bh / 2, -bd / 2] });
  mesh(new THREE.BoxGeometry(bw, bh, 0.005), mat, { parent: g, at: [0, 0, -bd] });
  for (const s of [1, -1]) mesh(new THREE.BoxGeometry(0.005, bh, bd), mat, { parent: g, at: [s * bw / 2, 0, -bd / 2] });
  mesh(new THREE.BoxGeometry(bw, 0.012, 0.008), plasticMat('#dfe3e6', 0.4), { parent: g, at: [0, bh / 2 - 0.006, -bd] });
  const cols = ['#d94b3a', '#f2f2ee', '#4a8a3a', '#e8b32c'];
  for (let i = 0; i < bottles; i++) {
    const r = 0.028;
    const H = 0.2;
    mesh(lathe([[0, 0], [r, 0], [r, H * 0.65], [r * 0.4, H * 0.85], [r * 0.35, H], [0, H]], 16), plasticMat(cols[i % cols.length], 0.3), { parent: g, at: [-bw / 2 + 0.05 + i * 0.07, -bh / 2 + 0.0025, -bd / 2] });
  }
  return g;
}

/** Shelves, crisper drawers and light inside one fridge compartment. */
function fridgeInterior(parent, c, { crisper = false, freezer = false, shelves = 3 }) {
  const glassShelf = glassMat('#dceef2', 0.45);
  const trim = plasticMat('#e4e8ea', 0.35);
  const sd = c.depth - 0.15;
  const sz = c.back + sd / 2;
  const top = c.ceil - 0.02;
  const bottom = crisper ? c.floor + 0.2 : c.floor;
  if (crisper) {
    const frost = new THREE.MeshPhysicalMaterial({ name: 'crisper', color: '#e9f3f4', roughness: 0.35, transparent: true, opacity: 0.55, depthWrite: false });
    const cw = c.iw / 2 - 0.004;
    for (const s of [-1, 1]) {
      const g = group(null, { parent, at: [(c.left + c.right) / 2 + s * (cw / 2 + 0.002), c.floor, sz] });
      mesh(roundedBox(cw, 0.17, sd, 0.008, 2), frost, { parent: g, at: [0, 0.085, 0] });
      mesh(roundedBox(cw - 0.03, 0.025, 0.012, 0.005), trim, { parent: g, at: [0, 0.14, sd / 2 + 0.004] });
      for (let k = 0; k < 3; k++) mesh(new THREE.SphereGeometry(0.035, 12, 8), plasticMat(['#6db33f', '#e04a2c', '#f0a83a'][(k + (s > 0 ? 1 : 0)) % 3], 0.5), { parent: g, at: [-cw / 4 + k * cw / 4, 0.04, -sd / 4 + k * 0.05] });
    }
    mesh(new THREE.BoxGeometry(c.iw, 0.006, sd), glassShelf, { parent, at: [(c.left + c.right) / 2, c.floor + 0.177, sz] });
  }
  const span = top - bottom;
  const n = freezer ? 1 : Math.max(1, Math.min(shelves, Math.floor(span / 0.28)));
  for (let k = 1; k <= n; k++) {
    const y = bottom + (k * span) / (n + 1);
    if (freezer) { const rk = group(null, { parent, at: [(c.left + c.right) / 2, y, sz] }); flatRack(rk, c.iw - 0.006, sd, metalMat('white'), 12); }
    else {
      mesh(new THREE.BoxGeometry(c.iw, 0.006, sd), glassShelf, { parent, at: [(c.left + c.right) / 2, y, sz] });
      mesh(new THREE.BoxGeometry(c.iw, 0.016, 0.01), trim, { parent, at: [(c.left + c.right) / 2, y, sz + sd / 2] });
      if (k === 1) {
        // a carton and a jar
        mesh(roundedBox(0.07, 0.19, 0.07, 0.006, 1), plasticMat('#f4f4ef', 0.6), { parent, at: [c.left + 0.08, y + 0.003 + 0.095, sz - 0.05] });
        mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 18), glassMat('#e8b04a', 0.85), { parent, at: [c.left + 0.18, y + 0.053, sz - 0.08] });
      }
    }
  }
  if (freezer) mesh(roundedBox(Math.min(0.26, c.iw * 0.45), 0.07, 0.2, 0.01), plasticMat('#f1f3f4', 0.4), { parent, at: [c.left + Math.min(0.13, c.iw * 0.225), c.ceil - 0.035, c.back + 0.1] });
  mesh(roundedBox(c.iw * 0.6, 0.008, 0.02, 0.003), M.emissive('#eef7ff', 0.8), { parent, at: [(c.left + c.right) / 2, c.ceil - 0.004, c.back + c.depth - 0.06] });
}

function fridgeBody(root, w, h, d, F, { doors, dispenser }) {
  const y0 = 0.02;
  const bodyH = h - 0.02;
  const bd = d - 0.05;
  const cz = -0.025;
  const liner = linerMat('#f3f5f6');
  const comps = doors.filter((dd) => dd.cav !== null).map((dd) => ({ x: dd.cav?.x ?? dd.x, y: dd.y, w: dd.cav?.w ?? dd.dw - 0.07, h: dd.dh - 0.07, dd }));
  const zF = cabinet(root, w, bodyH, bd, F, { y0, cz, r: 0.02, openings: comps, inner: liner });
  for (const c of comps) {
    const cv = cavity(root, c.x, c.y, c.w, c.h, zF, bd - 0.015 - 0.04, liner);
    if (!c.dd.drawer) fridgeInterior(root, cv, { crisper: c.dd.crisper, freezer: c.dd.name.includes('freezer'), shelves: c.dd.mini ? 2 : 3 });
  }
  // toe grille
  mesh(roundedBox(w - 0.06, 0.04, 0.01, 0.004), plasticMat('#1a1a1a'), { parent: root, at: [0, 0.045, d / 2 - 0.048] });
  for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(w - 0.1, 0.004, 0.004), plasticMat('#050505'), { parent: root, at: [0, 0.033 + i * 0.008, d / 2 - 0.042] });
  for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.02, 12), plasticMat('#222'), { parent: root, at: [sx * (w / 2 - 0.05), 0.01, cz + sz * (bd / 2 - 0.06)] });
  const binMat = new THREE.MeshPhysicalMaterial({ name: 'bin', color: '#eaf4f6', roughness: 0.15, transparent: true, opacity: 0.5, depthWrite: false });
  const tracks = [];
  for (const dd of doors) {
    const { name, x, y, dw, dh, hingeRight, handle = 'v', drawer } = dd;
    const g = group(name, { parent: root, at: [drawer ? x : hingeRight ? x + dw / 2 : x - dw / 2, y, d / 2 - 0.025] });
    const front = group(null, { parent: g, at: [drawer ? 0 : hingeRight ? -dw / 2 : dw / 2, 0, 0.0] });
    mesh(roundedBox(dw - 0.006, dh - 0.006, 0.05, 0.015, 3), F, { parent: front });
    // inner door liner
    mesh(roundedBox(dw - 0.09, dh - 0.09, 0.012, 0.01, 2), liner, { parent: front, at: [0, 0, -0.031] });
    if (drawer) {
      // freezer basket travels with the drawer front
      const bw = dw - 0.12;
      const bdp = bd - 0.15;
      const bh = dh - 0.14;
      const b = group(null, { parent: front, at: [0, -0.01, -0.037] });
      mesh(new THREE.BoxGeometry(bw, 0.006, bdp), liner, { parent: b, at: [0, -bh / 2, -bdp / 2] });
      for (const s of [1, -1]) mesh(new THREE.BoxGeometry(0.006, bh, bdp), liner, { parent: b, at: [s * bw / 2, 0, -bdp / 2] });
      mesh(new THREE.BoxGeometry(bw, bh, 0.006), liner, { parent: b, at: [0, 0, -bdp] });
      for (let k = 0; k < 3; k++) mesh(roundedBox(0.16, 0.08, 0.2, 0.01), plasticMat(['#cfe6f2', '#e9d7c0', '#d8e8cf'][k], 0.6), { parent: b, at: [-bw / 3 + (k * bw) / 3, -bh / 2 + 0.043, -0.15 - (k % 2) * 0.12] });
    } else {
      const nb = Math.max(1, Math.floor((dh - 0.12) / 0.3));
      for (let k = 0; k < nb; k++) doorBin(front, dw - 0.115, [0, -dh / 2 + 0.12 + (k * (dh - 0.24)) / Math.max(1, nb - 1 || 1), -0.037], binMat, { bottles: k === 0 && dh > 0.6 ? 3 : 0 });
    }
    const pull = barPull(handle === 'h' ? Math.min(0.5, dw * 0.6) : Math.min(0.6, dh * 0.6), metalMat('steel'), { standoff: 0.04, r: 0.009 });
    if (handle === 'v') { pull.rotation.z = Math.PI / 2; pull.position.set(hingeRight ? -dw / 2 + 0.05 : dw / 2 - 0.05, 0, 0.025); }
    else pull.position.set(0, dh / 2 - 0.07, 0.025);
    front.add(pull);
    if (dispenser === name) waterDispenser(front, [hingeRight ? 0.04 : -0.04, dh / 2 - 0.32, 0.026]);
    if (name === 'door_main' || name === 'drawer_freezer') {
      const e = brandEmblem(0.05, { name: `${name}_emblem` });
      e.position.set(drawer ? 0 : (hingeRight ? 0.05 : -0.05), drawer ? dh / 2 - 0.15 : dh / 2 - 0.1, 0.027);
      if (dispenser === name) e.position.y = dh / 2 - 0.08;
      front.add(e);
    }
    if (drawer) tracks.push(moveTrack(g, 1.2, (t) => [0, 0, ease(t) * 0.42]));
    else tracks.push(rotateTrack(g, 'y', 1.2, (t) => (hingeRight ? 1 : -1) * ease(t) * 1.8));
  }
  return tracks;
}

/** Open wire basket (dishwasher rack / cutlery basket) with its bottom at y=0. */
function basket(parent, name, w, dep, hgt, at, mat, { wheels = false, tines } = {}) {
  const g = group(name, { parent, at });
  const hw = w / 2;
  const hd = dep / 2;
  const segs = [];
  for (const y of [0, hgt]) segs.push([[-hw, y, -hd], [hw, y, -hd]], [[hw, y, -hd], [hw, y, hd]], [[hw, y, hd], [-hw, y, hd]], [[-hw, y, hd], [-hw, y, -hd]]);
  const nx = Math.max(2, Math.round(w / 0.04));
  const nz = Math.max(2, Math.round(dep / 0.04));
  for (let i = 1; i < nx; i++) { const x = -hw + (i * w) / nx; segs.push([[x, 0, -hd], [x, hgt, -hd]], [[x, 0, hd], [x, hgt, hd]], [[x, 0, -hd], [x, 0, hd]]); }
  for (let i = 1; i < nz; i++) { const z = -hd + (i * dep) / nz; segs.push([[-hw, 0, z], [-hw, hgt, z]], [[hw, 0, z], [hw, hgt, z]], [[-hw, 0, z], [hw, 0, z]]); }
  if (tines) for (const [x, z, th] of tines) segs.push([[x, 0, z], [x, th, z]]);
  wire(g, segs, 0.0024, mat);
  if (wheels) {
    const wg = new THREE.CylinderGeometry(0.012, 0.012, 0.01, 14).rotateZ(Math.PI / 2);
    for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(wg, plasticMat('#5d646b', 0.5), { parent: g, at: [sx * (hw + 0.006), 0, sz * (hd - 0.04)] });
  }
  return g;
}

export function createKitchen(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(KITCHEN_VARIANTS, o.variant, 'kitchen');
  const v = KITCHEN_VARIANTS[variant];
  const root = group(`kitchen-${variant}`);
  const F = finishMat(o.finish ?? v.finish, o.color);
  const animations = [];
  const oneShot = [];

  if (variant === 'fridge' || variant === 'mini-fridge') {
    const mini = variant === 'mini-fridge';
    const w = mini ? 0.5 : 0.72;
    const h = mini ? 0.85 : 1.8;
    const d = mini ? 0.55 : 0.72;
    const doors = mini
      ? [{ name: 'door_main', x: 0, y: 0.02 + (h - 0.04) / 2, dw: w, dh: h - 0.04, hingeRight: true, mini: true }]
      : [
          { name: 'door_freezer', x: 0, y: h - 0.26, dw: w, dh: 0.48, hingeRight: true },
          { name: 'door_main', x: 0, y: 0.06 + (h - 0.6) / 2, dw: w, dh: h - 0.62, hingeRight: true, crisper: true },
        ];
    animations.push(clip('doorOpen', 1.2, fridgeBody(root, w, h, d, F, { doors, dispenser: mini ? null : 'door_freezer' })));
    oneShot.push('doorOpen');
  } else if (variant === 'french-fridge') {
    const w = 0.91;
    const h = 1.78;
    const d = 0.75;
    const doors = [
      { name: 'door_L', x: -w / 4, y: 0.62 + (h - 0.64) / 2, dw: w / 2, dh: h - 0.66, hingeRight: false, cav: { x: 0, w: w - 0.07 }, crisper: true },
      { name: 'door_R', x: w / 4, y: 0.62 + (h - 0.64) / 2, dw: w / 2, dh: h - 0.66, hingeRight: true, cav: null },
      { name: 'drawer_freezer', x: 0, y: 0.33, dw: w, dh: 0.56, drawer: true, handle: 'h' },
    ];
    animations.push(clip('doorOpen', 1.2, fridgeBody(root, w, h, d, F, { doors, dispenser: 'door_L' })));
    oneShot.push('doorOpen');
  } else if (variant === 'stove') {
    const w = 0.76;
    const h = 0.92;
    const d = 0.66;
    const oc = { x: 0, y: 0.39, w: w - 0.14, h: 0.46 };
    const ovenLiner = linerMat('#34373b', 'ovenliner', { emissive: '#ff7a2a', emissiveIntensity: 0, roughness: 0.3 });
    const zF = cabinet(root, w, h - 0.045, d, F, { y0: 0.02, r: 0.012, openings: [oc] });
    for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.02, 12), plasticMat('#151515'), { parent: root, at: [sx * (w / 2 - 0.05), 0.01, sz * (d / 2 - 0.06)] });
    const top = new THREE.MeshPhysicalMaterial({ name: 'cooktop', color: '#101112', roughness: 0.15, clearcoat: 1 });
    mesh(roundedBox(w, 0.025, d, 0.008), top, { parent: root, at: [0, h - 0.0125, 0] });
    mesh(roundedBox(w, 0.16, 0.05, 0.012), F, { parent: root, at: [0, h + 0.08, -d / 2 + 0.025] });
    { const e = brandEmblem(0.06, { name: 'emblem' }); e.position.set(0, h + 0.09, -d / 2 + 0.052); root.add(e); }
    const iron = new THREE.MeshStandardMaterial({ name: 'iron', color: '#202020', roughness: 0.7, metalness: 0.4 });
    for (const [x, z, r] of [[-0.18, 0.13, 0.085], [0.18, 0.13, 0.07], [-0.18, -0.15, 0.07], [0.18, -0.15, 0.085]]) {
      mesh(lathe([[0, 0], [r * 0.55, 0], [r * 0.6, 0.012], [r * 0.4, 0.022], [0, 0.024]], 24), metalMat('black'), { parent: root, at: [x, h, z] });
      mesh(new THREE.TorusGeometry(r, 0.006, 6, 32), iron, { parent: root, at: [x, h + 0.03, z], rot: [Math.PI / 2, 0, 0] });
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        curveTube([[x + Math.cos(a) * r * 0.45, h + 0.03, z + Math.sin(a) * r * 0.45], [x + Math.cos(a) * r * 1.3, h + 0.03, z + Math.sin(a) * r * 1.3], [x + Math.cos(a) * r * 1.3, h + 0.012, z + Math.sin(a) * r * 1.3]], 0.005, iron, { parent: root, segments: 6, radialSegments: 6 });
      }
    }
    // control strip: four burner knobs + oven clock
    for (const x of [-0.28, -0.14, 0.14, 0.28]) {
      const k = knob(plasticMat('#1a1a1a', 0.4), 0.018);
      k.position.set(x, h - 0.08, d / 2 + 0.001);
      root.add(k);
    }
    mesh(roundedBox(0.11, 0.045, 0.004, 0.006), plasticMat('#050505', 0.15), { parent: root, at: [0, h - 0.08, d / 2 + 0.001] });
    mesh(new THREE.PlaneGeometry(0.096, 0.034), displayMat('12:00', '#4fd6ff', 1.1), { parent: root, at: [0, h - 0.08, d / 2 + 0.0034], name: 'display' });
    // oven cavity: runners, two chrome racks, broil element, fan cover, lamp
    const cv = cavity(root, oc.x, oc.y, oc.w, oc.h, zF, d - 0.015 - 0.06, ovenLiner, 'ovenCavity');
    const chrome = metalMat('chrome');
    for (let k = 1; k <= 3; k++) for (const s of [1, -1]) mesh(new THREE.BoxGeometry(0.008, 0.006, cv.depth - 0.06), ovenLiner, { parent: root, at: [s * (cv.iw / 2 - 0.004), cv.floor + k * 0.11, cv.zc + 0.02] });
    for (const k of [1, 2]) {
      const rk = group(`rack${k}`, { parent: root, at: [0, cv.floor + k * 0.11 + 0.003 + 0.0028, cv.zc + 0.02] });
      flatRack(rk, cv.iw - 0.016, cv.depth - 0.08, chrome, 14);
    }
    {
      const y = cv.ceil - 0.012;
      const pts = [];
      const xw = cv.iw / 2 - 0.05;
      const z0 = cv.back + 0.05;
      const z1 = zF - 0.06;
      for (let i = 0; i <= 4; i++) { const x = -xw + (i * 2 * xw) / 4; pts.push(...(i % 2 ? [[x, y, z1], [x, y, z0]] : [[x, y, z0], [x, y, z1]])); }
      curveTube(pts, 0.005, new THREE.MeshStandardMaterial({ name: 'element', color: '#3a3a3a', roughness: 0.5, metalness: 0.5, emissive: '#ff4a12', emissiveIntensity: 0 }), { parent: root, segments: 80, radialSegments: 8, name: 'element' });
    }
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32).rotateX(Math.PI / 2), metalMat('steel'), { parent: root, at: [0, cv.floor + 0.2, cv.back + 0.005] });
    for (const r of [0.03, 0.055, 0.08]) mesh(new THREE.TorusGeometry(r, 0.003, 6, 32), metalMat('black'), { parent: root, at: [0, cv.floor + 0.2, cv.back + 0.011] });
    mesh(new THREE.BoxGeometry(0.04, 0.04, 0.004), new THREE.MeshStandardMaterial({ name: 'lamp', color: '#fff3d6', emissive: '#ffd28a', emissiveIntensity: 0 }), { parent: root, at: [cv.left + 0.05, cv.ceil - 0.05, cv.back + 0.002], name: 'ovenLamp' });
    // storage drawer under the door
    mesh(roundedBox(w - 0.02, 0.055, 0.02, 0.008), F, { parent: root, at: [0, 0.057, d / 2 + 0.01] });
    mesh(roundedBox(w - 0.2, 0.012, 0.004, 0.003), plasticMat('#111', 0.5), { parent: root, at: [0, 0.07, d / 2 + 0.0205] });
    // door: frame with a big double-glazed window
    const door = group('ovenDoor', { parent: root, at: [0, 0.09, d / 2] });
    const dw = w - 0.02;
    const ds = rr(new THREE.Shape(), -dw / 2, 0, dw, 0.6, 0.012);
    ds.holes.push(rr(new THREE.Path(), -(w - 0.2) / 2, 0.14, w - 0.2, 0.3, 0.012));
    mesh(new THREE.ExtrudeGeometry(ds, { depth: 0.04, bevelEnabled: false, curveSegments: 6 }), F, { parent: door });
    mesh(new THREE.PlaneGeometry(w - 0.196, 0.304), new THREE.MeshPhysicalMaterial({ name: 'glass', color: '#3a3e42', roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false }), { parent: door, at: [0, 0.29, 0.006] });
    mesh(new THREE.PlaneGeometry(w - 0.196, 0.304), new THREE.MeshPhysicalMaterial({ name: 'glass', color: '#14171a', roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.4, depthWrite: false }), { parent: door, at: [0, 0.29, 0.037] });
    const h2 = barPull(w - 0.16, metalMat('steel'), { standoff: 0.04, r: 0.01 });
    h2.position.set(0, 0.54, 0.04);
    door.add(h2);
    animations.push(clip('ovenOpen', 1, [rotateTrack(door, 'x', 1, (t) => ease(t) * 1.45), numberTrack('ovenLamp.material.emissiveIntensity', 1, (t) => (t > 0.05 ? 2.5 : 0), 12)]));
    animations.push(clip('ovenOn', 2, [
      numberTrack('element.material.emissiveIntensity', 2, (t) => 1.6 + 0.4 * Math.sin(t * Math.PI * 2), 16),
      numberTrack('ovenLamp.material.emissiveIntensity', 2, () => 2.5, 2),
      numberTrack('ovenCavity.material.emissiveIntensity', 2, (t) => 0.18 + 0.05 * Math.sin(t * Math.PI * 2), 16),
    ]));
    oneShot.push('ovenOpen');
  } else if (variant === 'sink-unit' || variant === 'counter') {
    const W = woodMat(o.wood ?? v.wood);
    const w = variant === 'sink-unit' ? 1.0 : 0.8;
    const h = 0.9;
    const d = 0.6;
    const plinth = 0.1;
    mesh(roundedBox(w - 0.04, plinth, d - 0.08, 0.006), plasticMat('#1a1a1a'), { parent: root, at: [0, plinth / 2, -0.03] });
    mesh(roundedBox(w, h - plinth - 0.04, d - 0.03, 0.008), W, { parent: root, at: [0, plinth + (h - plinth - 0.04) / 2, -0.015] });
    const top = stoneMat(o.stone ?? '#eeebe6', '#8c867f');
    const tracks = [];
    if (variant === 'sink-unit') {
      // countertop as a frame around the sink cut-out (no faces through the basin)
      const bw = 0.62;
      const bd = 0.4;
      const tz = 0.02;
      mesh(roundedBox(w + 0.02, 0.035, (d + 0.03 - bd) / 2 + 0.02, 0.006), top, { parent: root, at: [0, h - 0.0175, tz + bd / 2 + (d + 0.03 - bd) / 4 - 0.01 - 0.02] });
      mesh(roundedBox(w + 0.02, 0.035, (d + 0.03 - bd) / 2 - 0.0, 0.006), top, { parent: root, at: [0, h - 0.0175, tz - bd / 2 - (d + 0.03 - bd) / 4 + 0.005] });
      for (const s of [1, -1]) mesh(roundedBox((w + 0.02 - bw) / 2, 0.035, bd + 0.01, 0.004), top, { parent: root, at: [s * (bw / 2 + (w + 0.02 - bw) / 4), h - 0.0175, tz] });
      const st = stainless();
      st.side = THREE.DoubleSide;
      mesh(roundedBox(bw - 0.02, 0.008, bd - 0.02, 0.003), st, { parent: root, at: [0, h - 0.2, tz] });
      for (const s of [1, -1]) {
        mesh(roundedBox(0.008, 0.19, bd - 0.02, 0.003), st, { parent: root, at: [s * (bw / 2 - 0.014), h - 0.105, tz] });
        mesh(roundedBox(bw - 0.02, 0.19, 0.008, 0.003), st, { parent: root, at: [0, h - 0.105, tz + s * (bd / 2 - 0.014)] });
      }
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 24), metalMat('steel'), { parent: root, at: [0, h - 0.195, tz] });
      // faucet
      const fz = -d / 2 + 0.06;
      mesh(lathe([[0, 0], [0.03, 0], [0.03, 0.01], [0.02, 0.03], [0, 0.03]], 24), metalMat('chrome'), { parent: root, at: [0, h, fz] });
      curveTube([[0, h, fz], [0, h + 0.3, fz], [0, h + 0.38, fz + 0.08], [0, h + 0.3, fz + 0.2], [0, h + 0.22, fz + 0.2]], 0.013, metalMat('chrome'), { parent: root, segments: 40 });
      curveTube([[0.008, h + 0.06, fz], [0.05, h + 0.075, fz + 0.01], [0.11, h + 0.1, fz + 0.03]], 0.006, metalMat('chrome'), { parent: root });
      for (const s of [1, -1]) {
        const door = group(`door_${s > 0 ? 'R' : 'L'}`, { parent: root, at: [s * (w / 2 - 0.01), plinth + (h - plinth - 0.06) / 2, d / 2 - 0.02] });
        const p = panelFront(w / 2 - 0.02, h - plinth - 0.08, 0.02, W);
        p.position.x = -s * (w / 4 - 0.005);
        door.add(p);
        const k = barPull(0.12, metalMat('black'));
        k.rotation.z = Math.PI / 2;
        k.position.set(-s * (w / 2 - 0.06), (h - plinth) / 2 - 0.12, 0.012);
        door.add(k);
        tracks.push(rotateTrack(door, 'y', 1, (t) => s * Math.min(1, t * 1.25) * 1.6));
      }
      animations.push(clip('doorsOpen', 1, tracks));
      oneShot.push('doorsOpen');
    } else {
      mesh(roundedBox(w + 0.02, 0.035, d + 0.03, 0.006), top, { parent: root, at: [0, h - 0.0175, 0] });
      const n = 3;
      const dh = (h - plinth - 0.06) / n;
      for (let i = 0; i < n; i++) {
        const dr = group(`drawer${i}`, { parent: root, at: [0, plinth + 0.01 + dh * (i + 0.5), d / 2 - 0.02] });
        dr.add(panelFront(w - 0.03, dh - 0.01, 0.02, W));
        dr.add(drawerBox(w - 0.08, dh - 0.03, d - 0.08, W));
        const k = barPull(0.2, metalMat('black'));
        k.position.z = 0.012;
        dr.add(k);
        tracks.push(moveTrack(dr, 1, (t) => [0, 0, Math.min(1, t * 1.25) * 0.4]));
      }
      animations.push(clip('drawersOpen', 1, tracks));
      oneShot.push('drawersOpen');
    }
  } else if (variant === 'microwave') {
    const w = 0.52;
    const h = 0.3;
    const d = 0.4;
    const y0 = 0.012;
    const pw = 0.13;
    const dt = 0.026;
    const DT = dt + 0.006; // door / panel thickness incl. bevel
    const retro = o.trim === 'retro';
    const cw = 0.33;
    const ch = 0.21;
    const cx = -w / 2 + 0.035 + cw / 2;
    const cy = y0 + h / 2;
    const zF = cabinet(root, w, h, d, F, { y0, r: 0.02, openings: [{ x: cx, y: cy, w: cw, h: ch }] });
    for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(new THREE.CylinderGeometry(0.016, 0.018, y0, 14), plasticMat('#111', 0.8), { parent: root, at: [sx * (w / 2 - 0.05), y0 / 2, sz * (d / 2 - 0.05)] });
    // side vent slots
    const slot = plasticMat('#0a0a0a', 0.8);
    for (const s of [1, -1]) for (let i = 0; i < 8; i++) mesh(new THREE.BoxGeometry(0.002, 0.005, 0.11), slot, { parent: root, at: [s * (w / 2 - 0.0005), y0 + 0.08 + i * 0.019, -0.08] });
    for (let i = 0; i < 10; i++) mesh(new THREE.BoxGeometry(0.005, 0.002, 0.09), slot, { parent: root, at: [-0.12 + i * 0.016, y0 + h - 0.0005, -0.1] });
    // cavity: light enamel, mica waveguide cover, lamp
    const lin = linerMat('#ecebe6', 'liner', { emissive: '#ffc864', emissiveIntensity: 0 });
    const cv = cavity(root, cx, cy, cw, ch, zF, d - 0.015 - 0.05, lin, 'cavity');
    mesh(new THREE.BoxGeometry(0.002, 0.07, 0.08), plasticMat('#c9b48a', 0.7), { parent: root, at: [cv.right - 0.001, cy + 0.03, cv.zc + 0.03] });
    mesh(new THREE.BoxGeometry(0.002, 0.03, 0.04), new THREE.MeshStandardMaterial({ name: 'lamp', color: '#fff4d8', emissive: '#ffd27a', emissiveIntensity: 0 }), { parent: root, at: [cv.right - 0.001, cy + 0.065, cv.back + 0.05], name: 'cavityLamp' });
    // turntable: coupler, roller ring with three wheels, glass plate
    const plate = group('turntable', { parent: root, at: [cx, cv.floor, cv.zc] });
    const roller = plasticMat('#d8d6d0', 0.5);
    mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.012, 6), roller, { parent: plate, at: [0, 0.006, 0] });
    mesh(new THREE.TorusGeometry(0.075, 0.004, 6, 40), roller, { parent: plate, at: [0, 0.008, 0], rot: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const spoke = mesh(new THREE.BoxGeometry(0.075, 0.004, 0.006), roller, { parent: plate, at: [Math.cos(a) * 0.0375, 0.008, Math.sin(a) * 0.0375] });
      spoke.rotation.y = -a;
      const wh = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 12).rotateZ(Math.PI / 2), roller, { parent: plate, at: [Math.cos(a) * 0.075, 0.008, Math.sin(a) * 0.075] });
      wh.rotation.y = -a;
    }
    mesh(lathe([[0, 0], [0.125, 0], [0.138, 0.012], [0.142, 0.018], [0.136, 0.018], [0.122, 0.004], [0, 0.004]], 48), glassMat('#e6f1ec', 0.55), { parent: plate, at: [0, 0.016, 0] });
    // door: rounded frame, perforated screen behind glass, recessed handle bar
    const dw = w - pw;
    const dh = h - 0.008;
    const door = group('door', { parent: root, at: [-w / 2, cy, d / 2] });
    const fs = rr(new THREE.Shape(), 0, -dh / 2, dw, dh, Math.min(0.012 * (STYLE.cur?.edge ?? 1), 0.04));
    const wx0 = 0.035;
    const ww = dw - 0.11;
    const wh = dh - 0.08;
    fs.holes.push(rr(new THREE.Path(), wx0, -wh / 2, ww, wh, 0.008));
    mesh(new THREE.ExtrudeGeometry(fs, { depth: dt, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 8 }), F, { parent: door, at: [0, 0, 0.003] });
    mesh(new THREE.PlaneGeometry(ww + 0.006, wh + 0.006), new THREE.MeshStandardMaterial({ name: 'screen', color: '#161718', metalness: 0.5, roughness: 0.5, alphaMap: holeMask((ww + 0.006) / 0.005, (wh + 0.006) / 0.005), transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false }), { parent: door, at: [wx0 + ww / 2, 0, 0.008] });
    mesh(new THREE.PlaneGeometry(ww + 0.006, wh + 0.006), glassMat('#2c3236', 0.22), { parent: door, at: [wx0 + ww / 2, 0, DT - 0.004] });
    mesh(roundedBox(0.03, 0.22, 0.004, 0.008), plasticMat('#0d0d0e', 0.6), { parent: door, at: [dw - 0.036, 0, DT - 0.001] });
    const hb = barPull(0.2, metalMat(retro ? 'chrome' : 'steel'), { standoff: 0.022, r: 0.006 });
    hb.rotation.z = Math.PI / 2;
    hb.position.set(dw - 0.036, 0, DT + 0.001);
    door.add(hb);
    // control panel
    const px = w / 2 - pw / 2;
    const pz = d / 2 + DT;
    const yT = cy + dh / 2 - 0.004;
    mesh(roundedBox(pw - 0.004, dh, DT, 0.008, 2), plasticMat(retro ? '#ece6d4' : '#141517', 0.28), { parent: root, at: [px, cy, d / 2 + DT / 2] });
    mesh(roundedBox(0.108, 0.042, 0.003, 0.004), plasticMat('#020202', 0.1), { parent: root, at: [px, yT - 0.032, pz + 0.0015] });
    mesh(new THREE.PlaneGeometry(0.098, 0.034), displayMat('12:00', retro ? '#ffb347' : '#58ff8c', 1.2), { parent: root, at: [px, yT - 0.032, pz + 0.0032], name: 'display' });
    if (retro) {
      const fg = '#3a3d40';
      dialScale(root, ['0', '1', '2', '3', '5', '10', '15', '20', '30'], [px, yT - 0.1, pz + 0.0005], 0.1, fg);
      rotaryDial(root, [px, yT - 0.1, pz], 0.022, metalMat('chrome'), 'dialTime');
      dialScale(root, ['LOW', 'DEF', 'MED', 'HIGH'], [px, yT - 0.175, pz + 0.0005], 0.08, fg);
      rotaryDial(root, [px, yT - 0.175, pz], 0.018, metalMat('chrome'), 'dialPower');
      keyButton(root, 'STOP', [px - 0.027, yT - 0.228, pz], 0.048, 0.02, { bg: '#c23b3b', fg: '#ffffff' });
      keyButton(root, 'START', [px + 0.027, yT - 0.228, pz], 0.048, 0.02, { bg: '#3d7a46', fg: '#ffffff' });
    } else {
      const rows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['Stop', '0', '+30s']];
      rows.forEach((row, r) => row.forEach((lb, c) => keyButton(root, lb, [px + (c - 1) * 0.036, yT - 0.075 - r * 0.025, pz], 0.031, 0.019, {
        fg: lb === 'Stop' ? '#ff7b6b' : lb === '+30s' ? '#9fd0ff' : '#eeeeee',
      })));
      keyButton(root, 'START', [px, yT - 0.18, pz], 0.102, 0.024, { bg: '#1e3a24', fg: '#7dff9a' });
      keyButton(root, 'DOOR OPEN', [px, yT - 0.218, pz], 0.102, 0.026, { bg: '#3a3c40', fg: '#ffffff' });
    }
    { const e = brandEmblem(0.026, { name: 'emblem' }); e.position.set(px, y0 + 0.028, pz + 0.002); root.add(e); }
    animations.push(clip('doorOpen', 1.2, [
      rotateTrack(door, 'y', 1.2, (t) => -ease(t) * 1.75),
      numberTrack('cavityLamp.material.emissiveIntensity', 1.2, (t) => (t > 0.08 ? 3 : 0), 12),
    ]));
    animations.push(clip('on', 1, [
      numberTrack('display.material.emissiveIntensity', 1, () => 2.6, 2),
      numberTrack('cavityLamp.material.emissiveIntensity', 1, () => 3, 2),
    ]));
    animations.push(clip('cook', 8, [
      spinTrack(plate, 'y', 8, 1),
      numberTrack('cavityLamp.material.emissiveIntensity', 8, () => 3.5, 2),
      numberTrack('cavity.material.emissiveIntensity', 8, () => 0.45, 2),
      numberTrack('display.material.emissiveIntensity', 8, (t) => 1.9 + 1.0 * Math.sin(t * Math.PI * 2 * 8), 96),
    ]));
    oneShot.push('doorOpen');
  } else {
    // dishwasher
    const w = 0.6;
    const h = 0.85;
    const d = 0.6;
    const bd = d - 0.04;
    const op = { x: 0, y: (0.1 + h - 0.035) / 2, w: w - 0.05, h: h - 0.135 };
    const tub = linerMat('#c9cdd1', 'tub', { metalness: 0.75, roughness: 0.35 });
    const zF = cabinet(root, w, h - 0.01, bd, F, { y0: 0.01, cz: -0.02, r: 0.01, openings: [op] });
    mesh(new THREE.BoxGeometry(w - 0.04, 0.07, 0.004), plasticMat('#151515'), { parent: root, at: [0, 0.05, zF + 0.017] });
    const cv = cavity(root, op.x, op.y, op.w, op.h, zF, bd - 0.015 - 0.03, tub, 'tub');
    const wireMat = plasticMat('#9aa3ab', 0.35);
    const hw = cv.iw / 2 - 0.014;
    const dep = cv.depth - 0.06;
    const rz = cv.zc + 0.01;
    const yL = cv.floor + 0.07;
    const yU = cv.floor + 0.42;
    for (const y of [yL, yU]) for (const s of [1, -1]) mesh(new THREE.BoxGeometry(0.012, 0.008, cv.depth - 0.04), tub, { parent: root, at: [s * (cv.iw / 2 - 0.006), y - 0.016, cv.zc] });
    // lower rack with plates and a cutlery basket
    const plateZ = [-0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15];
    const tines = [];
    for (const z of plateZ) for (const x of [-0.21, -0.16, -0.08, -0.03]) tines.push([x, z + 0.025, 0.1]);
    const lower = basket(root, 'rackLower', hw * 2, dep, 0.14, [0, yL, rz], wireMat, { wheels: true, tines });
    const plateMat = ceramic('#fbfbf8');
    for (const z of plateZ.slice(0, 6)) mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.008, 32).rotateX(Math.PI / 2), plateMat, { parent: lower, at: [-0.12, 0.104, z] });
    basket(lower, null, 0.13, 0.2, 0.13, [0.15, 0.0025, -0.02], wireMat);
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 6), metalMat('steel'), { parent: lower, at: [0.12 + (i % 2) * 0.05, 0.1, -0.08 + i * 0.04] });
    // upper rack with cups and glasses (upside down)
    const upper = basket(root, 'rackUpper', hw * 2, dep, 0.12, [0, yU, rz], wireMat, { wheels: true });
    for (let i = 0; i < 6; i++) {
      const glass = i % 2 === 1;
      const r = glass ? 0.035 : 0.04;
      const ht = glass ? 0.11 : 0.08;
      mesh(new THREE.CylinderGeometry(r, r * 0.85, ht, 18, 1, false), glass ? glassMat('#e8f2f4', 0.45) : ceramic(['#f2f0ea', '#3b6ea8', '#d36a4a'][i % 3]), { parent: upper, at: [-0.18 + (i % 3) * 0.15, 0.0025 + ht / 2, -0.09 + Math.floor(i / 3) * 0.16] });
    }
    // spray arm
    mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.02, 16), tub, { parent: root, at: [0, cv.floor + 0.01, cv.zc] });
    const arm = group('sprayArm', { parent: root, at: [0, cv.floor + 0.026, cv.zc] });
    mesh(roundedBox(0.44, 0.012, 0.035, 0.005), plasticMat('#8d969e', 0.4), { parent: arm });
    // door
    const door = group('door', { parent: root, at: [0, 0.09, zF + 0.015] });
    mesh(roundedBox(w - 0.004, h - 0.1, 0.04, 0.012), F, { parent: door, at: [0, (h - 0.1) / 2, 0.02] });
    mesh(new THREE.BoxGeometry(w - 0.07, h - 0.17, 0.008), tub, { parent: door, at: [0, (h - 0.1) / 2, -0.004] });
    mesh(roundedBox(0.12, 0.08, 0.012, 0.006), plasticMat('#e1e4e6', 0.4), { parent: door, at: [0.1, 0.45, -0.014] });
    mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 20).rotateX(Math.PI / 2), plasticMat('#2f6fb3', 0.4), { parent: door, at: [-0.04, 0.45, -0.014] });
    mesh(roundedBox(w - 0.04, 0.07, 0.006, 0.004), plasticMat('#111', 0.3), { parent: door, at: [0, h - 0.16, 0.041] });
    mesh(new THREE.PlaneGeometry(0.07, 0.026), displayMat('1:45', '#4fd6ff', 1), { parent: door, at: [0.17, h - 0.16, 0.0445], name: 'display' });
    ['ECO', 'AUTO', 'QUICK'].forEach((lb, i) => keyButton(door, lb, [-0.02 + i * 0.05, h - 0.16, 0.044], 0.04, 0.02, { bg: '#222428' }));
    { const e = brandEmblem(0.045, { name: 'emblem' }); e.position.set(-w / 2 + 0.06, h - 0.16, 0.046); door.add(e); }
    const pull = barPull(0.4, metalMat('steel'), { standoff: 0.03 });
    pull.position.set(0, h - 0.24, 0.04);
    door.add(pull);
    animations.push(clip('doorOpen', 1.6, [
      rotateTrack(door, 'x', 1.6, (t) => ease(t, 1.7) * 1.5),
      moveTrack(lower, 1.6, (t) => [0, 0, ease(Math.max(0, (t - 0.6) / 0.4), 1) * 0.3]),
    ]));
    animations.push(clip('wash', 1.2, [spinTrack(arm, 'y', 1.2, 1)]));
    oneShot.push('doorOpen');
  }
  const out = finalize(root, { type: 'kitchen', variant, options: o, animations });
  if (oneShot.length) out.userData.premade.oneShot = oneShot;
  return out;
}

/* ============================= APPLIANCES ============================= */

export const APPLIANCE_VARIANTS = {
  'washing-machine': { color: '#f4f4f2' },
  dryer: { color: '#f4f4f2' },
  'top-loader': { color: '#e9ecef' },
};

const PROGRAMS = ['Cotton', 'Eco', 'Synth', 'Mix', 'Wool', 'Silk', 'Quick', 'Rinse', 'Spin'];
const DRY_PROGRAMS = ['Cotton', 'Iron', 'Synth', 'Mix', 'Wool', 'Shirts', 'Refresh', 'Timed', 'Cool'];

export function createAppliance(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(APPLIANCE_VARIANTS, o.variant, 'appliance');
  const v = APPLIANCE_VARIANTS[variant];
  const root = group(`appliance-${variant}`);
  const F = enamel(o.color ?? v.color);
  const w = 0.6;
  const h = 0.85;
  const d = 0.6;
  const y0 = 0.01;
  const bodyH = h - 0.02;
  const animations = [];
  const oneShot = [];
  const trimMat = plasticMat('#e2e2e0', 0.4);
  const darkMat = plasticMat('#2a2c2e', 0.6);
  const edge = Math.min(0.02 * (STYLE.cur?.edge ?? 1), 0.06);
  for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.012, 12), plasticMat('#222'), { parent: root, at: [sx * (w / 2 - 0.05), 0.006, sz * (d / 2 - 0.05)] });
  const tubMat = new THREE.MeshStandardMaterial({ name: 'tub', color: '#8d9296', metalness: 0.7, roughness: 0.45, side: THREE.DoubleSide });
  const drumMat = new THREE.MeshStandardMaterial({ name: 'drum', color: '#d2d6d9', metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide, alphaMap: holeMask(60, 22, 0.18), alphaTest: 0.5 });

  if (variant === 'top-loader') {
    // walls as a plan-view ring extruded upward, top deck with the round tub opening
    const ring = rr(new THREE.Shape(), -w / 2, -d / 2, w, d, edge);
    ring.holes.push(rr(new THREE.Path(), -w / 2 + 0.008, -d / 2 + 0.008, w - 0.016, d - 0.016, Math.max(0.002, edge - 0.008)));
    mesh(new THREE.ExtrudeGeometry(ring, { depth: h - 0.03 - y0, bevelEnabled: false, curveSegments: 8 }).rotateX(-Math.PI / 2), F, { parent: root, at: [0, y0, 0] });
    mesh(new THREE.BoxGeometry(w - 0.014, 0.01, d - 0.014), F, { parent: root, at: [0, y0 + 0.005, 0] });
    const zc = 0.04;
    const deck = rr(new THREE.Shape(), -w / 2, -d / 2, w, d, edge);
    deck.holes.push(new THREE.Path().absarc(0, -zc, 0.21, 0, Math.PI * 2, true));
    mesh(new THREE.ExtrudeGeometry(deck, { depth: 0.02, bevelEnabled: false, curveSegments: 40 }).rotateX(-Math.PI / 2), F, { parent: root, at: [0, h - 0.03, 0] });
    // tub (static) on a shaft, agitator spins
    const tubBottom = 0.3;
    mesh(new THREE.CylinderGeometry(0.215, 0.215, h - 0.03 - tubBottom, 48, 1, true), drumMat, { parent: root, at: [0, (h - 0.03 + tubBottom) / 2, zc] });
    mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.006, 48), tubMat, { parent: root, at: [0, tubBottom - 0.003, zc] });
    mesh(new THREE.CylinderGeometry(0.03, 0.03, tubBottom - y0 - 0.01, 16), tubMat, { parent: root, at: [0, (tubBottom + y0 + 0.01) / 2, zc] });
    const drum = group('drum', { parent: root, at: [0, tubBottom, zc] });
    const white = plasticMat('#f2f2f0', 0.35);
    mesh(lathe([[0, 0], [0.13, 0], [0.13, 0.03], [0.06, 0.07], [0.045, 0.36], [0.035, 0.42], [0.045, 0.45], [0, 0.46]], 32), white, { parent: drum });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const fin = mesh(roundedBox(0.012, 0.22, 0.07, 0.004), white, { parent: drum, at: [Math.cos(a) * 0.075, 0.16, Math.sin(a) * 0.075] });
      fin.rotation.y = -a + Math.PI / 2;
    }
    // console
    const cz = -d / 2 + 0.05;
    mesh(roundedBox(w, 0.14, 0.1, Math.min(edge, 0.04)), F, { parent: root, at: [0, h + 0.07, cz] });
    const fz = cz + 0.05;
    mesh(roundedBox(w - 0.04, 0.1, 0.004, 0.006), trimMat, { parent: root, at: [0, h + 0.075, fz + 0.001] });
    dialScale(root, PROGRAMS, [-0.19, h + 0.075, fz + 0.0035], 0.1, '#3a3d40');
    rotaryDial(root, [-0.19, h + 0.075, fz + 0.003], 0.024, metalMat('chrome'), 'dial');
    mesh(roundedBox(0.1, 0.04, 0.003, 0.004), plasticMat('#030303', 0.15), { parent: root, at: [0.02, h + 0.09, fz + 0.0045] });
    mesh(new THREE.PlaneGeometry(0.09, 0.032), displayMat('0:48', '#58ff8c', 1.1), { parent: root, at: [0.02, h + 0.09, fz + 0.0062], name: 'display' });
    ['Temp', 'Soil', 'Spin'].forEach((lb, i) => keyButton(root, lb, [-0.015 + i * 0.035, h + 0.052, fz + 0.003], 0.03, 0.016, { bg: '#d0d2d4', fg: '#333' }));
    keyButton(root, 'START', [0.17, h + 0.075, fz + 0.003], 0.06, 0.04, { bg: '#2f7a46', fg: '#ffffff' });
    { const e = brandEmblem(0.04, { name: 'emblem' }); e.position.set(0.255, h + 0.075, fz + 0.004); root.add(e); }
    // lid: frame + smoked glass window
    const L = d - 0.12;
    const lid = group('lid', { parent: root, at: [0, h - 0.01, -d / 2 + 0.1] });
    const ls = rr(new THREE.Shape(), -(w - 0.04) / 2, -L, w - 0.04, L, 0.015);
    ls.holes.push(rr(new THREE.Path(), -0.19, -L + 0.05, 0.38, L - 0.1, 0.03));
    mesh(new THREE.ExtrudeGeometry(ls, { depth: 0.02, bevelEnabled: false, curveSegments: 8 }).rotateX(-Math.PI / 2), F, { parent: lid });
    mesh(new THREE.PlaneGeometry(0.384, L - 0.096).rotateX(-Math.PI / 2), glassMat('#2b3a40', 0.5), { parent: lid, at: [0, 0.012, L / 2] });
    mesh(roundedBox(0.16, 0.012, 0.025, 0.005), darkMat, { parent: lid, at: [0, 0.012, L - 0.012] });
    animations.push(clip('on', 1, [numberTrack('display.material.emissiveIntensity', 1, () => 2.6, 2)]));
    animations.push(clip('lidOpen', 1, [rotateTrack(lid, 'x', 1, (t) => -ease(t) * 1.4)]));
    animations.push(clip('spin', 0.6, [spinTrack(drum, 'y', 0.6, 1)]));
    oneShot.push('lidOpen');
  } else {
    const dryer = variant === 'dryer';
    const cy = 0.38;
    // hollow cabinet + front panel with the porthole
    const walls = rr(new THREE.Shape(), -w / 2, 0, w, bodyH, edge);
    walls.holes.push(rr(new THREE.Path(), -w / 2 + 0.015, 0.015, w - 0.03, bodyH - 0.03, Math.max(0.004, edge - 0.015)));
    mesh(new THREE.ExtrudeGeometry(walls, { depth: d - 0.03, bevelEnabled: false, curveSegments: 6 }), F, { parent: root, at: [0, y0, -d / 2] });
    mesh(roundedBox(w - 0.02, bodyH - 0.02, 0.015, 0.004, 1), F, { parent: root, at: [0, y0 + bodyH / 2, -d / 2 + 0.0075] });
    const front = rr(new THREE.Shape(), -w / 2, 0, w, bodyH, edge);
    front.holes.push(new THREE.Path().absarc(0, cy - y0, 0.2, 0, Math.PI * 2, true));
    mesh(new THREE.ExtrudeGeometry(front, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 40 }), F, { parent: root, at: [0, y0, d / 2 - 0.026] });
    const zFb = d / 2 - 0.03; // back face of the front panel
    const zBack = -d / 2 + 0.015; // front face of the back plate
    // static tub: open cylinder from the front panel back, closed at the rear, on the rear bearing
    const tubBack = -d / 2 + 0.06;
    mesh(new THREE.CylinderGeometry(0.215, 0.215, zFb - tubBack, 48, 1, true).rotateX(Math.PI / 2), tubMat, { parent: root, at: [0, cy, (zFb + tubBack) / 2] });
    mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.006, 48).rotateX(Math.PI / 2), tubMat, { parent: root, at: [0, cy, tubBack - 0.003] });
    mesh(new THREE.CylinderGeometry(0.05, 0.06, tubBack - zBack, 20).rotateX(Math.PI / 2), metalMat('steel'), { parent: root, at: [0, cy, (tubBack + zBack) / 2] });
    // rubber bellows gasket from the porthole into the drum
    mesh(lathe([[0.208, 0.012], [0.2, 0.004], [0.19, -0.01], [0.195, -0.03], [0.205, -0.04]], 48).rotateX(Math.PI / 2), darkMat, { parent: root, at: [0, cy, zFb + 0.02] });
    // rotating perforated drum: shell, back plate, lifters, shaft through the tub to the rear bearing
    const drum = group('drum', { parent: root, at: [0, cy, 0] });
    const dz0 = tubBack + 0.012;
    const dz1 = zFb - 0.045;
    mesh(new THREE.CylinderGeometry(0.2, 0.2, dz1 - dz0, 48, 1, true).rotateX(Math.PI / 2), drumMat, { parent: drum, at: [0, 0, (dz0 + dz1) / 2] });
    mesh(new THREE.TorusGeometry(0.2, 0.006, 8, 48), metalMat('steel'), { parent: drum, at: [0, 0, dz1] });
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.006, 48).rotateX(Math.PI / 2), metalMat('steel'), { parent: drum, at: [0, 0, dz0] });
    mesh(new THREE.CylinderGeometry(0.02, 0.02, dz0 - zBack, 12).rotateX(Math.PI / 2), metalMat('steel'), { parent: drum, at: [0, 0, (dz0 + zBack) / 2] });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
      mesh(roundedBox(0.04, 0.045, dz1 - dz0 - 0.02, 0.015), plasticMat('#e8e8e8', 0.5), { parent: drum, at: [Math.cos(a) * 0.18, Math.sin(a) * 0.18, (dz0 + dz1) / 2], rot: [0, 0, a + Math.PI / 2] });
    }
    if (!dryer) {
      const water = new THREE.MeshPhysicalMaterial({ name: 'water', color: '#7fb9d6', roughness: 0.1, transparent: true, opacity: 0.5, depthWrite: false });
      mesh(new THREE.CylinderGeometry(0.195, 0.195, dz1 - dz0 - 0.01, 40, 1, false, Math.PI * 0.75, Math.PI * 0.5).rotateX(Math.PI / 2), water, { parent: root, at: [0, cy, (dz0 + dz1) / 2] });
    }
    // service hatch / condenser grille at the bottom
    mesh(roundedBox(dryer ? 0.5 : 0.12, 0.08, 0.006, 0.006), trimMat, { parent: root, at: [dryer ? 0 : 0.2, 0.07, d / 2 + 0.001] });
    if (dryer) for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(0.44, 0.004, 0.003), darkMat, { parent: root, at: [0, 0.045 + i * 0.012, d / 2 + 0.0045] });
    // control panel
    const panelY = h - 0.07;
    const pz = d / 2 + 0.007;
    mesh(roundedBox(w - 0.02, 0.1, 0.01, 0.004), trimMat, { parent: root, at: [0, panelY, d / 2 + 0.002] });
    const drawer = group('drawer', { parent: root, at: [-0.185, panelY, pz] });
    mesh(roundedBox(0.19, 0.075, 0.012, 0.008), plasticMat('#f4f4f2', 0.35), { parent: drawer, at: [0, 0, 0.006] });
    mesh(roundedBox(0.09, 0.014, 0.004, 0.006), darkMat, { parent: drawer, at: [0, -0.022, 0.0115] });
    const tex = labelTex(dryer ? 'WATER TANK' : 'DETERGENT', '#55595d', 3.5);
    if (tex) mesh(new THREE.PlaneGeometry(0.14, 0.04), new THREE.MeshStandardMaterial({ name: 'label', map: tex, transparent: true, depthWrite: false }), { parent: drawer, at: [0, 0.012, 0.0126] });
    dialScale(root, dryer ? DRY_PROGRAMS : PROGRAMS, [-0.02, panelY, pz + 0.0005], 0.1, '#3a3d40');
    rotaryDial(root, [-0.02, panelY, pz], 0.026, metalMat('chrome'), 'dial');
    mesh(roundedBox(0.1, 0.038, 0.003, 0.004), plasticMat('#030303', 0.15), { parent: root, at: [0.115, panelY + 0.014, pz + 0.0015] });
    mesh(new THREE.PlaneGeometry(0.09, 0.032), displayMat(dryer ? '0:58' : '1:25', dryer ? '#ffb347' : '#5ad0ff', 1.1), { parent: root, at: [0.115, panelY + 0.014, pz + 0.0032], name: 'display' });
    (dryer ? ['Dry', 'Time'] : ['Temp', 'Spin']).forEach((lb, i) => keyButton(root, lb, [0.09 + i * 0.05, panelY - 0.026, pz], 0.04, 0.016, { bg: '#d0d2d4', fg: '#333' }));
    keyButton(root, 'START', [0.235, panelY, pz], 0.06, 0.05, { bg: '#2f7a46', fg: '#ffffff' });
    { const e = brandEmblem(0.04, { name: 'emblem' }); e.position.set(0, panelY - 0.075, d / 2 - 0.001); root.add(e); }
    // porthole door on a left hinge
    const door = group('door', { parent: root, at: [-0.22, cy, d / 2 + 0.01] });
    const ringMat = dryer ? plasticMat('#cfd2d4', 0.3) : metalMat('chrome');
    mesh(new THREE.TorusGeometry(0.2, 0.035, 16, 48), ringMat, { parent: door, at: [0.22, 0, 0.02] });
    mesh(lathe([[0, 0.03], [0.1, 0.025], [0.17, 0.0], [0.17, -0.005], [0.1, 0.02], [0, 0.025]], 40).rotateX(Math.PI / 2), glassMat(dryer ? '#9aa6ad' : '#3d4a52', 0.45), { parent: door, at: [0.22, 0, 0.02] });
    mesh(roundedBox(0.03, 0.08, 0.03, 0.01), plasticMat('#bfc3c6', 0.3), { parent: door, at: [0.44, 0, 0.03] });
    mesh(roundedBox(0.035, 0.07, 0.03, 0.008), plasticMat('#bfc3c6', 0.3), { parent: door, at: [0.0, 0, 0.005] });
    animations.push(clip('on', 1, [numberTrack('display.material.emissiveIntensity', 1, () => 2.6, 2)]));
    animations.push(clip('doorOpen', 1, [rotateTrack(door, 'y', 1, (t) => -ease(t) * 1.6)]));
    animations.push(clip('spin', 0.8, [spinTrack(drum, 'z', 0.8, 1)]));
    oneShot.push('doorOpen');
  }
  const out = finalize(root, { type: 'appliance', variant, options: o, animations });
  out.userData.premade.oneShot = oneShot;
  return out;
}
