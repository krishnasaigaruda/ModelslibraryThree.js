// Shared helpers for the science category: trims, finishes, lab glass + liquids,
// hollow lathe vessels, canvas labels, lamps and the "settle on the ground" wrapper.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { clip } from '../../core/animation.js';
import { brandEmblem } from '../../core/brand.js';

export { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, brandEmblem };

/*
 * Trims shared by most science types. Each carries a palette (p primary, s secondary,
 * a accent), a finish and shape flags the builders read:
 *   vintage    → brass + dark wood, ornate shapes, no screens
 *   school     → bright chunky plastic, bigger knobs, simpler parts
 *   research   → clean white lab grade with extra modules (detail 2)
 *   industrial → heavy safety-yellow steel, hazard stripes, bigger frames
 *   futuristic → black carbon with cyan light strips (lights up, 'on')
 *   weathered  → faded, dusty, worn and patched
 *   gold-foil  → space-grade gold foil / anodised parts (space types)
 *   arctic     → white + blue cold-weather kit with orange accents
 */
export const TRIMS = {
  vintage: { p: '#6b4426', s: '#c9a24a', a: '#2b211a', finish: 'wood', vintage: true },
  school: { p: '#2b7de1', s: '#ffc81e', a: '#ff4d6d', finish: 'plastic', kids: true, chunky: 1.35 },
  research: { p: '#eef0f3', s: '#3a4250', a: '#1e88e5', finish: 'gloss', detail: 2 },
  industrial: { p: '#f2b705', s: '#2a2d33', a: '#d23b2a', finish: 'paint', heavy: true, chunky: 1.2 },
  futuristic: { p: '#16191f', s: '#2a2f3a', a: '#22e1ff', finish: 'carbon', neon: true },
  weathered: { p: '#a89a82', s: '#5a4f43', a: '#8a4a2c', finish: 'matte', wear: 1 },
  'gold-foil': { p: '#d6a93c', s: '#e9e6df', a: '#20242c', finish: 'foil', foil: true },
  arctic: { p: '#f6f8fb', s: '#3d6ea8', a: '#ff6a00', finish: 'gloss', arctic: true },
};
export const STD = ['vintage', 'school', 'research', 'industrial', 'futuristic', 'weathered'];
export const SPACE = ['gold-foil', 'arctic', 'research', 'futuristic', 'weathered', 'vintage', 'school'];

/** Resolve options → { o, variant, trim, T }. Extra trim specs (type-specific) can be passed. */
export function setup(options, VARIANTS, type, base = {}, extra = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VARIANTS, o.variant, type);
  const spec = o.trim ? extra[o.trim] ?? TRIMS[o.trim] : null;
  const trim = spec ? o.trim : null;
  const V = VARIANTS[variant] || {};
  const T = { scale: 1, chunky: 1, wear: 0, detail: 1, p: '#e8eaee', s: '#30343c', a: '#1e88e5', ...base, ...V, ...(spec || {}), trim };
  if (!trim && o.color) T.p = o.color;
  if (!T.finish) T.finish = 'gloss';
  T.r = rng(`${type}-${variant}-${trim}`);
  T.lamps = {};
  T.type = type;
  return { o, variant, trim, T, V };
}

