// Tabletop: playing cards, dice sets, dominoes, jigsaw puzzles and twisty cube puzzles.
import {
  THREE, M, mesh, group, roundedBox, lathe, hollowLathe, extrudeOutline, merged, toyMat, toyFactory, canvasTex, BLACK, WHITE, CHROME,
  clip, rotateTrack, moveTrack, spinTrack, pingPong,
} from './kit.js';
import { die } from './games.js';

const hex = (c) => '#' + M.toColor(c).getHexString();

/* ============================== PLAYING CARDS ============================== */
const CW = 0.063;
const CH = 0.088;
const CT = 0.0004;
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '7', 'K', 'Q', '10', 'J', '3', '9'];

function cardBack(c) {
  const T = c.T;
  const tex = canvasTex(128, 176, (x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    x.fillStyle = hex(T.pal[0]); x.fillRect(6, 6, w - 12, h - 12);
    x.strokeStyle = hex(T.pal[4]); x.lineWidth = 2;
    for (let i = -h; i < w + h; i += 10) { x.beginPath(); x.moveTo(i, 6); x.lineTo(i + h, h); x.stroke(); x.beginPath(); x.moveTo(i + h, 6); x.lineTo(i, h); x.stroke(); }
    x.fillStyle = hex(T.pal[2]); x.beginPath(); x.ellipse(w / 2, h / 2, 22, 30, 0, 0, 7); x.fill();
  }, `card-back-${T.name}`);
  return tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 }) : c.m(0);
}
function cardFace(i) {
  const suit = SUITS[i % 4];
  const rank = RANKS[i % RANKS.length];
  const tex = canvasTex(128, 176, (x, w, h) => {
    x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, w, h);
    x.fillStyle = suit === '♥' || suit === '♦' ? '#c8102e' : '#141414';
    x.font = 'bold 26px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(rank, 16, 20); x.fillText(suit, 16, 44);
    x.save(); x.translate(w, h); x.rotate(Math.PI); x.fillText(rank, 16, 20); x.fillText(suit, 16, 44); x.restore();
    x.font = '64px serif'; x.fillText(suit, w / 2, h / 2 + 4);
  }, `card-face-${i % 8}`);
  return tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 }) : WHITE;
}
/** One flat card: face up (or down). Group origin at its bottom centre. */
function card(parent, c, { at = [0, 0, 0], rot = [0, 0, 0], face = 0, up = true, name, s = 1 } = {}) {
  const g = group(name ?? null, { parent, at, rot });
  const box = roundedBox(CW * s, CT, CH * s, CT * 0.45, 1);
  const edge = toyMat('soft', '#f4f2ea');
  mesh(box, edge, { parent: g, at: [0, CT / 2, 0] });
  const top = new THREE.PlaneGeometry(CW * s * 0.995, CH * s * 0.995).rotateX(-Math.PI / 2);
  const back = cardBack(c);
  mesh(top, up ? cardFace(face) : back, { parent: g, at: [0, CT + 0.00005, 0] });
  mesh(top.clone().rotateX(Math.PI), up ? back : cardFace(face), { parent: g, at: [0, -0.00005, 0] });
  return g;
}

export const CARD_VARIANTS = {
  'deck-box': {}, 'fanned-hand': {}, 'card-house': {}, solitaire: {}, 'poker-night': {},
};

function deck(parent, c, at, n = 52, rotY = 0) {
  const g = group(null, { parent, at, rot: [0, rotY, 0] });
  const h = n * 0.0003;
  mesh(roundedBox(CW, h, CH, 0.0015, 2), toyMat('soft', '#efece2'), { parent: g, at: [0, h / 2, 0] });
  card(g, c, { at: [0, h, 0], up: false });
  return g;
}

