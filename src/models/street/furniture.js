import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, curveTube, lathe, extrudeOutline, rng, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, scaleTrack, numberTrack, clip, pingPong } from '../../core/animation.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { mats, pole, textTexture, bolt, emblem, tube } from './common.js';
import { finish, styleOf, curvedRoof } from './kit.js';
import { createBush, createGrass, createFlower } from '../nature/plants.js';

/* Seat-height street furniture: benches, bins, planters, fountains, bike racks,
 * picnic tables and drinking fountains. Real-world sizes in metres. */

/** Place a child object so its lowest point sits at height y (plants in soil etc.). */
export function seat(parent, obj, x, y, z) {
  obj.position.set(x, 0, z);
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj);
  obj.position.y = y - b.min.y;
  obj.userData = {};
  parent.add(obj);
  return obj;
}

/* -------------------------------- Bench -------------------------------- */

export const BENCH_VARIANTS = {
  park: { wood: '#8a5a33', frame: '#1f2622' },
  modern: { wood: '#a5764a', frame: '#3a3f44' },
  stone: { wood: '#9a6b3f', frame: '#a39e96' },
  backless: { wood: '#9c6a3c', frame: '#2b3034' },
  curved: { wood: '#a87a4c', frame: '#b8b2a8' },
  log: { wood: '#7a5634', frame: '#6b4a2e' },
};

function plaque(parent, at, rotX = 0) {
  const brass = M.metal('#b8913a', 0.3);
  const g = group('plaque', { parent, at });
  g.rotation.x = rotX;
  mesh(roundedBox(0.2, 0.06, 0.006, 0.008), brass, { parent: g });
  const tex = textTexture([['IN LOVING MEMORY', 'bold 34px Georgia, serif'], ['who loved this view', 'italic 28px Georgia, serif']], { w: 512, h: 150, bg: '#b8913a', fg: '#3a2a08', radius: 10 });
  if (tex) mesh(new THREE.PlaneGeometry(0.19, 0.055), new THREE.MeshStandardMaterial({ map: tex, metalness: 0.7, roughness: 0.35 }), { parent: g, at: [0, 0, 0.0035] });
}

export function createBench(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BENCH_VARIANTS, o.variant, 'bench');
  const v = BENCH_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`bench-${variant}`);
  const woodMat = M.wood(o.wood ?? v.wood);
  const L = o.length ?? (variant === 'curved' ? 2.4 : 1.8);
  let backTop = null; // [y, z] for a plaque
  let armXs = [];
  let seatY = 0.45;
  if (variant === 'park') {
    const iron = mats.castIron(o.color ?? v.frame);
    const side = [[0.24, 0], [0.3, 0], [0.26, 0.4], [0.3, 0.62], [0.27, 0.66], [0.2, 0.62], [-0.15, 0.44], [-0.24, 0.86], [-0.3, 0.86], [-0.2, 0.42], [-0.26, 0], [-0.2, 0], [-0.14, 0.36], [0.16, 0.38]];
    const g = extrudeOutline(side, 0.05, { bevel: 0.012 });
    // outline x → world z with the backrest (negative x) at the BACK (-z), matching the slats
    g.rotateY(-Math.PI / 2);
    for (const x of [L / 2 - 0.08, -L / 2 + 0.08]) mesh(g, iron, { parent: root, at: [x, 0, 0] });
    for (let i = 0; i < 5; i++) {
      const z = 0.17 - i * 0.075;
      mesh(roundedBox(L, 0.03, 0.065, 0.01), woodMat, { parent: root, at: [0, 0.405 + (z + 0.14) * 0.06, z] });
    }
    for (let i = 0; i < 3; i++) {
      const t = 0.35 + i * 0.3;
      mesh(roundedBox(L - 0.02, 0.065, 0.028, 0.01), woodMat, { parent: root, at: [0, 0.46 + t * 0.38, -0.162 - t * 0.088], rot: [-0.23, 0, 0] });
    }
    for (const x of [L / 2 - 0.08, -L / 2 + 0.08]) for (const z of [0.1, -0.1]) bolt(root, x + Math.sign(x) * 0.03, 0.43, z, { r: 0.008, rotY: Math.PI / 2 });
    backTop = [0.68, -0.235, -0.23];
    seatY = 0.42;
  } else if (variant === 'modern') {
    const frame = mats.powder(o.color ?? v.frame);
    for (const x of [L / 2 - 0.12, -L / 2 + 0.12]) {
      curveTube([[x, 0, 0.22], [x, 0.38, 0.22], [x, 0.42, 0.18], [x, 0.42, -0.18], [x, 0.4, -0.22], [x, 0, -0.22]], 0.022, frame, { parent: root, segments: 64, radialSegments: 14 });
      curveTube([[x, 0.42, -0.18], [x, 0.62, -0.24], [x, 0.82, -0.27]], 0.018, frame, { parent: root, radialSegments: 12 });
      for (const z of [0.22, -0.22]) mesh(lathe([[0.001, 0], [0.035, 0], [0.035, 0.012], [0.001, 0.012]], 16), M.rubber(), { parent: root, at: [x, 0, z] });
    }
    for (let i = 0; i < 5; i++) mesh(roundedBox(L, 0.03, 0.07, 0.01), woodMat, { parent: root, at: [0, 0.455, 0.17 - i * 0.083] });
    for (let i = 0; i < 3; i++) mesh(roundedBox(L, 0.07, 0.03, 0.01), woodMat, { parent: root, at: [0, 0.58 + i * 0.09, -0.245 - i * 0.012], rot: [-0.18, 0, 0] });
    backTop = [0.67, -0.248, -0.18];
  } else if (variant === 'stone') {
    const conc = mats.concrete(o.color ?? v.frame);
    mesh(roundedBox(L, 0.4, 0.5, 0.035), conc, { parent: root, at: [0, 0.2, 0] });
    for (let i = 0; i < 5; i++) mesh(roundedBox(L - 0.04, 0.035, 0.085, 0.012), woodMat, { parent: root, at: [0, 0.418, 0.2 - i * 0.1] });
    backTop = [0.2, 0.251, 0];
  } else if (variant === 'backless') {
    const frame = mats.powder(o.color ?? v.frame);
    for (const x of [L / 2 - 0.15, -L / 2 + 0.15]) {
      // flat-bar trapezoid legs welded to a cross rail
      const leg = extrudeOutline([[-0.22, 0], [0.22, 0], [0.2, 0.41], [-0.2, 0.41]], 0.05, { bevel: 0.008 });
      leg.rotateY(Math.PI / 2);
      mesh(leg, frame, { parent: root, at: [x, 0, 0] });
    }
    for (let i = 0; i < 4; i++) mesh(roundedBox(L, 0.04, 0.095, 0.012), woodMat, { parent: root, at: [0, 0.43, 0.15 - i * 0.1] });
    backTop = [0.43, 0.1935, 0];
  } else if (variant === 'curved') {
    // segment of a circular concrete seat-wall with timber top, people sit on the outside
    const R = 3.2;
    const span = L / R;
    const conc = mats.concrete(o.color ?? v.frame);
    const shape = new THREE.Shape();
    shape.absarc(0, 0, R + 0.25, -span / 2, span / 2, false);
    shape.absarc(0, 0, R - 0.25, span / 2, -span / 2, true);
    const wall = new THREE.ExtrudeGeometry(shape, { depth: 0.38, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 32 });
    wall.rotateX(-Math.PI / 2);
    wall.translate(0, 0.02, 0);
    const w = mesh(wall, conc, { parent: root });
    w.position.z = -R;
    w.rotation.y = -Math.PI / 2;
    for (let i = 0; i < 18; i++) {
      const a = -span / 2 + ((i + 0.5) / 18) * span;
      const s = mesh(roundedBox(0.52, 0.04, (L / 18) * 0.86, 0.012), woodMat, { parent: root });
      s.position.set(Math.sin(a) * R, 0.44, -R + Math.cos(a) * R);
      s.rotation.y = a - Math.PI / 2;
    }
    { const a = (0.5 / 18) * span; backTop = [0.44, -R + Math.cos(a) * R + 0.263, 0, Math.sin(a) * R]; }
  } else {
    // rustic: half log on two stump legs, bark on the round side
    const logMat = M.wood(o.wood ?? v.wood);
    const bark = new THREE.MeshStandardMaterial({ color: '#4a3524', roughness: 1, name: 'bark' });
    const half = new THREE.CylinderGeometry(0.2, 0.2, L, 24, 1, false, Math.PI, Math.PI);
    half.rotateZ(Math.PI / 2);
    mesh(half, bark, { parent: root, at: [0, 0.44, 0] });
    mesh(roundedBox(L - 0.02, 0.02, 0.39, 0.008), logMat, { parent: root, at: [0, 0.44, 0] });
    for (const x of [L / 2 - 0.3, -L / 2 + 0.3]) {
      mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.26, 18), bark, { parent: root, at: [x, 0.13, 0] });
      mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.01, 18), logMat, { parent: root, at: [x, 0.265, 0] });
    }
    backTop = [0.42, 0.196, 0];
  }
  if (style === 'armrests') {
    // anti-sleeping dividers / armrests across the seat
    const frame = mats.powder(o.color ?? '#2b3034');
    const n = variant === 'curved' ? 3 : 2;
    armXs = n === 3 ? [-L / 3, 0, L / 3] : [-L / 6, L / 6];
    const top = { park: 0.44, modern: 0.47, stone: 0.435, backless: 0.45, curved: 0.46, log: 0.45 }[variant];
    for (const x of armXs) {
      const zf = variant === 'stone' || variant === 'backless' || variant === 'log' || variant === 'curved' ? 0.12 : 0.13;
      curveTube([[x, top, zf], [x, top + 0.17, zf - 0.03], [x, top + 0.2, zf - 0.13], [x, top + 0.18, -0.12], [x, top, -0.14]], 0.016, frame, { parent: root, segments: 32, radialSegments: 10 });
    }
  }
  if (style === 'plaque') plaque(root, [backTop[3] ?? 0, backTop[0], backTop[1] + 0.004], backTop[2]);
  void seatY;
  return finish(root, { type: 'bench', variant, o, animations: [] });
}

