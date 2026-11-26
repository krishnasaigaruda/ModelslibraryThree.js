import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/*
 * Small skinning toolkit shared by people and animals.
 *
 * Bodies are built from smooth lathe pieces (torso, limbs, neck) that are
 * merged into ONE SkinnedMesh. Each vertex is weighted to its bone and blends
 * into the neighbouring bone around every joint, so elbows/knees/shoulders
 * bend smoothly with no gaps. Clothes, long hair and straps are "shells":
 * the body surface itself, filtered to a region and pushed out along the
 * normals, carrying the same skin weights — so they follow the body exactly
 * and can never poke through it.
 */

export const smooth01 = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** Bone registry with rest positions in model space (no rest rotations). */
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
}

/**
 * Lathe limb hanging along -Y from the origin, length `len`, rounded caps.
 * radius(sf) gives the radius at fraction sf ∈ [0,1] down the limb.
 * Adds attribute `sf` (fraction along limb; <0 above, >1 below).
 */
export function limbGeometry(len, radius, { radial = 22, rings = 18, capTop = 0.8, capBottom = 0.8, zScale = 1, xScale = 1 } = {}) {
  const pts = [];
  const r0 = radius(0);
  const r1 = radius(1);
  const capN = 6;
  // bottom cap (from tip upward)
  for (let i = 0; i <= capN; i++) {
    const a = (i / capN) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, r1 * Math.sin(a)), -len - r1 * capBottom * Math.cos(a)));
  }
  for (let i = rings - 1; i >= 1; i--) {
    const sf = i / rings;
    pts.push(new THREE.Vector2(radius(sf), -sf * len));
  }
  for (let i = capN; i >= 0; i--) {
    const a = (i / capN) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, r0 * Math.sin(a)), r0 * capTop * Math.cos(a)));
  }
  let g = new THREE.LatheGeometry(pts, radial, Math.PI);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, pos.getX(i) * xScale);
    pos.setZ(i, pos.getZ(i) * zScale);
  }
  g = weld(g);
  const sf = new Float32Array(g.attributes.position.count);
  for (let i = 0; i < sf.length; i++) sf[i] = -g.attributes.position.getY(i) / len;
  g.setAttribute('sf', new THREE.BufferAttribute(sf, 1));
  return g;
}

/** Weld duplicate seam vertices so normals are continuous (no visible seams). */
export function weld(g) {
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  const w = mergeVertices(g, 1e-6);
  w.computeVertexNormals();
  return w;
}

/** Weights for a limb vertex: blend into parent near the top joint and child near the bottom. */
export function limbWeights(s, len, self, parent, child, rbTop, rbBottom = rbTop) {
  const wp = parent != null ? 1 - smooth01((s + rbTop) / (2 * rbTop)) : 0;
  const wc = child != null ? smooth01((s - len + rbBottom) / (2 * rbBottom)) : 0;
  const out = [[self, Math.max(0, 1 - wp - wc)]];
  if (wp > 0) out.push([parent, wp]);
  if (wc > 0) out.push([child, wc]);
  return out;
}

/** Blend weights along a chain of bones split at joint heights (torso, neck, tails). */
export function chainWeights(y, bones, joints, rb) {
  // bones.length === joints.length + 1; joints ascending
  const S = joints.map((j, k) => {
    const r = Array.isArray(rb) ? rb[k] : rb;
    return smooth01((y - j + r) / (2 * r));
  });
  const out = [];
  for (let k = 0; k < bones.length; k++) {
    const lo = k === 0 ? 1 : S[k - 1];
    const hi = k === bones.length - 1 ? 0 : S[k];
    const w = lo - hi;
    if (w > 1e-4) out.push([bones[k], w]);
  }
  return out;
}