/** Material for a finish (kind forces one). */
export function fin(T, color, kind) {
  const f = kind ?? T.finish;
  const c = M.toColor(color);
  if (T.wear && f !== 'chrome') c.lerp(new THREE.Color('#b8ad98'), 0.3 * T.wear);
  switch (f) {
    case 'matte': return M.matte(c, 0.85);
    case 'plastic': return M.plastic(c, 0.42);
    case 'paint': return M.paint(c, { metallic: 0.2, roughness: 0.45 });
    case 'carbon': return new THREE.MeshPhysicalMaterial({ name: 'carbon', color: c, roughness: 0.3, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
    case 'foil': return new THREE.MeshStandardMaterial({ name: 'foil', color: c, metalness: 1, roughness: 0.28 });
    case 'brass': return M.metal(T.wear ? '#8f7a4c' : '#c9a24a', T.wear ? 0.55 : 0.25);
    case 'gold': return M.metal('#d6a93c', 0.22);
    case 'metal': return M.metal(c, T.wear ? 0.6 : 0.32);
    case 'chrome': return T.wear ? M.metal('#a7a39b', 0.55) : M.chrome();
    case 'rubber': return new THREE.MeshStandardMaterial({ name: 'rubber', color: c, roughness: 0.9 });
    case 'wood': return M.wood(color);
    case 'fabric': return M.fabric(c);
    default: return new THREE.MeshPhysicalMaterial({ name: 'gloss', color: c, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  }
}
/** Main body material. Vintage bodies become brass-trimmed wood or enamel. */
export const body = (T, color = T.p) => fin(T, color);
/** Structural metal (frames, legs) that follows the trim. */
export function frameMat(T) {
  if (T.vintage) return fin(T, '#c9a24a', 'brass');
  if (T.heavy) return fin(T, '#2a2d33', 'paint');
  if (T.neon) return fin(T, '#1d2129', 'carbon');
  if (T.kids) return fin(T, T.s, 'plastic');
  if (T.foil) return fin(T, '#d6a93c', 'gold');
  return fin(T, '#b9bec6', 'metal');
}
export const darkMat = (T) => fin(T, T.neon ? '#0c0e12' : '#24272d', 'plastic');

/* --------------------------------- glass --------------------------------- */

export function glassMat({ tint = '#ffffff', frost = 0 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    name: 'lab-glass', color: M.toColor(tint), metalness: 0, roughness: 0.03 + frost, transmission: 1, ior: 1.5, thickness: 0.002,
    transparent: true, opacity: 0.35, side: THREE.DoubleSide, clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, envMapIntensity: 1.4, depthWrite: false,
  });
}
export function liquidMat(color, { glow = 0 } = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    name: 'liquid', color: M.toColor(color), metalness: 0, roughness: 0.08, transmission: 0.55, ior: 1.33, thickness: 0.02,
    transparent: true, opacity: 0.82, clearcoat: 1,
  });
  if (glow) { m.emissive = M.toColor(color); m.emissiveIntensity = glow; }
  return m;
}

/** Hollow vessel from an outer profile [[r,y]] (bottom → rim). Wall thickness t. */
export function vesselGeo(outer, t = 0.0015, seg = 40) {
  const inner = innerProfile(outer, t);
  return lathe([[0, outer[0][1]], ...outer, ...inner.slice().reverse(), [0, inner[0][1]]], seg);
}
function innerProfile(outer, t) {
  return outer.map(([r, y], i) => [Math.max(0.0005, r - t), i === 0 ? y + t : Math.max(y, outer[0][1] + t)]);
}
/** Inner radius of a profile at height y. */
export function radiusAt(outer, y, t = 0.0015) {
  const inn = innerProfile(outer, t);
  for (let i = 1; i < inn.length; i++) {
    const [r0, y0] = inn[i - 1];
    const [r1, y1] = inn[i];
    if ((y >= y0 && y <= y1) || (y <= y0 && y >= y1)) return y1 === y0 ? r1 : r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return inn[inn.length - 1][0];
}
/** Liquid filling the vessel up to height `level` (fills the inside exactly, so it touches the glass). */
export function liquidGeo(outer, level, t = 0.0015, seg = 40) {
  const inn = innerProfile(outer, t);
  const pts = [[0, inn[0][1]]];
  for (let i = 0; i < inn.length; i++) {
    const [r, y] = inn[i];
    if (y >= level) { pts.push([radiusAt(outer, level, t), level]); break; }
    pts.push([r, y]);
    if (i === inn.length - 1) level = y;
  }
  pts.push([0, level]);
  // nudge outward a hair so the surface reliably meets the glass wall
  return lathe(pts.map(([r, y]) => [r > 0 ? r + t * 0.3 : 0, y]), seg);
}

/* --------------------------------- lamps --------------------------------- */

/** Adds a lamp of `kind` (lamps.js); all of a type's lamps switch on with the 'on' clip. */
export function lamp(T, parent, kind, opts) {
  const name = `${T.type}_${kind}`;
  T.lamps[name] ??= lampGroup(name, kind);
  let glowSize = opts.glowSize;
  if (opts.geometry && glowSize == null) { opts.geometry.computeBoundingBox(); glowSize = Math.min(0.3, opts.geometry.boundingBox.getSize(new THREE.Vector3()).length() * 1.3); }
  return T.lamps[name].add(parent, { bezel: false, depth: 0.003, ...opts, glowSize: glowSize ?? Math.max(opts.w ?? 0.02, opts.h ?? 0.02) * 4 });
}
/** Glow strip (futuristic trim): a thin emissive tube that lights with 'on'. */
export function glowStrip(T, parent, points, r = 0.003, kind = 'blue') {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return lamp(T, parent, kind, { geometry: new THREE.TubeGeometry(curve, Math.max(8, points.length * 6), r, 8), depth: 0.002 });
}
export function lampClip(T, name = 'on') {
  const tracks = Object.values(T.lamps).flatMap((g) => lampTracks(g.name, LAMP_ON[g.kind] ?? 2.5, { glow: 0.7 }));
  return tracks.length ? clip(name, 1, tracks) : null;
}

/* ------------------------------ ground wrapper ------------------------------ */

/** Longest-edge bisection of triangles longer than maxEdge (all attributes interpolated). */
export function densify(geo, maxEdge) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const names = ['position', ...Object.keys(g.attributes).filter((n) => n !== 'position')];
  const src = names.map((n) => g.attributes[n]);
  const sizes = src.map((a) => a.itemSize);
  const stride = sizes.reduce((x, y) => x + y, 0);
  const count = g.attributes.position.count;
  const V = new Float32Array(count * stride);
  for (let i = 0; i < count; i++) { let o = i * stride; src.forEach((a, ai) => { for (let k = 0; k < sizes[ai]; k++) V[o++] = a.array[i * sizes[ai] + k]; }); }
  const out = [];
  let changed = false;
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; // position is attribute 0
  const m2 = maxEdge * maxEdge;
  const stack = [];
  for (let t = 0; t < count; t += 3) {
    stack.push([V.subarray(t * stride, (t + 1) * stride), V.subarray((t + 1) * stride, (t + 2) * stride), V.subarray((t + 2) * stride, (t + 3) * stride), 0]);
    while (stack.length) {
      const [p, q, r, depth] = stack.pop();
      const e0 = d2(p, q), e1 = d2(q, r), e2 = d2(r, p);
      const m = Math.max(e0, e1, e2);
      if (m <= m2 || depth > 14) { out.push(p, q, r); continue; }
      changed = true;
      const [a, b, c] = m === e0 ? [p, q, r] : m === e1 ? [q, r, p] : [r, p, q];
      const mid = new Float32Array(stride);
      for (let k = 0; k < stride; k++) mid[k] = (a[k] + b[k]) / 2;
      stack.push([a, mid, c, depth + 1], [mid, b, c, depth + 1]);
    }
  }
  if (!changed) return geo;
  const res = new THREE.BufferGeometry();
  let off = 0;
  names.forEach((n, ai) => {
    const k = sizes[ai];
    const arr = new Float32Array(out.length * k);
    out.forEach((v, i) => { for (let c = 0; c < k; c++) arr[i * k + c] = v[off + c]; });
    res.setAttribute(n, new THREE.BufferAttribute(arr, k));
    off += k;
  });
  if (res.attributes.normal) for (let i = 0, a = res.attributes.normal; i < a.count; i++) { const x = a.getX(i), y = a.getY(i), z = a.getZ(i), l = Math.hypot(x, y, z) || 1; a.setXYZ(i, x / l, y / l, z / l); }
  return res;
}

/** Densifies big faces, rests the model on y = 0, adds the lamp 'on' clip and finalizes. */
export function done(root, T, variant, o, animations = []) {
  root.updateMatrixWorld(true);
  const whole = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).length();
  const edge = Math.max(0.45, whole / 16);
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.noShadow) return;
    const g = m.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    const ws = m.getWorldScale(new THREE.Vector3());
    const s = g.boundingBox.getSize(new THREE.Vector3()).multiply(ws);
    if (Math.max(s.x, s.y, s.z) > edge && g.attributes.position.count < 20000) m.geometry = densify(g, edge / Math.max(1e-6, ws.length() / Math.sqrt(3)));
  });
  const box = new THREE.Box3();
  root.traverse((m) => { if (m.isMesh && !m.userData.noShadow) box.expandByObject(m, false); });
  for (const c of root.children) c.position.y -= box.min.y;
  root.updateMatrixWorld(true);
  const anims = (typeof animations === 'function' ? animations() : animations).filter(Boolean);
  if (Object.keys(T.lamps).length && !anims.some((a) => a.name === 'on')) anims.push(lampClip(T));
  return finalize(root, { type: T.type, variant, options: o, animations: anims.filter(Boolean) });
}

