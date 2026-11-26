import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { group, roundedBox, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { clip, spinTrack } from '../../core/animation.js';
import { heavyMats, Merge, addHeavyWheels, makeRam, anchor, poseClip, cycle, machineLamps, addBeacon, emblem, profile, batteryPack, lifeClips, chevrons } from './heavy-kit.js';
import { cabRoof, rearCluster, frontLamps, finishWheeled } from './construction-machines.js';
import { pruneEmpty } from './truck.js';

/*
 * Industrial & site vehicles (generic designs, real proportions):
 *  forklift (2.5 t counterbalance, 1.6 m wheelbase, 2.1 m overhead guard), reach-truck,
 *  pallet-jack (electric walkie), airport-tug, baggage-cart, scissor-lift, boom-lift,
 *  street-sweeper, golf-cart, utility-vehicle (side-by-side).
 * Trims: electric (battery pack, no exhaust), outdoor (pneumatic lug tyres, mudguards, beacon),
 *        compact, heavy (bigger capacity), enclosed (glass cab), vintage (round lamps, open seat).
 */

export const INDUSTRIAL_VARIANTS = {
  forklift: {}, 'reach-truck': {}, 'pallet-jack': {}, 'airport-tug': {}, 'baggage-cart': {},
  'scissor-lift': {}, 'boom-lift': {}, 'street-sweeper': {}, 'golf-cart': {}, 'utility-vehicle': {},
};
export const INDUSTRIAL_TRIMS = ['electric', 'outdoor', 'compact', 'heavy', 'enclosed', 'vintage'];

function wheels(ctx, root, list, { radius, width, steer = [] }) {
  const style = ctx.T.outdoor ? 'lug' : 'industrial';
  const r = ctx.T.outdoor ? radius * 1.12 : radius;
  return addHeavyWheels(root, list.map(([n, x, z, st]) => [n, x, z, st ?? steer.includes(n)]), { radius: r, width: ctx.T.outdoor ? width * 1.3 : width, style, rimMat: ctx.mats.rimPaint, y: r });
}

function electricOrExhaust(ctx, mg, at, packAt, packSize) {
  if (ctx.T.electric) batteryPack(mg, packAt, packSize, ctx.mats);
  else if (!ctx.T.native) {
    mg.add(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 10), ctx.mats.dark, { at: [at[0], at[1] + 0.22, at[2]] });
    mg.add(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 10), ctx.mats.steel, { at: [at[0], at[1] + 0.45, at[2]] });
  }
}

/* ---- shared body-building helpers (also used by farm-machines) ------- */

const _Z = new THREE.Vector3(0, 0, 1);
const linerMat = new THREE.MeshStandardMaterial({ name: 'wheel_well', color: '#141516', roughness: 0.9, side: THREE.DoubleSide });

/** Rotation (Euler array) that turns +Z onto `dir`. */
export function aimZ(dir) {
  const q = new THREE.Quaternion().setFromUnitVectors(_Z, new THREE.Vector3(...dir).normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  return [e.x, e.y, e.z];
}

/**
 * Side-profile body outline with real wheel-arch cut-outs in its bottom edge.
 * top: [[x, y]...] from front-bottom over the top to rear-bottom (outline before bevel);
 * y0: bottom line; arches: [[x, cy, r]] (effective radius after bevel b).
 * Returns the extruded geometry (width across Z).
 */
export function archShell(top, width, { y0, arches = [], b = 0.04 }) {
  const pts = [];
  const xr = top[top.length - 1][0];
  const xf = top[0][0];
  pts.push([xr, y0]);
  for (const [x, cy, re] of [...arches].sort((a, c) => a[0] - c[0])) {
    const r = re + b;
    const sa = Math.max(-0.99, Math.min(0.99, (y0 - cy) / r));
    const al = -Math.asin(sa); // >0 when the arch dips below its centre
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const th = Math.PI + al - (i / n) * (Math.PI + 2 * al);
      pts.push([x + r * Math.cos(th), cy + r * Math.sin(th)]);
    }
  }
  pts.push([xf, y0]);
  for (const p of top.slice(1, -1)) pts.push(p);
  return profile(pts, width, b);
}

/**
 * Wheel wells for archShell arches: dark liner + inner wall plate each side, and a fender lip.
 * W: body width; depth: how deep the well is from the body side; y0e: effective body bottom.
 */
export function wheelWells(mg, mats, arches, W, { depth = 0.32, y0e = 0.2, lip = true, lipMat } = {}) {
  for (const [x, cy, r] of arches) {
    const sa = Math.max(-0.99, Math.min(0.99, (y0e - cy) / r));
    const al = -Math.asin(sa);
    for (const s of [1, -1]) {
      const liner = new THREE.CylinderGeometry(r - 0.004, r - 0.004, depth, 28, 1, true, -Math.PI / 2 - al, Math.PI + 2 * al).rotateX(-Math.PI / 2);
      mg.add(liner, linerMat, { at: [x, cy, s * (W / 2 - depth / 2)] });
      mg.box(2 * r, r + cy - y0e, 0.02, linerMat, { at: [x, (cy + r + y0e) / 2, s * (W / 2 - depth)], r: 0.005 });
      if (lip) {
        const t = new THREE.TorusGeometry(r + 0.012, 0.022, 6, 28, Math.PI + 2 * al).rotateZ(-al);
        mg.add(t, lipMat ?? mats.black, { at: [x, cy, s * (W / 2 - 0.004)] });
      }
    }
  }
}

/**
 * Add a big body shell as a few meshes of at most `maxTris` triangles each (same material),
 * so long panels stay finely sampled by the contact checker; returns the meshes.
 */
export function shellMeshes(geo, mat, parent, name, maxTris = 90) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const pos = g.attributes.position.array;
  const nor = g.attributes.normal.array;
  const tris = pos.length / 9;
  const out = [];
  for (let t0 = 0, k = 0; t0 < tris; t0 += maxTris, k++) {
    const t1 = Math.min(tris, t0 + maxTris);
    const part = new THREE.BufferGeometry();
    part.setAttribute('position', new THREE.Float32BufferAttribute(pos.slice(t0 * 9, t1 * 9), 3));
    part.setAttribute('normal', new THREE.Float32BufferAttribute(nor.slice(t0 * 9, t1 * 9), 3));
    const m = new THREE.Mesh(part, mat);
    m.name = k ? `${name}_${k}` : name;
    parent.add(m);
    out.push(m);
  }
  return out;
}

/** Axle bar through a wheel pair (touches both hubs and the well plates). */
export function axleBar(mg, mats, x, y, halfTrack, r = 0.045) {
  mg.add(new THREE.CylinderGeometry(r, r, 2 * halfTrack, 12).rotateX(Math.PI / 2), mats.iron, { at: [x, y, 0] });
}

/** Suspension seat on a pedestal standing on a floor at floorY. h = cushion top above floor. */
export function pedestalSeat(mg, mats, { x, floorY, z = 0, h = 0.4, w = 0.5, mat, head = false, arms = false, lean = 0.16 }) {
  const sm = mat ?? mats.seat;
  mg.box(0.36, 0.03, 0.34, mats.iron, { at: [x, floorY + 0.012, z], r: 0.008 }); // floor plate
  mg.add(new THREE.CylinderGeometry(0.1, 0.13, h - 0.16, 14), mats.dark, { at: [x, floorY + 0.02 + (h - 0.16) / 2, z] }); // suspension bellows
  for (let i = 1; i < 4; i++) mg.add(new THREE.TorusGeometry(0.11 + i * 0.004, 0.01, 6, 18).rotateX(Math.PI / 2), mats.black, { at: [x, floorY + 0.02 + (i * (h - 0.16)) / 4, z] });
  mg.box(0.42, 0.05, w - 0.04, mats.iron, { at: [x, floorY + h - 0.125, z], r: 0.01 }); // seat pan / slide rails
  mg.add(roundedBox(0.48, 0.1, w, 0.045, 3), sm, { at: [x, floorY + h - 0.05, z] }); // cushion
  const bh = 0.56;
  const bx = x - 0.24 - Math.sin(lean) * bh * 0.5;
  const by = floorY + h - 0.06 + Math.cos(lean) * bh * 0.5;
  mg.add(roundedBox(0.11, bh, w - 0.02, 0.05, 3), sm, { at: [bx + 0.03, by, z], rot: [0, 0, lean] });
  if (head) mg.add(roundedBox(0.09, 0.18, w * 0.55, 0.04, 3), sm, { at: [bx + 0.03 - Math.sin(lean) * (bh * 0.5 + 0.08), by + Math.cos(lean) * (bh * 0.5 + 0.08), z], rot: [0, 0, lean] });
  if (arms) {
    for (const s of [1, -1]) {
      mg.tube([x - 0.2, floorY + h - 0.08, z + s * (w / 2 + 0.02)], [x - 0.2, floorY + h + 0.17, z + s * (w / 2 + 0.02)], 0.015, mats.dark, 6);
      mg.add(roundedBox(0.32, 0.06, 0.08, 0.025, 2), sm, { at: [x - 0.08, floorY + h + 0.19, z + s * (w / 2 + 0.02)] });
      mg.box(0.06, 0.04, 0.04, mats.dark, { at: [x - 0.2, floorY + h - 0.1, z + s * (w / 2 - 0.0)], r: 0.008 });
    }
  }
  return { top: floorY + h, x, z };
}

/** Steering column from `from` to the wheel centre `to`, with a three-spoke wheel. */
export function steeringWheel(mg, mats, from, to, r = 0.17) {
  mg.tube(from, to, 0.028, mats.dark, 10);
  const dir = new THREE.Vector3(...to).sub(new THREE.Vector3(...from)).normalize();
  const rot = aimZ(dir.toArray());
  mg.add(new THREE.TorusGeometry(r, 0.02, 8, 28), mats.black, { at: to, rot });
  mg.add(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 14).rotateX(Math.PI / 2), mats.black, { at: to, rot });
  const q = new THREE.Quaternion().setFromUnitVectors(_Z, dir);
  for (const a of [0, Math.PI, -Math.PI / 2]) {
    const v = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0).applyQuaternion(q).add(new THREE.Vector3(...to));
    mg.tube(to, v.toArray(), 0.014, mats.black, 6);
  }
}

/** Small L bracket (plate) carrying a lamp. Returns the lamp position just proud of the plate face. */
export function lampBracket(mg, mats, at, normal, { size = 0.12 } = {}) {
  const [nx, , nz] = normal;
  const t = 0.02;
  if (Math.abs(nx) > Math.abs(nz)) mg.box(t, size, size * 1.1, mats.dark, { at, r: 0.006 });
  else mg.box(size * 1.1, size, t, mats.dark, { at, r: 0.006 });
  return [at[0] + nx * (t / 2 + 0.006), at[1], at[2] + nz * (t / 2 + 0.006)];
}

