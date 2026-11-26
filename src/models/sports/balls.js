// Balls of every sport. Panel patterns are vertex colours on a dense icosphere (or lathe for
// oval balls) so they render in Node, the browser and survive GLB export. Seams are grooves.
import {
  THREE, M, mesh, group, roundedBox, lathe, curveTube, setup, done, fin, patternSphere, vcMat, canvasTex, plinth, teamPattern, rodX, rodY, rodZ,
} from './common.js';

const C = (c) => new THREE.Color(c);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const BALL_VARIANTS = {
  soccer: { R: 0.11, det: 28, p: '#f7f7f5', s: '#151515', big: true },
  basketball: { R: 0.12, det: 28, p: '#d5621d', s: '#1b1410', big: true },
  volleyball: { R: 0.105, det: 26, p: '#f7f7f2', s: '#f3c300', a: '#1f4fb5', big: true },
  tennis: { R: 0.0335, det: 18, p: '#d6ea3c', s: '#f6f6f0' },
  baseball: { R: 0.0373, det: 22, p: '#f1ede2', s: '#c41e2a' },
  softball: { R: 0.0485, det: 22, p: '#e9f03e', s: '#c41e2a' },
  'american-football': { R: 0.085, L: 0.28, p: '#7a3e1c', s: '#f6f6f2', big: true, oval: true },
  rugby: { R: 0.096, L: 0.29, p: '#f4f4f2', s: '#1d4fa0', a: '#e0302a', big: true, oval: true },
  golf: { R: 0.02135, det: 24, p: '#fbfbf8', s: '#d9d9d4' },
  bowling: { R: 0.108, det: 32, p: '#1f4fb5', s: '#6a2bd1', a: '#101014' },
  cricket: { R: 0.036, det: 22, p: '#9a1a1e', s: '#f3ead6' },
  'pool-ball': { R: 0.02858, det: 16, p: '#141414', s: '#f8f6ee', n: 8 },
  'water-polo': { R: 0.11, det: 26, p: '#f2d316', s: '#1d4fa0', big: true },
  handball: { R: 0.093, det: 26, p: '#f4f4f2', s: '#d82b2b', a: '#1b1b1b', big: true },
};
export const BALL_TRIMS = ['pro', 'retro', 'kids', 'neon', 'worn', 'stealth', 'team-crimson', 'team-navy', 'team-emerald', 'champion', 'set'];

/* ------------------------------ geometry tables ------------------------------ */

const PHI = (1 + Math.sqrt(5)) / 2;
const ICO = [];
for (const a of [-1, 1]) for (const b of [-1, 1]) ICO.push([0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a]);
const V3 = ICO.map((v) => new THREE.Vector3(...v));
const FACES = [];
for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) {
  if ([V3[i].distanceTo(V3[j]), V3[j].distanceTo(V3[k]), V3[i].distanceTo(V3[k])].every((d) => Math.abs(d - 2) < 1e-6)) FACES.push([i, j, k]);
}
const nb = V3.findIndex((v, j) => j && Math.abs(v.distanceTo(V3[0]) - 2) < 1e-6);
const D5 = V3[0].clone().multiplyScalar(2).add(V3[nb]).divideScalar(3).dot(V3[0].clone().normalize());
const TI = [
  ...V3.map((v) => ({ n: v.clone().normalize(), d: D5, pent: true })),
  ...FACES.map(([a, b, c]) => {
    const n = V3[a].clone().add(V3[b]).add(V3[c]).normalize();
    return { n, d: V3[a].clone().multiplyScalar(2).add(V3[b]).divideScalar(3).dot(n), pent: false };
  }),
];

/** Truncated icosahedron: { idx, pent, gap } (gap = distance to nearest seam, ~radians). */
function soccerCell(p) {
  let b = -1, s = -1, bi = 0;
  for (let i = 0; i < 32; i++) {
    const v = p.dot(TI[i].n) / TI[i].d;
    if (v > b) { s = b; b = v; bi = i; } else if (v > s) s = v;
  }
  return { idx: bi, pent: TI[bi].pent, gap: (b - s) * 1.4, n: TI[bi].n };
}

