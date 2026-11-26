// Board games: chess, checkers, backgammon, a generic race game, cross-and-circle race board, tic-tac-toe.
import {
  THREE, M, mesh, group, roundedBox, lathe, hollowLathe, extrudeOutline, merged, toyMat, toyFactory, canvasTex, BLACK, WHITE, CHROME,
  clip, rotateTrack, moveTrack, pingPong,
} from './kit.js';

/* ------------------------------ shared bits ------------------------------ */
/** Rounded die with pips (merged), sitting on y=0. Returns group. */
export function die(parent, s, mat, pipMat, { at = [0, 0, 0], rotY = 0, name } = {}) {
  const g = group(name ?? null, { parent, at, rot: [0, rotY, 0] });
  mesh(roundedBox(s, s, s, s * 0.18, 3), mat, { parent: g, at: [0, s / 2, 0] });
  const pr = s * 0.09;
  const P = {
    1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };
  const faces = [[1, [0, 1, 0]], [6, [0, -1, 0]], [2, [1, 0, 0]], [5, [-1, 0, 0]], [3, [0, 0, 1]], [4, [0, 0, -1]]];
  const geos = [];
  const q = new THREE.Quaternion();
  for (const [n, nrm] of faces) {
    if (nrm[1] < 0) continue;
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...nrm));
    for (const [u, v] of P[n]) {
      const geo = new THREE.SphereGeometry(pr, 8, 6).scale(1, 0.35, 1);
      geo.translate(u * s * 0.25, s / 2 - pr * 0.12, v * s * 0.25).applyQuaternion(q).translate(0, s / 2, 0);
      geos.push(geo);
    }
  }
  merged(geos, pipMat, { parent: g });
  return g;
}

/** Board slab with a raised rim. */
function boardSlab(parent, c, W, D, H, mat, rimMat) {
  mesh(roundedBox(W, H, D, Math.min(H * 0.45, 0.006), 3), mat, { parent, at: [0, H / 2, 0] });
  if (rimMat) {
    const r = 0.006;
    for (const s of [-1, 1]) mesh(roundedBox(W, r * 1.4, r, r * 0.45), rimMat, { parent, at: [0, H + r * 0.5, s * (D / 2 - r / 2)] });
    for (const s of [-1, 1]) mesh(roundedBox(r, r * 1.4, D - 2 * r, r * 0.45), rimMat, { parent, at: [s * (W / 2 - r / 2), H + r * 0.5, 0] });
  }
}

/** n×n checkerboard squares (2 merged meshes) on top of y. */
function squares(parent, n, q, y, lightM, darkM) {
  const L = [];
  const D = [];
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) {
    const g = new THREE.BoxGeometry(q, 0.001, q).translate((i - (n - 1) / 2) * q, y + 0.0005, (k - (n - 1) / 2) * q);
    ((i + k) % 2 ? L : D).push(g);
  }
  merged(L, lightM, { parent });
  merged(D, darkM, { parent });
}

function pieceMats(c) {
  const { T } = c;
  if (T.kind === 'rawwood') return [toyMat('rawwood', 'maple'), toyMat('rawwood', 'walnut')];
  if (T.kind === 'clear') return [toyMat('clear', '#f2fbff'), toyMat('clear', T.pal[0])];
  if (T.kind === 'gold') return [toyMat('gold', '#e0b84a'), toyMat('chrome', '#9aa0a8')];
  if (T.kind === 'stone') return [toyMat('stone', '#f1ede6'), toyMat('stone', '#2b2b2e')];
  return [toyMat(T.kind, T.pal[4]), toyMat(T.kind, T.pal[5])];
}
function boardMats(c) {
  const { T } = c;
  if (T.kind === 'rawwood') return [toyMat('rawwood', 'oak'), toyMat('rawwood', 'walnut'), toyMat('rawwood', 'cherry')];
  if (T.kind === 'stone') return [toyMat('stone', '#ece8e1'), toyMat('stone', '#5a6b73'), toyMat('stone', '#2b2b2e')];
  if (T.kind === 'gold' || T.kind === 'paint') return [toyMat('paint', T.pal[2]), toyMat('paint', T.pal[0]), toyMat('gold', '#d4a73a')];
  return [toyMat(T.kind === 'clear' ? 'clear' : 'plastic', T.pal[4]), toyMat(T.kind === 'clear' ? 'clear' : 'plastic', T.pal[0]), c.m(5)];
}