/** Write skinIndex/skinWeight (+ part id) to a geometry using weightFn(vertexIndex, pos) → [[boneIndex, w], …]. */
export function applySkin(geo, part, weightFn) {
  const pos = geo.attributes.position;
  const si = new Uint16Array(pos.count * 4);
  const sw = new Float32Array(pos.count * 4);
  const pa = new Float32Array(pos.count).fill(part);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const ws = weightFn(i, v).filter(([, w]) => w > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const total = ws.reduce((a, [, w]) => a + w, 0) || 1;
    ws.forEach(([b, w], k) => {
      si[i * 4 + k] = b;
      sw[i * 4 + k] = w / total;
    });
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  geo.setAttribute('part', new THREE.BufferAttribute(pa, 1));
  if (!geo.attributes.sf) geo.setAttribute('sf', new THREE.BufferAttribute(new Float32Array(pos.count), 1));
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
  return geo;
}

export function merge(geos) {
  const prepared = geos.map((g) => (g.index ? g : g.toNonIndexed()));
  return mergeGeometries(prepared.map((g) => (g.index ? g : indexify(g))), false);
}

function indexify(g) {
  const idx = [];
  for (let i = 0; i < g.attributes.position.count; i++) idx.push(i);
  g.setIndex(idx);
  return g;
}

/**
 * Shell = region of a skinned surface pushed out along its normals.
 * pred(i, p, n, attrs) decides which vertices belong; a triangle is kept if all 3 do.
 * offset may be a number or a function (i, p, n) → metres.
 */
export function shell(geo, pred, offset) {
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const index = geo.index.array;
  const keep = new Uint8Array(pos.count);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const attrs = geo.attributes;
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nrm, i);
    keep[i] = pred(i, p, n, attrs) ? 1 : 0;
  }
  const remap = new Int32Array(pos.count).fill(-1);
  const newIndex = [];
  let count = 0;
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t];
    const b = index[t + 1];
    const c = index[t + 2];
    if (!(keep[a] && keep[b] && keep[c])) continue;
    for (const k of [a, b, c]) {
      if (remap[k] < 0) remap[k] = count++;
      newIndex.push(remap[k]);
    }
  }
  const out = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(geo.attributes)) {
    const size = attr.itemSize;
    const Arr = attr.array.constructor;
    const arr = new Arr(count * size);
    for (let i = 0; i < pos.count; i++) {
      const j = remap[i];
      if (j < 0) continue;
      for (let k = 0; k < size; k++) arr[j * size + k] = attr.array[i * size + k];
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size, attr.normalized));
  }
  const op = out.attributes.position;
  const on = out.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const j = remap[i];
    if (j < 0) continue;
    p.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nrm, i);
    const d = typeof offset === 'function' ? offset(i, p, n) : offset;
    op.setXYZ(j, p.x + n.x * d, p.y + n.y * d, p.z + n.z * d);
  }
  void on;
  out.setIndex(newIndex);
  return out;
}

/** Strip helper attributes so exports stay clean. */
export function clean(geo) {
  geo.deleteAttribute('part');
  geo.deleteAttribute('sf');
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

export function skinned(geo, material, skeleton, name) {
  const m = new THREE.SkinnedMesh(clean(geo), material);
  m.name = name;
  m.frustumCulled = false;
  m.bind(skeleton, new THREE.Matrix4());
  return m;
}

/** Quaternion track from per-frame Euler deltas (applied on top of the node's rest rotation). */
export function poseTrack(node, period, fn, steps = 32) {
  const base = node.quaternion.clone();
  const times = [];
  const values = [];
  const e = new THREE.Euler();
  const q = new THREE.Quaternion();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [x, y, z] = fn(t);
    e.set(x, y, z, 'XYZ');
    q.copy(base).multiply(new THREE.Quaternion().setFromEuler(e));
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

/** Taper a TubeGeometry: radius(t) where t∈[0,1] along the curve. */
export function taperTube(points, radius, { segments = 32, radial = 14 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const g = new THREE.TubeGeometry(curve, segments, 1, radial, false);
  const pos = g.attributes.position;
  const c = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    curve.getPointAt(i / segments, c);
    const r = radius(i / segments);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return { geometry: g, curve };
}
