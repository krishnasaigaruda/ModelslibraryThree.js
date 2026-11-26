import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, lathe, tube, curveTube, cushion } from '../../core/utils.js';
import { rotateTrack, clip, pingPong } from '../../core/animation.js';
import { defineType, pad, inst, lampSet, lampOn, mat, polar, slabFromShape, blobShape, textTex, panel } from './kit.js';

/* Campsite and beach sets. */

/* -------------------------------- Campsite -------------------------------- */

function fireRing(root, ctx, x, z, y) {
  const items = [];
  for (let i = 0; i < 12; i++) {
    const [px, pz] = polar(0.55, (i / 12) * Math.PI * 2);
    items.push({ at: [x + px, y + 0.09, z + pz], s: [0.15, 0.12, 0.12], rot: [0, (i / 12) * 6.28, 0] });
  }
  inst(root, new THREE.IcosahedronGeometry(1, 1), mat.stone('#7d776e'), items, 'fire-stones');
  mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.02, 20), mat.concrete('#2a2622'), { parent: root, at: [x, y + 0.01, z] });
  const logs = group('logs', { parent: root, at: [x, y + 0.02, z] });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const lg = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.6, 8), ctx.m.bark, { parent: logs });
    lg.position.set(Math.cos(a) * 0.12, 0.2, Math.sin(a) * 0.12);
    lg.rotation.set(0, -a, 0);
    lg.rotateZ(0.75);
  }
  if (!ctx.winter) {
    const fl = lampSet('fire', 'amber');
    fl.add(root, { geometry: new THREE.ConeGeometry(0.2, 0.55, 10).translate(x, y + 0.3, z), normal: [0, 1, 0], depth: 0.2 });
    return [clip('on', 0.6, [new THREE.NumberKeyframeTrack('fire.material.emissiveIntensity', [0, 0.2, 0.4, 0.6], [2.4, 3.2, 2.0, 2.4]), new THREE.NumberKeyframeTrack('fire_glow.material.opacity', [0, 0.3, 0.6], [0.8, 1, 0.8])])];
  }
  return [];
}

function domeTent(root, ctx, x, z, y, rot = 0, color = '#d8642a') {
  const g = group('tent', { parent: root, at: [x, y, z], rot: [0, rot, 0] });
  const fab = new THREE.MeshStandardMaterial({ color: M.toColor(ctx.style === 'modern' ? '#2a7ad0' : ctx.style === 'rustic' ? '#6a7a4a' : color), roughness: 0.75, side: THREE.DoubleSide, name: 'tent-fabric' });
  const dome = new THREE.SphereGeometry(1.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.scale(1, 0.95, 0.85);
  mesh(dome, fab, { parent: g, name: 'dome' });
  for (const a of [Math.PI / 4, -Math.PI / 4]) {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = (i / 12) * Math.PI;
      pts.push([Math.cos(t) * 1.2 * Math.cos(a), Math.sin(t) * 1.14, Math.cos(t) * 1.02 * Math.sin(a)]);
    }
    curveTube(pts, 0.012, M.metal('#3a3f44', 0.4), { parent: g, radialSegments: 5 });
  }
  const door = group('door', { parent: g, at: [0, 0, 1.02] });
  mesh(new THREE.CircleGeometry(0.5, 20, 0, Math.PI), new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 1, side: THREE.DoubleSide, name: 'tent-door' }), { parent: door, at: [0, 0.0, -0.03] });
  mesh(new THREE.PlaneGeometry(1.6, 1.4), new THREE.MeshStandardMaterial({ color: '#4a4a4a', roughness: 1, name: 'groundsheet' }), { parent: g, at: [0, 0.003, 0], rot: [-Math.PI / 2, 0, 0] });
  return g;
}

function ridgeTent(root, ctx, x, z, y, rot = 0) {
  const g = group('tent', { parent: root, at: [x, y, z], rot: [0, rot, 0] });
  const fab = new THREE.MeshStandardMaterial({ color: ctx.style === 'modern' ? '#e8b020' : '#c8b890', roughness: 0.8, side: THREE.DoubleSide, name: 'tent-fabric' });
  const L = 2.2;
  for (const s of [-1, 1]) {
    const p = mesh(new THREE.PlaneGeometry(L, 1.45), fab, { parent: g });
    p.position.set(0, 0.6, s * 0.43);
    p.rotation.x = -s * 0.62;
  }
  for (const xx of [-L / 2, L / 2]) tube([xx, 0, 0], [xx, 1.22, 0], 0.015, M.wood('#8a6440'), { parent: g });
  tube([-L / 2, 1.2, 0], [L / 2, 1.2, 0], 0.012, M.metal('#8a9096'), { parent: g });
  for (const s of [-1, 1]) tube([s * (L / 2), 1.2, 0], [s * (L / 2 + 0.7), 0, 0], 0.004, M.matte('#e8e0c8'), { parent: g });
  mesh(new THREE.PlaneGeometry(L, 1.7), new THREE.MeshStandardMaterial({ color: '#4a4a4a', roughness: 1, name: 'groundsheet' }), { parent: g, at: [0, 0.003, 0], rot: [-Math.PI / 2, 0, 0] });
  return g;
}

