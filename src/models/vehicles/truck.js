import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, lathe, extrudeOutline, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { spinTrack, clip } from '../../core/animation.js';
import { createLoft, smoothKeys } from '../../core/loft.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { wheelWell, vehicleAnimations, addHeadlightSpots } from './wheel.js';
import { Merge, bevelBox, addHeavyWheels, makeRam, anchor, poseClip, cycle, keys, emblem, exhaust, batteryPack, chevrons, ladder, handrail, plateStrip, lifeClips } from './heavy-kit.js';
import { buildTrailer, rearLamps, plate, rearDoors } from './trailer-build.js';

/*
 * Trucks. Real-world proportions (EU/US medium & heavy trucks):
 *  - cab-over cab 2.5 m wide, 2.25 m long (crew 3.5 m), roof 3.05 m (high roof 3.6 m)
 *  - frame rails 0.28 m deep, top at 1.02 m, 0.92 m apart; 295/80R22.5 tyres (r 0.52)
 *  - leaf-sprung axles, dual rear wheels, fuel tank + battery box on brackets
 *  - conventional tractor: 1.25 m bumper→steer axle, sleeper or day cab, 45 ft trailer
 * Every part is bolted to something: wheels → axles → springs → rails → cab / body.
 * Front = +X, origin at ground centre.
 */

export const TRUCK_VARIANTS = {
  box: { L: 8.6, rear: [-2.5], color: '#f4f4f2', cargo: '#e9ecef' },
  tanker: { L: 9.2, rear: [-2.3, -3.61], color: '#1d3f8a', cargo: '#d5d9de' },
  flatbed: { L: 9.0, rear: [-2.6], color: '#b71c1c', cargo: '#7a5232' },
  dump: { L: 8.2, rear: [-1.9, -3.21], color: '#f2f2f0', cargo: '#f2a900' },
  semi: { color: '#0d47a1', cargo: '#f4f4f2', conventional: true },
  garbage: { L: 9.2, rear: [-2.4, -3.71], color: '#f4f4f2', cargo: '#2e7d32' },
  'fire-engine': { L: 9.8, rear: [-2.7], color: '#c8102e', cargo: '#c8102e', crew: true, roof: '#f4f4f2' },
  tow: { L: 7.6, rear: [-1.7], color: '#d32f2f', cargo: '#2b2b2b' },
  'delivery-van': { L: 5.95, color: '#f4f4f2', van: true },
  'cement-mixer': { L: 9.0, rear: [-2.1, -3.41], color: '#eceff1', cargo: '#ef6c00' },
};

const CABOVER_TRIMS = ['highroof', 'chrome', 'offroad', 'municipal', 'electric', 'long'];
/** Trims per variant (used by the catalog). */
export const TRUCK_TRIMS = {
  box: CABOVER_TRIMS,
  tanker: CABOVER_TRIMS,
  flatbed: CABOVER_TRIMS,
  dump: CABOVER_TRIMS,
  garbage: CABOVER_TRIMS,
  'fire-engine': ['highroof', 'chrome', 'offroad', 'municipal', 'electric', 'long'],
  tow: CABOVER_TRIMS,
  'cement-mixer': CABOVER_TRIMS,
  semi: ['daycab', 'highroof', 'flatbed', 'tanker', 'reefer', 'lowboy', 'container', 'car-carrier', 'logging', 'curtainside'],
  'delivery-van': ['highroof', 'long', 'electric', 'ladder-rack', 'refrigerated', 'offroad'],
};

/* ------------------------------------------------------------------ */
/* Materials + lamps                                                    */
/* ------------------------------------------------------------------ */

export function materials(o, v) {
  const cargoColor = o.cargoColor ?? v.cargo;
  return {
    paint: M.paint(o.color ?? v.color, { metallic: 0.25, roughness: 0.32 }),
    cargo: M.paint(cargoColor, { metallic: 0.2, roughness: 0.4 }),
    cargoColor,
    roof: M.paint(o.roofColor ?? v.roof ?? o.color ?? v.color, { metallic: 0.25, roughness: 0.32 }),
    interior: new THREE.MeshStandardMaterial({ name: 'interior', color: '#2a2b2d', roughness: 0.9, side: THREE.BackSide }),
    glass: new THREE.MeshPhysicalMaterial({
      name: 'glass', color: '#0b1014', roughness: 0.03, transparent: true, opacity: 0.6, clearcoat: 1,
      envMapIntensity: 1.3, side: THREE.DoubleSide, depthWrite: false,
    }),
    trim: new THREE.MeshStandardMaterial({ name: 'trim', color: '#161718', roughness: 0.6, metalness: 0.1 }),
    gloss: new THREE.MeshPhysicalMaterial({ name: 'gloss-black', color: '#0a0a0b', roughness: 0.15, clearcoat: 1 }),
    chrome: M.chrome(),
    alu: M.metal('#c4c8cc', 0.3),
    steel: M.metal('#3b3d40', 0.55),
    iron: M.metal('#26282b', 0.6),
    dark: new THREE.MeshStandardMaterial({ name: 'dark', color: '#1b1c1e', roughness: 0.6, metalness: 0.3 }),
    black: new THREE.MeshStandardMaterial({ name: 'black', color: '#0d0d0e', roughness: 0.8 }),
    rubber: M.rubber(),
    seam: new THREE.MeshBasicMaterial({ color: '#050505' }),
    seat: M.fabric('#2a2a2c'),
    blue: M.paint('#1e5bd8', { metallic: 0.3, roughness: 0.35 }),
    stripeA: M.matte('#f2c200', 0.6),
    stripeB: M.matte('#111111', 0.6),
    decal: M.matte('#f2f2f2', 0.5),
    bumper: M.paint('#2b2d30', { metallic: 0.3, roughness: 0.45 }),
  };
}

export function truckLamps() {
  return {
    head: lampGroup('headlights', 'head'),
    tail: lampGroup('taillights', 'tail'),
    brake: lampGroup('brakelights', 'brake'),
    signalL: lampGroup('indicator_L', 'signal'),
    signalR: lampGroup('indicator_R', 'signal'),
    reverse: lampGroup('reverselights', 'reverse'),
    markers: lampGroup('markers', 'amber'),
    markersRed: lampGroup('markers_red', 'red'),
    work: lampGroup('worklights', 'white'),
    beacon: lampGroup('beacon', 'amber'),
  };
}

/* ------------------------------------------------------------------ */
/* Chassis: rails, axles, springs, driveline, fenders, mudflaps         */
/* ------------------------------------------------------------------ */

export const RAIL_TOP = 1.02;
const RAIL_H = 0.28;
export const RAIL_Z = 0.46;
const RAIL_BOTTOM = RAIL_TOP - RAIL_H;

/** Leaf spring pack under a rail: arched band touching the axle (centre) and the rail (ends). */
function leafSpring(mg, x, z, wr, mats, len = 1.4) {
  const axTop = wr + 0.075;
  const th = 0.1;
  const endTop = RAIL_BOTTOM + 0.01;
  const ctrTop = Math.min(endTop, axTop + th);
  const pts = [];
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const u = -1 + (2 * i) / N;
    pts.push([u * len / 2, ctrTop + (endTop - ctrTop) * u * u]);
  }
  const outline = [...pts, ...pts.slice().reverse().map(([px, py], i) => [px, py - th * (i === 0 || i === N ? 0.6 : 1)])];
  mg.add(extrudeOutline(outline, 0.08, { bevel: 0.01, segments: 1 }), mats.iron, { at: [x, 0, z] });
  // U-bolts + shackles
  for (const s of [1, -1]) mg.box(0.03, th + 0.12, 0.1, mats.steel, { at: [x + s * 0.09, ctrTop - th / 2, z], r: 0.008 });
  for (const s of [1, -1]) mg.box(0.08, 0.1, 0.1, mats.steel, { at: [x + s * len / 2, RAIL_BOTTOM - 0.02, z], r: 0.01 });
}

/**
 * Frame + running gear. axles: [{ x, steer, dual, drive }]
 */
export function chassis(root, mg, { x0, x1, axles, wr, wz, mats, gearX }) {
  const len = x1 - x0;
  for (const z of [RAIL_Z, -RAIL_Z]) {
    mg.box(len, RAIL_H, 0.09, mats.steel, { at: [(x0 + x1) / 2, RAIL_TOP - RAIL_H / 2, z], r: 0.012 });
  }
  for (let x = x0 + 0.25; x < x1 - 0.1; x += 1.15) mg.box(0.08, 0.2, RAIL_Z * 2, mats.steel, { at: [x, RAIL_TOP - 0.12, 0], r: 0.01 });
  for (const a of axles) {
    if (a.steer) {
      // forged I-beam front axle, dropped centre, kingpin knuckles at the wheels
      mg.box(0.11, 0.14, 2 * wz - 0.34, mats.iron, { at: [a.x, wr - 0.04, 0], r: 0.02 });
      for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 12), mats.iron, { at: [a.x, wr, s * (wz - 0.2)] });
    } else {
      mg.add(new THREE.CylinderGeometry(0.075, 0.075, 2 * wz, 14).rotateX(Math.PI / 2), mats.iron, { at: [a.x, wr, 0] });
      if (a.drive !== false) mg.add(new THREE.SphereGeometry(0.27, 20, 14).scale(1, 0.85, 1.05), mats.iron, { at: [a.x, wr, 0] });
    }
    for (const s of [1, -1]) {
      leafSpring(mg, a.x, s * RAIL_Z, wr, mats);
      mg.tube([a.x + 0.25, wr + 0.02, s * (RAIL_Z + 0.1)], [a.x + 0.42, RAIL_TOP - 0.15, s * (RAIL_Z + 0.06)], 0.03, mats.dark, 8); // shock
    }
  }
  // driveline: gearbox → each drive axle diff
  const drives = axles.filter((a) => !a.steer && a.drive !== false).map((a) => a.x).sort((p, q) => q - p);
  if (gearX != null && drives.length) {
    mg.add(roundedBox(0.9, 0.42, 0.48, 0.12, 3), mats.iron, { at: [gearX, RAIL_TOP - 0.22, 0] });
    let from = gearX - 0.45;
    let fy = RAIL_TOP - 0.25;
    for (const dx of drives) {
      mg.tube([from, fy, 0], [dx + 0.2, wr + 0.05, 0], 0.05, mats.steel, 10);
      from = dx - 0.2;
      fy = wr + 0.05;
    }
  }
}

/** Rear fenders over (tandem) dual wheels, bolted to the rails, plus mudflaps on hangers. */
export function rearFenders(mg, xs, wz, wr, mats, { mudflaps = true } = {}) {
  const a = Math.min(...xs);
  const b = Math.max(...xs);
  const R = wr + 0.1;
  const zc = wz - 0.16;
  const fw = 0.72;
  for (const s of [1, -1]) {
    if (xs.length === 1) {
      const g = new THREE.CylinderGeometry(R, R, fw, 24, 1, true, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
      mg.add(g, mats.black, { at: [a, wr, s * zc] });
    } else {
      // one flat fender over the tandem
      mg.add(roundedBox(b - a + 2 * R * 0.85, 0.04, fw, 0.015, 2), mats.black, { at: [(a + b) / 2, 2 * wr + 0.12, s * zc] });
      for (const x of [a - R * 0.85, b + R * 0.85]) mg.add(roundedBox(0.04, 0.32, fw, 0.015, 2), mats.black, { at: [x + Math.sign(x - (a + b) / 2) * 0.0, 2 * wr - 0.04, s * zc], rot: [0, 0, Math.sign(x - (a + b) / 2) * 0.5] });
    }
    // brackets from rail to the fender's inner edge
    for (const x of xs.length === 1 ? [a] : [a, b]) mg.box(0.08, 0.06, zc - fw / 2 - RAIL_Z + 0.06, mats.steel, { at: [x, xs.length === 1 ? 2 * wr + 0.02 : 2 * wr + 0.08, s * (RAIL_Z + (zc - fw / 2 - RAIL_Z) / 2 + 0.03)], r: 0.01 });
    if (mudflaps) {
      const fx = a - wr - 0.18;
      mg.box(0.06, 0.06, zc + 0.3 - RAIL_Z, mats.steel, { at: [fx, RAIL_BOTTOM + 0.15, s * (RAIL_Z + (zc + 0.3 - RAIL_Z) / 2 - 0.04)], r: 0.01 });
      mg.box(0.06, 0.12, 0.06, mats.steel, { at: [fx + 0.02, RAIL_BOTTOM + 0.1, s * (RAIL_Z + 0.03)], r: 0.01 });
      mg.add(roundedBox(0.02, 0.62, 0.66, 0.01, 2), mats.rubber, { at: [fx, RAIL_BOTTOM + 0.15 - 0.33, s * zc] });
    }
  }
}

/** Fuel tank (or battery packs for electric) on straps + brackets bolted to the rail. */
export function tanks(mg, { x, side, mats, electric = false, wz }) {
  const z = side * (RAIL_Z + 0.38);
  if (electric) {
    batteryPack(mg, [x, RAIL_TOP - 0.3, z], [1.4, 0.55, 0.6], mats);
    mg.box(0.12, 0.3, 0.12, mats.steel, { at: [x - 0.4, RAIL_TOP - 0.2, side * (RAIL_Z + 0.06)], r: 0.01 });
    mg.box(0.12, 0.3, 0.12, mats.steel, { at: [x + 0.4, RAIL_TOP - 0.2, side * (RAIL_Z + 0.06)], r: 0.01 });
    return;
  }
  const r = 0.3;
  const ty = RAIL_TOP - 0.32;
  mg.add(roundedBox(1.2, r * 2, r * 2, r * 0.9, 4), mats.alu, { at: [x, ty, z] });
  for (const dx of [-0.38, 0.38]) {
    mg.add(new THREE.TorusGeometry(r * 1.01, 0.014, 6, 32).rotateY(Math.PI / 2), mats.steel, { at: [x + dx, ty, z] });
    mg.box(0.1, 0.22, z * side - RAIL_Z - r + 0.08, mats.steel, { at: [x + dx, ty, side * (RAIL_Z + (z * side - RAIL_Z - r + 0.08) / 2)], r: 0.01 });
  }
  mg.add(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 14), mats.chrome, { at: [x + 0.3, ty + r + 0.01, z] });
  void wz;
}

