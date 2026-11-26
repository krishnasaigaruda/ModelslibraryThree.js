// Home group, part 4: extension cords & plugs, batteries, remote controls, alarm clocks, wall hooks.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, extrudeOutline, tube, setup, done, fin, tm, hw, anims, labelPlane, textDraw, clip, lampGroup, lampTracks, LAMP_ON, rotateTrack, wave, spinTrack } from './common.js';
import { clockFace, digits } from './home-util.js';

/** Cable lying on the floor through points (y auto = radius). */
const cable = (parent, pts, r, mat) => curveTube(pts.map(([x, z, y = 0]) => [x, r + y, z]), r, mat, { parent, segments: pts.length * 8, radialSegments: 8 });

/** Wall plug (type-agnostic two flat pins) pointing along +x from `at`. */
function plugHead(parent, at, mat, s = 1, { earth = false } = {}) {
  const g = group('plug', { parent, at });
  mesh(roundedBox(0.04 * s, 0.03 * s, 0.035 * s, 0.009 * s), mat, { parent: g, at: [0, 0.015 * s, 0] });
  for (const z of [-1, 1]) mesh(roundedBox(0.018 * s, 0.006 * s, 0.0016 * s, 0.0006), M.metal('#d8b85a', 0.25), { parent: g, at: [0.028 * s, 0.015 * s, z * 0.006 * s] });
  if (earth) mesh(new THREE.CylinderGeometry(0.0022 * s, 0.0022 * s, 0.018 * s, 8).rotateZ(Math.PI / 2), M.metal('#d8b85a', 0.25), { parent: g, at: [0.028 * s, 0.024 * s, 0] });
  return g;
}

/* ================================ EXTENSION CORD ================================ */

export const EXTENSION_CORD_VARIANTS = { 'power-strip': {}, 'cord-reel': {}, 'extension-lead': {}, plug: {}, 'travel-adapter': {}, 'phone-charger': {} };

