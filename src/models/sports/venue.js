// Trophies & medals, scoreboards (emissive), bleachers and ball machines.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, extrudeOutline, setup, done, fin, bodyMat, bar, labelPlane, plinth, rodX, rodY } from './common.js';
import { clip, spinTrack, numberTrack, rotateTrack } from '../../core/animation.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { brandEmblem } from '../../core/brand.js';
import { buildBall } from './balls.js';

/* ================================ TROPHIES ================================ */

export const TROPHY_VARIANTS = {
  cup: {}, figure: {}, star: {}, 'medal-display': {}, shield: {},
};

function trophyMetal(trim, T) {
  if (trim === 'pro') return M.metal('#d5d8dd', 0.15);
  if (trim === 'retro') return M.metal('#a8673a', 0.35);
  if (trim === 'worn') return M.metal('#8f7a4a', 0.65);
  if (trim === 'stealth') return new THREE.MeshPhysicalMaterial({ color: '#1c1d20', metalness: 1, roughness: 0.2, clearcoat: 1 });
  if (trim === 'kids') return fin(T, T.p, 'plastic');
  if (trim === 'neon') return fin(T, T.p, 'neon');
  return M.metal('#d6a93c', 0.18);
}

export function createTrophy(options = {}) {
  const { o, variant, trim, T } = setup(options, TROPHY_VARIANTS, 'trophy');
  const root = group(`trophy-${variant}`);
  const k = trim === 'champion' ? 1.8 : trim === 'kids' ? 0.75 : 1;
  const gm = trophyMetal(trim, T);
  const baseM = trim === 'retro' ? M.wood('walnut') : trim === 'kids' ? fin(T, T.s, 'plastic') : trim === 'neon' ? fin(T, '#101114', 'gloss') : T.pattern ? fin(T, T.p, 'gloss') : trim === 'pro' ? new THREE.MeshPhysicalMaterial({ color: '#f2f2f2', roughness: 0.15, transmission: 0, clearcoat: 1 }) : M.plastic('#151515', 0.25);
  // stepped base
  let y = 0;
  const tiers = trim === 'champion' || trim === 'pro' ? 3 : trim === 'kids' ? 1 : 2;
  for (let i = 0; i < tiers; i++) {
    const w = (0.16 - i * 0.03) * k, h = 0.045 * k;
    if (trim === 'retro' || variant === 'shield') mesh(roundedBox(w, h, w, 0.006 * k), baseM, { parent: root, at: [0, y + h / 2, 0] });
    else mesh(lathe([[0, 0], [w / 2, 0], [w / 2, h * 0.15], [w * 0.47, h * 0.3], [w * 0.47, h], [0, h]], 6).rotateY(Math.PI / 6 * 0 + Math.PI / 4), baseM, { parent: root, at: [0, y, 0] });
    y += h;
  }
  const pl = mesh(roundedBox(0.08 * k, 0.025 * k, 0.002, 0.0008), M.metal('#d6b45a', 0.25), { parent: root, at: [0, 0.045 * k * 0.6, (trim === 'retro' || variant === 'shield' ? 0.16 * k / 2 : 0.16 * k * 0.47 * Math.cos(Math.PI / 4) * 1.0) + 0.0012], name: 'plate' });
  void pl;
  if (T.pattern) mesh(roundedBox(0.161 * k, 0.012 * k, 0.161 * k, 0.003), fin(T, T.s), { parent: root, at: [0, 0.045 * k * 0.5, 0] }).scale.set(trim === 'retro' ? 1 : 0.94, 1, trim === 'retro' ? 1 : 0.94);

  if (variant === 'cup') {
    const H = 0.3 * k;
    const prof = [[0.035 * k, 0], [0.02 * k, 0.02 * k], [0.012 * k, 0.06 * k], [0.03 * k, 0.09 * k], [0.012 * k, 0.11 * k], [0.03 * k, 0.13 * k], [0.075 * k, H * 0.75], [0.09 * k, H], [0.086 * k, H], [0.07 * k, H * 0.76], [0.0, 0.135 * k]];
    mesh(lathe(prof, 48), gm, { parent: root, at: [0, y, 0], name: 'cup' }).material.side = THREE.DoubleSide;
    for (const s of [-1, 1]) curveTube([[s * 0.06 * k, y + H * 0.85, 0], [s * 0.13 * k, y + H * 0.85, 0], [s * 0.12 * k, y + H * 0.55, 0], [s * 0.05 * k, y + H * 0.45, 0]], 0.008 * k, gm, { parent: root, segments: 24 });
    if (trim === 'champion' || trim === 'pro') { mesh(lathe([[0.0, 0], [0.09 * k, 0], [0.06 * k, 0.03 * k], [0.012 * k, 0.04 * k], [0.02 * k, 0.06 * k], [0, 0.065 * k]], 40), gm, { parent: root, at: [0, y + H - 0.004, 0], name: 'lid' }); }
    if (T.pattern) for (const s of [-1, 1]) curveTube([[s * 0.09 * k, y + H * 0.85, 0.0], [s * 0.1 * k, y + H * 0.5, 0.02], [s * 0.095 * k, y + H * 0.2, 0.03]], 0.012 * k, fin(T, s > 0 ? T.p : T.s, 'fabric'), { parent: root, segments: 12 }).scale.z = 0.25;
  } else if (variant === 'figure') {
    // stylised athlete on a column
    mesh(new THREE.CylinderGeometry(0.03 * k, 0.03 * k, 0.12 * k, 6), trim === 'kids' ? fin(T, T.a, 'plastic') : gm, { parent: root, at: [0, y + 0.06 * k, 0] });
    const fy = y + 0.12 * k;
    mesh(new THREE.CylinderGeometry(0.04 * k, 0.04 * k, 0.008 * k, 24), gm, { parent: root, at: [0, fy + 0.004 * k, 0] });
    const f = group('figure', { parent: root, at: [0, fy + 0.008 * k, 0] });
    const s = 0.16 * k;
    curveTube([[-0.02 * s, 0, 0], [-0.02 * s, 0.25 * s, 0], [0, 0.45 * s, 0]], 0.035 * s, gm, { parent: f, segments: 8 });
    curveTube([[0.12 * s, 0.02 * s, 0], [0.08 * s, 0.25 * s, 0.05 * s], [0, 0.45 * s, 0]], 0.035 * s, gm, { parent: f, segments: 8 });
    mesh(new THREE.CapsuleGeometry(0.07 * s, 0.25 * s, 6, 12), gm, { parent: f, at: [0, 0.62 * s, 0], rot: [0, 0, -0.1] });
    mesh(new THREE.SphereGeometry(0.075 * s, 16, 12), gm, { parent: f, at: [0.02 * s, 0.92 * s, 0] });
    curveTube([[0.04 * s, 0.75 * s, 0], [0.18 * s, 0.9 * s, 0], [0.22 * s, 1.15 * s, 0]], 0.028 * s, gm, { parent: f, segments: 8 });
    curveTube([[-0.04 * s, 0.75 * s, 0], [-0.17 * s, 0.6 * s, 0], [-0.2 * s, 0.45 * s, 0.05 * s]], 0.028 * s, gm, { parent: f, segments: 8 });
    const b = mesh(new THREE.SphereGeometry(0.07 * s, 16, 12), gm, { parent: f, at: [0.22 * s, 1.24 * s, 0] });
    void b;
  } else if (variant === 'star') {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5; const r = (i % 2 ? 0.045 : 0.11) * k; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    mesh(new THREE.CylinderGeometry(0.01 * k, 0.018 * k, 0.12 * k, 16), gm, { parent: root, at: [0, y + 0.06 * k, 0] });
    mesh(extrudeOutline(pts, 0.03 * k, { bevel: 0.008 * k }), gm, { parent: root, at: [0, y + 0.12 * k + 0.045 * k - 0.006, 0], name: 'star' });
    if (trim === 'neon' || trim === 'champion') { const em = brandEmblem(0.04 * k); em.position.set(0, y + 0.165 * k, 0.0151 * k); root.add(em); }
  } else if (variant === 'shield') {
    const pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([0.11 * k * (t < 0.5 ? 1 : Math.cos((t - 0.5) * Math.PI) ** 0.6) * (1), 0.28 * k * (1 - t)]); }
    const sh = [...pts.map(([x, yy]) => [x, yy]), ...pts.slice().reverse().map(([x, yy]) => [-x, yy])];
    mesh(extrudeOutline(sh, 0.025 * k, { bevel: 0.006 * k }), trim === 'retro' ? M.wood('walnut') : baseM, { parent: root, at: [0, y, 0], rot: [-0.15, 0, 0] });
    mesh(extrudeOutline(sh.map(([x, yy]) => [x * 0.8, yy * 0.82 + 0.025 * k]), 0.01 * k, { bevel: 0.003 * k }), gm, { parent: root, at: [0, y, 0.02 * k], rot: [-0.15, 0, 0] });
  } else {
    // medal display: stand with gold/silver/bronze medals on ribbons
    const W = (0.16 - (tiers - 1) * 0.03 - 0.025) * k, H = 0.42 * k;
    const sm = trim === 'retro' ? M.wood('walnut') : baseM;
    for (const s of [-1, 1]) mesh(roundedBox(0.02 * k, H, 0.02 * k, 0.004), sm, { parent: root, at: [s * W / 2, y + H / 2, 0] });
    mesh(new THREE.CylinderGeometry(0.008 * k, 0.008 * k, W + 0.03 * k, 12).rotateZ(Math.PI / 2), M.chrome(), { parent: root, at: [0, y + H - 0.02 * k, 0] });
    const metals = trim ? [gm, gm, gm] : [M.metal('#d6a93c', 0.2), M.metal('#c9ccd2', 0.2), M.metal('#a8673a', 0.3)];
    const rib = [[T.p, T.s], [T.s, T.a ?? T.p], [T.a ?? T.s, T.p]];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * W * 0.36;
      const top = y + H - 0.02 * k;
      const L = H * (0.55 + (i === 1 ? 0 : 0.08));
      for (const s of [-1, 1]) {
        const rm = fin(T, trim ? rib[i][s > 0 ? 0 : 1] : ['#c8102e', '#1d4fa0', '#1a8a3a'][i], 'fabric');
        mesh(roundedBox(0.022 * k, L, 0.002, 0.0008), rm, { parent: root, at: [x + s * 0.012 * k, top - L / 2 + 0.008 * k, 0.009 * k + 0.001], rot: [0, 0, s * 0.12] });
      }
      const md = group('medal', { parent: root, at: [x, top - L - 0.025 * k, 0.012 * k] });
      mesh(new THREE.CylinderGeometry(0.035 * k, 0.035 * k, 0.006 * k, 32).rotateX(Math.PI / 2), metals[i], { parent: md });
      mesh(new THREE.TorusGeometry(0.03 * k, 0.003 * k, 6, 32), metals[i], { parent: md, at: [0, 0, 0.003 * k] });
      mesh(new THREE.TorusGeometry(0.006 * k, 0.0015 * k, 6, 12), metals[i], { parent: md, at: [0, 0.036 * k, 0] });
    }
  }
  return done(root, 'trophy', variant, o);
}

