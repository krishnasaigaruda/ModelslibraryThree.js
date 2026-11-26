import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, tube, lathe, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { spinTrack, rotateTrack, clip } from '../../core/animation.js';
import { vehicleAnimations } from './wheel.js';
import { lampGroup } from '../../core/lamps.js';
import { applyTrim } from './misc-kit.js';
import { brandEmblem } from '../../core/brand.js';

/*
 * Bicycles. Front = +X, wheels roll about Z, centreline z = 0 (drivetrain on +Z).
 * Frame is built from real geometry points (bottom bracket, head tube, seat tube)
 * so tubes always meet. The front end lives in 'fork_steer', tilted by the head angle.
 */

export const BICYCLE_VARIANTS = {
  road: { r: 0.335, tyre: 0.014, wb: 0.99, cs: 0.41, bb: 0.27, st: 0.54, head: 73, fork: 0.37, color: '#c62828', bars: 'drop', rim: 0.03 },
  mountain: { r: 0.37, tyre: 0.03, wb: 1.16, cs: 0.44, bb: 0.33, st: 0.44, head: 66, fork: 0.5, color: '#2e7d32', bars: 'flat', susp: true, knobby: true, discs: true },
  city: { r: 0.34, tyre: 0.02, wb: 1.08, cs: 0.45, bb: 0.28, st: 0.5, head: 69, fork: 0.39, color: '#00897b', bars: 'upright', stepThrough: true, fenders: true, basket: true, rack: true, lights: true },
  bmx: { r: 0.255, tyre: 0.026, wb: 0.92, cs: 0.36, bb: 0.3, st: 0.24, head: 74, fork: 0.33, color: '#212121', bars: 'riser', pegs: true },
  kids: { r: 0.2, tyre: 0.024, wb: 0.68, cs: 0.3, bb: 0.2, st: 0.3, head: 70, fork: 0.26, color: '#ec407a', bars: 'upright', training: true, fenders: true },
  ebike: { r: 0.345, tyre: 0.024, wb: 1.12, cs: 0.46, bb: 0.29, st: 0.48, head: 69, fork: 0.42, color: '#37474f', bars: 'flat', battery: true, lights: true, fenders: true, rack: true, discs: true },
};

/** Trims: accessories and wheel packages. */
export const BICYCLE_TRIMS = {
  commuter: { fenders: true, rack: true, lights: true, color: '#455a64' },
  basket: { basket: true, lights: true, color: '#f8bbd0' },
  'child-seat': { rack: true, childSeat: true, color: '#0288d1' },
  panniers: { rack: true, panniers: true, fenders: true, color: '#33691e' },
  aero: { aero: true, color: '#111111' },
  fat: (v) => ({ tyre: Math.max(0.045, v.tyre * 2.4), knobby: true, color: '#ff6f00' }),
};