/** 18-panel (volleyball / vintage) cell: { face, strip, gap }. */
function stripCell(p) {
  const a = [Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)];
  const ax = a[0] > a[1] && a[0] > a[2] ? 0 : a[1] > a[2] ? 1 : 2;
  const m = a[ax];
  const q = [p.x / m, p.y / m, p.z / m];
  const u = q[(ax + 1) % 3], v = q[(ax + 2) % 3];
  const s = ax === 0 ? u : ax === 1 ? v : u; // strip direction alternates by face pair
  const t = ax === 1 ? u : v;
  const strip = Math.min(2, Math.floor((s + 1) * 1.5));
  const gap = Math.min(Math.abs(s - 1 / 3), Math.abs(s + 1 / 3), 1 - Math.abs(s), 1 - Math.abs(t)) * 0.6;
  return { face: ax * 2 + (q[ax] > 0 ? 1 : 0), strip, gap, s, t };
}

/** Tennis/baseball seam curve samples (unit sphere). */
const SEAM = [];
{
  const a = 0.75, b = 0.25, c = 2 * Math.sqrt(a * b);
  for (let i = 0; i < 256; i++) {
    const t = (i / 256) * Math.PI * 2;
    SEAM.push(new THREE.Vector3(a * Math.cos(t) + b * Math.cos(3 * t), c * Math.sin(2 * t), a * Math.sin(t) - b * Math.sin(3 * t)));
  }
}
function seamNear(p) {
  let best = 9, bi = 0;
  for (let i = 0; i < SEAM.length; i++) {
    const d = p.distanceToSquared(SEAM[i]);
    if (d < best) { best = d; bi = i; }
  }
  const c = SEAM[bi];
  const tan = SEAM[(bi + 1) % SEAM.length].clone().sub(SEAM[(bi + SEAM.length - 1) % SEAM.length]);
  const side = Math.sign(p.dot(new THREE.Vector3().crossVectors(c, tan))) || 1;
  return { d: Math.sqrt(best), t: bi / SEAM.length, side };
}

const FIB = [];
for (let i = 0; i < 330; i++) {
  const y = 1 - (2 * (i + 0.5)) / 330;
  const r = Math.sqrt(1 - y * y);
  const th = i * Math.PI * (3 - Math.sqrt(5));
  FIB.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
}

/* ------------------------------ palettes ------------------------------ */

function palette(variant, V, T) {
  const tr = T.trim;
  let p = T.p, s = T.s, a = T.a ?? T.s;
  if (!tr) return { p: C(V.p), s: C(V.s), a: C(V.a ?? V.s) };
  if (tr === 'retro') {
    const R = {
      tennis: ['#f4f1e6', '#d8d2bf'], golf: ['#efe8d6', '#d8d0bb'], baseball: ['#e9dfc6', '#7a2620'], softball: ['#ede2c0', '#7a2620'],
      bowling: ['#18181a', '#2a2a2c'], 'pool-ball': ['#e8dcbc', '#7a2620'], cricket: ['#6e1416', '#e8dcbc'], rugby: ['#8a5530', '#5e3a20'],
    }[variant] ?? ['#8a5530', '#5b3519'];
    p = R[0]; s = R[1]; a = '#3a2414';
  } else if (tr === 'pro') {
    const P = {
      soccer: ['#f7f7f5', '#e5402a', '#15171b'], basketball: ['#e0701f', '#121212'], volleyball: ['#f7f7f2', '#1f4fb5', '#f3c300'], tennis: ['#e3f43a', '#ffffff'],
      baseball: ['#fbf9f2', '#d01f2c'], softball: ['#f2ff3a', '#d01f2c'], golf: ['#ffffff', '#e5402a'], bowling: ['#c4161c', '#f2f2f2', '#141414'],
      cricket: ['#f4f4f0', '#1a2f6e'], 'pool-ball': ['#f2c500', '#ffffff'], rugby: ['#f7f7f5', '#15171b', '#e5402a'], 'american-football': ['#5e2e14', '#ffffff'],
      'water-polo': ['#ffd400', '#0d4cc4'], handball: ['#f7f7f5', '#1f4fb5', '#e5402a'],
    }[variant];
    if (P) [p, s, a = P[1]] = P;
  } else if (tr === 'champion') { p = '#e0b545'; s = '#8a6418'; a = '#f6dc8c'; }
  else if (tr === 'set') return { p: C(V.p), s: C(V.s), a: C(V.a ?? V.s) };
  return { p: C(p), s: C(s), a: C(a) };
}

/* ------------------------------ ball builders ------------------------------ */

