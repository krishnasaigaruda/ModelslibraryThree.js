// Industrial: drums & barrels, crates & pallets, pipes, valves, gears, conveyors and generators.
import {
  THREE, M, mesh, group, roundedBox, curveTube, lathe, cushion, makeTool, shapeGeo, ringGeo, arc, tub,
  cyl, cylX, cylZ, sphere, torus, latheX, hazard, textDecal, hollowBox, lampGroup, lampTracks,
  spinTrack, rotateTrack, moveTrack, clip, pingPong, wave,
} from './common.js';

const PI = Math.PI;
const IBASE = { p: '#1f5fa8', s: '#2b2e33', a: '#e8b20f' };
const post = (par, w, h, d, mat, at, r = 0.006) => mesh(roundedBox(w, h, d, r), mat, { parent: par, at: [at[0], at[1] + h / 2, at[2]] });

/** Body material for industrial trims (stainless = brushed steel everywhere). */
const ibody = (T, m, fallback) => (T.stainless ? M.metal('#d4d8dc', 0.22) : T.trim && T.trim !== 'set' ? m.body : fallback ?? m.body);

/* ================================= barrels ================================= */

export const BARREL_VARIANTS = { 'steel-drum': {}, 'plastic-drum': {}, wooden: {}, 'open-top': {}, 'ibc-tote': {} };

function drum(par, T, m, variant, at = [0, 0, 0], name = 'drum') {
  const g = group(name, { parent: par, at });
  const R = 0.286, H = 0.88;
  if (variant === 'wooden') {
    const wood = T.kids ? m.body : T.rust ? m.wood : M.wood(T.vintage ? '#6b4a2c' : '#9a6b3c');
    const prof = Array.from({ length: 11 }, (_, i) => { const t = i / 10; return [0.25 + 0.05 * Math.sin(t * PI), t * 0.8]; });
    mesh(lathe([[0, 0.02], ...prof.map(([r, y]) => [r, y]), [0, 0.78]], 32), wood, { parent: g });
    const hoop = T.stainless ? M.chrome() : T.rust ? m.steel : m.dark;
    for (const y of [0.06, 0.2, 0.6, 0.74]) { const r = 0.25 + 0.05 * Math.sin((y / 0.8) * PI); mesh(lathe([[r + 0.001, -0.02], [r + 0.006, -0.018], [r + 0.006, 0.018], [r + 0.001, 0.02]], 32), hoop, { parent: g, at: [0, y, 0] }); }
    mesh(cylZ(0.02, 0.03, 12), M.wood('#5b3a24'), { parent: g, at: [0, 0.4, 0.3] });
    return g;
  }
  if (variant === 'ibc-tote') {
    const S = 1.0;
    post(g, 1.2, 0.14, S, M.wood('#b8874f'), [0, 0, 0]);
    post(g, 1.1, 0.04, 0.95, m.dark, [0, 0.14, 0]);
    mesh(roundedBox(1.06, 0.86, 0.92, 0.06), M.plastic(T.kids ? T.p : '#f2f0ea', 0.5), { parent: g, at: [0, 0.61, 0] });
    const cage = T.stainless ? M.chrome() : m.steel;
    for (let k = 0; k <= 6; k++) for (const sz of [-1, 1]) mesh(cyl(0.01, 0.01, 0.9, 6), cage, { parent: g, at: [-0.54 + k * 0.18, 0.62, sz * 0.475] });
    for (let k = 0; k <= 5; k++) for (const sx of [-1, 1]) mesh(cyl(0.01, 0.01, 0.9, 6), cage, { parent: g, at: [sx * 0.545, 0.62, -0.45 + k * 0.18] });
    for (const y of [0.2, 0.62, 1.06]) {
      for (const sz of [-1, 1]) mesh(cylX(0.012, 1.1, 6), cage, { parent: g, at: [0, y, sz * 0.475] });
      for (const sx of [-1, 1]) mesh(cylZ(0.012, 0.96, 6), cage, { parent: g, at: [sx * 0.545, y, 0] });
    }
    mesh(cyl(0.08, 0.08, 0.05, 20), M.plastic('#2b2e33', 0.4), { parent: g, at: [0, 1.06, 0] });
    mesh(cylZ(0.05, 0.12, 16), M.plastic('#2b2e33', 0.4), { parent: g, at: [0, 0.24, 0.5] });
    if (T.pro) hazard(g, 0.5, 0.08, { at: [0, 0.07, S / 2 + 0.0005] });
    return g;
  }
  const plastic = variant === 'plastic-drum';
  const col = plastic ? (T.trim && T.trim !== 'set' ? null : '#2a5fb8') : null;
  const mat = T.stainless ? M.metal('#d4d8dc', 0.22) : col ? m.plastic(col, 0.45) : variant === 'steel-drum' && !T.trim ? m.paint('#c0392b') : m.body;
  if (plastic) {
    mesh(lathe([[0, 0], [R - 0.03, 0], [R, 0.04], [R, H - 0.05], [R - 0.04, H], [0, H]], 36), mat, { parent: g });
    for (const y of [0.3, 0.58]) mesh(torus(R - 0.002, 0.008, 36, 6), mat, { parent: g, at: [0, y, 0], rot: [PI / 2, 0, 0] });
    for (const sx of [-1, 1]) mesh(cyl(0.035, 0.035, 0.02, 14), mat, { parent: g, at: [sx * 0.15, H + 0.005, 0] });
  } else {
    const open = variant === 'open-top';
    mesh(lathe(open ? [[0, 0], [R, 0], [R, H], [R - 0.003, H], [R - 0.003, 0.004], [0, 0.004]] : [[0, 0], [R, 0], [R, H], [0, H]], 36), mat, { parent: g });
    for (const y of [0.012, H * 0.33, H * 0.66, H - 0.012]) mesh(torus(R, 0.01, 36, 6), mat, { parent: g, at: [0, y, 0], rot: [PI / 2, 0, 0] });
    if (open) {
      const lid = group('lid', { parent: g, at: [-R, H, 0] });
      mesh(cyl(R + 0.01, R + 0.01, 0.02, 36), mat, { parent: lid, at: [R, 0.01, 0] });
      mesh(torus(R + 0.012, 0.01, 36, 6), m.steel, { parent: lid, at: [R, 0.012, 0], rot: [PI / 2, 0, 0] });
      g.userData.lid = lid;
    } else {
      for (const [x, r] of [[0.17, 0.03], [-0.17, 0.02]]) mesh(cyl(r, r, 0.012, 14), m.steel, { parent: g, at: [x, H + 0.006, 0] });
    }
    if (!T.kids) {
      const lab = T.pro ? 'H2O' : T.vintage ? 'OIL' : 'No.5';
      textDecal(g, 0.22, 0.12, lab, { at: [0, H * 0.5, R + 0.004], bg: T.pro ? '#f5b301' : '#f2f0ea', color: '#17181b' });
    }
  }
  return g;
}

