import * as THREE from 'three';
import * as M from '../core/materials.js';
import { group, cushion, roundedBox, rng, finalize, normalizeOptions, pickVariant } from '../core/utils.js';
import { clip } from '../core/animation.js';
import { smoothKeys } from '../core/loft.js';
import { Rig, limbGeometry, chainWeights, applySkin, merge, shell, skinned, poseTrack, offsetTrack, smooth01, taperTube, weld } from './people/skin.js';
import { buildHead } from './people/head.js';
import { PERSON_VARIANTS, applyTrim } from './people/roles.js';
import { buildProp, buildGuitar } from './people/props.js';
import { buildFootwear } from './people/shoes.js';
import { buildAnimations } from './people/anim.js';

/*
 * People: one continuous skinned body (torso, neck, arms, legs) on a real
 * THREE.Skeleton, clothes as offset shells of that body (they deform with it
 * and never clip), rigid head/hands/shoes on their bones.
 * Facing +Z, origin between the feet, metres.
 */

export const SKIN_TONES = ['#ecc6ad', '#e6b897', '#cf9873', '#a8714f', '#7d4f33', '#553322'];
const HAIR = ['#1b1714', '#3b2a1e', '#6a4a2e', '#a37a4c', '#d2b07a', '#8a3a1c', '#bdbdbd'];
const TOPS = ['#2f4f7f', '#b23a3a', '#2e6b4e', '#e0d6c4', '#3a3a3a', '#7a4f9a', '#d98c2b', '#f2f2f2', '#5d8aa8'];
const BOTTOMS = ['#2b3a55', '#1f1f1f', '#4a4a4a', '#6b5b45', '#3d4f3a', '#8a7d6b'];

export { PERSON_VARIANTS };

const PART = { TORSO: 0, NECK: 1, UARM_L: 2, UARM_R: 3, FARM_L: 4, FARM_R: 5, THIGH_L: 6, THIGH_R: 7, SHIN_L: 8, SHIN_R: 9 };
const isArm = (p) => p >= 2 && p <= 5;
const isUpperArm = (p) => p === 2 || p === 3;
const isForearm = (p) => p === 4 || p === 5;
const isThigh = (p) => p === 6 || p === 7;
const isShin = (p) => p === 8 || p === 9;

function proportions(spec, H) {
  const toddler = spec.age === 'toddler';
  const child = spec.age === 'child' || toddler;
  const elder = spec.age === 'elder';
  const teen = spec.age === 'teen';
  const f = spec.sex === 'f';
  const heads = toddler ? 4.9 : child ? 6.1 : elder ? 7.3 : teen ? 7.1 : 7.5;
  const hh = H / heads;
  const P = { H, hh, child, elder, f };
  P.neckTopY = H - 0.9 * hh;
  P.neckBaseY = H - (child ? 1.17 : 1.22) * hh;
  P.shoulderY = H - (child ? 1.33 : 1.42) * hh;
  P.hipY = H * (child ? 0.475 : 0.515);
  P.ankleY = H * (child ? 0.05 : 0.045);
  P.kneeY = P.ankleY + (P.hipY - P.ankleY) * 0.49;
  P.thighLen = P.hipY - P.kneeY;
  P.shinLen = P.kneeY - P.ankleY;
  P.waistY = P.hipY + (P.shoulderY - P.hipY) * 0.36;
  P.chestY = P.hipY + (P.shoulderY - P.hipY) * 0.66;
  P.crotchY = P.hipY - H * (child ? 0.058 : 0.07);
  P.shoulderX = H * (child ? 0.096 : f ? 0.092 : 0.102);
  P.legX = H * (f ? 0.056 : child ? 0.054 : 0.052);
  P.upperArm = H * (child ? 0.178 : 0.188);
  P.foreArm = H * (child ? 0.142 : 0.15);
  P.armTilt = f ? 0.15 : child ? 0.13 : 0.12;
  const athletic = spec.build === 'athletic' ? 1.12 : 1;
  const heavy = spec.build === 'heavy';
  const slim = spec.build === 'slim' || teen;
  const buildK = heavy ? 1.16 : slim ? 0.9 : 1;
  const limbK = (f ? 0.9 : 1) * (child ? 1.05 : 1) * (toddler ? 1.12 : 1) * athletic * buildK;
  P.armR = (s) => H * limbK * (0.031 - 0.008 * s + 0.004 * Math.sin(Math.PI * Math.min(1, s * 2.2)) * (1 - s));
  P.foreR = (s) => H * limbK * (0.024 + 0.003 * Math.sin(Math.PI * Math.min(1, s * 1.6 + 0.1)) - 0.008 * s);
  const legK = (f ? 1.03 : 1) * (child ? 1.04 : 1) * (toddler ? 1.12 : 1) * (spec.build === 'athletic' ? 1.06 : 1) * (heavy ? 1.12 : slim ? 0.92 : 1);
  P.thighR = (s) => H * legK * (0.05 - 0.019 * s + 0.004 * Math.sin(Math.PI * s)) * (0.86 + 0.14 * smooth01(s / 0.25));
  P.shinR = (s) => H * legK * (0.033 + 0.007 * Math.sin(Math.PI * Math.min(1, s * 1.8 + 0.05)) * (1 - s * 0.6) - 0.013 * s);
  // Torso keyframes: [f along crotch→neckBase, radius (×H), zScale]
  P.torsoKeys = f
    ? [[0, 0.0, 0.75], [0.03, 0.052, 0.76], [0.09, 0.09, 0.76], [0.18, 0.104, 0.74], [0.3, 0.092, 0.7], [0.4, 0.074, 0.68], [0.55, 0.082, 0.66], [0.7, 0.09, 0.66], [0.8, 0.1, 0.6], [0.87, 0.1, 0.58], [0.925, 0.097, 0.57], [0.965, 0.088, 0.58], [0.988, 0.066, 0.68], [1, 0.0, 0.8]]
    : child
      ? [[0, 0.0, 0.75], [0.03, 0.05, 0.76], [0.09, 0.085, 0.76], [0.18, 0.093, 0.74], [0.35, 0.089, 0.72], [0.55, 0.092, 0.68], [0.75, 0.097, 0.64], [0.86, 0.104, 0.56], [0.93, 0.106, 0.52], [0.97, 0.096, 0.53], [0.988, 0.07, 0.64], [1, 0.0, 0.8]]
      : [[0, 0.0, 0.75], [0.03, 0.05, 0.76], [0.09, 0.085, 0.75], [0.18, 0.097, 0.72], [0.34, 0.088, 0.68], [0.52, 0.096 * athletic, 0.64], [0.7, 0.106 * athletic, 0.6], [0.8, 0.114 * athletic, 0.57], [0.87, 0.113 * athletic, 0.56], [0.925, 0.108, 0.57], [0.965, 0.099, 0.58], [0.988, 0.074, 0.68], [1, 0.0, 0.8]];
  if (elder && !f) P.torsoKeys = P.torsoKeys.map(([a, r, z]) => [a, a > 0.25 && a < 0.5 ? r * 1.07 : r, a > 0.25 && a < 0.5 ? z * 1.08 : z]);
  // body build: heavy = fuller belly/chest, slim = narrower
  if (heavy || slim) {
    P.torsoKeys = P.torsoKeys.map(([a, r, z]) => {
      const belly = Math.exp(-(((a - 0.36) / 0.2) ** 2));
      const k = heavy ? 1.06 + 0.16 * belly : 0.93;
      return [a, a > 0.02 && a < 0.97 ? r * k : r, z * (heavy ? 1 + 0.16 * belly : 0.97)];
    });
  }
  P.toddler = toddler;
  return P;
}

/* ------------------------------------------------------------------ */

