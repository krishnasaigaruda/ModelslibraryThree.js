// Education: molecule models, skeleton models, globes, periodic-table boards, chalkboards,
// magnifiers, compasses and weather stations.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, cushion, setup, done, fin, body, frameMat, darkMat, glassMat, lamp, glowStrip, slab, rodY, rodX, rodZ, bar, labelPlane, panel, emblem, foot, canvasTex } from './common.js';
import { clip, spinTrack, rotateTrack, moveTrack, pingPong, wave } from '../../core/animation.js';

/* ================================ MOLECULES ================================ */

export const MOLECULE_TRIMS = {
  'space-filling': { fill: true },
  wireframe: { wire: true },
  wooden: { wood: true },
  glass: { glass: true },
  neon: { neon: true },
  'school-kit': { kids: true },
};
const CPK = { H: '#f4f4f2', O: '#e5302a', C: '#2a2d33', N: '#2f5fe0', P: '#f08a1a' };
const RAD = { H: 0.025, O: 0.04, C: 0.04, N: 0.04, P: 0.045 };
const VDW = { H: 0.06, O: 0.076, C: 0.085, N: 0.08, P: 0.09 };
function molecule(kind) {
  const t = 109.47 * Math.PI / 180;
  const tet = [[0, 1, 0], [Math.sin(t), Math.cos(t), 0], [Math.sin(t) * Math.cos(2.094), Math.cos(t), Math.sin(t) * Math.sin(2.094)], [Math.sin(t) * Math.cos(4.189), Math.cos(t), Math.sin(t) * Math.sin(4.189)]];
  const L = 0.12;
  const at = [], bonds = [];
  const add = (e, p) => (at.push({ e, p }), at.length - 1);
  if (kind === 'water') { const o = add('O', [0, 0, 0]); for (const a of [-0.912, 0.912]) bonds.push([o, add('H', [Math.sin(a) * L, -Math.cos(a) * L, 0]), 1]); }
  else if (kind === 'co2') { const c = add('C', [0, 0, 0]); for (const s of [-1, 1]) bonds.push([c, add('O', [s * L * 1.1, 0, 0]), 2]); }
  else if (kind === 'methane' || kind === 'ammonia') { const c = add(kind === 'methane' ? 'C' : 'N', [0, 0, 0]); tet.slice(kind === 'methane' ? 0 : 1).forEach((d) => bonds.push([c, add('H', d.map((v) => v * L)), 1])); }
  else if (kind === 'ethanol') {
    const c1 = add('C', [-0.07, 0, 0]), c2 = add('C', [0.07, 0.04, 0]), o = add('O', [0.17, -0.04, 0]);
    bonds.push([c1, c2, 1], [c2, o, 1], [o, add('H', [0.25, 0.0, 0]), 1]);
    for (const d of [[-0.06, -0.08, 0.05], [-0.06, -0.08, -0.05], [-0.1, 0.09, 0]]) bonds.push([c1, add('H', [-0.07 + d[0], d[1], d[2]]), 1]);
    for (const z of [-0.08, 0.08]) bonds.push([c2, add('H', [0.08, 0.12, z]), 1]);
  } else if (kind === 'benzene') {
    const cs = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; cs.push(add('C', [Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0])); bonds.push([cs[i], add('H', [Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0]), 1]); }
    for (let i = 0; i < 6; i++) bonds.push([cs[i], cs[(i + 1) % 6], i % 2 ? 1 : 2]);
  }
  return { at, bonds };
}

export const MOLECULE_VARIANTS = { water: {}, co2: {}, methane: {}, ammonia: {}, ethanol: {}, benzene: {}, 'dna-helix': {} };