function logSeat(root, ctx, x, z, y, rot) {
  const lg = mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.4, 14).rotateZ(Math.PI / 2), ctx.m.bark, { parent: root, at: [x, y + 0.2, z], name: 'log-seat' });
  lg.rotation.y = rot;
  for (const s of [-1, 1]) {
    const e = mesh(new THREE.CircleGeometry(0.2, 14), M.wood('#c8a070'), { parent: lg, at: [s * 0.701, 0, 0], rot: [0, s * Math.PI / 2, 0] });
    void e;
  }
}

export const CAMPSITE_VARIANTS = { 'dome-tent': {}, 'ridge-tent': {}, 'fire-ring': {}, 'log-seats': {}, camp: {} };
export const createCampsite = defineType('campsite', CAMPSITE_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const ground = ctx.winter ? mat.lawn('#eef3f7') : ctx.autumn ? mat.lawn('#8a7a42') : mat.lawn('#6a8a3a');
  ground.name = 'lawn';
  const S = (variant === 'camp' ? 12 : 5) * k;
  pad(root, S, S * 0.8, ground, { h: 0.04, shape: 'blob', rand: ctx.r, name: 'lawn' });
  const y = 0.04;
  const anims = [];
  if (variant === 'dome-tent') domeTent(root, ctx, 0, 0, y);
  else if (variant === 'ridge-tent') ridgeTent(root, ctx, 0, 0, y);
  else if (variant === 'fire-ring') {
    anims.push(...fireRing(root, ctx, 0, 0, y));
    // tripod with kettle
    for (let i = 0; i < 3; i++) {
      const [px, pz] = polar(0.7, (i / 3) * Math.PI * 2);
      tube([px, y, pz], [0, y + 1.3, 0], 0.015, mat.iron('#22262a'), { parent: root });
    }
    tube([0, y + 1.3, 0], [0, y + 0.8, 0], 0.004, mat.iron('#22262a'), { parent: root });
    mesh(lathe([[0.001, 0], [0.12, 0], [0.14, 0.1], [0.1, 0.18], [0.001, 0.2]], 16), mat.iron('#22262a'), { parent: root, at: [0, y + 0.6, 0], name: 'kettle' });
  } else if (variant === 'log-seats') {
    anims.push(...fireRing(root, ctx, 0, 0, y));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const [px, pz] = polar(1.5, a);
      logSeat(root, ctx, px, pz, y, a + Math.PI / 2);
    }
  } else {
    anims.push(...fireRing(root, ctx, 0, 0, y));
    domeTent(root, ctx, -3 * k, -2.2 * k, y, 0.4);
    ridgeTent(root, ctx, 3 * k, -2.4 * k, y, -0.3);
    for (let i = 0; i < 2; i++) {
      const a = Math.PI * 0.35 + i * 1.1;
      const [px, pz] = polar(1.6, a);
      logSeat(root, ctx, px, pz, y, a + Math.PI / 2);
    }
    // camp table and lantern
    mesh(roundedBox(1.0, 0.04, 0.6, 0.01), M.wood('#a87a4c'), { parent: root, at: [-2.5 * k, y + 0.72, 2.4 * k] });
    for (const sx of [-0.45, 0.45]) for (const sz of [-0.25, 0.25]) tube([-2.5 * k + sx, y, 2.4 * k + sz], [-2.5 * k + sx, y + 0.7, 2.4 * k + sz], 0.012, M.metal('#8a9096'), { parent: root });
    mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 12), M.metal('#2a2a2a'), { parent: root, at: [-2.5 * k, y + 0.76, 2.4 * k] });
    const ln = lampSet('lantern', 'fog');
    ln.add(root, { geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.14, 12).translate(-2.5 * k, y + 0.85, 2.4 * k), normal: [0, 0, 1], depth: 0.05 });
    anims.push(clip('lantern', 1, lampOn('lantern', 3).tracks));
    // cooler & firewood stack
    mesh(roundedBox(0.6, 0.38, 0.38, 0.05), M.plastic('#d23a2a', 0.4), { parent: root, at: [2.6 * k, y + 0.19, 2.2 * k] });
    const wood = [];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) wood.push({ at: [4 * k, y + 0.07 + r * 0.13, 0.5 + (i - (3 - r) / 2) * 0.14] });
    inst(root, new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8).rotateZ(Math.PI / 2), ctx.m.bark, wood, 'firewood');
  }
  return anims;
});

