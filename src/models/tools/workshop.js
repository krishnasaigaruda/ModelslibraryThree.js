// Garage & workshop: workbenches, toolboxes, pegboards, vises & clamps, ladders, sawhorses,
// air compressors and welding gear. Built standing (y up), front = +Z.
import {
  THREE, M, mesh, group, roundedBox, curveTube, lathe, cushion, makeTool, shapeGeo, ringGeo, arc, tub,
  cyl, cylX, cylZ, sphere, torus, latheX, decal, hazard, textDecal, canvasTex, hollowBox,
  spinTrack, rotateTrack, moveTrack, clip, pingPong, wave, lampGroup, lampTracks,
} from './common.js';
import { createHammer, createWrench, createScrewdriver, createPliers } from './hand.js';
import { createDrill } from './power.js';

const PI = Math.PI;
const post = (par, w, h, d, mat, at, r = 0.006) => mesh(roundedBox(w, h, d, r), mat, { parent: par, at: [at[0], at[1] + h / 2, at[2]] });

/** A drop-in tool (another factory's model) placed at `at`, rotated by ry. */
function prop(par, make, opts, at, ry = 0, s = 1) {
  const o = make(opts);
  o.position.set(...at);
  o.rotation.y = ry;
  o.scale.multiplyScalar(s);
  o.traverse((c) => { if (c.name) c.name = `p_${c.name}`; });
  par.add(o);
  return o;
}

/** Metal drawer with a pull handle, front face at z = 0 (in the drawer group). */
function drawer(par, w, h, d, m, mat, name, at) {
  const dr = group(name, { parent: par, at });
  mesh(roundedBox(w, h, 0.012, 0.003), mat, { parent: dr, at: [0, 0, -0.006] });
  hollowBox(dr, w * 0.94, h * 0.75, d, 0.004, m.dark, { at: [0, -h * 0.4, -d / 2 - 0.006], name: `${name}_bin` });
  mesh(roundedBox(w * 0.6, 0.01, 0.014, 0.004), m.chrome, { parent: dr, at: [0, h * 0.28, 0.006] });
  return dr;
}

/* =============================== workbench =============================== */

export const WORKBENCH_VARIANTS = { wooden: {}, steel: {}, folding: {}, 'rolling-cabinet': {}, carpenter: {} };

export const createWorkbench = makeTool('workbench', WORKBENCH_VARIANTS, { p: '#c0392b', s: '#2b2e33', wood: '#c49a62' }, (g, { T, m, variant }) => {
  const anims = [];
  const top = T.kids ? m.body : T.vintage ? M.wood('#7a5230') : T.rust ? m.wood : M.wood('#c9a46a');
  if (variant === 'folding') {
    const H = 0.78;
    for (const sz of [-1, 1]) {
      curveTube([[-0.3, 0.015, sz * 0.22], [-0.25, H * 0.5, sz * 0.2], [0.25, H - 0.04, sz * 0.18]], 0.014, m.body, { parent: g, radialSegments: 10, segments: 6 });
      curveTube([[0.3, 0.015, sz * 0.22], [0.25, H * 0.5, sz * 0.2], [-0.25, H - 0.04, sz * 0.18]], 0.014, m.body, { parent: g, radialSegments: 10, segments: 6 });
      for (const sx of [-1, 1]) mesh(sphere(0.022, 10, 8), m.rubber, { parent: g, at: [sx * 0.3, 0.015, sz * 0.22] });
    }
    mesh(roundedBox(0.66, 0.03, 0.4, 0.008), m.body2, { parent: g, at: [0, H - 0.04, 0] });
    for (const z of [-0.1, 0.1]) mesh(roundedBox(0.62, 0.04, 0.18, 0.008), top, { parent: g, at: [0, H, z] });
    mesh(cyl(0.012, 0.012, 0.03, 12), m.black, { parent: g, at: [-0.2, H + 0.035, 0.02] });
    for (const sx of [-1, 1]) {
      mesh(cylZ(0.008, 0.5, 12), m.chrome, { parent: g, at: [sx * 0.24, H - 0.045, 0.05] });
      mesh(cylX(0.025, 0.04, 16), m.black, { parent: g, at: [sx * 0.24, H - 0.045, 0.31] }).rotation.y = PI / 2;
    }
    return anims;
  }
  const W = variant === 'carpenter' ? 2.0 : variant === 'rolling-cabinet' ? 1.2 : 1.6, D = variant === 'rolling-cabinet' ? 0.5 : 0.7, H = 0.9;
  const tt = variant === 'carpenter' ? 0.08 : 0.045;
  if (variant === 'rolling-cabinet') {
    const body = m.body;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      mesh(cylX(0.05, 0.035, 18), m.rubber, { parent: g, at: [sx * (W / 2 - 0.08), 0.05, sz * (D / 2 - 0.07)] });
      post(g, 0.06, 0.04, 0.06, m.steel, [sx * (W / 2 - 0.08), 0.085, sz * (D / 2 - 0.07)]);
    }
    mesh(roundedBox(W, H - 0.125 - tt, D, 0.01), body, { parent: g, at: [0, 0.125 + (H - 0.125 - tt) / 2, 0] });
    const n = 6;
    const dh = (H - 0.2 - tt) / n;
    for (let k = 0; k < n; k++) {
      for (const sx of [-1, 1]) {
        const d = drawer(g, W / 2 - 0.03, dh - 0.01, D - 0.06, m, m.body2, `drawer${k}${sx > 0 ? 'R' : 'L'}`, [sx * W / 4, 0.15 + dh * (k + 0.5), D / 2 + 0.001]);
        if (k === n - 1 && sx > 0) anims.push(clip('open', 3, [moveTrack(d, 3, (u) => [0, 0, 0.3 * pingPong(u)])]));
      }
    }
    mesh(roundedBox(W + 0.04, tt, D + 0.04, 0.01), top, { parent: g, at: [0, H - tt / 2, 0] });
    curveTube([[W / 2 - 0.004, H - 0.12, -0.15], [W / 2 + 0.08, H - 0.12, -0.15], [W / 2 + 0.08, H - 0.12, 0.15], [W / 2 - 0.004, H - 0.12, 0.15]], 0.012, m.chrome, { parent: g, radialSegments: 10, segments: 20 });
    if (T.pro) hazard(g, W, 0.03, { at: [0, 0.14, D / 2 + 0.0015] });
    return anims;
  }
  // legs + rails
  const lw = variant === 'steel' ? 0.05 : 0.08;
  const legMat = variant === 'steel' ? m.body2 : T.kids ? m.accent : top;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) post(g, lw, H - tt, lw, legMat, [sx * (W / 2 - 0.1), 0, sz * (D / 2 - 0.08)]);
  for (const sz of [-1, 1]) post(g, W - 0.15, 0.06, 0.03, legMat, [0, 0.12, sz * (D / 2 - 0.08)]);
  for (const sx of [-1, 1]) post(g, 0.03, 0.06, D - 0.12, legMat, [sx * (W / 2 - 0.1), 0.12, 0]);
  mesh(roundedBox(W - 0.2, 0.02, D - 0.12, 0.004), variant === 'steel' ? m.body2 : top, { parent: g, at: [0, 0.19, 0] });
  if (variant === 'steel') {
    mesh(roundedBox(W + 0.02, tt, D + 0.02, 0.008), T.rust ? m.wood : T.kids ? m.body : M.wood('#8a6b4a'), { parent: g, at: [0, H - tt / 2, 0] });
    const cab = group('cab', { parent: g, at: [W / 2 - 0.32, H - tt, D / 2 - 0.06] });
    mesh(roundedBox(0.44, 0.36, D - 0.12, 0.01), m.body, { parent: cab, at: [0, -0.18, -(D - 0.12) / 2] });
    for (let k = 0; k < 3; k++) {
      const d = drawer(cab, 0.4, 0.105, D - 0.2, m, m.body, `drawer${k}`, [0, -0.06 - k * 0.115, 0.001]);
      if (!k) anims.push(clip('open', 3, [moveTrack(d, 3, (u) => [0, 0, 0.3 * pingPong(u)])]));
    }
    if (T.pro) hazard(g, W, 0.025, { at: [0, H - tt - 0.02, D / 2 - 0.064] });
  } else {
    mesh(roundedBox(W, tt, D, 0.006), top, { parent: g, at: [0, H - tt / 2, 0] });
    for (let k = -3; k <= 3; k++) mesh(new THREE.PlaneGeometry(0.002, D * 0.98).rotateX(-PI / 2), M.matte('#7a5a38', 0.9), { parent: g, at: [k * W / 8, H + 0.0004, 0] });
    // front woodworking vise
    const vz = D / 2;
    const jaw = group('vicejaw', { parent: g, at: [-W / 2 + 0.3, H - 0.1, vz + 0.04] });
    mesh(roundedBox(0.42, 0.16, 0.06, 0.008), top, { parent: jaw });
    for (const sx of [-1, 1]) mesh(cylZ(0.012, 0.3, 12), m.steel, { parent: jaw, at: [sx * 0.15, -0.02, -0.12] });
    mesh(cylZ(0.016, 0.34, 14), m.steel, { parent: jaw, at: [0, -0.02, -0.12] });
    mesh(cylX(0.012, 0.3, 12), T.vintage ? M.wood('#5b3a24') : m.steel, { parent: jaw, at: [0, -0.02, 0.07] });
    for (const sx of [-1, 1]) mesh(sphere(0.018, 12, 10), m.black, { parent: jaw, at: [sx * 0.15, -0.02, 0.07] });
    anims.push(clip('vise', 3, [moveTrack(jaw, 3, (u) => [0, 0, 0.08 * pingPong(u)])]));
    for (const x of [-0.4, 0.1, 0.6]) mesh(roundedBox(0.02, 0.012, 0.02, 0.003), m.steel, { parent: g, at: [x, H + 0.006, D / 2 - 0.08] });
    if (variant === 'carpenter') {
      mesh(roundedBox(W - 0.1, 0.02, 0.2, 0.004), top, { parent: g, at: [0, H - tt - 0.01, -D / 2 - 0.08] });
      for (const z of [-D / 2 - 0.18, -D / 2 + 0.01]) post(g, W - 0.1, 0.05, 0.02, top, [0, H - tt - 0.02, z]);
      for (const sx of [-1, 1]) post(g, 0.06, H - tt, 0.06, top, [sx * (W / 2 - 0.1), 0, -D / 2 - 0.08]);
    }
    if (T.pro) hazard(g, W, 0.03, { at: [0, H - tt / 2, D / 2 + 0.0005] });
  }
  if (T.heavy) for (const sx of [-1, 1]) post(g, 0.12, 0.012, 0.12, m.steel, [sx * (W / 2 - 0.1), 0, D / 2 - 0.08]);
  return anims;
}, {
  lay: false,
  set: (g, { T, m, one, variant }) => {
    const anims = one(g, 0);
    const H = variant === 'folding' ? 0.8 : 0.9;
    prop(g, createDrill, { variant: 'drill', trim: T.trim === 'set' ? 'cordless' : undefined }, [0.35, H, 0.05], -0.6);
    prop(g, createHammer, { variant: 'claw' }, [-0.1, H, 0.15], 0.4);
    prop(g, createWrench, { variant: 'adjustable' }, [0.0, H, -0.15], 1.2);
    prop(g, createScrewdriver, { variant: 'phillips' }, [-0.3, H, 0.0], -0.3);
    const box = group('settoolbox', { parent: g, at: variant === 'folding' ? [-0.65, 0, 0] : [-0.55, H, -0.15] });
    hollowBox(box, 0.4, 0.16, 0.2, 0.008, m.paint('#c0392b'), { name: 'stb' });
    void m;
    return anims;
  },
});

