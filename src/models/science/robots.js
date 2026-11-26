// Robots & machines: robot arms, humanoid robots, drones, 3D printers, server racks.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, cushion, setup, done, fin, body, frameMat, darkMat, glassMat, lamp, glowStrip, slab, rodY, rodX, rodZ, bar, labelPlane, panel, emblem, foot, hazard, canvasTex } from './common.js';
import { clip, spinTrack, rotateTrack, moveTrack, pingPong, wave } from '../../core/animation.js';
import { lampTracks, LAMP_ON } from '../../core/lamps.js';

/* ================================ ROBOT ARMS ================================ */

export const ARM_VARIANTS = { 'industrial-6axis': { s: 1 }, desktop: { s: 0.3 }, scara: { s: 0.6 }, 'gantry-gripper': { s: 1 }, 'cobot': { s: 0.7 } };

function gripper(T, parent, s, name = 'gripper') {
  const g = group(name, { parent });
  mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.04 * s, 20), darkMat(T), { parent: g, at: [0, -0.02 * s, 0] });
  const fingers = [];
  for (const k of [-1, 1]) { const f = group(`${name}-finger${k}`, { parent: g, at: [k * 0.025 * s, -0.04 * s, 0] }); slab(f, M.metal('#c9ccd2', 0.3), 0.015 * s, 0.08 * s, 0.03 * s, { y: -0.08 * s, r: 0.004 * s }); fingers.push(f); }
  return { g, fingers };
}

