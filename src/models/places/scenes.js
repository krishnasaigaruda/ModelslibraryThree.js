import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, lathe, tube, curveTube, extrudeOutline } from '../../core/utils.js';
import { rotateTrack, clip, pingPong } from '../../core/animation.js';
import { createTree, TREE_TRIMS, createBush, BUSH_TRIMS, createHedge, HEDGE_TRIMS } from '../nature.js';
import { createTrashCan, createPicnicTable } from '../street.js';
import { defineType, pad, inst, lampSet, lampOn, parkLamp, place, trimFor, mat, slabFromShape, rrShape, blobShape } from './kit.js';
import { parkBench, pond, createPergola, createFootbridge } from './structures.js';
import { createFlowerBed, createRoseArch, stone } from './features.js';
import { createBirdBath, createStatue } from './monuments.js';
import { createPicnicSet, createBbqGrill } from './activity.js';
import { createPlazaFountain } from './features.js';
import { createSteppingStones } from './paths.js';

/* Playground pieces (own designs) and small ready-made park vignettes (10–20 m). */

/* -------------------------------- Playground -------------------------------- */

const playCol = (ctx, i) => (ctx.style === 'rustic' ? M.wood(['#8a6440', '#a87a4c'][i % 2]) : ctx.style === 'victorian' ? mat.steel(['#1e3a2e', '#b8913a'][i % 2]) : ctx.style === 'japanese' ? mat.steel(['#b8382a', '#3b2a22'][i % 2]) : mat.steel(['#e8b020', '#2a7ad0', '#d23a2a', '#2f9a4a'][i % 4]));

export const PLAYGROUND_VARIANTS = { swings: {}, slide: {}, 'see-saw': {}, sandbox: {}, 'climbing-frame': {}, 'spring-rider': {} };
export const createPlayground = defineType('playground', PLAYGROUND_VARIANTS, (root, ctx, v, variant) => buildPlay(root, ctx, variant, 0.04, true));

