// Brass (trumpet, cornet, flugelhorn, trombone, tuba, euphonium, French horn, sousaphone) and
// woodwinds (saxophones, clarinet, flute, piccolo, oboe, bassoon, recorder, harmonica, pan flute).
// Each sits on its own stand (bell peg, cradle, cup) or rests on the floor.
import {
  THREE, M, mesh, group, roundedBox, curveTube, lathe, tube, setup, done, fin, hwMat, brassMat, woodMat, merged, segGeo, bar, lowestPoint, plate, blob,
} from './common.js';
import { clip, rotateTrack, scaleTrack, moveTrack, wave } from '../../core/animation.js';
import { brandEmblem } from '../../core/brand.js';

/** Flared bell along +Y: throat radius rT at y=0, mouth radius rB at y=L. Sharp trims → faceted. */
function bellGeo(rT, rB, L, T, { pow = 4, lip = true } = {}) {
  const seg = T.sharp === 2 ? 6 : T.sharp ? 10 : 40;
  const prof = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16; prof.push([rT + (rB - rT) * t ** pow, t * L]); }
  if (lip) { const lr = T.round ? 0.012 : 0.005; prof.push([rB + lr * 0.6, L + lr * 0.2], [rB + lr * 0.4, L - lr * 0.6], [rB - 0.001, L - lr * 0.2]); }
  const g = lathe(prof, seg);
  if (T.wear) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > L * 0.6 && Math.sin(i * 12.9898) > 0.85) { p.setX(i, p.getX(i) * 0.94); p.setZ(i, p.getZ(i) * 0.94); } } g.computeVertexNormals(); }
  return g;
}
/** Bell mesh pointing along `dir` from `at`. */
function bell(parent, T, mat, rT, rB, L, at, dir = [1, 0, 0], name = 'bell', opts) {
  const g = bellGeo(rT, rB, L, T, opts);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize()));
  const m = mesh(g, mat, { parent, at, name });
  m.material = m.material.clone();
  m.material.side = THREE.DoubleSide;
  if (T.ornate) { // garland ring + engraving band
    const ring = new THREE.TorusGeometry(rB * 0.93, 0.004, 6, 40).rotateX(Math.PI / 2).translate(0, L * 0.93, 0);
    ring.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize()));
    mesh(ring, M.metal('#f6e3a1', 0.15), { parent, at, name: `${name}_garland` });
  }
  return m;
}
function mouthpiece(parent, mat, at, dir, s = 1) {
  const g = lathe([[0.004 * s, 0], [0.005 * s, 0.05 * s], [0.008 * s, 0.07 * s], [0.013 * s, 0.085 * s], [0.012 * s, 0.088 * s], [0.006 * s, 0.08 * s]], 20);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize()));
  return mesh(g, M.chrome(), { parent, at, name: 'mouthpiece' }) && void mat;
}
/** Three piston valves with finger buttons, centred at (x,y) spanning dy, spacing dx. */
function pistons(parent, T, mat, x0, y0, z0, n = 3, { dx = 0.024, h = 0.11, r = 0.0085 } = {}) {
  const g = [], b = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * dx;
    g.push(new THREE.CylinderGeometry(r, r, h, 16).translate(x, y0, z0));
    g.push(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 0.008, 16).translate(x, y0 + h / 2, z0));
    g.push(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 0.008, 16).translate(x, y0 - h / 2, z0));
    g.push(new THREE.CylinderGeometry(0.0025, 0.0025, 0.03, 6).translate(x, y0 + h / 2 + 0.015, z0));
    b.push(new THREE.CylinderGeometry(0.008, 0.008, 0.005, 16).translate(x, y0 + h / 2 + 0.032, z0));
  }
  merged(g, mat, { parent, name: 'valves' });
  merged(b, T.kids ? fin(T, T.a, 'plastic') : M.matte('#f3efe6', 0.3), { parent, name: 'valve_buttons' });
}

/** Tripod with a cone peg that fits up into a bell whose rim sits at height y (radius r). */
function pegStand(parent, T, y, r, { x = 0, z = 0, depth } = {}) {
  const sm = T.trim === 'gold' ? hwMat(T) : M.metal('#1c1d20', 0.4);
  const d = depth ?? r * 2.2;
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.3; const sp = Math.max(0.14, r * 2.4); bar([x, Math.min(0.1, y * 0.4), z], [x + Math.cos(a) * sp, 0.01, z + Math.sin(a) * sp], 0.006, sm, parent, 'peg_leg'); mesh(new THREE.SphereGeometry(0.012, 8, 6), M.rubber(), { parent, at: [x + Math.cos(a) * sp, 0.01, z + Math.sin(a) * sp] }); }
  bar([x, 0.05, z], [x, y - 0.01, z], 0.008, sm, parent, 'peg_post');
  mesh(new THREE.ConeGeometry(r * 0.92, d, 20, 1, true).translate(0, d / 2, 0), M.fabric('#1a1a1a'), { parent, at: [x, y - 0.012, z], name: 'peg_cone' }).material.side = THREE.DoubleSide;
}

/* ================================== BRASS ================================== */
export const BRASS_VARIANTS = {
  trumpet: { kind: 'trumpet', L: 0.48, bellR: 0.062 },
  cornet: { kind: 'trumpet', L: 0.36, bellR: 0.06, compact: true },
  flugelhorn: { kind: 'trumpet', L: 0.42, bellR: 0.077, wide: true },
  trombone: { kind: 'trombone' },
  tuba: { kind: 'tuba', H: 0.95, bellR: 0.22, valves: 4 },
  euphonium: { kind: 'tuba', H: 0.66, bellR: 0.15, valves: 4 },
  'french-horn': { kind: 'horn' },
  sousaphone: { kind: 'sousa' },
};