/* -------------------------------- Beach set -------------------------------- */

const stripe = (key, a, b) => (typeof document === 'undefined' ? null : (() => {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * 8, 0, 8, 64); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
})());

export const BEACH_VARIANTS = { umbrella: {}, lounger: {}, 'lifeguard-tower': {}, 'beach-hut': {}, beach: {} };
export const createBeachSet = defineType('beach-set', BEACH_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const S = (variant === 'beach' ? 14 : variant === 'lifeguard-tower' ? 6 : 4) * k;
  const sand = ctx.m.sand;
  pad(root, S, S * 0.8, sand, { h: 0.05, shape: 'blob', rand: ctx.r, name: 'sand' });
  const y = 0.05;
  const anims = [];
  const col = { classic: ['#d23a2a', '#f4f1ea'], victorian: ['#1e3a6a', '#f4f1ea'], modern: ['#2a9ad0', '#f4f1ea'], rustic: ['#c8a060', '#a07840'], japanese: ['#b8382a', '#ece4d0'] }[ctx.style];
  const umbrella = (x, z, tilt = 0.15) => {
    const g = group('umbrella', { parent: root, at: [x, y, z], rot: [tilt, 0, 0] });
    tube([0, -0.1, 0], [0, 2.2, 0], 0.02, M.wood('#d8c8a0'), { parent: g });
    const tex = stripe('u', col[0], col[1]);
    const canopy = new THREE.ConeGeometry(1.1, 0.4, 16, 1, true);
    mesh(canopy, new THREE.MeshStandardMaterial({ map: tex ?? null, color: tex ? '#ffffff' : col[0], roughness: 0.8, side: THREE.DoubleSide, name: 'canopy' }), { parent: g, at: [0, 2.0, 0] });
    mesh(new THREE.SphereGeometry(0.04, 10, 8), M.wood('#d8c8a0'), { parent: g, at: [0, 2.22, 0] });
    return g;
  };
  const lounger = (x, z, rot = 0) => {
    const g = group('lounger', { parent: root, at: [x, y, z], rot: [0, rot, 0] });
    const fm = ctx.style === 'rustic' ? M.wood('#a87a4c') : ctx.style === 'modern' ? M.plastic('#f4f1ea', 0.4) : M.wood('#c8a070');
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.3, 0.3]) mesh(roundedBox(0.05, 0.3, 0.05, 0.01), fm, { parent: g, at: [sx, 0.15, sz] });
    mesh(roundedBox(1.3, 0.05, 0.66, 0.02), fm, { parent: g, at: [-0.15, 0.32, 0] });
    const back = mesh(roundedBox(0.6, 0.05, 0.66, 0.02), fm, { parent: g, name: 'back' });
    back.position.set(0.72, 0.5, 0);
    back.rotation.z = 0.7;
    mesh(cushion(1.2, 0.06, 0.6), M.fabric(col[0]), { parent: g, at: [-0.15, 0.375, 0] });
    mesh(new THREE.PlaneGeometry(0.8, 1.6), new THREE.MeshStandardMaterial({ color: col[1], roughness: 0.9, name: 'towel' }), { parent: root, at: [x + 0.2, y + 0.003, z + 1.2], rot: [-Math.PI / 2, 0, rot + 0.3] });
    return g;
  };
  if (variant === 'umbrella') {
    umbrella(0, 0);
    mesh(new THREE.PlaneGeometry(0.9, 1.7), new THREE.MeshStandardMaterial({ color: col[0], roughness: 0.9, name: 'towel' }), { parent: root, at: [0.6, y + 0.003, 0.4], rot: [-Math.PI / 2, 0, 0.3] });
  } else if (variant === 'lounger') {
    lounger(0, 0);
    umbrella(-0.4, -0.7, 0.1);
  } else if (variant === 'lifeguard-tower') {
    const H = 2.2;
    const wm = ctx.style === 'modern' ? mat.steel('#e8e8e8') : M.wood(ctx.style === 'rustic' ? '#8a6440' : '#f4f1ea');
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.8, 0.8]) tube([sx * 1.15, y, sz * 1.15], [sx, y + H, sz], 0.06, wm, { parent: root });
    mesh(roundedBox(2.2, 0.1, 2.2, 0.02), M.wood('#c8a070'), { parent: root, at: [0, y + H + 0.05, 0], name: 'deck' });
    mesh(roundedBox(1.6, 1.4, 1.6, 0.04), mat.paint(ctx.style === 'modern' ? '#e8b020' : col[0]), { parent: root, at: [0, y + H + 0.8, -0.1], name: 'hut' });
    mesh(roundedBox(1.2, 0.5, 0.04, 0.01), M.glass({ tint: '#2a3a44' }), { parent: root, at: [0, y + H + 1.0, 0.71] });
    mesh(new THREE.ConeGeometry(1.4, 0.6, 4, 1, false, Math.PI / 4), mat.paint(col[1]), { parent: root, at: [0, y + H + 1.8, -0.1], name: 'roof' });
    for (const s of [-1, 1]) tube([0.5 * s, y + H + 0.1, 1.1], [0.5 * s, y + H + 1.0, 1.1], 0.03, wm, { parent: root });
    tube([-0.5, y + H + 1.0, 1.1], [0.5, y + H + 1.0, 1.1], 0.03, wm, { parent: root });
    // ramp
    const ramp = mesh(roundedBox(0.8, 0.06, 3.0, 0.02), M.wood('#c8a070'), { parent: root, name: 'ramp' });
    ramp.position.set(0, y + H / 2 + 0.12, 2.2);
    ramp.rotation.x = Math.atan2(H, 2.6);
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6), M.metal('#c5c9cc'), { parent: root, at: [0.75, y + H + 2.0, -0.7] });
    const flag = group('flag', { parent: root, at: [0.75, y + H + 2.7, -0.7] });
    mesh(new THREE.PlaneGeometry(0.6, 0.4).translate(0.3, 0, 0), new THREE.MeshStandardMaterial({ color: '#d23a2a', side: THREE.DoubleSide, name: 'flag' }), { parent: flag });
    mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 20), M.plastic('#ff6a1a', 0.4), { parent: root, at: [0.82, y + H + 0.8, -0.1], rot: [0, Math.PI / 2, 0] });
    anims.push(clip('wave', 1.6, [rotateTrack(flag, 'y', 1.6, (t) => Math.sin(t * Math.PI * 2) * 0.3)]));
  } else if (variant === 'beach-hut') {
    const hc = ['#2a9ad0', '#e8b020', '#d23a2a', '#2f9a4a'];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 1.9 * k;
      mesh(roundedBox(1.6, 0.25, 1.9, 0.02), M.wood('#a08060'), { parent: root, at: [x, y + 0.125, 0] });
      mesh(roundedBox(1.5, 1.9, 1.6, 0.02), mat.paint(ctx.style === 'rustic' ? '#a87a4c' : hc[i]), { parent: root, at: [x, y + 0.25 + 0.95, -0.1], name: 'hut' });
      const boards = [];
      for (let j = 0; j < 9; j++) boards.push({ at: [x - 0.7 + j * 0.175, y + 1.2, 0.71] });
      inst(root, roundedBox(0.03, 1.9, 0.02, 0.005, 1), mat.paint('#f4f1ea'), boards, `battens_${i}`);
      const roof = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.9, 0), new THREE.Vector2(0.9, 0), new THREE.Vector2(0, 0.6)]), { depth: 1.9, bevelEnabled: false });
      roof.translate(0, 0, -1.05);
      mesh(roof, mat.paint('#f4f1ea'), { parent: root, at: [x, y + 2.15, 0], name: 'roof' });
      const d = group(`door_${i}`, { parent: root, at: [x - 0.35, y + 0.25, 0.72] });
      mesh(roundedBox(0.7, 1.6, 0.04, 0.01), mat.paint('#f4f1ea'), { parent: d, at: [0.35, 0.8, 0.02] });
      if (i === 1) anims.push(clip('open', 4, [rotateTrack(d, 'y', 4, (t) => -pingPong(t) * 1.6)]));
    }
  } else {
    // little beach: sea edge, umbrellas, loungers, tower sign
    mesh(slabFromShape(blobShape(S * 0.38, S * 0.1, ctx.r, { n: 10, wobble: 0.05 }), 0.02, { y0: 0.04, bevel: 0 }), ctx.m.water, { parent: root, at: [0, 0, S * 0.22], name: 'water' });
    umbrella(-2.5 * k, -1, 0.1);
    umbrella(2.5 * k, -1.5, -0.1);
    lounger(-1.6 * k, -2.2, 0.1);
    lounger(1.4 * k, -2.6, -0.2);
    mesh(new THREE.SphereGeometry(0.2, 16, 12), M.plastic('#f2c230', 0.3), { parent: root, at: [0, y + 0.2, 0.5], name: 'ball' });
    tube([-5 * k, y, -3], [-5 * k, y + 2.0, -3], 0.04, M.wood('#8a6440'), { parent: root });
    mesh(roundedBox(0.9, 0.5, 0.04, 0.01), M.wood('#c8a070'), { parent: root, at: [-5 * k, y + 1.8, -2.97] });
    panel(root, 0.85, 0.45, textTex(['SWIM', 'BETWEEN FLAGS'], { w: 256, h: 140, bg: '#e8b020', fg: '#d23a2a', font: 'bold 36px Helvetica, Arial, sans-serif' }), { at: [-5 * k, y + 1.8, -2.948], color: '#e8b020' });
  }
  return anims;
});
