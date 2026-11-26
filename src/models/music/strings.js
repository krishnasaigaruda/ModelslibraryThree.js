// Fretted and bowed string instruments: guitars (acoustic, classical, electric, semi-hollow,
// archtop, bass, resonator), ukuleles, banjo, mandolin, and the violin family with bows.
// Every instrument stands on its own stand (cradle + neck yoke) or endpin, so nothing floats.
import {
  THREE, M, mesh, group, roundedBox, curveTube, lathe, tube, setup, done, fin, hwMat, woodMat, blob, mirrorHalf, inset,
  circlePts, plate, hollowBody, archGeo, burst, merged, placed, segGeo, lowestPoint, bar, knobGeo, TRIMS, mergeGeometries,
} from './common.js';
import { clip, scaleTrack } from '../../core/animation.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const pearl = () => new THREE.MeshPhysicalMaterial({ name: 'pearl', color: '#f3efe6', roughness: 0.2, clearcoat: 1, iridescence: 0.6 });
const ebony = () => new THREE.MeshStandardMaterial({ name: 'ebony', color: '#1d1714', roughness: 0.5 });
const rosewood = () => new THREE.MeshStandardMaterial({ name: 'rosewood', color: '#3b2318', roughness: 0.55 });
const boneMat = () => M.matte('#efe8d6', 0.4);

/* --------------------------- electric body outlines --------------------------- */
// full outlines (x across, y up the body), joint y (where the neck meets the body top)
const ELEC = {
  dc: { j: 0.365, pts: [[0, 0], [0.1, 0.012], [0.155, 0.06], [0.165, 0.13], [0.14, 0.2], [0.115, 0.25], [0.12, 0.3], [0.135, 0.36], [0.13, 0.43], [0.105, 0.45], [0.08, 0.42], [0.055, 0.375], [0.03, 0.365], [-0.03, 0.365], [-0.05, 0.375], [-0.08, 0.4], [-0.1, 0.412], [-0.12, 0.385], [-0.115, 0.32], [-0.105, 0.27], [-0.125, 0.22], [-0.16, 0.14], [-0.155, 0.06], [-0.1, 0.012]] },
  sc: { j: 0.378, pts: [[0, 0], [0.11, 0.01], [0.16, 0.07], [0.17, 0.15], [0.145, 0.23], [0.13, 0.27], [0.135, 0.31], [0.12, 0.355], [0.08, 0.383], [0.03, 0.39], [-0.03, 0.385], [-0.05, 0.41], [-0.07, 0.36], [-0.1, 0.305], [-0.13, 0.27], [-0.155, 0.21], [-0.17, 0.14], [-0.16, 0.06], [-0.1, 0.01]] },
  offset: { j: 0.37, pts: [[0, -0.004], [0.11, 0.005], [0.165, 0.05], [0.17, 0.12], [0.14, 0.19], [0.115, 0.25], [0.125, 0.31], [0.145, 0.38], [0.125, 0.45], [0.095, 0.44], [0.07, 0.39], [0.035, 0.37], [-0.035, 0.37], [-0.06, 0.385], [-0.085, 0.41], [-0.11, 0.405], [-0.125, 0.36], [-0.12, 0.3], [-0.13, 0.24], [-0.165, 0.17], [-0.175, 0.09], [-0.15, 0.03], [-0.08, -0.003]] },
  semi: { j: 0.39, pts: mirrorHalf([[0, 0], [0.13, 0.012], [0.195, 0.07], [0.2, 0.15], [0.175, 0.24], [0.16, 0.27], [0.17, 0.33], [0.155, 0.4], [0.12, 0.43], [0.09, 0.41], [0.06, 0.393], [0, 0.39]]) },
};

export const GUITAR_VARIANTS = {
  acoustic: { kind: 'acoustic', L: 0.505, lw: 0.2, ww: 0.137, uw: 0.145, wy: 0.56, D: 0.11, sc: 0.645, n: 6, F: 20, join: 14, p: '#d4ab72', side: '#6b3a1e', head: 'open3', pg: 'tear' },
  jumbo: { kind: 'acoustic', L: 0.53, lw: 0.217, ww: 0.128, uw: 0.17, wy: 0.55, D: 0.115, sc: 0.648, n: 6, F: 20, join: 14, p: '#e9cf9c', side: '#c89a5a', head: 'open3', pg: 'large' },
  parlor: { kind: 'acoustic', L: 0.46, lw: 0.165, ww: 0.113, uw: 0.122, wy: 0.57, D: 0.095, sc: 0.62, n: 6, F: 19, join: 12, p: '#d4ae78', side: '#4b2a16', head: 'slotted', pg: 'none' },
  'twelve-string': { kind: 'acoustic', L: 0.52, lw: 0.21, ww: 0.135, uw: 0.155, wy: 0.56, D: 0.115, sc: 0.645, n: 12, F: 20, join: 14, p: '#e6c995', side: '#3e2416', head: 'paddle', pg: 'tear', neckW: 0.048 },
  classical: { kind: 'acoustic', nylon: true, L: 0.485, lw: 0.185, ww: 0.122, uw: 0.142, wy: 0.57, D: 0.1, sc: 0.65, n: 6, F: 19, join: 12, p: '#d9b483', side: '#5a2e18', head: 'slotted', lockHead: true, pg: 'none', neckW: 0.052 },
  flamenco: { kind: 'acoustic', nylon: true, L: 0.48, lw: 0.182, ww: 0.12, uw: 0.14, wy: 0.57, D: 0.09, sc: 0.65, n: 6, F: 19, join: 12, p: '#eed6a6', side: '#e0bf86', head: 'slotted', lockHead: true, pg: 'clear', neckW: 0.052 },
  resonator: { kind: 'acoustic', reso: true, L: 0.5, lw: 0.19, ww: 0.13, uw: 0.14, wy: 0.56, D: 0.09, sc: 0.635, n: 6, F: 19, join: 12, p: '#c9ccd2', side: '#c9ccd2', metalBody: true, head: 'slotted', pg: 'none' },
  archtop: { kind: 'acoustic', archtop: true, cut: true, L: 0.53, lw: 0.215, ww: 0.145, uw: 0.165, wy: 0.55, D: 0.08, sc: 0.635, n: 6, F: 20, join: 14, p: '#c7782f', side: '#7a3f1a', head: 'open3', pg: 'small' },
  'electric-dc': { kind: 'electric', outline: 'dc', D: 0.044, sc: 0.648, n: 6, F: 22, join: 16, pickups: ['s', 's', 's'], bridge: 'trem', p: '#b3122a', head: 'inline', pg: 'large', knobs: 3 },
  'electric-sc': { kind: 'electric', outline: 'sc', D: 0.05, sc: 0.628, n: 6, F: 22, join: 16, pickups: ['h', 'h'], bridge: 'tom', p: '#7a1a14', head: 'open3', pg: 'small', knobs: 4, carve: 0.008 },
  'electric-offset': { kind: 'electric', outline: 'offset', D: 0.042, sc: 0.648, n: 6, F: 21, join: 17, pickups: ['w', 'w'], bridge: 'trem', p: '#7fbfae', head: 'inline', pg: 'large', knobs: 2 },
  'electric-superstrat': { kind: 'electric', outline: 'dc', horn: 1.35, D: 0.04, sc: 0.648, n: 6, F: 24, join: 18, pickups: ['h', 's', 'h'], bridge: 'trem', p: '#1d3fa8', head: 'pointy', pg: 'none', knobs: 2 },
  'semi-hollow': { kind: 'semi', outline: 'semi', D: 0.046, sc: 0.628, n: 6, F: 22, join: 19, pickups: ['h', 'h'], bridge: 'tom', p: '#9c2a1a', head: 'open3', pg: 'small', knobs: 4, carve: 0.006 },
  bass: { kind: 'bass', outline: 'offset', ow: 1.12, oh: 1.12, D: 0.044, sc: 0.864, n: 4, F: 20, join: 18, pickups: ['p'], bridge: 'bass', p: '#1a1a1c', head: 'inline', pg: 'large', knobs: 2, neckW: 0.042 },
  'bass-5': { kind: 'bass', outline: 'dc', ow: 1.15, oh: 1.12, horn: 1.2, D: 0.045, sc: 0.864, n: 5, F: 24, join: 20, pickups: ['h', 'h'], bridge: 'bass', p: '#5b2a6e', head: 'open3', pg: 'none', knobs: 4, neckW: 0.046 },
  'fretless-bass': { kind: 'bass', outline: 'offset', ow: 1.1, oh: 1.12, D: 0.044, sc: 0.864, n: 4, F: 20, join: 18, fretless: true, pickups: ['j', 'j'], bridge: 'bass', p: '#c9862f', head: 'inline', pg: 'tear', knobs: 3, neckW: 0.04 },
  ukulele: { kind: 'acoustic', nylon: true, L: 0.24, lw: 0.084, ww: 0.062, uw: 0.07, wy: 0.56, D: 0.062, sc: 0.33, n: 4, F: 12, join: 12, p: '#c8874a', side: '#8a4a22', head: 'paddle', pg: 'none', neckW: 0.035 },
  'tenor-ukulele': { kind: 'acoustic', nylon: true, L: 0.29, lw: 0.1, ww: 0.072, uw: 0.083, wy: 0.56, D: 0.07, sc: 0.43, n: 4, F: 18, join: 14, p: '#7a4626', side: '#5a301a', head: 'slotted', pg: 'none', neckW: 0.036 },
  banjo: { kind: 'banjo', R: 0.14, D: 0.075, sc: 0.67, n: 5, F: 22, p: '#6b3a1e', side: '#6b3a1e', head: 'open3', lockHead: true, neckW: 0.032 },
  mandolin: { kind: 'mandolin', style: 'a', L: 0.33, lw: 0.125, D: 0.06, sc: 0.35, n: 8, F: 20, join: 12, p: '#c27a34', side: '#6a3518', head: 'paddle', lockHead: true, neckW: 0.03 },
  'mandolin-f': { kind: 'mandolin', style: 'f', L: 0.34, lw: 0.13, D: 0.062, sc: 0.355, n: 8, F: 20, join: 15, p: '#c6782d', side: '#6a3518', head: 'paddle', lockHead: true, neckW: 0.03 },
};

