// Gaming & XR: game console (home + handheld), game controller, VR headset / smart glasses.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, tube, clip, rotateTrack, moveTrack, spinTrack, pingPong, PI,
  makeDevice, screen, led, rgb, emblem, vents, ports, slab, trimShell } from './kit.js';
import { plateGeo, leanOnStand } from './mobile.js';

/** Smooth closed outline (mirrored half, x ≥ 0) → THREE.Shape. */
function mirrorShape(half) {
  const pts = [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y])].map(([x, y]) => new THREE.Vector2(x, y));
  const s = new THREE.Shape();
  s.moveTo(pts[0].x, pts[0].y);
  s.splineThru([...pts.slice(1), pts[0]]);
  return s;
}

const PAD_HALF = [[0, 0.046], [0.04, 0.046], [0.062, 0.04], [0.076, 0.02], [0.082, -0.012], [0.08, -0.048], [0.068, -0.064], [0.053, -0.058], [0.04, -0.032], [0.02, -0.024], [0, -0.024]];
const RETRO_HALF = [[0, 0.028], [0.06, 0.028], [0.07, 0.022], [0.072, -0.02], [0.065, -0.028], [0, -0.028]];

/** Gamepad lying flat, front (+Z toward player). kind: standard | pro | retro | handheld-joy */
export function buildController(ctx, par, kind = 'standard', { at = [0, 0, 0], rotY = 0, scale = 1 } = {}) {
  const { T } = ctx;
  const g = group('controller', { parent: par, at, rot: [0, rotY, 0] });
  g.scale.setScalar(scale);
  const th = kind === 'retro' ? 0.014 : 0.03;
  const shell = T.plain ? M.plastic(ctx.o.color ?? (kind === 'retro' ? '#c9c9c4' : '#1d1e22'), 0.45) : T.body;
  const geo = new THREE.ExtrudeGeometry(mirrorShape(kind === 'retro' ? RETRO_HALF : PAD_HALF), { depth: th - 0.01, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 4, curveSegments: 32 });
  geo.rotateX(-PI / 2).translate(0, 0.005, 0);
  mesh(geo, shell, { parent: g });
  const top = th;
  const btnCols = T.plain || T.retro ? ['#3fb950', '#e5534b', '#4a9eff', '#e3b341'] : T.kids ? ['#ff4f7a', '#ffd23f', '#3dff6b', '#2fb0ff'] : ['#d0d0d0', '#d0d0d0', '#d0d0d0', '#d0d0d0'];
  // face buttons (diamond) on the right
  const bx = kind === 'retro' ? 0.045 : 0.05, bz = kind === 'retro' ? 0.004 : -0.012;
  [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dz], i) => mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 18), M.plastic(btnCols[i], 0.3), { parent: g, at: [bx + dx * 0.011, top + 0.001, bz + dz * 0.011] }));
  // d-pad on the left
  const dx = kind === 'pro' || kind === 'retro' ? -0.048 : -0.048, dz = kind === 'pro' || kind === 'retro' ? (kind === 'retro' ? 0.004 : -0.012) : 0.012;
  mesh(roundedBox(0.024, 0.004, 0.008, 0.0015), T.dark, { parent: g, at: [dx, top + 0.001, dz] });
  mesh(roundedBox(0.008, 0.004, 0.024, 0.0015), T.dark, { parent: g, at: [dx, top + 0.001, dz] });
  if (kind !== 'retro') {
    // thumbsticks
    const sticks = kind === 'pro' ? [[-0.048, 0.012 * 0 - 0.012 + 0.0], [0.024, 0.016]] : [[-0.048, -0.012], [0.024, 0.016]];
    if (kind === 'pro') sticks[0] = [-0.048, 0.014];
    const dpadOnLeftBottom = kind !== 'pro';
    void dpadOnLeftBottom;
    sticks.forEach(([x, z], i) => {
      const st = group(i ? 'stickR' : 'stickL', { parent: g, at: [x === -0.048 && kind !== 'pro' ? -0.03 : x, top, z] });
      mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.008, 12), T.dark, { parent: st, at: [0, 0.003, 0] });
      mesh(lathe([[0, 0], [0.009, 0], [0.0095, 0.002], [0.008, 0.004], [0.006, 0.0035], [0, 0.003]], 24), M.rubber(), { parent: st, at: [0, 0.007, 0] });
      ctx.extra.push(rotateTrack(st, i ? 'z' : 'x', 3, (t) => 0.25 * Math.sin(t * PI * 2 * (i + 1))));
    });
    if (kind !== 'pro') { /* move d-pad lower-left */ }
    // shoulder bumpers + triggers
    for (const sx of [-1, 1]) {
      mesh(roundedBox(0.03, 0.008, 0.01, 0.003), T.dark, { parent: g, at: [sx * 0.05, th - 0.004, -0.043] });
      mesh(roundedBox(0.022, 0.016, 0.012, 0.004), T.dark, { parent: g, at: [sx * 0.05, th * 0.45, -0.048], rot: [0.3, 0, 0] });
    }
    // touch / centre area
    if (kind === 'standard') slab(g, T.plain ? M.plastic('#2b2c31', 0.3) : T.body2 === T.rubber ? T.dark : T.body2, 0.04, 0.0008, 0.024, { at: [0, top - 0.0002, -0.025], r: 0.004 });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.002, 16), T.metal, { parent: g, at: [0, top + 0.0005, 0.005] });
    led(ctx, g, kind === 'standard' ? 'blue' : 'white', { at: [0, top - 0.002, -0.0475], normal: [0, 0.3, -1], w: 0.02, h: 0.0025, shape: 'strip', glow: 0.03 });
  } else {
    for (let i = 0; i < 2; i++) mesh(roundedBox(0.01, 0.002, 0.004, 0.0015), T.dark, { parent: g, at: [-0.007 + i * 0.014, top + 0.0005, 0.006], rot: [0, -0.5, 0] });
    curveTube([[0, th * 0.5, -0.028], [0, 0.003, -0.06], [0.03, 0.003, -0.12]], 0.0018, T.dark, { parent: g, segments: 16 });
  }
  if (T.gaming) rgb(ctx, g, { at: [0, top + 0.0004, 0.01], normal: [0, 1, 0], w: 0.03, h: 0.003 });
  if (T.rugged) for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.02, 16, 12, 0, PI * 2, 0, PI / 2), T.accent, { parent: g, at: [sx * 0.07, 0.002, 0.045], scale: [1, 0.6, 1.3] });
  if (T.damaged) mesh(roundedBox(0.05, 0.0012, 0.012, 0.0004), M.matte('#9b9d9f', 0.95), { parent: g, at: [0.02, top + 0.0012, 0.03], rot: [0, 0.5, 0] });
  return g;
}

