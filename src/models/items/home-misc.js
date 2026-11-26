// Home group, part 3: toilet paper, tissue boxes, candles & matches, light bulbs.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, extrudeOutline, tube, setup, done, fin, tm, hw, anims, vessel, openBox, slab, labelPlane, textDraw, clip, lampGroup, lampTracks, LAMP_ON, scaleTrack, moveTrack, numberTrack, wave } from './common.js';
import { flame, wick } from './home-util.js';

/* ================================ TOILET PAPER ================================ */

export const TOILET_PAPER_VARIANTS = { roll: {}, 'four-pack': {}, 'roll-on-holder': {}, 'paper-towel-roll': {} };

/** Paper roll standing upright: annulus lathe with cardboard core visible. */
function paperRoll(parent, R, H, paperM, at = [0, 0, 0], { core = 0.021, tail = 0 } = {}) {
  const g = group('roll', { parent, at });
  const prof = [[core, 0], [R - 0.002, 0], [R, 0.002], [R, H - 0.002], [R - 0.002, H], [core, H], [core, 0]];
  mesh(lathe(prof, 40), paperM, { parent: g, name: 'paper' });
  mesh(vessel([[core, 0], [core, H]], 0.0015, 0, 24).translate(0, 0, 0), M.matte('#b58a57'), { parent: g, name: 'core' });
  if (tail) {
    // loose sheet hanging down the side
    const sheet = mesh(roundedBox(H * 0.92, tail, 0.0012, 0.0005), paperM, { parent: g, at: [0, H * 0.7 - tail / 2, R + 0.0008] });
    sheet.scale.set(1, 1, 1);
  }
  return g;
}

export function createToiletPaper(options = {}) {
  const { o, variant, T } = setup(options, TOILET_PAPER_VARIANTS, 'toilet-paper', { p: '#f7f6f2', s: '#9ab7d3', a: '#c9ccd2', mat: 'paper' });
  const root = group(`toilet-paper-${variant}`);
  const k = T.k;
  const paperM = fin(T, T.p, 'paper', { pattern: T.pattern });
  const R = 0.056 * k * (T.chunky ? 1.15 : 1) * T.w, H = 0.1 * k * T.h;
  if (variant === 'roll') {
    paperRoll(root, R, H, paperM, [0, 0, 0]);
    // unrolled tail lying on the floor
    const tl = 0.18 * k;
    mesh(drapeTail(R, H, tl), paperM, { parent: root });
  } else if (variant === 'four-pack') {
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) paperRoll(root, R, H, paperM, [x * R, 0, z * R]);
    if (T.k > 1.1) for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) paperRoll(root, R, H, paperM, [x * R, H, z * R]);
    const n = T.k > 1.1 ? 2 : 1;
    // shrink-wrap film (transparent) + printed band
    mesh(roundedBox(R * 4 + 0.006, H * n + 0.004, R * 4 + 0.006, R * 0.9, 4), new THREE.MeshPhysicalMaterial({ name: 'film', color: '#ffffff', transparent: true, opacity: 0.22, roughness: 0.1, clearcoat: 1 }), { parent: root, at: [0, (H * n + 0.004) / 2, 0] });
    const lab = labelPlane(R * 2.4, H * 0.6, textDraw(['SOFT', `${4 * n} rolls`], { bg: T.s, fg: '#ffffff' }), { bg: T.s });
    lab.position.set(0, H * n * 0.55, R * 2 + 0.0035);
    root.add(lab);
  } else if (variant === 'roll-on-holder') {
    // freestanding holder: weighted base, post, roll + spares
    const hm = T.mat === 'wood' ? fin(T, '#a5733f', 'wood') : T.lux ? M.metal('#d6a93c', 0.2) : T.trim === 'black' ? M.metal('#1e1e1e', 0.3) : M.chrome();
    const Hp = H * 3.3;
    mesh(lathe([[0, 0], [0.085 * k, 0], [0.088 * k, 0.006], [0.082 * k, 0.014], [0, 0.016]], 40), hm, { parent: root });
    tube([0, 0.014, 0], [0, Hp, 0], 0.008, hm, { parent: root });
    mesh(new THREE.SphereGeometry(0.014, 12, 10), hm, { parent: root, at: [0, Hp, 0] });
    for (let i = 0; i < 3; i++) paperRoll(root, R, H, paperM, [0, 0.016 + i * H, 0], { core: 0.021, tail: i === 2 ? H * 1.2 : 0 });
  } else {
    // kitchen paper towel roll on a stand
    const hm = T.mat === 'wood' || T.trim === 'kraft' ? fin(T, '#a5733f', 'wood') : T.trim === 'black' ? M.metal('#1e1e1e', 0.3) : M.metal('#c9ccd2', 0.25);
    const Rt = 0.065 * k * T.w, Ht = 0.28 * k * T.h;
    mesh(lathe([[0, 0], [0.08 * k, 0], [0.08 * k, 0.012], [0, 0.014]], 40), hm, { parent: root });
    tube([0, 0.012, 0], [0, Ht + 0.04, 0], 0.007, hm, { parent: root });
    mesh(new THREE.SphereGeometry(0.013, 12, 10), hm, { parent: root, at: [0, Ht + 0.04, 0] });
    const ptM = fin(T, T.p, 'paper', { pattern: T.pattern ?? (T.trim ? null : 'dots') });
    paperRoll(root, Rt, Ht, ptM, [0, 0.014, 0], { core: 0.02, tail: Ht * 0.5 });
  }
  return done(root, 'toilet-paper', variant, o);
}

