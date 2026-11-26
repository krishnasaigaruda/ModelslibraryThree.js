import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox as coreRoundedBox, curveTube, lathe, rng } from '../../core/utils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE, M, mesh, group, curveTube, lathe, rng };

/**
 * Active style while a styled factory runs (see styles.js). Helpers below
 * (legs, handles, door fronts, cushions, edges, upholstery) read it so every
 * model changes shape + materials per style trim without per-model code.
 */
export const STYLE = { cur: null };

/** Rounded box; the active style scales the edge radius (kids = very soft, modern = crisp). */
export function roundedBox(w, h, d, r = 0.05, segments = 3) {
  const st = STYLE.cur;
  return coreRoundedBox(w, h, d, st?.edge ? r * st.edge : r, st?.edge > 1.5 ? Math.max(segments, 4) : segments);
}

/**
 * Soft upholstered block: subdivided box projected onto a rounded box
 * (smooth analytic normals, dense vertices near edges) with a domed top/bottom.
 * Replaces the coarse core cushion() for furniture.
 */
export function cushion(w, h, d, { radius, bulge = 0.25 } = {}) {
  const st = STYLE.cur;
  if (st) {
    bulge *= st.puff ?? 1;
    if (radius != null) radius *= st.soft ?? 1;
  }
  const r = Math.min(radius ?? Math.min(w, h, d) * 0.35 * (st?.soft ?? 1), w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const axis = (len) => {
    const c = 5; // segments inside each rounded edge
    const mid = Math.max(2, Math.min(16, Math.round((len - 2 * r) / 0.04)));
    const pts = [];
    for (let i = 0; i <= c; i++) pts.push(-len / 2 + r * (1 - Math.cos((i / c) * Math.PI / 2)));
    for (let i = 1; i < mid; i++) pts.push(-len / 2 + r + ((len - 2 * r) * i) / mid);
    for (let i = c; i >= 0; i--) pts.push(len / 2 - r * (1 - Math.cos((i / c) * Math.PI / 2)));
    return pts;
  };
  const ax = axis(w);
  const ay = axis(h);
  const az = axis(d);
  const g = new THREE.BoxGeometry(w, h, d, ax.length - 1, ay.length - 1, az.length - 1);
  const p = g.attributes.position;
  const nrm = g.attributes.normal;
  const snap = (val, len, arr) => arr[Math.round(((val + len / 2) / len) * (arr.length - 1))];
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const v = new THREE.Vector3();
  const inner = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(snap(p.getX(i), w, ax), snap(p.getY(i), h, ay), snap(p.getZ(i), d, az));
    inner.set(THREE.MathUtils.clamp(v.x, -hw + r, hw - r), THREE.MathUtils.clamp(v.y, -hh + r, hh - r), THREE.MathUtils.clamp(v.z, -hd + r, hd - r));
    const dir = v.clone().sub(inner);
    if (dir.lengthSq() < 1e-12) dir.set(nrm.getX(i), nrm.getY(i), nrm.getZ(i));
    dir.normalize();
    v.copy(inner).addScaledVector(dir, r);
    // dome top & bottom, very slight belly on the sides
    const k = Math.max(0, (1 - (v.x / hw) ** 2) * (1 - (v.z / hd) ** 2));
    const fy = THREE.MathUtils.clamp((Math.abs(v.y) - (hh - r)) / r, 0, 1);
    v.y += Math.sign(v.y) * k * fy * h * bulge * 0.5;
    const side = 1 + 0.025 * Math.max(0, 1 - (v.y / hh) ** 2);
    v.x *= side;
    v.z *= side;
    p.setXYZ(i, v.x, v.y, v.z);
    nrm.setXYZ(i, dir.x, dir.y + (fy * k * bulge * Math.sign(v.y) * 0.0), dir.z);
  }
  p.needsUpdate = true;
  nrm.needsUpdate = true;
  return g;
}

/* ------------------------------------------------------------------ */
/* Procedural textures (DataTexture → works in browsers and Node)       */
/* ------------------------------------------------------------------ */

function valueNoise(seed) {
  const r = rng(seed);
  const N = 256;
  const perm = new Uint8Array(N * 2);
  const vals = new Float32Array(N);
  for (let i = 0; i < N; i++) { perm[i] = i; vals[i] = r(); }
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < N; i++) perm[i + N] = perm[i];
  const lat = (x, y) => vals[perm[(perm[x & 255] + y) & 511]];
  const sm = (t) => t * t * (3 - 2 * t);
  const n2 = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = sm(x - xi);
    const fy = sm(y - yi);
    const a = lat(xi, yi);
    const b = lat(xi + 1, yi);
    const c = lat(xi, yi + 1);
    const d = lat(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  return (x, y, oct = 3) => {
    let s = 0;
    let amp = 0.5;
    let f = 1;
    for (let o = 0; o < oct; o++) { s += amp * n2(x * f, y * f); amp *= 0.5; f *= 2; }
    return s;
  };
}

const texCache = new Map();
function dataTex(key, w, h, fill, repeat = [1, 1]) {
  if (texCache.has(key)) return texCache.get(key);
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fill(x, y);
      const i = (y * w + x) * 4;
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  texCache.set(key, t);
  return t;
}

/** Wood grain: long wavy rings + fine pores. Grain runs along U. */
export function woodTexture(hex) {
  const c = M.toColor(hex);
  const n = valueNoise(11);
  const base = [c.r * 255, c.g * 255, c.b * 255].map((v) => Math.pow(v / 255, 1 / 2.2) * 255);
  return dataTex(`wood:${hex}`, 512, 128, (x, y) => {
    const u = x / 512;
    const v = y / 128;
    const warp = n(u * 2.5, v * 1.5, 3) * 1.4 + Math.sin(u * 6.28 * 2) * 0.08;
    const ring = (v * 16 + warp) % 1;
    const band = Math.pow(Math.abs(Math.sin(ring * Math.PI)), 8);
    const pores = n(u * 160, v * 40, 1);
    const k = 0.9 + 0.08 * band - 0.06 * pores + 0.04 * n(u * 3, v * 2, 2);
    return base.map((ch) => ch * k);
  }, [1, 1]);
}