/* ------------------------------ outlines ------------------------------ */

function acousticOutline(V, T) {
  const { L, lw, ww, uw, wy } = V;
  const r = T.round ? 1.035 : 1;
  const half = [[0, 0], [0.72 * lw, 0.025 * L], [0.97 * lw * r, 0.13 * L], [lw * r, 0.25 * L], [0.93 * lw, 0.36 * L], [ww * (T.round ? 0.95 : 1), wy * L], [0.97 * uw, (wy + 0.13) * L], [uw, 0.8 * L], [0.85 * uw, 0.92 * L], [0.45 * uw, 0.99 * L], [0, L]];
  let pts = blob(mirrorHalf(half), 80);
  const cut = (V.cut || (T.sharp && !V.nylon)) && !T.round;
  if (cut) pts = pts.map(([x, y]) => (x > 0 ? [x * (1 - 0.68 * smooth((wy + 0.03) * L, (wy + 0.17) * L, y)), y] : [x, y]));
  return pts;
}

function electricOutline(V, T) {
  const E = ELEC[V.outline];
  const ow = V.ow ?? 1, oh = V.oh ?? 1;
  const j = E.j * oh;
  const hk = (V.horn ?? 1) * (T.trim ? TRIMS[T.trim].horn : 1);
  let pts = E.pts.map(([x, y]) => [x * ow, y * oh]).map(([x, y]) => (y > j - 0.02 && Math.abs(x) > 0.045 ? [x * (1 + (hk - 1) * 0.12), j - 0.02 + (y - j + 0.02) * hk] : [x, y]));
  if (T.sharp === 2) pts = pts.map(([x, y]) => (y < 0.05 && Math.abs(x) < 0.12 ? [x * 0.8, y - 0.05 * (1 - Math.abs(x) / 0.12)] : [x, y]));
  if (T.round) pts = pts.map(([x, y]) => [x * 1.03, y]);
  return { pts: T.sharp ? pts : blob(pts, 90), j };
}

/** f-hole slot outline centred at (x,y), height h, mirrored by side s. */
function fHole(x, y, h, s = 1, w = 0.0045) {
  const c = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; c.push([x + s * 0.12 * h * Math.sin((t - 0.5) * Math.PI * 1.6), y - h / 2 + t * h]); }
  const L = [], R = [];
  for (let i = 0; i <= 12; i++) { const ww = w * (0.6 + 0.6 * Math.abs(i / 12 - 0.5)); L.push([c[i][0] - ww / 2, c[i][1]]); R.push([c[i][0] + ww / 2, c[i][1]]); }
  return [...R, ...L.reverse()].reverse();
}

/* ------------------------------ headstocks ------------------------------ */

function headOutline(style, w0, n) {
  const h = w0 / 2;
  const big = n >= 12 ? 1.3 : n === 8 ? 1.05 : 1;
  switch (style) {
    case 'inline': return blob([[-h, 0], [h, 0], [h + 0.003, 0.03], [0.036, 0.05], [0.042, 0.12], [0.038, 0.19], [0.022, 0.205], [0.004, 0.19], [-0.008, 0.15], [-0.015, 0.08], [-0.02, 0.05], [-h, 0.02]], 48);
    case 'reverse': return blob([[-h, 0], [h, 0], [h, 0.02], [0.02, 0.05], [0.015, 0.08], [0.008, 0.15], [-0.004, 0.19], [-0.022, 0.205], [-0.038, 0.19], [-0.042, 0.12], [-0.036, 0.05], [-h - 0.003, 0.03]], 48);
    case 'pointy': return [[-h, 0], [h, 0], [h + 0.006, 0.035], [0.062, 0.205], [0.05, 0.215], [-0.006, 0.09], [-h, 0.035]];
    case 'slotted': return blob([[-h, 0], [h, 0], [0.03, 0.04], [0.031, 0.165], [0.026, 0.19], [0, 0.18], [-0.026, 0.19], [-0.031, 0.165], [-0.03, 0.04]], 48);
    case 'paddle': return blob([[-h, 0], [h, 0], [0.036, 0.03], [0.037, 0.17 * big], [0.03, 0.18 * big], [-0.03, 0.18 * big], [-0.037, 0.17 * big], [-0.036, 0.03]], 48);
    default: return blob([[-h, 0], [h, 0], [0.04, 0.05], [0.046, 0.165 * big], [0.034, 0.19 * big], [0, 0.178 * big], [-0.034, 0.19 * big], [-0.046, 0.165 * big], [-0.04, 0.05]], 48);
  }
}
function postLayout(style, n) {
  const out = [];
  const big = n >= 12 ? 1.3 : 1;
  if (style === 'inline' || style === 'reverse' || style === 'pointy') {
    const s = style === 'reverse' ? -1 : 1;
    for (let k = 0; k < n; k++) {
      const t = n > 1 ? k / (n - 1) : 0;
      const y = 0.045 + t * 0.135;
      const x = style === 'pointy' ? 0.006 + t * 0.03 : s * 0.014;
      out.push({ x, y, side: s, bx: style === 'pointy' ? x + 0.03 : s * 0.056 });
    }
    return out;
  }
  const per = Math.ceil(n / 2);
  for (const s of [-1, 1]) for (let k = 0; k < per; k++) {
    const y = 0.05 + (per > 1 ? k / (per - 1) : 0) * (0.11 * big);
    out.push({ x: s * (style === 'slotted' ? 0.012 : 0.024), y, side: s, bx: s * (style === 'slotted' ? 0.042 : 0.06) });
  }
  return out;
}

/* ------------------------------ guitar builder ------------------------------ */

