// Clothing on display: a single garment on a stand, a clothes rail, dress forms, full
// mannequins and folded stacks on a display table.
import { THREE, M, mesh, group, roundedBox, cushion, lathe, smoothKeys, setup, done, mainMat, fabricMat, taperTube, FABRIC_TRIMS, rng } from './common.js';
import { hungGarment, bodyProfile, torsoGeo, fitTop, fitBottom, ellipseRing } from './garments.js';
import { clip, rotateTrack, wave } from '../../core/animation.js';
import { brandEmblem } from '../../core/brand.js';

const GARMENT_DEFAULTS = {
  't-shirt': { kind: 'tshirt', c: '#f2f1ec' },
  shirt: { kind: 'shirt', c: '#cddff0' },
  jeans: { kind: 'jeans', fab: 'denim', c: '#34507c', c2: '#d9a441' },
  dress: { kind: 'dress', c: '#1f2a44' },
  jacket: { kind: 'jacket', fab: 'wool', c: '#4b5a46', c2: '#33402f' },
  coat: { kind: 'coat', fab: 'wool', c: '#b88b5a', c2: '#8e6a42' },
  hoodie: { kind: 'hoodie', c: '#8d949c' },
  suit: { kind: 'suit', fab: 'wool', c: '#2b3242', c2: '#1d2230' },
  skirt: { kind: 'skirt', c: '#3d3a4f' },
  sweater: { kind: 'sweater', fab: 'knit', c: '#9e3c35', c2: '#83302a' },
  scarf: { kind: 'scarf', fab: 'plaid', c: '#2f5d3e', c2: '#1c2a23', c3: '#d8b04a' },
  trousers: { kind: 'trousers', c: '#3a3a3e' },
};
export const HANGING_VARIANTS = Object.fromEntries(Object.entries(GARMENT_DEFAULTS).filter(([k]) => k !== 'trousers'));

const mix = (c, k, r) => { const col = M.toColor(c); const hsl = {}; col.getHSL(hsl); col.setHSL((hsl.h + (r() - 0.5) * 0.04 + 1) % 1, Math.min(1, hsl.s * (0.85 + r() * 0.3)), Math.min(0.92, Math.max(0.06, hsl.l + (r() - 0.5) * k))); return `#${col.getHexString()}`; };

/** Brushed-metal garment stand with a round weighted base. Hook rail at (0,H,0). */
function garmentStand(root, H, metalM) {
  const z0 = -0.095;
  mesh(lathe([[0, 0], [0.2, 0], [0.205, 0.008], [0.2, 0.02], [0.16, 0.03], [0.03, 0.035], [0, 0.035]], 48), metalM, { parent: root, at: [0, 0, z0] });
  mesh(new THREE.CylinderGeometry(0.013, 0.013, H - 0.03, 16), metalM, { parent: root, at: [0, (H + 0.03) / 2 + 0.006, z0] });
  mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.15, 12).rotateX(Math.PI / 2), metalM, { parent: root, at: [-0.003, H + 0.007, z0 + 0.06] });
  mesh(new THREE.SphereGeometry(0.016, 14, 10), metalM, { parent: root, at: [0, H + 0.007, z0] });
  mesh(new THREE.SphereGeometry(0.011, 12, 8), metalM, { parent: root, at: [-0.003, H + 0.007, z0 + 0.135] });
}

export function createHangingGarment(options = {}) {
  const { o, variant, trim, T } = setup(options, HANGING_VARIANTS, 'hanging-garment');
  const root = group(`hanging-garment-${variant}`);
  const H = 1.72;
  if (o.stand) garmentStand(root, H, trim === 'leather' || trim === 'neon' ? M.metal('#2a2b2e', 0.35) : trim === 'silk' || trim === 'velvet' ? M.metal('#c9a45a', 0.25) : M.metal('#b9bdc2', 0.3));
  const holder = group('garment_swing', { parent: root, at: [0, H, 0] });
  hungGarment(holder, T.kind, T, { hangerKind: T.kind === 'shirt' ? 'plastic' : 'wood' });
  if (!o.stand) {
    // pure garment: no stand, no hanger — laid flat on the floor, front facing up (a flat lay)
    const hangers = [];
    holder.traverse((n) => { if (n.name === 'hanger') hangers.push(n); });
    for (const hg of hangers) hg.parent.remove(hg);
    holder.rotation.x = -Math.PI / 2;
    holder.scale.z = 0.28; // empty fabric settles flat: front and back panels nearly touch
    root.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(holder);
    holder.position.set(holder.position.x, holder.position.y - b.min.y, holder.position.z - (b.min.z + b.max.z) / 2);
    return done(root, 'hanging-garment', variant, o, () => []);
  }
  return done(root, 'hanging-garment', variant, o, () => [clip('sway', 3, [rotateTrack(holder, 'z', 3, (t) => wave(t) * 0.02)])]);
}

