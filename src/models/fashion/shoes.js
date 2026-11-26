// Shoes: a pair of shoes built from a parametric last (footprint × section profile).
// The upper is an open surface (the collar opening is cut out of the section), sitting on an
// extruded sole that follows the heel lift and toe spring.
import { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, lathe, smoothKeys, paramGeo, taperTube, spow, setup, done, fabricMat, rng } from './common.js';
import { clip, rotateTrack, wave } from '../../core/animation.js';

/* L length, W width, st sole, hh heel lift, hu collar height, hi instep, ht toe box, th opening angle at heel,
   tl lace gap angle, uT throat (front end of opening), laces [u0,u1], shaft height, toe 0 round → 1 pointy */
export const SHOE_VARIANTS = {
  sneakers: { L: 0.29, W: 0.105, st: 0.03, hh: 0, hu: 0.072, hi: 0.092, ht: 0.055, th: 0.95, tl: 0.32, uT: 0.62, laces: [0.36, 0.6], toe: 0.1, fab: 'canvas', c: '#f4f4f2', sc: '#f7f7f5', c2: '#1d4fa0', stripe: true, cap: true },
  'high-tops': { L: 0.29, W: 0.105, st: 0.03, hh: 0, hu: 0.07, hi: 0.092, ht: 0.055, th: 0.95, tl: 0.32, uT: 0.62, laces: [0.3, 0.6], toe: 0.1, shaft: 0.14, fab: 'canvas', c: '#b3202a', sc: '#f4efe2', c2: '#f4efe2', cap: true, patch: true },
  running: { L: 0.29, W: 0.1, st: 0.024, stHeel: 1.55, hh: 0, hu: 0.065, hi: 0.085, ht: 0.045, th: 0.95, tl: 0.3, uT: 0.6, laces: [0.36, 0.58], toe: 0.3, fab: 'knit', c: '#2f6fd0', c2: '#ff6a3d', sc: '#f2f2f0', stripe: true, midsole: true },
  boots: { L: 0.3, W: 0.115, st: 0.035, hh: 0, hu: 0.085, hi: 0.1, ht: 0.06, th: 0.95, tl: 0.32, uT: 0.58, laces: [0.32, 0.56], toe: 0.05, shaft: 0.19, fab: 'leather', c: '#8a5a2e', sc: '#2a2420', c2: '#d9a441', lugs: true, hooks: true },
  chelsea: { L: 0.3, W: 0.105, st: 0.025, hh: 0.012, hu: 0.08, hi: 0.1, ht: 0.05, th: 0.9, tl: 0, uT: 0.36, toe: 0.35, shaft: 0.17, fab: 'suede', c: '#6b4a32', sc: '#3a2a20', c2: '#1d1d1f', elastic: true, tab: true },
  hiking: { L: 0.3, W: 0.115, st: 0.042, hh: 0, hu: 0.085, hi: 0.1, ht: 0.06, th: 0.95, tl: 0.3, uT: 0.58, laces: [0.32, 0.56], toe: 0.05, shaft: 0.15, fab: 'suede', c: '#7a7f86', sc: '#2a2a2c', c2: '#e2662b', lugs: true, hooks: true, padded: true, cap: true },
  heels: { L: 0.25, W: 0.082, st: 0.008, hh: 0.095, hu: 0.055, hi: 0.03, ht: 0.034, th: 1.75, tl: 0, uT: 0.58, toe: 0.9, fab: 'leather', c: '#1b1b1d', sc: '#7a1f2b', stiletto: true },
  pumps: { L: 0.25, W: 0.085, st: 0.01, hh: 0.06, hu: 0.05, hi: 0.03, ht: 0.036, th: 1.7, tl: 0, uT: 0.56, toe: 0.45, fab: 'suede', c: '#c43a4a', sc: '#2a1a1a', block: true, strap: true },
  sandals: { L: 0.27, W: 0.1, st: 0.022, hh: 0.008, toe: 0.15, fab: 'leather', c: '#8a5a2e', sc: '#c9a173', c2: '#b9905a', sandal: true },
  'flip-flops': { L: 0.27, W: 0.1, st: 0.018, hh: 0, toe: 0.05, fab: 'rubber', c: '#2a8fb8', sc: '#f2c94c', flip: true },
  loafers: { L: 0.285, W: 0.1, st: 0.012, hh: 0.018, hu: 0.05, hi: 0.06, ht: 0.046, th: 1.2, tl: 0, uT: 0.5, toe: 0.3, fab: 'leather', c: '#5a2e1d', sc: '#2a1a14', block: true, apron: true, penny: true },
  oxfords: { L: 0.29, W: 0.098, st: 0.012, hh: 0.02, hu: 0.06, hi: 0.072, ht: 0.044, th: 0.95, tl: 0.1, uT: 0.56, laces: [0.38, 0.54], toe: 0.45, fab: 'leather', c: '#1c1715', sc: '#1a1412', block: true, capSeam: true },
  slippers: { L: 0.28, W: 0.11, st: 0.026, hh: 0, hu: 0.0, hi: 0.07, ht: 0.06, th: Math.PI, tl: 0, uT: 0.42, toe: 0, fab: 'velvet', c: '#5a3b6b', sc: '#e8dcc8', c2: '#f4ede2', fur: true, mule: true },
};

