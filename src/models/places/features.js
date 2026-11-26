import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, lathe, tube, curveTube, jitter, rng } from '../../core/utils.js';
import { rotateTrack, scaleTrack, clip, spinTrack } from '../../core/animation.js';
import { createBush, createWaterPlant, createRock, BUSH_TRIMS } from '../nature.js';

const bush = (ctx, variant) => createBush({ variant, trim: trimFor(ctx, BUSH_TRIMS[variant], { winter: 'snow', autumn: 'autumn', overgrown: 'overgrown', worn: 'dry' }) });
import { defineType, pad, inst, lampSet, lampOn, parkLamp, leafClusters, blooms, place, trimFor, mat, blobShape, slabFromShape, rrShape, polar, post } from './kit.js';
import { pond as pondBase, parkBench } from './structures.js';

/* Park features: ponds, fountain plazas, flower beds, rose arches, hedge mazes, rock gardens, garden plots. */

const jetMat = () => new THREE.MeshPhysicalMaterial({ color: '#d4eef8', roughness: 0.05, transparent: true, opacity: 0.55, name: 'water-jet' });

/** Natural rock (own geometry): jittered icosahedron, flattened. */
export function stone(parent, ctx, x, y, z, s, { flat = 0.6, material, name = 'rock' } = {}) {
  const g = jitter(new THREE.IcosahedronGeometry(1, 1), rng(Math.floor(x * 31 + z * 17 + s * 100)), 0.22);
  g.computeBoundingBox();
  const m = mesh(g, material ?? mat.stone('#8f8a80'), { parent, name });
  m.scale.set(s, s * flat, s * (0.8 + ((x * 7) % 0.3)));
  m.position.set(x, y - g.boundingBox.min.y * s * flat - 0.02, z);
  m.rotation.y = x * 3.1 + z;
  return m;
}

/** Clipped hedge block of length L along X (own geometry, leafy jitter). */
export function hedgeBlock(parent, ctx, L, H, W, { at = [0, 0, 0], rotY = 0, wild = false } = {}) {
  const g = new THREE.BoxGeometry(L, H, W, Math.max(2, Math.round(L * 4)), Math.max(2, Math.round(H * 4)), Math.max(2, Math.round(W * 4)));
  const p = g.attributes.position;
  const r = rng(Math.round(L * 100 + H * 10 + at[0] * 7 + at[2] * 3));
  const amp = wild ? 0.08 : 0.025;
  const cache = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    let d = cache.get(key);
    if (!d) { d = [(r() - 0.5) * amp, p.getY(i) < -H / 2 + 1e-4 ? 0 : (r() - 0.5) * amp, (r() - 0.5) * amp]; cache.set(key, d); }
    // soften the corners
    const nx = p.getX(i) / (L / 2);
    const ny = p.getY(i) / (H / 2);
    const nz = p.getZ(i) / (W / 2);
    const k = 1 - 0.06 * (nx * nx * ny * ny + ny * ny * nz * nz + nx * nx * nz * nz);
    const yy = p.getY(i) < -H / 2 + 1e-4 ? p.getY(i) : p.getY(i) * k + d[1];
    p.setXYZ(i, p.getX(i) * k + d[0], yy, p.getZ(i) * k + d[2]);
  }
  g.translate(0, H / 2, 0);
  g.computeVertexNormals();
  const m = mesh(g, ctx.m.leaf[0], { parent, at, rot: [0, rotY, 0], name: 'hedge' });
  return m;
}

/* --------------------------------- Pond --------------------------------- */

