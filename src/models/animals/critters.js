import * as THREE from 'three';
import { Rig, applySkin, chain, skinnedMesh, poseTrack, offsetTrack, loft, surfacePoint, spline, keyed, paint, noise3, fbm, smooth01, lerp, bump, TAU, C } from './core.js';
import { buildEye, hornMaterial } from './parts.js';
import { derive } from './species.js';
import { rng } from '../../core/utils.js';
import { clip } from '../../core/animation.js';

/*
 * Reptiles, amphibians, insects and other invertebrates.
 *  snake      skinned loft along a ground S-curve (or rearing / coiled), scale patterns
 *  sprawler   lizards, crocodilians, salamanders: low body + tail loft, sprawling 4 legs
 *  turtle     domed scute shell + plastron, head/neck, legs or flippers
 *  frog       crouched body, folded hind legs, eyes on top
 *  insect     head/thorax/abdomen, 6 jointed legs, antennae, painted or clear wings
 *  arachnid   spiders & scorpions (8 legs, pedipalps, stinger tail)
 *  crustacean crabs & lobsters (carapace, claws, legs)
 *  cephalopod octopus & squid (mantle + tentacles), jellyfish, starfish, snail
 * Facing +Z, metres.
 */

const SNAKE = { body: 'snake', L: 1.4, r: 0.022, head: { len: 0.035, w: 0.017 }, coat: { back: '#5a6a3a', belly: '#d8d0a8' }, pattern: null };
const LIZARD = { body: 'sprawler', L: 0.3, r: 0.022, tail: 0.55, head: { len: 0.06, w: 0.022, h: 0.016, snout: 0.5 }, leg: { len: 0.04, r: 0.005 }, coat: { back: '#5a7a3a', belly: '#c8d0a0' } };
const TURTLE = { body: 'turtle', L: 0.3, shell: { h: 0.4, len: 0.8 }, legs: 'feet', coat: { back: '#4a5a2a', shell: '#5a5a3a', scute: '#2a2a1a', skin: '#6a6a4a', belly: '#d8c890' } };
const FROG = { body: 'frog', L: 0.08, coat: { back: '#4a8a3a', belly: '#e8e2c0', spots: null } };
const INSECT = { body: 'insect', L: 0.02, coat: { body: '#2a2420' } };

export const CRITTER_TYPES = {
  reptile: {
    label: 'Reptile', sub: 'reptiles', base: SNAKE, trims: ['juvenile', 'dark', 'pale'],
    variants: {
      python: { L: 3.5, r: 0.06, head: { len: 0.1, w: 0.05 }, coat: { back: '#8a6a3a', belly: '#e8dcb8' }, pattern: { type: 'blotch', color: '#3a2a18', edge: '#2a1e10' } },
      cobra: { L: 1.8, r: 0.03, hood: true, coat: { back: '#3a2a1e', belly: '#c8b48a' }, pattern: { type: 'bands', color: '#c8b48a', n: 30, w: 0.15 } },
      rattlesnake: { L: 1.3, r: 0.035, rattle: true, head: { len: 0.06, w: 0.04 }, coat: { back: '#a89270', belly: '#e8dcc0' }, pattern: { type: 'diamond', color: '#4a3a28', edge: '#e8dcc0' } },
      viper: { L: 0.7, r: 0.022, head: { len: 0.04, w: 0.03 }, coat: { back: '#8a8a7a', belly: '#c8c8b8' }, pattern: { type: 'zigzag', color: '#1a1a18' } },
      'coral-snake': { L: 0.8, r: 0.012, coat: { back: '#c82a1e', belly: '#c82a1e' }, pattern: { type: 'coral', n: 22 } },
      anaconda: { L: 5, r: 0.1, head: { len: 0.13, w: 0.07 }, coat: { back: '#4a5a2a', belly: '#c8c890' }, pattern: { type: 'spots', color: '#1a1a10' } },
      'green-mamba': { L: 2.2, r: 0.02, coat: { back: '#4ab83a', belly: '#c8e86a' } },
      iguana: derive(LIZARD, { L: 1.5, r: 0.085, tail: 0.6, spines: 0.4, dewlap: true, head: { len: 0.13, w: 0.06, h: 0.05 }, leg: { len: 0.14, r: 0.02 }, coat: { back: '#5a9a4a', belly: '#a8c88a', bands: '#3a5a2a' } }),
      gecko: derive(LIZARD, { L: 0.2, r: 0.016, tail: 0.5, toePads: true, head: { len: 0.035, w: 0.02, h: 0.012 }, eyeBig: true, coat: { back: '#e8c86a', belly: '#f2eac8', spots: '#3a2a1a' } }),
      chameleon: derive(LIZARD, { L: 0.45, r: 0.035, tail: 0.5, curlTail: true, casque: true, high: true, head: { len: 0.06, w: 0.025, h: 0.035 }, leg: { len: 0.07, r: 0.006 }, coat: { back: '#4ab84a', belly: '#c8e88a', bands: '#e8c84a' } }),
      komodo: derive(LIZARD, { L: 2.6, r: 0.13, tail: 0.5, head: { len: 0.25, w: 0.08, h: 0.06, snout: 0.7 }, leg: { len: 0.2, r: 0.04 }, coat: { back: '#6a6050', belly: '#8a8070' } }),
      'bearded-dragon': derive(LIZARD, { L: 0.5, r: 0.045, tail: 0.5, beardSpikes: true, head: { len: 0.06, w: 0.04, h: 0.025 }, leg: { len: 0.05, r: 0.008 }, coat: { back: '#c8a060', belly: '#e8d8b0' } }),
      crocodile: derive(LIZARD, { L: 4.5, r: 0.18, tail: 0.5, scutes: true, teeth: true, head: { len: 0.55, w: 0.13, h: 0.09, snout: 0.85 }, leg: { len: 0.28, r: 0.05 }, coat: { back: '#5a5a3a', belly: '#c8c49a' } }),
      alligator: derive(LIZARD, { L: 3.8, r: 0.17, tail: 0.5, scutes: true, teeth: true, head: { len: 0.45, w: 0.15, h: 0.09, snout: 0.75, wide: true }, leg: { len: 0.25, r: 0.05 }, coat: { back: '#2a2e22', belly: '#c8c4a8' } }),
      'sea-turtle': derive(TURTLE, { L: 1.0, flippers: true, swims: true, coat: { shell: '#6a5a3a', scute: '#3a2e1e', skin: '#8a7a5a', belly: '#e8dcb0' } }),
      tortoise: derive(TURTLE, { L: 0.6, shell: { h: 0.7, len: 0.85 }, legs: 'columns', coat: { shell: '#6a5434', scute: '#2a2010', skin: '#7a6a5a', belly: '#c8b07a' } }),
      'box-turtle': derive(TURTLE, { L: 0.15, shell: { h: 0.6 }, coat: { shell: '#4a3a24', scute: '#e8b84a', skin: '#5a4a34' } }),
      'snapping-turtle': derive(TURTLE, { L: 0.45, shell: { h: 0.35, ridges: true }, bigHead: true, coat: { shell: '#3a3a2a', scute: '#2a2a1a', skin: '#4a4a3a' } }),
    },
  },
  amphibian: {
    label: 'Amphibian', sub: 'reptiles', base: FROG, trims: ['juvenile', 'dark', 'pale'],
    variants: {
      frog: {},
      toad: { L: 0.11, warts: true, coat: { back: '#7a6a4a', belly: '#d8ccb0', spots: '#4a3a24' } },
      'tree-frog': { L: 0.05, toePads: true, eyeColor: '#d82a1e', coat: { back: '#3ac83a', belly: '#f2f0e0', side: '#2a5ad8' } },
      'poison-dart-frog': { L: 0.03, toePads: true, coat: { back: '#1a6ad8', belly: '#1a4ab8', spots: '#141414' } },
      bullfrog: { L: 0.16, coat: { back: '#5a6a3a', belly: '#e8e2c0', spots: '#3a4424' } },
      salamander: derive(LIZARD, { L: 0.2, r: 0.014, tail: 0.5, smooth: true, head: { len: 0.03, w: 0.016, h: 0.009, snout: 0.2 }, leg: { len: 0.02, r: 0.003 }, coat: { back: '#141414', belly: '#2a2a2a', spots: '#f2c81e' } }),
      newt: derive(LIZARD, { L: 0.12, r: 0.009, tail: 0.55, smooth: true, crest: true, head: { len: 0.018, w: 0.01, h: 0.006, snout: 0.3 }, leg: { len: 0.014, r: 0.002 }, coat: { back: '#5a4a2a', belly: '#e8701e' } }),
      axolotl: derive(LIZARD, { L: 0.22, r: 0.02, tail: 0.5, smooth: true, gills: true, crest: true, head: { len: 0.04, w: 0.03, h: 0.016, snout: 0.1 }, leg: { len: 0.02, r: 0.004 }, coat: { back: '#f2c0c0', belly: '#f6d0d0' } }),
    },
  },
  insect: {
    label: 'Insect', sub: 'insects', base: INSECT, trims: ['dark', 'pale', 'metallic'],
    variants: {
      monarch: { kind: 'butterfly', L: 0.03, span: 0.1, wing: { color: '#e8781e', vein: '#141414', edge: '#141414', dots: '#f6f6f4' } },
      swallowtail: { kind: 'butterfly', L: 0.035, span: 0.1, tails: true, wing: { color: '#f2d84a', vein: '#141414', edge: '#141414', dots: '#3a6ad8' } },
      'blue-morpho': { kind: 'butterfly', L: 0.04, span: 0.14, wing: { color: '#1a7ae8', vein: '#1a3a98', edge: '#141414', dots: '#f6f6f4' } },
      'cabbage-white': { kind: 'butterfly', L: 0.02, span: 0.055, wing: { color: '#f6f4ec', vein: '#d8d4c8', edge: '#5a5a5a', dots: '#2a2a2a' } },
      'luna-moth': { kind: 'butterfly', L: 0.04, span: 0.11, tails: true, moth: true, wing: { color: '#b8e8a8', vein: '#8ab87a', edge: '#c8a8a0', dots: '#e8c84a' } },
      honeybee: { kind: 'bee', L: 0.014, coat: { body: '#c8901e', stripes: '#2a1e10' } },
      bumblebee: { kind: 'bee', L: 0.022, fuzzy: true, coat: { body: '#e8c01e', stripes: '#141414' } },
      wasp: { kind: 'wasp', L: 0.02, coat: { body: '#f2d01e', stripes: '#141414' } },
      ant: { kind: 'ant', L: 0.008, coat: { body: '#2a1a12' } },
      'red-ant': { kind: 'ant', L: 0.006, coat: { body: '#a82a1e' } },
      ladybug: { kind: 'beetle', L: 0.008, round: true, coat: { body: '#141414', shell: '#d81e1e', spots: '#141414' } },
      'stag-beetle': { kind: 'beetle', L: 0.06, mandibles: true, coat: { body: '#2a1a12', shell: '#4a2a18' } },
      'rhino-beetle': { kind: 'beetle', L: 0.06, horn: true, coat: { body: '#1a1210', shell: '#3a2418' } },
      dragonfly: { kind: 'dragonfly', L: 0.08, coat: { body: '#1a8ab8', stripes: '#141414' } },
      grasshopper: { kind: 'grasshopper', L: 0.05, coat: { body: '#6aa83a', stripes: '#4a7a2a' } },
      mantis: { kind: 'mantis', L: 0.08, coat: { body: '#7ac84a', stripes: '#5aa83a' } },
    },
  },
  invertebrate: {
    label: 'Spider, Crab & Sea Creature', sub: 'insects', base: { body: 'arachnid', L: 0.05, coat: { body: '#2a2420' } }, trims: ['dark', 'pale', 'raised'],
    variants: {
      tarantula: { body: 'arachnid', L: 0.08, fuzzy: true, coat: { body: '#2a2018', bands: '#c8803a' } },
      'garden-spider': { body: 'arachnid', L: 0.02, coat: { body: '#a87a3a', bands: '#3a2a1a', cross: '#f2eee0' } },
      'black-widow': { body: 'arachnid', L: 0.015, round: true, coat: { body: '#141414', mark: '#d81e1e' } },
      scorpion: { body: 'arachnid', scorpion: true, L: 0.08, coat: { body: '#c8a060', bands: '#8a6a3a' } },
      crab: { body: 'crustacean', L: 0.15, coat: { body: '#d8502a', belly: '#f2d8b8' } },
      'hermit-crab': { body: 'crustacean', L: 0.06, shell: true, coat: { body: '#d87a4a', belly: '#f2d8b8', shell: '#c8b090' } },
      lobster: { body: 'crustacean', lobster: true, L: 0.45, coat: { body: '#c8301e', belly: '#e8a080' } },
      shrimp: { body: 'crustacean', lobster: true, shrimp: true, L: 0.1, coat: { body: '#f28a6a', belly: '#f6c0a8' } },
      octopus: { body: 'cephalopod', L: 0.6, coat: { body: '#c85a3a', belly: '#e8a890' } },
      squid: { body: 'cephalopod', squid: true, L: 0.5, coat: { body: '#e8b8b0', belly: '#f2d8d0' } },
      jellyfish: { body: 'jelly', L: 0.3, coat: { body: '#e8a8d8' } },
      starfish: { body: 'starfish', L: 0.2, coat: { body: '#e8701e', bumps: '#f2c08a' } },
      snail: { body: 'snail', L: 0.06, coat: { body: '#a89070', shell: '#8a5a2a', bands: '#4a2a14' } },
      'sea-urchin': { body: 'urchin', L: 0.08, coat: { body: '#3a1a3a' } },
    },
  },
};

