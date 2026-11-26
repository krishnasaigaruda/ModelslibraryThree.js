// Gym & fitness: free weights, machines (animated treadmill belt, bike flywheel, rower seat)
// and fitness gear (yoga mat, swinging punching bag, ...).
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, setup, done, fin, bodyMat, bar, labelPlane, rodX, rodY, rodZ } from './common.js';
import { clip, spinTrack, rotateTrack, moveTrack, wave } from '../../core/animation.js';
import { brandEmblem } from '../../core/brand.js';

const steelOf = (T, trim) => (trim === 'champion' ? M.metal('#d6a93c', 0.22) : trim === 'retro' ? M.chrome() : trim === 'worn' ? M.metal('#8a7a68', 0.75) : trim === 'stealth' ? fin(T, '#1c1d20', 'carbon') : M.metal('#2a2c31', 0.4));
const frameOf = (T, trim, base) => (trim === 'champion' ? M.metal('#d6a93c', 0.22) : trim === 'retro' ? M.chrome() : trim ? bodyMat(T, T.pattern ? T.p : T.p) : fin(T, base, 'gloss'));
const padOf = (T, trim, base = '#151515') => fin(T, trim === 'retro' ? '#7a2a20' : trim === 'kids' ? T.s : trim === 'neon' ? '#151515' : T.pattern ? T.s : trim === 'champion' ? '#151515' : base, trim === 'retro' ? 'leather' : 'leather');

/* =============================== FREE WEIGHTS =============================== */

export const WEIGHT_VARIANTS = {
  dumbbell: { p: '#1c1d20' },
  'hex-dumbbell': { p: '#1c1d20' },
  kettlebell: { p: '#1c1d20' },
  barbell: { p: '#1c1d20' },
  'plate-tree': { p: '#1c1d20' },
  'medicine-ball': { p: '#2a2c31', s: '#e5402a' },
};

const PLATE_COLORS = { 25: '#c8102e', 20: '#1d4fa0', 15: '#f2c500', 10: '#1a8a3a', 5: '#f2f2f2', 2.5: '#c8102e' };
function plate(parent, kg, T, trim, { at = [0, 0, 0], axis = 'x' } = {}) {
  const r = kg >= 10 ? 0.225 : 0.1 + kg * 0.012;
  const th = 0.02 + kg * 0.0022;
  const bumper = trim === 'pro' || T.pattern || trim === 'neon' || trim === 'kids';
  const col = trim === 'neon' ? [T.p, T.a, '#19e3ff', '#ff8a00'][Math.round(kg) % 4] : T.pattern ? (kg % 10 ? T.s : T.p) : bumper ? PLATE_COLORS[kg] ?? '#151515' : null;
  const mat = trim === 'champion' ? M.metal('#d6a93c', 0.25) : trim === 'retro' ? M.metal('#3a3c40', 0.6) : col ? fin(T, col, 'rubber') : trim === 'worn' ? M.metal('#5a4a3e', 0.85) : M.metal('#222326', 0.55);
  const prof = bumper || trim === 'kids'
    ? [[0.026, -th / 2], [r, -th / 2], [r, th / 2], [0.026, th / 2]]
    : [[0.026, -th / 2], [r * 0.6, -th / 2], [r * 0.62, -th * 0.3], [r * 0.92, -th * 0.3], [r * 0.94, -th / 2], [r, -th / 2], [r, th / 2], [r * 0.94, th / 2], [r * 0.92, th * 0.3], [r * 0.62, th * 0.3], [r * 0.6, th / 2], [0.026, th / 2]];
  const g = lathe(prof, 40);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  else if (axis === 'z') g.rotateX(Math.PI / 2);
  const m = mesh(g, mat, { parent, at });
  m.name = 'plate';
  mesh(new THREE.CylinderGeometry(0.028, 0.028, th + 0.002, 20).rotateZ(axis === 'x' ? Math.PI / 2 : 0).rotateX(axis === 'z' ? Math.PI / 2 : 0), M.chrome(), { parent: m });
  return { r, th };
}

