// Boards (skate / surf / snow / ski), helmets, gloves and training gear.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, extrudeOutline, setup, done, fin, bodyMat, bar, teamPattern } from './common.js';
import { clip, spinTrack } from '../../core/animation.js';
import { brandEmblem } from '../../core/brand.js';

/** Board from a half-width profile hw(t) (t: 0 tail → 1 nose) along X, thickness th(t), rocker(t). */
function boardGeo(L, hw, th, rocker, { seg = 64 } = {}) {
  const pts = [];
  for (let i = 0; i <= seg; i++) { const t = i / seg; pts.push([-L / 2 + t * L, Math.max(0.0005, hw(t))]); }
  for (let i = seg; i >= 0; i--) { const t = i / seg; pts.push([-L / 2 + t * L, -Math.max(0.0005, hw(t))]); }
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.003, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, -0.2);
  g.rotateX(Math.PI / 2); // outline in XZ, thickness along Y (-0.5..0.5)
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const t = THREE.MathUtils.clamp((x + L / 2) / L, 0, 1);
    p.setY(i, p.getY(i) * th(t) + rocker(t));
  }
  g.computeVertexNormals();
  return g;
}

/* ================================ BOARDS ================================ */

export const BOARD_VARIANTS = {
  skateboard: { p: '#e5402a', s: '#151515' },
  longboard: { p: '#c79a5e', s: '#1d4fa0' },
  surfboard: { p: '#f6f4ee', s: '#1aa0c0' },
  'longboard-surf': { p: '#f2e6c8', s: '#e5402a' },
  snowboard: { p: '#1d4fa0', s: '#f2c500' },
  skis: { p: '#e5402a', s: '#f6f6f4' },
};

