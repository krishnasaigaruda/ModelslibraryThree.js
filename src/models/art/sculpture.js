// Sculptures: generic classical-style busts and full figures, abstract forms.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, setup, done, fin, mainMat, accentMat, treat, roughen, ellipsoid, plinthBase, mergeGeometries } from './common.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

const _up = new THREE.Vector3(0, 1, 0);

/** Lift/lower `obj` so its lowest point sits `sink` below `top` (so it touches the plinth). */
export function seat(root, obj, top, sink = 0.004) {
  root.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj, true);
  obj.position.y += top - b.min.y - sink;
  root.updateMatrixWorld(true);
}

/** Capsule between two points. */
export function capsule(a, b, r, mat, parent, seg = 14) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const d = vb.clone().sub(va);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(1e-3, d.length()), 3, seg), mat);
  m.position.copy(va).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(_up, d.normalize());
  parent.add(m);
  return m;
}

/** Points spread evenly over a unit sphere (fibonacci). */
export function fibDirs(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * 2.39996;
    out.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  return out;
}

/** Merge many small spheres (curls, beads) into one mesh. */
function beads(points, r, mat, parent, detail = 1) {
  const gs = points.map((p) => new THREE.IcosahedronGeometry(r, detail).translate(p.x, p.y, p.z));
  return mesh(mergeGeometries(gs), mat, { parent });
}

const dbl = (m) => { const c = m.clone(); c.side = THREE.DoubleSide; return c; };

/* ================================== BUSTS ================================== */

export const BUST_VARIANTS = { 'classical-man': {}, 'classical-woman': {}, laurel: {}, helmeted: {}, child: {}, 'abstract-head': {}, veiled: {} };

/** Head with face features, centred at c (Vector3). Returns radii. */
function buildHead(parent, T, c, { rx = 0.085, ry = 0.112, rz = 0.1, features = true, ears = true, seg = 32, mat, skinMat }) {
  const m = skinMat ?? mat;
  let geo;
  if (T.chunky) geo = roundedBox(rx * 2, ry * 2, rz * 2, rx * 0.45, 4);
  else {
    geo = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const k = y < 0 ? 1 + 0.28 * y : 1; // narrower jaw
      p.setXYZ(i, p.getX(i) * rx * k, y * ry, p.getZ(i) * rz * (y < 0 ? 1 + 0.08 * y : 1));
    }
    geo.computeVertexNormals();
  }
  mesh(treat(geo, T, 0.2), m, { parent, at: [c.x, c.y, c.z], name: 'head' });
  if (features) {
    const sz = (x, y) => c.z + rz * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2 - (y / ry) ** 2)) * (T.chunky ? 1.05 : 1);
    if (!T.rough) mesh(new THREE.ConeGeometry(0.017, 0.05, T.facet ? 4 : 10).rotateX(Math.PI / 2 + 0.25).scale(0.8, 1, 1), m, { parent, at: [c.x, c.y - 0.012, sz(0, -0.012) - 0.002] });
    mesh(ellipsoid(0.06, 0.011, 0.016, 16, 8), m, { parent, at: [c.x, c.y + 0.027, sz(0, 0.027) - 0.008] });
    mesh(ellipsoid(0.024, 0.008, 0.012, 12, 8), T.pop ? fin(T, '#d0103a', 'pop') : m, { parent, at: [c.x, c.y - 0.052, sz(0, -0.052) - 0.006] });
    for (const s of [-1, 1]) mesh(ellipsoid(0.017, 0.009, 0.01, 12, 8), T.pop ? fin(T, '#111111', 'pop') : m, { parent, at: [c.x + s * 0.03, c.y + 0.008, sz(s * 0.03, 0.008) - 0.006] });
  }
  if (ears) for (const s of [-1, 1]) mesh(ellipsoid(0.011, 0.028, 0.018, 12, 8), m, { parent, at: [c.x + s * rx * 0.96, c.y, c.z - 0.005] });
  return { rx, ry, rz };
}