export function createFreeWeight(options = {}) {
  const { o, variant, trim, T } = setup(options, WEIGHT_VARIANTS, 'free-weight');
  const root = group(`free-weight-${variant}`);
  const k = T.kids ? 0.65 : 1;
  const steel = trim === 'champion' ? M.metal('#d6a93c', 0.2) : trim === 'worn' ? M.metal('#8a7a68', 0.7) : M.chrome();
  const body = trim === 'champion' ? M.metal('#d6a93c', 0.22) : trim === 'retro' ? M.metal('#2a2b2e', 0.55) : trim === 'kids' ? fin(T, T.p, 'foam') : trim === 'stealth' ? fin(T, '#1c1d20', 'carbon') : trim ? bodyMat(T) : fin(T, '#1c1d20', 'rubber');
  const knurl = (x0, x1, r, y, parent = root) => {
    rodX(x0, x1, r, steel, parent, { y });
    for (let x = x0 + 0.01; x < x1 - 0.005; x += 0.006) mesh(new THREE.TorusGeometry(r, 0.0007, 4, 16).rotateY(Math.PI / 2), M.metal('#9a9da2', 0.5), { parent, at: [x, y, 0] });
  };
  if (variant === 'dumbbell' || variant === 'hex-dumbbell') {
    const pair = trim === 'pro' || trim === 'kids' || trim === 'neon' ? 2 : 1;
    for (let p = 0; p < pair; p++) {
      const g = group('dumbbell', { parent: root, at: [0, 0, p * 0.22 * k], rot: [0, p * 0.3, 0] });
      const R = (variant === 'hex-dumbbell' ? 0.075 : 0.07) * k * (trim === 'pro' ? 1.15 : 1);
      const hw = 0.065 * k, L = 0.07 * k;
      if (variant === 'hex-dumbbell') {
        for (const s of [-1, 1]) {
          const h = mesh(new THREE.CylinderGeometry(R, R, L, 6).rotateZ(Math.PI / 2), body, { parent: g, at: [s * (hw + L / 2), R * Math.cos(Math.PI / 6), 0] });
          h.name = 'head';
          if (trim !== 'retro' && trim !== 'champion') mesh(new THREE.CylinderGeometry(R * 0.6, R * 0.6, L + 0.002, 24).rotateZ(Math.PI / 2), M.chrome(), { parent: h });
        }
        knurl(-hw, hw, 0.016 * k, R * Math.cos(Math.PI / 6), g);
      } else if (trim === 'retro') {
        // spherical globe dumbbell
        for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(R * 0.85, 24, 16), body, { parent: g, at: [s * (hw + R * 0.7), R * 0.85, 0], name: 'head' });
        knurl(-hw - 0.01, hw + 0.01, 0.015, R * 0.85, g);
      } else {
        for (const s of [-1, 1]) {
          const head = mesh(lathe([[0, 0], [R * 0.92, 0], [R, L * 0.15], [R, L * 0.85], [R * 0.92, L], [0, L]], 32).rotateZ(-Math.PI / 2 * s), body, { parent: g, at: [s * hw, R, 0], name: 'head' });
          void head;
          mesh(new THREE.CylinderGeometry(0.024 * k, 0.024 * k, 0.012, 20).rotateZ(Math.PI / 2), steel, { parent: g, at: [s * (hw - 0.004), R, 0] });
          if (T.pattern) mesh(new THREE.CylinderGeometry(R * 1.005, R * 1.005, L * 0.25, 32).rotateZ(Math.PI / 2), fin(T, T.s), { parent: g, at: [s * (hw + L * 0.5), R, 0] });
        }
        knurl(-hw, hw, 0.016 * k, R, g);
      }
    }
  } else if (variant === 'kettlebell') {
    const sizes = trim === 'pro' ? [0.11, 0.095, 0.08] : trim === 'kids' ? [0.07, 0.06] : [0.105];
    let x = 0;
    sizes.forEach((R, i) => {
      const g = group('kettlebell', { parent: root, at: [x, 0, 0] });
      const col = trim === 'pro' ? ['#e5402a', '#f2c500', '#1d4fa0'][i] : trim === 'kids' ? [T.p, T.s][i] : null;
      const bm = col ? fin(T, col, trim === 'kids' ? 'foam' : 'gloss') : body;
      mesh(lathe([[0, 0], [R * 0.6, 0], [R * 0.85, R * 0.12], [R, R * 0.6], [R * 0.95, R * 1.1], [R * 0.7, R * 1.45], [R * 0.3, R * 1.62], [0, R * 1.64]], 36), bm, { parent: g, name: 'bell' });
      const hr = trim === 'retro' ? R * 0.11 : R * 0.13;
      curveTube([[-R * 0.55, R * 1.35, 0], [-R * 0.62, R * 1.85, 0], [-R * 0.35, R * 2.15, 0], [0, R * 2.2, 0], [R * 0.35, R * 2.15, 0], [R * 0.62, R * 1.85, 0], [R * 0.55, R * 1.35, 0]], hr, trim === 'pro' ? M.metal('#5a5d62', 0.3) : bm, { parent: g, segments: 32 });
      if (trim === 'retro') mesh(new THREE.CylinderGeometry(R * 0.2, R * 0.2, 0.004, 20), M.metal('#d6b45a'), { parent: g, at: [0, R * 1.62, 0] });
      if (!trim || trim === 'pro') { const em = brandEmblem(R * 0.45); em.position.set(0, R * 0.8, R * 0.995); g.add(em); }
      x += R * 2.4;
    });
  } else if (variant === 'barbell') {
    const L = (trim === 'kids' ? 1.2 : trim === 'retro' ? 1.8 : 2.2), sleeve = L * 0.2;
    const kgs = trim === 'kids' ? [5] : trim === 'pro' ? [25, 20, 10] : trim === 'champion' ? [25, 25, 20] : trim === 'worn' ? [20, 5] : [20, 10];
    const R = kgs[0] >= 10 ? 0.225 : 0.1 + kgs[0] * 0.012;
    const y = R;
    knurl(-L / 2 + sleeve, L / 2 - sleeve, 0.014, y);
    for (const s of [-1, 1]) {
      rodX(s * (L / 2 - sleeve), s * L / 2, 0.025, steel, root, { y });
      mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 24).rotateZ(Math.PI / 2), steel, { parent: root, at: [s * (L / 2 - sleeve), y, 0] });
      let x = L / 2 - sleeve + 0.015;
      for (const kg of kgs) {
        const th = 0.02 + kg * 0.0022;
        plate(root, kg, T, trim, { at: [s * (x + th / 2), y, 0] });
        x += th + 0.002;
      }
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.035, 16).rotateZ(Math.PI / 2), fin(T, trim === 'neon' ? T.a : '#e5402a', 'plastic'), { parent: root, at: [s * (x + 0.018), y, 0], name: 'collar' });
    }
  } else if (variant === 'plate-tree') {
    // A-frame plate tree with plates on horns
    const fm = frameOf(T, trim, '#1c1d20');
    const H = 1.2 * k;
    mesh(roundedBox(0.7 * k, 0.05, 0.7 * k, 0.015), fm, { parent: root, at: [0, 0.025, 0] });
    mesh(roundedBox(0.07, H, 0.07, 0.01), fm, { parent: root, at: [0, H / 2 + 0.05, 0] });
    const kgs = [25, 20, 15, 10, 5, 2.5];
    kgs.forEach((kg, i) => {
      const side = i % 2 ? 1 : -1;
      const y = 0.32 * k + Math.floor(i / 2) * 0.32 * k;
      rodZ(0, side * 0.2, 0.024, M.chrome(), root, { y });
      const pr = kg >= 10 ? 0.225 : 0.1 + kg * 0.012;
      const yy = Math.max(y, pr + 0.052);
      void yy;
      plate(root, kg, T, trim, { at: [0, y, side * (0.06 + 0.02)], axis: 'z' });
    });
    root.children.forEach((c) => { if (c.name === 'plate') { const b = new THREE.Box3().setFromObject(c); if (b.min.y < 0.05) c.position.y += 0.05 - b.min.y; } });
  } else {
    // medicine / slam ball(s)
    const n = trim === 'pro' ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const R = (0.13 + i * 0.015) * k * (trim === 'kids' ? 1.1 : 1);
      const g = group('medball', { parent: root, at: [i * 0.32, R, 0] });
      const bm = trim === 'retro' ? fin(T, '#7a4a28', 'leather') : trim === 'pro' ? fin(T, ['#e5402a', '#1d4fa0', '#f2c500'][i], 'rubber') : trim ? bodyMat(T) : fin(T, '#2a2c31', 'rubber');
      mesh(new THREE.SphereGeometry(R, 32, 24), bm, { parent: g, name: 'ball' });
      const bandM = fin(T, trim ? T.s : '#e5402a', 'rubber');
      mesh(new THREE.TorusGeometry(R * 1.0, R * 0.04, 8, 48), bandM, { parent: g });
      mesh(new THREE.TorusGeometry(R * 1.0, R * 0.04, 8, 48).rotateY(Math.PI / 2), bandM, { parent: g });
      if (trim === 'retro') for (let j = 0; j < 8; j++) mesh(new THREE.TorusGeometry(R * 0.995, 0.002, 4, 48).rotateX(Math.PI / 2), M.matte('#3a2414'), { parent: g, at: [0, R * (j / 8 - 0.45), 0], scale: Math.sqrt(1 - (j / 8 - 0.45) ** 2) });
      if (i === 0 && trim !== 'retro') { const em = brandEmblem(R * 0.4); em.position.set(R * 0.71, 0, R * 0.71); em.rotation.y = Math.PI / 4; g.add(em); }
    }
  }
  return done(root, 'free-weight', variant, o);
}