/** Flat paper tail running from the roll's side down onto the floor. */
function drapeTail(R, H, L) {
  const w = H * 0.92;
  const pts = [new THREE.Vector3(0, H * 0.6, R + 0.0012), new THREE.Vector3(0, H * 0.3, R + 0.003), new THREE.Vector3(0, 0.004, R + 0.03), new THREE.Vector3(0, 0.0008, R + L)];
  const curve = new THREE.CatmullRomCurve3(pts);
  const n = 24;
  const pos = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const p = curve.getPoint(i / n);
    pos.push(-w / 2, p.y, p.z, w / 2, p.y, p.z);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ================================ TISSUE BOX ================================ */

export const TISSUE_BOX_VARIANTS = { cube: {}, long: {}, 'pocket-pack': {} };

/** Tissue poking out: thin puffed sheet pinched at the bottom. */
function tissueGeo(w, h) {
  const g = new THREE.PlaneGeometry(w, h, 12, 10);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i) + h / 2;
    const t = y / h;
    p.setXYZ(i, x * (0.35 + 0.65 * Math.sin(Math.min(1, t * 1.3) * Math.PI / 2)), y, Math.sin(x / w * 7 + t * 3) * 0.008 * t + Math.sin(t * 3.1) * 0.01);
  }
  g.computeVertexNormals();
  return g;
}

