import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, lathe, tube, curveTube } from '../../core/utils.js';
import { rotateTrack, moveTrack, clip, pingPong } from '../../core/animation.js';
import { emblem } from '../street/common.js';
import { defineType, blooms, pad, post, beam, railing, inst, lampSet, lampOn, mat, textTex, panel, mapTexture, canvasTex } from './kit.js';
import { gableRoof, polyRoof, parkBench } from './structures.js';

/* Park buildings & signage: restrooms, ranger stations, information boards, park signs, drinking fountains. */

/** Wall material for small park buildings by style. */
function wallMat(ctx) {
  return { classic: mat.paint('#e8e1d0'), victorian: mat.brick('#9a4a34'), modern: mat.concrete('#c9c5bd'), rustic: M.wood('#7a5634'), japanese: mat.paint('#ece4d0') }[ctx.style];
}

/** Door slab with a pictogram sign, hinged at one edge so it can swing. */
function door(parent, ctx, name, x, z, { w = 0.9, h = 2.05, label, rotY = 0 } = {}) {
  const hinge = group(name, { parent, at: [x - w / 2, 0.02, z], rot: [0, rotY, 0] });
  const dm = ctx.style === 'modern' ? mat.steel('#4a5056') : ctx.style === 'victorian' ? mat.paint('#1e3a2e') : ctx.style === 'japanese' ? M.wood('#3b2a22') : M.wood('#5b3a24');
  mesh(roundedBox(w, h, 0.05, 0.012), dm, { parent: hinge, at: [w / 2, h / 2, 0.025] });
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8).rotateZ(Math.PI / 2), M.chrome(), { parent: hinge, at: [w - 0.12, 1.0, 0.07] });
  if (label) panel(hinge, 0.22, 0.22, textTex([label], { w: 128, h: 128, bg: '#1e5aa8', fg: '#ffffff', font: 'bold 70px Helvetica, Arial, sans-serif' }), { at: [w / 2, 1.55, 0.051], color: '#1e5aa8' });
  return hinge;
}

/* ------------------------------- Restroom ------------------------------- */

