import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { group, roundedBox, lathe } from '../../core/utils.js';
import { clip } from '../../core/animation.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import {
  Merge, addHeavyWheels, makeRam, anchor, poseClip, cycle, keys, trackAssembly, machineCab, addBeacon, emblem, handrail, ladder, plateXZ, profile, hollowTub,
} from './heavy-kit.js';
import { cabRoof, rearCluster, frontLamps, powerUnit, finishWheeled, finishCrawler } from './construction-machines.js';
import { buildCabOver, chassis, rearFenders, tanks, rearEnd, RAIL_TOP, RAIL_Z } from './truck.js';

/*
 * More construction machines (see construction-machines.js for the shared helpers).
 * Real-world reference dimensions:
 *  articulated-dump 30 t: 10.5 m long, 2.9 m wide, 23.5R25 tyres (r 0.78), 6×6 with bogie
 *  mining-dump 100 t rigid: 10.3 m long, 6 m wide, r 1.35 tyres, canopy over the cab
 *  mobile-crane 4-axle all-terrain: 12.5 m carrier, 11 m 4-section boom, 4 outriggers
 *  tower-crane: 1.6 m lattice mast (24 m), 30 m jib, 10 m counter-jib
 *  road-roller 12 t single drum (2.13 m), tandem-roller (1.5 m drums), motor-grader (3.7 m blade),
 *  asphalt-paver (3 m screed), truck-mounted concrete pump (4-section Z-fold boom), trencher
 */

/* ------------------------------------------------------------------ */
/* Articulated dump truck                                               */
/* ------------------------------------------------------------------ */

function articulatedDump(ctx) {
  const { root, mats, T } = ctx;
  const wr = 0.78;
  const tz = 1.12;
  const hinge = 2.0;
  const front = group('front_frame', { parent: root, at: [hinge, 0, 0] });
  const rear = group('rear_frame', { parent: root });
  const fm = new Merge();
  const fx = (x) => x - hinge; // world x → front-frame local
  fm.add(roundedBox(3.0, 0.5, 1.0, 0.08, 2), mats.paint, { at: [fx(3.6), 1.15, 0] });
  fm.add(profile([[fx(3.7), 1.4], [fx(5.05), 1.3], [fx(5.15), 1.9], [fx(4.9), 2.3], [fx(3.7), 2.4]], 1.6, 0.07), mats.paint);
  fm.add(roundedBox(0.08, 0.55, 1.3, 0.02, 2), mats.dark, { at: [fx(5.13), 1.68, 0] });
  for (let k = 0; k < 6; k++) fm.box(0.025, 0.025, 1.2, mats.steel, { at: [fx(5.17), 1.45 + k * 0.08, 0], r: 0.006 });
  fm.add(roundedBox(0.3, 0.35, 2.6, 0.08, 2), mats.dark, { at: [fx(5.15), 0.95, 0] });
  fm.add(new THREE.CylinderGeometry(0.09, 0.09, 2 * tz, 14).rotateX(Math.PI / 2), mats.iron, { at: [fx(3.7), wr, 0] });
  fm.add(roundedBox(0.7, 0.45, 0.9, 0.12, 3), mats.iron, { at: [fx(3.7), wr, 0] });
  fm.box(0.4, 0.95 - wr + 0.25, 0.6, mats.iron, { at: [fx(3.7), (0.95 + wr) / 2 + 0.05, 0], r: 0.03 });
  fm.add(roundedBox(1.9, 0.12, 2.8, 0.04, 2), mats.paint, { at: [fx(3.0), 1.5, 0] }); // cab deck
  for (const s of [1, -1]) {
    fm.add(new THREE.CylinderGeometry(wr + 0.1, wr + 0.1, 0.7, 24, 1, true, -Math.PI / 2 + 0.1, Math.PI * 0.7).rotateX(-Math.PI / 2), mats.paint, { at: [fx(3.7), wr, s * tz] });
    fm.box(0.2, 1.5 - 1.15, 0.2, mats.paint, { at: [fx(3.0), 1.33, s * 0.45], r: 0.02 });
  }
  fm.add(roundedBox(0.4, 0.6, 1.0, 0.06, 2), mats.iron, { at: [fx(2.2), 1.1, 0] });
  ladder(fm, [fx(3.1), 0.45, -1.35], [fx(3.0), 1.5, -1.38], 0.4, mats, 4);
  powerUnit(ctx, fm, [fx(4.0), 2.4, 0.55], 0.5, { packAt: [fx(4.3), 2.6, -0.2], packSize: [0.8, 0.4, 0.6] });
  fm.flush(front, 'front_body');
  emblem(front, 'emblem_front', 0.12, [fx(5.19), 2.1, 0], 1);
  const cab = machineCab(front, { at: [fx(2.85), 1.56, -0.25], w: 1.6, d: 1.55, h: 1.9, style: T.style, vintage: T.vintage, mats, wheel: true });
  cabRoof(ctx, cab, { front: 2, rear: 1 });
  frontLamps(ctx, front, fx(5.15), 1.12, 1.0, { w: 0.22, h: 0.12 });
  // rear frame + bogie
  const rm = new Merge();
  rm.add(roundedBox(6.2, 0.5, 1.0, 0.08, 2), mats.paint, { at: [-1.2, 1.15, 0] });
  rm.add(roundedBox(0.4, 0.6, 1.0, 0.06, 2), mats.iron, { at: [1.8, 1.1, 0] });
  for (const x of [-1.2, -2.9]) {
    rm.add(new THREE.CylinderGeometry(0.09, 0.09, 2 * tz, 14).rotateX(Math.PI / 2), mats.iron, { at: [x, wr, 0] });
    rm.add(roundedBox(0.7, 0.45, 0.9, 0.12, 3), mats.iron, { at: [x, wr, 0] });
  }
  for (const s of [1, -1]) {
    rm.add(roundedBox(2.2, 0.3, 0.2, 0.08, 2), mats.iron, { at: [-2.05, wr + 0.2, s * 0.6] }); // bogie beams
    rm.box(0.4, 0.95 - wr - 0.2 + 0.1, 0.25, mats.iron, { at: [-2.05, (0.95 + wr + 0.2) / 2 + 0.05, s * 0.6], r: 0.03 });
  }
  rm.box(0.3, 0.6, 2.5, mats.steel, { at: [-4.3, 1.0, 0], r: 0.04 });
  rm.flush(rear, 'rear_body');
  rearCluster(ctx, rear, -4.46, 1.0, 1.05);
  // dump body
  const body = group('dump_body', { parent: rear, at: [-4.0, 1.42, 0] });
  const bm = new Merge();
  const bl = 6.0;
  const adtFloor = [[-0.75, 0.5], [-0.2, 0.0], [bl - 0.6, 0.0], [bl - 0.3, 1.75], [bl + 0.1, 1.95]];
  hollowTub(bm, mats.paint, { outline: [...adtFloor, [bl - 0.2, 2.0], [-0.2, 1.45], [-0.75, 1.15]], strips: [[adtFloor, 1]], w: 2.9, t: 0.07 });
  for (const s of [1, -1]) bm.pipe([[-0.75, 1.15, s * 1.43], [-0.2, 1.45, s * 1.43], [bl - 0.2, 2.0, s * 1.43]], 0.06, mats.paint, 8, 8);
  for (const s of [1, -1]) for (let x = 0.4; x < bl - 0.6; x += 0.9) bm.box(0.1, 1.3, 0.06, mats.paint, { at: [x, 0.8, s * 1.47], r: 0.015 });
  bm.add(roundedBox(bl - 0.6, 0.18, 0.9, 0.05, 2), mats.steel, { at: [(bl - 0.6) / 2 - 0.3, -0.04, 0] });
  bm.add(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 14).rotateX(Math.PI / 2), mats.steel, { at: [0, 0, 0] });
  bm.flush(body, 'dump_body_shell');
  const rams = [];
  for (const s of [1, -1]) rams.push(makeRam(rear, `hoist_${s > 0 ? 'R' : 'L'}`, [0.9, 1.15, s * 0.75], anchor(body, [4.3, 0.0, s * 0.75]), { r: 0.1, mats }));
  ctx.anims.push(poseClip('tip', 8, [body], rams, (t) => { body.rotation.z = -cycle(t, 0.25) * 0.95; }, 40));
  const { spins } = addHeavyWheels(front, [['wheel_FL', fx(3.7), tz], ['wheel_FR', fx(3.7), -tz]], { radius: wr, width: 0.6, style: 'otr', rimMat: mats.rimPaint });
  const r2 = addHeavyWheels(rear, [['wheel_R0L', -1.2, tz], ['wheel_R0R', -1.2, -tz], ['wheel_R1L', -2.9, tz], ['wheel_R1R', -2.9, -tz]], { radius: wr, width: 0.6, style: 'otr', rimMat: mats.rimPaint });
  spins.push(...r2.spins);
  finishWheeled(ctx, { spins, steers: [front], radius: wr, speed: 4, steerMax: 0.5 });
}

