// Home tech: media devices (streaming, projector, webcam), power & storage accessories, smart-home gadgets.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, tube, clip, rotateTrack, moveTrack, spinTrack, numberTrack, pingPong, PI,
  makeDevice, screen, led, rgb, emblem, vents, ports, slab, trimShell, frame } from './kit.js';
import { plateGeo, buildSlate, leanOnStand } from './mobile.js';

const lensMat = () => new THREE.MeshPhysicalMaterial({ color: '#070a12', roughness: 0.03, metalness: 0.4, clearcoat: 1, iridescence: 0.5, name: 'lens' });

/** Common trim extras for a box-shaped gadget of footprint w×d. */
function extras(ctx, g, w, h, d) {
  const { T } = ctx;
  if (T.gaming) rgb(ctx, g, { at: [0, Math.min(0.004, h * 0.2), d / 2 + 0.0008], w: w * 0.7, h: Math.min(0.003, h * 0.2) });
  trimShell(ctx, g, w, Math.min(h, 0.03), d);
}

/* ================================ media device ================================ */

export const MEDIA_VARIANTS = {
  'streaming-stick': { stick: true },
  'set-top-box': { box: [0.1, 0.035, 0.1] },
  'home-projector': { proj: [0.3, 0.11, 0.24] },
  'pico-projector': { proj: [0.1, 0.1, 0.1], cube: true },
  webcam: { webcam: true },
  'streaming-puck': { puck: true },
};

