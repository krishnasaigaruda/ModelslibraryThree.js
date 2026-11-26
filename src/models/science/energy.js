// Energy & tech: solar arrays, wind turbines, batteries, circuit boards, robot arms,
// humanoid robots, drones, 3D printers and server racks.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, cushion, setup, done, fin, body, frameMat, darkMat, glassMat, lamp, glowStrip, slab, rodY, rodX, rodZ, bar, labelPlane, panel, emblem, foot, hazard, canvasTex } from './common.js';
import { solarPanel } from './space.js';
import { clip, spinTrack, rotateTrack, moveTrack, pingPong, wave } from '../../core/animation.js';
import { lampTracks, LAMP_ON } from '../../core/lamps.js';

/* ================================ SOLAR ================================ */

export const SOLAR_VARIANTS = { 'ground-array': {}, 'roof-panel': {}, tracker: {}, 'solar-streetlight': {}, 'portable-kit': {} };

export function createEnergySolar(options = {}) {
  const { o, variant, T } = setup(options, SOLAR_VARIANTS, 'energy-solar');
  const root = group(`energy-solar-${variant}`);
  const fm = frameMat(T);
  const col = T.trim === 'futuristic' ? '#0b1022' : T.trim === 'vintage' ? '#2b3a5a' : T.trim === 'research' ? '#141a2e' : T.trim === 'school' ? '#1d4fa0' : '#1b2f6b';
  const pw = 1.7, ph = 1.0;
  const anims = [];
  const legM = T.heavy ? fin(T, '#f2b705', 'paint') : T.vintage ? M.wood('#6b4426') : fm;
  if (variant === 'ground-array') {
    const n = T.heavy ? 5 : 4, rows = T.detail > 1 ? 3 : 2, tilt = 0.5;
    const L = n * (pw + 0.02);
    for (const xx of [-L / 2 + 0.2, 0, L / 2 - 0.2]) rodY(0, 0.6, 0.04, legM, root, { x: xx, z: -0.6 });
    const rack = group('rack', { parent: root, at: [0, 0.6, -0.6], rot: [-tilt, 0, 0] });
    for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) solarPanel(rack, pw, ph, { at: [-L / 2 + pw / 2 + i * (pw + 0.02), ph / 2 + j * (ph + 0.01), 0.06], cells: 10, rows: 6, col, th: 0.04, frame: M.metal(T.trim === 'futuristic' ? '#1d2129' : '#c9ccd2', 0.3) });
    for (const y of [0.15, rows * ph - 0.15]) rodX(-L / 2, L / 2, 0.035, legM, rack, { y, z: 0.0 });
    // rear posts: compute rail position in world from rack transform
    root.updateMatrixWorld(true);
    for (const xx of [-L / 2 + 0.2, 0, L / 2 - 0.2]) { const p = new THREE.Vector3(xx, rows * ph - 0.15, -0.035).applyMatrix4(rack.matrix); bar([xx, 0, p.z], [xx, p.y, p.z], 0.04, legM, root); foot(root, M.matte('#8d8f94'), xx, p.z, 0.12, 0.1); foot(root, M.matte('#8d8f94'), xx, -0.6, 0.12, 0.1); }
    // inverter box
    const inv = group('inverter', { parent: root, at: [L / 2 + 0.4, 0, -0.6] });
    rodY(0, 0.9, 0.03, legM, inv);
    slab(inv, fin(T, '#e9ebee', 'gloss'), 0.4, 0.5, 0.18, { y: 0.6, z: 0.12, r: 0.02 });
    lamp(T, inv, 'green', { at: [0.1, 1.0, 0.211], w: 0.015, h: 0.015, shape: 'round' });
  } else if (variant === 'roof-panel') {
    // pitched roof section with panels
    const rw = 4.2, rl = 3.2, pitch = 0.6;
    const roofM = T.vintage ? M.matte('#8a3f26') : T.trim === 'school' ? M.matte('#c96a3a') : M.matte('#4a4d52');
    const prof = [[-rw / 2, 0], [rw / 2, 0], [rw / 2, 0.2], [0, 0.2 + (rw / 2) * Math.tan(pitch)], [-rw / 2, 0.2]];
    mesh(extrudeOutline(prof, rl, { bevel: 0.02 }), M.matte(T.vintage ? '#d9cdb3' : '#e8e4da'), { parent: root, at: [0, 0, 0] });
    const sl = (rw / 2) / Math.cos(pitch);
    for (const s of [-1, 1]) {
      const side = group(`roof${s}`, { parent: root, at: [0, 0.2 + (rw / 2) * Math.tan(pitch), 0], rot: [0, 0, s * -pitch] });
      slab(side, roofM, sl + 0.25, 0.06, rl + 0.2, { x: s * (sl + 0.25) / 2, y: -0.03, r: 0.01 });
      if (s > 0) for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) solarPanel(side, ph, pw, { at: [0.25 + ph / 2 + i * (ph + 0.02), 0.08, -rl / 2 + 0.18 + pw / 2 * 0 + j * 1.02 + 0.32], rot: [-Math.PI / 2, 0, Math.PI / 2], cells: 6, rows: 10, col, th: 0.04 });
      if (s > 0) for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) slab(side, M.metal('#9aa0a6'), 0.06, 0.05, 0.06, { x: 0.25 + ph / 2 + i * (ph + 0.02), y: 0.0, z: -rl / 2 + 0.5 + j * 1.02, r: 0.01 });
    }
    if (T.heavy || T.detail > 1) { const ch = group('chimney', { parent: root, at: [-rw * 0.25, 0, rl * 0.25] }); slab(ch, M.matte('#8a3f26'), 0.5, 2.0, 0.5, { r: 0.02 }); }
  } else if (variant === 'tracker') {
    // dual-axis pole tracker
    mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 24), M.matte('#9a9c9f'), { parent: root, at: [0, 0.15, 0] });
    rodY(0.3, 3.0, 0.12, legM, root);
    const head = group('head', { parent: root, at: [0, 3.0, 0] });
    slab(head, darkMat(T), 0.4, 0.3, 0.4, { r: 0.05 });
    const tilt = group('tilt', { parent: head, at: [0, 0.3, 0], rot: [-0.7, 0, 0] });
    rodX(-1.6, 1.6, 0.06, legM, tilt);
    for (let i = -1; i <= 1; i++) for (let j = 0; j < 2; j++) solarPanel(tilt, pw * 0.6, ph * 1.4, { at: [i * (pw * 0.6 + 0.02), (j - 0.5) * (ph * 1.4 + 0.02), 0.08], cells: 6, rows: 10, col, th: 0.04 });
    anims.push(clip('track', 10, [rotateTrack(head, 'y', 10, (t) => 1.2 * wave(t)), rotateTrack(tilt, 'x', 10, (t) => 0.3 * wave(t, 2))]));
  } else if (variant === 'solar-streetlight') {
    mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.2, 16), M.matte('#9a9c9f'), { parent: root, at: [0, 0.1, 0] });
    rodY(0.2, 6, 0.07, fm, root, { r2: 0.05 });
    curveTube([[0, 5.6, 0], [0.3, 6.0, 0], [1.2, 6.1, 0]], 0.04, fm, { parent: root });
    slab(root, darkMat(T), 0.6, 0.08, 0.25, { x: 1.3, y: 6.02, r: 0.03 });
    lamp(T, root, 'white', { at: [1.3, 6.015, 0], normal: [0, -1, 0], w: 0.5, h: 0.18, glowSize: 1.4 });
    const sp = group('panel', { parent: root, at: [0, 6.2, 0], rot: [-0.5, 0, 0] });
    rodY(-0.25, 0.0, 0.04, fm, sp);
    solarPanel(sp, 1.2, 0.7, { at: [0, 0.0, 0.03], cells: 6, rows: 4, col, th: 0.04 });
    slab(root, fin(T, '#e9ebee', 'gloss'), 0.3, 0.5, 0.2, { y: 2.6, z: 0.08, r: 0.02 });
  } else {
    // portable kit: folding suitcase panel on kickstand + power station
    const fold = group('fold', { parent: root, at: [0, 0.02, 0], rot: [-1.15, 0, 0] });
    for (const s of [-1, 1]) solarPanel(fold, 0.55, 0.7, { at: [s * 0.28, 0.35, 0], cells: 4, rows: 6, col, th: 0.03, frame: fin(T, T.trim === 'school' ? '#ffc81e' : '#2a2d33', 'plastic') });
    for (const s of [-1, 1]) bar([s * 0.4, 0, -0.35], [s * 0.4, 0.55 * Math.cos(1.15) + 0.02, -0.55 * Math.sin(1.15) * 0 - 0.05], 0.008, M.metal('#9aa0a6'), root);
    mesh(roundedBox(0.04, 0.02, 0.6, 0.008), darkMat(T), { parent: root, at: [0, 0.01, 0.02] });
    const ps = group('power-station', { parent: root, at: [0.75, 0, 0.1] });
    slab(ps, fin(T, T.trim === 'school' ? '#2b7de1' : T.p === '#e8eaee' ? '#e9ebee' : T.p, T.finish), 0.3, 0.22, 0.2, { r: 0.025 });
    rodX(-0.1, 0.1, 0.012, darkMat(T), ps, { y: 0.24 });
    for (const x of [-0.1, 0.1]) rodY(0.21, 0.24, 0.012, darkMat(T), ps, { x });
    ps.add(Object.assign(panel(0.12, 0.07, 0.006, (c, w, h) => { c.fillStyle = '#071018'; c.fillRect(0, 0, w, h); c.fillStyle = '#7dffa0'; c.font = `bold ${h * 0.45}px monospace`; c.fillText('87%', 8, h * 0.6); c.fillRect(8, h * 0.72, w * 0.7, h * 0.12); }, darkMat(T), { emissive: 0.8, bg: '#0b1a12' })));
    ps.children[ps.children.length - 1].position.set(-0.05, 0.12, 0.103);
    curveTube([[0, 0.1, 0.05], [0.3, 0.02, 0.2], [0.6, 0.01, 0.15], [0.6, 0.06, 0.2]], 0.006, M.rubber(), { parent: root });
  }
  if (T.trim === 'futuristic') glowStrip(T, root, [[-0.3, 0.012, 0.6], [0.3, 0.012, 0.6]], 0.01);
  if (T.trim === 'futuristic') slab(root, darkMat(T), 0.7, 0.012, 0.06, { z: 0.6, r: 0.004 });
  return done(root, T, variant, o, anims);
}