export function createTissueBox(options = {}) {
  const { o, variant, T } = setup(options, TISSUE_BOX_VARIANTS, 'tissue-box', { p: '#7fb6c9', s: '#f7f6f2', a: '#2f6f6a', mat: 'paper' });
  const root = group(`tissue-box-${variant}`);
  const k = T.k;
  const tissueM = new THREE.MeshStandardMaterial({ name: 'tissue', color: T.trim === 'pastel' ? '#fbeff4' : '#fbfbf8', roughness: 1, side: THREE.DoubleSide });
  const boxM = T.mat === 'wood' ? fin(T, T.p, 'wood') : T.mat === 'leather' ? fin(T, T.p, 'leather') : T.mat === 'ceramic' ? fin(T, T.p, 'ceramic') : fin(T, T.p, T.mat === 'plastic' ? 'plastic' : 'paper', { pattern: T.pattern });
  if (variant === 'pocket-pack') {
    const W = 0.11 * k * T.w, D = 0.055 * k, H = 0.028 * k * T.h;
    mesh(cushion(W, H, D, { radius: H * 0.45, bulge: 0.4 }), fin(T, T.p, 'plastic', { pattern: T.pattern }), { parent: root, at: [0, H / 2, 0] });
    mesh(roundedBox(W * 0.6, 0.002, D * 0.7, 0.0009), fin(T, T.s, 'plastic'), { parent: root, at: [0, H + H * 0.18 - 0.001, 0] });
    const t = mesh(tissueGeo(W * 0.4, 0.02), tissueM, { parent: root, at: [0, H + H * 0.18 - 0.002, 0], rot: [0, 0, 0] });
    t.scale.set(1, 0.8, 1);
  } else {
    const long = variant === 'long';
    const W = (long ? 0.24 : 0.12) * k * T.w, D = (long ? 0.12 : 0.12) * k, H = (long ? 0.09 : 0.13) * k * T.h;
    const r = 0.004 * T.round * (T.chunky ? 2 : 1);
    mesh(roundedBox(W, H, D, r), boxM, { parent: root, at: [0, H / 2, 0], name: 'box' });
    // oval opening (dark slot with film edges) on the top
    mesh(new THREE.CircleGeometry(1, 32).scale(W * (long ? 0.32 : 0.3), D * 0.22, 1), M.matte('#d8d4cc'), { parent: root, at: [0, H + 0.0006, 0], rot: [-Math.PI / 2, 0, 0] });
    mesh(new THREE.TorusGeometry(1, 0.03, 4, 32).scale(W * (long ? 0.32 : 0.3), D * 0.22, 0.03), fin(T, T.s, 'paper'), { parent: root, at: [0, H + 0.0006, 0], rot: [-Math.PI / 2, 0, 0] });
    const ts = mesh(tissueGeo(W * (long ? 0.45 : 0.5), 0.07 * k), tissueM, { parent: root, at: [0, H - 0.002, 0], rot: [0, long ? 0 : 0.3, 0], name: 'tissue' });
    void ts;
    if (T.mat === 'wood' || T.lux) mesh(roundedBox(W + 0.004, 0.01, D + 0.004, 0.003), T.lux ? M.metal('#d6a93c', 0.2) : fin(T, T.s, 'wood'), { parent: root, at: [0, 0.005, 0] });
    if (T.mat === 'paper' && !T.pattern) {
      const lab = labelPlane(W * 0.7, H * 0.4, textDraw(['tissues', '2-ply · soft'], { bg: T.p, fg: '#ffffff' }), { bg: T.p });
      lab.position.set(0, H * 0.5, D / 2 + 0.0005);
      root.add(lab);
    }
  }
  return done(root, 'tissue-box', variant, o);
}

/* ================================ CANDLE ================================ */

export const CANDLE_VARIANTS = { pillar: {}, 'taper-in-holder': {}, 'tea-light': {}, 'jar-candle': {}, 'birthday-candles': {}, matchbox: {}, matchbook: {} };

const flicker = () => [clip('on', 1.2, [numberTrack('flame.material.emissiveIntensity', 1.2, (t) => LAMP_ON.amber * (1 + 0.18 * wave(t, 3) * wave(t, 2))), numberTrack('flame_glow.material.opacity', 1.2, (t) => 0.8 + 0.1 * wave(t, 3))])];