export const createIndustrialBarrel = makeTool('industrial-barrel', BARREL_VARIANTS, IBASE, (g, { T, m, variant }) => {
  const d = drum(g, T, m, variant);
  if (T.heavy && variant !== 'ibc-tote') {
    // drum dolly underneath: steel ring on castors
    d.position.y = 0.09;
    mesh(torus(0.3, 0.015, 32, 8), m.dark, { parent: g, at: [0, 0.075, 0], rot: [PI / 2, 0, 0] });
    for (let k = 0; k < 4; k++) { const a = (k / 4) * PI * 2 + PI / 4; post(g, 0.05, 0.03, 0.05, m.dark, [Math.cos(a) * 0.3, 0.045, Math.sin(a) * 0.3]); mesh(cylX(0.025, 0.02, 12), m.rubber, { parent: g, at: [Math.cos(a) * 0.3, 0.025, Math.sin(a) * 0.3] }); }
  }
  if (d.userData.lid) return [clip('open', 4, [rotateTrack(d.userData.lid, 'z', 4, (u) => 1.6 * pingPong(u))])];
  return [];
}, {
  lay: false,
  set: (g, { T, m, variant }) => {
    if (variant === 'ibc-tote') { drum(g, T, m, variant, [-0.62, 0, 0], 'toteA'); drum(g, T, m, variant, [0.62, 0, 0], 'toteB'); return []; }
    post(g, 1.2, 0.14, 1.2, M.wood('#b8874f'), [0, 0, 0]);
    for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) drum(g, T, m, variant, [x, 0.14, z], `drum${x > 0 ? 'R' : 'L'}${z > 0 ? 'F' : 'B'}`);
    return [];
  },
});

/* ================================== crates ================================== */

export const CRATE_VARIANTS = { 'wooden-slat': {}, plywood: {}, plastic: {}, pallet: {}, 'wire-cage': {} };

function pallet(par, T, m, at = [0, 0, 0], name = 'pallet', W = 1.2, D = 0.8) {
  const g = group(name, { parent: par, at });
  const wood = T.kids ? m.body : T.stainless ? M.metal('#d4d8dc', 0.3) : T.rust ? m.wood : T.vintage ? M.wood('#8a6b4a') : M.wood('#c9a46a');
  for (const z of [-D / 2 + 0.05, 0, D / 2 - 0.05]) post(g, W, 0.022, 0.1, wood, [0, 0, z], 0.003);
  for (const x of [-W / 2 + 0.05, 0, W / 2 - 0.05]) for (const z of [-D / 2 + 0.05, 0, D / 2 - 0.05]) post(g, 0.1, 0.078, 0.1, wood, [x, 0.022, z], 0.004);
  for (const x of [-W / 2 + 0.05, 0, W / 2 - 0.05]) post(g, 0.1, 0.022, D, wood, [x, 0.1, 0], 0.003);
  for (let k = 0; k < 7; k++) post(g, W, 0.022, 0.095, wood, [0, 0.122, -D / 2 + 0.0475 + k * ((D - 0.095) / 6)], 0.003);
  return g;
}

