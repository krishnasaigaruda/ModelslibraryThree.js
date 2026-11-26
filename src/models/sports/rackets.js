// Rackets, paddles, bats, sticks and golf clubs. All lie flat on the ground, built along +X.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, setup, done, fin, bodyMat, plinth, rodX,
} from './common.js';
import { buildBall } from './balls.js';

/* ------------------------------- helpers ------------------------------- */

/** Head outline (XZ) as array of [x,z]; teardrop k narrows the throat end (negative x). */
function headPoly(a, b, k = 0, n = 64) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push([a * Math.cos(t), b * Math.sin(t) * (1 - k * 0.5 + k * 0.5 * Math.cos(t))]);
  }
  return pts;
}
function chord(poly, c, axis) {
  // intersections of line (z=c for axis 'x', x=c for axis 'z') with the polygon
  const hits = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const [pa, pb, qa, qb] = axis === 'x' ? [p[1], p[0], q[1], q[0]] : [p[0], p[1], q[0], q[1]];
    if ((pa - c) * (qa - c) <= 0 && pa !== qa) hits.push(pb + ((c - pa) / (qa - pa)) * (qb - pb));
  }
  return hits.length >= 2 ? [Math.min(...hits), Math.max(...hits)] : null;
}

/** Merged string bed inside poly (XZ plane at y). */
function strings(poly, mains, crosses, r, mat, parent, y = 0, skip = -1) {
  const geos = [];
  const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  for (let i = 1; i <= mains; i++) {
    const z = z0 + ((z1 - z0) * i) / (mains + 1);
    const c = chord(poly, z, 'x');
    if (!c || i === skip) continue;
    geos.push(new THREE.CylinderGeometry(r, r, c[1] - c[0], 4).rotateZ(Math.PI / 2).translate((c[0] + c[1]) / 2, y + r, z));
  }
  for (let i = 1; i <= crosses; i++) {
    const x = x0 + ((x1 - x0) * i) / (crosses + 1);
    const c = chord(poly, x, 'z');
    if (!c) continue;
    geos.push(new THREE.CylinderGeometry(r, r, c[1] - c[0], 4).rotateX(Math.PI / 2).translate(x, y - r, (c[0] + c[1]) / 2));
  }
  if (geos.length) mesh(mergeGeometries(geos), mat, { parent, name: 'strings' });
}

/** Frame loop in segments (alternating colours for team trims). */
function frameLoop(poly, r, matA, matB, parent, { y = 0, segs = 1, flat = 1 } = {}) {
  const n = poly.length;
  const per = Math.ceil(n / segs);
  for (let s = 0; s < segs; s++) {
    const pts = [];
    for (let i = s * per; i <= Math.min(n, (s + 1) * per); i++) pts.push([poly[i % n][0], y, poly[i % n][1]]);
    const m = curveTube(pts, r, s % 2 ? matB : matA, { parent, segments: Math.max(8, pts.length * 2), radialSegments: 10, closed: segs === 1 });
    m.scale.y = flat;
    m.position.y = y * (1 - flat);
  }
}

/** Octagonal grip along X from x0 to x1 with wrap and butt cap. */
function grip(par, x0, x1, r, T, { color = '#1b1b1b', cap = true, wrap = true, y = 0 } = {}) {
  const parent = group('gripset', { parent: par, at: [0, y, 0] });
  const g = new THREE.CylinderGeometry(r, r * 1.04, x1 - x0, 8).rotateZ(Math.PI / 2);
  mesh(g, fin(T, T.trim === 'retro' ? '#5b3519' : color, T.trim === 'retro' ? 'leather' : 'rubber'), { parent, at: [(x0 + x1) / 2, 0, 0], name: 'grip' });
  if (wrap) {
    const pts = [];
    const turns = Math.round((x1 - x0) / 0.022);
    for (let i = 0; i <= turns * 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push([x0 + ((x1 - x0) * i) / (turns * 12), Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02]); }
    curveTube(pts, r * 0.12, fin(T, T.trim === 'neon' ? T.a : '#e8e8e4', 'rubber'), { parent, segments: turns * 16, radialSegments: 4 });
  }
  if (cap) mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.12, 0.008, 16).rotateZ(Math.PI / 2), fin(T, T.a ?? '#222'), { parent, at: [x0 - 0.004, 0, 0], name: 'cap' });
  if (T.wear) curveTube([[x0 + 0.01, 0, r], [x0 - 0.02, -r * 0.6, r * 2.5], [x0 - 0.05, -r, r * 3.5]], r * 0.11, fin(T, '#e8e8e4', 'rubber'), { parent, segments: 8 });
}

// champion trim = gold finish only; the walnut display stand was removed (pure models, no stands)
function champStand() {
  return 0;
}

const lie = (root, item, T, len) => {
  const y0 = T.champion ? champStand(root, len) : 0;
  item.position.y += y0;
  return item;
};

/* =============================== RACKETS =============================== */

export const RACKET_VARIANTS = {
  tennis: { a: 0.165, b: 0.125, fr: 0.011, len: 0.685, m: 16, c: 19, k: 0.12, p: '#1d1f24', s: '#e5402a', ball: 'tennis' },
  badminton: { a: 0.118, b: 0.092, fr: 0.0042, len: 0.665, m: 22, c: 22, k: 0.15, p: '#2a5fc0', s: '#f2f2f2', shaft: 0.0035 },
  squash: { a: 0.13, b: 0.097, fr: 0.0075, len: 0.686, m: 14, c: 18, k: 0.45, p: '#f2f2f2', s: '#141414', open: true },
  racquetball: { a: 0.142, b: 0.118, fr: 0.0085, len: 0.56, m: 16, c: 18, k: 0.55, p: '#7a1fd1', s: '#141414' },
  padel: { a: 0.13, b: 0.13, len: 0.455, solid: true, th: 0.038, p: '#141414', s: '#ff6a00', holes: true },
  'table-tennis': { a: 0.08, b: 0.075, len: 0.26, solid: true, th: 0.01, p: '#c8102e', s: '#151515', tt: true },
  pickleball: { a: 0.12, b: 0.1, len: 0.41, solid: true, th: 0.015, p: '#1aa0a0', s: '#151515', square: true },
};