/* ================================ toolbox ================================ */

export const TOOLBOX_VARIANTS = { cantilever: {}, 'plastic-box': {}, tote: {}, chest: {}, 'roller-cabinet': {}, 'tool-bag': {}, 'wooden-tote': {} };

function latch(par, m, at) {
  mesh(roundedBox(0.03, 0.035, 0.008, 0.003), m.chrome, { parent: par, at });
}

export const createToolbox = makeTool('tool-chest', TOOLBOX_VARIANTS, { p: '#c0392b', s: '#1d1e21' }, (g, { T, m, variant }) => {
  const c = T.chunky > 1.2 ? 1.1 : 1;
  const shell = variant === 'plastic-box' || variant === 'tote' ? m.plastic(T.trim ? T.p : '#2a6fd1', 0.45) : m.body;
  if (variant === 'tote' || variant === 'wooden-tote') {
    const W = 0.5, D = 0.24, H = 0.16;
    const mat = variant === 'wooden-tote' ? (T.kids ? m.body : m.wood) : shell;
    hollowBox(g, W, H, D, 0.014, mat, { name: 'tray' });
    for (const sx of [-1, 1]) mesh(shapeGeo([[-D / 2, 0], [D / 2, 0], [D / 2, H], [0.03, H + 0.1], [-0.03, H + 0.1], [-D / 2, H]], 0.016, { bevel: 0.003 }).rotateY(PI / 2), mat, { parent: g, at: [sx * (W / 2 - 0.008), 0, 0] });
    mesh(cylX(0.014, W - 0.01, 16), variant === 'wooden-tote' ? M.wood('#a8814f') : m.body2, { parent: g, at: [0, H + 0.08, 0] });
    mesh(roundedBox(W - 0.03, H * 0.7, 0.008, 0.003), mat, { parent: g, at: [0, H * 0.35 + 0.01, 0] });
    for (let k = 0; k < 4; k++) mesh(cyl(0.012, 0.012, 0.12, 12), [m.grip2, m.grip, m.accent, m.body2][k], { parent: g, at: [-0.18 + k * 0.035, 0.07, 0.06], rot: [0.15, 0, 0.1 * k - 0.15] });
    return [];
  }
  if (variant === 'tool-bag') {
    const W = 0.45, D = 0.25, H = 0.26;
    const fab = T.kids ? m.body : T.vintage ? new THREE.MeshPhysicalMaterial({ name: 'leather', color: '#7a4a28', roughness: 0.55, clearcoat: 0.3 }) : M.fabric(T.trim ? T.p : '#2b2e33');
    mesh(roundedBox(W, 0.03, D, 0.012), m.rubber, { parent: g, at: [0, 0.015, 0] });
    const wall = 0.012;
    mesh(roundedBox(W, H, wall, 0.005), fab, { parent: g, at: [0, H / 2 + 0.01, D / 2 - wall / 2] });
    mesh(roundedBox(W, H, wall, 0.005), fab, { parent: g, at: [0, H / 2 + 0.01, -D / 2 + wall / 2] });
    for (const sx of [-1, 1]) mesh(roundedBox(wall, H, D, 0.005), fab, { parent: g, at: [sx * (W / 2 - wall / 2), H / 2 + 0.01, 0] });
    for (const sz of [-1, 1]) mesh(roundedBox(W * 0.9, 0.1, 0.006, 0.003), T.vintage ? fab : M.fabric(T.trim ? T.s : '#c0392b'), { parent: g, at: [0, 0.1, sz * (D / 2 + 0.003)] });
    for (const sz of [-1, 1]) curveTube([[-0.1, H + 0.005, sz * (D / 2 - 0.006)], [-0.08, H + 0.12, sz * 0.05], [0.08, H + 0.12, sz * 0.05], [0.1, H + 0.005, sz * (D / 2 - 0.006)]], 0.01, T.vintage ? fab : m.body2, { parent: g, radialSegments: 8, segments: 20 });
    for (const sx of [-1, 1]) mesh(roundedBox(0.012, 0.006, D * 0.95, 0.002), m.chrome, { parent: g, at: [sx * (W / 2 - 0.006), H + 0.012, 0] });
    for (let k = 0; k < 3; k++) mesh(cyl(0.014, 0.014, 0.26, 12), [m.grip2, m.accent, m.grip][k], { parent: g, at: [-0.1 + k * 0.08, 0.15, 0.02], rot: [0.2, 0, 0] });
    return [];
  }
  if (variant === 'chest' || variant === 'roller-cabinet') {
    const W = 0.66, D = 0.32;
    let y0 = 0;
    const anims = [];
    if (variant === 'roller-cabinet') {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(cylX(0.04, 0.03, 16), m.rubber, { parent: g, at: [sx * (W / 2 - 0.06), 0.04, sz * (D / 2 - 0.05)] });
      const ch = 0.6;
      mesh(roundedBox(W, ch, D + 0.05, 0.01), shell, { parent: g, at: [0, 0.08 + ch / 2, 0] });
      for (let k = 0; k < 5; k++) drawer(g, W - 0.04, ch / 5 - 0.012, D - 0.02, m, m.body2, `cdrawer${k}`, [0, 0.08 + (ch / 5) * (k + 0.5), (D + 0.05) / 2 + 0.001]);
      curveTube([[-W / 2 - 0.004, 0.55, -0.1], [-W / 2 - 0.07, 0.55, -0.1], [-W / 2 - 0.07, 0.55, 0.1], [-W / 2 - 0.004, 0.55, 0.1]], 0.012, m.chrome, { parent: g, radialSegments: 10, segments: 16 });
      y0 = 0.08 + ch;
    }
    const H = 0.3;
    mesh(roundedBox(W, H, D, 0.008), shell, { parent: g, at: [0, y0 + H / 2, 0] });
    for (let k = 0; k < 3; k++) {
      const d = drawer(g, W - 0.04, H / 3 - 0.012, D - 0.04, m, m.body2, `drawer${k}`, [0, y0 + (H / 3) * (k + 0.5), D / 2 + 0.001]);
      if (k === 2) anims.push(clip('drawer', 3, [moveTrack(d, 3, (u) => [0, 0, 0.2 * pingPong(u)])]));
    }
    const box = hollowBox(g, W, 0.12, D, 0.008, shell, { at: [0, y0 + H, 0], name: 'well' });
    void box;
    const lid = group('lid', { parent: g, at: [0, y0 + H + 0.12, -D / 2] });
    mesh(roundedBox(W + 0.006, 0.05, D + 0.006, 0.01), shell, { parent: lid, at: [0, 0.025, D / 2] });
    mesh(roundedBox(0.2, 0.014, 0.02, 0.006), m.chrome, { parent: lid, at: [0, 0.03, D + 0.012] });
    if (T.pro) hazard(g, W, 0.025, { at: [0, y0 + H + 0.06, D / 2 + 0.0005] });
    anims.push(clip('open', 4, [rotateTrack(lid, 'x', 4, (u) => -1.6 * pingPong(u))]));
    return anims;
  }
  // cantilever metal box / plastic box with a hinged lid
  const W = 0.5 * c, D = 0.22 * c, H = 0.2 * c;
  hollowBox(g, W, H, D, 0.006, shell, { name: 'base' });
  // inner tray resting on two ledges
  for (const sx of [-1, 1]) mesh(roundedBox(0.012, 0.012, D - 0.02, 0.003), shell, { parent: g, at: [sx * (W / 2 - 0.012), H - 0.06, 0] });
  hollowBox(g, W - 0.04, 0.05, D - 0.03, 0.004, variant === 'plastic-box' ? m.plastic('#e8b20f') : m.body2, { at: [0, H - 0.054, 0], name: 'tray' });
  const anims = [];
  if (variant === 'cantilever') {
    const lids = [];
    for (const sz of [-1, 1]) {
      const lid = group(sz < 0 ? 'lidB' : 'lidF', { parent: g, at: [0, H, sz * D / 2] });
      mesh(roundedBox(W, 0.03, D / 2, 0.006), shell, { parent: lid, at: [0, 0.015, -sz * D / 4] });
      lids.push([lid, sz]);
    }
    curveTube([[-0.1, H + 0.03, 0], [-0.1, H + 0.09, 0], [0.1, H + 0.09, 0], [0.1, H + 0.03, 0]], 0.009, m.chrome, { parent: g, radialSegments: 10, segments: 20, name: 'bail' });
    for (const sx of [-1, 1]) mesh(roundedBox(0.012, 0.03, 0.03, 0.004), m.chrome, { parent: g, at: [sx * 0.1, H + 0.03, 0] });
    for (const sx of [-1, 1]) latch(g, m, [sx * W * 0.3, H - 0.02, D / 2 + 0.004]);
    anims.push(clip('open', 4, lids.map(([l, sz]) => rotateTrack(l, 'x', 4, (u) => sz * 1.9 * pingPong(u)))));
  } else {
    const lid = group('lid', { parent: g, at: [0, H, -D / 2] });
    mesh(roundedBox(W + 0.008, 0.05, D + 0.008, 0.015), shell, { parent: lid, at: [0, 0.025, D / 2] });
    mesh(roundedBox(W * 0.5, 0.025, 0.04, 0.01), m.body2, { parent: lid, at: [0, 0.06, D / 2] });
    for (const sx of [-1, 1]) mesh(roundedBox(0.03, 0.03, 0.03, 0.008), m.body2, { parent: lid, at: [sx * W * 0.25, 0.05, D / 2] });
    for (const sx of [-1, 1]) latch(lid, m, [sx * W * 0.35, 0.0, D + 0.008]);
    anims.push(clip('open', 4, [rotateTrack(lid, 'x', 4, (u) => -1.8 * pingPong(u))]));
  }
  if (T.pro) hazard(g, W, 0.025, { at: [0, H * 0.4, D / 2 + 0.0005] });
  if (T.heavy) for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.04, 0.04, 0.04, 0.01), m.rubber, { parent: g, at: [sx * (W / 2 - 0.01), 0.02, sz * (D / 2 - 0.01)] });
  if (T.kids) mesh(sphere(0.03), m.accent, { parent: g, at: [0, H * 0.5, D / 2] });
  return anims;
}, {
  lay: false,
  set: (g, { T, m, one, variant }) => {
    const anims = one(g, 0);
    const big = variant === 'chest' || variant === 'roller-cabinet';
    prop(g, createHammer, { variant: 'claw' }, [big ? 0.5 : 0.42, 0, 0.1], 0.5);
    prop(g, createPliers, { variant: 'combination' }, [big ? 0.5 : 0.4, 0, -0.12], -0.4);
    prop(g, createScrewdriver, { variant: 'flathead' }, [big ? -0.5 : -0.38, 0, 0.05], 0.2);
    void T; void m;
    return anims;
  },
});