function crate(par, T, m, variant, at = [0, 0, 0], name = 'crate', anims) {
  const g = group(name, { parent: par, at });
  if (variant === 'pallet') { pallet(g, T, m); return g; }
  if (variant === 'plastic') {
    const W = 0.6, D = 0.4, H = 0.3;
    const mat = T.stainless ? M.metal('#d4d8dc', 0.3) : m.plastic(T.trim && T.trim !== 'set' ? T.p : '#e8b20f', 0.45);
    mesh(tub(0.38, 0.4, H, 0.008, 4, { lip: 0.008 }), mat, { parent: g, scale: [W / 0.565, 1, D / 0.565] });
    for (const sx of [-1, 1]) mesh(roundedBox(0.004, 0.035, 0.11, 0.0015), m.black, { parent: g, at: [sx * (W / 2 + 0.0035), H - 0.05, 0] });
    for (let k = 0; k < 5; k++) for (const sz of [-1, 1]) mesh(roundedBox(0.06, 0.12, 0.003, 0.001), m.black, { parent: g, at: [-0.2 + k * 0.1, H * 0.4, sz * (D / 2 + 0.002)] });
    return g;
  }
  if (variant === 'wire-cage') {
    pallet(g, T, m, [0, 0, 0], 'cagepallet', 1.2, 0.8);
    const cage = T.stainless ? M.chrome() : T.trim && T.trim !== 'set' ? m.body : m.steel;
    const y0 = 0.144, H = 0.8;
    for (let k = 0; k <= 10; k++) for (const sz of [-1, 1]) mesh(cyl(0.004, 0.004, H, 5), cage, { parent: g, at: [-0.58 + k * 0.116, y0 + H / 2, sz * 0.38] });
    for (let k = 0; k <= 6; k++) for (const sx of [-1, 1]) mesh(cyl(0.004, 0.004, H, 5), cage, { parent: g, at: [sx * 0.58, y0 + H / 2, -0.38 + k * 0.1267] });
    for (let j = 0; j <= 6; j++) {
      const y = y0 + j * (H / 6);
      for (const sz of [-1, 1]) mesh(cylX(0.004, 1.16, 5), cage, { parent: g, at: [0, y, sz * 0.38] });
      for (const sx of [-1, 1]) mesh(cylZ(0.004, 0.76, 5), cage, { parent: g, at: [sx * 0.58, y, 0] });
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(cyl(0.015, 0.015, H, 8), cage, { parent: g, at: [sx * 0.58, y0 + H / 2, sz * 0.38] });
    return g;
  }
  const W = variant === 'plywood' ? 0.8 : 0.7, D = variant === 'plywood' ? 0.6 : 0.5, H = variant === 'plywood' ? 0.55 : 0.45;
  const wood = T.kids ? m.body : T.stainless ? M.metal('#d4d8dc', 0.3) : T.rust ? m.wood : T.vintage ? M.wood('#8a6b4a') : M.wood(variant === 'plywood' ? '#d9b98a' : '#c9a46a');
  const t = 0.018;
  if (variant === 'plywood') hollowBox(g, W, H, D, t, wood, { name: 'ply', r: 0.002 });
  else {
    mesh(roundedBox(W, t, D, 0.003), wood, { parent: g, at: [0, t / 2, 0] });
    for (let k = 0; k < 4; k++) {
      const y = t + 0.01 + k * ((H - t) / 4) + (H - t) / 8 - 0.01;
      for (const sz of [-1, 1]) mesh(roundedBox(W, (H - t) / 4 - 0.02, t, 0.003), wood, { parent: g, at: [0, y, sz * (D / 2 - t / 2)] });
      for (const sx of [-1, 1]) mesh(roundedBox(t, (H - t) / 4 - 0.02, D - 2 * t, 0.003), wood, { parent: g, at: [sx * (W / 2 - t / 2), y, 0] });
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) post(g, 0.045, H - t, 0.045, wood, [sx * (W / 2 - 0.035), t, sz * (D / 2 - 0.035)], 0.004);
  }
  // edge battens / metal corners
  const corner = T.vintage ? m.brass : T.heavy || T.pro ? m.dark : null;
  if (corner) for (const sx of [-1, 1]) for (const sz of [-1, 1]) post(g, 0.05, H, 0.05, corner, [sx * (W / 2 - 0.02), 0, sz * (D / 2 - 0.02)], 0.004);
  const lid = group(`${name}_lid`, { parent: g, at: [0, H, -D / 2] });
  mesh(roundedBox(W + 0.01, t, D + 0.01, 0.003), wood, { parent: lid, at: [0, t / 2, D / 2] });
  if (variant === 'wooden-slat') for (const x of [-W / 3, W / 3]) mesh(roundedBox(0.07, 0.014, D, 0.003), wood, { parent: lid, at: [x, t + 0.007, D / 2] });
  if (!T.kids) textDecal(g, 0.3, 0.1, T.pro ? 'HEAVY' : T.vintage ? 'EXPORT' : 'FRAGILE', { at: [0, H * 0.55, D / 2 + 0.0015], bg: variant === 'plywood' ? '#d9b98a' : '#c9a46a', color: T.pro ? '#17181b' : '#b8261e' });
  if (T.pro) hazard(g, W * 0.9, 0.04, { at: [0, H * 0.2, D / 2 + 0.0015] });
  if (anims) anims.push(clip('open', 4, [rotateTrack(lid, 'x', 4, (u) => -1.7 * pingPong(u))]));
  return g;
}

export const createIndustrialCrate = makeTool('industrial-crate', CRATE_VARIANTS, IBASE, (g, { T, m, variant }) => {
  const anims = [];
  crate(g, T, m, variant, [0, 0, 0], 'crate', anims);
  if (T.heavy && variant !== 'pallet' && variant !== 'wire-cage') {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(cylX(0.04, 0.03, 14), m.rubber, { parent: g, at: [sx * 0.25, 0.04, sz * 0.15] });
    g.children[0].position.y = 0.08;
    post(g, 0.6, 0.02, 0.36, m.dark, [0, 0.06, 0]);
  }
  return anims;
}, {
  lay: false,
  set: (g, { T, m, variant }) => {
    if (variant === 'pallet') { for (let k = 0; k < 4; k++) pallet(g, T, m, [0, k * 0.144, 0], `pallet${k}`); return []; }
    if (variant === 'wire-cage') { crate(g, T, m, variant, [-0.62, 0, 0], 'cageA'); crate(g, T, m, variant, [0.62, 0, 0], 'cageB'); return []; }
    pallet(g, T, m, [0, 0, 0], 'basepallet');
    const s = variant === 'plastic' ? [0.6, 0.4, 0.3] : variant === 'plywood' ? [0.8, 0.6, 0.55] : [0.7, 0.5, 0.45];
    const lidT = variant === 'plastic' ? 0.008 : 0.018;
    const n = variant === 'plywood' ? 1 : 2;
    let k = 0;
    for (let i = 0; i < n; i++) for (const z of [-0.2, 0.2]) crate(g, T, m, variant, [n === 1 ? (z < 0 ? -0.2 : 0.2) * 1.5 * 0 : (i - 0.5) * (s[0] - 0.12), 0.144, n === 1 ? 0 : z * (s[1] / 0.4) * 0.95 * 0 + z], `c${k++}`).scale.setScalar(n === 1 ? 1 : 0.8);
    crate(g, T, m, variant, [0, 0.144 + s[2] * (n === 1 ? 1 : 0.8) + lidT, 0], 'ctop').scale.setScalar(0.8);
    return [];
  },
});

/* =================================== pipes =================================== */

export const PIPE_VARIANTS = { straight: {}, elbow: {}, tee: {}, manifold: {}, reducer: {} };

function flange(par, mat, bolt, at, axis, R) {
  const f = group('flange', { parent: par, at });
  const geo = axis === 'x' ? cylX(R * 1.7, 0.025, 28) : axis === 'z' ? cylZ(R * 1.7, 0.025, 28) : cyl(R * 1.7, R * 1.7, 0.025, 28);
  mesh(geo, mat, { parent: f });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * PI * 2, rr = R * 1.4;
    const p = axis === 'x' ? [0, Math.cos(a) * rr, Math.sin(a) * rr] : axis === 'z' ? [Math.cos(a) * rr, Math.sin(a) * rr, 0] : [Math.cos(a) * rr, 0, Math.sin(a) * rr];
    mesh(axis === 'x' ? cylX(0.008, 0.04, 6) : axis === 'z' ? cylZ(0.008, 0.04, 6) : cyl(0.008, 0.008, 0.04, 6), bolt, { parent: f, at: p });
  }
}

function pipeStand(par, m, x, y, R, z = 0) {
  post(par, 0.06, y - R * 0.9, 0.06, m.dark, [x, 0.02, z]);
  post(par, 0.2, 0.02, 0.2, m.dark, [x, 0, z]);
  mesh(new THREE.TorusGeometry(R + 0.006, 0.006, 6, 20, PI).rotateZ(PI), m.steel, { parent: par, at: [x, y, z], rot: [0, PI / 2, 0] });
  mesh(roundedBox(0.08, 0.015, 0.06, 0.004), m.dark, { parent: par, at: [x, y - R - 0.0075, z] });
}