/* =============================== MACHINES =============================== */

export const MACHINE_VARIANTS = {
  'weight-bench': { p: '#1c1d20' },
  'squat-rack': { p: '#1c1d20' },
  treadmill: { p: '#2a2c31' },
  'exercise-bike': { p: '#2a2c31' },
  'rowing-machine': { p: '#2a2c31' },
};

function screenPanel(parent, w, h, T, trim, at, rot = [0, 0, 0]) {
  const g = group('console', { parent, at, rot });
  mesh(roundedBox(w + 0.04, h + 0.04, 0.04, 0.015), M.plastic('#151618', 0.4), { parent: g });
  const col = trim === 'neon' ? T.p : trim === 'retro' ? '#ff3a2a' : trim === 'champion' ? '#ffd23f' : '#3fc3ff';
  const scr = labelPlane(w, h, (c, W, H) => {
    c.fillStyle = '#05070a'; c.fillRect(0, 0, W, H);
    c.fillStyle = col; c.font = `bold ${H * 0.32}px monospace`; c.textAlign = 'left';
    c.fillText('12:48', W * 0.06, H * 0.42); c.fillText('6.2km', W * 0.06, H * 0.82);
    c.font = `${H * 0.2}px monospace`; c.fillText('142 bpm', W * 0.55, H * 0.42);
    for (let i = 0; i < 10; i++) c.fillRect(W * 0.55 + i * W * 0.04, H * 0.85 - (i % 5 + 2) * H * 0.07, W * 0.03, (i % 5 + 2) * H * 0.07);
  }, { bg: col, emissive: 1.2 });
  scr.position.z = 0.021;
  scr.name = 'screen';
  g.add(scr);
  return g;
}

