// Computers & peripherals: laptop, desktop PC sets, monitor, keyboard, mouse/trackpad, printer, router, retro computer.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, tube, cushion, clip, rotateTrack, moveTrack, spinTrack, pingPong, PI,
  makeDevice, screen, led, rgb, emblem, vents, ports, slab, frame, trimShell, keyGrid, LAYOUT } from './kit.js';

/* ================================ laptop ================================ */

export const LAPTOP_VARIANTS = {
  'ultrabook-13': { w: 0.3, d: 0.212, th: 0.012, lid: 0.005, open: 1.95, content: 'desktop' },
  'pro-16': { w: 0.356, d: 0.248, th: 0.014, lid: 0.006, open: 1.92, content: 'code' },
  'gamer-17': { w: 0.396, d: 0.29, th: 0.024, lid: 0.009, open: 1.9, content: 'game', gamer: true },
  convertible: { w: 0.304, d: 0.21, th: 0.013, lid: 0.006, open: 2.2, content: 'home', stylus: true },
  'student-11': { w: 0.292, d: 0.204, th: 0.019, lid: 0.008, open: 1.9, content: 'desktop', chunky: true },
  'workstation-15': { w: 0.36, d: 0.252, th: 0.022, lid: 0.008, open: 1.9, content: 'dash', numpad: true },
};

/** Laptop at origin (base bottom y=0). Returns lid group for animation. */
export function buildLaptop(ctx, par, V) {
  const { T } = ctx;
  const th = V.th * (T.retro ? 1.6 : T.rugged ? 1.4 : 1), lt = V.lid * (T.retro ? 1.5 : 1);
  const { w, d } = V;
  slab(par, T.body, w, th, d, { r: 0.012 });
  slab(par, T.body2, w * 0.96, 0.0012, d * 0.94, { at: [0, -0.0004, 0], r: 0.01 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.0016, 14), T.rubber, { at: [sx * w * 0.4, -0.0008, sz * d * 0.4], parent: par });
  // keyboard well + keys
  const rows = V.numpad ? LAYOUT.full.slice(1) : LAYOUT.laptop;
  const kw = w * (V.numpad ? 0.92 : 0.8);
  const units = Math.max(...rows.map((r) => r.reduce((a, b) => a + Math.abs(b), 0)));
  const u = Math.min(kw / units, 0.0195);
  slab(par, T.gaming ? M.plastic('#08080a', 0.6) : T.body2, units * u + 0.006, 0.0006, rows.length * u + 0.006, { at: [0, th - 0.0003, -d * 0.12], r: 0.004 });
  keyGrid(ctx, par, rows, { u, gap: u * 0.16, kh: 0.0016, at: [0, th + 0.0002, -d * 0.12 + 0.0] });
  // touchpad + speaker grilles
  slab(par, new THREE.MeshPhysicalMaterial({ color: T.white ? '#e9ebee' : T.retro ? '#8d826e' : '#3a3c41', roughness: 0.35, clearcoat: 0.6 }), w * 0.36, 0.0005, d * 0.26, { at: [0, th - 0.0001, d * 0.3], r: 0.006 });
  if (T.retro) for (const sx of [-1, 1]) mesh(roundedBox(0.03, 0.004, 0.012, 0.002), T.accent, { parent: par, at: [sx * 0.02, th + 0.001, d * 0.46] });
  if (!V.numpad) for (const sx of [-1, 1]) vents(par, T.port, { at: [sx * (w * 0.45), th + 0.0002, -d * 0.12], rot: [-PI / 2, 0, 0], n: 10, w: 0.0012, h: rows.length * u * 0.8, gap: 0.0028, d: 0.0006 });
  ports(par, T.port, V.gamer ? ['dc', 'a', 'a', 'hdmi', 'eth'] : V.chunky ? ['dc', 'a', 'hdmi', 'jack'] : ['c', 'c', 'jack'], { at: [-w / 2 - 0.0002, th / 2, 0], rot: [0, -PI / 2, 0], gap: 0.005 });
  ports(par, T.port, V.gamer || V.numpad ? ['a', 'sd', 'c'] : ['c'], { at: [w / 2 + 0.0002, th / 2, 0], rot: [0, PI / 2, 0] });
  led(ctx, par, 'white', { at: [-w * 0.42, th / 2, d / 2 + 0.0004], w: 0.0025 });
  if (V.gamer || T.gaming) {
    mesh(roundedBox(w * 0.7, th * 0.8, 0.02, 0.004), T.body2, { parent: par, at: [0, th * 0.4, -d / 2 - 0.009] });
    vents(par, T.port, { at: [0, th * 0.4, -d / 2 - 0.0195], rot: [0, PI, 0], n: 22, w: 0.004, h: th * 0.5, gap: w * 0.03 });
    rgb(ctx, par, { at: [0, 0.002, d / 2 + 0.0005], w: w * 0.7, h: 0.0025 });
  }
  if (T.gaming) mesh(roundedBox(w * 0.7, 0.0012, 0.0016, 0.0005), T.accent, { parent: par, at: [0, th + 0.0002, -d * 0.12 - rows.length * u / 2 - 0.004] });
  trimShell(ctx, par, w, th, d, { r: 0.012 });
  if (T.rugged) curveTube([[-w * 0.25, th * 0.5, d / 2 - 0.004], [-w * 0.2, th * 0.5, d / 2 + 0.025], [w * 0.2, th * 0.5, d / 2 + 0.025], [w * 0.25, th * 0.5, d / 2 - 0.004]], 0.006, T.rubber, { parent: par, segments: 24 });
  // hinge + lid
  const hy = th + 0.0024;
  mesh(new THREE.CylinderGeometry(0.0045, 0.0045, w * 0.7, 18).rotateZ(PI / 2), T.body2, { parent: par, at: [0, th, -d / 2 + 0.006] });
  const lid = group('lid', { parent: par, at: [0, hy, -d / 2 + 0.004] });
  const ang = T.damaged ? V.open + 0.35 : V.open;
  lid.rotation.x = -ang;
  slab(lid, T.body, w, lt, d - 0.003, { at: [0, -0.0024, (d - 0.003) / 2], r: 0.012 });
  const bz = V.chunky || T.retro ? 0.016 : 0.007;
  const sw = w - bz * 2, sh = d - 0.003 - bz * 2.4;
  mesh(new THREE.PlaneGeometry(w - 0.004, d - 0.007).rotateX(PI / 2), T.bezelMat, { parent: lid, at: [0, -0.0029, (d - 0.003) / 2] });
  screen(ctx, lid, sw, sh, { at: [0, -0.0036, (d - 0.003) / 2 + bz * 0.25], rot: [PI / 2, 0, 0], content: V.content });
  mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 0.0008, 12), T.black, { parent: lid, at: [0, -0.0034, d - 0.003 - bz * 0.55] });
  emblem(lid, V.gamer ? 0.045 : 0.035, [0, lt - 0.0024 + 0.0008, d * 0.5], [-PI / 2, 0, 0]);
  if (T.gaming || V.gamer) rgb(ctx, lid, { at: [0, lt - 0.0024 + 0.0004, d * 0.9], normal: [0, 1, 0], w: w * 0.5, h: 0.003 });
  if (T.rugged) for (const sx of [-1, 1]) mesh(roundedBox(0.04, lt * 1.6, 0.04, 0.006), T.accent, { parent: lid, at: [sx * (w / 2 - 0.012), lt / 2 - 0.0024, d - 0.016] });
  if (V.stylus) {
    const s = group('stylus', { parent: par, at: [w / 2 + 0.018, 0.0045, 0] });
    mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.15, 16).rotateX(PI / 2), T.white ? M.plastic('#fff', 0.3) : T.accent, { parent: s });
    mesh(new THREE.ConeGeometry(0.0045, 0.012, 16).rotateX(PI / 2), T.dark, { parent: s, at: [0, 0, 0.081] });
  }
  return { lid, ang };
}