export const POND_VARIANTS = { round: {}, kidney: {}, formal: { style: 'victorian' }, natural: { style: 'rustic' } };
export const createPond = defineType('pond', POND_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const anims = [];
  const water = ctx.m.water;
  let fishY = 0.02;
  let fishR = 1;
  if (variant === 'formal') {
    const W = 5 * k;
    const D = 3 * k;
    pad(root, W + 2, D + 2, ctx.m.lawn, { h: 0.04, name: 'lawn' });
    const rimMat = ctx.style === 'modern' ? ctx.m.concrete : ctx.style === 'rustic' ? ctx.m.stone : mat.stone('#d2c8b4');
    const outer = rrShape(W + 0.5, D + 0.5, ctx.style === 'modern' ? 0.05 : 0.6);
    outer.holes.push(new THREE.Path(rrShape(W, D, ctx.style === 'modern' ? 0.03 : 0.45).getPoints(64).reverse()));
    mesh(slabFromShape(outer, 0.45, { y0: 0.04 }), rimMat, { parent: root, name: 'rim' });
    mesh(slabFromShape(rrShape(W + 0.02, D + 0.02, ctx.style === 'modern' ? 0.03 : 0.45), 0.34, { y0: 0.04, bevel: 0 }), water, { parent: root, name: 'water' });
    fishY = 0.36;
    fishR = Math.min(W, D) / 2 - 0.4;
    // central jet
    if (ctx.style !== 'rustic') {
      mesh(lathe([[0.001, 0], [0.2, 0], [0.16, 0.12], [0.06, 0.2], [0.001, 0.2]], 16), rimMat, { parent: root, at: [0, 0.3, 0] });
      const j = mesh(new THREE.CylinderGeometry(0.02, 0.05, 1.2, 10, 1, true).translate(0, 0.6, 0), jetMat(), { parent: root, at: [0, 0.48, 0], name: 'jet' });
      anims.push(clip('flow', 1.6, [scaleTrack(j, 1.6, (t) => [1, 0.85 + 0.15 * Math.sin(t * Math.PI * 2), 1])]));
    }
    if (ctx.style === 'victorian' || ctx.style === 'classic') for (const sx of [-1, 1]) {
      mesh(lathe([[0.001, 0], [0.2, 0], [0.2, 0.1], [0.12, 0.2], [0.1, 0.35], [0.28, 0.6], [0.3, 0.68], [0.001, 0.68]], 20), rimMat, { parent: root, at: [sx * (W / 2 + 0.25), 0.49, 0], name: 'urn' });
      if (!ctx.winter) leafClusters(root, ctx, [[sx * (W / 2 + 0.25), 1.25, 0]], { size: 0.25 });
    }
    if (!ctx.winter) place(root, createWaterPlant({ variant: 'lily-pads', trim: trimFor(ctx, ['autumn', 'flowering'], { autumn: 'autumn', summer: 'flowering' }) }), W * 0.25, 0, { y: 0.38, s: 0.7 });
  } else {
    const rx = (variant === 'kidney' ? 3.2 : variant === 'natural' ? 3.6 : 2.4) * k;
    const rz = (variant === 'kidney' ? 1.8 : variant === 'natural' ? 2.6 : 2.4) * k;
    pondBase(root, ctx, rx, rz, { lawnW: rx * 2 + 3, lawnD: rz * 2 + 3 });
    fishR = Math.min(rx, rz) * 0.55;
    // rock groups and planting at the edges
    const rocks = ctx.style === 'japanese' || variant === 'natural' ? 6 : 3;
    for (let i = 0; i < rocks; i++) {
      const a = (i / rocks) * Math.PI * 2 + 0.4;
      stone(root, ctx, Math.cos(a) * (rx + 0.45), 0.08, Math.sin(a) * (rz + 0.45), 0.25 + ctx.r() * 0.3, { material: mat.stone(ctx.style === 'japanese' ? '#77736c' : '#8f8a80') });
    }
    const rt = trimFor(ctx, ['autumn', 'dense'], { autumn: 'autumn', overgrown: 'dense' });
    if (ctx.style !== 'modern') place(root, createWaterPlant({ variant: ctx.style === 'japanese' ? 'yellow-iris' : 'cattails', trim: rt }), -rx * 0.75, -rz * 0.55, { y: 0.03, s: 0.8 });
    if (ctx.style === 'japanese') {
      const lamps = lampSet('lamps', 'fog');
      parkLamp(root, ctx, lamps, rx + 0.9, -rz * 0.4);
      anims.push(lampOn('lamps', 3));
    } else if (ctx.style === 'victorian' || ctx.style === 'classic') parkBench(root, ctx, 0, rz + 1.0, Math.PI, 0.08);
    if (variant === 'natural') place(root, createRock({ variant: 'mossy', trim: ctx.winter ? 'snow' : undefined }), rx * 0.2, -rz - 0.6, { y: 0.08, s: 0.7 });
  }
  // koi swimming just under the surface (not in winter, the pond is frozen)
  if (!ctx.winter) {
    const koi = group('koi', { parent: root, at: [0, fishY, 0] });
    const body = new THREE.SphereGeometry(1, 10, 8);
    body.scale(0.14, 0.035, 0.05);
    const cols = ['#f07a1a', '#f4f1ea', '#d8361e', '#e8b030'];
    const items = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      items.push({ at: [Math.cos(a) * fishR * (0.5 + 0.1 * i), 0, Math.sin(a) * fishR * (0.5 + 0.1 * i)], rot: [0, -a, 0], color: cols[i % 4] });
    }
    mesh(new THREE.CylinderGeometry(fishR * 0.9, fishR * 0.9, 0.004, 24), new THREE.MeshStandardMaterial({ color: '#2f5a64', transparent: true, opacity: 0.15, name: 'water-shade' }), { parent: koi, at: [0, -0.002, 0] });
    inst(koi, body, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, name: 'koi' }), items, 'koi-fish');
    anims.push(clip('swim', 12, [spinTrack(koi, 'y', 12)]));
  }
  return anims;
});

/* ----------------------------- Fountain plaza ----------------------------- */

