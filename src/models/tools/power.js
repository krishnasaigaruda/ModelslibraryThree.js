// Power tools: drills, saws, sanders, grinders, routers & multitools. Built standing (y up),
// forward = +X. Corded versions trail a cable to a plug on the ground; cordless ones sit on a battery.
import {
  THREE, M, mesh, group, roundedBox, curveTube, lathe, cushion, makeTool, shapeGeo, ringGeo, arc,
  cyl, cylX, cylZ, sphere, torus, latheX, decal, hazard, textDecal, hollowBox, suffixNames,
  spinTrack, rotateTrack, moveTrack, clip, pingPong, wave,
} from './common.js';

const PI = Math.PI;
const BASE = { p: '#1d7bbf', s: '#1b1c1f', a: '#c9ccd1' };

/** Shell materials for a power tool trim. */
function pmats(T, m) {
  if (T.vintage) {
    const bak = new THREE.MeshPhysicalMaterial({ name: 'bakelite', color: '#4a2c1d', roughness: 0.35, clearcoat: 0.6 });
    return { shell: M.metal('#9aa0a6', 0.42), shell2: bak, grip: bak, metal: M.metal('#b5b9be', 0.3), cord: M.fabric('#6b5a45') };
  }
  return {
    shell: m.plastic(T.p, 0.38),
    shell2: m.plastic(T.s, 0.5),
    grip: T.kids ? m.accent : new THREE.MeshStandardMaterial({ name: 'grip', color: T.rust ? '#3a3633' : '#2a2b2e', roughness: 0.9 }),
    metal: T.kids ? m.alu : T.rust ? m.steel : M.metal('#a9adb2', 0.35),
    cord: T.kids ? m.accent : M.plastic(T.pro ? '#f5b301' : '#1d1e20', 0.6),
  };
}

/** Battery pack: top face at local y=h (attach under handle), sits on the ground at y=0. */
function battery(par, T, m, P, { at = [0, 0, 0], w = 0.08, d = 0.075, h = 0.06, name = 'battery' } = {}) {
  const b = group(name, { parent: par, at });
  mesh(roundedBox(w, h * 0.72, d, 0.008), P.shell2, { parent: b, at: [0, h * 0.36, 0] });
  mesh(roundedBox(w * 0.96, h * 0.32, d * 0.96, 0.006), P.shell, { parent: b, at: [0, h * 0.82, 0] });
  mesh(roundedBox(w * 0.3, 0.008, 0.012, 0.003), P.shell, { parent: b, at: [-w * 0.2, h * 0.74, d / 2] });
  for (let k = 0; k < 3; k++) mesh(roundedBox(0.005, 0.003, 0.002, 0.001), M.emissive('#3ddc5a', 0.8), { parent: b, at: [w * 0.12 + k * 0.008, h * 0.45, d / 2 + 0.0005] });
  return b;
}

/** Cord from a point down to the ground and along it to a plug. */
function cord(par, P, from, dir = -1, len = 0.35) {
  const [x, y, z] = from;
  const r = 0.0042;
  mesh(cyl(0.008, 0.006, 0.04, 12), P.shell2, { parent: par, at: [x + dir * 0.015, y - 0.004, z], rot: [0, 0, -dir * 1.1] });
  const pts = [[x + dir * 0.025, y - 0.016, z], [x + dir * 0.06, Math.max(r, y * 0.4), z + 0.02], [x + dir * 0.1, r, z + 0.06], [x + dir * len * 0.6, r, z + 0.12], [x + dir * len, r, z + 0.08]];
  curveTube(pts, r, P.cord, { parent: par, segments: 40, radialSegments: 8, name: 'cord' });
  const plug = group('plug', { parent: par, at: [x + dir * (len + 0.025), 0.011, z + 0.08] });
  mesh(roundedBox(0.05, 0.022, 0.03, 0.007), P.shell2, { parent: plug });
  for (const sz of [-1, 1]) mesh(roundedBox(0.016, 0.003, 0.006, 0.001), M.metal('#c9a14a', 0.3), { parent: plug, at: [dir * 0.03, 0, sz * 0.007] });
}

/** Slotted vents (dark slits) on a +Z facing surface. */
function vents(par, m, at, n = 5, w = 0.003, h = 0.02, gap = 0.007, z = 1) {
  for (let k = 0; k < n; k++) for (const s of [1, -1]) if (z || s > 0) mesh(roundedBox(w, h, 0.004, 0.001), m.black, { parent: par, at: [at[0] + (k - (n - 1) / 2) * gap, at[1], s * at[2]] });
}

/** Pistol grip handle (extruded side profile) from y0 (bottom) to the motor housing at y1. */
function pistolGrip(par, P, m, T, x, y0, y1, { depth = 0.036, rake = 0.025, trigger = true } = {}) {
  const h = y1 - y0;
  const pts = [[x - 0.022, y0], [x + 0.02, y0], [x + 0.022 + rake * 0.4, y0 + h * 0.5], [x + 0.018 + rake, y1], [x - 0.03 + rake, y1], [x - 0.025 + rake * 0.4, y0 + h * 0.5]];
  mesh(shapeGeo(pts, depth, { bevel: 0.008, seg: 3 }), P.shell, { parent: par });
  const gp = [[x - 0.026, y0 + h * 0.12], [x - 0.01, y0 + h * 0.12], [x - 0.006 + rake * 0.7, y0 + h * 0.82], [x - 0.034 + rake * 0.75, y0 + h * 0.86], [x - 0.029 + rake * 0.4, y0 + h * 0.5]];
  mesh(shapeGeo(gp, depth + 0.006, { bevel: 0.006, seg: 3 }), P.grip, { parent: par });
  if (trigger) mesh(roundedBox(0.012, 0.03, 0.014, 0.005), P.shell2, { parent: par, at: [x + 0.024 + rake * 0.8, y1 - 0.024, 0], rot: [0, 0, 0.25], name: 'trigger' });
  if (T.pro) hazard(par, 0.02, h * 0.3, { at: [x + rake * 0.5, y0 + h * 0.55, depth / 2 + 0.0035], rot: [0, 0, -0.2] });
}