export function createGymMachine(options = {}) {
  const { o, variant, trim, T } = setup(options, MACHINE_VARIANTS, 'gym-machine');
  const root = group(`gym-machine-${variant}`);
  const item = group('machine', { parent: root });
  if (T.kids) item.scale.setScalar(0.62);
  const fm = frameOf(T, trim, '#1c1d20');
  const pad = padOf(T, trim);
  const anims = [];
  const sq = (a, b, s = 0.06) => { const d = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)); const m = mesh(roundedBox(s, d.length() + s, s, s * 0.18), fm, { parent: item, at: a.map((v, i) => (v + b[i]) / 2) }); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; };

  if (variant === 'weight-bench') {
    const L = 1.25, H = 0.44;
    for (const x of [-L / 2 + 0.1, L / 2 - 0.1]) {
      sq([x, 0.03, -0.25], [x, 0.03, 0.25]);
      mesh(roundedBox(0.07, 0.03, 0.07, 0.01), M.rubber(), { parent: item, at: [x, 0.015, 0.25] });
      mesh(roundedBox(0.07, 0.03, 0.07, 0.01), M.rubber(), { parent: item, at: [x, 0.015, -0.25] });
      sq([x, 0.06, 0], [x, H - 0.08, 0]);
    }
    sq([-L / 2 + 0.1, H - 0.06, 0], [L / 2 - 0.1, H - 0.06, 0]);
    const seat = mesh(cushion(L * 0.38, 0.07, 0.3, { radius: 0.03, bulge: 0.15 }), pad, { parent: item, at: [-L * 0.29, H, 0] });
    seat.name = 'seat';
    const back = group('backrest', { parent: item, at: [-L * 0.08, H, 0] });
    mesh(cushion(L * 0.58, 0.07, 0.3, { radius: 0.03, bulge: 0.15 }), pad, { parent: back, at: [L * 0.29, 0, 0] });
    if (trim !== 'retro' && trim !== 'kids') { back.rotation.z = trim === 'pro' ? 0.5 : 0.25; sq([L * 0.3, 0.05, 0], [L * 0.22, H - 0.06 + Math.sin(back.rotation.z) * L * 0.35 - 0.03, 0]).scale.set(0.7, 1, 0.7); }
    if (T.pattern) mesh(roundedBox(L * 0.96, 0.072, 0.06, 0.02), fin(T, T.s, 'leather'), { parent: item, at: [-L * 0.29 + L * 0.29, H, 0] }).scale.x = 0.3;
    if (trim === 'pro' || trim === 'champion') {
      // barbell uprights
      for (const z of [-0.45, 0.45]) { sq([-L / 2 + 0.1, 0.06, z * 0.56], [-L / 2 + 0.1, 1.1, z]); mesh(roundedBox(0.06, 0.06, 0.12, 0.01), fm, { parent: item, at: [-L / 2 + 0.13, 1.05, z] }); }
      rodZ(-0.45, 0.45, 0.012, fm, item, { x: -L / 2 + 0.1, y: 0.06 + 0.03 });
    }
    if (trim === 'retro') for (const x of [-L / 2 + 0.1, L / 2 - 0.1]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.008, 12), M.metal('#d6b45a'), { parent: item, at: [x, H - 0.026, 0.12] });
  } else if (variant === 'squat-rack') {
    const W = 1.2, D = 1.2, H = trim === 'retro' ? 1.8 : 2.3;
    const posts = trim === 'retro' ? [[-W / 2, 0], [W / 2, 0]] : [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]];
    for (const [x, z] of posts) {
      sq([x, 0.0, z], [x, H, z], 0.075);
      for (let y = 0.25; y < H - 0.1; y += 0.075) mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.078, 8).rotateX(Math.PI / 2), M.matte('#0a0a0a'), { parent: item, at: [x, y, z] });
    }
    if (trim === 'retro') for (const x of [-W / 2, W / 2]) { sq([x, 0.03, -0.5], [x, 0.03, 0.5]); }
    else {
      for (const y of [0.04, H - 0.04]) { sq([-W / 2, y, -D / 2], [W / 2, y, -D / 2], 0.075); sq([-W / 2, y, D / 2], [W / 2, y, D / 2], 0.075); if (y < 1) { sq([-W / 2, y, -D / 2], [-W / 2, y, D / 2], 0.075); sq([W / 2, y, -D / 2], [W / 2, y, D / 2], 0.075); } }
      rodX(-W / 2, W / 2, 0.016, M.chrome(), item, { y: H - 0.2, z: -D / 2 }); // pull-up bar
      for (const x of [-W / 2, W / 2]) rodZ(-D / 2, D / 2, 0.02, M.chrome(), item, { x, y: 0.75 }); // safeties
    }
    // J-hooks + loaded bar
    const zf = trim === 'retro' ? 0 : D / 2;
    for (const x of [-W / 2, W / 2]) mesh(roundedBox(0.09, 0.1, 0.14, 0.015), fm, { parent: item, at: [x, 1.35, zf + 0.09], name: 'jhook' });
    const by = 1.35 + 0.04;
    rodX(-1.1, 1.1, 0.014, M.chrome(), item, { y: by, z: zf + 0.13 });
    for (const s of [-1, 1]) for (const [i, kg] of (trim === 'kids' ? [5] : [20, 10]).entries()) plate(item, kg, T, trim, { at: [s * (0.75 + i * 0.07), by, zf + 0.13] });
    if (T.pattern) for (const [x, z] of posts) mesh(roundedBox(0.08, 0.3, 0.08, 0.012), fin(T, T.s), { parent: item, at: [x, H * 0.5, z] });
    if (!trim || trim === 'pro') { const em = brandEmblem(0.06); em.position.set(-W / 2, 2.0 > H ? H - 0.3 : 2.0, (trim === 'retro' ? 0 : D / 2) + 0.0376); item.add(em); }
    mesh(roundedBox(W + 0.6, 0.02, D + 0.6, 0.008), M.rubber(), { parent: item, at: [0, -0.01, 0] }); // floor mat
  } else if (variant === 'treadmill') {
    const L = 1.9, W = 0.8, deck = 0.22;
    const bodyC = trim ? bodyMat(T, T.pattern ? T.p : T.s === '#101114' ? T.s : T.p) : fin(T, '#2a2c31', 'gloss');
    for (const s of [-1, 1]) mesh(roundedBox(L, deck, 0.1, 0.03), bodyC, { parent: item, at: [0, deck / 2, s * (W / 2 + 0.03)] });
    mesh(roundedBox(0.3, deck + 0.05, W + 0.16, 0.06), bodyC, { parent: item, at: [L / 2 - 0.1, (deck + 0.05) / 2, 0] });
    // belt base + moving slats
    mesh(roundedBox(L - 0.3, 0.03, W - 0.02, 0.012), M.rubber(), { parent: item, at: [-0.1, deck - 0.03, 0] });
    for (const x of [-L / 2 + 0.07, L / 2 - 0.27]) mesh(new THREE.CylinderGeometry(0.04, 0.04, W - 0.02, 20).rotateX(Math.PI / 2), M.metal('#5a5d62'), { parent: item, at: [x, deck - 0.04, 0] });
    const belt = group('belt', { parent: item, at: [-0.1, deck - 0.012, 0] });
    const step = 0.08;
    for (let x = -(L - 0.3) / 2 + 0.02; x < (L - 0.3) / 2 - 0.02 - step; x += step) mesh(new THREE.BoxGeometry(0.035, 0.004, W - 0.06), M.matte('#2a2a2c'), { parent: belt, at: [x, 0, 0] });
    anims.push(() => clip('run', 0.5, [moveTrack(belt, 0.5, (t) => [-t * step, 0, 0], 8)]));
    // uprights + console + handles
    const fx = L / 2 - 0.15;
    const ch = trim === 'retro' ? 1.15 : 1.35;
    for (const s of [-1, 1]) curveTube([[fx, deck, s * (W / 2 + 0.03)], [fx + 0.08, ch * 0.6, s * (W / 2 + 0.02)], [fx + 0.02, ch, s * (W / 2 - 0.05)]], 0.03, fm, { parent: item, segments: 16 });
    for (const s of [-1, 1]) curveTube([[fx + 0.02, ch - 0.25, s * (W / 2 - 0.02)], [fx - 0.35, ch - 0.28, s * (W / 2 - 0.02)]], 0.02, M.rubber(), { parent: item, segments: 4 });
    const con = screenPanel(item, trim === 'pro' ? 0.5 : 0.36, trim === 'pro' ? 0.3 : 0.18, T, trim, [fx + 0.05, ch + 0.04, 0], [0, -Math.PI / 2, 0]);
    con.rotateX(-0.4);
    mesh(roundedBox(0.12, 0.12, W - 0.05, 0.03), bodyC, { parent: item, at: [fx + 0.03, ch - 0.06, 0] });
    if (T.pattern) for (const s of [-1, 1]) mesh(roundedBox(L * 0.8, 0.04, 0.101, 0.01), fin(T, T.s), { parent: item, at: [-0.1, deck * 0.6, s * (W / 2 + 0.03)] });
    anims.push(() => clip('on', 1, [new THREE.NumberKeyframeTrack('screen.material.emissiveIntensity', [0, 1], [2.2, 2.2])]));
  } else if (variant === 'exercise-bike') {
    const L = 1.1;
    // stabilizer feet + main frame
    for (const x of [-L / 2, L / 2]) { mesh(roundedBox(0.08, 0.06, 0.55, 0.025), fm, { parent: item, at: [x, 0.03, 0] }); for (const z of [-0.25, 0.25]) mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 12), M.rubber(), { parent: item, at: [x, 0.006, z] }); }
    curveTube([[-L / 2, 0.06, 0], [-0.1, 0.25, 0], [0.25, 0.45, 0], [0.35, 1.0, 0]], 0.04, fm, { parent: item, segments: 24 });
    curveTube([[L / 2, 0.06, 0], [0.1, 0.25, 0], [-0.2, 0.5, 0], [-0.3, 0.85, 0]], 0.035, fm, { parent: item, segments: 24 });
    // flywheel (front, spins)
    const fw = group('flywheel', { parent: item, at: [0.38, 0.32, 0] });
    mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 40).rotateX(Math.PI / 2), trim === 'retro' ? M.metal('#c8102e', 0.4) : M.metal('#bfc3c8', 0.25), { parent: fw });
    for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(0.4, 0.02, 0.052), M.metal('#5a5d62'), { parent: fw, rot: [0, 0, (i * Math.PI) / 6] });
    mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.012, 40, 1, true).rotateX(Math.PI / 2), bodyMat(T, trim ? T.p : '#e5402a'), { parent: fw });
    // guard + crank + pedals
    const crank = group('crank', { parent: item, at: [0.02, 0.36, 0] });
    mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 24).rotateX(Math.PI / 2), M.metal('#5a5d62'), { parent: crank });
    for (const s of [-1, 1]) {
      mesh(roundedBox(0.03, 0.18, 0.02, 0.008), M.metal('#2a2c31'), { parent: crank, at: [0, s * 0.08, s * 0.06], name: 'arm' });
      mesh(roundedBox(0.11, 0.025, 0.08, 0.008), M.plastic('#151515'), { parent: crank, at: [0, s * 0.16, s * 0.1], name: 'pedal' });
    }
    bar([0.02, 0.36, 0], [0.38, 0.32, 0], 0.015, M.metal('#2a2c31'), item);
    anims.push(() => clip('pedal', 1, [spinTrack(crank, 'z', 1, -1), spinTrack(fw, 'z', 0.35, -1)]));
    // seat post + saddle
    bar([-0.3, 0.85, 0], [-0.33, 1.0, 0], 0.025, M.chrome(), item);
    const seat = mesh(cushion(0.28, 0.07, trim === 'kids' ? 0.2 : 0.17, { radius: 0.03 }), pad, { parent: item, at: [-0.34, 1.03, 0], name: 'saddle' });
    seat.scale.set(1, 1, 1);
    // handlebars + console
    bar([0.35, 1.0, 0], [0.42, 1.12, 0], 0.025, M.chrome(), item);
    curveTube([[0.42, 1.12, -0.25], [0.3, 1.16, -0.22], [0.42, 1.14, 0], [0.3, 1.16, 0.22], [0.42, 1.12, 0.25]], 0.016, M.rubber(), { parent: item, segments: 24 });
    screenPanel(item, 0.18, 0.12, T, trim, [0.45, 1.2, 0], [0, Math.PI / 2, 0]).rotateX(-0.6);
    if (trim === 'retro') mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 20).rotateZ(Math.PI / 2), M.chrome(), { parent: item, at: [0.44, 1.18, 0] });
  } else {
    // rowing machine: rail, sliding seat, flywheel fan, handle
    const L = 2.4;
    const railM = trim === 'retro' ? M.wood('#a67c4f') : fm;
    mesh(roundedBox(L - 0.4, 0.06, 0.12, 0.02), railM, { parent: item, at: [-0.15, 0.32, 0] });
    mesh(roundedBox(0.08, 0.04, 0.5, 0.015), fm, { parent: item, at: [-L / 2 + 0.1, 0.02, 0] });
    mesh(roundedBox(0.1, 0.27, 0.08, 0.02), fm, { parent: item, at: [-L / 2 + 0.12, 0.17, 0] });
    // flywheel housing
    const fx = L / 2 - 0.3;
    mesh(roundedBox(0.3, 0.06, 0.55, 0.02), fm, { parent: item, at: [fx, 0.03, 0] });
    const hous = trim === 'retro' ? M.wood('#a67c4f') : trim ? bodyMat(T) : fin(T, '#2a2c31', 'gloss');
    mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.2, 40).rotateX(Math.PI / 2), hous, { parent: item, at: [fx, 0.38, 0] });
    const fan = group('fan', { parent: item, at: [fx, 0.38, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CircleGeometry(0.22, 32), M.glass({ tint: '#20262c', opacity: 0.85 }), { parent: fan, at: [0, 0, s * 0.101], rot: [0, s > 0 ? 0 : Math.PI, 0] });
    for (let i = 0; i < 8; i++) mesh(new THREE.BoxGeometry(0.4, 0.04, 0.16), M.metal('#7a7d82'), { parent: fan, rot: [0, 0, (i * Math.PI) / 8] });
    mesh(roundedBox(0.3, 0.2, 0.12, 0.03), fm, { parent: item, at: [fx - 0.2, 0.35, 0] });
    screenPanel(item, 0.16, 0.12, T, trim, [fx - 0.35, 0.82, 0], [0, -Math.PI / 2 + 0.0, 0]).rotateX(-0.3);
    bar([fx - 0.25, 0.4, 0], [fx - 0.35, 0.8, 0], 0.02, fm, item);
    // footrests
    for (const s of [-1, 1]) mesh(roundedBox(0.2, 0.03, 0.12, 0.01), M.plastic('#151515'), { parent: item, at: [fx - 0.5, 0.42, s * 0.11], rot: [0, 0, 0.7] });
    // seat (slides)
    const seat = group('seat', { parent: item, at: [-0.35, 0.35, 0] });
    mesh(roundedBox(0.2, 0.04, 0.16, 0.01), M.metal('#5a5d62'), { parent: seat, at: [0, 0.0, 0] });
    mesh(cushion(0.3, 0.06, 0.28, { radius: 0.025 }), pad, { parent: seat, at: [0, 0.05, 0] });
    // handle on a chain (sits in its holder)
    const handle = group('handle', { parent: item, at: [fx - 0.38, 0.5, 0] });
    mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 12).rotateX(Math.PI / 2), M.rubber(), { parent: handle });
    bar([fx - 0.38, 0.5, 0], [fx - 0.2, 0.4, 0], 0.004, M.chrome(), item);
    anims.push(() => clip('row', 2.5, [moveTrack(seat, 2.5, (t) => [-wave(t * 0.5 + 0.25, 1) * 0 + (0.5 - 0.5 * Math.cos(t * Math.PI * 2)) * 0.6 - 0.0, 0, 0], 24), spinTrack(fan, 'z', 0.5, -1)]));
  }
  return done(root, 'gym-machine', variant, o, () => anims.map((f) => f()));
}