/** Woven fabric: tiny cross-hatch + mottling. */
export function fabricTexture(hex) {
  const c = M.toColor(hex);
  const n = valueNoise(5);
  const base = [c.r, c.g, c.b].map((v) => Math.pow(v, 1 / 2.2) * 255);
  return dataTex(`fabric:${hex}`, 128, 128, (x, y) => {
    const weave = ((x % 4 < 2) !== (y % 4 < 2) ? 1 : 0) * 0.06;
    const k = 0.92 + weave + 0.08 * (n(x / 18, y / 18, 2) - 0.5);
    return base.map((ch) => ch * k);
  }, [6, 6]);
}

/** Rug pattern: border bands + medallion grid, seeded. */
export function rugTexture(colors, seed = 1, style = 'persian') {
  const n = valueNoise(seed);
  const cols = colors.map((h) => { const c = M.toColor(h); return [c.r, c.g, c.b].map((v) => Math.pow(v, 1 / 2.2) * 255); });
  return dataTex(`rug:${colors.join()}:${seed}:${style}`, 256, 384, (x, y) => {
    const u = x / 256;
    const v = y / 384;
    const edge = Math.min(u, 1 - u, v * 1.5, (1 - v) * 1.5);
    let ci;
    if (style === 'stripes') ci = Math.floor(v * 14) % cols.length;
    else if (style === 'modern') ci = (n(u * 3, v * 3, 2) > 0.5 ? 1 : 0) + (edge < 0.05 ? 2 : 0);
    else {
      if (edge < 0.04) ci = 2;
      else if (edge < 0.1) ci = (Math.floor((u + v) * 40) % 2) ? 3 : 1;
      else if (edge < 0.12) ci = 2;
      else {
        const cu = (u - 0.5) * 2;
        const cv = (v - 0.5) * 2;
        const d = Math.abs(cu) + Math.abs(cv) * 0.7;
        ci = d < 0.35 ? 3 : d < 0.42 ? 2 : (Math.sin(cu * 20) * Math.sin(cv * 26) > 0.55 ? 1 : 0);
      }
    }
    const k = 0.9 + 0.12 * n(x / 3, y / 3, 1);
    return cols[ci % cols.length].map((ch) => ch * k);
  });
}

/** Marble / stone with soft veins. */
export function marbleTexture(hex = '#ece9e4', vein = '#8f8a84', seed = 3) {
  const n = valueNoise(seed);
  const a = M.toColor(hex);
  const b = M.toColor(vein);
  const A = [a.r, a.g, a.b].map((v) => Math.pow(v, 1 / 2.2) * 255);
  const B = [b.r, b.g, b.b].map((v) => Math.pow(v, 1 / 2.2) * 255);
  return dataTex(`marble:${hex}:${vein}:${seed}`, 256, 256, (x, y) => {
    const u = x / 256;
    const v = y / 256;
    const t = Math.abs(Math.sin((u * 3 + v * 2 + n(u * 4, v * 4, 4) * 3) * Math.PI));
    const k = Math.pow(1 - t, 12);
    const m = 0.96 + 0.04 * n(u * 20, v * 20, 2);
    return A.map((c, i) => (c * (1 - k) + B[i] * k) * m);
  });
}
export function stoneMat(hex = '#ece9e4', vein = '#8f8a84') {
  return new THREE.MeshPhysicalMaterial({ name: 'stone', color: '#ffffff', map: marbleTexture(hex, vein), roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.15 });
}
export function stainless() {
  return new THREE.MeshPhysicalMaterial({ name: 'stainless', color: '#c9ccd0', metalness: 1, roughness: 0.32, clearcoat: 0.3, clearcoatRoughness: 0.4 });
}

