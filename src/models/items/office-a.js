// Everyday items, office & school (part A): pens, pencils, stationery, notebooks, mail.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, extrudeOutline, setup, done, fin, tm, hw, openBox, ring, labelPlane, textDraw, canvasTex, clip, rotateTrack, moveTrack, pingPong, numberTrack } from './common.js';

/* ------------------------------ local helpers ------------------------------ */

const SOFT = ['leather', 'canvas', 'nylon', 'fabric', 'velvet', 'fur', 'silk', 'paper'];
/** Hard-object material for a role (soft trim families become glossy plastic/lacquer). */
export function hard(T, role = 'p', kind) {
  const k = kind ?? (SOFT.includes(T.mat) ? (T.trim === 'vintage' || T.trim === 'luxury' ? 'gloss' : 'plastic') : T.mat);
  return fin(T, T[role], k, { pattern: role === 'p' ? T.pattern : null });
}
/** Lathe around the X axis: profile [[r, x], ...]. */
export const latheX = (profile, seg = 24) => lathe(profile, seg).rotateZ(-Math.PI / 2);
/** Flat label lying face-up at height y. */
export function topLabel(parent, w, d, draw, at, opts = {}) {
  const l = labelPlane(w, d, draw, opts);
  l.rotation.x = -Math.PI / 2;
  l.position.set(...at);
  parent.add(l);
  return l;
}
const paperMat = (c = '#f6f4ee') => new THREE.MeshStandardMaterial({ name: 'paper', color: c, roughness: 0.9 });
const linesDraw = (bg = '#fbfaf5', line = '#9db8cf', margin = '#e07a7a') => (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = line; g.lineWidth = 1.5;
  for (let y = h * 0.12; y < h; y += h / 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  if (margin) { g.strokeStyle = margin; g.beginPath(); g.moveTo(w * 0.12, 0); g.lineTo(w * 0.12, h); g.stroke(); }
};
const scribble = (bg = '#fbfaf5', ink = '#203a6a', n = 12) => (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = ink; g.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const y = h * (0.12 + (i * 0.78) / n); g.beginPath(); g.moveTo(w * 0.1, y);
    for (let x = w * 0.1; x < w * (0.6 + ((i * 37) % 30) / 100); x += 6) g.lineTo(x, y + Math.sin(x * 0.5 + i) * 2);
    g.stroke();
  }
};

/* ================================== PENS ================================== */

export const PEN_VARIANTS = {
  'ballpoint-pen': { p: '#1d4fa8', s: '#1d4fa8', a: '#f2f2ef' },
  'click-pen': { p: '#222428', s: '#c9ccd2', a: '#3b6fd6' },
  'fountain-pen': { p: '#14161a', s: '#d6a93c', a: '#d6a93c' },
  marker: { p: '#1b1b1d', s: '#c42a2a', a: '#c42a2a' },
  highlighter: { p: '#e8f21a', s: '#2a2b2e', a: '#e8f21a' },
  'whiteboard-marker': { p: '#f4f3ef', s: '#2457b8', a: '#2457b8' },
  'felt-tip-pen': { p: '#f4f3ef', s: '#2f9a4a', a: '#2f9a4a' },
};

const PEN_DIM = { 'ballpoint-pen': [0.15, 0.0042], 'click-pen': [0.142, 0.0052], 'fountain-pen': [0.14, 0.0068], marker: [0.135, 0.0088], highlighter: [0.12, 0.009], 'whiteboard-marker': [0.135, 0.0095], 'felt-tip-pen': [0.14, 0.0046] };

/** Builds one pen lying along +X starting at x0 (y = axis height). Returns the group. */
export function buildPen(parent, variant, T, { at = [0, 0, 0], ink } = {}) {
  const g = group('pen', { parent, at });
  let [L, R] = PEN_DIM[variant];
  L *= T.k; R *= T.chunky ? 1.35 : T.slim ? 0.85 : 1;
  const body = hard(T, 'p');
  const cap = hard(T, 's');
  const metalM = T.lux || T.mat === 'gold' ? M.metal('#d6a93c', 0.2) : T.trim === 'vintage' ? M.metal('#b8913f', 0.35) : M.chrome();
  const inkM = M.plastic(ink ?? T.a, 0.4);
  const clipBar = (x0, x1, y) => {
    mesh(roundedBox(x1 - x0, R * 0.22, R * 0.7, R * 0.1), metalM, { parent: g, at: [(x0 + x1) / 2, y, 0], name: 'clip' });
    mesh(new THREE.SphereGeometry(R * 0.32, 10, 8), metalM, { parent: g, at: [x1 - R * 0.2, y - R * 0.1, 0] });
  };
  const band = (x, r, w = R * 0.6) => mesh(latheX([[0, x], [r, x], [r, x + w], [0, x + w]], 24), metalM, { parent: g });
  if (variant === 'ballpoint-pen') {
    mesh(latheX([[0, 0], [R * 0.8, 0], [R, R], [R, 0.8 * L], [0, 0.8 * L]], 6).rotateX(Math.PI / 6), M.plastic(T.p, 0.25), { parent: g, name: 'barrel' }).material.transparent = false;
    mesh(latheX([[0, -0.006], [R * 0.75, -0.006], [R * 0.75, 0.001], [0, 0.001]], 16), cap, { parent: g });
    mesh(latheX([[0, 0.7 * L], [R * 1.14, 0.7 * L], [R * 1.14, 0.97 * L], [R * 0.6, L], [0, L]], 24), cap, { parent: g, name: 'cap' });
    if (T.lux || T.detail) band(0.7 * L, R * 1.18);
    clipBar(0.74 * L, 0.95 * L, R * 1.25);
  } else if (variant === 'click-pen' || variant === 'felt-tip-pen') {
    const click = variant === 'click-pen';
    mesh(latheX([[0, 0], [R * 0.9, 0], [R, R * 1.5], [R, 0.84 * L], [0, 0.84 * L]], 24), body, { parent: g, name: 'barrel' });
    if (click) {
      mesh(latheX([[R, 0.58 * L], [R * 1.12, 0.6 * L], [R * 1.12, 0.8 * L], [R, 0.82 * L], [0, 0.82 * L], [0, 0.58 * L]], 24), M.plastic(T.trim ? T.a : '#2a2b2e', 0.85), { parent: g, name: 'grip' });
      mesh(latheX([[R, 0.84 * L], [R * 0.35, 0.96 * L], [R * 0.12, 0.985 * L], [0, 0.99 * L]], 24), metalM, { parent: g, name: 'tip' });
      mesh(latheX([[0, -0.012 * T.k], [R * 0.5, -0.012 * T.k], [R * 0.55, 0], [0, 0]], 16), metalM, { parent: g, name: 'plunger' });
      clipBar(0.02 * L, 0.36 * L, R * 1.12);
      if (T.detail) band(0.84 * L - R * 0.4, R * 1.03);
    } else {
      mesh(latheX([[0, 0.62 * L], [R * 1.12, 0.62 * L], [R * 1.12, 0.98 * L], [R * 0.7, L], [0, L]], 24), M.plastic(T.trim ? T.s : T.a, 0.35), { parent: g, name: 'cap' });
      mesh(latheX([[0, -0.004], [R * 0.85, -0.004], [R * 0.85, 0.001], [0, 0.001]], 16), M.plastic(T.trim ? T.s : T.a, 0.35), { parent: g });
      clipBar(0.66 * L, 0.92 * L, R * 1.2);
    }
  } else if (variant === 'fountain-pen') {
    // uncapped pen with nib; cap lies beside it
    mesh(latheX([[0, 0], [R * 0.7, 0], [R, 0.08 * L], [R, 0.55 * L], [R * 0.85, 0.6 * L], [0, 0.6 * L]], 32), body, { parent: g, name: 'barrel' });
    mesh(latheX([[R * 0.85, 0.6 * L], [R * 0.72, 0.64 * L], [R * 0.62, 0.72 * L], [R * 0.7, 0.74 * L], [0, 0.74 * L], [0, 0.6 * L]], 32), M.plastic('#111214', 0.3), { parent: g, name: 'section' });
    const nib = latheX([[R * 0.62, 0], [R * 0.4, 0.06 * L], [R * 0.08, 0.14 * L], [0, 0.145 * L]], 24);
    nib.scale(1, 0.45, 1);
    mesh(nib, metalM, { parent: g, at: [0.74 * L, R * 0.1, 0], name: 'nib' });
    band(0.55 * L, R * 1.03, R * 0.5);
    const cg = group('cap', { parent: g, at: [0.02 * L, 0, R * 3.2] });
    mesh(latheX([[0, 0], [R * 0.8, 0], [R * 1.12, 0.06 * L], [R * 1.12, 0.48 * L], [0, 0.48 * L]], 32), body, { parent: cg });
    mesh(latheX([[0, 0.4 * L], [R * 1.16, 0.4 * L], [R * 1.16, 0.46 * L], [0, 0.46 * L]], 32), metalM, { parent: cg });
    mesh(roundedBox(0.3 * L, R * 0.24, R * 0.7, R * 0.1), metalM, { parent: cg, at: [0.2 * L, R * 1.24, 0] });
    mesh(new THREE.SphereGeometry(R * 0.35, 10, 8), metalM, { parent: cg, at: [0.06 * L, R * 1.15, 0] });
  } else {
    // markers: fat body, ribbed cap, coloured end plug
    const flat = variant === 'highlighter';
    const bodyG = latheX([[0, 0], [R * 0.9, 0], [R, R], [R, 0.74 * L], [0, 0.74 * L]], 32);
    const capG = latheX([[0, 0.7 * L], [R * 1.1, 0.7 * L], [R * 1.1, 0.95 * L], [R * (flat ? 0.8 : 0.9), L], [0, L]], 32);
    if (flat) { bodyG.scale(1, 0.62, 1.1); capG.scale(1, 0.62, 1.1); }
    mesh(bodyG, body, { parent: g, name: 'barrel' });
    mesh(capG, cap, { parent: g, name: 'cap' });
    if (!flat) mesh(latheX([[0, -0.003], [R * 0.8, -0.003], [R * 0.8, 0.001], [0, 0.001]], 24), inkM, { parent: g });
    if (variant === 'marker') for (let i = 0; i < 4; i++) mesh(new THREE.TorusGeometry(R * 1.1, R * 0.06, 6, 24).rotateY(Math.PI / 2), cap, { parent: g, at: [0.76 * L + i * 0.012 * L * 1.5, 0, 0] });
    clipBar(0.74 * L, 0.94 * L, R * (flat ? 0.75 : 1.18));
    // printed band label
    if (!T.mat || T.mat === 'plastic' || !T.trim) {
      const lb = latheX([[R * 1.004, 0.25 * L], [R * 1.004, 0.55 * L], [0, 0.55 * L], [0, 0.25 * L]], 32);
      if (flat) lb.scale(1, 0.62, 1.1);
      mesh(lb, M.plastic(variant === 'whiteboard-marker' ? T.s : T.trim ? T.a : '#f4f3ef', 0.4), { parent: g });
    }
  }
  return g;
}