/** Lamp bar + underride bar at the rear of a rigid truck. */
export function rearEnd(root, mg, { x, W, mats, lamps }) {
  const ly = RAIL_TOP - 0.12;
  mg.box(0.12, 0.24, W - 0.08, mats.steel, { at: [x + 0.06, ly, 0], r: 0.02 });
  rearLamps(lamps, root, { x, y: ly, W: W - 0.08, h: 0.12 });
  plate(root, [x - 0.002, ly - 0.2, 0], -1);
  mg.box(0.08, 0.1, 0.56, mats.steel, { at: [x + 0.06, ly - 0.17, 0], r: 0.01 }); // plate bracket
  emblem(root, 'emblem_rear', 0.07, [x - 0.004, ly + 0.04, 0.0], -1);
  const by = 0.5;
  for (const s of [1, -1]) mg.box(0.1, RAIL_BOTTOM - by + 0.02, 0.1, mats.steel, { at: [x + 0.2, (RAIL_BOTTOM + by) / 2, s * RAIL_Z], r: 0.012 });
  mg.add(new THREE.BoxGeometry(0.12, 0.13, W - 0.25, 1, 2, 24), mats.steel, { at: [x + 0.18, by, 0] }); // underrun bar (segmented so the tape bonds to real surface points)
  const tw2 = M.matte('#f2f2f2', 0.4);
  const tr2 = M.matte('#d81f1f', 0.4);
  for (let i = 0; i < 6; i++) mg.box(0.008, 0.06, (W - 0.45) / 6 - 0.02, i % 2 ? tw2 : tr2, { at: [x + 0.118, by, -W / 2 + 0.22 + ((i + 0.5) * (W - 0.45)) / 6], r: 0.002 });
}

/** Side guard rails between the axles (EU underrun protection), bolted to the rails. */
function sideGuard(mg, x0, x1, W, mats) {
  if (x1 - x0 < 0.6) return;
  for (const s of [1, -1]) {
    for (const y of [0.55, 0.82]) mg.box(x1 - x0, 0.08, 0.04, mats.alu, { at: [(x0 + x1) / 2, y, s * (W / 2 - 0.08)], r: 0.012 });
    for (const x of [x0 + 0.1, x1 - 0.1]) mg.box(0.06, RAIL_BOTTOM + 0.1 - 0.5, W / 2 - 0.08 - RAIL_Z, mats.steel, { at: [x, (RAIL_BOTTOM + 0.1 + 0.5) / 2, s * (RAIL_Z + (W / 2 - 0.08 - RAIL_Z) / 2)], r: 0.01 });
  }
}

/* ------------------------------------------------------------------ */
/* Cab-over cab                                                          */
/* ------------------------------------------------------------------ */

export function buildCabOver(parent, { frontX, xf, wr, crew = false, W = 2.5, H = 3.05, mats, lamps, roofColored = false, trim }) {
  const cabL = crew ? 3.5 : 2.25;
  const cx = frontX - cabL / 2;
  const h = cabL / 2;
  const cab = group('cab', { parent, at: [cx, 0, 0] });
  const ar = wr + 0.09;
  const xw = xf - cx;
  const floorY = RAIL_TOP;
  const yb = 1.8;
  const top = smoothKeys([[-h, H - 0.05], [-h + 0.1, H], [h - 0.12, H], [h, H - 0.1]]);
  const section = (x) => {
    let y0 = floorY;
    const dx = x - xw;
    if (Math.abs(dx) < ar) y0 = Math.max(y0, wr + Math.sqrt(ar * ar - dx * dx));
    return { y0, yb, yt: top(x), w: W, wt: W * 0.95, r1: 0.06, r2: 0.2, crown: 0.04, bulge: 0.012, sideBulge: 0.015 };
  };
  const doorBack = h - 1.08;
  const win = [[h - 1.0, h - 0.33]];
  const doors = [doorBack, h - 0.3];
  if (crew) {
    win.push([h - 2.15, h - 1.18]);
    doors.push(h - 2.2);
  }
  if (H > 3.3) win.push([-h + 0.15, -h + 0.55]); // high-roof bunk window
  const breaks = [h - 0.26, ...win.flat(), ...doors.flatMap((d) => [d, d + 0.01])];
  for (let k = -ar; k <= ar + 1e-6; k += ar / 8) breaks.push(xw + k);
  const loft = createLoft({
    length: cabL, nose: { len: 0.26, p: 4 }, tail: { len: 0.08, p: 6 }, rake: { front: 0.07 }, breaks, section,
    segments: { bottom: 3, corner: 4, lower: 8, side: 10, roofCorner: 6, roof: 6 }, stations: 70,
  });
  const I = loft.idx;
  const glassGeos = [loft.patch({ x: [h - 0.26, h], from: I('side', 0.05), to: I('roofCorner', 0.3), side: 'both', hole: true, offset: 0 })];
  for (const w of win) glassGeos.push(loft.patch({ x: w, from: I('side', w[0] < -h + 0.6 && H > 3.3 ? 0.55 : 0.1), to: I('side', w[0] < -h + 0.6 && H > 3.3 ? 0.85 : 0.93), side: 'both', hole: true, offset: 0 }));
  for (const g of glassGeos) mesh(g, mats.glass, { parent: cab, name: 'glass' });
  for (const d of doors) mesh(loft.patch({ x: [d, d + 0.01], from: I('corner', 0.5), to: I('side', 0.08), offset: 0.0015 }), mats.seam, { parent: cab });
  mesh(loft.patch({ x: [h - 0.3, h - 0.26], from: I('side', 0.05), to: I('roofCorner', 0.3), offset: 0.002 }), mats.gloss, { parent: cab });
  mesh(loft.patch({ x: [h - 0.03, h], from: I('lower', 0.12), to: I('lower', 0.82), offset: 0.004 }), trim === 'electric' ? mats.blue : mats.gloss, { parent: cab, name: 'grille' });
  if (roofColored) mesh(loft.patch({ x: [-h, h], from: I('roofCorner', 0.4), side: 'across', offset: 0.002 }), mats.roof, { parent: cab, name: 'roof' });
  const shell = loft.bodyGeometry();
  mesh(shell, mats.paint, { parent: cab, name: 'cab-shell' });
  mesh(shell, mats.interior, { parent: cab, name: 'cab-interior' });
  wheelWell(cab, xw, ar - 0.01, W * 0.92, wr);

  const mg = new Merge();
  // grille slats + emblem (emblem sits directly on the grille panel)
  const slatMat = trim === 'chrome' ? mats.chrome : trim === 'electric' ? mats.blue : mats.alu;
  if (trim !== 'electric') for (let k = 0; k < 6; k++) mg.box(0.03, 0.025, W * 0.62, slatMat, { at: [h + 0.005, 1.2 + k * 0.09, 0], r: 0.008 });
  else mg.box(0.02, 0.06, W * 0.7, mats.blue, { at: [h + 0.005, 1.5, 0], r: 0.008 });
  emblem(cab, 'emblem_front', 0.16, [h + 0.012, 1.74, 0], 1);
  if (trim === 'chrome') {
    // chrome grille surround + visor
    for (const y of [1.12, 1.68]) mg.box(0.04, 0.04, W * 0.68, mats.chrome, { at: [h + 0.012, y, 0], r: 0.015 });
    for (const s of [1, -1]) mg.box(0.04, 0.56, 0.04, mats.chrome, { at: [h + 0.012, 1.4, s * W * 0.34], r: 0.015 });
  }
  // bumper with lamps (sits on the frame horns)
  const bx = h - 0.1;
  const by = 0.72;
  mg.add(roundedBox(0.4, 0.42, W - 0.02, 0.08, 3), trim === 'chrome' ? mats.chrome : mats.bumper, { at: [bx, by, 0] });
  const bf = bx + 0.2;
  for (const s of [1, -1]) {
    lamps.head.add(cab, { at: [bf, by + 0.06, s * (W / 2 - 0.38)], normal: [1, 0, 0], w: 0.46, h: 0.17 });
    (s < 0 ? lamps.signalL : lamps.signalR).add(cab, { at: [bf, by - 0.12, s * (W / 2 - 0.2)], normal: [1, 0, 0], w: 0.18, h: 0.06 });
    lamps.head.add(cab, { at: [bf, by - 0.12, s * 0.62], normal: [1, 0, 0], w: 0.11, h: 0.11, shape: 'round' }); // fog
    // side repeater on the cab side, behind the door's front edge
    const p = loft.pointAt(h - 0.42, 'lower', 0.55, s);
    (s < 0 ? lamps.signalL : lamps.signalR).add(cab, { at: [p.point.x, p.point.y, p.point.z], normal: [p.normal.x, p.normal.y, p.normal.z], w: 0.12, h: 0.05, depth: 0.012 });
  }
  plate(cab, [bf + 0.002, by - 0.12, 0], 1);
  // steps on hangers + grab handles
  for (const s of [1, -1]) {
    const sx = h - 0.7;
    for (const [y, inset] of [[0.48, 0.14], [0.8, 0.06]]) mg.add(roundedBox(0.5, 0.04, 0.28, 0.012, 2), M.metal('#9ea3a8', 0.35), { at: [sx, y, s * (W / 2 - inset - 0.12)] });
    mg.box(0.04, floorY - 0.46 + 0.02, 0.04, mats.steel, { at: [sx - 0.22, (floorY + 0.46) / 2, s * (W / 2 - 0.26)], r: 0.01 });
    mg.box(0.04, floorY - 0.46 + 0.02, 0.04, mats.steel, { at: [sx + 0.22, (floorY + 0.46) / 2, s * (W / 2 - 0.26)], r: 0.01 });
    mg.pipe([[doorBack - 0.04, 1.35, s * (W / 2 - 0.01)], [doorBack - 0.06, 1.35, s * (W / 2 + 0.05)], [doorBack - 0.06, 2.05, s * (W / 2 + 0.05)], [doorBack - 0.04, 2.05, s * (W / 2 - 0.01)]], 0.016, mats.alu, 16, 6);
  }
  // mirrors on arms
  for (const s of [1, -1]) {
    mg.pipe([[h - 0.2, 2.25, s * (W / 2 - 0.04)], [h + 0.05, 2.4, s * (W / 2 + 0.12)], [h + 0.12, 2.35, s * (W / 2 + 0.3)]], 0.02, mats.gloss, 16, 8);
    mg.add(cushion(0.09, 0.46, 0.22, { radius: 0.035, bulge: 0.1 }), mats.gloss, { at: [h + 0.12, 2.15, s * (W / 2 + 0.32)] });
    mg.add(cushion(0.08, 0.18, 0.2, { radius: 0.03, bulge: 0.1 }), mats.gloss, { at: [h + 0.12, 1.83, s * (W / 2 + 0.31)] });
    mg.box(0.03, 0.12, 0.03, mats.gloss, { at: [h + 0.12, 1.96, s * (W / 2 + 0.31)], r: 0.008 });
  }
  // sun visor, roof clearance lamps, wipers
  mg.add(roundedBox(0.38, 0.04, W * 0.92, 0.015, 2), trim === 'chrome' ? mats.chrome : mats.gloss, { at: [h - 0.02, H - 0.12, 0], rot: [0, 0, -0.18] });
  for (const z of [-0.8, -0.4, 0, 0.4, 0.8]) lamps.markers.add(cab, { at: [h - 0.12, H - 0.005, z], normal: [0, 1, 0], w: 0.1, h: 0.05, depth: 0.015 });
  for (const z of [0.55, -0.35]) mg.box(0.02, 0.75, 0.025, mats.trim, { at: [h + 0.015, yb + 0.38, z], rot: [0.5, 0, 0], r: 0.006 });
  // interior
  const seatX = h - 0.95;
  for (const z of [0.6, -0.6]) {
    mg.add(cushion(0.5, 0.13, 0.52, { radius: 0.05 }), mats.seat, { at: [seatX, floorY + 0.5, z] });
    mg.add(cushion(0.13, 0.7, 0.52, { radius: 0.05 }), mats.seat, { at: [seatX - 0.26, floorY + 0.88, z], rot: [0, 0, 0.12] });
    mg.box(0.3, 0.44, 0.3, mats.dark, { at: [seatX, floorY + 0.22, z] });
  }
  if (crew) for (const z of [0.6, 0, -0.6]) {
    mg.add(cushion(0.48, 0.13, 0.5, { radius: 0.05 }), mats.seat, { at: [seatX - 1.25, floorY + 0.5, z] });
    mg.add(cushion(0.13, 0.66, 0.5, { radius: 0.05 }), mats.seat, { at: [seatX - 1.5, floorY + 0.86, z], rot: [0, 0, 0.1] });
    mg.box(0.3, 0.44, 0.3, mats.dark, { at: [seatX - 1.25, floorY + 0.22, z] });
  }
  mg.add(roundedBox(0.4, 0.3, W - 0.3, 0.06, 3), M.plastic('#1c1c1c'), { at: [h - 0.32, floorY + 0.68, 0] });
  mg.add(new THREE.TorusGeometry(0.23, 0.022, 10, 32).rotateY(Math.PI / 2).rotateZ(0.75), mats.trim, { at: [h - 0.55, floorY + 0.95, -0.6] });
  mg.tube([h - 0.36, floorY + 0.7, -0.6], [h - 0.55, floorY + 0.95, -0.6], 0.03, mats.trim, 8);

  // trim extras
  if (trim === 'chrome' || trim === 'offroad') {
    // roof bar with round lamps
    for (const s of [1, -1]) mg.box(0.06, 0.16, 0.06, mats.dark, { at: [h - 0.4, H + 0.06, s * 0.9], r: 0.015 });
    mg.box(0.08, 0.06, 2.0, trim === 'chrome' ? mats.chrome : mats.dark, { at: [h - 0.4, H + 0.15, 0], r: 0.02 });
    for (const z of [-0.75, -0.25, 0.25, 0.75]) lamps.work.add(cab, { at: [h - 0.32, H + 0.15, z], normal: [1, 0, 0], w: 0.16, h: 0.16, shape: 'round', depth: 0.05 });
  }
  if (trim === 'chrome') {
    for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.025, 0.07, 0.55, 16).rotateZ(-Math.PI / 2), mats.chrome, { at: [-h + 0.5, H + 0.06, s * 0.35] });
    for (const s of [1, -1]) mg.box(0.08, 0.06, 0.06, mats.chrome, { at: [-h + 0.5, H + 0.02, s * 0.35], r: 0.01 });
  }
  if (trim === 'offroad') {
    // bull bar bolted to the bumper + snorkel up the A-pillar
    const fx = bf + 0.14;
    for (const s of [1, -1]) {
      mg.tube([bf - 0.02, by - 0.15, s * 0.8], [fx, by - 0.15, s * 0.8], 0.04, mats.dark, 10);
      mg.pipe([[fx, by - 0.15, s * 0.8], [fx, by + 0.45, s * 0.75], [fx - 0.05, 1.25, s * 0.55]], 0.04, mats.dark, 16, 10);
    }
    mg.tube([fx, by + 0.35, -0.78], [fx, by + 0.35, 0.78], 0.04, mats.dark, 10);
    mg.tube([fx - 0.05, 1.25, -0.55], [fx - 0.05, 1.25, 0.55], 0.04, mats.dark, 10);
    mg.tube([bf - 0.02, 1.25, -0.55], [fx - 0.05, 1.25, -0.55], 0.03, mats.dark, 8);
    mg.tube([bf - 0.02, 1.25, 0.55], [fx - 0.05, 1.25, 0.55], 0.03, mats.dark, 8);
    const sp = loft.pointAt(h - 0.5, 'side', 0.3, 1);
    mg.pipe([[sp.point.x, 1.25, W / 2 - 0.02], [sp.point.x, 1.25, W / 2 + 0.1], [sp.point.x, H - 0.1, W / 2 + 0.1], [sp.point.x + 0.2, H + 0.1, W / 2 + 0.05]], 0.07, mats.dark, 24, 12);
    mg.add(roundedBox(0.2, 0.14, 0.18, 0.05, 3), mats.dark, { at: [sp.point.x + 0.25, H + 0.1, W / 2 + 0.05] });
  }
  if (trim === 'municipal' || trim === 'offroad' || trim === 'electric') {
    // twin roof beacons on a bar
    mg.box(0.18, 0.05, 1.4, mats.dark, { at: [-h + 0.4, H - 0.02 + 0.025, 0], r: 0.015 });
    for (const s of [1, -1]) addBeaconOn(lamps, cab, [-h + 0.4, H + 0.045, s * 0.55], mats);
  }
  mg.flush(cab, 'cab_parts');
  return { cab, back: frontX - cabL, roofY: H, loft, bf, by, cx };
}