/** Abstract landscape painting for picture frames. */
export function paintingTexture(seed = 1) {
  const n = valueNoise(seed);
  const r = rng(seed);
  const sky = [r.range(120, 200), r.range(150, 210), r.range(200, 245)];
  const land = [r.range(60, 140), r.range(90, 150), r.range(40, 90)];
  const sun = [250, r.range(180, 230), 120];
  return dataTex(`paint:${seed}`, 256, 192, (x, y) => {
    const u = x / 256;
    const v = 1 - y / 192;
    const hill = 0.35 + 0.15 * n(u * 2, 0.5, 3);
    if (v < hill) return land.map((c, i) => c * (0.7 + 0.5 * v) + 20 * n(u * 30, v * 30, 2) * (i === 1 ? 1 : 0.5));
    const d = Math.hypot(u - 0.7, v - 0.72);
    if (d < 0.08) return sun;
    return sky.map((c) => c * (0.85 + 0.25 * v) + 18 * (n(u * 6, v * 14, 3) - 0.5));
  });
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

export function woodMat(kind = 'oak', { gloss = 0.35 } = {}) {
  if (kind === 'white' || kind === 'black') {
    return new THREE.MeshPhysicalMaterial({ name: 'wood', color: M.WOODS[kind], roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.3 });
  }
  const hex = M.WOODS[kind] ?? kind;
  return new THREE.MeshPhysicalMaterial({ name: 'wood', color: '#ffffff', map: woodTexture('#' + M.toColor(hex).getHexString()), roughness: 0.55, clearcoat: gloss, clearcoatRoughness: 0.35 });
}
function baseFabricMat(color) {
  return new THREE.MeshPhysicalMaterial({ name: 'fabric', color: '#ffffff', map: fabricTexture('#' + M.toColor(color).getHexString()), roughness: 0.95, sheen: 1, sheenRoughness: 0.5, sheenColor: M.toColor(color).lerp(new THREE.Color(1, 1, 1), 0.35) });
}
export function leatherMat(color) {
  return new THREE.MeshPhysicalMaterial({ name: 'leather', color: M.toColor(color), roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.5, sheen: 0.3 });
}
export function metalMat(kind = 'steel') {
  const k = { chrome: ['#eef0f2', 0.08], steel: ['#b9bdc2', 0.3], black: ['#1d1e20', 0.4], brass: ['#c9a24a', 0.25], white: ['#f1f1ef', 0.35], gold: ['#d4af37', 0.2] }[kind] ?? [kind, 0.3];
  return new THREE.MeshStandardMaterial({ name: 'metal', color: M.toColor(k[0]), metalness: kind === 'white' ? 0.3 : 1, roughness: k[1] });
}
export function enamel(color = '#f4f4f2') {
  return new THREE.MeshPhysicalMaterial({ name: 'paint', color: M.toColor(color), roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.1 });
}
export function ceramic(color = '#fbfbf8') {
  return new THREE.MeshPhysicalMaterial({ name: 'ceramic', color: M.toColor(color), roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
}
export function glassMat(tint = '#d7e6ea', opacity = 0.3) {
  return new THREE.MeshPhysicalMaterial({ name: 'glass', color: M.toColor(tint), roughness: 0.03, metalness: 0, transparent: true, opacity, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
}
export function plasticMat(color = '#222', roughness = 0.5) {
  return new THREE.MeshStandardMaterial({ name: 'plastic', color: M.toColor(color), roughness, metalness: 0 });
}

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** Box that tapers toward the bottom (tapered legs). Centered, height along Y. */
function baseTaperBox(w, h, d, bottomScale = 0.6) {
  const g = roundedBox(w, h, d, Math.min(w, d) * 0.18, 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) + h / 2) / h; // 0 bottom .. 1 top
    const s = bottomScale + (1 - bottomScale) * t;
    p.setX(i, p.getX(i) * s);
    p.setZ(i, p.getZ(i) * s);
  }
  g.computeVertexNormals();
  return g;
}

/** Turned leg via lathe. style: 'turned' | 'taper' | 'spindle' | 'bun' | 'baluster'. Base at y=0. */
function baseTurnedLeg(h, r, style = 'turned') {
  const P = {
    turned: [[0, 0], [r * 0.7, 0], [r * 0.75, h * 0.04], [r * 0.55, h * 0.1], [r * 0.6, h * 0.45], [r * 0.9, h * 0.5], [r * 0.6, h * 0.55], [r * 0.75, h * 0.8], [r, h * 0.82], [r, h], [0, h]],
    taper: [[0, 0], [r * 0.55, 0], [r, h], [0, h]],
    spindle: [[0, 0], [r * 0.6, 0], [r * 0.5, h * 0.2], [r * 0.85, h * 0.35], [r * 0.5, h * 0.5], [r * 0.7, h * 0.7], [r * 0.55, h * 0.9], [r * 0.7, h], [0, h]],
    bun: [[0, 0], [r * 0.7, 0], [r, h * 0.35], [r * 0.9, h * 0.7], [r * 0.5, h * 0.9], [r * 0.6, h], [0, h]],
    baluster: [[0, 0], [r * 0.8, 0], [r * 0.8, h * 0.06], [r * 0.5, h * 0.1], [r * 0.95, h * 0.35], [r * 0.45, h * 0.7], [r * 0.6, h * 0.85], [r * 0.6, h], [0, h]],
  }[style];
  return lathe(P, 20);
}

/**
 * Slab swept along a 2D path in the Z/Y plane (chair shells, bent plywood,
 * curved backrests, slats). path = [[z, y], ...]. `cup` curls the side edges.
 */
export function bentSlab(path, width, thickness, { cup = 0, segments = 28, radius } = {}) {
  const curve = new THREE.SplineCurve(path.map(([z, y]) => new THREE.Vector2(z, y)));
  // rounded-rectangle cross-section (x across, y through thickness)
  const r = Math.min(radius ?? thickness * 0.48, width / 2 - 1e-4, thickness / 2 - 1e-4);
  const hw = width / 2 - r;
  const ht = thickness / 2 - r;
  const sec = [];
  const corners = [[hw, ht, 0], [-hw, ht, Math.PI / 2], [-hw, -ht, Math.PI], [hw, -ht, Math.PI * 1.5]];
  // with a cup the flat faces need interior points, or the curl only lifts the edges
  // and the whole slab ends up flat (and raised by `cup`)
  const across = cup ? 12 : 0;
  corners.forEach(([cx, cy, a0], ci) => {
    for (let i = 0; i <= 4; i++) {
      const a = a0 + (i / 4) * (Math.PI / 2);
      sec.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    // after the top-left (ci 0 → 1 runs along the top face) and bottom-right corners
    if (ci === 0 || ci === 2) {
      const y = ci === 0 ? thickness / 2 : -thickness / 2;
      const dir = ci === 0 ? 1 : -1;
      for (let i = 1; i < across; i++) sec.push([dir * (hw - (2 * hw * i) / across), y]);
    }
  });
  const n = sec.length;
  const pos = [];
  const index = [];
  for (let k = 0; k <= segments; k++) {
    const s = k / segments;
    const pt = curve.getPointAt(s);
    const t = curve.getTangentAt(s);
    const nz = -t.y;
    const ny = t.x;
    for (const [x, yl] of sec) {
      const off = yl + cup * (x / (width / 2)) ** 2;
      pos.push(x, pt.y + ny * off, pt.x + nz * off);
    }
  }
  for (let k = 0; k < segments; k++) for (let i = 0; i < n; i++) {
    const a = k * n + i;
    const b = k * n + ((i + 1) % n);
    const c = (k + 1) * n + i;
    const d = (k + 1) * n + ((i + 1) % n);
    index.push(a, b, c, b, d, c);
  }
  // end caps (fan around centre)
  for (const [k, flip] of [[0, true], [segments, false]]) {
    const pt = curve.getPointAt(k / segments);
    const t = curve.getTangentAt(k / segments);
    const centre = pos.length / 3;
    pos.push(0, pt.y + t.x * cup * 0.3, pt.x - t.y * cup * 0.3);
    for (let i = 0; i < n; i++) {
      const a = k * n + i;
      const b = k * n + ((i + 1) % n);
      index.push(...(flip ? [centre, b, a] : [centre, a, b]));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** Closed rounded-rectangle loop of points at height y (for piping). */
export function rectLoop(w, d, y, r = 0.04, n = 6) {
  const pts = [];
  const hw = w / 2 - r;
  const hd = d / 2 - r;
  const corners = [[hw, hd, 0], [-hw, hd, Math.PI / 2], [-hw, -hd, Math.PI], [hw, -hd, Math.PI * 1.5]];
  for (const [cx, cz, a0] of corners) {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]);
    }
  }
  return pts;
}

/** Cushion with piping along top and bottom edges. Returns a group. */
export function pipedCushion(w, h, d, mat, { pipe = !(STYLE.cur && STYLE.cur.piping === false), pipeMat, bulge = 0.25, radius } = {}) {
  const g = new THREE.Group();
  const r = radius ?? Math.min(w, h, d) * 0.35;
  mesh(cushion(w, h, d, { radius: r, bulge }), mat, { parent: g });
  if (pipe) {
    const pr = Math.min(0.008, h * 0.06);
    for (const y of [h / 2 - r * 0.55, -h / 2 + r * 0.55]) {
      curveTube(rectLoop(w * 1.005, d * 1.005, y, Math.min(r, w / 2, d / 2) * 0.9), pr, pipeMat ?? mat, { parent: g, closed: true, segments: 96, radialSegments: 6 });
    }
  }
  return g;
}

/** Bar handle / pull. Along X. */
function baseBarPull(len, mat, { standoff = 0.03, r = 0.006 } = {}) {
  const g = new THREE.Group();
  curveTube([[-len / 2, 0, 0], [-len / 2, 0, standoff * 0.8], [-len / 2 + 0.01, 0, standoff], [len / 2 - 0.01, 0, standoff], [len / 2, 0, standoff * 0.8], [len / 2, 0, 0]], r, mat, { parent: g, segments: 24, radialSegments: 8 });
  return g;
}

function baseKnob(mat, r = 0.014) {
  const g = lathe([[0, 0], [r * 0.5, 0], [r * 0.4, r * 0.8], [r, r * 1.5], [r * 0.8, r * 2.2], [0, r * 2.3]], 16);
  g.rotateX(Math.PI / 2);
  return new THREE.Mesh(g, mat);
}

/** Drawer/door front panel with a recessed inner panel (shaker style). Faces +Z. */
function basePanelFront(w, h, t, mat, { shaker = true, inset = 0.035 } = {}) {
  const g = new THREE.Group();
  mesh(roundedBox(w, h, t, Math.min(0.006, t / 3), 2), mat, { parent: g });
  if (shaker && w > inset * 3 && h > inset * 3) {
    mesh(roundedBox(w - inset * 2, h - inset * 2, t * 0.5, 0.003, 1), mat, { parent: g, at: [0, 0, -t * 0.15] });
    // frame rails sit proud of the centre panel
    for (const [x, y, ww, hh] of [[0, h / 2 - inset / 2, w, inset], [0, -h / 2 + inset / 2, w, inset], [w / 2 - inset / 2, 0, inset, h], [-w / 2 + inset / 2, 0, inset, h]]) {
      mesh(roundedBox(ww, hh, t * 0.3, 0.002, 1), mat, { parent: g, at: [x, y, t / 2 - t * 0.1] });
    }
  }
  return g;
}

/** Drawer box (sides, back, bottom) that sits behind a drawer front at z=0. */
export function drawerBox(w, h, depth, mat) {
  const g = new THREE.Group();
  const t = 0.012;
  const inner = new THREE.MeshStandardMaterial({ color: '#d8c7a8', roughness: 0.8 });
  for (const sx of [1, -1]) mesh(roundedBox(t, h * 0.8, depth, 0.003, 1), inner, { parent: g, at: [sx * (w / 2 - t / 2 - 0.01), -h * 0.05, -depth / 2 - 0.01] });
  mesh(roundedBox(w - 0.02, h * 0.8, t, 0.003, 1), inner, { parent: g, at: [0, -h * 0.05, -depth - 0.005] });
  mesh(roundedBox(w - 0.02, t, depth, 0.003, 1), inner, { parent: g, at: [0, -h * 0.45 + t, -depth / 2 - 0.01] });
  return g;
}

/** Caster wheel for office chairs etc. */
export function caster(mat) {
  const g = new THREE.Group();
  const w = new THREE.CylinderGeometry(0.025, 0.025, 0.022, 16).rotateX(Math.PI / 2);
  mesh(w, mat, { parent: g, at: [0, 0.025, 0.012] });
  mesh(w, mat, { parent: g, at: [0, 0.025, -0.012] });
  mesh(roundedBox(0.03, 0.03, 0.035, 0.01), mat, { parent: g, at: [-0.01, 0.045, 0] });
  return g;
}

/** Five-star swivel base with gas lift; top of lift at y = h. */
export function starBase(parent, h, { mat, legLen = 0.32, liftMat } = {}) {
  if (STYLE.cur?.baseMetal) mat = metalMat(STYLE.cur.baseMetal);
  const base = new THREE.Group();
  parent.add(base);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 10;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    curveTube([[0, 0.1, 0], [dx * legLen * 0.5, 0.09, dz * legLen * 0.5], [dx * legLen, 0.07, dz * legLen]], 0.018, mat, { parent: base, segments: 12 });
    const c = caster(mat);
    c.position.set(dx * legLen, 0, dz * legLen);
    c.rotation.y = -a;
    base.add(c);
  }
  mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.06, 20), mat, { parent: base, at: [0, 0.1, 0] });
  mesh(new THREE.CylinderGeometry(0.028, 0.028, h - 0.12, 16), liftMat ?? metalMat('chrome'), { parent: base, at: [0, 0.12 + (h - 0.12) / 2, 0] });
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16), mat, { parent: base, at: [0, 0.18, 0] });
  return base;
}