export const createPlayingCards = toyFactory('playing-cards', CARD_VARIANTS, (c) => {
  const { root, variant, T } = c;
  const sz = T.style === 'jumbo' ? 1 : 1;
  if (variant === 'deck-box') {
    // tuck box (hollow, flap open) + deck half pulled out
    const bw = CW + 0.004;
    const bd = CH + 0.004;
    const bh = 0.02;
    const t = 0.0006;
    const bm = cardBack(c);
    const g = group('tuckbox', { parent: root, at: [-0.02, 0, 0] });
    mesh(roundedBox(bw, t, bd, t * 0.4, 1), bm, { parent: g, at: [0, t / 2, 0] });
    for (const s of [-1, 1]) mesh(roundedBox(t, bh, bd, t * 0.4, 1), bm, { parent: g, at: [s * (bw / 2 - t / 2), bh / 2, 0] });
    mesh(roundedBox(bw, bh, t, t * 0.4, 1), bm, { parent: g, at: [0, bh / 2, -bd / 2 + t / 2] });
    mesh(roundedBox(bw, t, bd * 0.75, t * 0.4, 1), bm, { parent: g, at: [0, bh - t / 2, -bd * 0.125] });
    const flap = group('flap', { parent: g, at: [0, bh, bd * 0.25] });
    mesh(roundedBox(bw, t, 0.02, t * 0.4, 1), bm, { parent: flap, at: [0, 0, 0.01], rot: [0.0, 0, 0] });
    flap.rotation.x = -0.6;
    deck(g, c, [0, t, 0.035], 52);
    card(root, c, { at: [0.06, 0, 0.01], rot: [0, 0.3, 0], face: 0 });
    card(root, c, { at: [0.065, CT, 0.02], rot: [0, -0.15, 0], face: 2 });
    c.anims.push(clip('open', 2, [rotateTrack(flap, 'x', 2, (u) => -pingPong(u) * 1.6)]));
  } else if (variant === 'fanned-hand') {
    for (let i = 0; i < 7; i++) {
      const a = (i - 3) * 0.18;
      const pivot = group(null, { parent: root, rot: [0, -a, 0], at: [0, i * CT * 1.05, 0] });
      card(pivot, c, { at: [0, 0, -CH * 0.38], face: i });
    }
    deck(root, c, [0.11, 0, -0.03], 30, 0.2);
  } else if (variant === 'card-house') {
    // three-level house of cards: leaning pairs + flat roofs
    const lean = 0.32;
    const hgt = CH * Math.cos(lean);
    const half = CH * Math.sin(lean);
    const level = (y, n) => {
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * (half * 2 + 0.004);
        for (const s of [-1, 1]) {
          const tiltG = group(null, { parent: root, at: [x + s * half, y, 0], rot: [0, 0, s * lean] });
          const inner = group(null, { parent: tiltG, rot: [0, Math.PI / 2, 0] });
          card(inner, c, { at: [0, CH / 2, 0], rot: [-Math.PI / 2, 0, 0], face: i + (s > 0 ? 1 : 0), up: s > 0 });
        }
      }
      if (n > 1) for (let i = 0; i < n - 1; i++) {
        const x = (i - (n - 2) / 2) * (half * 2 + 0.004);
        card(root, c, { at: [x, y + hgt, 0], rot: [0, Math.PI / 2, 0], up: false });
      }
    };
    level(0, 3);
    level(hgt + CT, 2);
    level(2 * (hgt + CT), 1);
  } else if (variant === 'solitaire') {
    // seven tableau columns + stock pile
    for (let col = 0; col < 7; col++) for (let k = 0; k <= col; k++) {
      card(root, c, { at: [(col - 3) * (CW + 0.008), k * CT * 1.1, 0.06 - k * 0.018], face: col + k, up: k === col });
    }
    deck(root, c, [-3 * (CW + 0.008), 0, 0.17], 24);
    card(root, c, { at: [-2 * (CW + 0.008), 0, 0.17], face: 5 });
  } else {
    // poker night: felt mat, chips stacks, two hands and community cards
    mesh(roundedBox(0.6, 0.004, 0.4, 0.002), toyMat('plush', '#1d6b3a'), { parent: root, at: [0, 0.002, 0] });
    const y0 = 0.004;
    for (let i = 0; i < 5; i++) card(root, c, { at: [(i - 2) * (CW + 0.006), y0, 0], face: i + 2 });
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) card(root, c, { at: [s * 0.2 + i * 0.02, y0 + i * CT, s * 0.12], rot: [0, s * 0.2 + i * 0.15, 0], up: false });
    const chipCols = [T.pal[0], T.pal[1], '#f2f2f2', T.pal[5], T.pal[2]];
    chipCols.forEach((col, ci) => {
      const geos = [];
      const n = 4 + ((ci * 3) % 7);
      for (let k = 0; k < n; k++) geos.push(lathe([[0, 0], [0.019, 0], [0.0195, 0.0016], [0.019, 0.0032], [0, 0.0032]], 24).translate(0, k * 0.0033, 0));
      merged(geos, toyMat('plastic', col), { parent: root, at: [-0.24 + ci * 0.045, y0, -0.15 + (ci % 2) * 0.03] });
    });
    deck(root, c, [0.22, y0, -0.12], 30, -0.3);
  }
  void sz;
}, { base: 'classic' });