/* ============================== WIND TURBINES ============================== */

export const WIND_VARIANTS = { utility: { H: 80, R: 45, n: 3 }, 'small-2blade': { H: 12, R: 2.5, n: 2 }, 'vertical-axis': { H: 9, R: 1.5, vawt: true }, offshore: { H: 100, R: 60, n: 3, sea: true }, 'desk-model': { H: 0.5, R: 0.18, n: 3, desk: true } };

function bladeGeo(R, chord) {
  // twisted tapered airfoil blade along +Y
  const g = new THREE.BoxGeometry(chord, R, chord * 0.18, 2, 16, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + R / 2, t = y / R;
    const w = (t < 0.12 ? 0.55 + t * 3.5 : 1 - (t - 0.12) * 0.85) * (t < 0.03 ? 0.5 : 1);
    const tw = (1 - t) * 0.5;
    const x = p.getX(i) * w, z = p.getZ(i) * w * (1.2 - t * 0.7) + (p.getX(i) > 0 ? 0 : chord * 0.04 * (1 - t));
    p.setXYZ(i, x * Math.cos(tw) - z * Math.sin(tw) + chord * 0.15 * (1 - t), y, x * Math.sin(tw) + z * Math.cos(tw));
  }
  g.computeVertexNormals();
  return g;
}