export const SHOE_TRIMS = {
  'black-leather': { fab: 'leather', c: '#141416', c2: '#141416', sc: '#141416', soleK: 0.8, toe: 0.35 },
  'tan-suede': { fab: 'suede', c: '#b8885a', c2: '#8e6440', sc: '#c58a3c', soleK: 1.25, gum: true },
  'white-canvas': { fab: 'canvas', c: '#f6f5f0', c2: '#c8323a', sc: '#f4f4f0', soleK: 0.9, sideStripe: true },
  'patent-red': { fab: 'patent', c: '#b5121b', c2: '#7c0a10', sc: '#1a1a1a', toe: 0.85, soleK: 0.85 },
  platform: { fab: 'leather', c: '#b8a3d6', c2: '#f5f0fa', sc: '#f5f0fa', soleK: 2.8 },
  chunky: { fab: 'canvas', c: '#e9e4da', c2: '#8f9aa6', sc: '#efeae0', soleK: 2, wid: 1.1, sculpt: true, toe: 0 },
  metallic: { fab: 'metallic', c: '#c9ccd2', c2: '#9da1a8', sc: '#2a2a2c', toe: 0.7 },
  denim: { fab: 'denim', c: '#3a5a8a', c2: '#d9a441', sc: '#f2efe6' },
  floral: { fab: 'floral', c: '#f6e6ea', c2: '#d4507a', c3: '#5e9a52', sc: '#f6e6ea' },
  neon: { fab: 'neon', c: '#b8ff1f', c2: '#ff2fa0', sc: '#1a1a1c', soleK: 1.15 },
  kids: { fab: 'canvas', c: '#ffb703', c2: '#219ebc', sc: '#fb5607', scale: 0.62, wid: 1.12, toe: 0, soleK: 1.2, velcro: true },
  snakeskin: { fab: 'snake', c: '#c9b48a', c2: '#5a4a32', sc: '#2a2420', toe: 0.85 },
};

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Builds one (right) shoe in a group; toe points +Z, heel at z=0. */
export function buildShoe(T, mats) {
  const g = group('shoe');
  const L = T.L;
  const W = T.W * (T.wid ?? 1);
  const soleK = T.soleK ?? 1;
  const st0 = T.st * soleK;
  const hh = T.hh;
  const pointy = T.toe ?? 0.2;
  const baseW = smoothKeys([[0, 0.66], [0.15, 0.74], [0.35, 0.7], [0.58, 0.9], [0.72, 1], [0.84, 0.95], [1, 0.7]]);
  const tStart = 0.8 - pointy * 0.08;
  const hw = (u) => {
    let k = baseW(u) * W / 2;
    if (u < 0.08) k *= Math.sqrt(Math.max(0, 1 - (1 - u / 0.08) ** 2));
    if (u > tStart) { const t = (u - tStart) / (1 - tStart); k *= Math.max(0, 1 - t ** (2.2 - pointy * 1.1)) ** (0.5 + pointy * 0.25); }
    return Math.max(k, 1e-4);
  };
  const lift = (u) => hh * (1 - smooth(0.22, 0.66, u)) + 0.012 * smooth(0.86, 1, u) ** 2 * (hh > 0.03 ? 0.4 : 1);
  const stAt = (u) => st0 * (hh > 0.03 ? 1 : 1 + ((T.stHeel ?? 1) - 1) * (1 - smooth(0.2, 0.75, u)));
  const yTop = (u) => lift(u) + stAt(u);

  // sole: extruded footprint, deformed to the heel lift / toe spring
  const n = 40;
  const outline = [];
  const sx = 1.02 + (T.sculpt ? 0.06 : 0);
  for (let i = 0; i <= n; i++) { const u = i / n; outline.push([hw(u) * sx, -u * L]); }
  for (let i = n - 1; i >= 1; i--) { const u = i / n; outline.push([-hw(u) * sx, -u * L]); }
  const soleG = extrudeOutline(outline, 1, { bevel: 0.004, segments: 2 });
  soleG.rotateX(-Math.PI / 2);
  soleG.translate(0, 0.5, 0);
  {
    const p = soleG.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = Math.min(1, Math.max(0, p.getZ(i) / L));
      const y = p.getY(i);
      // under a high heel only the forefoot reaches the ground
      p.setY(i, lift(u) + y * stAt(u));
    }
    soleG.computeVertexNormals();
  }
  mesh(soleG, mats.sole, { parent: g, name: 'sole' });
  if (T.midsole || T.gum || T.sideStripe) {
    const ms = soleG.clone();
    const p = ms.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = Math.min(1, Math.max(0, p.getZ(i) / L)); const yy = (p.getY(i) - lift(u)) / stAt(u); p.setX(i, p.getX(i) * 1.012); p.setZ(i, (p.getZ(i) - L / 2) * 1.008 + L / 2); p.setY(i, lift(u) + stAt(u) * (0.35 + yy * 0.25)); }
    ms.computeVertexNormals();
    mesh(ms, T.gum ? M.matte('#a8652a', 0.7) : mats.accent, { parent: g, name: 'midsole' });
  }
  if (T.lugs || T.sculpt) {
    for (let i = 0; i < 9; i++) {
      const u = 0.06 + i * 0.105;
      if (lift(u) > 0.005) continue;
      mesh(roundedBox(hw(u) * 2.05, 0.008, 0.016, 0.003), mats.sole, { parent: g, at: [0, 0.004 + lift(u) * 0, u * L], name: 'lug' });
    }
  }

  if (T.flip || T.sandal) {
    // footbed + straps
    const bed = mats.bed;
    const bedG = extrudeOutline(outline.map(([x, z]) => [x * 0.93, z * 0.985 - 0.002]), 0.004, { bevel: 0.0015, segments: 1 });
    bedG.rotateX(-Math.PI / 2);
    const p = bedG.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = Math.min(1, Math.max(0, p.getZ(i) / L)); p.setY(i, p.getY(i) + yTop(u) + 0.0015); }
    bedG.computeVertexNormals();
    mesh(bedG, bed, { parent: g, name: 'footbed' });
    const sy = (u) => yTop(u) + 0.003;
    if (T.flip) {
      const post = [0.03 * W, sy(0.78), 0.78 * L];
      for (const s of [-1, 1]) curveTube([post, [s * hw(0.62) * 0.6, sy(0.6) + 0.028, 0.62 * L], [s * hw(0.5) * 0.98, sy(0.5) + 0.008, 0.5 * L], [s * hw(0.48) * 1.0, sy(0.48), 0.48 * L]], 0.006, mats.upper, { parent: g, segments: 20, radialSegments: 8, name: 'strap' });
      mesh(new THREE.SphereGeometry(0.009, 12, 8), mats.upper, { parent: g, at: [post[0], post[1] + 0.003, post[2]] });
    } else {
      const strap = (u, hgt, wdt) => {
        const pts = [];
        for (let i = 0; i <= 10; i++) { const a = Math.PI * (i / 10); pts.push([-Math.cos(a) * hw(u) * 0.98, sy(u) + Math.sin(a) * hgt, u * L]); }
        mesh(taperTube(pts, wdt, { flat: 0.18, side: [0, 0, 1], seg: 20, radial: 10 }), mats.upper, { parent: g, name: 'strap' });
      };
      strap(0.7, 0.03, 0.014);
      strap(0.52, 0.045, 0.012);
      // ankle strap + heel strap
      const ay = sy(0.12) + 0.06;
      const ring = [];
      for (let i = 0; i <= 16; i++) { const a = Math.PI * 2 * (i / 16); ring.push([Math.sin(a) * W * 0.42, ay, 0.11 * L + Math.cos(a) * 0.045]); }
      mesh(taperTube(ring, 0.008, { flat: 0.3, side: [0, 1, 0], seg: 32, radial: 8 }), mats.upper, { parent: g, name: 'ankle_strap' });
      mesh(taperTube([[0, sy(0.02), 0.012], [0, ay * 0.6, 0.015], [0, ay, 0.11 * L - 0.044]], 0.01, { flat: 0.3, side: [1, 0, 0], seg: 10, radial: 8 }), mats.upper, { parent: g, name: 'heel_strap' });
      for (const s of [-1, 1]) mesh(taperTube([[s * hw(0.3) * 0.97, sy(0.3), 0.3 * L], [s * W * 0.43, ay - 0.02, 0.15 * L], [s * W * 0.42, ay, 0.11 * L]], 0.007, { flat: 0.3, up: [1, 0, 0], seg: 10, radial: 8 }), mats.upper, { parent: g });
      mesh(roundedBox(0.012, 0.016, 0.004, 0.0015), M.metal('#c9a45a', 0.25), { parent: g, at: [W * 0.43, ay, 0.11 * L] });
    }
    if (hh > 0.03) addHeel(g, T, mats, lift, L, hw);
    return g;
  }

  // upper
  const hk = smoothKeys([[0, T.hu], [0.25, T.hu * 0.95], [0.45, T.hi], [0.7, T.ht], [0.9, T.ht * 0.72], [1, 0.012]]);
  const hmin = T.mule ? 0.012 : 0.01;
  const H = (u) => Math.max(hmin, hk(u) - (u > 0.97 ? 0 : 0));
  const thK = smoothKeys([[0, T.th], [0.32, T.th], [0.36, Math.max(T.tl, 0.001)], [Math.max(0.38, T.uT - 0.04), Math.max(T.tl * 0.7, 0.001)], [T.uT, 0]]);
  const th0 = (u) => (u >= T.uT ? 0 : T.tl === 0 ? T.th * (1 - smooth(T.uT - 0.12, T.uT, u)) : thK(u));
  const pS = 2.8;
  const sec = (u, th) => {
    const w = hw(u) * 0.985;
    const h = H(u);
    const s = Math.sin(th), c = Math.cos(th);
    return [w * spow(s, 2 / pS), yTop(u) - 0.003 + h * (1 + spow(c, 2 / 2.2)) / 2, u * L];
  };
  const upperG = paramGeo((u, v) => {
    const uu = 0.004 + u * 0.992;
    const t0 = th0(uu);
    const th = t0 + v * (Math.PI * 2 - 2 * t0);
    return sec(uu, th);
  }, 48, 40);
  mesh(upperG, mats.upper, { parent: g, name: 'upper' });
  // insole visible through the opening
  const ins = extrudeOutline(outline.map(([x, z]) => [x * 0.85, z * 0.97 - 0.004]), 0.004, { bevel: 0.0015, segments: 1 });
  ins.rotateX(-Math.PI / 2);
  { const p = ins.attributes.position; for (let i = 0; i < p.count; i++) { const u = Math.min(1, Math.max(0, p.getZ(i) / L)); p.setY(i, p.getY(i) + yTop(u) + 0.002); } ins.computeVertexNormals(); }
  mesh(ins, mats.lining, { parent: g, name: 'insole' });
  // collar binding along the opening edge
  const edge = [];
  const uEnd = T.uT - 0.005;
  const m2 = 24;
  for (let i = m2; i >= 0; i--) { const u = 0.004 + (uEnd - 0.004) * (i / m2); const t = th0(u); if (t > 0.02) edge.push(sec(u, t)); }
  for (let i = 0; i <= m2; i++) { const u = 0.004 + (uEnd - 0.004) * (i / m2); const t = th0(u); if (t > 0.02) edge.push(sec(u, Math.PI * 2 - t)); }
  if (edge.length > 3 && !T.mule) curveTube(edge, T.padded ? 0.009 : 0.004, T.padded ? mats.accent : mats.upper, { parent: g, segments: 60, radialSegments: 8, name: 'collar' });
  if (T.mule && T.fur) {
    const fe = [];
    for (let i = 0; i <= 20; i++) { const th = 0.0 + (i / 20) * Math.PI * 2; const u = 0.42 + 0.0; void th; }
    void fe;
    // fur band across the vamp opening edge
    const pts = [];
    for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + Math.PI * (i / 16); pts.push(sec(0.42, Math.PI + a * 0.98 + (a > 0 ? 0 : 0) + Math.PI)); }
    curveTube(pts, 0.014, mats.fur, { parent: g, segments: 30, radialSegments: 10, name: 'fur' });
  }
  // tongue + laces
  if (T.laces) {
    const [u0, u1] = T.laces;
    const tongue = paramGeo((u, v) => {
      const uu = u0 - 0.06 + u * (u1 - u0 + 0.06);
      const t = th0(Math.max(uu, u0)) + 0.15;
      const th = -t + v * 2 * t;
      const p = sec(uu, th);
      return [p[0] * 0.97, p[1] - 0.002 + (u < 0.15 ? (0.15 - u) * 0.15 : 0), p[2]];
    }, 12, 8);
    mesh(tongue, mats.upper, { parent: g, name: 'tongue' });
    const nL = Math.max(3, Math.round((u1 - u0) / 0.045));
    const ey = [];
    for (let i = 0; i <= nL; i++) {
      const u = u0 + (u1 - u0) * (i / nL);
      const t = th0(u) + 0.08;
      ey.push([sec(u, t), sec(u, Math.PI * 2 - t)]);
    }
    const lift2 = (p, k = 0.004) => [p[0], p[1] + k, p[2]];
    for (let i = 0; i < nL; i++) {
      curveTube([lift2(ey[i][0]), [0, ey[i][0][1] + 0.008, (ey[i][0][2] + ey[i + 1][0][2]) / 2], lift2(ey[i + 1][1])], 0.0022, mats.lace, { parent: g, segments: 10, radialSegments: 5 });
      curveTube([lift2(ey[i][1]), [0, ey[i][1][1] + 0.009, (ey[i][1][2] + ey[i + 1][1][2]) / 2], lift2(ey[i + 1][0])], 0.0022, mats.lace, { parent: g, segments: 10, radialSegments: 5 });
    }
    for (const [a, b] of ey) for (const p of [a, b]) mesh(new THREE.TorusGeometry(0.0035, 0.0012, 6, 10).rotateX(Math.PI / 2), mats.eyelet, { parent: g, at: lift2(p, 0.001) });
    // bow
    const top = ey[0];
    const bc = [0, top[0][1] + 0.01, top[0][2] + 0.006];
    for (const s of [-1, 1]) curveTube([bc, [s * 0.02, bc[1] + 0.012, bc[2] - 0.008], [s * 0.028, bc[1] + 0.002, bc[2] - 0.004], bc], 0.002, mats.lace, { parent: g, segments: 14, radialSegments: 5 });
    for (const s of [-1, 1]) curveTube([bc, [s * 0.012, bc[1] - 0.01, bc[2] + 0.012], [s * 0.02, bc[1] - 0.03, bc[2] + 0.018]], 0.002, mats.lace, { parent: g, segments: 10, radialSegments: 5 });
  }
  if (T.velcro) {
    for (let i = 0; i < 2; i++) {
      const u = 0.42 + i * 0.1;
      const pts = [];
      for (let k = 0; k <= 10; k++) { const th = -1.3 + 2.6 * (k / 10); const p = sec(u, th); pts.push([p[0] * 1.03, p[1] + 0.003, p[2]]); }
      mesh(taperTube(pts, 0.012, { flat: 0.2, side: [0, 0, 1], seg: 16, radial: 8 }), mats.accent, { parent: g, name: 'velcro' });
    }
  }
  // toe cap / stripes / details
  if (T.cap) {
    const capG = paramGeo((u, v) => { const uu = 0.82 + u * 0.178; const th = Math.PI * 0.5 + v * Math.PI; const p = sec(uu, th); const k = 1.02; return [p[0] * k, yTop(uu) - 0.003 + (p[1] - yTop(uu) + 0.003) * 1.03, p[2] + 0.001]; }, 14, 14);
    mesh(capG, mats.sole, { parent: g, name: 'toe_cap' });
  }
  if (T.stripe || T.sideStripe) {
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 10; i++) { const u = 0.18 + i * 0.045; const th = Math.PI / 2 + 0.25 - i * 0.03; const p = sec(u, s > 0 ? th : Math.PI * 2 - th); pts.push([p[0] + s * 0.003, p[1], p[2]]); }
      mesh(taperTube(pts, (t) => 0.006 + 0.007 * Math.sin(t * Math.PI), { flat: 0.15, up: [s, 0, 0], seg: 20, radial: 8 }), mats.accent, { parent: g, name: 'stripe' });
    }
  }
  if (T.patch) {
    const p = sec(0.2, Math.PI / 2 - 0.9);
    const disc = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.003, 20).rotateZ(Math.PI / 2), mats.accent, { parent: g, at: [-p[0] - 0.002, p[1] + 0.04, p[2]] });
    void disc;
  }
  if (T.apron) {
    const pts = [];
    for (let i = 0; i <= 16; i++) { const a = i / 16; const u = 0.56 + 0.28 * Math.sin(a * Math.PI); const th = Math.PI / 2 - 0.1 - (Math.PI - 0.2) * a; const q = sec(u, th < 0 ? th + Math.PI * 2 : th); pts.push([q[0] * 1.005, q[1] + 0.0015, q[2]]); }
    curveTube(pts, 0.0022, mats.accent, { parent: g, segments: 30, radialSegments: 6, name: 'apron' });
  }
  if (T.penny) {
    const pts = [];
    for (let k = 0; k <= 12; k++) { const th = -1.25 + 2.5 * (k / 12); const p = sec(0.48, th); pts.push([p[0] * 1.02, p[1] + 0.003, p[2]]); }
    mesh(taperTube(pts, 0.011, { flat: 0.18, side: [0, 0, 1], seg: 16, radial: 8 }), mats.upper, { parent: g, name: 'penny_strap' });
  }
  if (T.capSeam) {
    const pts = [];
    for (let k = 0; k <= 14; k++) { const th = Math.PI / 2 + Math.PI * (k / 14); const p = sec(0.8, th + Math.PI); pts.push([p[0] * 1.004, p[1] + 0.001, p[2]]); }
    curveTube(pts, 0.0015, mats.accent, { parent: g, segments: 24, radialSegments: 5, name: 'cap_seam' });
  }
  if (T.strap) {
    const ay = yTop(0.3) + H(0.3) * 0.8 + 0.01;
    const pts = [];
    for (let k = 0; k <= 12; k++) { const a = Math.PI * (k / 12); pts.push([-Math.cos(a) * hw(0.36) * 0.95, ay - 0.02 * Math.cos(a) ** 2 + Math.sin(a) * 0.012, 0.36 * L]); }
    mesh(taperTube(pts, 0.006, { flat: 0.3, side: [0, 0, 1], seg: 16, radial: 8 }), mats.upper, { parent: g, name: 'strap' });
  }
  // shaft (boots, high-tops)
  if (T.shaft) {
    const sh = T.shaft;
    const cz = 0.2 * L;
    const y0 = yTop(0.2) + 0.03;
    const shaftG = paramGeo((u, v) => {
      const th = u * Math.PI * 2;
      const y = y0 + v * (sh - 0.03 + (T.shaft > 0.16 ? 0.03 : 0));
      const k = 1 + 0.12 * (1 - v) ** 2;
      const ax = W * 0.47 * k * (T.padded ? 1.06 : 1);
      const az = 0.058 * k + 0.012 * (1 - v);
      return [ax * Math.sin(th), y, cz - 0.004 + az * -Math.cos(th) + v * 0.012];
    }, 36, 10, { closedU: true });
    mesh(shaftG, mats.upper, { parent: g, name: 'shaft' });
    const topY = y0 + sh - 0.03 + (T.shaft > 0.16 ? 0.03 : 0);
    const ring = [];
    for (let i = 0; i <= 36; i++) { const th = (i / 36) * Math.PI * 2; ring.push([W * 0.47 * (T.padded ? 1.06 : 1) * Math.sin(th), topY, cz + 0.008 - 0.058 * Math.cos(th)]); }
    curveTube(ring, T.padded ? 0.012 : 0.005, T.padded ? mats.accent : mats.upper, { parent: g, segments: 48, radialSegments: 8, closed: true, name: 'shaft_collar' });
    if (T.elastic) for (const s of [-1, 1]) mesh(extrudeOutline([[-0.022, 0], [0.022, 0], [0.012, sh * 0.9], [-0.012, sh * 0.9]], 0.003, { bevel: 0.001, segments: 1 }), mats.elastic, { parent: g, at: [s * W * 0.475, y0 + 0.0, cz], rot: [0, s * Math.PI / 2, 0], name: 'elastic' });
    if (T.tab) mesh(roundedBox(0.022, 0.04, 0.004, 0.0015), mats.elastic, { parent: g, at: [0, topY + 0.012, cz - 0.07], name: 'pull_tab' });
    if (T.laces) {
      const nh = T.hooks ? 3 : 4;
      for (let i = 0; i < nh; i++) {
        const y = y0 + 0.02 + i * (sh - 0.05) / nh;
        for (const s of [-1, 1]) {
          const at = [s * 0.018, y, cz + 0.062 + 0.012 * (y - y0) / sh];
          if (T.hooks) mesh(new THREE.TorusGeometry(0.004, 0.0013, 6, 10, Math.PI * 1.3).rotateY(Math.PI / 2), mats.eyelet, { parent: g, at });
          else mesh(new THREE.TorusGeometry(0.0035, 0.0012, 6, 10).rotateX(Math.PI / 2), mats.eyelet, { parent: g, at });
        }
        const at1 = [-0.018, y, cz + 0.064 + 0.012 * (y - y0) / sh];
        const y2 = y + (sh - 0.05) / nh;
        curveTube([at1, [0, (y + y2) / 2, at1[2] + 0.006], [0.018, y2, cz + 0.064 + 0.012 * (y2 - y0) / sh]], 0.0022, mats.lace, { parent: g, segments: 8, radialSegments: 5 });
        curveTube([[0.018, y, at1[2]], [0, (y + y2) / 2, at1[2] + 0.006], [-0.018, y2, cz + 0.064 + 0.012 * (y2 - y0) / sh]], 0.0022, mats.lace, { parent: g, segments: 8, radialSegments: 5 });
      }
      // tongue up the shaft front
      mesh(roundedBox(0.035, sh - 0.02, 0.006, 0.0025), mats.upper, { parent: g, at: [0, y0 + (sh - 0.02) / 2, cz + 0.058], rot: [-0.08, 0, 0], name: 'shaft_tongue' });
    }
  }
  if (hh > 0.015) addHeel(g, T, mats, lift, L, hw);
  return g;
}