function curls(parent, c, R, mat, filter, n = 140, r = 0.019, facet) {
  const pts = fibDirs(n).filter(filter).map((d) => new THREE.Vector3(c.x + d.x * R.rx * 0.98, c.y + d.y * R.ry * 0.98, c.z + d.z * R.rz * 0.98));
  return beads(pts, r, mat, parent, facet ? 0 : 1);
}

export function createBust(options = {}) {
  const { o, variant, trim, T } = setup(options, BUST_VARIANTS, 'bust');
  const root = group(`bust-${variant}`);
  const top = plinthBase(root, T, 0.34);
  const b = group('bust', { parent: root });
  const m = mainMat(T);
  const seg = T.facet ? 7 : 32;
  const child = variant === 'child', abstract = variant === 'abstract-head';
  const hk = child ? 1.08 : 1, ck = child ? 0.72 : T.chunky ? 1.12 : 1;
  const hairM = T.pop ? fin(T, T.s, 'pop') : m, chestM = T.pop ? fin(T, T.a, 'pop') : m, skinM = T.pop ? fin(T, '#ffb3c7', 'pop') : m;
  // round socle
  mesh(lathe([[0, 0], [0.08, 0], [0.08, 0.015], [0.06, 0.03], [0.045, 0.05], [0.045, 0.075], [0.07, 0.09], [0.07, 0.1], [0, 0.1]], seg), T.pop ? fin(T, '#111111', 'pop') : m, { parent: b });
  const prof = [[0, 0], [0.1, 0], [0.17, 0.015], [0.205, 0.06], [0.22, 0.13], [0.21, 0.185], [0.15, 0.225], [0.06, 0.245], [0, 0.25]].map(([x, y]) => [x * ck * (T.slim ? 0.88 : 1), y * (child ? 0.8 : 1)]);
  const chestTop = 0.095 + 0.25 * (child ? 0.8 : 1);
  mesh(treat(lathe(prof, seg).scale(1, 1, 0.5), T, 0.3), chestM, { parent: b, at: [0, 0.095, 0], name: 'chest' });
  const neckH = abstract ? 0.14 : 0.09;
  mesh(new THREE.CylinderGeometry(0.045 * hk, 0.055 * hk, neckH + 0.04, seg), skinM, { parent: b, at: [0, chestTop - 0.02 + (neckH + 0.04) / 2, 0.005] });
  const R0 = abstract ? { rx: 0.075, ry: 0.145, rz: 0.085 } : { rx: 0.085 * hk, ry: 0.112 * hk * (T.pop ? 1.08 : 1) * (T.slim ? 1.05 : 1), rz: 0.1 * hk };
  const c = new THREE.Vector3(0, chestTop + neckH + R0.ry * 0.55, 0.015);
  const R = buildHead(b, T, c, { ...R0, features: !abstract, ears: !abstract, seg, mat: m, skinMat: skinM });
  if (abstract) {
    mesh(roundedBox(0.016, 0.11, 0.03, 0.007), skinM, { parent: b, at: [0, c.y + 0.0, c.z + R.rz - 0.008] });
    mesh(roundedBox(0.09, 0.006, 0.02, 0.003), skinM, { parent: b, at: [0, c.y + 0.045, c.z + R.rz * 0.8] });
  }
  const man = variant === 'classical-man' || variant === 'laurel';
  if (man) {
    curls(b, c, R, hairM, (d) => d.y > 0.15 || (d.y > -0.45 && d.z < -0.2), 150, 0.019, T.facet);
    if (variant === 'classical-man') curls(b, c, R, hairM, (d) => d.y < -0.35 && d.z > -0.1, 220, 0.015, T.facet);
  }
  if (variant === 'laurel') {
    const lm = T.finish === 'bronze' ? fin(T, T.a, 'stone') : T.pop ? fin(T, '#22b04a', 'pop') : T.finish === 'stone' ? fin(T, '#c9b26a', 'gold') : m;
    const pts = [];
    const geos = [];
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI * 0.95 + (i / 25) * Math.PI * 1.9;
      const x = Math.sin(a) * R.rx * 1.07, z = c.z + Math.cos(a) * R.rz * 1.07 * -1;
      pts.push([x, c.y + 0.05 + Math.abs(Math.sin(a)) * -0.01, z]);
      const g = new THREE.SphereGeometry(1, 8, 6).scale(0.024, 0.009, 0.012).rotateY(-a).rotateZ(i % 2 ? 0.5 : -0.5);
      geos.push(g.translate(x, c.y + 0.05 + (i % 2 ? 0.012 : -0.004), z));
    }
    mesh(mergeGeometries(geos), lm, { parent: b, name: 'laurel' });
  }
  if (variant === 'classical-woman' || variant === 'veiled') {
    const cap = new THREE.SphereGeometry(1, seg, 16, 0, Math.PI * 2, 0, 1.45).scale(R.rx * 1.07, R.ry * 1.05, R.rz * 1.06).rotateX(-0.35);
    mesh(treat(cap, T, 0.2), hairM, { parent: b, at: [c.x, c.y + 0.006, c.z - 0.008] });
    mesh(ellipsoid(0.05, 0.045, 0.045, seg, 12), hairM, { parent: b, at: [0, c.y + 0.02, c.z - R.rz * 1.05] });
    for (const s of [-1, 1]) curveTube([[s * R.rx * 0.95, c.y + 0.04, c.z - 0.01], [s * R.rx * 1.02, c.y - 0.03, c.z - 0.03], [s * R.rx * 0.8, c.y - 0.1, c.z - 0.05], [s * 0.05, chestTop + 0.01, c.z - 0.04]], 0.014, hairM, { parent: b, segments: 16, radialSegments: T.facet ? 5 : 10 });
  }
  if (variant === 'veiled') {
    const pts = [[0.001, c.y + R.ry * 1.12], [R.rx * 0.8, c.y + R.ry * 0.95], [R.rx * 1.15, c.y + R.ry * 0.3], [R.rx * 1.2, c.y - R.ry * 0.5], [0.14 * ck, chestTop - 0.02], [0.2 * ck, chestTop - 0.12], [0.205 * ck, 0.2]].map(([x, y]) => new THREE.Vector2(x, y));
    const veil = new THREE.LatheGeometry(pts, T.facet ? 10 : 40, 0.85, Math.PI * 2 - 1.7);
    veil.scale(1, 1, 0.62);
    const p = veil.attributes.position;
    for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getX(i), p.getZ(i)); const k = 1 + 0.04 * Math.sin(a * 9) * Math.min(1, (c.y - p.getY(i)) * 5); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    veil.computeVertexNormals();
    mesh(veil, dbl(T.pop ? fin(T, T.a, 'pop') : m), { parent: b, at: [0, 0, 0.0], name: 'veil' });
  }
  if (variant === 'helmeted') {
    const hm = T.finish === 'stone' ? fin(T, '#a8814a', 'bronze') : T.pop ? fin(T, T.s, 'pop') : m;
    mesh(new THREE.SphereGeometry(1, seg, 16, 0, Math.PI * 2, 0, 1.7).scale(R.rx * 1.12, R.ry * 1.1, R.rz * 1.12), dbl(hm), { parent: b, at: [c.x, c.y + 0.012, c.z - 0.005], name: 'helmet' });
    const crest = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI * 0.1 + (i / 16) * Math.PI * 0.95; crest.push([Math.cos(a) * 0.13, Math.sin(a) * 0.09]); }
    for (let i = 16; i >= 0; i--) { const a = Math.PI * 0.1 + (i / 16) * Math.PI * 0.95; crest.push([Math.cos(a) * 0.1, Math.sin(a) * 0.05]); }
    mesh(extrudeOutline(crest, 0.022, { bevel: 0.006, segments: 2 }).rotateY(Math.PI / 2), T.pop ? fin(T, '#d0103a', 'pop') : T.finish === 'stone' ? fin(T, '#8a2a20', 'stone') : accentMat(T), { parent: b, at: [0, c.y + R.ry * 0.97 - 0.07, c.z - 0.0], name: 'crest' });
    for (const s of [-1, 1]) mesh(ellipsoid(0.012, 0.055, 0.045, 12, 8), hm, { parent: b, at: [s * R.rx * 1.06, c.y - 0.035, c.z + 0.035] });
  }
  if (child) {
    curls(b, c, R, hairM, (d) => d.y > 0.35 || (d.y > -0.2 && d.z < -0.4), 90, 0.024, T.facet);
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.026, 12, 8), skinM, { parent: b, at: [s * 0.045, c.y - 0.03, c.z + R.rz * 0.72] });
  }
  if (T.rough) b.rotation.z = 0.04;
  seat(root, b, top);
  return done(root, 'bust', variant, o, [], T);
}

