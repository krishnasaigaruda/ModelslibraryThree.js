// Space: rockets on pads, satellites on display cradles, capsules, rovers, telescopes,
// planet globes and astronaut helmets.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, cushion, setup, done, fin, body, frameMat, darkMat, glassMat, lamp, glowStrip, slab, rodY, rodX, rodZ, bar, labelPlane, panel, emblem, foot, hazard, canvasTex } from './common.js';
import { clip, spinTrack, rotateTrack, moveTrack, scaleTrack, pingPong, wave } from '../../core/animation.js';
import { lampTracks, LAMP_ON } from '../../core/lamps.js';

const solarDraw = (cells = 6, rows = 2, col = '#1b2f6b') => (c, w, h) => {
  c.fillStyle = '#c9ccd2'; c.fillRect(0, 0, w, h);
  const cw = w / cells, ch = h / rows;
  for (let i = 0; i < cells; i++) for (let j = 0; j < rows; j++) {
    c.fillStyle = col; c.fillRect(i * cw + 2, j * ch + 2, cw - 4, ch - 4);
    c.strokeStyle = 'rgba(200,220,255,0.35)'; c.lineWidth = 1;
    for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(i * cw + (k * cw) / 4, j * ch + 2); c.lineTo(i * cw + (k * cw) / 4, (j + 1) * ch - 2); c.stroke(); }
  }
};
/** Solar wing: thin panel (canvas cells) in the XZ… faces +Y when flat=true, else +Z. */
export function solarPanel(parent, w, h, { at = [0, 0, 0], rot = [0, 0, 0], cells = 6, rows = 2, col = '#1b2f6b', frame = M.metal('#c9ccd2', 0.3), th = 0.02, name } = {}) {
  const g = group(name ?? 'solar', { parent, at, rot });
  mesh(roundedBox(w, h, th, Math.min(th / 2.2, 0.01)), frame, { parent: g });
  const tex = canvasTex(512, Math.max(32, Math.round((512 * h) / w)), solarDraw(cells, rows, col));
  const cm = new THREE.MeshPhysicalMaterial({ name: 'solar-cells', color: tex ? '#ffffff' : col, map: tex, roughness: 0.18, metalness: 0.4, clearcoat: 1 });
  for (const s of [1, -1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.97, h * 0.95, Math.max(1, Math.round(w / 0.2)), Math.max(1, Math.round(h / 0.2))), s > 0 ? cm : M.matte('#d8d8d8')); f.position.z = s * (th / 2 + 0.0005); if (s < 0) f.rotation.y = Math.PI; g.add(f); }
  return g;
}

/* ================================ ROCKETS ================================ */

export const ROCKET_VARIANTS = {
  'classic-pad': { H: 58, R: 2.6, stages: 3, tower: true, p: '#f4f4f2', s: '#1b1b1d' },
  'heavy-booster': { H: 62, R: 2.6, boosters: 2, tower: true, p: '#f4f4f2', s: '#d8792b' },
  sounding: { H: 14, R: 0.6, rail: true, p: '#f4f4f2', s: '#d23b2a' },
  reusable: { H: 48, R: 1.85, legs: true, p: '#f4f4f2', s: '#2a2d33' },
  'capsule-stack': { H: 52, R: 2.0, lasTower: true, tower: true, p: '#f4f4f2', s: '#2a2d33' },
};

function rocketBody(T, parent, H, R, { stages = 2, nose = 'ogive', bands = [] } = {}) {
  const main = body(T, T.p);
  const acc = fin(T, T.trim ? T.s : T.s ?? '#1b1b1d');
  const g = group('rocket-body', { parent });
  const noseH = nose === 'capsule' ? R * 1.6 : R * 3;
  const cyl = H - noseH;
  // stages as lathe sections with interstage rings
  const per = cyl / stages;
  for (let i = 0; i < stages; i++) {
    const r0 = i === 0 ? R : R * (1 - i * 0.08);
    const y0 = i * per;
    mesh(new THREE.CylinderGeometry(r0, r0, per - (i < stages - 1 ? R * 0.15 : 0), 40, Math.max(1, Math.round(per / 4))), i % 2 && T.trim === 'vintage' ? acc : main, { parent: g, at: [0, y0 + per / 2 - (i < stages - 1 ? R * 0.075 : 0), 0] });
    if (i < stages - 1) mesh(new THREE.CylinderGeometry(R * (1 - (i + 1) * 0.08), r0, R * 0.15, 40), acc, { parent: g, at: [0, y0 + per - R * 0.075, 0] });
    // roll pattern band
    mesh(new THREE.CylinderGeometry(r0 + 0.01, r0 + 0.01, per * 0.12, 40, 1, true, 0, Math.PI / 2), acc, { parent: g, at: [0, y0 + per * 0.85 - (i < stages - 1 ? R * 0.15 : 0), 0] });
  }
  const rt = R * (1 - (stages - 1) * 0.08);
  const ny = cyl;
  if (nose === 'ogive') {
    const pts = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([Math.max(0.01, rt * Math.sqrt(1 - t * t * 0.98)), ny + t * noseH]); }
    pts.push([0, ny + noseH]);
    mesh(lathe(pts, 40), T.foil ? fin(T, '#d6a93c', 'gold') : main, { parent: g });
  }
  for (const b of bands) mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, b[1], 40, 1, true), acc, { parent: g, at: [0, b[0], 0] });
  return { g, top: ny, rt, noseH };
}
function engines(T, parent, R, n, y, name = 'engine') {
  const g = group(name, { parent, at: [0, y, 0] });
  const em = T.vintage ? M.metal('#5a4a3a', 0.5) : M.metal('#3a3d42', 0.4);
  const pos = n === 1 ? [[0, 0]] : Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * R * 0.5, Math.sin((i / n) * Math.PI * 2) * R * 0.5]);
  if (n > 4) pos.push([0, 0]);
  const nr = n === 1 ? R * 0.6 : R * 0.28;
  for (const [x, z] of pos) mesh(lathe([[nr * 0.4, 0], [nr * 0.45, -nr * 0.3], [nr, -nr * 1.6], [nr * 0.95, -nr * 1.62], [nr * 0.4, -nr * 0.35], [nr * 0.35, 0]], 24), em, { parent: g, at: [x, 0, z] });
  return { g, nr, pos };
}