export const createLaptop = makeDevice('laptop', LAPTOP_VARIANTS, (g, { ctx, V }) => {
  const { lid, ang } = buildLaptop(ctx, g, V);
  return [clip('open', 4, [rotateTrack(lid, 'x', 4, (t) => (ang - 0.02) * pingPong(t))])];
});

/* ================================ monitor ================================ */

export const MONITOR_VARIANTS = {
  'flat-24': { w: 0.53, h: 0.3, stand: 0.12, content: 'desktop' },
  'ultrawide-curved': { w: 0.82, h: 0.34, stand: 0.11, curve: 1.0, content: 'game' },
  'portrait-pivot': { w: 0.3, h: 0.53, stand: 0.06, content: 'code' },
  'studio-27': { w: 0.61, h: 0.345, stand: 0.13, content: 'desktop', slim: true },
  'crt-15': { w: 0.29, h: 0.22, crt: true, content: 'retro' },
  'arm-mounted-32': { w: 0.71, h: 0.4, stand: 0.16, arm: true, content: 'dash' },
};

export function buildMonitor(ctx, par, V, { at = [0, 0, 0] } = {}) {
  const { T } = ctx;
  const g = group('monitor', { parent: par, at });
  const bz = T.retro ? 0.025 : 0.008;
  if (V.crt || (T.retro && !V.curve)) {
    const W = V.crt ? V.w : V.w * 0.75, H = V.crt ? V.h : V.h * 0.8, D = W * 1.05;
    const sh = M.matte(T.isTrim && !T.retro ? (T.black ? '#202124' : T.white ? '#e9e9e4' : '#cdbf9e') : '#d2c6a8', 0.7);
    const shell = T.gaming || T.kids || T.rugged || T.gold ? T.body : sh;
    slab(g, shell, W * 0.6, 0.02, D * 0.55, { r: 0.03 });
    mesh(roundedBox(W + 0.06, H + 0.07, 0.07, 0.015), shell, { parent: g, at: [0, 0.02 + (H + 0.07) / 2, 0.02] });
    const back = new THREE.CylinderGeometry(0.17, 0.3, 1, 4, 1).rotateY(PI / 4).rotateX(-PI / 2);
    mesh(back, shell, { parent: g, at: [0, 0.02 + (H + 0.07) / 2, -D * 0.3 + 0.01], scale: [(W + 0.02) / 0.42 * 0.66, (H + 0.04) / 0.42 * 0.66, D * 0.6] });
    mesh(new THREE.PlaneGeometry(W, H), T.bezelMat, { parent: g, at: [0, 0.02 + (H + 0.07) / 2 + 0.008, 0.0555] });
    screen(ctx, g, W * 0.92, H * 0.9, { at: [0, 0.02 + (H + 0.07) / 2 + 0.008, 0.0565], content: V.content });
    led(ctx, g, 'green', { at: [W / 2 - 0.005, 0.035, 0.0555], w: 0.005 });
    for (let i = 0; i < 2; i++) mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.006, 16).rotateX(PI / 2), T.dark, { parent: g, at: [W / 2 - 0.03 - i * 0.025, 0.035, 0.057] });
    vents(g, T.port, { at: [0, 0.02 + H * 0.8, -D * 0.25], rot: [-0.5, 0, 0], n: 14, w: 0.004, h: 0.08, gap: 0.014, vertical: true });
    return g;
  }
  const W = V.w + bz * 2, H = V.h + bz * 2 + (V.slim ? 0.025 : 0);
  const cy = (V.stand ?? 0.1) + H / 2 + 0.012;
  const panelD = V.slim ? 0.012 : 0.018;
  const head = group('panel', { parent: g, at: [0, cy, 0] });
  if (V.curve) {
    const R = V.curve, th = W / R;
    const s = new THREE.Shape();
    s.absarc(0, 0, R + panelD, PI / 2 - th / 2, PI / 2 + th / 2, false);
    s.absarc(0, 0, R, PI / 2 + th / 2, PI / 2 - th / 2, true);
    const geo = new THREE.ExtrudeGeometry(s, { depth: H, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 48 });
    geo.rotateX(-PI / 2).translate(0, -H / 2, R);
    // shape is in x,-z after rotation: arc around (0, R) facing +z
    mesh(geo, T.body2, { parent: head });
    mesh(new THREE.CylinderGeometry(R - 0.0008, R - 0.0008, H - 0.002, 48, 1, true, PI - th / 2, th).translate(0, 0, R), new THREE.MeshPhysicalMaterial({ color: T.bezel, side: THREE.BackSide, roughness: 0.2 }), { parent: head });
    screen(ctx, head, V.w, V.h, { at: [0, bz * 0.3, 0.0], content: V.content, curve: R - 0.002 });
    mesh(roundedBox(0.3, 0.16, 0.05, 0.02), T.body2, { parent: head, at: [0, 0, -panelD - 0.02] });
  } else {
    mesh(roundedBox(W, H, panelD, 0.006), T.slim || V.slim ? T.body : T.body2, { parent: head });
    mesh(new THREE.PlaneGeometry(W - 0.004, H - 0.004), T.bezelMat, { parent: head, at: [0, 0, panelD / 2 + 0.0004] });
    screen(ctx, head, V.w, V.h, { at: [0, V.slim ? 0.012 : bz * 0.3, panelD / 2 + 0.001], content: V.content });
    mesh(roundedBox(W * 0.6, H * 0.6, 0.03, 0.012), T.body2, { parent: head, at: [0, 0, -panelD / 2 - 0.012] });
    vents(head, T.port, { at: [0, H * 0.22, -panelD / 2 - 0.027], rot: [0, PI, 0], n: 16, w: 0.003, h: 0.05, gap: W * 0.03 });
    if (V.slim) emblem(head, 0.02, [0, -H / 2 + 0.013, panelD / 2 + 0.0008]);
  }
  if (!V.slim) emblem(head, 0.016, [0, -H / 2 + bz * 0.5 + 0.0005, (V.curve ? 0.012 : panelD / 2) + 0.0008]);
  led(ctx, head, 'white', { at: [W / 2 - 0.02, -H / 2 + 0.003, (V.curve ? 0.012 : panelD / 2) + 0.0006], w: 0.003 });
  if (T.gaming) rgb(ctx, head, { at: [0, 0, -panelD / 2 - 0.0275], normal: [0, 0, -1], w: W * 0.5, h: 0.006 });
  if (T.rugged) for (const sx of [-1, 1]) for (const sy of [-1, 1]) mesh(roundedBox(0.04, 0.04, panelD + 0.01, 0.008), T.accent, { parent: head, at: [sx * (W / 2 - 0.012), sy * (H / 2 - 0.012), 0] });
  if (T.kids) mesh(new THREE.TorusGeometry(0.03, 0.01, 10, 24), T.body2, { parent: head, at: [W / 2 - 0.02, H / 2 + 0.015, 0] });
  if (T.damaged) mesh(roundedBox(0.12, 0.03, panelD + 0.003, 0.001), M.matte('#9b9d9f', 0.95), { parent: head, at: [W / 2 - 0.05, H / 2 - 0.03, 0], rot: [0, 0, 0.7] });
  // stand
  const backZ = V.curve ? -panelD - 0.045 : -panelD / 2 - 0.027;
  if (V.arm) {
    mesh(roundedBox(0.12, 0.05, 0.12, 0.01), T.dark, { parent: g, at: [0, 0.025, backZ - 0.15] });
    tube([0, 0.05, backZ - 0.15], [0, cy * 0.75, backZ - 0.15], 0.016, T.metal, { parent: g });
    tube([0, cy * 0.75, backZ - 0.15], [0, cy, backZ - 0.02], 0.014, T.metal, { parent: g });
    mesh(new THREE.SphereGeometry(0.02, 16, 12), T.dark, { parent: g, at: [0, cy * 0.75, backZ - 0.15] });
    mesh(roundedBox(0.08, 0.08, 0.025, 0.006), T.dark, { parent: g, at: [0, cy, backZ - 0.008] });
  } else {
    const nz = backZ - 0.03;
    const foot = V.slim ? roundedBox(0.2, 0.008, 0.18, 0.004) : new THREE.CylinderGeometry(0.13, 0.135, 0.012, 48).scale(1.1, 1, 0.75);
    mesh(foot, V.slim ? T.body : T.body2, { parent: g, at: [0, V.slim ? 0.004 : 0.006, nz + 0.03] });
    const neck = V.slim ? roundedBox(0.16, cy - 0.01, 0.008, 0.003) : roundedBox(0.05, cy, 0.03, 0.01);
    mesh(neck, V.slim ? T.body : T.body2, { parent: g, at: [0, (cy - 0.01) / 2 + 0.01, nz + 0.003], rot: V.slim ? [-0.15, 0, 0] : [0, 0, 0] });
    mesh(roundedBox(0.07, 0.07, Math.abs(nz - backZ) + 0.006, 0.006), V.slim ? T.body : T.body2, { parent: g, at: [0, cy, (nz + backZ) / 2] });
  }
  return g;
}

