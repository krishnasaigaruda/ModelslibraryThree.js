// Garden tools: long-handled tools, hand tools, wheelbarrows & carts, watering cans, shears, lawn mowers.
import {
  THREE, M, mesh, group, roundedBox, curveTube, lathe, cushion, makeTool, handle, shapeGeo, taperZ, arc, tub,
  cyl, cylX, cylZ, sphere, torus, hazard, lampGroup, lampTracks, spinTrack, rotateTrack, moveTrack, clip, pingPong, wave,
} from './common.js';

const PI = Math.PI;
const GBASE = { p: '#2f8a3a', s: '#1d1e21', a: '#e8b20f', wood: '#c49a62' };

/** Bends a flat (XY, thin in Z) blade into a dish: z += k * x². */
function dish(geo, k) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + k * p.getX(i) ** 2);
  geo.computeVertexNormals();
  return geo;
}

/** Long shaft from y0 to y1 with a trim-dependent material and end grip. */
function shaft(g, T, m, y0, y1, r, { dgrip = false } = {}) {
  const mat = T.heavy ? m.dark : T.pro ? m.body : T.kids ? m.accent : m.wood;
  mesh(cyl(r * 0.95, r, y1 - y0, 16), mat, { parent: g, at: [0, (y0 + y1) / 2, 0] });
  if (dgrip) {
    const gm = T.kids ? m.body : T.pro || T.heavy ? m.grip : T.vintage ? m.wood : m.plastic(T.trim ? T.s : '#1d1e21', 0.5);
    curveTube([[0, y1 - 0.01, 0], [-0.06, y1 + 0.06, 0], [-0.055, y1 + 0.13, 0], [0.055, y1 + 0.13, 0], [0.06, y1 + 0.06, 0], [0, y1 - 0.01, 0]], r * 0.75, gm, { parent: g, radialSegments: 10, segments: 30 });
    mesh(cylX(r * 1.05, 0.11, 14), gm, { parent: g, at: [0, y1 + 0.13, 0] });
  } else {
    mesh(sphere(r * 1.15, 14, 10), T.pro || T.heavy ? m.grip : T.kids ? m.body : m.dark, { parent: g, at: [0, y1, 0] });
    if (T.heavy || T.pro) mesh(cyl(r * 1.15, r * 1.15, 0.2, 16), m.grip, { parent: g, at: [0, y1 - 0.12, 0] });
  }
  if (T.rust) for (const f of [0.3, 0.7]) mesh(cyl(r * 1.08, r * 1.08, 0.04, 14), m.tape, { parent: g, at: [0, y0 + (y1 - y0) * f, 0] });
}

function socket(g, m, y, r, len = 0.12) { mesh(cyl(r, r * 1.5, len, 14), m.steel, { parent: g, at: [0, y + len / 2, 0] }); }

/* ============================ long garden tools ============================ */

export const GARDEN_TOOL_VARIANTS = { spade: {}, shovel: {}, fork: {}, rake: {}, 'leaf-rake': {}, hoe: {}, broom: {} };