export function createPen(options = {}) {
  const { o, variant, T } = setup(options, PEN_VARIANTS, 'pen');
  const root = group(`pen-${variant}`);
  buildPen(root, variant, T);
  if (T.trim === 'kids' || T.trim === 'neon') {
    // multi-colour set: three pens side by side
    const cols = T.trim === 'kids' ? ['#ff4d6d', '#2b7de1', '#2fbf5a'] : ['#ff2bd6', '#2bf0ff', '#ffef2b'];
    cols.forEach((c, i) => buildPen(root, variant, { ...T, p: variant.includes('marker') || variant === 'felt-tip-pen' ? T.p : c, s: c, a: c }, { at: [0.004 * i, 0, (i + 1) * 0.026 * T.k * (T.chunky ? 1.35 : 1)] }));
  }
  return done(root, 'pen', variant, o);
}

/* ================================= PENCILS ================================= */

export const PENCIL_VARIANTS = {
  'wooden-pencil': { p: '#f2b81a', s: '#e88a9a', a: '#c9ccd2' },
  'mechanical-pencil': { p: '#2a5ca8', s: '#c9ccd2', a: '#1b1b1d' },
  'colored-pencils': { p: '#c9302c', s: '#2a3a8a', a: '#f4f3ef' },
  'pencil-case': { p: '#2d5a8a', s: '#1b1b1d', a: '#e8b23a', mat: 'canvas' },
  'pencil-sharpener': { p: '#d63a2a', s: '#c9ccd2', a: '#1b1b1d' },
};

/** Classic hexagonal wooden pencil lying along +X. */
export function woodPencil(parent, { L = 0.175, R = 0.0037, color = '#f2b81a', eraser = '#e88a9a', at = [0, 0, 0], ferrule, lead = '#2a2a2c', sharp = true, metalM } = {}) {
  const g = group('pencil', { parent, at });
  mesh(latheX([[0, 0], [R, 0], [R, 0.86 * L], [0, 0.86 * L]], 6).rotateX(Math.PI / 6), M.plastic(color, 0.35), { parent: g, name: 'pencil-body' });
  if (sharp) {
    mesh(latheX([[R * 0.98, 0.86 * L], [R * 0.32, 0.965 * L], [0, 0.965 * L]], 12), M.wood('#e2c28e'), { parent: g });
    mesh(latheX([[R * 0.33, 0.964 * L], [R * 0.05, L], [0, L]], 10), M.plastic(lead, 0.5), { parent: g });
  }
  if (ferrule !== false) {
    mesh(latheX([[0, -0.012], [R * 1.04, -0.012], [R * 1.04, 0.002], [0, 0.002]], 16), metalM ?? M.metal('#c9b77a', 0.3), { parent: g });
    mesh(latheX([[0, -0.021], [R * 0.85, -0.021], [R, -0.018], [R, -0.011], [0, -0.011]], 16), M.matte(eraser, 0.9), { parent: g });
  }
  return g;
}