function buildGuitar(V, T) {
  const inst = group('instrument');
  const isElec = V.kind === 'electric' || V.kind === 'bass';
  const metalHW = hwMat(T);
  const n = V.n;
  const sc = V.sc;
  const head = V.lockHead && !T.kids ? V.head : T.head ?? V.head;
  const pgStyle = T.trim ? TRIMS[T.trim].pg : V.pg;
  let D = V.D;
  let pts, yj, halfW;
  const anims = [];

  // ---- body materials
  const burstOn = T.burst || T.trim === 'vintage';
  const topColor = T.trim ? T.p : V.p;
  const vc = burstOn ? fin(T, '#fff', 'vc') : null;
  const topM = vc ?? (T.trim === 'gold' ? fin(T, '#d6a93c', 'gold') : V.metalBody && !T.trim ? M.metal('#c9ccd2', 0.18) : fin(T, topColor, !T.trim && !isElec && V.kind !== 'semi' ? 'satin' : undefined));
  const sideM = V.metalBody && !T.trim ? M.metal('#c9ccd2', 0.18) : T.trim === 'gold' ? fin(T, '#2a1a10', 'gloss') : T.trim === 'black' || T.trim === 'white' || T.neon || T.kids ? fin(T, T.trim === 'neon' ? T.s : T.p) : T.trim ? woodMat(T) : isElec || V.kind === 'semi' ? fin(T, V.p) : M.wood(V.side);
  const burstCols = T.trim === 'vintage' ? { inner: '#d29a45', outer: '#3a1a08' } : { inner: T.p, outer: T.edge ?? '#1b0d06' };

  let shY = 0, shR = 0;
  let bodyTopZ;
  if (V.kind === 'banjo') {
    const R = V.R * (T.round ? 1.04 : 1);
    D = V.D;
    yj = 2 * R;
    halfW = R;
    pts = circlePts(0, R, R, 48);
    // rim + resonator + drum head (white membrane)
    const rimM = T.trim ? woodMat(T, V.side) : M.wood(V.side);
    mesh(lathe([[R * 0.96, -D / 2], [R, -D / 2], [R, D / 2 - 0.008], [R * 0.96, D / 2 - 0.008]], 48).rotateX(Math.PI / 2), metalHW, { parent: inst, at: [0, R, 0], name: 'flange' }).material.side = THREE.DoubleSide;
    mesh(lathe([[0, -D / 2 - 0.012], [R * 0.9, -D / 2 - 0.012], [R * 1.03, -D / 2 + 0.01], [R * 1.03, -D / 2 + 0.03], [R * 0.95, -D / 2 + 0.03], [R * 0.93, -D / 2]], 48).rotateX(Math.PI / 2), T.burst ? fin(T, T.edge) : rimM, { parent: inst, at: [0, R, 0], name: 'resonator' });
    const headMat = T.kids ? fin(T, T.s, 'plastic') : T.neon ? fin(T, T.s, 'neon') : T.trim === 'black' ? M.matte('#18181a', 0.6) : M.matte(T.wear ? '#ddd2b4' : '#f2eee4', 0.55);
    mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.93, 0.003, 48).rotateX(Math.PI / 2), headMat, { parent: inst, at: [0, R, D / 2 - 0.006], name: 'drumhead' });
    mesh(new THREE.TorusGeometry(R * 0.95, 0.006, 8, 48), metalHW, { parent: inst, at: [0, R, D / 2 - 0.005], name: 'tension_hoop' });
    const hooks = [];
    const nh = T.kids ? 12 : T.ornate ? 30 : 22;
    for (let i = 0; i < nh; i++) { const a = (i / nh) * Math.PI * 2; hooks.push(segGeo([Math.cos(a) * R * 0.97, R + Math.sin(a) * R * 0.97, D / 2 - 0.004], [Math.cos(a) * R * 1.005, R + Math.sin(a) * R * 1.005, -D / 2 + 0.01], 0.0018, 5)); }
    merged(hooks, metalHW, { parent: inst, name: 'hooks' });
    bodyTopZ = D / 2 - 0.004;
  } else if (V.kind === 'mandolin') {
    const { L, lw } = V;
    yj = L;
    let half;
    if (V.style === 'f' && !T.round) half = [[0, 0], [0.7 * lw, 0.04 * L], [lw, 0.3 * L], [0.95 * lw, 0.55 * L], [0.75 * lw, 0.75 * L], [1.05 * lw, 0.97 * L], [0.6 * lw, 0.9 * L], [0.25 * lw, 1.0 * L], [0, L]];
    else half = [[0, 0], [0.7 * lw, 0.05 * L], [lw, 0.35 * L], [0.85 * lw, 0.68 * L], [0.45 * lw, 0.93 * L], [0, L]];
    pts = blob(mirrorHalf(half), 72, !!T.sharp);
    if (V.style === 'f' && !T.round) { // scroll on one side only
      pts = pts.map(([x, y]) => (x < 0 && y > 0.7 * L ? [Math.max(x, -0.55 * lw * (1 - (y - 0.7 * L) / (0.3 * L)) - 0.25 * lw), y] : [x, y]));
    }
    halfW = lw;
    const fh = V.style === 'f';
    shY = 0.62 * L; shR = fh ? 0 : 0.032 * (lw / 0.125);
    const holes = fh ? [fHole(-0.05, 0.5 * L, 0.07, -1), fHole(0.05, 0.5 * L, 0.07, 1)] : [circlePts(0, shY, shR, 28)];
    const body = hollowBody(pts, D, { top: topM, sides: sideM, holes, arch: fh ? 0.008 : 0, parent: inst });
    if (vc) burst(body.children[1].geometry, { cx: 0, cy: L * 0.45, rx: lw, ry: L * 0.55, ...burstCols });
    bodyTopZ = D / 2;
  } else if (V.outline) {
    const E = electricOutline(V, T);
    pts = E.pts; yj = E.j;
    halfW = Math.max(...pts.map((p) => Math.abs(p[0])));
    if (V.kind === 'semi') {
      const fh = [fHole(-0.11, 0.22, 0.11, -1, 0.006), fHole(0.11, 0.22, 0.11, 1, 0.006)];
      const body = hollowBody(pts, D, { top: topM, sides: sideM, holes: fh, arch: V.carve, parent: inst });
      if (vc) burst(body.children[1].geometry, { cx: 0, cy: yj * 0.45, rx: halfW, ry: yj * 0.6, ...burstCols });
      bodyTopZ = D / 2 + V.carve * 0.6;
    } else {
      const g = plate(pts, D, { bevel: T.kids ? 0.01 : 0.006 });
      if (V.carve) archGeo(g, pts, V.carve);
      if (vc) burst(g, { cx: 0, cy: yj * 0.42, rx: halfW, ry: yj * 0.6, ...burstCols });
      mesh(g, topM, { parent: inst, name: 'body' });
      bodyTopZ = D / 2;
    }
  } else {
    pts = acousticOutline(V, T);
    yj = V.L;
    halfW = Math.max(...pts.map((p) => Math.abs(p[0])));
    shY = (V.wy + 0.15) * V.L; shR = (V.reso ? 0 : 0.05) * (V.lw / 0.2) * (V.nylon ? 0.9 : 1);
    if (V.n === 4) shY = (V.wy + 0.14) * V.L;
    const holes = V.archtop ? [fHole(-0.11, 0.25, 0.12, -1, 0.007), fHole(0.11, 0.25, 0.12, 1, 0.007)] : V.reso ? [] : [circlePts(T.sharp && !V.nylon ? -0.02 : 0, shY, shR, 32)];
    const body = hollowBody(pts, D, { top: topM, sides: sideM, holes, arch: V.archtop ? 0.012 : 0, parent: inst });
    if (vc) burst(body.children[1].geometry, { cx: 0, cy: V.L * 0.42, rx: halfW, ry: V.L * 0.58, ...burstCols });
    bodyTopZ = D / 2 + (V.archtop ? 0.008 : 0);
    if (shR) { // rosette
      const ros = mesh(new THREE.RingGeometry(shR * 1.08, shR * 1.3, 40), T.ornate ? pearl() : fin(T, T.trim ? T.a : '#3a2416', 'satin'), { parent: inst, at: [T.sharp && !V.nylon ? -0.02 : 0, shY, D / 2 + 0.0004], name: 'rosette' });
      void ros;
    }
    if (V.reso) { // resonator cover plate with sound wells
      const rc = mesh(lathe([[0, 0.006], [0.08, 0.004], [0.095, 0], [0.098, -0.002]], 40).rotateX(Math.PI / 2), T.trim ? hwMat(T) : M.chrome(), { parent: inst, at: [0, 0.2 * (V.L / 0.5), D / 2 + 0.002], name: 'cover' });
      void rc;
      for (const s of [-1, 1]) mesh(new THREE.CircleGeometry(0.022, 24), M.matte('#0b0b0b'), { parent: inst, at: [s * 0.075, V.L * 0.72, D / 2 + 0.0005] });
    }
  }
  if (!bodyTopZ) bodyTopZ = D / 2;

  // binding along the top edge
  if (T.ornate || T.round || T.trim === 'white' || (V.kind !== 'electric' && V.kind !== 'bass' && V.kind !== 'banjo' && !T.kids)) {
    const bm = T.ornate ? pearl() : M.matte(T.trim === 'black' ? '#f2efe6' : '#efe6cf', 0.4);
    mesh(plate(pts.map(([x, y]) => [x * 1.004, y + (y - yj / 2) * 0.004]), 0.004, { holes: [inset(pts, 0.004)], bevel: 0.0008 }), bm, { parent: inst, at: [0, 0, D / 2 - 0.0019], name: 'binding' });
  }

  // ---- neck geometry
  const kidsFrets = T.kids ? Math.min(V.F, 15) : V.F;
  const F = kidsFrets;
  const join = V.kind === 'banjo' ? 0 : V.join;
  const yb = V.kind === 'banjo' ? 0.085 : yj - sc * 2 ** (-join / 12);
  const yN = yb + sc;
  const zt = isElec ? D / 2 + 0.004 : V.kind === 'banjo' ? D / 2 - 0.004 : bodyTopZ;
  const fbT = 0.006;
  const nutW = V.neckW ?? (V.kind === 'bass' ? 0.042 : 0.043);
  const heelW = nutW + (V.kind === 'bass' ? 0.018 : V.n === 4 ? 0.01 : 0.013);
  let fbEnd = yb + sc * 2 ** (-(F + 0.6) / 12);
  if (V.kind === 'banjo') fbEnd = 2 * V.R - 0.03;
  if (shR) fbEnd = Math.max(fbEnd, shY + shR + 0.006);
  const wAt = (y) => heelW + (nutW - heelW) * ((y - fbEnd) / (yN - fbEnd));
  const fbM = T.trim === 'white' || T.trim === 'natural' ? M.wood('#d8b98a') : T.kids ? fin(T, T.s, 'plastic') : T.trim === 'relic' ? M.wood('#4a2c1c') : V.kind === 'electric' && !T.trim && V.outline === 'dc' ? M.wood('#d8b98a') : V.nylon || T.ornate ? ebony() : rosewood();
  mesh(plate([[-heelW / 2, fbEnd], [heelW / 2, fbEnd], [nutW / 2, yN], [-nutW / 2, yN]], fbT, { bevel: 0.0008 }), fbM, { parent: inst, at: [0, 0, zt + fbT / 2], name: 'fretboard' });
  const neckM = T.trim === 'black' || T.trim === 'white' || T.neon || T.kids ? fin(T, T.trim === 'neon' ? '#141418' : T.p) : T.trim === 'gold' ? M.wood('#3a2416') : M.wood(V.kind === 'electric' && V.outline !== 'sc' ? '#d6b282' : '#7a4524');
  const nStart = isElec ? yj - 0.07 : yj - 0.01;
  const nLen = yN + 0.004 - nStart;
  const nd = V.kind === 'bass' ? 0.024 : 0.021;
  const neckGeo = new THREE.CylinderGeometry(nutW / 2, wAt(nStart) / 2, nLen, 20, 1, false, Math.PI / 2, Math.PI);
  neckGeo.scale(1, 1, nd / (nutW / 2));
  mesh(neckGeo, neckM, { parent: inst, at: [0, nStart + nLen / 2, zt], name: 'neck' });
  if (!isElec) mesh(roundedBox(heelW * 0.95, 0.05, Math.max(0.02, zt - (-D / 2 + 0.01)), 0.01), neckM, { parent: inst, at: [0, yj + 0.02, (zt + (-D / 2 + 0.01)) / 2], name: 'heel' });
  if (V.kind === 'banjo') bar([0, V.R * 1.9, -D / 2 + 0.02], [0, 0.01, -D / 2 + 0.02], 0.007, M.wood(V.side), inst, 'dowel');
  // frets + inlays
  if (!V.fretless) {
    const fr = [];
    for (let f = 1; f <= F; f++) { const y = yb + sc * 2 ** (-f / 12); if (y < fbEnd) break; fr.push(new THREE.CylinderGeometry(0.0011, 0.0011, wAt(y), 6).rotateZ(Math.PI / 2).translate(0, y, zt + fbT)); }
    merged(fr, T.trim === 'gold' ? hwMat(T) : M.metal('#d8d6d0', 0.2), { parent: inst, name: 'frets' });
  } else {
    const ln = [];
    for (let f = 1; f <= F; f++) { const y = yb + sc * 2 ** (-f / 12); if (y < fbEnd) break; ln.push(new THREE.BoxGeometry(wAt(y), 0.0008, 0.0004).translate(0, y, zt + fbT + 0.0001)); }
    merged(ln, M.matte('#e8dfc8', 0.5), { parent: inst, name: 'fretlines' });
  }
  const inl = [];
  for (const f of [3, 5, 7, 9, 12, 15, 17, 19, 21]) {
    if (f > F) break;
    const y = yb + sc * (2 ** (-(f - 1) / 12) + 2 ** (-f / 12)) / 2;
    if (y < fbEnd) break;
    const dbl = f === 12;
    if (T.ornate || T.trim === 'sunburst') inl.push(roundedBox(wAt(y) * 0.6, (sc * 2 ** (-f / 12)) * 0.03, 0.0008, 0.0003, 1).translate(0, y, zt + fbT + 0.0002));
    else for (const dx of dbl ? [-0.008, 0.008] : [0]) inl.push(new THREE.CylinderGeometry(0.0028, 0.0028, 0.0008, 12).rotateX(Math.PI / 2).translate(dx, y, zt + fbT + 0.0002));
  }
  if (inl.length) merged(inl, pearl(), { parent: inst, name: 'inlays' });
  // nut
  mesh(roundedBox(nutW, 0.005, 0.0065, 0.0012), T.kids ? fin(T, T.a, 'plastic') : boneMat(), { parent: inst, at: [0, yN + 0.0025, zt + fbT - 0.0005], name: 'nut' });

  // ---- strings plan
  const zn = zt + fbT + 0.0027;
  const zb = isElec ? zt + fbT + 0.006 : V.kind === 'banjo' ? zt + 0.018 : bodyTopZ + 0.013;
  const spB = V.kind === 'bass' ? 0.019 : n >= 8 ? 0.012 : V.n === 4 ? 0.011 : V.kind === 'banjo' ? 0.011 : 0.0105;
  const courses = n === 12 ? 6 : n === 8 ? 4 : n;
  const pair = n === 12 || n === 8;
  const xs = (k, spread) => (courses > 1 ? -spread / 2 + (k * spread) / (courses - 1) : 0);
  const nutSpread = nutW - 0.008;
  const bSpread = spB * (courses - 1);
  const strs = [];
  for (let k = 0; k < courses; k++) for (const pp of pair ? [-1, 1] : [0]) strs.push({ xb: xs(k, bSpread) + pp * 0.0016, xn: xs(k, nutSpread) + pp * 0.0012, k, r: V.kind === 'bass' ? 0.0013 - k * 0.0001 : V.nylon ? 0.0007 - k * 0.00004 : (0.00058 - k * 0.00006) * (pp > 0 ? 0.6 : 1) });

  // ---- bridge
  const bm = T.kids ? fin(T, T.a, 'plastic') : V.nylon || !isElec ? ebony() : metalHW;
  if (V.kind === 'banjo' || V.archtop || V.kind === 'mandolin') {
    // floating bridge + tailpiece
    const by = V.kind === 'banjo' ? yb : yb;
    mesh(roundedBox(bSpread + 0.02, 0.006, zb - bodyTopZ, 0.0015), M.wood('#d8b98a'), { parent: inst, at: [0, by, (zb + bodyTopZ) / 2 - 0.0005], name: 'bridge' });
    mesh(roundedBox(bSpread + 0.012, by * 0.6, 0.003, 0.001), T.trim ? metalHW : M.metal('#c4c0b4', 0.3), { parent: inst, at: [0, by * 0.45, bodyTopZ + 0.006], rot: [0.08, 0, 0], name: 'tailpiece' });
    tube([0, 0.0, 0], [0, by * 0.2, bodyTopZ + 0.006], 0.003, metalHW, { parent: inst, name: 'tail_hinge' });
  } else if (!isElec && V.kind !== 'semi') {
    const bw = Math.min(0.17, Math.max(0.06, bSpread + 0.06)) * (V.nylon ? 1.1 : 1);
    const bridgeShape = T.sharp ? [[-bw / 2, -0.014], [bw / 2, -0.014], [bw / 2 - 0.006, 0.014], [-bw / 2 + 0.006, 0.014]] : blob([[-bw / 2, -0.012], [0, -0.016], [bw / 2, -0.012], [bw / 2 + 0.004, 0.0], [bw / 2, 0.012], [0, 0.015], [-bw / 2, 0.012], [-bw / 2 - 0.004, 0]], 32);
    mesh(plate(bridgeShape, 0.009, { bevel: 0.002 }), bm, { parent: inst, at: [0, yb - 0.006, D / 2 + 0.0045], name: 'bridge' });
    mesh(roundedBox(bSpread + 0.012, 0.003, zb - D / 2 - 0.007, 0.001), boneMat(), { parent: inst, at: [0, yb, (zb + D / 2 + 0.008) / 2 - 0.0005], name: 'saddle' });
    if (!V.nylon) { const pins = []; for (const s of strs) pins.push(new THREE.CylinderGeometry(0.0022, 0.002, 0.004, 8).rotateX(Math.PI / 2).translate(s.xb, yb - 0.012, D / 2 + 0.011)); merged(pins, T.ornate ? pearl() : M.matte(T.trim === 'black' ? '#111' : '#efe8d6', 0.4), { parent: inst, name: 'pins' }); }
    else mesh(roundedBox(bSpread + 0.02, 0.008, 0.004, 0.0015), boneMat(), { parent: inst, at: [0, yb - 0.012, D / 2 + 0.01], name: 'tieblock' });
  } else if (V.bridge === 'trem' || V.bridge === 'bass') {
    const bw = bSpread + 0.026;
    mesh(roundedBox(bw, 0.05, 0.004, 0.0015), metalHW, { parent: inst, at: [0, yb - 0.012, zt - 0.002], name: 'bridgeplate' });
    const sad = [];
    for (const s of strs) sad.push(roundedBox(Math.min(0.009, spB * 0.85), 0.018, zb - zt + 0.0005, 0.001, 1).translate(s.xb, yb - 0.004, (zb + zt) / 2 - 0.0003));
    merged(sad, metalHW, { parent: inst, name: 'saddles' });
    if (V.bridge === 'trem') curveTube([[bw / 2 - 0.004, yb - 0.03, zt + 0.0], [bw / 2 + 0.01, yb - 0.04, zt + 0.012], [bw / 2 + 0.06, yb - 0.09, zt + 0.02], [bw / 2 + 0.09, yb - 0.1, zt + 0.02]], 0.0025, metalHW, { parent: inst, name: 'whammy', segments: 16, radialSegments: 6 });
  } else { // tune-o-matic + stop tail
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.004, 0.004, zb - D / 2, 10).rotateX(Math.PI / 2), metalHW, { parent: inst, at: [s * (bSpread / 2 + 0.01), yb, (zb + D / 2) / 2 + V.carve * 0.5] });
    mesh(roundedBox(bSpread + 0.026, 0.009, 0.007, 0.002), metalHW, { parent: inst, at: [0, yb, zb - 0.0032], name: 'bridge' });
    mesh(roundedBox(bSpread + 0.034, 0.012, 0.012, 0.005), metalHW, { parent: inst, at: [0, yb - 0.04, D / 2 + (V.carve ?? 0) * 0.9 + 0.005], name: 'stoptail' });
  }

  // ---- pickups, knobs, pickguard (electric / semi)
  if (V.pickups) {
    const pk = T.kids ? V.pickups.slice(0, 1) : T.sharp === 2 && V.pickups.length < 3 ? ['h'] : T.round && V.pickups[0] === 'h' ? V.pickups.map(() => 'w') : V.pickups;
    const topZ = bodyTopZ;
    const lo = yb + 0.03, hi = fbEnd - 0.022;
    const pM = (i) => (T.trim === 'gold' ? hwMat(T) : T.trim === 'white' || T.round ? M.matte('#efe6cf', 0.45) : T.neon ? fin(T, T.a, 'neon') : i % 2 && T.trim === 'black' ? M.chrome() : M.plastic('#141414', 0.35));
    pk.forEach((k, i) => {
      const y = pk.length === 1 ? (k === 'p' ? (lo + hi) / 2 + 0.02 : hi - 0.01) : lo + (i / (pk.length - 1)) * (hi - lo);
      const w = V.kind === 'bass' ? bSpread + 0.03 : 0.072;
      const dims = k === 'h' ? [w, 0.04] : k === 'w' ? [w, 0.034] : k === 'p' ? [w * 0.5, 0.02] : k === 'j' ? [w * 1.05, 0.02] : [w, 0.019];
      if (k === 'p') for (const s of [-1, 1]) mesh(roundedBox(dims[0], dims[1], 0.012, 0.005), pM(i), { parent: inst, at: [s * dims[0] * 0.5, y + s * 0.012, topZ + 0.003], name: `pickup_${i}${s > 0 ? 'b' : 'a'}` });
      else mesh(roundedBox(dims[0], dims[1], 0.012, k === 'h' ? 0.003 : 0.008), pM(i), { parent: inst, at: [0, y, topZ + 0.003], name: `pickup_${i}` });
      if (k === 'h' && (V.outline === 'sc' || V.kind === 'semi')) mesh(plate(blob([[-w / 2 - 0.006, -0.026], [w / 2 + 0.006, -0.026], [w / 2 + 0.006, 0.026], [-w / 2 - 0.006, 0.026]], 4, true), 0.003, { holes: [[[-w / 2, -0.02], [-w / 2, 0.02], [w / 2, 0.02], [w / 2, -0.02]].reverse()], bevel: 0.0008 }), M.plastic('#e8e1cc', 0.4), { parent: inst, at: [0, y, topZ + 0.0012] });
      // pole pieces
      const poles = [];
      for (const s of strs) if (!pair) poles.push(new THREE.CylinderGeometry(0.0018, 0.0018, 0.002, 8).rotateX(Math.PI / 2).translate(s.xb * (1 - (y - yb) / sc * 0.3), y, topZ + 0.0095));
      if (poles.length && k !== 'j' && k !== 'p') merged(poles, M.metal('#bfbfbf', 0.3), { parent: inst, name: `poles_${i}` });
    });
    const nk = T.kids ? 1 : V.knobs ?? 2;
    const kg = [];
    for (let i = 0; i < nk; i++) {
      const kx = -halfW * (0.48 + 0.12 * (i % 2)) * (V.outline === 'offset' ? 1.05 : 1);
      const ky = yj * (0.12 + 0.11 * Math.floor(i / 2) + 0.05 * (i % 2));
      kg.push(knobGeo(T.kids ? 0.014 : 0.009, 0.014).translate(kx, ky, topZ - 0.002));
    }
    merged(kg, T.trim === 'gold' || T.trim === 'black' ? hwMat(T) : T.trim === 'white' || T.round ? M.plastic('#efe6cf', 0.4) : T.neon ? fin(T, T.s, 'neon') : M.plastic('#161616', 0.35), { parent: inst, name: 'knobs' });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 14).rotateZ(Math.PI / 2), metalHW, { parent: inst, at: [halfW * 0.6, yj * 0.08, 0], name: 'jack' }).position.x = 0;
  }
  if (V.pickups && pgStyle !== 'none') {
    const fx = halfW, fy = yj;
    const PG = {
      large: [[0.5, 0.16], [0.72, 0.3], [0.62, 0.62], [0.55, 0.85], [0.3, 0.98], [-0.25, 0.98], [-0.32, 0.72], [-0.45, 0.6], [-0.42, 0.34], [-0.2, 0.2], [0.15, 0.12]],
      tear: [[-0.15, 0.55], [-0.35, 0.62], [-0.55, 0.78], [-0.42, 0.95], [-0.2, 0.97], [-0.12, 0.8]],
      small: [[-0.15, 0.52], [-0.42, 0.6], [-0.55, 0.85], [-0.38, 0.99], [-0.18, 0.98], [-0.12, 0.75]],
      mirror: [[0.5, 0.16], [0.72, 0.3], [0.62, 0.62], [0.55, 0.85], [0.3, 0.98], [-0.25, 0.98], [-0.32, 0.72], [-0.45, 0.6], [-0.42, 0.34], [-0.2, 0.2], [0.15, 0.12]],
      clear: [[-0.15, 0.55], [-0.35, 0.62], [-0.55, 0.78], [-0.42, 0.95], [-0.2, 0.97], [-0.12, 0.8]],
    }[pgStyle] ?? null;
    if (PG) {
      const pgPts = blob(PG.map(([x, y]) => [x * fx, y * fy]), 48, !!T.sharp);
      const pgM = pgStyle === 'mirror' ? M.chrome() : T.trim === 'white' ? fin(T, T.s, 'gloss') : T.neon ? fin(T, T.s, 'neon') : T.trim === 'sunburst' || T.trim === 'black' ? M.plastic('#0d0d0d', 0.25) : T.round || T.wear ? M.plastic('#5a2a14', 0.3) : T.trim === 'gold' ? M.plastic('#1b1b1d', 0.2) : M.plastic('#f4f1e8', 0.3);
      mesh(plate(pgPts, 0.0024, { bevel: 0.0006 }), pgM, { parent: inst, at: [0, 0, bodyTopZ + 0.0011], name: 'pickguard' });
    }
  } else if (!V.pickups && pgStyle !== 'none' && shR && !V.archtop) {
    // acoustic tear-drop / large guard hugging the soundhole
    const big = pgStyle === 'large' ? 1.35 : pgStyle === 'small' ? 0.75 : 1;
    const cx = T.sharp && !V.nylon ? -0.02 : 0;
    const P = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI * (1.05 + i * 0.045); P.push([cx + Math.cos(a) * shR * 1.36, shY + Math.sin(a) * shR * 1.36]); }
    for (let i = 12; i >= 0; i--) { const a = Math.PI * (1.05 + i * 0.045); P.push([cx + Math.cos(a) * shR * (1.36 + 1.0 * big), shY + Math.sin(a) * shR * (1.36 + 0.75 * big) - 0.01 * big]); }
    const pgM = pgStyle === 'clear' ? new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.25, roughness: 0.05 }) : pgStyle === 'mirror' ? M.chrome() : T.trim === 'white' ? fin(T, T.s) : T.neon ? fin(T, T.s, 'neon') : M.plastic(T.trim === 'gold' || T.trim === 'black' || T.trim === 'sunburst' ? '#0d0d0d' : '#4a2212', 0.3);
    mesh(plate(blob(P, 40), 0.0016, { bevel: 0.0004 }), pgM, { parent: inst, at: [0, 0, D / 2 + 0.0009], name: 'pickguard' });
  } else if (V.archtop && pgStyle !== 'none') {
    mesh(plate(blob([[-0.03, 0.2], [-0.13, 0.22], [-0.16, 0.34], [-0.12, 0.47], [-0.04, 0.5], [-0.03, 0.35]], 40), 0.0025, { bevel: 0.0006 }), M.plastic('#3a1a0c', 0.25), { parent: inst, at: [0, 0, bodyTopZ + 0.015], name: 'pickguard' });
    mesh(roundedBox(0.008, 0.02, 0.018, 0.002), metalHW, { parent: inst, at: [-0.035, 0.48, bodyTopZ + 0.006], name: 'pg_bracket' });
  }

  // relic wear: chips exposing wood on the top
  if (T.wear && (isElec || V.kind === 'acoustic')) {
    const chips = [];
    for (let i = 0; i < 5; i++) {
      const r = T.r;
      const a = r.range(0, Math.PI * 2);
      const cx = Math.cos(a) * halfW * 0.72, cy = yj * 0.42 + Math.sin(a) * yj * 0.33;
      const ch = [];
      for (let k = 0; k < 7; k++) { const t = (k / 7) * Math.PI * 2; const rr = r.range(0.008, 0.02); ch.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * 0.7]); }
      if (shR && Math.hypot(cx, cy - shY) < shR + 0.03) continue;
      chips.push(new THREE.ShapeGeometry(new THREE.Shape(ch.map(([x, y]) => new THREE.Vector2(x, y)))).translate(0, 0, bodyTopZ + 0.0004));
    }
    if (chips.length) merged(chips, M.wood('#c9a26c'), { parent: inst, name: 'chips' });
  }

  // ---- headstock
  const tilt = head === 'inline' || head === 'reverse' || head === 'pointy' ? 0 : -0.24;
  const hT = 0.014;
  const H = group('headstock', { parent: inst, at: [0, yN + 0.004, zt + (tilt ? fbT - 0.002 : -0.001)], rot: [tilt, 0, 0] });
  const hOut = headOutline(head, nutW, n);
  const slotHoles = head === 'slotted' ? [[-0.017, -0.006], [0.006, 0.017]].map(([a, b]) => [[a, 0.04], [b, 0.04], [b, 0.165], [a, 0.165]].reverse()) : [];
  const headM = T.trim === 'gold' ? fin(T, '#141414', 'gloss') : T.kids || T.neon ? fin(T, T.neon ? T.p : T.s) : T.trim === 'black' || T.trim === 'white' ? fin(T, T.p) : isElec && V.outline !== 'sc' && !T.trim ? M.wood('#d6b282') : fin(T, T.trim ? T.p : '#1a120c', T.trim === 'relic' ? 'worn' : 'gloss');
  mesh(plate(hOut, hT, { holes: slotHoles, bevel: 0.002 }), headM, { parent: H, at: [0, 0, -hT / 2 + 0.002], name: 'head_plate' });
  if (T.ornate) { // pearl crown / fleur inlay
    mesh(plate(blob([[0, 0.12], [0.012, 0.135], [0.008, 0.155], [0, 0.148], [-0.008, 0.155], [-0.012, 0.135]], 24), 0.0008, { bevel: 0 }), pearl(), { parent: H, at: [0, 0, 0.0023], name: 'crown' });
  }
  const posts = postLayout(head, n === 12 ? 12 : n === 8 ? 8 : n);
  const str5 = V.kind === 'banjo';
  const usedPosts = str5 ? posts.slice(0, 4) : posts;
  // assign strings to posts (outermost string → nearest post on its side)
  const order = strs.map((s, i) => ({ s, i }));
  const sideOf = (s) => (head === 'inline' || head === 'pointy' ? 1 : head === 'reverse' ? -1 : Math.sign(s.xn || 1e-6));
  const assign = new Map();
  for (const side of [-1, 1]) {
    const ss = order.filter(({ s }) => sideOf(s) === side && !(str5 && s.k === 0)).sort((a, b) => (side > 0 ? b.s.xn - a.s.xn : a.s.xn - b.s.xn));
    const pp = usedPosts.filter((p) => p.side === side).sort((a, b) => a.y - b.y);
    ss.forEach(({ i }, k) => { if (pp[k]) assign.set(i, pp[k]); });
  }
  // posts + tuners
  const post = [], tun = [], btn = [];
  const btnM = T.kids ? fin(T, T.a, 'plastic') : V.nylon || T.round ? pearl() : metalHW;
  for (const p of usedPosts) {
    if (head === 'slotted') {
      post.push(new THREE.CylinderGeometry(0.0035, 0.0035, 0.03, 10).rotateZ(Math.PI / 2).translate(p.side * 0.0115, p.y, -0.005));
      tun.push(new THREE.CylinderGeometry(0.0015, 0.0015, Math.abs(p.bx) - 0.02, 6).rotateZ(Math.PI / 2).translate(p.side * (Math.abs(p.bx) / 2 + 0.01), p.y, -0.005));
    } else {
      post.push(new THREE.CylinderGeometry(0.0032, 0.004, 0.014, 10).rotateX(Math.PI / 2).translate(p.x, p.y, 0.008));
      tun.push(roundedBox(0.012, 0.016, 0.009, 0.002, 1).translate(p.x, p.y, -hT + 0.0025));
      tun.push(new THREE.CylinderGeometry(0.0016, 0.0016, Math.abs(p.bx - p.x), 6).rotateZ(Math.PI / 2).translate((p.x + p.bx) / 2, p.y, -hT + 0.003));
    }
    btn.push(new THREE.SphereGeometry(T.kids ? 0.009 : 0.0065, 12, 8).scale(0.5, 1, 1.25).translate(p.bx, p.y, head === 'slotted' ? -0.005 : -hT + 0.003));
  }
  merged(post, head === 'slotted' ? M.plastic('#efe8d6', 0.3) : metalHW, { parent: H, name: 'posts' });
  merged(tun, metalHW, { parent: H, name: 'tuners' });
  merged(btn, btnM, { parent: H, name: 'buttons' });

  // ---- strings
  inst.updateMatrixWorld(true);
  const sMat = V.nylon ? M.matte('#f3eee0', 0.35) : V.kind === 'bass' ? M.metal('#b9b4a6', 0.35) : M.metal(T.trim === 'gold' ? '#e2c27a' : '#d9d9d9', 0.2);
  const headSegs = [];
  const toInst = (v) => H.localToWorld(v).applyMatrix4(new THREE.Matrix4().copy(inst.matrixWorld).invert());
  strs.forEach((s, i) => {
    if (str5 && s.k === 0) { // banjo 5th string: from bridge to a peg at the 5th fret
      const y5 = yb + sc * 2 ** (-5 / 12);
      const st = tube([s.xb, yb, zb], [-wAt(y5) / 2 + 0.002, y5, zt + fbT + 0.0025], s.r, sMat, { parent: inst, name: `string_${i}`, radialSegments: 5 });
      void st;
      mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.03, 8).rotateZ(Math.PI / 2), metalHW, { parent: inst, at: [-wAt(y5) / 2 - 0.006, y5, zt - 0.006], name: 'peg5' });
      mesh(new THREE.SphereGeometry(0.0065, 12, 8).scale(0.6, 1, 1.2), btnM, { parent: inst, at: [-wAt(y5) / 2 - 0.022, y5, zt - 0.006] });
      return;
    }
    tube([s.xb, yb, zb], [s.xn, yN + 0.0025, zn], s.r * (T.kids ? 1.4 : 1), sMat, { parent: inst, name: `string_${i}`, radialSegments: 5 });
    const p = assign.get(i);
    if (p) {
      const end = head === 'slotted' ? toInst(new THREE.Vector3(p.side * 0.0115, p.y, -0.005 + 0.0035)) : toInst(new THREE.Vector3(p.x, p.y, 0.011));
      headSegs.push(segGeo([s.xn, yN + 0.0025, zn], end.toArray(), s.r, 4));
    }
    // behind-bridge segment to the pins / tail
    if (!isElec && !V.archtop && V.kind !== 'banjo' && V.kind !== 'mandolin' && V.kind !== 'semi') headSegs.push(segGeo([s.xb, yb, zb], [s.xb, yb - 0.012, D / 2 + 0.011], s.r, 4));
  });
  if (headSegs.length) merged(headSegs, sMat, { parent: inst, name: 'string_ends' });

  const info = { neckPoint: new THREE.Vector3(0, yN - sc * 0.3, zt - nd), neckW: wAt(yN - sc * 0.3), D, strings: strs.length };
  return { inst, info, anims };
}