/* ------------------------------ chess pieces ------------------------------ */
const PROF = {
  pawn: [[0, 0], [0.4, 0], [0.4, 0.08], [0.32, 0.13], [0.22, 0.2], [0.14, 0.5], [0.26, 0.55], [0.14, 0.6], [0.2, 0.7], [0.21, 0.8], [0.14, 0.9], [0, 0.93]],
  rook: [[0, 0], [0.42, 0], [0.42, 0.1], [0.32, 0.18], [0.25, 0.3], [0.22, 0.85], [0.3, 0.92], [0.3, 1.18], [0.22, 1.18], [0.22, 1.08], [0, 1.08]],
  bishop: [[0, 0], [0.42, 0], [0.42, 0.1], [0.3, 0.2], [0.18, 0.4], [0.15, 0.9], [0.28, 0.95], [0.15, 1.0], [0.2, 1.15], [0.21, 1.3], [0.12, 1.48], [0.04, 1.56], [0.07, 1.6], [0, 1.66]],
  queen: [[0, 0], [0.46, 0], [0.46, 0.1], [0.34, 0.2], [0.2, 0.45], [0.15, 1.15], [0.3, 1.2], [0.16, 1.27], [0.27, 1.62], [0.2, 1.66], [0.12, 1.64], [0.08, 1.74], [0.06, 1.8], [0, 1.82]],
  king: [[0, 0], [0.47, 0], [0.47, 0.1], [0.35, 0.2], [0.21, 0.45], [0.16, 1.25], [0.31, 1.3], [0.17, 1.37], [0.25, 1.7], [0.12, 1.76], [0.05, 1.8], [0, 1.8]],
  base: [[0, 0], [0.42, 0], [0.42, 0.1], [0.3, 0.2], [0.27, 0.36], [0, 0.36]],
};
const HORSE = [[-0.28, 0.3], [0.28, 0.3], [0.24, 0.6], [0.14, 0.74], [0.48, 0.94], [0.54, 1.08], [0.4, 1.22], [0.12, 1.36], [0.02, 1.5], [-0.08, 1.36], [-0.28, 1.12], [-0.34, 0.72]];

function chessPiece(kind, q, seg) {
  if (kind === 'knight') {
    const base = lathe(PROF.base.map(([r, y]) => [r * q, y * q]), seg);
    const head = extrudeOutline(HORSE.map(([x, y]) => [x * q, y * q]), q * 0.3, { bevel: q * 0.05, segments: 2 }).rotateY(-Math.PI / 2);
    return [base, head];
  }
  const out = [lathe(PROF[kind].map(([r, y]) => [r * q, y * q]), seg)];
  if (kind === 'king') {
    out.push(new THREE.BoxGeometry(q * 0.08, q * 0.32, q * 0.08).translate(0, q * 1.94, 0));
    out.push(new THREE.BoxGeometry(q * 0.24, q * 0.08, q * 0.08).translate(0, q * 1.96, 0));
  }
  if (kind === 'queen') out.push(new THREE.SphereGeometry(q * 0.08, 10, 8).translate(0, q * 1.86, 0));
  return out;
}

/* ------------------------------ variants ------------------------------ */
export const BOARD_GAME_VARIANTS = {
  'chess-set': { kind: 'chess' },
  checkers: { kind: 'checkers' },
  backgammon: { kind: 'backgammon' },
  'race-game': { kind: 'race' },
  'cross-and-circle': { kind: 'cross' },
  'tic-tac-toe': { kind: 'ttt' },
};

