// Robot companions (original designs): rover, biped, hover-bot on a dock, spider-bot and robo-dog.
import { THREE, M, group, mesh, taper, glowMat, plainMat, darkMat, setup, done, animKit, swing, TAU, lampTracks, rotateTrack, moveTrack, roundedBox, cushion, lathe, merge, orient } from './common.js';
import { lampGroup } from '../../core/lamps.js';
import { spinTrack } from '../../core/animation.js';

const ROBOT_TRIMS = {
  chrome: { shell: '#d8dce2', acc: '#2a2e36', eye: '#40d0ff', fin: 'chrome' },
  rusty: { shell: '#9a5a32', acc: '#4a3a30', eye: '#ffb030', fin: 'rust', dents: true },
  toy: { shell: '#ffd23a', acc: '#2a7ae0', eye: '#ff4a6a', fin: 'toy', chunky: true },
  military: { shell: '#5a6a3a', acc: '#2a2e24', eye: '#ff3a2a', fin: 'matte', armour: true },
  neon: { shell: '#16161c', acc: '#ff2bd6', eye: '#c8ff12', fin: 'gloss', neon: true },
  gold: { shell: '#d6a43a', acc: '#3a2a1a', eye: '#40f0ff', fin: 'gold' },
  arctic: { shell: '#f2f4f6', acc: '#6a8aa8', eye: '#7ad8ff', fin: 'gloss' },
  stealth: { shell: '#1c1d20', acc: '#2e3036', eye: '#ff2a2a', fin: 'matte' },
  retro: { shell: '#7ab8a8', acc: '#c8b890', eye: '#ffe080', fin: 'retro', antenna: true },
  medic: { shell: '#f6f6f4', acc: '#e0303a', eye: '#40ff9a', fin: 'gloss', cross: true },
  explorer: { shell: '#e8862a', acc: '#2a2c30', eye: '#40d0ff', fin: 'gloss', pack: true },
  sakura: { shell: '#f8c8d8', acc: '#ffffff', eye: '#ff6aa8', fin: 'gloss' },
};
export const ROBOT_VARIANTS = {
  rover: { shell: '#e8eaee', acc: '#3a3e46', eye: '#40d0ff', shape: 'rover' },
  biped: { shell: '#f0f0ec', acc: '#3a8ad8', eye: '#40f0ff', shape: 'biped' },
  hover: { shell: '#ffffff', acc: '#8a96a8', eye: '#5ae0ff', shape: 'hover' },
  spider: { shell: '#3a3e46', acc: '#e8a020', eye: '#ff5a2a', shape: 'spider' },
  dog: { shell: '#d8dce2', acc: '#2a2e36', eye: '#40d0ff', shape: 'dog' },
};

function shellMat(T, c) {
  switch (T.fin) {
    case 'chrome': return M.chrome();
    case 'gold': return M.metal(c, 0.22);
    case 'rust': return new THREE.MeshStandardMaterial({ name: 'rust', color: c, roughness: 0.85, metalness: 0.4 });
    case 'matte': return new THREE.MeshStandardMaterial({ name: 'matte', color: c, roughness: 0.75, metalness: 0.2 });
    case 'toy': return M.plastic(c, 0.35);
    case 'retro': return M.paint(c, { metallic: 0.3, roughness: 0.4 });
    default: return new THREE.MeshPhysicalMaterial({ name: 'shell', color: c, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 });
  }
}

