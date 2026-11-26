// Everyday items: gifts, party supplies, awards and money (original designs — no real currencies).
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, extrudeOutline, setup, done, fin, hw, vessel, openBox, labelPlane, textDraw, canvasTex, clip, rotateTrack, spinTrack, moveTrack, pingPong, wave, brandEmblem } from './common.js';
import { loftX, ribbon, pleatDisc } from './kitchen-shared.js';

/* ================================= GIFT BOX ================================= */

export const GIFT_BOX_VARIANTS = { 'wrapped-gift': {}, 'gift-bag': {}, 'gift-stack': {}, 'round-hatbox': {}, 'ribbon-roll': {} };

const paperOf = (T) => (T.trim === 'gold' ? fin(T, '#d6a93c', 'glitter') : T.trim === 'kraft' ? fin(T, T.p, 'paper') : fin(T, T.p, 'paper', { pattern: T.pattern }));
const ribbonOf = (T) => (T.trim === 'kraft' ? fin(T, '#d8c9a8', 'fabric') : T.trim === 'gold' ? fin(T, '#7a1426', 'velvet') : fin(T, T.trim ? T.s : '#c8302a', 'silk'));

/** Bow: two loops + knot + two tails, sitting at y=0 on a lid top. */
function bow(parent, T, s, mat, { at = [0, 0, 0], name = 'bow' } = {}) {
  const g = group(name, { parent, at });
  if (T.trim === 'kraft') {
    // twine bow: thin loops
    for (const sd of [-1, 1]) mesh(new THREE.TorusGeometry(s * 0.35, 0.0016, 6, 24), mat, { parent: g, at: [sd * s * 0.33, s * 0.3, 0], rot: [0, 0, sd * 0.4] });
    mesh(new THREE.SphereGeometry(s * 0.08, 10, 8), mat, { parent: g, at: [0, s * 0.05, 0] });
    return g;
  }
  const big = T.detail >= 2 ? 1.25 : 1;
  const loops = T.trim === 'festive' ? 4 : 2;
  for (let i = 0; i < loops; i++) {
    const a = (i / loops) * Math.PI * 2 + 0.3;
    const L = mesh(new THREE.TorusGeometry(s * 0.42 * big, s * 0.11, 8, 24), mat, { parent: g, at: [Math.cos(a) * s * 0.38 * big, s * 0.3 * big, Math.sin(a) * s * 0.38 * big], rot: [0, -a, 0] });
    L.scale.set(1, 0.7, 0.32);
    L.rotateX(Math.PI / 2 - 0.7);
  }
  mesh(new THREE.SphereGeometry(s * 0.16, 14, 10).scale(1.2, 0.8, 1), mat, { parent: g, at: [0, s * 0.1, 0], name: `${name}-knot` });
  return g;
}

/** Ribbon bands around a box (w × h × d) centred on x/z, base at y0, plus top cross. */
function boxRibbon(parent, w, h, d, y0, mat, T, { top = true } = {}) {
  const rw = T.trim === 'kraft' ? 0.003 : Math.min(w, d) * 0.12, t = T.trim === 'kraft' ? 0.003 : 0.0016;
  const e = t / 2 + 0.0004;
  mesh(new THREE.BoxGeometry(rw, h, t), mat, { parent, at: [0, y0 + h / 2, d / 2 + e] });
  mesh(new THREE.BoxGeometry(rw, h, t), mat, { parent, at: [0, y0 + h / 2, -d / 2 - e] });
  mesh(new THREE.BoxGeometry(t, h, rw), mat, { parent, at: [w / 2 + e, y0 + h / 2, 0] });
  mesh(new THREE.BoxGeometry(t, h, rw), mat, { parent, at: [-w / 2 - e, y0 + h / 2, 0] });
  if (top) {
    mesh(new THREE.BoxGeometry(rw, t, d + 2 * t), mat, { parent, at: [0, y0 + h + e, 0] });
    mesh(new THREE.BoxGeometry(w + 2 * t, t, rw), mat, { parent, at: [0, y0 + h + e, 0] });
  }
}

/** Closed wrapped present (used by stacks). */
function present(parent, T, w, h, d, { at = [0, 0, 0], rotY = 0, name, paper, rib } = {}) {
  const g = group(name ?? 'present', { parent, at, rot: [0, rotY, 0] });
  mesh(roundedBox(w, h, d, Math.min(0.004, h * 0.05)), paper ?? paperOf(T), { parent: g, at: [0, h / 2, 0] });
  boxRibbon(g, w, h, d, 0, rib ?? ribbonOf(T), T);
  return g;
}