export const createMonitor = makeDevice('monitor', MONITOR_VARIANTS, (g, { ctx, V }) => {
  buildMonitor(ctx, g, V);
  return [];
});

/* ================================ keyboard ================================ */

export const KEYBOARD_VARIANTS = {
  'full-size': { rows: 'full', case: 0.012 },
  tenkeyless: { rows: 'tkl', case: 0.012 },
  'compact-60': { rows: 'sixty', case: 0.012, mech: true },
  'low-profile': { rows: 'full', case: 0.006, low: true },
  'ergonomic-split': { rows: 'sixty', case: 0.014, split: true },
  'mechanical-wood': { rows: 'tkl', case: 0.02, mech: true, wood: true },
};

export function buildKeyboard(ctx, par, V, { at = [0, 0, 0], rotY = 0 } = {}) {
  const { T } = ctx;
  const g = group('keyboard', { parent: par, at, rot: [0, rotY, 0] });
  const rows = LAYOUT[V.rows];
  const u = V.low ? 0.0185 : 0.019;
  const units = Math.max(...rows.map((r) => r.reduce((a, b) => a + Math.abs(b), 0)));
  const kh = V.low ? 0.003 : V.mech ? 0.009 : 0.006;
  const caseMat = V.wood ? M.wood?.('walnut') ?? T.body : T.body;
  const halves = V.split ? [[-1, rows.map((r) => r.slice(0, Math.ceil(r.length / 2)))], [1, rows.map((r) => r.slice(Math.ceil(r.length / 2)))]] : [[0, rows]];
  for (const [side, rs] of halves) {
    const un = Math.max(...rs.map((r) => r.reduce((a, b) => a + Math.abs(b), 0)));
    const w = un * u + 0.02, d = rs.length * u + 0.02;
    const h = group('half', { parent: g, at: [side * (w / 2 + 0.03), 0, 0], rot: [0, -side * 0.22, 0] });
    slab(h, caseMat, w, V.case, d, { r: 0.008 });
    const tilt = group('deck', { parent: h, at: [0, V.case, 0] });
    keyGrid(ctx, tilt, rs, { u, kh, gap: u * 0.14, at: [0, 0, 0] });
    if (V.split || V.low) slab(h, T.body2, w * 0.9, 0.008, 0.06, { at: [0, 0, d / 2 + 0.03], r: 0.02 });
  }
  const w = units * u + 0.02, d = rows.length * u + 0.02;
  if (!V.split) {
    led(ctx, g, 'white', { at: [w / 2 - 0.02, V.case + 0.0005, -d / 2 + 0.006], normal: [0, 1, 0], w: 0.0025 });
    led(ctx, g, 'white', { at: [w / 2 - 0.03, V.case + 0.0005, -d / 2 + 0.006], normal: [0, 1, 0], w: 0.0025 });
    emblem(g, 0.012, [-w / 2 + 0.014, V.case + 0.0006, -d / 2 + 0.006], [-PI / 2, 0, 0]);
    curveTube([[0, V.case * 0.5, -d / 2], [0, 0.003, -d / 2 - 0.05], [0.04, 0.003, -d / 2 - 0.12]], 0.0022, T.dark, { parent: g, segments: 16 });
    if (T.gaming) rgb(ctx, g, { at: [0, 0.003, d / 2 + 0.0005], w: w * 0.9, h: 0.003 });
    trimShell(ctx, g, w, V.case, d, { r: 0.008 });
    if (T.retro) mesh(roundedBox(w * 0.3, 0.004, 0.012, 0.002), T.accent, { parent: g, at: [w * 0.3, V.case + 0.002, -d / 2 + 0.008] });
  }
  return { group: g, w, d };
}

