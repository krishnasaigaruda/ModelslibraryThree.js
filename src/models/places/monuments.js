import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, lathe, tube, curveTube } from '../../core/utils.js';
import { rotateTrack, moveTrack, clip, spinTrack, pingPong } from '../../core/animation.js';
import { defineType, pad, inst, lampSet, lampOn, leafClusters, blooms, mat, polar, panel, textTex } from './kit.js';

/* Monuments & garden ornaments: bird baths, statues, memorials, sundials. */

/** Stone by style (marble-ish for victorian, concrete for modern…). */
const monoStone = (ctx) => ({ classic: mat.stone('#c9c2b4'), victorian: mat.stone('#e4ddd0'), modern: mat.concrete('#b9b5ae'), rustic: mat.stone('#8e877c'), japanese: mat.stone('#77736c') })[ctx.style];
const bronze = (ctx) => (ctx.style === 'modern' ? M.metal('#8a4a2a', 0.8) : ctx.style === 'victorian' ? M.metal('#5f8a78', 0.45) : M.metal('#7a6a48', 0.4));

/** Small songbird (own design): body, head, beak, tail. Origin at the feet. */
function bird(parent, name, at, color = '#8a6a4a', rotY = 0) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const m = M.matte(color, 0.7);
  mesh(new THREE.SphereGeometry(0.05, 12, 8).scale(1.3, 1, 1), m, { parent: g, at: [0, 0.055, 0] });
  mesh(new THREE.SphereGeometry(0.032, 10, 8), m, { parent: g, at: [0.055, 0.095, 0] });
  mesh(new THREE.ConeGeometry(0.01, 0.03, 6).rotateZ(-Math.PI / 2), M.matte('#d8a030'), { parent: g, at: [0.095, 0.095, 0] });
  mesh(new THREE.BoxGeometry(0.06, 0.008, 0.035), m, { parent: g, at: [-0.085, 0.07, 0], rot: [0, 0, 0.35] });
  tube([0, 0, 0], [0.005, 0.02, 0], 0.004, M.matte('#c09060'), { parent: g });
  return g;
}

/** Plinth by style; returns its top height. */
function plinth(parent, ctx, w, h, at = [0, 0, 0]) {
  const s = monoStone(ctx);
  if (ctx.style === 'modern') {
    mesh(roundedBox(w, h, w, 0.02), s, { parent, at: [at[0], at[1] + h / 2, at[2]], name: 'plinth' });
    return at[1] + h;
  }
  if (ctx.style === 'rustic') {
    mesh(new THREE.IcosahedronGeometry(1, 1).scale(w * 0.7, h * 0.55, w * 0.6), s, { parent, at: [at[0], at[1] + h * 0.45, at[2]], name: 'plinth' });
    mesh(roundedBox(w * 0.8, 0.06, w * 0.8, 0.02), s, { parent, at: [at[0], at[1] + h - 0.03, at[2]] });
    return at[1] + h;
  }
  mesh(roundedBox(w + 0.2, 0.14, w + 0.2, 0.02), s, { parent, at: [at[0], at[1] + 0.07, at[2]] });
  mesh(roundedBox(w, h - 0.28, w, 0.02), s, { parent, at: [at[0], at[1] + 0.14 + (h - 0.28) / 2, at[2]], name: 'plinth' });
  mesh(roundedBox(w + 0.14, 0.14, w + 0.14, 0.03), s, { parent, at: [at[0], at[1] + h - 0.07, at[2]] });
  return at[1] + h;
}

/* -------------------------------- Bird bath -------------------------------- */