function addHeel(g, T, mats, lift, L, hw) {
  const hh = T.hh;
  const hz = 0.075 * L;
  if (T.stiletto) {
    mesh(taperTube([[0, lift(0.075) + 0.002, hz], [0, hh * 0.5, hz - 0.006], [0, 0.004, hz - 0.004]], [0.013, 0.0045], { seg: 10, radial: 12 }), mats.heel, { parent: g, name: 'heel' });
    mesh(new THREE.CylinderGeometry(0.0048, 0.0048, 0.006, 10), M.rubber(), { parent: g, at: [0, 0.003, hz - 0.004], name: 'heel_tip' });
  } else {
    const top = lift(0.075) + 0.002;
    const w0 = hw(0.12) * 1.6;
    const blk = mesh(roundedBox(w0, top, 0.06, 0.006), mats.heel, { parent: g, at: [0, top / 2, hz + 0.005], name: 'heel' });
    const p = blk.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / top + 0.5; const k = 0.75 + 0.25 * y; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * (0.8 + 0.2 * y)); }
    blk.geometry.computeVertexNormals();
  }
}

/** Materials for one shoe spec. */
export function shoeMats(S, trim) {
  const upperFab = S.fab === 'plastic' ? 'patent' : S.fab;
  const mats = {
    upper: fabricMat(upperFab, S.c, { c2: S.c2 ?? '#ffffff', c3: S.c3, repeat: [3, 3] }),
    sole: new THREE.MeshPhysicalMaterial({ name: 'sole', color: M.toColor(S.sc), roughness: 0.75, clearcoat: 0.1 }),
    accent: fabricMat(S.fab === 'canvas' || S.fab === 'knit' ? 'leather' : S.fab === 'patent' ? 'patent' : 'leather', S.c2 ?? S.sc, { plain: true }),
    lining: fabricMat('cotton', S.fur ? S.c2 : trim === 'kids' ? '#ffffff' : '#d9cbb2', { plain: true }),
    lace: fabricMat('cotton', S.fab === 'leather' || S.fab === 'patent' || S.fab === 'snake' ? '#1d1a18' : trim ? (S.c2 ?? '#ffffff') : '#ffffff', { plain: true, side: THREE.FrontSide }),
    eyelet: M.metal(trim === 'neon' ? '#ff2fa0' : '#c9ccd2', 0.25),
    heel: S.fab === 'patent' || S.fab === 'metallic' ? fabricMat(S.fab, S.c, { plain: true }) : new THREE.MeshPhysicalMaterial({ name: 'heel', color: M.toColor(S.stiletto ? S.c : '#2a1d16'), roughness: 0.4, clearcoat: 0.6 }),
    bed: fabricMat(S.flip ? 'canvas' : 'suede', S.flip ? S.sc : '#c9a173', { plain: true }),
    elastic: fabricMat('knit', S.c2 ?? '#1d1d1f', { plain: true }),
    fur: fabricMat('velvet', S.c2 ?? '#f4ede2', { plain: true }),
  };
  if (S.flip) { mats.sole = new THREE.MeshStandardMaterial({ name: 'foam', color: M.toColor(S.sc), roughness: 0.9 }); mats.upper = M.plastic(S.c, 0.4); }
  return mats;
}