export const PLAZA_FOUNTAIN_VARIANTS = { tiered: { style: 'victorian' }, jets: { style: 'modern' }, statue: {}, cascade: {} };
export const createPlazaFountain = defineType('plaza-fountain', PLAZA_FOUNTAIN_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const R = 6 * k;
  const pave = ctx.style === 'modern' ? mat.stone('#d0ccc4') : ctx.style === 'rustic' ? ctx.m.gravel : ctx.style === 'japanese' ? mat.gravel('#e4e0d6') : mat.stone('#cbbfa8');
  pad(root, R * 2, R * 2, pave, { h: 0.05, shape: 'round', name: 'plaza' });
  const rim = ctx.style === 'modern' ? ctx.m.concrete : mat.stone(ctx.style === 'victorian' ? '#d8cfbd' : '#bdb5a6');
  const anims = [];
  const jm = jetMat();
  const lamps = lampSet('lamps', 'fog');
  const BR = 2.4 * k;
  if (variant !== 'jets') {
    mesh(lathe([[BR - 0.3, 0], [BR + 0.05, 0], [BR + 0.05, 0.45], [BR - 0.05, 0.55], [BR - 0.3, 0.55], [BR - 0.3, 0.1]], 48), rim, { parent: root, at: [0, 0.05, 0], name: 'basin' });
    mesh(new THREE.CylinderGeometry(BR - 0.3, BR - 0.3, 0.4, 48), ctx.m.water, { parent: root, at: [0, 0.25, 0], name: 'water' });
  }
  if (variant === 'tiered') {
    mesh(lathe([[0.001, 0], [0.35, 0], [0.28, 0.2], [0.18, 0.4], [0.16, 1.1], [0.001, 1.1]], 32), rim, { parent: root, at: [0, 0.45, 0] });
    mesh(lathe([[0.001, 0], [0.2, 0], [1.1, 0.25], [1.15, 0.35], [1.05, 0.35], [0.001, 0.15]], 40), rim, { parent: root, at: [0, 1.5, 0], name: 'bowl' });
    mesh(new THREE.CylinderGeometry(1.06, 1.06, 0.02, 40), ctx.m.water, { parent: root, at: [0, 1.82, 0] });
    mesh(lathe([[0.001, 0], [0.12, 0], [0.1, 0.6], [0.001, 0.6]], 24), rim, { parent: root, at: [0, 1.8, 0] });
    mesh(lathe([[0.001, 0], [0.12, 0], [0.55, 0.15], [0.58, 0.22], [0.5, 0.22], [0.001, 0.08]], 32), rim, { parent: root, at: [0, 2.35, 0], name: 'bowl2' });
    const sheet = mesh(new THREE.CylinderGeometry(1.12, 1.4, 1.0, 40, 1, true), jm, { parent: root, at: [0, 1.35, 0], name: 'falls' });
    const top = mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.5, 10, 1, true).translate(0, 0.25, 0), jm, { parent: root, at: [0, 2.55, 0], name: 'jet' });
    anims.push(clip('flow', 1.6, [scaleTrack(top, 1.6, (t) => [1, 0.8 + 0.2 * Math.sin(t * Math.PI * 2), 1]), scaleTrack(sheet, 1.6, (t) => [1 + 0.02 * Math.sin(t * Math.PI * 4), 1, 1 + 0.02 * Math.sin(t * Math.PI * 4)])]));
  } else if (variant === 'statue') {
    mesh(roundedBox(0.9, 1.2, 0.9, 0.05), rim, { parent: root, at: [0, 0.65, 0] });
    // abstract standing figure holding up a bowl (own design)
    const bronze = M.metal(ctx.style === 'modern' ? '#c5c9cc' : '#6f8a6a', 0.45);
    mesh(lathe([[0.001, 0], [0.25, 0], [0.22, 0.4], [0.16, 0.9], [0.2, 1.2], [0.16, 1.4], [0.08, 1.5], [0.11, 1.62], [0.001, 1.72]], 24), bronze, { parent: root, at: [0, 1.25, 0], name: 'statue' });
    for (const s of [-1, 1]) curveTube([[s * 0.17, 2.4, 0], [s * 0.3, 2.75, 0.05], [s * 0.22, 3.1, 0]], 0.05, bronze, { parent: root, radialSegments: 8 });
    mesh(lathe([[0.001, 0], [0.1, 0], [0.4, 0.12], [0.38, 0.15], [0.001, 0.06]], 24), bronze, { parent: root, at: [0, 3.08, 0] });
    const j = mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.6, 10, 1, true).translate(0, 0.3, 0), jm, { parent: root, at: [0, 3.2, 0], name: 'jet' });
    anims.push(clip('flow', 1.6, [scaleTrack(j, 1.6, (t) => [1, 0.8 + 0.2 * Math.sin(t * Math.PI * 2), 1])]));
  } else if (variant === 'cascade') {
    for (let i = 0; i < 3; i++) {
      const s = 1.4 - i * 0.35;
      mesh(roundedBox(s * 2, 0.4, s * 2, 0.05), rim, { parent: root, at: [0, 0.45 + i * 0.4 + 0.2, 0] });
      mesh(roundedBox(s * 2 - 0.2, 0.02, s * 2 - 0.2, 0.01), ctx.m.water, { parent: root, at: [0, 0.45 + i * 0.4 + 0.41, 0] });
    }
    const curtain = mesh(new THREE.BoxGeometry(2.86, 0.4, 2.86, 1, 1, 1), jm, { parent: root, at: [0, 0.65, 0], name: 'falls' });
    anims.push(clip('flow', 1.6, [scaleTrack(curtain, 1.6, (t) => [1 + 0.01 * Math.sin(t * Math.PI * 4), 1, 1 + 0.01 * Math.sin(t * Math.PI * 4)])]));
  } else {
    // flush jets: grid of nozzles in the paving with dancing jets
    mesh(new THREE.CylinderGeometry(BR + 0.5, BR + 0.5, 0.01, 48), mat.stone('#7d8a94'), { parent: root, at: [0, 0.055, 0], name: 'grate' });
    const nozzles = [];
    const tracks = [];
    let n = 0;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      if (i * i + j * j > 6) continue;
      const x = i * 0.9 * k;
      const z = j * 0.9 * k;
      nozzles.push({ at: [x, 0.06, z] });
      const jet = mesh(new THREE.CylinderGeometry(0.02, 0.04, 1, 8, 1, true).translate(0, 0.5, 0), jm, { parent: root, at: [x, 0.06, z], name: `jet_${n}` });
      const ph = ((i + j + 4) / 8);
      tracks.push(scaleTrack(jet, 3, (t) => [1, 0.4 + 1.6 * (0.5 + 0.5 * Math.sin((t - ph) * Math.PI * 2)), 1]));
      n++;
    }
    inst(root, new THREE.CylinderGeometry(0.06, 0.06, 0.012, 12), M.chrome(), nozzles, 'nozzles');
    const ring = lampSet('jetlights', 'blue');
    for (let i = 0; i < 8; i++) {
      const [x, z] = polar(BR + 0.2, (i / 8) * Math.PI * 2);
      ring.add(root, { at: [x, 0.0625, z], normal: [0, 1, 0], w: 0.08, h: 0.08, shape: 'round', bezel: false });
    }
    anims.push(clip('flow', 3, tracks), clip('show', 1, [...lampOn('jetlights', 3).tracks]));
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const [x, z] = polar(R - 0.6, a);
    parkLamp(root, ctx, lamps, x, z);
    const [bx, bz] = polar(R - 1.4, a + Math.PI / 4);
    parkBench(root, ctx, bx, bz, a + Math.PI / 4 + Math.PI, 0.05);
  }
  anims.push(lampOn('lamps', 3));
  return anims;
});

/* ------------------------------- Flower bed ------------------------------- */