/* ------------------------------------------------------------------ */

const mat = (props) => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.4, ...props });
const plain = (color, props = {}) => new THREE.MeshPhysicalMaterial({ color: C(color), roughness: 0.5, clearcoat: 0.3, ...props });

/** Ellipsoid-ish loft between two points. */
function blob(a, b, rx, ry, { n = 24, ring = 18, shape = (t) => Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.6, disp } = {}) {
  const c = spline([a, a.clone().lerp(b, 0.5), b]);
  return loft(c, (t) => ({ w: rx * shape(t) + 1e-4, up: ry * shape(t) + 1e-4, dn: ry * shape(t) + 1e-4, e: 2 }), { n, ring, lateral: Math.abs(a.x - b.x) < 1e-6 ? 'x' : 'free', displace: disp });
}

function limb(points, r0, r1, ring = 8) {
  const c = spline(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))));
  return loft(c, (t) => ({ w: lerp(r0, r1, t), up: lerp(r0, r1, t), dn: lerp(r0, r1, t), e: 2 }), { n: Math.max(6, points.length * 4), ring, lateral: 'free' });
}

function colorAll(g, c) {
  const cc = C(c);
  const a = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < a.length; i += 3) a.set([cc.r, cc.g, cc.b], i);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}

export function buildCritter(name, S0, opts = {}) {
  let S = S0;
  const trim = opts.trim;
  if (trim === 'baby') S = derive(S, { L: S.L * 0.35, r: (S.r ?? 0) * 0.4, head: S.head ? { len: S.head.len * 0.42, w: S.head.w * 0.42, h: (S.head.h ?? S.head.w) * 0.42 } : undefined, leg: S.leg ? { len: S.leg.len * 0.38, r: S.leg.r * 0.4 } : undefined });
  if (trim === 'large' || trim === 'giant') S = derive(S, { L: S.L * (trim === 'giant' ? 3 : 1.6), r: (S.r ?? 0) * 1.6, head: S.head ? { len: S.head.len * 1.6, w: S.head.w * 1.6, h: (S.head.h ?? S.head.w) * 1.6 } : undefined, leg: S.leg ? { len: S.leg.len * 1.6, r: S.leg.r * 1.6 } : undefined });
  if (trim === 'coiled') S = derive(S, { coiled: true });
  const recolor = (fn) => {
    const c2 = {};
    for (const [k, v] of Object.entries(S.coat)) if (typeof v === 'string') c2[k] = fn(v);
    const wing = S.wing ? Object.fromEntries(Object.entries(S.wing).map(([k, v]) => [k, typeof v === 'string' ? fn(v) : v])) : undefined;
    S = derive(S, { coat: c2, ...(wing ? { wing } : {}), pattern: S.pattern ? { ...S.pattern, color: S.pattern.color ? fn(S.pattern.color) : undefined } : undefined });
  };
  if (trim === 'dark') recolor((v) => '#' + C(v).multiplyScalar(0.28).getHexString());
  if (trim === 'pale') recolor((v) => '#' + C(v).lerp(new THREE.Color('#f4f0e6'), 0.62).getHexString());
  if (trim === 'metallic') {
    recolor((v) => '#' + C(v).lerp(new THREE.Color('#2a8a6a'), 0.5).getHexString());
    S = derive(S, { metallic: true });
  }
  if (trim === 'juvenile') {
    S = derive(S, { coiled: S.body === 'snake', head: S.head ? { len: S.head.len * 1.3, w: S.head.w * 1.25, h: (S.head.h ?? S.head.w) * 1.25 } : undefined, r: S.r ? S.r * 1.15 : undefined, L: S.L * 0.6, warts: false, eyeBig: true });
    recolor((v) => '#' + C(v).lerp(new THREE.Color('#9ad84a'), S.body === 'frog' ? 0.0 : 0.25).getHexString());
  }
  if (trim === 'warty') S = derive(S, { warts: true });
  if (trim === 'wings-open') S = derive(S, { open: true });
  if (trim === 'wings-closed') S = derive(S, { closed: true });
  if (trim === 'raised') S = derive(S, { raised: true });
  const seed = opts.seed ?? name;
  const ctx = { nz: noise3(rng(`${seed}-n`)), rand: rng(seed), color: S.color };
  const kind = S.kind ? 'insect' : S.body;
  const b = {
    snake: buildSnake,
    sprawler: buildSprawler,
    turtle: buildTurtle,
    frog: buildFrog,
    insect: buildInsect,
    arachnid: buildArachnid,
    crustacean: buildCrustacean,
    cephalopod: buildCephalopod,
    jelly: buildJelly,
    starfish: buildStarfish,
    snail: buildSnail,
    urchin: buildUrchin,
  }[kind];
  const root = b(name, S, ctx);
  root.name = `animal-${name}`;
  return root;
}

/* ---------------- shared rig helpers ---------------- */

function chainRig(curve, n, prefix, parent = null, rig = new Rig(), from = 1, to = 0) {
  const names = [];
  for (let k = 0; k < n; k++) {
    const t = lerp(from, to, k / n);
    const nm = `${prefix}${k}`;
    rig.add(nm, curve.getPointAt(Math.min(1, Math.max(0, t))).toArray(), k ? names[k - 1] : parent);
    names.push(nm);
  }
  return { rig, names };
}

function waveClip(name, rig, names, period, amp, axis = 1, extra = {}) {
  const tracks = names.map((n, k) => poseTrack(rig.get(n), period, (t) => {
    const v = amp * Math.sin(TAU * t - k * 0.8);
    return axis === 1 ? [0, v, 0] : axis === 0 ? [v, 0, 0] : [0, 0, v];
  }, 32));
  for (const [n, fn] of Object.entries(extra)) if (rig.has(n)) tracks.push(poseTrack(rig.get(n), period, fn, 32));
  return clip(name, period, tracks);
}

/* ---------------- snake ---------------- */
function buildSnake(name, S, { nz }) {
  const L = S.L;
  const r = S.r;
  const root = new THREE.Group();
  const pts = [];
  const N = 14;
  if (S.coiled) {
    for (let k = 0; k <= 40; k++) {
      const t = k / 40;
      const a = t * Math.PI * 2 * 2.2;
      const rad = L * 0.13 * (1 - t * 0.55) + r;
      pts.push(new THREE.Vector3(Math.cos(a) * rad, r + t * r * 3.2 + (t > 0.85 ? (t - 0.85) * L * 0.6 : 0), Math.sin(a) * rad));
    }
  } else {
    const rear = S.hood ? 0.25 : 0;
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const z = (t - 0.5) * L * 0.8;
      const x = Math.sin(t * Math.PI * 2.2) * L * 0.08 * (1 - t * 0.4);
      const y = r + (S.hood ? smooth01((t - 0.72) / 0.2) * L * rear : 0);
      pts.push(new THREE.Vector3(x, y, S.hood ? z - smooth01((t - 0.72) / 0.2) * L * 0.12 : z));
    }
  }
  let curve = spline(pts);
  const hl = S.head.len;
  const hw = S.head.w;
  const tHead = 1 - hl / (L * 0.9);
  const sec = (t) => {
    let w = r * Math.min(1, (t / 0.25) ** 0.7);
    let up = w * 0.85;
    let dn = w * 0.75;
    if (S.hood) {
      const k = bump(t, tHead - 0.06, 0.035);
      w *= 1 + 2.6 * k;
      up *= 1 - 0.5 * k;
      dn *= 1 - 0.5 * k;
    }
    if (t > tHead - 0.03) {
      const u = (t - tHead + 0.03) / (1 - tHead + 0.03);
      const neck = 1 - 0.25 * bump(u, 0.05, 0.08);
      w = lerp(w, hw * 0.5, smooth01(u / 0.25)) * neck * (1 - 0.55 * smooth01((u - 0.7) / 0.3));
      up = lerp(up, hw * 0.3, smooth01(u / 0.25)) * neck * (1 - 0.45 * smooth01((u - 0.75) / 0.25));
      dn = lerp(dn, hw * 0.24, smooth01(u / 0.25)) * neck * (1 - 0.5 * smooth01((u - 0.75) / 0.25));
    }
    return { w: w + 1e-4, up: up + 1e-4, dn: dn + 1e-4, e: 2.1 };
  };
  const g = loft(curve, sec, { n: 160, ring: 16, lateral: S.coiled ? 'free' : 'auto' });
  // ground: drop the body itself (geometry + spine curve, before rigging) so its belly rests on y=0
  g.computeBoundingBox();
  const drop = g.boundingBox.min.y;
  if (Math.abs(drop) > 1e-5) {
    g.translate(0, -drop, 0);
    for (const p of pts) p.y -= drop;
    curve = spline(pts);
  }
  // ground: drop so the lowest point touches y=0
  const { rig, names } = chainRig(curve, 10, 'seg');
  const lt = g.attributes.lt.array;
  applySkin(g, (i) => chain(1 - lt[i], names.map((n) => rig.index(n)), names.map((_, k) => k / 10), 0.04));
  const cc = S.coat;
  const back = C(ctx2color(S, cc.back));
  const belly = C(cc.belly);
  const sy = g.attributes.sy.array;
  const pat = S.pattern;
  paint(g, (i, p, n) => {
    const t = lt[i];
    const y = sy[i];
    let c = belly.clone().lerp(back, smooth01((y + 0.35) / 0.3));
    const s = t * L * 18;
    if (pat) {
      const side = smooth01((y + 0.2) / 0.3);
      let v = 0;
      if (pat.type === 'diamond') {
        const ph = (s % 1 + 1) % 1;
        v = smooth01((0.38 - Math.abs(ph - 0.5) - Math.abs(Math.asin(Math.max(-1, Math.min(1, (g.attributes.sx.array[i])))) / Math.PI) * 0.8) / 0.05);
      } else if (pat.type === 'blotch' || pat.type === 'spots') v = smooth01((fbm(ctx3(nz), p.x * 25 / r, p.y * 25 / r, p.z * 25 / r, 2) * 0 + nz(p.x * 0.6 / r, p.y * 0.6 / r, p.z * 0.6 / r) - (pat.type === 'spots' ? 0.66 : 0.55)) / 0.04);
      else if (pat.type === 'bands') v = smooth01((Math.sin(t * Math.PI * 2 * pat.n) - (1 - (pat.w ?? 0.2) * 4)) / 0.1);
      else if (pat.type === 'zigzag') v = smooth01((0.12 - Math.abs(g.attributes.sx.array[i] - 0.5 * Math.sin(s * Math.PI * 2))) / 0.05) * smooth01((y) / 0.3);
      else if (pat.type === 'coral') {
        const ph = ((t * pat.n) % 1 + 1) % 1;
        c = ph < 0.4 ? C('#c82a1e') : ph < 0.5 || ph > 0.9 ? C('#f2d01e') : C('#141414');
      }
      if (pat.color && pat.type !== 'coral') c.lerp(C(pat.color), v * side);
    }
    // belly scutes + scale texture
    c.multiplyScalar(1 - 0.18 * smooth01((-y - 0.5) / 0.2) * (Math.abs(Math.sin(s * Math.PI * 4)) < 0.15 ? 1 : 0));
    c.multiplyScalar(0.92 + 0.12 * Math.abs(Math.sin(s * 60) * Math.sin((g.attributes.la.array[i]) * 14)));
    return c;
  });
  root.add(rig.get(names[0]));
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(rig.bones);
  root.add(skinnedMesh(g, mat({ name: 'primary', roughness: 0.35, clearcoat: 0.7 }), skel, 'body_mesh'));
  // eyes, tongue, rattle
  const head = rig.get(names[0]);
  const hw0 = rig.world[names[0]];
  for (const s2 of [1, -1]) {
    const sp = surfacePoint(curve, sec, 1 - (1 - tHead) * 0.35, s2 * 1.1, S.coiled ? 'free' : 'auto');
    const e = buildEye(sp.p.clone().addScaledVector(sp.n, -hw * 0.08), sp.n, hw * 0.16, { color: '#c8a02a', pupil: S.hood ? 'round' : 'slit', lid: '#2a2a1e', lidSquint: 1 });
    e.position.sub(hw0);
    head.add(e);
  }
  const tipP = curve.getPointAt(1);
  const tdir = curve.getTangentAt(1);
  const tongue = new THREE.Group();
  for (const s2 of [1, -1]) {
    const tg = limb([tipP.clone().addScaledVector(tdir, -hw * 0.2), tipP.clone().addScaledVector(tdir, hw * 0.4), tipP.clone().addScaledVector(tdir, hw * 0.7).add(new THREE.Vector3(s2 * hw * 0.12, 0, 0))], hw * 0.03, hw * 0.012, 5);
    tongue.add(new THREE.Mesh(tg, plain('#c81e3a', { vertexColors: false })));
  }
  tongue.position.sub(hw0);
  head.add(tongue);
  if (S.rattle) {
    const tail = rig.get(names[names.length - 1]);
    const tw = rig.world[names[names.length - 1]];
    const t0 = curve.getPointAt(0);
    const td = curve.getTangentAt(0).negate();
    for (let k = 0; k < 6; k++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55 * (1 - k * 0.06), 12, 8), plain('#c8b490'));
      m.scale.set(1, 0.75, 0.6);
      m.position.copy(t0).addScaledVector(td, r * 0.35 * k - r * 0.1).sub(tw);
      tail.add(m);
    }
  }
  // lowest point on the ground
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  rig.get(names[0]).position.y -= box.min.y;
  root.traverse((o) => {
    if (o.isSkinnedMesh) o.boundingBox = o.boundingSphere = null;
  });
  root.userData.clips = [waveClip('slither', rig, names.slice(1), 1.4, 0.18, 1), waveClip('idle', rig, names.slice(0, 3), 3, 0.06, 1)];
  return root;
}
function ctx2color(S, c) {
  return S.color ?? c;
}
function ctx3(nz) {
  return nz;
}