export function createBoardSport(options = {}) {
  const { o, variant, trim, T, V } = setup(options, BOARD_VARIANTS, 'board-sport');
  const root = group(`board-sport-${variant}`);
  const k = T.kids ? 0.72 : 1;
  const deckM = trim === 'retro' ? M.wood('#a67c4f') : trim === 'champion' ? M.metal('#d6a93c', 0.22) : trim ? bodyMat(T) : variant === 'longboard' ? M.wood(V.p) : fin(T, V.p, 'gloss');
  const acc = fin(T, trim ? T.s : V.s);
  const anims = [];
  const stripe = (parent, L, y, w, at = 0) => { if (T.pattern || !trim || trim === 'neon' || trim === 'pro') mesh(roundedBox(L, 0.001, w, 0.0004), acc, { parent, at: [at, y, 0] }); };

  if (variant === 'skateboard' || variant === 'longboard') {
    const long = variant === 'longboard';
    const L = (long ? 1.0 : trim === 'retro' ? 0.7 : 0.8) * k, W = (long ? 0.24 : trim === 'retro' ? 0.18 : 0.205) * k;
    const kick = long ? 0.01 : 0.055;
    const shape = trim === 'retro' && !long ? (t) => W / 2 * (0.75 + 0.25 * Math.sin(Math.PI * t)) * Math.min(1, Math.sin(Math.PI * Math.min(t, 1 - t) * 1.0) ** 0.25 * 1.0 + 0.15) : (t) => (W / 2) * Math.sqrt(Math.max(0, 1 - ((2 * t - 1) ** 2) ** (long ? 3 : 6)));
    const rock = (t) => { const e = Math.max(0, Math.abs(2 * t - 1) - (long ? 0.85 : 0.72)) / (long ? 0.15 : 0.28); return kick * e * e; };
    const H = 0.1 * (T.kids ? 0.9 : 1);
    const deck = group('deck', { parent: root, at: [0, H, 0] });
    mesh(boardGeo(L, shape, () => 0.012, rock), deckM, { parent: deck, name: 'deck' });
    // griptape on top
    mesh(boardGeo(L * 0.985, (t) => shape(t) * 0.97, () => 0.001, (t) => rock(t) + 0.0065), fin(T, trim === 'neon' ? '#101114' : '#1b1b1d', 'matte'), { parent: deck });
    // graphic on the underside
    mesh(boardGeo(L * 0.7, (t) => shape(0.15 + t * 0.7) * 0.8, () => 0.0008, (t) => -0.0065 - 0.0005 + rock(0.15 + t * 0.7)), acc, { parent: deck });
    // trucks + wheels
    const wr = (long ? 0.035 : trim === 'retro' ? 0.03 : 0.027) * (T.kids ? 1.1 : 1);
    const wheelM = fin(T, trim === 'neon' ? T.a : trim === 'retro' ? '#e5402a' : T.pattern ? T.p : '#f2efe6', 'rubber');
    const tx = L * (long ? 0.36 : 0.3);
    for (const s of [-1, 1]) {
      const tg = group('truck', { parent: root, at: [s * tx, 0, 0] });
      mesh(roundedBox(0.05, 0.012, 0.06, 0.004), M.metal('#bfc3c8'), { parent: tg, at: [0, H - 0.012, 0] });
      mesh(new THREE.CylinderGeometry(0.012, 0.016, H - wr - 0.012, 12), M.metal('#9a9da2'), { parent: tg, at: [0, (H - 0.018 + wr) / 2, 0] });
      mesh(new THREE.CylinderGeometry(0.008, 0.008, W * 0.95, 12).rotateX(Math.PI / 2), M.metal('#bfc3c8'), { parent: tg, at: [0, wr, 0] });
      mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.016, 10), fin(T, T.a ?? '#f2c500', 'rubber'), { parent: tg, at: [0, H - 0.026, 0] });
      for (const z of [-1, 1]) {
        const wh = group(`wheel_${s > 0 ? 'f' : 'r'}${z > 0 ? 'l' : 'r'}`, { parent: tg, at: [0, wr, z * W * 0.48] });
        mesh(new THREE.CylinderGeometry(wr, wr, long ? 0.05 : 0.034, 24).rotateX(Math.PI / 2), wheelM, { parent: wh });
        mesh(new THREE.CylinderGeometry(wr * 0.45, wr * 0.45, (long ? 0.05 : 0.034) + 0.002, 16).rotateX(Math.PI / 2), M.metal('#5a5d62'), { parent: wh });
        anims.push(wh);
      }
    }
    // remove lift between truck and deck by using y=0 base
    if (trim === 'pro' || trim === 'champion') { const em = brandEmblem(0.05); em.position.set(-L * 0.2, H - 0.0071, 0); em.rotation.x = Math.PI / 2; deck.parent.add(em); }
    return done(root, 'board-sport', variant, o, () => [clip('roll', 0.6, anims.map((w) => spinTrack(w, 'z', 0.6, -1)))]);
  }
  if (variant === 'surfboard' || variant === 'longboard-surf') {
    const mal = variant === 'longboard-surf';
    const L = (mal ? 2.75 : trim === 'retro' ? 1.9 : trim === 'kids' ? 1.5 : 1.85) * (trim === 'pro' && !mal ? 0.95 : 1), W = (mal ? 0.57 : trim === 'retro' ? 0.55 : 0.48) * (T.kids ? 0.85 : 1);
    const nose = mal || trim === 'kids' ? 0.55 : 0.25;
    const hw = (t) => (W / 2) * Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.02)) ** (t > 0.5 ? nose : 0.35) * (trim === 'retro' && t < 0.15 ? 1 - (0.15 - t) * 1.5 : 1);
    const th = (t) => (mal ? 0.075 : 0.062) * Math.sin(Math.PI * Math.min(1, t * 0.96 + 0.02)) ** 0.5;
    const rock = (t) => 0.12 * Math.max(0, t - 0.7) ** 2 * 10 + 0.04 * Math.max(0, 0.15 - t) * 6;
    const board = group('board', { parent: root });
    // lies deck-down with fins pointing up (how boards rest on sand)
    const geo = boardGeo(L, hw, th, rock);
    geo.scale(1, -1, 1);
    mesh(geo, deckM, { parent: board, name: 'board' });
    // stringer + rails stripe / team graphics
    mesh(boardGeo(L * 0.98, () => 0.0025, (t) => th(0.01 + t * 0.98) + 0.0015, rock).scale(1, -1, 1), trim === 'retro' ? M.wood('#5b3a24') : M.wood('#c79a5e'), { parent: board });
    if (T.pattern || trim === 'neon' || !trim || trim === 'retro') {
      for (const off of T.pattern === 'stripes' ? [-0.12, 0.12] : [0]) mesh(boardGeo(L * 0.5, (t) => hw(0.25 + t * 0.5) * (T.pattern === 'hoops' ? 1.002 : 0.25), (t) => th(0.25 + t * 0.5) + 0.002, (t) => rock(0.25 + t * 0.5)).scale(1, -1, 1).translate(0, 0, off), acc, { parent: board, at: [0, 0, 0] });
    }
    // fins on the bottom (now facing up)
    const finM = fin(T, trim === 'stealth' ? '#2a2c31' : trim === 'neon' ? T.a : '#2a2c31', 'plastic');
    const finAt = (t, z, h, ang = 0) => {
      const x = -L / 2 + t * L;
      const y = -(-th(t) / 2 * 0 + rock(t)) * 0 + (th(t) / 2) - rock(t) + 0.0;
      const f = extrudeOutline([[-h * 0.55, 0], [h * 0.25, 0], [h * 0.05, h * 0.5], [-h * 0.25, h]], 0.007, { bevel: 0.002 });
      mesh(f, finM, { parent: board, at: [x, y - 0.002, z], rot: [0, 0, 0] }).rotation.x = ang;
    };
    if (mal || trim === 'retro') finAt(0.08, 0, 0.2);
    else { finAt(0.07, 0, 0.11); finAt(0.12, 0.13, 0.11, -0.1); finAt(0.12, -0.13, 0.11, 0.1); }
    // leash plug + leash
    if (trim !== 'retro') curveTube([[-L / 2 + 0.05, th(0.03) / 2 - rock(0.03), 0], [-L / 2 - 0.1, 0.02, 0.15], [-L / 2 - 0.2, 0.01, 0.3], [-L / 2 - 0.1, 0.01, 0.45]], 0.004, fin(T, '#151515', 'rubber'), { parent: board, segments: 16 });
    return done(root, 'board-sport', variant, o);
  }
  if (variant === 'snowboard') {
    const L = (trim === 'kids' ? 1.1 : trim === 'pro' ? 1.6 : 1.55), W = (trim === 'retro' ? 0.23 : 0.25) * (T.kids ? 0.85 : 1);
    const hw = (t) => { const e = Math.abs(2 * t - 1); const side = W / 2 - 0.012 * Math.cos(Math.PI * (2 * t - 1)) ** 2 * 0 - 0.01 * (1 - (2 * t - 1) ** 2); return e > 0.86 ? side * Math.sqrt(Math.max(0, 1 - ((e - 0.86) / 0.14) ** 2)) * 0.9 + side * 0.1 : side; };
    const rock = (t) => { const e = Math.max(0, Math.abs(2 * t - 1) - 0.82) / 0.18; return 0.07 * e * e + (trim === 'retro' ? 0 : -0.006 * (1 - (2 * t - 1) ** 2)); };
    const board = group('board', { parent: root });
    mesh(boardGeo(L, hw, () => 0.009, rock), deckM, { parent: board, name: 'board' });
    mesh(boardGeo(L * 0.99, (t) => hw(t) + 0.001, () => 0.0015, (t) => rock(t) - 0.004), fin(T, '#151515', 'matte'), { parent: board });
    // top sheet graphic
    if (T.pattern) for (let i = 0; i < 5; i++) mesh(roundedBox(0.06, 0.001, W * 0.9, 0.0004), acc, { parent: board, at: [-L * 0.35 + i * L * 0.175, 0.005, 0] });
    else mesh(boardGeo(L * 0.6, (t) => hw(0.2 + t * 0.6) * 0.6, () => 0.001, (t) => rock(0.2 + t * 0.6) + 0.005), acc, { parent: board });
    // bindings
    for (const s of [-1, 1]) {
      const b = group('binding', { parent: board, at: [s * L * 0.18, 0.005, 0], rot: [0, s * 0.25, 0] });
      const bm = fin(T, trim === 'retro' ? '#2a2c31' : T.a ?? '#151515', 'plastic');
      mesh(roundedBox(0.12, 0.015, 0.25, 0.006), bm, { parent: b, at: [0, 0.0075, 0] });
      curveTube([[0.0, 0.015, -0.12], [-0.08, 0.1, -0.1], [-0.08, 0.13, 0], [-0.08, 0.1, 0.1], [0, 0.015, 0.12]], 0.008, bm, { parent: b, segments: 24 }).scale.x = 1;
      mesh(roundedBox(0.03, 0.12, 0.2, 0.012), bm, { parent: b, at: [-0.065, 0.075, 0], rot: [0, 0, 0.2] });
      for (const z of [-0.06, 0.06]) mesh(roundedBox(0.09, 0.012, 0.03, 0.005), fin(T, '#151515', 'rubber'), { parent: b, at: [0.0, 0.07, z], rot: [0, 0, 0.15] });
    }
    return done(root, 'board-sport', variant, o);
  }
  // skis + poles
  const L = (trim === 'kids' ? 1.1 : trim === 'retro' ? 1.9 : trim === 'pro' ? 1.8 : 1.65), W = trim === 'retro' ? 0.065 : 0.09;
  const hw = (t) => { const side = W / 2 - 0.012 * Math.sin(Math.PI * t); return t > 0.92 ? side * (1 - ((t - 0.92) / 0.08) ** 2 * 0.6) : side; };
  const rock = (t) => 0.06 * Math.max(0, (t - 0.88) / 0.12) ** 2 + 0.01 * Math.max(0, (0.06 - t) / 0.06) ** 2;
  for (const z of [-0.07, 0.07]) {
    const ski = group('ski', { parent: root, at: [0, 0, z] });
    mesh(boardGeo(L, hw, () => 0.014, rock), deckM, { parent: ski, name: 'ski' });
    stripe(ski, L * 0.5, 0.0075, W * 0.3, L * 0.1);
    // binding: toe + heel piece
    const bm = trim === 'retro' ? M.chrome() : fin(T, T.a ?? '#151515', 'plastic');
    mesh(roundedBox(0.1, 0.05, 0.075, 0.015), bm, { parent: ski, at: [0.12, 0.032, 0] });
    mesh(roundedBox(0.13, 0.06, 0.075, 0.02), bm, { parent: ski, at: [-0.2, 0.037, 0] });
    mesh(roundedBox(0.2, 0.008, 0.07, 0.003), M.metal('#5a5d62'), { parent: ski, at: [-0.04, 0.011, 0] });
    if (trim === 'retro') curveTube([[-0.25, 0.04, -0.035], [-0.3, 0.05, 0], [-0.25, 0.04, 0.035]], 0.003, M.rubber(), { parent: ski, segments: 8 });
  }
  // poles lying beside the skis
  const pm = trim === 'retro' ? M.wood('#c79a5e') : trim === 'champion' ? M.metal('#d6a93c', 0.2) : fin(T, trim ? T.p : '#c9ccd2', trim ? undefined : 'metal');
  const PL = L * 0.72;
  for (const z of [0.2, 0.28]) {
    const pole = group('pole', { parent: root, at: [0, 0.03, z] });
    mesh(new THREE.CylinderGeometry(0.009, 0.006, PL, 12).rotateZ(Math.PI / 2), pm, { parent: pole });
    mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.16, 12).rotateZ(Math.PI / 2), fin(T, trim ? T.s : '#151515', 'rubber'), { parent: pole, at: [-PL / 2 + 0.08, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.008, 20).rotateZ(Math.PI / 2), fin(T, trim === 'retro' ? '#5b3519' : '#151515', trim === 'retro' ? 'leather' : 'plastic'), { parent: pole, at: [PL / 2 - 0.1, 0.02, 0] });
    mesh(new THREE.ConeGeometry(0.006, 0.03, 8).rotateZ(-Math.PI / 2), M.metal('#5a5d62'), { parent: pole, at: [PL / 2 + 0.015, 0, 0] });
    curveTube([[-PL / 2 + 0.02, 0, 0.0], [-PL / 2 - 0.04, -0.02, 0.03], [-PL / 2 - 0.06, -0.02, 0.0], [-PL / 2, -0.01, -0.01]], 0.003, fin(T, '#151515', 'fabric'), { parent: pole, segments: 12 });
  }
  return done(root, 'board-sport', variant, o);
}