export const RESTROOM_VARIANTS = { kiosk: { style: 'modern' }, block: {}, cabin: { style: 'rustic' }, pod: { style: 'modern' } };
export const createRestroom = defineType('restroom', RESTROOM_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const W = (variant === 'pod' ? 2.2 : variant === 'block' ? 5 : 3.6) * k;
  const D = variant === 'pod' ? 2.2 : 2.6;
  const H = 2.7;
  pad(root, W + 1.2, D + 1.6, ctx.m.concrete, { h: 0.1, r: 0.1, name: 'slab' });
  const wm = wallMat(ctx);
  if (variant === 'pod') {
    // rounded freestanding automatic toilet pod
    mesh(roundedBox(W, H, D, 0.5, 6), wm, { parent: root, at: [0, 0.1 + H / 2, 0], name: 'body' });
    mesh(roundedBox(W + 0.1, 0.12, D + 0.1, 0.05), mat.steel('#3a3f44'), { parent: root, at: [0, 0.1 + H + 0.06, 0] });
    const d = group('door', { parent: root, at: [0, 0.12, D / 2] });
    mesh(roundedBox(0.95, 2.0, 0.04, 0.02), mat.steel('#7d8a94'), { parent: d, at: [0, 1.0, 0.02] });
    const lamps = lampSet('status', 'green');
    lamps.add(root, { at: [0.75, 2.2, D / 2 + 0.005], normal: [0, 0, 1], w: 0.12, h: 0.06 });
    panel(root, 0.4, 0.4, textTex(['WC'], { w: 128, h: 128, bg: '#1e5aa8', fg: '#fff', font: 'bold 70px Helvetica, Arial, sans-serif' }), { at: [-0.75, 2.1, D / 2 + 0.005], color: '#1e5aa8' });
    emblem(root, 0.18, [0.75, 1.7, D / 2 + 0.002]);
    return [lampOn('status', 2.4), clip('open', 4, [moveTrack(d, 4, (t) => [Math.min(1, pingPong(t) * 1.5) * 0.95, 0, 0.03])])];
  }
  mesh(roundedBox(W, H, D, 0.04), wm, { parent: root, at: [0, 0.1 + H / 2, 0], name: 'walls' });
  if (ctx.style === 'rustic') {
    const logs = [];
    const side = [];
    for (let y = 0.25; y < H; y += 0.26) {
      logs.push({ at: [0, 0.1 + y, -D / 2] });
      for (const x of [W / 2, -W / 2]) side.push({ at: [x, 0.1 + y, 0] });
    }
    inst(root, new THREE.CylinderGeometry(0.12, 0.12, W + 0.3, 10).rotateZ(Math.PI / 2), ctx.m.bark, logs, 'logs');
    inst(root, new THREE.CylinderGeometry(0.12, 0.12, D + 0.3, 10).rotateX(Math.PI / 2), ctx.m.bark, side, 'logs-side');
  }
  if (ctx.style === 'victorian' || ctx.style === 'classic') mesh(roundedBox(W + 0.08, 0.3, D + 0.08, 0.03), ctx.m.stone, { parent: root, at: [0, 0.25, 0] });
  // roof
  if (ctx.style === 'modern') {
    mesh(roundedBox(W + 0.9, 0.2, D + 1.0, 0.03), mat.concrete('#a9a59d'), { parent: root, at: [0, 0.1 + H + 0.1, 0.2], rot: [0.05, 0, 0], name: 'roof' });
    const sl = [];
    for (let i = 0; i < Math.round(W / 0.12); i++) sl.push({ at: [-W / 2 + 0.06 + i * 0.12, 0.1 + H - 0.4, D / 2 + 0.03] });
    inst(root, roundedBox(0.06, 0.7, 0.05, 0.01, 1), M.wood('#c1844e'), sl, 'louvres');
  } else gableRoof(root, ctx, W, D, 0.1 + H, { slope: ctx.style === 'rustic' ? 0.7 : 0.55, over: 0.4 });
  const anims = [];
  const nd = variant === 'block' ? 3 : 2;
  const labels = ['♀', '♂', '♿'];
  for (let i = 0; i < nd; i++) {
    const x = -W / 2 + ((i + 0.5) / nd) * W;
    const d = door(root, ctx, `door_${i}`, x + 0.45, D / 2, { label: labels[i] });
    if (i === 0) anims.push(clip('open', 4, [rotateTrack(d, 'y', 4, (t) => -pingPong(t) * 1.4)]));
  }
  const lamps = lampSet('lights', 'fog');
  mesh(roundedBox(0.4, 0.12, 0.14, 0.03), ctx.m.metal, { parent: root, at: [0, 0.1 + H - 0.25, D / 2 + 0.07] });
  lamps.add(root, { at: [0, 0.1 + H - 0.311, D / 2 + 0.07], normal: [0, -1, 0], w: 0.32, h: 0.08, shape: 'strip', bezel: false });
  panel(root, 1.0, 0.3, textTex(['TOILETS'], { w: 512, h: 150, bg: '#2f4a3a', fg: '#fff', font: 'bold 90px Helvetica, Arial, sans-serif' }), { at: [0, 0.1 + H - 0.55, D / 2 + 0.003], color: '#2f4a3a' });
  // hand basin on the side wall
  mesh(roundedBox(0.5, 0.18, 0.4, 0.06), M.plastic('#e8e8e8', 0.2), { parent: root, at: [W / 2 + 0.2, 0.95, 0] });
  return [lampOn('lights', 3), ...anims];
});

/* ---------------------------- Ranger station ---------------------------- */

