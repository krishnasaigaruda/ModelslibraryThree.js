import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, tube, extrudeOutline, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { spinTrack, moveTrack, rotateTrack, numberTrack, clip, wave } from '../../core/animation.js';
import { brandEmblem } from '../../core/brand.js';
import { navLights, sirenClip } from './misc-kit.js';
import { lampGroup } from '../../core/lamps.js';

/* ------------------------------------------------------------------ */
/* Shared helpers for aircraft / boats (exported for airplane.js etc.) */
/* ------------------------------------------------------------------ */

/**
 * Smooth tube loft along X with superellipse cross-sections.
 *   section(x) → { cy, a (half width), bt (half height above cy), bb (below), n (roundness, 2 = ellipse) }
 *   region(x, theta, point) → material group index, or -1 to leave a hole.
 * θ = 0 at +Z, π/2 at top, π at −Z, 3π/2 at bottom.
 */
export function tubeLoft({ x0, x1, stations = 90, ring = 48, breaks = [], section, region = () => 0 }) {
  let xs = [];
  for (let i = 0; i <= stations; i++) {
    const t = i / stations;
    const s = 0.5 * t + 0.5 * (0.5 - 0.5 * Math.cos(Math.PI * t));
    xs.push(x0 + (x1 - x0) * s);
  }
  for (const b of breaks) if (b > x0 && b < x1) xs.push(b);
  xs.sort((a, b) => a - b);
  xs = xs.filter((x, i) => i === 0 || x - xs[i - 1] > 0.004);
  const S = xs.length;
  const R = ring;
  const pt = (x, th) => {
    const s = section(x);
    const n = s.n ?? 2;
    const c = Math.cos(th);
    const sn = Math.sin(th);
    const a = Math.max(s.a, 0.0005);
    const b = sn >= 0 ? Math.max(s.bt, 0.0005) : Math.max(s.bb ?? s.bt, 0.0005);
    const nn = sn >= 0 ? n : s.nb ?? n;
    return new THREE.Vector3(x, s.cy + b * Math.sign(sn) * Math.abs(sn) ** (2 / nn), a * Math.sign(c) * Math.abs(c) ** (2 / n));
  };
  const pos = new Float32Array(S * R * 3);
  for (let i = 0; i < S; i++) {
    for (let j = 0; j < R; j++) {
      const p = pt(xs[i], (j / R) * Math.PI * 2);
      pos.set([p.x, p.y, p.z], (i * R + j) * 3);
    }
  }
  const groups = new Map();
  for (let i = 0; i < S - 1; i++) {
    const xm = (xs[i] + xs[i + 1]) / 2;
    for (let j = 0; j < R; j++) {
      const thm = ((j + 0.5) / R) * Math.PI * 2;
      const g = region(xm, thm, pt(xm, thm));
      if (g < 0) continue;
      const a = i * R + j;
      const b = i * R + ((j + 1) % R);
      const c = (i + 1) * R + j;
      const d = (i + 1) * R + ((j + 1) % R);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const index = [];
  for (const g of [...groups.keys()].sort((a, b) => a - b)) {
    const arr = groups.get(g);
    geo.addGroup(index.length, arr.length, g);
    index.push(...arr);
  }
  geo.setIndex(index);
  geo.computeVertexNormals();
  const at = (x, th) => {
    const p = pt(x, th);
    const dx = pt(x + 0.01, th).sub(pt(x - 0.01, th));
    const dt = pt(x, th + 0.01).sub(pt(x, th - 0.01));
    return { point: p, normal: dx.cross(dt).normalize() };
  };
  return { geometry: geo, at, section };
}

/** Smooth step 0→1 between e0 and e1. */
export const sstep = (e0, e1, x) => {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Tapered aerofoil surface (wings, fins, stabilisers, blades).
 * Built in local space: span along +Z (or −Z when side = −1), chord along X (leading edge +X), thickness Y.
 */
export function wingGeometry({ span, rootChord, tipChord, sweep = 0, dihedral = 0, thickness = 0.12, side = 1, segs = 10, chordSegs = 16, twist = 0, from = 0, to = 1, spanFrom = 0, spanTo = 1, cap = true }) {
  const rows = segs + 1;
  const cols = chordSegs;
  const pos = [];
  // closed aerofoil loop: upper surface LE→TE then lower TE→LE
  const loop = [];
  for (let k = 0; k <= cols; k++) {
    const u = k / cols;
    const xc = 1 - (1 - Math.cos(Math.PI * u)) / 2; // 1 (LE) → 0 (TE), cosine-clustered
    loop.push([xc, 1]);
  }
  for (let k = cols - 1; k > 0; k--) {
    const u = k / cols;
    loop.push([1 - (1 - Math.cos(Math.PI * u)) / 2, -1]);
  }
  const L = loop.length;
  const naca = (x) => 5 * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
  for (let r = 0; r < rows; r++) {
    const t = spanFrom + (spanTo - spanFrom) * (r / segs);
    const chord = lerp(rootChord, tipChord, t);
    const z = side * span * t;
    const le = -sweep * t; // leading edge moves back with sweep
    const yOff = dihedral * span * t;
    const tw = twist * t;
    for (const [xc, sgn] of loop) {
      // xc: 1 at LE, 0 at TE → local x from LE
      const xFromLE = from + (to - from) * (1 - xc);
      const th = naca(xFromLE) * thickness * chord;
      let x = le + chord * 0.25 - xFromLE * chord; // quarter-chord at origin
      let y = sgn * th;
      const cx = x - le;
      const nx = cx * Math.cos(tw) - y * Math.sin(tw);
      const ny = cx * Math.sin(tw) + y * Math.cos(tw);
      x = le + nx;
      y = ny + yOff;
      pos.push(x, y, z);
    }
  }
  const index = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let k = 0; k < L; k++) {
      const a = r * L + k;
      const b = r * L + ((k + 1) % L);
      const c = (r + 1) * L + k;
      const d = (r + 1) * L + ((k + 1) % L);
      if (side > 0) index.push(a, b, c, b, d, c);
      else index.push(a, c, b, b, c, d);
    }
  }
  const capEnd = (rowStart, flip) => {
    const ci = pos.length / 3;
    let ax = 0, ay = 0, az = 0;
    for (let k = 0; k < L; k++) { ax += pos[(rowStart + k) * 3]; ay += pos[(rowStart + k) * 3 + 1]; az += pos[(rowStart + k) * 3 + 2]; }
    pos.push(ax / L, ay / L, az / L);
    for (let k = 0; k < L; k++) {
      const a = rowStart + k;
      const b = rowStart + ((k + 1) % L);
      if ((side > 0) !== flip) index.push(a, b, ci); else index.push(a, ci, b);
    }
  };
  if (!cap) {
    const g0 = new THREE.BufferGeometry();
    g0.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g0.setIndex(index);
    g0.computeVertexNormals();
    return g0;
  }
  if (spanFrom > 0) capEnd(0, true);
  // tip cap (fan)
  const tipStart = (rows - 1) * L;
  const cIdx = pos.length / 3;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (let k = 0; k < L; k++) {
    cx += pos[(tipStart + k) * 3];
    cy += pos[(tipStart + k) * 3 + 1];
    cz += pos[(tipStart + k) * 3 + 2];
  }
  pos.push(cx / L, cy / L, cz / L);
  for (let k = 0; k < L; k++) {
    const a = tipStart + k;
    const b = tipStart + ((k + 1) % L);
    if (side > 0) index.push(a, b, cIdx);
    else index.push(a, cIdx, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** Rotor blade: tapered aerofoil, span along +X from the hub. */
export function bladeGeometry(len, rootChord, tipChord, thick = 0.1) {
  const g = wingGeometry({ span: len, rootChord, tipChord, thickness: thick, segs: 8, chordSegs: 8, twist: -0.12 });
  g.rotateY(Math.PI / 2); // span +Z → +X ... chord now along Z
  return g;
}

/** Build a rotor: hub, grips, n blades. `axis` 'y' (main) or 'z' (tail). */
export function buildRotor(name, { blades = 4, radius = 5, chord = 0.32, hubR = 0.18, bladeMat, hubMat }) {
  const rotor = group(name);
  mesh(new THREE.CylinderGeometry(hubR, hubR * 1.1, hubR * 1.1, 20), hubMat, { parent: rotor });
  mesh(new THREE.SphereGeometry(hubR * 0.8, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), hubMat, { parent: rotor, at: [0, hubR * 0.5, 0] });
  const blade = bladeGeometry(radius - hubR * 1.6, chord, chord * 0.7, 0.11);
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2;
    const arm = group(null, { parent: rotor, rot: [0, a, 0] });
    mesh(roundedBox(hubR * 1.4, hubR * 0.45, hubR * 0.7, hubR * 0.15), hubMat, { parent: arm, at: [hubR * 1.2, 0, 0] });
    mesh(blade, bladeMat, { parent: arm, at: [hubR * 1.6, 0, 0], rot: [0.06, 0, 0] });
    // yellow tip band
    
  }
  return rotor;
}

export function glassMaterial(opacity = 0.45, tint = '#0e161c') {
  return new THREE.MeshPhysicalMaterial({
    name: 'glass', color: tint, roughness: 0.03, transparent: true, opacity, clearcoat: 1,
    envMapIntensity: 1.4, side: THREE.DoubleSide, depthWrite: false,
  });
}

/** Put the studio emblem on a surface point, flush (ring half-depth ≈ 0.065·size). */
export function emblemOn(parent, { point, normal }, size, name = 'emblem') {
  // flattened so it reads like a flush badge on curved skin, not a ring stuck on
  const e = brandEmblem(size, { name });
  e.scale.z = 0.25;
  e.position.copy(point).addScaledVector(normal, size * 0.018 + 0.002);
  e.lookAt(e.position.clone().add(normal));
  parent.add(e);
  return e;
}

/** Surface point on a vertical fin built by wingGeometry (span → +Y) at span fraction t, chord fraction c, side ±1. */
export function finPoint(at, w, t, c, side) {
  const chord = lerp(w.root, w.tip, t);
  const le = at[0] - w.sweep * t + chord * 0.25;
  const naca = (x) => 5 * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
  const half = naca(c) * (w.thick ?? 0.11) * chord;
  return { point: new THREE.Vector3(le - c * chord, at[1] + w.span * t, at[2] + side * half), normal: new THREE.Vector3(0, 0, side) };
}

export function interiorMaterial(color = '#26282b') {
  return new THREE.MeshStandardMaterial({ name: 'interior', color, roughness: 0.9, side: THREE.BackSide });
}

/* ------------------------------------------------------------------ */
/* Helicopter                                                          */
/* ------------------------------------------------------------------ */

export const HELICOPTER_VARIANTS = {
  civil: { color: '#f4f5f6', accent: '#1565c0', blades: 4, radius: 5.3 },
  rescue: { color: '#d32f2f', accent: '#f4f5f6', blades: 4, radius: 5.3, winch: true, searchlight: true },
  police: { color: '#1a2a52', accent: '#f4f5f6', blades: 4, radius: 5.3, searchlight: true, belly: '#f4f5f6' },
  military: { color: '#4b5320', accent: '#3a4019', blades: 2, radius: 6.4, matte: true, openDoors: true, scale: 1.18 },
  news: { color: '#f4f5f6', accent: '#ef6c00', blades: 4, radius: 5.3, camera: true },
  medical: { color: '#f5c400', accent: '#c62828', blades: 4, radius: 5.3, cross: true, belly: '#f4f5f6' },
  transport: { color: '#5d6532', accent: '#454b24', tandem: true, matte: true },
};

/** Trims: equipment packages that change the airframe's parts. */
export const HELICOPTER_TRIMS = {
  floats: { floats: true },
  wheels: { wheels: true },
  skis: { skis: true },
  utility: { cargoHook: true, steps: true, basket: true },
  firefighting: { bucket: true, color: '#c62828', accent: '#f2c200' },
  vip: { vip: true, steps: true, color: '#101418', accent: '#b08d57' },
};
export const HELICOPTER_TRIM_NAMES = { transport: ['firefighting', 'utility', 'skis', 'medevac', 'airline'] };

export function createHelicopter(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(HELICOPTER_VARIANTS, o.variant, 'helicopter');
  const trim = o.trim ?? null;
  const v = { ...HELICOPTER_VARIANTS[variant], ...(trim ? (trim === 'medevac' ? { cross: true, color: '#f4f5f6', accent: '#c62828', matte: false } : trim === 'airline' ? { color: '#f4f5f6', accent: '#1565c0', matte: false, airline: true } : HELICOPTER_TRIMS[trim]) : {}) };
  if (trim && !v) throw new Error(`[three-premade] Unknown helicopter trim "${trim}"`);
  const root = group(`helicopter-${variant}`);
  const airframe = group('airframe', { parent: root });
  const paint = v.matte
    ? new THREE.MeshStandardMaterial({ name: 'paint', color: M.toColor(o.color ?? v.color), roughness: 0.75, metalness: 0.1 })
    : M.paint(o.color ?? v.color, { metallic: 0.35, roughness: 0.3 });
  const accent = v.matte
    ? new THREE.MeshStandardMaterial({ name: 'accent', color: M.toColor(o.accentColor ?? v.accent), roughness: 0.8 })
    : M.paint(o.accentColor ?? v.accent, { metallic: 0.3 });
  const belly = v.belly ? M.paint(v.belly, { metallic: 0.3 }) : accent;
  const glass = glassMaterial(0.4);
  const darkMetal = M.metal('#2a2c2f', 0.45);
  const bladeMat = new THREE.MeshStandardMaterial({ name: 'blade', color: '#1d1e20', roughness: 0.55, metalness: 0.3 });
  // panel gaps: a darker shade of the paint, not a drawn black line
  const seam = new THREE.MeshStandardMaterial({ name: 'seam', color: M.toColor(o.color ?? v.color).clone().multiplyScalar(0.55), roughness: 0.7, metalness: 0.2 });

  if (v.tandem) return buildTandem(root, airframe, o, variant, { paint, accent, glass, darkMetal, bladeMat, v, trim });

  // ---------------- fuselage (cabin → tail boom, one surface) ----------------
  const CY = 1.42;
  const section = (x) => {
    if (x >= -1.0) {
      const t = THREE.MathUtils.clamp((x - 0.95) / 1.1, 0, 1);
      const f = (1 - t ** 2.3) ** (1 / 2.3);
      return { cy: CY - 0.18 * t * t, a: 0.74 * f, bt: 0.74 * f ** 0.85, bb: 0.56 * f ** 0.7, n: 2.25, nb: 2.6 };
    }
    if (x >= -2.0) {
      const t = sstep(-1.0, -2.0, x);
      return { cy: lerp(CY, 1.76, t), a: lerp(0.74, 0.27, t), bt: lerp(0.74, 0.29, t), bb: lerp(0.56, 0.24, t), n: lerp(2.25, 2, t), nb: lerp(2.6, 2, t) };
    }
    const t = THREE.MathUtils.clamp((-2.0 - x) / 4.1, 0, 1);
    const r = lerp(0.27, 0.1, t);
    const end = x < -6.0 ? Math.sqrt(Math.max(0, 1 - ((-6.0 - x) / 0.12) ** 2)) : 1;
    return { cy: lerp(1.76, 1.98, t), a: r * end, bt: lerp(0.29, 0.12, t) * end, bb: lerp(0.24, 0.1, t) * end, n: 2 };
  };
  // groups: 0 paint, 1 glass, 2 accent, 3 belly, 4 seam
  const region = (x, th, p) => {
    const s = section(x);
    const yRel = (p.y - s.cy) / (p.y > s.cy ? s.bt : s.bb);
    const side = Math.abs(p.z) > s.a * 0.35;
    // canopy (front, upper) + chin windows
    if (x > 0.55 && yRel > -0.25) return 1;
    if (x > 1.35 && yRel > -0.85 && side) return 1;
    // side cabin windows / open doors
    if (x > -1.15 && x < 0.38 && yRel > -0.05 && yRel < 0.68 && side) return v.openDoors && p.z < 0 ? -1 : 1;
    if (v.openDoors && p.z < 0 && x > -1.15 && x < 0.38 && yRel > -0.85 && yRel < 0.68 && side) return -1;
    // door seams
    if (side && yRel < -0.05 && yRel > -0.85 && (Math.abs(x - 0.42) < 0.004 || Math.abs(x + 1.2) < 0.004)) return 4;
    // stripe along the side
    if (x < 1.35 && x > -5.9 && yRel > -0.5 && yRel < -0.3) return 2;
    if (yRel < -0.62 && x > -1.6) return 3;
    return 0;
  };
  const loft = tubeLoft({
    x0: -6.12, x1: 2.05, stations: 150, ring: 56, section, region,
    breaks: [0.55, 0.38, 0.416, 0.424, -1.15, -1.204, -1.196, 1.35, -1.6],
  });
  mesh(loft.geometry, [paint, glass, accent, belly, seam], { parent: airframe, name: 'fuselage' });
  mesh(loft.geometry, interiorMaterial(), { parent: airframe, name: 'cabin' });

  // ---------------- interior ----------------
  const seatMat = M.fabric(o.interiorColor ?? '#2c2d30');
  mesh(roundedBox(2.6, 0.04, 1.1, 0.015), M.matte('#3a3c40'), { parent: airframe, at: [0.0, 0.98, 0] });
  for (const z of [0.34, -0.34]) {
    mesh(cushion(0.48, 0.12, 0.46, { radius: 0.05 }), seatMat, { parent: airframe, at: [0.75, 1.22, z] });
    mesh(cushion(0.12, 0.62, 0.46, { radius: 0.05 }), seatMat, { parent: airframe, at: [0.5, 1.55, z], rot: [0, 0, 0.18] });
    mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8), darkMetal, { parent: airframe, at: [1.0, 1.22, z], rot: [0, 0, -0.25] });
  }
  mesh(roundedBox(0.3, 0.32, 1.1, 0.06), M.plastic('#161718'), { parent: airframe, at: [1.35, 1.42, 0], rot: [0, 0, 0.35], name: 'panel' });
  for (const z of [0.25, -0.25]) mesh(new THREE.PlaneGeometry(0.22, 0.16).rotateY(Math.PI / 2).rotateZ(0.35), M.emissive('#5fb3e6', 0.9), { parent: airframe, at: [1.205, 1.48, z] });
  mesh(cushion(0.48, 0.12, 1.15, { radius: 0.05 }), seatMat, { parent: airframe, at: [-0.55, 1.2, 0] });
  mesh(cushion(0.12, 0.6, 1.15, { radius: 0.05 }), seatMat, { parent: airframe, at: [-0.85, 1.5, 0], rot: [0, 0, 0.12] });

  // ---------------- engine deck, mast, exhausts ----------------
  mesh(cushion(2.5, 0.36, 0.86, { radius: 0.16, bulge: 0.2 }), paint, { parent: airframe, at: [-0.55, 2.06, 0], name: 'cowling' });
  for (const s of [1, -1]) {
    mesh(roundedBox(0.34, 0.16, 0.04, 0.015), M.plastic('#0d0d0d'), { parent: airframe, at: [0.15, 2.1, s * 0.425] });
    curveTube([[-1.5, 2.1, s * 0.22], [-1.8, 2.08, s * 0.3], [-1.98, 1.98, s * 0.36]], 0.07, M.metal('#3b3b3d', 0.5), { parent: airframe });
  }
  mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.6, 16), darkMetal, { parent: airframe, at: [-0.15, 2.45, 0] });
  mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 24), M.metal('#7b7e82', 0.3), { parent: airframe, at: [-0.15, 2.48, 0] });

  // ---------------- tail: fin, stabiliser, tail rotor ----------------
  const finGeo = wingGeometry({ span: 0.95, rootChord: 0.9, tipChord: 0.45, sweep: 0.45, thickness: 0.14, segs: 6 });
  finGeo.rotateX(-Math.PI / 2); // span +Z → +Y
  mesh(finGeo, paint, { parent: airframe, at: [-5.75, 2.02, 0] });
  const skegGeo = wingGeometry({ span: 0.45, rootChord: 0.6, tipChord: 0.3, sweep: 0.25, thickness: 0.14, segs: 4 });
  skegGeo.rotateX(Math.PI / 2);
  mesh(skegGeo, paint, { parent: airframe, at: [-5.8, 1.92, 0] });
  for (const s of [1, -1]) {
    mesh(wingGeometry({ span: 0.75, rootChord: 0.5, tipChord: 0.32, sweep: 0.05, thickness: 0.12, side: s, segs: 4 }), paint, { parent: airframe, at: [-4.7, 1.9, 0] });
  }
  const tailRotor = group('tail_rotor', { parent: airframe, at: [-5.95, 2.45, 0.2] });
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12).rotateX(Math.PI / 2), darkMetal, { parent: tailRotor });
  const tb = bladeGeometry(0.62, 0.13, 0.1, 0.12);
  for (let i = 0; i < 2; i++) {
    const arm = group(null, { parent: tailRotor, rot: [0, 0, i * Math.PI + Math.PI / 2] });
    arm.rotation.order = 'ZXY';
    mesh(tb, bladeMat, { parent: arm, at: [0.05, 0, 0], rot: [Math.PI / 2, 0, 0] });
  }

  // ---------------- skids ----------------
  const skidMat = M.metal('#9aa0a6', 0.35);
  if (v.wheels) {
    // fixed tricycle wheels on short struts with fairings
    for (const [x, z] of [[1.25, 0], [-0.9, 0.62], [-0.9, -0.62]]) {
      const bottom = x > 0 ? 0.86 : 0.9;
      mesh(new THREE.CylinderGeometry(0.035, 0.035, bottom - 0.2, 10), darkMetal, { parent: airframe, at: [x, 0.2 + (bottom - 0.2) / 2, z] });
      mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 24).rotateX(Math.PI / 2), M.rubber(), { parent: airframe, at: [x, 0.2, z] });
      mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.13, 16).rotateX(Math.PI / 2), M.metal('#b0b4b8'), { parent: airframe, at: [x, 0.2, z] });
      mesh(cushion(0.5, 0.1, 0.18, { radius: 0.05 }), paint, { parent: airframe, at: [x, bottom - 0.02, z] });
    }
  } else {
    for (const s of [1, -1]) curveTube([[-1.7, 0.08, s], [1.25, 0.08, s], [1.62, 0.16, s], [1.82, 0.42, s]], 0.045, skidMat, { parent: airframe });
    for (const x of [-0.95, 0.75]) {
      curveTube([[x, 0.08, 1], [x, 0.62, 0.92], [x, 0.84, 0.5], [x, 0.9, 0], [x, 0.84, -0.5], [x, 0.62, -0.92], [x, 0.08, -1]], 0.04, skidMat, { parent: airframe, segments: 60 });
      // attachment fittings where the cross tube meets the belly
      for (const s of [1, -1]) mesh(cushion(0.14, 0.1, 0.12, { radius: 0.03 }), darkMetal, { parent: airframe, at: [x, 0.9, s * 0.36] });
    }
    for (const s of [1, -1]) mesh(new THREE.SphereGeometry(0.045, 12, 8), skidMat, { parent: airframe, at: [-1.7, 0.08, s] });
    if (v.floats) for (const s of [1, -1]) {
      // folded emergency floats along the skids + inflated look
      const fl = new THREE.CapsuleGeometry(0.17, 2.7, 6, 18).rotateZ(Math.PI / 2);
      mesh(fl, M.matte('#e8e3d4', 0.8), { parent: airframe, at: [-0.15, 0.24, s * 1.0], name: 'float' });
    }
    if (v.skis) for (const s of [1, -1]) {
      mesh(extrudeOutline([[-1.0, 0], [0.9, 0], [1.05, 0.12], [0.95, 0.06], [-1.0, 0.04]], 0.32, { bevel: 0.015 }), M.matte('#1d1f22', 0.6), { parent: airframe, at: [0.05, 0.0, s * 1.0] });
    }
  }
  if (v.steps) for (const s of [1, -1]) mesh(roundedBox(1.0, 0.04, 0.22, 0.015), M.metal('#2c2e31', 0.4), { parent: airframe, at: [-0.4, 0.62, s * 0.86] });

  // ---------------- main rotor ----------------
  const rotor = buildRotor('rotor', { blades: v.blades, radius: v.radius, chord: v.blades === 2 ? 0.52 : 0.33, hubR: 0.17, bladeMat, hubMat: darkMetal });
  rotor.position.set(-0.15, 2.76, 0);
  airframe.add(rotor);

  // ---------------- variant equipment ----------------
  // lights mounted on the skin: beacon on the boom top, belly beacon, nav lights on the stabiliser tips
  const up = loft.at(-2.4, Math.PI / 2);
  const down = loft.at(-0.35, Math.PI * 1.5);
  const tailEnd = loft.at(-6.05, Math.PI / 2);
  const nav = navLights(airframe, {
    beacon: [[up.point.toArray(), up.normal.toArray()], [down.point.toArray(), down.normal.toArray()]],
    red: [[[-4.83, 1.9, -0.745], [0, 0, -1]]],
    green: [[[-4.83, 1.9, 0.745], [0, 0, 1]]],
    white: [[[tailEnd.point.x - 0.05, tailEnd.point.y, 0], [-1, 0, 0]]],
    landing: [[[1.7, 0.92, 0], [0.5, -1, 0]]],
    size: 0.06,
  });
  if (v.searchlight) {
    // searchlight on a yoke bolted to the belly
    const sl = group('searchlight', { parent: airframe, at: [1.2, 0.86, 0.3] });
    mesh(cushion(0.2, 0.05, 0.16, { radius: 0.02 }), darkMetal, { parent: sl, at: [0, 0.02, 0] });
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 10), darkMetal, { parent: sl, at: [0, -0.04, 0] });
    for (const z of [0.1, -0.1]) mesh(roundedBox(0.04, 0.14, 0.02, 0.008), darkMetal, { parent: sl, at: [0, -0.14, z] });
    mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.22, 20).rotateZ(Math.PI / 2), darkMetal, { parent: sl, at: [0, -0.17, 0] });
    lampGroup('searchlight_lamp', 'head').add(sl, { at: [0.11, -0.17, 0], normal: [1, 0, 0], w: 0.17, h: 0.17, shape: 'round', depth: 0.012, bezel: false });
  }
  if (v.winch) {
    // rescue hoist on a boom above the left door, cable + hook
    const w = group('winch', { parent: airframe, at: [0.1, 2.12, 0] });
    curveTube([[-0.05, 0, -0.3], [0, 0.05, -0.62], [0, 0.03, -0.9]], 0.035, darkMetal, { parent: w });
    mesh(cushion(0.34, 0.18, 0.2, { radius: 0.06 }), M.paint('#f4f5f6'), { parent: w, at: [0, 0.03, -0.98] });
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 6), M.metal('#222'), { parent: w, at: [0, -0.52, -1.02] });
    mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16), M.paint('#f2c200'), { parent: w, at: [0, -1.0, -1.02] });
  }
  if (v.cargoHook || v.bucket) {
    mesh(cushion(0.24, 0.1, 0.2, { radius: 0.03 }), darkMetal, { parent: airframe, at: [-0.3, 0.86, 0] });
    if (v.bucket) {
      for (const a of [0, 2.1, 4.2]) curveTube([[-0.3, 0.8, 0], [-0.3 + Math.cos(a) * 0.35, -1.6, Math.sin(a) * 0.35]], 0.006, M.metal('#333'), { parent: airframe, radialSegments: 4 });
      mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.6, 24, 1, true), M.matte('#d84315', 0.7), { parent: airframe, at: [-0.3, -1.9, 0], name: 'bucket' });
      mesh(new THREE.CircleGeometry(0.32, 24).rotateX(Math.PI / 2), M.matte('#222'), { parent: airframe, at: [-0.3, -2.2, 0] });
    }
  }
  if (v.basket) for (const s of [1, -1]) {
    const bk = group(null, { parent: airframe, at: [-0.4, 0.72, s * 1.15] });
    mesh(roundedBox(1.2, 0.03, 0.4, 0.01), darkMetal, { parent: bk });
    for (const x of [-0.58, 0.58]) for (const z of [-0.19, 0.19]) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6), darkMetal, { parent: bk, at: [x, 0.1, z] });
    curveTube([[-0.58, 0.2, s * 0.19], [0.58, 0.2, s * 0.19]], 0.012, darkMetal, { parent: bk });
    tube([0, 0, -s * 0.2], [0, 0.18, -s * 0.48], 0.02, darkMetal, { parent: bk });
  }
  if (v.vip) for (const s of [1, -1]) {
    const p = loft.at(-0.4, s > 0 ? -0.32 : Math.PI + 0.32);
    const stripe = mesh(roundedBox(4.6, 0.03, 0.006, 0.003), M.metal('#b08d57', 0.25), { parent: airframe });
    stripe.position.copy(p.point).addScaledVector(p.normal, 0.004);
    stripe.position.x = -2.0;
  }

  if (v.camera) {
    const cam = group('camera_ball', { parent: airframe, at: [1.45, 0.78, 0] });
    mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 10), darkMetal, { parent: cam, at: [0, 0.08, 0] });
    mesh(new THREE.SphereGeometry(0.17, 24, 16), M.paint('#e9eaec', { metallic: 0.3 }), { parent: cam, at: [0, -0.1, 0] });
    mesh(new THREE.CircleGeometry(0.07, 20).rotateY(Math.PI / 2), M.glass({ tint: '#08121c' }), { parent: cam, at: [0.172, -0.1, 0] });
  }
  if (v.cross) {
    const red = M.paint('#c62828');
    for (const s of [1, -1]) {
      const p = loft.at(-0.5, s > 0 ? 0.12 : Math.PI - 0.12);
      const c = group(null, { parent: airframe });
      c.position.copy(p.point).addScaledVector(p.normal, 0.012);
      c.lookAt(c.position.clone().add(p.normal));
      mesh(roundedBox(0.34, 0.1, 0.01, 0.004), red, { parent: c });
      mesh(roundedBox(0.1, 0.34, 0.01, 0.004), red, { parent: c });
    }
  }
  // studio emblem: tail boom + cabin doors, both sides
  for (const th of [0, Math.PI]) {
    emblemOn(airframe, loft.at(-3.6, th), 0.12, 'emblem_boom');
    emblemOn(airframe, loft.at(-0.45, th > 0 ? Math.PI + 0.22 : -0.22), 0.16, 'emblem_door');
  }
  if (v.openDoors) {
    // door gunner seat + hand rails visible through the open right door
    curveTube([[-1.1, 2.0, -0.7], [0.3, 2.0, -0.7]], 0.02, darkMetal, { parent: airframe });
  }

  const animations = [
    clip('rotors', 0.3, [spinTrack(rotor, 'y', 0.3, 1), spinTrack(tailRotor, 'z', 0.3, 3)]),
    clip('hover', 3, [moveTrack(airframe, 3, (t) => [0, (v.bucket ? 2.5 : 0) + 0.15 + wave(t) * 0.12, 0])]),
    ...nav.animations,
  ];
  if (v.searchlight) animations.push(clip('searchlight', 1, [new THREE.NumberKeyframeTrack('searchlight_lamp.material.emissiveIntensity', [0, 1], [6, 6]), new THREE.NumberKeyframeTrack('searchlight_lamp_glow.material.opacity', [0, 1], [1, 1])]));
  if (v.scale) airframe.scale.setScalar(v.scale);
  // a hanging bucket means it's flying: lift it so the load clears the ground
  if (v.bucket) { airframe.position.y = 2.5; root.userData.floating = true; }
  return finalize(root, { type: 'helicopter', variant, options: o, animations });
}