/* ---------------- sprawler (lizards, crocodiles, salamanders) ---------------- */
function buildSprawler(name, S, { nz }) {
  const root = new THREE.Group();
  const L = S.L;
  const r = S.r;
  const tailL = L * S.tail;
  const bodyL = L - tailL - S.head.len;
  const lift = S.high ? S.leg.len * 0.9 : S.leg.len * 0.55;
  const y0 = r * 0.85 + lift * 0.45;
  const zTail = -L * 0.5;
  const pts = [];
  for (let k = 0; k <= 12; k++) {
    const t = k / 12;
    const z = zTail + t * L;
    let x = 0;
    let y = y0;
    if (t < S.tail) {
      const u = t / S.tail;
      y = lerp(r * 0.35, y0, smooth01(u * 1.3));
      x = Math.sin(u * Math.PI * 1.2) * L * 0.04 * (1 - u);
      if (S.curlTail && u < 0.5) {
        // chameleon curl handled by spiral below
      }
    }
    pts.push(new THREE.Vector3(x, y, z));
  }
  if (S.curlTail) {
    const spiral = [];
    for (let k = 0; k <= 16; k++) {
      const a = (k / 16) * Math.PI * 2.2;
      const rad = tailL * 0.18 * (1 - k / 22);
      spiral.push(new THREE.Vector3(0, y0 - tailL * 0.2 + Math.cos(a) * rad - rad, zTail + tailL * 0.5 - Math.sin(a) * rad));
    }
    pts.splice(0, Math.round(12 * S.tail * 0.6), ...spiral.reverse());
  }
  const curve = spline(pts);
  const tT = S.tail;
  const tH = 1 - S.head.len / L;
  const hw = S.head.w;
  const hh = S.head.h ?? hw * 0.7;
  const sec = (t) => {
    let w;
    let up;
    let dn;
    if (t < tT) {
      const u = t / tT;
      w = r * lerp(0.08, 0.85, u ** 0.8);
      up = w * (S.scutes ? 0.9 : 0.85);
      dn = w * 0.8;
      if (S.crest && u > 0.1) up *= 1.3;
    } else if (t < tH) {
      const u = (t - tT) / (tH - tT);
      w = r * (0.85 + 0.25 * Math.sin(Math.PI * u)) * (S.smooth ? 0.9 : 1);
      up = r * (0.7 + 0.15 * Math.sin(Math.PI * u));
      dn = r * (0.65 + 0.15 * Math.sin(Math.PI * u));
      w *= 1 - 0.2 * bump(u, 1, 0.12);
    } else {
      const u = (t - tH) / (1 - tH);
      const sn = S.head.snout ?? 0.5;
      const k = u < 0.35 ? 1 : 1 - (1 - (S.head.wide ? 0.75 : 0.45)) * smooth01((u - 0.35) / 0.65) * sn;
      w = lerp(r * 0.75, hw, smooth01(u / 0.25)) * k * (u > 0.94 ? 1 - (u - 0.94) * 8 : 1);
      up = lerp(r * 0.6, hh * 0.6, smooth01(u / 0.25)) * (1 - 0.5 * smooth01((u - 0.3) / 0.7) * sn) * (u > 0.94 ? 1 - (u - 0.94) * 8 : 1);
      dn = lerp(r * 0.55, hh * 0.45, smooth01(u / 0.25)) * (1 - 0.45 * smooth01((u - 0.3) / 0.7) * sn) * (u > 0.94 ? 1 - (u - 0.94) * 8 : 1);
    }
    return { w: w + 1e-4, up: up + 1e-4, dn: dn + 1e-4, e: S.scutes ? 2.4 : 2.1 };
  };
  const g = loft(curve, sec, {
    n: 120,
    ring: 22,
    lateral: S.curlTail ? 'x' : 'auto',
    displace: (t, a, p) => {
      let d = 0;
      const top = Math.cos(a);
      if (S.scutes) d += r * 0.06 * Math.max(0, Math.sin(t * L * 40)) * (Math.abs(Math.sin(a * 3)) > 0.7 ? 1 : 0) * smooth01((top - 0.2) / 0.3) * (t < tH ? 1 : 0.2);
      if (S.spines) d += r * S.spines * Math.max(0, Math.sin(t * L * 70)) ** 4 * smooth01((top - 0.95) / 0.04) * (t > 0.1 && t < tH + 0.05 ? 1 : 0);
      if (S.warts) d += r * 0.08 * Math.max(0, nz(p.x * 6 / r, p.y * 6 / r, p.z * 6 / r) - 0.6) * 4;
      if (S.crest) d += r * 0.4 * smooth01((top - 0.96) / 0.03) * (t < tH ? 1 : 0);
      if (S.casque && t > tH) d += hh * 0.6 * smooth01((top - 0.9) / 0.08) * bump((t - tH) / (1 - tH), 0.2, 0.15);
      return d;
    },
  });
  const { rig, names } = chainRig(curve, 8, 'spine');
  const lt = g.attributes.lt.array;
  applySkin(g, (i) => chain(1 - lt[i], names.map((n) => rig.index(n)), names.map((_, k) => k / 8), 0.04));
  // legs: shoulder out sideways, elbow up, foot on the ground
  const legGeos = [];
  const legNames = [];
  const LR = S.leg.r;
  const LL = S.leg.len;
  for (const [ti, front] of [[lerp(tT, tH, 0.85), true], [lerp(tT, tH, 0.08), false]]) {
    for (const s2 of [1, -1]) {
      const sh = surfacePoint(curve, sec, ti, s2 * Math.PI * 0.55, S.curlTail ? 'x' : 'auto').p;
      const bn = names[Math.min(7, Math.round((1 - ti) * 8))];
      const elbow = sh.clone().add(new THREE.Vector3(s2 * LL * 0.6, S.high ? -LL * 0.1 : LL * 0.12, front ? LL * 0.15 : -LL * 0.1));
      const foot = new THREE.Vector3(sh.x + s2 * LL * (S.high ? 0.6 : 0.9), LR * 0.8, sh.z + (front ? LL * 0.35 : -LL * 0.15));
      const ln = `leg${front ? 'F' : 'B'}${s2 > 0 ? 'L' : 'R'}`;
      rig.add(`${ln}0`, sh.toArray(), bn);
      rig.add(`${ln}1`, elbow.toArray(), `${ln}0`);
      rig.add(`${ln}2`, foot.toArray(), `${ln}1`);
      legNames.push(ln);
      const lg = limb([sh.clone().add(new THREE.Vector3(-s2 * LR * 2, 0, 0)), sh, elbow, foot], LR * (front ? 1.6 : 2), LR * 0.8, 10);
      const ltl = lg.attributes.lt.array;
      applySkin(lg, (i) => chain(ltl[i], [rig.index(bn), rig.index(`${ln}0`), rig.index(`${ln}1`), rig.index(`${ln}2`)], [0, 0.2, 0.55, 0.95], 0.06));
      legGeos.push(lg);
      // toes
      for (let k = 0; k < 5; k++) {
        const a = (k - 2) * 0.35 + (front ? 0 : 0.2) * s2;
        const d = new THREE.Vector3(Math.sin(a) * s2 * 0.6 + s2 * 0.3, 0, Math.cos(a)).normalize();
        const tl = LL * 0.28 * (k === 0 || k === 4 ? 0.7 : 1);
        const tg = limb([foot, foot.clone().addScaledVector(d, tl * 0.6).setY(LR * 0.4), foot.clone().addScaledVector(d, tl).setY(LR * 0.3)], LR * 0.42, LR * 0.2, 6);
        applySkin(tg, () => [[rig.index(`${ln}2`), 1]]);
        legGeos.push(tg);
        if (S.toePads) {
          const pad = new THREE.SphereGeometry(LR * 0.5, 8, 6);
          pad.scale(1, 0.5, 1);
          pad.translate(foot.x + d.x * tl, LR * 0.25, foot.z + d.z * tl);
          applySkin(pad, () => [[rig.index(`${ln}2`), 1]]);
          legGeos.push(pad);
        }
      }
    }
  }
  const cc = S.coat;
  const back = C(S.color ?? cc.back);
  const belly = C(cc.belly);
  const paintFn = (i, p, n, A) => {
    const y = A.sy ? A.sy.array[i] : n.y;
    const t = A.lt ? A.lt.array[i] : 0.5;
    let c = belly.clone().lerp(back, smooth01((y + 0.25) / 0.35));
    if (cc.bands) c.lerp(C(cc.bands), smooth01((Math.sin(t * L * 25 / L * 12) - 0.6) / 0.15) * smooth01((y + 0.1) / 0.3) * 0.8);
    if (cc.spots) c.lerp(C(cc.spots), smooth01((nz(p.x * 1.2 / r, p.y * 1.2 / r, p.z * 1.2 / r) - 0.62) / 0.04) * smooth01((y + 0.2) / 0.3));
    c.multiplyScalar(0.9 + 0.15 * Math.abs(Math.sin(p.x * 900 / L) * Math.sin(p.z * 900 / L)));
    return c;
  };
  paint(g, paintFn);
  for (const lg of legGeos) {
    if (!lg.attributes.normal) lg.computeVertexNormals();
    paint(lg, (i, p, n, A) => paintFn(i, p, n, { ...A, sy: undefined, lt: undefined }).lerp(back, 0.4));
  }
  root.add(rig.get(names[0]));
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(rig.bones);
  const m = mat({ name: 'primary', roughness: S.smooth ? 0.25 : 0.55, clearcoat: S.smooth ? 0.9 : 0.3 });
  root.add(skinnedMesh(g, m, skel, 'body_mesh'));
  root.add(skinnedMesh(mergeAll(legGeos), m, skel, 'legs'));
  // head parts
  const head = rig.get(names[0]);
  const hw0 = rig.world[names[0]];
  const addH = (obj) => {
    obj.position.sub(hw0);
    head.add(obj);
  };
  for (const s2 of [1, -1]) {
    const sp = surfacePoint(curve, sec, lerp(tH, 1, 0.3), s2 * 0.95, S.curlTail ? 'x' : 'auto');
    const er = hw * (S.eyeBig ? 0.32 : S.casque ? 0.36 : 0.18);
    addH(buildEye(sp.p.clone().addScaledVector(sp.n, -er * 0.55), sp.n, er, { color: S.casque ? '#4ab84a' : S.scutes ? '#c8b03a' : '#d8a02a', pupil: S.scutes || S.eyeBig ? 'slit' : 'round', lid: S.casque ? '#4ab84a' : '#2a2a20', lidSquint: S.casque ? 0.5 : 0.8 }));
  }
  if (S.teeth) {
    const tm = plain('#efe8d4');
    for (let k = 0; k < 10; k++) {
      for (const s2 of [1, -1]) {
        const sp = surfacePoint(curve, sec, lerp(tH, 1, 0.35 + k * 0.06), s2 * 1.75, 'auto');
        const tg = new THREE.ConeGeometry(hw * 0.035, hw * 0.12, 5);
        tg.rotateX(Math.PI);
        const tmesh = new THREE.Mesh(tg, tm);
        tmesh.position.copy(sp.p).add(new THREE.Vector3(0, -hw * 0.04, 0));
        addH(tmesh);
      }
    }
  }
  if (S.gills) {
    const gm = plain('#e8708a');
    for (const s2 of [1, -1]) {
      for (let k = 0; k < 3; k++) {
        const sp = surfacePoint(curve, sec, lerp(tH, 1, 0.05), s2 * (0.6 + k * 0.45), 'auto');
        const dir = sp.n.clone().add(new THREE.Vector3(0, 0.4, -0.6)).normalize();
        const fg = limb([sp.p, sp.p.clone().addScaledVector(dir, hw * 0.6), sp.p.clone().addScaledVector(dir, hw * 1.0).add(new THREE.Vector3(0, hw * 0.1, -hw * 0.1))], hw * 0.06, hw * 0.03, 6);
        addH(new THREE.Mesh(fg, gm));
      }
    }
  }
  if (S.dewlap || S.beardSpikes) {
    const sp = surfacePoint(curve, sec, lerp(tH, 1, 0.15), Math.PI, 'auto');
    if (S.dewlap) {
      const dg = new THREE.SphereGeometry(hw * 0.6, 14, 10);
      dg.scale(0.15, 1, 1);
      const dm = new THREE.Mesh(dg, plain(cc.belly));
      dm.position.copy(sp.p).add(new THREE.Vector3(0, -hw * 0.4, -hw * 0.1));
      addH(dm);
    }
    if (S.beardSpikes) {
      for (let k = 0; k < 12; k++) {
        const a = Math.PI * (0.55 + (k / 11) * 0.9);
        const s3 = surfacePoint(curve, sec, lerp(tH, 1, 0.12), a, 'auto');
        const cg = new THREE.ConeGeometry(hw * 0.05, hw * 0.25, 5);
        const cm = new THREE.Mesh(cg, plain(cc.back));
        cm.position.copy(s3.p).addScaledVector(s3.n, hw * 0.08);
        cm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), s3.n);
        addH(cm);
      }
    }
  }
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  rig.get(names[0]).position.y -= box.min.y;
  root.traverse((o) => {
    if (o.isSkinnedMesh) o.boundingBox = o.boundingSphere = null;
  });
  // animations: walk = spine wave + leg strides
  const legSpec = {};
  legNames.forEach((ln, k) => {
    const ph = ln === 'legFL' || ln === 'legBR' ? 0 : 0.5;
    legSpec[`${ln}0`] = (t) => [0, 0.5 * Math.sin(TAU * (t + ph)), 0.25 * Math.max(0, Math.cos(TAU * (t + ph)))];
    void k;
  });
  root.userData.clips = [waveClip('walk', rig, names.slice(2), 1.0, 0.12, 1, legSpec), waveClip('idle', rig, names.slice(0, 2), 3, 0.05, 1)];
  return root;
}