export function createPerson(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(PERSON_VARIANTS, o.variant, 'person');
  const trim = o.trim ?? null;
  const spec = applyTrim(PERSON_VARIANTS[variant], trim, `${variant}-${trim}`);
  const rand = rng(o.seed ?? (trim ? `${variant}-${trim}` : variant));
  const seeded = o.seed != null;
  const casual = ['man', 'woman', 'boy', 'girl', 'student', 'tourist'].includes(variant);
  if (seeded) {
    spec.skin = rand.int(0, 5);
    spec.hairColor = spec.age === 'elder' ? 6 : rand.int(0, 5);
    if (casual) {
      spec.topColor = rand.pick(TOPS);
      spec.bottomColor = rand.pick(BOTTOMS);
      spec.hair = spec.sex === 'f' ? rand.pick(['long', 'ponytail', 'bun', 'bob', 'curly']) : rand.pick(['short', 'buzz', 'curly', 'short']);
    }
  }
  const H = (o.height ?? spec.H) * (seeded && !o.height ? rand.range(0.96, 1.04) : 1);
  const P = proportions(spec, H);
  const detail = o.detail === 'low' ? 'low' : 'high';
  const LOW = detail === 'low';
  // tessellation: 'high' ≈ 30–40k triangles per person, 'low' ≈ 5–8k (crowds)
  const openFront = ['suit', 'blazer', 'cardigan'].includes(spec.top) || spec.vest || spec.labcoat;
  const RES = LOW ? { tRings: 16, tRad: 14, lRings: 6, lRad: 7, neck: 4 } : { tRings: openFront ? 56 : 46, tRad: openFront ? 72 : 56, lRings: 16, lRad: 14, neck: 8 };

  const skinColor = o.skinTone != null ? (typeof o.skinTone === 'number' ? SKIN_TONES[THREE.MathUtils.clamp(o.skinTone | 0, 0, 5)] : o.skinTone) : SKIN_TONES[spec.skin];
  const hairColor = o.hairColor ?? (typeof spec.hairColor === 'number' ? HAIR[spec.hairColor] : spec.hairColor);
  const hairStyle = o.hairStyle ?? spec.hair;
  const topColor = o.shirtColor ?? spec.topColor;
  const bottomColor = o.pantsColor ?? spec.bottomColor;

  const skinMat = M.skin(skinColor);
  skinMat.name = 'skin';
  // warmer, less plastic skin: soft sheen (light scattering), slight oily clearcoat
  Object.assign(skinMat, { roughness: 0.52, sheen: 0.7, sheenRoughness: 0.45, clearcoat: 0.08, clearcoatRoughness: 0.55 });
  skinMat.sheenColor = new THREE.Color(skinColor).lerp(new THREE.Color('#ff9a7a'), 0.55);
  const topMat = cloth(topColor, spec.top === 'suit' || spec.top === 'blazer' ? 'wool' : 'cotton');
  topMat.name = 'primary';
  const bottomMat = cloth(bottomColor, spec.bottom === 'jeans' ? 'denim' : 'cotton');
  bottomMat.name = 'secondary';
  const hairMat = new THREE.MeshPhysicalMaterial({ name: 'hair', color: M.toColor(hairColor), roughness: 0.55, sheen: 1, sheenColor: M.toColor(hairColor).lerp(new THREE.Color('#ffffff'), 0.25), sheenRoughness: 0.35 });

  const root = group(`person-${variant}`);

  // ---------------- skeleton ----------------
  const rig = new Rig();
  const u = (side) => new THREE.Vector3(side * Math.sin(P.armTilt), -Math.cos(P.armTilt), 0);
  rig.add('hips', [0, P.hipY, 0]);
  rig.add('spine', [0, P.waistY, 0], 'hips');
  rig.add('chest', [0, P.chestY, 0], 'spine');
  rig.add('neck', [0, P.neckBaseY, -0.004 * H], 'chest');
  rig.add('head', [0, P.neckTopY, 0], 'neck');
  for (const [sfx, s] of [['L', 1], ['R', -1]]) {
    const sh = new THREE.Vector3(s * P.shoulderX, P.shoulderY, 0);
    const el = sh.clone().addScaledVector(u(s), P.upperArm);
    const wr = el.clone().addScaledVector(u(s), P.foreArm);
    rig.add(`upperArm_${sfx}`, sh.toArray(), 'chest');
    rig.add(`lowerArm_${sfx}`, el.toArray(), `upperArm_${sfx}`);
    rig.add(`hand_${sfx}`, wr.toArray(), `lowerArm_${sfx}`);
    rig.add(`upperLeg_${sfx}`, [s * P.legX, P.hipY, 0], 'hips');
    // thighs angle in toward the knees (no bow legs); feet under the knees, pointing forward
    rig.add(`lowerLeg_${sfx}`, [s * P.legX * 0.8, P.kneeY, 0], `upperLeg_${sfx}`);
    rig.add(`foot_${sfx}`, [s * P.legX * 0.86, P.ankleY, 0], `lowerLeg_${sfx}`);
    rig.add(`toes_${sfx}`, [s * P.legX * 0.86, 0.012 * H, 0.072 * H], `foot_${sfx}`); // ball of the foot
  }
  root.add(rig.get('hips'));
  const B = (n) => rig.index(n);

  // ---------------- body pieces ----------------
  const pieces = [];
  // Torso
  const tKeysR = smoothKeys(P.torsoKeys.map(([a, r]) => [a, r]));
  const tKeysZ = smoothKeys(P.torsoKeys.map(([a, , z]) => [a, z]));
  const torsoLen = P.neckBaseY - P.crotchY;
  const torsoR = (y) => tKeysR((y - P.crotchY) / torsoLen) * H;
  const torsoZ = (y) => tKeysZ((y - P.crotchY) / torsoLen);
  P.torsoR = torsoR;
  P.torsoZ = torsoZ;
  {
    const pts = [];
    const N = RES.tRings;
    for (let i = 0; i <= N; i++) {
      const a = i / N;
      const a2 = a < 0.05 ? (a / 0.05) ** 1.5 * 0.05 : a; // denser at the crotch
      pts.push(new THREE.Vector2(Math.max(1e-4, tKeysR(a2) * H), P.crotchY + a2 * torsoLen));
    }
    let g = new THREE.LatheGeometry(pts, RES.tRad, Math.PI);
    let pos = g.attributes.position;
    const bustY = P.hipY + (P.shoulderY - P.hipY) * 0.68;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      let z = pos.getZ(i) * torsoZ(y);
      if (P.f && !P.child) {
        // bust: two soft bumps on the front
        for (const s of [1, -1]) {
          const dx = (x - s * 0.048 * H) / (0.045 * H);
          const dy = (y - bustY) / (0.05 * H);
          const k = Math.exp(-(dx * dx + dy * dy) * 1.4);
          if (z > 0) z += k * 0.038 * H;
        }
      }
      // glutes
      if (z < 0) {
        for (const s of [1, -1]) {
          const dx = (x - s * 0.045 * H) / (0.05 * H);
          const dy = (y - (P.hipY - 0.015 * H)) / (0.05 * H);
          z -= Math.exp(-(dx * dx + dy * dy) * 1.2) * (P.f ? 0.028 : 0.018) * H;
        }
      }
      pos.setZ(i, z);
      // trapezius slope: the top of the torso drops from the neck down to the shoulder joints
      const yS = P.shoulderY + 0.006 * H;
      if (y > yS) {
        const t = smooth01((Math.abs(x) - 0.045 * H) / (0.07 * H));
        pos.setY(i, yS + (y - yS) * (1 - 0.55 * t));
      }
    }
    g = weld(g);
    pos = g.attributes.position;
    const shL = rig.world.upperArm_L;
    const shR = rig.world.upperArm_R;
    const hipL = rig.world.upperLeg_L;
    const hipR = rig.world.upperLeg_R;
    applySkin(g, PART.TORSO, (i, v) => {
      const ws = chainWeights(v.y, [B('hips'), B('spine'), B('chest'), B('neck')], [P.waistY, P.chestY, P.neckBaseY + 0.01 * H], 0.05 * H);
      // let shoulder and hip regions follow the limbs a little (no creases when arms/legs move)
      const add = (bone, d, radius, k) => {
        const w = k * smooth01(1 - d / radius);
        if (w > 0) {
          for (const e of ws) e[1] *= 1 - w;
          ws.push([bone, w]);
        }
      };
      if (v.x > 0.06 * H) add(B('upperArm_L'), v.distanceTo(shL), 0.075 * H, 0.45);
      if (v.x < -0.06 * H) add(B('upperArm_R'), v.distanceTo(shR), 0.075 * H, 0.45);
      if (v.y < P.hipY + 0.02 * H) {
        if (v.x > 0.01 * H) add(B('upperLeg_L'), v.distanceTo(hipL), 0.09 * H, 0.35);
        if (v.x < -0.01 * H) add(B('upperLeg_R'), v.distanceTo(hipR), 0.09 * H, 0.35);
      }
      return ws;
    });
    g.attributes.sf.array.forEach((_, i, arr) => (arr[i] = (g.attributes.position.getY(i) - P.crotchY) / torsoLen));
    pieces.push(g);
  }
  // Neck
  {
    const len = P.neckTopY - P.neckBaseY + 0.06 * H;
    const g = limbGeometry(len, (s) => H * (0.032 + 0.008 * smooth01((s - 0.6) / 0.4)) * (P.f ? 0.9 : 1), { capTop: 0.6, capBottom: 0.6, zScale: 1.08, rings: RES.neck, radial: RES.lRad });
    g.translate(0, P.neckTopY + 0.025 * H, -0.006 * H);
    applySkin(g, PART.NECK, (i, v) => chainWeights(v.y, [B('chest'), B('neck'), B('head')], [P.neckBaseY, P.neckTopY - 0.005 * H], 0.018 * H));
    pieces.push(g);
  }
  // Arms and legs: ONE continuous lathe each (no seams at elbows/knees);
  // part/sf attributes still say which segment a vertex belongs to.
  const limb = (len1, len2, r1, r2, opts) => {
    const len = len1 + len2;
    const k = len1 / len;
    return limbGeometry(len, (sf) => {
      // blend the two radius profiles smoothly across the joint
      const j = smooth01((sf - k + 0.05) / 0.1);
      return r1(Math.min(1, sf / k)) * (1 - j) + r2(Math.max(0, (sf - k) / (1 - k))) * j;
    }, { rings: RES.lRings, radial: RES.lRad, ...opts });
  };
  const setParts = (g, len1, len2, partA, partB) => {
    const sf = g.attributes.sf.array;
    const pa = g.attributes.part.array;
    const len = len1 + len2;
    for (let i = 0; i < sf.length; i++) {
      const s = sf[i] * len;
      if (s < len1) { pa[i] = partA; sf[i] = s / len1; } else { pa[i] = partB; sf[i] = (s - len1) / len2; }
    }
  };
  for (const [sfx, s, pu, pf] of [['L', 1, PART.UARM_L, PART.FARM_L], ['R', -1, PART.UARM_R, PART.FARM_R]]) {
    const g = limb(P.upperArm, P.foreArm, P.armR, P.foreR, { capTop: 0.6, capBottom: 0.7 });
    const sfRaw = Float32Array.from(g.attributes.sf.array);
    g.rotateZ(s * P.armTilt);
    g.translate(...rig.world[`upperArm_${sfx}`].toArray());
    const len = P.upperArm + P.foreArm;
    applySkin(g, pu, (i) => chainWeights(sfRaw[i] * len, [B('chest'), B(`upperArm_${sfx}`), B(`lowerArm_${sfx}`), B(`hand_${sfx}`)], [0, P.upperArm, len], [0.028 * H, 0.03 * H, 0.012 * H]));
    g.setAttribute('sf', new THREE.BufferAttribute(sfRaw, 1));
    setParts(g, P.upperArm, P.foreArm, pu, pf);
    pieces.push(g);
  }
  for (const [sfx, s, pt, ps] of [['L', 1, PART.THIGH_L, PART.SHIN_L], ['R', -1, PART.THIGH_R, PART.SHIN_R]]) {
    const g = limb(P.thighLen, P.shinLen, P.thighR, P.shinR, { capTop: 0.35, capBottom: 0.8, zScale: 1.06 });
    const sfRaw = Float32Array.from(g.attributes.sf.array);
    g.translate(...rig.world[`upperLeg_${sfx}`].toArray());
    {
      const lp = g.attributes.position;
      for (let i = 0; i < lp.count; i++) {
        const d = P.hipY - lp.getY(i);
        const k = d < P.thighLen ? -0.2 * Math.max(0, d) / P.thighLen : -0.2 + 0.06 * Math.min(1, (d - P.thighLen) / P.shinLen);
        lp.setX(i, lp.getX(i) + s * P.legX * k);
      }
      g.computeVertexNormals();
    }
    const len = P.thighLen + P.shinLen;
    applySkin(g, pt, (i) => chainWeights(sfRaw[i] * len, [B('hips'), B(`upperLeg_${sfx}`), B(`lowerLeg_${sfx}`), B(`foot_${sfx}`)], [0, P.thighLen, len], [0.03 * H, 0.035 * H, 0.012 * H]));
    g.setAttribute('sf', new THREE.BufferAttribute(sfRaw, 1));
    setParts(g, P.thighLen, P.shinLen, pt, ps);
    pieces.push(g);
  }
  const bodyGeo = merge(pieces);
  const partOf = (i) => bodyGeo.attributes.part.array[i];
  const sfOf = (i) => bodyGeo.attributes.sf.array[i];

  // ---------------- clothes (shells) ----------------
  const skinnedParts = [];
  // body vertices hidden under opaque clothing (offset ≥ 3 mm); triangles fully covered are
  // dropped from the body mesh at the end (clothes deform with the same weights, so it's safe)
  const covered = new Uint8Array(bodyGeo.attributes.position.count);
  const _p = new THREE.Vector3();
  const _n = new THREE.Vector3();
  const addShell = (pred, offset, mat, name) => {
    const g = shell(bodyGeo, (i, p, n) => pred(i, p, n, partOf(i), sfOf(i)), offset);
    if (g.index.count) skinnedParts.push([g, mat, name]);
    if (!mat.transparent && g.index.count) {
      const bp = bodyGeo.attributes.position;
      const bn = bodyGeo.attributes.normal;
      for (let i = 0; i < bp.count; i++) {
        if (covered[i]) continue;
        _p.fromBufferAttribute(bp, i);
        _n.fromBufferAttribute(bn, i);
        if (!pred(i, _p, _n, partOf(i), sfOf(i))) continue;
        const d = typeof offset === 'function' ? offset(i, _p, _n) : offset;
        if (d >= 0.003) covered[i] = 1;
      }
    }
    return g;
  };
  const fitted = spec.fitted || P.f;
  const top = spec.top;
  const bottom = spec.bottom;
  const tucked = ['shirt', 'suit', 'blazer', 'uniform', 'fire', 'chef'].includes(top) || bottom === 'skirt' || bottom === 'pencil';
  const vWidth = (y, deep = 0) => H * 0.052 * smooth01((y - (P.chestY - deep * H)) / (P.neckBaseY - P.chestY + deep * H));
  // Open fronts: instead of cutting triangles (stair-steps), sink the garment under the
  // shirt inside the opening so the visible edge is a smooth surface intersection.
  // d > 0 inside the garment region (metres); outside it sinks under `under`.
  const soft = (d, outer, _under, w = 0.03 * H) => -0.02 + (outer + 0.02) * smooth01(d / w + 0.5); // hidden parts sink inside the body → steep, clean edges
  // hems: instead of cutting triangles (sawtooth), the garment sinks under the layer below past the hem line
  const hemSoft = (p, off, hemY) => -0.02 + (off + 0.02) * smooth01((p.y - hemY) / (0.014 * H) + 0.5);
  const softEdge = (p, deep, outer, minW = 0) => {
    if (p.z <= 0) return outer;
    const w = Math.max(minW, vWidth(p.y, deep));
    if (w <= 0) return outer;
    return -0.02 + (outer + 0.02) * smooth01((Math.abs(p.x) - w) / (0.03 * H) + 0.5);
  };

  // Bottoms
  const legEnd = 0.965;
  const suitK = top === 'spacesuit' ? 0.026 : 0; // spacesuits are bulky
  if (bottom === 'jeans' || bottom === 'trousers' || bottom === 'leggings') {
    const tight = bottom === 'leggings';
    addShell((i, p, n, part, sf) => (part === PART.TORSO && p.y < P.waistY + 0.016 * H) || isThigh(part) || (isShin(part) && sf < legEnd), (i, p, n) => (tight ? 0.004 : 0.008 + suitK) + (!tight && isShin(partOf(i)) ? 0.006 * smooth01((sfOf(i) - 0.5) / 0.5) : 0), bottomMat, 'pants');
    if (bottom === 'jeans') {
      const stitch = cloth('#b8862b', 'cotton');
      addShell((i, p, n, part, sf) => (isThigh(part) || (isShin(part) && sf < legEnd)) && Math.abs(Math.atan2(p.x - Math.sign(p.x) * P.legX * (1 + (P.hipY - p.y < P.thighLen ? -0.2 * Math.max(0, P.hipY - p.y) / P.thighLen : -0.2 + 0.06 * Math.min(1, (P.hipY - p.y - P.thighLen) / P.shinLen))), p.z) - Math.sign(p.x) * Math.PI / 2) < 0.05, 0.0095, stitch, 'seam');
    }
  } else if (bottom === 'shorts') {
    addShell((i, p, n, part, sf) => (part === PART.TORSO && p.y < P.waistY + 0.016 * H) || (isThigh(part) && sf < 0.55), (i) => 0.008 + (isThigh(partOf(i)) ? 0.014 * smooth01(sfOf(i) / 0.5) : 0), bottomMat, 'shorts');
  } else if (bottom === 'trunks') {
    addShell((i, p, n, part, sf) => (part === PART.TORSO && p.y < P.hipY + 0.02 * H) || (isThigh(part) && sf < (top === 'swim' ? 0.06 : 0.3)), (i) => 0.004 + (isThigh(partOf(i)) ? 0.002 : 0), bottomMat, 'trunks');
  } else if (bottom === 'skirt' || bottom === 'dress' || bottom === 'pencil') {
    addShell((i, p, n, part) => part === PART.TORSO && p.y < P.waistY + 0.016 * H, 0.008, bottomMat, 'waist');
    // lining on the thighs down to the hem: hidden inside the skirt when standing, it keeps skin from
    // showing through the hip / lap when the skirt is posed (sitting, kneeling)
    const hemY = bottom === 'pencil' ? P.kneeY + 0.005 * H : bottom === 'dress' ? P.kneeY - 0.06 * H : P.kneeY + 0.05 * H;
    const sfMax = Math.min(0.97, (P.hipY - hemY) / P.thighLen);
    addShell((i, p, n, part, sf) => isThigh(part) && sf < sfMax, 0.006, bottomMat, 'lining');
  }
  // Tops
  const sleeve = { tshirt: 0.42, polo: 0.4, jersey: 0.45, tank: -1, swim: -1, longsleeve: 2, shirt: 2, hoodie: 2, suit: 2, blazer: 2, cardigan: 2, uniform: 2, chef: 2, fire: 2, spacesuit: 2 }[top] ?? 0.42;
  const isJacket = ['suit', 'blazer', 'cardigan'].includes(top);
  const shirtMat = isJacket ? cloth(spec.under ?? '#f4f4f4', 'cotton') : topMat;
  const coveredTop = isJacket || spec.labcoat || ['rain', 'overcoat', 'robe', 'puffer'].includes(spec.coat); // only the V / cuffs show
  const shirtOff = top === 'swim' ? 0.004 : top === 'jersey' ? 0.005 : top === 'spacesuit' ? 0.03 : tucked ? 0.006 : 0.012;
  const shirtLow = tucked ? P.waistY - 0.035 * H : P.hipY - 0.01 * H;
  const armHole = (p) => Math.abs(p.x) > 0.78 * P.torsoR(p.y) && p.y > P.shoulderY - 0.075 * H;
  // signed distance to the arm-hole boundary (positive = inside the garment)
  const armDist = (p) => Math.max(0.78 * P.torsoR(p.y) - Math.abs(p.x), (P.shoulderY - 0.075 * H) - p.y);
  const under = shirtOff - 0.003;
  if (top === 'swim') {
    // one-piece swimsuit: torso only, scooped neck and high-cut legs
    const swimD = (p) => Math.min(armDist(p), (p.z > 0 ? P.chestY + 0.035 * H : P.chestY) - p.y);
    addShell((i, p, n, part) => part === PART.TORSO && p.y > P.crotchY - 0.01 * H && p.y < P.neckBaseY, (i, p) => soft(swimD(p), 0.004, 0, 0.02 * H), topMat, 'swimsuit');
  } else if (top !== 'none') {
    const shirtSleeve = isJacket ? 2 : sleeve;
    addShell((i, p, n, part, sf) => {
      // under a jacket only the V of the shirt (and the cuffs) can be seen
      // crew neckline: the shirt covers the whole shoulder top; at the neck its edge sinks under the skin (offset below) so no triangles are dropped and no bare band shows
      if (part === PART.TORSO) return p.y > shirtLow - 0.03 * H && (!coveredTop || (p.z > 0 && Math.abs(p.x) < vWidth(p.y, 0.07) + 0.04 * H && p.y > P.chestY - 0.12 * H));
      if (isUpperArm(part)) return shirtSleeve > 0 && sf < shirtSleeve && !coveredTop;
      if (isForearm(part)) return shirtSleeve > 1 && sf < (isJacket ? 0.97 : 0.95) && (!coveredTop || sf > 0.75);
      return false;
    }, (i, p) => ((partOf(i) === PART.TORSO ? Math.min(top === 'tank' ? soft(armDist(p), shirtOff, -0.004) : shirtOff, hemSoft(p, shirtOff, shirtLow)) : (isUpperArm(partOf(i)) ? THREE.MathUtils.lerp(shirtOff, 0.007, smooth01(sfOf(i) / 0.35)) : 0.007) + suitK) + (top === 'tank' ? 0 : 0.01 * smooth01((p.y - (P.shoulderY - 0.05 * H)) / (0.035 * H)))) - (partOf(i) === PART.TORSO && top !== 'tank' ? 0.03 * (1 - smooth01((Math.hypot(p.x, (p.z + 0.006 * H) / 1.08) - 0.036 * H) / (0.012 * H))) * smooth01((p.y - (P.neckBaseY - 0.03 * H)) / (0.02 * H)) : 0), shirtMat, 'shirt'); // sleeve blends into the body panel (set-in sleeve, no pad)
    if (['shirt', 'suit', 'blazer', 'uniform', 'chef', 'fire', 'cardigan', 'polo', 'spacesuit'].includes(top)) {
      addShell((i, p, n, part) => part === PART.NECK && p.y < P.neckBaseY + 0.014 * H, (i, p) => 0.004 + 0.007 * smooth01((P.neckBaseY + 0.012 * H - p.y) / (0.006 * H)), top === 'cardigan' ? shirtMat : top === 'chef' ? topMat : shirtMat, 'collar');
    }
  }
  if (isJacket) {
    const deep = top === 'cardigan' ? 0.07 : 0.02;
    addShell((i, p, n, part, sf) => {
      if (part === PART.TORSO) return p.y > P.hipY - 0.07 * H && sf < 0.99;
      if (isUpperArm(part)) return true;
      if (isForearm(part)) return sf < 0.93;
      return false;
    }, (i, p) => (partOf(i) === PART.TORSO ? Math.min(softEdge(p, deep, 0.017), hemSoft(p, 0.017, P.hipY - 0.035 * H)) : 0.015), topMat, 'jacket');
  }
  if ((spec.tie || o.tieColor) && (isJacket || ['shirt', 'uniform'].includes(top))) {
      const tieMat = cloth(o.tieColor ?? spec.tie, 'silk');
      const tieW = (y) => H * (0.007 + 0.011 * smooth01((P.neckBaseY - y) / (0.09 * H)));
      addShell((i, p, n, part) => part === PART.TORSO && p.z > 0 && p.y > P.waistY - 0.02 * H && p.y < P.neckBaseY - 0.002 * H && Math.abs(p.x) < tieW(p.y) + 0.012 * H,
        (i, p) => -0.02 + 0.0305 * smooth01((tieW(p.y) - Math.abs(p.x)) / (0.012 * H) + 0.5) * smooth01((p.y - P.waistY + 0.012 * H) / (0.01 * H)), tieMat, 'tie');
    }
  if (top === 'hoodie') {
    addShell((i, p, n, part) => (part === PART.NECK && p.z < 0.004 * H && p.y < P.neckTopY - 0.01 * H) || (part === PART.TORSO && p.z < 0 && p.y > P.shoulderY - 0.09 * H), (i, p) => {
      const outer = 0.02 + 0.02 * smooth01((p.y - P.shoulderY + 0.05 * H) / (0.07 * H));
      if (partOf(i) === PART.NECK) return outer;
      return soft(Math.min(0.085 * H - Math.abs(p.x), p.y - (P.shoulderY - 0.05 * H)), outer, 0.01, 0.02 * H);
    }, topMat, 'hood');
    addShell((i, p, n, part) => part === PART.TORSO && p.z > 0 && Math.abs(p.x) < 0.075 * H && p.y > P.hipY - 0.01 * H && p.y < P.waistY + 0.055 * H,
      (i, p) => soft(Math.min(0.055 * H - Math.abs(p.x), p.y - (P.hipY + 0.005 * H), P.waistY + 0.035 * H - p.y), 0.017, 0.01), topMat, 'pocket');
  }
  if (spec.vest) {
    const neon = new THREE.MeshPhysicalMaterial({ name: 'vest', color: '#d7ff1f', roughness: 0.55, emissive: '#d7ff1f', emissiveIntensity: 0.08, sheen: 0.4 });
    const silver = new THREE.MeshStandardMaterial({ name: 'reflective', color: '#d9dde0', metalness: 0.6, roughness: 0.25 });
    const vestD = (p) => {
      let d = Math.min(p.y - (P.waistY - 0.04 * H), P.neckBaseY - 0.012 * H - p.y, armDist(p));
      const vw = vWidth(p.y, 0.03) * 0.8;
      if (p.z > 0 && vw > 0) d = Math.min(d, Math.abs(p.x) - vw);
      return d;
    };
    const vestPred = (i, p, n, part) => part === PART.TORSO && p.y > P.waistY - 0.07 * H;
    addShell(vestPred, (i, p) => soft(vestD(p), 0.014, under), neon, 'vest');
    for (const yb of [P.waistY + 0.005 * H, P.chestY + 0.01 * H]) addShell((i, p, n, part) => vestPred(i, p, n, part) && Math.abs(p.y - yb) < 0.03 * H, (i, p) => soft(Math.min(vestD(p), 0.012 * H - Math.abs(p.y - yb)), 0.0155, 0, 0.012 * H), silver, 'vest-band');
  }
  if (spec.bands) {
    const yel = new THREE.MeshStandardMaterial({ name: 'reflective', color: '#e8ff3a', metalness: 0.3, roughness: 0.3, emissive: '#c8e000', emissiveIntensity: 0.1 });
    addShell((i, p, n, part, sf) => (part === PART.TORSO && (Math.abs(p.y - P.waistY) < 0.012 * H || Math.abs(p.y - P.chestY) < 0.012 * H) && p.y > shirtLow) || (isForearm(part) && Math.abs(sf - 0.7) < 0.07) || (isShin(part) && Math.abs(sf - 0.55) < 0.06), (i) => (partOf(i) === PART.TORSO ? shirtOff + 0.0015 : isShin(partOf(i)) ? 0.0155 : 0.0085), yel, 'bands');
  }
  if (spec.belt) {
    addShell((i, p, n, part) => part === PART.TORSO && Math.abs(p.y - (P.waistY - 0.002 * H)) < 0.011 * H, 0.012, new THREE.MeshPhysicalMaterial({ name: 'leather', color: '#111', roughness: 0.4, clearcoat: 0.5 }), 'belt');
  }
  if (spec.backpack) {
    const strapMat = cloth('#222222', 'nylon');
    addShell((i, p, n, part) => part === PART.TORSO && p.y > P.chestY - 0.09 * H && p.y < P.neckBaseY && Math.abs(Math.abs(p.x) - 0.06 * H) < 0.03 * H,
      (i, p) => soft(Math.min(0.011 * H - Math.abs(Math.abs(p.x) - 0.06 * H), p.y - (P.chestY - 0.06 * H), P.neckBaseY - 0.01 * H - p.y), 0.021, 0, 0.014 * H), strapMat, 'straps');
  }
  if (top === 'chef' && spec.apron) {
    addShell((i, p, n, part) => part === PART.TORSO && p.z > 0.25 * P.torsoR(p.y) * P.torsoZ(p.y) && p.y < P.chestY + 0.02 * H && p.y > P.crotchY, 0.02, cloth('#ffffff', 'cotton'), 'apron');
  }
  // Flared garments (skirt, dress, lab coat, apron front)
  const flare = (topY, hemY, topExtra, hemExtra, mat, name, { phiStart = 0, phiLength = Math.PI * 2, zScaleHem = 0.82 } = {}) => {
    const rings = LOW ? 8 : 18;
    const pts = [];
    let running = 0;
    for (let k = 0; k <= rings; k++) {
      const f = k / rings;
      const y = topY + (hemY - topY) * f;
      const hipExtent = Math.max(P.torsoR(Math.min(y, P.hipY)), P.legX + P.thighR(THREE.MathUtils.clamp((P.hipY - y) / P.thighLen, 0, 1)));
      running = Math.max(running, y > P.hipY ? P.torsoR(y) : hipExtent);
      pts.push(new THREE.Vector2(running + topExtra + (hemExtra - topExtra) * smooth01(f) , y));
    }
    pts.reverse();
    const g = new THREE.LatheGeometry(pts, LOW ? 16 : 40, phiStart, phiLength);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const f = (topY - y) / (topY - hemY);
      const zs = y > P.crotchY ? P.torsoZ(y) * 1.02 : 0;
      pos.setZ(i, pos.getZ(i) * (y > P.crotchY ? THREE.MathUtils.lerp(zs, zScaleHem, smooth01(f * 1.5)) : zScaleHem));
    }
    g.computeVertexNormals();
    applySkin(g, -1, (i, v) => {
      const f = THREE.MathUtils.clamp((topY - v.y) / (topY - hemY), 0, 1);
      // follow the thighs early so the skirt becomes a lap when sitting (legs never poke through)
      const legW = (v.y > P.hipY ? 0 : 0.97 * smooth01((P.hipY - v.y) / (0.45 * P.thighLen))) * smooth01(f * 4);
      const side = THREE.MathUtils.clamp(0.5 + v.x / (0.16 * H), 0, 1);
      // below the knee the fabric hangs with the shins (drapes down over them when sitting)
      const shin = legW * smooth01((P.kneeY + 0.02 * H - v.y) / (0.1 * H));
      const thigh = legW - shin;
      return [[B('hips'), 1 - legW], [B('upperLeg_L'), thigh * side], [B('upperLeg_R'), thigh * (1 - side)], [B('lowerLeg_L'), shin * side], [B('lowerLeg_R'), shin * (1 - side)]];
    });
    skinnedParts.push([g, mat, name, true]);
  };
  const waistTop = P.waistY - 0.005 * H;
  if (bottom === 'skirt') flare(waistTop, P.kneeY + 0.05 * H, 0.01, 0.026 * H, bottomMat, 'skirt', { zScaleHem: 0.72 });
  if (bottom === 'pencil') flare(waistTop, P.kneeY + 0.005 * H, 0.008, 0.012 * H, bottomMat, 'skirt', { zScaleHem: 0.8 });
  if (bottom === 'dress') {
    addShell((i, p, n, part, sf) => part === PART.TORSO && p.y > P.waistY - 0.02 * H && sf < 0.988, 0.006, bottomMat, 'bodice');
    flare(waistTop, P.kneeY - 0.06 * H, 0.012, 0.028 * H, bottomMat, 'dress', { zScaleHem: 0.72 });
  }
  // Long coats: lab coat, raincoat, overcoat, judge's robe (open V front, flared skirt)
  const longCoat = spec.labcoat ? 'lab' : ['rain', 'overcoat', 'robe'].includes(spec.coat) ? spec.coat : null;
  if (longCoat) {
    const color = longCoat === 'lab' ? '#f7f9fa' : spec.coatColor ?? '#3a3a3a';
    const coat = longCoat === 'rain' ? new THREE.MeshPhysicalMaterial({ name: 'coat', color: M.toColor(color), roughness: 0.35, clearcoat: 0.6 }) : cloth(color, longCoat === 'overcoat' ? 'wool' : 'cotton');
    const off = longCoat === 'lab' ? 0.016 : 0.022;
    addShell((i, p, n, part, sf) => {
      if (part === PART.TORSO) return p.y > P.hipY - 0.055 * H && sf < 0.99;
      if (isUpperArm(part)) return true;
      if (isForearm(part)) return sf < (longCoat === 'robe' ? 0.86 : 0.9);
      return false;
    }, (i, p) => (partOf(i) === PART.TORSO ? Math.min(softEdge(p, longCoat === 'robe' ? 0.0 : 0.04, off + 0.004, 0.012 * H), hemSoft(p, off + 0.004, P.hipY - 0.02 * H)) : off + (longCoat === 'robe' && isForearm(partOf(i)) ? 0.02 * smooth01(sfOf(i)) : 0)), coat, 'coat');
    addShell((i, p, n, part) => part === PART.NECK && p.y < P.neckBaseY + 0.02 * H && p.z < 0.01 * H, off + 0.006, coat, 'coat-collar');
    const hem = longCoat === 'robe' ? P.ankleY + 0.06 * H : longCoat === 'overcoat' ? P.kneeY - 0.05 * H : P.kneeY - 0.02 * H;
    flare(P.hipY + 0.01 * H, hem, off + 0.01, (longCoat === 'robe' ? 0.09 : 0.06) * H, coat, 'coat-skirt', longCoat === 'robe' ? { zScaleHem: 0.9 } : { phiStart: 0.22, phiLength: Math.PI * 2 - 0.44 });
    if (longCoat === 'rain') {
      // hood folded down at the back of the neck
      addShell((i, p, n, part) => (part === PART.NECK && p.z < 0) || (part === PART.TORSO && p.z < 0 && p.y > P.shoulderY - 0.06 * H), (i, p) => soft(Math.min(0.07 * H - Math.abs(p.x), p.y - (P.shoulderY - 0.05 * H)), off + 0.022, 0), coat, 'hood');
    }
  }
  if (spec.coat === 'puffer') {
    // quilted down jacket: thick shell with horizontal baffles, stand-up collar
    const puff = new THREE.MeshPhysicalMaterial({ name: 'coat', color: M.toColor(spec.coatColor ?? '#1f2a44'), roughness: 0.4, sheen: 0.5, clearcoat: 0.25 });
    const baffle = (y) => 0.007 * Math.abs(Math.sin((Math.PI * (y - P.hipY)) / (0.075 * H)));
    addShell((i, p, n, part, sf) => (part === PART.TORSO && p.y > P.hipY - 0.08 * H && sf < 0.99) || isUpperArm(part) || (isForearm(part) && sf < 0.93),
      (i, p) => (partOf(i) === PART.TORSO ? hemSoft(p, 0.028 + baffle(p.y), P.hipY - 0.045 * H) : 0.022 + 0.006 * Math.abs(Math.sin(sfOf(i) * Math.PI * 4))), puff, 'coat');
    addShell((i, p, n, part) => part === PART.NECK && p.y < P.neckBaseY + 0.035 * H, (i, p) => 0.03 * smooth01((P.neckBaseY + 0.034 * H - p.y) / (0.008 * H)), puff, 'coat-collar');
    const zip = new THREE.MeshStandardMaterial({ color: '#202020', metalness: 0.6, roughness: 0.3 });
    addShell((i, p, n, part) => part === PART.TORSO && p.z > 0 && Math.abs(p.x) < 0.01 * H && p.y > P.hipY - 0.04 * H && p.y < P.neckBaseY, (i, p) => soft(0.0035 * H - Math.abs(p.x), 0.0365 + baffle(p.y), 0, 0.004 * H), zip, 'zip');
  }
  // Aprons (chef has his own white one above)
  if (spec.apron && top !== 'chef') {
    const apronMat = cloth(spec.apronColor ?? '#f4f4f4', 'cotton');
    const waistOnly = variant === 'waiter';
    const apronTop = waistOnly ? P.waistY - 0.02 * H : P.chestY + 0.035 * H;
    addShell((i, p, n, part) => part === PART.TORSO && p.z > 0 && p.y < apronTop + 0.02 * H && p.y > P.crotchY,
      (i, p) => soft(Math.min(0.085 * H - Math.abs(p.x), apronTop - p.y, p.z - 0.2 * P.torsoR(p.y) * P.torsoZ(p.y)), shirtOff + 0.009, 0, 0.012 * H), apronMat, 'apron');
    flare(P.hipY + 0.005 * H, waistOnly ? P.ankleY + 0.15 * H : P.kneeY - 0.03 * H, 0.03, 0.05 * H, apronMat, 'apron-skirt', { phiStart: -0.95, phiLength: 1.9 });
  }
  // Overalls (dungarees): bib, straps over the shoulders, buttons
  if (spec.overalls) {
    const ov = cloth(spec.overalls, 'denim');
    const bibTop = P.chestY + 0.02 * H;
    addShell((i, p, n, part) => part === PART.TORSO && p.y > P.waistY - 0.03 * H && p.y < bibTop + 0.02 * H && p.z > 0,
      (i, p) => soft(Math.min(0.068 * H - Math.abs(p.x), bibTop - p.y), shirtOff + 0.008, 0, 0.01 * H), ov, 'bib');
    addShell((i, p, n, part) => part === PART.TORSO && p.y > P.chestY - 0.04 * H && Math.abs(Math.abs(p.x) - 0.055 * H) < 0.03 * H,
      (i, p) => soft(Math.min(0.012 * H - Math.abs(Math.abs(p.x) - 0.055 * H), p.y - (p.z > 0 ? bibTop - 0.01 * H : P.waistY)), shirtOff + 0.007, 0, 0.008 * H), ov, 'straps');
  }

  if (top === 'chef' && spec.apron) flare(P.hipY + 0.005 * H, P.kneeY - 0.03 * H, 0.03, 0.06 * H, cloth('#ffffff', 'cotton'), 'apron-skirt', { phiStart: -1.05, phiLength: 2.1 });

  // Gloves replace bare hands' material
  const handMat = spec.gloves ? cloth(spec.gloves, 'nylon') : skinMat;

  // ---------------- rigid parts ----------------
  // Head
  const head = buildHead({
    skin: skinMat,
    lip: new THREE.Color(skinColor).lerp(new THREE.Color('#a8434f'), spec.sex === 'f' ? 0.45 : 0.25),
    eye: rand.pick(['#4a3426', '#2f5d7c', '#3d5a2e', '#6b4a2b']),
    hairMat,
    browMat: hairMat,
    hairStyle,
    hideEars: ['long', 'bob', 'wavy'].includes(hairStyle) || spec.hat === 'spacehelmet' || spec.hat === 'swimcap',
    headphones: o.headphones ?? spec.headphones,
    goggles: spec.goggles,
    hat: o.hat === false ? null : (o.hat ?? spec.hat),
    hatMat: new THREE.MeshPhysicalMaterial({ name: 'hat', color: M.toColor(o.hatColor ?? spec.hatColor ?? '#333'), roughness: spec.hat === 'hardhat' || spec.hat === 'firehelmet' ? 0.25 : 0.7, clearcoat: spec.hat === 'hardhat' || spec.hat === 'firehelmet' ? 1 : 0 }),
    hatColor: o.hatColor ?? spec.hatColor,
    glasses: o.glasses ?? spec.glasses,
    female: spec.sex === 'f',
    age: spec.age ?? 'adult',
    variation: o.face ?? spec.face ?? (seeded ? rand.int(0, 4) : 0),
    detail,
    beard: o.beard ?? spec.beard,
    rand,
  });
  head.scale.setScalar(P.hh);
  head.name = 'head_mesh';
  rig.get('head').add(head);
  if (spec.headband) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.03, 8, 40), cloth(spec.headband, 'cotton'));
    band.rotation.x = Math.PI / 2 - 0.12;
    band.scale.set(1, 1.28, 1);
    band.position.set(0, 0.62, 0.05);
    head.add(band);
  }

  // Hands
  for (const [sfx, s] of [['L', 1], ['R', -1]]) {
    const hand = buildHand(P, s, handMat, LOW);
    hand.rotation.z = s * P.armTilt;
    hand.scale.setScalar(1.12); // hand length ≈ face length
    rig.get(`hand_${sfx}`).add(hand);
  }
  // Shoes
  let shoeType = spec.shoes;
  if (shoeType === 'sneaker' && P.child) shoeType = 'kids';
  for (const [sfx, s] of [['L', 1], ['R', -1]]) {
    for (const part of buildFootwear({ P, s, type: shoeType, color: o.shoeColor ?? spec.shoeColor, accent: spec.shoeAccent, skinColor, low: LOW, ankle: rig.world[`foot_${sfx}`], footBone: B(`foot_${sfx}`), toeBone: B(`toes_${sfx}`), kid: P.child })) skinnedParts.push(part);
  }
  if (['sneaker', 'kids', 'dress', 'boot'].includes(shoeType)) {
    // socks fill the gap between trouser hem and shoe collar
    const sockC = shoeType === 'dress' ? '#1c1c22' : shoeType === 'boot' ? '#5a4a3a' : '#f2f2f0';
    addShell((i, p, n, part, sf) => isShin(part) && sf > 0.8, 0.0035, cloth(sockC, 'cotton'), 'socks');
  }
  if (shoeType === 'boot') {
    addShell((i, p, n, part, sf) => isShin(part) && sf > 0.72, 0.016, new THREE.MeshPhysicalMaterial({ name: 'leather', color: M.toColor(o.shoeColor ?? spec.shoeColor), roughness: 0.5, clearcoat: 0.3 }), 'boot-shaft');
  }
  // Accessories on the chest bone
  const chest = rig.get('chest');
  const frontZ = (y) => P.torsoR(y) * P.torsoZ(y);
  if (spec.badge) {
    const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * H, 0.018 * H, 0.004, 6).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.95, roughness: 0.25 }));
    const by = P.chestY + 0.035 * H;
    badge.position.set(0.05 * H, by - P.chestY, frontZ(by) * 0.92 + shirtOff + 0.006);
    badge.rotation.x = -0.25;
    chest.add(badge);
  }
  if (top === 'chef') {
    const btn = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.4 });
    for (const sx of [0.03, -0.03]) for (let k = 0; k < 4; k++) {
      const by = P.waistY + 0.01 * H + k * 0.035 * H;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.0055 * H, LOW ? 5 : 10, LOW ? 4 : 8), btn);
      b.position.set(sx * H, by - P.chestY, frontZ(by) + shirtOff + 0.003);
      chest.add(b);
    }
  }
  if (spec.stethoscope) {
    const tubeMat = new THREE.MeshPhysicalMaterial({ color: '#1d1d1f', roughness: 0.3, clearcoat: 0.6 });
    const nz = 0.035 * H;
    const y0 = P.neckBaseY - P.chestY;
    const pts = [[0.07 * H, y0 - 0.06 * H, frontZ(P.chestY + 0.02 * H) + 0.03], [0.05 * H, y0 + 0.005 * H, nz * 0.5], [0, y0 + 0.012 * H, -nz - 0.012], [-0.05 * H, y0 + 0.005 * H, nz * 0.5], [-0.06 * H, y0 - 0.05 * H, frontZ(P.chestY + 0.03 * H) + 0.03]];
    const t = taperTube(pts, () => 0.0045 * H, { segments: 40, radial: 8 });
    chest.add(new THREE.Mesh(t.geometry, tubeMat));
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.014 * H, 0.014 * H, 0.006 * H, 20).rotateX(Math.PI / 2), M.chrome());
    disc.position.set(0.07 * H, y0 - 0.075 * H, frontZ(P.chestY + 0.01 * H) + 0.035);
    chest.add(disc);
  }
  if (spec.backpack) {
    const bag = new THREE.Group();
    const backZ = -(P.torsoR(P.chestY) * P.torsoZ(P.chestY)) - shirtOff - (spec.coat ? 0.028 : 0) - 0.004; // resting on the back
    const bw = 0.17 * H;
    const bh = 0.23 * H;
    const bd = 0.08 * H;
    const bagMat = cloth(spec.backpack, 'nylon');
    const main = new THREE.Mesh(cushion(bw, bh, bd, { radius: 0.03 * H, bulge: 0.12 }), bagMat);
    bag.add(main);
    const pocket = new THREE.Mesh(cushion(bw * 0.7, bh * 0.4, bd * 0.45, { radius: 0.02 * H, bulge: 0.15 }), bagMat);
    pocket.position.set(0, -bh * 0.2, -bd * 0.55);
    bag.add(pocket);
    const zip = new THREE.Mesh(new THREE.TorusGeometry(bw * 0.42, 0.004, 6, 24, Math.PI), new THREE.MeshStandardMaterial({ color: '#222' }));
    zip.position.set(0, bh * 0.05, -bd * 0.5);
    zip.scale.set(1, 1.2, 1);
    bag.add(zip);
    bag.position.set(0, -0.01 * H, backZ - bd / 2);
    chest.add(bag);
  }
  if (spec.camera) {
    const cam = new THREE.Group();
    const camBody = new THREE.Mesh(roundedBox(0.075 * H * 0.6, 0.042, 0.035, 0.008), M.plastic('#1a1a1a', 0.4));
    cam.add(camBody);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.04, 20).rotateX(Math.PI / 2), M.plastic('#111', 0.3));
    lens.position.z = 0.03;
    cam.add(lens);
    const glassL = new THREE.Mesh(new THREE.CircleGeometry(0.014, 20), M.glass({ tint: '#223344' }));
    glassL.position.z = 0.0505;
    cam.add(glassL);
    const cy = P.chestY - 0.01 * H;
    cam.position.set(0, cy - P.chestY, frontZ(cy) + shirtOff + 0.019);
    chest.add(cam);
    const strapD = (p) => 0.005 * H - Math.abs(Math.abs(p.x) - (0.03 * H + (p.y - cy) * 0.35));
    addShell((i, p, n, part) => (part === PART.TORSO && p.y > cy - 0.01 * H && p.z > 0 && strapD(p) > -0.03 * H) || (part === PART.NECK && Math.abs(p.y - (P.neckBaseY + 0.012 * H)) < 0.012 * H),
      (i, p) => (partOf(i) === PART.NECK ? soft(0.005 * H - Math.abs(p.y - (P.neckBaseY + 0.012 * H)), 0.012, 0, 0.008 * H) : soft(Math.min(strapD(p), p.y - cy), shirtOff + 0.004, 0, 0.012 * H)), new THREE.MeshStandardMaterial({ color: '#111' }), 'camera-strap');
  }

  // Scarf: a soft roll around the neck with one end hanging on the chest
  if (spec.scarf) {
    const scarfMat = cloth(spec.scarf, 'wool');
    const coatK = spec.coat || spec.labcoat ? 0.022 : 0;
    const rx = 0.05 * H + coatK;
    const rz = 0.046 * H + coatK;
    const cy = P.neckBaseY + 0.008 * H - P.chestY;
    const ring = [];
    for (let k = 0; k <= 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      ring.push([Math.sin(a) * rx, cy + 0.006 * H * Math.cos(a), -0.004 * H + Math.cos(a) * rz]);
    }
    chest.add(new THREE.Mesh(taperTube(ring, () => 0.016 * H, { segments: LOW ? 12 : 36, radial: LOW ? 5 : 10 }).geometry, scarfMat)).name = 'scarf';
    const fz = (y) => frontZ(y + P.chestY) + shirtOff + coatK + 0.012 * H;
    const tail = [[0.025 * H, cy - 0.005 * H, rz * 0.9], [0.03 * H, cy - 0.06 * H, fz(cy - 0.06 * H)], [0.034 * H, cy - 0.16 * H, fz(cy - 0.16 * H)]];
    chest.add(new THREE.Mesh(taperTube(tail, () => 0.012 * H, { segments: LOW ? 4 : 12, radial: LOW ? 5 : 8 }).geometry.scale(1.5, 1, 0.5), scarfMat)).name = 'scarf-end';
  }
  // Shoulder bag: diagonal strap (left shoulder → right hip) + bag on the hip
  if (spec.bag) {
    const bagMat = new THREE.MeshPhysicalMaterial({ name: 'leather', color: M.toColor(spec.bag), roughness: 0.45, clearcoat: 0.3 });
    const x0 = 0.07 * H;
    const y0 = P.shoulderY + 0.01 * H;
    const ang = Math.atan2(P.hipY - y0, -0.2 * H);
    const strapD = (p) => 0.008 * H - Math.abs((p.x - x0) * Math.sin(ang) - (p.y - y0) * Math.cos(ang));
    const outer = (spec.coat ? 0.03 : shirtOff) + 0.006;
    addShell((i, p, n, part) => part === PART.TORSO && p.y > P.hipY && strapD(p) > -0.03 * H, (i, p) => soft(strapD(p), outer, 0, 0.006 * H), bagMat, 'bag-strap');
    const bag = new THREE.Mesh(roundedBox(0.06 * H, 0.14 * H, 0.17 * H, 0.012 * H), bagMat);
    bag.name = 'bag';
    const hipR = P.torsoR(P.hipY) + 0.03 * H + (spec.coat ? 0.03 : 0);
    bag.position.set(-hipR, -0.02 * H, 0.0);
    rig.get('hips').add(bag);
  }
  // Held item (right hand)
  if (spec.hold) {
    const reach = rig.world.hand_R.y;
    const prop = buildProp(spec.hold, { H, s: -1, reach });
    prop.rotation.z = -P.armTilt; // undo the hand tilt so long things hang vertically
    rig.get('hand_R').add(prop);
  }
  if (spec.guitar) {
    const backZ = -(P.torsoR(P.chestY) * P.torsoZ(P.chestY)) - shirtOff;
    chest.add(buildGuitar({ backZ, H }));
    const strapMat = cloth('#2a2a2a', 'nylon');
    addShell((i, p, n, part) => part === PART.TORSO && p.y > P.waistY && Math.abs(p.x + (p.y - P.chestY) * 0.9) < 0.03 * H, (i, p) => soft(0.009 * H - Math.abs(p.x + (p.y - P.chestY) * 0.9), shirtOff + 0.006, 0, 0.006 * H), strapMat, 'guitar-strap');
  }

  // ---------------- assemble skinned meshes ----------------
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(rig.bones);
  {
    // drop body triangles that are completely under clothes (plus a 1-ring margin kept visible)
    const body = bodyGeo.clone();
    const idx = body.index.array;
    const margin = new Uint8Array(covered.length);
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t], b = idx[t + 1], c = idx[t + 2];
      if (!(covered[a] && covered[b] && covered[c])) margin[a] = margin[b] = margin[c] = 1;
    }
    const keep = [];
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t], b = idx[t + 1], c = idx[t + 2];
      if (margin[a] || margin[b] || margin[c] || !(covered[a] && covered[b] && covered[c])) keep.push(a, b, c);
    }
    body.setIndex(keep);
    root.add(skinned(body, skinMat, skeleton, 'body'));
  }
  for (const [g, mat, name, double] of skinnedParts) {
    if (double) mat.side = THREE.DoubleSide;
    root.add(skinned(g, mat, skeleton, name));
  }

  // Elders stoop slightly (rest pose, after binding so the mesh deforms)
  if (P.elder) {
    rig.get('spine').rotation.x = 0.06;
    rig.get('chest').rotation.x = 0.1;
    rig.get('neck').rotation.x = -0.12;
  }

  const lids = ['lid_L', 'lid_R'].map((n) => head.getObjectByName(n)).filter(Boolean);
  const animations = buildAnimations(rig, P, { lids });
  finalize(root, { type: 'person', variant, options: o, animations });
  // Full-body poses replace each other; gestures (wave, clap, talk…) layer on top of any pose,
  // e.g. walk + wave, sit + talk, idle + phone-call.
  const GESTURES = new Set(['wave', 'clap', 'point', 'talk', 'phoneCall', 'phone-call', 'lookAround', 'look-around']);
  root.userData.premade.exclusive = [animations.map((a) => a.name).filter((n) => !GESTURES.has(n))];
  // move the character at these speeds while walk/run play and the feet won't slide
  root.userData.premade.walkSpeed = (2 * (P.child ? 0.15 : 0.17) * H) / (0.6 * (P.child ? 0.82 : 1.05));
  root.userData.premade.runSpeed = (2 * (P.child ? 0.2 : 0.24) * H) / (0.36 * (P.child ? 0.6 : 0.7));
  root.userData.premade.oneShot = ['sit'];
  return root;
}