/* ------------------------------------------------------------------ */
/* Rigid mining haul truck                                              */
/* ------------------------------------------------------------------ */

function miningDump(ctx) {
  const { root, mats, lamps, T } = ctx;
  ctx.roofClear = 0.38; // canopy underside above the cab roof
  const wr = 1.35;
  const tw = 0.9;
  const fz = 2.2;
  const rz = 2.35;
  const mg = new Merge();
  for (const s of [1, -1]) mg.add(roundedBox(8.8, 0.8, 0.35, 0.08, 2), mats.paint, { at: [0, 1.65, s * 0.6] });
  for (const x of [-3.5, -1.0, 1.5, 3.8]) mg.box(0.3, 0.5, 1.2, mats.paint, { at: [x, 1.65, 0], r: 0.04 });
  // front axle (independent struts) + rear axle housing
  mg.add(roundedBox(0.6, 0.5, 2 * fz - 0.6, 0.1, 2), mats.iron, { at: [2.6, wr + 0.1, 0] });
  for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.22, 0.22, 1.3, 16), mats.chrome, { at: [2.6, wr + 0.7, s * 1.3] });
  mg.add(new THREE.CylinderGeometry(0.3, 0.3, 2 * rz, 18).rotateX(Math.PI / 2), mats.iron, { at: [-2.4, wr, 0] });
  mg.add(roundedBox(1.4, 1.1, 1.4, 0.2, 3), mats.iron, { at: [-2.4, wr, 0] });
  mg.box(0.8, 1.65 - wr - 0.3, 1.0, mats.iron, { at: [-2.4, (1.65 + wr + 0.3) / 2, 0], r: 0.05 });
  for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 16), mats.chrome, { at: [-1.8, wr + 0.65, s * 0.9] });
  // radiator + bumper + upper deck
  mg.add(roundedBox(0.6, 1.9, 2.6, 0.1, 3), mats.paint, { at: [4.6, 2.1, 0] });
  mg.add(roundedBox(0.06, 1.5, 2.2, 0.02, 2), mats.dark, { at: [4.92, 2.15, 0] });
  for (let k = 0; k < 12; k++) mg.box(0.03, 0.04, 2.1, mats.steel, { at: [4.96, 1.5 + k * 0.12, 0], r: 0.008 });
  mg.add(roundedBox(0.5, 0.5, 3.4, 0.1, 2), mats.dark, { at: [4.75, 1.0, 0] });
  mg.add(roundedBox(2.4, 0.1, 5.9, 0.04, 2), mats.paint, { at: [3.85, 3.05, 0] });
  for (const s of [1, -1]) mg.box(0.25, 3.05 - 1.9, 0.25, mats.paint, { at: [4.4, 2.5, s * 1.2], r: 0.03 });
  mg.add(roundedBox(1.7, 1.2, 1.6, 0.12, 3), mats.paint, { at: [3.7, 3.7, 1.6] }); // engine/air filter housing
  for (const s of [1, -1]) handrail(mg, [[2.7, 3.1, s * 2.92], [2.7, 4.1, s * 2.92], [5.0, 4.1, s * 2.92], [5.0, 3.1, s * 2.92]], mats.stripeA, 0.03);
  handrail(mg, [[5.0, 3.1, -2.9], [5.0, 4.1, -1.0], [5.0, 4.1, 2.9]], mats.stripeA, 0.03);
  // access ladder from the bumper up to the deck, with hand rails tied into the deck rail
  ladder(mg, [5.03, 0.35, 1.5], [5.03, 3.05, 1.5], 0.6, mats, 11);
  mg.box(0.12, 0.08, 0.7, mats.steel, { at: [5.0, 0.35, 1.5], r: 0.015 });
  for (const s of [1, -1]) handrail(mg, [[5.08, 1.25, 1.5 + s * 0.34], [5.08, 4.1, 1.5 + s * 0.34]], mats.stripeA, 0.03);
  for (const s of [1, -1]) {
    mg.add(new THREE.CylinderGeometry(wr + 0.15, wr + 0.15, tw + 0.25, 28, 1, true, -Math.PI / 2 + 0.1, Math.PI * 0.7).rotateX(-Math.PI / 2), mats.paint, { at: [2.6, wr, s * fz] });
  }
  powerUnit(ctx, mg, [3.4, 4.3, 1.3], 0.8, { packAt: [3.4, 4.6, 1.9], packSize: [1.2, 0.5, 0.8] });
  mg.flush(root, 'body');
  emblem(root, 'emblem_front', 0.3, [4.97, 2.95, 0], 1);
  const cab = machineCab(root, { at: [3.85, 3.1, -1.75], w: 1.5, d: 1.7, h: 1.75, style: T.style, vintage: T.vintage, mats, wheel: true });
  cabRoof(ctx, cab, { front: 2, rear: 0, beacon: true });
  for (const s of [1, -1]) {
    for (const z of [1.7, 2.3]) lamps.head.add(root, { at: [5.0, 3.0 + 0.0 - 0.0 - 0.2, s * z], normal: [1, 0, 0], w: 0.3, h: 0.2 });
    lamps.work.add(root, { at: [4.95, 3.3, s * 2.6], normal: [1, 0, 0], w: 0.22, h: 0.15, depth: 0.06 });
  }
  for (const s of [1, -1]) {
    const lm = new Merge();
    for (const z of [1.7, 2.3]) lm.box(0.1, 0.32, 0.44, mats.dark, { at: [4.95, 2.8, s * z], r: 0.03 });
    lm.box(0.4, 0.1, 1.2, mats.dark, { at: [4.75, 2.98, s * 2.0], r: 0.02 });
    lm.flush(root, 'lamp_bracket');
  }
  rearCluster(ctx, root, -4.42, 1.6, 0.5);
  // dump body with canopy over the cab
  const body = group('dump_body', { parent: root, at: [-3.6, 2.8, 0] });
  { const hb = new Merge(); for (const s of [1, -1]) hb.box(0.5, 0.85, 0.3, mats.paint, { at: [-3.6, 2.4, s * 0.6], r: 0.04 }); hb.flush(root, 'hinge_brackets'); }
  const bm = new Merge();
  const bl = 9.2;
  // hollow tub: V-floor rising to the open tail; the front wall stands BEHIND the cab (cab rear at
  // x≈2.9 → body x 6.5) and the canopy cantilevers forward over the cab roof (cab top 4.95 → canopy 5.2)
  const fw = 6.25; // front wall (body space)
  const top = 2.3; // side top at the front wall
  const cy = 2.45; // canopy underside
  const mdFloor = [[-1.15, 0.6], [-0.4, 0.0], [fw - 0.15, 0.35], [fw, top]];
  hollowTub(bm, mats.paint, { outline: [...mdFloor, [fw, top + 0.1], [-0.6, 2.05], [-1.15, 1.45]], strips: [[mdFloor.slice(0, 3), 1, true], [mdFloor.slice(2), 1]], w: 6.0, t: 0.1, vee: 0.1 });
  const cl = bl - 0.4 - fw; // canopy length
  bm.add(roundedBox(cl + 0.2, 0.14, 6.0, 0.05, 2), mats.paint, { at: [fw - 0.1 + (cl + 0.2) / 2, cy + 0.07, 0] }); // canopy deck
  for (const s of [1, -1]) {
    bm.box(cl, 0.3, 0.12, mats.paint, { at: [fw + cl / 2, cy - 0.01, s * 2.94], r: 0.03 }); // canopy side skirt
    bm.pipe([[-1.15, 1.45, s * 2.97], [-0.6, 2.05, s * 2.97], [fw, top + 0.1, s * 2.97]], 0.09, mats.paint, 8, 8);
    // gusset tying the canopy to the front wall
    bm.add(profile([[fw - 0.05, top - 0.9], [fw - 0.05, cy + 0.02], [fw + 1.2, cy + 0.02]], 0.12, 0.02), mats.paint, { at: [0, 0, s * 2.85] });
  }
  for (let z = -2.4; z <= 2.4; z += 1.2) bm.box(cl, 0.18, 0.1, mats.paint, { at: [fw + cl / 2, cy - 0.08, z], r: 0.02 });
  for (const s of [1, -1]) for (let x = 0.2; x < fw - 0.3; x += 1.0) bm.box(0.15, 1.75, 0.08, mats.paint, { at: [x, 1.0 + x * 0.02, s * 3.03], r: 0.02 });
  bm.add(roundedBox(bl - 2.0, 0.3, 1.5, 0.06, 2), mats.steel, { at: [(bl - 2.0) / 2 - 0.3, -0.08, 0] });
  bm.add(new THREE.CylinderGeometry(0.18, 0.18, 1.5, 16).rotateX(Math.PI / 2), mats.steel);
  bm.flush(body, 'dump_body_shell');
  const rams = [];
  for (const s of [1, -1]) rams.push(makeRam(root, `hoist_${s > 0 ? 'R' : 'L'}`, [1.0, 1.4, s * 1.0], anchor(body, [4.0, -0.1, s * 1.0]), { r: 0.18, mats }));
  ctx.anims.push(poseClip('tip', 10, [body], rams, (t) => { body.rotation.z = -cycle(t, 0.25) * 0.85; }, 40));
  const f = addHeavyWheels(root, [['wheel_FL', 2.6, fz, true], ['wheel_FR', 2.6, -fz, true]], { radius: wr, width: tw, style: 'otr', rimMat: mats.rimPaint });
  const r = addHeavyWheels(root, [['wheel_RL', -2.4, rz, false, true], ['wheel_RR', -2.4, -rz, false, true]], { radius: wr, width: tw, style: 'otr', rimMat: mats.rimPaint });
  finishWheeled(ctx, { spins: [...f.spins, ...r.spins], steers: f.steers, radius: wr, speed: 4, steerMax: 0.45 });
}