/** Thin dark panel-line strip embedded in a flat face (axis: 'x'|'y'|'z' = its long direction). */
export function seam(mg, mats, at, len, axis, face) {
  const t = 0.006;
  const w = 0.012;
  const dims = { x: [len, 0, 0], y: [0, len, 0], z: [0, 0, len] }[axis];
  const d = dims.map((v, i) => v || (['x', 'y', 'z'][i] === face ? t : w));
  mg.box(d[0], d[1], d[2], mats.black, { at, r: 0.002 });
}

/** Machine cab / ROPS canopy (machineCab layout) with a proper pedestal seat and steering. */
export function opCab(parent, { at = [0, 0, 0], w = 1.0, d = 1.1, h = 1.6, style = 'cab', vintage = false, mats, frontRake = 0.08, name = 'cab', seatColor, wheel = false }) {
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
  // interior: suspension seat on its pedestal, armrest consoles, dash console + steering wheel
  const seatMat = seatColor ? M.fabric(seatColor) : mats.seat;
  const sx = -d * 0.08;
  const sh = Math.min(0.5, h * 0.3);
  pedestalSeat(mg, mats, { x: sx, floorY: 0.08, h: sh, w: Math.min(0.5, w * 0.45), mat: seatMat, head: !vintage, arms: true });
  const aw = Math.min(0.5, w * 0.45) / 2 + 0.02;
  for (const s of [1, -1]) {
    mg.tube([sx + 0.0, 0.08 + sh + 0.22, s * aw], [sx + 0.03, 0.08 + sh + 0.36, s * aw], 0.012, mats.black, 6);
    mg.add(new THREE.SphereGeometry(0.028, 10, 8), mats.black, { at: [sx + 0.03, 0.08 + sh + 0.38, s * aw] });
  }
  const cx = xF - 0.14;
  mg.box(0.16, 0.62, Math.min(0.4, w * 0.36), mats.dark, { at: [cx, 0.08 + 0.31, 0], r: 0.03 });
  mg.box(0.12, 0.012, Math.min(0.32, w * 0.3), mats.decal, { at: [cx - 0.02, 0.705, 0], r: 0.003 });
  if (wheel) steeringWheel(mg, mats, [cx - 0.02, 0.66, 0], [cx - 0.2, 0.08 + sh + 0.42, 0], 0.17);
  else for (const s of [1, -1]) mg.tube([cx - 0.04, 0.66, s * 0.1], [cx - 0.12, 0.85, s * 0.1], 0.015, mats.black, 6);
  // mirrors
  for (const s of [1, -1]) {
    mg.tube([xF - rake * 0.5, h * 0.75, s * (w / 2)], [xF - rake * 0.5 + 0.1, h * 0.8, s * (w / 2 + 0.16)], 0.012, mats.dark, 6);
    mg.add(roundedBox(0.04, 0.2, 0.14, 0.018, 2), mats.black, { at: [xF - rake * 0.5 + 0.12, h * 0.8, s * (w / 2 + 0.2)] });
  }
  mg.flush(g, name === 'cab' ? 'cab_body' : `${name}_body`);
  return { group: g, roofY: at[1] + h, seatAt: [at[0] + sx, at[1] + 0.6, at[2]], h, w, d, rake, door };
}


/* ---- forklift --------------------------------------------------------- */

function forklift(ctx) {
  const { root, mats, T, lamps } = ctx;
  const mg = new Merge();
  const fr = 0.33;
  const rr = 0.26;
  const fx = 0.55;
  const rx = -1.0;
  const B = 0.05;
  const fwr = T.outdoor ? fr * 1.12 : fr;
  const fww = T.outdoor ? 0.3 : 0.24;
  const rwr = T.outdoor ? rr * 1.12 : rr;
  const rww = T.outdoor ? 0.22 : 0.18;
  const W2 = 1.12;
  // narrow front chassis between the drive wheels: dash cowl + operator floor
  const front = [[0.95, 0.2], [0.95, 0.8], [0.88, 0.98], [0.62, 1.02], [0.56, 0.98], [0.52, 0.52], [-0.25, 0.52], [-0.25, 0.2]];
  shellMeshes(profile(front.slice(0, -1).concat([[-0.25, 0.2]]), 0.68, B), mats.paint, root, 'chassis');
  // rear body: engine hood the seat sits on + rounded counterweight, steer-wheel arches cut in
  const rArch = [[rx, rwr, rwr + 0.05]];
  const rear = [[-0.2, 0.22], [-0.2, 0.95], [-0.26, 1.0], [-1.15, 1.0], [-1.28, 1.07], [-1.5, 1.07], [-1.62, 0.98], [-1.67, 0.8], [-1.67, 0.45], [-1.62, 0.3], [-1.55, 0.22]];
  shellMeshes(archShell(rear, W2, { y0: 0.22, arches: rArch, b: B }), mats.paint, root, 'rear_body');
  wheelWells(mg, mats, rArch, W2, { depth: 0.3, y0e: 0.17 });
  for (const s of [1, -1]) {
    seam(mg, mats, [-1.22, 0.62, s * W2 / 2], 0.8, 'y', 'z'); // counterweight joint
    seam(mg, mats, [-0.7, 1.02, s * W2 / 2], 0.9, 'x', 'z'); // hood edge
    // front fenders over the drive tyres, braced off the chassis side
    const fz = s * 0.47;
    mg.add(new THREE.CylinderGeometry(fwr + 0.06, fwr + 0.06, fww + 0.05, 24, 1, true, -1.05, 2.2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ name: "fender", color: "#1b1c1e", roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide }), { at: [fx, fwr, fz] });
    mg.box(0.12, 0.14, 0.16, mats.dark, { at: [fx, 2 * fwr + 0.0, s * 0.37], r: 0.01 });
    // step plate
    mg.box(0.26, 0.025, 0.12, mats.alu, { at: [0.05, 0.36, s * 0.39], r: 0.006 });
    mg.box(0.04, 0.16, 0.08, mats.dark, { at: [0.05, 0.43, s * 0.36], r: 0.006 });
  }
  // dash + steering + hood seat
  mg.box(0.18, 0.04, 0.5, mats.dark, { at: [0.74, 1.065, 0], r: 0.015 });
  mg.box(0.1, 0.012, 0.3, mats.decal, { at: [0.72, 1.09, 0], r: 0.003 });
  steeringWheel(mg, mats, [0.62, 1.02, 0], [0.28, 1.34, 0], 0.17);
  for (const s of [1, -1]) mg.tube([0.6, 1.0, s * 0.18], [0.5, 1.25, s * 0.18], 0.012, mats.black, 6); // lift / tilt levers
  pedestalSeat(mg, mats, { x: -0.45, floorY: 1.05, h: 0.22, w: 0.5, arms: true, head: true });
  // power: LPG bottle on its saddle, diesel exhaust up the guard leg, or traction battery
  const diesel = !T.electric && (T.outdoor || T.heavy);
  const lpg = !T.electric && !diesel;
  if (T.electric) {
    seam(mg, mats, [-0.7, 1.052, 0.0], 0.9, 'z', 'y');
    mg.box(0.03, 0.14, 0.14, mats.blue, { at: [-0.9, 0.75, W2 / 2], r: 0.01 });
  }
  if (lpg) {
    const ty = 1.42;
    mg.add(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 20).rotateX(Math.PI / 2), M.paint('#e8e8e4', { metallic: 0.2, roughness: 0.4 }), { at: [-1.38, ty, 0] });
    for (const s of [1, -1]) mg.add(new THREE.SphereGeometry(0.15, 20, 10).scale(1, 1, 0.45), M.paint('#e8e8e4', { metallic: 0.2, roughness: 0.4 }), { at: [-1.38, ty, s * 0.35] });
    for (const s of [1, -1]) mg.box(0.24, 0.2, 0.05, mats.dark, { at: [-1.38, 1.2, s * 0.22], r: 0.01 });
    mg.add(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 10), mats.steel, { at: [-1.38, ty + 0.18, 0.2] });
  }
  // overhead guard: raked front legs, rear legs on the counterweight, slatted roof
  const gy = 2.1;
  const gm = mg;
  const legs = [[[0.8, 1.06, 0.3], [0.72, gy, 0.5]], [[-1.32, 1.1, 0.5], [-1.15, gy, 0.5]]];
  for (const s of [1, -1]) {
    for (const [a, b] of legs) {
      gm.tube([a[0], a[1], s * a[2]], [b[0], b[1], s * b[2]], 0.04, mats.dark, 10);
      gm.box(0.14, 0.03, 0.12, mats.dark, { at: [a[0], a[1] + 0.005, s * a[2]], r: 0.006 });
    }
    gm.tube([-1.15, gy, s * 0.5], [0.72, gy, s * 0.5], 0.035, mats.dark, 10);
  }
  for (const x of [0.72, -1.15]) gm.tube([x, gy, -0.5], [x, gy, 0.5], 0.035, mats.dark, 10);
  for (let i = -3; i <= 3; i++) gm.box(1.84, 0.03, 0.05, mats.dark, { at: [-0.215, gy + 0.03, i * 0.13], r: 0.006 });
  if (T.enclosed) {
    gm.add(new THREE.PlaneGeometry(0.62, 0.95), mats.glass, { at: [0.76, 1.6, 0], rot: [0, Math.PI / 2, 0.08] });
    gm.add(new THREE.PlaneGeometry(0.96, 0.9), mats.glass, { at: [-1.24, 1.62, 0], rot: [0, -Math.PI / 2, -0.15] });
    for (const s of [1, -1]) {
      gm.add(new THREE.PlaneGeometry(1.8, 0.9), mats.glass, { at: [-0.25, 1.6, s * 0.5] });
      gm.tube([-0.3, 1.15, s * 0.5], [-0.3, gy, s * 0.5], 0.02, mats.dark, 8);
      gm.tube([-1.22, 1.15, s * 0.5], [0.76, 1.15, s * 0.5], 0.02, mats.dark, 8);
    }
  }
  if (diesel) {
    const lx = (y) => -1.32 + 0.17 * ((y - 1.1) / (gy - 1.1));
    gm.pipe([[-1.44, 1.06, -0.4], [lx(1.6) - 0.1, 1.6, -0.4], [lx(2.05) - 0.1, 2.05, -0.4], [lx(2.25) - 0.1, 2.3, -0.4]], 0.035, mats.dark, 16, 10);
    for (const y of [1.45, 1.85]) gm.tube([lx(y) - 0.1, y, -0.4], [lx(y), y, -0.5], 0.015, mats.steel, 6);
    gm.add(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 14, 1, true, 0, Math.PI), mats.alu, { at: [lx(1.65) - 0.1, 1.65, -0.4] });
  }
  mg.flush(root, 'body');
  emblem(root, 'emblem_rear', 0.08, [-1.72, 0.95, 0], -1);
  // lamps: work lights on the guard, headlights on the front legs, tail clusters, beacon
  const lm = new Merge();
  for (const s of [1, -1]) {
    const p = lampBracket(lm, mats, [0.78, gy + 0.08, s * 0.4], [1, 0, 0], { size: 0.1 });
    lamps.work.add(root, { at: p, normal: [1, 0, 0], w: 0.1, h: 0.07, depth: 0.03 });
    const q = lampBracket(lm, mats, [0.77, 1.6, s * 0.46], [1, 0, 0], { size: 0.1 });
    lamps.head.add(root, { at: q, normal: [1, 0, 0], w: 0.09, h: T.vintage ? 0.09 : 0.06, depth: 0.03, shape: T.vintage ? 'round' : 'rect' });
  }
  const rp = lampBracket(lm, mats, [-1.21, gy + 0.08, 0.35], [-1, 0, 0], { size: 0.1 });
  lamps.work.add(root, { at: rp, normal: [-1, 0, 0], w: 0.1, h: 0.07, depth: 0.03 });
  lm.box(0.16, 0.02, 0.16, mats.dark, { at: [-0.95, gy + 0.05, 0], r: 0.005 });
  lm.flush(root, 'lamp_mounts');
  addBeacon(lamps, root, [-0.95, gy + 0.06, 0], { mats, r: 0.06 });
  rearCluster(ctx, root, -1.728, 0.66, 0.4, { reverse: true });
  // mast (outer fixed to the tilt pivot, inner + carriage lift)
  const mast = group('mast', { parent: root, at: [0.98, 0.25, 0] });
  const mm = new Merge();
  for (const s of [1, -1]) mm.box(0.1, 2.0, 0.08, mats.dark, { at: [0.05, 1.0, s * 0.38], r: 0.015 });
  mm.box(0.08, 0.1, 0.84, mats.dark, { at: [0.05, 1.95, 0], r: 0.015 });
  mm.box(0.08, 0.1, 0.84, mats.dark, { at: [0.05, 0.1, 0], r: 0.015 });
  mm.add(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 12), mats.chrome, { at: [-0.02, 0.95, 0] });
  mm.flush(mast, 'mast_outer');
  const inner = group('mast_inner', { parent: mast, at: [0.1, 0.1, 0] });
  const im = new Merge();
  for (const s of [1, -1]) im.box(0.08, 1.9, 0.07, mats.steel, { at: [0.04, 0.95, s * 0.3], r: 0.012 });
  im.box(0.07, 0.08, 0.66, mats.steel, { at: [0.04, 1.86, 0], r: 0.012 });
  for (const s of [1, -1]) {
    im.add(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 14).rotateX(Math.PI / 2), mats.steel, { at: [0.1, 1.86, s * 0.15] }); // chain sheave
    im.box(0.02, 1.76, 0.035, mats.black, { at: [0.135, 0.98, s * 0.15], r: 0.004 }); // lift chain
  }
  im.box(0.06, 0.06, 0.66, mats.steel, { at: [0.08, 0.1, 0], r: 0.01 });
  im.flush(inner, 'mast_inner_body');
  const carriage = group('carriage', { parent: inner, at: [0.105, 0.05, 0] });
  const cm = new Merge();
  cm.add(roundedBox(0.06, 0.5, 1.0, 0.02, 2), mats.dark, { at: [0.0, 0.3, 0] });
  for (let i = -2; i <= 2; i++) cm.box(0.03, 0.75, 0.03, mats.dark, { at: [0.0, 0.85, i * 0.24], r: 0.006 }); // load backrest
  cm.box(0.03, 0.03, 1.0, mats.dark, { at: [0.0, 1.22, 0], r: 0.008 });
  const forkL = T.heavy ? 1.4 : 1.07;
  for (const s of [1, -1]) {
    cm.box(0.05, 0.5, 0.12, mats.iron, { at: [0.05, 0.3, s * 0.3], r: 0.01 });
    cm.box(forkL, 0.05, 0.12, mats.iron, { at: [0.05 + forkL / 2, 0.025, s * 0.3], r: 0.01 });
  }
  cm.flush(carriage, 'carriage_body');
  for (const s of [1, -1]) lamps.work.add(mast, { at: [0.1, 1.95, s * 0.44], normal: [1, 0, 0], w: 0.08, h: 0.06, depth: 0.03 });
  const f = wheels(ctx, root, [['wheel_FL', fx, 0.47], ['wheel_FR', fx, -0.47]], { radius: fr, width: 0.24 });
  const rwz = W2 / 2 - rww / 2 - 0.015;
  const r = wheels(ctx, root, [['wheel_RL', rx, rwz, true], ['wheel_RR', rx, -rwz, true]], { radius: rr, width: 0.18 });
  // drive axle under the mast
  const am = new Merge();
  am.add(new THREE.CylinderGeometry(0.06, 0.06, 0.94, 12).rotateX(Math.PI / 2), mats.iron, { at: [fx, fwr, 0] });
  am.add(new THREE.CylinderGeometry(0.05, 0.05, 2 * rwz, 12).rotateX(Math.PI / 2), mats.iron, { at: [rx, rwr, 0] });
  am.flush(root, 'axles');
  ctx.anims.push(clip('lift', 6, [
    new THREE.VectorKeyframeTrack('mast_inner.position', [0, 3, 6], [0.1, 0.1, 0, 0.1, 1.55, 0, 0.1, 0.1, 0]),
    new THREE.VectorKeyframeTrack('carriage.position', [0, 3, 6], [0.105, 0.05, 0, 0.105, 1.35, 0, 0.105, 0.05, 0]),
  ]));
  ctx.anims.push(poseClip('tilt', 4, [mast], [], (t) => { mast.rotation.z = Math.sin(t * Math.PI * 2) * 0.08; }, 24));
  finishWheeled(ctx, { spins: [...f.spins, ...r.spins], steers: r.steers, radius: fr, speed: 2.5, steerMax: 0.9 });
}

