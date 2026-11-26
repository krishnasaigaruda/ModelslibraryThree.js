/*
 * More home furniture & objects: ottomans, benches, stools, pianos, fireplaces,
 * coat / shoe racks, toy chests, room dividers, curtains, outdoor furniture,
 * small kitchen appliances, kitchenware, bathroom accessories and decor items.
 * Built with the style-aware helpers in common.js, so style trims change legs,
 * handles, fronts, upholstery and finishes. Real dimensions in metres.
 */
import {
  THREE, M, mesh, group, roundedBox, cushion, curveTube, lathe, rng,
  woodMat, fabricMat, leatherMat, metalMat, plasticMat, glassMat, ceramic, enamel, stainless,
  taperBox, turnedLeg, panelFront, barPull, knob, buttons, pipedCushion, caneMat, rattanMat,
} from './common.js';
import { finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { brandEmblem } from '../../core/brand.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { rotateTrack, spinTrack, moveTrack, numberTrack, clip, wave, pingPong } from '../../core/animation.js';

const legs4 = (parent, W, w, h, d, inset = 0.04) => {
  for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(taperBox(w, h, w, 0.7), W, { parent, at: [sx * (d[0] / 2 - inset), h / 2, sz * (d[1] / 2 - inset)] });
};
/** Tufting buttons on a horizontal top surface (y = height of the surface). */
const topButtons = (parent, mat, cols, rows, w, d, y, at = [0, 0]) => {
  const geo = new THREE.SphereGeometry(0.011, 10, 6);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) mesh(geo, mat, { parent, at: [at[0] - w / 2 + ((c + 0.5) / cols) * w, y, at[1] - d / 2 + ((r + 0.5) / rows) * d] });
};
const emblem = (parent, size, at, rot) => {
  const e = brandEmblem(size, { name: 'emblem' });
  e.position.set(...at);
  if (rot) e.rotation.set(...rot);
  parent.add(e);
};

/* ================================ OTTOMAN ================================ */
export const OTTOMAN_VARIANTS = {
  pouf: { color: '#c9a77c' }, cube: { color: '#6f7d8c' }, 'tufted-bench': { color: '#7a2e35' }, storage: { color: '#4f5b4a' },
};
export function createOttoman(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(OTTOMAN_VARIANTS, o.variant, 'ottoman');
  const v = OTTOMAN_VARIANTS[variant];
  const root = group(`ottoman-${variant}`);
  const U = fabricMat(o.color ?? v.color);
  const W = woodMat(o.wood ?? 'walnut');
  const anims = [];
  if (variant === 'pouf') {
    mesh(cushion(0.5, 0.4, 0.5, { radius: 0.2, bulge: 0.15 }), U, { parent: root, at: [0, 0.2, 0] });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; curveTube([[0, 0.4, 0], [Math.cos(a) * 0.2, 0.36, Math.sin(a) * 0.2], [Math.cos(a) * 0.25, 0.2, Math.sin(a) * 0.25]], 0.004, U, { parent: root, segments: 12, radialSegments: 5 }); }
  } else if (variant === 'cube' || variant === 'storage') {
    const s = variant === 'storage' ? [0.8, 0.42, 0.45] : [0.45, 0.42, 0.45];
    const legH = 0.08;
    legs4(root, W, 0.035, legH, [s[0], s[2]]);
    const lidH = 0.1;
    mesh(cushion(s[0], s[1] - legH - lidH, s[2], { radius: 0.03, bulge: 0.05 }), U, { parent: root, at: [0, legH + (s[1] - legH - lidH) / 2, 0] });
    const lid = group('lid', { parent: root, at: [0, s[1] - lidH, -s[2] / 2] });
    mesh(cushion(s[0] + 0.01, lidH, s[2] + 0.01, { radius: 0.035, bulge: 0.25 }), U, { parent: lid, at: [0, lidH / 2, s[2] / 2] });
    topButtons(lid, U, Math.round(s[0] / 0.15), 2, s[0] * 0.7, s[2] * 0.5, lidH + 0.004, [0, s[2] / 2]);
    if (variant === 'storage') { anims.push(clip('open', 1, [rotateTrack(lid, 'x', 1, (t) => -Math.min(1, t * 1.2) * 1.3)])); }
  } else {
    const L = 1.2;
    legs4(root, W, 0.04, 0.2, [L, 0.42], 0.06);
    mesh(roundedBox(L, 0.06, 0.42, 0.012), W, { parent: root, at: [0, 0.2, 0] });
    const top = pipedCushion(L - 0.02, 0.2, 0.4, U, { bulge: 0.25 });
    top.position.set(0, 0.33, 0);
    root.add(top);
    topButtons(root, U, 8, 2, L - 0.25, 0.22, 0.435);
  }
  const out = finalize(root, { type: 'ottoman', variant, options: o, animations: anims });
  if (anims.length) out.userData.premade.oneShot = ['open'];
  return out;
}

/* ================================ BENCH ================================ */
export const BENCH_VARIANTS = { entry: { color: '#b8a58c' }, dining: {}, storage: { color: '#8c9a84' }, garden: {}, piano: { color: '#2b2b2b' } };
export function createBench(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BENCH_VARIANTS, o.variant, 'bench');
  const v = BENCH_VARIANTS[variant];
  const root = group(`bench-${variant}`);
  const W = woodMat(o.wood ?? (variant === 'garden' ? 'oak' : 'walnut'));
  const anims = [];
  if (variant === 'garden') {
    const L = 1.5;
    const iron = metalMat('black');
    for (const sx of [1, -1]) {
      const x = sx * (L / 2 - 0.06);
      curveTube([[x, 0, 0.25], [x, 0.43, 0.2], [x, 0.43, -0.2], [x, 0, -0.22]], 0.02, iron, { parent: root, segments: 24 });
      curveTube([[x, 0.43, -0.2], [x, 0.62, -0.26], [x, 0.85, -0.3]], 0.02, iron, { parent: root, segments: 16 });
      curveTube([[x, 0.43, 0.2], [x, 0.62, 0.18], [x, 0.64, 0.0], [x, 0.62, -0.24]], 0.018, iron, { parent: root, segments: 20 });
    }
    for (let i = 0; i < 5; i++) mesh(roundedBox(L, 0.03, 0.07, 0.01), W, { parent: root, at: [0, 0.455, -0.17 + i * 0.085] });
    for (let i = 0; i < 3; i++) mesh(roundedBox(L - 0.02, 0.07, 0.025, 0.01), W, { parent: root, at: [0, 0.6 + i * 0.1, -0.235 - i * 0.022], rot: [-0.25, 0, 0] });
  } else {
    const L = variant === 'piano' ? 0.76 : variant === 'dining' ? 1.4 : 1.1;
    const D = variant === 'piano' ? 0.36 : 0.38;
    const H = 0.46;
    legs4(root, W, 0.045, H - 0.04, [L, D], 0.05);
    mesh(roundedBox(L, 0.04, D, 0.012), W, { parent: root, at: [0, H - 0.02, 0] });
    for (const sz of [1, -1]) mesh(roundedBox(L - 0.1, 0.06, 0.02, 0.006), W, { parent: root, at: [0, H - 0.07, sz * (D / 2 - 0.05)] });
    if (variant === 'entry' || variant === 'piano') {
      const c = pipedCushion(L - 0.03, 0.06, D - 0.02, fabricMat(o.color ?? v.color), { bulge: 0.3 });
      c.position.set(0, H + 0.03, 0);
      root.add(c);
      if (variant === 'entry') mesh(roundedBox(L - 0.08, 0.025, D - 0.06, 0.008), W, { parent: root, at: [0, 0.14, 0] });
    }
    if (variant === 'storage') {
      for (let i = 0; i < 2; i++) {
        const dr = group(`drawer_${i}`, { parent: root, at: [(i - 0.5) * (L / 2 - 0.02), 0.25, D / 2 - 0.03] });
        dr.add(panelFront(L / 2 - 0.08, 0.2, 0.02, W));
        const p = barPull(0.12, metalMat('brass'));
        p.position.z = 0.012;
        dr.add(p);
        mesh(roundedBox(L / 2 - 0.1, 0.18, D - 0.08, 0.004, 1), new THREE.MeshStandardMaterial({ color: '#d8c7a8', roughness: 0.8 }), { parent: dr, at: [0, 0, -D / 2 + 0.03] });
      }
      mesh(roundedBox(L - 0.06, 0.02, D - 0.06, 0.006), W, { parent: root, at: [0, 0.13, 0] });
      for (const sx of [1, -1]) mesh(roundedBox(0.02, 0.27, D - 0.06, 0.006), W, { parent: root, at: [sx * (L / 2 - 0.04), 0.27, 0] });
      const c = pipedCushion(L - 0.03, 0.06, D - 0.02, fabricMat(o.color ?? v.color), { bulge: 0.3 });
      c.position.set(0, H + 0.03, 0);
      root.add(c);
    }
  }
  return finalize(root, { type: 'indoor-bench', variant, options: o, animations: anims });
}

