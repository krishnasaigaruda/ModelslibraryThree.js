import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, lathe, tube, curveTube, extrudeOutline } from '../../core/utils.js';
import { rotateTrack, clip, pingPong } from '../../core/animation.js';
import { createPicnicTable, createBench } from '../street.js';
import { createWaterPlant, createRock } from '../nature.js';
import { defineType, pad, post, beam, railing, polar, inst, lampSet, lampOn, leafClusters, blooms, place, trimFor, mat, blobShape, slabFromShape, textTex, panel, rrShape } from './kit.js';

/* Park structures: gazebos, pavilions, pergolas, bandstands, gates, footbridges, boardwalks. */

const benchVariant = (ctx) => ({ classic: 'park', victorian: 'park', modern: 'modern', rustic: 'log', japanese: 'backless' })[ctx.style];
const benchTrim = (ctx) => trimFor(ctx, ['snowy', 'rusty', 'damaged'], { winter: 'snowy', worn: 'rusty' });
export const parkBench = (parent, ctx, x, z, rot = 0, y = 0) => place(parent, createBench({ variant: benchVariant(ctx), trim: benchTrim(ctx) }), x, z, { rot, y });

const latheN = (prof, n, phi) => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), n, phi);

/** Solid lathe roof profile for an n-sided (or round) roof of eave radius Re. Base at y=0 (flat soffit). */
export function roofProfile(ctx, Re, rise) {
  switch (ctx.style) {
    case 'victorian':
      return [[0.001, 0], [Re, 0], [Re, 0.06], [Re * 0.86, 0.22], [Re * 0.62, 0.42], [Re * 0.42, rise * 0.62], [Re * 0.3, rise * 0.85], [0.1, rise], [0.001, rise]];
    case 'modern':
      return [[0.001, 0], [Re, 0], [Re, 0.24], [Re * 0.9, 0.3], [0.001, 0.34]];
    case 'rustic':
      return [[0.001, 0], [Re, 0], [Re, 0.14], [0.1, rise * 1.15], [0.001, rise * 1.15]];
    case 'japanese':
      return [[0.001, 0], [Re * 0.95, 0], [Re * 1.06, 0.16], [Re * 1.02, 0.22], [Re * 0.78, 0.34], [Re * 0.52, rise * 0.55], [Re * 0.28, rise * 0.88], [0.08, rise], [0.001, rise]];
    default:
      return [[0.001, 0], [Re, 0], [Re, 0.09], [0.1, rise], [0.001, rise]];
  }
}

/** Polygonal roof + finial at height y. Returns top height. */
export function polyRoof(parent, ctx, n, Re, y, rise = 1.4) {
  const prof = roofProfile(ctx, Re, rise);
  mesh(latheN(prof, n, Math.PI / n), ctx.m.roof, { parent, at: [0, y, 0], name: 'roof' });
  const top = y + prof[prof.length - 1][1];
  if (ctx.style !== 'modern') {
    const fin = ctx.style === 'victorian' ? [[0.001, 0], [0.09, 0], [0.05, 0.12], [0.08, 0.22], [0.02, 0.4], [0.035, 0.46], [0.001, 0.62]]
      : ctx.style === 'japanese' ? [[0.001, 0], [0.1, 0], [0.1, 0.06], [0.04, 0.1], [0.09, 0.2], [0.04, 0.32], [0.001, 0.4]]
      : [[0.001, 0], [0.07, 0], [0.04, 0.1], [0.05, 0.2], [0.001, 0.3]];
    mesh(lathe(fin, 12), ctx.style === 'victorian' ? ctx.m.gold : ctx.style === 'rustic' ? ctx.m.bark : ctx.m.trim, { parent, at: [0, top - 0.02, 0], name: 'finial' });
  }
  return top;
}

/** Gable roof over a rectangle: beams at z=±D/2 with top at y; ridge along x. */
export function gableRoof(parent, ctx, L, D, y, { slope = 0.55, over = 0.45, t = 0.1 } = {}) {
  const Dz = D / 2 + over;
  const ang = Math.atan(slope);
  const len = Dz / Math.cos(ang) + 0.05;
  const mt = ctx.m.roof;
  for (const s of [-1, 1]) {
    // bottom surface passes through the beam's top outer edge
    const zc = s * Dz / 2;
    const yb = y + (D / 2 - Math.abs(zc)) * slope - 0.02;
    const p = mesh(roundedBox(L + over * 2, t, len, 0.02, 2), mt, { parent, name: 'roof' });
    p.position.set(0, yb + (t / 2) / Math.cos(ang), zc);
    p.rotation.x = s * ang;
  }
  // gable infill triangles
  const h = (D / 2) * slope - 0.02;
  const tri = extrudeOutline([[-D / 2, 0], [D / 2, 0], [0, h]], 0.06, { bevel: 0.01 });
  tri.rotateY(Math.PI / 2);
  for (const x of [-L / 2, L / 2]) mesh(tri, ctx.style === 'japanese' ? ctx.m.trim : ctx.m.frame, { parent, at: [x, y, 0] });
  // ridge cap
  const ridgeY = y + (D / 2) * slope - 0.02 + t / Math.cos(ang);
  mesh(new THREE.CylinderGeometry(0.07, 0.07, L + over * 2 + 0.06, 10).rotateZ(Math.PI / 2), ctx.style === 'japanese' ? mat.stone('#2c3034') : mt, { parent, at: [0, ridgeY - 0.03, 0] });
  if (ctx.style === 'japanese') for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.14, 12, 8), mat.stone('#2c3034'), { parent, at: [sx * (L / 2 + over), ridgeY + 0.02, 0] });
  return ridgeY;
}

/* -------------------------------- Gazebo -------------------------------- */