export function createRacket(options = {}) {
  const { o, variant, trim, T, V } = setup(options, RACKET_VARIANTS, 'racket');
  const root = group(`racket-${variant}`);
  const item = group('racket', { parent: root });
  let k = T.kids ? 0.72 : 1;
  if (trim === 'retro') k *= 0.92;
  if (trim === 'pro' && !V.solid) k *= 1.06; // oversize head
  const a = V.a * k, b = V.b * k * (trim === 'pro' ? 1.04 : 1);
  const len = V.len * (T.kids ? 0.78 : 1);
  const frameMat = trim === 'retro' ? M.wood('#a67c4f') : bodyMat(T, trim ? T.p : V.p);
  const accent = fin(T, trim ? T.s : V.s);
  const segs = T.pattern ? 10 : trim === 'pro' || !trim ? 2 : 1;
  const headX = len - a; // head centre
  const gripLen = V.solid ? (V.tt ? 0.1 : 0.14) : 0.19 * (T.kids ? 0.8 : 1);
  const gr = (V.tt ? 0.013 : V.shaft ? 0.012 : 0.016) * (T.chunky > 1 ? 1.15 : 1);
  const y = Math.max(gr, V.solid ? V.th / 2 : V.fr * 1.6) * (T.chunky ?? 1) ** 0.3;

  if (!V.solid) {
    const fr = V.fr * (T.chunky ?? 1) * (trim === 'retro' ? 1.25 : 1);
    const poly = headPoly(a, b, V.k).map(([x, z]) => [x + headX, z]);
    frameLoop(poly, fr, frameMat, accent, item, { y, segs, flat: trim === 'retro' ? 0.8 : 1.5 });
    const inner = headPoly(a - fr * 0.6, b - fr * 0.6, V.k).map(([x, z]) => [x + headX, z]);
    const sMat = fin(T, trim === 'neon' ? T.a : trim === 'stealth' ? '#55585f' : trim === 'retro' ? '#efe2c4' : '#f0eee6', 'plastic');
    strings(inner, V.m, V.c, V.shaft ? 0.0005 : 0.0009, sMat, item, y, T.wear ? 5 : -1);
    // throat
    const tx = headX - a;
    if (V.shaft) {
      rodX(gripLen, tx + 0.005, V.shaft * (T.chunky ?? 1), fin(T, trim ? T.s : '#c9ccd2', trim ? undefined : 'metal'), item, { y });
      mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.03, 12).rotateZ(Math.PI / 2), frameMat, { parent: item, at: [tx, y, 0] });
    } else if (V.open) {
      for (const s of [-1, 1]) curveTube([[gripLen, y, 0], [tx - 0.04, y, s * 0.015], [tx + 0.02, y, s * b * 0.55]], fr * 0.9, frameMat, { parent: item, segments: 16 });
    } else {
      for (const s of [-1, 1]) curveTube([[gripLen, y, 0], [tx - 0.06, y, s * 0.012], [tx - 0.005, y, s * b * 0.35], [tx + 0.03, y, s * b * 0.72]], fr * 0.9, frameMat, { parent: item, segments: 20 });
      mesh(roundedBox(0.012, fr * 2, b * 0.62, fr * 0.8), frameMat, { parent: item, at: [tx + 0.002, y, 0] }); // bridge
      if (trim === 'pro' || !trim) mesh(roundedBox(0.012, 0.008, 0.018, 0.003), fin(T, T.a ?? '#e5402a', 'rubber'), { parent: item, at: [tx + 0.03, y + 0.002, 0], name: 'dampener' });
    }
    if (trim === 'retro' && variant === 'tennis') {
      // trapezoid wooden press clamped around the head
      const pw = M.wood('#c79a5e');
      for (const s of [-1, 1]) mesh(extrudeOutline([[-a * 1.15, -b * 1.2], [a * 1.2, -b * 0.95], [a * 1.2, b * 0.95], [-a * 1.15, b * 1.2]], 0.012, { bevel: 0.003 }), pw, { parent: item, at: [headX, y + s * (fr * 0.8 + 0.006), 0], rot: [Math.PI / 2, 0, 0] });
      for (const [x, z] of [[-a * 1.05, -b * 1.05], [-a * 1.05, b * 1.05], [a * 1.1, -b * 0.85], [a * 1.1, b * 0.85]]) {
        mesh(new THREE.CylinderGeometry(0.004, 0.004, fr * 2 + 0.03, 8), M.chrome(), { parent: item, at: [headX + x, y, z] });
        mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.006, 6), M.chrome(), { parent: item, at: [headX + x, y + fr + 0.015, z] });
      }
    }
  } else {
    // solid paddle blade
    let outline;
    if (V.square) outline = headPoly(a, b, 0, 48).map(([x, z]) => [Math.sign(x) * Math.min(Math.abs(x), a * 0.97) * 1, Math.sign(z) * Math.abs(z) ** 0.75 * b ** 0.25]);
    else outline = headPoly(a, b, variant === 'padel' ? 0.25 : 0, 48);
    const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
    if (V.holes && !T.kids) {
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        const hx = i * 0.028, hz = j * 0.028 + (i % 2 ? 0.014 : 0);
        if ((hx / (a * 0.78)) ** 2 + (hz / (b * 0.72)) ** 2 < 1) { const h = new THREE.Path(); h.absarc(hx, hz, 0.0065, 0, Math.PI * 2, true); shape.holes.push(h); }
      }
    }
    const th = V.th * (T.chunky > 1 ? 1.3 : 1);
    const blade = extrudeOutline(shape, th, { bevel: Math.min(0.004, th * 0.3) });
    blade.rotateX(Math.PI / 2);
    const bladeMat = trim === 'retro' ? M.wood('#c79a5e') : V.tt ? M.wood('maple') : bodyMat(T, trim ? T.p : V.p);
    mesh(blade, bladeMat, { parent: item, at: [headX, y, 0] });
    if (V.tt) {
      // red / black rubbers
      const rub = new THREE.ShapeGeometry(new THREE.Shape(headPoly(a * 0.97, b * 0.97, 0, 48).map(([x, z]) => new THREE.Vector2(x, z)))).rotateX(Math.PI / 2);
      mesh(rub, fin(T, trim ? T.p : '#c8102e', 'rubber'), { parent: item, at: [headX, y - th / 2 - 0.0015, 0] });
      mesh(rub.clone().rotateX(Math.PI), fin(T, trim ? T.s : '#151515', 'rubber'), { parent: item, at: [headX, y + th / 2 + 0.0015, 0] });
    } else {
      // edge guard + face graphic band
      frameLoop(outline.map(([x, z]) => [x + headX, z]), th * 0.32, accent, bladeMat, item, { y, segs: T.pattern ? 10 : 1 });
      mesh(roundedBox(a * 0.5, 0.002, b * 1.6, 0.001), accent, { parent: item, at: [headX + a * 0.1, y + th / 2, 0] });
    }
    // neck
    mesh(roundedBox(headX - a - gripLen + 0.04, th * 0.9, V.tt ? 0.024 : 0.04, th * 0.3), bladeMat, { parent: item, at: [(gripLen + headX - a) / 2 + 0.01, y, 0] });
  }
  grip(item, 0, gripLen, gr, T, { color: trim === 'neon' ? '#101114' : V.tt ? '#d9b98a' : '#1b1b1b', wrap: !V.tt, y });
  if (V.tt && trim !== 'retro') mesh(new THREE.CylinderGeometry(gr * 1.4, gr, gripLen * 0.4, 12).rotateZ(Math.PI / 2), M.wood('maple'), { parent: item, at: [gripLen * 0.8, y, 0] });
  lie(root, item, T, len);
  // accessory: ball / shuttlecock lying next to the racket
  if (V.ball && trim !== 'champion') {
    const bb = buildBall(V.ball, { ...T, trim: trim === 'kids' || trim === 'retro' || trim === 'neon' ? trim : null }, { detail: 12 });
    bb.mesh.position.set(headX, bb.bottom ?? bb.R, b + 0.06);
    root.add(bb.mesh);
  } else if (variant === 'badminton' && trim !== 'champion') {
    const sh = group('shuttlecock', { parent: root, at: [headX, 0, b + 0.05] });
    mesh(new THREE.SphereGeometry(0.0125, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(Math.PI / 2), fin(T, '#f2f2f2', 'matte'), { parent: sh, at: [0, 0.0125, 0] });
    mesh(lathe([[0.0125, 0], [0.033, 0.065], [0.0315, 0.065], [0.0115, 0.002]], 24).rotateZ(-Math.PI / 2 + 0.17), fin(T, trim === 'neon' ? T.p : '#fbfbf6', 'plastic'), { parent: sh, at: [0, 0.0125, 0] });
  }
  return done(root, 'racket', variant, o);
}