/* ================================ STOOL ================================ */
export const STOOL_VARIANTS = { counter: { h: 0.65 }, bar: { h: 0.76 }, step: { h: 0.45 }, tripod: { h: 0.45 }, saddle: { h: 0.62, color: '#5b3a24' } };
export function createStool(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(STOOL_VARIANTS, o.variant, 'stool');
  const v = STOOL_VARIANTS[variant];
  const root = group(`stool-${variant}`);
  const W = woodMat(o.wood ?? 'oak');
  const H = v.h;
  if (variant === 'tripod') {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = mesh(turnedLeg(H - 0.03, 0.018, 'taper'), W, { parent: root, at: [Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12] });
      leg.rotation.set(Math.sin(a) * 0.13, 0, -Math.cos(a) * 0.13);
      leg.position.set(Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16);
    }
    mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.035, 40), W, { parent: root, at: [0, H - 0.0175, 0] });
  } else if (variant === 'step') {
    for (const sx of [1, -1]) mesh(roundedBox(0.03, H, 0.3, 0.008), W, { parent: root, at: [sx * 0.2, H / 2, 0] });
    mesh(roundedBox(0.44, 0.03, 0.32, 0.01), W, { parent: root, at: [0, H - 0.015, 0] });
    mesh(roundedBox(0.4, 0.025, 0.16, 0.008), W, { parent: root, at: [0, 0.22, 0.1] });
    const hole = new THREE.TorusGeometry(0.035, 0.008, 8, 24).scale(1.6, 1, 1);
    mesh(hole, plasticMat('#2a2a2a'), { parent: root, at: [0, H - 0.0, 0], rot: [Math.PI / 2, 0, 0] });
  } else {
    const r = 0.18;
    for (const sx of [1, -1]) for (const sz of [1, -1]) {
      const leg = mesh(taperBox(0.035, H - 0.03, 0.035, 0.75), W, { parent: root, at: [sx * 0.16, (H - 0.03) / 2, sz * 0.16] });
      leg.rotation.set(sz * 0.07, 0, -sx * 0.07);
    }
    for (const y of [0.22, H * 0.55]) {
      for (const [a, b] of [[[0.16, 0.16], [-0.16, 0.16]], [[-0.16, -0.16], [0.16, -0.16]]]) curveTube([[a[0] * (1 + (0.4 - y) * 0.3), y, a[1] * (1 + (0.4 - y) * 0.3)], [b[0] * (1 + (0.4 - y) * 0.3), y, b[1] * (1 + (0.4 - y) * 0.3)]], 0.011, W, { parent: root, segments: 2 });
    }
    if (variant === 'saddle') {
      const g = new THREE.SphereGeometry(0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.28, 0.9);
      mesh(g, leatherMat(o.color ?? v.color), { parent: root, at: [0, H - 0.03, 0] });
    } else {
      mesh(new THREE.CylinderGeometry(r, r, 0.04, 40), W, { parent: root, at: [0, H - 0.02, 0] });
      if (variant === 'bar') {
        const c = pipedCushion(0.32, 0.05, 0.32, fabricMat(o.color ?? '#3b3b3b'), { bulge: 0.3, radius: 0.12 });
        c.position.set(0, H + 0.025, 0);
        root.add(c);
      }
    }
  }
  return finalize(root, { type: 'stool', variant, options: o, animations: [] });
}

/* ================================ PIANO ================================ */
export const PIANO_VARIANTS = { upright: { wood: 'black' }, grand: { wood: 'black' }, digital: { wood: 'walnut' } };
function keys(parent, w, z, y) {
  const white = new THREE.MeshPhysicalMaterial({ color: '#f8f6f0', roughness: 0.2, clearcoat: 0.6 });
  const black = new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.25, clearcoat: 0.6 });
  const n = Math.round(w / 0.0235);
  const kw = w / n;
  const wg = roundedBox(kw - 0.0012, 0.02, 0.15, 0.002, 1);
  const im = new THREE.InstancedMesh(wg, white, n);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m4.makeTranslation(-w / 2 + (i + 0.5) * kw, y, z); im.setMatrixAt(i, m4); }
  parent.add(im);
  const pattern = [1, 1, 0, 1, 1, 1, 0];
  const blacks = [];
  for (let i = 0; i < n - 1; i++) if (pattern[i % 7]) blacks.push(i);
  const bi = new THREE.InstancedMesh(roundedBox(kw * 0.55, 0.014, 0.09, 0.002, 1), black, blacks.length);
  blacks.forEach((i, k) => { m4.makeTranslation(-w / 2 + (i + 1) * kw, y + 0.016, z - 0.03); bi.setMatrixAt(k, m4); });
  parent.add(bi);
}
export function createPiano(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(PIANO_VARIANTS, o.variant, 'piano');
  const v = PIANO_VARIANTS[variant];
  const root = group(`piano-${variant}`);
  const W = woodMat(o.wood ?? v.wood, { gloss: 1 });
  W.clearcoat = 1;
  W.clearcoatRoughness = 0.04;
  const anims = [];
  if (variant === 'upright') {
    mesh(roundedBox(1.5, 1.2, 0.36, 0.012), W, { parent: root, at: [0, 0.6 + 0.04, -0.12] });
    mesh(roundedBox(1.52, 0.04, 0.38, 0.01), W, { parent: root, at: [0, 1.26, -0.12] });
    mesh(roundedBox(1.5, 0.08, 0.62, 0.01), W, { parent: root, at: [0, 0.68, 0.02] });
    keys(root, 1.36, 0.25, 0.73);
    for (const sx of [1, -1]) {
      mesh(roundedBox(0.06, 0.66, 0.6, 0.012), W, { parent: root, at: [sx * 0.72, 0.37, 0.0] });
      mesh(turnedLeg(0.66, 0.04, 'turned'), W, { parent: root, at: [sx * 0.7, 0, 0.28] });
    }
    const lid = group('lid', { parent: root, at: [0, 0.76, 0.07] });
    mesh(roundedBox(1.4, 0.2, 0.02, 0.006), W, { parent: lid, at: [0, 0.1, 0.0] });
    mesh(roundedBox(0.6, 0.18, 0.012, 0.004), W, { parent: root, at: [0, 0.98, 0.07], rot: [-0.2, 0, 0] });
    for (let i = 0; i < 3; i++) mesh(roundedBox(0.04, 0.012, 0.06, 0.004), metalMat('brass'), { parent: root, at: [-0.08 + i * 0.08, 0.06, 0.07] });
    mesh(roundedBox(1.4, 0.12, 0.02, 0.004), W, { parent: root, at: [0, 0.06, 0.05] });
    emblem(root, 0.04, [0, 0.88, 0.061]);
    anims.push(clip('lidOpen', 1, [rotateTrack(lid, 'x', 1, (t) => -Math.min(1, t * 1.2) * 1.7)]));
  } else if (variant === 'grand') {
    // curved rim (bentside) via an extruded outline
    const s = new THREE.Shape();
    s.moveTo(-0.75, 0.0); s.lineTo(0.75, 0.0); s.lineTo(0.75, -0.6);
    s.bezierCurveTo(0.7, -1.2, 0.2, -1.3, 0.15, -1.75); s.lineTo(-0.75, -1.85); s.lineTo(-0.75, 0);
    const body = new THREE.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 32 });
    body.rotateX(Math.PI / 2);
    mesh(body, W, { parent: root, at: [0, 1.0, 0.1] });
    const lidG = new THREE.ShapeGeometry(s, 32).rotateX(Math.PI / 2);
    const lid = group('lid', { parent: root, at: [-0.75, 1.0, 0.1] });
    const lm = mesh(lidG, W, { parent: lid, at: [0.75, 0.012, 0] });
    lm.material = W.clone();
    lm.material.side = THREE.DoubleSide;
    lid.rotation.z = 0.0;
    curveTube([[0.75, 1.0, -0.6], [0.72, 1.45, -0.58]], 0.008, metalMat('brass'), { parent: root, segments: 2 });
    lid.rotation.z = Math.atan2(0.45, 1.5);
    mesh(roundedBox(1.5, 0.1, 0.35, 0.01), W, { parent: root, at: [0, 0.65, 0.24] });
    keys(root, 1.3, 0.3, 0.71);
    for (const [x, z] of [[-0.62, 0.22], [0.62, 0.22], [-0.5, -1.55]]) mesh(turnedLeg(0.66, 0.06, 'baluster'), W, { parent: root, at: [x, 0, z] });
    for (const [x, z] of [[-0.62, 0.22], [0.62, 0.22], [-0.5, -1.55]]) mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), metalMat('brass'), { parent: root, at: [x, 0.015, z] });
    mesh(roundedBox(0.3, 0.3, 0.06, 0.01), W, { parent: root, at: [0, 0.3, -0.4] });
    curveTube([[0, 0.66, -0.4], [0, 0.45, -0.4]], 0.02, W, { parent: root, segments: 2 });
    emblem(root, 0.04, [0, 0.82, 0.102]);
  } else {
    mesh(roundedBox(1.36, 0.14, 0.4, 0.015), W, { parent: root, at: [0, 0.78, 0] });
    keys(root, 1.24, 0.08, 0.84);
    for (const sx of [1, -1]) mesh(roundedBox(0.04, 0.72, 0.38, 0.008), W, { parent: root, at: [sx * 0.64, 0.36, 0] });
    mesh(roundedBox(1.28, 0.5, 0.02, 0.006), W, { parent: root, at: [0, 0.4, -0.17] });
    mesh(roundedBox(1.26, 0.04, 0.12, 0.006), W, { parent: root, at: [0, 0.05, 0.05] });
    const disp = lampGroup('display', 'blue');
    disp.add(root, { at: [0, 0.825, -0.12], normal: [0, 1, 0.3], w: 0.08, h: 0.025, depth: 0.002, bezel: true });
    mesh(roundedBox(0.5, 0.25, 0.01, 0.004), W, { parent: root, at: [0, 0.98, -0.15], rot: [-0.2, 0, 0] });
    emblem(root, 0.03, [0.4, 0.851, -0.12], [-Math.PI / 2, 0, 0]);
    anims.push(clip('on', 1, lampTracks('display', 3)));
  }
  const out = finalize(root, { type: 'piano', variant, options: o, animations: anims });
  if (variant === 'upright') out.userData.premade.oneShot = ['lidOpen'];
  return out;
}