/** Tufting buttons on a plane facing +Z. */
export function buttons(parent, mat, cols, rows, w, h, at, z = 0) {
  if (STYLE.cur && STYLE.cur.tufted === false) return;
  const geo = new THREE.SphereGeometry(0.011, 10, 6);
  // upholstery already in `parent`, raycast in parent-local space (only direct mesh children with identity transforms)
  const targets = parent.children.filter((m) => m.isMesh && m.position.lengthSq() === 0 && m.rotation.x === 0 && m.rotation.y === 0 && m.rotation.z === 0 && m.scale.x === 1);
  for (const m of targets) m.matrixWorld.identity(); // parent-local; finalize recomputes world matrices
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const off = r % 2 ? 0.5 : 0;
      if (off && c === cols - 1) continue;
      const x = -w / 2 + ((c + 0.5 + off) / cols) * w;
      const y = -h / 2 + ((r + 0.5) / rows) * h;
      const b = mesh(geo, mat, { parent, at: [at[0] + x, at[1] + y, at[2] + z] });
      // seat the button in the upholstery it tufts (bulging cushions would bury / strand it)
      ray.set(new THREE.Vector3(b.position.x, b.position.y, b.position.z + 0.5), new THREE.Vector3(0, 0, -1));
      const hit = targets.length && ray.intersectObjects(targets, false)[0];
      if (hit && Math.abs(hit.point.z - b.position.z) < 0.15) b.position.z = hit.point.z + 0.003;
    }
  }
}
const ray = new THREE.Raycaster();