export function createEnergyWind(options = {}) {
  const { o, variant, T, V } = setup(options, WIND_VARIANTS, 'energy-wind');
  const root = group(`energy-wind-${variant}`);
  const { H, R } = V;
  const tm = T.vintage ? M.matte('#e6dcc6') : body(T, T.trim ? (T.heavy ? '#f2f2ee' : T.p) : '#f4f4f2');
  const bm = T.vintage ? M.wood('#a0784c') : T.trim === 'futuristic' ? fin(T, '#16191f', 'carbon') : T.kids ? fin(T, T.s, 'plastic') : fin(T, '#f6f6f4', 'gloss');
  const anims = [];
  if (V.vawt) {
    // Darrieus/H-rotor on a mast
    slab(root, M.matte('#9a9c9f'), 1.2, 0.3, 1.2, { r: 0.05 });
    rodY(0.3, 5, 0.12, tm, root, { r2: 0.09 });
    const rot = group('rotor', { parent: root, at: [0, 5, 0] });
    rodY(0, 3.6, 0.07, tm, rot);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push([Math.cos(a) * R * Math.sin(Math.PI * t) + Math.cos(a) * 0.07, 0.1 + t * 3.4, Math.sin(a) * R * Math.sin(Math.PI * t) + Math.sin(a) * 0.07]); }
      if (T.trim === 'research' || T.heavy) for (const y of [1.0, 2.5]) bar([0, y, 0], [Math.cos(a) * R * Math.sin(Math.PI * (y - 0.1) / 3.4), y, Math.sin(a) * R * Math.sin(Math.PI * (y - 0.1) / 3.4)], 0.04, tm, rot);
      curveTube(pts, 0.09, bm, { parent: rot, radialSegments: 8 });
    }
    anims.push(clip('spin', 2, [spinTrack(rot, 'y', 2)]));
    return done(root, T, variant, o, anims);
  }
  let base = 0;
  if (V.sea) {
    // monopile transition piece in a patch of sea
    mesh(new THREE.CylinderGeometry(14, 14, 1, 48, 1), new THREE.MeshPhysicalMaterial({ name: 'sea', color: '#1d5f7a', roughness: 0.15, transmission: 0.2, transparent: true, opacity: 0.9 }), { parent: root, at: [0, 0.5, 0] });
    mesh(new THREE.CylinderGeometry(3.2, 3.2, 14, 32), fin(T, '#f2b705', 'paint'), { parent: root, at: [0, 7, 0] });
    mesh(new THREE.CylinderGeometry(6, 6, 0.6, 32), fin(T, '#8d939c', 'metal'), { parent: root, at: [0, 12, 0] });
    base = 14;
  } else if (V.desk) {
    mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.025, 32), T.vintage ? M.wood('walnut') : darkMat(T), { parent: root, at: [0, 0.0125, 0] });
    base = 0.025;
  } else {
    mesh(new THREE.CylinderGeometry(H * 0.08, H * 0.09, H * 0.02, 32), M.matte('#9a9c9f'), { parent: root, at: [0, H * 0.01, 0] });
    base = H * 0.02;
  }
  const tr = V.desk ? 0.008 : H * 0.03;
  if (variant === 'small-2blade' && (T.vintage || T.heavy)) {
    // lattice tower
    const s0 = H * 0.075, s1 = 0.3;
    for (const x of [-1, 1]) for (const z of [-1, 1]) bar([x * s0, base, z * s0], [x * s1, base + H, z * s1], 0.05, frameMat(T), root);
    for (let k = 1; k < 6; k++) { const y = base + (k / 6) * H, s = s0 + (s1 - s0) * (k / 6); for (const z of [-1, 1]) bar([-s, y, z * s], [s, y, z * s], 0.03, frameMat(T), root); for (const x of [-1, 1]) bar([x * s, y, -s], [x * s, y, s], 0.03, frameMat(T), root); }
    slab(root, frameMat(T), s1 * 2 + 0.1, 0.1, s1 * 2 + 0.1, { y: base + H - 0.05, r: 0.02 });
  } else {
    mesh(new THREE.CylinderGeometry(tr * 0.6, tr, H, 32, Math.max(1, Math.round(H / 6))), tm, { parent: root, at: [0, base + H / 2, 0] });
    if (!V.desk && !V.sea) { slab(root, darkMat(T), tr * 0.5, tr * 0.9, 0.05, { y: base, z: tr - 0.01, r: 0.01 }); }
  }
  // nacelle (yaw) + hub (spin)
  const yaw = group('nacelle', { parent: root, at: [0, base + H, 0] });
  const nl = V.desk ? 0.06 : H * 0.12, nh = V.desk ? 0.025 : H * 0.045;
  mesh(cushion(nl, nh, nh * 0.95, { radius: nh * 0.3, bulge: 0.05 }), tm, { parent: yaw, at: [-nl * 0.15, nh / 2, 0] });
  if (!V.desk) lamp(T, yaw, 'red', { at: [-nl * 0.4, nh + 0.0, 0], normal: [0, 1, 0], w: nh * 0.12, h: nh * 0.12, shape: 'round', glowSize: nh * 1.2 });
  const hub = group('rotor', { parent: yaw, at: [nl * 0.38, nh * 0.5, 0], rot: [0, 0, 0] });
  mesh(new THREE.SphereGeometry(nh * 0.45, 24, 16).scale(1.5, 1, 1), tm, { parent: hub, at: [nh * 0.25, 0, 0] });
  const bl = bladeGeo(R * 0.97, R * 0.08);
  for (let i = 0; i < V.n; i++) {
    const b = group(`blade${i}`, { parent: hub, at: [nh * 0.3, 0, 0], rot: [(i / V.n) * Math.PI * 2, 0, 0] });
    mesh(bl, bm, { parent: b, at: [0, nh * 0.2, 0] });
    if (T.heavy || T.trim === 'school') mesh(new THREE.CylinderGeometry(R * 0.04, R * 0.035, R * 0.1, 12), fin(T, T.heavy ? '#d23b2a' : T.a, 'paint'), { parent: b, at: [R * 0.012, R * 0.9, 0] });
  }
  if (T.trim === 'futuristic') glowStrip(T, root, [[tr * 0.98, base + H * 0.2, 0], [tr * 0.7, base + H * 0.8, 0]], V.desk ? 0.002 : H * 0.004);
  emblem(yaw, nh * 0.4, [-nl * 0.15, nh * 0.5, nh * 0.475 + 0.002]);
  anims.push(clip('spin', V.desk ? 1 : H / 20, [spinTrack(hub, 'x', V.desk ? 1 : H / 20)]));
  return done(root, T, variant, o, anims);
}

