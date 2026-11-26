import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/* Shared building blocks for organic models: noise, tapered branches,
 * vertex colouring, leaf cards and foliage clumps. */

const hasDOM = typeof document !== 'undefined';

/* ---------------- noise ---------------- */

function hash3(x, y, z, seed) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const fade = (t) => t * t * (3 - 2 * t);

/** Smooth 3D value noise in [-1, 1]. */
export function noise3(x, y, z, seed = 1) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = fade(x - xi);
  const yf = fade(y - yi);
  const zf = fade(z - zi);
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz, seed);
  const l = (a, b, t) => a + (b - a) * t;
  const v = l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
  return v * 2 - 1;
}

export function fbm(x, y, z, seed = 1, octaves = 4) {
  let a = 0.5;
  let f = 1;
  let s = 0;
  for (let i = 0; i < octaves; i++) {
    s += a * noise3(x * f, y * f, z * f, seed + i * 17);
    a *= 0.5;
    f *= 2.03;
  }
  return s;
}

/* ---------------- geometry helpers ---------------- */

/** Ensure geometry has position/normal/uv/color so everything merges. */
export function prep(geo, color) {
  if (geo.index) geo = geo.toNonIndexed();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const n = geo.attributes.position.count;
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  if (!geo.attributes.color) {
    const c = new THREE.Color(color ?? '#ffffff');
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3));
  }
  for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) geo.deleteAttribute(k);
  return geo;
}

export function merge(geos) {
  const list = geos.filter(Boolean).map((g) => prep(g));
  if (!list.length) return new THREE.BufferGeometry();
  return mergeGeometries(list, false);
}

/** Colour each vertex: fn(position, normal) → THREE.Color. */
export function paintVertices(geo, fn) {
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const arr = new Float32Array(p.count * 3);
  const v = new THREE.Vector3();
  const nv = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    if (n) nv.fromBufferAttribute(n, i);
    const c = fn(v, nv, i);
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3));
  return geo;
}

/**
 * Tube swept along `points` with radius r(t, angle). Smooth, tapering,
 * optional ribs (cactus) or rings (palm, bamboo) via the radius function.
 */