export const createGardenTool = makeTool('garden-tool', GARDEN_TOOL_VARIANTS, GBASE, (g, { T, m, variant }) => {
  const blade = T.kids ? m.body : T.trim === 'stainless' ? M.chrome() : T.vintage ? m.dark : m.steel;
  const r = 0.017;
  const L = variant === 'spade' || variant === 'fork' ? 0.75 : 1.25;
  const dgrip = variant === 'spade' || variant === 'fork';
  if (variant === 'spade' || variant === 'shovel') {
    const w = variant === 'spade' ? 0.19 : 0.24, h = variant === 'spade' ? 0.28 : 0.3;
    const pts = variant === 'spade'
      ? [[-w / 2, -h], [w / 2, -h], [w / 2, -0.02], [0.03, 0], [-0.03, 0], [-w / 2, -0.02]]
      : [...arc([0, -h + w / 2], w / 2, PI, PI * 2, 14).map(([x, y]) => [x, y - (x === 0 ? 0.05 : 0)]), [w / 2, -0.03], [0.03, 0], [-0.03, 0], [-w / 2, -0.03]];
    if (variant === 'shovel') pts.splice(7, 0, [0, -h - 0.04]);
    mesh(dish(shapeGeo(pts, 0.003, { bevel: 0.001 }), variant === 'spade' ? 0.6 : 1.6), blade, { parent: g });
    mesh(roundedBox(w, 0.012, 0.025, 0.004), blade, { parent: g, at: [0, -0.02, variant === 'spade' ? 0.009 : 0.022] });
    socket(g, m, -0.04, r);
    shaft(g, T, m, 0.06, L, r, { dgrip });
  } else if (variant === 'fork') {
    mesh(roundedBox(0.19, 0.03, 0.014, 0.004), blade, { parent: g, at: [0, -0.03, 0] });
    for (let k = 0; k < 4; k++) {
      const x = -0.075 + k * 0.05;
      mesh(cyl(0.006, 0.003, 0.27, 4), blade, { parent: g, at: [x, -0.18, 0.003], rot: [0.03, PI / 4, 0] });
    }
    socket(g, m, -0.02, r);
    shaft(g, T, m, 0.08, L, r, { dgrip });
  } else if (variant === 'rake') {
    mesh(roundedBox(0.4, 0.016, 0.02, 0.004), blade, { parent: g, at: [0, 0, 0] });
    for (let k = 0; k < 14; k++) mesh(cyl(0.004, 0.0025, 0.075, 6), blade, { parent: g, at: [-0.19 + k * (0.38 / 13), 0, 0.045], rot: [PI / 2, 0, 0] });
    for (const sx of [-1, 1]) curveTube([[sx * 0.15, 0.004, 0], [sx * 0.08, 0.08, 0], [0, 0.13, 0]], 0.005, blade, { parent: g, radialSegments: 6, segments: 10 });
    socket(g, m, 0.1, r);
    shaft(g, T, m, 0.2, L + 0.2, r);
  } else if (variant === 'leaf-rake') {
    const tm = T.kids ? m.accent : T.trim ? m.plastic(T.p, 0.45) : m.steel;
    for (let k = 0; k < 15; k++) {
      const a = -0.75 + (k / 14) * 1.5;
      const ex = Math.sin(a) * 0.45, ey = -Math.cos(a) * 0.45 + 0.05;
      curveTube([[0, 0.05, 0], [ex * 0.6, ey * 0.6 + 0.02, 0], [ex, ey, 0], [ex * 1.02, ey - 0.02, 0.04]], 0.003, tm, { parent: g, radialSegments: 5, segments: 10 });
    }
    curveTube(Array.from({ length: 9 }, (_, i) => { const a = -0.7 + (i / 8) * 1.4; return [Math.sin(a) * 0.25, -Math.cos(a) * 0.25 + 0.05, 0]; }), 0.004, tm, { parent: g, radialSegments: 6, segments: 30 });
    socket(g, m, 0.03, r, 0.1);
    shaft(g, T, m, 0.12, L + 0.1, r);
  } else if (variant === 'hoe') {
    mesh(taperZ(shapeGeo([[-0.08, 0], [0.08, 0], [0.075, 0.1], [-0.075, 0.1]], 0.003, { bevel: 0.001 }), () => 1).rotateX(PI / 2), blade, { parent: g, at: [0, 0, 0.0] });
    curveTube([[0, 0.003, -0.01], [0, 0.04, -0.03], [0, 0.1, -0.02], [0, 0.14, 0]], 0.006, blade, { parent: g, radialSegments: 8, segments: 12 });
    socket(g, m, 0.13, r, 0.08);
    shaft(g, T, m, 0.2, L + 0.2, r);
  } else {
    const bm = T.kids ? m.accent : T.vintage ? M.wood('#8a6b4a') : m.plastic(T.trim ? T.p : '#c0392b', 0.45);
    mesh(roundedBox(0.45, 0.05, 0.06, 0.01), bm, { parent: g, at: [0, 0, 0] });
    mesh(roundedBox(0.44, 0.09, 0.05, 0.006), M.matte(T.vintage ? '#b8995a' : T.rust ? '#5a5248' : '#2b2b2b', 0.95), { parent: g, at: [0, -0.07, 0] });
    for (const sx of [-1, 1]) curveTube([[sx * 0.12, 0.02, 0], [0, 0.13, 0]], 0.006, m.steel, { parent: g, radialSegments: 6, segments: 4 });
    socket(g, m, 0.02, r, 0.12);
    shaft(g, T, m, 0.12, L + 0.12, r);
  }
  return [];
}, { set: (g, { one, variant }) => {
  // the tool plus two companions lying side by side on the ground
  const anims = one(g, 0);
  const others = Object.keys(GARDEN_TOOL_VARIANTS).filter((v) => v !== variant).slice(0, 2);
  others.forEach((v, i) => { const o = createGardenTool({ variant: v }); o.position.z = 0.35 * (i + 1); o.traverse((c) => { if (c.name) c.name = `s${i}_${c.name}`; }); g.add(o); });
  return anims;
} });