export function createRobotCompanion(options = {}) {
  const { o, variant, T, r } = setup(options, ROBOT_VARIANTS, 'robot-companion', ROBOT_TRIMS);
  if (!T.trim && o.color) T.shell = o.color;
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const shell = shellMat(T, T.shell);
  const trimM = T.neon ? glowMat(T.acc, 0.8) : shellMat({ fin: T.fin === 'chrome' ? 'matte' : T.fin }, T.acc);
  const joint = M.metal('#4a4e56', 0.4);
  const rubber = M.rubber();
  const visorM = new THREE.MeshPhysicalMaterial({ name: 'visor', color: '#0a0c10', roughness: 0.05, clearcoat: 1, metalness: 0.3 });
  const shape = T.shape;
  const ck = T.chunky ? 1.15 : 1;
  const body = group('body', { parent: rig });
  // head with visor + two glowing eyes; shared by all shapes
  const makeHead = (parent, at, s = 1) => {
    const head = group('head', { parent, at });
    mesh(cushion(0.3 * s * ck, 0.22 * s * ck, 0.3 * s * ck, { radius: 0.07 * s, bulge: 0.12 }), shell, { parent: head, name: 'head_shell' });
    mesh(roundedBox(0.04 * s, 0.13 * s, 0.24 * s, 0.018 * s), visorM, { parent: head, at: [0.15 * s * ck - 0.005, 0.0, 0], name: 'visor' });
    const lg = lampGroup('eyes', 'white', { lens: new THREE.MeshPhysicalMaterial({ name: 'eye_led', color: T.eye, emissive: T.eye, emissiveIntensity: 0.9, roughness: 0.2, toneMapped: false }) });
    lg.glow.color.set(T.eye);
    for (const sg of [1, -1]) lg.add(head, { geometry: new THREE.SphereGeometry(0.028 * s, 12, 8).scale(0.4, 1, 1).translate(0.17 * s * ck, 0.01 * s, sg * 0.06 * s), normal: [1, 0, 0], depth: 0.01, glowSize: 0.16 * s });
    // ear discs
    for (const sg of [1, -1]) mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.03 * s, 18).rotateX(Math.PI / 2), trimM, { parent: head, at: [0, 0, sg * 0.15 * s * ck], name: 'ear' });
    if (T.antenna || shape === 'rover') { mesh(new THREE.CylinderGeometry(0.006 * s, 0.006 * s, 0.16 * s, 6), joint, { parent: head, at: [-0.04 * s, 0.18 * s, 0.06 * s], name: 'antenna' }); mesh(new THREE.SphereGeometry(0.018 * s, 10, 8), glowMat(T.eye, 1.4), { parent: head, at: [-0.04 * s, 0.26 * s, 0.06 * s], name: 'antenna_tip' }); }
    return head;
  };
  const deco = (parent, at, s = 1) => {
    if (T.cross) { mesh(roundedBox(0.012, 0.08 * s, 0.025 * s, 0.004), trimM, { parent, at, name: 'cross_v' }); mesh(roundedBox(0.012, 0.025 * s, 0.08 * s, 0.004), trimM, { parent, at, name: 'cross_h' }); }
    else mesh(new THREE.CylinderGeometry(0.035 * s, 0.035 * s, 0.012, 18).rotateZ(Math.PI / 2), glowMat(T.eye, 1.0), { parent, at, name: 'core_light' });
  };
  let head;
  const legs = [], spin = [];
  if (shape === 'rover') {
    const bh = 0.2;
    mesh(cushion(0.55 * ck, 0.18, 0.4 * ck, { radius: 0.05, bulge: 0.1 }), shell, { parent: body, at: [0, bh, 0], name: 'chest' });
    mesh(roundedBox(0.58 * ck, 0.04, 0.42 * ck, 0.015), trimM, { parent: body, at: [0, bh - 0.08, 0], name: 'skirt' });
    deco(body, [0.28 * ck, bh, 0]);
    // tracks / wheels
    for (const sg of [1, -1]) for (const x of [-0.18, 0, 0.18]) {
      const w = group(`wheel_${sg > 0 ? 'L' : 'R'}${Math.round(x * 10)}`, { parent: body, at: [x * ck, 0.075, sg * 0.24 * ck] });
      mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 20).rotateX(Math.PI / 2), rubber, { parent: w, name: 'tyre' });
      mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.065, 12).rotateX(Math.PI / 2), trimM, { parent: w, name: 'hub' });
      spin.push(w);
    }
    // neck + head
    mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.2, 10), joint, { parent: body, at: [0.1, bh + 0.17, 0], name: 'neck' });
    head = makeHead(body, [0.1, bh + 0.36, 0], 0.9);
    // little arm with gripper
    taper([[0.2, bh + 0.05, 0.18], [0.32, bh + 0.08, 0.24], [0.4, bh, 0.24]], 0.018, 0.014, joint, { parent: body, name: 'arm' });
    mesh(new THREE.TorusGeometry(0.025, 0.007, 6, 12, Math.PI * 1.4), trimM, { parent: body, at: [0.42, bh - 0.01, 0.24], rot: [0, 0, -0.7], name: 'gripper' });
  } else if (shape === 'biped' || shape === 'hover') {
    const hover = shape === 'hover';
    let base = 0;
    if (hover) {
      // charging dock with a light ring; the bot rests its thruster cone in the dock cup
      mesh(lathe([[0, 0], [0.32, 0], [0.33, 0.03], [0.3, 0.07], [0.12, 0.08], [0.1, 0.12], [0, 0.12]], 36), trimM, { parent: rig, name: 'dock' });
      const ring = lampGroup('dock_ring', 'white', { lens: new THREE.MeshPhysicalMaterial({ name: 'ring_led', color: T.eye, emissive: T.eye, emissiveIntensity: 0.5, toneMapped: false }) });
      ring.glow.color.set(T.eye);
      ring.add(rig, { geometry: new THREE.TorusGeometry(0.31, 0.012, 6, 40).rotateX(Math.PI / 2).translate(0, 0.045, 0), normal: [0, 1, 0], depth: 0.01, glowSize: 0.7 });
      base = 0.12;
    }
    const by = hover ? base + 0.2 : 0.62;
    // torso egg
    const tg = new THREE.SphereGeometry(0.2 * ck, 28, 20).scale(1, hover ? 1.05 : 1.2, 0.95);
    mesh(tg, shell, { parent: body, at: [0, by + 0.12, 0], name: 'chest' });
    mesh(new THREE.TorusGeometry(0.19 * ck, 0.018, 8, 32).rotateX(Math.PI / 2), trimM, { parent: body, at: [0, by + 0.06, 0], name: 'waist_band' });
    deco(body, [0.19 * ck, by + 0.16, 0]);
    if (hover) mesh(new THREE.ConeGeometry(0.1, 0.16, 20).rotateX(Math.PI), joint, { parent: body, at: [0, base + 0.06, 0], name: 'thruster' });
    mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 12), joint, { parent: body, at: [0, by + 0.38, 0], name: 'neck' });
    head = makeHead(body, [0, by + 0.5, 0], 1);
    // arms
    for (const sg of [1, -1]) {
      const arm = group(sg > 0 ? 'arm_L' : 'arm_R', { parent: body, at: [0, by + 0.26, sg * 0.2 * ck] });
      mesh(new THREE.SphereGeometry(0.045, 14, 10), joint, { parent: arm, name: 'shoulder' });
      taper([[0, 0, 0], [0.04, -0.14, sg * 0.04], [0.1, -0.26, sg * 0.03]], 0.035, 0.028, shell, { parent: arm, name: 'armlimb' });
      mesh(new THREE.SphereGeometry(0.04, 12, 10), trimM, { parent: arm, at: [0.1, -0.27, sg * 0.03], name: 'hand' });
      legs.push(arm);
    }
    if (!hover) for (const sg of [1, -1]) {
      const lg = group(sg > 0 ? 'leg_L' : 'leg_R', { parent: body, at: [0, by - 0.05, sg * 0.1] });
      mesh(new THREE.CylinderGeometry(0.035, 0.03, by - 0.1, 12).translate(0, -(by - 0.1) / 2, 0), joint, { parent: lg, name: 'leglimb' });
      mesh(cushion(0.18, 0.07, 0.11, { radius: 0.03, bulge: 0.1 }), shell, { parent: lg, at: [0.03, -by + 0.085, 0], name: 'foot' });
      legs.push(lg);
    }
  } else if (shape === 'spider') {
    const by = 0.32;
    mesh(new THREE.SphereGeometry(0.22 * ck, 28, 16, 0, TAU, 0, Math.PI / 2), shell, { parent: body, at: [0, by, 0], name: 'chest' });
    mesh(new THREE.CylinderGeometry(0.22 * ck, 0.18 * ck, 0.07, 28), trimM, { parent: body, at: [0, by - 0.035, 0], name: 'belly' });
    head = makeHead(body, [0.2, by + 0.04, 0], 0.6);
    for (let i = 0; i < 6; i++) {
      const sg = i % 2 ? -1 : 1, k = i >> 1;
      const a = (k - 1) * 0.6;
      const hip = new THREE.Vector3(Math.sin(a) * 0.18, by - 0.02, sg * Math.cos(a) * 0.18);
      const out = new THREE.Vector3(Math.sin(a), 0, sg * Math.cos(a));
      const knee = hip.clone().addScaledVector(out, 0.2).add(new THREE.Vector3(0, 0.16, 0));
      const foot = hip.clone().addScaledVector(out, 0.42);
      foot.y = 0.015;
      const lg = group(`leg_${i}`, { parent: rig, at: hip.toArray() });
      const lo = (p) => p.clone().sub(hip).toArray();
      taper([lo(hip), lo(knee)], 0.028, 0.022, shell, { parent: lg, name: 'femur', seg: 4 });
      mesh(new THREE.SphereGeometry(0.03, 10, 8), joint, { parent: lg, at: lo(knee), name: 'knee' });
      taper([lo(knee), lo(foot)], 0.022, 0.01, joint, { parent: lg, name: 'tibia', seg: 4 });
      mesh(new THREE.SphereGeometry(0.018, 8, 6), rubber, { parent: lg, at: lo(foot), name: 'pad' });
      legs.push(lg);
    }
  } else {
    // robo-dog: box torso on four jointed legs
    const by = 0.42;
    mesh(cushion(0.55 * ck, 0.18, 0.24 * ck, { radius: 0.06, bulge: 0.12 }), shell, { parent: body, at: [0, by, 0], name: 'chest' });
    mesh(roundedBox(0.4, 0.03, 0.25 * ck, 0.01), trimM, { parent: body, at: [0, by + 0.095, 0], name: 'spine_strip' });
    deco(body, [0.276 * ck, by, 0]);
    head = makeHead(body, [0.36, by + 0.12, 0], 0.7);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 10).rotateZ(-0.8), joint, { parent: body, at: [0.3, by + 0.06, 0], name: 'neck' });
    const tail = group('tail', { parent: body, at: [-0.27, by + 0.05, 0] });
    taper([[0.02, 0, 0], [-0.1, 0.1, 0], [-0.14, 0.2, 0]], 0.015, 0.008, joint, { parent: tail, name: 'tail_rod' });
    for (const [n, x] of [['leg_FL', 0.2], ['leg_BL', -0.2]]) for (const sg of [1, -1]) {
      const lg = group(n.replace('L', sg > 0 ? 'L' : 'R'), { parent: rig, at: [x, by - 0.05, sg * 0.14 * ck] });
      mesh(new THREE.SphereGeometry(0.04, 12, 10), joint, { parent: lg, name: 'hip' });
      const kx = x > 0 ? -0.06 : 0.06;
      taper([[0, 0, 0], [kx, -0.18, 0]], 0.035, 0.03, shell, { parent: lg, name: 'thigh', seg: 4 });
      mesh(new THREE.SphereGeometry(0.028, 10, 8), joint, { parent: lg, at: [kx, -0.18, 0], name: 'knee' });
      taper([[kx, -0.18, 0], [0, -by + 0.07, 0]], 0.025, 0.02, joint, { parent: lg, name: 'shin', seg: 4 });
      mesh(new THREE.SphereGeometry(0.035, 12, 8).scale(1.2, 0.8, 1), rubber, { parent: lg, at: [0, -by + 0.04, 0], name: 'paw' });
      legs.push(lg);
    }
  }
  // trim add-ons
  const chestM = body.getObjectByName('chest');
  const cb = new THREE.Box3().setFromObject(chestM);
  if (T.armour) mesh(cushion((cb.max.x - cb.min.x) * 0.7, 0.03, (cb.max.z - cb.min.z) * 0.8, { radius: 0.012, bulge: 0.4 }), M.metal('#6a6e64', 0.5), { parent: body, at: [0, cb.max.y - 0.005, 0], name: 'armour_plate' });
  if (T.pack) mesh(roundedBox(0.12, 0.16, 0.18, 0.03), trimM, { parent: body, at: [cb.min.x + 0.03, (cb.min.y + cb.max.y) / 2 + 0.03, 0], name: 'backpack' });
  if (T.dents) { const g = []; for (let i = 0; i < 8; i++) g.push(new THREE.SphereGeometry(0.012 + r() * 0.015, 6, 4).scale(1, 0.4, 1).translate(cb.min.x + r() * (cb.max.x - cb.min.x), cb.max.y - 0.004, cb.min.z * 0.6 + r() * (cb.max.z - cb.min.z) * 0.6)); mesh(merge(g), plainMat('#6a3a1a', 0.95), { parent: body, name: 'rust_spots' }); }
  if (T.neon) mesh(new THREE.TorusGeometry(Math.max(0.1, (cb.max.z - cb.min.z) * 0.45), 0.008, 6, 32).rotateX(Math.PI / 2), glowMat(T.acc, 1.6), { parent: body, at: [(cb.min.x + cb.max.x) / 2, cb.min.y + 0.02, 0], name: 'neon_ring' });
  void orient; void darkMat;
  if (T.scale !== 1) rig.scale.setScalar(T.scale);
  A.add('idle', 3, rotateTrack(head, 'y', 3, (t) => 0.4 * Math.sin(TAU * t)), moveTrack(head, 3, (t) => [0, 0.008 * Math.sin(TAU * t * 2), 0]));
  if (shape === 'rover') A.add('drive', 1, ...spin.map((w) => spinTrack(w, 'z', 1, -1)));
  else if (shape === 'hover') { A.add('hover', 2, moveTrack(body, 2, (t) => [0, 0.03 + 0.03 * Math.sin(TAU * t), 0])); A.add('on', 1, lampTracks('dock_ring', 2.5)); legs.forEach((a, i) => A.add('wave', 1, swing(a, 'x', 1, 0.4 * (i ? 1 : -1)))); }
  else if (shape === 'biped') { legs.forEach((l, i) => A.add('walk', 0.8, swing(l, 'z', 0.8, 0.35, (i % 2) * 0.5 + (i >= 2 ? 0.5 : 0)))); }
  else if (shape === 'spider') legs.forEach((l, i) => A.add('walk', 0.6, swing(l, 'y', 0.6, 0.25, ((i >> 1) + (i % 2)) * 0.5)));
  else { legs.forEach((l, i) => A.add('walk', 0.7, swing(l, 'z', 0.7, 0.35, (i % 2) * 0.5 + (i >= 2 ? 0.25 : 0)))); A.add('wag', 0.4, swing(body.getObjectByName('tail'), 'x', 0.4, 0.5)); }
  A.add('glow', 1, lampTracks('eyes', 3));
  return done(root, 'robot-companion', variant, o, T, A.list());
}