/* ================================ game controller ================================ */

export const CONTROLLER_VARIANTS = {
  standard: { kind: 'standard' },
  'pro-offset': { kind: 'pro' },
  'retro-pad': { kind: 'retro' },
  'arcade-stick': { arcade: true },
  'racing-wheel': { wheel: true },
  'motion-pair': { motion: true },
};

export const createGameController = makeDevice('game-controller', CONTROLLER_VARIANTS, (g, { ctx, T, V }) => {
  if (V.kind) { buildController(ctx, g, V.kind); return []; }
  const shell = T.plain ? M.plastic(ctx.o.color ?? '#1b1c20', 0.45) : T.body;
  if (V.arcade) {
    const w = 0.36, d = 0.22;
    const s = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(d / 2, 0.045), new THREE.Vector2(-d / 2, 0.075)]);
    const geo = new THREE.ExtrudeGeometry(s, { depth: w - 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 3 });
    geo.translate(0, 0, -(w - 0.02) / 2).rotateY(PI / 2);
    mesh(geo, shell, { parent: g });
    const deck = group('deck', { parent: g, at: [0, 0.068, 0], rot: [Math.atan2(0.03, d), 0, 0] });
    const art = new THREE.MeshPhysicalMaterial({ color: T.plain ? '#a3162c' : T.gaming ? '#2b0b3a' : T.body2 === T.rubber ? '#222' : T.body2.color, roughness: 0.2, clearcoat: 1 });
    slab(deck, art, w - 0.02, 0.001, d - 0.02, { at: [0, 0.0, 0], r: 0.01 });
    const stick = group('joystick', { parent: deck, at: [-0.1, 0.001, 0.0] });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.05, 12), T.metal, { parent: stick, at: [0, 0.025, 0] });
    mesh(new THREE.SphereGeometry(0.018, 24, 16), M.plastic(T.kids ? '#ffd23f' : '#d81e2e', 0.2), { parent: stick, at: [0, 0.055, 0] });
    mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.004, 20), T.dark, { parent: stick, at: [0, 0.002, 0] });
    ctx.extra.push(rotateTrack(stick, 'z', 2, (t) => 0.3 * Math.sin(t * PI * 4)));
    const cols = ['#e5534b', '#3fb950', '#4a9eff', '#e3b341', '#c86bff', '#f0f0f0', '#ff8a4c', '#3fc3ff'];
    for (let i = 0; i < 8; i++) {
      const x = 0.02 + (i % 4) * 0.034 + (i % 4 === 0 ? 0 : 0.004), z = -0.02 + Math.floor(i / 4) * 0.04 + (i % 4 === 1 ? -0.008 : 0);
      mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.008, 24), M.plastic(T.isTrim && !T.kids && !T.retro ? (T.gaming ? '#ff2bd6' : '#e8e8e8') : cols[i], 0.25), { parent: deck, at: [x, 0.004, z] });
      mesh(new THREE.CylinderGeometry(0.0135, 0.0135, 0.0015, 24), T.dark, { parent: deck, at: [x, 0.0012, z] });
    }
    led(ctx, deck, 'green', { at: [0.13, 0.0015, -0.08], normal: [0, 1, 0], w: 0.004 });
    emblem(g, 0.03, [0, 0.03, d / 2 + 0.0108]);
    if (T.gaming) rgb(ctx, g, { at: [0, 0.01, d / 2 + 0.011], w: w * 0.8, h: 0.004 });
    trimShell(ctx, g, w, 0.04, d);
    return [];
  }
  if (V.wheel) {
    // wheel on a desk clamp base
    slab(g, shell, 0.26, 0.04, 0.22, { r: 0.03 });
    mesh(roundedBox(0.2, 0.14, 0.14, 0.03), shell, { parent: g, at: [0, 0.1, -0.02] });
    const wheel = group('wheel', { parent: g, at: [0, 0.2, 0.06], rot: [-0.35, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 24).rotateX(PI / 2), T.dark, { parent: wheel, at: [0, 0, -0.03] });
    const rim = new THREE.TorusGeometry(0.14, 0.014, 14, 64);
    mesh(rim, M.matte(T.retro ? '#5a3a24' : '#1a1a1a', 0.8), { parent: wheel });
    for (const a of [0, PI * 0.5 + 0.6, PI * 0.5 - 0.6 + PI]) tube([0, 0, 0], [Math.cos(a - PI / 2) * 0.135, Math.sin(a - PI / 2) * 0.135, 0], 0.012, shell, { parent: wheel });
    mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 32).rotateX(PI / 2), shell, { parent: wheel, at: [0, 0, 0.004] });
    emblem(wheel, 0.035, [0, 0, 0.0146]);
    mesh(roundedBox(0.012, 0.01, 0.004, 0.002), M.plastic('#e8412c', 0.3), { parent: wheel, at: [0, 0.14, 0.012] });
    for (const sx of [-1, 1]) mesh(roundedBox(0.03, 0.06, 0.004, 0.004), T.metal, { parent: wheel, at: [sx * 0.07, 0.03, -0.02], rot: [0, 0, sx * 0.3] });
    led(ctx, wheel, 'red', { at: [0, 0.03, 0.0146], w: 0.02, h: 0.003, shape: 'strip', glow: 0.03 });
    ctx.extra.push(rotateTrack(wheel, 'z', 3, (t) => 0.8 * Math.sin(t * PI * 2)));
    // pedals
    const pd = group('pedals', { parent: g, at: [0, 0, 0.35] });
    slab(pd, shell, 0.28, 0.025, 0.16, { r: 0.02 });
    for (let i = 0; i < 3; i++) mesh(roundedBox(0.05, 0.1, 0.008, 0.004), T.metal, { parent: pd, at: [-0.08 + i * 0.08, 0.06, -0.02], rot: [-0.6, 0, 0] });
    if (T.gaming) rgb(ctx, g, { at: [0, 0.02, 0.1105], w: 0.2, h: 0.004 });
    trimShell(ctx, g, 0.26, 0.04, 0.22);
    return [];
  }
  // motion controllers pair on a charging cradle
  slab(g, shell, 0.16, 0.02, 0.08, { r: 0.03 });
  for (const sx of [-1, 1]) {
    const c = group(sx < 0 ? 'wandL' : 'wandR', { parent: g, at: [sx * 0.04, 0.02, 0], rot: [0, 0, -sx * 0.12] });
    mesh(lathe([[0, 0], [0.017, 0], [0.019, 0.04], [0.017, 0.11], [0.015, 0.13], [0, 0.13]], 32), shell, { parent: c });
    mesh(new THREE.TorusGeometry(0.035, 0.006, 10, 36), shell, { parent: c, at: [0, 0.16, 0], rot: [0.3, 0, 0] });
    tube([0, 0.13, 0], [0, 0.128, 0.0], 0.012, shell, { parent: c });
    mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.01, 18).rotateX(0), T.dark, { parent: c, at: [0, 0.135, 0] });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 18).rotateX(PI / 2), M.rubber(), { parent: c, at: [0, 0.1, 0.0185] });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.003, 12).rotateX(PI / 2), T.dark, { parent: c, at: [0, 0.08, 0.0185] });
    mesh(roundedBox(0.012, 0.03, 0.01, 0.004), T.dark, { parent: c, at: [0, 0.095, -0.018] });
  }
  led(ctx, g, 'white', { at: [0, 0.01, 0.0405], w: 0.03, h: 0.002, shape: 'strip', glow: 0.03 });
  if (T.gaming) rgb(ctx, g, { at: [0, 0.0205, 0.03], normal: [0, 1, 0], w: 0.05, h: 0.003 });
  return [];
});

