import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, lathe, tube, curveTube, extrudeOutline } from '../../core/utils.js';
import { rotateTrack, clip, pingPong, spinTrack } from '../../core/animation.js';
import { createPicnicTable, createTrashCan } from '../street.js';
import { defineType, pad, inst, lampSet, lampOn, place, trimFor, mat, rrShape, slabFromShape, polar, post, canvasTex, panel, textTex } from './kit.js';
import { parkBench } from './structures.js';

/* Activity areas: dog park, skate park, outdoor gym, picnic sets, barbecues, game tables. */

/* -------------------------------- Dog park -------------------------------- */

const agilityPaint = (ctx, i = 0) => (ctx.style === 'rustic' ? M.wood(['#8a6440', '#7a5634'][i % 2]) : mat.steel(['#e8b020', '#2a7ad0', '#d23a2a', '#2f9a4a'][i % 4]));

export const DOG_PARK_VARIANTS = { fence: {}, jump: {}, tunnel: {}, 'weave-poles': {}, 'a-frame': {} };
export const createDogPark = defineType('dog-park', DOG_PARK_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const anims = [];
  const turf = mat.lawn(ctx.winter ? '#eef3f7' : ctx.style === 'modern' ? '#4f9a3a' : '#5e8f3a');
  if (variant === 'fence') {
    const L = 8 * k;
    pad(root, L + 1, 3, turf, { h: 0.03, r: 0.1, name: 'lawn' });
    const fm = ctx.style === 'rustic' ? M.wood('#7a5634') : M.metal('#8a9096', 0.4);
    const H = 1.5;
    const n = Math.round(L / 2);
    const mesh_ = new THREE.MeshStandardMaterial({ color: '#9aa0a6', metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.45, side: THREE.DoubleSide, name: 'chain-link' });
    for (let i = 0; i <= n; i++) {
      const x = -L / 2 + (i / n) * L;
      if (ctx.style === 'rustic') mesh(roundedBox(0.12, H + 0.1, 0.12, 0.02), fm, { parent: root, at: [x, 0.03 + (H + 0.1) / 2, 0] });
      else tube([x, 0.03, 0], [x, 0.03 + H + 0.05, 0], 0.03, fm, { parent: root, radialSegments: 10 });
      if (i < n) {
        const xm = x + L / n / 2;
        if (i === Math.floor(n / 2)) {
          // self-closing gate
          const g = group('gate', { parent: root, at: [x + 0.04, 0.06, 0] });
          const w = L / n - 0.08;
          curveTube([[0, 0, 0], [w, 0, 0], [w, H - 0.1, 0], [0, H - 0.1, 0], [0, 0, 0]], 0.02, fm, { parent: g, radialSegments: 6 });
          mesh(new THREE.PlaneGeometry(w, H - 0.1).translate(w / 2, (H - 0.1) / 2, 0), mesh_, { parent: g });
          anims.push(clip('open', 4, [rotateTrack(g, 'y', 4, (t) => -pingPong(t) * 1.3)]));
        } else if (ctx.style === 'rustic') {
          inst(root, roundedBox(L / n, 0.1, 0.03, 0.01, 1), M.wood('#9a7450'), [0.4, 0.8, 1.2].map((y) => ({ at: [xm, y, 0.07] })), `rails_${i}`);
        } else {
          mesh(new THREE.PlaneGeometry(L / n, H - 0.05), mesh_, { parent: root, at: [xm, 0.03 + (H - 0.05) / 2 + 0.02, 0] });
          tube([x, 0.03 + H, 0], [x + L / n, 0.03 + H, 0], 0.02, fm, { parent: root });
        }
      }
    }
    // dog-waste bin and sign
    place(root, createTrashCan({ variant: 'dog-waste', trim: trimFor(ctx, ['snowy', 'rusty'], { winter: 'snowy', worn: 'rusty' }) }), L / 2 - 0.6, 0.7, { y: 0.03 });
    post(root, ctx, -L / 2 + 0.8, 0.5, 0.03, 1.2, { w: 0.08, footing: false, material: fm });
    mesh(roundedBox(0.5, 0.35, 0.03, 0.01), mat.paint('#2f6a4a'), { parent: root, at: [-L / 2 + 0.8, 1.35, 0.5] });
    panel(root, 0.46, 0.31, textTex(['DOG PARK', 'off-lead area'], { w: 256, h: 170, bg: '#2f6a4a', fg: '#fff', font: 'bold 34px Helvetica, Arial, sans-serif' }), { at: [-L / 2 + 0.8, 1.35, 0.516], color: '#2f6a4a' });
    return anims;
  }
  pad(root, 4 * k, 3 * k, turf, { h: 0.03, r: 0.2, name: 'lawn' });
  const y = 0.03;
  if (variant === 'jump') {
    const W = 1.2;
    for (const sx of [-1, 1]) {
      mesh(roundedBox(0.5, 0.05, 0.06, 0.02), agilityPaint(ctx, 0), { parent: root, at: [sx * W / 2, y + 0.025, 0] });
      tube([sx * W / 2, y + 0.05, 0], [sx * W / 2, y + 1.0, 0], 0.025, agilityPaint(ctx, 1), { parent: root });
    }
    const bar = mesh(new THREE.CylinderGeometry(0.02, 0.02, W, 12).rotateZ(Math.PI / 2), agilityPaint(ctx, 2), { parent: root, at: [0, y + 0.55, 0], name: 'bar' });
    void bar;
    const st = [];
    for (let i = 0; i < 4; i++) st.push({ at: [-W / 2 + 0.15 + i * 0.3, y + 0.55, 0] });
    inst(root, new THREE.CylinderGeometry(0.0205, 0.0205, 0.12, 12).rotateZ(Math.PI / 2), mat.paint('#f4f1ea'), st, 'stripes');
  } else if (variant === 'tunnel') {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push(new THREE.Vector3(-1.6 + t * 3.2, y + 0.3, Math.sin(t * Math.PI) * 0.8));
    }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.3, 20, false);
    const tm = ctx.style === 'rustic' ? M.wood('#8a6440') : new THREE.MeshStandardMaterial({ color: '#2a7ad0', roughness: 0.6, side: THREE.DoubleSide, name: 'tunnel-fabric' });
    tm.side = THREE.DoubleSide;
    mesh(g, tm, { parent: root, name: 'tunnel' });
    const rings = [];
    for (let i = 0; i <= 12; i += 2) {
      const t = i / 12;
      const p = new THREE.CatmullRomCurve3(pts).getPointAt(t);
      rings.push({ at: [p.x, p.y, p.z], rot: [0, Math.PI / 2 - Math.atan2(Math.cos(t * Math.PI) * 0.8 * Math.PI, 3.2), 0] });
    }
    inst(root, new THREE.TorusGeometry(0.305, 0.015, 6, 24), M.plastic('#f2c230', 0.5), rings, 'hoops');
  } else if (variant === 'weave-poles') {
    mesh(roundedBox(3.4, 0.04, 0.12, 0.015), mat.steel('#f4f1ea'), { parent: root, at: [0, y + 0.02, 0] });
    for (let i = 0; i < 6; i++) tube([-1.5 + i * 0.6, y + 0.04, 0], [-1.5 + i * 0.6, y + 1.0, 0], 0.012, agilityPaint(ctx, i), { parent: root });
  } else {
    // A-frame with contact zones
    const L = 2.7;
    const ang = 0.6;
    for (const s of [-1, 1]) {
      const p = mesh(roundedBox(L, 0.04, 0.9, 0.015), agilityPaint(ctx, 0), { parent: root, name: 'ramp' });
      p.position.set(s * Math.cos(ang) * L / 2, y + Math.sin(ang) * L / 2, 0);
      p.rotation.z = -s * ang;
      const zone = mesh(roundedBox(0.9, 0.045, 0.9, 0.015), agilityPaint(ctx, 2), { parent: root });
      zone.position.set(s * Math.cos(ang) * (L - 0.45), y + Math.sin(ang) * 0.45, 0);
      zone.rotation.z = -s * ang;
      const sl = [];
      for (let i = 1; i < 9; i++) sl.push({ at: [s * Math.cos(ang) * (i * 0.3), y + Math.sin(ang) * (i * 0.3) + 0.03, 0], rot: [0, 0, -s * ang] });
      inst(root, roundedBox(0.03, 0.02, 0.85, 0.005, 1), mat.paint('#f4f1ea'), sl, `slats_${s}`);
    }
    tube([-((Math.sin(ang) * L - 0.6) / Math.tan(ang)), y + 0.6, 0.45], [((Math.sin(ang) * L - 0.6) / Math.tan(ang)), y + 0.6, 0.45], 0.015, M.metal('#8a9096'), { parent: root });
    tube([-((Math.sin(ang) * L - 0.6) / Math.tan(ang)), y + 0.6, -0.45], [((Math.sin(ang) * L - 0.6) / Math.tan(ang)), y + 0.6, -0.45], 0.015, M.metal('#8a9096'), { parent: root });
  }
  return anims;
});

