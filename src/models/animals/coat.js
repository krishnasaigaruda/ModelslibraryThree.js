import * as THREE from 'three';
import { C, smooth01, clamp, noise3, fbm } from './core.js';
import { rng } from '../../core/utils.js';

/*
 * Coat painter. One function colours every part of an animal from its rest-pose
 * world position + normal + region, so body, legs, head, ears and tail always
 * match where they meet.
 *
 * coat spec:
 *  base        main colour
 *  back        darker dorsal colour (optional, default = base darkened)
 *  belly       underside colour
 *  points      lower legs / ears / muzzle (bay horses, siamese)
 *  pointsH     height (fraction of withers height) the leg points reach
 *  socks       white socks colour + socksH (array of 4 heights FL,FR,BL,BR or number)
 *  face        { blaze: colour } white stripe down the face; mask: colour for muzzle
 *  muzzle      muzzle colour
 *  chest       chest/bib colour (tuxedo / collie)
 *  saddle      dorsal saddle colour (german shepherd, beagle)
 *  pattern     { type, color, scale, amount }
 *                spots | patches | tabby | tiger | zebra | giraffe | rosettes | dapple | brindle | merle | roan | stripe
 *  nose, eyeRing, inner (inner ear), hoof
 */

const tmp = new THREE.Color();

function cells(seed) {
  const r = rng(seed);
  const table = Array.from({ length: 4096 }, () => [r(), r(), r()]);
  const h = (x, y, z) => table[((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 4095];
  return (x, y, z) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    let f1 = 9;
    let f2 = 9;
    let id = 0;
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (let k = -1; k <= 1; k++) {
          const o = h(xi + i, yi + j, zi + k);
          const dx = xi + i + o[0] - x;
          const dy = yi + j + o[1] - y;
          const dz = zi + k + o[2] - z;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < f1) {
            f2 = f1;
            f1 = d;
            id = o[0];
          } else if (d < f2) f2 = d;
        }
    return { f1, f2, id };
  };
}

/**
 * makeCoat(spec, ctx) → (p, n, info) → THREE.Color
 * ctx: { H (withers height), seed, eyes: [Vector3], bodyLen }
 * info: { region: 'body'|'leg'|'head'|'ear'|'tail'|'mane', leg: 0..3, t (along part), sx, sy, earInner }
 */