/* ================================ pegboard ================================ */

export const PEGBOARD_VARIANTS = { panel: { W: 0.9 }, wide: { W: 1.6 }, 'with-shelf': { W: 1.2, shelf: true }, slatwall: { W: 1.2, slat: true }, mobile: { W: 1.0, mobile: true } };

function hangTools(par, m, T, W, y0, H, z) {
  // simple hung silhouettes, each on a peg that enters the board
  const peg = (x, y) => mesh(cylZ(0.003, 0.05, 6), m.chrome, { parent: par, at: [x, y, z + 0.022] });
  const xs = (f) => -W / 2 + W * f;
  // wrenches
  for (let k = 0; k < 5; k++) {
    const x = xs(0.08 + k * 0.045), len = 0.14 + k * 0.025, y = y0 + H * 0.85;
    peg(x, y);
    mesh(roundedBox(0.014, len, 0.005, 0.002), m.chrome, { parent: par, at: [x, y - len / 2 + 0.01, z + 0.006] });
  }
  // hammer
  let x = xs(0.42), y = y0 + H * 0.82;
  peg(x - 0.03, y); peg(x + 0.03, y);
  mesh(roundedBox(0.12, 0.025, 0.025, 0.006), m.steel, { parent: par, at: [x, y + 0.015, z + 0.03] });
  mesh(cyl(0.013, 0.013, 0.28, 12), T.vintage ? m.wood : m.grip, { parent: par, at: [x, y - 0.13, z + 0.03] });
  // screwdrivers on a rack
  x = xs(0.68); y = y0 + H * 0.7;
  mesh(roundedBox(0.24, 0.015, 0.05, 0.004), m.body2, { parent: par, at: [x, y, z + 0.025] });
  for (let k = 0; k < 6; k++) {
    mesh(cyl(0.011, 0.011, 0.09, 12), [m.grip2, m.accent][k % 2], { parent: par, at: [x - 0.1 + k * 0.04, y + 0.052, z + 0.03] });
    mesh(cyl(0.003, 0.003, 0.1, 8), m.chrome, { parent: par, at: [x - 0.1 + k * 0.04, y - 0.05, z + 0.03] });
  }
  // saw
  x = xs(0.3); y = y0 + H * 0.4;
  peg(x - 0.1, y + 0.05);
  mesh(roundedBox(0.4, 0.1, 0.002, 0.001), m.steel, { parent: par, at: [x + 0.05, y + 0.02, z + 0.004] });
  mesh(roundedBox(0.12, 0.12, 0.022, 0.02), T.vintage ? m.wood : m.body, { parent: par, at: [x - 0.18, y + 0.04, z + 0.013] });
  // pliers + tape
  x = xs(0.72); y = y0 + H * 0.35;
  peg(x, y + 0.06);
  for (const sx of [-1, 1]) mesh(roundedBox(0.012, 0.16, 0.008, 0.003), m.grip2, { parent: par, at: [x + sx * 0.012, y, z + 0.006], rot: [0, 0, sx * 0.12] });
  peg(x + 0.12, y + 0.04);
  mesh(roundedBox(0.07, 0.07, 0.035, 0.015), m.accent, { parent: par, at: [x + 0.12, y + 0.01, z + 0.02] });
}