/** Lean an instrument on a tubular stand: cradle under the body + yoke round the neck. */
function standUp(root, inst, info, T, { tilt = 0.2, cradle = 0.1, endpin = false, scale = 1 } = {}) {
  if (!T.onStand) { // pure model: lies on its back on the ground, strings up (no stand)
    root.add(inst);
    inst.scale.setScalar(scale);
    inst.rotation.x = -Math.PI / 2;
    inst.updateMatrixWorld(true);
    inst.position.y -= lowestPoint(inst).y;
    return;
  }
  root.add(inst);
  inst.scale.setScalar(scale);
  inst.rotation.x = -tilt;
  inst.updateMatrixWorld(true);
  let low = lowestPoint(inst);
  inst.position.y += (endpin ? 0 : cradle) - low.y;
  inst.updateMatrixWorld(true);
  low = lowestPoint(inst);
  const sm = T.trim === 'gold' ? hwMat(T) : T.kids ? fin(T, T.s, 'plastic') : T.trim === 'white' ? fin(T, '#e8e6e0', 'gloss') : new THREE.MeshStandardMaterial({ name: 'stand', color: '#1b1c1f', metalness: 0.7, roughness: 0.4 });
  const pad = M.rubber();
  const np = inst.localToWorld(info.neckPoint.clone());
  const r = 0.008 * Math.max(1, scale);
  const zp = np.z - r - 0.004;
  const hw = info.neckW / 2 * scale + r + 0.002;
  // yoke (padded U round the back of the neck)
  curveTube([[-hw, np.y + 0.035, np.z + 0.012], [-hw, np.y, np.z - r * 0.4], [0, np.y - 0.004, np.z - r - 0.002], [hw, np.y, np.z - r * 0.4], [hw, np.y + 0.035, np.z + 0.012]], r, pad, { parent: root, name: 'yoke', segments: 24, radialSegments: 8 });
  bar([0, 0.06, zp], [0, np.y - 0.004, zp], 0.0095, sm, root, 'stand_post');
  // tripod legs
  const ls = Math.min(1.4, Math.max(0.45, np.y / 0.8));
  const legs = [[0.2 * ls, 0.0, zp + 0.12 * ls], [-0.2 * ls, 0.0, zp + 0.12 * ls], [0, 0.0, zp - 0.24 * ls]];
  for (const l of legs) { bar([0, 0.08, zp], l, 0.008, sm, root, 'leg'); mesh(new THREE.SphereGeometry(0.014, 10, 8), pad, { parent: root, at: [l[0], 0.011, l[2]] }); }
  if (!endpin) {
    const cz = low.z, cy = low.y - r;
    const cw = Math.max(0.1, info.D * 1.2) * scale + 0.06;
    for (const s of [-1, 1]) {
      bar([0, Math.min(0.1, cy - 0.02), zp], [s * cw / 2, cy, cz], 0.007, sm, root, 'arm');
      curveTube([[s * cw / 2, cy, cz], [s * cw / 2, cy, cz + info.D * scale * 1.1 + 0.03], [s * cw / 2, cy + 0.05, cz + info.D * scale * 1.15 + 0.04]], r, pad, { parent: root, name: 'cradle_lip', segments: 12, radialSegments: 8 });
    }
    bar([-cw / 2, cy, cz], [cw / 2, cy, cz], r, pad, root, 'cradle');
  } else {
    mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.008, 20), pad, { parent: root, at: [low.x, 0.004, low.z], name: 'endpin_stop' });
  }
}