/* ============================== DICE SETS ============================== */
export const DICE_VARIANTS = {
  'pair-d6': {}, 'poker-dice': {}, polyhedral: {}, 'giant-foam': { pal: ['#ff2fb3', '#19e3ff', '#d4ff1e', '#ff8a00', '#ffffff', '#2a2238'] }, 'dice-tray': {},
};

/** Rotate a polyhedron so its first face points down; sit it on y=0. */
function restOnFace(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position;
  const a = new THREE.Vector3().fromBufferAttribute(p, 0);
  const b = new THREE.Vector3().fromBufferAttribute(p, 1);
  const cc = new THREE.Vector3().fromBufferAttribute(p, 2);
  const n = b.clone().sub(a).cross(cc.clone().sub(a)).normalize();
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(n, new THREE.Vector3(0, -1, 0)));
  g.computeBoundingBox();
  g.translate(0, -g.boundingBox.min.y, 0);
  g.computeVertexNormals();
  return g;
}

export const createDiceSet = toyFactory('dice-set', DICE_VARIANTS, (c) => {
  const { root, variant, T } = c;
  const pip = T.kind === 'gold' || T.kind === 'chrome' ? BLACK : toyMat('soft', T.pal[4] === T.pal[0] ? '#111' : (T.style === 'neon' ? '#111111' : T.pal[4]));
  const dm = (i) => c.m(i);
  if (variant === 'pair-d6') {
    die(root, 0.016, dm(0), pip, { at: [-0.012, 0, 0], rotY: 0.3, name: 'dieA' });
    die(root, 0.016, dm(1), pip, { at: [0.014, 0, 0.008], rotY: -0.5, name: 'dieB' });
  } else if (variant === 'poker-dice') {
    for (let i = 0; i < 5; i++) die(root, 0.016, dm(i % 4), pip, { at: [Math.cos(i * 1.3) * 0.03 + 0.03, 0, Math.sin(i * 1.3) * 0.03], rotY: i * 0.7 });
    // leather shaker cup (hollow), upright
    mesh(hollowLathe(0.03, 0.036, 0.09, 0.003, 36), toyMat(T.kind === 'plastic' ? 'soft' : T.kind, T.pal[5]), { parent: root, at: [-0.05, 0, 0] });
  } else if (variant === 'polyhedral') {
    const s = 0.011;
    const solids = [
      new THREE.TetrahedronGeometry(s * 1.4), new THREE.BoxGeometry(s * 1.5, s * 1.5, s * 1.5), new THREE.OctahedronGeometry(s * 1.2),
      new THREE.ConeGeometry(s * 1.0, s * 1.0, 5).translate(0, s * 0.5, 0), new THREE.DodecahedronGeometry(s * 1.15), new THREE.IcosahedronGeometry(s * 1.2),
    ];
    // d10: double pentagonal pyramid
    const d10 = merged([new THREE.ConeGeometry(s, s, 5).translate(0, s / 2, 0), new THREE.ConeGeometry(s, s, 5).rotateX(Math.PI).translate(0, -s / 2, 0)], dm(3), {});
    solids[3] = d10.geometry;
    solids.forEach((geo, i) => {
      const g = restOnFace(geo.clone());
      mesh(g, T.kind === 'clear' ? toyMat('clear', T.pal[i % 4]) : dm(i), { parent: root, at: [(i % 3 - 1) * 0.032, 0, Math.floor(i / 3) * 0.032 - 0.016] });
    });
    // velvet dice bag lying flat
    mesh(lathe([[0, 0], [0.024, 0.002], [0.032, 0.018], [0.03, 0.038], [0.014, 0.054], [0.011, 0.06], [0.018, 0.068], [0.012, 0.07], [0, 0.07]], 28), toyMat('plush', T.pal[5]), { parent: root, at: [0.085, 0, 0] });
    mesh(new THREE.TorusGeometry(0.0125, 0.0015, 6, 20).rotateX(Math.PI / 2), toyMat('soft', T.pal[2]), { parent: root, at: [0.085, 0.057, 0] });
  } else if (variant === 'giant-foam') {
    // pyramid of three big foam dice
    die(root, 0.15, toyMat('soft', T.pal[0]), toyMat('soft', '#ffffff'), { at: [-0.078, 0, 0], rotY: 0.05 });
    die(root, 0.15, toyMat('soft', T.pal[1]), toyMat('soft', '#ffffff'), { at: [0.078, 0, 0], rotY: -0.05 });
    die(root, 0.15, toyMat('soft', T.pal[2]), toyMat('soft', '#ffffff'), { at: [0, 0.15, 0], rotY: 0.25 });
  } else {
    // hexagonal felt-lined dice tray (hollow) with dice inside
    const R = 0.09;
    const wallH = 0.025;
    const t = 0.006;
    const tray = group('tray', { parent: root });
    mesh(new THREE.CylinderGeometry(R, R, t, 6), toyMat('rawwood', 'walnut'), { parent: tray, at: [0, t / 2, 0] });
    mesh(new THREE.CylinderGeometry(R - t, R - t, 0.002, 6), toyMat('plush', T.pal[0]), { parent: tray, at: [0, t + 0.001, 0] });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const apo = R * Math.cos(Math.PI / 6);
      mesh(roundedBox(R, wallH, t, 0.002), toyMat('rawwood', 'walnut'), { parent: tray, at: [Math.cos(a) * (apo - t / 2), wallH / 2, Math.sin(a) * (apo - t / 2)], rot: [0, -a + Math.PI / 2, 0] });
    }
    for (let i = 0; i < 4; i++) die(root, 0.016, dm(i), pip, { at: [Math.cos(i * 1.6) * 0.035, t + 0.002, Math.sin(i * 1.6) * 0.035], rotY: i });
  }
}, { base: 'classic' });