/* ------------------------------ Trash can ------------------------------ */

export const TRASH_CAN_VARIANTS = {
  park: { color: '#2e4a3a' },
  city: { color: '#30353a' },
  recycling: { color: '#1e6fb8' },
  wheelie: { color: '#2f5f3a' },
  'dog-waste': { color: '#b3261e' },
  'solar-compactor': { color: '#3a4046' },
  'wire-basket': { color: '#2b3034' },
};

function litter(parent, rand, at, n = 6) {
  // crumpled paper, a can and a coffee cup
  const paper = new THREE.MeshStandardMaterial({ color: '#efece2', roughness: 0.9 });
  for (let i = 0; i < n; i++) {
    const g = new THREE.IcosahedronGeometry(0.03 + rand() * 0.02, 0);
    mesh(g, paper, { parent, at: [at[0] + (rand() - 0.5) * 0.7, 0.025, at[2] + (rand() - 0.5) * 0.7] });
  }
  const can = mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 14), M.metal('#c62828', 0.3), { parent, at: [at[0] + 0.35, 0.033, at[2] + 0.15] });
  can.rotation.z = Math.PI / 2;
  const cup = mesh(new THREE.CylinderGeometry(0.045, 0.032, 0.12, 14), M.plastic('#f2efe6', 0.6), { parent, at: [at[0] - 0.3, 0.045, at[2] + 0.25] });
  cup.rotation.z = Math.PI / 2;
}
function bags(parent, rand, at, n = 3) {
  const bag = new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', roughness: 0.35, clearcoat: 0.4, name: 'bin-bag' });
  for (let i = 0; i < n; i++) {
    const g = new THREE.SphereGeometry(0.2, 16, 12);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const y = p.getY(k);
      const s = 1 + Math.sin(k * 1.7) * 0.06;
      p.setXYZ(k, p.getX(k) * s, y < 0 ? y * 0.85 : y * 1.15, p.getZ(k) * s);
    }
    g.computeVertexNormals();
    const b = mesh(g, bag, { parent, at: [at[0] + (i - 1) * 0.34 + (rand() - 0.5) * 0.08, at[1] + 0.17, at[2] + (rand() - 0.5) * 0.1] });
    b.rotation.y = rand() * 3;
    // tied neck
    mesh(new THREE.ConeGeometry(0.035, 0.08, 10), bag, { parent, at: [b.position.x, b.position.y + 0.25, b.position.z] });
  }
}

