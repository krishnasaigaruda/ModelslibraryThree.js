import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as M from '../../core/materials.js';
import { group, roundedBox, lathe, extrudeOutline } from '../../core/utils.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { clip } from '../../core/animation.js';
import { brandEmblem } from '../../core/brand.js';

/*
 * Shared kit for heavy vehicles (trucks, construction, farm, industrial, trailers):
 *  - Merge: batch static parts per material into one mesh (few draw calls)
 *  - heavyWheel: light-weight truck / lug / industrial wheels (3–4 meshes each)
 *  - Ram: hydraulic cylinder that follows two anchors
 *  - poseClip: sample any articulated pose function into an AnimationClip
 *  - trackAssembly: crawler tracks with real moving links, sprocket, idler, rollers
 *  - machineCab: glass cab / ROPS canopy / guard cage with seat, controls, mirrors
 *  - machine lamps + standard animation sets
 * Vehicles face +X, origin at ground centre.
 */

/* ------------------------------------------------------------------ */
/* Materials                                                            */
/* ------------------------------------------------------------------ */

export function heavyMats(o = {}, d = {}) {
  return {
    paint: M.paint(o.color ?? d.color ?? '#f2a900', { metallic: 0.15, roughness: 0.38 }),
    accent: M.paint(o.accentColor ?? d.accent ?? '#1d1d1f', { metallic: 0.2, roughness: 0.4 }),
    cargo: M.paint(o.cargoColor ?? d.cargo ?? '#d5d9de', { metallic: 0.2, roughness: 0.4 }),
    dark: new THREE.MeshStandardMaterial({ name: 'dark', color: '#1b1c1e', roughness: 0.6, metalness: 0.3 }),
    black: new THREE.MeshStandardMaterial({ name: 'black', color: '#0d0d0e', roughness: 0.8 }),
    steel: M.metal('#4a4d52', 0.5),
    iron: M.metal('#2d2f33', 0.6),
    alu: M.metal('#c4c8cc', 0.3),
    chrome: M.chrome(),
    rubber: M.rubber(),
    hose: new THREE.MeshStandardMaterial({ name: 'hose', color: '#121212', roughness: 0.7 }),
    glass: new THREE.MeshPhysicalMaterial({
      name: 'glass', color: '#0b1014', roughness: 0.03, transparent: true, opacity: 0.55, clearcoat: 1,
      envMapIntensity: 1.3, side: THREE.DoubleSide, depthWrite: false,
    }),
    seat: M.fabric('#2a2a2c'),
    interior: new THREE.MeshStandardMaterial({ name: 'interior', color: '#2a2b2d', roughness: 0.9 }),
    wear: M.metal('#7b7d80', 0.35), // polished bucket edges, cutting blades
    rimPaint: M.paint(o.rimColor ?? d.rim ?? o.color ?? d.color ?? '#f2a900', { metallic: 0.2, roughness: 0.4 }),
    stripeA: M.matte('#f2c200', 0.6),
    stripeB: M.matte('#111111', 0.6),
    decal: M.matte('#f4f4f2', 0.5),
    blue: M.paint('#1e5bd8', { metallic: 0.3, roughness: 0.35 }),
  };
}

/* ------------------------------------------------------------------ */
/* Merge static parts                                                   */
/* ------------------------------------------------------------------ */

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();

function prep(geo) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  g.morphAttributes = {};
  g.clearGroups();
  return g;
}

/** Collect geometry per material, then flush into one mesh per material. */
export class Merge {
  constructor() {
    this.parts = new Map();
  }
  /** add(geo, mat, { at, rot, scale, matrix }) */
  add(geo, mat, { at, rot, scale, matrix } = {}) {
    if (matrix) _m.copy(matrix);
    else {
      _p.set(...(at ?? [0, 0, 0]));
      _q.setFromEuler(_e.set(...(rot ?? [0, 0, 0])));
      if (scale == null) _s.set(1, 1, 1);
      else if (typeof scale === 'number') _s.setScalar(scale);
      else _s.set(...scale);
      _m.compose(_p, _q, _s);
    }
    const g = prep(geo);
    g.applyMatrix4(_m);
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat).push(g);
    return this;
  }
  /** Add a box with bevelled edges. */
  box(w, h, d, mat, opts = {}) {
    return this.add(bevelBox(w, h, d, opts.r), mat, opts);
  }
  /** Cylinder between two points. */
  tube(a, b, r, mat, seg = 12) {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const len = dir.length();
    if (len < 1e-5) return this;
    const geo = new THREE.CylinderGeometry(r, r, len, seg);
    _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    _m.compose(va.clone().addScaledVector(dir, len / 2), _q, _s.set(1, 1, 1));
    return this.add(geo, mat, { matrix: _m.clone() });
  }
  /** Smooth bent pipe through points. */
  pipe(points, r, mat, seg = 32, rs = 10) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    return this.add(new THREE.TubeGeometry(curve, seg, r, rs, false), mat);
  }
  flush(parent, name) {
    const out = [];
    for (const [mat, list] of this.parts) {
      if (!list.length) continue;
      const geo0 = list.length === 1 ? list[0] : mergeGeometries(list, false);
      const geo = splitLong(geo0, 0.35);
      const m = new THREE.Mesh(geo, mat);
      if (name) m.name = out.length ? `${name}_${out.length}` : name;
      parent.add(m);
      out.push(m);
    }
    this.parts.clear();
    return out;
  }
}

/**
 * Bisect triangles whose longest edge exceeds `maxLen` (non-indexed geometry with position/normal/uv).
 * Long sliver triangles on big panels shade and sample badly; this keeps every face reasonably dense.
 */
