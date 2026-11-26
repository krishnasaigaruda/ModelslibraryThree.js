// Personal items: backpacks, handbags, wallets, phone cases.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, setup, done, fin, tm, hw, vessel, strap, ring, slab, clip, rotateTrack, pingPong, labelPlane, textDraw } from './common.js';
import { bagShell, rrPts, flat, circlePts } from './personal-util.js';

const lining = (T) => fin({ ...T, worn: 0 }, T.lux ? '#5a1426' : '#2a2a2e', 'fabric');
const hingeAnim = (name, node, axis, angle, period = 3) => () => [clip(name, period, [rotateTrack(node, axis, period, (t) => pingPong(t) * angle)])];

/** Zip pull: small tab hanging from a slider. */
function zipPull(parent, T, at, len = 0.025) {
  const g = group('zip-pull', { parent, at });
  mesh(roundedBox(0.012, 0.006, 0.01, 0.002), hw(T), { parent: g });
  mesh(roundedBox(0.008, len, 0.003, 0.0015), T.mat === 'leather' ? tm(T, 's') : hw(T), { parent: g, at: [0, -len / 2, 0.004] });
  return g;
}
/** Buckle: rectangular metal frame. */
function buckle(parent, T, at, w = 0.03, rot) {
  const m = mesh(flat(rrPts(w, w * 0.75, w * 0.12), 0.003, { holes: [rrPts(w * 0.7, w * 0.45, w * 0.06)] }), hw(T), { parent, at, rot: rot ?? [Math.PI / 2, 0, 0] });
  return m;
}

/* ================================ BACKPACK ================================ */

export const BACKPACK_VARIANTS = {
  'school-bag': {}, 'hiking-backpack': {}, 'drawstring-bag': {}, 'mini-backpack': { k: 0.66 }, 'laptop-backpack': {}, 'rolling-backpack': {},
};