/* ------------------------------ clothes rail ----------------------------- */

export const RAIL_VARIANTS = {
  tees: { kinds: ['t-shirt'], palette: ['#f2f1ec', '#1c1c1e', '#9aa3ad', '#2d4a7a', '#c8423a', '#e9c46a', '#4f7a5a'] },
  shirts: { kinds: ['shirt'], palette: ['#ffffff', '#cddff0', '#f3d9dc', '#e8e2cf', '#9fb7d9', '#bcd7c2'] },
  dresses: { kinds: ['dress'], palette: ['#1f2a44', '#b12c3a', '#e7b8c2', '#2c6b5b', '#f2e6cf', '#5d3a6b'] },
  coats: { kinds: ['coat', 'jacket'], palette: ['#b88b5a', '#2b2d33', '#5b6650', '#7a2d32', '#c9bfae', '#26324a'] },
  jeans: { kinds: ['jeans'], palette: ['#34507c', '#22324f', '#5f7fae', '#1a1d24', '#8aa2c4', '#3e4a5e'], fab: 'denim' },
  mixed: { kinds: ['t-shirt', 'shirt', 'hoodie', 'dress', 'jacket', 'sweater', 'suit'], palette: ['#f2f1ec', '#cddff0', '#8d949c', '#1f2a44', '#4b5a46', '#9e3c35', '#2b3242'] },
};

export function createClothesRail(options = {}) {
  const { o, variant, trim, T, V } = setup(options, RAIL_VARIANTS, 'clothes-rail');
  const root = group(`clothes-rail-${variant}`);
  const H = 1.62;
  const Lr = 1.5;
  const metalM = trim === 'leather' || trim === 'neon' ? M.metal('#202124', 0.4) : trim === 'silk' || trim === 'velvet' ? M.metal('#c9a45a', 0.25) : trim === 'linen' || trim === 'knit' ? M.wood('oak') : M.chrome();
  const wood = trim === 'linen' || trim === 'knit';
  const rr = wood ? 0.018 : 0.0127;
  for (const s of [-1, 1]) {
    const x = s * Lr / 2;
    mesh(wood ? roundedBox(0.04, H, 0.04, 0.008) : new THREE.CylinderGeometry(rr, rr, H - 0.06, 16), metalM, { parent: root, at: [x, wood ? H / 2 + 0.0 : (H - 0.06) / 2 + 0.06, 0] });
    mesh(wood ? roundedBox(0.05, 0.04, 0.6, 0.01) : new THREE.CylinderGeometry(rr, rr, 0.6, 16).rotateX(Math.PI / 2), metalM, { parent: root, at: [x, wood ? 0.02 : 0.075, 0] });
    if (!wood) {
      for (const z of [-0.28, 0.28]) {
        const c = group('caster', { parent: root, at: [x, 0, z] });
        mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 8), M.metal('#7d8086'), { parent: c, at: [0, 0.055, 0] });
        mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.022, 20).rotateZ(Math.PI / 2), M.rubber(), { parent: c, at: [0, 0.03, 0] });
      }
      mesh(new THREE.SphereGeometry(rr * 1.4, 12, 10), metalM, { parent: root, at: [x, H, 0] });
    }
  }
  mesh(wood ? roundedBox(Lr + 0.04, 0.036, 0.036, 0.012) : new THREE.CylinderGeometry(rr, rr, Lr, 16).rotateZ(Math.PI / 2), metalM, { parent: root, at: [0, H, 0], name: 'rail' });
  // garments: hooks over the rail (rail axis along X → garments rotate a quarter turn)
  const r = rng(`rail-${variant}-${trim}`);
  const n = variant === 'coats' ? 6 : 8;
  const hookLift = rr - 0.0127;
  const swing = group('garments', { parent: root, at: [0, H + 0.0 + hookLift, 0] });
  for (let i = 0; i < n; i++) {
    const name = V.kinds[i % V.kinds.length];
    const D = GARMENT_DEFAULTS[name];
    const base = trim ? { ...T, ...{ kind: D.kind }, c: mix(T.c, 0.25, r) } : { ...T, ...D, fab: V.fab ?? D.fab ?? 'cotton', c: o.color ? mix(o.color, 0.3, r) : V.palette[i % V.palette.length] };
    const x = -Lr / 2 + 0.12 + (i * (Lr - 0.24)) / (n - 1);
    hungGarment(swing, D.kind, base, { at: [x, -0.007, 0.003], rotY: Math.PI / 2 + (r() - 0.5) * 0.12, hangerKind: D.kind === 'jeans' ? 'clip' : wood ? 'wood' : 'plastic' });
  }
  return done(root, 'clothes-rail', variant, o, () => [clip('browse', 4, [rotateTrack(swing, 'x', 4, (t) => wave(t) * 0.015)])]);
}