const holeTex = (bg) => (ctx, w, h) => {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  for (let x = 8; x < w; x += 16) for (let y = 8; y < h; y += 16) { ctx.beginPath(); ctx.arc(x, y, 3, 0, PI * 2); ctx.fill(); }
};

export const createPegboard = makeTool('pegboard', PEGBOARD_VARIANTS, { p: '#c0392b', s: '#2b2e33' }, (g, { T, m, V }) => {
  const W = V.W, H = 1.0, y0 = 0.8, frame = m.body2;
  const boardCol = T.kids ? '#7fd3ff' : T.pro ? '#f5b301' : T.vintage ? '#6e4a2c' : T.rust ? '#9a8f7c' : T.heavy ? '#7c8188' : '#c7a983';
  // stand: two feet + two uprights
  const fz = V.mobile ? 0 : -0.03;
  for (const sx of [-1, 1]) {
    const x = sx * (W / 2 + 0.02);
    if (V.mobile) {
      mesh(roundedBox(0.06, 0.04, 0.6, 0.008), frame, { parent: g, at: [x, 0.08, 0] });
      for (const sz of [-1, 1]) { mesh(cylX(0.04, 0.03, 14), m.rubber, { parent: g, at: [x, 0.04, sz * 0.25] }); }
    } else mesh(roundedBox(0.06, 0.04, 0.55, 0.008), frame, { parent: g, at: [x, 0.02, fz] });
    post(g, 0.04, y0 + H + 0.05 - (V.mobile ? 0.1 : 0.04), 0.04, frame, [x, V.mobile ? 0.1 : 0.04, fz]);
  }
  post(g, W + 0.08, 0.04, 0.04, frame, [0, y0 - 0.06, fz]);
  if (V.slat) {
    for (let k = 0; k < 8; k++) mesh(roundedBox(W, H / 8 - 0.01, 0.02, 0.004), m.plastic(T.trim ? boardCol : '#e8e8e4', 0.5), { parent: g, at: [0, y0 + (H / 8) * (k + 0.5), fz] });
  } else {
    const tex = canvasTex(256, 256, holeTex(boardCol));
    if (tex) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(W / 0.4, H / 0.4); }
    const mat = new THREE.MeshStandardMaterial({ name: 'pegboard', color: tex ? '#ffffff' : boardCol, map: tex, roughness: 0.8, metalness: T.pro || T.heavy ? 0.4 : 0 });
    mesh(roundedBox(W, H, 0.012, 0.003), mat, { parent: g, at: [0, y0 + H / 2, fz] });
  }
  hangTools(g, m, T, W, y0, H, fz + 0.006);
  if (V.shelf) {
    mesh(roundedBox(W, 0.018, 0.22, 0.004), m.wood, { parent: g, at: [0, y0 + 0.1, fz + 0.11] });
    for (const sx of [-0.4, 0.4]) mesh(shapeGeo([[0, 0], [0.18, 0], [0, -0.12]], 0.02, { bevel: 0.002 }).rotateY(-PI / 2), frame, { parent: g, at: [sx * W, y0 + 0.091, fz + 0.006] });
    for (let k = 0; k < 4; k++) {
      const b = group(`bin${k}`, { parent: g, at: [-W * 0.35 + k * W * 0.23, y0 + 0.109, fz + 0.1] });
      mesh(tub(0.06, 0.07, 0.08, 0.004, 4), m.plastic(['#2a6fd1', '#e8b20f', '#c0392b', '#2aa16b'][k], 0.45), { parent: b, scale: [1.4, 1, 1.2] });
    }
  }
  if (T.pro) hazard(g, W, 0.04, { at: [0, y0 - 0.04, fz + 0.0205] });
  return [];
}, {
  lay: false,
  set: (g, { T, m, one, V }) => {
    const anims = one(g, 0);
    mesh(roundedBox(V.W + 0.2, 0.04, 0.6, 0.008), M.wood('#c9a46a'), { parent: g, at: [0, 0.88, 0.32] });
    for (const sx of [-1, 1]) for (const sz of [0.06, 0.58]) post(g, 0.05, 0.86, 0.05, m.body2, [sx * (V.W / 2), 0, sz]);
    void T;
    return anims;
  },
});

/* ============================= vises & clamps ============================= */

export const VISE_VARIANTS = { 'bench-vise': {}, 'woodwork-vise': {}, 'machine-vise': {}, 'c-clamp': {}, 'f-clamp': {}, 'bar-clamp': {} };