/* =============================== SCOREBOARDS =============================== */

export const SCOREBOARD_VARIANTS = {
  digital: {}, 'flip-card': {}, stadium: {},
};

function scoreDraw(T, trim, wide) {
  const col = trim === 'neon' ? T.p : trim === 'retro' ? '#ffb020' : trim === 'champion' ? '#ffd23f' : '#ff3a2a';
  const col2 = trim === 'neon' ? T.a : trim === 'stealth' ? '#9aa6b2' : '#3fc3ff';
  return (c, W, H) => {
    c.fillStyle = '#05060a'; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#e8e8e8'; c.font = `bold ${H * 0.13}px sans-serif`;
    c.fillText('HOME', W * 0.2, H * 0.15); c.fillText('GUEST', W * 0.8, H * 0.15);
    c.fillStyle = col; c.font = `bold ${H * 0.42}px monospace`;
    c.fillText('3', W * 0.2, H * 0.52); c.fillText('1', W * 0.8, H * 0.52);
    c.fillStyle = col2; c.font = `bold ${H * 0.24}px monospace`;
    c.fillText('12:48', W * 0.5, H * 0.4);
    c.font = `bold ${H * 0.12}px sans-serif`; c.fillStyle = '#e8e8e8'; c.fillText(wide ? 'PERIOD 2' : 'P2', W * 0.5, H * 0.72);
    c.fillStyle = col; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(W * (0.1 + i * 0.05), H * 0.88, H * 0.025, 0, 7); c.fill(); }
  };
}