/* ================================ FIREPLACE ================================ */
export const FIREPLACE_VARIANTS = { brick: {}, 'modern-linear': {}, 'wood-stove': {}, 'mantel-classic': {} };
function flames(parent, w, at) {
  const mat = new THREE.MeshBasicMaterial({ color: '#ff8a2a', transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, name: 'flame' });
  const g = group('fire', { parent, at });
  const n = Math.max(3, Math.round(w / 0.12));
  for (let i = 0; i < n; i++) {
    const f = new THREE.ConeGeometry(0.05, 0.22, 10, 1, true).translate(0, 0.11, 0);
    const m = mesh(f, mat, { parent: g, at: [-w / 2 + (i + 0.5) * (w / n), 0, (i % 2) * 0.03], scale: [1, 0.7 + ((i * 37) % 10) / 15, 1] });
    m.name = i ? `flame_${i}` : 'flame';
    m.userData.noShadow = true;
  }
  // logs
  for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(0.035, 0.04, w * 0.7, 10).rotateZ(Math.PI / 2), woodMat('#4a3020'), { parent: g, at: [0, 0.03, -0.03 + i * 0.03], rot: [0, (i - 1) * 0.3, 0] });
  const glow = lampGroup('embers', 'amber');
  glow.add(g, { at: [0, 0.02, 0.06], normal: [0, 0.5, 1], w: w * 0.6, h: 0.05, depth: 0.002, bezel: false, glowSize: w });
  return [numberTrack('flame.material.opacity', 0.6, (t) => 0.75 + 0.2 * Math.sin(t * Math.PI * 6), 18), ...lampTracks('embers', 2.5)];
}
export function createFireplace(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(FIREPLACE_VARIANTS, o.variant, 'fireplace');
  const root = group(`fireplace-${variant}`);
  const anims = [];
  const soot = new THREE.MeshStandardMaterial({ color: '#1a1716', roughness: 1 });
  let tracks = [];
  if (variant === 'brick' || variant === 'mantel-classic') {
    const classic = variant === 'mantel-classic';
    const B = classic ? new THREE.MeshPhysicalMaterial({ name: 'stone', color: '#ece8e0', roughness: 0.4, clearcoat: 0.3 }) : brickMat(o.color ?? '#9c4a32');
    const W = 1.5;
    const H = 1.15;
    for (const sx of [1, -1]) mesh(roundedBox(0.35, H - 0.06, 0.4, 0.01), B, { parent: root, at: [sx * (W / 2 - 0.175), (H - 0.06) / 2 + 0.06, 0] });
    mesh(roundedBox(W - 0.68, 0.28, 0.4, 0.01), B, { parent: root, at: [0, H - 0.14, 0] });
    mesh(roundedBox(W + 0.3, 0.06, 0.5, 0.01), classic ? B : woodMat('walnut'), { parent: root, at: [0, 0.03, 0.05] });
    mesh(roundedBox(W + 0.2, 0.07, 0.48, 0.012), classic ? B : woodMat('walnut'), { parent: root, at: [0, H + 0.035, 0.04] });
    if (classic) for (const sx of [1, -1]) mesh(turnedLeg(H - 0.08, 0.06, 'baluster'), B, { parent: root, at: [sx * (W / 2 - 0.05), 0.06, 0.2] });
    mesh(roundedBox(W - 0.7, H - 0.36, 0.05, 0.01), soot, { parent: root, at: [0, (H - 0.36) / 2 + 0.06, -0.17] });
    mesh(roundedBox(W - 0.7, 0.02, 0.36, 0.004), soot, { parent: root, at: [0, 0.07, 0] });
    tracks = flames(root, W - 0.85, [0, 0.08, -0.02]);
    // grate
    for (let i = 0; i < 5; i++) curveTube([[-0.25 + i * 0.125, 0.08, 0.1], [-0.25 + i * 0.125, 0.16, 0.12]], 0.007, metalMat('black'), { parent: root, segments: 2 });
    curveTube([[-0.28, 0.16, 0.12], [0.28, 0.16, 0.12]], 0.008, metalMat('black'), { parent: root, segments: 2 });
  } else if (variant === 'modern-linear') {
    const W = 1.8;
    mesh(roundedBox(W, 0.5, 0.35, 0.006), new THREE.MeshPhysicalMaterial({ name: 'stone', color: '#3a3a3c', roughness: 0.6 }), { parent: root, at: [0, 0.25, 0] });
    mesh(roundedBox(W + 0.1, 0.04, 0.4, 0.004), new THREE.MeshPhysicalMaterial({ name: 'stone', color: '#d8d4cc', roughness: 0.3 }), { parent: root, at: [0, 0.52, 0.0] });
    mesh(roundedBox(W - 0.4, 0.26, 0.02, 0.004), soot, { parent: root, at: [0, 0.25, 0.1] });
    // glass river-stone bed
    const r = rng(3);
    for (let i = 0; i < 30; i++) mesh(new THREE.SphereGeometry(0.02 + r() * 0.015, 8, 6).scale(1, 0.6, 1), glassMat(['#9fd3c7', '#cfd8dc', '#ffffff'][i % 3], 0.8), { parent: root, at: [-0.6 + r() * 1.2, 0.13, 0.13 + r() * 0.03] });
    tracks = flames(root, W - 0.5, [0, 0.13, 0.14]);
    mesh(new THREE.PlaneGeometry(W - 0.4, 0.26), glassMat('#cfd8dc', 0.15), { parent: root, at: [0, 0.25, 0.176] });
  } else {
    const S = metalMat('black');
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.18, 10), S, { parent: root, at: [Math.cos(a) * 0.22, 0.09, Math.sin(a) * 0.18] }); }
    mesh(roundedBox(0.55, 0.55, 0.42, 0.04, 3), S, { parent: root, at: [0, 0.18 + 0.275, 0] });
    mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.4, 24), S, { parent: root, at: [0, 0.73 + 0.7, -0.05] });
    mesh(roundedBox(0.38, 0.3, 0.02, 0.02), soot, { parent: root, at: [0, 0.44, 0.205] });
    tracks = flames(root, 0.3, [0, 0.31, 0.12]);
    mesh(new THREE.PlaneGeometry(0.34, 0.26), glassMat('#2a2018', 0.25), { parent: root, at: [0, 0.44, 0.216] });
    curveTube([[0.18, 0.5, 0.215], [0.24, 0.5, 0.24], [0.24, 0.38, 0.24]], 0.008, metalMat('chrome'), { parent: root });
    emblem(root, 0.035, [0, 0.66, 0.211]);
  }
  anims.push(clip('fire', 0.6, tracks));
  return finalize(root, { type: 'fireplace', variant, options: o, animations: anims });
}

function brickMat(hex) {
  if (typeof document === 'undefined') return new THREE.MeshStandardMaterial({ name: 'brick', color: hex, roughness: 0.9 });
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#d6cfc4'; g.fillRect(0, 0, 128, 128);
  const base = new THREE.Color(hex);
  for (let row = 0; row < 8; row++) for (let col = -1; col < 4; col++) {
    const k = 0.85 + ((row * 7 + col * 13) % 10) / 33;
    g.fillStyle = `#${base.clone().multiplyScalar(k).getHexString()}`;
    g.fillRect(col * 40 + (row % 2) * 20 + 2, row * 16 + 2, 36, 12);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ name: 'brick', map: t, roughness: 0.9 });
}

/* ============================ RACKS & STORAGE ============================ */
export const RACK_VARIANTS = { 'coat-stand': {}, 'hall-tree': { color: '#7d8a74' }, 'shoe-rack': {}, 'shoe-cabinet': {}, 'toy-chest': { color: '#3d8bd9' }, 'room-divider': { color: '#e6dfcf' }, 'slat-divider': {} };
export function createRack(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(RACK_VARIANTS, o.variant, 'rack');
  const v = RACK_VARIANTS[variant];
  const root = group(`rack-${variant}`);
  const W = woodMat(o.wood ?? 'oak');
  const MT = metalMat(o.metal ?? 'black');
  const anims = [];
  const oneShot = [];
  if (variant === 'coat-stand') {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; curveTube([[0, 0.3, 0], [Math.cos(a) * 0.15, 0.12, Math.sin(a) * 0.15], [Math.cos(a) * 0.25, 0.0, Math.sin(a) * 0.25]], 0.016, W, { parent: root, segments: 12 }); }
    mesh(turnedLeg(1.75, 0.025, 'taper'), W, { parent: root, at: [0, 0.05, 0] });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; curveTube([[0, 1.62 - (i % 2) * 0.1, 0], [Math.cos(a) * 0.12, 1.66 - (i % 2) * 0.1, Math.sin(a) * 0.12], [Math.cos(a) * 0.16, 1.72 - (i % 2) * 0.1, Math.sin(a) * 0.16]], 0.009, W, { parent: root, segments: 10 }); }
    mesh(new THREE.SphereGeometry(0.03, 12, 10), W, { parent: root, at: [0, 1.81, 0] });
    // coat + scarf on hooks
    mesh(cushion(0.28, 0.75, 0.12, { radius: 0.05, bulge: 0.2 }), fabricMat(o.color ?? '#6b4f3a'), { parent: root, at: [0.16, 1.32, 0.04], rot: [0, 0.2, 0.08] });
    mesh(new THREE.TorusGeometry(0.06, 0.025, 8, 20), fabricMat('#b3261e'), { parent: root, at: [-0.11, 1.66, 0.06], rot: [0.3, 0, 0] });
  } else if (variant === 'hall-tree') {
    for (const sx of [1, -1]) mesh(roundedBox(0.05, 1.85, 0.38, 0.01), W, { parent: root, at: [sx * 0.45, 0.925, 0] });
    mesh(roundedBox(0.95, 0.04, 0.4, 0.01), W, { parent: root, at: [0, 0.46, 0.0] });
    mesh(roundedBox(0.95, 0.6, 0.02, 0.006), W, { parent: root, at: [0, 1.25, -0.18] });
    mesh(roundedBox(0.95, 0.04, 0.3, 0.008), W, { parent: root, at: [0, 1.83, -0.04] });
    for (let i = 0; i < 4; i++) curveTube([[-0.33 + i * 0.22, 1.45, -0.17], [-0.33 + i * 0.22, 1.47, -0.1], [-0.33 + i * 0.22, 1.52, -0.08]], 0.008, MT, { parent: root, segments: 10 });
    mesh(roundedBox(0.88, 0.02, 0.34, 0.006), W, { parent: root, at: [0, 0.12, 0] });
    const c = pipedCushion(0.85, 0.06, 0.36, fabricMat(o.color ?? v.color), { bulge: 0.3 });
    c.position.set(0, 0.51, 0.01);
    root.add(c);
  } else if (variant === 'shoe-rack') {
    for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(roundedBox(0.03, 0.6, 0.03, 0.006), W, { parent: root, at: [sx * 0.4, 0.3, sz * 0.13] });
    for (const y of [0.05, 0.3, 0.58]) for (const sx of [1, -1]) mesh(roundedBox(0.03, 0.03, 0.29, 0.006), W, { parent: root, at: [sx * 0.4, y, 0] });
    for (const y of [0.05, 0.3, 0.58]) for (let k = 0; k < 4; k++) mesh(roundedBox(0.83, 0.018, 0.05, 0.006), W, { parent: root, at: [0, y + (y < 0.5 ? (k - 1.5) * 0.004 : 0), -0.105 + k * 0.07], rot: [y < 0.5 ? 0.12 : 0, 0, 0] });
    const r = rng(4);
    for (let i = 0; i < 4; i++) for (const y of [0.07, 0.32]) {
      const shoe = new THREE.CapsuleGeometry(0.04, 0.17, 4, 10).rotateX(Math.PI / 2).scale(1, 0.7, 1);
      mesh(shoe, leatherMat(['#3b2a20', '#1d1d1f', '#b3261e', '#e8e2d6'][Math.floor(r() * 4)]), { parent: root, at: [-0.3 + i * 0.2, y + 0.035, 0.0] });
    }
  } else if (variant === 'shoe-cabinet' || variant === 'toy-chest') {
    const toy = variant === 'toy-chest';
    const w = toy ? 0.8 : 1.0;
    const h = toy ? 0.48 : 1.0;
    const d = toy ? 0.45 : 0.3;
    legs4(root, W, 0.04, 0.08, [w, d], 0.05);
    mesh(roundedBox(w, h - 0.08, d, 0.01, 2), toy ? enamel(o.color ?? v.color) : W, { parent: root, at: [0, 0.08 + (h - 0.08) / 2, 0] });
    if (toy) {
      const lid = group('lid', { parent: root, at: [0, h, -d / 2] });
      mesh(roundedBox(w + 0.02, 0.035, d + 0.02, 0.015), W, { parent: lid, at: [0, 0.0175, d / 2] });
      for (const sx of [1, -1]) curveTube([[sx * (w / 2 + 0.001), h * 0.55, -0.06], [sx * (w / 2 + 0.03), h * 0.6, 0], [sx * (w / 2 + 0.001), h * 0.55, 0.06]], 0.012, plasticMat('#222'), { parent: root });
      // stencilled stars
      for (let i = 0; i < 5; i++) mesh(new THREE.CircleGeometry(0.035, 5), enamel(['#ffd23f', '#ff5fa2', '#7be36b', '#ffffff', '#ff8a4c'][i]), { parent: root, at: [-0.3 + i * 0.15, 0.3 + (i % 2) * 0.06, d / 2 + 0.002] });
      anims.push(clip('open', 1, [rotateTrack(lid, 'x', 1, (t) => -Math.min(1, t * 1.2) * 1.4)]));
      oneShot.push('open');
    } else {
      const tracks = [];
      for (let i = 0; i < 2; i++) {
        const door = group(`flap_${i}`, { parent: root, at: [0, 0.1 + i * 0.45, d / 2] });
        const p = panelFront(w - 0.02, 0.42, 0.02, W);
        p.position.y = 0.21;
        door.add(p);
        const k = barPull(0.2, MT);
        k.position.set(0, 0.36, 0.012);
        door.add(k);
        tracks.push(rotateTrack(door, 'x', 1, (t) => Math.min(1, t * 1.2) * 0.6));
      }
      mesh(roundedBox(w + 0.02, 0.03, d + 0.02, 0.008), W, { parent: root, at: [0, h + 0.015, 0] });
      anims.push(clip('open', 1, tracks));
      oneShot.push('open');
    }
  } else if (variant === 'room-divider') {
    const U = fabricMat(o.color ?? v.color);
    for (let i = 0; i < 3; i++) {
      const p = group(null, { parent: root, at: [(i - 1) * 0.47, 0, 0], rot: [0, (i - 1) * 0.35, 0] });
      for (const sx of [1, -1]) mesh(roundedBox(0.035, 1.75, 0.035, 0.008), W, { parent: p, at: [sx * 0.22, 0.875, 0] });
      for (const y of [0.06, 1.7]) mesh(roundedBox(0.44, 0.035, 0.03, 0.008), W, { parent: p, at: [0, y, 0] });
      mesh(new THREE.BoxGeometry(0.42, 1.6, 0.006), U, { parent: p, at: [0, 0.88, 0] });
    }
  } else {
    // slatted divider: vertical timber slats in a floor + ceiling-height frame
    mesh(roundedBox(1.2, 0.05, 0.3, 0.01), W, { parent: root, at: [0, 0.025, 0] });
    for (let i = 0; i < 13; i++) mesh(roundedBox(0.04, 2.0, 0.06, 0.008), W, { parent: root, at: [-0.54 + i * 0.09, 1.05, 0] });
    mesh(roundedBox(1.2, 0.04, 0.08, 0.008), W, { parent: root, at: [0, 2.07, 0] });
  }
  const out = finalize(root, { type: 'rack', variant, options: o, animations: anims });
  if (oneShot.length) out.userData.premade.oneShot = oneShot;
  return out;
}

