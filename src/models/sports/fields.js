// Goals, hoops and court nets (real-world sizes).
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, setup, done, fin, bodyMat, bar, labelPlane } from './common.js';
import { brandEmblem } from '../../core/brand.js';
import { buildBall } from './balls.js';

const _up = new THREE.Vector3(0, 1, 0);
/** Cylinder geometry between two points (for merging). */
function segGeo(a, b, r, rs = 4) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const d = vb.clone().sub(va);
  const g = new THREE.CylinderGeometry(r, r, d.length(), rs, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(_up, d.clone().normalize()));
  g.translate(...va.clone().addScaledVector(d, 0.5).toArray());
  return g;
}
/** Merge a list of polylines (arrays of points) into one cord mesh. */
function cords(lines, r, mat, parent, name = 'net') {
  const geos = [];
  for (const l of lines) for (let i = 0; i < l.length - 1; i++) geos.push(segGeo(l[i], l[i + 1], r));
  if (!geos.length) return null;
  const m = mesh(mergeGeometries(geos), mat, { parent, name });
  m.material.side = THREE.DoubleSide;
  return m;
}
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** Box/trapezoid goal net behind a goal mouth w×h, roof depth dt, ground depth db. */
function goalNet(w, h, dt, db, cell, r, mat, parent, sag = 0) {
  const lines = [];
  const nx = Math.round(w / cell);
  const sagY = (t) => -Math.sin(t * Math.PI) * sag;
  for (let i = 0; i <= nx; i++) {
    const x = -w / 2 + (w * i) / nx;
    lines.push([[x, h, 0], [x, h + sagY(0.5) * 0.3, -dt], [x, 0.01, -db]]);
  }
  // horizontal cords on roof and back
  const nr = Math.max(1, Math.round(dt / cell));
  for (let j = 1; j <= nr; j++) lines.push([[-w / 2, h, (-dt * j) / nr], [w / 2, h, (-dt * j) / nr]]);
  const backLen = Math.hypot(h, db - dt);
  const nb = Math.round(backLen / cell);
  for (let j = 1; j < nb; j++) { const t = j / nb; const p = lerp3([0, h, -dt], [0, 0.01, -db], t); lines.push([[-w / 2, p[1], p[2]], [w / 2, p[1], p[2]]]); }
  // sides
  for (const sx of [-w / 2, w / 2]) {
    const nz = Math.round(db / cell);
    for (let k = 1; k <= nz; k++) {
      const z = (-db * k) / nz;
      const top = -z <= dt ? h : h * (1 - (-z - dt) / (db - dt));
      lines.push([[sx, 0.01, z], [sx, Math.max(0.01, top), z]]);
    }
    const nh = Math.round(h / cell);
    for (let k = 1; k < nh; k++) {
      const y = (h * k) / nh;
      const zb = -db + ((db - dt) * y) / h;
      lines.push([[sx, y, 0], [sx, y, zb]]);
    }
  }
  return cords(lines, r, mat, parent);
}

function postMat(T, trim, base) {
  if (trim === 'retro') return M.wood('#efe9dc');
  if (trim === 'champion') return M.metal('#d6a93c', 0.22);
  if (trim === 'worn') return M.metal('#9a8e7e', 0.7);
  return trim ? bodyMat(T, T.pattern ? T.s : T.p) : fin(T, base, 'gloss');
}
function netMat(T, trim, base = '#f4f4f0') {
  const c = trim === 'neon' ? T.p : trim === 'stealth' ? '#3a3c42' : T.pattern ? T.p : trim === 'retro' ? '#d9ccb0' : trim === 'kids' ? T.s : trim === 'worn' ? '#bfb6a4' : base;
  return new THREE.MeshStandardMaterial({ name: 'net', color: M.toColor(c), roughness: 0.9 });
}

/** Striped post: alternating bands along a tube (handball/team trims). */
function stripedTube(a, b, r, matA, matB, parent, n = 8, square = false) {
  for (let i = 0; i < n; i++) {
    const p = lerp3(a, b, i / n), q = lerp3(a, b, (i + 1) / n);
    if (square) {
      const d = new THREE.Vector3(...q).sub(new THREE.Vector3(...p));
      const m = mesh(roundedBox(r * 2, d.length(), r * 2, r * 0.3), i % 2 ? matB : matA, { parent, at: lerp3(p, q, 0.5) });
      m.quaternion.setFromUnitVectors(_up, d.normalize());
    } else bar(p, q, r, i % 2 ? matB : matA, parent);
  }
}

/* ================================ GOALS ================================ */