/* Tandem-rotor transport (twin rotors, rear ramp). */
function buildTandem(root, airframe, o, variant, { paint, accent, glass, darkMetal, bladeMat, v, trim }) {
  const L = 15;
  const h = L / 2;
  const CY = 1.75;
  const section = (x) => {
    const nose = THREE.MathUtils.clamp((x - (h - 1.6)) / 1.6, 0, 1);
    const tail = THREE.MathUtils.clamp(((-h + 1.2) - x) / 1.2, 0, 1);
    const f = (1 - nose ** 2.2) ** (1 / 2.2);
    return {
      cy: CY - 0.25 * nose * nose + 0.45 * tail,
      a: 1.25 * Math.max(f, 0.001) * (1 - 0.35 * tail),
      bt: 1.2 * f ** 0.8 * (1 - 0.4 * tail),
      bb: 1.15 * f ** 0.6 * (1 - 0.65 * tail),
      n: 3.2,
    };
  };
  const region = (x, th, p) => {
    const s = section(x);
    const yRel = (p.y - s.cy) / (p.y > s.cy ? s.bt : s.bb);
    if (x > h - 1.3 && yRel > -0.2) return 1;
    // row of small round-ish windows
    if (Math.abs(p.z) > s.a * 0.6 && yRel > 0.05 && yRel < 0.3 && x < h - 2.4 && x > -h + 2 && ((x * 1.0) % 1.2 + 1.2) % 1.2 < 0.38) return 1;
    if (yRel < -0.75) return 2;
    return 0;
  };
  const loft = tubeLoft({ x0: -h, x1: h, stations: 170, ring: 56, section, region });
  mesh(loft.geometry, [paint, glass, accent], { parent: airframe, name: 'fuselage' });
  mesh(loft.geometry, interiorMaterial('#3a3d3a'), { parent: airframe, name: 'cabin' });
  // pylons
  mesh(cushion(2.4, 0.9, 1.1, { radius: 0.3, bulge: 0.1 }), paint, { parent: airframe, at: [h - 1.9, CY + 1.35, 0] });
  const rearPylon = extrudeOutline([[-h, CY + 0.9], [-h + 3.4, CY + 0.95], [-h + 2.6, CY + 2.75], [-h + 0.55, CY + 2.75]], 1.2, { bevel: 0.2 });
  mesh(rearPylon, paint, { parent: airframe });
  // sponsons + wheels
  for (const s of [1, -1]) {
    mesh(cushion(4.5, 0.75, 0.6, { radius: 0.25 }), paint, { parent: airframe, at: [0.2, 0.95, s * 1.3] });
    for (const x of [h - 2.2, -1.8, -3.3]) {
      mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 24).rotateX(Math.PI / 2), M.rubber(), { parent: airframe, at: [x, 0.42, s * 1.25] });
      mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 16).rotateX(Math.PI / 2), M.metal('#555'), { parent: airframe, at: [x, 0.42, s * 1.25] });
    }
  }
  const front = buildRotor('rotor_front', { blades: 3, radius: 9, chord: 0.8, hubR: 0.3, bladeMat, hubMat: darkMetal });
  front.position.set(h - 1.9, CY + 1.95, 0);
  const rear = buildRotor('rotor_rear', { blades: 3, radius: 9, chord: 0.8, hubR: 0.3, bladeMat, hubMat: darkMetal });
  rear.position.set(-h + 1.6, CY + 3.05, 0);
  airframe.add(front, rear);
  // rear ramp hinge
  const ramp = group('ramp', { parent: airframe, at: [-h + 1.4, 0.75, 0] });
  mesh(roundedBox(1.6, 0.08, 2.0, 0.03), accent, { parent: ramp, at: [-0.8, 0, 0] });
  const top = loft.at(0, Math.PI / 2);
  const bot = loft.at(-1, Math.PI * 1.5);
  const nav = navLights(airframe, {
    beacon: [[top.point.toArray(), top.normal.toArray()], [bot.point.toArray(), bot.normal.toArray()]],
    red: [[[0.2, 1.0, -1.61], [0, 0, -1]]],
    green: [[[0.2, 1.0, 1.61], [0, 0, 1]]],
    white: [[[-h + 0.6, CY + 2.7, 0], [-1, 0.3, 0]]],
    landing: [[[h - 1.2, CY - 1.0, 0], [0.6, -1, 0]]],
    size: 0.09,
  });
  for (const th of [0.15, Math.PI - 0.15]) for (const x of [h - 3.2, -h + 3.0]) emblemOn(airframe, loft.at(x, th), 0.3, 'emblem');
  if (v.cross) for (const th of [0.05, Math.PI - 0.05]) {
    const p = loft.at(-1.5, th);
    const c = group(null, { parent: airframe });
    c.position.copy(p.point).addScaledVector(p.normal, 0.01);
    c.lookAt(c.position.clone().add(p.normal));
    mesh(roundedBox(0.7, 0.2, 0.01, 0.006), M.paint('#c62828'), { parent: c });
    mesh(roundedBox(0.2, 0.7, 0.01, 0.006), M.paint('#c62828'), { parent: c });
  }
  if (v.skis) for (const s of [1, -1]) mesh(extrudeOutline([[-1.0, 0], [3.4, 0], [3.6, 0.15], [3.4, 0.06], [-1.0, 0.05]], 0.5, { bevel: 0.02 }), M.matte('#1d1f22', 0.6), { parent: airframe, at: [-2.4, 0.0, s * 1.25] });
  if (v.cargoHook || v.bucket) {
    mesh(cushion(0.4, 0.14, 0.3, { radius: 0.05 }), darkMetal, { parent: airframe, at: [0, 0.62, 0] });
    if (v.bucket) {
      for (const a of [0, 2.1, 4.2]) curveTube([[0, 0.55, 0], [Math.cos(a) * 0.6, -2.6, Math.sin(a) * 0.6]], 0.01, M.metal('#333'), { parent: airframe, radialSegments: 4 });
      mesh(new THREE.CylinderGeometry(0.75, 0.55, 1.0, 24, 1, true), M.matte('#d84315', 0.7), { parent: airframe, at: [0, -3.1, 0], name: 'bucket' });
    } else {
      // container on a sling
      for (const [x, z] of [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]]) tube([0, 0.55, 0], [x, -1.9, z], 0.01, M.metal('#333'), { parent: airframe, radialSegments: 4 });
      mesh(roundedBox(2.4, 1.1, 1.3, 0.04), M.paint('#2e6b8a', { metallic: 0.2, roughness: 0.6 }), { parent: airframe, at: [0, -2.45, 0], name: 'sling_load' });
    }
  }
  if (v.airline) for (const s of [1, -1]) {
    const p = loft.at(0, s > 0 ? -0.55 : Math.PI + 0.55);
    const st = mesh(roundedBox(L - 3, 0.16, 0.006, 0.003), M.paint('#1565c0'), { parent: airframe });
    st.position.copy(p.point).addScaledVector(p.normal, 0.004);
    st.position.x = 0;
  }
  const animations = [
    clip('rotors', 0.45, [spinTrack(front, 'y', 0.45, 1), spinTrack(rear, 'y', 0.45, -1)]),
    clip('hover', 3, [moveTrack(airframe, 3, (t) => [0, (v.bucket || v.cargoHook ? 4 : 0) + 0.2 + wave(t) * 0.15, 0])]),
    ...nav.animations,
    clip('ramp', 5, [rotateTrack(ramp, 'z', 5, (t) => Math.min(1, (0.5 - 0.5 * Math.cos(t * Math.PI * 2)) * 1.4) * 0.45)]),
  ];
  if (v.bucket || v.cargoHook) { airframe.position.y = 4; root.userData.floating = true; }
  return finalize(root, { type: 'helicopter', variant, options: o, animations });
}