export const createViseClamp = makeTool('vise-clamp', VISE_VARIANTS, { p: '#2f5fa8', s: '#1d1e21' }, (g, { T, m, variant }) => {
  const body = m.body, c = T.chunky > 1.2 ? 1.15 : 1;
  if (variant === 'bench-vise' || variant === 'machine-vise') {
    const mach = variant === 'machine-vise';
    const s = c * (mach ? 0.8 : 1);
    mesh(cyl(0.09 * s, 0.1 * s, 0.03, mach ? 4 : 28), body, { parent: g, at: [0, 0.015, 0], rot: [0, PI / 4, 0] });
    mesh(roundedBox(0.12 * s, mach ? 0.05 : 0.1 * s, 0.24 * s, 0.012), body, { parent: g, at: [0, 0.03 + (mach ? 0.025 : 0.05 * s), -0.02] });
    const fixed = group('fixedjaw', { parent: g, at: [0, 0.03, -0.11 * s] });
    mesh(roundedBox(0.16 * s, 0.13 * s, 0.05 * s, 0.01), body, { parent: fixed, at: [0, 0.065 * s, 0] });
    mesh(roundedBox(0.15 * s, 0.03 * s, 0.008, 0.002), m.dark, { parent: fixed, at: [0, 0.12 * s, 0.028 * s] });
    if (!mach) mesh(roundedBox(0.09 * s, 0.03, 0.09 * s, 0.006), m.steel, { parent: fixed, at: [0, 0.145 * s, -0.02] });
    const jaw = group('movejaw', { parent: g, at: [0, 0.03, 0.06 * s] });
    mesh(roundedBox(0.16 * s, 0.13 * s, 0.05 * s, 0.01), body, { parent: jaw, at: [0, 0.065 * s, 0] });
    mesh(roundedBox(0.15 * s, 0.03 * s, 0.008, 0.002), m.dark, { parent: jaw, at: [0, 0.12 * s, -0.028 * s] });
    mesh(roundedBox(0.07 * s, 0.06 * s, 0.2 * s, 0.01), body, { parent: jaw, at: [0, 0.04 * s, -0.1 * s] });
    mesh(cylZ(0.012, 0.14 * s, 12), m.steel, { parent: jaw, at: [0, 0.05 * s, 0.08 * s] });
    mesh(cylX(0.008, 0.2 * s, 10), m.steel, { parent: jaw, at: [0, 0.05 * s, 0.15 * s] });
    for (const sx of [-1, 1]) mesh(sphere(0.014, 10, 8), T.kids ? m.accent : m.black, { parent: jaw, at: [sx * 0.1 * s, 0.05 * s, 0.15 * s] });
    if (T.pro) hazard(g, 0.1 * s, 0.03, { at: [0, 0.06, 0.1 * s + 0.0005] });
    return [clip('open', 3, [moveTrack(jaw, 3, (u) => [0, 0, 0.06 * s * pingPong(u)])])];
  }
  if (variant === 'woodwork-vise') {
    // vise mounted to a short bench-top offcut
    const wood = T.kids ? m.body : m.wood;
    post(g, 0.5, 0.25, 0.3, M.wood('#b8874f'), [0, 0, -0.1]);
    post(g, 0.32, 0.12, 0.04, wood, [0, 0.13, 0.07]);
    const jaw = group('movejaw', { parent: g, at: [0, 0.18, 0.11] });
    mesh(roundedBox(0.32, 0.12, 0.04, 0.006), wood, { parent: jaw });
    for (const sx of [-1, 1]) mesh(cylZ(0.01, 0.2, 12), m.steel, { parent: jaw, at: [sx * 0.11, -0.01, -0.09] });
    mesh(cylZ(0.014, 0.22, 12), m.steel, { parent: jaw, at: [0, -0.01, -0.07] });
    mesh(cylX(0.009, 0.24, 10), T.vintage ? m.wood : m.steel, { parent: jaw, at: [0, -0.01, 0.06] });
    mesh(cylZ(0.022, 0.03, 16), body, { parent: jaw, at: [0, -0.01, 0.035] });
    return [clip('open', 3, [moveTrack(jaw, 3, (u) => [0, 0, 0.06 * pingPong(u)])])];
  }
  // clamps lie flat on the ground
  const t = 0.014 * c;
  if (variant === 'c-clamp') {
    const R = 0.07 * c;
    const pts = [...arc([0, 0], R, PI * 0.35, PI * 1.65, 18)];
    const inner = [...arc([0, 0], R - 0.022 * c, PI * 1.65, PI * 0.35, 18)];
    mesh(shapeGeo([...pts, ...inner], t * 1.6, { bevel: 0.003 }).rotateX(-PI / 2), body, { parent: g, at: [0, t * 0.8, 0] });
    const scr = group('screw', { parent: g, at: [R * 0.55, t * 0.8, R * 0.8] });
    mesh(cylZ(0.007, 0.14 * c, 12), m.steel, { parent: scr, at: [0, 0, -0.04] });
    mesh(cylZ(0.014, 0.008, 14), m.steel, { parent: scr, at: [0, 0, -0.11] });
    mesh(cylX(0.005, 0.08, 8), m.steel, { parent: scr, at: [0, 0, 0.03] });
    return [clip('tighten', 3, [moveTrack(scr, 3, (u) => [0, 0, -0.03 * pingPong(u)])])];
  }
  const L = variant === 'bar-clamp' ? 0.9 : 0.4;
  mesh(roundedBox(0.025 * c, 0.008 * c, L, 0.002), variant === 'bar-clamp' ? m.body2 : m.steel, { parent: g, at: [0, 0.008 * c, 0] });
  mesh(roundedBox(0.03 * c, 0.03 * c, 0.03, 0.005), body, { parent: g, at: [0, 0.015 * c, -L / 2 + 0.02] });
  const fixedArm = mesh(roundedBox(0.03 * c, 0.022 * c, 0.03, 0.006), body, { parent: g, at: [0.045 * c, 0.011 * c, -L / 2 + 0.02] });
  void fixedArm;
  mesh(roundedBox(0.09 * c, 0.022 * c, 0.03, 0.006), body, { parent: g, at: [0.04 * c, 0.011 * c, -L / 2 + 0.02] });
  const head = group('slide', { parent: g, at: [0, 0, L * 0.2] });
  mesh(roundedBox(0.03 * c, 0.03 * c, 0.035, 0.005), body, { parent: head, at: [0, 0.015 * c, 0] });
  mesh(roundedBox(0.09 * c, 0.022 * c, 0.03, 0.006), body, { parent: head, at: [0.04 * c, 0.011 * c, 0] });
  mesh(cyl(0.016 * c, 0.016 * c, 0.1, 14).rotateX(PI / 2), variant === 'bar-clamp' ? m.grip2 : m.wood, { parent: head, at: [0.06 * c, 0.016 * c, 0.07] });
  return [clip('slide', 3, [moveTrack(head, 3, (u) => [0, 0, -L * 0.3 * pingPong(u)])])];
}, { lay: false, setScales: [1, 0.8, 0.6] });

/* ================================= ladder ================================= */

export const LADDER_VARIANTS = { 'stepladder-3': { n: 3 }, 'stepladder-6': { n: 6 }, 'step-stool': { n: 2, stool: true }, platform: { n: 4, platform: true }, extension: { n: 12, ext: true } };

export const createLadder = makeTool('ladder', LADDER_VARIANTS, { p: '#c9ced4', s: '#1d1e21' }, (g, { T, m, V }) => {
  const rail = T.vintage ? m.wood : T.kids ? m.body : T.trim ? m.body : m.alu;
  const step = T.vintage ? M.wood('#a8814f') : T.kids ? m.accent : m.alu;
  const anims = [];
  if (V.ext) {
    // extension ladder lying on its side on the ground (two stacked sections)
    const L = 3.6, w = 0.42;
    for (const [k, off] of [[0, 0], [1, 0.08]]) {
      const sec = group(`section${k}`, { parent: g, at: [k * 1.2, off + 0.04, 0] });
      for (const sz of [-1, 1]) mesh(roundedBox(L, 0.075, 0.025, 0.005), rail, { parent: sec, at: [0, 0, sz * (w / 2 - k * 0.03)] });
      for (let i = 0; i < 12; i++) mesh(cylZ(0.016, w - k * 0.06, 10), step, { parent: sec, at: [-L / 2 + 0.15 + i * 0.3, k ? -0.02 : 0.02, 0] });
      if (k) anims.push(clip('extend', 4, [moveTrack(sec, 4, (u) => [1.0 * pingPong(u), 0, 0])]));
    }
    for (const sz of [-1, 1]) mesh(roundedBox(0.08, 0.08, 0.04, 0.01), m.rubber, { parent: g, at: [-L / 2 - 0.02, 0.04, sz * (w / 2)] });
    return anims;
  }
  const n = V.n, rise = 0.25, H = V.stool ? 0.5 : n * rise + 0.15;
  const ang = 0.2, base = H * Math.tan(ang), w = V.stool ? 0.42 : 0.48;
  const front = group('front', { parent: g });
  const back = group('back', { parent: g });
  const top = [0, H, 0];
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 + 0.02 * (H / 1.8));
    mesh(roundedBox(0.03, H / Math.cos(ang) + 0.04, 0.07, 0.006), rail, { parent: front, at: [x, H / 2, base / 2 + 0.02], rot: [ang, 0, 0] });
    mesh(roundedBox(0.03, H / Math.cos(ang) + 0.04, 0.05, 0.006), rail, { parent: back, at: [x, H / 2, -base / 2 - 0.02], rot: [-ang, 0, 0] });
    for (const z of [base + 0.03, -base - 0.03]) mesh(roundedBox(0.045, 0.03, 0.08, 0.008), m.rubber, { parent: g, at: [x, 0.015, z] });
  }
  for (let i = 1; i <= (V.stool ? 2 : n); i++) {
    const y = V.stool ? i * 0.22 : i * rise - 0.02;
    const z = base * (1 - y / H) + 0.02;
    mesh(roundedBox(w + 0.02, 0.025, 0.09, 0.006), step, { parent: front, at: [0, y, z] });
    if (!V.platform) continue;
  }
  for (let i = 1; i < (V.stool ? 2 : n); i += 2) {
    const y = i * rise;
    mesh(cylX(0.01, w + 0.04, 10), rail, { parent: back, at: [0, y, -base * (1 - y / H) - 0.02] });
  }
  // top cap / tray
  mesh(roundedBox(w + 0.1, 0.06, V.platform ? 0.35 : 0.2, 0.012), T.kids ? m.body2 : T.vintage ? m.wood : m.plastic(T.pro ? '#17181b' : '#d9302a', 0.45), { parent: g, at: [0, H + 0.03, 0] });
  if (V.platform) {
    for (const sx of [-1, 1]) curveTube([[sx * (w / 2 + 0.03), H + 0.06, 0.1], [sx * (w / 2 + 0.03), H + 0.6, 0.08], [sx * (w / 2 + 0.03), H + 0.65, -0.05], [sx * (w / 2 + 0.03), H + 0.06, -0.12]], 0.015, rail, { parent: g, radialSegments: 10, segments: 20 });
    mesh(cylX(0.015, w + 0.06, 10), rail, { parent: g, at: [0, H + 0.62, 0.02] });
  }
  // spreader bars
  for (const sx of [-1, 1]) curveTube([[sx * w / 2 * 1.04, H * 0.45, base * 0.55 + 0.02], [sx * w / 2 * 1.06, H * 0.42, 0], [sx * w / 2 * 1.04, H * 0.45, -base * 0.55 - 0.02]], 0.006, m.steel, { parent: g, radialSegments: 6, segments: 8 });
  if (T.pro) hazard(g, w + 0.08, 0.04, { at: [0, H + 0.03, (V.platform ? 0.175 : 0.1) + 0.0005] });
  void top;
  return anims;
}, {
  lay: false,
  set: (g, { T, m, one, V }) => {
    const anims = one(g, 0);
    if (V.ext) return anims;
    const H = V.stool ? 0.5 : V.n * 0.25 + 0.15;
    const b = group('bucket', { parent: g, at: [0.04, H + 0.06, 0] });
    mesh(tub(0.07, 0.085, 0.16, 0.004, 32, { lip: 0.004 }), m.plastic('#e8e8e4', 0.4), { parent: b });
    mesh(cyl(0.065, 0.065, 0.01, 24), M.plastic('#2a6fd1', 0.3), { parent: b, at: [0, 0.12, 0] });
    curveTube([[-0.085, 0.15, 0], [0, 0.26, 0], [0.085, 0.15, 0]], 0.003, m.steel, { parent: b, radialSegments: 6 });
    void T;
    return anims;
  },
});