export function sweep(points, radiusAt, { radial = 8, segments, closeEnd = true, uvScale = 1 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const segs = segments ?? Math.max(4, points.length * 3);
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const P = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const r = radiusAt(t, a);
      const cx = Math.cos(a);
      const sy = Math.sin(a);
      pos.push(P.x + r * (cx * N.x + sy * B.x), P.y + r * (cx * N.y + sy * B.y), P.z + r * (cx * N.z + sy * B.z));
      uv.push(j / radial, t * uvScale);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  if (closeEnd) {
    const P = curve.getPointAt(1);
    const tip = pos.length / 3;
    pos.push(P.x, P.y, P.z);
    uv.push(0.5, uvScale);
    for (let j = 0; j < radial; j++) idx.push(segs * (radial + 1) + j, tip, segs * (radial + 1) + j + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Noise-displaced sphere for foliage masses and rocks. */
export function blob(radius, { detail = 2, seed = 1, amount = 0.25, freq = 1.6, scale = [1, 1, 1] } = {}) {
  // Icosahedron is non-indexed; weld it so normals are smooth (no facets)
  const raw = new THREE.IcosahedronGeometry(radius, detail);
  raw.deleteAttribute('normal');
  raw.deleteAttribute('uv');
  const g = mergeVertices(raw, 1e-5);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    const d = 1 + amount * fbm(n.x * freq + seed, n.y * freq, n.z * freq, seed, 3);
    v.copy(n).multiplyScalar(radius * d);
    p.setXYZ(i, v.x * scale[0], v.y * scale[1], v.z * scale[2]);
  }
  g.computeVertexNormals();
  return g;
}

/* ---------------- leaf textures + cards ---------------- */

const texCache = new Map();

/**
 * Canvas leaf-cluster texture (light grey so instance colours tint it).
 * Kinds follow real leaf shapes: broad (ovate), lobed (oak), maple (palmate),
 * pinnate (compound: ash, walnut, rowan), heart (linden, redbud), fan (ginkgo),
 * small (birch/aspen), narrow (eucalyptus, olive), long (willow, bamboo),
 * glossy (citrus, magnolia, laurel), blossom (5-petal), needle, ivy.
 */
export function leafTexture(kind = 'broad') {
  if (!hasDOM) return null;
  if (texCache.has(kind)) return texCache.get(kind);
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  g.clearRect(0, 0, S, S);
  const vein = (len, a = 0.28) => {
    g.strokeStyle = `rgba(0,0,0,${a})`;
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(-len / 2, 0);
    g.lineTo(len / 2, 0);
    g.stroke();
  };
  const fillShade = (shade) => {
    const l = Math.round(150 + shade * 105);
    g.fillStyle = `rgb(${l},${l},${l})`;
  };
  const shapes = {
    broad(len, wid) { g.beginPath(); g.moveTo(-len / 2, 0); g.quadraticCurveTo(-len * 0.1, -wid * 0.75, len / 2, 0); g.quadraticCurveTo(-len * 0.1, wid * 0.75, -len / 2, 0); g.fill(); vein(len); },
    glossy(len, wid) { shapes.broad(len, wid * 0.85); g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(0, -wid * 0.12, len * 0.3, wid * 0.12, 0, 0, Math.PI * 2); g.fill(); },
    small(len, wid) { g.beginPath(); g.ellipse(0, 0, len * 0.32, wid * 0.42, 0, 0, Math.PI * 2); g.fill(); vein(len * 0.6, 0.2); },
    narrow(len, wid) { shapes.broad(len, wid * 0.4); },
    long(len, wid) { g.beginPath(); g.ellipse(0, 0, len / 2, wid / 2, 0, 0, Math.PI * 2); g.fill(); },
    heart(len, wid) {
      g.beginPath(); g.moveTo(len * 0.45, 0);
      g.bezierCurveTo(len * 0.1, -wid * 0.7, -len * 0.55, -wid * 0.75, -len * 0.38, 0);
      g.bezierCurveTo(-len * 0.55, wid * 0.75, len * 0.1, wid * 0.7, len * 0.45, 0); g.fill(); vein(len * 0.8);
    },
    lobed(len, wid) {
      g.beginPath(); g.moveTo(-len / 2, 0);
      const lobes = 4;
      for (const side of [-1, 1]) {
        g.moveTo(-len / 2, 0);
        for (let k = 0; k <= lobes; k++) {
          const x = -len / 2 + (len * (k + 0.5)) / (lobes + 1);
          const w = wid * 0.5 * Math.sin(Math.PI * ((k + 0.7) / (lobes + 1.4)));
          g.quadraticCurveTo(x - len * 0.06, side * w * 1.25, x + len * 0.04, side * w * 0.45);
        }
        g.lineTo(len / 2, 0);
      }
      g.fill(); vein(len);
    },
    maple(len) {
      const r = len * 0.5;
      g.beginPath();
      const pts = 5;
      for (let k = 0; k <= pts * 2; k++) {
        const a = -Math.PI / 2 + (k / (pts * 2)) * Math.PI * 2 * 0.86 - Math.PI * 0.86 + Math.PI / 2;
        const rr = k % 2 === 0 ? r : r * 0.42;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.lineTo(0, r * 0.15); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1;
      for (let k = 0; k < pts; k++) { const a = -Math.PI * 0.93 + (k / (pts - 1)) * Math.PI * 0.86 * 1.0 + 0.2; g.beginPath(); g.moveTo(0, r * 0.1); g.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); g.stroke(); }
    },
    fan(len) {
      const r = len * 0.5;
      g.beginPath(); g.moveTo(0, r * 0.45); g.arc(0, r * 0.45, r, -Math.PI * 0.85, -Math.PI * 0.15); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.moveTo(0, r * 0.45); g.lineTo(0, -r * 0.45); g.stroke();
    },
    pinnate(len, wid) {
      g.strokeStyle = 'rgba(80,80,80,0.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-len / 2, 0); g.lineTo(len / 2, 0); g.stroke();
      const n = 4;
      for (let k = 0; k < n; k++) {
        const x = -len / 2 + (len * (k + 0.6)) / (n + 0.5);
        for (const sd of [-1, 1]) { g.save(); g.translate(x, sd * wid * 0.22); g.rotate(sd * 0.5); g.beginPath(); g.ellipse(0, 0, len * 0.1, wid * 0.14, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      }
      g.beginPath(); g.ellipse(len / 2, 0, len * 0.1, wid * 0.13, 0, 0, Math.PI * 2); g.fill();
    },
    ivy(len, wid) {
      g.beginPath();
      const r = len * 0.45;
      for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI * 2; const rr = k % 2 ? r * 0.55 : r; k ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); g.stroke(); }
      void wid;
    },
    blossom(len, wid) {
      for (let k = 0; k < 5; k++) { g.rotate((Math.PI * 2) / 5); g.beginPath(); g.ellipse(len * 0.28, 0, len * 0.28, wid * 0.5, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(170,80,90,0.9)'; g.beginPath(); g.arc(0, 0, wid * 0.16, 0, Math.PI * 2); g.fill();
    },
    needle(len, wid) { g.fillRect(-len / 2, -wid / 2, len, wid); },
  };
  const draw = shapes[kind] ?? shapes.broad;
  const leaf = (x, y, len, wid, ang, shade) => {
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    fillShade(shade);
    draw(len, wid);
    g.restore();
  };
  const spec = {
    needle: [220, () => [34 + rnd() * 18, 2.5]], blossom: [46, () => [34, 30]], long: [38, () => [70, 9]],
    narrow: [34, () => [62 + rnd() * 12, 18]], small: [60, () => [30 + rnd() * 8, 26]], maple: [26, () => [58 + rnd() * 10, 0]],
    fan: [32, () => [44 + rnd() * 8, 0]], pinnate: [16, () => [90 + rnd() * 16, 46]], lobed: [26, () => [60 + rnd() * 12, 34]],
    heart: [32, () => [46 + rnd() * 10, 40]], glossy: [28, () => [62 + rnd() * 12, 30]], ivy: [30, () => [44 + rnd() * 10, 40]],
  }[kind] ?? [38, () => [44 + rnd() * 14, 24 + rnd() * 8]];
  for (let i = 0; i < spec[0]; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * S * 0.38;
    const [len, wid] = spec[1]();
    const ang = kind === 'long' || kind === 'narrow' ? a + Math.PI / 2 + (rnd() - 0.5) * 0.5 : rnd() * Math.PI * 2;
    leaf(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, len, wid, ang, kind === 'blossom' ? 0.65 + rnd() * 0.35 : rnd());
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(kind, t);
  return t;
}

/**
 * Instanced leaf cards scattered around `centers` ([{p:Vector3, r}]).
 * Returns null when there is no DOM (Node) — clumps alone are used then.
 */
export function leafCards(centers, { rand, kind = 'broad', size = 0.6, perCenter = 14, colors, name = 'leaves', droop = 0, shell = [0.78, 1.12] } = {}) {
  const tex = leafTexture(kind);
  if (!tex || !centers.length) return null;
  const geo = new THREE.PlaneGeometry(size, size);
  const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.75, color: '#ffffff' });
  const count = centers.length * perCenter;
  const im = new THREE.InstancedMesh(geo, mat, count);
  im.name = name;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  let k = 0;
  for (const { p, r } of centers) {
    for (let i = 0; i < perCenter; i++) {
      const dir = new THREE.Vector3(rand() * 2 - 1, rand() * 1.6 - 0.5, rand() * 2 - 1).normalize();
      const pp = p.clone().addScaledVector(dir, r * (shell[0] + rand() * (shell[1] - shell[0])));
      pp.y -= droop * rand();
      e.set(rand() * Math.PI, rand() * Math.PI * 2, rand() * Math.PI);
      q.setFromEuler(e);
      const s = 0.7 + rand() * 0.6;
      m.compose(pp, q, new THREE.Vector3(s, s, s));
      im.setMatrixAt(k, m);
      col.set(colors[Math.floor(rand() * colors.length)]).offsetHSL(0, 0, (rand() - 0.5) * 0.08);
      im.setColorAt(k, col);
      k++;
    }
  }
  im.castShadow = true;
  return im;
}

/** Merged foliage masses with light-from-above vertex shading. */
export function clumps(centers, { rand, colors, seed = 1, detail = 2, flat = false } = {}) {
  const geos = centers.map(({ p, r }, i) => {
    const g = blob(r, { detail, seed: seed + i * 3.1, amount: 0.26, freq: 2.0, scale: [1, 0.85, 1] });
    g.translate(p.x, p.y, p.z);
    const base = new THREE.Color(colors[Math.floor(rand() * colors.length)]);
    paintVertices(g, (v, n) => {
      const light = 0.62 + 0.38 * Math.max(0, n.y) + 0.12 * fbm(v.x * 3, v.y * 3, v.z * 3, seed, 2);
      return base.clone().multiplyScalar(light);
    });
    return g;
  });
  const geo = merge(geos);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: flat });
  return new THREE.Mesh(geo, mat);
}

/**
 * Bark vertex colours per real bark type:
 *  furrowed (oak, ash, walnut, elm), smooth (beech, aspen-young), plates (pine),
 *  peeling (plane, eucalyptus), lenticel (cherry, birch-young), fibrous (redwood,
 *  cedar, juniper), birch (white with black lenticels), palm, ridged (baobab).
 */
export function barkColor(geo, base, { seed = 1, birch = false, style } = {}) {
  const c0 = new THREE.Color(base);
  const st = birch ? 'birch' : style ?? 'furrowed';
  const dark = c0.clone().multiplyScalar(0.6);
  return paintVertices(geo, (v) => {
    const streak = fbm(v.x * 6, v.y * 1.2, v.z * 6, seed, 3);
    switch (st) {
      case 'birch': {
        const mark = fbm(v.x * 4, v.y * 7, v.z * 4, seed + 5, 2);
        if (mark > 0.3) return new THREE.Color('#2b2724');
        return new THREE.Color('#ece8df').multiplyScalar(0.9 + streak * 0.15);
      }
      case 'smooth': return c0.clone().multiplyScalar(0.9 + 0.12 * fbm(v.x * 3, v.y * 3, v.z * 3, seed, 2));
      case 'peeling': {
        const n = fbm(v.x * 3.5, v.y * 2.5, v.z * 3.5, seed + 2, 3);
        if (n > 0.18) return new THREE.Color('#d9cfb4').multiplyScalar(0.95 + streak * 0.1);
        if (n < -0.15) return new THREE.Color('#8b8a6c').multiplyScalar(0.9 + streak * 0.1);
        return c0.clone().multiplyScalar(0.95 + streak * 0.1);
      }
      case 'plates': {
        const n = Math.abs(fbm(v.x * 5, v.y * 2.2, v.z * 5, seed + 4, 3));
        return n < 0.06 ? dark.clone() : c0.clone().multiplyScalar(0.85 + streak * 0.3);
      }
      case 'fibrous': return c0.clone().multiplyScalar(0.75 + 0.4 * (0.5 + 0.5 * fbm(v.x * 12, v.y * 0.6, v.z * 12, seed, 3)));
      case 'lenticel': {
        const band = Math.abs(Math.sin(v.y * 38 + fbm(v.x * 4, v.y, v.z * 4, seed, 2) * 2));
        return band > 0.94 ? new THREE.Color('#b7a48c') : c0.clone().multiplyScalar(0.9 + streak * 0.15);
      }
      default: return streak > 0.12 ? dark.clone().lerp(c0, 0.35) : c0.clone().multiplyScalar(0.85 + streak * 0.35);
    }
  });
}

/** Grey-scale bark relief texture (also used as bump map). Tiled along the branch. */
export function barkTexture(style = 'furrowed') {
  if (!hasDOM) return null;
  const key = `bark-${style}`;
  if (texCache.has(key)) return texCache.get(key);
  const W = 128;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = (x / W) * Math.PI * 2;
      // tileable around U by sampling noise on a cylinder
      const cx = Math.cos(u) * 1.6;
      const cz = Math.sin(u) * 1.6;
      const yy = (y / H) * 4;
      let v;
      if (style === 'furrowed') v = 0.55 + 0.45 * Math.tanh(4 * fbm(cx * 2.2, yy * 0.6, cz * 2.2, 3, 4));
      else if (style === 'plates') v = Math.abs(fbm(cx * 1.6, yy * 1.4, cz * 1.6, 5, 3)) < 0.07 ? 0.25 : 0.75 + 0.2 * fbm(cx * 5, yy * 5, cz * 5, 9, 2);
      else if (style === 'fibrous') v = 0.6 + 0.35 * fbm(cx * 6, yy * 0.3, cz * 6, 7, 3);
      else if (style === 'lenticel') v = Math.abs(Math.sin(yy * 14 + fbm(cx, yy, cz, 2, 2) * 2)) > 0.93 ? 0.45 : 0.82 + 0.08 * fbm(cx * 4, yy * 4, cz * 4, 1, 2);
      else if (style === 'peeling') v = fbm(cx * 1.3, yy * 1.0, cz * 1.3, 4, 3) > 0.1 ? 0.88 : 0.7 + 0.1 * fbm(cx * 6, yy * 6, cz * 6, 3, 2);
      else if (style === 'palm') v = 0.55 + 0.4 * Math.abs(Math.sin(yy * 6 + Math.sin(u * 3) * 0.3));
      else v = 0.8 + 0.12 * fbm(cx * 3, yy * 3, cz * 3, 8, 3);
      const l = Math.max(0, Math.min(255, Math.round(v * 255)));
      const i = (y * W + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = l;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

/** Bark material: vertex colour × relief texture + bump (browser), vertex colour only in Node. */
export const barkMaterial = (style) => {
  const tex = style ? barkTexture(style) : null;
  return new THREE.MeshStandardMaterial({ name: 'bark', vertexColors: true, roughness: 0.95, map: tex, bumpMap: tex, bumpScale: tex ? 1.2 : 1 });
};

/** Whiten up-facing surfaces (snow cover). `amount` 0..1. */
export function snowify(geo, amount = 1, { threshold = 0.35, seed = 1 } = {}) {
  const col = geo.attributes.color;
  const n = geo.attributes.normal;
  const p = geo.attributes.position;
  if (!col || !n) return geo;
  const white = new THREE.Color('#f3f6fa');
  const c = new THREE.Color();
  for (let i = 0; i < col.count; i++) {
    const k = THREE.MathUtils.smoothstep(n.getY(i) + 0.25 * fbm(p.getX(i) * 6, p.getY(i) * 6, p.getZ(i) * 6, seed, 2), threshold, threshold + 0.3) * amount;
    if (k <= 0) continue;
    c.fromBufferAttribute(col, i).lerp(white, k);
    col.setXYZ(i, c.r, c.g, c.b);
  }
  col.needsUpdate = true;
  return geo;
}

/** Low snow mound under a plant (always touches the ground). */
export function snowMound(radius, seed = 1) {
  const g = blob(radius, { detail: 3, seed, amount: 0.18, freq: 2.2, scale: [1, 0.12, 1] });
  g.translate(0, -0.005, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, 0);
  g.computeVertexNormals();
  return paintVertices(g, (v, nn) => new THREE.Color('#eef2f7').multiplyScalar(0.9 + 0.1 * Math.max(0, nn.y)));
}

/**
 * Fallen leaves lying flat on the ground in a ring of `radius` (autumn litter).
 * Instanced; works without a DOM (plain coloured quads in Node).
 */
export function leafLitter(radius, { rand, colors, kind = 'broad', count = 220, size = 0.12, name = 'leaf_litter' } = {}) {
  const tex = leafTexture(kind);
  const geo = new THREE.PlaneGeometry(size, size);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: tex ? 0.45 : 0, side: THREE.DoubleSide, roughness: 0.9 });
  const im = new THREE.InstancedMesh(geo, mat, count);
  im.name = name;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.7) * radius;
    q.setFromEuler(new THREE.Euler((rand() - 0.5) * 0.15, rand() * Math.PI * 2, (rand() - 0.5) * 0.15));
    const s = 0.6 + rand() * 0.8;
    m.compose(new THREE.Vector3(Math.cos(a) * r, 0.004 + rand() * 0.01, Math.sin(a) * r), q, new THREE.Vector3(s, 1, s));
    im.setMatrixAt(i, m);
    im.setColorAt(i, col.set(colors[Math.floor(rand() * colors.length)]).offsetHSL(0, 0, (rand() - 0.5) * 0.1));
  }
  im.receiveShadow = true;
  return im;
}