export function createShoe(options = {}) {
  const { o, variant, trim, T } = setup(options, SHOE_VARIANTS, 'shoe', SHOE_TRIMS);
  const root = group(`shoe-${variant}`);
  const S = { ...T };
  // trim shape tweaks that only make sense per family
  if (trim === 'platform' && S.hh > 0.03) S.hh *= 1.25;
  if (trim === 'kids') { S.hh = Math.min(S.hh, 0.015); S.stiletto = false; S.block = S.hh > 0.01; }
  if (trim === 'chunky' && S.stiletto) { S.stiletto = false; S.block = true; }
  if (S.fab === 'rubber') S.fab = 'plastic';
  const mats = shoeMats(S, trim);
  const sc = S.scale ?? 1;
  const pair = group('pair', { parent: root });
  const right = buildShoe(S, mats);
  right.position.set(0.07 * sc, 0, -S.L / 2 * sc);
  right.scale.setScalar(sc);
  right.rotation.y = -0.05;
  right.name = 'shoe_R';
  pair.add(right);
  const left = buildShoe(S, mats);
  left.scale.set(-sc, sc, sc);
  left.position.set(-0.07 * sc, 0, -S.L / 2 * sc - 0.035);
  left.rotation.y = 0.08;
  left.name = 'shoe_L';
  pair.add(left);
  left.traverse((m) => { if (m.isMesh) m.material = m.material.side === THREE.DoubleSide ? m.material : m.material; });
  return done(root, 'shoe', variant, o, () => [clip('tap', 1.2, [rotateTrack(right, 'x', 1.2, (t) => -Math.max(0, wave(t)) * 0.12)])]);
}