export function createTrashCan(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(TRASH_CAN_VARIANTS, o.variant, 'trash-can');
  const v = TRASH_CAN_VARIANTS[variant];
  const style = styleOf(o);
  const rand = rng(o.seed ?? 3);
  const root = group(`trash-can-${variant}`);
  const paint = mats.powder(o.color ?? v.color);
  paint.name = 'paint';
  const animations = [];
  let topY = 0.9;
  if (variant === 'park') {
    const R = 0.28;
    const H = 0.85;
    const liner = M.plastic('#151515', 0.8);
    liner.side = THREE.DoubleSide;
    mesh(lathe([[0.001, 0.02], [R * 0.96, 0.02], [R * 0.96, H - 0.02], [R * 0.9, H - 0.02], [R * 0.9, 0.05], [0.001, 0.05]], 32), liner, { parent: root });
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const s = mesh(roundedBox(0.055, H - 0.1, 0.018, 0.008), paint, { parent: root, at: [Math.cos(a) * R, H / 2, Math.sin(a) * R] });
      s.rotation.y = -a + Math.PI / 2;
    }
    for (const y of [0.1, H - 0.08]) mesh(new THREE.TorusGeometry(R + 0.012, 0.018, 10, 48).rotateX(Math.PI / 2), paint, { parent: root, at: [0, y, 0] });
    mesh(lathe([[0.001, 0], [R + 0.03, 0], [R + 0.03, 0.025], [R * 0.9, 0.06], [R * 0.45, 0.1], [0.001, 0.105]], 40), paint, { parent: root, at: [0, H - 0.04, 0] });
    for (const a of [0, Math.PI]) mesh(roundedBox(0.05, 0.05, 0.05, 0.012), paint, { parent: root, at: [Math.cos(a) * (R + 0.02), 0.025, Math.sin(a) * (R + 0.02)] });
    topY = H + 0.07;
  } else if (variant === 'city') {
    const W = 0.55;
    const H = 1.0;
    mesh(roundedBox(W, H - 0.1, W * 0.75, 0.04), paint, { parent: root, at: [0, (H - 0.1) / 2, 0] });
    const lid = group('lid', { parent: root, at: [0, H - 0.1, -W * 0.37] });
    const dome = extrudeOutline([[-W * 0.375 + 0.001, 0], [W * 0.375, 0], [W * 0.33, 0.08], [0.15, 0.13], [-0.15, 0.13], [-W * 0.33, 0.08]], W, { bevel: 0.02 });
    dome.rotateY(Math.PI / 2);
    mesh(dome, paint, { parent: lid, at: [0, 0, W * 0.37] });
    mesh(roundedBox(W * 0.6, 0.09, 0.02, 0.02), M.plastic('#0b0b0b'), { parent: lid, at: [0, 0.06, W * 0.37 + W * 0.36] });
    // embossed LITTER lettering + the studio emblem flush on the door
    const tex = textTexture('LITTER', { w: 256, h: 64, bg: o.color ?? v.color, fg: '#e8e8e2', font: 'bold 44px Helvetica, Arial', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(0.26, 0.065), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), { parent: root, at: [0, H * 0.7, W * 0.376] });
    emblem(root, 0.1, [0, H * 0.45, W * 0.375]);
    animations.push(clip('open', 3, [rotateTrack(lid, 'x', 3, (t) => -pingPong(t) * 1.4)]));
    topY = H + 0.03;
  } else if (variant === 'recycling') {
    const cols = [o.color ?? v.color, '#2f8f3e', '#f2b705'];
    const labels = ['PAPER', 'GLASS', 'PLASTIC'];
    cols.forEach((c, i) => {
      const x = (i - 1) * 0.5;
      const body = lathe([[0.001, 0], [0.19, 0], [0.22, 0.85], [0.001, 0.85]], 4);
      body.rotateY(Math.PI / 4);
      mesh(body, mats.powder(c), { parent: root, at: [x, 0, 0] });
      const lid = group(`lid_${i}`, { parent: root, at: [x, 0.85, -0.22] });
      mesh(roundedBox(0.46, 0.05, 0.46, 0.02), mats.powder(c), { parent: lid, at: [0, 0.025, 0.22] });
      mesh(roundedBox(0.2, 0.05, 0.02, 0.008), M.plastic('#111'), { parent: lid, at: [0, 0.025, 0.46] });
      const tex = textTexture(labels[i], { w: 256, h: 80, bg: '#ffffff', fg: c, font: 'bold 52px Helvetica, Arial', radius: 10 });
      if (tex) {
        const lab = mesh(new THREE.PlaneGeometry(0.2, 0.0625), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), { parent: root, at: [x, 0.6, Math.SQRT1_2 * (0.19 + (0.03 * 0.6) / 0.85) + 0.003] });
        lab.rotation.x = -Math.atan2(Math.SQRT1_2 * 0.03, 0.85);
      }
      for (const z of [0.1, -0.1]) mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 20).rotateZ(Math.PI / 2), M.rubber(), { parent: root, at: [x + 0.145, 0.05, z] });
    });
    animations.push(clip('open', 3, [rotateTrack(root.getObjectByName('lid_0'), 'x', 3, (t) => -pingPong(t) * 1.6)]));
    topY = 0.9;
  } else if (variant === 'wheelie') {
    // 240 L wheeled bin: tapered body, hinged lid, rear wheels and handle
    const W = 0.58;
    const D = 0.74;
    const H = 1.0;
    const body = lathe([[0.001, 0.06], [0.24, 0.06], [0.3, H - 0.08], [0.001, H - 0.08]], 4);
    body.rotateY(Math.PI / 4);
    body.scale(W / 0.6, 1, D / 0.6);
    mesh(body, paint, { parent: root });
    const k = D / 0.6;
    const topHalf = Math.SQRT1_2 * 0.3 * k; // half depth of the body at the rim
    const botHalfX = Math.SQRT1_2 * 0.24 * (W / 0.6);
    mesh(roundedBox(W * 0.9, 0.06, 0.1, 0.02), paint, { parent: root, at: [0, H - 0.08, -topHalf - 0.03] });
    curveTube([[-W / 2 + 0.06, H - 0.07, -topHalf - 0.09], [W / 2 - 0.06, H - 0.07, -topHalf - 0.09]], 0.02, paint, { parent: root, segments: 2 });
    const lid = group('lid', { parent: root, at: [0, H - 0.065, -topHalf - 0.03] });
    mesh(roundedBox(W * 0.94, 0.05, topHalf * 2 + 0.08, 0.02), paint, { parent: lid, at: [0, 0.035, topHalf + 0.04] });
    mesh(roundedBox(0.2, 0.03, 0.03, 0.01), paint, { parent: lid, at: [0, 0.02, topHalf * 2 + 0.08] });
    mesh(new THREE.CylinderGeometry(0.018, 0.018, botHalfX * 2 + 0.1, 12).rotateZ(Math.PI / 2), M.metal('#555', 0.4), { parent: root, at: [0, 0.1, -0.19] });
    for (const s of [1, -1]) {
      mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 24).rotateZ(Math.PI / 2), M.rubber(), { parent: root, at: [s * (botHalfX + 0.06), 0.1, -0.19] });
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.065, 16).rotateZ(Math.PI / 2), M.plastic('#333'), { parent: root, at: [s * (botHalfX + 0.06), 0.1, -0.19] });
    }
    mesh(roundedBox(botHalfX * 2, 0.06, 0.06, 0.02), paint, { parent: root, at: [0, 0.03, 0.17] });
    const tex = textTexture('#14', { w: 128, h: 96, bg: o.color ?? v.color, fg: '#ffffff', font: 'bold 64px Helvetica, Arial', radius: 0 });
    if (tex) {
      const n = mesh(new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshStandardMaterial({ map: tex }), { parent: root, at: [0, 0.65, Math.SQRT1_2 * (0.24 + (0.06 * 0.59) / (H - 0.14)) * (D / 0.6) + 0.003] });
      n.rotation.x = -Math.atan2(Math.SQRT1_2 * 0.06 * (D / 0.6), H - 0.14);
    }
    animations.push(clip('open', 3, [rotateTrack(lid, 'x', 3, (t) => -pingPong(t) * 1.9)]));
    topY = H + 0.02;
  } else if (variant === 'dog-waste') {
    mesh(pole(0.8, { r: 0.04, base: 0.12, baseH: 0.04, collar: false }), mats.galv(), { parent: root });
    mesh(roundedBox(0.34, 0.42, 0.26, 0.05), paint, { parent: root, at: [0, 0.95, 0.06] });
    mesh(lathe([[0.001, 0], [0.18, 0], [0.18, 0.02], [0.13, 0.07], [0.001, 0.08]], 4).rotateY(Math.PI / 4).scale(1.35, 1, 1.05), paint, { parent: root, at: [0, 1.16, 0.06] });
    mesh(roundedBox(0.2, 0.05, 0.02, 0.015), M.plastic('#111'), { parent: root, at: [0, 1.06, 0.195] });
    const tex = textTexture([['DOG', 'bold 70px Helvetica, Arial'], ['WASTE', 'bold 56px Helvetica, Arial']], { w: 256, h: 220, bg: o.color ?? v.color, fg: '#ffffff', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(0.22, 0.19), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), { parent: root, at: [0, 0.88, 0.1905] });
    // bag dispenser
    mesh(roundedBox(0.14, 0.2, 0.08, 0.02), M.plastic('#e8e8e4'), { parent: root, at: [0, 0.48, 0.07] });
    mesh(roundedBox(0.06, 0.05, 0.004, 0.01), M.plastic('#3a8a3a'), { parent: root, at: [0, 0.4, 0.111] });
    topY = 1.25;
  } else if (variant === 'solar-compactor') {
    const W = 0.66;
    const D = 0.66;
    const H = 1.25;
    mesh(roundedBox(W, H, D, 0.06), paint, { parent: root, at: [0, H / 2, 0] });
    // hopper handle door
    mesh(roundedBox(0.44, 0.22, 0.03, 0.03), M.metal('#a8adb2', 0.35), { parent: root, at: [0, H - 0.3, D / 2 + 0.005] });
    mesh(roundedBox(0.3, 0.035, 0.05, 0.015), M.chrome(), { parent: root, at: [0, H - 0.22, D / 2 + 0.035] });
    // PV panel top
    const pv = new THREE.MeshPhysicalMaterial({ color: '#1a2a4a', roughness: 0.15, metalness: 0.4, clearcoat: 1, name: 'solar-panel' });
    mesh(roundedBox(W - 0.04, 0.03, D - 0.04, 0.01), pv, { parent: root, at: [0, H + 0.01, 0] });
    for (let k = 1; k < 4; k++) mesh(new THREE.PlaneGeometry(0.004, D - 0.08).rotateX(-Math.PI / 2), M.metal('#d8dadc', 0.3), { parent: root, at: [-W / 2 + 0.02 + (k * (W - 0.04)) / 4, H + 0.026, 0] });
    // fill level LED
    const led = lampGroup('fill_led', 'green');
    led.add(root, { at: [W / 2 - 0.12, H - 0.08, D / 2 + 0.003], normal: [0, 0, 1], w: 0.03, h: 0.03, shape: 'round', depth: 0.006 });
    emblem(root, 0.1, [-W / 2 + 0.14, H - 0.08, D / 2]);
    const tex = textTexture([['SOLAR', 'bold 46px Helvetica, Arial'], ['COMPACTOR', 'bold 34px Helvetica, Arial']], { w: 256, h: 128, bg: o.color ?? v.color, fg: '#ffffff', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), { parent: root, at: [0, 0.5, D / 2 + 0.002] });
    animations.push(clip('compacting', 2, lampTracks('fill_led', 2.4, { blink: 2 })));
    topY = H + 0.03;
  } else {
    // wire litter basket on a post
    const steel = mats.powder(o.color ?? v.color);
    mesh(pole(0.55, { r: 0.04, base: 0.12, baseH: 0.04, collar: false }), mats.galv(), { parent: root });
    const R = 0.24;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      curveTube([[Math.cos(a) * R * 0.75, 0.55, Math.sin(a) * R * 0.75], [Math.cos(a) * R, 1.1, Math.sin(a) * R]], 0.006, steel, { parent: root, segments: 2, radialSegments: 5 });
    }
    for (const [y, r] of [[0.55, R * 0.75], [0.83, R * 0.875], [1.1, R]]) mesh(new THREE.TorusGeometry(r, 0.012, 8, 40).rotateX(Math.PI / 2), steel, { parent: root, at: [0, y, 0] });
    mesh(new THREE.CircleGeometry(R * 0.75, 32).rotateX(-Math.PI / 2), steel, { parent: root, at: [0, 0.555, 0] });
    topY = 1.1;
  }
  if (style === 'overflowing') {
    bags(root, rand, [0, topY - 0.12, 0], variant === 'recycling' ? 3 : 2);
    bags(root, rand, [variant === 'recycling' ? 0.1 : 0.55, 0, 0.35], 2);
    litter(root, rand, [0, 0, 0.5]);
  }
  return finish(root, { type: 'trash-can', variant, o, animations, lean: variant !== 'recycling' });
}