export const createMediaDevice = makeDevice('media-device', MEDIA_VARIANTS, (g, { ctx, T, V }) => {
  const shell = T.plain ? M.plastic(ctx.o.color ?? '#1c1d20', 0.4) : T.body;
  const extra = [];
  if (V.stick) {
    // stick + remote lying on the table
    slab(g, shell, 0.03, 0.012, 0.09, { r: 0.008 });
    mesh(roundedBox(0.02, 0.008, 0.016, 0.002), T.metal, { parent: g, at: [0, 0.006, 0.052] });
    mesh(roundedBox(0.015, 0.0045, 0.0001 + 0.012, 0.001), T.port, { parent: g, at: [0, 0.006, 0.054] });
    led(ctx, g, 'white', { at: [0, 0.012, -0.03], normal: [0, 1, 0], w: 0.002 });
    emblem(g, 0.016, [0, 0.0125, -0.005], [-PI / 2, 0, 0]);
    const r = group('remote', { parent: g, at: [0.07, 0, 0] });
    slab(r, T.plain ? M.plastic('#2a2b2f', 0.4) : T.body2 === T.rubber ? T.dark : T.body2, 0.038, 0.016, 0.14, { r: 0.018 });
    mesh(new THREE.TorusGeometry(0.012, 0.003, 8, 28).rotateX(PI / 2), T.dark, { parent: r, at: [0, 0.016, -0.035] });
    mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.003, 20), T.dark, { parent: r, at: [0, 0.016, -0.035] });
    for (let i = 0; i < 6; i++) mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.002, 16), T.dark, { parent: r, at: [(i % 2 ? 1 : -1) * 0.008, 0.016, 0.0 + Math.floor(i / 2) * 0.016] });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.002, 16), M.plastic('#c8322a', 0.4), { parent: r, at: [0, 0.016, -0.058] });
    if (T.gaming) rgb(ctx, g, { at: [0, 0.003, -0.0455], normal: [0, 0, -1], w: 0.02, h: 0.002 });
    trimShell(ctx, g, 0.03, 0.012, 0.09);
    return extra;
  }
  if (V.puck) {
    mesh(lathe([[0, 0], [0.045, 0], [0.05, 0.008], [0.05, 0.016], [0.045, 0.024], [0, 0.024]], 48), shell, { parent: g });
    led(ctx, g, 'white', { geometry: lathe([[0.02, 0.0242], [0.024, 0.0242], [0.024, 0.0252], [0.02, 0.0252]], 40), normal: [0, 1, 0] });
    emblem(g, 0.016, [0, 0.0248, 0], [-PI / 2, 0, 0]);
    ports(g, T.port, ['hdmi', 'c'], { at: [0, 0.012, -0.0502], rot: [0, PI, 0] });
    extras(ctx, g, 0.09, 0.024, 0.09);
    return extra;
  }
  if (V.webcam) {
    // webcam clipped on a monitor edge stub (stand-alone desk mount)
    slab(g, M.metal('#3a3c40', 0.4), 0.06, 0.006, 0.06, { r: 0.02 });
    tube([0, 0.006, 0], [0, 0.12, 0], 0.005, M.metal('#3a3c40', 0.35), { parent: g });
    const cam = group('camhead', { parent: g, at: [0, 0.14, 0] });
    mesh(new THREE.CapsuleGeometry(0.018, 0.06, 8, 24).rotateZ(PI / 2), shell, { parent: cam });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 32).rotateX(PI / 2), M.metal('#2a2b2e', 0.3), { parent: cam, at: [0, 0, 0.017] });
    mesh(new THREE.CircleGeometry(0.009, 32), lensMat(), { parent: cam, at: [0, 0, 0.0192] });
    for (const sx of [-1, 1]) mesh(new THREE.CircleGeometry(0.0012, 12), T.black, { parent: cam, at: [sx * 0.03, 0, 0.0172] });
    led(ctx, cam, 'white', { at: [0.018, 0.006, 0.0165], w: 0.0018, glow: 0.012 });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.022, 16), shell, { parent: cam, at: [0, -0.012, 0] });
    if (T.retro) mesh(new THREE.SphereGeometry(0.028, 24, 16), shell, { parent: cam, at: [0, 0, -0.005] });
    emblem(cam, 0.012, [0.0, 0.0, -0.0182], [0, PI, 0]);
    curveTube([[0, 0.12, -0.004], [0, 0.04, -0.03], [0.02, 0.003, -0.12]], 0.0018, T.dark, { parent: g, segments: 16 });
    extra.push(clip('pan', 4, [rotateTrack(cam, 'y', 4, (t) => 0.4 * Math.sin(t * PI * 2))]));
    if (T.gaming) rgb(ctx, cam, { at: [0, -0.0185, 0.0], normal: [0, -1, 0], w: 0.05, h: 0.002 });
    trimShell(ctx, g, 0.06, 0.006, 0.06);
    return extra;
  }
  if (V.box) {
    const [w, h, d] = V.box;
    slab(g, shell, w, h, d, { r: 0.018 });
    mesh(roundedBox(w * 0.96, 0.0008, d * 0.96, 0.0003), new THREE.MeshPhysicalMaterial({ color: shell.color, roughness: 0.1, clearcoat: 1 }), { parent: g, at: [0, h + 0.0002, 0] });
    emblem(g, 0.022, [0, h + 0.0012, 0], [-PI / 2, 0, 0]);
    led(ctx, g, 'white', { at: [0, h * 0.5, d / 2 + 0.0004], w: 0.0025 });
    ports(g, T.port, ['hdmi', 'eth', 'dc'], { at: [0, h * 0.45, -d / 2 - 0.0004], rot: [0, PI, 0] });
    const r = group('remote', { parent: g, at: [w * 0.9, 0, 0.02] });
    slab(r, M.metal('#b5b8bd', 0.3), 0.035, 0.009, 0.135, { r: 0.012 });
    slab(r, M.plastic('#111', 0.3), 0.03, 0.0006, 0.05, { at: [0, 0.009, -0.035], r: 0.01 });
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.0015, 16), T.dark, { parent: r, at: [(i % 2 ? 1 : -1) * 0.008, 0.009, 0.01 + Math.floor(i / 2) * 0.016] });
    extras(ctx, g, w, h, d);
    return extra;
  }
  // projector
  const [w, h, d] = V.proj;
  if (V.cube) mesh(roundedBox(w, h, d, 0.02, 4), shell, { parent: g, at: [0, h / 2 + 0.003, 0] });
  else { slab(g, shell, w, h, d, { r: 0.03 }); for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 16), T.rubber, { parent: g, at: [sx * w * 0.38, -0.002, d * 0.35] }); }
  if (V.cube) for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 14), T.rubber, { parent: g, at: [sx * w * 0.35, 0.002, sz * d * 0.35] });
  const lx = V.cube ? 0 : -w * 0.22, ly = (V.cube ? 0.003 : 0) + h * 0.5, r = V.cube ? 0.024 : 0.034;
  const barrel = group('lens', { parent: g, at: [lx, ly, d / 2] });
  mesh(lathe([[r * 1.25, 0], [r * 1.25, 0.008], [r, 0.012], [r * 0.98, 0.02], [0, 0.019]], 40).rotateX(PI / 2), M.metal('#2a2b2e', 0.35), { parent: barrel });
  mesh(new THREE.CircleGeometry(r * 0.85, 40), lensMat(), { parent: barrel, at: [0, 0, 0.0193] });
  const beam = led(ctx, barrel, 'white', { at: [0, 0, 0.02], w: r * 1.4, h: r * 1.4, glow: 0.35 });
  void beam;
  vents(g, T.port, { at: [w / 2 + 0.0005, ly, 0], rot: [0, PI / 2, 0], n: 12, w: 0.003, h: h * 0.5, gap: 0.009 });
  if (!V.cube) { vents(g, T.port, { at: [-w / 2 - 0.0005, ly, 0], rot: [0, -PI / 2, 0], n: 12, w: 0.003, h: h * 0.5, gap: 0.009 }); mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 24), T.dark, { parent: g, at: [lx, h + 0.002, d * 0.3] }); for (let i = 0; i < 4; i++) mesh(roundedBox(0.012, 0.003, 0.008, 0.0012), T.dark, { parent: g, at: [w * 0.15 + i * 0.022, h + 0.0012, d * 0.25] }); }
  led(ctx, g, 'blue', { at: [w * 0.35, ly, d / 2 + 0.0004], w: 0.004 });
  emblem(g, 0.022, [V.cube ? 0 : w * 0.25, V.cube ? h * 0.85 : h * 0.6, d / 2 + 0.0008]);
  ports(g, T.port, ['hdmi', 'a', 'dc'], { at: [0, ly, -d / 2 - 0.0004], rot: [0, PI, 0] });
  extras(ctx, g, w, h, d);
  return extra;
});

