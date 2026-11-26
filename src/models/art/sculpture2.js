// Low-poly art pieces, kinetic sculptures (animated), totems and garden sculptures.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, tube, setup, done, fin, mainMat, accentMat, treat, roughen, ellipsoid, plinthBase, capTop, mergeGeometries } from './common.js';
import { seat, capsule, latticeSphere } from './sculpture.js';
import { clip, spinTrack, rotateTrack } from '../../core/animation.js';

const dbl = (m) => { const c = m.clone(); c.side = THREE.DoubleSide; return c; };
const flat = (m) => { const c = m.clone(); c.flatShading = true; return c; };

/* ================================ LOW-POLY ================================ */

export const LOWPOLY_VARIANTS = {
  fox: { p: '#e8743b' }, bear: { p: '#7a5236' }, cat: { p: '#9a9aa4' }, rabbit: { p: '#e9e2d6' }, deer: { p: '#b9844f' }, whale: { p: '#3d6f9e' }, bird: { p: '#e0b23a' }, 'gem-heart': { p: '#d8264a' },
};

/** Faceted blob: low-detail icosphere, jittered, scaled. */
function facet(rx, ry, rz, T, seed = 1) {
  const g = new THREE.IcosahedronGeometry(1, 1);
  roughen(g, 0.18, 2.3 + seed);
  return g.scale(rx, ry, rz);
}