export const GOAL_VARIANTS = {
  soccer: { w: 7.32, h: 2.44, dt: 0.9, db: 2.0, r: 0.06, cell: 0.14, p: '#f6f6f4' },
  futsal: { w: 3, h: 2, dt: 0.6, db: 1.0, r: 0.04, cell: 0.1, p: '#f6f6f4', square: true },
  'ice-hockey': { w: 1.83, h: 1.22, dt: 0.45, db: 1.0, r: 0.03, cell: 0.06, p: '#d0201e', hockey: true },
  handball: { w: 3, h: 2, dt: 0.8, db: 1.0, r: 0.04, cell: 0.1, p: '#d0201e', s: '#f6f6f4', square: true, striped: true },
  lacrosse: { w: 1.83, h: 1.83, dt: 0.4, db: 2.13, r: 0.035, cell: 0.08, p: '#f06a14', pyramid: true },
  'field-hockey': { w: 3.66, h: 2.14, dt: 1.0, db: 1.2, r: 0.04, cell: 0.1, p: '#f6f6f4', boards: true, square: true },
  'rugby-posts': { w: 5.6, h: 3, r: 0.07, p: '#f6f6f4', posts: true },
};

export function createSportsGoal(options = {}) {
  const { o, variant, trim, T, V } = setup(options, GOAL_VARIANTS, 'sports-goal');
  const root = group(`sports-goal-${variant}`);
  const g = group('goal', { parent: root });
  const k = T.kids ? 0.42 : 1;
  const w = V.w * k, h = V.h * k, r = V.r * (T.kids ? 0.8 : 1) * (trim === 'pro' ? 1.15 : 1);
  const pm = postMat(T, trim, V.p);
  const pm2 = trim && T.pattern ? fin(T, T.p) : V.s ? fin(T, V.s) : pm;
  const sq = V.square || trim === 'retro';
  const nm = netMat(T, trim);
  const striped = V.striped || T.pattern;
  const tubeAB = (a, b, rr = r) => (striped ? stripedTube(a, b, rr, pm, pm2, g, Math.max(4, Math.round(Math.hypot(...a.map((v, i) => v - b[i])) / 0.2)), sq) : sq ? stripedTube(a, b, rr, pm, pm, g, 1, true) : bar(a, b, rr, pm, g));

  if (V.posts) {
    // rugby H posts with padded bases
    const up = (T.kids ? 4 : trim === 'pro' ? 13 : 10) * (T.kids ? 1 : 1);
    for (const s of [-1, 1]) {
      tubeAB([s * w / 2, 0, 0], [s * w / 2, up, 0], r);
      const pad = mesh(roundedBox(0.5 * k + 0.1, 2 * k, 0.5 * k + 0.1, 0.08), fin(T, trim ? T.p : '#1d4fa0', 'foam'), { parent: g, at: [s * w / 2, k, 0], name: 'pad' });
      if (T.pattern) mesh(roundedBox(0.5 * k + 0.11, 0.4 * k, 0.5 * k + 0.11, 0.06), fin(T, T.s, 'foam'), { parent: pad, at: [0, 0.3 * k, 0] });
      if (trim !== 'kids') mesh(new THREE.ConeGeometry(r * 1.1, 0.25, 12), pm, { parent: g, at: [s * w / 2, up + 0.12, 0] });
    }
    tubeAB([-w / 2, h, 0], [w / 2, h, 0], r * 0.9);
    if (trim === 'champion' || trim === 'pro') for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.15, 16, 10), M.metal('#d6a93c', 0.22), { parent: g, at: [s * w / 2, up + 0.3, 0] });
    return done(root, 'sports-goal', variant, o);
  }

  // goal mouth
  tubeAB([-w / 2, 0, 0], [-w / 2, h + r, 0]);
  tubeAB([w / 2, 0, 0], [w / 2, h + r, 0]);
  tubeAB([-w / 2 - r, h, 0], [w / 2 + r, h, 0]);
  const dt = V.dt * k, db = V.db * k;
  const back = trim === 'retro' ? M.wood('#d9ccb0') : M.metal(trim === 'stealth' ? '#2a2c31' : '#d2d5da', 0.35);
  const br = r * 0.45;
  if (V.hockey) {
    // ice hockey: curved base frame + rear arc
    const arc = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); arc.push([-Math.cos(a) * w / 2, br, -Math.sin(a) * db]); }
    curveTube(arc, br, fin(T, '#f6f6f4', 'gloss'), { parent: g, segments: 32 });
    const top = arc.map(([x, , z]) => [x * 0.95, h, z * dt / db]);
    curveTube(top, br * 0.8, pm, { parent: g, segments: 32 });
    for (const s of [-1, 1]) bar([s * w / 2, h, 0], [s * w * 0.475, h, 0], br, pm, g);
    curveTube([[0, h, -dt], [0, h * 0.5, -db * 0.75], [0, br, -db]], br, pm, { parent: g, segments: 8 });
    const lines = [];
    for (let i = 0; i <= 16; i++) lines.push([top[i], arc[i]]);
    for (let j = 1; j < 10; j++) lines.push(top.map((p, i) => lerp3(p, arc[i], j / 10)));
    for (let j = 0; j <= 4; j++) lines.push(top.map(([x, y, z]) => [x * (j / 4), y, z * (j / 4)]));
    cords(lines, 0.003, nm, g);
    // white mesh skirt pad at back
    mesh(roundedBox(w * 0.9, 0.25 * k, 0.03, 0.01), fin(T, '#f6f6f4', 'foam'), { parent: g, at: [0, 0.125 * k + 0.01, -db + 0.02] });
  } else if (V.pyramid) {
    const apex = [0, 0.02, -db];
    for (const s of [-1, 1]) { bar([s * w / 2, br, 0], apex, br, back, g); bar([s * w / 2, h, 0], apex, br, back, g); }
    const lines = [];
    for (let i = 0; i <= 10; i++) { const x = -w / 2 + (w * i) / 10; lines.push([[x, h, 0], apex], [[x, 0.01, 0], apex]); }
    for (let i = 0; i <= 10; i++) { const y = (h * i) / 10; for (const s of [-1, 1]) lines.push([[s * w / 2, y, 0], apex]); }
    for (let j = 1; j < 10; j++) { const t = j / 10; lines.push([[-w / 2, h, 0], [w / 2, h, 0], [w / 2, 0.01, 0], [-w / 2, 0.01, 0], [-w / 2, h, 0]].map((p) => lerp3(p, apex, t))); }
    cords(lines, 0.003, nm, g);
    bar([-w / 2, br, 0], [w / 2, br, 0], br, pm, g);
  } else {
    // stanchions + ground frame
    for (const s of [-1, 1]) {
      bar([s * w / 2, h, 0], [s * w / 2, h, -dt], br, back, g);
      bar([s * w / 2, h, -dt], [s * w / 2, br, -db], br, back, g);
      bar([s * w / 2, br, 0], [s * w / 2, br, -db], br, back, g);
    }
    bar([-w / 2, br, -db], [w / 2, br, -db], br, back, g);
    bar([-w / 2, h, -dt], [w / 2, h, -dt], br * 0.8, back, g);
    goalNet(w, h, dt, db, V.cell * (T.kids ? 0.8 : 1) * (trim === 'pro' ? 0.75 : 1), 0.0035, nm, g, trim === 'worn' ? 0.25 : 0);
    if (V.boards) {
      const bm = trim ? fin(T, T.s ?? '#1d1f24', 'gloss') : M.plastic('#1d1f24', 0.5);
      mesh(roundedBox(w, 0.46 * k, 0.025, 0.008), bm, { parent: g, at: [0, 0.23 * k, -db - 0.015] });
      for (const s of [-1, 1]) mesh(roundedBox(0.025, 0.46 * k, db, 0.008), bm, { parent: g, at: [s * (w / 2 + 0.015), 0.23 * k, -db / 2] });
    }
    if (trim === 'kids') for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.06, 12, 8), M.plastic('#ffffff'), { parent: g, at: [s * w / 2, 0.06, -db] });
    if (trim === 'worn') mesh(roundedBox(0.6, 0.02, 0.4, 0.01), M.matte('#6e5a3e'), { parent: g, at: [w * 0.2, 0.01, -db * 0.4] });
  }
  if (trim === 'pro' || trim === 'champion') {
    // sponsor-free pitch-side ball + emblem plate on the crossbar
    const b = buildBall(variant === 'ice-hockey' ? 'pool-ball' : variant === 'lacrosse' ? 'baseball' : variant === 'field-hockey' ? 'cricket' : 'soccer', { ...T, trim: null }, { detail: 12 });
    if (variant !== 'ice-hockey') { b.mesh.position.set(w * 0.25, b.bottom ?? b.R, -db * 0.5); g.add(b.mesh); }
    const em = brandEmblem(Math.min(0.25, r * 3));
    em.position.set(0, h, r * 0.98);
    g.add(em);
  }
  return done(root, 'sports-goal', variant, o);
}