function strumAnim(inst, count) {
  const tracks = [];
  for (let i = 0; i < count; i++) {
    const s = inst.getObjectByName(`string_${i}`);
    if (!s) continue;
    const ph = i * 0.13;
    tracks.push(scaleTrack(s, 1.2, (t) => { const a = 1 + 2.6 * Math.max(0, 1 - ((t + ph) % 1) * 1.6) * Math.abs(Math.sin(t * Math.PI * 2 * 18)); return [a, 1, a]; }, 48));
  }
  return clip('strum', 1.2, tracks);
}

export function createGuitar(options = {}) {
  const { o, variant, T, V } = setup(options, GUITAR_VARIANTS, 'guitar');
  const root = group(`guitar-${variant}`);
  const { inst, info } = buildGuitar(V, T);
  standUp(root, inst, info, T, { tilt: 0.2, cradle: V.kind === 'banjo' ? 0.12 : 0.1, scale: T.scale });
  return done(root, 'guitar', variant, o, () => [strumAnim(inst, info.strings)]);
}

/* =============================== VIOLIN FAMILY =============================== */

export const BOWED_VARIANTS = {
  violin: { L: 0.356, k: 1, D: 0.032, arch: 0.014, n: 4, chin: true, p: '#a8521c' },
  viola: { L: 0.41, k: 1.15, D: 0.038, arch: 0.016, n: 4, chin: true, p: '#93441a' },
  cello: { L: 0.755, k: 2.12, D: 0.12, arch: 0.025, n: 4, endpin: true, p: '#8a3e18' },
  'double-bass': { L: 1.1, k: 3.1, D: 0.2, arch: 0.03, n: 4, endpin: true, sloped: true, p: '#6e3416' },
  'electric-violin': { L: 0.356, k: 1, D: 0.03, arch: 0, n: 5, electric: true, chin: true, p: '#1f4fb4' },
  'baroque-violin': { L: 0.356, k: 1, D: 0.032, arch: 0.016, n: 4, baroque: true, p: '#c27a2e' },
};