/* -------------------------------- Skate park -------------------------------- */

function skateMat(ctx) {
  if (ctx.trim === 'wooden') return M.wood('#c9a070');
  if (ctx.trim === 'painted') return mat.paint('#3a6ab0');
  return mat.concrete('#b9b5ae');
}
export const SKATE_VARIANTS = { 'quarter-pipe': {}, rail: {}, funbox: {}, bowl: {}, ledge: {}, kicker: {} };
export const createSkateRamp = defineType('skate-ramp', SKATE_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const sm = skateMat(ctx);
  const steel = M.metal('#c5c9cc', 0.25);
  const W = 2.4 * k;
  pad(root, (variant === 'bowl' ? 7 : 5) * k, (variant === 'bowl' ? 7 : 4) * k, mat.concrete('#c9c5bd'), { h: 0.03, r: 0.05, name: 'slab' });
  const y = 0.03;
  if (variant === 'quarter-pipe' || variant === 'kicker') {
    const R = variant === 'kicker' ? 0.9 : 1.5 * Math.sqrt(k);
    const H = variant === 'kicker' ? 0.45 : R + 0.15;
    const prof = [[0, 0]];
    const amax = variant === 'kicker' ? 0.65 : Math.PI / 2 - 0.02;
    for (let i = 1; i <= 16; i++) {
      const a = (i / 16) * amax;
      prof.push([R * Math.sin(a), R - R * Math.cos(a)]);
    }
    const top = prof[prof.length - 1];
    const deck = variant === 'kicker' ? 0.05 : 0.9;
    prof.push([top[0], H], [top[0] + deck, H], [top[0] + deck, 0]);
    const g = extrudeOutline(prof.map(([a, b]) => [a - (top[0] + deck) / 2, b]), W, { bevel: 0.01 });
    mesh(g, sm, { parent: root, at: [0, y, 0], name: 'ramp' });
    if (variant === 'quarter-pipe') {
      mesh(new THREE.CylinderGeometry(0.03, 0.03, W, 12).rotateX(Math.PI / 2), steel, { parent: root, at: [top[0] - (top[0] + deck) / 2, y + H + 0.01, 0], name: 'coping' });
      const x0 = top[0] - (top[0] + deck) / 2 + deck;
      for (const z of [-W / 2 + 0.05, W / 2 - 0.05]) tube([x0 - 0.05, y + H, z], [x0 - 0.05, y + H + 1.0, z], 0.025, steel, { parent: root });
      tube([x0 - 0.05, y + H + 1.0, -W / 2 + 0.05], [x0 - 0.05, y + H + 1.0, W / 2 - 0.05], 0.025, steel, { parent: root });
      if (ctx.trim === 'wooden') {
        const ribs = [];
        for (let i = 0; i < 6; i++) ribs.push({ at: [0, y + H / 2, -W / 2 + 0.01], s: [1, 1, 1] });
      }
    }
  } else if (variant === 'rail') {
    const L = 3 * k;
    for (const x of [-L / 2 + 0.2, L / 2 - 0.2]) {
      mesh(roundedBox(0.3, 0.02, 0.3, 0.005), steel, { parent: root, at: [x, y + 0.01, 0] });
      tube([x, y + 0.02, 0], [x, y + 0.43, 0], 0.035, mat.steel('#30353a'), { parent: root });
    }
    mesh(new THREE.CylinderGeometry(0.03, 0.03, L, 14).rotateZ(Math.PI / 2), steel, { parent: root, at: [0, y + 0.43, 0], name: 'rail' });
  } else if (variant === 'funbox') {
    const L = 1.8 * k;
    const H = 0.6;
    const ramp = 1.5;
    const prof = [[-L / 2 - ramp, 0], [-L / 2, H], [L / 2, H], [L / 2 + ramp, 0]];
    mesh(extrudeOutline(prof, W, { bevel: 0.01 }), sm, { parent: root, at: [0, y, 0], name: 'funbox' });
    for (const z of [-W / 2, W / 2]) mesh(new THREE.BoxGeometry(L, 0.02, 0.02), steel, { parent: root, at: [0, y + H, z] });
    // flat rail on top
    for (const x of [-L / 2 + 0.2, L / 2 - 0.2]) tube([x, y + H, 0], [x, y + H + 0.3, 0], 0.025, steel, { parent: root });
    mesh(roundedBox(L, 0.05, 0.06, 0.01), steel, { parent: root, at: [0, y + H + 0.32, 0] });
  } else if (variant === 'ledge') {
    const L = 3 * k;
    mesh(roundedBox(L, 0.45, 0.6, 0.02), sm, { parent: root, at: [0, y + 0.225, 0], name: 'ledge' });
    for (const z of [-0.3, 0.3]) mesh(new THREE.BoxGeometry(L, 0.025, 0.025), steel, { parent: root, at: [0, y + 0.44, z] });
  } else {
    // bowl section: quarter of a round bowl with deck and coping
    const r0 = 1.2 * k;
    const R = 1.6;
    const prof = [[r0, 0]];
    for (let i = 1; i <= 14; i++) {
      const a = (i / 14) * (Math.PI / 2 - 0.05);
      prof.push([r0 + R * Math.sin(a), R - R * Math.cos(a)]);
    }
    const tp = prof[prof.length - 1];
    prof.push([tp[0] + 1.0, tp[1]], [tp[0] + 1.0, 0]);
    const closed = [...prof, [r0, 0]];
    const g = new THREE.LatheGeometry(closed.map(([a, b]) => new THREE.Vector2(a, b)), 24, 0, Math.PI / 2);
    mesh(g, sm, { parent: root, at: [-1.5, y, -1.5], name: 'bowl' });
    for (const rotY of [0, Math.PI / 2]) {
      const cap = extrudeOutline(closed.map(([a, b]) => [a, b]), 0.02, { bevel: 0 });
      const m = mesh(cap, sm, { parent: root, at: [-1.5, y, -1.5] });
      m.rotation.y = rotY === 0 ? -Math.PI / 2 : 0;
      if (rotY === 0) m.position.x += 0.01;
      else m.position.z += 0.01;
    }
    mesh(new THREE.CylinderGeometry(r0 + 0.02, r0 + 0.02, 0.02, 24, 1, false, 0, Math.PI / 2), sm, { parent: root, at: [-1.5, y + 0.01, -1.5] });
    mesh(new THREE.TorusGeometry(tp[0], 0.03, 8, 32, Math.PI / 2).rotateX(Math.PI / 2).rotateY(Math.PI / 2), steel, { parent: root, at: [-1.5, y + tp[1] + 0.01, -1.5], name: 'coping' });
  }
  return [];
});

