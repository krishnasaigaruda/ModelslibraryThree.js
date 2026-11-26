import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, tube, lathe, extrudeOutline, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { spinTrack, rotateTrack, moveTrack, clip } from '../../core/animation.js';
import { vehicleAnimations, addHeadlightSpots } from './wheel.js';
import { lampGroup } from '../../core/lamps.js';
import { sculpt, smoothShape, plateMaterial, textMaterial, decal, sirenClip, applyTrim } from './misc-kit.js';
import { brandEmblem } from '../../core/brand.js';

/*
 * Motorcycles. Front = +X, wheels roll about Z, centreline z = 0.
 * Left = -Z, right = +Z. The front end (fork, wheel, bars, headlight) lives in
 * a 'fork_steer' group tilted by the rake angle, so steering turns about the
 * real steering axis.
 */

export const MOTORCYCLE_VARIANTS = {
  sport:        { wb: 1.40, rF: 0.30, rR: 0.31, rake: 24, fork: 0.80, color: '#0d47a1', tyreW: [0.12, 0.19], frame: 'spar', head: 'fairing', bars: 'clip', tail: 'sport', exhaust: 'under', engine: 'inline', seatH: 0.83 },
  cruiser:      { wb: 1.66, rF: 0.33, rR: 0.32, rake: 32, fork: 0.86, color: '#1b1b1b', tyreW: [0.13, 0.19], wire: true, frame: 'loop', head: 'round', bars: 'cruiser', tail: 'fender', exhaust: 'twin', engine: 'vtwin', seatH: 0.7 },
  scooter:      { wb: 1.32, rF: 0.22, rR: 0.22, rake: 27, fork: 0.72, color: '#9ccfd8', tyreW: [0.1, 0.11], frame: 'step', head: 'scooter', bars: 'scooter', tail: 'scooter', exhaust: 'scooter', engine: 'scooter', seatH: 0.78 },
  dirt:         { wb: 1.48, rF: 0.36, rR: 0.34, rake: 27, fork: 0.98, color: '#ef6c00', tyreW: [0.09, 0.12], wire: true, knobby: true, frame: 'cradle', head: 'plate', bars: 'flat', tail: 'mx', exhaust: 'high', engine: 'single', seatH: 0.95 },
  touring:      { wb: 1.62, rF: 0.33, rR: 0.33, rake: 29, fork: 0.84, color: '#5d1a1a', tyreW: [0.13, 0.18], frame: 'spar', head: 'touring', bars: 'high', tail: 'touring', exhaust: 'twin-low', engine: 'inline', seatH: 0.78 },
  chopper:      { wb: 1.95, rF: 0.36, rR: 0.32, rake: 40, fork: 1.28, color: '#7b1fa2', tyreW: [0.09, 0.22], wire: true, frame: 'loop', head: 'round', bars: 'ape', tail: 'fender', exhaust: 'twin', engine: 'vtwin', seatH: 0.66 },
  naked:        { wb: 1.43, rF: 0.30, rR: 0.31, rake: 25, fork: 0.80, color: '#c62828', tyreW: [0.12, 0.19], frame: 'spar', head: 'round', bars: 'flat', tail: 'sport', exhaust: 'side', engine: 'inline', seatH: 0.82 },
  'cafe-racer': { wb: 1.45, rF: 0.33, rR: 0.33, rake: 26, fork: 0.82, color: '#1b5e20', tyreW: [0.11, 0.14], wire: true, frame: 'loop', head: 'round', bars: 'clip', tail: 'cafe', exhaust: 'side', engine: 'twin', seatH: 0.8 },
  adventure:    { wb: 1.55, rF: 0.37, rR: 0.34, rake: 27, fork: 0.95, color: '#eceff1', tyreW: [0.11, 0.16], wire: true, frame: 'spar', head: 'beak', bars: 'flat', tail: 'adv', exhaust: 'high', engine: 'twin', seatH: 0.88 },
  supermoto:    { wb: 1.46, rF: 0.30, rR: 0.30, rake: 26, fork: 0.96, color: '#fdd835', tyreW: [0.12, 0.16], frame: 'cradle', head: 'plate', bars: 'flat', tail: 'mx', exhaust: 'high', engine: 'single', seatH: 0.93 },
  electric:     { wb: 1.42, rF: 0.30, rR: 0.31, rake: 25, fork: 0.80, color: '#00acc1', tyreW: [0.12, 0.18], frame: 'spar', head: 'round', bars: 'flat', tail: 'sport', exhaust: 'none', engine: 'electric', seatH: 0.8 },
};

/** Trims change parts: luggage, screens, lights, wheels, guards. */
export const MOTORCYCLE_TRIMS = {
  police: { police: true, panniers: true, screen: 'tall', color: '#f5f5f5' },
  'touring-pack': { panniers: true, topBox: true, screen: 'tall', color: '#37474f' },
  race: { race: true, mirrors: false, screen: 'race', color: '#ffd600' },
  offroad: { knobby: true, guards: true, skid: true, wire: true, color: '#ff6f00' },
  classic: { wire: true, head: 'round', chromeTank: true, color: '#7b1f1f' },
  blackout: { blackout: true, color: '#141414', bars: 'flat' },
};

/** Sculpted blob: ellipsoid with front/back taper and a flattened underside. */
function blob(w, h, d, { taper = 0.3, flatBottom = 0.5, seg = 32 } = {}) {
  const g = new THREE.SphereGeometry(0.5, seg, Math.round(seg * 0.6));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    // taper > 0 narrows the rear (-X), taper < 0 narrows the front (+X)
    const k = taper >= 0 ? 1 - taper * (0.5 - x) : 1 + taper * (x + 0.5);
    y *= k;
    z *= k;
    if (y < -0.5 * flatBottom) y = -0.5 * flatBottom + (y + 0.5 * flatBottom) * 0.25;
    p.setXYZ(i, x * w, y * h, z * d);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * Curved mudguard shell around a wheel axle (local XY plane), covering world
 * angles a0..a1 (degrees, 0 = front, 90 = top). `tilt` compensates a parent rotation.
 */
function guard(r, width, a0, a1, tilt = 0) {
  const t0 = THREE.MathUtils.degToRad(a0) + Math.PI / 2 - tilt;
  const len = THREE.MathUtils.degToRad(a1 - a0);
  return new THREE.CylinderGeometry(r, r, width, 40, 1, true, t0, len).rotateX(Math.PI / 2);
}

/**
 * Smooth lofted solid along +X (tank, seats, tail cowls). stations: [x, yTop, yBottom, halfWidth, p?]
 * in increasing x, interpolated with Catmull-Rom; each cross-section is a superellipse of exponent p
 * (2 = ellipse, higher = squarer). Indexed + welded around the ring → smooth normals, no facets.
 * Flat end caps use their own vertices (crisp rim, e.g. for a tail-light face).
 * shape(x, y, z, t, v) may return [y, z] (t: 0..1 along the loft, v: 0..1 bottom→top) for knee recesses.
 * The geometry gets a .sample(x) → { yt, yb, w, p } helper for placing parts on the surface.
 */
function loft(stations, { rings = 40, around = 36, p = 2.6, shape } = {}) {
  const A = new THREE.CatmullRomCurve3(stations.map((s) => new THREE.Vector3(s[0], s[1], s[2])), false, 'catmullrom', 0.5);
  const B = new THREE.CatmullRomCurve3(stations.map((s) => new THREE.Vector3(s[3], s[4] ?? p, 0)), false, 'catmullrom', 0.5);
  const sp = (c, e) => Math.sign(c) * Math.pow(Math.abs(c), e);
  const pos = [];
  const uv = [];
  const idx = [];
  const prof = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const a = A.getPoint(t);
    const b = B.getPoint(t);
    const yt = Math.max(a.y, a.z + 2e-3);
    const yb = a.z;
    const w = Math.max(b.x, 2e-3);
    const e = 2 / b.y;
    prof.push({ x: a.x, yt, yb, w, p: b.y });
    const yc = (yt + yb) / 2;
    const h = (yt - yb) / 2;
    for (let j = 0; j < around; j++) {
      const th = (j / around) * Math.PI * 2;
      let y = yc + h * sp(Math.cos(th), e);
      let z = w * sp(Math.sin(th), e);
      if (shape) [y, z] = shape(a.x, y, z, t, (y - yb) / (yt - yb));
      pos.push(a.x, y, z);
      uv.push(t, j / around);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < around; j++) {
      const a = i * around + j;
      const b = i * around + ((j + 1) % around);
      const c = a + around;
      const d = b + around;
      idx.push(a, b, c, b, d, c);
    }
  }
  // flat caps with their own vertices
  for (const [i, sgn] of [[0, -1], [rings, 1]]) {
    const base = pos.length / 3;
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (let j = 0; j < around; j++) {
      const k = (i * around + j) * 3;
      pos.push(pos[k], pos[k + 1], pos[k + 2]);
      uv.push(i / rings, j / around);
      cx += pos[k];
      cy += pos[k + 1];
      cz += pos[k + 2];
    }
    pos.push(cx / around, cy / around, cz / around);
    uv.push(i / rings, 0.5);
    const c = base + around;
    for (let j = 0; j < around; j++) {
      const a = base + j;
      const b = base + ((j + 1) % around);
      if (sgn > 0) idx.push(c, a, b);
      else idx.push(c, b, a);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.sample = (x) => {
    let k = 0;
    while (k < prof.length - 2 && prof[k + 1].x < x) k++;
    const p0 = prof[k];
    const p1 = prof[k + 1];
    const f = Math.min(1, Math.max(0, (x - p0.x) / (p1.x - p0.x || 1)));
    const L = (n) => p0[n] + (p1[n] - p0[n]) * f;
    return { yt: L('yt'), yb: L('yb'), w: L('w'), p: L('p') };
  };
  return g;
}

/** Points on a loft's surface along x at z = ±frac·halfWidth (seams, trim lines). */
function surfaceLine(sample, x0, x1, frac, side, lift = 0.0015, n = 18) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const { yt, yb, w, p } = sample(x);
    const s = Math.pow(frac, p / 2);
    const c = Math.sqrt(Math.max(0, 1 - s * s));
    const y = (yt + yb) / 2 + ((yt - yb) / 2) * Math.pow(c, 2 / p);
    pts.push([x, y + lift, side * frac * w]);
  }
  return pts;
}