export const RANGER_STATION_VARIANTS = { cabin: { style: 'rustic' }, tower: { style: 'rustic' }, booth: {} };
export const createRangerStation = defineType('ranger-station', RANGER_STATION_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const wm = wallMat(ctx);
  const win = M.glass({ tint: '#2a3a44' });
  const lamps = lampSet('lights', 'fog');
  const sign = (y, z, w = 1.6) => panel(root, w, 0.4, textTex(['RANGER STATION'], { w: 768, h: 192, bg: '#5b3a24', fg: '#f2d890', font: 'bold 84px Georgia, serif' }), { at: [0, y, z], color: '#5b3a24' });
  if (variant === 'tower') {
    const H = 5.5;
    const S = 3 * k;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tube([sx * S / 2 * 1.2, 0, sz * S / 2 * 1.2], [sx * S / 2, H, sz * S / 2], 0.12, ctx.style === 'modern' ? mat.steel() : ctx.m.bark, { parent: root, radialSegments: 10 });
    for (const y of [1.8, 3.6]) for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
      const f = 1.2 - (y / H) * 0.2;
      tube([a[0] * S / 2 * f, y, a[1] * S / 2 * f], [b[0] * S / 2 * f, y, b[1] * S / 2 * f], 0.07, ctx.m.bark, { parent: root, radialSegments: 8 });
    }
    mesh(roundedBox(S + 0.6, 0.16, S + 0.6, 0.03), ctx.m.wood, { parent: root, at: [0, H + 0.08, 0], name: 'deck' });
    mesh(roundedBox(S - 0.2, 2.2, S - 0.2, 0.04), wm, { parent: root, at: [0, H + 0.16 + 1.1, 0], name: 'cab' });
    for (const [x, z, ry] of [[0, (S - 0.2) / 2, 0], [0, -(S - 0.2) / 2, Math.PI], [(S - 0.2) / 2, 0, Math.PI / 2], [-(S - 0.2) / 2, 0, -Math.PI / 2]]) mesh(roundedBox(S - 0.8, 0.9, 0.04, 0.01), win, { parent: root, at: [x, H + 1.6, z], rot: [0, ry, 0] });
    polyRoof(root, ctx, 4, (S + 0.4) / Math.SQRT1_2 / 1.25, H + 2.36, 1.1);
    for (const [a, b] of [[[-1, 1], [1, 1]], [[1, 1], [1, -1]], [[1, -1], [-1, -1]]]) railing(root, ctx, [a[0] * (S / 2 + 0.25), H + 0.16, a[1] * (S / 2 + 0.25)], [b[0] * (S / 2 + 0.25), H + 0.16, b[1] * (S / 2 + 0.25)], { h: 0.9 });
    // stairs: straight flight down the front
    const steps = [];
    const n = 18;
    for (let i = 0; i < n; i++) steps.push({ at: [-S / 2 - 0.25 + 0.45, H - (i + 1) * (H / n) + 0.02, S / 2 + 0.25 + (i + 0.5) * 0.3] });
    const sl = Math.hypot(n * 0.3, H);
    for (const x of [-S / 2 - 0.25 + 0.05, -S / 2 - 0.25 + 0.85]) {
      const m = mesh(roundedBox(0.06, 0.2, sl, 0.01), ctx.m.wood, { parent: root, at: [x, H / 2, S / 2 + 0.25 + (n * 0.3) / 2] });
      m.rotation.x = Math.atan2(H, n * 0.3);
    }
    inst(root, roundedBox(0.8, 0.04, 0.28, 0.01, 1), ctx.m.wood, steps, 'treads');
    lamps.add(root, { at: [0, H + 2.0, (S - 0.2) / 2 + 0.01], normal: [0, 0, 1], w: 0.14, h: 0.14, shape: 'round' });
    return [lampOn('lights', 3)];
  }
  if (variant === 'booth') {
    const W = 2.2 * k;
    pad(root, W + 4, 3, ctx.m.concrete, { h: 0.12, r: 0.1 });
    mesh(roundedBox(W, 1.0, 1.8, 0.04), wm, { parent: root, at: [0, 0.62, 0] });
    mesh(roundedBox(W, 1.3, 1.8, 0.04), win, { parent: root, at: [0, 1.77, 0] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.1, 1.3, 0.1, 0.01), ctx.m.frame, { parent: root, at: [sx * (W / 2 - 0.05), 1.77, sz * 0.85] });
    mesh(roundedBox(W + 0.8, 0.18, 2.6, 0.04), ctx.m.roof, { parent: root, at: [0, 2.51, 0], name: 'roof' });
    mesh(roundedBox(W + 0.4, 0.06, 0.35, 0.02), ctx.m.wood, { parent: root, at: [0, 1.15, 1.05] });
    sign(2.32, 1.31, 1.9);
    // boom barrier
    mesh(roundedBox(0.3, 1.0, 0.3, 0.03), mat.steel('#e8e8e8'), { parent: root, at: [W / 2 + 0.5, 0.62, 1.2] });
    const arm = group('boom', { parent: root, at: [W / 2 + 0.5, 1.0, 1.36] });
    mesh(roundedBox(3.2, 0.08, 0.06, 0.03), mat.paint('#d23a2a'), { parent: arm, at: [1.6, 0, 0.03] });
    const stripes = [];
    for (let i = 0; i < 5; i++) stripes.push({ at: [0.4 + i * 0.6, 0, 0.061] });
    inst(arm, new THREE.PlaneGeometry(0.28, 0.08), mat.paint('#f4f1ea'), stripes, 'boom-stripes');
    lamps.add(root, { at: [0, 2.4, 1.31], normal: [0, -1, 0], w: 0.4, h: 0.08, shape: 'strip', bezel: false });
    return [lampOn('lights', 3), clip('open', 4, [rotateTrack(arm, 'z', 4, (t) => Math.min(1, pingPong(t) * 1.6) * 1.4)])];
  }
  // cabin with porch
  const W = 5 * k;
  const D = 4;
  const H = 2.6;
  mesh(roundedBox(W + 0.4, 0.5, D + 2, 0.04), ctx.m.stone, { parent: root, at: [0, 0.25, 0.6], name: 'foundation' });
  mesh(roundedBox(W + 0.3, 0.06, D + 1.9, 0.02), ctx.m.wood, { parent: root, at: [0, 0.53, 0.6] });
  mesh(roundedBox(W, H, D, 0.04), wm, { parent: root, at: [0, 0.56 + H / 2, -0.4], name: 'walls' });
  if (ctx.style === 'rustic') {
    const logs = [];
    for (let y = 0.15; y < H; y += 0.26) logs.push({ at: [0, 0.56 + y, -D / 2 - 0.4] });
    inst(root, new THREE.CylinderGeometry(0.13, 0.13, W + 0.3, 10).rotateZ(Math.PI / 2), ctx.m.bark, logs, 'logs');
  }
  for (const x of [-W / 2 + 0.2, W / 2 - 0.2]) post(root, ctx, x, D / 2 + 1.4, 0.56, 0.56 + H, { w: 0.18, footing: false });
  beam(root, ctx, [-W / 2, 0.56 + H, D / 2 + 1.4], [W / 2, 0.56 + H, D / 2 + 1.4], { h: 0.2 });
  gableRoof(root, ctx, W, D + 2.4, 0.56 + H, { slope: 0.6, over: 0.35 });
  for (const x of [-W / 3, W / 3]) mesh(roundedBox(1.0, 0.9, 0.06, 0.02), win, { parent: root, at: [x, 1.9, D / 2 - 0.37] });
  door(root, ctx, 'door', 0.45, D / 2 - 0.4, {});
  for (let i = 0; i < 3; i++) mesh(roundedBox(1.4, 0.17 * (i + 1), 0.3, 0.02), ctx.m.stone, { parent: root, at: [0, 0.085 * (i + 1), D / 2 + 1.55 + (2 - i) * 0.3] });
  sign(0.56 + H - 0.2, D / 2 + 1.52, 2.0);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.5, 8), M.metal('#c5c9cc'), { parent: root, at: [W / 2 + 1.2, 2.25, D / 2 + 1] });
  const flag = group('flag', { parent: root, at: [W / 2 + 1.2, 4.1, D / 2 + 1] });
  mesh(new THREE.PlaneGeometry(0.9, 0.55).translate(0.45, 0, 0), new THREE.MeshStandardMaterial({ color: '#2f6a4a', side: THREE.DoubleSide, roughness: 0.8, name: 'flag' }), { parent: flag });
  lamps.add(root, { at: [0.9, 2.3, D / 2 - 0.395], normal: [0, 0, 1], w: 0.12, h: 0.16 });
  return [lampOn('lights', 3), clip('wave', 2, [rotateTrack(flag, 'y', 2, (t) => Math.sin(t * Math.PI * 2) * 0.25)])];
});

