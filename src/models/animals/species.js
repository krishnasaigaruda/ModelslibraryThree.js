/*
 * Species specs (real proportions). Lengths: H = withers/shoulder height (m), BL = body
 * length point-of-shoulder → buttock (m). Other values are fractions:
 *  chest: chest depth / H, bw: body width / chest depth, croup: croup height / H,
 *  neck.len / H, neck.r0,r1 half-depth / H, head.len / H, head.w,h: skull half-width/height / head length,
 *  head.mlen: muzzle fraction of head length, head.mw,mh: muzzle size / skull size,
 *  legs.r: cannon/forearm radius / H, ears.len / head length, eyes.r / head length,
 *  tail.len / BL, tail.r / H.
 */

/** Deep merge (objects merge, everything else replaces; null deletes). */
export function derive(base, over = {}) {
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(over)) {
    if (v === null) delete out[k];
    else if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = derive(out[k], v);
    else out[k] = structuredClone(v);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

const DOG = {
  H: 0.57, BL: 0.64, chest: 0.5, bw: 0.74, croup: 0.98, tuck: 0.18, muscle: 0.6,
  neck: { len: 0.3, ang: 42, r0: 0.16, r1: 0.115, w: 0.85 },
  head: { len: 0.44, w: 0.28, h: 0.28, mlen: 0.44, mw: 0.66, mh: 0.6, ang: 14, stop: 0.6, jowl: 0.18, nose: 'dog', drop: 0.75, me: 2.7, flews: 0.25 },
  legs: { type: 'digi', r: 0.034, paw: 0.065, pawLen: 0.12, wrist: 0.14, hock: 0.27 },
  ears: { type: 'floppy', len: 0.44, w: 0.5, a: 0.78, t: 0.16 },
  eyes: { side: 0.25, r: 0.056, color: '#4a2a12' },
  tail: { type: 'dog', len: 0.52, r: 0.038 },
  coat: { base: '#d9a85e', back: '#c38d48', belly: '#ecd2a2', nose: '#1b1512', noseStart: 0.95, noseFront: 0.5, noseLow: -0.2 },
  sits: true, wags: true, run: 'gallop', gait: 1.1,
};
const ERECT = { type: 'erect', len: 0.5, w: 0.55, a: 0.55, t: 0.14, splay: 0.25, tilt: 0.05, cup: 0.6 };
const BLACK_TAN = { base: '#17130f', back: '#100c09', belly: '#1d1712', points: '#9a5326', pointsH: 0.22, muzzle: '#9a5326', muzzleStart: 0.7, nose: '#0d0a08', noseStart: 0.95, noseFront: 0.5, noseLow: -0.2, chest: '#9a5326' };

const CAT = {
  H: 0.25, BL: 0.36, chest: 0.48, bw: 0.64, croup: 1.06, tuck: 0.25, muscle: 0.3,
  neck: { len: 0.2, ang: 38, r0: 0.12, r1: 0.095, w: 0.85 },
  head: { len: 0.4, w: 0.45, h: 0.4, mlen: 0.2, mw: 0.62, mh: 0.44, ang: 4, stop: 0.75, jowl: 0.14, nose: 'cat', cheek: 1.05, drop: 0.3, me: 2.2 },
  legs: { type: 'digi', r: 0.026, paw: 0.06, pawLen: 0.09, wrist: 0.12, hock: 0.3 },
  ears: { type: 'cat', len: 0.42, w: 0.62, a: 0.62, t: 0.16, splay: 0.3, tilt: 0.05 },
  eyes: { side: 0.05, r: 0.1, color: '#a6b832', pupil: 'slit' },
  tail: { type: 'cat', len: 0.78, r: 0.036 },
  coat: { base: '#b58a55', back: '#9a7044', belly: '#e6d6b8', nose: '#c98088', pattern: { type: 'tabby', color: '#4e3826', scale: 1 }, inner: '#e0b0aa', noseStart: 0.97, noseFront: 0.55, noseLow: 0 },
  whiskers: true, sits: true, run: 'gallop', gait: 1.3,
};

const HORSE = {
  H: 1.6, BL: 1.65, chest: 0.45, bw: 0.62, croup: 0.99, tuck: 0.06, muscle: 0.9,
  neck: { len: 0.56, ang: 52, r0: 0.135, r1: 0.075, w: 0.6, root: 0.4 },
  head: { len: 0.37, w: 0.18, h: 0.2, mlen: 0.6, mw: 0.6, mh: 0.55, ang: 58, stop: 0, jowl: 0.38, nose: 'horse', drop: 0.4, flare: 1.12, rise: 0.25 },
  legs: { type: 'ungu', r: 0.025, knee: 0.3, hock: 0.37, fetlock: 0.11, pastern: 0.05, hoofH: 0.05 },
  ears: { type: 'horse', len: 0.25, w: 0.36, a: 0.42, t: 0.06, splay: 0.12, tilt: -0.12 },
  eyes: { side: 1, r: 0.055, color: '#1e120a' },
  tail: { type: 'horse', len: 0.58, r: 0.034 },
  mane: { h: 0.075, color: '#1a120c' },
  coat: { base: '#7a4524', back: '#653619', belly: '#80502e', points: '#17100b', pointsH: 0.3, muzzle: '#3a2418', muzzleStart: 0.82, nose: '#2a1d16', noseStart: 0.9, hoof: '#3a3028', lips: false },
  run: 'gallop', gait: 0.85,
};

const COW = {
  squareHind: 1,
  H: 1.42, BL: 1.75, chest: 0.56, bw: 0.74, croup: 1.0, tuck: -0.08, hips: 1.05,
  neck: { len: 0.3, ang: 22, r0: 0.17, r1: 0.12, w: 0.75, root: 0.42 },
  head: { len: 0.36, w: 0.25, h: 0.23, mlen: 0.46, mw: 0.86, mh: 0.68, ang: 62, stop: 0, jowl: 0.12, nose: 'cow', flare: 1.18, drop: 0.5 },
  legs: { type: 'ungu', r: 0.03, knee: 0.28, hock: 0.34, fetlock: 0.09, pastern: 0.035, hoofH: 0.045 },
  cloven: true,
  ears: { type: 'cow', len: 0.36, w: 0.5, a: 1.0, t: 0.1 },
  horns: { type: 'cow', len: 0.3, r: 0.07, a: 0.55 },
  eyes: { side: 1, r: 0.055, color: '#1e120a' },
  tail: { type: 'tuft', len: 0.52, r: 0.02 },
  coat: { base: '#8a4a24', back: '#743c1c', belly: '#94552e', nose: '#2a201c', noseStart: 0.86, hoof: '#2a2420', lips: false, mottle: 0.03 },
  gait: 0.8,
};

const DEER = {
  H: 0.95, BL: 1.0, chest: 0.45, bw: 0.58, croup: 1.03, tuck: 0.26, muscle: 0.6,
  neck: { len: 0.45, ang: 52, r0: 0.105, r1: 0.062, w: 0.66 },
  head: { len: 0.3, w: 0.21, h: 0.21, mlen: 0.55, mw: 0.55, mh: 0.52, ang: 45, stop: 0.1, jowl: 0.08, nose: 'deer', drop: 0.6 },
  legs: { type: 'ungu', r: 0.017, knee: 0.32, hock: 0.39, fetlock: 0.1, pastern: 0.045, hoofH: 0.045 },
  cloven: true,
  ears: { type: 'deer', len: 0.5, w: 0.5, a: 0.7, t: 0.12, splay: 0.9, tilt: 0.05 },
  antlers: { type: 'deer', len: 1.45, r: 0.05, tines: 3 },
  eyes: { side: 1, r: 0.075, color: '#120b07' },
  tail: { type: 'short', len: 0.16, r: 0.05 },
  coat: { base: '#9a6a3c', back: '#7c5330', belly: '#efe6d6', nose: '#151010', noseStart: 0.93, eyeRing: '#e8dcc8', muzzle: '#d9ccb8', muzzleStart: 0.86, hoof: '#1e1a16', tailTip: '#f4efe6', lips: false },
  gait: 0.95,
};

const PIG = {
  squareHind: 1,
  H: 0.75, BL: 1.05, chest: 0.6, bw: 0.85, croup: 1.02, tuck: -0.05, hips: 1.05,
  neck: { len: 0.14, ang: 12, r0: 0.2, r1: 0.17, w: 0.85, root: 0.42 },
  head: { len: 0.45, w: 0.26, h: 0.27, mlen: 0.5, mw: 0.62, mh: 0.55, ang: 18, stop: 0.1, jowl: 0.25, nose: 'pig', drop: 0.5 },
  legs: { type: 'ungu', r: 0.035, knee: 0.22, hock: 0.26, fetlock: 0.08, pastern: 0.03, hoofH: 0.04 },
  cloven: true,
  ears: { type: 'pig', len: 0.38, w: 0.6, a: 0.6, t: 0.18 },
  eyes: { side: 0.9, r: 0.04, color: '#2a1810' },
  tail: { type: 'curly', len: 0.18, r: 0.012 },
  coat: { base: '#f0b8b0', back: '#e8a8a0', belly: '#f4c4bc', nose: '#e39a94', noseStart: 0.99, hoof: '#8a6a5a', lips: false, mottle: 0.04 },
  gait: 1.0,
};

const SHEEP = {
  H: 0.72, BL: 0.95, chest: 0.5, bw: 0.75, croup: 1.0, tuck: 0.05,
  neck: { len: 0.3, ang: 35, r0: 0.1, r1: 0.07, w: 0.75 },
  head: { len: 0.36, w: 0.22, h: 0.24, mlen: 0.5, mw: 0.62, mh: 0.6, ang: 50, stop: 0.05, jowl: 0.08, nose: 'deer', drop: 0.5, roman: 0.4 },
  legs: { type: 'ungu', r: 0.022, knee: 0.27, hock: 0.33, fetlock: 0.09, pastern: 0.035, hoofH: 0.04 },
  cloven: true,
  ears: { type: 'cow', len: 0.35, w: 0.42, a: 1.1, t: 0.12 },
  eyes: { side: 1, r: 0.06, color: '#3a2a10', pupil: 'bar' },
  tail: { type: 'hang', len: 0.25, r: 0.03 },
  wool: 0.07,
  coat: { base: '#ece6d6', back: '#e4ddcc', belly: '#ddd5c2', nose: '#3a302a', noseStart: 0.94, hoof: '#3a3028', lips: false, mottle: 0.08 },
  gait: 0.95,
};

const GOAT = derive(SHEEP, {
  H: 0.7, BL: 0.85, chest: 0.48, bw: 0.62, tuck: 0.15, wool: 0,
  neck: { len: 0.36, ang: 45 },
  head: { len: 0.36, roman: 0, mlen: 0.52, mw: 0.55 },
  ears: { type: 'cow', len: 0.4 },
  horns: { type: 'goat', len: 0.55, r: 0.06, t: 0.05, a: 0.4 },
  beard: 0.35,
  tail: { type: 'up', len: 0.12, r: 0.03 },
  coat: { base: '#e8e2d6', back: '#ddd6c8', belly: '#efe9de', nose: '#c8a49a', mottle: 0.04 },
});

const BIGCAT = derive(CAT, {
  H: 1.0, BL: 1.6, chest: 0.52, bw: 0.68, croup: 1.0, tuck: 0.2, muscle: 1,
  neck: { len: 0.28, ang: 28, r0: 0.15, r1: 0.12 },
  head: { len: 0.36, w: 0.4, h: 0.34, mlen: 0.34, mw: 0.66, mh: 0.52, ang: 10, stop: 0.45, drop: 0.5, jowl: 0.15 },
  legs: { type: 'digi', r: 0.04, paw: 0.07, pawLen: 0.12, claws: false },
  ears: { type: 'round', len: 0.26, w: 0.8, a: 0.62, t: 0.18, splay: 0.4 },
  eyes: { side: 0.05, r: 0.075, color: '#c9a032', pupil: 'round' },
  tail: { type: 'cat', len: 0.62, r: 0.03 },
  coat: { base: '#c99a5a', back: '#b5864a', belly: '#efe2c8', pattern: null, nose: '#b86a5e', muzzle: '#f2e8d8', muzzleStart: 0.75, noseStart: 0.975 },
  whiskers: true, gait: 1.0,
});

const WOLF = derive(DOG, {
  H: 0.8, BL: 1.0, chest: 0.48, bw: 0.62, croup: 0.96, tuck: 0.22, fur: 0.025,
  neck: { len: 0.3, ang: 36, r0: 0.15, r1: 0.11 },
  head: { len: 0.36, w: 0.27, h: 0.25, mlen: 0.48, mw: 0.55, mh: 0.52, ang: 18, stop: 0.35, jowl: 0.12, flews: 0.05, drop: 0.6 },
  legs: { r: 0.03, paw: 0.06 },
  ears: { ...ERECT, len: 0.38 },
  eyes: { side: 0.3, r: 0.05, color: '#c99a2a' },
  tail: { type: 'bushy', len: 0.45, r: 0.035 },
  coat: { base: '#8f857a', back: '#4f4842', belly: '#e4ded4', muzzle: '#e8e2d8', muzzleStart: 0.7, face: { mask: '#efe9e0', maskStart: 0.62, maskTop: -0.1 }, tailTip: '#1c1a18' },
  wags: false,
});

const BEAR = {
  H: 1.0, BL: 1.65, chest: 0.6, bw: 0.85, croup: 0.92, tuck: 0.0, muscle: 0.8, fur: 0.035,
  humps: [{ at: 0.85, h: 0.12, w: 0.08 }],
  neck: { len: 0.3, ang: 20, r0: 0.2, r1: 0.15, w: 0.85 },
  head: { len: 0.4, w: 0.32, h: 0.3, mlen: 0.4, mw: 0.55, mh: 0.55, ang: 14, stop: 0.35, jowl: 0.15, nose: 'bear', drop: 0.6 },
  legs: { type: 'planti', r: 0.05, foot: 0.24, footH: 0.06, ankle: 0.15, claws: true },
  ears: { type: 'round', len: 0.2, w: 0.85, a: 0.7, t: 0.2, splay: 0.6 },
  eyes: { side: 0.35, r: 0.035, color: '#1a100a' },
  tail: { type: 'short', len: 0.06, r: 0.04 },
  coat: { base: '#6a4428', back: '#563620', belly: '#5e3c22', muzzle: '#8a6444', muzzleStart: 0.7, nose: '#141010', noseStart: 0.97, noseFront: 0.5 },
  sits: true, gait: 0.75,
};

const SMALL = {
  H: 0.12, BL: 0.2, chest: 0.6, bw: 0.85, croup: 1.1, tuck: 0.05, fur: 0.04,
  neck: { len: 0.2, ang: 30, r0: 0.2, r1: 0.16, w: 0.9 },
  head: { len: 0.45, w: 0.32, h: 0.3, mlen: 0.4, mw: 0.55, mh: 0.55, ang: 10, stop: 0.3, jowl: 0.1, nose: 'cat', drop: 0.5 },
  legs: { type: 'digi', r: 0.05, paw: 0.08, pawLen: 0.14, wrist: 0.15, hock: 0.3 },
  ears: { type: 'round', len: 0.3, w: 0.8, a: 0.6, t: 0.2 },
  eyes: { side: 0.6, r: 0.09, color: '#0d0a08' },
  tail: { type: 'dog', len: 0.4, r: 0.04 },
  coat: { base: '#8a6a4a', back: '#6a5038', belly: '#d8c8b0', nose: '#d8a0a0', noseStart: 0.98, noseFront: 0.6, noseLow: 0 },
  whiskers: true, sits: true, gait: 1.6,
};

/* ------------------------------------------------------------------ */
/* Types → variants (catalog structure)                                */
/* ------------------------------------------------------------------ */

export const QUAD_TYPES = {
  dog: {
    label: 'Dog', sub: 'pets', base: DOG,
    trims: ['puppy', 'senior', 'long-coat', 'spotted', 'sweater', 'raincoat', 'harness', 'bandana', 'service-vest', 'winter-coat'],
    variants: {
      labrador: {},
      'golden-retriever': { fur: 0.02, coat: { base: '#d39a50', back: '#c08440', belly: '#e8c690' }, tail: { type: 'bushy', len: 0.5, r: 0.03, hair: true }, ears: { len: 0.42 } },
      'german-shepherd': { H: 0.62, BL: 0.72, croup: 0.92, fur: 0.012, head: { mlen: 0.48, mw: 0.56, stop: 0.4, flews: 0.05, jowl: 0.1 }, ears: { ...ERECT, len: 0.5 }, tail: { type: 'bushy', len: 0.5, r: 0.03 }, coat: { base: '#b07a3c', back: '#9a6630', belly: '#d2a468', saddle: '#1b1612', saddleLow: 0.05, muzzle: '#1b1612', muzzleStart: 0.7, tailPoints: false } },
      husky: { H: 0.56, BL: 0.62, fur: 0.02, head: { mlen: 0.42, mw: 0.56, flews: 0.05, stop: 0.4 }, ears: { ...ERECT, len: 0.4, w: 0.6 }, tail: { type: 'curl', len: 0.48, r: 0.035 }, eyes: { color: '#7fb8e6' }, coat: { base: '#f0efeb', back: '#e8e6e2', belly: '#f6f5f2', saddle: '#4f545b', saddleLow: -0.15, saddleFront: 1.4, face: { mask: '#f6f5f2', maskStart: 0.35, maskTop: 0.35 } } },
      dalmatian: { H: 0.58, BL: 0.62, tuck: 0.24, head: { mlen: 0.46, mw: 0.6, flews: 0.1 }, ears: { len: 0.4 }, tail: { len: 0.55, r: 0.03 }, coat: { base: '#f4f2ee', back: '#eeece8', belly: '#f8f7f4', pattern: { type: 'spots', color: '#141414', scale: 2.6, amount: 0.75 } } },
      dachshund: { H: 0.23, BL: 0.45, chest: 0.64, croup: 1.0, tuck: 0.05, legs: { r: 0.05, wrist: 0.2, hock: 0.32, paw: 0.1, pawLen: 0.2 }, head: { len: 0.95, mlen: 0.5, mw: 0.55, stop: 0.3 }, neck: { len: 0.55, r0: 0.25, r1: 0.18 }, ears: { len: 0.4, w: 0.55 }, tail: { len: 0.45, r: 0.05 }, coat: { base: '#8a4a22', back: '#7a3e1a', belly: '#9a5a2e' } },
      beagle: { H: 0.38, BL: 0.42, legs: { r: 0.04 }, head: { len: 0.55, mlen: 0.42, flews: 0.3 }, neck: { len: 0.33, r0: 0.18, r1: 0.13 }, ears: { len: 0.55, w: 0.5 }, tail: { type: 'up', len: 0.5, r: 0.035 }, coat: { base: '#c98a48', back: '#b67a3c', belly: '#f6f2ea', saddle: '#1e1814', saddleLow: 0.15, saddleFront: 0.3, chest: '#f6f2ea', socks: '#f6f2ea', socksH: 0.25, tailTip: '#f6f2ea', face: { blaze: '#f6f2ea', blazeStart: 0.3 } } },
      poodle: { H: 0.55, BL: 0.55, tuck: 0.3, wool: 0.05, fur: 0, head: { mlen: 0.5, mw: 0.5, stop: 0.4, flews: 0 }, neck: { len: 0.38, ang: 55 }, ears: { len: 0.5, w: 0.6 }, tail: { type: 'up', len: 0.35, r: 0.04 }, coat: { base: '#f0ece4', back: '#e8e4dc', belly: '#f2eee8', mottle: 0.1 } },
      bulldog: { H: 0.38, BL: 0.45, chest: 0.62, bw: 1.05, croup: 1.02, tuck: 0.1, muscle: 1, legs: { r: 0.06, hock: 0.25 }, head: { len: 0.58, w: 0.46, h: 0.38, mlen: 0.12, mw: 0.78, mh: 0.62, stop: 0.95, jowl: 0.45, flews: 0.6, drop: 0.3, wrinkles: 1 }, neck: { len: 0.2, r0: 0.26, r1: 0.22, w: 0.95 }, ears: { type: 'rose', len: 0.24, w: 0.8, a: 0.6, t: 0.18 }, eyes: { side: 0.3, r: 0.06 }, tail: { type: 'short', len: 0.1, r: 0.04 }, creases: 0.4, coat: { base: '#c8925a', back: '#b88048', belly: '#f2ebe0', chest: '#f4efe6', socks: '#f4efe6', socksH: 0.15, muzzle: '#e8dccb', muzzleStart: 0.8, face: { blaze: '#f4efe6', blazeStart: 0.1 } } },
      pug: { H: 0.3, BL: 0.34, chest: 0.6, bw: 1.0, tuck: 0.05, muscle: 0.6, legs: { r: 0.05 }, head: { len: 0.56, w: 0.48, h: 0.44, mlen: 0.09, mw: 0.62, mh: 0.5, stop: 1, jowl: 0.22, flews: 0.25, drop: 0.25, me: 2.2, wrinkles: 1 }, neck: { len: 0.18, r0: 0.25, r1: 0.22 }, ears: { type: 'button', len: 0.26, w: 0.85, a: 0.62, t: 0.2 }, eyes: { side: 0.12, r: 0.085, color: '#1a100a' }, tail: { type: 'curl', len: 0.32, r: 0.05 }, coat: { base: '#d8b88a', back: '#c9a676', belly: '#e2c69c', muzzle: '#1d1814', muzzleStart: 0.86, earPoints: true, points: '#1d1814', pointsH: 0, eyeRing: '#1d1814' } },
      chihuahua: { H: 0.2, BL: 0.2, chest: 0.45, bw: 0.7, tuck: 0.3, legs: { r: 0.032 }, head: { len: 0.6, w: 0.42, h: 0.42, mlen: 0.26, mw: 0.5, mh: 0.5, stop: 1, flews: 0, jowl: 0.05, drop: 0.3 }, neck: { len: 0.35 }, ears: { ...ERECT, len: 0.75, w: 0.65, splay: 0.6 }, eyes: { side: 0.25, r: 0.085 }, tail: { type: 'up', len: 0.55, r: 0.03 }, coat: { base: '#d9b07a', back: '#c99e66', belly: '#ecd4ac' } },
      corgi: { H: 0.27, BL: 0.45, chest: 0.6, croup: 1.0, tuck: 0.05, fur: 0.015, legs: { r: 0.05, wrist: 0.2, hock: 0.3, paw: 0.09, pawLen: 0.18 }, head: { len: 0.8, mlen: 0.42, mw: 0.52, flews: 0, stop: 0.4 }, neck: { len: 0.45, r0: 0.24, r1: 0.18 }, ears: { ...ERECT, len: 0.55, w: 0.7 }, tail: { type: 'short', len: 0.06, r: 0.05 }, coat: { base: '#c9803c', back: '#b87030', belly: '#f6f0e6', chest: '#f6f0e6', socks: '#f6f0e6', socksH: 0.3, face: { blaze: '#f6f0e6', blazeStart: 0.4 } } },
      rottweiler: { H: 0.63, BL: 0.68, bw: 0.85, muscle: 1, head: { w: 0.32, mlen: 0.38, mw: 0.72, flews: 0.25, stop: 0.6 }, neck: { r0: 0.17, r1: 0.13 }, ears: { len: 0.3, w: 0.6 }, tail: { type: 'short', len: 0.1, r: 0.04 }, coat: { ...BLACK_TAN } },
      doberman: { H: 0.68, BL: 0.68, tuck: 0.32, bw: 0.66, head: { mlen: 0.5, mw: 0.55, w: 0.25, flews: 0.05, stop: 0.35 }, neck: { len: 0.38, ang: 52, r0: 0.14, r1: 0.1 }, ears: { ...ERECT, len: 0.55, w: 0.45 }, tail: { type: 'short', len: 0.08, r: 0.035 }, coat: { ...BLACK_TAN } },
      'great-dane': { H: 0.8, BL: 0.82, tuck: 0.28, bw: 0.68, legs: { r: 0.03 }, head: { len: 0.42, mlen: 0.52, h: 0.3, mw: 0.65, mh: 0.68, flews: 0.35, stop: 0.6 }, neck: { len: 0.36, ang: 50 }, ears: { len: 0.36 }, coat: { base: '#f2f0ec', back: '#ebe9e4', belly: '#f4f3f0', pattern: { type: 'patches', color: '#141414', amount: 0.58, scale: 2 } } },
      'border-collie': { H: 0.52, BL: 0.58, fur: 0.025, head: { mlen: 0.45, mw: 0.52, flews: 0.05, stop: 0.4 }, ears: { ...ERECT, type: 'semi', len: 0.42 }, tail: { type: 'bushy', len: 0.5, r: 0.028 }, coat: { base: '#1b1816', back: '#141210', belly: '#2a2420', chest: '#f4f2ee', socks: '#f4f2ee', socksH: 0.22, tailTip: '#f4f2ee', face: { blaze: '#f4f2ee', blazeStart: 0.15 }, muzzle: '#f4f2ee', muzzleStart: 0.75 } },
      boxer: { H: 0.6, BL: 0.6, tuck: 0.28, muscle: 1, head: { len: 0.4, w: 0.3, h: 0.32, mlen: 0.24, mw: 0.78, mh: 0.66, stop: 0.9, flews: 0.45, jowl: 0.25, drop: 0.3, wrinkles: 0.5 }, ears: { len: 0.3 }, tail: { type: 'short', len: 0.08, r: 0.035 }, coat: { base: '#c78a4e', back: '#b67a40', belly: '#d8a066', chest: '#f4f0ea', muzzle: '#1d1814', muzzleStart: 0.78, socks: '#f4f0ea', socksH: 0.1 } },
      'shiba-inu': { H: 0.4, BL: 0.43, fur: 0.015, head: { mlen: 0.42, mw: 0.55, flews: 0, stop: 0.45 }, ears: { ...ERECT, len: 0.38, w: 0.62 }, tail: { type: 'curl', len: 0.45, r: 0.04 }, coat: { base: '#c9773a', back: '#b8682e', belly: '#f2e2c6', face: { mask: '#f2e2c6', maskStart: 0.45, maskTop: -0.05 }, chest: '#f2e2c6' } },
      greyhound: { H: 0.72, BL: 0.72, chest: 0.55, bw: 0.55, tuck: 0.5, croup: 0.98, legs: { r: 0.026 }, head: { len: 0.38, w: 0.22, h: 0.22, mlen: 0.56, mw: 0.48, mh: 0.5, flews: 0, stop: 0.15, drop: 0.5 }, neck: { len: 0.42, ang: 45, r0: 0.11, r1: 0.075 }, ears: { type: 'rose', len: 0.3, w: 0.5 }, tail: { type: 'dog', len: 0.65, r: 0.02 }, coat: { base: '#8a8580', back: '#7a7570', belly: '#a09a94' } },
      'saint-bernard': { H: 0.8, BL: 0.85, bw: 0.9, fur: 0.02, muscle: 1, head: { len: 0.45, w: 0.33, h: 0.32, mlen: 0.34, mw: 0.78, mh: 0.68, flews: 0.5, jowl: 0.3, stop: 0.8 }, neck: { r0: 0.18, r1: 0.14 }, ears: { len: 0.36, w: 0.6 }, tail: { type: 'bushy', len: 0.5, r: 0.032 }, coat: { base: '#f4f0e8', back: '#ece6dc', belly: '#f6f3ee', pattern: { type: 'patches', color: '#9a4a1e', amount: 0.48, scale: 1.4 }, face: { blaze: '#f6f3ee', blazeStart: 0.2 } } },
      'jack-russell': { H: 0.3, BL: 0.32, legs: { r: 0.04 }, head: { len: 0.5, mlen: 0.42, mw: 0.55, flews: 0.05, stop: 0.5 }, ears: { ...ERECT, type: 'semi', len: 0.35, fold: 1.8, foldAt: 0.45 }, tail: { type: 'up', len: 0.3, r: 0.035 }, coat: { base: '#f4f2ee', back: '#eeebe6', belly: '#f8f7f4', pattern: { type: 'patches', color: '#b06a32', amount: 0.62, scale: 1.4 } } },
      'yorkshire-terrier': { H: 0.22, BL: 0.24, fur: 0.08, legs: { r: 0.032 }, head: { len: 0.6, mlen: 0.35, mw: 0.5, flews: 0, stop: 0.8 }, ears: { ...ERECT, len: 0.45 }, tail: { type: 'up', len: 0.35, r: 0.03 }, coat: { base: '#c9a06a', back: '#5a6470', belly: '#c9a06a', saddle: '#5a6470', saddleLow: -0.3, backAmount: 1 } },
      'shih-tzu': { H: 0.25, BL: 0.3, chest: 0.55, fur: 0.07, legs: { r: 0.045 }, head: { len: 0.6, w: 0.45, h: 0.42, mlen: 0.12, mw: 0.62, mh: 0.5, stop: 1, flews: 0.1, drop: 0.3 }, beard: 0.25, beardColor: '#f2ece2', ears: { type: 'floppy', len: 0.5, w: 0.65 }, eyes: { side: 0.15, r: 0.08 }, tail: { type: 'curl', len: 0.45, r: 0.05, hair: true }, coat: { base: '#f2ece2', back: '#c8a070', belly: '#f6f2ea', saddle: '#b8885a', saddleLow: 0.3, face: { blaze: '#f6f2ea', blazeStart: 0.3 } } },
      'rough-collie': { H: 0.6, BL: 0.62, fur: 0.04, head: { len: 0.46, w: 0.22, h: 0.22, mlen: 0.58, mw: 0.5, mh: 0.5, stop: 0.12, flews: 0, jowl: 0.02, drop: 0.4 }, ears: { ...ERECT, type: 'semi', len: 0.36 }, tail: { type: 'bushy', len: 0.55, r: 0.03 }, coat: { base: '#c8843a', back: '#a8682a', belly: '#f6f2ea', chest: '#f6f2ea', socks: '#f6f2ea', socksH: 0.2, face: { blaze: '#f6f2ea', blazeStart: 0.3 }, tailTip: '#f6f2ea' } },
      bernese: { H: 0.65, BL: 0.7, bw: 0.82, fur: 0.025, head: { mlen: 0.42, mw: 0.66, flews: 0.2 }, ears: { len: 0.38, w: 0.6 }, tail: { type: 'bushy', len: 0.5, r: 0.035 }, coat: { ...BLACK_TAN, chest: '#f4f2ee', socks: '#f4f2ee', socksH: 0.08, tailTip: '#f4f2ee', face: { blaze: '#f4f2ee', blazeStart: 0.25 }, points: '#a8622e', pointsH: 0.25 } },
    },
  },
  cat: {
    label: 'Cat', sub: 'pets', base: CAT,
    trims: ['kitten', 'senior', 'long-hair', 'chubby', 'spotted', 'dark', 'bow', 'harness', 'sweater'],
    variants: {
      tabby: {},
      ginger: { coat: { base: '#d98a3e', back: '#c87830', belly: '#f2d2a6', pattern: { type: 'tabby', color: '#a8561e' } } },
      black: { coat: { base: '#1a1816', back: '#121110', belly: '#22201e', pattern: null, nose: '#2a2624' }, eyes: { color: '#e0b830' } },
      siamese: { coat: { base: '#efe6d6', back: '#e2d6c2', belly: '#f4eee4', pattern: null, points: '#4a3426', pointsH: 0.5, facePoints: true, nose: '#3a2a22' }, eyes: { color: '#5aa0e0' }, head: { mlen: 0.26, w: 0.38 }, ears: { len: 0.5 } },
      persian: { fur: 0.06, head: { mlen: 0.08, mw: 0.75, stop: 1, w: 0.46, drop: 0.1 }, ears: { len: 0.3 }, eyes: { r: 0.11, color: '#d48a2a' }, coat: { base: '#f2f0ec', back: '#ebe8e2', belly: '#f6f4f0', pattern: null } },
      'maine-coon': { H: 0.32, BL: 0.5, fur: 0.045, ears: { len: 0.48, tuft: 0.3 }, tail: { type: 'bushy', len: 0.7, r: 0.04 }, coat: { base: '#8a6a4a', back: '#6a5038', belly: '#d8c8b0', pattern: { type: 'tabby', color: '#2a2018' } } },
      sphynx: { fur: 0, muscle: 0.8, tuck: 0.15, ears: { len: 0.6, w: 0.7 }, creases: 0.5, coat: { base: '#e0b8a8', back: '#d6a898', belly: '#e8c4b6', pattern: null, mottle: 0.12 }, whiskers: false },
      bengal: { H: 0.28, coat: { base: '#d8a860', back: '#c89850', belly: '#f2e6cc', pattern: { type: 'rosettes', color: '#3a2618', scale: 1.4, color2: '#8a5a2a' } }, eyes: { color: '#7ab84a' } },
      tuxedo: { coat: { base: '#1a1816', back: '#121110', belly: '#22201e', pattern: null, chest: '#f6f4f0', socks: '#f6f4f0', socksH: 0.12, muzzle: '#f6f4f0', muzzleStart: 0.65, nose: '#d89890' } },
      calico: { coat: { base: '#f6f2ea', back: '#efe9de', belly: '#faf7f2', pattern: { type: 'patches', color: '#d8803a', amount: 0.55, scale: 2 }, pattern2: { type: 'patches', color: '#1e1a18', amount: 0.62, scale: 2.6 } } },
      'russian-blue': { coat: { base: '#7d8792', back: '#6e7782', belly: '#8a949e', pattern: null, nose: '#5a6068' }, eyes: { color: '#4ab86a' }, fur: 0.012 },
      'scottish-fold': { ears: { type: 'rose', len: 0.3, w: 0.7, fold: 2.2, foldAt: 0.3 }, head: { w: 0.46 }, eyes: { r: 0.11, color: '#d8a030' }, coat: { base: '#b8b2aa', back: '#9a948c', belly: '#e2ded8', pattern: { type: 'tabby', color: '#5a544c' } } },
    },
  },
  horse: {
    label: 'Horse', sub: 'farm', base: HORSE,
    trims: ['foal', 'saddle', 'western-saddle', 'racing', 'blanket', 'show', 'spotted', 'winter-coat'],
    variants: {
      bay: { coat: { face: { blaze: '#f2eee6', blazeStart: 0.2 }, socks: '#f2eee6', socksH: [0, 0, 0.12, 0] } },
      chestnut: { mane: { color: '#8a4a22' }, tail: { color: '#7a3e1a' }, coat: { base: '#9a5428', back: '#874620', belly: '#a2603a', points: null, socks: '#f2eee6', socksH: [0.1, 0, 0, 0.14], face: { blaze: '#f2eee6' } } },
      black: { mane: { color: '#0e0b09' }, coat: { base: '#1c1714', back: '#141110', belly: '#221c18', points: '#0e0b09', muzzle: '#2a2420' } },
      grey: { mane: { color: '#d8d6d2' }, tail: { color: '#cfcac4' }, coat: { base: '#c8c8c4', back: '#b8b8b4', belly: '#d8d8d4', points: '#6a6a68', pointsH: 0.22, pattern: { type: 'dapple', color: '#7a7a78', scale: 1.2 }, muzzle: '#4a4644' } },
      palomino: { mane: { color: '#f2e8d0' }, tail: { color: '#efe2c4' }, coat: { base: '#d8b26a', back: '#c9a05a', belly: '#e2c282', points: null, face: { blaze: '#f6f2ea' }, socks: '#f6f2ea', socksH: [0.12, 0.12, 0.15, 0.15] } },
      pinto: { mane: { color: '#2a1a10' }, coat: { pattern: { type: 'patches', color: '#f4f2ec', amount: 0.48, scale: 0.9 }, socks: '#f4f2ec', socksH: 0.25 } },
      appaloosa: { mane: { color: '#3a2a20' }, coat: { base: '#ece8e0', back: '#e4dfd6', belly: '#f2efe8', points: '#3a2a20', pointsH: 0.18, pattern: { type: 'spots', color: '#4a3020', scale: 1.4, amount: 0.7 } } },
      clydesdale: { H: 1.8, BL: 1.9, bw: 0.72, muscle: 1.2, feather: 0.035, legs: { r: 0.032 }, head: { roman: 0.4, len: 0.4 }, mane: { h: 0.08 }, coat: { base: '#6a3a1e', back: '#572e16', belly: '#74442a', socks: '#f4f2ee', socksH: 0.3, face: { blaze: '#f4f2ee', blazeStart: 0.05 } } },
      'shetland-pony': { H: 1.0, BL: 1.12, chest: 0.55, bw: 0.75, fur: 0.02, legs: { r: 0.034 }, head: { len: 0.42, mlen: 0.55 }, neck: { len: 0.46, r0: 0.16, r1: 0.1 }, mane: { h: 0.14, w: 1.6 }, tail: { len: 0.7, r: 0.05 }, coat: { base: '#4a3020', back: '#3a2418', belly: '#5a3a28' } },
      arabian: { H: 1.52, BL: 1.5, tuck: 0.12, head: { len: 0.34, roman: -0.35, mlen: 0.55, mw: 0.52, flare: 1.25 }, neck: { ang: 58 }, tail: { len: 0.55 }, coat: { base: '#d6d4cf', back: '#c8c6c0', belly: '#e2e0dc', points: '#3a3836', pointsH: 0.18, muzzle: '#2a2826' }, mane: { color: '#efedea' } },
    },
  },
  equine: {
    label: 'Donkey & Zebra', sub: 'wild', base: HORSE,
    trims: ['foal', 'packsaddle', 'blanket', 'winter-coat', 'dark'],
    variants: {
      zebra: { H: 1.3, BL: 1.35, chest: 0.5, bw: 0.7, mane: { type: 'upright', h: 0.08, color: '#1a1a1a' }, tail: { type: 'tuft', len: 0.4, r: 0.022 }, ears: { len: 0.32, w: 0.42 }, coat: { base: '#f4f2ec', back: '#efece4', belly: '#f8f6f2', points: null, pattern: { type: 'zebra', color: '#121212', scale: 1 }, muzzle: '#141414', muzzleStart: 0.82 } },
      donkey: { H: 1.15, BL: 1.2, chest: 0.52, bw: 0.7, croup: 1.02, head: { len: 0.44, roman: 0.2, mlen: 0.55 }, ears: { len: 0.6, w: 0.32, splay: 0.3 }, mane: { type: 'upright', h: 0.05, color: '#3a3430' }, tail: { type: 'tuft', len: 0.42, r: 0.02 }, coat: { base: '#8a8178', back: '#7a7168', belly: '#e6e2dc', points: null, muzzle: '#e6e2dc', muzzleStart: 0.8, eyeRing: '#e6e2dc', pattern: { type: 'stripe', color: '#3a3430' } } },
      mule: { H: 1.45, BL: 1.5, ears: { len: 0.48, w: 0.34 }, mane: { h: 0.06, type: 'upright' }, tail: { type: 'horse' }, coat: { base: '#5a3a26', back: '#4a2e1c', belly: '#c8b4a0', muzzle: '#c8b4a0', muzzleStart: 0.82 } },
      przewalski: { H: 1.3, BL: 1.4, bw: 0.7, head: { len: 0.42, mlen: 0.55 }, neck: { r0: 0.15, r1: 0.09 }, mane: { type: 'upright', h: 0.09, color: '#2a1e16' }, coat: { base: '#c49a64', back: '#b08654', belly: '#e2ccaa', points: '#2a1e16', pointsH: 0.3, muzzle: '#efe2cc', muzzleStart: 0.82, pattern: { type: 'stripe', color: '#3a2a1c' } } },
    },
  },
  cow: {
    label: 'Cattle', sub: 'farm', base: COW,
    trims: ['calf', 'bull', 'spotted', 'cowbell', 'blanket', 'dehorned', 'winter-coat'],
    variants: {
      holstein: { udder: true, coat: { base: '#f3f1ec', back: '#e9e6df', belly: '#f6f4f0', pattern: { type: 'patches', color: '#141414', amount: 0.5, scale: 1.2 }, nose: '#e0a3a0' } },
      angus: { horns: null, muscle: 1, bw: 0.8, coat: { base: '#161412', back: '#100e0c', belly: '#1c1916', nose: '#2a2624' } },
      hereford: { muscle: 1, bw: 0.82, coat: { base: '#8a3a1e', back: '#7a3218', belly: '#f4f0e8', face: { blaze: '#f4f0e8', blazeStart: 0.0 }, muzzle: '#f4f0e8', muzzleStart: 0.3, chest: '#f4f0e8', socks: '#f4f0e8', socksH: 0.15, tailTip: '#f4f0e8', nose: '#e0b0a8' }, horns: { len: 0.25 } },
      highland: { H: 1.15, BL: 1.45, fur: 0.07, feather: 0.02, horns: { type: 'longhorn', len: 0.8, r: 0.065 }, coat: { base: '#b0602a', back: '#9a5020', belly: '#a85a28', mottle: 0.12, nose: '#2a201c' } },
      jersey: { H: 1.25, BL: 1.5, udder: true, head: { mlen: 0.42, stop: 0.15 }, coat: { base: '#b98a5a', back: '#9a6e44', belly: '#c89a6a', muzzle: '#2a201c', muzzleStart: 0.86, eyeRing: '#1e1612', nose: '#1e1612' }, horns: null },
      longhorn: { H: 1.45, tuck: 0.05, horns: { type: 'longhorn', len: 1.5, r: 0.07, a: 0.65 }, coat: { base: '#e8e0d4', back: '#ddd4c6', belly: '#efe9e0', pattern: { type: 'patches', color: '#8a3a1e', amount: 0.52, scale: 1.4 } } },
      brahman: { H: 1.4, BL: 1.6, tuck: 0.12, humps: [{ at: 0.92, h: 0.35, w: 0.05 }], dewlap: 0.1, ears: { type: 'floppy', len: 0.55, w: 0.5, a: 1.1 }, horns: { type: 'bison', len: 0.25 }, coat: { base: '#cfc9c0', back: '#b9b2a8', belly: '#ddd8d0', nose: '#2a2624' } },
      bull: { muscle: 1.4, bw: 0.85, neck: { r0: 0.22, r1: 0.15 }, horns: { type: 'bull', len: 0.45, r: 0.1 }, coat: { base: '#1e1a18', back: '#141210', belly: '#242020' } },
      yak: { H: 1.5, BL: 1.8, fur: 0.09, feather: 0.06, humps: [{ at: 0.85, h: 0.2, w: 0.08 }], horns: { type: 'buffalo', len: 0.55, r: 0.07 }, tail: { type: 'horse', len: 0.4, r: 0.04, color: '#1a1614' }, coat: { base: '#2a2220', back: '#1e1816', belly: '#2e2624', mottle: 0.1 } },
      bison: { H: 1.7, BL: 2.0, chest: 0.66, croup: 0.82, fur: 0.04, humps: [{ at: 0.82, h: 0.45, w: 0.08 }], head: { ang: 75, len: 0.32, w: 0.3 }, neck: { ang: 5, r0: 0.25, r1: 0.18 }, beard: 0.4, horns: { type: 'bison', len: 0.22, r: 0.08, color: '#2a2420' }, legs: { r: 0.032 }, coat: { base: '#4a3020', back: '#3a2418', belly: '#3e281a', nose: '#141010' } },
      'water-buffalo': { H: 1.5, BL: 1.9, bw: 0.85, creases: 0.3, horns: { type: 'buffalo', len: 0.8, r: 0.085 }, coat: { base: '#3a3634', back: '#2a2624', belly: '#4a4644', mottle: 0.05, nose: '#1a1816' } },
      ox: { H: 1.6, BL: 1.95, muscle: 1.2, horns: { type: 'cow', len: 0.45 }, coat: { base: '#d8c8b0', back: '#c8b69c', belly: '#e2d6c2' } },
    },
  },
  pig: {
    label: 'Pig', sub: 'farm', base: PIG,
    trims: ['piglet', 'spotted', 'dark', 'heavy', 'winter-coat'],
    variants: {
      domestic: {},
      spotted: { coat: { pattern: { type: 'patches', color: '#2a2220', amount: 0.58, scale: 1.6 } }, ears: { type: 'floppy', len: 0.45 } },
      berkshire: { coat: { base: '#1e1a18', back: '#161412', belly: '#2a2420', socks: '#f2ece6', socksH: 0.12, face: { blaze: '#f2ece6', blazeStart: 0.4 }, nose: '#d8b0a8' } },
      'wild-boar': { H: 0.85, BL: 1.1, chest: 0.6, croup: 0.88, fur: 0.025, mane: { type: 'upright', h: 0.06, color: '#2a2018', start: -0.4 }, head: { len: 0.55, mlen: 0.6 }, legs: { r: 0.03, knee: 0.26, hock: 0.3 }, tusks: { type: 'boar', len: 0.09, r: 0.012 }, tail: { type: 'hang', len: 0.2, r: 0.015 }, ears: { type: 'erect', len: 0.32, w: 0.55 }, coat: { base: '#4a3a2e', back: '#2e241c', belly: '#5a4838', nose: '#3a2a24' } },
      warthog: { H: 0.7, BL: 1.0, croup: 0.92, mane: { type: 'upright', h: 0.12, color: '#3a3028', start: -0.6 }, head: { len: 0.6, w: 0.32, mlen: 0.55, mw: 0.7 }, tusks: { type: 'boar', len: 0.2, r: 0.018 }, tail: { type: 'up', len: 0.35, r: 0.012 }, ears: { type: 'erect', len: 0.25 }, creases: 0.4, coat: { base: '#6a625a', back: '#5a524a', belly: '#7a726a', nose: '#3a3430' } },
      potbelly: { H: 0.45, BL: 0.75, tuck: -0.3, bw: 1.0, head: { mlen: 0.42 }, creases: 0.5, coat: { base: '#2a2624', back: '#221e1c', belly: '#322c2a', nose: '#4a4240' } },
    },
  },
  sheep: {
    label: 'Sheep & Goat', sub: 'farm', base: SHEEP,
    trims: ['lamb', 'shorn', 'heavy-fleece', 'dark', 'bell'],
    variants: {
      merino: { wool: 0.11, coat: { mottle: 0.1 } },
      suffolk: { coat: { base: '#ece6d6', points: '#1a1614', pointsH: 0.4, facePoints: true, earPoints: true, nose: '#141210' } },
      ram: { horns: { type: 'ram', len: 0.7, r: 0.085, t: 0.08, a: 0.7 }, muscle: 0.8, coat: { base: '#e6dece' } },
      'black-sheep': { coat: { base: '#2a2422', back: '#221c1a', belly: '#2e2826', nose: '#141010' } },
      bighorn: { wool: 0, H: 0.95, BL: 1.1, horns: { type: 'ram', len: 0.95, r: 0.1, t: 0.08, a: 0.7 }, coat: { base: '#8a6a4a', back: '#6e5236', belly: '#e8dccb', muzzle: '#e8dccb', muzzleStart: 0.85, mottle: 0.05 }, tail: { type: 'short', len: 0.08 } },
      'alpine-goat': GOAT,
      'pygmy-goat': derive(GOAT, { H: 0.5, BL: 0.6, chest: 0.58, bw: 0.82, tuck: 0, coat: { base: '#4a3a30', back: '#2e241c', belly: '#c8b8a8' } }),
      ibex: derive(GOAT, { H: 0.9, BL: 1.1, horns: { type: 'ibex', len: 1.4, r: 0.085, ringed: true }, beard: 0.25, coat: { base: '#8a7258', back: '#6e5a44', belly: '#d8ccbc' } }),
      'mountain-goat': derive(GOAT, { H: 0.95, BL: 1.1, fur: 0.04, humps: [{ at: 0.85, h: 0.12 }], horns: { type: 'antelope', len: 0.35, r: 0.05, color: '#1a1614', tip: '#0e0c0a' }, beard: 0.4, coat: { base: '#f4f2ec', back: '#ece9e2', belly: '#f2efe8', nose: '#141210' } }),
    },
  },
  deer: {
    label: 'Deer & Antelope', sub: 'wild', base: DEER,
    trims: ['fawn', 'doe', 'young-buck', 'velvet', 'winter-coat', 'old'],
    variants: {
      'white-tailed': {},
      'red-deer': { H: 1.2, BL: 1.3, fur: 0.01, antlers: { len: 1.9, tines: 4 }, neck: { r0: 0.12, r1: 0.075 }, coat: { base: '#8a5230', back: '#6e4024', belly: '#c8a888', tailTip: null } },
      elk: { H: 1.45, BL: 1.55, antlers: { len: 2.1, tines: 5, r: 0.055 }, neck: { r0: 0.13, r1: 0.08 }, fur: 0.012, coat: { base: '#a07850', back: '#5a3a24', belly: '#6a4a30', saddle: '#c8a478', saddleLow: 0.2, saddleFront: 0.2, tailTip: '#e8d8b8' } },
      moose: { H: 1.85, BL: 1.8, chest: 0.42, croup: 0.88, humps: [{ at: 0.85, h: 0.2 }], head: { len: 0.36, mlen: 0.65, mh: 0.68, flare: 1.35, drop: 0.3, roman: 0.4 }, dewlap: 0.06, antlers: { type: 'moose', len: 1.6, r: 0.06 }, ears: { len: 0.4 }, legs: { r: 0.02 }, coat: { base: '#3a2a20', back: '#2a1e16', belly: '#4a3a2e', points: '#a89884', pointsH: 0.35, muzzle: null, eyeRing: null, tailTip: null } },
      reindeer: { H: 1.1, BL: 1.2, fur: 0.025, chest: 0.5, antlers: { len: 1.8, tines: 4 }, legs: { r: 0.022 }, coat: { base: '#8a7a68', back: '#6a5a48', belly: '#e8e2d8', chest: '#f0ece4', socks: '#e8e2d8', socksH: 0.08, muzzle: '#e8e2d8' }, dewlap: 0.03 },
      fallow: { H: 0.9, antlers: { type: 'moose', len: 1.0, r: 0.045 }, coat: { base: '#b07040', back: '#9a5e34', pattern: { type: 'spots', color: '#f4ece0', scale: 1.6, amount: 0.55, regions: ['body'] } } },
      roe: { H: 0.72, BL: 0.8, antlers: { len: 0.8, tines: 2 }, coat: { base: '#a05a30', back: '#8a4a26', tailTip: '#f4efe6' } },
      gazelle: { H: 0.7, BL: 0.8, antlers: null, horns: { type: 'antelope', len: 0.9, r: 0.05, ringed: true, color: '#2a2420', tip: '#141210' }, coat: { base: '#c8945a', back: '#b8844a', belly: '#f6f2ea', band: { color: '#2a1e14', from: -0.6, to: 0.4, flank: true } } },
      impala: { H: 0.9, BL: 1.0, antlers: null, horns: { type: 'ibex', len: 1.4, r: 0.045, ringed: true, color: '#2a2420', tip: '#141210' }, coat: { base: '#b07040', back: '#9a5e34', belly: '#f6f2ea', tailTip: '#1a1612' } },
      oryx: { H: 1.2, BL: 1.3, antlers: null, horns: { type: 'antelope', len: 2.4, r: 0.04, color: '#1a1612', tip: '#0e0c0a' }, coat: { base: '#cfc4b2', back: '#c0b49e', belly: '#f4f2ee', points: '#1a1612', pointsH: 0.45, face: { mask: '#1a1612', maskStart: 0.3, maskTop: 0.3 }, band: { color: '#1a1612', from: -0.5, to: 0.5, flank: true } }, tail: { type: 'tuft', len: 0.35, r: 0.015 } },
    },
  },
  bigcat: {
    label: 'Big Cat', sub: 'wild', base: BIGCAT,
    trims: ['cub', 'young', 'fluffy', 'dark', 'pale'],
    variants: {
      lion: { H: 1.15, BL: 1.75, mane: { type: 'lion', size: 1, color: '#6a4424', tip: '#b8864a' }, tail: { type: 'tuft', len: 0.55, r: 0.025, color: '#3a2618' } },
      lioness: { H: 1.0, BL: 1.6, tail: { type: 'tuft', len: 0.55, r: 0.022, color: '#3a2618' } },
      tiger: { H: 1.0, BL: 1.9, head: { w: 0.42 }, coat: { base: '#d8782a', back: '#c86a20', belly: '#f6f0e4', pattern: { type: 'tiger', color: '#141210', scale: 1 }, muzzle: '#f6f0e4', muzzleStart: 0.6 } },
      'white-tiger': { H: 1.0, BL: 1.9, eyes: { color: '#5a9ad8' }, coat: { base: '#f2eee6', back: '#e8e2d8', belly: '#faf8f4', pattern: { type: 'tiger', color: '#2a2622', scale: 1 }, muzzle: '#faf8f4', muzzleStart: 0.6 } },
      leopard: { H: 0.7, BL: 1.3, coat: { base: '#d8a858', back: '#c89848', belly: '#f6eedc', pattern: { type: 'rosettes', color: '#1a1410', scale: 1.4, color2: '#b8803a' } } },
      'snow-leopard': { H: 0.6, BL: 1.15, fur: 0.03, tail: { type: 'bushy', len: 0.9, r: 0.04 }, eyes: { color: '#9ab0a0' }, coat: { base: '#d8d4cc', back: '#c8c4bc', belly: '#f2f0ec', pattern: { type: 'rosettes', color: '#3a3836', scale: 1.1 } } },
      cheetah: { H: 0.8, BL: 1.25, tuck: 0.4, bw: 0.55, legs: { r: 0.03 }, head: { len: 0.3, w: 0.38, mlen: 0.28 }, coat: { base: '#d8b06a', back: '#c8a05a', belly: '#f6eedc', pattern: { type: 'spots', color: '#141210', scale: 4, amount: 0.8 }, face: { spectacles: null } }, tail: { len: 0.6, r: 0.025 } },
      jaguar: { H: 0.75, BL: 1.4, bw: 0.78, head: { w: 0.45, len: 0.38 }, legs: { r: 0.045 }, coat: { base: '#d89a4a', back: '#c88a3a', belly: '#f4eadc', pattern: { type: 'rosettes', color: '#141210', scale: 1.1, color2: '#141210' } }, tail: { len: 0.45 } },
      cougar: { H: 0.75, BL: 1.3, coat: { base: '#b8946a', back: '#a8845a', belly: '#ece2d2', muzzle: '#f4eee4' }, tail: { len: 0.7, r: 0.03, type: 'cat' } },
      lynx: { H: 0.6, BL: 0.95, fur: 0.035, legs: { r: 0.045, paw: 0.09 }, ears: { type: 'cat', len: 0.36, tuft: 0.5 }, tail: { type: 'short', len: 0.12, r: 0.04 }, coat: { base: '#b8a088', back: '#a08870', belly: '#ece4d8', pattern: { type: 'spots', color: '#5a4a3a', scale: 1.8, amount: 0.55 }, tailTip: '#141210' } },
      panther: { H: 0.72, BL: 1.35, eyes: { color: '#d8c030' }, coat: { base: '#161412', back: '#100e0c', belly: '#1c1a18', muzzle: null, nose: '#1e1a18' } },
    },
  },
  canine: {
    label: 'Wolf & Fox', sub: 'wild', base: WOLF,
    trims: ['pup', 'winter-coat', 'dark', 'pale', 'lean'],
    variants: {
      wolf: {},
      'arctic-wolf': { fur: 0.04, coat: { base: '#f2f0ea', back: '#e6e2da', belly: '#f8f6f2', tailTip: null } },
      fox: { H: 0.38, BL: 0.55, bw: 0.6, head: { len: 0.4, w: 0.25, mlen: 0.55, mw: 0.42, mh: 0.42, stop: 0.25 }, ears: { len: 0.5, w: 0.6 }, legs: { r: 0.028 }, tail: { type: 'bushy', len: 0.75, r: 0.05 }, coat: { base: '#c8622a', back: '#b8521e', belly: '#f6f2ea', points: '#1a1412', pointsH: 0.3, earPoints: true, tailTip: '#f6f2ea', muzzle: '#f6f2ea', muzzleStart: 0.7, face: { mask: '#f6f2ea', maskStart: 0.55, maskTop: -0.2 } } },
      'arctic-fox': { H: 0.3, BL: 0.5, fur: 0.05, head: { len: 0.4, mlen: 0.45, mw: 0.45 }, ears: { len: 0.32, w: 0.75 }, tail: { type: 'bushy', len: 0.6, r: 0.06 }, coat: { base: '#f6f4f0', back: '#ecebe6', belly: '#fafaf8', tailTip: null, face: null, muzzle: null } },
      fennec: { H: 0.2, BL: 0.3, head: { len: 0.45, w: 0.3, mlen: 0.42, mw: 0.4 }, ears: { len: 1.2, w: 0.55, splay: 0.45 }, eyes: { r: 0.08 }, tail: { type: 'bushy', len: 0.7, r: 0.05 }, coat: { base: '#e8d0a8', back: '#dcc298', belly: '#f6eedc', tailTip: '#2a2018', face: null, muzzle: null } },
      coyote: { H: 0.6, BL: 0.8, head: { mlen: 0.5, mw: 0.5 }, ears: { len: 0.45 }, coat: { base: '#a88a64', back: '#6e5a44', belly: '#e8dcc8' } },
      jackal: { H: 0.45, BL: 0.7, ears: { len: 0.5 }, coat: { base: '#c89a5a', back: '#c89a5a', belly: '#efe2c8', saddle: '#2a241e', saddleLow: 0.35, saddleFront: 0.2, tailTip: '#1a1612' } },
      hyena: { H: 0.82, BL: 0.95, chest: 0.55, bw: 0.68, croup: 0.8, haunch: 0.68, tuck: 0.22, muscle: 0.7, fur: 0.012, humps: [{ at: 0.9, h: 0.12, w: 0.06 }], head: { len: 0.42, w: 0.36, h: 0.32, mlen: 0.36, mw: 0.72, mh: 0.7, ang: 22, stop: 0.3, jowl: 0.35, flews: 0.05, drop: 0.5 }, neck: { len: 0.3, ang: 28, r0: 0.2, r1: 0.16, w: 0.85 }, legs: { r: 0.036 }, ears: { type: 'round', len: 0.3, w: 0.85, cup: 0.9, a: 0.62, splay: 0.45 }, eyes: { side: 0.3, r: 0.055, color: '#2a1a0e' }, mane: { type: 'upright', h: 0.04, color: '#6a5a46', start: -0.2 }, tail: { type: 'tuft', len: 0.28, r: 0.022, color: '#1a1612' }, coat: { base: '#b69c74', back: '#9a8060', belly: '#cdbb9c', pattern: { type: 'spots', color: '#3a2c1e', scale: 2.2, amount: 0.95 }, muzzle: '#2a2220', muzzleStart: 0.8, face: null, tailTip: null, points: '#4a3a2a', pointsH: 0.12 } },
      'wild-dog': { H: 0.7, BL: 0.85, ears: { type: 'round', len: 0.55, w: 0.75 }, tail: { type: 'bushy', len: 0.42, r: 0.028 }, coat: { base: '#a8783e', back: '#8a6232', belly: '#a8783e', pattern: { type: 'patches', color: '#1a1612', amount: 0.48, scale: 2.2 }, pattern2: { type: 'patches', color: '#efe6d6', amount: 0.65, scale: 2.8 }, muzzle: '#1a1612', muzzleStart: 0.65, face: null, tailTip: '#f4f0ea' } },
    },
  },
  bear: {
    label: 'Bear', sub: 'wild', base: BEAR,
    trims: ['cub', 'fluffy', 'dark', 'pale', 'lean'],
    variants: {
      'brown-bear': {},
      grizzly: { H: 1.05, coat: { base: '#7a5a3a', back: '#a08060', belly: '#5a3e26', mottle: 0.12 } },
      'polar-bear': { H: 1.3, BL: 2.0, humps: [], neck: { len: 0.42, ang: 18, r0: 0.18, r1: 0.12 }, head: { len: 0.38, w: 0.26, mlen: 0.48, mw: 0.5 }, ears: { len: 0.14 }, coat: { base: '#f2efe6', back: '#ece8dc', belly: '#e8e2d4', muzzle: null, nose: '#141210' } },
      'black-bear': { H: 0.85, BL: 1.4, humps: [], ears: { len: 0.26 }, coat: { base: '#1a1714', back: '#141210', belly: '#1e1a16', muzzle: '#a08060', muzzleStart: 0.72 } },
      panda: { H: 0.75, BL: 1.3, humps: [], head: { len: 0.42, w: 0.4, h: 0.36, mlen: 0.28, mw: 0.5 }, ears: { len: 0.24 }, tail: { len: 0.08 }, coat: { base: '#f4f2ec', back: '#ece9e2', belly: '#f0ede6', points: '#141210', pointsH: 0.55, earPoints: true, muzzle: null, face: { spectacles: '#141210' }, band: { color: '#141210', from: 0.3, to: 0.62 } } },
      'sun-bear': { H: 0.65, BL: 1.1, humps: [], fur: 0.008, ears: { len: 0.16 }, coat: { base: '#1a1714', back: '#141210', belly: '#1e1a16', chest: '#e8b84a', muzzle: '#d8b888', muzzleStart: 0.65 } },
    },
  },
  small: {
    label: 'Small Mammal', sub: 'wild', base: SMALL,
    trims: ['baby', 'chubby', 'fluffy', 'dark', 'pale'],
    variants: {
      rabbit: { H: 0.15, BL: 0.22, chest: 0.78, bw: 0.95, croup: 1.32, sway: -0.3, hips: 1.15, haunch: 1.15, tuck: 0, legs: { hind: { type: 'haunch', r: 0.075, foot: 0.62, footH: 0.05, thigh: 1.1 }, front: { r: 0.042, wrist: 0.09, paw: 0.07, pawLen: 0.16 } }, neck: { len: 0.14, ang: 58, r0: 0.3, r1: 0.25 }, head: { len: 0.6, w: 0.34, h: 0.34, mlen: 0.36, mw: 0.62, ang: 18 }, ears: { type: 'rabbit', len: 1.15, w: 0.3, splay: 0.15, tilt: 0.12 }, tail: { type: 'pom', len: 0.14, r: 0.16, drop: 0.02, color: '#f6f2ec' }, coat: { base: '#9a8068', back: '#80684e', belly: '#ece4d8', tailTip: '#f6f2ec' }, gaitType: 'hop' },
      hare: { H: 0.24, BL: 0.36, chest: 0.66, bw: 0.8, croup: 1.32, sway: -0.25, hips: 1.1, haunch: 1.1, tuck: 0.08, fur: 0.02, legs: { hind: { type: 'haunch', r: 0.06, foot: 0.7, footH: 0.04, knee: 0.48 }, front: { r: 0.034, wrist: 0.12, pawLen: 0.15 } }, neck: { len: 0.18, ang: 55, r0: 0.24, r1: 0.2 }, head: { len: 0.48, mlen: 0.42, ang: 16 }, ears: { type: 'rabbit', len: 1.45, w: 0.25, earTip: '#141210' }, tail: { type: 'pom', len: 0.12, r: 0.11, drop: 0.02 }, coat: { base: '#a08460', back: '#806848', belly: '#ece4d8', earTip: '#141210', tailTip: '#f6f2ec' }, gaitType: 'hop' },
      squirrel: { H: 0.1, BL: 0.17, chest: 0.72, bw: 0.85, croup: 1.3, sway: -0.3, tuck: 0.05, legs: { hind: { type: 'haunch', r: 0.07, foot: 0.55, footH: 0.05, claws: true }, front: { r: 0.045, wrist: 0.1 } }, neck: { len: 0.2, ang: 52 }, head: { len: 0.55, mlen: 0.34, ang: 14 }, ears: { type: 'erect', len: 0.32, w: 0.6, tuft: 0.2 }, tail: { type: 'plume', len: 0.95, r: 0.2, drop: 0.05 }, coat: { base: '#b8642a', back: '#a0541e', belly: '#f2e8d8' } },
      chipmunk: { H: 0.06, BL: 0.11, chest: 0.74, croup: 1.28, sway: -0.28, legs: { hind: { type: 'haunch', r: 0.07, foot: 0.5, footH: 0.05 }, front: { r: 0.045, wrist: 0.1 } }, neck: { len: 0.18, ang: 48 }, head: { len: 0.6, mlen: 0.36 }, tail: { type: 'up', len: 0.75, r: 0.09, hair: true }, coat: { base: '#b8844a', back: '#9a6a38', belly: '#f2e6d0', saddle: '#2a2018', saddleLow: 0.85, saddleFront: 1.4 } },
      hamster: { H: 0.055, BL: 0.075, chest: 0.94, bw: 1.2, croup: 1.08, sway: -0.2, hips: 1.1, haunch: 1.1, tuck: -0.1, legs: { r: 0.07, paw: 0.1, wrist: 0.06, hock: 0.08 }, neck: { len: 0.04, ang: 25, r0: 0.4, r1: 0.36 }, head: { len: 0.62, w: 0.48, h: 0.42, mlen: 0.28, mw: 0.62, stop: 0.2, jowl: 0.35, cheek: 1.1 }, ears: { len: 0.25 }, tail: { type: 'none' }, coat: { base: '#d8a868', back: '#c8985a', belly: '#f6f0e6' } },
      'guinea-pig': { H: 0.08, BL: 0.17, chest: 0.92, bw: 1.0, croup: 1.02, sway: -0.08, tuck: -0.08, legs: { r: 0.065, paw: 0.08, wrist: 0.05, hock: 0.06 }, neck: { len: 0.05, ang: 20, r0: 0.4, r1: 0.37 }, head: { len: 0.7, w: 0.42, mlen: 0.35, mw: 0.62, stop: 0.1 }, ears: { type: 'rose', len: 0.25, w: 0.8 }, tail: { type: 'none' }, coat: { base: '#f4f0e8', back: '#ece6dc', belly: '#f6f2ea', pattern: { type: 'patches', color: '#c87a3a', amount: 0.5, scale: 2.5 }, pattern2: { type: 'patches', color: '#1e1a16', amount: 0.62, scale: 3 } } },
      mouse: { H: 0.03, BL: 0.08, chest: 0.92, croup: 1.28, sway: -0.28, fur: 0.008, legs: { hind: { type: 'haunch', r: 0.06, foot: 0.62, footH: 0.04 }, front: { r: 0.038, wrist: 0.06 } }, neck: { len: 0.1, ang: 26 }, head: { len: 0.82, mlen: 0.56, mw: 0.34 }, ears: { type: 'round', len: 0.4, w: 0.72, a: 0.95 }, eyes: { r: 0.135, side: 0.85 }, tail: { type: 'trail', len: 1.1, r: 0.018, color: '#d6aea6' }, coat: { base: '#8a8078', back: '#77695f', belly: '#cbc2b8', nose: '#e2a6a6' } },
      rat: { H: 0.06, BL: 0.18, chest: 0.8, croup: 1.2, sway: -0.15, fur: 0.01, legs: { hind: { type: 'haunch', r: 0.065, foot: 0.65, footH: 0.05 }, front: { r: 0.045, wrist: 0.08 } }, neck: { len: 0.18, ang: 28 }, head: { len: 0.65, mlen: 0.5, mw: 0.42 }, ears: { type: 'round', len: 0.35 }, tail: { type: 'trail', len: 1.0, r: 0.03, color: '#d8a8a0' }, coat: { base: '#6a5e54', back: '#5a4e44', belly: '#a89a8c', nose: '#e0a8a8' } },
      hedgehog: { H: 0.08, BL: 0.16, chest: 0.92, bw: 1.05, croup: 1.05, sway: -0.3, tuck: -0.05, fur: 0, spines: { len: 0.28 }, legs: { r: 0.06, wrist: 0.05, hock: 0.06 }, neck: { len: 0.1, ang: 15 }, head: { len: 0.6, mlen: 0.5, mw: 0.4, stop: 0.2, ang: 22 }, ears: { len: 0.2 }, tail: { type: 'none' }, coat: { base: '#7a6a5a', back: '#4a3e34', belly: '#d8ccbc', mottle: 0.25, muzzle: '#d8ccbc', muzzleStart: 0.3 } },
      raccoon: { H: 0.26, BL: 0.48, chest: 0.7, croup: 1.22, sway: -0.35, tuck: 0.05, fur: 0.035, legs: { type: 'planti', r: 0.045, foot: 0.25, claws: false }, ears: { type: 'round', len: 0.32, w: 0.8, earTip: '#f2eee6' }, tail: { type: 'bushy', len: 0.5, r: 0.075 }, coat: { base: '#8a8580', back: '#6a6560', belly: '#a8a49e', pattern: { type: 'bands', color: '#1a1816', rings: 6 }, face: { spectacles: '#1a1816' }, muzzle: '#f2eee6', muzzleStart: 0.7, points: '#2a2826', pointsH: 0.2 } },
      skunk: { H: 0.18, BL: 0.38, chest: 0.7, croup: 1.2, sway: -0.3, fur: 0.03, legs: { type: 'planti', r: 0.05, foot: 0.3, claws: true }, tail: { type: 'plume', len: 0.8, r: 0.16, drop: 0.05 }, coat: { base: '#141210', back: '#141210', belly: '#1a1816', saddle: '#f6f4f0', saddleLow: 0.82, saddleFront: 1.6, face: { blaze: '#f6f4f0' }, muzzle: null } },
      otter: { H: 0.22, BL: 0.75, chest: 0.72, sway: -0.12, bw: 0.85, croup: 1.0, tuck: 0, legs: { type: 'planti', r: 0.055, foot: 0.3 }, neck: { len: 0.35, r0: 0.26, r1: 0.2 }, head: { len: 0.5, w: 0.32, mlen: 0.3, mw: 0.7, stop: 0.2 }, ears: { len: 0.12 }, tail: { type: 'thick', len: 0.5, r: 0.12 }, coat: { base: '#5a3e2a', back: '#4a3220', belly: '#a8907a', muzzle: '#c8b4a0', muzzleStart: 0.6 } },
      beaver: { H: 0.28, BL: 0.72, chest: 0.84, bw: 1.05, croup: 1.15, sway: -0.2, tuck: -0.05, hips: 1.1, legs: { type: 'planti', r: 0.06, foot: 0.35, claws: true }, neck: { len: 0.2, r0: 0.3, r1: 0.25 }, head: { len: 0.55, w: 0.38, mlen: 0.35, mw: 0.62 }, ears: { len: 0.12 }, tail: { type: 'paddle', len: 0.42, r: 0.17, flat: true, drop: 0.25, color: '#2a2420' }, coat: { base: '#6a4a30', back: '#5a3e26', belly: '#7a5a3e' } },
      ferret: { H: 0.11, BL: 0.36, chest: 0.72, bw: 0.8, tuck: 0, croup: 1.12, sway: -0.3, legs: { r: 0.06 }, neck: { len: 0.55, ang: 25, r0: 0.25, r1: 0.2 }, tail: { len: 0.45, r: 0.06, hair: true }, coat: { base: '#e2d4bc', back: '#c8b494', belly: '#ece2d0', points: '#3a2e24', pointsH: 0.6, face: { spectacles: '#3a2e24' } } },
      badger: { H: 0.28, BL: 0.7, chest: 0.8, bw: 1.25, sway: -0.08, croup: 1.0, tuck: 0, fur: 0.03, legs: { type: 'planti', r: 0.065, foot: 0.3, claws: true }, head: { len: 0.6, w: 0.3, mlen: 0.45, mw: 0.45 }, ears: { len: 0.15 }, tail: { type: 'short', len: 0.15, r: 0.08 }, coat: { base: '#8a8580', back: '#6a6560', belly: '#2a2624', points: '#1a1816', pointsH: 0.8, face: { blaze: '#f2f0ec', blazeStart: 0 }, muzzle: null, mask: null } },
    },
  },
};

/* Special big animals (custom anatomy layered on the quadruped generator) */
const ELEPHANT = {
  H: 3.0, BL: 3.1, chest: 0.48, bw: 0.85, croup: 0.92, tuck: 0.0, creases: 1,
  neck: { len: 0.12, ang: 10, r0: 0.2, r1: 0.18, w: 0.85, root: 0.32 },
  head: { len: 0.32, w: 0.4, h: 0.48, mlen: 0.25, mw: 0.5, mh: 0.5, ang: 70, stop: 0, jowl: 0.2, nose: 'none', noseLeather: false, drop: 0.3, rise: 0.5 },
  legs: { type: 'planti', r: 0.07, foot: 0.2, footH: 0.06, ankle: 0.1, nails: 4 },
  trunk: { len: 0.62, r0: 0.07, r1: 0.025 },
  tusks: { len: 0.45, r: 0.03, t: 0.82, a: 2.2, spread: 0.18, lift: 0.0 },
  ears: { type: 'elephant', len: 1.1, w: 0.85, a: 1.25, t: 0.25, th: 0.03 },
  eyes: { side: 1, r: 0.03, color: '#2a1a10' },
  tail: { type: 'tuft', len: 0.4, r: 0.012 },
  coat: { base: '#8a8580', back: '#7a7570', belly: '#8a8580', noseLeather: false, lips: false, mottle: 0.15, nail: '#cfc4b0' },
  gait: 0.6,
};
const GIRAFFE = {
  H: 3.0, BL: 1.7, chest: 0.34, bw: 0.7, croup: 0.78, tuck: 0.15,
  neck: { len: 0.62, ang: 62, r0: 0.08, r1: 0.04, w: 0.6, root: 0.45 },
  head: { len: 0.2, w: 0.22, h: 0.22, mlen: 0.55, mw: 0.62, mh: 0.6, ang: 48, stop: 0.1, nose: 'deer', drop: 0.5 },
  legs: { type: 'ungu', r: 0.012, knee: 0.32, hock: 0.36, fetlock: 0.07, pastern: 0.03, hoofH: 0.03 },
  cloven: true,
  horns: { type: 'ossicone', len: 0.18, r: 0.045 },
  ears: { type: 'deer', len: 0.4, w: 0.42, a: 1.1, t: 0.15, splay: 1.2 },
  mane: { type: 'upright', h: 0.025, color: '#6a4424' },
  eyes: { side: 1, r: 0.07, color: '#120b07' },
  tail: { type: 'tuft', len: 0.55, r: 0.008, color: '#1a1410' },
  coat: { base: '#f2e2c4', back: '#eedcbc', belly: '#f4ead8', pattern: { type: 'giraffe', color: '#8a4a22', scale: 1.4 }, nose: '#3a2a20', noseStart: 0.92, lips: false },
  gait: 0.6,
};
const RHINO = {
  H: 1.75, BL: 2.6, chest: 0.6, bw: 0.85, croup: 0.92, tuck: 0.0, creases: 0.9,
  neck: { len: 0.2, ang: 5, r0: 0.22, r1: 0.18, w: 0.85, root: 0.4 },
  head: { len: 0.45, w: 0.25, h: 0.24, mlen: 0.45, mw: 0.85, mh: 0.68, ang: 40, stop: 0, nose: 'horse', drop: 0.5, rise: 0.1 },
  legs: { type: 'planti', r: 0.055, foot: 0.12, footH: 0.06, ankle: 0.12, nails: 3 },
  horns: { type: 'rhino', len: 0.55, r: 0.11, color: '#8a8070', tip: '#5a5048' },
  ears: { type: 'erect', len: 0.32, w: 0.45, a: 0.7, t: 0.1, cup: 1, splay: 0.4 },
  eyes: { side: 1, r: 0.03, color: '#1a100a' },
  tail: { type: 'tuft', len: 0.25, r: 0.015 },
  coat: { base: '#8a8680', back: '#7a7670', belly: '#9a9690', noseLeather: false, lips: false, mottle: 0.12, nail: '#7a7268' },
  gait: 0.7,
};
const HIPPO = derive(RHINO, {
  H: 1.45, BL: 2.6, chest: 0.72, bw: 1.0, tuck: -0.1, creases: 0.5,
  legs: { r: 0.06, ankle: 0.1, nails: 4 },
  head: { len: 0.5, w: 0.32, h: 0.3, mlen: 0.55, mw: 1.0, mh: 0.72, ang: 20, me: 3, flare: 1.3, drop: 0.2 },
  horns: null,
  ears: { type: 'round', len: 0.12, w: 0.8, a: 0.5, t: 0.08 },
  eyes: { side: 0.9, r: 0.035 },
  tail: { type: 'short', len: 0.12, r: 0.03 },
  coat: { base: '#7a6a68', back: '#6a5a58', belly: '#c8968a', mottle: 0.1 },
});
const CAMEL = {
  H: 1.9, BL: 1.6, chest: 0.4, bw: 0.65, croup: 0.92, tuck: 0.25,
  humps: [{ at: 0.5, h: 0.7, w: 0.09 }],
  neck: { len: 0.48, ang: 15, r0: 0.09, r1: 0.055, w: 0.65, root: 0.5 },
  head: { len: 0.24, w: 0.22, h: 0.22, mlen: 0.5, mw: 0.6, mh: 0.58, ang: 5, stop: 0.1, nose: 'horse', drop: 0.4 },
  legs: { type: 'ungu', r: 0.016, knee: 0.33, hock: 0.36, fetlock: 0.08, pastern: 0.04, hoofH: 0.03 },
  cloven: true,
  ears: { type: 'round', len: 0.2, w: 0.7, a: 0.9, t: 0.08 },
  eyes: { side: 1, r: 0.07, color: '#1a100a' },
  tail: { type: 'tuft', len: 0.4, r: 0.012 },
  fur: 0.008,
  coat: { base: '#c8a070', back: '#b89060', belly: '#d8b484', nose: '#3a2a20', noseStart: 0.94, lips: false, hoof: '#4a3a30' },
  gait: 0.7,
};

QUAD_TYPES.elephant = { label: 'Elephant', sub: 'wild', base: ELEPHANT, trims: ['calf', 'tusker', 'tuskless', 'old', 'decorated'], variants: {
  'african-elephant': {},
  'asian-elephant': { H: 2.7, BL: 2.8, head: { h: 0.55, rise: 0.7 }, humps: [{ at: 0.6, h: 0.12 }], ears: { len: 0.7, w: 0.75 }, tusks: { len: 0.3 }, coat: { base: '#7a7470', back: '#6a6460' } },
  mammoth: { H: 3.3, BL: 3.0, croup: 0.82, fur: 0.07, feather: 0.06, humps: [{ at: 0.85, h: 0.3 }], head: { rise: 0.9, h: 0.55 }, ears: { len: 0.45 }, tusks: { len: 0.75, r: 0.035, spread: 0.28, lift: -0.3 }, coat: { base: '#5a3e26', back: '#4a321e', belly: '#4e3622', mottle: 0.2 } },
} };
QUAD_TYPES.giraffe = { label: 'Giraffe', sub: 'wild', base: GIRAFFE, trims: ['calf', 'old', 'dark'], variants: {
  reticulated: {},
  masai: { coat: { pattern: { type: 'giraffe', color: '#6a3a1e', scale: 2.2 } } },
  okapi: { H: 1.6, BL: 1.5, chest: 0.48, croup: 0.92, neck: { len: 0.42, ang: 48, r0: 0.1, r1: 0.06 }, head: { len: 0.28 }, horns: { type: 'ossicone', len: 0.1, r: 0.04 }, mane: null, ears: { len: 0.55 }, legs: { r: 0.018 }, coat: { base: '#3a1e16', back: '#2a1410', belly: '#3a1e16', pattern: { type: 'zebra', color: '#f2ece2', scale: 1.5, regions: ['leg'] }, muzzle: '#d8c8b0', muzzleStart: 0.5 } },
} };
QUAD_TYPES.rhino = { label: 'Rhino & Hippo', sub: 'wild', base: RHINO, trims: ['calf', 'old', 'muddy'], variants: {
  'white-rhino': {},
  'black-rhino': { H: 1.55, BL: 2.2, head: { mw: 0.6, len: 0.4 }, horns: { len: 0.7 } },
  // horns: null must survive the variant-over-base merge (derive() drops deleted keys from HIPPO)
  hippo: { ...HIPPO, horns: null },
  'pygmy-hippo': { ...derive(HIPPO, { H: 0.8, BL: 1.4, coat: { base: '#4a4240', back: '#3a3230' } }), horns: null },
} };
QUAD_TYPES.camel = { label: 'Camel & Llama', sub: 'farm', base: CAMEL, trims: ['calf', 'saddle', 'blanket', 'packsaddle'], variants: {
  dromedary: {},
  bactrian: { H: 1.8, fur: 0.03, humps: [{ at: 0.28, h: 0.55, w: 0.07 }, { at: 0.72, h: 0.55, w: 0.07 }], coat: { base: '#8a6440', back: '#7a5430', belly: '#9a7450' } },
  llama: { H: 1.15, BL: 1.1, humps: [], fur: 0.03, neck: { len: 0.6, ang: 76, r0: 0.12, r1: 0.085, w: 0.8 }, head: { len: 0.3, mlen: 0.45, w: 0.24, h: 0.24 }, ears: { type: 'erect', len: 0.55, w: 0.35, splay: 0.15 }, tail: { type: 'up', len: 0.15, r: 0.04 }, coat: { base: '#f2ece2', back: '#e6dece', belly: '#f2ece2', pattern: { type: 'patches', color: '#6a4a30', amount: 0.55, scale: 1.4 } } },
  alpaca: { H: 0.9, BL: 0.85, humps: [], wool: 0.08, neck: { len: 0.55, ang: 78, r0: 0.14, r1: 0.1, w: 0.85 }, head: { len: 0.32, mlen: 0.35, w: 0.26, h: 0.26 }, ears: { type: 'erect', len: 0.35, w: 0.4 }, tail: { type: 'up', len: 0.12, r: 0.05 }, coat: { base: '#d8c0a0', back: '#cbb090', belly: '#d8c0a0' } },
} };

/* ------------------------------------------------------------------ */
/* Birds                                                               */
/* ------------------------------------------------------------------ */

const SONG = {
  L: 0.2, body: { len: 0.5, depth: 0.36, width: 0.34, tilt: 28 }, neck: { len: 0.06, r: 0.1, ang: 70 }, head: { r: 0.11, ang: 0 },
  beak: { type: 'cone', len: 0.08, depth: 0.32, color: '#2e2a22' }, wing: { len: 0.42, h: 0.45 }, tail: { len: 0.36, w: 0.12, tilt: -15 },
  legs: { len: 0.14, r: 0.009, color: '#6a5444', toe: 0.1 }, eyes: { r: 0.22 },
  coat: { back: '#6a5b4b', belly: '#efe6da', head: '#4f463e', wing: '#5f5244', primaries: '#3e362e', tail: '#3e362e' },
  gaitType: 'hop', flapPeriod: 0.15,
};
const FOWL = {
  L: 0.46, body: { len: 0.56, depth: 0.42, width: 0.38, tilt: 12 }, neck: { len: 0.17, r: 0.07, ang: 72 }, head: { r: 0.075, ang: 0 },
  beak: { type: 'cone', len: 0.05, depth: 0.45, color: '#e3b04a' }, wing: { len: 0.32, h: 0.5 }, tail: { len: 0.28, w: 0.13, tilt: 40, type: 'fan', vertical: true },
  legs: { len: 0.24, r: 0.02, color: '#e3b04a', feet: 'ground', toe: 0.13 }, eyes: { r: 0.22, color: '#d2862a' },
  coat: { back: '#f2ede2', belly: '#f6f2ea', head: '#f4efe4', wing: '#ece4d4', primaries: '#e2d8c6', tail: '#e8e0d0' },
  fluff: 0.025, flapPeriod: 0.2,
};
const DUCK = {
  L: 0.58, body: { len: 0.56, depth: 0.3, width: 0.36, tilt: 2 }, neck: { len: 0.14, r: 0.055, ang: 75 }, head: { r: 0.075, ang: 0 },
  beak: { type: 'flat', len: 0.1, depth: 0.42, width: 0.5, color: '#d9c43a', tip: '#2a2a1e' }, wing: { len: 0.38, h: 0.45, shape: 'long' }, tail: { len: 0.14, w: 0.12, tilt: 12, type: 'pointed' },
  legs: { len: 0.09, r: 0.012, color: '#f08a1c', feet: 'web', toe: 0.1 }, eyes: { r: 0.2 },
  coat: { back: '#6d6253', belly: '#c9c3b8', breast: '#6b3d2a', head: '#1d5e36', collar: '#f4f4f0', wing: '#8a7f70', primaries: '#4a453e', wingBar: '#2d4fa8', barAt: 0.45, tail: '#2a2a2a' },
  swims: true, flapPeriod: 0.18,
};
const RAPTOR = {
  L: 0.6, body: { len: 0.5, depth: 0.34, width: 0.34, tilt: 50 }, neck: { len: 0.08, r: 0.09, ang: 70 }, head: { r: 0.085, ang: 5 },
  beak: { type: 'hook', len: 0.08, depth: 0.5, color: '#e8c040', tip: '#2a2420' }, wing: { len: 0.55, h: 0.5, span: 1.0 }, tail: { len: 0.3, w: 0.12, tilt: -10 },
  legs: { len: 0.14, r: 0.02, color: '#e8c040', feet: 'raptor', toe: 0.12 }, eyes: { r: 0.24, color: '#d8a020', a: 1.0 },
  coat: { back: '#4a3626', belly: '#6a4a32', head: '#4a3626', wing: '#4a3626', primaries: '#2a1e16', tail: '#4a3626' },
  flapPeriod: 0.5,
};
const WADER = {
  L: 1.0, body: { len: 0.32, depth: 0.2, width: 0.2, tilt: 15 }, neck: { len: 0.32, r: 0.035, ang: 70, s: 0.6 }, head: { r: 0.045, ang: 10 },
  beak: { type: 'long', len: 0.14, depth: 0.45, color: '#e8c060' }, wing: { len: 0.32, h: 0.5, span: 0.85 }, tail: { len: 0.1, w: 0.06, tilt: 0 },
  legs: { len: 0.55, r: 0.008, color: '#3a3430', toe: 0.08 }, eyes: { r: 0.25, color: '#d8c030' },
  coat: { back: '#9aa0a6', belly: '#e8eaec', head: '#f2f2f0', cap: '#1a1a1a', wing: '#8a9096', primaries: '#2a2a2a', tail: '#8a9096' },
  flapPeriod: 0.6,
};

export const BIRD_TYPES = {
  bird: {
    label: 'Bird', sub: 'birds', base: SONG,
    trims: ['chick', 'fluffed', 'juvenile', 'nesting'],
    variants: {
      robin: { coat: { breast: '#d8622e', throat: '#d8622e' } },
      sparrow: { L: 0.15, coat: { back: '#8a6a4a', head: '#7a6a5a', cap: '#8a5a3a', throat: '#2a2420', belly: '#d8d0c4', wing: '#7a5a3a', wingBar: '#efe6da', primaries: '#4a3a2a' } },
      bluejay: { L: 0.28, crest: { h: 0.9, color: '#3a6ad8' }, coat: { back: '#3a6ad8', head: '#3a6ad8', belly: '#e8eaec', collar: '#1a1a1a', wing: '#2a5ac8', wingBar: '#f4f4f4', primaries: '#1a3a98', tail: '#2a5ac8' } },
      cardinal: { L: 0.22, crest: { h: 1.0, color: '#c81e1e' }, beak: { color: '#e87a3a', depth: 0.45 }, coat: { back: '#b81e1e', head: '#d42222', belly: '#c82020', face: '#141212', wing: '#a01818', primaries: '#801414', tail: '#a01818' } },
      crow: { L: 0.45, body: { tilt: 22 }, beak: { len: 0.11, depth: 0.42, color: '#141414' }, legs: { color: '#1a1a1a', len: 0.12 }, coat: { back: '#16161a', belly: '#1a1a1e', head: '#141418', wing: '#18181c', primaries: '#101014', tail: '#141418' }, gaitType: 'walk' },
      raven: { L: 0.62, beak: { len: 0.12, depth: 0.5, color: '#141414' }, legs: { color: '#1a1a1a' }, tail: { type: 'pointed' }, coat: { back: '#121216', belly: '#16161a', head: '#121216', wing: '#141418', primaries: '#0e0e12', tail: '#121216' }, gaitType: 'walk' },
      pigeon: { L: 0.32, body: { tilt: 18 }, head: { r: 0.085 }, beak: { len: 0.06, depth: 0.28, color: '#3a3434' }, legs: { color: '#c8504a' }, coat: { back: '#8a8e98', belly: '#9a9ea8', breast: '#7a8090', head: '#5a6070', collar: '#6a8a7a', wing: '#9aa0aa', wingBar: '#2a2a2e', primaries: '#3a3c44', tail: '#5a5e68' }, eyes: { color: '#d8602a' }, gaitType: 'walk' },
      dove: { L: 0.3, head: { r: 0.08 }, beak: { len: 0.06, depth: 0.28, color: '#2a2424' }, legs: { color: '#c8706a' }, coat: { back: '#c8b8a8', belly: '#e2d6ca', head: '#d0c4b8', collar: '#2a2424', wing: '#c0b0a0', primaries: '#8a7a6a', tail: '#b8a898' }, gaitType: 'walk' },
      parrot: { L: 0.4, body: { tilt: 55 }, head: { r: 0.11 }, beak: { type: 'hook', len: 0.09, depth: 0.7, color: '#2a2a2a' }, legs: { color: '#5a5a5a', feet: 'raptor' }, tail: { len: 0.42, type: 'pointed', w: 0.08 }, coat: { back: '#2aa84a', head: '#3ab85a', belly: '#4ac86a', face: '#e8d84a', wing: '#22983e', wingBar: '#d82a2a', primaries: '#1a4ab8', tail: '#2aa84a' } },
      macaw: { L: 0.85, body: { tilt: 55 }, head: { r: 0.08 }, beak: { type: 'hook', len: 0.09, depth: 0.75, color: '#efe6d6', tip: '#2a2424' }, legs: { color: '#4a4a4a', feet: 'raptor' }, tail: { len: 0.55, type: 'long', w: 0.06 }, coat: { back: '#d82a1e', head: '#e0301e', belly: '#d82a1e', face: '#f4f2ee', wing: '#e8c22a', wingBar: '#2a8ad8', primaries: '#1a5ac8', tail: '#d82a1e', primFrom: 0.35 } },
      cockatoo: { L: 0.45, body: { tilt: 55 }, head: { r: 0.1 }, crest: { h: 1.4, color: '#f2d84a' }, beak: { type: 'hook', len: 0.08, depth: 0.7, color: '#2a2a2a' }, legs: { color: '#4a4a4a', feet: 'raptor' }, coat: { back: '#f4f4f2', head: '#f6f6f4', belly: '#f2f2f0', wing: '#efefec', primaries: '#e6e6e2', tail: '#efefec' } },
      budgie: { L: 0.18, body: { tilt: 45 }, beak: { type: 'hook', len: 0.06, depth: 0.55, color: '#d8b080' }, legs: { color: '#8a8aa8', feet: 'raptor' }, tail: { len: 0.45, type: 'pointed', w: 0.06 }, coat: { back: '#9ad84a', head: '#f2e84a', belly: '#8ad83a', wing: '#e8e04a', wingBar: '#1a1a1a', primaries: '#2a2a20', tail: '#2a5ad8' } },
      hummingbird: { L: 0.09, head: { r: 0.12 }, beak: { type: 'long', len: 0.28, depth: 0.15, color: '#141414' }, wing: { len: 0.5, span: 0.8 }, tail: { len: 0.22 }, legs: { len: 0.06, r: 0.006 }, coat: { back: '#2a9a5a', head: '#2a9a5a', belly: '#d8e2d8', throat: '#d81e5a', wing: '#4a4a4a', primaries: '#3a3a3a', tail: '#2a6a4a' }, flapPeriod: 0.03 },
      woodpecker: { L: 0.24, body: { tilt: 55 }, beak: { type: 'long', len: 0.14, depth: 0.35, color: '#2a2a2a' }, crest: { h: 0.6, color: '#d81e1e' }, tail: { type: 'pointed', w: 0.08 }, legs: { feet: 'raptor' }, coat: { back: '#1a1a1a', head: '#f2f2f0', cap: '#d81e1e', belly: '#f2f2f0', eyeStripe: '#1a1a1a', wing: '#1a1a1a', wingBar: '#f2f2f0', primaries: '#141414', tail: '#1a1a1a' } },
      kingfisher: { L: 0.17, body: { tilt: 35 }, head: { r: 0.13 }, beak: { type: 'long', len: 0.22, depth: 0.42, color: '#1a1a1a', bend: 0 }, tail: { len: 0.2 }, legs: { len: 0.08, color: '#e8502a' }, coat: { back: '#1aa0c8', head: '#1a7ab8', belly: '#e8782a', throat: '#f4f2ee', eyeStripe: '#e8782a', wing: '#1a7ab8', primaries: '#1a5a98', tail: '#1aa0c8' } },
      swallow: { L: 0.18, body: { tilt: 20 }, wing: { len: 0.6, shape: 'long' }, tail: { len: 0.4, type: 'fork', w: 0.14 }, coat: { back: '#1a2a5a', head: '#1a2a5a', belly: '#f2e6d8', throat: '#b8441e', wing: '#141e40', primaries: '#0e1430', tail: '#141e40' } },
    },
  },
  fowl: {
    label: 'Poultry', sub: 'farm', base: FOWL,
    trims: ['chick', 'fluffed', 'juvenile', 'nesting'],
    variants: {
      hen: { comb: { points: 5, size: 0.8 } },
      rooster: { L: 0.6, comb: { points: 6, size: 1.4 }, tail: { len: 0.45, w: 0.16, tilt: 55, type: 'fan' }, coat: { back: '#b8441e', head: '#d8701e', belly: '#2a1a12', breast: '#1e1612', wing: '#8a2a14', wingBar: '#1a4a3a', primaries: '#3a2a1a', tail: '#14281e' } },
      'brown-hen': { comb: { points: 5, size: 0.8 }, coat: { back: '#a8622a', head: '#b8722e', belly: '#c8823a', wing: '#9a5420', primaries: '#6a3a18', tail: '#3a2414' } },
      turkey: { L: 1.0, body: { depth: 0.48, width: 0.45, tilt: 10 }, neck: { len: 0.2, r: 0.04 }, head: { r: 0.05 }, comb: null, wattle: true, tail: { len: 0.4, w: 0.22, tilt: 70, type: 'fan', vertical: false }, beak: { color: '#d8c8a8' }, legs: { color: '#c89a8a' }, coat: { back: '#3a2a20', head: '#c8504a', belly: '#2a2018', breast: '#2a2018', wing: '#4a3a2e', wingBar: '#e8e2d8', primaries: '#3a3028', tail: '#5a4030', speckle: '#e8e2d8' } },
      peacock: { L: 1.1, body: { len: 0.25, depth: 0.2, width: 0.2 }, neck: { len: 0.12, r: 0.03 }, head: { r: 0.04 }, crest: { h: 0.8, color: '#1a4ab8' }, comb: null, tail: { len: 0.6, w: 0.16, tilt: -8, type: 'pointed' }, legs: { color: '#6a6a6a', len: 0.2 }, beak: { color: '#8a8a8a' }, coat: { back: '#1a6a8a', head: '#1a4ab8', belly: '#1a3a8a', breast: '#1a4ab8', wing: '#c8b080', primaries: '#8a5a3a', tail: '#2a7a4a' } },
      ostrich: { L: 2.0, body: { len: 0.45, depth: 0.35, width: 0.35, tilt: 5 }, neck: { len: 0.32, r: 0.018, ang: 85 }, head: { r: 0.03 }, comb: null, beak: { type: 'flat', len: 0.04, depth: 0.5, color: '#d8b8a0' }, legs: { len: 0.45, r: 0.02, color: '#d8a898', toe: 0.08 }, tail: { len: 0.12, w: 0.1, tilt: 20 }, wing: { len: 0.28 }, coat: { back: '#1a1614', head: '#c8a8a0', belly: '#1a1614', wing: '#1a1614', primaries: '#f2f0ec', tail: '#f2f0ec' }, fluff: 0.03 },
      emu: { L: 1.6, body: { len: 0.5, depth: 0.4, width: 0.38, tilt: 0 }, neck: { len: 0.25, r: 0.022, ang: 80 }, head: { r: 0.035 }, comb: null, beak: { type: 'flat', len: 0.05, depth: 0.45, color: '#3a3430' }, legs: { len: 0.4, r: 0.02, color: '#6a6058', toe: 0.08 }, tail: { len: 0.05, w: 0.05 }, wing: { len: 0.15 }, coat: { back: '#6a5a48', head: '#3a4a5a', belly: '#6a5a48', wing: '#6a5a48', primaries: '#4a3e32', tail: '#5a4a3a' }, fluff: 0.05 },
    },
  },
  waterbird: {
    label: 'Water Bird', sub: 'birds', base: DUCK,
    trims: ['chick', 'fluffed', 'juvenile', 'nesting'],
    variants: {
      mallard: {},
      'white-duck': { coat: { back: '#f6f3ea', belly: '#f2efe6', breast: '#f4f1e8', head: '#f6f3ea', collar: null, wing: '#ece6d6', primaries: '#e2dccc', wingBar: null, tail: '#ece6d6' }, beak: { color: '#f08a1c', tip: '#f08a1c' } },
      goose: { L: 0.9, neck: { len: 0.25, r: 0.05 }, beak: { len: 0.07, color: '#f08a1c', tip: '#efe6d6' }, legs: { len: 0.13, color: '#f08a1c' }, coat: { back: '#8a8278', belly: '#e8e4dc', breast: '#b8b2a8', head: '#2a2622', throat: '#f4f2ee', collar: null, wing: '#7a7268', primaries: '#3a3630', wingBar: null, tail: '#2a2622' } },
      'canada-goose': { L: 1.0, neck: { len: 0.27, r: 0.045 }, beak: { len: 0.06, color: '#1a1a1a', tip: '#1a1a1a' }, legs: { len: 0.13, color: '#1a1a1a' }, coat: { back: '#7a6a58', belly: '#e8e2d8', breast: '#c8bca8', head: '#141414', face: '#f4f2ee', collar: null, wing: '#6a5a48', primaries: '#3a3028', wingBar: null, tail: '#141414' } },
      swan: { L: 1.4, body: { len: 0.45, depth: 0.25 }, neck: { len: 0.4, r: 0.03, ang: 80, s: 0.8 }, head: { r: 0.045 }, beak: { len: 0.07, color: '#e8701e', tip: '#1a1a1a' }, legs: { len: 0.08, color: '#2a2a2a' }, coat: { back: '#f8f8f6', belly: '#f6f6f4', breast: '#f8f8f6', head: '#f8f8f6', collar: null, wing: '#f2f2f0', primaries: '#ececea', wingBar: null, tail: '#f2f2f0' } },
      'black-swan': { L: 1.3, body: { len: 0.45, depth: 0.25 }, neck: { len: 0.42, r: 0.028, ang: 80, s: 0.8 }, head: { r: 0.045 }, beak: { len: 0.07, color: '#c81e1e', tip: '#f4f2ee' }, legs: { len: 0.08, color: '#2a2a2a' }, coat: { back: '#141414', belly: '#1a1a1a', breast: '#141414', head: '#141414', collar: null, wing: '#1a1a1a', primaries: '#f4f2ee', wingBar: null, tail: '#141414' } },
      seagull: { L: 0.55, body: { tilt: 10 }, beak: { type: 'cone', len: 0.09, depth: 0.4, color: '#e8c03a', tip: '#d8301e' }, legs: { len: 0.13, color: '#e8a88a' }, wing: { len: 0.5, shape: 'long' }, tail: { type: 'fan', len: 0.15 }, coat: { back: '#a8b0b8', belly: '#f6f6f6', breast: '#f6f6f6', head: '#f8f8f8', collar: null, wing: '#9aa2aa', primaries: '#141414', wingBar: null, tail: '#f4f4f4' }, eyes: { color: '#e8d84a' }, flapPeriod: 0.4 },
      pelican: { L: 1.5, body: { len: 0.4, depth: 0.28 }, neck: { len: 0.2, r: 0.04, s: 0.5 }, head: { r: 0.05 }, beak: { type: 'flat', len: 0.25, depth: 0.5, width: 0.35, color: '#e8b07a', tip: '#e8701e' }, legs: { len: 0.1, color: '#8a8a8a' }, coat: { back: '#f2f2f0', belly: '#f2f2f0', breast: '#f2f2f0', head: '#f6f2e0', collar: null, wing: '#e8e8e6', primaries: '#1a1a1a', wingBar: null, tail: '#e8e8e6' } },
      puffin: { L: 0.3, body: { len: 0.55, depth: 0.42, tilt: 40 }, head: { r: 0.11 }, beak: { type: 'cone', len: 0.1, depth: 0.85, width: 0.35, color: '#e8701e', tip: '#3a5a8a' }, legs: { len: 0.1, color: '#e8701e' }, coat: { back: '#141414', belly: '#f4f4f2', breast: '#f4f4f2', head: '#141414', face: '#e8e8e6', collar: null, wing: '#141414', primaries: '#101010', wingBar: null, tail: '#141414' }, gaitType: 'walk' },
      penguin: { penguin: true, H: 1.15, bill: 0.12, stripe: '#e8902a', feet: '#2a2a2a', coat: { back: '#16181c', belly: '#f6f6f2', breast: '#f6e8b0', patch: '#f2a21e', patchAt: 0.8 } },
      'king-penguin': { penguin: true, H: 0.92, bill: 0.14, stripe: '#f08a1e', feet: '#2a2a2a', fat: 0.92, coat: { back: '#1e2228', belly: '#f6f6f2', breast: '#f6c050', patch: '#f28a1e', patchAt: 0.82 } },
      adelie: { penguin: true, H: 0.7, bill: 0.07, headR: 0.58, feet: '#e8a0a0', blackThroat: 0.76, coat: { back: '#141418', belly: '#f8f8f6', eyeRing: '#f8f8f6', breast: null } },
      gentoo: { penguin: true, H: 0.8, bill: 0.08, billColor: '#e8501e', feet: '#f08a2a', blackThroat: 0.76, coat: { back: '#1e2024', belly: '#f8f8f6', band: '#f8f8f6', breast: null } },
      chinstrap: { penguin: true, H: 0.72, bill: 0.07, feet: '#e8a0a0', blackThroat: 0.9, coat: { back: '#1c1e22', belly: '#f8f8f6', face: '#f8f8f6', chinstrap: true, breast: null } },
      flamingo: { ...WADER, L: 1.3, neck: { len: 0.4, r: 0.03, ang: 75, s: 0.9 }, beak: { type: 'hook', len: 0.1, depth: 0.55, color: '#f2c8b8', tip: '#141414' }, legs: { len: 0.6, r: 0.008, color: '#e88a8a', feet: 'web' }, coat: { back: '#f29aa0', belly: '#f6b0b2', breast: '#f6b0b2', head: '#f4a4a8', cap: null, collar: null, wing: '#e87880', primaries: '#141414', wingBar: null, tail: '#f29aa0' } },
      heron: { ...WADER },
      stork: { ...WADER, L: 1.1, beak: { type: 'long', len: 0.18, depth: 0.5, color: '#d8301e' }, legs: { len: 0.5, r: 0.01, color: '#d8301e' }, coat: { back: '#f4f4f2', belly: '#f6f6f4', breast: '#f6f6f4', head: '#f6f6f4', cap: null, collar: null, wing: '#f2f2f0', primaries: '#141414', wingBar: null, tail: '#f2f2f0' } },
    },
  },
  raptor: {
    label: 'Bird of Prey', sub: 'birds', base: RAPTOR,
    trims: ['chick', 'fluffed', 'juvenile', 'nesting'],
    variants: {
      'golden-eagle': {},
      'bald-eagle': { coat: { back: '#3a2a1e', belly: '#3a2a1e', head: '#f6f6f4', headFrom: 0.86, wing: '#3a2a1e', primaries: '#1e1610', tail: '#f6f6f4' } },
      hawk: { L: 0.5, coat: { back: '#6a4a32', belly: '#efe2cc', breast: '#efe2cc', head: '#6a4a32', wing: '#5a3e2a', primaries: '#2a1e16', tail: '#b8542a', speckle: '#6a4a32' } },
      falcon: { L: 0.42, wing: { shape: 'long' }, coat: { back: '#4a5058', belly: '#efe8dc', head: '#2a2e34', face: '#2a2e34', wing: '#4a5058', primaries: '#22262c', tail: '#4a5058', speckle: '#3a3e44' } },
      owl: { L: 0.4, body: { tilt: 70, depth: 0.42, width: 0.42 }, neck: { len: 0.02, r: 0.14 }, head: { r: 0.15, ang: 0 }, beak: { len: 0.05, depth: 0.4 }, eyes: { r: 0.3, color: '#e8a01e', a: 0.55 }, tail: { len: 0.15 }, legs: { color: '#c8b8a0' }, coat: { back: '#8a6a48', belly: '#d8c4a4', head: '#8a6a48', face: '#e8d8bc', wing: '#7a5a3a', wingBar: '#e8d8bc', primaries: '#5a4028', tail: '#7a5a3a', speckle: '#4a3420' }, fluff: 0.03 },
      'snowy-owl': { L: 0.6, body: { tilt: 70, depth: 0.42, width: 0.42 }, neck: { len: 0.02, r: 0.14 }, head: { r: 0.15, ang: 0 }, beak: { len: 0.05, depth: 0.4, color: '#2a2a2a' }, eyes: { r: 0.3, color: '#f2d01e', a: 0.55 }, tail: { len: 0.15 }, legs: { color: '#f6f6f4' }, coat: { back: '#f6f6f4', belly: '#f8f8f6', head: '#f8f8f6', wing: '#f2f2f0', primaries: '#e8e8e6', tail: '#f2f2f0', speckle: '#2a2a2a' }, fluff: 0.04 },
      vulture: { L: 0.75, neck: { len: 0.12, r: 0.03 }, head: { r: 0.05 }, coat: { back: '#2a2420', belly: '#2a2420', head: '#c8908a', headFrom: 0.8, collar: '#efe6d6', wing: '#2a2420', primaries: '#1a1614', tail: '#2a2420' } },
    },
  },
};