/* ------------------------------------------------------------------ */
/* All-terrain mobile crane                                             */
/* ------------------------------------------------------------------ */

function mobileCrane(ctx) {
  const { root, mats, lamps, T } = ctx;
  const wr = 0.62;
  const tz = 1.04;
  const axles = [3.9, 2.25, -1.7, -3.35];
  const mg = new Merge();
  mg.add(roundedBox(11.6, 0.65, 2.3, 0.1, 3), mats.paint, { at: [-0.05, 1.18, 0] });
  mg.add(roundedBox(11.4, 0.08, 2.5, 0.03, 2), mats.dark, { at: [-0.05, 1.54, 0] });
  for (const x of axles) {
    mg.add(new THREE.CylinderGeometry(0.08, 0.08, 2 * tz, 14).rotateX(Math.PI / 2), mats.iron, { at: [x, wr, 0] });
    mg.box(0.45, 0.86 - wr + 0.12, 0.7, mats.iron, { at: [x, (0.86 + wr) / 2 + 0.04, 0], r: 0.04 });
    for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(wr + 0.08, wr + 0.08, 0.5, 24, 1, true, -Math.PI / 2 + 0.05, Math.PI * 0.9).rotateX(-Math.PI / 2), mats.dark, { at: [x, wr, s * tz] });
  }
  // outrigger boxes front + rear
  for (const x of [5.0, -5.3]) mg.add(roundedBox(0.6, 0.5, 2.5, 0.06, 2), mats.paint, { at: [x, 1.05, 0] });
  // front: bumper + low carrier cab on the left
  mg.add(roundedBox(0.4, 0.5, 2.5, 0.1, 2), mats.dark, { at: [5.95, 0.9, 0] });
  mg.add(profile([[4.6, 1.5], [6.0, 1.5], [6.15, 1.95], [5.9, 2.2], [4.6, 2.2]], 1.2, 0.06), mats.paint, { at: [0, 0, 0.6] }); // engine/hood on the right
  powerUnit(ctx, mg, [-4.6, 1.55, -0.9], 0.6, { packAt: [-4.6, 1.85, 0.6], packSize: [1.0, 0.5, 0.8] });
  mg.flush(root, 'carrier');
  emblem(root, 'emblem_front', 0.14, [6.16, 0.95, 0], 1);
  const ccab = machineCab(root, { at: [5.3, 1.0, -0.62], w: 1.1, d: 1.5, h: 1.9, style: T.style === 'canopy' ? 'cab' : T.style, vintage: T.vintage, mats, wheel: true, name: 'carrier_cab' });
  cabRoof(ctx, ccab, { front: 0, rear: 0, beacon: true, head: false });
  frontLamps(ctx, root, 6.16, 1.0, 1.0, { w: 0.22, h: 0.1 });
  rearCluster(ctx, root, -5.86, 1.05, 1.0);
  // outrigger beams (extend sideways) with jacks
  const beams = [];
  for (const x of [5.0, -5.3]) for (const s of [1, -1]) {
    const b = group(`outrigger_${x > 0 ? 'F' : 'R'}${s > 0 ? 'R' : 'L'}`, { parent: root, at: [x, 1.05, s * 0.9] });
    const om = new Merge();
    om.add(roundedBox(0.42, 0.36, 0.9, 0.05, 2), mats.paint, { at: [0, 0, s * 0.4] });
    om.add(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 14), mats.paint, { at: [0, -0.3, s * 0.82] });
    om.add(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 20), mats.iron, { at: [0, -0.72, s * 0.82] });
    om.flush(b, `${b.name}_body`);
    beams.push({ b, s });
  }
  ctx.anims.push(clip('outriggers', 6, beams.map(({ b, s }) => new THREE.VectorKeyframeTrack(`${b.name}.position`, [0, 2, 4, 6], [b.position.x, 1.05, s * 0.9, b.position.x, 1.05, s * 2.3, b.position.x, 1.05, s * 2.3, b.position.x, 1.05, s * 0.9]))));
  // superstructure
  const up = group('upper', { parent: root, at: [-2.2, 1.58, 0] });
  const um = new Merge();
  um.add(new THREE.CylinderGeometry(1.0, 1.05, 0.2, 40), mats.iron, { at: [0, 0.1, 0] });
  um.add(roundedBox(3.4, 0.5, 2.2, 0.08, 2), mats.paint, { at: [-0.4, 0.45, 0] });
  um.add(roundedBox(1.1, 1.2, 2.4, 0.1, 3), mats.dark, { at: [-1.9, 1.0, 0] }); // counterweight
  for (let k = 0; k < 3; k++) um.box(1.12, 0.03, 2.42, mats.paint, { at: [-1.9, 0.6 + k * 0.4, 0], r: 0.008 });
  for (const s of [1, -1]) um.add(profile([[-1.0, 0.7], [0.2, 0.7], [-0.6, 1.7], [-1.25, 1.7]], 0.14, 0.03), mats.paint, { at: [0, 0, s * 0.42] });
  um.flush(up, 'upper_body');
  const cab = machineCab(up, { at: [0.6, 0.7, -0.95], w: 0.9, d: 1.5, h: 1.55, style: 'cab', vintage: T.vintage, mats, name: 'crane_cab' });
  void cab;
  // boom (4 sections) pivoting on the upper
  const boom = group('boom', { parent: up, at: [-1.0, 1.55, 0] });
  boom.rotation.z = -0.045;
  const sections = [];
  const sec = [[9.4, 0.78, 0.6], [8.6, 0.64, 0.5], [8.0, 0.52, 0.4], [7.4, 0.42, 0.32]];
  let parent = boom;
  sec.forEach(([len, h, w], i) => {
    const s = i === 0 ? boom : group(`boom_s${i}`, { parent, at: [i === 1 ? 0.8 : 0.4, 0, 0] });
    const sm = new Merge();
    sm.add(roundedBox(len, h, w, Math.min(0.1, h * 0.2), 2), i % 2 ? mats.paint : mats.paint, { at: [len / 2 + (i === 0 ? -0.4 : 0), 0, 0] });
    if (i === 0) sm.add(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 16).rotateX(Math.PI / 2), mats.steel);
    if (i === 3) {
      for (const z of [-0.1, 0.1]) sm.add(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 20).rotateX(Math.PI / 2), mats.steel, { at: [len - 0.05, 0, z] });
    }
    sm.flush(s, `${s.name}_body`);
    if (i > 0) sections.push(s);
    parent = s;
  });
  const tip = sections[2];
  const hookCable = group('hook_cable', { parent: tip, at: [7.35, -0.1, 0] });
  const hm = new Merge();
  hm.add(new THREE.CylinderGeometry(0.012, 0.012, 1, 6).translate(0, -0.5, 0), mats.steel);
  hm.flush(hookCable, 'hook_cable_line');
  hookCable.scale.y = 0.35;
  const hook = group('hook_block', { parent: tip, at: [7.35, -0.55, 0] });
  const hbm = new Merge();
  hbm.add(roundedBox(0.3, 0.5, 0.35, 0.06, 2), mats.stripeA ?? mats.paint, { at: [0, -0.1, 0] });
  hbm.add(new THREE.TorusGeometry(0.12, 0.035, 8, 18, Math.PI * 1.5), mats.iron, { at: [0, -0.5, 0] });
  hbm.flush(hook, 'hook_block_body');
  // boom rest on the carrier front
  const rest = new Merge();
  rest.box(0.3, 1.25, 0.3, mats.paint, { at: [3.3, 2.15, 0], r: 0.03 });
  rest.box(0.4, 0.12, 0.9, mats.paint, { at: [3.3, 2.82, 0], r: 0.02 });
  rest.flush(root, 'boom_rest');
  const ram = makeRam(up, 'luff_ram', [0.4, 0.7, 0], anchor(boom, [3.2, -0.42, 0]), { r: 0.17, mats: { ...mats, paint: mats.steel } });
  ctx.anims.push(poseClip('boom', 14, [boom], [ram], (t) => { boom.rotation.z = -0.045 + cycle(t, 0.35) * 1.1; }, 48, { movers: sections }));
  // telescope during the 'boom' clip: rewrite mover tracks
  const boomClip = ctx.anims[ctx.anims.length - 1];
  boomClip.tracks = boomClip.tracks.filter((tr) => !/boom_s\d\.position/.test(tr.name));
  const T14 = [0, 3, 5, 9, 11, 14];
  sections.forEach((s, i) => {
    const x0 = s.position.x;
    const ext = [0, 0, 6.5, 6.5, 0, 0].map((e) => x0 + e * (i === 0 ? 1 : 1));
    boomClip.tracks.push(new THREE.VectorKeyframeTrack(`${s.name}.position`, T14, ext.flatMap((x) => [x, 0, 0])));
  });
  ctx.anims.push(poseClip('swing', 20, [up], [ram], (t) => { up.rotation.y = Math.sin(t * Math.PI * 2) * Math.PI; }, 40));
  ctx.anims.push(clip('hook', 6, [
    new THREE.VectorKeyframeTrack('hook_cable.scale', [0, 3, 6], [1, 0.35, 1, 1, 2.2, 1, 1, 0.35, 1]),
    new THREE.VectorKeyframeTrack('hook_block.position', [0, 3, 6], [7.35, -0.55, 0, 7.35, -2.4, 0, 7.35, -0.55, 0]),
  ]));
  const { spins, steers } = addHeavyWheels(root, axles.flatMap((x, i) => [[`wheel_${i}L`, x, tz, i < 2], [`wheel_${i}R`, x, -tz, i < 2]]), { radius: wr, width: 0.45, style: 'truck', rimMat: M.metal('#c9ccd1', 0.35) });
  void lamps;
  finishWheeled(ctx, { spins, steers, radius: wr, speed: 5, steerMax: 0.4 });
}