/* ================================= FIGURES ================================= */

export const FIGURE_VARIANTS = { standing: {}, contrapposto: {}, draped: {}, dancer: {}, seated: {}, pensive: {}, reclining: {}, torso: {} };

const STAND = {
  head: [0, 1.6, 0], chest: [0, 1.3, 0], pelvis: [0, 0.98, 0],
  sL: [0.19, 1.42, 0], eL: [0.25, 1.14, -0.01], hL: [0.27, 0.87, 0.02], sR: [-0.19, 1.42, 0], eR: [-0.25, 1.14, -0.01], hR: [-0.27, 0.87, 0.02],
  pL: [0.09, 0.92, 0], kL: [0.1, 0.5, 0.01], aL: [0.1, 0.09, 0], pR: [-0.09, 0.92, 0], kR: [-0.1, 0.5, 0.01], aR: [-0.1, 0.09, 0],
};
function pose(v) {
  const P = JSON.parse(JSON.stringify(STAND));
  if (v === 'contrapposto' || v === 'reclining') Object.assign(P, { chest: [0.02, 1.3, 0], head: [0.03, 1.6, 0.01], pL: [0.09, 0.94, 0], kL: [0.11, 0.52, 0], aL: [0.12, 0.09, 0], pR: [-0.09, 0.9, 0], kR: [-0.05, 0.49, 0.08], aR: [-0.13, 0.1, -0.1], eR: [-0.31, 1.15, -0.05], hR: [-0.19, 0.98, 0.09] });
  if (v === 'dancer') Object.assign(P, { eL: [0.32, 1.62, 0], hL: [0.17, 1.86, 0.03], eR: [-0.4, 1.48, 0.05], hR: [-0.62, 1.56, 0.06], pR: [-0.09, 0.92, 0], kR: [-0.12, 0.66, -0.3], aR: [-0.12, 0.72, -0.7], aL: [0.08, 0.1, 0.02], kL: [0.09, 0.5, 0.03], head: [0, 1.6, 0.03] });
  if (v === 'seated' || v === 'pensive') {
    Object.assign(P, { pelvis: [0, 0.56, 0], chest: [0, 0.86, 0.02], head: [0, 1.17, 0.03], sL: [0.19, 0.98, 0], eL: [0.24, 0.73, 0.12], hL: [0.18, 0.6, 0.33], sR: [-0.19, 0.98, 0], eR: [-0.24, 0.73, 0.12], hR: [-0.18, 0.6, 0.33], pL: [0.1, 0.52, 0.02], kL: [0.11, 0.52, 0.45], aL: [0.11, 0.09, 0.5], pR: [-0.1, 0.52, 0.02], kR: [-0.11, 0.52, 0.45], aR: [-0.11, 0.09, 0.5] });
    if (v === 'pensive') Object.assign(P, { chest: [0, 0.84, 0.12], head: [0, 1.11, 0.25], sR: [-0.18, 0.96, 0.1], sL: [0.18, 0.96, 0.1], eR: [-0.11, 0.6, 0.43], hR: [-0.03, 0.99, 0.33], aL: [0.13, 0.09, 0.42] });
  }
  return P;
}