function buildTrumpet(T, V, bm) {
  const g = group('trumpet');
  const k = (V.L / 0.48) * (T.kids ? 0.85 : 1);
  const bellL = (V.compact ? 0.25 : V.wide ? 0.3 : 0.36) * k * (T.trim === 'sunburst' ? 1.12 : 1);
  const bR = V.bellR * (T.trim === 'natural' ? 1.12 : T.round ? 0.92 : 1);
  const tail = -0.12 * k;
  bell(g, T, bm, V.wide ? 0.008 : 0.0058, bR, bellL + 0.12 * k, [tail, 0, 0], [1, 0, 0], 'bell', { pow: V.wide ? 2.5 : 4 });
  const tr = 0.0058;
  // main tuning slide loop back from the bell tail, then forward into the valves
  curveTube([[tail + 0.002, 0, 0], [-0.2 * k, 0, 0], [-0.235 * k, -0.035 * k, 0], [-0.2 * k, -0.07 * k, 0], [-0.03 * k, -0.07 * k, 0]], tr, bm, { parent: g, name: 'tuning_slide', segments: 32, radialSegments: 10 });
  if (V.compact || T.round) curveTube([[-0.03 * k, -0.07 * k, 0], [0.04 * k, -0.07 * k, 0], [0.07 * k, -0.1 * k, 0], [0.04 * k, -0.13 * k, 0], [-0.05 * k, -0.12 * k, 0]], tr, bm, { parent: g, name: 'extra_wrap', segments: 24, radialSegments: 10 });
  pistons(g, T, bm, -0.05 * k, -0.04 * k, 0, 3, { h: 0.1 * k });
  // valve slides hanging below
  for (let i = 0; i < 3; i++) curveTube([[-0.05 * k + i * 0.024, -0.09 * k, 0.004], [-0.05 * k + i * 0.024, -0.12 * k - i * 0.01, 0.012], [-0.05 * k + i * 0.024 + 0.012, -0.13 * k - i * 0.01, 0.02], [-0.05 * k + i * 0.024 + 0.012, -0.09 * k, 0.01]], 0.0045, bm, { parent: g, name: `vslide_${i}`, segments: 16, radialSegments: 8 });
  // lead pipe to the mouthpiece
  bar([-0.06 * k, -0.02 * k, 0], [-0.3 * k, -0.02 * k, 0], 0.0055, bm, g, 'leadpipe');
  mouthpiece(g, bm, [-0.3 * k, -0.02 * k, 0], [-1, 0, 0], k);
  // braces + finger hook
  bar([0.02 * k, 0, 0], [0.02 * k, -0.07 * k, 0], 0.003, bm, g, 'brace');
  bar([-0.16 * k, 0, 0], [-0.16 * k, -0.02 * k, 0], 0.003, bm, g, 'brace');
  if (V.wide) for (let i = 0; i < 2; i++) bar([-0.1 * k + i * 0.05, 0, 0], [-0.1 * k + i * 0.05, -0.07 * k, 0], 0.003, bm, g, 'brace');
  return { g, rimX: tail + bellL + 0.12 * k, bR };
}

