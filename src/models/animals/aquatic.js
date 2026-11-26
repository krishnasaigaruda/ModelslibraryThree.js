import * as THREE from 'three';
import { Rig, applySkin, chain, skinnedMesh, poseTrack, offsetTrack, loft, surfacePoint, spline, keyed, paint, furMaterial, noise3, fbm, smooth01, lerp, bump, TAU, C } from './core.js';
import { buildEye, hornMaterial } from './parts.js';
import { mergeSkinned } from './quad.js';
import { derive } from './species.js';
import { rng } from '../../core/utils.js';
import { clip } from '../../core/animation.js';

/*
 * Fish, sharks and marine mammals. One skinned loft body along a spine of bones
 * (laterally compressed for fish, round for sharks/whales), fins built from real
 * outlines (forked / lunate / heterocercal / flukes), painted countershading,
 * stripes, bars and spots. Swimmers hover (userData.floating); seals rest on
 * the ground. Facing +Z.
 */

const FISH = {
  L: 0.3, kind: 'fish', depth: 0.28, width: 0.12, belly: 1.05, snout: 0.5, peduncle: 0.06,
  fins: { dorsal: { at: 0.55, len: 0.22, h: 0.09 }, anal: { at: 0.28, len: 0.12, h: 0.06 }, pectoral: { at: 0.72, len: 0.1, h: 0.05 }, pelvic: { at: 0.55, len: 0.07, h: 0.04 }, caudal: { type: 'fork', h: 0.28, len: 0.17 } },
  eyes: { r: 0.032, t: 0.89, color: '#c8a838' },
  coat: { back: '#5a6a4a', side: '#9aa07a', belly: '#e8e6d8', fin: '#8a906a' },
};
const SHARK = {
  L: 4.0, kind: 'shark', depth: 0.2, width: 0.17, belly: 1.0, snout: 0.25, peduncle: 0.04,
  fins: { dorsal: { at: 0.6, len: 0.13, h: 0.13, falcate: 0.4 }, dorsal2: { at: 0.27, len: 0.04, h: 0.035 }, anal: { at: 0.25, len: 0.035, h: 0.03 }, pectoral: { at: 0.68, len: 0.2, h: 0.08, sweep: 0.6 }, pelvic: { at: 0.4, len: 0.06, h: 0.03 }, caudal: { type: 'heterocercal', h: 0.3, len: 0.2 } },
  gills: 5,
  eyes: { r: 0.012, t: 0.9, color: '#0a0a0a' },
  coat: { back: '#6a7680', side: '#7a868e', belly: '#f2f2f0', fin: '#5a666e' },
};
const CETACEAN = {
  L: 2.5, kind: 'mammal', depth: 0.2, width: 0.19, belly: 1.0, snout: 0.6, peduncle: 0.05, beak: 0.06,
  fins: { dorsal: { at: 0.52, len: 0.12, h: 0.12, falcate: 0.6 }, flipper: { at: 0.74, len: 0.14, h: 0.05 }, caudal: { type: 'flukes', h: 0.24, len: 0.1 } },
  eyes: { r: 0.012, t: 0.86, color: '#0a0a0a', a: 1.45 },
  coat: { back: '#5a6470', side: '#8a949e', belly: '#e8eaec', fin: '#5a6470' },
};
const PINNIPED = {
  L: 1.6, kind: 'seal', depth: 0.22, width: 0.24, belly: 1.0, snout: 0.7, peduncle: 0.06,
  fins: { dorsal: null, flipper: { at: 0.68, len: 0.14, h: 0.07 }, caudal: { type: 'hind', h: 0.18, len: 0.14 } },
  eyes: { r: 0.03, t: 0.93, color: '#0a0806', a: 1.1 },
  whiskers: true,
  coat: { back: '#6a6058', side: '#8a8078', belly: '#b8b0a6', fin: '#4a4038', spots: '#3a322c' },
};

