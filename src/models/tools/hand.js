// Hand tools: hammers, screwdrivers, wrenches, pliers, saws, chisels & planes, levels, measuring tools, axes.
// Built upright (handle along +Y, head at the top, working edge toward +X) and laid on their side.
import {
  THREE, M, mesh, group, roundedBox, curveTube, lathe, cushion, makeTool, handle, shapeGeo, taperZ, ringGeo, arc,
  cyl, cylX, cylZ, sphere, torus, latheX, latheNX, decal, hazard, rotateTrack, moveTrack, scaleTrack, clip, pingPong, wave,
} from './common.js';

const PI = Math.PI;

/* ================================ hammer ================================ */

export const HAMMER_VARIANTS = {
  claw: { L: 0.33, plus: 'face', minus: 'claw' },
  framing: { L: 0.42, plus: 'face', minus: 'rip', big: 1.15 },
  sledge: { L: 0.82, plus: 'oct', minus: 'oct', big: 2.2 },
  mallet: { L: 0.3, plus: 'mallet', minus: 'mallet' },
  'ball-peen': { L: 0.32, plus: 'face', minus: 'ball' },
  club: { L: 0.27, plus: 'oct', minus: 'oct', big: 1.6 },
  'dead-blow': { L: 0.33, plus: 'dead', minus: 'dead', big: 1.2 },
  tack: { L: 0.29, plus: 'face', minus: 'peen', big: 0.7 },
  brick: { L: 0.3, plus: 'face', minus: 'blade', big: 1.1 },
};

function hammerHead(par, side, s, m, T, k) {
  const dir = side; // +1 → +X, -1 → -X
  const kind = dir > 0 ? k.plus : k.minus;
  const ew = 0.03 * s, eh = 0.042 * s, et = 0.026 * s * T.chunky;
  const x0 = ew / 2 - 0.002;
  const L = (pr, mat, seg = 24) => mesh(dir > 0 ? latheX(pr, seg) : latheNX(pr, seg), mat, { parent: par, at: [dir * x0, 0, 0] });
  const fr = 0.0145 * s * T.chunky;
  if (kind === 'face') L([[0, 0], [fr * 0.92, 0], [fr * 0.78, 0.02 * s], [fr * 0.88, 0.04 * s], [fr, 0.05 * s], [fr, 0.056 * s], [fr * 0.88, 0.06 * s], [0, 0.0605 * s]], m.steel);
  else if (kind === 'ball') {
    L([[0, 0], [fr * 0.9, 0], [fr * 0.6, 0.03 * s], [0, 0.03 * s]], m.steel);
    mesh(sphere(fr * 1.05, 20, 14), m.steel, { parent: par, at: [dir * (x0 + 0.037 * s), 0, 0] });
  } else if (kind === 'oct') {
    const r = 0.018 * s * T.chunky;
    L([[0, 0], [r, 0], [r, 0.07 * s * 0.5], [r * 0.85, 0.077 * s * 0.5], [0, 0.077 * s * 0.5]], m.steel, 8);
  } else if (kind === 'mallet' || kind === 'dead') {
    const r = (kind === 'dead' ? 0.024 : 0.03) * s * T.chunky;
    const mat = kind === 'dead' ? m.body : T.kids ? m.accent : m.rubber;
    L([[0, 0], [r, 0], [r * 1.02, 0.05 * s], [r * 0.9, 0.056 * s], [0, 0.056 * s]], mat, 28);
    if (kind === 'mallet' && !T.kids) mesh(cylX(r * 0.6, 0.004), M.plastic('#e8e8e8'), { parent: par, at: [dir * (x0 + 0.056 * s), 0, 0] });
  } else if (kind === 'claw' || kind === 'rip') {
    const len = 0.07 * s, drop = kind === 'claw' ? 0.05 * s : 0.012 * s;
    const top = [], bot = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      top.push([-ew / 2 + 0.004 - t * len, eh / 2 - t * t * drop - t * 0.004 * s]);
      bot.push([-ew / 2 + 0.004 - t * len * 0.96, -eh * 0.2 - Math.pow(t, 1.4) * drop * 0.92 + t * 0.012 * s]);
    }
    const pts = [...top, ...bot.reverse()];
    const pw = et * 0.38;
    for (const z of [-1, 1]) {
      const geo = taperZ(shapeGeo(pts, pw, { bevel: 0.0012 }), () => 1);
      const pm = mesh(geo, m.steel, { parent: par, at: [0, 0, z * (et * 0.5 - pw / 2)] });
      pm.rotation.y = z * 0.06;
    }
  } else if (kind === 'peen') {
    const pts = [[-ew / 2 + 0.003, eh * 0.35], [-ew / 2 - 0.045 * s, 0.003 * s], [-ew / 2 - 0.047 * s, -0.003 * s], [-ew / 2 + 0.003, -eh * 0.35]];
    mesh(shapeGeo(pts, et * 0.85, { bevel: 0.001 }), m.steel, { parent: par });
  } else if (kind === 'blade') {
    const pts = [[-ew / 2 + 0.003, eh * 0.45], [-ew / 2 - 0.08 * s, eh * 0.8], [-ew / 2 - 0.085 * s, -eh * 0.7], [-ew / 2 + 0.003, -eh * 0.45]];
    const geo = taperZ(shapeGeo(pts, et * 0.9, { bevel: 0.001 }), (x) => 1 - Math.min(0.85, Math.max(0, (-x - ew / 2) / (0.085 * s)) * 0.85));
    mesh(geo, m.steel, { parent: par });
  }
}

export const createHammer = makeTool('hammer', HAMMER_VARIANTS, { p: '#d1322b', s: '#1c1d20' }, (g, { T, m, V }) => {
  const s = (V.big ?? 1) * (T.kids ? 1.45 : 1);
  const L = V.L * (T.heavy ? 1.08 : 1) * (T.kids ? 0.85 : 1);
  const hr = (V.L > 0.6 ? 0.017 : 0.0135) * (T.chunky > 1.2 ? 1.1 : 1);
  const longWood = V.L > 0.6 && !T.kids;
  const style = longWood && T.grip === 'bi' ? 'wood' : undefined;
  handle(g, T, m, L, hr, { oval: 0.72, style });
  const head = group('head', { parent: g, at: [0, L - 0.012 * s, 0] });
  const ew = 0.03 * s, eh = 0.042 * s, et = 0.026 * s * T.chunky;
  const eyeMat = V.plus === 'dead' || T.kids ? m.body : V.plus === 'mallet' ? m.rubber : m.steel;
  mesh(roundedBox(ew, eh, et, 0.004 * s), eyeMat, { parent: head });
  hammerHead(head, 1, s, m, T, V);
  hammerHead(head, -1, s, m, T, V);
  if (T.grip === 'wood' || T.grip === 'tape' || style === 'wood') mesh(roundedBox(ew * 0.55, 0.004, et * 0.6, 0.0015), m.dark, { parent: head, at: [0, eh / 2 + 0.0015, 0] });
  if (T.heavy) mesh(cyl(hr * 1.45, hr * 1.25, 0.05, 18), m.rubber, { parent: g, at: [0, L - 0.012 * s - eh / 2 - 0.022, 0], scale: [1, 1, 0.8] });
  if (T.pro) mesh(roundedBox(0.006, 0.01, et * 0.4, 0.001), m.dark, { parent: head, at: [0, eh / 2 + 0.002, 0] });
  return [];
});