export const GAZEBO_VARIANTS = { octagonal: { n: 8 }, hexagonal: { n: 6 }, square: { n: 4 }, round: { n: 16 } };
export const createGazebo = defineType('gazebo', GAZEBO_VARIANTS, (root, ctx, v) => {
  const n = v.n;
  const R = 1.9 * ctx.k;
  const fh = 0.38;
  const H = 2.5;
  const off = Math.PI / n;
  const lamps = lampSet('lights', 'fog');
  // platform
  const baseMat = ctx.style === 'rustic' ? ctx.m.stone : ctx.m.floor;
  mesh(new THREE.CylinderGeometry(R + 0.2, R + 0.26, fh, n, 1, false, off), ctx.style === 'rustic' || ctx.style === 'japanese' ? ctx.m.stone : ctx.style === 'classic' ? ctx.m.trim : baseMat, { parent: root, at: [0, fh / 2, 0], name: 'platform' });
  if (ctx.style === 'classic' || ctx.style === 'rustic' || ctx.style === 'japanese') mesh(new THREE.CylinderGeometry(R + 0.16, R + 0.16, 0.05, n, 1, false, off), ctx.m.wood, { parent: root, at: [0, fh + 0.025, 0], name: 'deck' });
  const fy = fh + (ctx.style === 'classic' || ctx.style === 'rustic' || ctx.style === 'japanese' ? 0.05 : 0);
  const ap = (R + 0.26) * Math.cos(off);
  mesh(roundedBox(1.3, fh / 2, 0.36, 0.02), ctx.m.stone, { parent: root, at: [0, fh / 4, ap + 0.14], name: 'step' });
  // posts, beams, railings
  const pts = [];
  for (let i = 0; i < n; i++) pts.push(polar(R, off + (i / n) * Math.PI * 2));
  const step = n > 8 ? 2 : 1;
  for (let i = 0; i < n; i += step) post(root, ctx, pts[i][0], pts[i][1], fy, fy + H, { w: n > 8 ? 0.12 : 0.15 });
  const bt = fy + H;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    beam(root, ctx, [a[0], bt - 0.09, a[1]], [b[0], bt - 0.09, b[1]], { h: 0.18, w: 0.12 });
    const front = i === n - 1 || (n > 8 && i === n - 2);
    if (!front) railing(root, ctx, [a[0], fy, a[1]], [b[0], fy, b[1]], { h: 0.9, posts: false });
    if (ctx.style === 'victorian' || ctx.style === 'classic') {
      // brackets / lace under the beam
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const arc = new THREE.TorusGeometry(len / 2, 0.018, 6, 24, Math.PI);
      arc.scale(1, 0.32 / (len / 2), 1);
      arc.rotateZ(Math.PI);
      const m = mesh(arc, ctx.style === 'victorian' ? ctx.m.metal : ctx.m.trim, { parent: root, at: [mid[0], bt - 0.18, mid[1]] });
      m.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    }
  }
  if (ctx.style === 'japanese') for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    beam(root, ctx, [a[0], bt - 0.45, a[1]], [b[0], bt - 0.45, b[1]], { h: 0.08, w: 0.08, material: ctx.m.accent });
  }
  const top = polyRoof(root, ctx, n, R + 0.55, bt, n === 4 ? 1.5 : 1.35);
  // hanging lantern
  const ch = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.55, 6), ctx.m.metal, { parent: root, at: [0, bt - 0.275, 0] });
  void ch;
  const lan = group('lantern', { parent: root, at: [0, bt - 0.55, 0] });
  mesh(new THREE.CylinderGeometry(0.14, 0.05, 0.08, 8), ctx.m.metal, { parent: lan, at: [0, -0.04, 0] });
  lamps.add(lan, { geometry: new THREE.SphereGeometry(0.13, 16, 12).translate(0, -0.2, 0), normal: [0, -1, 0], depth: 0.13 });
  // built-in bench boards inside along the back faces
  for (let i = 1; i < n - 2; i += n > 8 ? 2 : 1) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const mx = (a[0] + b[0]) / 2;
    const mz = (a[1] + b[1]) / 2;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) - 0.2;
    const sg = group('seat', { parent: root, at: [mx * 0.88, fy, mz * 0.88] });
    sg.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    mesh(roundedBox(len, 0.05, 0.38, 0.015), ctx.m.wood, { parent: sg, at: [0, 0.44, 0] });
    for (const sx of [-1, 1]) mesh(roundedBox(0.05, 0.42, 0.3, 0.01), ctx.m.wood, { parent: sg, at: [sx * (len / 2 - 0.1), 0.21, 0] });
  }
  void top;
  return [lampOn('lights', 3)];
});

/* ------------------------------- Pavilion ------------------------------- */

export const PAVILION_VARIANTS = { gable: { L: 7, D: 5, roof: 'gable' }, hip: { L: 6, D: 6, roof: 'hip' }, flat: { L: 7, D: 5, roof: 'flat' }, long: { L: 12, D: 5.5, roof: 'gable' } };
export const createPavilion = defineType('pavilion', PAVILION_VARIANTS, (root, ctx, v) => {
  const L = v.L * ctx.k;
  const D = v.D * Math.min(ctx.k, 1.15);
  const sh = 0.15;
  pad(root, L + 1.2, D + 1.2, ctx.style === 'rustic' ? ctx.m.gravel : ctx.m.concrete, { h: sh, r: 0.1, name: 'slab' });
  const H = 2.9;
  const nx = Math.max(2, Math.round(L / 3.2) + 1);
  const xs = Array.from({ length: nx }, (_, i) => -L / 2 + (i / (nx - 1)) * L);
  const pw = ctx.style === 'rustic' ? 0.26 : 0.2;
  for (const x of xs) for (const z of [-D / 2, D / 2]) post(root, ctx, x, z, sh, sh + H, { w: pw });
  const bt = sh + H;
  for (const z of [-D / 2, D / 2]) beam(root, ctx, [-L / 2 - 0.15, bt - 0.12, z], [L / 2 + 0.15, bt - 0.12, z], { h: 0.24, w: 0.16 });
  for (const x of xs) beam(root, ctx, [x, bt - 0.12, -D / 2], [x, bt - 0.12, D / 2], { h: 0.2, w: 0.12 });
  if (v.roof === 'gable') gableRoof(root, ctx, L, D, bt, { slope: ctx.style === 'rustic' ? 0.75 : 0.5 });
  else if (v.roof === 'hip') {
    const prof = [[0.001, 0], [1, 0], [1, 0.06], [0.04, 1.5], [0.001, 1.5]];
    const g = latheN(prof, 4, Math.PI / 4);
    g.scale((L / 2 + 0.5) / Math.SQRT1_2, 1, (D / 2 + 0.5) / Math.SQRT1_2);
    g.scale(1, ctx.style === 'modern' ? 0.4 : ctx.style === 'rustic' ? 1.3 : 1, 1);
    mesh(g, ctx.m.roof, { parent: root, at: [0, bt, 0], name: 'roof' });
  } else {
    mesh(roundedBox(L + 1, 0.22, D + 1, 0.03), ctx.style === 'modern' ? ctx.m.concrete : ctx.m.roof, { parent: root, at: [0, bt + 0.11, 0], rot: [0.03, 0, 0], name: 'roof' });
    mesh(roundedBox(L + 1.04, 0.1, D + 1.04, 0.02), ctx.m.accent, { parent: root, at: [0, bt + 0.12, 0], name: 'fascia' });
  }
  // tables
  const tableV = ctx.style === 'modern' ? 'modern' : 'classic';
  const tt = trimFor(ctx, ['umbrella', 'barbecue', 'rusty', 'damaged', 'snowy'], { worn: 'rusty', winter: 'snowy' });
  const nt = Math.min(3, Math.max(1, Math.round(L / 3.4)));
  for (let i = 0; i < nt; i++) place(root, createPicnicTable({ variant: tableV, trim: tt }), -L / 2 + ((i + 0.5) / nt) * L, 0, { y: sh, rot: Math.PI / 2 });
  // light under the ridge
  const lamps = lampSet('lights', 'fog');
  for (let i = 0; i < nt; i++) {
    const x = -L / 2 + ((i + 0.5) / nt) * L;
    mesh(roundedBox(0.5, 0.06, 0.14, 0.02), ctx.m.metal, { parent: root, at: [x, bt - 0.27, D / 2 - 0.02] });
    lamps.add(root, { at: [x, bt - 0.301, D / 2 - 0.02], normal: [0, -1, 0], w: 0.4, h: 0.08, shape: 'strip', bezel: false });
  }
  return [lampOn('lights', 3)];
});