/* ================================ CURTAINS ================================ */
export const CURTAIN_VARIANTS = { pair: { color: '#c9b79c' }, sheer: { color: '#f4f1ea' }, blackout: { color: '#2f3a4a' }, 'roman-blind': { color: '#d9d4c7' }, 'venetian-blind': { color: '#f1f1ef' } };
export function createCurtains(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(CURTAIN_VARIANTS, o.variant, 'curtains');
  const v = CURTAIN_VARIANTS[variant];
  const root = group(`curtains-${variant}`);
  root.userData.floating = false;
  const MT = metalMat(o.metal ?? 'brass');
  const anims = [];
  const H = 2.3;
  const Wd = 1.6;
  if (variant === 'roman-blind' || variant === 'venetian-blind') {
    // window frame so the blind has something to hang in; stands on the floor
    const F = enamel('#f4f4f2');
    for (const sx of [1, -1]) mesh(roundedBox(0.06, H, 0.08, 0.008), F, { parent: root, at: [sx * (Wd / 2 + 0.03), H / 2, 0] });
    mesh(roundedBox(Wd + 0.12, 0.08, 0.1, 0.008), F, { parent: root, at: [0, H + 0.04, 0] });
    mesh(roundedBox(Wd + 0.12, 0.05, 0.14, 0.008), F, { parent: root, at: [0, 0.9, 0.02] });
    mesh(new THREE.PlaneGeometry(Wd, H - 0.95), glassMat('#cfe3ea', 0.25), { parent: root, at: [0, 0.925 + (H - 0.95) / 2, -0.02] });
    const blind = group('blind', { parent: root, at: [0, H, 0.05] });
    if (variant === 'roman-blind') {
      const U = fabricMat(o.color ?? v.color);
      for (let i = 0; i < 5; i++) mesh(cushion(Wd - 0.02, 0.14, 0.04, { radius: 0.018, bulge: 0.3 }), U, { parent: blind, at: [0, -0.08 - i * 0.13, 0] });
    } else {
      const S = enamel(o.color ?? v.color);
      const n = 40;
      const im = new THREE.InstancedMesh(roundedBox(Wd - 0.02, 0.003, 0.045, 0.0012, 1), S, n);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { m4.makeRotationX(0.5).setPosition(0, -0.05 - i * 0.032, 0); im.setMatrixAt(i, m4); }
      blind.add(im);
      for (const sx of [-0.5, 0, 0.5]) curveTube([[sx * Wd * 0.8, 0, 0], [sx * Wd * 0.8, -0.05 - n * 0.032, 0]], 0.0015, plasticMat('#ddd'), { parent: blind, segments: 2 });
    }
    mesh(roundedBox(Wd, 0.05, 0.06, 0.01), enamel('#f4f4f2'), { parent: blind, at: [0, -0.02, 0] });
    anims.push(clip('raise', 3, [moveTrack(blind, 3, () => [0, 0, 0.05])]));
  } else {
    const sheer = variant === 'sheer';
    const U = sheer
      ? new THREE.MeshPhysicalMaterial({ name: 'fabric', color: o.color ?? v.color, roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide, sheen: 1 })
      : fabricMat(o.color ?? v.color);
    if (!sheer) U.side = THREE.DoubleSide;
    // floor-standing rod brackets (as if wall-mounted, with poles to the floor so the model stands)
    curveTube([[-Wd / 2 - 0.25, H, 0.1], [Wd / 2 + 0.25, H, 0.1]], 0.014, MT, { parent: root, segments: 2 });
    for (const sx of [1, -1]) {
      mesh(new THREE.SphereGeometry(0.03, 14, 10), MT, { parent: root, at: [sx * (Wd / 2 + 0.27), H, 0.1] });
      mesh(new THREE.CylinderGeometry(0.008, 0.008, H, 8), MT, { parent: root, at: [sx * (Wd / 2 + 0.2), H / 2, 0.1] });
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 20), MT, { parent: root, at: [sx * (Wd / 2 + 0.2), 0.006, 0.1] });
      // a gathered panel: sine-pleated sheet
      const pw = sheer ? Wd / 2 + 0.1 : Wd / 2 - 0.1;
      const g = new THREE.PlaneGeometry(pw, H - 0.06, 48, 1);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const y = p.getY(i);
        const gather = sheer ? 1 : 1 + (0.5 - y / (H - 0.06)) * 0.25;
        p.setXYZ(i, x * gather, y, Math.sin((x / pw) * Math.PI * 9) * 0.035 * (0.7 + 0.3 * gather));
      }
      g.computeVertexNormals();
      mesh(g, U, { parent: root, at: [sx * (Wd / 4 + (sheer ? 0.05 : 0.15)), (H - 0.06) / 2 + 0.02, 0.1] });
      for (let i = 0; i < 9; i++) mesh(new THREE.TorusGeometry(0.02, 0.003, 6, 16), MT, { parent: root, at: [sx * (Wd / 4 + 0.15) - pw / 2 + i * (pw / 8), H, 0.1] });
      if (!sheer) curveTube([[sx * (Wd / 4 + 0.15) - pw * 0.4, 1.0, 0.13], [sx * (Wd / 4 + 0.15), 0.98, 0.16], [sx * (Wd / 4 + 0.15) + pw * 0.4, 1.0, 0.13]], 0.01, fabricMat('#c8a24a'), { parent: root, segments: 16 });
    }
  }
  return finalize(root, { type: 'curtains', variant, options: o, animations: anims });
}