export function createLowPolyArt(options = {}) {
  const { o, variant, trim, T } = setup(options, LOWPOLY_VARIANTS, 'low-poly-art', { finish: 'paint' });
  const root = group(`lowpoly-${variant}`);
  const top = plinthBase(root, T, 0.36);
  const a = group('piece', { parent: root });
  const m = flat(mainMat(T));
  const m2 = flat(T.pop ? fin(T, T.s, 'pop') : T.trim ? mainMat(T) : fin(T, '#f4efe6', 'paint'));
  const m3 = flat(T.pop ? fin(T, '#111111', 'pop') : T.trim ? accentMat(T) : fin(T, '#222222', 'paint'));
  const P = (g, mat, at, rot) => mesh(g, mat, { parent: a, at, rot });
  const legs = (xs, zs, h, r, mat, y0) => { for (const x of xs) for (const z of zs) mesh(new THREE.CylinderGeometry(r * 0.8, r, h + 0.02, 5), mat, { parent: a, at: [x, h / 2, z] }); void y0; };
  const ch = T.chunky ? 1.25 : T.slim ? 0.8 : 1;
  switch (variant) {
    case 'fox':
      legs([-0.09, 0.09], [-0.035, 0.035], 0.11, 0.018 * ch, m3);
      P(facet(0.15, 0.07 * ch, 0.065 * ch, T), m, [0, 0.15, 0]);
      P(facet(0.06, 0.055, 0.055, T, 2), m, [0.15, 0.21, 0]);
      P(new THREE.ConeGeometry(0.035, 0.09, 4).rotateZ(-Math.PI / 2), m2, [0.23, 0.195, 0]);
      for (const z of [-0.025, 0.025]) P(new THREE.ConeGeometry(0.02, 0.06, 3), m, [0.14, 0.27, z]);
      P(new THREE.ConeGeometry(0.045, 0.2, 5).rotateZ(Math.PI / 2 - 0.5), m, [-0.2, 0.19, 0]);
      P(new THREE.ConeGeometry(0.025, 0.05, 5).rotateZ(Math.PI / 2 - 0.5), m2, [-0.29, 0.243, 0]);
      break;
    case 'bear':
      legs([-0.1, 0.1], [-0.06, 0.06], 0.09, 0.04 * ch, m);
      P(facet(0.18, 0.11 * ch, 0.11 * ch, T), m, [0, 0.17, 0]);
      P(facet(0.08, 0.075, 0.075, T, 2), m, [0.18, 0.22, 0]);
      P(facet(0.04, 0.03, 0.035, T, 3), m2, [0.25, 0.205, 0]);
      for (const z of [-0.05, 0.05]) P(new THREE.IcosahedronGeometry(0.022, 0), m, [0.16, 0.29, z]);
      break;
    case 'cat':
      legs([-0.07, 0.07], [-0.03, 0.03], 0.1, 0.014 * ch, m);
      P(facet(0.12, 0.06 * ch, 0.055 * ch, T), m, [0, 0.14, 0]);
      P(facet(0.055, 0.05, 0.05, T, 2), m, [0.13, 0.2, 0]);
      for (const z of [-0.025, 0.025]) P(new THREE.ConeGeometry(0.02, 0.045, 3), m, [0.13, 0.26, z]);
      curveTube([[-0.11, 0.15, 0], [-0.17, 0.2, 0], [-0.16, 0.3, 0.02], [-0.12, 0.34, 0.03]], 0.012, m, { parent: a, segments: 6, radialSegments: 4 });
      P(new THREE.ConeGeometry(0.012, 0.02, 4).rotateX(Math.PI / 2), m3, [0.18, 0.2, 0]).rotation.y = Math.PI / 2;
      break;
    case 'rabbit':
      P(facet(0.09, 0.08 * ch, 0.075 * ch, T), m, [0, 0.08, 0]);
      P(facet(0.05, 0.05, 0.048, T, 2), m, [0.07, 0.17, 0]);
      for (const z of [-0.018, 0.018]) P(new THREE.CylinderGeometry(0.008, 0.016, 0.11, 4), m2, [0.06, 0.26, z], [z * 8, 0, 0.15]);
      P(new THREE.IcosahedronGeometry(0.028, 0), m2, [-0.09, 0.07, 0]);
      break;
    case 'deer':
      legs([-0.1, 0.1], [-0.03, 0.03], 0.22, 0.013 * ch, m);
      P(facet(0.15, 0.07 * ch, 0.06 * ch, T), m, [0, 0.26, 0]);
      P(new THREE.CylinderGeometry(0.03, 0.04, 0.14, 5), m, [0.14, 0.34, 0], [0, 0, -0.6]);
      P(facet(0.06, 0.04, 0.04, T, 2), m, [0.21, 0.41, 0]);
      for (const z of [-1, 1]) {
        const am = m3;
        curveTube([[0.19, 0.44, z * 0.02], [0.17, 0.52, z * 0.05], [0.13, 0.6, z * 0.08], [0.1, 0.65, z * 0.1]], 0.007, am, { parent: a, segments: 6, radialSegments: 4 });
        curveTube([[0.17, 0.52, z * 0.05], [0.22, 0.58, z * 0.07]], 0.006, am, { parent: a, segments: 3, radialSegments: 4 });
      }
      break;
    case 'whale':
      mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), M.metal('#333336', 0.4), { parent: a, at: [0, 0.08, 0] });
      P(facet(0.22, 0.08 * ch, 0.09 * ch, T), m, [0, 0.22, 0]);
      P(facet(0.15, 0.03, 0.07, T, 2), m2, [0.02, 0.17, 0]);
      P(new THREE.ConeGeometry(0.06, 0.14, 4).rotateZ(Math.PI / 2), m, [-0.25, 0.23, 0]);
      P(extrudeOutline([[0, 0], [-0.04, 0.08], [-0.01, 0.04], [0, 0.0], [-0.01, -0.04], [-0.04, -0.08]], 0.015, { bevel: 0 }).rotateX(Math.PI / 2), m, [-0.3, 0.24, 0]);
      for (const z of [-1, 1]) P(new THREE.ConeGeometry(0.02, 0.08, 3), m, [0.06, 0.16, z * 0.08], [z * 1.1, 0, 0]);
      break;
    case 'bird':
      for (const z of [-0.02, 0.02]) mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.09, 4), m3, { parent: a, at: [0, 0.045, z] });
      P(facet(0.09, 0.06 * ch, 0.06 * ch, T), m, [0, 0.13, 0]);
      P(facet(0.045, 0.045, 0.042, T, 2), m, [0.08, 0.2, 0]);
      P(new THREE.ConeGeometry(0.015, 0.05, 4).rotateZ(-Math.PI / 2), T.pop ? m3 : flat(fin(T, '#e2701e', T.trim ? T.finish : 'paint')), [0.14, 0.2, 0]);
      for (const z of [-1, 1]) P(facet(0.08, 0.02, 0.035, T, 3), m2, [-0.02, 0.15, z * 0.055], [z * 0.3, 0, 0.2]);
      P(extrudeOutline([[0, 0], [-0.1, 0.04], [-0.1, -0.01]], 0.03, { bevel: 0 }), m2, [-0.07, 0.13, 0]);
      break;
    default: {
      const pts = [];
      for (let i = 0; i <= 12; i++) { const t = (i / 12) * Math.PI * 2; pts.push([16 * Math.sin(t) ** 3 * 0.009, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.009]); }
      pts.pop();
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 1, curveSegments: 2 }).translate(0, 0, -0.03);
      P(g, m, [0, 0.17, 0]);
      break;
    }
  }
  if (T.pop) a.scale.set(1.1, 1.1, 1.25);
  seat(root, a, top);
  return done(root, 'low-poly-art', variant, o, [], T);
}