export const BIRD_BATH_VARIANTS = { pedestal: {}, tiered: { style: 'victorian' }, ground: { style: 'rustic' } };
export const createBirdBath = defineType('bird-bath', BIRD_BATH_VARIANTS, (root, ctx, v, variant) => {
  const s = monoStone(ctx);
  const k = Math.sqrt(ctx.k);
  const water = ctx.m.water;
  const anims = [];
  const bowl = (y, R, d = 0.08) => {
    mesh(lathe([[0.001, 0], [R * 0.4, 0], [R, d], [R, d + 0.03], [R - 0.03, d + 0.03], [R * 0.4 - 0.02, 0.03], [0.001, 0.03]], 32), s, { parent: root, at: [0, y, 0], name: 'bowl' });
    mesh(new THREE.CylinderGeometry(R - 0.035, R * 0.42, d - 0.01, 32), water, { parent: root, at: [0, y + 0.03 + (d - 0.01) / 2, 0], name: 'water' });
    return y + d + 0.03;
  };
  let rimY;
  let R;
  if (variant === 'ground') {
    for (let i = 0; i < 5; i++) {
      const [x, z] = polar(0.22 * k, (i / 5) * Math.PI * 2);
      mesh(new THREE.IcosahedronGeometry(0.14, 1).scale(1, 0.7, 1), s, { parent: root, at: [x, 0.09, z] });
    }
    R = 0.42 * k;
    rimY = bowl(0.17, R, 0.07);
  } else {
    const H = (variant === 'tiered' ? 0.75 : 0.7) * k;
    const prof = ctx.style === 'modern' ? [[0.001, 0], [0.16, 0], [0.16, H], [0.001, H]] : [[0.001, 0], [0.2, 0], [0.2, 0.06], [0.14, 0.12], [0.09, 0.22], [0.07, H * 0.7], [0.1, H - 0.05], [0.14, H], [0.001, H]];
    mesh(lathe(prof, 28), s, { parent: root, name: 'pedestal' });
    R = 0.32 * k;
    rimY = bowl(H, R);
    if (variant === 'tiered') {
      mesh(lathe([[0.001, 0], [0.05, 0], [0.04, 0.3], [0.001, 0.3]], 16), s, { parent: root, at: [0, H + 0.03, 0] });
      bowl(H + 0.33, 0.15, 0.05);
      mesh(new THREE.SphereGeometry(0.04, 14, 10), s, { parent: root, at: [0, H + 0.44, 0] });
    }
  }
  if (!ctx.winter) {
    const b1 = bird(root, 'bird_1', [R - 0.02, rimY, 0], ctx.autumn ? '#8a5a3a' : '#7a6a5a', Math.PI);
    const b2 = bird(root, 'bird_2', [-(R - 0.02) * 0.7, rimY, (R - 0.02) * 0.7], '#c8462a', -Math.PI / 4);
    anims.push(clip('peck', 2, [rotateTrack(b1, 'z', 2, (t) => -Math.max(0, Math.sin(t * Math.PI * 4)) * 0.5), rotateTrack(b2, 'z', 2, (t) => -Math.max(0, Math.sin(t * Math.PI * 4 + 1.5)) * 0.4)]));
  }
  return anims;
});

/* --------------------------------- Statue --------------------------------- */