/* ------------------------------- Outdoor gym ------------------------------- */

export const OUTDOOR_GYM_VARIANTS = { 'pull-up': {}, 'parallel-bars': {}, 'sit-up': {}, 'cross-trainer': {}, 'leg-press': {} };
export const createOutdoorGym = defineType('outdoor-gym', OUTDOOR_GYM_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const st = ctx.style;
  const fm = st === 'rustic' ? M.wood('#8a6440') : st === 'victorian' ? mat.steel('#1e3a2e') : st === 'japanese' ? mat.steel('#3b2a22') : mat.steel(st === 'modern' ? '#30353a' : '#2f7a4a');
  const acc = st === 'modern' ? mat.steel('#e8b020') : st === 'japanese' ? mat.paint('#b8382a') : mat.steel('#c5c9cc');
  const steel = M.metal('#c5c9cc', 0.25);
  pad(root, 3.4 * k, 2.6 * k, mat.rubber(st === 'modern' ? '#3a3f44' : st === 'rustic' ? '#6a5040' : '#2f6a4a'), { h: 0.04, r: 0.1, name: 'safety-surface' });
  const y = 0.04;
  const pole = (x, z, h, r = 0.05) => (st === 'rustic' ? mesh(new THREE.CylinderGeometry(r * 1.8, r * 1.8, h, 12), fm, { parent: root, at: [x, y + h / 2, z] }) : mesh(lathe([[0.001, 0], [r * 2, 0], [r * 1.6, 0.04], [r, 0.08], [r, h], [0.001, h]], 16), fm, { parent: root, at: [x, y, z] }));
  const anims = [];
  if (variant === 'pull-up') {
    const W = 2.4 * Math.sqrt(k);
    pole(-W / 2, 0, 2.4);
    pole(0, 0, 2.1);
    pole(W / 2, 0, 2.4);
    tube([-W / 2, y + 2.3, 0], [0, y + 2.3, 0], 0.017, steel, { parent: root });
    tube([0, y + 2.0, 0], [W / 2, y + 2.0, 0], 0.017, steel, { parent: root });
    tube([0, y + 2.0, 0], [0, y + 2.3, 0], 0.03, fm, { parent: root });
  } else if (variant === 'parallel-bars') {
    for (const x of [-0.9, 0.9]) for (const z of [-0.28, 0.28]) pole(x, z, 1.15, 0.04);
    for (const z of [-0.28, 0.28]) tube([-1.05, y + 1.15, z], [1.05, y + 1.15, z], 0.022, steel, { parent: root });
  } else if (variant === 'sit-up') {
    pole(-0.7, -0.3, 0.6);
    pole(-0.7, 0.3, 0.6);
    pole(0.8, 0, 0.3);
    const b = mesh(roundedBox(1.7, 0.06, 0.5, 0.02), st === 'rustic' ? M.wood('#a87a4c') : acc, { parent: root, name: 'bench' });
    b.position.set(0.05, y + 0.48, 0);
    b.rotation.z = Math.atan2(-0.36, 1.5) ;
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 14).rotateX(Math.PI / 2), M.rubber(), { parent: root, at: [-0.72, y + 0.68, 0] });
  } else if (variant === 'cross-trainer') {
    pole(0, 0, 1.6, 0.06);
    const hub = group('hub', { parent: root, at: [0, y + 0.45, 0.12] });
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 18).rotateX(Math.PI / 2), acc, { parent: hub });
    for (const s of [-1, 1]) {
      const crank = group(`crank_${s}`, { parent: hub, at: [0, 0, s * 0.06] });
      mesh(roundedBox(0.3, 0.04, 0.03, 0.01), steel, { parent: crank, at: [0.12 * s, 0, 0] });
      mesh(roundedBox(0.36, 0.04, 0.16, 0.01), M.rubber(), { parent: crank, at: [0.25 * s, 0, s * 0.1] });
    }
    for (const s of [-1, 1]) {
      const arm = group(`arm_${s}`, { parent: root, at: [0, y + 1.5, s * 0.1] });
      tube([0, 0, 0], [0.05, 0.4, s * 0.25], 0.022, steel, { parent: arm });
      tube([0, 0, 0], [0, -0.4, s * 0.02], 0.022, steel, { parent: arm });
      anims.push(rotateTrack(arm, 'z', 1.6, (t) => Math.sin((t + (s > 0 ? 0 : 0.5)) * Math.PI * 2) * 0.35));
    }
    return [clip('use', 1.6, [spinTrack(hub, 'z', 1.6), ...anims])];
  } else {
    pole(-0.6, 0, 1.3, 0.06);
    pole(0.6, 0, 0.5, 0.06);
    mesh(roundedBox(0.5, 0.08, 0.5, 0.03), acc, { parent: root, at: [0.6, y + 0.54, 0], name: 'seat' });
    mesh(roundedBox(0.08, 0.6, 0.5, 0.03), acc, { parent: root, at: [0.86, y + 0.88, 0] });
    const sw = group('swing', { parent: root, at: [-0.6, y + 1.25, 0] });
    tube([0, 0, 0.1], [0.3, -0.75, 0.1], 0.025, steel, { parent: sw });
    tube([0, 0, -0.1], [0.3, -0.75, -0.1], 0.025, steel, { parent: sw });
    mesh(roundedBox(0.08, 0.36, 0.5, 0.02), M.rubber(), { parent: sw, at: [0.32, -0.78, 0] });
    anims.push(clip('use', 2, [rotateTrack(sw, 'z', 2, (t) => -pingPong(t) * 0.45)]));
  }
  // instruction plate
  pole(1.35 * k, -0.9 * k, 1.1, 0.03);
  mesh(roundedBox(0.4, 0.3, 0.02, 0.01), fm, { parent: root, at: [1.35 * k, y + 1.25, -0.9 * k] });
  panel(root, 0.36, 0.26, textTex(['EXERCISE', '10 × 3 sets'], { w: 256, h: 190, bg: '#f4f1ea', fg: '#203028', font: 'bold 36px Helvetica, Arial, sans-serif' }), { at: [1.35 * k, y + 1.25, -0.9 * k + 0.011] });
  return anims;
});