/* ------------------------------------------------------------------ */
/* Tower crane                                                          */
/* ------------------------------------------------------------------ */

function lattice(mg, { x0, x1, w, h, mat, step = 2, axis = 'y', tri = false }) {
  // a lattice along an axis; for 'y' (mast) square w×w; for 'x' (jib) w wide, h tall (tri = triangular)
  const tubes = [];
  if (axis === 'y') {
    const c = [[-w / 2, -w / 2], [w / 2, -w / 2], [w / 2, w / 2], [-w / 2, w / 2]];
    for (const [x, z] of c) tubes.push([[x, x0, z], [x, x1, z], 0.06]);
    for (let y = x0; y < x1 - 1e-6; y += step) {
      const y2 = Math.min(x1, y + step);
      for (let i = 0; i < 4; i++) {
        const a = c[i];
        const b = c[(i + 1) % 4];
        tubes.push([[a[0], y, a[1]], [b[0], y, b[1]], 0.03]);
        tubes.push([[a[0], y, a[1]], [b[0], y2, b[1]], 0.025]);
      }
    }
  } else {
    const chords = tri ? [[0, h, 0], [0, 0, -w / 2], [0, 0, w / 2]] : [[0, 0, -w / 2], [0, 0, w / 2], [0, h, -w / 2], [0, h, w / 2]];
    for (const [, y, z] of chords) tubes.push([[x0, y, z], [x1, y, z], 0.05]);
    for (let x = x0; x < x1 - 1e-6; x += step) {
      const xn = Math.min(x1, x + step);
      for (let i = 0; i < chords.length; i++) {
        const a = chords[i];
        const b = chords[(i + 1) % chords.length];
        tubes.push([[x, a[1], a[2]], [x, b[1], b[2]], 0.025]);
        tubes.push([[x, a[1], a[2]], [xn, b[1], b[2]], 0.022]);
      }
    }
  }
  for (const [a, b, r] of tubes) mg.tube(a, b, r, mat, 6);
}

function towerCrane(ctx) {
  const { root, mats, trim } = ctx;
  const red = M.paint(ctx.o.color ?? '#f2c200', { metallic: 0.2, roughness: 0.45 });
  const Hm = trim === 'tall' ? 40 : trim === 'short' ? 12 : 24;
  const jibL = trim === 'compact' ? 14 : 30;
  const flat = trim === 'flat-top';
  const luff = trim === 'luffing';
  const mg = new Merge();
  mg.add(roundedBox(6, 1.0, 6, 0.08, 2), M.matte('#9a9a96', 0.9), { at: [0, 0.5, 0] });
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]]) mg.box(0.4, 0.3, 0.4, mats.iron, { at: [x, 1.15, z], r: 0.03 });
  lattice(mg, { x0: 1.0, x1: Hm, w: 1.6, mat: red, axis: 'y' });
  // climbing ladder inside the mast
  for (let y = 1.2; y < Hm - 0.3; y += 0.3) mg.tube([0.5, y, -0.2], [0.5, y, 0.2], 0.012, mats.steel, 6);
  for (const z of [-0.2, 0.2]) mg.tube([0.5, 1.2, z], [0.5, Hm - 0.3, z], 0.015, mats.steel, 6);
  mg.add(roundedBox(2.2, 0.4, 2.2, 0.05, 2), red, { at: [0, Hm + 0.2, 0] });
  mg.flush(root, 'mast');
  const slew = group('slew', { parent: root, at: [0, Hm + 0.4, 0] });
  const sm = new Merge();
  sm.add(new THREE.CylinderGeometry(1.0, 1.0, 0.3, 32), mats.iron, { at: [0, 0.15, 0] });
  sm.add(roundedBox(2.0, 1.2, 2.0, 0.06, 2), red, { at: [0, 0.9, 0] });
  // counter-jib with ballast + winch
  const cj = luff ? 7 : 10;
  lattice(sm, { x0: -cj, x1: -0.9, w: 1.6, h: 0.6, mat: red, axis: 'x', step: 2 });
  sm.box(cj - 0.9, 0.05, 1.5, M.metal('#8b8f94', 0.5), { at: [-(cj + 0.9) / 2, 0.62, 0] });
  for (let k = 0; k < 4; k++) sm.add(roundedBox(0.5, 1.8, 1.7, 0.04, 2), M.matte('#a5a5a0', 0.9), { at: [-cj + 0.35 + k * 0.52, -0.55, 0] });
  sm.add(roundedBox(1.4, 0.8, 1.2, 0.06, 2), mats.dark, { at: [-cj + 3.2, 1.05, 0] });
  if (luff) {
    sm.add(roundedBox(1.0, 5.0, 1.0, 0.06, 2), red, { at: [-0.4, 3.5, 0] }); // A-frame post for the luffing ropes
  } else if (!flat) {
    // tower top (peak) with pendant ties
    for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]]) sm.tube([x, 1.5, z], [0, 7.5, 0], 0.07, red, 8);
    sm.box(0.32, 0.12, 0.32, red, { at: [0, 7.5, 0], r: 0.02 });
    for (const s of [1, -1]) {
      sm.tube([0, 7.5, 0], [jibL * 0.66, 1.5 + 1.4, s * 0.0], 0.03, mats.steel, 6);
      sm.tube([0, 7.5, 0], [-cj + 0.2, 1.1, s * 0.6], 0.03, mats.steel, 6);
    }
  }
  sm.flush(slew, 'slew_body');
  // operator cab beside the jib root
  machineCab(slew, { at: [0.6, 0.3, 1.45], w: 1.2, d: 1.6, h: 2.0, style: 'cab', mats, frontRake: 0.12, name: 'crane_cab' });
  // jib
  const jib = group('jib', { parent: slew, at: [0.9, 1.5, 0] });
  if (luff) jib.rotation.z = 0.9;
  const jm = new Merge();
  lattice(jm, { x0: 0, x1: jibL, w: 1.2, h: flat ? 1.8 : 1.4, mat: red, axis: 'x', tri: true, step: 2 });
  jm.add(roundedBox(0.3, 0.3, 1.3, 0.04, 2), red, { at: [jibL, 0.15, 0] });
  jm.flush(jib, 'jib_body');
  const av = lampGroup('aviation', 'red');
  av.add(jib, { at: [jibL + 0.16, 0.3, 0], normal: [1, 0, 0], w: 0.12, h: 0.12, shape: 'round' });
  if (!flat && !luff) av.add(slew, { at: [0, 7.565, 0], normal: [0, 1, 0], w: 0.12, h: 0.12, shape: 'round' });
  av.add(slew, { at: [-cj - 0.02, 0.6, 0], normal: [-1, 0, 0], w: 0.12, h: 0.12, shape: 'round' });
  ctx.lamps.work.add(slew, { at: [1.45, 2.4, 1.45], normal: [1, -0.3, 0], w: 0.15, h: 0.1, depth: 0.05 });
  // trolley + hook (hammerhead / flat-top) or hook at the tip (luffing)
  const trolley = group('trolley', { parent: jib, at: [luff ? jibL : jibL * 0.55, 0, 0] });
  const tm = new Merge();
  tm.add(roundedBox(1.0, 0.3, 1.0, 0.04, 2), mats.dark, { at: [0, -0.1, 0] });
  tm.flush(trolley, 'trolley_body');
  const cable = group('hook_cable', { parent: trolley, at: [0, -0.25, 0] });
  const cm = new Merge();
  for (const z of [-0.12, 0.12]) cm.add(new THREE.CylinderGeometry(0.01, 0.01, 1, 6).translate(0, -0.5, z), mats.steel);
  cm.flush(cable, 'hook_cable_line');
  const drop = luff ? Hm * 0.7 : Hm * 0.55;
  cable.scale.y = drop;
  const hook = group('hook_block', { parent: trolley, at: [0, -0.25 - drop, 0] });
  const hm = new Merge();
  hm.add(roundedBox(0.4, 0.6, 0.3, 0.06, 2), M.paint('#f2c200'), { at: [0, -0.2, 0] });
  hm.add(new THREE.TorusGeometry(0.15, 0.04, 8, 18, Math.PI * 1.5), mats.iron, { at: [0, -0.68, 0] });
  hm.flush(hook, 'hook_block_body');
  hook.userData.detached = false;
  ctx.anims.push(poseClip('slew', 40, [slew], [], (t) => { slew.rotation.y = t * Math.PI * 2; }, 32));
  const tx = trolley.position.x;
  const hy = hook.position.y;
  if (!luff) {
    ctx.anims.push(clip('trolley', 12, [
      new THREE.VectorKeyframeTrack('trolley.position', [0, 4, 8, 12], [tx, 0, 0, jibL * 0.92, 0, 0, jibL * 0.2, 0, 0, tx, 0, 0]),
    ]));
  } else {
    ctx.anims.push(poseClip('luff', 12, [jib], [], (t) => { jib.rotation.z = 0.9 - cycle(t, 0.3) * 0.6; }, 32));
  }
  ctx.anims.push(clip('hook', 8, [
    new THREE.VectorKeyframeTrack('hook_cable.scale', [0, 4, 8], [1, drop, 1, 1, drop * 0.3, 1, 1, drop, 1]),
    new THREE.VectorKeyframeTrack('hook_block.position', [0, 4, 8], [0, hy, 0, 0, -0.25 - drop * 0.3, 0, 0, hy, 0]),
  ]));
  ctx.anims.push(clip('aviation', 1.5, lampTracks('aviation', LAMP_ON.red * 1.3, { blink: 1 / 1.5 })));
  ctx.anims.push(clip('lights', 1, lampTracks('worklights', LAMP_ON.white)));
}