export const STATUE_VARIANTS = { figure: {}, bust: {}, abstract: { style: 'modern' }, urn: { style: 'victorian' } };
export const createStatue = defineType('statue', STATUE_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const b = ctx.style === 'victorian' || ctx.style === 'classic' ? (variant === 'bust' ? mat.stone('#ece6da') : bronze(ctx)) : bronze(ctx);
  pad(root, 3 * k, 3 * k, ctx.style === 'rustic' ? ctx.m.gravel : ctx.m.stone, { h: 0.04, shape: ctx.style === 'japanese' ? 'round' : 'rect', r: 0.1, name: 'paving' });
  const top = plinth(root, ctx, variant === 'figure' ? 0.9 : 0.7, variant === 'figure' ? 1.4 : 1.2, [0, 0.04, 0]);
  if (variant === 'figure') {
    // standing robed figure with raised arm (own, generic design)
    const g = group('figure', { parent: root, at: [0, top, 0] });
    mesh(roundedBox(0.7, 0.06, 0.5, 0.02), b, { parent: g, at: [0, 0.03, 0] });
    mesh(lathe([[0.001, 0], [0.3, 0], [0.27, 0.4], [0.2, 0.9], [0.22, 1.25], [0.25, 1.4], [0.15, 1.5], [0.07, 1.55], [0.001, 1.56]], 24), b, { parent: g, at: [0, 0.06, 0] });
    mesh(new THREE.SphereGeometry(0.12, 18, 14).scale(0.9, 1.1, 1), b, { parent: g, at: [0, 1.74, 0] });
    curveTube([[0.2, 1.4, 0], [0.32, 1.65, 0.02], [0.36, 1.95, 0.05], [0.35, 2.15, 0.05]], 0.05, b, { parent: g, radialSegments: 10 });
    curveTube([[-0.2, 1.4, 0], [-0.28, 1.15, 0.08], [-0.25, 0.95, 0.12]], 0.05, b, { parent: g, radialSegments: 10 });
    mesh(roundedBox(0.2, 0.26, 0.05, 0.01), b, { parent: g, at: [-0.24, 0.9, 0.16], rot: [0.2, 0, 0] });
    mesh(new THREE.SphereGeometry(0.06, 12, 10), b, { parent: g, at: [0.35, 2.18, 0.05] });
  } else if (variant === 'bust') {
    mesh(lathe([[0.001, 0], [0.32, 0], [0.34, 0.06], [0.24, 0.25], [0.12, 0.32], [0.08, 0.42], [0.001, 0.42]], 24), b, { parent: root, at: [0, top, 0], name: 'shoulders' });
    mesh(new THREE.SphereGeometry(0.14, 20, 16).scale(0.85, 1.1, 0.95), b, { parent: root, at: [0, top + 0.56, 0], name: 'head' });
    mesh(new THREE.ConeGeometry(0.02, 0.05, 8).rotateX(Math.PI / 2), b, { parent: root, at: [0, top + 0.55, 0.135] });
  } else if (variant === 'abstract') {
    const knot = mesh(new THREE.TorusKnotGeometry(0.42, 0.1, 96, 14, 2, 3), b, { parent: root, at: [0, top + 0.62, 0], name: 'sculpture' });
    knot.rotation.x = 0.3;
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12), b, { parent: root, at: [0, top + 0.06, 0] });
    return [clip('spin', 20, [spinTrack(knot, 'y', 20)])];
  } else {
    const s = monoStone(ctx);
    mesh(lathe([[0.001, 0], [0.2, 0], [0.2, 0.06], [0.1, 0.12], [0.1, 0.2], [0.3, 0.42], [0.36, 0.6], [0.33, 0.68], [0.38, 0.72], [0.36, 0.74], [0.3, 0.7], [0.28, 0.5], [0.001, 0.5]], 32), s, { parent: root, at: [0, top, 0], name: 'urn' });
    if (!ctx.winter) {
      const pts = [];
      for (let i = 0; i < 14; i++) { const [x, z] = polar(0.2 * ctx.r() + 0.06, ctx.r() * 6.28); pts.push([x, top + 0.72 + ctx.r() * 0.2, z]); }
      leafClusters(root, ctx, pts, { size: 0.12 });
      blooms(root, ctx, pts.slice(0, 8).map(([x, y, z]) => [x, y + 0.1, z]), { size: 0.04 });
    }
    for (const sx of [-1, 1]) mesh(new THREE.TorusGeometry(0.08, 0.018, 8, 16), s, { parent: root, at: [sx * 0.37, top + 0.6, 0], rot: [0, Math.PI / 2, 0] });
  }
  // inscription plaque
  const ptex = textTex(['IN HONOUR OF', 'THE GARDENERS'], { w: 512, h: 180, bg: '#b8913a', fg: '#3a2a08', font: 'bold 50px Georgia, serif' });
  if (ctx.style === 'rustic') panel(root, 0.5, 0.18, ptex, { at: [0, 0.041, 0.95], color: '#b8913a' }).rotation.set(-Math.PI / 2, 0, 0);
  else panel(root, 0.5, 0.18, ptex, { at: [0, 0.04 + (variant === 'figure' ? 0.8 : 0.7), variant === 'figure' ? 0.451 : 0.351], color: '#b8913a' });
  // uplights
  const lamps = lampSet('uplights', 'white');
  for (const sx of [-1, 1]) {
    mesh(roundedBox(0.16, 0.06, 0.16, 0.02), M.metal('#3a3f44'), { parent: root, at: [sx * 0.8 * k, 0.07, 0.9 * k] });
    lamps.add(root, { at: [sx * 0.8 * k, 0.101, 0.9 * k], normal: [0, 1, 0], w: 0.1, h: 0.1, shape: 'round' });
  }
  return [lampOn('uplights', 3)];
});