/* ================================ OUTDOOR ================================ */
export const OUTDOOR_VARIANTS = { 'patio-set': {}, lounger: { color: '#e8e2d6' }, parasol: { color: '#e8e2d6' }, bbq: {}, hammock: { color: '#d9c7a0' }, adirondack: { color: '#f4f4f2' }, swing: {}, 'fire-pit': {} };
export function createOutdoor(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(OUTDOOR_VARIANTS, o.variant, 'outdoor');
  const v = OUTDOOR_VARIANTS[variant];
  const root = group(`outdoor-${variant}`);
  const W = woodMat(o.wood ?? '#a0703f');
  const MT = metalMat(o.metal ?? 'black');
  const anims = [];
  if (variant === 'patio-set') {
    mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.03, 48), W, { parent: root, at: [0, 0.72, 0] });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; curveTube([[Math.cos(a) * 0.3, 0.71, Math.sin(a) * 0.3], [Math.cos(a) * 0.38, 0.3, Math.sin(a) * 0.38], [Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4]], 0.014, MT, { parent: root, segments: 12 }); }
    for (let k = 0; k < 2; k++) {
      const ch = group(null, { parent: root, at: [k ? 0.85 : -0.85, 0, 0], rot: [0, k ? -Math.PI / 2 : Math.PI / 2, 0] });
      for (const sx of [1, -1]) {
        curveTube([[sx * 0.22, 0, 0.22], [sx * 0.22, 0.44, 0.2], [sx * 0.22, 0.44, -0.18], [sx * 0.22, 0, -0.22]], 0.012, MT, { parent: ch, segments: 20 });
        curveTube([[sx * 0.22, 0.44, -0.18], [sx * 0.23, 0.85, -0.28]], 0.012, MT, { parent: ch, segments: 2 });
      }
      for (let i = 0; i < 5; i++) mesh(roundedBox(0.46, 0.02, 0.07, 0.008), W, { parent: ch, at: [0, 0.45, -0.16 + i * 0.08] });
      for (let i = 0; i < 3; i++) mesh(roundedBox(0.46, 0.07, 0.02, 0.008), W, { parent: ch, at: [0, 0.6 + i * 0.1, -0.22 - i * 0.025], rot: [-0.25, 0, 0] });
    }
  } else if (variant === 'lounger') {
    for (const sx of [1, -1]) curveTube([[sx * 0.3, 0.05, 0.95], [sx * 0.3, 0.3, 0.9], [sx * 0.3, 0.32, -0.6], [sx * 0.3, 0.05, -0.9]], 0.02, MT, { parent: root, segments: 32 });
    for (const sx of [1, -1]) for (const z of [0.9, -0.9]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12), plasticMat('#222'), { parent: root, at: [sx * 0.3, 0.025, z] });
    mesh(cushion(0.6, 0.07, 1.2, { radius: 0.03, bulge: 0.2 }), fabricMat(o.color ?? v.color), { parent: root, at: [0, 0.36, 0.25] });
    const back = group('back', { parent: root, at: [0, 0.34, -0.35], rot: [0.75, 0, 0] });
    mesh(cushion(0.6, 0.07, 0.75, { radius: 0.03, bulge: 0.2 }), fabricMat(o.color ?? v.color), { parent: back, at: [0, 0.02, -0.37] });
    for (const sx of [1, -1]) curveTube([[sx * 0.3, 0, 0], [sx * 0.3, 0, -0.74]], 0.016, MT, { parent: back, segments: 2 });
  } else if (variant === 'parasol') {
    mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.08, 32), new THREE.MeshPhysicalMaterial({ name: 'stone', color: '#7d7a73', roughness: 0.8 }), { parent: root, at: [0, 0.04, 0] });
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 12), W, { parent: root, at: [0, 1.24, 0] });
    const n = 8;
    const R = 1.4;
    const can = new THREE.ConeGeometry(R, 0.45, n, 1, true);
    const cm = mesh(can, fabricMat(o.color ?? v.color), { parent: root, at: [0, 2.2, 0] });
    cm.material.side = THREE.DoubleSide;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; curveTube([[0, 2.42, 0], [Math.sin(a) * R * 0.98, 1.98, Math.cos(a) * R * 0.98]], 0.008, W, { parent: root, segments: 2 }); }
    mesh(new THREE.SphereGeometry(0.04, 12, 10), W, { parent: root, at: [0, 2.46, 0] });
  } else if (variant === 'bbq') {
    const S = stainless();
    for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(roundedBox(0.04, 0.82, 0.04, 0.006), MT, { parent: root, at: [sx * 0.45, 0.41, sz * 0.25] });
    mesh(roundedBox(0.94, 0.03, 0.54, 0.006), MT, { parent: root, at: [0, 0.25, 0] });
    mesh(roundedBox(0.7, 0.25, 0.5, 0.03, 3), S, { parent: root, at: [0, 0.94, 0] });
    for (const sx of [1, -1]) mesh(roundedBox(0.34, 0.03, 0.5, 0.008), S, { parent: root, at: [sx * 0.52, 0.84, 0] });
    const lid = group('lid', { parent: root, at: [0, 1.065, -0.25] });
    const lg = new THREE.CylinderGeometry(0.25, 0.25, 0.7, 32, 1, false, 0, Math.PI).rotateZ(Math.PI / 2);
    mesh(lg, S, { parent: lid, at: [0, 0, 0.25], scale: [1, 0.6, 1] });
    curveTube([[-0.2, 0.13, 0.5], [-0.2, 0.15, 0.55], [0.2, 0.15, 0.55], [0.2, 0.13, 0.5]], 0.012, MT, { parent: lid, segments: 16 });
    for (let i = 0; i < 4; i++) { const k = knob(MT, 0.018); k.position.set(-0.24 + i * 0.16, 0.9, 0.252); root.add(k); }
    for (const sx of [1, -1]) mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 20).rotateZ(Math.PI / 2), plasticMat('#222'), { parent: root, at: [sx * 0.47, 0.08, 0.25] });
    emblem(root, 0.05, [0.28, 0.98, 0.252]);
    anims.push(clip('open', 1, [rotateTrack(lid, 'x', 1, (t) => -Math.min(1, t * 1.2) * 1.2)]));
  } else if (variant === 'hammock') {
    for (const sx of [1, -1]) {
      curveTube([[sx * 1.6, 0, 0.5], [sx * 1.55, 0.6, 0.3], [sx * 1.45, 1.2, 0]], 0.03, W, { parent: root, segments: 16 });
      curveTube([[sx * 1.6, 0, -0.5], [sx * 1.55, 0.6, -0.3], [sx * 1.45, 1.2, 0]], 0.03, W, { parent: root, segments: 16 });
    }
    curveTube([[-1.6, 0.02, 0], [0, 0.02, 0], [1.6, 0.02, 0]], 0.035, W, { parent: root, segments: 2 });
    for (const sx of [1, -1]) {
      curveTube([[sx * 1.6, 0.02, 0.5], [sx * 1.6, 0.02, -0.5]], 0.03, W, { parent: root, segments: 2 });
    }
    const g = new THREE.PlaneGeometry(2.1, 0.9, 40, 12);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); const y = p.getY(i); p.setXYZ(i, x, 0.75 - 0.35 * (1 - (x / 1.05) ** 2) + 0.1 * (y / 0.45) ** 2, y * (1 - 0.6 * (x / 1.05) ** 2)); }
    g.computeVertexNormals();
    const hm = mesh(g, fabricMat(o.color ?? v.color), { parent: root, at: [0, 0.0, 0], name: 'hammock_bed' });
    hm.material.side = THREE.DoubleSide;
    for (const sx of [1, -1]) curveTube([[sx * 1.05, 0.85, 0], [sx * 1.45, 1.2, 0]], 0.008, fabricMat('#d9c7a0'), { parent: root, segments: 2 });
    anims.push(clip('swing', 3, [rotateTrack(hm, 'x', 3, (t) => wave(t) * 0.08)]));
  } else if (variant === 'adirondack') {
    const P = enamel(o.color ?? v.color);
    for (const sx of [1, -1]) {
      mesh(roundedBox(0.04, 0.6, 0.08, 0.01), P, { parent: root, at: [sx * 0.3, 0.3, 0.3] });
      mesh(roundedBox(0.04, 0.1, 0.9, 0.01), P, { parent: root, at: [sx * 0.3, 0.28, -0.05], rot: [-0.2, 0, 0] });
      mesh(roundedBox(0.14, 0.025, 0.7, 0.01), P, { parent: root, at: [sx * 0.36, 0.61, 0.0] });
      mesh(roundedBox(0.04, 0.4, 0.06, 0.01), P, { parent: root, at: [sx * 0.3, 0.2, -0.42] });
    }
    for (let i = 0; i < 6; i++) mesh(roundedBox(0.56, 0.02, 0.07, 0.008), P, { parent: root, at: [0, 0.35 - i * 0.025, 0.3 - i * 0.09] });
    for (let i = 0; i < 6; i++) {
      const x = -0.22 + i * 0.088;
      mesh(roundedBox(0.075, 0.85 - Math.abs(i - 2.5) * -0.04, 0.02, 0.01), P, { parent: root, at: [x, 0.62, -0.45], rot: [-0.45, 0, 0] });
    }
    mesh(roundedBox(0.6, 0.06, 0.03, 0.01), P, { parent: root, at: [0, 0.45, -0.38], rot: [-0.45, 0, 0] });
  } else if (variant === 'swing') {
    for (const sx of [1, -1]) {
      curveTube([[sx * 1.0, 0, 0.6], [sx * 0.9, 2.0, 0]], 0.04, W, { parent: root, segments: 2 });
      curveTube([[sx * 1.0, 0, -0.6], [sx * 0.9, 2.0, 0]], 0.04, W, { parent: root, segments: 2 });
    }
    curveTube([[-0.95, 2.0, 0], [0.95, 2.0, 0]], 0.045, W, { parent: root, segments: 2 });
    const seat = group('seat', { parent: root, at: [0, 2.0, 0] });
    for (const sx of [1, -1]) curveTube([[sx * 0.55, 0, 0], [sx * 0.55, -1.45, 0]], 0.006, MT, { parent: seat, segments: 2 });
    mesh(roundedBox(1.2, 0.04, 0.45, 0.012), W, { parent: seat, at: [0, -1.5, 0] });
    mesh(roundedBox(1.2, 0.4, 0.04, 0.012), W, { parent: seat, at: [0, -1.25, -0.22], rot: [-0.2, 0, 0] });
    mesh(cushion(1.1, 0.06, 0.4, { radius: 0.025, bulge: 0.3 }), fabricMat(o.color ?? '#3f6b4c'), { parent: seat, at: [0, -1.45, 0.01] });
    anims.push(clip('swing', 3, [rotateTrack(seat, 'x', 3, (t) => wave(t) * 0.25)]));
  } else {
    const ring = new THREE.TorusGeometry(0.42, 0.11, 12, 40).rotateX(Math.PI / 2).scale(1, 1.8, 1);
    mesh(ring, new THREE.MeshPhysicalMaterial({ name: 'stone', color: '#8a8580', roughness: 0.9 }), { parent: root, at: [0, 0.2, 0] });
    mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 32), new THREE.MeshStandardMaterial({ color: '#1a1716', roughness: 1 }), { parent: root, at: [0, 0.05, 0] });
    anims.push(clip('fire', 0.6, flames(root, 0.4, [0, 0.1, 0])));
  }
  return finalize(root, { type: 'outdoor', variant, options: o, animations: anims });
}