/* -------------------------------- labels -------------------------------- */

export function canvasTex(w, h, draw) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
/** Flat plane with a canvas drawing (plain colour in Node). Faces +Z. */
export function labelPlane(w, h, draw, { bg = '#ffffff', emissive = 0, px = 256, name } = {}) {
  const tex = canvasTex(px, Math.max(16, Math.round((px * h) / w)), draw);
  const mat = emissive
    ? new THREE.MeshStandardMaterial({ name: 'screen', color: tex ? '#ffffff' : bg, map: tex, emissive: tex ? '#ffffff' : bg, emissiveMap: tex, emissiveIntensity: emissive, roughness: 0.4 })
    : new THREE.MeshStandardMaterial({ name: 'label', color: tex ? '#ffffff' : bg, map: tex, roughness: 0.55 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, Math.max(1, Math.round(w / 0.1)), Math.max(1, Math.round(h / 0.1))), mat);
  if (name) m.name = name;
  return m;
}
/** Thin rounded slab carrying a canvas face on its front (+Z). */
export function panel(w, h, d, draw, mat, opts = {}) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(roundedBox(w, h, d, Math.min(d / 2.2, 0.004)), mat));
  const face = labelPlane(w * 0.96, h * 0.96, draw, opts);
  face.position.z = d / 2 + 0.0004;
  g.add(face);
  return g;
}