/* ============================ power & storage ============================ */

export const POWER_VARIANTS = {
  'power-bank': { bank: [0.07, 0.024, 0.15] },
  'magnetic-pack': { mag: true },
  'wireless-pad': { pad: true },
  'charging-stand-3in1': { dock3: true },
  'external-ssd': { ssd: [0.058, 0.01, 0.095] },
  'desktop-hdd': { hdd: [0.05, 0.17, 0.12] },
};

export const createPowerAccessory = makeDevice('power-accessory', POWER_VARIANTS, (g, { ctx, T, V }) => {
  const shell = T.plain ? M.plastic(ctx.o.color ?? '#f1f2f3', 0.35) : T.body;
  const dark = T.plain ? M.plastic('#1c1d20', 0.45) : T.body2 === T.rubber ? T.dark : T.body2;
  if (V.bank) {
    const [w, h, d] = V.bank;
    slab(g, shell, w, h, d, { r: 0.014 });
    for (let i = 0; i < 4; i++) led(ctx, g, i < 3 ? 'blue' : 'white', { at: [-0.009 + i * 0.006, h + 0.0004, d * 0.38], normal: [0, 1, 0], w: 0.0022, glow: 0.01 });
    ports(g, T.port, ['c', 'a', 'a'], { at: [0, h / 2, d / 2 + 0.0004], gap: 0.005 });
    screen(ctx, g, 0.02, 0.012, { at: [0, h + 0.0005, d * 0.28], rot: [-PI / 2, 0, 0], content: 'dash' });
    emblem(g, 0.02, [0, h + 0.0008, -d * 0.1], [-PI / 2, 0, 0]);
    curveTube([[0.0, h / 2, d / 2 + 0.001], [0, 0.003, d / 2 + 0.04], [0.04, 0.003, d / 2 + 0.06], [0.06, 0.003, d / 2 + 0.02]], 0.0018, T.white ? M.plastic('#fff', 0.4) : T.dark, { parent: g, segments: 24 });
    extras(ctx, g, w, h, d);
    return [];
  }
  if (V.mag) {
    // magnetic battery pack snapped on a phone (lying face-down? no: phone on stand, pack on its back)
    leanOnStand(ctx, g, 0.0716, 0.1475, 0.0078 + 0.016, (s) => {
      buildSlate(ctx, s, { w: 0.0716, h: 0.1475, t: 0.0078, cr: 0.011, bez: 0.0018, punch: 0.0019, content: 'home', bump: [0.033, 0.034, -0.015, 0.051], cams: [[-0.022, 0.058, 0.005], [-0.022, 0.044, 0.005]] });
      const p = group('pack', { parent: s, at: [0, -0.012, -0.0039 - 0.006] });
      mesh(plateGeo(0.064, 0.098, 0.012, 0.012), shell, { parent: p });
      led(ctx, p, 'green', { at: [0.024, -0.04, -0.0062], normal: [0, 0, -1], w: 0.002, glow: 0.01 });
      emblem(p, 0.022, [0, 0, -0.0064], [0, PI, 0]);
    });
    return [];
  }
  if (V.pad) {
    mesh(lathe([[0, 0], [0.048, 0], [0.05, 0.003], [0.048, 0.008], [0.044, 0.0095], [0, 0.0095]], 48), dark, { parent: g });
    mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.0008, 48), M.fabric(T.white ? '#e6e5e0' : T.kids ? '#2fb0ff' : '#3a3c40'), { parent: g, at: [0, 0.0098, 0] });
    led(ctx, g, 'white', { geometry: lathe([[0.0485, 0.0045], [0.0495, 0.0045], [0.0495, 0.0058], [0.0485, 0.0058]], 48), normal: [0, 0, 1] });
    // phone charging on top, face up
    const ph = group('phone', { parent: g, at: [0, 0.0102 + 0.0039 + 0.003, 0], rot: [-PI / 2, 0, 0.3] });
    buildSlate(ctx, ph, { w: 0.0716, h: 0.1475, t: 0.0078, cr: 0.011, bez: 0.0018, punch: 0.0019, content: 'watch', bump: null });
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.003, 24), T.dark, { parent: g, at: [0, 0.0115, 0] });
    curveTube([[0, 0.004, -0.05], [0, 0.003, -0.09], [0.05, 0.003, -0.14]], 0.0018, T.dark, { parent: g, segments: 16 });
    extras(ctx, g, 0.1, 0.0095, 0.1);
    return [];
  }
  if (V.dock3) {
    // 3-in-1: phone pad (tilted), watch puck, earbuds pad
    slab(g, dark, 0.18, 0.012, 0.1, { r: 0.03 });
    const post = group('post', { parent: g, at: [-0.035, 0.012, -0.03] });
    mesh(roundedBox(0.03, 0.09, 0.012, 0.005), dark, { parent: post, at: [0, 0.045, 0], rot: [-0.25, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 40).rotateX(PI / 2), dark, { parent: post, at: [0, 0.09, 0.012 - 0.01], rot: [-0.25, 0, 0] });
    const ph = group('phone', { parent: post, at: [0, 0.075, 0.017], rot: [-0.25, 0, 0] });
    buildSlate(ctx, ph, { w: 0.0716, h: 0.1475, t: 0.0078, cr: 0.011, bez: 0.0018, punch: 0.0019, content: 'home', bump: null });
    // phone bottom rests on a lip
    mesh(roundedBox(0.04, 0.006, 0.02, 0.002), dark, { parent: g, at: [-0.035, 0.012 + 0.003, ph.position.z - 0.03 + 0.02] });
    tube([0.06, 0.012, -0.02], [0.06, 0.06, -0.02], 0.004, T.metal, { parent: g });
    mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.006, 32).rotateX(PI / 2), T.white ? M.plastic('#fff', 0.3) : M.plastic('#dddddd', 0.3), { parent: g, at: [0.06, 0.07, -0.02] });
    led(ctx, g, 'white', { at: [0.0, 0.012 + 0.0004, 0.04], normal: [0, 1, 0], w: 0.003 });
    mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.002, 32), M.fabric('#55585e'), { parent: g, at: [0.04, 0.013, 0.025] });
    emblem(g, 0.016, [0.075, 0.0128, 0.03], [-PI / 2, 0, 0]);
    extras(ctx, g, 0.18, 0.012, 0.1);
    return [];
  }
  if (V.ssd) {
    const [w, h, d] = V.ssd;
    slab(g, T.plain ? M.metal(ctx.o.color ?? '#5d6168', 0.35) : T.body, w, h, d, { r: 0.012 });
    if (T.plain || T.rugged) frame(g, T.rugged ? T.accent : M.rubber(), w + 0.004, h + 0.001, d + 0.004, 0.004, { at: [0, -0.0005, 0], r: 0.014 });
    led(ctx, g, 'blue', { at: [0, h + 0.0004, d * 0.42], normal: [0, 1, 0], w: 0.002 });
    ports(g, T.port, ['c'], { at: [0, h / 2, -d / 2 - 0.0004], rot: [0, PI, 0] });
    emblem(g, 0.02, [0, h + 0.0008, 0], [-PI / 2, 0, 0]);
    curveTube([[0, h / 2, -d / 2], [0, 0.003, -d / 2 - 0.04], [0.04, 0.003, -d / 2 - 0.09]], 0.0018, T.dark, { parent: g, segments: 16 });
    extras(ctx, g, w, h, d);
    return [];
  }
  // desktop HDD standing upright
  const [w, h, d] = V.hdd;
  mesh(roundedBox(w, h, d, 0.008), shell, { parent: g, at: [0, h / 2 + 0.006, 0] });
  slab(g, dark, w + 0.03, 0.006, d * 0.7, { r: 0.01 });
  for (let i = 0; i < 9; i++) mesh(roundedBox(w * 0.7, 0.002, 0.002, 0.0008), T.port, { parent: g, at: [0, 0.04 + i * 0.012, d / 2 + 0.0008] });
  led(ctx, g, 'white', { at: [0, h - 0.01, d / 2 + 0.0004], w: 0.003 });
  ports(g, T.port, ['c', 'dc'], { at: [0, 0.03, -d / 2 - 0.0004], rot: [0, PI, 0] });
  emblem(g, 0.02, [w / 2 + 0.0008, h * 0.6, 0], [0, PI / 2, 0]);
  extras(ctx, g, w, h, d);
  return [];
});

