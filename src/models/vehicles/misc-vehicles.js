import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, tube, lathe, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { spinTrack, rotateTrack, clip, wave } from '../../core/animation.js';
import { brandEmblem } from '../../core/brand.js';
import { lampGroup } from '../../core/lamps.js';
import { vehicleAnimations } from './wheel.js';
import { tubeLoft } from './helicopter.js';
import { applyTrim, sculpt, smoothShape, textMaterial, decal, plateMaterial } from './misc-kit.js';
const plateMaterialSafe = (t) => Object.assign(plateMaterial(t), { polygonOffset: true, polygonOffsetFactor: -2 });

/*
 * Small & unusual vehicles. Front = +X, left = -Z. Real sizes:
 * ATV ≈ 2.0 m long, snowmobile ≈ 3.2 m, go-kart ≈ 1.8 m, golf cart ≈ 2.4 m,
 * tuk-tuk ≈ 2.7 m, wheelchair ≈ 1.1 m, skateboard ≈ 0.8 m.
 */

export const MISC_VEHICLE_VARIANTS = {
  atv: { color: '#2e7d32' },
  snowmobile: { color: '#d32f2f' },
  'go-kart': { color: '#1565c0' },
  'golf-cart': { color: '#f5f5f5' },
  'tuk-tuk': { color: '#fbc02d' },
  'kick-scooter': { color: '#212121' },
  segway: { color: '#eceff1' },
  skateboard: { color: '#6d4c41' },
  wheelchair: { color: '#263238' },
  stroller: { color: '#455a64' },
  rickshaw: { color: '#b71c1c' },
  carriage: { color: '#1b1b1b' },
  sled: { color: '#a1887f' },
};

export const MISC_VEHICLE_TRIMS = {
  sport: { sport: true },
  utility: { utility: true },
  retro: { retro: true },
  lights: { lightKit: true },
  canopy: { canopy: true },
};

/** Small wheel (axle along Z) with tyre, rim and hub. */
function smallWheel(name, r, w, mats, { knobby = false, spokes = 0, whitewall = false, solid = false } = {}) {
  const spin = group(name);
  const prof = [];
  for (let i = 0; i <= 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI;
    prof.push([r - w * 0.42 + Math.cos(a) * w * 0.42, Math.sin(a) * w * 0.5]);
  }
  prof.unshift([r * 0.6, -w * 0.42]);
  prof.push([r * 0.6, w * 0.42]);
  mesh(lathe(prof, 40).rotateX(Math.PI / 2), solid ? M.plastic('#e0e0e0', 0.4) : mats.tyre, { parent: spin });
  if (knobby) {
    const n = Math.round(r * 90);
    const knob = new THREE.InstancedMesh(roundedBox(0.04, 0.025, w * 0.9, 0.008, 1), mats.tyre, n);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      knob.setMatrixAt(i, m4.compose(new THREE.Vector3(Math.cos(a) * (r - 0.005), Math.sin(a) * (r - 0.005), 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a), new THREE.Vector3(1, 1, 1)));
    }
    knob.name = `${name}_knobs`;
    spin.add(knob);
  }
  if (whitewall) for (const s of [1, -1]) mesh(new THREE.RingGeometry(r * 0.66, r * 0.8, 40), M.matte('#f5f5f5', 0.6), { parent: spin, at: [0, 0, s * w * 0.46], rot: [0, s > 0 ? 0 : Math.PI, 0] });
  mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, w * 0.78, 28).rotateX(Math.PI / 2), mats.rim, { parent: spin });
  mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, w * 0.9, 16).rotateX(Math.PI / 2), mats.hub, { parent: spin });
  for (let k = 0; k < spokes; k++) {
    const a = (k / spokes) * Math.PI * 2;
    for (const s of [1, -1]) tube([0, 0, s * w * 0.3], [Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, s * w * 0.3], Math.max(0.004, r * 0.02), mats.hub, { parent: spin, radialSegments: 5 });
  }
  return spin;
}

/** Big spoked cart wheel (wood or steel), axle along Z. */
function cartWheel(name, r, mats, { spokes = 12, wood = true } = {}) {
  const spin = group(name);
  mesh(new THREE.TorusGeometry(r - 0.03, 0.035, 10, 48), wood ? mats.woodDark : mats.hub, { parent: spin });
  mesh(new THREE.TorusGeometry(r - 0.005, 0.02, 8, 48), mats.hub, { parent: spin });
  mesh(new THREE.CylinderGeometry(r * 0.13, r * 0.13, 0.14, 16).rotateX(Math.PI / 2), wood ? mats.woodDark : mats.hub, { parent: spin });
  for (let k = 0; k < spokes; k++) {
    const a = (k / spokes) * Math.PI * 2;
    tube([Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.12, 0], [Math.cos(a) * (r - 0.05), Math.sin(a) * (r - 0.05), 0], 0.016, wood ? mats.woodDark : mats.hub, { parent: spin, radialSegments: 6 });
  }
  return spin;
}