export function createCandle(options = {}) {
  const { o, variant, T } = setup(options, CANDLE_VARIANTS, 'candle', { p: '#f4ecd8', s: '#b8913f', a: '#8a2f22', mat: 'matte' });
  const root = group(`candle-${variant}`);
  const k = T.k;
  const wax = new THREE.MeshPhysicalMaterial({ name: 'wax', color: M.toColor(T.p), roughness: 0.55, transmission: 0, sheen: 0.3, clearcoat: 0.15 });
  if (T.worn) wax.color.lerp(new THREE.Color('#d8c8a8'), 0.3);
  const holderM = T.mat === 'ceramic' ? fin(T, T.s, 'ceramic') : T.mat === 'glass' ? fin(T, '#d9eef2', 'glass') : T.mat === 'wood' ? fin(T, T.s, 'wood') : T.lux || T.trim === 'gold' ? M.metal('#d6a93c', 0.2) : T.trim === 'black' ? M.metal('#1e1e1e', 0.35) : M.metal('#b8913f', 0.3);
  const lit = [];
  const fg = lampGroup('flame', 'amber');
  const light = (x, y, z, s = 1) => {
    wick(root, x, y, z, 0.012 * s);
    flame(root, [x + 0.0018 * s, y + 0.012 * s, z], s, 'flame', fg);
    lit.push(1);
  };
  let animations = [];
  if (variant === 'pillar') {
    const R = 0.038 * k * T.w * (T.chunky ? 1.3 : 1), H = 0.15 * k * T.h * (T.slim ? 1.3 : 1);
    const dip = 0.008;
    const prof = [[0, 0], [R - 0.002, 0], [R, 0.002], [R, H], [R - 0.004, H + 0.0015], [R * 0.6, H - dip * 0.6], [0, H - dip]];
    mesh(lathe(prof, 40), wax, { parent: root, name: 'wax' });
    if (T.worn) for (let i = 0; i < 4; i++) { const a = i * 1.7; curveTube([[Math.cos(a) * R, H, Math.sin(a) * R], [Math.cos(a) * (R + 0.002), H - 0.02 - i * 0.01, Math.sin(a) * (R + 0.002)]], 0.003, wax, { parent: root, segments: 6 }); }
    if (T.detail >= 1 || T.lux) mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.016, 0.01, 40), holderM, { parent: root, at: [0, -0.005, 0] });
    if (T.pattern) mesh(new THREE.CylinderGeometry(R * 1.003, R * 1.003, H * 0.4, 40, 1, true), fin(T, T.p, 'paper', { pattern: T.pattern }), { parent: root, at: [0, H * 0.45, 0] });
    light(0, H - dip, 0);
  } else if (variant === 'taper-in-holder') {
    const Hh = 0.13 * k * T.h, Ht = 0.22 * k * T.h;
    const prof = T.mat === 'glass' || T.slim ? [[0, 0], [0.05, 0], [0.05, 0.008], [0.012, 0.02], [0.01, Hh * 0.8], [0.02, Hh], [0.011, Hh], [0.011, Hh - 0.02], [0, Hh - 0.02]]
      : [[0, 0], [0.055, 0], [0.058, 0.01], [0.04, 0.02], [0.015, 0.035], [0.02, Hh * 0.45], [0.012, Hh * 0.6], [0.018, Hh * 0.85], [0.03, Hh * 0.95], [0.03, Hh], [0.011, Hh], [0.011, Hh - 0.02], [0, Hh - 0.02]];
    mesh(lathe(prof.map(([r, y]) => [r * k * (T.chunky ? 1.2 : 1), y]), 40), holderM, { parent: root, name: 'holder' });
    const r = 0.0105 * k * (T.chunky ? 1.2 : 1);
    mesh(lathe([[0, 0], [r, 0], [r, Ht * 0.9], [r * 0.6, Ht], [0, Ht]], 24), wax, { parent: root, at: [0, Hh - 0.02, 0], name: 'taper' });
    if (T.lux || T.detail >= 2) mesh(new THREE.TorusGeometry(0.03 * k, 0.003, 6, 24), holderM, { parent: root, at: [0, Hh, 0], rot: [Math.PI / 2, 0, 0] });
    light(0, Hh - 0.02 + Ht - 0.001, 0, 0.9);
  } else if (variant === 'tea-light') {
    const n = T.k > 1.1 ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 0.05;
      const R = 0.019 * (T.k > 1.1 ? 1 : k), H = 0.016;
      mesh(vessel([[R, 0], [R, H]], 0.0006, 0.0006, 32), M.metal('#d8dadf', 0.3), { parent: root, at: [x, 0, 0] });
      mesh(new THREE.CylinderGeometry(R - 0.0008, R - 0.0008, H - 0.002, 32), wax, { parent: root, at: [x, (H - 0.002) / 2 + 0.0006, 0] });
      if (i === 0) light(x, H - 0.0014, 0, 0.7);
      else wick(root, x, H - 0.0014, 0, 0.008);
    }
    if (T.mat === 'glass' || T.mat === 'ceramic' || T.lux) {
      // votive cup around the first tea light
      mesh(vessel([[0.026, 0], [0.03, 0.06]], 0.003, 0.004, 32), T.mat === 'ceramic' ? holderM : fin(T, T.lux ? '#d6a93c' : '#e8d8b8', 'glass'), { parent: root, at: [-((n - 1) / 2) * 0.05, -0.004, 0] });
    }
  } else if (variant === 'jar-candle') {
    const R = 0.042 * k * T.w, H = 0.1 * k * T.h;
    const jarM = T.mat === 'ceramic' ? fin(T, T.s, 'ceramic') : T.mat === 'metal' || T.trim === 'black' ? M.metal(T.trim === 'black' ? '#1e1e1e' : '#c9ccd2', 0.3) : fin(T, T.a === '#8a2f22' ? '#d6e8ec' : T.a, 'glass');
    mesh(vessel([[R * 0.95, 0], [R, 0.01], [R, H * 0.85], [R * 0.85, H]], 0.003, 0.006, 40), jarM, { parent: root, name: 'jar' });
    mesh(new THREE.CylinderGeometry(R - 0.003, R - 0.003, H * 0.6, 40), wax, { parent: root, at: [0, 0.006 + H * 0.3, 0] });
    const lab = labelPlane(R * 1.2, H * 0.35, textDraw(['vanilla', 'soy candle'], { bg: '#f4ecd8', fg: '#3a2c1e' }), { bg: '#f4ecd8' });
    lab.position.set(0, H * 0.45, R + 0.0006);
    root.add(lab);
    // lid set beside the jar
    mesh(lathe([[0, 0], [R * 0.9, 0], [R * 0.9, 0.012], [0, 0.014]], 32), T.mat === 'wood' ? fin(T, '#a5733f', 'wood') : M.metal('#b8913f', 0.3), { parent: root, at: [R * 2.3, 0, 0] });
    light(0, 0.006 + H * 0.6, 0, 0.9);
  } else if (variant === 'birthday-candles') {
    // a few twisted candles in plastic holders on a small cake
    const cR = 0.07 * k * T.w, cH = 0.045 * k;
    mesh(lathe([[0, 0], [cR, 0], [cR, cH], [cR - 0.004, cH + 0.004], [0, cH + 0.004]], 40), M.matte('#f6e3d0'), { parent: root, name: 'cake' });
    mesh(new THREE.TorusGeometry(cR - 0.003, 0.005, 6, 40), M.matte(T.s), { parent: root, at: [0, cH + 0.002, 0], rot: [Math.PI / 2, 0, 0] });
    const n = 5;
    const cols = [T.p, T.s, T.a, '#3fb6ff', '#ffd23f'];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = Math.cos(a) * cR * 0.5, z = Math.sin(a) * cR * 0.5;
      const ch = 0.055 * T.h;
      mesh(new THREE.ConeGeometry(0.006, 0.01, 8), M.plastic(cols[(i + 1) % n]), { parent: root, at: [x, cH + 0.004 + 0.005, z], rot: [Math.PI, 0, 0] });
      const c = mesh(new THREE.CylinderGeometry(0.0028, 0.0028, ch, 8), M.matte(cols[i]), { parent: root, at: [x, cH + 0.006 + ch / 2, z] });
      void c;
      curveTube(Array.from({ length: 12 }, (_, j) => [x + Math.cos(j * 1.2) * 0.003, cH + 0.006 + (j / 11) * ch, z + Math.sin(j * 1.2) * 0.003]), 0.0009, M.matte('#ffffff'), { parent: root, segments: 24, radialSegments: 4 });
      light(x, cH + 0.006 + ch, z, 0.55);
    }
  } else if (variant === 'matchbox') {
    const W = 0.053 * k * T.w, D = 0.037 * k, H = 0.016 * k * T.h;
    const boxM = fin(T, T.p === '#f4ecd8' ? '#c8302a' : T.p, 'paper');
    // outer sleeve (open both ends): top + bottom + two sides
    const sleeve = group('sleeve', { parent: root });
    mesh(roundedBox(W, 0.0008, D, 0.0003), boxM, { parent: sleeve, at: [0, H - 0.0004, 0] });
    mesh(roundedBox(W, 0.0008, D, 0.0003), boxM, { parent: sleeve, at: [0, 0.0004, 0] });
    for (const s of [-1, 1]) mesh(roundedBox(W, H, 0.0008, 0.0003), new THREE.MeshStandardMaterial({ name: 'striker', color: '#5a3a2a', roughness: 1 }), { parent: sleeve, at: [0, H / 2, s * (D / 2 - 0.0004)] });
    const lab = labelPlane(W * 0.8, D * 0.7, textDraw(['SAFETY', 'MATCHES'], { bg: T.s === '#b8913f' ? '#f4e3a1' : T.s, fg: '#1d1d1d' }), { bg: '#f4e3a1' });
    lab.rotation.x = -Math.PI / 2; lab.position.set(0, H + 0.0002, 0); sleeve.add(lab);
    // drawer slid out, with matches
    const drawer = group('drawer', { parent: root, at: [W * 0.45, 0.0009, 0] });
    openBox(W - 0.002, H - 0.0022, D - 0.0022, 0.0007, M.matte('#e9dcc0'), { parent: drawer, r: 0.0005, name: 'tray' });
    const nm = T.k > 1.1 ? 12 : 8;
    for (let i = 0; i < nm; i++) {
      const z = -D / 2 + 0.004 + (i % 6) * (D - 0.008) / 5;
      const y = 0.0015 + Math.floor(i / 6) * 0.0022;
      mesh(new THREE.BoxGeometry(W * 0.92, 0.0019, 0.0019), M.wood('#e2c48e'), { parent: drawer, at: [-0.002, y + 0.0008, z] });
      mesh(new THREE.SphereGeometry(0.0021, 8, 6).scale(1.5, 1, 1), M.matte(T.a), { parent: drawer, at: [W * 0.45 - 0.002, y + 0.0008, z] });
    }
    animations = () => [clip('open', 3, [moveTrack(drawer, 3, (t) => [-W * 0.4 * (0.5 + 0.5 * Math.cos(t * Math.PI * 2)), 0, 0])])];
  } else {
    // matchbook: folded card cover, opened, rows of paper matches
    const W = 0.04 * k * T.w, L = 0.05 * k * T.h;
    const cm = fin(T, T.p === '#f4ecd8' ? '#1f3f73' : T.p, 'paper');
    mesh(roundedBox(W, 0.0012, L, 0.0004), cm, { parent: root, at: [0, 0.0006, 0] });
    mesh(roundedBox(W, 0.004, 0.008, 0.001), new THREE.MeshStandardMaterial({ name: 'striker', color: '#4a3226', roughness: 1 }), { parent: root, at: [0, 0.0032, L / 2 - 0.004] });
    // matches comb standing up from the staple line
    const comb = group('comb', { parent: root, at: [0, 0.005, L / 2 - 0.009] });
    for (let i = 0; i < 10; i++) {
      const x = -W / 2 + 0.002 + i * (W - 0.004) / 9;
      mesh(new THREE.BoxGeometry(0.0028, 0.0006, L * 0.75), M.matte('#e9dcc0'), { parent: comb, at: [x, 0, -L * 0.37], rot: [0.08, 0, 0] });
      mesh(new THREE.SphereGeometry(0.0022, 8, 6), M.matte(T.a), { parent: comb, at: [x, 0.0002, -L * 0.73] });
    }
    // open cover flap
    const flap = group('flap', { parent: root, at: [0, 0.001, -L / 2] });
    mesh(roundedBox(W, 0.0012, L, 0.0004), cm, { parent: flap, at: [0, L / 2 * Math.sin(0.9), -L / 2 * Math.cos(0.9)], rot: [-0.9, 0, 0] });
    const lab = labelPlane(W * 0.8, L * 0.6, textDraw(['HOTEL', '★'], { bg: T.s === '#b8913f' ? '#f2d38a' : T.s, fg: '#1d1d1d' }), { bg: '#f2d38a' });
    lab.rotation.x = -Math.PI / 2 - 0.9; lab.position.set(0, L / 2 * Math.sin(0.9) + 0.0008, -L / 2 * Math.cos(0.9)); flap.add(lab);
  }
  if (lit.length) animations = flicker;
  return done(root, 'candle', variant, o, animations);
}