export function addBeaconOn(lamps, parent, at, mats, r = 0.075) {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.25, r * 0.6, 16), mats.dark);
  base.position.set(at[0], at[1] + r * 0.3, at[2]);
  base.name = 'beacon_base';
  parent.add(base);
  const dome = new THREE.SphereGeometry(r, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.5, 1);
  dome.translate(at[0], at[1] + r * 0.6, at[2]);
  return lamps.beacon.add(parent, { geometry: dome, normal: [0, 1, 0], depth: r * 0.5, w: r * 2, h: r * 2, glowSize: r * 7 });
}

/** Front snow plough on a push frame, bolted to the bumper (municipal trim). */
function plough(root, mg, { x, mats }) {
  const g = group('plough', { parent: root, at: [x, 0, 0] });
  const pm = new Merge();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.12);
  shape.quadraticCurveTo(0.42, 0.25, 0.32, 1.1);
  shape.lineTo(0.26, 1.1);
  shape.quadraticCurveTo(0.34, 0.32, -0.04, 0.17);
  const blade = new THREE.ExtrudeGeometry(shape, { depth: 3.0, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 14 });
  blade.translate(0, 0, -1.5);
  pm.add(blade, M.paint('#f26b0f', { metallic: 0.2, roughness: 0.4 }), { at: [0.25, 0, 0], rot: [0, 0.12, 0] });
  pm.box(0.08, 0.1, 3.0, mats.steel, { at: [0.26, 0.12, 0], rot: [0, 0.12, 0], r: 0.01 });
  const markerMat = M.matte('#f26b0f');
  for (const s of [1, -1]) {
    pm.box(0.75, 0.12, 0.12, mats.dark, { at: [0.15, 0.62, s * 0.5], r: 0.02 }); // push arms welded into the blade back
    pm.tube([0.4, 1.0, s * 1.45], [0.42, 1.55, s * 1.45], 0.012, markerMat, 6); // edge markers clamped to the blade top
  }
  pm.box(0.12, 0.6, 1.1, mats.dark, { at: [-0.22, 0.6, 0], r: 0.02 });
  // push frame: mounting plate → two beams bolted to the chassis rail ends / bumper
  for (const s of [1, -1]) pm.box(0.6, 0.14, 0.12, mats.dark, { at: [-0.5, 0.62, s * RAIL_Z], r: 0.02 });
  pm.flush(g, 'plough_body');
  void mg;
  return g;
}

/* ------------------------------------------------------------------ */
/* Conventional tractor (semi)                                           */
/* ------------------------------------------------------------------ */

function buildTractor(root, { frontX, mats, lamps, wr, style = 'sleeper', W = 2.5 }) {
  const sleeper = style !== 'daycab';
  const high = style === 'highroof';
  const Lc = sleeper ? 5.1 : 3.95;
  const h = Lc / 2;
  const cx = frontX - h;
  const X = (d) => h - d; // distance from the front → local x
  const g = group('tractor', { parent: root, at: [cx, 0, 0] });
  const xf = X(1.25);
  const ar = wr + 0.08;
  const roof = high ? 4.05 : 3.95;
  const topKeys = sleeper
    ? [[-h, roof - 0.1], [-h + 0.12, roof], [X(3.6), roof], [X(2.8), high ? 3.62 : 3.32], [X(2.4), 3.22], [X(2.03), 2.18], [X(1.85), 2.1], [X(0.4), 1.98], [X(0.1), 1.82], [h, 1.62]]
    : [[-h, 3.12], [-h + 0.1, 3.22], [X(2.75), 3.22], [X(2.4), 3.2], [X(2.03), 2.18], [X(1.85), 2.1], [X(0.4), 1.98], [X(0.1), 1.82], [h, 1.62]];
  const top = smoothKeys(topKeys);
  const belt = smoothKeys([[-h, 2.12], [X(2.1), 2.12], [X(1.8), 1.85], [h, 1.45]]);
  const width = smoothKeys([[-h, W], [X(2.13), W], [X(1.77), 1.5], [h, 1.42]]);
  const sill = smoothKeys([[-h, 1.22], [X(2.15), 1.22], [X(1.75), 1.02], [h, 0.88]]);
  const section = (x) => {
    let y0 = sill(x);
    const dx = x - xf;
    if (Math.abs(dx) < ar) y0 = Math.max(y0, wr + Math.sqrt(ar * ar - dx * dx));
    const w = width(x);
    const isCab = x < X(2.1) ? 1 : 0;
    return { y0, yb: belt(x), yt: top(x), w, wt: w * (0.93 + 0.02 * isCab), r1: 0.07, r2: isCab ? 0.22 : 0.12, crown: 0.04, bulge: 0.015, sideBulge: 0.015 };
  };
  const winA = [X(3.43), X(2.22)];
  const doorA = X(3.55);
  const doorB = X(2.09);
  const breaks = [X(2.35), X(2.05), ...winA, doorA, doorA + 0.01, doorB, doorB + 0.01, X(1.93)];
  if (sleeper) breaks.push(X(4.65), X(4.25));
  for (let k = -ar; k <= ar + 1e-6; k += ar / 8) breaks.push(xf + k);
  const loft = createLoft({ length: Lc, nose: { len: 0.25, p: 4 }, tail: { len: 0.1, p: 6 }, breaks, section, stations: 80, segments: { bottom: 3, corner: 4, lower: 8, side: 10, roofCorner: 6, roof: 6 } });
  const I = loft.idx;
  const glassGeos = [
    loft.patch({ x: [X(2.35), X(2.05)], from: I('roofCorner', 0.45), side: 'across', hole: true, offset: 0 }),
    loft.patch({ x: winA, from: I('side', 0.1), to: I('side', 0.94), side: 'both', hole: true, offset: 0 }),
  ];
  if (sleeper) glassGeos.push(loft.patch({ x: [X(4.65), X(4.25)], from: I('side', 0.35), to: I('side', 0.7), side: 'both', hole: true, offset: 0 }));
  for (const geo of glassGeos) mesh(geo, mats.glass, { parent: g, name: 'glass' });
  for (const d of [doorA, doorB]) mesh(loft.patch({ x: [d, d + 0.01], from: I('corner', 0.5), to: I('side', 0.08), offset: 0.0015 }), mats.seam, { parent: g });
  mesh(loft.patch({ x: [X(1.93), X(1.92)], from: I('roofCorner', 0.2), side: 'across', offset: 0.0015 }), mats.seam, { parent: g });
  const shell = loft.bodyGeometry();
  mesh(shell, mats.paint, { parent: g, name: 'tractor-shell' });
  mesh(shell, mats.interior, { parent: g, name: 'tractor-interior' });
  wheelWell(g, xf, ar - 0.01, 1.4, wr);
  const mg = new Merge();
  // chrome grille + bumper
  mg.add(roundedBox(0.08, 0.95, 1.18, 0.05, 3), mats.chrome, { at: [h + 0.01, 1.42, 0] });
  for (let k = 0; k < 9; k++) mg.box(0.03, 0.035, 1.02, mats.gloss, { at: [h + 0.04, 1.04 + k * 0.095, 0], r: 0.008 });
  mg.add(roundedBox(0.3, 0.32, W + 0.04, 0.06, 3), mats.chrome, { at: [h - 0.02, 0.78, 0] });
  emblem(g, 'emblem_front', 0.14, [h + 0.055, 1.98, 0], 1);
  plate(g, [h + 0.135, 0.76, 0], 1);
  const wz = W / 2 - 0.22;
  for (const s of [1, -1]) {
    // front fender with headlamp housing sitting on top of it
    const fg = new THREE.CylinderGeometry(wr + 0.1, wr + 0.1, 0.44, 32, 1, true, -Math.PI / 2 - 0.4, Math.PI + 0.9).rotateX(-Math.PI / 2);
    const fm = mesh(fg, mats.paint.clone(), { parent: g, at: [xf, wr, s * wz], name: 'fender' });
    fm.material.side = THREE.DoubleSide;
    const hx = X(0.42);
    const hp = loft.pointAt(hx, 'lower', 0.3, s);
    mg.add(roundedBox(0.36, 0.22, 0.34, 0.08, 3), mats.chrome, { at: [hp.point.x, 1.12, s * (wz - 0.04)] });
    lamps.head.add(g, { at: [hp.point.x + 0.18, 1.14, s * (wz - 0.02)], normal: [1, 0, 0], w: 0.28, h: 0.16 });
    (s < 0 ? lamps.signalL : lamps.signalR).add(g, { at: [hp.point.x + 0.16, 1.02, s * (wz + 0.12)], normal: [0.6, 0, s * 0.8], w: 0.1, h: 0.06 });
    lamps.markers.add(g, { at: [hp.point.x + 0.02, 1.15, s * (wz + 0.17)], normal: [0, 0, s], w: 0.08, h: 0.05 });
    // steps + grab handles
    for (const y of [0.55, 0.9]) mg.add(roundedBox(0.5, 0.04, 0.26, 0.012, 2), M.metal('#9ea3a8', 0.35), { at: [X(3.15), y, s * (W / 2 - 0.12)] });
    mg.box(0.04, 0.72, 0.04, mats.steel, { at: [X(3.15) - 0.22, 0.88, s * (W / 2 - 0.22)], r: 0.01 });
    mg.box(0.04, 0.72, 0.04, mats.steel, { at: [X(3.15) + 0.22, 0.88, s * (W / 2 - 0.22)], r: 0.01 });
    mg.pipe([[doorA - 0.04, 1.4, s * (W / 2 - 0.01)], [doorA - 0.06, 1.4, s * (W / 2 + 0.05)], [doorA - 0.06, 2.3, s * (W / 2 + 0.05)], [doorA - 0.04, 2.3, s * (W / 2 - 0.01)]], 0.016, mats.chrome, 16, 6);
    // mirror
    mg.pipe([[X(2.15), 2.3, s * (W / 2 - 0.02)], [X(2.0), 2.45, s * (W / 2 + 0.18)], [X(1.95), 2.4, s * (W / 2 + 0.32)]], 0.02, mats.chrome, 16, 8);
    mg.add(cushion(0.08, 0.5, 0.22, { radius: 0.035, bulge: 0.1 }), mats.chrome, { at: [X(1.95), 2.2, s * (W / 2 + 0.34)] });
    // exhaust stacks clamped to the cab back wall
    const ex = -h + 0.02 - 0.12;
    mg.add(new THREE.CylinderGeometry(0.075, 0.075, roof + 0.5 - 1.2, 16), mats.chrome, { at: [ex, 1.2 + (roof + 0.5 - 1.2) / 2, s * (W / 2 - 0.16)] });
    mg.add(new THREE.CylinderGeometry(0.11, 0.11, 1.1, 18), mats.chrome, { at: [ex, 2.4, s * (W / 2 - 0.16)] });
    for (const y of [1.6, 2.9]) mg.box(0.16, 0.05, 0.06, mats.chrome, { at: [ex + 0.08, y, s * (W / 2 - 0.16)], r: 0.01 });
    mg.add(new THREE.CylinderGeometry(0.02, 0.06, 0.5, 16).rotateZ(-Math.PI / 2), mats.chrome, { at: [X(3.0), top(X(3.0)) + 0.05, s * 0.4] });
    mg.box(0.06, 0.06, 0.05, mats.chrome, { at: [X(3.0) - 0.2, top(X(3.0)) + 0.01, s * 0.4], r: 0.01 });
    // cab mounts onto the frame rails
    for (const d of [2.3, Lc - 0.3]) mg.box(0.16, 1.24 - RAIL_TOP + 0.02, 0.12, mats.iron, { at: [X(d), (1.24 + RAIL_TOP) / 2, s * RAIL_Z], r: 0.015 });
  }
  for (const z of [-0.8, -0.4, 0, 0.4, 0.8]) lamps.markers.add(g, { at: [X(2.4), top(X(2.4)) - 0.005, z], normal: [0, 1, 0], w: 0.1, h: 0.05, depth: 0.015 });
  mg.add(roundedBox(0.3, 0.04, W * 0.9, 0.015, 2), mats.paint, { at: [X(2.33), top(X(2.33)) - 0.02, 0], rot: [0, 0, -0.3] });
  if (high) {
    // side extenders (cab fairing gap closers)
    for (const s of [1, -1]) mg.add(roundedBox(0.45, roof - 1.5, 0.04, 0.015, 2), mats.paint, { at: [-h - 0.2, 1.5 + (roof - 1.5) / 2, s * (W / 2 - 0.03)], rot: [0, -s * 0.12, 0] });
  }
  // interior
  for (const z of [0.6, -0.6]) {
    mg.add(cushion(0.5, 0.13, 0.52, { radius: 0.05 }), mats.seat, { at: [X(3.0), 1.75, z] });
    mg.add(cushion(0.13, 0.72, 0.52, { radius: 0.05 }), mats.seat, { at: [X(3.27), 2.15, z], rot: [0, 0, 0.12] });
    mg.box(0.3, 0.5, 0.3, mats.dark, { at: [X(3.0), 1.47, z] });
  }
  mg.add(roundedBox(0.4, 0.3, W - 0.3, 0.06, 3), M.plastic('#1c1c1c'), { at: [X(2.23), 1.98, 0] });
  mg.add(new THREE.TorusGeometry(0.24, 0.022, 10, 32).rotateY(Math.PI / 2).rotateZ(0.8), mats.trim, { at: [X(2.5), 2.15, -0.6] });
  if (sleeper) mg.add(cushion(1.0, 0.18, W - 0.3, { radius: 0.06 }), mats.seat, { at: [-h + 0.6, 1.62, 0] });
  mg.flush(g, 'tractor_parts');
  return { xf: cx + xf, back: frontX - Lc, roof };
}