/* -------------------------------- dress form ------------------------------ */

export const FORM_VARIANTS = {
  dress: { wear: 'dress', c: '#1f2a44' },
  gown: { wear: 'gown', fab: 'silk', c: '#7c1f35', c2: '#d8b46a' },
  jacket: { wear: 'jacket', fab: 'wool', c: '#4b5a46' },
  shirt: { wear: 'shirt', c: '#cddff0' },
  sweater: { wear: 'sweater', fab: 'knit', c: '#9e3c35', c2: '#83302a' },
  suit: { wear: 'suit', fab: 'wool', c: '#2b3242' },
  blank: { wear: null, c: '#d8c8a6' },
};

function formStand(root, y0, F, { tripod = true, metalM, woodM }) {
  // body
  const bodyM = fabricMat('linen', '#e2d6bd', { c2: '#b8a888', repeat: [3, 3], side: THREE.FrontSide });
  mesh(torsoGeo(F.prof, F.bottom, F.neckTop, { nv: 44 }), bodyM, { parent: root, at: [0, y0, 0], name: 'form' });
  const P0 = F.prof(F.bottom);
  const cap = new THREE.SphereGeometry(1, 32, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  cap.scale(P0.a, 0.04, P0.b);
  mesh(cap, bodyM, { parent: root, at: [0, y0 + F.bottom, P0.z] });
  const Pt = F.prof(F.neckTop);
  mesh(lathe([[0, 0], [Pt.a + 0.004, 0], [Pt.a + 0.006, 0.012], [Pt.a * 0.7, 0.03], [0.012, 0.045], [0.018, 0.06], [0, 0.07]], 32), woodM, { parent: root, at: [0, y0 + F.neckTop, Pt.z], name: 'neck_cap' });
  // pole + base
  const poleTop = y0 + F.bottom - 0.03;
  mesh(new THREE.CylinderGeometry(0.014, 0.014, poleTop - 0.05, 14), metalM, { parent: root, at: [0, (poleTop + 0.05) / 2, 0] });
  mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.06, 18), metalM, { parent: root, at: [0, poleTop + 0.02, 0] });
  if (tripod) {
    mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.1, 18), woodM, { parent: root, at: [0, 0.14, 0] });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
      const leg = taperTube([[0, 0.15, 0], [Math.cos(a) * 0.16, 0.08, Math.sin(a) * 0.16], [Math.cos(a) * 0.3, 0.02, Math.sin(a) * 0.3]], [0.02, 0.014], { seg: 10, radial: 10 });
      mesh(leg, woodM, { parent: root });
      mesh(new THREE.SphereGeometry(0.02, 12, 8), M.rubber(), { parent: root, at: [Math.cos(a) * 0.3, 0.02, Math.sin(a) * 0.3] });
    }
  } else {
    mesh(lathe([[0, 0], [0.24, 0], [0.245, 0.01], [0.22, 0.03], [0.05, 0.05], [0, 0.05]], 48), metalM, { parent: root });
  }
}