function bikeWheel(name, { r, tw, knobby, mats, hubR = 0.025, discs }) {
  const spin = group(name);
  mesh(new THREE.TorusGeometry(r - tw, tw, 12, 64), mats.tyre, { parent: spin });
  if (knobby) {
    const n = 90;
    const knob = new THREE.InstancedMesh(roundedBox(0.016, 0.012, tw * 1.7, 0.004, 1), mats.tyre, n);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      m4.compose(new THREE.Vector3(Math.cos(a) * (r - 0.004), Math.sin(a) * (r - 0.004), 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a), new THREE.Vector3(1, 1, 1));
      knob.setMatrixAt(i, m4);
    }
    knob.name = `${name}_knobs`;
    spin.add(knob);
  }
  const rimR = r - tw * 2;
  mesh(new THREE.TorusGeometry(rimR, 0.008, 8, 64), mats.rim, { parent: spin, at: [0, 0, 0.006] });
  mesh(new THREE.TorusGeometry(rimR, 0.008, 8, 64), mats.rim, { parent: spin, at: [0, 0, -0.006] });
  mesh(new THREE.CylinderGeometry(hubR, hubR, 0.09, 16).rotateX(Math.PI / 2), mats.alu, { parent: spin });
  // spokes as one instanced mesh (crossed lacing)
  const n = 32;
  const spokes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0012, 0.0012, 1, 4), mats.spoke, n);
  const m4 = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const zs = i % 2 ? 1 : -1;
    const from = new THREE.Vector3(Math.cos(a + zs * 0.3) * hubR * 0.9, Math.sin(a + zs * 0.3) * hubR * 0.9, zs * 0.035);
    const to = new THREE.Vector3(Math.cos(a) * (rimR - 0.006), Math.sin(a) * (rimR - 0.006), zs * 0.004);
    const d = to.clone().sub(from);
    m4.compose(from.clone().addScaledVector(d, 0.5), new THREE.Quaternion().setFromUnitVectors(up, d.clone().normalize()), new THREE.Vector3(1, d.length(), 1));
    spokes.setMatrixAt(i, m4);
  }
  spokes.name = `${name}_spokes`;
  spin.add(spokes);
  if (discs) mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.003, 36).rotateX(Math.PI / 2), mats.disc, { parent: spin, at: [0, 0, -0.05] });
  return spin;
}

/** Curved mudguard shell (world angles a0..a1 in degrees, 0 = front, 90 = top). */
function guard(r, width, a0, a1, tilt = 0) {
  const t0 = THREE.MathUtils.degToRad(a0) + Math.PI / 2 - tilt;
  return new THREE.CylinderGeometry(r, r, width, 40, 1, true, t0, THREE.MathUtils.degToRad(a1 - a0)).rotateX(Math.PI / 2);
}