export function createGiftBox(options = {}) {
  const { o, variant, T, trim } = setup(options, GIFT_BOX_VARIANTS, 'gift-box', { p: '#2457b8', s: '#f2b83a', a: '#f4f1ea', mat: 'paper' });
  const root = group(`gift-box-${variant}`);
  const k = T.k;
  const paper = paperOf(T);
  const rib = ribbonOf(T);
  if (variant === 'wrapped-gift') {
    const w = 0.24 * k * T.w, h = 0.15 * k * T.h * (trim === 'festive' ? 1.3 : 1), d = (trim === 'gold' ? 0.24 : 0.2) * k;
    const t = 0.003;
    paper.side = THREE.DoubleSide;
    openBox(w, h, d, t, paper, { parent: root, r: 0.004, name: 'box' });
    boxRibbon(root, w, h * 0.75, d, 0, rib, T, { top: false });
    // lid: an inverted shallow box overlapping the top
    const lh = 0.04 * k;
    const lid = group('lid', { parent: root, at: [0, h - lh + 0.004, 0] });
    const lm = paper.clone();
    const shell = openBox(w + 2 * t + 0.002, lh, d + 2 * t + 0.002, t, lm, { parent: lid, r: 0.004, name: 'lid-shell' });
    shell.rotation.x = Math.PI; shell.position.y = lh;
    boxRibbon(lid, w + 2 * t + 0.002, lh, d + 2 * t + 0.002, 0, rib, T);
    bow(lid, T, 0.095 * k, rib, { at: [0, lh + 0.003, 0] });
    if (trim === 'kraft' || T.detail >= 2) {
      // gift tag hanging off the bow
      const tag = mesh(roundedBox(0.05 * k, 0.002, 0.03 * k, 0.0008), fin(T, '#f3ead8', 'paper'), { parent: lid, at: [w * 0.25, lh + 0.004, d * 0.22], rot: [0, 0.4, 0], name: 'tag' });
      void tag;
    }
    // cardboard inner + tissue peeking
    mesh(new THREE.ConeGeometry(Math.min(w, d) * 0.3, h * 0.5, 6, 1, true).translate(0, h * 0.25, 0), fin(T, '#f6f1f4', 'paper'), { parent: root, at: [0, h * 0.55, 0], name: 'tissue' }).material.side = THREE.DoubleSide;
    return done(root, 'gift-box', variant, o, () => [clip('open', 3, [moveTrack(lid, 3, (u) => [pingPong(u) * w * 0.4, pingPong(u) * 0.12 * k, 0]), rotateTrack(lid, 'z', 3, (u) => -pingPong(u) * 0.5)])]);
  }
  if (variant === 'gift-bag') {
    const w = 0.24 * k * T.w, h = 0.3 * k * T.h, d = 0.11 * k;
    const bm = trim === 'gold' ? fin(T, '#d6a93c', 'glitter') : fin(T, T.p, 'paper', { pattern: T.pattern });
    bm.side = THREE.DoubleSide;
    openBox(w, h, d, 0.002, bm, { parent: root, r: 0.003, name: 'bag' });
    // rope handles
    const hm = trim === 'kraft' ? fin(T, '#d8c9a8', 'fabric') : fin(T, T.s, 'fabric');
    for (const s of [-1, 1]) curveTube([[-w * 0.22, h - 0.02, s * (d / 2 + 0.002)], [-w * 0.2, h + 0.09 * k, s * (d / 2 + 0.002)], [w * 0.2, h + 0.09 * k, s * (d / 2 + 0.002)], [w * 0.22, h - 0.02, s * (d / 2 + 0.002)]], 0.003, hm, { parent: root, segments: 24, name: s > 0 ? 'handle' : 'handle-2' });
    // tissue paper puffs
    const tc = trim === 'birthday' ? ['#ffd23f', '#ff7aa8'] : trim === 'festive' ? ['#f4f1ea', '#1f6a3a'] : ['#f6f1f4', T.a];
    for (let i = 0; i < 4; i++) {
      const c = mesh(new THREE.ConeGeometry(0.06 * k, 0.14 * k, 5, 1, true), fin(T, tc[i % 2], 'paper'), { parent: root, at: [(i - 1.5) * w * 0.18, h + 0.02 * k, (i % 2 - 0.5) * d * 0.3], rot: [(i % 2 - 0.5) * 0.4, i, (i - 1.5) * 0.35] });
      c.material.side = THREE.DoubleSide;
    }
    if (T.detail >= 1 || trim === 'kraft') mesh(new THREE.BoxGeometry(0.045 * k, 0.03 * k, 0.0015), fin(T, '#f3ead8', 'paper'), { parent: root, at: [w * 0.2, h - 0.01, d / 2 + 0.004], rot: [0, 0, 0.3] });
  } else if (variant === 'gift-stack') {
    const sizes = [[0.3, 0.16, 0.24], [0.22, 0.12, 0.18], [0.14, 0.1, 0.12]];
    let y = 0;
    const pal = trim === 'gold' ? ['#d6a93c', '#f3e2a8', '#7a1426'] : trim === 'kraft' ? ['#b58a57', '#c9a878', '#b58a57'] : [T.p, T.s, T.a];
    sizes.forEach(([w, h, d], i) => {
      const P = trim === 'gold' && i !== 1 ? fin(T, pal[i], 'glitter') : fin(T, pal[i], 'paper', { pattern: i === 0 ? T.pattern : null });
      const R = i === 1 ? fin(T, pal[0], 'silk') : rib;
      present(root, T, w * k * T.w, h * k * T.h, d * k, { at: [0, y, 0], rotY: [0, 0.35, -0.2][i], name: `present-${i}`, paper: P, rib: R });
      y += h * k * T.h + 0.0035;
    });
    bow(root, T, 0.07 * k, rib, { at: [0, y, 0] });
  } else if (variant === 'round-hatbox') {
    const R = 0.15 * k * T.w, H = 0.18 * k * T.h, lh = 0.045 * k;
    const bm = paper;
    bm.side = THREE.DoubleSide;
    mesh(vessel([[R, 0], [R, H]], 0.003, 0.004, 48), bm, { parent: root, name: 'box' });
    const lid = group('lid', { parent: root, at: [0, H - lh + 0.006, 0] });
    mesh(lathe([[R + 0.004, 0], [R + 0.004, lh], [0, lh + 0.002], [0, lh - 0.002], [R + 0.001, lh - 0.003], [R + 0.001, 0]], 48), fin(T, trim === 'kraft' ? T.p : T.s, trim === 'gold' ? 'glitter' : 'paper'), { parent: lid, name: 'lid-shell' });
    mesh(new THREE.CylinderGeometry(R + 0.0055, R + 0.0055, 0.02, 48, 1, true), rib, { parent: lid, at: [0, lh / 2, 0] }).material.side = THREE.DoubleSide;
    bow(lid, T, 0.085 * k, rib, { at: [R * 0.4, lh + 0.002, 0] });
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.02, 0.0016, 0.08 * k), rib, { parent: lid, at: [R * 0.4 + s * 0.02, lh + 0.003, 0.04 * k], rot: [0, s * 0.4, 0] });
    if (T.detail >= 1) curveTube([[-R * 0.25, lh + 0.002, 0], [-R * 0.2, lh + 0.06 * k, 0], [R * 0.0, lh + 0.07 * k, 0], [R * 0.2, lh + 0.06 * k, 0], [R * 0.25, lh + 0.002, 0]], 0.004, fin(T, '#3a2214', 'leather'), { parent: lid, segments: 24, name: 'handle' });
    return done(root, 'gift-box', variant, o, () => [clip('open', 3, [moveTrack(lid, 3, (u) => [0, pingPong(u) * 0.1 * k, 0])])]);
  } else {
    // ribbon roll: spool with wound ribbon and a curly loose end
    const R = 0.05 * k * T.w, W = 0.035 * k * T.h, spoolR = R * 1.18;
    const spool = group('spool', { parent: root, at: [0, spoolR, 0], rot: [Math.PI / 2, 0, 0] });
    const sm = trim === 'kraft' ? fin(T, '#b58a57', 'paper') : trim === 'gold' ? M.metal('#d6a93c', 0.3) : fin(T, '#f4f3ef', 'plastic');
    for (const s of [-1, 1]) mesh(lathe([[0.012 * k, 0], [spoolR, 0], [spoolR, 0.0025], [0.012 * k, 0.0025]], 40), sm, { parent: spool, at: [0, s > 0 ? W / 2 : -W / 2 - 0.0025, 0] });
    mesh(new THREE.CylinderGeometry(0.014 * k, 0.014 * k, W + 0.005, 24, 1, true), sm, { parent: spool }).material.side = THREE.DoubleSide;
    const rm = trim === 'kraft' ? fin(T, '#d8c9a8', 'canvas') : trim === 'gold' ? fin(T, '#d6a93c', 'glitter') : fin(T, T.trim ? T.p : '#c8302a', 'silk', { pattern: T.pattern });
    mesh(new THREE.CylinderGeometry(R, R, W * 0.96, 40), rm, { parent: spool, name: 'ribbon' });
    // loose end curling across the ground
    const pts = [[R * 0.2, 0.0012, W * 0.0]];
    for (let i = 1; i <= 14; i++) { const u = i / 14; pts.push([R * 0.2 + u * 0.35 * k, 0.0012 + 0.012 * Math.max(0, Math.sin(u * Math.PI * 3)) * (1 - u), Math.sin(u * Math.PI * 2.2) * 0.05 * k]); }
    pts[0] = [0, 0.0012, 0];
    ribbon(pts, W * 0.9, 0.0012, rm.clone(), { parent: root, name: 'loose-end', seg: 60 });
    return done(root, 'gift-box', variant, o, () => [clip('spin', 3, [spinTrack(spool, 'y', 3)])]);
  }
  return done(root, 'gift-box', variant, o);
}

/* ============================== PARTY SUPPLIES ============================== */

export const PARTY_SUPPLIES_VARIANTS = { 'party-hat': {}, 'balloon-bundle': {}, pinata: {}, 'confetti-popper': {}, 'party-horn': {}, 'streamer-roll': {} };

const PARTY_COLS = {
  null: ['#e8402f', '#3fb6ff', '#ffd23f', '#38c172', '#ff7aa8'],
  birthday: ['#3fb6ff', '#ff7aa8', '#ffd23f', '#a56bff', '#38c172'],
  festive: ['#b3202a', '#1f6a3a', '#e8c34a', '#f4f1ea', '#b3202a'],
  gold: ['#d6a93c', '#1b1b1d', '#f3e2a8', '#d6a93c', '#c9ccd2'],
  neon: ['#c8ff12', '#ff2bd6', '#00e5ff', '#ff8a00', '#c8ff12'],
  pastel: ['#b9dcd2', '#f6d3df', '#f4e3a1', '#cdbff0', '#bfe3f4'],
  striped: ['#1f3f73', '#c8302a', '#f2efe8', '#1f3f73', '#c8302a'],
};