/* ------------------------------------------------------------------ */
/* Delivery van                                                          */
/* ------------------------------------------------------------------ */

function buildVan(root, { L, mats, lamps, wr, trim }) {
  const h = L / 2;
  const W = 2.02;
  const xf = h - 1.0;
  const xr = -h + 1.35;
  const ar = wr + 0.06;
  const lift = trim === 'offroad' ? 0.12 : 0;
  const roofH = trim === 'highroof' || trim === 'refrigerated' ? 2.95 : 2.62;
  const top = smoothKeys([[-h, roofH - 0.1 + lift], [-h + 0.1, roofH + lift], [h - 1.55, roofH + lift], [h - 0.98, 1.58 + lift], [h - 0.35, 1.28 + lift], [h, 1.08 + lift]]);
  const shoulder = smoothKeys([[-h, 1.12 + lift], [h - 1.0, 1.2 + lift], [h - 0.4, 1.1 + lift], [h, 0.95 + lift]]);
  const sill = smoothKeys([[-h, 0.55 + lift], [-h + 0.3, 0.42 + lift], [h - 0.3, 0.4 + lift], [h, 0.5 + lift]]);
  const section = (x) => {
    let y0 = sill(x);
    for (const wx of [xf, xr]) {
      const dx = x - wx;
      if (Math.abs(dx) < ar) y0 = Math.max(y0, wr + Math.sqrt(ar * ar - dx * dx));
    }
    const yt = top(x);
    const yb = Math.min(shoulder(x), yt - 0.06);
    const gg = THREE.MathUtils.clamp((yt - yb - 0.12) / 1.2, 0, 1);
    return { y0, yb, yt, w: W, wt: W * (0.95 - 0.02 * gg), r1: 0.1, r2: 0.06 + 0.16 * gg, crown: 0.03, bulge: 0.02, sideBulge: 0.02 };
  };
  const ws = [h - 1.48, h - 1.02];
  const cabWin = [h - 2.05, h - 1.02];
  const slide = -0.4;
  const doors = [h - 0.98, h - 2.1, slide, -h + 0.02];
  const breaks = [...ws, ...cabWin, ...doors.flatMap((d) => [d, d + 0.008]), h - 0.32, h - 0.05, h - 0.03];
  for (const wx of [xf, xr]) for (let k = -ar; k <= ar + 1e-6; k += ar / 8) breaks.push(wx + k);
  const loft = createLoft({ length: L, nose: { len: 0.75, p: 2.4 }, tail: { len: 0.12, p: 6 }, breaks, section, stations: 120 });
  const I = loft.idx;
  const body = group('body', { parent: root });
  const glassGeos = [
    loft.patch({ x: ws, from: I('roofCorner', 0.35), side: 'across', hole: true, offset: 0 }),
    loft.patch({ x: cabWin, from: I('side', 0.04), to: I('side', 0.42), side: 'both', hole: true, offset: 0 }),
    loft.patch({ x: [-h, -h + 0.06], from: I('side', 0.12), to: I('side', 0.4), side: 'both', hole: true, offset: 0 }),
  ];
  for (const gg of glassGeos) mesh(gg, mats.glass, { parent: body, name: 'glass' });
  for (const d of doors.slice(0, 3)) mesh(loft.patch({ x: [d, d + 0.008], from: I('corner', 0.5), to: I('side', 0.95), offset: 0.0015, side: d === slide ? 'pos' : 'both' }), mats.seam, { parent: body });
  mesh(loft.patch({ x: [-1.2, slide], from: I('side', 0.43), to: I('side', 0.45), side: 'pos', offset: 0.002 }), mats.trim, { parent: body });
  mesh(loft.patch({ x: [h - 0.45, h], from: 0, to: I('corner', 0.9), offset: 0.004 }), mats.trim, { parent: body });
  mesh(loft.patch({ x: [-h, -h + 0.2], from: 0, to: I('lower', 0.12), offset: 0.004 }), mats.trim, { parent: body });
  mesh(loft.patch({ x: [xr + ar + 0.02, xf - ar - 0.02], from: I('corner', 0.1), to: I('corner', 0.7), offset: 0.003 }), mats.trim, { parent: body });
  lamps.head.add(body, { geometry: loft.patch({ x: [h - 0.32, h - 0.05], from: I('lower', 0.62), to: I('lower', 0.98), offset: 0.004 }), normal: [1, 0, 0] });
  for (const [s, side] of [[-1, 'L'], [1, 'R']]) {
    const p = loft.pointAt(h - 0.22, 'lower', 0.5, s);
    (side === 'L' ? lamps.signalL : lamps.signalR).add(body, { at: [p.point.x, p.point.y, p.point.z], normal: [p.normal.x, p.normal.y, p.normal.z], w: 0.14, h: 0.045, depth: 0.012 });
  }
  mesh(loft.patch({ x: [h - 0.03, h], from: I('lower', 0.2), to: I('lower', 0.6), offset: 0.004 }), trim === 'electric' ? mats.blue : mats.gloss, { parent: body, name: 'grille' });
  const shell = loft.bodyGeometry();
  mesh(shell, mats.paint, { parent: body, name: 'shell' });
  mesh(shell, mats.interior, { parent: body, name: 'cabin' });
  const mg = new Merge();
  mg.box(0.012, roofH - 0.95, 0.012, mats.seam, { at: [-h - 0.004, 1.5 + lift, 0] });
  // vertical rear lamp clusters on the rear corners
  for (const s of [1, -1]) {
    const z = s * (W / 2 - 0.09);
    const rx = -h + 0.006;
    lamps.tail.add(body, { at: [rx, 1.12 + lift, z], normal: [-1, 0, 0], w: 0.12, h: 0.2 });
    lamps.brake.add(body, { at: [rx, 0.9 + lift, z], normal: [-1, 0, 0], w: 0.12, h: 0.16 });
    (s < 0 ? lamps.signalL : lamps.signalR).add(body, { at: [rx, 0.72 + lift, z], normal: [-1, 0, 0], w: 0.12, h: 0.12 });
    lamps.reverse.add(body, { at: [rx, 0.58 + lift, s * 0.35], normal: [-1, 0, 0], w: 0.1, h: 0.06 });
    const p = loft.pointAt(h - 1.1, 'side', 0.05, s);
    mg.add(cushion(0.1, 0.32, 0.2, { radius: 0.04, bulge: 0.1 }), mats.gloss, { at: [p.point.x, p.point.y + 0.15, p.point.z + s * 0.14] });
    mg.box(0.1, 0.05, 0.16, mats.gloss, { at: [p.point.x, p.point.y + 0.02, p.point.z + s * 0.06], r: 0.015 });
  }
  lamps.brake.add(body, { at: [-h + 0.006, roofH - 0.08 + lift, 0], normal: [-1, 0, 0], w: 0.3, h: 0.04, depth: 0.01 }); // third brake light
  plate(body, [-h - 0.004, 0.5 + lift, 0], -1);
  {
    const fp = loft.pointAt(h, 'lower', 0.62).point;
    plate(body, [h + 0.01, 0.6 + lift, 0], 1);
    emblem(body, 'emblem_front', 0.1, [fp.x + 0.006, fp.y + 0.05, 0], 1);
    emblem(body, 'emblem_rear', 0.09, [-h - 0.006, 1.55 + lift, 0.25], -1);
  }
  // interior
  for (const z of [0.45, -0.45]) {
    mg.add(cushion(0.48, 0.12, 0.48, { radius: 0.05 }), mats.seat, { at: [h - 1.85, 0.95 + lift, z] });
    mg.add(cushion(0.12, 0.65, 0.48, { radius: 0.05 }), mats.seat, { at: [h - 2.1, 1.3 + lift, z], rot: [0, 0, 0.15] });
    mg.box(0.28, 0.45, 0.28, mats.dark, { at: [h - 1.85, 0.68 + lift, z] });
  }
  mg.add(roundedBox(0.4, 0.25, W * 0.85, 0.06, 3), M.plastic('#1d1d1f', 0.7), { at: [h - 1.15, 1.2 + lift, 0] });
  mg.add(new THREE.TorusGeometry(0.18, 0.02, 10, 32).rotateY(Math.PI / 2).rotateZ(0.6), mats.trim, { at: [h - 1.38, 1.32 + lift, -0.45] });
  mg.box(0.04, roofH - 1.0, W * 0.9, M.matte('#3a3d40', 0.8), { at: [h - 2.35, 0.5 + lift + (roofH - 1.0) / 2, 0] });
  mg.box(L - 1.2, 0.05, W * 0.9, M.matte('#3a3d40', 0.8), { at: [-0.4, 0.48 + lift, 0] }); // cargo floor
  // trims
  if (trim === 'ladder-rack') {
    for (const x of [-h + 0.4, -0.6, h - 1.9]) {
      for (const s of [1, -1]) mg.box(0.08, 0.12, 0.08, mats.dark, { at: [x, roofH + lift + 0.04, s * 0.85], r: 0.015 });
      mg.box(0.06, 0.05, 1.86, mats.alu, { at: [x, roofH + lift + 0.12, 0], r: 0.015 });
    }
    for (const s of [1, -1]) mg.box(L - 1.9, 0.05, 0.05, mats.alu, { at: [-0.65, roofH + lift + 0.16, s * 0.9], r: 0.015 });
    ladder(mg, [-h + 0.2, roofH + lift + 0.2, 0.35], [h - 1.9, roofH + lift + 0.2, 0.35], 0.42, { dark: mats.alu, steel: mats.alu }, 12);
  }
  if (trim === 'refrigerated') {
    mg.add(roundedBox(0.7, 0.35, 1.5, 0.1, 3), mats.decal, { at: [h - 1.9, roofH + lift + 0.17, 0] });
    for (let k = 0; k < 4; k++) mg.add(new THREE.CircleGeometry(0.12, 20).rotateX(-Math.PI / 2), mats.dark, { at: [h - 1.9 + (k % 2 ? 0.15 : -0.15), roofH + lift + 0.352, k < 2 ? -0.35 : 0.35] });
  }
  if (trim === 'offroad') {
    mg.box(0.1, 0.07, 1.6, mats.dark, { at: [h - 1.45, roofH + lift + 0.08, 0], r: 0.02 });
    for (const s of [1, -1]) mg.box(0.08, 0.1, 0.06, mats.dark, { at: [h - 1.45, roofH + lift + 0.02, s * 0.75], r: 0.01 });
    for (const z of [-0.5, 0, 0.5]) lamps.work.add(body, { at: [h - 1.39, roofH + lift + 0.08, z], normal: [1, 0, 0], w: 0.18, h: 0.08, depth: 0.04 });
    for (const s of [1, -1]) mg.tube([h - 0.1, 0.55 + lift, s * 0.55], [h + 0.15, 0.55 + lift, s * 0.55], 0.035, mats.dark, 10);
    mg.pipe([[h + 0.15, 0.4 + lift, -0.6], [h + 0.15, 0.95 + lift, -0.5], [h + 0.15, 0.95 + lift, 0.5], [h + 0.15, 0.4 + lift, 0.6]], 0.035, mats.dark, 24, 10);
  }
  if (trim === 'electric') {
    mg.box(0.02, 0.12, 0.16, mats.blue, { at: [h - 0.5, 1.0 + lift, W / 2 + 0.005], r: 0.006 });
  }
  mg.flush(body, 'van_parts');
  for (const wx of [xf, xr]) wheelWell(body, wx, ar - 0.005, W * 0.9, wr);
  const wz = W / 2 - 0.15;
  const res = addHeavyWheels(root, [['wheel_FL', xf, wz, true], ['wheel_FR', xf, -wz, true], ['wheel_RL', xr, wz], ['wheel_RR', xr, -wz]], {
    radius: wr, width: wr * 0.62, style: trim === 'offroad' ? 'lug' : 'truck',
  });
  // suspension: axles + struts tie the wheels to the body
  const sm = new Merge();
  sm.add(new THREE.CylinderGeometry(0.05, 0.05, 2 * wz, 12).rotateX(Math.PI / 2), mats.iron, { at: [xr, wr, 0] });
  sm.add(new THREE.SphereGeometry(0.17, 14, 10), mats.iron, { at: [xr, wr, 0] });
  for (const s of [1, -1]) {
    sm.tube([xr, wr, s * 0.55], [xr - 0.05, sill(xr) + 0.1, s * 0.55], 0.04, mats.dark, 8);
    sm.tube([xf, wr, s * (wz - 0.15)], [xf - 0.05, sill(xf) + 0.4, s * (wz - 0.2)], 0.045, mats.dark, 8);
    sm.box(0.5, 0.06, 0.06, mats.iron, { at: [xf + 0.05, wr, s * (wz - 0.35)], r: 0.01 });
    sm.tube([xf, wr, s * (wz - 0.15)], [xf, wr, s * 0.35], 0.03, mats.iron, 8);
  }
  sm.box(0.12, 0.12, 0.8, mats.iron, { at: [xf, wr, 0], r: 0.02 });
  sm.tube([xf, wr, -0.35], [xf, wr, 0.35], 0.03, mats.iron, 8);
  sm.tube([xr + 0.2, wr, 0], [xf - 0.6, sill(0) + 0.05, 0], 0.045, mats.steel, 8);
  sm.add(roundedBox(0.8, 0.3, 0.5, 0.1, 3), mats.iron, { at: [xf - 0.75, sill(xf - 0.75) + 0.08, 0] });
  sm.flush(root, 'van_chassis');
  return res;
}