/* ---- reach truck ------------------------------------------------------ */

function reachTruck(ctx) {
  const { root, mats } = ctx;
  const mg = new Merge();
  const { lamps, T } = ctx;
  // drive / battery unit with rounded corners, operator compartment ahead of it
  shellMeshes(profile([[-0.3, 0.1], [-0.3, 1.0], [-0.38, 1.08], [-1.1, 1.08], [-1.2, 1.0], [-1.22, 0.3], [-1.15, 0.1]], 1.15, 0.05), mats.paint, root, 'drive_unit');
  for (const s of [1, -1]) {
    seam(mg, mats, [-0.75, 0.62, s * 0.575], 0.7, 'y', 'z');
    seam(mg, mats, [-0.75, 0.97, s * 0.575], 0.8, 'x', 'z');
  }
  mg.box(0.5, 0.012, 0.012, mats.black, { at: [-0.75, 1.132, 0.2], r: 0.003 });
  mg.box(0.16, 0.035, 0.035, mats.dark, { at: [-0.75, 1.14, -0.2], r: 0.01 }); // battery lid handle
  mg.add(roundedBox(0.06, 0.22, 1.1, 0.03, 2), mats.rubber, { at: [-1.28, 0.32, 0] });
  mg.box(0.66, 0.16, 1.05, mats.dark, { at: [0.0, 0.2, 0], r: 0.02 }); // floor pan
  mg.box(0.6, 0.012, 0.9, mats.black, { at: [0.0, 0.284, 0], r: 0.004 });
  mg.add(roundedBox(0.62, 0.84, 0.06, 0.025, 2), mats.paint, { at: [0.0, 0.68, -0.5] }); // right side wall
  mg.add(roundedBox(0.09, 0.42, 1.0, 0.03, 2), mats.paint, { at: [0.27, 0.9, 0] }); // dash
  mg.box(0.05, 0.12, 0.3, mats.dark, { at: [0.215, 1.0, 0.05], r: 0.01 });
  mg.box(0.03, 0.08, 0.2, mats.decal, { at: [0.19, 1.0, 0.05], r: 0.004 });
  steeringWheel(mg, mats, [0.25, 1.08, 0.3], [0.12, 1.18, 0.3], 0.12);
  mg.add(roundedBox(0.3, 0.08, 0.14, 0.03, 2), mats.dark, { at: [0.05, 1.12, -0.42] }); // mini-lever console
  for (let i = 0; i < 4; i++) mg.tube([0.0 + i * 0.05, 1.16, -0.42], [0.01 + i * 0.05, 1.24, -0.42], 0.008, mats.black, 6);
  pedestalSeat(mg, mats, { x: -0.05, floorY: 0.28, h: 0.45, w: 0.46, arms: true });
  for (const s of [1, -1]) {
    mg.add(profile([[0, 0.08], [1.5, 0.08], [1.55, 0.13], [1.5, 0.2], [0.1, 0.24], [0, 0.24]], 0.18, 0.03), mats.paint, { at: [0.15, 0, s * 0.45] }); // outrigger arms
  }
  // overhead guard (tubular legs, slatted roof)
  const gy = 2.15;
  for (const s of [1, -1]) {
    mg.tube([0.27, 1.1, s * 0.5], [0.27, gy, s * 0.5], 0.04, mats.dark, 10);
    mg.tube([-1.0, 1.12, s * 0.5], [-1.0, gy, s * 0.5], 0.04, mats.dark, 10);
    mg.box(0.12, 0.03, 0.12, mats.dark, { at: [-1.0, 1.13, s * 0.5], r: 0.006 });
    mg.tube([-1.0, gy, s * 0.5], [0.27, gy, s * 0.5], 0.035, mats.dark, 10);
  }
  for (const x of [0.27, -1.0]) mg.tube([x, gy, -0.5], [x, gy, 0.5], 0.035, mats.dark, 10);
  for (let i = -3; i <= 3; i++) mg.box(1.27, 0.03, 0.05, mats.dark, { at: [-0.365, gy + 0.03, i * 0.13], r: 0.006 });
  if (T.enclosed) {
    mg.add(new THREE.PlaneGeometry(0.96, 0.95), mats.glass, { at: [0.27, 1.62, 0], rot: [0, Math.PI / 2, 0] });
    mg.add(new THREE.PlaneGeometry(1.25, 0.95), mats.glass, { at: [-0.37, 1.62, -0.5] });
  }
  mg.flush(root, 'body');
  const lm = new Merge();
  for (const s of [1, -1]) {
    const p = lampBracket(lm, mats, [0.33, gy + 0.08, s * 0.4], [1, 0, 0], { size: 0.1 });
    lamps.work.add(root, { at: p, normal: [1, 0, 0], w: 0.1, h: 0.07, depth: 0.03 });
  }
  lm.box(0.16, 0.02, 0.16, mats.dark, { at: [-0.8, gy + 0.05, 0], r: 0.005 });
  lm.flush(root, 'lamp_mounts');
  addBeacon(lamps, root, [-0.8, gy + 0.06, 0], { mats, r: 0.06 });
  rearCluster(ctx, root, -1.278, 0.8, 0.4, { reverse: false });
  // mast slides forward on the outriggers (reach)
  const mast = group('mast', { parent: root, at: [0.35, 0.18, 0] });
  const mm = new Merge();
  for (const s of [1, -1]) mm.box(0.1, 2.4, 0.08, mats.dark, { at: [0.05, 1.2, s * 0.36], r: 0.015 });
  mm.box(0.1, 0.1, 0.8, mats.dark, { at: [0.05, 2.35, 0], r: 0.015 });
  mm.box(0.3, 0.12, 0.8, mats.dark, { at: [0.0, 0.06, 0], r: 0.015 });
  mm.flush(mast, 'mast_body');
  const carriage = group('carriage', { parent: mast, at: [0.15, 0.1, 0] });
  const cm = new Merge();
  cm.add(roundedBox(0.06, 0.6, 0.9, 0.02, 2), mats.dark, { at: [0, 0.3, 0] });
  for (const s of [1, -1]) cm.box(1.07, 0.05, 0.11, mats.iron, { at: [0.55, 0.025, s * 0.28], r: 0.01 });
  cm.flush(carriage, 'carriage_body');
  const { spins, steers } = wheels(ctx, root, [['wheel_drive', -0.8, 0.2, true], ['wheel_load_L', 1.45, 0.45], ['wheel_load_R', 1.45, -0.45], ['wheel_caster', -0.8, -0.45]], { radius: 0.17, width: 0.12 });
  ctx.anims.push(clip('reach', 6, [
    new THREE.VectorKeyframeTrack('mast.position', [0, 2, 4, 6], [0.35, 0.18, 0, 0.95, 0.18, 0, 0.95, 0.18, 0, 0.35, 0.18, 0]),
    new THREE.VectorKeyframeTrack('carriage.position', [0, 2, 4, 6], [0.15, 0.1, 0, 0.15, 0.1, 0, 0.15, 1.9, 0, 0.15, 0.1, 0]),
  ]));
  finishWheeled(ctx, { spins, steers, radius: 0.17, speed: 2, steerMax: 0.9 });
}