export function createPartySupplies(options = {}) {
  const { o, variant, T, trim } = setup(options, PARTY_SUPPLIES_VARIANTS, 'party-supplies', { p: '#3fb6ff', s: '#ff7aa8', a: '#ffd23f', mat: 'paper' });
  const root = group(`party-supplies-${variant}`);
  const k = T.k;
  const C = PARTY_COLS[trim] ?? PARTY_COLS.null;
  const shiny = trim === 'gold' ? 'glitter' : trim === 'neon' ? 'gloss' : 'paper';
  if (variant === 'party-hat') {
    const R = 0.075 * k * T.w, H = 0.2 * k * T.h * (trim === 'gold' ? 0.8 : 1);
    const hm = fin(T, C[0], shiny, { pattern: trim === 'gold' ? null : T.pattern ?? 'stripes' });
    hm.side = THREE.DoubleSide;
    if (trim === 'gold') {
      // crown-style party hat
      const pts = [];
      for (let i = 0; i <= 80; i++) { const a = (i / 80) * Math.PI * 2; pts.push([a, Math.abs(Math.sin(a * 3.5))]); }
      const g = new THREE.CylinderGeometry(R, R, H, 80, 6, true);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i); if (y > 0) { const a = Math.atan2(z, x); p.setY(i, -H / 2 + H * (0.55 + 0.45 * Math.abs(Math.cos(a * 3)))); } }
      g.computeVertexNormals();
      mesh(g, hm, { parent: root, at: [0, H / 2, 0], name: 'hat' });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.008 * k, 10, 8), fin(T, C[i % 2 ? 1 : 2] === '#1b1b1d' ? '#c8302a' : '#2457b8', 'gloss'), { parent: root, at: [Math.cos(a) * R * 1.01, H * 0.98, Math.sin(a) * R * 1.01] }); }
    } else {
      mesh(lathe([[R, 0], [R * 0.5, H * 0.5], [0.001, H]], 48), hm, { parent: root, name: 'hat' });
      // fringe trim around the brim + pompom
      const fr = fin(T, C[1], trim === 'neon' ? 'gloss' : 'paper');
      for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; mesh(new THREE.BoxGeometry(0.004, 0.022 * k, 0.012 * k), fr, { parent: root, at: [Math.cos(a) * R, 0.011 * k, Math.sin(a) * R], rot: [0, -a, 0.3] }); }
      const pom = new THREE.IcosahedronGeometry(0.025 * k * (T.chunky ? 1.3 : 1), 2);
      const pp = pom.attributes.position;
      for (let i = 0; i < pp.count; i++) { const f = 1 + 0.25 * Math.sin(i * 12.9898) ; pp.setXYZ(i, pp.getX(i) * f, pp.getY(i) * f, pp.getZ(i) * f); }
      pom.computeVertexNormals();
      mesh(pom, fin(T, C[2], 'fabric'), { parent: root, at: [0, H + 0.012 * k, 0], name: 'pompom' });
    }
    // elastic string lying on the ground
    curveTube([[R * 0.98, 0.002, 0], [R * 1.4, 0.0015, R * 0.6], [0, 0.0015, R * 1.6], [-R * 1.3, 0.0015, R * 0.7], [-R * 0.98, 0.002, 0]], 0.0012, fin(T, '#f4f4f2', 'rubber'), { parent: root, segments: 32 });
  } else if (variant === 'balloon-bundle') {
    const n = T.chunky ? 3 : trim === 'gold' ? 4 : 5;
    const wt = group('weight', { parent: root });
    const wm = trim === 'gold' ? M.metal('#d6a93c', 0.25) : fin(T, C[0], 'gloss');
    if (trim === 'birthday' || trim === 'pastel') {
      // heart-shaped weight
      const s = new THREE.Shape();
      s.moveTo(0, -0.03); s.bezierCurveTo(0.05, 0.0, 0.035, 0.04, 0, 0.022); s.bezierCurveTo(-0.035, 0.04, -0.05, 0.0, 0, -0.03);
      const hg = extrudeOutline(s, 0.03 * k, { bevel: 0.006 });
      mesh(hg, wm, { parent: wt, at: [0, 0.033, 0], scale: k });
    } else mesh(roundedBox(0.08 * k, 0.07 * k, 0.08 * k, 0.014 * k), wm, { parent: wt, at: [0, 0.025 * k, 0] });
    const top = 0.07 * k;
    const sm = fin(T, trim === 'gold' ? '#d6a93c' : '#f4f4f2', trim === 'gold' ? 'gold' : 'silk');
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.4;
      const BR = 0.14 * k * (0.9 + 0.15 * ((i * 7) % 3) / 2);
      const Hb = (0.75 + 0.18 * ((i * 5) % 4) / 3) * k * T.h;
      const off = i === 0 && n > 3 ? 0 : 0.17 * k * T.w;
      const pos = [Math.cos(a) * off, Hb, Math.sin(a) * off];
      const bm = trim === 'gold' && i % 2 ? M.metal(C[i % C.length], 0.15) : fin(T, C[i % C.length], 'gloss');
      if (trim === 'neon') { bm.emissive = M.toColor(C[i % C.length]); bm.emissiveIntensity = 0.25; }
      const b = mesh(new THREE.SphereGeometry(1, 32, 24), bm, { parent: root, at: [pos[0], pos[1] + BR * 1.15, pos[2]], name: `balloon-${i}` });
      // egg shape: narrower bottom
      const bp = b.geometry.attributes.position;
      for (let j = 0; j < bp.count; j++) { const y = bp.getY(j); const f = y < 0 ? 1 + y * 0.18 : 1; bp.setXYZ(j, bp.getX(j) * f * BR, y * BR * 1.15, bp.getZ(j) * f * BR); }
      b.geometry.computeVertexNormals();
      mesh(new THREE.ConeGeometry(0.008 * k, 0.014 * k, 10).rotateX(Math.PI), bm, { parent: root, at: [pos[0], pos[1] + 0.003, pos[2]] });
      curveTube([[pos[0], pos[1] - 0.003, pos[2]], [pos[0] * 0.6 + 0.02 * Math.sin(i), pos[1] * 0.55, pos[2] * 0.6], [pos[0] * 0.2, top + 0.08, pos[2] * 0.2], [0, top - 0.004, 0]], 0.0016, sm, { parent: root, segments: 32, radialSegments: 5 });
    }
    return done(root, 'party-supplies', variant, o, () => [clip('float', 3, root.children.filter((c) => c.name.startsWith('balloon')).map((b, i) => moveTrack(b, 3, (u) => [0, wave(u + i * 0.2) * 0.012, wave(u + i * 0.3) * 0.006])))]);
  } else if (variant === 'pinata') {
    const R = 0.14 * k;
    const cm = (i) => fin(T, C[i % C.length], trim === 'gold' ? 'glitter' : 'paper');
    const g = group('pinata', { parent: root });
    if (trim === 'birthday' || trim === 'pastel') {
      // donkey piñata with fringe bands
      const bodyY = 0.42 * k;
      const body = mesh(roundedBox(0.42 * k, 0.2 * k, 0.16 * k, 0.05 * k), cm(0), { parent: g, at: [0, bodyY, 0], name: 'body' });
      void body;
      for (let i = 0; i < 6; i++) mesh(roundedBox(0.424 * k, 0.03 * k, 0.164 * k, 0.012), cm(i + 1), { parent: g, at: [0, bodyY - 0.08 * k + i * 0.032 * k, 0] });
      for (const [x, z] of [[-0.15, -0.05], [-0.15, 0.05], [0.15, -0.05], [0.15, 0.05]]) mesh(roundedBox(0.05 * k, 0.33 * k, 0.05 * k, 0.015 * k), cm(2), { parent: g, at: [x * k, 0.165 * k, z * k] });
      mesh(roundedBox(0.08 * k, 0.24 * k, 0.09 * k, 0.03 * k), cm(1), { parent: g, at: [0.2 * k, bodyY + 0.14 * k, 0], rot: [0, 0, -0.35], name: 'neck' });
      mesh(roundedBox(0.17 * k, 0.09 * k, 0.09 * k, 0.03 * k), cm(3), { parent: g, at: [0.29 * k, bodyY + 0.26 * k, 0], rot: [0, 0, -0.2], name: 'head' });
      for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.02 * k, 0.1 * k, 8), cm(4), { parent: g, at: [0.24 * k, bodyY + 0.34 * k, s * 0.025 * k], rot: [s * 0.25, 0, 0.2] });
      for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.009 * k, 10, 8), fin(T, '#111', 'gloss'), { parent: g, at: [0.33 * k, bodyY + 0.285 * k, s * 0.045 * k] });
      curveTube([[-0.21 * k, bodyY + 0.03 * k, 0], [-0.27 * k, bodyY - 0.05 * k, 0], [-0.28 * k, bodyY - 0.15 * k, 0]], 0.012 * k, cm(4), { parent: g, segments: 12 });
    } else {
      // classic 7-point star piñata
      const cy = R + 0.12 * k;
      mesh(new THREE.SphereGeometry(R, 32, 24), cm(0), { parent: g, at: [0, cy + 0.1 * k, 0], name: 'body' });
      const dirs = [];
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + Math.PI / 2; dirs.push([Math.cos(a), Math.sin(a), 0]); }
      dirs.push([0, 0, 1], [0, 0, -1]);
      dirs.forEach((d, i) => {
        const L = 0.22 * k * T.h;
        const cone = mesh(new THREE.ConeGeometry(0.06 * k, L, 20).translate(0, L / 2 + R * 0.85, 0), cm(i + 1), { parent: g, at: [0, cy + 0.1 * k, 0] });
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...d).normalize());
        const tip = new THREE.Vector3(...d).normalize().multiplyScalar(R * 0.85 + L);
        // tassel streamers at the tip
        for (let j = 0; j < 3; j++) curveTube([[tip.x, tip.y + cy + 0.1 * k, tip.z], [tip.x + (j - 1) * 0.015, tip.y + cy + 0.1 * k - 0.06 * k, tip.z + 0.01], [tip.x + (j - 1) * 0.025, tip.y + cy + 0.1 * k - 0.12 * k, tip.z + 0.015]], 0.004 * k, cm(i + j + 2), { parent: g, segments: 8, radialSegments: 5 });
      });
      for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(R * (0.9 + i * 0.03), 0.012 * k, 6, 40), cm(i + 3), { parent: g, at: [0, cy + 0.1 * k, 0], rot: [Math.PI / 2 + (i - 1) * 0.5, 0, 0] });
      // hanging cord loop on top
      curveTube([[-0.01, cy + 0.1 * k + R * 0.98, 0], [-0.03, cy + 0.1 * k + R + 0.06, 0], [0.03, cy + 0.1 * k + R + 0.06, 0], [0.01, cy + 0.1 * k + R * 0.98, 0]], 0.003, fin(T, '#d8c9a8', 'fabric'), { parent: g, segments: 16 });
    }
    return done(root, 'party-supplies', variant, o, () => [clip('swing', 2.4, [rotateTrack(g, 'z', 2.4, (u) => wave(u) * 0.04)])]);
  } else if (variant === 'confetti-popper') {
    const R = 0.024 * k * T.w, H = 0.2 * k * T.h;
    const tm2 = fin(T, C[0], shiny, { pattern: T.pattern ?? 'stripes' });
    mesh(new THREE.CylinderGeometry(R, R, H, 32), tm2, { parent: root, at: [0, H / 2 + 0.02 * k, 0], name: 'tube' });
    // twist base + foil top
    mesh(lathe([[0, 0], [R * 0.9, 0], [R * 1.05, 0.02 * k], [R, 0.022 * k], [0, 0.022 * k]], 24), fin(T, '#f4f4f2', 'plastic'), { parent: root, name: 'base' });
    for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(0.002, 0.016 * k, R * 0.3), fin(T, '#d8d8d8', 'plastic'), { parent: root, at: [Math.cos(i) * R * 0.98, 0.01 * k, Math.sin(i) * R * 0.98], rot: [0, -i, 0.3] });
    mesh(new THREE.CylinderGeometry(R * 1.02, R * 1.02, 0.008, 32), M.metal(trim === 'gold' ? '#d6a93c' : C[1], 0.2), { parent: root, at: [0, H + 0.024 * k, 0] });
    // confetti scattered on the ground + curly streamers
    const R2 = (i) => (Math.sin(i * 91.7 + 13.1) + 1) / 2;
    for (let i = 0; i < 30; i++) {
      const a = i * 2.39, r = 0.04 + R2(i) * 0.2 * k;
      mesh(new THREE.BoxGeometry(0.008, 0.0006, 0.005), fin(T, C[i % C.length], trim === 'gold' ? 'gold' : 'paper'), { parent: root, at: [Math.cos(a) * r + 0.1 * k, 0.0003, Math.sin(a) * r], rot: [0, a, 0] });
    }
    for (let j = 0; j < 3; j++) {
      const pts = [];
      for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([0.04 * k + u * 0.28 * k, 0.003 + 0.006 * Math.abs(Math.sin(u * 9)), (j - 1) * 0.06 * k + Math.sin(u * 8 + j) * 0.03 * k]); }
      ribbon(pts, 0.006, 0.0006, fin(T, C[(j + 2) % C.length], 'paper'), { parent: root, seg: 40 });
    }
  } else if (variant === 'party-horn') {
    // blowout horn: mouthpiece + paper tube coiled flat on the ground
    const mp = group('horn', { parent: root });
    const Rt = 0.008 * k;
    mesh(lathe([[0, 0], [0.006 * k, 0], [0.007 * k, 0.03 * k], [0.011 * k, 0.05 * k], [0.011 * k, 0.055 * k], [0, 0.055 * k]], 20).rotateZ(Math.PI / 2).translate(0.055 * k, Rt, 0), fin(T, C[1], 'plastic'), { parent: mp, name: 'mouthpiece' });
    const pts = [[0, Rt, 0], [-0.04 * k, Rt, 0]];
    const turns = T.chunky ? 1.6 : 2.4;
    for (let i = 1; i <= 40; i++) { const u = i / 40; const a = u * turns * Math.PI * 2; const r = 0.06 * k * (1 - u * 0.75); pts.push([-0.04 * k - 0.06 * k + Math.cos(a) * r, Rt, -Math.sin(a) * r]); }
    const tube = curveTube(pts, Rt, fin(T, C[0], shiny, { pattern: T.pattern ?? 'stripes' }), { parent: mp, segments: 120, radialSegments: 10, name: 'coil' });
    tube.scale.y = 0.45;
    if (T.detail >= 1 || trim === 'festive') for (let i = 0; i < 8; i++) mesh(new THREE.BoxGeometry(0.003, 0.02 * k, 0.012 * k), fin(T, C[2], 'paper'), { parent: mp, at: [0.002, Rt + Math.sin(i) * Rt * 0.9, Math.cos(i) * Rt * 0.9], rot: [i, 0, 0] });
  } else {
    // crepe streamer roll on its edge + unrolled strip
    const R = 0.05 * k * T.w, W = 0.045 * k * T.h;
    const roll = group('roll', { parent: root, at: [0, R, 0], rot: [Math.PI / 2, 0, 0] });
    const rm = fin(T, C[0], trim === 'gold' ? 'glitter' : 'paper', { pattern: trim === 'striped' ? 'stripes' : null });
    mesh(lathe([[0.018 * k, -W / 2], [R, -W / 2], [R, W / 2], [0.018 * k, W / 2]], 48), rm, { parent: roll, name: 'crepe' });
    mesh(new THREE.CylinderGeometry(0.018 * k, 0.018 * k, W, 24, 1, true), fin(T, '#c9a878', 'paper'), { parent: roll }).material.side = THREE.DoubleSide;
    const pts = [[R * 0.6, 0.0008, 0]];
    for (let i = 1; i <= 16; i++) { const u = i / 16; pts.push([R * 0.6 + u * 0.5 * k, 0.0008 + 0.01 * Math.max(0, Math.sin(u * 20)) * (1 - u), Math.sin(u * 6) * 0.06 * k]); }
    pts.unshift([0, 0.0008, 0]);
    ribbon(pts, W, 0.0008, rm.clone(), { parent: root, seg: 80, name: 'strip' });
    if (T.detail >= 1 || trim === 'neon') {
      const r2 = group('roll-2', { parent: root, at: [-0.03 * k, R * 0.9, -W * 1.4], rot: [Math.PI / 2, 0, 0.0] });
      mesh(lathe([[0.018 * k, -W / 2], [R * 0.9, -W / 2], [R * 0.9, W / 2], [0.018 * k, W / 2]], 48), fin(T, C[1], 'paper'), { parent: r2 });
    }
    return done(root, 'party-supplies', variant, o, () => [clip('roll', 3, [spinTrack(roll, 'y', 3)])]);
  }
  return done(root, 'party-supplies', variant, o);
}

