import * as THREE from 'three';

/*
 * Animal engine core: skeleton helpers, a smooth "creature loft" (one continuous
 * surface along a spine curve with per-station superellipse cross-sections),
 * tapered tubes, seeded noise and coat painting via vertex colours.
 * Self-contained (doesn't depend on the people module).
 */

export const TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth01 = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const bump = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

export class Rig {
  constructor() {
    this.bones = [];
    this.byName = {};
    this.world = {};
  }
  add(name, pos, parent = null) {
    const b = new THREE.Bone();
    b.name = name;
    const p = new THREE.Vector3(...pos);
    this.world[name] = p;
    if (parent) {
      b.position.copy(p).sub(this.world[parent]);
      this.byName[parent].add(b);
    } else b.position.copy(p);
    this.byName[name] = b;
    this.bones.push(b);
    return b;
  }
  index(name) {
    return this.bones.indexOf(this.byName[name]);
  }
  get(name) {
    return this.byName[name];
  }
  has(name) {
    return !!this.byName[name];
  }
}

/** Write skin attributes: weightFn(i) → [[boneIndex, w], …]. */
export function applySkin(geo, weightFn) {
  const n = geo.attributes.position.count;
  const si = new Uint16Array(n * 4);
  const sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const ws = weightFn(i).filter(([, w]) => w > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const total = ws.reduce((a, [, w]) => a + w, 0) || 1;
    ws.forEach(([b, w], k) => {
      si[i * 4 + k] = b;
      sw[i * 4 + k] = w / total;
    });
    if (!ws.length) sw[i * 4] = 1;
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  return geo;
}

/** Weights along a bone chain given the parameter value of each bone's start (ascending). */
export function chain(t, bones, starts, blend = 0.04) {
  const out = [];
  for (let k = 0; k < bones.length; k++) {
    const lo = k === 0 ? 1 : smooth01((t - starts[k] + blend) / (2 * blend));
    const hi = k === bones.length - 1 ? 0 : smooth01((t - starts[k + 1] + blend) / (2 * blend));
    const w = lo - hi;
    if (w > 1e-4) out.push([bones[k], w]);
  }
  return out;
}

export function skinnedMesh(geo, material, skeleton, name) {
  const keep = ['position', 'normal', 'color', 'skinIndex', 'skinWeight', 'uv'];
  for (const k of Object.keys(geo.attributes)) if (!keep.includes(k)) geo.deleteAttribute(k);
  const m = new THREE.SkinnedMesh(geo, material);
  m.name = name;
  m.frustumCulled = false;
  m.bind(skeleton, new THREE.Matrix4());
  return m;
}

/** Quaternion track from per-frame Euler deltas applied on top of the node's rest rotation. */
export function poseTrack(node, period, fn, steps = 32) {
  const base = node.quaternion.clone();
  const times = [];
  const values = [];
  const e = new THREE.Euler();
  const q = new THREE.Quaternion();
  const d = new THREE.Quaternion();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [x, y, z] = fn(t);
    e.set(x, y, z, 'XYZ');
    q.copy(base).multiply(d.setFromEuler(e));
    times.push(t * period);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, times, values);
}

export function offsetTrack(node, period, fn, steps = 32) {
  const base = node.position.clone();
  const times = [];
  const values = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [dx, dy, dz] = fn(t);
    times.push(t * period);
    values.push(base.x + dx, base.y + dy, base.z + dz);
  }
  return new THREE.VectorKeyframeTrack(`${node.name}.position`, times, values);
}

/* ------------------------------------------------------------------ */
/* Noise                                                               */
/* ------------------------------------------------------------------ */

export function noise3(rand) {
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const vals = Array.from({ length: 256 }, () => rand());
  const h = (x, y, z) => vals[perm[(perm[(perm[x & 255] + y) & 255] + z) & 255]];
  const f = (t) => t * t * (3 - 2 * t);
  return (x, y, z) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const xf = f(x - xi);
    const yf = f(y - yi);
    const zf = f(z - zi);
    return lerp(
      lerp(lerp(h(xi, yi, zi), h(xi + 1, yi, zi), xf), lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf),
      lerp(lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf),
      zf,
    );
  };
}