/* ============================ garden hand tools ============================ */

export const GARDEN_HAND_VARIANTS = { trowel: {}, 'hand-fork': {}, cultivator: {}, dibber: {}, weeder: {}, 'bulb-planter': {} };

export const createGardenHandTool = makeTool('garden-hand-tool', GARDEN_HAND_VARIANTS, GBASE, (g, { T, m, variant }) => {
  const blade = T.kids ? m.body : T.trim === 'stainless' ? M.chrome() : T.vintage ? m.dark : m.steel;
  const hl = 0.12, r = 0.015;
  handle(g, T, m, hl, r);
  mesh(cyl(r * 0.85, r * 0.6, 0.02, 14), T.vintage ? m.brass : blade, { parent: g, at: [0, hl + 0.008, 0] });
  const y = hl + 0.015;
  if (variant === 'trowel') {
    curveTube([[0, y, 0], [0, y + 0.03, 0.015], [0, y + 0.05, 0.02]], 0.005, blade, { parent: g, radialSegments: 8 });
    const pts = [...arc([0, 0.07], 0.042, 0, PI, 12).map(([x, yy]) => [x, yy]), [-0.042, 0.03], [0, 0.0], [0.042, 0.03]];
    const pts2 = [[0, 0.16], [-0.04, 0.09], [-0.035, 0.02], [-0.012, 0.0], [0.012, 0.0], [0.035, 0.02], [0.04, 0.09]];
    void pts;
    mesh(dish(shapeGeo(pts2, 0.002, { bevel: 0.0006 }), 7), blade, { parent: g, at: [0, y + 0.045, 0.012] });
  } else if (variant === 'hand-fork' || variant === 'cultivator') {
    curveTube([[0, y, 0], [0, y + 0.03, 0]], 0.006, blade, { parent: g, radialSegments: 8 });
    mesh(roundedBox(0.07, 0.012, 0.01, 0.003), blade, { parent: g, at: [0, y + 0.032, 0] });
    for (const sx of [-1, 0, 1]) {
      const x = sx * 0.028;
      if (variant === 'hand-fork') curveTube([[x, y + 0.03, 0], [x, y + 0.1, 0.008], [x * 1.05, y + 0.14, 0.004]], 0.004, blade, { parent: g, radialSegments: 6, segments: 10 });
      else curveTube([[x, y + 0.03, 0], [x * 1.2, y + 0.09, 0.01], [x * 1.3, y + 0.12, 0.04], [x * 1.3, y + 0.11, 0.07]], 0.004, blade, { parent: g, radialSegments: 6, segments: 12 });
    }
  } else if (variant === 'dibber') {
    mesh(lathe([[0.02, 0], [0.018, 0.08], [0.006, 0.15], [0, 0.16]], 16), T.kids ? m.body : T.trim === 'stainless' ? blade : m.wood, { parent: g, at: [0, y - 0.005, 0] });
    for (let k = 1; k < 4; k++) mesh(torus(0.02 - k * 0.0035, 0.0012, 18, 4), m.dark, { parent: g, at: [0, y + k * 0.035, 0], rot: [PI / 2, 0, 0] });
  } else if (variant === 'weeder') {
    mesh(cyl(0.005, 0.005, 0.14, 8), blade, { parent: g, at: [0, y + 0.07, 0] });
    mesh(shapeGeo([[-0.006, 0], [0.006, 0], [0.008, 0.035], [0.002, 0.025], [0, 0.03], [-0.002, 0.025], [-0.008, 0.035]], 0.003, { bevel: 0.0008 }), blade, { parent: g, at: [0, y + 0.135, 0] });
  } else {
    mesh(cyl(0.006, 0.006, 0.05, 8), blade, { parent: g, at: [0, y + 0.025, 0] });
    const cup = group('cup', { parent: g, at: [0, y + 0.05, 0] });
    mesh(lathe([[0.03, 0], [0.034, 0], [0.028, 0.12], [0.025, 0.12], [0.031, 0.002], [0.0, 0.002], [0, 0]], 24).rotateX(0), blade, { parent: cup });
    mesh(cyl(0.032, 0.032, 0.004, 20), blade, { parent: cup, at: [0, 0.002, 0] });
  }
  if (T.pro) hazard(g, 0.02, 0.04, { at: [0, hl * 0.4, r * 1.13], bg: '#f5b301' });
  return [];
}, { setScales: [1, 1, 1] });

/* ================================ wheelbarrow ================================ */