export function createTechRobotArm(options = {}) {
  const { o, variant, T, V } = setup(options, ARM_VARIANTS, 'tech-robot-arm');
  const root = group(`tech-robot-arm-${variant}`);
  const s = V.s * (T.kids ? 0.8 : 1);
  const bm = T.trim ? body(T) : fin(T, variant === 'cobot' ? '#eef0f3' : variant === 'desktop' ? '#2b7de1' : '#f2b705', variant === 'cobot' ? 'gloss' : 'paint');
  const dk = darkMat(T);
  const anims = [];
  if (variant === 'gantry-gripper') {
    // overhead gantry with a vertical gripper axis over a conveyor
    const fm = frameMat(T);
    const W = 2.0, H = 1.8, D = 1.2;
    for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) slab(root, fm, 0.08, H, 0.08, { x, z, r: 0.01 });
    for (const z of [-D / 2, D / 2]) slab(root, fm, W + 0.08, 0.1, 0.08, { y: H, z, r: 0.01 });
    const carr = group('carriage', { parent: root, at: [0, H + 0.1, 0] });
    slab(carr, bm, 0.2, 0.12, D + 0.08, { r: 0.015 });
    const zax = group('z-axis', { parent: carr, at: [0, 0, 0] });
    slab(zax, dk, 0.08, 0.7, 0.08, { y: -0.6, r: 0.01 });
    const gr = gripper(T, zax, 1.2);
    gr.g.position.y = -0.6;
    // conveyor
    slab(root, dk, W - 0.2, 0.5, 0.45, { r: 0.02 });
    slab(root, M.matte('#2a2d33', 0.7), W - 0.1, 0.03, 0.4, { y: 0.5, r: 0.01 });
    slab(root, fin(T, '#d8792b', 'matte'), 0.25, 0.2, 0.25, { y: 0.53, x: 0.3, r: 0.02 });
    anims.push(clip('work', 4, [moveTrack(carr, 4, (t) => [0.6 * wave(t), 0, 0]), moveTrack(zax, 4, (t) => [0, -0.3 * pingPong(t * 2 % 1), 0]), ...gr.fingers.map((f, i) => moveTrack(f, 4, (t) => [(i ? -1 : 1) * 0.01 * pingPong(t * 2 % 1), 0, 0]))]));
    lamp(T, root, 'amber', { at: [W / 2, H + 0.1, D / 2 + 0.04], w: 0.05, h: 0.05, shape: 'round', glowSize: 0.3 });
    return done(root, T, variant, o, anims);
  }
  // base
  const bh = (variant === 'scara' ? 0.5 : 0.25) * s;
  if (variant !== 'desktop') slab(root, T.heavy ? fin(T, '#2a2d33', 'paint') : M.matte('#5a5d62', 0.7), 0.6 * s, 0.05 * s, 0.6 * s, { r: 0.01 * s });
  const b0 = variant === 'desktop' ? 0 : 0.05 * s;
  mesh(new THREE.CylinderGeometry(0.2 * s, 0.24 * s, bh, 32), bm, { parent: root, at: [0, b0 + bh / 2, 0] });
  const j1 = group('joint1', { parent: root, at: [0, b0 + bh, 0] });
  if (variant === 'scara') {
    rodY(0, 0.25 * s, 0.1 * s, bm, j1);
    const a1 = group('link1', { parent: j1, at: [0, 0.25 * s, 0] });
    slab(a1, bm, 0.6 * s, 0.12 * s, 0.22 * s, { x: 0.25 * s, r: 0.05 * s });
    const j2 = group('joint2', { parent: a1, at: [0.5 * s, 0.12 * s, 0] });
    mesh(new THREE.CylinderGeometry(0.1 * s, 0.1 * s, 0.05 * s, 24), dk, { parent: j2, at: [0, 0.0, 0] });
    slab(j2, bm, 0.5 * s, 0.1 * s, 0.18 * s, { x: 0.2 * s, y: 0.0, r: 0.04 * s });
    const q = group('quill', { parent: j2, at: [0.4 * s, 0, 0] });
    rodY(-0.35 * s, 0.15 * s, 0.025 * s, M.chrome(), q);
    const gr = gripper(T, q, s);
    gr.g.position.y = -0.35 * s;
    anims.push(clip('work', 4, [rotateTrack(j1, 'y', 4, (t) => 1.0 * wave(t)), rotateTrack(j2, 'y', 4, (t) => -1.4 * wave(t)), moveTrack(q, 4, (t) => [0, -0.06 * s * pingPong(t * 2 % 1), 0])]));
  } else {
    // articulated: shoulder, upper arm, elbow, forearm, wrist
    const cob = variant === 'cobot';
    const sh = group('shoulder', { parent: j1 });
    mesh(new THREE.CylinderGeometry(0.17 * s, 0.17 * s, 0.22 * s, 32), bm, { parent: sh, at: [0, 0.11 * s, 0] });
    mesh(new THREE.CylinderGeometry(0.14 * s, 0.14 * s, 0.3 * s, 32).rotateX(Math.PI / 2), cob ? M.plastic('#5a6068', 0.4) : dk, { parent: sh, at: [0, 0.3 * s, 0] });
    const j2 = group('joint2', { parent: sh, at: [0, 0.3 * s, 0], rot: [0, 0, 0.35] });
    const L1 = 0.7 * s, L2 = 0.6 * s;
    mesh(cob ? new THREE.CylinderGeometry(0.075 * s, 0.075 * s, L1, 24) : roundedBox(0.18 * s, L1, 0.16 * s, 0.05 * s), bm, { parent: j2, at: [0, L1 / 2, 0] });
    const j3 = group('joint3', { parent: j2, at: [0, L1, 0], rot: [0, 0, -1.6] });
    mesh(new THREE.CylinderGeometry(0.11 * s, 0.11 * s, 0.24 * s, 28).rotateX(Math.PI / 2), cob ? M.plastic('#5a6068', 0.4) : dk, { parent: j3 });
    mesh(cob ? new THREE.CylinderGeometry(0.06 * s, 0.06 * s, L2, 24) : roundedBox(0.14 * s, L2, 0.13 * s, 0.04 * s), bm, { parent: j3, at: [0, L2 / 2, 0] });
    const j4 = group('wrist', { parent: j3, at: [0, L2, 0], rot: [0, 0, 0.9] });
    mesh(new THREE.CylinderGeometry(0.07 * s, 0.07 * s, 0.14 * s, 24).rotateX(Math.PI / 2), cob ? M.plastic('#5a6068', 0.4) : dk, { parent: j4 });
    rodY(0, 0.12 * s, 0.05 * s, bm, j4);
    const tool = group('tool', { parent: j4, at: [0, 0.12 * s, 0], rot: [Math.PI, 0, 0] });
    const gr = gripper(T, tool, s);
    gr.g.position.y = -0.0;
    if (cob) lamp(T, j4, T.trim === 'futuristic' ? 'blue' : 'green', { geometry: new THREE.TorusGeometry(0.07 * s, 0.006 * s, 6, 24).translate(0, 0, 0.07 * s), glowSize: 0.2 * s });
    anims.push(clip('work', 5, [rotateTrack(j1, 'y', 5, (t) => 1.2 * wave(t)), rotateTrack(j2, 'z', 5, (t) => 0.35 * wave(t, 2)), rotateTrack(j3, 'z', 5, (t) => 0.4 * wave(t, 2)), rotateTrack(j4, 'z', 5, (t) => 0.5 * wave(t)), ...gr.fingers.map((f, i) => moveTrack(f, 5, (t) => [(i ? -1 : 1) * 0.01 * s * pingPong(t * 2 % 1), 0, 0]))]));
    // cable loom
    if (!cob) curveTube([[-0.1 * s, b0 + bh * 0.8, -0.18 * s], [-0.2 * s, b0 + bh + 0.3 * s, -0.12 * s], [-0.08 * s, b0 + bh + 0.5 * s, -0.08 * s]], 0.02 * s, M.rubber(), { parent: root });
  }
  if (T.heavy) { const hz = labelPlane(0.6 * s, 0.05 * s, hazard, { bg: '#f2b705' }); hz.rotation.x = -Math.PI / 2; hz.position.set(0, b0 + 0.0005, 0.27 * s); root.add(hz); }
  if (variant !== 'desktop') emblem(root, 0.08 * s, [0, b0 + bh * 0.5, 0.215 * s]);
  if (T.trim === 'futuristic') glowStrip(T, root, Array.from({ length: 13 }, (_, i) => [Math.cos(i * 0.52) * 0.242 * s, b0 + 0.01 * s, Math.sin(i * 0.52) * 0.242 * s]), 0.006 * s);
  return done(root, T, variant, o, anims);
}

/* ============================= HUMANOID ROBOTS ============================= */

export const HUMANOID_VARIANTS = { service: { h: 1.5 }, companion: { h: 1.2, round: true }, android: { h: 1.75 }, 'biped-kit': { h: 0.4, kit: true }, 'wheeled-assistant': { h: 1.3, wheels: true } };