/* ------------------------------------------------------------------ */
/* Style-aware parts (legs, handles, fronts, upholstery)               */
/* ------------------------------------------------------------------ */

/** Velvet / bouclé / linen / canvas / leather upholstery by the active style. */
export function fabricMat(color) {
  const kind = STYLE.cur?.upholstery;
  if (!kind || kind === 'fabric') return baseFabricMat(color);
  const c = M.toColor(color);
  const hex = '#' + c.getHexString();
  if (kind === 'leather') return leatherMat(color);
  if (kind === 'velvet') {
    return new THREE.MeshPhysicalMaterial({ name: 'fabric', color: c, roughness: 0.62, sheen: 1, sheenRoughness: 0.25, sheenColor: c.clone().lerp(new THREE.Color(1, 1, 1), 0.55) });
  }
  if (kind === 'boucle') {
    return new THREE.MeshPhysicalMaterial({ name: 'fabric', color: '#ffffff', map: boucleTexture(hex), roughness: 1, sheen: 0.6, sheenRoughness: 0.8, sheenColor: c.clone().lerp(new THREE.Color(1, 1, 1), 0.6) });
  }
  if (kind === 'linen' || kind === 'canvas') {
    return new THREE.MeshPhysicalMaterial({ name: 'fabric', color: '#ffffff', map: linenTexture(hex, kind === 'canvas'), roughness: 0.92, sheen: 0.4, sheenRoughness: 0.7, sheenColor: c.clone().lerp(new THREE.Color(1, 1, 1), 0.4) });
  }
  return baseFabricMat(color);
}

function boucleTexture(hex) {
  const c = M.toColor(hex);
  const n = valueNoise(21);
  const base = [c.r, c.g, c.b].map((v) => Math.pow(v, 1 / 2.2) * 255);
  return dataTex(`boucle:${hex}`, 128, 128, (x, y) => {
    const loops = n(x / 2.2, y / 2.2, 2);
    const k = 0.78 + 0.32 * loops + 0.06 * n(x / 20, y / 20, 1);
    return base.map((ch) => ch * k);
  }, [5, 5]);
}
function linenTexture(hex, coarse) {
  const c = M.toColor(hex);
  const n = valueNoise(31);
  const base = [c.r, c.g, c.b].map((v) => Math.pow(v, 1 / 2.2) * 255);
  const s = coarse ? 3 : 2;
  return dataTex(`linen:${hex}:${coarse}`, 128, 128, (x, y) => {
    const warp = 0.06 * Math.sin((x / s) * Math.PI) * (0.5 + n(x / 40, y, 1));
    const weft = 0.06 * Math.sin((y / s) * Math.PI) * (0.5 + n(x, y / 40, 1));
    const slub = 0.08 * (n(x / 3, y / 30, 1) - 0.5);
    return base.map((ch) => ch * (0.94 + warp + weft + slub));
  }, [6, 6]);
}

/** Woven cane texture for boho fronts / seats. */
export function caneTexture(hex = '#c9a26b') {
  const c = M.toColor(hex);
  const base = [c.r, c.g, c.b].map((v) => Math.pow(v, 1 / 2.2) * 255);
  return dataTex(`cane:${hex}`, 128, 128, (x, y) => {
    const u = x % 16;
    const v = y % 16;
    const d1 = Math.abs(((x + y) % 16) - 8);
    const d2 = Math.abs(((x - y + 128) % 16) - 8);
    const strand = Math.max(u > 5 && u < 11 ? 1 : 0, v > 5 && v < 11 ? 1 : 0, d1 < 1.5 ? 1 : 0, d2 < 1.5 ? 1 : 0);
    const hole = Math.hypot(u - 8, v - 8) < 2.4 && !(d1 < 1.5 || d2 < 1.5);
    const k = hole ? 0.25 : strand ? 1.05 : 0.7;
    return base.map((ch) => ch * k);
  }, [3, 3]);
}
export function caneMat(hex) {
  return new THREE.MeshStandardMaterial({ name: 'cane', color: '#ffffff', map: caneTexture(hex), roughness: 0.75 });
}