export const createComputerKeyboard = makeDevice('computer-keyboard', KEYBOARD_VARIANTS, (g, { ctx, V }) => {
  buildKeyboard(ctx, g, V);
  return [];
});

/* ============================== mouse / trackpad ============================== */

export const MOUSE_VARIANTS = {
  office: { l: 0.11, w: 0.062, h: 0.036 },
  esports: { l: 0.126, w: 0.068, h: 0.042, side: true },
  vertical: { l: 0.11, w: 0.07, h: 0.075, vertical: true },
  trackball: { l: 0.13, w: 0.09, h: 0.045, ball: true },
  'travel-mini': { l: 0.09, w: 0.052, h: 0.028 },
  trackpad: { pad: true },
};

export function buildMouse(ctx, par, V, { at = [0, 0, 0], rotY = 0 } = {}) {
  const { T } = ctx;
  const g = group('mouse', { parent: par, at, rot: [0, rotY, 0] });
  if (V.pad) {
    const w = 0.16, d = 0.115;
    const wedge = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(d / 2, 0.0045), new THREE.Vector2(-d / 2, 0.01)]);
    const geo = new THREE.ExtrudeGeometry(wedge, { depth: w, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.0015, bevelSegments: 2 });
    geo.translate(0, 0.0015, -w / 2).rotateY(PI / 2);
    mesh(geo, T.body, { parent: g });
    const top = new THREE.MeshPhysicalMaterial({ color: T.white || T.plain ? '#e7e9ec' : T.retro ? '#bfb393' : '#2b2d31', roughness: 0.4, clearcoat: 0.5 });
    mesh(new THREE.PlaneGeometry(w - 0.006, Math.hypot(d, 0.0055) - 0.006).rotateX(-PI / 2 - Math.atan2(0.0055, d)), top, { parent: g, at: [0, 0.0087, 0] });
    led(ctx, g, 'green', { at: [-w / 2 + 0.01, 0.0115, -d / 2 + 0.003], normal: [0, 1, 0], w: 0.002 });
    if (T.gaming) rgb(ctx, g, { at: [0, 0.003, d / 2 + 0.0026], w: w * 0.9, h: 0.002 });
    trimShell(ctx, g, w, 0.008, d, { r: 0.01 });
    return g;
  }
  const { l, w, h } = V;
  const prof = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16; prof.push([Math.sin(t * PI) * 0.5 + 0.02, t]); }
  // mouse body: squashed sphere-like lathe scaled to size, hump towards the rear
  const geo = new THREE.SphereGeometry(0.5, 32, 20, 0, PI * 2, 0, PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i), y = p.getY(i);
    p.setY(i, y * (1 - 0.35 * Math.max(0, z)) );
    p.setX(i, p.getX(i) * (1 - 0.12 * z));
  }
  geo.computeVertexNormals();
  const body = mesh(geo, T.body2 === T.rubber ? T.body : T.body, { parent: g, scale: [w, h * 2 - 0.004, l], at: [0, 0.003, 0], rot: V.vertical ? [0, 0, 0.9] : [0, 0, 0] });
  mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32).scale(w * 0.98, 0.004, l * 0.98), T.body2 === T.rubber ? T.dark : T.body2, { parent: g, at: [0, 0.002, 0] });
  if (V.vertical) body.position.y = 0.012;
  if (!V.vertical) {
    // buttons split + wheel
    mesh(roundedBox(0.0012, h * 0.3, l * 0.35, 0.0005), T.port, { parent: g, at: [0, h * 0.86, l * 0.3], rot: [0.32, 0, 0] });
    const wheel = group('wheel', { parent: g, at: [0, h * 0.88, l * 0.22] });
    mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.006, 20).rotateZ(PI / 2), T.rubber, { parent: wheel });
    ctx.extra.push(spinTrack(wheel, 'x', 1));
  }
  if (V.ball) {
    mesh(new THREE.SphereGeometry(0.019, 24, 16), M.plastic(T.gaming ? '#ff2bd6' : T.kids ? '#ffd23f' : '#c82a2a', 0.15), { parent: g, at: [-w * 0.3, h * 0.72, -0.005] });
  }
  if (V.side) for (let i = 0; i < 2; i++) mesh(roundedBox(0.016, 0.006, 0.004, 0.0015), T.dark, { parent: g, at: [-w / 2 + 0.002, h * 0.5, l * 0.08 - i * 0.02], rot: [0, PI / 2, 0] });
  led(ctx, g, T.gaming || V.side ? 'blue' : 'green', { at: [0, h * 0.82, -l * 0.18], normal: [0, 1, -0.4], w: 0.003 });
  if (T.gaming || V.side) rgb(ctx, g, { at: [0, h * 0.42, -l / 2 + 0.002], normal: [0, 0.3, -1], w: w * 0.6, h: 0.003 });
  if (T.rugged) mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 32).rotateX(PI / 2).scale(w, 1.5 * h * 0.1, l), T.accent, { parent: g, at: [0, 0.006, 0] });
  if (T.kids) { mesh(new THREE.SphereGeometry(0.012, 16, 12), T.body2, { parent: g, at: [-w * 0.28, h * 0.68, -l * 0.25] }); mesh(new THREE.SphereGeometry(0.012, 16, 12), T.body2, { parent: g, at: [w * 0.28, h * 0.68, -l * 0.25] }); }
  if (T.damaged) mesh(roundedBox(w * 0.9, 0.002, 0.014, 0.0008), M.matte('#9b9d9f', 0.95), { parent: g, at: [0, h * 0.72, -0.01], rot: [0.25, 0, 0] });
  if (T.retro) curveTube([[0, 0.01, l / 2], [0, 0.006, l / 2 + 0.04], [0.03, 0.003, l / 2 + 0.1]], 0.0022, M.matte('#cfc4a6'), { parent: g, segments: 16 });
  return g;
}