function violinHalf(V, T) {
  const corner = !T.round;
  const sl = V.sloped || T.trim === 'natural' ? 0.82 : 1;
  const h = [[0, 0], [0.06, 0.005], [0.095, 0.03], [0.1025, 0.07], [0.095, 0.11], [0.085, 0.13], ...(corner ? [[0.089, 0.142]] : []), [0.062, 0.148], [0.055, 0.178], [0.062, 0.205], ...(corner ? [[0.08 * sl, 0.215]] : []), [0.08 * sl, 0.228], [0.084 * sl, 0.27], [0.075 * sl, 0.32], [0.04 * sl, 0.35], [0, 0.356]];
  return h;
}

function buildBowed(V, T, variant) {
  const inst = group('instrument');
  const k = V.k;
  const L = V.L;
  const sx = (pts) => pts.map(([x, y]) => [x * k, y * k]);
  let pts = blob(mirrorHalf(sx(violinHalf(V, T))), 96, !!T.sharp);
  const D = V.D;
  const vM = T.trim ? (T.burst ? fin(T, '#fff', 'vc') : T.trim === 'gold' ? fin(T, '#7a3412', 'gloss') : T.kids ? fin(T, T.p, 'plastic') : T.trim === 'black' || T.trim === 'white' || T.neon ? fin(T, T.p) : fin(T, T.trim === 'vintage' ? '#6e2f10' : T.trim === 'natural' ? '#d7a866' : '#9a5a2a', T.trim === 'relic' ? 'worn' : 'nitro')) : new THREE.MeshPhysicalMaterial({ name: 'varnish', color: V.p, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 });
  const fy = 0.17 * k, fh = 0.07 * k;
  let topZ = D / 2 + V.arch;
  if (V.electric || T.neon) {
    // skeletal electric body: frame + centre block
    const frame = plate(pts, D, { holes: [inset(pts, 0.012 * k)], bevel: 0.003 });
    mesh(frame, vM, { parent: inst, name: 'frame' });
    mesh(roundedBox(0.06 * k, L * 0.92, D, 0.01), vM, { parent: inst, at: [0, L * 0.5, 0], name: 'centre' });
    topZ = D / 2;
  } else {
    const holes = T.sharp ? [] : [fHole(-0.045 * k, fy, fh, -1, 0.0045 * k), fHole(0.045 * k, fy, fh, 1, 0.0045 * k)];
    const body = hollowBody(pts, D, { top: vM, sides: vM, holes, arch: V.arch, wall: 0.003 * Math.sqrt(k), parent: inst });
    if (T.burst) for (const c of body.children) burst(c.geometry, { cx: 0, cy: L * 0.5, rx: 0.1 * k, ry: L * 0.55, inner: '#d68a33', outer: '#2a1006', start: 0.35 });
    if (T.sharp) for (const s of [-1, 1]) mesh(roundedBox(0.006 * k, 0.06 * k, 0.002, 0.001), M.matte('#0a0a0a'), { parent: inst, at: [s * 0.04 * k, fy, D / 2 + V.arch * 0.85], name: 'slit' });
    // purfling line (ornate gold / default dark)
    mesh(plate(inset(pts, 0.004 * k), 0.0012, { holes: [inset(pts, 0.0055 * k)], bevel: 0 }), T.ornate ? M.metal('#e6b54e', 0.2) : M.matte('#1a0f08', 0.5), { parent: inst, at: [0, 0, D / 2 + 0.0001], name: 'purfling' });
  }
  const hw = T.trim === 'gold' ? hwMat(T) : T.kids ? fin(T, T.a, 'plastic') : ebony();
  // neck + fingerboard (tilted so it clears the arch)
  const yBr = (V.electric ? 0.17 : 0.161) * k;
  const sc = (V.electric ? 0.328 : 0.328) * k;
  const yN = yBr + sc;
  const fbLen = (V.baroque ? 0.21 : 0.27) * k;
  const fbW0 = 0.024 * k, fbW1 = 0.042 * k;
  const zNut = D / 2 + 0.004 * k;
  const rise = Math.max(0.009, V.arch * 0.9) * (V.electric ? 0.6 : 1);
  const slope = (rise + 0.004) / fbLen;
  const fbG = plate([[-fbW1 / 2, -fbLen], [fbW1 / 2, -fbLen], [fbW0 / 2, 0], [-fbW0 / 2, 0]], 0.006 * k, { bevel: 0.001 });
  const NG = group('neck_g', { parent: inst, at: [0, yN, zNut], rot: [-Math.atan(slope), 0, 0] });
  mesh(fbG, hw, { parent: NG, at: [0, 0, 0.003 * k], name: 'fingerboard' });
  const neckLen = yN - L + 0.012 * k;
  const ng = new THREE.CylinderGeometry(0.0125 * k, 0.015 * k, neckLen, 16, 1, false, Math.PI / 2, Math.PI);
  ng.scale(1, 1, 1.2);
  const neckM = T.trim && !T.kids && !T.neon && T.trim !== 'black' && T.trim !== 'white' ? woodMat(T, '#a06a3a') : vM;
  mesh(ng, neckM, { parent: NG, at: [0, -neckLen / 2, 0], name: 'neck' });
  // heel block meeting the body edge
  mesh(roundedBox(0.026 * k, 0.03 * k, D * 0.55 + 0.01 * k, 0.005 * k), neckM, { parent: inst, at: [0, L + 0.006 * k, D / 2 - D * 0.25 + 0.002], name: 'neck_heel' });
  mesh(roundedBox(fbW0, 0.004 * k, 0.008 * k, 0.001), T.kids ? hw : ebony(), { parent: NG, at: [0, 0.002 * k, 0.004 * k], name: 'nut' });
  // pegbox + scroll (or lion head when ornate)
  const pb = group('pegbox', { parent: NG, at: [0, 0, 0], rot: [0.32, 0, 0] });
  mesh(roundedBox(0.022 * k, 0.075 * k, 0.022 * k, 0.005 * k), neckM, { parent: pb, at: [0, 0.035 * k, -0.006 * k], name: 'pegbox_body' });
  if (T.ornate) {
    mesh(new THREE.SphereGeometry(0.018 * k, 16, 12).scale(1, 1.15, 1), M.metal('#e6b54e', 0.25), { parent: pb, at: [0, 0.085 * k, -0.004 * k], name: 'lion_head' });
    mesh(new THREE.ConeGeometry(0.008 * k, 0.014 * k, 10).rotateX(Math.PI / 2), M.metal('#e6b54e', 0.25), { parent: pb, at: [0, 0.082 * k, 0.014 * k] });
  } else if (T.sharp) {
    mesh(roundedBox(0.026 * k, 0.04 * k, 0.026 * k, 0.003 * k), neckM, { parent: pb, at: [0, 0.088 * k, -0.006 * k], rot: [0, 0, 0.4], name: 'scroll' });
  } else {
    const sc2 = group('scroll', { parent: pb, at: [0, 0.088 * k, -0.006 * k] });
    for (const s of [-1, 1]) {
      const sp = [];
      for (let i = 0; i <= 30; i++) { const a = i * 0.32; const rr = 0.017 * k * (1 - i / 38); sp.push([s * 0.008 * k * (1 - i / 34), Math.sin(a) * rr, Math.cos(a) * rr]); }
      curveTube(sp, 0.0042 * k, neckM, { parent: sc2, segments: 40, radialSegments: 8 });
    }
    mesh(new THREE.CylinderGeometry(0.012 * k, 0.012 * k, 0.012 * k, 16).rotateZ(Math.PI / 2), neckM, { parent: sc2, name: 'scroll_core' });
  }
  const pegs = [];
  for (let i = 0; i < V.n; i++) {
    const y = (0.012 + i * (0.055 / Math.max(1, V.n - 1))) * k, s = i % 2 ? 1 : -1;
    pegs.push(new THREE.CylinderGeometry(0.003 * k, 0.0035 * k, 0.04 * k, 8).rotateZ(Math.PI / 2).translate(s * 0.018 * k, y, -0.006 * k));
    pegs.push(new THREE.SphereGeometry(0.008 * k, 10, 8).scale(0.35, 1, 1.15).translate(s * 0.04 * k, y, -0.006 * k));
  }
  merged(pegs, hw, { parent: pb, name: 'pegs' });
  // bridge
  const brH = (V.electric ? 0.018 : 0.033) * k;
  const archAt = V.electric || T.neon ? 0 : V.arch * 0.92;
  const brW = 0.041 * k;
  const brg = plate(blob([[-brW / 2, 0], [-brW / 2 + 0.004 * k, 0], [-0.006 * k, 0.008 * k], [0.006 * k, 0.008 * k], [brW / 2 - 0.004 * k, 0], [brW / 2, 0], [brW * 0.36, brH * 0.7], [brW * 0.38, brH], [0, brH * 1.04], [-brW * 0.38, brH], [-brW * 0.36, brH * 0.7]], 40, true), 0.0035 * k, { bevel: 0 });
  brg.rotateX(Math.PI / 2);
  mesh(brg, M.wood('#e2c393'), { parent: inst, at: [0, yBr, D / 2 + archAt - 0.002], name: 'bridge' });
  const zTop = D / 2 + archAt - 0.002 + brH;
  // tailpiece + saddle + end button
  const tl = 0.11 * k;
  const tp = group('tail_g', { parent: inst, at: [0, 0.004 * k, D / 2 + 0.002], rot: [-Math.atan((zTop - D / 2 - 0.012 * k) / (yBr * 1.2)) * 0.5, 0, 0] });
  mesh(plate(blob([[-0.008 * k, 0], [0.008 * k, 0], [0.02 * k, tl * 0.85], [0.016 * k, tl], [-0.016 * k, tl], [-0.02 * k, tl * 0.85]], 32), 0.006 * k, { bevel: 0.0015 }), T.trim === 'white' ? pearl() : hw, { parent: tp, at: [0, 0, 0.004 * k], name: 'tailpiece' });
  mesh(roundedBox(0.03 * k, 0.006 * k, 0.012 * k, 0.002), hw, { parent: inst, at: [0, 0.003 * k, D / 2 - 0.002], name: 'saddle' });
  inst.updateMatrixWorld(true);
  const tEnd = (x) => new THREE.Vector3(x, tl * 0.95, 0.008 * k).applyMatrix4(tp.matrix);
  // strings
  const sMat = M.metal(T.trim === 'gold' ? '#e2c27a' : '#cfcfcf', 0.25);
  const nN = T.wear ? V.n - 1 : V.n;
  const nutZ = new THREE.Vector3(0, 0, 0.0075 * k).applyMatrix4(NG.matrix);
  const ends = [];
  for (let i = 0; i < nN; i++) {
    const t = V.n > 1 ? i / (V.n - 1) - 0.5 : 0;
    const xb = t * 0.034 * k, xn = t * 0.016 * k, xt = t * 0.024 * k;
    const zb = zTop - Math.abs(t) * 0.006 * k;
    tube([xb, yBr, zb], [xn, nutZ.y, nutZ.z], 0.0005 * Math.sqrt(k), sMat, { parent: inst, name: `string_${i}`, radialSegments: 5 });
    ends.push(segGeo([xb, yBr, zb], tEnd(xt).toArray(), 0.0005 * Math.sqrt(k), 4));
  }
  merged(ends, sMat, { parent: inst, name: 'string_tails' });
  if (V.chin && !T.sharp) mesh(new THREE.SphereGeometry(0.04 * k, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 0.75, 0.32), hw, { parent: inst, at: [-0.045 * k, 0.03 * k, D / 2 + 0.002], name: 'chinrest' });
  if (V.endpin) {
    mesh(new THREE.CylinderGeometry(0.012 * k * 0.5, 0.016 * k * 0.5, 0.03 * k, 12), hw, { parent: inst, at: [0, -0.012 * k, 0], name: 'endpin_collar' });
    mesh(new THREE.CylinderGeometry(0.003 * k, 0.002 * k, 0.12 * k, 8), M.chrome(), { parent: inst, at: [0, -0.06 * k, 0], name: 'endpin' });
  }
  if (V.electric) mesh(roundedBox(0.03 * k, 0.04 * k, 0.012, 0.004), M.plastic('#111', 0.3), { parent: inst, at: [0.035 * k, 0.05 * k, -D / 2 - 0.004], name: 'preamp' });
  const info = { neckPoint: new THREE.Vector3(0, yN - 0.07 * k, D / 2 - 0.006 * k), neckW: 0.03 * k, D, strings: nN };
  void variant;
  return { inst, info };
}