function mergeAll(gs) {
  const keys = ['position', 'normal', 'color', 'skinIndex', 'skinWeight'];
  const total = gs.reduce((a, g) => a + g.attributes.position.count, 0);
  const arr = { position: new Float32Array(total * 3), normal: new Float32Array(total * 3), color: new Float32Array(total * 3), skinIndex: new Uint16Array(total * 4), skinWeight: new Float32Array(total * 4) };
  const idx = [];
  let off = 0;
  for (const g0 of gs) {
    const g = g0.index ? g0 : g0;
    if (!g.attributes.normal) g.computeVertexNormals();
    for (const k of keys) if (g.attributes[k]) arr[k].set(g.attributes[k].array.subarray(0, g.attributes.position.count * g.attributes[k].itemSize), off * g.attributes[k].itemSize);
    const ix = g.index ? g.index.array : [...Array(g.attributes.position.count).keys()];
    for (const v of ix) idx.push(v + off);
    off += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(arr.position, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(arr.normal, 3));
  out.setAttribute('color', new THREE.BufferAttribute(arr.color, 3));
  out.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(arr.skinIndex, 4));
  out.setAttribute('skinWeight', new THREE.BufferAttribute(arr.skinWeight, 4));
  out.setIndex(idx);
  return out;
}

/* ---------------- turtle ---------------- */
function buildTurtle(name, S, { nz }) {
  const root = new THREE.Group();
  const L = S.L;
  const sl = L * (S.shell.len ?? 0.8);
  const sh = sl * S.shell.h * 0.5;
  const sw = sl * 0.42;
  const lift = S.flippers ? sl * 0.08 : S.legs === 'columns' ? sl * 0.18 : sl * 0.1;
  const rig = new Rig();
  rig.add('body', [0, lift + sh * 0.3, 0]);
  // shell: dome (lathe-like loft along Z)
  const c = spline([new THREE.Vector3(0, lift, -sl / 2), new THREE.Vector3(0, lift, 0), new THREE.Vector3(0, lift, sl / 2)]);
  const shellSec = (t) => {
    const k = Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.45;
    return { w: sw * k + 1e-4, up: sh * k * 2 + 1e-4, dn: sh * 0.25 * k + 1e-4, e: 2.2, wb: 1.04 };
  };
  const shell = loft(c, shellSec, { n: 50, ring: 40, displace: (t, a) => (S.shell.ridges ? sh * 0.08 * Math.max(0, Math.sin(t * 22)) * (Math.abs(Math.sin(a * 2)) > 0.9 ? 1 : 0.3) : 0) });
  const cc = S.coat;
  const lt = shell.attributes.lt.array;
  const la = shell.attributes.la.array;
  const sy = shell.attributes.sy.array;
  paint(shell, (i, p) => {
    if (sy[i] < -0.05) return C(cc.belly);
    // scute seams: grid in (t, angle) space, central row of hexagons
    const u = lt[i] * 5;
    const v = (la[i] / Math.PI) * 4;
    const fu = Math.abs((u % 1) - 0.5);
    const fv = Math.abs((v % 1) - 0.5);
    const seam = smooth01((fu - 0.44) / 0.04) + smooth01((fv - 0.45) / 0.04);
    let col = C(S.color ?? cc.shell).lerp(C(cc.scute), Math.min(1, seam));
    if (cc.scute && S.L < 0.2) col.lerp(C(cc.scute), smooth01((0.15 - Math.hypot(fu - 0.2, fv - 0.2)) / 0.05) * 0.8);
    col.multiplyScalar(0.85 + 0.25 * nz(p.x * 40 / L, p.y * 40 / L, p.z * 40 / L));
    return col;
  });
  applySkin(shell, () => [[0, 1]]);
  const skinC = C(cc.skin);
  const parts = [];
  const legGeos = [];
  // head + neck
  const neckBase = new THREE.Vector3(0, lift + sh * 0.25, sl * 0.42);
  const headP = neckBase.clone().add(new THREE.Vector3(0, sh * 0.25, sl * 0.22));
  rig.add('head', neckBase.toArray(), 'body');
  const hr = sl * (S.bigHead ? 0.13 : 0.09);
  const hg = blob(neckBase.clone().add(new THREE.Vector3(0, -sh * 0.1, -sl * 0.1)), headP.clone().add(new THREE.Vector3(0, 0, hr * 1.6)), hr, hr * 0.85, { shape: (t) => (t < 0.5 ? 0.7 + 0.3 * smooth01(t / 0.5) : Math.sqrt(Math.max(0, 1 - ((t - 0.5) / 0.52) ** 2))) });
  paint(hg, (i, p, n) => skinC.clone().lerp(C(cc.belly), smooth01(-n.y) * 0.4).multiplyScalar(0.9 + 0.2 * nz(p.x * 300, p.y * 300, p.z * 300)));
  applySkin(hg, () => [[rig.index('head'), 1]]);
  legGeos.push(hg);
  for (const s2 of [1, -1]) {
    const eye = buildEye(headP.clone().add(new THREE.Vector3(s2 * hr * 0.72, hr * 0.25, hr * 0.7)), new THREE.Vector3(s2, 0.3, 0.6).normalize(), hr * 0.18, { color: '#1a140e', lid: cc.skin });
    parts.push([eye, 'head']);
  }
  // limbs
  for (const [zf, front] of [[0.3, true], [-0.32, false]]) {
    for (const s2 of [1, -1]) {
      const base = new THREE.Vector3(s2 * sw * 0.7, lift + sh * 0.1, zf * sl);
      let pts;
      let r0;
      let r1;
      if (S.flippers) {
        const fl = front ? sl * 0.55 : sl * 0.25;
        pts = [base, base.clone().add(new THREE.Vector3(s2 * fl * 0.5, -sh * 0.05, front ? fl * 0.15 : -fl * 0.2)), base.clone().add(new THREE.Vector3(s2 * fl, -sh * 0.1, front ? -fl * 0.1 : -fl * 0.4))];
        r0 = sl * 0.06;
        r1 = sl * 0.02;
      } else {
        const ll = lift + sh * 0.1;
        pts = [base, base.clone().add(new THREE.Vector3(s2 * sl * 0.08, -ll * 0.4, 0)), new THREE.Vector3(base.x + s2 * sl * 0.1, sl * 0.03, base.z + (front ? sl * 0.03 : -sl * 0.02))];
        r0 = sl * (S.legs === 'columns' ? 0.08 : 0.05);
        r1 = sl * (S.legs === 'columns' ? 0.07 : 0.035);
      }
      const ln = `leg${front ? 'F' : 'B'}${s2 > 0 ? 'L' : 'R'}`;
      rig.add(ln, base.toArray(), 'body');
      const lg = loft(spline(pts), (t) => (S.flippers ? { w: lerp(r0, r1, t) * 2.2, up: lerp(r0, r1, t) * 0.35, dn: lerp(r0, r1, t) * 0.35, e: 2 } : { w: lerp(r0, r1, t), up: lerp(r0, r1, t), dn: lerp(r0, r1, t), e: 2 }), { n: 14, ring: 12, lateral: S.flippers ? 'auto' : 'free' });
      if (!S.flippers) {
        const P = lg.attributes.position;
        for (let i = 0; i < P.count; i++) if (P.getY(i) < 0.002) P.setY(i, 0);
        lg.computeVertexNormals();
      }
      paint(lg, (i, p) => skinC.clone().multiplyScalar(0.85 + 0.3 * nz(p.x * 300 / L, p.y * 300 / L, p.z * 300 / L)));
      applySkin(lg, () => [[rig.index(ln), 1]]);
      legGeos.push(lg);
    }
  }
  // tail
  const tg = blob(new THREE.Vector3(0, lift + sh * 0.1, -sl * 0.42), new THREE.Vector3(0, lift * 0.6, -sl * 0.62), sl * 0.04, sl * 0.035, { shape: (t) => 1 - t * 0.85 });
  paint(tg, () => skinC.clone());
  applySkin(tg, () => [[0, 1]]);
  legGeos.push(tg);
  root.add(rig.get('body'));
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(rig.bones);
  root.add(skinnedMesh(shell, mat({ name: 'shell', roughness: 0.45, clearcoat: 0.6 }), skel, 'shell'));
  root.add(skinnedMesh(mergeAll(legGeos), mat({ name: 'primary', roughness: 0.7, clearcoat: 0.1 }), skel, 'body_mesh'));
  for (const [o, bone] of parts) {
    o.position.sub(rig.world[bone]);
    rig.get(bone).add(o);
  }
  if (S.swims) root.userData.floating = true;
  const flap = (ln, amp, ph) => (t) => (S.flippers ? [0, 0, amp * Math.sin(TAU * (t + ph)) * (ln.endsWith('L') ? 1 : -1)] : [0, amp * Math.sin(TAU * (t + ph)), 0]);
  const tracks = [];
  for (const ln of ['legFL', 'legFR', 'legBL', 'legBR']) tracks.push(poseTrack(rig.get(ln), S.flippers ? 2 : 2.4, flap(ln, S.flippers ? 0.6 : 0.35, ln === 'legFL' || ln === 'legBR' ? 0 : 0.5)));
  tracks.push(poseTrack(rig.get('head'), S.flippers ? 2 : 2.4, (t) => [0.05 * Math.sin(TAU * t * 2), 0.1 * Math.sin(TAU * t), 0]));
  root.userData.clips = [clip(S.flippers ? 'swim' : 'walk', S.flippers ? 2 : 2.4, tracks), clip('idle', 5, [poseTrack(rig.get('head'), 5, (t) => [0.1 * Math.sin(TAU * t), 0.3 * Math.sin(TAU * t), 0])])];
  return root;
}