/* ------------------------------------------------------------------ */

function cloth(color, kind = 'cotton') {
  const c = M.toColor(color);
  const props = {
    cotton: { roughness: 0.85, sheen: 0.6, sheenRoughness: 0.7 },
    denim: { roughness: 0.9, sheen: 0.3, sheenRoughness: 0.8 },
    wool: { roughness: 0.75, sheen: 0.8, sheenRoughness: 0.5 },
    silk: { roughness: 0.35, sheen: 1, sheenRoughness: 0.25 },
    nylon: { roughness: 0.5, sheen: 0.3, sheenRoughness: 0.4 },
  }[kind];
  return new THREE.MeshPhysicalMaterial({ name: 'cloth', color: c, ...props, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.35) });
}

function buildHand(P, s, skinMat, low = false) {
  const H = P.H;
  const g = new THREE.Group();
  const palmL = 0.056 * H;
  const palmW = 0.046 * H;
  const palmT = 0.017 * H * (P.f ? 0.9 : 1);
  const palm = new THREE.Mesh(low ? new THREE.SphereGeometry(0.5, 8, 6).scale(palmT, palmL * 1.1, palmW) : cushion(palmT, palmL, palmW, { radius: palmT * 0.45, bulge: 0.15 }), skinMat);
  palm.position.set(0, -palmL / 2 + 0.004 * H, 0.002 * H);
  g.add(palm);
  if (low) {
    // crowd LOD: palm with the fingers as one soft block + thumb
    const fingers = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6).scale(palmT * 0.85, 0.05 * H, palmW * 0.95), skinMat);
    fingers.position.set(-s * 0.003 * H, -palmL - 0.016 * H, 0.002 * H);
    g.add(fingers);
    const th = taperTube([[-s * palmT * 0.2, -0.016 * H, palmW * 0.42], [-s * palmT * 0.9, -0.05 * H, palmW * 0.62]], (q) => 0.0072 * H * (1 - 0.3 * q), { segments: 3, radial: 5 });
    g.add(new THREE.Mesh(th.geometry, skinMat));
    return g;
  }
  const fingerLens = [0.04, 0.046, 0.043, 0.034];
  for (let k = 0; k < 4; k++) {
    const z = (-0.375 + k * 0.25) * palmW * 0.92 + 0.002 * H;
    const len = fingerLens[3 - k] * H * (P.f ? 0.95 : 1);
    const y0 = -palmL + 0.004 * H;
    const curl = -s * 0.012 * H;
    const t = taperTube([[0, y0 + 0.006 * H, z], [curl * 0.3, y0 - len * 0.5, z], [curl, y0 - len, z * 1.02]], (q) => 0.0058 * H * (P.f ? 0.88 : 1) * (1 - 0.25 * q), { segments: 8, radial: 6 });
    g.add(new THREE.Mesh(t.geometry, skinMat));
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0044 * H * (P.f ? 0.88 : 1), 8, 6), skinMat);
    tip.position.set(curl, y0 - len, z * 1.02);
    g.add(tip);
  }
  // thumb: from the palm's front-inner edge, angled forward/down
  const th = taperTube([[-s * palmT * 0.2, -0.016 * H, palmW * 0.42], [-s * palmT * 0.6, -0.034 * H, palmW * 0.62], [-s * palmT * 0.9, -0.05 * H, palmW * 0.62]], (q) => 0.0072 * H * (1 - 0.3 * q), { segments: 10, radial: 8 });
  g.add(new THREE.Mesh(th.geometry, skinMat));
  return g;
}