/* ============================ SMALL APPLIANCES ============================ */
export const SMALL_APPLIANCE_VARIANTS = { 'coffee-machine': {}, toaster: {}, kettle: {}, blender: {}, 'stand-mixer': { color: '#b3261e' }, 'air-fryer': {}, 'espresso-machine': {} };
export function createSmallAppliance(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SMALL_APPLIANCE_VARIANTS, o.variant, 'small-appliance');
  const v = SMALL_APPLIANCE_VARIANTS[variant];
  const root = group(`small-appliance-${variant}`);
  const S = stainless();
  const P = enamel(o.color ?? v.color ?? '#1d1e21');
  const anims = [];
  const ledG = lampGroup('power_led', 'red');
  let ledAt = null;
  if (variant === 'coffee-machine') {
    mesh(roundedBox(0.2, 0.36, 0.3, 0.03, 3), P, { parent: root, at: [0, 0.18, -0.02] });
    mesh(roundedBox(0.2, 0.06, 0.3, 0.02, 3), S, { parent: root, at: [0, 0.39, -0.02] });
    mesh(roundedBox(0.16, 0.025, 0.12, 0.008, 2), S, { parent: root, at: [0, 0.0125, 0.16] });
    mesh(roundedBox(0.2, 0.04, 0.22, 0.01, 2), P, { parent: root, at: [0, 0.02, 0.05] });
    mesh(roundedBox(0.12, 0.05, 0.08, 0.01, 2), S, { parent: root, at: [0, 0.3, 0.15] });
    mesh(lathe([[0, 0], [0.035, 0], [0.04, 0.09], [0, 0.09]], 24), ceramic('#f4f4f2'), { parent: root, at: [0, 0.04, 0.14] });
    ledAt = [0.07, 0.35, 0.131];
  } else if (variant === 'toaster') {
    mesh(roundedBox(0.28, 0.19, 0.16, 0.04, 4), S, { parent: root, at: [0, 0.105, 0] });
    for (const z of [-0.03, 0.03]) mesh(roundedBox(0.2, 0.004, 0.025, 0.004, 1), plasticMat('#111'), { parent: root, at: [0, 0.2, z] });
    mesh(roundedBox(0.3, 0.015, 0.18, 0.006, 1), plasticMat('#222'), { parent: root, at: [0, 0.0075, 0] });
    mesh(roundedBox(0.03, 0.015, 0.03, 0.005, 1), plasticMat('#222'), { parent: root, at: [0.155, 0.15, 0] });
    for (const z of [-0.03, 0.03]) mesh(roundedBox(0.12, 0.08, 0.012, 0.01, 2), new THREE.MeshStandardMaterial({ color: '#d9a35c', roughness: 0.9 }), { parent: root, at: [0, 0.2, z] });
    ledAt = [0.12, 0.05, 0.081];
  } else if (variant === 'kettle') {
    mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 32), plasticMat('#222'), { parent: root, at: [0, 0.01, 0] });
    mesh(lathe([[0, 0], [0.08, 0], [0.085, 0.02], [0.075, 0.2], [0.05, 0.23], [0, 0.235]], 40), S, { parent: root, at: [0, 0.02, 0] });
    curveTube([[0, 0.24, -0.04], [0, 0.28, -0.1], [0, 0.18, -0.13], [0, 0.06, -0.09]], 0.014, plasticMat('#222'), { parent: root, segments: 24 });
    curveTube([[0, 0.2, 0.075], [0, 0.22, 0.11], [0, 0.24, 0.12]], 0.012, S, { parent: root, segments: 12 });
    ledAt = [0, 0.012, 0.091];
  } else if (variant === 'blender') {
    mesh(roundedBox(0.17, 0.14, 0.17, 0.03, 3), P, { parent: root, at: [0, 0.07, 0] });
    mesh(lathe([[0, 0], [0.06, 0], [0.085, 0.25], [0.09, 0.28], [0, 0.28]], 4).rotateY(Math.PI / 4), glassMat('#e8f4f8', 0.35), { parent: root, at: [0, 0.14, 0] });
    mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 4).rotateY(Math.PI / 4), plasticMat('#222'), { parent: root, at: [0, 0.43, 0] });
    mesh(lathe([[0, 0], [0.058, 0], [0.07, 0.12], [0, 0.12]], 4).rotateY(Math.PI / 4), new THREE.MeshPhysicalMaterial({ color: '#d94f6a', roughness: 0.3, transparent: true, opacity: 0.85 }), { parent: root, at: [0, 0.145, 0] });
    { const k = knob(S, 0.018); k.position.set(0, 0.07, 0.086); root.add(k); }
    ledAt = [0.05, 0.1, 0.0855];
  } else if (variant === 'stand-mixer') {
    mesh(roundedBox(0.2, 0.05, 0.34, 0.025, 3), P, { parent: root, at: [0, 0.025, 0] });
    mesh(roundedBox(0.12, 0.26, 0.12, 0.05, 3), P, { parent: root, at: [0, 0.16, -0.11] });
    const head = group('head', { parent: root, at: [0, 0.3, -0.11] });
    mesh(new THREE.CapsuleGeometry(0.075, 0.2, 8, 20).rotateX(Math.PI / 2), P, { parent: head, at: [0, 0.03, 0.1] });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 10), S, { parent: head, at: [0, -0.05, 0.2] });
    mesh(lathe([[0, 0], [0.06, 0.005], [0.11, 0.08], [0.12, 0.16], [0.115, 0.165], [0, 0.01]], 40), S, { parent: root, at: [0, 0.05, 0.08] });
    emblem(head, 0.035, [0, 0.03, 0.276]);
    anims.push(clip('tilt', 1, [rotateTrack(head, 'x', 1, (t) => -Math.min(1, t * 1.2) * 0.6)]));
  } else if (variant === 'air-fryer') {
    mesh(roundedBox(0.28, 0.32, 0.32, 0.08, 4), P, { parent: root, at: [0, 0.16, 0] });
    const drawer = group('drawer', { parent: root, at: [0, 0.1, 0.16] });
    mesh(roundedBox(0.24, 0.16, 0.03, 0.04, 3), P, { parent: drawer });
    curveTube([[0, 0.02, 0.015], [0, 0.0, 0.07], [0, -0.06, 0.07], [0, -0.07, 0.015]], 0.016, plasticMat('#111'), { parent: drawer, segments: 16 });
    const scr = lampGroup('display', 'blue');
    scr.add(root, { at: [0, 0.27, 0.1], normal: [0, 0.6, 1], w: 0.08, h: 0.035, depth: 0.002 });
    anims.push(clip('on', 1, lampTracks('display', 3)));
    anims.push(clip('open', 1, [moveTrack(drawer, 1, (t) => [0, 0, Math.min(1, t * 1.2) * 0.18])]));
  } else {
    mesh(roundedBox(0.3, 0.34, 0.32, 0.02, 3), S, { parent: root, at: [0, 0.17, 0] });
    mesh(roundedBox(0.3, 0.02, 0.32, 0.006, 1), S, { parent: root, at: [0, 0.35, 0] });
    for (const x of [-0.06, 0.06]) mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 24), S, { parent: root, at: [x, 0.25, 0.17] });
    curveTube([[-0.06, 0.22, 0.17], [-0.06, 0.21, 0.24], [-0.06, 0.2, 0.32]], 0.01, plasticMat('#1a1a1a'), { parent: root, segments: 8 });
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 16), S, { parent: root, at: [0.12, 0.22, 0.18] });
    mesh(roundedBox(0.24, 0.015, 0.12, 0.006, 1), S, { parent: root, at: [0, 0.03, 0.2] });
    for (let i = 0; i < 2; i++) mesh(lathe([[0, 0], [0.025, 0], [0.03, 0.06], [0, 0.06]], 20), ceramic('#f4f4f2'), { parent: root, at: [-0.04 + i * 0.08, 0.0375, 0.21] });
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 24).rotateX(Math.PI / 2), plasticMat('#111'), { parent: root, at: [0.09, 0.3, 0.161] });
    ledAt = [-0.1, 0.3, 0.1605];
  }
  if (ledAt) {
    ledG.add(root, { at: ledAt, normal: [0, 0, 1], w: 0.006, h: 0.006, depth: 0.002, shape: 'round', bezel: false });
    anims.push(clip('on', 1, lampTracks('power_led', 3)));
  }
  if (variant !== 'stand-mixer') emblem(root, 0.025, variant === 'kettle' ? [0, 0.1, 0.0815] : variant === 'toaster' ? [-0.08, 0.05, 0.081] : variant === 'blender' ? [-0.05, 0.1, 0.0855] : variant === 'air-fryer' ? [0, 0.22, 0.161] : variant === 'coffee-machine' ? [0, 0.39, 0.131] : [-0.1, 0.12, 0.1605]);
  const out = finalize(root, { type: 'small-appliance', variant, options: o, animations: anims });
  const os = anims.filter((a) => ['tilt', 'open'].includes(a.name)).map((a) => a.name);
  if (os.length) out.userData.premade.oneShot = os;
  return out;
}

