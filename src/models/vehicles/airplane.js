import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, lathe, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { spinTrack, rotateTrack, numberTrack, clip, pingPong } from '../../core/animation.js';
import { navLights, textMaterial, decal, sculpt, smoothShape } from './misc-kit.js';
const sculptBlade = (hh) => sculpt(smoothShape([[0.06, 0], [-0.02, hh], [-0.05, hh], [-0.06, 0]]), 0.02, { bevel: 0.006 });
import { tubeLoft, wingGeometry, bladeGeometry, glassMaterial, interiorMaterial, lerp, emblemOn, finPoint } from './helicopter.js';

/*
 * Airplanes: smooth fuselage loft, NACA-profile wings with hinged flaps,
 * nacelles with spinning fans/propellers, retractable gear.
 * Front = +X, right wing = +Z, ground at y = 0.
 */

const clamp01 = (t) => THREE.MathUtils.clamp(t, 0, 1);

export function fuselageSection(p) {
  const h = p.L / 2;
  return (x) => {
    let a = p.R * (p.wide ?? 1);
    let bt = p.R * (p.tall ?? 1);
    let bb = p.R * (p.bottom ?? 1);
    let cy = p.cy;
    if (x > h - p.noseLen) {
      const t = clamp01((x - (h - p.noseLen)) / p.noseLen);
      const f = (1 - t ** p.noseP) ** (1 / p.noseP);
      a *= f;
      bt *= f ** (p.noseTop ?? 1);
      bb *= f;
      cy -= (p.droop ?? 0.15) * p.R * t * t;
    }
    if (x < -h + p.tailLen) {
      const t = clamp01((-h + p.tailLen - x) / p.tailLen);
      a *= lerp(1, p.tailR, t ** 1.1);
      bt *= lerp(1, p.tailR * 1.3, t ** 1.2);
      bb *= lerp(1, p.tailR * 0.6, t ** 0.75);
      cy += p.tailUp * t ** 1.5;
      const e = p.R * p.tailR;
      if (x < -h + e) {
        const k = Math.sqrt(Math.max(0, 1 - ((-h + e - x) / e) ** 2));
        a *= k; bt *= k; bb *= k;
      }
    }
    return { cy, a, bt, bb, n: p.n ?? 2, nb: p.nb ?? p.n ?? 2 };
  };
}

/** Pivot group whose local +Z runs along the hinge line from p0 to p1; geometry is re-expressed in pivot space. */
function hinged(name, geo, p0, p1, mat, parent) {
  const pivot = group(name, { parent });
  pivot.position.copy(p0);
  pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), p1.clone().sub(p0).normalize());
  pivot.updateMatrix();
  const g = geo.clone().applyMatrix4(pivot.matrix.clone().invert());
  mesh(g, mat, { parent: pivot });
  return pivot;
}

/**
 * Wing with fixed main box (0 → flapLine chord) + trailing edge pieces.
 * Returns { group, flaps: [pivot,…] }. Placed with root at `at`, side ±1.
 */
let WING_TIPS = [];
export function buildWing(parent, at, side, w, paint, { flaps = true, flapLine = 0.74, winglet = false, flapSpan = [0.12, 0.62], ailSpan = [0.66, 0.94] } = {}) {
  const g = group(null, { parent, at });
  const base = { span: w.span, rootChord: w.root, tipChord: w.tip, sweep: w.sweep, dihedral: w.dihedral ?? 0, thickness: w.thick ?? 0.12, side, segs: 14 };
  const out = { group: g, flaps: [] };
  // wingtip point (parent space) for nav lights / strobes
  WING_TIPS.push({ side, root: at, w, at: [at[0] - w.sweep + w.tip * 0.1, at[1] + (w.dihedral ?? 0) * w.span, side * w.span], chord: w.tip, thick: (w.thick ?? 0.12) * w.tip });
  if (!flaps) {
    mesh(wingGeometry(base), paint, { parent: g });
  } else {
    mesh(wingGeometry({ ...base, to: flapLine }), paint, { parent: g });
    const te = (s0, s1) => wingGeometry({ ...base, from: flapLine + 0.005, to: 1, spanFrom: s0, spanTo: s1, segs: 6 });
    const hingeAt = (t) => {
      const chord = lerp(w.root, w.tip, t);
      const le = -w.sweep * t;
      return new THREE.Vector3(le + chord * 0.25 - (flapLine + 0.005) * chord, (w.dihedral ?? 0) * w.span * t, side * w.span * t);
    };
    // fixed TE fillers
    for (const [s0, s1] of [[0, flapSpan[0]], [flapSpan[1], ailSpan[0]], [ailSpan[1], 1]]) mesh(te(s0, s1), paint, { parent: g });
    const flap = hinged(`flap_${side > 0 ? 'R' : 'L'}`, te(flapSpan[0], flapSpan[1]), hingeAt(flapSpan[0]), hingeAt(flapSpan[1]), paint, g);
    out.flaps.push({ pivot: flap, side });
    hinged(`aileron_${side > 0 ? 'R' : 'L'}`, te(ailSpan[0], ailSpan[1]), hingeAt(ailSpan[0]), hingeAt(ailSpan[1]), paint, g);
  }
  if (winglet) {
    const tipChord = w.tip;
    const wl = wingGeometry({ span: w.span * 0.11, rootChord: tipChord * 0.95, tipChord: tipChord * 0.35, sweep: tipChord * 0.7, thickness: 0.1, segs: 5 });
    wl.rotateX(-Math.PI / 2); // span → +Y
    const tip = group(null, { parent: g, at: [-w.sweep, (w.dihedral ?? 0) * w.span, side * w.span * 0.995], rot: [side * 0.25, 0, 0] });
    mesh(wl, paint, { parent: tip });
  }
  return out;
}

export function vFin(parent, at, w, mat, emblem = 0) {
  const geo = wingGeometry({ span: w.span, rootChord: w.root, tipChord: w.tip, sweep: w.sweep, thickness: w.thick ?? 0.11, segs: 8 });
  geo.rotateX(-Math.PI / 2);
  const m = mesh(geo, mat, { parent, at });
  if (emblem) for (const sd of [1, -1]) emblemOn(parent, finPoint(at, w, 0.5, 0.38, sd), emblem, 'emblem_tail');
  return m;
}
export const noseEmblems = (parent, loft, x, th, size) => { for (const t of [th, Math.PI - th]) emblemOn(parent, loft.at(x, t), size, 'emblem_nose'); };

function tyre(r, w) {
  const g = lathe([[r * 0.55, -w / 2], [r * 0.86, -w / 2], [r * 0.98, -w * 0.32], [r, 0], [r * 0.98, w * 0.32], [r * 0.86, w / 2], [r * 0.55, w / 2]], 32);
  g.rotateX(Math.PI / 2);
  return g;
}