export const AQUATIC_TYPES = {
  fish: {
    label: 'Fish', sub: 'sea', base: FISH, trims: ['juvenile', 'fancy-fins', 'fat', 'slim'],
    variants: {
      goldfish: { L: 0.15, depth: 0.4, width: 0.2, fins: { caudal: { type: 'fan', h: 0.45, len: 0.35 }, dorsal: { h: 0.18 } }, coat: { back: '#e8701e', side: '#f2902a', belly: '#f6c070', fin: '#f2902a' } },
      koi: { L: 0.6, depth: 0.25, width: 0.14, barbels: true, coat: { back: '#f4f2ee', side: '#f4f2ee', belly: '#f6f4f0', fin: '#f4f2ee', patches: '#e0401e' } },
      clownfish: { L: 0.1, depth: 0.42, width: 0.18, snout: 0.7, fins: { caudal: { type: 'round', h: 0.3 }, dorsal: { len: 0.4, h: 0.16 } }, coat: { back: '#e8701e', side: '#f2802a', belly: '#f2902a', fin: '#e8701e', bars: { color: '#f8f8f6', n: 3, edge: '#141414' } } },
      angelfish: { L: 0.15, depth: 0.7, width: 0.1, snout: 0.6, fins: { dorsal: { at: 0.5, len: 0.25, h: 0.45 }, anal: { at: 0.45, len: 0.25, h: 0.45 }, caudal: { type: 'lyre', h: 0.5, len: 0.3 } }, coat: { back: '#d8d0b8', side: '#e8e2d0', belly: '#f2eee2', fin: '#d8d0b8', bars: { color: '#2a2622', n: 3 } } },
      betta: { L: 0.07, depth: 0.3, width: 0.14, fins: { dorsal: { at: 0.45, len: 0.3, h: 0.35 }, anal: { at: 0.4, len: 0.45, h: 0.5 }, caudal: { type: 'fan', h: 0.9, len: 0.6 } }, coat: { back: '#2a3ab8', side: '#3a4ad8', belly: '#3a4ad8', fin: '#c81e3a' } },
      tuna: { L: 1.8, depth: 0.25, width: 0.17, peduncle: 0.03, fins: { dorsal: { h: 0.1, len: 0.12 }, pectoral: { len: 0.2, h: 0.04, sweep: 0.5 }, caudal: { type: 'lunate', h: 0.32, len: 0.14 }, finlets: true }, coat: { back: '#1a2a5a', side: '#9aa8b8', belly: '#e8eaec', fin: '#2a3a6a', stripe: '#d8c040' } },
      salmon: { L: 0.8, depth: 0.22, width: 0.12, coat: { back: '#4a5a6a', side: '#b8c0c8', belly: '#f2eee8', fin: '#5a6a7a', spots: '#2a2a2a' } },
      trout: { L: 0.45, depth: 0.22, width: 0.12, coat: { back: '#5a6a3a', side: '#a8a87a', belly: '#e8e6d2', fin: '#8a906a', spots: '#2a2a1e', stripe: '#d87a86' } },
      bass: { L: 0.45, depth: 0.3, width: 0.13, snout: 0.45, mouth: 'big', fins: { dorsal: { len: 0.38, h: 0.14 } }, coat: { back: '#3a5a2a', side: '#7a9a5a', belly: '#e8e6d0', fin: '#5a7a4a', stripe: '#2a3a1e' } },
      catfish: { L: 0.7, depth: 0.18, width: 0.18, snout: 0.3, barbels: true, fins: { dorsal: { h: 0.12, len: 0.08, at: 0.68 }, anal: { len: 0.3 }, caudal: { type: 'square', h: 0.2 } }, coat: { back: '#3a3430', side: '#5a524a', belly: '#d8d0c4', fin: '#3a3430' } },
      piranha: { L: 0.25, depth: 0.42, width: 0.14, snout: 0.35, mouth: 'teeth', coat: { back: '#5a6470', side: '#8a949e', belly: '#d8402a', fin: '#3a4048' } },
      pufferfish: { L: 0.3, depth: 0.6, width: 0.55, snout: 0.9, spines: true, fins: { dorsal: { h: 0.12, len: 0.1, at: 0.32 }, anal: { at: 0.3 }, caudal: { type: 'round', h: 0.22 } }, coat: { back: '#a8945a', side: '#c8b47a', belly: '#f2eee2', fin: '#a8945a', spots: '#3a3020' } },
      swordfish: { L: 3.0, depth: 0.18, width: 0.13, peduncle: 0.025, bill: 0.3, fins: { dorsal: { at: 0.72, h: 0.18, len: 0.08, falcate: 0.5 }, pectoral: { len: 0.15, h: 0.03 }, caudal: { type: 'lunate', h: 0.34, len: 0.14 } }, coat: { back: '#2a3040', side: '#6a7080', belly: '#c8ccd0', fin: '#2a3040' } },
      barracuda: { L: 1.2, depth: 0.12, width: 0.08, snout: 0.15, mouth: 'teeth', fins: { dorsal: { at: 0.6, h: 0.08, len: 0.06 }, caudal: { type: 'fork', h: 0.22 } }, coat: { back: '#4a5a6a', side: '#a8b0b8', belly: '#e8eaec', fin: '#5a6a7a', bars: { color: '#3a4450', n: 18 } } },
      'blue-tang': { L: 0.25, depth: 0.58, width: 0.12, snout: 0.6, fins: { dorsal: { len: 0.6, h: 0.14, at: 0.5 }, anal: { len: 0.45, h: 0.12, at: 0.38 }, caudal: { type: 'lunate', h: 0.4 } }, coat: { back: '#1a4ad8', side: '#2a5ae8', belly: '#3a6af0', fin: '#141e40', stripe: '#141e40', tail: '#f2d01e' } },
      carp: { L: 0.6, depth: 0.32, width: 0.15, barbels: true, coat: { back: '#5a4a2a', side: '#a8884a', belly: '#e8d8a8', fin: '#7a6a3a' } },
      perch: { L: 0.3, depth: 0.32, width: 0.13, fins: { dorsal: { len: 0.35, h: 0.15 } }, coat: { back: '#4a5a2a', side: '#a8b05a', belly: '#f2eed2', fin: '#d8601e', bars: { color: '#2a3418', n: 6 } } },
      mackerel: { L: 0.35, depth: 0.18, width: 0.11, peduncle: 0.03, fins: { caudal: { type: 'fork', h: 0.26 }, finlets: true }, coat: { back: '#2a5a5a', side: '#b8c8c8', belly: '#f2f2f0', fin: '#3a5a5a', tigerBack: '#141e20' } },
    },
  },
  shark: {
    label: 'Shark', sub: 'sea', base: SHARK, trims: ['juvenile', 'big', 'slim'],
    variants: {
      'great-white': {},
      hammerhead: { L: 4.0, hammer: 0.32, fins: { dorsal: { h: 0.17, falcate: 0.55 } }, coat: { back: '#7a8070', side: '#8a9080', belly: '#f2f0ec' } },
      'tiger-shark': { L: 4.5, snout: 0.45, coat: { back: '#6a6a5a', side: '#7a7a6a', belly: '#e8e6e0', bars: { color: '#4a4a3e', n: 14 } } },
      'whale-shark': { L: 10, depth: 0.17, width: 0.2, snout: 0.9, flatHead: true, fins: { dorsal: { h: 0.1, len: 0.1, at: 0.45 }, caudal: { type: 'lunate', h: 0.3 } }, eyes: { r: 0.005, t: 0.93 }, coat: { back: '#3a4a5a', side: '#4a5a6a', belly: '#e8eaec', spots: '#e8eaec', fin: '#3a4a5a' } },
      mako: { L: 3.2, depth: 0.17, width: 0.14, snout: 0.15, fins: { caudal: { type: 'lunate', h: 0.32 } }, coat: { back: '#2a3a7a', side: '#5a6aa0', belly: '#f2f2f0', fin: '#2a3a7a' } },
      'nurse-shark': { L: 3.0, depth: 0.15, width: 0.17, snout: 0.85, barbels: true, fins: { dorsal: { at: 0.4, h: 0.07, len: 0.08, falcate: 0 }, dorsal2: { at: 0.3, h: 0.06, len: 0.07 }, caudal: { type: 'heterocercal', h: 0.18, len: 0.25 } }, coat: { back: '#9a7a5a', side: '#a88a6a', belly: '#c8b49a', fin: '#9a7a5a' } },
    },
  },
  'sea-mammal': {
    label: 'Whale, Dolphin & Seal', sub: 'sea', base: CETACEAN, trims: ['juvenile', 'heavy', 'slim'],
    variants: {
      dolphin: {},
      orca: { L: 7, depth: 0.22, width: 0.2, beak: 0, snout: 0.75, fins: { dorsal: { h: 0.22, len: 0.1, falcate: 0.2 }, flipper: { len: 0.12, h: 0.07 } }, coat: { back: '#141414', side: '#141414', belly: '#f6f6f4', fin: '#141414', orca: true } },
      'blue-whale': { L: 25, depth: 0.12, width: 0.13, beak: 0, snout: 0.5, flatHead: true, grooves: true, fins: { dorsal: { h: 0.025, len: 0.03, at: 0.25 }, flipper: { len: 0.1, h: 0.025 }, caudal: { h: 0.22 } }, eyes: { r: 0.004, t: 0.83 }, coat: { back: '#4a5a6a', side: '#6a7a8a', belly: '#9aa8b4', fin: '#4a5a6a', spots: '#8a98a8' } },
      humpback: { L: 15, depth: 0.16, width: 0.16, beak: 0, snout: 0.6, flatHead: true, grooves: true, knobs: true, fins: { dorsal: { h: 0.03, len: 0.05, at: 0.32, falcate: 0 }, flipper: { len: 0.33, h: 0.04 }, caudal: { h: 0.3 } }, eyes: { r: 0.005, t: 0.82 }, coat: { back: '#2a2e34', side: '#3a3e44', belly: '#d8dadc', fin: '#2a2e34' } },
      beluga: { L: 4.5, depth: 0.22, width: 0.22, beak: 0.02, melon: 0.5, snout: 0.85, fins: { dorsal: null, flipper: { len: 0.1, h: 0.05 } }, coat: { back: '#f2f2ee', side: '#f4f4f0', belly: '#f6f6f2', fin: '#e8e8e4' } },
      narwhal: { L: 4.5, depth: 0.2, width: 0.2, beak: 0, melon: 0.3, snout: 0.85, tusk: 0.5, fins: { dorsal: null, flipper: { len: 0.08, h: 0.04 } }, coat: { back: '#5a5e62', side: '#8a8e92', belly: '#d8dadc', fin: '#5a5e62', spots: '#3a3e42' } },
      seal: PINNIPED,
      walrus: derive(PINNIPED, { L: 3.2, depth: 0.28, width: 0.3, snout: 0.95, tusksW: 0.14, upright: 0.5, creases: true, fins: { flipper: { at: 0.64, len: 0.15, h: 0.08 } }, coat: { back: '#8a6a58', side: '#a07a64', belly: '#b08a74', fin: '#6a4a38', spots: null } }),
      'sea-lion': derive(PINNIPED, { L: 2.2, depth: 0.2, width: 0.2, snout: 0.6, upright: true, coat: { back: '#5a4030', side: '#6a4a38', belly: '#7a5a44', fin: '#3a2a20', spots: null } }),
      manatee: { L: 3.2, depth: 0.25, width: 0.27, beak: 0, snout: 0.95, kind: 'mammal', fins: { dorsal: null, flipper: { len: 0.1, h: 0.05 }, caudal: { type: 'paddle', h: 0.25, len: 0.15 } }, eyes: { r: 0.005, t: 0.93 }, whiskers: true, coat: { back: '#7a7470', side: '#8a8480', belly: '#9a9490', fin: '#6a6460' } },
    },
  },
};