export const createComputerMouse = makeDevice('computer-mouse', MOUSE_VARIANTS, (g, { ctx, V }) => {
  buildMouse(ctx, g, V);
  return [];
});

/* ================================ desktop PC ================================ */

export const DESKTOP_VARIANTS = {
  'tower-set': { tower: [0.2, 0.44, 0.42], mon: 'flat-24' },
  'gaming-rig': { tower: [0.23, 0.48, 0.46], mon: 'ultrawide-curved', glass: true },
  'all-in-one': { aio: true },
  'mini-pc': { mini: true, mon: 'flat-24' },
  'dual-monitor': { tower: [0.2, 0.42, 0.4], mon: 'flat-24', dual: true },
  'small-form': { tower: [0.17, 0.3, 0.3], mon: 'studio-27' },
};

export const createDesktopPc = makeDevice('desktop-pc', DESKTOP_VARIANTS, (g, { ctx, T, V }) => {
  const extra = [];
  if (V.aio) {
    buildMonitor(ctx, g, { w: 0.6, h: 0.34, stand: 0.11, slim: true, content: 'desktop' });
  } else {
    const MV = MONITOR_VARIANTS[V.mon];
    if (V.dual) { buildMonitor(ctx, g, MV, { at: [-0.29, 0, 0] }); const m2 = buildMonitor(ctx, g, MV, { at: [0.29, 0, 0] }); m2.rotation.y = -0.18; }
    else buildMonitor(ctx, g, MV);
  }
  buildKeyboard(ctx, g, { rows: V.aio || V.mini ? 'sixty' : 'full', case: 0.01, low: !!V.aio }, { at: [-0.04, 0, 0.24] });
  buildMouse(ctx, g, V.aio ? MOUSE_VARIANTS['travel-mini'] : MOUSE_VARIANTS.office, { at: [0.3, 0, 0.26] });
  if (V.mini) {
    const mp = group('minipc', { parent: g, at: [0.36, 0, -0.02] });
    slab(mp, T.body, 0.13, 0.05, 0.13, { r: 0.02 });
    led(ctx, mp, 'blue', { at: [0.04, 0.025, 0.0652], w: 0.003 });
    ports(mp, T.port, ['c', 'a', 'jack'], { at: [-0.02, 0.025, 0.0652] });
    emblem(mp, 0.03, [0, 0.0505, 0], [-PI / 2, 0, 0]);
  }
  if (V.tower) {
    const [w, h, d] = V.tower;
    const t = group('tower', { parent: g, at: [V.dual ? 0.66 : 0.52, 0, -0.04] });
    mesh(roundedBox(w, h, d, 0.012), T.body, { parent: t, at: [0, h / 2 + 0.012, 0] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.03, 0.014, 0.05, 0.005), T.rubber, { parent: t, at: [sx * (w / 2 - 0.025), 0.007, sz * (d / 2 - 0.04)] });
    mesh(roundedBox(w - 0.02, h - 0.03, 0.006, 0.004), T.body2, { parent: t, at: [0, h / 2 + 0.012, d / 2 + 0.002] });
    vents(t, T.port, { at: [0, h * 0.45, d / 2 + 0.005], n: 12, w: 0.004, h: h * 0.5, gap: w * 0.06 });
    ports(t, T.port, ['a', 'a', 'c', 'jack'], { at: [0, h - 0.02, d / 2 + 0.005], gap: 0.006 });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 20).rotateX(PI / 2), T.metal, { parent: t, at: [w * 0.3, h - 0.02, d / 2 + 0.006] });
    led(ctx, t, T.gaming ? 'red' : 'blue', { at: [w * 0.3, h - 0.035, d / 2 + 0.005], w: 0.0025 });
    emblem(t, 0.03, [0, 0.05, d / 2 + 0.006]);
    if (V.glass || T.gaming) {
      const side = new THREE.MeshPhysicalMaterial({ color: '#1a1c22', transparent: true, opacity: 0.35, roughness: 0.05, clearcoat: 1 });
      mesh(roundedBox(0.004, h * 0.86, d * 0.86, 0.002), side, { parent: t, at: [w / 2 + 0.002, h / 2 + 0.012, 0] });
      for (let i = 0; i < 3; i++) {
        const fan = group(`fan${i}`, { parent: t, at: [0, h * 0.25 + i * h * 0.27, d / 2 + 0.006] });
        mesh(new THREE.TorusGeometry(0.05, 0.004, 8, 32), M.emissive(['#ff2bd6', '#3dc8ff', '#7a3cff'][i], 1.4), { parent: fan });
        for (let b = 0; b < 7; b++) mesh(roundedBox(0.045, 0.012, 0.002, 0.001), T.dark, { parent: fan, at: [Math.cos(b / 7 * PI * 2) * 0.022, Math.sin(b / 7 * PI * 2) * 0.022, 0], rot: [0.3, 0, b / 7 * PI * 2] });
        extra.push(spinTrack(fan, 'z', 0.5 + i * 0.1));
      }
      rgb(ctx, t, { at: [w / 2 + 0.0045, 0.03, 0], normal: [1, 0, 0], w: d * 0.8, h: 0.004 });
    }
    if (T.rugged) for (const sy of [0, 1]) for (const sz of [-1, 1]) mesh(roundedBox(w + 0.02, 0.04, 0.04, 0.008), T.accent, { parent: t, at: [0, 0.03 + sy * (h - 0.04), sz * (d / 2 - 0.015)] });
    if (T.kids) mesh(new THREE.SphereGeometry(0.05, 20, 14, 0, PI * 2, 0, PI / 2), T.body2, { parent: t, at: [0, h + 0.012, 0] });
    if (T.damaged) mesh(roundedBox(0.012, h * 0.4, d * 0.4, 0.001), M.matte('#9b9d9f'), { parent: t, at: [w / 2 + 0.002, h * 0.7, 0], rot: [0.5, 0, 0] });
  }
  return extra.length ? [clip('fans', 1, extra)] : [];
});