export function createTechHumanoid(options = {}) {
  const { o, variant, T, V } = setup(options, HUMANOID_VARIANTS, 'tech-humanoid', { p: '#f2f3f5', s: '#2a2d33' });
  const root = group(`tech-humanoid-${variant}`);
  const k = V.h / 1.5;
  const bm = body(T);
  const jm = T.vintage ? fin(T, '#c9a24a', 'brass') : darkMat(T);
  const anims = [];
  const legH = V.wheels ? 0 : 0.7 * k;
  // legs / wheel base
  if (V.wheels) {
    mesh(lathe([[0, 0.05], [0.28, 0.05], [0.3, 0.1], [0.26, 0.25], [0.15, 0.35], [0, 0.35]], 40).scale(k, k, k), bm, { parent: root });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.05 * k, 16, 10), M.rubber(), { parent: root, at: [Math.cos(a) * 0.2 * k, 0.05 * k, Math.sin(a) * 0.2 * k] }); }
  } else for (const sd of [-1, 1]) {
    const leg = group(`leg${sd}`, { parent: root, at: [sd * 0.11 * k, legH, 0] });
    mesh(V.round ? new THREE.CapsuleGeometry(0.07 * k, 0.22 * k, 6, 16) : roundedBox(0.12 * k, 0.32 * k, 0.13 * k, 0.04 * k), bm, { parent: leg, at: [0, -0.17 * k, 0] });
    mesh(new THREE.SphereGeometry(0.055 * k, 16, 12), jm, { parent: leg, at: [0, -0.35 * k, 0] });
    mesh(V.round ? new THREE.CapsuleGeometry(0.06 * k, 0.2 * k, 6, 16) : roundedBox(0.1 * k, 0.28 * k, 0.11 * k, 0.035 * k), bm, { parent: leg, at: [0, -0.52 * k, 0] });
    slab(leg, jm, 0.13 * k, 0.05 * k, 0.22 * k, { y: -legH, z: 0.03 * k, r: 0.02 * k });
    rodY(-0.67 * k, -0.62 * k, 0.035 * k, jm, leg);
  }
  const hipY = V.wheels ? 0.35 * k : legH;
  // torso
  const torso = group('torso', { parent: root, at: [0, hipY, 0] });
  mesh(V.round ? new THREE.SphereGeometry(0.2 * k, 32, 24).scale(1, 1.3, 0.85) : cushion(0.36 * k, 0.5 * k, 0.22 * k, { radius: 0.08 * k, bulge: 0.1 }), bm, { parent: torso, at: [0, (V.round ? 0.24 : 0.28) * k, 0] });
  mesh(new THREE.CylinderGeometry(0.14 * k, 0.13 * k, 0.08 * k, 24), jm, { parent: torso, at: [0, 0.03 * k, 0] });
  // chest display / light
  if (variant === 'service' || V.wheels) {
    const sc = panel(0.2 * k, 0.13 * k, 0.012 * k, (c, w, h) => { c.fillStyle = '#071018'; c.fillRect(0, 0, w, h); c.fillStyle = '#22e1ff'; c.font = `bold ${h * 0.3}px sans-serif`; c.textAlign = 'center'; c.fillText('HELLO', w / 2, h * 0.45); c.fillStyle = '#7dffa0'; c.fillRect(w * 0.2, h * 0.65, w * 0.6, h * 0.08); }, jm, { emissive: 0.9, bg: '#0b1a12' });
    sc.position.set(0, 0.33 * k, 0.11 * k + 0.002); sc.rotation.x = -0.08; torso.add(sc);
  } else lamp(T, torso, T.trim === 'futuristic' ? 'blue' : V.round ? 'amber' : 'white', { at: [0, 0.36 * k, (V.round ? 0.17 : 0.112) * k], w: 0.05 * k, h: 0.05 * k, shape: 'round', glowSize: 0.2 * k });
  // arms
  const sy = (V.round ? 0.4 : 0.48) * k;
  for (const sd of [-1, 1]) {
    const arm = group(`arm${sd}`, { parent: torso, at: [sd * (V.round ? 0.2 : 0.21) * k, sy, 0] });
    mesh(new THREE.SphereGeometry(0.065 * k, 16, 12), jm, { parent: arm });
    mesh(V.round ? new THREE.CapsuleGeometry(0.05 * k, 0.18 * k, 6, 12) : roundedBox(0.09 * k, 0.26 * k, 0.09 * k, 0.03 * k), bm, { parent: arm, at: [sd * 0.02 * k, -0.17 * k, 0] });
    mesh(new THREE.SphereGeometry(0.045 * k, 14, 10), jm, { parent: arm, at: [sd * 0.02 * k, -0.32 * k, 0] });
    mesh(V.round ? new THREE.CapsuleGeometry(0.045 * k, 0.16 * k, 6, 12) : roundedBox(0.08 * k, 0.24 * k, 0.08 * k, 0.03 * k), bm, { parent: arm, at: [sd * 0.02 * k, -0.46 * k, 0] });
    mesh(new THREE.SphereGeometry(0.05 * k, 14, 10).scale(0.8, 1.1, 0.6), jm, { parent: arm, at: [sd * 0.02 * k, -0.62 * k, 0] });
    if (sd > 0) anims.push(rotateTrack(arm, 'z', 2, (t) => (t > 0.1 && t < 0.9 ? 2.4 + 0.3 * wave(t, 3) : 0) * (t < 0.2 ? (t - 0.1) * 10 : t > 0.8 ? (0.9 - t) * 10 : 1), 32));
  }
  // head
  const head = group('head', { parent: torso, at: [0, (V.round ? 0.5 : 0.52) * k, 0] });
  rodY(0, 0.06 * k, 0.04 * k, jm, head);
  const hr = (V.round ? 0.15 : 0.12) * k;
  if (variant === 'android') {
    mesh(new THREE.SphereGeometry(hr, 32, 24).scale(0.85, 1.15, 0.95), bm, { parent: head, at: [0, 0.06 * k + hr * 1.05, 0] });
    mesh(new THREE.SphereGeometry(hr * 1.005, 32, 16, -0.9, 1.8, 0.9, 0.7).scale(0.85, 1.15, 0.95), M.glass({ tint: '#0d141c' }), { parent: head, at: [0, 0.06 * k + hr * 1.05, 0] });
    for (const sd of [-1, 1]) lamp(T, head, 'blue', { at: [sd * 0.035 * k, 0.06 * k + hr * 1.1, hr * 0.92], w: 0.018 * k, h: 0.008 * k, shape: 'strip', glowSize: 0.06 * k });
  } else {
    mesh(V.round ? new THREE.SphereGeometry(hr, 32, 24) : roundedBox(hr * 2.1, hr * 1.7, hr * 1.8, hr * 0.5), bm, { parent: head, at: [0, 0.06 * k + hr * 0.85, 0] });
    const face = V.round ? hr * 0.93 : hr * 0.9 + 0.001;
    slab(head, M.glass({ tint: '#0d141c' }), hr * 1.6, hr * 0.9, 0.01 * k, { y: 0.06 * k + hr * 0.45, z: face, r: 0.004 * k });
    for (const sd of [-1, 1]) lamp(T, head, T.trim === 'futuristic' ? 'blue' : V.round ? 'amber' : 'white', { at: [sd * hr * 0.4, 0.06 * k + hr * 0.9, face + 0.005 * k + 0.0005], w: hr * 0.3, h: hr * 0.3, shape: 'round', glowSize: hr });
    if (T.vintage || variant === 'biped-kit') { rodY(0.06 * k + hr * 1.7, 0.06 * k + hr * 2.4, 0.006 * k + 0.001, jm, head); mesh(new THREE.SphereGeometry(0.02 * k + 0.003, 10, 8), fin(T, '#d23b2a', 'gloss'), { parent: head, at: [0, 0.06 * k + hr * 2.4, 0] }); }
    for (const sd of [-1, 1]) mesh(new THREE.CylinderGeometry(hr * 0.3, hr * 0.3, 0.03 * k, 20).rotateZ(Math.PI / 2), jm, { parent: head, at: [sd * (V.round ? hr : hr * 1.05), 0.06 * k + hr * 0.85, 0] });
  }
  emblem(torso, 0.05 * k, [0.09 * k, 0.45 * k, (V.round ? 0.12 : 0.111) * k + 0.003]);
  if (T.trim === 'futuristic') glowStrip(T, torso, [[-0.12 * k, 0.1 * k, 0.1 * k], [0, 0.08 * k, 0.115 * k], [0.12 * k, 0.1 * k, 0.1 * k]], 0.005 * k);
  return done(root, T, variant, o, [clip('wave', 2, anims), clip('look', 4, [rotateTrack(head, 'y', 4, (t) => 0.6 * wave(t))])]);
}