export function createFigure(options = {}) {
  const { o, variant, trim, T } = setup(options, FIGURE_VARIANTS, 'figure-statue');
  const root = group(`figure-${variant}`);
  const rec = variant === 'reclining';
  const top = plinthBase(root, T, rec ? 1.0 : 0.6, { h: rec ? 0.4 : T.plinth === 'column' || T.plinth === 'tall' || T.plinth === 'slender' ? 0.7 : undefined });
  if (rec) { /* widen into a slab */ root.getObjectByName('plinth').scale.set(1.9, 1, 0.75); }
  const f = group('figure', { parent: root });
  const m = mainMat(T);
  const seg = T.facet ? 6 : 14;
  const k = T.chunky ? 1.3 : T.slim ? 0.82 : T.pop ? 1.18 : 1;
  const skinM = T.pop ? fin(T, '#ffb3c7', 'pop') : m, topM = T.pop ? fin(T, T.p, 'pop') : m, legM = T.pop ? fin(T, T.a, 'pop') : m, hairM = T.pop ? fin(T, T.s, 'pop') : m;
  const P = pose(variant);
  const V = (a) => new THREE.Vector3(...a);
  const torso = variant === 'torso';
  // torso masses
  const chestG = treat(ellipsoid(0.17 * k, 0.2, 0.115 * k, seg * 2, seg), T, 0.4);
  mesh(chestG, topM, { parent: f, at: P.chest, name: 'chest' });
  const mid = V(P.chest).lerp(V(P.pelvis), 0.5);
  mesh(ellipsoid(0.14 * k, 0.16, 0.1 * k, seg * 2, seg), topM, { parent: f, at: mid.toArray() });
  mesh(treat(ellipsoid(0.165 * k, 0.13, 0.11 * k, seg * 2, seg), T, 0.4), legM, { parent: f, at: P.pelvis, name: 'pelvis' });
  const lim = (a, b, r, mat) => capsule(a, b, r * k, mat, f, seg);
  if (!torso) {
    lim(V(P.chest).add(V([0, 0.15, 0])).toArray(), V(P.head).add(V([0, -0.08, 0])).toArray(), 0.05, skinM);
    const h = V(P.head);
    mesh(treat(ellipsoid(0.09, 0.115, 0.1, seg * 2, seg), T, 0.2), skinM, { parent: f, at: P.head, name: 'head' });
    mesh(new THREE.SphereGeometry(1, seg * 2, seg, 0, Math.PI * 2, 0, 1.5).scale(0.096, 0.12, 0.105).rotateX(-0.4), hairM, { parent: f, at: [h.x, h.y + 0.008, h.z - 0.01] });
    if (!T.rough) mesh(new THREE.ConeGeometry(0.016, 0.045, 6).rotateX(Math.PI / 2 + 0.25), skinM, { parent: f, at: [h.x, h.y - 0.01, h.z + 0.1] });
    for (const s of ['L', 'R']) {
      lim(P[`s${s}`], P[`e${s}`], 0.045, skinM); lim(P[`e${s}`], P[`h${s}`], 0.037, skinM);
      mesh(ellipsoid(0.03, 0.06, 0.045, seg, seg), skinM, { parent: f, at: V(P[`h${s}`]).add(V([0, -0.04, 0])).toArray() });
      lim(P[`p${s}`], P[`k${s}`], 0.07, legM); lim(P[`k${s}`], P[`a${s}`], 0.05, legM);
      const a = V(P[`a${s}`]);
      mesh(ellipsoid(0.045, 0.04, 0.11, seg, seg), legM, { parent: f, at: [a.x, a.y - 0.045, a.z + 0.055] });
    }
    for (const s of ['L', 'R']) mesh(new THREE.SphereGeometry(0.06 * k, seg, seg), skinM, { parent: f, at: P[`s${s}`] });
  } else {
    // classical fragment: stumps, mounted on a steel rod
    for (const s of ['L', 'R']) {
      lim(P[`s${s}`], V(P[`s${s}`]).lerp(V(P[`e${s}`]), 0.5).toArray(), 0.05, skinM);
      lim(P[`p${s}`], V(P[`p${s}`]).lerp(V(P[`k${s}`]), 0.45).toArray(), 0.075, legM);
      mesh(new THREE.SphereGeometry(0.06 * k, seg, seg), skinM, { parent: f, at: P[`s${s}`] });
    }
    lim(V(P.chest).add(V([0, 0.15, 0])).toArray(), V(P.chest).add(V([0, 0.26, 0])).toArray(), 0.05, skinM);
  }
  if (variant === 'draped') {
    const pts = [[0.17, 1.02], [0.2, 0.9], [0.22, 0.6], [0.25, 0.3], [0.3, 0.06], [0.31, 0.0], [0.0, 0.0]].map(([x, y]) => new THREE.Vector2(x * k, y));
    const robe = new THREE.LatheGeometry(pts, T.facet ? 10 : 48);
    const p = robe.attributes.position;
    for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getX(i), p.getZ(i)); const kk = 1 + 0.06 * Math.sin(a * 11 + p.getY(i) * 3) * (1.1 - p.getY(i)); p.setX(i, p.getX(i) * kk); p.setZ(i, p.getZ(i) * kk * 0.8); }
    robe.computeVertexNormals();
    mesh(treat(robe, T, 0.5), T.pop ? fin(T, T.s, 'pop') : m, { parent: f, name: 'robe' });
    curveTube([[0.17, 1.38, 0.05], [0.05, 1.2, 0.11], [-0.12, 1.02, 0.1], [-0.18, 0.95, 0.02]], 0.035 * k, T.pop ? fin(T, T.s, 'pop') : m, { parent: f, segments: 20, radialSegments: seg });
  }
  if (variant === 'seated' || variant === 'pensive') {
    const sm = T.pop ? fin(T, '#111111', 'pop') : m;
    mesh(treat(roundedBox(0.5, 0.45, 0.46, 0.03), T, 0.4), sm, { parent: f, at: [0, 0.225, 0.02], name: 'seat' });
  }
  if (torso) {
    const rod = new THREE.Group();
    f.add(rod);
    mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 12), M.metal('#2a2a2c', 0.4), { parent: f, at: [0, P.pelvis[1] - 0.25, 0] });
  }
  if (rec) { f.rotation.z = Math.PI / 2; f.position.x = 0.85; }
  if (T.rough) f.rotation.y = 0.15;
  seat(root, f, top, 0.01);
  return done(root, 'figure-statue', variant, o, [], T);
}