/* =============================== BASKETBALL =============================== */

export const HOOP_VARIANTS = {
  'in-ground': { p: '#1d1f24' },
  portable: { p: '#1d1f24', s: '#2a5fc0' },
  'wall-mount': { p: '#9a4a3a' },
  arena: { p: '#1d1f24', s: '#c8102e' },
  street: { p: '#4a5560' },
};

function rimAndNet(parent, T, trim, at, chain) {
  const rg = group('rim', { parent, at });
  const rr = 0.2286 + 0.009;
  const rm = trim === 'champion' ? M.metal('#d6a93c', 0.2) : fin(T, trim === 'neon' ? T.p : trim === 'stealth' ? '#1c1d20' : '#e8501a', trim === 'worn' ? 'metal' : 'gloss');
  mesh(new THREE.TorusGeometry(rr, 0.009, 10, 40).rotateX(Math.PI / 2), rm, { parent: rg, at: [0, 0, rr + 0.15] });
  mesh(roundedBox(0.16, 0.012, 0.16, 0.004), rm, { parent: rg, at: [0, 0, 0.08] });
  mesh(roundedBox(0.16, 0.12, 0.01, 0.003), rm, { parent: rg, at: [0, -0.05, 0.005] });
  const nm = chain ? M.metal('#b8bcc2', 0.4) : netMat(T, trim);
  const lines = [];
  const n = 12, H = 0.42;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const pts = [];
    for (let j = 0; j <= 4; j++) { const t = j / 4; const rad = rr * (1 - 0.42 * t); const aa = a + (j % 2 ? Math.PI / n : 0); pts.push([Math.cos(aa) * rad, -H * t, rr + 0.15 + Math.sin(aa) * rad]); }
    lines.push(pts);
    if (!chain) {
      const pts2 = pts.map(([x, y, z], j) => { const t = j / 4; const rad = rr * (1 - 0.42 * t); const aa = a - (j % 2 ? Math.PI / n : 0); return [Math.cos(aa) * rad, y, rr + 0.15 + Math.sin(aa) * rad]; });
      lines.push(pts2);
    }
  }
  cords(lines, chain ? 0.004 : 0.0035, nm, rg, 'hoopnet');
  return rg;
}