/* ================================ LIGHT BULB ================================ */

export const LIGHT_BULB_VARIANTS = { 'classic-bulb': {}, 'led-bulb': {}, 'spiral-bulb': {}, 'edison-bulb': {}, 'globe-bulb': {}, 'tube-light': {} };

/** Screw base (E27): threaded metal + black insulator + contact. Returns top y. */
function screwBase(parent, r, h, metal) {
  mesh(new THREE.SphereGeometry(r * 0.35, 12, 8).scale(1, 0.5, 1), M.metal('#b8913f', 0.3), { parent, at: [0, r * 0.12, 0] });
  mesh(lathe([[r * 0.3, r * 0.08], [r * 0.6, r * 0.12], [r * 0.7, r * 0.3], [0, r * 0.3]], 20), M.plastic('#1a1a1a', 0.3), { parent });
  const prof = [[r * 0.7, r * 0.3]];
  const n = 4;
  for (let i = 0; i <= n * 4; i++) { const t = i / (n * 4); prof.push([r * (0.93 + 0.07 * Math.sin(t * n * Math.PI * 2)), r * 0.3 + t * h]); }
  prof.push([r * 1.02, r * 0.3 + h + r * 0.1], [0, r * 0.3 + h + r * 0.1]);
  mesh(lathe(prof, 28), metal, { parent, name: 'base' });
  return r * 0.3 + h + r * 0.1;
}