/* ============================== screwdriver ============================== */

export const SCREWDRIVER_VARIANTS = {
  flathead: { hl: 0.1, sl: 0.12, sr: 0.0033, tip: 'flat' },
  phillips: { hl: 0.1, sl: 0.12, sr: 0.0033, tip: 'cross' },
  stubby: { hl: 0.055, sl: 0.03, sr: 0.0035, tip: 'cross', fat: 1.35 },
  precision: { hl: 0.085, sl: 0.05, sr: 0.0014, tip: 'flat', fat: 0.55 },
  'bit-driver': { hl: 0.11, sl: 0.07, sr: 0.0045, tip: 'bit' },
  'nut-driver': { hl: 0.1, sl: 0.09, sr: 0.0045, tip: 'nut' },
};

export const createScrewdriver = makeTool('screwdriver', SCREWDRIVER_VARIANTS, { p: '#e2b007', s: '#1c1d20' }, (g, { T, m, V, i }) => {
  const r = 0.0135 * (V.fat ?? 1);
  const hl = V.hl, sr = V.sr * (T.kids ? 2 : 1);
  handle(g, T, m, hl, r);
  if (T.heavy) mesh(cyl(r * 1.1, r * 1.15, 0.006, 20), m.steel, { parent: g, at: [0, -0.003, 0] });
  if (V.fat && V.fat < 1) mesh(cyl(r * 0.9, r * 0.9, 0.006, 16), m.chrome, { parent: g, at: [0, -0.002, 0] });
  if (T.pro || T.heavy) mesh(cyl(r * 0.55, r * 0.55, 0.012, 6), m.steel, { parent: g, at: [0, hl + 0.004, 0] });
  const tipKind = i % 2 && V.tip !== 'bit' && V.tip !== 'nut' ? (V.tip === 'flat' ? 'cross' : 'flat') : V.tip;
  const sh = group('shank', { parent: g, at: [0, hl - 0.004, 0] });
  if (tipKind === 'nut') {
    mesh(cyl(sr, sr, V.sl, 12), m.chrome, { parent: sh, at: [0, V.sl / 2, 0] });
    mesh(cyl(sr * 1.6, sr * 1.6, 0.022, 6, ), m.chrome, { parent: sh, at: [0, V.sl + 0.009, 0] });
    mesh(cyl(sr * 1.05, sr * 1.05, 0.001, 6), m.black, { parent: sh, at: [0, V.sl + 0.0205, 0] });
    return [];
  }
  mesh(cyl(sr, sr, V.sl, 12), m.chrome, { parent: sh, at: [0, V.sl / 2, 0] });
  let top = V.sl;
  if (tipKind === 'bit') {
    mesh(cyl(sr * 1.4, sr * 1.4, 0.016, 6), m.chrome, { parent: sh, at: [0, top + 0.006, 0] });
    mesh(cyl(0.0032, 0.0032, 0.02, 6), m.dark, { parent: sh, at: [0, top + 0.022, 0] });
    top += 0.031;
    mesh(cyl(0.0004, 0.003, 0.008, 8), m.dark, { parent: sh, at: [0, top + 0.003, 0] });
  } else if (tipKind === 'flat') {
    const w = sr * 2.4;
    mesh(shapeGeo([[-sr, 0], [sr, 0], [w / 2, sr * 3.5], [w / 2, sr * 4.5], [-w / 2, sr * 4.5], [-w / 2, sr * 3.5]], sr * 0.55, { bevel: 0.0002 }), m.chrome, { parent: sh, at: [0, top - 0.001, 0] });
  } else {
    mesh(cyl(sr * 0.15, sr, sr * 4, 8), m.chrome, { parent: sh, at: [0, top + sr * 2 - 0.0005, 0] });
  }
  return [];
}, { setScales: [1, 1, 0.88, 0.88, 0.75, 0.75] });

/* ================================ wrench ================================ */

export const WRENCH_VARIANTS = {
  'open-end': { L: 0.2 },
  combination: { L: 0.2 },
  adjustable: { L: 0.25 },
  pipe: { L: 0.35 },
  ratchet: { L: 0.22 },
  torque: { L: 0.45 },
  'hex-key': { L: 0.12 },
};

function hexPath(r, n = 6, rot = 0) { return Array.from({ length: n }, (_, i) => [Math.cos(rot + (i / n) * PI * 2) * r, Math.sin(rot + (i / n) * PI * 2) * r]); }

function openJaw(R, slot, n = 18) {
  const pts = [];
  const a0 = Math.asin(slot / 2 / R);
  for (let i = 0; i <= n; i++) { const a = PI / 2 + a0 + ((2 * PI - 2 * a0) * i) / n; pts.push([Math.cos(a) * R, Math.sin(a) * R]); }
  pts.push([-slot / 2, R * 0.1], [slot / 2, R * 0.1]);
  return pts;
}

function sleeve(g, T, m, y0, y1, w, t) {
  if (T.grip === 'bi' || T.grip === 'wood') return;
  const mat = T.grip === 'tape' ? m.tape : T.grip === 'pro' ? m.body : T.grip === 'dip' ? m.grip2 : m.grip;
  mesh(roundedBox(w * 1.35, y1 - y0, t * 1.6, Math.min(w, t) * 0.6), mat, { parent: g, at: [0, (y0 + y1) / 2, 0] });
  if (T.grip === 'pro') mesh(roundedBox(w * 1.4, (y1 - y0) * 0.3, t * 1.7, Math.min(w, t) * 0.6), m.grip, { parent: g, at: [0, y0 + (y1 - y0) * 0.15, 0] });
}