export function createEduMolecule(options = {}) {
  const { o, variant, T } = setup(options, MOLECULE_VARIANTS, 'edu-molecule', {}, MOLECULE_TRIMS);
  const root = group(`edu-molecule-${variant}`);
  const colOf = (e) => T.wood ? ({ H: '#e8d2a6', O: '#a0522d', C: '#3d2a1c', N: '#7a5a3a', P: '#c08a55' })[e] : T.neon ? ({ H: '#ffffff', O: '#ff2bd6', C: '#22e1ff', N: '#7dff6a', P: '#ffb02a' })[e] : T.kids ? ({ H: '#ffffff', O: '#ff4d6d', C: '#2b7de1', N: '#43a047', P: '#ffc81e' })[e] : CPK[e];
  const atomMat = (e) => T.glass ? new THREE.MeshPhysicalMaterial({ name: 'glass-atom', color: colOf(e) === '#2a2d33' ? '#556070' : colOf(e), roughness: 0.05, transmission: 0.7, thickness: 0.05, transparent: true, opacity: 0.75, clearcoat: 1 }) : T.wood ? M.wood(colOf(e)) : T.neon ? M.emissive(colOf(e), 0.5) : fin(T, colOf(e), T.kids ? 'plastic' : 'gloss');
  const bondMat = T.wood ? M.wood('#d9b98a') : T.neon ? M.emissive('#9aa0ff', 0.6) : T.wire ? M.chrome() : M.plastic('#c9ccd2', 0.35);
  // stand: base + rod
  const base = T.wood ? M.wood('walnut') : T.neon ? fin(T, '#16191f', 'carbon') : T.kids ? M.plastic('#ffc81e', 0.4) : fin(T, '#2a2d33', 'gloss');
  mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.025, 40), base, { parent: root, at: [0, 0.0125, 0] });
  const anims = [];
  if (variant === 'dna-helix') {
    const h = 0.6, R = 0.08, turns = 1.5, n = 20;
    rodY(0.025, 0.04 + h + 0.02, 0.006, M.chrome(), root);
    const hx = group('helix', { parent: root, at: [0, 0.05, 0] });
    const pts = [[], []];
    for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * turns * Math.PI * 2; pts[0].push([Math.cos(a) * R, t * h, Math.sin(a) * R]); pts[1].push([Math.cos(a + Math.PI) * R, t * h, Math.sin(a + Math.PI) * R]); }
    for (const p of pts) curveTube(p, 0.009, T.neon ? M.emissive('#22e1ff', 0.5) : T.wood ? M.wood('#6b4426') : fin(T, T.kids ? '#2b7de1' : '#c9ccd2', 'gloss'), { parent: hx, segments: 120 });
    const pairs = [['#e5302a', '#2f5fe0'], ['#f2b705', '#2fbf4a']];
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, a = t * turns * Math.PI * 2, y = t * h;
      const [c1, c2] = pairs[i % 2];
      const A = [Math.cos(a) * R, y, Math.sin(a) * R], B = [-A[0], y, -A[2]];
      bar(A, [0, y, 0], 0.006, T.wood ? M.wood('#d9b98a') : fin(T, T.neon ? '#ff2bd6' : c1, T.neon ? 'gloss' : 'plastic'), hx);
      bar([0, y, 0], B, 0.006, T.wood ? M.wood('#a0784c') : fin(T, T.neon ? '#7dff6a' : c2, T.neon ? 'gloss' : 'plastic'), hx);
      if (T.fill) for (const P of [A, B]) mesh(new THREE.SphereGeometry(0.02, 14, 10), atomMat(i % 2 ? 'O' : 'N'), { parent: hx, at: P });
    }
    // rod passes through the helix axis: the base pairs cross it
    anims.push(clip('spin', 8, [spinTrack(hx, 'y', 8)]));
    return done(root, T, variant, o, anims);
  }
  const { at, bonds } = molecule(variant);
  const cy = 0.32;
  const mol = group('molecule', { parent: root, at: [0, cy, 0] });
  // support rod up to the central atom
  rodY(0.025 - cy, at[0].p[1] - RAD[at[0].e] * 0.5, 0.005, T.wood ? M.wood('#6b4426') : M.chrome(), mol, { x: at[0].p[0], z: at[0].p[2] });
  const sc = T.kids ? 1.25 : 1;
  for (const a of at) mesh(new THREE.SphereGeometry((T.fill ? VDW[a.e] : T.wire ? RAD[a.e] * 0.35 : RAD[a.e]) * sc, 28, 20), atomMat(a.e), { parent: mol, at: a.p });
  if (!T.fill) for (const [i, j, order] of bonds) {
    const A = new THREE.Vector3(...at[i].p), B = new THREE.Vector3(...at[j].p);
    const off = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(0.012);
    if (off.lengthSq() < 1e-6) off.set(0, 0.012, 0);
    const ks = order === 2 ? [-1, 1] : [0];
    for (const k of ks) bar(A.clone().addScaledVector(off, k).toArray(), B.clone().addScaledVector(off, k).toArray(), T.wire ? 0.003 : 0.008 * sc, bondMat, mol);
  }
  const lb = labelPlane(0.12, 0.025, (c, w, h) => { c.fillStyle = T.wood ? '#d6b45a' : '#f4f4f2'; c.fillRect(0, 0, w, h); c.fillStyle = '#16171a'; c.font = `bold ${h * 0.7}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText({ water: 'H₂O', co2: 'CO₂', methane: 'CH₄', ammonia: 'NH₃', ethanol: 'C₂H₅OH', benzene: 'C₆H₆' }[variant], w / 2, h / 2); }, { bg: '#f4f4f2' });
  lb.position.set(0, 0.0125, 0.1055); root.add(lb);
  if (T.neon) lamp(T, root, 'blue', { at: [0, 0.0255, 0.06], normal: [0, 1, 0], w: 0.02, h: 0.02, shape: 'round' });
  anims.push(clip('spin', 8, [spinTrack(mol, 'y', 8)]));
  return done(root, T, variant, o, anims);
}

/* ================================ SKELETON ================================ */

export const SKELETON_TRIMS = { ivory: { bone: '#e9dcc0' }, 'painted-muscles': { bone: '#efe6d4', muscles: true }, 'glow-in-dark': { bone: '#c8ffb0', glow: true }, bronze: { bone: '#a8673a', metal: true }, school: { bone: '#f6f2e8', kids: true }, labelled: { bone: '#f2ebdc', labels: true } };
export const SKELETON_VARIANTS = { 'full-stand': {}, skull: {}, spine: {}, arm: {}, 'desk-mini': {} };

function bone(parent, a, b, r, mat) {
  bar(a, b, r, mat, parent);
  for (const p of [a, b]) mesh(new THREE.SphereGeometry(r * 1.6, 12, 8), mat, { parent, at: p });
}
function skull(parent, at, s, mat, dark) {
  const g = group('skull', { parent, at });
  mesh(new THREE.SphereGeometry(0.075 * s, 28, 20).scale(0.85, 0.95, 1.05), mat, { parent: g, at: [0, 0.03 * s, -0.005 * s] });
  mesh(roundedBox(0.09 * s, 0.07 * s, 0.09 * s, 0.03 * s), mat, { parent: g, at: [0, -0.03 * s, 0.025 * s] });
  for (const x of [-1, 1]) mesh(new THREE.SphereGeometry(0.017 * s, 14, 10), dark, { parent: g, at: [x * 0.026 * s, 0.0, 0.066 * s] });
  mesh(new THREE.ConeGeometry(0.01 * s, 0.02 * s, 3), dark, { parent: g, at: [0, -0.025 * s, 0.07 * s], rot: [Math.PI, 0, 0] });
  const jaw = group('jaw', { parent: g, at: [0, -0.06 * s, 0.0] });
  mesh(new THREE.TorusGeometry(0.035 * s, 0.012 * s, 8, 20, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI), mat, { parent: jaw, at: [0, -0.005 * s, 0.03 * s] });
  slab(jaw, M.matte('#f6f2e8'), 0.05 * s, 0.01 * s, 0.01 * s, { y: 0.0, z: 0.06 * s, r: 0.002 * s });
  return g;
}
function spineCol(parent, y0, y1, s, mat) {
  const n = 18;
  for (let i = 0; i < n; i++) { const t = i / (n - 1), y = y0 + (y1 - y0) * t, z = -0.02 * s * Math.sin(t * Math.PI * 2); mesh(new THREE.CylinderGeometry(0.018 * s * (1.2 - t * 0.5), 0.02 * s * (1.2 - t * 0.5), (y1 - y0) / n * 0.75, 12), mat, { parent, at: [0, y, z] }); mesh(roundedBox(0.012 * s, 0.012 * s, 0.025 * s, 0.004 * s), mat, { parent, at: [0, y, z - 0.025 * s] }); }
  curveTube(Array.from({ length: 9 }, (_, i) => { const t = i / 8; return [0, y0 + (y1 - y0) * t, -0.02 * s * Math.sin(t * Math.PI * 2)]; }), 0.01 * s, mat, { parent });
}

export function createEduSkeleton(options = {}) {
  const { o, variant, T } = setup(options, SKELETON_VARIANTS, 'edu-skeleton', { bone: '#efe6d4' }, SKELETON_TRIMS);
  const root = group(`edu-skeleton-${variant}`);
  const bm = T.metal ? M.metal(T.bone, 0.35) : T.glow ? M.emissive(T.bone, 0.35) : new THREE.MeshPhysicalMaterial({ name: 'bone', color: T.bone, roughness: 0.55, clearcoat: 0.2 });
  const dark = M.matte('#2a2420');
  const st = T.kids ? M.plastic('#2b7de1', 0.4) : fin(T, '#2a2d33', 'gloss');
  const anims = [];
  if (variant === 'skull') {
    mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.03, 32), st, { parent: root, at: [0, 0.015, 0] });
    rodY(0.03, 0.09, 0.012, M.chrome(), root);
    const sk = skull(root, [0, 0.18, 0], 1.3, bm, dark);
    anims.push(clip('chatter', 1, [rotateTrack(sk.getObjectByName('jaw'), 'x', 1, (t) => 0.15 * pingPong(t))]));
  } else if (variant === 'spine') {
    slab(root, st, 0.22, 0.03, 0.16, { r: 0.008 });
    rodY(0.03, 0.85, 0.006, M.chrome(), root, { z: -0.06 });
    // pelvis + column + skull top
    mesh(new THREE.TorusGeometry(0.06, 0.025, 10, 24).scale(1.4, 1, 1), bm, { parent: root, at: [0, 0.09, -0.02], rot: [Math.PI / 2 - 0.3, 0, 0] });
    spineCol(root, 0.1, 0.78, 1, bm);
    for (const y of [0.4, 0.6]) bar([0, y, -0.06], [0, y, -0.03], 0.004, M.chrome(), root);
  } else if (variant === 'arm') {
    slab(root, st, 0.5, 0.025, 0.14, { r: 0.008 });
    const y = 0.07;
    for (const x of [-0.18, 0.15]) rodY(0.025, y, 0.006, M.chrome(), root, { x });
    bone(root, [-0.22, y, 0], [0.0, y + 0.01, 0], 0.012, bm);
    bone(root, [0.0, y + 0.01, 0.012], [0.2, y, 0.012], 0.008, bm);
    bone(root, [0.0, y + 0.01, -0.012], [0.2, y, -0.008], 0.007, bm);
    for (let f = 0; f < 5; f++) { const z = -0.024 + f * 0.012; bone(root, [0.2, y, z * 0.5], [0.24, y, z], 0.004, bm); bone(root, [0.24, y, z], [0.27 + (f % 4 ? 0.01 : -0.01), y, z * 1.1], 0.0035, bm); }
    mesh(new THREE.SphereGeometry(0.03, 16, 12), bm, { parent: root, at: [-0.235, y, 0] });
  } else {
    const mini = variant === 'desk-mini';
    const s = mini ? 0.25 : 1;
    // hanging stand: rolling base + pole + hook through the skull
    if (mini) slab(root, st, 0.16, 0.012, 0.12, { r: 0.004 });
    else { for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; bar([0, 0.06, 0], [Math.cos(a) * 0.3, 0.04, Math.sin(a) * 0.3], 0.018, st, root); foot(root, M.rubber(), Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.025, 0.04); } mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16), st, { parent: root, at: [0, 0.06, 0] }); }
    const b0 = mini ? 0.012 : 0.08;
    rodY(b0, 1.82 * s + b0, 0.012 * s + 0.002, M.chrome(), root, { z: -0.12 * s });
    const k = group('skeleton', { parent: root, at: [0, b0, 0] });
    // pelvis on the pole bracket
    bar([0, 0.98 * s, -0.12 * s], [0, 0.98 * s, -0.03 * s], 0.01 * s + 0.002, M.chrome(), k);
    mesh(new THREE.TorusGeometry(0.08 * s, 0.03 * s, 10, 24).scale(1.5, 1, 1), bm, { parent: k, at: [0, 0.96 * s, 0], rot: [Math.PI / 2 - 0.3, 0, 0] });
    spineCol(k, 0.98 * s, 1.5 * s, s, bm);
    // ribcage
    for (let i = 0; i < 9; i++) { const y = 1.18 * s + i * 0.035 * s, r = (0.1 + Math.sin((i / 8) * Math.PI) * 0.05) * s; mesh(new THREE.TorusGeometry(r, 0.006 * s, 6, 28, Math.PI * 1.7).rotateX(Math.PI / 2).rotateY(Math.PI * 0.35 + Math.PI / 2), bm, { parent: k, at: [0, y, 0.0] }); }
    slab(k, bm, 0.025 * s, 0.2 * s, 0.015 * s, { y: 1.22 * s, z: 0.135 * s, r: 0.005 * s });
    // clavicles + skull
    for (const sd of [-1, 1]) bone(k, [0, 1.48 * s, 0.03 * s], [sd * 0.17 * s, 1.47 * s, 0], 0.008 * s, bm);
    skull(k, [0, 1.565 * s, 0.01 * s], s, bm, dark);
    for (const sd of [-1, 1]) {
      // arms
      bone(k, [sd * 0.17 * s, 1.47 * s, 0], [sd * 0.22 * s, 1.17 * s, 0], 0.013 * s, bm);
      bone(k, [sd * 0.22 * s, 1.17 * s, 0], [sd * 0.25 * s, 0.9 * s, 0.03 * s], 0.009 * s, bm);
      mesh(roundedBox(0.04 * s, 0.09 * s, 0.015 * s, 0.006 * s), bm, { parent: k, at: [sd * 0.255 * s, 0.84 * s, 0.03 * s] });
      // legs
      bone(k, [sd * 0.09 * s, 0.94 * s, 0], [sd * 0.1 * s, 0.5 * s, 0.01 * s], 0.016 * s, bm);
      mesh(new THREE.SphereGeometry(0.022 * s, 12, 8), bm, { parent: k, at: [sd * 0.1 * s, 0.5 * s, 0.035 * s] });
      bone(k, [sd * 0.1 * s, 0.5 * s, 0.01 * s], [sd * 0.1 * s, 0.08 * s, 0], 0.013 * s, bm);
      slab(k, bm, 0.06 * s, 0.035 * s, 0.17 * s, { x: sd * 0.1 * s, y: 0.035 * s, z: 0.04 * s, r: 0.012 * s });
      if (T.muscles) { mesh(new THREE.CapsuleGeometry(0.035 * s, 0.25 * s, 6, 12), M.matte('#b5382e', 0.6), { parent: k, at: [sd * 0.1 * s, 0.72 * s, 0.03 * s] }); mesh(new THREE.CapsuleGeometry(0.025 * s, 0.16 * s, 6, 12), M.matte('#b5382e', 0.6), { parent: k, at: [sd * 0.2 * s, 1.3 * s, 0.01 * s], rot: [0, 0, sd * 0.17] }); }
    }
    // the feet rest on a little plate held by the pole
    if (!mini) slab(root, st, 0.3, 0.012, 0.25, { y: b0 + 0.0, z: 0.0, r: 0.004 });
    if (T.labels) for (const [y, txt] of [[1.62, 'SKULL'], [1.25, 'RIBS'], [0.72, 'FEMUR']]) { const l = labelPlane(0.12 * s, 0.03 * s, (c, w, h) => { c.fillStyle = '#fff6a8'; c.fillRect(0, 0, w, h); c.fillStyle = '#16171a'; c.font = `bold ${h * 0.6}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2); }, { bg: '#fff6a8' }); l.position.set(0.055 * s, y * s + b0 - 0.08 * s, -0.12 * s + 0.012 * s + 0.0025); root.add(l); }
    anims.push(clip('sway', 4, [rotateTrack(k.getObjectByName('jaw'), 'x', 4, (t) => 0.12 * pingPong(t * 2 % 1))]));
  }
  if (T.glow) lamp(T, root, 'green', { at: [0, 0.031, 0.0], normal: [0, 1, 0], w: 0.01, h: 0.01, shape: 'round' });
  return done(root, T, variant, o, anims);
}