/* ---------------- conifer sprays + willow strands ---------------- */

/**
 * Fir/pine sprig texture: a stem along +U with needles angled toward the tip.
 * kind 'fir' = short dense flat needles (spruce), 'pine' = long needle bundles.
 */
export function sprigTexture(kind = 'fir') {
  if (!hasDOM) return null;
  const key = `sprig-${kind}`;
  if (texCache.has(key)) return texCache.get(key);
  const W = 512;
  const H = 128;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.lineCap = 'round';
  const needle = kind === 'pine' ? 46 : 26;
  const steps = kind === 'pine' ? 120 : 210;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const x = 8 + t * (W - 24);
    const taper = 1 - t * 0.55;
    for (const side of [1, -1]) {
      const len = needle * taper * (0.75 + rnd() * 0.5);
      const ang = (kind === 'pine' ? 0.55 : 0.9) + (rnd() - 0.5) * 0.3;
      const l = Math.round(150 + rnd() * 105);
      g.strokeStyle = `rgb(${l},${l},${l})`;
      g.lineWidth = kind === 'pine' ? 2.2 : 3;
      g.beginPath();
      g.moveTo(x, H / 2);
      g.lineTo(x + Math.cos(ang) * len, H / 2 + side * Math.sin(ang) * len);
      g.stroke();
    }
  }
  g.strokeStyle = 'rgb(110,90,70)';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(4, H / 2);
  g.lineTo(W - 10, H / 2);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