/* ------------------------------- Picnic set ------------------------------- */

function blanketTex(color) {
  return canvasTex(`blanket-${color}`, 128, 128, (g, w, h) => {
    g.fillStyle = '#f4f1ea';
    g.fillRect(0, 0, w, h);
    g.fillStyle = color;
    g.globalAlpha = 0.75;
    for (let i = 0; i < 8; i += 2) { g.fillRect(i * 16, 0, 16, h); g.fillRect(0, i * 16, w, 16); }
  });
}

/** Hollow wicker basket with handle and lid halves. */
export function basket(parent, at) {
  const wick = M.wood('#b8884a');
  wick.side = THREE.DoubleSide;
  const g = group('basket', { parent, at });
  mesh(new THREE.CylinderGeometry(0.21, 0.18, 0.02, 24), wick, { parent: g, at: [0, 0.01, 0] });
  const wall = lathe([[0.18, 0.02], [0.2, 0.12], [0.21, 0.24], [0.2, 0.24], [0.19, 0.12], [0.17, 0.02]], 24);
  mesh(wall, wick, { parent: g, scale: [1.4, 1, 1] });
  curveTube([[-0.25, 0.24, 0], [-0.18, 0.4, 0], [0.18, 0.4, 0], [0.25, 0.24, 0]], 0.012, M.wood('#7a5634'), { parent: g, radialSegments: 6 });
  return g;
}