/* ================================ printer ================================ */

export const PRINTER_VARIANTS = {
  inkjet: { w: 0.43, h: 0.15, d: 0.32 },
  laser: { w: 0.38, h: 0.24, d: 0.36 },
  'all-in-one': { w: 0.44, h: 0.2, d: 0.36, scanner: true },
  'photo-mini': { w: 0.18, h: 0.07, d: 0.13 },
  receipt: { w: 0.14, h: 0.13, d: 0.19, receipt: true },
  'wide-format': { w: 0.62, h: 0.2, d: 0.4, scanner: true },
};

export const createPrinter = makeDevice('printer', PRINTER_VARIANTS, (g, { ctx, T, V }) => {
  const { w, h, d } = V;
  const shell = T.plain ? M.plastic(ctx.o.color ?? '#e8e9eb', 0.45) : T.body;
  slab(g, shell, w, h, d, { r: 0.02 });
  trimShell(ctx, g, w, h, d, { r: 0.02 });
  const paper = M.matte('#fbfbf8', 0.9);
  // output tray + sheet
  const sheet = group('sheet', { parent: g, at: [0, h * 0.3, d / 2] });
  if (V.receipt) {
    mesh(new THREE.CylinderGeometry(0.03, 0.03, w * 0.6, 24).rotateZ(PI / 2), paper, { parent: g, at: [0, h + 0.0, -0.02] });
    curveTube([[0, h, d * 0.3], [0, h + 0.03, d * 0.42], [0, h + 0.06, d * 0.45]], 0.0003, paper, { parent: g });
    mesh(new THREE.PlaneGeometry(w * 0.55, 0.08), paper, { parent: g, at: [0, h + 0.04, d * 0.42], rot: [-0.3, 0, 0] });
  } else {
    mesh(roundedBox(w * 0.7, 0.004, d * 0.35, 0.0015), T.body2 === T.rubber ? T.dark : T.body2, { parent: sheet, at: [0, 0, d * 0.16] });
    mesh(roundedBox(w * 0.5, 0.0008, d * 0.32, 0.0003), paper, { parent: sheet, at: [0, 0.0025, d * 0.15] });
    // input paper at rear
    mesh(roundedBox(w * 0.5, h * 0.8, 0.002, 0.0008), paper, { parent: g, at: [0, h + h * 0.3, -d / 2 + 0.03], rot: [-0.35, 0, 0] });
    mesh(roundedBox(w * 0.6, h * 0.5, 0.006, 0.002), T.body2 === T.rubber ? T.dark : T.body2, { parent: g, at: [0, h + h * 0.18, -d / 2 + 0.02], rot: [-0.35, 0, 0] });
  }
  if (V.scanner) {
    const lid = group('lid', { parent: g, at: [0, h, -d / 2 + 0.06] });
    slab(lid, shell, w * 0.95, 0.025, d * 0.6, { at: [0, 0, d * 0.3 - 0.0], r: 0.01 });
    mesh(roundedBox(w * 0.3, 0.006, 0.02, 0.003), T.dark, { parent: lid, at: [0, 0.012, d * 0.6] });
    ctx.extra.push(rotateTrack(lid, 'x', 3, (t) => -0.9 * pingPong(t)));
  }
  // control panel with screen
  const pw = Math.min(w * 0.35, 0.12);
  const cp = group('panel', { parent: g, at: [w / 2 - pw / 2 - 0.02, h, d / 2 - 0.035] });
  mesh(roundedBox(pw, 0.012, 0.05, 0.004), T.dark, { parent: cp, at: [0, 0.006, 0], rot: [0.4, 0, 0] });
  screen(ctx, cp, pw * 0.55, 0.03, { at: [-pw * 0.15, 0.0125, 0.002], rot: [-PI / 2 + 0.4, 0, 0], content: 'dash' });
  led(ctx, cp, 'green', { at: [pw * 0.35, 0.0125, 0.002], normal: [0, 0.92, 0.39], w: 0.004 });
  led(ctx, cp, 'amber', { at: [pw * 0.35, 0.0125 + 0.006, -0.012], normal: [0, 0.92, 0.39], w: 0.004 });
  emblem(g, 0.025, [-w / 2 + 0.035, h * 0.6, d / 2 + 0.0008]);
  vents(g, T.port, { at: [-w / 2 - 0.001, h * 0.5, 0], rot: [0, -PI / 2, 0], n: 10, w: 0.003, h: h * 0.4, gap: 0.008 });
  if (T.gaming) rgb(ctx, g, { at: [0, h * 0.12, d / 2 + 0.001], w: w * 0.8, h: 0.004 });
  ctx.extra.push(moveTrack(sheet, 3, (t) => [0, 0, 0.04 * pingPong(t)]));
  return [];
});

/* ================================ router ================================ */

export const ROUTER_VARIANTS = {
  'antenna-4': { w: 0.24, h: 0.035, d: 0.16, ant: 4 },
  'gaming-8': { w: 0.3, h: 0.05, d: 0.3, ant: 8, star: true },
  'mesh-node': { mesh: true, r: 0.055, h: 0.11 },
  'tower-ap': { tower: true, w: 0.09, h: 0.2, d: 0.09 },
  'cable-modem': { w: 0.06, h: 0.2, d: 0.17, upright: true },
  'travel-mini': { w: 0.09, h: 0.022, d: 0.07, ant: 2 },
};