/** Fractal noise 0..1 */
export function fbm(nz, x, y, z, oct = 3) {
  let a = 0.5;
  let s = 0;
  let w = 0;
  for (let i = 0; i < oct; i++) {
    s += a * nz(x, y, z);
    w += a;
    x *= 2.03;
    y *= 2.03;
    z *= 2.03;
    a *= 0.5;
  }
  return s / w;
}

/* ------------------------------------------------------------------ */
/* Keyed profiles                                                      */
/* ------------------------------------------------------------------ */

/**
 * Smoothly interpolated keyed values: keys = [[t, {a:1,b:2}], …] (t ascending).
 * Returns (t) → interpolated object (cosine-smooth between keys).
 */
export function keyed(keys) {
  // monotone cubic (Fritsch–Carlson) per property: smooth radius profiles without
  // the flat "steps" a smoothstep between keys produces (those showed up as rings)
  const ks = keys.slice().sort((a, b) => a[0] - b[0]);
  const names = [...new Set(ks.flatMap(([, o]) => Object.keys(o)))];
  const xs = ks.map((k) => k[0]);
  const n = xs.length;
  const curves = {};
  for (const nm of names) {
    const ys = ks.map(([, o], i) => o[nm] ?? ks.slice(0, i).reverse().find(([, q]) => q[nm] != null)?.[1][nm] ?? ks.find(([, q]) => q[nm] != null)[1][nm]);
    const dx = [];
    const sl = [];
    for (let i = 0; i < n - 1; i++) {
      dx.push(Math.max(1e-9, xs[i + 1] - xs[i]));
      sl.push((ys[i + 1] - ys[i]) / dx[i]);
    }
    const m = new Array(n).fill(0);
    if (n > 1) {
      m[0] = sl[0];
      m[n - 1] = sl[n - 2];
      for (let i = 1; i < n - 1; i++) m[i] = sl[i - 1] * sl[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / sl[i - 1] + (dx[i] + 2 * dx[i - 1]) / sl[i]);
    }
    curves[nm] = { ys, m, dx };
  }
  return (t) => {
    const out = {};
    if (n === 1 || t <= xs[0]) {
      for (const nm of names) out[nm] = curves[nm].ys[0];
      return out;
    }
    if (t >= xs[n - 1]) {
      for (const nm of names) out[nm] = curves[nm].ys[n - 1];
      return out;
    }
    let i = 0;
    while (t > xs[i + 1]) i++;
    for (const nm of names) {
      const { ys, m, dx } = curves[nm];
      const h = dx[i];
      const u = (t - xs[i]) / h;
      const u2 = u * u;
      const u3 = u2 * u;
      out[nm] = (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
    }
    return out;
  };
}

/* ------------------------------------------------------------------ */
/* Creature loft                                                       */
/* ------------------------------------------------------------------ */

const _T = new THREE.Vector3();
const _L = new THREE.Vector3();
const _U = new THREE.Vector3();
const _P = new THREE.Vector3();

/**
 * Loft along a curve. section(t) → { w, up, dn, e (exponent 2=ellipse, >2 boxy),
 *   wt (width scale at top 0..∞, default 1), wb (width scale at bottom), yo (vertical offset) }.
 * lateral: fixed lateral axis (default X → curve should lie in a plane ⟂ X), or
 * 'auto' for curves in the XZ plane (snakes) where lateral = up × T.
 * displace(t, a, p, n) → metres along the normal (fur, wool, noise).
 * Adds per-vertex attributes lt (0..1 along), la (angle; 0 top, π bottom), sx, sy (section-normalised coords).
 * Closed at both ends with poles.
 */
export function loft(curve, section, { n = 120, ring = 28, lateral = 'x', displace, capStart = true, capEnd = true, range = [0, 1], seam = false } = {}) {
  const pos = [];
  const uvs = [];
  const RN = seam ? ring + 1 : ring; // seam: duplicate the first column so UVs can wrap cleanly
  const lt = [];
  const la = [];
  const sxa = [];
  const sya = [];
  const idx = [];
  const frames = [];
  const fr = lateral === 'free' ? curve.computeFrenetFrames(n, false) : null;
  for (let i = 0; i <= n; i++) {
    const t = range[0] + (i / n) * (range[1] - range[0]);
    const p = curve.getPointAt(t).clone();
    const T = curve.getTangentAt(t).clone().normalize();
    let L;
    if (fr) L = fr.normals[i].clone();
    else if (lateral === 'x') L = new THREE.Vector3(1, 0, 0);
    else L = new THREE.Vector3(0, 1, 0).cross(T).normalize();
    // orthonormalise
    L.addScaledVector(T, -L.dot(T)).normalize();
    const U = new THREE.Vector3().crossVectors(T, L).normalize();
    frames.push({ p, T, L, U });
    const s = section(t);
    const e = s.e ?? 2;
    for (let j = 0; j < RN; j++) {
      const a = ((j % ring) / ring) * TAU;
      uvs.push(i / n, j / ring);
      const sa = Math.sin(a);
      const ca = Math.cos(a);
      const sy = Math.sign(ca) * Math.abs(ca) ** (2 / e);
      const sxn = Math.sign(sa) * Math.abs(sa) ** (2 / e);
      const wScale = sy >= 0 ? lerp(1, s.wt ?? 1, sy) : lerp(1, s.wb ?? 1, -sy);
      const x = s.w * wScale * sxn;
      const y = (sy >= 0 ? s.up : s.dn) * sy + (s.yo ?? 0);
      _P.copy(p).addScaledVector(L, x).addScaledVector(U, y);
      pos.push(_P.x, _P.y, _P.z);
      lt.push(t);
      la.push(a);
      sxa.push(sxn);
      sya.push(sy);
    }
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < ring; j++) {
      const a = i * RN + j;
      const b = i * RN + (seam ? j + 1 : (j + 1) % ring);
      const c = a + RN;
      const d = b + RN;
      idx.push(a, c, b, b, c, d);
    }
  }
  const addPole = (i, t, dir) => {
    const f = frames[i];
    const s = section(t);
    const k = pos.length / 3;
    const tip = f.p.clone().addScaledVector(f.U, s.yo ?? 0).addScaledVector(f.T, dir * Math.min(s.w, (s.up + s.dn) / 2) * 0.35);
    pos.push(tip.x, tip.y, tip.z);
    uvs.push(i / n, 0.5);
    lt.push(t);
    la.push(0);
    sxa.push(0);
    sya.push(0);
    for (let j = 0; j < ring; j++) {
      const a = i * RN + j;
      const b = i * RN + (seam ? j + 1 : (j + 1) % ring);
      if (dir < 0) idx.push(k, a, b);
      else idx.push(k, b, a);
    }
  };
  if (capStart) addPole(0, range[0], -1);
  if (capEnd) addPole(n, range[1], 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('lt', new THREE.Float32BufferAttribute(lt, 1));
  g.setAttribute('la', new THREE.Float32BufferAttribute(la, 1));
  g.setAttribute('sx', new THREE.Float32BufferAttribute(sxa, 1));
  g.setAttribute('sy', new THREE.Float32BufferAttribute(sya, 1));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  const seamNormals = () => {
    g.computeVertexNormals();
    if (!seam) return;
    const N = g.attributes.normal;
    const v = new THREE.Vector3();
    const w = new THREE.Vector3();
    for (let i = 0; i <= n; i++) {
      const a = i * RN;
      const b = a + ring;
      v.fromBufferAttribute(N, a).add(w.fromBufferAttribute(N, b)).normalize();
      N.setXYZ(a, v.x, v.y, v.z);
      N.setXYZ(b, v.x, v.y, v.z);
    }
  };
  seamNormals();
  if (displace) {
    const P = g.attributes.position;
    const N = g.attributes.normal;
    const p = new THREE.Vector3();
    const nn = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      p.fromBufferAttribute(P, i);
      nn.fromBufferAttribute(N, i);
      const d = displace(lt[i], la[i], p, nn, sxa[i], sya[i]);
      if (d) P.setXYZ(i, p.x + nn.x * d, p.y + nn.y * d, p.z + nn.z * d);
    }
    seamNormals();
  }
  g.userData.frames = frames;
  g.userData.section = section;
  g.userData.ring = ring;
  g.userData.n = n;
  return g;
}