/* ================================= KINETIC ================================= */

export const KINETIC_VARIANTS = { 'wind-spinner': {}, 'orbit-rings': {}, pendulum: {}, mobile: {}, 'helix-tower': {}, 'balance-arc': {} };

export function createKineticSculpture(options = {}) {
  const { o, variant, trim, T } = setup(options, KINETIC_VARIANTS, 'kinetic-sculpture', { p: '#c3c6ca', finish: 'steel', a: '#d8432c' });
  const root = group(`kinetic-${variant}`);
  const top = plinthBase(root, T, 0.34, { h: ['tall', 'column', 'slender'].includes(T.plinth) ? 0.6 : undefined });
  const k = group('kinetic', { parent: root });
  const m = mainMat(T), md = dbl(m);
  const acc = T.pop ? fin(T, T.s, 'pop') : T.finish === 'steel' ? fin(T, '#d8432c', 'pop') : accentMat(T);
  const post = fin(T, '#2a2b2e', 'steel');
  const anims = [];
  const w = T.chunky ? 1.4 : T.slim ? 0.75 : 1;
  if (variant === 'wind-spinner') {
    const H = 1.5;
    mesh(new THREE.CylinderGeometry(0.012 * w, 0.016 * w, H, 12), post, { parent: k, at: [0, H / 2, 0] });
    const mk = (name, y, R, cups, dir) => {
      const r = group(name, { parent: k, at: [0, y, 0] });
      mesh(new THREE.CylinderGeometry(0.028 * w, 0.028 * w, 0.05, 16), m, { parent: r });
      for (let i = 0; i < cups; i++) {
        const a = (i / cups) * Math.PI * 2;
        tube([0, 0, 0], [Math.cos(a) * R, 0, Math.sin(a) * R], 0.006 * w, m, { parent: r });
        const cup = mesh(new THREE.SphereGeometry(0.07 * (R / 0.3), 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), dbl(i % 2 && !T.pop ? m : acc), { parent: r, at: [Math.cos(a) * R, 0, Math.sin(a) * R] });
        cup.rotation.set(0, -a, dir * Math.PI / 2);
      }
      anims.push(spinTrack(r, 'y', 3, dir));
    };
    mk('rotor', H, 0.3, 4, 1);
    mk('rotor2', H * 0.62, 0.2, 3, -1);
    return finish('spin');
  }
  if (variant === 'orbit-rings') {
    const R = 0.34;
    mesh(new THREE.CylinderGeometry(0.014 * w, 0.02 * w, 0.3, 12), post, { parent: k, at: [0, 0.15, 0] });
    const r1 = group('ring1', { parent: k, at: [0, 0.3 + R, 0] });
    mesh(new THREE.TorusGeometry(R, 0.012 * w, 10, 72), m, { parent: r1 });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8), post, { parent: r1, at: [0, s * (R - 0.025), 0] });
    const r2 = group('ring2', { parent: r1, rot: [0, Math.PI / 2, 0] });
    mesh(new THREE.TorusGeometry(R - 0.05, 0.011 * w, 10, 64), acc, { parent: r2 });
    const r3 = group('ring3', { parent: r2, rot: [Math.PI / 2, 0, 0] });
    mesh(new THREE.TorusGeometry(R - 0.1, 0.01 * w, 10, 64), m, { parent: r3 });
    // pins ring2↔ring3 along ring2's x axis
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8).rotateZ(Math.PI / 2), post, { parent: r2, at: [s * (R - 0.075), 0, 0] });
    const core = group('core', { parent: r3 });
    mesh(T.facet ? new THREE.IcosahedronGeometry(0.08, 0) : new THREE.SphereGeometry(0.08, 24, 16), acc, { parent: core });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.006, 0.006, R - 0.17, 8).rotateZ(Math.PI / 2), post, { parent: core, at: [s * ((R - 0.1 + 0.07) / 2), 0, 0] });
    anims.push(spinTrack(r1, 'y', 8, 1), spinTrack(r2, 'y', 8, -1), spinTrack(r3, 'x', 8, 1));
    return finish('spin');
  }
  if (variant === 'pendulum') {
    const H = 1.1, W = 0.5;
    mesh(roundedBox(W + 0.1, 0.04, 0.22, 0.012), post, { parent: k, at: [0, 0.02, 0] });
    for (const s of [-1, 1]) mesh(roundedBox(0.04 * w, H, 0.04 * w, 0.01), m, { parent: k, at: [s * W / 2, 0.035 + H / 2, 0] });
    mesh(roundedBox(W + 0.04 * w, 0.04 * w, 0.05 * w, 0.01), m, { parent: k, at: [0, 0.03 + H + 0.015, 0] });
    const p = group('pendulum', { parent: k, at: [0, H + 0.035, 0] });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.8, 8), post, { parent: p, at: [0, -0.4, 0] });
    if (T.pop || T.facet) mesh(new THREE.IcosahedronGeometry(0.08, T.facet ? 0 : 2), acc, { parent: p, at: [0, -0.85, 0] });
    else mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 40).rotateX(Math.PI / 2), acc, { parent: p, at: [0, -0.88, 0] });
    anims.push(rotateTrack(p, 'z', 2.4, (t) => 0.45 * Math.sin(t * Math.PI * 2)));
    return finish('swing');
  }
  if (variant === 'mobile') {
    const H = 1.4;
    curveTube([[0, 0, 0], [0, H, 0], [0.05, H + 0.12, 0], [0.25, H + 0.15, 0]], 0.012 * w, post, { parent: k, segments: 24 });
    const wire = (parent, x, y, len) => mesh(new THREE.CylinderGeometry(0.0025, 0.0025, len, 4), post, { parent, at: [x, y - len / 2, 0] });
    wire(k, 0.25, H + 0.15, 0.2);
    const arm1 = group('arm1', { parent: k, at: [0.25, H - 0.05, 0] });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.6, 6).rotateZ(Math.PI / 2), m, { parent: arm1 });
    const shapes = [];
    const hang = (parent, x, len, i) => {
      wire(parent, x, 0, len);
      const d = mesh(T.facet ? new THREE.CylinderGeometry(0.06, 0.06, 0.008, 5).rotateX(Math.PI / 2) : new THREE.CylinderGeometry(0.06, 0.06, 0.008, 32).rotateX(Math.PI / 2), i % 2 ? acc : m, { parent, at: [x, -len - 0.058, 0] });
      shapes.push(d);
    };
    hang(arm1, -0.3, 0.15, 0);
    wire(arm1, 0.3, 0, 0.18);
    const arm2 = group('arm2', { parent: arm1, at: [0.3, -0.18, 0] });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.4, 6).rotateZ(Math.PI / 2), m, { parent: arm2 });
    hang(arm2, -0.2, 0.1, 1);
    hang(arm2, 0.2, 0.22, 2);
    anims.push(spinTrack(arm1, 'y', 10, 1), spinTrack(arm2, 'y', 10, -1));
    return finish('spin');
  }
  if (variant === 'helix-tower') {
    const H = 1.3;
    mesh(new THREE.CylinderGeometry(0.01 * w, 0.01 * w, H, 10), post, { parent: k, at: [0, H / 2, 0] });
    const hx = group('helix', { parent: k });
    const n = T.facet ? 12 : 22;
    for (let i = 0; i < n; i++) {
      const y = 0.15 + (i / (n - 1)) * (H - 0.25);
      mesh(roundedBox(0.36 * (1 - i / n * 0.4) * w, 0.006, 0.05, 0.003), i % 3 === 0 ? acc : m, { parent: hx, at: [0, y, 0], rot: [0, (i / n) * Math.PI * 2, 0.0] });
    }
    anims.push(spinTrack(hx, 'y', 8, 1));
    return finish('spin');
  }
  // balance arc
  mesh(new THREE.ConeGeometry(0.05, 0.25, 24), post, { parent: k, at: [0, 0.125, 0] });
  const arc = group('arc', { parent: k, at: [0, 0.25, 0] });
  const R = 0.5;
  const g = new THREE.TorusGeometry(R, 0.014 * w, 10, 64, Math.PI * 0.8).rotateZ(Math.PI + Math.PI * 0.1);
  mesh(g, m, { parent: arc, at: [0, R - 0.004, 0] });
  for (const s of [-1, 1]) {
    const a = -Math.PI / 2 + s * Math.PI * 0.4;
    mesh(T.facet ? new THREE.IcosahedronGeometry(0.05, 0) : new THREE.SphereGeometry(0.05, 20, 14), acc, { parent: arc, at: [Math.cos(a) * R, R + Math.sin(a) * R, 0] });
  }
  anims.push(rotateTrack(arc, 'z', 4, (t) => 0.18 * Math.sin(t * Math.PI * 2)));
  return finish('rock');

  function finish(name) {
    seat(root, k, top, 0.003);
    return done(root, 'kinetic-sculpture', variant, o, () => [clip(name, Math.max(...anims.map((t) => t.times[t.times.length - 1])), anims)], T);
  }
}