/* -------------------------------- Memorial -------------------------------- */

/** Wreath leaning against a surface: leafy torus with red flowers. */
function wreath(parent, ctx, at, rotX = -0.25) {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push([at[0] + Math.cos(a) * 0.25, at[1] + Math.sin(a) * 0.25 * Math.cos(rotX), at[2] - Math.sin(a) * 0.25 * Math.sin(rotX)]);
  }
  leafClusters(parent, { ...ctx, m: { ...ctx.m, leaf: ctx.m.leaf.slice(0, 2) } }, pts, { size: 0.07 });
  if (!ctx.winter) inst(parent, new THREE.SphereGeometry(0.04, 10, 8), mat.bloom('#c8102e'), pts.filter((_, i) => i % 2).map((p) => ({ at: [p[0], p[1], p[2] + 0.04] })), 'poppies');
}

export const MEMORIAL_VARIANTS = { obelisk: {}, column: { style: 'victorian' }, cenotaph: {}, stele: { style: 'modern' } };
export const createMemorial = defineType('memorial', MEMORIAL_VARIANTS, (root, ctx, v, variant) => {
  const k = ctx.k;
  const s = monoStone(ctx);
  pad(root, 5 * k, 5 * k, ctx.style === 'rustic' ? ctx.m.gravel : ctx.m.stone, { h: 0.04, r: 0.1, name: 'paving' });
  // stepped base
  let y = 0.04;
  for (let i = 0; i < 3; i++) {
    const w = (2.4 - i * 0.5) * Math.sqrt(k);
    mesh(roundedBox(w, 0.2, variant === 'stele' ? w * 0.5 : w, 0.02), s, { parent: root, at: [0, y + 0.1, 0], name: `step_${i}` });
    y += 0.2;
  }
  const insc = textTex(['IN REMEMBRANCE'], { w: 768, h: 160, bg: ctx.style === 'modern' ? '#b9b5ae' : '#c9c2b4', fg: '#2a2622', font: 'bold 80px Georgia, serif' });
  let face = 0.5;
  if (variant === 'obelisk') {
    const H = 5.5 * Math.sqrt(k);
    mesh(roundedBox(1.0, 1.0, 1.0, 0.02), s, { parent: root, at: [0, y + 0.5, 0], name: 'die' });
    face = 0.501;
    const g = new THREE.CylinderGeometry(0.28, 0.42, H, 4, 1, false, Math.PI / 4);
    mesh(g, s, { parent: root, at: [0, y + 1.0 + H / 2, 0], name: 'shaft' });
    mesh(new THREE.ConeGeometry(0.28 * Math.SQRT2 / Math.SQRT2, 0.4, 4, 1, false, Math.PI / 4), ctx.style === 'victorian' ? ctx.m.gold : s, { parent: root, at: [0, y + 1.0 + H + 0.2, 0], name: 'pyramidion' });
    panel(root, 0.85, 0.18, insc, { at: [0, y + 0.6, face] });
  } else if (variant === 'column') {
    mesh(roundedBox(1.0, 1.1, 1.0, 0.02), s, { parent: root, at: [0, y + 0.55, 0], name: 'pedestal' });
    face = 0.501;
    panel(root, 0.85, 0.18, insc, { at: [0, y + 0.7, face] });
    const H = 4 * Math.sqrt(k);
    const flutes = [];
    for (let i = 0; i < 16; i++) flutes.push([0.3 + (i % 2 ? -0.015 : 0.015), 0]);
    mesh(lathe([[0.001, 0], [0.4, 0], [0.38, 0.1], [0.32, 0.16], [0.3, 0.2], [0.26, H - 0.3], [0.3, H - 0.2], [0.42, H - 0.08], [0.42, H], [0.001, H]], 32), s, { parent: root, at: [0, y + 1.1, 0], name: 'column' });
    mesh(roundedBox(0.95, 0.12, 0.95, 0.02), s, { parent: root, at: [0, y + 1.1 + H + 0.06, 0] });
    mesh(lathe([[0.001, 0], [0.16, 0], [0.1, 0.1], [0.24, 0.35], [0.2, 0.5], [0.08, 0.55], [0.12, 0.62], [0.001, 0.66]], 24), ctx.style === 'victorian' ? ctx.m.gold : s, { parent: root, at: [0, y + 1.22 + H, 0], name: 'urn' });
  } else if (variant === 'cenotaph') {
    const H = 2.6 * Math.sqrt(k);
    mesh(roundedBox(1.3, H, 0.9, 0.03), s, { parent: root, at: [0, y + H / 2, 0], name: 'block' });
    mesh(roundedBox(1.0, 0.4, 0.7, 0.04), s, { parent: root, at: [0, y + H + 0.2, 0], name: 'tomb' });
    face = 0.451;
    panel(root, 1.1, 0.22, insc, { at: [0, y + H * 0.7, face] });
    mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 24), ctx.m.gold, { parent: root, at: [0, y + H * 0.42, face + 0.01] });
  } else {
    const H = 2.2 * Math.sqrt(k);
    mesh(roundedBox(1.1, H, 0.24, 0.04), s, { parent: root, at: [0, y + H / 2, 0], name: 'stele' });
    face = 0.121;
    panel(root, 0.95, 0.2, insc, { at: [0, y + H * 0.75, face] });
    const names = textTex(['· · · · · · ·', '· · · · · · ·', '· · · · · · ·'], { w: 512, h: 400, bg: '#b9b5ae', fg: '#3a3630', font: 'bold 60px Georgia, serif' });
    panel(root, 0.8, 0.8, names, { at: [0, y + H * 0.4, face], color: '#b9b5ae' });
  }
  wreath(root, ctx, [0, y + 0.3, face + 0.08]);
  // flag pole beside
  mesh(new THREE.CylinderGeometry(0.035, 0.05, 6, 10), M.metal('#c5c9cc', 0.3), { parent: root, at: [1.9 * k, 3.04, -1.5 * k] });
  const flag = group('flag', { parent: root, at: [1.9 * k, 5.6, -1.5 * k] });
  mesh(new THREE.PlaneGeometry(1.2, 0.75).translate(0.62, 0, 0), new THREE.MeshStandardMaterial({ color: '#f4f1ea', side: THREE.DoubleSide, roughness: 0.8, name: 'flag' }), { parent: flag });
  return [clip('wave', 2, [rotateTrack(flag, 'y', 2, (t) => Math.sin(t * Math.PI * 2) * 0.2)])];
});