/* ---------------- frog ---------------- */
function buildFrog(name, S, { nz }) {
  const root = new THREE.Group();
  const L = S.L;
  const rig = new Rig();
  const bodyY = L * 0.32;
  rig.add('body', [0, bodyY, 0]);
  // squat body sloping down at the rear, wide head
  const c = spline([new THREE.Vector3(0, L * 0.22, -L * 0.42), new THREE.Vector3(0, L * 0.32, -L * 0.05), new THREE.Vector3(0, L * 0.36, L * 0.3), new THREE.Vector3(0, L * 0.32, L * 0.5)]);
  const sec = (t) => {
    const k = Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.04)) ** 0.5;
    return { w: L * 0.3 * k * (1 + 0.15 * bump(t, 0.7, 0.15)) + 1e-4, up: L * 0.16 * k + 1e-4, dn: L * 0.15 * k + 1e-4, e: 2.2 };
  };
  const body = loft(c, sec, { n: 50, ring: 26, displace: (t, a, p) => (S.warts ? L * 0.02 * Math.max(0, nz(p.x * 40 / L, p.y * 40 / L, p.z * 40 / L) - 0.6) * 4 : 0) });
  applySkin(body, () => [[0, 1]]);
  const geos = [body];
  const legs = [];
  for (const s2 of [1, -1]) {
    // hind leg: hip → knee (forward) → ankle (back) → long foot forward on the ground
    const hip = new THREE.Vector3(s2 * L * 0.2, L * 0.25, -L * 0.3);
    const knee = new THREE.Vector3(s2 * L * 0.42, L * 0.16, -L * 0.02);
    const ankle = new THREE.Vector3(s2 * L * 0.36, L * 0.08, -L * 0.42);
    const foot = new THREE.Vector3(s2 * L * 0.5, L * 0.025, -L * 0.05);
    const ln = `legB${s2 > 0 ? 'L' : 'R'}`;
    rig.add(`${ln}0`, hip.toArray(), 'body');
    rig.add(`${ln}1`, knee.toArray(), `${ln}0`);
    rig.add(`${ln}2`, ankle.toArray(), `${ln}1`);
    const lg = limb([hip, knee, ankle, foot], L * 0.09, L * 0.03, 12);
    const ltl = lg.attributes.lt.array;
    applySkin(lg, (i) => chain(ltl[i], [0, rig.index(`${ln}0`), rig.index(`${ln}1`), rig.index(`${ln}2`)], [0, 0.1, 0.4, 0.7], 0.06));
    geos.push(lg);
    legs.push(ln);
    for (let k = 0; k < 5; k++) {
      const a = (k - 2) * 0.3;
      const d = new THREE.Vector3(Math.sin(a) + s2 * 0.2, 0, Math.cos(a)).normalize();
      const tg = limb([foot, foot.clone().addScaledVector(d, L * 0.16).setY(L * 0.012)], L * 0.016, L * 0.008, 6);
      applySkin(tg, () => [[rig.index(`${ln}2`), 1]]);
      geos.push(tg);
      if (S.toePads) {
        const pg = new THREE.SphereGeometry(L * 0.022, 8, 6);
        pg.translate(foot.x + d.x * L * 0.16, L * 0.014, foot.z + d.z * L * 0.16);
        applySkin(pg, () => [[rig.index(`${ln}2`), 1]]);
        geos.push(pg);
      }
    }
    // front leg
    const sh = new THREE.Vector3(s2 * L * 0.2, L * 0.24, L * 0.22);
    const elb = new THREE.Vector3(s2 * L * 0.28, L * 0.12, L * 0.3);
    const hand = new THREE.Vector3(s2 * L * 0.26, L * 0.02, L * 0.38);
    const fn = `legF${s2 > 0 ? 'L' : 'R'}`;
    rig.add(fn, sh.toArray(), 'body');
    const fg = limb([sh, elb, hand], L * 0.05, L * 0.025, 10);
    applySkin(fg, () => [[rig.index(fn), 1]]);
    geos.push(fg);
    for (let k = 0; k < 4; k++) {
      const a = (k - 1.5) * 0.45;
      const d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      const tg = limb([hand, hand.clone().addScaledVector(d, L * 0.07).setY(L * 0.01)], L * 0.012, L * 0.007, 6);
      applySkin(tg, () => [[rig.index(fn), 1]]);
      geos.push(tg);
    }
  }
  const cc = S.coat;
  const back = C(S.color ?? cc.back);
  for (const g of geos) {
    if (!g.attributes.normal) g.computeVertexNormals();
    paint(g, (i, p, n) => {
      let col = C(cc.belly).lerp(back, smooth01((n.y + 0.2) / 0.4));
      if (cc.side) col.lerp(C(cc.side), smooth01((Math.abs(n.x) - 0.75) / 0.15) * 0.8);
      if (cc.spots) col.lerp(C(cc.spots), smooth01((nz(p.x * 12 / L, p.y * 12 / L, p.z * 12 / L) - 0.62) / 0.04) * smooth01((n.y + 0.1) / 0.3));
      return col.multiplyScalar(0.92 + 0.12 * nz(p.x * 80 / L, p.y * 80 / L, p.z * 80 / L));
    });
  }
  root.add(rig.get('body'));
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(rig.bones);
  root.add(skinnedMesh(mergeAll(geos), mat({ name: 'primary', roughness: S.warts ? 0.6 : 0.2, clearcoat: S.warts ? 0.2 : 0.9 }), skel, 'body_mesh'));
  // bulging eyes on top
  for (const s2 of [1, -1]) {
    const at = new THREE.Vector3(s2 * L * 0.14, L * 0.46, L * 0.32);
    const e = buildEye(at, new THREE.Vector3(s2 * 0.7, 0.5, 0.5).normalize(), L * 0.075, { color: S.eyeColor ?? '#c8a02a', pupil: 'bar', lid: cc.back, lidSquint: 0.9 });
    e.position.sub(rig.world.body);
    rig.get('body').add(e);
  }
  const hop = 0.7;
  const hp = (t) => Math.max(0, Math.sin(TAU * t));
  root.userData.clips = [
    clip('hop', hop, [
      offsetTrack(rig.get('body'), hop, (t) => [0, L * 0.6 * hp(t), L * 0.3 * hp(t)]),
      poseTrack(rig.get('body'), hop, (t) => [-0.4 * hp(t), 0, 0]),
      ...legs.flatMap((ln) => [poseTrack(rig.get(`${ln}0`), hop, (t) => [-0.9 * hp(t), 0, 0]), poseTrack(rig.get(`${ln}1`), hop, (t) => [1.2 * hp(t), 0, 0]), poseTrack(rig.get(`${ln}2`), hop, (t) => [-0.8 * hp(t), 0, 0])]),
    ]),
    clip('idle', 3, [offsetTrack(rig.get('body'), 3, (t) => [0, L * 0.01 * Math.sin(TAU * t * 3), 0])]),
  ];
  return root;
}