export function createPencil(options = {}) {
  const { o, variant, T } = setup(options, PENCIL_VARIANTS, 'pencil');
  const root = group(`pencil-${variant}`);
  const k = T.k;
  const metalM = T.lux || T.mat === 'gold' ? M.metal('#d6a93c', 0.2) : T.trim === 'vintage' ? M.metal('#b8913f', 0.4) : M.metal('#c9ccd2', 0.25);
  const R0 = 0.0037 * (T.chunky ? 1.6 : T.slim ? 0.85 : 1);
  if (variant === 'wooden-pencil') {
    const n = T.trim === 'kids' ? 3 : 1;
    const cols = T.trim === 'kids' ? [T.p, T.s, T.a] : [T.p];
    for (let i = 0; i < n; i++) woodPencil(root, { L: 0.175 * k * (T.worn ? 0.6 : 1), R: R0, color: cols[i], eraser: T.trim === 'neon' ? T.a : '#e88a9a', at: [0.01 * i, R0, i * R0 * 2.4], metalM, sharp: true });
  } else if (variant === 'mechanical-pencil') {
    const L = 0.145 * k, R = 0.0045 * (T.chunky ? 1.4 : T.slim ? 0.85 : 1);
    const g = group('pencil', { parent: root, at: [0, R, 0] });
    mesh(latheX([[0, 0], [R, 0], [R, 0.86 * L], [0, 0.86 * L]], T.rugged ? 6 : 24), hard(T, 'p'), { parent: g });
    mesh(latheX([[R, 0.55 * L], [R * 1.1, 0.57 * L], [R * 1.1, 0.83 * L], [R, 0.85 * L], [0, 0.85 * L], [0, 0.55 * L]], 24), M.plastic('#2a2b2e', 0.85), { parent: g });
    mesh(latheX([[R, 0.86 * L], [R * 0.3, 0.96 * L], [R * 0.12, 0.965 * L], [R * 0.08, L], [0, L]], 24), metalM, { parent: g });
    mesh(latheX([[0, -0.016], [R * 0.75, -0.016], [R * 0.8, 0], [0, 0]], 16), metalM, { parent: g });
    mesh(roundedBox(0.045 * k, R * 0.22, R * 0.7, R * 0.1), metalM, { parent: g, at: [0.03 * k, R * 1.12, 0] });
  } else if (variant === 'colored-pencils') {
    // tin of 12 with lid open behind
    const n = T.trim === 'kids' ? 8 : T.lux ? 24 : 12;
    const L = 0.178 * k * (T.trim === 'kids' ? 0.7 : 1), R = R0;
    const W = L + 0.012, D = n > 12 ? (n / 2) * R * 2.05 + 0.008 : n * R * 2.05 + 0.008, H = (n > 12 ? 4 : 2.2) * R + 0.003;
    const tinM = T.mat === 'wood' ? M.wood(T.p) : T.mat === 'paper' || T.mat === 'canvas' ? fin(T, T.p, 'paper') : hard(T, 'p', T.mat === 'metal' || !T.trim ? 'metal' : undefined);
    openBox(W, H, D, 0.0008, tinM, { parent: root, r: 0.004, name: 'tin' });
    const rainbow = ['#d8262b', '#f07a1a', '#f6cf1d', '#8cc63e', '#1e9a46', '#1aa6c9', '#1d4fa8', '#5a2d91', '#d9468f', '#7a4a22', '#1b1b1d', '#f4f3ef'];
    for (let i = 0; i < n; i++) {
      const row = n > 12 ? Math.floor(i / (n / 2)) : 0, j = n > 12 ? i % (n / 2) : i;
      const pastel = T.trim === 'pastel' ? new THREE.Color(rainbow[i % 12]).lerp(new THREE.Color('#ffffff'), 0.45).getStyle() : rainbow[i % 12];
      woodPencil(root, { L: L * 0.94, R, color: pastel, lead: pastel, ferrule: false, at: [-L * 0.47, 0.0008 + R + row * R * 1.8, -D / 2 + 0.004 + R + j * R * 2.05 + row * R] });
    }
    const lid = group('lid', { parent: root, at: [0, H, -D / 2] });
    const lm = mesh(roundedBox(W + 0.002, 0.003, D + 0.002, 0.0012), tinM, { parent: lid, at: [0, 0.0015, D / 2] });
    topLabel(lm, W * 0.8, D * 0.7, (g2, w, h) => { const gr = g2.createLinearGradient(0, 0, w, 0); rainbow.forEach((c, i) => gr.addColorStop(i / 11, c)); g2.fillStyle = gr; g2.fillRect(0, 0, w, h); g2.fillStyle = '#fff'; g2.font = `bold ${h * 0.35}px sans-serif`; g2.textAlign = 'center'; g2.fillText('COLOURS', w / 2, h * 0.62); }, [0, 0.00155, 0]).rotation.x = -Math.PI / 2;
    lid.rotation.x = -1.95;
    return done(root, 'pencil', variant, o, () => [clip('open', 3, [rotateTrack(lid, 'x', 3, (t) => pingPong(t) * 1.9)])]);
  } else if (variant === 'pencil-case') {
    const W = 0.21 * k * T.w, H = 0.06 * k * T.h, D = 0.085 * k;
    if (T.mat === 'metal' || T.mat === 'plastic' && T.trim) {
      // hard tin / plastic box case, lid hinged open
      const m = hard(T, 'p');
      openBox(W, H * 0.6, D, 0.0012, m, { parent: root, r: 0.008 * T.round, name: 'case' });
      woodPencil(root, { L: W * 0.8, R: 0.0037, color: T.a, at: [-W * 0.4, 0.0012 + 0.0037, 0], metalM });
      const lid = group('lid', { parent: root, at: [0, H * 0.6, -D / 2] });
      const lidBox = openBox(W, H * 0.35, D, 0.0012, hard(T, 's'), { parent: lid, r: 0.008 * T.round, name: 'lid-shell', at: [0, 0, D / 2] });
      lidBox.rotation.x = Math.PI; lidBox.position.set(0, 0, D / 2);
      lid.rotation.x = -1.85;
      return done(root, 'pencil', variant, o, () => [clip('open', 3, [rotateTrack(lid, 'x', 3, (t) => pingPong(t) * 1.8)])]);
    }
    mesh(cushion(W, H, D, { radius: Math.min(H, D) * 0.45 * T.round, bulge: T.soft ? 0.25 : 0.15 }), tm(T, 'p'), { parent: root, at: [0, H / 2, 0], name: 'pouch' });
    const top = H * (1 + (T.soft ? 0.12 : 0.07));
    mesh(roundedBox(W * 0.9, 0.003, 0.008, 0.0012), M.plastic(T.s, 0.6), { parent: root, at: [0, top - 0.001, 0], name: 'zip' });
    const pull = group('zip-pull', { parent: root, at: [W * 0.4, top + 0.001, 0] });
    mesh(roundedBox(0.008, 0.003, 0.006, 0.001), hw(T), { parent: pull });
    mesh(roundedBox(0.006, 0.0015, 0.018, 0.0007), hw(T), { parent: pull, at: [0, -0.002, 0.011], rot: [0.5, 0, 0] });
    if (T.detail) mesh(roundedBox(W * 0.4, H * 0.5, 0.003, 0.0012), tm(T, 'a'), { parent: root, at: [-W * 0.15, H * 0.5, D / 2 + 0.002] });
  } else {
    // sharpener: block / barrel with a pencil in the hole
    const big = T.chunky || T.trim === 'kids';
    const W = 0.026 * k * (big ? 1.6 : 1), H = 0.016 * k * (big ? 1.8 : 1), D = 0.03 * k;
    const bm = T.mat === 'metal' ? M.metal('#b9bec6', 0.3) : hard(T, 'p');
    if (big) mesh(lathe([[0, 0], [H * 0.5, 0], [H * 0.55, D * 0.1], [H * 0.55, D], [0, D]], 32).rotateX(Math.PI / 2), bm, { parent: root, at: [0, H * 0.55, D / 2], name: 'canister' });
    else mesh(roundedBox(W, H, D, 0.002 * T.round), bm, { parent: root, at: [0, H / 2, 0], name: 'block' });
    mesh(roundedBox(W * 0.8, 0.0012, D * 0.55, 0.0004), M.metal('#d8dbe0', 0.15), { parent: root, at: [0, (big ? H * 1.1 : H) + 0.0004, 0], name: 'blade' });
    mesh(new THREE.CylinderGeometry(0.0014, 0.0014, 0.002, 12), M.metal('#9aa0a6', 0.3), { parent: root, at: [0, (big ? H * 1.1 : H) + 0.0012, -D * 0.12] });
    mesh(new THREE.CircleGeometry(0.0045, 20), M.matte('#111111'), { parent: root, at: [0, H * 0.55, D / 2 + 0.0003] });
    woodPencil(root, { L: 0.12 * k, R: 0.0037, color: T.trim ? T.a : '#f2b81a', at: [0, H * 0.55, D / 2 + 0.11 * k - 0.004], metalM }).rotation.y = Math.PI / 2;
  }
  return done(root, 'pencil', variant, o);
}

/* =============================== STATIONERY =============================== */

export const STATIONERY_VARIANTS = {
  eraser: { p: '#f2a2b2', s: '#2457b8', a: '#f4f3ef' },
  ruler: { p: '#e9e2c8', s: '#1b1b1d', a: '#c42a2a', mat: 'plastic' },
  scissors: { p: '#d63a2a', s: '#c9ccd2', a: '#1b1b1d' },
  stapler: { p: '#c42a2a', s: '#2a2b2e', a: '#c9ccd2' },
  'tape-dispenser': { p: '#2a2b2e', s: '#c9ccd2', a: '#e8e2c4' },
  'glue-stick': { p: '#f4f3ef', s: '#7a3db8', a: '#f2c21a' },
  'paper-clips': { p: '#c9ccd2', s: '#d63a2a', a: '#2457b8', mat: 'metal' },
  'binder-clip': { p: '#1b1b1d', s: '#c9ccd2', a: '#c42a2a' },
  'sticky-notes': { p: '#f6e46a', s: '#f2a2b2', a: '#8fd6e8', mat: 'paper' },
  'push-pins': { p: '#d63a2a', s: '#c9a878', a: '#2457b8' },
  'hole-punch': { p: '#2a2b2e', s: '#c9ccd2', a: '#c42a2a' },
};