export const createWrench = makeTool('wrench', WRENCH_VARIANTS, { p: '#d1322b', s: '#1c1d20', steel: 'chrome' }, (g, { T, m, V, variant }) => {
  const c = T.chunky, L = V.L;
  const t = 0.0065 * c;
  const st = m.steel;
  const shaft = (y0, y1, w0, w1, th = t) => mesh(shapeGeo([[-w0 / 2, y0], [w0 / 2, y0], [w1 / 2, y1], [-w1 / 2, y1]], th, { bevel: th * 0.3 }), st, { parent: g });
  if (variant === 'open-end' || variant === 'combination') {
    shaft(0.012, L - 0.012, 0.013 * c, 0.016 * c);
    const top = mesh(shapeGeo(openJaw(0.019 * c, 0.016 * c), t * 1.1, { bevel: t * 0.3 }), st, { parent: g, at: [0, L + 0.004, 0], rot: [0, 0, -0.26] });
    top.name = 'jaw';
    if (variant === 'combination') {
      const sh = new THREE.Shape(); sh.absarc(0, 0, 0.016 * c, 0, PI * 2, false);
      const hp = new THREE.Path(hexPath(0.0085 * c, 12, 0.1).reverse().map(([x, y]) => new THREE.Vector2(x, y))); sh.holes.push(hp);
      mesh(new THREE.ExtrudeGeometry(sh, { depth: t * 1.3, bevelEnabled: true, bevelThickness: t * 0.25, bevelSize: t * 0.25, bevelSegments: 2, curveSegments: 20 }).translate(0, 0, -t * 0.65), st, { parent: g, rot: [0.25, 0, 0] });
    } else mesh(shapeGeo(openJaw(0.016 * c, 0.013 * c), t, { bevel: t * 0.3 }), st, { parent: g, at: [0, -0.004, 0], rot: [0, 0, PI + 0.26] });
    sleeve(g, T, m, L * 0.25, L * 0.75, 0.014 * c, t);
  } else if (variant === 'adjustable') {
    mesh(shapeGeo([[-0.008 * c, 0], [0.008 * c, 0], [0.011 * c, L - 0.03], [-0.011 * c, L - 0.03]], t * 1.2, { bevel: t * 0.4, holes: [{ c: [0, 0.012], r: 0.004 }] }), st, { parent: g });
    const head = [[-0.012 * c, L - 0.035], [0.016 * c, L - 0.04], [0.02 * c, L - 0.012], [0.012 * c, L + 0.02], [0.004 * c, L + 0.034], [-0.004 * c, L + 0.03], [0, L + 0.01], [-0.012 * c, L - 0.005]];
    mesh(shapeGeo(head, t * 1.6, { bevel: t * 0.4 }), st, { parent: g });
    const jaw = group('slidejaw', { parent: g, at: [-0.012 * c, L - 0.004, 0] });
    mesh(shapeGeo([[0, -0.008], [0.006, -0.008], [0.004, 0.03], [-0.006, 0.034], [-0.008, 0.01]], t * 1.5, { bevel: t * 0.3 }), st, { parent: jaw });
    mesh(cylX(0.005 * c, 0.016 * c, 14), m.dark, { parent: g, at: [-0.002 * c, L - 0.022, 0], name: 'worm' });
    sleeve(g, T, m, L * 0.08, L * 0.6, 0.018 * c, t);
    return [clip('adjust', 3, [moveTrack(jaw, 3, (u) => [-0.012 * pingPong(u), 0, 0])])];
  } else if (variant === 'pipe') {
    const body = T.trim ? m.body : m.paint('#c62a22');
    mesh(shapeGeo([[-0.011 * c, 0], [0.011 * c, 0], [0.014 * c, L * 0.72], [-0.014 * c, L * 0.72]], 0.014 * c, { bevel: 0.003, holes: [{ c: [0, 0.015], r: 0.005 }] }), body, { parent: g });
    mesh(shapeGeo([[-0.016 * c, L * 0.7], [0.02 * c, L * 0.7], [0.03 * c, L * 0.8], [0.012 * c, L * 0.82], [-0.016 * c, L * 0.8]], 0.022 * c, { bevel: 0.003 }), body, { parent: g });
    const hook = group('hookjaw', { parent: g, at: [0, L * 0.8, 0] });
    mesh(cyl(0.007 * c, 0.007 * c, L * 0.2, 12), st, { parent: hook, at: [-0.008 * c, L * 0.1, 0] });
    mesh(shapeGeo([[-0.016 * c, L * 0.17], [0.045 * c, L * 0.17], [0.05 * c, L * 0.21], [-0.012 * c, L * 0.22]], 0.02 * c, { bevel: 0.003 }), st, { parent: hook });
    mesh(cylX(0.014 * c, 0.02 * c, 20).rotateZ(PI / 2), m.dark, { parent: g, at: [-0.008 * c, L * 0.87, 0], name: 'knurl' });
    sleeve(g, T, m, L * 0.1, L * 0.5, 0.022 * c, 0.014 * c);
    return [clip('adjust', 3, [moveTrack(hook, 3, (u) => [0, 0.03 * pingPong(u), 0])])];
  } else if (variant === 'ratchet' || variant === 'torque') {
    const hr = 0.017 * c;
    if (variant === 'torque') {
      mesh(cyl(0.012 * c, 0.011 * c, L * 0.85, 20), T.trim ? m.body : m.chrome, { parent: g, at: [0, L * 0.45, 0] });
      mesh(cyl(0.016 * c, 0.016 * c, L * 0.25, 24), m.grip, { parent: g, at: [0, L * 0.14, 0] });
      mesh(cyl(0.017 * c, 0.017 * c, 0.02, 24), m.dark, { parent: g, at: [0, 0.01, 0] });
      decal(g, 0.012 * c, L * 0.12, (ctx, w, h) => { ctx.fillStyle = '#f2f2f2'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#111'; for (let y = 4; y < h; y += 8) ctx.fillRect(0, y, y % 32 < 8 ? w * 0.7 : w * 0.4, 2); }, { at: [0, L * 0.38, 0.0122 * c], bg: '#eeeeee' });
    } else {
      mesh(shapeGeo([[-0.007 * c, 0], [0.007 * c, 0], [0.009 * c, L], [-0.009 * c, L]], 0.009 * c, { bevel: 0.0025 }), st, { parent: g });
      if (T.grip !== 'bi') sleeve(g, T, m, L * 0.05, L * 0.55, 0.013 * c, 0.009 * c);
      else mesh(roundedBox(0.019 * c, L * 0.5, 0.016 * c, 0.006), m.grip, { parent: g, at: [0, L * 0.3, 0] });
    }
    const head = group('rhead', { parent: g, at: [0, L + hr * 0.6, 0] });
    mesh(cylZ(hr, 0.014 * c, 28), st, { parent: head });
    mesh(cylZ(hr * 0.35, 0.004, 14), m.dark, { parent: head, at: [0, 0, 0.008 * c] });
    mesh(roundedBox(0.008, 0.004, 0.004, 0.0015), m.dark, { parent: head, at: [0, hr * 0.55, 0.008 * c] });
    const sock = group('socket', { parent: head, at: [0, 0, -0.007 * c] });
    mesh(cylZ(0.009 * c, 0.028, 24), m.chrome, { parent: sock, at: [0, 0, -0.014] });
    return [clip('ratchet', 2, [rotateTrack(sock, 'z', 2, (u) => Math.floor(u * 8) * (PI / 12), 16)])];
  } else if (variant === 'hex-key') {
    const r = 0.003 * c;
    curveTube([[0, 0, 0], [0, L - 0.008, 0], [0.002, L - 0.002, 0], [0.008, L, 0], [0.04, L, 0]], r, st, { parent: g, radialSegments: 6, segments: 30 });
    if (T.grip !== 'bi') mesh(cyl(r * 2.6, r * 2.6, L * 0.6, 16), T.grip === 'pro' ? m.body : m.grip, { parent: g, at: [0, L * 0.35, 0] });
  }
  return [];
});

/* ================================ pliers ================================ */

export const PLIERS_VARIANTS = {
  combination: { jl: 0.045, jw: 0.011, hl: 0.14 },
  'needle-nose': { jl: 0.065, jw: 0.006, hl: 0.14 },
  'slip-joint': { jl: 0.04, jw: 0.012, hl: 0.13, round: true },
  locking: { jl: 0.04, jw: 0.012, hl: 0.16, lock: true },
  'side-cutter': { jl: 0.028, jw: 0.012, hl: 0.13, cut: true },
  'tongue-groove': { jl: 0.045, jw: 0.012, hl: 0.21, angled: true },
};

export const createPliers = makeTool('pliers', PLIERS_VARIANTS, { p: '#d1322b', s: '#1c1d20', steel: 'dark' }, (g, { T, m, V }) => {
  const c = T.chunky, t = 0.0055 * c;
  const halves = [];
  for (const sd of [1, -1]) {
    const h = group(sd > 0 ? 'halfL' : 'halfR', { parent: g });
    halves.push(h);
    const z = sd * t * 0.5;
    const jl = V.jl, jw = V.jw * c;
    // jaw (+Y), slightly angled for tongue-groove
    const jaw = V.cut
      ? [[0, -0.008], [sd * jw, -0.004], [sd * jw * 0.9, jl * 0.7], [sd * 0.001, jl], [0, jl * 0.95]]
      : [[sd * -0.002, -0.01], [sd * jw, -0.006], [sd * jw * 0.9, jl * 0.5], [sd * jw * 0.35, jl], [0, jl], [sd * -0.001, jl * 0.3]];
    const jm = mesh(shapeGeo(sd > 0 ? jaw : jaw.slice().reverse(), t, { bevel: t * 0.25 }), m.steel, { parent: h, at: [0, 0, z] });
    if (V.angled) jm.rotation.z = -0.5;
    // pivot boss
    mesh(cylZ(0.009 * c, t * 0.98, 20), m.steel, { parent: h, at: [0, 0, z] });
    // handle
    const hl = V.hl;
    const pts = [[sd * 0.002, 0, z], [sd * 0.008, -hl * 0.25, z], [sd * 0.016 * c, -hl * 0.7, z], [sd * 0.018 * c, -hl, z]];
    const hr = 0.004 * c;
    curveTube(pts, hr, m.steel, { parent: h, radialSegments: 8, segments: 20 });
    if (T.grip !== 'wood') {
      const gp = pts.slice(1).map(([x, y, zz], i) => [x, i === 0 ? -hl * 0.32 : y, zz]);
      const gr = T.grip === 'toy' ? hr * 2.4 : T.grip === 'heavy' ? hr * 2.1 : T.grip === 'dip' ? hr * 1.4 : hr * 1.8;
      const gm = T.grip === 'pro' ? (sd > 0 ? m.body : m.grip) : T.grip === 'tape' ? m.tape : T.grip === 'dip' ? m.grip2 : sd > 0 ? m.grip2 : m.grip;
      curveTube([[gp[0][0], gp[0][1], z], [gp[1][0], gp[1][1], z], [gp[2][0], gp[2][1] + 0.004, z]], gr, gm, { parent: h, radialSegments: 12, segments: 16 });
    }
  }
  mesh(cylZ(0.0045 * c, t * 2.2, 16), m.chrome, { parent: g, name: 'rivet' });
  if (V.lock) {
    mesh(cylX(0.004 * c, 0.03, 12).rotateZ(PI / 2), m.chrome, { parent: g, at: [0.019 * c, -V.hl - 0.012, t * 0.5] });
    mesh(cyl(0.007 * c, 0.007 * c, 0.012, 16), m.chrome, { parent: g, at: [0.019 * c, -V.hl - 0.03, t * 0.5] });
  }
  return [clip('open', 2.4, halves.map((h, i) => rotateTrack(h, 'z', 2.4, (u) => (i ? -1 : 1) * 0.22 * pingPong(u))))];
});

/* ================================= saws ================================= */

export const SAW_VARIANTS = {
  panel: { L: 0.5 },
  'back-saw': { L: 0.3 },
  coping: { L: 0.16 },
  hacksaw: { L: 0.3 },
  'bow-saw': { L: 0.53 },
  'pull-saw': { L: 0.24 },
};

function teethLine(x0, x1, y, pitch, depth) {
  const pts = [];
  for (let x = x1; x > x0; x -= pitch) pts.push([x, y], [x - pitch * 0.3, y - depth]);
  pts.push([x0, y]);
  return pts;
}

function sawGrip(g, T, m, { x = 0, y = 0, scale = 1 } = {}) {
  const outline = [[0.015, 0.14], [-0.05, 0.155], [-0.11, 0.135], [-0.135, 0.07], [-0.13, -0.005], [-0.1, -0.025], [-0.075, -0.015], [-0.04, 0.02], [0.015, 0.005]].map(([a, b]) => [a * scale, b * scale]);
  const hole = [[-0.035, 0.05], [-0.06, 0.03], [-0.09, 0.04], [-0.105, 0.075], [-0.095, 0.11], [-0.06, 0.12], [-0.035, 0.1]].map(([a, b]) => [a * scale, b * scale]);
  const mat = T.grip === 'wood' || T.grip === 'tape' ? m.wood : T.grip === 'pro' ? m.body : T.grip === 'toy' ? m.accent : T.grip === 'dip' ? m.grip2 : m.grip;
  const hm = mesh(shapeGeo(outline, 0.024 * T.chunky, { holes: [hole], bevel: 0.006, seg: 3 }), mat, { parent: g, at: [x, y, 0], name: 'grip' });
  if (T.grip === 'bi') mesh(shapeGeo(outline.slice(3, 8), 0.027, { bevel: 0.005 }), m.grip2, { parent: g, at: [x, y, 0] });
  for (const [a, b] of [[0.0, 0.11], [0.0, 0.035], [-0.02, 0.075]]) mesh(cylZ(0.005, 0.026 * T.chunky, 14), m.brass, { parent: g, at: [x + a * scale, y + b * scale, 0] });
  return hm;
}

export const createSaw = makeTool('saw', SAW_VARIANTS, { p: '#d1322b', s: '#1c1d20' }, (g, { T, m, V, variant }) => {
  const L = V.L, bt = 0.0012 * (T.kids ? 3 : 1);
  const tooth = T.kids ? 0.012 : 0.0045;
  const blade = T.kids ? m.alu : m.steel;
  if (variant === 'panel' || variant === 'back-saw') {
    const hh = variant === 'panel' ? 0.13 : 0.095;
    const toe = variant === 'panel' ? 0.06 : hh;
    const pts = [[-0.02, hh], [L, toe], ...teethLine(-0.02, L, 0, tooth, tooth * 0.7)];
    mesh(shapeGeo(pts, bt, { bevel: 0 }), blade, { parent: g, name: 'blade' });
    if (variant === 'back-saw') mesh(roundedBox(L + 0.02, 0.016, 0.007, 0.002), T.vintage || !T.trim ? m.brass : m.dark, { parent: g, at: [L / 2 - 0.005, hh - 0.004, 0] });
    sawGrip(g, T, m, { x: 0.0, y: 0.0 });
    if (T.pro) hazard(g, 0.12, 0.02, { at: [L * 0.55, 0.05, bt / 2 + 0.0004] });
  } else if (variant === 'coping' || variant === 'hacksaw' || variant === 'bow-saw') {
    const H = variant === 'coping' ? 0.13 : variant === 'hacksaw' ? 0.1 : 0.2;
    const fr = variant === 'hacksaw' ? 0.006 : 0.0045;
    const fm = variant === 'bow-saw' ? (T.trim ? m.body : m.paint('#e8650f')) : T.trim === 'chrome' ? m.chrome : variant === 'hacksaw' ? m.body : m.chrome;
    let pts;
    if (variant === 'bow-saw') pts = Array.from({ length: 13 }, (_, i) => { const t = i / 12; return [t * L, H * Math.sin(t * PI) * 0.9 + 0.01, 0]; });
    else pts = [[0, 0.012, 0], [0, H - 0.02, 0], [0.02, H, 0], [L - 0.02, H, 0], [L, H - 0.02, 0], [L, 0.012, 0]];
    curveTube(pts, fr * T.chunky, fm, { parent: g, radialSegments: 10, segments: 60, name: 'frame' });
    mesh(roundedBox(L + 0.004, 0.012, bt * 0.8, 0.0003), blade, { parent: g, at: [L / 2, 0.006, 0], name: 'blade' });
    for (const x of [0, L]) mesh(cylZ(0.006, 0.01, 12), m.dark, { parent: g, at: [x, 0.008, 0] });
    if (variant === 'bow-saw') handle(g, T, m, 0.11, 0.014, { at: [0.0, 0.012, 0], rot: [0, 0, PI / 2] });
    else if (variant === 'coping') handle(g, T, m, 0.1, 0.013, { at: [0, 0.014, 0], rot: [0, 0, PI] });
    else sawGrip(g, T, m, { x: 0.0, y: -0.02, scale: 0.85 });
  } else {
    // pull saw: thin blade on a long straight (rattan-wrapped) handle
    mesh(shapeGeo([[0, 0.055], [L * 0.9, 0.06], [L, 0.05], ...teethLine(0, L, 0, 0.003, 0.0022)], 0.0007, { bevel: 0 }), blade, { parent: g, name: 'blade' });
    mesh(roundedBox(0.03, 0.03, 0.012, 0.003), m.steel, { parent: g, at: [0, 0.03, 0] });
    handle(g, T, m, 0.26, 0.014, { at: [0.012, 0.03, 0], rot: [0, 0, PI / 2], oval: 0.8 });
    if (T.grip === 'bi' || T.grip === 'wood') for (let k = 0; k < 9; k++) mesh(torus(0.0148, 0.0012, 18, 4), M.matte('#6b4a2a', 0.9), { parent: g, at: [-0.03 - k * 0.022, 0.03, 0], rot: [0, PI / 2, 0], scale: [1, 1, 0.8] });
  }
  return [];
}, { setScales: [1, 0.8] });

/* ============================ chisels & planes ============================ */

export const CHISEL_VARIANTS = {
  'bevel-chisel': { w: 0.019, bl: 0.12 },
  'mortise-chisel': { w: 0.01, bl: 0.13, thick: 0.009 },
  'cold-chisel': { w: 0.02, bl: 0.2 },
  gouge: { w: 0.022, bl: 0.12, curved: true },
  'block-plane': { plane: 0.16 },
  'jack-plane': { plane: 0.36 },
};

function plane(g, T, m, len) {
  const W = (len > 0.2 ? 0.062 : 0.044) * T.chunky;
  const H = len > 0.2 ? 0.05 : 0.04;
  const body = T.trim === 'vintage' || T.trim === 'rusty' ? m.dark : T.trim ? m.body : m.paint('#1f3f8f');
  // sole + cheeks (body is a shallow hollow: plane bodies are open castings)
  const prof = [[0, 0], [len, 0], [len, H * 0.45], [len * 0.92, H * 0.55], [len * 0.62, H * 0.62], [len * 0.38, H * 0.62], [len * 0.08, H * 0.55], [0, H * 0.4]];
  for (const z of [-1, 1]) mesh(shapeGeo(prof, 0.004, { bevel: 0.0012 }), body, { parent: g, at: [-len / 2, 0, z * (W / 2 - 0.002)] });
  mesh(roundedBox(len, 0.006, W, 0.002), m.steel, { parent: g, at: [0, 0.003, 0] });
  // iron + lever cap at bedding angle
  const iron = group('iron', { parent: g, at: [-len * 0.02, 0.004, 0], rot: [0, 0, len > 0.2 ? 0.78 : 0.35] });
  mesh(roundedBox(0.004, len > 0.2 ? 0.13 : 0.08, W * 0.8, 0.001), m.steel, { parent: iron, at: [0, len > 0.2 ? 0.062 : 0.038, 0] });
  mesh(roundedBox(0.008, len > 0.2 ? 0.08 : 0.06, W * 0.82, 0.003), T.trim === 'vintage' ? m.brass : body, { parent: iron, at: [0.005, len > 0.2 ? 0.05 : 0.035, 0] });
  if (len > 0.2) {
    const tote = [[0, 0], [0.04, 0], [0.05, 0.03], [0.035, 0.1], [0.012, 0.105], [0.0, 0.09], [0.018, 0.03]];
    mesh(shapeGeo(tote, 0.022, { bevel: 0.005, holes: [[[0.02, 0.035], [0.03, 0.035], [0.024, 0.085], [0.016, 0.08]]] }), T.grip === 'toy' ? m.accent : m.wood, { parent: g, at: [-len * 0.42, 0.005, 0] });
    mesh(lathe([[0, 0], [0.016, 0], [0.019, 0.02], [0.014, 0.04], [0, 0.045]], 20), m.wood, { parent: g, at: [len * 0.36, 0.005, 0] });
    mesh(cylZ(0.009, 0.004, 18), m.brass, { parent: g, at: [-len * 0.12, 0.03, 0] });
  } else {
    mesh(lathe([[0, 0], [0.012, 0], [0.013, 0.012], [0, 0.016]], 18), T.vintage ? m.brass : m.dark, { parent: g, at: [len * 0.36, 0.005, 0] });
    mesh(cushion(0.05, 0.012, W * 0.9, { radius: 0.005 }), body, { parent: g, at: [-len * 0.25, H * 0.62, 0] });
  }
  if (T.heavy) mesh(roundedBox(len * 0.3, 0.008, W + 0.004, 0.003), m.rubber, { parent: g, at: [0, H * 0.35, 0] });
}

export const createChisel = makeTool('chisel', CHISEL_VARIANTS, { p: '#e2b007', s: '#1c1d20' }, (g, { T, m, V, variant }) => {
  if (V.plane) { plane(g, T, m, V.plane); return []; }
  const c = T.chunky;
  let y = 0;
  if (variant === 'cold-chisel') {
    if (T.grip !== 'bi' && T.grip !== 'wood') {
      mesh(cyl(0.022 * c, 0.022 * c, 0.03, 20), T.grip === 'pro' ? m.body : m.grip, { parent: g, at: [0, 0.06, 0] });
      mesh(cyl(0.03 * c, 0.03 * c, 0.008, 24), m.grip, { parent: g, at: [0, 0.08, 0] });
    }
    mesh(lathe([[0, 0], [0.008 * c, 0], [0.0095 * c, 0.008], [0.0095 * c, 0.008]], 8), m.steel, { parent: g });
    mesh(cyl(0.0095 * c, 0.0095 * c, V.bl * 0.75, 6), m.steel, { parent: g, at: [0, 0.008 + V.bl * 0.375, 0] });
    const pts = [[-0.0095 * c, 0], [0.0095 * c, 0], [V.w * 0.55 * c, V.bl * 0.25], [-V.w * 0.55 * c, V.bl * 0.25]];
    mesh(taperZ(shapeGeo(pts, 0.016 * c, { bevel: 0.001 }), (x, yy) => 1 - (yy / (V.bl * 0.25)) * 0.85), m.steel, { parent: g, at: [0, 0.006 + V.bl * 0.75, 0] });
    return [];
  }
  const hl = variant === 'mortise-chisel' ? 0.13 : 0.11;
  handle(g, T, m, hl, 0.014 * (variant === 'mortise-chisel' ? 1.1 : 1));
  if (T.heavy || variant === 'mortise-chisel') mesh(cyl(0.015, 0.015, 0.006, 20), m.steel, { parent: g, at: [0, -0.003, 0] });
  y = hl - 0.004;
  mesh(cyl(0.007, 0.005, 0.022, 16), m.steel, { parent: g, at: [0, y + 0.011, 0] });
  y += 0.02;
  const w = V.w * (T.kids ? 1.4 : 1), th = V.thick ?? 0.0045;
  if (V.curved) {
    const geo = new THREE.CylinderGeometry(w * 0.6, w * 0.6, V.bl, 16, 1, true, -PI * 0.4, PI * 0.8);
    mesh(geo, m.steel, { parent: g, at: [0, y + V.bl / 2, -w * 0.4] });
    mesh(new THREE.CylinderGeometry(w * 0.6 - 0.002, w * 0.6 - 0.002, V.bl, 16, 1, true, -PI * 0.4, PI * 0.8), m.steel, { parent: g, at: [0, y + V.bl / 2, -w * 0.4] });
    mesh(cyl(0.004, 0.004, 0.03, 10), m.steel, { parent: g, at: [0, y + 0.01, 0] });
  } else {
    const pts = [[-w * 0.4, 0], [w * 0.4, 0], [w / 2, V.bl * 0.15], [w / 2, V.bl], [-w / 2, V.bl], [-w / 2, V.bl * 0.15]];
    mesh(taperZ(shapeGeo(pts, th, { bevel: 0.0006 }), (x, yy) => (yy > V.bl * 0.88 ? 1 - ((yy - V.bl * 0.88) / (V.bl * 0.12)) * 0.8 : 1)), m.steel, { parent: g, at: [0, y - 0.002, 0] });
  }
  return [];
}, { setScales: [1, 0.85, 0.7, 0.6] });

/* ================================= level ================================= */

export const LEVEL_VARIANTS = {
  torpedo: { L: 0.23 },
  'box-600': { L: 0.6 },
  'box-1200': { L: 1.2 },
  'i-beam': { L: 0.6 },
  laser: { L: 0.12 },
};

function vial(g, m, at, rot, T) {
  const v = group('vial', { parent: g, at, rot });
  mesh(roundedBox(0.04, 0.022, 0.012, 0.004), T.kids ? m.accent : m.black, { parent: v });
  mesh(cylX(0.0045, 0.03, 14), new THREE.MeshPhysicalMaterial({ name: 'vial', color: '#b8f03a', emissive: '#6fae0a', emissiveIntensity: 0.25, roughness: 0.1, transmission: 0.2, clearcoat: 1 }), { parent: v, at: [0, 0, 0.004] });
  mesh(sphere(0.003, 10, 8), M.plastic('#f6f6f0', 0.2), { parent: v, at: [0.002, 0.0012, 0.0055] });
}

export const createLevel = makeTool('level', LEVEL_VARIANTS, { p: '#f2c11a', s: '#1c1d20' }, (g, { T, m, V, variant }) => {
  const L = V.L;
  const body = T.trim === 'chrome' ? m.alu : T.trim === 'vintage' ? m.wood : m.body;
  const H = 0.06 * T.chunky, D = 0.025 * T.chunky;
  if (variant === 'laser') {
    // compact cross-line laser on a small tripod
    const legs = 0.16;
    const top = group('top', { parent: g, at: [0, legs, 0] });
    mesh(cyl(0.02, 0.022, 0.02, 20), m.dark, { parent: top });
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * PI * 2;
      curveTube([[Math.cos(a) * 0.014, legs - 0.004, Math.sin(a) * 0.014], [Math.cos(a) * 0.09, 0.006, Math.sin(a) * 0.09]], 0.005, m.dark, { parent: g, radialSegments: 8, segments: 4 });
      mesh(sphere(0.008, 10, 8), m.rubber, { parent: g, at: [Math.cos(a) * 0.09, 0.006, Math.sin(a) * 0.09] });
    }
    const box = group('unit', { parent: top, at: [0, 0.01, 0] });
    mesh(roundedBox(0.075, 0.09, 0.075, 0.014), body, { parent: box, at: [0, 0.045, 0] });
    mesh(roundedBox(0.077, 0.03, 0.077, 0.012), m.grip, { parent: box, at: [0, 0.015, 0] });
    const lens = group('laserlens', { parent: box, at: [0, 0.062, 0.038] });
    mesh(roundedBox(0.04, 0.032, 0.004, 0.003), M.emissive('#ff2a1a', 0.6), { parent: lens, name: 'beam' });
    mesh(roundedBox(0.03, 0.006, 0.006, 0.002), m.black, { parent: box, at: [0, 0.092, 0] });
    if (T.pro) hazard(box, 0.074, 0.012, { at: [0, 0.035, 0.0378] });
    return [clip('on', 1, [new THREE.NumberKeyframeTrack('beam.material.emissiveIntensity', [0, 0.5, 1], [0.6, 2.2, 0.6])]), clip('scan', 4, [rotateTrack(top, 'y', 4, (u) => u * PI * 2)])];
  }
  if (variant === 'torpedo') {
    const prof = [[-L / 2, 0], [L / 2, 0], [L / 2, H * 0.4], [L / 2 - 0.03, H * 0.75], [-L / 2 + 0.03, H * 0.75], [-L / 2, H * 0.4]];
    mesh(shapeGeo(prof, D, { bevel: 0.004, holes: [{ c: [L * 0.3, H * 0.38], r: 0.009 }] }), body, { parent: g });
    vial(g, m, [0, H * 0.75, 0], [PI / 2, 0, 0], T);
    vial(g, m, [-L * 0.25, H * 0.37, D / 2 - 0.004], [0, 0, PI / 2], T);
    mesh(roundedBox(L * 0.98, 0.006, D * 0.6, 0.002), m.black, { parent: g, at: [0, 0.002, 0] });
  } else {
    let geo;
    const prof = variant === 'i-beam'
      ? [[-D / 2, 0], [D / 2, 0], [D / 2, 0.006], [0.003, 0.008], [0.003, H - 0.008], [D / 2, H - 0.006], [D / 2, H], [-D / 2, H], [-D / 2, H - 0.006], [-0.003, H - 0.008], [-0.003, 0.008], [-D / 2, 0.006]]
      : null;
    if (prof) geo = shapeGeo(prof, L - 0.03, { bevel: 0.0008 }).rotateY(PI / 2);
    else geo = shapeGeo([[-D / 2, 0], [D / 2, 0], [D / 2, H], [-D / 2, H]], L - 0.03, { bevel: 0.002, holes: [[[-D / 2 + 0.002, 0.002], [D / 2 - 0.002, 0.002], [D / 2 - 0.002, H - 0.002], [-D / 2 + 0.002, H - 0.002]]] }).rotateY(PI / 2);
    mesh(geo, body, { parent: g });
    for (const sd of [-1, 1]) mesh(roundedBox(0.03, H + 0.004, D + 0.004, 0.006), T.vintage ? m.brass : m.grip, { parent: g, at: [sd * (L / 2 - 0.015), H / 2, 0] });
    vial(g, m, [0, H, 0], [PI / 2, 0, 0], T);
    vial(g, m, [-L / 2 + 0.07, H / 2, D / 2], [0, 0, PI / 2], T);
    vial(g, m, [L / 2 - 0.07, H / 2, D / 2], [0, 0, PI / 2], T);
    if (variant !== 'i-beam' && L > 0.5) mesh(roundedBox(0.09, 0.03, 0.004, 0.003), T.kids ? m.accent : m.grip, { parent: g, at: [L * 0.15, H / 2, D / 2 + 0.001] });
    if (T.pro) hazard(g, L * 0.25, H * 0.5, { at: [-L * 0.17, H / 2, D / 2 + 0.0004] });
  }
  return [];
}, { lay: false, setScales: [1, 0.6, 0.4] });

/* ============================== measuring ============================== */

export const MEASURE_VARIANTS = {
  'tape-measure': {},
  'long-tape': {},
  'folding-rule': {},
  'try-square': {},
  'speed-square': {},
  'steel-rule': {},
};

const rulerDraw = (bg) => (ctx, w, h) => {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#111';
  const n = 60;
  for (let i = 0; i <= n; i++) { const x = (i / n) * w; ctx.fillRect(x, 0, 1.5, i % 10 === 0 ? h * 0.5 : i % 5 === 0 ? h * 0.35 : h * 0.2); }
  ctx.fillStyle = '#c21a1a';
  ctx.font = `bold ${Math.round(h * 0.32)}px sans-serif`;
  for (let i = 1; i < 6; i++) ctx.fillText(String(i * 10), (i / 6) * w - 6, h * 0.9);
};

export const createMeasuringTool = makeTool('measuring-tool', MEASURE_VARIANTS, { p: '#f2c11a', s: '#1c1d20' }, (g, { T, m, variant }) => {
  const c = T.chunky;
  if (variant === 'tape-measure') {
    const R = 0.034 * c, D = 0.038 * c;
    const caseG = group('case', { parent: g });
    const out = [...arc([R * 0.35, R * 1.65], R * 0.35, 0, PI / 2, 6), ...arc([-R * 0.6, R * 1.0], R, PI / 2, PI * 1.5, 12), [R, 0], [R, R * 1.65]];
    const prof = [[-R * 0.6, 0], [R, 0], [R, R * 1.6], ...arc([R * 0.6, R * 1.6], R * 0.4, 0, PI / 2, 6), ...arc([-R * 0.6, R * 1.0], R, PI / 2, PI, 10).slice(1), [-R * 1.6, R * 0.4], ...arc([-R * 1.2, R * 0.4], R * 0.4, PI, PI * 1.5, 6)];
    void out;
    mesh(shapeGeo(prof, D, { bevel: 0.006 * c, seg: 3 }), m.body, { parent: caseG });
    mesh(shapeGeo(prof.map(([x, y]) => [x * 0.86 - R * 0.05, y * 0.86 + R * 0.1]), D + 0.004, { bevel: 0.004 }), T.grip === 'pro' ? m.grip : m.grip, { parent: caseG, scale: [1, 1, 0.92] });
    mesh(cylZ(0.009 * c, D + 0.006, 20), m.chrome, { parent: caseG, at: [-R * 0.3, R * 0.9, 0] });
    mesh(roundedBox(0.016 * c, 0.008 * c, 0.012 * c, 0.003), T.kids ? m.accent : m.body2, { parent: caseG, at: [R * 0.45, R * 1.98, 0] });
    mesh(roundedBox(0.012, 0.05 * c, 0.003, 0.0015), m.chrome, { parent: caseG, at: [-R * 0.3, R * 0.9, -D / 2 - 0.004] });
    const blade = group('blade', { parent: g, at: [R - 0.002, 0.0035, 0] });
    const len = 0.3;
    const bgeo = new THREE.BoxGeometry(len, 0.0006, 0.025 * c).translate(len / 2, 0, 0);
    mesh(bgeo, T.kids ? m.accent : M.plastic('#f2d21a', 0.35), { parent: blade, name: 'bladestrip' });
    blade.scale.x = 0.08;
    const hook = group('hook', { parent: g, at: [R - 0.002 + len * 0.08, 0.0035, 0] });
    mesh(roundedBox(0.0015, 0.008, 0.026 * c, 0.0005), m.chrome, { parent: hook, at: [0.0008, 0.0025, 0] });
    return [clip('extend', 4, [scaleTrack(blade, 4, (u) => [1 + 11.5 * pingPong(u), 1, 1]), moveTrack(hook, 4, (u) => [len * 0.08 * 11.5 * pingPong(u), 0, 0])])];
  }
  if (variant === 'long-tape') {
    const R = 0.075 * c;
    mesh(ringGeo(R, R * 0.4, 0.035 * c, 32, 0.003), T.kids ? m.accent : m.body, { parent: g, at: [0, R + 0.012, 0] });
    mesh(cylZ(R * 0.42, 0.03 * c, 24), M.plastic('#f2efe4', 0.4), { parent: g, at: [0, R + 0.012, 0], name: 'reel' });
    mesh(cylZ(0.006, 0.05 * c, 12), m.dark, { parent: g, at: [0, R + 0.012, 0] });
    mesh(roundedBox(0.012, 0.03, 0.012, 0.004), m.dark, { parent: g, at: [R * 0.3, R + 0.012, 0.03 * c] });
    curveTube([[0, 2 * R, 0], [0, 2 * R + 0.08, 0], [-0.03, 2 * R + 0.1, 0]], 0.01, m.grip, { parent: g, radialSegments: 10 });
    mesh(roundedBox(0.04, 0.012, 0.03, 0.004), m.grip, { parent: g, at: [0, 0.006, 0] });
    mesh(new THREE.BoxGeometry(0.2, 0.0008, 0.013).translate(0.1, 0, 0), M.plastic('#f2efe4', 0.4), { parent: g, at: [0.015, 0.0006, 0] });
    mesh(roundedBox(0.015, 0.01, 0.02, 0.002), m.chrome, { parent: g, at: [0.215, 0.005, 0] });
    return [];
  }
  if (variant === 'folding-rule') {
    const segL = 0.2, w = 0.016 * c, th = 0.0035 * c;
    const angles = [0.6, -0.6, 0.6, -0.6, 0.6];
    let x = 0, z = 0, a = 0;
    angles.forEach((da, k) => {
      a += da * (k === 0 ? 0.5 : 2);
      const dx = Math.cos(a) * segL, dz = Math.sin(a) * segL;
      const seg = mesh(roundedBox(segL + w, th, w, th * 0.4), T.kids ? (k % 2 ? m.body : m.accent) : T.vintage || T.rust ? m.wood : M.matte('#f2ecd8', 0.6), { parent: g, at: [x + dx / 2, th / 2 + (k % 2) * th * 0.9, z + dz / 2], rot: [0, -a, 0] });
      seg.name = `seg${k}`;
      decal(seg, segL, w * 0.9, rulerDraw('#f2ecd8'), { at: [0, th / 2 + 0.0002, 0], rot: [-PI / 2, 0, 0], bg: '#efe8d0' });
      mesh(cyl(w * 0.35, w * 0.35, th * 2.2, 12), m.brass, { parent: g, at: [x + dx, th, z + dz] });
      x += dx; z += dz;
    });
    return [];
  }
  if (variant === 'try-square' || variant === 'speed-square') {
    if (variant === 'try-square') {
      mesh(roundedBox(0.026 * c, 0.018 * c, 0.17, 0.004), T.trim === 'pro' ? m.body : m.wood, { parent: g, at: [0, 0.009 * c, 0], name: 'stock' });
      mesh(roundedBox(0.3, 0.0018, 0.035, 0.0006), m.steel, { parent: g, at: [0.138, 0.009 * c, 0.085 - 0.0175] });
      decal(g, 0.27, 0.03, rulerDraw('#c8ccd0'), { at: [0.15, 0.009 * c + 0.001, 0.0675], rot: [-PI / 2, 0, 0], bg: '#c8ccd0', px: 512 });
      for (const zz of [0.04, 0.06, 0.08]) mesh(cyl(0.003, 0.003, 0.019 * c, 10), m.brass, { parent: g, at: [0, 0.009 * c, zz] });
      if (T.trim === 'vintage') mesh(roundedBox(0.027 * c, 0.019 * c, 0.012, 0.002), m.brass, { parent: g, at: [0, 0.009 * c, 0.08] });
      return [];
    }
    const S = 0.18;
    const pts = [[0, 0], [S, 0], [0, S]];
    mesh(shapeGeo(pts, 0.004 * c, { bevel: 0.0012, holes: [[[0.03, 0.03], [0.1, 0.03], [0.03, 0.1]]] }), T.trim ? m.body : m.alu, { parent: g, rot: [-PI / 2, 0, 0], at: [-S / 3, 0.002 * c, S / 3] });
    mesh(roundedBox(S, 0.02, 0.006, 0.002), T.trim ? m.body : m.alu, { parent: g, at: [-S / 3 + S / 2, 0.01, S / 3] });
    return [];
  }
  // steel rule
  const L = 0.6;
  mesh(shapeGeo([[-L / 2, -0.015], [L / 2, -0.015], [L / 2, 0.015], [-L / 2, 0.015]], 0.0012 * c, { bevel: 0.0003, holes: [{ c: [-L / 2 + 0.012, 0], r: 0.004 }] }), T.kids ? m.accent : m.steel, { parent: g, rot: [-PI / 2, 0, 0], at: [0, 0.0006, 0] });
  decal(g, L - 0.04, 0.026, rulerDraw('#d4d8dc'), { at: [0.01, 0.0013 * c, 0], rot: [-PI / 2, 0, 0], bg: '#c8ccd0', px: 512 });
  if (T.grip !== 'bi' && T.grip !== 'wood') mesh(roundedBox(0.03, 0.006, 0.034, 0.002), T.grip === 'pro' ? m.body : m.grip, { parent: g, at: [-L / 2 + 0.015, 0.003, 0] });
  return [];
}, { lay: false, setScales: [1, 0.85] });

/* ================================== axe ================================== */

export const AXE_VARIANTS = {
  felling: { L: 0.8, head: 'axe', hs: 1 },
  hatchet: { L: 0.36, head: 'axe', hs: 0.65 },
  maul: { L: 0.85, head: 'maul', hs: 1.1 },
  'double-bit': { L: 0.8, head: 'double', hs: 1 },
  pickaxe: { L: 0.9, head: 'pick', hs: 1 },
  mattock: { L: 0.9, head: 'mattock', hs: 1 },
};

function axeBlade(dir, s, et, wide = 1) {
  // side profile from the eye (x=0) to the edge (x=dir*len); edge is curved
  const len = 0.13 * s, bh = 0.11 * s * wide;
  const pts = [[0, 0.03 * s], [len * 0.45, 0.028 * s], ...arc([len - bh * 0.6, 0], bh * 0.7, PI * 0.45, -PI * 0.45, 10).map(([x, y]) => [x + bh * 0.1, y * 0.95]), [len * 0.45, -0.032 * s], [0, -0.034 * s]];
  const geo = taperZ(shapeGeo(pts.map(([x, y]) => [x * dir, y]), et, { bevel: 0.0015 }), (x) => 1 - Math.min(0.9, Math.max(0, (Math.abs(x) - 0.012) / (len * 0.95))) * 0.9 * (wide > 1.2 ? 0.75 : 1));
  return geo;
}

export const createAxe = makeTool('tool-axe', AXE_VARIANTS, { p: '#c62a22', s: '#1c1d20' }, (g, { T, m, V }) => {
  const L = V.L * (T.heavy ? 1.05 : 1), s = V.hs * (T.chunky > 1.2 ? 1.1 : 1);
  const style = T.grip === 'bi' && V.head !== 'pick' && V.head !== 'mattock' && V.L > 0.5 ? 'wood' : undefined;
  handle(g, T, m, L, 0.016 * (V.L > 0.5 ? 1.05 : 0.9), { oval: 0.7, style });
  const head = group('head', { parent: g, at: [0, L - 0.03 * s, 0] });
  const et = 0.032 * s * T.chunky;
  const headMat = T.trim === 'vintage' || T.trim === 'rusty' ? m.steel : T.kids ? m.alu : m.body;
  mesh(roundedBox(0.04 * s, 0.07 * s, et, 0.006 * s), headMat, { parent: head });
  if (V.head === 'axe' || V.head === 'double' || V.head === 'maul') {
    mesh(axeBlade(1, s, et, V.head === 'maul' ? 0.75 : 1), headMat, { parent: head, at: [0.012 * s, 0, 0] });
    if (V.head === 'double') mesh(axeBlade(-1, s, et), headMat, { parent: head, at: [-0.012 * s, 0, 0] });
    else mesh(roundedBox(0.035 * s, 0.06 * s, et * (V.head === 'maul' ? 1.4 : 0.95), 0.006), headMat, { parent: head, at: [-0.03 * s, 0, 0] });
    if (V.head === 'maul') mesh(taperZ(shapeGeo([[0, 0.032 * s], [0.1 * s, 0.03 * s], [0.11 * s, -0.03 * s], [0, -0.034 * s]], et * 1.6, { bevel: 0.002 }), (x) => 1 - Math.min(0.9, x / (0.11 * s)) * 0.88), headMat, { parent: head, at: [0.012, 0, 0] });
    if (headMat === m.body) mesh(axeBlade(1, s * 1.002, et * 0.32, V.head === 'maul' ? 0.75 : 1), m.steel, { parent: head, at: [0.014 * s, 0, 0], scale: [1, 1, 1] }).geometry.translate(0, 0, 0);
  } else {
    // pick: a curved crescent through the eye; mattock: adze on one side, axe on the other
    const n = 14, pts = [], bot = [];
    const span = 0.25 * s;
    for (let i = 0; i <= n; i++) { const t = -1 + (2 * i) / n; const y = -(Math.abs(t) ** 1.6) * 0.05 * s; const w = 0.018 * s * (1 - Math.abs(t) ** 1.3) + 0.002; pts.push([t * span, y + w]); bot.push([t * span, y - w]); }
    if (V.head === 'pick') mesh(shapeGeo([...pts, ...bot.reverse()], et * 0.8, { bevel: 0.002 }), headMat, { parent: head });
    else {
      mesh(axeBlade(1, s * 0.85, et * 0.9), headMat, { parent: head, at: [0.012 * s, 0, 0] });
      const ad = mesh(taperZ(shapeGeo([[0, 0.02 * s], [-0.16 * s, -0.02 * s], [-0.17 * s, -0.04 * s], [0, -0.025 * s]], 0.07 * s, { bevel: 0.002 }), () => 1), headMat, { parent: head });
      ad.scale.y = 1;
    }
  }
  if (T.heavy) mesh(cyl(0.024, 0.02, 0.06, 16), m.rubber, { parent: g, at: [0, L - 0.03 * s - 0.065 * s, 0], scale: [1, 1, 0.75] });
  if (T.pro) hazard(g, 0.03, 0.08, { at: [0, L * 0.45, 0.0118], bg: '#f5b301' });
  return [];
}, { setScales: [1, 0.55] });