export function createLightBulb(options = {}) {
  const { o, variant, T } = setup(options, LIGHT_BULB_VARIANTS, 'light-bulb', { p: '#f6f4ec', s: '#c9ccd2', a: '#2a2b2e', mat: 'glass' });
  const root = group(`light-bulb-${variant}`);
  const k = T.k;
  const metal = T.trim === 'vintage' || variant === 'edison-bulb' ? M.metal('#b8913f', 0.3) : T.trim === 'black' ? M.metal('#2a2a2a', 0.3) : M.metal('#cfd2d6', 0.28);
  const kind = T.trim === 'vintage' || variant === 'edison-bulb' ? 'amber' : T.trim === 'pastel' ? 'fog' : 'white';
  const lamp = lampGroup('bulb', kind);
  if (T.trim === 'pastel') { lamp.lens.color = M.toColor(T.p); lamp.lens.emissive = M.toColor(T.p); }
  const r = 0.0135 * k;
  if (variant === 'tube-light') {
    // fluorescent tube lying on the floor with end caps & pins
    const L = 0.6 * k * T.w, R = 0.013 * k;
    const g = new THREE.CylinderGeometry(R, R, L, 24).rotateZ(Math.PI / 2).translate(0, R, 0);
    lamp.add(root, { geometry: g, normal: [0, 1, 0], depth: 0.01 });
    const card = root.children[root.children.length - 1]; card.scale.set(L * 3, 0.5, 1);
    for (const s of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.05, 0.025, 20).rotateZ(Math.PI / 2), metal, { parent: root, at: [s * (L / 2 + 0.012), R, 0] });
      for (const z of [-1, 1]) mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.008, 6).rotateZ(Math.PI / 2), M.metal('#d8b85a', 0.3), { parent: root, at: [s * (L / 2 + 0.028), R, z * 0.006] });
    }
    return done(root, 'light-bulb', variant, o, () => [clip('on', 1, lampTracks('bulb', LAMP_ON.white))]);
  }
  const top = screwBase(root, r, 0.022 * k, metal);
  let shell;
  if (variant === 'classic-bulb' || variant === 'globe-bulb' || variant === 'edison-bulb' || variant === 'led-bulb') {
    const R = (variant === 'globe-bulb' ? 0.06 : variant === 'edison-bulb' ? 0.032 : 0.03) * k * T.w;
    const H = (variant === 'edison-bulb' ? 0.1 : variant === 'globe-bulb' ? 0.11 : 0.075) * k * T.h;
    const prof = [];
    const neck = variant === 'led-bulb' ? r * 1.25 : r * 0.95;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      let rr;
      if (variant === 'edison-bulb') rr = neck + (R - neck) * Math.sin(Math.PI * Math.pow(t, 0.8)) ** 0.8 * (t > 0.5 ? 1 : 1);
      else if (variant === 'globe-bulb') rr = Math.sqrt(Math.max(0, 1 - ((t - 0.55) / 0.45) ** 2)) * R;
      else rr = t < 0.35 ? neck + (R * 0.62 - neck) * (t / 0.35) : R * Math.sqrt(Math.max(0, 1 - ((t - 0.65) / 0.35) ** 2)) * (t < 0.65 ? 0.62 + 0.38 * Math.sin(((t - 0.35) / 0.3) * Math.PI / 2) : 1);
      prof.push([Math.max(variant === 'globe-bulb' && t < 0.2 ? neck : 0.0005, rr), t * H]);
    }
    prof[0][0] = neck;
    prof[prof.length - 1][0] = 0;
    if (variant === 'led-bulb') {
      // plastic heat-sink collar + opaque diffuser dome
      mesh(lathe([[r * 1.02, 0], [r * 1.5, H * 0.18], [r * 1.9, H * 0.3], [0, H * 0.3]], 28), fin(T, T.trim === 'black' ? '#202020' : '#f2f2f0', 'plastic'), { parent: root, at: [0, top, 0] });
      const dome = lathe(prof.filter(([, y]) => y >= H * 0.29).map(([rr, y]) => [rr, y]), 32);
      dome.translate(0, top, 0);
      shell = lamp.add(root, { geometry: dome, normal: [0, 1, 0], depth: 0.02 });
      lamp.lens.transparent = false; lamp.lens.opacity = 1; lamp.lens.roughness = 0.6; lamp.lens.color = M.toColor(T.trim === 'pastel' ? T.p : '#fbfbf8');
    } else {
      const geo = lathe(prof, 36); geo.translate(0, top, 0);
      shell = lamp.add(root, { geometry: geo, normal: [0, 1, 0], depth: 0.02 });
      // inner stem + filament
      const fil = variant === 'edison-bulb' ? M.emissive('#ff9a3a', 0.6) : M.metal('#8a8a8a', 0.4);
      tube([0, top - 0.002, 0], [0, top + H * 0.45, 0], 0.0025, M.glass({ tint: '#e8f0f2', opacity: 0.5 }), { parent: root });
      if (variant === 'edison-bulb') {
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; curveTube([[0, top + H * 0.45, 0], [Math.cos(a) * R * 0.25, top + H * 0.6, Math.sin(a) * R * 0.25], [Math.cos(a) * R * 0.45, top + H * 0.78, Math.sin(a) * R * 0.45]], 0.0007, fil, { parent: root, segments: 8, radialSegments: 4 }); }
      } else curveTube([[-R * 0.3, top + H * 0.6, 0], [-R * 0.15, top + H * 0.45, 0], [0, top + H * 0.62, 0], [R * 0.15, top + H * 0.45, 0], [R * 0.3, top + H * 0.6, 0]], 0.0008, fil, { parent: root, segments: 16, radialSegments: 4 });
      if (variant !== 'edison-bulb') for (const s of [-1, 1]) tube([0, top + H * 0.45, 0], [s * R * 0.3, top + H * 0.6, 0], 0.0005, fil, { parent: root });
    }
    const card = root.children[root.children.length - 1];
    if (card.name.startsWith('bulb_glow')) { card.position.set(0, top + H * 0.6, 0.0); card.scale.setScalar(0.6 * k); }
  } else {
    // spiral CFL: ballast collar + spiral glass tube
    const H = 0.09 * k * T.h, R = 0.022 * k * T.w;
    mesh(lathe([[r * 1.02, 0], [r * 1.6, 0.012], [r * 1.8, 0.03], [0, 0.03]], 28), fin(T, '#f2f2f0', 'plastic'), { parent: root, at: [0, top, 0] });
    const pts = [];
    const turns = T.k > 1.1 ? 5 : 4;
    for (let i = 0; i <= turns * 16; i++) { const t = i / (turns * 16); const rr = R * (1 - 0.25 * Math.max(0, t - 0.75) * 4); pts.push(new THREE.Vector3(Math.cos(t * turns * Math.PI * 2) * rr, top + 0.03 + 0.005 + t * H, Math.sin(t * turns * Math.PI * 2) * rr)); }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 32, 0.0055 * k, 10, false);
    shell = lamp.add(root, { geometry: geo, normal: [0, 1, 0], depth: 0.02 });
    tube([0, top + 0.03, 0], [pts[0].x, pts[0].y, pts[0].z], 0.0055 * k, lamp.lens, { parent: root });
    const card = root.children[root.children.length - 2];
    if (card.name.startsWith('bulb_glow')) { card.position.set(0, top + 0.03 + H * 0.5, 0); card.scale.setScalar(0.6 * k); }
  }
  void shell;
  return done(root, 'light-bulb', variant, o, () => [clip('on', 1, lampTracks('bulb', LAMP_ON[kind] ?? 3))]);
}
