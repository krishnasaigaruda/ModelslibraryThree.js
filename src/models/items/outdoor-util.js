// Helpers for the outdoor/shopping/travel items: rounded-rectangle hollow containers,
// wheels, geometry merging and a few small parts.
import { THREE, M, mesh, group, tube, vessel, curveTube } from './common.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Merge many geometries into one (handles indexed/non-indexed mixes). */
export function merge(geos) {
  const list = geos.filter(Boolean);
  const anyNon = list.some((g) => !g.index);
  const norm = list.map((g) => {
    let x = anyNon && g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) x.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2));
    if (!x.attributes.normal) x.computeVertexNormals();
    return x;
  });
  return mergeGeometries(norm, false);
}

/** Geometry of a cylinder between two points (for merging wire grids). */
export function rodGeo(a, b, r, seg = 6) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const g = new THREE.CylinderGeometry(r, r, dir.length(), seg, 1);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  g.applyQuaternion(q);
  const c = va.clone().addScaledVector(dir, 0.5);
  g.translate(c.x, c.y, c.z);
  return g;
}

/** Torus geometry placed with a rotation (Euler) and position. */
export function torusGeo(R, r, at, rot = [0, 0, 0], arc = Math.PI * 2, seg = 24) {
  const g = new THREE.TorusGeometry(R, r, 8, seg, arc);
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot)));
  g.translate(...at);
  return g;
}

/**
 * Hollow rounded-rectangle container (tray, basket, cooler, pot, bag): outer w × h × d,
 * bottom scaled by `base` (taper), wall t (m), floor f, squareness n (2 round … 12 sharp).
 * Base at y=0, open top.
 */
export function boxVessel(w, h, d, { t = 0.006, f = t, base = 1, n = 8, lip = 0, seg = 64 } = {}) {
  const half = Math.min(w, d) / 2;
  const tu = t / half;
  const L = lip / half;
  const pts = [[0, 0], [base * 0.97, 0], [base, f * 0.6], [1, h]];
  if (lip) pts.push([1 + L, h], [1 + L, h + t * 1.2], [1 - tu, h + t * 1.2]);
  else pts.push([1 - tu * 0.5, h + t * 0.3], [1 - tu, h]);
  pts.push([base - tu, f], [0, f]);
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const rho = Math.hypot(x, z);
    if (rho < 1e-9) continue;
    const c = x / rho, s = z / rho;
    const k = (Math.abs(c) ** n + Math.abs(s) ** n) ** (-1 / n);
    p.setX(i, rho * k * c * w / 2);
    p.setZ(i, rho * k * s * d / 2);
  }
  g.computeVertexNormals();
  return g;
}

/** Solid version (closed lid / block) of the same rounded-rectangle shape. */
export function boxSolid(w, h, d, { n = 8, base = 1, top = 1, bevel = 0.01, seg = 48 } = {}) {
  const half = Math.min(w, d) / 2;
  const b = bevel / half;
  const prof = [[0, 0], [base - b, 0], [base, b * half], [top, h - b * half], [top - b, h], [0, h]];
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const rho = Math.hypot(x, z);
    if (rho < 1e-9) continue;
    const c = x / rho, s = z / rho;
    const k = (Math.abs(c) ** n + Math.abs(s) ** n) ** (-1 / n);
    p.setX(i, rho * k * c * w / 2);
    p.setZ(i, rho * k * s * d / 2);
  }
  g.computeVertexNormals();
  return g;
}

/** Wheel with tyre + hub, axle along X, centred on its group origin. Name it for spin anims. */
export function wheel(R, w, { tyre = M.rubber(), hub = M.metal('#c9ccd2', 0.3), name, parent, at, spokes = 0 } = {}) {
  const g = group(name ?? 'wheel', { parent, at });
  const tr = Math.min(w / 2, R * 0.28);
  mesh(new THREE.TorusGeometry(R - tr, tr, 12, 32), tyre, { parent: g, rot: [0, Math.PI / 2, 0] });
  mesh(new THREE.CylinderGeometry(R - tr * 1.2, R - tr * 1.2, w * 0.55, 24).rotateZ(Math.PI / 2), hub, { parent: g });
  mesh(new THREE.CylinderGeometry(R * 0.22, R * 0.22, w * 1.05, 16).rotateZ(Math.PI / 2), hub, { parent: g });
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    tube([0, 0, 0], [0, Math.cos(a) * (R - tr), Math.sin(a) * (R - tr)], R * 0.04, hub, { parent: g });
  }
  return g;
}

/** Simple potted-plant foliage: stems from (0,0,0) up with leaves and optional flowers. */
export function foliage(parent, T, { r = 0.08, h = 0.18, n = 7, flowers = false, at = [0, 0, 0] } = {}) {
  const g = group('plant', { parent, at });
  const leafM = new THREE.MeshStandardMaterial({ name: 'leaf', color: T.worn ? '#7a8a3a' : '#3f8a3a', roughness: 0.6 });
  const stemM = new THREE.MeshStandardMaterial({ name: 'stem', color: '#3a6a2a', roughness: 0.7 });
  const R = T.r;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + R() * 0.5;
    const rr = r * (0.4 + R() * 0.6), hh = h * (0.6 + R() * 0.4);
    const tip = [Math.cos(a) * rr, hh, Math.sin(a) * rr];
    curveTube([[0, -0.005, 0], [tip[0] * 0.3, hh * 0.5, tip[2] * 0.3], tip], 0.003, stemM, { parent: g, segments: 10, radialSegments: 5 });
    const leaf = mesh(new THREE.SphereGeometry(1, 10, 6), leafM, { parent: g, at: tip, scale: [0.022, 0.005, 0.045] });
    leaf.rotation.set(0.5, -a + Math.PI / 2, 0);
    if (flowers && i % 2 === 0) {
      const fm = new THREE.MeshStandardMaterial({ name: 'petal', color: [T.a, '#f2d23a', '#e8435a', '#ffffff'][i % 4], roughness: 0.5 });
      const top = [tip[0] * 0.8, hh * 1.12, tip[2] * 0.8];
      curveTube([tip, top], 0.0025, stemM, { parent: g, segments: 2, radialSegments: 5 });
      mesh(new THREE.SphereGeometry(0.018, 10, 6), fm, { parent: g, at: top, scale: [1, 0.55, 1] });
    }
  }
  return g;
}

/** Rope material with a soft fibrous look. */
export const ropeMat = (c) => new THREE.MeshPhysicalMaterial({ name: 'rope', color: M.toColor(c), roughness: 0.95, sheen: 0.6, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffffff') });