/** Returns { mesh, R, h } — mesh centred at origin, h = height when resting. */
export function buildBall(variant, T, { detail, n } = {}) {
  const V = BALL_VARIANTS[variant];
  const tr = T.trim;
  const pal = palette(variant, V, T);
  let R = V.R;
  if (tr === 'kids') R = V.big ? R * 0.75 : R * 1.9;
  const det = Math.max(8, detail ?? V.det);
  const seamC = tr === 'stealth' ? C('#4a4d55') : tr === 'neon' ? C('#0a0a0a') : C('#2a2622');
  const wear = T.wear ?? 0;
  const pattern = T.pattern;
  const scuff = (p, c) => {
    if (!wear) return c;
    const n = Math.sin(p.x * 23 + Math.sin(p.y * 17) * 2) * Math.sin(p.z * 19 + p.y * 7);
    const k = n > 0.55 ? 0.62 : 0.9 + n * 0.08;
    return c.clone().multiplyScalar(k).lerp(C('#8a7a62'), n > 0.55 ? 0.35 : 0.05);
  };
  const metalRough = tr === 'champion' ? { metalness: 1, roughness: 0.22, clearcoat: 0.6 } : null;
  let geo, mat;
  const key = `${variant}|${tr}|${n ?? ''}`;

  if (V.oval) {
    // lathe spheroid along X
    const L = (tr === 'kids' ? V.L * 0.72 : V.L) * (tr === 'retro' && variant === 'american-football' ? 1.02 : 1);
    let Rr = tr === 'kids' ? R * 1.0 : R;
    let ex = variant === 'rugby' ? 0.5 : 0.72;
    if (tr === 'retro') { Rr *= 1.12; ex -= 0.12; }
    if (tr === 'kids') ex = 0.45;
    const prof = [];
    for (let i = 0; i <= 40; i++) {
      const t = -1 + (2 * i) / 40;
      prof.push(new THREE.Vector2(Math.max(1e-4, Rr * (1 - t * t) ** ex), (t * L) / 2));
    }
    geo = new THREE.LatheGeometry(prof, 64);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const pv = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      pv.fromBufferAttribute(pos, i);
      const ang = Math.atan2(pv.z, pv.x);
      const y = pv.y / (L / 2);
      const seam = Math.min(...[0, 1, 2, 3].map((k) => Math.abs(Math.sin(ang - (k * Math.PI) / 2 - Math.PI / 4)))) ;
      let c = pal.p.clone();
      if (variant === 'american-football') {
        if (tr !== 'kids' && tr !== 'stealth' && Math.abs(Math.abs(y) - 0.62) < 0.045) c = pal.s.clone();
        if (pattern && Math.abs(Math.abs(y) - 0.5) < 0.12) c = pal.s.clone();
        if (tr === 'kids') c = Math.floor((ang + Math.PI) / (Math.PI / 2)) % 2 ? pal.p.clone() : pal.s.clone();
      } else {
        // rugby: graphic bands + panel colours
        const band = Math.abs(y) < 0.18 ? 1 : Math.abs(Math.abs(y) - 0.5) < 0.08 ? 2 : 0;
        if (band === 1) c = pal.s.clone();
        else if (band === 2) c = pal.a.clone();
        if (pattern && teamPattern(pattern, ang / Math.PI, y)) c = pal.s.clone();
        if (tr === 'retro') c = pal.p.clone();
      }
      if (seam < 0.025) c = seamC.clone();
      c = scuff(pv.clone().multiplyScalar(10), c);
      // pebble grain + seam groove
      const k = 1 - (seam < 0.04 ? 0.012 * (1 - seam / 0.04) : 0);
      pos.setXYZ(i, pv.x * k, pv.y, pv.z * k);
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    geo.rotateZ(Math.PI / 2);
    if (wear) geo.scale(1, 0.94, 1.02);
    mat = vcMat({ roughness: tr === 'retro' ? 0.6 : 0.5, clearcoat: 0.2, ...metalRough });
    const m = new THREE.Mesh(geo, mat);
    m.name = 'ball';
    // laces (american football always; vintage rugby too)
    if (variant === 'american-football' || tr === 'retro') {
      const lm = fin(T, tr === 'stealth' ? '#55585f' : tr === 'champion' ? '#f6dc8c' : '#f4f2ea', tr === 'champion' ? 'gold' : 'matte');
      const top = Rr * (1 - 0) ** ex;
      const lg = group('laces', { parent: m, at: [0, top, 0] });
      mesh(roundedBox(L * 0.36, 0.006, 0.006, 0.002), lm, { parent: lg, at: [0, 0.001, 0] });
      for (let i = 0; i < 8; i++) {
        const x = -L * 0.16 + (i * L * 0.32) / 7;
        const yy = -((x / (L / 2)) ** 2) * Rr * 0.9;
        mesh(roundedBox(0.006, 0.006, 0.03, 0.0025), lm, { parent: lg, at: [x, yy + 0.002, 0] });
      }
    }
    return { mesh: m, R: Rr * (wear ? 0.94 : 1), h: 2 * Rr * (wear ? 0.94 : 1) };
  }

  let fn;
  let mopt = { roughness: 0.42, clearcoat: 0.35 };
  if (variant === 'soccer' || variant === 'handball') {
    if (tr === 'retro') {
      fn = (p) => {
        const c = stripCell(p);
        let col = pal.p.clone().offsetHSL(0, 0, (c.face % 3) * 0.02 - c.strip * 0.015);
        if (c.gap < 0.012) col = seamC.clone();
        return { c: scuff(p, col), d: c.gap < 0.03 ? 0.012 * (1 - c.gap / 0.03) : 0 };
      };
      mopt = { roughness: 0.6, clearcoat: 0.15 };
    } else {
      fn = (p) => {
        const c = soccerCell(p);
        let col;
        if (tr === 'pro' || variant === 'handball') {
          // modern: coloured pentagons + swoosh band
          col = c.pent ? pal.s.clone() : pal.p.clone();
          const sw = Math.sin(p.x * 3 + p.y * 4 + Math.sin(p.z * 3) * 1.4);
          if (!c.pent && Math.abs(sw) < 0.22) col = pal.a.clone();
        } else if (pattern) {
          col = c.pent ? pal.s.clone() : teamPattern(pattern, c.n.x, c.n.y) ? pal.p.clone() : pal.s.clone();
          if (c.pent) col = pal.a.clone();
        } else if (tr === 'kids') {
          col = c.pent ? pal.a.clone() : [pal.p, pal.s, C('#4ccb52'), C('#ffffff')][c.idx % 4].clone();
        } else col = c.pent ? pal.s.clone() : pal.p.clone();
        if (c.gap < 0.014) col = seamC.clone();
        return { c: scuff(p, col), d: c.gap < 0.04 ? 0.014 * (1 - c.gap / 0.04) : 0 };
      };
    }
  } else if (variant === 'basketball' || variant === 'water-polo') {
    const lw = variant === 'water-polo' ? 0.026 : tr === 'retro' ? 0.04 : 0.028;
    fn = (p) => {
      const d = Math.min(Math.abs(p.x), Math.abs(p.y), Math.abs(Math.abs(p.z) - 0.62) * 0.9);
      const panel = (p.x > 0 ? 1 : 0) + (p.y > 0 ? 2 : 0) + (Math.abs(p.z) > 0.62 ? 4 : 0);
      let col = pal.p.clone();
      if (variant === 'water-polo' || tr === 'kids') col = [pal.p, pal.s, pal.a, C('#ffffff')][panel % (tr === 'kids' ? 4 : 2)].clone();
      if (pattern) col = teamPattern(pattern, p.x, p.y) ? pal.s.clone() : pal.p.clone();
      // pebble grain
      const grain = 1 + (Math.sin(p.x * 240) * Math.sin(p.y * 230) * Math.sin(p.z * 250)) * 0.04;
      col.multiplyScalar(grain);
      if (d < lw && variant !== 'water-polo') col = (tr === 'neon' || pattern || tr === 'kids' ? pal.s : seamC).clone();
      if (d < lw * 0.6 && variant === 'water-polo') col = seamC.clone();
      return { c: scuff(p, col), d: d < lw * 1.6 ? 0.01 * (1 - d / (lw * 1.6)) : 0 };
    };
    mopt = { roughness: variant === 'water-polo' ? 0.5 : 0.62, clearcoat: 0.1 };
  } else if (variant === 'volleyball') {
    fn = (p) => {
      const c = stripCell(p);
      let col;
      if (!tr || tr === 'pro' || tr === 'neon' || tr === 'kids') col = [pal.p, pal.s, pal.a][(c.strip + c.face) % 3].clone();
      else if (pattern) col = c.strip === 1 ? pal.s.clone() : pal.p.clone();
      else col = pal.p.clone().offsetHSL(0, 0, c.strip === 1 ? -0.03 : 0);
      if (c.gap < 0.011) col = seamC.clone().lerp(col, 0.3);
      return { c: scuff(p, col), d: c.gap < 0.03 ? 0.013 * (1 - c.gap / 0.03) : 0 };
    };
  } else if (variant === 'tennis') {
    fn = (p) => {
      const s = seamNear(p);
      let col = pal.p.clone();
      if (pattern) col = s.side > 0 ? pal.p.clone() : pal.a.clone();
      if (tr === 'kids') col = s.side > 0 ? pal.p.clone() : pal.s.clone();
      if (s.d < 0.06) col = (tr === 'kids' ? C('#ffffff') : pal.s).clone();
      return { c: scuff(p, col), d: s.d < 0.06 ? 0.02 * (1 - s.d / 0.06) : 0 };
    };
    mopt = { roughness: 0.95, clearcoat: 0, sheen: 1 };
  } else if (variant === 'baseball' || variant === 'softball') {
    fn = (p) => {
      const s = seamNear(p);
      let col = pal.p.clone();
      if (pattern && s.side > 0) col = pal.p.clone().lerp(C(T.p), 0.6);
      let d = 0;
      if (s.d < 0.022) { col.multiplyScalar(0.82); d = 0.006; }
      const u = (s.t * 108 + (s.d - 0.05) * 40 * s.side) % 1;
      if (s.d > 0.03 && s.d < 0.085 && u < 0.42) { col = pal.s.clone(); d = -0.006; }
      return { c: scuff(p, col), d };
    };
    mopt = { roughness: 0.55, clearcoat: 0.1 };
  } else if (variant === 'golf') {
    const bramble = tr === 'retro';
    fn = (p) => {
      let best = -1;
      for (let i = 0; i < FIB.length; i++) { const v = p.dot(FIB[i]); if (v > best) best = v; }
      const th = Math.acos(Math.min(1, best));
      const rho = 0.092;
      let d = th < rho ? 0.03 * (1 - (th / rho) ** 2) : 0;
      if (bramble) d = -d * 0.8;
      let col = pal.p.clone();
      if (pattern) col = Math.abs(p.y) < 0.25 ? C(T.p) : pal.p.clone().set('#ffffff');
      if (tr === 'kids') col = pal.p.clone();
      if (tr === 'pro' && Math.abs(p.y) < 0.05 && p.z > 0) col = pal.s.clone(); // alignment line
      return { c: scuff(p, col), d };
    };
    mopt = { roughness: 0.32, clearcoat: 0.7 };
  } else if (variant === 'bowling') {
    const holes = [[-0.17, 0.95], [0.17, 0.95], [0, 0.72]].map(([x, z]) => new THREE.Vector3(x, Math.sqrt(Math.max(0, 1 - x * x - (1 - z) ** 2)), 1 - z).normalize());
    fn = (p) => {
      const sw = 0.5 + 0.5 * Math.sin(7 * (p.x + 0.6 * Math.sin(3 * p.y) + 0.4 * Math.sin(5 * p.z)));
      let col = pal.p.clone().lerp(pal.s, sw ** 2);
      if (tr === 'retro' || tr === 'stealth') col = pal.p.clone().lerp(pal.s, sw * 0.2);
      if (pattern) col = teamPattern(pattern, p.x, p.y) ? pal.s.clone() : pal.p.clone();
      let d = 0;
      for (const h of holes) {
        const th = Math.acos(Math.min(1, p.dot(h)));
        if (th < 0.13) { col = C('#0c0c0d'); d = 0.12 * smooth(0.13, 0.09, th); }
        else if (th < 0.15) d = 0.01;
      }
      return { c: scuff(p, col), d };
    };
    mopt = { roughness: tr === 'retro' ? 0.5 : 0.12, clearcoat: 1 };
  } else if (variant === 'cricket') {
    fn = (p) => {
      let col = pal.p.clone();
      if (tr === 'pro') col = C('#f4f4f0');
      if (pattern) col = p.x > 0 ? C(T.p) : pal.s.clone();
      let d = 0;
      const ay = Math.abs(p.y);
      if (ay < 0.06) {
        d = -0.012 * (1 - ay / 0.06);
        const ang = Math.atan2(p.z, p.x);
        const row = Math.abs(ay - 0.035) < 0.012 || Math.abs(ay - 0.012) < 0.006;
        col = row && (ang * 40) % 1 < 0.55 ? pal.s.clone() : col.multiplyScalar(0.9);
      } else if (Math.abs(p.x) < 0.008) col.multiplyScalar(0.75);
      return { c: scuff(p, col), d };
    };
    mopt = { roughness: 0.45, clearcoat: 0.5 };
  } else if (variant === 'pool-ball') {
    const num = n ?? V.n;
    const PB = ['#f8f6ee', '#f2c500', '#1d43b8', '#d0201e', '#5a2a90', '#f07a14', '#147a3a', '#7a1a1a', '#141414'];
    const base = C(tr && tr !== 'set' ? T.p : PB[num > 8 ? num - 8 : num]);
    const stripe = num > 8;
    fn = (p) => {
      let col = base.clone();
      if (stripe && Math.abs(p.y) > 0.5) col = pal.s.clone().set('#f8f6ee');
      if (tr === 'pro' || pattern) col = Math.abs(p.y) < 0.45 ? pal.p.clone() : C('#f8f6ee');
      if (num && Math.max(p.z, -p.z) > 0.86) col = C('#f8f6ee');
      return { c: scuff(p, col), d: 0 };
    };
    mopt = { roughness: 0.08, clearcoat: 1 };
  }
  if (tr === 'neon') mopt.emissive = '#ffffff';
  if (metalRough) Object.assign(mopt, metalRough);
  if (tr === 'stealth') mopt.roughness = Math.max(mopt.roughness, 0.55);
  if (tr === 'kids') { mopt.roughness = 0.9; mopt.clearcoat = 0; }
  geo = patternSphere(R, det, fn, key);
  if (wear) {
    // deflated: squashed with a flat contact patch
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) * 0.93;
      if (y < -R * 0.82) y = -R * 0.82 - (y + R * 0.82) * 0.15;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) * 1.03);
      pos.setZ(i, pos.getZ(i) * 1.03);
    }
    geo.computeVertexNormals();
  }
  mat = vcMat(mopt);
  const m = new THREE.Mesh(geo, mat);
  m.name = 'ball';
  geo.computeBoundingBox();
  const h = geo.boundingBox.max.y - geo.boundingBox.min.y;
  // pool ball number decals
  if (variant === 'pool-ball' && (n ?? V.n)) {
    const num = n ?? V.n;
    for (const sgn of [1, -1]) {
      const tex = canvasTex(64, 64, (g) => {
        g.fillStyle = '#f8f6ee'; g.fillRect(0, 0, 64, 64);
        g.fillStyle = '#111'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(num), 32, 34);
        if (num === 6 || num === 9) g.fillRect(22, 52, 20, 3);
      });
      const dec = new THREE.Mesh(new THREE.CircleGeometry(R * 0.36, 24), new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: tex, roughness: 0.1, clearcoat: 1, transparent: false }));
      dec.position.z = sgn * R * 0.935;
      if (sgn < 0) dec.rotation.y = Math.PI;
      dec.name = 'number';
      m.add(dec);
    }
  }
  return { mesh: m, R, h, bottom: -geo.boundingBox.min.y };
}