/* ============================== DOMINOES ============================== */
export const DOMINO_VARIANTS = { 'box-set': {}, 'topple-chain': {}, 'game-line': {}, 'stacked-tower': {} };
const DW = 0.024;
const DL = 0.048;
const DT = 0.0075;

/** Domino lying flat (face up), origin bottom centre, long along Z. pips a|b. */
function domino(parent, c, a, b, { at = [0, 0, 0], rot = [0, 0, 0], name, mat, pipM } = {}) {
  const g = group(name ?? null, { parent, at, rot });
  mesh(roundedBox(DW, DT, DL, 0.0022, 2), mat, { parent: g, at: [0, DT / 2, 0] });
  const geos = [new THREE.BoxGeometry(DW * 0.7, 0.0004, 0.0012).translate(0, DT + 0.0001, 0)];
  const P = { 0: [], 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  for (const [n, zc] of [[a, DL / 4], [b, -DL / 4]]) for (const [u, v] of P[n]) geos.push(new THREE.CylinderGeometry(0.0016, 0.0016, 0.0006, 8).translate(u * DW * 0.27, DT, zc + v * DW * 0.27));
  merged(geos, pipM, { parent: g });
  return g;
}

export const createDominoes = toyFactory('dominoes', DOMINO_VARIANTS, (c) => {
  const { root, variant, T } = c;
  const mat = T.kind === 'rawwood' ? toyMat('rawwood', 'maple') : T.kind === 'stone' ? toyMat('stone', '#f1ede6') : c.m(T.name === 'base' || T.name === 'classic' ? 4 : 0);
  const pipM = T.kind === 'stone' || T.name === 'base' || T.name === 'classic' ? BLACK : toyMat('soft', T.pal[4]);
  let n = 0;
  const nextPair = () => { const a = n % 7; const b = (n * 3 + 2) % 7; n++; return [a, b]; };
  if (variant === 'box-set') {
    // open wooden box (hollow) with two rows of dominoes standing on edge + spare tiles
    const bw = DT * 14 + 0.012;
    const bd = DL * 2 + 0.016;
    const t = 0.005;
    const bh = DW * 0.7;
    const bm = toyMat('rawwood', T.kind === 'rawwood' ? 'walnut' : 'oak');
    mesh(roundedBox(bw, t, bd, 0.002), bm, { parent: root, at: [0, t / 2, 0] });
    for (const s of [-1, 1]) mesh(roundedBox(bw, bh, t, 0.002), bm, { parent: root, at: [0, bh / 2, s * (bd / 2 - t / 2)] });
    for (const s of [-1, 1]) mesh(roundedBox(t, bh, bd - 2 * t, 0.002), bm, { parent: root, at: [s * (bw / 2 - t / 2), bh / 2, 0] });
    for (const zr of [-1, 1]) for (let i = 0; i < 13; i++) {
      // tiles stand on their long edge, packed side by side
      domino(root, c, ...nextPair(), { at: [(i - 6) * (DT + 0.0003), t + DW / 2, zr * (DL / 2 + 0.002)], rot: [0, 0, Math.PI / 2], mat, pipM });
    }
    // lid leaning on the side (sliding lid resting on the ground)
    mesh(roundedBox(bw, 0.004, bd, 0.0015), bm, { parent: root, at: [0, 0.002, bd + 0.02] });
    for (let i = 0; i < 3; i++) domino(root, c, ...nextPair(), { at: [bw / 2 + 0.03 + i * 0.01, i * DT, -0.02 + i * 0.012], rot: [0, i * 0.5, 0], mat, pipM });
  } else if (variant === 'topple-chain') {
    // curved chain of standing tiles; the 'topple' clip knocks them over in sequence
    const N = 18;
    const tracks = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const x = Math.sin(t * Math.PI * 1.2) * 0.12;
      const z = -0.2 + t * 0.4;
      const dx = Math.cos(t * Math.PI * 1.2) * 0.12 * Math.PI * 1.2;
      const ang = Math.atan2(dx, 0.4);
      const holder = group(null, { parent: root, at: [x, 0, z], rot: [0, ang, 0] });
      const pivot = group(`dom_${i}`, { parent: holder, at: [0, 0, DT / 2] });
      domino(pivot, c, ...nextPair(), { at: [0, DL / 2, -DT / 2], rot: [Math.PI / 2, 0, 0], mat, pipM });
      tracks.push(rotateTrack(pivot, 'x', 6, (u) => { const s0 = 0.05 + (i / N) * 0.6; const k = Math.min(1, Math.max(0, (u - s0) / 0.06)); return u > 0.9 ? 1.25 * (1 - (u - 0.9) / 0.1) : k * 1.25; }, 60));
    }
    c.anims.push(clip('topple', 6, tracks));
  } else if (variant === 'game-line') {
    // tiles laid end-to-end in a game line with a doubles crossing + a player's stand of tiles
    let z = -0.15;
    for (let i = 0; i < 8; i++) {
      const dbl = i === 3 || i === 6;
      const [a, b] = nextPair();
      if (dbl) { domino(root, c, a, a, { at: [0, 0, z + DW / 2], rot: [0, Math.PI / 2, 0], mat, pipM }); z += DW + 0.001; } else { domino(root, c, a, b, { at: [0, 0, z + DL / 2], mat, pipM }); z += DL + 0.001; }
    }
    // tile rack with 7 standing tiles
    const rack = toyMat('rawwood', 'walnut');
    mesh(roundedBox(0.2, 0.008, 0.03, 0.003), rack, { parent: root, at: [0.12, 0.004, 0] , rot: [0, Math.PI / 2, 0] });
    mesh(roundedBox(0.2, 0.025, 0.008, 0.003), rack, { parent: root, at: [0.1235, 0.0125, 0], rot: [0, Math.PI / 2, 0] });
    for (let i = 0; i < 7; i++) domino(root, c, ...nextPair(), { at: [0.13, 0.008 + DL / 2, -0.075 + i * (DW + 0.002)], rot: [Math.PI / 2, -Math.PI / 2, 0], mat, pipM });
  } else {
    // tower: tiles stacked log-cabin style, each layer resting on the one below
    for (let k = 0; k < 9; k++) {
      const rot = k % 2 ? Math.PI / 2 : 0;
      for (const s of [-1, 1]) {
        const off = (DL / 2 - DW / 2) * s;
        domino(root, c, ...nextPair(), { at: k % 2 ? [0, k * DT, off] : [off, k * DT, 0], rot: [0, rot, 0], mat, pipM });
      }
    }
    domino(root, c, 6, 6, { at: [0, 9 * DT, 0], rot: [0, 0.5, 0], mat, pipM });
  }
}, { base: 'classic' });