export function splitLong(geo, maxLen) {
  if (geo.index) geo = geo.toNonIndexed();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
  const P = geo.attributes.position.array;
  const N = geo.attributes.normal.array;
  const U = geo.attributes.uv.array;
  const n = P.length / 9;
  let need = false;
  const L2 = maxLen * maxLen;
  const d2 = (a, b) => (P[a * 3] - P[b * 3]) ** 2 + (P[a * 3 + 1] - P[b * 3 + 1]) ** 2 + (P[a * 3 + 2] - P[b * 3 + 2]) ** 2;
  for (let t = 0; t < n && !need; t++) { const i = t * 3; if (d2(i, i + 1) > L2 || d2(i + 1, i + 2) > L2 || d2(i + 2, i) > L2) need = true; }
  if (!need) return geo;
  const op = []; const on = []; const ou = [];
  const vtx = (i) => ({ p: [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]], n: [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]], u: [U[i * 2], U[i * 2 + 1]] });
  const mid = (a, b) => ({ p: a.p.map((v, k) => (v + b.p[k]) / 2), n: a.n.map((v, k) => (v + b.n[k]) / 2), u: a.u.map((v, k) => (v + b.u[k]) / 2) });
  const dd = (a, b) => (a.p[0] - b.p[0]) ** 2 + (a.p[1] - b.p[1]) ** 2 + (a.p[2] - b.p[2]) ** 2;
  const emit = (a, b, c, depth) => {
    const ab = dd(a, b); const bc = dd(b, c); const ca = dd(c, a);
    const m = Math.max(ab, bc, ca);
    if (m > L2 && depth < 14) {
      if (m === ab) { const x = mid(a, b); emit(a, x, c, depth + 1); emit(x, b, c, depth + 1); }
      else if (m === bc) { const x = mid(b, c); emit(a, b, x, depth + 1); emit(a, x, c, depth + 1); }
      else { const x = mid(c, a); emit(a, b, x, depth + 1); emit(x, b, c, depth + 1); }
      return;
    }
    for (const v of [a, b, c]) { op.push(...v.p); on.push(...v.n); ou.push(...v.u); }
  };
  for (let t = 0; t < n; t++) emit(vtx(t * 3), vtx(t * 3 + 1), vtx(t * 3 + 2), 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(op, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(on, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(ou, 2));
  return g;
}

/** Rounded box with a radius suited to its size (never razor sharp). */
export function bevelBox(w, h, d, r) {
  return roundedBox(w, h, d, r ?? Math.min(0.03, Math.min(w, h, d) * 0.35), 2);
}

/* ------------------------------------------------------------------ */
/* Wheels                                                               */
/* ------------------------------------------------------------------ */

const tyreCache = new Map();
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * Parametric tyre: one smooth surface of revolution (rounded super-elliptic section with a
 * pinched bead) whose crown is displaced by a tread function, so lugs follow the curved crown
 * and the silhouette stays clean. tread(u, zn) → 0..1 lug height (u = turns 0..1, zn = −1..1).
 */
function treadTyre(r, w, rimR, { tread, depth, U, V = 40, p = 3.2 }) {
  const H = r - depth - rimR; // carcass section height (lugs add `depth` on top)
  const sec = [];
  for (let j = 0; j <= V; j++) {
    const th = -Math.PI / 2 + (j / V) * Math.PI;
    const c = Math.cos(th);
    const sn = Math.sin(th);
    const rr = rimR + H * Math.pow(Math.abs(c), 2 / p);
    let z = (w / 2) * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / p);
    z *= 1 - 0.1 * Math.pow(1 - Math.abs(c), 3); // bead narrower than the bulge
    sec.push([rr, z, c]);
  }
  // section normals (in r,z) by finite difference
  const nrm = sec.map((_, j) => {
    const a2 = sec[Math.max(0, j - 1)];
    const b2 = sec[Math.min(V, j + 1)];
    const dr = b2[0] - a2[0];
    const dz = b2[1] - a2[1];
    const l = Math.hypot(dr, dz) || 1;
    return [dz / l, -dr / l];
  });
  const pos = new Float32Array((U + 1) * (V + 1) * 3);
  const uv = new Float32Array((U + 1) * (V + 1) * 2);
  let k = 0;
  for (let i = 0; i <= U; i++) {
    const u = i / U;
    const ang = u * Math.PI * 2;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    for (let j = 0; j <= V; j++) {
      const [rr, z, c] = sec[j];
      const zn = z / (w / 2);
      const crown = smooth(0.35, 0.75, Math.abs(c)); // lugs on crown + shoulder only
      const d = depth * (crown > 0 ? tread(u, zn) * crown : 0);
      let [nr, nz] = nrm[j];
      if (nr < 0) { nr = -nr; nz = -nz; }
      const R = rr + nr * d;
      const Z = z + nz * d;
      pos[k * 3] = R * ca;
      pos[k * 3 + 1] = R * sa;
      pos[k * 3 + 2] = Z;
      uv[k * 2] = u;
      uv[k * 2 + 1] = j / V;
      k++;
    }
  }
  const idx = [];
  for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
    const a1 = i * (V + 1) + j;
    const b1 = (i + 1) * (V + 1) + j;
    idx.push(a1, a1 + 1, b1, b1, a1 + 1, b1 + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const frac = (x) => x - Math.floor(x);
/** soft band: 1 while frac(x) < duty, smooth edges of width e */
const band = (x, duty, e) => { const f = frac(x); return smooth(0, e, f) * (1 - smooth(duty - e, duty, f)); };

function tyreGeo(r, w, style) {
  const key = `${r.toFixed(3)}|${w.toFixed(3)}|${style}`;
  if (tyreCache.has(key)) return tyreCache.get(key);
  const rimR = r * (style === 'industrial' ? 0.55 : style === 'otr' ? 0.52 : style === 'lug' ? 0.6 : 0.6);
  let geo;
  if (style === 'otr') {
    // OTR rock tyre (E-4): solid centre rib, deep staggered chevron lugs wrapping the shoulders
    const n = Math.max(18, Math.round((Math.PI * 2 * r) / 0.42));
    geo = treadTyre(r, w, rimR, {
      depth: r * 0.075, U: n * 10, V: 34, p: 3.4,
      tread: (u, zn) => {
        const a = Math.abs(zn);
        const side = zn >= 0 ? 0 : 0.5;
        const lug = band(u * n + side - a * 0.42, 0.62, 0.07);
        const rib = 0.75 * (1 - smooth(0.16, 0.26, a));
        return Math.max(lug * smooth(0.12, 0.22, a), rib);
      },
    });
  } else if (style === 'lug') {
    // agricultural / loader bar lugs: open chevrons, nothing in between
    const n = Math.max(16, Math.round((Math.PI * 2 * r) / 0.2));
    geo = treadTyre(r, w, rimR, {
      depth: r * 0.09, U: n * 8, V: 30, p: 3.0,
      tread: (u, zn) => {
        const a = Math.abs(zn);
        const side = zn >= 0 ? 0 : 0.5;
        return band(u * n + side - a * 0.7, 0.3, 0.06) * smooth(0.02, 0.1, a);
      },
    });
  } else if (style === 'industrial') {
    geo = treadTyre(r, w, rimR, { depth: 0.001, U: 48, V: 16, p: 4, tread: () => 0 });
  } else {
    // highway truck tyre: four circumferential ribs with sipes
    const n = Math.round((Math.PI * 2 * r) / 0.06);
    geo = treadTyre(r, w, rimR, {
      depth: r * 0.035, U: n * 3, V: 26, p: 4.2,
      tread: (u, zn) => {
        const a = Math.abs(zn);
        const groove = Math.min(1, Math.abs(a - 0.42) / 0.07, Math.abs(zn) / 0.06);
        return smooth(0.3, 0.9, groove) * (1 - 0.5 * (1 - band(u * n + a * 0.3, 0.85, 0.1)));
      },
    });
  }
  const out = { geo, rimR };
  tyreCache.set(key, out);
  return out;
}

/**
 * Heavy wheel. Axle along Z, outer face toward `side` (+1 = +Z).
 * style: 'truck' (8-stud steel), 'lug' (tractor/loader), 'industrial' (solid forklift), 'alu' (polished)
 * dual: adds an inner twin tyre. Returns { steer, spin }.
 */
export function heavyWheel(name, { radius: r = 0.52, width: w = 0.3, side = 1, style = 'truck', rimMat, dual = false, hubMat } = {}) {
  const steer = group(`${name}_steer`);
  const spin = group(name, { parent: steer });
  const s = side;
  const { geo, rimR } = tyreGeo(r, w, style === 'alu' ? 'truck' : style);
  const tyre = M.rubber();
  const tm = new THREE.Mesh(geo, tyre);
  spin.add(tm);
  if (dual) {
    const t2 = new THREE.Mesh(geo, tyre);
    t2.position.z = -s * w * 1.04;
    spin.add(t2);
  }
  const rim = rimMat ?? (style === 'alu' ? M.metal('#d9dde0', 0.18) : M.metal('#c9ccd1', 0.4));
  const mg = new Merge();
  const face = s * w * 0.3;
  // stub axle / hub carrier (fixed to steer): reaches inboard so axles and arms meet a solid hub
  {
    const z1 = -s * (w * 0.5 + (dual ? w * 1.04 : 0) + 0.15);
    mg.add(new THREE.CylinderGeometry(r * 0.12, r * 0.12, Math.abs(z1 - face * 0.5), 14).rotateX(Math.PI / 2), M.metal('#2e3034', 0.5), { at: [0, 0, (z1 + face * 0.5) / 2] });
    mg.flush(steer, `${name}_hub_axle`);
  }
  if (style === 'otr') {
    otrRim(mg, { r, w, s, rimR, dual, rim, hubMat });
    mg.flush(spin);
    return { steer, spin };
  }
  const dish = style === 'lug' ? 0.55 : 0.32;
  // barrel + dished disc
  mg.add(new THREE.CylinderGeometry(rimR, rimR, w * 0.9 + (dual ? w * 1.04 : 0), 24, 1, true).rotateX(Math.PI / 2), M.metal('#2c2d30', 0.5), { at: [0, 0, dual ? -s * w * 0.52 : 0] });
  const disc = lathe([[rimR * 0.99, 0], [rimR * 0.9, -w * 0.05], [rimR * 0.5, -w * dish * 0.6], [r * 0.2, -w * dish * 0.5], [r * 0.15, -w * dish * 0.3], [0.001, -w * dish * 0.3]], 24).rotateX(-Math.PI / 2);
  if (s < 0) disc.rotateY(Math.PI);
  mg.add(disc, rim, { at: [0, 0, face] });
  mg.add(new THREE.TorusGeometry(rimR * 0.99, r * 0.022, 6, 40), rim, { at: [0, 0, face] });
  // hand holes + studs
  const holes = style === 'lug' ? 10 : 8;
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x060606 });
  for (let i = 0; i < holes; i++) {
    const a = ((i + 0.5) / holes) * Math.PI * 2;
    const hg = new THREE.CircleGeometry(r * 0.055, 12);
    if (s < 0) hg.rotateY(Math.PI);
    mg.add(hg, holeMat, { at: [Math.cos(a) * rimR * 0.68, Math.sin(a) * rimR * 0.68, face - s * w * dish * 0.33] });
  }
  const studMat = M.chrome();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    mg.add(new THREE.CylinderGeometry(r * 0.024, r * 0.024, w * 0.08, 6).rotateX(Math.PI / 2), studMat, { at: [Math.cos(a) * r * 0.27, Math.sin(a) * r * 0.27, face - s * w * dish * 0.24] });
  }
  mg.add(new THREE.CylinderGeometry(r * 0.15, r * 0.18, w * 0.16, 20).rotateX(Math.PI / 2), hubMat ?? rim, { at: [0, 0, face - s * w * dish * 0.2] });
  mg.flush(spin);
  return { steer, spin };
}