/* ================================ BATTERIES ================================ */

export const BATTERY_VARIANTS = { 'aa-cells': {}, 'd-cell': {}, 'lithium-pack': {}, 'car-battery': {}, 'home-powerwall': {}, 'button-cells': {} };

const BRANDS = { vintage: ['#2b211a', '#c9a24a'], school: ['#2b7de1', '#ffc81e'], research: ['#eef0f3', '#1e88e5'], industrial: ['#f2b705', '#16171a'], futuristic: ['#16191f', '#22e1ff'], weathered: ['#7a6e5c', '#b5a993'] };

function cell(T, parent, r, h, at, rot = [0, 0, 0], name = 'cell') {
  const [c1, c2] = BRANDS[T.trim] ?? ['#16171a', '#e8792b'];
  const g = group(name, { parent, at, rot });
  mesh(new THREE.CylinderGeometry(r, r, h * 0.94, 32, 1), fin(T, c1, 'gloss'), { parent: g, at: [0, h * 0.47, 0] });
  mesh(new THREE.CylinderGeometry(r * 1.001, r * 1.001, h * 0.35, 32, 1, true), fin(T, c2, 'gloss'), { parent: g, at: [0, h * 0.73, 0] });
  mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.95, h * 0.03, 32), M.chrome(), { parent: g, at: [0, h * 0.955, 0] });
  mesh(new THREE.CylinderGeometry(r * 0.32, r * 0.35, h * 0.04, 20), M.chrome(), { parent: g, at: [0, h * 0.99, 0] });
  mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, h * 0.02, 32), M.chrome(), { parent: g, at: [0, h * 0.01, 0] });
  return g;
}

