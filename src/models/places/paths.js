import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, roundedBox, lathe } from '../../core/utils.js';
import { createTrashCan } from '../street.js';
import { defineType, pad, inst, lampSet, lampOn, parkLamp, place, trimFor, mat, slabFromShape, blobShape } from './kit.js';
import { parkBench, pond } from './structures.js';

/* Lamp-lined park paths and stepping-stone paths. */

/** Closed outline (THREE.Shape) of a ribbon of width w along points [[x,z],…]. Shape y = world z. */
function ribbon(pts, w) {
  const L = [];
  const R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nx = -Math.sin(ang) * w / 2;
    const nz = Math.cos(ang) * w / 2;
    L.push([pts[i][0] + nx, pts[i][1] + nz]);
    R.push([pts[i][0] - nx, pts[i][1] - nz]);
  }
  const s = new THREE.Shape([...L, ...R.reverse()].map(([x, z]) => new THREE.Vector2(x, z)));
  return { shape: s, L, R: R.reverse() };
}

function surfaceMat(ctx) {
  return { classic: mat.gravel('#c9b994'), victorian: mat.stone('#cbbfa8'), modern: mat.concrete('#c9c5bd'), rustic: mat.gravel('#b8a888'), japanese: mat.gravel('#e4e0d6') }[ctx.style];
}

function edge(parent, ctx, line, y) {
  const items = [];
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i];
    const [bx, bz] = line[i + 1];
    items.push({ at: [(ax + bx) / 2, y, (az + bz) / 2], rot: [0, -Math.atan2(bz - az, bx - ax), 0], s: [Math.hypot(bx - ax, bz - az) + 0.02, 1, 1] });
  }
  const st = ctx.style;
  if (st === 'rustic') inst(parent, new THREE.CylinderGeometry(0.06, 0.06, 1, 8).rotateZ(Math.PI / 2).translate(0, 0.04, 0), ctx.m.bark, items, 'edging');
  else if (st === 'modern') inst(parent, new THREE.BoxGeometry(1, 0.06, 0.01).translate(0, 0.02, 0), M.metal('#8a4a2a', 0.8), items, 'edging');
  else if (st === 'japanese') inst(parent, new THREE.IcosahedronGeometry(0.07, 0).scale(1.4, 0.7, 1).translate(0, 0.03, 0), mat.stone('#8a857c'), line.map(([x, z]) => ({ at: [x, y, z] })), 'edging');
  else inst(parent, roundedBox(1, 0.06, 0.1, 0.015, 1).translate(0, 0.02, 0), st === 'victorian' ? mat.stone('#b8ae98') : mat.brick('#a0523a'), items, 'edging');
}

/** Paver joints / flagstones on top of the path surface (victorian, modern). */
function pavers(parent, ctx, pts, w, y) {
  if (ctx.style !== 'victorian' && ctx.style !== 'modern' && ctx.style !== 'japanese') return;
  const items = [];
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, y, z)));
  const len = curve.getLength();
  const step = ctx.style === 'modern' ? 1.2 : ctx.style === 'japanese' ? 0.75 : 0.6;
  for (let d = step / 2; d < len; d += step) {
    const p = curve.getPointAt(d / len);
    const t = curve.getTangentAt(d / len);
    const ry = -Math.atan2(t.z, t.x);
    if (ctx.style === 'japanese') items.push({ at: [p.x + (ctx.r() - 0.5) * 0.3, y, p.z + (ctx.r() - 0.5) * 0.4], rot: [0, ctx.r() * 3, 0], s: [0.5 + ctx.r() * 0.2, 1, 0.4 + ctx.r() * 0.2] });
    else items.push({ at: [p.x, y, p.z], rot: [0, ry, 0], s: [step * 0.95, 1, w - 0.1] });
  }
  const g = ctx.style === 'japanese' ? new THREE.CylinderGeometry(0.5, 0.52, 0.04, 9).translate(0, 0.02, 0) : roundedBox(1, 0.012, 1, 0.004, 1).translate(0, 0.006, 0);
  inst(parent, g, ctx.style === 'japanese' ? mat.stone('#8f8a80') : ctx.style === 'modern' ? mat.concrete('#d6d2ca') : mat.stone('#d8ccb4'), items, 'pavers');
}