/** Landing gear leg: pivot at the top, strut down to `len`, wheels along Z. */
export function gearLeg(name, parent, at, { len, r, w = r * 0.6, wheels = 1, bogie = false, strutR = 0.06 }) {
  const pivot = group(name, { parent, at });
  const metal = M.metal('#c7c9cc', 0.3);
  mesh(new THREE.CylinderGeometry(strutR, strutR * 0.85, len, 14), metal, { parent: pivot, at: [0, -len / 2, 0] });
  mesh(new THREE.CylinderGeometry(strutR * 1.35, strutR * 1.35, len * 0.35, 14), M.metal('#55585c', 0.4), { parent: pivot, at: [0, -len * 0.2, 0] });
  const rows = bogie ? [-r * 1.15, r * 1.15] : [0];
  const cols = wheels === 1 ? [0] : [-(w * 0.55 + strutR), w * 0.55 + strutR];
  if (bogie) mesh(roundedBox(r * 2.6, strutR * 1.4, strutR * 1.4, strutR * 0.5), metal, { parent: pivot, at: [0, -len, 0] });
  const tg = tyre(r, w);
  for (const x of rows) for (const z of cols) {
    mesh(tg, M.rubber(), { parent: pivot, at: [x, -len, z] });
    mesh(new THREE.CylinderGeometry(r * 0.56, r * 0.56, w * 0.9, 20).rotateX(Math.PI / 2), M.metal('#9ea2a6', 0.35), { parent: pivot, at: [x, -len, z] });
  }
  if (wheels > 1) mesh(new THREE.CylinderGeometry(strutR * 0.7, strutR * 0.7, (w * 0.55 + strutR) * 2, 10).rotateX(Math.PI / 2), metal, { parent: pivot, at: [0, -len, 0] });
  return pivot;
}

/** Turbofan nacelle along X (front +X) with spinning fan. Returns { group, fan }. */
export function nacelle(parent, name, at, { R, len, paint }) {
  const g = group(null, { parent, at });
  const prof = [
    [R * 0.86, len * 0.5], [R * 0.97, len * 0.47], [R, len * 0.38], [R * 0.98, 0], [R * 0.86, -len * 0.36], [R * 0.66, -len * 0.5],
  ];
  const shell = lathe(prof.slice().reverse(), 40);
  shell.rotateZ(-Math.PI / 2);
  mesh(shell, paint, { parent: g });
  const inner = lathe([[R * 0.84, len * 0.5], [R * 0.82, len * 0.2], [R * 0.6, -len * 0.5]], 40);
  inner.rotateZ(-Math.PI / 2);
  mesh(inner, new THREE.MeshStandardMaterial({ color: '#1b1c1e', roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide }), { parent: g });
  // bypass nozzle ring at the back
  mesh(new THREE.TorusGeometry(R * 0.68, R * 0.04, 8, 36).rotateY(Math.PI / 2), M.metal('#8d9196', 0.3), { parent: g, at: [-len * 0.5, 0, 0] });
  // inlet lip
  mesh(new THREE.TorusGeometry(R * 0.91, R * 0.06, 10, 40).rotateY(Math.PI / 2), M.metal('#cfd2d6', 0.2), { parent: g, at: [len * 0.49, 0, 0] });
  const fan = group(name, { parent: g, at: [len * 0.32, 0, 0] });
  const spinner = lathe([[0.001, R * 0.38], [R * 0.12, R * 0.3], [R * 0.24, R * 0.1], [R * 0.28, -R * 0.05]], 24);
  spinner.rotateZ(-Math.PI / 2);
  mesh(spinner, M.metal('#2a2b2e', 0.35), { parent: fan });
  const bladeMat = M.metal('#8d9196', 0.3);
  const blade = roundedBox(R * 0.06, R * 0.6, R * 0.18, R * 0.02);
  blade.translate(0, R * 0.53, 0);
  const n = 18;
  for (let i = 0; i < n; i++) mesh(blade, bladeMat, { parent: fan, rot: [(i / n) * Math.PI * 2, 0, 0.5] }).rotation.order = 'XYZ';
  // exhaust cone
  const cone = lathe([[R * 0.5, 0], [R * 0.32, -len * 0.25], [0.001, -len * 0.42]], 24);
  cone.rotateZ(-Math.PI / 2);
  mesh(cone, M.metal('#6b6e72', 0.4), { parent: g, at: [-len * 0.45, 0, 0] });
  return { group: g, fan };
}

/** Propeller (spinner + blades) spinning about X. */
export function propeller(parent, name, at, { blades = 2, radius = 0.95, chord = 0.16, spinnerR = 0.16 }) {
  const prop = group(name, { parent, at });
  const sp = lathe([[0.001, spinnerR * 2.2], [spinnerR * 0.55, spinnerR * 1.7], [spinnerR * 0.95, spinnerR * 0.7], [spinnerR, 0]], 24);
  sp.rotateZ(-Math.PI / 2);
  mesh(sp, M.paint('#d8d9db', { metallic: 0.5 }), { parent: prop });
  const bg = bladeGeometry(radius - spinnerR, chord, chord * 0.55, 0.14);
  bg.rotateZ(Math.PI / 2); // span +X → +Y
  bg.rotateY(Math.PI / 2); // chord into the YZ disc plane
  for (let i = 0; i < blades; i++) {
    const arm = group(null, { parent: prop, rot: [(i / blades) * Math.PI * 2, 0, 0] });
    mesh(bg, M.metal('#1e1f21', 0.5), { parent: arm, at: [spinnerR * 0.6, spinnerR * 0.6, 0], rot: [0, 0.35, 0] });
  }
  return prop;
}

