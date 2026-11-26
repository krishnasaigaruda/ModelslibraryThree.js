// Lab glassware: beakers, flasks, test tubes in racks, pipettes / burettes on stands.
// Every vessel is a hollow lathe (real wall thickness) with the liquid filling the inside.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, setup, done, fin, glassMat, liquidMat, vesselGeo, liquidGeo, radiusAt, lamp, slab, rodY, rodX, rodZ, bar, labelPlane, canvasTex } from './common.js';
import { clip, scaleTrack, moveTrack } from '../../core/animation.js';

/* Glass trims change the contents and the accessories (rod, stopper, thermometer, foil, hot plate…). */
export const GLASS_TRIMS = {
  empty: { liq: null, label: true },
  blue: { liq: '#1f6fe0', frac: 0.55, rod: true },
  green: { liq: '#2fbf4a', frac: 0.45, stopper: true },
  red: { liq: '#d8203a', frac: 0.6, thermo: true },
  amber: { liq: '#e09a1a', frac: 0.8, foil: true },
  layered: { liq: '#6a2bb8', liq2: '#f2d64a', frac: 0.35, frac2: 0.7 },
  boiling: { liq: '#ff7a1a', frac: 0.5, boil: true },
  glowing: { liq: '#5bff6a', frac: 0.6, glow: true },
};
export const GLASS_TRIM_NAMES = Object.keys(GLASS_TRIMS);
const BASE = { liq: '#bfe3f2', frac: 0.5 };

const glassOf = (T) => glassMat({ tint: T.tint ?? '#ffffff' });
const T_W = 0.0015;

/** Liquid between y0..y1 inside an outer profile. */
function layerGeo(outer, y0, y1, t) {
  const g = liquidGeo(outer, y1, t);
  if (y0 <= outer[0][1] + t + 1e-4) return g;
  // cut away below y0 by clamping vertices
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < y0) {
    const r = radiusAt(outer, y0, t) + t * 0.3;
    const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z) || 1;
    const k = Math.min(1, r / d);
    p.setXYZ(i, x * (d > r ? k : 1), y0, z * (d > r ? k : 1));
  }
  g.computeVertexNormals();
  return g;
}

/** Fill a vessel (outer profile, height H) per trim. Returns the liquid top height or null. */
function fill(T, parent, outer, H, t = T_W, { glowName } = {}) {
  if (!T.liq) return null;
  const y1 = H * T.frac;
  if (T.glow) {
    lamp(T, parent, 'green', { geometry: liquidGeo(outer, y1, t) });
  } else {
    mesh(liquidGeo(outer, y1, t), liquidMat(T.liq), { parent, name: 'liquid' });
  }
  if (T.liq2) {
    const y2 = H * T.frac2;
    mesh(layerGeo(outer, y1 - 0.0005, y2, t), liquidMat(T.liq2), { parent, name: 'liquid-top' });
    return y2;
  }
  if (T.boil) {
    const R = radiusAt(outer, y1, t);
    const bub = group(glowName ?? 'bubbles', { parent });
    const bm = glassMat({ tint: '#fff4e0' });
    for (let i = 0; i < 9; i++) {
      const a = T.r() * Math.PI * 2, d = Math.sqrt(T.r()) * R * 0.8, s = R * (0.07 + T.r() * 0.08);
      mesh(new THREE.SphereGeometry(s, 10, 8), bm, { parent: bub, name: `bubble${i}`, at: [Math.cos(a) * d, y1, Math.sin(a) * d] });
    }
    T.bubbles = bub;
  }
  return y1;
}

/** Thin graduation marks band (canvas, browser only) wrapped on a cone/cylinder section. */
function grads(parent, r0, r1, y0, y1, n = 8, color = '#ffffff') {
  const tex = canvasTex(64, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = color;
    for (let i = 0; i <= n * 2; i++) { const y = h - 4 - (i * (h - 8)) / (n * 2); c.fillRect(0, y - 1.5, i % 2 ? w * 0.35 : w * 0.7, 3); }
  });
  if (!tex) return;
  const m = new THREE.MeshStandardMaterial({ name: 'grad', map: tex, transparent: true, alphaTest: 0.3, roughness: 0.5 });
  mesh(new THREE.CylinderGeometry(r1 + 0.0004, r0 + 0.0004, y1 - y0, 16, 1, true, -0.35, 0.7), m, { parent, at: [0, (y0 + y1) / 2, 0] });
}