export function createBackpack(options = {}) {
  const { o, variant, T } = setup(options, BACKPACK_VARIANTS, 'backpack', { p: '#2f5f9e', s: '#1c2430', a: '#f2a516', mat: 'nylon' });
  const root = group(`backpack-${variant}`);
  const k = T.k * (variant === 'mini-backpack' ? 0.66 : 1);
  const body = tm(T, 'p');
  const sec = tm(T, 's');
  const acc = fin(T, T.a, T.mat === 'leather' ? 'leather' : 'nylon');
  const inner = lining(T);
  const tall = variant === 'hiking-backpack';
  const laptop = variant === 'laptop-backpack';
  const W = 0.3 * k * T.w * (tall ? 0.95 : 1);
  const H = (tall ? 0.6 : laptop ? 0.44 : 0.42) * k * T.h;
  const D = (tall ? 0.22 : laptop ? 0.13 : 0.16) * k * T.d * (T.slim ? 0.85 : 1) * (T.chunky ? 1.12 : 1);
  const t = 0.005;
  const R = Math.min(D * 0.49, (laptop ? 0.03 : D * 0.42) * T.round);
  const yb = variant === 'rolling-backpack' ? 0.05 * k : 0;
  let anim;

  if (variant === 'drawstring-bag') {
    // thin gym sack: flat body, gathered mouth, cords running to the bottom corners
    const Wd = 0.36 * T.k * T.w, Hd = 0.44 * T.k * T.h, Dd = 0.05;
    const sg = cushion(Wd, Hd, 0.09, { radius: 0.035, bulge: 0.6 });
    const sp = sg.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const y = sp.getY(i) / Hd + 0.5; // 0 bottom … 1 top
      const pinch = y > 0.72 ? 1 - ((y - 0.72) / 0.28) ** 1.4 * 0.78 : 1;
      const wob = 1 + 0.03 * Math.sin(sp.getX(i) * 60 + y * 9) * (y > 0.72 ? 1 : 0.2);
      sp.setX(i, sp.getX(i) * pinch * wob); sp.setZ(i, sp.getZ(i) * (0.6 + 0.4 * pinch));
    }
    sg.computeVertexNormals();
    mesh(sg, body, { parent: root, at: [0, Hd / 2, 0], name: 'sack' });
    mesh(new THREE.TorusGeometry(Wd * 0.1, 0.008, 10, 24), body, { parent: root, at: [0, Hd * 0.88, 0], rot: [Math.PI / 2, 0, 0] });
    for (const s of [-1, 1]) {
      curveTube([[s * Wd * 0.08, Hd * 0.9, -0.012], [s * Wd * 0.3, Hd * 0.8, -0.035], [s * Wd * 0.47, Hd * 0.45, -0.035], [s * Wd * 0.46, 0.03, -0.02]], 0.004, sec, { parent: root, segments: 24 });
      mesh(roundedBox(0.03, 0.03, 0.012, 0.004), sec, { parent: root, at: [s * Wd * 0.46, 0.018, -0.015] });
    }
    if (T.detail) mesh(roundedBox(Wd * 0.35, Hd * 0.2, 0.004, 0.002), acc, { parent: root, at: [0, Hd * 0.35, 0.044] });
    return done(root, 'backpack', variant, o);
  }

  // main hollow compartment
  const Hs = H * 0.86;
  bagShell(W, Hs, D, t, body, { r: R, taper: tall ? 0.05 : 0.08, bulge: T.soft ? 0.08 : 0.04, parent: root, at: [0, yb, 0], name: 'main', innerMat: inner });
  // hinged lid (top flap / zip top) — opens backwards
  const hinge = group('lid', { parent: root, at: [0, yb + Hs, -D * 0.47] });
  const lidH = (tall ? 0.12 : 0.07) * k;
  const lidMat = tall || T.trim === 'leather' || T.trim === 'vintage' ? sec : body;
  mesh(cushion(W * 0.98, lidH, D * 1.02, { radius: Math.min(lidH * 0.48, R), bulge: 0.3 }), lidMat, { parent: hinge, at: [0, lidH * 0.42, D * 0.48] });
  if (tall || T.detail >= 2) {
    // flap strap down the front with buckle
    for (const s of tall ? [-1, 1] : [0]) {
      strap([[s * W * 0.22, lidH * 0.6, D * 0.99], [s * W * 0.22, -0.02 * k, D * 1.02], [s * W * 0.22, -0.09 * k, D * 1.03]], 0.022 * k, 0.003, acc, { parent: hinge });
      buckle(hinge, T, [s * W * 0.22, -0.07 * k, D * 1.04], 0.03 * k, [0, 0, 0]);
    }
  } else zipPull(hinge, T, [W * 0.32, lidH * 0.35, D * 1.0]);
  anim = hingeAnim('open', hinge, 'x', -1.9);

  // front pocket(s)
  const pw = W * (laptop ? 0.86 : 0.74), ph = Hs * (laptop ? 0.5 : 0.42);
  mesh(cushion(pw, ph, 0.06 * k, { radius: Math.min(0.025 * T.round, ph * 0.45), bulge: 0.2 }), sec === lidMat ? acc : sec, { parent: root, at: [0, yb + Hs * 0.3, D * 0.5 + 0.012 * k], name: 'pocket' });
  curveTube([[-pw * 0.42, yb + Hs * 0.3 + ph * 0.45, D * 0.5 + 0.03 * k], [0, yb + Hs * 0.3 + ph * 0.49, D * 0.5 + 0.033 * k], [pw * 0.42, yb + Hs * 0.3 + ph * 0.45, D * 0.5 + 0.03 * k]], 0.002, hw(T), { parent: root, segments: 16 });
  zipPull(root, T, [pw * 0.3, yb + Hs * 0.3 + ph * 0.46, D * 0.5 + 0.04 * k]);
  if (T.trim === 'kids') mesh(new THREE.SphereGeometry(0.035 * k, 16, 12), fin(T, T.a, 'plastic'), { parent: root, at: [0, yb + Hs * 0.3, D * 0.5 + 0.045 * k], scale: [1, 1, 0.35] });

  // side bottle pockets (mesh) on school/hiking
  if (!laptop) for (const s of [-1, 1]) {
    mesh(cushion(0.03 * k, Hs * 0.3, D * 0.75, { radius: 0.012, bulge: 0.15 }), fin(T, T.s, 'nylon'), { parent: root, at: [s * (W * 0.5 + 0.008), yb + Hs * 0.17, 0] });
  }
  // shoulder straps on the back
  for (const s of [-1, 1]) {
    const x = s * W * 0.22;
    strap([[x * 0.6, yb + Hs * 0.97, -D * 0.46], [x, yb + Hs * 0.9, -D * 0.5 - 0.03 * k], [x * 1.15, yb + Hs * 0.5, -D * 0.5 - 0.035 * k], [x * 1.4, yb + Hs * 0.12, -D * 0.5 - 0.006], [x * 1.45, yb + 0.02, -D * 0.46]], 0.055 * k, 0.014 * k, sec, { parent: root, name: 'strap' });
  }
  // top grab handle
  strap([[-0.04 * k, yb + Hs * 0.995, -D * 0.4], [0, yb + Hs + 0.03 * k, -D * 0.42], [0.04 * k, yb + Hs * 0.995, -D * 0.4]], 0.02 * k, 0.004, sec, { parent: root });
  // hiking: hip belt, sleeping-mat roll, compression straps
  if (tall) {
    for (const s of [-1, 1]) mesh(cushion(0.12 * k, 0.09 * k, 0.03 * k, { bulge: 0.2 }), sec, { parent: root, at: [s * (W * 0.5 + 0.03 * k), yb + 0.11 * k, -D * 0.25], rot: [0, s * 0.9, 0] });
    mesh(new THREE.CylinderGeometry(0.055 * k, 0.055 * k, W * 1.1, 24).rotateZ(Math.PI / 2), fin(T, T.a, 'rubber'), { parent: root, at: [0, 0.055 * k, D * 0.5 + 0.045 * k] });
    for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(0.058 * k, 0.004, 6, 24), sec, { parent: root, at: [s * W * 0.3, 0.055 * k, D * 0.5 + 0.045 * k], rot: [0, Math.PI / 2, 0] });
  }
  if (laptop) {
    curveTube([[-W * 0.45, yb + Hs * 0.96, D * 0.5], [-W * 0.5, yb + Hs * 0.5, D * 0.52], [-W * 0.45, yb + 0.03, D * 0.5]], 0.0025, hw(T), { parent: root, segments: 16 });
  }
  if (T.rugged || T.detail >= 2) {
    // daisy chain / loops on the front
    for (let i = 0; i < 4; i++) mesh(roundedBox(0.025 * k, 0.012 * k, 0.006, 0.002), acc, { parent: root, at: [0, yb + Hs * (0.74 + i * 0.05), D * 0.5 + 0.004 + 0.004 * Math.sin(i)] });
  }
  if (variant === 'rolling-backpack') {
    // wheels at the bottom back + telescopic handle up the back
    for (const s of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(0.035 * k, 0.035 * k, 0.025, 20).rotateZ(Math.PI / 2), M.rubber(), { parent: root, at: [s * W * 0.38, 0.035 * k, -D * 0.42] });
      mesh(roundedBox(0.04, 0.06 * k, 0.05, 0.01), sec, { parent: root, at: [s * W * 0.38, 0.06 * k, -D * 0.35] });
    }
    mesh(roundedBox(W * 0.95, 0.03, D * 0.9, 0.01), sec, { parent: root, at: [0, 0.035 * k, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.007, 0.007, Hs * 1.2, 10), M.metal('#9aa0a6', 0.3), { parent: root, at: [s * W * 0.18, yb + Hs * 0.6, -D * 0.5 - 0.045 * k] });
    mesh(roundedBox(W * 0.42, 0.025, 0.025, 0.01), M.plastic('#202022'), { parent: root, at: [0, yb + Hs * 1.2, -D * 0.5 - 0.045 * k] });
    mesh(roundedBox(W * 0.5, 0.025, 0.04, 0.008), M.plastic('#202022'), { parent: root, at: [0, yb + 0.05 * k, -D * 0.5 - 0.035 * k] });
  }
  return done(root, 'backpack', variant, o, anim);
}