/** Base under a handle at x: battery for cordless trims, foot + cord for corded. Returns top y. */
function handleBase(par, T, m, P, x, back = -1) {
  if (T.cordless || T.pro) {
    const big = T.pro ? 1.15 : T.compact ? 0.8 : 1;
    battery(par, T, m, P, { at: [x, 0, 0], w: 0.085 * big, d: 0.075, h: 0.06 * big });
    return 0.06 * big - 0.006;
  }
  mesh(roundedBox(0.07, 0.03, 0.06, 0.012), P.shell2, { parent: par, at: [x, 0.015, 0] });
  cord(par, P, [x + back * 0.035, 0.016, 0], back);
  return 0.028;
}

function setCase(g, ctx, { extras = true } = {}) {
  const { T, m, one } = ctx;
  const P = pmats(T, m);
  const item = group('tool-item');
  const anims = one(item, 0);
  item.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(item);
  const sz = b.getSize(new THREE.Vector3());
  const big = Math.max(sz.x, sz.z) > 0.55;
  const W = big ? 0 : sz.x + 0.2, D = big ? 0 : Math.max(0.3, sz.z + 0.12), wall = 0.01;
  if (!big) {
    hollowBox(g, W, 0.09, D, wall, m.plastic(T.p === BASE.p ? '#2b4a6b' : '#2b2e33', 0.5), { name: 'case' });
    mesh(roundedBox(W - 0.03, 0.02, D - 0.03, 0.006), M.matte('#222428', 0.95), { parent: g, at: [0, wall + 0.01, 0], name: 'foam' });
  }
  const floor = big ? 0 : wall + 0.02;
  item.position.set(-(b.min.x + b.max.x) / 2 - (big ? 0 : 0.07), floor - b.min.y, -(b.min.z + b.max.z) / 2);
  g.add(item);
  if (extras) {
    const ex = big ? b.max.x - (b.min.x + b.max.x) / 2 + 0.08 : W / 2 - 0.08;
    battery(g, T, m, P, { at: [ex, floor, -0.06], name: 'sparebatt' }).rotation.y = 0.2;
    const bits = group('bits', { parent: g, at: [ex, floor, 0.07] });
    mesh(roundedBox(0.09, 0.018, 0.05, 0.004), m.plastic('#e0e0e0', 0.4), { parent: bits, at: [0, 0.009, 0] });
    for (let k = 0; k < 6; k++) mesh(cylX(0.003, 0.07 - k * 0.006, 6), m.dark, { parent: bits, at: [0, 0.021, -0.02 + k * 0.008] });
  }
  return anims;
}

/* ================================= drill ================================= */

export const DRILL_VARIANTS = { drill: {}, 'hammer-drill': {}, 'impact-driver': {}, 'sds-rotary': {}, 'inline-driver': {}, 'drill-press': {} };

function chuckGroup(par, m, P, T, x, y, { r = 0.02, len = 0.045, bit = 0.07, hex = false } = {}) {
  const ch = group('chuck', { parent: par, at: [x, y, 0] });
  if (hex) {
    mesh(latheX([[0, 0], [r * 0.9, 0], [r * 0.8, len], [0, len]], 6), P.shell2, { parent: ch });
    mesh(cylX(0.0032, bit, 6), m.dark, { parent: ch, at: [len + bit / 2, 0, 0] });
  } else {
    mesh(latheX([[0, 0], [r, 0], [r * 1.02, len * 0.55], [r * 0.7, len * 0.95], [r * 0.4, len], [0, len]], 24), T.vintage ? P.metal : m.black, { parent: ch });
    mesh(latheX([[r * 0.01, 0], [r * 1.05, 0], [r * 1.05, len * 0.3], [0, len * 0.3]], 24), P.metal, { parent: ch, at: [len * 0.55, 0, 0] });
    mesh(cylX(0.003, bit, 10), m.dark, { parent: ch, at: [len + bit / 2 - 0.004, 0, 0] });
    mesh(latheX([[0, 0], [0.003, 0], [0.0005, 0.006], [0, 0.006]], 8), m.dark, { parent: ch, at: [len + bit - 0.004, 0, 0] });
  }
  return ch;
}

function drillPress(g, T, m, P) {
  const body = T.trim ? P.shell : m.paint('#2f6b4f');
  mesh(roundedBox(0.3, 0.035, 0.24, 0.01), body, { parent: g, at: [0, 0.0175, 0] });
  mesh(cyl(0.025, 0.025, 0.75, 20), m.chrome, { parent: g, at: [-0.07, 0.4, 0] });
  mesh(cyl(0.04, 0.04, 0.05, 20), body, { parent: g, at: [-0.07, 0.055, 0] });
  // table
  mesh(cyl(0.032, 0.032, 0.06, 20), body, { parent: g, at: [-0.07, 0.36, 0] });
  mesh(roundedBox(0.09, 0.03, 0.05, 0.008), body, { parent: g, at: [-0.02, 0.36, 0] });
  mesh(cyl(0.11, 0.11, 0.025, 32), body, { parent: g, at: [0.07, 0.36, 0] });
  // head
  const head = group('phead', { parent: g, at: [-0.07, 0.72, 0] });
  mesh(roundedBox(0.3, 0.13, 0.17, 0.03), body, { parent: head, at: [0.07, 0, 0] });
  mesh(roundedBox(0.2, 0.06, 0.18, 0.02), body, { parent: head, at: [0.03, 0.09, 0] });
  mesh(cyl(0.065, 0.065, 0.18, 24), T.vintage ? P.metal : body, { parent: head, at: [-0.08, 0.06, 0], rot: [0, 0, 0] });
  mesh(cyl(0.02, 0.02, 0.06, 16), m.chrome, { parent: head, at: [0.14, -0.08, 0] });
  const ch = group('chuck', { parent: head, at: [0.14, -0.12, 0] });
  mesh(lathe([[0, 0], [0.012, 0], [0.022, -0.02], [0.02, -0.045], [0, -0.05]], 20), m.black, { parent: ch, at: [0, 0.01, 0] });
  mesh(cyl(0.004, 0.004, 0.07, 10), m.dark, { parent: ch, at: [0, -0.07, 0] });
  const feed = group('feed', { parent: head, at: [0.07, -0.01, 0.085] });
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * PI * 2;
    mesh(cyl(0.005, 0.005, 0.13, 10), m.chrome, { parent: feed, at: [Math.cos(a) * 0.065, Math.sin(a) * 0.065, 0.01], rot: [0, 0, a - PI / 2] });
    mesh(sphere(0.012), m.black, { parent: feed, at: [Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0.01] });
  }
  mesh(cylZ(0.02, 0.03, 16), m.chrome, { parent: feed });
  mesh(roundedBox(0.03, 0.04, 0.012, 0.004), M.emissive('#d9302a', 0.4), { parent: head, at: [0.16, 0.0, 0.088] });
  cord(g, P, [-0.15, 0.03, 0.06], -1, 0.25);
  if (T.pro) hazard(head, 0.2, 0.02, { at: [0.07, -0.05, 0.0855] });
  return [clip('spin', 0.4, [spinTrack(ch, 'y', 0.4)]), clip('drill', 3, [moveTrack(ch, 3, (u) => [0, -0.05 * pingPong(u), 0])])];
}