/* ---- pallet jack -------------------------------------------------------- */

function palletJack(ctx) {
  const { root, mats, lamps } = ctx;
  const mg = new Merge();
  // drive unit cover (rounded, battery lid on top) over the drive wheel
  const unit = [[0.06, 0.12], [0.06, 0.78], [0.0, 0.84], [-0.42, 0.84], [-0.52, 0.78], [-0.58, 0.62], [-0.58, 0.3], [-0.52, 0.16], [-0.42, 0.12]];
  shellMeshes(profile(unit, 0.7, 0.04), mats.paint, root, 'drive_cover');
  mg.box(0.42, 0.03, 0.56, mats.dark, { at: [-0.24, 0.885, 0], r: 0.01 }); // battery lid
  mg.box(0.08, 0.06, 0.1, mats.dark, { at: [-0.05, 0.91, -0.2], r: 0.01 }); // key / display
  for (const s of [1, -1]) seam(mg, mats, [-0.24, 0.48, s * 0.35], 0.5, 'y', 'z');
  mg.add(roundedBox(0.06, 0.2, 0.74, 0.03, 2), mats.rubber, { at: [-0.62, 0.35, 0] }); // rear bumper
  // fork frame: lift plate + forks with tapered tips
  mg.box(0.08, 0.5, 0.7, mats.iron, { at: [0.12, 0.33, 0], r: 0.015 });
  for (const s of [1, -1]) {
    mg.box(1.0, 0.07, 0.17, mats.iron, { at: [0.66, 0.085, s * 0.28], r: 0.012 });
    mg.add(profile([[0, 0.05], [0.18, 0.02], [0.18, -0.02], [0, -0.035]], 0.17, 0.01), mats.iron, { at: [1.15, 0.085, s * 0.28] });
    mg.box(0.06, 0.05, 0.03, mats.steel, { at: [1.05, 0.05, s * 0.36], r: 0.006 }); // load-roller axle lug
    mg.tube([0.18, 0.14, s * 0.28], [1.0, 0.07, s * 0.28], 0.012, mats.steel, 6); // push rod
  }
  // stand-on platform on a hinge bracket
  mg.box(0.06, 0.12, 0.5, mats.dark, { at: [-0.63, 0.18, 0], r: 0.01 });
  mg.box(0.34, 0.04, 0.56, mats.dark, { at: [-0.82, 0.14, 0], r: 0.01 });
  mg.box(0.32, 0.006, 0.5, mats.black, { at: [-0.82, 0.162, 0], r: 0.002 });
  mg.box(0.12, 0.08, 0.16, mats.dark, { at: [-0.3, 0.9, 0], r: 0.015 }); // tiller pivot block
  electricOrExhaust(ctx, mg, [0, 0, 0], [-0.24, 0.94, 0], [0.3, 0.06, 0.4]);
  mg.flush(root, 'body');
  const tiller = group('tiller', { parent: root, at: [-0.3, 0.92, 0] });
  const tm = new Merge();
  tm.add(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 12).rotateX(Math.PI / 2), mats.dark);
  tm.tube([0, 0, 0], [-0.32, 0.5, 0], 0.03, mats.dark, 10);
  tm.add(new THREE.CylinderGeometry(0.045, 0.035, 0.2, 10), mats.rubber, { at: [-0.1, 0.16, 0], rot: [0, 0, 0.57] }); // gas spring boot
  tm.add(roundedBox(0.16, 0.1, 0.22, 0.04, 3), mats.dark, { at: [-0.35, 0.55, 0], rot: [0, 0, 0.57] }); // control head
  for (const s of [1, -1]) {
    tm.pipe([[-0.34, 0.56, s * 0.1], [-0.38, 0.62, s * 0.2], [-0.46, 0.6, s * 0.25], [-0.5, 0.52, s * 0.22]], 0.022, mats.black, 10, 8); // horn grips
    tm.add(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12).rotateX(Math.PI / 2), mats.steel, { at: [-0.37, 0.6, s * 0.12] }); // thumb wheel
  }
  tm.add(new THREE.SphereGeometry(0.025, 10, 8), M.matte('#c81e1e', 0.5), { at: [-0.4, 0.6, 0] }); // belly button
  tm.flush(tiller, 'tiller_body');
  const { spins, steers } = addHeavyWheels(root, [['wheel_drive', -0.25, 0, true], ['wheel_load_L', 1.05, 0.28], ['wheel_load_R', 1.05, -0.28]], { radius: 0.12, width: 0.08, style: 'industrial', rimMat: mats.rimPaint, y: 0.12 });
  for (const s of [-1, 1]) spins.find((x) => x.name.includes(s > 0 ? 'load_L' : 'load_R')).parent.scale.setScalar(0.45);
  for (const s of [-1, 1]) spins.find((x) => x.name.includes(s > 0 ? 'load_L' : 'load_R')).parent.position.y = 0.055;
  ctx.anims.push(poseClip('tiller', 4, [tiller], [], (t) => { tiller.rotation.z = -cycle(t, 0.3) * 0.5; }, 20));
  lamps.head.add(root, { at: [0.108, 0.72, 0.2], normal: [1, 0, 0], w: 0.08, h: 0.04 });
  finishWheeled(ctx, { spins, steers, radius: 0.12, speed: 1.5, steerMax: 1.0 });
}

/* ---- airport tug + baggage cart ---------------------------------------- */