/* ============================== JIGSAW PUZZLES ============================== */
export const JIGSAW_VARIANTS = { 'scattered-pieces': { n: [6, 4], s: 0.03 }, 'half-done': { n: [8, 6], s: 0.032 }, 'floor-puzzle': { n: [4, 3], s: 0.15, foam: true }, 'puzzle-box': { n: [5, 4], s: 0.028, box: true } };

/** Piece outline with tabs. edges: [bottom, right, top, left] in {-1 (hole), 0 (flat), 1 (tab)}. */
function pieceShape(x0, y0, s, edges) {
  const sh = new THREE.Shape();
  const pts = [];
  const corners = [[x0, y0], [x0 + s, y0], [x0 + s, y0 + s], [x0, y0 + s], [x0, y0]];
  for (let e = 0; e < 4; e++) {
    const [ax, ay] = corners[e];
    const [bx, by] = corners[e + 1];
    const dx = (bx - ax) / s;
    const dy = (by - ay) / s;
    const nx = dy;
    const ny = -dx; // outward normal (CCW outline)
    const k = edges[e];
    const P = (u, v) => [ax + dx * u * s + nx * v * s * k, ay + dy * u * s + ny * v * s * k];
    pts.push(P(0, 0));
    if (k) {
      pts.push(P(0.36, 0), P(0.4, 0.06), P(0.34, 0.16));
      for (let i = 0; i <= 8; i++) { const a = Math.PI + 0.6 - (i / 8) * (Math.PI + 1.2); pts.push(P(0.5 + Math.cos(a) * 0.15, 0.22 - Math.sin(a) * 0.12)); }
      pts.push(P(0.66, 0.16), P(0.6, 0.06), P(0.64, 0));
    }
  }
  pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  return sh;
}