/* =================================== AWARD =================================== */

export const AWARD_VARIANTS = { 'trophy-cup': {}, plaque: {}, medal: {}, 'rosette-ribbon': {}, 'certificate-frame': {} };

function awardMetal(T) {
  switch (T.trim) {
    case 'silver': return M.metal('#cfd2d8', 0.16);
    case 'brass': return M.metal('#a8673a', T.worn ? 0.5 : 0.3);
    case 'glass': return Object.assign(M.glass({ tint: '#dff2f6', opacity: 0.55 }), { roughness: 0.02 });
    case 'kids': return fin(T, '#ffcc1e', 'plastic');
    case 'wooden': return M.metal('#d6a93c', 0.25);
    default: return M.metal('#d6a93c', 0.18);
  }
}

export function createAward(options = {}) {
  const { o, variant, T, trim } = setup(options, AWARD_VARIANTS, 'award', { p: '#d6a93c', s: '#1b1b1d', a: '#c8302a', mat: 'gold' });
  const root = group(`award-${variant}`);
  const k = T.k;
  const gm = awardMetal(T);
  const baseM = trim === 'wooden' ? fin(T, '#5b3a24', 'wood') : trim === 'glass' ? fin(T, '#1b1b1d', 'gloss') : trim === 'kids' ? fin(T, '#2b7de1', 'plastic') : trim === 'brass' ? fin(T, '#3a2a1e', 'wood') : fin(T, '#1b1b1d', 'gloss');
  if (variant === 'trophy-cup') {
    const s = k * (trim === 'kids' ? 0.8 : 1);
    const bw = 0.13 * s, bh = 0.05 * s;
    mesh(roundedBox(bw, bh, bw, 0.006 * s), baseM, { parent: root, at: [0, bh / 2, 0], name: 'base' });
    if (T.detail >= 1 || trim === 'wooden') mesh(roundedBox(bw * 0.8, bh * 0.8, bw * 0.8, 0.005 * s), baseM, { parent: root, at: [0, bh + bh * 0.4, 0] });
    const y0 = T.detail >= 1 || trim === 'wooden' ? bh * 1.8 : bh;
    mesh(roundedBox(bw * 0.6, bh * 0.4, 0.002, 0.0008), M.metal('#d6b45a', 0.25), { parent: root, at: [0, bh * 0.5, bw / 2 + 0.0008], name: 'plate' });
    const H = 0.28 * s * T.h, W = T.w;
    const prof = trim === 'glass'
      ? [[0.03 * s, 0], [0.012 * s, 0.03 * s], [0.012 * s, 0.08 * s], [0.08 * W * s, H * 0.6], [0.09 * W * s, H]]
      : [[0.035 * s, 0], [0.012 * s, 0.025 * s], [0.012 * s, 0.06 * s], [0.025 * s, 0.075 * s], [0.012 * s, 0.09 * s], [0.03 * s, 0.11 * s], [0.07 * W * s, H * 0.62], [0.085 * W * s, H]];
    mesh(vessel(prof, 0.003, 0.11 * s, 48), gm, { parent: root, at: [0, y0, 0], name: 'cup' });
    if (trim !== 'glass') for (const sd of [-1, 1]) curveTube([[sd * 0.075 * W * s, y0 + H * 0.88, 0], [sd * 0.14 * W * s, y0 + H * 0.9, 0], [sd * 0.13 * W * s, y0 + H * 0.55, 0], [sd * 0.055 * W * s, y0 + H * 0.45, 0]], 0.008 * s * (T.chunky ? 1.5 : 1), gm, { parent: root, segments: 24, name: sd > 0 ? 'handle' : 'handle-2' });
    if (trim === 'brass' || T.detail >= 2) {
      const lid = group('lid', { parent: root, at: [0, y0 + H - 0.002, 0] });
      mesh(lathe([[0, 0], [0.09 * W * s, 0], [0.06 * s, 0.03 * s], [0.012 * s, 0.04 * s], [0.02 * s, 0.06 * s], [0, 0.065 * s]], 40), gm, { parent: lid });
    }
    if (trim === 'kids') { const st = brandEmblem(0.05 * s); st.position.set(0, y0 + H * 0.65, 0.067 * s + 0.002); st.rotation.x = -0.12; root.add(st); }
  } else if (variant === 'plaque') {
    const W = 0.2 * k * T.w, H = 0.26 * k * T.h, D = 0.02 * k;
    const g = group('plaque', { parent: root, rot: [-0.18, 0, 0] });
    const shield = trim === 'kids' || trim === 'brass';
    let geo;
    if (shield) {
      const pts = [];
      for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([W / 2 * (t < 0.45 ? 1 : Math.cos(((t - 0.45) / 0.55) * Math.PI / 2) ** 0.7), H * (1 - t)]); }
      geo = extrudeOutline([...pts, ...pts.slice().reverse().map(([x, y]) => [-x, y])], D, { bevel: 0.004 });
    } else geo = roundedBox(W, H, D, 0.008 * T.round);
    if (!shield) geo.translate(0, H / 2, 0);
    mesh(geo, trim === 'glass' ? Object.assign(M.glass({ tint: '#dff2f6', opacity: 0.6 }), { roughness: 0.02 }) : baseM, { parent: g, name: 'board' });
    const pw = W * 0.72, ph = H * 0.45;
    mesh(roundedBox(pw, ph, 0.003, 0.002), gm, { parent: g, at: [0, H * 0.55, D / 2 + 0.0012], name: 'plate' });
    const lbl = labelPlane(pw * 0.86, ph * 0.7, textDraw(['AWARD', 'of Excellence', '2026'], { bg: trim === 'silver' || trim === 'glass' ? '#d8dbe0' : '#d6b45a', fg: '#2a2010', font: 'bold' }), { bg: '#d6b45a' });
    lbl.position.set(0, H * 0.55, D / 2 + 0.0031); g.add(lbl);
    const em = brandEmblem(0.04 * k); em.position.set(0, H * 0.84, D / 2 + 0.0005); g.add(em);
    // back strut
    mesh(roundedBox(0.03 * k, H * 0.7, 0.006, 0.002), baseM, { parent: root, at: [0, H * 0.33, -0.06 * k], rot: [0.3, 0, 0], name: 'strut' });
  } else if (variant === 'medal') {
    const R = 0.035 * k * T.w;
    const rm = trim === 'kids' ? fin(T, '#ff4d6d', 'silk') : trim === 'silver' ? fin(T, '#1f3f73', 'silk') : trim === 'brass' ? fin(T, '#2f7a4a', 'silk') : fin(T, '#c8302a', 'silk', { pattern: trim === 'wooden' ? null : 'stripes' });
    const md = group('medal', { parent: root, at: [0, 0, 0.08 * k] });
    const mm = trim === 'wooden' ? fin(T, '#a5733f', 'wood') : gm;
    mesh(lathe([[0, 0], [R, 0], [R, 0.003], [R * 0.92, 0.0045], [R * 0.86, 0.004], [R * 0.6, 0.0055], [0, 0.006]], 48), mm, { parent: md, name: 'disc' });
    const star = [];
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5; const r = (i % 2 ? 0.4 : 1) * R * 0.5; star.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const sg = extrudeOutline(star, 0.002, { bevel: 0.0006, segments: 1 });
    sg.rotateX(-Math.PI / 2);
    mesh(sg, trim === 'wooden' ? M.metal('#d6a93c', 0.25) : mm, { parent: md, at: [0, 0.0062, 0] });
    mesh(new THREE.TorusGeometry(0.006 * k, 0.0015, 6, 16), mm, { parent: md, at: [0, 0.0015, -R - 0.004], rot: [Math.PI / 2, 0, 0] });
    // V-shaped neck ribbon lying flat
    const rw = 0.025 * k;
    ribbon([[-0.004, 0.0008, 0.08 * k - R - 0.008], [-0.04 * k, 0.0008, -0.05 * k], [-0.06 * k, 0.0008, -0.16 * k], [-0.02 * k, 0.0008, -0.23 * k], [0.02 * k, 0.0008, -0.23 * k], [0.06 * k, 0.0008, -0.16 * k], [0.04 * k, 0.0008, -0.05 * k], [0.004, 0.0008, 0.08 * k - R - 0.008]], rw, 0.0008, rm, { parent: root, seg: 80, name: 'ribbon' });
  } else if (variant === 'rosette-ribbon') {
    const R = 0.06 * k * T.w;
    const c1 = trim === 'silver' ? '#c9ccd2' : trim === 'brass' ? '#a8673a' : trim === 'kids' ? '#ff4d6d' : trim === 'glass' ? '#9fd4f4' : trim === 'wooden' ? '#2f7a4a' : '#2457b8';
    const pm = fin(T, c1, 'silk');
    pm.side = THREE.DoubleSide;
    // tails first (on the ground), V-notched
    for (const sd of [-1, 1]) {
      const tail = new THREE.Shape([[-0.018, 0], [0.018, 0], [0.018, -0.15], [0, -0.13], [-0.018, -0.15]].map(([x, y]) => new THREE.Vector2(x * k, y * k * T.h)));
      const tg = extrudeOutline(tail, 0.0012, { bevel: 0 });
      tg.rotateX(-Math.PI / 2);
      mesh(tg, fin(T, c1, 'silk'), { parent: root, at: [sd * 0.022 * k, 0.0006, 0.02 * k], rot: [0, sd * 0.25, 0], name: sd > 0 ? 'tail' : 'tail-2' });
    }
    mesh(pleatDisc(R * 0.35, R, 18, 0.008 * k, { rise: 0.01 * k }), pm, { parent: root, at: [0, 0.004, 0], name: 'pleats' });
    if (T.detail >= 1 || trim === 'wooden' || trim === 'brass') mesh(pleatDisc(R * 0.3, R * 0.72, 14, 0.006 * k, { rise: 0.008 * k }), fin(T, trim === 'kids' ? '#ffcc1e' : '#f4f1ea', 'silk'), { parent: root, at: [0, 0.012 * k, 0] }).material.side = THREE.DoubleSide;
    mesh(new THREE.CylinderGeometry(R * 0.38, R * 0.4, 0.008, 40), fin(T, trim === 'wooden' ? '#f4f1ea' : '#d6a93c', trim === 'wooden' ? 'paper' : 'gold'), { parent: root, at: [0, 0.016 * k, 0], name: 'button' });
    const lb = labelPlane(R * 0.6, R * 0.6, (g, w, h) => { g.fillStyle = '#d6b45a'; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, 7); g.fill(); g.fillStyle = '#2a2010'; g.font = `bold ${h * 0.5}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1st', w / 2, h / 2); }, { bg: '#d6b45a' });
    lb.material.transparent = true; lb.rotation.x = -Math.PI / 2; lb.position.y = 0.016 * k + 0.0042; root.add(lb);
  } else {
    // certificate in a frame on a back stand
    const W = 0.3 * k * T.w, H = 0.22 * k * T.h, D = 0.015 * k, fw = 0.018 * k * (T.chunky ? 1.4 : 1);
    const fm = trim === 'wooden' ? fin(T, '#5b3a24', 'wood') : trim === 'kids' ? fin(T, '#2b7de1', 'plastic') : trim === 'glass' ? fin(T, '#f4f3ef', 'gloss') : trim === 'silver' ? M.metal('#cfd2d8', 0.25) : trim === 'brass' ? M.metal('#a8673a', 0.35) : M.metal('#d6a93c', 0.25);
    const g = group('frame', { parent: root, rot: [-0.15, 0, 0] });
    const s = new THREE.Shape([[-W / 2, 0], [W / 2, 0], [W / 2, H], [-W / 2, H]].map(([x, y]) => new THREE.Vector2(x, y)));
    s.holes.push(new THREE.Path([[-W / 2 + fw, fw], [-W / 2 + fw, H - fw], [W / 2 - fw, H - fw], [W / 2 - fw, fw]].map(([x, y]) => new THREE.Vector2(x, y))));
    mesh(extrudeOutline(s, D, { bevel: 0.003 }), fm, { parent: g, name: 'frame' });
    mesh(roundedBox(W - fw, H - fw, 0.003, 0.001), fin(T, '#3a2a1e', 'matte'), { parent: g, at: [0, H / 2, -D / 2 + 0.002] });
    const cert = labelPlane(W - 2 * fw, H - 2 * fw, (c, w, h) => {
      c.fillStyle = '#fbf6e8'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#b8913f'; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20);
      c.fillStyle = '#2a2010'; c.textAlign = 'center'; c.font = `bold ${h * 0.12}px serif`; c.fillText('Certificate', w / 2, h * 0.3);
      c.font = `${h * 0.07}px serif`; c.fillText('of Achievement', w / 2, h * 0.42); c.fillText('awarded to', w / 2, h * 0.55);
      c.font = `italic ${h * 0.09}px serif`; c.fillText('A. Champion', w / 2, h * 0.68);
      c.fillStyle = '#c8302a'; c.beginPath(); c.arc(w * 0.82, h * 0.8, h * 0.07, 0, 7); c.fill();
    }, { bg: '#fbf6e8', px: 512 });
    cert.position.set(0, H / 2, -D / 2 + 0.0037); g.add(cert);
    mesh(roundedBox(0.04 * k, H * 0.75, 0.006, 0.002), fin(T, '#3a2a1e', 'matte'), { parent: root, at: [0, H * 0.36, -0.055 * k], rot: [0.32, 0, 0], name: 'stand' });
  }
  return done(root, 'award', variant, o);
}

/* =================================== MONEY =================================== */

export const MONEY_VARIANTS = { coin: {}, 'coin-stack': {}, 'banknote-stack': {}, 'money-roll': {}, 'credit-card': {}, 'piggy-bank': {}, 'cash-box': {} };

const coinMetal = (T) => (T.trim === 'silver' ? M.metal('#cfd2d8', 0.25) : T.trim === 'vintage' ? M.metal('#8a5a34', 0.55) : T.trim === 'plastic' ? fin(T, '#e8402f', 'plastic') : T.trim === 'black' ? M.metal('#2a2b2e', 0.3) : T.trim === 'pink' ? M.metal('#d9967f', 0.22) : M.metal('#d6a93c', 0.22));
const NOTE_COL = { null: '#5f8f6a', gold: '#c9a24a', silver: '#7f93a8', vintage: '#b3a07a', plastic: '#4f7fbf', black: '#3a3c40', pink: '#d77aa0' };

function coinGeo(R, t) {
  return lathe([[0, 0], [R * 0.96, 0], [R, t * 0.15], [R, t * 0.85], [R * 0.96, t], [R * 0.88, t], [R * 0.86, t * 0.85], [R * 0.4, t * 0.88], [0, t * 0.9]], 40);
}
function noteTex(col, val) {
  return canvasTex(512, 220, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 6; g.strokeRect(12, 12, w - 24, h - 24);
    for (let i = 0; i < 30; i++) { g.strokeStyle = `rgba(0,0,0,${0.05 + (i % 3) * 0.03})`; g.beginPath(); g.ellipse(w * 0.3, h / 2, 20 + i * 3, 12 + i * 2.5, 0, 0, 7); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(w * 0.72, h / 2, h * 0.3, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.65)'; g.font = `bold ${h * 0.32}px serif`; g.textAlign = 'left'; g.fillText(val, 30, h * 0.36); g.textAlign = 'right'; g.fillText(val, w - 30, h * 0.9);
    g.font = `bold ${h * 0.1}px sans-serif`; g.textAlign = 'center'; g.fillText('ORBIX RESERVE', w * 0.72, h * 0.2);
  });
}
function noteMat(T, val = '50') {
  const col = NOTE_COL[T.trim] ?? NOTE_COL.null;
  const map = noteTex(col, val);
  return new THREE.MeshStandardMaterial({ name: 'banknote', color: map ? '#ffffff' : col, map, roughness: T.trim === 'plastic' ? 0.4 : 0.85 });
}

export function createMoney(options = {}) {
  const { o, variant, T, trim } = setup(options, MONEY_VARIANTS, 'money', { p: '#d6a93c', s: '#5f8f6a', a: '#2a2b2e', mat: 'gold' });
  const root = group(`money-${variant}`);
  const k = T.k;
  const cm = coinMetal(T);
  if (variant === 'coin') {
    // one large coin standing on a small display stand, plus one lying
    const R = 0.0135 * (trim === 'vintage' ? 1.4 : trim === 'plastic' ? 1.25 : 1) * T.w, t = 0.0022 * (T.chunky ? 1.3 : 1);
    mesh(coinGeo(R, t), cm, { parent: root, at: [R * 2.4, 0, 0], name: 'coin' });
    const st = group('standing', { parent: root, at: [0, R, 0], rot: [Math.PI / 2, 0, 0] });
    mesh(coinGeo(R, t), cm, { parent: st, at: [0, -t / 2, 0], name: 'coin-2' });
    if (trim === 'vintage' || trim === 'black') for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; mesh(new THREE.BoxGeometry(0.0006, t * 0.6, 0.0006), cm, { parent: root, at: [R * 2.4 + Math.cos(a) * R * 0.75, t * 0.88, Math.sin(a) * R * 0.75] }); }
    const em = brandEmblem(R * 0.9); em.rotation.x = -Math.PI / 2; em.position.set(R * 2.4, t * 0.9 + 0.0002, 0); root.add(em);
    return done(root, 'money', variant, o, () => [clip('spin', 1.5, [spinTrack(st, 'z', 1.5)])]);
  }
  if (variant === 'coin-stack') {
    const R = 0.0125 * T.w, t = 0.0021;
    const stacks = T.chunky ? [12, 7] : [16, 10, 6, 3];
    const tex = trim === 'vintage';
    stacks.forEach((n, si) => {
      const x = (si % 2) * R * 2.25 - R, z = Math.floor(si / 2) * R * 2.25 - R;
      for (let i = 0; i < n; i++) mesh(coinGeo(R * (tex && i % 3 === 0 ? 1.1 : 1), t), si === 1 && trim !== 'plastic' ? M.metal('#cfd2d8', 0.25) : cm, { parent: root, at: [x + Math.sin(i * 3.1) * 0.0006, i * t * 0.99, z + Math.cos(i * 2.3) * 0.0006], name: i ? undefined : `stack-${si}` });
    });
    for (let i = 0; i < 3; i++) mesh(coinGeo(R, t), cm, { parent: root, at: [R * 3 + i * R * 1.2, 0, R * 1.5 - i * R * 1.4] });
  } else if (variant === 'banknote-stack') {
    const W = 0.156, D = 0.066, nt = 0.0001;
    const bundles = T.chunky ? 1 : trim === 'gold' ? 3 : 2;
    const nm = noteMat(T, trim === 'gold' ? '100' : '50');
    for (let b = 0; b < bundles; b++) {
      const h = 0.012 * T.h * (b === 0 ? 1 : 0.85);
      const y0 = b * 0.0125 * T.h;
      const bg = group(`bundle-${b}`, { parent: root, at: [b * 0.01, y0, b * 0.008], rot: [0, b * 0.18, 0] });
      // side edges (paper) + printed top
      mesh(roundedBox(W, h, D, 0.0008), fin(T, '#e8e2d0', 'paper'), { parent: bg, at: [0, h / 2, 0] });
      const top = mesh(new THREE.PlaneGeometry(W * 0.995, D * 0.99), nm, { parent: bg, at: [0, h + nt, 0], rot: [-Math.PI / 2, 0, 0] });
      void top;
      // paper band
      mesh(new THREE.BoxGeometry(0.03, h + 0.0008, D + 0.0012), fin(T, trim === 'black' ? '#c8302a' : '#c9b28a', 'paper'), { parent: bg, at: [0, h / 2, 0] });
    }
    // loose fanned notes
    if (T.detail >= 1 || trim === 'vintage' || trim === 'pink') for (let i = 0; i < 3; i++) mesh(roundedBox(W, 0.0004, D, 0.0001), nm, { parent: root, at: [-0.11 + i * 0.012, 0.0002 + i * 0.0004, 0.06], rot: [0, 0.3 + i * 0.25, 0] });
  } else if (variant === 'money-roll') {
    const L = 0.066, R = 0.014 * (T.chunky ? 1.3 : 1) * T.w;
    const nm = noteMat(T, '20');
    const roll = group('roll', { parent: root, at: [0, R, 0], rot: [0, 0, Math.PI / 2] });
    mesh(new THREE.CylinderGeometry(R, R, L, 32), nm, { parent: roll, name: 'notes' });
    // spiral end caps (rolled paper look)
    for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(R * 0.55, R * 0.06, 6, 24), fin(T, '#d8d0bc', 'paper'), { parent: roll, at: [0, s * L / 2, 0], rot: [Math.PI / 2, 0, 0] });
    mesh(new THREE.TorusGeometry(R * 1.02, 0.0016, 8, 32), trim === 'gold' ? M.metal('#d6a93c', 0.2) : fin(T, trim === 'black' ? '#e8402f' : '#c88a3a', 'rubber'), { parent: roll, rot: [Math.PI / 2, 0, 0], name: 'band' });
    if (T.detail >= 1 || trim === 'gold') { const r2 = group('roll-2', { parent: root, at: [0, R, 2 * R + 0.001], rot: [0, 0.3, Math.PI / 2] }); mesh(new THREE.CylinderGeometry(R, R, L, 32), nm, { parent: r2 }); mesh(new THREE.TorusGeometry(R * 1.02, 0.0016, 8, 32), fin(T, '#c88a3a', 'rubber'), { parent: r2, rot: [Math.PI / 2, 0, 0] }); }
  } else if (variant === 'credit-card') {
    const W = 0.0856, D = 0.054, t = 0.0008;
    const cols = { gold: '#c9a24a', silver: '#b8bec6', vintage: '#3a5a8a', plastic: '#2457b8', black: '#141416', pink: '#f08fb2' };
    const mk = (i, col, at, ry) => {
      const c = group(`card-${i}`, { parent: root, at, rot: [0, ry, 0] });
      const mat = trim === 'gold' || trim === 'silver' ? M.metal(col, 0.3) : fin(T, col, 'gloss');
      mesh(roundedBox(W, t, D, 0.0003), mat, { parent: c, at: [0, t / 2, 0] });
      const tex = canvasTex(428, 270, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, col); gr.addColorStop(1, '#ffffff33'); g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = 'bold 26px monospace'; g.fillText('4000 1234 5678 9010', 34, 185); g.font = '18px monospace'; g.fillText('CARD HOLDER   12/30', 34, 230);
        g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(w - 70, h - 50, 26, 0, 7); g.fill(); g.beginPath(); g.arc(w - 45, h - 50, 26, 0, 7); g.fill();
      });
      if (tex) { const p = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.98, D * 0.96), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: trim === 'gold' || trim === 'silver' ? 0.5 : 0 })); p.rotation.x = -Math.PI / 2; p.position.y = t + 0.00005; c.add(p); }
      mesh(roundedBox(0.012, 0.0003, 0.009, 0.0008), M.metal('#d6b45a', 0.2), { parent: c, at: [-W * 0.3, t + 0.00015, -D * 0.08], name: i ? undefined : 'chip' });
    };
    mk(0, cols[trim] ?? '#2457b8', [0, 0, 0], 0);
    mk(1, trim ? (trim === 'black' ? '#c9a24a' : '#f2f0ea') : '#e8402f', [0.025, t, 0.012], -0.35);
    if (T.detail >= 1 || trim === 'vintage') mk(2, '#2f7a4a', [0.05, t * 2, 0.022], -0.7);
  } else if (variant === 'piggy-bank') {
    const s = k * (trim === 'plastic' ? 0.85 : 1);
    const pm = trim === 'gold' ? M.metal('#d6a93c', 0.2) : trim === 'silver' ? M.metal('#cfd2d8', 0.18) : trim === 'black' ? fin(T, '#1c1d20', 'ceramic') : trim === 'plastic' ? fin(T, '#3fb6ff', 'plastic') : trim === 'vintage' ? fin(T, '#e9dcc0', 'ceramic', { pattern: 'floral' }) : fin(T, '#f4a6b8', 'ceramic');
    const R = 0.09 * s * T.w, legH = 0.035 * s;
    const pig = group('pig', { parent: root });
    mesh(new THREE.SphereGeometry(R, 40, 28).scale(1.25, 0.95 * T.h, 1), pm, { parent: pig, at: [0, legH + R * 0.88, 0], name: 'body' });
    const by = legH + R * 0.88;
    for (const [x, z] of [[-0.55, -0.45], [-0.55, 0.45], [0.55, -0.45], [0.55, 0.45]]) mesh(lathe([[0, 0], [R * 0.2, 0], [R * 0.22, legH], [R * 0.24, legH + R * 0.25], [0, legH + R * 0.3]], 20), pm, { parent: pig, at: [x * R, 0, z * R] });
    mesh(new THREE.CylinderGeometry(R * 0.32, R * 0.36, R * 0.3, 28).rotateZ(Math.PI / 2), pm, { parent: pig, at: [R * 1.3, by, 0], name: 'snout' });
    for (const zz of [-1, 1]) {
      mesh(new THREE.CircleGeometry(R * 0.06, 12), fin(T, '#5a2a30', 'matte'), { parent: pig, at: [R * 1.452, by, zz * R * 0.12], rot: [0, Math.PI / 2, 0] });
      mesh(new THREE.SphereGeometry(R * 0.07, 12, 10), fin(T, '#1a1a1a', 'gloss'), { parent: pig, at: [R * 1.05, by + R * 0.38, zz * R * 0.38] });
      mesh(new THREE.ConeGeometry(R * 0.22, R * 0.32, 12).scale(1, 1, 0.4), pm, { parent: pig, at: [R * 0.75, by + R * 0.82, zz * R * 0.45], rot: [zz * 0.4, 0, -0.35] });
    }
    // coin slot + curly tail
    mesh(roundedBox(R * 0.5, 0.006, 0.009, 0.002), fin(T, '#1a1a1a', 'matte'), { parent: pig, at: [0, by + R * 0.95 * T.h - 0.001, 0], name: 'slot' });
    const tail = [];
    for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 3; tail.push([-R * 1.22 - i * 0.002, by + R * 0.1 + Math.sin(a) * 0.012, Math.cos(a) * 0.012]); }
    curveTube(tail, 0.003 * s, pm, { parent: pig, segments: 40, name: 'tail' });
    // a coin going into the slot
    const coin = group('coin', { parent: root, at: [0, by + R * 0.95 * T.h + 0.008, 0], rot: [Math.PI / 2, 0, 0] });
    mesh(coinGeo(0.012, 0.002), M.metal('#d6a93c', 0.22), { parent: coin, at: [0, -0.001, 0] });
    return done(root, 'money', variant, o, () => [clip('drop-coin', 2, [moveTrack(coin, 2, (u) => [0, -Math.min(1, u * 1.6) * 0.014, 0])])]);
  } else {
    // cash box: hollow metal box, hinged lid with handle, coin tray inside
    const W = 0.3 * k * T.w, H = 0.09 * k * T.h, D = 0.24 * k, t = 0.0025;
    const bm = trim === 'gold' ? M.metal('#d6a93c', 0.3) : trim === 'silver' ? M.metal('#c9ced4', 0.3) : trim === 'vintage' ? fin(T, '#2f5a3a', 'metal') : trim === 'plastic' ? fin(T, '#e8402f', 'plastic') : trim === 'pink' ? fin(T, '#f08fb2', 'gloss') : trim === 'black' ? fin(T, '#1c1d20', 'matte') : fin(T, '#3d4652', 'metal');
    bm.side = THREE.DoubleSide;
    openBox(W, H, D, t, bm, { parent: root, r: 0.006, name: 'box' });
    // tray with compartments
    const tray = group('tray', { parent: root, at: [0, H * 0.55, 0] });
    const tmM = fin(T, '#2a2b2e', 'plastic');
    tmM.side = THREE.DoubleSide;
    openBox(W - 2 * t - 0.002, H * 0.4, D * 0.45, 0.002, tmM, { parent: tray, at: [0, 0, D * 0.25], name: 'coin-tray' });
    for (let i = 1; i < 4; i++) mesh(new THREE.BoxGeometry(0.002, H * 0.4, D * 0.45), tmM, { parent: tray, at: [-W / 2 + (i * W) / 4, H * 0.2, D * 0.25] });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) mesh(coinGeo(0.011, 0.002), j % 2 ? M.metal('#cfd2d8', 0.25) : M.metal('#d6a93c', 0.22), { parent: tray, at: [-W / 2 + ((i + 0.5) * W) / 4, 0.002 + j * 0.002, D * 0.25] });
    // notes in the back
    const nm = noteMat(T, '10');
    for (let i = 0; i < 3; i++) mesh(roundedBox(W * 0.8, 0.001, D * 0.38, 0.0003), nm, { parent: root, at: [0, 0.004 + i * 0.0012, -D * 0.2], rot: [0, 0.02 * i, 0] });
    const lid = group('lid', { parent: root, at: [0, H, -D / 2] });
    const lidShell = openBox(W + 0.004, 0.02 * k, D + 0.004, t, bm, { parent: lid, r: 0.006, name: 'lid-shell' });
    lidShell.rotation.x = Math.PI; lidShell.position.set(0, 0.02 * k, D / 2);
    curveTube([[-W * 0.18, 0.02 * k, D / 2], [-W * 0.16, 0.045 * k, D / 2], [W * 0.16, 0.045 * k, D / 2], [W * 0.18, 0.02 * k, D / 2]], 0.006 * k, hw(T), { parent: lid, segments: 24, name: 'handle' });
    mesh(roundedBox(0.03 * k, 0.022 * k, 0.006, 0.002), hw(T), { parent: root, at: [0, H - 0.008 * k, D / 2 + 0.004], name: 'lock' });
    return done(root, 'money', variant, o, () => [clip('open', 3, [rotateTrack(lid, 'x', 3, (u) => -pingPong(u) * 1.6)])]);
  }
  return done(root, 'money', variant, o);
}

void cushion; void loftX; void wave;