export const createBoardGame = toyFactory('board-game', BOARD_GAME_VARIANTS, (c) => {
  const { root, T, v, r } = c;
  const [lightM, darkM, frameM] = boardMats(c);
  const [pw, pb] = pieceMats(c);
  const seg = 20;
  if (v.kind === 'chess' || v.kind === 'checkers') {
    const q = 0.04;
    const B = q * 8 + 0.04;
    const H = 0.018;
    boardSlab(root, c, B, B, H, frameM);
    squares(root, 8, q, H, lightM, darkM);
    const top = H + 0.001;
    const sets = [[], []];
    const at = (i, k) => [(i - 3.5) * q, top, (k - 3.5) * q];
    if (v.kind === 'chess') {
      const back = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
      for (let side = 0; side < 2; side++) {
        const rowB = side ? 7 : 0;
        const rowP = side ? 6 : 1;
        for (let i = 0; i < 8; i++) {
          for (const g of chessPiece('pawn', q, seg)) sets[side].push(g.translate(...at(i, rowP)));
          const geos = chessPiece(back[i], q, seg);
          for (const g of geos) {
            if (back[i] === 'knight') g.rotateY(side ? Math.PI : 0);
            sets[side].push(g.translate(...at(i, rowB)));
          }
        }
      }
      merged(sets[0], pw, { parent: root, name: 'white_pieces' });
      merged(sets[1], pb, { parent: root, name: 'black_pieces' });
      // a captured-piece tray? no: the full 32 stay on the board. Clock beside the board for luxe sets.
      if (T.style === 'luxe') {
        const clk = group('clock', { parent: root, at: [B / 2 + 0.07, 0, 0] });
        mesh(roundedBox(0.06, 0.05, 0.11, 0.008), toyMat('rawwood', 'walnut'), { parent: clk, at: [0, 0.025, 0] });
        for (const s of [-1, 1]) {
          mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.004, 24).rotateZ(Math.PI / 2), WHITE, { parent: clk, at: [0.031, 0.026, s * 0.027] });
          mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 10), CHROME, { parent: clk, at: [0, 0.056, s * 0.027] });
        }
      }
    } else {
      const disc = (y) => lathe([[0, 0], [q * 0.4, 0], [q * 0.42, q * 0.03], [q * 0.42, q * 0.13], [q * 0.4, q * 0.16], [q * 0.28, q * 0.17], [q * 0.27, q * 0.14], [0, q * 0.14]], 28).translate(0, y, 0);
      const ph = q * 0.16;
      for (let side = 0; side < 2; side++) for (let k = side ? 5 : 0; k < (side ? 8 : 3); k++) for (let i = 0; i < 8; i++) {
        if ((i + k) % 2) continue;
        sets[side].push(disc(0).translate(...at(i, k)));
      }
      // one crowned king (two stacked) mid-board
      sets[0].push(disc(0).translate(...at(3, 4)), disc(ph).translate(...at(3, 4)));
      merged(sets[0], c.T.kind === 'rawwood' ? pw : c.m(0), { parent: root, name: 'red_pieces' });
      merged(sets[1], c.T.kind === 'rawwood' ? pb : c.m(5), { parent: root, name: 'black_pieces' });
    }
  } else if (v.kind === 'backgammon') {
    // open hinged case: two halves, points as inlaid triangles, checkers in start position
    const hw = 0.24;
    const D = 0.4;
    const H = 0.03;
    const hinge = 0.004;
    const tri = (x, z, dir, w, h) => new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, h)])).rotateX(-Math.PI / 2).rotateY(dir > 0 ? Math.PI : 0).translate(x, 0, z);
    const ptsA = [];
    const ptsB = [];
    const pw0 = (hw - 0.03) / 6;
    for (const s of [-1, 1]) {
      const cx = s * (hw / 2 + hinge / 2);
      // case half: floor + walls (hollow tray)
      mesh(roundedBox(hw, 0.006, D, 0.002), frameM, { parent: root, at: [cx, 0.003, 0] });
      for (const zz of [-1, 1]) mesh(roundedBox(hw, H, 0.012, 0.004), frameM, { parent: root, at: [cx, H / 2, zz * (D / 2 - 0.006)] });
      for (const xx of [-1, 1]) mesh(roundedBox(0.012, H, D - 0.024, 0.004), frameM, { parent: root, at: [cx + xx * (hw / 2 - 0.006), H / 2, 0] });
      mesh(roundedBox(hw - 0.024, 0.001, D - 0.024, 0.0004), lightM, { parent: root, at: [cx, 0.0065, 0] });
      for (let i = 0; i < 6; i++) for (const zz of [-1, 1]) {
        const x = cx - (hw - 0.03) / 2 + pw0 * (i + 0.5);
        ((i + (zz > 0 ? 1 : 0)) % 2 ? ptsA : ptsB).push(tri(x, zz * (D / 2 - 0.012), -zz, pw0 * 0.9, D * 0.4).translate(0, 0.0072, 0));
      }
    }
    merged(ptsA, darkM, { parent: root });
    merged(ptsB, c.m(T.kind === 'rawwood' ? 1 : 2), { parent: root });
    // checkers: standard opening (2,5,3,5 per side mirrored)
    const cr = pw0 * 0.44;
    const ch = 0.006;
    const stackAt = (pt, n, side) => {
      const half = pt < 12 ? 1 : -1;
      const idx = pt % 12;
      const s = idx < 6 ? 1 : -1;
      const i = idx < 6 ? 5 - idx : 11 - idx;
      const x = s * (hw / 2 + hinge / 2) - (hw - 0.03) / 2 + pw0 * (i + 0.5);
      const out = [];
      for (let k = 0; k < n; k++) out.push(new THREE.CylinderGeometry(cr, cr, ch, 22).translate(x, 0.0075 + ch / 2, half * (D / 2 - 0.012 - cr - k * cr * 2.02)));
      void side;
      return out;
    };
    const W0 = [...stackAt(0, 2), ...stackAt(11, 5), ...stackAt(16, 3), ...stackAt(18, 5)];
    const B0 = [...stackAt(23, 2), ...stackAt(12, 5), ...stackAt(7, 3), ...stackAt(5, 5)];
    merged(W0, pw, { parent: root, name: 'white_men' });
    merged(B0, pb, { parent: root, name: 'black_men' });
    die(root, 0.013, WHITE, BLACK, { at: [hw / 2 + 0.03, 0.0075, 0.03], rotY: 0.4 });
    die(root, 0.013, WHITE, BLACK, { at: [hw / 2 + 0.06, 0.0075, -0.01], rotY: -0.3 });
    mesh(hollowLathe(0.017, 0.019, 0.04, 0.002, 28), toyMat('soft', '#3a2a1c'), { parent: root, at: [-hw / 2 - 0.02, 0.0065, 0.05] });
  } else if (v.kind === 'race' || v.kind === 'cross') {
    const B = 0.42;
    const H = 0.008;
    boardSlab(root, c, B, B, H, lightM);
    const cols = [0, 1, 2, 3];
    const tiles = cols.map(() => []);
    const tq = 0.03;
    if (v.kind === 'race') {
      // snaking path across the board
      let n = 0;
      for (let row = 0; row < 6; row++) for (let i = 0; i < 11; i++) {
        const x = row % 2 ? 5 - i : i - 5;
        if (row % 2 === 0 && i === 10) continue;
        tiles[n++ % 4].push(roundedBox(tq * 0.92, 0.002, tq * 0.92, 0.0008, 1).translate(x * tq * 1.1, H + 0.001, (row - 2.5) * tq * 2.2));
        if (i === 10 && row < 5) tiles[n++ % 4].push(roundedBox(tq * 0.92, 0.002, tq * 0.92, 0.0008, 1).translate(x * tq * 1.1, H + 0.001, (row - 2) * tq * 2.2));
      }
    } else {
      // cross-shaped track with four home corners and centre
      for (let a = 0; a < 4; a++) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (a * Math.PI) / 2);
        for (let i = 0; i < 5; i++) for (let j = -1; j <= 1; j++) {
          const g = roundedBox(tq * 0.9, 0.002, tq * 0.9, 0.0008, 1).translate(j * tq, H + 0.001, tq * (2 + i));
          tiles[j === 0 ? a : (a + 1 + i) % 4].push(g.applyQuaternion(q));
        }
        const home = new THREE.CylinderGeometry(0.055, 0.055, 0.002, 32).translate(0.12, H + 0.001, 0.12).applyQuaternion(q);
        tiles[a].push(home);
      }
      tiles[0].push(new THREE.CylinderGeometry(tq * 1.4, tq * 1.4, 0.0022, 4).rotateY(Math.PI / 4).translate(0, H + 0.0011, 0));
    }
    tiles.forEach((list, i) => merged(list, c.m(cols[i]), { parent: root }));
    // pawns
    const pawnGeo = () => [lathe([[0, 0], [0.008, 0], [0.008, 0.002], [0.005, 0.006], [0.0035, 0.016], [0, 0.017]], 18), new THREE.SphereGeometry(0.0055, 14, 10).translate(0, 0.019, 0)];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.785;
      const p = group(`pawn_${i}`, { parent: root, at: v.kind === 'cross' ? [Math.cos(a) * 0.17, H + 0.003, Math.sin(a) * 0.17] : [(-5 + i * 0.5) * tq * 1.1 + 0.005 * i, H + 0.002, -2.5 * tq * 2.2] });
      merged(pawnGeo(), c.m(cols[i]), { parent: p });
      if (i === 0) c.anims.push(clip('hop', 2, [moveTrack(p, 2, (t) => [t < 0.5 ? 0 : tq * 1.1, Math.sin(Math.min(1, t * 2) * Math.PI) * 0.03, 0])]));
    }
    die(root, 0.016, WHITE, BLACK, { at: [0.05, H + 0.002, 0.02], rotY: 0.5 });
    die(root, 0.016, c.m(0), WHITE, { at: [0.08, H + 0.002, -0.03], rotY: 1.1 });
    void r;
  } else {
    // tic-tac-toe: grooved block with X and O pieces
    const B = 0.18;
    mesh(roundedBox(B, 0.02, B, 0.006), frameM, { parent: root, at: [0, 0.01, 0] });
    const s = B / 3;
    for (const k of [-0.5, 0.5]) {
      mesh(roundedBox(0.004, 0.002, B * 0.9, 0.001), darkM, { parent: root, at: [k * s, 0.0205, 0] });
      mesh(roundedBox(B * 0.9, 0.002, 0.004, 0.001), darkM, { parent: root, at: [0, 0.0205, k * s] });
    }
    const layout = ['x', 'o', '', '', 'x', 'o', 'o', '', 'x'];
    const xs = [];
    const os = [];
    layout.forEach((p, i) => {
      const x = ((i % 3) - 1) * s;
      const z = (Math.floor(i / 3) - 1) * s;
      if (p === 'x') for (const a of [0.785, -0.785]) xs.push(roundedBox(s * 0.7, 0.012, s * 0.16, 0.004, 2).rotateY(a).translate(x, 0.026, z));
      if (p === 'o') os.push(new THREE.TorusGeometry(s * 0.28, s * 0.08, 12, 28).rotateX(Math.PI / 2).translate(x, 0.02 + s * 0.08, z));
    });
    merged(xs, c.m(0), { parent: root });
    merged(os, c.m(1), { parent: root });
    // spare pieces beside the board
    mesh(new THREE.TorusGeometry(s * 0.28, s * 0.08, 12, 28).rotateX(Math.PI / 2), c.m(1), { parent: root, at: [B / 2 + s * 0.5, s * 0.08, -s * 0.4] });
  }
  void M; void rotateTrack; void pingPong;
}, { base: 'classic' });