export const createDrill = makeTool('drill', DRILL_VARIANTS, BASE, (g, { T, m, variant }) => {
  const P = pmats(T, m);
  if (variant === 'drill-press') return drillPress(g, T, m, P);
  if (variant === 'inline-driver') {
    const top = T.cordless || T.pro || T.trim === 'compact' ? 0 : 0.012;
    if (top) cord(g, P, [0, 0.008, 0], -1, 0.25);
    mesh(lathe([[0, 0], [0.022, 0], [0.024, 0.01], [0.021, 0.14], [0.018, 0.16], [0, 0.165]], 24), P.shell, { parent: g });
    mesh(lathe([[0, 0.02], [0.0235, 0.02], [0.0245, 0.1], [0, 0.1]], 24), P.grip, { parent: g });
    mesh(roundedBox(0.012, 0.02, 0.01, 0.004), P.shell2, { parent: g, at: [0, 0.11, 0.02] });
    const ch = group('chuck', { parent: g, at: [0, 0.163, 0] });
    mesh(cyl(0.008, 0.012, 0.02, 6), P.shell2, { parent: ch, at: [0, 0.01, 0] });
    mesh(cyl(0.003, 0.003, 0.03, 6), m.dark, { parent: ch, at: [0, 0.034, 0] });
    return [clip('spin', 0.5, [spinTrack(ch, 'y', 0.5)])];
  }
  const big = variant === 'sds-rotary' ? 1.25 : variant === 'hammer-drill' ? 1.1 : variant === 'impact-driver' ? 0.85 : 1;
  const H = handleBase(g, T, m, P, 0);
  const hy = H + 0.12 * big, R = 0.031 * big;
  const yC = hy + R * 0.7;
  const rear = variant === 'impact-driver' ? -0.06 : -0.075 * big, front = variant === 'impact-driver' ? 0.05 : 0.065 * big;
  pistolGrip(g, P, m, T, -0.005, H - 0.004, yC - R * 0.4);
  mesh(latheX([[0, 0], [R * 0.6, 0], [R * 0.95, R * 0.4], [R, R * 1.2], [R * 0.97, front - rear - 0.02], [R * 0.85, front - rear], [0, front - rear]], 28), P.shell, { parent: g, at: [rear, yC, 0] });
  mesh(latheX([[0, 0], [R * 0.86, 0], [R * 0.86, 0.03], [0, 0.03]], 28), P.shell2, { parent: g, at: [rear + 0.005, yC, 0] });
  vents(g, m, [rear + 0.025, yC + R * 0.2, R * 0.92], 4, 0.003, R * 0.7, 0.007);
  let x = front;
  if (variant === 'drill' || variant === 'hammer-drill') {
    mesh(latheX(Array.from({ length: 9 }, (_, i) => [i % 2 ? R * 0.95 : R * 0.88, (i / 8) * 0.025]), 24), P.shell2, { parent: g, at: [x, yC, 0], name: 'collar' });
    x += 0.025;
  }
  if (variant === 'sds-rotary') {
    mesh(latheX([[0, 0], [R * 0.75, 0], [R * 0.55, 0.05], [0, 0.05]], 24), P.metal, { parent: g, at: [x, yC, 0] });
    x += 0.048;
    mesh(latheX([[0, 0], [0.018, 0], [0.016, 0.035], [0, 0.035]], 20), m.rubber, { parent: g, at: [x, yC, 0], name: 'boot' });
    const ch = group('chuck', { parent: g, at: [x + 0.03, yC, 0] });
    mesh(cylX(0.005, 0.16, 10), m.dark, { parent: ch, at: [0.08, 0, 0] });
    mesh(latheX([[0, 0], [0.007, 0], [0, 0.012]], 8), m.dark, { parent: ch, at: [0.16, 0, 0] });
    // D side handle
    const sh = group('sidehandle', { parent: g, at: [x - 0.03, yC, 0] });
    mesh(torus(0.032, 0.006, 20, 8), P.shell2, { parent: sh, rot: [0, PI / 2, 0] });
    mesh(cyl(0.013, 0.012, 0.11, 16), P.grip, { parent: sh, at: [0, -0.08, 0.02], rot: [0.3, 0, 0] });
    return [clip('spin', 0.3, [spinTrack(ch, 'x', 0.3)]), clip('hammer', 0.25, [moveTrack(ch, 0.25, (u) => [0.004 * pingPong(u), 0, 0])])];
  }
  const ch = chuckGroup(g, m, P, T, x - 0.002, yC, { r: 0.019 * big, len: variant === 'impact-driver' ? 0.03 : 0.045 * big, hex: variant === 'impact-driver', bit: variant === 'impact-driver' ? 0.05 : 0.08 });
  if (variant === 'hammer-drill' || T.heavy) {
    const sh = group('sidehandle', { parent: g, at: [x - 0.012, yC, 0] });
    mesh(cylX(R * 0.95, 0.018, 24), P.shell2, { parent: sh });
    mesh(cyl(0.014, 0.012, 0.11, 16), P.grip, { parent: sh, at: [0, -0.02, 0.07], rot: [PI / 2 - 0.2, 0, 0] });
    mesh(sphere(0.016), P.shell2, { parent: sh, at: [0, -0.03, 0.125] });
  }
  if (T.kids) mesh(sphere(0.012), m.accent, { parent: g, at: [rear + 0.04, yC + R * 0.95, 0] });
  if (T.vintage) mesh(roundedBox(0.04, 0.012, 0.002, 0.002), M.metal('#c9a14a', 0.3), { parent: g, at: [rear + 0.06, yC, R * 0.98] });
  return [clip('spin', 0.4, [spinTrack(ch, 'x', 0.4)])];
}, { set: setCase, lay: false });