/* ------------------------------------------------------------------ */
/* Rollers                                                              */
/* ------------------------------------------------------------------ */

function drum(name, r, w, mats, padfoot = false) {
  const g = group(name);
  const dm = new Merge();
  dm.add(lathe([[0.001, -w / 2], [r * 0.96, -w / 2], [r, -w / 2 + 0.03], [r, w / 2 - 0.03], [r * 0.96, w / 2], [0.001, w / 2]], 40).rotateX(Math.PI / 2), M.metal('#5a5d61', 0.45));
  for (const s of [1, -1]) dm.add(new THREE.TorusGeometry(r * 0.55, 0.04, 8, 32), mats.dark, { at: [0, 0, s * (w / 2 + 0.005)] });
  if (padfoot) {
    const n = 18;
    for (let row = 0; row < Math.round(w / 0.2); row++) for (let i = 0; i < n; i++) {
      const a = ((i + (row % 2) * 0.5) / n) * Math.PI * 2;
      dm.box(0.1, 0.12, 0.1, M.metal('#5a5d61', 0.45), { at: [Math.cos(a) * (r + 0.05), Math.sin(a) * (r + 0.05), -w / 2 + 0.1 + row * 0.2], rot: [0, 0, a + Math.PI / 2], r: 0.015 });
    }
  }
  dm.flush(g, `${name}_shell`);
  return g;
}

function roadRoller(ctx) {
  const { root, mats, T } = ctx;
  const dr = 0.76;
  const dw = 2.13;
  const front = group('front_frame', { parent: root, at: [0.6, 0, 0] });
  const fm = new Merge();
  for (const s of [1, -1]) fm.add(profile([[0.5, 0.35], [1.75, 0.35], [1.95, 1.0], [1.4, 1.62], [0.4, 1.4], [0.1, 0.95]], 0.12, 0.03), mats.paint, { at: [0, 0, s * (dw / 2 + 0.1)] });
  fm.add(roundedBox(1.6, 0.25, dw + 0.32, 0.06, 2), mats.paint, { at: [0.95, 1.5, 0] });
  fm.add(roundedBox(0.5, 0.6, 0.9, 0.06, 2), mats.iron, { at: [0.0, 0.95, 0] });
  fm.box(0.06, 0.1, dw + 0.3, mats.dark, { at: [1.8, 0.38, 0], r: 0.01 }); // scraper bar bolted between the side plates, wiping the drum
  fm.flush(front, 'front_body');
  const d = drum('drum', dr, dw, mats, T.mining || T.demo);
  d.position.set(1.15, dr, 0);
  front.add(d);
  frontLamps(ctx, front, 1.75, 1.66, 0.9, { w: 0.12, h: 0.09 });
  for (const s of [1, -1]) {
    const lm = new Merge();
    lm.box(0.12, 0.12, 0.2, mats.dark, { at: [1.72, 1.66, s * 0.9], r: 0.02 });
    lm.flush(front, 'lamp_bracket');
  }
  const mg = new Merge();
  mg.add(roundedBox(0.4, 0.6, 0.9, 0.06, 2), mats.iron, { at: [0.25, 0.95, 0] });
  mg.add(profile([[0.3, 0.75], [-2.55, 0.75], [-2.7, 1.55], [-2.45, 1.85], [-0.6, 1.85], [0.3, 1.55]], 1.6, 0.08), mats.paint);
  mg.add(roundedBox(0.8, 0.12, 1.9, 0.04, 2), mats.dark, { at: [-0.1, 1.6, 0] }); // operator platform
  mg.add(new THREE.CylinderGeometry(0.08, 0.08, 1.7, 14).rotateX(Math.PI / 2), mats.iron, { at: [-1.6, 0.75, 0] });
  mg.box(0.4, 0.2, 0.9, mats.iron, { at: [-1.6, 0.8, 0], r: 0.03 });
  for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.85, 0.85, 0.66, 24, 1, true, -Math.PI / 2 + 0.1, Math.PI * 0.8).rotateX(-Math.PI / 2), mats.paint, { at: [-1.6, 0.75, s * 0.85] });
  for (const s of [1, -1]) for (let k = 0; k < 4; k++) mg.box(1.2, 0.02, 0.012, mats.dark, { at: [-1.6, 1.15 + k * 0.12, s * 0.806], r: 0.004 });
  powerUnit(ctx, mg, [-1.2, 1.85, 0.5], 0.5, { packAt: [-1.8, 2.05, -0.2], packSize: [0.8, 0.4, 0.6] });
  mg.flush(root, 'body');
  emblem(root, 'emblem_rear', 0.1, [-2.71, 1.45, 0], -1);
  const cab = machineCab(root, { at: [-0.15, 1.66, 0], w: 1.5, d: 1.3, h: 1.3, style: T.style === 'cab' ? 'canopy' : T.style, vintage: T.vintage, mats, wheel: true, frontRake: 0 });
  cabRoof(ctx, cab, { front: 2, rear: 1 });
  rearCluster(ctx, root, -2.7, 1.25, 0.6);
  const { spins } = addHeavyWheels(root, [['wheel_RL', -1.6, 0.85], ['wheel_RR', -1.6, -0.85]], { radius: 0.75, width: 0.6, style: T.mining ? 'lug' : 'truck', rimMat: mats.rimPaint });
  spins.push(d);
  finishWheeled(ctx, { spins, steers: [front], radius: dr, speed: 2, steerMax: 0.5 });
}