function airportTug(ctx) {
  const { root, mats, T, lamps } = ctx;
  const B = 0.05; // profile bevel (outline grows by B)
  const W = 1.45;
  const wr = T.outdoor ? 0.34 : 0.3;
  const ww = T.outdoor ? 0.26 : 0.2;
  const fx = 1.0;
  const rx = -1.12;
  const ra = wr + 0.06;
  const y0 = 0.27; // outline bottom → body underside at 0.22
  const arches = [[fx, wr, ra], [rx, wr, ra]];
  const mg = new Merge();
  // low ballasted body: sloped nose + bonnet, dash cowl, open operator well, rear ballast box
  const floorY = 0.59 + B;
  const top = [
    [1.55, y0], [1.55, 0.7], [1.47, 0.82], [1.3, 0.88], [0.55, 0.92], [0.42, 0.93], [0.37, 1.05], [0.25, 1.05], [0.24, 0.59],
    [-0.88, 0.59], [-0.9, 0.92], [-1.44, 0.93], [-1.55, 0.84], [-1.55, y0],
  ];
  shellMeshes(archShell(top, W, { y0, arches, b: B }), mats.paint, root, 'body_shell');
  wheelWells(mg, mats, arches, W, { depth: 0.34, y0e: y0 - B });
  const xF = 1.55 + B;
  const xR = -1.55 - B;
  const hw = W / 2;
  // panel lines: bonnet seam, belt line, rear ballast-box access panel
  for (const s of [1, -1]) {
    const z = s * hw;
    seam(mg, mats, [0.45, 0.62, z], 0.62, 'y', 'z');
    seam(mg, mats, [1.0, 0.8, z], 0.95, 'x', 'z');
    for (const y of [0.7, 0.9]) seam(mg, mats, [-1.24, y, z], 0.5, 'x', 'z');
    for (const x of [-0.99, -1.49]) seam(mg, mats, [x, 0.8, z], 0.2, 'y', 'z');
    mg.box(0.16, 0.03, 0.03, mats.dark, { at: [-1.24, 0.8, s * (hw + 0.012)], r: 0.01 }); // panel handle
    // operator step + grab handle
    mg.box(0.42, 0.025, 0.14, mats.alu, { at: [-0.2, 0.4, s * (hw + 0.06)], r: 0.008 });
    for (const x of [-0.38, -0.02]) mg.box(0.03, 0.12, 0.12, mats.dark, { at: [x, 0.45, s * (hw + 0.055)], r: 0.006 });
  }
  // bonnet top: seam lines + cooling louvres
  for (const s of [1, -1]) mg.box(0.88, 0.006, 0.012, mats.black, { at: [0.95, 0.954, s * 0.56], rot: [0, 0, 0.05], r: 0.002 });
  for (let i = 0; i < 6; i++) mg.box(0.05, 0.012, 0.6, mats.black, { at: [0.6 + i * 0.09, 0.967 - i * 0.0045, 0], rot: [0, 0, 0.05], r: 0.003 });
  // nose: grille, rubber push bumper, front tow clevis
  mg.box(0.02, 0.12, 0.62, mats.dark, { at: [xF, 0.64, 0], r: 0.006 });
  for (let i = 0; i < 4; i++) mg.box(0.026, 0.012, 0.58, mats.black, { at: [xF + 0.002, 0.6 + i * 0.027, 0], r: 0.003 });
  mg.add(roundedBox(0.16, 0.18, W + 0.04, 0.05, 3), mats.rubber, { at: [xF + 0.07, 0.43, 0] });
  for (const s of [1, -1]) mg.box(0.03, 0.1, 0.06, mats.iron, { at: [xF + 0.005, 0.43, s * 0.45], r: 0.006 });
  for (const y of [0.24, 0.32]) mg.box(0.26, 0.025, 0.16, mats.iron, { at: [xF + 0.12, y, 0], r: 0.008 });
  mg.box(0.03, 0.12, 0.16, mats.iron, { at: [xF + 0.005, 0.28, 0], r: 0.006 });
  mg.add(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 10), mats.steel, { at: [xF + 0.18, 0.29, 0] });
  mg.add(new THREE.TorusGeometry(0.03, 0.008, 6, 12).rotateX(Math.PI / 2), mats.steel, { at: [xF + 0.18, 0.375, 0] });
  // rear: cast ballast weight with rubber corner pads, pintle hitch, hazard band
  mg.add(roundedBox(0.12, 0.3, W - 0.06, 0.04, 2), mats.iron, { at: [xR - 0.055, 0.41, 0] });
  for (const s of [1, -1]) mg.add(roundedBox(0.06, 0.24, 0.18, 0.025, 2), mats.rubber, { at: [xR - 0.135, 0.41, s * 0.56] });
  mg.box(0.04, 0.22, 0.26, mats.dark, { at: [xR - 0.13, 0.4, 0], r: 0.01 }); // hitch plate
  mg.box(0.1, 0.06, 0.1, mats.dark, { at: [xR - 0.19, 0.34, 0], r: 0.01 });
  mg.add(new THREE.TorusGeometry(0.055, 0.022, 8, 16, Math.PI * 1.25).rotateX(Math.PI / 2).rotateY(Math.PI * 0.4), mats.dark, { at: [xR - 0.28, 0.34, 0] }); // pintle jaw
  mg.box(0.03, 0.1, 0.05, mats.iron, { at: [xR - 0.24, 0.41, 0], rot: [0, 0, 0.5], r: 0.008 }); // latch
  mg.add(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), mats.steel, { at: [xR - 0.28, 0.36, 0.045] });
  chevrons(mg, [xR - 0.002, 0.63, 0], 0.9, 0.1, -1, mats);
  // dashboard on the cowl: instrument pod, gauges, key switch, pedals
  mg.box(0.07, 0.16, 0.5, mats.dark, { at: [0.2 - 0.03, 1.0, 0.1], r: 0.02 });
  for (const z of [0.0, 0.18]) mg.add(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16).rotateZ(Math.PI / 2), mats.decal, { at: [0.13, 1.02, z] });
  for (const z of [0.0, 0.18]) mg.add(new THREE.CylinderGeometry(0.035, 0.035, 0.014, 16).rotateZ(Math.PI / 2), mats.black, { at: [0.128, 1.02, z] });
  mg.add(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8).rotateZ(Math.PI / 2), mats.chrome, { at: [0.13, 0.95, 0.3] });
  for (const z of [0.12, 0.28]) mg.box(0.07, 0.12, 0.08, mats.black, { at: [0.12, floorY + 0.09, z], rot: [0, 0, -0.5], r: 0.01 });
  mg.box(0.5, 0.012, 0.9, mats.black, { at: [-0.2, floorY + 0.004, 0], r: 0.004 }); // rubber floor mat
  steeringWheel(mg, mats, [0.19, 0.9, 0], [0.0, 1.2, 0], 0.18);
  pedestalSeat(mg, mats, { x: -0.55, floorY, h: 0.38, w: 0.52, arms: true, head: false });
  // exhaust (diesel) up the right flank behind a perforated heat shield, or a charge socket
  if (T.electric) {
    mg.box(0.16, 0.16, 0.03, mats.blue, { at: [-1.25, 0.72, -hw - 0.01], r: 0.01 });
    mg.add(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 14).rotateX(Math.PI / 2), mats.dark, { at: [-1.25, 0.72, -hw - 0.035] });
  } else {
    const ez = hw + 0.08;
    mg.pipe([[0.48, 0.5, hw - 0.05], [0.48, 0.5, hw + 0.04], [0.48, 0.58, ez], [0.48, 0.7, ez]], 0.035, mats.dark, 12, 10);
    mg.add(new THREE.CylinderGeometry(0.035, 0.035, 0.66, 12), mats.dark, { at: [0.48, 1.03, ez] });
    mg.pipe([[0.48, 1.35, ez], [0.48, 1.4, ez], [0.43, 1.45, ez]], 0.034, mats.dark, 8, 10);
    mg.add(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16, 1, true, -Math.PI * 0.1, Math.PI * 1.2), mats.alu, { at: [0.48, 1.0, ez] });
    for (const y of [0.82, 1.18]) {
      mg.add(new THREE.TorusGeometry(0.062, 0.008, 6, 18).rotateX(Math.PI / 2), mats.steel, { at: [0.48, y, ez] });
    }
    for (const y of [0.62, 0.86]) mg.box(0.05, 0.035, ez - hw, mats.steel, { at: [0.48, y, hw + (ez - hw) / 2 - 0.01], r: 0.006 });
  }
  // operator protection: open ROPS canopy (tubular, bolted to the body), or the enclosed cab
  const open = !T.vintage;
  const roofY = 2.0;
  const pz = hw - 0.07;
  const xf = 0.31;
  const xb = -1.3;
  if (open) {
    const cm = mg;
    for (const s of [1, -1]) {
      cm.pipe([[xf, 1.09, s * pz], [xf - 0.08, 1.7, s * pz], [xf - 0.16, roofY, s * pz], [xb + 0.12, roofY, s * pz], [xb, 1.75, s * pz], [xb, 0.97, s * pz]], 0.042, mats.paint, 48, 12);
      for (const x of [xf, xb]) cm.box(0.16, 0.025, 0.14, mats.dark, { at: [x, x > 0 ? 1.105 : 0.985, s * pz], r: 0.006 });
    }
    for (const x of [xf - 0.16, xb + 0.12]) cm.tube([x, roofY, -pz], [x, roofY, pz], 0.035, mats.paint, 10);
    cm.tube([xb, 1.25, -pz], [xb, 1.25, pz], 0.03, mats.paint, 10); // rear cross bar
    cm.add(roundedBox(xf - xb + 0.06, 0.05, W - 0.02, 0.025, 3), mats.dark, { at: [(xf + xb) / 2 - 0.08, roofY + 0.06, 0] }); // roof panel
    if (T.enclosed) {
      const midY = 1.5;
      cm.add(new THREE.PlaneGeometry(2 * pz - 0.06, 0.82), mats.glass, { at: [xf - 0.07, midY, 0], rot: [0, Math.PI / 2, 0.13] });
      cm.box(0.015, 0.55, 0.02, mats.black, { at: [xf - 0.02, 1.45, -0.15], rot: [0.35, 0, 0.13] });
      cm.add(new THREE.PlaneGeometry(2 * pz - 0.06, 0.95), mats.glass, { at: [xb + 0.005, 1.5, 0], rot: [0, -Math.PI / 2, 0] });
      for (const s of [1, -1]) {
        // door: painted lower panel + framed glass, hinged on the front post
        const dz = s * (pz + 0.03);
        cm.box(xf - 0.12 - (xb + 0.55), 0.45, 0.03, mats.paint, { at: [(xf - 0.12 + xb + 0.55) / 2, floorY + 0.3, dz], r: 0.01 });
        cm.add(new THREE.PlaneGeometry(xf - 0.16 - (xb + 0.55), 0.82), mats.glass, { at: [(xf - 0.16 + xb + 0.55) / 2, 1.53, dz] });
        cm.pipe([[xb + 0.55, floorY + 0.08, dz], [xb + 0.55, roofY - 0.04, dz]], 0.02, mats.dark, 4, 8);
        cm.pipe([[xf - 0.04, floorY + 0.53, dz], [xf - 0.11, 1.7, dz], [xf - 0.18, roofY - 0.04, dz]], 0.02, mats.dark, 8, 8);
        cm.tube([xb + 0.55, floorY + 0.52, dz], [xf - 0.04, floorY + 0.52, dz], 0.018, mats.dark, 8);
        cm.tube([xb + 0.55, roofY - 0.04, dz], [xf - 0.17, roofY - 0.04, dz], 0.018, mats.dark, 8);
        cm.box(0.12, 0.025, 0.03, mats.chrome, { at: [xb + 0.68, floorY + 0.42, dz + s * 0.02], r: 0.008 });
        cm.add(new THREE.PlaneGeometry(0.55, 0.8), mats.glass, { at: [xb + 0.27, 1.55, s * pz] });
      }
    }
  }
  mg.flush(root, 'body');
  emblem(root, 'emblem_front', 0.07, [xF + 0.004, 0.77, -0.45], 1);
  // lamps: headlights in the nose, tail clusters, roof beacon + work lights on brackets
  frontLamps(ctx, root, xF + 0.008, 0.66, 0.5, { w: 0.12, h: 0.07 });
  rearCluster(ctx, root, xR - 0.008, 0.77, 0.58, { reverse: false });
  const lm = new Merge();
  if (open) {
    const ry = roofY + 0.085;
    addBeacon(lamps, root, [xb + 0.35, ry, 0], { mats, r: 0.07 });
    for (const s of [1, -1]) {
      const p = lampBracket(lm, mats, [xf - 0.01, ry + 0.05, s * 0.45], [1, 0, 0], { size: 0.11 });
      lamps.work.add(root, { at: p, normal: [1, 0, 0], w: 0.11, h: 0.08, depth: 0.03 });
    }
    const p = lampBracket(lm, mats, [xb - 0.11, ry + 0.05, 0.4], [-1, 0, 0], { size: 0.11 });
    lamps.work.add(root, { at: p, normal: [-1, 0, 0], w: 0.11, h: 0.08, depth: 0.03 });
    // mirror on the left front post
    lm.tube([xf - 0.1, 1.55, -pz], [xf - 0.02, 1.55, -pz - 0.2], 0.012, mats.dark, 6);
    lm.add(roundedBox(0.03, 0.18, 0.13, 0.015, 2), mats.black, { at: [xf - 0.01, 1.55, -pz - 0.25] });
  } else {
    // vintage: beacon on a short mast on the ballast box
    lm.tube([-1.35, 0.97, 0.45], [-1.35, 1.45, 0.45], 0.025, mats.dark, 8);
    lm.box(0.1, 0.02, 0.1, mats.dark, { at: [-1.35, 0.98, 0.45], r: 0.005 });
    lm.box(0.12, 0.02, 0.12, mats.dark, { at: [-1.35, 1.45, 0.45], r: 0.005 });
    addBeacon(lamps, root, [-1.35, 1.46, 0.45], { mats, r: 0.07 });
  }
  lm.flush(root, 'lamp_mounts');
  const { spins, steers } = addHeavyWheels(root, [['wheel_FL', fx, hw - ww / 2 - 0.015, true], ['wheel_FR', fx, -(hw - ww / 2 - 0.015), true], ['wheel_RL', rx, hw - ww / 2 - 0.015], ['wheel_RR', rx, -(hw - ww / 2 - 0.015)]], { radius: wr, width: ww, style: T.outdoor ? 'lug' : 'industrial', rimMat: mats.rimPaint, y: wr });
  const am = new Merge();
  for (const x of [fx, rx]) axleBar(am, mats, x, wr, hw - 0.04, 0.05);
  am.flush(root, 'axles');
  finishWheeled(ctx, { spins, steers, radius: wr, speed: 4, steerMax: 0.45 });
}