export const WHEELBARROW_VARIANTS = { builder: {}, garden: {}, 'twin-wheel': {}, cart: {} };

function wheel(par, T, m, r, w, at, name) {
  const wg = group(name, { parent: par, at });
  mesh(torus(r - w * 0.45, w * 0.48, 28, 10), m.rubber, { parent: wg, rot: [0, PI / 2, 0], scale: [1, 1, 1] });
  mesh(cylX(r - w * 0.7, w * 0.8, 24), T.kids ? m.accent : m.body2, { parent: wg });
  mesh(cylX(0.02, w * 1.3, 12), m.steel, { parent: wg });
  return wg;
}

export const createWheelbarrow = makeTool('garden-wheelbarrow', WHEELBARROW_VARIANTS, { ...GBASE, p: '#2f8a3a' }, (g, { T, m, variant }) => {
  const anims = [];
  const frame = T.kids ? m.body2 : T.trim === 'stainless' ? M.chrome() : m.dark;
  const trayMat = variant === 'garden' ? m.plastic(T.trim ? T.p : '#2f8a3a', 0.45) : T.trim === 'stainless' ? M.chrome() : !T.trim || T.trim === 'set' ? (variant === 'builder' ? M.metal('#b9bfc4', 0.4) : m.paint('#e8650f')) : m.body;
  if (variant === 'cart') {
    const W = 0.6, L = 1.0, H = 0.32;
    const ws = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) ws.push(wheel(g, T, m, 0.13, 0.06, [sx * (W / 2 + 0.05), 0.13, sz * (L / 2 - 0.12)], `wheel${sx}${sz}`));
    for (const sz of [-1, 1]) mesh(cylX(0.012, W + 0.16, 10), frame, { parent: g, at: [0, 0.13, sz * (L / 2 - 0.12)] });
    mesh(roundedBox(W + 0.04, 0.03, L + 0.04, 0.008), frame, { parent: g, at: [0, 0.16, 0] });
    const tray = group('tray', { parent: g, at: [0, 0.175, 0] });
    mesh(tub(0.5, 0.56, H, 0.012, 4), trayMat, { parent: tray, scale: [W / 0.75, 1, L / 0.75] });
    curveTube([[0, 0.17, L / 2 + 0.01], [0, 0.25, L / 2 + 0.2], [0, 0.55, L / 2 + 0.45]], 0.014, frame, { parent: g, radialSegments: 10 });
    mesh(cylX(0.016, 0.24, 12), m.grip, { parent: g, at: [0, 0.55, L / 2 + 0.45] });
    anims.push(clip('roll', 1, ws.map((w) => spinTrack(w, 'x', 1))));
    return anims;
  }
  const twin = variant === 'twin-wheel';
  const R = variant === 'builder' ? 0.2 : 0.18;
  const ws = twin ? [wheel(g, T, m, R, 0.08, [-0.16, R, 0.55], 'wheelL'), wheel(g, T, m, R, 0.08, [0.16, R, 0.55], 'wheelR')] : [wheel(g, T, m, R, 0.09, [0, R, 0.55], 'wheel')];
  // frame: two rails from the axle back to the handles
  const hx = 0.28;
  for (const sx of [-1, 1]) {
    curveTube([[sx * (twin ? 0.11 : 0.05), R, 0.55], [sx * 0.18, R + 0.12, 0.3], [sx * 0.24, 0.42, -0.2], [sx * hx, 0.5, -0.75]], 0.016, frame, { parent: g, radialSegments: 10, segments: 24 });
    mesh(cyl(0.02, 0.02, 0.15, 12), T.kids ? m.accent : m.grip, { parent: g, at: [sx * hx, 0.5, -0.8], rot: [PI / 2 - 0.15, 0, 0] });
    // leg
    curveTube([[sx * 0.22, 0.4, -0.1], [sx * 0.24, 0.2, -0.22], [sx * 0.24, 0.015, -0.26]], 0.014, frame, { parent: g, radialSegments: 8, segments: 10 });
    mesh(roundedBox(0.05, 0.03, 0.08, 0.008), m.rubber, { parent: g, at: [sx * 0.24, 0.015, -0.26] });
  }
  mesh(cylX(0.016, twin ? 0.3 : 0.14, 12), frame, { parent: g, at: [0, R, 0.55] });
  // tray (rotated so the front is low and deep)
  const tray = group('tray', { parent: g, at: [0, 0.4, 0.05], rot: [-0.12, 0, 0] });
  const deep = variant === 'builder' ? 1 : 0.85;
  mesh(tub(0.36, 0.55, 0.3 * deep, 0.012, 4, { lip: 0.012 }), trayMat, { parent: tray, at: [0, -0.06, 0], scale: [0.85, 1, 1.25] });
  if (T.heavy) for (const sx of [-1, 1]) curveTube([[sx * 0.28, 0.22, 0.4], [sx * 0.24, 0.42, 0.1], [sx * 0.28, 0.42, -0.25]], 0.012, frame, { parent: g, radialSegments: 8 });
  if (T.pro) hazard(tray, 0.3, 0.05, { at: [0, 0.12 * deep, 0.53], rot: [-0.55, 0, 0] });
  anims.push(clip('roll', 1, ws.map((w) => spinTrack(w, 'x', 1))));
  return anims;
}, { lay: false, set: (g, { one }) => {
  const anims = one(g, 0);
  const sp = createGardenTool({ variant: 'spade' }); sp.position.set(0.55, 0, 0); sp.rotation.y = PI / 2; g.add(sp);
  for (let k = 0; k < 2; k++) mesh(cushion(0.4, 0.14, 0.6), M.fabric(k ? '#d8cfb8' : '#c9bd9c'), { parent: g, at: [-0.6, 0.07 + k * 0.13, 0.1], rot: [0, k * 0.3, 0] });
  return anims;
} });