/** Hanging willow strand texture: thin stem with narrow leaves along V. */
export function strandTexture() {
  if (!hasDOM) return null;
  if (texCache.has('strand')) return texCache.get('strand');
  const W = 64;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  let s = 5;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 110; i++) {
    const y = 6 + (i / 110) * (H - 12);
    const side = i % 2 ? 1 : -1;
    const l = Math.round(160 + rnd() * 95);
    g.fillStyle = `rgb(${l},${l},${l})`;
    g.save();
    g.translate(W / 2, y);
    g.rotate(side * (0.35 + rnd() * 0.25));
    g.beginPath();
    g.ellipse(side * 10, 9, 6, 18, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  g.fillStyle = 'rgb(120,110,70)';
  g.fillRect(W / 2 - 2, 0, 4, H);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set('strand', t);
  return t;
}

/**
 * One spray: a strip from the origin along `dir` (unit, any direction) with
 * width `w`, drooping by `droop` (m at tip) and curling its edges down.
 * UV u runs along the spray (stem), v across it.
 */
export function sprayGeometry(len, w, dir, { droop = 0.2, curl = 0.25, tipUp = 0, segs = 6, color, colorTip } = {}) {
  const pos = [];
  const uv = [];
  const col = [];
  const idx = [];
  const d = dir.clone().normalize();
  const side = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0));
  if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
  side.normalize();
  const c0 = new THREE.Color(color ?? '#2d4a2a');
  const c1 = new THREE.Color(colorTip ?? color ?? '#3d6236');
  const across = 3;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const sag = -droop * t * t + tipUp * Math.pow(t, 4);
    const center = d.clone().multiplyScalar(len * t).add(new THREE.Vector3(0, sag, 0));
    const halfW = (w / 2) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.95)));
    for (let j = 0; j <= across; j++) {
      const v = j / across;
      const off = (v - 0.5) * 2;
      const p = center.clone().addScaledVector(side, off * halfW).add(new THREE.Vector3(0, -curl * halfW * off * off, 0));
      pos.push(p.x, p.y, p.z);
      uv.push(t, v);
      const c = c0.clone().lerp(c1, t);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < across; j++) {
      const a = i * (across + 1) + j;
      const b = a + across + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Material for sprays/strands: alpha-tested texture in the browser, solid fallback in Node. */
export function cardMaterial(tex, { roughness = 0.8 } = {}) {
  return new THREE.MeshStandardMaterial({
    name: 'foliage-cards',
    map: tex ?? null,
    alphaTest: tex ? 0.3 : 0,
    vertexColors: true,
    side: THREE.DoubleSide,
    roughness,
  });
}

/* ---------------- blades, placement, misc ---------------- */

/** Leaf / petal blade: width profile + curl, base at origin pointing +Y. */
export function bladeGeometry(len, wid, { curl = 0.3, cup = 0.15, segs = 6, tip = 0.15, color = '#4a7a30', tipColor } = {}) {
  const g = new THREE.PlaneGeometry(1, 1, 2, segs);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i);
    const t = p.getY(i) + 0.5;
    const w = Math.sin(Math.PI * Math.min(1, t * (1 - tip) + tip * 0.5 + 0.02)) * wid;
    p.setXYZ(i, u * w, t * len, curl * len * t * t + cup * wid * (u * 2) ** 2);
  }
  g.computeVertexNormals();
  const c0 = new THREE.Color(color);
  const c1 = new THREE.Color(tipColor ?? color).multiplyScalar(tipColor ? 1 : 1.2);
  return paintVertices(g, (v) => c0.clone().lerp(c1, THREE.MathUtils.clamp(v.y / len, 0, 1)));
}