/* ================================ sawhorse ================================ */

export const SAWHORSE_VARIANTS = { wooden: {}, 'folding-metal': {}, plastic: {}, trestle: {} };

function horse(par, T, m, variant, at, name) {
  const g = group(name, { parent: par, at });
  const H = variant === 'trestle' ? 0.75 : 0.72, L = variant === 'plastic' ? 0.8 : 0.9;
  const mat = variant === 'wooden' || variant === 'trestle' ? (T.kids ? m.body : T.vintage ? M.wood('#8a6b4a') : m.wood) : variant === 'plastic' ? m.plastic(T.trim ? T.p : '#e8b20f', 0.45) : m.body;
  const beam = variant === 'folding-metal' ? 0.05 : variant === 'plastic' ? 0.09 : 0.09;
  mesh(roundedBox(L, beam, variant === 'plastic' ? 0.11 : 0.045, 0.006), mat, { parent: g, at: [0, H - beam / 2, 0] });
  const spread = 0.24;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const a = [sx * (L / 2 - 0.1), H - beam * 0.6, sz * 0.02], b = [sx * (L / 2 - 0.04), 0.0, sz * spread];
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const len = Math.hypot(dx, dy, dz);
    const leg = mesh(variant === 'folding-metal' ? cyl(0.014, 0.014, len, 10) : roundedBox(variant === 'plastic' ? 0.06 : 0.07, len, 0.035, 0.005), mat, { parent: g, at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] });
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
    if (variant !== 'wooden') mesh(roundedBox(0.06, 0.02, 0.05, 0.006), m.rubber, { parent: g, at: [b[0], 0.01, b[2] - Math.sign(b[2]) * 0.01] });
  }
  for (const sx of [-1, 1]) mesh(roundedBox(0.02, 0.12, spread * 1.1, 0.004), mat, { parent: g, at: [sx * (L / 2 - 0.065), H * 0.3, 0] });
  if (variant === 'trestle') for (const sz of [-1, 1]) mesh(roundedBox(L - 0.2, 0.06, 0.02, 0.004), mat, { parent: g, at: [0, H * 0.35, sz * spread * 0.62] });
  if (T.pro) hazard(g, L * 0.6, beam * 0.6, { at: [0, H - beam / 2, (variant === 'plastic' ? 0.055 : 0.0225) + 0.0005] });
  return g;
}

export const createSawhorse = makeTool('sawhorse', SAWHORSE_VARIANTS, { p: '#c0392b', s: '#1d1e21' }, (g, { T, m, variant }) => {
  if (variant === 'trestle') {
    horse(g, T, m, variant, [0, 0, -0.6], 'horseA');
    horse(g, T, m, variant, [0, 0, 0.6], 'horseB');
    mesh(roundedBox(0.6, 0.035, 1.8, 0.006), T.kids ? m.accent : M.wood('#d9b98a'), { parent: g, at: [0, 0.75 + 0.0175, 0] });
    return [];
  }
  horse(g, T, m, variant, [0, 0, 0], 'horse');
  if (T.heavy) mesh(roundedBox(0.95, 0.02, 0.06, 0.004), m.steel, { parent: g, at: [0, 0.73, 0] });
  return [];
}, {
  lay: false,
  set: (g, { T, m, variant }) => {
    horse(g, T, m, variant === 'trestle' ? 'wooden' : variant, [0, 0, -0.55], 'horseA');
    horse(g, T, m, variant === 'trestle' ? 'wooden' : variant, [0, 0, 0.55], 'horseB');
    const H = 0.72;
    mesh(roundedBox(0.3, 0.045, 1.9, 0.006), M.wood('#d9b98a'), { parent: g, at: [0, H + 0.0225, 0] });
    prop(g, createHammer, { variant: 'claw' }, [0.0, H + 0.045, 0.3], 0.3);
    return [];
  },
});

/* ============================= air compressor ============================= */

export const COMPRESSOR_VARIANTS = { pancake: {}, hotdog: {}, 'twin-stack': {}, upright: {} };

function gauge(par, at, rot, r = 0.022) {
  const gg = group('gauge', { parent: par, at, rot });
  mesh(cylZ(r, 0.014, 20), M.chrome(), { parent: gg });
  const tex = canvasTex(64, 64, (ctx, w, h) => { ctx.fillStyle = '#f4f4f0'; ctx.beginPath(); ctx.arc(32, 32, 30, 0, PI * 2); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 2; for (let k = 0; k < 9; k++) { const a = PI * 0.8 + k * PI * 1.4 / 8; ctx.beginPath(); ctx.moveTo(32 + Math.cos(a) * 22, 32 + Math.sin(a) * 22); ctx.lineTo(32 + Math.cos(a) * 28, 32 + Math.sin(a) * 28); ctx.stroke(); } ctx.strokeStyle = '#d0201a'; ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(48, 18); ctx.stroke(); });
  mesh(new THREE.CircleGeometry(r * 0.85, 20), new THREE.MeshStandardMaterial({ name: 'dial', color: tex ? '#ffffff' : '#f4f4f0', map: tex, roughness: 0.3 }), { parent: gg, at: [0, 0, 0.0072] });
  return gg;
}