function buildShoe(P, s, type, color, low = false) {
  const H = P.H;
  const g = new THREE.Group();
  const L = (P.child ? 0.16 : P.f ? 0.148 : 0.152) * H;
  const W = 0.052 * H * (P.f ? 0.92 : 1);
  const sole = (type === 'none' ? 0.002 : type === 'sneaker' || type === 'boot' ? 0.016 : 0.01) * H;
  const upperH = P.ankleY + 0.016 * H - sole;
  const shape = (geo, taper = 0.28, drop = 0.5, floorY = -Infinity) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i) / (L / 2);
      const y = Math.max(p.getY(i), floorY);
      p.setY(i, y);
      const fz = smooth01((z + 0.1) / 1.1);
      p.setX(i, p.getX(i) * (1 - taper * fz * fz) + s * 0.004 * H * fz);
      if (y > 0) p.setY(i, y * (1 - drop * fz));
    }
    geo.computeVertexNormals();
    return geo;
  };
  const bare = type === 'none';
  const upperMat = bare ? M.skin(color) : type === 'dress'
    ? new THREE.MeshPhysicalMaterial({ name: 'leather', color: M.toColor(color), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 })
    : type === 'boot'
      ? new THREE.MeshPhysicalMaterial({ name: 'leather', color: M.toColor(color), roughness: 0.5, clearcoat: 0.3 })
      : cloth(color, 'nylon');
  const upper = new THREE.Mesh(shape(low ? roundedBox(W, upperH, L, Math.min(W, upperH) * 0.45, 1) : cushion(W, upperH, L, { radius: Math.min(W, upperH) * 0.48, bulge: 0.1 }), 0.3, 0.55, -upperH / 2), upperMat);
  const zc = L * 0.2;
  upper.position.set(0, -P.ankleY + sole + upperH / 2, zc);
  g.add(upper);
  const soleMat = new THREE.MeshStandardMaterial({ name: 'sole', color: type === 'sneaker' ? '#f4f4f2' : '#1a1a1a', roughness: 0.8 });
  const soleMesh = new THREE.Mesh(shape(roundedBox(W * 0.99, sole, L * 0.99, sole * 0.45, low ? 1 : 2), 0.3, 0), soleMat);
  soleMesh.position.set(0, -P.ankleY + sole / 2, zc);
  g.add(soleMesh);
  if (type === 'sneaker' && !low) {
    const lace = new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.7 });
    for (let k = 0; k < 4; k++) {
      const lz = zc + L * (0.05 + k * 0.07);
      const ly = -P.ankleY + sole + upperH * (0.98 - k * 0.1) * (1 - 0.5 * smooth01((lz - zc) / (L / 2) * 0.9 + 0.1) * 0.6);
      const bar = new THREE.Mesh(new THREE.CapsuleGeometry(0.0025 * H, W * 0.38, 4, 6).rotateZ(Math.PI / 2), lace);
      bar.position.set(0, ly + 0.002 * H, lz);
      g.add(bar);
    }
  }
  return g;
}