/* ------------------------------- Planter ------------------------------- */

export const PLANTER_VARIANTS = {
  box: { color: '#b4afa7' },
  round: { color: '#8c5a3c' },
  wooden: { color: '#7a5434' },
  'tree-pit': { color: '#2b2f33' },
  tiered: { color: '#c9c3b8' },
};

export function createPlanter(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(PLANTER_VARIANTS, o.variant, 'planter');
  const v = PLANTER_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`planter-${variant}`);
  const soil = new THREE.MeshStandardMaterial({ color: '#3b2a1e', roughness: 1, name: 'soil' });
  let beds; // [[x, z, top, size]]
  if (variant === 'box') {
    const W = 1.2;
    const conc = mats.concrete(o.color ?? v.color);
    mesh(roundedBox(W, 0.6, 0.08, 0.02), conc, { parent: root, at: [0, 0.3, W / 2 - 0.04] });
    mesh(roundedBox(W, 0.6, 0.08, 0.02), conc, { parent: root, at: [0, 0.3, -W / 2 + 0.04] });
    mesh(roundedBox(0.08, 0.6, W - 0.16, 0.02), conc, { parent: root, at: [W / 2 - 0.04, 0.3, 0] });
    mesh(roundedBox(0.08, 0.6, W - 0.16, 0.02), conc, { parent: root, at: [-W / 2 + 0.04, 0.3, 0] });
    mesh(new THREE.BoxGeometry(W - 0.16, 0.5, W - 0.16), soil, { parent: root, at: [0, 0.28, 0] });
    beds = [[0, 0, 0.53, 0.62]];
  } else if (variant === 'round') {
    const terracotta = new THREE.MeshStandardMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.85, side: THREE.DoubleSide, name: 'terracotta' });
    mesh(lathe([[0.001, 0], [0.32, 0], [0.42, 0.6], [0.46, 0.62], [0.46, 0.68], [0.43, 0.7], [0.41, 0.66], [0.39, 0.58], [0.001, 0.58]], 48), terracotta, { parent: root });
    mesh(new THREE.CylinderGeometry(0.395, 0.315, 0.54, 40), soil, { parent: root, at: [0, 0.32, 0] });
    beds = [[0, 0, 0.59, 0.55]];
  } else if (variant === 'wooden') {
    const wood = M.wood(o.color ?? v.color);
    const W = 1.4;
    const D = 0.6;
    for (let r = 0; r < 4; r++) {
      const y = 0.06 + r * 0.13;
      mesh(roundedBox(W, 0.12, 0.04, 0.012), wood, { parent: root, at: [0, y, D / 2] });
      mesh(roundedBox(W, 0.12, 0.04, 0.012), wood, { parent: root, at: [0, y, -D / 2] });
      mesh(roundedBox(0.04, 0.12, D - 0.04, 0.012), wood, { parent: root, at: [W / 2 - 0.02, y, 0] });
      mesh(roundedBox(0.04, 0.12, D - 0.04, 0.012), wood, { parent: root, at: [-W / 2 + 0.02, y, 0] });
    }
    for (const x of [W / 2 - 0.02, -W / 2 + 0.02]) for (const z of [D / 2, -D / 2]) mesh(roundedBox(0.07, 0.56, 0.07, 0.012), wood, { parent: root, at: [x, 0.28, z] });
    mesh(new THREE.BoxGeometry(W - 0.08, 0.46, D - 0.06), soil, { parent: root, at: [0, 0.25, 0] });
    beds = [[-0.4, 0, 0.48, 0.5], [0.05, 0.02, 0.48, 0.5], [0.45, -0.02, 0.48, 0.5]];
  } else if (variant === 'tree-pit') {
    // flush cast-iron tree grate with a young street tree and protective guard
    const iron = mats.castIron(o.color ?? v.color);
    const ring = new THREE.Shape();
    ring.moveTo(-0.6, -0.6); ring.lineTo(0.6, -0.6); ring.lineTo(0.6, 0.6); ring.lineTo(-0.6, 0.6); ring.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.22, 0, Math.PI * 2, true);
    ring.holes.push(hole);
    for (let i = 0; i < 12; i++) {
      const sl = new THREE.Path();
      const a = (i / 12) * Math.PI * 2;
      const r0 = 0.3;
      const r1 = 0.52;
      sl.moveTo(Math.cos(a - 0.08) * r0, Math.sin(a - 0.08) * r0);
      sl.lineTo(Math.cos(a - 0.05) * r1, Math.sin(a - 0.05) * r1);
      sl.lineTo(Math.cos(a + 0.05) * r1, Math.sin(a + 0.05) * r1);
      sl.lineTo(Math.cos(a + 0.08) * r0, Math.sin(a + 0.08) * r0);
      sl.closePath();
      ring.holes.push(sl);
    }
    const grate = new THREE.ExtrudeGeometry(ring, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 1, curveSegments: 24 });
    grate.rotateX(-Math.PI / 2);
    mesh(grate, iron, { parent: root, at: [0, 0.005, 0] });
    mesh(new THREE.CircleGeometry(0.22, 24).rotateX(-Math.PI / 2), soil, { parent: root, at: [0, 0.02, 0] });
    // trunk + crown
    const bark = new THREE.MeshStandardMaterial({ color: '#5b4636', roughness: 1, name: 'bark' });
    mesh(lathe([[0.001, 0], [0.07, 0], [0.055, 0.2], [0.045, 2.0], [0.03, 2.6], [0.001, 2.7]], 14), bark, { parent: root });
    const rand = rng(o.seed ?? 4);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + rand();
      curveTube([[0, 1.9 + i * 0.12, 0], [Math.cos(a) * 0.35, 2.35 + rand() * 0.2, Math.sin(a) * 0.35]], 0.022, bark, { parent: root, segments: 2, radialSegments: 6 });
    }
    seat(root, createBush({ variant: 'round', seed: (o.seed ?? 1) + 7, size: 1.5 }), 0, 2.05, 0);
    // steel tree guard
    const guard = mats.powder(o.color ?? v.color);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      curveTube([[Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3], [Math.cos(a) * 0.3, 1.6, Math.sin(a) * 0.3]], 0.012, guard, { parent: root, segments: 2, radialSegments: 6 });
    }
    for (const y of [0.5, 1.0, 1.55]) mesh(new THREE.TorusGeometry(0.3, 0.014, 8, 36).rotateX(Math.PI / 2), guard, { parent: root, at: [0, y, 0] });
    beds = style ? [[0.4, 0.4, 0.03, 0.3], [-0.4, -0.38, 0.03, 0.3]] : [];
  } else {
    // three stepped rings of stone
    const stone = mats.concrete(o.color ?? v.color);
    beds = [];
    [[1.0, 0.35], [0.7, 0.7], [0.4, 1.05]].forEach(([r, h], i) => {
      mesh(lathe([[0.001, 0], [r, 0], [r, h - 0.03], [r - 0.03, h], [r - 0.09, h], [r - 0.09, h - 0.05], [0.001, h - 0.05]], 48), stone, { parent: root });
      mesh(new THREE.RingGeometry(i < 2 ? [0.7, 0.4][i] + 0.01 : 0, r - 0.09, 40).rotateX(-Math.PI / 2), soil, { parent: root, at: [0, h - 0.04, 0] });
      const rr = i < 2 ? (r - 0.09 + [0.7, 0.4][i]) / 2 : 0;
      const n = i < 2 ? 5 - i : 1;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + i;
        beds.push([Math.cos(a) * rr, Math.sin(a) * rr, h - 0.04, 0.32]);
      }
    });
  }
  beds.forEach(([x, z, top, size], i) => {
    const seed = (o.seed ?? 1) + i;
    let p;
    if (style === 'grasses') p = createGrass({ variant: 'fountain', seed, size: size * 1.4 });
    else if (style === 'flowers') p = createFlower({ variant: ['tulip', 'daisy', 'rose', 'sunflower'][i % 4], seed, size });
    else if (style === 'topiary') {
      // clipped boxwood balls stacked into a topiary on a short stem
      p = new THREE.Group();
      const b1 = createBush({ variant: 'boxwood', seed, size: size * 0.9 });
      const b2 = createBush({ variant: 'boxwood', seed: seed + 3, size: size * 0.6 });
      seat(p, b1, 0, 0, 0);
      p.updateMatrixWorld(true);
      const top1 = new THREE.Box3().setFromObject(b1).max.y;
      if (variant !== 'tiered') seat(p, b2, 0, top1 - size * 0.08, 0);
    } else p = createBush({ variant: variant === 'round' ? 'flowering' : variant === 'box' ? 'boxwood' : variant === 'tiered' ? 'flowering' : 'round', seed, size });
    seat(root, p, x, top - 0.02, z);
  });
  return finish(root, { type: 'planter', variant, o, animations: [] });
}