export const createAirCompressor = makeTool('air-compressor', COMPRESSOR_VARIANTS, { p: '#d9302a', s: '#1d1e21' }, (g, { T, m, variant }) => {
  const tank = m.body, dark = m.body2;
  const anims = [];
  const hose = (from) => curveTube([from, [from[0] + 0.05, from[1] - 0.05, from[2] + 0.08], [from[0] + 0.15, 0.012, from[2] + 0.2], [from[0] + 0.35, 0.012, from[2] + 0.15], [from[0] + 0.45, 0.012, from[2] + 0.02]], 0.007, M.plastic(T.pro ? '#f5b301' : '#d9b31a', 0.4), { parent: g, segments: 40, radialSegments: 8, name: 'hose' });
  if (variant === 'pancake') {
    mesh(lathe([[0, 0], [0.18, 0], [0.2, 0.03], [0.2, 0.1], [0.18, 0.14], [0, 0.145]], 36), tank, { parent: g, at: [0, 0.03, 0] });
    for (let k = 0; k < 3; k++) { const a = (k / 3) * PI * 2 + 0.5; mesh(cyl(0.02, 0.025, 0.03, 12), m.rubber, { parent: g, at: [Math.cos(a) * 0.14, 0.015, Math.sin(a) * 0.14] }); }
    mesh(roundedBox(0.24, 0.13, 0.22, 0.03), dark, { parent: g, at: [0, 0.23, -0.02] });
    vents(g, m, 0.23);
    curveTube([[-0.12, 0.17, -0.08], [-0.12, 0.36, -0.08], [0.12, 0.36, -0.08], [0.12, 0.17, -0.08]], 0.013, dark, { parent: g, radialSegments: 10, segments: 20 });
    gauge(g, [-0.05, 0.25, 0.09], [0, 0, 0]);
    gauge(g, [0.05, 0.25, 0.09], [0, 0, 0]);
    hose([0.0, 0.2, 0.1]);
  } else if (variant === 'hotdog' || variant === 'twin-stack') {
    const twin = variant === 'twin-stack';
    const L = 0.5;
    const tanks = twin ? [[0.12, 0.09], [0.12, -0.09]] : [[0.12, 0]];
    for (const [y, z] of tanks) mesh(latheX([[0, 0], [0.09, 0.005], [0.12, 0.04], [0.12, L - 0.04], [0.09, L - 0.005], [0, L]], 28), tank, { parent: g, at: [-L / 2, y + 0.02, z] });
    if (twin) {
      for (const sz of [-1, 1]) mesh(cylX(0.06, 0.04, 18), m.rubber, { parent: g, at: [-0.22, 0.06, sz * 0.2] });
      curveTube([[0.2, 0.14, -0.15], [0.32, 0.5, -0.15], [0.32, 0.5, 0.15], [0.2, 0.14, 0.15]], 0.013, m.dark, { parent: g, radialSegments: 10, segments: 24 });
      for (const sz of [-1, 1]) mesh(roundedBox(0.04, 0.03, 0.04, 0.008), m.rubber, { parent: g, at: [0.18, 0.015, sz * 0.12] });
    } else for (const x of [-0.17, 0.17]) for (const sz of [-1, 1]) mesh(roundedBox(0.03, 0.04, 0.04, 0.008), m.rubber, { parent: g, at: [x, 0.02, sz * 0.07] });
    const top = twin ? 0.14 + 0.12 + 0.02 : 0.26;
    if (twin) {
      // the second tank sits beside, both at same height: motor sits on top saddle
      mesh(roundedBox(0.3, 0.03, 0.26, 0.006), m.dark, { parent: g, at: [0, 0.255, 0] });
    }
    const mot = group('motor', { parent: g, at: [0, top, 0] });
    mesh(roundedBox(0.28, 0.15, 0.2, 0.03), dark, { parent: mot, at: [0, 0.075, 0] });
    mesh(cylZ(0.05, 0.03, 20), m.alu, { parent: mot, at: [0.08, 0.14, 0.09] });
    if (!twin) curveTube([[-0.13, 0.14, 0], [-0.13, 0.25, 0], [0.13, 0.25, 0], [0.13, 0.14, 0]], 0.012, m.dark, { parent: mot, radialSegments: 10, segments: 20 });
    gauge(g, [-0.06, top + 0.08, 0.104], [0, 0, 0]);
    gauge(g, [0.0, top + 0.08, 0.104], [0, 0, 0]);
    hose([-0.06, top + 0.03, 0.1]);
    anims.push(clip('run', 0.15, [moveTrack(mot, 0.15, (u) => [0, 0.001 * wave(u), 0])]));
  } else {
    // upright belt-driven
    const H = 1.1;
    mesh(lathe([[0, 0], [0.2, 0], [0.2, 0.06], [0.18, 0.06], [0.18, 0.08], [0, 0.08]], 36), m.dark, { parent: g });
    mesh(lathe([[0, 0], [0.16, 0.02], [0.2, 0.1], [0.2, H - 0.1], [0.16, H - 0.02], [0, H]], 36), tank, { parent: g, at: [0, 0.07, 0] });
    const y = H + 0.07;
    mesh(roundedBox(0.5, 0.02, 0.3, 0.006), m.dark, { parent: g, at: [0, y + 0.01 - 0.03, 0] });
    mesh(roundedBox(0.16, 0.18, 0.16, 0.02), m.dark, { parent: g, at: [-0.1, y + 0.07, 0] });
    for (let k = 0; k < 5; k++) mesh(cyl(0.1, 0.1, 0.008, 4), m.alu, { parent: g, at: [-0.1, y + 0.17 + k * 0.016, 0], rot: [0, PI / 4, 0] });
    mesh(cylX(0.08, 0.18, 24), M.plastic(T.trim ? T.s : '#2d4e7a', 0.4), { parent: g, at: [0.13, y + 0.08, 0] });
    const fly = group('flywheel', { parent: g, at: [-0.1, y + 0.08, 0.1] });
    mesh(cylZ(0.12, 0.02, 32), m.steel, { parent: fly });
    for (let k = 0; k < 4; k++) mesh(roundedBox(0.2, 0.015, 0.01, 0.004), m.steel, { parent: fly, rot: [0, 0, (k * PI) / 4] });
    mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.035, 32, 1, true, 0, PI).rotateX(PI / 2), m.dark, { parent: g, at: [-0.1, y + 0.08, 0.1] }).material = m.dark;
    gauge(g, [0.0, y + 0.2, 0.08], [0, 0, 0]);
    hose([0.12, y + 0.0, 0.1]);
    anims.push(clip('run', 0.3, [spinTrack(fly, 'z', 0.3)]));
  }
  if (T.pro) hazard(g, 0.18, 0.025, { at: [0, variant === 'upright' ? 0.7 : 0.1, variant === 'upright' ? 0.2005 : 0.2005] });
  return anims;
  function vents(gp, mm, yy) { for (let k = 0; k < 6; k++) mesh(roundedBox(0.004, 0.06, 0.004, 0.001), mm.black, { parent: gp, at: [-0.08 + k * 0.032, yy, 0.0905] }); }
}, {
  lay: false,
  set: (g, { T, m, one }) => {
    const anims = one(g, 0);
    const reel = group('reel', { parent: g, at: [0.6, 0, -0.2] });
    mesh(roundedBox(0.3, 0.02, 0.2, 0.004), m.dark, { parent: reel, at: [0, 0.01, 0] });
    for (const sx of [-1, 1]) mesh(cylX(0.14, 0.012, 28), m.body, { parent: reel, at: [sx * 0.08, 0.16, 0] });
    for (const sx of [-1, 1]) mesh(roundedBox(0.012, 0.16, 0.04, 0.003), m.dark, { parent: reel, at: [sx * 0.1, 0.09, 0] });
    mesh(cylX(0.09, 0.15, 24), M.plastic('#d9b31a', 0.4), { parent: reel, at: [0, 0.16, 0] });
    void T;
    return anims;
  },
});

/* ================================= welding ================================= */

export const WELDING_VARIANTS = { 'gas-torch': {}, mig: {}, stick: {}, plasma: {}, blowtorch: {} };

function cylinderBottle(par, m, r, h, color, at, name = 'bottle') {
  const b = group(name, { parent: par, at });
  mesh(lathe([[0, 0], [r * 0.9, 0], [r, r * 0.3], [r, h - r * 0.9], [r * 0.6, h - r * 0.2], [r * 0.25, h], [0, h]], 28), M.paint(color, { metallic: 0.2, roughness: 0.4 }), { parent: b });
  mesh(cyl(r * 0.22, r * 0.22, r * 0.5, 12), M.metal('#c9a14a', 0.3), { parent: b, at: [0, h + r * 0.2, 0] });
  const reg = group('reg', { parent: b, at: [0, h + r * 0.45, 0] });
  mesh(cylX(r * 0.25, r * 0.6, 14), M.metal('#c9a14a', 0.3), { parent: reg });
  gauge(reg, [r * 0.3, r * 0.15, r * 0.12], [0, 0.4, 0], 0.02);
  return b;
}

function torchFlame(par, at, dir) {
  const lg = lampGroup('flame', 'blue');
  const geo = new THREE.ConeGeometry(0.008, 0.06, 12).rotateZ(dir);
  const lens = lg.add(par, { geometry: geo.translate(at[0], at[1], at[2]), glowSize: 0.08 });
  return lens;
}