export function createMiscVehicle(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(MISC_VEHICLE_VARIANTS, o.variant, 'misc-vehicle');
  const v = applyTrim(MISC_VEHICLE_VARIANTS[variant], MISC_VEHICLE_TRIMS, o.trim, 'misc-vehicle');
  const root = group(`misc-vehicle-${variant}`);
  const body = group('body', { parent: root });
  const mats = {
    paint: M.paint(o.color ?? v.color, { metallic: 0.4, roughness: 0.3 }),
    tyre: M.rubber(),
    rim: v.retro ? M.chrome() : M.metal(v.sport ? '#1d1d1f' : '#a9adb2', 0.3),
    hub: M.metal('#8d9196', 0.35),
    black: new THREE.MeshPhysicalMaterial({ color: '#111214', roughness: 0.4, clearcoat: 0.4 }),
    frame: M.paint(v.sport ? '#d84315' : '#2b2d30', { metallic: 0.5, roughness: 0.35 }),
    chrome: M.chrome(),
    seat: new THREE.MeshPhysicalMaterial({ color: v.retro ? '#5d4037' : '#1a1a1a', roughness: 0.7, sheen: 0.3 }),
    fabric: M.fabric(v.retro ? '#8d6e63' : '#37474f'),
    wood: M.wood('oak'),
    woodDark: M.wood('walnut'),
    glass: new THREE.MeshPhysicalMaterial({ color: '#c3d1d9', roughness: 0.03, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }),
  };
  const panel = (pts, width, mat, opts = {}) => mesh(sculpt(smoothShape(pts, 64), width, { smooth: true, ...opts }), mat, { parent: opts.parent ?? body, name: opts.name });
  const head = lampGroup('headlights', 'head');
  const tail = lampGroup('taillights', 'tail');
  const brake = lampGroup('brakelights', 'brake');
  const indL = { L: lampGroup('indicator_L', 'signal'), R: lampGroup('indicator_R', 'signal') };
  const spins = [];
  const steers = [];
  let radius = 0.2;
  const extra = [];
  // anchors for the generic trims: front/rear lamp faces, cargo spot, seat, roof height
  const A = { front: null, rear: null, cargo: null, seat: null, top: 1.6, w: 0.8, hasLights: false };
  const wheelAt = (parent, name, r, w, x, z, opts) => {
    const wl = smallWheel(name, r, w, mats, opts);
    wl.position.set(x, r, z);
    parent.add(wl);
    spins.push(wl);
    return wl;
  };
  const steerGroup = (name, x, z = 0) => {
    const g = group(name, { parent: root, at: [x, 0, z] });
    steers.push(g);
    return g;
  };

  ({
    atv() {
      const r = v.sport ? 0.27 : 0.29;
      const w = v.sport ? 0.24 : 0.2;
      radius = r;
      const tw = v.sport ? 0.6 : 0.55;
      for (const s of [1, -1]) {
        const st = steerGroup(`steer_${s > 0 ? 'R' : 'L'}`, 0.62, s * tw);
        const wl = smallWheel(`wheel_F${s > 0 ? 'R' : 'L'}`, r, w, mats, { knobby: true });
        wl.position.set(0, r, 0);
        st.add(wl);
        spins.push(wl);
        tube([0, r, -s * 0.06], [0, r + 0.1, -s * (tw - 0.2)], 0.025, mats.frame, { parent: st });
      }
      for (const s of [1, -1]) wheelAt(root, `wheel_R${s > 0 ? 'R' : 'L'}`, r, w + 0.03, -0.62, s * tw, { knobby: true });
      // chassis + fenders
      mesh(roundedBox(1.5, 0.22, 0.5, 0.06), mats.frame, { parent: body, at: [0, r + 0.12, 0] });
      tube([-0.62, r, -tw + 0.1], [-0.62, r, tw - 0.1], 0.04, mats.frame, { parent: body });
      panel([[1.0, 0.58], [0.85, 0.78], [0.3, 0.8], [0.25, 0.6], [0.5, 0.5], [0.95, 0.5]], 1.25, mats.paint, { bevel: 0.08, taper: (x, y) => 0.85 + 0.15 * Math.min(1, (y - 0.5) / 0.3), name: 'front_fenders' });
      panel([[-0.25, 0.6], [-0.3, 0.8], [-0.95, 0.82], [-1.02, 0.62], [-0.6, 0.52]], 1.25, mats.paint, { bevel: 0.08, name: 'rear_fenders' });
      panel([[0.35, 0.62], [0.2, 0.92], [-0.1, 0.9], [-0.15, 0.62]], 0.42, mats.paint, { bevel: 0.08, name: 'tank' });
      panel([[-0.05, 0.86], [-0.1, 0.94], [-0.7, 0.92], [-0.75, 0.84]], 0.36, mats.seat, { bevel: 0.04, name: 'seat' });
      mesh(roundedBox(0.36, 0.3, 0.34, 0.06), M.metal('#3c3e42', 0.45), { parent: body, at: [0.05, r + 0.33, 0] });
      // handlebars on the steering column
      tube([0.42, 0.75, 0], [0.36, 1.02, 0], 0.025, mats.frame, { parent: body });
      curveTube([[0.36, 1.02, -0.38], [0.38, 1.05, 0], [0.36, 1.02, 0.38]], 0.014, mats.chrome, { parent: body });
      for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12).rotateX(Math.PI / 2), mats.black, { parent: body, at: [0.36, 1.02, s * 0.36] });
      // racks
      for (const [x0, x1, y] of [[0.5, 1.0, 0.82], [-1.0, -0.45, 0.85]]) {
        for (const s of [1, -1]) tube([x0, y, s * 0.42], [x1, y, s * 0.42], 0.014, mats.black, { parent: body });
        for (let x = x0; x <= x1 + 1e-3; x += (x1 - x0) / 3) tube([x, y, -0.42], [x, y, 0.42], 0.012, mats.black, { parent: body });
      }
      for (const s of [1, -1]) head.add(body, { at: [1.0, 0.68, s * 0.22], normal: [1, 0.05, s * 0.2], w: 0.14, h: 0.07, depth: 0.015 });
      for (const s of [1, -1]) { tail.add(body, { at: [-1.03, 0.68, s * 0.3], normal: [-1, 0, 0], w: 0.1, h: 0.05, depth: 0.012 }); brake.add(body, { at: [-1.03, 0.62, s * 0.3], normal: [-1, 0, 0], w: 0.1, h: 0.03, depth: 0.012, bezel: false }); }
      for (const s of [1, -1]) mesh(roundedBox(0.4, 0.03, 0.18, 0.01), mats.black, { parent: body, at: [-0.1, r + 0.05, s * 0.33] });
      A.front = [1.02, 0.62, 0]; A.rear = [-1.03, 0.68, 0]; A.cargo = [-0.72, 0.9]; A.seat = [-0.4, 0.94]; A.top = 1.75; A.w = 1.2; A.hasLights = true;
    },
    snowmobile() {
      radius = 0.18;
      // tunnel + track
      const track = sculpt(smoothShape([[-1.55, 0.04], [0.15, 0.04], [0.45, 0.25], [0.35, 0.42], [-1.55, 0.4], [-1.65, 0.22]]), 0.42, { bevel: 0.03 });
      mesh(track, M.matte('#1a1a1a', 0.9), { parent: body, name: 'track' });
      for (let k = 0; k < 4; k++) wheelAt(root, `bogie${k}`, 0.11, 0.08, -1.3 + k * 0.45, 0.24, { solid: true });
      for (let k = 0; k < 4; k++) wheelAt(root, `bogie${k}b`, 0.11, 0.08, -1.3 + k * 0.45, -0.24, { solid: true });
      panel([[-1.7, 0.42], [0.3, 0.42], [0.3, 0.55], [-1.7, 0.55]], 0.56, mats.black, { bevel: 0.03, name: 'tunnel' });
      // hood
      panel([[1.25, 0.32], [1.0, 0.7], [0.45, 0.95], [0.1, 0.92], [0.05, 0.5], [0.6, 0.3]], 0.95, mats.paint, { bevel: 0.1, taper: (x) => 1 - 0.35 * Math.max(0, (x - 0.5) / 0.75), name: 'hood' });
      panel([[0.5, 0.95], [0.3, 1.25], [0.25, 1.24], [0.42, 0.93]], 0.6, mats.glass, { bevel: 0.006, name: 'windshield' });
      panel([[0.05, 0.75], [-0.05, 0.86], [-1.3, 0.84], [-1.35, 0.6], [0.0, 0.6]], 0.42, mats.seat, { bevel: 0.05, name: 'seat' });
      // skis on steering spindles
      for (const s of [1, -1]) {
        const st = steerGroup(`ski_${s > 0 ? 'R' : 'L'}`, 0.9, s * 0.5);
        mesh(sculpt(smoothShape([[-0.55, 0.0], [0.45, 0.0], [0.65, 0.18], [0.6, 0.22], [0.4, 0.05], [-0.55, 0.05]]), 0.14, { bevel: 0.015 }), mats.black, { parent: st, name: 'ski' });
        tube([0, 0.05, 0], [-0.1, 0.4, -s * 0.15], 0.03, mats.frame, { parent: st });
        tube([-0.1, 0.4, -s * 0.15], [-0.2, 0.42, -s * 0.48], 0.022, mats.frame, { parent: st });
      }
      tube([0.3, 0.9, 0], [0.18, 1.05, 0], 0.025, mats.frame, { parent: body });
      curveTube([[0.18, 1.05, -0.4], [0.2, 1.08, 0], [0.18, 1.05, 0.4]], 0.014, mats.chrome, { parent: body });
      for (const s of [1, -1]) mesh(roundedBox(0.6, 0.04, 0.2, 0.015), mats.black, { parent: body, at: [-0.45, 0.45, s * 0.38] });
      for (const s of [1, -1]) head.add(body, { at: [1.13, 0.48, s * 0.17], normal: [1, 0.3, s * 0.25], w: 0.16, h: 0.07, depth: 0.015, bezel: false });
      tail.add(body, { at: [-1.7, 0.5, 0], normal: [-1, 0, 0], w: 0.3, h: 0.05, depth: 0.012 });
      brake.add(body, { at: [-1.7, 0.44, 0], normal: [-1, 0, 0], w: 0.24, h: 0.03, depth: 0.012, bezel: false });
      mesh(roundedBox(0.4, 0.4, 0.04, 0.02), mats.black, { parent: body, at: [-1.62, 0.22, 0], name: 'snowflap' });
      A.front = [1.2, 0.4, 0]; A.rear = [-1.7, 0.5, 0]; A.cargo = [-1.5, 0.6]; A.seat = [-0.6, 0.86]; A.top = 1.7; A.w = 0.9; A.hasLights = true;
    },
    'go-kart'() {
      const rf = 0.13;
      const rr = 0.14;
      radius = rr;
      for (const s of [1, -1]) {
        const st = steerGroup(`steer_${s > 0 ? 'R' : 'L'}`, 0.55, s * 0.55);
        const wl = smallWheel(`wheel_F${s > 0 ? 'R' : 'L'}`, rf, v.sport ? 0.14 : 0.12, mats);
        wl.position.set(0, rf, 0);
        st.add(wl);
        spins.push(wl);
        tube([0, rf, -s * 0.07], [0, rf, -s * 0.2], 0.015, mats.frame, { parent: st });
      }
      for (const s of [1, -1]) wheelAt(root, `wheel_R${s > 0 ? 'R' : 'L'}`, rr, v.sport ? 0.2 : 0.17, -0.5, s * 0.6);
      tube([-0.5, rr, -0.62], [-0.5, rr, 0.62], 0.02, mats.chrome, { parent: body }); // live rear axle through both hubs
      for (const s of [1, -1]) mesh(roundedBox(0.08, rr - 0.06, 0.05, 0.01), mats.frame, { parent: body, at: [-0.5, 0.06 + (rr - 0.06) / 2 + 0.02, s * 0.35] }); // bearing hangers on the frame
      // tube frame
      for (const s of [1, -1]) curveTube([[0.85, 0.08, s * 0.12], [0.55, 0.08, s * 0.35], [-0.55, 0.08, s * 0.35], [-0.75, 0.1, s * 0.2]], 0.016, mats.frame, { parent: body });
      for (const x of [0.55, -0.1, -0.55]) tube([x, 0.08, -0.35], [x, 0.08, 0.35], 0.014, mats.frame, { parent: body });
      for (const s of [1, -1]) tube([0.55, 0.08, s * 0.35], [0.55, rf, s * 0.42], 0.014, mats.frame, { parent: body });
      // floor tray, nose cone, side pods, seat
      mesh(roundedBox(1.0, 0.012, 0.5, 0.004), M.metal('#9aa0a6', 0.3), { parent: body, at: [0.1, 0.09, 0] });
      panel([[1.0, 0.08], [0.98, 0.2], [0.65, 0.3], [0.55, 0.12]], 0.7, mats.paint, { bevel: 0.05, name: 'nose' });
      for (const s of [1, -1]) panel([[0.25, 0.08], [0.2, 0.22], [-0.3, 0.22], [-0.35, 0.08]], 0.1, mats.paint, { bevel: 0.03, parent: body, name: 'side_pod' }).position.z = s * 0.45;
      mesh(sculpt(smoothShape([[0.05, 0.1], [-0.25, 0.1], [-0.35, 0.55], [-0.3, 0.58], [-0.18, 0.2], [0.05, 0.18]]), 0.38, { bevel: 0.04 }), mats.black, { parent: body, name: 'seat' });
      tube([0.55, 0.12, 0], [0.3, 0.42, 0], 0.014, mats.chrome, { parent: body });
      mesh(new THREE.TorusGeometry(0.13, 0.018, 8, 24), mats.black, { parent: body, at: [0.28, 0.44, 0], rot: [0, Math.PI / 2, 0.45] });
      mesh(roundedBox(0.3, 0.25, 0.22, 0.05), M.metal('#3c3e42', 0.4), { parent: body, at: [-0.45, 0.25, 0.32] });
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 16).rotateZ(Math.PI / 2), mats.chrome, { parent: body, at: [-0.68, 0.2, 0.32] });
      decal(body, textMaterial(v.sport ? '1' : '23', { color: '#111', font: 'bold 110px Arial' }), { at: [0.99, 0.17, 0], normal: [1, 0.4, 0], w: 0.2, h: 0.12 });
      if (v.lightKit || v.sport) A.hasLights = false;
      A.front = [1.0, 0.16, 0]; A.rear = [-0.535, 0.14, 0]; A.cargo = [-0.6, 0.3]; A.seat = [-0.1, 0.55]; A.top = 1.1; A.w = 0.9;
    },
    'golf-cart'() {
      const r = 0.22;
      radius = r;
      for (const s of [1, -1]) {
        const st = steerGroup(`steer_${s > 0 ? 'R' : 'L'}`, 0.82, s * 0.5);
        const wl = smallWheel(`wheel_F${s > 0 ? 'R' : 'L'}`, r, 0.18, mats, { whitewall: v.retro });
        wl.position.set(0, r, 0);
        st.add(wl);
        spins.push(wl);
      }
      for (const s of [1, -1]) wheelAt(root, `wheel_R${s > 0 ? 'R' : 'L'}`, r, 0.18, -0.82, s * 0.5, { whitewall: v.retro });
      mesh(roundedBox(2.1, 0.2, 1.05, 0.06), mats.black, { parent: body, at: [0, r + 0.05, 0] });
      for (const x of [0.82, -0.82]) tube([x, r, -0.42], [x, r, 0.42], 0.03, mats.black, { parent: body });
      panel([[1.22, 0.3], [1.18, 0.72], [0.75, 0.78], [0.6, 0.35]], 1.15, mats.paint, { bevel: 0.1, name: 'cowl' });
      panel([[-0.6, 0.3], [-0.55, 0.62], [-1.2, 0.66], [-1.25, 0.3]], 1.15, mats.paint, { bevel: 0.1, name: 'rear_body' });
      mesh(roundedBox(1.2, 0.08, 1.0, 0.03), M.matte('#2b2b2b', 0.9), { parent: body, at: [0.0, 0.38, 0], name: 'floor' });
      mesh(cushion(0.55, 0.14, 1.0, { radius: 0.05 }), mats.seat, { parent: body, at: [-0.3, 0.7, 0], name: 'seat' });
      mesh(cushion(0.12, 0.45, 1.0, { radius: 0.05 }), mats.seat, { parent: body, at: [-0.58, 0.98, 0], rot: [0, 0, 0.12] });
      mesh(roundedBox(0.5, 0.36, 0.9, 0.05), mats.paint, { parent: body, at: [-0.3, 0.46, 0] });
      // dash + steering
      mesh(roundedBox(0.2, 0.3, 1.0, 0.06), mats.black, { parent: body, at: [0.6, 0.75, 0] });
      tube([0.55, 0.75, 0.25], [0.35, 1.05, 0.25], 0.018, mats.black, { parent: body });
      mesh(new THREE.TorusGeometry(0.17, 0.018, 8, 28), mats.black, { parent: body, at: [0.33, 1.07, 0.25], rot: [0, Math.PI / 2, 0.6] });
      // roof on posts + windshield
      const roofY = 1.95;
      for (const [x, s] of [[0.62, 1], [0.62, -1], [-0.95, 1], [-0.95, -1]]) tube([x, x > 0 ? 0.85 : 0.6, s * 0.48], [x + (x > 0 ? -0.1 : 0), roofY, s * 0.48], 0.022, mats.frame, { parent: body });
      mesh(cushion(1.9, 0.07, 1.2, { radius: 0.03, bulge: 0.1 }), v.retro ? M.fabric('#f5f5dc') : M.plastic('#eeeeee', 0.4), { parent: body, at: [-0.2, roofY + 0.03, 0], name: 'roof' });
      panel([[0.6, 0.86], [0.52, 1.92], [0.5, 1.92], [0.58, 0.86]], 0.95, mats.glass, { bevel: 0.005, name: 'windshield' });
      // golf bag rack
      mesh(roundedBox(0.4, 0.04, 0.7, 0.015), mats.black, { parent: body, at: [-1.1, 0.7, 0] });
      for (const z of [-0.18, 0.18]) {
        mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.85, 16), M.fabric(z > 0 ? '#1565c0' : '#c62828'), { parent: body, at: [-1.1, 1.12, z], rot: [0, 0, 0.2], name: 'golf_bag' });
        for (let k = 0; k < 3; k++) tube([-1.17, 1.42, z + (k - 1) * 0.05], [-1.21, 1.7, z + (k - 1) * 0.05], 0.012, mats.chrome, { parent: body }); // club shafts standing in the bag
      }
      for (const s of [1, -1]) head.add(body, { at: [1.23, 0.55, s * 0.32], normal: [1, 0, 0], w: 0.12, h: 0.12, shape: 'round', depth: 0.015 });
      for (const s of [1, -1]) { tail.add(body, { at: [-1.26, 0.52, s * 0.4], normal: [-1, 0, 0], w: 0.1, h: 0.06, depth: 0.012 }); brake.add(body, { at: [-1.26, 0.44, s * 0.4], normal: [-1, 0, 0], w: 0.1, h: 0.03, depth: 0.012, bezel: false }); }
      A.front = [1.23, 0.5, 0]; A.rear = [-1.26, 0.5, 0]; A.cargo = [-1.1, 0.72]; A.seat = [-0.3, 0.8]; A.top = roofY; A.w = 1.2; A.hasLights = true; A.roof = true;
    },
    'tuk-tuk'() {
      // auto-rickshaw ≈ 2.65 m long, 1.3 m wide, 1.75 m tall — one continuous smooth tub body
      const r = 0.2;
      radius = r;
      const frameMat = M.paint('#161616', { metallic: 0.5, roughness: 0.4 });
      const xN = 1.1;
      const xR = -1.3;
      const sill = 0.74;
      const section = (x) => {
        const nose = THREE.MathUtils.clamp((x - 0.55) / (xN - 0.55), 0, 1);
        const tailT = THREE.MathUtils.clamp((xR + 0.3 - x) / 0.3, 0, 1);
        const a = THREE.MathUtils.lerp(x < -0.45 ? 0.52 : 0.6, 0.3, nose ** 1.4) * Math.sqrt(Math.max(0.02, 1 - tailT ** 2)) * Math.sqrt(Math.max(0.02, 1 - Math.max(0, (x - (xN - 0.12)) / 0.12) ** 2));
        const top = x > 0.5 ? THREE.MathUtils.lerp(1.12, 1.0, nose) : x < -0.45 ? 0.86 : 1.12;
        const cy = 0.62;
        return { cy, a: Math.max(0.01, a), bt: Math.max(0.01, (top - cy) * Math.sqrt(Math.max(0.02, 1 - tailT ** 2))), bb: 0.3, n: 3.2, nb: 4 };
      };
      // open cabin: cut the tub above the sill between the cowl and the rear body
      const region = (x, th, p) => (x > -0.42 && x < 0.52 && p.y > sill ? -1 : 0);
      const loft = tubeLoft({ x0: xR, x1: xN, stations: 110, ring: 48, section, region, breaks: [-0.42, 0.52] });
      mesh(loft.geometry, mats.paint, { parent: body, name: 'body' });
      mesh(loft.geometry, new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.9, side: THREE.BackSide }), { parent: body, name: 'body_inner' });
      // dark rubber floor mat + body tunnel/pedestal under the driver seat
      mesh(roundedBox(1.9, 0.03, 1.08, 0.01), M.matte('#1c1c1c', 0.95), { parent: body, at: [-0.1, 0.4, 0], name: 'floor_mat' });
      mesh(roundedBox(0.34, 0.4, 0.4, 0.06), mats.paint, { parent: body, at: [0.2, 0.6, 0], name: 'seat_pedestal' });
      mesh(cushion(0.42, 0.12, 0.46, { radius: 0.05 }), mats.seat, { parent: body, at: [0.2, 0.86, 0], name: 'driver_seat' });
      // front wheel: fork, full mudguard; steering column up through the cowl to the handlebar
      const st = steerGroup('steer_F', 0.98);
      const fw = smallWheel('wheel_F', r, 0.11, mats, { whitewall: v.retro });
      fw.position.set(0, r, 0);
      st.add(fw);
      spins.push(fw);
      for (const s2 of [1, -1]) tube([0, r, s2 * 0.08], [-0.1, 0.5, s2 * 0.07], 0.022, mats.chrome, { parent: st });
      tube([-0.1, 0.5, 0], [-0.32, 1.15, 0], 0.03, frameMat, { parent: st, name: 'steering_column' });
      curveTube([[-0.34, 1.15, -0.32], [-0.36, 1.18, -0.1], [-0.36, 1.18, 0.1], [-0.34, 1.15, 0.32]], 0.016, mats.chrome, { parent: st, name: 'handlebar' });
      for (const s2 of [1, -1]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 12).rotateX(Math.PI / 2), mats.black, { parent: st, at: [-0.34, 1.15, s2 * 0.34] });
      mesh(new THREE.CylinderGeometry(r + 0.035, r + 0.035, 0.14, 28, 1, true, -Math.PI * 0.1, Math.PI * 0.85).rotateX(Math.PI / 2), Object.assign(mats.paint.clone(), { side: THREE.DoubleSide }), { parent: st, at: [0, r, 0], name: 'mudguard' });
      // centred headlight + indicators on the cowl nose, emblem
      const nose = loft.at(xN - 0.03, Math.PI / 2 * 0.0);
      head.add(body, { at: [xN - 0.01, 0.86, 0], normal: [1, 0.05, 0], w: 0.17, h: 0.17, shape: 'round', depth: 0.03 });
      for (const s2 of [1, -1]) {
        const p = loft.at(0.95, s2 > 0 ? 0.35 : Math.PI - 0.35);
        indL[s2 > 0 ? 'R' : 'L'].add(body, { at: p.point.toArray(), normal: p.normal.toArray(), w: 0.06, h: 0.04, depth: 0.012 });
      }
      { const e = brandEmblem(0.08, { name: 'emblem_front' }); e.scale.z = 0.25; e.position.set(xN - 0.005, 0.62, 0); e.rotation.y = Math.PI / 2; body.add(e); }
      // rear wheels with fenders hugging them, joined to the rear body
      for (const s2 of [1, -1]) {
        wheelAt(root, `wheel_R${s2 > 0 ? 'R' : 'L'}`, r, 0.13, -0.85, s2 * 0.6, { whitewall: v.retro });
        mesh(new THREE.CylinderGeometry(r + 0.05, r + 0.05, 0.17, 28, 1, true, -Math.PI * 0.12, Math.PI * 0.85).rotateX(Math.PI / 2), Object.assign(mats.paint.clone(), { side: THREE.DoubleSide }), { parent: body, at: [-0.85, r, s2 * 0.6], name: 'fender' });
        mesh(roundedBox(0.5, 0.05, 0.1, 0.02), mats.paint, { parent: body, at: [-0.85, r + 0.25, s2 * 0.53] });
      }
      tube([-0.85, r, -0.55], [-0.85, r, 0.55], 0.03, mats.black, { parent: body });
      // rear panel: tail lights, brake, indicators, number plate
      for (const s2 of [1, -1]) {
        tail.add(body, { at: [xR + 0.05, 0.7, s2 * 0.32], normal: [-1, 0, 0], w: 0.1, h: 0.07, depth: 0.015 });
        brake.add(body, { at: [xR + 0.05, 0.6, s2 * 0.32], normal: [-1, 0, 0], w: 0.1, h: 0.04, depth: 0.012, bezel: false });
        indL[s2 > 0 ? 'R' : 'L'].add(body, { at: [xR + 0.05, 0.7, s2 * 0.18], normal: [-1, 0, 0], w: 0.06, h: 0.05, depth: 0.012 });
      }
      decal(body, plateMaterialSafe('TK 2024'), { at: [xR + 0.02, 0.55, 0], normal: [-1, 0, 0], w: 0.3, h: 0.1 });
      // passenger bench + back, rear-seat back rail
      mesh(cushion(0.55, 0.16, 1.0, { radius: 0.05 }), mats.seat, { parent: body, at: [-0.72, 0.94, 0], name: 'bench' });
      mesh(cushion(0.14, 0.5, 1.0, { radius: 0.05 }), mats.seat, { parent: body, at: [-1.02, 1.2, 0], rot: [0, 0, 0.12] });
      tube([-1.1, 1.5, -0.5], [-1.1, 1.5, 0.5], 0.016, mats.chrome, { parent: body, name: 'back_rail' });
      // tubular frame: A-pillars from the cowl, rear posts from the rear body, roof rails
      const roofY = 1.78;
      for (const s2 of [1, -1]) {
        tube([0.5, 1.1, s2 * 0.5], [0.52, roofY, s2 * 0.6], 0.022, frameMat, { parent: body });
        tube([-1.15, 0.84, s2 * 0.48], [-1.15, roofY, s2 * 0.6], 0.022, frameMat, { parent: body });
        tube([0.52, roofY, s2 * 0.6], [-1.15, roofY, s2 * 0.6], 0.02, frameMat, { parent: body });
        // vertical grab bar at the passenger entry: sill to roof rail
        tube([-0.4, sill, s2 * 0.58], [-0.4, roofY, s2 * 0.6], 0.016, mats.chrome, { parent: body, name: 'grab_bar' });
        // step under the entry, bracketed to the sill
        mesh(roundedBox(0.36, 0.03, 0.12, 0.012), M.metal('#9aa0a6', 0.3), { parent: body, at: [-0.1, 0.33, s2 * 0.66], name: 'step' });
        tube([-0.1, 0.34, s2 * 0.6], [-0.1, 0.34, s2 * 0.66], 0.015, frameMat, { parent: body });
      }
      // full-width curved windscreen in a black frame (cowl → roof) + wiper
      const ws = new THREE.CylinderGeometry(1.4, 1.4, 0.64, 32, 1, true, -0.4, 0.8).rotateY(Math.PI / 2);
      mesh(ws, new THREE.MeshPhysicalMaterial({ color: '#9fb4c2', roughness: 0.03, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }), { parent: body, at: [0.53 - 1.4, 1.43, 0], name: 'windscreen' });
      for (const y of [1.1, 1.76]) {
        const arc = [];
        for (let k = 0; k <= 12; k++) { const a2 = -0.4 + (k / 12) * 0.8; arc.push([0.53 - 1.4 + Math.cos(a2) * 1.4, y, Math.sin(a2) * 1.4]); }
        curveTube(arc, 0.02, frameMat, { parent: body });
      }
      mesh(roundedBox(0.02, 0.5, 0.025, 0.008), mats.black, { parent: body, at: [0.535, 1.32, 0.1], rot: [0.5, 0, 0], name: 'wiper' });
      // canvas canopy: crowned roof that curves down at the back, rolled side edges on the frame
      const canopyPts = [];
      for (let k = 0; k <= 20; k++) { const t = k / 20; canopyPts.push([0.62 - t * 1.7, roofY + 0.06 + Math.sin(t * Math.PI) * 0.04]); }
      for (let k = 1; k <= 8; k++) { const a2 = (k / 8) * Math.PI / 2; canopyPts.push([-1.08 - Math.sin(a2) * 0.24, roofY + 0.06 - (1 - Math.cos(a2)) * 0.7]); }
      const inner = canopyPts.slice().reverse().map(([x, y]) => [x + (x < -1.0 ? 0.035 : 0), y - 0.04]);
      const cshape = new THREE.Shape([...canopyPts, ...inner].map(([x, y]) => new THREE.Vector2(x, y)));
      mesh(sculpt(cshape, 1.32, { bevel: 0.05, smooth: true, curveSegments: 2 }), M.fabric(v.retro ? '#2e7d32' : '#1b1b1b'), { parent: body, name: 'canopy' });
      for (const s2 of [1, -1]) tube([0.6, roofY + 0.02, s2 * 0.66], [-1.1, roofY + 0.02, s2 * 0.66], 0.03, M.fabric(v.retro ? '#1b5e20' : '#111'), { parent: body, name: 'rolled_edge' });
      A.front = [xN, 0.7, 0]; A.rear = [xR + 0.05, 0.7, 0]; A.cargo = [-1.0, 1.02]; A.seat = [-0.72, 1.0]; A.top = roofY; A.w = 1.3; A.hasLights = true; A.roof = true;
    },
    'kick-scooter'() {
      const r = v.sport ? 0.11 : 0.1;
      radius = r;
      const st = steerGroup('steer_F', 0.42);
      const fw = smallWheel('wheel_F', r, 0.04, mats);
      fw.position.set(0, r, 0);
      st.add(fw);
      spins.push(fw);
      tube([0, r, 0], [-0.08, 0.95, 0], 0.02, mats.chrome, { parent: st });
      tube([-0.08, 0.95, -0.25], [-0.08, 0.95, 0.25], 0.016, mats.chrome, { parent: st });
      for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.1, 12).rotateX(Math.PI / 2), mats.black, { parent: st, at: [-0.08, 0.95, s * 0.22] });
      wheelAt(root, 'wheel_R', r, 0.04, -0.4, 0);
      panel([[0.34, r - 0.01], [0.32, r + 0.04], [-0.36, r + 0.04], [-0.38, r - 0.01]], 0.13, mats.paint, { bevel: 0.015, name: 'deck' });
      mesh(roundedBox(0.6, 0.004, 0.11, 0.002), M.matte('#111', 0.95), { parent: body, at: [-0.02, r + 0.045, 0] });
      mesh(guard(r + 0.012, 0.05, 30, 140), mats.paint, { parent: body, at: [-0.4, r, 0] });
      if (v.lightKit || v.utility) A.hasLights = false;
      A.front = [0.36, 0.5, 0]; A.rear = [-0.5, 0.15, 0]; A.cargo = [0.3, 0.75]; A.seat = null; A.top = 1.2; A.w = 0.5;
    },
    segway() {
      const r = 0.24;
      radius = r;
      for (const s of [1, -1]) wheelAt(root, `wheel_${s > 0 ? 'R' : 'L'}`, r, 0.09, 0, s * 0.3);
      mesh(roundedBox(0.4, 0.1, 0.5, 0.04), mats.paint, { parent: body, at: [0, r - 0.02, 0], name: 'platform' });
      mesh(roundedBox(0.36, 0.01, 0.46, 0.005), M.matte('#111', 0.95), { parent: body, at: [0, r + 0.035, 0] });
      for (const s of [1, -1]) mesh(guard(r + 0.02, 0.1, 20, 160), mats.paint, { parent: body, at: [0, r, s * 0.3] });
      tube([0.05, r + 0.03, 0], [0.12, 1.05, 0], 0.025, mats.black, { parent: body });
      tube([0.12, 1.05, -0.25], [0.12, 1.05, 0.25], 0.018, mats.black, { parent: body });
      for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 12).rotateX(Math.PI / 2), M.matte('#333'), { parent: body, at: [0.12, 1.05, s * 0.22] });
      A.front = [0.2, r, 0]; A.rear = [-0.2, r, 0]; A.cargo = [0.15, 0.85]; A.top = 1.4; A.w = 0.6;
    },
    skateboard() {
      const r = v.sport ? 0.03 : 0.028;
      radius = r;
      const truckY = r * 2 + 0.02;
      for (const x of [0.27, -0.27]) {
        mesh(roundedBox(0.04, 0.03, 0.2, 0.01), mats.hub, { parent: body, at: [x, truckY, 0] });
        tube([x, r, -0.1], [x, r, 0.1], 0.006, mats.hub, { parent: body });
        for (const s of [1, -1]) wheelAt(root, `wheel_${x > 0 ? 'F' : 'R'}${s > 0 ? 'R' : 'L'}`, r, 0.03, x, s * 0.1, { solid: true });
      }
      const deck = sculpt(smoothShape([[0.4, 0.025], [0.35, 0.0], [-0.35, 0.0], [-0.4, 0.025], [-0.38, 0.03], [-0.33, 0.012], [0.33, 0.012], [0.38, 0.03]]), v.sport ? 0.2 : 0.22, { bevel: 0.004 });
      mesh(deck, v.retro ? mats.wood : mats.paint, { parent: body, at: [0, truckY + 0.012, 0], name: 'deck' });
      mesh(roundedBox(0.7, 0.002, 0.2, 0.001), M.matte('#111', 0.95), { parent: body, at: [0, truckY + 0.026, 0] });
      A.front = [0.4, truckY + 0.03, 0]; A.rear = [-0.4, truckY + 0.03, 0]; A.cargo = null; A.top = 0.3; A.w = 0.25;
    },
    wheelchair() {
      const rr = 0.3;
      radius = rr;
      for (const s of [1, -1]) {
        const wl = wheelAt(root, `wheel_${s > 0 ? 'R' : 'L'}`, rr, 0.03, -0.12, s * 0.34, { spokes: 12 });
        mesh(new THREE.TorusGeometry(rr - 0.03, 0.009, 6, 40), mats.chrome, { parent: wl, at: [0, 0, s * 0.035] });
        wl.rotation.x = s * 0.06;
      }
      for (const s of [1, -1]) {
        const st = steerGroup(`caster_${s > 0 ? 'R' : 'L'}`, 0.3, s * 0.24);
        const c = smallWheel(`caster_wheel_${s > 0 ? 'R' : 'L'}`, 0.07, 0.03, mats);
        c.position.set(-0.03, 0.07, 0);
        st.add(c);
        spins.push(c);
        tube([-0.03, 0.07, 0.02], [0, 0.2, 0], 0.01, mats.frame, { parent: st });
      }
      for (const s of [1, -1]) {
        curveTube([[0.3, 0.2, s * 0.24], [0.28, 0.48, s * 0.24], [-0.15, 0.5, s * 0.24], [-0.2, 0.95, s * 0.24], [-0.3, 1.0, s * 0.24]], 0.014, mats.frame, { parent: body });
        tube([-0.12, rr, s * 0.24], [-0.12, 0.5, s * 0.24], 0.014, mats.frame, { parent: body });
        tube([0.28, 0.48, s * 0.24], [0.4, 0.15, s * 0.18], 0.012, mats.frame, { parent: body });
        mesh(roundedBox(0.1, 0.012, 0.12, 0.004), mats.black, { parent: body, at: [0.42, 0.14, s * 0.13] });
        mesh(cushion(0.3, 0.04, 0.06, { radius: 0.015 }), mats.black, { parent: body, at: [0.0, 0.72, s * 0.24] });
        tube([0.0, 0.5, s * 0.24], [0.0, 0.7, s * 0.24], 0.01, mats.frame, { parent: body });
      }
      tube([-0.12, rr, -0.24], [-0.12, rr, 0.24], 0.012, mats.frame, { parent: body });
      mesh(cushion(0.44, 0.05, 0.46, { radius: 0.02 }), mats.fabric, { parent: body, at: [0.05, 0.52, 0], name: 'seat' });
      mesh(cushion(0.04, 0.42, 0.46, { radius: 0.015 }), mats.fabric, { parent: body, at: [-0.2, 0.78, 0], rot: [0, 0, 0.1] });
      A.front = [0.45, 0.2, 0]; A.rear = [-0.24, 0.75, 0]; A.cargo = [-0.25, 0.4]; A.seat = [0.05, 0.6]; A.top = 1.4; A.w = 0.7;
    },
    stroller() {
      const r = 0.1;
      radius = r;
      for (const s of [1, -1]) wheelAt(root, `wheel_R${s > 0 ? 'R' : 'L'}`, r + 0.03, 0.04, -0.3, s * 0.27, { spokes: v.retro ? 10 : 0 });
      for (const s of [1, -1]) {
        const st = steerGroup(`caster_${s > 0 ? 'R' : 'L'}`, 0.3, s * 0.22);
        const c = smallWheel(`caster_wheel_${s > 0 ? 'R' : 'L'}`, r, 0.035, mats);
        c.position.set(-0.03, r, 0);
        st.add(c);
        spins.push(c);
        tube([-0.03, r, 0.025], [0, 0.25, 0], 0.01, mats.frame, { parent: st });
      }
      for (const s of [1, -1]) {
        curveTube([[0.3, 0.25, s * 0.22], [0.1, 0.55, s * 0.24], [-0.3, 0.75, s * 0.25], [-0.45, 1.0, s * 0.25]], 0.014, mats.frame, { parent: body });
        tube([-0.3, r + 0.03, s * 0.25], [0.0, 0.62, s * 0.24], 0.014, mats.frame, { parent: body });
      }
      tube([-0.45, 1.0, -0.26], [-0.45, 1.0, 0.26], 0.018, mats.black, { parent: body });
      tube([-0.3, r + 0.03, -0.25], [-0.3, r + 0.03, 0.25], 0.012, mats.frame, { parent: body });
      // seat / bassinet + canopy
      mesh(cushion(0.6, 0.25, 0.42, { radius: 0.08, bulge: 0.1 }), M.fabric(o.color ?? v.color), { parent: body, at: [0.0, 0.62, 0], name: 'seat' });
      const hood = new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI, 0, Math.PI / 2).rotateY(-Math.PI / 2).scale(1, 0.9, 0.75);
      mesh(hood, Object.assign(M.fabric(o.color ?? v.color), { side: THREE.DoubleSide }), { parent: body, at: [-0.12, 0.72, 0], name: 'canopy' });
      mesh(roundedBox(0.4, 0.15, 0.36, 0.05), M.fabric('#212121'), { parent: body, at: [-0.05, 0.25, 0], name: 'basket' });
      for (const s of [1, -1]) tube([-0.05, 0.32, s * 0.18], [-0.05, 0.5, s * 0.22], 0.008, mats.frame, { parent: body });
      A.front = [0.31, 0.6, 0]; A.rear = [-0.45, 0.98, 0]; A.cargo = null; A.seat = [0, 0.75]; A.top = 1.3; A.w = 0.55;
    },
    rickshaw() {
      const r = 0.6;
      radius = r;
      for (const s of [1, -1]) {
        const wl = cartWheel(`wheel_${s > 0 ? 'R' : 'L'}`, r, mats, { wood: !v.sport, spokes: 16 });
        wl.position.set(0, r, s * 0.55);
        root.add(wl);
        spins.push(wl);
      }
      tube([0, r, -0.5], [0, r, 0.5], 0.025, mats.hub, { parent: body });
      // seat box on springs, folding hood, long shafts resting on the ground
      mesh(roundedBox(0.6, 0.35, 0.9, 0.05), mats.paint, { parent: body, at: [0.05, r + 0.2, 0], name: 'seat_box' });
      mesh(cushion(0.55, 0.12, 0.85, { radius: 0.04 }), mats.seat, { parent: body, at: [0.05, r + 0.43, 0], name: 'seat' });
      mesh(cushion(0.12, 0.5, 0.85, { radius: 0.04 }), mats.seat, { parent: body, at: [-0.22, r + 0.72, 0], rot: [0, 0, 0.15] });
      const hood = new THREE.CylinderGeometry(0.55, 0.55, 0.95, 24, 1, true, Math.PI, Math.PI * 0.65).rotateX(Math.PI / 2);
      mesh(hood, Object.assign(M.fabric('#1b1b1b'), { side: THREE.DoubleSide }), { parent: body, at: [-0.05, r + 0.5, 0], name: 'hood' });
      for (const s of [1, -1]) {
        curveTube([[-0.3, r + 0.2, s * 0.4], [0.5, r - 0.05, s * 0.4], [1.4, 0.4, s * 0.38], [2.05, 0.04, s * 0.36]], 0.025, mats.wood, { parent: body, name: 'shaft' });
        mesh(roundedBox(0.4, 0.03, 0.18, 0.01), mats.black, { parent: body, at: [0.45, r - 0.1, s * 0.3] });
      }
      tube([1.75, 0.2, -0.36], [1.75, 0.2, 0.36], 0.02, mats.wood, { parent: body });
      mesh(roundedBox(0.3, 0.03, 0.6, 0.01), mats.wood, { parent: body, at: [0.55, r - 0.12, 0], name: 'footrest' });
      A.front = [0.4, r + 0.2, 0]; A.rear = [-0.35, r + 0.3, 0]; A.cargo = [-0.4, r + 0.15]; A.seat = [0.05, r + 0.5]; A.top = r + 1.2; A.w = 1.0;
    },
    carriage() {
      const rf = 0.45;
      const rr = 0.62;
      radius = rr;
      const st = steerGroup('front_axle', 1.0);
      for (const s of [1, -1]) {
        const wl = cartWheel(`wheel_F${s > 0 ? 'R' : 'L'}`, rf, mats, { spokes: 12 });
        wl.position.set(0, rf, s * 0.7);
        st.add(wl);
        spins.push(wl);
      }
      tube([0, rf, -0.65], [0, rf, 0.65], 0.03, mats.hub, { parent: st });
      mesh(roundedBox(0.25, 0.12, 1.2, 0.03), mats.woodDark, { parent: st, at: [0, rf + 0.15, 0] });
      for (const s of [1, -1]) curveTube([[0.1, rf + 0.12, s * 0.35], [1.0, 0.6, s * 0.4], [2.2, 0.04, s * 0.42]], 0.028, mats.woodDark, { parent: st, name: 'shaft' });
      for (const s of [1, -1]) wheelAt;
      for (const s of [1, -1]) {
        const wl = cartWheel(`wheel_R${s > 0 ? 'R' : 'L'}`, rr, mats, { spokes: 14 });
        wl.position.set(-0.9, rr, s * 0.75);
        root.add(wl);
        spins.push(wl);
      }
      tube([-0.9, rr, -0.7], [-0.9, rr, 0.7], 0.03, mats.hub, { parent: body });
      // perch, coach body with doors & windows, driver box, lamps
      tube([1.0, rf + 0.2, 0], [-0.9, rr + 0.1, 0], 0.04, mats.woodDark, { parent: body });
      const cb = sculpt(smoothShape([[0.45, 0.85], [0.5, 1.95], [0.35, 2.05], [-0.95, 2.05], [-1.1, 1.95], [-1.05, 0.85], [-0.75, 0.62], [0.2, 0.62]]), 1.25, { bevel: 0.06 });
      mesh(cb, mats.paint, { parent: body, name: 'coach' });
      for (const s of [1, -1]) {
        mesh(roundedBox(0.55, 0.45, 0.02, 0.04), mats.glass, { parent: body, at: [-0.28, 1.6, s * 0.63] });
        mesh(roundedBox(0.62, 1.1, 0.012, 0.03), M.metal('#b08d57', 0.3), { parent: body, at: [-0.28, 1.35, s * 0.628] });
        mesh(roundedBox(0.58, 1.06, 0.014, 0.03), mats.paint, { parent: body, at: [-0.28, 1.35, s * 0.632] });
        mesh(roundedBox(0.5, 0.42, 0.016, 0.04), mats.glass, { parent: body, at: [-0.28, 1.6, s * 0.636] });
        tube([-0.05, 1.3, s * 0.645], [-0.05, 1.38, s * 0.645], 0.012, M.metal('#b08d57', 0.3), { parent: body });
      }
      mesh(cushion(1.65, 0.08, 1.35, { radius: 0.03, bulge: 0.15 }), mats.black, { parent: body, at: [-0.3, 2.08, 0], name: 'roof' });
      mesh(roundedBox(0.5, 0.45, 1.0, 0.05), mats.paint, { parent: body, at: [0.75, 1.1, 0], name: 'driver_box' });
      mesh(cushion(0.45, 0.1, 0.95, { radius: 0.04 }), mats.seat, { parent: body, at: [0.72, 1.37, 0] });
      tube([0.55, 1.0, 0], [0.45, 1.0, 0], 0.03, mats.woodDark, { parent: body });
      for (const s of [1, -1]) {
        tube([0.47, 1.6, s * 0.62], [0.55, 1.6, s * 0.68], 0.012, mats.black, { parent: body });
        mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.16, 12), mats.black, { parent: body, at: [0.58, 1.65, s * 0.68] });
        head.add(body, { at: [0.64, 1.65, s * 0.68], normal: [1, 0, 0], w: 0.08, h: 0.1, shape: 'round', depth: 0.015, bezel: false });
      }
      const e = brandEmblem(0.16, { name: 'emblem_door' });
      e.scale.z = 0.25;
      e.position.set(-0.28, 1.1, 0.645);
      body.add(e);
      A.front = [0.95, 1.1, 0]; A.rear = [-1.12, 1.2, 0]; A.cargo = [-1.1, 2.1]; A.seat = [0.72, 1.45]; A.top = 2.5; A.w = 1.3; A.hasLights = true;
    },
    sled() {
      radius = 0.1;
      for (const s of [1, -1]) {
        curveTube([[-0.55, 0.02, s * 0.2], [0.45, 0.02, s * 0.2], [0.6, 0.1, s * 0.2], [0.55, 0.25, s * 0.2], [0.45, 0.22, s * 0.2]], 0.015, v.retro ? M.metal('#7b1f1f', 0.4) : mats.chrome, { parent: body, segments: 40, name: 'runner' });
        for (const x of [-0.4, 0.0, 0.35]) tube([x, 0.02, s * 0.2], [x, 0.16, s * 0.2], 0.014, mats.woodDark, { parent: body });
      }
      for (let k = 0; k < 6; k++) mesh(roundedBox(0.12, 0.025, 0.5, 0.008), mats.wood, { parent: body, at: [-0.42 + k * 0.16, 0.17, 0], name: 'slat' });
      for (const s of [1, -1]) mesh(roundedBox(0.95, 0.03, 0.04, 0.01), mats.woodDark, { parent: body, at: [-0.04, 0.165, s * 0.21] });
      curveTube([[0.55, 0.25, -0.18], [0.75, 0.3, 0], [0.55, 0.25, 0.18]], 0.008, M.fabric('#c62828'), { parent: body });
      A.front = [0.55, 0.2, 0]; A.rear = [-0.5, 0.17, 0]; A.cargo = [-0.2, 0.18]; A.seat = [-0.1, 0.2]; A.top = 0.9; A.w = 0.6;
    },
  })[variant]();

  // ---------------- generic trims ----------------
  if (v.lightKit && !A.hasLights && A.front) {
    // clip-on lamp kit: headlight on a bracket at the front, tail lamp at the rear
    const [fx, fy, fz] = A.front;
    mesh(roundedBox(0.2, 0.05, 0.06, 0.012), mats.black, { parent: body, at: [fx - 0.095, fy, fz] }); // clamp bracket reaching back into the bodywork
    head.add(body, { at: [fx + 0.008, fy, fz], normal: [1, 0, 0], w: 0.06, h: 0.06, shape: 'round', depth: 0.012 });
    if (A.rear) {
      const [rx, ry, rz] = A.rear;
      mesh(roundedBox(0.2, 0.04, 0.05, 0.01), mats.black, { parent: body, at: [rx + 0.095, ry, rz] }); // clamp bracket reaching into the frame
      tail.add(body, { at: [rx - 0.006, ry, rz], normal: [-1, 0, 0], w: 0.045, h: 0.03, depth: 0.01 });
    }
  }
  if (v.utility && A.cargo) {
    const [cx, cy] = A.cargo;
    const bw = Math.min(0.5, A.w * 0.55);
    const box = group('cargo', { parent: body, at: [cx, cy, 0] });
    mesh(roundedBox(bw, 0.03, bw, 0.01), mats.black, { parent: box, at: [0, 0.015, 0] });
    mesh(cushion(bw * 0.9, bw * 0.55, bw * 0.85, { radius: 0.04 }), M.plastic('#37474f', 0.5), { parent: box, at: [0, bw * 0.28 + 0.03, 0], name: 'cargo_box' });
  } else if (v.utility && variant === 'skateboard') {
    // longboard grip handles / carry strap
    curveTube([[0.1, 0.1, 0.12], [0, 0.2, 0.14], [-0.1, 0.1, 0.12]], 0.008, M.fabric('#ef6c00'), { parent: body });
  } else if (v.utility && variant === 'stroller') {
    mesh(cushion(0.3, 0.25, 0.12, { radius: 0.04 }), M.fabric('#6d4c41'), { parent: body, at: [-0.42, 0.85, 0], name: 'bag' });
  }
  if (v.canopy && !A.roof && A.seat) {
    // sunshade: umbrella / canopy on a post behind the seat
    const [sx, sy] = A.seat;
    const top = Math.max(A.top, sy + 0.8);
    tube([sx - 0.25, sy - 0.05, 0], [sx - 0.25, top, 0], 0.016, mats.chrome, { parent: body });
    const shade = new THREE.ConeGeometry(Math.max(0.5, A.w * 0.75), 0.25, 16, 1, true);
    mesh(shade, Object.assign(M.fabric(v.retro ? '#f5f5dc' : '#ef6c00'), { side: THREE.DoubleSide }), { parent: body, at: [sx - 0.25, top + 0.1, 0], name: 'canopy' });
  } else if (v.canopy && A.roof) {
    // side curtains / weather enclosure under the existing roof
    for (const s of [1, -1]) mesh(roundedBox(1.5, 0.7, 0.01, 0.02), mats.glass, { parent: body, at: [-0.2, A.top - 0.45, s * 0.49], name: 'curtain' });
  } else if (v.canopy && variant === 'skateboard') {
    for (const x of [0.33, -0.33]) mesh(roundedBox(0.06, 0.012, 0.2, 0.004), M.plastic('#ef6c00'), { parent: body, at: [x, 0.11, 0] });
  }
  if (v.sport && A.front) {
    // racing stripes / number + lowered stance accents
    const t = textMaterial(variant === 'skateboard' ? 'PRO' : '77', { color: '#ffffff', font: 'bold 96px Arial', stroke: '#000' });
    const [fx, fy] = A.front;
    for (const s of [1, -1]) if (A.w > 0.4) decal(body, t, { at: [fx * 0.4, Math.max(0.12, fy - 0.05), s * (A.w / 2 + 0.005)], normal: [0, 0, s], w: Math.min(0.5, A.w * 0.4), h: 0.16, name: 'sport_decal' });
    if (variant === 'skateboard') decal(body, t, { at: [0, 0.09, 0], normal: [0, -1, 0], w: 0.3, h: 0.12 });
  }
  if (v.retro && variant !== 'carriage' && variant !== 'sled' && variant !== 'skateboard' && A.front) {
    // chrome bumper / trim bar at the front
    const [fx, fy, fz] = A.front;
    tube([fx - 0.02, fy - 0.04, -Math.min(0.5, A.w * 0.4)], [fx - 0.02, fy - 0.04, Math.min(0.5, A.w * 0.4)], 0.018, mats.chrome, { parent: body, name: 'chrome_bar' });
  }

  // ---------------- animations ----------------
  const hasHead = head.meshes.length > 0;
  const hasTail = tail.meshes.length > 0;
  const set = vehicleAnimations({
    spins, steers, radius, speed: o.speed ?? (variant === 'snowmobile' || variant === 'atv' || variant === 'go-kart' ? 8 : 3), steerMax: 0.45,
    lamps: { head: hasHead ? 'headlights' : undefined, tail: hasTail ? 'taillights' : undefined, brake: brake.meshes.length ? 'brakelights' : undefined, signalL: indL.L.meshes.length ? 'indicator_L' : undefined, signalR: indL.R.meshes.length ? 'indicator_R' : undefined },
  });
  const animations = [...set.animations];
  if (variant === 'snowmobile') {
    // track belt shimmer: the bogies spin with drive (already in spins)
  }
  finalize(root, { type: 'misc-vehicle', variant, options: o, animations });
  root.userData.premade.oneShot = set.oneShot;
  root.userData.premade.exclusive = set.exclusive;
  return root;
}

/** Curved mudguard shell around a wheel axle (local XY plane), angles in degrees (0 = front, 90 = top). */
function guard(r, width, a0, a1) {
  const t0 = THREE.MathUtils.degToRad(a0) + Math.PI / 2;
  const len = THREE.MathUtils.degToRad(a1 - a0);
  return new THREE.CylinderGeometry(r, r, width, 32, 1, true, t0, len).rotateX(Math.PI / 2);
}
