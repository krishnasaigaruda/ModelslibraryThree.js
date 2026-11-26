import * as THREE from 'three';

/*
 * Loft body generator — the core of the realistic vehicles.
 *
 * A body is a stack of cross-sections ("stations") along X (front = +X).
 * Each cross-section is a smooth closed ring built from six segments:
 *
 *        roof ──────╮ roofCorner
 *                   │ side        (greenhouse / window band)
 *   shoulder (yb) ──┤
 *                   │ lower       (doors, fenders)
 *                   ╯ corner
 *        bottom ────
 *
 * The plan shape is rounded at the nose and tail by pinching Z with a
 * superellipse, so the front/back faces come out of the same surface (no caps).
 * Windows, lights, trims, stripes and door lines are "patches": rectangles in
 * (station, ring-index) space that are cut out of the body as holes (glass you
 * can see through) or laid over it as decals.
 */

const SEGMENTS = ['bottom', 'corner', 'lower', 'side', 'roofCorner', 'roof'];

/** Monotone cubic interpolation through [[x, y], ...] (no overshoot). */
export function smoothKeys(keys) {
  const k = [...keys].sort((a, b) => a[0] - b[0]);
  const n = k.length;
  const xs = k.map((p) => p[0]);
  const ys = k.map((p) => p[1]);
  const d = [];
  const m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i] || 1e-6));
  m[0] = d[0] ?? 0;
  m[n - 1] = d[n - 2] ?? 0;
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

const quad = (a, c, b, t) => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};

/**
 * @param {object} cfg
 *  length       overall length (body spans -length/2 … +length/2)
 *  nose, tail   { len, p }   plan rounding: depth (m) and superellipse power
 *  rake         { front, rear } shear of the upper body at the ends (m per m of height above shoulder)
 *  segments     sample counts per segment
 *  stations     base station count (cosine-spaced, denser at the ends)
 *  breaks       extra X positions to insert as stations (window/door edges)
 *  section(x)   → { y0, yb, yt, w, wt, r1, r2, crown, bulge, sideBulge }
 */