/** Flower planting over a bed outline: stems + leaf mounds + blooms (season coloured). */
function planting(parent, ctx, inside, area, y, { density = 1, tall = 0.35 } = {}) {
  const n = Math.min(260, Math.round(area * 26 * density));
  const leaves = [];
  const fl = [];
  const stems = [];
  for (let i = 0; i < n * 3 && leaves.length < n; i++) {
    const [x, z] = inside();
    if (x == null) continue;
    const h = tall * (0.6 + ctx.r() * 0.6);
    leaves.push([x, y + 0.06, z]);
    if (!ctx.winter) {
      stems.push({ at: [x, y + h / 2, z], s: [1, h, 1] });
      fl.push([x, y + h, z]);
    }
  }
  leafClusters(parent, ctx, leaves, { size: 0.09 });
  if (stems.length) inst(parent, new THREE.CylinderGeometry(0.006, 0.006, 1, 4), mat.leaf('#4a7a2a'), stems, 'stems');
  if (fl.length) blooms(parent, ctx, fl, { size: 0.045 });
}

/** Bed edging by style along a closed path of points. */
function edging(parent, ctx, pts, y = 0) {
  const st = ctx.style;
  const items = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    items.push({ at: [(a.x + b.x) / 2, y, (a.y + b.y) / 2], rot: [0, -Math.atan2(b.y - a.y, b.x - a.x), 0], s: [len + 0.02, 1, 1] });
  }
  if (st === 'victorian') {
    // iron hoop edging
    const hoops = [];
    for (let i = 0; i < pts.length; i += 1) hoops.push({ at: [pts[i].x, y, pts[i].y], rot: [0, -Math.atan2(pts[(i + 1) % pts.length].y - pts[i].y, pts[(i + 1) % pts.length].x - pts[i].x), 0] });
    inst(parent, new THREE.TorusGeometry(0.12, 0.008, 5, 12, Math.PI), ctx.m.metal, hoops, 'hoops');
    inst(parent, roundedBox(1, 0.12, 0.1, 0.02, 1).translate(0, 0.06, 0), mat.stone('#d2c8b4'), items, 'edging');
  } else if (st === 'modern') inst(parent, new THREE.BoxGeometry(1, 0.22, 0.012).translate(0, 0.11, 0), M.metal('#8a4a2a', 0.8), items, 'edging');
  else if (st === 'rustic') inst(parent, new THREE.CylinderGeometry(0.06, 0.06, 1, 8).rotateZ(Math.PI / 2).translate(0, 0.06, 0), ctx.m.bark, items, 'edging');
  else if (st === 'japanese') inst(parent, new THREE.IcosahedronGeometry(0.09, 0).scale(1.4, 0.8, 1).translate(0, 0.05, 0), mat.stone('#8a857c'), pts.map((p) => ({ at: [p.x, y, p.y], rot: [0, p.x * 3, 0] })), 'edging');
  else inst(parent, roundedBox(1, 0.1, 0.11, 0.015, 1).translate(0, 0.05, 0), mat.brick('#a0523a'), items, 'edging');
}

export const FLOWER_BED_VARIANTS = { round: {}, long: {}, raised: {}, island: {}, border: {} };
export const createFlowerBed = defineType('flower-bed', FLOWER_BED_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  let shape;
  let y = 0.06;
  let W;
  let D;
  if (variant === 'round') { W = D = 3 * k; shape = new THREE.Shape().absellipse(0, 0, W / 2, D / 2, 0, Math.PI * 2); }
  else if (variant === 'long' || variant === 'border') { W = (variant === 'border' ? 6 : 5) * k; D = variant === 'border' ? 1.2 : 1.6; shape = rrShape(W, D, variant === 'border' ? 0.1 : 0.6); }
  else if (variant === 'island') { W = 4.2 * k; D = 2.6 * k; shape = blobShape(W / 2, D / 2, ctx.r, { n: 9, wobble: 0.2 }); }
  else { W = 2.6 * k; D = 1.4; shape = rrShape(W, D, 0.08); }
  const pts = shape.getPoints(variant === 'round' ? 40 : 30);
  if (variant === 'raised') {
    const wall = ctx.style === 'modern' ? mat.steel('#6a4030') : ctx.style === 'rustic' ? ctx.m.wood : ctx.style === 'japanese' ? M.wood('#3b2a22') : ctx.style === 'victorian' ? mat.brick() : ctx.m.stone;
    const outer = rrShape(W + 0.2, D + 0.2, 0.1);
    outer.holes.push(new THREE.Path(rrShape(W, D, 0.06).getPoints(40).reverse()));
    mesh(slabFromShape(outer, 0.6, { bevel: 0.02 }), wall, { parent: root, name: 'planter-wall' });
    mesh(slabFromShape(rrShape(W + 0.01, D + 0.01, 0.06), 0.52, { bevel: 0 }), ctx.m.soil, { parent: root, name: 'soil' });
    if (ctx.style === 'rustic') inst(root, roundedBox(W + 0.22, 0.14, 0.03, 0.01, 1), M.wood('#7a5634'), [0.1, 0.25, 0.4, 0.55].map((yy) => ({ at: [0, yy, D / 2 + 0.11] })), 'boards');
    y = 0.52;
    // bench seat ledge on the long side
    mesh(roundedBox(W + 0.3, 0.05, 0.36, 0.015), ctx.m.wood, { parent: root, at: [0, 0.625, 0] });
  } else {
    mesh(slabFromShape(shape.clone ? shape : shape, 0.08, { bevel: 0.02 }), ctx.m.mulch, { parent: root, name: 'bed' });
    edging(root, ctx, pts, 0);
    y = 0.08;
  }
  const inside = () => {
    const x = (ctx.r() - 0.5) * W * 0.92;
    const z = (ctx.r() - 0.5) * D * 0.92;
    if (variant === 'round' && (x * x) / ((W / 2) ** 2) + (z * z) / ((D / 2) ** 2) > 0.8) return [];
    if (variant === 'island' && (x * x) / ((W / 2) ** 2) + (z * z) / ((D / 2) ** 2) > 0.6) return [];
    return [x, z];
  };
  planting(root, ctx, inside, W * D * (variant === 'round' ? 0.78 : 1), y, { tall: variant === 'border' ? 0.6 : 0.35 });
  // centrepiece
  if (variant === 'round' || variant === 'island') {
    place(root, bush(ctx, ctx.style === 'japanese' ? 'azalea' : ctx.style === 'victorian' ? 'topiary-cone' : ctx.style === 'modern' ? 'boxwood' : 'rose-bush'), 0, 0, { y });
  }
  if (variant === 'border') {
    // tall plants at the back: canes with blooms
    const canes = [];
    const tops = [];
    for (let i = 0; i < 12; i++) {
      const x = -W / 2 + 0.3 + (i / 11) * (W - 0.6);
      canes.push({ at: [x, y + 0.6, -D / 2 + 0.3], s: [1, 1.2, 1] });
      tops.push([x, y + 1.2, -D / 2 + 0.3]);
    }
    inst(root, new THREE.CylinderGeometry(0.012, 0.012, 1, 5), mat.leaf('#4a7a2a'), canes, 'canes');
    if (!ctx.winter) {
      const spike = new THREE.ConeGeometry(0.06, 0.4, 8).translate(0, 0.2, 0);
      inst(root, spike, mat.bloom(ctx.autumn ? '#c06a2a' : '#7a5ac8'), tops.map((p) => ({ at: p })), 'spikes');
    }
  }
  return [];
});