/* =============================== power saw =============================== */

export const POWER_SAW_VARIANTS = { circular: {}, 'table-saw': {}, 'miter-saw': {}, jigsaw: {}, 'track-saw': {} };

function bladeGeo(R, teeth = 24, t = 0.0018, bore = 0.008) {
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * PI * 2, b = ((i + 0.75) / teeth) * PI * 2;
    pts.push([Math.cos(a) * R, Math.sin(a) * R], [Math.cos(b) * R * 0.93, Math.sin(b) * R * 0.93]);
  }
  return shapeGeo(pts, t, { bevel: 0, holes: [{ c: [0, 0], r: bore }] });
}

function circularSaw(g, T, m, P, { R = 0.092, rail = false } = {}) {
  const y0 = rail ? 0.012 : 0;
  const plateW = 0.32, plateD = 0.2;
  mesh(roundedBox(plateW, 0.006, plateD, 0.002), T.kids ? m.alu : P.metal, { parent: g, at: [0, y0 + 0.003, 0] });
  const bz = 0.03;
  const blade = group('blade', { parent: g, at: [0.02, y0 + R * 0.45, bz] });
  mesh(bladeGeo(R, T.kids ? 12 : 24), T.kids ? m.alu : m.steel, { parent: blade });
  mesh(cylZ(0.015, 0.006, 16), m.dark, { parent: blade });
  // upper guard: side plate + band
  const gy = y0 + R * 0.45;
  mesh(shapeGeo([...arc([0, 0], R + 0.01, -0.35, PI + 0.35, 20), ...arc([0, 0], R * 0.25, PI + 0.35, -0.35, 6)], 0.004, { bevel: 0.001 }), P.shell, { parent: g, at: [0.02, gy, bz + 0.012] });
  mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.026, 28, 1, true, -0.35 + PI / 2, -(PI + 0.7)).rotateX(PI / 2), P.shell, { parent: g, at: [0.02, gy, bz] }).rotation.z = 0;
  // motor (along -Z)
  mesh(lathe([[0, 0], [0.045, 0], [0.048, 0.02], [0.046, 0.08], [0.035, 0.1], [0, 0.102]], 24).rotateX(-PI / 2), P.shell, { parent: g, at: [0.02, gy, bz + 0.012] });
  mesh(lathe([[0, 0], [0.047, 0], [0.047, 0.025], [0, 0.025]], 24).rotateX(-PI / 2), P.shell2, { parent: g, at: [0.02, gy, bz - 0.06] });
  // top handle loop
  const hp = [[-0.13, 0.02], [0.03, 0.06], [0.03, 0.09], [-0.03, 0.135], [-0.12, 0.125], [-0.16, 0.06]];
  mesh(shapeGeo(hp, 0.034, { bevel: 0.008, holes: [[[-0.115, 0.05], [0.0, 0.075], [-0.04, 0.105], [-0.11, 0.1]]] }), P.shell, { parent: g, at: [0.0, gy - 0.01, -0.025] });
  mesh(shapeGeo([[-0.12, 0.1], [-0.04, 0.108], [-0.03, 0.128], [-0.12, 0.12]], 0.038, { bevel: 0.006 }), P.grip, { parent: g, at: [0.0, gy - 0.01, -0.025] });
  mesh(sphere(0.022, 14, 10), P.shell2, { parent: g, at: [0.13, y0 + 0.03, -0.03], scale: [1, 1.3, 1] });
  mesh(roundedBox(0.03, 0.06, 0.05, 0.01), P.shell, { parent: g, at: [0.13, y0 + 0.03, -0.03] });
  mesh(roundedBox(0.2, 0.05, 0.05, 0.012), P.shell, { parent: g, at: [-0.03, y0 + 0.03, -0.025] });
  if (T.cordless || T.pro) battery(g, T, m, P, { at: [-0.15, gy + 0.04, -0.025] }).rotation.z = PI / 2 + 0.3;
  else cord(g, P, [-0.16, gy + 0.05, -0.025], -1, 0.3);
  if (T.pro) hazard(g, 0.1, 0.02, { at: [0.02, gy + 0.03, bz + 0.0145] });
  return [clip('spin', 0.3, [spinTrack(blade, 'z', 0.3, -1)])];
}