function motoWheel(name, { r, w, wire, knobby, discs = 1, mats, side = 1 }) {
  const spin = group(name);
  const prof = [];
  for (let i = 0; i <= 14; i++) {
    const a = -Math.PI / 2 + (i / 14) * Math.PI;
    prof.push([r - w * 0.5 + Math.cos(a) * w * 0.5, Math.sin(a) * w * 0.5]);
  }
  prof.unshift([r - w * 0.55, -w * 0.42]);
  prof.push([r - w * 0.55, w * 0.42]);
  mesh(lathe(prof, 56).rotateX(Math.PI / 2), mats.tyre, { parent: spin });
  if (knobby) {
    const knob = new THREE.InstancedMesh(roundedBox(0.035, 0.02, w * 0.4, 0.006, 1), mats.tyre, 72);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const zz = (i % 2 ? 1 : -1) * w * 0.2;
      m4.compose(new THREE.Vector3(Math.cos(a) * (r - 0.003), Math.sin(a) * (r - 0.003), zz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a), new THREE.Vector3(1, 1, 1));
      knob.setMatrixAt(i, m4);
    }
    knob.name = `${name}_knobs`;
    spin.add(knob);
  }
  const rimR = r - w * 0.55;
  mesh(new THREE.TorusGeometry(rimR, 0.012, 8, 56), mats.rim, { parent: spin, at: [0, 0, w * 0.18] });
  mesh(new THREE.TorusGeometry(rimR, 0.012, 8, 56), mats.rim, { parent: spin, at: [0, 0, -w * 0.18] });
  mesh(new THREE.CylinderGeometry(rimR - 0.004, rimR - 0.004, w * 0.36, 48, 1, true).rotateX(Math.PI / 2), mats.rimDark, { parent: spin });
  mesh(new THREE.CylinderGeometry(0.045, 0.045, w * 0.9, 20).rotateX(Math.PI / 2), mats.alu, { parent: spin });
  if (wire) {
    const n = 32;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const zs = i % 2 ? 1 : -1;
      tube([Math.cos(a + 0.25 * zs) * 0.04, Math.sin(a + 0.25 * zs) * 0.04, zs * 0.035], [Math.cos(a) * (rimR - 0.01), Math.sin(a) * (rimR - 0.01), zs * 0.01], 0.0025, mats.chrome, { parent: spin, radialSegments: 4 });
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const sp = new THREE.Shape();
      sp.moveTo(0.04, -0.018);
      sp.lineTo(rimR - 0.01, -0.01);
      sp.lineTo(rimR - 0.01, 0.01);
      sp.lineTo(0.04, 0.018);
      const g = extrudeOutline(sp, 0.022, { bevel: 0.006 });
      mesh(g, mats.rim, { parent: spin, rot: [0, 0, a] });
    }
  }
  // brake disc(s)
  for (let d = 0; d < discs; d++) {
    const dz = (d === 0 ? side : -side) * w * 0.32;
    mesh(new THREE.CylinderGeometry(rimR * 0.72, rimR * 0.72, 0.006, 48).rotateX(Math.PI / 2), mats.disc, { parent: spin, at: [0, 0, dz] });
    mesh(new THREE.CylinderGeometry(rimR * 0.38, rimR * 0.38, 0.01, 24).rotateX(Math.PI / 2), mats.alu, { parent: spin, at: [0, 0, dz] });
  }
  return spin;
}