export const createIndustrialPipe = makeTool('industrial-pipe', PIPE_VARIANTS, { ...IBASE, p: '#9aa0a6' }, (g, { T, m, variant }) => {
  const R = T.heavy ? 0.11 : 0.08, y = 0.5;
  const mat = T.stainless ? M.metal('#d4d8dc', 0.2) : T.trim && T.trim !== 'set' ? m.body : T.kids ? m.body : m.paint('#7d8a96');
  const bolt = T.vintage ? m.brass : m.steel;
  const run = (x0, x1, z = 0, r = R) => mesh(cylX(r, x1 - x0, 28), mat, { parent: g, at: [(x0 + x1) / 2, y, z] });
  if (variant === 'straight' || variant === 'reducer') {
    if (variant === 'reducer') {
      run(-0.8, -0.1);
      mesh(latheX([[R, 0], [R * 0.6, 0.2], [0, 0.2], [0, 0]], 28), mat, { parent: g, at: [-0.1, y, 0] });
      run(0.1, 0.8, 0, R * 0.6);
      flange(g, mat, bolt, [-0.1, y, 0], 'x', R);
      flange(g, mat, bolt, [0.1, y, 0], 'x', R * 0.6);
    } else { run(-0.8, 0.8); flange(g, mat, bolt, [0, y, 0], 'x', R); }
    for (const x of [-0.8, 0.8]) flange(g, mat, bolt, [x, y, 0], 'x', variant === 'reducer' && x > 0 ? R * 0.6 : R);
    pipeStand(g, m, -0.5, y, R); pipeStand(g, m, 0.5, y, variant === 'reducer' ? R * 0.6 : R);
  } else if (variant === 'elbow') {
    run(-0.7, -0.2);
    mesh(new THREE.TorusGeometry(0.2, R, 16, 24, PI / 2).rotateX(PI / 2), mat, { parent: g, at: [-0.2, y, 0.2] }).rotation.y = PI / 2;
    mesh(cylZ(R, 0.5, 28), mat, { parent: g, at: [0, y, 0.45] });
    flange(g, mat, bolt, [-0.7, y, 0], 'x', R); flange(g, mat, bolt, [0, y, 0.7], 'z', R);
    pipeStand(g, m, -0.45, y, R); pipeStand(g, m, 0, y, R, 0.45);
    g.children[g.children.length - 2].rotation.y = 0;
  } else if (variant === 'tee') {
    run(-0.7, 0.7);
    mesh(cyl(R, R, 0.45, 28), mat, { parent: g, at: [0, y + 0.225, 0] });
    flange(g, mat, bolt, [0, y + 0.45, 0], 'y', R);
    for (const x of [-0.7, 0.7]) flange(g, mat, bolt, [x, y, 0], 'x', R);
    pipeStand(g, m, -0.45, y, R); pipeStand(g, m, 0.45, y, R);
  } else {
    run(-0.8, 0.8, 0, R * 1.2);
    for (const x of [-0.8, 0.8]) flange(g, mat, bolt, [x, y, 0], 'x', R * 1.2);
    for (const x of [-0.45, 0, 0.45]) {
      mesh(cyl(R * 0.5, R * 0.5, 0.45, 20), mat, { parent: g, at: [x, y + 0.22, 0] });
      mesh(roundedBox(R * 1.4, 0.08, R * 1.4, 0.01), T.kids ? m.accent : m.paint('#c0392b'), { parent: g, at: [x, y + 0.3, 0] });
      const wh = group(`wheel${x < 0 ? 'L' : x > 0 ? 'R' : 'C'}`, { parent: g, at: [x, y + 0.41, 0] });
      mesh(cyl(0.008, 0.008, 0.07, 8), m.steel, { parent: wh, at: [0, -0.035, 0] });
      mesh(torus(0.07, 0.008, 24, 6), T.kids ? m.accent : m.paint('#c0392b'), { parent: wh, rot: [PI / 2, 0, 0] });
      for (let k = 0; k < 3; k++) mesh(cylX(0.005, 0.14, 6), T.kids ? m.accent : m.paint('#c0392b'), { parent: wh, rot: [0, (k * PI) / 3, 0] });
    }
    for (const x of [-0.65, 0.65]) pipeStand(g, m, x, y, R * 1.2);
  }
  if (T.pro) for (const x of [-0.3, 0.3]) if (variant !== 'elbow' || x < 0) mesh(cylX(R + 0.002, 0.08, 28), M.plastic('#f5b301', 0.4), { parent: g, at: [x - (variant === 'elbow' ? 0.1 : 0), y, 0] });
  return [];
}, {
  lay: false,
  set: (g, { one, m, T }) => {
    const anims = one(g, 0);
    for (let k = 0; k < 3; k++) mesh(cylX(0.08, 1.4, 24), T.stainless ? M.metal('#d4d8dc', 0.2) : m.paint('#7d8a96'), { parent: g, at: [0, 0.08 + (k === 2 ? 0.139 : 0), -0.6 + (k === 2 ? 0.08 : k * 0.16)] });
    return anims;
  },
});

/* =================================== valves =================================== */

export const VALVE_VARIANTS = { gate: {}, ball: {}, butterfly: {}, globe: {} };