/* ------------------------------------------------------------------ */
/* Bodies (rigid trucks)                                                 */
/* ------------------------------------------------------------------ */

export function subframe(mg, x0, x1, mats, top = 1.12) {
  for (const z of [RAIL_Z, -RAIL_Z]) mg.box(x1 - x0, top - RAIL_TOP + 0.005, 0.1, mats.steel, { at: [(x0 + x1) / 2, (top + RAIL_TOP) / 2, z], r: 0.008 });
}

function boxBody(root, mg, { x0, x1, y0 = 1.12, height = 2.6, W = 2.5, mat, mats, lamps, doors = [] }) {
  const len = x1 - x0;
  const cx = (x0 + x1) / 2;
  subframe(mg, x0, x1, mats, y0);
  mg.add(roundedBox(len, height, W, 0.05, 2), mat, { at: [cx, y0 + height / 2, 0] });
  for (let x = x0 + 0.3; x < x1 - 0.2; x += 0.58) for (const s of [1, -1]) mg.box(0.05, height - 0.18, 0.02, mats.alu, { at: [x, y0 + height / 2, s * (W / 2 + 0.008)], r: 0.006 });
  for (const y of [y0 + 0.06, y0 + height - 0.04]) mg.add(roundedBox(len + 0.02, 0.1, W + 0.04, 0.02, 2), mats.alu, { at: [cx, y, 0] });
  const tapeW = M.matte('#f2f2f2', 0.4);
  const tapeR = M.matte('#d81f1f', 0.4);
  for (let i = 0; i < Math.floor((len - 0.5) / 0.3); i++) for (const s of [1, -1]) mg.box(0.28, 0.05, 0.008, i % 2 ? tapeW : tapeR, { at: [x0 + 0.3 + i * 0.3, y0 + 0.17, s * (W / 2 + 0.003)], r: 0.003 }); // tape stuck on the skin
  const rx = x0 - 0.004;
  rearDoors(root, { x: x0, y0, height, W, mats, doors, panelMat: mat });
  for (const z of [-0.5, 0, 0.5]) lamps.markersRed.add(root, { at: [rx - 0.035, y0 + height - 0.08, z], normal: [-1, 0, 0], w: 0.07, h: 0.05 });
  for (const s of [1, -1]) {
    lamps.markers.add(root, { at: [x1 - 0.25, y0 + 0.3, s * (W / 2 + 0.024)], normal: [0, 0, s], w: 0.1, h: 0.05 });
    lamps.markersRed.add(root, { at: [x0 + 0.25, y0 + 0.3, s * (W / 2 + 0.024)], normal: [0, 0, s], w: 0.1, h: 0.05 });
  }
}

/* ------------------------------------------------------------------ */
/* Animations                                                            */
/* ------------------------------------------------------------------ */

export function truckAnimations({ spins, steers, wr, speed, spots, lamps }) {
  const has = (k) => lamps[k] && lamps[k].meshes.length > 0;
  const set = vehicleAnimations({
    spins, steers, radius: wr, speed, steerMax: 0.45, spots,
    lamps: {
      head: has('head') ? 'headlights' : undefined,
      tail: has('tail') ? 'taillights' : undefined,
      brake: has('brake') ? 'brakelights' : undefined,
      signalL: has('signalL') ? 'indicator_L' : undefined,
      signalR: has('signalR') ? 'indicator_R' : undefined,
      reverse: has('reverse') ? 'reverselights' : undefined,
    },
  });
  const lights = set.animations.find((c) => c.name === 'lights');
  if (lights) {
    if (has('markers')) lights.tracks.push(...lampTracks('markers', LAMP_ON.amber * 0.7, { glow: 0.5 }));
    if (has('markersRed')) lights.tracks.push(...lampTracks('markers_red', LAMP_ON.red * 0.6, { glow: 0.4 }));
    if (has('work')) lights.tracks.push(...lampTracks('worklights', LAMP_ON.white));
  }
  if (has('beacon')) {
    const P = 0.8;
    set.animations.push(clip('beacon', P, [
      new THREE.NumberKeyframeTrack('beacon.material.emissiveIntensity', [0, 0.1, 0.2, 0.3, 0.4, 0.8], [LAMP_ON.amber * 1.4, 0.2, LAMP_ON.amber * 1.4, 0.2, 0.2, 0.2], THREE.InterpolateDiscrete),
      new THREE.NumberKeyframeTrack('beacon_glow.material.opacity', [0, 0.1, 0.2, 0.3, 0.4, 0.8], [1, 0, 1, 0, 0, 0], THREE.InterpolateDiscrete),
    ]));
  }
  return set;
}

/* ------------------------------------------------------------------ */
/* Main factory                                                          */
/* ------------------------------------------------------------------ */