/** Rotate (pitch about X, roll about Z, then yaw about Y) and move a geometry. */
export function place(geo, pos, yaw = 0, pitch = 0, roll = 0) {
  geo.rotateX(pitch);
  geo.rotateZ(roll);
  geo.rotateY(yaw);
  geo.translate(pos.x, pos.y, pos.z);
  return geo;
}

/** Instanced mesh from [{p, q?, s?, c?}]. */
export function instanced(geo, mat, items, name) {
  const im = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
  im.name = name;
  const m = new THREE.Matrix4();
  items.forEach((it, i) => {
    m.compose(it.p, it.q ?? new THREE.Quaternion(), it.s ?? new THREE.Vector3(1, 1, 1));
    im.setMatrixAt(i, m);
    if (it.c) im.setColorAt(i, new THREE.Color(it.c));
  });
  if (!items.length) im.count = 0;
  return im;
}

export const seedOf = (o, d) => (typeof o.seed === 'number' ? o.seed : o.seed ? [...String(o.seed)].reduce((a, c) => a + c.charCodeAt(0), 0) : d);
export const vcMat = (rough = 0.8, side = THREE.FrontSide, extra = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rough, side, ...extra });

/** Check a variant/trim pair against a VARIANTS table and TRIMS map. */
export function checkVariant(type, VARIANTS, TRIMS, variant, trim) {
  const v = variant ?? Object.keys(VARIANTS)[0];
  if (!VARIANTS[v]) throw new Error(`[three-premade] Unknown ${type} variant "${v}". Available: ${Object.keys(VARIANTS).join(', ')}`);
  if (trim && !(TRIMS[v] ?? []).includes(trim)) throw new Error(`[three-premade] Unknown ${type} trim "${trim}" for ${v}. Available: ${(TRIMS[v] ?? []).join(', ')}`);
  return v;
}