/* -------------------------------- Sundial -------------------------------- */

export const SUNDIAL_VARIANTS = { pedestal: {}, armillary: { style: 'victorian' }, ground: { style: 'modern' } };
export const createSundial = defineType('sundial', SUNDIAL_VARIANTS, (root, ctx, v, variant) => {
  const s = monoStone(ctx);
  const b = bronze(ctx);
  const k = ctx.k;
  if (variant === 'ground') {
    const R = 3 * k;
    pad(root, R * 2 + 1, R * 1.6 + 1, ctx.m.lawn, { h: 0.04, shape: 'round', name: 'lawn' });
    mesh(new THREE.CylinderGeometry(R, R, 0.03, 48).scale(1, 1, 0.7), mat.gravel(), { parent: root, at: [0, 0.055, 0] });
    const marks = [];
    for (let i = 0; i < 13; i++) {
      const a = -Math.PI / 2 + (i / 12) * Math.PI;
      marks.push({ at: [Math.sin(a) * (R - 0.3), 0.08, Math.cos(a) * (R - 0.3) * 0.7] });
    }
    inst(root, roundedBox(0.3, 0.06, 0.2, 0.02, 1), s, marks, 'hour-stones');
    mesh(roundedBox(0.5, 0.04, 1.6, 0.01), b, { parent: root, at: [0, 0.09, 0], name: 'date-scale' });
    panel(root, 0.6, 0.2, textTex(['STAND HERE'], { w: 512, h: 160, bg: '#8a6a3a', fg: '#f2e2b0', font: 'bold 70px Georgia, serif' }), { at: [0, 0.111, 0.6], color: '#8a6a3a' }).rotation.set(-Math.PI / 2, 0, 0);
    return [];
  }
  pad(root, 2.4 * k, 2.4 * k, ctx.style === 'rustic' ? ctx.m.gravel : ctx.m.stone, { h: 0.04, shape: 'round', name: 'paving' });
  const H = 1.0;
  const prof = ctx.style === 'modern' ? [[0.001, 0], [0.18, 0], [0.18, H], [0.001, H]] : [[0.001, 0], [0.3, 0], [0.3, 0.1], [0.22, 0.16], [0.14, 0.25], [0.12, 0.75], [0.18, 0.88], [0.22, H], [0.001, H]];
  mesh(lathe(prof, ctx.style === 'japanese' ? 8 : 28), s, { parent: root, at: [0, 0.04, 0], name: 'pedestal' });
  const top = 0.04 + H;
  if (variant === 'armillary') {
    const g = group('armillary', { parent: root, at: [0, top + 0.42, 0] });
    tube([0, -0.42, 0], [0, -0.3, 0], 0.03, b, { parent: root, name: 'stem' }).position.y += top + 0.42;
    mesh(new THREE.TorusGeometry(0.36, 0.014, 8, 48), b, { parent: g, rot: [Math.PI / 2, 0, 0] });
    mesh(new THREE.TorusGeometry(0.36, 0.014, 8, 48), b, { parent: g, rot: [0, 0, 0] });
    mesh(new THREE.TorusGeometry(0.36, 0.02, 8, 48), b, { parent: g, rot: [Math.PI / 2 - 0.9, 0, 0] });
    const arrow = tube([0, -0.45, -0.3], [0, 0.45, 0.3], 0.01, b, { parent: g });
    void arrow;
    mesh(new THREE.ConeGeometry(0.03, 0.08, 10), b, { parent: g, at: [0, 0.47, 0.31], rot: [0.6, 0, 0] });
    return [clip('spin', 24, [spinTrack(g, 'y', 24)])];
  }
  // dial plate with gnomon and hour marks
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 40), b, { parent: root, at: [0, top + 0.01, 0], name: 'dial' });
  const marks = [];
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * 0.6 + (i / 11) * Math.PI * 1.2;
    marks.push({ at: [Math.sin(a) * 0.25, top + 0.022, Math.cos(a) * 0.25], rot: [0, a, 0] });
  }
  inst(root, new THREE.BoxGeometry(0.008, 0.004, 0.05), M.metal('#2a2622', 0.5), marks, 'hour-marks');
  const gn = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.26, 0), new THREE.Vector2(0, 0.2)]), { depth: 0.008, bevelEnabled: false });
  gn.translate(-0.08, 0, -0.004);
  gn.rotateY(Math.PI / 2);
  mesh(gn, b, { parent: root, at: [0, top + 0.02, 0], name: 'gnomon' });
  const shadow = mesh(new THREE.PlaneGeometry(0.02, 0.22).rotateX(-Math.PI / 2).translate(0, 0, 0.11), new THREE.MeshBasicMaterial({ color: '#2a2622', transparent: true, opacity: 0.35, name: 'dial-shadow' }), { parent: root, at: [0, top + 0.0215, 0], name: 'shadow' });
  return [clip('time', 12, [rotateTrack(shadow, 'y', 12, (t) => -1.6 + t * 3.2)])];
});

void moveTrack; void pingPong;