/* ================================== GLOBES ================================== */

export const GLOBE_VARIANTS = { desk: {}, floor: {}, illuminated: { glow: true }, political: { political: true }, relief: { relief: true } };

function earthTex(political, relief, vintage) {
  return canvasTex(512, 256, (c, w, h) => {
    let s = political ? 7 : 13;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    c.fillStyle = vintage ? '#c9b98a' : political ? '#9fd0ee' : '#2a6bb5'; c.fillRect(0, 0, w, h);
    const land = [[0.18, 0.3, 0.12, 0.18], [0.24, 0.62, 0.06, 0.16], [0.5, 0.3, 0.07, 0.1], [0.52, 0.55, 0.07, 0.15], [0.7, 0.32, 0.15, 0.14], [0.82, 0.7, 0.06, 0.06]];
    land.forEach(([x, y, rw, rh], i) => {
      c.fillStyle = political ? ['#f2c94a', '#e57373', '#81c784', '#ba68c8', '#ffb74d', '#4db6ac'][i] : vintage ? '#a8875a' : relief ? '#7a9a4a' : '#4a8a3a';
      c.beginPath(); for (let k = 0; k < 14; k++) { const a = (k / 14) * 6.28, r = 0.75 + rnd() * 0.5; c.lineTo((x + Math.cos(a) * rw * r) * w, (y + Math.sin(a) * rh * r) * h); } c.fill();
    });
    c.strokeStyle = vintage ? 'rgba(80,50,20,0.5)' : 'rgba(255,255,255,0.35)'; c.lineWidth = 1;
    for (let i = 1; i < 12; i++) { c.beginPath(); c.moveTo((i * w) / 12, 0); c.lineTo((i * w) / 12, h); c.stroke(); }
    for (let j = 1; j < 6; j++) { c.beginPath(); c.moveTo(0, (j * h) / 6); c.lineTo(w, (j * h) / 6); c.stroke(); }
  });
}