export const createWifiRouter = makeDevice('wifi-router', ROUTER_VARIANTS, (g, { ctx, T, V }) => {
  if (V.mesh) {
    mesh(lathe([[0, 0], [V.r, 0], [V.r * 1.02, V.h * 0.1], [V.r, V.h * 0.8], [V.r * 0.85, V.h * 0.97], [0, V.h]], 40), T.plain ? M.plastic(ctx.o.color ?? '#f2f3f4', 0.4) : T.body, { parent: g });
    led(ctx, g, 'white', { at: [0, V.h + 0.0005, 0], normal: [0, 1, 0], w: 0.012, h: 0.004, shape: 'strip' });
    vents(g, T.port, { at: [0, V.h * 0.2, V.r * 0.99], n: 5, w: 0.002, h: 0.012, gap: 0.006 });
    emblem(g, 0.018, [0, V.h * 0.55, V.r * 1.005]);
    if (T.gaming) rgb(ctx, g, { at: [0, 0.006, V.r + 0.001], w: 0.05, h: 0.003 });
    return [];
  }
  const { w, h, d } = V;
  if (V.tower || V.upright) {
    slab(g, T.body, w + 0.02, 0.012, d + 0.02, { r: 0.02 });
    mesh(roundedBox(w, h, d, Math.min(w, d) * (V.tower ? 0.45 : 0.15)), T.body, { parent: g, at: [0, h / 2 + 0.012, 0] });
    for (let i = 0; i < 5; i++) led(ctx, g, i === 4 ? 'amber' : 'white', { at: [0, h * 0.85 - i * 0.018, d / 2 + 0.0005], w: 0.003 });
    vents(g, T.port, { at: [w / 2 + 0.0005, h * 0.6, 0], rot: [0, PI / 2, 0], n: 8, w: 0.003, h: h * 0.4, gap: 0.008 });
    ports(g, T.port, ['eth', 'eth', 'dc'], { at: [0, 0.05, -d / 2 - 0.0005], rot: [0, PI, 0], gap: 0.006 });
    emblem(g, 0.02, [0, h * 0.25, d / 2 + 0.0008]);
    if (T.gaming) rgb(ctx, g, { at: [0, h * 0.5, d / 2 + 0.001], normal: [0, 0, 1], w: h * 0.5, h: 0.003, roll: PI / 2 });
    trimShell(ctx, g, w + 0.02, 0.012, d + 0.02);
    return [];
  }
  const sh = V.star ? (() => { const s = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2, r = i % 2 ? 0.5 : 0.42; s.push([Math.cos(a) * r * w, Math.sin(a) * r * d]); } return s; })() : null;
  if (sh) {
    const s = new THREE.Shape(sh.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(s, { depth: h * 0.6, bevelEnabled: true, bevelThickness: h * 0.2, bevelSize: 0.006, bevelSegments: 3 });
    geo.rotateX(-PI / 2).translate(0, h * 0.2, 0);
    mesh(geo, T.plain ? M.plastic('#17181b', 0.4) : T.body, { parent: g });
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.003, 32), M.emissive('#d0202a', 1.2), { parent: g, at: [0, h + 0.001, 0] });
  } else {
    slab(g, T.body, w, h, d, { r: 0.015 });
    vents(g, T.port, { at: [0, h + 0.0004, -d * 0.1], rot: [-PI / 2, 0, 0], n: 14, w: 0.003, h: d * 0.4, gap: w * 0.05 });
  }
  for (let i = 0; i < 6; i++) led(ctx, g, i === 0 ? 'amber' : 'green', { at: [-w * 0.3 + i * w * 0.07, h * 0.5, (V.star ? d * 0.42 : d / 2) + 0.0005], w: 0.003 });
  ports(g, T.port, V.ant > 2 ? ['eth', 'eth', 'eth', 'eth', 'a', 'dc'] : ['eth', 'c'], { at: [0, h * 0.5, (V.star ? -d * 0.42 : -d / 2) - 0.0005], rot: [0, PI, 0], gap: 0.005 });
  if (!V.star) emblem(g, 0.02, [w * 0.35, h + 0.0008, d * 0.3], [-PI / 2, 0, 0]);
  const al = V.ant > 2 ? 0.16 : 0.07;
  for (let i = 0; i < V.ant; i++) {
    const a = V.star ? (i / V.ant) * PI * 2 + PI / 8 : 0;
    const x = V.star ? Math.cos(a) * w * 0.44 : (i - (V.ant - 1) / 2) * (w / V.ant);
    const z = V.star ? Math.sin(a) * d * 0.44 : -d / 2 + 0.008;
    const ant = group(`antenna${i}`, { parent: g, at: [x, h * 0.6, z], rot: V.star ? [Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35] : [-0.12, 0, (i - (V.ant - 1) / 2) * 0.18] });
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.014, 14).rotateZ(PI / 2), T.dark, { parent: ant });
    mesh(roundedBox(0.014, al, 0.006, 0.003), T.isTrim ? T.body2 === T.rubber ? T.accent : T.body2 : T.dark, { parent: ant, at: [0, al / 2 + 0.004, 0] });
    if (T.gaming) mesh(roundedBox(0.003, al * 0.6, 0.0065, 0.001), T.accent, { parent: ant, at: [0, al * 0.55, 0] });
  }
  if (T.gaming && !V.star) rgb(ctx, g, { at: [0, h * 0.25, d / 2 + 0.001], w: w * 0.8, h: 0.003 });
  trimShell(ctx, g, w, h, d, { r: 0.015 });
  return [];
});

/* ============================= retro computer ============================= */

export const RETRO_PC_VARIANTS = {
  'wedge-8bit': { wedge: true },
  'beige-box': { box: true, crt: true },
  'compact-mac': { compact: true },
  luggable: { luggable: true },
  terminal: { terminal: true },
  'home-micro': { wedge: true, slim: true, crt: true },
};