export const PICNIC_SET_VARIANTS = { 'table-set': {}, blanket: {}, family: {} };
export const createPicnicSet = defineType('picnic-set', PICNIC_SET_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  pad(root, 6 * k, 5 * k, ctx.m.lawn, { h: 0.04, shape: 'blob', rand: ctx.r, name: 'lawn' });
  const y = 0.04;
  const tt = trimFor(ctx, ['snowy', 'rusty', 'umbrella', 'barbecue'], { winter: 'snowy', worn: 'rusty' });
  const anims = [];
  if (variant === 'blanket' || variant === 'family') {
    const bc = { classic: '#d23a2a', victorian: '#2a5a3a', modern: '#2a6ad0', rustic: '#8a5a2a', japanese: '#3a4a8a' }[ctx.style];
    const tex = blanketTex(bc);
    mesh(roundedBox(1.8, 0.012, 1.5, 0.005), new THREE.MeshStandardMaterial({ map: tex ?? null, color: tex ? '#ffffff' : bc, roughness: 0.95, name: 'blanket' }), { parent: root, at: [variant === 'family' ? -1.2 : 0, y + 0.006, 0.4], rot: [0, 0.15, 0], name: 'blanket' });
    const bx = variant === 'family' ? -1.2 : 0;
    basket(root, [bx + 0.5, y + 0.012, 0.6]);
    // plates, bottle, apples
    inst(root, lathe([[0.001, 0], [0.1, 0], [0.12, 0.015], [0.115, 0.017], [0.095, 0.004], [0.001, 0.004]], 20), M.plastic('#f4f1ea', 0.3), [[-0.4, 0.2], [-0.1, -0.1], [0.2, 0.25]].map(([x, z]) => ({ at: [bx + x, y + 0.012, 0.4 + z] })), 'plates');
    mesh(lathe([[0.001, 0], [0.035, 0], [0.035, 0.2], [0.012, 0.25], [0.012, 0.3], [0.001, 0.3]], 14), M.glass({ tint: '#2a5a2a', opacity: 0.7 }), { parent: root, at: [bx - 0.5, y + 0.012, 0.75], name: 'bottle' });
    inst(root, new THREE.SphereGeometry(0.035, 10, 8), mat.bloom(ctx.autumn ? '#c8a020' : '#c8261e'), [[-0.38, 0.2], [-0.42, 0.24], [-0.36, 0.17]].map(([x, z]) => ({ at: [bx + x, y + 0.012 + 0.015 + 0.035, 0.4 + z] })), 'apples');
  }
  if (variant === 'table-set' || variant === 'family') {
    place(root, createPicnicTable({ variant: ctx.style === 'modern' ? 'modern' : 'classic', trim: variant === 'family' ? 'umbrella' : tt }), variant === 'family' ? 1.2 : 0, -0.4, { y });
  }
  // barbecue stand + bin
  if (variant !== 'blanket') {
    grillStand(root, ctx, 2.2 * k, 1.3, y, anims);
    place(root, createTrashCan({ variant: 'park', trim: trimFor(ctx, ['snowy', 'rusty'], { winter: 'snowy', worn: 'rusty' }) }), -2.3 * k, -1.4, { y });
  }
  if (variant === 'family') {
    // cool box
    mesh(roundedBox(0.55, 0.35, 0.35, 0.04), M.plastic('#2a7ad0', 0.4), { parent: root, at: [0.1, y + 0.175, 1.2] });
    mesh(roundedBox(0.57, 0.06, 0.37, 0.03), M.plastic('#f4f1ea', 0.4), { parent: root, at: [0.1, y + 0.38, 1.2] });
  }
  return anims;
});