export function createTruck(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(TRUCK_VARIANTS, o.variant, 'truck');
  const trim = o.trim ?? null;
  const v = TRUCK_VARIANTS[variant];
  const SCHEME = { chrome: '#151618', offroad: '#5a6b3a', municipal: '#f26b0f', electric: '#16a394', highroof: '#a51c24', long: '#2a4f8a', 'ladder-rack': '#f2f2ee', refrigerated: '#e9f2f6' };
  const mats = materials(trim && SCHEME[trim] && !o.color ? { ...o, color: SCHEME[trim] } : o, v);
  const lamps = truckLamps();
  const root = group(`truck-${variant}${trim ? `-${trim}` : ''}`);
  const W = 2.5;
  const extra = [];
  const doors = [];
  let wr = variant === 'delivery-van' ? (trim === 'offroad' ? 0.4 : 0.36) : trim === 'offroad' ? 0.58 : 0.52;
  let spins;
  let steers;

  if (v.van) {
    const L = v.L + (trim === 'long' ? 1.0 : 0);
    ({ spins, steers } = buildVan(root, { L, mats, lamps, wr, trim }));
  } else if (v.conventional) {
    ({ spins, steers } = buildSemi(root, { mats, lamps, wr, trim, extra, doors }));
  } else {
    const long = trim === 'long';
    const L = v.L + (long ? 1.8 : 0);
    const frontX = L / 2;
    const xf = frontX - 1.35;
    let rear = v.rear.map((x) => x - (long ? 0.9 : 0));
    if (long && rear.length === 1) rear = [rear[0], rear[0] - 1.31];
    const H = trim === 'highroof' ? 3.6 : 3.05;
    const cab = buildCabOver(root, { frontX, xf, wr, crew: v.crew, W, H, mats, lamps, roofColored: !!v.roof, trim });
    const back = cab.back;
    const mg = new Merge();
    const tw = 0.3;
    const wz = W / 2 - tw / 2 - 0.02;
    const x0 = -L / 2 + 0.15;
    const x1 = back - 0.12;
    chassis(root, mg, { x0: -L / 2 + 0.1, x1: frontX - 0.22, axles: [{ x: xf, steer: true }, ...rear.map((x, i) => ({ x, drive: !(long && v.rear.length === 1 && i === 1) }))], wr, wz, mats, gearX: xf - 1.0 });
    rearEnd(root, mg, { x: -L / 2 + 0.05, W, mats, lamps });
    rearFenders(mg, rear, wz, wr, mats);
    const electric = trim === 'electric';
    tanks(mg, { x: xf - 1.55, side: 1, mats, electric, wz });
    if (electric) tanks(mg, { x: xf - 1.55, side: -1, mats, electric, wz });
    else {
      // battery / tool box on the other side
      mg.add(roundedBox(0.7, 0.5, 0.5, 0.05, 2), mats.trim, { at: [xf - 1.55, RAIL_TOP - 0.3, -(RAIL_Z + 0.32)] });
      mg.box(0.5, 0.12, 0.12, mats.steel, { at: [xf - 1.55, RAIL_TOP - 0.3, -(RAIL_Z + 0.06)], r: 0.01 });
      // exhaust stack behind the cab
      exhaust(mg, [back - 0.12, RAIL_TOP - 0.1, -(W / 2 - 0.25)], H + 0.2 - RAIL_TOP, mats, 0.06);
      mg.box(0.18, 0.1, 0.1, mats.steel, { at: [back - 0.05, RAIL_TOP + 0.6, -(W / 2 - 0.25)], r: 0.01 });
      mg.box(0.1, 0.12, W / 2 - 0.25 - RAIL_Z, mats.steel, { at: [back - 0.12, RAIL_TOP - 0.04, -(RAIL_Z + (W / 2 - 0.25 - RAIL_Z) / 2)], r: 0.01 });
    }
    // air tanks on brackets
    for (const s of [1, -1]) {
      const ax = rear[0] + wr + 0.65;
      if (ax < xf - 2.4) {
        mg.add(new THREE.CylinderGeometry(0.13, 0.13, 0.9, 16).rotateZ(Math.PI / 2), mats.iron, { at: [ax, RAIL_BOTTOM + 0.05, s * (RAIL_Z + 0.2)] });
        mg.box(0.08, 0.08, 0.16, mats.steel, { at: [ax, RAIL_BOTTOM + 0.12, s * (RAIL_Z + 0.07)], r: 0.01 });
      }
    }
    ({ spins, steers } = addHeavyWheels(root, [
      ['wheel_FL', xf, wz, true, false], ['wheel_FR', xf, -wz, true, false],
      ...rear.flatMap((x, i) => [[`wheel_R${i}L`, x, wz, false, true], [`wheel_R${i}R`, x, -wz, false, true]]),
    ], { radius: wr, width: tw, style: trim === 'offroad' ? 'lug' : trim === 'chrome' ? 'alu' : 'truck' }));
    if (trim === 'municipal') {
      plough(root, mg, { x: cab.cx + cab.bf + 0.1, mats });
      chevrons(mg, [-L / 2 + 0.05 + 0.112, 0.5, 0], W - 0.3, 0.13, -1, mats); // on the underrun bar face
    }

    if (variant === 'box') {
      boxBody(root, mg, { x0, x1, mat: mats.cargo, mats, lamps, doors, height: trim === 'highroof' ? 2.9 : 2.6 });
      sideGuard(mg, rear[0] + 0.75, xf - 2.3, W, mats);
    } else if (variant === 'tanker') {
      const len = x1 - x0;
      const cx = (x0 + x1) / 2;
      const tg = group('tank', { parent: root });
      const tm = new Merge();
      const tankM = M.metal(mats.cargoColor, 0.18);
      const ty = 2.1;
      for (const x of [x1 - 0.6, x0 + 0.9, cx]) tm.add(extrudeOutline([[-0.95, 0], [0.95, 0], [0.78, 0.36], [-0.78, 0.36]], 0.2, { bevel: 0.02 }), mats.steel, { at: [x, RAIL_TOP, 0], rot: [0, Math.PI / 2, 0] });
      tm.add(new THREE.CylinderGeometry(1.02, 1.02, len - 0.7, 48).rotateZ(Math.PI / 2), tankM, { at: [cx, ty, 0] });
      for (const s of [1, -1]) tm.add(new THREE.SphereGeometry(1.02, 40, 20).scale(0.35, 1, 1), tankM, { at: [cx + s * (len / 2 - 0.35), ty, 0] });
      for (let x = x0 + 0.6; x < x1 - 0.4; x += 1.25) tm.add(new THREE.TorusGeometry(1.03, 0.03, 8, 48).rotateY(Math.PI / 2), mats.steel, { at: [x, ty, 0] });
      tm.box(len - 1.2, 0.04, 0.5, mats.alu, { at: [cx, ty + 1.04, 0] });
      for (const s of [1, -1]) {
        const pts = [];
        for (let x = x0 + 0.7; x <= x1 - 0.7; x += (len - 1.4) / 6) {
          pts.push([x, ty + 1.52, s * 0.28]);
          tm.tube([x, ty + 1.04, s * 0.28], [x, ty + 1.52, s * 0.28], 0.015, M.paint('#f2b705'), 6);
        }
        tm.pipe(pts, 0.02, M.paint('#f2b705'), 24, 6);
      }
      for (const k of [-1, 0, 1]) tm.add(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 24), mats.steel, { at: [cx + k * (len / 3.5), ty + 1.07, 0] });
      ladder(tm, [x0 - 0.08, RAIL_TOP - 0.1, 0], [x0 + 0.2, ty + 1.04, 0], 0.5, mats, 7);
      tm.box(0.1, 0.1, 0.6, mats.steel, { at: [x0 - 0.05, RAIL_TOP - 0.05, 0], r: 0.01 });
      tm.add(roundedBox(1.0, 0.55, 0.45, 0.04, 2), mats.alu, { at: [cx, 0.8, -(RAIL_Z + 0.3)] });
      tm.box(0.6, 0.12, 0.12, mats.steel, { at: [cx, 0.9, -(RAIL_Z + 0.06)], r: 0.01 });
      tm.flush(tg, 'tank_body');
      for (const s of [1, -1]) lamps.markers.add(tg, { at: [x1 - 0.4, 1.55, s * 0.98], normal: [0, 0, s], w: 0.1, h: 0.05 });
    } else if (variant === 'flatbed') {
      const len = x1 - x0;
      const cx = (x0 + x1) / 2;
      subframe(mg, x0, x1, mats, 1.02);
      mg.box(len, 0.12, W, M.wood(mats.cargoColor ?? 'walnut'), { at: [cx, 1.08, 0] });
      for (const s of [1, -1]) {
        mg.box(len, 0.16, 0.06, mats.alu, { at: [cx, 1.08, s * (W / 2 - 0.02)], r: 0.012 });
        for (let x = x0 + 0.4; x < x1; x += 0.6) mg.box(0.08, 0.12, 0.06, mats.steel, { at: [x, 1.05, s * (W / 2 + 0.03)], r: 0.01 });
      }
      for (const s of [1, -1]) lamps.markers.add(root, { at: [x1 - 0.3, 1.08, s * (W / 2 + 0.01)], normal: [0, 0, s], w: 0.1, h: 0.05 });
      // headboard
      for (const z of [-1.18, -0.6, 0, 0.6, 1.18]) mg.tube([x1 - 0.05, 1.14, z], [x1 - 0.05, 2.54, z], 0.03, mats.alu, 8);
      for (const y of [1.59, 2.04, 2.54]) mg.tube([x1 - 0.05, y, -1.2], [x1 - 0.05, y, 1.2], 0.03, mats.alu, 8);
      const cartonMat = M.matte('#c49a6c', 0.85);
      const strap = M.matte('#e65100', 0.6);
      for (let k = 0; k < 2; k++) {
        const px = x1 - 1.0 - k * 1.45;
        for (let i = 0; i < 3; i++) mg.box(1.2, 0.03, 0.12, M.wood('pine'), { at: [px, 1.155, -0.42 + i * 0.42], r: 0.008 });
        mg.box(1.2, 0.03, 1.0, M.wood('pine'), { at: [px, 1.185, 0], r: 0.008 });
        for (let yi = 0; yi < 3; yi++) for (let zi = 0; zi < 2; zi++) for (let xi = 0; xi < 2; xi++) {
          mg.add(roundedBox(0.58, 0.38, 0.48, 0.01, 1), cartonMat, { at: [px - 0.3 + xi * 0.6, 1.39 + yi * 0.385, -0.25 + zi * 0.5] });
        }
        for (const z of [0.505, -0.505]) mg.add(roundedBox(0.05, 1.18, 0.012, 0.005, 1), strap, { at: [px, 1.78, z] });
        mg.add(roundedBox(0.05, 0.012, 1.02, 0.005, 1), strap, { at: [px, 2.365, 0] });
      }
      for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) {
        mg.add(lathe([[0.1, -1.6], [0.12, -1.6], [0.12, 1.6], [0.1, 1.6]], 18).rotateZ(Math.PI / 2), M.metal('#7d8288', 0.4), { at: [x0 + 1.9, 1.26 + row * 0.21, -0.36 + i * 0.24 + row * 0.12] });
      }
      mg.pipe([[x0 + 1.9, 1.14, -0.62], [x0 + 1.9, 1.6, -0.58], [x0 + 1.9, 1.84, 0], [x0 + 1.9, 1.6, 0.58], [x0 + 1.9, 1.14, 0.62]], 0.012, strap, 24, 6);
    } else if (variant === 'dump') {
      const len = x1 - x0 + 0.05;
      const hinge = [x0 + 0.05, 1.18];
      subframe(mg, x0, x1, mats, hinge[1]);
      for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12).rotateX(Math.PI / 2), mats.iron, { at: [hinge[0], hinge[1], s * RAIL_Z] });
      const bed = group('dump_bed', { parent: root, at: [hinge[0], hinge[1], 0] });
      const bm = new Merge();
      const bw = W - 0.06;
      const wallH = 1.15;
      bm.box(len, 0.08, bw, mats.cargo, { at: [len / 2, 0.04, 0] });
      const sideGeo = extrudeOutline([[0, 0], [len, 0], [len, wallH + 0.2], [0.35, wallH]], 0.07, { bevel: 0.015 });
      for (const s of [1, -1]) {
        bm.add(sideGeo, mats.cargo, { at: [0, 0, s * (bw / 2 - 0.035)] });
        for (let x = 0.5; x < len - 0.2; x += 0.75) bm.box(0.08, wallH * 0.85, 0.05, mats.cargo, { at: [x, wallH * 0.45, s * (bw / 2 + 0.02)], r: 0.012 });
        bm.pipe([[0.35, wallH + 0.02, s * bw / 2], [len, wallH + 0.22, s * bw / 2]], 0.04, mats.cargo, 6, 8);
      }
      bm.box(len, 0.12, 0.7, mats.steel, { at: [len / 2, -0.04, 0], r: 0.015 }); // bed long-members on the hinge
      const frontH = cab.roofY + 0.12 - hinge[1];
      bm.box(0.08, frontH, bw, mats.cargo, { at: [len - 0.04, frontH / 2, 0] });
      bm.box(0.7, 0.06, bw, mats.cargo, { at: [len + 0.3, frontH - 0.03, 0] });
      bm.flush(bed, 'dump_bed_body');
      const gate = group('tailgate', { parent: bed, at: [0.02, wallH, 0] });
      const gm = new Merge();
      gm.box(0.07, wallH, bw - 0.1, mats.cargo, { at: [0, -wallH / 2, 0] });
      for (const s of [1, -1]) gm.add(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10).rotateX(Math.PI / 2), mats.iron, { at: [0, 0, s * (bw / 2 - 0.08)] });
      gm.flush(gate, 'tailgate_body');
      // telescopic hoist ram from a cross-member to the bed front
      const tipA = anchor(bed, [len * 0.78, 0, 0]);
      mg.box(0.3, 0.12, RAIL_Z * 2, mats.steel, { at: [hinge[0] + len * 0.78, RAIL_TOP + 0.02, 0], r: 0.015 });
      const ram = makeRam(root, 'ram', [hinge[0] + len * 0.78, RAIL_TOP + 0.08, 0], tipA, { r: 0.11, mats: { ...mats, paint: mats.steel } });
      extra.push(poseClip('tip', 6, [bed, gate], [ram], (t) => {
        const a = 0.85 * Math.min(1, cycle(t, 0.2) * 1.2);
        bed.rotation.z = a;
        gate.rotation.z = -a;
      }, 36));
    } else if (variant === 'garbage') {
      const bx1 = x1;
      const bx0 = x0 + 1.25;
      const len = bx1 - bx0;
      subframe(mg, x0, x1, mats);
      const bodyM = new Merge();
      const bodyG = group('compactor', { parent: root });
      bodyM.add(roundedBox(len, 2.35, W, 0.22, 3), mats.cargo, { at: [(bx0 + bx1) / 2, 2.295, 0] });
      for (const y of [1.6, 2.3, 3.0]) for (const s of [1, -1]) bodyM.box(len - 0.4, 0.05, 0.02, mats.cargo, { at: [(bx0 + bx1) / 2, y, s * (W / 2 + 0.008)], r: 0.008 });
      for (const s of [1, -1]) bodyM.box(len - 0.3, 0.3, 0.01, mats.decal, { at: [(bx0 + bx1) / 2, 1.5, s * (W / 2 + 0.012)], r: 0.004 });
      bodyM.flush(bodyG, 'compactor_body');
      // hopper sub-frame between body and rear
      mg.box(1.2, 0.3, W - 0.2, mats.steel, { at: [x0 + 0.6, 1.25, 0], r: 0.02 });
      const gate = group('tailgate', { parent: root, at: [bx0 + 0.02, 3.42, 0] });
      const gm = new Merge();
      // hollow hopper: side cheeks, roof and sweep floor, open loading mouth at the back
      const gOut = [[0.0, 0.08], [-1.15, 0.0], [-1.4, -0.6], [-1.3, -2.05], [-0.25, -2.28], [0.0, -2.2]];
      for (const s of [1, -1]) gm.add(extrudeOutline(gOut, 0.07, { bevel: 0.02, segments: 1 }), mats.cargo, { at: [0, 0, s * (W / 2 - 0.055)] });
      plateStrip(gm, mats.cargo, [[0.0, 0.08], [-1.15, 0.0], [-1.4, -0.6]], W - 0.12, 0.07, { side: 1 });
      plateStrip(gm, mats.steel, [[-1.3, -2.05], [-0.25, -2.28], [0.0, -2.2]], W - 0.12, 0.07, { side: 1 });
      gm.box(0.06, 2.2, W - 0.14, mats.dark, { at: [-0.04, -1.06, 0], r: 0.01 });
      gm.box(0.05, 1.1, W - 0.25, mats.gloss, { at: [-0.75, -1.45, 0], rot: [0, 0, 0.5], r: 0.01 }); // packer blade
      for (const s of [1, -1]) gm.tube([-1.42, -2.0, s * 0.6], [-1.6, -2.4, s * 0.6], 0.04, mats.steel, 8);
      gm.box(0.08, 0.1, 1.4, mats.steel, { at: [-1.62, -2.42, 0], r: 0.015 });
      for (const s of [1, -1]) gm.add(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12).rotateX(Math.PI / 2), mats.iron, { at: [0, 0, s * (W / 2 - 0.1)] });
      gm.flush(gate, 'tailgate_body');
      for (const s of [1, -1]) {
        lamps.tail.add(gate, { at: [-1.39, -1.6, s * (W / 2 - 0.12)], normal: [-1, 0, 0], w: 0.12, h: 0.25 });
        lamps.brake.add(gate, { at: [-1.39, -1.9, s * (W / 2 - 0.12)], normal: [-1, 0, 0], w: 0.12, h: 0.14 });
      }
      for (const s of [1, -1]) addBeaconOn(lamps, root, [back + 0.35, 3.47, s * 0.9], mats);
      mg.box(0.3, 0.05, 2.0, mats.dark, { at: [back + 0.35, 3.47 - 0.0, 0], r: 0.015 });
      extra.push(poseClip('compact', 6, [gate], [], (t) => { gate.rotation.z = -cycle(t, 0.2) * 0.9; }, 36));
    } else if (variant === 'fire-engine') {
      const len = x1 - x0;
      const cx = (x0 + x1) / 2;
      const bodyH = 1.8;
      subframe(mg, x0, x1, mats);
      const fb = group('fire_body', { parent: root });
      const fm = new Merge();
      fm.add(roundedBox(len, bodyH, W, 0.06, 2), mats.cargo, { at: [cx, 1.12 + bodyH / 2, 0] });
      const comp = 4;
      const cw = (len - 0.3) / comp;
      for (const s of [1, -1]) for (let k = 0; k < comp; k++) {
        const ccx = x0 + 0.15 + cw * (k + 0.5);
        const dh = bodyH - 0.35;
        const dy = 1.12 + 0.2 + dh / 2;
        for (const [fx, fy, fw, fh] of [[0, dh / 2, cw - 0.06, 0.04], [0, -dh / 2, cw - 0.06, 0.04], [-(cw - 0.06) / 2, 0, 0.04, dh], [(cw - 0.06) / 2, 0, 0.04, dh]]) {
          fm.box(fw, fh, 0.03, mats.chrome, { at: [ccx + fx, dy + fy, s * (W / 2 + 0.01)], r: 0.008 });
        }
        fm.box(cw - 0.12, dh - 0.06, 0.012, M.metal('#d6d9dc', 0.35), { at: [ccx, dy, s * (W / 2 + 0.006)], r: 0.004 });
        for (let y = dy - dh / 2 + 0.06; y < dy + dh / 2 - 0.04; y += 0.065) fm.add(new THREE.BoxGeometry(cw - 0.12, 0.006, 0.004), mats.steel, { at: [ccx, y, s * (W / 2 + 0.013)] });
        fm.add(roundedBox(0.2, 0.04, 0.04, 0.01, 1), mats.chrome, { at: [ccx, dy - dh / 2 + 0.12, s * (W / 2 + 0.03)] });
      }
      for (const s of [1, -1]) fm.box(len + 0.02, 0.12, 0.01, mats.decal, { at: [cx, 1.2, s * (W / 2 + 0.008)], r: 0.004 });
      for (const s of [1, -1]) {
        fm.box(0.5, 1.2, 0.02, mats.chrome, { at: [x1 - 0.3, 1.9, s * (W / 2 + 0.012)], r: 0.006 });
        for (let k = 0; k < 4; k++) fm.add(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20).rotateX(Math.PI / 2), M.matte('#f4f4f2', 0.4), { at: [x1 - 0.4 + (k % 2) * 0.2, 2.25 - Math.floor(k / 2) * 0.2, s * (W / 2 + 0.03)] });
        fm.add(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 16).rotateX(Math.PI / 2), M.metal('#c9a227', 0.3), { at: [x1 - 0.3, 1.6, s * (W / 2 + 0.08)] });
      }
      fm.add(new THREE.CylinderGeometry(0.5, 0.55, 0.18, 32), mats.steel, { at: [x0 + 0.5, 1.12 + bodyH + 0.09, 0] });
      fm.flush(fb, 'fire_body_shell');
      for (const s of [1, -1]) lamps.markersRed.add(fb, { at: [x0 + 0.3, 2.6, s * (W / 2 + 0.008)], normal: [0, 0, s], w: 0.1, h: 0.05 });
      const ladderG = group('ladder', { parent: root, at: [x0 + 0.5, 1.12 + bodyH + 0.18, 0] });
      const lm = new Merge();
      const lLen = L - 1.4;
      for (const z of [0.36, -0.36]) lm.add(roundedBox(lLen, 0.14, 0.06, 0.02, 2), mats.alu, { at: [lLen / 2, 0.1, z] });
      for (let k = 0; k < Math.floor(lLen / 0.3); k++) lm.add(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8).rotateX(Math.PI / 2), mats.alu, { at: [0.2 + k * 0.3, 0.1, 0] });
      lm.box(0.3, 0.3, 0.9, mats.steel, { at: [0.1, 0.05, 0], r: 0.02 });
      lm.flush(ladderG, 'ladder_body');
      // ladder rest on the cab roof
      mg.box(0.12, cab.roofY + 0.04 - cab.roofY + 0.2, 0.9, mats.steel, { at: [frontX - 0.8, cab.roofY + 0.1, 0], r: 0.02 });
      // light bar: alternating red/white
      const bar = group('lightbar', { parent: root, at: [frontX - 0.6, cab.roofY, 0] });
      const barM = new Merge();
      barM.add(roundedBox(0.3, 0.08, 1.8, 0.03, 2), mats.trim, { at: [0, 0.04, 0] });
      barM.flush(bar, 'lightbar_base');
      const sa = lampGroup('siren_a', 'red');
      const sb = lampGroup('siren_b', 'white');
      for (const z of [0.65, -0.2]) sa.add(bar, { at: [0, 0.12, z], normal: [0, 1, 0], w: 0.38, h: 0.22, depth: 0.05 });
      for (const z of [0.2, -0.65]) sb.add(bar, { at: [0, 0.12, z], normal: [0, 1, 0], w: 0.38, h: 0.22, depth: 0.05 });
      const P = 0.6;
      const on = [0, P / 2, P];
      extra.push(clip('siren', P, [
        new THREE.NumberKeyframeTrack('siren_a.material.emissiveIntensity', on, [LAMP_ON.red * 1.3, 0.2, 0.2], THREE.InterpolateDiscrete),
        new THREE.NumberKeyframeTrack('siren_a_glow.material.opacity', on, [1, 0, 0], THREE.InterpolateDiscrete),
        new THREE.NumberKeyframeTrack('siren_b.material.emissiveIntensity', on, [0.1, LAMP_ON.white, LAMP_ON.white], THREE.InterpolateDiscrete),
        new THREE.NumberKeyframeTrack('siren_b_glow.material.opacity', on, [0, 1, 1], THREE.InterpolateDiscrete),
      ]));
      extra.push(poseClip('ladder', 8, [ladderG], [], (t) => { ladderG.rotation.z = cycle(t, 0.3) * 0.85; }, 36));
      mg.add(roundedBox(0.3, 0.3, W + 0.04, 0.06, 3), mats.chrome, { at: [frontX + 0.25, 0.7, 0] });
    } else if (variant === 'tow') {
      const len = x1 - x0;
      const cx = (x0 + x1) / 2;
      subframe(mg, x0, x1, mats, 1.03);
      mg.add(new THREE.BoxGeometry(len, 0.1, W - 0.1, Math.ceil(len / 0.25), 1, Math.ceil(W / 0.25)), mats.steel, { at: [cx, 1.08, 0] }); // deck plate (segmented)
      for (const s of [1, -1]) mg.add(roundedBox(len, 0.85, 0.55, 0.04, 2), M.metal('#c4c8cc', 0.35), { at: [cx, 1.555, s * (W / 2 - 0.28)] });
      for (const s of [1, -1]) for (let k = 0; k < 3; k++) mg.box(len / 3 - 0.08, 0.7, 0.01, M.metal('#aeb3b8', 0.4), { at: [x0 + (len / 3) * (k + 0.5), 1.555, s * (W / 2 - 0.0)], r: 0.004 });
      const boomX = x0 + 1.2;
      mg.add(roundedBox(0.5, 1.0, 0.6, 0.05, 2), mats.cargo, { at: [boomX, 1.62, 0] });
      const boom = group('boom', { parent: root, at: [boomX, 2.0, 0], rot: [0, 0, -0.45] });
      const bm = new Merge();
      bm.add(roundedBox(2.6, 0.24, 0.26, 0.04, 2), mats.cargo, { at: [-1.2, 0, 0] });
      bm.add(roundedBox(1.4, 0.18, 0.2, 0.04, 2), M.metal('#c4c8cc', 0.3), { at: [-2.4, 0, 0] });
      bm.add(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 20).rotateX(Math.PI / 2), mats.steel, { at: [0, 0, 0] });
      bm.add(new THREE.CylinderGeometry(0.06, 0.06, 0.74, 14).rotateX(Math.PI / 2), mats.steel, { at: [0, 0, 0] }); // pivot pin through the pedestal cheeks
      bm.flush(boom, 'boom_body');
      const hook = group('hook', { parent: boom, at: [-3.05, 0, 0] });
      const hm = new Merge();
      hm.add(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 20).rotateX(Math.PI / 2), mats.steel);
      hm.tube([0, 0, 0], [0, -0.9, 0], 0.012, mats.steel, 6);
      hm.add(new THREE.TorusGeometry(0.08, 0.02, 8, 20, Math.PI * 1.4), mats.steel, { at: [0, -0.98, 0] });
      hm.flush(hook, 'hook_body');
      // boom lift ram
      const tipA = anchor(boom, [-1.0, -0.1, 0]);
      const ram = makeRam(root, 'boom_ram', [boomX - 0.25, 1.6, 0], tipA, { r: 0.07, mats: { ...mats, paint: mats.cargo } });
      // wheel lift
      const liftG = group('wheel_lift', { parent: root, at: [x0 + 0.1, 0.55, 0] });
      const lm = new Merge();
      lm.box(1.3, 0.14, 0.2, mats.cargo, { at: [-0.55, 0, 0], r: 0.02 });
      lm.box(0.15, 0.12, 1.6, mats.cargo, { at: [-1.2, 0, 0], r: 0.02 });
      for (const s of [1, -1]) lm.box(0.5, 0.08, 0.1, M.paint('#f2b705'), { at: [-1.2, 0, s * 0.62], r: 0.015 });
      lm.box(0.2, RAIL_BOTTOM - 0.55 + 0.1, 0.2, mats.cargo, { at: [0.1, (RAIL_BOTTOM - 0.55 + 0.1) / 2 - 0.02, 0], r: 0.02 });
      lm.flush(liftG, 'wheel_lift_body');
      mg.box(0.3, 0.1, RAIL_Z * 2 + 0.1, mats.steel, { at: [x0 + 0.2, RAIL_BOTTOM - 0.02, 0], r: 0.015 });
      mg.box(0.3, 0.05, 1.6, mats.dark, { at: [frontX - 0.7, cab.roofY + 0.025, 0], r: 0.015 });
      for (const s of [1, -1]) addBeaconOn(lamps, root, [frontX - 0.7, cab.roofY + 0.05, s * 0.55], mats);
      extra.push(poseClip('boom', 6, [boom, hook], [ram], (t) => {
        const a = cycle(t, 0.3);
        boom.rotation.z = -0.45 - a * 0.35;
        hook.rotation.z = 0.45 + a * 0.35;
      }, 36));
    } else if (variant === 'cement-mixer') {
      mixerBody(root, mg, { x0, x1, mats, extra, W });
    }
    mg.flush(root, 'chassis');
  }

  pruneEmpty(root);
  const head = root.getObjectByName('headlights');
  let spots = [];
  if (head && o.lights !== false) {
    root.updateMatrixWorld(true);
    const hp = head.getWorldPosition(new THREE.Vector3());
    spots = addHeadlightSpots(root, [hp.x + 0.1, hp.y, Math.max(0.5, Math.abs(hp.z))]);
  }
  const set = truckAnimations({ spins, steers, wr, speed: o.speed ?? 6, spots, lamps });
  const anims = [...set.animations, ...extra];
  lifeClips(anims, [root.getObjectByName('cab') ?? root.getObjectByName('tractor') ?? root.getObjectByName('body')], doors);
  const truck = finalize(root, { type: 'truck', variant, options: o, animations: anims });
  truck.userData.premade.oneShot = set.oneShot;
  truck.userData.premade.exclusive = set.exclusive;
  return truck;
}