export const createPowerSaw = makeTool('shop-saw', POWER_SAW_VARIANTS, BASE, (g, { T, m, variant }) => {
  const P = pmats(T, m);
  if (variant === 'circular') return circularSaw(g, T, m, P);
  if (variant === 'track-saw') {
    mesh(shapeGeo([[-0.09, 0], [0.09, 0], [0.09, 0.006], [0.03, 0.008], [0.03, 0.014], [0.02, 0.014], [0.02, 0.008], [-0.09, 0.006]], 1.4, { bevel: 0.0008 }).rotateY(PI / 2), m.alu, { parent: g, name: 'rail' });
    const saw = group('saw', { parent: g, at: [0, 0.002, -0.0] });
    return circularSaw(saw, T, m, P, { R: 0.08, rail: true });
  }
  if (variant === 'jigsaw') {
    mesh(roundedBox(0.2, 0.008, 0.08, 0.003), P.metal, { parent: g, at: [0, 0.004, 0] });
    const prof = [[-0.1, 0.02], [0.08, 0.02], [0.095, 0.06], [0.085, 0.14], [0.06, 0.18], [-0.08, 0.18], [-0.11, 0.16], [-0.115, 0.06]];
    mesh(shapeGeo(prof, 0.06, { bevel: 0.012, seg: 3, holes: [[[-0.07, 0.12], [0.04, 0.12], [0.03, 0.155], [-0.07, 0.155]]] }), P.shell, { parent: g });
    mesh(shapeGeo([[-0.08, 0.152], [0.04, 0.152], [0.03, 0.172], [-0.08, 0.172]], 0.066, { bevel: 0.006 }), P.grip, { parent: g });
    mesh(roundedBox(0.04, 0.03, 0.05, 0.006), P.shell2, { parent: g, at: [0.07, 0.035, 0] });
    const bl = group('jigblade', { parent: g, at: [0.075, 0.03, 0] });
    mesh(shapeGeo([[0, 0.0], [0.008, 0], [0.008, -0.07], [0.002, -0.06], [0, 0.0]], 0.0012, { bevel: 0 }), m.steel, { parent: bl, at: [-0.004, 0.015, 0] });
    if (T.cordless || T.pro) battery(g, T, m, P, { at: [-0.135, 0.07, 0], w: 0.07, d: 0.07, h: 0.05 }).rotation.z = PI / 2;
    else cord(g, P, [-0.11, 0.11, 0], -1, 0.3);
    return [clip('cut', 0.3, [moveTrack(bl, 0.3, (u) => [0, 0.012 * wave(u), 0])])];
  }
  if (variant === 'miter-saw') {
    const body = T.trim ? P.shell : m.paint('#b8bcc0');
    mesh(roundedBox(0.5, 0.05, 0.42, 0.015), P.shell2, { parent: g, at: [0, 0.025, 0] });
    mesh(cyl(0.16, 0.16, 0.025, 40), body, { parent: g, at: [0, 0.062, 0.02] });
    mesh(roundedBox(0.48, 0.07, 0.025, 0.006), P.metal, { parent: g, at: [0, 0.11, -0.07] });
    mesh(roundedBox(0.06, 0.1, 0.07, 0.012), body, { parent: g, at: [0, 0.12, -0.15] });
    const arm = group('arm', { parent: g, at: [0, 0.17, -0.15] });
    mesh(roundedBox(0.05, 0.05, 0.22, 0.015), body, { parent: arm, at: [0, 0.04, 0.09] });
    const R = 0.125;
    const blade = group('blade', { parent: arm, at: [0, 0.03, 0.17] });
    mesh(bladeGeo(R, 40).rotateY(PI / 2), m.steel, { parent: blade });
    mesh(cylX(0.02, 0.008, 16), m.dark, { parent: blade });
    mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.04, 32, 1, true, PI * 0.95, PI * 1.05).rotateZ(PI / 2), body, { parent: arm, at: [0, 0.03, 0.17] });
    mesh(lathe([[0, 0], [0.05, 0], [0.052, 0.09], [0.04, 0.11], [0, 0.112]], 24).rotateZ(-PI / 2), P.shell, { parent: arm, at: [0.02, 0.03, 0.17] });
    const hp = [[0, 0], [0.04, 0], [0.12, 0.08], [0.1, 0.12], [0.0, 0.05]];
    mesh(shapeGeo(hp, 0.035, { bevel: 0.008 }).rotateY(-PI / 2), P.grip, { parent: arm, at: [0, 0.07, 0.16] });
    if (T.cordless || T.pro) battery(arm, T, m, P, { at: [0.0, 0.065, 0.02] });
    else cord(g, P, [0, 0.05, -0.21], -1, 0.25);
    return [clip('spin', 0.3, [spinTrack(blade, 'x', 0.3)]), clip('chop', 3, [rotateTrack(arm, 'x', 3, (u) => 0.45 * pingPong(u))])];
  }
  // table saw on a folding stand
  const body = T.trim ? P.shell : m.paint('#b8bcc0');
  const H = 0.62;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) curveTube([[sx * 0.22, H - 0.22, sz * 0.18], [sx * 0.3, 0.012, sz * 0.26]], 0.012, m.dark, { parent: g, radialSegments: 8, segments: 3 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(sphere(0.016, 10, 8), m.rubber, { parent: g, at: [sx * 0.3, 0.012, sz * 0.26] });
  mesh(roundedBox(0.5, 0.22, 0.42, 0.02), P.shell, { parent: g, at: [0, H - 0.13, 0] });
  mesh(roundedBox(0.64, 0.025, 0.56, 0.006), T.kids ? m.alu : body, { parent: g, at: [0, H, 0] });
  mesh(roundedBox(0.1, 0.004, 0.36, 0.002), P.shell2, { parent: g, at: [0, H + 0.0125, 0] });
  const blade = group('blade', { parent: g, at: [0, H - 0.03, 0] });
  mesh(bladeGeo(0.105, 36).rotateY(PI / 2), m.steel, { parent: blade });
  mesh(roundedBox(0.03, 0.05, 0.53, 0.008), m.alu, { parent: g, at: [0.16, H + 0.037, 0], name: 'fence' });
  mesh(roundedBox(0.012, 0.11, 0.17, 0.006), M.glass({ tint: '#d0dce6', opacity: 0.5 }), { parent: g, at: [0, H + 0.075, 0.03] });
  mesh(roundedBox(0.008, 0.06, 0.06, 0.003), m.alu, { parent: g, at: [0, H + 0.02, -0.07] });
  mesh(roundedBox(0.08, 0.06, 0.03, 0.008), M.plastic('#d0302a', 0.4), { parent: g, at: [-0.14, H - 0.08, 0.215] });
  mesh(cylZ(0.035, 0.03, 20), P.shell2, { parent: g, at: [0.1, H - 0.1, 0.22] });
  if (T.cordless || T.pro) battery(g, T, m, P, { at: [-0.22, H - 0.2, 0.18] });
  else cord(g, P, [-0.25, H - 0.15, -0.21], -1, 0.6);
  if (T.pro) hazard(g, 0.4, 0.03, { at: [0, H - 0.04, 0.2105] });
  return [clip('spin', 0.3, [spinTrack(blade, 'x', 0.3)])];
}, { set: setCase, lay: false });

/* ================================ sander ================================ */

export const SANDER_VARIANTS = { 'random-orbit': {}, sheet: {}, belt: {}, detail: {}, planer: {} };