export const createIndustrialValve = makeTool('industrial-valve', VALVE_VARIANTS, { ...IBASE, p: '#2b6fd1' }, (g, { T, m, variant }) => {
  const R = 0.05 * (T.heavy ? 1.3 : 1), y = 0.15 * (T.heavy ? 1.3 : 1);
  const body = T.stainless ? M.metal('#d4d8dc', 0.22) : T.vintage ? m.brass : T.trim && T.trim !== 'set' ? m.body : m.paint(variant === 'ball' ? '#c9a14a' : '#2b4e7a');
  const bolt = m.steel;
  const handleMat = T.kids ? m.accent : m.paint('#c0392b');
  // base skid + pipe stubs with flanges
  post(g, 0.5, 0.03, 0.2, m.dark, [0, 0, 0]);
  for (const sx of [-1, 1]) {
    post(g, 0.04, y - R - 0.03, 0.06, m.dark, [sx * 0.19, 0.03, 0]);
    mesh(cylX(R, 0.12, 24), m.steel, { parent: g, at: [sx * 0.18, y, 0] });
    flange(g, body, bolt, [sx * 0.11, y, 0], 'x', R);
  }
  const anims = [];
  mesh(cylX(R * 1.02, 0.22, 24), body, { parent: g, at: [0, y, 0] });
  if (variant === 'gate' || variant === 'globe') {
    if (variant === 'gate') mesh(roundedBox(0.12, R * 3, R * 2.2, 0.03), body, { parent: g, at: [0, y + R * 0.5, 0] });
    else mesh(sphere(R * 1.5, 24, 16), body, { parent: g, at: [0, y, 0], scale: [1.2, 1, 1] });
    mesh(cyl(R * 0.9, R * 0.7, R * 1.4, 20), body, { parent: g, at: [0, y + R * 2.2, 0] });
    mesh(cyl(0.008, 0.008, R * 2, 10), m.chrome, { parent: g, at: [0, y + R * 3.4, 0] });
    const wh = group('handwheel', { parent: g, at: [0, y + R * 3.9, 0] });
    mesh(torus(R * 1.3, 0.008 * (T.heavy ? 1.3 : 1), 28, 8), handleMat, { parent: wh, rot: [PI / 2, 0, 0] });
    for (let k = 0; k < 3; k++) mesh(cylX(0.006, R * 2.6, 8), handleMat, { parent: wh, rot: [0, (k * PI) / 3, 0] });
    mesh(cyl(0.014, 0.014, 0.02, 12), handleMat, { parent: wh });
    anims.push(clip('turn', 4, [rotateTrack(wh, 'y', 4, (u) => PI * 2 * pingPong(u))]));
  } else {
    if (variant === 'ball') mesh(sphere(R * 1.25, 24, 16), body, { parent: g, at: [0, y, 0], scale: [1.3, 1, 1] });
    else mesh(cylX(R * 1.7, 0.06, 28), body, { parent: g, at: [0, y, 0] });
    mesh(cyl(0.012, 0.012, R * 1.4, 10), m.steel, { parent: g, at: [0, y + R * 1.6, 0] });
    const lever = group('lever', { parent: g, at: [0, y + R * 2.2, 0] });
    mesh(roundedBox(0.03, 0.012, 0.03, 0.004), m.steel, { parent: lever });
    mesh(roundedBox(0.2, 0.01, 0.025, 0.004), handleMat, { parent: lever, at: [0.11, 0, 0] });
    mesh(roundedBox(0.06, 0.02, 0.03, 0.008), handleMat, { parent: lever, at: [0.2, 0, 0] });
    anims.push(clip('turn', 3, [rotateTrack(lever, 'y', 3, (u) => (PI / 2) * pingPong(u))]));
  }
  if (T.pro) hazard(g, 0.4, 0.02, { at: [0, 0.015, 0.1005] });
  return anims;
}, { lay: false, setScales: null, set: (g, { one, T, m }) => {
  const anims = one(g, 0);
  for (const [x, v] of [[-0.6, 'ball'], [0.6, 'butterfly']]) { const o = createIndustrialValve({ variant: v, trim: T.trim === 'set' ? undefined : T.trim }); o.position.x = x; o.traverse((c) => { if (c.name) c.name = `s${x > 0 ? 'R' : 'L'}_${c.name}`; }); g.add(o); }
  void m;
  return anims;
} });

/* ==================================== gears ==================================== */

export const GEAR_VARIANTS = { spur: {}, 'bevel-pair': {}, worm: {}, 'rack-pinion': {}, 'gear-train': {}, 'sprocket-chain': {} };

function gearShape(N, R, depth) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * PI * 2, s = (PI * 2) / N;
    const rr = R - depth;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr], [Math.cos(a + s * 0.18) * R, Math.sin(a + s * 0.18) * R], [Math.cos(a + s * 0.45) * R, Math.sin(a + s * 0.45) * R], [Math.cos(a + s * 0.63) * rr, Math.sin(a + s * 0.63) * rr]);
  }
  return pts;
}

function gearMesh(par, N, R, w, mat, { holes = true, name = 'gear', at, axis = 'z' } = {}) {
  const g = group(name, { parent: par, at });
  const hs = [{ c: [0, 0], r: R * 0.12 }];
  if (holes && R > 0.08) for (let k = 0; k < 5; k++) { const a = (k / 5) * PI * 2; hs.push({ c: [Math.cos(a) * R * 0.52, Math.sin(a) * R * 0.52], r: R * 0.17 }); }
  const geo = shapeGeo(gearShape(N, R, Math.min(0.03, R * 0.12)), w, { holes: hs, bevel: Math.min(0.003, w * 0.15), curve: 10 });
  if (axis === 'y') geo.rotateX(PI / 2);
  if (axis === 'x') geo.rotateY(PI / 2);
  mesh(geo, mat, { parent: g });
  const hub = axis === 'y' ? cyl(R * 0.2, R * 0.2, w * 1.6, 20) : axis === 'x' ? cylX(R * 0.2, w * 1.6, 20) : cylZ(R * 0.2, w * 1.6, 20);
  mesh(hub, mat, { parent: g });
  return g;
}