export function createDressForm(options = {}) {
  const { o, variant, trim, T, V } = setup(options, FORM_VARIANTS, 'dress-form');
  const root = group(`dress-form-${variant}`);
  const male = V.wear === 'suit' || V.wear === 'shirt' && !trim;
  const F = bodyProfile(male ? 'male' : 'female', 1);
  const y0 = 0.86;
  const woodM = trim === 'leather' || trim === 'neon' ? M.wood('black') : trim === 'linen' ? M.wood('oak') : M.wood('walnut');
  const metalM = trim === 'silk' || trim === 'velvet' ? M.metal('#c9a45a', 0.25) : trim === 'leather' ? M.metal('#2a2b2e', 0.35) : M.metal('#a9adb3', 0.3);
  formStand(root, y0, F, { tripod: variant !== 'gown', metalM, woodM });
  const wear = group('wear', { parent: root, at: [0, y0, 0] });
  if (V.wear) fitTop(wear, V.wear, T, F, { groundY: -y0 + 0.05 });
  else {
    // blank form with a measuring tape and pins
    const tapeM = new THREE.MeshStandardMaterial({ name: 'tape', color: '#f2d544', roughness: 0.6 });
    const P = F.prof(F.waistY);
    mesh(ellipseRing(P.a + 0.004, P.b + 0.004, 0.003, { y: F.waistY, z: P.z, flatY: 4 }), tapeM, { parent: wear });
    const sh = F.shoulderY;
    for (const s of [-1, 1]) mesh(taperTube([[s * 0.05, F.neckBase + 0.01, F.prof(F.neckBase).z - 0.05], [s * 0.07, F.neckBase + 0.012, F.prof(F.neckBase).z + 0.05], [s * 0.08, sh - 0.1, F.prof(sh - 0.1).z + F.prof(sh - 0.1).b + 0.002], [s * 0.07, sh - 0.35, F.prof(sh - 0.35).z + F.prof(sh - 0.35).b + 0.002]], 0.009, { flat: 0.2, up: [0, 0, 1], seg: 24, radial: 8 }), tapeM, { parent: wear });
    if (trim) fitTop(wear, 'dress', { ...T, len: 0.55, crop: false, flare: 1 }, F, { groundY: -y0 + 0.05 });
  }
  return done(root, 'dress-form', variant, o);
}

/* -------------------------------- mannequin ------------------------------- */

export const MANNEQUIN_VARIANTS = {
  female: { sex: 'female', top: 'dress', bottom: null, skin: '#f3f1ee', c: '#b12c3a' },
  male: { sex: 'male', top: 'shirt', bottom: 'trousers', skin: '#2b2b2e', c: '#cddff0', c2b: '#3a3a3e' },
  casual: { sex: 'male', top: 'hoodie', bottom: 'jeans', skin: '#d9c3a5', c: '#8d949c', c2b: '#34507c' },
  formal: { sex: 'male', top: 'suit', bottom: 'trousers', skin: '#c9ccd1', c: '#2b3242', fab: 'wool' },
  kid: { sex: 'female', top: 'tshirt', bottom: 'shorts', skin: '#f3f1ee', c: '#e9c46a', c2b: '#34507c', scale: 0.62 },
};