export const createRetroComputer = makeDevice('retro-computer', RETRO_PC_VARIANTS, (g, { ctx, T, V }) => {
  const beige = T.plain ? M.matte(ctx.o.color ?? '#d9cdae', 0.7) : T.body;
  const kb = { rows: 'sixty', case: 0.0 };
  if (V.wedge) {
    const w = V.slim ? 0.38 : 0.41, d = 0.21;
    const s = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(d / 2, 0.03), new THREE.Vector2(-d / 2, 0.065)]);
    const geo = new THREE.ExtrudeGeometry(s, { depth: w - 0.01, bevelEnabled: true, bevelSize: 0.005, bevelThickness: 0.005, bevelSegments: 2 });
    geo.translate(0, 0, -(w - 0.01) / 2).rotateY(PI / 2);
    mesh(geo, V.slim ? (T.plain ? M.matte('#2a2522', 0.6) : beige) : beige, { parent: g });
    const deck = group('deck', { parent: g, at: [0, 0.048, 0.01], rot: [Math.atan2(0.035, d), 0, 0] });
    keyGrid(ctx, deck, LAYOUT.sixty, { u: 0.0185, kh: 0.007, gap: 0.003, at: [-0.02, 0.0, 0], mat: T.plain ? M.plastic(V.slim ? '#3a3330' : '#5a4e40', 0.5) : undefined });
    for (let i = 0; i < 4; i++) mesh(roundedBox(0.03, 0.007, 0.016, 0.002), T.plain ? T.accent : T.body2, { parent: deck, at: [0.17, 0.0035, 0.04 - i * 0.022] });
    led(ctx, g, 'red', { at: [0.17, 0.058, -0.065], normal: [0, 0.98, 0.17], w: 0.004 });
    emblem(g, 0.02, [-0.16, 0.0605, -0.09], [-PI / 2 + 0.17, 0, 0]);
    // cassette / disk drive
    const dr = group('drive', { parent: g, at: [0.33, 0, 0] });
    slab(dr, beige, 0.17, 0.07, 0.24, { r: 0.008 });
    mesh(roundedBox(0.12, 0.004, 0.002, 0.001), T.port, { parent: dr, at: [0, 0.045, 0.121] });
    led(ctx, dr, 'red', { at: [0.06, 0.025, 0.1205], w: 0.004 });
    if (V.crt) buildMonitor(ctx, g, { crt: true, w: 0.3, h: 0.22, content: 'retro' }, { at: [0, 0, -0.38] });
    trimShell(ctx, g, w, 0.04, d);
    return [];
  }
  if (V.box) {
    const w = 0.42, d = 0.38;
    slab(g, beige, w, 0.13, d, { r: 0.01 });
    for (let i = 0; i < 2; i++) { mesh(roundedBox(0.15, 0.03, 0.004, 0.002), T.body2 === T.rubber ? T.dark : T.body2, { parent: g, at: [w * 0.2, 0.03 + i * 0.045, d / 2 + 0.001] }); mesh(roundedBox(0.1, 0.003, 0.003, 0.001), T.port, { parent: g, at: [w * 0.2, 0.034 + i * 0.045, d / 2 + 0.003] }); }
    led(ctx, g, 'green', { at: [-w * 0.35, 0.03, d / 2 + 0.0005], w: 0.005 });
    led(ctx, g, 'amber', { at: [-w * 0.3, 0.03, d / 2 + 0.0005], w: 0.005 });
    mesh(roundedBox(0.03, 0.02, 0.008, 0.003), T.dark, { parent: g, at: [-w * 0.4, 0.09, d / 2 + 0.003] });
    emblem(g, 0.025, [-w * 0.2, 0.09, d / 2 + 0.0008]);
    buildMonitor(ctx, g, { crt: true, w: 0.29, h: 0.22, content: 'retro' }, { at: [0, 0.13, -0.05] });
    buildKeyboard(ctx, g, { rows: 'full', case: 0.025 }, { at: [0, 0, 0.36] });
    trimShell(ctx, g, w, 0.13, d);
    return [];
  }
  if (V.compact) {
    const w = 0.25, h = 0.34, d = 0.28;
    mesh(roundedBox(w, h, d, 0.02), beige, { parent: g, at: [0, h / 2 + 0.01, 0] });
    slab(g, beige, w * 0.98, 0.012, d * 0.98, { r: 0.015 });
    mesh(roundedBox(0.2, 0.15, 0.004, 0.02), T.bezelMat, { parent: g, at: [0, h * 0.68, d / 2 + 0.0015] });
    screen(ctx, g, 0.17, 0.125, { at: [0, h * 0.68, d / 2 + 0.004], content: T.plain ? 'retro' : 'desktop' });
    mesh(roundedBox(0.09, 0.004, 0.004, 0.0015), T.port, { parent: g, at: [0.04, h * 0.3, d / 2 + 0.001] });
    emblem(g, 0.022, [-w * 0.3, h * 0.25, d / 2 + 0.0008]);
    for (let i = 0; i < 8; i++) mesh(roundedBox(0.004, 0.06, 0.002, 0.001), T.port, { parent: g, at: [-0.03 + i * 0.008, h * 0.75, -d / 2 - 0.0008] });
    buildKeyboard(ctx, g, { rows: 'sixty', case: 0.022 }, { at: [0, 0, 0.3] });
    buildMouse(ctx, g, MOUSE_VARIANTS.office, { at: [0.26, 0, 0.3] });
    return [];
  }
  if (V.luggable) {
    const w = 0.46, h = 0.22, d = 0.34;
    mesh(roundedBox(w, h, d, 0.015), beige, { parent: g, at: [0, h / 2, 0] });
    mesh(roundedBox(0.16, 0.12, 0.004, 0.008), T.bezelMat, { parent: g, at: [-0.12, h * 0.55, d / 2 + 0.0015] });
    screen(ctx, g, 0.13, 0.095, { at: [-0.12, h * 0.55, d / 2 + 0.004], content: 'retro' });
    for (let i = 0; i < 2; i++) mesh(roundedBox(0.14, 0.035, 0.004, 0.002), T.dark, { parent: g, at: [0.11, h * 0.35 + i * 0.06, d / 2 + 0.0015] });
    curveTube([[-0.1, h, 0], [-0.08, h + 0.04, 0], [0.08, h + 0.04, 0], [0.1, h, 0]], 0.009, T.rubber, { parent: g, segments: 24 });
    const k = group('kb', { parent: g, at: [0, 0.0, d / 2 + 0.09] });
    buildKeyboard(ctx, k, { rows: 'tkl', case: 0.02 });
    led(ctx, g, 'red', { at: [0.2, 0.03, d / 2 + 0.0005], w: 0.005 });
    emblem(g, 0.025, [0.2, h * 0.85, d / 2 + 0.0008]);
    trimShell(ctx, g, w, 0.04, d);
    return [];
  }
  // terminal: all-in-one amber screen + separate keyboard
  buildMonitor(ctx, g, { crt: true, w: 0.32, h: 0.24, content: 'retro' });
  buildKeyboard(ctx, g, { rows: 'full', case: 0.028 }, { at: [0, 0, 0.36] });
  return [];
});