export function createEduGlobe(options = {}) {
  const { o, variant, T, V } = setup(options, GLOBE_VARIANTS, 'edu-globe');
  const root = group(`edu-globe-${variant}`);
  const floor = variant === 'floor';
  const r = floor ? 0.3 : 0.16;
  const sm = T.vintage ? M.wood('walnut') : T.kids ? M.plastic(T.p, 0.4) : T.heavy ? fin(T, '#2a2d33', 'paint') : T.trim === 'futuristic' ? fin(T, '#16191f', 'carbon') : T.trim === 'research' ? M.chrome() : M.wood('#6b4426');
  const arc = T.vintage ? M.metal('#c9a24a', 0.25) : T.kids ? M.plastic(T.s, 0.4) : M.metal('#c9ccd2', 0.3);
  let cy;
  if (floor) {
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; curveTube([[Math.cos(a) * 0.32, 0.0, Math.sin(a) * 0.32], [Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.3], [Math.cos(a) * 0.4, 0.62, Math.sin(a) * 0.4]], 0.025, sm, { parent: root }); foot(root, sm, Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0.035, 0.03); }
    mesh(new THREE.TorusGeometry(0.4, 0.03, 10, 48).rotateX(Math.PI / 2), sm, { parent: root, at: [0, 0.64, 0] });
    mesh(new THREE.TorusGeometry(0.31, 0.012, 8, 40).rotateX(Math.PI / 2), sm, { parent: root, at: [0, 0.3, 0] });
    cy = 0.66 + 0.0;
  } else {
    mesh(lathe([[0, 0], [0.12, 0], [0.12, 0.02], [0.08, 0.04], [0.03, 0.06], [0.025, 0.14], [0, 0.14]], 40), sm, { parent: root });
    cy = 0.14 + r + 0.025;
  }
  const tilt = 0.41;
  const mer = group('meridian', { parent: root, at: [0, cy, 0], rot: [0, 0, tilt] });
  mesh(new THREE.TorusGeometry(r + 0.012, floor ? 0.008 : 0.005, 8, 64), arc, { parent: mer, rot: [0, Math.PI / 2, 0] });
  rodY(-r - 0.012, r + 0.012, 0.003, arc, mer);
  const tex = earthTex(V.political, V.relief, T.vintage);
  const mat = new THREE.MeshPhysicalMaterial({ name: 'globe', color: tex ? '#ffffff' : T.vintage ? '#c9b98a' : '#2a6bb5', map: tex, roughness: 0.4, clearcoat: 0.6 });
  if (V.glow) { mat.emissive = new THREE.Color('#ffffff'); mat.emissiveMap = tex; mat.emissiveIntensity = 0.3; }
  const ball = group('globe', { parent: mer });
  const g = new THREE.SphereGeometry(r, 64, 40);
  if (V.relief) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + 0.012 * Math.max(0, Math.sin(x * 40) * Math.sin(y * 33) * Math.cos(z * 27)); p.setXYZ(i, x * k, y * k, z * k); } g.computeVertexNormals(); }
  mesh(g, mat, { parent: ball });
  if (floor) mesh(new THREE.TorusGeometry(r + 0.03, 0.02, 8, 64).rotateX(Math.PI / 2), arc, { parent: root, at: [0, cy, 0] });
  // support from base to the meridian bottom
  const bot = new THREE.Vector3(0, -(r + 0.012), 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), tilt).add(new THREE.Vector3(0, cy, 0));
  if (!floor) bar([0, 0.13, 0], bot.toArray(), 0.01, arc, root);
  if (V.glow) { lamp(T, root, 'white', { at: [0, 0.09, 0.085], w: 0.012, h: 0.012, shape: 'round' }); curveTube([[0, 0.01, -0.11], [0.05, 0.002, -0.3], [0.1, 0.004, -0.5]], 0.003, M.rubber(), { parent: root }); }
  if (T.trim === 'futuristic') glowStrip(T, root, Array.from({ length: 13 }, (_, i) => [Math.cos(i * 0.52) * 0.121, 0.012, Math.sin(i * 0.52) * 0.121]), 0.003);
  return done(root, T, variant, o, [clip('spin', 12, [spinTrack(ball, 'y', 12)])]);
}

/* ============================ PERIODIC TABLE BOARD ============================ */

const ELEMENTS = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
function periodicPos(i) {
  const z = i + 1;
  if (z === 1) return [0, 0]; if (z === 2) return [17, 0];
  if (z <= 10) return [z <= 4 ? z - 3 : z + 7, 1];
  if (z <= 18) return [z <= 12 ? z - 11 : z - 1, 2];
  if (z <= 36) return [z - 19, 3]; if (z <= 54) return [z - 37, 4];
  if (z <= 57) return [z - 55, 5]; if (z <= 86) return [z - 69, 5];
  if (z <= 89) return [z - 87, 6]; return [z - 101, 6];
}
const GROUP_COL = (x, y) => (x === 0 && y > 0 ? '#ff8a80' : x === 1 ? '#ffcc80' : x === 17 ? '#b39ddb' : x === 16 ? '#80deea' : x >= 2 && x <= 11 ? '#fff59d' : x >= 12 && y + x >= 15 + (x - 12) * 0 ? '#a5d6a7' : '#90caf9');
export function drawPeriodic(c, w, h, { bg = '#f6f6f2', dark = false } = {}) {
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  c.fillStyle = dark ? '#e8e8e8' : '#16171a'; c.font = `bold ${h * 0.06}px sans-serif`; c.textAlign = 'center'; c.fillText('PERIODIC TABLE OF THE ELEMENTS', w / 2, h * 0.08);
  const cw = w / 19.5, ch = h / 8.6, ox = w * 0.02, oy = h * 0.12;
  ELEMENTS.forEach((sym, i) => {
    const [x, y] = periodicPos(i);
    c.fillStyle = dark ? '#1d2129' : GROUP_COL(x, y); c.fillRect(ox + x * cw + 1, oy + y * ch + 1, cw - 2, ch - 2);
    if (dark) { c.strokeStyle = GROUP_COL(x, y); c.lineWidth = 1.5; c.strokeRect(ox + x * cw + 1, oy + y * ch + 1, cw - 2, ch - 2); }
    c.fillStyle = dark ? GROUP_COL(x, y) : '#16171a'; c.font = `bold ${ch * 0.42}px sans-serif`; c.fillText(sym, ox + x * cw + cw / 2, oy + y * ch + ch * 0.68);
    c.font = `${ch * 0.2}px sans-serif`; c.fillText(String(i + 1), ox + x * cw + cw * 0.25, oy + y * ch + ch * 0.25);
  });
}

export const PERIODIC_VARIANTS = { 'wall-board': {}, easel: {}, 'desk-mat': {}, 'poster-frame': {}, 'rolling-board': {} };

export function createEduPeriodicTable(options = {}) {
  const { o, variant, T } = setup(options, PERIODIC_VARIANTS, 'edu-periodic-table');
  const root = group(`edu-periodic-table-${variant}`);
  const fm = T.vintage ? M.wood('#6b4426') : T.kids ? M.plastic(T.p, 0.4) : T.heavy ? fin(T, '#2a2d33', 'paint') : T.trim === 'futuristic' ? fin(T, '#16191f', 'carbon') : M.metal('#c9ccd2', 0.3);
  const dark = T.trim === 'futuristic';
  const draw = (c, w, h) => drawPeriodic(c, w, h, { bg: T.vintage ? '#efe2c4' : dark ? '#0b0e14' : T.wear ? '#e6dcc6' : '#f6f6f2', dark });
  const board = (W, H, d = 0.025) => panel(W, H, d, draw, fm, { px: 1024, emissive: dark ? 0.6 : 0, bg: '#f6f6f2' });
  if (variant === 'desk-mat') {
    const b = board(0.6, 0.35, 0.004);
    b.rotation.x = -Math.PI / 2; b.position.y = 0.002; root.add(b);
  } else if (variant === 'easel') {
    const em = T.vintage ? M.wood('#8a5a32') : fm;
    for (const s of [-1, 1]) bar([s * 0.4, 0, 0.25], [s * 0.3, 1.6, 0], 0.02, em, root);
    bar([0, 0, -0.45], [0, 1.5, -0.03], 0.02, em, root);
    slab(root, em, 0.9, 0.04, 0.08, { y: 0.55, z: 0.18, r: 0.01 });
    const b = board(1.0, 0.6);
    b.position.set(0, 0.9, 0.17); b.rotation.x = -0.18; root.add(b);
  } else if (variant === 'rolling-board') {
    for (const x of [-1, 1]) { foot(root, M.rubber(), x * 0.7, 0.25, 0.04, 0.06); foot(root, M.rubber(), x * 0.7, -0.25, 0.04, 0.06); slab(root, fm, 0.05, 0.04, 0.6, { x: x * 0.7, y: 0.06, r: 0.01 }); rodY(0.1, 1.9, 0.02, fm, root, { x: x * 0.7 }); }
    const b = board(1.4, 0.85, 0.03);
    b.position.set(0, 1.3, 0); root.add(b);
    slab(root, fm, 1.4, 0.03, 0.08, { y: 0.86, z: 0.03, r: 0.01 });
  } else {
    // wall board / framed poster on a wall section (no floating: the wall stands on the floor)
    const wallM = M.matte(T.kids ? '#fff3c4' : '#e8e4da');
    slab(root, wallM, 2.2, 2.4, 0.12, { z: -0.06, r: 0.01 });
    slab(root, M.matte('#8d8f94'), 2.2, 0.1, 0.02, { z: 0.01, r: 0.004 });
    const W = variant === 'poster-frame' ? 1.0 : 1.6, H = variant === 'poster-frame' ? 0.7 : 1.0;
    const b = board(W, H, variant === 'poster-frame' ? 0.03 : 0.02);
    b.position.set(0, 1.5, 0.0 + (variant === 'poster-frame' ? 0.015 : 0.01)); root.add(b);
    if (variant === 'poster-frame') slab(root, glassMat(), W * 0.96, H * 0.96, 0.003, { y: 1.5 - H * 0.48, z: 0.031, r: 0.001 });
    else lamp(T, root, 'white', { at: [0, 2.15, 0.001], w: 1.2, h: 0.04, shape: 'strip', glowSize: 0.6 });
  }
  if (dark) glowStrip(T, root, variant === 'desk-mat' ? [[-0.3, 0.004, 0.176], [0.3, 0.004, 0.176]] : [[-0.3, 0.003, 0.3], [0.3, 0.003, 0.3]], 0.003);
  if (dark && variant !== 'desk-mat') slab(root, darkMat(T), 0.62, 0.006, 0.02, { z: 0.3, r: 0.002 });
  return done(root, T, variant, o);
}