export const createIndustrialGear = makeTool('industrial-gear', GEAR_VARIANTS, { ...IBASE, p: '#9aa0a6' }, (g, { T, m, variant }) => {
  const steel = T.stainless ? M.chrome() : T.vintage ? m.brass : T.kids ? m.body : T.trim && T.trim !== 'set' ? m.body : M.metal('#a9adb2', 0.35);
  const steel2 = T.kids ? m.accent : T.vintage ? M.metal('#8a6b3a', 0.4) : T.trim === 'pro' ? m.dark : M.metal('#7c8188', 0.4);
  const base = T.kids ? m.body2 : T.pro ? m.body : m.paint('#2b4e7a');
  const anims = [];
  post(g, 0.8, 0.04, 0.3, base, [0, 0, 0]);
  if (T.pro) hazard(g, 0.78, 0.025, { at: [0, 0.02, 0.1505] });
  const upright = (x, h, z = 0) => { post(g, 0.06, h - 0.04, 0.08, base, [x, 0.04, z - 0.07]); mesh(cylZ(0.015, 0.16, 12), m.chrome, { parent: g, at: [x, h, z] }); };
  if (variant === 'spur') {
    upright(0, 0.38);
    const gr = gearMesh(g, 32, 0.3, 0.05, steel, { at: [0, 0.38, 0.0], name: 'gear' });
    anims.push(clip('spin', 6, [spinTrack(gr, 'z', 6)]));
  } else if (variant === 'gear-train') {
    const specs = [[-0.25, 0.27, 0.18, 24], [0.03, 0.27, 0.1, 14], [0.22, 0.27, 0.12, 16]];
    specs[1][0] = specs[0][0] + specs[0][2] + specs[1][2] - 0.022;
    specs[2][0] = specs[1][0] + specs[1][2] + specs[2][2] - 0.022;
    const tracks = [];
    specs.forEach(([x, y, r, n], i) => {
      upright(x, y);
      const gr = gearMesh(g, n, r, 0.04, i === 1 ? steel2 : steel, { at: [x, y, 0], name: `gear${i}` });
      if (i === 1) gr.rotation.z = PI / n;
      tracks.push(spinTrack(gr, 'z', (6 * r) / 0.18, i % 2 ? -1 : 1));
    });
    anims.push(clip('spin', 6, tracks));
  } else if (variant === 'rack-pinion') {
    const rack = group('rack', { parent: g, at: [0, 0.07, 0] });
    const teeth = [];
    const L = 0.7;
    teeth.push([-L / 2, 0], [L / 2, 0]);
    for (let x = L / 2; x > -L / 2 + 0.01; x -= 0.03) teeth.push([x, 0.04], [x - 0.008, 0.055], [x - 0.018, 0.055], [x - 0.026, 0.04]);
    mesh(shapeGeo(teeth.slice(0, 2).concat(teeth.slice(2)), 0.05, { bevel: 0.002 }), steel2, { parent: rack });
    post(g, 0.75, 0.03, 0.06, base, [0, 0.04, 0]);
    upright(0, 0.07 + 0.055 + 0.1 - 0.008);
    const pin = gearMesh(g, 20, 0.1, 0.05, steel, { at: [0, 0.07 + 0.055 + 0.1 - 0.008, 0], name: 'pinion' });
    anims.push(clip('drive', 4, [rotateTrack(pin, 'z', 4, (u) => -1.6 * wave(u)), moveTrack(rack, 4, (u) => [0.16 * wave(u), 0, 0])]));
  } else if (variant === 'bevel-pair') {
    const bevel = (R, n, name, at, rot) => {
      const gg = group(name, { parent: g, at, rot });
      mesh(lathe([[R * 0.2, 0], [R, 0], [R * 0.7, R * 0.4], [R * 0.2, R * 0.4]], n * 2), steel, { parent: gg });
      for (let k = 0; k < n; k++) mesh(roundedBox(0.012, R * 0.42, 0.016, 0.003), steel, { parent: gg, at: [Math.cos((k / n) * PI * 2) * R * 0.87, R * 0.17, Math.sin((k / n) * PI * 2) * R * 0.87], rot: [0, -(k / n) * PI * 2, 0.75] });
      return gg;
    };
    post(g, 0.08, 0.3, 0.08, base, [-0.05, 0.04, 0]);
    const a = bevel(0.14, 20, 'bevelA', [0.12, 0.34, 0], [0, 0, PI / 2]);
    mesh(cylX(0.015, 0.25, 12), m.chrome, { parent: g, at: [0.0, 0.34, 0] });
    post(g, 0.08, 0.1, 0.08, base, [0.3, 0.04, 0]);
    const b = bevel(0.14, 20, 'bevelB', [0.3, 0.2, 0], [0, 0, 0]);
    mesh(cyl(0.015, 0.015, 0.06, 12), m.chrome, { parent: g, at: [0.3, 0.17, 0] });
    anims.push(clip('spin', 6, [spinTrack(a, 'y', 6), spinTrack(b, 'y', 6, -1)]));
  } else if (variant === 'worm') {
    const wy = 0.12;
    for (const x of [-0.25, 0.25]) post(g, 0.05, wy - 0.04, 0.08, base, [x, 0.04, 0.15 - 0.15]);
    const worm = group('worm', { parent: g, at: [0, wy, 0] });
    mesh(cylX(0.03, 0.4, 16), steel2, { parent: worm });
    const pts = Array.from({ length: 121 }, (_, i) => { const t = i / 120; const a = t * PI * 2 * 8; return [-0.15 + t * 0.3, Math.cos(a) * 0.038, Math.sin(a) * 0.038]; });
    curveTube(pts, 0.009, steel2, { parent: worm, segments: 240, radialSegments: 6 });
    upright(0, wy + 0.038 + 0.2 - 0.01, -0.0);
    const wheelR = 0.2;
    const wg = gearMesh(g, 40, wheelR, 0.04, steel, { at: [0, wy + 0.038 + wheelR - 0.01, 0], name: 'wormwheel' });
    anims.push(clip('spin', 8, [spinTrack(worm, 'x', 1), spinTrack(wg, 'z', 8)]));
  } else {
    // sprocket + chain loop
    const r1 = 0.15, r2 = 0.08, d = 0.45, y = 0.3;
    upright(-d / 2, y); upright(d / 2, y);
    const s1 = gearMesh(g, 28, r1, 0.015, steel, { at: [-d / 2, y, 0], name: 'sprocketA' });
    const s2 = gearMesh(g, 15, r2, 0.015, steel, { at: [d / 2, y, 0], name: 'sprocketB' });
    const loop = [...arc([-d / 2, y], r1 + 0.006, PI / 2, PI * 1.5, 16), ...arc([d / 2, y], r2 + 0.006, -PI / 2, PI / 2, 10)].map(([x, yy]) => [x, yy, 0]);
    curveTube(loop, 0.008, T.kids ? m.accent : m.dark, { parent: g, closed: true, segments: 120, radialSegments: 6, name: 'chain' });
    anims.push(clip('spin', 4, [spinTrack(s1, 'z', 4), spinTrack(s2, 'z', 4 * (r2 / r1))]));
  }
  return anims;
}, { lay: false, setScales: null, set: (g, { T, m }) => {
  // gear assortment on a display shelf
  post(g, 1.0, 0.04, 0.4, m.paint('#2b4e7a'), [0, 0, 0]);
  const steel = T.stainless ? M.chrome() : M.metal('#a9adb2', 0.35);
  [[0.25, 24], [0.15, 18], [0.1, 12], [0.06, 10]].forEach(([r, n], i) => {
    const gr = gearMesh(g, n, r, 0.03, i % 2 ? m.brass : steel, { at: [-0.35 + i * 0.25, 0.04 + 0.015, 0], name: `g${i}`, axis: 'y' });
    void gr;
  });
  return [];
} });

/* ================================== conveyor ================================== */

export const CONVEYOR_VARIANTS = { belt: {}, roller: {}, incline: {} };