/** Multi-piece earthmover rim: barrel, bead-seat flanges, lock ring, bolted disc, hub cover. */
const otrMats = {};
function otrRim(mg, { r, w, s, rimR, dual, rim, hubMat }) {
  const span = w * 0.94 + (dual ? w * 1.04 : 0);
  const zc = dual ? -s * w * 0.52 : 0;
  const ringMat = otrMats.ring ??= M.metal('#3a3c40', 0.45);
  const nutMat = otrMats.nut ??= M.metal('#5c5f63', 0.35);
  mg.add(new THREE.CylinderGeometry(rimR, rimR, span, 40, Math.max(1, Math.round(span / 0.12)), true).rotateX(Math.PI / 2), rim, { at: [0, 0, zc] });
  const zs = dual ? [s * w * 0.46, -s * w * 0.58, -s * w * 1.5] : [s * w * 0.46, -s * w * 0.46];
  if (dual) zs.push(s * w * -0.46);
  // bead-seat flanges: flared lips the tyre beads sit against
  for (const z of zs) {
    const out = Math.sign(z - zc) || s;
    const fl = lathe([[rimR * 0.995, 0], [rimR * 1.05, out * w * 0.005], [rimR * 1.075, out * w * 0.03], [rimR * 1.06, out * w * 0.045], [rimR * 0.995, out * w * 0.03]], 48).rotateX(Math.PI / 2);
    mg.add(fl, rim, { at: [0, 0, z] });
  }
  // lock ring with its split notch on the outer side
  mg.add(new THREE.TorusGeometry(rimR * 0.985, r * 0.014, 8, 56), ringMat, { at: [0, 0, s * w * 0.43] });
  mg.box(r * 0.05, r * 0.035, w * 0.04, ringMat, { at: [rimR * 0.985, 0, s * w * 0.43] });
  // gutter / driver lugs between barrel and disc
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    mg.box(r * 0.06, r * 0.05, w * 0.12, rim, { at: [Math.cos(a) * rimR * 0.96, Math.sin(a) * rimR * 0.96, s * w * 0.33], rot: [0, 0, a] });
  }
  // recessed disc
  const face = s * w * 0.36;
  const disc = lathe([[rimR * 0.995, 0], [rimR * 0.93, -w * 0.06], [rimR * 0.62, -w * 0.2], [r * 0.3, -w * 0.24], [r * 0.3, -w * 0.25], [0.001, -w * 0.25]], 48).rotateX(Math.PI / 2);
  if (s < 0) disc.rotateY(Math.PI);
  mg.add(disc, rim, { at: [0, 0, face] });
  // radial stiffening ribs
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    const len = rimR * 0.62 - r * 0.32;
    mg.box(len, r * 0.025, w * 0.08, rim, { at: [Math.cos(a) * (r * 0.32 + len / 2), Math.sin(a) * (r * 0.32 + len / 2), face - s * w * 0.18], rot: [0, 0, a] });
  }
  // wheel nuts on the bolt circle
  const nut = new THREE.CylinderGeometry(r * 0.02, r * 0.02, w * 0.05, 6).rotateX(Math.PI / 2);
  const nn = 24;
  for (let i = 0; i < nn; i++) {
    const a = (i / nn) * Math.PI * 2;
    mg.add(nut, nutMat, { at: [Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, face - s * w * 0.22] });
  }
  // domed hub cover with its bolt ring
  const dome = new THREE.SphereGeometry(r * 0.27, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.32).rotateX(s * Math.PI / 2);
  mg.add(dome, hubMat ?? ringMat, { at: [0, 0, face - s * w * 0.25 - s * r * 0.27 * Math.cos(Math.PI * 0.32) + s * 0.002] });
  mg.add(new THREE.TorusGeometry(r * 0.25, r * 0.012, 6, 40), nutMat, { at: [0, 0, face - s * w * 0.245] });
}

/** Add many heavy wheels: positions [[name, x, z, steer?, dual?]] */
export function addHeavyWheels(root, positions, opts) {
  const spins = [];
  const steers = [];
  for (const [name, x, z, front, dual] of positions) {
    const { steer, spin } = heavyWheel(name, { ...opts, side: Math.sign(z) || 1, dual: dual ?? opts.dual });
    steer.position.set(x, opts.y ?? opts.radius, z);
    root.add(steer);
    spins.push(spin);
    if (front) steers.push(steer);
  }
  return { spins, steers };
}

/* ------------------------------------------------------------------ */
/* Hydraulic rams + articulated pose sampling                           */
/* ------------------------------------------------------------------ */

/**
 * Hydraulic ram from a base point (in `parent` space) to an anchor Object3D anywhere.
 * Call ram.update() after moving joints. Barrel + chrome rod (rod scales along its axis).
 */