/* ================================== DRONES ================================== */

export const DRONE_VARIANTS = { quad: { n: 4, R: 0.18 }, hex: { n: 6, R: 0.4 }, fpv: { n: 4, R: 0.12, fpv: true }, delivery: { n: 8, R: 0.55, box: true }, 'mapping-wing': { n: 4, R: 0.3, wing: true } };

export function createTechDrone(options = {}) {
  const { o, variant, T, V } = setup(options, DRONE_VARIANTS, 'tech-drone', { p: '#eceae4' });
  const root = group(`tech-drone-${variant}`);
  const bm = T.trim ? body(T) : fin(T, V.fpv ? '#16171a' : variant === 'delivery' ? '#f2f3f5' : '#eceae4', V.fpv ? 'carbon' : 'gloss');
  const dk = darkMat(T);
  const { n, R } = V;
  const legH = V.fpv ? 0.02 : R * 0.45 + (V.box ? 0.2 : 0);
  const props = [];
  // landing gear
  if (V.fpv) for (const x of [-1, 1]) for (const z of [-1, 1]) foot(root, M.rubber(), x * 0.04, z * 0.04, 0.008, 0.02);
  else for (const s of [-1, 1]) { rodX(-R * 0.5, R * 0.5, R * 0.025, dk, root, { y: R * 0.025, z: s * R * 0.4 }); for (const x of [-1, 1]) bar([x * R * 0.3, R * 0.025, s * R * 0.4], [x * R * 0.12, legH, s * R * 0.12], R * 0.02, dk, root); }
  const fr = group('frame', { parent: root, at: [0, legH, 0] });
  const bodyR = V.fpv ? 0.05 : R * 0.32;
  mesh(cushion(bodyR * 2.2, bodyR * 0.8, bodyR * 1.6, { radius: bodyR * 0.3, bulge: 0.2 }), bm, { parent: fr, at: [0, bodyR * 0.4, 0] });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / n;
    const ax = Math.cos(a) * R, az = Math.sin(a) * R;
    bar([0, bodyR * 0.4, 0], [ax, bodyR * 0.4, az], V.fpv ? 0.006 : R * 0.04, V.fpv ? fin(T, '#2a2d33', 'carbon') : bm, fr);
    mesh(new THREE.CylinderGeometry(R * 0.08 + 0.006, R * 0.08 + 0.006, R * 0.12 + 0.01, 16), dk, { parent: fr, at: [ax, bodyR * 0.4 + R * 0.06, az] });
    const pr = group(`prop${i}`, { parent: fr, at: [ax, bodyR * 0.4 + R * 0.12 + 0.01, az] });
    const pl = R * 0.85 * (V.fpv ? 0.6 : 0.85);
    for (const s of [0, Math.PI]) mesh(roundedBox(pl, 0.004 + R * 0.006, pl * 0.12, 0.002), fin(T, V.fpv ? '#ff2bd6' : T.trim === 'futuristic' ? '#22e1ff' : '#2a2d33', 'plastic'), { parent: pr, at: [Math.cos(s) * pl / 2, 0.002, Math.sin(s) * pl / 2], rot: [0.12, s, 0] });
    mesh(new THREE.CylinderGeometry(R * 0.03 + 0.003, R * 0.03 + 0.003, 0.01, 12), M.metal('#c9ccd2'), { parent: pr });
    props.push(pr);
    lamp(T, fr, i < n / 2 ? 'green' : 'red', { at: [ax, bodyR * 0.4 - R * 0.04, az], normal: [0, -1, 0], w: 0.01 + R * 0.02, h: 0.01 + R * 0.02, shape: 'round', glowSize: 0.05 + R * 0.1 });
  }
  // camera gimbal / payload
  if (V.box) {
    for (const x of [-1, 1]) bar([x * R * 0.15, bodyR * 0.05, 0], [x * R * 0.15, -0.09, 0], 0.006, dk, fr);
    slab(fr, fin(T, '#c89b62', 'matte'), R * 0.45, 0.18, R * 0.35, { y: -0.18 - 0.0, r: 0.01 });
  } else {
    const gim = group('gimbal', { parent: fr, at: [bodyR * 0.8, 0, 0] });
    rodY(-bodyR * 0.3, bodyR * 0.05, bodyR * 0.08, dk, gim);
    mesh(new THREE.SphereGeometry(bodyR * 0.3, 16, 12), dk, { parent: gim, at: [0, -bodyR * 0.35, 0] });
    mesh(new THREE.CylinderGeometry(bodyR * 0.15, bodyR * 0.15, bodyR * 0.08, 16).rotateZ(Math.PI / 2), M.glass({ tint: '#0a1420' }), { parent: gim, at: [bodyR * 0.3, -bodyR * 0.35, 0] });
  }
  if (V.wing) for (const s of [-1, 1]) mesh(extrudeOutline([[0, 0], [R * 0.25, 0], [R * 0.2, s * R * 1.8], [0.02, s * R * 1.8]], 0.015, { bevel: 0.005 }).rotateX(Math.PI / 2), bm, { parent: fr, at: [-R * 0.1, bodyR * 0.65, 0] });
  if (V.fpv) { mesh(roundedBox(0.03, 0.03, 0.02, 0.005), dk, { parent: fr, at: [0.05, bodyR * 0.6, 0], rot: [0, 0, 0.4] }); rodY(bodyR * 0.8, bodyR * 0.8 + 0.06, 0.002, M.plastic('#2a2d33', 0.5), fr, { x: -0.04 }); }
  emblem(fr, bodyR * 0.5, [0, bodyR * 0.8 + 0.002, 0], 'y');
  if (T.trim === 'futuristic') glowStrip(T, fr, [[-bodyR, bodyR * 0.4, bodyR * 0.8], [bodyR, bodyR * 0.4, bodyR * 0.8]], bodyR * 0.04);
  return done(root, T, variant, o, [clip('fly', 0.3, props.map((p, i) => spinTrack(p, 'y', 0.3, i % 2 ? 1 : -1)))]);
}