/* ================================ smart home ================================ */

export const SMARTHOME_VARIANTS = {
  thermostat: { thermo: true },
  'video-doorbell': { bell: true },
  'smart-bulb': { bulb: true },
  'smart-plug': { plug: true },
  'smart-lock': { lock: true },
  'hub-display': { hub: true },
};

/** Wall plate stand so wall-mounted gadgets stand on a table. */
function wallStub(ctx, g, w, h) {
  const m = M.matte(ctx.T.retro ? '#c9bfa6' : '#e9e7e2', 0.8);
  slab(g, m, w + 0.06, 0.01, 0.07, { r: 0.01 });
  mesh(roundedBox(w + 0.04, h, 0.012, 0.004), m, { parent: g, at: [0, h / 2 + 0.01, -0.02] });
  return -0.014;
}

export const createSmartHome = makeDevice('smart-home', SMARTHOME_VARIANTS, (g, { ctx, T, V }) => {
  const shell = T.plain ? M.plastic(ctx.o.color ?? '#f3f3f1', 0.35) : T.body;
  const extra = [];
  if (V.thermo) {
    const z = wallStub(ctx, g, 0.09, 0.14);
    const d = group('thermo', { parent: g, at: [0, 0.085, z], rot: [-PI / 2, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 64), T.plain ? M.metal('#c9ccd1', 0.25) : T.body, { parent: d, at: [0, -0.015, 0] });
    const ring = group('ring', { parent: d, at: [0, -0.016, 0] });
    for (let i = 0; i < 48; i++) mesh(roundedBox(0.002, 0.026, 0.002, 0.0008, 1), M.metal('#9aa0a6', 0.3), { parent: ring, at: [Math.cos(i / 48 * PI * 2) * 0.0425, 0, Math.sin(i / 48 * PI * 2) * 0.0425], rot: [0, -i / 48 * PI * 2, 0] });
    screen(ctx, d, 0.07, 0.07, { at: [0, -0.0305, 0], rot: [PI / 2, 0, 0], round: true, content: 'watch' });
    extra.push(clip('dial', 4, [rotateTrack(ring, 'y', 4, (t) => 0.8 * Math.sin(t * PI * 2))]));
    if (T.gaming) rgb(ctx, d, { at: [0, -0.002, 0.0425], normal: [0, 0, 1], w: 0.03, h: 0.002 });
    if (T.rugged) mesh(new THREE.TorusGeometry(0.045, 0.004, 8, 40).rotateX(PI / 2), T.accent, { parent: d, at: [0, -0.015, 0] });
    return extra;
  }
  if (V.bell) {
    const z = wallStub(ctx, g, 0.05, 0.16);
    const b = group('bell', { parent: g, at: [0, 0.09, z + 0.012] });
    mesh(roundedBox(0.045, 0.13, 0.022, 0.012, 4), shell, { parent: b });
    mesh(roundedBox(0.04, 0.05, 0.002, 0.008), T.black, { parent: b, at: [0, 0.03, 0.0112] });
    mesh(new THREE.CircleGeometry(0.009, 28), lensMat(), { parent: b, at: [0, 0.032, 0.0124] });
    const btn = led(ctx, b, 'blue', { geometry: lathe([[0.012, 0], [0.0145, 0], [0.0145, 0.0012], [0.012, 0.0012]], 40).rotateX(PI / 2).translate(0, -0.03, 0.0122), normal: [0, 0, 1] });
    void btn;
    mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.002, 32).rotateX(PI / 2), T.dark, { parent: b, at: [0, -0.03, 0.0115] });
    emblem(b, 0.012, [0, -0.052, 0.0113]);
    for (let i = 0; i < 5; i++) mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 0.001, 8).rotateX(PI / 2), T.port, { parent: b, at: [-0.008 + i * 0.004, 0.0, 0.0112] });
    if (T.gaming) rgb(ctx, b, { at: [0.0228, 0, 0], normal: [1, 0, 0], w: 0.08, h: 0.002, roll: PI / 2 });
    if (T.rugged) mesh(roundedBox(0.055, 0.14, 0.014, 0.006), T.accent, { parent: b, at: [0, 0, -0.006] });
    if (T.damaged) mesh(roundedBox(0.05, 0.012, 0.024, 0.002), M.matte('#9b9d9f', 0.95), { parent: b, at: [0, 0.055, 0], rot: [0, 0, 0.4] });
    return extra;
  }
  if (V.bulb) {
    // bulb standing in a little socket base
    const base = T.retro ? M.wood('walnut') : M.plastic('#2a2b2f', 0.4);
    mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.02, 40), base, { parent: g, at: [0, 0.01, 0] });
    mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.012, 24), T.metal, { parent: g, at: [0, 0.026, 0] });
    for (let i = 0; i < 4; i++) mesh(new THREE.TorusGeometry(0.0145, 0.0015, 6, 24).rotateX(PI / 2), T.metal, { parent: g, at: [0, 0.022 + i * 0.0028, 0] });
    mesh(lathe([[0.017, 0], [0.019, 0.012], [0.022, 0.024], [0, 0.026]], 32), shell, { parent: g, at: [0, 0.032, 0] });
    const globe = lathe([[0.0, 0.0], [0.021, 0.0], [0.024, 0.01], [0.032, 0.032], [0.033, 0.05], [0.026, 0.07], [0.012, 0.079], [0, 0.081]], 40);
    globe.translate(0, 0.056, 0);
    const L = led(ctx, g, T.gaming ? 'blue' : T.kids ? 'green' : 'amber', { geometry: globe, normal: [0, 1, 0] });
    L.material.toneMapped = true;
    if (!T.gaming && !T.kids) { L.material.color.set('#f4efe2'); L.material.emissive.set('#ffd28a'); }
    emblem(g, 0.016, [0, 0.01, 0.0425 + 0.0005], [-0.25, 0, 0]);
    led(ctx, g, 'white', { at: [0.025, 0.01, 0.036], normal: [0.6, 0, 0.8], w: 0.002, glow: 0.01 });
    return extra;
  }
  if (V.plug) {
    // plug on a short extension strip
    slab(g, M.plastic('#f4f4f2', 0.4), 0.16, 0.035, 0.06, { r: 0.012 });
    mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.001, 32), T.port, { parent: g, at: [0.045, 0.035, 0] });
    const p = group('plug', { parent: g, at: [-0.03, 0.035, 0] });
    mesh(roundedBox(0.06, 0.04, 0.06, 0.012, 4), shell, { parent: p, at: [0, 0.02, 0] });
    for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.002, 12), T.port, { parent: p, at: [sx * 0.009, 0.0405, 0] });
    mesh(roundedBox(0.012, 0.004, 0.012, 0.002), T.dark, { parent: p, at: [0, 0.02, 0.0305], rot: [PI / 2, 0, 0] });
    led(ctx, p, 'green', { at: [0.015, 0.03, 0.0302], w: 0.002, glow: 0.01 });
    emblem(p, 0.014, [-0.015, 0.03, 0.0306]);
    curveTube([[0.08, 0.017, 0], [0.12, 0.004, 0], [0.16, 0.004, 0.04]], 0.0028, M.plastic('#f4f4f2', 0.4), { parent: g, segments: 16 });
    if (T.gaming) rgb(ctx, p, { at: [0, 0.006, 0.0305], w: 0.04, h: 0.002 });
    if (T.rugged) mesh(roundedBox(0.066, 0.012, 0.066, 0.004), T.accent, { parent: p, at: [0, 0.006, 0] });
    return extra;
  }
  if (V.lock) {
    const z = wallStub(ctx, g, 0.09, 0.2);
    const l = group('lock', { parent: g, at: [0, 0.11, z + 0.014] });
    mesh(roundedBox(0.065, 0.16, 0.028, 0.02, 4), T.plain ? M.metal('#3a3c40', 0.3) : T.body, { parent: l });
    mesh(roundedBox(0.05, 0.075, 0.002, 0.01), T.black, { parent: l, at: [0, 0.025, 0.0142] });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) mesh(new THREE.CircleGeometry(0.004, 16), M.emissive('#9ad0ff', T.lit ? 1.2 : 0.2), { parent: l, at: [-0.014 + c * 0.014, 0.05 - r * 0.016, 0.0154] });
    const handle = group('handle', { parent: l, at: [0, -0.045, 0.014] });
    mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.014, 20).rotateX(PI / 2), T.metal, { parent: handle, at: [0, 0, 0.007] });
    mesh(roundedBox(0.075, 0.014, 0.01, 0.005), T.metal, { parent: handle, at: [0.03, 0, 0.016] });
    led(ctx, l, 'green', { at: [0.02, -0.07, 0.0142], w: 0.002, glow: 0.01 });
    emblem(l, 0.012, [-0.02, -0.07, 0.0145]);
    extra.push(clip('unlock', 3, [rotateTrack(handle, 'z', 3, (t) => -0.7 * pingPong(t))]));
    if (T.rugged) mesh(roundedBox(0.075, 0.17, 0.016, 0.01), T.accent, { parent: l, at: [0, 0, -0.008] });
    return extra;
  }
  // hub display (small smart display on a puck)
  mesh(lathe([[0, 0], [0.05, 0], [0.052, 0.01], [0.048, 0.03], [0, 0.03]], 48), M.fabric(T.white ? '#e6e5e0' : '#4b4e55'), { parent: g });
  const s = group('panel', { parent: g, at: [0, 0.03, 0], rot: [-0.25, 0, 0] });
  mesh(roundedBox(0.012, 0.03, 0.01, 0.004), shell, { parent: s, at: [0, 0.012, -0.004] });
  const p = group('disp', { parent: s, at: [0, 0.05, 0.0] });
  mesh(roundedBox(0.1, 0.07, 0.008, 0.006), shell, { parent: p });
  mesh(new THREE.PlaneGeometry(0.096, 0.066), T.bezelMat, { parent: p, at: [0, 0, 0.0043] });
  screen(ctx, p, 0.088, 0.058, { at: [0, 0, 0.0048], content: 'home' });
  emblem(p, 0.016, [0, 0, -0.0045], [0, PI, 0]);
  if (T.gaming) rgb(ctx, g, { at: [0, 0.004, 0.0505], w: 0.04, h: 0.003 });
  return extra;
});