/* ================================ KITCHENWARE ================================ */
export const KITCHENWARE_VARIANTS = { pot: {}, 'frying-pan': {}, 'plate-set': {}, 'cutlery-set': {}, 'knife-block': {}, 'cutting-board': {}, 'dutch-oven': { color: '#c0392b' }, 'mug-set': { color: '#f4f4f2' } };
export function createKitchenware(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(KITCHENWARE_VARIANTS, o.variant, 'kitchenware');
  const v = KITCHENWARE_VARIANTS[variant];
  const root = group(`kitchenware-${variant}`);
  const S = stainless();
  const anims = [];
  if (variant === 'pot' || variant === 'dutch-oven') {
    const dutch = variant === 'dutch-oven';
    const body = dutch ? enamel(o.color ?? v.color) : S;
    mesh(lathe([[0, 0], [0.11, 0], [0.12, 0.01], [0.12, 0.14], [0.125, 0.145], [0.115, 0.145], [0.112, 0.012], [0, 0.012]], 48), body, { parent: root }).material.side = THREE.DoubleSide;
    for (const sx of [1, -1]) {
      if (dutch) mesh(new THREE.TorusGeometry(0.025, 0.01, 8, 16, Math.PI).rotateY(Math.PI / 2), body, { parent: root, at: [sx * 0.125, 0.11, 0], rot: [0, 0, sx * Math.PI / 2] });
      else curveTube([[sx * 0.12, 0.12, 0], [sx * 0.16, 0.125, 0], [sx * 0.17, 0.13, 0]], 0.008, S, { parent: root, segments: 8 });
    }
    const lid = group('lid', { parent: root, at: [0, 0.145, 0] });
    mesh(lathe([[0, 0.035], [0.06, 0.03], [0.125, 0.0], [0.125, -0.004], [0, 0.03]], 48), dutch ? body : glassMat('#dfe9ec', 0.4), { parent: lid });
    mesh(lathe([[0, 0], [0.02, 0], [0.02, 0.015], [0.028, 0.025], [0, 0.03]], 20), dutch ? S : plasticMat('#111'), { parent: lid, at: [0, 0.03, 0] });
    if (!dutch) mesh(new THREE.TorusGeometry(0.124, 0.004, 6, 48).rotateX(Math.PI / 2), S, { parent: lid });
    anims.push(clip('steam', 1.2, [moveTrack(lid, 1.2, (t) => [0, Math.max(0, Math.sin(t * Math.PI * 4)) * 0.004, 0])]));
  } else if (variant === 'frying-pan') {
    mesh(lathe([[0, 0], [0.1, 0], [0.13, 0.04], [0.135, 0.045], [0.128, 0.045], [0.098, 0.006], [0, 0.006]], 48), new THREE.MeshPhysicalMaterial({ name: 'stainless', color: '#2a2b2e', roughness: 0.35, metalness: 0.4, clearcoat: 0.6 }), { parent: root }).material.side = THREE.DoubleSide;
    curveTube([[0.13, 0.04, 0], [0.2, 0.05, 0], [0.33, 0.06, 0]], 0.012, S, { parent: root, segments: 8 });
    mesh(new THREE.CapsuleGeometry(0.015, 0.11, 4, 12).rotateZ(Math.PI / 2 - 0.08), woodMat('walnut'), { parent: root, at: [0.28, 0.058, 0] });
  } else if (variant === 'plate-set') {
    const C = ceramic(o.color ?? '#f6f4ef');
    for (let i = 0; i < 6; i++) mesh(lathe([[0, 0], [0.09, 0], [0.13, 0.012], [0.135, 0.016], [0.128, 0.016], [0.088, 0.006], [0, 0.006]], 48), C, { parent: root, at: [0, i * 0.012, 0] });
    for (let i = 0; i < 4; i++) mesh(lathe([[0, 0], [0.05, 0], [0.08, 0.05], [0.082, 0.055], [0.076, 0.055], [0.048, 0.008], [0, 0.008]], 40), C, { parent: root, at: [0.3, i * 0.02, 0] });
  } else if (variant === 'cutlery-set') {
    mesh(roundedBox(0.3, 0.05, 0.22, 0.01, 2), woodMat('oak'), { parent: root, at: [0, 0.025, 0] });
    for (let i = 0; i < 4; i++) {
      const x = -0.1 + i * 0.065;
      curveTube([[x, 0.054, -0.09], [x, 0.054, 0.06]], 0.0035, S, { parent: root, segments: 2 });
      mesh(new THREE.SphereGeometry(0.018, 12, 8).scale(0.8, 0.25, 1.1), S, { parent: root, at: [x, 0.056, 0.08] });
    }
  } else if (variant === 'knife-block') {
    const B = woodMat('walnut');
    const blk = group(null, { parent: root, rot: [-0.3, 0, 0] });
    mesh(roundedBox(0.12, 0.24, 0.1, 0.01, 2), B, { parent: blk, at: [0, 0.12, 0] });
    for (let i = 0; i < 5; i++) mesh(new THREE.CapsuleGeometry(0.011, 0.08, 4, 10), plasticMat('#1a1a1a'), { parent: blk, at: [-0.04 + i * 0.02, 0.29, -0.01 + (i % 2) * 0.02] });
    mesh(roundedBox(0.12, 0.02, 0.18, 0.006, 1), B, { parent: root, at: [0, 0.01, -0.02] });
  } else if (variant === 'cutting-board') {
    mesh(roundedBox(0.45, 0.03, 0.3, 0.02, 3), woodMat('#b98a55'), { parent: root, at: [0, 0.015, 0] });
    mesh(new THREE.TorusGeometry(0.02, 0.006, 8, 16).rotateX(Math.PI / 2), woodMat('#9a6f42'), { parent: root, at: [0.19, 0.031, 0] });
    for (let i = 0; i < 5; i++) mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 16), new THREE.MeshStandardMaterial({ color: '#e94f4f', roughness: 0.6 }), { parent: root, at: [-0.12 + i * 0.05, 0.036, 0.05] });
  } else {
    const C = ceramic(o.color ?? v.color);
    for (let i = 0; i < 4; i++) {
      const x = (i % 2 - 0.5) * 0.12;
      const z = (Math.floor(i / 2) - 0.5) * 0.12;
      mesh(lathe([[0, 0], [0.04, 0], [0.042, 0.095], [0.039, 0.095], [0.037, 0.006], [0, 0.006]], 32), C, { parent: root, at: [x, 0, z] }).material.side = THREE.DoubleSide;
      mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16, Math.PI * 1.3), C, { parent: root, at: [x + 0.045, 0.05, z], rot: [0, 0, -Math.PI * 0.65] });
    }
  }
  return finalize(root, { type: 'kitchenware', variant, options: o, animations: anims });
}

/* ============================ BATH ACCESSORIES ============================ */
export const BATH_ITEM_VARIANTS = { 'towel-rail': {}, 'laundry-basket': {}, 'toilet-roll-stand': {}, 'soap-set': { color: '#f4f4f2' }, 'bath-caddy': {}, 'heated-towel-rail': {} };
export function createBathItem(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BATH_ITEM_VARIANTS, o.variant, 'bath-item');
  const v = BATH_ITEM_VARIANTS[variant];
  const root = group(`bath-item-${variant}`);
  const MT = metalMat(o.metal ?? 'chrome');
  const towel = (c) => fabricMat(c);
  const anims = [];
  if (variant === 'towel-rail' || variant === 'heated-towel-rail') {
    const heated = variant === 'heated-towel-rail';
    for (const sx of [1, -1]) {
      curveTube([[sx * 0.25, 0, 0], [sx * 0.25, heated ? 1.2 : 0.9, 0]], 0.014, MT, { parent: root, segments: 2 });
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 20), MT, { parent: root, at: [sx * 0.25, 0.005, 0] });
    }
    const bars = heated ? 12 : 3;
    for (let i = 0; i < bars; i++) curveTube([[-0.25, 0.25 + i * (heated ? 0.08 : 0.25), 0], [0.25, 0.25 + i * (heated ? 0.08 : 0.25), 0]], heated ? 0.01 : 0.012, MT, { parent: root, segments: 2 });
    const T = towel(o.color ?? '#9fb4c7');
    const g = new THREE.PlaneGeometry(0.42, 0.7, 1, 20);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); const z = y > 0.3 ? -0.015 * Math.cos(((y - 0.3) / 0.05) * Math.PI) : 0.02; p.setZ(i, z); }
    g.computeVertexNormals();
    const t = mesh(g, T, { parent: root, at: [0, (heated ? 1.13 : 0.75) - 0.33, 0.0] });
    t.material.side = THREE.DoubleSide;
    if (heated) {
      const l = lampGroup('power_led', 'red');
      l.add(root, { at: [0.25, 0.12, 0.015], normal: [0, 0, 1], w: 0.006, h: 0.006, depth: 0.002, shape: 'round', bezel: false });
      anims.push(clip('on', 1, lampTracks('power_led', 3)));
    }
  } else if (variant === 'laundry-basket') {
    const g = lathe([[0, 0], [0.18, 0], [0.22, 0.55], [0.21, 0.55], [0.17, 0.01], [0, 0.01]], 40);
    const b = mesh(g, rattanMat('#b98a55'), { parent: root });
    b.material.side = THREE.DoubleSide;
    for (const sx of [1, -1]) curveTube([[sx * 0.2, 0.48, 0.0], [sx * 0.24, 0.5, 0], [sx * 0.2, 0.52, 0]], 0.01, leatherMat('#6b4226'), { parent: root, segments: 10 });
    mesh(cushion(0.3, 0.12, 0.25, { radius: 0.05, bulge: 0.5 }), towel(o.color ?? '#e8e2d6'), { parent: root, at: [0, 0.52, 0], rot: [0.2, 0.3, 0.1] });
  } else if (variant === 'toilet-roll-stand') {
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.015, 32), MT, { parent: root, at: [0, 0.0075, 0] });
    curveTube([[0, 0, 0], [0, 0.65, 0]], 0.01, MT, { parent: root, segments: 2 });
    curveTube([[0, 0.55, 0], [0.1, 0.55, 0]], 0.006, MT, { parent: root, segments: 2 });
    const roll = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 32).rotateZ(Math.PI / 2), fabricMat('#fbfbf8'), { parent: root, at: [0.06, 0.55, 0] });
    roll.name = 'roll';
    for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 24), fabricMat('#fbfbf8'), { parent: root, at: [0, 0.065 + i * 0.1, 0] }).scale.set(1, 0.98, 1);
  } else if (variant === 'soap-set') {
    const C = ceramic(o.color ?? v.color);
    mesh(roundedBox(0.3, 0.02, 0.12, 0.01, 2), woodMat('#c8a77c'), { parent: root, at: [0, 0.01, 0] });
    mesh(lathe([[0, 0], [0.035, 0], [0.04, 0.12], [0.02, 0.15], [0, 0.15]], 32), C, { parent: root, at: [-0.08, 0.02, 0] });
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 10), MT, { parent: root, at: [-0.08, 0.19, 0] });
    curveTube([[-0.08, 0.205, 0], [-0.08, 0.21, 0.04]], 0.006, MT, { parent: root, segments: 2 });
    mesh(lathe([[0, 0], [0.04, 0], [0.045, 0.1], [0.04, 0.1], [0.035, 0.006], [0, 0.006]], 32), C, { parent: root, at: [0.04, 0.02, 0] });
    for (let i = 0; i < 2; i++) mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 8), woodMat('#c8a77c'), { parent: root, at: [0.04 + (i - 0.5) * 0.02, 0.1, 0], rot: [0, 0, (i - 0.5) * 0.3] });
    mesh(roundedBox(0.07, 0.025, 0.05, 0.012, 3), new THREE.MeshPhysicalMaterial({ color: '#e8b6c0', roughness: 0.4, clearcoat: 0.6 }), { parent: root, at: [0.11, 0.0325, 0] });
  } else {
    mesh(roundedBox(0.75, 0.025, 0.2, 0.01, 2), woodMat('#c8a77c'), { parent: root, at: [0, 0.6, 0] });
    for (let i = 0; i < 8; i++) mesh(roundedBox(0.02, 0.02, 0.18, 0.004, 1), woodMat('#c8a77c'), { parent: root, at: [-0.3 + i * 0.086, 0.585, 0] });
    // bathtub rim stand-in: two support legs so the caddy stands alone
    for (const sx of [1, -1]) mesh(roundedBox(0.04, 0.585, 0.2, 0.01, 2), woodMat('#c8a77c'), { parent: root, at: [sx * 0.355, 0.2925, 0] });
    mesh(lathe([[0, 0], [0.025, 0], [0.025, 0.08], [0, 0.08]], 16), new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.9 }), { parent: root, at: [-0.2, 0.6125, 0] });
    mesh(roundedBox(0.16, 0.12, 0.01, 0.004, 1), new THREE.MeshPhysicalMaterial({ color: '#8a3a2a', roughness: 0.6 }), { parent: root, at: [0.12, 0.67, -0.02], rot: [-0.3, 0, 0] });
  }
  return finalize(root, { type: 'bath-item', variant, options: o, animations: anims });
}