export function createSpaceRocket(options = {}) {
  const { o, variant, T, V } = setup(options, ROCKET_VARIANTS, 'space-rocket');
  const root = group(`space-rocket-${variant}`);
  const kidsModel = T.kids;
  const sc = kidsModel ? (variant === 'sounding' ? 0.06 : 0.016) : 1;
  let { H, R } = V;
  if (kidsModel) { H *= sc; R *= sc; }
  const anims = [];
  // launch pad
  let padH = 0;
  if (kidsModel) {
    // classroom model rocket on launch rod + pad
    slab(root, M.plastic('#2a2d33', 0.5), 0.5, 0.03, 0.5, { r: 0.01 });
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.004, 24), M.metal('#9aa0a6', 0.4), { parent: root, at: [0, 0.032, 0] });
    rodY(0.03, 1.0, 0.0025, M.chrome(), root, { x: R + 0.0024 });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; bar([0, 0.02, 0], [Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35], 0.008, M.metal('#9aa0a6'), root); }
    padH = 0.12;
  } else if (V.rail) {
    slab(root, M.matte('#8d8f94', 0.9), 6, 0.4, 6, { r: 0.05 });
    const rf = M.metal('#b9bec6', 0.4);
    bar([V.R + 0.17, 0.4, 0], [V.R + 0.17, 16, 0], 0.18, rf, root);
    for (const z of [-0.8, 0.8]) bar([2.5, 0.4, z], [V.R + 0.2, 11, 0], 0.12, rf, root);
    padH = 1.2;
  } else {
    // concrete pad with flame trench
    mesh(roundedBox(V.H * 0.7, 3, V.H * 0.7, 0.4), M.matte('#9a9c9f', 0.9), { parent: root, at: [0, 1.5, 0] });
    slab(root, M.matte('#3a3a3c', 0.95), V.R * 4, 0.05, V.H * 0.36, { y: 3, z: V.H * 0.17, r: 0.02 });
    // hold-down mount ring
    mesh(new THREE.CylinderGeometry(R * 1.6, R * 1.9, 4, 32), M.metal('#6b6e74', 0.5), { parent: root, at: [0, 5, 0] });
    padH = 7;
    if (V.legs) padH = 3.0;
  }
  const rk = group('rocket', { parent: root, at: [0, padH, 0] });
  const lift = V.legs && !kidsModel ? R * 2.2 : 0;
  const b = rocketBody(T, rk, H - lift, R, { stages: V.stages ?? (variant === 'sounding' ? 2 : 2) });
  b.g.position.y = lift;
  const en = engines(T, rk, R, V.legs ? 9 : variant === 'sounding' ? 1 : 5, lift + 0.001);
  // engine flame (lights with 'launch')
  const fl = group('exhaust', { parent: rk, at: [0, lift - en.nr * 1.6, 0] });
  for (const [x, z] of en.pos) lamp(T, fl, 'amber', { geometry: new THREE.ConeGeometry(en.nr * 0.85, en.nr * 5, 16, 1, true).rotateX(Math.PI).translate(x, -en.nr * 2.5 + 0.02, z), glowSize: R * 3 });
  if (kidsModel) rk.position.y = 0.034 + en.nr * 1.62;
  else if (V.rail) rk.position.y = 0.4 + en.nr * 1.62;
  fl.scale.set(0.001, 0.001, 0.001);
  if (V.boosters) for (const s of [-1, 1]) {
    const bg = group(`booster${s}`, { parent: rk, at: [s * R * 1.95, 0, 0] });
    const bb = rocketBody({ ...T, p: T.trim ? T.p : V.p }, bg, H * 0.55, R * 0.7, { stages: 1 });
    mesh(new THREE.CylinderGeometry(R * 0.35, R * 0.35, R * 0.3, 16).rotateZ(Math.PI / 2), M.metal('#6b6e74'), { parent: bg, at: [-s * R * 0.95, H * 0.4, 0] });
    engines(T, bg, R * 0.7, 1, 0.001, `boosterEngine${s}`);
    void bb;
  }
  // fins
  const finN = variant === 'sounding' || kidsModel ? 4 : V.legs ? 0 : 4;
  for (let i = 0; i < finN; i++) {
    const a = (i / finN) * Math.PI * 2 + Math.PI / 4;
    const f = extrudeOutline([[0, 0], [R * 1.4, -R * 0.4], [R * 1.4, R * 0.4], [0, R * 2.6]], R * 0.08, { bevel: R * 0.02 });
    mesh(f, fin(T, T.s), { parent: rk, at: [Math.cos(a) * R * 0.98, R * 0.3, Math.sin(a) * R * 0.98], rot: [0, -a, 0] });
  }
  if (V.legs && !kidsModel) {
    // landing legs folded down + grid fins
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const c = Math.cos(a), s = Math.sin(a);
      bar([c * R * 0.95, lift + R * 3, s * R * 0.95], [c * R * 3.2, 0.3, s * R * 3.2], R * 0.12, M.metal('#2a2d33', 0.4), rk);
      bar([c * R * 0.95, lift + R * 0.3, s * R * 0.95], [c * R * 2.6, 1.4, s * R * 2.6], R * 0.07, M.metal('#6b6e74', 0.4), rk);
      mesh(new THREE.CylinderGeometry(R * 0.4, R * 0.5, 0.3, 16), M.metal('#2a2d33'), { parent: rk, at: [c * R * 3.2, 0.15, s * R * 3.2] });
      slab(rk, M.metal('#3a3d42', 0.5), R * 0.9, R * 0.9, 0.1, { x: c * (R + 0.04), y: H - b.noseH - R * 2, z: s * (R + 0.04), r: 0.03 });
      rk.children[rk.children.length - 1].rotation.y = -a + Math.PI / 2;
    }
    // landing pad target
    mesh(new THREE.CylinderGeometry(R * 4.5, R * 4.5, 3, 40), M.matte('#7d7f83', 0.9), { parent: root, at: [0, 1.5, 0] });
    mesh(new THREE.TorusGeometry(R * 3.4, 0.25, 8, 48).rotateX(Math.PI / 2), M.matte('#f2f2ee'), { parent: root, at: [0, 3, 0] });
  }
  if (V.lasTower) {
    const lt = group('escape-tower', { parent: rk, at: [0, H - b.noseH * 0.2, 0] });
    mesh(new THREE.ConeGeometry(R * 0.55, R * 1.2, 24), body(T, '#e9e9e6'), { parent: lt, at: [0, R * 0.4, 0] });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; bar([Math.cos(a) * R * 0.35, R * 0.8, Math.sin(a) * R * 0.35], [0, R * 2.6, 0], R * 0.05, fin(T, '#d23b2a', 'paint'), lt); }
    rodY(R * 2.5, R * 4.5, R * 0.18, fin(T, '#d23b2a', 'paint'), lt);
  }
  // service tower with access arms
  if (V.tower && !kidsModel) {
    const tw = group('tower', { parent: root, at: [R * 3.6, 3, 0] });
    const tm = fin(T, T.trim === 'arctic' ? '#3d6ea8' : T.trim === 'futuristic' ? '#2a2f3a' : '#c7362b', 'paint');
    const TH = H + padH;
    const tsz = 3.2;
    for (const x of [-1, 1]) for (const z of [-1, 1]) bar([x * tsz / 2, 0, z * tsz / 2], [x * tsz / 2, TH, z * tsz / 2], 0.18, tm, tw);
    for (let y = 4; y < TH; y += 4) {
      for (const z of [-1, 1]) { bar([-tsz / 2, y, z * tsz / 2], [tsz / 2, y, z * tsz / 2], 0.1, tm, tw); bar([-tsz / 2, y - 4, z * tsz / 2], [tsz / 2, y, z * tsz / 2], 0.07, tm, tw); }
      for (const x of [-1, 1]) bar([x * tsz / 2, y, -tsz / 2], [x * tsz / 2, y, tsz / 2], 0.1, tm, tw);
    }
    // access arms touching the rocket
    for (const y of [TH * 0.45, TH * 0.82]) {
      const arm = group(`arm${Math.round(y)}`, { parent: tw, at: [-tsz / 2, y, 0] });
      slab(arm, tm, R * 3.1 - tsz / 2, 0.6, 1.4, { x: -(R * 3.1 - tsz / 2) / 2, y: -0.3, r: 0.1 });
    }
    slab(tw, tm, tsz + 0.4, 0.3, tsz + 0.4, { y: TH - 0.15, r: 0.05 });
    lamp(T, tw, 'red', { at: [0, TH + 0.15, 0], normal: [0, 1, 0], w: 0.5, h: 0.5, shape: 'round', glowSize: 3 });
    anims.push(clip('arms', 4, tw.children.filter((c) => c.name.startsWith('arm')).map((a) => rotateTrack(a, 'y', 4, (t) => -1.2 * pingPong(t)))));
  }
  // insignia
  const flagW = Math.max(R * 1.2, 0.03);
  const ins = labelPlane(flagW, flagW * 0.4, (c, w, h) => { c.fillStyle = T.trim === 'futuristic' ? '#16191f' : '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = T.trim === 'futuristic' ? '#22e1ff' : '#1b1b1d'; c.font = `bold ${h * 0.7}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ORBIX', w / 2, h / 2); }, { bg: '#ffffff' });
  ins.position.set(0, lift + (H - lift) * 0.2, R + 0.004 * (kidsModel ? 0.05 : 1));
  rk.add(ins);
  emblem(rk, R * 0.6, [0, lift + (H - lift) * 0.27, R + R * 0.03]);
  if (T.trim === 'futuristic') glowStrip(T, rk, Array.from({ length: 9 }, (_, i) => [Math.cos(i * 0.4) * (R + 0.01), lift + H * 0.3 + i * 0.01, Math.sin(i * 0.4) * (R + 0.01)]), Math.max(0.002, R * 0.04), 'blue');
  const tracks = lampTracks('space-rocket_amber', 4, { glow: 1 });
  anims.push(clip('launch', 6, [scaleTrack(fl, 6, (t) => { const k = t < 0.1 ? 0.001 : 1 + 0.1 * wave(t, 20); return [k * 1000, k * 1000, k * 1000]; }), moveTrack(rk, 6, (t) => [0, t < 0.25 ? 0 : (t - 0.25) ** 2 * H * 2, 0]), ...tracks]));
  return done(root, T, variant, o, anims);
}

/* =============================== SATELLITES =============================== */

export const SATELLITE_VARIANTS = { comms: {}, weather: {}, cubesat: {}, 'space-telescope': {}, probe: {} };

function cradle(T, parent, h, w) {
  // clean-room display stand: base plate + pedestal + adapter ring
  const m = fin(T, T.trim === 'vintage' ? '#6b4426' : '#3a3f47', T.trim === 'vintage' ? 'wood' : 'paint');
  mesh(new THREE.CylinderGeometry(w * 0.55, w * 0.6, w * 0.08, 40), m, { parent, at: [0, w * 0.04, 0] });
  rodY(w * 0.08, h, w * 0.08, M.metal('#b9bec6', 0.3), parent);
  mesh(new THREE.CylinderGeometry(w * 0.18, w * 0.12, w * 0.08, 32), M.metal('#9aa0a6', 0.3), { parent, at: [0, h, 0] });
  const plate = labelPlane(w * 0.4, w * 0.08, (c, W, H) => { c.fillStyle = '#d6b45a'; c.fillRect(0, 0, W, H); c.fillStyle = '#2b211a'; c.font = `bold ${H * 0.6}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ORBIX SAT-1', W / 2, H / 2); }, { bg: '#d6b45a' });
  plate.position.set(0, w * 0.04, w * 0.6 - w * 0.025 + 0.002); plate.rotation.x = -0.06; parent.add(plate);
  return h + w * 0.04;
}

export function createSpaceSatellite(options = {}) {
  const { o, variant, T } = setup(options, SATELLITE_VARIANTS, 'space-satellite', { p: '#d6a93c' });
  const root = group(`space-satellite-${variant}`);
  const foil = T.trim === 'arctic' ? fin(T, '#f2f4f7', 'foil') : T.trim === 'futuristic' ? fin(T, '#1d2129', 'carbon') : T.trim === 'school' ? fin(T, '#ffc81e', 'plastic') : T.trim === 'vintage' ? M.metal('#c9ccd2', 0.25) : T.trim === 'research' ? fin(T, '#e9e6df', 'foil') : fin(T, '#d6a93c', 'foil');
  const cellCol = T.trim === 'futuristic' ? '#0b1022' : T.trim === 'vintage' ? '#2b2440' : '#1b2f6b';
  const anims = [];
  const S = variant === 'cubesat' ? 0.3 : variant === 'space-telescope' ? 2.2 : 1.6; // display scale (m)
  const topY = cradle(T, root, S * 0.8, S * 0.9);
  const sat = group('satellite', { parent: root, at: [0, topY, 0] });
  const wings = [];
  if (variant === 'cubesat') {
    const u = 0.1;
    slab(sat, foil, u, u * 3, u, { r: 0.004 });
    for (const x of [-1, 1]) for (const z of [-1, 1]) rodY(0, u * 3, 0.004, M.metal('#c9ccd2'), sat, { x: x * u / 2, z: z * u / 2 });
    for (const s of [-1, 1]) { const w = group(`wing${s}`, { parent: sat, at: [s * (u / 2 + 0.002), u * 1.5, 0] }); solarPanel(w, u * 3, u * 0.95, { at: [s * u * 1.5, 0, 0], rot: [-Math.PI / 2, 0, 0], th: 0.004, col: cellCol }); wings.push(w); }
    rodY(u * 3, u * 3 + 0.18, 0.0015, M.metal('#c9ccd2'), sat, { x: 0.03 });
  } else if (variant === 'space-telescope') {
    const L = S * 1.6, R = S * 0.32;
    const tube = group('tube', { parent: sat, at: [0, R, 0], rot: [0, 0, Math.PI / 2] });
    mesh(new THREE.CylinderGeometry(R, R, L, 40, 4), M.metal('#d9dbe0', 0.25), { parent: tube });
    mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.05, L * 0.3, 8), foil, { parent: tube, at: [0, -L * 0.3, 0] });
    const lid = group('aperture-door', { parent: tube, at: [R, L / 2, 0] });
    mesh(new THREE.CylinderGeometry(R, R, 0.04, 32), M.metal('#c9ccd2', 0.3), { parent: lid, at: [-R, 0.02, 0] });
    for (const s of [-1, 1]) { const w = group(`wing${s}`, { parent: sat, at: [0, R, s * R] }); solarPanel(w, L * 0.45, R * 1.4, { at: [0, 0, s * R * 0.75], rot: [-Math.PI / 2, 0, 0], col: cellCol, th: 0.03 }); wings.push(w); }
    anims.push(clip('open', 3, [rotateTrack(lid, 'z', 3, (t) => -1.6 * pingPong(t))]));
  } else {
    const W = S * 0.5;
    const round = variant === 'weather' || variant === 'probe';
    if (round) mesh(new THREE.CylinderGeometry(W * 0.55, W * 0.55, W, 8), foil, { parent: sat, at: [0, W / 2, 0] });
    else slab(sat, foil, W, W * 1.1, W, { r: 0.03 });
    // panel wings on yokes
    const nW = variant === 'probe' ? 0 : variant === 'weather' ? 1 : 2;
    for (let i = 0; i < nW; i++) {
      const s = i ? -1 : 1;
      const w = group(`wing${s}`, { parent: sat, at: [s * W * (round ? 0.55 : 0.5), W * 0.55, 0] });
      rodX(0, s * W * 0.35, 0.02, M.metal('#c9ccd2'), w);
      for (let k = 0; k < 3; k++) solarPanel(w, W * 0.9, W * 0.8, { at: [s * (W * 0.35 + W * 0.45 + k * W * 0.895), 0, 0], rot: [0, 0, 0], col: cellCol, th: 0.025 });
      wings.push(w);
    }
    // dish antenna
    const dishR = variant === 'probe' ? W * 0.95 : W * 0.35;
    const dish = group('dish', { parent: sat, at: [0, W * (round ? 1 : 1.1), 0] });
    rodY(0, dishR * 0.35, 0.03, M.metal('#c9ccd2'), dish);
    const prof = []; for (let i = 0; i <= 10; i++) { const r = (i / 10) * dishR; prof.push([r, dishR * 0.35 + (r * r) / (dishR * 2.4)]); }
    for (let i = 10; i >= 0; i--) { const r = (i / 10) * dishR; prof.push([r, dishR * 0.35 + (r * r) / (dishR * 2.4) - 0.012]); }
    mesh(lathe(prof, 40), fin(T, '#f2f2ee', 'gloss'), { parent: dish });
    rodY(dishR * 0.35, dishR * 0.95, 0.012, M.metal('#c9ccd2'), dish);
    if (variant === 'probe') { bar([0, W * 0.4, 0], [W * 1.4, W * 0.2, 0], 0.025, M.metal('#c9ccd2'), sat); mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12).rotateZ(Math.PI / 2), M.metal('#3a3d42', 0.5), { parent: sat, at: [W * 1.45, W * 0.2, 0] }); bar([0, W * 0.6, 0], [-W * 1.6, W * 0.6, 0], 0.01, M.metal('#c9ccd2'), sat); }
    if (variant === 'weather') { mesh(new THREE.CylinderGeometry(W * 0.2, W * 0.3, W * 0.3, 24), M.metal('#3a3d42', 0.3), { parent: sat, at: [0, -0.0, W * 0.55 + W * 0.0] }); sat.children[sat.children.length - 1].rotation.x = Math.PI / 2; sat.children[sat.children.length - 1].position.set(0, W * 0.5, W * 0.6); }
    anims.push(clip('scan', 6, [rotateTrack(dish, 'y', 6, (t) => 0.8 * wave(t))]));
  }
  if (T.trim === 'futuristic') glowStrip(T, sat, variant === 'cubesat' ? [[-0.04, 0.02, 0.051], [0.04, 0.02, 0.051]] : [[-0.05 * S, 0.02, S * 0.255], [0.05 * S, 0.02, S * 0.255]], 0.004 * S);
  lamp(T, sat, 'green', { at: [0, S * 0.02, (variant === 'cubesat' ? 0.05 : variant === 'space-telescope' ? 0 : S * 0.25)], w: 0.01 * S, h: 0.01 * S, shape: 'round' });
  anims.push(clip('deploy', 3, wings.map((w) => rotateTrack(w, 'x', 3, (t) => (Math.PI / 2) * pingPong(t)))));
  return done(root, T, variant, o, anims);
}

/* ================================ CAPSULES ================================ */

export const CAPSULE_VARIANTS = { 'cone-3seat': {}, 'landed-chute': {}, 'crew-modern': {}, 'gumdrop-small': {}, 'lunar-lander': {} };

export function createSpaceCapsule(options = {}) {
  const { o, variant, T } = setup(options, CAPSULE_VARIANTS, 'space-capsule', { p: '#d9dbe0', s: '#2a2d33' });
  const root = group(`space-capsule-${variant}`);
  const shell = T.trim === 'gold-foil' ? fin(T, '#d6a93c', 'foil') : T.trim === 'weathered' ? fin(T, '#6b5e4e', 'matte') : T.trim === 'vintage' ? M.metal('#8a8f96', 0.35) : body(T, T.trim ? T.p : '#d9dbe0');
  const heat = fin(T, T.trim === 'weathered' ? '#3a2a1c' : '#5a4632', 'matte');
  const anims = [];
  if (variant === 'lunar-lander') {
    const g = group('lander', { parent: root });
    const fm = fin(T, '#d6a93c', 'foil');
    const dh = 1.6;
    // descent stage octagon + legs + footpads
    mesh(new THREE.CylinderGeometry(2.1, 2.1, 1.5, 8), T.trim === 'arctic' ? fin(T, '#f2f4f7', 'foil') : fm, { parent: g, at: [0, dh + 0.75, 0] });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
      bar([c * 1.9, dh + 1.2, s * 1.9], [c * 4, 0.15, s * 4], 0.12, M.metal('#c9ccd2'), g);
      bar([c * 2, dh, s * 2], [c * 3.4, 0.6, s * 3.4], 0.08, M.metal('#c9ccd2'), g);
      mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.2, 20), M.metal('#c9ccd2'), { parent: g, at: [c * 4, 0.1, s * 4] });
    }
    // ascent stage
    const asc = group('ascent', { parent: g, at: [0, dh + 1.5, 0] });
    mesh(cushion(3, 2.2, 2.6, { radius: 0.5, bulge: 0.1 }), shell, { parent: asc, at: [0, 1.1, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CircleGeometry(0.28, 3), M.glass(), { parent: asc, at: [s * 0.6, 1.5, 1.31] });
    mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16), shell, { parent: asc, at: [0, 2.4, 0] });
    rodY(2.2, 3.4, 0.03, M.metal('#c9ccd2'), asc, { x: 1 });
    mesh(new THREE.ConeGeometry(0.7, 0.9, 20, 1, true), M.metal('#3a3d42'), { parent: g, at: [0, dh - 0.4, 0] });
    slab(g, M.metal('#c9ccd2'), 0.8, 0.06, 1.2, { y: dh - 0.2, z: 2.2, r: 0.02 });
    for (const x of [-0.3, 0.3]) bar([x, dh - 0.2, 2.6], [x, 0.0, 3.5], 0.04, M.metal('#c9ccd2'), g);
    for (let i = 1; i < 6; i++) { const t = i / 6; rodX(-0.3, 0.3, 0.025, M.metal('#c9ccd2'), g, { y: (dh - 0.2) * (1 - t), z: 2.6 + 0.9 * t }); }
    emblem(asc, 0.4, [-0.9, 0.9, 1.31]);
    return done(root, T, variant, o, [clip('liftoff', 4, [moveTrack(asc, 4, (t) => [0, t < 0.3 ? 0 : (t - 0.3) * 3, 0])])]);
  }
  const R = variant === 'gumdrop-small' ? 1.0 : variant === 'crew-modern' ? 2.0 : 1.95;
  const Hc = variant === 'gumdrop-small' ? 1.8 : 3.2;
  const cap = group('capsule', { parent: root, at: [0, variant === 'cone-3seat' ? 1.1 : 0.35, 0], rot: [variant === 'landed-chute' ? 0.12 : 0, 0, 0] });
  // heat shield (slightly domed) + conical body
  mesh(lathe([[0, 0], [R * 0.5, 0.06], [R, 0.25], [R * 1.01, 0.35], [0, 0.35]], 48), heat, { parent: cap });
  const rTop = variant === 'gumdrop-small' ? R * 0.42 : R * 0.33;
  const prof = [[R, 0.34], [R * 0.98, 0.5], [rTop * 1.1, Hc], [rTop, Hc + 0.15], [0, Hc + 0.18]];
  mesh(lathe(prof, 48), shell, { parent: cap });
  // hatch, windows, RCS quads
  const ang = Math.atan2(R - rTop, Hc);
  const atH = (h) => R - (R - rTop) * (h / Hc);
  const hatch = group('hatch', { parent: cap, at: [0, Hc * 0.45, atH(Hc * 0.45)], rot: [ang, 0, 0] });
  mesh(roundedBox(R * 0.55, R * 0.55, 0.06, 0.08), body(T, T.trim === 'futuristic' ? '#262b36' : '#bfc3c8'), { parent: hatch });
  mesh(new THREE.CylinderGeometry(R * 0.08, R * 0.08, 0.04, 16).rotateX(Math.PI / 2), M.glass(), { parent: hatch, at: [0, R * 0.1, 0.03] });
  for (const s of [-1, 1]) { const wg = group('window', { parent: cap, at: [Math.sin(s * 0.6) * atH(Hc * 0.6), Hc * 0.6, Math.cos(s * 0.6) * atH(Hc * 0.6)], rot: [ang, s * 0.6, 0] }); mesh(roundedBox(R * 0.22, R * 0.2, 0.06, 0.04), M.glass({ tint: '#1a2a3a' }), { parent: wg }); }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; mesh(roundedBox(0.25, 0.25, 0.12, 0.03), M.metal('#3a3d42'), { parent: cap, at: [Math.cos(a) * atH(Hc * 0.75), Hc * 0.75, Math.sin(a) * atH(Hc * 0.75)], rot: [0, -a + Math.PI / 2, 0] }); }
  emblem(cap, R * 0.3, [0, Hc * 0.25, atH(Hc * 0.25) + 0.02]);
  cap.children[cap.children.length - 1].rotation.x = ang;
  if (variant === 'crew-modern') {
    // trunk below with body-mounted solar
    mesh(new THREE.CylinderGeometry(R, R, 0.0, 48), shell, { parent: root });
    cap.position.y = 2.4;
    mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.05, 2.4, 48, 3), body(T, T.trim ? T.p : '#f2f2ee'), { parent: root, at: [0, 1.2, 0] });
    mesh(new THREE.CylinderGeometry(R * 1.06, R * 1.06, 1.4, 48, 2, true, 0, Math.PI), M.metal('#1b2f6b', 0.3), { parent: root, at: [0, 1.2, 0] });
    const nc = group('nosecone', { parent: cap, at: [0, Hc + 0.18, -rTop] });
    mesh(new THREE.SphereGeometry(rTop * 1.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.6, 1), shell, { parent: nc, at: [0, 0, rTop] });
    anims.push(clip('open', 3, [rotateTrack(nc, 'x', 3, (t) => -1.8 * pingPong(t))]));
  }
  if (variant === 'cone-3seat') {
    // museum dolly
    const dm = fin(T, T.trim === 'vintage' ? '#6b4426' : '#2a2d33', T.trim === 'vintage' ? 'wood' : 'paint');
    mesh(new THREE.TorusGeometry(R * 0.7, 0.12, 10, 40).rotateX(Math.PI / 2), dm, { parent: root, at: [0, 1.0, 0] });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; bar([Math.cos(a) * R * 0.7, 1.0, Math.sin(a) * R * 0.7], [Math.cos(a) * R, 0.1, Math.sin(a) * R], 0.1, dm, root); foot(root, M.rubber(), Math.cos(a) * R, Math.sin(a) * R, 0.2, 0.15); }
  }
  if (variant === 'landed-chute') {
    // deflated parachute draped beside, flotation collar
    const chute = new THREE.SphereGeometry(3.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const p = chute.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i); const a = Math.atan2(z, x); p.setXYZ(i, x * 1.2 + 5, y * 0.12 + 0.05 + Math.abs(Math.sin(a * 6)) * 0.12, z); }
    chute.computeVertexNormals();
    const cm = fin(T, '#e8792b', 'fabric');
    cm.side = THREE.DoubleSide;
    const vc = mesh(chute, cm, { parent: root });
    vc.name = 'parachute';
    for (let i = 0; i < 6; i++) curveTube([[0, Hc + 0.4, 0], [1.5, Hc * 0.6, (i - 2.5) * 0.4], [5 - 3.2 * 1.2 + 0.2, 0.15, (i - 2.5) * 0.9]], 0.02, M.matte('#f2f2ee'), { parent: root });
    mesh(new THREE.TorusGeometry(R * 1.02, 0.3, 12, 40).rotateX(Math.PI / 2), fin(T, '#f2b705', 'rubber'), { parent: cap, at: [0, 0.45, 0] });
  }
  if (variant === 'gumdrop-small') {
    // retro-rocket pack on the heat shield + recovery cradle
    mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.5, 0.3, 24), M.metal('#3a3d42'), { parent: root, at: [0, 0.2, 0] });
  }
  if (T.trim === 'futuristic') glowStrip(T, cap, Array.from({ length: 13 }, (_, i) => [Math.cos(i * 0.52) * R * 1.0, 0.36, Math.sin(i * 0.52) * R * 1.0]), 0.03);
  return done(root, T, variant, o, anims);
}

/* ================================= ROVERS ================================= */

export const ROVER_VARIANTS = { 'lunar-buggy': {}, 'mars-6wheel': {}, 'mini-rover': {}, 'pressurised': {} };

export function createSpaceRover(options = {}) {
  const { o, variant, T } = setup(options, ROVER_VARIANTS, 'space-rover', { p: '#e9e6df', s: '#3a3f47' });
  const root = group(`space-rover-${variant}`);
  const bm = T.trim === 'gold-foil' ? fin(T, '#d6a93c', 'foil') : body(T, T.trim ? T.p : '#e9e6df');
  const dk = darkMat(T);
  const wheels = [];
  const mars = variant === 'mars-6wheel', mini = variant === 'mini-rover', buggy = variant === 'lunar-buggy', press = variant === 'pressurised';
  const sc = mini ? 0.25 : 1;
  const wr = (mars ? 0.26 : buggy ? 0.41 : press ? 0.6 : 0.26) * (mini ? 0.5 : 1);
  const L = (mars ? 3 : buggy ? 3.1 : press ? 5.5 : 1.2) * (mini ? 0.5 : 1), W = (mars ? 2.7 : buggy ? 2.3 : press ? 3.4 : 1) * (mini ? 0.5 : 1);
  const xs = mars || press ? [-L * 0.42, 0, L * 0.42] : [-L * 0.4, L * 0.4];
  const deckY = wr * (mars ? 3 : 1.6);
  const wm = buggy ? M.metal('#b9bec6', 0.35) : fin(T, '#8d939c', 'metal');
  for (const x of xs) for (const s of [-1, 1]) {
    const wg = group(`wheel${wheels.length}`, { parent: root, at: [x, wr, s * W / 2] });
    if (buggy) { // wire-mesh tyre with chevrons
      mesh(new THREE.TorusGeometry(wr * 0.82, wr * 0.18, 12, 32), wm, { parent: wg });
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; mesh(roundedBox(0.03, 0.1, 0.22, 0.01), M.metal('#c9a24a', 0.3), { parent: wg, at: [Math.cos(a) * wr * 0.97, Math.sin(a) * wr * 0.97, 0], rot: [0, 0, a] }); }
      mesh(new THREE.CylinderGeometry(wr * 0.3, wr * 0.3, 0.2, 16).rotateX(Math.PI / 2), dk, { parent: wg });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; bar([0, 0, 0], [Math.cos(a) * wr * 0.7, Math.sin(a) * wr * 0.7, 0], 0.012, wm, wg); }
    } else {
      mesh(new THREE.CylinderGeometry(wr, wr, wr * 0.9, 24).rotateX(Math.PI / 2), wm, { parent: wg });
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; mesh(roundedBox(wr * 0.08, wr * 0.06, wr * 0.9, 0.005), dk, { parent: wg, at: [Math.cos(a) * wr, Math.sin(a) * wr, 0], rot: [0, 0, a] }); }
    }
    wheels.push(wg);
    // suspension strut to deck
    bar([x, wr, s * (W / 2 - (buggy ? 0.08 : wr * 0.3))], [x * (mars ? 0.8 : 1), deckY, s * W * (mars ? 0.25 : 0.29)], wr * 0.08 + 0.01 * sc, frameMat(T), root);
  }
  if (mars) { for (const s of [-1, 1]) bar([-L * 0.42, wr * 2.2, s * W * 0.42], [L * 0.42, wr * 2.2, s * W * 0.42], 0.04, frameMat(T), root); for (const s of [-1, 1]) for (const x of xs) bar([x, wr, s * (W / 2 - wr * 0.3)], [x, wr * 2.2, s * W * 0.42], 0.035, frameMat(T), root); }
  // chassis / body
  if (press) {
    mesh(cushion(L * 0.85, 2.2, W * 0.8, { radius: 0.6, bulge: 0.08 }), bm, { parent: root, at: [0, deckY + 1.1, 0] });
    mesh(new THREE.SphereGeometry(1.1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-Math.PI / 2).scale(0.7, 0.9, 1.1), M.glass({ tint: '#1a2a3a' }), { parent: root, at: [L * 0.42, deckY + 1.2, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.2, 24).rotateX(Math.PI / 2), dk, { parent: root, at: [-L * 0.2, deckY + 1.2, s * W * 0.4 + s * 0.08] });
    lamp(T, root, 'white', { at: [L * 0.425 + 0.02, deckY + 0.4, -W * 0.25], normal: [1, 0, 0], w: 0.2, h: 0.1 });
    lamp(T, root, 'white', { at: [L * 0.425 + 0.02, deckY + 0.4, W * 0.25], normal: [1, 0, 0], w: 0.2, h: 0.1 });
  } else if (buggy) {
    slab(root, M.metal('#b9bec6', 0.4), L * 0.9, 0.08, W * 0.7, { y: deckY - 0.04, r: 0.02 });
    for (const x of [-0.25, 0.45]) {
      // seats
      slab(root, M.fabric(T.trim === 'arctic' ? '#3d6ea8' : '#5a6068'), 0.5, 0.06, 0.5, { x: x - 0.1, y: deckY + 0.04, z: 0.3, r: 0.02 });
      slab(root, M.fabric(T.trim === 'arctic' ? '#3d6ea8' : '#5a6068'), 0.5, 0.06, 0.5, { x: x - 0.1, y: deckY + 0.04, z: -0.3, r: 0.02 });
    }
    for (const z of [-0.3, 0.3]) bar([0.12, deckY + 0.06, z], [0.05, deckY + 0.55, z], 0.02, M.metal('#b9bec6'), root);
    // console + umbrella antenna
    slab(root, dk, 0.3, 0.35, 0.3, { x: 0.9, y: deckY, r: 0.03 });
    rodY(deckY + 0.35, deckY + 1.3, 0.02, M.metal('#c9ccd2'), root, { x: 0.9 });
    const prof = []; for (let i = 0; i <= 8; i++) { const r = (i / 8) * 0.45; prof.push([r, (r * r) / 0.9]); } for (let i = 8; i >= 0; i--) { const r = (i / 8) * 0.45; prof.push([r, (r * r) / 0.9 - 0.01]); }
    mesh(lathe(prof, 24), M.metal('#e9e6df', 0.3), { parent: root, at: [0.9, deckY + 1.3, 0] });
    for (const s of [-1, 1]) for (const x of [-1, 1]) mesh(new THREE.SphereGeometry(wr * 1.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.4, 0.6), fin(T, T.trim ? T.p : '#bfa169', 'matte'), { parent: root, at: [x * L * 0.4, wr * 1.75, s * W / 2] });
  } else {
    slab(root, bm, L * 0.8, deckY * (mini ? 0.6 : 0.35), W * 0.6, { y: deckY - 0.02, r: 0.05 * sc + 0.005 });
    const top = deckY + deckY * (mini ? 0.6 : 0.35) - 0.02;
    // mast with camera head
    const mast = group('mast', { parent: root, at: [L * 0.28, top, W * 0.18] });
    rodY(0, 1.6 * sc + (mini ? 0.2 : 0), 0.05 * sc + 0.006, frameMat(T), mast);
    slab(mast, bm, 0.45 * sc + 0.06, 0.2 * sc + 0.03, 0.2 * sc + 0.03, { y: 1.6 * sc + (mini ? 0.2 : 0), r: 0.02 * sc + 0.003 });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.04 * sc + 0.006, 0.04 * sc + 0.006, 0.06 * sc + 0.01, 16).rotateX(Math.PI / 2), M.glass({ tint: '#0a1420' }), { parent: mast, at: [0.1 * sc + 0.03, 1.6 * sc + (mini ? 0.2 : 0) + 0.1 * sc + 0.015, s * (0.1 * sc + 0.02)] });
    // RTG / solar deck
    if (mars) { bar([-L * 0.35, top, 0], [-L * 0.6, top + 0.4, 0], 0.15, M.metal('#3a3d42'), root); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; slab(root, M.metal('#2a2d33'), 0.02, 0.4, 0.15, { x: -L * 0.5 + Math.cos(a) * 0.15, y: top + 0.1, z: Math.sin(a) * 0.15, r: 0.005 }); } }
    else solarPanel(root, L * 0.85, W * 0.7, { at: [0, top + 0.012 * sc + 0.003, 0], rot: [-Math.PI / 2, 0, 0], th: 0.02 * sc + 0.004, col: T.trim === 'futuristic' ? '#0b1022' : '#1b2f6b' });
    // robotic arm folded at the front
    const arm = group('arm', { parent: root, at: [L * 0.4, deckY + 0.05, 0] });
    bar([0, 0, 0], [0.4 * sc + 0.05, 0.2 * sc, 0], 0.035 * sc + 0.005, frameMat(T), arm);
    bar([0.4 * sc + 0.05, 0.2 * sc, 0], [0.55 * sc + 0.06, -0.15 * sc, 0], 0.03 * sc + 0.005, frameMat(T), arm);
    mesh(new THREE.SphereGeometry(0.06 * sc + 0.01, 12, 8), dk, { parent: arm, at: [0.55 * sc + 0.06, -0.15 * sc, 0] });
    if (mars) mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 8), M.metal('#c9ccd2'), { parent: root, at: [-L * 0.2, top + 0.9, -W * 0.2] });
  }
  emblem(root, mini ? 0.08 : 0.25, [0, deckY + (buggy ? -0.04 : press ? 0.8 : deckY * (mini ? 0.3 : 0.17) - 0.02), (buggy ? W * 0.35 + 0.0 : press ? W * 0.4 : W * 0.3) + (press ? 0.06 : 0.012)]);
  if (T.trim === 'futuristic') glowStrip(T, root, [[-L * 0.38, deckY + 0.02, W * 0.3 + 0.01], [L * 0.38, deckY + 0.02, W * 0.3 + 0.01]], 0.015 * (mini ? 0.5 : 1));
  return done(root, T, variant, o, [clip('drive', 1.2, wheels.map((w) => spinTrack(w, 'z', 1.2, -1)))]);
}

/* =============================== TELESCOPES =============================== */

export const TELESCOPE_VARIANTS = { refractor: {}, dobsonian: {}, 'observatory-dome': {}, 'radio-dish': {}, 'binocular-mount': {} };

function tripod(T, parent, h, spread) {
  const m = T.vintage ? M.wood('#7a4e2c') : frameMat(T);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; bar([Math.cos(a) * 0.05, h, Math.sin(a) * 0.05], [Math.cos(a) * spread, 0.01, Math.sin(a) * spread], 0.018, m, parent); foot(parent, M.rubber(), Math.cos(a) * spread, Math.sin(a) * spread, 0.02, 0.02); }
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 24), darkMat(T), { parent, at: [0, h, 0] });
  // accessory tray
  mesh(new THREE.CylinderGeometry(spread * 0.45, spread * 0.45, 0.01, 3), darkMat(T), { parent, at: [0, h * 0.45, 0] });
}

export function createSpaceTelescope(options = {}) {
  const { o, variant, T } = setup(options, TELESCOPE_VARIANTS, 'space-telescope', { p: '#f2f3f5', s: '#2a2d33' });
  const root = group(`space-telescope-${variant}`);
  const tubeM = T.vintage ? fin(T, '#c9a24a', 'brass') : T.trim === 'gold-foil' ? fin(T, '#d6a93c', 'foil') : body(T, T.trim ? T.p : variant === 'dobsonian' ? '#1d2129' : '#f2f3f5');
  const dk = darkMat(T);
  const anims = [];
  if (variant === 'refractor' || variant === 'binocular-mount') {
    tripod(T, root, 1.0, 0.55);
    const head = group('mount', { parent: root, at: [0, 1.03, 0] });
    slab(head, dk, 0.1, 0.12, 0.08, { r: 0.015 });
    const tube = group('tube', { parent: head, at: [0, 0.16, 0], rot: [0, 0, 0.5] });
    if (variant === 'refractor') {
      const L = T.vintage ? 1.3 : 1.0;
      mesh(new THREE.CylinderGeometry(0.05, 0.045, L, 32), tubeM, { parent: tube, at: [0.0, 0, 0], rot: [0, 0, -Math.PI / 2] });
      mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.2, 32, 1, true), dk, { parent: tube, at: [L / 2 + 0.05, 0, 0], rot: [0, 0, -Math.PI / 2] });
      mesh(new THREE.CircleGeometry(0.05, 32), M.glass({ tint: '#2a3c55' }), { parent: tube, at: [L / 2 - 0.04, 0, 0], rot: [0, Math.PI / 2, 0] });
      rodX(-L / 2 - 0.1, -L / 2, 0.018, dk, tube);
      mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.08, 16), dk, { parent: tube, at: [-L / 2 - 0.1, 0.04, 0] });
      // finder scope
      rodX(L * 0.05, L * 0.35, 0.016, dk, tube, { y: 0.075 });
      for (const x of [0.1, 0.3]) mesh(roundedBox(0.02, 0.03, 0.02, 0.005), dk, { parent: tube, at: [x * L, 0.055, 0] });
      for (const x of [-0.15, 0.15]) mesh(new THREE.TorusGeometry(0.056, 0.008, 8, 24).rotateY(Math.PI / 2), dk, { parent: tube, at: [x, 0, 0] });
      rodY(-0.16, -0.05, 0.015, dk, tube);
    } else {
      for (const s of [-1, 1]) { mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.4, 32).rotateZ(-Math.PI / 2), tubeM, { parent: tube, at: [0, 0, s * 0.065] }); mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 16).rotateZ(-Math.PI / 2), dk, { parent: tube, at: [-0.24, 0, s * 0.065] }); }
      slab(tube, dk, 0.12, 0.05, 0.09, { y: -0.08, r: 0.01 });
    }
    anims.push(clip('track', 8, [rotateTrack(head, 'y', 8, (t) => 0.6 * wave(t))]));
  } else if (variant === 'dobsonian') {
    const bw = T.vintage ? M.wood('#7a4e2c') : fin(T, T.trim ? T.s : '#3a3f47', T.vintage ? 'wood' : 'matte');
    mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.04, 40), bw, { parent: root, at: [0, 0.02, 0] });
    const rocker = group('rocker', { parent: root, at: [0, 0.04, 0] });
    slab(rocker, bw, 0.55, 0.03, 0.55, { r: 0.006 });
    for (const s of [-1, 1]) slab(rocker, bw, 0.03, 0.55, 0.55, { x: s * 0.26, r: 0.006 });
    slab(rocker, bw, 0.55, 0.3, 0.03, { z: -0.26, r: 0.006 });
    const tube = group('tube', { parent: rocker, at: [0, 0.5, 0], rot: [0, 0, 0.6] });
    mesh(new THREE.CylinderGeometry(0.17, 0.17, 1.2, 40, 3), tubeM, { parent: tube, at: [0, 0.2, 0] });
    mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.02, 40), dk, { parent: tube, at: [0, 0.79, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 32).rotateZ(Math.PI / 2), dk, { parent: tube, at: [s * 0.2, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 16).rotateX(Math.PI / 2), dk, { parent: tube, at: [0, 0.65, 0.2] });
    rodY(0.4, 0.7, 0.018, dk, tube, { x: 0.18 });
  } else if (variant === 'observatory-dome') {
    const wall = T.vintage ? M.matte('#d9cdb3') : body(T, T.trim ? T.p : '#eceae4');
    const R = 3.2, Hw = 3.2;
    mesh(new THREE.CylinderGeometry(R, R, Hw, 48, 3), wall, { parent: root, at: [0, Hw / 2, 0] });
    slab(root, dk, 1.0, 2.1, 0.06, { y: 0, z: R - 0.02, r: 0.02 });
    lamp(T, root, 'amber', { at: [0, 2.3, R + 0.001], w: 0.15, h: 0.1 });
    const dome = group('dome', { parent: root, at: [0, Hw, 0] });
    const dm = T.trim === 'gold-foil' ? fin(T, '#d6a93c', 'gold') : T.vintage ? M.metal('#7d9c86', 0.5) : fin(T, '#d9dbe0', 'metal');
    mesh(new THREE.SphereGeometry(R * 1.02, 48, 20, 0.25, Math.PI * 2 - 0.5, 0, Math.PI / 2), dm, { parent: dome, rot: [0, -Math.PI / 2, 0] });
    mesh(new THREE.TorusGeometry(R * 1.02, 0.08, 8, 48).rotateX(Math.PI / 2), dk, { parent: dome });
    // slit shutter ribs
    for (const s of [-1, 1]) curveTube(Array.from({ length: 9 }, (_, i) => { const a = (i / 8) * Math.PI / 2; return [Math.sin(0.25) * R * 1.03 * Math.cos(a) * s, Math.sin(a) * R * 1.03, Math.cos(0.25) * R * 1.03 * Math.cos(a)]; }), 0.06, dk, { parent: dome });
    // telescope peeking through the slit, on a pier
    rodY(0, Hw + 0.3, 0.3, M.matte('#8d8f94'), root);
    const tb = group('scope', { parent: root, at: [0, Hw + 0.3, 0], rot: [0.6, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.0, 32), tubeM, { parent: tb, at: [0, 1.2, 0] });
    anims.push(clip('rotate', 12, [spinTrack(dome, 'y', 12)]));
  } else {
    // radio dish on a pedestal
    const pm = body(T, T.trim ? T.p : '#eceae4');
    mesh(new THREE.CylinderGeometry(1.2, 1.6, 4, 32), pm, { parent: root, at: [0, 2, 0] });
    const az = group('azimuth', { parent: root, at: [0, 4, 0] });
    slab(az, pm, 2.0, 1.2, 1.6, { r: 0.1 });
    for (const s of [-1, 1]) slab(az, pm, 0.3, 2.0, 0.6, { x: s * 0.9, y: 1.1, r: 0.06 });
    const dish = group('dish', { parent: az, at: [0, 2.9, 0], rot: [0.7, 0, 0] });
    rodX(-1.0, 1.0, 0.18, M.metal('#9aa0a6'), dish);
    const DR = 4.5;
    const prof = []; for (let i = 0; i <= 14; i++) { const r = (i / 14) * DR; prof.push([r, 0.3 + (r * r) / (DR * 2.2)]); } for (let i = 14; i >= 0; i--) { const r = (i / 14) * DR; prof.push([r, 0.3 + (r * r) / (DR * 2.2) - 0.08]); }
    mesh(lathe(prof, 48), fin(T, '#f4f4f2', T.trim === 'weathered' ? 'matte' : 'gloss'), { parent: dish });
    mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.5, 16), pm, { parent: dish, at: [0, 0.1, 0] });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; bar([Math.cos(a) * DR * 0.8, 0.3 + (DR * 0.8) ** 2 / (DR * 2.2), Math.sin(a) * DR * 0.8], [0, 3.6, 0], 0.06, M.metal('#c9ccd2'), dish); }
    mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16), dk, { parent: dish, at: [0, 3.8, 0] });
    lamp(T, dish, 'red', { at: [0, 4.12, 0], normal: [0, 1, 0], w: 0.12, h: 0.12, shape: 'round', glowSize: 1 });
    emblem(root, 0.8, [0, 2.4, 1.42]);
    root.children[root.children.length - 1].rotation.x = -0.1;
    anims.push(clip('track', 10, [rotateTrack(az, 'y', 10, (t) => Math.PI * 0.5 * wave(t)), rotateTrack(dish, 'x', 10, (t) => 0.3 * wave(t, 2))]));
  }
  if (T.trim === 'futuristic' && variant !== 'observatory-dome' && variant !== 'radio-dish') glowStrip(T, root, [[0.05, 0.6, 0.0], [0.05, 0.9, 0.0]], 0.006);
  return done(root, T, variant, o, anims);
}

/* ============================== PLANET GLOBES ============================== */

export const PLANET_TRIMS = {
  brass: { stand: 'brass' }, wood: { stand: 'wood' }, acrylic: { stand: 'acrylic' },
  illuminated: { stand: 'dark', glow: true }, cutaway: { stand: 'dark', cut: true }, school: { stand: 'plastic', kids: true },
};
export const PLANET_VARIANTS = { earth: {}, moon: {}, mars: {}, jupiter: {}, saturn: {}, orrery: {} };

function planetTex(kind) {
  return canvasTex(512, 256, (c, w, h) => {
    const rnd = (() => { let s = kind.length * 977; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    if (kind === 'earth') {
      c.fillStyle = '#1d5fa8'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { c.fillStyle = ['#3f8a3a', '#6aa04a', '#b59a5a'][i % 3]; c.beginPath(); const x = rnd() * w, y = h * 0.2 + rnd() * h * 0.6; for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.28; const r = 18 + rnd() * 40; c.lineTo(x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r); } c.fill(); }
      c.fillStyle = '#f4f8fb'; c.fillRect(0, 0, w, h * 0.06); c.fillRect(0, h * 0.94, w, h * 0.06);
    } else if (kind === 'moon') {
      c.fillStyle = '#a9a7a2'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { const r = 3 + rnd() * 18; c.fillStyle = `rgba(${rnd() > 0.5 ? '80,80,80' : '210,210,205'},0.35)`; c.beginPath(); c.arc(rnd() * w, rnd() * h, r, 0, 6.3); c.fill(); }
    } else if (kind === 'mars') {
      c.fillStyle = '#b5532c'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(${rnd() > 0.5 ? '90,40,25' : '220,140,90'},0.35)`; c.beginPath(); c.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 40, 6 + rnd() * 15, 0, 0, 6.3); c.fill(); }
      c.fillStyle = '#f1ede6'; c.fillRect(0, 0, w, h * 0.04);
    } else {
      const bands = ['#d9c3a0', '#b07a4f', '#e8dcc4', '#9c6440', '#d4b48a', '#efe6d4', '#a8714a'];
      for (let y = 0; y < h; y += 8) { c.fillStyle = bands[Math.floor((y / h) * 18 + Math.sin(y) * 0.5) % bands.length]; c.fillRect(0, y, w, 8); }
      if (kind === 'jupiter') { c.fillStyle = '#c0533a'; c.beginPath(); c.ellipse(w * 0.6, h * 0.62, 30, 14, 0, 0, 6.3); c.fill(); }
    }
  });
}
const PLANET_COL = { earth: '#2a6bb5', moon: '#a9a7a2', mars: '#b5532c', jupiter: '#c9a27a', saturn: '#d9c39a' };