export function createBrass(options = {}) {
  const { o, variant, T, V } = setup(options, BRASS_VARIANTS, 'brass');
  const root = group(`brass-${variant}`);
  const bm = brassMat(T);
  const anims = [];
  if (V.kind === 'trumpet') {
    const { g, rimX, bR } = buildTrumpet(T, V, bm);
    // bell down onto a peg stand
    g.rotation.z = -Math.PI / 2;
    const rimY = 0.32;
    g.position.set(0, rimY + rimX, 0);
    root.add(g);
    pegStand(root, T, rimY, bR);
    anims.push(clip('play', 0.6, [0, 1, 2].map((i) => moveTrack(g.getObjectByName('valve_buttons'), 0.6, (t) => [0, -0.004 * Math.max(0, Math.sin((t + i * 0.3) * Math.PI * 2)), 0]))));
  } else if (V.kind === 'trombone') {
    const k = T.kids ? 0.8 : 1;
    const g = group('trombone');
    const bR = (T.trim === 'natural' ? 0.11 : 0.1) * k;
    const bellL = 0.62 * k;
    // bell section along +x, mouth at x = 0
    bell(g, T, bm, 0.0065, bR, bellL, [-bellL, 0, 0], [1, 0, 0], 'bell', { pow: 4.5 });
    curveTube([[-bellL, 0, 0], [-bellL - 0.06 * k, 0, 0], [-bellL - 0.08 * k, -0.04 * k, 0], [-bellL - 0.06 * k, -0.08 * k, 0], [-bellL + 0.1 * k, -0.08 * k, 0]], 0.0065, bm, { parent: g, name: 'gooseneck', segments: 24, radialSegments: 10 });
    // slide: two long tubes forward, U bend at the far end (beyond the bell)
    const sl = 0.92 * k;
    const sx0 = -bellL + 0.1 * k;
    const slide = group('slide', { parent: g });
    for (const z of [0, 0]) void z;
    bar([sx0, -0.08 * k, 0], [sx0 + sl, -0.08 * k, 0], 0.0062, bm, slide, 'slide_a');
    bar([sx0, -0.08 * k, -0.06 * k], [sx0 + sl, -0.08 * k, -0.06 * k], 0.0062, bm, slide, 'slide_b');
    curveTube([[sx0 + sl, -0.08 * k, 0], [sx0 + sl + 0.03 * k, -0.08 * k, -0.01 * k], [sx0 + sl + 0.03 * k, -0.08 * k, -0.05 * k], [sx0 + sl, -0.08 * k, -0.06 * k]], 0.0065, bm, { parent: slide, name: 'slide_bow', segments: 16 });
    mesh(new THREE.SphereGeometry(0.012, 10, 8), M.rubber(), { parent: slide, at: [sx0 + sl + 0.035 * k, -0.08 * k, -0.03 * k], name: 'bumper' });
    bar([sx0 + 0.1 * k, -0.08 * k, 0], [sx0 + 0.1 * k, -0.08 * k, -0.06 * k], 0.003, bm, slide, 'slide_brace');
    bar([sx0 + 0.02, -0.08 * k, 0], [sx0 + 0.02, 0, 0], 0.004, bm, g, 'bell_brace');
    bar([sx0 - 0.02, -0.08 * k, -0.06 * k], [-0.32 * k, -0.08 * k, -0.06 * k], 0.006, bm, g, 'leadpipe');
    mouthpiece(g, bm, [-0.32 * k, -0.08 * k, -0.06 * k], [-1, 0, 0], k * 1.2);
    if (T.round || T.ornate) curveTube([[-bellL * 0.6, 0, 0], [-bellL * 0.6, 0, 0.06 * k], [-bellL * 0.3, -0.04 * k, 0.07 * k], [-bellL * 0.3, -0.08 * k, 0.0]], 0.0065, bm, { parent: g, name: 'f_attachment', segments: 20 });
    // stand upright: bell down on a peg, slide bow resting on the base
    g.rotation.z = -Math.PI / 2;
    root.add(g);
    root.updateMatrixWorld(true);
    const lp = lowestPoint(g);
    g.position.y += 0.02 - lp.y;
    root.updateMatrixWorld(true);
    const rim = new THREE.Vector3(0, 0, 0).applyMatrix4(g.matrixWorld);
    pegStand(root, T, rim.y, bR, { x: rim.x, z: rim.z });
    const bmp = g.getObjectByName('bumper');
    const bp = new THREE.Vector3().setFromMatrixPosition(bmp.matrixWorld);
    mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.02, 16), M.rubber(), { parent: root, at: [bp.x, 0.01, bp.z], name: 'slide_cup' });
    bar([bp.x, 0.01, bp.z], [rim.x, 0.01, rim.z], 0.006, M.metal('#1c1d20', 0.4), root, 'cup_arm');
    anims.push(clip('play', 1.5, [moveTrack(slide, 1.5, (t) => [0.12 * k * (0.5 - 0.5 * Math.cos(t * Math.PI * 2)), 0, 0])]));
  } else if (V.kind === 'tuba') {
    const k = T.kids ? 0.7 : 1;
    const H = V.H * k, bR = V.bellR * k * (T.trim === 'natural' ? 1.1 : 1);
    const g = group('tuba', { parent: root });
    const baseY = 0.1;
    // conical main column rising to the bell
    const colX = 0.06 * k;
    bell(g, T, bm, 0.035 * k, bR, H - baseY - 0.12 * k, [colX, baseY + 0.12 * k, 0], [0, 1, 0], 'bell', { pow: 3 });
    // bottom bow joining the column to the valve branch
    const vx = -0.12 * k;
    curveTube([[colX, baseY + 0.12 * k, 0], [colX, baseY + 0.03 * k, 0], [(colX + vx) / 2, baseY - 0.03 * k, 0], [vx, baseY + 0.03 * k, 0], [vx, baseY + 0.1 * k, 0]], 0.032 * k, bm, { parent: g, name: 'bottom_bow', segments: 32, radialSegments: 14 });
    curveTube([[vx, baseY + 0.1 * k, 0], [vx, H * 0.45, 0], [vx + 0.02, H * 0.6, 0.02], [colX - 0.02, H * 0.62, 0.03]], 0.02 * k, bm, { parent: g, name: 'branch', segments: 24, radialSegments: 12 });
    pistons(g, T, bm, vx - 0.02 * k, H * 0.42, 0.06 * k, V.valves, { dx: 0.035 * k, h: 0.15 * k, r: 0.013 * k });
    for (let i = 0; i < V.valves; i++) bar([vx - 0.02 * k + i * 0.035 * k, H * 0.42, 0.06 * k], [Math.min(vx + 0.02, vx - 0.02 * k + i * 0.035 * k), H * 0.42, 0.0], 0.008 * k, bm, g, 'valve_link');
    // loops
    curveTube([[vx, H * 0.3, 0], [vx - 0.12 * k, H * 0.32, -0.04], [vx - 0.14 * k, H * 0.45, -0.06], [vx - 0.05 * k, H * 0.52, -0.02], [vx, H * 0.5, 0]], 0.014 * k, bm, { parent: g, name: 'tuning_loop', segments: 32 });
    curveTube([[vx, H * 0.55, 0.03], [vx - 0.05, H * 0.7, 0.1], [vx - 0.02, H * 0.8, 0.18], [vx - 0.1, H * 0.82, 0.25]], 0.007 * k, bm, { parent: g, name: 'leadpipe', segments: 24 });
    mouthpiece(g, bm, [vx - 0.1, H * 0.82, 0.25], [-0.6, 0, 0.8], 1.3 * k);
    // padded floor ring cradling the bottom bow
    g.updateMatrixWorld(true);
    const lp = lowestPoint(g);
    g.position.y += 0.06 - lp.y;
    mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 28).rotateX(Math.PI / 2), M.rubber(), { parent: root, at: [lp.x, 0.045, lp.z], name: 'cradle_ring' });
    mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.03, 28), M.metal('#1c1d20', 0.4), { parent: root, at: [lp.x, 0.015, lp.z], name: 'stand_base' });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; bar([lp.x + Math.cos(a) * 0.06, 0.045, lp.z + Math.sin(a) * 0.06], [lp.x + Math.cos(a) * 0.1, 0.02, lp.z + Math.sin(a) * 0.1], 0.006, M.metal('#1c1d20', 0.4), root, 'cradle_arm'); }
    anims.push(clip('play', 0.6, [moveTrack(g.getObjectByName('valve_buttons'), 0.6, (t) => [0, -0.005 * Math.max(0, Math.sin(t * Math.PI * 2)), 0])]));
  } else if (V.kind === 'horn') {
    const k = T.kids ? 0.8 : 1;
    const g = group('horn');
    const R = 0.15 * k;
    // coils: two concentric loops in the XY plane
    for (const [rr, z] of [[R, 0], [R * 0.82, 0.03 * k], [R * 0.65, -0.02 * k]]) mesh(new THREE.TorusGeometry(rr, 0.0065 * (rr / R + 0.3), 10, 64), bm, { parent: g, at: [0, 0, z], name: 'coil' });
    // bell growing out of the coil, pointing down-right
    const bR = (T.trim === 'natural' ? 0.17 : 0.155) * k;
    const bellStart = [R * 0.7, -R * 0.7, 0];
    bell(g, T, bm, 0.012, bR, 0.32 * k, bellStart, [0.45, -1, 0], 'bell', { pow: 3.5 });
    // rotary valves + levers at the centre
    const rv = [];
    for (let i = 0; i < (T.ornate ? 4 : 3); i++) rv.push(new THREE.CylinderGeometry(0.014 * k, 0.014 * k, 0.05 * k, 16).rotateX(Math.PI / 2).translate(-0.04 * k + i * 0.032 * k, R * 0.1, 0));
    merged(rv, bm, { parent: g, name: 'rotors' });
    for (let i = 0; i < 3; i++) bar([-0.04 * k + i * 0.032 * k, R * 0.1, 0.03 * k], [-0.04 * k + i * 0.032 * k - 0.03, R * 0.1 + 0.07 * k, 0.04 * k], 0.003, bm, g, 'lever');
    for (const a of [0.2, 1.4, 2.6, 4.0, 5.2]) bar([Math.cos(a) * R * 0.65, Math.sin(a) * R * 0.65, -0.02 * k], [Math.cos(a) * R, Math.sin(a) * R, 0], 0.0035, bm, g, 'coil_brace');
    bar([-0.04 * k, R * 0.1, 0], [-R * 0.65, R * 0.1, -0.02 * k], 0.007, bm, g, 'valve_link');
    bar([0.03 * k, R * 0.1, 0], [R * 0.82, 0.0, 0.03 * k], 0.007, bm, g, 'valve_link2');
    curveTube([[-R * 0.95, R * 0.3, 0], [-R * 1.3, R * 0.7, 0.03], [-R * 1.6, R * 0.9, 0.05]], 0.0055, bm, { parent: g, name: 'leadpipe', segments: 16 });
    mouthpiece(g, bm, [-R * 1.6, R * 0.9, 0.05], [-0.8, 0.5, 0], k);
    // stand bell-down on a peg
    const dir = new THREE.Vector3(0.45, -1, 0).normalize();
    g.rotation.z = -Math.atan2(dir.x, -dir.y);
    root.add(g);
    root.updateMatrixWorld(true);
    const rimLocal = new THREE.Vector3(...bellStart).addScaledVector(dir, 0.32 * k);
    const rim = rimLocal.clone().applyMatrix4(g.matrixWorld);
    g.position.y += 0.3 - rim.y;
    g.position.x -= rim.x;
    root.updateMatrixWorld(true);
    pegStand(root, T, 0.3, bR, { depth: bR * 0.7 });
    anims.push(clip('play', 0.6, [rotateTrack(g.getObjectByName('rotors'), 'z', 0.6, (t) => 0.02 * wave(t), 12)]));
  } else {
    // sousaphone resting on its big loop in a floor cradle
    const k = T.kids ? 0.7 : 1;
    const g = group('sousaphone', { parent: root });
    const R = 0.38 * k;
    const loop = mesh(new THREE.TorusGeometry(R, 0.045 * k, 14, 64, Math.PI * 1.6), bm, { parent: g, at: [0, R + 0.1, 0], rot: [0, 0, -Math.PI * 0.3], name: 'sousa_loop' });
    void loop;
    const top = new THREE.Vector3(Math.cos(Math.PI * 1.3) * R, R + 0.1 + Math.sin(Math.PI * 1.3) * R, 0);
    const bR = (T.trim === 'natural' ? 0.36 : 0.32) * k;
    curveTube([[R * Math.cos(-Math.PI * 0.3), R + 0.1 + R * Math.sin(-Math.PI * 0.3), 0], [R * 0.9, R * 2.2, 0], [R * 0.3, R * 2.7, 0.05], [-0.0, R * 2.7, 0.15]], 0.05 * k, bm, { parent: g, name: 'gooseneck', segments: 32, radialSegments: 14 });
    bell(g, T, T.trim ? bm : new THREE.MeshPhysicalMaterial({ name: 'fibreglass', color: '#f2efe6', roughness: 0.3, clearcoat: 1 }), 0.05 * k, bR, 0.45 * k, [0, R * 2.7, 0.15], [0, 0.2, 1], 'bell', { pow: 2.5 });
    pistons(g, T, bm, top.x - 0.02, top.y + 0.05, 0.06, 3, { dx: 0.035 * k, h: 0.15 * k, r: 0.013 * k });
    bar([top.x, top.y, 0], [top.x + 0.05, top.y + 0.05, 0.06], 0.012, bm, g, 'valve_link');
    curveTube([[top.x + 0.04, top.y + 0.1, 0.06], [top.x + 0.1, top.y + 0.3, 0.1], [top.x + 0.2, top.y + 0.35, 0.2]], 0.007, bm, { parent: g, name: 'leadpipe', segments: 16 });
    mouthpiece(g, bm, [top.x + 0.2, top.y + 0.35, 0.2], [1, 0.2, 0.4], 1.3 * k);
    g.updateMatrixWorld(true);
    const lp = lowestPoint(g);
    g.position.y += 0.06 - lp.y;
    mesh(roundedBox(0.3, 0.05, 0.22, 0.02), M.metal('#1c1d20', 0.4), { parent: root, at: [lp.x, 0.025, lp.z], name: 'cradle_base' });
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16, 1, true).rotateZ(Math.PI / 2), M.rubber(), { parent: root, at: [lp.x, 0.05, lp.z], name: 'cradle_pad' });
    anims.push(clip('play', 0.6, [moveTrack(g.getObjectByName('valve_buttons'), 0.6, (t) => [0, -0.005 * Math.max(0, Math.sin(t * Math.PI * 2)), 0])]));
  }
  return done(root, 'brass', variant, o, anims);
}