/* =============================== 3D PRINTERS =============================== */

export const PRINTER_VARIANTS = { cartesian: {}, corexy: {}, delta: {}, resin: {} };

export function createTech3dPrinter(options = {}) {
  const { o, variant, T } = setup(options, PRINTER_VARIANTS, 'tech-3d-printer');
  const root = group(`tech-3d-printer-${variant}`);
  const fm = T.trim ? frameMat(T) : M.metal('#2a2d33', 0.4);
  const bm = body(T, T.trim ? T.p : '#2a2d33');
  const dk = darkMat(T);
  const fil = T.kids ? '#ff4d6d' : T.trim === 'futuristic' ? '#22e1ff' : T.vintage ? '#c9a24a' : '#ff7a1a';
  const anims = [];
  const printPart = (parent, y, h = 0.05) => mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 6), fin(T, fil, 'plastic'), { parent, at: [0, y + h / 2, 0] });
  if (variant === 'resin') {
    slab(root, bm, 0.22, 0.12, 0.22, { r: 0.015 });
    root.add(Object.assign(panel(0.07, 0.05, 0.004, (c, w, h) => { c.fillStyle = '#071018'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffb02a'; c.font = `bold ${h * 0.3}px sans-serif`; c.fillText('PRINT 42%', 6, h * 0.55); }, dk, { emissive: 0.9, bg: '#2a1a00' }), {}));
    root.children[root.children.length - 1].position.set(0, 0.06, 0.112);
    slab(root, M.metal('#c9ccd2', 0.3), 0.15, 0.03, 0.12, { y: 0.12, r: 0.004 });
    rodY(0.12, 0.42, 0.012, M.chrome(), root, { z: -0.08 });
    const zg = group('z-plate', { parent: root, at: [0, 0.25, 0] });
    slab(zg, M.metal('#b9bec6', 0.3), 0.03, 0.04, 0.09, { y: 0, z: -0.045, r: 0.004 });
    slab(zg, M.metal('#b9bec6', 0.3), 0.12, 0.012, 0.1, { y: -0.012, r: 0.003 });
    mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.08, 8), fin(T, fil, 'plastic'), { parent: zg, at: [0, -0.052, 0] });
    // UV hood (amber acrylic)
    const hood = group('hood', { parent: root, at: [0, 0.12, 0] });
    const hm = new THREE.MeshPhysicalMaterial({ name: 'uv-acrylic', color: T.trim === 'futuristic' ? '#22e1ff' : '#ff9a1a', roughness: 0.08, transmission: 0.6, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    for (const s of [-1, 1]) { slab(hood, hm, 0.004, 0.3, 0.2, { x: s * 0.1, r: 0.001 }); slab(hood, hm, 0.2, 0.3, 0.004, { z: s * 0.1, r: 0.001 }); }
    slab(hood, hm, 0.204, 0.004, 0.204, { y: 0.3, r: 0.001 });
    anims.push(clip('print', 6, [moveTrack(zg, 6, (t) => [0, 0.05 * t, 0])]), clip('open', 3, [moveTrack(hood, 3, (t) => [0, 0.3 * pingPong(t), 0])]));
    lamp(T, root, 'amber', { at: [0.08, 0.1, 0.111], w: 0.008, h: 0.008, shape: 'round' });
    return done(root, T, variant, o, anims);
  }
  if (variant === 'delta') {
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 3), bm, { parent: root, at: [0, 0.05, 0], rot: [0, Math.PI / 6, 0] });
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 3), bm, { parent: root, at: [0, 0.73, 0], rot: [0, Math.PI / 6, 0] });
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.006, 40), glassMat(), { parent: root, at: [0, 0.103, 0] });
    const eff = group('effector', { parent: root, at: [0, 0.25, 0] });
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.015, 24), dk, { parent: eff });
    mesh(new THREE.ConeGeometry(0.006, 0.02, 12).rotateX(Math.PI), M.metal('#c9a24a'), { parent: eff, at: [0, -0.016, 0] });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
      const cx = Math.cos(a) * 0.19, cz = Math.sin(a) * 0.19;
      slab(root, fm, 0.025, 0.6, 0.025, { x: cx * 0.88, y: 0.1, z: cz * 0.88, r: 0.004 });
      const car = group(`carriage${i}`, { parent: root, at: [cx * 0.82, 0.48, cz * 0.82] });
      slab(car, dk, 0.05, 0.04, 0.03, { r: 0.006 });
      for (const s of [-1, 1]) { const ox = Math.cos(a + Math.PI / 2) * 0.015 * s, oz = Math.sin(a + Math.PI / 2) * 0.015 * s; bar([cx * 0.82 + ox, 0.48, cz * 0.82 + oz], [Math.cos(a) * 0.028 + ox, 0.25, Math.sin(a) * 0.028 + oz], 0.003, M.metal('#c9ccd2'), root); }
    }
    printPart(root, 0.106, 0.04);
    anims.push(clip('print', 3, [moveTrack(eff, 3, (t) => [0.03 * Math.cos(t * 6.28), 0, 0.03 * Math.sin(t * 6.28)])]));
  } else {
    const core = variant === 'corexy';
    const W = 0.44, D = 0.44, H = core ? 0.5 : 0.45;
    if (core) {
      // enclosed cube frame with clear panels
      for (const x of [-1, 1]) for (const z of [-1, 1]) slab(root, fm, 0.025, H, 0.025, { x: x * W / 2, z: z * D / 2, r: 0.004 });
      for (const y of [0, H - 0.025]) for (const z of [-1, 1]) slab(root, fm, W, 0.025, 0.025, { y, z: z * D / 2, r: 0.004 });
      for (const y of [0, H - 0.025]) for (const x of [-1, 1]) slab(root, fm, 0.025, 0.025, D, { y, x: x * W / 2, r: 0.004 });
      for (const s of [-1, 1]) slab(root, glassMat({ tint: '#d8e6ec' }), 0.004, H - 0.05, D - 0.03, { x: s * (W / 2 + 0.002), y: 0.025, r: 0.001 });
      slab(root, bm, W, 0.08, D, { r: 0.01 });
    } else {
      slab(root, bm, W, 0.06, D, { r: 0.01 });
      for (const s of [-1, 1]) slab(root, fm, 0.03, H, 0.06, { x: s * W * 0.42, y: 0.06, r: 0.004 });
      slab(root, fm, W * 0.84 + 0.03, 0.03, 0.06, { y: 0.06 + H, r: 0.004 });
    }
    const bedY = core ? 0.15 : 0.1;
    const bed = group('bed', { parent: root, at: [0, bedY, 0] });
    slab(bed, M.metal('#b9bec6', 0.3), 0.24, 0.006, 0.24, { r: 0.002 });
    slab(bed, M.matte(T.trim === 'futuristic' ? '#22262e' : '#1c1d20', 0.5), 0.23, 0.002, 0.23, { y: 0.006, r: 0.0008 });
    if (!core) rodY(-(bedY - 0.06), 0, 0.012, dk, bed);
    else for (const x of [-1, 1]) rodY(-(bedY - 0.08), 0.0, 0.008, M.chrome(), bed, { x: x * 0.08 });
    printPart(bed, 0.008, 0.05);
    const gy = core ? H - 0.06 : 0.3;
    const gantry = group('x-gantry', { parent: root, at: [0, gy, 0] });
    const gx = core ? W / 2 - 0.02 : W * 0.42;
    rodX(-gx, gx, 0.006, M.chrome(), gantry, { z: 0.0 });
    rodX(-gx, gx, 0.006, M.chrome(), gantry, { z: 0.03 });
    const head = group('hotend', { parent: gantry, at: [0, 0, 0.015] });
    slab(head, dk, 0.05, 0.06, 0.05, { y: -0.03, r: 0.006 });
    mesh(new THREE.ConeGeometry(0.004, 0.012, 12).rotateX(Math.PI), M.metal('#c9a24a'), { parent: head, at: [0, -0.036, 0] });
    lamp(T, head, 'blue', { at: [0, -0.005, 0.026], w: 0.01, h: 0.01, shape: 'round', glowSize: 0.05 });
    if (core) for (const s of [-1, 1]) rodZ(-D / 2, D / 2, 0.006, M.chrome(), root, { x: s * (W / 2 - 0.02), y: gy });
    // spool on holder
    const sp = group('spool', { parent: root, at: [W / 2 + 0.06, 0.06 + H * 0.65, 0] });
    rodX(-0.07, 0.03, 0.006, fm, sp);
    mesh(lathe([[0.03, -0.035], [0.1, -0.035], [0.1, -0.03], [0.09, -0.03], [0.09, 0.03], [0.1, 0.03], [0.1, 0.035], [0.03, 0.035]], 40).rotateZ(Math.PI / 2), fin(T, fil, 'plastic'), { parent: sp });
    slab(root, fm, 0.025, 0.06 + H * 0.65 + 0.006, 0.025, { x: W / 2 - 0.01, r: 0.004 });
    // control screen
    const sc = panel(0.09, 0.06, 0.008, (c, w, h) => { c.fillStyle = '#071018'; c.fillRect(0, 0, w, h); c.fillStyle = '#7dffa0'; c.font = `bold ${h * 0.25}px monospace`; c.fillText('215°C  60°C', 6, h * 0.4); c.fillRect(6, h * 0.65, w * 0.55, h * 0.1); }, dk, { emissive: 0.9, bg: '#0b1a12' });
    sc.position.set(-W * 0.25, 0.03, D / 2 + 0.004); sc.rotation.x = -0.3; root.add(sc);
    anims.push(clip('print', 4, [moveTrack(head, 4, (t) => [0.08 * wave(t), 0, 0]), moveTrack(bed, 4, (t) => [0, 0, 0.05 * wave(t, 2)])]));
  }
  if (T.trim === 'futuristic') glowStrip(T, root, [[-0.15, 0.01, 0.225], [0.15, 0.01, 0.225]], 0.003);
  emblem(root, 0.03, [variant === 'delta' ? 0 : 0.15, variant === 'delta' ? 0.73 : 0.03, variant === 'delta' ? 0.1 + 0.002 : 0.222]);
  return done(root, T, variant, o, anims);
}