export function makeCoat(spec, ctx) {
  const H = ctx.H;
  const rand = rng(`${ctx.seed}-coat`);
  const nz = noise3(rand);
  const cell = cells(`${ctx.seed}-cells`);
  const base = C(spec.base);
  const back = spec.back ? C(spec.back) : base.clone().multiplyScalar(0.72);
  const belly = spec.belly ? C(spec.belly) : base.clone().lerp(new THREE.Color('#ffffff'), 0.25);
  const points = spec.points ? C(spec.points) : null;
  const pointsH = (spec.pointsH ?? 0.35) * H;
  const socks = spec.socks ? C(spec.socks) : null;
  const socksH = spec.socksH ?? 0.15;
  const pat = spec.pattern;
  const patC = pat ? C(pat.color) : null;
  const pat2 = pat?.color2 ? C(pat.color2) : null;
  const nose = C(spec.nose ?? '#1b1714');
  const blaze = spec.face?.blaze ? C(spec.face.blaze) : null;
  const mask = spec.face?.mask ? C(spec.face.mask) : null;
  const muzzle = spec.muzzle ? C(spec.muzzle) : null;
  const chest = spec.chest ? C(spec.chest) : null;
  const saddle = spec.saddle ? C(spec.saddle) : null;
  const inner = spec.inner ? C(spec.inner) : base.clone().lerp(new THREE.Color('#c99a92'), 0.3).multiplyScalar(0.85);
  const eyeRing = spec.eyeRing ? C(spec.eyeRing) : null;
  const pats = [spec.pattern, spec.pattern2].filter(Boolean).map((pt) => [pt, C(pt.color), pt.color2 ? C(pt.color2) : null]);
  const band = spec.band ? { c: C(spec.band.color), ...spec.band } : null;
  const mottle = spec.mottle ?? 0.06;

  return (p, n, info) => {
    const c = base.clone();
    const region = info.region;
    // dorsal shading: darker along the top, lighter underneath
    const up = n.y;
    if (region !== 'leg' || p.y > H * 0.6) c.lerp(back, smooth01((up - 0.15) / 0.75) * (spec.backAmount ?? 0.85));
    if (region === 'body' || region === 'neck' || (region === 'leg' && p.y > H * 0.45)) c.lerp(belly, smooth01((-up - 0.05) / 0.45));
    if (region === 'leg' && spec.innerLeg !== false) c.lerp(belly, 0.5 * smooth01((-Math.sign(p.x) * n.x - 0.2) / 0.6) * smooth01((p.y - H * 0.25) / (H * 0.2)));

    // dorsal saddle
    if (saddle && (region === 'body' || region === 'neck' || region === 'tail')) {
      const sv = smooth01((up - (spec.saddleLow ?? 0.1)) / 0.25) * smooth01((p.z / (ctx.bodyLen * 0.5) + (spec.saddleFront ?? 0.6)) / 0.25);
      c.lerp(saddle, sv * (region === 'tail' ? smooth01((up + 0.3) / 0.6) : 1));
    }
    // chest / bib
    if (chest && (region === 'body' || region === 'neck')) {
      const front = p.z / (ctx.bodyLen * 0.5);
      c.lerp(chest, smooth01((front - 0.55) / 0.2) * smooth01((-up + 0.35) / 0.4));
    }

    for (const [pat, patC, pat2] of pats) {
      if (region === 'ear-inner') break;
      const k = (pat.scale ?? 1) / H;
      const q = [p.x * k, p.y * k, p.z * k];
      let v = 0;
      switch (pat.type) {
        case 'spots': {
          const f = cell(q[0] * 3, q[1] * 3, q[2] * 3);
          v = smooth01((0.4 * (pat.amount ?? 1) - f.f1) / 0.04);
          break;
        }
        case 'patches': {
          const w = fbm(nz, q[0] * 1.2 + 5, q[1] * 1.2, q[2] * 1.2, 4);
          v = smooth01((w - (pat.amount ?? 0.5)) / 0.025);
          break;
        }
        case 'merle': {
          const w = fbm(nz, q[0] * 3 + 5, q[1] * 3, q[2] * 3, 3);
          v = smooth01((w - (pat.amount ?? 0.55)) / 0.03);
          break;
        }
        case 'tabby':
        case 'tiger': {
          // bands around the body (perpendicular to the spine) / around legs and tail
          const warp = fbm(nz, q[0] * 2, q[1] * 2, q[2] * 2, 2) * 2.2;
          const coord = region === 'leg' || region === 'tail' ? q[1] * 1.4 + (region === 'tail' ? q[2] : 0) : q[2] + (region === 'head' ? q[1] * 0.6 : 0);
          const band = Math.sin((coord * (pat.type === 'tiger' ? 40 : 55) + warp * 3) * 1.0);
          v = smooth01((band - (pat.type === 'tiger' ? 0.5 : 0.45)) / (pat.type === 'tiger' ? 0.15 : 0.25)) * (pat.type === 'tabby' ? 0.7 : 1);
          if (pat.type === 'tiger') v *= smooth01((up + 0.75) / 0.4);
          if (region === 'head' && info.t > 0.65) v *= 0.3;
          break;
        }
        case 'zebra': {
          const warp = fbm(nz, q[0] * 1.5, q[1] * 1.5, q[2] * 1.5, 2) * 1.2;
          q[0] *= 7; q[1] *= 7; q[2] *= 7;
          let coord = q[2] - q[1] * 0.25;
          if (region === 'leg') coord = q[1] * 1.6;
          if (region === 'neck' || region === 'mane') coord = q[1] * 1.2 + q[2] * 0.3;
          if (region === 'head') coord = q[1] * 2.2 + q[2] * 0.4;
          if (region === 'body' && p.z < -ctx.bodyLen * 0.25) coord = q[1] * 0.9 - q[2] * 0.9;
          const band = Math.sin((coord * 7 + warp) * 1.0);
          v = smooth01((band - 0.0) / 0.12);
          break;
        }
        case 'giraffe': {
          const f = cell(q[0] * 2.2, q[1] * 2.2, q[2] * 2.2);
          v = smooth01((f.f2 - f.f1 - 0.08) / 0.03);
          break;
        }
        case 'rosettes': {
          const f = cell(q[0] * 5.5, q[1] * 5.5, q[2] * 5.5);
          const ring = Math.abs(f.f1 - 0.26);
          v = smooth01((0.09 - ring) / 0.03) * (f.id > 0.1 ? 1 : 0) * (0.6 + 0.4 * Math.sign(Math.sin(Math.atan2(q[1] * 5.5 - Math.floor(q[1] * 5.5), q[0] * 5.5 - Math.floor(q[0] * 5.5)) * 3 + f.id * 20)));
          if (pat.solid) v = Math.max(v, smooth01((0.2 - f.f1) / 0.04) * 0.0);
          break;
        }
        case 'dapple': {
          const f = cell(q[0] * 3, q[1] * 3, q[2] * 3);
          v = smooth01((f.f2 - f.f1 - 0.1) / 0.06) * smooth01((up + 0.2) / 0.5);
          break;
        }
        case 'brindle': {
          const s = Math.sin(q[2] * 30 + fbm(nz, q[0] * 6, q[1] * 6, q[2] * 6, 2) * 8);
          v = smooth01((s - 0.4) / 0.3) * 0.8;
          break;
        }
        case 'roan': {
          v = smooth01((nz(q[0] * 40, q[1] * 40, q[2] * 40) - 0.45) / 0.1) * 0.6;
          break;
        }
        case 'stripe': {
          // single dorsal stripe (donkey, some antelope)
          v = region === 'body' || region === 'neck' || region === 'mane' ? smooth01((Math.abs(n.x) < 0.25 && up > 0.6 ? 1 : 0)) : 0;
          break;
        }
        case 'bands': {
          // ringed tail (raccoon, lemur)
          v = region === 'tail' ? (Math.sin(info.t * (pat.rings ?? 6) * Math.PI * 2) > 0 ? 1 : 0) : 0;
          break;
        }
        default:
          break;
      }
      if (pat.regions && !pat.regions.includes(region)) v = 0;
      if (pat2 && v < 0.5 && pat.type === 'rosettes') {
        const f = cell(q[0] * 5.5, q[1] * 5.5, q[2] * 5.5);
        if (f.f1 < 0.2 && f.id > 0.1) c.lerp(pat2, 0.5);
      }
      c.lerp(patC, v);
    }

    // body band (panda shoulders, belted cattle)
    if (band && (region === 'body' || region === 'neck' || (region === 'leg' && band.legs))) {
      const f = p.z / (ctx.bodyLen * 0.5);
      const flank = band.flank ? smooth01((Math.abs(n.x) - 0.55) / 0.15) * smooth01((0.35 - Math.abs(n.y + 0.1)) / 0.12) : 1;
      c.lerp(band.c, smooth01((f - band.from) / 0.06) * smooth01((band.to - f) / 0.06) * flank);
    }
    // leg points & socks
    if (region === 'leg' || region === 'hoofband') {
      if (points) c.lerp(points, smooth01((pointsH - p.y) / (0.06 * H)));
      if (socks) {
        const sh = (Array.isArray(socksH) ? socksH[info.leg] ?? 0 : socksH) * H;
        if (sh > 0) c.lerp(socks, smooth01((sh - p.y) / (0.02 * H)));
      }
    }
    if (region === 'tail' && points && spec.tailPoints !== false) c.lerp(points, smooth01((info.t - 0.6) / 0.2));
    if (region === 'tail' && spec.tailTip) c.lerp(C(spec.tailTip), smooth01((info.t - 0.82) / 0.06));
    if ((region === 'ear' || region === 'ear-inner') && points && spec.earPoints !== false) c.lerp(points, 0.85);
    if (region === 'ear' && spec.earTip) c.lerp(C(spec.earTip), smooth01((info.t - 0.6) / 0.15));
    if (region === 'ear-inner') c.lerp(inner, 0.75);

    // face
    if (region === 'head') {
      const t = info.t;
      if (muzzle) c.lerp(muzzle, smooth01((t - (spec.muzzleStart ?? 0.55)) / 0.1));
      if (points && spec.facePoints) c.lerp(points, smooth01((t - 0.5) / 0.15));
      if (mask) c.lerp(mask, smooth01((t - (spec.face.maskStart ?? 0.3)) / 0.1) * smooth01((-info.sy + (spec.face.maskTop ?? 0.4)) / 0.3));
      if (blaze) c.lerp(blaze, smooth01((0.28 - Math.abs(info.sx)) / 0.08) * smooth01((info.sy - 0.2) / 0.15) * smooth01((t - (spec.face.blazeStart ?? 0.25)) / 0.08));
      if (spec.face?.spectacles) {
        for (const e of ctx.eyes ?? []) c.lerp(C(spec.face.spectacles), smooth01((H * 0.075 - p.distanceTo(e)) / (H * 0.02)));
      }
      // nose leather
      // nose leather / muzzle pad: the front face of the muzzle tip
      if (spec.noseLeather !== false) {
        const f = info.front ?? 0;
        const pad = smooth01((t - (spec.noseStart ?? 0.94)) / 0.03) * smooth01((f - (spec.noseFront ?? 0.35)) / 0.25) * smooth01((info.sy - (spec.noseLow ?? -0.6)) / 0.2);
        c.lerp(nose, pad);
      }
      // lips / mouth line
      if (spec.lips !== false) c.lerp(C(spec.lipColor ?? '#2a1d18'), smooth01((t - 0.6) / 0.08) * smooth01((0.07 - Math.abs(info.sy + (spec.mouthY ?? 0.35))) / 0.04) * smooth01((Math.abs(info.sx) - 0.12) / 0.15) * smooth01((0.72 - Math.abs(info.sx)) / 0.12) * (spec.lipStrength ?? 0.8));
      if (eyeRing) for (const e of ctx.eyes ?? []) c.lerp(eyeRing, smooth01((H * 0.022 - p.distanceTo(e)) / (H * 0.01)));
    }
    // subtle mottling so large areas aren't flat
    const m = (nz(p.x * 9 / H, p.y * 9 / H, p.z * 9 / H) - 0.5) * mottle * 2;
    c.multiplyScalar(1 + m);
    return c;
  };
}

export { tmp as _tmp, clamp };