/** Sweep a circle of varying radius along a curve (cabriole legs, bent rods). */
function sweep(points, radiusAt, { segments = 24, radial = 12 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const g = new THREE.TubeGeometry(curve, segments, 1, radial, false);
  const pos = g.attributes.position;
  const frames = curve.computeFrenetFrames(segments, false);
  const v = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const c = curve.getPointAt(t);
    const r = radiusAt(t);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  // cap both ends so there are no open holes
  const caps = [0, 1].map((t) => {
    const r = radiusAt(t);
    const disc = new THREE.CircleGeometry(r, radial);
    const c = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    disc.lookAt(t ? tan : tan.clone().negate());
    disc.translate(c.x, c.y, c.z);
    return disc;
  });
  void frames;
  return mergeGeometries([g.toNonIndexed(), ...caps.map((c) => c.toNonIndexed())]);
}

/**
 * Leg geometry with the BASE AT y = 0. kinds: taper, block, metal (square tube), peg,
 * turned, spindle, baluster, bun, cabriole, hairpin, rattan, sabre.
 * `geometry.userData.leg` marks it so styles can splay / re-material it later.
 */
export function legGeometry(kind, w, h, d = w) {
  let g;
  const r = Math.min(w, d) / 2;
  switch (kind) {
    case 'block': g = coreRoundedBox(w * 1.35, h, d * 1.35, Math.min(w, d) * 0.12, 2).translate(0, h / 2, 0); break;
    case 'metal': g = coreRoundedBox(Math.max(0.025, w * 0.85), h, Math.max(0.025, d * 0.85), 0.003, 1).translate(0, h / 2, 0); break;
    case 'peg': g = lathe([[0, 0], [r * 0.6, 0], [r * 0.66, 0.004], [r * 1.02, h - 0.006], [r * 0.95, h], [0, h]], 20); break;
    case 'turned': case 'spindle': case 'baluster': case 'bun':
      g = baseTurnedLeg(h, r * 1.25, h < 0.18 && kind !== 'bun' ? 'bun' : kind); break;
    case 'cabriole': {
      const s = Math.max(w, 0.04);
      // knee bulges out (+X+Z diagonal), slim ankle, small pad foot that steps out
      const pts = [[0.45, 0], [0.12, 0.07], [-0.08, 0.35], [0.05, 0.72], [0.32, 0.88], [0, 1]].map(([o, t]) => [o * s * 0.7, t * h, o * s * 0.7]);
      g = sweep(pts, (t) => s * (t < 0.06 ? 0.55 - t * 2 : t < 0.2 ? 0.36 : t < 0.8 ? 0.36 + (t - 0.2) * 0.45 : 0.62), { segments: 28, radial: 12 });
      break;
    }
    case 'hairpin': {
      const sp = Math.max(0.07, Math.min(0.14, h * 0.25));
      const rod = (z) => sweep([[-sp, h, z], [-sp * 0.55, h * 0.55, z], [-0.012, 0.012, z], [0.012, 0.012, z], [sp * 0.55, h * 0.55, z], [sp, h, z]], () => 0.0055, { segments: 30, radial: 8 });
      const plate = coreRoundedBox(sp * 2 + 0.03, 0.006, 0.05, 0.002, 1).translate(0, h - 0.003, 0);
      g = mergeGeometries([rod(-0.012), rod(0.012), plate.toNonIndexed()].map((x) => (x.index ? x.toNonIndexed() : x)));
      g.translate(0, 0, 0);
      break;
    }
    case 'rattan': {
      const P = [[0, 0]];
      const n = Math.max(2, Math.round(h / 0.14));
      for (let i = 0; i < n; i++) {
        const y0 = (i / n) * h;
        const y1 = ((i + 1) / n) * h;
        P.push([r * 0.92, y0 + 0.002], [r * 1.08, y0 + 0.008], [r * 0.9, y0 + 0.016], [r * 0.86, (y0 + y1) / 2], [r * 0.9, y1 - 0.004]);
      }
      P.push([r * 0.9, h], [0, h]);
      g = lathe(P, 14).scale(1.5, 1, 1.5);
      break;
    }
    case 'pipe': {
      const pr = Math.max(0.014, Math.min(0.02, w * 0.4));
      const pipe = new THREE.CylinderGeometry(pr, pr, h - 0.016, 16).translate(0, h / 2, 0);
      const flange = new THREE.CylinderGeometry(pr * 2.4, pr * 2.4, 0.008, 20).translate(0, 0.004, 0);
      const flangeTop = new THREE.CylinderGeometry(pr * 2.2, pr * 2.2, 0.008, 20).translate(0, h - 0.004, 0);
      const collar = new THREE.CylinderGeometry(pr * 1.35, pr * 1.35, 0.03, 16).translate(0, 0.023, 0);
      g = mergeGeometries([pipe, flange, flangeTop, collar].map((x) => x.toNonIndexed()));
      break;
    }
    case 'sabre': {
      const s = Math.max(w, 0.035);
      g = sweep([[s * 0.5, 0, s * 0.5], [s * 0.2, h * 0.4, s * 0.2], [0, h, 0]], (t) => s * (0.32 + 0.2 * t), { segments: 16, radial: 10 });
      break;
    }
    default: g = baseTaperBox(w, h, d, 0.6).translate(0, h / 2, 0);
  }
  g.userData.leg = { kind, h };
  return g;
}

/** Tapered square leg, CENTRED (original API). Style-aware. */
export function taperBox(w, h, d, bottomScale = 0.6) {
  const kind = STYLE.cur?.leg;
  if (!kind) {
    const g = baseTaperBox(w, h, d, bottomScale);
    g.userData.leg = { kind: 'taper', h, centred: true };
    return g;
  }
  const g = legGeometry(kind, w, h, d).translate(0, -h / 2, 0);
  g.userData.leg = { kind, h, centred: true };
  return g;
}

/** Lathe-turned leg, BASE AT y = 0 (original API). Style-aware. */
export function turnedLeg(h, r, style = 'turned') {
  const kind = STYLE.cur?.leg;
  if (!kind) {
    const g = baseTurnedLeg(h, r, style);
    g.userData.leg = { kind: style, h };
    return g;
  }
  return legGeometry(kind, r * 1.6, h, r * 1.6);
}

function hardwareMat(fallback) {
  const st = STYLE.cur;
  if (!st) return fallback;
  if (st.hardwareMat) return st.hardwareMat;
  st.hardwareMat = st.hardware === 'wood' ? woodMat(st.wood) : st.hardware === 'leather' ? leatherMat('#7a4a2a') : st.hardware?.startsWith?.('#') ? plasticMat(st.hardware, 0.35) : metalMat(st.hardware ?? 'steel');
  return st.hardwareMat;
}

/** Drawer / door pull along X, sticking out along +Z. Style-aware (bar, slim, cup, ring, leather, edge, tbar, gold, knobs). */
export function barPull(len, mat, opts = {}) {
  const kind = STYLE.cur?.handle;
  if (!kind || kind === 'bar') return baseBarPull(len, hardwareMat(mat), opts);
  const m = hardwareMat(mat);
  const g = new THREE.Group();
  const r = opts.r ?? 0.006;
  if (kind === 'slim') {
    const L = len > 0.3 ? len : Math.max(len * 1.4, 0.12);
    mesh(coreRoundedBox(L, 0.012, 0.01, 0.003, 2), m, { parent: g, at: [0, 0, 0.026] });
    for (const x of [-L / 2 + 0.02, L / 2 - 0.02]) mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.024, 10).rotateX(Math.PI / 2), m, { parent: g, at: [x, 0, 0.012] });
  } else if (kind === 'tbar') {
    const L = Math.max(len, 0.1);
    mesh(new THREE.CylinderGeometry(r * 1.4, r * 1.4, L + 0.02, 14).rotateZ(Math.PI / 2), m, { parent: g, at: [0, 0, 0.035] });
    for (const x of [-L / 2 + 0.01, L / 2 - 0.01]) {
      mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.1, 0.035, 12).rotateX(Math.PI / 2), m, { parent: g, at: [x, 0, 0.0175] });
      mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.004, 16).rotateX(Math.PI / 2), m, { parent: g, at: [x, 0, 0.002] });
    }
  } else if (kind === 'cup') {
    // bin / cup pull: half shell with a back plate
    const W = Math.min(Math.max(len * 0.7, 0.08), 0.11);
    const shell = new THREE.CylinderGeometry(0.02, 0.02, W, 20, 1, true, Math.PI / 2, Math.PI).rotateZ(Math.PI / 2);
    shell.scale(1, 0.9, 1);
    mesh(shell, m, { parent: g, at: [0, 0, 0.004] }).material.side = THREE.DoubleSide;
    mesh(coreRoundedBox(W + 0.02, 0.022, 0.004, 0.002, 1), m, { parent: g, at: [0, 0.012, 0.002] });
    for (const s of [1, -1]) mesh(new THREE.CircleGeometry(0.02, 16, Math.PI / 2, Math.PI).rotateY(Math.PI / 2 * s), m, { parent: g, at: [s * W / 2, 0, 0.004] });
  } else if (kind === 'ring') {
    mesh(lathe([[0, 0], [0.022, 0], [0.024, 0.003], [0.016, 0.008], [0.008, 0.012], [0, 0.013]], 20).rotateX(Math.PI / 2), m, { parent: g });
    mesh(new THREE.TorusGeometry(0.022, 0.0035, 8, 28), m, { parent: g, at: [0, -0.02, 0.014] });
    mesh(new THREE.SphereGeometry(0.006, 10, 8), m, { parent: g, at: [0, 0.0, 0.012] });
  } else if (kind === 'leather') {
    const L = Math.min(Math.max(len * 0.8, 0.08), 0.16);
    curveTube([[-L / 2, 0, 0.002], [-L / 2 + 0.01, -0.006, 0.02], [0, -0.012, 0.03], [L / 2 - 0.01, -0.006, 0.02], [L / 2, 0, 0.002]], 0.006, m, { parent: g, segments: 24, radialSegments: 6 }).scale.set(1, 1, 1);
    for (const x of [-L / 2, L / 2]) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.006, 12).rotateX(Math.PI / 2), metalMat('brass'), { parent: g, at: [x, 0, 0.006] });
  } else if (kind === 'edge') {
    // routed finger lip / timber edge pull
    const L = len > 0.3 ? len : Math.max(len * 1.2, 0.12);
    mesh(coreRoundedBox(L, 0.016, 0.022, 0.006, 3), m, { parent: g, at: [0, 0, 0.011] });
  } else if (kind === 'gold') {
    const L = len > 0.3 ? len : Math.max(len * 1.5, 0.16);
    mesh(coreRoundedBox(L, 0.012, 0.012, 0.002, 1), m, { parent: g, at: [0, 0, 0.032] });
    for (const x of [-L / 2 + 0.015, L / 2 - 0.015]) mesh(coreRoundedBox(0.01, 0.01, 0.03, 0.002, 1), m, { parent: g, at: [x, 0, 0.015] });
  } else if (kind === 'knobs') {
    for (const x of len > 0.18 ? [-len / 4, len / 4] : [0]) { const k = styledKnob(m, 0.016); k.position.x = x; g.add(k); }
  } else return baseBarPull(len, m, opts);
  return g;
}