/* ------------------------------ small parts ------------------------------ */

export function rodX(x0, x1, r, mat, parent, { y = 0, z = 0, seg = 16 } = {}) {
  return mesh(new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), seg).rotateZ(Math.PI / 2), mat, { parent, at: [(x0 + x1) / 2, y, z] });
}
export function rodY(y0, y1, r, mat, parent, { x = 0, z = 0, seg = 16, r2 } = {}) {
  return mesh(new THREE.CylinderGeometry(r2 ?? r, r, Math.abs(y1 - y0), seg), mat, { parent, at: [x, (y0 + y1) / 2, z] });
}
export function rodZ(z0, z1, r, mat, parent, { x = 0, y = 0, seg = 16 } = {}) {
  return mesh(new THREE.CylinderGeometry(r, r, Math.abs(z1 - z0), seg).rotateX(Math.PI / 2), mat, { parent, at: [x, y, (z0 + z1) / 2] });
}
export const bar = (a, b, r, mat, parent) => tube(a, b, r, mat, { parent, radialSegments: 10 });
/** Rounded box placed so its bottom sits at y0. */
export function slab(parent, mat, w, h, d, { x = 0, y = 0, z = 0, r = 0.004, name } = {}) {
  return mesh(roundedBox(w, h, d, Math.min(r, w / 2.1, h / 2.1, d / 2.1)), mat, { parent, at: [x, y + h / 2, z], name });
}
/** Diagonal hazard stripes canvas. */
export const hazard = (ctx, w, h) => {
  ctx.fillStyle = '#f2b705'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#16171a';
  for (let x = -h; x < w + h; x += h) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h / 2, 0); ctx.lineTo(x + h, 0); ctx.lineTo(x + h / 2, h); ctx.fill(); }
};
/** Flat-mounted emblem: put on a face pointing along `normal` ('z','x','-x','y'). */
export function emblem(parent, size, at, normal = 'z') {
  const e = brandEmblem(size);
  e.position.set(...at);
  if (normal === 'x') e.rotation.y = Math.PI / 2;
  if (normal === '-x') e.rotation.y = -Math.PI / 2;
  if (normal === '-z') e.rotation.y = Math.PI;
  if (normal === 'y') e.rotation.x = -Math.PI / 2;
  parent.add(e);
  return e;
}
/** Caster/foot puck. */
export function foot(parent, mat, x, z, r = 0.02, h = 0.015, y = 0) {
  return mesh(new THREE.CylinderGeometry(r * 0.85, r, h, 16), mat, { parent, at: [x, y + h / 2, z] });
}