export const createSander = makeTool('shop-sander', SANDER_VARIANTS, { ...BASE, p: '#2aa16b' }, (g, { T, m, variant }) => {
  const P = pmats(T, m);
  const paper = M.matte(T.kids ? '#ffd02f' : '#c9a46a', 0.95);
  const batt = T.cordless || T.pro;
  if (variant === 'random-orbit') {
    const pad = group('pad', { parent: g });
    mesh(cyl(0.0625, 0.0625, 0.002, 36), paper, { parent: pad, at: [0, 0.001, 0] });
    mesh(cyl(0.0625, 0.06, 0.014, 36), m.black, { parent: pad, at: [0, 0.009, 0] });
    for (let k = 0; k < 8; k++) mesh(cyl(0.004, 0.004, 0.0022, 8), m.black, { parent: pad, at: [Math.cos(k * PI / 4) * 0.04, 0.0012, Math.sin(k * PI / 4) * 0.04] });
    mesh(lathe([[0, 0], [0.06, 0], [0.058, 0.04], [0.045, 0.075], [0.035, 0.11], [0.04, 0.13], [0.025, 0.145], [0, 0.148]], 32), P.shell, { parent: g, at: [0, 0.016, 0] });
    mesh(lathe([[0, 0.085], [0.04, 0.085], [0.045, 0.13], [0.027, 0.147], [0, 0.15]], 28), P.grip, { parent: g, at: [0, 0.016, 0] });
    mesh(cylX(0.016, 0.07, 16), P.shell2, { parent: g, at: [-0.07, 0.05, 0] });
    if (batt) battery(g, T, m, P, { at: [0, 0.055, 0.065], w: 0.07, h: 0.05 }).rotation.x = PI / 2;
    else {
      mesh(cushion(0.08, 0.06, 0.06), M.fabric('#3a3d42'), { parent: g, at: [-0.14, 0.045, 0] });
      cord(g, P, [0.04, 0.08, 0], 1, 0.25);
    }
    return [clip('sand', 0.3, [spinTrack(pad, 'y', 0.3)])];
  }
  if (variant === 'sheet' || variant === 'detail') {
    const pad = group('pad', { parent: g });
    const tri = variant === 'detail';
    const shape = tri ? [[-0.05, -0.05], [0.07, 0], [-0.05, 0.05]] : [[-0.057, -0.057], [0.057, -0.057], [0.057, 0.057], [-0.057, 0.057]];
    mesh(shapeGeo(shape, 0.015, { bevel: 0.004 }).rotateX(PI / 2), m.black, { parent: pad, at: [0, 0.01, 0] });
    mesh(shapeGeo(shape, 0.002, { bevel: 0 }).rotateX(PI / 2), paper, { parent: pad, at: [0, 0.001, 0] });
    mesh(cushion(tri ? 0.09 : 0.1, 0.07, tri ? 0.07 : 0.1), P.shell, { parent: g, at: [0, 0.05, 0] });
    mesh(cushion(tri ? 0.07 : 0.08, 0.035, tri ? 0.055 : 0.08), P.grip, { parent: g, at: [0, 0.09, 0] });
    mesh(roundedBox(0.012, 0.012, 0.03, 0.004), P.shell2, { parent: g, at: [0.04, 0.07, 0] });
    if (batt) battery(g, T, m, P, { at: [-0.06, 0.05, 0], w: 0.06, d: 0.06, h: 0.05 }).rotation.z = PI / 2;
    else cord(g, P, [-0.05, 0.06, 0], -1, 0.25);
    return [clip('sand', 0.2, [moveTrack(pad, 0.2, (u) => [0.002 * wave(u), 0, 0.002 * Math.cos(u * PI * 2)])])];
  }
  if (variant === 'belt') {
    const L = 0.26, rr = 0.03, w = 0.076;
    const rollers = [];
    for (const x of [-L / 2, L / 2]) { const r = group(x < 0 ? 'rollerB' : 'rollerF', { parent: g, at: [x, rr, 0] }); rollers.push(r); mesh(cylZ(rr - 0.002, w * 0.98, 20), P.metal, { parent: r }); }
    const stad = [...arc([L / 2, 0], rr, -PI / 2, PI / 2, 10), ...arc([-L / 2, 0], rr, PI / 2, PI * 1.5, 10)];
    const inner = stad.map(([x, y]) => [x * (1 - 0.003 / L), y * ((rr - 0.002) / rr)]);
    mesh(shapeGeo(stad, w, { bevel: 0, holes: [inner] }), paper, { parent: g, at: [0, rr, 0], name: 'belt' });
    mesh(roundedBox(L * 0.9, 0.05, w * 0.5, 0.012), P.shell, { parent: g, at: [0, rr + 0.03, -w * 0.5] });
    mesh(roundedBox(L * 0.6, 0.06, 0.06, 0.02), P.shell, { parent: g, at: [-0.02, rr * 2 + 0.03, 0] });
    const hp = [[-0.14, 0], [-0.06, 0], [-0.07, 0.08], [-0.16, 0.085], [-0.18, 0.04]];
    mesh(shapeGeo(hp, 0.035, { bevel: 0.008, holes: [[[-0.14, 0.02], [-0.085, 0.02], [-0.09, 0.06], [-0.15, 0.06]]] }), P.shell, { parent: g, at: [0.02, rr * 2 + 0.03, 0] });
    mesh(sphere(0.028, 16, 12), P.grip, { parent: g, at: [0.1, rr * 2 + 0.05, 0] });
    mesh(cushion(0.1, 0.06, 0.06), M.fabric('#3a3d42'), { parent: g, at: [0, rr + 0.03, w * 0.75] });
    if (batt) battery(g, T, m, P, { at: [-0.18, rr * 2 + 0.03, 0], w: 0.07, h: 0.05 }).rotation.z = PI / 2;
    else cord(g, P, [-0.17, rr * 2 + 0.06, 0], -1, 0.25);
    return [clip('sand', 0.5, rollers.map((r) => spinTrack(r, 'z', 0.5, -1)))];
  }
  // electric hand planer
  mesh(roundedBox(0.28, 0.012, 0.085, 0.003), P.metal, { parent: g, at: [0, 0.006, 0] });
  mesh(roundedBox(0.24, 0.06, 0.08, 0.015), P.shell, { parent: g, at: [0, 0.042, 0] });
  const hp = [[-0.13, 0.0], [0.0, 0.0], [-0.02, 0.09], [-0.12, 0.1], [-0.15, 0.05]];
  mesh(shapeGeo(hp, 0.04, { bevel: 0.008, holes: [[[-0.11, 0.02], [-0.03, 0.02], [-0.04, 0.07], [-0.11, 0.075]]] }), P.shell, { parent: g, at: [0, 0.07, 0] });
  mesh(lathe([[0, 0], [0.025, 0], [0.028, 0.03], [0.02, 0.05], [0, 0.052]], 20), P.shell2, { parent: g, at: [0.09, 0.07, 0] });
  mesh(cylZ(0.022, 0.03, 16), P.shell2, { parent: g, at: [0.0, 0.05, 0.05] });
  if (batt) battery(g, T, m, P, { at: [-0.15, 0.12, 0], w: 0.07, h: 0.05 }).rotation.z = PI / 2;
  else cord(g, P, [-0.15, 0.1, 0], -1, 0.25);
  return [];
}, { set: setCase, lay: false });