function scissorsGeo(k, chunky) {
  const blade = new THREE.Shape();
  blade.moveTo(0, -0.0045 * k); blade.quadraticCurveTo(0.05 * k, -0.004 * k, 0.095 * k, 0.0005 * k);
  blade.quadraticCurveTo(0.05 * k, 0.0055 * k, 0, 0.006 * k); blade.lineTo(-0.03 * k, 0.004 * k); blade.lineTo(-0.03 * k, -0.002 * k); blade.lineTo(0, -0.0045 * k);
  const R = (chunky ? 0.02 : 0.016) * k;
  const loop = new THREE.Shape(); loop.absellipse(0, 0, R * 1.3, R, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path(); hole.absellipse(0, 0, R * 0.9, R * 0.62, 0, Math.PI * 2, true, 0); loop.holes.push(hole);
  return { blade, loop, R };
}

export function createStationery(options = {}) {
  const { o, variant, T } = setup(options, STATIONERY_VARIANTS, 'stationery');
  const root = group(`stationery-${variant}`);
  const k = T.k;
  const body = hard(T, 'p');
  let anims = [];
  if (variant === 'eraser') {
    const W = 0.06 * k * T.w, H = 0.012 * k * (T.chunky ? 1.4 : 1), D = 0.022 * k;
    const rub = M.matte(T.trim ? T.p : '#f4f3ef', 0.92);
    const worn = T.worn ? 0.75 : 1;
    if (T.round > 1.3) mesh(cushion(W * worn, H, D, { radius: H * 0.45, bulge: 0.1 }), rub, { parent: root, at: [0, H / 2, 0] });
    else mesh(roundedBox(W * worn, H, D, H * 0.12 * T.round), rub, { parent: root, at: [0, H / 2, 0], name: 'eraser' });
    // card sleeve
    mesh(roundedBox(W * 0.55, H + 0.0012, D + 0.0012, Math.min(0.0015, H * 0.12 * T.round + 0.0006)), M.matte(T.trim ? T.s : '#2457b8', 0.7), { parent: root, at: [W * 0.14, H / 2, 0], name: 'sleeve' });
  } else if (variant === 'ruler') {
    const L = 0.31 * k * (T.trim === 'kids' ? 0.55 : 1), W = 0.032 * T.w * (T.chunky ? 1.2 : 1), t = T.mat === 'metal' ? 0.0012 : T.mat === 'wood' ? 0.004 : 0.0022;
    const rm = T.mat === 'metal' ? M.metal('#c9ced4', 0.25) : T.mat === 'wood' ? M.wood(T.p) : T.trim === 'neon' ? fin(T, T.p, 'plastic') : new THREE.MeshPhysicalMaterial({ name: 'acrylic', color: T.p, roughness: 0.2, clearcoat: 1 });
    mesh(roundedBox(L, t, W, Math.min(t * 0.45, 0.001 * T.round)), rm, { parent: root, at: [0, t / 2, 0], name: 'ruler' });
    const ticks = (g, w, h) => {
      g.fillStyle = T.mat === 'metal' ? '#c9ced4' : T.mat === 'wood' ? M.toColor(T.p).getStyle() : M.toColor(T.p).getStyle(); g.fillRect(0, 0, w, h);
      g.fillStyle = T.trim === 'black' ? '#f4f3ef' : '#1b1b1d';
      const n = Math.round(L * 1000);
      for (let i = 0; i <= n; i++) { const x = (i / n) * w; const len = i % 10 === 0 ? 0.42 : i % 5 === 0 ? 0.3 : 0.18; g.fillRect(x, 0, 1, h * len); if (i % 10 === 0 && i > 0 && i < n) { g.font = `${h * 0.22}px sans-serif`; g.fillText(String(i / 10), x - 4, h * 0.65); } }
    };
    const l = topLabel(root, L * 0.97, W * 0.9, ticks, [0, t + 0.0002, 0], { px: 1024 });
    if (T.mat !== 'metal') mesh(new THREE.CylinderGeometry(0.003, 0.003, t * 1.02, 16), M.matte('#d6d4cd'), { parent: root, at: [-L / 2 + 0.008, t / 2, 0] });
  } else if (variant === 'scissors') {
    const { blade, loop, R } = scissorsGeo(k, T.chunky);
    const bm = T.lux ? M.metal('#d6a93c', 0.2) : M.metal('#cfd3d8', 0.18);
    const hm = T.mat === 'metal' ? M.metal('#b9bec6', 0.3) : hard(T, 'p');
    const open = 0.1;
    for (const s of [-1, 1]) {
      const half = group(s < 0 ? 'blade-l' : 'blade-r', { parent: root, at: [0, 0.002 + (s > 0 ? 0.0021 : 0), 0], rot: [0, s * open, 0] });
      mesh(extrudeOutline(blade, 0.0018, { bevel: 0.0004, segments: 1 }).rotateX(Math.PI / 2), bm, { parent: half });
      mesh(extrudeOutline(loop, 0.005, { bevel: 0.0015, segments: 2 }).rotateX(Math.PI / 2), hm, { parent: half, at: [-0.03 * k - R * 1.0, 0.0005, s * R * 0.8], rot: [0, -s * 0.25, 0], name: s < 0 ? 'handle-l' : 'handle-r' });
    }
    mesh(new THREE.CylinderGeometry(0.0028 * k, 0.0028 * k, 0.0065, 16), M.metal('#9aa0a6', 0.3), { parent: root, at: [0, 0.003, 0], name: 'pivot' });
    const l = root.getObjectByName('blade-l'), r = root.getObjectByName('blade-r');
    anims = () => [clip('snip', 1, [rotateTrack(l, 'y', 1, (t) => pingPong(t) * 0.16), rotateTrack(r, 'y', 1, (t) => -pingPong(t) * 0.16)])];
  } else if (variant === 'stapler') {
    const L = 0.15 * k * (T.chunky ? 1.25 : 1), W = 0.034 * k * T.w, H = 0.012 * k;
    mesh(roundedBox(L, H, W, H * 0.4 * T.round), M.plastic(T.trim === 'metal' ? '#2a2b2e' : T.s, 0.5), { parent: root, at: [0, H / 2, 0], name: 'base' });
    mesh(roundedBox(0.03 * k, 0.0012, W * 0.6, 0.0005), M.metal('#c9ccd2', 0.2), { parent: root, at: [L / 2 - 0.022 * k, H + 0.0005, 0], name: 'anvil' });
    mesh(roundedBox(0.03 * k, H * 1.6, W * 0.9, H * 0.3), M.plastic(T.s, 0.5), { parent: root, at: [-L / 2 + 0.017 * k, H + H * 0.7, 0], name: 'hinge' });
    const arm = group('arm', { parent: root, at: [-L / 2 + 0.014 * k, H * 2.1, 0] });
    mesh(roundedBox(L * 0.97, H * 1.5, W * 0.98, H * 0.6 * T.round), T.mat === 'metal' ? M.metal('#b9bec6', 0.3) : body, { parent: arm, at: [L * 0.47, H * 0.75, 0], name: 'top' });
    mesh(roundedBox(L * 0.8, H * 0.6, W * 0.7, H * 0.2), M.metal('#9aa0a6', 0.25), { parent: arm, at: [L * 0.45, -H * 0.05, 0], name: 'magazine' });
    if (T.detail) mesh(roundedBox(L * 0.5, 0.0015, W * 0.5, 0.0006), M.plastic(T.a, 0.6), { parent: arm, at: [L * 0.55, H * 1.5 + 0.0006, 0] });
    arm.rotation.z = 0.06;
    anims = () => [clip('press', 1, [rotateTrack(arm, 'z', 1, (t) => -pingPong(t) * 0.07)])];
  } else if (variant === 'tape-dispenser') {
    const S = k * (T.chunky ? 1.2 : 1), D = 0.05 * S * T.w;
    const pts = [[-0.075, 0], [0.07, 0], [0.075, 0.006], [0.07, 0.045], [0.05, 0.05], [0.035, 0.05], [0.018, 0.034], [-0.058, 0.034], [-0.075, 0.03], [-0.08, 0.015]].map(([x, y]) => [x * S, y * S]);
    mesh(extrudeOutline(pts, D, { bevel: 0.004 * S }), T.mat === 'metal' ? M.metal('#8e939a', 0.35) : body, { parent: root, name: 'dispenser' });
    const tapeM = new THREE.MeshPhysicalMaterial({ name: 'tape', color: T.trim === 'kids' ? T.s : '#e8e2c4', roughness: 0.2, transmission: 0, transparent: true, opacity: 0.85, clearcoat: 1 });
    const roll = group('tape-roll', { parent: root, at: [-0.022 * S, 0.062 * S, 0] });
    mesh(lathe([[0.012 * S, -D * 0.38], [0.03 * S, -D * 0.38], [0.03 * S, D * 0.38], [0.012 * S, D * 0.38], [0.012 * S, -D * 0.38]], 40).rotateX(Math.PI / 2), tapeM, { parent: roll });
    mesh(lathe([[0.011 * S, -D * 0.4], [0.0125 * S, -D * 0.4], [0.0125 * S, D * 0.4], [0.011 * S, D * 0.4], [0.011 * S, -D * 0.4]], 32).rotateX(Math.PI / 2), M.matte('#c9a878'), { parent: roll });
    mesh(new THREE.CylinderGeometry(0.011 * S, 0.011 * S, D * 0.9, 24).rotateX(Math.PI / 2), M.plastic(T.s, 0.4), { parent: roll });
    mesh(roundedBox(0.062 * S, 0.0006, D * 0.74, 0.0002), tapeM, { parent: root, at: [0.016 * S, 0.073 * S, 0], rot: [0, 0, -0.6] });
    mesh(roundedBox(0.006 * S, 0.012 * S, D * 0.8, 0.001), M.metal('#c9ccd2', 0.3), { parent: root, at: [0.043 * S, 0.054 * S, 0], name: 'cutter' });
    anims = () => [clip('spin', 2, [rotateTrack(roll, 'z', 2, (t) => -t * Math.PI * 2)])];
  } else if (variant === 'glue-stick') {
    const R = 0.0105 * k * (T.chunky ? 1.3 : T.slim ? 0.75 : 1), H = 0.1 * k * T.h;
    mesh(lathe([[0, 0], [R * 0.95, 0], [R, 0.004], [R, H * 0.72], [0, H * 0.72]], 32), M.plastic(T.trim ? T.p : '#f4f3ef', 0.35), { parent: root, name: 'tube' });
    mesh(lathe([[0, -0.0005], [R * 0.85, 0], [R * 0.85, 0.008], [0, 0.008]], 24), M.plastic(T.s, 0.4), { parent: root, at: [0, 0, 0], name: 'twist' });
    const cap = group('cap', { parent: root, at: [0, H * 0.7, 0] });
    mesh(lathe([[0, 0], [R * 1.06, 0], [R * 1.06, H * 0.28], [R * 0.9, H * 0.3], [0, H * 0.3]], 32), M.plastic(T.s, 0.35), { parent: cap });
    mesh(lathe([[R * 1.004, H * 0.15], [R * 1.004, H * 0.6], [0, H * 0.6], [0, H * 0.15]], 32), M.plastic(T.a, 0.4), { parent: root, name: 'label' });
    anims = () => [clip('open', 2, [moveTrack(cap, 2, (t) => [0, pingPong(t) * 0.03, 0])])];
  } else if (variant === 'paper-clips') {
    const n = T.trim === 'kids' ? 6 : T.chunky ? 3 : 5;
    const r = 0.0005 * (T.chunky ? 1.6 : 1);
    const L = 0.032 * k, w = 0.008 * k;
    const shape = [[0, 0], [L * 0.8, 0], [L, w * 0.5], [L * 0.8, w], [L * 0.1, w], [-L * 0.02, w * 0.5], [L * 0.1, w * 0.17], [L * 0.7, w * 0.17], [L * 0.82, w * 0.5], [L * 0.7, w * 0.8], [L * 0.25, w * 0.8]];
    const cols = T.trim === 'kids' || T.trim === 'neon' || T.trim === 'pastel' ? [T.p, T.s, T.a, '#2fbf5a', '#f07a1a', '#9a4ad6'] : null;
    for (let i = 0; i < n; i++) {
      const a = i * 1.3, cx = Math.cos(a) * 0.012 * (i ? 1 : 0), cz = Math.sin(a) * 0.012 * (i ? 1 : 0);
      const m = cols ? fin(T, cols[i % cols.length], 'plastic') : T.lux ? M.metal('#d6a93c', 0.2) : T.trim === 'black' ? M.metal('#2a2b2e', 0.3) : M.metal('#c9ccd2', 0.2);
      const c = curveTube(shape.map(([x, z]) => [x - L / 2, 0, z - w / 2]), r * (cols ? 1.4 : 1), m, { parent: root, segments: 64, radialSegments: 6 });
      c.position.set(cx, r * (cols ? 1.4 : 1) + (i > 2 ? r * 2 : 0), cz); c.rotation.y = a * 0.8;
    }
    if (T.detail) {
      // small dish holding them
      mesh(lathe([[0, 0], [0.03, 0], [0.04, 0.012], [0.039, 0.0125], [0.029, 0.0015], [0, 0.0015]], 40), M.plastic(T.trim === 'metal' ? '#3d4045' : T.s, 0.3), { parent: root, at: [0, -0.0015, 0] });
    }
  } else if (variant === 'binder-clip') {
    const S = 0.032 * k * (T.chunky ? 1.4 : 1);
    const prof = [[-S / 2, 0], [S / 2, 0], [S * 0.06, S * 0.38], [S * 0.06, S * 0.4], [-S * 0.06, S * 0.4], [-S * 0.06, S * 0.38]];
    const cm = T.trim ? hard(T, 'p', T.mat === 'metal' ? 'metal' : 'gloss') : M.paint('#141414', { metallic: 0.6, roughness: 0.3 });
    mesh(extrudeOutline(prof, S, { bevel: 0.0005, segments: 1 }), cm, { parent: root, at: [0, 0, 0], name: 'clip' });
    const wm = M.metal('#cfd3d8', 0.2);
    for (const s of [-1, 1]) curveTube([[s * S * 0.07, S * 0.37, S * 0.42], [s * S * 0.25, S * 0.65, S * 0.4], [s * S * 0.25, S * 0.85, S * 0.2], [s * S * 0.25, S * 0.85, -S * 0.2], [s * S * 0.25, S * 0.65, -S * 0.4], [s * S * 0.07, S * 0.37, -S * 0.42]], 0.0007 * (T.chunky ? 1.5 : 1), wm, { parent: root, segments: 32, radialSegments: 6 });
    // clamped paper stack
    mesh(roundedBox(S * 1.4, 0.003, 0.09 * k, 0.0005), paperMat(), { parent: root, at: [0, 0.0015, 0.02 * k], rot: [0, 0, 0], name: 'papers' }).visible = !!T.detail;
  } else if (variant === 'sticky-notes') {
    const S = 0.076 * k * (T.trim === 'kids' ? 0.7 : 1), H = 0.012 * k * (T.chunky ? 1.8 : 1);
    const pads = T.trim === 'neon' || T.trim === 'pastel' || T.trim === 'kids' ? [T.p, T.s, T.a] : [T.p];
    pads.forEach((c, i) => {
      const g = group(`pad-${i}`, { parent: root, at: [i * S * 0.18, i * H, i * S * 0.12], rot: [0, i * 0.25, 0] });
      const shape = T.round > 1.4 ? new THREE.CylinderGeometry(S / 2, S / 2, H, 40) : roundedBox(S, H, S, 0.0006);
      mesh(shape, fin(T, c, 'paper'), { parent: g, at: [0, H / 2, 0] });
      if (i === pads.length - 1) {
        // top sheet lifting at the corner
        const sh = new THREE.PlaneGeometry(S, S, 8, 8).rotateX(-Math.PI / 2);
        const p = sh.attributes.position;
        for (let j = 0; j < p.count; j++) { const u = (p.getX(j) / S + 0.5), v = (p.getZ(j) / S + 0.5); p.setY(j, Math.max(0, u + v - 1.1) ** 2 * S * 0.35); }
        sh.computeVertexNormals();
        const top = mesh(sh, fin(T, c, 'paper'), { parent: g, at: [0, H + 0.0003, 0], name: 'top-sheet' });
        top.material.side = THREE.DoubleSide;
        if (T.round > 1.4) top.visible = false;
        if (typeof document !== 'undefined') {
          const l = topLabel(g, S * 0.7, S * 0.4, (g2, w, h) => { g2.fillStyle = M.toColor(c).getStyle(); g2.fillRect(0, 0, w, h); scribble(M.toColor(c).getStyle(), '#203a6a', 3)(g2, w, h); }, [0, H + 0.0005, -S * 0.1]);
          void l;
        }
      }
    });
  } else if (variant === 'push-pins') {
    const S = 0.09 * k, H = 0.01 * k;
    mesh(roundedBox(S, H, S * 0.75, 0.002), new THREE.MeshStandardMaterial({ name: 'cork', color: '#c49a62', roughness: 1 }), { parent: root, at: [0, H / 2, 0], name: 'cork' });
    const cols = T.trim === 'metal' ? ['#c9ccd2'] : T.trim === 'black' ? ['#1b1b1d', '#3d4045'] : T.trim === 'pastel' ? ['#f6b7c8', '#b9dcd2', '#f4e3a1', '#c9b7e8'] : ['#d63a2a', '#2457b8', '#2fbf5a', '#f2c21a', '#f4f3ef'];
    const R = T.rugged || T.chunky ? 0.0055 : 0.004;
    for (let i = 0; i < 7; i++) {
      const g = group('pin', { parent: root, at: [(((i * 37) % 9) / 9 - 0.45) * S * 0.85, H, (((i * 53) % 7) / 7 - 0.43) * S * 0.6], rot: [((i % 3) - 1) * 0.12, 0, ((i % 2) - 0.5) * 0.15] });
      mesh(new THREE.CylinderGeometry(0.0005, 0.0005, 0.012, 6), M.metal('#cfd3d8', 0.2), { parent: g, at: [0, 0, 0] });
      const head = T.trim === 'kids' ? new THREE.SphereGeometry(R * 1.1, 16, 12) : lathe([[0, 0], [R * 0.5, 0], [R * 0.45, R], [R * 0.6, R * 1.6], [R * 1.1, R * 1.8], [R * 1.1, R * 2.3], [0, R * 2.4]], 20);
      mesh(head, fin(T, cols[i % cols.length], T.trim === 'metal' ? 'metal' : 'gloss'), { parent: g, at: [0, T.trim === 'kids' ? R * 1.6 : 0.0015, 0] });
    }
  } else {
    // hole punch
    const L = 0.13 * k * T.w, W = 0.06 * k, H = 0.018 * k;
    mesh(roundedBox(L, H, W, 0.004 * T.round), M.plastic(T.trim === 'metal' ? '#3d4045' : T.s, 0.5), { parent: root, at: [0, H / 2, 0], name: 'base' });
    mesh(roundedBox(L * 0.9, 0.003, W * 0.85, 0.001), M.plastic('#1b1b1d', 0.6), { parent: root, at: [0, 0.0015, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.008, 0.009, H * 0.9, 20), M.metal('#9aa0a6', 0.3), { parent: root, at: [s * L * 0.25, H * 1.4, -W * 0.12] });
    const arm = group('lever', { parent: root, at: [0, H * 1.85, -W * 0.38] });
    mesh(roundedBox(L * 0.95, H * 0.7, W * 0.9, H * 0.3 * T.round), T.mat === 'metal' ? M.metal('#b9bec6', 0.3) : body, { parent: arm, at: [0, 0, W * 0.42], rot: [0.12, 0, 0], name: 'handle' });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, L * 0.95, 12).rotateZ(Math.PI / 2), M.metal('#9aa0a6', 0.3), { parent: arm });
    mesh(roundedBox(0.014, 0.004, W * 0.6, 0.0015), M.plastic('#1b1b1d', 0.4), { parent: root, at: [0, H + 0.0012, W * 0.3] });
    anims = () => [clip('press', 1, [rotateTrack(arm, 'x', 1, (t) => pingPong(t) * 0.12)])];
  }
  return done(root, 'stationery', variant, o, anims);
}