export function createBicycle(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BICYCLE_VARIANTS, o.variant, 'bicycle');
  const v = applyTrim(BICYCLE_VARIANTS[variant], BICYCLE_TRIMS, o.trim, 'bicycle');
  const root = group(`bicycle-${variant}`);
  const body = group('frame', { parent: root });
  const mats = {
    paint: M.paint(o.color ?? v.color, { metallic: 0.45, roughness: 0.25 }),
    guard: Object.assign(M.paint(o.fenderColor ?? (variant === 'kids' ? '#f8bbd0' : o.color ?? v.color), { metallic: 0.4, roughness: 0.3 }), { side: THREE.DoubleSide }),
    tyre: M.rubber(),
    rim: M.metal(variant === 'road' || variant === 'bmx' ? '#1c1c1e' : '#b9bdc2', 0.25),
    spoke: M.metal('#c9ccd1', 0.2),
    alu: M.metal('#b8bcc0', 0.3),
    black: new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.4, clearcoat: 0.5 }),
    chrome: M.chrome(),
    disc: M.metal('#9aa0a6', 0.25),
    saddle: new THREE.MeshPhysicalMaterial({ color: variant === 'city' ? '#6d4c33' : '#151515', roughness: 0.6, sheen: 0.3 }),
    grip: new THREE.MeshStandardMaterial({ color: variant === 'city' ? '#6d4c33' : '#1a1a1a', roughness: 0.9 }),
    lamp: Object.assign(M.emissive('#fffbe8', 0.4), { name: 'headlight' }),
    red: Object.assign(M.emissive('#d01010', 0.9), { name: 'taillight' }),
  };
  const { r, wb } = v;
  const tr = variant === 'mountain' || variant === 'bmx' ? 0.022 : variant === 'ebike' ? 0.024 : 0.016;
  const headA = THREE.MathUtils.degToRad(90 - v.head); // tilt from vertical
  const RA = new THREE.Vector3(-wb / 2, r, 0);
  const FA = new THREE.Vector3(wb / 2, r, 0);
  const BB = new THREE.Vector3(RA.x + v.cs, v.bb, 0);
  const sDir = new THREE.Vector3(-Math.cos(THREE.MathUtils.degToRad(73)), Math.sin(THREE.MathUtils.degToRad(73)), 0);
  const ST = BB.clone().addScaledVector(sDir, v.st);
  const hDir = new THREE.Vector3(-Math.sin(headA), Math.cos(headA), 0);
  const HB = FA.clone().addScaledVector(hDir, v.fork);
  const HT = HB.clone().addScaledVector(hDir, variant === 'kids' ? 0.1 : 0.14);
  const A = (p, dz = 0) => [p.x, p.y, p.z + dz];

  // ---------------- frame ----------------
  const F = (pts, rad = tr) => curveTube(pts, rad, mats.paint, { parent: body, radialSegments: 14 });
  F([A(HB), A(HT)], tr * 1.35); // head tube
  if (v.stepThrough) {
    F([A(BB), [BB.x + 0.12, BB.y + 0.02, 0], [HB.x - 0.12, HB.y - 0.14, 0], A(HB, 0)], tr * 1.1);
    F([[BB.x + 0.02, BB.y + 0.08, 0], [BB.x + 0.25, BB.y + 0.16, 0], [HT.x - 0.06, HT.y - 0.06, 0], A(HT, 0)], tr * 0.9);
  } else {
    F([A(BB), A(HB)], tr * (variant === 'ebike' ? 1.5 : 1.15)); // down tube
    const ttEnd = variant === 'mountain' || variant === 'bmx' || variant === 'kids' ? ST.clone().lerp(BB, 0.12) : ST;
    F([[ttEnd.x, ttEnd.y, 0], A(HT)], tr); // top tube
  }
  F([A(BB), A(ST)], tr); // seat tube
  for (const s of [1, -1]) {
    curveTube([A(BB, s * 0.04), [(BB.x + RA.x) / 2, (BB.y + RA.y) / 2 - 0.01, s * 0.06], A(RA, s * 0.065)], tr * 0.6, mats.paint, { parent: body });
    curveTube([[ST.x + 0.01, ST.y - 0.04, s * 0.02], [(ST.x + RA.x) / 2, (ST.y + RA.y) / 2, s * 0.055], A(RA, s * 0.065)], tr * 0.55, mats.paint, { parent: body });
  }
  mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.08, 20).rotateX(Math.PI / 2), mats.paint, { parent: body, at: A(BB) }); // BB shell

  // seatpost + saddle
  const postTop = ST.clone().addScaledVector(sDir, variant === 'bmx' ? 0.06 : variant === 'kids' ? 0.1 : 0.16);
  tube(A(ST), A(postTop), tr * 0.7, mats.alu, { parent: body });
  const saddle = group('saddle', { parent: body, at: [postTop.x + 0.01, postTop.y + 0.035, 0] });
  // seat clamp + rails joining the post to the saddle
  mesh(roundedBox(0.05, 0.03, 0.035, 0.008), mats.black, { parent: body, at: [postTop.x, postTop.y + 0.012, 0] });
  for (const s of [1, -1]) curveTube([[postTop.x - 0.06, postTop.y + 0.03, s * 0.02], [postTop.x, postTop.y + 0.022, s * 0.018], [postTop.x + 0.07, postTop.y + 0.03, s * 0.012]], 0.0035, mats.alu, { parent: body });
  if (variant === 'city' || variant === 'ebike') {
    mesh(cushion(0.26, 0.06, 0.2, { radius: 0.025, bulge: 0.4 }), mats.saddle, { parent: saddle });
    for (const s of [1, -1]) {
      const coil = [];
      for (let i = 0; i <= 30; i++) coil.push([-0.08 + Math.cos(i * 0.9) * 0.012, -0.05 + i * 0.0013, s * 0.06 + Math.sin(i * 0.9) * 0.012]);
      curveTube(coil, 0.003, mats.chrome, { parent: saddle, segments: 80, radialSegments: 4 });
    }
  } else {
    const sg = new THREE.SphereGeometry(0.5, 24, 12);
    const p = sg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const w = 0.35 + 0.65 * Math.min(1, Math.max(0, -x * 2 + 0.3)); // narrow nose (+X), wide back
      p.setXYZ(i, x * 0.27, Math.max(p.getY(i), -0.15) * 0.07, p.getZ(i) * 0.15 * w);
    }
    sg.computeVertexNormals();
    mesh(sg, mats.saddle, { parent: saddle });
  }

  // ---------------- front end ----------------
  const steer = group('fork_steer', { parent: root, at: A(FA), rot: [0, 0, headA] });
  const front = bikeWheel('wheel_F', { r, tw: v.tyre, knobby: v.knobby, mats, discs: v.discs });
  steer.add(front);
  const fl = v.fork;
  if (v.susp) {
    for (const s of [1, -1]) {
      mesh(new THREE.CylinderGeometry(0.02, 0.018, fl * 0.5, 16), mats.black, { parent: steer, at: [0, fl * 0.25, s * 0.055] });
      mesh(new THREE.CylinderGeometry(0.016, 0.016, fl * 0.45, 16), M.metal('#c9a227', 0.2), { parent: steer, at: [0, fl * 0.66, s * 0.055] });
    }
    curveTube([[0.01, fl * 0.42, 0.055], [0.035, fl * 0.48, 0], [0.01, fl * 0.42, -0.055]], 0.012, mats.black, { parent: steer });
    mesh(roundedBox(0.05, 0.03, 0.13, 0.01), mats.black, { parent: steer, at: [0, fl * 0.9, 0] });
  } else {
    for (const s of [1, -1]) curveTube([[0.0, 0, s * 0.05], [0.03, fl * 0.35, s * 0.048], [0.01, fl * 0.8, s * 0.035], [0, fl, s * 0.02]], tr * 0.65, mats.paint, { parent: steer });
    mesh(roundedBox(0.04, 0.03, 0.06, 0.01), mats.paint, { parent: steer, at: [0, fl, 0] });
  }
  // steerer + stem + bars
  const hl = HT.clone().sub(FA).length();
  tube([0, fl, 0], [0, hl + 0.04, 0], 0.014, mats.black, { parent: steer });
  const stemLen = variant === 'road' ? 0.1 : variant === 'mountain' ? 0.06 : 0.07;
  const stemRise = variant === 'city' || variant === 'kids' ? 0.1 : variant === 'bmx' ? 0.04 : 0.02;
  const bc = [stemLen * Math.cos(headA) - stemRise * Math.sin(headA) * 0 + 0.0, hl + 0.04 + stemRise, 0];
  tube([0, hl + 0.03, 0], bc, 0.013, mats.black, { parent: steer });
  const unTilt = (x, y, z) => {
    // bars are defined in world-up terms; rotate them back by the head angle
    const c = Math.cos(-headA);
    const s2 = Math.sin(-headA);
    return [bc[0] + x * c - y * s2, bc[1] + x * s2 + y * c, z];
  };
  const barPts = [];
  if (v.bars === 'drop') {
    for (const s of [1, -1]) barPts.push([unTilt(0, 0, 0), unTilt(0, 0, s * 0.2), unTilt(0.07, -0.01, s * 0.21), unTilt(0.08, -0.08, s * 0.21), unTilt(0.0, -0.13, s * 0.2), unTilt(-0.06, -0.12, s * 0.2)]);
  } else if (v.bars === 'flat') {
    for (const s of [1, -1]) barPts.push([unTilt(0, 0, 0), unTilt(-0.005, 0.01, s * 0.2), unTilt(-0.02, 0.015, s * 0.36)]);
  } else if (v.bars === 'upright') {
    const w = variant === 'kids' ? 0.23 : 0.3;
    for (const s of [1, -1]) barPts.push([unTilt(0, 0, 0), unTilt(0.05, 0.02, s * 0.1), unTilt(-0.08, 0.05, s * w * 0.8), unTilt(-0.15, 0.04, s * w)]);
  } else {
    for (const s of [1, -1]) barPts.push([unTilt(0, 0, 0), unTilt(0, 0, s * 0.08), unTilt(0.02, 0.17, s * 0.13), unTilt(0.0, 0.2, s * 0.32)]);
    curveTube([unTilt(0.01, 0.11, 0.105), unTilt(0.01, 0.11, -0.105)], 0.009, mats.chrome, { parent: steer });
  }
  for (const pts of barPts) {
    curveTube(pts, 0.011, v.bars === 'riser' ? mats.chrome : mats.black, { parent: steer });
    const g = pts.at(-1);
    if (v.bars !== 'drop') {
      const dirZ = Math.sign(g[2]);
      mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.11, 14).rotateX(Math.PI / 2), mats.grip, { parent: steer, at: [g[0], g[1], g[2] - dirZ * 0.045] });
      mesh(roundedBox(0.09, 0.01, 0.018, 0.004), mats.alu, { parent: steer, at: [g[0] + 0.05, g[1] + 0.005, g[2] - dirZ * 0.07], rot: [0, dirZ * 0.4, 0] });
    } else {
      mesh(cushion(0.05, 0.07, 0.03, { radius: 0.012 }), mats.black, { parent: steer, at: unTilt(0.08, 0.01, Math.sign(pts[1][2]) * 0.21) });
    }
  }
  if (variant === 'city') {
    mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 20), mats.chrome, { parent: steer, at: unTilt(-0.08, 0.06, 0.18) });
  }

  // ---------------- rear wheel + drivetrain ----------------
  const rear = bikeWheel('wheel_R', { r, tw: v.tyre, knobby: v.knobby, mats, hubR: v.battery ? 0.06 : 0.025, discs: v.discs });
  rear.position.copy(RA);
  if (v.aero) {
    // deep-section carbon rims (both wheels)
    const carbon = new THREE.MeshPhysicalMaterial({ color: '#111214', roughness: 0.25, clearcoat: 1, side: THREE.DoubleSide });
    for (const w of [front, rear]) for (const z of [0.011, -0.011]) mesh(new THREE.RingGeometry(r - v.tyre * 2 - 0.055, r - v.tyre * 2 + 0.002, 64), carbon, { parent: w, at: [0, 0, z] });
  }
  root.add(rear);
  const cz = 0.07;
  const ringR = variant === 'bmx' ? 0.09 : variant === 'kids' ? 0.065 : 0.1;
  const cogR = variant === 'bmx' ? 0.03 : 0.04;
  // cassette
  for (let k = 0; k < (variant === 'road' || variant === 'mountain' || variant === 'ebike' ? 7 : 1); k++) {
    mesh(new THREE.CylinderGeometry(cogR + k * 0.006, cogR + k * 0.006, 0.003, 28).rotateX(Math.PI / 2), mats.alu, { parent: rear, at: [0, 0, cz - k * 0.005] });
  }
  // chain loop
  const chain = [];
  for (let i = 0; i <= 18; i++) { const a = Math.PI / 2 + (i / 18) * Math.PI; chain.push([RA.x + Math.cos(a) * cogR, RA.y + Math.sin(a) * cogR, cz]); }
  for (let i = 0; i <= 18; i++) { const a = -Math.PI / 2 + (i / 18) * Math.PI; chain.push([BB.x + Math.cos(a) * ringR, BB.y + Math.sin(a) * ringR, cz]); }
  curveTube(chain, 0.0035, M.metal('#5b5d60', 0.45), { parent: root, closed: true, segments: 120, radialSegments: 5 });
  // crank (spins), chainring with spider, pedals that stay level
  const crank = group('crank', { parent: root, at: A(BB) });
  mesh(new THREE.TorusGeometry(ringR, 0.004, 6, 48), mats.alu, { parent: crank, at: [0, 0, cz] });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    mesh(roundedBox(ringR, 0.012, 0.006, 0.003), mats.alu, { parent: crank, at: [Math.cos(a) * ringR * 0.5, Math.sin(a) * ringR * 0.5, cz], rot: [0, 0, a] });
  }
  const crankLen = variant === 'kids' ? 0.11 : 0.17;
  const pedals = [];
  for (const [s, n, ang] of [[1, 'R', -Math.PI / 2], [-1, 'L', Math.PI / 2]]) {
    const arm = group(null, { parent: crank, rot: [0, 0, ang] });
    mesh(roundedBox(crankLen, 0.022, 0.014, 0.006), mats.alu, { parent: arm, at: [crankLen / 2, 0, s * 0.085] });
    const pedal = group(`pedal_${n}`, { parent: arm, at: [crankLen, 0, s * 0.11], rot: [0, 0, -ang] });
    mesh(roundedBox(0.09, 0.016, 0.075, 0.006), mats.black, { parent: pedal });
    pedals.push(pedal);
  }
  if (variant !== 'bmx' && variant !== 'kids' && !v.stepThrough) {
    // rear derailleur
    mesh(roundedBox(0.03, 0.07, 0.012, 0.005), mats.alu, { parent: body, at: [RA.x + 0.01, RA.y - 0.06, cz + 0.01], rot: [0, 0, 0.3] });
  }
  if (v.stepThrough || variant === 'kids') {
    // chain guard
    mesh(roundedBox(BB.x - RA.x + 0.05, 0.05, 0.008, 0.02), mats.guard, { parent: body, at: [(BB.x + RA.x) / 2, (BB.y + RA.y) / 2 + 0.045, cz + 0.02], rot: [0, 0, Math.atan2(RA.y - BB.y, RA.x - BB.x) + Math.PI] });
  }

  // ---------------- accessories ----------------
  if (v.fenders) {
    mesh(guard(r + 0.025, v.tyre * 2 + 0.03, 25, 155, headA), mats.guard, { parent: steer });
    mesh(guard(r + 0.025, v.tyre * 2 + 0.03, 50, 190), mats.guard, { parent: root, at: A(RA) });
  }
  if (v.rack) {
    const rackY = r + 0.12;
    for (const s of [1, -1]) {
      curveTube([A(RA, s * 0.07), [RA.x - 0.04, rackY - 0.02, s * 0.075], [RA.x - 0.06, rackY, s * 0.07], [ST.x - 0.04, rackY + 0.04, s * 0.065]], 0.006, mats.alu, { parent: body });
    }
    for (let k = 0; k < 4; k++) tube([RA.x - 0.06 + k * ((ST.x - RA.x) / 3.4), rackY + k * 0.012, -0.07], [RA.x - 0.06 + k * ((ST.x - RA.x) / 3.4), rackY + k * 0.012, 0.07], 0.005, mats.alu, { parent: body });
  }
  if (v.childSeat) {
    // child seat on the rack: shell, backrest, footrests
    const cy = r + 0.16;
    const cs = group('child_seat', { parent: body, at: [RA.x + 0.05, cy, 0] });
    mesh(cushion(0.28, 0.08, 0.26, { radius: 0.03 }), M.plastic('#ffb300', 0.4), { parent: cs, at: [0, 0.0, 0] });
    mesh(cushion(0.06, 0.38, 0.28, { radius: 0.025 }), M.plastic('#ffb300', 0.4), { parent: cs, at: [-0.15, 0.17, 0], rot: [0, 0, 0.12] });
    for (const s of [1, -1]) mesh(cushion(0.2, 0.12, 0.03, { radius: 0.012 }), M.plastic('#ffb300', 0.4), { parent: cs, at: [-0.02, 0.08, s * 0.13] });
    mesh(cushion(0.2, 0.025, 0.2, { radius: 0.01 }), M.fabric('#37474f'), { parent: cs, at: [0, 0.05, 0] });
  }
  if (v.panniers) {
    const rackY = r + 0.12;
    for (const s of [1, -1]) {
      const bag = mesh(cushion(0.32, 0.3, 0.12, { radius: 0.04, bulge: 0.15 }), M.fabric(s > 0 ? '#bf360c' : '#bf360c'), { parent: body, at: [RA.x + 0.03, rackY - 0.14, s * 0.13], name: 'pannier' });
      mesh(roundedBox(0.3, 0.02, 0.03, 0.006), M.plastic('#212121'), { parent: body, at: [RA.x + 0.03, rackY - 0.005, s * 0.085] });
    }
  }
  if (v.basket) {
    const bk = group('basket', { parent: steer, at: unTilt(0.2, -0.08, 0) });
    const wicker = M.matte('#b08350', 0.9);
    const w = 0.34;
    const d = 0.26;
    const hgt = 0.22;
    mesh(roundedBox(d, 0.012, w, 0.005), wicker, { parent: bk, at: [0, -hgt / 2, 0] });
    for (let k = 0; k <= 5; k++) {
      const y = -hgt / 2 + (k / 5) * hgt;
      curveTube([[-d / 2, y, -w / 2], [d / 2, y, -w / 2], [d / 2, y, w / 2], [-d / 2, y, w / 2]], 0.004, wicker, { parent: bk, closed: true, segments: 40, radialSegments: 4 });
    }
    for (let k = 0; k < 10; k++) {
      const t = k / 10;
      const [x, z] = t < 0.25 ? [-d / 2 + t * 4 * d, -w / 2] : t < 0.5 ? [d / 2, -w / 2 + (t - 0.25) * 4 * w] : t < 0.75 ? [d / 2 - (t - 0.5) * 4 * d, w / 2] : [-d / 2, w / 2 - (t - 0.75) * 4 * w];
      tube([x, -hgt / 2, z], [x, hgt / 2, z], 0.004, wicker, { parent: bk, radialSegments: 4 });
    }
    bk.rotation.z = -headA;
    bk.position.set(...unTilt(0.17, -0.12, 0));
  }
  if (v.battery) {
    const dd = HB.clone().sub(BB);
    const mid = BB.clone().addScaledVector(dd, 0.5);
    const bat = mesh(roundedBox(dd.length() * 0.62, 0.075, 0.075, 0.025), M.paint('#1b1b1d', { metallic: 0.2, roughness: 0.4 }), { parent: body, at: [mid.x, mid.y + 0.045, 0] });
    bat.rotation.z = Math.atan2(dd.y, dd.x);
    mesh(roundedBox(0.05, 0.03, 0.06, 0.01), mats.black, { parent: steer, at: unTilt(-0.04, 0.03, 0) });
  }
  if (v.pegs) for (const p of [FA, RA]) for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 16).rotateX(Math.PI / 2), mats.chrome, { parent: p === FA ? steer : root, at: p === FA ? [0, 0, s * 0.1] : A(p, s * 0.1) });
  if (v.training) {
    for (const s of [1, -1]) {
      curveTube([A(RA, s * 0.07), [RA.x - 0.02, RA.y - 0.02, s * 0.15], [RA.x - 0.04, 0.09, s * 0.2]], 0.008, mats.chrome, { parent: body });
      const tw = group(`training_${s > 0 ? 'R' : 'L'}`, { parent: root, at: [RA.x - 0.04, 0.075, s * 0.22] });
      mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 28), mats.tyre, { parent: tw });
      mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 20).rotateX(Math.PI / 2), M.paint('#f5f5f5'), { parent: tw });
    }
  }
  // lights + reflectors
  if (v.lights) {
    const fwd = [Math.cos(-headA), Math.sin(-headA), 0];
    mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.05, 20).rotateZ(Math.PI / 2 - headA), mats.black, { parent: steer, at: unTilt(0.06, -0.05, 0) });
    tube(unTilt(0.035, -0.05, 0), unTilt(0.0, -0.02, 0), 0.006, mats.black, { parent: steer });
    lampGroup('headlights', 'head').add(steer, { at: unTilt(0.085, -0.05, 0), normal: fwd, w: 0.048, h: 0.048, shape: 'round', depth: 0.008, bezel: false });
  }
  {
    // rear light: on the rack end, otherwise clamped to the back of the seat post
    const onPost = ST.clone().addScaledVector(sDir, 0.05);
    const at = v.rack ? [RA.x - 0.07, r + 0.12, 0] : [onPost.x - tr * 0.7 - 0.008, onPost.y, 0];
    if (!v.rack) mesh(roundedBox(0.02, 0.022, 0.03, 0.006), mats.black, { parent: body, at: [onPost.x - tr * 0.7 + 0.002, onPost.y, 0] });
    lampGroup('taillights', 'tail').add(body, { at, normal: [-1, 0, 0], w: 0.04, h: 0.025, depth: 0.012 });
  }

  // studio emblem on the down tube (both sides) + head tube front
  {
    const dd = (v.stepThrough ? HB.clone().sub(BB) : HB.clone().sub(BB));
    const mid = BB.clone().addScaledVector(dd, 0.55);
    const tubeR = tr * (variant === 'ebike' ? 1.5 : 1.15);
    for (const [s, n] of [[1, 'R'], [-1, 'L']]) {
      const e = brandEmblem(Math.max(0.03, tubeR * 2.2), { name: `emblem_${n}` });
      e.position.set(mid.x, mid.y, s * (tubeR + 0.002));
      if (s < 0) e.rotation.y = Math.PI;
      body.add(e);
    }
    const hm = HB.clone().lerp(HT, 0.5);
    const he = brandEmblem(0.028, { name: 'emblem_front' });
    he.position.set(hm.x + tr * 1.35 * Math.cos(headA) + 0.002, hm.y + tr * 1.35 * Math.sin(headA), 0);
    he.rotation.set(0, Math.PI / 2, 0);
    body.add(he);
  }
  // kickstand (left, -Z)
  if (variant === 'city' || variant === 'ebike' || variant === 'kids') tube([BB.x - 0.06, BB.y - 0.01, -0.05], [BB.x - 0.2, 0.01, -0.14], 0.007, mats.black, { parent: body });

  // ---------------- animations ----------------
  const period = (Math.PI * 2 * r) / (o.speed ?? 5);
  const crankPeriod = period * 2;
  const set = vehicleAnimations({
    spins: [front, rear], steers: [steer], radius: r, speed: o.speed ?? 5, steerMax: 0.5,
    lamps: { head: v.lights ? 'headlights' : undefined, tail: 'taillights' },
  });
  const ride = clip('ride', crankPeriod, [
    rotateTrack(front, 'z', crankPeriod, (t) => -t * Math.PI * 4, 32),
    rotateTrack(rear, 'z', crankPeriod, (t) => -t * Math.PI * 4, 32),
    spinTrack(crank, 'z', crankPeriod, -1),
    ...pedals.map((p) => spinTrack(p, 'z', crankPeriod, 1)),
    ...(v.training ? ['training_R', 'training_L'].map((n) => rotateTrack(root.getObjectByName(n), 'z', crankPeriod, (t) => -t * Math.PI * 2 * (2 * r / 0.075), 96)) : []),
  ]);
  const bike = finalize(root, { type: 'bicycle', variant, options: o, animations: [ride, ...set.animations] });
  bike.userData.premade.oneShot = set.oneShot;
  bike.userData.premade.exclusive = [...set.exclusive.map((g) => (g.includes('drive') ? [...g, 'ride'] : g))];
  return bike;
}
