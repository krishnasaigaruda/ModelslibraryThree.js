// Geometry helpers for the kitchen / party / money groups: lofted bars (handles, cutlery),
// flat ribbons that follow a path on the ground, pleated discs and bowl shells.
import { THREE, mesh, group, M, fin } from './common.js';

/**
 * Lofted bar along X. fn(u∈[0,1]) → [x, y, w, t, z?]: centre (x,y,z), width w (Z), thickness t (Y).
 * Superellipse cross-section (e = 2 ellipse, 4+ rounded rectangle). Both ends capped.
 */
export function loftX(n, fn, { radial = 14, e = 2.4 } = {}) {
  const pos = [];
  const idx = [];
  const ring = [];
  for (let i = 0; i <= n; i++) {
    const [x, y, w, t, z = 0] = fn(i / n);
    ring.push([x, y, z]);
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pos.push(x, y + Math.sign(s) * Math.abs(s) ** (2 / e) * t / 2, z + Math.sign(c) * Math.abs(c) ** (2 / e) * w / 2);
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, b = i * radial + ((j + 1) % radial), c = a + radial, d = b + radial;
    idx.push(a, c, b, b, c, d);
  }
  const c0 = pos.length / 3;
  pos.push(...ring[0], ...ring[n]);
  for (let j = 0; j < radial; j++) {
    const jn = (j + 1) % radial;
    idx.push(c0, j, jn, c0 + 1, n * radial + jn, n * radial + j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Flat ribbon (w wide, t thick) following points [[x,y,z]...] — width stays horizontal-ish. */
export function ribbonGeo(points, w, t, { seg = 48, closed = false, upright = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'centripetal');
  const pos = [];
  const idx = [];
  const N = seg;
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= N; i++) {
    const p = curve.getPointAt(Math.min(1, i / N));
    const tan = curve.getTangentAt(Math.min(1, i / N));
    let side = new THREE.Vector3().crossVectors(up, tan);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    let nrm = new THREE.Vector3().crossVectors(tan, side).normalize();
    if (upright) [side, nrm] = [nrm, side];
    for (const [sw, st] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const v = p.clone().addScaledVector(side, (sw * w) / 2).addScaledVector(nrm, (st * t) / 2);
      pos.push(v.x, v.y, v.z);
    }
  }
  for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) {
    const a = i * 4 + k, b = i * 4 + ((k + 1) % 4), c = a + 4, d = b + 4;
    idx.push(a, b, c, b, d, c);
  }
  if (!closed) idx.push(0, 2, 1, 0, 3, 2, N * 4, N * 4 + 1, N * 4 + 2, N * 4, N * 4 + 2, N * 4 + 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
export function ribbon(points, w, t, mat, opts = {}) {
  mat.side = THREE.DoubleSide;
  return mesh(ribbonGeo(points, w, t, opts), mat, { parent: opts.parent, name: opts.name });
}

/** Bowl shell (open top hemisphere-ish), rx along X, depth dy, rz along Z, bottom at y=0. */
export function bowlShell(rx, dy, rz, mat, { parent, at = [0, 0, 0], name, seg = 24 } = {}) {
  const g = new THREE.SphereGeometry(1, seg, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  g.scale(rx, dy, rz);
  g.translate(0, dy, 0);
  mat.side = THREE.DoubleSide;
  return mesh(g, mat, { parent, at, name });
}

/** Pleated disc (rosettes, pom-poms, paper fans): ring r0..r1 with n pleats of height amp. */
export function pleatDisc(r0, r1, n, amp, { seg = 4, rise = 0 } = {}) {
  const A = n * 8;
  const pos = [];
  const idx = [];
  for (let i = 0; i <= seg; i++) {
    const r = r0 + ((r1 - r0) * i) / seg;
    const f = i / seg;
    for (let j = 0; j < A; j++) {
      const a = (j / A) * Math.PI * 2;
      pos.push(Math.cos(a) * r, Math.abs(Math.sin(a * n / 2)) * amp * f + rise * (1 - f), Math.sin(a) * r);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < A; j++) {
    const a = i * A + j, b = i * A + ((j + 1) % A), c = a + A, d = b + A;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Utensil handle profile along -X from x=0 (head joint) to x=-L. Styles change the silhouette. */
export function handleGeo(style, L, R) {
  const end = (u) => Math.sqrt(Math.max(0.002, 1 - Math.max(0, (u - 0.9) / 0.1) ** 2));
  let e = 2.4;
  const prof = (u) => {
    const s = Math.sin(Math.PI * u);
    switch (style) {
      case 'steel': return [R * 2 * (0.65 + 0.55 * u), R * 0.6];
      case 'wooden': return [R * 2 * (0.9 + 0.22 * s + 0.1 * u), R * 2 * (0.9 + 0.22 * s + 0.1 * u)];
      case 'plastic': return [R * 2.7 * (0.8 + 0.3 * s), R * 2.1 * (0.8 + 0.3 * s)];
      case 'black': return [R * 2.3 * (0.9 + 0.2 * u), R * 1.3];
      case 'copper': { const b = u > 0.78 ? 1 + 0.8 * Math.sin(((u - 0.78) / 0.22) * Math.PI * 0.85) : 1 + 0.25 * Math.max(0, Math.sin(u * 40)) * (u < 0.2 ? 1 : 0); return [R * 1.5 * b, R * 1.5 * b]; }
      case 'bamboo': return [R * 2 * (1 + 0.12 * (Math.abs(Math.sin(u * 9)) < 0.15 ? 1 : 0)), R * 2 * (1 + 0.12 * (Math.abs(Math.sin(u * 9)) < 0.15 ? 1 : 0))];
      default: return [R * 2.3 * (0.85 + 0.2 * s), R * 1.7 * (0.85 + 0.2 * s)];
    }
  };
  if (style === 'black') e = 4;
  const t0 = prof(0.5)[1];
  return loftX(28, (u) => { const [w, t] = prof(u); const k = end(u); return [-u * L, t0 / 2, w * k, t * k]; }, { e, radial: 16 });
}

/** Handle style + materials for a utensil trim. */
export function utensilStyle(T) {
  const tr = T.trim;
  const style = ['steel', 'wooden', 'plastic', 'black', 'copper', 'bamboo'].includes(tr) ? tr : 'base';
  const steel = M.metal('#c9ced4', T.worn ? 0.5 : 0.22);
  const handle = style === 'steel' ? steel
    : style === 'wooden' || style === 'bamboo' ? fin(T, T.p, 'wood')
      : style === 'copper' ? fin(T, T.p, 'copper')
        : style === 'black' ? fin(T, '#1c1d20', 'matte')
          : style === 'plastic' ? fin(T, T.p, 'plastic')
            : fin(T, '#2a2b2e', 'plastic');
  const head = style === 'copper' ? fin(T, T.p, 'copper') : style === 'black' ? M.metal('#3a3c40', 0.35) : steel;
  // soft head (spatula/spoon blades): silicone, wood or nylon
  const soft = style === 'wooden' || style === 'bamboo' ? fin(T, T.p, 'wood') : style === 'plastic' ? fin(T, T.p, 'rubber') : style === 'black' ? fin(T, '#1c1d20', 'rubber') : style === 'base' ? fin(T, '#e8402f', 'rubber') : head;
  return { style, handle, head, soft, steel };
}

/** Mesh a handle at `at`, pointing to -X (rotate the parent group to orient). */
export function addHandle(parent, T, L, R, { at = [0, 0, 0], name = 'handle' } = {}) {
  const S = utensilStyle(T);
  const m = mesh(handleGeo(S.style, L, R), S.handle, { parent, at, name });
  if (S.style === 'wooden' || S.style === 'black') {
    // brass/steel rivets on the top face
    const t0 = S.style === 'black' ? R * 1.3 : R * 2 * 1.12;
    for (const f of [0.25, 0.55]) mesh(new THREE.CylinderGeometry(R * 0.28, R * 0.28, 0.0012, 10), M.metal(S.style === 'wooden' ? '#b8913f' : '#c9ccd2', 0.3), { parent, at: [at[0] - L * f, at[1] + t0 * (S.style === 'black' ? 1 : 0.98) - 0.0004, at[2]] });
  }
  if (S.style === 'steel' || S.style === 'base') {
    // hanging hole ring at the end
    mesh(new THREE.TorusGeometry(R * 0.55, R * 0.18, 6, 16), S.style === 'steel' ? M.metal('#8e939a', 0.3) : M.metal('#c9ccd2', 0.3), { parent, at: [at[0] - L * 0.9, at[1] + (S.style === 'steel' ? R * 0.3 : R * 0.85), at[2]], rot: [Math.PI / 2, 0, 0] });
  }
  return m;
}