/* -------------------------------- Pergola -------------------------------- */

export const PERGOLA_VARIANTS = { straight: { L: 3.6, D: 2.6 }, corner: { L: 3.6, D: 2.6, corner: true }, arched: { L: 4, D: 2.4, arched: true }, walkway: { L: 8, D: 2.6 } };
function pergolaRun(root, ctx, L, D, { arched = false, plants = true, bench = false } = {}) {
  const H = 2.5;
  const nx = Math.max(2, Math.round(L / 2) + 1);
  const xs = Array.from({ length: nx }, (_, i) => -L / 2 + (i / (nx - 1)) * L);
  const pw = ctx.style === 'rustic' ? 0.2 : ctx.style === 'modern' ? 0.18 : 0.15;
  for (const x of xs) for (const z of [-D / 2, D / 2]) post(root, ctx, x, z, 0, H, { w: pw });
  const leafPts = [];
  const bloomPts = [];
  if (arched) {
    for (const x of xs) {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        pts.push([x, H + Math.sin(t * Math.PI) * 0.7, -D / 2 + t * D]);
      }
      curveTube(pts, 0.06, ctx.m.frame, { parent: root, segments: 32, radialSegments: 8 });
    }
    const pur = [];
    for (let i = 1; i < 12; i++) {
      const t = i / 12;
      const y = H + Math.sin(t * Math.PI) * 0.7;
      const z = -D / 2 + t * D;
      pur.push({ at: [0, y + 0.06, z] });
      leafPts.push([(ctx.r() - 0.5) * L, y + 0.15, z]);
      leafPts.push([(ctx.r() - 0.5) * L, y + 0.15, z]);
    }
    inst(root, roundedBox(L + 0.4, 0.06, 0.06, 0.015, 1), ctx.m.frame, pur, 'purlins');
  } else {
    for (const z of [-D / 2, D / 2]) beam(root, ctx, [-L / 2 - 0.35, H + 0.1, z], [L / 2 + 0.35, H + 0.1, z], { h: 0.2, w: 0.08 });
    const nr = Math.round(L / 0.45) + 1;
    const raft = [];
    for (let i = 0; i < nr; i++) {
      const x = -L / 2 - 0.2 + (i / (nr - 1)) * (L + 0.4);
      raft.push({ at: [x, H + 0.27, 0] });
      if (ctx.r() < 0.8) leafPts.push([x, H + 0.4, (ctx.r() - 0.5) * D]);
      leafPts.push([x + 0.2, H + 0.4, (ctx.r() - 0.5) * (D + 0.4)]);
      if (ctx.r() < 0.6) bloomPts.push([x, H + 0.08, (ctx.r() - 0.5) * D]);
    }
    const rg = ctx.style === 'rustic' ? new THREE.CylinderGeometry(0.06, 0.06, D + 0.8, 8).rotateX(Math.PI / 2) : ctx.style === 'japanese' || ctx.style === 'victorian' ? extrudeOutline([[-(D + 0.8) / 2, -0.07], [(D + 0.8) / 2, -0.07], [(D + 0.8) / 2 + 0.05, 0.07], [-(D + 0.8) / 2 - 0.05, 0.07]], 0.05, { bevel: 0.01 }).rotateY(Math.PI / 2) : roundedBox(0.05, 0.14, D + 0.8, 0.01, 1);
    inst(root, rg, ctx.style === 'modern' ? ctx.m.accent : ctx.m.frame, raft, 'rafters');
  }
  if (plants && !(ctx.winter && ctx.style === 'modern')) {
    const vine = M.wood('#5a4330');
    for (const x of [xs[0], xs[xs.length - 1]]) for (const z of [-D / 2, D / 2]) {
      const pts = [];
      const rr = pw / 2 + 0.03;
      for (let i = 0; i <= 20; i++) {
        const a = i * 0.7;
        pts.push([x + Math.cos(a) * rr, (i / 20) * (H + 0.25), z + Math.sin(a) * rr]);
      }
      curveTube(pts, 0.035, vine, { parent: root, segments: 60, radialSegments: 6, name: 'vine' });
      for (let y = 0.4; y < H; y += 0.3) leafPts.push([x + (ctx.r() - 0.5) * 0.2, y, z + (ctx.r() - 0.5) * 0.2]);
    }
    const keep = ctx.winter ? 0.25 : 1;
    leafClusters(root, ctx, leafPts.filter(() => ctx.r() < keep), { size: 0.26 });
    if (!ctx.winter && bloomPts.length) {
      const wis = new THREE.ConeGeometry(0.06, 0.32, 8);
      wis.rotateX(Math.PI);
      wis.translate(0, -0.16, 0);
      const c = ctx.autumn ? '#d8902a' : ctx.style === 'japanese' ? '#9b7bd0' : ctx.style === 'victorian' ? '#c45a8a' : '#a98be0';
      inst(root, wis, mat.bloom(c), bloomPts.map((p) => ({ at: [p[0], p[1] + 0.12, p[2]] })), 'wisteria');
    }
  }
  if (bench) {
    parkBench(root, ctx, -L / 4, -D / 2 + 0.55, 0);
    parkBench(root, ctx, L / 4, D / 2 - 0.55, Math.PI);
  }
}
export const createPergola = defineType('pergola', PERGOLA_VARIANTS, (root, ctx, v, variant) => {
  const L = v.L * ctx.k;
  const D = v.D;
  pad(root, L + 1.4, D + 1.4, ctx.style === 'modern' ? ctx.m.concrete : ctx.style === 'rustic' ? ctx.m.gravel : ctx.m.stone, { h: 0.04, r: 0.08, name: 'paving' });
  const top = group('run', { parent: root, at: [0, 0.04, 0] });
  pergolaRun(top, ctx, L, D, { arched: v.arched, bench: variant !== 'arched' });
  if (v.corner) {
    pad(root, D + 1.4, L, ctx.style === 'modern' ? ctx.m.concrete : ctx.style === 'rustic' ? ctx.m.gravel : ctx.m.stone, { h: 0.04, r: 0.08, at: [L / 2 + D / 2 + 0.7, 0, -L / 2 + D / 2 + 0.7] });
    const wing = group('wing', { parent: root, at: [L / 2 + D / 2 + 0.7, 0.04, -L / 2 + D / 2 + 0.7], rot: [0, Math.PI / 2, 0] });
    pergolaRun(wing, ctx, L - D - 1.4 > 1.5 ? L - D - 1.4 : 2, D, { bench: false });
  }
  return [];
});