/* ================================ HELMETS ================================ */

export const HELMET_VARIANTS = {
  'american-football': { p: '#c8102e', s: '#f6f6f4' },
  bike: { p: '#f6f6f4', s: '#1aa0c0' },
  hockey: { p: '#151515', s: '#f6f6f4' },
  batting: { p: '#1d4fa0', s: '#f6f6f4' },
  ski: { p: '#f6f6f4', s: '#151515' },
};

/** Hollow helmet shell (open bottom), outer radius R, oval in Z, rim at y=0. */
function shell(R, { wall = 0.012 } = {}) {
  const n = 20;
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = (Math.PI / 2) * (i / n); pts.push([Math.max(1e-4, R * Math.sin(a)), R * Math.cos(a)]); } // top → rim
  for (let i = n; i >= 0; i--) { const a = (Math.PI / 2) * (i / n); pts.push([Math.max(1e-4, (R - wall) * Math.sin(a)), Math.max(0, (R - wall) * Math.cos(a))]); } // rim → top (inside)
  return lathe(pts, 40);
}

export function createSportsHelmet(options = {}) {
  const { o, variant, trim, T, V } = setup(options, HELMET_VARIANTS, 'sports-helmet');
  const root = group(`sports-helmet-${variant}`);
  const h = group('helmet', { parent: root });
  const k = T.kids ? 0.85 : 1;
  const R = (variant === 'bike' ? 0.135 : variant === 'ski' ? 0.13 : 0.125) * k;
  const shellM = trim === 'retro' ? fin(T, variant === 'american-football' ? '#7a4a28' : '#efe2c4', 'leather') : trim === 'champion' ? M.metal('#d6a93c', 0.22) : trim ? bodyMat(T) : fin(T, V.p, 'gloss');
  const acc = fin(T, trim ? T.s : V.s);
  const sg = shell(R, { wall: trim === 'retro' ? 0.006 : 0.014 });
  sg.scale(0.88, variant === 'bike' ? 0.9 : 1.12, 1.08);
  const sh = mesh(sg, shellM, { parent: h, name: 'shell' });
  sh.material.side = THREE.DoubleSide;
  // centre stripe (team / classic)
  if (T.pattern || (!trim && variant !== 'ski') || trim === 'neon') {
    const st = mesh(new THREE.SphereGeometry(R * 1.004, 8, 20, -0.12, 0.24, 0, Math.PI / 2), acc, { parent: h, scale: [0.88, variant === 'bike' ? 0.9 : 1.12, 1.08] });
    st.rotation.y = Math.PI / 2;
    if (T.pattern === 'hoops') st.rotation.y = 0;
  }
  if (variant === 'american-football') {
    // face mask
    const fm = trim === 'champion' ? M.metal('#d6a93c', 0.2) : fin(T, trim === 'retro' ? '#2a2a2a' : trim === 'kids' ? T.s : '#c9ccd2', trim === 'retro' ? 'leather' : 'gloss');
    if (trim !== 'retro') {
      const z0 = R * 1.08;
      for (const y of [R * 0.05, R * 0.25, R * 0.45]) curveTube([[-R * 0.8, y + R * 0.1, z0 * 0.55], [-R * 0.55, y, z0 * 1.05], [0, y - R * 0.05, z0 * 1.2], [R * 0.55, y, z0 * 1.05], [R * 0.8, y + R * 0.1, z0 * 0.55]], 0.0045, fm, { parent: h, segments: 24 });
      curveTube([[0, R * 0.45, z0 * 1.15], [0, R * 0.02, z0 * 1.17]], 0.0045, fm, { parent: h, segments: 2 });
      for (const s of [-1, 1]) curveTube([[s * R * 0.4, R * 0.5, z0 * 1.0], [s * R * 0.42, R * 0.02, z0 * 1.1]], 0.0045, fm, { parent: h, segments: 2 });
    }
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(R * 0.18, R * 0.18, 0.01, 20).rotateZ(Math.PI / 2), M.plastic('#151515'), { parent: h, at: [s * R * 0.87, R * 0.25, R * 0.15] }); // ear holes
    mesh(roundedBox(R * 0.5, 0.012, R * 0.3, 0.005), fin(T, '#151515', 'rubber'), { parent: h, at: [0, 0.006, R * 1.05] }); // chin cup resting
  } else if (variant === 'bike') {
    // vents (dark slots) + visor + straps
    for (let i = -2; i <= 2; i++) mesh(roundedBox(R * 0.12, 0.012, R * 0.7, 0.005), M.plastic('#151515'), { parent: h, at: [i * R * 0.22, R * 0.85 * Math.cos(i * 0.28), 0], rot: [0, 0, -i * 0.28] });
    if (trim !== 'retro') mesh(new THREE.SphereGeometry(R * 1.02, 24, 6, -0.9, 1.8, Math.PI / 2 - 0.25, 0.22), acc, { parent: h, scale: [0.88, 0.85, 1.08], rot: [0, Math.PI / 2 - Math.PI / 2, 0] }).material.side = THREE.DoubleSide;
    // tail point (aero)
    if (trim === 'pro') { const tail = mesh(new THREE.ConeGeometry(R * 0.5, R * 0.9, 20).rotateX(-Math.PI / 2), shellM, { parent: h, at: [0, R * 0.35, -R * 1.2] }); tail.scale.set(1, 0.6, 1); }
    for (const s of [-1, 1]) curveTube([[s * R * 0.8, R * 0.08, 0], [s * R * 0.5, 0.004, R * 0.5], [0, 0.004, R * 0.75]], 0.004, fin(T, '#151515', 'fabric'), { parent: h, segments: 12 });
  } else if (variant === 'hockey') {
    // cage + visor
    const cm = trim === 'champion' ? M.metal('#d6a93c', 0.2) : fin(T, trim === 'neon' ? T.a : '#c9ccd2', 'gloss');
    const z0 = R * 1.0;
    if (trim === 'pro' || trim === 'retro') mesh(new THREE.SphereGeometry(R * 1.15, 24, 8, Math.PI / 2 - 0.9, 1.8, Math.PI / 2 - 0.05, 0.5), M.glass({ tint: '#cfe3ea', opacity: 0.4 }), { parent: h, scale: [0.85, 1, 1.0] });
    else {
      for (let i = 0; i < 6; i++) { const y = R * (0.0 + i * 0.09); curveTube([[-R * 0.75, y + 0.01, z0 * 0.6], [0, y, z0 * 1.22], [R * 0.75, y + 0.01, z0 * 0.6]], 0.0025, cm, { parent: h, segments: 16 }); }
      for (let i = -3; i <= 3; i++) curveTube([[i * R * 0.18, R * 0.5, z0 * (1.05 - Math.abs(i) * 0.06)], [i * R * 0.2, 0.004, z0 * (1.15 - Math.abs(i) * 0.08)]], 0.0025, cm, { parent: h, segments: 2 });
    }
    for (const s of [-1, 1]) mesh(roundedBox(0.012, R * 0.4, R * 0.5, 0.005), shellM, { parent: h, at: [s * R * 0.86, R * 0.2, R * 0.1] });
  } else if (variant === 'batting') {
    // brim + single ear flap
    mesh(new THREE.CylinderGeometry(R * 0.95, R * 0.95, 0.008, 32, 1, false, -0.9, 1.8).scale(1, 1, 1.1), shellM, { parent: h, at: [0, 0.06, 0], rot: [-0.25, 0, 0] }).position.z = R * 0.1;
    mesh(roundedBox(0.012, R * 0.8, R * 0.7, 0.006), shellM, { parent: h, at: [R * 0.86, R * 0.4, 0] });
    for (let i = 0; i < 4; i++) mesh(new THREE.CircleGeometry(0.006, 10), M.plastic('#151515'), { parent: h, at: [R * 0.867, R * 0.25 + i * 0.012, 0], rot: [0, Math.PI / 2, 0] });
  } else {
    // ski helmet + goggles strapped on
    const gm = trim === 'neon' ? fin(T, T.a, 'neon') : new THREE.MeshPhysicalMaterial({ color: '#ff7a1a', metalness: 0.9, roughness: 0.08, iridescence: 1 });
    const go = mesh(new THREE.SphereGeometry(R * 1.06, 32, 8, Math.PI / 2 - 0.9, 1.8, Math.PI / 2 - 0.3, 0.38), gm, { parent: h, scale: [0.9, 1, 1.12], name: 'goggle' });
    go.material.side = THREE.DoubleSide;
    mesh(new THREE.TorusGeometry(R * 0.98, 0.012, 6, 48, Math.PI * 2).rotateX(Math.PI / 2), fin(T, trim ? T.s : '#151515', 'fabric'), { parent: h, at: [0, R * 0.4, 0], scale: [0.88, 1, 1.08] });
    for (const s of [-1, 1]) mesh(cushion(0.02, R * 0.45, R * 0.4, { radius: 0.008 }), fin(T, '#2a2a2c', 'fabric'), { parent: h, at: [s * R * 0.86, R * 0.22, 0] });
  }
  if (trim === 'pro' || !trim) { const em = brandEmblem(R * 0.25); em.position.set(-R * 0.6, R * 0.62, -R * 0.62); em.lookAt(new THREE.Vector3(-R * 1.2, R * 1.24, -R * 1.24)); h.add(em); }
  if (trim === 'champion') { mesh(roundedBox(R * 2.2, 0.06, R * 2.4, 0.015), M.plastic('#141416', 0.3), { parent: root, at: [0, 0.03, 0] }); h.position.y = 0.06; }
  return done(root, 'sports-helmet', variant, o);
}

