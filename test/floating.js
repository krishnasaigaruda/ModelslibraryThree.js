// Detects floating parts: meshes that don't physically touch the chain of parts connected
// to the ground. Two parts count as touching only if their actual SURFACES come within `gap`
// of each other (surface points are rasterised into a voxel hash), not merely their bounding
// boxes — so a chair back hovering behind the seat is caught even though the boxes overlap.
// Intentionally detached things can opt out with mesh.userData.detached = true (or the whole
// object with userData.floating = true).
import * as THREE from 'three';

const _b = new THREE.Box3();
const _v = new THREE.Vector3();
const _a = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();

/** Rasterise a mesh's triangles into a set of voxel keys of size `cell` (world space). */
function surfaceVoxels(o, cell, maxPts = 400000) {
  const g = o.geometry;
  const pos = g.attributes.position;
  const index = g.index;
  const triCount = index ? index.count / 3 : pos.count / 3;
  const keys = new Set();
  const m = o.matrixWorld;
  const P = (i) => new THREE.Vector3().fromBufferAttribute(pos, index ? index.getX(i) : i).applyMatrix4(m);
  let budget = maxPts;
  const perTri = Math.max(1, Math.floor(Math.sqrt((2 * maxPts) / Math.max(1, triCount))));
  for (let t = 0; t < triCount; t++) {
    const p0 = P(t * 3);
    const p1 = P(t * 3 + 1);
    const p2 = P(t * 3 + 2);
    const l = Math.max(p0.distanceTo(p1), p1.distanceTo(p2), p2.distanceTo(p0));
    // the point budget is shared evenly by all triangles (not first come first served), so big
    // meshes are sampled uniformly instead of only their first triangles being covered
    const n = Math.min(256, perTri, Math.max(1, Math.ceil(l / cell)));
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n - i; j++) {
        const u = i / n;
        const w = j / n;
        _v.copy(p0).multiplyScalar(1 - u - w).addScaledVector(p1, u).addScaledVector(p2, w);
        keys.add(vkey(Math.floor(_v.x / cell), Math.floor(_v.y / cell), Math.floor(_v.z / cell)));
        budget--;
      }
    }
  }
  return keys;
}

// pack 3 signed ints (|v| < 2^20) into one number key
const OFF = 1 << 20;
const vkey = (x, y, z) => ((x + OFF) * 2097152 + (y + OFF)) * 2097152 + (z + OFF);
function voxelsTouch(A, B) {
  const [small, big] = A.size < B.size ? [A, B] : [B, A];
  for (const k of small) {
    const z = (k % 2097152) - OFF;
    const r = Math.floor(k / 2097152);
    const y = (r % 2097152) - OFF;
    const x = Math.floor(r / 2097152) - OFF;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      if (big.has(vkey(x + dx, y + dy, z + dz))) return true;
    }
  }
  return false;
}

export function findFloating(obj, { gap = 0.012, ground = 0.03 } = {}) {
  if (obj.userData.floating) return [];
  obj.updateMatrixWorld(true);
  const parts = [];
  obj.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    if (!o.geometry?.attributes.position?.count) return; // empty geometry
    if (o.userData.noShadow || o.material?.blending === THREE.AdditiveBlending) return; // glow cards
    for (let p = o; p; p = p.parent) if (p.userData.detached) return;
    if (o.isInstancedMesh) {
      // instances (leaves, bolts…) use box contact only — cheap, and they're tiny
      const mm = new THREE.Matrix4();
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, mm);
        parts.push({ name: `${o.name || 'instanced'}[${i}]`, box: o.geometry.boundingBox.clone().applyMatrix4(mm.premultiply(o.matrixWorld)) });
      }
    } else parts.push({ name: o.name || o.parent?.name || '(unnamed)', box: _b.setFromObject(o).clone(), mesh: o });
  });
  const n = parts.length;
  // voxel size scales with the model so big buildings stay fast; never finer than `gap`
  const whole = new THREE.Box3();
  for (const p of parts) whole.union(p.box);
  const cell = Math.max(gap, whole.getSize(_d).length() / 600);
  const vox = new Map();
  const voxOf = (p) => {
    if (!vox.has(p)) vox.set(p, surfaceVoxels(p.mesh, cell));
    return vox.get(p);
  };
  const near = (a, b) => a.min.x <= b.max.x + gap && a.max.x >= b.min.x - gap && a.min.y <= b.max.y + gap && a.max.y >= b.min.y - gap && a.min.z <= b.max.z + gap && a.max.z >= b.min.z - gap;
  const touch = (i, j) => {
    const A = parts[i];
    const B = parts[j];
    if (!near(A.box, B.box)) return false;
    if (!A.mesh || !B.mesh) return true; // instanced: box contact is enough
    return voxelsTouch(voxOf(A), voxOf(B));
  };
  const linked = new Array(n).fill(false);
  const queue = [];
  for (let i = 0; i < n; i++) if (parts[i].box.min.y <= ground) { linked[i] = true; queue.push(i); }
  while (queue.length) {
    const i = queue.pop();
    for (let j = 0; j < n; j++) if (!linked[j] && touch(i, j)) { linked[j] = true; queue.push(j); }
  }
  void _a; void _c;
  return parts.filter((_, i) => !linked[i]).map((p) => p.name);
}