function backboard(parent, T, trim, { w = 1.83, h = 1.07, glass = true, fan = false, at }) {
  const bb = group('backboard', { parent, at });
  const frame = trim === 'champion' ? M.metal('#d6a93c', 0.2) : fin(T, trim ? T.s ?? '#1c1d20' : '#1c1d20', 'metal');
  if (fan) {
    const pts = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); pts.push([Math.cos(a) * w / 2, Math.sin(a) * h * 0.9 - h * 0.6]); }
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
    mesh(g, fin(T, trim ? T.p : '#d0d4d8', trim ? undefined : 'metal'), { parent: bb, at: [0, 0, -0.01] });
    return { g: bb, low: -h * 0.6 };
  }
  mesh(roundedBox(w, h, 0.03, 0.012), glass && !trim ? M.glass({ tint: '#cfe3ea', opacity: 0.35 }) : trim === 'retro' ? M.wood('#efe9dc') : bodyMat(T, trim === 'stealth' ? '#24262b' : '#f6f6f4'), { parent: bb });
  // frame + shooter's square
  for (const [x, y, ww, hh] of [[0, h / 2, w, 0.04], [0, -h / 2, w, 0.04], [w / 2, 0, 0.04, h], [-w / 2, 0, 0.04, h]]) mesh(roundedBox(ww + 0.02, hh + 0.02, 0.04, 0.008), frame, { parent: bb, at: [x, y, 0] });
  const sqc = fin(T, trim === 'neon' ? T.a : T.pattern ? T.p : '#ffffff', 'matte');
  for (const [x, y, ww, hh] of [[0, -h * 0.05, 0.61, 0.04], [0, -h * 0.3, 0.61, 0.04], [0.285, -h * 0.175, 0.04, 0.45], [-0.285, -h * 0.175, 0.04, 0.45]]) mesh(roundedBox(ww, hh, 0.004, 0.0015), sqc, { parent: bb, at: [x, y, 0.016] });
  if (trim === 'pro' || trim === 'champion') {
    const em = brandEmblem(0.12);
    em.position.set(w / 2 - 0.15, h / 2 - 0.13, 0.016);
    bb.add(em);
  }
  return { g: bb, low: -h / 2 };
}