export const createJigsaw = toyFactory('jigsaw-puzzle', JIGSAW_VARIANTS, (c) => {
  const { root, v, T, r, variant } = c;
  const [nx, ny] = v.n;
  const s = v.s;
  const W = nx * s;
  const H = ny * s;
  const thick = v.foam ? 0.012 : 0.0022;
  const tex = canvasTex(512, 384, (x, w, h) => {
    const sky = x.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, hex(T.pal[1])); sky.addColorStop(0.6, '#fdf3dc'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
    x.fillStyle = hex(T.pal[2]); x.beginPath(); x.arc(w * 0.75, h * 0.28, 40, 0, 7); x.fill();
    x.fillStyle = hex(T.pal[3]); x.beginPath(); x.moveTo(0, h * 0.7); x.quadraticCurveTo(w * 0.3, h * 0.45, w * 0.6, h * 0.72); x.quadraticCurveTo(w * 0.8, h * 0.6, w, h * 0.66); x.lineTo(w, h); x.lineTo(0, h); x.fill();
    x.fillStyle = hex(T.pal[0]); x.fillRect(w * 0.2, h * 0.55, w * 0.12, h * 0.15); x.beginPath(); x.moveTo(w * 0.18, h * 0.56); x.lineTo(w * 0.26, h * 0.45); x.lineTo(w * 0.34, h * 0.56); x.fill();
  }, `jigsaw-${T.name}`);
  if (tex) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1 / W, 1 / H); }
  const topM = tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }) : c.m(0);
  const sideM = v.foam ? c.m(1) : toyMat('soft', '#d9cdb4');
  // edge signs: horizontal edges hEdge[i][j] between rows, vertical between cols
  const hE = Array.from({ length: ny + 1 }, (_, j) => Array.from({ length: nx }, () => (j === 0 || j === ny ? 0 : r() < 0.5 ? 1 : -1)));
  const vE = Array.from({ length: ny }, () => Array.from({ length: nx + 1 }, (_, i) => (i === 0 || i === nx ? 0 : r() < 0.5 ? 1 : -1)));
  const placed = variant === 'half-done' ? (i, j) => i + j < (nx + ny) * 0.55 : variant === 'scattered-pieces' ? () => false : () => true;
  const board = group('puzzle', { parent: root });
  let base = 0;
  if (v.box) {
    // puzzle box bottom (hollow tray) with the finished puzzle inside it, lid leaning beside
    const t = 0.004;
    const bw = W + 0.02;
    const bd = H + 0.02;
    const bh = 0.035;
    const bm = toyMat('soft', T.pal[5]);
    mesh(roundedBox(bw, t, bd, 0.0015), bm, { parent: root, at: [0, t / 2, 0] });
    for (const sz of [-1, 1]) mesh(roundedBox(bw, bh, t, 0.0015), bm, { parent: root, at: [0, bh / 2, sz * (bd / 2 - t / 2)] });
    for (const sx of [-1, 1]) mesh(roundedBox(t, bh, bd - 2 * t, 0.0015), bm, { parent: root, at: [sx * (bw / 2 - t / 2), bh / 2, 0] });
    // lid lying beside, picture up
    const lid = group('lid', { parent: root, at: [0, 0, bd + 0.03] });
    const lt = tex ? tex.clone() : null;
    if (lt) { lt.repeat.set(1, 1); lt.wrapS = lt.wrapT = THREE.ClampToEdgeWrapping; lt.needsUpdate = true; }
    const lw = bw + 0.006;
    const ld = bd + 0.006;
    mesh(new THREE.BoxGeometry(lw, 0.003, ld), [bm, bm, lt ? new THREE.MeshStandardMaterial({ map: lt, roughness: 0.5 }) : c.m(0), bm, bm, bm], { parent: lid, at: [0, bh + 0.0015, 0] });
    for (const sx of [-1, 1]) mesh(roundedBox(0.003, bh, ld, 0.0012), bm, { parent: lid, at: [sx * (lw / 2 - 0.0015), bh / 2, 0] });
    for (const sz of [-1, 1]) mesh(roundedBox(lw, bh, 0.003, 0.0012), bm, { parent: lid, at: [0, bh / 2, sz * (ld / 2 - 0.0015)] });
    base = t;
  } else if (variant === 'half-done') {
    mesh(roundedBox(W + 0.06, 0.004, H + 0.06, 0.002), toyMat('plush', '#2b4a3a'), { parent: root, at: [0, 0.002, 0] });
    base = 0.004;
  }
  board.position.set(-W / 2, base, H / 2);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const edges = [-hE[j][i], vE[j][i + 1], hE[j + 1][i], -vE[j][i]];
    const geo = extrudeOutline(pieceShape(i * s, j * s, s, edges), thick, { bevel: thick * 0.15, segments: 1 }).rotateX(-Math.PI / 2).translate(0, thick / 2, 0);
    const p = mesh(geo, [topM, sideM], { parent: board });
    if (!placed(i, j)) {
      // loose piece somewhere beside the puzzle, maybe flipped around
      p.geometry.translate(-(i + 0.5) * s, 0, (j + 0.5) * s);
      const a = r() * Math.PI * 2;
      const rad = Math.max(W, H) * (0.62 + r() * 0.3);
      p.position.set(W / 2 + Math.cos(a) * rad * (variant === 'scattered-pieces' ? 0.6 : 1), 0 - base, -H / 2 + Math.sin(a) * rad * (variant === 'scattered-pieces' ? 0.6 : 1));
      p.rotation.y = r() * Math.PI * 2;
    }
  }
  void CHROME; void moveTrack; void spinTrack;
}, { base: 'classic' });