/* ---------------- insects ---------------- */
function wingMesh(outline, color, opts = {}) {
  // grid inside the outline so wings can carry painted patterns (veins, eyespots)
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const N = 22;
  const inside = (x, y) => {
    let c = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const [xi, yi] = outline[i];
      const [xj, yj] = outline[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const holes = [];
  void holes;
  // simplest robust approach: ShapeGeometry + subdivide by adding interior points via Delaunay-less fan
  const g = new THREE.ShapeGeometry(shape, 8);
  // tessellate further
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const base = C(color);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const c = opts.paint ? opts.paint(x, y, (x - x0) / (x1 - x0), (y - y0) / (y1 - y0)) : base;
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  void inside;
  void N;
  return g;
}

function tessellate(g, times = 3) {
  // midpoint subdivision so vertex colours can show patterns
  let geo = g.index ? g.toNonIndexed() : g;
  for (let k = 0; k < times; k++) {
    const p = geo.attributes.position.array;
    const out = [];
    for (let i = 0; i < p.length; i += 9) {
      const a = [p[i], p[i + 1], p[i + 2]];
      const b = [p[i + 3], p[i + 4], p[i + 5]];
      const c = [p[i + 6], p[i + 7], p[i + 8]];
      const ab = a.map((v, j) => (v + b[j]) / 2);
      const bc = b.map((v, j) => (v + c[j]) / 2);
      const ca = c.map((v, j) => (v + a[j]) / 2);
      out.push(...a, ...ab, ...ca, ...ab, ...b, ...bc, ...ca, ...bc, ...c, ...ab, ...bc, ...ca);
    }
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  }
  return geo;
}

function buildInsect(name, S, { nz }) {
  const root = new THREE.Group();
  const L = S.L;
  const k = S.kind;
  const rig = new Rig();
  const legLen = L * (k === 'grasshopper' ? 0.5 : k === 'butterfly' ? 0.35 : k === 'ant' ? 0.55 : 0.45);
  const y = legLen * 0.45 + L * 0.05;
  rig.add('body', [0, y, 0]);
  const cc = S.coat;
  const bodyC = C(S.color ?? cc.body ?? '#2a2420');
  const geos = [];
  const add = (g, color, bone = 'body', fn) => {
    if (!g.attributes.normal) g.computeVertexNormals();
    if (fn) paint(g, fn);
    else colorAll(g, color);
    applySkin(g, () => [[rig.index(bone), 1]]);
    geos.push(g);
    return g;
  };
  const V = (x2, y2, z2) => new THREE.Vector3(x2, y2, z2);
  const stripes = cc.stripes ? C(cc.stripes) : null;
  const fuzz = S.fuzzy ? (t, a, p) => L * 0.025 * (nz(p.x * 600 / L, p.y * 600 / L, p.z * 600 / L) - 0.3) : null;
  // segments
  const headR = L * (k === 'ant' ? 0.12 : k === 'mantis' ? 0.08 : 0.1);
  const thoraxL = L * (k === 'mantis' ? 0.35 : 0.25);
  const abdL = L * (k === 'dragonfly' ? 0.62 : k === 'butterfly' ? 0.5 : k === 'mantis' ? 0.4 : 0.45);
  const zH = L * 0.5 - headR;
  const zT0 = zH - headR * 0.8;
  const zT1 = zT0 - thoraxL;
  const waist = k === 'ant' || k === 'wasp' ? L * 0.05 : 0;
  const zA1 = zT1 - waist - abdL;
  add(blob(V(0, y + (k === 'mantis' ? L * 0.15 : 0), zH - headR), V(0, y + (k === 'mantis' ? L * 0.15 : 0), zH + headR), headR, headR * 0.9, { disp: fuzz }), bodyC);
  if (k === 'beetle') {
    // elytra dome shell over thorax+abdomen
    const dome = blob(V(0, y, zT0 + L * 0.02), V(0, y, zA1 + L * 0.2), L * (S.round ? 0.42 : 0.28), L * (S.round ? 0.32 : 0.2), { shape: (t) => Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.45 });
    const sy = dome.attributes.sy.array;
    const sx = dome.attributes.sx.array;
    add(dome, null, 'body', (i, p) => {
      if (sy[i] < -0.25) return bodyC.clone();
      let c = C(cc.shell);
      if (Math.abs(sx[i]) < 0.04 && sy[i] > 0) c = C('#141414');
      if (cc.spots) c.lerp(C(cc.spots), smooth01((nz(p.x * 6 / L, p.y * 6 / L, p.z * 6 / L) - 0.66) / 0.03));
      return c;
    });
  } else {
    add(blob(V(0, y, zT0), V(0, y, zT1), L * 0.12, L * 0.11, { disp: fuzz }), bodyC);
    const abd = blob(V(0, y + (k === 'butterfly' || k === 'dragonfly' ? 0 : L * 0.04), zT1 - waist), V(0, y - (k === 'dragonfly' ? 0 : L * 0.04), zA1), L * (k === 'dragonfly' ? 0.05 : k === 'butterfly' ? 0.06 : 0.15), L * (k === 'dragonfly' ? 0.05 : k === 'butterfly' ? 0.06 : 0.13), { disp: fuzz, shape: (t) => Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** (k === 'dragonfly' ? 0.15 : 0.5) });
    const lt = abd.attributes.lt.array;
    add(abd, null, 'body', (i) => (stripes && Math.sin(lt[i] * Math.PI * 9) > 0.2 ? stripes.clone() : bodyC.clone()));
    if (waist) add(limb([V(0, y, zT1 + L * 0.01), V(0, y + L * 0.02, zT1 - waist - L * 0.01)], L * 0.03, L * 0.03, 6), bodyC);
  }
  // eyes
  for (const s2 of [1, -1]) {
    const eg = new THREE.SphereGeometry(headR * (k === 'dragonfly' ? 0.75 : 0.45), 12, 10);
    eg.translate(s2 * headR * 0.65, y + headR * 0.25 + (k === 'mantis' ? L * 0.15 : 0), zH + headR * 0.2);
    add(eg, k === 'dragonfly' ? '#2a6a4a' : k === 'mantis' ? '#9ad86a' : '#141414');
  }
  // antennae
  if (k !== 'dragonfly') {
    for (const s2 of [1, -1]) {
      const al = L * (k === 'butterfly' ? 0.6 : k === 'grasshopper' ? 0.7 : 0.4);
      const base = V(s2 * headR * 0.3, y + headR * 0.7 + (k === 'mantis' ? L * 0.15 : 0), zH + headR * 0.5);
      add(limb([base, base.clone().add(V(s2 * al * 0.2, al * 0.4, al * 0.4)), base.clone().add(V(s2 * al * 0.35, al * 0.5, al * 0.85))], L * 0.008, L * 0.005, 5), bodyC);
      if (k === 'butterfly' && !S.moth) {
        const club = new THREE.SphereGeometry(L * 0.018, 8, 6);
        club.translate(base.x + s2 * al * 0.35, base.y + al * 0.5, base.z + al * 0.85);
        add(club, bodyC);
      }
    }
  }
  if (S.mandibles || S.horn) {
    for (const s2 of S.horn ? [0] : [1, -1]) {
      const b0 = V(s2 * headR * 0.4, y, zH + headR * 0.8);
      const pts = S.horn ? [b0, b0.clone().add(V(0, L * 0.15, L * 0.15)), b0.clone().add(V(0, L * 0.3, L * 0.1))] : [b0, b0.clone().add(V(s2 * L * 0.12, L * 0.05, L * 0.15)), b0.clone().add(V(-s2 * L * 0.02, L * 0.06, L * 0.3))];
      add(limb(pts, L * 0.035, L * 0.01, 8), cc.shell ?? '#3a2418');
    }
  }
  // legs (3 pairs from the thorax)
  const legNames = [];
  for (let pIdx = 0; pIdx < 3; pIdx++) {
    for (const s2 of [1, -1]) {
      const z0 = lerp(zT0, zT1, 0.2 + pIdx * 0.3);
      const big = k === 'grasshopper' && pIdx === 2;
      const raptorial = k === 'mantis' && pIdx === 0;
      const ll = legLen * (big ? 1.6 : 1);
      const hip = V(s2 * L * 0.08, y - L * 0.03, z0);
      const knee = V(s2 * ll * 0.55, y + ll * (big ? 0.5 : 0.25), z0 + (pIdx - 1) * ll * 0.35);
      const foot = V(s2 * ll * 0.85, L * 0.004, z0 + (pIdx - 1) * ll * 0.65 + (big ? -ll * 0.3 : 0));
      const ln = `leg${pIdx}${s2 > 0 ? 'L' : 'R'}`;
      rig.add(ln, hip.toArray(), 'body');
      legNames.push(ln);
      const pts = raptorial ? [hip, V(s2 * L * 0.1, y + L * 0.25, zH + L * 0.05), V(s2 * L * 0.08, y + L * 0.05, zH + L * 0.12)] : [hip, knee, foot];
      add(limb(pts, L * (big ? 0.03 : 0.014), L * 0.006, 6), bodyC, ln);
    }
  }
  // wings
  const wingParts = [];
  const wingMatOpaque = new THREE.MeshPhysicalMaterial({ name: 'wing', vertexColors: true, roughness: 0.6, side: THREE.DoubleSide, sheen: 0.5 });
  const wingMatClear = new THREE.MeshPhysicalMaterial({ name: 'wing', color: '#e8f0f2', roughness: 0.1, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, iridescence: 1 });
  const mkWing = (outline, s2, z, paintFn, clear, upTilt) => {
    const sm = new THREE.SplineCurve([...outline, outline[0]].map(([a, b2]) => new THREE.Vector2(a, b2))).getPoints(outline.length * 6).map((v) => [v.x, v.y]);
    const out = s2 > 0 ? sm : sm.map(([a, b2]) => [-a, b2]);
    if (s2 < 0) out.reverse();
    let g = new THREE.ShapeGeometry(new THREE.Shape(out.map(([a, b2]) => new THREE.Vector2(a, b2))));
    g = tessellate(g, clear ? 0 : 3);
    // shape lies in XY: x = span, y = chord → rotate to XZ (horizontal)
    g.rotateX(-Math.PI / 2);
    const P = g.attributes.position;
    if (paintFn) {
      const col = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) {
        const c = paintFn(Math.abs(P.getX(i)), -P.getZ(i));
        col.set([c.r, c.g, c.b], i * 3);
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    g.computeVertexNormals();
    const wn = `wing${wingParts.length}`;
    const pivot = V(s2 * L * 0.06, y + L * 0.08, z);
    rig.add(wn, pivot.toArray(), 'body');
    const m = new THREE.Mesh(g, clear ? wingMatClear : wingMatOpaque);
    m.position.set(0, 0, 0);
    m.rotation.z = s2 * (upTilt ?? 0);
    wingParts.push([m, wn, s2]);
  };
  if (k === 'butterfly') {
    const span = S.span * 0.5;
    const w = S.wing;
    const fore = [[0, 0], [span * 0.35, span * 0.15], [span * 0.9, span * 0.28], [span, span * 0.12], [span * 0.82, -span * 0.25], [span * 0.4, -span * 0.3], [0, -span * 0.08]];
    const hind = S.tails
      ? [[0, -span * 0.05], [span * 0.55, -span * 0.15], [span * 0.62, -span * 0.45], [span * 0.48, -span * 0.62], [span * 0.4, -span * 0.95], [span * 0.32, -span * 0.62], [span * 0.12, -span * 0.5], [0, -span * 0.25]]
      : [[0, -span * 0.05], [span * 0.6, -span * 0.15], [span * 0.68, -span * 0.5], [span * 0.4, -span * 0.68], [span * 0.1, -span * 0.48], [0, -span * 0.22]];
    const pfn = (u, v) => {
      // u = distance from body along the span, v = chord position
      const r2 = Math.hypot(u / span, v / span);
      let c = C(w.color);
      if (Math.abs(Math.sin(Math.atan2(v, u) * 7)) < 0.08 && r2 > 0.1) c = C(w.vein);
      if (r2 > 0.82 || (r2 > 0.62 && u / span > 0.75)) c = C(w.edge);
      if (r2 > 0.86 && Math.sin(Math.atan2(v, u) * 22) > 0.6) c = C(w.dots);
      if (S.moth && Math.hypot(u / span - 0.45, v / span + 0.35) < 0.07) c = C(w.dots);
      return c.multiplyScalar(0.9 + 0.2 * nz(u * 200 / L, v * 200 / L, 1));
    };
    for (const s2 of [1, -1]) {
      mkWing(fore, s2, zT0 - thoraxL * 0.3, pfn, false, S.closed ? 1.3 : 0.35);
      mkWing(hind, s2, zT0 - thoraxL * 0.5, pfn, false, S.closed ? 1.28 : 0.3);
    }
  } else if (k === 'dragonfly') {
    const span = L * 0.65;
    const ol = [[0, L * 0.02], [span * 0.5, L * 0.05], [span, L * 0.01], [span * 0.95, -L * 0.06], [span * 0.4, -L * 0.07], [0, -L * 0.03]];
    for (const s2 of [1, -1]) {
      mkWing(ol, s2, zT0 - thoraxL * 0.25, null, true, 0.05);
      mkWing(ol, s2, zT0 - thoraxL * 0.7, null, true, 0.05);
    }
  } else if (k === 'bee' || k === 'wasp' || k === 'grasshopper' || k === 'mantis') {
    const span = L * (k === 'grasshopper' || k === 'mantis' ? 0.55 : 0.55);
    const ol = k === 'grasshopper' || k === 'mantis' ? [[0, 0], [span * 0.1, L * 0.02], [span * 0.12, -span * 1.2], [0, -span * 1.25]] : [[0, 0.01 * L], [span * 0.6, L * 0.04], [span, -L * 0.02], [span * 0.7, -L * 0.1], [0, -L * 0.06]];
    for (const s2 of [1, -1]) mkWing(ol, s2, zT0 - thoraxL * 0.35, k === 'grasshopper' || k === 'mantis' ? () => bodyC.clone().multiplyScalar(0.85) : null, !(k === 'grasshopper' || k === 'mantis'), k === 'grasshopper' || k === 'mantis' ? 0.05 : S.closed ? 0.05 : 0.3);
  }
  root.add(rig.get('body'));
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(rig.bones);
  root.add(skinnedMesh(mergeAll(geos), mat({ name: 'primary', roughness: S.fuzzy ? 0.9 : 0.3, clearcoat: S.fuzzy ? 0 : 0.8, ...(S.metallic ? { metalness: 0.6, roughness: 0.25, iridescence: 1 } : {}) }), skel, 'body_mesh'));
  for (const [m, wn] of wingParts) rig.get(wn).add(m);
  // flutter / walk
  const fp = k === 'butterfly' ? 0.35 : k === 'dragonfly' ? 0.06 : 0.04;
  const flutterTracks = wingParts.map(([, wn, s2]) => poseTrack(rig.get(wn), fp, (t) => [0, 0, s2 * (k === 'butterfly' ? 1.1 : 0.8) * Math.sin(TAU * t)], 16));
  flutterTracks.push(offsetTrack(rig.get('body'), fp, (t) => [0, L * 0.6 + L * 0.05 * Math.sin(TAU * t), 0], 16));
  const walkTracks = legNames.map((ln, i) => poseTrack(rig.get(ln), 0.4, (t) => [0, 0.35 * Math.sin(TAU * t + (i % 2 ? Math.PI : 0) + Math.floor(i / 2) * Math.PI), 0], 16));
  root.userData.clips = [clip('walk', 0.4, walkTracks)];
  if (wingParts.length && k !== 'grasshopper' && k !== 'mantis') root.userData.clips.push(clip('flutter', fp, flutterTracks));
  root.userData.clips.push(clip('idle', 2, [poseTrack(rig.get('body'), 2, (t) => [0.03 * Math.sin(TAU * t), 0, 0])]));
  return root;
}

/* ---------------- spiders & scorpions ---------------- */
function buildArachnid(name, S, { nz }) {
  const root = new THREE.Group();
  const L = S.L;
  const rig = new Rig();
  const legLen = L * (S.scorpion ? 0.5 : 0.9);
  const y = (S.raised ? legLen * 0.6 : legLen * 0.35) + L * 0.05;
  rig.add('body', [0, y, 0]);
  const cc = S.coat;
  const bodyC = C(S.color ?? cc.body);
  const geos = [];
  const add = (g, color, bone = 'body', fn) => {
    if (!g.attributes.normal) g.computeVertexNormals();
    if (fn) paint(g, fn);
    else colorAll(g, color);
    applySkin(g, () => [[rig.index(bone), 1]]);
    geos.push(g);
  };
  const V = (a, b, c) => new THREE.Vector3(a, b, c);
  const fuzz = S.fuzzy ? (t, a, p) => L * 0.02 * (nz(p.x * 500 / L, p.y * 500 / L, p.z * 500 / L) - 0.3) : null;
  // cephalothorax + abdomen
  add(blob(V(0, y, L * 0.05), V(0, y + L * 0.02, L * 0.32), L * 0.15, L * 0.1, { disp: fuzz }), bodyC);
  if (S.scorpion) {
    // segmented flat abdomen + curled tail with stinger
    add(blob(V(0, y, L * 0.06), V(0, y, -L * 0.3), L * 0.15, L * 0.07, { disp: (t) => -L * 0.008 * Math.abs(Math.sin(t * 22)) }), bodyC);
    const tail = [V(0, y, -L * 0.3), V(0, y + L * 0.15, -L * 0.45), V(0, y + L * 0.38, -L * 0.42), V(0, y + L * 0.5, -L * 0.25), V(0, y + L * 0.45, -L * 0.1)];
    const tg = limb(tail, L * 0.05, L * 0.03, 10);
    const lt = tg.attributes.lt.array;
    add(tg, null, 'body', (i) => bodyC.clone().multiplyScalar(Math.abs(Math.sin(lt[i] * 18)) < 0.15 ? 0.7 : 1));
    const sting = new THREE.ConeGeometry(L * 0.025, L * 0.08, 8);
    sting.rotateX(Math.PI * 0.85);
    sting.translate(0, y + L * 0.42, -L * 0.04);
    add(sting, '#2a1e14');
    // pincers
    for (const s2 of [1, -1]) {
      const arm = [V(s2 * L * 0.1, y, L * 0.3), V(s2 * L * 0.25, y + L * 0.02, L * 0.42), V(s2 * L * 0.2, y + L * 0.02, L * 0.6)];
      add(limb(arm, L * 0.03, L * 0.025, 8), bodyC);
      const claw = blob(V(s2 * L * 0.2, y + L * 0.02, L * 0.58), V(s2 * L * 0.18, y + L * 0.02, L * 0.78), L * 0.06, L * 0.04);
      add(claw, bodyC);
    }
  } else {
    const r = S.round ? 0.3 : 0.24;
    const abd = blob(V(0, y + L * 0.05, L * 0.02), V(0, y + L * 0.12, -L * 0.5), L * r, L * r * 0.9, { disp: fuzz });
    const sy = abd.attributes.sy.array;
    const sx = abd.attributes.sx.array;
    const lt = abd.attributes.lt.array;
    add(abd, null, 'body', (i, p) => {
      let c = bodyC.clone();
      if (cc.bands) c.lerp(C(cc.bands), smooth01((Math.sin(lt[i] * 20) - 0.5) / 0.2) * 0.8);
      if (cc.cross && (Math.abs(sx[i]) < 0.06 || Math.abs(lt[i] - 0.4) < 0.03) && sy[i] > 0.3) c = C(cc.cross);
      if (cc.mark && sy[i] < -0.6 && Math.abs(sx[i]) < 0.25 && Math.abs(lt[i] - 0.5) < 0.15) c = C(cc.mark);
      return c.multiplyScalar(0.9 + 0.2 * nz(p.x * 200 / L, p.y * 200 / L, p.z * 200 / L));
    });
  }
  // eyes
  for (let e = 0; e < 4; e++) {
    const eg = new THREE.SphereGeometry(L * (e < 2 ? 0.025 : 0.016), 8, 6);
    eg.translate((e % 2 ? 1 : -1) * L * (e < 2 ? 0.035 : 0.075), y + L * 0.1, L * 0.36 - (e < 2 ? 0 : L * 0.02));
    add(eg, '#0a0a0a');
  }
  // 8 legs: up to the knee, down to the tip
  const legNames = [];
  for (let k = 0; k < 4; k++) {
    for (const s2 of [1, -1]) {
      const z0 = L * (0.3 - k * 0.07);
      const dirZ = [0.8, 0.3, -0.25, -0.75][k];
      const hip = V(s2 * L * 0.1, y, z0);
      const knee = V(s2 * legLen * 0.45, y + legLen * (S.scorpion ? 0.2 : 0.42), z0 + dirZ * legLen * 0.35);
      const foot = V(s2 * legLen * 0.8, L * 0.004, z0 + dirZ * legLen * 0.7);
      const ln = `leg${k}${s2 > 0 ? 'L' : 'R'}`;
      rig.add(ln, hip.toArray(), 'body');
      legNames.push(ln);
      const lg = limb([hip, knee, foot], L * 0.03, L * 0.01, 7);
      const lt = lg.attributes.lt.array;
      add(lg, null, ln, (i) => (cc.bands && Math.sin(lt[i] * 20) > 0.5 ? C(cc.bands) : bodyC.clone()));
      if (S.fuzzy) {
        const P = lg.attributes.position;
        for (let i = 0; i < P.count; i++) P.setY(i, P.getY(i) + 0);
      }
    }
  }
  root.add(rig.get('body'));
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(rig.bones);
  root.add(skinnedMesh(mergeAll(geos), mat({ name: 'primary', roughness: S.fuzzy ? 0.95 : 0.35, clearcoat: S.fuzzy ? 0 : 0.6 }), skel, 'body_mesh'));
  const walk = legNames.map((ln, i) => poseTrack(rig.get(ln), 0.5, (t) => [0, 0.3 * Math.sin(TAU * t + (i % 2 ? Math.PI : 0) + Math.floor(i / 2) * Math.PI), 0.15 * Math.max(0, Math.cos(TAU * t + (i % 2 ? Math.PI : 0) + Math.floor(i / 2) * Math.PI))], 16));
  root.userData.clips = [clip('walk', 0.5, walk), clip('idle', 3, [offsetTrack(rig.get('body'), 3, (t) => [0, L * 0.01 * Math.sin(TAU * t), 0])])];
  return root;
}

/* ---------------- crabs & lobsters ---------------- */
function buildCrustacean(name, S, { nz }) {
  const root = new THREE.Group();
  const L = S.L;
  const rig = new Rig();
  const lob = S.lobster;
  const legLen = L * (lob ? 0.3 : 0.55);
  const y = legLen * 0.4 + L * 0.03;
  rig.add('body', [0, y, 0]);
  const cc = S.coat;
  const bodyC = C(S.color ?? cc.body);
  const bellyC = C(cc.belly);
  const geos = [];
  const add = (g, color, bone = 'body', fn) => {
    if (!g.attributes.normal) g.computeVertexNormals();
    if (fn) paint(g, fn);
    else colorAll(g, color);
    applySkin(g, () => [[rig.index(bone), 1]]);
    geos.push(g);
  };
  const shade = (i, p, n) => bellyC.clone().lerp(bodyC, smooth01((n.y + 0.2) / 0.4)).multiplyScalar(0.88 + 0.22 * nz(p.x * 120 / L, p.y * 120 / L, p.z * 120 / L));
  const V = (a, b, c) => new THREE.Vector3(a, b, c);
  if (lob) {
    // carapace + segmented tail + fan
    add(blob(V(0, y, L * 0.05), V(0, y + L * 0.01, L * 0.4), L * 0.09, L * 0.08), null, 'body', shade);
    const tg = blob(V(0, y, L * 0.06), V(0, y - L * (S.shrimp ? 0.1 : 0.02), -L * 0.42), L * 0.08, L * 0.06, { shape: (t) => 1 - 0.4 * t, disp: (t) => -L * 0.006 * Math.abs(Math.sin(t * 6 * Math.PI)) });
    add(tg, null, 'body', shade);
    for (const s2 of [-1, 0, 1]) {
      const fan = new THREE.SphereGeometry(L * 0.06, 10, 6);
      fan.scale(0.6, 0.12, 1);
      fan.translate(s2 * L * 0.05, y - L * (S.shrimp ? 0.1 : 0.02), -L * 0.47);
      add(fan, null, 'body', shade);
    }
    // long antennae
    for (const s2 of [1, -1]) add(limb([V(s2 * L * 0.03, y + L * 0.03, L * 0.42), V(s2 * L * 0.15, y + L * 0.1, L * 0.7), V(s2 * L * 0.3, y + L * 0.05, L * 1.0)], L * 0.008, L * 0.003, 5), bodyC);
  } else {
    // wide carapace
    const cg = loft(spline([V(0, y, -L * 0.32), V(0, y + L * 0.02, 0), V(0, y, L * 0.3)]), (t) => {
      const k = Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.5;
      return { w: L * 0.5 * k + 1e-4, up: L * 0.16 * k + 1e-4, dn: L * 0.08 * k + 1e-4, e: 2.4 };
    }, { n: 30, ring: 30, displace: (t, a) => (Math.abs(Math.sin(a)) > 0.9 && t > 0.45 && t < 0.85 ? L * 0.015 * Math.max(0, Math.sin(t * 60)) : 0) });
    add(cg, null, 'body', shade);
    if (S.shell) {
      // hermit crab: spiral shell on the back
      const sg = spiralShell(L * 0.55, L * 0.4, cc.shell, nz, L);
      sg.translate(0, y + L * 0.18, -L * 0.25);
      add(sg, null, 'body', (i, p) => C(cc.shell).multiplyScalar(0.85 + 0.25 * Math.abs(Math.sin(p.y * 200 / L))));
    }
    // eyestalks
    for (const s2 of [1, -1]) {
      add(limb([V(s2 * L * 0.06, y + L * 0.08, L * 0.25), V(s2 * L * 0.08, y + L * 0.16, L * 0.3)], L * 0.012, L * 0.01, 6), bodyC);
      const e = new THREE.SphereGeometry(L * 0.022, 8, 6);
      e.translate(s2 * L * 0.08, y + L * 0.17, L * 0.31);
      add(e, '#0a0a0a');
    }
  }
  // claws
  for (const s2 of [1, -1]) {
    const big = lob ? 1 : s2 > 0 ? 1.25 : 1;
    const sh = V(s2 * L * (lob ? 0.06 : 0.3), y, L * (lob ? 0.38 : 0.2));
    const elb = sh.clone().add(V(s2 * L * 0.15, L * 0.05, L * 0.18));
    const wr = elb.clone().add(V(-s2 * L * 0.02, L * 0.02, L * 0.18));
    add(limb([sh, elb, wr], L * 0.035 * big, L * 0.03 * big, 8), null, 'body', shade);
    if (!S.shrimp) {
      const claw = blob(wr, wr.clone().add(V(0, 0, L * 0.22 * big)), L * 0.07 * big, L * 0.05 * big, { shape: (t) => Math.sin(Math.PI * Math.min(1, t * 0.85 + 0.1)) ** 0.6 });
      add(claw, null, 'body', shade);
      add(limb([wr.clone().add(V(s2 * L * 0.03, -L * 0.02, L * 0.08)), wr.clone().add(V(s2 * L * 0.05, -L * 0.03, L * 0.26 * big))], L * 0.02 * big, L * 0.008, 6), bodyC);
    }
  }
  const legNames = [];
  for (let k = 0; k < 4; k++) {
    for (const s2 of [1, -1]) {
      const z0 = lob ? L * (0.32 - k * 0.07) : L * (0.12 - k * 0.11);
      const hip = V(s2 * L * (lob ? 0.06 : 0.35), y - L * 0.02, z0);
      const knee = hip.clone().add(V(s2 * legLen * 0.5, legLen * 0.35, (k - 1.5) * legLen * 0.15));
      const foot = V(hip.x + s2 * legLen * 0.85, L * 0.004, z0 + (k - 1.5) * legLen * 0.3);
      const ln = `leg${k}${s2 > 0 ? 'L' : 'R'}`;
      rig.add(ln, hip.toArray(), 'body');
      legNames.push(ln);
      add(limb([hip, knee, foot], L * 0.02, L * 0.008, 6), null, ln, shade);
    }
  }
  root.add(rig.get('body'));
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(rig.bones);
  root.add(skinnedMesh(mergeAll(geos), mat({ name: 'primary', roughness: 0.35, clearcoat: 0.7 }), skel, 'body_mesh'));
  const walk = legNames.map((ln, i) => poseTrack(rig.get(ln), 0.6, (t) => [0.25 * Math.sin(TAU * t + (i % 2 ? Math.PI : 0) + Math.floor(i / 2) * 0.8), 0, 0], 16));
  walk.push(offsetTrack(rig.get('body'), 0.6, (t) => [lob ? 0 : L * 0.08 * Math.sin(TAU * t), 0, lob ? L * 0.04 * Math.sin(TAU * t) : 0], 16));
  root.userData.clips = [clip('walk', 0.6, walk), clip('idle', 3, [offsetTrack(rig.get('body'), 3, (t) => [0, L * 0.01 * Math.sin(TAU * t), 0])])];
  return root;
}

function spiralShell(h, r, color, nz, L) {
  // conical spiral (turritella / whelk): loft along a helix that shrinks toward the apex
  const pts = [];
  for (let k = 0; k <= 50; k++) {
    const t = k / 50;
    const a = t * Math.PI * 2 * 3.2;
    const rad = r * 0.5 * (1 - t * 0.85);
    pts.push(new THREE.Vector3(Math.cos(a) * rad, t * h * 0.8, Math.sin(a) * rad));
  }
  const c = spline(pts);
  const g = loft(c, (t) => ({ w: r * 0.42 * (1 - t * 0.88) + 1e-4, up: r * 0.42 * (1 - t * 0.88) + 1e-4, dn: r * 0.42 * (1 - t * 0.88) + 1e-4, e: 2 }), { n: 120, ring: 14, lateral: 'free' });
  void color;
  void nz;
  void L;
  return g;
}

/* ---------------- octopus, squid ---------------- */
function buildCephalopod(name, S, { nz }) {
  const root = new THREE.Group();
  const L = S.L;
  const rig = new Rig();
  const sq = S.squid;
  const y = sq ? L * 0.25 : L * 0.12;
  rig.add('body', [0, y, 0]);
  const cc = S.coat;
  const bodyC = C(S.color ?? cc.body);
  const bellyC = C(cc.belly);
  const geos = [];
  const shade = (i, p, n) => bellyC.clone().lerp(bodyC, smooth01((n.y + 0.3) / 0.5)).lerp(C('#ffffff'), 0.08 * (nz(p.x * 60 / L, p.y * 60 / L, p.z * 60 / L) > 0.7 ? 1 : 0)).multiplyScalar(0.85 + 0.25 * nz(p.x * 30 / L, p.y * 30 / L, p.z * 30 / L));
  const V = (a, b, c) => new THREE.Vector3(a, b, c);
  // mantle
  const mantle = sq
    ? blob(V(0, y, L * 0.05), V(0, y + L * 0.05, -L * 0.55), L * 0.11, L * 0.11, { shape: (t) => (t < 0.85 ? 1 - t * 0.35 : (1 - t) * 4.3) })
    : blob(V(0, y + L * 0.02, L * 0.05), V(0, y + L * 0.35, -L * 0.22), L * 0.2, L * 0.18, { shape: (t) => Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05)) ** 0.55 });
  paint(mantle, shade);
  applySkin(mantle, () => [[0, 1]]);
  geos.push(mantle);
  if (sq) {
    for (const s2 of [1, -1]) {
      const fin = new THREE.SphereGeometry(L * 0.1, 12, 8);
      fin.scale(1.2, 0.08, 1);
      fin.translate(s2 * L * 0.1, y + L * 0.05, -L * 0.45);
      paint(fin.toNonIndexed ? fin : fin, () => bodyC.clone());
      applySkin(fin, () => [[0, 1]]);
      geos.push(fin);
    }
  }
  // head with eyes
  const hg = blob(V(0, y, L * 0.12), V(0, y, -L * 0.02), L * 0.14, L * 0.12);
  paint(hg, shade);
  applySkin(hg, () => [[0, 1]]);
  geos.push(hg);
  // arms
  const nArms = sq ? 10 : 8;
  const armNames = [];
  for (let k = 0; k < nArms; k++) {
    const a = (k / nArms) * TAU + 0.2;
    const len = L * (sq ? (k >= 8 ? 0.9 : 0.5) : 0.75);
    const pts = [];
    for (let j = 0; j <= 8; j++) {
      const t = j / 8;
      const rr = L * 0.08 + t * len * (sq ? 0.25 : 0.85);
      const curl = sq ? 0 : Math.sin(t * Math.PI * 1.2 + k) * 0.35 * t;
      pts.push(V(Math.cos(a + curl) * rr, Math.max(L * 0.012 + t * 0, y * (1 - t) + L * 0.012 * t + (sq ? 0 : t * t * L * 0.03 * Math.sin(k * 3))), L * 0.1 + Math.sin(a + curl) * rr * (sq ? 0.4 : 1) + (sq ? t * len * 0.9 : 0)));
    }
    const c = spline(pts);
    const r0 = L * (sq ? 0.03 : 0.05);
    const g = loft(c, (t) => ({ w: r0 * (1 - 0.92 * t) + 1e-4, up: r0 * (1 - 0.92 * t) + 1e-4, dn: r0 * (1 - 0.92 * t) + 1e-4, e: 2 }), { n: 30, ring: 10, lateral: 'free' });
    const lt = g.attributes.lt.array;
    const la = g.attributes.la.array;
    paint(g, (i, p, n) => {
      const c2 = shade(i, p, n);
      // suckers along the underside
      if (n.y < -0.2 && Math.sin(lt[i] * 90) > 0.6) c2.lerp(C('#f2d8c8'), 0.7);
      void la;
      return c2;
    });
    const an = `arm${k}`;
    const { names } = chainRig(c, 3, `${an}_`, 'body', rig, 0, 0.75);
    applySkin(g, (i) => chain(lt[i], names.map((n) => rig.index(n)), [0, 0.25, 0.5], 0.08));
    armNames.push(...names);
    geos.push(g);
  }
  root.add(rig.get('body'));
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(rig.bones);
  root.add(skinnedMesh(mergeAll(geos), mat({ name: 'primary', roughness: 0.3, clearcoat: 0.8 }), skel, 'body_mesh'));
  for (const s2 of [1, -1]) {
    const e = buildEye(V(s2 * L * 0.12, y + L * 0.06, L * 0.04), V(s2, 0.3, 0.2).normalize(), L * 0.035, { color: '#e8c84a', pupil: 'bar', lid: cc.body });
    e.position.sub(rig.world.body);
    rig.get('body').add(e);
  }
  if (sq) root.userData.floating = true;
  const wave = armNames.map((n, i) => poseTrack(rig.get(n), 3, (t) => [0.15 * Math.sin(TAU * t + i * 0.7), 0.2 * Math.sin(TAU * t + i), 0], 24));
  root.userData.clips = [clip(sq ? 'swim' : 'crawl', 3, wave), clip('idle', 5, armNames.filter((_, i) => i % 3 === 2).map((n, i) => poseTrack(rig.get(n), 5, (t) => [0.1 * Math.sin(TAU * t + i), 0, 0], 16)))];
  return root;
}

function buildJelly(name, S, { nz }) {
  const root = new THREE.Group();
  const L = S.L;
  const rig = new Rig();
  const y = L * 1.4;
  rig.add('bell', [0, y, 0]);
  const prof = [];
  for (let k = 0; k <= 20; k++) {
    const a = (k / 20) * Math.PI * 0.55;
    prof.push(new THREE.Vector2(Math.sin(a) * L * 0.5 + 1e-4, Math.cos(a) * L * 0.38));
  }
  prof.push(new THREE.Vector2(L * 0.42, -L * 0.02));
  const bell = new THREE.LatheGeometry(prof, 36);
  bell.translate(0, y, 0);
  colorAll(bell, S.color ?? S.coat.body);
  applySkin(bell, () => [[0, 1]]);
  const geos = [bell];
  const tn = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU;
    const pts = [];
    for (let j = 0; j <= 6; j++) pts.push(new THREE.Vector3(Math.cos(a) * L * 0.4 * (1 - j * 0.05), y - j * L * 0.22, Math.sin(a) * L * 0.4 * (1 - j * 0.05) + Math.sin(j + k) * L * 0.03));
    const g = limb(pts, L * 0.008, L * 0.003, 5);
    colorAll(g, S.coat.body);
    const lt = g.attributes.lt.array;
    const { names } = chainRig(spline(pts), 2, `t${k}_`, 'bell', rig, 0, 0.5);
    applySkin(g, (i) => chain(lt[i], names.map((n) => rig.index(n)), [0, 0.5], 0.1));
    tn.push(...names);
    geos.push(g);
  }
  // frilly oral arms
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + 0.4;
    const pts = [0, 1, 2, 3, 4].map((j) => new THREE.Vector3(Math.cos(a) * L * 0.08, y - j * L * 0.18, Math.sin(a) * L * 0.08));
    const g = loft(spline(pts), (t) => ({ w: L * 0.05 * (1 - 0.5 * t), up: L * 0.02, dn: L * 0.02, e: 2 }), { n: 20, ring: 10, lateral: 'free', displace: (t, an) => L * 0.015 * Math.sin(t * 40 + an * 3) });
    colorAll(g, C(S.coat.body).multiplyScalar(0.85));
    applySkin(g, () => [[0, 1]]);
    geos.push(g);
  }
  root.add(rig.get('bell'));
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(rig.bones);
  const m = new THREE.MeshPhysicalMaterial({ name: 'jelly', vertexColors: true, roughness: 0.1, transparent: true, opacity: 0.55, side: THREE.DoubleSide, clearcoat: 1, emissive: C(S.coat.body).multiplyScalar(0.25), depthWrite: false });
  root.add(skinnedMesh(mergeAll(geos), m, skel, 'body_mesh'));
  root.userData.floating = true;
  root.userData.clips = [clip('swim', 2, [offsetTrack(rig.get('bell'), 2, (t) => [0, L * 0.15 * Math.sin(TAU * t), 0]), ...tn.map((n, i) => poseTrack(rig.get(n), 2, (t) => [0.15 * Math.sin(TAU * t - i * 0.3), 0, 0], 16))]), clip('idle', 4, [offsetTrack(rig.get('bell'), 4, (t) => [0, L * 0.05 * Math.sin(TAU * t), 0])])];
  void nz;
  return root;
}