function baggageCart(ctx) {
  const { root, mats, T } = ctx;
  const mg = new Merge();
  mg.add(roundedBox(2.6, 0.08, 1.4, 0.02, 2), mats.dark, { at: [0, 0.5, 0] });
  for (const [x, z] of [[1.25, 0.66], [1.25, -0.66], [-1.25, 0.66], [-1.25, -0.66]]) mg.box(0.06, 1.25, 0.06, mats.alu, { at: [x, 1.15, z], r: 0.01 });
  mg.add(roundedBox(2.7, 0.06, 1.5, 0.02, 2), mats.paint, { at: [0, 1.8, 0] });
  for (const s of [1, -1]) {
    mg.add(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshStandardMaterial({ color: '#c8cbd0', roughness: 0.7, side: THREE.DoubleSide }), { at: [0, 1.3, s * 0.67] }); // curtains
    for (let x = -1.1; x <= 1.1; x += 0.22) mg.box(0.02, 0.9, 0.012, mats.alu, { at: [x, 1.3, s * 0.68], r: 0.003 });
  }
  const bagM = [M.matte('#2b4a7a', 0.6), M.matte('#7a2b2b', 0.6), M.matte('#2b2b2b', 0.6), M.matte('#5a5a5a', 0.6)];
  for (let i = 0; i < 6; i++) mg.add(roundedBox(0.55, 0.35 + (i % 3) * 0.08, 0.38, 0.06, 2), bagM[i % 4], { at: [-1.0 + (i % 3) * 0.75, 0.54 + 0.2 + (i % 3) * 0.04, i < 3 ? -0.3 : 0.3] });
  mg.add(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 10).rotateX(Math.PI / 2), mats.iron, { at: [0.9, 0.2, 0] });
  mg.add(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 10).rotateX(Math.PI / 2), mats.iron, { at: [-0.9, 0.2, 0] });
  for (const x of [0.9, -0.9]) mg.box(0.12, 0.3, 0.12, mats.iron, { at: [x, 0.35, 0], r: 0.02 });
  mg.tube([1.3, 0.45, 0.4], [2.2, 0.35, 0], 0.03, mats.dark, 8);
  mg.tube([1.3, 0.45, -0.4], [2.2, 0.35, 0], 0.03, mats.dark, 8);
  mg.add(new THREE.TorusGeometry(0.07, 0.02, 8, 14).rotateX(Math.PI / 2), mats.dark, { at: [2.27, 0.35, 0] });
  mg.flush(root, 'body');
  void T;
  const lamps = ctx.lamps;
  for (const s of [1, -1]) lamps.tail.add(root, { at: [-1.3, 0.5, s * 0.55], normal: [-1, 0, 0], w: 0.08, h: 0.05 });
  const { spins, steers } = wheels(ctx, root, [['wheel_FL', 0.9, 0.62, true], ['wheel_FR', 0.9, -0.62, true], ['wheel_RL', -0.9, 0.62], ['wheel_RR', -0.9, -0.62]], { radius: 0.2, width: 0.12 });
  finishWheeled(ctx, { spins, steers, radius: 0.2, speed: 3, steerMax: 0.5 });
}

/* ---- scissor lift ----------------------------------------------------- */

function scissorLift(ctx) {
  const { root, mats } = ctx;
  const mg = new Merge();
  const sArch = [[0.85, 0.2, 0.25], [-0.85, 0.2, 0.25]];
  shellMeshes(archShell([[1.2, 0.25], [1.2, 0.5], [1.15, 0.525], [-1.15, 0.525], [-1.2, 0.5], [-1.2, 0.25]], 1.15, { y0: 0.25, arches: sArch, b: 0.03 }), mats.paint, root, 'chassis');
  wheelWells(mg, mats, sArch, 1.15, { depth: 0.25, y0e: 0.22 });
  for (const s of [1, -1]) {
    mg.add(roundedBox(0.9, 0.22, 0.1, 0.03, 2), mats.dark, { at: [0.0, 0.38, s * 0.6] }); // battery / hydraulic trays
    for (let i = 0; i < 5; i++) mg.box(0.02, 0.14, 0.012, mats.black, { at: [-0.3 + i * 0.15, 0.38, s * 0.652], r: 0.003 });
    mg.box(0.5, 0.03, 0.06, mats.iron, { at: [0.0, 0.235, s * 0.55], r: 0.008 }); // pothole guard
    mg.box(0.03, 0.75, 0.04, mats.dark, { at: [-1.235, 0.95, s * 0.2], r: 0.006 }); // entry ladder rails
  }
  for (let i = 0; i < 4; i++) mg.box(0.06, 0.025, 0.42, mats.alu, { at: [-1.25, 0.66 + i * 0.16, 0], r: 0.006 });
  for (let i = 0; i < 6; i++) mg.box(0.25, 0.04, 0.01, i % 2 ? mats.stripeB : mats.stripeA, { at: [-0.9 + i * 0.36, 0.5, 0.58], r: 0.003 });
  electricOrExhaust(ctx, mg, [0, 0, 0], [0.4, 0.6, 0], [0.8, 0.12, 0.6]);
  mg.flush(root, 'body');
  // scissor stack: 4 levels of X arms; all scale together via the 'stack' group
  const stack = group('stack', { parent: root, at: [0, 0.56, 0] });
  const L = 2.2;
  const levels = 4;
  const armsL = [];
  for (let k = 0; k < levels; k++) {
    for (const d of [1, -1]) {
      const a = group(`arm_${k}_${d > 0 ? 'a' : 'b'}`, { parent: stack, at: [0, 0.14 + k * 0.28, 0] });
      const am = new Merge();
      for (const s of [1, -1]) am.box(L, 0.07, 0.05, mats.paint, { at: [0, 0, s * 0.48], r: 0.015 });
      am.add(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 10).rotateX(Math.PI / 2), mats.steel);
      am.flush(a, `${a.name}_body`);
      a.rotation.z = d * Math.asin(0.14 / (L / 2));
      armsL.push({ a, d, k });
    }
  }
  const deck = group('platform', { parent: root, at: [0, 0.56 + levels * 0.28, 0] });
  const dm = new Merge();
  dm.add(roundedBox(2.5, 0.12, 1.15, 0.03, 2), mats.dark, { at: [0, 0.06, 0] });
  dm.add(roundedBox(0.8, 0.1, 1.0, 0.03, 2), mats.dark, { at: [1.6, 0.05, 0] }); // roll-out extension
  const hw = 0.55;
  for (const y of [0.6, 1.1]) {
    dm.tube([-1.22, y, -hw], [1.22, y, -hw], 0.025, mats.paint, 8);
    dm.tube([-1.22, y, hw], [1.22, y, hw], 0.025, mats.paint, 8);
    dm.tube([1.22, y, -hw], [1.22, y, hw], 0.025, mats.paint, 8);
    dm.tube([-1.22, y, -hw], [-1.22, y, hw], 0.025, mats.paint, 8);
  }
  for (const [x, z] of [[1.22, hw], [1.22, -hw], [-1.22, hw], [-1.22, -hw], [0, hw], [0, -hw]]) dm.tube([x, 0.12, z], [x, 1.1, z], 0.025, mats.paint, 8);
  dm.add(roundedBox(0.3, 0.25, 0.08, 0.03, 2), mats.black, { at: [1.0, 1.0, hw - 0.05] });
  dm.flush(deck, 'platform_body');
  // lift: arms rotate open, levels spread, platform rises
  const lift = (t) => cycle(t, 0.35);
  const H = (t) => 0.14 + lift(t) * 1.6; // per-level half rise
  ctx.anims.push(poseClip('lift', 10, armsL.map((x) => x.a), [], (t) => {
    const h = H(t);
    armsL.forEach(({ a, d, k }) => {
      a.rotation.z = d * Math.asin(Math.min(0.95, h / (L / 2)));
      a.position.y = h + k * 2 * h;
    });
  }, 40, { movers: armsL.map((x) => x.a) }));
  const clipL = ctx.anims[ctx.anims.length - 1];
  const times = [];
  const vals = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    times.push(t * 10);
    vals.push(0, 0.56 + levels * 2 * H(t), 0);
  }
  clipL.tracks.push(new THREE.VectorKeyframeTrack('platform.position', times, vals));
  // fix the rest pose (levels touching)
  armsL.forEach(({ a, k }) => { a.position.y = 0.14 + k * 0.28; });
  const { spins, steers } = wheels(ctx, root, [['wheel_FL', 0.85, 0.48, true], ['wheel_FR', 0.85, -0.48, true], ['wheel_RL', -0.85, 0.48], ['wheel_RR', -0.85, -0.48]], { radius: 0.2, width: 0.12 });
  addBeacon(ctx.lamps, root, [-1.0, 0.555, 0.4], { mats, r: 0.05 });
  finishWheeled(ctx, { spins, steers, radius: 0.2, speed: 1.5, steerMax: 0.6 });
}

/* ---- articulating boom lift ------------------------------------------ */