/**
 * Concrete mixer body (9 m³ class): long tilted pear-shaped drum (belly toward the front, 13° tilt,
 * narrow open mouth at the rear) on a front gearbox pedestal and rear roller pedestal, charging +
 * collection hoppers, swivelling discharge chute, extension chutes, ladder + platform, water tank.
 */
function mixerBody(root, mg, { x0, x1, mats, extra, W }) {
  subframe(mg, x0, x1, mats);
  const tilt = 0.225;
  const c = Math.cos(tilt);
  const sn = Math.sin(tilt);
  const dx = (x0 + x1) / 2 - 0.1;
  const dy = 2.45;
  const P = (lx, ly = 0) => [dx + lx * c + ly * sn, dy - lx * sn + ly * c]; // drum-local → world (x, y)
  // drum radius along its axis (local x: -2.35 = rear mouth … +2.15 = front drive end)
  const prof = [[0.33, -2.38], [0.38, -2.3], [0.42, -2.2], [0.62, -1.5], [0.86, -0.75], [1.06, 0.0], [1.14, 0.45], [1.12, 0.85], [0.98, 1.35], [0.72, 1.8], [0.5, 2.05], [0.32, 2.15], [0.001, 2.18]];
  const rAt = (x) => {
    for (let i = 1; i < prof.length; i++) if (x <= prof[i][1]) {
      const [r0, x0p] = prof[i - 1];
      const [r1, x1p] = prof[i];
      return r0 + (r1 - r0) * ((x - x0p) / (x1p - x0p));
    }
    return 0;
  };
  const tiltG = group('drum_tilt', { parent: root, at: [dx, dy, 0], rot: [0, 0, -tilt] });
  const drum = group('drum', { parent: tiltG });
  const dm = new Merge();
  const shell = lathe(prof.map(([r, x]) => [r, x]), 56).rotateZ(-Math.PI / 2);
  dm.add(shell, mats.cargo);
  // dark inside of the mouth
  dm.add(new THREE.CircleGeometry(0.32, 24).rotateY(-Math.PI / 2), mats.black, { at: [-2.3, 0, 0] });
  dm.add(new THREE.TorusGeometry(0.36, 0.035, 8, 32).rotateY(Math.PI / 2), mats.steel, { at: [-2.36, 0, 0] });
  // painted bands, weld seams, helical fin hints
  for (const x of [-0.85, 1.25]) dm.add(new THREE.TorusGeometry(rAt(x) + 0.004, 0.085, 6, 56).rotateY(Math.PI / 2).scale(0.35, 1, 1), mats.decal, { at: [x, 0, 0] });
  for (const x of [-1.9, -0.2, 0.6, 1.7]) dm.add(new THREE.TorusGeometry(rAt(x) + 0.006, 0.008, 4, 56).rotateY(Math.PI / 2), mats.steel, { at: [x, 0, 0] });
  for (const ph of [0, Math.PI]) {
    const helix = [];
    for (let i = 0; i <= 140; i++) {
      const u = i / 140;
      const x = -2.1 + u * 3.9;
      const a = ph + u * Math.PI * 2 * 2.25;
      const r = rAt(x) + 0.012;
      helix.push([x, Math.cos(a) * r, Math.sin(a) * r]);
    }
    dm.pipe(helix, 0.022, mats.cargo, 260, 6);
  }
  // roller track ring + drive flange
  dm.add(new THREE.TorusGeometry(rAt(-1.5) + 0.03, 0.045, 8, 48).rotateY(Math.PI / 2).scale(1.6, 1, 1), mats.iron, { at: [-1.5, 0, 0] });
  dm.add(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 28).rotateZ(Math.PI / 2), mats.iron, { at: [2.17, 0, 0] });
  dm.flush(drum, 'drum_shell');

  // front pedestal: gearbox + hydraulic motor
  const [fxw, fyw] = P(2.3);
  mg.add(roundedBox(0.55, fyw - 1.12 + 0.15, 0.95, 0.06, 2), mats.steel, { at: [fxw + 0.05, 1.12 + (fyw - 1.12 + 0.15) / 2 - 0.15, 0] });
  mg.add(new THREE.CylinderGeometry(0.36, 0.36, 0.32, 28).rotateZ(Math.PI / 2 - tilt), mats.iron, { at: [fxw - 0.02, fyw + 0.02, 0] });
  const [mxw, myw] = P(2.62);
  mg.add(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 20).rotateZ(Math.PI / 2 - tilt), mats.dark, { at: [mxw, myw, 0] });
  mg.pipe([[mxw, myw + 0.12, 0.1], [mxw + 0.2, myw + 0.2, 0.3], [mxw + 0.3, 1.2, 0.45]], 0.02, mats.hose, 12, 6);
  mg.pipe([[mxw, myw + 0.12, -0.1], [mxw + 0.25, myw + 0.15, -0.3], [mxw + 0.35, 1.2, -0.45]], 0.02, mats.hose, 12, 6);
  // water tank (vertical) + pump behind the cab
  mg.add(roundedBox(0.7, 1.3, 0.7, 0.3, 4), mats.alu, { at: [x1 - 0.4, 1.12 + 0.65, -0.62] });
  for (const y of [1.45, 2.15]) mg.add(new THREE.TorusGeometry(0.36, 0.012, 4, 24).rotateX(Math.PI / 2).scale(1, 1, 1), mats.steel, { at: [x1 - 0.4, y, -0.62] });
  mg.add(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 14).rotateZ(Math.PI / 2), mats.dark, { at: [x1 - 0.4, 1.22, 0.1] });
  mg.pipe([[x1 - 0.4, 1.3, -0.25], [x1 - 0.6, 2.8, -0.3], [-1.2, 3.25, -0.65], [P(-2.0)[0], P(-2.0)[1] + 0.85, -0.55]], 0.025, mats.hose, 40, 6);
  // rear pedestal: A-frame posts carrying the roller pair under the track ring
  const [rxw, ryw] = P(-1.5);
  const ringR = rAt(-1.5) + 0.03;
  for (const s of [1, -1]) {
    const rz = s * ringR * 0.72;
    const rollerY = ryw - ringR * 0.72;
    for (const dxp of [-0.42, 0.42]) mg.tube([rxw + dxp, 1.12, s * RAIL_Z], [rxw, rollerY - 0.08, rz + s * 0.06], 0.07, mats.steel, 10);
    mg.add(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 18).rotateZ(Math.PI / 2 - tilt), mats.iron, { at: [rxw, rollerY, rz + s * 0.05] });
    mg.box(0.3, 0.12, 0.14, mats.steel, { at: [rxw, rollerY - 0.1, rz + s * 0.06], r: 0.02 });
  }
  mg.tube([rxw, ryw - ringR * 0.72 - 0.1, -ringR * 0.78], [rxw, ryw - ringR * 0.72 - 0.1, ringR * 0.78], 0.05, mats.steel, 8);
  // hopper frame from the posts back over the mouth
  const [mx, my] = P(-2.36);
  const hx = mx - 0.18;
  for (const s of [1, -1]) {
    mg.tube([rxw, ryw - ringR * 0.72 - 0.05, s * ringR * 0.8], [hx + 0.1, my + 0.42, s * 0.5], 0.05, mats.steel, 8);
    mg.tube([rxw - 0.3, 1.12, s * RAIL_Z], [hx + 0.05, my - 0.5, s * 0.42], 0.05, mats.steel, 8);
  }
  // charging hopper (open funnel above the mouth)
  const hop = lathe([[0.2, 0], [0.56, 0.6], [0.6, 0.62], [0.24, 0.0]], 28);
  mg.add(hop, new THREE.MeshStandardMaterial({ name: 'hopper', color: '#2b2d30', metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide }), { at: [hx, my + 0.0, 0] });
  mg.add(new THREE.TorusGeometry(0.58, 0.03, 6, 28).rotateX(Math.PI / 2), mats.steel, { at: [hx, my + 0.61, 0] });
  // collection hopper below the mouth + chute swivel
  const col = lathe([[0.1, 0], [0.32, 0.32], [0.34, 0.34], [0.12, 0.0]], 20);
  mg.add(col, new THREE.MeshStandardMaterial({ color: '#2b2d30', metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide }), { at: [hx - 0.05, my - 0.62, 0] });
  mg.add(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 18), mats.iron, { at: [hx - 0.05, my - 0.68, 0] });
  // platform + ladder at the rear-left
  const platY = my + 0.05;
  mg.box(0.55, 0.05, 0.55, mats.alu, { at: [hx + 0.15, platY, -0.85], r: 0.01 });
  mg.tube([hx + 0.15, platY, -0.6], [hx + 0.1, platY, -0.42], 0.03, mats.steel, 6);
  handrail(mg, [[hx - 0.1, platY, -1.1], [hx - 0.1, platY + 0.9, -1.1], [hx + 0.4, platY + 0.9, -1.1], [hx + 0.4, platY, -1.1]], mats.alu);
  ladder(mg, [x0 + 0.05, 0.62, -0.85], [hx - 0.08, platY, -0.85], 0.42, { dark: mats.alu, steel: mats.alu }, 9);
  mg.box(0.1, 0.1, 0.5, mats.steel, { at: [x0 + 0.1, 0.62, -0.75], r: 0.01 });
  // extension chutes hung on the left side
  for (const k of [0, 1]) {
    const ex = -0.6 - k * 1.25;
    mg.add(new THREE.CylinderGeometry(0.24, 0.24, 1.1, 18, 1, true, Math.PI / 2, Math.PI).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2b2d30', metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide }), { at: [ex, 1.5, -(W / 2 - 0.05)] });
    mg.box(0.08, 0.5, W / 2 - 0.05 - RAIL_Z, mats.steel, { at: [ex, 1.3, -(RAIL_Z + (W / 2 - 0.05 - RAIL_Z) / 2)], r: 0.01 });
  }
  // main chute on its swivel (folded up to the side for transport)
  const chute = group('chute', { parent: root, at: [hx - 0.05, my - 0.74, 0] });
  chute.rotation.y = 1.15;
  const arm = group('chute_arm', { parent: chute });
  arm.rotation.z = -0.55;
  const cm = new Merge();
  const cg = new THREE.CylinderGeometry(0.26, 0.24, 1.5, 20, 1, true, Math.PI / 2, Math.PI).rotateZ(Math.PI / 2);
  cm.add(cg, new THREE.MeshStandardMaterial({ color: '#2b2d30', metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide }), { at: [-0.8, -0.05, 0] });
  for (const x of [-0.25, -0.8, -1.35]) cm.add(new THREE.TorusGeometry(0.255, 0.018, 4, 20, Math.PI).rotateY(Math.PI / 2).rotateX(Math.PI), mats.steel, { at: [x, -0.05, 0] });
  cm.add(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), mats.iron, { at: [0, 0.0, 0] });
  cm.flush(arm, 'chute_body');
  extra.push(clip('mix', 4, [spinTrack(drum, 'x', 4, 1)]));
  extra.push(poseClip('chute', 8, [chute, arm], [], (t) => {
    const a = cycle(t, 0.3);
    chute.rotation.y = 1.15 - a * 1.15;
    arm.rotation.z = -0.55 + a * 0.85;
  }, 32));
}

