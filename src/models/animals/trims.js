import { derive } from './species.js';

/*
 * Trims: real geometric versions of a species — age (baby/old), build (lean/heavy),
 * coat length, sex differences (doe, young buck, tusker…) and worn accessories.
 * apply(spec, kind) → { spec, accessories }
 */

const ACCESSORY = new Set(['collar-x', 'harness', 'sweater', 'raincoat', 'bandana', 'service-vest', 'spiked-collar', 'bell-collar', 'bow', 'saddle', 'western-saddle', 'racing', 'bridle', 'halter', 'blanket', 'packsaddle', 'cowbell', 'ear-tag', 'nose-ring', 'decorated']);
const ALIAS = { bell: 'cowbell' };

function baby(s, { size = 0.4, legs = 1, kind = 'quad' } = {}) {
  const o = derive(s, {
    H: s.H * size,
    BL: s.BL * size * 0.88,
    chest: s.chest * (legs > 1 ? 0.84 : 1.12),
    bw: s.bw * 1.15,
    tuck: 0,
    muscle: 0,
    head: { len: s.head.len * 1.5, stop: Math.min(1, (s.head.stop ?? 0.2) + 0.3), mlen: s.head.mlen * 0.72, w: s.head.w * 1.08 },
    neck: { len: s.neck.len * 0.88, r0: s.neck.r0 * 1.1, r1: s.neck.r1 * 1.15 },
    legs: { r: (s.legs.r ?? 0.03) * (legs > 1 ? 0.95 : 1.15) },
    eyes: { r: (s.eyes?.r ?? 0.06) * 1.45 },
    fur: (s.fur ?? 0) + 0.012,
  });
  if (s.ears) o.ears.len = s.ears.len * 1.25;
  if (s.tail) o.tail.len = s.tail.len * 0.75;
  for (const k of ['horns', 'antlers', 'tusks', 'beard', 'dewlap', 'udder']) delete o[k];
  if (o.mane) o.mane = o.mane.type === 'lion' ? undefined : { ...o.mane, h: o.mane.h * 0.6 };
  if (!o.mane) delete o.mane;
  if (o.humps) o.humps = o.humps.map((h) => ({ ...h, h: h.h * 0.5 }));
  if (o.wool) o.wool *= 0.6;
  void kind;
  return o;
}