/* ================================ game console ================================ */

export const CONSOLE_VARIANTS = {
  'home-box': { w: 0.3, h: 0.065, d: 0.26, ctrl: 'standard' },
  'tower-upright': { w: 0.15, h: 0.3, d: 0.15, ctrl: 'standard', tower: true },
  'curved-slim': { w: 0.36, h: 0.09, d: 0.25, ctrl: 'standard', curved: true },
  'hybrid-dock': { hybrid: true },
  'retro-cartridge': { w: 0.26, h: 0.075, d: 0.2, ctrl: 'retro', cart: true },
  'portable-handheld': { handheld: true },
};

function handheld(ctx, par, { joy = true } = {}) {
  // landscape handheld: screen slate + two grips; returned group lies flat-face +Z
  const { T } = ctx;
  const g = group('handheld', { parent: par });
  const sw = 0.172, sh = 0.1, t = 0.014;
  mesh(plateGeo(sw, sh, t, 0.008), T.plain ? M.plastic('#26272b', 0.4) : T.body, { parent: g });
  mesh(new THREE.PlaneGeometry(sw - 0.004, sh - 0.004), T.bezelMat, { parent: g, at: [0, 0, t / 2 + 0.0003] });
  screen(ctx, g, 0.155, 0.087, { at: [0, 0, t / 2 + 0.0007], content: 'game' });
  emblem(g, 0.022, [0, 0, -t / 2 - 0.0005], [0, PI, 0]);
  const cols = joy ? (T.plain ? ['#6fd3b0', '#a99bff'] : T.kids ? ['#ffd23f', '#ff4f7a'] : null) : null;
  for (const sx of [-1, 1]) {
    const gm = cols ? M.plastic(cols[sx < 0 ? 0 : 1], 0.4) : T.body2 === T.rubber ? T.accent : T.body2;
    const grip = group(sx < 0 ? 'gripL' : 'gripR', { parent: g, at: [sx * (sw / 2 + 0.017), 0, 0] });
    mesh(plateGeo(0.036, sh, t * 1.05, 0.016), gm, { parent: grip });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 18).rotateX(PI / 2), T.dark, { parent: grip, at: [0, sx < 0 ? 0.022 : -0.012, t / 2 + 0.003] });
    if (sx > 0) [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([a, b]) => mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 14).rotateX(PI / 2), T.dark, { parent: grip, at: [a * 0.008, 0.022 + b * 0.008, t / 2 + 0.0008] }));
    else [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([a, b]) => mesh(new THREE.CylinderGeometry(0.0033, 0.0033, 0.002, 14).rotateX(PI / 2), T.dark, { parent: grip, at: [a * 0.008, -0.014 + b * 0.008, t / 2 + 0.0008] }));
    mesh(roundedBox(0.026, 0.006, t * 0.8, 0.002), T.dark, { parent: grip, at: [0, sh / 2 + 0.002, -0.001] });
  }
  if (T.gaming) rgb(ctx, g, { at: [0, -sh / 2 - 0.0006, 0], normal: [0, -1, 0], w: sw * 0.6, h: 0.003 });
  return { g, w: sw + 0.072, h: sh, t };
}