/* ================================= ABSTRACT ================================= */

export const ABSTRACT_VARIANTS = {
  'twisted-torus': {}, 'stacked-stones': { p: '#8c877e' }, ribbon: {}, mobius: {}, 'voronoi-shell': {}, knot: {}, arches: {}, spiral: {}, 'ring-and-orb': {}, monolith: {},
};

/** Hex/pent lattice over a sphere (dual of a jittered geodesic) as one merged geometry. */
export function latticeSphere(R, rod, seed = 1, detail = 1) {
  const base = new THREE.IcosahedronGeometry(1, detail);
  const pos = base.attributes.position;
  const key = (i) => `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
  const jit = new Map();
  const r = (s) => { const x = Math.sin(s * 91.7 + seed * 13.1) * 43758.5; return x - Math.floor(x) - 0.5; };
  const P = (i) => {
    const k = key(i);
    if (!jit.has(k)) { const v = new THREE.Vector3().fromBufferAttribute(pos, i); const h = jit.size + 1; v.add(new THREE.Vector3(r(h), r(h + 0.3), r(h + 0.7)).multiplyScalar(0.12)).normalize(); jit.set(k, v); }
    return jit.get(k);
  };
  const cents = [];
  const edges = new Map();
  for (let t = 0; t < pos.count / 3; t++) {
    const ids = [t * 3, t * 3 + 1, t * 3 + 2];
    cents.push(ids.reduce((a, i) => a.add(P(i)), new THREE.Vector3()).normalize().multiplyScalar(R));
    for (let e = 0; e < 3; e++) {
      const ek = [key(ids[e]), key(ids[(e + 1) % 3])].sort().join('|');
      if (!edges.has(ek)) edges.set(ek, []);
      edges.get(ek).push(t);
    }
  }
  const gs = [];
  for (const [a, b] of edges.values()) {
    if (b === undefined) continue;
    const A = cents[a], B = cents[b];
    const d = B.clone().sub(A);
    const g = new THREE.CylinderGeometry(rod, rod, d.length(), 6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(_up, d.clone().normalize()));
    g.translate(...A.clone().addScaledVector(d, 0.5).toArray());
    gs.push(g);
  }
  for (const c of cents) gs.push(new THREE.IcosahedronGeometry(rod * 1.35, 1).translate(c.x, c.y, c.z));
  return mergeGeometries(gs.map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => { g.deleteAttribute('uv'); return g; }));
}

export function createAbstractSculpture(options = {}) {
  const { o, variant, trim, T } = setup(options, ABSTRACT_VARIANTS, 'abstract-sculpture');
  const root = group(`abstract-${variant}`);
  const top = plinthBase(root, T, 0.42);
  const s = group('sculpture', { parent: root });
  const m = mainMat(T), md = dbl(m);
  const acc = T.pop ? fin(T, T.s, 'pop') : T.finish === 'stone' ? fin(T, '#2b2b2e', 'pop') : accentMat(T);
  const seg = T.facet ? 0.35 : 1;
  const S = (n) => Math.max(4, Math.round(n * seg));
  if (variant === 'twisted-torus') {
    const R = 0.24, a = 0.075, bb = 0.03;
    const g = new ParametricGeometry((u, v, t) => {
      const th = u * Math.PI * 2, ph = v * Math.PI * 2, tw = th * 1.5;
      const lx = a * Math.cos(ph) * Math.cos(tw) - bb * Math.sin(ph) * Math.sin(tw);
      const ly = a * Math.cos(ph) * Math.sin(tw) + bb * Math.sin(ph) * Math.cos(tw);
      t.set(Math.cos(th) * (R + lx), Math.sin(th) * (R + lx), ly);
    }, S(120), S(20));
    mesh(treat(g, T, 0.4), md, { parent: s });
  } else if (variant === 'stacked-stones') {
    let y = 0;
    const r = T.r;
    for (let i = 0; i < 5; i++) {
      const rx = 0.17 - i * 0.022 + r() * 0.02, ry = 0.05 + r() * 0.02;
      const g = new THREE.IcosahedronGeometry(1, T.facet ? 1 : 3).scale(rx, ry, rx * (0.75 + r() * 0.2));
      roughen(g, 0.012, 9);
      y += i ? ry * 0.85 : ry;
      mesh(treat(g, T, 0.3), T.pop ? fin(T, ['#ff2f6d', '#ffd400', '#1e8fff', '#22b04a', '#111111'][i], 'pop') : m, { parent: s, at: [(r() - 0.5) * 0.03, y, (r() - 0.5) * 0.03], rot: [0, r() * 3, (r() - 0.5) * 0.12] });
      y += ry * 0.85;
    }
  } else if (variant === 'ribbon') {
    const path = (t) => new THREE.Vector3(0.2 * Math.sin(t * Math.PI * 3) * (1 - t * 0.5), 0.02 + t * 0.7, 0.2 * Math.cos(t * Math.PI * 3) * (1 - t * 0.5) - 0.2);
    const g = new ParametricGeometry((u, v, out) => {
      const p = path(u), q = path(Math.min(1, u + 0.01)).sub(path(Math.max(0, u - 0.01))).normalize();
      const side = new THREE.Vector3(0, 1, 0).cross(q).normalize();
      const n = q.clone().cross(side);
      const ang = u * Math.PI * 2.5;
      const dir = side.multiplyScalar(Math.cos(ang)).add(n.multiplyScalar(Math.sin(ang)));
      out.copy(p).addScaledVector(dir, (v - 0.5) * 0.12 * (1 - u * 0.4));
    }, S(160), 4);
    mesh(g, md, { parent: s });
  } else if (variant === 'mobius') {
    const R = 0.24;
    const g = new ParametricGeometry((u, v, t) => {
      const a = u * Math.PI * 2, w = (v - 0.5) * 0.16;
      t.set((R + w * Math.cos(a / 2)) * Math.cos(a), (R + w * Math.cos(a / 2)) * Math.sin(a), w * Math.sin(a / 2));
    }, S(120), 6);
    mesh(g, md, { parent: s });
    mesh(new THREE.TorusGeometry(R, 0.01, 8, S(120)), m, { parent: s });
  } else if (variant === 'voronoi-shell') {
    mesh(latticeSphere(0.24, 0.011, 3, T.facet ? 1 : 2), m, { parent: s });
  } else if (variant === 'knot') {
    mesh(treat(new THREE.TorusKnotGeometry(0.17, 0.048, S(200), S(16), 2, 3), T, 0.4), m, { parent: s });
  } else if (variant === 'arches') {
    const g = new THREE.TorusGeometry(0.28, 0.05, S(16), S(48), Math.PI).scale(1, 1, 1.5);
    mesh(treat(g, T, 0.4), m, { parent: s });
    mesh(treat(new THREE.TorusGeometry(0.2, 0.04, S(16), S(48), Math.PI).scale(1, 1.25, 1.4), T, 0.4), acc, { parent: s, rot: [0, Math.PI / 2, 0] });
  } else if (variant === 'spiral') {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push([Math.cos(t * Math.PI * 6) * 0.16 * (1 - t * 0.6), 0.03 + t * 0.8, Math.sin(t * Math.PI * 6) * 0.16 * (1 - t * 0.6)]); }
    curveTube(pts, 0.025, m, { parent: s, segments: S(160), radialSegments: S(12) });
    mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, S(36)), acc, { parent: s, at: [0, 0.015, 0] });
    mesh(new THREE.SphereGeometry(0.045, S(16), S(12)), acc, { parent: s, at: [pts[60][0], pts[60][1] + 0.03, pts[60][2]] });
  } else if (variant === 'ring-and-orb') {
    const R = 0.25, tb = 0.075;
    mesh(treat(new THREE.TorusGeometry(R, tb, S(20), S(64)).scale(1, 1, 0.7), T, 0.5), m, { parent: s });
    mesh(new THREE.SphereGeometry(0.12, S(32), S(24)), acc, { parent: s, at: [0, -R + tb + 0.118, 0] });
  } else {
    const sh = new THREE.Shape();
    const w = 0.12, d = 0.06, r = 0.03;
    sh.moveTo(-w + r, -d); sh.lineTo(w - r, -d); sh.quadraticCurveTo(w, -d, w, -d + r); sh.lineTo(w, d - r); sh.quadraticCurveTo(w, d, w - r, d); sh.lineTo(-w + r, d); sh.quadraticCurveTo(-w, d, -w, d - r); sh.lineTo(-w, -d + r); sh.quadraticCurveTo(-w, -d, -w + r, -d);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.95, steps: 30, bevelEnabled: false, curveSegments: 4 }).rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), a = (y / 0.95) * Math.PI * 0.6; const x = p.getX(i), z = p.getZ(i); p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)); }
    g.computeVertexNormals();
    mesh(treat(g, T, 0.5), m, { parent: s });
  }
  if (T.pop && variant !== 'stacked-stones') s.scale.set(1.15, 0.92, 1.15);
  if (T.slim) s.scale.set(0.85, 1.15, 0.85);
  seat(root, s, top, 0.006);
  return done(root, 'abstract-sculpture', variant, o, [], T);
}