/** Point on a loft surface (before displacement): t along, a angle (0 top, π/2 = +X side). Returns { p, n }. */
export function surfacePoint(curve, section, t, a, lateral = 'x') {
  const p = curve.getPointAt(clamp(t)).clone();
  const T = curve.getTangentAt(clamp(t)).clone().normalize();
  const L = lateral === 'x' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0).cross(T).normalize();
  L.addScaledVector(T, -L.dot(T)).normalize();
  const U = new THREE.Vector3().crossVectors(T, L).normalize();
  const s = section(t);
  const e = s.e ?? 2;
  const sa = Math.sin(a);
  const ca = Math.cos(a);
  const sy = Math.sign(ca) * Math.abs(ca) ** (2 / e);
  const sxn = Math.sign(sa) * Math.abs(sa) ** (2 / e);
  const wScale = sy >= 0 ? lerp(1, s.wt ?? 1, sy) : lerp(1, s.wb ?? 1, -sy);
  const x = s.w * wScale * sxn;
  const y = (sy >= 0 ? s.up : s.dn) * sy + (s.yo ?? 0);
  const out = p.clone().addScaledVector(L, x).addScaledVector(U, y);
  const nrm = L.clone().multiplyScalar(sa / Math.max(1e-4, s.w)).addScaledVector(U, ca / Math.max(1e-4, sy >= 0 ? s.up : s.dn)).normalize();
  return { p: out, n: nrm, T, L, U };
}