/* ================================== TOTEMS ================================== */

export const TOTEM_VARIANTS = {
  'carved-faces': ['face', 'face', 'face', 'face'], 'bird-top': ['face', 'bear', 'face', 'bird'], 'animal-stack': ['bear', 'owl', 'bear', 'owl', 'bird'],
  geometric: ['geo', 'geo', 'geo', 'geo', 'geo', 'geo'], painted: ['band', 'face', 'band', 'owl', 'band'], tiki: ['tiki'], cairn: ['stone', 'stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
};

export function createTotem(options = {}) {
  const { o, variant, trim, T } = setup(options, Object.fromEntries(Object.keys(TOTEM_VARIANTS).map((k) => [k, {}])), 'totem', { p: '#8a5a35', finish: 'wood', a: '#c23b22' });
  const segs = TOTEM_VARIANTS[variant];
  const root = group(`totem-${variant}`);
  const top = plinthBase(root, T, 0.45, { h: T.plinth === 'block' ? 0.08 : ['column', 'tall', 'slender'].includes(T.plinth) ? 0.35 : undefined });
  const t = group('totem', { parent: root });
  const m = mainMat(T);
  const painted = variant === 'painted' || T.pop;
  const pal = painted ? ['#c23b22', '#1f6fb2', '#f2c230', '#1b1b1b', '#f4efe6'] : null;
  const pm = (i) => (painted ? fin(T, pal[i % pal.length], T.pop ? 'pop' : 'paint') : m);
  const eyeW = painted ? fin(T, '#f4efe6', 'paint') : m, eyeB = painted || !T.trim ? fin(T, '#1b1b1b', 'paint') : accentMat(T);
  const r = 0.17 * (T.chunky ? 1.2 : T.slim ? 0.8 : 1);
  const sg = T.facet ? 8 : 28;
  let y = 0;
  segs.forEach((kind, i) => {
    const h = kind === 'tiki' ? 1.3 : kind === 'stone' ? 0.16 + T.r() * 0.08 : kind === 'geo' ? 0.26 : kind === 'band' ? 0.14 : 0.36;
    const c = group(`seg${i}`, { parent: t, at: [0, y, 0] });
    const body = (rr, mat, sides = sg) => mesh(treat(new THREE.CylinderGeometry(rr * 0.96, rr, h + 0.01, sides, 2), T, 0.4), mat, { parent: c, at: [0, h / 2, 0] });
    const zf = (rr) => rr * 0.97;
    if (kind === 'stone') {
      const g = new THREE.IcosahedronGeometry(1, T.facet ? 1 : 2).scale(r * (1.3 - i * 0.08), h * 0.55, r * (1.1 - i * 0.06));
      roughen(g, 0.02, 8);
      mesh(g, painted ? pm(i) : m, { parent: c, at: [0, h / 2, 0], rot: [0, i * 1.3, 0] });
    } else if (kind === 'geo') {
      mesh(treat(new THREE.CylinderGeometry(r * (i % 2 ? 0.8 : 1.15), r * (i % 2 ? 1.15 : 0.8), h + 0.01, i % 3 === 0 ? 4 : 6), T, 0.4), painted ? pm(i) : i % 2 ? m : accentMat(T), { parent: c, at: [0, h / 2, 0], rot: [0, i * 0.4, 0] });
    } else if (kind === 'band') {
      body(r * 1.05, pm(i));
      for (let j = 0; j < 8; j++) mesh(new THREE.ConeGeometry(0.03, 0.08, 4).rotateX(Math.PI / 2), pm(i + 1), { parent: c, at: [Math.sin(j * Math.PI / 4) * r * 1.03, h / 2, Math.cos(j * Math.PI / 4) * r * 1.03], rot: [0, j * Math.PI / 4, 0] });
    } else if (kind === 'tiki') {
      body(r * 1.35, m);
      const R = r * 1.35;
      mesh(roundedBox(R * 1.9, 0.08, 0.1, 0.03), m, { parent: c, at: [0, h * 0.72, zf(R)] });
      for (const s of [-1, 1]) {
        mesh(new THREE.SphereGeometry(0.07, sg, 12), eyeW, { parent: c, at: [s * 0.1, h * 0.64, zf(R) - 0.02] });
        mesh(new THREE.SphereGeometry(0.035, 12, 8), eyeB, { parent: c, at: [s * 0.1, h * 0.64, zf(R) + 0.04] });
      }
      mesh(new THREE.ConeGeometry(0.08, 0.22, 4).rotateX(-0.3), m, { parent: c, at: [0, h * 0.5, zf(R) + 0.02] });
      mesh(roundedBox(0.34, 0.14, 0.08, 0.05), eyeB, { parent: c, at: [0, h * 0.3, zf(R) - 0.01] });
      for (let j = -2; j <= 2; j++) mesh(roundedBox(0.045, 0.06, 0.03, 0.01), eyeW, { parent: c, at: [j * 0.06, h * 0.32, zf(R) + 0.035] });
      mesh(new THREE.CylinderGeometry(R * 1.05, R * 0.95, 0.1, sg), m, { parent: c, at: [0, h + 0.03, 0] });
    } else {
      body(r, pm(i));
      const fz = zf(r);
      if (kind === 'face' || kind === 'bear' || kind === 'owl') {
        const er = kind === 'owl' ? 0.055 : 0.035;
        for (const s of [-1, 1]) {
          mesh(new THREE.SphereGeometry(er, 16, 10).scale(1, 1, 0.6), eyeW, { parent: c, at: [s * r * 0.4, h * 0.65, fz - 0.005] });
          mesh(new THREE.SphereGeometry(er * 0.5, 12, 8).scale(1, 1, 0.6), eyeB, { parent: c, at: [s * r * 0.4, h * 0.65, fz + er * 0.4] });
        }
      }
      if (kind === 'face') {
        mesh(roundedBox(r * 1.6, 0.04, 0.05, 0.015), pm(i + 1), { parent: c, at: [0, h * 0.8, fz] });
        mesh(new THREE.ConeGeometry(0.03, 0.09, 4).rotateX(-0.2), pm(i + 2), { parent: c, at: [0, h * 0.5, fz + 0.01] });
        mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16, Math.PI).rotateZ(Math.PI), pm(i + 3), { parent: c, at: [0, h * 0.3, fz - 0.005] });
      } else if (kind === 'bear') {
        for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.05, 14, 10), pm(i), { parent: c, at: [s * r * 0.75, h * 0.98, 0.02] });
        mesh(new THREE.SphereGeometry(0.06, 16, 10).scale(1.2, 0.8, 1), pm(i + 1), { parent: c, at: [0, h * 0.4, fz + 0.02] });
        mesh(new THREE.SphereGeometry(0.02, 10, 8), eyeB, { parent: c, at: [0, h * 0.44, fz + 0.075] });
      } else if (kind === 'owl') {
        mesh(new THREE.ConeGeometry(0.025, 0.07, 4).rotateX(Math.PI / 2 + 0.8), pm(i + 2), { parent: c, at: [0, h * 0.5, fz + 0.02] });
        for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.035, 0.1, 4), pm(i + 1), { parent: c, at: [s * r * 0.55, h + 0.04, 0] });
      } else if (kind === 'bird') {
        mesh(new THREE.ConeGeometry(0.06, 0.28, sg).rotateX(Math.PI / 2 + 0.25), pm(i + 1), { parent: c, at: [0, h * 0.55, fz + 0.12] });
        for (const s of [-1, 1]) {
          mesh(new THREE.SphereGeometry(0.03, 12, 8).scale(1, 1, 0.6), eyeW, { parent: c, at: [s * r * 0.45, h * 0.75, fz - 0.03] });
          const wing = extrudeOutline([[0, 0], [0.42, 0.18], [0.4, 0.26], [0.0, 0.2]], 0.04, { bevel: 0.01, segments: 2 });
          const wm = mesh(wing, pm(i + 2), { parent: c, at: [s * r * 0.9, h * 0.4, -0.02], rot: [0, 0, 0] });
          if (s < 0) wm.scale.x = -1;
        }
      }
    }
    y += h;
  });
  if (T.rough) t.rotation.z = 0.025;
  seat(root, t, top, 0.006);
  return done(root, 'totem', variant, o, [], T);
}