/* ------------------------------- Bandstand ------------------------------- */

export const BANDSTAND_VARIANTS = { octagonal: { n: 8, style: 'victorian' }, round: { n: 16, style: 'victorian' }, shell: { shell: true, style: 'modern' } };
export const createBandstand = defineType('bandstand', BANDSTAND_VARIANTS, (root, ctx, v) => {
  const lamps = lampSet('lights', 'fog');
  if (v.shell) {
    const R = 5 * ctx.k;
    const sh = 0.9;
    const half = (r, h, mt, y) => mesh(new THREE.CylinderGeometry(r, r, h, 32, 1, false, -Math.PI / 2, Math.PI), mt, { parent: root, at: [0, y, 0] });
    half(R, sh, ctx.style === 'rustic' ? ctx.m.stone : ctx.m.concrete, sh / 2);
    half(R - 0.15, 0.05, ctx.m.wood, sh + 0.025);
    for (let i = 0; i < 4; i++) mesh(roundedBox(2.4, sh / 4 * (i + 1), 0.32, 0.02), ctx.m.concrete, { parent: root, at: [0, (sh / 4 * (i + 1)) / 2, R + 0.16 * 0 + (3 - i) * 0.3 + 0.15] });
    // quarter-sphere shell over the back half
    const shellG = new THREE.SphereGeometry(R - 0.3, 40, 16, Math.PI / 2, Math.PI, 0, Math.PI / 2);
    shellG.rotateY(Math.PI);
    shellG.scale(1, 0.9, 1);
    const sm = ctx.style === 'modern' ? mat.paint('#f2f0ea') : ctx.style === 'rustic' ? M.wood('#8a6440') : ctx.m.roof;
    sm.side = THREE.DoubleSide;
    mesh(shellG, sm, { parent: root, at: [0, sh + 0.05, 0], name: 'shell' });
    // ribs
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * Math.PI;
      const pts = [];
      for (let j = 0; j <= 10; j++) {
        const t = (j / 10) * (Math.PI / 2);
        const rr = (R - 0.27) * Math.cos(t);
        pts.push([Math.cos(a) * rr, sh + 0.05 + (R - 0.27) * 0.9 * Math.sin(t), -Math.sin(a) * rr]);
      }
      curveTube(pts, 0.05, ctx.m.metal, { parent: root, radialSegments: 6 });
    }
    for (let i = 0; i < 5; i++) {
      const x = -R * 0.7 + (i / 4) * R * 1.4;
      mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.12, 12), ctx.m.metal, { parent: root, at: [x, sh + 0.11, 0.35] });
      lamps.add(root, { at: [x, sh + 0.17, 0.35], normal: [0, 1, 0], w: 0.1, h: 0.1, shape: 'round', bezel: false });
    }
    return [lampOn('lights', 3)];
  }
  const n = v.n;
  const R = 3.2 * ctx.k;
  const off = Math.PI / n;
  const bh = 1.1;
  const baseMat = ctx.style === 'rustic' ? ctx.m.stone : ctx.style === 'modern' ? ctx.m.concrete : mat.brick(ctx.style === 'japanese' ? '#8a8a84' : '#a0523a');
  mesh(new THREE.CylinderGeometry(R + 0.2, R + 0.3, bh, n, 1, false, off), baseMat, { parent: root, at: [0, bh / 2, 0], name: 'base' });
  mesh(new THREE.CylinderGeometry(R + 0.32, R + 0.32, 0.08, n, 1, false, off), ctx.m.stone, { parent: root, at: [0, bh + 0.04, 0] });
  const fy = bh + 0.08;
  const ap = (R + 0.3) * Math.cos(off);
  for (let i = 0; i < 6; i++) mesh(roundedBox(1.6, (fy / 6) * (i + 1), 0.3, 0.02), ctx.m.stone, { parent: root, at: [0, (fy / 6) * (i + 1) / 2, ap + (5 - i) * 0.28 + 0.12] });
  const H = 2.8;
  const pts = [];
  for (let i = 0; i < n; i++) pts.push(polar(R, off + (i / n) * Math.PI * 2));
  const step = n > 8 ? 2 : 1;
  for (let i = 0; i < n; i += step) post(root, ctx, pts[i][0], pts[i][1], fy, fy + H, { w: 0.18 });
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    beam(root, ctx, [a[0], fy + H - 0.1, a[1]], [b[0], fy + H - 0.1, b[1]], { h: 0.2 });
    if (i !== n - 1) railing(root, ctx, [a[0], fy, a[1]], [b[0], fy, b[1]], { h: 0.95, posts: false });
  }
  polyRoof(root, ctx, n, R + 0.6, fy + H, 1.8);
  for (let i = 0; i < n; i += step) {
    mesh(new THREE.SphereGeometry(0.09, 12, 8), ctx.m.metal, { parent: root, at: [pts[i][0] * 0.97, fy + H - 0.29, pts[i][1] * 0.97] });
    lamps.add(root, { at: [pts[i][0] * 0.97, fy + H - 0.4, pts[i][1] * 0.97], normal: [0, -1, 0], w: 0.12, h: 0.12, shape: 'round', bezel: false });
  }
  // music stands
  for (let i = 0; i < 4; i++) {
    const [x, z] = polar(R * 0.5, -0.9 + i * 0.6);
    tube([x, fy, z], [x, fy + 1.05, z], 0.012, ctx.m.metal, { parent: root });
    mesh(roundedBox(0.45, 0.32, 0.02, 0.005), ctx.m.metal, { parent: root, at: [x, fy + 1.15, z], rot: [-0.5, Math.atan2(x, z), 0] });
  }
  return [lampOn('lights', 3)];
});