function tandemRoller(ctx) {
  const { root, mats, T } = ctx;
  const dr = 0.6;
  const dw = 1.5;
  const front = group('front_frame', { parent: root, at: [0.25, 0, 0] });
  const fm = new Merge();
  for (const s of [1, -1]) fm.add(profile([[0.2, 0.3], [1.4, 0.3], [1.55, 0.9], [0.0, 1.05], [-0.1, 0.7]], 0.1, 0.02), mats.paint, { at: [0, 0, s * (dw / 2 + 0.08)] });
  fm.add(roundedBox(1.3, 0.55, dw + 0.25, 0.12, 3), mats.paint, { at: [0.95, 1.2, 0] }); // water tank
  fm.add(roundedBox(0.3, 0.4, 0.6, 0.05, 2), mats.iron, { at: [0.0, 0.8, 0] });
  fm.flush(front, 'front_body');
  const d1 = drum('drum_front', dr, dw, mats);
  d1.position.set(1.05, dr, 0);
  front.add(d1);
  frontLamps(ctx, front, 1.6, 1.25, 0.55, { w: 0.12, h: 0.08 });
  const mg = new Merge();
  for (const s of [1, -1]) mg.add(profile([[0.2, 0.3], [-1.6, 0.3], [-1.75, 0.9], [-0.2, 1.05], [0.25, 0.7]], 0.1, 0.02), mats.paint, { at: [0, 0, s * (dw / 2 + 0.08)] });
  mg.add(roundedBox(1.5, 0.75, 1.3, 0.12, 3), mats.paint, { at: [-1.2, 1.35, 0] }); // engine + rear tank
  mg.add(roundedBox(0.3, 0.4, 0.6, 0.05, 2), mats.iron, { at: [0.3, 0.8, 0] });
  mg.add(roundedBox(1.2, 0.9, 1.1, 0.1, 3), mats.paint, { at: [-0.1, 1.35, 0] }); // centre column
  mg.add(roundedBox(1.0, 0.1, 1.6, 0.03, 2), mats.dark, { at: [-0.1, 1.85, 0] });
  powerUnit(ctx, mg, [-1.6, 1.72, 0.4], 0.35, { packAt: [-1.2, 1.9, -0.2], packSize: [0.6, 0.3, 0.5] });
  mg.flush(root, 'body');
  const d2 = drum('drum_rear', dr, dw, mats);
  d2.position.set(-1.2, dr, 0);
  root.add(d2);
  const cab = machineCab(root, { at: [-0.1, 1.9, 0], w: 1.4, d: 1.2, h: 1.25, style: T.style === 'cab' ? 'canopy' : T.style, vintage: T.vintage, mats, wheel: true, frontRake: 0 });
  cabRoof(ctx, cab, { front: 2, rear: 1 });
  rearCluster(ctx, root, -1.95, 1.3, 0.5, { reverse: false });
  finishWheeled(ctx, { spins: [d1, d2], steers: [front], radius: dr, speed: 2, steerMax: 0.4 });
}

/* ------------------------------------------------------------------ */
/* Motor grader                                                         */
/* ------------------------------------------------------------------ */

function motorGrader(ctx) {
  const { root, mats, T } = ctx;
  const fr = 0.66;
  const tz = 1.05;
  const mg = new Merge();
  // front gooseneck beam
  mg.add(profile([[3.85, 0.95], [3.85, 1.25], [2.8, 1.85], [-0.2, 1.75], [-0.2, 1.4], [2.7, 1.5], [3.5, 0.95]], 0.45, 0.06), mats.paint);
  mg.add(roundedBox(0.3, 0.3, 2 * tz - 0.4, 0.06, 2), mats.paint, { at: [3.75, fr, 0] }); // front axle beam
  mg.box(0.3, 0.95 - fr + 0.2, 0.3, mats.paint, { at: [3.75, (0.95 + fr) / 2 + 0.1, 0], r: 0.03 });
  mg.add(roundedBox(0.4, 0.4, 2.5, 0.08, 2), mats.dark, { at: [4.15, 0.9, 0] }); // push block
  // rear frame + engine
  mg.add(roundedBox(4.0, 0.5, 1.1, 0.08, 2), mats.paint, { at: [-1.9, 1.15, 0] });
  mg.add(profile([[-1.3, 1.35], [-3.75, 1.35], [-3.85, 2.1], [-3.6, 2.35], [-1.3, 2.35]], 1.6, 0.08), mats.paint);
  mg.add(roundedBox(0.06, 0.8, 1.3, 0.02, 2), mats.dark, { at: [-3.86, 1.85, 0] });
  for (const s of [1, -1]) {
    mg.add(roundedBox(1.85, 0.45, 0.3, 0.1, 3), mats.paint, { at: [-2.7, fr, s * 0.75] }); // tandem cases
    mg.box(0.3, 1.15 - fr, 0.3, mats.paint, { at: [-2.7, (1.15 + fr) / 2, s * 0.6], r: 0.03 });
    mg.add(new THREE.CylinderGeometry(0.08, 0.08, tz - 0.75, 12).rotateX(Math.PI / 2), mats.iron, { at: [-2.0, fr, s * (0.75 + (tz - 0.75) / 2)] });
    mg.add(new THREE.CylinderGeometry(0.08, 0.08, tz - 0.75, 12).rotateX(Math.PI / 2), mats.iron, { at: [-3.4, fr, s * (0.75 + (tz - 0.75) / 2)] });
    for (const x of [-2.0, -3.4]) mg.add(new THREE.CylinderGeometry(fr + 0.08, fr + 0.08, 0.5, 20, 1, true, -Math.PI / 2 - 0.2, Math.PI * 0.75).rotateX(-Math.PI / 2), mats.paint, { at: [x, fr, s * tz] });
  }
  powerUnit(ctx, mg, [-2.0, 2.35, 0.45], 0.55, { packAt: [-2.8, 2.6, -0.2], packSize: [1.0, 0.45, 0.7] });
  if (T.mining || T.demo) {
    // rear ripper
    mg.add(roundedBox(0.3, 0.3, 1.6, 0.05, 2), mats.paint, { at: [-4.25, 0.9, 0] });
    for (const z of [-0.5, 0, 0.5]) mg.add(profile([[-0.06, 0.1], [0.06, 0.1], [0.1, -0.5], [0.0, -0.6], [-0.06, -0.45]], 0.08, 0.012), mats.dark, { at: [-4.25, 0.75, z] });
    mg.box(0.3, 0.2, 0.3, mats.paint, { at: [-4.0, 1.0, 0], r: 0.03 });
  }
  mg.flush(root, 'body');
  emblem(root, 'emblem_rear', 0.12, [-3.87, 2.15, 0], -1);
  const cab = machineCab(root, { at: [-0.75, 1.4, 0], w: 1.6, d: 1.4, h: 1.95, style: T.style, vintage: T.vintage, mats, wheel: true, frontRake: 0.05 });
  cabRoof(ctx, cab, { front: 2, rear: 2 });
  frontLamps(ctx, root, 4.36, 1.2, 1.0, { w: 0.14, h: 0.1 });
  for (const s of [1, -1]) {
    const lm = new Merge();
    lm.box(0.1, 0.25, 0.2, mats.dark, { at: [4.32, 1.15, s * 1.0], r: 0.02 });
    lm.flush(root, 'lamp_bracket');
  }
  rearCluster(ctx, root, -3.86, 1.2, 0.65);
  // drawbar + circle + moldboard (rotates)
  const circle = group('circle', { parent: root, at: [1.1, 0.75, 0] });
  const cm = new Merge();
  cm.add(new THREE.TorusGeometry(0.75, 0.07, 8, 40).rotateX(Math.PI / 2), mats.iron);
  for (let k = 0; k < 4; k++) cm.tube([Math.cos(k * 1.57) * 0.75, 0, Math.sin(k * 1.57) * 0.75], [0, 0.2, 0], 0.04, mats.paint, 8);
  cm.add(new THREE.CylinderGeometry(0.16, 0.16, 0.95, 14), mats.paint, { at: [0, 0.6, 0] });
  const bw = T.mining ? 4.3 : 3.7;
  const mold = new THREE.Shape();
  mold.moveTo(0, -0.42);
  mold.lineTo(0.12, -0.42);
  mold.quadraticCurveTo(-0.18, -0.1, 0.05, 0.3);
  mold.lineTo(-0.04, 0.3);
  mold.quadraticCurveTo(-0.3, -0.05, -0.08, -0.42);
  const blade = new THREE.ExtrudeGeometry(mold, { depth: bw, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 12 });
  blade.translate(0, 0.08, -bw / 2);
  cm.add(blade, mats.paint, { at: [0.1, -0.3, 0], rot: [0, 0.35, 0] });
  cm.box(0.08, 0.08, bw, mats.wear, { at: [0.2, -0.68, 0], rot: [0, 0.35, 0], r: 0.01 });
  cm.flush(circle, 'circle_body');
  // drawbar from the front of the beam to the circle
  const dbm = new Merge();
  dbm.tube([3.4, 1.0, 0], [1.2, 1.55, 0], 0.1, mats.paint, 10);
  dbm.flush(root, 'drawbar');
  const rams = [];
  for (const s of [1, -1]) rams.push(makeRam(root, `blade_lift_${s > 0 ? 'R' : 'L'}`, [1.8, 1.82, s * 0.32], anchor(circle, [0.0, 0.1, s * 0.75]), { r: 0.06, mats }));
  ctx.anims.push(poseClip('blade', 8, [circle], rams, (t) => { circle.rotation.y = Math.sin(t * Math.PI * 2) * 0.6; }, 40));
  const f = addHeavyWheels(root, [['wheel_FL', 3.75, tz, true], ['wheel_FR', 3.75, -tz, true]], { radius: fr, width: 0.42, style: 'otr', rimMat: mats.rimPaint });
  const r = addHeavyWheels(root, [['wheel_R0L', -2.0, tz], ['wheel_R0R', -2.0, -tz], ['wheel_R1L', -3.4, tz], ['wheel_R1R', -3.4, -tz]], { radius: fr, width: 0.42, style: 'otr', rimMat: mats.rimPaint });
  finishWheeled(ctx, { spins: [...f.spins, ...r.spins], steers: f.steers, radius: fr, speed: 4, steerMax: 0.5 });
}