/* ============================== watering can ============================== */

export const WATERING_CAN_VARIANTS = { classic: {}, plastic: {}, french: {}, indoor: {} };

export const createWateringCan = makeTool('garden-watering-can', WATERING_CAN_VARIANTS, { ...GBASE, p: '#2f8a3a' }, (g, { T, m, variant }) => {
  const metal = variant === 'classic' || variant === 'french';
  const mat = T.kids ? m.body : T.trim === 'stainless' ? M.chrome() : T.vintage ? m.brass : metal ? (T.trim ? m.body : M.metal('#b9bfc4', 0.45)) : m.plastic(T.trim ? T.p : '#2f8a3a', 0.4);
  const s = variant === 'indoor' ? 0.55 : 1;
  const R = 0.11 * s, H = (variant === 'french' ? 0.32 : 0.24) * s;
  const body = group('can', { parent: g, scale: variant === 'plastic' || variant === 'french' ? [1, 1, 0.7] : [1, 1, 1] });
  mesh(lathe([[0, 0], [R, 0], [R * 1.02, 0.01], [R, H * 0.9], [R * 0.8, H], [R * 0.4, H * 1.02], [R * 0.4 - 0.003, H * 1.02], [R * 0.78, H - 0.003], [R - 0.003, H * 0.9], [R - 0.003, 0.004], [0, 0.004]], 32), mat, { parent: body });
  mesh(torus(R * 0.4, 0.004, 24, 6), mat, { parent: body, at: [0, H * 1.02, 0], rot: [PI / 2, 0, 0] });
  if (metal) for (const f of [0.25, 0.6]) mesh(torus(R + 0.001, 0.0025, 32, 5), mat, { parent: body, at: [0, H * f, 0], rot: [PI / 2, 0, 0] });
  // spout
  const sx = R * 0.95;
  const end = variant === 'french' || variant === 'indoor' ? [R + 0.38 * s, H + 0.12 * s, 0] : [R + 0.26 * s, H + 0.08 * s, 0];
  curveTube([[sx - 0.01, 0.04 * s, 0], [sx + 0.05 * s, 0.1 * s, 0], [end[0] - 0.01, end[1] - 0.01, 0]], 0.012 * s, mat, { parent: g, radialSegments: 12, segments: 20 });
  if (variant !== 'indoor') {
    const rose = group('rose', { parent: g, at: end, rot: [0, 0, -PI / 2 + 0.9] });
    mesh(lathe([[0.01 * s, -0.01], [0.012 * s, 0], [0.035 * s, 0.04 * s], [0.036 * s, 0.045 * s], [0, 0.046 * s]], 24), T.vintage ? m.brass : metal ? mat : m.plastic(T.trim ? T.a : '#e8b20f', 0.4), { parent: rose });
  }
  // handles: top arch + back handle
  curveTube([[-R * 0.75, H * 0.97, 0], [-R * 0.4, H * 1.4, 0], [R * 0.3, H * 1.45, 0], [R * 0.75, H * 0.97, 0]], 0.009 * s, mat, { parent: g, radialSegments: 10, segments: 20 });
  if (variant !== 'indoor') curveTube([[-R * 0.98, H * 0.25, 0], [-R * 1.35, H * 0.5, 0], [-R * 1.3, H * 0.95, 0], [-R * 0.8, H * 1.05, 0]], 0.009 * s, mat, { parent: g, radialSegments: 10, segments: 20 });
  if (T.pro) hazard(g, 0.1 * s, 0.03 * s, { at: [0, H * 0.45, R + 0.001] });
  return [];
}, { lay: false, setScales: [1, 0.6] });