export const createWelding = makeTool('welding', WELDING_VARIANTS, { p: '#1f5fa8', s: '#1d1e21' }, (g, { T, m, variant }) => {
  const anims = [];
  const lead = (pts, col = '#1d1e20') => curveTube(pts, 0.008, M.plastic(col, 0.6), { parent: g, segments: 40, radialSegments: 8, name: 'lead' });
  if (variant === 'blowtorch') {
    mesh(lathe([[0, 0], [0.055, 0], [0.058, 0.01], [0.058, 0.22], [0.04, 0.27], [0.012, 0.29], [0, 0.29]], 28), m.paint(T.trim ? T.p : '#2a6fd1'), { parent: g });
    mesh(cyl(0.02, 0.025, 0.04, 16), m.brass, { parent: g, at: [0, 0.31, 0] });
    mesh(cylX(0.012, 0.03, 12).rotateZ(PI / 2), m.black, { parent: g, at: [0.02, 0.31, 0] }).rotation.set(0, 0, PI / 2);
    curveTube([[0, 0.32, 0], [0.04, 0.38, 0], [0.12, 0.4, 0]], 0.008, m.brass, { parent: g, radialSegments: 10 });
    mesh(cylX(0.014, 0.05, 14), m.steel, { parent: g, at: [0.14, 0.4, 0] });
    torchFlame(g, [0.195, 0.4, 0], -PI / 2);
    anims.push(clip('flame', 0.5, [new THREE.NumberKeyframeTrack('flame.material.emissiveIntensity', [0, 0.1, 0.25, 0.4, 0.5], [3, 2.2, 3.4, 2.6, 3]), ...lampTracks('flame', 3).slice(1)]));
    return anims;
  }
  if (variant === 'gas-torch') {
    // two bottles on a hand truck, hoses to a torch hanging from a hook
    const cart = T.trim ? m.body : m.paint('#2b2e33');
    mesh(roundedBox(0.5, 0.03, 0.3, 0.006), cart, { parent: g, at: [0, 0.1, 0] });
    for (const sx of [-1, 1]) mesh(cylX(0.1, 0.05, 20), m.rubber, { parent: g, at: [sx * 0.3, 0.1, -0.12] });
    mesh(cylX(0.015, 0.68, 10), m.steel, { parent: g, at: [0, 0.1, -0.12] });
    for (const sx of [-1, 1]) curveTube([[sx * 0.24, 0.12, -0.14], [sx * 0.24, 1.25, -0.16], [sx * 0.2, 1.35, -0.2]], 0.014, cart, { parent: g, radialSegments: 10, segments: 12 });
    mesh(cylX(0.012, 0.5, 10), cart, { parent: g, at: [0, 1.0, -0.16] });
    mesh(cylX(0.012, 0.5, 10), cart, { parent: g, at: [0, 0.5, -0.16] });
    mesh(roundedBox(0.1, 0.03, 0.2, 0.008), m.rubber, { parent: g, at: [0, 0.015, 0.1] });
    cylinderBottle(g, m, 0.11, 1.0, '#2a7a3a', [-0.12, 0.115, 0], 'oxy');
    cylinderBottle(g, m, 0.12, 0.85, '#8c1e1a', [0.13, 0.115, 0], 'acet');
    lead([[-0.12, 1.25, 0.06], [-0.05, 1.0, 0.18], [0.0, 0.5, 0.2], [0.25, 0.2, 0.22], [0.4, 0.012, 0.3]], '#2a7a3a');
    lead([[0.13, 1.08, 0.06], [0.2, 0.8, 0.18], [0.28, 0.4, 0.22], [0.38, 0.1, 0.26], [0.42, 0.012, 0.3]], '#b8261e');
    const torch = group('torch', { parent: g, at: [0.45, 0.02, 0.3] });
    mesh(cylX(0.012, 0.2, 14), m.brass, { parent: torch, at: [0.1, 0, 0] });
    curveTube([[0.2, 0, 0], [0.26, 0.01, 0], [0.3, 0.04, 0]], 0.005, m.brass, { parent: torch, radialSegments: 8 });
    for (const sx of [-1, 1]) mesh(cylZ(0.008, 0.03, 10), M.metal(sx > 0 ? '#2a7a3a' : '#b8261e', 0.3), { parent: torch, at: [0.04, 0, sx * 0.015] });
    torchFlame(torch, [0.33, 0.06, 0], -PI / 3);
    anims.push(clip('flame', 0.5, [new THREE.NumberKeyframeTrack('flame.material.emissiveIntensity', [0, 0.1, 0.25, 0.4, 0.5], [3, 2.2, 3.4, 2.6, 3]), ...lampTracks('flame', 3).slice(1)]));
    return anims;
  }
  // inverter / MIG / plasma machines
  const big = variant === 'mig' ? 1.4 : 1;
  const W = 0.24 * big, H = 0.3 * big, D = 0.45 * big;
  const body = m.body;
  mesh(roundedBox(W, H, D, 0.015), body, { parent: g, at: [0, H / 2 + 0.02, 0] });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.04, 0.02, 0.04, 0.006), m.rubber, { parent: g, at: [sx * (W / 2 - 0.03), 0.01, sz * (D / 2 - 0.04)] });
  mesh(roundedBox(W - 0.02, 0.06, D - 0.04, 0.01), m.body2, { parent: g, at: [0, 0.02 + H - 0.02, 0] });
  curveTube([[0, H + 0.04, -D * 0.3], [0, H + 0.1, -D * 0.25], [0, H + 0.1, D * 0.25], [0, H + 0.04, D * 0.3]], 0.012, m.body2, { parent: g, radialSegments: 10, segments: 16 });
  const panel = group('panel', { parent: g, at: [0, H * 0.6, D / 2] });
  mesh(roundedBox(W * 0.8, H * 0.5, 0.006, 0.004), m.black, { parent: panel });
  for (const sx of [-1, 1]) mesh(cylZ(0.016, 0.02, 16), m.plastic('#e8e8e4', 0.4), { parent: panel, at: [sx * W * 0.2, -H * 0.05, 0.01] });
  const disp = mesh(roundedBox(W * 0.3, 0.03, 0.004, 0.002), M.emissive('#ff5a1a', 0.6), { parent: panel, at: [0, H * 0.13, 0.004], name: 'display' });
  void disp;
  for (const sx of [-1, 1]) mesh(cylZ(0.012, 0.03, 12), sx > 0 ? M.plastic('#c0201a') : m.black, { parent: g, at: [sx * W * 0.25, 0.08, D / 2 + 0.01] });
  lead([[W * 0.25, 0.08, D / 2 + 0.02], [W * 0.3, 0.03, D / 2 + 0.15], [W * 0.1, 0.008, D / 2 + 0.3], [-0.15, 0.008, D / 2 + 0.35]]);
  lead([[-W * 0.25, 0.08, D / 2 + 0.02], [-W * 0.4, 0.008, D / 2 + 0.12], [-W * 0.7, 0.008, D / 2 + 0.05]]);
  mesh(roundedBox(0.06, 0.02, 0.03, 0.006), M.metal('#c9a14a', 0.3), { parent: g, at: [-W * 0.7 - 0.03, 0.01, D / 2 + 0.05] });
  const h = group('holder', { parent: g, at: [-0.15, 0.016, D / 2 + 0.35] });
  mesh(cylX(0.016, 0.12, 14), m.black, { parent: h, at: [-0.06, 0, 0] });
  if (variant === 'mig' || variant === 'plasma') {
    mesh(cylX(0.012, 0.05, 12), m.chrome, { parent: h, at: [-0.14, 0, 0] });
    mesh(cylX(0.006, 0.02, 10), m.brass, { parent: h, at: [-0.17, 0, 0] });
  } else mesh(cylX(0.003, 0.25, 8), M.matte('#7a6a58', 0.8), { parent: h, at: [-0.24, 0, 0] });
  if (variant === 'mig') cylinderBottle(g, m, 0.08, 0.7, '#4a5a6a', [0, 0, -D / 2 - 0.1], 'gas');
  if (T.pro) hazard(g, W * 0.8, 0.03, { at: [0, 0.06, D / 2 + 0.0005] });
  anims.push(clip('on', 1, [new THREE.NumberKeyframeTrack('display.material.emissiveIntensity', [0, 1], [2, 2])]));
  return anims;
}, {
  lay: false,
  set: (g, { T, m, one }) => {
    const anims = one(g, 0);
    const hm = group('helmet', { parent: g, at: [0.45, 0, 0.2] });
    mesh(new THREE.SphereGeometry(0.13, 20, 14, 0, PI * 2, 0, PI / 2).scale(1, 1.3, 1.1), m.plastic(T.pro ? '#f5b301' : '#1d1e21', 0.4), { parent: hm, rot: [-PI / 2, 0, 0], at: [0, 0.143, 0] }).material.side = THREE.DoubleSide;
    mesh(roundedBox(0.11, 0.004, 0.06, 0.002), M.glass({ tint: '#1a3a1a', opacity: 0.85 }), { parent: hm, at: [0, 0.143, -0.168], rot: [PI / 2, 0, 0] });
    for (const sx of [-1, 1]) mesh(roundedBox(0.09, 0.06, 0.18, 0.02), M.matte('#7a4a28', 0.8), { parent: g, at: [0.45 + sx * 0.1, 0.03, -0.25] });
    return anims;
  },
});