/** Remove meshes whose geometry ended up empty (e.g. a loft patch with no faces). */
export function pruneEmpty(root) {
  const dead = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    const n = g.index ? g.index.count : g.attributes.position?.count ?? 0;
    if (!n) dead.push(o);
  });
  for (const o of dead) o.parent.remove(o);
}

/* ------------------------------------------------------------------ */
/* Semi: tractor + trailer                                               */
/* ------------------------------------------------------------------ */

function buildSemi(root, { mats, lamps, wr, trim, extra, doors }) {
  const W = 2.5;
  const style = trim === 'daycab' ? 'daycab' : trim === 'highroof' ? 'highroof' : 'sleeper';
  const sleeper = style !== 'daycab';
  const frontX = 0;
  const t = buildTractor(root, { frontX, mats, lamps, wr, style });
  const drive = sleeper ? [frontX - 6.1, frontX - 7.41] : [frontX - 4.9, frontX - 6.21];
  const tractorRear = drive[1] - 0.95;
  const tw = 0.3;
  const wz = W / 2 - tw / 2 - 0.02;
  const mg = new Merge();
  chassis(root, mg, { x0: tractorRear, x1: frontX - 0.22, axles: [{ x: t.xf, steer: true }, { x: drive[0] }, { x: drive[1] }], wr, wz, mats, gearX: t.xf - 1.3 });
  rearFenders(mg, drive, wz, wr, mats);
  // fuel tanks under the cab doors, DEF + battery box, air tanks
  for (const s of [1, -1]) tanks(mg, { x: t.xf - 2.2, side: s, mats, wz });
  mg.add(roundedBox(0.6, 0.5, 0.45, 0.05, 2), mats.trim, { at: [t.xf - 3.25, RAIL_TOP - 0.3, -(RAIL_Z + 0.3)] });
  mg.box(0.4, 0.12, 0.12, mats.steel, { at: [t.xf - 3.25, RAIL_TOP - 0.3, -(RAIL_Z + 0.06)], r: 0.01 });
  // rear deck plate, light bar, mudflaps already in fenders
  mg.box(0.12, 0.2, W - 0.3, mats.steel, { at: [tractorRear + 0.06, RAIL_TOP - 0.1, 0], r: 0.02 });
  for (const s of [1, -1]) {
    lamps.tail.add(root, { at: [tractorRear, RAIL_TOP - 0.1, s * (W / 2 - 0.3)], normal: [-1, 0, 0], w: 0.16, h: 0.1 });
    lamps.brake.add(root, { at: [tractorRear, RAIL_TOP - 0.1, s * (W / 2 - 0.5)], normal: [-1, 0, 0], w: 0.12, h: 0.1 });
    (s < 0 ? lamps.signalL : lamps.signalR).add(root, { at: [tractorRear, RAIL_TOP - 0.1, s * (W / 2 - 0.2)], normal: [-1, 0, 0], w: 0.06, h: 0.1 });
  }
  // fifth wheel on a mounting plate
  const kingX = (drive[0] + drive[1]) / 2 + 0.25;
  const dy = 1.24;
  mg.box(1.2, 0.08, RAIL_Z * 2 + 0.1, mats.iron, { at: [kingX, RAIL_TOP + 0.04, 0], r: 0.015 });
  for (const s of [1, -1]) mg.box(0.3, dy - 0.05 - RAIL_TOP - 0.08, 0.14, mats.iron, { at: [kingX, (dy - 0.05 + RAIL_TOP + 0.08) / 2, s * 0.42], r: 0.015 });
  const fw = new THREE.CylinderGeometry(0.72, 0.72, 0.1, 32, 1, false, 0.25, Math.PI * 2 - 0.5);
  mg.add(fw, mats.iron, { at: [kingX, dy - 0.04 - 0.05 + 0.005, 0], rot: [0, Math.PI, 0] });
  // air + electric lines from the cab back to the trailer front
  const kind = ['flatbed', 'tanker', 'reefer', 'lowboy', 'container', 'car-carrier', 'logging', 'curtainside'].includes(trim) ? trim : 'box';
  const trailerLen = kind === 'container' ? 12.4 : kind === 'lowboy' ? 14.6 : kind === 'car-carrier' ? 14.0 : 13.7;
  const xf = kingX + 1.2;
  const xr = xf - trailerLen;
  const tr = buildTrailer(root, kind, {
    xf, xr, dy, axles: kind === 'lowboy' ? [xr + 2.4, xr + 1.1, xr + 3.7] : [xr + 2.9, xr + 1.59], wr, mats, lamps, footY: 0.28, skirts: kind === 'box' && sleeper,
  });
  extra.push(...tr.extra);
  doors.push(...tr.doors);
  const cabBack = t.back;
  for (const [z, col] of [[0.12, '#2a62d0'], [-0.12, '#d02a2a']]) {
    mg.pipe([[cabBack - 0.02, 1.6, z], [cabBack - 0.35, 1.0, z], [xf + 0.03 - 0.02, kind === 'lowboy' ? dy + 0.4 : 1.8, z * 0.8]], 0.018, M.matte(col, 0.5), 24, 6);
  }
  mg.box(0.06, 1.6 - RAIL_TOP + 0.05, 0.4, mats.steel, { at: [cabBack - 0.03, (1.6 + RAIL_TOP) / 2, 0], r: 0.01 });
  mg.flush(root, 'chassis');
  const axlesT = [t.xf, ...drive];
  const allSpins = [];
  const res = addHeavyWheels(root, [
    ['wheel_FL', axlesT[0], wz, true, false], ['wheel_FR', axlesT[0], -wz, true, false],
    ['wheel_R0L', drive[0], wz, false, true], ['wheel_R0R', drive[0], -wz, false, true],
    ['wheel_R1L', drive[1], wz, false, true], ['wheel_R1R', drive[1], -wz, false, true],
  ], { radius: wr, width: tw, style: 'alu' });
  allSpins.push(...res.spins, ...tr.spins);
  // centre the whole rig on the origin
  const shift = -(frontX + xr) / 2;
  for (const c of root.children) c.position.x += shift;
  return { spins: allSpins, steers: res.steers };
}