/* ================================= WOODWIND ================================= */
export const WOODWIND_VARIANTS = {
  'alto-sax': { kind: 'sax', H: 0.62 },
  'tenor-sax': { kind: 'sax', H: 0.82, tenor: true },
  'soprano-sax': { kind: 'soprano' },
  clarinet: { kind: 'pipe', L: 0.66, r: 0.0075, bellR: 0.032, col: '#141414' },
  oboe: { kind: 'pipe', L: 0.6, r: 0.0085, bellR: 0.022, col: '#1c1410', conical: true, reed: true },
  flute: { kind: 'flute', L: 0.67 },
  piccolo: { kind: 'flute', L: 0.32, piccolo: true },
  bassoon: { kind: 'bassoon' },
  recorder: { kind: 'recorder', L: 0.32 },
  harmonica: { kind: 'harmonica' },
  'pan-flute': { kind: 'panflute' },
};

function keyCups(parent, T, axisPts, r, n, name = 'keys') {
  const g = [];
  const [a, b] = axisPts.map((p) => new THREE.Vector3(...p));
  for (let i = 0; i < n; i++) {
    const t = 0.12 + (i / Math.max(1, n - 1)) * 0.72;
    const p = a.clone().lerp(b, t);
    g.push(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.004, 14).rotateX(Math.PI / 2).translate(p.x, p.y, p.z + r + 0.001));
    g.push(new THREE.CylinderGeometry(0.0012, 0.0012, 0.03, 4).rotateZ(Math.PI / 2).translate(p.x + 0.012, p.y, p.z + r * 0.8));
  }
  g.push(segGeo([a.x + r * 0.9, a.y, a.z + r * 0.6], [b.x + r * 0.9, b.y, b.z + r * 0.6], 0.0015, 4));
  return merged(g, T.trim === 'gold' ? hwMat(T) : T.kids ? fin(T, T.a, 'plastic') : T.trim === 'black' ? hwMat(T) : M.metal('#d8d6d0', 0.18), { parent, name });
}