/* ================================ CHALKBOARDS ================================ */

export const BOARD_VARIANTS = { wall: {}, easel: {}, 'rolling-green': { green: true }, whiteboard: { white: true }, 'flip-reversible': { flip: true } };
const EQUATIONS = ['E = mc²', 'F = ma', 'a² + b² = c²', 'PV = nRT', '∫ x dx = x²/2', 'λ = h / p', 'V = IR', 'ΔG = ΔH − TΔS'];

function boardDraw(T, V) {
  return (c, w, h) => {
    const white = V.white;
    c.fillStyle = white ? '#fbfbf8' : V.green || T.vintage ? '#2f4a3a' : '#22262a'; c.fillRect(0, 0, w, h);
    if (!white) { c.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 40; i++) c.fillRect((i * 97) % w, (i * 61) % h, 80, 6); }
    const ink = white ? ['#1d4fa0', '#d23b2a', '#16171a'] : T.kids ? ['#ffe066', '#ff8fab', '#a0e7e5'] : ['#f4f4f2', '#f4f4f2', '#ffe9a0'];
    c.textAlign = 'left'; c.font = `${h * 0.1}px "Comic Sans MS", cursive, sans-serif`;
    const k = (T.trim ? T.trim.length : 0) % EQUATIONS.length;
    for (let i = 0; i < 4; i++) { c.fillStyle = ink[i % 3]; c.fillText(EQUATIONS[(k + i * 2) % EQUATIONS.length], w * 0.06, h * (0.2 + i * 0.2)); }
    c.strokeStyle = ink[0]; c.lineWidth = 3;
    c.beginPath(); c.moveTo(w * 0.62, h * 0.85); c.lineTo(w * 0.62, h * 0.2); c.moveTo(w * 0.6, h * 0.83); c.lineTo(w * 0.95, h * 0.83); c.stroke();
    c.beginPath(); for (let x = 0; x <= 60; x++) { const t = x / 60; c.lineTo(w * (0.62 + t * 0.32), h * (0.8 - Math.sin(t * Math.PI * 2) * 0.22 - t * 0.2)); } c.stroke();
    c.font = `${h * 0.08}px sans-serif`; c.fillStyle = ink[1]; c.fillText('y = sin x', w * 0.7, h * 0.18);
  };
}

export function createEduChalkboard(options = {}) {
  const { o, variant, T, V } = setup(options, BOARD_VARIANTS, 'edu-chalkboard');
  const root = group(`edu-chalkboard-${variant}`);
  const fm = T.vintage ? M.wood('#6b4426') : V.white ? M.metal('#c9ccd2', 0.3) : T.kids ? M.plastic(T.p, 0.4) : T.heavy ? fin(T, '#2a2d33', 'paint') : T.trim === 'futuristic' ? fin(T, '#16191f', 'carbon') : M.wood('#b8874f');
  const draw = boardDraw(T, V);
  const W = variant === 'easel' ? 0.9 : 1.8, H = variant === 'easel' ? 0.65 : 1.1;
  const board = (d = 0.03) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(roundedBox(W + 0.06, H + 0.06, d, 0.008), fm));
    const f = labelPlane(W, H, draw, { px: 1024, bg: V.white ? '#fbfbf8' : '#2f4a3a', emissive: T.trim === 'futuristic' ? 0.4 : 0 });
    f.position.z = d / 2 + 0.0006; g.add(f);
    return g;
  };
  const tray = (parent, y, z) => {
    slab(parent, fm, W * 0.9, 0.025, 0.07, { y, z, r: 0.006 });
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.08, 10).rotateZ(Math.PI / 2), V.white ? M.plastic(['#1d4fa0', '#d23b2a', '#2fbf4a', '#16171a'][i], 0.4) : M.matte(['#f4f4f2', '#ffe066', '#ff8fab', '#f4f4f2'][i]), { parent, at: [-0.3 + i * 0.1, y + 0.03, z] });
    slab(parent, V.white ? M.plastic('#2a2d33', 0.5) : M.wood('#b8874f'), 0.13, 0.03, 0.05, { x: 0.3, y: y + 0.025, z, r: 0.006 });
  };
  const anims = [];
  if (variant === 'easel') {
    const em = T.kids ? M.plastic(T.s, 0.4) : fm;
    for (const s of [-1, 1]) bar([s * 0.45, 0, 0.25], [s * 0.3, 1.5, 0], 0.02, em, root);
    bar([0, 0, -0.45], [0, 1.4, -0.03], 0.02, em, root);
    tray(root, 0.6, 0.17);
    const b = board(); b.position.set(0, 0.6 + 0.025 + H / 2 + 0.03, 0.16); b.rotation.x = -0.17; root.add(b);
  } else if (variant === 'wall') {
    slab(root, M.matte(T.kids ? '#fff3c4' : '#e8e4da'), 2.6, 2.4, 0.12, { z: -0.06, r: 0.01 });
    const b = board(); b.position.set(0, 1.45, 0.015); root.add(b);
    tray(root, 1.45 - H / 2 - 0.05, 0.035);
    if (T.trim === 'research' || T.detail > 1) { const cl = group('clock', { parent: root, at: [1.05, 2.15, 0.02] }); mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 32).rotateX(Math.PI / 2), M.plastic('#2a2d33'), { parent: cl }); mesh(new THREE.CircleGeometry(0.105, 32), M.matte('#ffffff'), { parent: cl, at: [0, 0, 0.0205] }); }
  } else {
    // mobile frame on castors; reversible board pivots ('flip')
    for (const x of [-1, 1]) { for (const z of [-1, 1]) foot(root, M.rubber(), x * (W / 2 + 0.05), z * 0.28, 0.035, 0.06); slab(root, fm, 0.05, 0.04, 0.65, { x: x * (W / 2 + 0.05), y: 0.06, r: 0.01 }); rodY(0.1, 1.95, 0.022, fm, root, { x: x * (W / 2 + 0.05) }); }
    rodX(-W / 2 - 0.05, W / 2 + 0.05, 0.015, fm, root, { y: 0.35 });
    const piv = group('pivot', { parent: root, at: [0, 1.35, 0] });
    for (const s of [-1, 1]) rodX(s * (W / 2 + 0.028), s * (W / 2 + 0.05), 0.012, M.chrome(), piv);
    const b = board(0.035); piv.add(b);
    if (V.flip) { const back = labelPlane(W, H, boardDraw({ ...T, kids: true }, { white: true }), { px: 1024, bg: '#fbfbf8' }); back.position.z = -0.0181; back.rotation.y = Math.PI; piv.add(back); }
    tray(root, 0.72, 0.0);
    slab(root, fm, W + 0.1, 0.02, 0.09, { y: 0.72 - 0.02, r: 0.004 });
    anims.push(clip('flip', 4, [rotateTrack(piv, 'x', 4, (t) => Math.PI * Math.min(1, Math.max(0, t * 2 - 0.25)) * (t < 0.75 ? 1 : (1 - t) * 4))]));
  }
  if (T.trim === 'futuristic') glowStrip(T, root, [[-0.4, 0.003, 0.36], [0.4, 0.003, 0.36]], 0.004);
  if (T.trim === 'futuristic') slab(root, darkMat(T), 0.82, 0.006, 0.02, { z: 0.36, r: 0.002 });
  return done(root, T, variant, o, anims);
}

/* ================================ MAGNIFIERS ================================ */

export const MAGNIFIER_VARIANTS = { handheld: {}, 'lamp-magnifier': {}, 'stand-loupe': {}, 'jewellers-loupe': {} };