export function createEnergyBattery(options = {}) {
  const { o, variant, T } = setup(options, BATTERY_VARIANTS, 'energy-battery');
  const root = group(`energy-battery-${variant}`);
  const [c1, c2] = BRANDS[T.trim] ?? ['#16171a', '#e8792b'];
  if (variant === 'aa-cells') {
    // blister card of AA cells + two loose ones
    for (let i = 0; i < 4; i++) cell(T, root, 0.007, 0.05, [-0.024 + i * 0.016, 0, 0], [0, 0, 0], `cell${i}`);
    for (let i = 0; i < 2; i++) cell(T, root, 0.007, 0.05, [-0.01 + i * 0.03, 0.007, 0.04], [Math.PI / 2, 0, 0.3 + i], `loose${i}`);
    slab(root, fin(T, c2, 'plastic'), 0.08, 0.002, 0.025, { y: 0, z: -0.006, r: 0.0008 });
  } else if (variant === 'd-cell') {
    for (let i = 0; i < 3; i++) cell(T, root, 0.0171, 0.0615, [-0.036 + i * 0.036, 0, 0], [0, 0, 0], `cell${i}`);
    cell(T, root, 0.0171, 0.0615, [0.0, 0.0171, 0.05], [0, 0, Math.PI / 2], 'loose');
  } else if (variant === 'button-cells') {
    for (let i = 0; i < 6; i++) { const g = group(`coin${i}`, { parent: root, at: [(i % 3) * 0.024 - 0.024, i < 3 ? 0 : 0.0032, i < 3 ? 0 : 0.0] }); mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.0032, 32), M.chrome(), { parent: g, at: [0, 0.0016, 0] }); mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.0004, 32), M.metal('#9aa0a6'), { parent: g, at: [0, 0.0034, 0] }); }
    slab(root, fin(T, c1, 'plastic'), 0.09, 0.003, 0.05, { y: -0.003, r: 0.001 });
  } else if (variant === 'lithium-pack') {
    // 18650 pack: cells in holders, nickel strips, wrap + BMS board
    const pack = group('pack', { parent: root });
    const nx = 5, nz = 3, r = 0.0092, h = 0.065;
    slab(pack, M.plastic('#2a2d33', 0.5), nx * r * 2 + 0.004, 0.006, nz * r * 2 + 0.004, { r: 0.002 });
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) cell({ ...T, trim: T.trim ?? 'futuristic' }, pack, r, h, [-(nx - 1) * r + i * r * 2, 0.004, -(nz - 1) * r + j * r * 2], [0, 0, 0], `c${i}${j}`);
    for (let j = 0; j < nz; j++) slab(pack, M.metal('#c9ccd2', 0.25), nx * r * 2, 0.001, 0.008, { y: 0.004 + h, z: -(nz - 1) * r + j * r * 2, r: 0.0003 });
    const bms = group('bms', { parent: pack, at: [0, 0.004 + h + 0.001, 0] });
    slab(bms, M.plastic('#1b5e20', 0.5), 0.05, 0.0016, 0.03, { r: 0.0005 });
    for (let k = 0; k < 4; k++) slab(bms, M.plastic('#111', 0.5), 0.006, 0.0014, 0.005, { x: -0.015 + k * 0.01, y: 0.0016, r: 0.0003 });
    curveTube([[0.024, 0.074, 0.005], [0.05, 0.07, 0.01], [0.07, 0.003, 0.02]], 0.0018, M.plastic('#d23b2a', 0.4), { parent: pack });
    curveTube([[0.024, 0.074, -0.005], [0.052, 0.07, -0.01], [0.075, 0.003, -0.02]], 0.0018, M.plastic('#16171a', 0.4), { parent: pack });
  } else if (variant === 'car-battery') {
    const w = 0.24, h = 0.175, d = 0.175;
    slab(root, fin(T, c1, 'plastic'), w, h, d, { r: 0.008 });
    slab(root, fin(T, c1 === '#16171a' ? '#2a2d33' : c2, 'plastic'), w, 0.02, d, { y: h - 0.002, r: 0.006 });
    for (const [x, col] of [[-0.085, '#d23b2a'], [0.085, '#16171a']]) { mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.02, 16), M.metal('#9a8d6a', 0.4), { parent: root, at: [x, h + 0.028, -0.05] }); mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 16), M.plastic(col, 0.4), { parent: root, at: [x, h + 0.022, -0.05] }); }
    rodX(-0.06, 0.06, 0.006, M.plastic('#2a2d33', 0.5), root, { y: h + 0.03, z: 0 });
    for (const x of [-0.06, 0.06]) rodY(h + 0.017, h + 0.03, 0.006, M.plastic('#2a2d33', 0.5), root, { x });
    const lb = labelPlane(w * 0.8, h * 0.5, (c, W, H) => { c.fillStyle = c1; c.fillRect(0, 0, W, H); c.fillStyle = c2; c.fillRect(0, H * 0.65, W, H * 0.2); c.fillStyle = '#fff'; c.font = `bold ${H * 0.28}px sans-serif`; c.fillText('12V  70Ah', W * 0.08, H * 0.45); }, { bg: c2 });
    lb.position.set(0, h * 0.5, d / 2 + 0.0005); root.add(lb);
    emblem(root, 0.03, [w * 0.35, h * 0.8, d / 2 + 0.003]);
  } else {
    // home battery wall unit on a plinth
    const w = 0.75, h = 1.15, d = 0.15;
    slab(root, M.matte('#9a9c9f'), w + 0.1, 0.05, d + 0.15, { r: 0.01 });
    slab(root, fin(T, T.trim ? c1 : '#f4f4f2', T.trim ? T.finish : 'gloss'), w, h, d, { y: 0.05, r: 0.05 });
    const st = [0.25, 0.5, 0.75, 1.0];
    st.forEach((_, i) => lamp(T, root, 'green', { at: [0, 0.05 + h * 0.3 + i * 0.03, d / 2 + 0.001], w: 0.12, h: 0.008, shape: 'strip' }));
    emblem(root, 0.08, [0, 0.05 + h * 0.75, d / 2 + 0.004]);
    if (T.trim === 'futuristic') glowStrip(T, root, [[-w / 2 + 0.02, 0.06, d / 2 + 0.002], [-w / 2 + 0.02, 0.05 + h - 0.06, d / 2 + 0.002]], 0.005);
  }
  return done(root, T, variant, o);
}