/* ================================== shears ================================== */

export const SHEARS_VARIANTS = { 'hedge-shears': { bl: 0.22, hl: 0.3 }, pruners: { bl: 0.06, hl: 0.14, curved: true }, loppers: { bl: 0.09, hl: 0.5, curved: true }, 'grass-shears': { bl: 0.14, hl: 0.12 } };

export const createShears = makeTool('garden-shears', SHEARS_VARIANTS, { ...GBASE, p: '#c0392b' }, (g, { T, m, V }) => {
  const blade = T.kids ? m.alu : T.trim === 'stainless' ? M.chrome() : T.vintage ? m.dark : m.steel;
  const t = 0.005 * T.chunky;
  const halves = [];
  for (const sd of [1, -1]) {
    const h = group(sd > 0 ? 'bladeL' : 'bladeR', { parent: g });
    halves.push(h);
    const z = sd * t * 0.55;
    const bw = V.curved ? 0.022 : 0.03;
    const pts = V.curved
      ? [[0, -0.01], [sd * bw, 0], [sd * bw * 0.9, V.bl * 0.6], [sd * bw * 0.2, V.bl], [sd * -0.004, V.bl * 0.9], [sd * -0.002, 0.01]]
      : [[sd * -0.004, -0.01], [sd * bw * 0.6, -0.005], [sd * bw * 0.3, V.bl], [sd * -0.003, V.bl * 0.98]];
    mesh(shapeGeo(sd > 0 ? pts : pts.slice().reverse(), t, { bevel: 0.0008 }), blade, { parent: h, at: [0, 0, z], rot: [0, 0, sd * -0.08] });
    mesh(cylZ(0.012, t, 18), blade, { parent: h, at: [0, 0, z] });
    const hx = sd * (V.hl > 0.3 ? 0.06 : 0.035);
    curveTube([[0, 0, z], [hx * 0.6, -V.hl * 0.2, z], [hx, -V.hl * 0.55, z]], 0.006, blade, { parent: h, radialSegments: 8, segments: 10 });
    const gm = T.vintage || (!T.trim && V.hl > 0.25) ? m.wood : T.pro ? (sd > 0 ? m.body : m.grip) : T.kids ? m.accent : m.grip2;
    curveTube([[hx, -V.hl * 0.45, z], [hx * 1.05, -V.hl * 0.75, z], [hx * 0.95, -V.hl, z]], V.hl > 0.25 ? 0.016 : 0.011, gm, { parent: h, radialSegments: 12, segments: 12 });
    if (T.heavy) mesh(cylZ(0.022, 0.012, 16), m.rubber, { parent: h, at: [hx * 0.85, -V.hl * 0.42, z] });
  }
  mesh(cylZ(0.006, t * 2.4, 14), m.chrome, { parent: g, name: 'pivot' });
  return [clip('open', 2, halves.map((h, i) => rotateTrack(h, 'z', 2, (u) => (i ? -1 : 1) * 0.25 * pingPong(u))))];
}, { setScales: [1, 0.8] });

/* ================================ lawn mower ================================ */

export const MOWER_VARIANTS = { 'push-rotary': {}, electric: {}, reel: {}, 'ride-on': {}, robot: {} };