/* ------------------------------ Info board ------------------------------ */

export const INFO_BOARD_VARIANTS = { 'map-board': {}, roofed: { style: 'rustic' }, totem: { style: 'modern' }, lectern: {} };
export const createInfoBoard = defineType('info-board', INFO_BOARD_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const tex = mapTexture(variant.length + ctx.style.length, ctx.style === 'japanese' ? 'GARDEN MAP' : 'PARK MAP');
  const fm = ctx.style === 'modern' ? mat.steel('#3a3f44') : ctx.style === 'victorian' ? ctx.m.metal : ctx.style === 'rustic' ? ctx.m.bark : ctx.style === 'japanese' ? M.wood('#3b2a22') : M.wood('#6b4a2e');
  const lamps = lampSet('lights', 'fog');
  if (variant === 'totem') {
    const H = 2.4 * Math.sqrt(k);
    mesh(roundedBox(0.7, H, 0.22, 0.05), fm, { parent: root, at: [0, H / 2, 0], name: 'totem' });
    panel(root, 0.6, 0.45, tex, { at: [0, H * 0.62, 0.111] });
    panel(root, 0.6, 0.18, textTex(['WELCOME'], { w: 512, h: 150, bg: '#c1844e', fg: '#fff', font: 'bold 80px Helvetica, Arial, sans-serif' }), { at: [0, H - 0.2, 0.111], color: '#c1844e' });
    emblem(root, 0.12, [0, H * 0.3, 0.11]);
    lamps.add(root, { at: [0, H * 0.45, 0.111], normal: [0, 0, 1], w: 0.5, h: 0.03, shape: 'strip', bezel: false });
    return [lampOn('lights', 2)];
  }
  if (variant === 'lectern') {
    mesh(roundedBox(0.16, 0.9, 0.16, 0.02), fm, { parent: root, at: [0, 0.45, 0] });
    mesh(roundedBox(0.5, 0.06, 0.3, 0.02), fm, { parent: root, at: [0, 0.03, 0] });
    const top = group('top', { parent: root, at: [0, 0.95, 0], rot: [-0.6, 0, 0] });
    mesh(roundedBox(0.8, 0.6, 0.06, 0.02), fm, { parent: top });
    panel(top, 0.72, 0.52, tex, { at: [0, 0, 0.031] });
    mesh(roundedBox(0.3, 0.12, 0.2, 0.02), fm, { parent: root, at: [0, 0.94, -0.05] });
    return [];
  }
  const W = 1.8 * k;
  const H = 1.2;
  for (const x of [-W / 2 - 0.08, W / 2 + 0.08]) post(root, ctx, x, 0, 0, variant === 'roofed' ? 2.5 : 2.0, { w: 0.14, material: fm });
  mesh(roundedBox(W + 0.1, H + 0.1, 0.08, 0.02), fm, { parent: root, at: [0, 1.25, 0], name: 'board' });
  panel(root, W, H * 0.75, tex, { at: [0, 1.17, 0.041] });
  panel(root, W, H * 0.2, textTex(['WELCOME TO THE PARK'], { w: 1024, h: 128, bg: '#2f4a3a', fg: '#f2ead2', font: 'bold 70px Georgia, serif' }), { at: [0, 1.7, 0.041], color: '#2f4a3a' });
  if (variant === 'roofed') {
    gableRoof(root, ctx, W + 0.3, 0.5, 2.5, { slope: 0.9, over: 0.25, t: 0.06 });
    beam(root, ctx, [-W / 2 - 0.08, 2.32, 0], [W / 2 + 0.08, 2.32, 0], { h: 0.12, w: 0.1, material: fm });
    lamps.add(root, { at: [0, 2.259, 0], normal: [0, -1, 0], w: 0.3, h: 0.05, shape: 'strip', bezel: false });
    return [lampOn('lights', 3)];
  }
  // leaflet box
  mesh(roundedBox(0.3, 0.35, 0.12, 0.02), M.plastic('#d8d4c8', 0.4), { parent: root, at: [W / 2 + 0.08, 0.9, 0.1] });
  return [];
});