/** Brown/fade a colour list (dry, wilted). */
export const fadeColors = (cols, k = 0.55, to = '#9a7a44') => cols.map((c) => `#${new THREE.Color(c).lerp(new THREE.Color(to), k).getHexString()}`);

/** Terracotta / glazed pot for potted plants. Rim top at y = h. */
export function potGeometry(r = 0.2, h = 0.3, color = '#b5653a') {
  const g = new THREE.LatheGeometry([[0.001, 0], [r * 0.72, 0], [r * 0.78, 0.02], [r * 0.95, h * 0.85], [r * 1.06, h * 0.86], [r * 1.08, h], [r * 0.98, h], [r * 0.92, h * 0.9], [0.001, h * 0.9]].map(([x, y]) => new THREE.Vector2(x, y)), 32);
  g.computeVertexNormals();
  const c0 = new THREE.Color(color);
  paintVertices(g, (v) => (v.y > h * 0.88 && Math.hypot(v.x, v.z) < r * 0.93 ? new THREE.Color('#3a2a1e') : c0.clone().multiplyScalar(0.85 + 0.15 * fbm(v.x * 20, v.y * 20, v.z * 20, 3, 2))));
  return g;
}

/**
 * Leaf cards scattered over a mesh surface (clipped hedges, topiary): area-weighted
 * samples, each card hugging the surface with a random spin. Browser only (null in Node).
 */