/* ------------------------------- BBQ grill ------------------------------- */

/** Park pedestal grill: post, firebox with grate and an opening lid (`anims` gets 'open' + 'on'). */
function grillStand(root, ctx, x, z, y, anims, name = 'lid') {
  const steel = ctx.style === 'modern' ? M.metal('#8a9096', 0.35) : mat.iron('#22262a');
  const g = group('grill', { parent: root, at: [x, y, z] });
  mesh(lathe([[0.001, 0], [0.2, 0], [0.16, 0.06], [0.06, 0.1], [0.06, 0.75], [0.001, 0.75]], 16), steel, { parent: g });
  const box = new THREE.ExtrudeGeometry(rrShape(0.6, 0.42, 0.04), { depth: 0.2, bevelEnabled: false });
  box.rotateX(-Math.PI / 2);
  const inner = new THREE.Path(rrShape(0.54, 0.36, 0.03).getPoints(16).reverse());
  const shape = rrShape(0.6, 0.42, 0.04);
  shape.holes.push(inner);
  mesh(slabFromShape(shape, 0.2, { bevel: 0.005 }), steel, { parent: g, at: [0, 0.75, 0] });
  mesh(roundedBox(0.6, 0.02, 0.42, 0.01), steel, { parent: g, at: [0, 0.76, 0] });
  const lamps = lampSet(`${name}_embers`, 'amber');
  lamps.add(g, { at: [0, 0.771, 0], normal: [0, 1, 0], w: 0.4, h: 0.26, bezel: false, depth: 0.01 });
  const bars = [];
  for (let i = 0; i < 9; i++) bars.push({ at: [-0.24 + i * 0.06, 0.92, 0] });
  inst(g, new THREE.CylinderGeometry(0.005, 0.005, 0.36, 5).rotateX(Math.PI / 2), M.metal('#8a9096', 0.4), bars, 'grate');
  const lid = group(name, { parent: g, at: [0, 0.95, -0.21] });
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.42, 20, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(0).scale(1, 0.45, 1).translate(0, 0, 0.21), steel, { parent: lid });
  anims.push(clip('open', 3, [rotateTrack(lid, 'x', 3, (t) => -pingPong(t) * 1.2)]), lampOn(`${name}_embers`, 2.4));
  return g;
}