/* ------------------------------ Park gate ------------------------------ */

export const PARK_GATE_VARIANTS = { arch: {}, 'iron-gates': { style: 'victorian' }, lychgate: { style: 'rustic' }, portal: { style: 'modern' } };
function pillar(parent, ctx, x, h = 2.6, w = 0.6) {
  const st = ctx.style;
  const mt = st === 'classic' ? mat.brick() : st === 'modern' ? ctx.m.concrete : st === 'rustic' ? ctx.m.stone : st === 'japanese' ? ctx.m.accent : ctx.m.stone;
  if (st === 'rustic' || st === 'japanese') {
    mesh(new THREE.CylinderGeometry(w * 0.36, w * 0.42, h, 14), st === 'rustic' ? ctx.m.bark : ctx.m.accent, { parent, at: [x, h / 2, 0], name: 'pillar' });
    mesh(new THREE.CylinderGeometry(w * 0.5, w * 0.55, 0.3, 14), ctx.m.stone, { parent, at: [x, 0.15, 0] });
    return h;
  }
  mesh(roundedBox(w, h, w, 0.03), mt, { parent, at: [x, h / 2, 0], name: 'pillar' });
  if (st !== 'modern') {
    mesh(roundedBox(w + 0.12, 0.12, w + 0.12, 0.03), ctx.m.stone, { parent, at: [x, h + 0.06, 0] });
    mesh(lathe([[0.001, 0], [0.16, 0], [0.12, 0.08], [0.18, 0.24], [0.001, 0.36]], 16), st === 'victorian' ? ctx.m.stone : ctx.m.stone, { parent, at: [x, h + 0.12, 0] });
    return h + 0.48;
  }
  return h;
}
function gateLeaf(parent, ctx, name, hingeX, dir, w, h) {
  const g = group(name, { parent, at: [hingeX, 0.06, 0] });
  const mt = ctx.style === 'rustic' || ctx.style === 'japanese' ? ctx.m.wood : ctx.m.metal;
  const ex = dir * w;
  tube([0, 0, 0], [0, h, 0], 0.03, mt, { parent: g });
  tube([ex, 0, 0], [ex, h * 0.9, 0], 0.025, mt, { parent: g });
  tube([0, 0.08, 0], [ex, 0.08, 0], 0.025, mt, { parent: g });
  tube([0, h * 0.75, 0], [ex, h * 0.75, 0], 0.025, mt, { parent: g });
  if (ctx.style === 'rustic' || ctx.style === 'japanese') {
    const n = Math.round(w / 0.13);
    inst(g, roundedBox(0.1, h * 0.7, 0.03, 0.01, 1), mt, Array.from({ length: n }, (_, i) => ({ at: [dir * (0.07 + (i / n) * (w - 0.1)), 0.08 + h * 0.35, 0.03] })), 'boards');
  } else {
    const n = Math.round(w / 0.12);
    const items = [];
    const tops = [];
    for (let i = 1; i < n; i++) {
      const x = dir * (i / n) * w;
      const t = i / n;
      const hh = h * (0.82 + 0.15 * Math.sin(t * Math.PI));
      items.push({ at: [x, hh / 2, 0], s: [1, hh, 1] });
      tops.push({ at: [x, hh, 0] });
    }
    inst(g, new THREE.CylinderGeometry(0.011, 0.011, 1, 6), mt, items, 'bars');
    inst(g, new THREE.ConeGeometry(0.025, 0.08, 6), ctx.style === 'victorian' ? ctx.m.gold : mt, tops, 'spears');
    const curve = [];
    for (let i = 0; i <= 10; i++) curve.push([dir * (i / 10) * w, h * (0.82 + 0.15 * Math.sin((i / 10) * Math.PI)) - 0.12, 0]);
    curveTube(curve, 0.02, mt, { parent: g, radialSegments: 6 });
  }
  return g;
}
export const createParkGate = defineType('park-gate', PARK_GATE_VARIANTS, (root, ctx, v, variant) => {
  const W = 3.4 * ctx.k;
  const anims = [];
  const sign = (y, w) => {
    const tex = textTex(['CITY PARK'], { bg: ctx.style === 'modern' ? '#30353a' : ctx.style === 'rustic' ? '#7a5634' : '#1e3a2e', fg: '#f2ead2', font: ctx.style === 'modern' ? 'bold 80px Helvetica, Arial, sans-serif' : 'bold 80px Georgia, serif' });
    mesh(roundedBox(w, 0.5, 0.08, 0.02), ctx.style === 'rustic' ? ctx.m.wood : ctx.m.metal, { parent: root, at: [0, y, 0], name: 'sign' });
    for (const s of [1, -1]) panel(root, w - 0.1, 0.42, tex, { at: [0, y, s * 0.041], rotY: s > 0 ? 0 : Math.PI });
  };
  const fence = () => {
    for (const s of [-1, 1]) railing(root, ctx, [s * (W / 2 + 0.3), 0, 0], [s * (W / 2 + 3.3), 0, 0], { h: 1.1 });
  };
  if (variant === 'portal' || ctx.style === 'modern') {
    const t = 0.4;
    mesh(roundedBox(t, 3.6, 0.8, 0.03), ctx.m.concrete, { parent: root, at: [-W / 2 - t / 2, 1.8, 0] });
    mesh(roundedBox(t, 3.6, 0.8, 0.03), ctx.m.concrete, { parent: root, at: [W / 2 + t / 2, 1.8, 0] });
    mesh(roundedBox(W + 2 * t, t, 0.8, 0.03), ctx.m.concrete, { parent: root, at: [0, 3.6 + t / 2, 0] });
    const slats = [];
    for (let i = 0; i < 14; i++) slats.push({ at: [-W / 2 + 0.12 + i * (W - 0.24) / 13, 3.5, 0] });
    inst(root, roundedBox(0.06, 0.2, 0.7, 0.01, 1), M.wood('#c1844e'), slats, 'slats');
    const tex = textTex(['PARK'], { w: 512, h: 160, bg: '#bdb9b1', fg: '#30353a', font: 'bold 110px Helvetica, Arial, sans-serif' });
    panel(root, 1.4, 0.44, tex, { at: [0, 3.8, 0.401], color: '#bdb9b1' });
    fence();
    return [];
  }
  if (variant === 'lychgate') {
    const D = 1.6;
    for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) post(root, ctx, x, z, 0, 2.4, { w: 0.18 });
    for (const z of [-D / 2, D / 2]) beam(root, ctx, [-W / 2 - 0.2, 2.5, z], [W / 2 + 0.2, 2.5, z], { h: 0.2 });
    for (const x of [-W / 2, W / 2]) beam(root, ctx, [x, 2.5, -D / 2], [x, 2.5, D / 2], { h: 0.2 });
    gableRoof(root, ctx, W, D, 2.6, { slope: 0.9, over: 0.4 });
    for (const x of [-W / 2, W / 2]) post(root, ctx, x, 0, 0, 2.4, { w: 0.16 });
    const l = gateLeaf(root, ctx, 'gate_L', -W / 2 + 0.1, 1, W / 2 - 0.12, 1.2);
    const r = gateLeaf(root, ctx, 'gate_R', W / 2 - 0.1, -1, W / 2 - 0.12, 1.2);
    anims.push(clip('open', 4, [rotateTrack(l, 'y', 4, (t) => pingPong(t) * 1.4), rotateTrack(r, 'y', 4, (t) => -pingPong(t) * 1.4)]));
    fence();
    return anims;
  }
  const ph = pillar(root, ctx, -W / 2 - 0.3);
  pillar(root, ctx, W / 2 + 0.3);
  void ph;
  if (variant === 'arch') {
    const mt = ctx.style === 'rustic' ? ctx.m.bark : ctx.style === 'japanese' ? ctx.m.accent : ctx.m.metal;
    if (ctx.style === 'japanese') {
      // two-beam gateway, generic
      beam(root, ctx, [-W / 2 - 0.9, 2.95, 0], [W / 2 + 0.9, 2.95, 0], { h: 0.22, w: 0.3, material: mat.paint('#2a2a2a') });
      beam(root, ctx, [-W / 2 - 0.3, 2.45, 0], [W / 2 + 0.3, 2.45, 0], { h: 0.16, w: 0.16, material: ctx.m.accent });
      sign(2.7, 0.9);
    } else {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        pts.push([-W / 2 - 0.3 + t * (W + 0.6), 2.6 + Math.sin(t * Math.PI) * 0.9, 0]);
      }
      curveTube(pts, ctx.style === 'rustic' ? 0.11 : 0.05, mt, { parent: root, radialSegments: 8 });
      const pts2 = pts.map(([x, y, z]) => [x, y - 0.55 + Math.abs(x) * 0.0, z]);
      pts2[0][1] = 2.0;
      pts2[16][1] = 2.0;
      curveTube(pts2, ctx.style === 'rustic' ? 0.08 : 0.035, mt, { parent: root, radialSegments: 8 });
      sign(3.0, 1.8);
      if (ctx.style === 'victorian') {
        const sc = new THREE.TorusGeometry(0.12, 0.014, 6, 18);
        inst(root, sc, ctx.m.metal, [-1.4, -1.0, 1.0, 1.4].map((x) => ({ at: [x, 2.55 + 0.25, 0] })), 'scrolls');
      }
    }
    // open gates folded back
    const l = gateLeaf(root, ctx, 'gate_L', -W / 2, 1, W / 2 - 0.02, 1.6);
    const r = gateLeaf(root, ctx, 'gate_R', W / 2, -1, W / 2 - 0.02, 1.6);
    l.rotation.y = 1.3;
    r.rotation.y = -1.3;
    anims.push(clip('open', 4, [rotateTrack(l, 'y', 4, (t) => -pingPong(t) * 1.3), rotateTrack(r, 'y', 4, (t) => pingPong(t) * 1.3)]));
  } else {
    const l = gateLeaf(root, ctx, 'gate_L', -W / 2, 1, W / 2 - 0.02, 2.0);
    const r = gateLeaf(root, ctx, 'gate_R', W / 2, -1, W / 2 - 0.02, 2.0);
    anims.push(clip('open', 4, [rotateTrack(l, 'y', 4, (t) => pingPong(t) * 1.4), rotateTrack(r, 'y', 4, (t) => -pingPong(t) * 1.4)]));
    // lamp on each pillar top
    const lamps = lampSet('lights', 'fog');
    for (const x of [-W / 2 - 0.3, W / 2 + 0.3]) {
      lamps.add(root, { geometry: new THREE.SphereGeometry(0.16, 16, 12).translate(x, ph + 0.13, 0), normal: [0, 0, 1], depth: 0.16 });
    }
    anims.push(lampOn('lights', 3));
  }
  fence();
  return anims;
});