function boomLift(ctx) {
  const { root, mats } = ctx;
  const mg = new Merge();
  // narrow chassis between outboard wheels, fenders on brackets
  shellMeshes(profile([[1.3, 0.3], [1.3, 0.62], [1.18, 0.75], [-1.18, 0.75], [-1.3, 0.62], [-1.3, 0.3]], 1.2, 0.05), mats.paint, root, 'chassis_shell');
  for (const x of [0.85, -0.85]) mg.add(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 12).rotateX(Math.PI / 2), mats.iron, { at: [x, 0.38, 0] });
  const fenderM = new THREE.MeshStandardMaterial({ name: 'fender', color: '#1b1c1e', roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide });
  for (const x of [0.85, -0.85]) for (const s of [1, -1]) {
    mg.add(new THREE.CylinderGeometry(0.47, 0.47, 0.4, 24, 1, true, -1.1, 2.2).rotateX(-Math.PI / 2), fenderM, { at: [x, 0.38, s * 0.84] });
    mg.box(0.14, 0.1, 0.12, mats.dark, { at: [x, 0.8, s * 0.62], r: 0.01 });
  }
  for (const s of [1, -1]) chevrons(mg, [s * 1.352, 0.5, 0], 0.9, 0.16, s, mats);
  mg.add(new THREE.CylinderGeometry(0.55, 0.6, 0.12, 28), mats.iron, { at: [0, 0.81, 0] });
  mg.flush(root, 'chassis');
  const tt = group('turntable', { parent: root, at: [0, 0.87, 0] });
  const tm = new Merge();
  tm.add(roundedBox(1.8, 0.5, 1.4, 0.08, 2), mats.paint, { at: [-0.2, 0.25, 0] });
  tm.add(roundedBox(0.5, 0.8, 1.4, 0.12, 3), mats.dark, { at: [-1.0, 0.45, 0] }); // counterweight
  tm.add(roundedBox(0.5, 0.6, 0.4, 0.06, 2), mats.paint, { at: [0.4, 0.75, 0] });
  electricOrExhaust(ctx, tm, [-0.5, 0.5, 0.5], [-0.3, 0.6, 0], [0.7, 0.2, 0.8]);
  tm.flush(tt, 'turntable_body');
  const b1 = group('boom_lower', { parent: tt, at: [0.4, 0.95, 0] });
  b1.rotation.z = 2.9;
  const m1 = new Merge();
  m1.add(roundedBox(2.6, 0.3, 0.3, 0.05, 2), mats.paint, { at: [1.3, 0, 0] });
  m1.flush(b1, 'boom_lower_body');
  const b2 = group('boom_upper', { parent: b1, at: [2.6, 0, 0] });
  b2.rotation.z = -2.75;
  const m2 = new Merge();
  m2.add(roundedBox(3.4, 0.26, 0.26, 0.05, 2), mats.dark, { at: [1.7, 0, 0] });
  m2.flush(b2, 'boom_upper_body');
  const jib = group('jib', { parent: b2, at: [3.4, 0, 0] });
  jib.rotation.z = -0.2;
  const jm = new Merge();
  jm.add(roundedBox(0.8, 0.18, 0.18, 0.04, 2), mats.paint, { at: [0.4, 0, 0] });
  jm.flush(jib, 'jib_body');
  const basket = group('basket', { parent: jib, at: [0.8, 0, 0] });
  basket.rotation.z = 0.05;
  const bm = new Merge();
  bm.add(roundedBox(0.8, 0.08, 1.6, 0.02, 2), mats.dark, { at: [0.4, -0.5, 0] });
  for (const y of [0.0, 0.55]) {
    for (const [a, b] of [[[0, y - 0.5, -0.8], [0.8, y - 0.5, -0.8]], [[0, y - 0.5, 0.8], [0.8, y - 0.5, 0.8]], [[0.8, y - 0.5, -0.8], [0.8, y - 0.5, 0.8]], [[0, y - 0.5, -0.8], [0, y - 0.5, 0.8]]]) bm.tube(a, b, 0.022, mats.paint, 8);
  }
  for (const [x, z] of [[0, 0.8], [0, -0.8], [0.8, 0.8], [0.8, -0.8]]) bm.tube([x, -0.5, z], [x, 0.05, z], 0.022, mats.paint, 8);
  bm.box(0.06, 0.5, 0.06, mats.dark, { at: [0.05, -0.25, 0], r: 0.01 });
  bm.flush(basket, 'basket_body');
  const rams = [makeRam(tt, 'lower_ram', [0.0, 0.5, 0], anchor(b1, [1.1, -0.1, 0]), { r: 0.07, mats })];
  const pose = (a) => {
    b1.rotation.z = 2.9 - a * 1.9;
    b2.rotation.z = -2.75 + a * 2.55;
    jib.rotation.z = -0.2 + a * 0.3;
    basket.rotation.z = 0.05 + (2.9 - b1.rotation.z) - (b2.rotation.z + 2.75) - (jib.rotation.z + 0.2);
  };
  pose(0);
  for (const r of rams) r.update();
  ctx.anims.push(poseClip('raise', 12, [b1, b2, jib, basket], rams, (t) => pose(cycle(t, 0.3)), 48));
  ctx.anims.push(poseClip('slew', 10, [tt], rams, (t) => { tt.rotation.y = Math.sin(t * Math.PI * 2) * 1.2; }, 30));
  const { spins, steers } = wheels(ctx, root, [['wheel_FL', 0.85, 0.82, true], ['wheel_FR', 0.85, -0.82, true], ['wheel_RL', -0.85, 0.82], ['wheel_RR', -0.85, -0.82]], { radius: 0.38, width: 0.28 });
  addBeacon(ctx.lamps, tt, [-1.0, 0.85, 0.3], { mats, r: 0.05 });
  finishWheeled(ctx, { spins, steers, radius: 0.38, speed: 1.5, steerMax: 0.6 });
}

/* ---- street sweeper ----------------------------------------------------- */

function streetSweeper(ctx) {
  const { root, mats, T } = ctx;
  const mg = new Merge();
  mg.add(roundedBox(3.6, 0.45, 1.2, 0.08, 2), mats.dark, { at: [-0.2, 0.55, 0] });
  mg.add(roundedBox(1.7, 1.5, 1.35, 0.15, 3), mats.paint, { at: [-1.1, 1.5, 0] }); // hopper
  mg.add(roundedBox(0.06, 1.0, 1.0, 0.02, 2), mats.dark, { at: [-1.97, 1.5, 0] });
  for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 20, 1, true, -Math.PI / 2, Math.PI * 0.75).rotateX(-Math.PI / 2), mats.paint, { at: [-1.2, 0.35, s * 0.62] });
  mg.add(roundedBox(1.0, 0.25, 1.3, 0.06, 2), mats.dark, { at: [0.0, 0.25, 0] }); // pickup head
  electricOrExhaust(ctx, mg, [-0.2, 0.9, 0.5], [-0.2, 0.95, -0.3], [0.6, 0.2, 0.5]);
  mg.flush(root, 'body');
  emblem(root, 'emblem_rear', 0.09, [-1.98, 2.0, 0], -1);
  const cab = opCab(root, { at: [0.75, 0.78, 0], w: 1.3, d: 1.2, h: 1.6, style: 'cab', vintage: T.vintage, mats, wheel: true, frontRake: 0.12 });
  cabRoof(ctx, cab, { front: 0, rear: 0, beacon: true });
  frontLamps(ctx, root, 1.42, 0.85, 0.5, { w: 0.12, h: 0.07 });
  rearCluster(ctx, root, -1.98, 0.95, 0.5);
  const brushes = [];
  for (const s of [1, -1]) {
    const arm = new Merge();
    arm.tube([1.0, 0.5, s * 0.4], [1.35, 0.2, s * 0.75], 0.03, mats.dark, 8);
    arm.flush(root, 'brush_arm');
    const b = group(`brush_${s > 0 ? 'R' : 'L'}`, { parent: root, at: [1.35, 0.1, s * 0.75] });
    const bm = new Merge();
    bm.add(new THREE.CylinderGeometry(0.32, 0.28, 0.08, 20), mats.dark);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      bm.tube([Math.cos(a) * 0.25, 0.0, Math.sin(a) * 0.25], [Math.cos(a) * 0.42, -0.09, Math.sin(a) * 0.42], 0.008, M.matte('#c8a24a', 0.9), 4);
    }
    bm.flush(b, `${b.name}_body`);
    brushes.push({ b, s });
  }
  ctx.anims.push(clip('brushes', 0.8, brushes.map(({ b, s }) => spinTrack(b, 'y', 0.8, s))));
  const { spins, steers } = wheels(ctx, root, [['wheel_FL', 0.75, 0.62, true], ['wheel_FR', 0.75, -0.62, true], ['wheel_RL', -1.2, 0.62], ['wheel_RR', -1.2, -0.62]], { radius: 0.33, width: 0.2 });
  finishWheeled(ctx, { spins, steers, radius: 0.33, speed: 2.5, steerMax: 0.6 });
}

/* ---- golf cart & utility vehicle -------------------------------------- */