export function createMotorcycle(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(MOTORCYCLE_VARIANTS, o.variant, 'motorcycle');
  const v = applyTrim(MOTORCYCLE_VARIANTS[variant], MOTORCYCLE_TRIMS, o.trim, 'motorcycle');
  const root = group(`motorcycle-${variant}`);
  const body = group('body', { parent: root });
  const bo = !!v.blackout;
  const mats = {
    paint: M.paint(o.color ?? v.color, { metallic: 0.5, roughness: 0.25 }),
    guard: Object.assign(M.paint(o.color ?? v.color, { metallic: 0.5, roughness: 0.25 }), { side: THREE.DoubleSide }),
    guardChrome: Object.assign(bo ? M.metal('#1a1a1a', 0.4) : M.chrome(), { side: THREE.DoubleSide }),
    frame: M.paint(v.frame === 'cradle' && !bo ? '#d8d8d8' : v.engine === 'vtwin' || bo ? '#111' : '#222326', { metallic: 0.4, roughness: 0.4 }),
    black: new THREE.MeshPhysicalMaterial({ color: '#0d0d0e', roughness: 0.35, clearcoat: 0.6 }),
    tyre: M.rubber(),
    rim: M.metal(bo || v.head === 'fairing' ? '#1e1e20' : '#c9ccd1', 0.25),
    rimDark: new THREE.MeshStandardMaterial({ color: '#2a2a2c', metalness: 0.7, roughness: 0.4, side: THREE.DoubleSide }),
    chrome: bo ? M.metal('#1c1c1e', 0.35) : M.chrome(),
    alu: M.metal(bo ? '#2a2a2c' : '#b8bcc0', 0.3),
    disc: M.metal('#8d9196', 0.3),
    engine: M.metal(bo ? '#1f2022' : '#3c3e42', 0.45),
    seat: new THREE.MeshPhysicalMaterial({ color: '#141414', roughness: 0.75, sheen: 0.4, name: 'seat' }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#b9c9d3', roughness: 0.02, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, name: 'screen' }),
    white: M.paint('#f4f4f2', { metallic: 0.2 }),
  };
  const { wb, rF, rR } = v;
  const rake = THREE.MathUtils.degToRad(v.rake);
  const fa = new THREE.Vector3(wb / 2, rF, 0);
  const ra = new THREE.Vector3(-wb / 2, rR, 0);
  const dir = new THREE.Vector3(-Math.sin(rake), Math.cos(rake), 0);
  const head = fa.clone().addScaledVector(dir, v.fork);
  const scooter = v.frame === 'step';
  const pivot = new THREE.Vector3(-wb / 2 + (scooter ? 0.45 : 0.58), rR + 0.17, 0);
  const P = (p, dx = 0, dy = 0, dz = 0) => [p.x + dx, p.y + dy, p.z + dz];
  const seatH = v.seatH;
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const panel = (pts, width, mat, opts = {}) => mesh(sculpt(smoothShape(pts, 72), width, opts), mat, { parent: opts.parent ?? body, name: opts.name });

  // lamp groups (core/lamps.js)
  const headL = lampGroup('headlights', 'head');
  const tailL = lampGroup('taillights', 'tail');
  const brakeL = lampGroup('brakelights', 'brake');
  const ind = { L: lampGroup('indicator_L', 'signal'), R: lampGroup('indicator_R', 'signal') };

  // ---------------- front end (steers about the rake axis) ----------------
  const steer = group('fork_steer', { parent: root, at: [fa.x, fa.y, 0], rot: [0, 0, rake] });
  const front = motoWheel('wheel_F', { r: rF, w: v.tyreW[0], wire: v.wire, knobby: v.knobby, discs: v.head === 'fairing' || v.head === 'touring' || v.head === 'beak' ? 2 : 1, mats });
  steer.add(front);
  const fl = v.fork;
  const legZ = v.tyreW[0] / 2 + 0.045;
  const usd = v.frame === 'cradle' || v.head === 'fairing' || v.head === 'beak';
  for (const s of [1, -1]) {
    const lowerLen = scooter ? fl * 0.5 : fl * 0.42;
    // upside-down forks: fat tube on top, slim gold slider at the bottom
    mesh(new THREE.CylinderGeometry(usd ? 0.022 : 0.03, usd ? 0.022 : 0.026, lowerLen, 20), usd ? M.metal('#c9a227', 0.2) : mats.black, { parent: steer, at: [0, lowerLen / 2 - 0.02, s * legZ] });
    mesh(new THREE.CylinderGeometry(usd ? 0.032 : 0.021, usd ? 0.032 : 0.021, fl - lowerLen + 0.06, 20), usd ? mats.alu : mats.chrome, { parent: steer, at: [0, lowerLen + (fl - lowerLen) / 2 - 0.02, s * legZ] });
  }
  // brake caliper(s): bolted to the fork leg, straddling the disc
  const fDiscs = v.head === 'fairing' || v.head === 'touring' || v.head === 'beak' ? 2 : 1;
  for (const s of fDiscs === 2 ? [1, -1] : [1]) {
    const dz = v.tyreW[0] * 0.32;
    const cw = legZ - dz + 0.03;
    mesh(roundedBox(0.09, 0.05, cw, 0.012), M.paint(v.head === 'fairing' ? '#c62828' : '#333'), { parent: steer, at: [-rF * 0.42, rF * 0.12, s * (dz + cw / 2 - 0.012)], rot: [0, 0, 0.6] });
    mesh(roundedBox(0.11, 0.05, 0.02, 0.006), mats.black, { parent: steer, at: [-rF * 0.25, rF * 0.12, s * legZ] });
  }
  for (const y of [fl - 0.18, fl]) mesh(roundedBox(0.08, 0.035, legZ * 2 + 0.07, 0.012), mats.alu, { parent: steer, at: [0, y, 0] });
  // front fender
  if (v.frame === 'cradle' && v.knobby) mesh(guard(rF + 0.09, 0.14, 25, 150, rake), mats.guard, { parent: steer, at: [0, 0.08, 0] });
  else if (!scooter) mesh(guard(rF + 0.035, v.tyreW[0] + 0.05, 45, 160, rake), v.engine === 'vtwin' ? mats.guardChrome : mats.guard, { parent: steer });
  for (const s of [1, -1]) if (!scooter) mesh(roundedBox(0.06, 0.03, 0.02, 0.008), mats.black, { parent: steer, at: [0, rF + 0.04, s * (legZ - 0.012)] });

  // headlight variants
  if (v.head === 'round') {
    const hl = group('headlamp', { parent: steer, at: [0.1, fl - 0.12, 0], rot: [0, 0, -rake] });
    const bucket = lathe([[0.001, -0.07], [0.07, -0.06], [0.09, -0.01], [0.092, 0.02]], 32).rotateZ(-Math.PI / 2);
    mesh(bucket, v.engine === 'vtwin' || v.chromeTank ? mats.chrome : mats.black, { parent: hl });
    tube([-0.04, 0, 0.09], [-0.1, 0, legZ], 0.012, mats.black, { parent: hl });
    tube([-0.04, 0, -0.09], [-0.1, 0, -legZ], 0.012, mats.black, { parent: hl });
    headL.add(hl, { at: [0.02, 0, 0], normal: [1, 0, 0], w: 0.17, h: 0.17, shape: 'round', depth: 0.02, bezel: false });
  } else if (v.head === 'plate') {
    // number plate with a small lamp (dirt / supermoto)
    const pl = group('number_plate', { parent: steer, at: [0.11, fl - 0.14, 0], rot: [0, 0, -rake + 0.25] });
    mesh(sculpt(smoothShape([[0, 0.14], [0.02, -0.14], [0.03, -0.16], [0.01, 0.16]]), 0.24, { bevel: 0.01 }), mats.white, { parent: pl });
    tube([-0.0, 0.05, 0], [-0.1, 0.06, 0], 0.012, mats.black, { parent: pl });
    headL.add(pl, { at: [0.035, -0.02, 0], normal: [1, 0, 0], w: 0.07, h: 0.06, depth: 0.015 });
  } else if (v.head === 'scooter') {
    // handled with the scooter body
  }
  // handlebars
  const barSpec = {
    clip: (s) => [[0, fl - 0.15, s * (legZ + 0.02)], [-0.04, fl - 0.12, s * 0.2], [-0.08, fl - 0.13, s * 0.33]],
    flat: (s) => [[0, fl + 0.02, s * 0.05], [0, fl + 0.1, s * 0.14], [-0.05, fl + 0.12, s * 0.28], [-0.07, fl + 0.12, s * 0.38]],
    high: (s) => [[0, fl + 0.02, s * 0.05], [0, fl + 0.14, s * 0.14], [-0.14, fl + 0.16, s * 0.3], [-0.22, fl + 0.14, s * 0.38]],
    cruiser: (s) => [[0, fl + 0.02, s * 0.05], [0, fl + 0.16, s * 0.14], [-0.13, fl + 0.17, s * 0.3], [-0.22, fl + 0.14, s * 0.38]],
    ape: (s) => [[0, fl, s * 0.06], [0.02, fl + 0.25, s * 0.16], [-0.04, fl + 0.42, s * 0.26], [-0.18, fl + 0.4, s * 0.36]],
    scooter: (s) => [[0, fl + 0.04, s * 0.05], [-0.02, fl + 0.07, s * 0.2], [-0.05, fl + 0.07, s * 0.33]],
  }[v.bars];
  const grips = [];
  for (const s of [1, -1]) {
    const pts = barSpec(s);
    curveTube(pts, 0.012, v.frame === 'cradle' ? mats.alu : mats.chrome, { parent: steer });
    const grip = pts.at(-1);
    grips.push(grip);
    mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 16).rotateX(Math.PI / 2), mats.black, { parent: steer, at: [grip[0], grip[1], grip[2] - s * 0.04] });
    mesh(roundedBox(0.13, 0.012, 0.02, 0.005), mats.alu, { parent: steer, at: [grip[0] + 0.06, grip[1] + 0.01, grip[2] - s * 0.06], rot: [0, s * 0.4, 0] });
    if (v.guards) mesh(sculpt(smoothShape([[0.02, 0], [0.14, 0.03], [0.12, 0.07], [0.0, 0.05]]), 0.05, { bevel: 0.012 }), mats.white, { parent: steer, at: [grip[0] + 0.02, grip[1] - 0.03, grip[2] - s * 0.02] });
    if (v.mirrors !== false && v.frame !== 'cradle') {
      const m0 = [grip[0], grip[1] + 0.01, grip[2] - s * 0.1];
      const m1 = [grip[0] - 0.02, grip[1] + (scooter ? 0.12 : 0.22), grip[2] - s * 0.02];
      tube(m0, m1, 0.006, mats.black, { parent: steer });
      mesh(cushion(0.025, 0.06, 0.11, { radius: 0.01 }), mats.black, { parent: steer, at: [m1[0] - 0.005, m1[1] + 0.03, m1[2]] });
    }
  }
  // instruments
  if (v.bars !== 'ape') mesh(cushion(0.05, 0.08, 0.13, { radius: 0.02 }), mats.black, { parent: steer, at: [-0.02, fl + 0.06, 0], rot: [0, 0, -rake - 0.4] });
  // front indicators on stalks from the fork / headlamp area
  for (const [s, n] of [[-1, 'L'], [1, 'R']]) {
    if (v.head === 'fairing' || v.head === 'touring' || v.head === 'beak' || scooter) break;
    const y = fl - 0.12;
    tube([0.04, y, s * (legZ + 0.025)], [0.06, y, s * (legZ + 0.1)], 0.007, mats.black, { parent: steer });
    ind[n].add(steer, { at: [0.08, y, s * (legZ + 0.11)], normal: [1, 0, s * 0.3], w: 0.045, h: 0.03, shape: 'round', depth: 0.02 });
  }
  // optional screen on a bracket above a round headlight (police / touring-pack)
  if (v.screen === 'tall' && (v.head === 'round' || v.head === 'plate')) {
    const sc = panel([[0.1, fl - 0.04], [0.05, fl + 0.32], [0.035, fl + 0.32], [0.085, fl - 0.04]], 0.36, mats.glass, { bevel: 0.006, parent: steer });
    for (const s of [1, -1]) tube([0.02, fl - 0.08, s * 0.08], [0.09, fl + 0.0, s * 0.12], 0.008, mats.chrome, { parent: steer });
  }

  // ---------------- rear wheel, swingarm, drive ----------------
  const rear = motoWheel('wheel_R', { r: rR, w: v.tyreW[1], wire: v.wire, knobby: v.knobby, mats, side: 1 });
  rear.position.copy(ra);
  root.add(rear);
  const swZ = v.tyreW[1] / 2 + 0.035;
  if (!scooter) for (const s of [1, -1]) {
    if (v.engine === 'vtwin') curveTube([P(pivot, 0, 0, s * swZ), P(ra, 0.05, 0.02, s * swZ)], 0.02, mats.frame, { parent: root });
    else mesh(extrudeOutline([[0, -0.035], [pivot.x - ra.x, -0.03], [pivot.x - ra.x, 0.035], [0, 0.025]], 0.045, { bevel: 0.012 }), v.frame === 'cradle' || v.head === 'fairing' ? mats.alu : mats.frame, { parent: root, at: [ra.x, ra.y, s * swZ], rot: [0, 0, Math.atan2(pivot.y - ra.y, pivot.x - ra.x)] });
  }
  for (const s of [1, -1]) if (!scooter) mesh(new THREE.CylinderGeometry(0.03, 0.03, swZ * 2 + 0.04, 16).rotateX(Math.PI / 2), mats.alu, { parent: root, at: P(pivot) });
  if (!scooter) {
    const cz = swZ + 0.025;
    const fs = new THREE.Vector3(pivot.x + 0.07, pivot.y - 0.03, cz);
    const rs = 0.1;
    const fsr = 0.045;
    mesh(new THREE.CylinderGeometry(rs, rs, 0.006, 32).rotateX(Math.PI / 2), mats.alu, { parent: rear, at: [0, 0, cz] });
    const chain = [];
    for (let i = 0; i <= 20; i++) { const a = Math.PI / 2 + (i / 20) * Math.PI; chain.push([ra.x + Math.cos(a) * rs, ra.y + Math.sin(a) * rs, cz]); }
    for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + (i / 12) * Math.PI; chain.push([fs.x + Math.cos(a) * fsr, fs.y + Math.sin(a) * fsr, cz]); }
    curveTube(chain, 0.007, v.engine === 'electric' ? M.plastic('#222') : M.metal('#5b5d60', 0.5), { parent: root, closed: true, segments: 120, radialSegments: 6 });
    mesh(new THREE.CylinderGeometry(fsr + 0.01, fsr + 0.01, 0.02, 20).rotateX(Math.PI / 2), mats.engine, { parent: body, at: [fs.x, fs.y, cz] });
  }

  // ---------------- engine ----------------
  const eng = new THREE.Vector3((head.x + pivot.x) / 2 + 0.02, pivot.y + 0.02, 0);
  const finned = (base, angle, height, rad, fins = true) => {
    const cyl = group(null, { parent: body, at: base, rot: [0, 0, angle] });
    const n = Math.round(height / 0.022);
    if (fins) for (let i = 0; i < n; i++) mesh(new THREE.CylinderGeometry(rad + 0.018, rad + 0.018, 0.009, 24), mats.engine, { parent: cyl, at: [0, i * 0.022, 0] });
    mesh(new THREE.CylinderGeometry(rad, rad, height, 24), mats.engine, { parent: cyl, at: [0, height / 2, 0] });
    mesh(roundedBox(rad * 2.4, 0.07, rad * 2.2, 0.02), mats.chrome, { parent: cyl, at: [0, height + 0.02, 0] });
    return cyl;
  };
  if (v.engine === 'vtwin') {
    mesh(roundedBox(0.36, 0.2, 0.22, 0.05), mats.engine, { parent: body, at: P(eng, 0, -0.08) });
    finned(P(eng, 0.06, 0.0), -0.5, 0.26, 0.055);
    finned(P(eng, -0.06, 0.0), 0.5, 0.26, 0.055);
    for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 32).rotateX(Math.PI / 2), mats.chrome, { parent: body, at: P(eng, 0, -0.08, s * 0.12) });
    mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 32).rotateX(Math.PI / 2), mats.chrome, { parent: body, at: P(eng, 0.04, 0.18, -0.13) });
    tube(P(eng, 0.04, 0.18, -0.11), P(eng, 0.0, 0.14, 0), 0.022, mats.engine, { parent: body, name: 'intake' });
  } else if (v.engine === 'scooter') {
    mesh(roundedBox(0.42, 0.2, 0.16, 0.06), mats.engine, { parent: body, at: [ra.x + 0.25, rR + 0.03, -0.1] });
  } else if (v.engine === 'electric') {
    // battery pack between the frame spars + motor at the swingarm pivot
    panel([[eng.x + 0.24, eng.y + 0.22], [eng.x - 0.22, eng.y + 0.24], [eng.x - 0.26, eng.y - 0.16], [eng.x + 0.16, eng.y - 0.2]], 0.28, M.metal('#2b2e33', 0.5), { bevel: 0.04 });
    for (let k = 0; k < 5; k++) mesh(roundedBox(0.008, 0.36, 0.29, 0.003), M.metal('#3d4148', 0.4), { parent: body, at: [eng.x - 0.18 + k * 0.08, eng.y + 0.02, 0] });
    mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 28).rotateX(Math.PI / 2), M.metal('#55595f', 0.35), { parent: body, at: P(pivot, 0.1, 0.0) });
  } else {
    const single = v.engine === 'single';
    mesh(roundedBox(single ? 0.32 : 0.42, single ? 0.24 : 0.28, single ? 0.2 : 0.28, 0.06), mats.engine, { parent: body, at: P(eng, 0, -0.04) });
    if (v.engine === 'twin') finned(P(eng, 0.06, 0.08), -0.2, 0.2, 0.08);
    else if (single) finned(P(eng, 0.06, 0.06), -0.3, 0.2, 0.06, false);
    else mesh(roundedBox(0.2, 0.22, 0.26, 0.05), mats.engine, { parent: body, at: P(eng, 0.12, 0.2), rot: [0, 0, -0.35] });
    for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 32).rotateX(Math.PI / 2), mats.alu, { parent: body, at: P(eng, -0.04, -0.04, s * (single ? 0.11 : 0.15)) });
    if (v.engine === 'inline' || v.frame === 'cradle' || v.head === 'beak') {
      // radiator ahead of the engine, with a dark core
      const rx = head.x - 0.05;
      const ry = (head.y + eng.y) / 2 - 0.06;
      mesh(roundedBox(0.05, 0.3, 0.34, 0.015), mats.black, { parent: body, at: [rx, ry, 0], rot: [0, 0, -0.25] });
      mesh(roundedBox(0.012, 0.26, 0.3, 0.004), M.metal('#555', 0.6), { parent: body, at: [rx + 0.026, ry + 0.006, 0], rot: [0, 0, -0.25] });
    }
  }

  // ---------------- frame ----------------
  const F = (pts, r = 0.022, z = 0) => curveTube(pts.map((p) => [p[0], p[1], z]), r, mats.frame, { parent: body });
  const hb = P(head, 0.0, -0.05);
  const lerp = THREE.MathUtils.lerp;
  const vt = v.engine === 'vtwin';
  const xr = pivot.x + (v.tail === 'mx' ? 0.25 : 0.1); // tank / seat joint
  // top line of the main frame (y at x): tank, seat and subframe all sit on it
  let ft = () => pivot.y;
  let anchorA = [xr, pivot.y + 0.1]; // subframe upper mount on the main frame
  let anchorB = [pivot.x, pivot.y]; // subframe lower mount (above the swingarm pivot)
  let crossZ = 0.1;
  let bb = null;
  if (!scooter) {
    if (v.frame === 'spar') {
      for (const s of [1, -1]) mesh(extrudeOutline([[0, 0.03], [0, -0.05], [pivot.x - head.x - 0.02, -(head.y - pivot.y) - 0.06], [pivot.x - head.x + 0.06, -(head.y - pivot.y) + 0.06]], 0.035, { bevel: 0.012 }), v.head === 'fairing' ? mats.alu : mats.frame, { parent: body, at: [head.x, head.y - 0.06, s * 0.13] });
      const line = (x, y1, y2) => y2 + (y1 - y2) * clamp01((x - (pivot.x + 0.06)) / (head.x - pivot.x - 0.06));
      ft = (x) => line(x, head.y - 0.02, pivot.y + 0.01);
      const fb = (x) => line(x, head.y - 0.1, pivot.y - 0.1);
      const ax = pivot.x + 0.17;
      anchorA = [ax, (ft(ax) + fb(ax)) / 2 - 0.01];
      anchorB = [pivot.x + 0.08, pivot.y - 0.03];
      crossZ = 0.15;
    } else {
      // backbone: headstock → under the tank → seat → down to the swingarm pivot
      bb = [hb, [lerp(head.x, xr, 0.45), lerp(head.y, seatH - 0.08, v.bars === 'ape' ? 0.22 : 0.45)], [xr + 0.02, seatH - 0.08], [pivot.x + 0.02, pivot.y + 0.1], P(pivot)];
      F(bb, 0.024);
      const loopDown = [hb, [head.x + 0.02, head.y - 0.35], [eng.x + 0.22, eng.y - 0.12], [eng.x + 0.05, eng.y - 0.24], [pivot.x + 0.02, pivot.y - 0.16], [pivot.x, pivot.y]];
      for (const s of [1, -1]) F(loopDown, v.frame === 'cradle' ? 0.016 : 0.018, s * 0.06);
      ft = (x) => {
        const k = x >= bb[1][0] ? 0 : 1;
        const [x0, y0] = bb[k];
        const [x1, y1] = bb[k + 1];
        return 0.024 + (x >= x0 ? y0 : lerp(y1, y0, clamp01((x - x1) / (x0 - x1))));
      };
      anchorA = bb[2];
      anchorB = bb[3];
      crossZ = 0.09;
    }
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 16), mats.frame, { parent: body, at: P(head, 0.04, -0.08), rot: [0, 0, rake] });
  }

  // ---------------- subframe + rear suspension ----------------
  const rz = 0.085;
  const sportTail = v.tail === 'sport' && v.head === 'fairing';
  const xt = { sport: sportTail ? ra.x - 0.1 : ra.x - 0.03, cafe: ra.x - 0.06, mx: ra.x - 0.05, touring: ra.x - 0.1, adv: ra.x - 0.1 }[v.tail] ?? ra.x; // tail tip
  const railF = [anchorA[0] - 0.1, seatH - 0.1];
  const railE = [xt + 0.07, seatH - 0.075 + (sportTail ? 0.09 : v.tail === 'cafe' ? 0.03 : 0)];
  const railY = (x) => lerp(railE[1], railF[1], clamp01((x - railE[0]) / (railF[0] - railE[0])));
  const crossTube = (x, y, half, r = 0.013, parent = body) => tube([x, y, -half], [x, y, half], r, mats.frame, { parent });
  const shockTop = [pivot.x - 0.08, Math.min(seatH - 0.17, pivot.y + 0.34)];
  const hasRails = !scooter && v.tail !== 'fender';
  if (hasRails) {
    const r2x = ra.x + 0.22;
    for (const s of [1, -1]) {
      const mx = lerp(railF[0], railE[0], 0.5);
      curveTube([[anchorA[0], anchorA[1], s * rz], [railF[0], railF[1], s * rz], [mx, railY(mx), s * rz], [railE[0], railE[1], s * 0.07]], 0.014, mats.frame, { parent: body });
      curveTube([[anchorB[0], anchorB[1], s * rz], [shockTop[0], shockTop[1], s * rz], [r2x, railY(r2x), s * rz]], 0.013, mats.frame, { parent: body });
    }
    crossTube(anchorA[0], anchorA[1], crossZ, 0.014);
    crossTube(anchorB[0], anchorB[1], crossZ, 0.014);
    crossTube(shockTop[0], shockTop[1], rz, 0.014);
    crossTube(railE[0], railE[1], 0.07, 0.012);
  }
  const springMat = M.paint(v.frame === 'cradle' ? '#c9a227' : '#c62828');
  const coilPts = (a, b, r, turns, t0 = 0.12, t1 = 0.84) => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const ax = B.clone().sub(A).normalize();
    const u = new THREE.Vector3(0, 0, 1).cross(ax);
    if (u.lengthSq() < 1e-6) u.set(1, 0, 0);
    u.normalize();
    const w = ax.clone().cross(u).normalize();
    const pts = [];
    const n = turns * 12;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const ang = t * Math.PI * 2 * turns;
      pts.push(A.clone().lerp(B, t0 + t * (t1 - t0)).addScaledVector(u, Math.cos(ang) * r).addScaledVector(w, Math.sin(ang) * r).toArray());
    }
    return pts;
  };
  /** coil-over damper between two eyes (a = bottom, b = top), eye pins along Z */
  const shock = (a, b, r) => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    tube(a, b, r * 0.45, mats.chrome, { parent: root, name: 'shock_shaft' });
    tube(A.clone().lerp(B, 0.42).toArray(), b, r, M.metal('#2b2b2d', 0.35), { parent: root, name: 'shock_body' });
    curveTube(coilPts(a, b, r * 1.9, 8), r * 0.38, springMat, { parent: root, segments: 200, radialSegments: 5, name: 'shock_spring' });
    for (const e of [A, B]) mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.1, r * 2.4, 14).rotateX(Math.PI / 2), mats.alu, { parent: root, at: e.toArray() });
  };
  if (hasRails && v.tail !== 'cafe') {
    // monoshock tucked under the seat: swingarm cross-member → frame cross-tube
    const S = pivot.clone().lerp(ra, 0.28);
    tube([S.x, S.y, -swZ], [S.x, S.y, swZ], 0.018, mats.alu, { parent: root, name: 'swingarm_brace' });
    shock([S.x, S.y + 0.025, 0], [shockTop[0], shockTop[1], 0], 0.017);
  } else if (hasRails) {
    // twin shocks: swingarm ends → seat rails
    for (const s of [1, -1]) {
      const S = pivot.clone().lerp(ra, 0.82);
      const z = s * (swZ + 0.04);
      const tx = S.x + 0.1;
      const ty = railY(tx);
      tube([S.x, S.y, s * swZ], [S.x, S.y, z + s * 0.016], 0.011, mats.alu, { parent: root });
      tube([tx, ty, s * rz], [tx, ty, z + s * 0.016], 0.011, mats.frame, { parent: body });
      shock([S.x, S.y, z], [tx, ty, z], 0.015);
    }
  }

  // ---------------- tank ----------------
  let tankX = head.x - 0.06;
  let tankY = head.y;
  let tankZ = 0.17;
  let xb = xr; // tank rear (the seat nose tucks under it)
  if (!scooter) {
    const mxT = v.tail === 'mx';
    const W = ({ sport: 0.38, cafe: 0.32, mx: 0.3, touring: 0.42, adv: 0.44, fender: v.bars === 'ape' ? 0.24 : 0.36 }[v.tail] ?? 0.36) / 2;
    const xf = head.x - (vt ? 0.08 : 0.03);
    const len = vt ? (v.bars === 'ape' ? 0.32 : 0.46) : mxT ? 0.4 : 0.56;
    xb = mxT ? xf - len : Math.max(xr + 0.02, xf - len);
    const X = [0, 0.15, 0.4, 0.68, 0.88, 1].map((t) => xb + (xf - xb) * t);
    let tops;
    if (vt) tops = X.map((x, i) => ft(x) + [0.07, 0.15, 0.2, 0.2, 0.17, 0.1][i]);
    else if (mxT) tops = X.map((x, i) => Math.max(ft(x) + 0.06, seatH + [0.02, 0.04, 0.06, 0.08, 0.08, 0.05][i]));
    else {
      const crest = Math.max(head.y, seatH + 0.17) + 0.02;
      tops = [seatH + 0.07, lerp(seatH + 0.07, crest, 0.82), crest, crest, crest - 0.025, Math.min(crest, head.y) - 0.06].map((y, i) => Math.max(y, ft(X[i]) + 0.08));
    }
    const bots = X.map((x, i) => Math.max(ft(x) - 0.035, tops[i] - (vt ? 0.25 : 0.36)));
    // knee recesses in the lower rear flanks
    const knee = vt || mxT ? undefined : (x, y, z, t, vv) => [y, z * (1 - 0.2 * Math.sin(Math.PI * clamp01((t - 0.06) / 0.5)) * Math.sin(Math.PI * clamp01((vv - 0.02) / 0.62)))];
    const tg = loft(X.map((x, i) => [x, tops[i], bots[i], W * [0.45, 0.85, 1, 1, 0.86, 0.5][i], 2.8]), { rings: 56, around: 44, shape: knee });
    mesh(tg, v.chromeTank ? mats.chrome : mats.paint, { parent: body, name: 'tank' });
    // filler cap on the crest
    const cx = lerp(xb, xf, 0.6);
    const cs = tg.sample(cx);
    mesh(new THREE.CylinderGeometry(0.04, 0.043, 0.016, 32), mats.alu, { parent: body, at: [cx, cs.yt + 0.002, 0], name: 'filler_cap' });
    mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.006, 24), mats.black, { parent: body, at: [cx, cs.yt + 0.012, 0] });
    if (v.chromeTank) {
      const kx = lerp(xb, xf, 0.3);
      const ks = tg.sample(kx);
      for (const s of [1, -1]) mesh(cushion(0.16, 0.09, 0.024, { radius: 0.008 }), M.rubber(), { parent: body, at: [kx, lerp(ks.yb, ks.yt, 0.4), s * ks.w * 0.8], name: 'knee_pad' });
    }
    const ex = lerp(xb, xf, 0.72);
    const es = tg.sample(ex);
    tankX = ex;
    tankY = (es.yt + es.yb) / 2;
    tankZ = es.w;
  }
  // ---------------- seat / tail ----------------
  let tailX = ra.x - 0.05;
  let tailY = rR + 0.32;
  const sx1 = ra.x + 0.35;
  let rearLamp = null; // integrated tail/brake lamp on the bodywork
  let hangFrom = null; // plate hanger start under the tail
  let deck = seatH + 0.04; // top of the tail at the luggage-rack position
  if (scooter) {
    // classic step-through: smooth monocoque, bulbous side cowls, legshield, floorboard
    const sm = (pts, w, mat, opts = {}) => mesh(sculpt(smoothShape(pts, 80), w, { smooth: true, ...opts }), mat, { parent: opts.parent ?? body, name: opts.name });
    // floorboard with rubber strips
    mesh(roundedBox(0.62, 0.06, 0.34, 0.025), mats.paint, { parent: body, at: [0.05, 0.3, 0], name: 'floorboard' });
    for (let k = -2; k <= 2; k++) mesh(roundedBox(0.56, 0.012, 0.025, 0.005), mats.black, { parent: body, at: [0.05, 0.335, k * 0.06] });
    // central spine joining legshield to rear body (under the floor)
    mesh(roundedBox(1.0, 0.12, 0.16, 0.05), mats.frame, { parent: body, at: [0.0, 0.22, 0] });
    // curved legshield rising from the floorboard to the headset
    sm([[0.36, 0.27], [0.42, 0.55], [0.44, 0.85], [0.4, 0.98], [0.36, 0.98], [0.38, 0.85], [0.36, 0.55], [0.3, 0.3]], 0.5, mats.paint, { bevel: 0.03, taper: (x, y) => 0.75 + 0.25 * Math.min(1, (y - 0.27) / 0.4), name: 'legshield' });
    // horn-cast badge on the legshield front
    sm([[0.445, 0.82], [0.47, 0.72], [0.45, 0.62], [0.435, 0.72]], 0.09, mats.chrome, { bevel: 0.012, name: 'horncast' });
    { const e = brandEmblem(0.06, { name: 'emblem_front' }); e.scale.z = 0.25; e.position.set(0.47, 0.72, 0); e.rotation.y = Math.PI / 2; body.add(e); }
    // rear monocoque body + bulbous side cowls
    sm([[0.0, 0.33], [-0.02, 0.62], [-0.3, 0.72], [-0.75, 0.66], [-0.82, 0.5], [-0.6, 0.35]], 0.24, mats.paint, { bevel: 0.07, name: 'rear_body' });
    for (const s2 of [1, -1]) sm([[-0.12, 0.32], [-0.18, 0.6], [-0.5, 0.66], [-0.78, 0.55], [-0.72, 0.36], [-0.4, 0.28]], 0.12, mats.paint, { bevel: 0.055, name: 'side_cowl' }).position.z = s2 * 0.15;
    // seat on a hinge + luggage rack + tail light on the cowl
    mesh(cushion(0.6, 0.1, 0.28, { radius: 0.045, bulge: 0.35 }), mats.seat, { parent: body, at: [-0.4, 0.77, 0], name: 'seat' });
    mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 10).rotateX(Math.PI / 2), mats.chrome, { parent: body, at: [-0.09, 0.72, 0], name: 'seat_hinge' });
    for (const s2 of [1, -1]) tube([-0.7, 0.72, s2 * 0.1], [-0.92, 0.74, s2 * 0.1], 0.01, mats.chrome, { parent: body });
    for (const x of [-0.78, -0.92]) tube([x, 0.74, -0.1], [x, 0.74, 0.1], 0.01, mats.chrome, { parent: body });
    for (const s2 of [1, -1]) tube([-0.7, 0.72, s2 * 0.1], [-0.72, 0.62, s2 * 0.09], 0.01, mats.chrome, { parent: body });
    // headset with round headlight + speedo, on the steering column
    sm([[0.09, -0.06], [0.08, 0.06], [-0.06, 0.08], [-0.1, 0.0], [-0.06, -0.07]], 0.3, mats.paint, { bevel: 0.05, parent: steer, name: 'headset' }).position.set(0, fl + 0.06, 0);
    headL.add(steer, { at: [0.09 * Math.cos(-rake) + 0.0, fl + 0.06, 0], normal: [Math.cos(-rake), Math.sin(-rake), 0], w: 0.13, h: 0.13, shape: 'round', depth: 0.02 });
    mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 20), mats.black, { parent: steer, at: [-0.04, fl + 0.14, 0], rot: [0, 0, -rake - 0.5], name: 'speedo' });
    for (const [s2, n] of [[-1, 'L'], [1, 'R']]) ind[n].add(steer, { at: [0.04, fl + 0.06, s2 * 0.15], normal: [0.5, 0, s2], w: 0.05, h: 0.03, depth: 0.012 });
    // front mudguard hugging the wheel + trailing-link suspension
    mesh(guard(rF + 0.025, 0.13, 30, 165, rake), mats.guard, { parent: steer, name: 'mudguard' });
    mesh(roundedBox(0.16, 0.035, 0.03, 0.012), mats.black, { parent: steer, at: [-0.06, rF + 0.02, legZ], rot: [0, 0, 0.3], name: 'trailing_link' });
    // tail light on the rear cowl
    tailX = -0.83;
    tailY = 0.6;
  } else {
    const seamMat = new THREE.MeshStandardMaterial({ color: v.chromeTank ? '#d8c7a0' : '#8a8a8a', roughness: 0.7, name: 'seam' });
    const seatMat = v.chromeTank ? new THREE.MeshPhysicalMaterial({ color: '#4a2a17', roughness: 0.6, sheen: 0.5, name: 'seat' }) : mats.seat;
    /** padded seat: smooth loft + stitched seam lines along both top edges */
    const pad = (st, name, frac = 0.66) => {
      const g = loft(st.map((s) => [s[0], s[1], s[2], s[3], s[4] ?? 3.2]), { rings: 36, around: 36 });
      mesh(g, seatMat, { parent: body, name });
      for (const s of [1, -1]) curveTube(surfaceLine(g.sample, st[0][0] + 0.025, st.at(-1)[0] - 0.025, frac, s), 0.0024, seamMat, { parent: body, segments: 48, radialSegments: 5, name: `${name}_seam` });
      return g.sample;
    };
    /** painted bodywork shell */
    const shell = (st, name, mat = mats.paint) => {
      const g = loft(st.map((s) => [s[0], s[1], s[2], s[3], s[4] ?? 3]), { rings: 48, around: 40 });
      mesh(g, mat, { parent: body, name });
      return g.sample;
    };
    /** side grab handles: dive into the tail cowl at both ends */
    const grabRails = (x0, x1, y0, y1, zOut, mat = mats.alu) => {
      for (const s of [1, -1]) curveTube([[x0, y0 - 0.02, s * 0.06], [x0 - 0.03, y0, s * zOut], [x1 + 0.07, y1, s * zOut], [x1, y1 - 0.01, s * 0.05]], 0.011, mat, { parent: body, name: 'grab_rail' });
    };
    const under = (x, d) => Math.max(ft(x) - 0.03, seatH - d); // cowl bottom: down to the frame
    const sF = xb + 0.04;
    const tbx = ra.x - 0.06;
    if (v.tail === 'sport') {
      const sR = ra.x + 0.36;
      const sm = (sR + sF) / 2;
      pad([[sR, seatH + 0.035, seatH - 0.075, 0.125], [sR + 0.08, seatH + 0.012, seatH - 0.08, 0.13], [sm, seatH, seatH - 0.08, 0.125], [sF - 0.05, seatH + 0.005, seatH - 0.075, 0.1], [sF, seatH + 0.015, seatH - 0.05, 0.06]], 'seat');
      let cowl;
      if (sportTail) {
        // sharp tail cowl, pillion pad on top, LED light in the tip
        cowl = shell([[xt, seatH + 0.105, seatH + 0.045, 0.045, 5], [xt + 0.06, seatH + 0.125, seatH + 0.02, 0.065, 3.5], [ra.x + 0.12, seatH + 0.105, seatH - 0.05, 0.1], [sR - 0.02, seatH + 0.02, seatH - 0.13, 0.135], [sm, seatH - 0.035, under(sm, 0.25), 0.15], [sF - 0.02, seatH - 0.02, under(sF - 0.02, 0.3), 0.14]], 'tail_cowl');
        pad([[ra.x + 0.1, seatH + 0.14, seatH + 0.08, 0.075], [ra.x + 0.2, seatH + 0.12, seatH + 0.05, 0.095], [sR - 0.01, seatH + 0.07, seatH, 0.1]], 'pillion_seat', 0.6);
        rearLamp = { tail: [xt, seatH + 0.085], tw: 0.075, th: 0.026, brake: [xt + 0.002, seatH + 0.058], bw: 0.06, bh: 0.012 };
      } else {
        // naked / electric: stubby tail unit, stepped pillion, grab rails
        cowl = shell([[xt, seatH + 0.07, seatH, 0.06, 4], [ra.x + 0.08, seatH + 0.08, seatH - 0.04, 0.09], [sR - 0.02, seatH + 0.02, seatH - 0.12, 0.13], [sm, seatH - 0.035, under(sm, 0.25), 0.15], [sF - 0.02, seatH - 0.02, under(sF - 0.02, 0.3), 0.14]], 'tail_cowl');
        pad([[ra.x + 0.03, seatH + 0.1, seatH + 0.045, 0.08], [ra.x + 0.17, seatH + 0.095, seatH + 0.03, 0.1], [sR - 0.01, seatH + 0.065, seatH, 0.11]], 'pillion_seat', 0.6);
        grabRails(sR + 0.02, ra.x + 0.06, seatH - 0.03, seatH + 0.02, 0.15);
        rearLamp = { tail: [xt, seatH + 0.045], tw: 0.09, th: 0.03, brake: [xt + 0.002, seatH + 0.015], bw: 0.07, bh: 0.012 };
      }
      hangFrom = [ra.x + 0.02, cowl(ra.x + 0.02).yb + 0.005];
      deck = cowl(tbx).yt;
    } else if (v.tail === 'cafe') {
      // long flat rider seat + humped solo seat cowl
      const sR = ra.x + 0.3;
      pad([[sR, seatH + 0.02, seatH - 0.075, 0.125], [(sR + sF) / 2, seatH, seatH - 0.08, 0.13], [sF - 0.05, seatH + 0.005, seatH - 0.075, 0.105], [sF, seatH + 0.015, seatH - 0.05, 0.065]], 'seat');
      const hump = shell([[xt, seatH + 0.08, seatH - 0.03, 0.05, 2.4], [xt + 0.05, seatH + 0.12, seatH - 0.055, 0.1, 2.6], [ra.x + 0.12, seatH + 0.14, seatH - 0.065, 0.125, 2.8], [sR - 0.01, seatH + 0.085, seatH - 0.075, 0.135], [sR + 0.04, seatH, seatH - 0.08, 0.13]], 'seat_cowl');
      // battery box between the rails under the seat
      mesh(roundedBox(0.2, 0.13, 0.16, 0.02), mats.black, { parent: body, at: [pivot.x - 0.04, seatH - 0.16, 0], name: 'battery_box' });
      rearLamp = { tail: [xt, seatH + 0.03], tw: 0.065, th: 0.065, shape: 'round', bezel: true, brake: [xt + 0.002, seatH - 0.016], bw: 0.06, bh: 0.01 };
      hangFrom = [ra.x, hump(ra.x).yb + 0.005];
      deck = hump(tbx).yt;
    } else if (v.tail === 'mx') {
      const f0 = xr + 0.16;
      pad([[ra.x + 0.08, seatH + 0.02, seatH - 0.09, 0.1], [(ra.x + f0) / 2, seatH, seatH - 0.095, 0.115], [f0 - 0.08, seatH + 0.005, seatH - 0.09, 0.11], [f0, seatH + 0.02, seatH - 0.08, 0.07]], 'seat');
      // rear fender sweeping up + side number panels
      panel([[ra.x + 0.45, seatH - 0.08], [ra.x + 0.1, seatH - 0.02], [ra.x - 0.35, seatH + 0.06], [ra.x - 0.36, seatH + 0.03], [ra.x + 0.1, seatH - 0.1]], 0.18, mats.white, { bevel: 0.01, name: 'rear_fender' });
      for (const s of [1, -1]) panel([[xr + 0.05, seatH - 0.07], [ra.x + 0.25, seatH - 0.05], [ra.x + 0.35, seatH - 0.27], [xr - 0.05, seatH - 0.3]], 0.04, mats.white, { bevel: 0.01, parent: body, name: 'side_panel' }).position.z = s * 0.12;
      // radiator shrouds
      for (const s of [1, -1]) panel([[head.x - 0.05, head.y - 0.06], [xr + 0.25, seatH + 0.02], [xr + 0.2, seatH - 0.18], [head.x - 0.1, head.y - 0.3]], 0.05, mats.paint, { bevel: 0.015 }).position.z = s * 0.16;
      tailX = ra.x - 0.33;
      tailY = seatH + 0.0;
      deck = seatH + 0.03;
    } else if (v.tail === 'touring' || v.tail === 'adv') {
      const k = v.tail === 'touring' ? 1.2 : 1;
      const tb = v.topBox || v.head === 'touring';
      const sR = ra.x + 0.38;
      const sm = (sR + sF) / 2;
      pad([[sR, seatH + 0.03, seatH - 0.08, 0.15 * k], [sm, seatH, seatH - 0.085, 0.16 * k], [sF - 0.06, seatH + 0.01, seatH - 0.075, 0.13 * k], [sF, seatH + 0.02, seatH - 0.05, 0.08 * k]], 'seat');
      const p0 = tb ? ra.x + 0.1 : ra.x;
      pad([[p0, seatH + 0.08, seatH, 0.11 * k], [(p0 + sR) / 2, seatH + 0.08, seatH - 0.01, 0.14 * k], [sR - 0.01, seatH + 0.06, seatH - 0.03, 0.15 * k]], 'pillion_seat', 0.6);
      const cowl = shell([[xt, seatH + 0.03, seatH - 0.07, 0.07, 3.5], [ra.x - 0.02, seatH + 0.045, seatH - 0.13, 0.11], [ra.x + 0.2, seatH + 0.02, seatH - 0.18, 0.14 * k], [sR, seatH - 0.03, seatH - 0.19, 0.16 * k], [sm, seatH - 0.04, under(sm, 0.28), 0.16 * k], [sF - 0.02, seatH - 0.03, under(sF - 0.02, 0.32), 0.15 * k]], 'tail_cowl');
      if (!tb) {
        // luggage rack over the tail, on a post, with integrated grab handles
        grabRails(ra.x + 0.24, ra.x - 0.08, seatH - 0.02, seatH + 0.065, 0.16 * k, mats.black);
        mesh(roundedBox(0.24, 0.014, 0.2, 0.004), mats.black, { parent: body, at: [ra.x - 0.04, cowl(ra.x - 0.04).yt + 0.012, 0], name: 'rack' });
      } else grabRails(ra.x + 0.3, ra.x + 0.05, seatH - 0.04, seatH + 0.01, 0.17 * k, mats.chrome);
      rearLamp = { tail: [xt, seatH - 0.01], tw: 0.1, th: 0.035, brake: [xt + 0.002, seatH - 0.045], bw: 0.08, bh: 0.014 };
      hangFrom = [ra.x - 0.02, cowl(ra.x - 0.02).yb + 0.005];
      deck = cowl(tbx).yt;
    } else if (v.tail === 'fender') {
      const tw2 = v.tyreW[1] / 2 + 0.04;
      const strutF = [pivot.x + 0.05, Math.min(pivot.y + 0.3, seatH - 0.1)];
      const strutR = [ra.x + 0.1, rR + 0.32];
      const fy = (x) => rR + Math.sqrt(Math.max(0, (rR + 0.04) ** 2 - (x - ra.x) ** 2));
      mesh(guard(rR + 0.04, v.tyreW[1] + 0.06, 40, 205), mats.guard, { parent: body, at: P(ra) });
      for (const s of [1, -1]) tube([strutR[0], strutR[1], s * tw2], [strutF[0], strutF[1], s * 0.09], 0.014, mats.chrome, { parent: body, name: 'fender_strut' });
      crossTube(strutF[0], strutF[1], 0.09, 0.014);
      const sprung = v.bars === 'ape' || v.chromeTank;
      if (sprung) {
        // solo sprung saddle: nose pivot on the backbone, two coil springs at the back
        const sx = pivot.x - 0.02;
        pad([[sx - 0.2, seatH + 0.07, seatH, 0.14], [sx - 0.1, seatH + 0.02, seatH - 0.05, 0.165], [sx + 0.04, seatH + 0.01, seatH - 0.05, 0.11], [sx + 0.17, seatH + 0.04, seatH - 0.01, 0.045]], 'seat', 0.6);
        tube([sx + 0.15, seatH, 0], [bb[2][0], bb[2][1], 0], 0.012, mats.chrome, { parent: body, name: 'saddle_nose' });
        const x = sx - 0.12;
        const yb = seatH - 0.13;
        const swY = lerp(pivot.y, ra.y, clamp01((pivot.x - x) / (pivot.x - ra.x)));
        crossTube(x, yb, swZ, 0.012);
        for (const s of [1, -1]) {
          tube([x, yb, s * swZ], [x, swY, s * swZ], 0.012, mats.frame, { parent: body });
          curveTube(coilPts([x, yb, s * 0.08], [x, seatH - 0.02, s * 0.08], 0.02, 6, 0, 1), 0.004, mats.chrome, { parent: body, segments: 120, radialSegments: 5, name: 'saddle_spring' });
          tube([x, yb, s * 0.08], [x, seatH - 0.02, s * 0.08], 0.006, mats.chrome, { parent: body });
        }
      } else {
        // stepped two-up seat: deep rider bucket, pillion pad over the fender
        pad([[ra.x - 0.02, fy(ra.x - 0.02) + 0.08, fy(ra.x - 0.02) - 0.01, 0.08], [ra.x + 0.12, fy(ra.x + 0.12) + 0.1, fy(ra.x + 0.12) - 0.01, 0.11], [pivot.x - 0.16, seatH + 0.07, seatH - 0.05, 0.13], [pivot.x - 0.04, seatH, seatH - 0.07, 0.17], [pivot.x + 0.1, seatH + 0.02, seatH - 0.07, 0.14], [Math.max(xb + 0.04, pivot.x + 0.2), seatH + 0.03, seatH - 0.05, 0.08]], 'seat');
      }
      if (vt && v.bars !== 'ape') {
        // twin shocks: swingarm → fender struts
        for (const s of [1, -1]) {
          const S = pivot.clone().lerp(ra, 0.85);
          const z = s * (swZ + 0.035);
          const tx = lerp(strutR[0], strutF[0], 0.3);
          const ty = lerp(strutR[1], strutF[1], 0.3);
          const tz = lerp(tw2, 0.09, 0.3);
          tube([S.x, S.y, s * swZ], [S.x, S.y, z + s * 0.016], 0.011, mats.chrome, { parent: root });
          tube([tx, ty, s * tz], [tx, ty, z + s * 0.016], 0.011, mats.chrome, { parent: body });
          shock([S.x, S.y, z], [tx, ty, z], 0.015);
        }
      }
      if (v.bars === 'ape') curveTube([[ra.x + 0.1, rR + 0.3, 0.12], [ra.x - 0.05, rR + 0.85, 0.08], [ra.x - 0.05, rR + 0.85, -0.08], [ra.x + 0.1, rR + 0.3, -0.12]], 0.012, mats.chrome, { parent: body });
      for (const s of [1, -1]) mesh(roundedBox(0.26, 0.02, 0.1, 0.008), mats.black, { parent: body, at: [eng.x + 0.22, 0.32, s * 0.24] });
      for (const s of [1, -1]) tube([eng.x + 0.22, 0.32, s * 0.19], [eng.x + 0.1, eng.y - 0.12, s * 0.08], 0.012, mats.black, { parent: body });
      const a = THREE.MathUtils.degToRad(150);
      tailX = ra.x + Math.cos(a) * (rR + 0.05);
      tailY = rR + Math.sin(a) * (rR + 0.05);
      deck = fy(tbx);
    }
  }

  // ---------------- fairings ----------------
  if (v.head === 'fairing') {
    const back = head.x - 0.14;
    panel([[head.x + 0.36, head.y - 0.2], [head.x + 0.18, head.y + 0.02], [back, head.y + 0.0], [eng.x - 0.05, eng.y + 0.12], [eng.x - 0.12, eng.y - 0.12], [head.x + 0.02, eng.y - 0.05], [head.x + 0.22, head.y - 0.3]], 0.44, mats.paint, { bevel: 0.05, taper: (x) => 1 - 0.55 * clamp01((x - back) / 0.5), name: 'fairing' });
    panel([[eng.x + 0.22, eng.y - 0.08], [eng.x - 0.2, eng.y - 0.12], [eng.x - 0.18, eng.y - 0.24], [eng.x + 0.18, eng.y - 0.24]], 0.3, mats.black, { bevel: 0.05, name: 'belly_pan' });
    const scr = v.screen === 'tall' ? 0.14 : v.screen === 'race' ? 0.06 : 0;
    panel([[head.x + 0.2, head.y + 0.0], [head.x + 0.04, head.y + 0.16 + scr], [head.x + 0.02, head.y + 0.15 + scr], [head.x + 0.18, head.y - 0.01]], 0.3, mats.glass, { bevel: 0.008, name: 'screen' });
    for (const s of [1, -1]) headL.add(body, { at: [head.x + 0.31, head.y - 0.17, s * 0.075], normal: [1, 0.1, s * 0.45], w: 0.1, h: 0.04, depth: 0.012, bezel: false });
    for (const [s, n] of [[-1, 'L'], [1, 'R']]) ind[n].add(body, { at: [head.x + 0.12, head.y - 0.08, s * 0.24], normal: [0.6, 0, s], w: 0.06, h: 0.025, depth: 0.01, bezel: false });
  } else if (v.head === 'touring' || v.head === 'beak') {
    const big = v.head === 'touring';
    const back = head.x - 0.12;
    const w = big ? 0.66 : 0.42;
    panel([[head.x + (big ? 0.34 : 0.26), head.y - (big ? 0.12 : 0.1)], [head.x + 0.16, head.y + (big ? 0.2 : 0.1)], [back, head.y + (big ? 0.16 : 0.06)], [back - 0.04, head.y - (big ? 0.3 : 0.24)], [head.x + 0.2, head.y - (big ? 0.32 : 0.26)]], w, mats.paint, { bevel: 0.08, taper: (x) => 1 - 0.4 * clamp01((x - back) / 0.45), name: 'fairing' });
    const scr = (big ? 0.34 : 0.26) + (v.screen === 'tall' ? 0.12 : 0);
    panel([[head.x + 0.17, head.y + (big ? 0.18 : 0.08)], [head.x + 0.0, head.y + scr], [head.x - 0.015, head.y + scr - 0.01], [head.x + 0.15, head.y + (big ? 0.17 : 0.07)]], big ? 0.52 : 0.34, mats.glass, { bevel: 0.008, name: 'screen' });
    // screen frame / trim
    for (const s of [1, -1]) tube([head.x + 0.16, head.y + (big ? 0.18 : 0.08), s * (big ? 0.24 : 0.15)], [head.x + 0.01, head.y + scr - 0.02, s * (big ? 0.24 : 0.15)], 0.009, mats.black, { parent: body });
    for (const s of [1, -1]) headL.add(body, { at: [head.x + (big ? 0.3 : 0.22), head.y - 0.06, s * 0.1], normal: [1, 0, s * 0.3], w: big ? 0.14 : 0.1, h: 0.07, depth: 0.012, bezel: false });
    for (const [s, n] of [[-1, 'L'], [1, 'R']]) ind[n].add(body, { at: [head.x + 0.14, head.y - 0.12, s * (w / 2 - 0.02)], normal: [0.6, 0, s], w: 0.06, h: 0.03, depth: 0.01, bezel: false });
    if (!big) {
      // beak fender under the fairing nose
      panel([[0.12, fl - 0.24], [0.26, fl - 0.34], [0.22, fl - 0.3], [0.06, fl - 0.18]], 0.14, mats.paint, { bevel: 0.03, parent: steer });
      // crash bars
      for (const s of [1, -1]) curveTube([[eng.x + 0.25, eng.y + 0.2, s * 0.13], [eng.x + 0.25, eng.y - 0.05, s * 0.27], [eng.x + 0.05, eng.y - 0.2, s * 0.22], [eng.x - 0.05, eng.y - 0.2, s * 0.13]], 0.014, mats.black, { parent: body });
    }
    if (big) {
      // touring luggage always
      v.panniers = true;
      v.topBox = true;
    }
  }

  // ---------------- exhaust ----------------
  if (v.exhaust === 'under') {
    curveTube([P(eng, 0.2, 0.0, 0.05), P(eng, 0.15, -0.22, 0.08), P(eng, -0.15, -0.24, 0.1), [pivot.x - 0.08, pivot.y - 0.14, 0.12]], 0.022, mats.alu, { parent: body });
    mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.38, 24).rotateZ(Math.PI / 2 - 0.3), M.metal('#9fa4aa', 0.2), { parent: body, at: [pivot.x - 0.26, pivot.y - 0.07, 0.15] });
  } else if (v.exhaust === 'side') {
    curveTube([P(eng, 0.18, 0.05, 0.08), P(eng, 0.12, -0.2, 0.12), [pivot.x + 0.1, pivot.y - 0.16, 0.15], [ra.x + 0.35, rR + 0.02, 0.17]], 0.022, mats.chrome, { parent: body });
    mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.45, 24).rotateZ(Math.PI / 2 - 0.12), v.tail === 'cafe' ? mats.chrome : M.metal('#2b2b2d', 0.3), { parent: body, at: [ra.x + 0.15, rR + 0.06, 0.18] });
    tube([ra.x + 0.15, rR + 0.06, 0.13], [ra.x + 0.1, rR + 0.14, swZ + 0.03], 0.01, mats.black, { parent: body });
  } else if (v.exhaust === 'high') {
    curveTube([P(eng, 0.2, 0.05, 0.06), P(eng, 0.12, -0.15, 0.12), [pivot.x, pivot.y + 0.12, 0.14], [ra.x + 0.35, seatH - 0.12, 0.13]], 0.022, mats.alu, { parent: body });
    mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.36, 24).rotateZ(Math.PI / 2 - 0.25), mats.alu, { parent: body, at: [ra.x + 0.25, seatH - 0.1, 0.13] });
  } else if (v.exhaust === 'twin') {
    for (const k of [0, 1]) curveTube([P(eng, 0.08 - k * 0.12, 0.12, 0.08), P(eng, 0.15 - k * 0.12, -0.1, 0.16), [eng.x - 0.25, 0.3 + k * 0.08, 0.2], [ra.x - 0.12, 0.34 + k * 0.08, 0.2]], 0.026, mats.chrome, { parent: body });
  } else if (v.exhaust === 'twin-low') {
    for (const s of [1, -1]) curveTube([P(eng, 0.15, -0.15, s * 0.12), P(eng, -0.1, -0.24, s * 0.16), [ra.x + 0.3, rR - 0.05, s * 0.2], [ra.x - 0.05, rR - 0.02, s * 0.2]], 0.03, mats.chrome, { parent: body });
  }
  if (v.skid) mesh(sculpt(smoothShape([[eng.x + 0.25, eng.y - 0.12], [eng.x - 0.2, eng.y - 0.2], [eng.x - 0.18, eng.y - 0.26], [eng.x + 0.22, eng.y - 0.22]]), 0.26, { bevel: 0.02 }), mats.alu, { parent: body, name: 'skid_plate' });

  // ---------------- luggage ----------------
  if (v.panniers) {
    for (const s of [1, -1]) {
      const pz = s * (v.tyreW[1] / 2 + 0.2);
      const pn = panel([[ra.x + 0.38, rR + 0.08], [ra.x + 0.36, seatH - 0.12], [ra.x - 0.22, seatH - 0.12], [ra.x - 0.24, rR + 0.06]], 0.2, v.police ? mats.white : mats.paint, { bevel: 0.05, name: 'pannier' });
      pn.position.z = pz;
      // mounting rails to the subframe
      if (hasRails) tube([ra.x + 0.1, railY(ra.x + 0.1), s * rz], [ra.x + 0.1, railY(ra.x + 0.1), pz - s * 0.1], 0.012, mats.black, { parent: body });
      else tube([ra.x + 0.1, seatH - 0.16, s * 0.09], [ra.x + 0.1, seatH - 0.16, pz - s * 0.1], 0.012, mats.black, { parent: body });
      tube([ra.x + 0.3, rR + 0.12, s * (swZ + 0.02)], [ra.x + 0.3, rR + 0.12, pz - s * 0.1], 0.012, mats.black, { parent: body });
      if (v.police) decal(body, textMaterial('POLICE', { color: '#0d47a1' }), { at: [ra.x + 0.07, (rR + seatH) / 2, pz + s * 0.101], normal: [0, 0, s], w: 0.48, h: 0.12 });
    }
  }
  if (v.topBox) {
    const tbx = ra.x - 0.06;
    mesh(cushion(0.36, 0.28, 0.4, { radius: 0.08, bulge: 0.1 }), v.police ? mats.white : mats.paint, { parent: body, at: [tbx, deck + 0.18, 0], name: 'top_box' });
    mesh(roundedBox(0.3, 0.04, 0.3, 0.012), mats.black, { parent: body, at: [tbx + 0.02, deck + 0.02, 0], name: 'top_box_plate' });
    for (const s2 of [1, -1]) tube([tbx + 0.02, deck + 0.01, s2 * 0.13], [tbx + 0.17, deck - 0.05, s2 * 0.07], 0.012, mats.black, { parent: body });
  }
  if (v.police) {
    // rear light bar on a mast: red / blue
    const red = lampGroup('siren_red', 'red');
    const blue = lampGroup('siren_blue', 'blue');
    const by = v.topBox ? deck + 0.36 : deck + 0.12;
    tube([ra.x - 0.08, by - 0.12, 0], [ra.x - 0.08, by, 0], 0.012, mats.black, { parent: body });
    if (!v.topBox) mesh(roundedBox(0.12, 0.06, 0.14, 0.02), mats.black, { parent: body, at: [ra.x - 0.08, by - 0.14, 0] });
    if (!v.topBox) for (const s2 of [1, -1]) tube([ra.x - 0.08, by - 0.15, s2 * 0.06], [ra.x + 0.1, deck - 0.06, s2 * 0.06], 0.012, mats.black, { parent: body });
    red.add(body, { at: [ra.x - 0.08, by + 0.03, -0.09], normal: [-1, 0, 0], w: 0.12, h: 0.06, depth: 0.03 });
    blue.add(body, { at: [ra.x - 0.08, by + 0.03, 0.09], normal: [-1, 0, 0], w: 0.12, h: 0.06, depth: 0.03 });
  }
  if (v.race) {
    const num = String(7 + (variant.length * 3) % 90);
    for (const s of [1, -1]) decal(body, textMaterial(num, { color: '#111', font: 'bold 110px Arial' }), { at: [(xr + ra.x) / 2 - 0.05, seatH + 0.02, s * 0.115], normal: [0, 0.2, s], w: 0.22, h: 0.12 });
  }

  // ---------------- studio emblems (flush, no backing) ----------------
  if (!scooter) {
    for (const [s, n] of [[1, 'R'], [-1, 'L']]) {
      const e = brandEmblem(0.065, { name: `emblem_tank_${n}` });
      e.scale.z = 0.25;
      e.position.set(tankX, tankY, s * (tankZ + 0.002));
      if (s < 0) e.rotation.y = Math.PI;
      body.add(e);
    }
  } else {
    const e = brandEmblem(0.08, { name: 'emblem_front' });
    e.scale.z = 0.25;
    e.position.set(head.x + 0.0, 0.62, 0);
    e.rotation.set(0, Math.PI / 2, 0);
    e.rotateX(-0.32);
    body.add(e);
  }

  // ---------------- rear lights, plate, indicators ----------------
  if (rearLamp) {
    // lamps set into the tail bodywork
    const L = rearLamp;
    tailL.add(body, { at: [L.tail[0] + 0.004, L.tail[1], 0], normal: [-1, 0.08, 0], w: L.tw, h: L.th, depth: 0.012, shape: L.shape ?? 'rect', bezel: !!L.bezel });
    brakeL.add(body, { at: [L.brake[0] + 0.004, L.brake[1], 0], normal: [-1, 0, 0], w: L.bw, h: L.bh, depth: 0.01, bezel: false });
  } else {
    tailL.add(body, { at: [tailX, tailY, 0], normal: [-1, 0.15, 0], w: 0.13, h: 0.045, depth: 0.02 });
    brakeL.add(body, { at: [tailX + 0.012, tailY - 0.05, 0], normal: [-1, 0, 0], w: 0.1, h: 0.03, depth: 0.015, bezel: false });
  }
  // plate hanger from under the tail (clear of the tyre) + licence plate with text
  const px = hangFrom ? ra.x - 0.2 : tailX - 0.02;
  const py = hangFrom ? rR + Math.sqrt(Math.max(0, (rR + 0.03) ** 2 - 0.04)) + 0.075 : Math.max(rR + 0.18, tailY - 0.22);
  const h0 = hangFrom ?? [tailX + 0.06, tailY - 0.05];
  tube([h0[0], h0[1], 0], [px + 0.02, py + 0.06, 0], 0.014, mats.black, { parent: body, name: 'plate_hanger' });
  mesh(roundedBox(0.015, 0.11, 0.17, 0.005), mats.black, { parent: body, at: [px + 0.01, py, 0], rot: [0, 0, 0.25] });
  const plate = mesh(new THREE.PlaneGeometry(0.16, 0.1), plateMaterial('MC 42'), { parent: body, at: [px, py, 0], rot: [0, -Math.PI / 2, 0] });
  plate.rotateX(-0.25);
  for (const [s, n] of [[-1, 'L'], [1, 'R']]) {
    tube([px + 0.02, py + 0.04, s * 0.06], [px + 0.02, py + 0.05, s * 0.14], 0.006, mats.black, { parent: body });
    ind[n].add(body, { at: [px + 0.0, py + 0.05, s * 0.15], normal: [-1, 0, s * 0.3], w: 0.045, h: 0.03, shape: 'round', depth: 0.02 });
  }
  // footpegs + side stand (left, -Z)
  for (const s of [1, -1]) if (v.tail !== 'fender' && !scooter) {
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 10).rotateX(Math.PI / 2), mats.alu, { parent: body, at: [pivot.x + 0.02, pivot.y - 0.08, s * 0.17] });
    tube([pivot.x + 0.02, pivot.y - 0.08, s * 0.12], [pivot.x + 0.02, pivot.y - 0.02, s * 0.08], 0.014, mats.alu, { parent: body });
  }
  tube([pivot.x + 0.12, pivot.y - 0.12, -0.1], [pivot.x - 0.05, 0.02, -0.26], 0.012, mats.black, { parent: body });
  mesh(roundedBox(0.04, 0.04, 0.06, 0.01), mats.black, { parent: body, at: [pivot.x + 0.12, pivot.y - 0.12, -0.08] });

  // ---------------- animations ----------------
  const spots = o.lights === false ? [] : addHeadlightSpots(root, [head.x + 0.3, head.y - 0.1, 0.04]);
  const set = vehicleAnimations({
    spins: [front, rear], steers: [steer], radius: rR, speed: o.speed ?? 10, steerMax: 0.4, spots,
    lamps: { head: 'headlights', tail: 'taillights', brake: 'brakelights', signalL: 'indicator_L', signalR: 'indicator_R' },
  });
  const animations = [...set.animations];
  // lean into curves (rolls about the tyre contact line) + suspension bob
  animations.push(clip('lean', 4, [rotateTrack(root, 'x', 4, (t) => Math.sin(t * Math.PI * 2) * 0.35, 32), rotateTrack(steer, 'y', 4, (t) => -Math.sin(t * Math.PI * 2) * 0.08, 32)]));
  animations.push(clip('suspension', 1.2, [moveTrack(body, 1.2, (t) => [0, Math.sin(t * Math.PI * 2) * 0.015, 0], 16)]));
  if (v.police) animations.push(sirenClip('siren_red', 'siren_blue'));
  const bike = finalize(root, { type: 'motorcycle', variant, options: o, animations });
  bike.userData.premade.oneShot = set.oneShot;
  bike.userData.premade.exclusive = set.exclusive;
  return bike;
}