function buildPlay(root, ctx, variant, y0, surface) {
  const k = ctx.k;
  const anims = [];
  const steel = M.metal('#c5c9cc', 0.25);
  const rub = M.rubber();
  if (surface) pad(root, 4.6 * k, 4 * k, mat.rubber(ctx.style === 'modern' ? '#3a6ab0' : ctx.style === 'rustic' ? '#7a5a3a' : '#2f6a4a'), { h: y0, r: 0.2, name: 'safety-surface' });
  const y = y0;
  if (variant === 'swings') {
    const W = 3.2 * k;
    const H = 2.3;
    const fm = playCol(ctx, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      if (ctx.style === 'rustic') tube([sx * W / 2, y, sz * 0.9], [sx * W / 2, y + H, 0], 0.07, fm, { parent: root, radialSegments: 10 });
      else tube([sx * W / 2, y, sz * 0.9], [sx * W / 2, y + H, 0], 0.04, fm, { parent: root, radialSegments: 12 });
    }
    tube([-W / 2 - 0.05, y + H, 0], [W / 2 + 0.05, y + H, 0], ctx.style === 'rustic' ? 0.08 : 0.05, playCol(ctx, 1), { parent: root, radialSegments: 12, name: 'top-bar' });
    for (const [i, x] of [[0, -W / 4], [1, W / 4]]) {
      const sw = group(`swing_${i}`, { parent: root, at: [x, y + H - 0.05, 0] });
      for (const dx of [-0.2, 0.2]) tube([dx, 0, 0], [dx, -1.75, 0], 0.008, steel, { parent: sw, radialSegments: 5 });
      if (i === 1) mesh(lathe([[0.001, 0], [0.2, 0], [0.22, 0.12], [0.18, 0.28], [0.17, 0.28], [0.19, 0.12], [0.17, 0.02], [0.001, 0.02]], 20), rub, { parent: sw, at: [0, -1.95, 0], name: 'toddler-seat' });
      else mesh(roundedBox(0.46, 0.04, 0.18, 0.02), rub, { parent: sw, at: [0, -1.77, 0], name: 'seat' });
      anims.push(rotateTrack(sw, 'x', 2.6, (t) => Math.sin(t * Math.PI * 2 + i) * 0.5));
    }
    return [clip('swing', 2.6, anims)];
  }
  if (variant === 'slide') {
    const H = 1.5;
    const pc = playCol(ctx, 0);
    for (const sx of [-0.35, 0.35]) for (const sz of [-0.35, 0.35]) tube([sx, y, sz - 0.6], [sx, y + H + 1.0, sz - 0.6], 0.04, pc, { parent: root, radialSegments: 10 });
    mesh(roundedBox(0.8, 0.06, 0.8, 0.02), M.wood('#a87a4c'), { parent: root, at: [0, y + H, -0.6], name: 'platform' });
    mesh(new THREE.ConeGeometry(0.62, 0.6, 4, 1, false, Math.PI / 4), playCol(ctx, 2), { parent: root, at: [0, y + H + 1.3, -0.6], name: 'roof' });
    for (const sz of [-0.35, 0.35]) tube([-0.35, y + H + 1.0, sz - 0.6], [0.35, y + H + 1.0, sz - 0.6], 0.03, pc, { parent: root });
    // ladder at the back
    for (const sx of [-0.25, 0.25]) tube([sx, y, -1.9], [sx, y + H, -0.97], 0.025, pc, { parent: root });
    const rungs = [];
    for (let i = 1; i < 6; i++) rungs.push({ at: [0, y + (i / 6) * H, -1.9 + (i / 6) * 0.93] });
    inst(root, new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8).rotateZ(Math.PI / 2), steel, rungs, 'rungs');
    // chute
    const prof = [[-0.3, 0.12], [-0.3, 0], [0.3, 0], [0.3, 0.12], [0.27, 0.12], [0.27, 0.03], [-0.27, 0.03], [-0.27, 0.12]];
    const path = new THREE.CatmullRomCurve3([new THREE.Vector3(0, y + H, -0.2), new THREE.Vector3(0, y + H * 0.7, 0.6), new THREE.Vector3(0, y + 0.35, 1.6), new THREE.Vector3(0, y + 0.25, 2.1)]);
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(prof.map(([a, b]) => new THREE.Vector2(a, b))), { steps: 40, bevelEnabled: false, extrudePath: path });
    mesh(g, playCol(ctx, 1), { parent: root, name: 'chute' });
    tube([0, y, 2.05], [0, y + 0.25, 2.05], 0.035, pc, { parent: root });
    return [];
  }
  if (variant === 'see-saw') {
    const pc = playCol(ctx, 0);
    mesh(extrudeOutline([[-0.3, 0], [0.3, 0], [0.08, 0.5], [-0.08, 0.5]], 0.3, { bevel: 0.02 }), pc, { parent: root, at: [0, y, 0], rot: [0, Math.PI / 2, 0] });
    const beam = group('beam', { parent: root, at: [0, y + 0.55, 0] });
    mesh(roundedBox(3.2, 0.08, 0.24, 0.03), ctx.style === 'rustic' ? M.wood('#a87a4c') : playCol(ctx, 1), { parent: beam });
    for (const sx of [-1, 1]) {
      mesh(roundedBox(0.4, 0.05, 0.3, 0.02), M.rubber(), { parent: beam, at: [sx * 1.3, 0.065, 0] });
      curveTube([[sx * 1.1, 0.04, -0.12], [sx * 1.1, 0.3, -0.12], [sx * 1.1, 0.3, 0.12], [sx * 1.1, 0.04, 0.12]], 0.018, steel, { parent: beam, radialSegments: 6 });
    }
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 12).rotateX(Math.PI / 2), steel, { parent: beam });
    return [clip('rock', 2.4, [rotateTrack(beam, 'z', 2.4, (t) => Math.sin(t * Math.PI * 2) * 0.22)])];
  }
  if (variant === 'sandbox') {
    const S = 2.6 * k;
    const outer = rrShape(S + 0.3, S + 0.3, 0.06);
    outer.holes.push(new THREE.Path(rrShape(S, S, 0.04).getPoints(16).reverse()));
    mesh(slabFromShape(outer, 0.32, { bevel: 0.02 }), ctx.style === 'modern' ? mat.concrete() : M.wood('#a87a4c'), { parent: root, at: [0, y, 0], name: 'frame' });
    mesh(slabFromShape(rrShape(S + 0.01, S + 0.01, 0.04), 0.18, { bevel: 0.03 }), ctx.m.sand, { parent: root, at: [0, y, 0], name: 'sand' });
    // bucket and spade
    mesh(lathe([[0.001, 0], [0.07, 0], [0.09, 0.14], [0.085, 0.14], [0.065, 0.006], [0.001, 0.006]], 16), M.plastic('#d23a2a', 0.4), { parent: root, at: [0.4, y + 0.18, 0.3], name: 'bucket' });
    mesh(roundedBox(0.08, 0.012, 0.3, 0.004), M.plastic('#2a7ad0', 0.4), { parent: root, at: [-0.3, y + 0.186, -0.2], rot: [0, 0.6, 0] });
    mesh(new THREE.SphereGeometry(0.18, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), ctx.m.sand, { parent: root, at: [-0.5, y + 0.18, 0.5], name: 'sand-castle' });
    return [];
  }
  if (variant === 'spring-rider') {
    mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 20), steel, { parent: root, at: [0, y + 0.02, 0] });
    const body = group('rider', { parent: root, at: [0, y + 0.04, 0] });
    const coils = [];
    for (let i = 0; i < 12; i++) coils.push({ at: [0, 0.015 + i * 0.03, 0] });
    inst(body, new THREE.TorusGeometry(0.1, 0.015, 6, 18).rotateX(Math.PI / 2), M.metal('#c5c9cc', 0.3), coils, 'spring');
    // stylised duck: body, head, beak, handles
    const c = playCol(ctx, ctx.style === 'modern' ? 0 : 2);
    mesh(new THREE.SphereGeometry(0.32, 20, 14).scale(1.3, 0.6, 0.7), c, { parent: body, at: [0, 0.55, 0], name: 'body' });
    mesh(new THREE.SphereGeometry(0.17, 16, 12), c, { parent: body, at: [0.36, 0.86, 0] });
    mesh(new THREE.ConeGeometry(0.06, 0.15, 10).rotateZ(-Math.PI / 2), M.plastic('#e87a1a', 0.4), { parent: body, at: [0.56, 0.84, 0] });
    tube([0.3, 0.88, -0.2], [0.3, 0.88, 0.2], 0.018, steel, { parent: body });
    return [clip('bounce', 1.6, [rotateTrack(body, 'z', 1.6, (t) => Math.sin(t * Math.PI * 2) * 0.18)])];
  }
  // climbing frame: platforms, net, fireman pole
  const pc = playCol(ctx, 0);
  const H = 1.4;
  for (const x of [-1, 1]) for (const z of [-0.6, 0.6]) tube([x, y, z], [x, y + 2.4, z], 0.045, pc, { parent: root, radialSegments: 10 });
  mesh(roundedBox(2.1, 0.06, 1.3, 0.02), M.wood('#a87a4c'), { parent: root, at: [0, y + H, 0], name: 'deck' });
  for (const z of [-0.6, 0.6]) tube([-1, y + 2.4, z], [1, y + 2.4, z], 0.035, pc, { parent: root });
  const bars = [];
  for (let i = 0; i < 7; i++) bars.push({ at: [-0.9 + i * 0.3, y + 2.4, 0] });
  inst(root, new THREE.CylinderGeometry(0.018, 0.018, 1.2, 8).rotateX(Math.PI / 2), steel, bars, 'monkey-bars');
  // rope net on the front
  const net = [];
  for (let i = 0; i <= 6; i++) net.push({ at: [-1 + i * 0.333, y + H / 2, 0.9], rot: [0.43, 0, 0], s: [1, 1, 1] });
  inst(root, new THREE.CylinderGeometry(0.012, 0.012, 1.55, 6), M.matte('#c8b890'), net, 'net-v');
  const nh = [];
  for (let j = 1; j < 5; j++) nh.push({ at: [0, y + (j / 5) * H, 0.6 + (1 - j / 5) * 0.6] });
  inst(root, new THREE.CylinderGeometry(0.012, 0.012, 2.0, 6).rotateZ(Math.PI / 2), M.matte('#c8b890'), nh, 'net-h');
  tube([1.4, y, -0.6], [1.4, y + 2.4, -0.6], 0.025, steel, { parent: root, name: 'pole' });
  tube([1.0, y + 2.3, -0.6], [1.4, y + 2.3, -0.6], 0.025, steel, { parent: root });
  return anims;
}