export function createExtensionCord(options = {}) {
  const { o, variant, T } = setup(options, EXTENSION_CORD_VARIANTS, 'extension-cord', { p: '#f4f4f1', s: '#2a2b2e', a: '#e8402f', mat: 'plastic' });
  const root = group(`extension-cord-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const cordM = fin(T, T.trim === 'orange' || T.rugged ? '#ee7a22' : T.trim === 'black' ? '#1a1a1a' : T.p, 'rubber');
  const sockM = fin(T, T.s === '#2a2b2e' ? '#d8d8d4' : T.s, 'plastic');
  let animations = [];
  if (variant === 'power-strip' || variant === 'extension-lead') {
    const n = variant === 'power-strip' ? (T.k > 1.1 ? 8 : 6) : 4;
    const pitch = 0.045, W = n * pitch + 0.07, D = 0.055 * (T.chunky ? 1.2 : 1), H = 0.04 * T.h;
    mesh(roundedBox(W, H, D, 0.012 * T.round), body, { parent: root, at: [0, H / 2, 0], name: 'strip' });
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + 0.06 + i * pitch;
      mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.003, 24), sockM, { parent: root, at: [x, H + 0.0005, 0] });
      for (const z of [-1, 1]) mesh(roundedBox(0.0022, 0.002, 0.007, 0.0005), M.matte('#111'), { parent: root, at: [x + z * 0.006, H + 0.0021, 0] });
      if (T.rugged || variant === 'power-strip') mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.002, 8), M.matte('#111'), { parent: root, at: [x, H + 0.0021, 0.009] });
    }
    // lit switch
    const sw = lampGroup('switch', 'red');
    sw.add(root, { at: [-W / 2 + 0.022, H + 0.002, 0], normal: [0, 1, 0], w: 0.014, h: 0.022, depth: 0.006, bezel: true });
    if (T.detail >= 1 || T.k > 1.1) for (let i = 0; i < 2; i++) mesh(roundedBox(0.012, 0.004, 0.007, 0.001), M.matte('#111'), { parent: root, at: [W / 2 - 0.02, H + 0.0015, (i - 0.5) * 0.016] });
    const len = variant === 'extension-lead' ? 0.6 : 0.4;
    cable(root, [[W / 2, 0], [W / 2 + 0.06, 0.02], [W / 2 + 0.12, 0.12], [W / 2 + 0.02, 0.2], [W / 2 - len * 0.5, 0.18], [W / 2 - len * 0.6, 0.1]], 0.004, cordM);
    plugHead(root, [W / 2 - len * 0.6 - 0.045, 0, 0.1], body, 1, { earth: T.rugged }).rotation.y = Math.PI;
    animations = () => [clip('on', 1, lampTracks('switch', LAMP_ON.red))];
  } else if (variant === 'cord-reel') {
    const R = 0.13 * k, W = 0.12 * k;
    const fm = T.mat === 'metal' ? M.metal('#c9ccd2', 0.3) : fin(T, T.trim ? T.p : '#2a2b2e', 'plastic');
    const reel = group('reel', { parent: root, at: [0, R + 0.03, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(R, R, 0.012, 40).rotateZ(Math.PI / 2), fm, { parent: reel, at: [s * W / 2, 0, 0] });
    mesh(new THREE.CylinderGeometry(R * 0.82, R * 0.82, W - 0.012, 40, 6).rotateZ(Math.PI / 2), fin(T, T.trim === 'black' ? '#1a1a1a' : '#ee7a22', 'rubber'), { parent: reel, name: 'wound' });
    for (let i = 0; i < 8; i++) mesh(new THREE.TorusGeometry(R * 0.82, 0.004, 6, 40), cordM, { parent: reel, at: [-W / 2 + 0.012 + i * (W - 0.024) / 7, 0, 0], rot: [0, Math.PI / 2, 0] });
    const handle = group('crank', { parent: reel, at: [W / 2 + 0.006, 0, 0] });
    tube([0, 0, 0], [0.02, 0, 0], 0.006, fm, { parent: handle });
    tube([0.02, 0, 0], [0.02, R * 0.6, 0], 0.006, fm, { parent: handle });
    tube([0.02, R * 0.6, 0], [0.05, R * 0.6, 0], 0.008, sockM, { parent: handle });
    // A-frame stand with carry handle
    for (const s of [-1, 1]) {
      tube([s * (W / 2 + 0.012), 0, -R * 0.8], [s * (W / 2 + 0.012), R + 0.03, 0], 0.009, fm, { parent: root });
      tube([s * (W / 2 + 0.012), 0, R * 0.8], [s * (W / 2 + 0.012), R + 0.03, 0], 0.009, fm, { parent: root });
      tube([s * (W / 2 + 0.012), R + 0.03, 0], [s * (W / 2 + 0.012), 2 * R + 0.08, 0], 0.009, fm, { parent: root });
    }
    tube([-(W / 2 + 0.012), 2 * R + 0.08, 0], [W / 2 + 0.012, 2 * R + 0.08, 0], 0.014, sockM, { parent: root });
    mesh(roundedBox(W * 0.8, 0.05, 0.06, 0.01), body, { parent: root, at: [0, 0.025, R * 0.75] });
    animations = () => [anims.spin('wind', reel, 'x', 2)];
  } else if (variant === 'plug') {
    plugHead(root, [0, 0, 0], body, 1.4 * k, { earth: T.rugged || T.trim === 'black' });
    cable(root, [[-0.03, 0], [-0.1, 0.02], [-0.16, 0.1], [-0.08, 0.16], [0.02, 0.12]], 0.0045, cordM);
  } else if (variant === 'travel-adapter') {
    const S = 0.055 * k * T.w;
    mesh(roundedBox(S, S, S * 0.9, 0.012 * T.round), body, { parent: root, at: [0, S / 2, 0], name: 'adapter' });
    for (let i = 0; i < 2; i++) mesh(roundedBox(S * 0.5, 0.004, 0.006, 0.0015), M.matte('#111'), { parent: root, at: [0, S + 0.0005, (i - 0.5) * 0.014] });
    for (const x of [-1, 1]) mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.02, 10).rotateZ(Math.PI / 2), M.metal('#d8b85a', 0.25), { parent: root, at: [S / 2 + 0.01, S * 0.5, x * 0.01] });
    mesh(roundedBox(0.006, 0.02, 0.01, 0.002), fin(T, T.a, 'plastic'), { parent: root, at: [0, S * 0.5, S * 0.45 + 0.002] });
    if (!T.slim) for (let i = 0; i < 2; i++) mesh(roundedBox(0.012, 0.005, 0.0025, 0.001), M.matte('#111'), { parent: root, at: [-S / 2 - 0.0005, S * (0.35 + i * 0.25), 0], rot: [0, Math.PI / 2, 0] });
  } else {
    // phone charger brick + coiled cable + connector
    const S = 0.032 * k * T.w;
    const brick = group('brick', { parent: root });
    mesh(roundedBox(S, S, S * 0.95, 0.007 * T.round), body, { parent: brick, at: [0, S / 2, 0] });
    for (const z of [-1, 1]) mesh(roundedBox(0.016, 0.0022, 0.0018, 0.0005), M.metal('#d8b85a', 0.25), { parent: brick, at: [S / 2 + 0.007, S / 2, z * 0.0065] });
    mesh(roundedBox(0.0032, 0.004, 0.009, 0.001), M.matte('#111'), { parent: brick, at: [-S / 2 - 0.0002, S / 2, 0] });
    cable(root, [[-S / 2 - 0.012, 0, S / 2 - 0.004], [-0.06, 0.03], [-0.1, 0.09], [-0.03, 0.13], [0.04, 0.1], [0.03, 0.05], [-0.03, 0.06], [-0.05, 0.12]], 0.0022, fin(T, T.p, 'rubber'));
    mesh(roundedBox(0.006, 0.0045, 0.022, 0.0018), body, { parent: root, at: [-0.05, 0.00225, 0.135] });
    mesh(roundedBox(0.008, 0.003, 0.008, 0.0009), M.metal('#cfd2d6', 0.25), { parent: root, at: [-0.05, 0.0015, 0.15] });
  }
  return done(root, 'extension-cord', variant, o, animations);
}

/* ================================ BATTERY ================================ */

export const BATTERY_VARIANTS = { 'aa-battery': {}, 'aaa-battery': {}, 'd-battery': {}, '9v-battery': {}, 'button-cell': {}, 'battery-pack': {}, 'car-battery': {} };

function cell(parent, R, L, wrapM, at, { capM, band, lying = false } = {}) {
  const g = group('cell', { parent, at, rot: lying ? [0, 0, Math.PI / 2] : [0, 0, 0] });
  const prof = [[0, 0], [R * 0.95, 0], [R, R * 0.06], [R, L - R * 0.06], [R * 0.95, L], [R * 0.32, L], [R * 0.3, L + R * 0.12], [0, L + R * 0.12]];
  mesh(lathe(prof, 32), wrapM, { parent: g, name: 'wrap' });
  mesh(new THREE.CylinderGeometry(R * 0.31, R * 0.31, R * 0.13, 20), capM, { parent: g, at: [0, L + R * 0.065, 0] });
  mesh(new THREE.CylinderGeometry(R * 0.7, R * 0.7, 0.0008, 24), capM, { parent: g, at: [0, 0.0001, 0] });
  if (band) mesh(new THREE.CylinderGeometry(R * 1.004, R * 1.004, L * 0.3, 32, 1, true), band, { parent: g, at: [0, L * 0.78, 0] });
  return g;
}

export function createBattery(options = {}) {
  const { o, variant, T } = setup(options, BATTERY_VARIANTS, 'battery', { p: '#1a1b1e', s: '#d6a93c', a: '#c9ccd2', mat: 'gloss' });
  const root = group(`battery-${variant}`);
  const k = T.k;
  const wrap = fin(T, T.p, T.mat === 'plastic' ? 'gloss' : T.mat === 'metal' ? 'metal' : 'gloss');
  const band = fin(T, T.s, T.mat === 'gold' ? 'gold' : 'gloss');
  const capM = M.metal('#cfd2d6', 0.25);
  if (variant === 'aa-battery' || variant === 'aaa-battery' || variant === 'd-battery') {
    const [R, L] = variant === 'aa-battery' ? [0.00725, 0.0495] : variant === 'aaa-battery' ? [0.00525, 0.0435] : [0.0171, 0.059];
    const n = T.k > 1.1 ? 4 : T.k < 0.9 ? 1 : 2;
    for (let i = 0; i < n; i++) {
      if (i === n - 1 && n > 1) cell(root, R, L, wrap, [0, R, (i - (n - 1) / 2) * R * 2.05 + R * 0.6], { capM, band, lying: true }).rotation.y = 0.35;
      else cell(root, R, L, wrap, [(i - (n - 1) / 2) * R * 2.1, 0, 0], { capM, band });
    }
  } else if (variant === '9v-battery') {
    const W = 0.0265, D = 0.0175, H = 0.0485;
    mesh(roundedBox(W, H, D, 0.0025), wrap, { parent: root, at: [0, H / 2, 0], name: 'body' });
    mesh(roundedBox(W * 1.003, H * 0.35, D * 1.003, 0.0025), band, { parent: root, at: [0, H * 0.72, 0] });
    mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.004, 16), capM, { parent: root, at: [-0.0064, H + 0.002, 0] });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 6), capM, { parent: root, at: [0.0064, H + 0.002, 0] });
    if (T.k > 1.1) { const g = group('second', { parent: root, at: [0.04, D / 2, 0], rot: [Math.PI / 2, 0, 0.3] }); mesh(roundedBox(W, H, D, 0.0025), wrap, { parent: g }); }
  } else if (variant === 'button-cell') {
    const n = T.k > 1.1 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const R = 0.01, H = 0.0032;
      const g = group('coin', { parent: root, at: [i * 0.024 - (n - 1) * 0.012, 0, 0] });
      mesh(lathe([[0, 0], [R * 0.85, 0], [R * 0.88, H * 0.3], [R, H * 0.4], [R, H], [0, H]], 40), M.metal(T.mat === 'gold' ? '#d6a93c' : '#d2d5da', 0.18), { parent: g });
      const lab = labelPlane(R * 1.2, R * 0.5, textDraw(['CR2032'], { bg: '#d2d5da', fg: '#2a2a2a' }), { bg: '#d2d5da' });
      lab.rotation.x = -Math.PI / 2; lab.position.set(0, H + 0.0002, 0); g.add(lab);
    }
  } else if (variant === 'battery-pack') {
    // blister card with 4 AA cells
    const W = 0.075, H = 0.12;
    const card = group('card', { parent: root, rot: [-Math.PI / 2, 0, 0] });
    mesh(roundedBox(W, H, 0.0015, 0.0006), fin(T, T.s, 'paper'), { parent: card, at: [0, 0, 0.00075] });
    mesh(roundedBox(W * 0.86, 0.06, 0.0158, 0.004), new THREE.MeshPhysicalMaterial({ name: 'blister', color: '#ffffff', transparent: true, opacity: 0.25, roughness: 0.05, clearcoat: 1 }), { parent: card, at: [0, -0.02, 0.0094] });
    for (let i = 0; i < 4; i++) { const c = cell(card, 0.00725, 0.0495, wrap, [(i - 1.5) * 0.0152, -0.045, 0.0088], { capM, band }); c.rotation.set(0, 0, 0); }
    const lab = labelPlane(W * 0.8, 0.03, textDraw(['ALKALINE', 'AA × 4'], { bg: T.s, fg: '#1a1a1a' }), { bg: T.s });
    lab.position.set(0, 0.035, 0.0016); card.add(lab);
    card.position.y = 0;
  } else {
    // 12V car battery: case, lid, terminals, handle
    const W = 0.24 * k, H = 0.19 * k, D = 0.175 * k;
    mesh(roundedBox(W, H, D, 0.006), fin(T, T.p, 'plastic'), { parent: root, at: [0, H / 2, 0], name: 'case' });
    mesh(roundedBox(W * 1.01, 0.02, D * 1.01, 0.006), fin(T, T.trim === 'black' ? '#2e3036' : T.s, 'plastic'), { parent: root, at: [0, H + 0.008, 0] });
    for (const [x, c] of [[-1, '#c8302a'], [1, '#2a2a2a']]) {
      mesh(new THREE.CylinderGeometry(0.009, 0.01, 0.018, 16), M.metal('#9a9aa0', 0.4), { parent: root, at: [x * W * 0.36, H + 0.027, -D * 0.3] });
      mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.006, 16), M.plastic(c), { parent: root, at: [x * W * 0.36, H + 0.021, -D * 0.3] });
    }
    curveTube([[-W * 0.2, H + 0.018, 0.03], [-W * 0.15, H + 0.06, 0.03], [W * 0.15, H + 0.06, 0.03], [W * 0.2, H + 0.018, 0.03]], 0.006, M.plastic('#1a1a1a'), { parent: root, segments: 16 });
    const lab = labelPlane(W * 0.7, H * 0.45, textDraw(['12V', '60Ah  540A'], { bg: T.s === '#d6a93c' ? '#1f3f73' : T.s, fg: '#ffffff' }), { bg: '#1f3f73' });
    lab.position.set(0, H * 0.5, D / 2 + 0.0006); root.add(lab);
  }
  return done(root, 'battery', variant, o);
}

/* ================================ REMOTE CONTROL ================================ */

export const REMOTE_CONTROL_VARIANTS = { 'tv-remote': {}, 'ac-remote': {}, 'streaming-remote': {}, 'universal-remote': {}, 'car-key-fob': {}, 'garage-remote': {} };

export function createRemoteControl(options = {}) {
  const { o, variant, T } = setup(options, REMOTE_CONTROL_VARIANTS, 'remote-control', { p: '#1d1e21', s: '#3a3c42', a: '#d63a2a', mat: 'plastic' });
  const root = group(`remote-control-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const btn = fin(T, T.s, T.mat === 'metal' ? 'plastic' : 'rubber');
  const acc = fin(T, T.a, 'plastic');
  const led = lampGroup('led', 'red');
  const dims = { 'tv-remote': [0.048, 0.019, 0.2], 'ac-remote': [0.052, 0.02, 0.15], 'streaming-remote': [0.036, 0.013, 0.13], 'universal-remote': [0.055, 0.022, 0.22], 'car-key-fob': [0.033, 0.014, 0.065], 'garage-remote': [0.036, 0.015, 0.06] };
  let [W, H, L] = dims[variant];
  W *= k * T.w; L *= k * (T.slim ? 1.08 : 1); H *= T.chunky ? 1.25 : 1;
  const top = H;
  // body: a slightly tapered pebble slab lying flat
  const g = roundedBox(W, H, L, Math.min(H * 0.48, 0.006 * T.round + 0.003), 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setX(i, p.getX(i) * (1 - 0.1 * (z / L + 0.5))); if (variant === 'car-key-fob') p.setX(i, p.getX(i) * (1 - 0.25 * Math.max(0, z / L * 2) ** 2)); }
  g.computeVertexNormals();
  mesh(g, body, { parent: root, at: [0, H / 2, 0], name: 'body' });
  const b = (x, z, w, d, m = btn, h = 0.0025) => mesh(roundedBox(w, h, d, Math.min(w, d, h) * 0.45), m, { parent: root, at: [x, top + h / 2 - 0.0005, z] });
  const round = (x, z, r, m = btn) => mesh(new THREE.CylinderGeometry(r, r, 0.0025, 20), m, { parent: root, at: [x, top + 0.0008, z] });
  if (variant === 'tv-remote' || variant === 'universal-remote') {
    round(-W * 0.3, -L * 0.42, 0.0045, acc);
    // number pad
    const rows = variant === 'universal-remote' ? 5 : 4;
    for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) b((c - 1) * W * 0.27, -L * 0.3 + r * 0.016, W * 0.2, 0.01);
    // d-pad ring + OK
    mesh(new THREE.TorusGeometry(0.012, 0.0045, 8, 28), btn, { parent: root, at: [0, top + 0.0008, L * 0.12], rot: [Math.PI / 2, 0, 0] });
    round(0, L * 0.12, 0.006, acc);
    for (const s of [-1, 1]) b(s * W * 0.32, L * 0.3, 0.008, 0.026);
    if (variant === 'universal-remote') {
      const scr = labelPlane(W * 0.7, 0.03, digits('TV  DVD', { fg: '#7fe0ff' }), { bg: '#0b2a33', emissive: 0.6 });
      scr.rotation.x = -Math.PI / 2; scr.position.set(0, top + 0.0003, -L * 0.43 + 0.02); root.add(scr);
      for (let i = 0; i < 4; i++) b((i - 1.5) * W * 0.22, L * 0.42, W * 0.16, 0.008, fin(T, ['#c8302a', '#2f9e4a', '#e8c21a', '#2457b8'][i], 'rubber'));
    }
    led.add(root, { at: [0, H * 0.55, -L / 2 - 0.0005], normal: [0, 0, -1], w: 0.008, h: 0.004, depth: 0.002, bezel: false });
  } else if (variant === 'ac-remote') {
    const scr = labelPlane(W * 0.75, L * 0.3, digits('24°', { bg: '#a8b8a0', fg: '#1d2a1d' }), { bg: '#a8b8a0', emissive: 0.15 });
    scr.rotation.x = -Math.PI / 2; scr.position.set(0, top + 0.0003, -L * 0.22); root.add(scr);
    round(-W * 0.25, L * 0.12, 0.007, acc);
    for (const s of [-1, 1]) b(W * 0.2, L * 0.08 + s * 0.012, 0.014, 0.008);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) b((c - 1) * W * 0.27, L * 0.28 + r * 0.014, W * 0.2, 0.008);
    led.add(root, { at: [0, H * 0.55, -L / 2 - 0.0005], normal: [0, 0, -1], w: 0.01, h: 0.005, depth: 0.002, bezel: false });
  } else if (variant === 'streaming-remote') {
    mesh(new THREE.CylinderGeometry(W * 0.36, W * 0.36, 0.0015, 32), fin(T, T.p === '#1d1e21' ? '#2a2c30' : T.s, 'gloss'), { parent: root, at: [0, top + 0.0003, -L * 0.22] });
    for (let i = 0; i < 4; i++) round((i % 2 ? 1 : -1) * W * 0.22, L * 0.06 + Math.floor(i / 2) * 0.018, 0.0055);
    b(W * 0.3, L * 0.32, 0.006, 0.02);
    led.add(root, { at: [0, H * 0.55, -L / 2 - 0.0005], normal: [0, 0, -1], w: 0.005, h: 0.003, depth: 0.002, bezel: false });
  } else {
    // key fob / garage opener: 2–4 big buttons, key ring loop
    const n = variant === 'garage-remote' ? 2 : T.lux ? 4 : 3;
    for (let i = 0; i < n; i++) round(0, -L * 0.25 + i * L * 0.5 / Math.max(1, n - 1) * 0.9, W * 0.18, i === n - 1 ? acc : btn);
    mesh(new THREE.TorusGeometry(0.009, 0.0016, 8, 20), M.metal('#cfd2d6', 0.25), { parent: root, at: [0, H * 0.5, -L / 2 - 0.006], rot: [Math.PI / 2, 0, 0] });
    if (variant === 'car-key-fob' && !T.slim) {
      // flip key blade
      mesh(extrudeOutline([[0, 0], [0.04, 0], [0.042, 0.003], [0.035, 0.008], [0.028, 0.006], [0.02, 0.009], [0, 0.009]], 0.0022, { bevel: 0.0005, segments: 1 }), M.metal('#cfd2d6', 0.25), { parent: root, at: [W * 0.1, H * 0.5, L / 2 - 0.004], rot: [Math.PI / 2, 0, -Math.PI / 2 + 0.3] });
    }
    led.add(root, { at: [0, top + 0.0005, L * 0.4], normal: [0, 1, 0], w: 0.003, h: 0.003, depth: 0.0015, bezel: false, shape: 'round' });
  }
  if (T.lux) mesh(roundedBox(W * 1.01, H * 0.25, L * 1.01, H * 0.12), M.metal('#d6a93c', 0.22), { parent: root, at: [0, H * 0.45, 0] });
  root.traverse((c) => { if (c.name.startsWith('led_glow')) c.scale.setScalar(0.12); });
  return done(root, 'remote-control', variant, o, () => [clip('on', 1, lampTracks('led', LAMP_ON.red, { blink: 4 }))]);
}