export function createMannequin(options = {}) {
  const { o, variant, trim, T, V } = setup(options, MANNEQUIN_VARIANTS, 'mannequin');
  const root = group(`mannequin-${variant}`);
  const s = V.scale ?? 1;
  const F = bodyProfile(V.sex, s);
  const Hc = (V.sex === 'male' ? 0.84 : 0.8) * s;
  const body = group('body', { parent: root, at: [0, Hc + 0.025, 0] });
  const skinM = new THREE.MeshPhysicalMaterial({ name: 'mannequin', color: M.toColor(V.skin), roughness: V.skin === '#2b2b2e' ? 0.55 : 0.25, clearcoat: 0.6, clearcoatRoughness: 0.2, metalness: V.skin === '#c9ccd1' ? 0.6 : 0 });
  mesh(torsoGeo(F.prof, F.bottom, F.neckTop, { nv: 44 }), skinM, { parent: body, name: 'torso' });
  const P0 = F.prof(F.bottom);
  const cap = new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  cap.scale(P0.a, 0.07 * s, P0.b);
  mesh(cap, skinM, { parent: body, at: [0, F.bottom, P0.z] });
  // head (abstract egg) + neck
  const head = new THREE.SphereGeometry(0.1 * s, 32, 20);
  head.scale(0.82, 1.18, 0.95);
  mesh(head, skinM, { parent: body, at: [0, F.neckTop + 0.085 * s, 0.01 * s], name: 'head' });
  // legs
  const legR = smoothKeys([[0, 0.088], [0.15, 0.078], [0.45, 0.05], [0.6, 0.056], [0.92, 0.034], [1, 0.032]]);
  const legs = { r: (t) => legR(t) * s };
  for (const [side, sx] of [['L', -1], ['R', 1]]) {
    legs[side] = [[sx * 0.085 * s, 0.03 * s, 0], [sx * 0.09 * s, -0.4 * s, 0.012 * s], [sx * 0.095 * s, -Hc + 0.075 * s, -0.012 * s]];
    mesh(taperTube(legs[side], legs.r, { seg: 24, radial: 16 }), skinM, { parent: body, name: 'leg' });
    const foot = new THREE.SphereGeometry(1, 20, 12);
    foot.scale(0.042 * s, 0.035 * s, 0.115 * s);
    mesh(foot, skinM, { parent: body, at: [sx * 0.097 * s, -Hc + 0.01 * s, 0.045 * s], name: 'foot' });
  }
  // arms
  const armR = smoothKeys([[0, 0.047], [0.45, 0.036], [0.55, 0.034], [1, 0.024]]);
  const arms = { r: (t) => armR(t) * s };
  for (const [side, sx] of [['L', -1], ['R', 1]]) {
    const ax = F.shoulderX;
    arms[side] = [[sx * (ax - 0.035 * s), F.shoulderY - 0.03 * s, 0], [sx * (ax + 0.0 * s), F.shoulderY - 0.18 * s, -0.012 * s], [sx * (ax + 0.012 * s), F.shoulderY - 0.3 * s, -0.02 * s], [sx * (ax + 0.03 * s), F.shoulderY - 0.56 * s, 0.035 * s]];
    mesh(taperTube(arms[side], arms.r, { seg: 24, radial: 14 }), skinM, { parent: body, name: 'arm' });
    const hand = new THREE.SphereGeometry(1, 16, 12);
    hand.scale(0.022 * s, 0.075 * s, 0.045 * s);
    const w = arms[side][3];
    mesh(hand, skinM, { parent: body, at: [w[0] + sx * 0.003, w[1] - 0.065 * s, w[2] + 0.005], name: 'hand' });
  }
  // stand: low disc + rod into the calf
  const baseM = trim === 'silk' || trim === 'velvet' ? M.metal('#c9a45a', 0.25) : trim === 'leather' || trim === 'neon' ? M.metal('#202124', 0.35) : M.chrome();
  mesh(lathe([[0, 0], [0.26 * Math.max(0.8, s), 0], [0.265 * Math.max(0.8, s), 0.01], [0.25 * Math.max(0.8, s), 0.025], [0, 0.025]], 48), baseM, { parent: root });
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36 * s, 10), baseM, { parent: root, at: [0.095 * s, 0.025 + 0.18 * s, -0.05 * s] });
  // clothes
  const top = { ...T };
  const bot = trim ? { ...T, c: T.fab === 'denim' ? '#22324f' : mix(T.c2 ?? T.c, 0.3, T.r) } : { ...T, c: V.c2b ?? T.c, fab: V.bottom === 'jeans' ? 'denim' : V.top === 'suit' ? 'wool' : 'cotton', c2: '#d9a441' };
  if (V.top === 'suit') bot.c = top.c;
  const covers = ['hoodie', 'suit', 'sweater', 'jacket'].includes(V.top);
  if (V.bottom) fitBottom(body, V.bottom, bot, F, legs, { band: !covers });
  fitTop(body, V.top, { ...top, len: V.bottom && ['shirt'].includes(V.top) ? 0.6 : top.len }, F, { arms, groundY: -Hc, over: covers && !!V.bottom });
  return done(root, 'mannequin', variant, o, () => [clip('turn', 6, [rotateTrack(body, 'y', 6, (t) => wave(t) * 0.12)])]);
}

/* ------------------------------ folded stacks ---------------------------- */