/* --------------------------------- Scenes --------------------------------- */

function sceneTree(ctx, species) {
  const sp = ctx.style === 'japanese' ? 'japanese-maple' : ctx.style === 'rustic' ? 'birch' : ctx.style === 'modern' ? 'ginkgo' : ctx.style === 'victorian' ? 'chestnut' : species;
  const trim = trimFor(ctx, TREE_TRIMS[sp], { autumn: 'autumn', winter: 'snow', overgrown: 'ivy', worn: 'pollarded', summer: 'young', new: 'young' }) ?? 'young';
  const t = createTree({ variant: sp, trim, seed: Math.floor(ctx.r() * 90) + 1 });
  // the scene's own autumn pass scatters leaves on the lawn; drop the tree's litter disc (it can overhang the lawn edge)
  t.traverse((o) => { if (/litter/.test(o.name)) o.visible = false; });
  return t;
}
const sceneBush = (ctx, variant) => {
  const b = createBush({ variant, trim: trimFor(ctx, BUSH_TRIMS[variant], { winter: 'snow', autumn: 'autumn', overgrown: 'overgrown', worn: 'dry' }) });
  b.traverse((o) => { if (/litter/.test(o.name)) o.visible = false; });
  return b;
};
const sub = (ctx) => ctx.trim ?? undefined;
const bin = (ctx) => createTrashCan({ variant: 'park', trim: trimFor(ctx, ['snowy', 'rusty'], { winter: 'snowy', worn: 'rusty' }) });

