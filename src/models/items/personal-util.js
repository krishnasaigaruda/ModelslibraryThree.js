// Helpers shared by the personal-items builders (bags, small flat things, labels).
import { THREE, mesh, group, openBox, labelPlane, textDraw } from './common.js';

/** Rounded-rectangle outline points (x,y), centred. */
export function rrPts(w, h, r, n = 6) {
  r = Math.max(0.0002, Math.min(r, w / 2 - 1e-5, h / 2 - 1e-5));
  const pts = [];
  const c = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2], [-w / 2 + r, -h / 2 + r, Math.PI], [w / 2 - r, -h / 2 + r, Math.PI * 1.5]];
  for (const [cx, cy, a0] of c) for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}
export function circlePts(r, n = 32, cx = 0, cy = 0, ry = r) {
  return Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * ry]);
}
const toShape = (pts) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
const toPath = (pts) => new THREE.Path(pts.slice().reverse().map(([x, y]) => new THREE.Vector2(x, y)));

/** Extruded outline (optional holes) lying flat on y=0, thickness t, outline x→x, y→-z. */
export function flat(points, t, { holes = [], bevel = Math.min(t * 0.3, 0.002), curve = 12 } = {}) {
  const s = toShape(points);
  for (const h of holes) s.holes.push(toPath(h));
  const b = Math.min(bevel, t * 0.45);
  const geo = new THREE.ExtrudeGeometry(s, { depth: Math.max(t - 2 * b, 1e-5), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: curve });
  geo.translate(0, 0, b);
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}
/** Same as flat() but standing (outline in XY, thickness along Z centred). */
export function upright(points, t, opts) {
  const g = flat(points, t, opts);
  g.rotateX(Math.PI / 2);
  g.translate(0, 0, -t / 2);
  return g;
}

/** Soft open-top bag shell: openBox whose walls taper (taper>0 narrows the top) and bulge. */
export function bagShell(w, h, d, t, mat, { r = d * 0.45, taper = 0, bulge = 0.06, parent, at, name = 'bag', innerMat } = {}) {
  const g = openBox(w, h, d, t, mat, { r, parent, at, name, floorMat: innerMat ?? mat });
  for (const m of g.children) {
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / h;
      const s = 1 - taper * y;
      const b = 1 + bulge * Math.sin(Math.min(1, Math.max(0, y)) * Math.PI);
      p.setX(i, p.getX(i) * s * b);
      p.setZ(i, p.getZ(i) * b);
    }
    m.geometry.computeVertexNormals();
  }
  if (innerMat) {
    // dark lining just inside the walls so the opening reads as hollow
    const lin = openBox(w - 2 * t - 0.001, h * 0.98, d - 2 * t - 0.001, 0.0015, innerMat, { r: Math.max(0.001, r - t), parent: g, name: `${name}-lining` });
    for (const m of lin.children) {
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i) / h;
        const s = 1 - taper * y;
        const b = 1 + bulge * Math.sin(Math.min(1, Math.max(0, y)) * Math.PI);
        p.setX(i, p.getX(i) * s * b); p.setZ(i, p.getZ(i) * b);
      }
      m.geometry.computeVertexNormals();
    }
    lin.position.y = t;
  }
  return g;
}

/** Text label lying flat (faces up) at height y. */
export function flatLabel(parent, w, h, lines, opts, at) {
  const lp = labelPlane(w, h, textDraw(lines, opts), { bg: opts?.bg ?? '#ffffff', px: 256 });
  lp.rotation.x = -Math.PI / 2;
  lp.position.set(...at);
  parent.add(lp);
  return lp;
}

/** Points along a catenary-ish loop lying on the ground (for chains/cords), from a to b with sag sideways. */
export function groundLoop(a, b, sag, y = 0, n = 10) {
  const pts = [];
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L = Math.hypot(dx, dz) || 1;
  const nx = -dz / L, nz = dx / L;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s = Math.sin(t * Math.PI) * sag;
    pts.push([a[0] + dx * t + nx * s, y, a[1] + dz * t + nz * s]);
  }
  return pts;
}

export { mesh, group };