/* ------------------------------- Fountain ------------------------------- */

export const FOUNTAIN_VARIANTS = {
  tiered: { color: '#cfc8bb' },
  basin: { color: '#bdb6aa' },
  wall: { color: '#c9bfa9' },
  'plaza-jets': { color: '#9a9590' },
};

export function createFountain(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(FOUNTAIN_VARIANTS, o.variant, 'fountain');
  const v = FOUNTAIN_VARIANTS[variant];
  const style = styleOf(o);
  const dry = style === 'dry';
  const root = group(`fountain-${variant}`);
  const stone = new THREE.MeshStandardMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.85, name: 'stone', side: THREE.DoubleSide });
  const water = new THREE.MeshPhysicalMaterial({ color: '#4f9cbf', roughness: 0.05, transparent: true, opacity: 0.72, clearcoat: 1, name: 'water' });
  const falling = new THREE.MeshPhysicalMaterial({ color: '#cfeaf5', roughness: 0.1, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false, name: 'falling' });
  const tracks = [];
  const lit = style === 'lit' ? lampGroup('pool_lights', 'white') : null;
  if (lit) lit.lens.emissive.set('#7fd8ff');
  if (variant === 'plaza-jets') {
    // flush granite paving with a grid of ground jets
    // granite setts: 8 × 8 slabs with slight colour variation
    const paving = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, name: 'granite' });
    const slabs = new THREE.InstancedMesh(roundedBox(0.49, 0.04, 0.49, 0.008), paving, 64);
    slabs.name = 'paving';
    const pc = new THREE.Color();
    for (let i = 0; i < 64; i++) {
      slabs.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-1.75 + (i % 8) * 0.5, 0.02, -1.75 + Math.floor(i / 8) * 0.5));
      slabs.setColorAt(i, pc.set(o.color ?? v.color).offsetHSL(0, 0, ((i * 37) % 9) / 90 - 0.05));
    }
    root.add(slabs);
    const wet = new THREE.MeshPhysicalMaterial({ color: '#5a6066', roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.6, name: 'wet' });
    if (!dry) mesh(new THREE.CircleGeometry(1.7, 48).rotateX(-Math.PI / 2), wet, { parent: root, at: [0, 0.041, 0] });
    for (let i = 0; i < 9; i++) {
      const x = ((i % 3) - 1) * 1.1;
      const z = (Math.floor(i / 3) - 1) * 1.1;
      mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.006, 20), M.metal('#a9adb1', 0.3), { parent: root, at: [x, 0.043, z] });
      if (lit) lit.add(root, { at: [x, 0.046, z], normal: [0, 1, 0], w: 0.07, h: 0.07, shape: 'round', depth: 0.004, bezel: false, glowSize: 0.5 });
      if (dry) continue;
      const jet = group(`jet_${i}`, { parent: root, at: [x, 0.04, z] });
      const h = 0.9 + (i % 2) * 0.6;
      mesh(lathe([[0.02, 0], [0.012, h * 0.75], [0.045, h * 0.94], [0.001, h]], 12), falling, { parent: jet });
      const ph = i / 9;
      tracks.push(scaleTrack(jet, 3, (t) => [1, 0.15 + 0.85 * Math.abs(Math.sin((t + ph) * Math.PI)), 1], 36));
    }
  } else if (variant === 'wall') {
    // carved wall panel with a spout mask pouring into a half basin
    const wall = new THREE.Shape();
    wall.moveTo(-0.9, 0); wall.lineTo(0.9, 0); wall.lineTo(0.9, 1.7); wall.absarc(0, 1.7, 0.9, 0, Math.PI, false); wall.lineTo(-0.9, 0);
    const wg = new THREE.ExtrudeGeometry(wall, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 24 });
    wg.translate(0, 0, -0.6);
    mesh(wg, stone, { parent: root });
    const niche = new THREE.Shape();
    niche.moveTo(-0.5, 0.75); niche.lineTo(0.5, 0.75); niche.lineTo(0.5, 1.6); niche.absarc(0, 1.6, 0.5, 0, Math.PI, false); niche.lineTo(-0.5, 0.75);
    mesh(new THREE.ShapeGeometry(niche, 16), new THREE.MeshStandardMaterial({ color: '#8a8070', roughness: 0.9 }), { parent: root, at: [0, 0, -0.268] });
    // mask: domed face with a spout
    mesh(new THREE.SphereGeometry(0.18, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), stone, { parent: root, at: [0, 1.35, -0.27] });
    mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.14, 12).rotateX(Math.PI / 2), M.metal('#9a8f6a', 0.35), { parent: root, at: [0, 1.3, -0.04] });
    // half-round basin
    const basin = new THREE.LatheGeometry([[0.001, 0], [0.75, 0], [0.8, 0.55], [0.7, 0.58], [0.68, 0.12], [0.001, 0.12]].map(([x, y]) => new THREE.Vector2(x, y)), 32, 0, Math.PI);
    basin.rotateY(-Math.PI / 2);
    mesh(basin, stone, { parent: root, at: [0, 0, -0.27] });
    if (!dry) {
      const half = new THREE.CircleGeometry(0.69, 32, 0, Math.PI).rotateX(-Math.PI / 2);
      mesh(half, water, { parent: root, at: [0, 0.48, -0.27] });
      const stream = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10; stream.push([0, 1.3 - t * t * 0.82, 0.03 + t * 0.22]); }
      curveTube(stream, 0.018, falling, { parent: root, segments: 24, radialSegments: 8, name: 'stream' });
      tracks.push(numberTrack('stream.material.opacity', 2, (t) => 0.4 + 0.15 * Math.sin(t * Math.PI * 8), 32));
    }
    if (lit) lit.add(root, { at: [0, 0.2, 0.42], normal: [0, 0.4, -1], w: 0.08, h: 0.08, shape: 'round', depth: 0.01, glowSize: 0.6 });
  } else {
    const R = variant === 'tiered' ? 1.6 : 2.0;
    mesh(lathe([[R - 0.25, 0.08], [R - 0.25, 0.5], [R - 0.2, 0.55], [R + 0.05, 0.56], [R + 0.1, 0.5], [R + 0.08, 0.1], [R + 0.12, 0.04], [R + 0.12, 0], [0.001, 0], [0.001, 0.08]], 64), stone, { parent: root });
    if (!dry) {
      mesh(new THREE.CylinderGeometry(R - 0.25, R - 0.25, 0.36, 64), water, { parent: root, at: [0, 0.26, 0], name: 'pool' });
      for (let k = 0; k < 3; k++) {
        const rip = mesh(new THREE.RingGeometry(0.3, 0.34, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e8f6fb', transparent: true, opacity: 0.5, depthWrite: false }), { parent: root, at: [0, 0.445, 0], name: `ripple_${k}` });
        const ph = k / 3;
        tracks.push(scaleTrack(rip, 3, (t) => { const s = 1 + ((t + ph) % 1) * 3.2; return [s, 1, s]; }, 24));
        tracks.push(numberTrack(`ripple_${k}.material.opacity`, 3, (t) => 0.55 * (1 - ((t + ph) % 1)), 24));
      }
    } else {
      // dry: stained pool floor with leaves
      mesh(new THREE.CircleGeometry(R - 0.25, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#7d8a7a', roughness: 1 }), { parent: root, at: [0, 0.082, 0] });
      const rand = rng(8);
      const leaf = new THREE.MeshStandardMaterial({ color: '#a0662a', roughness: 0.9, side: THREE.DoubleSide });
      for (let i = 0; i < 40; i++) {
        const a = rand() * Math.PI * 2;
        const r = rand() * (R - 0.4);
        mesh(new THREE.CircleGeometry(0.04, 5).rotateX(-Math.PI / 2), leaf, { parent: root, at: [Math.cos(a) * r, 0.085, Math.sin(a) * r] });
      }
    }
    if (variant === 'tiered') {
      mesh(lathe([[0.001, 0.08], [0.28, 0.08], [0.28, 0.44], [0.24, 0.6], [0.16, 0.7], [0.14, 1.2], [0.2, 1.25], [0.001, 1.25]], 40), stone, { parent: root });
      mesh(lathe([[0.001, 1.22], [0.25, 1.22], [0.7, 1.42], [0.82, 1.5], [0.8, 1.56], [0.7, 1.5], [0.001, 1.45]], 48), stone, { parent: root });
      if (!dry) mesh(new THREE.CircleGeometry(0.72, 48).rotateX(-Math.PI / 2), water, { parent: root, at: [0, 1.5, 0] });
      mesh(lathe([[0.001, 1.45], [0.08, 1.45], [0.06, 1.9], [0.1, 1.95], [0.04, 2.02], [0.001, 2.04]], 24), stone, { parent: root });
      if (!dry) {
        mesh(lathe([[0.82, 1.52], [0.86, 1.4], [0.92, 1.0], [0.96, 0.44]], 48), falling, { parent: root, name: 'sheet' });
        tracks.push(numberTrack('sheet.material.opacity', 3, (t) => 0.4 + 0.12 * Math.sin(t * Math.PI * 10), 60));
      }
    }
    if (!dry) {
      const jetY = variant === 'tiered' ? 2.02 : 0.44;
      const jetH = variant === 'tiered' ? 0.5 : 1.4;
      const jet = group('jet', { parent: root, at: [0, jetY, 0] });
      mesh(lathe([[0.03, 0], [0.012, jetH * 0.7], [0.05, jetH * 0.92], [0.001, jetH]], 16), falling, { parent: jet });
      tracks.push(scaleTrack(jet, 3, (t) => [1, 0.9 + 0.15 * Math.sin(t * Math.PI * 6), 1], 48));
    }
    if (variant === 'basin') {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        mesh(lathe([[0.001, 0], [0.05, 0], [0.04, 0.08], [0.001, 0.09]], 12), M.metal('#9a8f6a', 0.35), { parent: root, at: [Math.cos(a) * (R - 0.3), dry ? 0.08 : 0.44, Math.sin(a) * (R - 0.3)] });
        if (dry) continue;
        const arc = [];
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          arc.push([Math.cos(a) * (R - 0.3) * (1 - t * 0.7), 0.5 + Math.sin(t * Math.PI) * 0.7, Math.sin(a) * (R - 0.3) * (1 - t * 0.7)]);
        }
        curveTube(arc, 0.018, falling, { parent: root, segments: 30, radialSegments: 6 });
      }
    }
    if (lit) for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      lit.add(root, { at: [Math.cos(a) * (R - 0.26), 0.3, Math.sin(a) * (R - 0.26)], normal: [-Math.cos(a), 0.6, -Math.sin(a)], w: 0.08, h: 0.08, shape: 'round', depth: 0.01, glowSize: 0.42 });
    }
  }
  const animations = tracks.length ? [clip('water', 3, tracks)] : [];
  if (lit) animations.push(clip('lights', 1, lampTracks('pool_lights', 3)));
  return finish(root, { type: 'fountain', variant, o, animations, lean: false });
}