/* ================================= GLOVES ================================= */

export const GLOVE_VARIANTS = {
  'baseball-mitt': { p: '#a0601f', s: '#5b3519' },
  'boxing-glove': { p: '#c8102e', s: '#f6f6f4' },
  'goalkeeper-glove': { p: '#f2c500', s: '#151515' },
};

export function createSportsGlove(options = {}) {
  const { o, variant, trim, T, V } = setup(options, GLOVE_VARIANTS, 'sports-glove');
  const root = group(`sports-glove-${variant}`);
  const k = T.kids ? 0.72 : 1;
  const main = trim === 'retro' ? fin(T, variant === 'boxing-glove' ? '#5b3519' : '#7a4a28', 'leather') : trim === 'champion' ? M.metal('#d6a93c', 0.25) : trim ? fin(T, T.p, T.neon ? 'neon' : 'leather') : fin(T, V.p, 'leather');
  const acc = fin(T, trim ? T.s : V.s, 'leather');
  const pair = trim === 'pro' || trim === 'kids' || trim === 'neon' || variant === 'boxing-glove' ? 2 : 1;
  for (let p = 0; p < pair; p++) {
    const g = group('glove', { parent: root, at: [p * 0.3 * k, 0, p * 0.05], rot: [0, p * 0.4, 0] });
    g.scale.setScalar(k);
    if (variant === 'boxing-glove') {
      const s = trim === 'pro' ? 1.1 : 1;
      const body = mesh(new THREE.SphereGeometry(0.075 * s, 32, 20), main, { parent: g, at: [0.04, 0.065 * s, 0], name: 'fist' });
      body.scale.set(1.35, 0.85, 1.0);
      const th = mesh(new THREE.CapsuleGeometry(0.025, 0.06, 6, 12), main, { parent: g, at: [0.0, 0.07, 0.07 * s], rot: [0, 0, Math.PI / 2 - 0.4] });
      th.scale.set(1, 1, 0.9);
      const cuff = mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.11, 24).rotateZ(Math.PI / 2), trim ? acc : fin(T, V.s, 'leather'), { parent: g, at: [-0.1, 0.06, 0] });
      cuff.scale.set(1, 1, 0.85);
      mesh(new THREE.CylinderGeometry(0.0565, 0.0565, 0.02, 24).rotateZ(Math.PI / 2), main, { parent: g, at: [-0.12, 0.06, 0], scale: [1, 1, 0.86] });
      if (trim !== 'retro') { const em = brandEmblem(0.035); em.position.set(0.05, 0.062 * s * 1.7, 0); em.rotation.x = -Math.PI / 2; g.add(em); }
      else for (let i = 0; i < 6; i++) mesh(new THREE.TorusGeometry(0.006, 0.0015, 4, 8), M.matte('#efe2c4'), { parent: g, at: [-0.08 - i * 0.012, 0.115, 0], rot: [Math.PI / 2, 0, 0] });
    } else if (variant === 'baseball-mitt') {
      // palm pocket + four fingers fanned + thumb + web lacing, lying palm up
      const palm = mesh(new THREE.SphereGeometry(0.09, 28, 18, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), main, { parent: g, at: [0, 0.065, 0], scale: [1.0, 0.75, 0.95], name: 'palm' });
      palm.material.side = THREE.DoubleSide;
      for (let i = 0; i < 4; i++) {
        const a = -0.35 + i * 0.22;
        const L = 0.16 - Math.abs(i - 1.2) * 0.012;
        curveTube([[0.04, 0.035, 0], [0.04 + Math.cos(a) * L * 0.6, 0.04, Math.sin(a) * L * 0.6], [0.04 + Math.cos(a) * L, 0.055, Math.sin(a) * L]], 0.022, i % 2 ? main : main, { parent: g, segments: 12 });
      }
      curveTube([[-0.02, 0.04, 0.05], [0.04, 0.045, 0.12], [0.11, 0.055, 0.15]], 0.024, main, { parent: g, segments: 12 });
      // webbing between thumb & index
      for (let i = 0; i < 4; i++) curveTube([[0.09 + i * 0.012, 0.05, 0.06], [0.1 + i * 0.015, 0.075, 0.1], [0.11 + i * 0.015, 0.055, 0.14]], 0.004, acc, { parent: g, segments: 8 });
      // lacing tips
      for (let i = 0; i < 5; i++) mesh(new THREE.SphereGeometry(0.005, 6, 4), acc, { parent: g, at: [0.04 + Math.cos(-0.35 + i * 0.2) * 0.165, 0.07, Math.sin(-0.35 + i * 0.2) * 0.165] });
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20).rotateZ(Math.PI / 2), acc, { parent: g, at: [-0.08, 0.045, 0], scale: [1, 0.85, 1] });
      if (T.pattern) mesh(new THREE.TorusGeometry(0.085, 0.006, 6, 32), fin(T, T.s), { parent: g, at: [0, 0.07, 0], rot: [Math.PI / 2, 0, 0] });
      // ball in the pocket
      const ball = mesh(new THREE.SphereGeometry(0.0373, 20, 14), fin(T, '#f1ede2', 'leather'), { parent: g, at: [0.02, 0.0373 + 0.012, 0], name: 'ball' });
      void ball;
    } else {
      // goalkeeper glove: flat hand, fingers, wrist strap
      mesh(cushion(0.12, 0.035, 0.11, { radius: 0.015, bulge: 0.2 }), main, { parent: g, at: [0, 0.018, 0], name: 'palm' });
      for (let i = 0; i < 4; i++) { const f = mesh(new THREE.CapsuleGeometry(0.014, 0.07 - Math.abs(i - 1.5) * 0.01, 6, 10).rotateZ(Math.PI / 2), main, { parent: g, at: [0.1 - Math.abs(i - 1.5) * 0.005, 0.016, -0.04 + i * 0.027] }); f.scale.set(1, 0.9, 0.95); }
      const th = mesh(new THREE.CapsuleGeometry(0.015, 0.05, 6, 10).rotateZ(Math.PI / 2), main, { parent: g, at: [0.02, 0.016, 0.075], rot: [0, -0.7, 0] });
      void th;
      mesh(cushion(0.08, 0.04, 0.115, { radius: 0.015 }), acc, { parent: g, at: [-0.1, 0.02, 0], name: 'cuff' });
      mesh(roundedBox(0.03, 0.045, 0.12, 0.01), fin(T, trim === 'neon' ? T.a : '#e5402a', 'rubber'), { parent: g, at: [-0.08, 0.022, 0] });
      if (T.pattern) for (let i = 0; i < 3; i++) mesh(roundedBox(0.02, 0.036, 0.112, 0.008), fin(T, T.s), { parent: g, at: [-0.03 + i * 0.03, 0.018, 0] });
    }
  }
  if (trim === 'champion') {
    // gold glove award on a plinth
    const pl = mesh(roundedBox(0.4, 0.08, 0.3, 0.015), M.wood('walnut'), { parent: root, at: [0.1, 0.04, 0] });
    void pl;
    root.children.forEach((c) => { if (c.name === 'glove') c.position.y += 0.08; });
  }
  return done(root, 'sports-glove', variant, o);
}