/* ------------------------------- Park sign ------------------------------- */

export const PARK_SIGN_VARIANTS = { entrance: {}, routed: { style: 'rustic' }, fingerpost: {}, rules: {} };
export const createParkSign = defineType('park-sign', PARK_SIGN_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const bg = { classic: '#2f4a3a', victorian: '#1e3a2e', modern: '#30353a', rustic: '#6b4a2e', japanese: '#3b2a22' }[ctx.style];
  const font = ctx.style === 'modern' ? 'bold 96px Helvetica, Arial, sans-serif' : 'bold 96px Georgia, serif';
  const fm = ctx.style === 'modern' ? mat.steel('#3a3f44') : ctx.style === 'victorian' ? ctx.m.metal : ctx.style === 'rustic' ? ctx.m.bark : M.wood('#5b3a24');
  if (variant === 'entrance') {
    const W = 3.6 * k;
    const base = ctx.style === 'modern' ? ctx.m.concrete : ctx.style === 'classic' ? mat.brick() : ctx.m.stone;
    mesh(roundedBox(W, 0.9, 0.7, 0.05), base, { parent: root, at: [0, 0.45, 0], name: 'base' });
    mesh(roundedBox(W + 0.1, 0.1, 0.8, 0.03), ctx.m.stone, { parent: root, at: [0, 0.95, 0] });
    mesh(roundedBox(W * 0.85, 0.7, 0.12, 0.03), fm, { parent: root, at: [0, 1.35, 0] });
    const t = textTex(['MEADOW PARK'], { w: 1024, h: 200, bg, fg: '#f2ead2', font });
    for (const s of [1, -1]) panel(root, W * 0.8, 0.58, t, { at: [0, 1.35, s * 0.061], rotY: s > 0 ? 0 : Math.PI, color: bg });
    // flower trough in front
    mesh(roundedBox(W, 0.3, 0.4, 0.04), base, { parent: root, at: [0, 0.15, 0.6] });
    const fl = [];
    for (let i = 0; i < 30; i++) fl.push([(ctx.r() - 0.5) * (W - 0.2), 0.34, 0.6 + (ctx.r() - 0.5) * 0.25]);
    if (!ctx.winter) blooms(root, ctx, fl, { size: 0.05 });
    mesh(roundedBox(W - 0.08, 0.02, 0.32, 0.01), ctx.m.mulch, { parent: root, at: [0, 0.3, 0.6] });
    const lamps = lampSet('lights', 'white');
    for (const x of [-W / 3, W / 3]) {
      mesh(roundedBox(0.16, 0.08, 0.1, 0.02), mat.steel(), { parent: root, at: [x, 0.04, 0.95] });
      lamps.add(root, { at: [x, 0.081, 0.95], normal: [0, 0.7, -0.7], w: 0.1, h: 0.06 });
    }
    return [lampOn('lights', 3)];
  }
  if (variant === 'routed') {
    for (const x of [-0.75 * k, 0.75 * k]) post(root, ctx, x, 0, 0, 1.6, { w: 0.14, material: fm, footing: false });
    mesh(roundedBox(1.7 * k, 0.45, 0.07, 0.03), M.wood('#8a6440'), { parent: root, at: [0, 1.25, 0] });
    panel(root, 1.6 * k, 0.38, textTex(['NATURE TRAIL'], { w: 768, h: 192, bg: '#8a6440', fg: '#f2e2b0', font: 'bold 74px Georgia, serif' }), { at: [0, 1.25, 0.036], color: '#8a6440' });
    return [];
  }
  if (variant === 'fingerpost') {
    const H = 2.6;
    if (ctx.style === 'modern') mesh(roundedBox(0.1, H, 0.1, 0.01), fm, { parent: root, at: [0, H / 2, 0] });
    else mesh(lathe([[0.001, 0], [0.09, 0], [0.07, 0.1], [0.055, 0.2], [0.05, H], [0.07, H + 0.04], [0.001, H + 0.12]], 16), fm, { parent: root, name: 'post' });
    const names = [['POND', 0.4], ['CAFÉ', -0.9], ['PLAYGROUND', 2.0], ['EXIT', -2.5]];
    names.forEach(([n, a], i) => {
      const arm = group(`arm_${i}`, { parent: root, at: [0, H - 0.2 - i * 0.26, 0], rot: [0, a, 0] });
      mesh(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0, -0.09), new THREE.Vector2(0.82, -0.09), new THREE.Vector2(0.95, 0), new THREE.Vector2(0.82, 0.09), new THREE.Vector2(0, 0.09)]), { depth: 0.04, bevelEnabled: false }).translate(0.03, 0, -0.02), mat.paint(ctx.style === 'rustic' ? '#8a6440' : '#e9e3d3'), { parent: arm });
      const armTex = textTex([n], { w: 512, h: 100, bg: ctx.style === 'rustic' ? '#8a6440' : '#e9e3d3', fg: '#1e3a2e', font: 'bold 64px Georgia, serif' });
      // lettering on BOTH faces of the arm (the back was blank white)
      panel(arm, 0.72, 0.15, armTex, { at: [0.45, 0, 0.021] });
      const back = panel(arm, 0.72, 0.15, armTex, { at: [0.45, 0, -0.021] });
      if (back?.rotation) back.rotation.y = Math.PI;
    });
    return [];
  }
  // rules board on one post
  post(root, ctx, 0, 0, 0, 1.4, { w: 0.1, material: fm, footing: false });
  mesh(roundedBox(0.7, 0.9, 0.04, 0.02), fm, { parent: root, at: [0, 1.75, 0] });
  const t = canvasTex(`rules-${bg}`, 256, 330, (g, w, h) => {
    g.fillStyle = '#f4f1ea';
    g.fillRect(0, 0, w, h);
    g.fillStyle = bg;
    g.fillRect(0, 0, w, 60);
    g.fillStyle = '#fff';
    g.font = 'bold 34px Georgia, serif';
    g.textAlign = 'center';
    g.fillText('PARK RULES', w / 2, 42);
    g.fillStyle = '#222';
    g.font = '20px Helvetica, Arial, sans-serif';
    ['Dogs on leads', 'No cycling on paths', 'Take litter home', 'No open fires', 'Gates close at dusk', 'Enjoy the park!'].forEach((s, i) => g.fillText(s, w / 2, 100 + i * 38));
  });
  panel(root, 0.64, 0.84, t, { at: [0, 1.75, 0.021] });
  return [];
});