/* =============================== GARDEN ART =============================== */

export const GARDEN_VARIANTS = { sundial: {}, 'gazing-ball': {}, armillary: {}, 'bird-bath': {}, obelisk: {}, 'lattice-orb': {}, 'stone-lantern': {} };

export function createGardenSculpture(options = {}) {
  const { o, variant, trim, T } = setup(options, GARDEN_VARIANTS, 'garden-sculpture', { p: '#b9b2a5', finish: 'stone', plinth: 'block' });
  const root = group(`garden-${variant}`);
  const m = mainMat(T);
  const metalM = T.trim && ['bronze', 'gold', 'glass', 'pop-art'].includes(T.trim) ? accentMat(T) : fin(T, '#7b5a35', 'bronze');
  const sg = T.facet ? 8 : 40;
  const tall = ['sundial', 'gazing-ball', 'armillary', 'bird-bath'].includes(variant);
  // baluster pedestal (shape follows trim)
  let top = 0;
  const pedH = 0.75 * (T.slim ? 1.15 : 1);
  const pw = 0.32 * (T.chunky ? 1.25 : 1);
  if (tall) {
    if (T.chunky || T.plinth === 'cube') { mesh(treat(roundedBox(pw, pedH, pw, 0.01), T, 0.5), m, { parent: root, at: [0, pedH / 2, 0] }); top = pedH; capTop(root, pw * 0.95, top); }
    else {
      const prof = [[0, 0], [pw * 0.75, 0], [pw * 0.75, 0.05], [pw * 0.6, 0.08], [pw * 0.35, 0.16], [pw * 0.28, pedH * 0.45], [pw * 0.42, pedH * 0.6], [pw * 0.3, pedH * 0.75], [pw * 0.28, pedH * 0.88], [pw * 0.6, pedH * 0.94], [pw * 0.6, pedH], [0, pedH]];
      if (T.slim) prof.forEach((p) => { p[0] *= 0.8; });
      mesh(treat(lathe(prof, sg), T, 0.5), m, { parent: root });
      top = pedH;
      capTop(root, pw * (T.slim ? 0.9 : 1.1), top, true);
    }
  }
  const g = group('piece', { parent: root, at: [0, top - 0.004, 0] });
  if (variant === 'sundial') {
    mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.012, 48), metalM, { parent: g, at: [0, 0.006, 0] });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; mesh(roundedBox(0.008, 0.003, 0.035, 0.001), fin(T, '#2a2420', 'stone'), { parent: g, at: [Math.cos(a) * 0.18, 0.013, Math.sin(a) * 0.18], rot: [0, -a + Math.PI / 2, 0] }); }
    mesh(extrudeOutline([[-0.16, 0], [0.12, 0], [-0.16, 0.16]], 0.008, { bevel: 0.002, segments: 1 }), metalM, { parent: g, at: [0, 0.011, 0] });
  } else if (variant === 'gazing-ball') {
    mesh(lathe([[0, 0], [0.09, 0], [0.06, 0.04], [0.045, 0.06], [0, 0.06]], sg), metalM, { parent: g });
    const ballM = T.pop ? fin(T, '#ff2f6d', 'pop') : T.trim === 'glass' ? fin(T, '#3fa7d6', 'glass') : T.trim === 'gold' ? fin(T, '', 'gold') : T.trim === 'weathered' ? M.metal('#6d7a72', 0.5) : M.chrome();
    mesh(new THREE.SphereGeometry(0.15, 48, 32), ballM, { parent: g, at: [0, 0.2, 0] });
  } else if (variant === 'armillary') {
    mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.12, 20), metalM, { parent: g, at: [0, 0.06, 0] });
    const sph = group('sphere', { parent: g, at: [0, 0.32, 0], rot: [0, 0, 0.4] });
    const R = 0.2;
    mesh(new THREE.TorusGeometry(R, 0.008, 8, 64), metalM, { parent: sph });
    mesh(new THREE.TorusGeometry(R, 0.008, 8, 64).rotateY(Math.PI / 2), metalM, { parent: sph });
    mesh(new THREE.TorusGeometry(R, 0.012, 8, 64).rotateX(Math.PI / 2), metalM, { parent: sph });
    mesh(new THREE.TorusGeometry(R, 0.01, 8, 64).rotateX(Math.PI / 2 - 0.41), metalM, { parent: sph });
    mesh(new THREE.CylinderGeometry(0.005, 0.005, R * 2.4, 8), metalM, { parent: sph });
    mesh(new THREE.ConeGeometry(0.02, 0.05, 8), metalM, { parent: sph, at: [0, R * 1.2, 0] });
    g.getObjectByName('sphere').position.y = 0.12 + R - 0.006;
  } else if (variant === 'bird-bath') {
    // hollow bowl with inner wall + water
    const outer = [[0.03, 0], [0.12, 0.02], [0.24, 0.06], [0.3, 0.1], [0.31, 0.12], [0.29, 0.125], [0.27, 0.105], [0.2, 0.075], [0.0, 0.055]];
    mesh(treat(lathe(outer, sg), T, 0.5), dbl(m), { parent: g, name: 'bowl' });
    mesh(new THREE.CircleGeometry(0.24, 40).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ name: 'water', color: '#6fa8b8', roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.7 }), { parent: g, at: [0, 0.085, 0] });
    if (!T.pop) mesh(new THREE.SphereGeometry(0.03, 12, 10).scale(1.4, 0.9, 1), T.trim ? accentMat(T) : fin(T, '#5d4a3a', 'paint'), { parent: g, at: [0.27, 0.13, 0] });
    else mesh(new THREE.SphereGeometry(0.035, 12, 10).scale(1.4, 0.9, 1), fin(T, T.s, 'pop'), { parent: g, at: [0.27, 0.13, 0] });
  } else if (variant === 'obelisk') {
    const H = T.slim ? 1.8 : 1.4, b = T.chunky ? 0.36 : 0.26;
    mesh(roundedBox(b * 1.8, 0.12, b * 1.8, 0.01), m, { parent: g, at: [0, 0.06, 0] });
    mesh(roundedBox(b * 1.4, 0.1, b * 1.4, 0.01), m, { parent: g, at: [0, 0.165, 0] });
    const sh = new THREE.CylinderGeometry(b * 0.42, b * 0.7, H, 4, 6).rotateY(Math.PI / 4);
    mesh(treat(sh, T, 0.6), m, { parent: g, at: [0, 0.21 + H / 2, 0] });
    mesh(new THREE.ConeGeometry(b * 0.42 * Math.SQRT1_2 * 1.414, b * 0.5, 4).rotateY(Math.PI / 4), T.trim === 'gold' || !T.trim ? fin(T, '', 'gold') : accentMat(T), { parent: g, at: [0, 0.21 + H + b * 0.25 - 0.002, 0] });
  } else if (variant === 'lattice-orb') {
    const oM = !T.trim ? fin(T, '', 'rust') : m;
    const R = 0.42;
    mesh(latticeSphere(R, 0.018, 5, T.facet ? 1 : 2), oM, { parent: g, at: [0, R + 0.004, 0] });
    mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.07, 32), fin(T, '#3a3836', 'steel'), { parent: g, at: [0, 0.035, 0] });
  } else {
    // stone lantern: base, shaft, light box, roof, finial
    const lm = m;
    mesh(treat(new THREE.CylinderGeometry(0.22, 0.25, 0.08, 6), T, 0.4), lm, { parent: g, at: [0, 0.04, 0] });
    mesh(treat(new THREE.CylinderGeometry(0.07, 0.085, 0.45, T.facet ? 6 : 16), T, 0.4), lm, { parent: g, at: [0, 0.3, 0] });
    mesh(treat(new THREE.CylinderGeometry(0.2, 0.14, 0.08, 6), T, 0.4), lm, { parent: g, at: [0, 0.56, 0] });
    mesh(treat(roundedBox(0.24, 0.2, 0.24, 0.015), T, 0.4), lm, { parent: g, at: [0, 0.69, 0] });
    for (const [x, z] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) mesh(roundedBox(x ? 0.01 : 0.1, 0.1, x ? 0.1 : 0.01, 0.003), fin(T, '#2a2420', 'stone'), { parent: g, at: [x * 0.121, 0.7, z * 0.121] });
    const roof = new THREE.CylinderGeometry(0.06, 0.34, 0.16, 6);
    const p = roof.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) < -0.07) p.setY(i, p.getY(i) + 0.03 * (Math.hypot(p.getX(i), p.getZ(i)) / 0.34) ** 3);
    roof.computeVertexNormals();
    mesh(treat(roof, T, 0.4), lm, { parent: g, at: [0, 0.86, 0] });
    mesh(new THREE.SphereGeometry(0.05, 16, 12).scale(1, 1.3, 1), lm, { parent: g, at: [0, 0.97, 0] });
  }
  if (!tall) { top = plinthBase(root, T, variant === 'lattice-orb' ? 0.6 : 0.5, { h: T.plinth === 'block' ? 0.06 : ['column', 'tall', 'slender'].includes(T.plinth) ? 0.3 : undefined }); }
  seat(root, g, top, 0.004);
  return done(root, 'garden-sculpture', variant, o, [], T);
}