/* ------------------------------ Footbridge ------------------------------ */

/** Pond in a lawn: lawn ring with blob hole, sunken water, edge stones. Returns {rx, rz}. */
export function pond(root, ctx, rx, rz, { lawnW, lawnD, stones = true, lilies = true, at = [0, 0, 0] } = {}) {
  const g = group('pond', { parent: root, at });
  const hole = blobShape(rx, rz, ctx.r, { n: 12, wobble: 0.12 });
  const outer = lawnW && lawnD ? rrShape(lawnW, lawnD, 0.4) : new THREE.Shape().absellipse(0, 0, rx + 1, rz + 1, 0, Math.PI * 2);
  mesh(slabFromShape(outer, 0.08, { holes: [new THREE.Path(hole.getPoints(72).reverse())] }), ctx.m.lawn, { parent: g, name: 'lawn' });
  mesh(slabFromShape(new THREE.Shape(hole.getPoints(72)), 0.03, { bevel: 0 }), ctx.m.water, { parent: g, name: 'water' });
  if (stones) {
    const pts = hole.getPoints(48);
    const items = [];
    for (let i = 0; i < pts.length; i += 1) {
      if (ctx.r() < 0.35) continue;
      const s = 0.12 + ctx.r() * 0.16;
      items.push({ at: [pts[i].x * 1.02, 0.06, pts[i].y * 1.02], s: [s * 1.3, s * 0.6, s], rot: [0, ctx.r() * 3, 0] });
    }
    const sg = new THREE.IcosahedronGeometry(1, 1);
    inst(g, sg, mat.stone('#8f8a80'), items, 'edge-stones');
  }
  if (lilies && !ctx.winter) {
    const lt = trimFor(ctx, ['autumn', 'flowering'], { autumn: 'autumn', summer: 'flowering' });
    const lp = createWaterPlant({ variant: 'lily-pads', trim: lt });
    place(g, lp, rx * 0.35, -rz * 0.2, { y: 0.03, s: Math.min(1, rx / 2.5) });
  }
  return g;
}