function lens(r, th) {
  const g = new THREE.SphereGeometry(1, 40, 12);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x * r, y * th, z * r); }
  g.computeVertexNormals();
  return g;
}

export function createEduMagnifier(options = {}) {
  const { o, variant, T } = setup(options, MAGNIFIER_VARIANTS, 'edu-magnifier');
  const root = group(`edu-magnifier-${variant}`);
  const rim = T.vintage ? M.metal('#c9a24a', 0.25) : T.kids ? M.plastic(T.p, 0.4) : T.trim === 'futuristic' ? fin(T, '#16191f', 'carbon') : T.heavy ? fin(T, '#f2b705', 'paint') : M.chrome();
  const handle = T.vintage ? M.wood('#5b3a24') : T.kids ? M.plastic(T.s, 0.4) : darkMat(T);
  const lm = new THREE.MeshPhysicalMaterial({ name: 'lens', color: '#ffffff', roughness: 0.02, transmission: 1, ior: 1.52, thickness: 0.02, transparent: true, opacity: 0.4, clearcoat: 1, depthWrite: false });
  if (variant === 'handheld') {
    // lying on an open book
    const bk = group('book', { parent: root });
    for (const s of [-1, 1]) { slab(bk, fin(T, '#8a2a24', 'matte'), 0.16, 0.004, 0.23, { x: s * 0.08, r: 0.001 }); slab(bk, M.matte('#f6f1e2'), 0.15, 0.02, 0.22, { x: s * 0.077, y: 0.004, r: 0.002 }); }
    const r = 0.045;
    const mg = group('magnifier', { parent: root, at: [0, 0.024, 0] });
    mesh(new THREE.TorusGeometry(r, 0.005, 12, 48).rotateX(Math.PI / 2), rim, { parent: mg, at: [0, 0.005, 0] });
    mesh(lens(r, 0.004), lm, { parent: mg, at: [0, 0.005, 0] });
    bar([r, 0.005, 0], [r + 0.02, 0.006, 0], 0.005, rim, mg);
    mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.1, 16).rotateZ(Math.PI / 2), handle, { parent: mg, at: [r + 0.07, 0.009, 0] });
  } else if (variant === 'lamp-magnifier') {
    const bm = T.trim ? fin(T, T.p, T.finish) : fin(T, '#eef0f3', 'gloss');
    mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.03, 32), bm, { parent: root, at: [0, 0.015, 0] });
    const a1 = [0, 0.03, 0], a2 = [0.05, 0.4, 0], a3 = [0.3, 0.45, 0];
    for (const z of [-0.012, 0.012]) { bar([a1[0], a1[1], z], [a2[0], a2[1], z], 0.006, bm, root); bar([a2[0], a2[1], z], [a3[0], a3[1], z], 0.006, bm, root); }
    mesh(new THREE.SphereGeometry(0.016, 12, 8), darkMat(T), { parent: root, at: a2 });
    const head = group('head', { parent: root, at: [0.36, 0.42, 0], rot: [0, 0, -0.3] });
    mesh(new THREE.TorusGeometry(0.075, 0.018, 12, 48).rotateX(Math.PI / 2), bm, { parent: head });
    mesh(lens(0.065, 0.008), lm, { parent: head });
    bar([-0.093, 0, 0], [-0.065, 0.03, 0], 0.006, bm, head);
    lamp(T, head, 'white', { geometry: new THREE.TorusGeometry(0.07, 0.005, 8, 48).rotateX(Math.PI / 2).translate(0, -0.012, 0), glowSize: 0.3 });
  } else if (variant === 'stand-loupe') {
    mesh(lathe([[0.05, 0], [0.055, 0], [0.055, 0.004], [0.045, 0.07], [0.045, 0.072], [0.04, 0.072], [0.05, 0.004], [0.05, 0]], 40), T.kids ? M.plastic(T.p, 0.4) : glassMat(), { parent: root });
    mesh(lens(0.044, 0.008), lm, { parent: root, at: [0, 0.072, 0] });
    mesh(new THREE.TorusGeometry(0.045, 0.004, 8, 40).rotateX(Math.PI / 2), rim, { parent: root, at: [0, 0.072, 0] });
    // specimen: a coin
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.002, 24), M.metal('#c9a24a', 0.3), { parent: root, at: [0.0, 0.001, 0] });
  } else {
    // folding jeweller's loupe resting on a tray with a gem
    slab(root, M.fabric(T.trim === 'futuristic' ? '#16191f' : '#1d2b4a'), 0.14, 0.008, 0.1, { r: 0.003 });
    const lp = group('loupe', { parent: root, at: [-0.02, 0.008, 0] });
    mesh(lathe([[0.012, 0], [0.016, 0], [0.014, 0.02], [0.01, 0.02]], 32), rim, { parent: lp });
    mesh(lens(0.0115, 0.003), lm, { parent: lp, at: [0, 0.019, 0] });
    mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.004, 32), handle, { parent: lp, at: [0, 0.002, 0] });
    const gem = new THREE.MeshPhysicalMaterial({ name: 'gem', color: T.vintage ? '#d22a4a' : '#9fd3ff', roughness: 0, transmission: 1, ior: 2.4, thickness: 0.01, transparent: true, opacity: 0.85 });
    mesh(new THREE.ConeGeometry(0.009, 0.008, 8).rotateX(Math.PI), gem, { parent: root, at: [0.035, 0.012, 0] });
    mesh(new THREE.CylinderGeometry(0.006, 0.009, 0.003, 8), gem, { parent: root, at: [0.035, 0.0175, 0] });
  }
  return done(root, T, variant, o);
}

/* ================================= COMPASSES ================================= */

export const COMPASS_VARIANTS = { pocket: {}, orienteering: {}, drafting: {}, binnacle: {} };