/* ------------------------------ Bike rack ------------------------------ */

export const BIKE_RACK_VARIANTS = {
  hoop: { color: '#a3a8ad' },
  wave: { color: '#2b5f9e' },
  wall: { color: '#3a3f44' },
  dock: { color: '#1f6f8b' },
};

export function createBikeRack(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BIKE_RACK_VARIANTS, o.variant, 'bike-rack');
  const v = BIKE_RACK_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`bike-rack-${variant}`);
  const m = variant === 'hoop' ? mats.steel() : mats.powder(o.color ?? v.color);
  let span = 3;
  const animations = [];
  if (variant === 'hoop') {
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 0.75;
      curveTube([[x, 0, -0.3], [x, 0.7, -0.3], [x, 0.84, -0.2], [x, 0.86, 0], [x, 0.84, 0.2], [x, 0.7, 0.3], [x, 0, 0.3]], 0.03, m, { parent: root, segments: 64, radialSegments: 14 });
      for (const z of [0.3, -0.3]) mesh(lathe([[0.001, 0], [0.06, 0], [0.06, 0.01], [0.035, 0.02], [0.001, 0.02]], 16), m, { parent: root, at: [x, 0, z] });
    }
  } else if (variant === 'wave') {
    const pts = [[-1.5, 0, 0]];
    const n = 5;
    for (let i = 0; i <= n * 16; i++) {
      const t = i / (n * 16);
      pts.push([-1.5 + t * 3, 0.08 + 0.75 * Math.abs(Math.sin(t * n * Math.PI)), 0]);
    }
    pts.push([1.5, 0, 0]);
    curveTube(pts, 0.03, m, { parent: root, segments: 220, radialSegments: 12 });
  } else if (variant === 'wall') {
    // free-standing frame with wheel hooks (like a wall rail, on its own posts)
    mesh(roundedBox(2.2, 0.06, 0.05, 0.015), m, { parent: root, at: [0, 1.6, -0.3] });
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 0.5;
      curveTube([[x, 1.6, -0.28], [x, 1.62, -0.1], [x, 1.7, 0.05], [x, 1.78, 0.08]], 0.012, M.chrome(), { parent: root, radialSegments: 8 });
      // wheel trough at the bottom
      mesh(roundedBox(0.08, 0.03, 0.4, 0.01), m, { parent: root, at: [x, 0.015, -0.12] });
    }
    for (const x of [-1.05, 1.05]) mesh(pole(1.63, { r: 0.035, top: 0.035, base: 0.09, baseH: 0.03, collar: false }), m, { parent: root, at: [x, 0, -0.3] });
    span = 2.2;
  } else {
    // bike-share docking station: payment terminal + docking points
    const term = group('terminal', { parent: root, at: [-1.7, 0, 0] });
    mesh(roundedBox(0.4, 1.7, 0.3, 0.06), m, { parent: term, at: [0, 0.85, 0] });
    const screen = lampGroup('screen', 'white');
    screen.lens.emissive.set('#9fd8ff');
    screen.add(term, { at: [0, 1.35, 0.151], normal: [0, 0, 1], w: 0.26, h: 0.18, depth: 0.006, bezel: false });
    mesh(roundedBox(0.14, 0.1, 0.03, 0.02), M.plastic('#111'), { parent: term, at: [0, 1.1, 0.16] });
    const tex = textTexture([['CITY', 'bold 60px Helvetica, Arial'], ['BIKES', 'bold 60px Helvetica, Arial']], { w: 256, h: 200, bg: o.color ?? v.color, fg: '#ffffff', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(0.3, 0.24), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), { parent: term, at: [0, 0.65, 0.151] });
    emblem(term, 0.1, [0, 1.58, 0.15]);
    const led = lampGroup('dock_led', 'green');
    mesh(roundedBox(3.2, 0.06, 0.24, 0.02), M.metal('#9aa0a6', 0.4), { parent: root, at: [0, 0.03, 0] });
    for (let i = 0; i < 6; i++) {
      const x = -1.25 + i * 0.5;
      const d = group(null, { parent: root, at: [x, 0, 0] });
      const prof = [[-0.06, 0.06], [0.06, 0.06], [0.07, 0.75], [0.02, 0.85], [-0.07, 0.8]];
      const g = extrudeOutline(prof, 0.14, { bevel: 0.02 });
      g.rotateY(Math.PI / 2);
      mesh(g, m, { parent: d });
      led.add(d, { at: [0, 0.7, 0.088], normal: [0, 0, 1], w: 0.025, h: 0.025, shape: 'round', depth: 0.005 });
    }
    animations.push(clip('lights', 1, [...lampTracks('dock_led', 2.4), ...lampTracks('screen', 3)]));
    span = 3.6;
  }
  if (style === 'covered') {
    // cantilevered shelter roof over the rack
    const frame = mats.powder('#3a3f44');
    const back = variant === 'wall' ? -0.45 : -0.8;
    for (const x of [-span / 2, span / 2]) {
      mesh(pole(2.3, { r: 0.05, top: 0.05, base: 0.12, baseH: 0.04, collar: false }), frame, { parent: root, at: [x, 0, back] });
      curveTube([[x, 2.28, back], [x, 2.4, back + 0.4], [x, 2.35, back + 1.6]], 0.04, frame, { parent: root, radialSegments: 10 });
    }
    mesh(curvedRoof(span + 0.3, 1.7, 0.12), new THREE.MeshPhysicalMaterial({ color: '#cfe3ee', transparent: true, opacity: 0.45, roughness: 0.1, side: THREE.DoubleSide, name: 'polycarbonate' }), { parent: root, at: [0, 2.34, back + 0.8] });
    mesh(roundedBox(span + 0.3, 0.06, 0.06, 0.02), frame, { parent: root, at: [0, 2.39, back + 0.4] });
  }
  return finish(root, { type: 'bike-rack', variant, o, animations, lean: variant === 'wave' || variant === 'dock' });
}