/* ================================ NOTEBOOKS ================================ */

export const NOTEBOOK_VARIANTS = {
  'spiral-notebook': { p: '#2f7ac9', s: '#f6f4ee', a: '#c9ccd2' },
  'composition-book': { p: '#1b1b1d', s: '#f6f4ee', a: '#1b1b1d' },
  journal: { p: '#5a2a1a', s: '#efe6d2', a: '#c42a2a', mat: 'leather' },
  notepad: { p: '#f6e46a', s: '#8a1f2a', a: '#9db8cf', mat: 'paper' },
  folder: { p: '#e1c68f', s: '#f6f4ee', a: '#1b1b1d', mat: 'paper' },
  'ring-binder': { p: '#2457b8', s: '#f6f4ee', a: '#c9ccd2' },
  clipboard: { p: '#9a6a3c', s: '#f6f4ee', a: '#c9ccd2', mat: 'wood' },
};

const marbleTex = (bg, fg) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  let s = 7; const R = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) { g.fillStyle = i % 2 ? fg : bg; g.beginPath(); g.ellipse(R() * w, R() * h, 2 + R() * 9, 1 + R() * 5, R() * 3, 0, 7); g.fill(); }
});

export function createNotebook(options = {}) {
  const { o, variant, T } = setup(options, NOTEBOOK_VARIANTS, 'notebook');
  const root = group(`notebook-${variant}`);
  const k = T.k;
  const coverM = T.mat === 'wood' ? M.wood(T.p) : tm(T, 'p', T.mat === 'plastic' ? 'gloss' : T.mat === 'leather' || T.mat === 'paper' || T.mat === 'canvas' ? T.mat : 'paper');
  const pageM = paperMat(T.trim === 'vintage' ? '#e9dcbc' : '#f6f4ee');
  let anims = [];
  const book = (W, D, t, { spiral = false, spine = null, round = 0.003, ct = 0.0012 } = {}) => {
    // back cover, page block, front cover (hinged at the spine, x = -W/2)
    mesh(roundedBox(W, ct, D, Math.min(ct * 0.45, round)), coverM, { parent: root, at: [0, ct / 2, 0], name: 'back-cover' });
    mesh(roundedBox(W - 0.004, t - 2 * ct, D - 0.005, 0.001), pageM, { parent: root, at: [0.0015, t / 2, 0], name: 'pages' });
    const hinge = group('cover', { parent: root, at: [-W / 2, t - ct / 2, 0] });
    const front = mesh(roundedBox(W, ct, D, Math.min(ct * 0.45, round)), coverM, { parent: hinge, at: [W / 2, 0, 0], name: 'front-cover' });
    if (spiral) {
      const n = Math.round(D / 0.0085);
      const coilM = T.lux ? M.metal('#d6a93c', 0.2) : T.trim === 'kids' ? M.plastic(T.s, 0.4) : M.metal('#c9ccd2', 0.25);
      for (let i = 0; i < n; i++) mesh(new THREE.TorusGeometry(t * 0.62, 0.0007 * (T.chunky ? 1.6 : 1), 6, 20), coilM, { parent: root, at: [-W / 2 + 0.002, t / 2, -D / 2 + 0.005 + (i * (D - 0.01)) / (n - 1)] });
    }
    if (spine) mesh(roundedBox(0.02, t + 0.0006, D + 0.0006, 0.002), spine, { parent: root, at: [-W / 2 + 0.008, t / 2, 0], name: 'spine' });
    anims = () => [clip('open', 3, [rotateTrack(hinge, 'z', 3, (t2) => pingPong(t2) * 2.6)])];
    return front;
  };
  if (variant === 'spiral-notebook' || variant === 'composition-book' || variant === 'journal') {
    const W = (variant === 'journal' ? 0.13 : variant === 'composition-book' ? 0.19 : 0.148) * k * T.w;
    const D = (variant === 'journal' ? 0.21 : variant === 'composition-book' ? 0.245 : 0.21) * k * T.h;
    const t = (variant === 'journal' ? 0.02 : variant === 'composition-book' ? 0.009 : 0.012) * (T.chunky ? 1.6 : 1) * (T.slim ? 0.6 : 1);
    const hardCover = variant === 'journal' || T.lux;
    const ct = hardCover ? 0.0025 : 0.0008;
    if (variant === 'composition-book' && !T.trim) coverM.map = marbleTex('#141414', '#f4f3ef');
    const front = book(W, D, t, { spiral: variant === 'spiral-notebook', spine: variant === 'composition-book' ? M.fabric(T.trim ? T.a : '#141414') : null, round: variant === 'journal' ? 0.008 * T.round : 0.002 * T.round, ct });
    if (variant !== 'journal') {
      const l = labelPlane(W * 0.5, D * 0.16, textDraw([variant === 'spiral-notebook' ? 'NOTES' : 'COMPOSITION', 'Name ________'], { bg: '#f6f4ee', border: '#1b1b1d' }), { px: 256 });
      l.rotation.x = -Math.PI / 2; l.position.set(W * 0.05, ct / 2 + 0.0002, -D * 0.2); front.add(l);
    } else {
      // elastic band + ribbon bookmark
      const bandM = M.fabric(T.a);
      mesh(roundedBox(0.007, t + 0.002, D + 0.0015, 0.001), bandM, { parent: root, at: [W * 0.38, t / 2, 0], name: 'elastic' });
      mesh(roundedBox(0.006, 0.0006, 0.06, 0.0002), M.fabric(T.trim === 'luxury' ? T.s : '#8a1f2a'), { parent: root, at: [-W * 0.1, 0.0003, D / 2 + 0.025], rot: [0, 0.2, 0], name: 'ribbon' });
      if (T.detail >= 2) for (const s of [-1, 1]) mesh(roundedBox(0.012, 0.0008, 0.012, 0.0003), hw(T), { parent: front, at: [W / 2 - 0.007, ct / 2 + 0.0003, s * (D / 2 - 0.007)] });
    }
  } else if (variant === 'notepad') {
    const W = 0.216 * k * T.w, D = 0.297 * k, t = 0.012 * (T.chunky ? 1.6 : 1);
    mesh(roundedBox(W, 0.0015, D, 0.0006), fin(T, '#8e7a5a', 'paper'), { parent: root, at: [0, 0.00075, 0], name: 'backing' });
    mesh(roundedBox(W - 0.002, t - 0.0015, D - 0.003, 0.0008), fin(T, T.p, 'paper'), { parent: root, at: [0, 0.0015 + (t - 0.0015) / 2, 0.0015], name: 'pages' });
    mesh(roundedBox(W + 0.001, t + 0.003, 0.03, 0.002), fin(T, T.s, 'paper'), { parent: root, at: [0, (t + 0.003) / 2, -D / 2 + 0.013], name: 'binding' });
    topLabel(root, W * 0.98, D * 0.86, linesDraw(M.toColor(T.p).getStyle(), '#5c8fbf', '#d0605a'), [0, t + 0.0003, 0.02], { px: 256 });
  } else if (variant === 'folder') {
    const W = 0.235 * k * T.w, D = 0.31 * k, ct = 0.0006;
    mesh(roundedBox(W, ct, D, 0.0002), coverM, { parent: root, at: [0, ct / 2, 0], name: 'back-leaf' });
    // tab on the back leaf
    mesh(roundedBox(0.07, ct, 0.02, 0.0002), coverM, { parent: root, at: [W * 0.2, ct / 2, -D / 2 - 0.009], name: 'tab' });
    const papers = T.chunky ? 4 : 2;
    for (let i = 0; i < papers; i++) mesh(roundedBox(0.21, 0.0004, 0.297, 0.0001), pageM, { parent: root, at: [0.005 + i * 0.003, ct + 0.0002 + i * 0.0004, 0.004 - i * 0.004], rot: [0, i * 0.02, 0] });
    topLabel(root, 0.18, 0.2, scribble('#f6f4ee', '#2a2b2e', 14), [0.008, ct + papers * 0.0004 + 0.0002, 0], { px: 256 });
    const hinge = group('cover', { parent: root, at: [-W / 2, ct + papers * 0.0004 + 0.0005, 0] });
    mesh(roundedBox(W, ct, D * 0.95, 0.0002), coverM, { parent: hinge, at: [W / 2, ct / 2, D * 0.025], name: 'front-leaf' });
    hinge.rotation.z = T.trim === 'kids' ? 0 : 0.35;
    if (T.detail) mesh(roundedBox(0.08, 0.0003, 0.025, 0.0001), M.matte('#f6f4ee'), { parent: hinge, at: [W * 0.55, ct + 0.0001, -D * 0.3] });
    anims = () => [clip('open', 3, [rotateTrack(hinge, 'z', 3, (t2) => pingPong(t2) * 2.2)])];
  } else if (variant === 'ring-binder') {
    const H = 0.315 * k * T.h, D = 0.29 * k, Wd = (T.slim ? 0.03 : T.chunky ? 0.08 : 0.055) * k, ct = 0.003;
    const cm = T.mat === 'leather' || T.lux ? tm(T, 'p') : hard(T, 'p');
    mesh(roundedBox(ct, H, D, 0.0013), cm, { parent: root, at: [-Wd / 2, H / 2, 0], name: 'back' });
    mesh(roundedBox(Wd + ct, H, ct, 0.0013), cm, { parent: root, at: [0, H / 2, -D / 2], name: 'spine' });
    const hinge = group('cover', { parent: root, at: [Wd / 2, 0, -D / 2] });
    mesh(roundedBox(ct, H, D, 0.0013), cm, { parent: hinge, at: [0, H / 2, D / 2], name: 'front' });
    mesh(roundedBox(Wd * 0.75, H * 0.97, D * 0.93, 0.001), pageM, { parent: root, at: [-Wd * 0.08, H / 2, 0.0], name: 'pages' });
    const ringM = M.metal('#c9ccd2', 0.2);
    mesh(roundedBox(Wd * 0.7, H * 0.6, 0.003, 0.001), ringM, { parent: root, at: [0, H / 2, -D / 2 + 0.003], name: 'mechanism' });
    for (const y of [0.25, 0.5, 0.75]) mesh(new THREE.TorusGeometry(Wd * 0.32, 0.0018, 8, 24, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI / 2), ringM, { parent: root, at: [0, H * (y * 0.6 + 0.2), -D / 2 + 0.004] });
    // spine label window + finger hole
    const lb = labelPlane(Wd * 0.7, H * 0.4, textDraw(['FILES'], { bg: '#f6f4ee' }), { px: 64 });
    lb.position.set(0, H * 0.6, -D / 2 - ct / 2 - 0.0003); lb.rotation.y = Math.PI; root.add(lb);
    mesh(new THREE.TorusGeometry(Wd * 0.18, 0.0025, 8, 24), M.metal('#9aa0a6', 0.3), { parent: root, at: [0, H * 0.2, -D / 2 - ct / 2] });
    anims = () => [clip('open', 3, [rotateTrack(hinge, 'y', 3, (t2) => -pingPong(t2) * 1.4)])];
  } else {
    // clipboard
    const W = 0.23 * k * T.w, D = 0.32 * k, t = T.mat === 'metal' ? 0.002 : 0.005;
    const bm = T.mat === 'wood' ? M.wood(T.p) : T.mat === 'metal' ? M.metal('#b9bec6', 0.3) : hard(T, 'p');
    mesh(roundedBox(W, t, D, Math.min(t * 0.45, 0.002)), bm, { parent: root, at: [0, t / 2, 0], name: 'board' });
    mesh(roundedBox(0.21, 0.0004, 0.28, 0.0001), pageM, { parent: root, at: [0, t + 0.0002, 0.014], name: 'paper' });
    topLabel(root, 0.19, 0.25, linesDraw('#fbfaf5', '#9db8cf', null), [0, t + 0.00045, 0.024], { px: 256 });
    const cm = T.lux ? M.metal('#d6a93c', 0.2) : T.trim === 'black' ? M.metal('#2a2b2e', 0.3) : M.metal('#c9ccd2', 0.2);
    const clipW = (T.rugged ? 0.14 : 0.1) * k;
    mesh(roundedBox(clipW, 0.004, 0.03, 0.0015), cm, { parent: root, at: [0, t + 0.0015, -D / 2 + 0.022], name: 'clip-base' });
    curveTube([[-clipW * 0.35, t + 0.004, -D / 2 + 0.01], [-clipW * 0.35, t + 0.013, -D / 2 + 0.028], [-clipW * 0.35, t + 0.002, -D / 2 + 0.05]], 0.0012, cm, { parent: root, segments: 16 });
    curveTube([[clipW * 0.35, t + 0.004, -D / 2 + 0.01], [clipW * 0.35, t + 0.013, -D / 2 + 0.028], [clipW * 0.35, t + 0.002, -D / 2 + 0.05]], 0.0012, cm, { parent: root, segments: 16 });
    mesh(roundedBox(clipW * 0.8, 0.0015, 0.012, 0.0006), cm, { parent: root, at: [0, t + 0.0014, -D / 2 + 0.05], name: 'clip-jaw' });
    if (T.mat !== 'metal') mesh(new THREE.TorusGeometry(0.006, 0.0015, 6, 20), cm, { parent: root, at: [0, t / 2, -D / 2 - 0.003], rot: [Math.PI / 2, 0, 0] }).visible = false;
  }
  return done(root, 'notebook', variant, o, anims);
}