/* ------------------------------------------------------------------ */
/* Asphalt paver                                                        */
/* ------------------------------------------------------------------ */

function asphaltPaver(ctx) {
  const { root, mats, T } = ctx;
  const L = trackAssembly(root, { name: 'track_L', x0: -1.05, x1: 1.1, y: 0.34, r: 0.32, ri: 0.3, z: -0.95, width: 0.33, pitch: 0.15, rollers: 4, shoes: 'rubber', mats, frameMat: mats.paint });
  const R = trackAssembly(root, { name: 'track_R', x0: -1.05, x1: 1.1, y: 0.34, r: 0.32, ri: 0.3, z: 0.95, width: 0.33, pitch: 0.15, rollers: 4, shoes: 'rubber', mats, frameMat: mats.paint });
  const mg = new Merge();
  mg.add(roundedBox(2.9, 0.9, 2.3, 0.1, 3), mats.paint, { at: [-0.35, 1.0, 0] });
  mg.add(roundedBox(1.3, 0.75, 2.0, 0.1, 3), mats.paint, { at: [-0.5, 1.8, 0] }); // engine hood
  mg.add(roundedBox(1.0, 0.5, 1.0, 0.06, 2), mats.dark, { at: [1.3, 0.55, 0] }); // conveyor tunnel
  mg.add(roundedBox(1.6, 0.12, 2.5, 0.04, 2), mats.dark, { at: [-1.25, 1.5, 0] }); // operator platform
  for (const s of [1, -1]) {
    mg.add(roundedBox(0.5, 0.7, 0.4, 0.06, 2), mats.dark, { at: [-1.6, 1.9, s * 0.85] }); // consoles
    mg.add(roundedBox(0.45, 0.1, 0.45, 0.04, 2), mats.seat, { at: [-1.25, 2.0, s * 0.6] });
    mg.add(roundedBox(0.1, 0.5, 0.45, 0.04, 2), mats.seat, { at: [-1.45, 2.25, s * 0.6] });
    mg.box(0.2, 0.5, 0.2, mats.dark, { at: [-1.25, 1.75, s * 0.6], r: 0.03 });
    mg.box(2.8, 0.16, 0.14, mats.paint, { at: [-1.0, 0.6, s * 1.22], r: 0.03 }); // tow arms
  }
  // auger + screed
  mg.add(new THREE.CylinderGeometry(0.2, 0.2, 2.8, 16).rotateX(Math.PI / 2), mats.steel, { at: [-1.75, 0.35, 0] });
  for (let k = -6; k <= 6; k++) mg.add(new THREE.TorusGeometry(0.2, 0.03, 6, 12).rotateY(0.4), mats.steel, { at: [-1.75, 0.35, k * 0.2] });
  mg.add(profile([[-2.0, 0.08], [-2.5, 0.08], [-2.55, 0.85], [-2.0, 0.85]], 3.0, 0.05), mats.paint);
  mg.add(roundedBox(0.5, 0.1, 3.2, 0.03, 2), mats.dark, { at: [-2.3, 0.9, 0] });
  for (const s of [1, -1]) mg.add(roundedBox(0.4, 0.75, 0.06, 0.02, 2), mats.paint, { at: [-1.9, 0.48, s * 1.5] });
  mg.box(0.6, 0.12, 2.6, mats.paint, { at: [-1.8, 0.66, 0], r: 0.02 });
  powerUnit(ctx, mg, [-0.4, 2.17, 0.55], 0.5, { packAt: [-0.6, 2.35, -0.3], packSize: [0.8, 0.35, 0.7] });
  mg.flush(root, 'body');
  emblem(root, 'emblem_front', 0.1, [0.16, 1.85, 0], 1);
  const cab = machineCab(root, { at: [-1.25, 1.56, 0], w: 2.3, d: 1.5, h: 1.6, style: T.style === 'cab' ? 'canopy' : T.style, vintage: T.vintage, mats, frontRake: 0 });
  cabRoof(ctx, cab, { front: 2, rear: 2 });
  // hopper with folding wings
  const hm = new Merge();
  hm.add(roundedBox(1.5, 0.12, 1.2, 0.03, 2), mats.dark, { at: [1.75, 0.82, 0] });
  hm.add(roundedBox(0.08, 0.6, 3.0, 0.03, 2), mats.paint, { at: [2.5, 1.1, 0] });
  hm.flush(root, 'hopper');
  const wings = [];
  for (const s of [1, -1]) {
    const w = group(`hopper_wing_${s > 0 ? 'R' : 'L'}`, { parent: root, at: [1.75, 0.82, s * 0.6] });
    const wm = new Merge();
    wm.add(roundedBox(1.5, 0.08, 0.95, 0.03, 2), mats.paint, { at: [0, 0, s * 0.47] });
    wm.add(roundedBox(1.5, 0.55, 0.08, 0.03, 2), mats.paint, { at: [0, 0.27, s * 0.92] });
    wm.flush(w, `${w.name}_body`);
    wings.push({ w, s });
  }
  ctx.anims.push(poseClip('hopper', 6, wings.map((x) => x.w), [], (t) => { wings.forEach(({ w, s }) => { w.rotation.x = -s * cycle(t, 0.3) * 1.1; }); }, 30));
  frontLamps(ctx, root, 2.54, 1.3, 1.25, { w: 0.12, h: 0.08 });
  finishCrawler(ctx, L, R, 0.4);
}

/* ------------------------------------------------------------------ */
/* Truck-mounted concrete pump                                          */
/* ------------------------------------------------------------------ */