function planetBall(T, parent, kind, r, at, name) {
  const tex = planetTex(kind);
  const mat = new THREE.MeshPhysicalMaterial({ name: `planet-${kind}`, color: tex ? '#ffffff' : PLANET_COL[kind], map: tex, roughness: kind === 'earth' ? 0.45 : 0.8, clearcoat: kind === 'earth' ? 0.5 : 0 });
  if (T.glow) { mat.emissive = new THREE.Color('#ffffff'); mat.emissiveMap = tex; mat.emissiveIntensity = 0.25; }
  const g = group(name, { parent, at });
  if (T.cut) {
    mesh(new THREE.SphereGeometry(r, 48, 32, Math.PI / 2, Math.PI * 1.5), mat, { parent: g });
    const layers = [[1, '#c2582a'], [0.75, '#e08a2a'], [0.5, '#f2c94a'], [0.25, '#fff2b0']];
    for (const [k, col] of layers) for (const rot of [0, Math.PI / 2]) mesh(new THREE.CircleGeometry(r * k * 0.995, 40, 0, Math.PI / 2), M.matte(col, 0.6), { parent: g, rot: [0, rot === 0 ? 0 : -Math.PI / 2, rot === 0 ? Math.PI / 2 : 0] });
  } else mesh(new THREE.SphereGeometry(r, 48, 32), mat, { parent: g });
  if (kind === 'saturn') {
    const ring = new THREE.RingGeometry(r * 1.25, r * 2.1, 64, 3);
    mesh(ring, new THREE.MeshStandardMaterial({ name: 'rings', color: '#cdb68c', roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }), { parent: g, rot: [-Math.PI / 2, 0, 0] });
    // ring supports so the ring touches the planet
    for (const a of [0, Math.PI]) bar([Math.cos(a) * r * 0.97, 0, Math.sin(a) * r * 0.97], [Math.cos(a) * r * 1.3, 0, Math.sin(a) * r * 1.3], r * 0.02, M.metal('#c9ccd2'), g);
  }
  return g;
}