/* ============================== angle grinder ============================== */

export const GRINDER_VARIANTS = { 'grinder-115': {}, 'grinder-230': {}, 'die-grinder': {}, 'bench-grinder': {}, polisher: {} };

export const createAngleGrinder = makeTool('shop-grinder', GRINDER_VARIANTS, { ...BASE, p: '#e2471b' }, (g, { T, m, variant }) => {
  const P = pmats(T, m);
  const batt = T.cordless || T.pro;
  if (variant === 'bench-grinder') {
    const body = T.trim ? P.shell : m.paint('#3b5f8a');
    mesh(roundedBox(0.2, 0.03, 0.16, 0.01), body, { parent: g, at: [0, 0.015, 0] });
    mesh(lathe([[0, 0], [0.06, 0], [0.04, 0.08], [0, 0.08]], 24), body, { parent: g, at: [0, 0.03, 0] });
    mesh(cylX(0.065, 0.16, 28), body, { parent: g, at: [0, 0.14, 0] });
    const wheels = [];
    for (const sx of [-1, 1]) {
      const w = group(sx < 0 ? 'wheelL' : 'wheelR', { parent: g, at: [sx * 0.13, 0.14, 0] });
      wheels.push(w);
      mesh(cylX(0.075, 0.025, 32), M.matte(sx < 0 ? '#8a8d90' : '#c9b48a', 0.95), { parent: w });
      mesh(cylX(0.012, 0.06, 12), m.steel, { parent: g, at: [sx * 0.11, 0.14, 0] });
      mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.04, 28, 1, true, 0, PI * 1.25).rotateZ(PI / 2), body, { parent: g, at: [sx * 0.13, 0.14, 0], rot: [-0.4, 0, 0] });
      mesh(cylX(0.085, 0.004, 28), body, { parent: g, at: [sx * 0.152, 0.14, 0] });
      mesh(roundedBox(0.04, 0.006, 0.04, 0.002), m.steel, { parent: g, at: [sx * 0.13, 0.09, 0.085] });
      mesh(roundedBox(0.008, 0.06, 0.008, 0.002), m.steel, { parent: g, at: [sx * 0.13, 0.06, 0.09] });
      mesh(roundedBox(0.06, 0.04, 0.003, 0.002), M.glass({ tint: '#d0dce6', opacity: 0.45 }), { parent: g, at: [sx * 0.13, 0.24, 0.05], rot: [0.5, 0, 0] });
    }
    mesh(roundedBox(0.03, 0.02, 0.02, 0.004), M.plastic('#e8c21a', 0.4), { parent: g, at: [0, 0.05, 0.065] });
    cord(g, P, [0, 0.02, -0.08], -1, 0.2);
    if (T.pro) hazard(g, 0.12, 0.02, { at: [0, 0.14, 0.0655] });
    return [clip('spin', 0.25, wheels.map((w) => spinTrack(w, 'x', 0.25)))];
  }
  if (variant === 'die-grinder') {
    // lies on the ground, long axis along X
    mesh(latheX([[0, 0], [0.022, 0], [0.026, 0.02], [0.026, 0.15], [0.02, 0.18], [0, 0.18]], 24), P.shell, { parent: g, at: [-0.1, 0.026, 0] });
    mesh(latheX([[0, 0.03], [0.0275, 0.03], [0.0275, 0.12], [0, 0.12]], 24), P.grip, { parent: g, at: [-0.1, 0.026, 0] });
    mesh(latheX([[0, 0], [0.016, 0], [0.01, 0.04], [0, 0.04]], 20), P.metal, { parent: g, at: [0.078, 0.026, 0] });
    const ch = group('chuck', { parent: g, at: [0.115, 0.026, 0] });
    mesh(cylX(0.003, 0.04, 8), m.steel, { parent: ch, at: [0.02, 0, 0] });
    mesh(sphere(0.008, 12, 10), m.dark, { parent: ch, at: [0.042, 0, 0], scale: [1.4, 1, 1] });
    if (batt) battery(g, T, m, P, { at: [-0.13, 0, 0], w: 0.07, d: 0.07, h: 0.05 });
    else cord(g, P, [-0.1, 0.02, 0], -1, 0.25);
    return [clip('spin', 0.2, [spinTrack(ch, 'x', 0.2)])];
  }
  const big = variant === 'grinder-230' ? 1.5 : 1;
  const pol = variant === 'polisher';
  const L = 0.24 * big, R = 0.031 * big;
  const yC = 0.06 * big + (pol ? 0.03 : 0);
  mesh(latheX([[0, 0], [R * 0.7, 0], [R, R * 0.6], [R, L * 0.8], [R * 0.92, L], [0, L]], 28), P.shell, { parent: g, at: [-L * 0.85, yC, 0] });
  mesh(latheX([[0, L * 0.1], [R * 1.04, L * 0.1], [R * 1.04, L * 0.55], [0, L * 0.55]], 28), P.grip, { parent: g, at: [-L * 0.85, yC, 0] });
  vents(g, m, [-L * 0.25, yC, R * 0.95], 4, 0.003, R * 0.6, 0.007);
  mesh(roundedBox(0.07 * big, 0.05 * big, 0.06 * big, 0.015), P.metal, { parent: g, at: [L * 0.17, yC, 0] });
  const head = group('disc', { parent: g, at: [L * 0.2, yC - 0.035 * big, 0] });
  if (pol) {
    mesh(cyl(0.09, 0.09, 0.04, 36), M.matte(T.kids ? '#ffd02f' : '#f2f2f2', 0.98), { parent: head, at: [0, -0.02, 0] });
    mesh(cyl(0.085, 0.085, 0.01, 36), m.black, { parent: head, at: [0, 0.004, 0] });
    mesh(torus(0.11, 0.012, 32, 10), P.grip, { parent: g, at: [L * 0.2, yC + 0.03, 0], rot: [PI / 2, 0, 0], scale: [0.7, 1, 1] });
  } else {
    const dr = 0.0575 * big;
    mesh(cyl(dr, dr, 0.004, 40), M.matte('#3d3f42', 0.8), { parent: head });
    mesh(cyl(0.012, 0.012, 0.008, 12), m.steel, { parent: head, at: [0, -0.003, 0] });
    mesh(new THREE.CylinderGeometry(dr + 0.006, dr + 0.006, 0.02, 32, 1, true, PI * 0.5, PI), m.steel, { parent: g, at: [L * 0.2, yC - 0.027 * big, 0] });
    mesh(new THREE.RingGeometry(0.012, dr + 0.006, 32, 1, PI * 0.5, PI).rotateX(-PI / 2), m.steel, { parent: g, at: [L * 0.2, yC - 0.017 * big, 0] }).material.side = THREE.DoubleSide;
  }
  if (big > 1 || T.heavy) {
    const hp = [[0, 0], [0.04, 0], [0.04, 0.09], [-0.06, 0.09], [-0.06, 0.06], [0.0, 0.06]];
    mesh(shapeGeo(hp, 0.03, { bevel: 0.007 }), P.grip, { parent: g, at: [-L * 0.92, yC - 0.02, 0], rot: [0, 0, PI * 0.0] });
  }
  if (!pol) mesh(cyl(0.012, 0.01, 0.09, 14), P.shell2, { parent: g, at: [L * 0.15, yC, 0.08], rot: [PI / 2, 0, 0] });
  if (batt) battery(g, T, m, P, { at: [-L * 0.85 - 0.03, yC - 0.03, 0], w: 0.07, h: 0.05 }).rotation.z = PI / 2;
  else cord(g, P, [-L * 0.86, yC, 0], -1, 0.3);
  if (T.pro) hazard(g, L * 0.3, 0.012, { at: [-L * 0.35, yC + R * 0.2, R * 1.04 + 0.0004] });
  return [clip('spin', 0.2, [spinTrack(head, 'y', 0.2)])];
}, { set: setCase, lay: false });