const Q = {
  puppy: (s) => baby(s, { size: 0.42 }),
  kitten: (s) => baby(s, { size: 0.45 }),
  cub: (s) => baby(s, { size: 0.38 }),
  pup: (s) => baby(s, { size: 0.4 }),
  baby: (s) => baby(s, { size: 0.5 }),
  piglet: (s) => baby(s, { size: 0.32 }),
  lamb: (s) => baby(s, { size: 0.5, legs: 1.2 }),
  foal: (s) => baby(s, { size: 0.62, legs: 1.3 }),
  calf: (s) => baby(s, { size: 0.5, legs: 1.25 }),
  fawn: (s) => {
    const o = baby(s, { size: 0.55, legs: 1.3 });
    o.coat = { ...o.coat, pattern: { type: 'spots', color: '#f6efe2', scale: 2, amount: 0.6, regions: ['body'] } };
    return o;
  },
  young: (s) => baby(s, { size: 0.7, legs: 1.1 }),
  juvenile: (s) => baby(s, { size: 0.75 }),
  senior: (s) => derive(s, { sway: 0.12, tuck: (s.tuck ?? 0.1) - 0.05, neck: { ang: (s.neck.ang ?? 40) - 8 }, head: { ang: (s.head.ang ?? 20) + 10 }, muscle: 0.2, coat: { muzzle: '#d8d2c8', muzzleStart: 0.6 } }),
  old: (s) => Q.senior(s),
  'long-coat': (s) => derive(s, { fur: (s.fur ?? 0) + 0.055, feather: 0.02, tail: { type: 'bushy', hair: true, r: (s.tail?.r ?? 0.03) * 1.4 }, coat: { base: '#' + mixHex(s.coat.base, '#b8642a', 0.45), back: '#' + mixHex(s.coat.back ?? s.coat.base, '#8a4a1e', 0.45) } }),
  'long-hair': (s) => Q['long-coat'](s),
  fluffy: (s) => derive(s, { fur: (s.fur ?? 0) + 0.06, ...(s.mane ? {} : { mane: { type: 'lion', size: 0.35, color: s.coat.back ?? s.coat.base, tip: s.coat.belly ?? s.coat.base } }) }),
  'winter-coat': (s) => derive(s, { fur: (s.fur ?? 0) + 0.075, feather: (s.feather ?? 0) + 0.03, coat: { back: '#' + mixHex(s.coat.back ?? s.coat.base, '#3a3028', 0.35) } }),
  'heavy-fleece': (s) => derive(s, { wool: (s.wool ?? 0) + 0.13, fur: (s.fur ?? 0) + 0.03, coat: { base: '#' + mixHex(s.coat.base, '#c8b89a', 0.5), mottle: 0.15 } }),
  chubby: (s) => derive(s, { bw: s.bw * 1.22, tuck: (s.tuck ?? 0.1) - 0.2, chest: s.chest * 1.08 }),
  heavy: (s) => derive(s, { bw: s.bw * 1.2, tuck: (s.tuck ?? 0.1) - 0.15, muscle: (s.muscle ?? 0.5) + 0.4, neck: { r0: s.neck.r0 * 1.12 } }),
  lean: (s) => derive(s, { bw: s.bw * 0.84, tuck: (s.tuck ?? 0.1) + 0.14, muscle: (s.muscle ?? 0.5) + 0.3, chest: s.chest * 0.95 }),
  braided: (s) => derive(s, { mane: { type: 'braided' }, tail: { r: (s.tail?.r ?? 0.03) * 0.7 } }),
  dehorned: (s) => derive(s, { horns: null }),
  doe: (s) => derive(s, { antlers: null, neck: { r0: s.neck.r0 * 0.9 }, H: s.H * 0.92 }),
  'young-buck': (s) => (s.antlers ? derive(s, { antlers: { len: s.antlers.len * 0.45, tines: 1 }, H: s.H * 0.92 }) : derive(s, { H: s.H * 0.9, horns: s.horns ? { len: s.horns.len * 0.5 } : undefined })),
  velvet: (s) => (s.antlers ? derive(s, { antlers: { r: s.antlers.r * 1.35, color: '#6a4a32', tip: '#7a5a3e', len: s.antlers.len * 0.85 } }) : derive(s, { fur: (s.fur ?? 0) + 0.02 })),
  tusker: (s) => derive(s, { tusks: { len: (s.tusks?.len ?? 0.4) * 1.6, r: (s.tusks?.r ?? 0.03) * 1.3 } }),
  tuskless: (s) => derive(s, { tusks: null }),
  spotted: (s) => {
    const light = lum(s.coat.base) > 0.45;
    return derive(s, { fur: 0, coat: { pattern: { type: 'patches', color: light ? '#2a1e16' : '#f4f0e8', amount: 0.5, scale: 1.7 }, pattern2: null } });
  },
  dark: (s) => derive(s, { tuck: (s.tuck ?? 0.1) + 0.05, eyes: { color: '#d8b030' }, coat: { base: '#1e1b18', back: '#141210', belly: '#2a2622', points: null, muzzle: null, chest: null, saddle: null, socks: null, face: null, tailTip: null, band: null, pattern: s.coat.pattern ? { ...s.coat.pattern, color: '#050505' } : null, pattern2: null } }),
  pale: (s) => derive(s, { fur: (s.fur ?? 0) + 0.015, eyes: { color: '#5a9ad8' }, coat: { base: '#f4f1ea', back: '#e9e5dc', belly: '#f8f6f2', points: null, saddle: null, chest: null, band: null, pattern: s.coat.pattern ? { ...s.coat.pattern, color: '#b8aea0' } : null, pattern2: null, nose: '#c89088' } }),
  muddy: (s) => derive(s, { creases: (s.creases ?? 0) + 0.3, coat: { base: '#6a4a30', back: '#5a3e26', belly: '#7a5a3e', mottle: 0.3 } }),
  shorn: (s) => derive(s, { wool: 0, fur: 0, bw: s.bw * 0.82, tuck: (s.tuck ?? 0) + 0.12, coat: { base: '#e8dccb', back: '#ded0bc', belly: '#efe6da', mottle: 0.05 } }),
  bull: (s) => derive(s, { muscle: (s.muscle ?? 0.5) + 0.8, bw: s.bw * 1.12, udder: null, neck: { r0: s.neck.r0 * 1.3, r1: s.neck.r1 * 1.15 }, humps: [...(s.humps ?? []), { at: 0.9, h: 0.15, w: 0.06 }], horns: { type: 'bull', len: Math.max(0.65, (s.horns?.len ?? 0.3) * 1.5), r: 0.11, a: 0.6 } }),
  show: (s) => derive(s, { mane: { type: 'braided', color: '#3a3836' }, tail: { r: (s.tail?.r ?? 0.03) * 0.75, color: '#3a3836' }, coat: { base: '#b8b6b0', back: '#a8a6a0', belly: '#c8c6c0', points: '#4a4846', pointsH: 0.2, pattern: { type: 'dapple', color: '#6a6866', scale: 1.2 }, socks: '#f4f2ee', socksH: 0.26, face: { blaze: '#f4f2ee', blazeStart: 0.1 } } }),
  fluffed: null,
  nesting: null,
};

function mixHex(a, b, t) {
  const pa = parseInt(String(a).replace('#', ''), 16);
  const pb = parseInt(String(b).replace('#', ''), 16);
  const ch = (sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
}

function lum(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return (((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255;
}

const COMBO = { bull: ['nose-ring'], show: ['bridle', 'saddle'], harness: ['harness', 'bandana'] };

export function applyTrim(spec, trim, kind = 'quad') {
  if (!trim) return { spec, accessories: [] };
  const t = ALIAS[trim] ?? trim;
  if (ACCESSORY.has(t)) return { spec, accessories: COMBO[t] ?? [t] };
  const fn = Q[t];
  if (!fn) return { spec, accessories: [] };
  void kind;
  return { spec: fn(spec), accessories: COMBO[t] ?? [] };
}