/** Row of window decals on the fuselage (instanced, oriented to the surface). */
export function windowRow(parent, loft, xs, theta, { w, h, mat }) {
  // flat rounded-rect panes lifted off the skin (no intersecting boxes → no glitchy shapes)
  const r = Math.min(w, h) * 0.45;
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 + r, -h / 2);
  sh.lineTo(w / 2 - r, -h / 2);
  sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  sh.lineTo(w / 2, h / 2 - r);
  sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  sh.lineTo(-w / 2 + r, h / 2);
  sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  sh.lineTo(-w / 2, -h / 2 + r);
  sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ShapeGeometry(sh, 6);
  const paneMat = mat.clone();
  Object.assign(paneMat, { polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const im = new THREE.InstancedMesh(geo, paneMat, xs.length * 2);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3();
  let i = 0;
  for (const x of xs) {
    for (const th of [theta, Math.PI - theta]) {
      const { point, normal } = loft.at(x, th);
      const z = normal.clone();
      const xAx = new THREE.Vector3(1, 0, 0).sub(z.clone().multiplyScalar(z.x)).normalize();
      up.crossVectors(z, xAx);
      m4.makeBasis(xAx, up, z);
      q.setFromRotationMatrix(m4);
      m4.compose(point.clone().addScaledVector(normal, 0.006), q, new THREE.Vector3(1, 1, 1));
      im.setMatrixAt(i++, m4);
    }
  }
  im.name = 'windows';
  im.userData.noShadow = true;
  parent.add(im);
  return im;
}

/** Airliner cockpit: 4 slanted windscreen panes + 2 side windows on the nose, plus a dark radome tip line. */
export function cockpitPanes(parent, loft, xFront, R, mat) {
  const pane = (pts) => new THREE.ShapeGeometry(new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b))));
  const pm = mat.clone();
  Object.assign(pm, { polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const s = R * 0.22;
  const specs = [
    // [x offset, theta, shape]
    [0, Math.PI / 2 - 0.22, pane([[-s * 0.9, -s * 0.45], [s * 0.7, -s * 0.5], [s * 0.6, s * 0.45], [-s * 0.8, s * 0.4]])],
    [-s * 1.6, Math.PI / 2 - 0.62, pane([[-s * 0.8, -s * 0.42], [s * 0.8, -s * 0.45], [s * 0.6, s * 0.4], [-s * 0.6, s * 0.35]])],
    [-s * 3.0, Math.PI / 2 - 0.9, pane([[-s * 0.55, -s * 0.38], [s * 0.6, -s * 0.38], [s * 0.45, s * 0.32], [-s * 0.45, s * 0.28]])],
  ];
  const m4 = new THREE.Matrix4();
  const up = new THREE.Vector3();
  for (const [dx, th0, geo] of specs) for (const th of [th0, Math.PI - th0]) {
    const { point, normal } = loft.at(xFront + dx, th);
    const z = normal.clone();
    const xAx = new THREE.Vector3(1, 0, 0).sub(z.clone().multiplyScalar(z.x)).normalize();
    up.crossVectors(z, xAx);
    m4.makeBasis(th > Math.PI / 2 ? xAx : xAx, up, z);
    const m = new THREE.Mesh(geo, pm);
    m.quaternion.setFromRotationMatrix(m4);
    m.position.copy(point).addScaledVector(normal, 0.006);
    m.name = 'cockpit_window';
    m.userData.noShadow = true;
    parent.add(m);
  }
}

/* ------------------------------------------------------------------ */

import { AIR_EXTRA_VARIANTS, buildExtra } from './air-extra.js';

export const AIRPLANE_VARIANTS = {
  prop: { color: '#f6f6f4', accent: '#c62828' },
  jet: { color: '#f4f6f8', accent: '#1565c0' },
  'private-jet': { color: '#f2f2f0', accent: '#2b2b2b' },
  fighter: { color: '#8e959c', accent: '#5f666d' },
  cargo: { color: '#9aa1a8', accent: '#6f767d' },
  seaplane: { color: '#f2c200', accent: '#1d3f8a' },
  ...AIR_EXTRA_VARIANTS,
};

export function createAirplane(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(AIRPLANE_VARIANTS, o.variant, 'airplane');
  const v = AIRPLANE_VARIANTS[variant];
  const root = group(`airplane-${variant}`);
  const paint = variant === 'fighter' || variant === 'cargo'
    ? new THREE.MeshStandardMaterial({ name: 'paint', color: M.toColor(o.color ?? v.color), roughness: 0.6, metalness: 0.25 })
    : M.paint(o.color ?? v.color, { metallic: 0.35, roughness: 0.3 });
  const accent = M.paint(o.accentColor ?? v.accent, { metallic: 0.3 });
  const belly = M.paint('#c9ced3', { metallic: 0.4 });
  const glass = glassMaterial(0.45);
  const darkGlass = new THREE.MeshPhysicalMaterial({ name: 'window', color: '#121a22', roughness: 0.05, metalness: 0.5, clearcoat: 1 });
  const flapTracks = [];
  const gear = [];
  const spinTracks = [];
  const extra = [];
  let gearAngles = [];
  const build = { prop: buildProp, seaplane: buildProp, jet: buildJet, 'private-jet': buildBizjet, fighter: buildFighter, cargo: buildCargo }[variant] ?? (() => { const r = buildExtra(variant, { root, o, v, paint, accent, belly, glass, darkGlass, gear, spinTracks, flapTracks, extra, cur }); if (r?.gearAngles) gearAngles = r.gearAngles; });
  const cur = {};
  WING_TIPS = [];
  build();
  if (cur.loft && ['jet', 'private-jet', 'cargo', 'narrowbody', 'widebody', 'jumbo', 'regional-jet', 'turboprop', 'military-transport', 'tanker', 'awacs', 'amphibian', 'freighter', 'water-bomber', 'supersonic'].includes(variant)) {
    const sec = cur.loft.section(0);
    const Rf = sec.a ?? 1;
    cockpitPanes(root, cur.loft, cur.h - Rf * (variant === 'supersonic' ? 5.6 : 1.25), Rf, darkGlass);
  }
  {
    // navigation lights on the wingtips (red left / green right), white tail light,
    // red beacons top + belly, white strobes on the tips
    const tips = WING_TIPS.filter((t) => Math.abs(t.at[2]) > 2);
    const L = tips.find((t) => t.side < 0);
    const Rt = tips.find((t) => t.side > 0);
    const sz = Math.max(0.05, Math.min(0.14, (cur.h ?? 4) * 0.012));
    const spec = { size: sz };
    if (L && Rt) {
      spec.red = [[[L.at[0], L.at[1], L.at[2] - sz * 0.25], [0.35, 0, -1]]];
      spec.green = [[[Rt.at[0], Rt.at[1], Rt.at[2] + sz * 0.25], [0.35, 0, 1]]];
      spec.strobe = [[[L.at[0] - L.chord * 0.5, L.at[1], L.at[2] - sz * 0.25], [0, 0, -1]], [[Rt.at[0] - Rt.chord * 0.5, Rt.at[1], Rt.at[2] + sz * 0.25], [0, 0, 1]]];
    }
    if (cur.loft) {
      const top = cur.loft.at(-cur.h * 0.1, Math.PI / 2);
      const bot = cur.loft.at(-cur.h * 0.05, Math.PI * 1.5);
      spec.beacon = [[top.point.toArray(), top.normal.toArray()], [bot.point.toArray(), bot.normal.toArray()]];
      const tail = cur.loft.at(-cur.h + 0.06, Math.PI / 2);
      spec.white = [[[tail.point.x - 0.02, tail.point.y, 0], [-1, 0, 0]]];
      const nose = cur.loft.at(cur.h * 0.55, Math.PI * 1.5);
      spec.landing = [[nose.point.toArray(), [0.6, -0.8, 0]]];
    }
    var navSet = navLights(root, spec);
    // ---------------- trims: add-on equipment ----------------
    const trim = o.trim;
    const pt = (t, f) => {
      // point on the wing lower surface at span fraction f
      const w = t.w;
      const chord = lerp(w.root, w.tip, f);
      const le = t.root[0] - w.sweep * f + chord * 0.25;
      return { x: le - chord * 0.45, y: t.root[1] + (w.dihedral ?? 0) * w.span * f, z: t.side * w.span * f, chord, thick: (w.thick ?? 0.12) * chord };
    };
    const podMat = variant === 'fighter' ? M.paint('#7c838a', { metallic: 0.3 }) : paint;
    if (trim === 'tip-tanks' && L && Rt) for (const t of [L, Rt]) {
      const p = pt(t, 1);
      const r = Math.max(0.12, p.chord * 0.16);
      const tank = new THREE.CapsuleGeometry(r, p.chord * 1.1, 8, 20).rotateZ(Math.PI / 2);
      mesh(tank, variant === 'fighter' ? M.paint('#e0e0e0') : podMat, { parent: root, at: [p.x + p.chord * 0.25, p.y, p.z + t.side * r * 0.6], name: 'tip_tank' });
    }
    if (trim === 'pods' && L && Rt) for (const t of [L, Rt]) {
      const p = pt(t, 0.42);
      const r = Math.max(0.08, Math.min(Math.max(0.12, p.chord * 0.13, 0.12), (p.y - p.thick * 0.5 - 0.45) / 2, 0.9));
      const drop = p.thick * 0.5 + r + 0.12;
      mesh(new THREE.CapsuleGeometry(r, p.chord * 0.9, 8, 20).rotateZ(Math.PI / 2), variant === 'fighter' ? M.paint('#9aa0a6') : M.paint('#d6d9dc', { metallic: 0.3 }), { parent: root, at: [p.x + p.chord * 0.2, p.y - drop, p.z], name: 'pod' });
      mesh(roundedBox(p.chord * 0.5, drop - r + 0.04, 0.05, 0.02), podMat, { parent: root, at: [p.x + p.chord * 0.2, p.y - (drop - r) / 2 + 0.01, p.z], name: 'pylon' });
    }
    if (trim === 'satcom' && cur.loft) {
      const p = cur.loft.at(-cur.h * 0.15, Math.PI / 2);
      mesh(cushion(cur.h * 0.35, 0.18 + cur.h * 0.02, 0.4 + cur.h * 0.04, { radius: 0.1, bulge: 0.2 }), paint, { parent: root, at: [p.point.x, p.point.y + 0.04 + cur.h * 0.005, 0], name: 'satcom' });
      for (const k of v.open ? [-0.4, -0.55] : [0.25, 0.45]) { // open cockpits: antennas on the rear deck
        const q = cur.loft.at(cur.h * k, Math.PI / 2);
        mesh(sculptBlade(0.12 + cur.h * 0.01), M.metal('#2b2d30', 0.4), { parent: root, at: [q.point.x, q.point.y - 0.03, 0], name: 'antenna' }); // root sunk into the skin
      }
    }
    if (trim === 'belly-pod' && cur.loft) {
      const p = cur.loft.at(-cur.h * 0.05, Math.PI * 1.5);
      const r = Math.min(0.12 + cur.h * 0.03, Math.max(0.06, (p.point.y - 0.3) / 1.55));
      mesh(new THREE.CapsuleGeometry(r, cur.h * 0.5, 8, 20).rotateZ(Math.PI / 2), variant === 'fighter' ? M.paint('#9aa0a6') : podMat, { parent: root, at: [p.point.x, p.point.y - r * 0.55, 0], name: 'belly_pod' });
    }
    // every trim also gets its own bold livery: tail colour + cheat line + belly band
    const LIVERY = { 'tip-tanks': ['#c62828', '#fdd835'], pods: ['#1b5e20', '#66bb6a'], satcom: ['#0d47a1', '#42a5f5'], 'belly-pod': ['#4a148c', '#ab47bc'], retro: ['#e65100', '#3e2723'] };
    const liv = LIVERY[trim];
    if (liv && cur.loft && !o.accentColor) {
      accent.color.set(liv[0]);
      const line = M.paint(liv[1], { metallic: 0.2 });
      for (const sd of [1, -1]) for (const [th, rr] of [[0.12, 0.022], [-0.35, 0.05]]) {
        const pts = [];
        for (let i = 0; i <= 28; i++) {
          const x = -cur.h * 0.9 + (i / 28) * cur.h * 1.72;
          const p = cur.loft.at(x, sd > 0 ? th : Math.PI - th);
          pts.push(p.point.addScaledVector(p.normal, 0.006).toArray());
        }
        curveTube(pts, rr * Math.max(0.6, cur.h * 0.12), th > 0 ? line : accent, { parent: root, radialSegments: 6, name: 'livery_line' });
      }
    }
    if (trim === 'retro' && cur.loft) {
      // registration lettering
      const reg = textMaterial(variant === 'fighter' ? '07' : 'N-ORBX', { color: '#1b1b1b', font: 'bold 88px Arial' });
      for (const sd of [1, -1]) {
        const th = sd > 0 ? -0.08 : Math.PI + 0.08;
        const p = cur.loft.at(-cur.h * 0.35, th);
        decal(root, reg, { at: p.point.clone().addScaledVector(p.normal, 0.01).toArray(), normal: p.normal.toArray(), w: cur.h * 0.42, h: cur.h * 0.1, name: 'registration' });
      }
    }
  }

  /* ----------------------------- prop ----------------------------- */
  function buildProp() {
    const sea = variant === 'seaplane';
    const p = { L: 8.2, R: 0.62, cy: sea ? 2.0 : 1.32, noseLen: 1.6, noseP: 2.4, tailLen: 4.2, tailUp: 0.3, tailR: 0.22, n: 2.8, tall: 1.05, bottom: 0.85, droop: 0.05, noseTop: 0.6 };
    const h = p.L / 2;
    const section = fuselageSection(p);
    const region = (x, th, pt) => {
      const s = section(x);
      const yRel = (pt.y - s.cy) / (pt.y > s.cy ? s.bt : s.bb);
      if (x > h - 2.5 && x < h - 1.7 && yRel > 0.15) return 1; // windshield
      if (x > h - 4.1 && x < h - 2.55 && yRel > 0.05 && yRel < 0.82 && Math.abs(pt.z) > s.a * 0.4) return 1; // cabin windows
      if (x < h - 1.6 && yRel > -0.38 && yRel < -0.22) return 2; // stripe
      return 0;
    };
    const loft = tubeLoft({ x0: -h, x1: h, stations: 120, ring: 48, section, region, breaks: [h - 2.5, h - 1.7, h - 4.1, h - 2.55] });
    cur.loft = loft; cur.h = h;
    mesh(loft.geometry, [paint, glass, accent], { parent: root, name: 'fuselage' });
    mesh(loft.geometry, interiorMaterial(), { parent: root, name: 'cabin' });
    // seats
    for (const [x, z] of [[h - 3.0, 0.27], [h - 3.0, -0.27], [h - 3.85, 0.27], [h - 3.85, -0.27]]) {
      mesh(cushion(0.42, 0.1, 0.4, { radius: 0.04 }), M.fabric('#3b3a38'), { parent: root, at: [x, p.cy - 0.22, z] });
      mesh(cushion(0.1, 0.55, 0.4, { radius: 0.04 }), M.fabric('#3b3a38'), { parent: root, at: [x - 0.24, p.cy + 0.05, z], rot: [0, 0, 0.15] });
    }
    mesh(roundedBox(0.25, 0.22, 0.95, 0.05), M.plastic('#1a1a1a'), { parent: root, at: [h - 2.35, p.cy + 0.12, 0] });
    // high wing on top
    const wy = p.cy + p.R * 1.02;
    const wing = { span: 5.3, root: 1.55, tip: 1.15, sweep: 0.05, dihedral: 0.03, thick: 0.14 };
    for (const sd of [1, -1]) {
      const w = buildWing(root, [h - 2.65, wy, 0], sd, wing, paint, { flapSpan: [0.1, 0.55], ailSpan: [0.6, 0.94] });
      for (const f of w.flaps) flapTracks.push(rotateTrack(f.pivot, 'z', 6, (t) => f.side * pingPong(t) * 0.5));
      // strut from lower fuselage to wing
      curveTube([[h - 2.75, p.cy - 0.35, sd * 0.55], [h - 2.85, wy - 0.06, sd * 2.4]], 0.035, paint, { parent: root });
    }
    // tail
    vFin(root, [-h + 0.75, p.cy + p.tailUp + 0.05, 0], { span: 1.35, root: 1.45, tip: 0.75, sweep: 0.75 }, paint, 0.34);
    noseEmblems(root, loft, h - 1.15, 0.05, 0.2);
    for (const sd of [1, -1]) mesh(wingGeometry({ span: 1.55, rootChord: 1.05, tipChord: 0.65, sweep: 0.2, thickness: 0.1, side: sd, segs: 6 }), paint, { parent: root, at: [-h + 0.6, p.cy + p.tailUp - 0.05, 0] });
    // cowling details + propeller
    for (const sd of [1, -1]) mesh(roundedBox(0.3, 0.08, 0.02, 0.01), M.plastic('#111'), { parent: root, at: [h - 0.8, p.cy - 0.05, sd * p.R * 0.62] });
    curveTube([[h - 1.1, p.cy - 0.42, 0.18], [h - 1.5, p.cy - 0.52, 0.22]], 0.04, M.metal('#777', 0.4), { parent: root });
    const prop = propeller(root, 'propeller', [h - 0.02, p.cy - 0.06, 0], { blades: 2, radius: 0.95 });
    spinTracks.push(spinTrack(prop, 'x', 0.12, 1));
    if (sea) {
      // floats
      for (const sd of [1, -1]) {
        const fl = tubeLoft({
          x0: -2.6, x1: 2.9, stations: 50, ring: 24,
          section: (x) => {
            const t = clamp01((x - 1.6) / 1.3);
            const f = (1 - t ** 2) ** 0.5;
            const r = clamp01((-1.2 - x) / 1.4);
            return { cy: 0.32 + t * 0.12 + r * 0.12, a: 0.3 * Math.max(f, 0.001) * (1 - 0.5 * r), bt: 0.25 * Math.max(f, 0.001) * (1 - 0.4 * r), bb: 0.3 * Math.max(f, 0.001) * (1 - 0.7 * r), n: 2.2, nb: 1.6 };
          },
        });
        mesh(fl.geometry, M.paint('#e8e8e6', { metallic: 0.2 }), { parent: root, at: [h - 4.2, 0, sd * 1.15] });
        for (const x of [h - 2.6, h - 4.3]) curveTube([[x, 0.62, sd * 1.15], [x, p.cy - p.R * 0.6, sd * 0.42]], 0.035, M.metal('#bbb', 0.3), { parent: root });
      }
    } else {
      // fixed gear with wheel spats
      const nose = gearLeg('gear_nose', root, [h - 1.25, p.cy - p.R * 0.75, 0], { len: p.cy - p.R * 0.75 - 0.2, r: 0.2, w: 0.12, strutR: 0.03 });
      void nose;
      for (const sd of [1, -1]) {
        curveTube([[h - 3.0, p.cy - p.R * 0.8, sd * 0.4], [h - 3.05, 0.6, sd * 1.0], [h - 3.1, 0.26, sd * 1.25]], 0.04, M.metal('#bbb', 0.3), { parent: root });
        mesh(tyre(0.26, 0.15), M.rubber(), { parent: root, at: [h - 3.1, 0.26, sd * 1.28] });
        mesh(cushion(0.75, 0.32, 0.24, { radius: 0.1, bulge: 0.15 }), paint, { parent: root, at: [h - 3.1, 0.3, sd * 1.28] });
      }
    }
  }

  /* ----------------------------- jet ----------------------------- */
  function buildJet() {
    const p = { L: 38, R: 2.0, cy: 4.1, noseLen: 5.5, noseP: 2.0, tailLen: 10, tailUp: 1.25, tailR: 0.12, n: 2, droop: 0.25, noseTop: 0.85 };
    const h = p.L / 2;
    const section = fuselageSection(p);
    const region = (x, th, pt) => {
      const s = section(x);
      const yRel = (pt.y - s.cy) / (pt.y > s.cy ? s.bt : s.bb);
      if (x < h - 4 && x > -h + 3 && yRel > -0.12 && yRel < 0.0) return 2; // cheatline
      if (yRel < -0.55) return 3;
      return 0;
    };
    const loft = tubeLoft({ x0: -h, x1: h, stations: 170, ring: 56, section, region, breaks: [h - 3.6, h - 2.0] });
    cur.loft = loft; cur.h = h;
    mesh(loft.geometry, [paint, darkGlass, accent, belly], { parent: root, name: 'fuselage' });
    const xs = [];
    for (let x = -h + 9; x < h - 6.5; x += 0.52) if (Math.abs(x - 2.5) > 0.6) xs.push(x);
    windowRow(root, loft, xs, 0.34, { w: 0.22, h: 0.32, mat: darkGlass });
    // doors (outlined)
    for (const x of [h - 5.2, -h + 7.5]) for (const th of [0.15, Math.PI - 0.15]) {
      const { point, normal } = loft.at(x, th);
      const d = mesh(roundedBox(0.9, 1.85, 0.01, 0.18), new THREE.MeshStandardMaterial({ color: '#d4d8dc', roughness: 0.4, metalness: 0.3 }), { parent: root });
      d.position.copy(point).addScaledVector(normal, 0.003);
      d.lookAt(d.position.clone().add(normal));
    }
    // wings (low, swept) + engines
    const wing = { span: 17, root: 7.2, tip: 1.6, sweep: 7.5, dihedral: 0.085, thick: 0.13 };
    const wy = p.cy - 1.25;
    for (const sd of [1, -1]) {
      const w = buildWing(root, [1.8, wy, 0], sd, wing, paint, { winglet: true, flapSpan: [0.14, 0.55], ailSpan: [0.62, 0.92] });
      for (const f of w.flaps) flapTracks.push(rotateTrack(f.pivot, 'z', 6, (t) => f.side * pingPong(t) * 0.45));
      const ez = sd * 6.2;
      const st = 6.2 / wing.span;
      const chordAt = lerp(wing.root, wing.tip, st);
      const leAt = 1.8 - wing.sweep * st + chordAt * 0.25;
      const wingY = wy + wing.dihedral * 6.2 - 0.12;
      const nR = 1.15;
      const ex = leAt + 0.7;
      const yn = wingY - nR - 0.55;
      const { fan } = nacelle(root, `fan_${sd > 0 ? 'R' : 'L'}`, [ex, yn, ez], { R: nR, len: 4.6, paint });
      spinTracks.push(spinTrack(fan, 'x', 0.25, 1));
      const py = wingGeometry({ span: wingY - yn - nR * 0.7 + 0.35, rootChord: 3.4, tipChord: 2.6, sweep: 0.9, thickness: 0.16, segs: 3 });
      py.rotateX(-Math.PI / 2);
      mesh(py, paint, { parent: root, at: [ex - 0.2, yn + nR * 0.7, ez] });
    }
    // tail
    vFin(root, [-h + 5.5, p.cy + p.tailUp * 0.7, 0], { span: 7.2, root: 6.3, tip: 2.0, sweep: 5.6, thick: 0.11 }, accent, 1.7);
    noseEmblems(root, loft, h - 6.0, 0.05, 0.55);
    for (const sd of [1, -1]) mesh(wingGeometry({ span: 6.4, rootChord: 4.2, tipChord: 1.4, sweep: 4.2, dihedral: 0.12, thickness: 0.1, side: sd, segs: 8 }), paint, { parent: root, at: [-h + 4.0, p.cy + p.tailUp * 0.7, 0] });
    // gear
    gear.push(gearLeg('gear_nose', root, [h - 4.8, p.cy - p.R * 0.85, 0], { len: p.cy - p.R * 0.85 - 0.5, r: 0.5, w: 0.32, wheels: 2, strutR: 0.12 }));
    for (const sd of [1, -1]) gear.push(gearLeg(sd > 0 ? 'gear_R' : 'gear_L', root, [-0.4, wy - 0.15 + 0.085 * 4.6, sd * 4.6], { len: wy - 0.15 + 0.085 * 4.6 - 0.62, r: 0.62, w: 0.42, wheels: 2, bogie: true, strutR: 0.17 }));
    gearAngles = [['z', 1], ['x', 1], ['x', -1]];
    // beacon on top
  }

  /* ------------------------- private jet ------------------------- */
  function buildBizjet() {
    const p = { L: 16, R: 0.95, cy: 1.75, noseLen: 3.2, noseP: 1.9, tailLen: 5.2, tailUp: 0.55, tailR: 0.14, n: 2, droop: 0.2, noseTop: 0.8 };
    const h = p.L / 2;
    const section = fuselageSection(p);
    const region = (x, th, pt) => {
      const s = section(x);
      const yRel = (pt.y - s.cy) / (pt.y > s.cy ? s.bt : s.bb);
      if (x < h - 2.0 && yRel > -0.3 && yRel < -0.18) return 2;
      return 0;
    };
    const loft = tubeLoft({ x0: -h, x1: h, stations: 140, ring: 48, section, region, breaks: [h - 2.4, h - 1.25] });
    cur.loft = loft; cur.h = h;
    mesh(loft.geometry, [paint, darkGlass, accent], { parent: root, name: 'fuselage' });
    const xs = [];
    for (let i = 0; i < 6; i++) xs.push(h - 3.6 - i * 0.82);
    windowRow(root, loft, xs, 0.3, { w: 0.36, h: 0.26, mat: darkGlass });
    const wing = { span: 7.2, root: 3.0, tip: 0.95, sweep: 2.2, dihedral: 0.06, thick: 0.12 };
    const wy = p.cy - 0.7;
    for (const sd of [1, -1]) {
      const w = buildWing(root, [-0.2, wy, 0], sd, wing, paint, { winglet: true, flapSpan: [0.14, 0.6], ailSpan: [0.65, 0.92] });
      for (const f of w.flaps) flapTracks.push(rotateTrack(f.pivot, 'z', 6, (t) => f.side * pingPong(t) * 0.45));
      // rear-mounted engines
      const ez = sd * 1.55;
      const { fan } = nacelle(root, `fan_${sd > 0 ? 'R' : 'L'}`, [-h + 4.0, p.cy + 0.45, ez], { R: 0.48, len: 2.4, paint });
      spinTracks.push(spinTrack(fan, 'x', 0.2, 1));
      const py = wingGeometry({ span: 0.86, rootChord: 1.4, tipChord: 1.1, sweep: 0.2, thickness: 0.14, side: sd, segs: 3 });
      mesh(py, paint, { parent: root, at: [-h + 4.1, p.cy + 0.4, sd * 0.3] });
    }
    // T-tail
    const finTop = p.cy + p.tailUp + 2.35;
    vFin(root, [-h + 2.4, p.cy + p.tailUp * 0.5, 0], { span: 2.5, root: 2.6, tip: 1.3, sweep: 1.9, thick: 0.12 }, accent, 0.6);
    noseEmblems(root, loft, h - 2.9, 0.0, 0.3);
    for (const sd of [1, -1]) mesh(wingGeometry({ span: 2.5, rootChord: 1.35, tipChord: 0.65, sweep: 0.8, thickness: 0.1, side: sd, segs: 6 }), paint, { parent: root, at: [-h + 0.95, finTop - 0.2, 0] });
    gear.push(gearLeg('gear_nose', root, [h - 2.3, p.cy - p.R * 0.8, 0], { len: p.cy - p.R * 0.8 - 0.25, r: 0.25, w: 0.16, wheels: 2, strutR: 0.05 }));
    for (const sd of [1, -1]) gear.push(gearLeg(sd > 0 ? 'gear_R' : 'gear_L', root, [-0.6, wy + 0.1, sd * 1.9], { len: wy + 0.1 - 0.34, r: 0.34, w: 0.2, wheels: 1, strutR: 0.07 }));
    gearAngles = [['z', 1], ['x', 1], ['x', -1]];
  }

  /* ---------------------------- fighter ---------------------------- */
  function buildFighter() {
    const p = { L: 15.5, R: 0.95, cy: 1.75, noseLen: 4.6, noseP: 1.6, tailLen: 3.2, tailUp: 0.05, tailR: 0.7, n: 2.6, wide: 1.25, tall: 0.75, bottom: 0.8, droop: 0.1, noseTop: 1.1 };
    const h = p.L / 2;
    const section = fuselageSection(p);
    const loft = tubeLoft({ x0: -h, x1: h, stations: 130, ring: 48, section, region: (x, th, pt) => ((pt.y < section(x).cy - section(x).bb * 0.6) ? 1 : 0) });
    cur.loft = loft; cur.h = h;
    mesh(loft.geometry, [paint, M.paint('#6c737a', { metallic: 0.3 })], { parent: root, name: 'fuselage' });
    noseEmblems(root, loft, h - 2.6, 0.0, 0.28);
    // nose radome tip
    // canopy bubble with seat inside
    const cx = h - 4.6;
    const can = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    can.scale(1.9, 0.62, 0.5);
    mesh(can, glass, { parent: root, at: [cx, p.cy + p.R * 0.62, 0], name: 'canopy' });
    mesh(cushion(0.5, 0.1, 0.46, { radius: 0.04 }), M.fabric('#2a2a2a'), { parent: root, at: [cx - 0.2, p.cy + 0.6, 0] });
    mesh(cushion(0.12, 0.55, 0.42, { radius: 0.04 }), M.fabric('#2a2a2a'), { parent: root, at: [cx - 0.5, p.cy + 0.85, 0], rot: [0, 0, 0.3] });
    mesh(roundedBox(0.35, 0.18, 0.6, 0.05), M.plastic('#111'), { parent: root, at: [cx + 0.8, p.cy + 0.78, 0] });
    // intakes
    for (const sd of [1, -1]) {
      mesh(cushion(3.8, 0.72, 0.56, { radius: 0.2, bulge: 0.04 }), paint, { parent: root, at: [h - 7.6, p.cy - 0.2, sd * 1.08] });
      mesh(roundedBox(0.03, 0.56, 0.4, 0.1), M.plastic('#0a0a0a'), { parent: root, at: [h - 5.705, p.cy - 0.2, sd * 1.1] });
    }
    // delta wings + tails
    const wing = { span: 4.6, root: 5.6, tip: 1.1, sweep: 4.3, dihedral: -0.03, thick: 0.05 };
    for (const sd of [1, -1]) {
      const w = buildWing(root, [-0.8, p.cy - 0.3, 0], sd, wing, paint, { flapSpan: [0.25, 0.6], ailSpan: [0.62, 0.9] });
      for (const f of w.flaps) flapTracks.push(rotateTrack(f.pivot, 'z', 6, (t) => f.side * pingPong(t) * 0.35));
      mesh(wingGeometry({ span: 2.2, rootChord: 2.4, tipChord: 0.8, sweep: 1.6, thickness: 0.05, side: sd, segs: 5 }), paint, { parent: root, at: [-h + 1.2, p.cy - 0.2, 0] });
      // missile
      const ms = group(null, { parent: root, at: [-3.6, p.cy - 0.6, sd * 3.4] });
      mesh(new THREE.CapsuleGeometry(0.08, 2.4, 6, 12).rotateZ(Math.PI / 2), M.paint('#e5e5e5', { metallic: 0.3 }), { parent: ms });
      for (let k = 0; k < 4; k++) mesh(roundedBox(0.3, 0.004 + 0.18, 0.012, 0.005), M.paint('#cfcfcf'), { parent: ms, at: [-1.1, 0, 0], rot: [(k * Math.PI) / 2, 0, 0] });
      mesh(roundedBox(0.9, 0.16, 0.05, 0.02), paint, { parent: root, at: [-3.75, p.cy - 0.46, sd * 3.4] });
    }
    for (const sd of [1, -1]) {
      const fin = wingGeometry({ span: 2.5, rootChord: 2.6, tipChord: 0.9, sweep: 1.8, thickness: 0.06, segs: 6 });
      fin.rotateX(-Math.PI / 2);
      const fg = group(null, { parent: root, at: [-h + 1.6, p.cy + 0.45, sd * 0.75], rot: [-sd * 0.3, 0, 0] });
      mesh(fin, paint, { parent: fg });
      emblemOn(fg, finPoint([0, 0, 0], { span: 2.5, root: 2.6, tip: 0.9, sweep: 1.8, thick: 0.06 }, 0.45, 0.38, sd), 0.42, 'emblem_tail');
    }
    // nozzles + afterburner
    for (const sd of [1, -1]) {
      const noz = lathe([[0.5, 0], [0.46, -0.6], [0.4, -1.0]], 28);
      noz.rotateZ(-Math.PI / 2);
      mesh(noz, new THREE.MeshStandardMaterial({ color: '#3a3b3e', metalness: 0.9, roughness: 0.35, side: THREE.DoubleSide }), { parent: root, at: [-h + 0.25, p.cy - 0.05, sd * 0.55] });
      mesh(new THREE.CircleGeometry(0.38, 24).rotateY(-Math.PI / 2), M.emissive('#ff8a2a', 0.2), { parent: root, at: [-h - 0.15, p.cy - 0.05, sd * 0.55], name: sd > 0 ? 'burner_R' : 'burner_L' });
    }
    extra.push(clip('afterburner', 0.6, [
      numberTrack('burner_R.material.emissiveIntensity', 0.6, (t) => 3 + Math.sin(t * 40) * 1.2, 24),
      numberTrack('burner_L.material.emissiveIntensity', 0.6, (t) => 3 + Math.cos(t * 37) * 1.2, 24),
    ]));
    gear.push(gearLeg('gear_nose', root, [h - 4.2, p.cy - p.R * 0.7, 0], { len: p.cy - p.R * 0.7 - 0.24, r: 0.24, w: 0.16, strutR: 0.05 }));
    for (const sd of [1, -1]) gear.push(gearLeg(sd > 0 ? 'gear_R' : 'gear_L', root, [-1.6, p.cy - 0.55, sd * 1.25], { len: p.cy - 0.55 - 0.36, r: 0.36, w: 0.22, strutR: 0.07 }));
    gearAngles = [['z', 1], ['x', 1], ['x', -1]];
  }

  /* ----------------------------- cargo ----------------------------- */
  function buildCargo() {
    const p = { L: 30, R: 2.2, cy: 2.85, noseLen: 4.2, noseP: 2.1, tailLen: 9.5, tailUp: 2.1, tailR: 0.2, n: 2.5, droop: 0.2, noseTop: 0.8 };
    const h = p.L / 2;
    const section = fuselageSection(p);
    const region = (x, th, pt) => {
      const s = section(x);
      const yRel = (pt.y - s.cy) / (pt.y > s.cy ? s.bt : s.bb);
      if (yRel < -0.55) return 2;
      if (x < -h + 7 && x > -h + 1 && yRel < -0.3 && Math.abs(pt.z) < s.a * 0.85) return 3; // ramp outline
      return 0;
    };
    const loft = tubeLoft({ x0: -h, x1: h, stations: 150, ring: 56, section, region, breaks: [h - 3.0, h - 1.7, -h + 7, -h + 1] });
    cur.loft = loft; cur.h = h;
    mesh(loft.geometry, [paint, darkGlass, M.paint('#80878e', { metallic: 0.3 }), accent], { parent: root, name: 'fuselage' });
    const wy = p.cy + p.R * 0.95;
    const wing = { span: 19, root: 5.0, tip: 2.4, sweep: 0.9, dihedral: -0.02, thick: 0.15 };
    for (const sd of [1, -1]) {
      const w = buildWing(root, [0.8, wy, 0], sd, wing, paint, { flapSpan: [0.1, 0.55], ailSpan: [0.6, 0.92] });
      for (const f of w.flaps) flapTracks.push(rotateTrack(f.pivot, 'z', 6, (t) => f.side * pingPong(t) * 0.45));
      for (const [k, z] of [[0, 5.2], [1, 10.4]]) {
        const ez = sd * z;
        const ng = tubeLoft({
          x0: -3.2, x1: 2.4, stations: 30, ring: 24,
          section: (x) => {
            const t = clamp01((x - 1.4) / 1.0);
            const r = clamp01((-1.8 - x) / 1.4);
            const f = (1 - t ** 2) ** 0.5;
            return { cy: 0, a: 0.62 * Math.max(f, 0.3) * (1 - 0.6 * r), bt: 0.75 * Math.max(f, 0.3) * (1 - 0.6 * r), bb: 0.8 * Math.max(f, 0.3) * (1 - 0.6 * r), n: 2.3 };
          },
        });
        mesh(ng.geometry, paint, { parent: root, at: [1.6, wy - 0.25, ez] });
        const prop = propeller(root, `prop_${sd > 0 ? 'R' : 'L'}${k}`, [4.0, wy - 0.25, ez], { blades: 4, radius: 2.0, chord: 0.36, spinnerR: 0.3 });
        spinTracks.push(spinTrack(prop, 'x', 0.15, 1));
      }
      // gear sponson
      mesh(cushion(5.0, 1.0, 0.9, { radius: 0.4, bulge: 0.08 }), paint, { parent: root, at: [-0.5, 1.15, sd * 2.1] });
      for (const x of [-1.6, 0.6]) mesh(tyre(0.6, 0.4), M.rubber(), { parent: root, at: [x, 0.6, sd * 2.0] });
    }
    mesh(tyre(0.5, 0.32), M.rubber(), { parent: root, at: [h - 4.2, 0.5, 0] });
    mesh(new THREE.CylinderGeometry(0.1, 0.1, p.cy - p.R * 0.9 - 0.5, 10), M.metal('#bbb'), { parent: root, at: [h - 4.2, (p.cy - p.R * 0.9 + 0.5) / 2, 0] });
    // T-tail
    const finBase = p.cy + p.tailUp * 0.75;
    vFin(root, [-h + 4.6, finBase, 0], { span: 6.0, root: 6.2, tip: 3.2, sweep: 3.8, thick: 0.12 }, paint, 1.5);
    noseEmblems(root, loft, h - 4.0, 0.1, 0.6);
    for (const sd of [1, -1]) mesh(wingGeometry({ span: 6.4, rootChord: 3.4, tipChord: 1.8, sweep: 1.4, thickness: 0.1, side: sd, segs: 6 }), paint, { parent: root, at: [-h + 1.4, finBase + 5.7, 0] });
    // rear ramp: hinged at the front edge of the belly opening, closed along the upswept belly
    const hp = loft.at(-h + 7, -Math.PI / 2).point;
    const tp = loft.at(-h + 1.2, -Math.PI / 2).point;
    const rl = Math.hypot(hp.x - tp.x, tp.y - hp.y);
    const th = -Math.atan2(tp.y - hp.y, hp.x - tp.x);
    const ramp = group('ramp', { parent: root, at: [hp.x, hp.y + 0.02, 0] });
    const rampMat = M.paint('#80878e', { metallic: 0.3 });
    mesh(roundedBox(rl, 0.12, 3.2, 0.05), rampMat, { parent: ramp, at: [-rl / 2 * Math.cos(th), -rl / 2 * Math.sin(th), 0], rot: [0, 0, th] });
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.4, 14).rotateX(Math.PI / 2), rampMat, { parent: ramp, name: 'ramp_hinge' }); // hinge barrel
    for (const sd of [1, -1]) mesh(roundedBox(0.3, 0.3, 0.12, 0.03), rampMat, { parent: root, name: 'ramp_hinge_bracket', at: [hp.x + 0.05, hp.y + 0.1, sd * 1.65] }); // brackets on the belly frame
    ramp.visible = true;
    const openA = Math.asin(Math.min(0.95, (hp.y - 0.1) / rl)) - th; // lowered: tail edge on the ground
    extra.push(clip('ramp', 6, [rotateTrack(ramp, 'z', 6, (t) => Math.min(1, pingPong(t) * 1.4) * openA)]));
  }

  // ---------------- animations ----------------
  const animations = [];
  if (spinTracks.length) animations.push(clip(variant === 'prop' || variant === 'seaplane' || variant === 'cargo' ? 'propeller' : 'engines', spinTracks[0].times.at(-1), spinTracks));
  if (flapTracks.length) animations.push(clip('flaps', 6, flapTracks));
  if (gear.length) {
    const T = 3;
    const ang = (dir, up) => (t) => (up ? t : 1 - t) * dir * Math.PI * 0.5;
    const mk = (name, up) => clip(name, T, gear.map((g, i) => {
      const [axis, dir] = gearAngles[i];
      return rotateTrack(g, axis, T, (t) => ang(dir, up)(0.5 - 0.5 * Math.cos(Math.PI * t)));
    }));
    animations.push(mk('gearUp', true), mk('gearDown', false));
  }
  {
    const aR = root.getObjectByName('aileron_R');
    const aL = root.getObjectByName('aileron_L');
    if (aR && aL) animations.push(clip('ailerons', 3, [rotateTrack(aR, 'z', 3, (t) => Math.sin(t * Math.PI * 2) * 0.3, 24), rotateTrack(aL, 'z', 3, (t) => Math.sin(t * Math.PI * 2) * 0.3, 24)]));
  }
  animations.push(...extra, ...navSet.animations);
  finalize(root, { type: 'airplane', variant, options: o, animations });
  if (gear.length) {
    root.userData.premade.oneShot = ['gearUp', 'gearDown'];
    root.userData.premade.exclusive = [['gearUp', 'gearDown']];
  }
  return root;
}