/* ---------------------------- Picnic table ---------------------------- */

export const PICNIC_TABLE_VARIANTS = {
  classic: { wood: '#9a6b3f' },
  modern: { wood: '#a5764a', frame: '#2b3034' },
  accessible: { wood: '#8a5a33' },
  round: { wood: '#9c6a3c', frame: '#3a3f44' },
};

export function createPicnicTable(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(PICNIC_TABLE_VARIANTS, o.variant, 'picnic-table');
  const v = PICNIC_TABLE_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`picnic-table-${variant}`);
  const wood = M.wood(o.wood ?? v.wood);
  const frame = mats.powder(o.color ?? v.frame ?? '#2b3034');
  const L = variant === 'accessible' ? 2.4 : 1.8;
  let tableTop = 0.76;
  if (variant === 'classic' || variant === 'accessible') {
    // A-frame timber legs carrying top and bench boards
    for (let i = 0; i < 5; i++) mesh(roundedBox(L, 0.04, 0.14, 0.012), wood, { parent: root, at: [0, 0.74, -0.31 + i * 0.155] });
    const benchLen = variant === 'accessible' ? L - 0.7 : L;
    const bx = variant === 'accessible' ? -0.35 : 0;
    for (const s of [1, -1]) for (let i = 0; i < 2; i++) mesh(roundedBox(benchLen, 0.04, 0.13, 0.012), wood, { parent: root, at: [bx, 0.44, s * (0.6 + i * 0.14)] });
    for (const x of [L / 2 - 0.3, -L / 2 + 0.3]) {
      for (const s of [1, -1]) {
        const leg = mesh(roundedBox(0.06, 0.86, 0.1, 0.012), wood, { parent: root });
        leg.position.set(x, 0.4, s * 0.38);
        leg.rotation.x = -s * 0.5;
      }
      mesh(roundedBox(0.06, 0.1, 1.68, 0.012), wood, { parent: root, at: [x, 0.37, 0] });
      mesh(roundedBox(0.06, 0.08, 0.84, 0.012), wood, { parent: root, at: [x, 0.68, 0] });
    }
    tableTop = 0.76;
  } else if (variant === 'modern') {
    for (let i = 0; i < 4; i++) mesh(roundedBox(L, 0.035, 0.18, 0.01), wood, { parent: root, at: [0, 0.745, -0.28 + i * 0.187] });
    for (const s of [1, -1]) for (let i = 0; i < 2; i++) mesh(roundedBox(L, 0.035, 0.14, 0.01), wood, { parent: root, at: [0, 0.445, s * (0.6 + i * 0.15)] });
    for (const x of [L / 2 - 0.25, -L / 2 + 0.25]) {
      // welded steel end frame: bench beam, table beam, two posts and splayed legs
      mesh(roundedBox(0.05, 0.05, 1.86, 0.015), frame, { parent: root, at: [x, 0.403, 0] });
      mesh(roundedBox(0.05, 0.05, 0.78, 0.015), frame, { parent: root, at: [x, 0.703, 0] });
      for (const s2 of [1, -1]) {
        tube([x, 0.41, s2 * 0.3], [x, 0.7, s2 * 0.3], 0.022, frame, { parent: root });
        tube([x, 0.39, s2 * 0.22], [x, 0.012, s2 * 0.62], 0.025, frame, { parent: root });
        mesh(lathe([[0.001, 0], [0.045, 0], [0.045, 0.012], [0.001, 0.012]], 16), M.rubber(), { parent: root, at: [x, 0, s2 * 0.63] });
      }
    }
    tableTop = 0.76;
  } else {
    // round table with a ring bench, central pedestal
    mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 40), wood, { parent: root, at: [0, 0.74, 0] });
    mesh(lathe([[0.001, 0], [0.32, 0], [0.32, 0.03], [0.07, 0.08], [0.06, 0.72], [0.15, 0.72], [0.001, 0.73]], 32), frame, { parent: root });
    const ring = new THREE.RingGeometry(0.8, 1.12, 48, 1);
    ring.rotateX(-Math.PI / 2);
    const bench = new THREE.ExtrudeGeometry(new THREE.Shape().absarc(0, 0, 1.12, 0, Math.PI * 2, false), { depth: 0.04, bevelEnabled: false, curveSegments: 48 });
    bench.rotateX(-Math.PI / 2);
    void ring;
    const shape = new THREE.Shape().absarc(0, 0, 1.12, 0, Math.PI * 2, false);
    shape.holes.push(new THREE.Path().absarc(0, 0, 0.8, 0, Math.PI * 2, true));
    const bg = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, curveSegments: 48 });
    bg.rotateX(-Math.PI / 2);
    mesh(bg, wood, { parent: root, at: [0, 0.42, 0] });
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      mesh(roundedBox(0.05, 0.42, 0.05, 0.015), frame, { parent: root, at: [Math.cos(a) * 0.96, 0.21, Math.sin(a) * 0.96] });
      const arm = mesh(roundedBox(0.98, 0.04, 0.04, 0.012), frame, { parent: root });
      arm.position.set(Math.cos(a) * 0.49, 0.4, Math.sin(a) * 0.49);
      arm.rotation.y = -a;
    }
    void bench;
    tableTop = 0.76;
  }
  if (style === 'umbrella') {
    const poleM = mats.powder('#e8e8e4');
    // pole from a ground socket up to the canopy apex
    mesh(new THREE.CylinderGeometry(0.022, 0.022, tableTop + 1.75, 12), poleM, { parent: root, at: [0, (tableTop + 1.75) / 2, 0] });
    mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 16), poleM, { parent: root, at: [0, 0.02, 0] });
    const can = new THREE.ConeGeometry(1.25, 0.4, 8, 1, true);
    mesh(can, new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.8, side: THREE.DoubleSide, name: 'canvas' }), { parent: root, at: [0, tableTop + 1.55, 0] });
    mesh(new THREE.SphereGeometry(0.04, 12, 8), poleM, { parent: root, at: [0, tableTop + 1.76, 0] });
  }
  if (style === 'barbecue') {
    // fixed park grill on a steel post beside the table
    const steel = M.metal('#3a3a3a', 0.5);
    const x = (variant === 'round' ? 1.6 : L / 2 + 0.7);
    mesh(pole(0.8, { r: 0.05, base: 0.15, baseH: 0.04, collar: false }), steel, { parent: root, at: [x, 0, 0] });
    mesh(roundedBox(0.6, 0.18, 0.42, 0.03), steel, { parent: root, at: [x, 0.89, 0] });
    for (let k = 0; k < 9; k++) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 6).rotateX(Math.PI / 2), M.chrome(), { parent: root, at: [x - 0.24 + k * 0.06, 0.985, 0] });
  }
  return finish(root, { type: 'picnic-table', variant, o, animations: [] });
}