/* -------------------------------- Rose arch -------------------------------- */

export const ROSE_ARCH_VARIANTS = { arch: {}, tunnel: {}, gothic: { style: 'victorian' } };
export const createRoseArch = defineType('rose-arch', ROSE_ARCH_VARIANTS, (root, ctx, v, variant) => {
  const W = 1.3 * Math.sqrt(ctx.k);
  const H = 2.1;
  const n = variant === 'tunnel' ? 4 : 1;
  const gap = 1.0;
  const st = ctx.style;
  const fm = st === 'modern' ? mat.steel('#30353a') : st === 'rustic' ? ctx.m.bark : st === 'japanese' ? M.wood('#b8a060') : st === 'classic' ? mat.paint('#f2efe6') : ctx.m.metal;
  const r = st === 'rustic' ? 0.05 : st === 'japanese' ? 0.03 : 0.018;
  pad(root, W + 1.2, (n - 1) * gap + 1.4, st === 'rustic' ? ctx.m.gravel : ctx.m.stone, { h: 0.04, r: 0.1, name: 'path' });
  const leafPts = [];
  const bloomPts = [];
  for (let i = 0; i < n; i++) {
    const z = (i - (n - 1) / 2) * gap;
    for (const dz of [-0.2, 0.2]) {
      const pts = [];
      const N = 16;
      for (let j = 0; j <= N; j++) {
        const t = j / N;
        let x;
        let y;
        if (st === 'modern' || st === 'rustic') {
          // square-topped frame with rounded corners
          const per = 2 * H + W;
          const d = t * per;
          if (d < H) { x = -W / 2; y = d; } else if (d < H + W) { x = -W / 2 + (d - H); y = H; } else { x = W / 2; y = H - (d - H - W); }
        } else {
          const a = Math.PI * (1 - t);
          const pointed = variant === 'gothic' || st === 'victorian';
          x = Math.cos(a) * W / 2;
          y = H * 0.7 + Math.sin(a) * (pointed ? H * 0.42 * (1 - Math.abs(Math.cos(a)) * 0.1) : W / 2);
          if (pointed) y += (1 - Math.abs(Math.cos(a))) * 0.15;
          if (j === 0 || j === N) y = H * 0.7;
        }
        pts.push([x, y, z + dz]);
      }
      pts.unshift([-W / 2, 0.04, z + dz]);
      pts.push([W / 2, 0.04, z + dz]);
      curveTube(pts, r, fm, { parent: root, segments: 64, radialSegments: 8, name: 'frame' });
      if (dz < 0) for (let j = 2; j < pts.length - 2; j += 1) {
        const [x, y] = pts[j];
        const lp = [x, y, z + (ctx.r() < 0.5 ? -0.2 : 0.2)];
        leafPts.push(lp);
        if (ctx.r() < 0.5) bloomPts.push([x + (ctx.r() - 0.5) * 0.06, y + 0.06, lp[2] + (ctx.r() - 0.5) * 0.06]);
      }
    }
    // rungs joining the two frames
    const rungs = [];
    for (let y = 0.3; y < H * 0.7; y += 0.3) for (const sx of [-1, 1]) rungs.push({ at: [sx * W / 2, y, z] });
    inst(root, new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.4, 6).rotateX(Math.PI / 2), fm, rungs, 'rungs');
  }
  // climbing rose canes up the sides
  for (let i = 0; i < n; i++) {
    const z = (i - (n - 1) / 2) * gap;
    for (const sx of [-1, 1]) for (let y = 0.2; y < H * 0.7; y += 0.22) {
      const lp = [sx * W / 2 + (ctx.r() - 0.5) * 0.06, y, z + (ctx.r() < 0.5 ? -0.2 : 0.2) + (ctx.r() - 0.5) * 0.06];
      leafPts.push(lp);
      if (ctx.r() < 0.45) bloomPts.push([lp[0] + sx * 0.05, lp[1] + 0.03, lp[2]]);
    }
  }
  const keep = ctx.winter ? 0.3 : 1;
  leafClusters(root, ctx, leafPts.filter(() => ctx.r() < keep), { size: 0.17 });
  if (!ctx.winter) {
    const rose = new THREE.SphereGeometry(1, 10, 8);
    const c = ctx.autumn ? ['#a8371f', '#d8902a'] : st === 'japanese' ? ['#f2b8c8', '#f4f1ea'] : st === 'victorian' ? ['#a0122a', '#d8264a'] : ['#e04a6a', '#f4f1ea', '#f29ab0'];
    c.forEach((col, ci) => inst(root, rose, mat.bloom(col), bloomPts.filter((_, i) => i % c.length === ci).map((p) => ({ at: p, s: 0.05 })), `roses_${ci}`));
  }
  return [];
});