export function createScoreboard(options = {}) {
  const { o, variant, trim, T } = setup(options, SCOREBOARD_VARIANTS, 'scoreboard');
  const root = group(`scoreboard-${variant}`);
  const k = T.kids ? 0.6 : trim === 'pro' ? 1.25 : 1;
  const cab = trim === 'retro' ? M.wood('#2f5a3a') : trim === 'champion' ? M.metal('#d6a93c', 0.25) : trim ? bodyMat(T, T.pattern ? T.p : trim === 'neon' ? '#101114' : T.p === '#f3f3f1' ? '#1c1d20' : T.p) : M.plastic('#141416', 0.35);
  const anims = [];
  const lamps = lampGroup('scorelights', trim === 'neon' ? 'green' : 'amber');
  if (variant === 'flip-card') {
    // manual tabletop flip scoreboard (A-frame) with number cards
    const W = 0.42 * k, H = 0.3 * k;
    const fm = trim === 'retro' ? M.wood('#a67c4f') : cab;
    for (const s of [-1, 1]) mesh(roundedBox(W, 0.012, 0.32 * k, 0.004), fm, { parent: root, at: [0, 0.006, 0] }).visible = s > 0;
    for (const s of [-1, 1]) {
      const leg = mesh(roundedBox(W, H, 0.012, 0.004), fm, { parent: root, at: [0, H / 2 * Math.cos(0.3) + 0.012, s * H / 2 * Math.sin(0.3)], rot: [s * 0.3, 0, 0] });
      void leg;
    }
    rodX(-W / 2, W / 2, 0.006 * k, M.chrome(), root, { y: H * Math.cos(0.3) + 0.012 });
    // cards hanging on the front face
    const cardCol = [trim ? T.p : '#c8102e', trim ? T.s : '#1d4fa0'];
    for (let i = 0; i < 2; i++) {
      const x = (i - 0.5) * W * 0.5;
      const card = labelPlane(W * 0.42, H * 0.75, (c, Wc, Hc) => { c.fillStyle = cardCol[i]; c.fillRect(0, 0, Wc, Hc); c.fillStyle = '#ffffff'; c.font = `bold ${Hc * 0.7}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(i ? '1' : '3', Wc / 2, Hc * 0.55); }, { bg: cardCol[i] });
      card.position.set(x, H * Math.cos(0.3) * 0.55 + 0.012, H / 2 * Math.sin(0.3) + 0.012);
      card.rotation.x = 0.3 - Math.PI * 0;
      card.position.z = (H * Math.cos(0.3) * 0.45) * Math.tan(0.3) + 0.008;
      card.name = 'card';
      root.add(card);
    }
    return done(root, 'scoreboard', variant, o);
  }
  if (variant === 'digital') {
    // wall-style board on twin legs (gym / field)
    const W = 2.4 * k, H = 1.2 * k, legH = 1.4 * k;
    const lm = M.metal(trim === 'stealth' ? '#1c1d20' : '#5a5d62', 0.4);
    for (const s of [-1, 1]) { mesh(roundedBox(0.1 * k, legH + H * 0.5, 0.1 * k, 0.015), lm, { parent: root, at: [s * W * 0.35, (legH + H * 0.5) / 2, -0.1 * k] }); mesh(roundedBox(0.5 * k, 0.04, 0.5 * k, 0.01), lm, { parent: root, at: [s * W * 0.35, 0.02, -0.1 * k] }); }
    const board = group('board', { parent: root, at: [0, legH + H / 2, 0] });
    mesh(roundedBox(W, H, 0.14 * k, 0.03 * k), cab, { parent: board });
    const scr = labelPlane(W * 0.92, H * 0.8, scoreDraw(T, trim, true), { bg: '#ff3a2a', emissive: 1.4, px: 512 });
    scr.position.set(0, -H * 0.04, 0.07 * k + 0.001);
    scr.name = 'screen';
    board.add(scr);
    for (const s of [-1, 1]) lamps.add(board, { at: [s * W * 0.42, H * 0.42, 0.07 * k], normal: [0, 0, 1], w: 0.08 * k, h: 0.08 * k, shape: 'round' });
    if (T.pattern) mesh(roundedBox(W + 0.01, H * 0.1, 0.142 * k, 0.01), fin(T, T.s), { parent: board, at: [0, H * 0.45, 0] });
    if (trim === 'pro' || !trim) { const em = brandEmblem(0.12 * k); em.position.set(0, H * 0.43, 0.071 * k); board.add(em); }
  } else {
    // stadium video board on pylons
    const W = 8 * k, H = 3.6 * k, pyl = 4 * k;
    const pm = trim === 'retro' ? M.matte('#9a9a94') : M.metal(trim === 'stealth' ? '#1c1d20' : '#c9ccd2', 0.4);
    for (const s of [-1, 1]) { mesh(roundedBox(0.5 * k, pyl + H * 0.6, 0.5 * k, 0.05), pm, { parent: root, at: [s * W * 0.32, (pyl + H * 0.6) / 2, -0.5 * k] }); mesh(roundedBox(1.4 * k, 0.3, 1.4 * k, 0.05), M.matte('#9a9a94'), { parent: root, at: [s * W * 0.32, 0.15, -0.5 * k] }); }
    const board = group('board', { parent: root, at: [0, pyl + H / 2, 0] });
    mesh(roundedBox(W, H, 0.5 * k, 0.08), cab, { parent: board });
    const scr = labelPlane(W * 0.94, H * 0.72, scoreDraw(T, trim, true), { bg: '#ff3a2a', emissive: 1.4, px: 512 });
    scr.position.set(0, -H * 0.08, 0.25 * k + 0.002);
    scr.name = 'screen';
    board.add(scr);
    const title = mesh(roundedBox(W * 0.5, H * 0.14, 0.04, 0.02), fin(T, trim ? T.s ?? '#e5402a' : '#e5402a', 'gloss'), { parent: board, at: [0, H * 0.4, 0.27 * k] });
    void title;
    for (let i = -3; i <= 3; i++) lamps.add(board, { at: [i * W * 0.11, H / 2 - 0.01, 0.1], normal: [0, 1, 0.4], w: 0.25 * k, h: 0.12, shape: 'rect' });
    if (trim !== 'retro') { const em = brandEmblem(0.3 * k); em.position.set(-W * 0.2, H * 0.4, 0.27 * k + 0.02); board.add(em); }
    if (trim === 'retro') for (let i = 0; i < 2; i++) mesh(roundedBox(W * 0.1, H * 0.3, 0.06, 0.01), M.plastic('#e8e8e8'), { parent: board, at: [(i - 0.5) * W * 0.6, -H * 0.05, 0.28 * k] });
  }
  anims.push(() => clip('on', 1, [numberTrack('screen.material.emissiveIntensity', 1, () => 2.2, 1), ...lampTracks('scorelights', LAMP_ON[lamps.kind] ?? 2.4, { blink: 1 })]));
  return done(root, 'scoreboard', variant, o, () => anims.map((f) => f()));
}

/* ================================ BLEACHERS ================================ */

export const BLEACHER_VARIANTS = { aluminium: {}, wooden: {}, 'stadium-seats': {} };

export function createBleachers(options = {}) {
  const { o, variant, trim, T } = setup(options, BLEACHER_VARIANTS, 'bleachers');
  const root = group(`bleachers-${variant}`);
  const rows = trim === 'kids' ? 2 : trim === 'pro' || trim === 'champion' ? 6 : trim === 'retro' ? 3 : 4;
  const W = trim === 'kids' ? 2 : trim === 'pro' ? 6 : 4.5;
  const rise = trim === 'kids' ? 0.25 : 0.4, run = trim === 'kids' ? 0.5 : 0.7;
  const frame = trim === 'champion' ? M.metal('#d6a93c', 0.25) : M.metal(trim === 'stealth' ? '#1c1d20' : trim === 'worn' ? '#8a7a68' : '#b8bcc2', trim === 'worn' ? 0.7 : 0.35);
  const plankM = (i) => (variant === 'wooden' || trim === 'retro' ? M.wood(trim === 'worn' ? '#8a7a68' : '#c79a5e') : T.pattern ? fin(T, i % 2 ? T.p : T.s) : trim === 'neon' ? fin(T, i % 2 ? T.p : T.a, 'neon') : trim === 'kids' ? fin(T, [T.p, T.s, T.a][i % 3], 'plastic') : M.metal(trim === 'stealth' ? '#2a2c31' : '#d2d5da', 0.25));
  const frames = Math.max(2, Math.round(W / 1.5) + 1);
  if (variant === 'stadium-seats') {
    const conc = M.matte(trim === 'worn' ? '#8a8578' : '#b5b2aa', 0.95);
    for (let i = 0; i < rows; i++) {
      const nc = Math.ceil(W / 1.5);
      for (let c = 0; c < nc; c++) mesh(roundedBox(W / nc, rise * (i + 1), run, 0.01), conc, { parent: root, at: [-W / 2 + (W / nc) * (c + 0.5), (rise * (i + 1)) / 2, -i * run] });
      const seatCol = T.pattern ? (Math.floor(i / 2) % 2 ? T.p : T.s) : trim ? T.p : '#1d4fa0';
      const sm = trim === 'retro' ? M.wood('#a67c4f') : trim === 'champion' ? M.metal('#d6a93c', 0.25) : fin(T, seatCol, trim === 'neon' ? 'neon' : 'plastic');
      const n = Math.floor(W / 0.5);
      for (let j = 0; j < n; j++) {
        const x = -W / 2 + 0.25 + j * 0.5;
        const sg = group('seat', { parent: root, at: [x, rise * (i + 1), -i * run + 0.1] });
        mesh(roundedBox(0.04, 0.3, 0.04, 0.01), M.metal('#5a5d62'), { parent: sg, at: [0, 0.15, -0.12] });
        mesh(cushion(0.44, 0.04, 0.38, { radius: 0.015, bulge: 0.1 }), sm, { parent: sg, at: [0, 0.32, 0] });
        mesh(cushion(0.44, 0.35, 0.04, { radius: 0.015, bulge: 0.1 }), sm, { parent: sg, at: [0, 0.5, -0.19], rot: [-0.12, 0, 0] });
      }
    }
    if (trim === 'champion' || trim === 'pro') {
      // roof canopy on columns
      const top = rise * rows + 2.4;
      for (const x of [-W / 2, W / 2]) { mesh(roundedBox(0.14, top, 0.14, 0.02), frame, { parent: root, at: [x, top / 2, -(rows - 1) * run] }); bar([x, top, -(rows - 1) * run], [x, top - 0.3, run * 0.6], 0.06, frame, root); }
      mesh(roundedBox(W + 0.4, 0.08, rows * run + 0.8, 0.02), fin(T, trim === 'champion' ? '#1b1b1d' : '#f2f2f2', 'gloss'), { parent: root, at: [0, top - 0.1, -(rows - 1) * run / 2 + 0.1], rot: [-0.08, 0, 0] });
    }
    return done(root, 'bleachers', variant, o);
  }
  for (let f = 0; f < frames; f++) {
    const x = -W / 2 + 0.1 + (f * (W - 0.2)) / (frames - 1);
    const back = -(rows - 1) * run - run / 2;
    bar([x, 0.02, run / 2], [x, rise * rows, back], 0.035, frame, root); // stringer
    for (let i = 0; i <= rows; i++) { const z = run / 2 - i * run; bar([x, 0.0, z], [x, Math.min(rows, i) * rise, z], 0.03, frame, root); }
    mesh(roundedBox(0.08, 0.02, rows * run + 0.1, 0.006), frame, { parent: root, at: [x, 0.01, -(rows - 1) * run / 2] });
  }
  for (let i = 0; i < rows; i++) {
    const y = (i + 1) * rise, z = -i * run;
    // seat plank + foot plank
    mesh(roundedBox(W, 0.05, 0.26, 0.012), plankM(i), { parent: root, at: [0, y, z - 0.1] });
    mesh(roundedBox(W, 0.03, 0.22, 0.01), plankM(i + 1), { parent: root, at: [0, y - rise * 0.55, z + 0.18] });
    bar([-W / 2 + 0.1, y - rise * 0.55, z + 0.18], [-W / 2 + 0.1, y, z - 0.1], 0.02, frame, root);
    bar([W / 2 - 0.1, y - rise * 0.55, z + 0.18], [W / 2 - 0.1, y, z - 0.1], 0.02, frame, root);
  }
  if (variant === 'wooden') {
    // classic wooden grandstand: backrest on every row, solid stepped side walls, front skirt
    const wm = M.wood(trim === 'worn' ? '#8a7a68' : trim === 'stealth' ? '#2a2c31' : '#a67c4f');
    const sideM = T.pattern ? fin(T, T.p) : trim === 'neon' ? fin(T, '#101114') : trim === 'kids' ? fin(T, T.s, 'plastic') : M.wood(trim === 'worn' ? '#7a6a58' : '#7a5230');
    for (let i = 0; i < rows; i++) {
      const y = (i + 1) * rise, z = -i * run;
      for (const x of [-W / 2 + 0.15, 0, W / 2 - 0.15]) mesh(roundedBox(0.05, 0.42, 0.04, 0.01), wm, { parent: root, at: [x, y + 0.21, z - 0.25] });
      mesh(roundedBox(W, 0.12, 0.03, 0.01), plankM(i), { parent: root, at: [0, y + 0.36, z - 0.25] });
    }
    const prof = [[run / 2, 0]];
    for (let i = 0; i < rows; i++) prof.push([run / 2 - i * run, (i + 1) * rise], [-run / 2 - i * run, (i + 1) * rise]);
    prof.push([-run / 2 - (rows - 1) * run, 0]);
    for (const s2 of [-1, 1]) mesh(extrudeOutline(prof.map(([z, y]) => [z, y]), 0.04, { bevel: 0.008 }).rotateY(-Math.PI / 2), sideM, { parent: root, at: [s2 * (W / 2 + 0.02), 0, 0] });
    mesh(roundedBox(W, rise * 0.9, 0.03, 0.01), sideM, { parent: root, at: [0, rise * 0.45, run / 2] });
  }
  // rear + side guard rails
  if (trim !== 'kids' && variant !== 'wooden') {
    const back = -(rows - 1) * run - 0.25;
    const top = rows * rise + 0.9;
    for (const x of [-W / 2, W / 2]) rodY(rows * rise - 0.4, top, 0.022, frame, root, { x, z: back });
    for (const yy of [top, top - 0.45]) rodX(-W / 2, W / 2, 0.022, frame, root, { y: yy, z: back });
    for (const x of [-W / 2, W / 2]) curveTube([[x, rise + 0.9, 0], [x, top, back]], 0.02, frame, { parent: root, segments: 2 });
    for (const x of [-W / 2, W / 2]) rodY(rise * 0.4, rise + 0.9, 0.02, frame, root, { x, z: 0 });
    for (const x of [-W / 2, W / 2]) bar([x, rise * 0.4, 0], [x, rise, -0.1], 0.02, frame, root);
  }
  return done(root, 'bleachers', variant, o);
}

/* =============================== BALL MACHINES =============================== */

export const MACHINE2_VARIANTS = { tennis: { p: '#1d1f24' }, pitching: { p: '#c8102e' } };

export function createBallMachine(options = {}) {
  const { o, variant, trim, T, V } = setup(options, MACHINE2_VARIANTS, 'ball-machine');
  const root = group(`ball-machine-${variant}`);
  const k = T.kids ? 0.7 : 1;
  const body = trim === 'retro' ? fin(T, '#3a5a3a', 'gloss') : trim === 'champion' ? M.metal('#d6a93c', 0.25) : trim ? bodyMat(T) : fin(T, V.p, 'gloss');
  const anims = [];
  if (variant === 'tennis') {
    const W = 0.45 * k, D = 0.6 * k, H = 0.4 * k;
    // wheels + handle
    for (const s of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(0.08 * k, 0.08 * k, 0.04, 20).rotateZ(Math.PI / 2), M.rubber(), { parent: root, at: [s * (W / 2 + 0.02), 0.08 * k, -D * 0.3] });
      mesh(new THREE.CylinderGeometry(0.04 * k, 0.04 * k, 0.042, 16).rotateZ(Math.PI / 2), M.metal('#9a9da2'), { parent: root, at: [s * (W / 2 + 0.02), 0.08 * k, -D * 0.3] });
    }
    mesh(roundedBox(0.06, 0.03, 0.06, 0.01), M.rubber(), { parent: root, at: [0, 0.015, D * 0.4] });
    mesh(roundedBox(W, H, D, 0.05 * k), body, { parent: root, at: [0, 0.03 + H / 2, 0] });
    curveTube([[-W / 2 + 0.03, 0.03 + H * 0.8, -D / 2], [-W / 2 + 0.03, H + 0.3 * k, -D / 2 - 0.2 * k], [W / 2 - 0.03, H + 0.3 * k, -D / 2 - 0.2 * k], [W / 2 - 0.03, 0.03 + H * 0.8, -D / 2]], 0.012, M.metal('#2a2c31'), { parent: root, segments: 24 });
    // hopper (hollow funnel) full of balls
    const hy = 0.03 + H;
    const hr = trim === 'pro' ? 0.3 * k : 0.24 * k, hh = 0.32 * k;
    const hop = trim === 'retro' ? M.metal('#c9ccd2', 0.3) : M.glass({ tint: '#d8e6ee', opacity: 0.45 });
    mesh(lathe([[0.07 * k, 0], [hr, hh], [hr + 0.004, hh], [0.074 * k, 0.004], [0.074 * k, 0], [0, 0], [0, 0.004]].slice(0, 5), 32), hop, { parent: root, at: [0, hy, 0] }).material.side = THREE.DoubleSide;
    mesh(new THREE.CylinderGeometry(0.075 * k, 0.075 * k, 0.006, 24), body, { parent: root, at: [0, hy + 0.003, 0] });
    const br = 0.0335;
    let n = 0;
    for (let layer = 0; layer < 5; layer++) {
      const y = hy + 0.006 + br + layer * br * 1.75;
      const r = 0.07 * k + ((y - hy) / hh) * (hr - 0.07 * k) - br;
      const cnt = Math.max(1, Math.floor((Math.PI * 2 * Math.max(r, 0.001)) / (br * 2.1)));
      for (let i = 0; i < cnt && n < 60; i++, n++) {
        const a = (i / cnt) * Math.PI * 2 + layer * 0.4;
        const b = buildBall('tennis', { ...T, trim: trim === 'neon' || trim === 'retro' ? trim : null }, { detail: 6 });
        b.mesh.position.set(Math.cos(a) * Math.max(r, 0), y, Math.sin(a) * Math.max(r, 0));
        root.add(b.mesh);
      }
    }
    // launch head (oscillates)
    const head = group('head', { parent: root, at: [0, 0.03 + H * 0.6, D / 2] });
    mesh(new THREE.CylinderGeometry(0.05 * k, 0.06 * k, 0.12 * k, 20).rotateX(Math.PI / 2), M.plastic('#151515'), { parent: head, at: [0, 0, 0.05 * k] });
    mesh(new THREE.TorusGeometry(0.045 * k, 0.008, 8, 20), fin(T, trim ? T.a ?? T.s : '#e5402a', 'rubber'), { parent: head, at: [0, 0, 0.11 * k] });
    anims.push(() => clip('oscillate', 3, [rotateTrack(head, 'y', 3, (t) => Math.sin(t * Math.PI * 2) * 0.35)]));
    const panel = labelPlane(W * 0.5, H * 0.3, (c, Wc, Hc) => { c.fillStyle = '#05070a'; c.fillRect(0, 0, Wc, Hc); c.fillStyle = '#3fc3ff'; c.font = `bold ${Hc * 0.5}px monospace`; c.fillText('SPD 6', Wc * 0.1, Hc * 0.65); }, { bg: '#3fc3ff', emissive: 1.2 });
    panel.position.set(0, 0.03 + H * 0.6, -D / 2 - 0.001);
    panel.rotation.y = Math.PI;
    panel.name = 'screen';
    root.add(panel);
  } else {
    // pitching machine: tripod, twin wheels, feed chute
    const H = 1.0 * k;
    const lm = M.metal(trim === 'stealth' ? '#1c1d20' : '#2a2c31', 0.4);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; bar([0, H * 0.75, 0], [Math.cos(a) * 0.45 * k, 0.02, Math.sin(a) * 0.45 * k], 0.02, lm, root); mesh(new THREE.SphereGeometry(0.025, 8, 6), M.rubber(), { parent: root, at: [Math.cos(a) * 0.45 * k, 0.025, Math.sin(a) * 0.45 * k] }); }
    mesh(new THREE.CylinderGeometry(0.04, 0.04, H * 0.3, 16), lm, { parent: root, at: [0, H * 0.85, 0] });
    const headG = group('pitcher', { parent: root, at: [0, H, 0] });
    mesh(roundedBox(0.5 * k, 0.12, 0.3 * k, 0.03), body, { parent: headG });
    mesh(roundedBox(0.06, 0.44 * k, 0.1, 0.02), body, { parent: headG, at: [0, 0, 0.14 * k] });
    rodY(-0.2 * k, 0.2 * k, 0.012, M.metal('#9a9da2'), headG, { z: 0.18 * k });
    for (const s of [-1, 1]) {
      const wh = group(s > 0 ? 'wheel_top' : 'wheel_bottom', { parent: headG, at: [0, s * 0.16 * k, 0.18 * k] });
      mesh(new THREE.CylinderGeometry(0.17 * k, 0.17 * k, 0.07, 32), M.rubber(), { parent: wh });
      mesh(new THREE.CylinderGeometry(0.11 * k, 0.11 * k, 0.072, 24), M.metal('#c9ccd2', 0.3), { parent: wh });
      mesh(new THREE.CylinderGeometry(0.17 * k, 0.17 * k, 0.074, 32, 1, true, 0, Math.PI), body, { parent: wh, scale: [1.05, 1, 1.05] });
      anims.push(() => spinTrack(wh, 'y', 0.25, s));
    }
    // feed chute with balls
    curveTube([[0, 0.06, -0.15 * k], [0, 0.3 * k, -0.35 * k], [0, 0.55 * k, -0.4 * k]], 0.045, M.metal('#c9ccd2', 0.3), { parent: headG, segments: 16 });
    for (let i = 0; i < 3; i++) { const b = buildBall('baseball', { ...T, trim: trim === 'retro' ? 'retro' : null }, { detail: 8 }); b.mesh.position.set(0, 0.6 * k + i * 0.075, -0.4 * k); headG.add(b.mesh); }
    const wrapped = anims.splice(0);
    anims.push(() => clip('pitch', 0.25, wrapped.map((f) => f())));
  }
  return done(root, 'ball-machine', variant, o, () => anims.map((f) => f()));
}