/* -------------------------- Drinking fountain -------------------------- */

export const DRINKING_FOUNTAIN_VARIANTS = {
  pedestal: { color: '#3a5a4a' },
  'bottle-filler': { color: '#b9bdc1' },
  stone: { color: '#b4afa7' },
};

export function createDrinkingFountain(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(DRINKING_FOUNTAIN_VARIANTS, o.variant, 'drinking-fountain');
  const v = DRINKING_FOUNTAIN_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`drinking-fountain-${variant}`);
  const steel = M.metal('#c5c9cc', 0.25);
  const water = new THREE.MeshPhysicalMaterial({ color: '#cfeaf5', roughness: 0.05, transparent: true, opacity: 0.6, name: 'water' });
  const tracks = [];
  if (variant === 'pedestal') {
    const paint = mats.castIron(o.color ?? v.color);
    mesh(lathe([[0.001, 0], [0.22, 0], [0.22, 0.05], [0.16, 0.1], [0.12, 0.2], [0.1, 0.8], [0.14, 0.86], [0.001, 0.87]], 32), paint, { parent: root });
    mesh(lathe([[0.001, 0.86], [0.12, 0.86], [0.24, 0.92], [0.26, 0.96], [0.23, 0.96], [0.12, 0.9], [0.001, 0.9]], 32), steel, { parent: root });
    mesh(lathe([[0.001, 0], [0.025, 0], [0.02, 0.06], [0.012, 0.08], [0.001, 0.085]], 12), steel, { parent: root, at: [0.05, 0.9, 0] });
    mesh(roundedBox(0.06, 0.04, 0.05, 0.015), steel, { parent: root, at: [0.18, 0.84, 0] });
    const arc = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; arc.push([0.05 - t * 0.1, 0.98 + Math.sin(t * Math.PI) * 0.06, 0]); }
    curveTube(arc, 0.006, water, { parent: root, segments: 16, radialSegments: 6, name: 'jet' });
    if (style === 'dog-bowl') {
      mesh(pole(0.2, { r: 0.04, base: 0.12, baseH: 0.03, collar: false }), paint, { parent: root, at: [0, 0, 0.35] });
      mesh(lathe([[0.001, 0.2], [0.14, 0.2], [0.16, 0.28], [0.14, 0.28], [0.12, 0.23], [0.001, 0.23]], 24), steel, { parent: root, at: [0, 0, 0.35] });
      mesh(roundedBox(0.04, 0.04, 0.35, 0.012), paint, { parent: root, at: [0, 0.12, 0.17] });
    }
  } else if (variant === 'bottle-filler') {
    mesh(roundedBox(0.42, 1.25, 0.3, 0.05), steel, { parent: root, at: [0, 0.625, 0] });
    mesh(roundedBox(0.3, 0.4, 0.06, 0.04), M.plastic('#111', 0.3), { parent: root, at: [0, 1.0, 0.13] });
    mesh(roundedBox(0.32, 0.03, 0.12, 0.012), steel, { parent: root, at: [0, 0.8, 0.18] });
    const screen = lampGroup('counter', 'green');
    const tex = textTexture('1,284', { w: 256, h: 96, bg: '#000', fg: '#3dff8a', font: 'bold 64px "Courier New", monospace', radius: 0 });
    if (tex) { screen.lens.map = tex; screen.lens.emissiveMap = tex; }
    screen.add(root, { geometry: new THREE.PlaneGeometry(0.18, 0.06).translate(0, 1.15, 0.165), normal: [0, 0, 1], depth: 0.005 });
    mesh(lathe([[0.001, 0.0], [0.24, 0.0], [0.3, 0.06], [0.28, 0.08], [0.22, 0.04], [0.001, 0.04]], 32), steel, { parent: root, at: [0.3, 0.75, 0.05] });
    mesh(roundedBox(0.16, 0.06, 0.1, 0.02), steel, { parent: root, at: [0.23, 0.82, 0.05] });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.18, 6), water, { parent: root, at: [0, 1.06, 0.16], name: 'jet' });
    tracks.push(...lampTracks('counter', 3));
    emblem(root, 0.08, [0, 0.4, 0.15]);
  } else {
    // carved stone fountain block with lion-head spout and step
    const st = mats.concrete(o.color ?? v.color);
    mesh(roundedBox(0.7, 0.12, 0.5, 0.03), st, { parent: root, at: [0, 0.06, 0.1] });
    mesh(roundedBox(0.45, 1.0, 0.35, 0.05), st, { parent: root, at: [0, 0.6, 0] });
    mesh(lathe([[0.001, 0], [0.16, 0], [0.18, 0.12], [0.16, 0.12], [0.14, 0.03], [0.001, 0.03]], 24), st, { parent: root, at: [0, 0.6, 0.27] });
    mesh(new THREE.SphereGeometry(0.09, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), st, { parent: root, at: [0, 0.95, 0.175] });
    mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.08, 10).rotateX(Math.PI / 2), M.metal('#9a8f6a', 0.35), { parent: root, at: [0, 0.92, 0.29] });
    const stream = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; stream.push([0, 0.92 - t * t * 0.18, 0.33 + t * 0.03]); }
    curveTube(stream, 0.006, water, { parent: root, segments: 12, radialSegments: 6, name: 'jet' });
    if (style === 'dog-bowl') mesh(lathe([[0.001, 0.12], [0.13, 0.12], [0.15, 0.2], [0.13, 0.2], [0.11, 0.15], [0.001, 0.15]], 24), st, { parent: root, at: [0.25, 0, 0.25] });
  }
  tracks.push(numberTrack('jet.material.opacity', 1, (t) => 0.5 + 0.15 * Math.sin(t * Math.PI * 6), 12));
  return finish(root, { type: 'drinking-fountain', variant, o, animations: [clip('water', 1, tracks)] });
}