export function createSpacePlanetGlobe(options = {}) {
  const { o, variant, T } = setup(options, PLANET_VARIANTS, 'space-planet-globe', { stand: 'wood' }, PLANET_TRIMS);
  const root = group(`space-planet-globe-${variant}`);
  const sm = T.stand === 'brass' ? M.metal('#c9a24a', 0.25) : T.stand === 'acrylic' ? glassMat() : T.stand === 'dark' ? fin(T, '#1d2129', 'gloss') : T.stand === 'plastic' ? M.plastic('#2b7de1', 0.4) : M.wood('#6b4426');
  const anims = [];
  if (variant === 'orrery') {
    // brass orrery: sun on a central column, planets on arms
    mesh(lathe([[0, 0], [0.16, 0], [0.16, 0.03], [0.12, 0.05], [0.05, 0.07], [0.04, 0.12], [0, 0.12]], 40), sm, { parent: root });
    const rot = group('arms', { parent: root, at: [0, 0.12, 0] });
    rodY(0, 0.12, 0.008, M.metal('#c9a24a', 0.25), rot);
    const sun = mesh(new THREE.SphereGeometry(0.045, 32, 16), T.glow ? M.emissive('#ffb02a', 1.4) : M.metal('#e8b84a', 0.2), { parent: rot, at: [0, 0.165, 0] });
    sun.name = 'sun';
    const pl = [['moon', 0.012, 0.09], ['earth', 0.018, 0.14], ['mars', 0.014, 0.19], ['jupiter', 0.03, 0.26], ['saturn', 0.024, 0.33]];
    pl.forEach(([k, r, d], i) => {
      const arm = group(`orbit${i}`, { parent: rot, at: [0, 0.03 + i * 0.016, 0], rot: [0, i * 1.3, 0] });
      rodX(0, d, 0.003, M.metal('#c9a24a', 0.25), arm);
      rodY(0, 0.06 - i * 0.008, 0.0025, M.metal('#c9a24a', 0.25), arm, { x: d });
      planetBall({ ...T, cut: false }, arm, k, r, [d, 0.06 - i * 0.008 + r * 0.9, 0], `planet${i}`);
      anims.push(spinTrack(arm, 'y', 4 + i * 3));
    });
    return done(root, T, variant, o, [clip('orbit', 60, anims)]);
  }
  const r = 0.15;
  const tilt = variant === 'earth' ? 0.41 : variant === 'saturn' ? 0.47 : 0.05;
  // base + meridian arc
  if (T.stand === 'acrylic') slab(root, sm, 0.3, 0.03, 0.3, { r: 0.01 });
  else mesh(lathe([[0, 0], [0.13, 0], [0.13, 0.02], [0.09, 0.04], [0.03, 0.06], [0.025, 0.12], [0, 0.12]], 40), sm, { parent: root });
  const cy = 0.12 + r + 0.035;
  rodY(T.stand === 'acrylic' ? 0.02 : 0.1, cy - r * 0.9, 0.012, sm, root);
  const mer = group('meridian', { parent: root, at: [0, cy, 0], rot: [0, 0, tilt] });
  mesh(new THREE.TorusGeometry(r + 0.012, 0.005, 8, 64, Math.PI * 1.15).rotateZ(-Math.PI * 0.575 - Math.PI / 2 + Math.PI), T.stand === 'acrylic' ? M.chrome() : T.stand === 'plastic' ? M.plastic('#ffc81e', 0.4) : M.metal('#c9a24a', 0.25), { parent: mer, rot: [0, Math.PI / 2, 0] });
  rodY(-r - 0.012, r + 0.012, 0.003, M.metal('#c9ccd2'), mer);
  const ball = planetBall(T, mer, variant, r, [0, 0, 0], 'planet');
  bar([0, cy - r * 0.9, 0], [Math.sin(-tilt) * (-(r + 0.012)) * -1, cy - Math.cos(tilt) * (r + 0.012), 0], 0.012, sm, root);
  if (T.glow) lamp(T, root, 'white', { at: [0, 0.09, 0.08], w: 0.012, h: 0.012, shape: 'round' });
  if (T.kids) { const lb = labelPlane(0.14, 0.03, (c, w, h) => { c.fillStyle = '#ffc81e'; c.fillRect(0, 0, w, h); c.fillStyle = '#16171a'; c.font = `bold ${h * 0.7}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(variant.toUpperCase(), w / 2, h / 2); }, { bg: '#ffc81e' }); lb.position.set(0, 0.03, 0.131); lb.rotation.x = -0.4; root.add(lb); }
  return done(root, T, variant, o, [clip('spin', 10, [spinTrack(ball, 'y', 10)])]);
}

/* ============================ ASTRONAUT HELMETS ============================ */

export const HELMET_VARIANTS = { 'classic-eva': {}, 'modern-eva': {}, 'gold-visor': {}, 'suit-display': {}, 'flight-pressure': {} };

function helmet(T, parent, kind, at) {
  const g = group('helmet', { parent, at });
  const shell = T.trim === 'futuristic' ? fin(T, '#16191f', 'carbon') : T.trim === 'weathered' ? fin(T, '#d9d3c4', 'matte') : T.trim === 'arctic' ? body(T, '#f6f8fb') : T.trim === 'school' ? fin(T, '#ffc81e', 'plastic') : body(T, '#f4f4f2');
  const visorCol = kind === 'gold-visor' || T.trim === 'gold-foil' ? '#d6a93c' : T.trim === 'futuristic' ? '#22e1ff' : '#202833';
  const visor = new THREE.MeshPhysicalMaterial({ name: 'visor', color: visorCol, metalness: 0.9, roughness: 0.06, clearcoat: 1 });
  const R = kind === 'flight-pressure' ? 0.16 : 0.19;
  // neck ring
  mesh(new THREE.CylinderGeometry(R * 0.82, R * 0.85, 0.05, 40), fin(T, T.trim === 'vintage' ? '#8a8f96' : '#3d6ea8', 'metal'), { parent: g, at: [0, 0.025, 0] });
  if (kind === 'classic-eva') {
    mesh(new THREE.SphereGeometry(R * 1.02, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.62), glassMat(), { parent: g, at: [0, 0.05 + R * 0.35, 0] });
    mesh(new THREE.SphereGeometry(R * 1.06, 40, 24, -Math.PI * 0.95, Math.PI * 1.9, 0, Math.PI * 0.55), shell, { parent: g, at: [0, 0.05 + R * 0.35, 0], rot: [0, Math.PI, 0] });
    mesh(new THREE.SphereGeometry(R * 1.04, 40, 24, -0.9, 1.8, Math.PI * 0.18, Math.PI * 0.32), visor, { parent: g, at: [0, 0.05 + R * 0.35, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 16).rotateX(Math.PI / 2), shell, { parent: g, at: [s * R * 0.7, 0.05 + R * 0.9, R * 0.62] });
  } else {
    mesh(new THREE.SphereGeometry(R, 40, 28).scale(0.95, 1.08, 1.05), shell, { parent: g, at: [0, 0.05 + R * 0.95, 0] });
    mesh(new THREE.SphereGeometry(R * 1.01, 40, 24, -0.85, 1.7, Math.PI * 0.25, Math.PI * 0.38).scale(0.95, 1.08, 1.05), visor, { parent: g, at: [0, 0.05 + R * 0.95, 0.002] });
    if (kind !== 'flight-pressure') for (const s of [-1, 1]) { mesh(roundedBox(0.04, 0.03, 0.05, 0.01), shell, { parent: g, at: [s * R * 0.8, 0.05 + R * 1.5, R * 0.3] }); lamp(T, g, 'white', { at: [s * R * 0.8, 0.05 + R * 1.5, R * 0.3 + 0.026], w: 0.022, h: 0.016 }); }
    if (kind === 'flight-pressure') { mesh(new THREE.TorusGeometry(R * 0.75, 0.012, 8, 32), M.metal('#9aa0a6'), { parent: g, at: [0, 0.05 + R * 0.95, R * 0.72], rot: [0.25, 0, 0] }); curveTube([[R * 0.6, 0.12, R * 0.5], [R * 1.1, 0.06, R * 0.4], [R * 1.3, 0.01, 0]], 0.012, M.rubber(), { parent: g }); }
  }
  emblem(g, 0.04, [-R * 0.55, 0.05 + R * 0.5, R * 0.88]);
  g.children[g.children.length - 1].rotation.y = -0.55;
  return g;
}

export function createSpaceHelmet(options = {}) {
  const { o, variant, T } = setup(options, HELMET_VARIANTS, 'space-helmet');
  const root = group(`space-helmet-${variant}`);
  const sm = T.trim === 'vintage' ? M.wood('walnut') : fin(T, '#1d2129', 'gloss');
  if (variant === 'suit-display') {
    // full suit on a mannequin stand
    mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.06, 40), sm, { parent: root, at: [0, 0.03, 0] });
    const suit = T.trim === 'futuristic' ? fin(T, '#22262e', 'carbon') : T.trim === 'school' ? fin(T, '#ff7a1a', 'fabric') : T.trim === 'arctic' ? fin(T, '#f6f8fb', 'fabric') : fin(T, '#eceae4', 'fabric');
    for (const s of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.42, 20), suit, { parent: root, at: [s * 0.11, 0.3, 0] });
      mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.42, 20), suit, { parent: root, at: [s * 0.11, 0.7, 0] });
      slab(root, fin(T, '#e9e6df', 'rubber'), 0.13, 0.08, 0.28, { x: s * 0.11, y: 0.06, z: 0.04, r: 0.03 });
      mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.62, 16), suit, { parent: root, at: [s * 0.28, 1.15, 0], rot: [0, 0, s * 0.18] });
      mesh(new THREE.SphereGeometry(0.06, 16, 12).scale(1, 1.3, 0.8), fin(T, '#e9e6df', 'rubber'), { parent: root, at: [s * 0.33, 0.82, 0] });
      mesh(new THREE.TorusGeometry(0.065, 0.012, 8, 20).rotateX(Math.PI / 2), fin(T, '#3d6ea8', 'metal'), { parent: root, at: [s * 0.32, 0.86, 0] });
    }
    mesh(cushion(0.46, 0.62, 0.3, { radius: 0.12, bulge: 0.1 }), suit, { parent: root, at: [0, 1.2, 0] });
    slab(root, fin(T, T.trim === 'futuristic' ? '#16191f' : '#f4f4f2', 'gloss'), 0.42, 0.55, 0.2, { y: 0.98, z: -0.24, r: 0.05 });
    slab(root, darkMat(T), 0.2, 0.12, 0.06, { y: 1.15, z: 0.17, r: 0.02 });
    const flag = labelPlane(0.1, 0.06, (c, w, h) => { c.fillStyle = '#1d4fa0'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = `bold ${h * 0.45}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ORBIX', w / 2, h / 2); }, { bg: '#1d4fa0' });
    flag.position.set(-0.29, 1.36, 0.075); flag.rotation.y = 0; root.add(flag);
    helmet(T, root, 'modern-eva', [0, 1.49, 0]);
    lamp(T, root, 'green', { at: [0.05, 1.15, 0.2], w: 0.01, h: 0.01, shape: 'round' });
    return done(root, T, variant, o);
  }
  if (!o.stand) {
    // no pedestal: the helmet sits on its neck ring on the ground
    helmet(T, root, variant, [0, 0, 0]);
    const hg = root.getObjectByName('helmet');
    hg.updateMatrixWorld(true);
    hg.position.y -= new THREE.Box3().setFromObject(hg).min.y;
    return done(root, T, variant, o);
  }
  // pedestal display (o.stand)
  mesh(lathe([[0, 0], [0.2, 0], [0.2, 0.04], [0.12, 0.06], [0.1, 0.6], [0.16, 0.64], [0, 0.64]], 40), sm, { parent: root });
  const plate = labelPlane(0.16, 0.04, (c, w, h) => { c.fillStyle = '#d6b45a'; c.fillRect(0, 0, w, h); c.fillStyle = '#2b211a'; c.font = `bold ${h * 0.5}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(variant.replace('-', ' ').toUpperCase(), w / 2, h / 2); }, { bg: '#d6b45a' });
  plate.position.set(0, 0.35, 0.106); plate.rotation.x = -0.01; root.add(plate);
  helmet(T, root, variant, [0, 0.64, 0]);
  return done(root, T, variant, o);
}