function buildStarfish(name, S, { nz }) {
  const root = new THREE.Group();
  const L = S.L;
  const pts = [];
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * TAU;
    const r = k % 2 ? L * 0.16 : L * 0.5;
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const shape = new THREE.Shape(new THREE.SplineCurve([...pts, pts[0]]).getPoints(60));
  const g = new THREE.ExtrudeGeometry(shape, { depth: L * 0.04, bevelEnabled: true, bevelThickness: L * 0.04, bevelSize: L * 0.06, bevelSegments: 4, curveSegments: 12 });
  g.rotateX(-Math.PI / 2);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i);
    const z = P.getZ(i);
    const r = Math.hypot(x, z);
    const yv = P.getY(i);
    P.setY(i, (yv + L * 0.04) * (1 - 0.6 * (r / (L * 0.5))) + L * 0.012 * Math.max(0, nz(x * 60 / L, 1, z * 60 / L) - 0.5) * 3);
  }
  g.computeVertexNormals();
  paint(g, (i, p) => C(S.color ?? S.coat.body).lerp(C(S.coat.bumps), smooth01((nz(p.x * 50 / L, p.y * 50 / L, p.z * 50 / L) - 0.6) / 0.05)));
  const m = new THREE.Mesh(g, mat({ name: 'primary', roughness: 0.7, clearcoat: 0.2 }));
  m.name = 'body_mesh';
  const holder = new THREE.Group();
  holder.name = 'star';
  holder.add(m);
  root.add(holder);
  root.userData.clips = [clip('idle', 6, [poseTrack(holder, 6, (t) => [0, 0.1 * Math.sin(TAU * t), 0])])];
  return root;
}