function golfCart(ctx, utv) {
  const { root, mats, T, lamps } = ctx;
  const kx = utv ? 1.12 : 1;
  const ky = utv ? 1.2 : 1;
  const wr0 = utv ? 0.33 : 0.25;
  const wr = T.outdoor ? wr0 * 1.12 : wr0;
  const ww = (utv ? 0.25 : 0.2) * (T.outdoor ? 1.3 : 1);
  const W = utv ? 1.42 : 1.15;
  const hw = W / 2;
  const fx = 0.8 * kx;
  const rx = -0.85 * kx;
  const B = 0.05;
  const y0 = 0.2 * ky + (utv ? 0.06 : 0);
  const P = (x, y) => [x * kx, y * ky];
  const floorY = 0.32 * ky + B;
  const podY = 0.6 * ky + B;
  const arches = [[fx, wr, wr + 0.06], [rx, wr, wr + 0.06]];
  const top = [[1.2 * kx, y0], P(1.25, 0.45), P(1.2, 0.62), P(1.0, 0.72), P(0.65, 0.78), P(0.5, 0.95), P(0.42, 0.95), P(0.4, 0.32), P(-0.2, 0.32), P(-0.25, 0.6), P(-1.15, 0.6), P(-1.22, 0.5), [-1.22 * kx, y0]];
  shellMeshes(archShell(top, W, { y0, arches, b: B }), mats.paint, root, 'body_shell');
  const mg = new Merge();
  wheelWells(mg, mats, arches, W, { depth: 0.3, y0e: y0 - B });
  const xF = 1.25 * kx + B;
  const xR = -1.22 * kx - B;
  // bumpers, dash, floor mat, steering
  mg.add(roundedBox(0.1, 0.12, W - 0.1, 0.04, 2), mats.rubber, { at: [xF + 0.03, 0.3 * ky, 0] });
  mg.add(roundedBox(0.1, 0.12, W - 0.1, 0.04, 2), mats.rubber, { at: [xR - 0.03, 0.3 * ky, 0] });
  mg.box(0.6 * kx, 0.012, W - 0.2, mats.black, { at: [0.1 * kx, floorY + 0.004, 0], r: 0.004 });
  mg.box(0.08, 0.14, W - 0.3, mats.dark, { at: [0.4 * kx - 0.02, 0.86 * ky, 0], r: 0.02 }); // dash fascia
  for (const z of [-0.3, 0.3]) mg.box(0.03, 0.08, 0.16, mats.black, { at: [0.4 * kx - 0.06, 0.84 * ky, z], r: 0.01 }); // cubbies
  steeringWheel(mg, mats, [0.4 * kx - 0.05, 0.8 * ky, -0.25 * kx], [0.22 * kx, 1.05 * ky, -0.25 * kx], 0.16);
  mg.box(0.08, 0.1, 0.06, mats.black, { at: [0.36 * kx, floorY + 0.06, -0.15], rot: [0, 0, -0.5], r: 0.01 }); // pedal
  for (const s of [1, -1]) seam(mg, mats, [0.62 * kx, 0.5 * ky, s * hw], 0.3, 'y', 'z');
  // bench seat on the seat pod (backrest on tube brackets)
  const sw = W - 0.12;
  mg.add(roundedBox(0.52, 0.12, sw, 0.05, 3), mats.seat, { at: [-0.55 * kx, podY + 0.05, 0] });
  for (const z of [-sw / 2 + 0.06, 0, sw / 2 - 0.06]) mg.box(0.5, 0.008, 0.008, mats.black, { at: [-0.55 * kx, podY + 0.112, z], r: 0.002 });
  const bx = -0.55 * kx - 0.3;
  mg.add(roundedBox(0.1, 0.42, sw, 0.05, 3), mats.seat, { at: [bx, podY + 0.38, 0], rot: [0, 0, 0.14] });
  for (const s of [1, -1]) mg.tube([bx + 0.02, podY + 0.0, s * (sw / 2 - 0.12)], [bx - 0.02, podY + 0.3, s * (sw / 2 - 0.12)], 0.02, mats.dark, 6);
  for (const s of [1, -1]) {
    mg.pipe([[-0.6 * kx, podY + 0.02, s * (hw + 0.0)], [-0.6 * kx, podY + 0.22, s * (hw + 0.02)], [-0.35 * kx, podY + 0.22, s * (hw + 0.02)], [-0.3 * kx, podY + 0.02, s * hw]], 0.018, mats.chrome, 12, 6); // hip rail
  }
  if (utv) {
    // ROPS cage: hoops from the floor sills / pod, cross bars and roof
    const cz = hw - 0.06;
    for (const s of [1, -1]) mg.pipe([[0.42 * kx, 0.95 * ky + B, s * cz], [0.2 * kx, 1.75, s * (cz - 0.02)], [-0.6 * kx, 1.82, s * (cz - 0.02)], [-0.95 * kx, 1.7, s * (cz - 0.02)], [-1.0 * kx, podY, s * cz]], 0.035, mats.dark, 30, 8);
    for (const x of [0.2 * kx, -0.82 * kx]) mg.tube([x, 1.78, -cz + 0.02], [x, 1.78, cz - 0.02], 0.03, mats.dark, 8);
    mg.add(roundedBox(1.0 * kx, 0.05, W - 0.1, 0.02, 2), mats.dark, { at: [-0.3 * kx, 1.83, 0] });
  } else {
    // canopy roof on four struts, windscreen; bag rack with two golf bags
    for (const s of [1, -1]) {
      mg.tube([0.46, 0.95 + B, s * (hw - 0.12)], [0.36, 1.88, s * (hw - 0.12)], 0.022, mats.alu, 8);
      mg.tube([-1.05, podY, s * (hw - 0.12)], [-1.0, 1.88, s * (hw - 0.12)], 0.022, mats.alu, 8);
    }
    mg.add(roundedBox(1.75, 0.06, W + 0.1, 0.03, 2), mats.paint, { at: [-0.3, 1.9, 0] });
    mg.add(new THREE.PlaneGeometry(W - 0.28, 0.8), mats.glass, { at: [0.41, 1.4, 0], rot: [0, Math.PI / 2, 0.1] });
    mg.box(0.42, 0.05, 0.85, mats.dark, { at: [xR - 0.2, 0.7, 0], r: 0.01 });
    for (const s of [1, -1]) mg.box(0.08, 0.05, 0.05, mats.dark, { at: [xR - 0.02, 0.7, s * 0.35], r: 0.01 });
    mg.tube([-1.05, 1.2, -0.4], [-1.05, 1.2, 0.4], 0.02, mats.dark, 6);
    for (const z of [-0.22, 0.22]) {
      mg.add(new THREE.CylinderGeometry(0.13, 0.12, 0.85, 16), M.matte(z > 0 ? '#1d3f8a' : '#2b2b2b', 0.6), { at: [-1.48, 1.1, z], rot: [0, 0, 0.35] });
      for (let i = 0; i < 4; i++) mg.add(new THREE.CylinderGeometry(0.02, 0.03, 0.18, 8), mats.alu, { at: [-1.63 + i * 0.02, 1.57, z - 0.05 + i * 0.03], rot: [0, 0, 0.35] });
      mg.tube([-1.33, 1.2, z], [-1.05, 1.2, z], 0.015, mats.dark, 6); // bag strap
    }
  }
  if (T.electric || !utv) batteryPack(mg, [-0.6 * kx, podY - 0.24, 0], [0.5, 0.2, 0.7], mats);
  mg.flush(root, 'body');
  emblem(root, 'emblem_front', 0.06, [xF + 0.004, 0.5 * ky, 0], 1);
  if (T.enclosed) {
    const em = new Merge();
    for (const s of [1, -1]) em.add(new THREE.PlaneGeometry(1.3 * kx, 0.8), M.matte('#d8dadc', 0.5), { at: [-0.3 * kx, utv ? 1.35 : 1.45, s * (hw - 0.1)] });
    em.add(new THREE.PlaneGeometry(W - 0.24, 0.8), mats.glass, { at: [-1.02 * kx, utv ? 1.35 : 1.45, 0], rot: [0, -Math.PI / 2, 0] });
    for (const s of [1, -1]) em.tube([0.4 * kx, (utv ? 1.35 : 1.45) - 0.4, s * (hw - 0.1)], [-1.0 * kx, (utv ? 1.35 : 1.45) - 0.4, s * (hw - 0.1)], 0.015, mats.dark, 6);
    em.flush(root, 'enclosure');
  }
  frontLamps(ctx, root, xF + 0.008 - 0.02, 0.5 * ky, 0.35, { w: 0.12, h: 0.06 });
  rearCluster(ctx, root, xR - 0.008, 0.45 * ky, 0.4, { reverse: false });
  let extra = null;
  if (utv) {
    const bed = group('bed', { parent: root, at: [-1.0 * kx, podY + 0.03, 0] });
    const bm = new Merge();
    bm.add(roundedBox(0.95, 0.06, 1.3, 0.02, 2), mats.paint, { at: [-0.45, 0.03, 0] });
    for (const s of [1, -1]) bm.add(roundedBox(0.95, 0.3, 0.05, 0.02, 2), mats.paint, { at: [-0.45, 0.18, s * 0.63] });
    bm.add(roundedBox(0.05, 0.3, 1.3, 0.02, 2), mats.paint, { at: [-0.92, 0.18, 0] });
    bm.add(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 10).rotateX(Math.PI / 2), mats.iron, { at: [0, 0.0, 0] }); // hinge
    bm.flush(bed, 'bed_body');
    extra = poseClip('tipBed', 5, [bed], [], (t) => { bed.rotation.z = -cycle(t, 0.3) * 0.7; }, 24);
  }
  const wz = hw - ww / 2 - 0.015;
  const { spins, steers } = addHeavyWheels(root, [['wheel_FL', fx, wz, true], ['wheel_FR', fx, -wz, true], ['wheel_RL', rx, wz], ['wheel_RR', rx, -wz]], { radius: wr, width: ww, style: T.outdoor ? 'lug' : utv ? 'lug' : 'industrial', rimMat: mats.rimPaint, y: wr });
  const am = new Merge();
  for (const x of [fx, rx]) axleBar(am, mats, x, wr, wz, 0.04);
  am.flush(root, 'axles');
  if (extra) ctx.anims.push(extra);
  finishWheeled(ctx, { spins, steers, radius: wr, speed: 4, steerMax: 0.6 });
}

/* ------------------------------------------------------------------ */
/* Factory                                                               */
/* ------------------------------------------------------------------ */

const COLORS = {
  forklift: '#f2a900', 'reach-truck': '#d32f2f', 'pallet-jack': '#f26b0f', 'airport-tug': '#f2c200', 'baggage-cart': '#5a6470',
  'scissor-lift': '#2a62d0', 'boom-lift': '#f26b0f', 'street-sweeper': '#f4f4f2', 'golf-cart': '#f4f4f2', 'utility-vehicle': '#3b5a2a',
};

export function createIndustrial(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(INDUSTRIAL_VARIANTS, o.variant, 'industrial');
  const trim = o.trim ?? null;
  const T = {
    trim, electric: trim === 'electric', outdoor: trim === 'outdoor', enclosed: trim === 'enclosed', vintage: trim === 'vintage', heavy: trim === 'heavy',
    scale: trim === 'compact' ? 0.78 : trim === 'heavy' ? 1.3 : 1, style: 'cab', native: ['pallet-jack', 'reach-truck', 'scissor-lift', 'golf-cart', 'baggage-cart'].includes(variant),
  };
  const SCHEME = {
    vintage: { color: '#8a6a2a', rim: '#d9d9d9' }, electric: { color: '#16a394', rim: '#f4f4f2' }, outdoor: { color: '#4f6a2f', rim: '#1d1d1f' },
    heavy: { color: '#2b2d30', rim: '#f2c200' }, enclosed: { color: '#c8102e', rim: '#c9ccd1' },
  };
  const mats = heavyMats(o, { accent: '#2a2a2c', color: COLORS[variant], rim: '#c9ccd1', ...(SCHEME[trim] ?? {}) });
  if (T.vintage && !o.color) Object.assign(mats.paint, { roughness: 0.85, clearcoat: 0, metalness: 0 });
  const lamps = machineLamps();
  const root = group(`industrial-${variant}${trim ? `-${trim}` : ''}`);
  const machine = group('machine', { parent: root });
  const ctx = { root: machine, mats, lamps, T, trim, anims: [], oneShot: [], exclusive: [], o };
  ({
    forklift, 'reach-truck': reachTruck, 'pallet-jack': palletJack, 'airport-tug': airportTug, 'baggage-cart': baggageCart,
    'scissor-lift': scissorLift, 'boom-lift': boomLift, 'street-sweeper': streetSweeper,
    'golf-cart': (c) => golfCart(c, false), 'utility-vehicle': (c) => golfCart(c, true),
  })[variant](ctx);
  if (T.scale !== 1) machine.scale.setScalar(T.scale);
  pruneEmpty(root);
  lifeClips(ctx.anims, [ctx.cabs?.[0]?.group], (ctx.cabs ?? []).filter((c) => c.door).map((c) => ({ node: c.door, angle: -1.2 })));
  const obj = finalize(root, { type: 'industrial', variant, options: o, animations: ctx.anims });
  obj.userData.premade.oneShot = ctx.oneShot;
  obj.userData.premade.exclusive = ctx.exclusive;
  return obj;
}