/** Bow: stick, hair ribbon, frog and tip. Built along +Y from 0 to len. */
function buildBow(len, T, k = 1) {
  const g = group('bow');
  const stickM = T.trim === 'gold' ? M.wood('#5b2a12') : T.kids ? fin(T, T.s, 'plastic') : T.neon ? fin(T, '#111', 'gloss') : M.wood('#5a2410');
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([0, t * len, 0.012 * k * Math.sin(t * Math.PI) - 0.004 * k * t]); }
  curveTube(pts, 0.004 * k, stickM, { parent: g, name: 'bow_stick', segments: 40, radialSegments: 8 });
  mesh(roundedBox(0.012 * k, 0.04 * k, 0.022 * k, 0.003), T.trim === 'gold' ? hwMat(T) : ebony(), { parent: g, at: [0, 0.03 * k, -0.011 * k], name: 'frog' });
  mesh(roundedBox(0.008 * k, 0.018 * k, 0.022 * k, 0.003), T.trim === 'white' ? pearl() : M.matte('#f2efe6', 0.4), { parent: g, at: [0, len - 0.008 * k, -0.012 * k], name: 'bow_tip' });
  mesh(roundedBox(0.009 * k, len - 0.07 * k, 0.0015, 0.0006), T.neon ? fin(T, T.p, 'neon') : M.matte('#f4f0e6', 0.6), { parent: g, at: [0, len / 2 + 0.02 * k, -0.021 * k], name: 'bow_hair' });
  return g;
}