/* =================================== MAIL =================================== */

export const MAIL_VARIANTS = {
  envelope: { p: '#f4f1ea', s: '#c42a2a', a: '#2457b8', mat: 'paper' },
  letter: { p: '#fbfaf5', s: '#203a6a', a: '#c42a2a', mat: 'paper' },
  'postage-stamp': { p: '#2f7a4a', s: '#f4f1ea', a: '#c42a2a', mat: 'paper' },
  postcard: { p: '#3d8fd6', s: '#f4f1ea', a: '#f2b83a', mat: 'paper' },
  parcel: { p: '#b58a57', s: '#e9dfcc', a: '#c42a2a', mat: 'paper' },
  'rubber-stamp': { p: '#8a5a32', s: '#1b1b1d', a: '#c42a2a', mat: 'wood' },
};

const stampDraw = (bg, fg, ac) => (g, w, h) => {
  g.fillStyle = '#f8f5ec'; g.fillRect(0, 0, w, h);
  g.fillStyle = bg; g.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
  g.fillStyle = ac; g.beginPath(); g.arc(w * 0.5, h * 0.45, w * 0.2, 0, 7); g.fill();
  g.fillStyle = fg; g.font = `bold ${h * 0.14}px sans-serif`; g.textAlign = 'center'; g.fillText('POST 50', w / 2, h * 0.82);
};