/* -------------------------------- Hedge maze -------------------------------- */

export const HEDGE_MAZE_VARIANTS = { straight: {}, corner: {}, junction: {}, centre: { style: 'victorian' } };
export const createHedgeMaze = defineType('hedge-maze', HEDGE_MAZE_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const S = 6 * k;
  const H = ctx.style === 'modern' ? 1.1 : ctx.style === 'victorian' ? 2.2 : 1.8;
  const T = 0.8;
  const wild = ctx.style === 'rustic' || ctx.cond === 'overgrown';
  pad(root, S + 1, S + 1, ctx.style === 'modern' ? ctx.m.concrete : ctx.m.gravel, { h: 0.04, r: 0.1, name: 'gravel' });
  const y = 0.04;
  const walls = {
    straight: [[-S / 2, -1.3, S, 0], [-S / 2, 1.3, S, 0]],
    corner: [[-S / 2, -1.3, S, 0], [-S / 2, 1.3, S / 2 - 1.3 + 0.4, 0], [1.3, -1.3, S / 2 + 1.3, 1], [-1.3 + 0.4, 1.3, S / 2 - 1.3 - 0.4, 1]],
    junction: [[-S / 2, -1.3, S, 0], [-S / 2, 1.3, S / 2 - 1.7, 0], [1.7, 1.3, S / 2 - 1.7, 0]],
    centre: [[-S / 2, -S / 2 + 0.4, S / 2 - 1, 0], [1, -S / 2 + 0.4, S / 2 - 1, 0], [-S / 2, S / 2 - 0.4, S, 0], [-S / 2 + 0.4, -S / 2 + 0.4, S - 0.8, 1], [S / 2 - 0.4, -S / 2 + 0.4, S - 0.8, 1]],
  }[variant];
  for (const [x, z, L, vert] of walls) {
    if (vert) hedgeBlock(root, ctx, L, H, T, { at: [x, y, z + L / 2], rotY: Math.PI / 2, wild });
    else hedgeBlock(root, ctx, L, H, T, { at: [x + L / 2, y, z], wild });
    if (ctx.style === 'victorian') {
      const balls = [];
      const ex = vert ? [[x, z + 0.4], [x, z + L - 0.4]] : [[x + 0.4, z], [x + L - 0.4, z]];
      for (const [bx, bz] of ex) balls.push([bx, y + H + 0.14, bz]);
      for (const p of balls) mesh(new THREE.SphereGeometry(0.24, 14, 10), ctx.m.leaf[1], { parent: root, at: p });
    }
  }
  if (variant === 'centre') {
    mesh(roundedBox(0.7, 0.9, 0.7, 0.04), ctx.m.stone, { parent: root, at: [0, y + 0.45, 0] });
    mesh(new THREE.SphereGeometry(0.3, 24, 16), M.metal('#b8913a', 0.3), { parent: root, at: [0, y + 1.2, 0], name: 'globe' });
    parkBench(root, ctx, 0, S / 2 - 1.3, Math.PI, y);
  } else if (variant === 'junction') parkBench(root, ctx, 0, -0.75, 0, y);
  return [];
});

/* ------------------------------- Rock garden ------------------------------- */