export const createGameConsole = makeDevice('game-console', CONSOLE_VARIANTS, (g, { ctx, T, V }) => {
  const shell = T.plain ? M.plastic(ctx.o.color ?? (V.cart ? '#cfcfca' : '#f1f2f3'), 0.4) : T.body;
  const extra = [];
  if (V.hybrid || V.handheld) {
    if (V.hybrid) {
      // TV dock with the handheld slotted in, upright
      const dw = 0.175, dh = 0.105, dd = 0.05;
      mesh(roundedBox(dw, dh, dd, 0.01), T.plain ? M.plastic('#2a2b2f', 0.5) : T.body2 === T.rubber ? T.dark : T.body2, { parent: g, at: [0, dh / 2, 0] });
      emblem(g, 0.025, [0, dh * 0.55, dd / 2 + 0.0008]);
      led(ctx, g, 'green', { at: [dw / 2 - 0.012, 0.01, dd / 2 + 0.0004], w: 0.003 });
      const H = group('hh', { parent: g, at: [0, 0.03 + 0.05, dd / 2 + 0.008] });
      handheld(ctx, H);
      buildController(ctx, g, 'standard', { at: [0.2, 0, 0.12], rotY: -0.3, scale: 0.9 });
    } else {
      leanOnStand(ctx, g, 0.244, 0.1, 0.015, (s) => handheld(ctx, s, { joy: false }), { lean: 0.3 });
    }
    if (T.rugged) mesh(roundedBox(0.26, 0.012, 0.03, 0.005), T.accent, { parent: g, at: [0, 0.006, 0.12] });
    return extra;
  }
  const { w, h, d } = V;
  if (V.tower) {
    mesh(roundedBox(w, h, d, 0.02), shell, { parent: g, at: [0, h / 2 + 0.006, 0] });
    mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.48, 0.006, 32), T.dark, { parent: g, at: [0, 0.003, 0] });
    mesh(new THREE.CylinderGeometry(w * 0.4, w * 0.4, 0.003, 40), T.dark, { parent: g, at: [0, h + 0.006, 0] });
    for (let i = 0; i < 18; i++) mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 10), M.emissive(T.gaming ? '#ff2bd6' : '#3dff6b', T.gaming ? 1.2 : 0.25), { parent: g, at: [Math.cos(i / 18 * PI * 2) * w * 0.3, h + 0.0078, Math.sin(i / 18 * PI * 2) * w * 0.3] });
    mesh(roundedBox(0.012, 0.012, 0.003, 0.004), T.dark, { parent: g, at: [-w * 0.3, h * 0.9, d / 2 + 0.001] });
    led(ctx, g, 'white', { at: [-w * 0.3, h * 0.9, d / 2 + 0.003], w: 0.006 });
    ports(g, T.port, ['a', 'c'], { at: [w * 0.15, 0.03, d / 2 + 0.0005] });
    emblem(g, 0.024, [0, h * 0.5, d / 2 + 0.0008]);
  } else if (V.curved) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.quadraticCurveTo(w / 2 + 0.02, h * 0.6, w / 2 - 0.02, h); s.lineTo(-w / 2 + 0.02, h); s.quadraticCurveTo(-w / 2 - 0.02, h * 0.6, -w / 2, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: d - 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 4, curveSegments: 20 });
    geo.translate(0, 0, -(d - 0.02) / 2);
    mesh(geo, shell, { parent: g });
    mesh(roundedBox(w * 0.85, 0.022, d * 1.02, 0.01), T.plain ? M.plastic('#17181b', 0.4) : T.body2 === T.rubber ? T.dark : T.body2, { parent: g, at: [0, h * 0.5, 0] });
    led(ctx, g, 'blue', { at: [0, h * 0.5, d / 2 + 0.0105], w: w * 0.5, h: 0.002, shape: 'strip', glow: 0.04 });
    ports(g, T.port, ['c', 'a'], { at: [-w * 0.3, h * 0.25, d / 2 + 0.0105] });
    emblem(g, 0.026, [w * 0.3, h * 0.78, d / 2 + 0.0035], [-0.15, 0, 0]);
  } else {
    slab(g, shell, w, h, d, { r: 0.015 });
    mesh(roundedBox(w * 1.002, h * 0.25, d * 1.002, 0.006), T.plain ? M.plastic('#17181b', 0.4) : T.body2 === T.rubber ? T.dark : T.body2, { parent: g, at: [0, h * 0.18, 0] });
    vents(g, T.port, { at: [0, h + 0.0004, -d * 0.2], rot: [-PI / 2, 0, 0], n: 20, w: 0.003, h: d * 0.35, gap: w * 0.04 });
    if (V.cart) {
      mesh(roundedBox(w * 0.45, 0.004, 0.03, 0.002), T.port, { parent: g, at: [0, h, -d * 0.1] });
      const cart = group('cartridge', { parent: g, at: [0, h, -d * 0.1] });
      mesh(roundedBox(w * 0.38, 0.07, 0.016, 0.004), M.plastic(T.kids ? '#ff4f7a' : '#3a3b40', 0.5), { parent: cart, at: [0, 0.035 - 0.004, 0] });
      mesh(new THREE.PlaneGeometry(w * 0.3, 0.04), M.emissive('#ffb020', 0.15), { parent: cart, at: [0, 0.038, 0.0082] });
      for (let i = 0; i < 2; i++) mesh(roundedBox(0.04, 0.012, 0.022, 0.004), M.plastic(i ? '#c8322a' : '#6b6b6b', 0.4), { parent: g, at: [-w * 0.28 + i * 0.05, h + 0.002, d * 0.3] });
      extra.push(clip('insert', 3, [moveTrack(cart, 3, (t) => [0, 0.03 * (1 - pingPong(t)), 0])]));
    } else {
      mesh(roundedBox(0.012, 0.012, 0.003, 0.004), T.dark, { parent: g, at: [-w * 0.4, h * 0.6, d / 2 + 0.001] });
      mesh(roundedBox(w * 0.3, 0.003, 0.003, 0.0012), T.port, { parent: g, at: [w * 0.1, h * 0.62, d / 2 + 0.0008] });
    }
    led(ctx, g, V.cart ? 'red' : 'white', { at: [-w * 0.4, h * 0.3, d / 2 + 0.0005], w: 0.004 });
    ports(g, T.port, ['a', 'a'], { at: [w * 0.3, h * 0.3, d / 2 + 0.0005] });
    emblem(g, 0.026, [w * 0.35, h + 0.0008, d * 0.3], [-PI / 2, 0, 0]);
  }
  if (T.gaming) rgb(ctx, g, { at: [0, 0.008, (V.curved ? d / 2 + 0.01 : d / 2) + 0.001], w: w * 0.7, h: 0.004 });
  trimShell(ctx, g, w, Math.min(h, 0.05), d);
  buildController(ctx, g, V.ctrl, { at: [w / 2 + 0.11, 0, d * 0.2], rotY: -0.4 });
  return extra;
});