export const createConveyor = makeTool('conveyor', CONVEYOR_VARIANTS, { ...IBASE, p: '#2b6fd1' }, (g, { T, m, variant }) => {
  const L = 2.0, W = 0.6, H = 0.8;
  const frame = T.stainless ? M.metal('#d4d8dc', 0.22) : m.body;
  const inc = variant === 'incline' ? 0.25 : 0;
  const anims = [];
  const top = group('bed', { parent: g, at: [0, H, 0], rot: [0, 0, inc] });
  // legs (adjusted for incline)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (L / 2 - 0.15) * Math.cos(inc), hy = H + sx * (L / 2 - 0.15) * Math.sin(inc) - 0.06;
    post(g, 0.05, hy, 0.05, frame, [x, 0, sz * (W / 2 - 0.02)]);
    post(g, 0.1, 0.012, 0.1, m.dark, [x, 0, sz * (W / 2 - 0.02)]);
  }
  for (const sx of [-1, 1]) mesh(cylZ(0.012, W, 8), frame, { parent: g, at: [sx * (L / 2 - 0.15) * Math.cos(inc), 0.25, 0] });
  for (const sz of [-1, 1]) mesh(roundedBox(L, 0.1, 0.03, 0.006), frame, { parent: top, at: [0, -0.02, sz * (W / 2 + 0.015)] });
  if (variant === 'roller') {
    const rs = [];
    for (let k = 0; k < 20; k++) { const r = group(`roller${k}`, { parent: top, at: [-L / 2 + 0.05 + k * ((L - 0.1) / 19), 0, 0] }); mesh(cylZ(0.024, W, 16), T.kids ? m.accent : m.steel, { parent: r }); rs.push(r); }
    anims.push(clip('run', 1, rs.map((r) => spinTrack(r, 'z', 1, -1))));
  } else {
    const rr = 0.04;
    const drums = [];
    for (const sx of [-1, 1]) { const d = group(sx < 0 ? 'drumB' : 'drumF', { parent: top, at: [sx * (L / 2 - 0.02), 0, 0] }); mesh(cylZ(rr, W - 0.02, 20), m.steel, { parent: d }); drums.push(d); }
    const stad = [...arc([L / 2 - 0.02, 0], rr + 0.004, -PI / 2, PI / 2, 10), ...arc([-L / 2 + 0.02, 0], rr + 0.004, PI / 2, PI * 1.5, 10)];
    const inner = stad.map(([x, y]) => [x * (1 - 0.004 / L), y * 0.88]);
    mesh(shapeGeo(stad, W - 0.04, { bevel: 0, holes: [inner] }), M.matte(T.kids ? '#2b2b2b' : T.vintage ? '#7a5a3a' : '#1d1e20', 0.85), { parent: top, name: 'belt' });
    // cleats ride on the top run and loop (one pitch per cycle → seamless)
    const pitch = 0.2;
    const cleats = group('cleats', { parent: top, at: [0, rr + 0.004, 0] });
    for (let k = 0; k < 9; k++) mesh(roundedBox(0.02, 0.02, W - 0.08, 0.005), M.plastic(T.pro ? '#f5b301' : '#3a3d42', 0.5), { parent: cleats, at: [-0.8 + k * pitch, 0.008, 0] });
    if (variant === 'incline' || T.heavy) for (const sz of [-1, 1]) mesh(roundedBox(L, 0.12, 0.012, 0.004), frame, { parent: top, at: [0, 0.08, sz * (W / 2 + 0.006)] });
    mesh(roundedBox(0.3, 0.2, 0.25, 0.03), m.body2, { parent: g, at: [-(L / 2 - 0.15) * Math.cos(inc), 0.45 - inc * 0.6, W / 2 + 0.13] });
    mesh(cylZ(0.015, 0.12, 10), m.steel, { parent: g, at: [-(L / 2 - 0.15) * Math.cos(inc), 0.45 - inc * 0.6, W / 2 + 0.02] });
    anims.push(clip('run', 2, [moveTrack(cleats, 2, (u) => [u * pitch, 0, 0], 2), ...drums.map((d) => spinTrack(d, 'z', 2 * (2 * PI * rr) / pitch * 0 + 0.5, -1))]));
  }
  // a parcel riding on the bed
  const box = group('parcel', { parent: top, at: [-0.3, variant === 'roller' ? 0.024 : 0.064, 0] });
  mesh(roundedBox(0.35, 0.25, 0.3, 0.01), M.matte('#c9a46a', 0.9), { parent: box, at: [0, 0.125, 0] });
  mesh(new THREE.PlaneGeometry(0.06, 0.3).rotateX(-PI / 2), M.matte('#a88752', 0.6), { parent: box, at: [0, 0.2505, 0] });
  if (T.pro) for (const sz of [-1, 1]) hazard(top, L * 0.9, 0.06, { at: [0, -0.02, sz * (W / 2 + 0.031)], rot: [0, sz < 0 ? PI : 0, 0] });
  const stop = lampGroup('beacon', 'amber');
  mesh(cyl(0.02, 0.02, 0.2, 10), m.dark, { parent: g, at: [(L / 2 - 0.15) * Math.cos(inc), H + (L / 2 - 0.15) * Math.sin(inc) + 0.07, -W / 2 - 0.05] });
  stop.add(g, { at: [(L / 2 - 0.15) * Math.cos(inc), H + (L / 2 - 0.15) * Math.sin(inc) + 0.19, -W / 2 - 0.05], normal: [0, 1, 0], w: 0.05, h: 0.05, depth: 0.05, shape: 'round', glowSize: 0.15 });
  anims.push(clip('on', 1, lampTracks('beacon', 2.4, { blink: 2 })));
  return anims;
}, { lay: false, setScales: null, set: (g, { one, m }) => {
  const anims = one(g, 0);
  for (let k = 0; k < 3; k++) mesh(roundedBox(0.35, 0.25, 0.3, 0.01), M.matte('#c9a46a', 0.9), { parent: g, at: [1.35, 0.125 + k * 0.25, (k % 2) * 0.05], rot: [0, k * 0.2, 0] });
  void m;
  return anims;
} });

/* ================================= generator ================================= */

export const GENERATOR_VARIANTS = { portable: {}, inverter: {}, diesel: {} };