function compassFace(T) {
  return (c, w, h) => {
    c.fillStyle = T.vintage ? '#efe2c4' : T.trim === 'futuristic' ? '#0b0e14' : '#f6f6f2'; c.fillRect(0, 0, w, h);
    const cx = w / 2, r = w * 0.46, ink = T.trim === 'futuristic' ? '#22e1ff' : '#16171a';
    c.strokeStyle = ink; c.fillStyle = ink;
    for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2; const l = i % 9 === 0 ? 0.14 : 0.06; c.lineWidth = i % 9 === 0 ? 3 : 1; c.beginPath(); c.moveTo(cx + Math.sin(a) * r, cx - Math.cos(a) * r); c.lineTo(cx + Math.sin(a) * r * (1 - l), cx - Math.cos(a) * r * (1 - l)); c.stroke(); }
    c.font = `bold ${w * 0.1}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    ['N', 'E', 'S', 'W'].forEach((d, i) => { const a = (i / 4) * Math.PI * 2; c.fillStyle = d === 'N' ? '#d23b2a' : ink; c.fillText(d, cx + Math.sin(a) * r * 0.7, cx - Math.cos(a) * r * 0.7); });
  };
}
function needle(parent, r, y, name = 'needle') {
  const g = group(name, { parent, at: [0, y, 0] });
  for (const [s, col] of [[1, '#d23b2a'], [-1, '#e8e8e8']]) mesh(new THREE.ConeGeometry(r * 0.12, r * 0.8, 4).rotateX(s * -Math.PI / 2).scale(1, 0.25, 1), M.plastic(col, 0.3), { parent: g, at: [0, 0, -s * r * 0.4] });
  mesh(new THREE.CylinderGeometry(r * 0.06, r * 0.06, r * 0.08, 12), M.metal('#c9a24a'), { parent: g });
  return g;
}

export function createEduCompass(options = {}) {
  const { o, variant, T } = setup(options, COMPASS_VARIANTS, 'edu-compass');
  const root = group(`edu-compass-${variant}`);
  const cm = T.vintage ? M.metal('#c9a24a', 0.25) : T.kids ? M.plastic(T.p, 0.4) : T.trim === 'futuristic' ? fin(T, '#16191f', 'carbon') : T.heavy ? fin(T, '#f2b705', 'paint') : T.wear ? M.metal('#8f7a4c', 0.55) : M.chrome();
  const anims = [];
  const face = (r, y, parent = root) => { const f = labelPlane(r * 2, r * 2, compassFace(T), { bg: '#f6f6f2', px: 512 }); f.rotation.x = -Math.PI / 2; f.position.y = y; parent.add(f); return f; };
  if (variant === 'pocket' || variant === 'binnacle') {
    let g = root, s = 1;
    if (variant === 'binnacle') {
      const wm = T.vintage ? M.wood('#6b4426') : T.kids ? M.plastic(T.s, 0.4) : M.wood('#8a5a32');
      mesh(lathe([[0, 0], [0.25, 0], [0.25, 0.05], [0.14, 0.1], [0.12, 0.9], [0.2, 1.0], [0.2, 1.05], [0, 1.05]], 40), wm, { parent: root });
      for (const sd of [-1, 1]) mesh(new THREE.SphereGeometry(0.09, 24, 16), fin(T, sd > 0 ? '#d23b2a' : '#2fbf4a', 'gloss'), { parent: root, at: [sd * 0.28, 1.0, 0] });
      for (const sd of [-1, 1]) bar([sd * 0.19, 1.0, 0], [sd * 0.2, 1.0, 0], 0.03, cm, root);
      g = group('bowl', { parent: root, at: [0, 1.05, 0] }); s = 3;
      mesh(new THREE.SphereGeometry(0.16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), glassMat(), { parent: g, at: [0, 0.0, 0] });
    }
    const r = 0.025 * s;
    mesh(lathe([[0, 0], [r * 1.05, 0], [r * 1.15, r * 0.2], [r * 1.15, r * 0.45], [r * 1.0, r * 0.5], [r * 1.0, r * 0.12], [0, r * 0.12]], 48), cm, { parent: g });
    face(r * 0.98, r * 0.125, g);
    const nd = needle(g, r, r * 0.2);
    mesh(new THREE.CylinderGeometry(r * 1.0, r * 1.0, r * 0.03, 48), glassMat(), { parent: g, at: [0, r * 0.47, 0] });
    if (variant === 'pocket') {
      mesh(new THREE.TorusGeometry(r * 0.25, r * 0.06, 8, 20), cm, { parent: g, at: [0, r * 0.25, r * 1.35] });
      // open lid
      const lid = group('lid', { parent: g, at: [0, r * 0.45, -r * 1.12] });
      mesh(lathe([[0, 0], [r * 1.15, 0], [r * 1.15, r * 0.25], [r * 1.05, r * 0.3], [0, r * 0.3]], 48).rotateX(Math.PI / 2 + 0.3).translate(0, r * 1.0, -r * 0.4), cm, { parent: lid });
      bar([0, 0, 0], [0, r * 0.2, -r * 0.1], r * 0.08, cm, lid);
      anims.push(clip('close', 3, [rotateTrack(lid, 'x', 3, (t) => 1.5 * pingPong(t))]));
    }
    anims.push(clip('swing', 3, [rotateTrack(nd, 'y', 3, (t) => 0.25 * wave(t, 2) * (1 - t))]));
  } else if (variant === 'orienteering') {
    // baseplate compass lying on a map
    const map = labelPlane(0.3, 0.22, (c, w, h) => { c.fillStyle = '#f2ecd8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#a0784c'; c.lineWidth = 1; for (let k = 1; k < 10; k++) { c.beginPath(); c.ellipse(w * 0.6, h * 0.5, k * 12, k * 8, 0.4, 0, 6.3); c.stroke(); } c.strokeStyle = '#1d74c9'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, h * 0.8); c.bezierCurveTo(w * 0.3, h * 0.6, w * 0.5, h, w, h * 0.7); c.stroke(); }, { bg: '#f2ecd8' });
    map.rotation.x = -Math.PI / 2; map.position.y = 0.0005; root.add(map);
    const bp = new THREE.MeshPhysicalMaterial({ name: 'baseplate', color: T.kids ? T.p : T.trim === 'futuristic' ? '#22e1ff' : '#f4f4f2', roughness: 0.1, transmission: 0.7, transparent: true, opacity: 0.6, thickness: 0.004, depthWrite: false });
    slab(root, bp, 0.06, 0.004, 0.12, { y: 0.001, r: 0.0015 });
    const r = 0.022;
    const housing = group('housing', { parent: root, at: [0, 0.005, -0.015] });
    mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 0.012, 48, 1, true), fin(T, T.heavy ? '#f2b705' : '#d23b2a', 'plastic'), { parent: housing, at: [0, 0.006, 0] });
    face(r, 0.0006, housing);
    needle(housing, r, 0.004);
    mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 0.002, 48), glassMat(), { parent: housing, at: [0, 0.012, 0] });
    lamp(T, root, 'red', { at: [0, 0.006, 0.04], normal: [0, 1, 0], w: 0.008, h: 0.03, shape: 'strip', glowSize: 0.04 });
  } else {
    // drafting compass standing open over a sheet
    const sheet = labelPlane(0.3, 0.21, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2a2d33'; c.lineWidth = 2; c.beginPath(); c.arc(w / 2, h / 2, h * 0.35, 0, 6.3); c.stroke(); c.beginPath(); c.arc(w / 2, h / 2, h * 0.2, 0, 4); c.stroke(); }, { bg: '#ffffff' });
    sheet.rotation.x = -Math.PI / 2; sheet.position.y = 0.0005; root.add(sheet);
    const top = [0, 0.13, 0];
    const L = 0.13, spread = 0.065;
    bar([-spread, 0.004, 0], top, 0.0035, cm, root);
    bar([spread, 0.008, 0], top, 0.0035, cm, root);
    mesh(new THREE.ConeGeometry(0.0015, 0.006, 8).rotateX(Math.PI), M.chrome(), { parent: root, at: [-spread, 0.003, 0] });
    mesh(new THREE.CylinderGeometry(0.0025, 0.0012, 0.012, 8), M.matte('#2a2d33'), { parent: root, at: [spread, 0.006, 0] });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 16).rotateX(Math.PI / 2), cm, { parent: root, at: top });
    rodY(0.13, 0.155, 0.003, T.kids ? M.plastic(T.s, 0.4) : darkMat(T), root);
    void L;
  }
  return done(root, T, variant, o, anims);
}

/* ============================== WEATHER STATIONS ============================== */

export const WEATHER_VARIANTS = { mast: {}, 'home-station': {}, 'stevenson-screen': {}, 'rain-gauge': {}, 'school-kit': {} };

function anemometer(T, parent, at, s = 1) {
  const g = group('anemometer', { parent, at });
  rodY(0, 0.08 * s, 0.006 * s, M.chrome(), g);
  const cups = group('cups', { parent: g, at: [0, 0.08 * s, 0] });
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; bar([0, 0, 0], [Math.cos(a) * 0.1 * s, 0, Math.sin(a) * 0.1 * s], 0.003 * s, M.chrome(), cups); mesh(new THREE.SphereGeometry(0.025 * s, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(Math.PI / 2), fin(T, T.kids ? T.a : T.heavy ? '#f2b705' : '#2a2d33', 'plastic'), { parent: cups, at: [Math.cos(a) * 0.1 * s, 0, Math.sin(a) * 0.1 * s], rot: [0, -a + Math.PI / 2, 0] }); }
  mesh(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.02 * s, 12), M.chrome(), { parent: cups });
  return cups;
}
function vane(T, parent, at, s = 1) {
  const g = group('vane', { parent, at });
  rodY(0, 0.06 * s, 0.005 * s, M.chrome(), g);
  rodX(-0.14 * s, 0.1 * s, 0.004 * s, M.chrome(), g, { y: 0.06 * s });
  mesh(new THREE.ConeGeometry(0.012 * s, 0.04 * s, 12).rotateZ(-Math.PI / 2), fin(T, T.vintage ? '#c9a24a' : '#d23b2a', T.vintage ? 'brass' : 'gloss'), { parent: g, at: [0.12 * s, 0.06 * s, 0] });
  mesh(extrudeOutline([[0, -0.04 * s], [0.06 * s, -0.025 * s], [0.06 * s, 0.025 * s], [0, 0.04 * s]], 0.003 * s, { bevel: 0.0008 * s }).rotateY(0).rotateX(Math.PI / 2).rotateX(-Math.PI / 2).rotateZ(0), fin(T, T.vintage ? '#c9a24a' : '#2a2d33', T.vintage ? 'brass' : 'plastic'), { parent: g, at: [-0.2 * s, 0.06 * s, 0] });
  return g;
}

export function createEduWeatherStation(options = {}) {
  const { o, variant, T } = setup(options, WEATHER_VARIANTS, 'edu-weather-station');
  const root = group(`edu-weather-station-${variant}`);
  const pm = T.vintage ? M.wood('#6b4426') : T.kids ? M.plastic(T.p, 0.4) : T.heavy ? fin(T, '#f2b705', 'paint') : T.trim === 'futuristic' ? fin(T, '#16191f', 'carbon') : M.metal('#c9ccd2', 0.3);
  const white = T.trim === 'futuristic' ? fin(T, '#22262e', 'carbon') : T.vintage ? M.matte('#efe8d6') : fin(T, '#f4f4f2', 'gloss');
  const anims = [];
  if (variant === 'mast' || variant === 'school-kit') {
    const kid = variant === 'school-kit';
    const H = kid ? 1.2 : 3;
    if (kid) for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; bar([0, 0.5, 0], [Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45], 0.012, pm, root); }
    else slab(root, M.matte('#9a9c9f'), 0.6, 0.15, 0.6, { r: 0.02 });
    rodY(kid ? 0 : 0.15, H, kid ? 0.015 : 0.03, pm, root);
    rodX(-0.45, 0.45, 0.012, pm, root, { y: H - 0.05 });
    const cups = anemometer(T, root, [0.45, H - 0.05, 0], kid ? 0.8 : 1.2);
    const vn = vane(T, root, [-0.45, H - 0.05, 0], kid ? 0.8 : 1.2);
    // solar-powered logger box + temperature shield
    const bx = group('logger', { parent: root, at: [0, H * 0.45, 0.03] });
    slab(bx, white, 0.22, 0.28, 0.1, { y: -0.14, z: 0.05, r: 0.015 });
    lamp(T, bx, 'green', { at: [0.07, 0.1, 0.101], w: 0.01, h: 0.01, shape: 'round' });
    const sh = group('shield', { parent: root, at: [0, H * 0.72, 0] });
    for (let i = 0; i < 6; i++) mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.015, 24), white, { parent: sh, at: [0.11, i * 0.03, 0] });
    rodY(0, 0.17, 0.006, M.chrome(), sh, { x: 0.11 });
    rodX(0, 0.11, 0.006, M.chrome(), sh, { y: 0.08 });
    if (!kid) { const sp = group('solar', { parent: root, at: [0, H * 0.6, -0.03], rot: [0.6, 0, 0] }); slab(sp, M.metal('#c9ccd2'), 0.32, 0.22, 0.02, { y: -0.11, z: -0.01, r: 0.004 }); slab(sp, M.metal('#1b2f6b', 0.3), 0.3, 0.2, 0.004, { y: -0.1, z: -0.022, r: 0.001 }); }
    anims.push(clip('spin', 1, [spinTrack(cups, 'y', 1)]), clip('wind', 6, [rotateTrack(vn, 'y', 6, (t) => 0.5 * wave(t))]));
  } else if (variant === 'home-station') {
    // display console on a desk + small outdoor sensor beside
    const c = group('console', { parent: root });
    slab(c, white, 0.2, 0.012, 0.08, { r: 0.004 });
    const sc = panel(0.18, 0.13, 0.025, (ctx, w, h) => { ctx.fillStyle = T.trim === 'futuristic' ? '#071018' : '#cfe3d4'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = T.trim === 'futuristic' ? '#22e1ff' : '#16171a'; ctx.font = `bold ${h * 0.25}px monospace`; ctx.fillText('21.4°C', 10, h * 0.32); ctx.font = `${h * 0.14}px monospace`; ctx.fillText('48%  1013hPa', 10, h * 0.55); ctx.fillStyle = '#f2b705'; ctx.beginPath(); ctx.arc(w * 0.8, h * 0.75, h * 0.1, 0, 6.3); ctx.fill(); }, white, { emissive: T.trim === 'futuristic' ? 0.8 : 0.2, bg: '#cfe3d4' });
    sc.position.set(0, 0.075, -0.01); sc.rotation.x = -0.2; c.add(sc);
    const sn = group('sensor', { parent: root, at: [0.2, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.01, 20), white, { parent: sn, at: [0, 0.005, 0] });
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.008, 20), white, { parent: sn, at: [0, 0.015 + i * 0.012, 0] });
    rodY(0.005, 0.06, 0.006, M.chrome(), sn);
    lamp(T, c, 'blue', { at: [0.08, 0.013, 0.02], normal: [0, 1, 0], w: 0.006, h: 0.006, shape: 'round' });
  } else if (variant === 'stevenson-screen') {
    for (const x of [-1, 1]) for (const z of [-1, 1]) slab(root, T.vintage ? M.wood('#8a5a32') : white, 0.05, 1.0, 0.05, { x: x * 0.25, z: z * 0.2, r: 0.006 });
    const bx = group('screen', { parent: root, at: [0, 1.0, 0] });
    slab(bx, white, 0.6, 0.02, 0.5, { r: 0.004 });
    // louvred walls
    for (let i = 0; i < 12; i++) { const y = 0.03 + i * 0.033; for (const z of [-1, 1]) mesh(roundedBox(0.58, 0.004, 0.04, 0.0015), white, { parent: bx, at: [0, y, z * 0.23], rot: [z * 0.6, 0, 0] }); for (const x of [-1, 1]) mesh(roundedBox(0.04, 0.004, 0.44, 0.0015), white, { parent: bx, at: [x * 0.28, y, 0], rot: [0, 0, -x * 0.6] }); }
    for (const x of [-1, 1]) for (const z of [-1, 1]) slab(bx, white, 0.025, 0.42, 0.025, { x: x * 0.285, z: z * 0.235, r: 0.004 });
    // double roof
    slab(bx, white, 0.66, 0.02, 0.56, { y: 0.42, r: 0.004 });
    for (const x of [-0.2, 0.2]) slab(bx, white, 0.03, 0.03, 0.03, { x, y: 0.44, r: 0.004 });
    slab(bx, white, 0.7, 0.02, 0.6, { y: 0.47, r: 0.004 });
    for (let i = 0; i < 3; i++) slab(root, white, 0.5, 0.02, 0.025, { y: 0.25 + i * 0.12, z: 0.2 + 0.025, r: 0.004 });
  } else {
    // rain gauge on a stake + measuring cylinder (filled with rain)
    slab(root, M.matte('#5a8a3a', 0.95), 0.6, 0.03, 0.6, { r: 0.01 });
    rodY(0.03, 0.4, 0.02, pm, root);
    const rg = group('gauge', { parent: root, at: [0.0, 0.4, 0] });
    const outer = [[0.04, 0], [0.045, 0.004], [0.05, 0.25], [0.065, 0.28], [0.065, 0.3]];
    mesh(lathe([[0, 0], ...outer, [0.063, 0.3], [0.063, 0.282], [0.048, 0.252], [0.043, 0.006], [0, 0.006]], 32), new THREE.MeshPhysicalMaterial({ name: 'gauge', color: '#eef6fa', roughness: 0.1, transmission: 0.8, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }), { parent: rg });
    mesh(lathe([[0, 0.006], [0.0432, 0.006], [0.046, 0.1], [0, 0.1]], 32), new THREE.MeshPhysicalMaterial({ name: 'rain', color: '#9fd3ee', roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.8 }), { parent: rg });
    const gr = canvasTex(64, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#1d4fa0'; for (let i = 0; i < 25; i++) c.fillRect(0, h - 8 - i * 9.5, i % 5 ? 20 : 40, 2); });
    if (gr) mesh(new THREE.CylinderGeometry(0.0505, 0.0455, 0.24, 16, 1, true, -0.4, 0.8), new THREE.MeshStandardMaterial({ map: gr, transparent: true, alphaTest: 0.3 }), { parent: rg, at: [0, 0.13, 0] });
    for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(0.047, 0.004, 8, 32).rotateX(Math.PI / 2), pm, { parent: rg, at: [0, 0.05 + (s + 1) * 0.07, 0] });
  }
  return done(root, T, variant, o, anims);
}