export const PARK_PATH_VARIANTS = { straight: {}, curve: {}, crossing: {}, 't-junction': {}, 'plaza-end': {} };
export const createParkPath = defineType('park-path', PARK_PATH_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const L = 10 * k;
  const w = 2.4 * Math.min(k, 1.2);
  const lawnH = 0.05;
  pad(root, L + 0.4, L * (variant === 'straight' ? 0.5 : 1) + 0.4, ctx.m.lawn, { h: lawnH, r: 0.1, name: 'lawn' });
  const runs = [];
  const half = L / 2;
  if (variant === 'straight') runs.push([[-half, 0], [half, 0]]);
  else if (variant === 'curve') {
    const pts = [];
    for (let i = 0; i <= 20; i++) { const a = (i / 20) * (Math.PI / 2); pts.push([-half + Math.sin(a) * half, -half + Math.cos(a) * half]); }
    runs.push(pts.map(([x, z]) => [x * 1, z * 1]).map(([x, z]) => [x, z]).reverse().map(([x, z]) => [x, z]));
  } else if (variant === 'crossing') runs.push([[-half, 0], [half, 0]], [[0, -half], [0, half]]);
  else if (variant === 't-junction') runs.push([[-half, 0], [half, 0]], [[0, 0], [0, half]]);
  else runs.push([[-half, 0], [0, 0]]);
  const sm = surfaceMat(ctx);
  const y0 = lawnH - 0.01;
  for (const pts of runs) {
    const dense = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 0.8));
      for (let j = 0; j < n; j++) dense.push([ax + ((bx - ax) * j) / n, az + ((bz - az) * j) / n]);
    }
    dense.push(pts[pts.length - 1]);
    const { shape, L: l, R: r } = ribbon(dense, w);
    mesh(slabFromShape(shape, 0.035, { y0, bevel: 0.005 }), sm, { parent: root, name: 'path' });
    edge(root, ctx, l, y0 + 0.01);
    edge(root, ctx, r, y0 + 0.01);
    pavers(root, ctx, dense, w, y0 + 0.035);
  }
  if (variant === 'plaza-end') {
    mesh(slabFromShape(new THREE.Shape().absellipse(0, 0, 2.6 * k, 2.6 * k, 0, Math.PI * 2), 0.035, { y0, bevel: 0.005 }), sm, { parent: root, at: [half * 0.45, 0, 0], name: 'plaza' });
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + i * (Math.PI / 2);
      parkBench(root, ctx, half * 0.45 + Math.cos(a) * 2.0 * k, Math.sin(a) * 2.0 * k, -a - Math.PI / 2, y0 + 0.035);
    }
    mesh(lathe([[0.001, 0], [0.5, 0], [0.5, 0.3], [0.45, 0.3], [0.45, 0.05], [0.001, 0.05]], 24), ctx.m.stone, { parent: root, at: [half * 0.45, y0 + 0.035, 0], name: 'planter' });
    mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.24, 24), ctx.m.soil, { parent: root, at: [half * 0.45, y0 + 0.155, 0] });
  }
  // lamps along the runs
  const lamps = lampSet('lamps', 'fog');
  const main = runs[0];
  const curve = new THREE.CatmullRomCurve3(main.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const len = curve.getLength();
  const n = Math.max(2, Math.round(len / 5));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const p = curve.getPointAt(t);
    const tg = curve.getTangentAt(t);
    const side = i % 2 ? 1 : -1;
    const off = w / 2 + 0.45;
    parkLamp(root, ctx, lamps, p.x - tg.z * off * side, p.z + tg.x * off * side);
  }
  if (variant === 'straight' || variant === 'curve') {
    const p = curve.getPointAt(0.5);
    const tg = curve.getTangentAt(0.5);
    const off = w / 2 + 0.55;
    const rot = Math.atan2(-tg.z, tg.x);
    parkBench(root, ctx, p.x + tg.z * off, p.z - tg.x * off, rot + Math.PI, lawnH);
    place(root, createTrashCan({ variant: 'park', trim: trimFor(ctx, ['snowy', 'rusty'], { winter: 'snowy', worn: 'rusty' }) }), p.x + tg.z * off + tg.x * 1.4, p.z - tg.x * off + tg.z * 1.4, { y: lawnH });
  }
  return [lampOn('lamps', 3)];
});

/* ----------------------------- Stepping stones ----------------------------- */

export const STEPPING_STONES_VARIANTS = { straight: {}, curved: {}, 'over-water': { style: 'japanese' }, 'in-gravel': { style: 'japanese' } };
export const createSteppingStones = defineType('stepping-stones', STEPPING_STONES_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const L = 6 * k;
  let y = 0.04;
  if (variant === 'over-water') {
    pond(root, ctx, L / 2 - 0.4, 1.6 * k, { lawnW: L + 2, lawnD: 3.2 * k + 2, lilies: true });
    y = 0;
  } else if (variant === 'in-gravel') {
    pad(root, L + 1.2, 2.6, ctx.m.lawn, { h: 0.04, r: 0.1, name: 'lawn' });
    mesh(slabFromShape(blobShape(L / 2 + 0.2, 0.9, ctx.r, { n: 10, wobble: 0.08 }), 0.03, { y0: 0.03, bevel: 0.005 }), mat.gravel('#e4e0d6'), { parent: root, name: 'gravel' });
    y = 0.06;
  } else pad(root, L + 1, variant === 'curved' ? L * 0.6 : 2.4, ctx.m.lawn, { h: 0.04, r: 0.1, name: 'lawn' });
  const n = Math.round(L / 0.62);
  const items = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    let x = -L / 2 + t * L;
    let z = (i % 2 ? 0.12 : -0.12);
    if (variant === 'curved') z += Math.sin(t * Math.PI) * L * 0.22 - L * 0.11;
    if (variant === 'over-water') z *= 0.5;
    x += (ctx.r() - 0.5) * 0.06;
    const s = 0.9 + ctx.r() * 0.25;
    const h = variant === 'over-water' ? 0.14 : 0.05;
    items.push({ at: [x, (variant === 'over-water' ? 0 : y - 0.02) + h / 2, z], rot: [0, ctx.r() * 3, 0], s: [s, h, s * (0.8 + ctx.r() * 0.3)] });
  }
  const st = ctx.style;
  let g;
  let mt;
  if (st === 'modern') { g = roundedBox(0.5, 1, 0.5, 0.01, 1); mt = mat.concrete('#cfcac2'); }
  else if (st === 'rustic') { g = new THREE.CylinderGeometry(0.24, 0.25, 1, 16); mt = M.wood('#b08a5a'); }
  else if (st === 'victorian') { g = new THREE.CylinderGeometry(0.25, 0.25, 1, 24); mt = mat.stone('#d2c8b4'); }
  else if (st === 'japanese') { g = new THREE.CylinderGeometry(0.26, 0.28, 1, 7); mt = mat.stone('#8a857c'); }
  else { g = new THREE.CylinderGeometry(0.25, 0.27, 1, 9); mt = mat.stone('#a8a090'); }
  inst(root, g, mt, items, 'stones');
  if (st === 'rustic') inst(root, new THREE.CylinderGeometry(0.252, 0.262, 1, 16, 1, true), ctx.m.bark, items, 'bark-rings');
  return [];
});