export const createGenerator = makeTool('generator', GENERATOR_VARIANTS, { ...IBASE, p: '#e8650f' }, (g, { T, m, variant }) => {
  const body = T.stainless ? M.metal('#d4d8dc', 0.22) : m.body;
  const anims = [];
  const panelLamp = (at, normal = [0, 0, 1]) => { const l = lampGroup('runlight', 'green'); l.add(g, { at, normal, w: 0.015, h: 0.015, depth: 0.006, shape: 'round', glowSize: 0.05 }); };
  if (variant === 'inverter') {
    mesh(cushion(0.5, 0.42, 0.3, { radius: 0.06, bulge: 0.12 }), T.trim ? body : m.paint('#c0201a'), { parent: g, at: [0, 0.23, 0] });
    mesh(roundedBox(0.48, 0.02, 0.28, 0.008), m.dark, { parent: g, at: [0, 0.01, 0] });
    curveTube([[-0.15, 0.42, 0], [-0.12, 0.5, 0], [0.12, 0.5, 0], [0.15, 0.42, 0]], 0.016, m.dark, { parent: g, radialSegments: 10, segments: 16 });
    mesh(roundedBox(0.22, 0.14, 0.006, 0.006), m.black, { parent: g, at: [0.08, 0.22, 0.155] });
    for (const x of [0.03, 0.13]) mesh(cylZ(0.016, 0.01, 14), M.plastic('#e8e8e4', 0.4), { parent: g, at: [x, 0.2, 0.16] });
    for (let k = 0; k < 6; k++) mesh(roundedBox(0.004, 0.12, 0.004, 0.001), m.black, { parent: g, at: [-0.18 + k * 0.02, 0.22, 0.152] });
    panelLamp([0.17, 0.27, 0.158]);
  } else if (variant === 'portable') {
    const fr = T.kids ? m.accent : m.dark;
    // tubular frame
    for (const sz of [-1, 1]) {
      curveTube([[-0.3, 0.02, sz * 0.22], [0.3, 0.02, sz * 0.22], [0.32, 0.25, sz * 0.22], [0.3, 0.5, sz * 0.22], [-0.3, 0.5, sz * 0.22], [-0.32, 0.25, sz * 0.22], [-0.3, 0.02, sz * 0.22]], 0.016, fr, { parent: g, radialSegments: 10, segments: 40, closed: false });
      for (const sx of [-1, 1]) mesh(roundedBox(0.05, 0.03, 0.05, 0.01), m.rubber, { parent: g, at: [sx * 0.25, 0.015, sz * 0.22] });
    }
    for (const sx of [-1, 1]) for (const y of [0.02, 0.5]) mesh(cylZ(0.014, 0.46, 10), fr, { parent: g, at: [sx * 0.3, y, 0] });
    mesh(roundedBox(0.64, 0.025, 0.46, 0.006), fr, { parent: g, at: [0, 0.045, 0] });
    // engine + alternator + tank
    mesh(roundedBox(0.22, 0.22, 0.24, 0.03), T.trim ? m.body2 : m.dark, { parent: g, at: [0.1, 0.17, 0] });
    mesh(cylX(0.1, 0.2, 24), T.vintage ? M.metal('#8a8f94', 0.4) : m.body2, { parent: g, at: [-0.12, 0.16, 0] });
    mesh(cushion(0.5, 0.14, 0.4, { radius: 0.05 }), body, { parent: g, at: [0, 0.35, 0] });
    mesh(cyl(0.035, 0.035, 0.03, 16), m.black, { parent: g, at: [0.1, 0.435, 0.05] });
    mesh(roundedBox(0.16, 0.12, 0.012, 0.006), m.black, { parent: g, at: [-0.12, 0.2, 0.1] });
    for (let k = 0; k < 2; k++) mesh(cylZ(0.016, 0.01, 14), M.plastic('#e8e8e4', 0.4), { parent: g, at: [-0.17 + k * 0.06, 0.19, 0.108] });
    curveTube([[0.18, 0.18, 0.12], [0.22, 0.18, 0.16]], 0.02, M.metal('#5a5d60', 0.5), { parent: g });
    panelLamp([-0.07, 0.235, 0.108]);
  } else {
    // diesel genset in an acoustic enclosure on a skid
    const W = 1.8, D = 0.9, H = 1.1;
    post(g, W + 0.1, 0.1, D, m.dark, [0, 0, 0]);
    mesh(roundedBox(W, H, D - 0.04, 0.03), body, { parent: g, at: [0, 0.1 + H / 2, 0] });
    for (const sx of [-1, 1]) mesh(roundedBox(0.7, H - 0.2, 0.01, 0.006), body, { parent: g, at: [sx * 0.42, 0.1 + H / 2, D / 2 - 0.015] });
    for (const sx of [-1, 1]) for (let k = 0; k < 10; k++) mesh(roundedBox(0.4, 0.012, 0.012, 0.003), m.black, { parent: g, at: [sx * (W / 2 + 0.003), 0.4 + k * 0.06, 0], rot: [0, PI / 2, 0] });
    mesh(cyl(0.06, 0.06, 0.25, 16), M.metal('#5a5d60', 0.5), { parent: g, at: [0.6, 0.1 + H + 0.12, -0.2] });
    mesh(roundedBox(0.3, 0.25, 0.012, 0.006), m.black, { parent: g, at: [-0.42, 0.75, D / 2 - 0.006] });
    mesh(roundedBox(0.12, 0.05, 0.004, 0.002), M.emissive('#3ddc5a', 0.8), { parent: g, at: [-0.42, 0.8, D / 2 + 0.001], name: 'lcd' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(torus(0.04, 0.008, 12, 6), m.steel, { parent: g, at: [sx * (W / 2 - 0.15), 0.1 + H + 0.04, sz * (D / 2 - 0.15)] });
    if (T.pro) hazard(g, W, 0.06, { at: [0, 0.05, D / 2 + 0.0005] });
    panelLamp([-0.3, 0.7, D / 2 + 0.002]);
  }
  anims.push(clip('on', 1, lampTracks('runlight', 2.4)));
  g.children[0].name ||= 'genbody';
  anims.push(clip('run', 0.12, [moveTrack(g.children[0], 0.12, (u) => [0, 0.0008 * wave(u), 0])]));
  return anims;
}, { lay: false, setScales: null, set: (g, { one, T }) => {
  const anims = one(g, 0);
  const can = group('jerrycan', { parent: g, at: [0.7, 0, 0] });
  mesh(roundedBox(0.17, 0.46, 0.33, 0.03), M.paint(T.pro ? '#f5b301' : '#c0201a', { metallic: 0.2, roughness: 0.4 }), { parent: can, at: [0, 0.23, 0] });
  for (const z of [-0.06, 0, 0.06]) mesh(cylZ(0.012, 0.02, 10), M.metal('#9aa0a6', 0.4), { parent: can, at: [0, 0.47, z] }).rotation.set(0, 0, PI / 2);
  curveTube([[0.25, 0.02, 0.22], [0.4, 0.0, 0.45], [0.7, 0.0, 0.25]], 0.006, M.plastic('#e8650f', 0.5), { parent: g, segments: 20, radialSegments: 6 });
  return anims;
} });