export const FOOTBRIDGE_VARIANTS = { arched: {}, flat: {}, moon: { style: 'japanese' }, truss: { style: 'modern' } };
export const createFootbridge = defineType('footbridge', FOOTBRIDGE_VARIANTS, (root, ctx, v, variant) => {
  const L = 6 * ctx.k;
  const W = 1.6;
  pond(root, ctx, L / 2 - 0.7, 2.2 * ctx.k, { lawnW: L + 3, lawnD: 4.4 * ctx.k + 2.4, lilies: true });
  const rise = variant === 'moon' ? L * 0.32 : variant === 'arched' ? 0.8 : 0;
  const yAt = (x) => 0.1 + (variant === 'moon' ? rise * Math.sqrt(Math.max(0, 1 - (x / (L / 2)) ** 2)) : rise * (1 - (x / (L / 2)) ** 2));
  const N = 40;
  const sMat = ctx.style === 'modern' ? mat.steel('#3a3f44') : ctx.style === 'japanese' ? ctx.m.accent : ctx.m.darkWood;
  const railMat = ctx.style === 'japanese' ? ctx.m.accent : ctx.style === 'victorian' ? ctx.m.metal : ctx.style === 'modern' ? M.metal('#c5c9cc', 0.25) : ctx.style === 'rustic' ? ctx.m.bark : ctx.m.trim;
  for (const z of [-W / 2, W / 2]) {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const x = -L / 2 + (i / N) * L;
      pts.push([x, yAt(x) - 0.04, z]);
    }
    curveTube(pts, 0.08, sMat, { parent: root, segments: 64, radialSegments: 8, name: 'stringer' });
    curveTube(pts.map(([x, y]) => [x, y + 1.0, z]), ctx.style === 'rustic' ? 0.06 : 0.035, railMat, { parent: root, segments: 64, radialSegments: 8, name: 'handrail' });
    const posts = [];
    for (let i = 0; i <= 10; i++) {
      const x = -L / 2 + (i / 10) * L;
      posts.push({ at: [x, yAt(x) + 0.48, z] });
    }
    inst(root, ctx.style === 'rustic' ? new THREE.CylinderGeometry(0.06, 0.06, 1.04, 8) : roundedBox(0.08, 1.04, 0.08, 0.01, 1), railMat, posts, 'rail-posts');
    if (ctx.style === 'modern' || variant === 'truss') {
      const diag = [];
      for (let i = 0; i < 10; i++) {
        const x0 = -L / 2 + (i / 10) * L;
        const x1 = -L / 2 + ((i + 1) / 10) * L;
        const ya = yAt(x0) + 0.05;
        const yb = yAt(x1) + 0.95;
        const len = Math.hypot(x1 - x0, yb - ya);
        diag.push({ at: [(x0 + x1) / 2, (ya + yb) / 2, z], rot: [0, 0, (i % 2 ? 1 : -1) * Math.atan2(x1 - x0, yb - ya)], s: [1, len, 1] });
      }
      inst(root, new THREE.CylinderGeometry(0.018, 0.018, 1, 6), railMat, diag, 'truss');
    } else {
      const mid = [];
      for (let i = 0; i <= N; i += 2) {
        const x = -L / 2 + (i / N) * L;
        mid.push([x, yAt(x) + 0.5, z]);
      }
      curveTube(mid, 0.02, railMat, { parent: root, segments: 48, radialSegments: 6 });
    }
  }
  // deck planks across the stringers
  const planks = [];
  const np = Math.round(L / 0.16);
  for (let i = 0; i <= np; i++) {
    const x = -L / 2 + (i / np) * L;
    const dx = 0.01;
    const sl = Math.atan2(yAt(x + dx) - yAt(x - dx), 2 * dx);
    planks.push({ at: [x, yAt(x) + 0.055, 0], rot: [0, 0, isFinite(sl) ? sl : 0] });
  }
  inst(root, roundedBox(0.13, 0.04, W + 0.25, 0.01, 1), variant === 'moon' ? M.wood('#a58260') : ctx.m.wood, planks, 'planks');
  if (variant === 'flat' || variant === 'truss') {
    for (const x of [-L / 6, L / 6]) for (const z of [-W / 2, W / 2]) mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 10), ctx.m.concrete, { parent: root, at: [x, 0.04, z] });
  }
  return [];
});