/** Curve through points (centripetal Catmull-Rom). */
export function spline(points) {
  return new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p))), false, 'centripetal');
}

/** Arc-length parameter of the curve point nearest to `p`. */
export function tNear(curve, p, samples = 400) {
  const v = p.isVector3 ? p : new THREE.Vector3(...p);
  let best = 0;
  let bd = Infinity;
  const q = new THREE.Vector3();
  for (let i = 0; i <= samples; i++) {
    curve.getPointAt(i / samples, q);
    const d = q.distanceToSquared(v);
    if (d < bd) {
      bd = d;
      best = i / samples;
    }
  }
  return best;
}

/** Round tapered tube along points: radius(t). Returns geometry with lt attribute. */
export function tube(points, radius, { n = 24, ring = 10, lateral = 'auto', e = 2, flat = 1 } = {}) {
  const c = spline(points);
  return { curve: c, geometry: loft(c, (t) => ({ w: radius(t) * flat, up: radius(t), dn: radius(t), e }), { n, ring, lateral: lateralFor(c, lateral) }) };
}

/** Pick a stable lateral axis for an arbitrary curve. */
function lateralFor(curve, lateral) {
  if (lateral !== 'auto') return lateral;
  // if the curve has no X extent, X works as a fixed lateral axis
  const a = curve.points;
  const xs = a.map((p) => p.x);
  if (Math.max(...xs) - Math.min(...xs) < 1e-6) return 'x';
  return 'free';
}

/* ------------------------------------------------------------------ */
/* Coat painting                                                       */
/* ------------------------------------------------------------------ */