export const ZEN_GARDEN_VARIANTS = { classic: { style: 'japanese' }, lantern: { style: 'japanese' }, 'pond-garden': { style: 'japanese' }, moss: { style: 'japanese' } };
export const createZenGarden = defineType('zen-garden', ZEN_GARDEN_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const W = 7 * k;
  const D = 4.5 * k;
  const frame = M.wood('#3b2a22');
  const outer = rrShape(W + 0.3, D + 0.3, 0.04);
  outer.holes.push(new THREE.Path(rrShape(W, D, 0.03).getPoints(24).reverse()));
  mesh(slabFromShape(outer, 0.18, { bevel: 0.01 }), frame, { parent: root, name: 'border' });
  // raked gravel: rippled surface
  const g = new THREE.PlaneGeometry(W, D, Math.round(W * 12), Math.round(D * 12));
  g.rotateX(-Math.PI / 2);
  const rocks = [[-W * 0.25, -D * 0.1, 0.55], [W * 0.18, D * 0.15, 0.4], [W * 0.32, -D * 0.25, 0.3]];
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    let d = Infinity;
    let rr = 1;
    for (const [rx, rz, s] of rocks) { const dd = Math.hypot(x - rx, z - rz) - s * 1.2; if (dd < d) { d = dd; rr = s; } }
    const wave = d < 1.2 ? Math.sin(d * Math.PI * 6) : Math.sin(z * Math.PI * 6);
    void rr;
    p.setY(i, 0.1 + wave * 0.008);
  }
  g.computeVertexNormals();
  mesh(g, mat.gravel(ctx.winter ? '#f0f2f4' : '#e4e0d6'), { parent: root, name: 'raked-gravel' });
  mesh(roundedBox(W, 0.09, D, 0.01), mat.gravel('#cfc9bc'), { parent: root, at: [0, 0.045, 0] });
  for (const [x, z, s] of rocks) {
    stone(root, ctx, x, 0.1, z, s, { flat: 0.9, material: mat.stone('#6f6b64') });
    // moss collar
    if (variant !== 'classic' || ctx.cond === 'overgrown') mesh(new THREE.CylinderGeometry(s * 1.1, s * 1.25, 0.06, 18), mat.lawn(ctx.autumn ? '#7a7a3a' : '#4f7a32'), { parent: root, at: [x, 0.11, z] });
  }
  const anims = [];
  if (variant === 'lantern' || variant === 'pond-garden') {
    const lamps = lampSet('lamps', 'fog');
    parkLamp(root, { ...ctx, style: 'japanese' }, lamps, -W / 2 + 0.6, D / 2 - 0.6);
    anims.push(lampOn('lamps', 3));
  }
  if (variant === 'pond-garden') {
    mesh(slabFromShape(blobShape(1.1, 0.7, ctx.r), 0.03, { y0: 0.09, bevel: 0 }), ctx.m.water, { parent: root, at: [-W * 0.05, 0, D * 0.25], name: 'water' });
    // tsukubai-style water basin (generic): stone bowl and bamboo spout
    mesh(lathe([[0.001, 0], [0.3, 0], [0.32, 0.25], [0.26, 0.25], [0.24, 0.08], [0.001, 0.08]], 20), mat.stone('#77736c'), { parent: root, at: [W / 2 - 0.7, 0.1, D / 2 - 0.7] });
    curveTube([[W / 2 - 0.25, 0.1, D / 2 - 0.45], [W / 2 - 0.25, 0.65, D / 2 - 0.45], [W / 2 - 0.5, 0.55, D / 2 - 0.62]], 0.025, M.wood('#b8a060'), { parent: root });
  }
  if (variant === 'moss') {
    for (let i = 0; i < 5; i++) mesh(slabFromShape(blobShape(0.6 + ctx.r() * 0.5, 0.4 + ctx.r() * 0.4, ctx.r), 0.07, { y0: 0.1, bevel: 0.03 }), mat.lawn(ctx.winter ? '#e8eef0' : ctx.autumn ? '#7a7a3a' : '#4f7a32'), { parent: root, at: [(ctx.r() - 0.5) * W * 0.7, 0, (ctx.r() - 0.5) * D * 0.6], name: 'moss' });
    place(root, bush(ctx, 'azalea'), W / 2 - 0.8, -D / 2 + 0.8, { y: 0.1 });
  }
  // bamboo fence along the back
  const bam = M.wood(ctx.winter ? '#a89a6a' : '#b8a060');
  const canes = [];
  for (let x = -W / 2; x <= W / 2; x += 0.07) canes.push({ at: [x, 0.9, -D / 2 - 0.25] });
  inst(root, new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8), bam, canes, 'bamboo-fence');
  for (const yy of [0.5, 1.4]) tube([-W / 2, yy, -D / 2 - 0.21], [W / 2, yy, -D / 2 - 0.21], 0.02, M.wood('#3b2a22'), { parent: root });
  return anims;
});

/* ------------------------------ Garden plots ------------------------------ */

function crops(parent, ctx, x0, z0, w, d, y, kind) {
  const items = [];
  const nx = Math.max(2, Math.round(w / 0.35));
  const nz = Math.max(1, Math.round(d / 0.35));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) items.push([x0 - w / 2 + ((i + 0.5) / nx) * w, y, z0 - d / 2 + ((j + 0.5) / nz) * d]);
  if (ctx.winter) return;
  if (kind === 'lettuce') leafClusters(parent, ctx, items.map(([x, yy, z]) => [x, yy + 0.06, z]), { size: 0.12 });
  else if (kind === 'cabbage') inst(parent, new THREE.SphereGeometry(0.13, 12, 10), mat.leaf(ctx.autumn ? '#6a7a4a' : '#7aa05a'), items.map(([x, yy, z]) => ({ at: [x, yy + 0.1, z] })), 'cabbages');
  else if (kind === 'tomato') {
    inst(parent, new THREE.CylinderGeometry(0.01, 0.01, 1.2, 5), M.wood('#a08050'), items.map(([x, yy, z]) => ({ at: [x, yy + 0.6, z] })), 'canes');
    leafClusters(parent, ctx, items.flatMap(([x, yy, z]) => [[x, yy + 0.4, z], [x, yy + 0.8, z]]), { size: 0.13 });
    inst(parent, new THREE.SphereGeometry(0.035, 8, 6), mat.bloom(ctx.autumn ? '#d23a1a' : '#e0402a'), items.map(([x, yy, z]) => ({ at: [x + 0.04, yy + 0.44, z] })), 'tomatoes');
  } else if (kind === 'pumpkin') {
    const pk = lathe([[0.001, 0], [0.12, 0.02], [0.18, 0.09], [0.17, 0.17], [0.08, 0.22], [0.001, 0.2]], 16);
    leafClusters(parent, ctx, items.map(([x, yy, z]) => [x - 0.1, yy + 0.05, z]), { size: 0.14 });
    inst(parent, pk, mat.bloom(ctx.autumn ? '#e07a1a' : '#8aa040'), items.filter((_, i) => i % 2 === 0).map(([x, yy, z]) => ({ at: [x, yy, z] })), 'pumpkins');
  } else {
    // carrot / onion tops
    const top = new THREE.ConeGeometry(0.03, 0.2, 5).translate(0, 0.1, 0);
    inst(parent, top, mat.leaf('#5a9a3a'), items.map(([x, yy, z]) => ({ at: [x, yy, z] })), 'tops');
  }
}