/* ============================== CIRCUIT BOARDS ============================== */

export const BOARD_VARIANTS = { 'micro-board': {}, 'pcb-large': {}, breadboard: {}, motherboard: {}, 'led-matrix': {} };

export function createTechCircuitBoard(options = {}) {
  const { o, variant, T } = setup(options, BOARD_VARIANTS, 'tech-circuit-board');
  const root = group(`tech-circuit-board-${variant}`);
  const pcbCol = T.trim === 'vintage' ? '#a9773a' : T.trim === 'school' ? '#1d4fa0' : T.trim === 'research' ? '#f2f3f5' : T.trim === 'industrial' ? '#8a1c1c' : T.trim === 'futuristic' ? '#121418' : T.trim === 'weathered' ? '#4b5a3a' : '#1f6b3a';
  const pcb = new THREE.MeshPhysicalMaterial({ name: 'pcb', color: pcbCol, roughness: 0.45, clearcoat: 0.6 });
  const chip = M.plastic('#16171a', 0.45);
  const gold = M.metal('#d6a93c', 0.25);
  const sizes = { 'micro-board': [0.069, 0.053], 'pcb-large': [0.16, 0.1], breadboard: [0.165, 0.055], motherboard: [0.305, 0.244], 'led-matrix': [0.12, 0.12] };
  const [w, d] = sizes[variant];
  const sh = 0.006; // standoff height
  const traces = canvasTex(256, Math.round((256 * d) / w), (c, W, H) => { c.fillStyle = pcbCol; c.fillRect(0, 0, W, H); c.strokeStyle = T.trim === 'vintage' ? '#e1b062' : '#d6c36a'; c.lineWidth = 1.5; for (let i = 0; i < 40; i++) { c.beginPath(); let x = (i * 37) % W, y = (i * 53) % H; c.moveTo(x, y); for (let k = 0; k < 4; k++) { if (k % 2) x += ((i * k * 13) % 40) - 20; else y += ((i * k * 7) % 40) - 20; c.lineTo(x, y); } c.stroke(); } });
  if (variant === 'breadboard') {
    slab(root, M.plastic('#f4f4f2', 0.5), w, 0.0085, d, { r: 0.0015 });
    const holes = canvasTex(512, 170, (c, W, H) => { c.fillStyle = '#f4f4f2'; c.fillRect(0, 0, W, H); c.fillStyle = '#555'; for (let i = 0; i < 60; i++) for (let j = 0; j < 14; j++) { if (j === 2 || j === 7 || j === 11) continue; c.fillRect(8 + i * 8.3, 10 + j * 11, 3, 3); } c.fillStyle = '#d23b2a'; c.fillRect(0, 4, W, 1.5); c.fillStyle = '#1d4fa0'; c.fillRect(0, H - 6, W, 1.5); });
    if (holes) { const hp = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.98, d * 0.96), new THREE.MeshStandardMaterial({ map: holes, roughness: 0.6 })); hp.rotation.x = -Math.PI / 2; hp.position.y = 0.0086; root.add(hp); }
    const cols = ['#d23b2a', '#1d4fa0', '#2fbf4a', '#f2b705', '#16171a', '#ff7a1a'];
    for (let i = 0; i < 9; i++) { const x0 = -w * 0.4 + i * 0.016, z0 = -d * 0.3 + (i % 3) * 0.01; curveTube([[x0, 0.006, z0], [x0 + 0.005, 0.018 + (i % 3) * 0.004, z0 + 0.01], [x0 + 0.012, 0.006, z0 + 0.025]], 0.0007, M.plastic(cols[i % 6], 0.4), { parent: root }); }
    for (let i = 0; i < 4; i++) { const lg = group(`led${i}`, { parent: root, at: [w * 0.2 + i * 0.012, 0.0085, 0.006] }); rodY(0, 0.006, 0.0004, M.metal('#c9ccd2'), lg); lamp(T, lg, ['red', 'green', 'amber', 'blue'][i], { geometry: new THREE.SphereGeometry(0.0025, 12, 8).scale(1, 1.6, 1).translate(0, 0.009, 0), glowSize: 0.02 }); }
    slab(root, chip, 0.02, 0.004, 0.0075, { x: -0.01, y: 0.0085, r: 0.0008 });
    return done(root, T, variant, o);
  }
  // standoffs + board
  for (const x of [-1, 1]) for (const z of [-1, 1]) mesh(new THREE.CylinderGeometry(0.0025, 0.0025, sh, 6), M.metal('#c9a24a', 0.3), { parent: root, at: [x * (w / 2 - 0.004), sh / 2, z * (d / 2 - 0.004)] });
  const bt = 0.0016;
  slab(root, pcb, w, bt, d, { y: sh, r: 0.0006 });
  if (traces) { const tp = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.99, d * 0.99), new THREE.MeshPhysicalMaterial({ map: traces, roughness: 0.4, clearcoat: 0.6 })); tp.rotation.x = -Math.PI / 2; tp.position.y = sh + bt + 0.0001; root.add(tp); }
  const top = sh + bt;
  const comp = (x, z, cw, ch, cd, mat = chip) => slab(root, mat, cw, ch, cd, { x, y: top, z, r: Math.min(0.0008, ch / 3) });
  if (variant === 'micro-board') {
    comp(0, 0, 0.01, 0.0012, 0.01);
    comp(-w / 2 + 0.008, d * 0.2, 0.012, 0.004, 0.009, M.chrome());
    comp(-w / 2 + 0.007, -d * 0.25, 0.014, 0.011, 0.009, M.plastic('#16171a', 0.5));
    for (const z of [-d / 2 + 0.004, d / 2 - 0.004]) comp(0.005, z, 0.05, 0.008, 0.0025, M.plastic('#16171a', 0.5));
    comp(w * 0.25, 0.008, 0.006, 0.003, 0.003, M.metal('#c9ccd2'));
    lamp(T, root, 'green', { at: [w * 0.3, top + 0.0008, -0.01], normal: [0, 1, 0], w: 0.002, h: 0.0012, glowSize: 0.015 });
  } else if (variant === 'pcb-large') {
    for (let i = 0; i < 4; i++) comp(-0.05 + i * 0.03, 0.02, 0.018, 0.003, 0.008);
    for (let i = 0; i < 6; i++) { const g = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 16), M.metal(['#1d4fa0', '#16171a', '#2a2d33'][i % 3], 0.3), { parent: root, at: [-0.06 + i * 0.022, top + 0.006, -0.025] }); void g; }
    for (let i = 0; i < 10; i++) comp(-0.06 + i * 0.012, -0.04, 0.006, 0.0015, 0.0025, M.matte(['#c9a26a', '#2a7fd4'][i % 2]));
    comp(0.06, 0.03, 0.02, 0.015, 0.012, M.plastic('#2a7fd4', 0.4));
    comp(0, -0.01, 0.025, 0.002, 0.012, M.plastic('#2a2d33', 0.5));
    lamp(T, root, 'red', { at: [0.07, top + 0.0008, -0.04], normal: [0, 1, 0], w: 0.003, h: 0.002, glowSize: 0.02 });
  } else if (variant === 'motherboard') {
    comp(-0.03, 0.04, 0.045, 0.004, 0.045, M.metal('#c9ccd2', 0.3));
    // cpu cooler fins
    for (let i = 0; i < 9; i++) comp(-0.03, 0.04 - 0.02 + i * 0.005, 0.06, 0.035, 0.0012, M.metal('#b9bec6', 0.3));
    for (let i = 0; i < 4; i++) comp(0.06 + i * 0.012, 0.04, 0.006, 0.03, 0.13, M.plastic('#16171a', 0.5));
    for (let i = 0; i < 3; i++) comp(0, -0.06 - i * 0.022, 0.18, 0.011, 0.007, M.plastic('#f4f4f2', 0.5));
    comp(-0.13, 0.0, 0.015, 0.03, 0.17, M.metal('#9aa0a6', 0.4));
    comp(0.11, -0.08, 0.04, 0.008, 0.04, M.metal('#c9ccd2', 0.3));
    for (let i = 0; i < 12; i++) { mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.01, 12), M.metal('#2a2d33', 0.3), { parent: root, at: [-0.075 + (i % 6) * 0.01, top + 0.005, 0.0 + Math.floor(i / 6) * 0.01] }); }
    lamp(T, root, T.trim === 'futuristic' ? 'blue' : 'green', { at: [0.13, top + 0.0008, 0.1], normal: [0, 1, 0], w: 0.004, h: 0.002, glowSize: 0.03 });
  } else {
    // LED matrix 8x8 with controller
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      const on = (i + j) % 3 !== 0 && Math.abs(i - 3.5) + Math.abs(j - 3.5) < 5;
      lamp(T, root, on ? (T.trim === 'futuristic' ? 'blue' : 'red') : 'white', { geometry: new THREE.CylinderGeometry(0.004, 0.004, 0.003, 12).translate(-0.049 + i * 0.014, top + 0.0015, -0.049 + j * 0.014), glowSize: 0.02 });
    }
    comp(0, d / 2 - 0.006, 0.03, 0.004, 0.008, M.plastic('#16171a', 0.5));
  }
  if (T.trim === 'research' || T.trim === 'industrial') emblem(root, 0.012, [w / 2 - 0.012, top + 0.0012, d / 2 - 0.012], 'y');
  return done(root, T, variant, o);
}