export const PARK_SCENE_VARIANTS = { 'pocket-park': {}, 'picnic-lawn': {}, 'pond-corner': {}, 'playground-corner': {}, 'fountain-plaza': {}, 'garden-corner': {} };
export const createParkScene = defineType('park-scene', PARK_SCENE_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const anims = [];
  const lamps = lampSet('lamps', 'fog');
  const lawnTop = 0.05;
  const lawn = (w, d) => pad(root, w, d, ctx.m.lawn, { h: lawnTop, r: 0.4, name: 'lawn' });
  const path = (x0, z0, x1, z1, w = 2) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const m = mesh(slabFromShape(rrShape(len, w, 0.05), 0.03, { y0: lawnTop - 0.01, bevel: 0.005 }), ctx.style === 'modern' ? mat.concrete('#c9c5bd') : ctx.style === 'victorian' ? mat.stone('#cbbfa8') : mat.gravel(ctx.style === 'japanese' ? '#e4e0d6' : '#c9b994'), { parent: root, name: 'path' });
    m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
    m.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
  };
  const Y = lawnTop + 0.02;
  if (variant === 'pocket-park') {
    const W = 12 * k;
    const D = 10 * k;
    lawn(W, D);
    path(-W / 2, 0, W / 2, 0);
    path(0, -D / 2, 0, D / 2);
    place(root, createFlowerBed({ variant: 'round', trim: sub(ctx), size: 0.8 }), 0, 0, { y: Y });
    parkBench(root, ctx, -2.6 * k, -1.6, 0, lawnTop);
    parkBench(root, ctx, 2.6 * k, 1.6, Math.PI, lawnTop);
    place(root, sceneTree(ctx, 'linden'), -W / 2 + 2.5, -D / 2 + 2.3, { y: lawnTop, lift: false });
    place(root, sceneBush(ctx, 'hydrangea'), W / 2 - 1.6, -D / 2 + 1.5, { y: lawnTop });
    place(root, sceneBush(ctx, 'round'), -W / 2 + 1.4, D / 2 - 1.4, { y: lawnTop });
    place(root, bin(ctx), 1.6, -1.6, { y: lawnTop });
    for (const [x, z] of [[-1.6, 1.6], [1.6, -2.6]]) parkLamp(root, ctx, lamps, x, z);
    const ht = trimFor(ctx, HEDGE_TRIMS.trimmed, { winter: 'snow', autumn: 'autumn', overgrown: 'overgrown', worn: 'gappy' });
    place(root, createHedge({ variant: 'boxwood', trim: ht, length: W / 2 - 1.5, height: 0.6 }), W / 4 + 0.5, D / 2 - 0.5, { y: lawnTop });
  } else if (variant === 'picnic-lawn') {
    const W = 16 * k;
    const D = 12 * k;
    lawn(W, D);
    place(root, createPicnicTable({ variant: ctx.style === 'modern' ? 'modern' : 'classic', trim: trimFor(ctx, ['snowy', 'rusty', 'umbrella'], { winter: 'snowy', worn: 'rusty', summer: 'umbrella' }) }), -3 * k, -1.5 * k, { y: lawnTop, rot: 0.3 });
    place(root, createPicnicTable({ variant: 'accessible', trim: trimFor(ctx, ['snowy', 'rusty'], { winter: 'snowy', worn: 'rusty' }) }), 3 * k, -2 * k, { y: lawnTop, rot: -0.2 });
    if (!ctx.winter) place(root, createPicnicSet({ variant: 'blanket', trim: sub(ctx), size: 0.6 }), 0.5 * k, 2.5 * k, { y: lawnTop });
    place(root, createBbqGrill({ variant: 'pedestal', trim: sub(ctx), size: 0.7 }), 6 * k, 1.5 * k, { y: lawnTop });
    place(root, sceneTree(ctx, 'oak'), -W / 2 + 2.5, D / 2 - 2.5, { y: lawnTop, lift: false });
    place(root, sceneTree(ctx, 'maple'), W / 2 - 2.5, -D / 2 + 2.5, { y: lawnTop, lift: false });
    place(root, bin(ctx), -6 * k, 1 * k, { y: lawnTop });
    anims.push(...[]);
  } else if (variant === 'pond-corner') {
    const W = 14 * k;
    const D = 12 * k;
    pond(root, ctx, 3.6 * k, 2.6 * k, { lawnW: W, lawnD: D, at: [0.8, 0, 0.6] });
    parkBench(root, ctx, -1, -D / 2 + 1.6, 0, 0.08);
    place(root, createTree({ variant: 'willow', trim: trimFor(ctx, TREE_TRIMS.willow, { autumn: 'autumn', winter: 'snow', summer: 'young', new: 'young' }) ?? 'young' }), -W / 2 + 2.2, D / 2 - 2.4, { y: 0.08, lift: false });
    for (let i = 0; i < 4; i++) stone(root, ctx, W / 2 - 1.6 - i * 0.4, 0.08, -D / 2 + 1.4 + i * 0.5, 0.35 - i * 0.05);
    place(root, sceneBush(ctx, ctx.style === 'japanese' ? 'azalea' : 'fern'), W / 2 - 1.5, D / 2 - 1.5, { y: 0.08 });
    parkLamp(root, ctx, lamps, -W / 2 + 1.2, -D / 2 + 1.2);
  } else if (variant === 'playground-corner') {
    const W = 14 * k;
    const D = 12 * k;
    lawn(W, D);
    mesh(slabFromShape(blobShape(4.6 * k, 3.6 * k, ctx.r, { n: 10, wobble: 0.1 }), 0.03, { y0: lawnTop - 0.01, bevel: 0.01 }), mat.rubber(ctx.style === 'modern' ? '#3a6ab0' : '#2f6a4a'), { parent: root, at: [0.5, 0, 0], name: 'safety-surface' });
    const g1 = group('swings', { parent: root, at: [-1.8 * k, 0, -1.4 * k] });
    anims.push(...buildPlay(g1, ctx, 'swings', lawnTop + 0.02, false));
    const g2 = group('slide', { parent: root, at: [2.4 * k, 0, -0.8 * k], rot: [0, -0.5, 0] });
    buildPlay(g2, ctx, 'slide', lawnTop + 0.02, false);
    const g3 = group('sandbox', { parent: root, at: [-0.6 * k, 0, 2.0 * k] });
    buildPlay(g3, { ...ctx, k: 0.8 }, 'sandbox', lawnTop + 0.02, false);
    const g4 = group('rider', { parent: root, at: [2.6 * k, 0, 2.2 * k] });
    anims.push(...buildPlay(g4, ctx, 'spring-rider', lawnTop + 0.02, false));
    parkBench(root, ctx, -W / 2 + 1.4, 3.5 * k, Math.PI / 2, lawnTop);
    place(root, sceneTree(ctx, 'plane'), -W / 2 + 2.2, -D / 2 + 2.2, { y: lawnTop, lift: false });
    place(root, bin(ctx), -W / 2 + 1.2, 1.8 * k, { y: lawnTop });
    // low fence around the play area
    const fm = ctx.style === 'rustic' ? M.wood('#8a6440') : mat.steel(ctx.style === 'victorian' ? '#1e3a2e' : '#2f6a4a');
    const R = [];
    for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI * 1.6 + Math.PI * 0.7; R.push([0.5 + Math.cos(a) * 5.4 * k, lawnTop + 0.9, Math.sin(a) * 4.4 * k]); }
    curveTube(R, 0.025, fm, { parent: root, segments: 80, radialSegments: 6, name: 'fence-rail' });
    inst(root, new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), fm, R.map(([x, , z]) => ({ at: [x, lawnTop + 0.45, z] })), 'fence-posts');
  } else if (variant === 'fountain-plaza') {
    place(root, createPlazaFountain({ variant: ctx.style === 'modern' ? 'jets' : 'tiered', trim: sub(ctx), size: 1.0 }), 0, 0, { y: 0.05, lift: false });
    lawn(18 * k, 18 * k);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      place(root, sceneTree(ctx, 'linden'), Math.cos(a) * 7.6 * k, Math.sin(a) * 7.6 * k, { y: lawnTop, lift: false });
    }
    for (const [x, z] of [[-7, -7], [7, 7]]) place(root, createFlowerBed({ variant: 'island', trim: sub(ctx), size: 0.5 }), x * k, z * k, { y: lawnTop });
    anims.push(clip('flow', 1, []));
  } else {
    // garden corner: pergola, beds, bird bath, rose arch, statue
    const W = 12 * k;
    const D = 12 * k;
    lawn(W, D);
    path(-W / 2, -1, W / 2, -1, 1.6);
    place(root, createPergola({ variant: 'straight', trim: sub(ctx) }), -2.5 * k, -D / 2 + 2.2, { y: lawnTop });
    place(root, createRoseArch({ variant: 'arch', trim: sub(ctx) }), W / 2 - 1.2, -1, { y: lawnTop + 0.02, rot: Math.PI / 2 });
    place(root, createFlowerBed({ variant: 'border', trim: sub(ctx), size: 0.9 }), -1, 2 * k, { y: lawnTop });
    place(root, createFlowerBed({ variant: 'raised', trim: sub(ctx) }), 3.2 * k, -D / 2 + 1.6, { y: lawnTop });
    place(root, createBirdBath({ variant: 'pedestal', trim: sub(ctx) }), 2.6 * k, 3.6 * k, { y: lawnTop });
    place(root, sceneBush(ctx, ctx.style === 'japanese' ? 'azalea' : 'lilac'), -W / 2 + 1.4, D / 2 - 1.4, { y: lawnTop });
    place(root, sceneTree(ctx, 'cherry'), W / 2 - 2.0, D / 2 - 2.0, { y: lawnTop, lift: false });
  }
  if (!anims.find((a) => a.name === 'on') && lamps.meshes.length) anims.push(lampOn('lamps', 3));
  return anims.filter((a) => a.tracks.length);
});

void createFootbridge; void createSteppingStones; void createStatue; void tube; void pingPong;