/* ================================= BATS ================================= */

export const BAT_VARIANTS = {
  'baseball-wood': { len: 0.84, R: 0.033, h: 0.0125, p: '#d8b07a', wood: true },
  'baseball-alloy': { len: 0.81, R: 0.033, h: 0.0115, p: '#2a5fc0', alloy: true },
  softball: { len: 0.86, R: 0.0285, h: 0.011, p: '#e8e83a', alloy: true },
  't-ball': { len: 0.66, R: 0.03, h: 0.0115, p: '#e5402a', alloy: true },
  rounders: { len: 0.46, R: 0.026, h: 0.0125, p: '#c79a5e', wood: true, round: true },
  cricket: { len: 0.965, p: '#e8d2a6', cricket: true },
};

export function createSportsBat(options = {}) {
  const { o, variant, trim, T, V } = setup(options, BAT_VARIANTS, 'sports-bat');
  const root = group(`sports-bat-${variant}`);
  const item = group('bat', { parent: root });
  const kids = T.kids;
  const len = V.len * (kids ? 0.8 : 1);
  const wood = trim === 'retro' ? M.wood('#7a4e2a') : V.wood && !trim ? M.wood(V.p) : null;
  const mat = wood ?? (trim === 'stealth' ? fin(T, '#1c1d20', 'carbon') : trim === 'champion' ? M.metal('#d6a93c', 0.22) : V.alloy && !trim ? M.metal(V.p, 0.3) : bodyMat(T, trim ? T.p : V.p));
  if (V.cricket) {
    const bl = len * 0.6, bw = 0.108 * (kids ? 0.85 : 1);
    // blade with a raised spine on the back (extruded profile along X)
    const prof = [[-bw / 2, 0], [bw / 2, 0], [bw / 2, 0.022], [bw * 0.25, 0.03], [0, trim === 'retro' ? 0.045 : 0.06], [-bw * 0.25, 0.03], [-bw / 2, 0.022]];
    const g = extrudeOutline(prof, bl, { bevel: 0.004 });
    g.rotateY(Math.PI / 2);
    mesh(g, wood ?? M.wood('#e8d2a6'), { parent: item, at: [len - bl / 2, 0, 0], name: 'blade' });
    // toe rounding + sticker band
    mesh(roundedBox(bl * 0.5, 0.003, bw * 0.98, 0.001), mat, { parent: item, at: [len - bl * 0.55, 0.0625, 0], rot: [0, 0, 0] }).scale.y = 1;
    const hl = len - bl;
    mesh(new THREE.CylinderGeometry(0.0165, 0.0175, hl + 0.02, 12).rotateZ(Math.PI / 2), M.wood('#c79a5e'), { parent: item, at: [hl / 2, 0.03, 0] });
    grip(item, 0, hl * 0.9, 0.019, T, { color: trim ? T.s : '#c41e2a', wrap: false, cap: false, y: 0.03 });
    if (T.pattern) for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.0195, 0.0195, 0.012, 12).rotateZ(Math.PI / 2), fin(T, T.s), { parent: item, at: [0.03 + i * 0.05, 0.03, 0] });
    mesh(roundedBox(bl * 0.22, 0.004, bw * 0.9, 0.001), fin(T, trim ? T.p : '#1a2f6e'), { parent: item, at: [len - bl * 0.25, 0.022, 0], rot: [0, 0, 0] }).position.y = 0.058;
  } else {
    const R = V.R * (kids ? 1.55 : 1) * (trim === 'retro' ? 1.08 : 1), h = V.h * (kids ? 1.5 : 1) * (trim === 'retro' ? 1.15 : 1);
    const prof = [[0, 0], [h * 1.9, 0], [h * 2.0, 0.008], [h * 1.3, 0.02], [h, 0.04], [h * 1.05, len * 0.3], [R * 0.75, len * 0.58], [R, len * 0.72], [R, len * 0.985], [R * 0.85, len], [V.alloy && !trim ? 0 : R * 0.3, len], [0, len - 0.004]];
    if (V.round) prof.splice(5, 3, [h * 1.2, len * 0.3], [R, len * 0.85]);
    const bat = mesh(lathe(prof, 32).rotateZ(-Math.PI / 2), mat, { parent: item, name: 'body' });
    void bat;
    if (!V.round) grip(item, 0.012, len * 0.3, h * 1.08, T, { color: trim ? T.s : V.alloy ? '#1b1b1b' : '#3a2414', cap: false, wrap: V.alloy || trim === 'pro' });
    if (T.pattern) for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.01, 0.02, 24).rotateZ(Math.PI / 2), fin(T, i % 2 ? T.a : T.s), { parent: item, at: [len * (0.76 + i * 0.07), 0, 0] });
    if (T.wear) for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(R * 0.97 * (0.8 + i * 0.07), R * 0.97, 0.03, 20).rotateZ(Math.PI / 2), M.matte('#d9d4c4'), { parent: item, at: [len * (0.5 + i * 0.03), 0, 0] }); // tape repair
    if (trim === 'neon') mesh(new THREE.CylinderGeometry(R * 1.005, R * 1.005, len * 0.12, 24).rotateZ(Math.PI / 2), fin(T, T.a, 'neon'), { parent: item, at: [len * 0.86, 0, 0] });
    item.position.y = R;
  }
  if (trim === 'champion') {
    item.position.y += champStand(root, len);
  } else if (variant !== 'cricket') {
    const ball = buildBall(variant === 'softball' ? 'softball' : 'baseball', { ...T, trim: trim === 'kids' || trim === 'retro' ? trim : null }, { detail: 12 });
    ball.mesh.position.set(len * 0.85, ball.bottom ?? ball.R, -V.R * 1.6 - ball.R - 0.03);
    root.add(ball.mesh);
  }
  if (variant === 'softball' && trim !== 'champion') {
    mesh(extrudeOutline([[-0.215, 0], [0.215, 0], [0.215, 0.215], [0, 0.43], [-0.215, 0.215]], 0.025, { bevel: 0.006 }).rotateX(Math.PI / 2), fin(T, '#f6f6f4', 'rubber'), { parent: root, at: [len * 0.45, 0.0125, 0.12] });
  } else if (variant === 'baseball-alloy' && trim !== 'champion') {
    mesh(cushionBase(), fin(T, '#f6f6f4', 'fabric'), { parent: root, at: [len * 0.4, 0.04, 0.3] });
  }
  if (variant === 't-ball' && trim !== 'champion') {
    // batting tee beside the bat
    const tee = group('tee', { parent: root, at: [len * 0.5, 0, 0.32] });
    mesh(lathe([[0, 0], [0.16, 0], [0.16, 0.02], [0.03, 0.04], [0, 0.04]], 32), M.rubber(), { parent: tee });
    mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.6, 16), fin(T, trim ? T.p : '#151515', 'rubber'), { parent: tee, at: [0, 0.34, 0] });
    mesh(lathe([[0.018, 0], [0.03, 0.035], [0.027, 0.035], [0.015, 0.003]], 20), M.rubber(), { parent: tee, at: [0, 0.64, 0] });
    const tb = buildBall('baseball', { ...T, trim: null }, { detail: 12 });
    tb.mesh.position.set(0, 0.64 + 0.035 + Math.sqrt(Math.max(0, tb.R ** 2 - 0.027 ** 2)) - 0.0005, 0);
    tee.add(tb.mesh);
  }
  return done(root, 'sports-bat', variant, o);
}