export const GARDEN_PLOTS_VARIANTS = { 'raised-bed': {}, rows: {}, allotment: { style: 'rustic' }, 'herb-spiral': {} };
export const createGardenPlots = defineType('garden-plots', GARDEN_PLOTS_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const st = ctx.style;
  const wall = st === 'modern' ? M.metal('#8a4a2a', 0.8) : st === 'victorian' ? mat.brick() : st === 'japanese' ? M.wood('#b8a060') : M.wood(st === 'rustic' ? '#7a5634' : '#a87a4c');
  const bed = (x, z, w, d, kind, h = 0.4) => {
    const outer = rrShape(w + 0.1, d + 0.1, 0.03);
    outer.holes.push(new THREE.Path(rrShape(w - 0.02, d - 0.02, 0.02).getPoints(16).reverse()));
    mesh(slabFromShape(outer, h, { bevel: 0.01 }), wall, { parent: root, at: [x, 0.04, z], name: 'bed' });
    mesh(roundedBox(w - 0.01, h - 0.06, d - 0.01, 0.01), ctx.m.soil, { parent: root, at: [x, 0.04 + (h - 0.06) / 2, z] });
    crops(root, ctx, x, z, w - 0.2, d - 0.2, 0.04 + h - 0.06, kind);
  };
  const kinds = ctx.autumn ? ['pumpkin', 'cabbage', 'pumpkin', 'carrot'] : ['lettuce', 'tomato', 'cabbage', 'carrot'];
  if (variant === 'herb-spiral') {
    pad(root, 4 * k, 4 * k, ctx.m.lawn, { h: 0.04, shape: 'round', name: 'lawn' });
    const sm = st === 'modern' ? ctx.m.concrete : st === 'victorian' ? mat.brick() : ctx.m.stone;
    const items = [];
    for (let i = 0; i < 70; i++) {
      const t = i / 70;
      const a = t * Math.PI * 3.2;
      const r = 1.5 * k * (1 - t * 0.75);
      const h = 0.15 + t * 0.85;
      items.push({ at: [Math.cos(a) * r, 0.04 + h / 2, Math.sin(a) * r], s: [0.22, h, 0.2], rot: [0, -a, 0] });
    }
    inst(root, roundedBox(1, 1, 1, 0.15, 1), sm, items, 'spiral-wall');
    mesh(new THREE.ConeGeometry(1.3 * k, 0.9, 24).translate(0, 0.45, 0), ctx.m.soil, { parent: root, at: [0, 0.04, 0] });
    const herb = [];
    for (let i = 0; i < 40; i++) {
      const t = ctx.r();
      const a = t * Math.PI * 3.2 + 0.4;
      const r = 1.3 * k * (1 - t * 0.75) * 0.85;
      herb.push([Math.cos(a) * r, 0.04 + 0.9 * (1 - r / (1.3 * k)) + 0.02, Math.sin(a) * r]);
    }
    if (!ctx.winter) leafClusters(root, ctx, herb, { size: 0.12 });
    if (!ctx.winter) blooms(root, ctx, herb.filter((_, i) => i % 3 === 0).map(([x, y, z]) => [x, y + 0.12, z]), { size: 0.03 });
    return [];
  }
  const W = (variant === 'allotment' ? 8 : 6) * k;
  const D = variant === 'raised-bed' ? 3 : 6;
  pad(root, W + 1, D + 1, variant === 'raised-bed' ? ctx.m.gravel : mat.lawn(ctx.winter ? '#eef3f7' : '#6a8a3a'), { h: 0.04, r: 0.1, name: variant === 'raised-bed' ? 'gravel' : 'lawn' });
  if (variant === 'raised-bed') {
    bed(-1.4 * k, 0, 2.2 * k, 1.2, kinds[0]);
    bed(1.4 * k, 0, 2.2 * k, 1.2, kinds[1], 0.6);
    mesh(lathe([[0.001, 0], [0.2, 0], [0.22, 0.25], [0.2, 0.26], [0.18, 0.02], [0.001, 0.02]], 18), M.plastic('#2f6a4a', 0.5), { parent: root, at: [0, 0.04, 1.1], name: 'watering-tub' });
    return [];
  }
  const nb = variant === 'allotment' ? 3 : 4;
  for (let i = 0; i < nb; i++) bed(-W / 2 + 0.9 + i * ((W - (variant === 'allotment' ? 3 : 1.8)) / Math.max(1, nb - 1)), variant === 'allotment' ? 0.8 : 0, 1.1, D - 2, kinds[i % 4], 0.3);
  if (variant === 'allotment') {
    // small shed, water butt and compost bin
    const sx = W / 2 - 1.1;
    const sz = -D / 2 + 1.2;
    mesh(roundedBox(1.6, 1.9, 1.3, 0.03), M.wood(st === 'modern' ? '#5a6068' : '#6f8a6a'), { parent: root, at: [sx, 0.04 + 0.95, sz], name: 'shed' });
    const roof = mesh(roundedBox(1.9, 0.08, 1.6, 0.02), mat.paint('#30353a'), { parent: root, at: [sx, 0.04 + 1.95, sz], rot: [0.12, 0, 0] });
    void roof;
    mesh(roundedBox(0.7, 1.6, 0.04, 0.01), M.wood('#5b3a24'), { parent: root, at: [sx, 0.04 + 0.85, sz + 0.66] });
    mesh(lathe([[0.001, 0], [0.32, 0], [0.34, 0.9], [0.3, 0.92], [0.001, 0.92]], 20), M.plastic('#2a2d30', 0.5), { parent: root, at: [sx - 1.15, 0.04, sz], name: 'water-butt' });
    const slats = [];
    for (let i = 0; i < 5; i++) for (const [x, z, ry] of [[0, 0.45, 0], [0, -0.45, 0], [0.45, 0, Math.PI / 2], [-0.45, 0, Math.PI / 2]]) slats.push({ at: [-W / 2 + 1 + x, 0.04 + 0.1 + i * 0.18, -D / 2 + 1 + z], rot: [0, ry, 0] });
    inst(root, roundedBox(0.95, 0.14, 0.03, 0.01, 1), M.wood('#8a6440'), slats, 'compost-bin');
    inst(root, roundedBox(0.06, 0.95, 0.06, 0.01, 1), M.wood('#6b4a2e'), [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => ({ at: [-W / 2 + 1 + a * 0.46, 0.04 + 0.475, -D / 2 + 1 + b * 0.46] })), 'compost-posts');
    mesh(roundedBox(0.85, 0.5, 0.85, 0.08), ctx.m.soil, { parent: root, at: [-W / 2 + 1, 0.29, -D / 2 + 1] });
  }
  return [];
});