/* ------------------------------------------------------------------ */

function finShape(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

function finGeo(outline, thick) {
  const g = new THREE.ExtrudeGeometry(finShape(outline), { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.4, bevelSize: thick * 0.5, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -thick / 2);
  g.computeVertexNormals();
  return g;
}

function smoothOutline(pts, n = 6) {
  // Catmull-Rom through the points (closed) for organic fin edges
  const c = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal');
  return c.getPoints(pts.length * n).map((p) => [p.x, p.y]);
}

function applyAquaTrim(S, trim) {
  switch (trim) {
    case 'juvenile':
      return derive(S, { L: S.L * 0.4, depth: S.depth * 1.18, eyes: { r: S.eyes.r * 1.8 }, snout: Math.min(1, S.snout + 0.3), coat: { bars: S.coat.bars ?? { color: '#2a2a2a', n: 7 }, back: S.coat.side ?? S.coat.back, spots: null } });
    case 'fancy-fins':
      return derive(S, { fins: Object.fromEntries(Object.entries(S.fins).filter(([, f]) => f).map(([k, f]) => [k, { ...f, h: (f.h ?? 0.1) * (k === 'caudal' ? 1.9 : 1.6), len: (f.len ?? 0.1) * 1.3 }])) });
    case 'fat':
    case 'heavy':
      return derive(S, { depth: S.depth * 1.22, width: S.width * 1.3 });
    case 'slim':
      return derive(S, { depth: S.depth * 0.82, width: S.width * 0.82, L: S.L * 1.05 });
    case 'big':
      return derive(S, { L: S.L * 1.5, depth: S.depth * 1.1, width: S.width * 1.1 });
    default:
      return S;
  }
}

export function buildAquatic(name, S0, opts = {}) {
  const S = applyAquaTrim(S0, opts.trim);
  const seed = opts.seed ?? name;
  const nz = noise3(rng(`${seed}-n`));
  const L = S.L;
  const dep = S.depth * L;
  const wid = S.width * L;
  const root = new THREE.Group();
  root.name = `animal-${name}`;
  const seal = S.kind === 'seal';
  const y0 = seal ? dep * 0.48 : dep * 0.9 + L * 0.05;
  const zt = -L * 0.5;
  const zh = L * 0.5;
  const pts = [];
  for (let k = 0; k <= 6; k++) {
    const t = k / 6;
    const lift = seal && S.upright ? smooth01((t - 0.6) / 0.4) * dep * 1.1 * (S.upright === true ? 1 : S.upright) : 0;
    pts.push(new THREE.Vector3(0, y0 + lift + (seal ? -smooth01((0.25 - t) / 0.25) * dep * 0.15 : 0), lerp(zt, zh, t)));
  }
  const curve = spline(pts);
  const ped = S.peduncle * L;
  const snout = S.snout;
  const sec = (t) => {
    // body envelope: thin peduncle at the tail → max depth ≈ 0.6 → rounded / pointed head
    const env = t < 0.62 ? smooth01(t / 0.62) ** 0.9 : 1 - ((t - 0.62) / 0.38) ** (1.3 + snout * 1.6);
    const e = Math.max(0, Math.sqrt(Math.max(0, env)));
    let w = Math.max(ped * 0.6, wid * 0.5 * e);
    let up = Math.max(ped, dep * 0.5 * e);
    let dn = Math.max(ped, dep * 0.5 * e * (S.belly ?? 1));
    if (S.flatHead && t > 0.7) {
      const k = smooth01((t - 0.7) / 0.2);
      w *= 1 + 0.25 * k;
      up *= 1 - 0.3 * k;
    }
    if (S.hammer && t > 0.93) {
      const k = smooth01((t - 0.93) / 0.03);
      w = lerp(w, S.hammer * L * 0.5, k);
      up *= 1 - 0.55 * k;
      dn *= 1 - 0.55 * k;
    }
    if (S.melon) up *= 1 + S.melon * bump(t, 0.9, 0.04);
    if (S.beak && t > 0.94) {
      const k = smooth01((t - 0.94) / 0.02);
      w = lerp(w, w * 0.4, k);
      up = lerp(up, up * 0.32, k);
      dn = lerp(dn, dn * 0.4, k);
    }
    if (t > 0.985) {
      const k = (t - 0.985) / 0.015;
      w *= 1 - 0.5 * k;
      up *= 1 - 0.5 * k;
      dn *= 1 - 0.5 * k;
    }
    return { w, up, dn, e: S.kind === 'fish' ? 2.1 : 2 };
  };
  // extend the tip for the beak (dolphin rostrum) by pushing the end of the curve
  const body = loft(curve, sec, {
    n: 110,
    ring: 28,
    displace: (t, a, p) => {
      let d = 0;
      if (S.knobs && t > 0.85) d += dep * 0.03 * Math.max(0, nz(p.x * 30 / L, p.y * 30 / L, p.z * 30 / L) - 0.55) * 6 * (Math.cos(a) > 0 ? 1 : 0);
      if (S.grooves && Math.cos(a) < -0.3 && t > 0.62 && t < 0.92) d -= dep * 0.006 * Math.abs(Math.sin(a * 40));
      if (S.spines) d += dep * 0.08 * Math.max(0, Math.sin(t * 70) * Math.sin(a * 9)) ** 6 * (t > 0.3 && t < 0.92 ? 1 : 0);
      if (S.creases) d += dep * 0.015 * (fbm(nz, p.x * 20 / L, p.y * 20 / L, p.z * 20 / L, 3) - 0.5);
      return d;
    },
  });

  // bones along the spine
  const rig = new Rig();
  const nb = 6;
  const names = [];
  for (let k = 0; k < nb; k++) {
    const t = 1 - k / nb;
    const n = `spine${k}`;
    rig.add(n, curve.getPointAt(Math.min(0.999, t - 0.08)).toArray(), k ? names[k - 1] : null);
    names.push(n);
  }
  const starts = names.map((_, k) => 1 - (k + 1) / nb - 0.08);
  const boneIdx = names.map((n) => rig.index(n));
  const wAt = (t) => chain(1 - t, boneIdx, names.map((_, k) => k / nb + 0.0), 0.06);
  void starts;
  {
    const lt = body.attributes.lt.array;
    applySkin(body, (i) => wAt(lt[i]));
  }

  // --- paint body ---
  const cc = S.coat;
  const back = C(S.color ?? cc.back);
  const side = C(cc.side ?? cc.back);
  const belly = C(cc.belly);
  const sy = body.attributes.sy.array;
  const sx = body.attributes.sx.array;
  const ltB = body.attributes.lt.array;
  paint(body, (i, p, n) => {
    const t = ltB[i];
    const y = sy[i];
    let c = belly.clone().lerp(side, smooth01((y + 0.55) / 0.35)).lerp(back, smooth01((y - 0.25) / 0.4));
    if (cc.stripe) c.lerp(C(cc.stripe), smooth01((0.12 - Math.abs(y + 0.02)) / 0.06) * smooth01((t - 0.1) / 0.1) * smooth01((0.9 - t) / 0.05) * 0.85);
    if (cc.bars) {
      const nb2 = cc.bars.n;
      const band = Math.sin(t * Math.PI * nb2 * 1.6 + 0.6);
      const v = smooth01((band - 0.75) / 0.05);
      if (cc.bars.edge) c.lerp(C(cc.bars.edge), smooth01((band - 0.62) / 0.03) * (1 - v));
      c.lerp(C(cc.bars.color), v * (t > 0.08 && t < 0.92 ? 1 : 0));
    }
    if (cc.spots) c.lerp(C(cc.spots), smooth01((nz(p.x * 120 / L, p.y * 120 / L, p.z * 120 / L) - 0.7) / 0.04) * smooth01((y + 0.3) / 0.3));
    if (cc.patches) c.lerp(C(cc.patches), smooth01((fbm(nz, p.x * 8 / L + 3, p.y * 8 / L, p.z * 8 / L, 3) - 0.52) / 0.03) * smooth01((y + 0.2) / 0.3));
    if (cc.tigerBack) c.lerp(C(cc.tigerBack), smooth01((Math.sin(t * 90 + Math.sin(y * 6) * 2) - 0.3) / 0.2) * smooth01((y - 0.25) / 0.2));
    if (cc.tail) c.lerp(C(cc.tail), smooth01((0.12 - t) / 0.05));
    if (cc.orca) {
      // white eye patch + white belly lobe
      const eye = smooth01((0.06 - Math.hypot((t - 0.83) * 1.2, (y - 0.25) * 0.08)) / 0.02) * smooth01((Math.abs(sx[i]) - 0.4) / 0.2);
      const lobe = smooth01((-y - 0.25) / 0.2) * smooth01((t - 0.25) / 0.05) + smooth01((-y + 0.1) / 0.2) * bump(t, 0.38, 0.06) * smooth01((Math.abs(sx[i]) - 0.3) / 0.3);
      c = c.lerp(C('#f6f6f4'), Math.min(1, eye + lobe * 0.9));
    }
    // gill line / gill slits
    if (S.kind === 'fish') c.multiplyScalar(1 - 0.35 * bump(t, 0.79, 0.006) * smooth01((Math.abs(sx[i]) - 0.3) / 0.3));
    if (S.gills) for (let g = 0; g < S.gills; g++) c.multiplyScalar(1 - 0.4 * bump(t, 0.8 - g * 0.012, 0.0025) * smooth01((Math.abs(sx[i]) - 0.6) / 0.2) * smooth01((0.45 - Math.abs(y)) / 0.2));
    // mouth line
    c.multiplyScalar(1 - 0.5 * smooth01((t - 0.93) / 0.01) * smooth01((0.07 - Math.abs(y + (S.mouth === 'big' ? 0.15 : 0.25))) / 0.03));
    // scale sheen
    if (S.kind === 'fish') c.multiplyScalar(0.94 + 0.12 * Math.abs(Math.sin(t * 160 + y * 20) * Math.sin(y * 40)));
    return c.multiplyScalar(0.96 + 0.08 * nz(p.x * 60 / L, p.y * 60 / L, p.z * 60 / L));
  });

  // --- fins ---
  const finMat = new THREE.MeshPhysicalMaterial({ name: 'fin', color: C(S.color ?? cc.fin), roughness: S.kind === 'fish' ? 0.35 : 0.5, transmission: 0, side: THREE.DoubleSide, sheen: S.kind === 'fish' ? 0.3 : 0 });
  const fins = [];
  const fat = (t) => surfacePoint(curve, sec, t, 0);
  const F = S.fins;
  const thick = L * (S.kind === 'fish' ? 0.004 : 0.012);
  const boneFor = (t) => names[Math.min(nb - 1, Math.max(0, Math.round((1 - t) * nb - 0.5)))];
  const addFin = (g, t, mat = finMat) => {
    const m = new THREE.Mesh(g, mat);
    m.name = 'fin';
    fins.push([m, boneFor(t)]);
    return m;
  };
  // dorsal(s) & anal: outlines in the YZ plane (x = thickness)
  const vfin = (f, top) => {
    if (!f) return;
    const base = (top ? fat(f.at) : surfacePoint(curve, sec, f.at, Math.PI)).p;
    const len = f.len * L;
    const h = f.h * L * (top ? 1 : -1);
    const fal = f.falcate ?? 0.15;
    const out = smoothOutline([[len * 0.5, -0.02 * h], [len * 0.15, h * 0.7], [-len * 0.2 - fal * len, h], [-len * 0.25, h * 0.35], [-len * 0.5, -0.02 * h]], 4);
    const g = finGeo(out.map(([z, y]) => [z, y]), thick);
    // ExtrudeGeometry builds in XY → map X→Z, Y→Y, Z→X
    g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1));
    g.translate(base.x, base.y - h * 0.08, base.z);
    addFin(g, f.at);
  };
  vfin(F.dorsal, true);
  vfin(F.dorsal2, true);
  vfin(F.anal, false);
  // paired fins (pectoral / pelvic / flippers): outline in XZ plane, angled down/out
  const pfin = (f, angDown = 0.5) => {
    if (!f) return;
    for (const s2 of [1, -1]) {
      const sp = surfacePoint(curve, sec, f.at, s2 * (S.kind === 'seal' ? 2.45 : 1.9));
      const len = f.len * L;
      const h = f.h * L;
      // seals: flippers splay out to the sides with the tips just meeting the ground (belly
      // stays on the ground); sea lions / walrus prop the raised chest on them
      let ang = angDown;
      if (S.kind === 'seal') {
        const groundY = y0 - dep * 0.5 * (S.belly ?? 1);
        const drop = Math.max(0, sp.p.y - groundY - h * 0.15);
        ang = Math.asin(Math.min(1, Math.max(0.12, drop / (len * (S.upright ? 0.95 : 1.05)))));
      }
      const sweep = f.sweep ?? 0.3;
      const out = smoothOutline([[0, h * 0.5], [len * 0.9, -sweep * len * 0.3], [len, -sweep * len - h * 0.2], [len * 0.6, -sweep * len * 0.7 - h * 0.45], [0, -h * 0.5]], 4);
      const g = finGeo(out, thick * 1.2);
      g.rotateX(Math.PI / 2);
      g.rotateZ(-s2 * ang);
      if (s2 < 0) g.scale(-1, 1, 1);
      g.translate(sp.p.x - s2 * wid * 0.04, sp.p.y, sp.p.z);
      addFin(g, f.at);
    }
  };
  pfin(F.pectoral, 0.55);
  pfin(F.pelvic, 0.9);
  pfin(F.flipper, S.kind === 'seal' ? 1.3 : 0.6);
  if (F.finlets) {
    for (let k = 0; k < 6; k++) {
      const t = 0.1 + k * 0.03;
      for (const top of [true, false]) {
        const b = top ? fat(t).p : surfacePoint(curve, sec, t, Math.PI).p;
        const g = new THREE.ConeGeometry(L * 0.006, L * 0.02, 4);
        g.rotateX(top ? -0.6 : Math.PI + 0.6);
        g.translate(b.x, b.y + (top ? L * 0.008 : -L * 0.008), b.z);
        addFin(g, t, new THREE.MeshStandardMaterial({ color: '#d8c040', roughness: 0.5 }));
      }
    }
  }
  // caudal fin
  {
    const cf = F.caudal;
    const tail = curve.getPointAt(0);
    const h = cf.h * L;
    const len = (cf.len ?? 0.15) * L;
    let out;
    let horizontal = false;
    switch (cf.type) {
      case 'lunate':
        out = [[0, ped], [-len * 0.6, h * 0.55], [-len, h * 0.62], [-len * 0.55, h * 0.1], [-len * 0.55, -h * 0.1], [-len, -h * 0.62], [-len * 0.6, -h * 0.55], [0, -ped]];
        break;
      case 'heterocercal':
        out = [[0, ped * 1.2], [-len * 0.75, h * 0.62], [-len, h * 0.7], [-len * 0.55, h * 0.1], [-len * 0.5, -h * 0.05], [-len * 0.62, -h * 0.4], [-len * 0.35, -h * 0.3], [0, -ped]];
        break;
      case 'round':
        out = smoothOutline([[0, ped], [-len * 0.6, h * 0.42], [-len, h * 0.2], [-len * 1.05, 0], [-len, -h * 0.2], [-len * 0.6, -h * 0.42], [0, -ped]], 3);
        break;
      case 'square':
        out = [[0, ped], [-len * 0.8, h * 0.45], [-len, h * 0.42], [-len, -h * 0.42], [-len * 0.8, -h * 0.45], [0, -ped]];
        break;
      case 'fan':
        out = smoothOutline([[0, ped], [-len * 0.4, h * 0.45], [-len * 0.9, h * 0.55], [-len, h * 0.2], [-len * 0.85, 0], [-len, -h * 0.2], [-len * 0.9, -h * 0.55], [-len * 0.4, -h * 0.45], [0, -ped]], 3);
        break;
      case 'lyre':
        out = [[0, ped], [-len * 0.5, h * 0.4], [-len, h * 0.62], [-len * 0.45, h * 0.12], [-len * 0.45, -h * 0.12], [-len, -h * 0.62], [-len * 0.5, -h * 0.4], [0, -ped]];
        break;
      case 'flukes':
      case 'paddle':
      case 'hind':
        horizontal = true;
        out = cf.type === 'paddle'
          ? smoothOutline([[0, ped], [-len * 0.4, h * 0.5], [-len, h * 0.35], [-len * 1.1, 0], [-len, -h * 0.35], [-len * 0.4, -h * 0.5], [0, -ped]], 3)
          : cf.type === 'hind'
            ? smoothOutline([[0, ped], [-len * 0.6, h * 0.45], [-len, h * 0.55], [-len * 0.85, h * 0.1], [-len * 0.85, -h * 0.1], [-len, -h * 0.55], [-len * 0.6, -h * 0.45], [0, -ped]], 3)
            : smoothOutline([[0, ped], [-len * 0.35, h * 0.3], [-len * 0.8, h * 0.52], [-len, h * 0.5], [-len * 0.6, h * 0.05], [-len * 0.62, 0], [-len * 0.6, -h * 0.05], [-len, -h * 0.5], [-len * 0.8, -h * 0.52], [-len * 0.35, -h * 0.3], [0, -ped]], 3);
        break;
      default: // fork
        out = [[0, ped], [-len * 0.55, h * 0.4], [-len, h * 0.5], [-len * 0.6, h * 0.05], [-len * 0.6, -h * 0.05], [-len, -h * 0.5], [-len * 0.55, -h * 0.4], [0, -ped]];
    }
    const g = finGeo(out, thick * (horizontal ? 1.5 : 1));
    if (horizontal) {
      // outline (z, x) in the XZ plane
      g.applyMatrix4(new THREE.Matrix4().set(0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1));
    } else g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1));
    g.translate(tail.x, tail.y, tail.z + ped * 0.8);
    addFin(g, 0, finMat);
  }

  // --- head parts: eyes, barbels, bill, tusks, whiskers ---
  const headBone = names[0];
  const headParts = [];
  const eyeR = S.eyes.r * L;
  for (const s2 of [1, -1]) {
    const sp = surfacePoint(curve, sec, S.eyes.t, s2 * (S.eyes.a ?? 1.25));
    const at = sp.p.clone().addScaledVector(sp.n, -eyeR * 0.45);
    headParts.push(buildEye(at, sp.n, eyeR, { color: S.eyes.color, pupil: S.kind === 'fish' ? 'round' : 'none', lid: S.kind === 'fish' ? '#2a2a26' : '#1a1a1a', lidSquint: S.kind === 'fish' ? 1 : 0.7 }));
  }
  const tip = curve.getPointAt(1);
  if (S.bill) {
    const g = loft(spline([tip.clone().add(new THREE.Vector3(0, 0, -L * 0.02)), tip.clone().add(new THREE.Vector3(0, 0, S.bill * L))]), (t) => ({ w: L * 0.012 * (1 - 0.9 * t), up: L * 0.007 * (1 - 0.9 * t), dn: L * 0.007 * (1 - 0.9 * t), e: 2 }), { n: 12, ring: 10 });
    paint(g, () => C(cc.back));
    headParts.push(new THREE.Mesh(g, finMat.clone()));
    headParts[headParts.length - 1].material.vertexColors = true;
  }
  if (S.beak) {
    // dolphin rostrum
    const g = loft(spline([tip.clone().add(new THREE.Vector3(0, -dep * 0.08, -L * 0.03)), tip.clone().add(new THREE.Vector3(0, -dep * 0.1, S.beak * L))]), (t) => ({ w: wid * 0.14 * (1 - 0.35 * t), up: dep * 0.09 * (1 - 0.4 * t), dn: dep * 0.09 * (1 - 0.4 * t), e: 2 }), { n: 12, ring: 16 });
    paint(g, (i, p, n) => C(cc.side ?? cc.back).lerp(C(cc.belly), smooth01(-n.y)));
    const m = new THREE.Mesh(g, furMaterial({ roughness: 0.4, sheen: 0 }));
    headParts.push(m);
  }
  if (S.tusk) {
    const pts2 = [];
    for (let k = 0; k <= 10; k++) pts2.push(tip.clone().add(new THREE.Vector3(L * 0.01, 0, -L * 0.02 + (k / 10) * S.tusk * L)));
    const g = loft(spline(pts2), (t) => ({ w: L * 0.008 * (1 - 0.85 * t), up: L * 0.008 * (1 - 0.85 * t), dn: L * 0.008 * (1 - 0.85 * t), e: 2 }), { n: 40, ring: 10, displace: (t, a) => L * 0.0015 * Math.sin(a * 2 + t * 120) });
    const col = new Float32Array(g.attributes.position.count * 3).fill(0.92);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    headParts.push(new THREE.Mesh(g, hornMaterial()));
  }
  if (S.tusksW) {
    for (const s2 of [1, -1]) {
      const b0 = surfacePoint(curve, sec, 0.975, s2 * 2.4).p;
      const g = loft(spline([b0, b0.clone().add(new THREE.Vector3(s2 * L * 0.005, -S.tusksW * L * 0.5, L * 0.01)), b0.clone().add(new THREE.Vector3(0, -S.tusksW * L, L * 0.0))]), (t) => ({ w: L * 0.012 * (1 - 0.7 * t), up: L * 0.012 * (1 - 0.7 * t), dn: L * 0.012 * (1 - 0.7 * t), e: 2 }), { n: 16, ring: 10, lateral: 'free' });
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(0.9), 3));
      headParts.push(new THREE.Mesh(g, hornMaterial()));
    }
  }
  if (S.barbels || S.whiskers) {
    const wm = new THREE.MeshStandardMaterial({ color: S.whiskers ? '#e8e2d8' : cc.back, roughness: 0.6 });
    const n2 = S.whiskers ? 5 : 2;
    for (const s2 of [1, -1]) {
      for (let k = 0; k < n2; k++) {
        const sp = surfacePoint(curve, sec, 0.975, s2 * (1.9 + k * 0.12));
        const dir = sp.n.clone().add(new THREE.Vector3(0, -0.4, -0.5)).normalize();
        const len = L * (S.whiskers ? 0.06 : 0.07);
        const g = loft(spline([sp.p.clone().addScaledVector(sp.n, -L * 0.002), sp.p.clone().addScaledVector(dir, len * 0.5), sp.p.clone().addScaledVector(dir, len).add(new THREE.Vector3(0, -len * 0.2, 0))]), (t) => ({ w: L * 0.0022 * (1 - 0.8 * t), up: L * 0.0022 * (1 - 0.8 * t), dn: L * 0.0022 * (1 - 0.8 * t), e: 2 }), { n: 8, ring: 5, lateral: 'free' });
        headParts.push(new THREE.Mesh(g, wm));
      }
    }
  }
  if (S.mouth === 'teeth') {
    const tm = new THREE.MeshStandardMaterial({ color: '#f2f0e8', roughness: 0.4 });
    for (let k = 0; k < 8; k++) {
      for (const s2 of [1, -1]) {
        const sp = surfacePoint(curve, sec, 0.94 + k * 0.006, s2 * 2.0);
        const g = new THREE.ConeGeometry(L * 0.003, L * 0.009, 4);
        g.rotateX(Math.PI);
        const m = new THREE.Mesh(g, tm);
        m.position.copy(sp.p).addScaledVector(sp.n, -L * 0.002);
        headParts.push(m);
      }
    }
  }

  // --- assemble ---
  root.add(rig.get(names[names.length - 1]) === rig.get(names[0]) ? rig.get(names[0]) : rig.get(names[0]));
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(rig.bones);
  const mat = new THREE.MeshPhysicalMaterial({ name: 'primary', vertexColors: true, roughness: S.kind === 'fish' ? 0.32 : 0.45, metalness: 0, clearcoat: S.kind === 'fish' ? 0.6 : 0.3, clearcoatRoughness: 0.3, sheen: S.kind === 'seal' ? 0.5 : 0 });
  root.add(skinnedMesh(body, mat, skeleton, 'body_mesh'));
  for (const [m, bone] of fins) {
    const w = rig.world[bone];
    m.geometry.translate(-w.x, -w.y, -w.z);
    rig.get(bone).add(m);
  }
  const hw = rig.world[headBone];
  for (const p of headParts) {
    if (p.isGroup || p.position.lengthSq() > 0) p.position.sub(hw);
    else p.geometry.translate(-hw.x, -hw.y, -hw.z);
    rig.get(headBone).add(p);
  }
  if (!seal) root.userData.floating = true;
  else {
    // rest exactly on the ground
    root.updateMatrixWorld(true);
    const bx = new THREE.Box3().setFromObject(root);
    rig.get(names[0]).position.y -= bx.min.y;
    root.traverse((o) => {
      if (o.isSkinnedMesh) o.boundingBox = o.boundingSphere = null;
    });
  }

  // --- animations: swim wave (yaw for fish, pitch for whales/dolphins) ---
  const axis = S.kind === 'mammal' ? 0 : 1;
  const per = S.kind === 'fish' ? 0.7 : S.kind === 'shark' ? 1.6 : 2.2 * Math.sqrt(L / 2.5);
  const wave = (amp) => {
    const spec = {};
    names.forEach((n, k) => {
      const a = amp * (0.15 + (k / nb) ** 1.6);
      spec[n] = (t) => {
        const v = a * Math.sin(TAU * t - k * 0.9);
        return axis === 1 ? [0, v, 0] : [v, 0, 0];
      };
    });
    return spec;
  };
  const make = (nm, period, spec, steps = 32) => clip(nm, period, Object.entries(spec).map(([node, fn]) => (node === 'pos' ? offsetTrack(rig.get(names[0]), period, fn, steps) : poseTrack(rig.get(node), period, fn, steps))));
  const clips = [];
  if (seal) {
    clips.push(make('idle', 4, { spine0: (t) => [0.15 * Math.sin(TAU * t) - 0.2, 0.3 * Math.sin(TAU * t * 0.5), 0], spine5: (t) => [-0.15 * Math.sin(TAU * t), 0, 0] }));
    clips.push(make('crawl', 1.2, { pos: (t) => [0, Math.abs(Math.sin(TAU * t)) * dep * 0.08, 0], spine1: (t) => [0.15 * Math.sin(TAU * t), 0, 0], spine3: (t) => [-0.2 * Math.sin(TAU * t), 0, 0], spine5: (t) => [0.15 * Math.sin(TAU * t), 0, 0] }));
    clips.push(make('swim', 1.6, wave(0.25)));
  } else {
    clips.push(make('swim', per, wave(S.kind === 'fish' ? 0.22 : 0.12)));
    clips.push(make('idle', per * 3, wave(0.05)));
  }
  root.userData.clips = clips;
  return root;
}