/* ================================ HANDBAG ================================ */

export const HANDBAG_VARIANTS = { 'tote-bag': {}, 'shoulder-bag': {}, clutch: {}, 'crossbody-bag': {}, purse: {}, 'bucket-bag': {} };

export function createHandbag(options = {}) {
  const { o, variant, T } = setup(options, HANDBAG_VARIANTS, 'handbag', { p: '#8a3b2a', s: '#3a1d14', a: '#d6b45a', mat: 'leather' });
  const root = group(`handbag-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const sec = tm(T, 's', T.mat === 'canvas' || T.mat === 'velvet' ? 'leather' : undefined);
  const inner = lining(T);
  const met = hw(T);
  let anim;
  const R = (v) => v * T.round;

  if (variant === 'tote-bag') {
    const W = 0.36 * k * T.w, H = 0.3 * k * T.h, D = 0.14 * k * T.d;
    bagShell(W, H, D, 0.004, body, { r: Math.min(D * 0.45, R(0.02)), taper: -0.15, bulge: T.soft ? 0.05 : 0.02, parent: root, name: 'tote', innerMat: inner });
    for (const s of [-1, 1]) {
      const z = s * (D * 0.5 + 0.002);
      strap([[-W * 0.28, H * 0.55, z * 1.03], [-W * 0.27, H * 1.05, z * 1.01], [-W * 0.15, H * 1.4, z * 0.7], [W * 0.15, H * 1.4, z * 0.7], [W * 0.27, H * 1.05, z * 1.01], [W * 0.28, H * 0.55, z * 1.03]], 0.004, 0.026 * k, sec, { parent: root, segments: 48 });
      if (T.detail) for (const x of [-1, 1]) mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 12).rotateX(Math.PI / 2), met, { parent: root, at: [x * W * 0.28, H * 0.9, z * 1.05] });
    }
    if (T.mat === 'canvas' || T.pattern) mesh(roundedBox(W * 0.5, H * 0.35, 0.002, 0.001), fin(T, T.a, 'leather'), { parent: root, at: [0, H * 0.45, D * 0.5 * 1.04 + 0.002] });
  } else if (variant === 'bucket-bag') {
    const r = 0.11 * k * T.w, H = 0.26 * k * T.h;
    mesh(vessel([[r * 0.85, 0], [r * 0.95, 0.01], [r, H * 0.5], [r * 1.04, H]], 0.004, 0.005, 40), body, { parent: root, name: 'bucket' });
    mesh(vessel([[r * 0.8, 0.005], [r * 0.98, H * 0.97]], 0.0015, 0.006, 32), inner, { parent: root });
    mesh(new THREE.TorusGeometry(r * 1.03, 0.004, 8, 40), sec, { parent: root, at: [0, H * 0.9, 0], rot: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; mesh(new THREE.TorusGeometry(0.006, 0.0018, 6, 12), met, { parent: root, at: [Math.cos(a) * r * 1.035, H * 0.9, Math.sin(a) * r * 1.035], rot: [0, -a + Math.PI / 2, 0] }); }
    for (const s of [-1, 1]) curveTube([[0.02 * s, H * 0.9, r * 1.05], [0.03 * s, H * 0.7, r * 1.07], [0.035 * s, H * 0.55, r * 1.08]], 0.003, sec, { parent: root, segments: 10 });
    strap([[-r * 1.02, H * 0.85, 0], [-r * 1.1, H * 1.6, 0], [0, H * 2.1, 0], [r * 1.1, H * 1.6, 0], [r * 1.02, H * 0.85, 0]], 0.004, 0.02 * k, sec, { parent: root, segments: 40 });
  } else if (variant === 'purse') {
    // frame purse with kiss-lock clasp
    const W = 0.24 * k * T.w, H = 0.17 * k * T.h, D = 0.08 * k * T.d;
    bagShell(W, H, D, 0.004, body, { r: D * 0.48, taper: 0.2, bulge: 0.16, parent: root, name: 'purse', innerMat: inner });
    const fw = W * 0.82 * 1.0;
    const frame = curveTube([[-fw / 2, H * 0.97, 0], [-fw * 0.25, H * 1.02, 0], [fw * 0.25, H * 1.02, 0], [fw / 2, H * 0.97, 0]], 0.004, met, { parent: root, segments: 24 });
    void frame;
    for (const s of [-1, 1]) mesh(roundedBox(0.012, 0.03 * k, D * 0.55, 0.004), met, { parent: root, at: [s * fw * 0.5, H * 0.95, 0] });
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.008 * k, 14, 10), met, { parent: root, at: [s * 0.006, H * 1.02 + 0.009 * k, 0] });
    curveTube([[-fw * 0.42, H * 1.0, 0], [-fw * 0.38, H * 1.55, 0], [0, H * 1.75, 0], [fw * 0.38, H * 1.55, 0], [fw * 0.42, H * 1.0, 0]], 0.006, sec, { parent: root, segments: 32 });
  } else {
    // flap bags: shoulder-bag, clutch, crossbody-bag
    const dims = { 'shoulder-bag': [0.3, 0.2, 0.1], clutch: [0.27, 0.13, 0.045], 'crossbody-bag': [0.21, 0.15, 0.07] }[variant];
    const W = dims[0] * k * T.w, H = dims[1] * k * T.h, D = dims[2] * k * T.d;
    bagShell(W, H, D, 0.0035, body, { r: Math.min(D * 0.45, R(0.015)), taper: variant === 'clutch' ? 0 : 0.06, bulge: 0.03, parent: root, name: 'bag', innerMat: inner });
    const hinge = group('flap', { parent: root, at: [0, H, -D * 0.5] });
    const fl = variant === 'clutch' ? 0.75 : 0.6;
    // flap: top panel + front drop as one bent slab
    mesh(roundedBox(W * 1.01, 0.004, D * 1.02, 0.0018), sec, { parent: hinge, at: [0, 0.002, D * 0.51] });
    const front = group('flap-front', { parent: hinge, at: [0, 0.002, D * 1.02] });
    const fpts = variant === 'clutch' ? [[-W * 0.505, 0], [W * 0.505, 0], [W * 0.505, -H * 0.35], [0, -H * fl], [-W * 0.505, -H * 0.35]] : rrPts(W * 1.01, H * fl, R(0.02)).map(([x, y]) => [x, y - H * fl / 2]);
    mesh(flat(fpts, 0.004).rotateX(Math.PI / 2), sec, { parent: front, at: [0, 0, 0.002] });
    // clasp
    const cy = variant === 'clutch' ? -H * fl * 0.85 : -H * fl * 0.8;
    if (T.lux || T.detail >= 2) mesh(roundedBox(0.03 * k, 0.018 * k, 0.008, 0.004), met, { parent: front, at: [0, cy, 0.006] });
    else mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 20).rotateX(Math.PI / 2), met, { parent: front, at: [0, cy, 0.005] });
    anim = hingeAnim('open', hinge, 'x', -1.7);
    if (variant === 'shoulder-bag') {
      strap([[-W * 0.5, H * 0.85, 0], [-W * 0.55, H * 1.8, 0], [-W * 0.2, H * 2.6, 0], [W * 0.2, H * 2.6, 0], [W * 0.55, H * 1.8, 0], [W * 0.5, H * 0.85, 0]], 0.004, 0.03 * k, sec, { parent: root, segments: 48 });
      for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(0.012, 0.003, 8, 16), met, { parent: root, at: [s * W * 0.505, H * 0.82, 0], rot: [0, Math.PI / 2, 0] });
    } else if (variant === 'crossbody-bag') {
      // long thin strap lying in a loop on the floor behind the bag
      const pts = [[-W * 0.5, H * 0.8, 0], [-W * 0.6, H * 0.3, -0.02], [-W * 0.6, 0.004, -0.12], [-0.05, 0.004, -0.3], [0.15, 0.004, -0.28], [W * 0.6, 0.004, -0.12], [W * 0.6, H * 0.3, -0.02], [W * 0.5, H * 0.8, 0]];
      strap(pts, 0.016, 0.003, T.lux ? met : sec, { parent: root, segments: 64 });
    } else {
      // clutch: wrist loop
      curveTube([[W * 0.5, H * 0.6, 0], [W * 0.62, H * 0.3, 0.04], [W * 0.62, 0.006, 0.12], [W * 0.5, 0.006, 0.16], [W * 0.46, 0.006, 0.1], [W * 0.5, H * 0.2, 0.01]], 0.003, sec, { parent: root, segments: 40 });
    }
  }
  return done(root, 'handbag', variant, o, anim);
}

/* ================================ WALLET ================================ */

export const WALLET_VARIANTS = { bifold: {}, trifold: {}, 'card-holder': {}, 'coin-purse': {}, 'zip-wallet': {} };

const CARD_COLS = ['#2a5bd7', '#d4a017', '#1f9d55', '#c23a3a', '#5a5a5a', '#8a2be2'];

/** A leaf of a wallet (outer slab) with card slots on its inner (top) face. */
function leaf(parent, W, D, t, outer, cardMat, T, slots = 3) {
  mesh(roundedBox(W, t, D, Math.min(t * 0.45, 0.004 * T.round)), outer, { parent, at: [W / 2, t / 2, 0] });
  for (let i = 0; i < slots; i++) {
    const z = -D * 0.25 + i * D * 0.16;
    mesh(roundedBox(W * 0.86, 0.0012, D * 0.55, 0.0005), fin(T, CARD_COLS[(i + slots) % CARD_COLS.length], 'plastic'), { parent, at: [W * 0.5, t + 0.0006 + i * 0.0005, z - D * 0.12] });
    mesh(roundedBox(W * 0.9, 0.0016, D * 0.42, 0.0007), cardMat, { parent, at: [W * 0.5, t + 0.0018 + i * 0.0006, z + D * 0.07] });
  }
}

export function createWallet(options = {}) {
  const { o, variant, T } = setup(options, WALLET_VARIANTS, 'wallet', { p: '#4a2c1a', s: '#2a1810', a: '#c9a25a', mat: 'leather' });
  const root = group(`wallet-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const sec = tm(T, 's');
  const met = hw(T);
  let anim;

  if (variant === 'bifold' || variant === 'trifold') {
    const W = (variant === 'trifold' ? 0.08 : 0.11) * k * T.w, D = 0.09 * k * T.h, t = 0.004 * (T.chunky ? 1.4 : 1);
    // left leaf flat on the floor, right leaf hinged at spine (x=0), slightly open
    const L = group('left', { parent: root, rot: [0, Math.PI, 0] });
    leaf(L, W, D, t, body, sec, T, 3);
    const hinge = group('cover', { parent: root, rot: [0, 0, 0.35] });
    leaf(hinge, W, D, t, body, sec, T, variant === 'trifold' ? 2 : 3);
    mesh(new THREE.CylinderGeometry(t * 1.05, t * 1.05, D * 0.995, 16, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), body, { parent: root, at: [0, t, 0] });
    if (variant === 'trifold') {
      const h3 = group('flap3', { parent: hinge, at: [W, t, 0], rot: [0, 0, 2.4] });
      leaf(h3, W * 0.96, D * 0.98, t * 0.9, body, sec, T, 1);
    }
    if (T.detail >= 1) {
      // stitching around the outer leaf
      curveTube([[-W * 0.95, t + 0.0003, -D * 0.46], [-W * 0.05, t + 0.0003, -D * 0.46]], 0.0005, fin(T, T.a, 'fabric'), { parent: root, segments: 4 });
    }
    if (T.lux) mesh(roundedBox(0.012, 0.001, 0.006, 0.0004), met, { parent: root, at: [-W * 0.5, 0.0006, D * 0.3], rot: [0, 0, 0] });
    anim = hingeAnim('open', hinge, 'z', 1.2);
  } else if (variant === 'card-holder') {
    const W = 0.105 * k * T.w, D = 0.072 * k * T.h, t = 0.006;
    // lying flat: sleeve with two cards poking out of the top slot
    mesh(roundedBox(W, t, D, 0.0025 * T.round), body, { parent: root, at: [0, t / 2, 0] });
    for (let i = 0; i < 2; i++) mesh(roundedBox(0.0856 * Math.min(1, T.w), 0.0009, 0.054, 0.0004), fin(T, CARD_COLS[i], 'plastic'), { parent: root, at: [0, t + 0.0005 + i * 0.001, -D * 0.25 - i * 0.008] });
    mesh(roundedBox(W * 0.98, 0.0015, D * 0.45, 0.0007), sec, { parent: root, at: [0, t + 0.0026, D * 0.25] });
    if (T.detail) mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.001, 16), met, { parent: root, at: [W * 0.35, t + 0.0035, D * 0.32] });
  } else if (variant === 'coin-purse') {
    const W = 0.11 * k * T.w, H = 0.075 * k * T.h, D = 0.03 * k;
    mesh(cushion(W, H, D, { radius: D * 0.48 * T.round, bulge: 0.4 }), body, { parent: root, at: [0, H / 2, 0], scale: [1, 1, 1] });
    const fw = W * 0.8;
    mesh(roundedBox(fw, 0.006, D * 0.6, 0.0025), met, { parent: root, at: [0, H * 0.98, 0] });
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.0055, 12, 10), met, { parent: root, at: [s * 0.0045, H * 0.98 + 0.008, 0] });
    if (T.chunky) curveTube([[fw * 0.45, H * 0.98, 0], [fw * 0.62, H * 1.15, 0], [fw * 0.72, H * 0.8, 0]], 0.0015, met, { parent: root, segments: 10 });
  } else {
    // zip-wallet: long rounded wallet with a zip around three sides
    const W = 0.19 * k * T.w, D = 0.1 * k * T.h, t = 0.024 * (T.slim ? 0.7 : 1);
    mesh(cushion(W, t, D, { radius: Math.min(t * 0.45, 0.012 * T.round), bulge: 0.15 }), body, { parent: root, at: [0, t / 2, 0] });
    const zp = [[-W * 0.5, t * 0.5, D * 0.42], [-W * 0.5, t * 0.5, -D * 0.42], [-W * 0.42, t * 0.5, -D * 0.5], [W * 0.42, t * 0.5, -D * 0.5], [W * 0.5, t * 0.5, -D * 0.42], [W * 0.5, t * 0.5, D * 0.42]];
    curveTube(zp.map(([x, y, z]) => [x * 1.005, y, z * 1.005]), 0.0022, met, { parent: root, segments: 48 });
    zipPull(root, T, [W * 0.51, t * 0.5, D * 0.36], 0.02).rotation.set(0, 0, Math.PI / 2);
    if (T.detail >= 1) mesh(roundedBox(0.02, 0.001, 0.015, 0.0004), met, { parent: root, at: [-W * 0.3, t + D * 0.15 * 0.0 + 0.0005 + t * 0.15 * 0.5, 0] });
  }
  return done(root, 'wallet', variant, o, anim);
}