/* ---------------------------- Drinking fountain ---------------------------- */

export const WATER_POINT_VARIANTS = { column: { style: 'victorian' }, 'bottle-station': { style: 'modern' }, 'hand-pump': { style: 'rustic' }, 'bubbler-pair': {} };
export const createWaterPoint = defineType('water-point', WATER_POINT_VARIANTS, (root, ctx, v, variant) => {
  const fm = ctx.style === 'modern' ? mat.steel('#3a3f44') : ctx.style === 'victorian' ? ctx.m.metal : ctx.style === 'rustic' ? mat.iron('#2e3a34') : ctx.style === 'japanese' ? ctx.m.stone : mat.paint('#2f5d46');
  const water = new THREE.MeshPhysicalMaterial({ color: '#bfe3f0', roughness: 0.05, transparent: true, opacity: 0.7, name: 'water-jet' });
  pad(root, 1.4 * ctx.k, 1.4 * ctx.k, ctx.style === 'rustic' ? ctx.m.gravel : ctx.m.stone, { h: 0.06, shape: ctx.style === 'japanese' ? 'round' : 'rect', r: 0.1 });
  const anims = [];
  const jet = (x, y, z, dir = 1) => {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push([x + dir * t * 0.12, y + Math.sin(t * Math.PI) * 0.08 - t * 0.05, z]);
    }
    const j = curveTube(pts, 0.006, water, { parent: root, segments: 12, radialSegments: 6, name: `jet_${anims.length}` });
    j.scale.set(1, 1, 1);
    return j;
  };
  if (variant === 'column') {
    mesh(lathe([[0.001, 0], [0.3, 0], [0.3, 0.12], [0.22, 0.2], [0.14, 0.3], [0.11, 0.9], [0.16, 0.98], [0.2, 1.0], [0.001, 1.0]], 24), fm, { parent: root, at: [0, 0.06, 0], name: 'column' });
    mesh(lathe([[0.001, 0], [0.16, 0], [0.24, 0.1], [0.23, 0.12], [0.15, 0.03], [0.001, 0.03]], 24), fm, { parent: root, at: [0, 1.06, 0] });
    mesh(new THREE.SphereGeometry(0.08, 14, 10), fm, { parent: root, at: [0, 1.16, 0] });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8), M.chrome(), { parent: root, at: [0, 1.2, 0] });
    jet(0, 1.25, 0);
    // dog bowl
    mesh(lathe([[0.001, 0], [0.16, 0], [0.18, 0.08], [0.16, 0.08], [0.14, 0.02], [0.001, 0.02]], 20), fm, { parent: root, at: [0.4, 0.06, 0] });
  } else if (variant === 'bottle-station') {
    mesh(roundedBox(0.55, 1.6, 0.35, 0.06), fm, { parent: root, at: [0, 0.86, 0], name: 'cabinet' });
    mesh(roundedBox(0.4, 0.5, 0.06, 0.03), M.plastic('#1b1d20', 0.3), { parent: root, at: [0, 1.15, 0.18] });
    mesh(roundedBox(0.36, 0.04, 0.16, 0.01), M.chrome(), { parent: root, at: [0, 0.92, 0.25] });
    const lamps = lampSet('ready', 'blue');
    lamps.add(root, { at: [0, 1.5, 0.176], normal: [0, 0, 1], w: 0.14, h: 0.03, shape: 'strip' });
    emblem(root, 0.08, [0, 0.6, 0.175]);
    mesh(roundedBox(0.5, 0.12, 0.3, 0.04), fm, { parent: root, at: [0.4, 0.9, 0.05] });
    jet(0.3, 0.95, 0.05);
    anims.push(lampOn('ready', 3));
  } else if (variant === 'hand-pump') {
    mesh(roundedBox(0.8, 0.12, 0.5, 0.04), ctx.m.stone, { parent: root, at: [0, 0.12, 0] });
    mesh(lathe([[0.001, 0], [0.4, 0], [0.4, 0.25], [0.36, 0.25], [0.36, 0.04], [0.001, 0.04]], 24), ctx.m.stone, { parent: root, at: [0, 0.06, 0.45], name: 'trough' });
    mesh(lathe([[0.001, 0], [0.1, 0], [0.08, 0.05], [0.07, 0.9], [0.09, 0.95], [0.09, 1.1], [0.05, 1.15], [0.001, 1.15]], 18), fm, { parent: root, at: [0, 0.18, 0], name: 'pump' });
    curveTube([[0, 0.95, 0.06], [0, 0.9, 0.25], [0, 0.82, 0.32]], 0.03, fm, { parent: root, radialSegments: 8 });
    const h = group('handle', { parent: root, at: [0, 1.28, -0.05] });
    curveTube([[0, 0, 0], [0, 0.1, -0.3], [0, 0.05, -0.65]], 0.02, fm, { parent: h, radialSegments: 8 });
    anims.push(clip('pump', 1.2, [rotateTrack(h, 'x', 1.2, (t) => Math.sin(t * Math.PI * 2) * 0.35)]));
  } else {
    // two bubblers at adult and child height on a shared base
    for (const [x, hh] of [[-0.25, 0.95], [0.25, 0.7]]) {
      mesh(lathe([[0.001, 0], [0.12, 0], [0.08, 0.06], [0.06, hh - 0.1], [0.001, hh - 0.1]], 18), fm, { parent: root, at: [x, 0.06, 0] });
      mesh(lathe([[0.001, 0], [0.06, 0], [0.2, 0.08], [0.19, 0.1], [0.05, 0.02], [0.001, 0.02]], 22), M.metal('#c5c9cc', 0.25), { parent: root, at: [x, 0.06 + hh - 0.1, 0] });
      jet(x, 0.06 + hh - 0.06, 0);
    }
  }
  return anims;
});