/* =============================== FITNESS GEAR =============================== */

export const FITNESS_VARIANTS = {
  'yoga-mat': { p: '#7a5ec8' },
  'punching-bag': { p: '#c8102e' },
  'foam-roller': { p: '#1d4fa0' },
  'exercise-ball': { p: '#9aa6b2' },
  'plyo-box': { p: '#1c1d20' },
};

export function createFitnessGear(options = {}) {
  const { o, variant, trim, T, V } = setup(options, FITNESS_VARIANTS, 'fitness-gear');
  const root = group(`fitness-gear-${variant}`);
  const k = T.kids ? 0.65 : 1;
  const main = trim ? (trim === 'retro' ? fin(T, '#7a4a28', 'leather') : trim === 'champion' ? M.metal('#d6a93c', 0.25) : bodyMat(T)) : fin(T, V.p, 'gloss');
  const anims = [];
  if (variant === 'yoga-mat') {
    // half unrolled mat with the roll at one end
    const W = 0.61 * (T.kids ? 0.8 : 1), L = 1.4 * k, th = trim === 'pro' ? 0.008 : trim === 'kids' ? 0.012 : 0.005;
    const mm = trim === 'retro' ? M.fabric('#c9a77a') : trim ? fin(T, T.pattern ? T.p : T.p, 'rubber') : fin(T, V.p, 'rubber');
    mesh(roundedBox(L, th, W, th * 0.45), mm, { parent: root, at: [0, th / 2, 0], name: 'mat' });
    const R = 0.06 * (trim === 'pro' ? 1.2 : 1);
    const roll = mesh(new THREE.CylinderGeometry(R, R, W, 32).rotateX(Math.PI / 2), mm, { parent: root, at: [L / 2 + R - 0.02, R, 0], name: 'roll' });
    mesh(new THREE.TorusGeometry(R * 0.6, R * 0.25, 8, 28), M.matte('#2a2a2c'), { parent: roll, at: [0, 0, W / 2 - 0.0], scale: [1, 1, 0.15] }).scale.set(1, 1, 0.1);
    if (T.pattern || trim === 'neon') for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(0.03, 0.001, W * 0.9), fin(T, T.s, 'rubber'), { parent: root, at: [-L / 2 + 0.15 + i * 0.22, th + 0.0005, 0] });
    if (trim === 'retro' || trim === 'pro') {
      // strap + block
      mesh(roundedBox(0.23, 0.08, 0.15, 0.015), fin(T, trim === 'retro' ? '#c79a5e' : T.a, trim === 'retro' ? 'wood' : 'foam'), { parent: root, at: [-L / 2 + 0.2, th + 0.04, W * 0.2], name: 'block' });
    }
    if (trim === 'kids') for (let i = 0; i < 5; i++) mesh(new THREE.CircleGeometry(0.06, 24).rotateX(-Math.PI / 2), fin(T, [T.a, T.s, '#4ccb52', '#ffffff', T.a][i], 'rubber'), { parent: root, at: [-L / 2 + 0.15 + i * 0.25, th + 0.0006, (i % 2 ? 1 : -1) * 0.12] });
  } else if (variant === 'punching-bag') {
    const H = 1.2 * k, R = 0.18 * k;
    // freestanding bag stand
    const sm = trim === 'champion' ? M.metal('#d6a93c', 0.2) : M.metal(trim === 'stealth' ? '#1c1d20' : '#2a2c31', 0.4);
    const top = H + 0.9 * k;
    const px = -0.7 * k;
    mesh(roundedBox(0.9 * k, 0.06, 0.9 * k, 0.02), sm, { parent: root, at: [px, 0.03, 0] });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 24), fin(T, '#1b1b1b', 'rubber'), { parent: root, at: [px, 0.12, s * 0.3 * k] });
    mesh(roundedBox(0.07, top, 0.07, 0.012), sm, { parent: root, at: [px, top / 2, 0] });
    mesh(roundedBox(-px + 0.05, 0.07, 0.07, 0.012), sm, { parent: root, at: [px / 2, top, 0] });
    const swing = group('swing', { parent: root, at: [0, top - 0.035, 0] });
    for (const a of [0, 2.1, 4.2]) curveTube([[0, 0, 0], [Math.cos(a) * R * 0.7, -0.35 * k, Math.sin(a) * R * 0.7]], 0.004, M.chrome(), { parent: swing, segments: 2 });
    mesh(new THREE.TorusGeometry(0.02, 0.004, 6, 12), M.chrome(), { parent: swing, at: [0, -0.01, 0] });
    const bagY = -0.35 * k - H / 2;
    const shape = trim === 'retro' ? [[0, -H / 2], [R * 0.6, -H / 2], [R, -H * 0.3], [R * 1.05, 0], [R, H * 0.3], [R * 0.7, H / 2], [0, H / 2]] : [[0, -H / 2], [R * 0.85, -H / 2], [R, -H / 2 + 0.04], [R, H / 2 - 0.04], [R * 0.85, H / 2], [0, H / 2]];
    mesh(lathe(shape, 36), main, { parent: swing, at: [0, bagY, 0], name: 'bag' });
    if (trim !== 'retro') for (const y of [-H * 0.3, H * 0.3]) mesh(new THREE.CylinderGeometry(R * 1.005, R * 1.005, 0.05, 36, 1, true), fin(T, trim ? T.s : '#151515', 'leather'), { parent: swing, at: [0, bagY + y, 0] });
    if (T.pattern) mesh(new THREE.CylinderGeometry(R * 1.006, R * 1.006, H * 0.3, 36, 1, true), fin(T, T.s, 'leather'), { parent: swing, at: [0, bagY, 0] });
    if (trim !== 'retro') { const em = brandEmblem(R * 0.5); em.position.set(0, bagY + H * 0.12, R * 1.005); swing.add(em); }
    anims.push(() => clip('swing', 2, [rotateTrack(swing, 'z', 2, (t) => wave(t) * 0.18), rotateTrack(swing, 'x', 2, (t) => wave(t, 2) * 0.03)]));
    // gloves on the base
    for (const s of [-1, 1]) { const g = mesh(new THREE.SphereGeometry(0.07 * k, 16, 12), fin(T, trim ? T.p : '#c8102e', 'leather'), { parent: root, at: [px + 0.25 * k, 0.06 + 0.05 * k, s * 0.16 * k], name: 'glove' }); g.scale.set(1.2, 0.75, 0.9); }
  } else if (variant === 'foam-roller') {
    const n = trim === 'pro' ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const R = (i ? 0.065 : 0.075) * k, L = (i ? 0.33 : 0.45) * k;
      const g = group('roller', { parent: root, at: [0, R, i * 0.25] });
      const rm = trim === 'retro' ? M.wood('#c79a5e') : trim ? bodyMat(T, i ? T.s : T.p) : fin(T, V.p, 'foam');
      if (trim === 'retro') {
        // wooden massage roller with rings
        mesh(new THREE.CylinderGeometry(R * 0.4, R * 0.4, L, 16).rotateZ(Math.PI / 2), rm, { parent: g });
        for (let j = 0; j < 9; j++) mesh(new THREE.SphereGeometry(R * 0.9, 16, 10), rm, { parent: g, at: [-L / 2 + 0.03 + j * (L - 0.06) / 8, 0, 0], scale: [0.35, 1, 1] });
      } else {
        mesh(new THREE.CylinderGeometry(R, R, L, 40, 1, true).rotateZ(Math.PI / 2), rm, { parent: g, name: 'foam' });
        mesh(new THREE.CylinderGeometry(R * 0.55, R * 0.55, L, 24, 1, true).rotateZ(Math.PI / 2), M.plastic('#151515'), { parent: g });
        for (const s of [-1, 1]) mesh(new THREE.RingGeometry(R * 0.55, R, 40).rotateY(s * Math.PI / 2), rm, { parent: g, at: [s * L / 2, 0, 0] });
        // grid nubs
        for (let j = 0; j < 7; j++) for (let a = 0; a < 12; a++) { const an = (a / 12) * Math.PI * 2 + (j % 2) * 0.26; mesh(roundedBox(0.03, 0.012, 0.03, 0.004), rm, { parent: g, at: [-L / 2 + 0.04 + j * (L - 0.08) / 6, Math.cos(an) * R, Math.sin(an) * R], rot: [an, 0, 0] }); }
      }
    }
  } else if (variant === 'exercise-ball') {
    const R = (trim === 'pro' ? 0.375 : 0.325) * k;
    const bm = trim === 'retro' ? fin(T, '#c8102e', 'gloss') : trim ? bodyMat(T) : new THREE.MeshPhysicalMaterial({ color: M.toColor(V.p), roughness: 0.35, clearcoat: 0.6 });
    const ball = mesh(new THREE.SphereGeometry(R, 48, 32), bm, { parent: root, at: [0, R * 0.97, 0], name: 'ball' });
    ball.scale.set(1.01, 0.97, 1.01);
    if (T.pattern) for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) mesh(new THREE.TorusGeometry(R * 1.001, R * 0.03, 6, 64).rotateY(a), fin(T, T.s), { parent: ball });
    for (let i = 0; i < 8; i++) mesh(new THREE.TorusGeometry(R * 0.998, 0.0012, 4, 64).rotateY((i * Math.PI) / 8), fin(T, '#000000', 'matte'), { parent: ball }).material.opacity = 1;
    if (trim === 'kids') for (const s of [-1, 1]) curveTube([[s * R * 0.25, R * 0.95, 0], [s * R * 0.35, R * 1.25, 0], [s * R * 0.1, R * 1.32, 0], [0, R * 1.0, 0]], R * 0.04, bm, { parent: ball, segments: 16 }); // hopper handles
    if (trim === 'pro') { const base = mesh(new THREE.TorusGeometry(R * 0.35, R * 0.06, 10, 32).rotateX(Math.PI / 2), M.plastic('#151515'), { parent: root, at: [0, R * 0.06, 0] }); void base; ball.position.y = R * 0.06 + Math.sqrt(R * R - (R * 0.35) ** 2) * 0.97 + R * 0.03; }
  } else {
    // plyo box (soft foam or wooden)
    const sizes = trim === 'pro' ? [[0.76, 0.6], [0.61, 0.5], [0.51, 0.4]] : [[0.76 * k, 0.6 * k]];
    let y = 0;
    sizes.forEach(([h, w], i) => {
      const bm = trim === 'retro' || (!trim) ? M.wood('#c79a5e') : trim === 'pro' ? fin(T, ['#1c1d20', '#e5402a', '#1c1d20'][i], 'foam') : bodyMat(T);
      const d = w * 1.25;
      if (!trim || trim === 'retro') {
        mesh(roundedBox(w, h, d, 0.01), bm, { parent: root, at: [0, y + h / 2, 0], name: 'box' });
        for (const s of [-1, 1]) mesh(roundedBox(0.12, 0.035, 0.004, 0.015), M.matte('#2a1a10'), { parent: root, at: [0, y + h * 0.7, s * (d / 2 + 0.001)] });
      } else mesh(cushion(w, h, d, { radius: 0.04, bulge: 0.04 }), bm, { parent: root, at: [0, y + h / 2, 0], name: 'box' });
      if (T.pattern) mesh(roundedBox(w + 0.004, h * 0.2, d + 0.004, 0.01), fin(T, T.s, 'foam'), { parent: root, at: [0, y + h * 0.5, 0] });
      y += h;
    });
  }
  return done(root, 'fitness-gear', variant, o, () => anims.map((f) => f()));
}