/* ------------------------------ factory ------------------------------ */

export function createSportsBall(options = {}) {
  const { o, variant, trim, T } = setup(options, BALL_VARIANTS, 'sports-ball');
  const V = BALL_VARIANTS[variant];
  const root = group(`sports-ball-${variant}`);
  const place = (b, x, y, z, parent = root) => {
    b.mesh.position.set(x, y + (b.bottom ?? b.h / 2), z);
    parent.add(b.mesh);
    return b.mesh;
  };

  if (trim === 'champion') {
    const ph = plinth(root, V.R * 2.4 + 0.04, 0.08 + V.R * 0.4, { mat: M.plastic('#141416', 0.3) });
    // gold cup holder
    const cupR = (V.oval ? V.R : V.R) * 0.6;
    mesh(lathe([[cupR * 0.5, 0], [cupR * 0.9, 0], [cupR, V.R * 0.25], [cupR * 0.94, V.R * 0.25], [cupR * 0.45, 0.004]], 32), M.metal('#d6a93c', 0.25), { parent: root, at: [0, ph, 0] });
    const b = buildBall(variant, T);
    const sink = b.R - Math.sqrt(Math.max(0, b.R * b.R - cupR * cupR));
    place(b, 0, ph + V.R * 0.25 - sink - (b.bottom ? 0 : 0), 0).position.y = ph + V.R * 0.25 + Math.sqrt(Math.max(0, b.R * b.R - cupR * cupR));
    return done(root, 'sports-ball', variant, o);
  }

  if (trim === 'set') {
    const small = !V.big;
    if (variant === 'tennis') {
      // clear tube can with three balls + lid beside it
      const r = V.R * 1.08, hgt = V.R * 6.3;
      mesh(lathe([[0, 0], [r, 0], [r, hgt], [r - 0.0015, hgt], [r - 0.0015, 0.002], [0, 0.002]], 40), M.glass({ tint: '#dfe8ee', opacity: 0.35 }), { parent: root });
      mesh(lathe([[r * 0.98, 0], [r * 1.05, 0], [r * 1.05, hgt * 0.06], [r * 0.98, hgt * 0.06]], 40), M.plastic('#e5402a'), { parent: root, at: [0, 0, 0] });
      for (let i = 0; i < 3; i++) place(buildBall(variant, { ...T, trim: null }, { detail: 14 }), 0, 0.002 + i * V.R * 2.02, 0);
      mesh(lathe([[0, 0], [r * 1.1, 0], [r * 1.12, 0.012], [r * 1.0, 0.012], [r * 1.0, 0.004], [0, 0.004]], 40), M.plastic('#f2f2f2'), { parent: root, at: [r * 2.6, 0, 0] });
      place(buildBall(variant, { ...T, trim: null }, { detail: 14 }), -r * 2.4, 0, r * 0.5);
    } else if (variant === 'pool-ball') {
      // triangle rack on a felt square + cue ball
      const R = V.R;
      mesh(roundedBox(0.62, 0.012, 0.62, 0.004), M.fabric('#146b3a'), { parent: root, at: [0, 0.006, 0] });
      const order = [1, 9, 2, 10, 8, 3, 11, 7, 14, 4, 5, 13, 15, 6, 12];
      let k = 0;
      const rows = group('rack', { parent: root, at: [0, 0.012, 0] });
      for (let row = 0; row < 5; row++) for (let i = 0; i <= row; i++) {
        const b = buildBall('pool-ball', { ...T, trim: null }, { detail: 10, n: order[k++] });
        place(b, (i - row / 2) * R * 2.01, 0, (row - 2) * R * 1.741, rows);
      }
      const side = R * 2.01 * 5 + 0.03;
      const tri = new THREE.Shape([new THREE.Vector2(-side / 2, -R * 3.48 - 0.03), new THREE.Vector2(side / 2, -R * 3.48 - 0.03), new THREE.Vector2(0, R * 4.3 + 0.03)].map((v) => v));
      const inner = new THREE.Path([new THREE.Vector2(-side / 2 + 0.03, -R * 3.48 - 0.012), new THREE.Vector2(0, R * 4.3), new THREE.Vector2(side / 2 - 0.03, -R * 3.48 - 0.012)]);
      tri.holes.push(inner);
      const frame = new THREE.ExtrudeGeometry(tri, { depth: R * 1.1, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 });
      frame.rotateX(Math.PI / 2);
      mesh(frame, M.wood('walnut'), { parent: root, at: [0, 0.012 + R * 1.1 + 0.002, 0] }).geometry.scale(1, 1, -1);
      place(buildBall('pool-ball', { ...T, trim: null }, { detail: 12, n: 0 }), 0, 0.012, 0.22);
    } else if (small) {
      // hollow bucket heaped with balls
      const r = Math.max(0.12, V.R * 4), hgt = r * 1.25;
      mesh(lathe([[0, 0], [r * 0.85, 0], [r, hgt], [r * 1.03, hgt], [r * 1.03, hgt - 0.008], [r * 0.985, hgt - 0.01], [r * 0.835, 0.006], [0, 0.006]], 40),
        M.plastic(variant === 'golf' ? '#1f6b3a' : '#2a5fc0', 0.5), { parent: root });
      curveTube(Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (i / 12); return [Math.cos(a) * r * 1.03, hgt + Math.sin(a) * r * 0.9, 0]; }), 0.003, M.metal('#bfc3c8'), { parent: root, segments: 24 });
      const rr = V.R;
      let i = 0;
      for (let layer = 0; layer < 30 && i < 60; layer++) {
        const y = 0.006 + layer * rr * 1.7;
        if (y > hgt + rr * 0.5) break;
        const rad = r * 0.85 + (r * 0.15 * y) / hgt - rr;
        for (let a = 0; a < Math.PI * 2 && i < 60; a += (rr * 2.05) / Math.max(rad * 0.7, rr)) {
          const rx = Math.cos(a + layer) * rad * 0.65, rz = Math.sin(a + layer) * rad * 0.65;
          const b = buildBall(variant, { ...T, trim: null }, { detail: 8 });
          place(b, rx, y, rz);
          i++;
        }
      }
      place(buildBall(variant, { ...T, trim: null }, { detail: 12 }), r * 1.4, 0, r * 0.3);
    } else {
      // two-shelf steel ball cart on casters
      const b0 = buildBall(variant, { ...T, trim: null }, { detail: 12 });
      const D = V.oval ? V.L * 0.62 : b0.h;
      const Rb = V.oval ? b0.h / 2 : b0.R;
      const W = D * 3 + 0.08, dep = 2 * (0.6 * Rb) + 0.06;
      const steel = M.metal('#c4c8cc', 0.3);
      const posts = [[-W / 2, -dep / 2], [W / 2, -dep / 2], [-W / 2, dep / 2], [W / 2, dep / 2]];
      const top = 0.1 + D * 2 + 0.2;
      for (const [x, z] of posts) {
        rodY(0.05, top, 0.012, steel, root, { x, z });
        mesh(new THREE.TorusGeometry(0.03, 0.012, 8, 16), M.rubber(), { parent: root, at: [x, 0.042, z] });
        mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8), steel, { parent: root, at: [x, 0.06, z] });
      }
      for (const y of [0.1, 0.1 + D + 0.1]) {
        for (const z of [-dep / 2 + 0.03, dep / 2 - 0.03]) rodX(-W / 2, W / 2, 0.01, steel, root, { y, z });
        for (const x of [-W / 2, W / 2]) rodZ(-dep / 2, dep / 2, 0.01, steel, root, { x, y });
        for (let k = 0; k < 3; k++) {
          const b = buildBall(variant, { ...T, trim: null }, { detail: 12 });
          const x = -D + k * D * 1.0 + (k - 1) * 0.02;
          const gap = dep / 2 - 0.03;
          const lift = Math.sqrt(Math.max(0, (Rb + 0.01) ** 2 - gap * gap));
          b.mesh.position.set(x, y + lift - 0.002, 0);
          root.add(b.mesh);
        }
      }
      rodX(-W / 2, W / 2, 0.012, steel, root, { y: top, z: -dep / 2 });
      mesh(new THREE.TorusGeometry(0.06, 0.01, 8, 20, Math.PI).rotateY(Math.PI / 2), steel, { parent: root, at: [W / 2, top, 0] }).scale.set(1, 1, dep / 0.12);
    }
    return done(root, 'sports-ball', variant, o);
  }

  const b = buildBall(variant, T);
  place(b, 0, 0, 0);
  // retro/pro leather balls get a tiny valve; kids foam balls sit on a ring stand
  if (V.big && !V.oval && trim !== 'kids') mesh(new THREE.CircleGeometry(b.R * 0.04, 12), M.rubber(), { parent: b.mesh, at: [0, b.R * 0.999 * (trim === 'worn' ? 0.93 : 1), 0], rot: [-Math.PI / 2, 0, 0] });
  if (trim === 'retro' && (variant === 'soccer' || variant === 'basketball' || variant === 'volleyball')) {
    // laced slot on top
    const lm = M.matte('#3a2414');
    const lg = group('laces', { parent: b.mesh, at: [0, b.R * 0.995, 0] });
    mesh(roundedBox(0.012, 0.004, 0.07, 0.0015), M.matte('#5b3519'), { parent: lg });
    for (let i = 0; i < 6; i++) mesh(roundedBox(0.03, 0.004, 0.004, 0.0015), lm, { parent: lg, at: [0, 0.002, -0.03 + i * 0.012] });
  }
  if (trim === 'kids' && !V.oval) {
    // flat ring stand so the jumbo ball doesn't roll
    mesh(new THREE.TorusGeometry(b.R * 0.35, b.R * 0.07, 10, 28).rotateX(Math.PI / 2), M.plastic('#ffffff'), { parent: root, at: [0, b.R * 0.07, 0] });
    b.mesh.position.y = b.R * 0.07 + Math.sqrt(b.R * b.R - (b.R * 0.35) ** 2) + b.R * 0.07 * 0.5;
  }
  return done(root, 'sports-ball', variant, o);
}