export function makeRam(parent, name, base, tipAnchor, { r = 0.07, mats, barrel } = {}) {
  const g = group(name, { parent, at: base });
  const rod = group(`${name}_rod`, { parent: g });
  g.updateWorldMatrix(true, false);
  const tip = tipAnchor.getWorldPosition(new THREE.Vector3());
  const local = parent.worldToLocal(tip.clone());
  const len0 = local.distanceTo(new THREE.Vector3(...base));
  const bl = barrel ?? len0 * 0.62;
  const mg = new Merge();
  mg.add(new THREE.CylinderGeometry(r, r, bl, 16).translate(0, bl / 2, 0), mats.paint);
  mg.add(new THREE.CylinderGeometry(r * 1.25, r * 1.25, r * 1.6, 16).rotateX(Math.PI / 2), mats.steel); // pivot eye
  mg.add(new THREE.CylinderGeometry(r * 1.1, r * 1.1, r * 0.6, 16).translate(0, bl - r * 0.3, 0), mats.steel);
  mg.flush(g);
  const rg = new THREE.CylinderGeometry(r * 0.55, r * 0.55, 1, 12).translate(0, 0.5, 0);
  const rodMesh = new THREE.Mesh(rg, mats.chrome);
  rodMesh.name = `${name}_rodmesh`;
  rod.add(rodMesh);
  const up = new THREE.Vector3(0, 1, 0);
  const ram = {
    group: g,
    rod,
    len: len0,
    update() {
      parent.updateWorldMatrix(true, true);
      const t = parent.worldToLocal(tipAnchor.getWorldPosition(new THREE.Vector3()));
      const dir = t.sub(g.position);
      const len = dir.length();
      g.quaternion.setFromUnitVectors(up, dir.normalize());
      rod.scale.set(1, len, 1);
      ram.len = len;
    },
  };
  ram.update();
  return ram;
}

/** Anchor (empty Object3D) at a point on a part. */
export function anchor(parent, at, name) {
  const a = new THREE.Object3D();
  a.position.set(...at);
  if (name) a.name = name;
  parent.add(a);
  return a;
}

/**
 * Sample an articulated pose function into a clip.
 *   poseClip('dig', 6, [boom, stick, bucket], rams, (t) => { boom.rotation.z = …; … }, 48)
 * Records quaternion of every joint (+ position of nodes in `movers`) and each ram's orientation + rod scale.
 */
export function poseClip(name, period, joints, rams, pose, steps = 36, { movers = [], scalers = [] } = {}) {
  const rest = joints.map((j) => j.quaternion.clone());
  const restP = movers.map((m) => m.position.clone());
  const restS = scalers.map((m) => m.scale.clone());
  const times = [];
  const jq = joints.map(() => []);
  const mp = movers.map(() => []);
  const ms = scalers.map(() => []);
  const rq = rams.map(() => []);
  const rs = rams.map(() => []);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    joints.forEach((j, k) => j.quaternion.copy(rest[k]));
    movers.forEach((m, k) => m.position.copy(restP[k]));
    scalers.forEach((m, k) => m.scale.copy(restS[k]));
    pose(t);
    for (const r of rams) r.update();
    times.push(t * period);
    joints.forEach((j, k) => jq[k].push(j.quaternion.x, j.quaternion.y, j.quaternion.z, j.quaternion.w));
    movers.forEach((m, k) => mp[k].push(m.position.x, m.position.y, m.position.z));
    scalers.forEach((m, k) => ms[k].push(m.scale.x, m.scale.y, m.scale.z));
    rams.forEach((r, k) => {
      const q = r.group.quaternion;
      rq[k].push(q.x, q.y, q.z, q.w);
      rs[k].push(1, r.len, 1);
    });
  }
  // restore rest pose
  joints.forEach((j, k) => j.quaternion.copy(rest[k]));
  movers.forEach((m, k) => m.position.copy(restP[k]));
  scalers.forEach((m, k) => m.scale.copy(restS[k]));
  for (const r of rams) r.update();
  const tracks = [];
  joints.forEach((j, k) => tracks.push(new THREE.QuaternionKeyframeTrack(`${j.name}.quaternion`, times, jq[k])));
  movers.forEach((m, k) => tracks.push(new THREE.VectorKeyframeTrack(`${m.name}.position`, times, mp[k])));
  scalers.forEach((m, k) => tracks.push(new THREE.VectorKeyframeTrack(`${m.name}.scale`, times, ms[k])));
  rams.forEach((r, k) => {
    tracks.push(new THREE.QuaternionKeyframeTrack(`${r.group.name}.quaternion`, times, rq[k]));
    tracks.push(new THREE.VectorKeyframeTrack(`${r.rod.name}.scale`, times, rs[k]));
  });
  return clip(name, period, tracks);
}

/** Smooth 0→1→0 with a hold at the top (for work cycles). */
export const cycle = (t, hold = 0.3) => {
  const up = (1 - hold) / 2;
  if (t < up) return 0.5 - 0.5 * Math.cos((t / up) * Math.PI);
  if (t < up + hold) return 1;
  return 0.5 + 0.5 * Math.cos(((t - up - hold) / up) * Math.PI);
};
export const ease = (t) => t * t * (3 - 2 * t);
/** Piecewise keyframes [[t, v], …] with smoothstep easing. */
export function keys(list) {
  return (t) => {
    for (let i = 1; i < list.length; i++) {
      if (t <= list[i][0]) {
        const [t0, v0] = list[i - 1];
        const [t1, v1] = list[i];
        return v0 + (v1 - v0) * ease((t - t0) / Math.max(1e-6, t1 - t0));
      }
    }
    return list[list.length - 1][1];
  };
}

/* ------------------------------------------------------------------ */
/* Crawler tracks                                                       */
/* ------------------------------------------------------------------ */

/**
 * Crawler track on one side. Track runs in the XY plane at z.
 *  x0 (rear sprocket centre), x1 (front idler centre), y (axle height), r (sprocket radius),
 *  ri (idler radius), width, pitch, rollers (count), shoes ('steel' grousers | 'rubber')
 *  topY: optional flat top run height (otherwise straight between circles)
 * Returns { group, links, wheels, drive(speed, dir) → tracks }
 */