export const BBQ_GRILL_VARIANTS = { pedestal: {}, brick: {}, double: {}, 'fire-pit': { style: 'rustic' } };
export const createBbqGrill = defineType('bbq-grill', BBQ_GRILL_VARIANTS, (root, ctx, v, variant) => {
  const anims = [];
  pad(root, 2.2 * ctx.k, 2 * ctx.k, ctx.style === 'rustic' ? ctx.m.gravel : ctx.m.concrete, { h: 0.04, shape: variant === 'fire-pit' ? 'round' : 'rect', r: 0.1, name: 'pad' });
  const y = 0.04;
  if (variant === 'pedestal') grillStand(root, ctx, 0, 0, y, anims);
  else if (variant === 'double') {
    // two grills on a shared post frame, only one lid animates
    grillStand(root, ctx, -0.4, 0, y, anims);
    const extra = [];
    grillStand(root, ctx, 0.4, 0, y, extra, 'lid2');
    anims.push(extra[1]);
    mesh(roundedBox(0.2, 0.04, 0.42, 0.01), M.metal('#8a9096', 0.35), { parent: root, at: [0, y + 0.95, 0] });
  } else if (variant === 'brick') {
    const bm = ctx.style === 'modern' ? ctx.m.concrete : ctx.style === 'rustic' || ctx.style === 'japanese' ? ctx.m.stone : mat.brick();
    const outer = rrShape(1.3, 0.8, 0.03);
    outer.holes.push(new THREE.Path(rrShape(0.8, 0.5, 0.02).getPoints(12).reverse()));
    mesh(slabFromShape(outer, 0.85, { bevel: 0.01 }), bm, { parent: root, at: [0, y, 0], name: 'hearth' });
    mesh(roundedBox(0.8, 0.5, 0.5, 0.02), mat.concrete('#3a3530'), { parent: root, at: [0, y + 0.25, 0] });
    const lamps = lampSet('embers', 'amber');
    lamps.add(root, { at: [0, y + 0.501, 0], normal: [0, 1, 0], w: 0.6, h: 0.35, bezel: false, depth: 0.01 });
    const bars = [];
    for (let i = 0; i < 12; i++) bars.push({ at: [-0.36 + i * 0.065, y + 0.8, 0] });
    inst(root, new THREE.CylinderGeometry(0.006, 0.006, 0.52, 5).rotateX(Math.PI / 2), M.metal('#8a9096', 0.4), bars, 'grate');
    mesh(roundedBox(1.3, 0.9, 0.2, 0.02), bm, { parent: root, at: [0, y + 1.3, -0.3] });
    mesh(roundedBox(0.4, 0.6, 0.2, 0.02), bm, { parent: root, at: [0, y + 2.05, -0.3], name: 'chimney' });
    anims.push(lampOn('embers', 2.4));
  } else {
    // stone fire ring with swing-arm grill
    const n = 14;
    const items = [];
    for (let i = 0; i < n; i++) {
      const [x, z] = polar(0.6, (i / n) * Math.PI * 2);
      items.push({ at: [x, y + 0.1, z], s: [0.16, 0.13, 0.12], rot: [0, (i / n) * Math.PI * 2, 0] });
    }
    inst(root, new THREE.IcosahedronGeometry(1, 1), ctx.m.stone, items, 'ring-stones');
    mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 24), mat.concrete('#2a2622'), { parent: root, at: [0, y + 0.015, 0] });
    // logs + embers
    const lamps = lampSet('embers', 'amber');
    lamps.add(root, { at: [0, y + 0.031, 0], normal: [0, 1, 0], w: 0.5, h: 0.5, shape: 'round', bezel: false, depth: 0.01 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const lg = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), ctx.m.bark, { parent: root, at: [Math.cos(a) * 0.08, y + 0.17, Math.sin(a) * 0.08] });
      lg.rotation.set(0, -a, 1.05);
      lg.rotateZ(0);
    }
    const iron = mat.iron('#22262a');
    tube([0.85, y, 0], [0.85, y + 0.75, 0], 0.025, iron, { parent: root });
    const arm = group('arm', { parent: root, at: [0.85, y + 0.55, 0] });
    tube([0, 0, 0], [-0.55, 0, 0], 0.015, iron, { parent: arm });
    const bars = [];
    for (let i = 0; i < 8; i++) bars.push({ at: [-0.85 + i * 0.07, 0, 0] });
    inst(arm, new THREE.CylinderGeometry(0.005, 0.005, 0.5, 5).rotateX(Math.PI / 2), iron, bars, 'grate');
    mesh(new THREE.TorusGeometry(0.28, 0.01, 6, 24).rotateX(Math.PI / 2), iron, { parent: arm, at: [-0.6, 0, 0] });
    anims.push(lampOn('embers', 2.4), clip('swing', 4, [rotateTrack(arm, 'y', 4, (t) => pingPong(t) * 1.4)]));
    // log seats
    for (let i = 0; i < 3; i++) {
      const [x, z] = polar(1.5 * ctx.k, Math.PI * 0.6 + i * 0.9);
      const lg = mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.1, 14).rotateZ(Math.PI / 2), ctx.m.bark, { parent: root, at: [x, y + 0.2, z] });
      lg.rotation.y = Math.atan2(x, z) + Math.PI / 2;
    }
  }
  return anims;
});

/* ------------------------------- Game table ------------------------------- */