/** Little paper label stuck to the glass (faces +Z). */
function sticker(parent, r, y, text, w = 0.03, h = 0.018) {
  const l = labelPlane(w, h, (c, W, H) => {
    c.fillStyle = '#fbfaf3'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#c33'; c.lineWidth = 4; c.strokeRect(4, 4, W - 8, H - 8);
    c.fillStyle = '#222'; c.font = `bold ${H * 0.36}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2);
  }, { bg: '#fbfaf3', px: 128 });
  l.position.set(0, y, r + 0.0003);
  parent.add(l);
}

/** Accessories per trim for an open vessel with rim radius rr at height H. */
function extras(T, parent, outer, H, level, rr, neck = false) {
  const t = T_W;
  if (T.rod && level) {
    // glass stirring rod leaning on the rim
    const Rb = radiusAt(outer, 0.01, t) * 0.6;
    bar([-Rb, t + 0.002, 0], [rr - 0.001, H + 0.05, 0], 0.0025, glassMat(), parent);
  }
  if (T.thermo && level) {
    const g = group('thermometer', { parent });
    const x = Math.min(rr * 0.35, 0.01);
    const len = H + 0.09;
    mesh(new THREE.CylinderGeometry(0.003, 0.003, len, 12), glassMat(), { parent: g, at: [x, t + 0.004 + len / 2, 0] });
    mesh(new THREE.CylinderGeometry(0.0009, 0.0009, len * 0.55, 8), M.emissive('#e0101e', 0.3), { parent: g, at: [x, t + 0.004 + len * 0.3, 0] });
    mesh(new THREE.SphereGeometry(0.0035, 12, 8), M.emissive('#e0101e', 0.3), { parent: g, at: [x, t + 0.005, 0] });
  }
  if (T.stopper) {
    // rubber / cork stopper (neck) or watch glass (wide mouth)
    if (neck) mesh(lathe([[0, -0.012], [rr - 0.003, -0.012], [rr + 0.0025, 0.012], [0, 0.012]], 24), fin(T, '#c08a55', 'matte'), { parent, at: [0, H, 0] });
    else mesh(new THREE.SphereGeometry(rr * 3, 32, 6, 0, Math.PI * 2, 0, Math.asin(Math.min(1, 1.05 / 3))).translate(0, -rr * 3 * Math.cos(Math.asin(1.05 / 3)), 0), glassMat(), { parent, at: [0, H + 0.0005, 0] });
  }
  if (T.foil) {
    const f = lathe([[0, 0.012], [rr * 0.6, 0.011], [rr + 0.003, 0.004], [rr + 0.004, -0.012], [rr + 0.0015, -0.012], [rr + 0.0015, 0.002], [0, 0.0095]], 18);
    const p = f.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 + Math.sin(i * 12.9898) * 0.06; p.setXYZ(i, p.getX(i) * k, p.getY(i), p.getZ(i) * k); }
    f.computeVertexNormals();
    mesh(f, M.metal('#d9dbe0', 0.3), { parent, at: [0, H, 0] });
  }
  if (T.label) sticker(parent, radiusAt(outer, H * 0.35, -T_W), H * 0.35, T.labelText ?? 'NaCl 0.1M');
}

/** Hot plate under boiling vessels; returns its top height. */
function hotplate(T, parent, w) {
  const hp = group('hotplate', { parent });
  slab(hp, fin(T, '#e9ebee', 'gloss'), w, 0.07, w * 1.2, { r: 0.008, z: w * 0.1 });
  mesh(new THREE.CylinderGeometry(w * 0.42, w * 0.42, 0.008, 40), M.metal('#9aa0a6', 0.4), { parent: hp, at: [0, 0.074, 0] });
  for (const x of [-0.25, 0.25]) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.014, 20).rotateX(Math.PI / 2), fin(T, '#2a2d33', 'plastic'), { parent: hp, at: [x * w, 0.035, w * 0.7 + 0.004] });
  lamp(T, hp, 'red', { at: [0, 0.035, w * 0.7 + 0.001], w: 0.008, h: 0.008, shape: 'round', glowSize: 0.05 });
  return 0.078;
}

function finishVessel(root, T, variant, o, extraAnims = []) {
  const anims = [...extraAnims];
  if (T.bubbles) anims.push(clip('boil', 1.2, T.bubbles.children.map((b, i) => scaleTrack(b, 1.2, (t) => { const k = 0.4 + 0.9 * ((t + i / 9) % 1); return [k, k, k]; }))));
  return done(root, T, variant, o, anims);
}

/* ================================ BEAKERS ================================ */

export const BEAKER_VARIANTS = {
  'griffin-250': { R: 0.035, H: 0.095 },
  'tall-form': { R: 0.03, H: 0.14 },
  'low-1000': { R: 0.06, H: 0.145 },
  'graduated-cylinder': { R: 0.016, H: 0.3, cyl: true },
  'plastic-jug': { R: 0.055, H: 0.17, jug: true },
  'reagent-bottle': { R: 0.04, H: 0.15, bottle: true, tint: '#7a4a12' },
};

export function createLabBeaker(options = {}) {
  const { o, variant, T, V } = setup(options, BEAKER_VARIANTS, 'lab-beaker', BASE, GLASS_TRIMS);
  const root = group(`lab-beaker-${variant}`);
  let y0 = 0;
  if (T.boil) y0 = hotplate(T, root, V.cyl ? 0.12 : Math.max(0.16, V.R * 2.6)) - 0.0005;
  const v = group('vessel', { parent: root, at: [0, y0, 0] });
  const { R, H } = V;
  let outer;
  if (V.cyl) {
    // hexagon-ish foot + tall tube with pour lip
    mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.012, 6), glassMat(), { parent: v, at: [0, 0.006, 0] });
    const g = group('tube', { parent: v, at: [0, 0.011, 0] });
    outer = [[R - 0.002, 0], [R, 0.002], [R, H], [R + 0.003, H + 0.004]];
    mesh(vesselGeo(outer, T_W), glassOf(T), { parent: g });
    grads(g, R, R, 0.02, H - 0.02, 10);
    const lv = fill(T, g, outer, H);
    extras(T, g, outer, H, lv, R, true);
  } else if (V.jug) {
    // polypropylene measuring jug with handle and spout
    outer = [[R - 0.006, 0], [R - 0.004, 0.003], [R, H * 0.95], [R + 0.003, H]];
    const pm = new THREE.MeshPhysicalMaterial({ name: 'pp', color: '#f4f6f8', roughness: 0.25, transmission: 0.7, thickness: 0.004, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
    mesh(vesselGeo(outer, 0.002), pm, { parent: v });
    curveTube([[R - 0.003, H * 0.85, 0], [R + 0.04, H * 0.82, 0], [R + 0.045, H * 0.4, 0], [R - 0.003, H * 0.2, 0]], 0.007, pm, { parent: v });
    mesh(new THREE.ConeGeometry(0.014, 0.02, 3, 1, true).rotateZ(Math.PI / 2), pm, { parent: v, at: [-R - 0.006, H - 0.006, 0] });
    grads(v, R - 0.004, R, 0.02, H - 0.02, 10, '#1d4fa0');
    const lv = fill(T, v, outer, H, 0.002);
    extras(T, v, outer, H, lv, R + 0.002);
  } else if (V.bottle) {
    outer = [[R - 0.003, 0], [R, 0.003], [R, H * 0.68], [R * 0.75, H * 0.78], [0.013, H * 0.85], [0.013, H]];
    const gm = glassMat({ tint: T.trim === 'empty' || !T.trim ? V.tint : '#e9f3f6' });
    mesh(vesselGeo(outer, 0.002), gm, { parent: v });
    const lv = fill(T, v, outer, H, 0.002);
    // ground-glass stopper
    mesh(lathe([[0, -0.015], [0.0105, -0.015], [0.012, 0.002], [0.018, 0.004], [0.018, 0.012], [0.008, 0.026], [0, 0.028]], 24), gm, { parent: v, at: [0, H, 0] });
    sticker(v, R + 0.0002, H * 0.38, T.liq ? 'HCl 1M' : 'H₂O', 0.05, 0.03);
    extras(T, v, outer, H, lv && null, 0.013, true);
  } else {
    outer = [[R - 0.004, 0], [R, 0.004], [R, H - 0.004], [R + 0.0025, H]];
    mesh(vesselGeo(outer, T_W), glassOf(T), { parent: v });
    // pouring spout
    mesh(new THREE.TorusGeometry(0.006, 0.0015, 6, 12, Math.PI), glassMat(), { parent: v, at: [-R - 0.001, H - 0.002, 0], rot: [Math.PI / 2, 0, Math.PI / 2] });
    grads(v, R, R, H * 0.15, H * 0.85, variant === 'low-1000' ? 10 : 5);
    const lv = fill(T, v, outer, H);
    extras(T, v, outer, H, lv, R);
  }
  return finishVessel(root, T, variant, o);
}

/* ================================ FLASKS ================================ */

export const FLASK_VARIANTS = {
  erlenmeyer: { kind: 'cone' },
  'round-bottom': { kind: 'round' },
  florence: { kind: 'flat' },
  volumetric: { kind: 'vol' },
  distilling: { kind: 'round', arm: true },
  'side-arm': { kind: 'cone', arm: true },
};

function sphereProfile(R, cy, rNeck, yb = null) {
  const pts = [];
  const top = Math.asin(Math.min(0.999, Math.sqrt(1 - (rNeck / R) ** 2)));
  for (let i = 0; i <= 20; i++) {
    const a = -Math.PI / 2 + ((top + Math.PI / 2) * i) / 20;
    const r = R * Math.cos(a), y = cy + R * Math.sin(a);
    if (yb != null && y < yb) continue;
    pts.push([Math.max(0.0008, r), y]);
  }
  if (yb != null) pts.unshift([Math.sqrt(R * R - (yb - cy) ** 2), yb]);
  return pts;
}

export function createLabFlask(options = {}) {
  const { o, variant, T, V } = setup(options, FLASK_VARIANTS, 'lab-flask', BASE, GLASS_TRIMS);
  const root = group(`lab-flask-${variant}`);
  let y0 = 0;
  if (T.boil) y0 = hotplate(T, root, 0.17) - 0.0005;
  const v = group('vessel', { parent: root, at: [0, y0, 0] });
  let outer, H, rn = 0.016;
  if (V.kind === 'cone') {
    H = 0.145;
    outer = [[0.038, 0], [0.0425, 0.006], [0.0175, 0.1], [0.016, 0.11], [0.016, H - 0.004], [0.0185, H]];
    grads(v, 0.042, 0.022, 0.012, 0.085, 5);
  } else if (V.kind === 'flat') {
    const R = 0.052, cy = 0.045;
    H = cy + R + 0.08;
    outer = [...sphereProfile(R, cy, rn, 0), [rn, H - 0.004], [rn + 0.0025, H]];
  } else if (V.kind === 'vol') {
    rn = 0.008;
    H = 0.26;
    outer = [[0.03, 0], [0.034, 0.004], [0.036, 0.03], [0.03, 0.06], [0.012, 0.08], [rn, 0.095], [rn, H - 0.003], [rn + 0.002, H]];
    // calibration ring
    mesh(new THREE.TorusGeometry(rn + 0.0002, 0.0004, 6, 24).rotateX(Math.PI / 2), M.matte('#ffffff'), { parent: v, at: [0, 0.19, 0] });
  } else {
    // round bottom resting in a cork ring
    const R = 0.052;
    mesh(new THREE.TorusGeometry(0.032, 0.013, 14, 32).rotateX(Math.PI / 2), fin(T, '#b98a5a', 'matte'), { parent: v, at: [0, 0.013, 0] });
    const cy = 0.013 + Math.sqrt((R + 0.013) ** 2 - 0.032 ** 2) - 0.0005;
    H = cy + R + 0.085;
    outer = [...sphereProfile(R, cy, rn), [rn, H - 0.004], [rn + 0.0025, H]];
  }
  mesh(vesselGeo(outer, T_W), glassOf(T), { parent: v, name: 'flask' });
  if (V.arm) {
    const ya = H - 0.035;
    curveTube([[rn - 0.002, ya, 0], [rn + 0.02, ya - 0.01, 0], [rn + 0.08, ya - 0.04, 0]], 0.004, glassMat(), { parent: v });
  }
  const lv = fill(T, v, outer, V.kind === 'vol' ? 0.09 / T.frac * Math.min(1, T.frac + 0.3) : H * 0.62);
  extras(T, v, outer, H, lv, rn, true);
  return finishVessel(root, T, variant, o);
}

/* ============================ TEST TUBE RACKS ============================ */

export const RACK_VARIANTS = {
  'rack-6': { n: 6, rows: 1, wood: true },
  'rack-12': { n: 6, rows: 2 },
  'wire-rack': { n: 5, rows: 2, wire: true },
  'single-holder': { n: 1, rows: 1, clamp: true },
  'culture-tubes': { n: 8, rows: 1, caps: true },
};
const RAINBOW = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#00acc1', '#f06292'];

function testTube(T, parent, x, z, y, color, i, { L = 0.15, r = 0.008, cap = false } = {}) {
  const g = group(`tube${i}`, { parent, at: [x, y, z] });
  const outer = [];
  for (let k = 0; k <= 8; k++) { const a = -Math.PI / 2 + (k / 8) * (Math.PI / 2); outer.push([Math.max(0.0005, r * Math.cos(a)), r + r * Math.sin(a)]); }
  outer.push([r, L - 0.002], [r + 0.001, L]);
  mesh(vesselGeo(outer, 0.0008, 20), glassMat(), { parent: g });
  const TT = { ...T, liq: T.trim === 'empty' ? null : T.trim && T.trim !== 'layered' && T.trim !== 'glowing' ? T.liq : color, frac: 0.3 + ((i * 0.37) % 0.4), liq2: T.liq2, frac2: 0.75, boil: false };
  if (T.trim === 'layered') { TT.liq = T.liq; TT.frac = 0.3; }
  fill(TT, g, outer, L, 0.0008);
  if (cap) mesh(lathe([[0, 0], [r + 0.0018, 0], [r + 0.0018, 0.018], [r - 0.0008, 0.018], [r - 0.0008, 0.004], [0, 0.004]].reverse(), 20), fin(T, RAINBOW[(i + 3) % 8], 'plastic'), { parent: g, at: [0, L - 0.012, 0] });
  else if (T.stopper) mesh(lathe([[0, -0.01], [r - 0.002, -0.01], [r + 0.002, 0.008], [0, 0.008]], 16), fin(T, '#c08a55', 'matte'), { parent: g, at: [0, L, 0] });
  return g;
}

export function createLabTubeRack(options = {}) {
  const { o, variant, T, V } = setup(options, RACK_VARIANTS, 'lab-tube-rack', BASE, GLASS_TRIMS);
  const root = group(`lab-tube-rack-${variant}`);
  const pitch = 0.024, n = V.n, rows = V.rows;
  const W = n * pitch + 0.03, D = rows * pitch + 0.026;
  const mat = V.wood ? M.wood('#b8874f') : V.wire ? M.metal('#d0d3d8', 0.3) : fin(T, T.trim ? '#f3f4f6' : '#2b7de1', 'plastic');
  let y0 = 0;
  if (T.boil) {
    // water bath: steel tank with the rack sitting inside
    const bath = group('bath', { parent: root });
    const bw = W + 0.06, bd = D + 0.06, bh = 0.09;
    slab(bath, M.metal('#c9ccd2', 0.3), bw, 0.012, bd, { r: 0.004 });
    for (const s of [-1, 1]) { slab(bath, M.metal('#c9ccd2', 0.3), bw, bh, 0.006, { z: s * (bd / 2 - 0.003), r: 0.002 }); slab(bath, M.metal('#c9ccd2', 0.3), 0.006, bh, bd, { x: s * (bw / 2 - 0.003), r: 0.002 }); }
    slab(bath, liquidMat('#9fd3ee'), bw - 0.012, bh * 0.6, bd - 0.012, { y: 0.012, r: 0.001 });
    slab(bath, fin(T, '#2a2d33', 'plastic'), bw, 0.04, 0.03, { z: bd / 2 + 0.015, r: 0.006 });
    lamp(T, bath, 'red', { at: [bw * 0.3, 0.02, bd / 2 + 0.031], w: 0.008, h: 0.008, shape: 'round', glowSize: 0.05 });
    y0 = 0.012;
  }
  const rk = group('rack', { parent: root, at: [0, y0, 0] });
  const xs = (i) => -((n - 1) * pitch) / 2 + i * pitch;
  const zs = (j) => -((rows - 1) * pitch) / 2 + j * pitch;
  if (V.clamp) {
    // single tube in a spring clamp on a small stand
    mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.012, 32), fin(T, T.vintage ? '#2b211a' : '#30343c', 'paint'), { parent: rk, at: [0, 0.006, 0] });
    rodY(0.01, 0.2, 0.005, M.metal('#b9bec6'), rk);
    rodX(0, 0.04, 0.003, M.metal('#b9bec6'), rk, { y: 0.15 });
    mesh(new THREE.TorusGeometry(0.0095, 0.002, 8, 20).rotateX(Math.PI / 2), M.metal('#9aa0a6'), { parent: rk, at: [0.04 + 0.0095, 0.15, 0] });
    mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 20), M.metal('#9aa0a6'), { parent: rk, at: [0.0495, 0.012 + 0.003, 0] });
    testTube(T, rk, 0.0495, 0, 0.018, '#1e88e5', 0);
  } else {
    const plate = (y, th, holes) => {
      const s = new THREE.Shape();
      s.moveTo(-W / 2, -D / 2); s.lineTo(W / 2, -D / 2); s.lineTo(W / 2, D / 2); s.lineTo(-W / 2, D / 2); s.lineTo(-W / 2, -D / 2);
      if (holes) for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) { const h = new THREE.Path(); h.absarc(xs(i), zs(j), 0.0095, 0, Math.PI * 2, true); s.holes.push(h); }
      mesh(extrudeOutline(s, th, { bevel: 0.0015, segments: 2 }).rotateX(Math.PI / 2), mat, { parent: rk, at: [0, y + th / 2, 0] });
    };
    if (V.wire) {
      for (const y of [0.004, 0.09]) for (const j of [0, rows]) rodX(-W / 2, W / 2, 0.0018, mat, rk, { y, z: -D / 2 + (j * D) / rows });
      for (let i = 0; i <= n; i++) { const x = -W / 2 + (i * W) / n; for (const y of [0.004, 0.09]) rodZ(-D / 2, D / 2, 0.0018, mat, rk, { x, y }); }
      for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) rodY(0, 0.09, 0.002, mat, rk, { x, z });
      plate(0, 0.004, false);
    } else {
      plate(0, 0.01, false);
      plate(0.07, 0.01, true);
      if (V.wood) plate(0.115, 0.008, true);
      for (const x of [-W / 2 + 0.006, W / 2 - 0.006]) slab(rk, mat, 0.012, V.wood ? 0.123 : 0.08, D, { x, r: 0.002 });
    }
    // pegs row for drying (wood)
    if (V.wood) for (let i = 0; i < n; i++) rodY(0.123, 0.18, 0.003, mat, rk, { x: xs(i), z: -D / 2 - 0.006 + 0.006 });
    const y = V.wire ? 0.008 : 0.01;
    let k = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) {
      if ((i * 3 + j) % 7 === 5) continue; // a couple of empty slots
      testTube(T, rk, xs(i), zs(j), y, RAINBOW[(i + j * 2) % 8], k++, { cap: V.caps, L: V.caps ? 0.12 : 0.15 });
    }
  }
  if (T.label) sticker(rk, D / 2 + (V.clamp ? 0.05 : 0.0012), 0.035, 'BIO-2');
  return done(root, T, variant, o);
}

/* ======================= BURETTES, PIPETTES & STANDS ======================= */

export const STAND_VARIANTS = {
  'burette-stand': {},
  'pipette-stand': {},
  'retort-funnel': {},
  'dropper-set': {},
  'micropipettes': {},
};

function retortBase(T, parent) {
  const m = fin(T, T.vintage ? '#2b211a' : T.trim === 'futuristic' ? '#16191f' : '#30343c', 'paint');
  slab(parent, m, 0.2, 0.014, 0.13, { r: 0.004 });
  rodY(0.01, 0.62, 0.006, M.metal('#c4c8ce', 0.3), parent, { x: -0.07 });
  mesh(new THREE.SphereGeometry(0.007, 12, 8), M.metal('#c4c8ce', 0.3), { parent, at: [-0.07, 0.62, 0] });
}
function bossClamp(T, parent, y, len, toX = 0) {
  const m = M.metal('#9aa0a6', 0.35);
  slab(parent, m, 0.022, 0.022, 0.022, { x: -0.07, y: y - 0.011, r: 0.003 });
  mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.02, 8).rotateX(Math.PI / 2), fin(T, '#d23b2a', 'plastic'), { parent, at: [-0.07, y, 0.018] });
  rodX(-0.07, toX - 0.006, 0.0035, m, parent, { y });
  return m;
}

export function createLabStand(options = {}) {
  const { o, variant, T } = setup(options, STAND_VARIANTS, 'lab-stand', { ...BASE, liq: '#7fc3ea' }, GLASS_TRIMS);
  const root = group(`lab-stand-${variant}`);
  const anims = [];
  if (variant === 'burette-stand' || variant === 'retort-funnel') {
    retortBase(T, root);
    // flask below
    const fl = group('receiver', { parent: root, at: [0, 0.014, 0] });
    const fo = [[0.03, 0], [0.034, 0.005], [0.014, 0.08], [0.013, 0.088], [0.013, 0.11], [0.015, 0.113]];
    if (variant === 'retort-funnel') fo.splice(0, fo.length, [0.034, 0], [0.036, 0.004], [0.036, 0.1], [0.038, 0.103]);
    mesh(vesselGeo(fo, T_W), glassMat(), { parent: fl });
    fill({ ...T, frac: 0.35, boil: false, liq2: null, glow: false, liq: T.liq ?? null }, fl, fo, 0.1);
    if (variant === 'burette-stand') {
      const by = 0.16;
      const bt = group('burette', { parent: root, at: [0, by, 0] });
      const L = 0.42;
      const outer = [[0.0045, 0.03], [0.0062, 0.032], [0.0062, L], [0.0075, L + 0.004]];
      mesh(vesselGeo(outer, 0.0012, 20), glassMat(), { parent: bt });
      grads(bt, 0.0062, 0.0062, 0.05, L - 0.02, 25);
      // tip + stopcock
      mesh(new THREE.CylinderGeometry(0.0045, 0.0015, 0.03, 12), glassMat(), { parent: bt, at: [0, 0.015, 0] });
      const sc = group('stopcock', { parent: bt, at: [0, 0.022, 0] });
      mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.016, 12).rotateX(Math.PI / 2), glassMat(), { parent: sc });
      mesh(roundedBox(0.026, 0.006, 0.004, 0.0015), fin(T, T.vintage ? '#c9a24a' : '#1d4fa0', T.vintage ? 'brass' : 'plastic'), { parent: sc, at: [0, 0, 0.01] });
      if (T.liq) mesh(liquidGeo(outer, T.liq2 ? L * 0.85 : L * (0.4 + T.frac * 0.5), 0.0012, 20), liquidMat(T.liq2 ?? T.liq, { glow: T.glow ? 0.8 : 0 }), { parent: bt });
      // butterfly clamp
      const cy = by + 0.3;
      bossClamp(T, root, cy, 0.07);
      for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(0.0078, 0.0016, 6, 16, Math.PI).rotateY(s > 0 ? 0 : Math.PI), fin(T, '#2a2d33', 'plastic'), { parent: root, at: [0, cy, 0], rot: [Math.PI / 2, 0, 0] });
      mesh(new THREE.TorusGeometry(0.0078, 0.0016, 6, 16).rotateX(Math.PI / 2), M.metal('#9aa0a6'), { parent: root, at: [0, cy - 0.004, 0] });
    } else {
      // iron ring + filter funnel
      const ry = 0.2;
      bossClamp(T, root, ry, 0.07, -0.03);
      mesh(new THREE.TorusGeometry(0.032, 0.0025, 8, 32).rotateX(Math.PI / 2), M.metal('#9aa0a6'), { parent: root, at: [0, ry, 0] });
      const fo2 = [[0.0035, ry - 0.08], [0.0035, ry - 0.03], [0.034, ry + 0.012], [0.036, ry + 0.016]];
      mesh(vesselGeo(fo2, 0.0012, 28), glassMat(), { parent: root, name: 'funnel' });
      mesh(new THREE.ConeGeometry(0.03, 0.04, 24, 1, true).rotateX(Math.PI), fin(T, '#f6f4ee', 'matte'), { parent: root, at: [0, ry - 0.005, 0] });
      if (T.liq) mesh(liquidGeo(fo2, ry - 0.008, 0.0012, 28), liquidMat(T.liq), { parent: root });
    }
  } else if (variant === 'pipette-stand') {
    const m = fin(T, T.trim ? T.vintage ? '#6b4426' : '#eef0f3' : '#eef0f3', T.vintage ? 'wood' : 'plastic');
    mesh(new THREE.CylinderGeometry(0.08, 0.085, 0.015, 40), m, { parent: root, at: [0, 0.0075, 0] });
    rodY(0.015, 0.36, 0.008, m, root);
    mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.008, 40), m, { parent: root, at: [0, 0.32, 0] });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, rr = 0.06;
      const pg = group(`pipette${i}`, { parent: root, at: [Math.cos(a) * rr, 0.015, Math.sin(a) * rr] });
      const vol = i % 3 === 0;
      mesh(new THREE.CylinderGeometry(0.0035, 0.0012, 0.08, 10), glassMat(), { parent: pg, at: [0, 0.04, 0] });
      if (vol) mesh(new THREE.SphereGeometry(0.009, 16, 10).scale(1, 2.2, 1), glassMat(), { parent: pg, at: [0, 0.1, 0] });
      mesh(new THREE.CylinderGeometry(0.0035, 0.0035, vol ? 0.25 : 0.33, 10), glassMat(), { parent: pg, at: [0, vol ? 0.2 : 0.245, 0] });
      if (T.liq) mesh(new THREE.CylinderGeometry(0.0026, 0.001, 0.07, 8), liquidMat(T.liq2 ?? T.liq, { glow: T.glow ? 0.8 : 0 }), { parent: pg, at: [0, 0.042, 0] });
      // colour band
      mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.006, 10), M.matte(RAINBOW[i % 8]), { parent: pg, at: [0, 0.3, 0] });
    }
    if (T.boil || T.foil) slab(root, fin(T, '#2a2d33', 'plastic'), 0.03, 0.05, 0.03, { x: 0, y: 0.36, r: 0.006 });
  } else if (variant === 'dropper-set') {
    const tray = fin(T, T.vintage ? '#6b4426' : T.trim === 'school' ? '#ffc81e' : '#e9ebee', T.vintage ? 'wood' : 'plastic');
    slab(root, tray, 0.2, 0.012, 0.13, { r: 0.004 });
    for (const s of [-1, 1]) { slab(root, tray, 0.2, 0.025, 0.006, { z: s * 0.062, r: 0.002 }); slab(root, tray, 0.006, 0.025, 0.13, { x: s * 0.097, r: 0.002 }); }
    let k = 0;
    for (const x of [-0.06, 0, 0.06]) for (const z of [-0.03, 0.03]) {
      const b = group(`dropper${k}`, { parent: root, at: [x, 0.012, z] });
      const ob = [[0.018, 0], [0.02, 0.003], [0.02, 0.06], [0.009, 0.075], [0.009, 0.082]];
      mesh(vesselGeo(ob, 0.0015, 24), glassMat({ tint: k % 2 ? '#7a4a12' : '#ffffff' }), { parent: b });
      fill({ ...T, liq: T.trim && T.trim !== 'layered' ? T.liq : RAINBOW[k], frac: 0.6, boil: false, liq2: null }, b, ob, 0.08, 0.0015);
      mesh(lathe([[0, 0], [0.0105, 0], [0.0105, 0.01], [0.006, 0.012], [0.006, 0.02]], 16), fin(T, '#2a2d33', 'plastic'), { parent: b, at: [0, 0.079, 0] });
      mesh(new THREE.SphereGeometry(0.0075, 16, 10).scale(1, 1.6, 1), fin(T, T.vintage ? '#8a4a2c' : '#222', 'rubber'), { parent: b, at: [0, 0.106, 0] });
      sticker(b, 0.0202, 0.03, ['HCl', 'NaOH', 'Cu', 'Fe', 'KI', 'pH'][k], 0.022, 0.014);
      k++;
    }
  } else {
    // micropipettes on a linear stand
    const m = fin(T, T.trim === 'school' ? '#2b7de1' : T.vintage ? '#6b4426' : '#eef0f3', T.vintage ? 'wood' : 'plastic');
    slab(root, m, 0.26, 0.016, 0.1, { r: 0.006 });
    slab(root, m, 0.26, 0.24, 0.016, { z: -0.035, r: 0.004 });
    slab(root, m, 0.26, 0.012, 0.05, { y: 0.2, z: -0.012, r: 0.004 });
    const cols = ['#e53935', '#fdd835', '#1e88e5', '#43a047'];
    for (let i = 0; i < 4; i++) {
      const pg = group(`micropipette${i}`, { parent: root, at: [-0.09 + i * 0.06, 0.016, 0.005] });
      mesh(new THREE.CylinderGeometry(0.0025, 0.0006, 0.05, 10), M.plastic(T.trim === 'futuristic' ? '#22e1ff' : '#f4e7a6', 0.3), { parent: pg, at: [0, 0.03, 0] });
      mesh(new THREE.CylinderGeometry(0.006, 0.003, 0.06, 14), fin(T, '#d9dce1', 'plastic'), { parent: pg, at: [0, 0.084, 0] });
      mesh(roundedBox(0.026, 0.11, 0.022, 0.009), fin(T, T.trim === 'futuristic' ? '#16191f' : '#f2f3f5', 'plastic'), { parent: pg, at: [0, 0.165, -0.002] });
      mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.03, 14), fin(T, cols[i], 'plastic'), { parent: pg, at: [0, 0.232, -0.004] });
      mesh(roundedBox(0.012, 0.02, 0.003, 0.001), M.emissive('#9cff9c', T.trim === 'futuristic' ? 1 : 0.15), { parent: pg, at: [0, 0.17, 0.0095] });
    }
    // tip box
    slab(root, fin(T, '#1d4fa0', 'plastic'), 0.08, 0.05, 0.06, { x: 0.15 + 0.03, r: 0.004 });
  }
  return finishVessel(root, T, variant, o, anims);
}