export const STACK_VARIANTS = {
  tees: { items: ['tee'], palette: ['#f2f1ec', '#1c1c1e', '#9aa3ad', '#2d4a7a', '#c8423a', '#e9c46a'] },
  jeans: { items: ['jean'], palette: ['#34507c', '#22324f', '#5f7fae', '#1a1d24', '#8aa2c4'], fab: 'denim' },
  sweaters: { items: ['sweater'], palette: ['#9e3c35', '#e8dcc2', '#2f4a3a', '#5d5f63', '#d39a2b', '#26324a'], fab: 'knit' },
  mixed: { items: ['tee', 'jean', 'sweater', 'tee'], palette: ['#f2f1ec', '#34507c', '#9e3c35', '#2d4a7a', '#e8dcc2', '#1c1c1e'] },
};

export function createFoldedStack(options = {}) {
  const { o, variant, trim, T, V } = setup(options, STACK_VARIANTS, 'folded-stack');
  const root = group(`folded-stack-${variant}`);
  const r = rng(`stack-${variant}-${trim}`);
  const topY = 0.78;
  const tw = 1.4, td = 0.7;
  const woodM = trim === 'leather' || trim === 'neon' ? M.wood('black') : trim === 'silk' || trim === 'velvet' ? M.wood('walnut') : trim === 'linen' || trim === 'knit' ? M.wood('pine') : M.wood('oak');
  mesh(roundedBox(tw, 0.04, td, 0.012), woodM, { parent: root, at: [0, topY - 0.02, 0], name: 'table_top' });
  mesh(roundedBox(tw - 0.12, 0.08, td - 0.12, 0.01), woodM, { parent: root, at: [0, topY - 0.08, 0] });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    mesh(taperTube([[sx * (tw / 2 - 0.08), topY - 0.04, sz * (td / 2 - 0.08)], [sx * (tw / 2 - 0.06), 0, sz * (td / 2 - 0.06)]], [0.028, 0.02], { seg: 2, radial: 14, caps: false }), woodM, { parent: root });
  }
  mesh(roundedBox(tw - 0.2, 0.025, td - 0.2, 0.008), woodM, { parent: root, at: [0, 0.2, 0], name: 'shelf' });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), woodM, { parent: root, at: [sx * (tw / 2 - 0.12), 0.1, sz * (td / 2 - 0.12)] });
  const piles = [[-0.48, -0.12], [-0.16, 0.08], [0.16, -0.1], [0.48, 0.1]];
  piles.forEach(([px, pz], pi) => {
    let y = topY;
    const n = 4 + Math.floor(r() * 3);
    const kind = V.items[pi % V.items.length];
    for (let i = 0; i < n; i++) {
      const c = trim ? mix(T.c, 0.25, r) : o.color ? mix(o.color, 0.3, r) : V.palette[(pi * 2 + i) % V.palette.length];
      const fab = trim ? T.fab : kind === 'jean' ? 'denim' : kind === 'sweater' ? 'knit' : 'cotton';
      const mat = fabricMat(fab, c, { c2: trim ? T.c2 : mix(c, 0.2, r), c3: T.c3, repeat: [1.5, 1.5] });
      const h = kind === 'jean' ? 0.045 : kind === 'sweater' ? 0.05 : 0.03;
      const w = kind === 'jean' ? 0.3 : 0.28;
      const d = kind === 'jean' ? 0.24 : 0.22;
      const it = group('item', { parent: root, at: [px + (r() - 0.5) * 0.01, y + h / 2, pz + (r() - 0.5) * 0.01], rot: [0, (r() - 0.5) * 0.08, 0] });
      mesh(cushion(w, h, d, { radius: h * 0.48, bulge: 0.06 }), mat, { parent: it });
      if (kind === 'sweater') mesh(roundedBox(w * 0.98, h * 0.4, 0.012, h * 0.15), mat, { parent: it, at: [0, -h * 0.22, d / 2 - 0.004] });
      if (kind === 'tee' && i === n - 1) mesh(ellipseRing(0.06, 0.03, 0.005, { y: h / 2 - 0.002, z: -d * 0.25, flatY: 0.6 }), mat, { parent: it });
      if (kind === 'jean') mesh(roundedBox(0.012, h * 0.7, 0.02, 0.004), M.metal('#b9905a', 0.3), { parent: it, at: [w * 0.3, 0, d / 2 - 0.006] });
      y += h - 0.002;
    }
  });
  const em = brandEmblem(0.07);
  em.position.set(0, topY - 0.06, td / 2 - 0.06 + 0.0005 + 0.002);
  root.add(em);
  return done(root, 'folded-stack', variant, o);
}

export { FABRIC_TRIMS };