function styledKnob(m, r) {
  const kind = STYLE.cur?.knob ?? 'round';
  if (kind === 'square') return new THREE.Mesh(coreRoundedBox(r * 1.6, r * 1.6, r * 1.6, r * 0.25, 2).translate(0, 0, r * 0.8), m);
  if (kind === 'ball') { const g = new THREE.Group(); mesh(new THREE.SphereGeometry(r * 1.5, 18, 12), m, { parent: g, at: [0, 0, r * 1.7] }); mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.6, r * 0.6, 12).rotateX(Math.PI / 2), m, { parent: g, at: [0, 0, r * 0.3] }); return g; }
  if (kind === 'mushroom') return new THREE.Mesh(lathe([[0, 0], [r * 0.45, 0], [r * 0.4, r * 0.9], [r * 1.1, r * 1.3], [r * 1.05, r * 1.9], [r * 0.6, r * 2.3], [0, r * 2.35]], 18).rotateX(Math.PI / 2), m);
  if (kind === 'ring') { const g = new THREE.Group(); mesh(lathe([[0, 0], [r * 1.2, 0], [r * 1.1, r * 0.4], [r * 0.5, r * 0.8], [0, r * 0.85]], 16).rotateX(Math.PI / 2), m, { parent: g }); mesh(new THREE.TorusGeometry(r * 1.3, r * 0.22, 8, 24), m, { parent: g, at: [0, -r * 1.2, r * 0.9] }); return g; }
  return baseKnob(m, r);
}

/** Round knob facing +Z. Style-aware. */
export function knob(mat, r = 0.014) {
  if (!STYLE.cur) return baseKnob(mat, r);
  if (STYLE.cur.handle === 'cup' || STYLE.cur.handle === 'leather' || STYLE.cur.handle === 'ring') {
    // these styles use their pull even where a knob was planned
    return barPull(0.09, mat);
  }
  return styledKnob(hardwareMat(mat), r);
}