function concretePump(ctx) {
  const { root, mats, lamps, T } = ctx;
  lamps.markers = lampGroup('markers', 'amber');
  lamps.markersRed = lampGroup('markers_red', 'red');
  const tm = { ...mats, trim: mats.dark, gloss: new THREE.MeshPhysicalMaterial({ color: '#0a0a0b', roughness: 0.15, clearcoat: 1 }), seam: new THREE.MeshBasicMaterial({ color: '#050505' }), roof: mats.paint, interior: new THREE.MeshStandardMaterial({ color: '#2a2b2d', roughness: 0.9, side: THREE.BackSide }), bumper: M.paint('#2b2d30', { metallic: 0.3, roughness: 0.45 }), decal: mats.decal, cargo: mats.paint, glass: mats.glass };
  const L = 10.6;
  const frontX = L / 2;
  const xf = frontX - 1.35;
  const wr = 0.52;
  const rear = [-2.4, -3.71];
  const W = 2.5;
  const cab = buildCabOver(root, { frontX, xf, wr, W, H: 3.05, mats: tm, lamps, trim: T.electric ? 'electric' : null });
  const mg = new Merge();
  const wz = W / 2 - 0.17;
  chassis(root, mg, { x0: -L / 2 + 0.1, x1: frontX - 0.22, axles: [{ x: xf, steer: true }, ...rear.map((x) => ({ x }))], wr, wz, mats: tm, gearX: xf - 1.0 });
  rearFenders(mg, rear, wz, wr, tm);
  tanks(mg, { x: xf - 1.6, side: 1, mats: tm, electric: T.electric, wz });
  rearEnd(root, mg, { x: -L / 2 + 0.05, W, mats: tm, lamps });
  // subframe, turret, hopper
  for (const z of [RAIL_Z, -RAIL_Z]) mg.box(L - 2.8, 0.2, 0.12, mats.paint, { at: [-1.1, RAIL_TOP + 0.1, z], r: 0.015 });
  mg.add(roundedBox(1.4, 0.8, 1.6, 0.08, 2), mats.paint, { at: [cab.back - 0.85, RAIL_TOP + 0.6, 0] });
  mg.add(new THREE.CylinderGeometry(0.6, 0.65, 0.3, 32), mats.iron, { at: [cab.back - 0.85, RAIL_TOP + 1.15, 0] });
  mg.add(roundedBox(1.3, 0.9, 1.6, 0.1, 2), mats.dark, { at: [-L / 2 + 0.9, RAIL_TOP + 0.35, 0] }); // hopper
  mg.add(roundedBox(1.4, 0.06, 1.7, 0.02, 2), mats.steel, { at: [-L / 2 + 0.9, RAIL_TOP + 0.82, 0] });
  for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.16, 0.16, 2.6, 16).rotateZ(Math.PI / 2), mats.steel, { at: [-L / 2 + 2.6, RAIL_TOP + 0.3, s * 0.25] }); // pumping cylinders
  mg.flush(root, 'chassis');
  // outrigger legs (swing out)
  const legs = [];
  for (const [x, s] of [[cab.back - 0.85, 1], [cab.back - 0.85, -1], [-2.0 - 1.0, 1], [-2.0 - 1.0, -1]]) {
    const g = group(`outrigger_${legs.length}`, { parent: root, at: [x, RAIL_TOP + 0.2, s * 0.6] });
    const lm = new Merge();
    lm.add(roundedBox(0.3, 0.3, 1.0, 0.05, 2), mats.paint, { at: [0, 0, s * 0.45] });
    lm.add(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 12), mats.paint, { at: [0, -0.45, s * 0.85] });
    lm.add(new THREE.CylinderGeometry(0.2, 0.22, 0.06, 16), mats.iron, { at: [0, -0.92, s * 0.85] });
    lm.flush(g, `${g.name}_body`);
    legs.push({ g, s, x });
  }
  ctx.anims.push(poseClip('outriggers', 6, legs.map((l) => l.g), [], (t) => { legs.forEach(({ g, s, x }) => { g.rotation.y = (x > 0 ? 1 : -1) * s * cycle(t, 0.4) * 0.9; }); }, 30));
  // Z-fold boom (4 sections) resting over the cab
  const turret = group('turret', { parent: root, at: [cab.back - 0.85, RAIL_TOP + 1.3, 0] });
  const trm = new Merge();
  trm.add(roundedBox(0.9, 0.9, 0.9, 0.08, 2), mats.paint, { at: [0, 0.45, 0] });
  trm.flush(turret, 'turret_body');
  const lens = [7.6, 7.0, 6.6, 5.4];
  const secs = [];
  let parent = turret;
  let at = [0.0, 0.85, 0];
  const rest = [0.05, Math.PI - 0.06, -(Math.PI - 0.06), Math.PI - 0.08];
  lens.forEach((len, i) => {
    const s = group(`boom_${i + 1}`, { parent, at });
    s.rotation.z = rest[i];
    const sm = new Merge();
    const h = 0.42 - i * 0.07;
    sm.add(roundedBox(len, h, 0.32 - i * 0.04, 0.05, 2), mats.paint, { at: [len / 2, 0, 0] });
    sm.add(new THREE.CylinderGeometry(h * 0.45, h * 0.45, 0.4, 14).rotateX(Math.PI / 2), mats.steel);
    sm.add(new THREE.CylinderGeometry(0.06, 0.06, len - 0.2, 12).rotateZ(Math.PI / 2), mats.steel, { at: [len / 2, h / 2 + 0.07, 0] }); // concrete line
    if (i === 3) sm.add(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 12, 1, true).translate(0, 0.8, 0), M.matte('#111', 0.7), { at: [len, 0, 0] });
    sm.flush(s, `boom_${i + 1}_body`);
    secs.push(s);
    parent = s;
    at = [len, 0, 0];
    // stack each folded section on top of the previous one
    if (i > 0) s.position.y = 0.0;
  });
  // offset folded sections vertically so they stack instead of intersecting
  secs[1].position.set(lens[0], 0, 0);
  const rams = [makeRam(turret, 'boom_ram', [0.3, 0.3, 0], anchor(secs[0], [2.0, -0.2, 0]), { r: 0.12, mats: { ...mats, paint: mats.steel } })];
  ctx.anims.push(poseClip('unfold', 16, [secs[0], secs[1], secs[2], secs[3], turret], rams, (t) => {
    const a = cycle(t, 0.35);
    secs[0].rotation.z = rest[0] + a * 1.1;
    secs[1].rotation.z = rest[1] - a * 2.7;
    secs[2].rotation.z = rest[2] + a * 2.9;
    secs[3].rotation.z = rest[3] - a * 2.6;
    turret.rotation.y = keys([[0, 0], [0.35, 0], [0.5, 0.8], [0.65, 0.8], [0.8, 0], [1, 0]])(t);
  }, 64));
  const { spins, steers } = addHeavyWheels(root, [['wheel_FL', xf, wz, true, false], ['wheel_FR', xf, -wz, true, false], ...rear.flatMap((x, i) => [[`wheel_R${i}L`, x, wz, false, true], [`wheel_R${i}R`, x, -wz, false, true]])], { radius: wr, width: 0.3, style: 'truck' });
  finishWheeled(ctx, { spins, steers, radius: wr, speed: 6, steerMax: 0.45 });
  const lights = ctx.anims.find((c) => c.name === 'lights');
  if (lights && lamps.markers.meshes.length) lights.tracks.push(...lampTracks('markers', LAMP_ON.amber * 0.7, { glow: 0.5 }));
  if (lights && lamps.markersRed.meshes.length) lights.tracks.push(...lampTracks('markers_red', LAMP_ON.red * 0.6, { glow: 0.4 }));
}

/* ------------------------------------------------------------------ */
/* Ride-on chain trencher                                               */
/* ------------------------------------------------------------------ */

function trencher(ctx) {
  const { root, mats, T } = ctx;
  const L = trackAssembly(root, { name: 'track_L', x0: -0.9, x1: 0.9, y: 0.3, r: 0.28, ri: 0.26, z: -0.72, width: 0.3, pitch: 0.14, rollers: 3, shoes: 'rubber', mats, frameMat: mats.paint });
  const R = trackAssembly(root, { name: 'track_R', x0: -0.9, x1: 0.9, y: 0.3, r: 0.28, ri: 0.26, z: 0.72, width: 0.3, pitch: 0.14, rollers: 3, shoes: 'rubber', mats, frameMat: mats.paint });
  const mg = new Merge();
  mg.add(roundedBox(2.3, 0.7, 1.3, 0.1, 3), mats.paint, { at: [0, 0.85, 0] });
  mg.add(roundedBox(1.2, 0.55, 1.2, 0.1, 3), mats.paint, { at: [0.5, 1.45, 0] });
  mg.add(roundedBox(0.7, 0.1, 1.0, 0.03, 2), mats.dark, { at: [-0.4, 1.25, 0] });
  mg.add(roundedBox(0.45, 0.1, 0.45, 0.04, 2), mats.seat, { at: [-0.45, 1.5, 0] });
  mg.add(roundedBox(0.1, 0.5, 0.45, 0.04, 2), mats.seat, { at: [-0.65, 1.75, 0] });
  mg.box(0.25, 0.25, 0.25, mats.dark, { at: [-0.45, 1.38, 0], r: 0.03 });
  mg.add(roundedBox(0.4, 0.5, 0.8, 0.06, 2), mats.paint, { at: [-1.2, 0.95, 0] }); // boom mount
  // backfill blade at the front
  mg.add(profile([[0, 0.02], [0.12, 0.02], [0.15, 0.5], [0.0, 0.55], [-0.05, 0.45]], 1.9, 0.02), mats.paint, { at: [1.55, 0, 0] });
  for (const s of [1, -1]) mg.box(0.5, 0.12, 0.12, mats.paint, { at: [1.3, 0.35, s * 0.5], r: 0.02 });
  powerUnit(ctx, mg, [0.7, 1.72, 0.35], 0.35, { packAt: [0.5, 1.85, -0.2], packSize: [0.6, 0.3, 0.5] });
  mg.flush(root, 'body');
  const cab = machineCab(root, { at: [-0.45, 1.3, 0], w: 1.2, d: 1.1, h: 1.35, style: T.style === 'cab' ? 'canopy' : T.style, vintage: T.vintage, mats, frontRake: 0 });
  cabRoof(ctx, cab, { front: 2, rear: 1 });
  frontLamps(ctx, root, 1.11, 1.45, 0.4, { w: 0.1, h: 0.07 });
  // digging boom with chain
  const boom = group('boom', { parent: root, at: [-1.3, 1.05, 0] });
  boom.rotation.z = -0.25;
  const bm = new Merge();
  bm.add(roundedBox(2.2, 0.32, 0.18, 0.08, 2), mats.paint, { at: [-1.0, 0, 0] });
  bm.add(new THREE.CylinderGeometry(0.2, 0.2, 0.22, 16).rotateX(Math.PI / 2), mats.iron, { at: [-2.1, 0, 0] });
  for (let k = 0; k < 18; k++) {
    const x = -0.1 - k * 0.115;
    for (const y of [0.2, -0.2]) bm.add(new THREE.ConeGeometry(0.035, 0.12, 4).rotateZ(y > 0 ? 0 : Math.PI), mats.wear, { at: [x, y, 0] });
  }
  bm.add(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12).rotateX(Math.PI / 2), mats.steel, { at: [0, 0, 0] });
  // spoil auger
  bm.add(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12).rotateX(Math.PI / 2), mats.steel, { at: [-0.25, 0.25, 0] });
  bm.flush(boom, 'boom_body');
  const rams = [makeRam(root, 'boom_ram', [-1.0, 1.35, 0.25], anchor(boom, [-0.8, 0.1, 0.25]), { r: 0.05, mats })];
  ctx.anims.push(poseClip('dig', 6, [boom], rams, (t) => { boom.rotation.z = -0.25 + cycle(t, 0.5) * 0.6; }, 30));
  finishCrawler(ctx, L, R, 0.5);
}

export const MORE_BUILDERS = {
  'articulated-dump': articulatedDump,
  'mining-dump': miningDump,
  'mobile-crane': mobileCrane,
  'tower-crane': towerCrane,
  'road-roller': roadRoller,
  'tandem-roller': tandemRoller,
  'motor-grader': motorGrader,
  'asphalt-paver': asphaltPaver,
  'concrete-pump': concretePump,
  trencher,
};