/* ======================= routers & multitools ======================= */

export const POWER_TOOL_VARIANTS = { router: {}, 'trim-router': {}, multitool: {}, 'rotary-tool': {} };

export const createPowerTool = makeTool('shop-router', POWER_TOOL_VARIANTS, { ...BASE, p: '#7b3fbf' }, (g, { T, m, variant }) => {
  const P = pmats(T, m);
  const batt = T.cordless || T.pro;
  if (variant === 'router' || variant === 'trim-router') {
    const big = variant === 'router';
    const R = big ? 0.075 : 0.045;
    mesh(cyl(R, R, 0.006, 36), M.glass({ tint: '#d6e1ea', opacity: 0.55 }), { parent: g, at: [0, 0.003, 0] });
    mesh(lathe([[R * 0.55, 0], [R, 0], [R * 0.98, 0.02], [R * 0.8, 0.03], [R * 0.55, 0.03]], 32), P.metal, { parent: g, at: [0, 0.006, 0] });
    const bit = group('bit', { parent: g, at: [0, 0.02, 0] });
    mesh(cyl(0.006, 0.004, 0.025, 10), m.dark, { parent: bit });
    const top = big ? 0.24 : 0.17;
    if (big) {
      for (const sx of [-1, 1]) {
        mesh(cyl(0.008, 0.008, 0.1, 12), m.chrome, { parent: g, at: [sx * 0.055, 0.08, 0] });
        mesh(lathe([[0, 0], [0.02, 0], [0.026, 0.03], [0.022, 0.06], [0, 0.065]], 20).rotateZ(-sx * PI / 2), P.grip, { parent: g, at: [sx * 0.065, 0.06, 0] });
      }
    }
    mesh(lathe([[0, 0], [R * 0.6, 0], [R * 0.62, top * 0.6], [R * 0.55, top * 0.9], [R * 0.3, top], [0, top]], 28), P.shell, { parent: g, at: [0, 0.03, 0] });
    mesh(lathe([[0, top * 0.4], [R * 0.64, top * 0.4], [R * 0.64, top * 0.65], [0, top * 0.65]], 28), P.shell2, { parent: g, at: [0, 0.03, 0] });
    if (batt) battery(g, T, m, P, { at: [0, top + 0.028, 0], w: 0.07, h: 0.05 });
    else cord(g, P, [-R * 0.55, top * 0.9, 0], -1, 0.3);
    return [clip('spin', 0.2, [spinTrack(bit, 'y', 0.2)])];
  }
  // multitool / rotary tool lie on their side (long axis along X)
  const rot = variant === 'rotary-tool';
  const L = rot ? 0.2 : 0.26, R = rot ? 0.02 : 0.03;
  mesh(latheX([[0, 0], [R * 0.85, 0], [R, R * 0.6], [R, L * 0.75], [R * 0.7, L], [0, L]], 24), P.shell, { parent: g, at: [-L * 0.6, R, 0] });
  mesh(latheX([[0, L * 0.25], [R * 1.05, L * 0.25], [R * 1.05, L * 0.6], [0, L * 0.6]], 24), P.grip, { parent: g, at: [-L * 0.6, R, 0] });
  mesh(roundedBox(0.012, 0.006, 0.02, 0.002), P.shell2, { parent: g, at: [-L * 0.05, R * 2, 0] });
  const tip = group('tip', { parent: g, at: [L * 0.42, R, 0] });
  if (rot) {
    mesh(latheX([[0, 0], [0.008, 0], [0.005, 0.02], [0, 0.02]], 12), P.metal, { parent: tip });
    mesh(cylX(0.0016, 0.03, 8), m.steel, { parent: tip, at: [0.03, 0, 0] });
    mesh(cylX(0.012, 0.0012, 20), M.matte('#b04a2a', 0.8), { parent: tip, at: [0.045, 0, 0] });
  } else {
    mesh(roundedBox(0.03, 0.035, 0.035, 0.008), P.metal, { parent: tip, at: [0.01, 0, 0] });
    mesh(shapeGeo([[0, -0.016], [0.06, -0.018], [0.06, 0.018], [0, 0.016]], 0.0012, { bevel: 0 }).rotateX(PI / 2), m.steel, { parent: tip, at: [0.02, -0.0185, 0] });
  }
  if (batt) battery(g, T, m, P, { at: [-L * 0.6 - 0.03, 0, 0], w: 0.06, d: 0.06, h: 0.045 });
  else cord(g, P, [-L * 0.6, R, 0], -1, 0.25);
  return rot ? [clip('spin', 0.15, [spinTrack(tip, 'x', 0.15)])] : [clip('oscillate', 0.12, [rotateTrack(tip, 'y', 0.12, (u) => 0.05 * wave(u))])];
}, { set: setCase, lay: false });