function woodwindMat(T, def) {
  if (!T.trim) return new THREE.MeshPhysicalMaterial({ name: 'grenadilla', color: def, roughness: 0.3, clearcoat: 0.7 });
  if (T.trim === 'vintage') return M.wood('#4a2412');
  if (T.trim === 'natural') return M.wood('#d9b98a');
  if (T.trim === 'sunburst') return fin(T, '#8a3a12', 'gloss');
  if (T.trim === 'gold') return hwMat(T);
  if (T.trim === 'relic') return fin(T, '#2a2420', 'worn');
  return fin(T, T.trim === 'neon' || T.kids ? T.p : T.p);
}

export function createWoodwind(options = {}) {
  const { o, variant, T, V } = setup(options, WOODWIND_VARIANTS, 'woodwind');
  const root = group(`woodwind-${variant}`);
  const anims = [];
  const k = T.kids ? 0.75 : 1;
  if (V.kind === 'sax') {
    const bm = brassMat(T);
    const H = V.H * k;
    const g = group('sax', { parent: root });
    const bowY = 0.16;
    const bowR = 0.05 * k * (V.tenor ? 1.15 : 1);
    // body (conical) up from the bow
    const body = lathe([[0.034 * k, 0], [0.026 * k, H * 0.45], [0.016 * k, H * 0.85], [0.013 * k, H - bowY]], T.sharp ? 8 : 28);
    mesh(body, bm, { parent: g, at: [0, bowY, 0], name: 'sax_body' });
    // U bow
    mesh(new THREE.TorusGeometry(bowR, 0.036 * k, 14, 24, Math.PI), bm, { parent: g, at: [bowR, bowY, 0], rot: [0, 0, Math.PI], name: 'sax_bow' });
    // bell column rising and flaring
    bell(g, T, bm, 0.037 * k, (T.trim === 'natural' ? 0.08 : 0.072) * k, 0.26 * k * (V.tenor ? 1.15 : 1), [bowR * 2, bowY, 0], [0.15, 1, 0], 'bell', { pow: 2.5 });
    // neck + mouthpiece
    const nt = [0, bowY + H - bowY, 0];
    curveTube([nt, [0, nt[1] + 0.06 * k, 0], [-0.03 * k, nt[1] + (V.tenor ? 0.13 : 0.1) * k, 0], [-0.1 * k, nt[1] + (V.tenor ? 0.14 : 0.11) * k, 0]], 0.009 * k, bm, { parent: g, name: 'sax_neck', segments: 24, radialSegments: 10 });
    mesh(new THREE.CylinderGeometry(0.008 * k, 0.011 * k, 0.07 * k, 14).rotateZ(Math.PI / 2), M.plastic('#141414', 0.3), { parent: g, at: [-0.13 * k, nt[1] + (V.tenor ? 0.14 : 0.11) * k, 0], name: 'sax_mouthpiece' });
    // keys
    keyCups(g, T, [[0.0, bowY + 0.06, 0.0], [0.0, H - 0.04, 0.0]], 0.024 * k, T.kids ? 5 : 9, 'sax_keys');
    const pearls = [];
    for (let i = 0; i < 6; i++) pearls.push(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 12).rotateX(Math.PI / 2).translate(-0.002, bowY + H * 0.35 + i * H * 0.08, 0.03 * k));
    merged(pearls, M.matte('#f3efe6', 0.3), { parent: g, name: 'pearls' });
    if (T.ornate || T.round) mesh(new THREE.TorusGeometry(0.06 * k, 0.003, 6, 30).rotateX(Math.PI / 2), M.metal('#f6e3a1', 0.15), { parent: g, at: [bowR * 2 + 0.035 * k, bowY + 0.24 * k, 0], name: 'engraving' });
    // sax stand: cup under the bow, post with yoke at the body
    const lp = lowestPoint(g);
    g.position.y += 0.12 - lp.y;
    g.updateMatrixWorld(true);
    const sm = M.metal('#1c1d20', 0.4);
    const lp2 = lowestPoint(g);
    mesh(lathe([[0, 0], [0.05, 0], [0.065, 0.03], [0.06, 0.03], [0.045, 0.006], [0, 0.006]], 24), M.rubber(), { parent: root, at: [lp2.x, lp2.y - 0.006, lp2.z], name: 'cup' });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; bar([lp2.x, lp2.y - 0.005, lp2.z], [lp2.x + Math.cos(a) * 0.2, 0.01, lp2.z + Math.sin(a) * 0.2], 0.007, sm, root, 'sax_leg'); }
    const yokeY = 0.12 + H * 0.45;
    bar([lp2.x, lp2.y - 0.005, lp2.z - 0.05], [0, yokeY, -0.04 * k], 0.007, sm, root, 'sax_post');
    bar([lp2.x, lp2.y - 0.005, lp2.z], [lp2.x, lp2.y - 0.005, lp2.z - 0.05], 0.007, sm, root, 'sax_post_foot');
    curveTube([[-0.035, yokeY + 0.02, 0.0], [-0.03, yokeY, -0.03 * k], [0, yokeY - 0.005, -0.04 * k], [0.03, yokeY, -0.03 * k], [0.035, yokeY + 0.02, 0.0]], 0.006, M.rubber(), { parent: root, name: 'yoke', segments: 16 });
    anims.push(clip('play', 0.8, [rotateTrack(g.getObjectByName('sax_keys'), 'y', 0.8, (t) => 0.02 * wave(t, 2), 16)]));
  } else if (V.kind === 'soprano' || V.kind === 'pipe') {
    // straight instrument standing bell-down on a peg stand
    const sop = V.kind === 'soprano';
    const L = (sop ? 0.6 : V.L) * k;
    const bm = sop ? brassMat(T) : woodwindMat(T, V.col);
    const g = group('pipe', { parent: root });
    const bellR = (sop ? 0.045 : V.bellR) * k;
    const bellL = (sop ? 0.18 : 0.1) * k;
    const rimY = 0.18;
    bell(g, T, bm, (sop ? 0.02 : V.r * 1.4) * k, bellR, bellL, [0, rimY + bellL, 0], [0, -1, 0], 'bell', { pow: sop ? 2 : 3, lip: !sop });
    const r0 = (sop ? 0.02 : V.r * 1.4) * k, r1 = (sop ? 0.009 : V.conical ? V.r * 0.7 : V.r) * k;
    mesh(lathe([[r0, 0], [r1, L - bellL]], T.sharp ? 8 : 20), bm, { parent: g, at: [0, rimY + bellL, 0], name: 'pipe_body' });
    const topY = rimY + L;
    if (!sop) for (const yy of [0.3, 0.55, 0.8]) mesh(new THREE.CylinderGeometry(r1 * 1.35, r1 * 1.35, 0.012, 18), M.metal('#d8d6d0', 0.2), { parent: g, at: [0, rimY + bellL + (L - bellL) * yy, 0], name: 'tenon_ring' });
    if (!sop && !V.reed) { mesh(new THREE.CylinderGeometry(r1 * 1.5, r1 * 1.4, 0.06 * k, 18), bm, { parent: g, at: [0, topY + 0.03 * k, 0], name: 'barrel' }); mesh(lathe([[r1 * 1.3, 0], [r1 * 1.2, 0.05 * k], [r1 * 0.6, 0.09 * k], [0.001, 0.092 * k]], 16), M.plastic('#111', 0.3), { parent: g, at: [0, topY + 0.06 * k, 0], name: 'mouthpiece' }); }
    else if (V.reed) { mesh(new THREE.CylinderGeometry(0.0025, 0.002, 0.05, 8), M.metal('#d8d6d0', 0.2), { parent: g, at: [0, topY + 0.025, 0], name: 'staple' }); mesh(new THREE.BoxGeometry(0.007, 0.03, 0.0015), M.matte('#d9c08a', 0.6), { parent: g, at: [0, topY + 0.06, 0], name: 'reed' }); }
    else { curveTube([[0, topY, 0], [0, topY + 0.04, 0], [0, topY + 0.07, 0.01]], 0.008, bm, { parent: g, name: 'sop_neck', segments: 8 }); mesh(new THREE.CylinderGeometry(0.007, 0.01, 0.06, 12), M.plastic('#141414', 0.3), { parent: g, at: [0, topY + 0.1, 0.012], name: 'mouthpiece' }); }
    keyCups(g, T, [[0, rimY + bellL + 0.02, 0], [0, topY - 0.03, 0]], sop ? 0.016 * k : r1 * 1.5, T.kids ? 5 : sop ? 10 : 12, 'pipe_keys');
    pegStand(root, T, rimY, bellR, { depth: bellL * 0.9 });
    anims.push(clip('play', 0.8, [rotateTrack(g.getObjectByName('pipe_keys'), 'y', 0.8, (t) => 0.03 * wave(t, 2), 16)]));
  } else if (V.kind === 'flute') {
    // flute standing on a peg that slips into the open foot joint
    const L = V.L * k, r = (V.piccolo ? 0.0065 : 0.0095) * k;
    const fm = T.trim ? (T.trim === 'vintage' || T.trim === 'natural' ? M.wood(T.trim === 'natural' ? '#d9b98a' : '#3a1a0c') : T.trim === 'sunburst' ? M.metal('#d79a6a', 0.18) : T.trim === 'gold' ? hwMat(T) : T.kids || T.neon ? fin(T, T.p, T.neon ? 'neon' : 'plastic') : T.trim === 'black' ? M.metal('#1e1e22', 0.25) : T.trim === 'white' ? fin(T, '#f2efe6', 'gloss') : M.metal('#a8a49a', 0.5)) : M.metal('#e4e4e8', 0.12);
    const g = group('flute', { parent: root });
    const base = 0.06;
    const ft = mesh(new THREE.CylinderGeometry(r, r, L, 20, 1, true), fm, { parent: g, at: [0, base + L / 2, 0], name: 'flute_tube' });
    ft.material.side = THREE.DoubleSide;
    mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.1, 0.012, 18), fm, { parent: g, at: [0, base + L + 0.006, 0], name: 'crown' });
    mesh(roundedBox(0.012 * k, 0.03 * k, 0.004, 0.002), fm, { parent: g, at: [0, base + L - 0.06 * k, r + 0.0015], name: 'lip_plate' });
    mesh(new THREE.CylinderGeometry(0.003 * k, 0.003 * k, 0.002, 12).rotateX(Math.PI / 2), M.matte('#0a0a0a'), { parent: g, at: [0, base + L - 0.06 * k, r + 0.0036], name: 'embouchure' });
    keyCups(g, T, [[0, base + 0.03, 0], [0, base + L * 0.68, 0]], r * 1.25, T.kids ? 6 : V.piccolo ? 8 : 13, 'flute_keys');
    for (const yy of [0.18, 0.65]) mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.12, 0.014, 18), fm, { parent: g, at: [0, base + L * yy, 0], name: 'joint' });
    const sm = M.metal('#1c1d20', 0.4);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.4; bar([0, 0.02, 0], [Math.cos(a) * 0.12, 0.008, Math.sin(a) * 0.12], 0.005, sm, root, 'peg_leg'); }
    bar([0, 0.0, 0], [0, base + 0.08, 0], r * 0.8, M.fabric('#1a1a1a'), root, 'peg');
    anims.push(clip('play', 0.8, [rotateTrack(g.getObjectByName('flute_keys'), 'y', 0.8, (t) => 0.03 * wave(t, 2), 16)]));
  } else if (V.kind === 'bassoon') {
    const wm = woodwindMat(T, '#7a3a18');
    const g = group('bassoon', { parent: root });
    const H = 1.34 * k;
    // boot joint at the bottom, two bores rising side by side
    mesh(roundedBox(0.075 * k, 0.24 * k, 0.05 * k, 0.02 * k), wm, { parent: g, at: [0, 0.15 * k, 0], name: 'boot' });
    mesh(new THREE.CylinderGeometry(0.018 * k, 0.019 * k, H * 0.75, 20), wm, { parent: g, at: [-0.02 * k, 0.27 * k + H * 0.375, 0], name: 'long_joint' });
    mesh(new THREE.CylinderGeometry(0.02 * k, 0.02 * k, H * 0.45, 20), wm, { parent: g, at: [0.02 * k, 0.27 * k + H * 0.225, 0], name: 'wing_joint' });
    bell(g, T, wm, 0.019 * k, 0.026 * k, 0.12 * k, [-0.02 * k, 0.27 * k + H * 0.75, 0], [0, 1, 0], 'bell', { pow: 1.5 });
    mesh(new THREE.CylinderGeometry(0.021 * k, 0.021 * k, 0.03 * k, 20), M.matte('#f2efe6', 0.4), { parent: g, at: [-0.02 * k, 0.27 * k + H * 0.75 + 0.115 * k, 0], name: 'bell_ring' });
    curveTube([[0.02 * k, 0.27 * k + H * 0.45, 0], [0.02 * k, 0.27 * k + H * 0.5, 0], [0.06 * k, 0.27 * k + H * 0.55, 0.04 * k], [0.14 * k, 0.27 * k + H * 0.52, 0.08 * k]], 0.004 * k, M.metal('#d8d6d0', 0.2), { parent: g, name: 'bocal', segments: 20 });
    keyCups(g, T, [[0.02 * k, 0.3 * k, 0.015], [0.02 * k, 0.27 * k + H * 0.42, 0.015]], 0.02 * k, T.kids ? 4 : 8, 'bassoon_keys');
    // floor stand: base with a cup under the boot and a post with a yoke
    const sm = M.metal('#1c1d20', 0.4);
    g.position.y = 0.04;
    mesh(lathe([[0, 0], [0.07, 0], [0.07, 0.04], [0.062, 0.04], [0.062, 0.012], [0, 0.012]], 24), sm, { parent: root, name: 'boot_cup' });
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.004, 24), M.rubber(), { parent: root, at: [0, 0.033, 0], name: 'cup_pad' });
    bar([0, 0.02, -0.06], [0, 0.04 + 0.27 * k + H * 0.3, -0.045 * k], 0.007, sm, root, 'bassoon_post');
    bar([0, 0.02, 0], [0, 0.02, -0.06], 0.007, sm, root, 'post_foot');
    curveTube([[-0.05 * k, 0.04 + 0.27 * k + H * 0.3, 0.0], [-0.045 * k, 0.04 + 0.27 * k + H * 0.3, -0.03 * k], [0, 0.04 + 0.27 * k + H * 0.3, -0.045 * k], [0.04 * k, 0.04 + 0.27 * k + H * 0.3, -0.03 * k], [0.045 * k, 0.04 + 0.27 * k + H * 0.3, 0.0]], 0.006, M.rubber(), { parent: root, name: 'yoke', segments: 16 });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; bar([0, 0.012, 0], [Math.cos(a) * 0.22, 0.008, Math.sin(a) * 0.22], 0.008, sm, root, 'bassoon_leg'); }
    anims.push(clip('play', 0.8, [rotateTrack(g.getObjectByName('bassoon_keys'), 'y', 0.8, (t) => 0.02 * wave(t, 2), 16)]));
  } else if (V.kind === 'recorder') {
    const L = V.L * k;
    const wm = T.trim ? woodwindMat(T, '#c99a5b') : new THREE.MeshPhysicalMaterial({ name: 'resin', color: '#f0e6cc', roughness: 0.3, clearcoat: 0.6 });
    const g = group('recorder', { parent: root });
    const prof = T.round ? [[0.022 * k, 0], [0.02 * k, 0.02 * k], [0.011 * k, 0.06 * k], [0.012 * k, L * 0.7], [0.015 * k, L * 0.72], [0.014 * k, L], [0.008 * k, L + 0.04 * k], [0, L + 0.045 * k]] : [[0.024 * k, 0], [0.022 * k, 0.015 * k], [0.012 * k, 0.05 * k], [0.011 * k, L * 0.7], [0.014 * k, L * 0.72], [0.0135 * k, L], [0.01 * k, L + 0.035 * k], [0.004 * k, L + 0.05 * k], [0, L + 0.05 * k]];
    mesh(lathe(prof, T.sharp ? 8 : 28), wm, { parent: g, name: 'recorder_body' });
    for (const yy of [0.04, 0.7]) mesh(new THREE.CylinderGeometry(0.0145 * k, 0.0145 * k, 0.008, 20), T.trim ? M.matte('#1a1a1a', 0.4) : M.wood('#5b3a24'), { parent: g, at: [0, yy < 0.5 ? 0.04 * k : L * 0.71, 0], name: 'recorder_ring' });
    const holes = [];
    for (let i = 0; i < 7; i++) holes.push(new THREE.CircleGeometry(0.0035 * k, 12).translate(0, 0.1 * k + i * 0.026 * k, 0.0115 * k + 0.0003));
    merged(holes, M.matte('#120a06'), { parent: g, name: 'finger_holes' });
    mesh(new THREE.BoxGeometry(0.008 * k, 0.004 * k, 0.002), M.matte('#120a06'), { parent: g, at: [0, L * 0.86, 0.0141 * k], name: 'window' });
  } else if (V.kind === 'harmonica') {
    // harmonica in its open hinged case
    const cm = T.trim ? (T.kids ? fin(T, T.s, 'plastic') : T.neon ? fin(T, '#141418', 'gloss') : T.trim === 'gold' ? fin(T, '#1b1b1d', 'gloss') : fin(T, T.trim === 'white' ? '#f2efe6' : T.trim === 'natural' ? '#c99a5b' : '#7a1a14', T.trim === 'natural' ? 'satin' : 'gloss')) : M.plastic('#1b1b1d', 0.4);
    const W = 0.14, D = 0.05, h = 0.03, w = 0.003;
    const C = group('case', { parent: root });
    mesh(roundedBox(W, w, D, 0.0012), cm, { parent: C, at: [0, w / 2, 0], name: 'case_floor' });
    for (const s of [-1, 1]) { mesh(roundedBox(W, h, w, 0.0012), cm, { parent: C, at: [0, h / 2, s * (D / 2 - w / 2)], name: 'case_wall' }); mesh(roundedBox(w, h, D, 0.0012), cm, { parent: C, at: [s * (W / 2 - w / 2), h / 2, 0], name: 'case_end' }); }
    const lidH = group('case_lid', { parent: C, at: [0, h, -D / 2] });
    mesh(roundedBox(W, h * 0.6, w, 0.0012), cm, { parent: lidH, at: [0, 0, -0.0], rot: [0, 0, 0] });
    lidH.children[0].geometry = roundedBox(W, w, D, 0.0012).translate(0, w / 2, D / 2);
    lidH.rotation.x = -1.9;
    mesh(roundedBox(W - 0.008, 0.004, D - 0.008, 0.002), M.fabric(T.trim === 'gold' ? '#7a1022' : '#1a3a6a'), { parent: C, at: [0, w + 0.002, 0], name: 'lining' });
    const hm = group('harmonica', { parent: C, at: [0, w + 0.004, 0] });
    const sc = T.ornate ? M.metal('#e6b54e', 0.15) : T.trim === 'black' ? M.metal('#1e1e22', 0.3) : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.p, 'plastic') : M.chrome();
    const len = T.round ? 0.1 : 0.105;
    mesh(roundedBox(len, 0.012, 0.026, 0.002), T.trim === 'natural' || T.round ? M.wood('#c99a5b') : M.plastic(T.kids ? T.a : '#1a1a1a', 0.3), { parent: hm, at: [0, 0.011, 0], name: 'comb' });
    for (const s of [-1, 1]) mesh(T.sharp ? roundedBox(len + 0.004, 0.005, 0.028, 0.0015) : roundedBox(len + 0.004, 0.006, 0.03, 0.0028), sc, { parent: hm, at: [0, 0.011 + s * 0.008, 0], name: 'cover' });
    const holes = [];
    for (let i = 0; i < 10; i++) holes.push(new THREE.PlaneGeometry(0.006, 0.006).translate(-len / 2 + 0.008 + i * ((len - 0.016) / 9), 0.011, 0.0131));
    merged(holes, M.matte('#050505'), { parent: hm, name: 'holes' });
    anims.push(clip('open', 2, [rotateTrack(lidH, 'x', 2, (t) => 0.6 * (0.5 - 0.5 * Math.cos(t * Math.PI * 2)), 16)]));
  } else {
    // pan flute lying on the floor: graduated tubes bound with a cord band
    const n = T.kids ? 8 : T.ornate ? 16 : 13;
    const tm = T.trim ? (T.kids ? null : T.neon ? fin(T, T.p, 'neon') : T.trim === 'gold' ? hwMat(T) : T.trim === 'black' || T.trim === 'white' ? fin(T, T.p) : woodMat(T, '#d9b98a')) : new THREE.MeshPhysicalMaterial({ name: 'bamboo', color: '#d8c084', roughness: 0.45, clearcoat: 0.4 });
    const g = group('panflute', { parent: root });
    const rr = 0.008 * k;
    const tubes = [];
    for (let i = 0; i < n; i++) {
      const L = (0.22 - (i / n) * 0.15) * k;
      const x = (i - (n - 1) / 2) * rr * 2.05;
      const geo = new THREE.CylinderGeometry(rr, rr, L, 14, 1, true).rotateX(Math.PI / 2).translate(x, rr, -L / 2 + 0.02);
      if (tm) tubes.push(geo); else mesh(geo, fin(T, ['#ff3b3b', '#ffe03b', '#3bd16f', '#2b9dff'][i % 4], 'plastic'), { parent: g, name: `tube_${i}` }).material.side = THREE.DoubleSide;
    }
    if (tm) merged(tubes, tm, { parent: g, name: 'tubes' }).material.side = THREE.DoubleSide;
    const W = n * rr * 2.05;
    for (const z of [-0.02, -0.06]) mesh(roundedBox(W + 0.01, rr * 2.2, 0.012, 0.004), T.sharp ? M.matte('#1a1a1a') : M.matte('#8a2a1a', 0.7), { parent: g, at: [0, rr, z * k], name: 'band' });
    if (T.round) curveTube([[-W / 2 - 0.005, rr, -0.02], [-W / 2 - 0.03, 0.004, 0.02], [-W / 2 - 0.05, 0.004, 0.06]], 0.003, M.matte('#c0262c'), { parent: g, name: 'tassel', segments: 10 });
  }
  return done(root, 'woodwind', variant, o, anims);
}