/* ============================== TWISTY CUBE PUZZLES ============================== */
export const CUBE_VARIANTS = {
  'pocket-2x2': { n: [2, 2, 2] }, 'classic-3x3': { n: [3, 3, 3] }, 'master-4x4': { n: [4, 4, 4] },
  'scrambled-3x3': { n: [3, 3, 3], scramble: true }, 'tower-2x2x4': { n: [2, 4, 2] },
};
const FACE_COLS = ['#f5f5f2', '#ffd400', '#d81e1e', '#ff7a00', '#1f5bd6', '#14a046'];

export const createPuzzleCube = toyFactory('puzzle-cube', CUBE_VARIANTS, (c) => {
  const { root, v, T, r } = c;
  const [nx, ny, nz] = v.n;
  const q = 0.019; // cubie pitch
  const bodyM = T.kind === 'clear' ? toyMat('clear', T.pal[4]) : T.kind === 'rawwood' ? toyMat('rawwood', 'maple') : T.kind === 'gold' ? toyMat('gold', T.pal[0]) : T.name === 'pastel' || T.name === 'candy' ? toyMat('soft', '#fafafa') : BLACK;
  const cols = T.name === 'base' || T.name === 'classic' || T.kind === 'rawwood' || T.kind === 'gold' ? FACE_COLS : [T.pal[4] === '#2a2238' ? '#ffffff' : T.pal[4], T.pal[2], T.pal[0], T.pal[3], T.pal[1], T.pal[5] === '#0d0b12' ? '#7a3cff' : T.pal[5]];
  const stickerKind = T.kind === 'neon' || T.kind === 'glow' ? T.kind : T.kind === 'rawwood' ? 'wood' : T.kind === 'gold' ? 'metal' : 'soft';
  const sm = cols.map((col) => toyMat(stickerKind, col));
  const size = [nx * q, ny * q, nz * q];
  const ext = (i, n) => (i - (n - 1) / 2) * q;
  const parts = { top: { body: [], st: cols.map(() => []) }, rest: { body: [], st: cols.map(() => []) } };
  const sw = q * 0.84;
  const sth = 0.0012;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    if (i > 0 && i < nx - 1 && j > 0 && j < ny - 1 && k > 0 && k < nz - 1) continue;
    const P = parts[j === ny - 1 ? 'top' : 'rest'];
    const x = ext(i, nx);
    const y = ext(j, ny) + size[1] / 2;
    const z = ext(k, nz);
    P.body.push(roundedBox(q * 0.985, q * 0.985, q * 0.985, q * 0.14, 2).translate(x, y, z));
    const faces = [];
    if (j === ny - 1) faces.push([0, [0, 1, 0]]);
    if (j === 0) faces.push([1, [0, -1, 0]]);
    if (k === nz - 1) faces.push([2, [0, 0, 1]]);
    if (k === 0) faces.push([3, [0, 0, -1]]);
    if (i === nx - 1) faces.push([4, [1, 0, 0]]);
    if (i === 0) faces.push([5, [-1, 0, 0]]);
    for (let [fi, n] of faces) {
      if (v.scramble) fi = Math.floor(r() * 6);
      const g = roundedBox(sw, sth, sw, sth * 0.45, 1);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...n)));
      g.translate(x + n[0] * q * 0.49, y + n[1] * q * 0.49, z + n[2] * q * 0.49);
      P.st[fi].push(g);
    }
  }
  const topG = group('top_layer', { parent: root });
  const restG = group('cube_body', { parent: root });
  for (const [key, g] of [['top', topG], ['rest', restG]]) {
    merged(parts[key].body, bodyM, { parent: g });
    parts[key].st.forEach((list, i) => { if (list.length) merged(list, sm[i], { parent: g }); });
  }
  if (T.style === 'mini' || T.name === 'travel') {
    // keyring through a corner loop
    mesh(new THREE.TorusGeometry(0.006, 0.0012, 6, 14), CHROME, { parent: restG, at: [size[0] / 2 + 0.004, size[1] - q * 0.2, size[2] / 2 - 0.003], rot: [0, Math.PI / 4, 0] });
    mesh(new THREE.TorusGeometry(0.014, 0.0012, 6, 24), CHROME, { parent: restG, at: [size[0] / 2 + 0.017, size[1] - q * 0.2, size[2] / 2 - 0.003], rot: [Math.PI / 2, 0, 0] });
  }
  if (T.style === 'luxe') {
    mesh(lathe([[0, 0], [size[0] * 0.75, 0], [size[0] * 0.78, 0.006], [size[0] * 0.55, 0.012], [0, 0.012]], 4).rotateY(Math.PI / 4), toyMat('rawwood', 'walnut'), { parent: root });
    topG.position.y = restG.position.y = 0.012;
  }
  c.anims.push(clip('twist', 3, [rotateTrack(topG, 'y', 3, (u) => (u < 0.4 ? (u / 0.4) * Math.PI / 2 : u < 0.6 ? Math.PI / 2 : Math.PI / 2 * (1 - (u - 0.6) / 0.4)))]));
}, { base: 'classic' });