export function createBasketballHoop(options = {}) {
  const { o, variant, trim, T, V } = setup(options, HOOP_VARIANTS, 'basketball-hoop');
  const root = group(`basketball-hoop-${variant}`);
  const kids = T.kids;
  const rimH = kids ? 2.1 : 3.05;
  const bw = kids ? 1.1 : variant === 'street' ? 1.2 : trim === 'retro' ? 1.5 : 1.83;
  const bh = kids ? 0.7 : 1.07;
  const pole = trim === 'champion' ? M.metal('#d6a93c', 0.22) : trim === 'retro' ? M.wood('#6e3f1f') : bodyMat(T, trim ? (T.pattern ? T.p : T.s ?? T.p) : V.p);
  const boardZ = variant === 'arena' ? 2.2 : variant === 'wall-mount' ? 0.35 : 1.0;
  const bbY = rimH + bh / 2 - 0.15;
  const bb = backboard(root, T, trim, { w: bw, h: bh, glass: variant !== 'street', fan: variant === 'street', at: [0, bbY, boardZ] });
  rimAndNet(root, T, trim, [0, rimH, boardZ + 0.016], variant === 'street' || trim === 'worn');
  const padM = fin(T, trim ? T.p : V.s ?? '#1d1f24', 'foam');

  if (variant === 'in-ground' || variant === 'street') {
    const ps = kids ? 0.08 : 0.13;
    const sq = variant === 'in-ground';
    mesh(sq ? roundedBox(ps, bbY + 0.1, ps, 0.015) : new THREE.CylinderGeometry(ps / 2, ps / 2, bbY + 0.1, 16), pole, { parent: root, at: [0, (bbY + 0.1) / 2, 0] });
    // offset arms to the board
    for (const y of [bbY - 0.25, bbY + 0.2]) bar([0, y, 0], [0, y + (y > bbY ? -0.1 : 0.1), boardZ - 0.02], 0.025, pole, root);
    mesh(roundedBox(0.5, 0.06, 0.5, 0.02), M.matte('#9a9a94'), { parent: root, at: [0, 0.03, 0] });
    if (sq && trim !== 'kids') mesh(roundedBox(ps + 0.1, 1.8, ps + 0.1, 0.04), padM, { parent: root, at: [0, 0.96, 0], name: 'pad' });
    if (T.pattern) for (let i = 0; i < 3; i++) mesh(roundedBox(ps + 0.11, 0.25, ps + 0.11, 0.04), fin(T, T.s, 'foam'), { parent: root, at: [0, 0.3 + i * 0.6, 0] });
  } else if (variant === 'portable') {
    // fillable base + angled pole
    const bl = kids ? 0.7 : 1.1;
    mesh(roundedBox(0.75 * (kids ? 0.7 : 1), 0.3, bl, 0.08), fin(T, trim ? T.s ?? '#1c1d20' : '#1c1d20', 'plastic'), { parent: root, at: [0, 0.15, -bl / 2 + 0.2] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16).rotateZ(Math.PI / 2), M.rubber(), { parent: root, at: [s * 0.4 * (kids ? 0.7 : 1), 0.07, 0.15] });
    const top = [0, bbY + 0.1, boardZ - 0.45];
    bar([0, 0.28, 0.1], top, kids ? 0.04 : 0.055, pole, root);
    bar(top, [0, bbY - 0.2, boardZ - 0.02], 0.03, pole, root);
    bar(top, [0, bbY + 0.25, boardZ - 0.02], 0.03, pole, root);
    bar([0, 0.29, -0.4], [0, 1.2, 0.0 + (boardZ - 0.45) * (1.2 / (bbY + 0.1))], 0.025, pole, root); // brace
  } else if (variant === 'wall-mount') {
    // freestanding brick wall section with footing; board bolted via bracket
    const wallH = bbY + bh / 2 + 0.3;
    const brick = trim === 'stealth' ? M.matte('#2a2a2c') : trim === 'neon' ? fin(T, '#24252a', 'matte') : M.matte(trim === 'worn' ? '#8a6a58' : '#9a4a3a', 0.9);
    mesh(roundedBox(3, wallH, 0.3, 0.02), brick, { parent: root, at: [0, wallH / 2, -0.15] });
    for (let i = 1; i < wallH / 0.075; i++) mesh(new THREE.BoxGeometry(3.002, 0.008, 0.302), M.matte('#c9c0b0'), { parent: root, at: [0, i * 0.075, -0.15] });
    mesh(roundedBox(3.3, 0.15, 0.7, 0.03), M.matte('#9a9a94'), { parent: root, at: [0, 0.075, -0.15] });
    for (const y of [bbY - 0.3, bbY + 0.3]) for (const x of [-0.4, 0.4]) bar([x, y, 0], [x, y, boardZ - 0.02], 0.02, M.metal('#2a2a2a'), root);
    if (T.pattern) mesh(roundedBox(3.01, 0.4, 0.31, 0.02), fin(T, T.p, 'matte'), { parent: root, at: [0, 1.0, -0.15] });
  } else {
    // arena: big padded base, boom arm
    const base = group('base', { parent: root, at: [0, 0, -1.6] });
    mesh(roundedBox(1.4, 1.1, 2.2, 0.12), padM, { parent: base, at: [0, 0.55, 0] });
    mesh(roundedBox(1.42, 0.2, 2.22, 0.06), fin(T, trim ? T.s ?? '#f2f2f2' : '#f2f2f2', 'foam'), { parent: base, at: [0, 0.9, 0] });
    bar([0, 1.1, -1.6 + 0.4], [0, bbY + 0.6, -0.2], 0.12, pole, root);
    bar([0, bbY + 0.6, -0.2], [0, bbY + 0.2, boardZ - 0.012], 0.09, pole, root);
    bar([0, 1.1, -1.6 + 0.9], [0, bbY - 0.3, boardZ - 0.012], 0.06, pole, root);
    mesh(roundedBox(bw + 0.06, 0.15, 0.08, 0.04), fin(T, '#1c1d20', 'foam'), { parent: bb.g, at: [0, bb.low - 0.05, 0] });
    if (trim !== 'kids' && trim !== 'retro') {
      // shot clock on top of the board
      const sc = group('shotclock', { parent: bb.g, at: [0, bh / 2 + 0.13, 0] });
      mesh(roundedBox(0.5, 0.24, 0.12, 0.02), M.plastic('#141416'), { parent: sc });
      const scr = labelPlane(0.42, 0.18, (c, W, H) => { c.fillStyle = '#080808'; c.fillRect(0, 0, W, H); c.fillStyle = '#ff3a2a'; c.font = `bold ${H * 0.8}px monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('24', W / 2, H / 2 + 4); }, { bg: '#ff3a2a', emissive: 1.5 });
      scr.position.z = 0.061;
      scr.name = 'clockface';
      sc.add(scr);
    }
  }
  if (trim !== 'champion') {
    const b = buildBall('basketball', { ...T, trim: trim === 'kids' || trim === 'neon' || trim === 'retro' || trim === 'worn' ? trim : null }, { detail: 14 });
    b.mesh.position.set(0.7, b.bottom ?? b.R, boardZ + 0.6);
    root.add(b.mesh);
  } else {
    mesh(roundedBox(0.8, 0.03, 0.8, 0.01), M.metal('#d6a93c', 0.22), { parent: root, at: [0, 0.015, variant === 'arena' ? -1.6 : 0] });
  }
  return done(root, 'basketball-hoop', variant, o);
}

/* =============================== COURT NETS =============================== */

export const NET_VARIANTS = {
  tennis: { w: 12.8, top: 1.07, mid: 0.914, depth: 1.0, post: 0.04, p: '#1f5a3a', cell: 0.045 },
  volleyball: { w: 9.5, top: 2.43, depth: 1.0, post: 0.05, p: '#c9ccd2', cell: 0.1 },
  badminton: { w: 6.1, top: 1.55, depth: 0.76, post: 0.025, p: '#c9ccd2', cell: 0.02 },
  pickleball: { w: 6.7, top: 0.91, mid: 0.86, depth: 0.76, post: 0.03, p: '#1d1f24', cell: 0.04 },
  'beach-volleyball': { w: 8.5, top: 2.43, depth: 1.0, post: 0.06, p: '#d8b07a', cell: 0.1, sand: true },
  'table-tennis': { table: true, p: '#14427a' },
};

export function createSportsNet(options = {}) {
  const { o, variant, trim, T, V } = setup(options, NET_VARIANTS, 'sports-net');
  const root = group(`sports-net-${variant}`);
  const k = T.kids ? 0.55 : 1;
  const pm = postMat(T, trim, V.p);
  const nm = netMat(T, trim, '#1a1a1a');
  const tape = fin(T, T.pattern ? T.s : trim === 'neon' ? T.a : '#f6f6f4', 'fabric');
  if (V.table) {
    const W = 2.74 * (T.kids ? 0.6 : 1), D = 1.525 * (T.kids ? 0.6 : 1), H = 0.76 * (T.kids ? 0.75 : 1);
    const top = group('table', { parent: root });
    const tm = trim === 'retro' ? M.wood('#2f5a3a') : trim ? bodyMat(T, T.pattern ? T.p : T.p) : fin(T, V.p, 'matte');
    mesh(roundedBox(W, 0.025, D, 0.006), tm, { parent: top, at: [0, H - 0.0125, 0] });
    const line = fin(T, trim === 'neon' ? T.a : '#f6f6f4', 'matte');
    for (const z of [-D / 2 + 0.01, D / 2 - 0.01]) mesh(new THREE.BoxGeometry(W, 0.001, 0.02), line, { parent: top, at: [0, H + 0.0005, z] });
    for (const x of [-W / 2 + 0.01, W / 2 - 0.01]) mesh(new THREE.BoxGeometry(0.02, 0.001, D), line, { parent: top, at: [x, H + 0.0005, 0] });
    mesh(new THREE.BoxGeometry(W, 0.001, 0.003), line, { parent: top, at: [0, H + 0.0006, 0] });
    // legs / undercarriage
    const lm = trim === 'retro' ? M.wood('#5b3a24') : M.metal(trim === 'stealth' ? '#1c1d20' : '#2a2c31', 0.4);
    if (trim === 'pro' || trim === 'champion') {
      for (const s of [-1, 1]) {
        mesh(roundedBox(0.08, H - 0.12, D * 0.7, 0.02), trim === 'champion' ? M.metal('#d6a93c', 0.2) : fin(T, T.a ?? '#e5402a'), { parent: top, at: [s * W * 0.3, (H - 0.12) / 2 + 0.08, 0] });
        mesh(roundedBox(0.3, 0.08, D * 0.85, 0.03), lm, { parent: top, at: [s * W * 0.3, 0.04, 0] });
        mesh(roundedBox(0.2, 0.04, D * 0.75, 0.01), lm, { parent: top, at: [s * W * 0.3, H - 0.045, 0] });
      }
    } else {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        mesh(roundedBox(0.05, H - 0.025, 0.05, 0.01), lm, { parent: top, at: [sx * (W / 2 - 0.15), (H - 0.025) / 2, sz * (D / 2 - 0.1)] });
        mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), M.rubber(), { parent: top, at: [sx * (W / 2 - 0.15), 0.01, sz * (D / 2 - 0.1)] });
      }
      for (const sx of [-1, 1]) mesh(roundedBox(0.04, 0.04, D - 0.2, 0.01), lm, { parent: top, at: [sx * (W / 2 - 0.15), 0.25, 0] });
      mesh(roundedBox(W - 0.3, 0.04, 0.04, 0.01), lm, { parent: top, at: [0, 0.25, 0] });
    }
    // net with posts
    const nh = 0.1525;
    for (const s of [-1, 1]) {
      mesh(roundedBox(0.03, nh + 0.02, 0.03, 0.006), M.metal('#2a2c31', 0.4), { parent: top, at: [0, H + (nh + 0.02) / 2, s * (D / 2 + 0.1)] });
      mesh(roundedBox(0.05, 0.05, 0.12, 0.01), M.metal('#2a2c31', 0.4), { parent: top, at: [0, H - 0.01, s * (D / 2 + 0.05)] });
    }
    const lines = [];
    for (let i = 0; i <= 60; i++) { const z = -D / 2 - 0.1 + ((D + 0.2) * i) / 60; lines.push([[0, H, z], [0, H + nh, z]]); }
    for (let j = 0; j <= 10; j++) { const y = H + (nh * j) / 10; lines.push([[0, y, -D / 2 - 0.1], [0, y, D / 2 + 0.1]]); }
    cords(lines, 0.0012, nm, top);
    mesh(new THREE.BoxGeometry(0.006, 0.015, D + 0.2), tape, { parent: top, at: [0, H + nh - 0.007, 0] });
    // paddles + ball on table
    const ball = mesh(new THREE.SphereGeometry(0.02, 16, 12), fin(T, trim === 'neon' ? T.p : '#ffffff', 'matte'), { parent: top, at: [W * 0.25, H + 0.02, 0.2], name: 'ttball' });
    void ball;
    return done(root, 'sports-net', variant, o);
  }
  const w = V.w * k, topH = V.top * (T.kids ? 0.7 : 1), mid = (V.mid ?? V.top) * (T.kids ? 0.7 : 1);
  const depth = V.depth * (T.kids ? 0.8 : 1);
  const pr = V.post * (T.chunky > 1 ? 1.3 : 1);
  const postH = topH + 0.05;
  for (const s of [-1, 1]) {
    const x = s * (w / 2 + 0.1);
    if (T.pattern) stripedTube([x, 0, 0], [x, postH, 0], pr, pm, fin(T, T.p), root, 6);
    else mesh(trim === 'retro' ? roundedBox(pr * 2, postH, pr * 2, pr * 0.3) : new THREE.CylinderGeometry(pr, pr, postH, 16), pm, { parent: root, at: [x, postH / 2, 0] });
    mesh(new THREE.SphereGeometry(pr * 1.1, 12, 8), pm, { parent: root, at: [x, postH, 0] });
    if (V.sand) {
      // guy ropes to sand anchors
      for (const dz of [-1, 1]) { curveTube([[x, postH, 0], [x + s * 1.2, 0.02, dz * 1.0]], 0.004, M.fabric('#f2e6c8'), { parent: root, segments: 2 }); mesh(new THREE.ConeGeometry(0.03, 0.08, 8).rotateX(Math.PI), M.metal('#9a9a94'), { parent: root, at: [x + s * 1.2, 0.04, dz * 1.0] }); }
    } else if (variant === 'volleyball' || variant === 'badminton' || trim === 'kids') {
      // weighted base plate
      mesh(roundedBox(0.5 * (T.kids ? 0.6 : 1), 0.06, 0.5 * (T.kids ? 0.6 : 1), 0.02), fin(T, '#2a2c31', 'metal'), { parent: root, at: [x, 0.03, 0] });
      if (variant === 'volleyball' && trim !== 'kids') mesh(roundedBox(pr * 2 + 0.1, 1.8, pr * 2 + 0.1, 0.05), fin(T, trim ? T.p : '#1d4fa0', 'foam'), { parent: root, at: [x, 0.96, 0], name: 'pad' });
    } else {
      mesh(new THREE.CylinderGeometry(pr * 2.2, pr * 2.2, 0.02, 16), M.metal('#5a5d62'), { parent: root, at: [x, 0.01, 0] });
      // tennis winder
      if (variant === 'tennis') { mesh(roundedBox(0.06, 0.1, 0.08, 0.01), M.metal('#5a5d62'), { parent: root, at: [x, topH - 0.15, 0.06] }); }
    }
  }
  // net body
  const lines = [];
  const bottom = V.sand || variant === 'volleyball' ? topH - depth : Math.max(0.02, mid - depth);
  const nx = Math.round(w / (V.cell * 2.2));
  const topAt = (x) => mid + (topH - mid) * (2 * x / w) ** 2;
  for (let i = 0; i <= nx; i++) { const x = -w / 2 + (w * i) / nx; lines.push([[x, bottom, 0], [x, topAt(x), 0]]); }
  const ny = Math.round(depth / (V.cell * 2.2));
  for (let j = 0; j <= ny; j++) {
    const t = j / ny;
    const pts = [];
    for (let i = 0; i <= 8; i++) { const x = -w / 2 + (w * i) / 8; pts.push([x, bottom + (topAt(x) - bottom) * t, 0]); }
    lines.push(pts);
  }
  cords(lines, 0.0018, nm, root);
  // headband + cable to posts
  const band = [];
  for (let i = 0; i <= 16; i++) { const x = -w / 2 + (w * i) / 16; band.push([x, topAt(x) - 0.025, 0]); }
  curveTube(band, 0.026, tape, { parent: root, segments: 32, radialSegments: 6 }).scale.z = 0.25;
  curveTube([[-w / 2 - 0.1, postH - 0.03, 0], ...band.map(([x, y]) => [x, y + 0.02, 0]), [w / 2 + 0.1, postH - 0.03, 0]], 0.004, M.metal('#3a3c42'), { parent: root, segments: 36 });
  if (variant === 'pickleball') {
    // portable frame: bottom tube between the posts on splayed feet
    const fm = M.metal(trim === 'stealth' ? '#1c1d20' : '#2a2c31', 0.4);
    mesh(new THREE.CylinderGeometry(0.02, 0.02, w + 0.2, 12).rotateZ(Math.PI / 2), fm, { parent: root, at: [0, 0.03, 0] });
    for (const s of [-1, 1]) mesh(roundedBox(0.05, 0.03, 0.9, 0.01), fm, { parent: root, at: [s * (w / 2 + 0.1), 0.015, 0] });
    for (let i = -1; i <= 1; i++) mesh(roundedBox(0.05, 0.03, 0.6, 0.01), fm, { parent: root, at: [i * w / 4, 0.015, 0] });
  }
  if (V.mid) {
    // centre strap
    mesh(roundedBox(0.05, mid, 0.008, 0.002), tape, { parent: root, at: [0, mid / 2, 0.005] });
    mesh(roundedBox(0.08, 0.02, 0.04, 0.006), M.metal('#5a5d62'), { parent: root, at: [0, 0.01, 0.005] });
  }
  if (variant === 'volleyball' || V.sand) {
    // side antennas
    for (const s of [-1, 1]) for (let i = 0; i < 8; i++) mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.22, 8), fin(T, i % 2 ? '#d0201e' : '#f6f6f4', 'plastic'), { parent: root, at: [s * (w / 2 - 0.15), bottom + i * 0.22 + 0.11, 0.0065] });
  }
  if (V.sand) mesh(new THREE.CylinderGeometry(Math.max(w * 0.7, w / 2 + 1.6), Math.max(w * 0.72, w / 2 + 1.62), 0.04, 40), M.matte('#e2c99a', 1), { parent: root, at: [0, -0.02, 0] }).scale.z = 0.4;
  if (trim !== 'champion' && !V.sand) {
    const bv = variant === 'tennis' || variant === 'pickleball' ? 'tennis' : variant === 'volleyball' ? 'volleyball' : null;
    if (bv) { const b = buildBall(bv, { ...T, trim: trim === 'kids' || trim === 'neon' ? trim : null }, { detail: 12 }); b.mesh.position.set(w * 0.2, b.bottom ?? b.R, 0.6); root.add(b.mesh); }
  }
  return done(root, 'sports-net', variant, o);
}