/* ================================ ALARM CLOCK ================================ */

export const ALARM_CLOCK_VARIANTS = { 'twin-bell': {}, digital: {}, 'cube-clock': {}, 'flip-clock': {}, 'travel-alarm': {} };

export function createAlarmClock(options = {}) {
  const { o, variant, T } = setup(options, ALARM_CLOCK_VARIANTS, 'alarm-clock', { p: '#c42a2a', s: '#f6f2e8', a: '#1d1d1d', mat: 'gloss' });
  const root = group(`alarm-clock-${variant}`);
  const k = T.k;
  const body = fin(T, T.p, T.mat === 'plastic' ? 'plastic' : T.mat, { pattern: T.pattern });
  const metal = T.lux || T.trim === 'gold' ? M.metal('#d6a93c', 0.2) : T.trim === 'vintage' ? M.metal('#b8913f', 0.35) : M.chrome();
  let animations = [];
  if (variant === 'twin-bell') {
    const R = 0.055 * k * T.w, D = 0.045 * k * (T.chunky ? 1.3 : 1);
    const clk = group('clock', { parent: root, at: [0, R + 0.022 * k, 0] });
    const shell = lathe([[0, -D / 2], [R * 0.9, -D / 2], [R, -D / 2 + 0.006], [R, D / 2 - 0.004], [R * 0.95, D / 2], [R * 0.9, D / 2]], 48).rotateX(Math.PI / 2);
    mesh(shell, body, { parent: clk, name: 'case' });
    const face = labelPlane(R * 1.8, R * 1.8, clockFace({ bg: T.s, fg: T.a }), { bg: T.s, px: 256 });
    face.geometry = new THREE.CircleGeometry(R * 0.9, 48);
    face.geometry.attributes.uv.array.forEach(() => {});
    face.position.z = D / 2 - 0.002; clk.add(face);
    mesh(new THREE.TorusGeometry(R * 0.92, 0.003, 8, 48), metal, { parent: clk, at: [0, 0, D / 2] });
    mesh(new THREE.CircleGeometry(R * 0.9, 48), new THREE.MeshPhysicalMaterial({ name: 'crystal', color: '#ffffff', transparent: true, opacity: 0.12, roughness: 0.05, clearcoat: 1 }), { parent: clk, at: [0, 0, D / 2 - 0.0005] });
    // hands
    const hm = M.matte(T.a);
    const hour = group('hour', { parent: clk, at: [0, 0, D / 2 - 0.0015] });
    mesh(roundedBox(0.004, R * 0.5, 0.0008, 0.0003), hm, { parent: hour, at: [0, R * 0.22, 0] });
    const minute = group('minute', { parent: clk, at: [0, 0, D / 2 - 0.001] });
    mesh(roundedBox(0.003, R * 0.75, 0.0008, 0.0003), hm, { parent: minute, at: [0, R * 0.35, 0] });
    minute.rotation.z = -2.1; hour.rotation.z = 0.9;
    // bells + hammer
    const bells = group('bells', { parent: clk });
    for (const s of [-1, 1]) {
      const bg = group('bell', { parent: bells, at: [s * R * 0.62, R * 0.86, 0], rot: [0, 0, -s * 0.5] });
      mesh(lathe([[0, 0.022 * k], [0.012 * k, 0.02 * k], [0.022 * k, 0.008 * k], [0.026 * k, 0], [0.024 * k, 0], [0, 0.0]], 32), metal, { parent: bg, at: [0, 0.006, 0] });
      tube([0, 0, 0], [0, 0.008, 0], 0.0025, metal, { parent: bg });
    }
    const hammer = group('hammer', { parent: clk, at: [0, R, 0] });
    tube([0, 0, 0], [0, 0.03 * k, 0], 0.0015, metal, { parent: hammer });
    mesh(new THREE.SphereGeometry(0.004, 8, 6), metal, { parent: hammer, at: [0, 0.03 * k, 0] });
    curveTube([[-R * 0.6, R * 0.8, 0], [-R * 0.25, R * 1.45, 0], [R * 0.25, R * 1.45, 0], [R * 0.6, R * 0.8, 0]], 0.0028, metal, { parent: clk, segments: 24 });
    // feet
    for (const s of [-1, 1]) tube([s * R * 0.45, -R * 0.85, 0], [s * R * 0.75, -R - 0.02 * k, 0], 0.003, metal, { parent: clk });
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.005, 8, 6), metal, { parent: clk, at: [s * R * 0.75, -R - 0.02 * k, 0] });
    animations = () => [
      clip('ring', 0.5, [rotateTrack(clk, 'z', 0.5, (t) => 0.06 * wave(t, 4)), rotateTrack(hammer, 'z', 0.5, (t) => 0.5 * wave(t, 6))]),
      clip('tick', 60, [rotateTrack(minute, 'z', 60, (t) => -t * Math.PI * 2, 60)]),
    ];
  } else if (variant === 'digital' || variant === 'cube-clock') {
    const cube = variant === 'cube-clock';
    const W = (cube ? 0.08 : 0.14) * k * T.w, H = (cube ? 0.08 : 0.07) * k * T.h, D = (cube ? 0.08 : 0.06) * k;
    const bm = cube && !T.trim ? fin(T, '#a5733f', 'wood') : body;
    // smooth case (more bevel segments: no facets) with a glossy dark display window set into the front
    const g = roundedBox(W, H, D, Math.min(H * 0.3, 0.008 * T.round), 6);
    mesh(g, bm, { parent: root, at: [0, H / 2, 0], name: 'case' });
    if (!cube) mesh(roundedBox(W * 0.86, H * 0.62, 0.004, 0.003, 4), new THREE.MeshPhysicalMaterial({ name: 'display-glass', color: '#0b0d0c', roughness: 0.08, clearcoat: 1 }), { parent: root, at: [0, H * 0.5, D / 2 + 0.0005], name: 'bezel' });
    const scr = labelPlane(W * 0.78, H * 0.5, digits('07:30', { fg: cube ? '#ffffff' : T.trim === 'neon' ? '#c8ff12' : '#ff3a2a', bg: cube ? 'rgba(0,0,0,0)' : '#0b0d0c' }), { bg: '#0b0d0c', emissive: 0.9, px: 512 });
    scr.name = 'screen';
    scr.position.set(0, H * 0.5, D / 2 + (cube ? 0.0006 : 0.0029));
    if (cube) { scr.material.transparent = true; }
    root.add(scr);
    mesh(roundedBox(W * 0.3, 0.006, 0.02, 0.002), fin(T, T.a, 'plastic'), { parent: root, at: [0, H + (cube ? 0 : -0.001), -D * 0.1] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.003, 12), M.rubber(), { parent: root, at: [s * W * 0.38, -0.0015, 0] });
    animations = () => [clip('on', 1, [new THREE.NumberKeyframeTrack('screen.material.emissiveIntensity', [0, 0.5, 1], [0.9, 0.9, 0.9])]), clip('ring', 1, [new THREE.NumberKeyframeTrack('screen.material.emissiveIntensity', [0, 0.5, 1], [1.2, 0.1, 1.2], THREE.InterpolateDiscrete)])];
  } else if (variant === 'flip-clock') {
    const W = 0.16 * k * T.w, H = 0.09 * k * T.h, D = 0.07 * k;
    mesh(cushion(W, H, D, { radius: H * 0.3 * T.round, bulge: 0.05 }), body, { parent: root, at: [0, H / 2 + 0.008, 0], name: 'case' });
    for (const s of [-1, 1]) mesh(roundedBox(0.012, 0.012, D * 0.6, 0.004), metal, { parent: root, at: [s * W * 0.38, 0.006, 0] });
    mesh(roundedBox(W * 0.78, H * 0.62, 0.008, 0.004), M.plastic('#141414'), { parent: root, at: [0, H / 2 + 0.008, D / 2 - 0.002] });
    const nums = ['0', '7', '3', '0'];
    const leaves = [];
    nums.forEach((n, i) => {
      const x = (i - 1.5) * W * 0.18 + (i > 1 ? 0.006 : -0.006);
      const card = labelPlane(W * 0.15, H * 0.5, (g, w, h) => { g.fillStyle = '#1e1e1e'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2f2f2'; g.font = `bold ${Math.round(h * 0.75)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, w / 2, h / 2 + 3); g.fillStyle = '#000'; g.fillRect(0, h / 2 - 1, w, 2); }, { bg: '#1e1e1e', px: 96 });
      card.position.set(x, H / 2 + 0.008, D / 2 + 0.0025);
      root.add(card);
      if (i === 3) { card.name = 'leaf'; leaves.push(card); }
    });
    animations = () => [clip('flip', 2, [rotateTrack(leaves[0], 'x', 2, (t) => (t < 0.25 ? -t * 4 * Math.PI * 0.5 : 0))])];
  } else {
    // folding travel alarm: hinged case open, face tilted
    const W = 0.075 * k, D = 0.075 * k, t = 0.012;
    const caseM = T.mat === 'leather' || T.trim === 'vintage' ? fin(T, T.p, 'leather') : body;
    mesh(roundedBox(W, t, D, 0.004), caseM, { parent: root, at: [0, t / 2, 0] });
    const lid = group('lid', { parent: root, at: [0, t, -D / 2 + 0.002] });
    lid.rotation.x = -1.2;
    mesh(roundedBox(W, t, D, 0.004), caseM, { parent: lid, at: [0, t / 2 - 0.002, D / 2 - 0.002] });
    const face = labelPlane(W * 0.8, W * 0.8, clockFace({ bg: T.s, fg: T.a, numerals: !T.slim }), { bg: T.s });
    face.geometry = new THREE.CircleGeometry(W * 0.36, 40);
    face.rotation.x = Math.PI / 2; face.position.set(0, -0.0026, D / 2 - 0.002); lid.add(face);
    mesh(new THREE.TorusGeometry(W * 0.37, 0.002, 6, 40), metal, { parent: lid, at: [0, -0.002, D / 2 - 0.002], rot: [Math.PI / 2, 0, 0] });
    animations = () => [anims.open('close', lid, 'x', 1.15, 3)];
  }
  return done(root, 'alarm-clock', variant, o, animations);
}

/* ================================ WALL HOOK ================================ */

export const WALL_HOOK_VARIANTS = { 'picture-hook': {}, 'coat-hook': {}, 'key-rack': {}, 'adhesive-hook': {}, 'hook-rail': {} };

/** Cast hook profile in the XY plane rising from a wall plate lying on its back (hook points up, +y). */
function hookShape(parent, at, s, mat, { double = false, ball = true } = {}) {
  const g = group('hook', { parent, at });
  curveTube([[0, 0, 0], [0, 0.04 * s, 0.004 * s], [0, 0.07 * s, 0.02 * s], [0, 0.075 * s, 0.04 * s], [0, 0.06 * s, 0.05 * s]], 0.0045 * s, mat, { parent: g, segments: 20 });
  if (ball) mesh(new THREE.SphereGeometry(0.007 * s, 12, 10), mat, { parent: g, at: [0, 0.06 * s, 0.05 * s] });
  if (double) {
    curveTube([[0, 0.003 * s, 0], [0, 0.02 * s, -0.004 * s], [0, 0.035 * s, -0.016 * s], [0, 0.034 * s, -0.028 * s]], 0.004 * s, mat, { parent: g, segments: 14 });
    if (ball) mesh(new THREE.SphereGeometry(0.006 * s, 12, 10), mat, { parent: g, at: [0, 0.034 * s, -0.028 * s] });
  }
  return g;
}

export function createWallHook(options = {}) {
  const { o, variant, T } = setup(options, WALL_HOOK_VARIANTS, 'wall-hook', { p: '#b8913f', s: '#a5733f', a: '#2a2b2e', mat: 'brass' });
  const root = group(`wall-hook-${variant}`);
  const k = T.k;
  const hm = T.mat === 'plastic' ? fin(T, T.p, 'plastic') : T.mat === 'wood' ? fin(T, T.p, 'wood') : T.mat === 'metal' ? M.metal(T.p, 0.3) : fin(T, T.p, ['gold', 'silver', 'brass', 'copper', 'rosegold'].includes(T.mat) ? T.mat : 'brass');
  const plateM = T.mat === 'wood' ? fin(T, T.p, 'wood') : hm;
  // everything lies on its back (wall side down), hooks pointing up
  if (variant === 'picture-hook') {
    const n = T.k > 1.1 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const g = group('ph', { parent: root, at: [i * 0.04 - (n - 1) * 0.02, 0, 0], rot: [0, i * 0.5, 0] });
      const sm = M.metal(T.mat === 'metal' ? '#c9ccd2' : '#b8913f', 0.3);
      mesh(extrudeOutline([[-0.006, 0], [0.006, 0], [0.007, 0.022], [0, 0.026], [-0.007, 0.022]], 0.0015, { bevel: 0.0004, segments: 1 }), sm, { parent: g, at: [0, 0.00075, -0.012], rot: [-Math.PI / 2, 0, 0] });
      curveTube([[0, 0.0012, 0.008], [0, 0.0012, 0.014], [0, 0.007, 0.018], [0, 0.011, 0.014]], 0.0012, sm, { parent: g, segments: 12 });
      // nail
      tube([0.012, 0.0013, -0.01], [0.012, 0.0013, 0.02], 0.0009, M.metal('#9aa0a6', 0.4), { parent: g });
      mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.0008, 12).rotateX(Math.PI / 2), M.metal('#9aa0a6', 0.4), { parent: g, at: [0.012, 0.0013, -0.0104] });
    }
  } else if (variant === 'coat-hook' || variant === 'adhesive-hook') {
    const adh = variant === 'adhesive-hook';
    const s = (adh ? 0.6 : 1) * k * (T.chunky ? 1.2 : 1);
    const pm = adh ? fin(T, T.mat === 'brass' ? '#f4f4f1' : T.p, 'plastic') : plateM;
    if (adh) mesh(roundedBox(0.035 * s / 0.6, 0.004, 0.05 * s / 0.6, 0.0018), pm, { parent: root, at: [0, 0.002, 0] });
    else mesh(lathe([[0, 0], [0.025 * s, 0], [0.026 * s, 0.003], [0.02 * s, 0.008], [0, 0.009]], 32), pm, { parent: root });
    const h = hookShape(root, [0, adh ? 0.004 : 0.008, 0], s, adh ? pm : hm, { double: !adh && !T.slim, ball: !adh });
    h.rotation.x = -Math.PI / 2; h.rotation.z = Math.PI;
    if (!adh) for (const z of [-1, 1]) mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.0012, 10), M.metal('#9aa0a6', 0.35), { parent: root, at: [0, 0.0055 * s, z * 0.015 * s] });
  } else {
    const rail = variant === 'hook-rail';
    const n = rail ? (T.k > 1.1 ? 6 : 5) : 4;
    const W = (rail ? 0.6 : 0.26) * k * T.w, D = (rail ? 0.09 : 0.12) * k, t = 0.018;
    const bm = rail || T.mat === 'wood' || T.mat === 'brass' ? fin(T, T.mat === 'wood' ? T.p : T.s, 'wood') : plateM;
    mesh(roundedBox(W, t, D, 0.004 * T.round), bm, { parent: root, at: [0, t / 2, 0] });
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * W / n;
      const h = hookShape(root, [x, t, D * 0.15], rail ? 1 : 0.55, hm, { double: rail && !T.slim, ball: true });
      h.rotation.x = -Math.PI / 2; h.rotation.z = Math.PI;
      if (!rail && i % 2 === 0) {
        // a key hanging from the hook, lying flat on the board
        const key = group('key', { parent: root, at: [x, t + 0.002, D * 0.15 - 0.032] });
        mesh(new THREE.TorusGeometry(0.008, 0.0012, 6, 20), M.metal('#cfd2d6', 0.25), { parent: key, at: [0, 0.0012, 0], rot: [Math.PI / 2, 0, 0] });
        mesh(extrudeOutline([[-0.009, 0], [0.009, 0], [0.004, -0.014], [0.003, -0.045], [-0.003, -0.05], [-0.003, -0.014]], 0.0018, { bevel: 0.0004, segments: 1 }), M.metal(i ? '#cfd2d6' : '#b8913f', 0.28), { parent: key, at: [0, 0.0012, 0.006], rot: [Math.PI / 2, 0, 0] });
      }
    }
    if (!rail) {
      const lab = labelPlane(W * 0.5, D * 0.22, textDraw(['KEYS'], { bg: T.mat === 'wood' ? '#d9b98a' : '#f4f1ea', fg: '#2a2018' }), { bg: '#f4f1ea' });
      lab.rotation.x = -Math.PI / 2; lab.position.set(0, t + 0.0004, -D * 0.3); root.add(lab);
    }
  }
  return done(root, 'wall-hook', variant, o);
}