/* ================================ VR / XR ================================ */

export const VR_VARIANTS = {
  standalone: { w: 0.19, h: 0.105, d: 0.09 },
  'tethered-pc': { w: 0.2, h: 0.115, d: 0.1, cable: true, cams: 2 },
  'slim-goggles': { w: 0.17, h: 0.07, d: 0.05, slim: true },
  'mixed-reality-visor': { w: 0.2, h: 0.11, d: 0.1, visor: true },
  'with-controllers': { w: 0.19, h: 0.105, d: 0.09, ctrls: true },
  'smart-glasses': { glasses: true },
};

export const createVrHeadset = makeDevice('vr-headset', VR_VARIANTS, (g, { ctx, T, V }) => {
  const shell = T.plain ? M.plastic(ctx.o.color ?? '#f2f2f0', 0.4) : T.body;
  const strapMat = T.plain ? M.fabric('#3b3d42') : T.retro ? M.matte('#6d4a2c') : T.rugged ? T.accent : M.fabric('#26272b');
  if (V.glasses) {
    // smart glasses folded open, lying on the lenses' bottom edge
    const fr = T.plain ? M.plastic('#141416', 0.35) : T.body;
    const lensM = new THREE.MeshPhysicalMaterial({ color: T.gaming ? '#3a1f4a' : '#2a3540', transparent: true, opacity: 0.55, roughness: 0.05, clearcoat: 1 });
    for (const sx of [-1, 1]) {
      const rim = new THREE.TorusGeometry(0.025, 0.003, 10, 40).scale(1.15, 0.85, 1.4);
      mesh(rim, fr, { parent: g, at: [sx * 0.033, 0.024, 0] });
      mesh(new THREE.CircleGeometry(0.0245, 32).scale(1.15, 0.85, 1), lensM, { parent: g, at: [sx * 0.033, 0.024, 0] });
      // arm + hinge module (battery / speaker)
      mesh(roundedBox(0.008, 0.012, 0.012, 0.003), fr, { parent: g, at: [sx * 0.064, 0.03, -0.004] });
      mesh(roundedBox(0.006, 0.01, 0.13, 0.003), fr, { parent: g, at: [sx * 0.066, 0.03, -0.072] });
      mesh(roundedBox(0.006, 0.02, 0.022, 0.003), fr, { parent: g, at: [sx * 0.066, 0.02, -0.14], rot: [-0.6, 0, 0] });
    }
    mesh(roundedBox(0.016, 0.006, 0.006, 0.002), fr, { parent: g, at: [0, 0.032, 0] });
    mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.003, 14).rotateX(PI / 2), T.black, { parent: g, at: [0.06, 0.034, 0.003] });
    led(ctx, g, 'white', { at: [-0.06, 0.034, 0.0022], w: 0.0018, glow: 0.012 });
    screen(ctx, g, 0.014, 0.009, { at: [0.033, 0.03, 0.0035], content: 'dash' });
    if (T.gaming) rgb(ctx, g, { at: [0.066, 0.036, -0.06], normal: [0, 1, 0], w: 0.06, h: 0.002, roll: PI / 2 });
    return [];
  }
  const { w, h, d } = V;
  // headset rests face-down… no: display it facing forward on its strap
  const head = group('headset', { parent: g, at: [0, h / 2 + 0.004, 0] });
  if (V.visor) {
    mesh(roundedBox(w, h, d * 0.6, 0.04), shell, { parent: head, at: [0, 0, -d * 0.2] });
    mesh(new THREE.SphereGeometry(0.5, 40, 20, -PI * 0.32, PI * 0.64, PI * 0.38, PI * 0.24).scale(w * 1.05, h * 2.4, d * 1.1), new THREE.MeshPhysicalMaterial({ color: '#0a0b10', roughness: 0.02, metalness: 0.5, clearcoat: 1, iridescence: 0.6 }), { parent: head, at: [0, 0, -d * 0.36] });
  } else {
    mesh(roundedBox(w, h, d, V.slim ? 0.02 : 0.035, 4), shell, { parent: head });
    mesh(roundedBox(w * 0.92, h * 0.8, 0.004, 0.025), T.plain ? M.plastic('#1b1c1f', 0.4) : T.body2 === T.rubber ? T.dark : T.body2, { parent: head, at: [0, 0, d / 2 + 0.001] });
    const cams = V.cams ?? 4;
    [[-0.42, 0.32], [0.42, 0.32], [-0.42, -0.32], [0.42, -0.32]].slice(0, cams === 2 ? 2 : 4).forEach(([x, y]) => {
      mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.002, 18).rotateX(PI / 2), M.metal('#2a2b2e', 0.3), { parent: head, at: [x * w, y * h, d / 2 + 0.003] });
      mesh(new THREE.CircleGeometry(0.0038, 18), new THREE.MeshPhysicalMaterial({ color: '#05070c', roughness: 0.05, clearcoat: 1 }), { parent: head, at: [x * w, y * h, d / 2 + 0.0041] });
    });
    emblem(head, 0.026, [0, 0, d / 2 + 0.0035]);
  }
  // face cushion
  mesh(new THREE.TorusGeometry(0.5, 0.12, 10, 40).scale(w * 0.9, h * 0.9, 0.06), M.fabric(T.white ? '#e6e4df' : '#1d1e21'), { parent: head, at: [0, 0, -d / 2 - 0.005] });
  // lenses visible from behind
  for (const sx of [-1, 1]) mesh(new THREE.CircleGeometry(0.02, 28), new THREE.MeshPhysicalMaterial({ color: '#0d1220', roughness: 0.03, clearcoat: 1 }), { parent: head, at: [sx * 0.032, 0, -d / 2 + 0.0005], rot: [0, PI, 0] });
  // head strap loop going back, resting on the table
  const sr = 0.085;
  const strap = [];
  for (let i = 0; i <= 20; i++) { const a = -PI / 2 + (i / 20) * PI * 2; strap.push([Math.sin(a) * 0.09 * (i === 0 || i === 20 ? 1 : 1), 0, -d / 2 - sr + Math.cos(a) * sr]); }
  const pts = [];
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * PI * 2; pts.push([Math.cos(a) * w * 0.48, -h * 0.5 + 0.009, -d * 0.1 - sr + Math.sin(a) * sr * 1.05 - 0.02]); }
  curveTube(pts, 0.008, strapMat, { parent: head, closed: true, segments: 64, radialSegments: 8 });
  void strap;
  if (!V.slim) curveTube([[0, h / 2 - 0.004, -d * 0.2], [0, h / 2 + 0.03, -d / 2 - sr * 0.8], [0, -h / 2 + 0.02, -d / 2 - sr * 2 + 0.01]], 0.007, strapMat, { parent: head, segments: 24 });
  led(ctx, head, 'white', { at: [w * 0.4, -h / 2 - 0.0003, d * 0.3], normal: [0, -1, 0], w: 0.003, glow: 0.015 });
  ports(head, T.port, ['c'], { at: [-w / 2 - 0.0003, -h * 0.25, 0], rot: [0, -PI / 2, 0] });
  if (V.cable) curveTube([[w * 0.48, -h * 0.4, -d * 0.1], [w * 0.6, -h / 2 + 0.003, -d * 0.1 + 0.05], [w * 0.6, -h / 2 + 0.003, 0.25]], 0.0035, T.dark, { parent: head, segments: 24 });
  if (T.gaming) rgb(ctx, head, { at: [0, h / 2 + 0.0006, V.visor ? -d * 0.2 : d * 0.3], normal: [0, 1, 0], w: w * 0.6, h: 0.004 });
  if (T.rugged) for (const sx of [-1, 1]) mesh(roundedBox(0.03, h + 0.01, d + 0.01, 0.01), T.accent, { parent: head, at: [sx * (w / 2 - 0.01), 0, 0] });
  if (T.kids) for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.022, 16, 12), T.body2, { parent: head, at: [sx * w * 0.3, h / 2 + 0.006, 0], scale: [1, 0.7, 1] });
  if (T.damaged) { mesh(roundedBox(0.08, 0.016, d + 0.004, 0.002), M.matte('#9b9d9f', 0.95), { parent: head, at: [w * 0.2, h * 0.2, 0], rot: [0, 0, 0.5] }); }
  if (V.ctrls) {
    for (const sx of [-1, 1]) {
      const c = group(sx < 0 ? 'ctrlL' : 'ctrlR', { parent: g, at: [sx * 0.17, 0, 0.08] });
      mesh(new THREE.TorusGeometry(0.04, 0.007, 10, 36).rotateX(PI / 2), shell, { parent: c, at: [0, 0.007, -0.01] });
      mesh(new THREE.CapsuleGeometry(0.016, 0.06, 6, 16).rotateX(PI / 2), shell, { parent: c, at: [sx * -0.01, 0.016, 0.06] });
      mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 16), M.rubber(), { parent: c, at: [sx * -0.01, 0.033, 0.045] });
      led(ctx, c, 'white', { at: [sx * -0.01, 0.0325, 0.075], normal: [0, 1, 0], w: 0.0025, glow: 0.012 });
    }
  }
  return [];
});