/* ================================ STICKS ================================ */

export const STICK_VARIANTS = {
  'ice-hockey': { len: 1.6, p: '#141414', s: '#e5402a' },
  'field-hockey': { len: 0.92, p: '#1aa0a0', s: '#151515' },
  lacrosse: { len: 1.0, p: '#d0d3d8', s: '#f2f2f2' },
  hurling: { len: 0.9, p: '#d8b07a', s: '#c41e2a' },
  'polo-mallet': { len: 1.3, p: '#c79a5e', s: '#f2f2f2' },
  'croquet-mallet': { len: 0.92, p: '#8a5530', s: '#1d4fa0' },
  'pool-cue': { len: 1.47, p: '#5b3a24', s: '#efe2c4' },
  floorball: { len: 0.96, p: '#f2f2f2', s: '#ff6a00' },
};

export function createSportsStick(options = {}) {
  const { o, variant, trim, T, V } = setup(options, STICK_VARIANTS, 'sports-stick');
  const root = group(`sports-stick-${variant}`);
  const item = group('stick', { parent: root });
  const kids = T.kids;
  const len = V.len * (kids ? 0.72 : 1);
  const ch = T.chunky ?? 1;
  const shaftMat = trim === 'retro' ? M.wood('#a67c4f') : trim === 'champion' ? M.metal('#d6a93c', 0.22) : bodyMat(T, trim ? T.p : V.p);
  const acc = fin(T, trim ? T.s : V.s);
  const tape = fin(T, trim === 'neon' ? T.a : trim === 'retro' ? '#e8e8e4' : '#151515', 'rubber');
  const bands = (x0, x1, r, n = 3) => { if (T.pattern) for (let i = 0; i < n; i++) mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.03, (x1 - x0) / (n * 2), 12).rotateZ(Math.PI / 2), acc, { parent: item, at: [x0 + ((x1 - x0) * (i + 0.5)) / n, 0, 0] }); };

  if (variant === 'ice-hockey' || variant === 'floorball' || variant === 'field-hockey' || variant === 'hurling') {
    const sl = len * (variant === 'ice-hockey' ? 0.8 : variant === 'hurling' ? 0.65 : 0.78);
    const sw = (variant === 'ice-hockey' ? 0.03 : 0.024) * ch, sd = (variant === 'ice-hockey' ? 0.02 : 0.024) * ch;
    mesh(variant === 'ice-hockey' ? roundedBox(sl, sd, sw, 0.005) : new THREE.CylinderGeometry(sw / 2, sw / 2, sl, 16).rotateZ(Math.PI / 2), shaftMat, { parent: item, at: [sl / 2, 0, 0], name: 'shaft' });
    bands(sl * 0.3, sl * 0.9, sw / 2);
    // grip tape / knob
    mesh(variant === 'ice-hockey' ? roundedBox(0.2, sd * 1.06, sw * 1.06, 0.005) : new THREE.CylinderGeometry(sw * 0.56, sw * 0.56, 0.22, 16).rotateZ(Math.PI / 2), tape, { parent: item, at: [0.1, 0, 0] });
    if (variant === 'ice-hockey') {
      const bl = 0.32 * (kids ? 0.75 : 1);
      const blade = extrudeOutline([[0, -0.02], [bl * 0.8, -0.035], [bl, -0.02], [bl * 1.02, 0.04], [bl * 0.9, 0.055], [0.02, 0.03], [-0.03, 0.01]], 0.014 * ch, { bevel: 0.003 });
      const bm = mesh(blade, shaftMat, { parent: item, at: [sl - 0.01, 0, 0], rot: [Math.PI / 2, 0, -0.5] });
      bm.name = 'blade';
      mesh(roundedBox(bl * 0.7, 0.016 * ch, 0.08, 0.004), tape, { parent: bm, at: [bl * 0.5, 0.012, 0], rot: [0, 0, 0] }).scale.set(1, 1, 0.9);
      // curve rendered by tilting the shaft so blade lies flat
      item.rotation.z = 0.5;
    } else if (variant === 'field-hockey') {
      const hook = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; const a = Math.PI * t * 1.05; hook.push([sl + Math.sin(a) * 0.05, -0.0 - (1 - Math.cos(a)) * 0.05 * 0.0, -(1 - Math.cos(a)) * 0.05]); }
      curveTube([[sl - 0.05, 0, 0], ...hook], 0.022 * ch, shaftMat, { parent: item, segments: 24, radialSegments: 12 }).scale.y = 0.7;
      mesh(roundedBox(0.08, 0.02, 0.008, 0.003), acc, { parent: item, at: [sl - 0.04, 0, 0.012] });
    } else if (variant === 'hurling') {
      const bas = extrudeOutline([[0, -0.03], [0.18, -0.055], [0.26, -0.04], [0.28, 0.0], [0.26, 0.05], [0.16, 0.07], [0.0, 0.03]], 0.018 * ch, { bevel: 0.005 });
      mesh(bas, trim === 'retro' || !trim ? M.wood('#d8b07a') : shaftMat, { parent: item, at: [sl - 0.02, 0, 0], rot: [Math.PI / 2, 0, 0] });
      mesh(roundedBox(0.1, 0.022 * ch, 0.006, 0.002), M.metal('#c9ccd2'), { parent: item, at: [sl + 0.2, 0, 0.0], rot: [0, 0, 0] }).position.z = 0;
      mesh(roundedBox(0.12, 0.024 * ch, 0.11, 0.004), acc, { parent: item, at: [sl + 0.12, 0, 0] }).scale.y = 0.2;
    } else {
      // floorball: perforated plastic blade
      const bl = 0.24;
      const sh = new THREE.Shape([[0, -0.02], [bl, -0.03], [bl + 0.01, 0.03], [0, 0.03]].map(([x, y]) => new THREE.Vector2(x, y)));
      for (let i = 0; i < 6; i++) { const h = new THREE.Path(); h.absellipse(0.03 + i * 0.035, 0.002, 0.011, 0.016, 0, Math.PI * 2, true); sh.holes.push(h); }
      mesh(extrudeOutline(sh, 0.006, { bevel: 0.002 }), fin(T, trim ? T.s : V.s, 'plastic'), { parent: item, at: [sl - 0.005, 0, 0], rot: [Math.PI / 2, 0, -0.1] });
    }
  } else if (variant === 'lacrosse') {
    const sl = len * 0.75;
    mesh(new THREE.CylinderGeometry(0.0135 * ch, 0.0135 * ch, sl, 8).rotateZ(Math.PI / 2), shaftMat, { parent: item, at: [sl / 2, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.01, 8).rotateZ(Math.PI / 2), tape, { parent: item, at: [0.005, 0, 0] });
    bands(sl * 0.2, sl * 0.8, 0.0135 * ch);
    const head = [];
    for (let i = 0; i <= 24; i++) { const t = -Math.PI * 0.85 + (i / 24) * Math.PI * 1.7; head.push([sl + 0.13 + Math.cos(t) * 0.13, 0, Math.sin(t) * 0.085 * (0.7 + 0.3 * Math.cos(t))]); }
    const hm = trim === 'retro' ? M.wood('#a67c4f') : fin(T, trim ? T.s : V.s, 'plastic');
    curveTube([[sl - 0.01, 0, 0], ...head, [sl - 0.01, 0, 0]], 0.006 * ch, hm, { parent: item, segments: 48 });
    // pocket mesh (sags below)
    const pocket = group('pocket', { parent: item, at: [sl + 0.13, -0.005, 0] });
    const nm = fin(T, trim === 'neon' ? T.a : '#f4f2ea', 'fabric');
    for (let i = -4; i <= 4; i++) curveTube([[i * 0.022, 0, -0.07 * Math.sqrt(1 - (i / 5.2) ** 2)], [i * 0.022, -0.03, 0], [i * 0.022, 0, 0.07 * Math.sqrt(1 - (i / 5.2) ** 2)]], 0.0012, nm, { parent: pocket, segments: 8, radialSegments: 4 });
    for (let j = -2; j <= 2; j++) curveTube([[-0.11, 0, j * 0.025], [0, -0.03 + Math.abs(j) * 0.008, j * 0.025], [0.11, 0, j * 0.025]], 0.0012, nm, { parent: pocket, segments: 8, radialSegments: 4 });
    item.position.y = 0.04;
  } else if (variant === 'polo-mallet' || variant === 'croquet-mallet') {
    const sl = len;
    const polo = variant === 'polo-mallet';
    const sr = (polo ? 0.009 : 0.014) * ch;
    mesh(new THREE.CylinderGeometry(sr, sr * 1.15, sl, 12).rotateZ(Math.PI / 2), shaftMat, { parent: item, at: [sl / 2, 0, 0] });
    mesh(new THREE.CylinderGeometry(sr * 2, sr * 2, 0.16, 12).rotateZ(Math.PI / 2), fin(T, trim ? T.s : '#2b2b2b', 'rubber'), { parent: item, at: [0.08, 0, 0] });
    const hl = (polo ? 0.23 : 0.24) * (kids ? 0.8 : 1), hr = (polo ? 0.026 : 0.04) * (kids ? 1.2 : 1);
    const prof = polo ? [[0, 0], [hr * 0.8, 0], [hr, hl * 0.2], [hr, hl * 0.8], [hr * 0.8, hl], [0, hl]] : [[0, 0], [hr, 0], [hr, 0.012], [hr * 0.96, 0.016], [hr * 0.96, hl - 0.016], [hr, hl - 0.012], [hr, hl], [0, hl]];
    const head = mesh(lathe(prof, 32).rotateX(Math.PI / 2), trim === 'retro' || !trim ? M.wood(polo ? '#e8d2a6' : '#8a5530') : bodyMat(T), { parent: item, at: [sl, 0, -hl / 2] });
    head.name = 'head';
    if (!polo) for (const z of [-hl / 2 + 0.03, hl / 2 - 0.03]) mesh(new THREE.TorusGeometry(hr * 0.98, 0.003, 6, 32), acc, { parent: item, at: [sl, 0, z] });
    item.position.y = hr;
  } else if (variant === 'pool-cue') {
    const prof = [[0, 0], [0.0145, 0], [0.0148, 0.02], [0.0145, len * 0.45], [0.012, len * 0.55], [0.0065, len * 0.99], [0.0065, len], [0, len]];
    mesh(lathe(prof.map(([r, y]) => [r * ch ** 0.5, y]), 24).rotateZ(-Math.PI / 2), trim === 'retro' || !trim ? M.wood('#d8b07a') : shaftMat, { parent: item });
    // butt sleeve, wrap, joint, ferrule, tip
    mesh(new THREE.CylinderGeometry(0.0149, 0.0149, len * 0.22, 24).rotateZ(Math.PI / 2), trim ? bodyMat(T, T.s) : M.wood('#2a1a10'), { parent: item, at: [len * 0.11 + 0.02, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.0151, 0.0151, len * 0.17, 24).rotateZ(Math.PI / 2), fin(T, trim === 'neon' ? T.a : '#151515', 'fabric'), { parent: item, at: [len * 0.31, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.0132, 0.0132, 0.015, 24).rotateZ(Math.PI / 2), M.chrome(), { parent: item, at: [len * 0.5, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.0067, 0.0067, 0.02, 16).rotateZ(Math.PI / 2), M.plastic('#f2efe6'), { parent: item, at: [len - 0.012, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.0062, 0.0066, 0.006, 16).rotateZ(Math.PI / 2), M.matte('#2a5fc0'), { parent: item, at: [len + 0.002, 0, 0] });
    if (T.pattern || !trim) for (let i = 0; i < 4; i++) mesh(new THREE.ConeGeometry(0.004, 0.09, 3).rotateZ(-Math.PI / 2), acc, { parent: item, at: [len * 0.44, Math.cos(i * 1.57) * 0.0128, Math.sin(i * 1.57) * 0.0128] });
    item.position.y = 0.015;
    // chalk cube next to it
    if (trim !== 'champion') {
      const ck = mesh(roundedBox(0.022, 0.022, 0.022, 0.002), M.matte('#2a7de1'), { parent: root, at: [len * 0.8, 0.011, 0.06] });
      ck.name = 'chalk';
    }
  }
  if (trim === 'champion') item.position.y += champStand(root, len);
  return done(root, 'sports-stick', variant, o);
}

/* ============================== GOLF CLUBS ============================== */

export const GOLF_VARIANTS = {
  driver: { len: 1.14, head: 'wood', vol: 1, p: '#1c1d20', s: '#e5402a' },
  'fairway-wood': { len: 1.07, head: 'wood', vol: 0.62, p: '#1c1d20', s: '#2a5fc0' },
  hybrid: { len: 1.0, head: 'wood', vol: 0.45, p: '#2a2c31', s: '#f2c500' },
  iron: { len: 0.95, head: 'iron', loft: 0.5, p: '#c9ccd2', s: '#1c1d20' },
  wedge: { len: 0.9, head: 'iron', loft: 0.95, p: '#c9ccd2', s: '#7a1fd1' },
  putter: { len: 0.88, head: 'putter', p: '#c9ccd2', s: '#e5402a' },
  'golf-bag': { bag: true, p: '#1c1d20', s: '#f2f2f2' },
};

function golfClub(parent, kind, T, len, { at = [0, 0, 0], rot = [0, 0, 0], trim, V } = {}) {
  const g = group('club', { parent, at, rot });
  const shaft = trim === 'retro' ? M.wood('#a67c4f') : trim === 'stealth' ? fin(T, '#1c1d20', 'carbon') : trim === 'champion' ? M.metal('#d6a93c', 0.2) : M.metal('#d2d5da', 0.18);
  mesh(new THREE.CylinderGeometry(0.0045, 0.0075, len, 10), shaft, { parent: g, at: [0, len / 2, 0] });
  mesh(new THREE.CylinderGeometry(0.0115, 0.0095, 0.26, 10), fin(T, trim === 'neon' ? T.p : trim === 'retro' ? '#5b3519' : '#1b1b1b', trim === 'retro' ? 'leather' : 'rubber'), { parent: g, at: [0, len - 0.13, 0] });
  const hm = trim === 'champion' ? M.metal('#d6a93c', 0.2) : trim === 'retro' && kind === 'wood' ? M.wood('#6e3f1f') : kind === 'wood' ? bodyMat(T, trim ? (T.finish === 'carbon' ? T.p : T.p) : V?.p ?? '#1c1d20') : fin(T, trim === 'stealth' ? '#2a2c31' : '#c9ccd2', trim === 'stealth' ? 'carbon' : 'chrome');
  const vol = V?.vol ?? 1;
  if (kind === 'wood') {
    const s = 0.06 * Math.cbrt(vol) * (T.kids ? 1.3 : 1);
    const head = mesh(new THREE.SphereGeometry(s, 24, 16), hm, { parent: g, at: [s * 0.9, s * 0.42, 0], name: 'head' });
    head.scale.set(1.1, 0.5, 0.95);
    mesh(new THREE.CylinderGeometry(0.0075, 0.009, 0.05, 10), hm, { parent: g, at: [0.003, 0.03, 0] });
    mesh(new THREE.CircleGeometry(s * 0.25, 16), fin(T, trim ? T.a ?? T.s : V?.s ?? '#e5402a', 'plastic'), { parent: head, at: [0, 0.999 * s, 0], rot: [-Math.PI / 2, 0, 0] });
  } else if (kind === 'iron') {
    const loft = V?.loft ?? 0.5;
    const blade = extrudeOutline([[0, 0], [0.075, 0.002], [0.082, 0.02], [0.075, 0.048 + loft * 0.008], [0.01, 0.034], [-0.006, 0.02]], 0.012 + (T.chunky > 1 ? 0.01 : 0), { bevel: 0.003 });
    mesh(blade, hm, { parent: g, at: [0.004, 0, 0], rot: [-loft * 0.4, 0, 0], name: 'head' });
    for (let i = 0; i < 6; i++) mesh(roundedBox(0.05, 0.0008, 0.001, 0.0003), M.metal('#7a7d82'), { parent: g, at: [0.045, 0.012 + i * 0.005, 0.0105 * Math.cos(loft * 0.4)], rot: [-loft * 0.4, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.0065, 0.009, 0.06, 10), hm, { parent: g, at: [0.004, 0.03, 0] });
  } else {
    const mallet = trim !== 'retro';
    const hg = mallet ? extrudeOutline(headArc(0.05, 0.06), 0.022, { bevel: 0.004 }) : roundedBox(0.1, 0.025, 0.02, 0.005);
    if (mallet) hg.rotateX(Math.PI / 2);
    mesh(hg, hm, { parent: g, at: [0.045, 0.012, mallet ? 0.0 : 0], name: 'head' });
    mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.06, 8), hm, { parent: g, at: [0.004, 0.03, 0] });
    if (mallet) mesh(roundedBox(0.04, 0.0015, 0.003, 0.0006), fin(T, '#ffffff', 'plastic'), { parent: g, at: [0.045, 0.024, 0.0] });
  }
  return g;
}
const headArc = (w, d) => {
  const pts = [];
  for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); pts.push([Math.cos(a) * w, -Math.sin(a) * d * 0.6]); }
  return pts;
};

export function createGolfClub(options = {}) {
  const { o, variant, trim, T, V } = setup(options, GOLF_VARIANTS, 'golf-club');
  const root = group(`golf-club-${variant}`);
  if (V.bag) {
    const k = T.kids ? 0.72 : 1;
    const r = (trim === 'pro' ? 0.15 : trim === 'retro' ? 0.1 : 0.12) * k, H = 0.9 * k;
    const bag = group('bag', { parent: root, rot: [0, 0, trim === 'pro' ? 0 : -0.12] });
    const wall = trim === 'retro' ? fin(T, '#8a5530', 'leather') : fin(T, trim ? T.p : V.p, trim === 'stealth' ? 'carbon' : 'fabric');
    // hollow body (open top)
    mesh(lathe([[0, 0], [r * 0.95, 0], [r, 0.03], [r, H], [r * 1.04, H + 0.01], [r * 1.04, H + 0.04], [r * 0.97, H + 0.04], [r * 0.95, 0.03], [0, 0.03]], 40), wall, { parent: bag, name: 'bag' });
    mesh(lathe([[0, 0], [r * 1.02, 0], [r * 1.03, 0.08], [r * 0.99, 0.08], [0, 0.07]], 40), fin(T, T.trim === 'neon' ? T.a : '#151515', 'rubber'), { parent: bag });
    mesh(lathe([[r * 1.0, 0], [r * 1.06, 0], [r * 1.06, 0.07], [r * 1.0, 0.07]], 40), fin(T, trim ? T.s : V.s), { parent: bag, at: [0, H - 0.03, 0] });
    // pockets + strap
    mesh(cushionPocket(r), fin(T, trim ? T.s : V.s, trim === 'retro' ? 'leather' : 'fabric'), { parent: bag, at: [0, H * 0.4, r * 0.98] });
    curveTube([[0, H * 0.85, -r], [0, H * 0.6, -r - 0.07], [0, H * 0.3, -r - 0.02], [0, H * 0.25, -r]], 0.012, fin(T, '#1b1b1b', 'fabric'), { parent: bag, segments: 16 }).scale.x = 3;
    if (T.pattern) for (let i = 0; i < 3; i++) mesh(lathe([[r * 1.005, 0], [r * 1.012, 0], [r * 1.012, 0.04], [r * 1.005, 0.04]], 40), fin(T, i % 2 ? T.a : T.s), { parent: bag, at: [0, H * (0.25 + i * 0.18), 0] });
    // clubs sticking out of the top (grips up)
    const kinds = [['wood', 1, 'driver'], ['wood', 0.62, 'fairway-wood'], ['iron', 0.5, 'iron'], ['iron', 0.9, 'wedge'], ['putter', 0, 'putter'], ['iron', 0.6, 'iron']];
    kinds.forEach(([kind], i) => {
      const a = (i / kinds.length) * Math.PI * 2;
      const cl = golfClub(bag, kind, T, H * 1.3, { at: [Math.cos(a) * r * 0.62, 0.03 + H * 1.3 + 0.002, Math.sin(a) * r * 0.62], rot: [Math.PI, a, 0], trim, V: GOLF_VARIANTS[kinds[i][2]] });
      cl.name = `club${i}`;
    });
    // stand legs (kick-stand bag)
    if (trim !== 'pro' && trim !== 'retro') {
      bag.rotation.set(-0.35, 0, 0);
      bag.position.set(0, -Math.sin(0.35) * r, 0.12);
      bag.updateMatrix();
      for (const s of [-1, 1]) {
        const top = new THREE.Vector3(s * r * 0.5, H * 0.75, -r * 0.92).applyMatrix4(bag.matrix);
        const foot = [s * r * 1.2, 0.012, top.z - 0.4 * k];
        curveTube([[top.x, top.y, top.z], foot], 0.007, M.metal('#2a2a2a'), { parent: root, segments: 4 });
        mesh(new THREE.SphereGeometry(0.012, 8, 6), M.rubber(), { parent: root, at: foot });
      }
    }
    if (trim === 'champion') { bag.position.y += plinth(root, r * 3, 0.08, { mat: M.plastic('#141416', 0.3) }); }
    return done(root, 'golf-club', variant, o);
  }
  const len = V.len * (T.kids ? 0.72 : 1);
  const item = group('item', { parent: root });
  golfClub(item, V.head, T, len, { rot: [0, 0, Math.PI / 2], trim, V });
  // headcover / ball
  if (trim !== 'champion') {
    const b = buildBall('golf', { ...T, trim: trim === 'kids' || trim === 'retro' || trim === 'neon' ? trim : null }, { detail: 12 });
    b.mesh.position.set(-0.12, b.bottom ?? b.R, 0.12);
    root.add(b.mesh);
    if (V.head === 'wood' && (trim === 'pro' || trim === 'retro' || trim === 'kids')) {
      const hc = mesh(new THREE.SphereGeometry(0.075, 20, 14), fin(T, trim === 'retro' ? '#e9dcc0' : T.s, trim === 'kids' ? 'foam' : 'fabric'), { parent: root, at: [-0.03, 0.04, -0.2], name: 'headcover' });
      hc.scale.set(1.1, 0.55, 0.9);
      if (trim === 'retro') mesh(new THREE.SphereGeometry(0.02, 12, 8), M.fabric('#9e2f25'), { parent: hc, at: [0, 0.075, 0] });
    }
  }
  if (trim !== 'champion') {
    // per-club scene props so every club reads differently at thumbnail size
    if (variant === 'driver' && !(trim === 'pro' || trim === 'retro' || trim === 'kids')) {
      const hc = mesh(new THREE.SphereGeometry(0.085, 20, 14), fin(T, trim ? T.s : '#1c1d20', 'leather'), { parent: root, at: [0.02, 0.045, -0.22], name: 'headcover' });
      hc.scale.set(1.1, 0.55, 0.9);
      mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.3, 16).rotateZ(Math.PI / 2), fin(T, trim ? T.p : '#e5402a', 'fabric'), { parent: root, at: [-0.17, 0.03, -0.22] });
    } else if (variant === 'fairway-wood') {
      const sock = mesh(new THREE.CylinderGeometry(0.035, 0.06, 0.32, 20).rotateZ(Math.PI / 2), fin(T, trim ? T.s : '#1d4fa0', 'fabric'), { parent: root, at: [-0.1, 0.05, -0.22], name: 'headcover' });
      for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.036 + i * 0.006, 0.036 + i * 0.006, 0.025, 20).rotateZ(Math.PI / 2), M.fabric('#f2f2f2'), { parent: sock, at: [-0.1 + i * 0.06, 0, 0] });
      mesh(new THREE.SphereGeometry(0.035, 14, 10), M.fabric('#f2f2f2'), { parent: root, at: [0.08, 0.045, -0.22] });
    } else if (variant === 'hybrid') {
      mesh(lathe([[0, 0], [0.002, 0], [0.003, 0.04], [0.012, 0.052], [0.01, 0.054], [0, 0.05]], 16), fin(T, '#f2c500', 'plastic'), { parent: root, at: [0.15, 0, 0.2] });
      const tb = buildBall('golf', { ...T, trim: null }, { detail: 10 });
      tb.mesh.position.set(0.15, 0.054 + tb.R - 0.004, 0.2);
      root.add(tb.mesh);
    } else if (variant === 'iron') {
      mesh(roundedBox(0.7, 0.015, 0.45, 0.005), M.fabric('#2f7a3a'), { parent: root, at: [-0.05, 0.0075, 0.05] });
      mesh(roundedBox(0.7, 0.012, 0.45, 0.004), M.rubber(), { parent: root, at: [-0.05, -0.006, 0.05] });
    } else if (variant === 'wedge') {
      mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.02, 40), M.matte('#e2c99a', 1), { parent: root, at: [0.0, -0.002, 0.05] }).scale.z = 0.7;
    } else if (variant === 'putter') {
      const green = mesh(new THREE.CylinderGeometry(0.6, 0.62, 0.02, 48), M.fabric('#3f9a4a'), { parent: root, at: [0.05, -0.002, 0.25] });
      green.scale.z = 0.7;
      mesh(new THREE.CircleGeometry(0.054, 24).rotateX(-Math.PI / 2), M.matte('#111111'), { parent: root, at: [0.35, 0.0085, 0.4] });
      mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 10), fin(T, '#f2f2f2', 'plastic'), { parent: root, at: [0.35, 0.45 + 0.008, 0.4] });
      mesh(extrudeOutline([[0, 0], [0.2, -0.06], [0, -0.12]], 0.004, { bevel: 0.001 }), fin(T, trim ? T.p : '#e5402a', 'fabric'), { parent: root, at: [0.356, 0.9, 0.4] });
    }
  }
  if (trim === 'champion') item.position.y += champStand(root, len);
  return done(root, 'golf-club', variant, o);
}

function cushionBase() {
  return roundedBox(0.38, 0.08, 0.38, 0.03, 4);
}

function cushionPocket(r) {
  const g = roundedBox(r * 1.1, 0.3, 0.07, 0.03, 4);
  return g;
}