export const createLawnMower = makeTool('lawn-mower', MOWER_VARIANTS, { ...GBASE, p: '#c0392b' }, (g, { T, m, variant }) => {
  const anims = [];
  const deck = variant === 'electric' ? m.plastic(T.trim ? T.p : '#2f8a3a', 0.4) : m.body;
  const wheels = [];
  const wh = (r, w, at, n) => { const wg = wheel(g, T, m, r, w, at, n); wheels.push(wg); return wg; };
  if (variant === 'robot') {
    mesh(cushion(0.5, 0.18, 0.38, { radius: 0.08, bulge: 0.4 }), deck, { parent: g, at: [0, 0.16, 0] });
    mesh(roundedBox(0.44, 0.03, 0.32, 0.01), m.dark, { parent: g, at: [0, 0.07, 0] });
    for (const sz of [-1, 1]) wh(0.1, 0.05, [-0.12, 0.1, sz * 0.2], `wheel${sz}`).rotation.y = PI / 2;
    for (const sz of [-1, 1]) mesh(sphere(0.03, 12, 10), m.rubber, { parent: g, at: [0.2, 0.03, sz * 0.1] });
    mesh(roundedBox(0.12, 0.012, 0.12, 0.004), m.black, { parent: g, at: [0.05, 0.268, 0] });
    const lamp = lampGroup('status', 'green');
    lamp.add(g, { at: [0.05, 0.274, 0], normal: [0, 1, 0], w: 0.02, h: 0.02, depth: 0.005, shape: 'round', bezel: false, glowSize: 0.06 });
    anims.push(clip('on', 1, lampTracks('status', 2.4, { blink: 1 })));
    anims.push(clip('roll', 1, wheels.map((w) => spinTrack(w, 'x', 1))));
    return anims;
  }
  if (variant === 'ride-on') {
    const body = m.body;
    wh(0.17, 0.11, [-0.45, 0.17, 0.42], 'wheelRL'); wh(0.17, 0.11, [-0.45, 0.17, -0.42], 'wheelRR');
    wh(0.11, 0.07, [0.55, 0.11, 0.36], 'wheelFL'); wh(0.11, 0.07, [0.55, 0.11, -0.36], 'wheelFR');
    for (const w of wheels) w.rotation.y = PI / 2;
    for (const x of [-0.45, 0.55]) mesh(cylZ(0.02, x < 0 ? 0.84 : 0.72, 12), m.dark, { parent: g, at: [x, x < 0 ? 0.17 : 0.11, 0] });
    mesh(roundedBox(1.25, 0.08, 0.5, 0.02), m.dark, { parent: g, at: [0.05, 0.2, 0] });
    mesh(roundedBox(0.5, 0.25, 0.52, 0.06), body, { parent: g, at: [0.45, 0.38, 0] });
    mesh(roundedBox(0.7, 0.12, 0.6, 0.04), body, { parent: g, at: [-0.15, 0.3, 0] });
    mesh(roundedBox(0.5, 0.06, 0.9, 0.02), body, { parent: g, at: [0.08, 0.14, 0] });
    mesh(cushion(0.34, 0.08, 0.4), m.black, { parent: g, at: [-0.25, 0.4, 0] });
    mesh(cushion(0.08, 0.3, 0.4), m.black, { parent: g, at: [-0.42, 0.55, 0], rot: [0, 0, 0.15] });
    curveTube([[0.25, 0.48, 0], [0.12, 0.72, 0]], 0.015, m.dark, { parent: g });
    const sw = group('steer', { parent: g, at: [0.11, 0.74, 0], rot: [0, 0, 0.5] });
    mesh(torus(0.13, 0.014, 28, 8), m.black, { parent: sw, rot: [PI / 2, 0, 0] });
    mesh(cylX(0.01, 0.26, 8), m.black, { parent: sw });
    mesh(sphere(0.03, 12, 10), m.black, { parent: sw });
    mesh(cushion(0.5, 0.3, 0.45), M.fabric(T.trim ? T.s : '#2b2e33'), { parent: g, at: [-0.74, 0.42, 0] });
    if (T.pro) hazard(g, 0.4, 0.04, { at: [0.45, 0.4, 0.261] });
    anims.push(clip('roll', 1, wheels.map((w) => spinTrack(w, 'x', 1))));
    return anims;
  }
  if (variant === 'reel') {
    const reel = group('reel', { parent: g, at: [0, 0.11, 0] });
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * PI * 2;
      const pts = Array.from({ length: 7 }, (_, i) => { const x = -0.18 + (i / 6) * 0.36; const b = a + (i / 6) * 0.8; return [x, Math.cos(b) * 0.07, Math.sin(b) * 0.07]; });
      curveTube(pts, 0.004, m.steel, { parent: reel, radialSegments: 5, segments: 14 });
    }
    mesh(cylX(0.008, 0.38, 10), m.steel, { parent: reel });
    for (const sx of [-1, 1]) mesh(cylX(0.075, 0.01, 16), m.steel, { parent: reel, at: [sx * 0.18, 0, 0] });
    wh(0.12, 0.04, [-0.22, 0.12, 0], 'wheelL'); wh(0.12, 0.04, [0.22, 0.12, 0], 'wheelR');
    mesh(roundedBox(0.4, 0.012, 0.05, 0.004), m.steel, { parent: g, at: [0, 0.035, -0.08] });
    for (const sx of [-1, 1]) mesh(roundedBox(0.012, 0.08, 0.14, 0.004), m.body, { parent: g, at: [sx * 0.2, 0.09, -0.04] });
    mesh(cylX(0.02, 0.3, 10), m.dark, { parent: g, at: [0, 0.035, -0.18] });
    for (const sx of [-1, 1]) { mesh(roundedBox(0.012, 0.05, 0.1, 0.004), m.body, { parent: g, at: [sx * 0.2, 0.05, -0.15] }); }
    for (const sx of [-1, 1]) curveTube([[sx * 0.2, 0.12, 0], [sx * 0.18, 0.5, -0.45], [sx * 0.2, 0.95, -0.8]], 0.012, m.body, { parent: g, radialSegments: 8 });
    mesh(cylX(0.016, 0.44, 12), m.grip, { parent: g, at: [0, 0.95, -0.8] });
    anims.push(clip('mow', 1, [spinTrack(reel, 'x', 0.4, -1), ...wheels.map((w) => spinTrack(w, 'x', 1))]));
    return anims;
  }
  // push rotary (petrol) / electric
  const R = 0.26;
  mesh(lathe([[0, 0.16], [R * 0.6, 0.16], [R, 0.12], [R + 0.01, 0.04], [R - 0.005, 0.04], [R - 0.01, 0.11], [R * 0.6, 0.148], [0, 0.148]], 40), deck, { parent: g, scale: [1, 1, 0.9] });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) wh(0.09, 0.045, [sx * 0.22, 0.09, sz * 0.25], `wheel${sx}${sz}`);
  for (const w of wheels) w.rotation.y = PI / 2;
  for (const sx of [-1, 1]) mesh(cylZ(0.008, 0.18, 8), m.dark, { parent: g, at: [sx * 0.22, 0.09, 0], scale: [1, 1, 3] });
  if (variant === 'push-rotary') {
    mesh(lathe([[0, 0], [0.1, 0], [0.1, 0.1], [0.07, 0.14], [0, 0.145]], 28), T.vintage ? m.alu : m.dark, { parent: g, at: [0.02, 0.15, 0] });
    mesh(roundedBox(0.09, 0.07, 0.1, 0.02), m.body2, { parent: g, at: [0.08, 0.32, 0] });
    mesh(cylZ(0.03, 0.03, 14), m.black, { parent: g, at: [-0.05, 0.27, 0.06] });
  } else mesh(cushion(0.2, 0.08, 0.2), deck, { parent: g, at: [0.02, 0.19, 0] });
  // handlebar + grass bag at the back (-X)
  for (const sz of [-1, 1]) curveTube([[-0.2, 0.15, sz * 0.18], [-0.45, 0.55, sz * 0.2], [-0.7, 0.95, sz * 0.2]], 0.012, m.dark, { parent: g, radialSegments: 8 });
  mesh(cylZ(0.015, 0.44, 12), m.grip, { parent: g, at: [-0.7, 0.95, 0] });
  mesh(cushion(0.32, 0.25, 0.36), M.fabric(T.trim ? T.s : '#2b2e33'), { parent: g, at: [-0.38, 0.2, 0] });
  if (variant === 'electric') curveTube([[-0.7, 0.93, 0.2], [-0.75, 0.5, 0.25], [-0.85, 0.01, 0.3], [-1.1, 0.01, 0.2]], 0.005, M.plastic('#e8650f', 0.5), { parent: g, segments: 30, radialSegments: 6 });
  if (T.pro) hazard(g, 0.2, 0.03, { at: [0.0, 0.135, 0.237], rot: [-0.3, 0, 0] });
  anims.push(clip('roll', 1, wheels.map((w) => spinTrack(w, 'x', 1))));
  return anims;
}, { lay: false, set: (g, { one, m }) => {
  const anims = one(g, 0);
  const can = group('fuelcan', { parent: g, at: [0.2, 0, 0.6] });
  mesh(roundedBox(0.3, 0.32, 0.14, 0.03), M.plastic('#c0201a', 0.4), { parent: can, at: [0, 0.16, 0] });
  mesh(cyl(0.02, 0.02, 0.06, 12), M.plastic('#e8b20f', 0.4), { parent: can, at: [0.1, 0.34, 0], rot: [0, 0, -0.5] });
  curveTube([[-0.1, 0.31, 0], [-0.05, 0.38, 0], [0.04, 0.38, 0], [0.06, 0.31, 0]], 0.012, M.plastic('#c0201a', 0.4), { parent: can });
  const rk = createGardenTool({ variant: 'leaf-rake' }); rk.position.set(-0.3, 0, -0.6); rk.rotation.y = 0.2; g.add(rk);
  void m;
  return anims;
} });