/** Drawer / door front facing +Z. Style-aware: slab, shaker, raised, slat, cane, reeded, industrial. */
export function panelFront(w, h, t, mat, opts = {}) {
  const st = STYLE.cur;
  if (!st?.front) return basePanelFront(w, h, t, mat, opts);
  const kind = st.front;
  const m = st.frontMat ?? mat;
  const small = h < 0.12 || w < 0.12;
  const g = new THREE.Group();
  if (kind === 'shaker') return basePanelFront(w, h, t, m, { shaker: !small });
  if (kind === 'slab' || (small && kind !== 'slat' && kind !== 'reeded')) {
    mesh(coreRoundedBox(w, h, t, Math.min(t / 3, (st.edge ?? 1) * 0.004), 2), m, { parent: g });
    if (kind === 'industrial') industrialTrim(g, w, h, t);
    return g;
  }
  if (kind === 'raised') {
    mesh(coreRoundedBox(w, h, t, Math.min(0.006, t / 3), 2), m, { parent: g });
    const iw = w - 0.11;
    const ih = h - 0.11;
    const shape = new THREE.Shape();
    shape.moveTo(-iw / 2, -ih / 2); shape.lineTo(iw / 2, -ih / 2); shape.lineTo(iw / 2, ih / 2); shape.lineTo(-iw / 2, ih / 2); shape.lineTo(-iw / 2, -ih / 2);
    const bev = Math.min(0.025, iw / 4, ih / 4);
    const pg = new THREE.ExtrudeGeometry(shape, { depth: 0.002, bevelEnabled: true, bevelThickness: t * 0.3, bevelSize: bev, bevelSegments: 2 });
    pg.scale((iw - bev * 0.4) / (iw + bev * 2), (ih - bev * 0.4) / (ih + bev * 2), 1);
    mesh(pg, m, { parent: g, at: [0, 0, t / 2] });
    // applied moulding frame
    for (const [x, y, ww, hh] of [[0, ih / 2 + 0.012, iw + 0.03, 0.01], [0, -ih / 2 - 0.012, iw + 0.03, 0.01], [iw / 2 + 0.012, 0, 0.01, ih + 0.03], [-iw / 2 - 0.012, 0, 0.01, ih + 0.03]]) {
      mesh(coreRoundedBox(ww, hh, 0.008, 0.003, 2), m, { parent: g, at: [x, y, t / 2 + 0.002] });
    }
    return g;
  }
  if (kind === 'slat') {
    mesh(coreRoundedBox(w, h, t * 0.6, 0.003, 1), m, { parent: g, at: [0, 0, -t * 0.2] });
    const n = Math.max(3, Math.round(w / 0.035));
    const sw = (w / n) * 0.72;
    for (let i = 0; i < n; i++) mesh(coreRoundedBox(sw, h - 0.004, t * 0.5, Math.min(0.004, sw / 3), 2), m, { parent: g, at: [-w / 2 + (i + 0.5) * (w / n), 0, t * 0.25] });
    return g;
  }
  if (kind === 'reeded') {
    mesh(coreRoundedBox(w, h, t * 0.7, 0.003, 1), m, { parent: g, at: [0, 0, -t * 0.15] });
    const n = Math.max(4, Math.round(w / 0.022));
    const rr = (w / n) * 0.5;
    const flute = new THREE.CylinderGeometry(rr, rr, h - 0.01, 10, 1, false, -Math.PI / 2, Math.PI);
    for (let i = 0; i < n; i++) mesh(flute, m, { parent: g, at: [-w / 2 + (i + 0.5) * (w / n), 0, t * 0.2] });
    return g;
  }
  if (kind === 'cane') {
    const fw = Math.min(0.045, w * 0.18);
    for (const [x, y, ww, hh] of [[0, h / 2 - fw / 2, w, fw], [0, -h / 2 + fw / 2, w, fw], [w / 2 - fw / 2, 0, fw, h - fw * 2 + 0.002], [-w / 2 + fw / 2, 0, fw, h - fw * 2 + 0.002]]) {
      mesh(coreRoundedBox(ww, hh, t, 0.004, 2), m, { parent: g, at: [x, y, 0] });
    }
    mesh(new THREE.BoxGeometry(w - fw * 2 + 0.004, h - fw * 2 + 0.004, t * 0.3), caneMat(st.caneColor), { parent: g, at: [0, 0, -t * 0.1] });
    return g;
  }
  if (kind === 'industrial') {
    mesh(coreRoundedBox(w, h, t, 0.003, 1), m, { parent: g });
    industrialTrim(g, w, h, t);
    return g;
  }
  return basePanelFront(w, h, t, m, opts);
}

function industrialTrim(g, w, h, t) {
  const iron = metalMat('black');
  const b = 0.018;
  for (const [x, y, ww, hh] of [[0, h / 2 - b / 2, w, b], [0, -h / 2 + b / 2, w, b], [w / 2 - b / 2, 0, b, h], [-w / 2 + b / 2, 0, b, h]]) mesh(coreRoundedBox(ww, hh, 0.004, 0.0015, 1), iron, { parent: g, at: [x, y, t / 2 + 0.002] });
  const rv = new THREE.SphereGeometry(0.004, 8, 6);
  for (const sx of [1, -1]) for (const sy of [1, -1]) mesh(rv, iron, { parent: g, at: [sx * (w / 2 - b / 2), sy * (h / 2 - b / 2), t / 2 + 0.005] });
}

/** Reclaimed timber: planks with seams, per-plank tone, saw marks. */
export function reclaimedTexture(hex = '#6b4a32') {
  const c = M.toColor(hex);
  const n = valueNoise(41);
  const base = [c.r, c.g, c.b].map((v) => Math.pow(v, 1 / 2.2) * 255);
  return dataTex(`reclaimed:${hex}`, 512, 256, (x, y) => {
    const u = x / 512;
    const v = y / 256;
    const plank = Math.floor(v * 5);
    const fv = v * 5 - plank;
    const tone = 0.75 + 0.5 * ((Math.sin(plank * 12.9898) * 43758.5453) % 1 + 1) % 1 * 0.6;
    const seam = fv < 0.03 || fv > 0.97 ? 0.35 : 1;
    const ring = Math.pow(Math.abs(Math.sin(((v * 40 + n(u * 3, v * 6, 3) * 2) % 1) * Math.PI)), 6);
    const knot = Math.max(0, 1 - Math.hypot((u * 7 + plank * 0.37) % 1 - 0.5, (fv - 0.5) * 0.5) * 9);
    const saw = 0.04 * Math.sin(u * 900 + n(u, v, 1) * 20);
    const k = tone * seam * (0.9 + 0.1 * ring - 0.35 * knot + saw) * (0.92 + 0.12 * n(u * 30, v * 8, 2));
    return base.map((ch) => ch * k);
  }, [1, 1]);
}
export function reclaimedMat(hex) {
  return new THREE.MeshPhysicalMaterial({ name: 'wood', color: '#ffffff', map: reclaimedTexture(hex), roughness: 0.85 });
}
export function lacquer(color) {
  return new THREE.MeshPhysicalMaterial({ name: 'paint', color: M.toColor(color), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
}

/** Rattan / wicker wrap: tight bands across the part with darker binding rings. */
export function rattanTexture(hex = '#c9a26b') {
  const c = M.toColor(hex);
  const n = valueNoise(51);
  const base = [c.r, c.g, c.b].map((v) => Math.pow(v, 1 / 2.2) * 255);
  return dataTex(`rattan:${hex}`, 64, 128, (x, y) => {
    const band = Math.abs(Math.sin((y / 3.2) * Math.PI));
    const bind = y % 64 < 6 ? 0.6 : 1;
    const k = (0.7 + 0.35 * band) * bind * (0.92 + 0.1 * n(x / 6, y / 2, 2));
    return base.map((ch) => ch * k);
  }, [2, 6]);
}
export function rattanMat(hex) {
  return new THREE.MeshStandardMaterial({ name: 'rattan', color: '#ffffff', map: rattanTexture(hex), roughness: 0.7 });
}