/** Paint vertex colours: fn(i, p, n, attrs) → THREE.Color */
export function paint(geo, fn) {
  const P = geo.attributes.position;
  const N = geo.attributes.normal;
  const col = new Float32Array(P.count * 3);
  const p = new THREE.Vector3();
  const nn = new THREE.Vector3();
  const A = geo.attributes;
  for (let i = 0; i < P.count; i++) {
    p.fromBufferAttribute(P, i);
    nn.fromBufferAttribute(N, i);
    const c = fn(i, p, nn, A);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

export const C = (c) => (c instanceof THREE.Color ? c.clone() : new THREE.Color(c));
export const mix = (a, b, t) => a.clone().lerp(b, clamp(t));

export function furMaterial({ name = 'primary', roughness = 0.82, sheen = 0.6 } = {}) {
  return new THREE.MeshPhysicalMaterial({ name, vertexColors: true, roughness, metalness: 0, sheen, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff').multiplyScalar(0.35) });
}

/* ------------------------------------------------------------------ */
/* Lattice-free smooth noise (sum of random plane waves) for fur relief */
/* ------------------------------------------------------------------ */
export function waveNoise(rand, k = 7) {
  const waves = [];
  for (let i = 0; i < k; i++) {
    const d = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    waves.push([d, 0.7 + rand() * 0.9, rand() * TAU]);
  }
  return (x, y, z) => {
    let s = 0;
    for (const [d, f, ph] of waves) s += Math.sin((x * d.x + y * d.y + z * d.z) * f + ph);
    return 0.5 + s / (2 * k) * 1.6;
  };
}

/* ------------------------------------------------------------------ */
/* Texture baking: paint a loft's coat into a canvas (crisp patterns)   */
/* ------------------------------------------------------------------ */
const _bc = new THREE.Color();
/**
 * Bakes fn(p, n, { t, a, sx, sy }) → THREE.Color over a seam loft's UV space
 * (u = t·uScale along the curve, v = angle/2π). Returns a CanvasTexture, or null
 * outside the browser. Pixels with u > uScale are white (for parts that use
 * vertex colours only).
 */
export function bakeLoft(curve, section, fn, { W = 512, H = 256, uScale = 0.96, range = [0, 1] } = {}) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H);
  const d = img.data;
  d.fill(255);
  const L = new THREE.Vector3();
  const U = new THREE.Vector3();
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (let x = 0; x < W; x++) {
    const u = (x + 0.5) / W;
    if (u > uScale) continue;
    const t = range[0] + (u / uScale) * (range[1] - range[0]);
    const p = curve.getPointAt(clamp(t));
    const T = curve.getTangentAt(clamp(t)).normalize();
    L.set(1, 0, 0).addScaledVector(T, -T.x).normalize();
    U.crossVectors(T, L).normalize();
    const s = section(t);
    const e = s.e ?? 2;
    for (let y = 0; y < H; y++) {
      const a = ((y + 0.5) / H) * TAU;
      const sa = Math.sin(a);
      const ca = Math.cos(a);
      const sy = Math.sign(ca) * Math.abs(ca) ** (2 / e);
      const sx = Math.sign(sa) * Math.abs(sa) ** (2 / e);
      const ws = sy >= 0 ? lerp(1, s.wt ?? 1, sy) : lerp(1, s.wb ?? 1, -sy);
      P.copy(p).addScaledVector(L, s.w * ws * sx).addScaledVector(U, (sy >= 0 ? s.up : s.dn) * sy + (s.yo ?? 0));
      N.copy(L).multiplyScalar(sa / Math.max(1e-4, s.w)).addScaledVector(U, ca / Math.max(1e-4, sy >= 0 ? s.up : s.dn)).normalize();
      _bc.copy(fn(P, N, { t, a, sx, sy })).convertLinearToSRGB();
      const o = (y * W + x) * 4;
      d[o] = Math.min(255, _bc.r * 255);
      d[o + 1] = Math.min(255, _bc.g * 255);
      d[o + 2] = Math.min(255, _bc.b * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}