/* ============================== TRAINING GEAR ============================== */

export const TRAINING_VARIANTS = {
  cone: { p: '#ff6a00' },
  hurdle: { p: '#f6f6f4', s: '#151515' },
  'starting-blocks': { p: '#c9ccd2', s: '#c8102e' },
  'agility-ladder': { p: '#f2c500', s: '#151515' },
};

export function createTrainingGear(options = {}) {
  const { o, variant, trim, T, V } = setup(options, TRAINING_VARIANTS, 'training-gear');
  const root = group(`training-gear-${variant}`);
  const k = T.kids ? 0.7 : 1;
  const main = trim === 'retro' ? M.wood('#c79a5e') : trim === 'champion' ? M.metal('#d6a93c', 0.22) : trim ? bodyMat(T) : fin(T, V.p, 'gloss');
  const acc = fin(T, trim ? T.s : V.s ?? '#151515');
  if (variant === 'cone') {
    // set of hollow cones (stacked + spread)
    const tall = trim === 'pro' ? 0.46 : trim === 'kids' ? 0.15 : trim === 'retro' ? 0.3 : 0.23;
    const cm = trim === 'retro' ? fin(T, '#e8501a', 'rubber') : trim ? fin(T, T.p, T.neon ? 'neon' : 'plastic') : fin(T, V.p, 'plastic');
    const one = (x, z, y = 0, stack = false) => {
      const g = group('cone', { parent: root, at: [x, y, z] });
      const b = tall * 0.6;
      mesh(roundedBox(b * 1.4, 0.008, b * 1.4, 0.004), cm, { parent: g, at: [0, 0.004, 0] });
      mesh(lathe([[b * 0.5, 0.0], [b * 0.12, tall], [b * 0.1, tall], [b * 0.47, 0.004]], 32), cm, { parent: g }).material.side = THREE.DoubleSide;
      if (trim !== 'kids' && trim !== 'retro') for (const t of T.pattern === 'hoops' ? [0.35, 0.6] : [0.5]) mesh(lathe([[b * 0.5 - (b * 0.38) * t + 0.001, tall * t], [b * 0.5 - (b * 0.38) * (t + 0.12) + 0.001, tall * (t + 0.12)]], 32), fin(T, trim ? T.s : '#f6f6f4', 'plastic'), { parent: g });
      void stack;
    };
    one(0, 0); one(tall * 1.4, tall * 0.6); one(-tall * 1.2, tall * 0.9);
    for (let i = 0; i < 3; i++) one(tall * 0.2, -tall * 1.6, i * 0.01 * k); // stacked
    // marker discs
    for (let i = 0; i < 4; i++) mesh(lathe([[0.1 * k, 0], [0.025, 0.05 * k], [0.02, 0.05 * k], [0.095 * k, 0.002]], 24), fin(T, trim ? T.a ?? T.s : ['#ff6a00', '#f2c500', '#1aa0c0', '#e5402a'][i], 'plastic'), { parent: root, at: [tall * 2.4 + i * 0.25 * k, 0, -tall * 0.5] }).material.side = THREE.DoubleSide;
  } else if (variant === 'hurdle') {
    const H = (trim === 'pro' ? 1.067 : trim === 'kids' ? 0.3 : 0.76), W = (trim === 'kids' ? 0.6 : 1.18);
    const n = trim === 'pro' ? 1 : 2;
    for (let j = 0; j < n; j++) {
      const g = group('hurdle', { parent: root, at: [0, 0, j * 0.9] });
      const fm = trim === 'retro' ? M.wood('#c79a5e') : M.metal(trim === 'stealth' ? '#1c1d20' : '#c9ccd2', 0.3);
      for (const s of [-1, 1]) {
        mesh(roundedBox(0.04, 0.04, 0.7, 0.01), fm, { parent: g, at: [s * W / 2, 0.02, -0.25] });
        bar([s * W / 2, 0.04, 0], [s * W / 2, H - 0.05, 0], 0.016, fm, g);
        mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 12).rotateX(Math.PI / 2), fin(T, '#151515', 'rubber'), { parent: g, at: [s * W / 2, 0.03, -0.55] }); // counterweight
      }
      // board (striped)
      const bh = trim === 'kids' ? 0.06 : 0.07;
      const segs = trim === 'retro' ? 1 : 6;
      for (let i = 0; i < segs; i++) mesh(roundedBox(W / segs, bh, 0.012, 0.004), i % 2 ? acc : main, { parent: g, at: [-W / 2 + (W / segs) * (i + 0.5), H - bh / 2, 0.0] });
    }
  } else if (variant === 'starting-blocks') {
    const L = 0.8 * k;
    const fm = trim === 'retro' ? M.wood('#a67c4f') : main;
    mesh(roundedBox(L, 0.035, 0.09, 0.01), fm, { parent: root, at: [0, 0.0175, 0] });
    for (let x = -L / 2 + 0.06; x < L / 2 - 0.04; x += 0.06) mesh(new THREE.BoxGeometry(0.008, 0.004, 0.07), M.metal('#5a5d62'), { parent: root, at: [x, 0.036, 0] });
    for (const [x, z] of [[-0.12, -0.11], [0.15, 0.11]]) {
      const b = group('block', { parent: root, at: [x * k, 0.035, z * k] });
      mesh(roundedBox(0.12, 0.012, 0.1, 0.004), M.metal('#5a5d62'), { parent: b, at: [0, 0.006, 0] });
      const pad = mesh(roundedBox(0.04, 0.17, 0.11, 0.008), fm, { parent: b, at: [0.03, 0.075, 0], rot: [0, 0, -0.75] });
      mesh(roundedBox(0.008, 0.15, 0.1, 0.004), fin(T, trim ? T.s : V.s, 'rubber'), { parent: pad, at: [-0.022, 0, 0] });
      bar([0, 0.012, -0.045], [0.07, 0.07, -0.045], 0.006, M.metal('#5a5d62'), b);
      bar([0, 0.012, 0.045], [0.07, 0.07, 0.045], 0.006, M.metal('#5a5d62'), b);
    }
    for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.008, 0.03, 6).rotateX(Math.PI), M.metal('#5a5d62'), { parent: root, at: [s * (L / 2 - 0.03), 0.0, 0] }).position.y = 0.015;
  } else {
    const rungs = trim === 'pro' ? 12 : trim === 'kids' ? 6 : 8, sp = 0.45 * k, W = 0.5 * k;
    const strap = fin(T, trim === 'retro' ? '#efe2c4' : '#151515', 'fabric');
    for (const s of [-1, 1]) mesh(roundedBox(rungs * sp, 0.004, 0.03, 0.0015), strap, { parent: root, at: [0, 0.002, s * W / 2] });
    for (let i = 0; i <= rungs; i++) {
      const x = -rungs * sp / 2 + i * sp;
      const rm = trim === 'retro' ? M.wood('#c79a5e') : T.pattern ? fin(T, teamPattern('stripes', i / 6, 0) ? T.s : T.p) : trim ? fin(T, T.p, T.neon ? 'neon' : 'plastic') : fin(T, V.p, 'plastic');
      mesh(roundedBox(0.04, 0.008, W + 0.03, 0.003), rm, { parent: root, at: [x, 0.006, 0] });
    }
    for (const s of [-1, 1]) mesh(roundedBox(0.03, 0.02, 0.03, 0.006), M.metal('#9a9da2'), { parent: root, at: [s * (rungs * sp / 2 + 0.02), 0.01, W / 2] });
  }
  if (trim === 'champion') { root.children.forEach((c) => { c.position.y += 0.02; }); mesh(roundedBox(3.4, 0.02, 1.8, 0.008), M.fabric('#5a0f1c'), { parent: root, at: [0, 0.01, 0] }); }
  return done(root, 'training-gear', variant, o);
}