/* ================================ PHONE CASE ================================ */

export const PHONE_CASE_VARIANTS = { 'slim-case': {}, 'rugged-case': {}, 'wallet-case': {}, 'clear-case': {}, 'kids-case': {} };

function phoneBody(parent, W, L, t, at) {
  const g = group('phone', { parent, at });
  mesh(roundedBox(W, t, L, Math.min(t * 0.45, 0.004)), M.metal('#3a3d42', 0.3), { parent: g, at: [0, t / 2, 0] });
  const scr = labelPlane(W * 0.94, L * 0.96, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a6fd8'); gr.addColorStop(1, '#a24ad8'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#000'; c.fillRect(w * 0.4, h * 0.01, w * 0.2, h * 0.015); }, { bg: '#0b0d12', emissive: 0.8 });
  scr.name = 'screen';
  scr.rotation.x = -Math.PI / 2;
  scr.position.y = t + 0.0003;
  g.add(scr);
  return g;
}

export function createPhoneCase(options = {}) {
  const { o, variant, T } = setup(options, PHONE_CASE_VARIANTS, 'phone-case', { p: '#2b2d33', s: '#5a5f68', a: '#e8402f', mat: 'rubber' });
  const root = group(`phone-case-${variant}`);
  const big = T.k >= 1.2 ? 1.1 : T.k < 0.8 ? 0.9 : 1;
  const W = 0.072 * big, L = 0.148 * big, pt = 0.008;
  const rugged = variant === 'rugged-case' || T.rugged;
  const kids = variant === 'kids-case';
  const th = rugged ? 0.004 : kids ? 0.012 : 0.0015;
  const clear = variant === 'clear-case';
  const caseMat = clear ? fin(T, '#e8f2f4', 'glass') : kids ? fin(T, T.trim ? T.p : '#ff7a2a', 'rubber') : tm(T, 'p', T.mat === 'plastic' ? 'plastic' : undefined);
  // case lies face-down: the shell's back faces up, the phone (screen down) sits inside
  const shell = group('case', { parent: root });
  const CW = W + 2 * th, CL = L + 2 * th, CT = pt + th + 0.0012;
  // tray: back plate on top, side walls down to the floor (screen side open)
  mesh(roundedBox(CW, th + 0.0005, CL, Math.min(th * 0.45, 0.003) + 0.0002), caseMat, { parent: shell, at: [0, CT - (th + 0.0005) / 2, 0], name: 'back' });
  const wall = new THREE.Shape(rrPts(CW, CL, 0.009 + th).map(([x, y]) => new THREE.Vector2(x, y)));
  wall.holes.push(new THREE.Path(rrPts(W, L, 0.009).reverse().map(([x, y]) => new THREE.Vector2(x, y))));
  const wg = new THREE.ExtrudeGeometry(wall, { depth: CT - th * 0.5, bevelEnabled: false, curveSegments: 6 });
  wg.rotateX(-Math.PI / 2);
  mesh(wg, caseMat, { parent: shell, name: 'rim' });
  if (clear) phoneBody(root, W * 0.998, L * 0.998, pt, [0, 0.0012, 0]).rotation.set(0, 0, 0);
  else phoneBody(root, W * 0.998, L * 0.998, pt, [0, 0.0012, 0]);
  // phone colour visible through clear case: tinted back panel
  if (clear) mesh(roundedBox(W * 0.98, 0.0008, L * 0.98, 0.0003), fin(T, T.trim ? T.p : '#d9c6a5', 'gloss'), { parent: root, at: [0, pt + 0.0012 + 0.0004, 0] });
  // camera bump cut-out ring + lenses (top-left when seen from the back)
  const camX = W * 0.28, camZ = -L * 0.38;
  mesh(roundedBox(0.03, 0.002, 0.03, 0.008), M.plastic('#15161a', 0.3), { parent: root, at: [camX, CT + 0.001, camZ] });
  for (const [dx, dz] of [[-0.007, -0.007], [0.007, -0.007], [-0.007, 0.007]]) mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.0016, 18), M.glass({ tint: '#0a0c10' }), { parent: root, at: [camX + dx, CT + 0.0025, camZ + dz] });
  // design on the back
  if (T.pattern || T.trim === 'glitter' || variant === 'slim-case') {
    const back = mesh(roundedBox(CW * 0.9, 0.0004, CL * 0.9, 0.0002), T.pattern ? tm(T, 'p', 'plastic') : fin(T, T.s, T.mat === 'glitter' ? 'glitter' : 'plastic'), { parent: root, at: [0, CT + 0.0002, 0.012] });
    back.scale.set(1, 1, 0.8);
  }
  if (rugged) {
    // corner bumpers + ridged grip bands
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.SphereGeometry(0.0085, 14, 10), fin(T, T.s, 'rubber'), { parent: root, at: [sx * (CW / 2 - 0.004), CT * 0.55, sz * (CL / 2 - 0.004)], scale: [1, 0.85, 1] });
    for (let i = 0; i < 5; i++) mesh(roundedBox(CW * 0.7, 0.0015, 0.003, 0.0007), fin(T, T.s, 'rubber'), { parent: root, at: [0, CT + 0.0007, L * 0.1 + i * 0.012] });
    // kickstand
    mesh(roundedBox(0.035, 0.0025, 0.05, 0.002), M.metal('#7a7f86', 0.4), { parent: root, at: [0, CT + 0.0012, L * 0.1 - 0.03] });
  }
  if (kids) {
    // chunky foam handle that doubles as a stand
    const hy = CT * 0.5;
    curveTube([[-CW * 0.48, hy, CL * 0.48], [-CW * 0.25, hy + 0.004, CL * 0.48 + 0.035], [CW * 0.25, hy + 0.004, CL * 0.48 + 0.035], [CW * 0.48, hy, CL * 0.48]], 0.007, caseMat, { parent: root, segments: 24 });
  }
  let anim;
  if (variant === 'wallet-case') {
    // folio cover: lies open flat next to the phone, joined by a spine; card slots inside
    const cover = group('cover', { parent: root, at: [-CW / 2, 0, 0] });
    mesh(roundedBox(CW, 0.002, CL, 0.0009), caseMat, { parent: cover, at: [-CW / 2 - 0.006, 0.001, 0] });
    mesh(roundedBox(0.008, 0.0015, CL, 0.0007), caseMat, { parent: cover, at: [-0.003, 0.001, 0] });
    for (let i = 0; i < 3; i++) {
      mesh(roundedBox(CW * 0.82, 0.0009, 0.035, 0.0004), fin(T, CARD_COLS[i], 'plastic'), { parent: cover, at: [-CW / 2 - 0.006, 0.0025 + i * 0.0003, -CL * 0.3 + i * 0.022] });
      mesh(roundedBox(CW * 0.86, 0.0012, 0.028, 0.0005), tm(T, 's'), { parent: cover, at: [-CW / 2 - 0.006, 0.0032 + i * 0.0003, -CL * 0.3 + i * 0.022 + 0.01] });
    }
    if (T.detail) mesh(roundedBox(0.012, 0.004, 0.02, 0.002), tm(T, 'a'), { parent: cover, at: [-CW - 0.008, 0.002, 0] });
  }
  if (T.lux) mesh(roundedBox(0.03, 0.0006, 0.004, 0.0002), M.metal('#d6a93c', 0.2), { parent: root, at: [0, CT + 0.0004, L * 0.3] });
  return done(root, 'phone-case', variant, o, anim ?? (() => [clip('screen-on', 1, [new THREE.NumberKeyframeTrack('screen.material.emissiveIntensity', [0, 1], [1.2, 1.2])])]));
}