/* ------------------------------ Boardwalk ------------------------------ */

export const BOARDWALK_VARIANTS = { straight: {}, curve: {}, lookout: {}, pier: {} };
export const createBoardwalk = defineType('boardwalk', BOARDWALK_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const W = 1.8;
  const dy = 0.55;
  const water = variant === 'pier';
  // marsh / water ground
  const gw = 9 * k;
  const gd = 7 * k;
  const ground = mesh(slabFromShape(rrShape(gw, gd, 0.6), 0.04), water ? ctx.m.water : mat.lawn(ctx.winter ? '#eef3f7' : ctx.autumn ? '#8a7a42' : '#5a7a38'), { parent: root, name: water ? 'water' : 'marsh' });
  void ground;
  if (water) mesh(slabFromShape(rrShape(gw, 2, 0.3), 0.1), ctx.m.lawn, { parent: root, at: [0, 0, -gd / 2 + 1], name: 'lawn' });
  // path centreline
  const pts = [];
  if (variant === 'curve') { const Rr = Math.min(gw, gd) - 1.4; for (let i = 0; i <= 24; i++) { const a = (i / 24) * (Math.PI / 2); pts.push([-gw / 2 + 0.7 + Math.sin(a) * Rr, -gd / 2 + 0.7 + Math.cos(a) * Rr]); } }
  else if (variant === 'pier') for (let i = 0; i <= 20; i++) pts.push([0, -gd / 2 + 0.6 + (i / 20) * (gd * 0.75)]);
  else for (let i = 0; i <= 20; i++) pts.push([-gw / 2 + 0.3 + (i / 20) * (gw - 0.6), 0]);
  const planks = [];
  const pileItems = [];
  const stringers = [[], []];
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    const [nx, nz] = pts[Math.min(i + 1, pts.length - 1)];
    const [px, pz] = pts[Math.max(i - 1, 0)];
    const ang = Math.atan2(nz - pz, nx - px);
    const ox = -Math.sin(ang) * (W / 2 - 0.1);
    const oz = Math.cos(ang) * (W / 2 - 0.1);
    stringers[0].push([x + ox, dy - 0.1, z + oz]);
    stringers[1].push([x - ox, dy - 0.1, z - oz]);
    if (i % 4 === 0) for (const s of [1, -1]) pileItems.push({ at: [x + s * ox, (dy - 0.1) / 2, z + s * oz], s: [1, dy - 0.1, 1] });
  }
  for (const s of stringers) curveTube(s, 0.07, ctx.m.darkWood, { parent: root, segments: 48, radialSegments: 6, name: 'stringer' });
  inst(root, new THREE.CylinderGeometry(0.09, 0.09, 1, 8), ctx.m.darkWood, pileItems, 'piles');
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, dy, z)));
  const len = curve.getLength();
  const np = Math.round(len / 0.16);
  for (let i = 0; i <= np; i++) {
    const p = curve.getPointAt(i / np);
    const t = curve.getTangentAt(i / np);
    planks.push({ at: [p.x, dy - 0.01, p.z], rot: [0, -Math.atan2(t.z, t.x), 0] });
  }
  inst(root, roundedBox(0.14, 0.04, W, 0.01, 1), ctx.style === 'modern' ? M.wood('#8a7a6a') : ctx.m.wood, planks, 'planks');
  // edge rails
  const rm = ctx.style === 'modern' ? mat.steel() : ctx.style === 'rustic' ? ctx.m.bark : ctx.style === 'japanese' ? ctx.m.accent : ctx.m.darkWood;
  for (const s of stringers) {
    const top = s.map(([x, , z]) => [x, dy + 0.9, z]);
    curveTube(top, 0.04, rm, { parent: root, segments: 48, radialSegments: 6, name: 'handrail' });
    inst(root, new THREE.CylinderGeometry(0.035, 0.035, 1.0, 6), rm, s.filter((_, i) => i % 2 === 0).map(([x, , z]) => ({ at: [x, dy + 0.4, z] })), 'rail-posts');
  }
  const end = pts[pts.length - 1];
  if (variant === 'lookout' || variant === 'pier') {
    const pw = 3.2;
    mesh(roundedBox(pw, 0.06, pw, 0.02), ctx.m.wood, { parent: root, at: [end[0] + (variant === 'pier' ? 0 : 0), dy, end[1] + (variant === 'pier' ? pw / 2 : 0)], name: 'platform' });
    const cx = end[0];
    const cz = end[1] + (variant === 'pier' ? pw / 2 : 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.1, 0.1, dy, 8), ctx.m.darkWood, { parent: root, at: [cx + sx * (pw / 2 - 0.1), dy / 2, cz + sz * (pw / 2 - 0.1)] });
    parkBench(root, ctx, cx, cz - (variant === 'pier' ? -0.6 : 0.6), variant === 'pier' ? Math.PI : 0, dy + 0.03);
    if (variant === 'lookout') {
      // coin telescope
      tube([cx + 1, dy + 0.03, cz + 0.8], [cx + 1, dy + 1.1, cz + 0.8], 0.05, mat.steel('#2f5d46'), { parent: root });
      mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.5, 14).rotateX(Math.PI / 2 - 0.2), mat.steel('#2f5d46'), { parent: root, at: [cx + 1, dy + 1.2, cz + 0.85] });
    }
  }
  // reeds
  if (!water) {
    const rt = trimFor(ctx, ['autumn', 'dense', 'small'], { autumn: 'autumn', overgrown: 'dense' });
    place(root, createWaterPlant({ variant: 'reeds', trim: rt }), gw / 2 - 1.2, -gd / 2 + 1.2, { y: 0.04 });
    place(root, createWaterPlant({ variant: 'cattails', trim: rt }), -gw / 2 + 1.4, -gd / 2 + 1.4, { y: 0.04 });
  } else {
    place(root, createWaterPlant({ variant: 'lily-pads', trim: trimFor(ctx, ['autumn', 'flowering'], { autumn: 'autumn', summer: 'flowering' }) }), 2.5 * k, 0.5, { y: 0.04 });
    place(root, createRock({ variant: 'river-stones', trim: ctx.winter ? 'snow' : undefined }), -3 * k, -gd / 2 + 1.2, { y: 0.1 });
  }
  return [];
});