function chessTop(parent, size, at, pieces = true, scale = 1) {
  const light = mat.stone('#ece4d0');
  const dark = mat.stone('#3a3530');
  const s = size / 8;
  const L = [];
  const D = [];
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) ((i + j) % 2 ? D : L).push({ at: [at[0] - size / 2 + (i + 0.5) * s, at[1], at[2] - size / 2 + (j + 0.5) * s] });
  const sq = new THREE.BoxGeometry(s, 0.004 * scale + 0.002, s);
  inst(parent, sq, light, L, 'squares-light');
  inst(parent, sq, dark, D, 'squares-dark');
  if (!pieces) return;
  const pawn = lathe([[0.001, 0], [0.4, 0], [0.38, 0.1], [0.2, 0.2], [0.14, 0.55], [0.24, 0.62], [0.001, 0.62], [0.001, 0.62]], 16);
  pawn.scale(s, s, s);
  const king = lathe([[0.001, 0], [0.42, 0], [0.4, 0.1], [0.22, 0.25], [0.15, 0.9], [0.28, 1.0], [0.18, 1.1], [0.05, 1.3], [0.001, 1.3]], 16);
  king.scale(s, s, s);
  const W = [];
  const B = [];
  const KW = [];
  const KB = [];
  const y = at[1] + 0.002 * scale + 0.001;
  for (let i = 0; i < 8; i++) {
    W.push({ at: [at[0] - size / 2 + (i + 0.5) * s, y, at[2] - size / 2 + 1.5 * s] });
    B.push({ at: [at[0] - size / 2 + (i + 0.5) * s, y, at[2] + size / 2 - 1.5 * s] });
  }
  KW.push({ at: [at[0] + 0.5 * s, y, at[2] - size / 2 + 0.5 * s] }, { at: [at[0] - 0.5 * s, y, at[2] - size / 2 + 0.5 * s] });
  KB.push({ at: [at[0] + 0.5 * s, y, at[2] + size / 2 - 0.5 * s] }, { at: [at[0] - 0.5 * s, y, at[2] + size / 2 - 0.5 * s] });
  const wm = M.plastic('#f4f1ea', 0.3);
  const bm = M.plastic('#1f1d1b', 0.3);
  inst(parent, pawn, wm, W, 'pawns-white');
  inst(parent, pawn, bm, B, 'pawns-black');
  inst(parent, king, wm, KW, 'royals-white');
  inst(parent, king, bm, KB, 'royals-black');
}

export const GAME_TABLE_VARIANTS = { chess: {}, 'double-chess': {}, 'giant-chess': {}, 'ping-pong': { style: 'modern' } };
export const createGameTable = defineType('game-table', GAME_TABLE_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const st = ctx.style;
  const tm = st === 'modern' ? ctx.m.concrete : st === 'rustic' ? M.wood('#8a6440') : st === 'japanese' ? mat.stone('#77736c') : st === 'victorian' ? mat.iron('#1e3a2e') : mat.stone('#b9b2a6');
  const top = st === 'victorian' ? mat.stone('#d2c8b4') : tm;
  if (variant === 'giant-chess') {
    const S = 4.8 * k;
    pad(root, S + 1.6, S + 1.6, st === 'rustic' ? ctx.m.gravel : ctx.m.stone, { h: 0.04, r: 0.1, name: 'paving' });
    chessTop(root, S, [0, 0.042, 0], true, 10);
    parkBench(root, ctx, 0, S / 2 + 0.45, Math.PI, 0.04);
    return [];
  }
  if (variant === 'ping-pong') {
    pad(root, 5 * k, 3.6 * k, ctx.m.concrete, { h: 0.04, r: 0.1, name: 'pad' });
    mesh(roundedBox(2.74, 0.06, 1.525, 0.01), st === 'modern' ? mat.concrete('#3f6a8a') : mat.paint('#2f6a4a'), { parent: root, at: [0, 0.04 + 0.73, 0], name: 'table' });
    for (const x of [-0.9, 0.9]) mesh(roundedBox(0.2, 0.7, 1.2, 0.03), tm, { parent: root, at: [x, 0.04 + 0.35, 0] });
    inst(root, new THREE.BoxGeometry(2.74, 0.006, 0.02), mat.paint('#f4f1ea'), [{ at: [0, 0.04 + 0.763, 0.75] }, { at: [0, 0.04 + 0.763, -0.75] }], 'lines');
    mesh(roundedBox(0.04, 0.16, 1.7, 0.01), M.metal('#c5c9cc', 0.3), { parent: root, at: [0, 0.04 + 0.84, 0], name: 'net' });
    return [];
  }
  const n = variant === 'double-chess' ? 2 : 1;
  pad(root, (n === 2 ? 4.4 : 2.6) * k, 2.6 * k, st === 'rustic' ? ctx.m.gravel : ctx.m.stone, { h: 0.04, r: 0.1, name: 'paving' });
  for (let i = 0; i < n; i++) {
    const x = n === 2 ? (i - 0.5) * 2.2 : 0;
    mesh(lathe([[0.001, 0], [0.3, 0], [0.22, 0.06], [0.12, 0.12], [0.1, 0.68], [0.001, 0.68]], 20), tm, { parent: root, at: [x, 0.04, 0] });
    mesh(roundedBox(0.8, 0.06, 0.8, 0.02), top, { parent: root, at: [x, 0.04 + 0.71, 0], name: 'table-top' });
    chessTop(root, 0.6, [x, 0.04 + 0.742, 0], true);
    for (const [sx, sz] of [[0, 0.75], [0, -0.75]]) {
      if (st === 'rustic') mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.45, 14), ctx.m.bark, { parent: root, at: [x + sx, 0.04 + 0.225, sz] });
      else mesh(lathe([[0.001, 0], [0.2, 0], [0.14, 0.08], [0.12, 0.38], [0.2, 0.42], [0.2, 0.45], [0.001, 0.45]], 18), tm, { parent: root, at: [x + sx, 0.04, sz] });
    }
  }
  return [];
});