export function surfaceCards(geo, { rand, kind = 'small', density = 250, size = 0.14, colors, name = 'surface_leaves', offset = 0.01, minY = 0.02, minNy = -2 } = {}) {
  const tex = leafTexture(kind);
  if (!tex) return null;
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position;
  const tris = p.count / 3;
  const areas = new Float32Array(tris);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let total = 0;
  for (let i = 0; i < tris; i++) {
    a.fromBufferAttribute(p, i * 3);
    b.fromBufferAttribute(p, i * 3 + 1);
    c.fromBufferAttribute(p, i * 3 + 2);
    const cr = b.clone().sub(a).cross(c.clone().sub(a));
    const ar = cr.length() / 2;
    total += (a.y > minY || b.y > minY) && cr.y / (ar * 2 || 1) >= minNy ? ar : 0;
    areas[i] = total;
  }
  const count = Math.min(6000, Math.round(total * density));
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.8, color: '#ffffff' }), count);
  im.name = name;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const n = new THREE.Vector3();
  const col = new THREE.Color();
  for (let k = 0; k < count; k++) {
    const r = rand() * total;
    let lo = 0;
    let hi = tris - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (areas[mid] < r) lo = mid + 1; else hi = mid; }
    a.fromBufferAttribute(p, lo * 3);
    b.fromBufferAttribute(p, lo * 3 + 1);
    c.fromBufferAttribute(p, lo * 3 + 2);
    let u = rand();
    let v = rand();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const pos = a.clone().addScaledVector(b.clone().sub(a), u).addScaledVector(c.clone().sub(a), v);
    n.copy(b).sub(a).cross(c.clone().sub(a)).normalize();
    pos.addScaledVector(n, offset * (0.3 + rand()));
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n.clone().add(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.9)).normalize());
    const s = 0.7 + rand() * 0.6;
    m.compose(pos, q, new THREE.Vector3(s, s, s));
    im.setMatrixAt(k, m);
    im.setColorAt(k, col.set(colors[Math.floor(rand() * colors.length)]).offsetHSL(0, 0, (rand() - 0.5) * 0.1));
  }
  return im;
}

/**
 * Keep everything at or above the ground: vertices of plain meshes below `minY`
 * are lifted to it (leaves/fronds rest on the soil) and instanced items that sank
 * are raised. Call before finalize (root at the origin, unrotated).
 */
export function groundGuard(root, minY = -0.05) {
  root.updateMatrixWorld(true);
  const m = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const e = o.matrixWorld.elements;
    if (Math.abs(e[1]) + Math.abs(e[9]) > 1e-6 || Math.abs(e[5] - 1) > 1e-6) return;
    if (o.isInstancedMesh) {
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m);
        m.decompose(pos, q, sc);
        if (pos.y + e[13] < 0.01) { pos.y = 0.01 - e[13]; o.setMatrixAt(i, m.compose(pos, q, sc)); }
      }
      o.instanceMatrix.needsUpdate = true;
      return;
    }
    const p = o.geometry.attributes.position;
    let changed = false;
    for (let i = 0; i < p.count; i++) if (p.getY(i) + e[13] < minY) { p.setY(i, minY - e[13]); changed = true; }
    if (changed) { o.geometry.computeVertexNormals(); o.geometry.computeBoundingBox(); }
  });
}