export function trackAssembly(parent, { name, x0, x1, y, r = 0.36, ri, z, width = 0.5, pitch = 0.17, rollers = 5, shoes, mats, frameMat }) {
  shoes ??= mats.trackShoes ?? 'steel';
  ri ??= r * 0.9;
  const g = group(name, { parent, at: [0, 0, z] });
  const th = shoes === 'rubber' ? 0.07 : 0.06; // shoe thickness
  // path: bottom straight (front→rear at y - R), around sprocket (rear), top straight, around idler (front)
  const R0 = r + th / 2;
  const R1 = ri + th / 2;
  const bottomY0 = y - R0;
  const bottomY1 = y - R1;
  const ax = x0;
  const bx = x1;
  // build list of segments: [type, …]
  const segs = [];
  const d = bx - ax;
  const ang = Math.atan2(R0 - R1, d); // tangent tilt if radii differ
  const L0 = Math.hypot(d, R0 - R1) * Math.cos(0); // approx straight length
  segs.push({ kind: 'line', a: new THREE.Vector2(bx, bottomY1), b: new THREE.Vector2(ax, bottomY0) }); // bottom, front → rear
  segs.push({ kind: 'arc', c: new THREE.Vector2(ax, y), R: R0, a0: -Math.PI / 2, a1: -Math.PI * 1.5 }); // rear: bottom → top (clockwise when viewed from +Z? going around back)
  segs.push({ kind: 'line', a: new THREE.Vector2(ax, y + R0), b: new THREE.Vector2(bx, y + R1) }); // top, rear → front
  segs.push({ kind: 'arc', c: new THREE.Vector2(bx, y), R: R1, a0: Math.PI / 2, a1: -Math.PI / 2 }); // front: top → bottom
  for (const s of segs) s.len = s.kind === 'line' ? s.a.distanceTo(s.b) : Math.abs(s.a1 - s.a0) * s.R;
  const total = segs.reduce((a, s) => a + s.len, 0);
  void ang; void L0;
  const at = (u) => {
    // u along path [0,total) → { p, angle }   (angle of travel direction)
    let w = ((u % total) + total) % total;
    for (const s of segs) {
      if (w <= s.len) {
        if (s.kind === 'line') {
          const p = s.a.clone().lerp(s.b, w / s.len);
          const dir = s.b.clone().sub(s.a);
          return { p, a: Math.atan2(dir.y, dir.x) };
        }
        const t = s.a0 + (s.a1 - s.a0) * (w / s.len);
        const p = new THREE.Vector2(s.c.x + Math.cos(t) * s.R, s.c.y + Math.sin(t) * s.R);
        const dirSign = Math.sign(s.a1 - s.a0);
        return { p, a: t + dirSign * Math.PI / 2 };
      }
      w -= s.len;
    }
    return { p: segs[0].a.clone(), a: Math.PI };
  };
  const n = Math.max(12, Math.round(total / pitch));
  const step = total / n;
  // shoe geometry: plate + grouser, outer side faces away from the loop centre (local -Y)
  const mg = new Merge();
  const shoeW = step * 0.97;
  mg.box(shoeW, th, width, shoes === 'rubber' ? mats.rubber : mats.iron, { r: 0.012 });
  if (shoes === 'rubber') for (const zz of [-width * 0.25, width * 0.25]) mg.box(shoeW * 0.45, 0.03, width * 0.38, mats.rubber, { at: [0, -th / 2 - 0.012, zz], r: 0.01 });
  else mg.box(0.035, 0.045, width, mats.iron, { at: [-shoeW * 0.2, -th / 2 - 0.018, 0], r: 0.008 });
  mg.box(shoeW * 0.6, 0.05, 0.05, mats.steel, { at: [0, th / 2 + 0.02, 0], r: 0.01 }); // guide horn
  const shoeGeo = (() => {
    const tmp = new THREE.Group();
    const meshes = mg.flush(tmp);
    return meshes.map((m) => ({ geo: m.geometry, mat: m.material }));
  })();
  const links = [];
  for (let i = 0; i < n; i++) {
    const { p, a } = at(i * step);
    const link = group(`${name}_link${i}`, { parent: g, at: [p.x, p.y, 0], rot: [0, 0, a + Math.PI] });
    // link local: +X back along travel; outer face is local +Y after flip (travel along -X)
    for (const sg of shoeGeo) {
      const m = new THREE.Mesh(sg.geo, sg.mat);
      m.rotation.z = Math.PI; // grousers outward
      link.add(m);
    }
    links.push(link);
  }
  // sprocket (teeth), idler, rollers, frame
  const wheels = [];
  const sprocket = group(`${name}_sprocket`, { parent: g, at: [ax, y, 0] });
  const teeth = Math.max(9, Math.round((Math.PI * 2 * r) / step));
  {
    const sm = new Merge();
    sm.add(new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.08, 28).rotateX(Math.PI / 2), mats.iron);
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      sm.box(0.07, r * 0.2, 0.07, mats.iron, { at: [Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98, 0], rot: [0, 0, a - Math.PI / 2], r: 0.01 });
    }
    sm.add(new THREE.CylinderGeometry(r * 0.45, r * 0.5, width * 0.9, 20).rotateX(Math.PI / 2), frameMat ?? mats.dark);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      sm.add(new THREE.CylinderGeometry(0.02, 0.02, width * 0.95, 6).rotateX(Math.PI / 2), mats.steel, { at: [Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, 0] });
    }
    sm.flush(sprocket);
  }
  wheels.push({ node: sprocket, R: r, n: teeth });
  const idler = group(`${name}_idler`, { parent: g, at: [bx, y, 0] });
  const idN = Math.max(6, Math.round((Math.PI * 2 * ri) / step));
  {
    const im = new Merge();
    im.add(lathe([[0.001, -width * 0.32], [ri * 0.92, -width * 0.32], [ri * 0.98, -width * 0.22], [ri * 0.98, width * 0.22], [ri * 0.92, width * 0.32], [0.001, width * 0.32]], 28).rotateX(Math.PI / 2), mats.iron);
    for (let i = 0; i < idN; i++) {
      const a = (i / idN) * Math.PI * 2;
      for (const s of [1, -1]) im.add(new THREE.CylinderGeometry(ri * 0.08, ri * 0.08, 0.02, 10).rotateX(Math.PI / 2), mats.steel, { at: [Math.cos(a) * ri * 0.55, Math.sin(a) * ri * 0.55, s * width * 0.33] });
    }
    im.flush(idler);
  }
  wheels.push({ node: idler, R: ri, n: idN });
  const rr = Math.min(r, ri) * 0.42;
  const fm = new Merge();
  for (let k = 0; k < rollers; k++) {
    const x = ax + r * 0.9 + ((bx - ri * 0.9 - ax - r * 0.9) * (k + 0.5)) / rollers;
    const yb = bottomY0 + (bottomY1 - bottomY0) * ((x - ax) / (bx - ax)) + th / 2 + rr;
    const roller = group(`${name}_roller${k}`, { parent: g, at: [x, yb, 0] });
    const rm = new Merge();
    rm.add(lathe([[0.001, -width * 0.3], [rr, -width * 0.3], [rr * 0.8, -width * 0.12], [rr * 0.8, width * 0.12], [rr, width * 0.3], [0.001, width * 0.3]], 20).rotateX(Math.PI / 2), mats.iron);
    rm.box(rr * 0.5, rr * 0.25, width * 0.62, mats.steel, { r: 0.01 });
    rm.flush(roller);
    wheels.push({ node: roller, R: rr, n: Math.max(2, Math.round((Math.PI * 2 * rr) / step)) });
  }
  // carrier rollers on top
  const carriers = [];
  if (bx - ax > 1.8) for (const f of [0.33, 0.67]) {
    const x = ax + (bx - ax) * f;
    const yt = y + R0 + (R1 - R0) * f - th / 2 - rr * 0.6;
    const c = group(`${name}_carrier${carriers.length}`, { parent: g, at: [x, yt, 0] });
    const cm = new Merge();
    cm.add(new THREE.CylinderGeometry(rr * 0.6, rr * 0.6, width * 0.5, 16).rotateX(Math.PI / 2), mats.iron);
    cm.box(rr * 0.25, rr * 0.4, width * 0.52, mats.steel, { r: 0.008 });
    cm.flush(c);
    carriers.push(c);
    wheels.push({ node: c, R: rr * 0.6, n: 2 });
    fm.box(0.12, y + Math.min(R0, R1) * 0.2 - yt, 0.12, frameMat ?? mats.paint, { at: [x, (yt + y) / 2, -width * 0.15], r: 0.02 });
  }
  // track frame (inside the loop)
  const fh = Math.min(r, ri) * 1.1;
  const fl = bx - ax - (r + ri) * 0.4;
  fm.add(extrudeOutline([[-fl / 2, -fh / 2], [fl / 2, -fh / 2], [fl / 2 + fh * 0.3, 0], [fl / 2, fh / 2], [-fl / 2, fh / 2], [-fl / 2 - fh * 0.3, 0]], width * 0.55, { bevel: 0.03 }), frameMat ?? mats.paint, { at: [(ax + bx) / 2, y - fh * 0.05, 0] });
  fm.flush(g, `${name}_frame`);

  /** tracks for a drive clip: links advance one pitch per period, wheels turn accordingly. */
  function drive(period, dir = 1) {
    const tracks = [];
    const sub = 4;
    const times = [];
    for (let k = 0; k <= sub; k++) times.push((k / sub) * period);
    links.forEach((link, i) => {
      const pos = [];
      const quat = [];
      for (let k = 0; k <= sub; k++) {
        // forward (dir=1): the bottom run moves rearward relative to the machine → links travel along path direction
        const { p, a } = at(i * step + dir * (k / sub) * step);
        pos.push(p.x, p.y, 0);
        _q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a + Math.PI);
        quat.push(_q.x, _q.y, _q.z, _q.w);
      }
      tracks.push(new THREE.VectorKeyframeTrack(`${link.name}.position`, times, pos));
      tracks.push(new THREE.QuaternionKeyframeTrack(`${link.name}.quaternion`, times, quat));
    });
    for (const w of wheels) {
      const base = w.node.quaternion.clone();
      const ang = (2 * Math.PI) / w.n;
      const vals = [];
      for (let k = 0; k <= sub; k++) {
        const q = base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -dir * ang * (k / sub)));
        vals.push(q.x, q.y, q.z, q.w);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${w.node.name}.quaternion`, times, vals));
    }
    return tracks;
  }
  return { group: g, links, wheels, drive, step, total };
}

/** drive/reverse/turnLeft/turnRight clips for a pair of crawler tracks. */
export function crawlerAnimations(left, right, { speed = 1.2 } = {}) {
  const P = left.step / speed;
  return [
    clip('drive', P, [...left.drive(P, 1), ...right.drive(P, 1)]),
    clip('reverse', P, [...left.drive(P, -1), ...right.drive(P, -1)]),
    clip('turnLeft', P, [...left.drive(P, -1), ...right.drive(P, 1)]),
    clip('turnRight', P, [...left.drive(P, 1), ...right.drive(P, -1)]),
  ];
}

/* ------------------------------------------------------------------ */
/* Cabs                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Operator cab centred at `at` (floor centre). Faces +X.
 * style: 'cab' (glass), 'canopy' (ROPS posts + roof), 'cage' (glass + guard bars)
 * vintage: rounder, smaller windows. Returns { group, roofY, seatAt }.
 */
export function machineCab(parent, { at = [0, 0, 0], w = 1.0, d = 1.1, h = 1.6, style = 'cab', vintage = false, mats, frontRake = 0.08, name = 'cab', seatColor, wheel = false }) {
  const g = group(name, { parent, at });
  const mg = new Merge();
  let door = null;
  const post = vintage ? 0.07 : 0.055;
  const roofT = 0.09;
  const rake = frontRake * h;
  const xF = d / 2;
  const xB = -d / 2;
  // floor plate
  mg.box(d, 0.08, w, mats.dark, { at: [0, 0.04, 0] });
  // posts (front ones raked)
  const P = [[xF - rake, xF], [xB, xB]];
  for (const [xt, xb] of P) for (const s of [1, -1]) mg.tube([xb, 0.06, s * (w / 2 - post)], [xt, h - roofT, s * (w / 2 - post)], post, mats.dark, 10);
  // roof
  const roofGeo = roundedBox(d + 0.12, roofT, w + 0.1, Math.min(0.045, roofT * 0.45), 3);
  mg.add(roofGeo, style === 'canopy' ? mats.paint : mats.paint, { at: [-rake * 0.4, h - roofT / 2, 0] });
  if (vintage) mg.add(roundedBox(d + 0.06, 0.05, w + 0.06, 0.024, 3), mats.dark, { at: [-rake * 0.4, h - roofT - 0.02, 0] });
  if (style !== 'canopy') {
    // glass panels: front, back, sides; lower side panels painted (vintage: taller lower panels)
    const lowH = vintage ? h * 0.42 : h * 0.18;
    const gl = (geo, at2, rot) => mg.add(geo, mats.glass, { at: at2, rot });
    const glassH = h - roofT - lowH - 0.04;
    const midY = lowH + glassH / 2 + 0.02;
    gl(new THREE.PlaneGeometry(w - post * 2, glassH), [xF - rake * (midY / h), midY, 0], [0, Math.PI / 2, 0]);
    // tilt front glass to match rake
    gl(new THREE.PlaneGeometry(w - post * 2, glassH * 0.9), [xB + 0.005, midY, 0], [0, -Math.PI / 2, 0]);
    for (const s of [1, -1]) {
      const shape = new THREE.Shape([new THREE.Vector2(xB + post, lowH), new THREE.Vector2(xF - post, lowH), new THREE.Vector2(xF - rake * ((h - roofT) / h) - post, h - roofT - 0.02), new THREE.Vector2(xB + post, h - roofT - 0.02)]);
      const sg = new THREE.ShapeGeometry(shape);
      if (s < 0) {
        // the left side is the door, hinged on the front post
        const hx = xF - post;
        door = group(`${name}_door`, { parent: g, at: [hx, 0, s * (w / 2 - post)] });
        const dm = new Merge();
        dm.add(sg, mats.glass, { at: [-hx, 0, 0] });
        dm.box(d - post, lowH, 0.04, mats.paint, { at: [-hx, lowH / 2 + 0.04, 0] });
        dm.box(0.12, 0.025, 0.03, mats.dark, { at: [xB + 0.18 - hx, lowH + 0.25, s * 0.025] });
        dm.tube([xB + post - hx, lowH, 0], [xB + post - hx, h - roofT - 0.03, 0], 0.025, mats.dark, 8);
        dm.flush(door, `${name}_door_body`);
        continue;
      }
      mg.add(sg, mats.glass, { at: [0, 0, s * (w / 2 - post)] });
      mg.box(d - post, lowH, 0.04, mats.paint, { at: [-0.0, lowH / 2 + 0.04, s * (w / 2 - post)] });
      mg.box(0.12, 0.025, 0.03, mats.dark, { at: [xB + 0.18, lowH + 0.25, s * (w / 2 - post + 0.025)] });
    }
    mg.box(0.04, lowH, w - post * 2, mats.paint, { at: [xF - 0.02, lowH / 2 + 0.04, 0] });
    mg.box(0.04, lowH, w - post * 2, mats.paint, { at: [xB + 0.02, lowH / 2 + 0.04, 0] });
    // wiper
    mg.box(0.012, glassH * 0.7, 0.02, mats.black, { at: [xF - rake * 0.3 + 0.03, lowH + glassH * 0.38, -w * 0.12], rot: [0.4, 0, 0] });
  }
  if (style === 'cage') {
    // guard bars over front + roof
    for (let k = -2; k <= 2; k++) mg.tube([xF + 0.05, 0.3, k * (w / 5.5)], [xF - rake + 0.05, h - roofT, k * (w / 5.5)], 0.016, mats.dark, 6);
    for (const y of [0.55, 0.9, 1.25].map((f) => f * h / 1.6)) mg.tube([xF + 0.05 - rake * (y / h), y, -w / 2], [xF + 0.05 - rake * (y / h), y, w / 2], 0.014, mats.dark, 6);
    for (let k = -3; k <= 3; k++) mg.tube([xB, h + 0.06, k * (w / 7)], [xF - rake, h + 0.06, k * (w / 7)], 0.016, mats.dark, 6);
    for (const s of [1, -1]) mg.tube([xB, h + 0.06, s * w / 2], [xF - rake, h + 0.06, s * w / 2], 0.022, mats.dark, 8);
  }
  // interior: seat, armrests, joysticks / wheel
  const seatMat = seatColor ? M.fabric(seatColor) : mats.seat;
  const sx = -d * 0.08;
  mg.add(roundedBox(0.46, 0.12, 0.48, 0.05, 3), seatMat, { at: [sx, 0.52, 0] });
  mg.add(roundedBox(0.12, 0.6, 0.46, 0.05, 3), seatMat, { at: [sx - 0.24, 0.86, 0], rot: [0, 0, 0.12] });
  mg.box(0.25, 0.4, 0.3, mats.dark, { at: [sx, 0.28, 0] });
  for (const s of [1, -1]) {
    mg.box(0.34, 0.12, 0.1, mats.dark, { at: [sx + 0.04, 0.66, s * 0.3] });
    mg.tube([sx + 0.14, 0.72, s * 0.3], [sx + 0.18, 0.86, s * 0.3], 0.014, mats.black, 6);
    mg.add(new THREE.SphereGeometry(0.03, 10, 8), mats.black, { at: [sx + 0.18, 0.88, s * 0.3] });
  }
  if (wheel) {
    mg.tube([xF - 0.15, 0.2, 0], [xF - 0.32, 0.85, 0], 0.03, mats.dark, 8);
    mg.add(new THREE.TorusGeometry(0.17, 0.018, 8, 24).rotateY(Math.PI / 2).rotateZ(0.6), mats.black, { at: [xF - 0.33, 0.9, 0] });
  } else {
    mg.box(0.18, 0.5, 0.42, mats.dark, { at: [xF - 0.18, 0.3, 0] });
    for (const s of [1, -1]) mg.tube([xF - 0.2, 0.55, s * 0.1], [xF - 0.3, 0.78, s * 0.1], 0.015, mats.black, 6);
  }
  // mirrors
  for (const s of [1, -1]) {
    mg.tube([xF - rake * 0.5, h * 0.75, s * (w / 2)], [xF - rake * 0.5 + 0.1, h * 0.8, s * (w / 2 + 0.16)], 0.012, mats.dark, 6);
    mg.add(roundedBox(0.04, 0.2, 0.14, 0.018, 2), mats.black, { at: [xF - rake * 0.5 + 0.12, h * 0.8, s * (w / 2 + 0.2)] });
  }
  mg.flush(g, name === 'cab' ? 'cab_body' : `${name}_body`);
  return { group: g, roofY: at[1] + h, seatAt: [at[0] + sx, at[1] + 0.6, at[2]], h, w, d, rake, door };
}

/* ------------------------------------------------------------------ */
/* Lamps                                                                */
/* ------------------------------------------------------------------ */

/**
 * Creates the standard machine lamp groups. Use the returned groups' .add().
 *   head (white), work (white, roof work lights), tail, brake, beacon (amber), signalL/R
 */
export function machineLamps() {
  return {
    head: lampGroup('headlights', 'head'),
    work: lampGroup('worklights', 'white'),
    tail: lampGroup('taillights', 'tail'),
    brake: lampGroup('brakelights', 'brake'),
    beacon: lampGroup('beacon', 'amber'),
    signalL: lampGroup('indicator_L', 'signal'),
    signalR: lampGroup('indicator_R', 'signal'),
    reverse: lampGroup('reverselights', 'reverse'),
  };
}

/** Rotating-beacon dome on a small base (the lens is the lamp mesh). */
export function addBeacon(lamps, parent, at, { r = 0.07, mats } = {}) {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.2, r * 0.6, 16), mats?.dark ?? new THREE.MeshStandardMaterial({ color: '#1b1c1e' }));
  base.position.set(at[0], at[1] + r * 0.3, at[2]);
  parent.add(base);
  const dome = new THREE.SphereGeometry(r, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.5, 1);
  dome.translate(at[0], at[1] + r * 0.6, at[2]);
  return lamps.beacon.add(parent, { geometry: dome, normal: [0, 1, 0], depth: r * 0.5, w: r * 2, h: r * 2, glowSize: r * 7 });
}

/**
 * Standard light animations for machines, from the lamp groups that actually got lamps.
 * lights → head + work + tail; brake; beacon (blink); hazards/leftSignal/rightSignal.
 */
export function machineLampAnimations(lamps) {
  const has = (k) => lamps[k] && lamps[k].meshes.length > 0;
  const anims = [];
  const lt = [];
  if (has('head')) lt.push(...lampTracks('headlights', LAMP_ON.head));
  if (has('work')) lt.push(...lampTracks('worklights', LAMP_ON.white));
  if (has('tail')) lt.push(...lampTracks('taillights', LAMP_ON.tail, { glow: 0.55 }));
  if (lt.length) anims.push(clip('lights', 1, lt));
  if (has('brake')) anims.push(clip('brake', 1, lampTracks('brakelights', LAMP_ON.brake)));
  if (has('beacon')) anims.push(beaconClip());
  if (has('signalL') && has('signalR')) {
    const b = (n) => lampTracks(n, LAMP_ON.signal, { blink: 1.4 });
    anims.push(clip('hazards', 1 / 1.4, [...b('indicator_L'), ...b('indicator_R')]), clip('leftSignal', 1 / 1.4, b('indicator_L')), clip('rightSignal', 1 / 1.4, b('indicator_R')));
  }
  return anims;
}

/** Remove empty lamp groups from a lamps object (so vehicleAnimations skips them). */
export function lampNames(lamps) {
  const has = (k) => lamps[k] && lamps[k].meshes.length > 0;
  return {
    head: has('head') ? 'headlights' : undefined,
    tail: has('tail') ? 'taillights' : undefined,
    brake: has('brake') ? 'brakelights' : undefined,
    signalL: has('signalL') ? 'indicator_L' : undefined,
    signalR: has('signalR') ? 'indicator_R' : undefined,
    reverse: has('reverse') ? 'reverselights' : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Misc parts                                                           */
/* ------------------------------------------------------------------ */

/** Studio emblem facing +X (facing=1) or -X (facing=-1). */
const emblemBossMat = new THREE.MeshStandardMaterial({ name: 'emblem_mount', color: '#222326', roughness: 0.6, metalness: 0.4 });
export function emblem(parent, name, size, at, facing = 1) {
  const e = brandEmblem(size, { name });
  e.position.set(...at);
  e.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2;
  parent.add(e);
  // mounting boss behind the badge, reaching back into the panel it is bolted to
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.18, size * 0.18, 0.2, 10).rotateZ(Math.PI / 2), emblemBossMat);
  boss.name = `${name}_mount`;
  boss.position.set(at[0] - facing * 0.1, at[1], at[2]);
  parent.add(boss);
  return e;
}

/** Vertical exhaust stack with curved rain cap. */
export function exhaust(mg, at, h, mats, r = 0.05) {
  const [x, y, z] = at;
  mg.add(new THREE.CylinderGeometry(r, r, h, 14, Math.max(1, Math.ceil(h / 0.03))), mats.dark, { at: [x, y + h / 2, z] });
  mg.add(new THREE.CylinderGeometry(r * 1.15, r * 1.15, h * 0.25, 14), mats.steel, { at: [x, y + h * 0.35, z] }); // heat shield clamped on the stack
  mg.pipe([[x, y + h, z], [x, y + h + r * 1.4, z], [x - r * 1.6, y + h + r * 2.4, z]], r * 0.95, mats.dark, 12, 12);
}

/** Handrail through points (yellow/black safety style uses mats.stripeA). */
export function handrail(mg, points, mat, r = 0.022) {
  mg.pipe(points, r, mat, Math.max(8, points.length * 6), 8);
  for (const p of [points[0], points[points.length - 1]]) mg.add(new THREE.SphereGeometry(r * 1.6, 8, 6), mat, { at: p });
}

/** Ladder of rungs between two side rails (vertical-ish). */
export function ladder(mg, a, b, width, mats, rungs = 5) {
  const [ax, ay, az] = a;
  const [bx, by, bz] = b;
  for (const s of [1, -1]) mg.tube([ax, ay, az + (s * width) / 2], [bx, by, bz + (s * width) / 2], 0.02, mats.dark, 8);
  for (let k = 0; k <= rungs; k++) {
    const t = k / rungs;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    const z = az + (bz - az) * t;
    mg.tube([x, y, z - width / 2], [x, y, z + width / 2], 0.014, mats.steel, 6);
  }
}

/** Battery pack (electric trims): finned box with orange HV cable. */
export function batteryPack(mg, at, size, mats) {
  const [w, h, d] = size;
  mg.box(w, h, d, mats.blue, { at, r: 0.03 });
  for (let k = 0; k < 6; k++) mg.box(w * 0.9, 0.012, d + 0.02, mats.dark, { at: [at[0], at[1] - h / 2 + ((k + 1) * h) / 7, at[2]], r: 0.004 });
  mg.pipe([[at[0] + w / 2, at[1] + h * 0.3, at[2]], [at[0] + w / 2 + 0.08, at[1] + h * 0.3, at[2]], [at[0] + w / 2 + 0.1, at[1] + h * 0.6, at[2]]], 0.018, M.matte('#ff6a00', 0.5), 8, 8);
}

/** Diagonal yellow/black chevrons panel facing ±X. */
export function chevrons(mg, at, w, h, facing, mats) {
  const n = Math.max(3, Math.round(w / 0.12));
  mg.box(0.012, h, w, mats.stripeA, { at, r: 0.004 });
  for (let i = 0; i < n; i += 2) {
    mg.box(0.014, h * 0.32, w / n, mats.stripeB, { at: [at[0] + facing * 0.004, at[1], at[2] - w / 2 + (i + 0.5) * (w / n)], rot: [0.7, 0, 0], r: 0.003 });
  }
}

/** Rotating-beacon look (quick double flash) for the 'beacon' lamp group. */
export function beaconClip(name = 'beacon', group = 'beacon') {
  const P = 0.8;
  const t = [0, 0.1, 0.2, 0.3, 0.4, 0.8];
  return clip(name, P, [
    new THREE.NumberKeyframeTrack(`${group}.material.emissiveIntensity`, t, [LAMP_ON.amber * 1.4, 0.2, LAMP_ON.amber * 1.4, 0.2, 0.2, 0.2], THREE.InterpolateDiscrete),
    new THREE.NumberKeyframeTrack(`${group}_glow.material.opacity`, t, [1, 0, 1, 0, 0, 0], THREE.InterpolateDiscrete),
  ]);
}

/** Shape in the XZ plane (points [x, z]) extruded upward by `height` from y = 0. */
export function plateXZ(points, height, { bevel = 0.04 } = {}) {
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(1e-3, height - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 16 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  g.computeVertexNormals();
  return g;
}

/** Side-profile outline (points [x, y]) extruded across Z (centred), with bevel. */
export function profile(points, width, bevel = 0.03) {
  return extrudeOutline(points, width, { bevel, segments: 2 });
}

/**
 * Plates along a side-view polyline (points [x, y]), each `t` thick and `w` wide (across Z),
 * offset by t/2 to the left of the travel direction when `side` = 1 (right when -1).
 * Used to build hollow tubs: floors, front walls, bucket backs.
 * vee: tilt angle for a V-shaped cross-section (two half-width plates).
 */
export function plateStrip(mg, mat, pts, w, t, { side = 1, vee = 0, z = 0 } = {}) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 1e-4) continue;
    const a = Math.atan2(y1 - y0, x1 - x0);
    const nx = -Math.sin(a) * side * (t / 2);
    const ny = Math.cos(a) * side * (t / 2);
    const cx = (x0 + x1) / 2 + nx;
    const cy = (y0 + y1) / 2 + ny;
    const L = len + t * 0.9;
    if (!vee) mg.add(new THREE.BoxGeometry(L, t, w), mat, { at: [cx, cy, z], rot: [0, 0, a] });
    else for (const s of [1, -1]) {
      const g = new THREE.BoxGeometry(L, t, w / 2 + t);
      g.translate(0, 0, s * (w / 4));
      g.rotateX(-s * vee);
      g.rotateZ(a);
      g.translate(cx, cy, z);
      mg.add(g, mat);
    }
  }
}

/**
 * Hollow tub: side walls (closed side outline, thin) + floor/front plates along polylines.
 * outline: closed side-view outline; strips: [[pts, side]] polylines that become plates.
 */
export function hollowTub(mg, mat, { outline, strips, w, t = 0.06, vee = 0 }) {
  for (const s of [1, -1]) mg.add(extrudeOutline(outline, t, { bevel: Math.min(0.015, t * 0.3), segments: 1 }), mat, { at: [0, 0, s * (w / 2 - t / 2)] });
  for (const [pts, side, v] of strips) plateStrip(mg, mat, pts, w - 0.01, t, { side: side ?? 1, vee: v ? vee : 0 });
}

/**
 * Hollow scoop bucket: thin side plates + a curved back/floor plate, open mouth.
 * curve: points from the top of the back down around to the cutting edge (side view).
 */
export function scoop(mg, mat, curve, width, t, { wear, teeth = 0, toothMat, side = -1 } = {}) {
  const outline = [...curve, curve[0]];
  for (const s of [1, -1]) mg.add(extrudeOutline(outline.slice(0, -1), t, { bevel: Math.min(0.012, t * 0.3), segments: 1 }), mat, { at: [0, 0, s * (width / 2 - t / 2)] });
  plateStrip(mg, mat, curve, width - 0.01, t, { side });
  const [ex, ey] = curve[curve.length - 1];
  const [px, py] = curve[curve.length - 2];
  const a = Math.atan2(ey - py, ex - px);
  if (wear) mg.add(new THREE.BoxGeometry(t * 2.2, t * 1.2, width + 0.02), wear, { at: [ex, ey, 0], rot: [0, 0, a] });
  for (let i = 0; i < teeth; i++) {
    const zz = -width / 2 + 0.1 + (i * (width - 0.2)) / Math.max(1, teeth - 1);
    const g = new THREE.ConeGeometry(t * 0.9, t * 3.2, 4).rotateZ(-Math.PI / 2).scale(1, 0.6, 1);
    g.rotateZ(a);
    mg.add(g, toothMat ?? wear ?? mat, { at: [ex + Math.cos(a) * t * 1.4, ey + Math.sin(a) * t * 1.4, zz] });
  }
}

/** Engine idle: a fast, tiny shake of the given bodies (cab, engine hood…). */
export function idleClip(nodes, name = 'idle') {
  const P = 0.5;
  const N = 12;
  const tracks = [];
  for (const n of nodes) {
    const t = [];
    const pv = [];
    const qv = [];
    const base = n.quaternion.clone();
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      t.push(u * P);
      const k = Math.sin(u * Math.PI * 2 * 6);
      pv.push(n.position.x, n.position.y + k * 0.004, n.position.z);
      const q = base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.sin(u * Math.PI * 2 * 3) * 0.004));
      qv.push(q.x, q.y, q.z, q.w);
    }
    tracks.push(new THREE.VectorKeyframeTrack(`${n.name}.position`, t, pv), new THREE.QuaternionKeyframeTrack(`${n.name}.quaternion`, t, qv));
  }
  return clip(name, P, tracks);
}

/** Suspension bounce tracks (position.y) for a drive clip of length `period`. */
export function bounceTracks(nodes, period, amp = 0.012) {
  const N = 16;
  return nodes.map((n, j) => {
    const t = [];
    const v = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      t.push(u * period);
      v.push(n.position.x, n.position.y + Math.sin(u * Math.PI * 2 * 2 + j) * amp, n.position.z);
    }
    return new THREE.VectorKeyframeTrack(`${n.name}.position`, t, v);
  });
}

/** Add idle + drive bounce + doors to a set of clips. bodies: nodes that bounce/shake; doors: [{ node, sign }]. */
export function lifeClips(anims, bodies, doors = []) {
  const live = bodies.filter(Boolean);
  if (live.length) {
    anims.push(idleClip(live));
    for (const name of ['drive', 'reverse']) {
      const c = anims.find((a) => a.name === name);
      if (c) c.tracks.push(...bounceTracks(live, c.duration));
    }
  }
  if (doors.length) {
    const P = 4;
    anims.push(clip('doors', P, doors.map(({ node, angle }) => {
      const base = node.quaternion.clone();
      const t = [0, 1, 3, 4];
      const v = [];
      for (const a of [0, 1, 1, 0]) {
        const q = base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a * angle));
        v.push(q.x, q.y, q.z, q.w);
      }
      return new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, t, v);
    })));
  }
}