export function createBowed(options = {}) {
  const { o, variant, T, V } = setup(options, BOWED_VARIANTS, 'bowed');
  const root = group(`bowed-${variant}`);
  const { inst, info } = buildBowed(V, T, variant);
  const big = V.endpin;
  standUp(root, inst, info, T, { tilt: big ? 0.25 : 0.18, cradle: big ? 0 : 0.1, endpin: big, scale: T.scale });
  root.updateMatrixWorld(true);
  const post = root.getObjectByName('stand_post');
  if (!post) { // no stand: the bow lies on the ground beside the instrument
    const blen = (variant === 'double-bass' ? 0.7 : variant === 'cello' ? 0.71 : variant === 'viola' ? 0.74 : 0.75) * T.scale;
    const bow = buildBow(blen, T, Math.max(0.8, T.scale));
    const ib = new THREE.Box3().setFromObject(inst);
    bow.rotation.x = Math.PI / 2;
    bow.position.set(ib.max.x + 0.06, 0, ib.min.z + 0.05);
    root.add(bow);
    bow.updateMatrixWorld(true);
    bow.position.y -= lowestPoint(bow).y;
    return done(root, 'bowed', variant, o, () => [strumAnim(inst, info.strings)]);
  }
  // bow leaning against the stand post
  const pp = post.position;
  const blen = (variant === 'double-bass' ? 0.7 : variant === 'cello' ? 0.71 : variant === 'viola' ? 0.74 : 0.75) * T.scale;
  const topY = Math.min(blen * 0.92, pp.y * 2 - 0.08);
  const base = new THREE.Vector3(0.012 + Math.sqrt(Math.max(0.01, blen * blen - topY * topY)), 0, pp.z - 0.012);
  const tipP = new THREE.Vector3(0.0095 + 0.004, topY, pp.z);
  const bow = buildBow(blen, T, Math.max(0.8, T.scale));
  bow.position.copy(base);
  bow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tipP.clone().sub(base).normalize());
  root.add(bow);
  return done(root, 'bowed', variant, o, () => [strumAnim(inst, info.strings)]);
}