function buildSnail(name, S, { nz }) {
  const root = new THREE.Group();
  const L = S.L;
  const rig = new Rig();
  rig.add('body', [0, L * 0.1, 0]);
  const cc = S.coat;
  const geos = [];
  // foot: long slimy body
  const foot = loft(spline([new THREE.Vector3(0, L * 0.06, -L * 0.6), new THREE.Vector3(0, L * 0.09, 0), new THREE.Vector3(0, L * 0.18, L * 0.55)]), (t) => ({ w: L * 0.14 * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1))) + 1e-4, up: L * 0.1 * (0.5 + 0.5 * t) + 1e-4, dn: L * 0.08 + 1e-4, e: 2.2 }), { n: 40, ring: 18 });
  const P = foot.attributes.position;
  for (let i = 0; i < P.count; i++) if (P.getY(i) < 0.002) P.setY(i, 0);
  foot.computeVertexNormals();
  paint(foot, (i, p, n) => C(S.color ?? cc.body).multiplyScalar(0.85 + 0.25 * nz(p.x * 200 / L, p.y * 200 / L, p.z * 200 / L)).lerp(C('#2a2018'), smooth01(-n.y - 0.5) * 0.3));
  applySkin(foot, () => [[0, 1]]);
  geos.push(foot);
  // eye stalks
  for (const s2 of [1, -1]) {
    const st = limb([new THREE.Vector3(s2 * L * 0.05, L * 0.24, L * 0.5), new THREE.Vector3(s2 * L * 0.1, L * 0.45, L * 0.62)], L * 0.018, L * 0.012, 6);
    colorAll(st, cc.body);
    applySkin(st, () => [[0, 1]]);
    geos.push(st);
    const e = new THREE.SphereGeometry(L * 0.025, 8, 6);
    e.translate(s2 * L * 0.1, L * 0.46, L * 0.63);
    colorAll(e, '#1a1410');
    applySkin(e, () => [[0, 1]]);
    geos.push(e);
  }
  // coiled shell (planispiral)
  const pts = [];
  for (let k = 0; k <= 60; k++) {
    const t = k / 60;
    const a = t * Math.PI * 2 * 2.6;
    const rad = L * 0.32 * Math.exp(-t * 1.9);
    pts.push(new THREE.Vector3(L * 0.02 * t, L * 0.45 + Math.sin(a) * rad, -L * 0.1 + Math.cos(a) * rad));
  }
  const c = spline(pts);
  const shell = loft(c, (t) => ({ w: L * 0.16 * Math.exp(-t * 1.8) + 1e-4, up: L * 0.17 * Math.exp(-t * 1.8) + 1e-4, dn: L * 0.17 * Math.exp(-t * 1.8) + 1e-4, e: 2 }), { n: 140, ring: 18, lateral: 'x' });
  const lt = shell.attributes.lt.array;
  paint(shell, (i, p) => C(cc.shell).lerp(C(cc.bands), smooth01((Math.sin(lt[i] * 140) - 0.6) / 0.2) * 0.7).multiplyScalar(0.85 + 0.2 * nz(p.x * 100 / L, p.y * 100 / L, p.z * 100 / L)));
  applySkin(shell, () => [[0, 1]]);
  geos.push(shell);
  root.add(rig.get('body'));
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(rig.bones);
  root.add(skinnedMesh(mergeAll(geos), mat({ name: 'primary', roughness: 0.3, clearcoat: 0.9 }), skel, 'body_mesh'));
  root.userData.clips = [clip('crawl', 4, [offsetTrack(rig.get('body'), 4, (t) => [0, 0, L * 0.05 * Math.sin(TAU * t)])]), clip('idle', 6, [poseTrack(rig.get('body'), 6, (t) => [0, 0.05 * Math.sin(TAU * t), 0])])];
  return root;
}

function buildUrchin(name, S, { nz }) {
  const root = new THREE.Group();
  const L = S.L;
  const g = new THREE.SphereGeometry(L * 0.35, 28, 18, 0, TAU, 0, Math.PI * 0.62);
  g.translate(0, L * 0.1, 0);
  colorAll(g, S.color ?? S.coat.body);
  const holder = new THREE.Group();
  holder.name = 'urchin';
  const m = new THREE.Mesh(g, mat({ name: 'primary', roughness: 0.6 }));
  m.name = 'body_mesh';
  holder.add(m);
  const spineMat = plain(C(S.coat.body).multiplyScalar(0.7));
  const n = 140;
  for (let k = 0; k < n; k++) {
    const yv = 1 - (k / (n - 1)) * 1.3;
    const r = Math.sqrt(Math.max(0, 1 - yv * yv));
    const a = k * 2.399963;
    const dir = new THREE.Vector3(Math.cos(a) * r, Math.max(-0.2, yv), Math.sin(a) * r).normalize();
    if (dir.y < -0.15) continue;
    const len = L * (0.35 + 0.2 * nz(dir.x * 5, dir.y * 5, dir.z * 5));
    const cg = new THREE.ConeGeometry(L * 0.012, len, 4);
    cg.translate(0, len / 2, 0);
    const sm = new THREE.Mesh(cg, spineMat);
    sm.position.copy(dir.clone().multiplyScalar(L * 0.33)).add(new THREE.Vector3(0, L * 0.1, 0));
    sm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    holder.add(sm);
  }
  root.add(holder);
  root.userData.clips = [clip('idle', 8, [poseTrack(holder, 8, (t) => [0, TAU * t * 0.02, 0])])];
  return root;
}

export { hornMaterial, keyed, fbm };