/* ================================ DECOR ITEMS ================================ */
export const DECOR_ITEM_VARIANTS = { candles: {}, 'book-stack': {}, basket: {}, sculpture: {}, globe: {}, hourglass: {}, lantern: {}, 'throw-pillows': { color: '#c0714a' } };
export function createDecorItem(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(DECOR_ITEM_VARIANTS, o.variant, 'decor-item');
  const v = DECOR_ITEM_VARIANTS[variant];
  const root = group(`decor-item-${variant}`);
  const anims = [];
  const r = rng(o.seed ?? 7);
  if (variant === 'candles' || variant === 'lantern') {
    const wax = new THREE.MeshPhysicalMaterial({ name: 'ceramic', color: o.color ?? '#f4ecdc', roughness: 0.55, sheen: 0.4 });
    const flame = lampGroup('flame', 'amber');
    const spots = variant === 'lantern' ? [[0, 0.12]] : [[-0.06, 0.2], [0.02, 0.14], [0.08, 0.09]];
    if (variant === 'lantern') {
      const M2 = metalMat(o.metal ?? 'black');
      mesh(roundedBox(0.16, 0.02, 0.16, 0.006, 1), M2, { parent: root, at: [0, 0.01, 0] });
      for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(roundedBox(0.012, 0.28, 0.012, 0.003, 1), M2, { parent: root, at: [sx * 0.074, 0.15, sz * 0.074] });
      mesh(new THREE.ConeGeometry(0.11, 0.07, 4).rotateY(Math.PI / 4), M2, { parent: root, at: [0, 0.325, 0] });
      mesh(new THREE.TorusGeometry(0.03, 0.005, 8, 20), M2, { parent: root, at: [0, 0.38, 0] });
      mesh(new THREE.BoxGeometry(0.14, 0.27, 0.14), glassMat('#fff6e0', 0.15), { parent: root, at: [0, 0.155, 0] });
    }
    for (const [x, h] of spots) {
      mesh(new THREE.CylinderGeometry(0.03, 0.03, h, 24), wax, { parent: root, at: [x, (variant === 'lantern' ? 0.02 : 0) + h / 2, 0] });
      const top = (variant === 'lantern' ? 0.02 : 0) + h;
      mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.012, 6), plasticMat('#222'), { parent: root, at: [x, top + 0.006, 0] });
      flame.add(root, { at: [x, top + 0.022, 0], normal: [0, 0, 1], w: 0.012, h: 0.025, depth: 0.006, shape: 'round', bezel: false, glowSize: 0.12 });
    }
    flame.lens.emissiveIntensity = 1.5;
    anims.push(clip('flicker', 0.5, [numberTrack('flame.material.emissiveIntensity', 0.5, (t) => 2.4 + Math.sin(t * Math.PI * 6) * 0.6, 12), numberTrack('flame_glow.material.opacity', 0.5, (t) => 0.75 + Math.sin(t * Math.PI * 4) * 0.15, 12)]));
  } else if (variant === 'book-stack') {
    let y = 0;
    const cols = ['#7b2d26', '#2d4a7b', '#2f5d3a', '#c9a227', '#3b3b3b', '#d8d2c4'];
    for (let i = 0; i < 5; i++) {
      const h = 0.025 + r() * 0.025;
      const w = 0.2 + r() * 0.08;
      const book = group(null, { parent: root, at: [r() * 0.02, y + h / 2, 0], rot: [0, (r() - 0.5) * 0.4, 0] });
      mesh(roundedBox(w, h, 0.15 + r() * 0.05, 0.004, 1), new THREE.MeshPhysicalMaterial({ color: cols[i % cols.length], roughness: 0.6 }), { parent: book });
      mesh(new THREE.BoxGeometry(w - 0.01, h * 0.86, 0.004), new THREE.MeshStandardMaterial({ color: '#f1ead8', roughness: 0.9 }), { parent: book, at: [0, 0, 0.075 + 0.0] });
      y += h;
    }
    mesh(lathe([[0, 0], [0.04, 0], [0.05, 0.06], [0.03, 0.12], [0, 0.12]], 24), ceramic('#e9e6df'), { parent: root, at: [0.04, y, 0] });
  } else if (variant === 'basket') {
    const g = lathe([[0, 0], [0.16, 0], [0.2, 0.28], [0.19, 0.28], [0.15, 0.01], [0, 0.01]], 40);
    mesh(g, rattanMat('#c9a26b'), { parent: root }).material.side = THREE.DoubleSide;
    mesh(new THREE.TorusGeometry(0.195, 0.012, 8, 40).rotateX(Math.PI / 2), rattanMat('#a8824f'), { parent: root, at: [0, 0.28, 0] });
    for (let i = 0; i < 2; i++) mesh(cushion(0.3, 0.08, 0.2, { radius: 0.03, bulge: 0.4 }), fabricMat(['#e8e2d6', '#8c9a84'][i]), { parent: root, at: [0, 0.27 + i * 0.05, 0], rot: [0.3 * i, i, 0.2] });
  } else if (variant === 'sculpture') {
    mesh(roundedBox(0.16, 0.05, 0.16, 0.006, 1), new THREE.MeshPhysicalMaterial({ name: 'stone', color: '#2a2a2c', roughness: 0.3, clearcoat: 0.8 }), { parent: root, at: [0, 0.025, 0] });
    const knot = new THREE.TorusKnotGeometry(0.07, 0.022, 120, 16, 2, 3);
    mesh(knot, new THREE.MeshPhysicalMaterial({ name: 'ceramic', color: o.color ?? '#e9e6df', roughness: 0.25, clearcoat: 0.6 }), { parent: root, at: [0, 0.14, 0] });
    curveTube([[0, 0.05, 0], [0, 0.07, 0]], 0.01, metalMat('brass'), { parent: root, segments: 2 });
  } else if (variant === 'globe') {
    const W = woodMat('walnut');
    mesh(lathe([[0, 0], [0.09, 0], [0.09, 0.015], [0.03, 0.03], [0.02, 0.15], [0, 0.15]], 32), W, { parent: root });
    const globe = group('globe', { parent: root, at: [0, 0.3, 0], rot: [0, 0, 0.41] });
    mesh(new THREE.SphereGeometry(0.13, 40, 28), globeMat(), { parent: globe, name: 'globe_ball' });
    mesh(new THREE.TorusGeometry(0.145, 0.006, 8, 48, Math.PI * 1.15), metalMat('brass'), { parent: globe, rot: [0, Math.PI / 2, -0.25] });
    curveTube([[0, 0.15, 0], [0, 0.17, 0]], 0.01, metalMat('brass'), { parent: root, segments: 2 });
    anims.push(clip('spin', 12, [spinTrack(globe.children[0], 'y', 12, 1)]));
  } else if (variant === 'hourglass') {
    const W = woodMat('walnut');
    for (const y of [0.0, 0.24]) mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 32), W, { parent: root, at: [0, y + 0.01, 0] });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 8), W, { parent: root, at: [Math.cos(a) * 0.058, 0.13, Math.sin(a) * 0.058] }); }
    mesh(lathe([[0, 0], [0.045, 0.005], [0.04, 0.06], [0.006, 0.11], [0.04, 0.16], [0.045, 0.215], [0, 0.22]], 32), glassMat('#eef6f8', 0.3), { parent: root, at: [0, 0.02, 0] });
    mesh(lathe([[0, 0], [0.042, 0.008], [0.03, 0.045], [0, 0.06]], 24), new THREE.MeshStandardMaterial({ color: '#d9b46a', roughness: 0.9 }), { parent: root, at: [0, 0.02, 0] });
  } else {
    for (let i = 0; i < 3; i++) {
      const c = ['#c0714a', '#e8e2d6', '#8a9a6b'][i];
      mesh(cushion(0.42, 0.42, 0.13, { radius: 0.07, bulge: 0.6 }), fabricMat(i === 0 ? o.color ?? c : c), { parent: root, at: [(i - 1) * 0.38, 0.36, -i * 0.03], rot: [-0.1, (i - 1) * 0.2, (i - 1) * 0.08] });
    }
  }
  return finalize(root, { type: 'decor-item', variant, options: o, animations: anims });
}

function globeMat() {
  if (typeof document === 'undefined') return new THREE.MeshPhysicalMaterial({ color: '#3a7bbf', roughness: 0.4, clearcoat: 0.6 });
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#5d8fae'; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#7d9a5e';
  const blobs = [[60, 40, 30, 20], [70, 80, 15, 25], [130, 35, 28, 15], [140, 70, 18, 22], [200, 45, 35, 18], [215, 95, 15, 10]];
  for (const [x, y, rx, ry] of blobs) { g.beginPath(); g.ellipse(x, y, rx, ry, 0.3, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.45, clearcoat: 0.8 });
}