export function createMail(options = {}) {
  const { o, variant, T } = setup(options, MAIL_VARIANTS, 'mail');
  const root = group(`mail-${variant}`);
  const k = T.k;
  const pm = fin(T, T.p, T.mat === 'wood' ? 'wood' : 'paper');
  let anims = [];
  const css = (c) => M.toColor(c).getStyle();
  if (variant === 'envelope' || variant === 'letter' || variant === 'postcard') {
    if (variant === 'envelope') {
      const W = 0.22 * k * T.w, D = (T.trim === 'pastel' ? 0.16 : 0.11) * k * T.h, t = 0.0025 * (T.chunky ? 2 : 1);
      mesh(roundedBox(W, t, D, 0.0008), pm, { parent: root, at: [0, t / 2, 0], name: 'envelope' });
      // flap (on the back, shown face-up: flap side up)
      const flapM = fin(T, M.toColor(T.p).lerp(new THREE.Color('#8a7a5a'), 0.12), 'paper');
      const flap = group('flap', { parent: root, at: [0, t + 0.0002, -D / 2] });
      const fpts = T.trim === 'vintage' ? [[-W / 2, 0], [W / 2, 0], [W / 2 - D * 0.15, D * 0.45], [-W / 2 + D * 0.15, D * 0.45]] : [[-W / 2, 0], [W / 2, 0], [0, D * 0.55]];
      mesh(extrudeOutline(fpts, 0.0004, { bevel: 0 }).rotateX(Math.PI / 2), flapM, { parent: flap, at: [0, 0.0002, 0], name: 'flap-leaf' });
      if (T.trim === 'festive' || T.lux || T.detail >= 2) mesh(lathe([[0, 0], [0.012, 0], [0.013, 0.002], [0.01, 0.003], [0, 0.003]], 20), M.plastic(T.trim === 'festive' ? '#8a1020' : T.a, 0.3), { parent: flap, at: [0, 0.0004, D * 0.45], name: 'wax-seal' });
      if (T.trim === 'vintage') {
        const l = topLabel(root, W * 0.98, D * 0.95, (g, w, h) => { g.fillStyle = css(T.s); g.fillRect(0, 0, w, h); for (let x = -h; x < w + h; x += 24) { g.fillStyle = (x / 24) % 2 ? '#c42a2a' : '#2457b8'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 12, 0); g.lineTo(x + 12 - h * 0.15, h * 0.15); g.lineTo(x - h * 0.15, h * 0.15); g.fill(); } g.fillStyle = css(T.s); g.fillRect(8, 8, w - 16, h - 16); }, [0, t + 0.0001, 0]);
        void l;
      }
      anims = () => [clip('open', 3, [rotateTrack(flap, 'x', 3, (t2) => pingPong(t2) * 2.6)])];
    } else if (variant === 'letter') {
      const W = 0.21 * k, P = 0.099 * k;
      const panel = (dir, rotX, draw) => {
        const g = group('panel', { parent: root, rot: [rotX, 0, 0] });
        mesh(roundedBox(W, 0.0006, P, 0.0002), pm, { parent: g, at: [0, 0.0003, dir * P / 2] });
        topLabel(g, W * 0.9, P * 0.9, draw, [0, 0.00065, dir * P / 2], { px: 256 });
        return g;
      };
      panel(1, 0, scribble(css(T.p), css(T.s), 6));
      panel(-1, 0.16 + T.worn * 0.25, scribble(css(T.p), css(T.s), 4));
      if (T.detail || T.trim === 'festive') mesh(roundedBox(0.03, 0.0008, 0.03, 0.0003), M.plastic(T.a, 0.4), { parent: root, at: [W * 0.35, 0.001, P * 0.7], name: 'sticker' });
    } else {
      const W = 0.148 * k * T.w, D = 0.105 * k, t = 0.0008 * (T.chunky ? 2 : 1);
      const card = group('card', { parent: root, rot: [0, 0, 0] });
      mesh(roundedBox(W, t, D, 0.0003), fin(T, '#f4f1ea', 'paper'), { parent: card, at: [0, t / 2, 0] });
      topLabel(card, W * 0.98, D * 0.98, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, css(T.p)); gr.addColorStop(0.6, '#ffffff'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = css(T.a); g.beginPath(); g.arc(w * 0.75, h * 0.3, h * 0.12, 0, 7); g.fill();
        g.fillStyle = '#4f7a4a'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.3, h * 0.45); g.lineTo(w * 0.55, h * 0.75); g.lineTo(w * 0.75, h * 0.5); g.lineTo(w, h); g.fill();
        g.fillStyle = '#ffffff'; g.font = `bold ${h * 0.12}px serif`; g.fillText('Greetings!', w * 0.06, h * 0.16);
      }, [0, t + 0.0002, 0], { px: 256 });
      if (T.trim === 'festive' || T.trim === 'pastel') {
        // second card leaning / overlapping
        const c2 = card.clone(); c2.position.set(W * 0.1, t * 1.2, D * 0.12); c2.rotation.y = 0.25; root.add(c2);
      }
    }
    if (variant !== 'letter') {
      // stamp in the corner
      const W = variant === 'envelope' ? 0.22 * k * T.w : 0.148 * k * T.w, D = variant === 'envelope' ? (T.trim === 'pastel' ? 0.16 : 0.11) * k * T.h : 0.105 * k;
      const t = variant === 'envelope' ? 0.0025 * (T.chunky ? 2 : 1) : 0.0008 * (T.chunky ? 2 : 1);
      if (variant === 'envelope') {
        topLabel(root, 0.022, 0.026, stampDraw(css(T.trim ? T.a : '#2f7a4a'), '#1b1b1d', '#f2b83a'), [W / 2 - 0.016, t + 0.0003, D / 2 - 0.018], { px: 64 });
        topLabel(root, W * 0.38, D * 0.22, textDraw(['M. Smith', '12 Any Street, Town'], { bg: css(T.p), fg: '#203a6a', font: 'italic' }), [-W * 0.05, t + 0.0003, D * 0.22], { px: 256 });
      }
    }
  } else if (variant === 'postage-stamp') {
    const sw = 0.03 * k, sh = 0.036 * k, nx = T.trim === 'kids' ? 1 : T.lux ? 3 : 2, nz = T.trim === 'kids' ? 1 : 2;
    const pts = [];
    const perf = (x0, y0, x1, y1, n) => { for (let i = 0; i < n; i++) { const t0 = i / n; const x = x0 + (x1 - x0) * t0, y = y0 + (y1 - y0) * t0; pts.push([x, y]); const dx = (x1 - x0) / n, dy = (y1 - y0) / n; const nxv = dy, nyv = -dx, l = Math.hypot(nxv, nyv) || 1; pts.push([x + dx * 0.5 + (nxv / l) * 0.0008, y + dy * 0.5 + (nyv / l) * 0.0008]); } };
    const W = sw * nx, D = sh * nz;
    perf(-W / 2, -D / 2, W / 2, -D / 2, nx * 12); perf(W / 2, -D / 2, W / 2, D / 2, nz * 14); perf(W / 2, D / 2, -W / 2, D / 2, nx * 12); perf(-W / 2, D / 2, -W / 2, -D / 2, nz * 14);
    mesh(extrudeOutline(pts, 0.0003, { bevel: 0 }).rotateX(Math.PI / 2), fin(T, '#f8f5ec', 'paper'), { parent: root, at: [0, 0.00015, 0], name: 'stamps' });
    const cols = [T.p, T.a, T.s === '#f4f1ea' ? '#2457b8' : T.s, '#7a3db8', '#d6a93c', '#2f7a4a'];
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) topLabel(root, sw * 0.86, sh * 0.86, stampDraw(css(cols[(i + j * nx) % cols.length]), '#1b1b1d', T.lux ? '#d6a93c' : '#f2b83a'), [-W / 2 + sw * (i + 0.5), 0.00032, -D / 2 + sh * (j + 0.5)], { px: 64 });
    if (T.trim === 'vintage') mesh(new THREE.TorusGeometry(0.014 * k, 0.0004, 4, 32), M.matte('#2a2b2e'), { parent: root, at: [-W / 2 + sw * 0.7, 0.00035, -D / 2 + sh * 0.6], rot: [Math.PI / 2, 0, 0], name: 'postmark' });
  } else if (variant === 'parcel') {
    const W = 0.3 * k * T.w, H = 0.16 * k * T.h, D = 0.22 * k;
    const boxM = T.trim === 'festive' ? fin(T, T.p, 'paper', { pattern: 'stripes' }) : fin(T, T.p, 'paper');
    mesh(roundedBox(W, H, D, 0.004 * T.round), boxM, { parent: root, at: [0, H / 2, 0], name: 'parcel' });
    const twM = T.trim === 'festive' ? M.fabric(T.a) : M.fabric('#d9c49a');
    const tw = T.trim === 'festive' ? 0.018 : 0.003;
    mesh(roundedBox(W + 0.002, H + 0.002, tw, 0.0008), twM, { parent: root, at: [0, H / 2, 0], name: 'string-x' });
    mesh(roundedBox(tw, H + 0.002, D + 0.002, 0.0008), twM, { parent: root, at: [0, H / 2, 0], name: 'string-z' });
    if (T.trim === 'festive') for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 20).scale(1, 0.5, 1), twM, { parent: root, at: [s * 0.022, H + 0.006, 0], rot: [Math.PI / 2, 0.4 * s, 0] });
    else mesh(new THREE.TorusGeometry(0.012, 0.002, 6, 16), twM, { parent: root, at: [0.01, H + 0.002, 0.01], rot: [Math.PI / 2, 0, 0] });
    topLabel(root, 0.1, 0.06, textDraw(['TO:', '12 Any Street', 'Town 0000'], { bg: '#ffffff', fg: '#1b1b1d' }), [-W * 0.25, H + 0.0003, D * 0.22], { px: 128 });
    topLabel(root, 0.024, 0.028, stampDraw(css(T.a), '#1b1b1d', '#f2b83a'), [W * 0.36, H + 0.0003, -D * 0.33], { px: 64 });
    if (T.detail) mesh(roundedBox(W * 0.98, 0.0006, 0.05, 0.0002), new THREE.MeshPhysicalMaterial({ color: '#d9b67a', roughness: 0.3, clearcoat: 1 }), { parent: root, at: [0, H + 0.0004, -D * 0.02], name: 'tape' });
  } else {
    // rubber stamp + ink pad
    const S = k * (T.chunky ? 1.3 : 1);
    const st = group('stamp', { parent: root, at: [-0.035 * S, 0, 0] });
    const BW = 0.05 * S * T.w, BD = 0.03 * S;
    mesh(roundedBox(BW, 0.005, BD, 0.001), M.matte('#2a2b2e', 0.9), { parent: st, at: [0, 0.0025, 0], name: 'rubber' });
    mesh(roundedBox(BW, 0.016, BD, 0.002 * T.round), T.mat === 'wood' ? M.wood(T.p) : hard(T, 'p'), { parent: st, at: [0, 0.013, 0], name: 'block' });
    mesh(lathe([[0, 0], [0.008 * S, 0], [0.005 * S, 0.015 * S], [0.006 * S, 0.03 * S], [0.013 * S, 0.042 * S], [0.012 * S, 0.05 * S], [0, 0.053 * S]], 32), T.mat === 'wood' ? M.wood(T.trim === 'vintage' ? '#5b3a24' : T.s === '#1b1b1d' ? '#3a2214' : T.s) : hard(T, 's'), { parent: st, at: [0, 0.021, 0], name: 'knob' });
    const PW = 0.11 * S, PD = 0.07 * S, PH = 0.012;
    openBox(PW, PH, PD, 0.0012, M.metal(T.trim === 'vintage' ? '#6a5a3a' : '#3d4045', 0.35), { parent: root, at: [0.055 * S, 0, 0], r: 0.004, name: 'ink-pad' });
    mesh(roundedBox(PW - 0.006, 0.004, PD - 0.006, 0.001), M.fabric(T.a), { parent: root, at: [0.055 * S, 0.0032, 0], name: 'ink' });
    const lid = group('pad-lid', { parent: root, at: [0.055 * S, PH, -PD / 2] });
    const lm = openBox(PW, 0.006, PD, 0.0012, M.metal(T.trim === 'vintage' ? '#6a5a3a' : '#3d4045', 0.35), { parent: lid, r: 0.004 });
    lm.rotation.x = Math.PI; lm.position.set(0, 0, PD / 2);
    lid.rotation.x = -1.9;
    anims = () => [clip('stamp', 1.5, [moveTrack(st, 1.5, (t) => [0, Math.sin(t * Math.PI) * 0.03, 0])])];
  }
  return done(root, 'mail', variant, o, anims);
}