export function createLoft(cfg) {
  const L = cfg.length;
  const h = L / 2;
  const nose = { len: 0.6, p: 2.5, ...cfg.nose };
  const tail = { len: 0.5, p: 3, ...cfg.tail };
  const rake = { front: 0, rear: 0, ...cfg.rake };
  const counts = { bottom: 3, corner: 4, lower: 6, side: 6, roofCorner: 4, roof: 6, ...cfg.segments };

  const segStart = {};
  let H = 0;
  for (const s of SEGMENTS) { segStart[s] = H; H += counts[s]; }
  const R = 2 * H;

  /** Half-ring index for a position `t` (0..1) along a named segment. */
  const idx = (seg, t = 0) => {
    if (seg === 'top') return H;
    return segStart[seg] + Math.round(THREE.MathUtils.clamp(t, 0, 1) * counts[seg]);
  };

  // ---- stations ----
  const base = cfg.stations ?? 110;
  let xs = [];
  for (let i = 0; i <= base; i++) {
    const t = i / base;
    // mix of linear and cosine spacing: dense at the ends, still fine in the middle
    const s = 0.55 * t + 0.45 * (0.5 - 0.5 * Math.cos(Math.PI * t));
    xs.push(-h + L * s);
  }
  // extra density inside the nose/tail
  for (let i = 1; i < 12; i++) {
    const t = 1 - (1 - i / 12) ** 2;
    xs.push(h - nose.len * (1 - t), -h + tail.len * (1 - t));
  }
  for (const b of cfg.breaks ?? []) if (b > -h && b < h) xs.push(b);
  xs.sort((a, b) => a - b);
  xs = xs.filter((x, i) => i === 0 || x - xs[i - 1] > 0.002);
  const S = xs.length;

  const pinch = (x) => {
    let f = 1;
    if (x > h - nose.len) {
      const u = Math.min(1, (x - (h - nose.len)) / nose.len);
      f = Math.min(f, (1 - u ** nose.p) ** (1 / nose.p));
    }
    if (x < -h + tail.len) {
      const u = Math.min(1, (-h + tail.len - x) / tail.len);
      f = Math.min(f, (1 - u ** tail.p) ** (1 / tail.p));
    }
    return Math.max(f, 0);
  };
  const rakeAt = (x) => {
    if (x > h - nose.len) return rake.front * Math.min(1, (x - (h - nose.len)) / nose.len + 0.35);
    if (x < -h + tail.len) return -rake.rear * Math.min(1, (-h + tail.len - x) / tail.len + 0.35);
    return 0;
  };

  /** Half ring (z ≥ 0) at station x: array of [z, y], length H+1. Pinch applied. */
  function halfRing(x) {
    const s = cfg.section(x);
    const y0 = s.y0;
    const yb = Math.max(s.yb, y0 + 0.05);
    const yt = Math.max(s.yt, yb + 0.06);
    const w = s.w / 2;
    const wt = (s.wt ?? s.w * 0.9) / 2;
    const r1 = Math.min(s.r1 ?? 0.1, (yb - y0) * 0.8, w * 0.5);
    const r2 = Math.min(s.r2 ?? 0.1, (yt - yb) * 0.85, wt * 0.6);
    const crown = s.crown ?? 0.02;
    const bulge = s.bulge ?? 0.02;
    const sideBulge = s.sideBulge ?? 0;
    const P0 = [0, y0];
    const P1 = [w - r1, y0];
    const P2 = [w, y0 + r1];
    const P3 = [w, yb];
    const P4 = [wt, yt - r2];
    const P5 = [wt - r2, yt];
    const P6 = [0, yt + crown];
    const segs = {
      bottom: (t) => [P0[0] + (P1[0] - P0[0]) * t, y0],
      corner: (t) => quad(P1, [w, y0], P2, t),
      lower: (t) => quad(P2, [w + bulge, (P2[1] + P3[1]) / 2], P3, t),
      side: (t) => quad(P3, [(w + wt) / 2 + sideBulge, (P3[1] + P4[1]) / 2], P4, t),
      roofCorner: (t) => quad(P4, [wt, yt], P5, t),
      roof: (t) => quad(P5, [wt * 0.5, yt + crown], P6, t),
    };
    const f = pinch(x);
    const out = [];
    for (const name of SEGMENTS) {
      const n = counts[name];
      for (let i = 0; i < n; i++) {
        const [z, y] = segs[name](i / n);
        out.push([z * f, y]);
      }
    }
    out.push([P6[0] * f, P6[1]]);
    out.yb = yb;
    return out;
  }

  // ---- body grid ----
  const pos = new Float32Array(S * R * 3);
  for (let i = 0; i < S; i++) {
    const x = xs[i];
    const ring = halfRing(x);
    const rk = rakeAt(x);
    for (let j = 0; j < R; j++) {
      const hj = j <= H ? j : R - j;
      const sgn = j <= H ? 1 : -1;
      const [z, y] = ring[hj];
      const k = (i * R + j) * 3;
      pos[k] = x - rk * Math.max(0, y - ring.yb);
      pos[k + 1] = y;
      pos[k + 2] = sgn * z;
    }
  }
  const fullIndex = [];
  const quadOf = [];
  for (let i = 0; i < S - 1; i++) {
    for (let j = 0; j < R; j++) {
      const a = i * R + j;
      const b = i * R + ((j + 1) % R);
      const c = (i + 1) * R + j;
      const d = (i + 1) * R + ((j + 1) % R);
      fullIndex.push(a, c, b, b, c, d);
      quadOf.push([i, j]);
    }
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  body.setIndex(fullIndex);
  body.computeVertexNormals();
  const normals = body.attributes.normal.array;

  // ---- patches ----
  const holes = new Set();

  function quadsFor(spec) {
    const [xa, xb] = spec.x;
    const ia = spec.from;
    const ib = spec.to;
    const side = spec.side ?? 'both';
    const ranges = [];
    if (side === 'across') ranges.push([ia, R - ia]);
    else {
      if (side === 'both' || side === 'pos') ranges.push([ia, ib]);
      if (side === 'both' || side === 'neg') ranges.push([R - ib, R - ia]);
    }
    const list = [];
    for (let i = 0; i < S - 1; i++) {
      const xm = (xs[i] + xs[i + 1]) / 2;
      if (xm < xa || xm > xb) continue;
      for (const [r0, r1] of ranges) for (let j = r0; j < r1; j++) list.push([i, ((j % R) + R) % R]);
    }
    return list;
  }

  /**
   * Build a patch. spec = { x:[xa,xb], from, to, side:'both'|'pos'|'neg'|'across', offset, hole }
   * Returns a BufferGeometry following the body surface (offset along normals).
   */
  function patch(spec) {
    let list = quadsFor(spec);
    if (spec.skipHoles) list = list.filter(([i, j]) => !holes.has(i * R + j));
    const off = spec.offset ?? 0.003;
    if (spec.hole) for (const [i, j] of list) holes.add(i * R + j);
    const map = new Map();
    const p = [];
    const n = [];
    const index = [];
    const vert = (v) => {
      if (map.has(v)) return map.get(v);
      const k = v * 3;
      const nx = normals[k];
      const ny = normals[k + 1];
      const nz = normals[k + 2];
      p.push(pos[k] + nx * off, pos[k + 1] + ny * off, pos[k + 2] + nz * off);
      n.push(nx, ny, nz);
      map.set(v, p.length / 3 - 1);
      return p.length / 3 - 1;
    };
    for (const [i, j] of list) {
      const a = vert(i * R + j);
      const b = vert(i * R + ((j + 1) % R));
      const c = vert((i + 1) * R + j);
      const d = vert((i + 1) * R + ((j + 1) % R));
      index.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
    g.setIndex(index);
    return g;
  }

  /** Finalise the body geometry (call after all hole patches are created). */
  function bodyGeometry() {
    if (!holes.size) return body;
    const index = [];
    for (let q = 0; q < quadOf.length; q++) {
      const [i, j] = quadOf[q];
      if (holes.has(i * R + j)) continue;
      index.push(...fullIndex.slice(q * 6, q * 6 + 6));
    }
    const g = body.clone();
    g.setIndex(index);
    return g;
  }

  /** World point (and outward normal) on the surface at station x, segment position, side ±1. */
  function pointAt(x, seg, t = 0, side = 1) {
    const sample = (xx, hi) => {
      const ring = halfRing(xx);
      const k = THREE.MathUtils.clamp(hi, 0, H);
      const i0 = Math.floor(k);
      const i1 = Math.min(H, i0 + 1);
      const f = k - i0;
      const z = ring[i0][0] * (1 - f) + ring[i1][0] * f;
      const y = ring[i0][1] * (1 - f) + ring[i1][1] * f;
      const rk = rakeAt(xx);
      return new THREE.Vector3(xx - rk * Math.max(0, y - ring.yb), y, side * z);
    };
    const hi = segStart[seg] + t * counts[seg];
    const p = sample(x, hi);
    const dx = sample(x + 0.01, hi).sub(sample(x - 0.01, hi));
    const dr = sample(x, hi + 0.25).sub(sample(x, hi - 0.25));
    const nrm = dx.cross(dr).normalize();
    // Always point away from the body's centre line
    const sc = cfg.section(x);
    const cx = THREE.MathUtils.clamp(p.x, -h + tail.len, h - nose.len);
    const out = new THREE.Vector3(p.x - cx, p.y - (sc.y0 + sc.yt) / 2, p.z);
    if (nrm.dot(out) < 0) nrm.negate();
    return { point: p, normal: nrm };
  }

  return { patch, bodyGeometry, pointAt, idx, halfRing, stations: xs, pinch, H, R };
}

/** Place `object` on a surface point, facing along its normal (object's +Z → normal). */
export function placeOn(object, { point, normal }, offset = 0) {
  object.position.copy(point).addScaledVector(normal, offset);
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  return object;
}