/* =============================== SERVER RACKS =============================== */

export const RACK_VARIANTS = { '42u': { u: 42 }, 'half-rack': { u: 22 }, 'open-frame': { u: 24, open: true }, 'network-cabinet': { u: 12, wall: true } };

export function createTechServerRack(options = {}) {
  const { o, variant, T, V } = setup(options, RACK_VARIANTS, 'tech-server-rack', { p: '#1c1d20' });
  const root = group(`tech-server-rack-${variant}`);
  const U = 0.04445;
  const H = V.u * U + 0.12, W = 0.6, D = V.wall ? 0.45 : V.open ? 0.55 : 1.0;
  const cab = T.trim ? body(T, T.trim === 'research' ? '#eef0f3' : T.p) : fin(T, '#1c1d20', 'paint');
  const y0 = V.wall ? 0.1 : 0.05;
  if (!V.wall) for (const x of [-1, 1]) for (const z of [-1, 1]) foot(root, M.rubber(), x * (W / 2 - (V.open ? 0.025 : 0.05)), z * (D / 2 - (V.open ? 0.025 : 0.05)), 0.025, y0);
  else slab(root, M.matte('#8d8f94', 0.8), W + 0.1, y0, D + 0.1, { r: 0.01 });
  if (V.open) {
    for (const x of [-1, 1]) { slab(root, cab, 0.05, H, 0.05, { x: x * (W / 2 - 0.025), y: y0, z: 0.25, r: 0.006 }); slab(root, cab, 0.05, H, 0.05, { x: x * (W / 2 - 0.025), y: y0, z: -0.25, r: 0.006 }); }
    for (const y of [y0, y0 + H - 0.05]) for (const x of [-1, 1]) slab(root, cab, 0.05, 0.05, 0.55, { x: x * (W / 2 - 0.025), y, r: 0.006 });
    for (const y of [y0, y0 + H - 0.05]) slab(root, cab, W, 0.05, 0.05, { y, z: 0.25, r: 0.006 });
    for (const y of [y0, y0 + H - 0.05]) slab(root, cab, W, 0.05, 0.05, { y, z: -0.25, r: 0.006 });
  } else {
    for (const x of [-1, 1]) slab(root, cab, 0.02, H, D, { x: x * (W / 2 - 0.01), y: y0, r: 0.006 });
    slab(root, cab, W, 0.03, D, { y: y0 + H - 0.03, r: 0.006 });
    slab(root, cab, W, 0.03, D, { y: y0, r: 0.006 });
    slab(root, cab, W, H, 0.02, { y: y0, z: -D / 2 + 0.01, r: 0.006 });
  }
  // servers
  const n = Math.floor((V.u - 2) / 2);
  const leds = [];
  const zf = V.open ? 0.24 : D / 2 - 0.08;
  for (let i = 0; i < n; i++) {
    const y = y0 + 0.05 + i * 2 * U;
    const kind = i % 5;
    const sv = group(`server${i}`, { parent: root, at: [0, y, zf - (V.open ? 0.25 : D * 0.4)] });
    const sd = V.open ? 0.5 : D * 0.8;
    slab(sv, M.metal(kind === 2 ? '#c9ccd2' : '#2a2d33', 0.35), W - 0.05, 2 * U - 0.004, sd, { r: 0.003 });
    const front = labelPlane(W - 0.07, 2 * U - 0.012, (c, w, h) => { c.fillStyle = kind === 2 ? '#c9ccd2' : '#1c1d20'; c.fillRect(0, 0, w, h); c.fillStyle = '#0a0a0a'; for (let k = 0; k < 24; k++) c.fillRect(w * 0.3 + k * (w * 0.6 / 24), h * 0.2, 3, h * 0.6); c.fillStyle = '#888'; c.fillRect(6, h * 0.3, w * 0.15, h * 0.4); }, { bg: '#1c1d20', px: 256 });
    front.position.set(0, U, sd / 2 + 0.0008); sv.add(front);
    if (i < 6 || i % 2 === 0) leds.push(lamp(T, sv, T.trim === 'futuristic' ? 'blue' : i % 3 ? 'green' : 'amber', { at: [-W / 2 + 0.06 + (i % 3) * 0.012, U, sd / 2 + 0.002], w: 0.005, h: 0.005, shape: 'round', glowSize: 0.03 }));
    for (const x of [-1, 1]) slab(sv, M.metal('#9aa0a6', 0.3), 0.02, 2 * U - 0.01, 0.01, { x: x * (W / 2 - 0.035), y: 0.003, z: sd / 2, r: 0.002 });
    // rails to the frame
    if (!V.open) for (const x of [-1, 1]) slab(sv, M.metal('#6b6e74', 0.4), 0.025, 0.01, sd * 0.9, { x: x * (W / 2 - 0.025), y: U - 0.005, r: 0.002 });
    else for (const x of [-1, 1]) slab(sv, M.metal('#6b6e74', 0.4), 0.03, 0.01, 0.55, { x: x * (W / 2 - 0.03), y: U - 0.005, z: 0, r: 0.002 });
  }
  // glass door
  if (!V.open) {
    const door = group('door', { parent: root, at: [-W / 2, y0, D / 2] });
    slab(door, T.vintage ? M.wood('#6b4426') : cab, 0.03, H, 0.02, { x: 0.015, r: 0.004 });
    slab(door, T.vintage ? M.wood('#6b4426') : cab, 0.03, H, 0.02, { x: W - 0.015, r: 0.004 });
    slab(door, T.vintage ? M.wood('#6b4426') : cab, W, 0.04, 0.02, { x: W / 2, r: 0.004 });
    slab(door, T.vintage ? M.wood('#6b4426') : cab, W, 0.04, 0.02, { x: W / 2, y: H - 0.04, r: 0.004 });
    slab(door, glassMat({ tint: T.trim === 'futuristic' ? '#22e1ff' : '#8899aa' }), W - 0.05, H - 0.07, 0.006, { x: W / 2, y: 0.035, r: 0.002 });
    rodY(H * 0.4, H * 0.6, 0.008, M.chrome(), door, { x: W - 0.04, z: 0.02 });
    emblem(door, 0.06, [W / 2, H - 0.02, 0.011]);
    root.userData.door = door.name;
  }
  if (T.trim === 'futuristic') glowStrip(T, root, [[-W / 2 + 0.002, y0 + 0.05, D / 2 - 0.1], [-W / 2 + 0.002, y0 + H - 0.05, D / 2 - 0.1]], 0.004);
  const blink = leds.map((l, i) => new THREE.NumberKeyframeTrack(`${l.name}.material.emissiveIntensity`, [0, 0.1 + (i % 4) * 0.05, 0.3, 0.5], [3, 0.2, 3, 3], THREE.InterpolateDiscrete));
  const anims = [clip('blink', 0.5, blink)];
  if (!V.open) anims.push(clip('open', 3, [rotateTrack(root.getObjectByName('door'), 'y', 3, (t) => -1.6 * pingPong(t))]));
  return done(root, T, variant, o, anims);
}
