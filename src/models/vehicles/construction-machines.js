import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { group, roundedBox, lathe, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { clip, spinTrack } from '../../core/animation.js';
import { lampTracks, LAMP_ON } from '../../core/lamps.js';
import { vehicleAnimations } from './wheel.js';
import {
  heavyMats, Merge, addHeavyWheels, makeRam, anchor, poseClip, cycle, keys, trackAssembly, crawlerAnimations, machineCab,
  machineLamps, addBeacon, machineLampAnimations, lampNames, emblem, exhaust, handrail, ladder, batteryPack, beaconClip, plateXZ, profile, scoop, plateStrip, lifeClips,
} from './heavy-kit.js';
import { pruneEmpty } from './truck.js';
import { MORE_BUILDERS } from './construction-more.js';

/*
 * Construction machines, modelled on real machine classes (generic designs, no brands):
 *  excavator (20 t: 2.39 m gauge, 0.6 m shoes, 5.7 m boom, 2.9 m stick, 2.75 m tail swing)
 *  bulldozer (D6 class: 1.88 m gauge, 3.4 m blade), wheel-loader (23.5R25 tyres, 3.3 m wheelbase,
 *  articulated), backhoe-loader, skid-steer, telehandler, and (construction-more.js) articulated &
 *  rigid haul dumpers, mobile & tower cranes, rollers, grader, paver, concrete pump.
 * Faces +X, origin on the ground. Hydraulic rams connect the real pivots and follow every pose.
 */

export const CONSTRUCTION_VARIANTS = {
  excavator: {}, bulldozer: {}, 'wheel-loader': {}, backhoe: {}, 'skid-steer': {}, telehandler: {},
  'articulated-dump': {}, 'mining-dump': {}, 'mobile-crane': {}, 'tower-crane': {}, 'road-roller': {},
  'tandem-roller': {}, 'motor-grader': {}, 'asphalt-paver': {}, 'concrete-pump': {}, trencher: {},
};

const STD = ['canopy', 'demolition', 'mining', 'vintage', 'compact', 'electric'];
export const CONSTRUCTION_TRIMS = {
  excavator: STD, bulldozer: STD, 'wheel-loader': STD, backhoe: STD, 'skid-steer': STD, telehandler: STD,
  'articulated-dump': STD, 'mining-dump': ['canopy', 'demolition', 'mining', 'vintage', 'compact', 'electric'],
  'mobile-crane': STD, 'tower-crane': ['luffing', 'flat-top', 'tall', 'short', 'compact'],
  'road-roller': STD, 'tandem-roller': STD, 'motor-grader': STD, 'asphalt-paver': STD, 'concrete-pump': STD, trencher: STD,
};

/** What a trim changes. */
export function trimFlags(trim) {
  const T = { trim, style: 'cab', vintage: false, scale: 1, mining: false, demo: false, electric: false, compact: false };
  if (trim === 'canopy') T.style = 'canopy';
  if (trim === 'demolition') Object.assign(T, { style: 'cage', demo: true });
  if (trim === 'mining') Object.assign(T, { mining: true, scale: 1.35 });
  if (trim === 'vintage') Object.assign(T, { vintage: true, style: 'canopy' });
  if (trim === 'compact') Object.assign(T, { compact: true, scale: 0.55, style: 'canopy' });
  if (trim === 'electric') T.electric = true;
  return T;
}

/* ------------------------------------------------------------------ */
/* Shared machine helpers (exported for construction-more / farm / industrial) */
/* ------------------------------------------------------------------ */

/** Lamps + beacon on a machineCab roof. */
export function cabRoof(ctx, cab, { beacon = true, front = 2, rear = 1, head = false } = {}) {
  const { lamps, mats, T } = ctx;
  (ctx.cabs ??= []).push(cab);
  const g = cab.group;
  const roofX = -cab.rake * 0.4;
  const fx = roofX + (cab.d + 0.12) / 2 - 0.1;
  const bxr = roofX - (cab.d + 0.12) / 2 + 0.1;
  const y = cab.h + 0.06;
  const zs = (n) => (n === 1 ? [0] : n === 2 ? [-cab.w * 0.32, cab.w * 0.32] : [-cab.w * 0.38, -cab.w * 0.13, cab.w * 0.13, cab.w * 0.38]);
  const nf = T?.mining ? 4 : front;
  for (const z of zs(nf)) (head ? lamps.head : lamps.work).add(g, { at: [fx, y, z], normal: [1, 0, 0], w: 0.13, h: 0.09, depth: 0.05 });
  for (const z of zs(T?.mining ? 2 : rear)) lamps.work.add(g, { at: [bxr, y, z], normal: [-1, 0, 0], w: 0.13, h: 0.09, depth: 0.05 });
  if (beacon) addBeacon(lamps, g, [bxr + 0.12, cab.h, cab.w * 0.25], { mats, r: 0.07 });
  if (T?.mining) {
    const mg = new Merge();
    const hw = cab.w / 2 + 0.03;
    const rh = Math.min(0.4, (ctx.roofClear ?? 1) - 0.08);
    const x0 = roofX - cab.d / 2;
    const x1 = roofX + cab.d / 2;
    handrail(mg, [[x0, cab.h, -hw], [x0, cab.h + rh, -hw], [x1, cab.h + rh, -hw], [x1, cab.h, -hw]], mats.stripeA);
    handrail(mg, [[x0, cab.h, hw], [x0, cab.h + rh, hw], [x1, cab.h + rh, hw], [x1, cab.h, hw]], mats.stripeA);
    mg.flush(g, 'roof_rails');
  }
}

/** Rear tail/brake/indicator clusters facing -X at x, height y, ±zAbs. */
export function rearCluster(ctx, parent, x, y, zAbs, { reverse = true, reach = 0.35 } = {}) {
  const { lamps, mats } = ctx;
  // lamp housings: boxes running forward from the lens plane into the bodywork / frame
  const hm = new Merge();
  for (const s of [1, -1]) {
    const z0 = s * (zAbs + 0.085);
    const z1 = s * (zAbs - (reverse ? 0.23 : 0.085));
    hm.box(reach, 0.33, Math.abs(z1 - z0), mats?.dark ?? mats?.black, { at: [x + reach / 2 + 0.002, y, (z0 + z1) / 2], r: 0.02 });
  }
  hm.flush(parent, 'tail_housing');
  for (const s of [1, -1]) {
    lamps.tail.add(parent, { at: [x, y + 0.09, s * zAbs], normal: [-1, 0, 0], w: 0.12, h: 0.07 });
    lamps.brake.add(parent, { at: [x, y, s * zAbs], normal: [-1, 0, 0], w: 0.12, h: 0.07 });
    (s < 0 ? lamps.signalL : lamps.signalR).add(parent, { at: [x, y - 0.09, s * zAbs], normal: [-1, 0, 0], w: 0.12, h: 0.07 });
    if (reverse) lamps.reverse.add(parent, { at: [x, y, s * (zAbs - 0.16)], normal: [-1, 0, 0], w: 0.08, h: 0.08, shape: 'round' });
  }
}

/** Headlights + indicators facing +X. */
export function frontLamps(ctx, parent, x, y, zAbs, { w = 0.18, h = 0.12, round = false } = {}) {
  const { lamps, T } = ctx;
  for (const s of [1, -1]) {
    lamps.head.add(parent, { at: [x, y, s * zAbs], normal: [1, 0, 0], w: round || T?.vintage ? h : w, h, shape: round || T?.vintage ? 'round' : 'rect' });
    (s < 0 ? lamps.signalL : lamps.signalR).add(parent, { at: [x, y - h / 2 - 0.06, s * zAbs], normal: [1, 0, 0], w: 0.1, h: 0.05 });
  }
}

/** Exhaust stack, or battery pack + charge port for electric trims. */
export function powerUnit(ctx, mg, at, h, { packAt, packSize = [0.9, 0.5, 0.5] } = {}) {
  const { mats, T } = ctx;
  if (T.electric) {
    if (packAt) batteryPack(mg, packAt, packSize, mats);
    mg.box(0.03, 0.14, 0.14, mats.blue, { at: [at[0], at[1] + 0.12, at[2]], r: 0.01 });
    mg.add(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12).rotateZ(Math.PI / 2), mats.dark, { at: [at[0] + 0.03, at[1] + 0.12, at[2]] });
    return;
  }
  exhaust(mg, at, T.vintage ? h * 1.6 : h, mats, T.vintage ? 0.06 : 0.05);
  if (!T.vintage) mg.add(new THREE.CylinderGeometry(0.13, 0.13, 0.3, 16), mats.dark, { at: [at[0] + 0.3, at[1] + 0.15, at[2]] }); // pre-cleaner bowl
}

/** Finish a wheeled machine: drive/steer/lights/brake/signals/beacon. */
export function finishWheeled(ctx, { spins, steers, radius, speed = 3, steerMax = 0.55 }) {
  const L = ctx.lamps;
  const has = (k) => L[k] && L[k].meshes.length > 0;
  const set = vehicleAnimations({ spins, steers, radius, speed, steerMax, lamps: lampNames(L) });
  const lights = set.animations.find((c) => c.name === 'lights');
  if (has('work')) {
    if (lights) lights.tracks.push(...lampTracks('worklights', LAMP_ON.white));
    else set.animations.push(clip('lights', 1, lampTracks('worklights', LAMP_ON.white)));
  }
  if (has('beacon')) set.animations.push(beaconClip());
  ctx.anims.push(...set.animations);
  ctx.oneShot.push(...set.oneShot);
  ctx.exclusive.push(...set.exclusive);
}

/** Finish a crawler machine: drive/reverse/turn + lights/beacon. */
export function finishCrawler(ctx, left, right, speed = 1.0) {
  ctx.anims.push(...crawlerAnimations(left, right, { speed }), ...machineLampAnimations(ctx.lamps));
  ctx.exclusive.push(['drive', 'reverse', 'turnLeft', 'turnRight']);
}

/** Hollow toothed digging bucket (pivot at origin, mouth facing -X / down). */
function addBucket(mg, mats, width, size, { teeth = true } = {}) {
  const s = size;
  const curve = [[0.12, 0.12], [0.5, -0.12], [0.62, -0.55], [0.45, -0.95], [0.1, -1.12], [-0.28, -1.14]].map(([x, y]) => [x * s, y * s]);
  scoop(mg, mats.paint, curve, width, 0.05 * s, { wear: mats.wear, teeth: teeth ? Math.max(3, Math.round(width / 0.22)) : 0, side: -1 });
  for (const z of [-0.18, 0.18]) mg.add(new THREE.CylinderGeometry(0.09 * s, 0.09 * s, 0.1 * s, 14).rotateX(Math.PI / 2), mats.steel, { at: [0.05 * s, 0.02 * s, z * s] });
  mg.box(0.5 * s, 0.12 * s, 0.46 * s, mats.paint, { at: [0.3 * s, 0.02 * s, 0], rot: [0, 0, -0.5], r: 0.02 });
}

/** Hollow loader bucket (pivot at origin, mouth facing +X). curve: back top → down the back → floor → cutting edge. */
function loaderBucket(mg, mats, curve, width, t, mat) {
  scoop(mg, mat ?? mats.paint, curve, width, t, { wear: mats.wear, side: 1 });
  const [x0, y0] = curve[0];
  plateStrip(mg, mat ?? mats.paint, [[x0, y0], [x0 + t * 6, y0 + t * 0.8]], width - 0.01, t, { side: -1 });
}
export { loaderBucket };

/** Hydraulic breaker (demolition trim), pivot at origin, pointing along -Y. */
function addHammer(mg, mats, size = 1) {
  mg.add(roundedBox(0.42 * size, 0.35 * size, 0.6 * size, 0.06, 2), mats.paint, { at: [0.05 * size, -0.05 * size, 0] });
  mg.add(roundedBox(0.36 * size, 1.25 * size, 0.42 * size, 0.08, 3), mats.dark, { at: [0.05 * size, -0.8 * size, 0] });
  mg.add(new THREE.CylinderGeometry(0.07 * size, 0.07 * size, 0.45 * size, 14), mats.wear, { at: [0.05 * size, -1.6 * size, 0] });
  mg.add(new THREE.ConeGeometry(0.07 * size, 0.18 * size, 14).rotateX(Math.PI), mats.wear, { at: [0.05 * size, -1.91 * size, 0] });
}

/* ------------------------------------------------------------------ */
/* Excavator                                                            */
/* ------------------------------------------------------------------ */

function excavator(ctx) {
  const { root, mats, lamps, T } = ctx;
  const gauge = 2.39;
  const shoe = 0.6;
  const ty = 0.42;
  const um0 = new Merge();
  const L = trackAssembly(root, { name: 'track_L', x0: -1.85, x1: 1.75, y: ty, r: 0.38, ri: 0.36, z: -gauge / 2, width: shoe, pitch: 0.19, rollers: 7, mats, frameMat: mats.paint });
  const R = trackAssembly(root, { name: 'track_R', x0: -1.85, x1: 1.75, y: ty, r: 0.38, ri: 0.36, z: gauge / 2, width: shoe, pitch: 0.19, rollers: 7, mats, frameMat: mats.paint });
  um0.add(roundedBox(1.7, 0.55, gauge - 0.2, 0.1, 3), mats.paint, { at: [0, 0.78, 0] });
  um0.add(new THREE.CylinderGeometry(0.8, 0.85, 0.18, 40), mats.iron, { at: [0, 1.135, 0] });
  if (T.compact) {
    // mini excavators carry a dozer blade
    for (const s of [1, -1]) um0.box(0.9, 0.14, 0.14, mats.paint, { at: [2.1, 0.45, s * 0.6], r: 0.03 });
    um0.add(profile([[0, 0], [0.12, 0], [0.16, 0.45], [0.02, 0.55], [-0.04, 0.5]], gauge + shoe, 0.02), mats.paint, { at: [2.55, 0.02, 0] });
  }
  um0.flush(root, 'undercarriage');

  const up = group('upper', { parent: root, at: [0, 1.225, 0] });
  const um = new Merge();
  um.add(roundedBox(4.05, 0.16, 2.7, 0.05, 2), mats.dark, { at: [-0.725, 0.08, 0] });
  const cw = [];
  for (let i = 0; i <= 12; i++) {
    const z = -1.35 + (i * 2.7) / 12;
    cw.push([-Math.sqrt(2.75 * 2.75 - z * z), z]);
  }
  const cwPts = [[-1.9, 1.35], [-1.9, -1.35], ...cw];
  um.add(plateXZ(cwPts, T.vintage ? 0.85 : 1.0, { bevel: 0.08 }), mats.paint, { at: [0, 0.16, 0] });
  um.add(roundedBox(1.25, 0.95, 2.6, 0.12, 3), mats.paint, { at: [-1.35, 0.635, 0] });
  um.add(roundedBox(1.9, 0.9, 1.05, 0.1, 3), mats.paint, { at: [0.2, 0.61, 0.84] });
  um.add(roundedBox(0.4, 0.6, 0.95, 0.06, 2), mats.paint, { at: [-0.54, 0.46, -0.82] });
  for (let k = 0; k < 6; k++) um.box(0.9, 0.02, 0.012, mats.dark, { at: [-1.35, 0.4 + k * 0.08, 1.306], r: 0.004 }); // hood louvres
  um.add(roundedBox(0.8, 0.7, 0.6, 0.08, 2), mats.paint, { at: [0.95, 0.5, 0] }); // boom foot
  powerUnit(ctx, um, [-1.1, 1.11, 0.75], 0.45, { packAt: [-1.35, 1.36, -0.4], packSize: [0.9, 0.45, 0.9] });
  handrail(um, [[1.05, 1.06, 1.3], [1.05, 1.42, 1.3], [-0.6, 1.42, 1.3], [-0.6, 1.06, 1.3]], mats.dark);
  um.tube([1.1, 1.06, 1.25], [1.15, 1.6, 1.35], 0.02, mats.dark, 8);
  um.add(roundedBox(0.04, 0.24, 0.18, 0.015, 2), mats.black, { at: [1.17, 1.7, 1.38] });
  if (T.mining) {
    handrail(um, [[-2.3, 1.16, 1.3], [-2.3, 1.56, 1.3], [-1.0, 1.56, 1.3]], mats.stripeA);
    ladder(um, [-0.2, 0.0, 1.38], [-0.2, 1.06, 1.38], 0.4, mats, 5);
  }
  um.flush(up, 'upper_body');
  emblem(up, 'emblem_rear', 0.16, [-2.755, 0.72, 0], -1);
  const cab = machineCab(up, { at: [0.45, 0.16, -0.82], w: 0.98, d: 1.6, h: 1.78, style: T.style, vintage: T.vintage, mats });
  cabRoof(ctx, cab, { front: 2, rear: 1 });
  lamps.work.add(up, { at: [-2.3, 0.18 + (T.vintage ? 0.85 : 1.0), 0], normal: [-1, 0, 0], w: 0.14, h: 0.09, depth: 0.05 });

  // boom (banana) + stick + bucket
  const boom = group('boom', { parent: up, at: [1.15, 0.75, 0] });
  const boomRest = 0.31 + (T.demo ? 0.15 : 0);
  boom.rotation.z = boomRest;
  const bm = new Merge();
  const boomPts = [[-0.15, -0.2], [1.0, 0.22], [2.9, 1.05], [4.3, 0.55], [5.6, -0.05], [5.72, 0.35], [4.4, 1.0], [3.0, 1.62], [1.0, 0.75], [-0.2, 0.28]];
  bm.add(profile(boomPts, 0.55, 0.05), mats.paint);
  bm.add(new THREE.CylinderGeometry(0.17, 0.17, 0.66, 18).rotateX(Math.PI / 2), mats.steel);
  bm.add(new THREE.CylinderGeometry(0.13, 0.13, 0.62, 16).rotateX(Math.PI / 2), mats.steel, { at: [5.5, 0.18, 0] });
  for (const s of [1, -1]) bm.pipe([[0.4, 0.5, s * 0.16], [1.2, 0.84, s * 0.16], [3.0, 1.68, s * 0.16], [4.4, 1.06, s * 0.16], [5.3, 0.62, s * 0.16]], 0.03, mats.hose, 40, 8);
  bm.flush(boom, 'boom_body');
  lamps.work.add(boom, { at: [1.7, 1.08, -0.15], normal: [1, 0, 0], w: 0.14, h: 0.09, depth: 0.05 });
  const stick = group('stick', { parent: boom, at: [5.5, 0.18, 0] });
  stick.rotation.z = -0.774;
  const sm = new Merge();
  sm.add(profile([[-0.35, 0.65], [0.2, 0.38], [0.22, -2.72], [0.05, -3.0], [-0.2, -2.92], [-0.26, 0.3]], 0.42, 0.04), mats.paint);
  sm.add(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 14).rotateX(Math.PI / 2), mats.steel, { at: [0, -2.9, 0] });
  for (const s of [1, -1]) sm.pipe([[-0.1, 0.4, s * 0.12], [0.24, -0.2, s * 0.12], [0.24, -2.4, s * 0.12]], 0.025, mats.hose, 20, 8);
  sm.flush(stick, 'stick_body');
  const bucket = group('bucket', { parent: stick, at: [0, -2.9, 0] });
  const bkm = new Merge();
  if (T.demo) addHammer(bkm, mats, 1);
  else addBucket(bkm, mats, 1.1, 1);
  bkm.flush(bucket, 'bucket_body');
  // rams
  const boomTip = anchor(boom, [2.2, 0.55, 0]);
  const rams = [];
  {
    // cross pins: boom-foot pin carries the ram eyes, a second pin through the boom takes the rod ends
    const pm = new Merge();
    pm.add(new THREE.CylinderGeometry(0.06, 0.06, 0.98, 14).rotateX(Math.PI / 2), mats.steel, { at: [1.3, 0.4, 0] });
    for (const s of [1, -1]) pm.box(0.3, 0.3, 0.06, mats.paint, { at: [1.3, 0.4, s * 0.33], r: 0.02 });
    pm.flush(up, 'boom_ram_pin');
    const bp = new Merge();
    bp.add(new THREE.CylinderGeometry(0.06, 0.06, 0.98, 14).rotateX(Math.PI / 2), mats.steel, { at: [2.2, 0.62, 0] });
    for (const s of [1, -1]) bp.box(0.3, 0.3, 0.16, mats.paint, { at: [2.2, 0.62, s * 0.34], r: 0.02 });
    bp.flush(boom, 'boom_ram_lug');
  }
  for (const s of [1, -1]) {
    const a = anchor(boom, [2.2, 0.62, s * 0.42]);
    rams.push(makeRam(up, `boom_ram_${s > 0 ? 'R' : 'L'}`, [1.3, 0.4, s * 0.42], a, { r: 0.09, mats }));
  }
  void boomTip;
  rams.push(makeRam(boom, 'stick_ram', [2.6, 1.55, 0], anchor(stick, [-0.28, 0.58, 0]), { r: 0.085, mats }));
  rams.push(makeRam(stick, 'bucket_ram', [0.24, -0.25, 0], anchor(bucket, [0.38, 0.2, 0]), { r: 0.075, mats }));

  const boomA = keys([[0, 0], [0.15, -0.28], [0.35, -0.12], [0.5, 0.3], [0.75, 0.3], [0.9, 0.1], [1, 0]]);
  const stickA = keys([[0, 0], [0.15, 0.75], [0.35, -0.15], [0.5, -0.25], [0.65, 0.45], [0.85, 0.3], [1, 0]]);
  const bucketA = keys([[0, 0], [0.15, 0.7], [0.35, -0.5], [0.6, -0.6], [0.7, 0.6], [0.85, 0.3], [1, 0]]);
  const swingA = keys([[0, 0], [0.42, 0], [0.6, 1.4], [0.8, 1.4], [1, 0]]);
  ctx.anims.push(poseClip('dig', 9, [up, boom, stick, bucket], rams, (t) => {
    up.rotation.y = swingA(t);
    boom.rotation.z = boomRest + boomA(t);
    stick.rotation.z = -0.774 + stickA(t);
    bucket.rotation.z = bucketA(t);
  }, 72));
  ctx.anims.push(poseClip('swing', 8, [up], rams, (t) => { up.rotation.y = Math.sin(t * Math.PI * 2) * 1.57; }, 32));
  ctx.anims.push(poseClip('boomUp', 4, [boom, stick, bucket], rams, (t) => {
    const a = cycle(t, 0.3);
    boom.rotation.z = boomRest + a * 0.45;
    stick.rotation.z = -0.774 + a * 0.6;
    bucket.rotation.z = a * 0.6;
  }, 32));
  ctx.exclusive.push(['dig', 'swing', 'boomUp']);
  finishCrawler(ctx, L, R, 0.9);
}

/* ------------------------------------------------------------------ */
/* Bulldozer                                                            */
/* ------------------------------------------------------------------ */

function bulldozer(ctx) {
  const { root, mats, lamps, T } = ctx;
  const gauge = 1.88;
  const ty = 0.45;
  const L = trackAssembly(root, { name: 'track_L', x0: -1.5, x1: 1.45, y: ty, r: 0.42, ri: 0.38, z: -gauge / 2, width: 0.56, pitch: 0.2, rollers: 6, mats, frameMat: mats.paint });
  const R = trackAssembly(root, { name: 'track_R', x0: -1.5, x1: 1.45, y: ty, r: 0.42, ri: 0.38, z: gauge / 2, width: 0.56, pitch: 0.2, rollers: 6, mats, frameMat: mats.paint });
  const mg = new Merge();
  mg.add(roundedBox(3.4, 0.55, 1.5, 0.1, 3), mats.paint, { at: [0, 0.78, 0] }); // main frame between the tracks
  for (const s of [1, -1]) {
    // track fenders
    mg.add(roundedBox(3.5, 0.05, 0.62, 0.02, 2), mats.paint, { at: [-0.05, 1.02, s * gauge / 2] });
    mg.box(3.4, 0.05, 0.3, mats.paint, { at: [-0.05, 1.0, s * 0.8], r: 0.015 });
  }
  // engine hood with grille + radiator guard
  const hood = [[-0.2, 1.0], [2.0, 1.0], [2.0, 1.85], [1.85, 2.02], [-0.2, 2.02]];
  mg.add(profile(hood, 1.3, 0.06), mats.paint);
  mg.add(roundedBox(0.1, 0.8, 1.26, 0.03, 2), mats.dark, { at: [2.02, 1.42, 0] });
  for (let k = 0; k < 8; k++) mg.box(0.03, 0.03, 1.1, mats.steel, { at: [2.08, 1.08 + k * 0.1, 0], r: 0.008 });
  for (const s of [1, -1]) for (let k = 0; k < 5; k++) mg.box(1.4, 0.02, 0.012, mats.dark, { at: [0.95, 1.2 + k * 0.12, s * 0.656], r: 0.004 });
  powerUnit(ctx, mg, [1.0, 2.02, -0.35], 0.6, { packAt: [0.95, 2.22, 0.2], packSize: [1.0, 0.4, 0.6] });
  emblem(root, 'emblem_front', 0.11, [2.1, 1.7, 0], 1);
  // rear: ripper or drawbar
  mg.add(roundedBox(0.4, 0.5, 1.3, 0.06, 2), mats.paint, { at: [-1.9, 0.8, 0] });
  const ripper = group('ripper', { parent: root, at: [-2.1, 0.95, 0] });
  const rm = new Merge();
  for (const s of [1, -1]) rm.add(profile([[0, 0.05], [0, -0.12], [-0.9, -0.2], [-0.9, 0.05]], 0.12, 0.02), mats.paint, { at: [0, 0, s * 0.5] });
  rm.add(roundedBox(0.25, 0.22, 1.3, 0.04, 2), mats.paint, { at: [-0.95, -0.05, 0] });
  const shank = profile([[-0.08, 0.1], [0.08, 0.1], [0.12, -0.6], [0.2, -0.85], [0.05, -0.9], [-0.06, -0.6]], 0.1, 0.015);
  for (const z of T.mining || T.demo ? [-0.45, 0, 0.45] : [0]) rm.add(shank, mats.dark, { at: [-0.95, -0.1, z] });
  rm.flush(ripper, 'ripper_body');
  const ripRam = makeRam(root, 'ripper_ram', [-1.95, 1.3, 0.3], anchor(ripper, [-0.85, 0.05, 0.3]), { r: 0.07, mats });
  // cab (ROPS) at the rear
  const cab = machineCab(root, { at: [-0.95, 1.03, 0], w: 1.35, d: 1.45, h: 1.8, style: T.style, vintage: T.vintage, mats });
  cabRoof(ctx, cab, { front: 2, rear: 2 });
  mg.add(roundedBox(1.0, 0.04, 0.3, 0.015, 2), mats.dark, { at: [-1.0, 1.06, -0.82] }); // step
  for (const s of [1, -1]) frontLampsOn(ctx, root, [1.9, 2.02 + 0.06, s * 0.45]);
  for (const s of [1, -1]) {
    lamps.tail.add(root, { at: [-2.1, 1.3, s * 0.55], normal: [-1, 0, 0], w: 0.1, h: 0.08 });
    mg.box(0.4, 0.16, 0.16, mats.dark, { at: [-2.1 + 0.2 + 0.002, 1.3, s * 0.55], r: 0.02 }); // lamp housing
  }
  mg.flush(root, 'body');
  // blade on push arms (C-frame), pivots on the track frames
  const blade = group('blade', { parent: root, at: [0.1, 0.45, 0] });
  const bm = new Merge();
  const bw = T.mining ? 4.0 : 3.4;
  for (const s of [1, -1]) {
    bm.add(profile([[0, 0.08], [0, -0.08], [2.4, -0.3], [2.45, 0.0], [2.4, 0.08]], 0.16, 0.03), mats.paint, { at: [0, 0, s * (gauge / 2 + 0.38)] });
    bm.add(new THREE.CylinderGeometry(0.12, 0.12, 0.24, 14).rotateX(Math.PI / 2), mats.steel, { at: [0, 0, s * (gauge / 2 + 0.38)] });
  }
  const mold = new THREE.Shape();
  mold.moveTo(0, -0.43);
  mold.lineTo(0.25, -0.43);
  mold.quadraticCurveTo(-0.15, 0.1, 0.15, 0.85);
  mold.lineTo(0.0, 0.88);
  mold.quadraticCurveTo(-0.32, 0.2, -0.12, -0.43);
  const mg2 = new THREE.ExtrudeGeometry(mold, { depth: bw, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 16 });
  mg2.translate(0, 0, -bw / 2);
  bm.add(mg2, mats.paint, { at: [2.55, 0, 0] });
  bm.box(0.1, 0.12, bw, mats.wear, { at: [2.72, -0.39, 0], r: 0.015 });
  for (const s of [1, -1]) bm.add(profile([[0, -0.43], [0.25, -0.43], [0.18, 0.85], [0, 0.85]], 0.06, 0.015), mats.paint, { at: [2.5, 0, s * (bw / 2 - 0.03)] });
  for (let k = -2; k <= 2; k++) bm.box(0.3, 1.1, 0.06, mats.paint, { at: [2.38, 0.22, k * (bw / 5.5)], rot: [0, 0, 0.15], r: 0.015 });
  bm.flush(blade, 'blade_body');
  const rams = [];
  for (const s of [1, -1]) rams.push(makeRam(root, `blade_ram_${s > 0 ? 'R' : 'L'}`, [1.85, 1.78, s * 0.72], anchor(blade, [2.3, 0.62, s * 0.72]), { r: 0.08, mats }));
  ctx.anims.push(poseClip('blade', 5, [blade], rams, (t) => { blade.rotation.z = cycle(t, 0.3) * 0.17; }, 30));
  ctx.anims.push(poseClip('ripper', 5, [ripper], [ripRam], (t) => { ripper.rotation.z = -cycle(t, 0.3) * 0.35; }, 30));
  // rest pose: ram tips update
  finishCrawler(ctx, L, R, 0.8);
}

function frontLampsOn(ctx, parent, at) {
  ctx.lamps.head.add(parent, { at, normal: [1, 0, 0], w: 0.14, h: 0.1, shape: ctx.T.vintage ? 'round' : 'rect', depth: 0.05 });
}

/* ------------------------------------------------------------------ */
/* Wheel loader (articulated)                                           */
/* ------------------------------------------------------------------ */

function wheelLoader(ctx) {
  const { root, mats, lamps, T } = ctx;
  const wr = 0.8;
  const tz = 1.075;
  const tw = 0.6;
  const rear = group('rear_frame', { parent: root });
  const front = group('front_frame', { parent: root });
  const rm = new Merge();
  // rear frame + engine + counterweight
  rm.add(roundedBox(3.2, 0.5, 1.1, 0.08, 2), mats.paint, { at: [-1.75, 1.05, 0] });
  rm.add(profile([[-0.9, 1.25], [-3.15, 1.25], [-3.25, 2.05], [-3.0, 2.3], [-0.9, 2.3]], 1.5, 0.08), mats.paint);
  rm.add(roundedBox(0.45, 0.85, 2.3, 0.12, 3), mats.paint, { at: [-3.35, 1.05, 0] });
  rm.add(roundedBox(0.06, 0.8, 1.3, 0.02, 2), mats.dark, { at: [-3.27, 1.75, 0] });
  for (let k = 0; k < 7; k++) rm.box(0.03, 0.025, 1.2, mats.steel, { at: [-3.31, 1.42 + k * 0.1, 0], r: 0.006 });
  for (const s of [1, -1]) for (let k = 0; k < 5; k++) rm.box(1.6, 0.02, 0.012, mats.dark, { at: [-2.1, 1.45 + k * 0.14, s * 0.756], r: 0.004 });
  rm.add(new THREE.CylinderGeometry(0.09, 0.09, 2 * tz, 14).rotateX(Math.PI / 2), mats.iron, { at: [-1.65, wr, 0] });
  rm.add(roundedBox(0.7, 0.45, 0.9, 0.12, 3), mats.iron, { at: [-1.65, wr, 0] });
  rm.box(0.6, wr + 0.3 - 0.8 + 0.02, 0.8, mats.paint, { at: [-1.65, 0.8 + (wr + 0.3 - 0.8) / 2 + 0.05, 0], r: 0.04 }); // axle cradle
  for (const s of [1, -1]) {
    rm.add(new THREE.CylinderGeometry(wr + 0.1, wr + 0.1, tw + 0.1, 24, 1, true, -Math.PI / 2 - 0.2, Math.PI * 0.75).rotateX(-Math.PI / 2), mats.paint, { at: [-1.65, wr, s * tz] });
    rm.box(0.6, 0.06, tz - 0.55, mats.paint, { at: [-1.65, 1.3, s * (0.55 + (tz - 0.55) / 2 - 0.0)], r: 0.015 });
  }
  ladder(rm, [-0.75, 0.35, -0.95], [-0.62, 1.3, -0.95], 0.4, mats, 4);
  handrail(rm, [[-0.62, 1.3, -1.1], [-0.6, 2.1, -1.1]], mats.dark);
  powerUnit(ctx, rm, [-2.4, 2.3, 0.4], 0.55, { packAt: [-2.2, 2.55, -0.2], packSize: [1.2, 0.5, 0.7] });
  rm.add(roundedBox(0.3, 0.5, 1.0, 0.06, 2), mats.iron, { at: [-0.25, 1.05, 0] }); // hitch
  rm.flush(rear, 'rear_body');
  emblem(rear, 'emblem_rear', 0.14, [-3.585, 1.15, 0], -1);
  const cab = machineCab(rear, { at: [-0.62, 1.3, 0], w: 1.5, d: 1.55, h: 1.95, style: T.style, vintage: T.vintage, mats, wheel: true });
  cabRoof(ctx, cab, { front: 2, rear: 2 });
  rearCluster(ctx, rear, -3.58, 1.0, 0.85);
  // front frame
  const fm = new Merge();
  for (const s of [1, -1]) fm.add(profile([[0.05, 0.8], [2.6, 0.8], [2.7, 1.4], [1.2, 2.25], [0.7, 2.25], [0.05, 1.35]], 0.12, 0.03), mats.paint, { at: [0, 0, s * 0.45] });
  fm.add(roundedBox(0.35, 0.5, 1.0, 0.06, 2), mats.iron, { at: [0.2, 1.05, 0] });
  fm.box(0.5, 0.4, 0.8, mats.paint, { at: [1.65, 1.0, 0], r: 0.04 });
  fm.add(new THREE.CylinderGeometry(0.09, 0.09, 2 * tz, 14).rotateX(Math.PI / 2), mats.iron, { at: [1.65, wr, 0] });
  fm.add(roundedBox(0.7, 0.45, 0.9, 0.12, 3), mats.iron, { at: [1.65, wr, 0] });
  for (const s of [1, -1]) {
    fm.add(new THREE.CylinderGeometry(wr + 0.1, wr + 0.1, tw + 0.1, 24, 1, true, -Math.PI / 2 + 0.25, Math.PI * 0.6).rotateX(-Math.PI / 2), mats.paint, { at: [1.65, wr, s * tz] });
    fm.box(0.5, 0.06, tz - 0.5, mats.paint, { at: [1.55, 1.55, s * (0.5 + (tz - 0.5) / 2)], r: 0.015 });
    fm.box(0.12, 1.55 - 1.0, 0.12, mats.paint, { at: [1.55, 1.27, s * 0.55], r: 0.02 });
  }
  fm.flush(front, 'front_body');
  frontLamps(ctx, front, 1.2, 2.32, 0.42);
  for (const s of [1, -1]) {
    const mgx = new Merge();
    mgx.box(0.2, 0.2, 0.12, mats.paint, { at: [1.2, 2.32, s * 0.42], r: 0.03 });
    mgx.flush(front, 'lamp_bracket');
  }
  const { spins } = addHeavyWheels(rear, [['wheel_RL', -1.65, tz], ['wheel_RR', -1.65, -tz]], { radius: wr, width: tw, style: 'otr', rimMat: mats.rimPaint });
  const fr = addHeavyWheels(front, [['wheel_FL', 1.65, tz], ['wheel_FR', 1.65, -tz]], { radius: wr, width: tw, style: 'otr', rimMat: mats.rimPaint });
  spins.push(...fr.spins);
  // lift arms + bucket (Z-bar simplified: lift rams + tilt ram on a bell crank)
  const arms = group('lift_arms', { parent: front, at: [0.85, 2.05, 0] });
  const am = new Merge();
  const armTip = [2.35, -1.2];
  for (const s of [1, -1]) {
    am.add(profile([[-0.15, 0.12], [1.2, -0.25], [armTip[0] + 0.12, armTip[1] + 0.1], [armTip[0], armTip[1] - 0.12], [1.15, -0.5], [-0.12, -0.12]], 0.14, 0.03), mats.paint, { at: [0, 0, s * 0.62] });
    am.add(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 14).rotateX(Math.PI / 2), mats.steel, { at: [0, 0, s * 0.62] });
  }
  am.add(roundedBox(0.2, 0.2, 1.24, 0.04, 2), mats.paint, { at: [1.25, -0.42, 0] });
  am.flush(arms, 'lift_arms_body');
  const bucket = group('bucket', { parent: arms, at: [armTip[0], armTip[1], 0] });
  const bm = new Merge();
  const bw = T.mining ? 3.4 : 2.9;
  if (T.demo) {
    // grapple fork
    for (let k = 0; k < 5; k++) bm.box(1.35, 0.1, 0.12, mats.dark, { at: [0.55, -0.6, -1.0 + k * 0.5], r: 0.02 });
    bm.add(roundedBox(0.2, 1.1, 2.3, 0.05, 2), mats.paint, { at: [-0.05, -0.15, 0] });
    for (let k = 0; k < 4; k++) bm.add(profile([[0, 0], [0.15, 0.1], [0.9, -0.3], [0.85, -0.4]], 0.1, 0.02), mats.dark, { at: [0, 0.35, -0.8 + k * 0.53] });
  } else {
    loaderBucket(bm, mats, [[-0.05, 0.28], [-0.28, -0.1], [-0.25, -0.55], [0.05, -0.82], [1.3, -0.82]], bw, 0.06);
  }
  bm.flush(bucket, 'bucket_body');
  const rams = [];
  for (const s of [1, -1]) rams.push(makeRam(front, `lift_ram_${s > 0 ? 'R' : 'L'}`, [1.45, 0.98, s * 0.62], anchor(arms, [1.3, -0.45, s * 0.62]), { r: 0.1, mats }));
  rams.push(makeRam(front, 'tilt_ram', [1.0, 1.95, 0], anchor(bucket, [-0.05, 0.3, 0]), { r: 0.11, mats }));
  ctx.anims.push(poseClip('load', 7, [arms, bucket], rams, (t) => {
    arms.rotation.z = keys([[0, 0], [0.15, 0], [0.45, 0.95], [0.7, 0.95], [0.9, 0], [1, 0]])(t);
    bucket.rotation.z = keys([[0, 0], [0.15, 0.55], [0.45, 0.1], [0.55, -0.85], [0.7, -0.85], [0.85, 0], [1, 0]])(t);
  }, 56));
  finishWheeled(ctx, { spins, steers: [front], radius: wr, speed: 3, steerMax: 0.6 });
}

/* ------------------------------------------------------------------ */
/* Backhoe loader                                                       */
/* ------------------------------------------------------------------ */

function backhoe(ctx) {
  const { root, mats, T } = ctx;
  const rr = 0.68;
  const fr = 0.47;
  const mg = new Merge();
  // frame, hood, rear tower
  mg.add(roundedBox(3.4, 0.45, 0.9, 0.08, 2), mats.paint, { at: [0.1, 0.85, 0] });
  mg.add(profile([[0.0, 0.85], [1.75, 0.85], [1.85, 1.15], [1.7, 1.6], [0.0, 1.7]], 0.95, 0.07), mats.paint);
  mg.add(roundedBox(0.08, 0.5, 0.8, 0.02, 2), mats.dark, { at: [1.81, 1.25, 0] });
  for (let k = 0; k < 5; k++) mg.box(0.03, 0.025, 0.7, mats.steel, { at: [1.85, 1.07 + k * 0.09, 0], r: 0.006 });
  mg.add(roundedBox(0.6, 0.9, 2.2, 0.08, 2), mats.paint, { at: [-1.75, 1.15, 0] }); // rear tower
  mg.add(new THREE.CylinderGeometry(0.08, 0.08, 1.86, 14).rotateX(Math.PI / 2), mats.iron, { at: [-1.1, rr, 0] });
  mg.box(0.5, 0.85 - rr + 0.1, 0.6, mats.iron, { at: [-1.1, (0.85 + rr) / 2, 0], r: 0.04 });
  mg.add(new THREE.CylinderGeometry(0.07, 0.07, 1.76, 14).rotateX(Math.PI / 2), mats.iron, { at: [1.1, fr, 0] });
  mg.box(0.4, 0.85 - fr + 0.05, 0.4, mats.iron, { at: [1.1, (0.85 + fr) / 2, 0], r: 0.04 });
  for (const s of [1, -1]) {
    mg.add(new THREE.CylinderGeometry(rr + 0.08, rr + 0.08, 0.6, 24, 1, true, -Math.PI / 2 - 0.3, Math.PI * 0.8).rotateX(-Math.PI / 2), mats.paint, { at: [-1.1, rr, s * 0.95] });
    mg.box(0.7, 0.05, 0.55, mats.paint, { at: [-1.1, rr + 0.62, s * 0.7], r: 0.015 });
    mg.box(0.5, 0.05, 0.35, mats.paint, { at: [1.1, fr + 0.45, s * 0.75], r: 0.015 });
    mg.box(0.06, fr + 0.45 - 0.85 + 0.25, 0.06, mats.steel, { at: [1.1, fr + 0.3, s * 0.55], r: 0.01 });
  }
  powerUnit(ctx, mg, [1.2, 1.65, 0.3], 0.55, { packAt: [0.8, 1.9, -0.1], packSize: [0.9, 0.4, 0.5] });
  emblem(root, 'emblem_front', 0.1, [1.88, 1.48, 0], 1);
  mg.flush(root, 'body');
  const cab = machineCab(root, { at: [-0.55, 1.07, 0], w: 1.55, d: 1.7, h: 1.85, style: T.style, vintage: T.vintage, mats, wheel: true });
  cabRoof(ctx, cab, { front: 2, rear: 2 });
  frontLamps(ctx, root, 1.75, 1.55, 0.36, { w: 0.14, h: 0.1 });
  rearCluster(ctx, root, -2.06, 1.3, 0.8);
  const { spins, steers } = addHeavyWheels(root, [['wheel_FL', 1.1, 0.88, true], ['wheel_FR', 1.1, -0.88, true], ['wheel_RL', -1.1, 0.93], ['wheel_RR', -1.1, -0.93]], { radius: rr, width: 0.45, style: 'lug', rimMat: mats.rimPaint, y: rr });
  // fix front wheel size
  for (const st of steers) {
    st.scale.setScalar(fr / rr);
    st.position.y = fr;
  }
  // front loader
  const arms = group('loader_arms', { parent: root, at: [-0.1, 1.6, 0] });
  const am = new Merge();
  for (const s of [1, -1]) {
    am.add(profile([[-0.1, 0.1], [1.6, 0.25], [2.75, -1.05], [2.6, -1.2], [1.5, 0.0], [-0.1, -0.1]], 0.12, 0.03), mats.paint, { at: [0, 0, s * 0.62] });
    am.add(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 12).rotateX(Math.PI / 2), mats.steel, { at: [0, 0, s * 0.62] });
  }
  am.box(0.16, 0.16, 1.24, mats.paint, { at: [2.3, -0.75, 0], r: 0.03 });
  am.flush(arms, 'loader_arms_body');
  for (const s of [1, -1]) {
    const pm = new Merge();
    pm.box(0.2, 0.3, 0.14, mats.paint, { at: [-0.1, 1.6, s * 0.62], r: 0.03 });
    pm.flush(root, 'arm_mount');
  }
  const lb = group('loader_bucket', { parent: arms, at: [2.72, -1.15, 0] });
  const lbm = new Merge();
  loaderBucket(lbm, mats, [[-0.05, 0.2], [-0.2, 0.0], [-0.18, -0.25], [0.02, -0.42], [0.98, -0.42]], 2.2, 0.045);
  lbm.flush(lb, 'loader_bucket_body');
  const rams = [];
  for (const s of [1, -1]) rams.push(makeRam(root, `loader_ram_${s > 0 ? 'R' : 'L'}`, [0.9, 0.95, s * 0.62], anchor(arms, [1.4, -0.05, s * 0.62]), { r: 0.07, mats }));
  // rear backhoe: swing frame, boom, dipper, bucket, stabilisers
  const swing = group('hoe_swing', { parent: root, at: [-2.15, 1.05, 0] });
  const swm = new Merge();
  swm.add(roundedBox(0.4, 0.8, 0.6, 0.06, 2), mats.paint, { at: [-0.1, 0.1, 0] });
  swm.add(new THREE.CylinderGeometry(0.09, 0.09, 1.0, 12), mats.steel, { at: [0.12, 0.1, 0] });
  swm.flush(swing, 'hoe_swing_body');
  const hboom = group('hoe_boom', { parent: swing, at: [-0.15, 0.3, 0] });
  hboom.rotation.z = 0.0;
  const hbm = new Merge();
  hbm.add(profile([[0.1, -0.12], [-1.4, 1.2], [-2.6, 1.5], [-2.7, 1.25], [-1.5, 0.9], [-0.05, -0.25]].map(([x, y]) => [x, y]), 0.32, 0.04), mats.paint);
  hbm.flush(hboom, 'hoe_boom_body');
  const dipper = group('hoe_dipper', { parent: hboom, at: [-2.62, 1.38, 0] });
  dipper.rotation.z = 0.2;
  const dm = new Merge();
  dm.add(profile([[-0.15, 0.3], [0.12, 0.25], [0.14, -1.85], [0.0, -2.0], [-0.12, -1.85], [-0.2, 0.1]], 0.26, 0.03), mats.paint);
  dm.flush(dipper, 'hoe_dipper_body');
  const hb = group('hoe_bucket', { parent: dipper, at: [0, -1.95, 0] });
  hb.rotation.z = 0.5;
  const hbkm = new Merge();
  if (T.demo) addHammer(hbkm, mats, 0.6);
  else addBucket(hbkm, mats, 0.6, 0.62);
  hbkm.flush(hb, 'hoe_bucket_body');
  rams.push(makeRam(swing, 'hoe_boom_ram', [0.0, -0.25, 0], anchor(hboom, [-1.1, 0.75, 0]), { r: 0.07, mats }));
  rams.push(makeRam(hboom, 'hoe_dipper_ram', [-1.3, 1.25, 0], anchor(dipper, [-0.15, 0.3, 0]), { r: 0.065, mats }));
  rams.push(makeRam(dipper, 'hoe_bucket_ram', [0.15, -0.1, 0], anchor(hb, [0.3, 0.12, 0]), { r: 0.055, mats }));
  const stabs = [];
  for (const s of [1, -1]) {
    const st = group(`stabiliser_${s > 0 ? 'R' : 'L'}`, { parent: root, at: [-1.95, 1.2, s * 0.9] });
    const stm = new Merge();
    stm.add(profile([[0.12, 0.1], [-0.12, 0.1], [-0.1, -0.85], [0.1, -0.85]], 0.14, 0.02), mats.paint, { rot: [s * 0.45, 0, 0] });
    stm.add(roundedBox(0.4, 0.06, 0.4, 0.02, 2), mats.dark, { at: [0, -0.8, s * 0.38] });
    stm.flush(st, `stabiliser_body_${s > 0 ? 'R' : 'L'}`);
    stabs.push(st);
  }
  ctx.anims.push(poseClip('dig', 8, [hboom, dipper, hb, swing], rams, (t) => {
    swing.rotation.y = keys([[0, 0], [0.45, 0], [0.6, 0.9], [0.8, 0.9], [1, 0]])(t);
    hboom.rotation.z = keys([[0, 0], [0.15, -0.25], [0.4, -0.1], [0.55, 0.3], [0.85, 0.3], [1, 0]])(t);
    dipper.rotation.z = 0.2 + keys([[0, 0], [0.15, -0.7], [0.4, 0.3], [0.55, 0.4], [0.7, -0.5], [1, 0]])(t);
    hb.rotation.z = 0.5 + keys([[0, 0], [0.15, -0.6], [0.4, 0.6], [0.7, -0.9], [1, 0]])(t);
  }, 64));
  ctx.anims.push(poseClip('load', 6, [arms, lb], rams, (t) => {
    arms.rotation.z = cycle(t, 0.3) * 0.8;
    lb.rotation.z = keys([[0, 0], [0.2, 0.4], [0.5, -0.7], [0.65, -0.7], [1, 0]])(t);
  }, 48));
  ctx.anims.push(poseClip('stabilisers', 4, stabs, [], (t) => {
    stabs.forEach((st, i) => { st.rotation.x = (i === 0 ? -1 : 1) * cycle(t, 0.5) * 0.4; });
  }, 24));
  ctx.exclusive.push(['dig', 'load']);
  finishWheeled(ctx, { spins, steers, radius: rr, speed: 3, steerMax: 0.6 });
}

/* ------------------------------------------------------------------ */
/* Skid steer                                                           */
/* ------------------------------------------------------------------ */

function skidSteer(ctx) {
  const { root, mats, T } = ctx;
  const wr = 0.39;
  const tz = 0.76;
  const mg = new Merge();
  mg.add(profile([[-1.05, 0.35], [0.9, 0.35], [0.95, 0.75], [0.6, 0.95], [-0.8, 1.05], [-1.1, 0.85]], 1.25, 0.06), mats.paint);
  for (const s of [1, -1]) {
    mg.add(roundedBox(1.55, 0.36, 0.08, 0.03, 2), mats.paint, { at: [-0.05, 0.55, s * 0.62] }); // chain cases
    mg.add(profile([[-1.1, 0.75], [-0.6, 0.75], [-0.75, 1.85], [-1.05, 1.85]], 0.16, 0.03), mats.paint, { at: [0, 0, s * 0.6] }); // arm towers
  }
  mg.add(roundedBox(0.12, 0.5, 1.0, 0.03, 2), mats.dark, { at: [-1.12, 0.75, 0] });
  for (let k = 0; k < 5; k++) mg.box(0.02, 0.02, 0.9, mats.steel, { at: [-1.19, 0.58 + k * 0.08, 0], r: 0.005 });
  powerUnit(ctx, mg, [-0.95, 1.05, 0.3], 0.3, { packAt: [-0.9, 1.15, -0.25], packSize: [0.35, 0.2, 0.35] });
  mg.flush(root, 'body');
  emblem(root, 'emblem_rear', 0.08, [-1.19, 0.98, 0], -1);
  const cab = machineCab(root, { at: [-0.1, 0.9, 0], w: 0.95, d: 1.15, h: 1.15, style: T.style === 'canopy' ? 'canopy' : 'cage', vintage: T.vintage, mats, frontRake: 0 });
  cabRoof(ctx, cab, { front: 2, rear: 1, beacon: !T.compact });
  for (const s of [1, -1]) {
    ctx.lamps.head.add(root, { at: [0.6, 1.75, s * 0.6], normal: [1, 0, 0], w: 0.1, h: 0.08, depth: 0.04 });
    ctx.lamps.tail.add(root, { at: [-1.12, 1.35, s * 0.6], normal: [-1, 0, 0], w: 0.08, h: 0.12 });
    const th = new THREE.Mesh(roundedBox(0.3, 0.18, 0.14, 0.02, 2), mats.dark);
    th.name = 'tail_housing';
    th.position.set(-1.12 + 0.152, 1.35, s * 0.6);
    root.add(th);
  }
  const { spins } = addHeavyWheels(root, [['wheel_FL', 0.55, tz], ['wheel_FR', 0.55, -tz], ['wheel_RL', -0.55, tz], ['wheel_RR', -0.55, -tz]], { radius: wr, width: 0.3, style: 'lug', rimMat: mats.rimPaint });
  const arms = group('lift_arms', { parent: root, at: [-0.9, 1.75, 0] });
  const am = new Merge();
  for (const s of [1, -1]) am.add(profile([[-0.08, 0.1], [1.2, 0.05], [2.0, -0.9], [1.9, -1.05], [1.05, -0.12], [-0.08, -0.1]], 0.12, 0.025), mats.paint, { at: [0, 0, s * 0.72] });
  am.box(0.12, 0.14, 1.56, mats.paint, { at: [1.55, -0.5, 0], r: 0.025 });
  am.flush(arms, 'lift_arms_body');
  const bucket = group('bucket', { parent: arms, at: [1.98, -1.0, 0] });
  const bm = new Merge();
  loaderBucket(bm, mats, [[-0.03, 0.4], [-0.12, 0.0], [0.0, -0.18], [0.72, -0.18]], 1.75, 0.035, mats.dark);
  bm.flush(bucket, 'bucket_body');
  const rams = [];
  for (const s of [1, -1]) rams.push(makeRam(root, `lift_ram_${s > 0 ? 'R' : 'L'}`, [-0.95, 0.85, s * 0.72], anchor(arms, [0.9, -0.05, s * 0.72]), { r: 0.055, mats }));
  ctx.anims.push(poseClip('lift', 5, [arms, bucket], rams, (t) => {
    const a = cycle(t, 0.3);
    arms.rotation.z = a * 0.95;
    bucket.rotation.z = -a * 0.8 + keys([[0, 0], [0.4, 0], [0.55, -0.6], [0.65, -0.6], [0.8, 0], [1, 0]])(t);
  }, 40));
  // skid steering: the wheels on one side run backwards
  const period = (Math.PI * 2 * wr) / 2.5;
  const turn = (name, dirL) => clip(name, period, spins.map((sp) => spinTrack(sp, 'z', period, sp.parent.position.z < 0 ? -dirL : dirL)));
  ctx.anims.push(turn('turnLeft', 1), turn('turnRight', -1));
  finishWheeled(ctx, { spins, steers: [], radius: wr, speed: 2.5 });
}

/* ------------------------------------------------------------------ */
/* Telehandler                                                          */
/* ------------------------------------------------------------------ */

function telehandler(ctx) {
  const { root, mats, T } = ctx;
  const wr = 0.62;
  const tz = 0.92;
  const mg = new Merge();
  mg.add(roundedBox(4.1, 0.55, 1.1, 0.08, 2), mats.paint, { at: [0, 0.85, 0] });
  mg.add(profile([[-2.2, 0.85], [-0.6, 0.85], [-0.5, 1.75], [-2.05, 1.75], [-2.3, 1.4]], 0.7, 0.06), mats.paint, { at: [0, 0, 0.62] }); // engine side pod
  for (const x of [1.45, -1.45]) {
    mg.add(new THREE.CylinderGeometry(0.08, 0.08, 2 * tz, 14).rotateX(Math.PI / 2), mats.iron, { at: [x, wr, 0] });
    mg.add(roundedBox(0.55, 0.4, 0.8, 0.1, 3), mats.iron, { at: [x, wr, 0] });
    mg.box(0.5, 0.85 - wr + 0.1, 0.6, mats.iron, { at: [x, (0.85 + wr) / 2, 0], r: 0.03 });
    for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(wr + 0.08, wr + 0.08, 0.55, 24, 1, true, -Math.PI / 2 - 0.15, Math.PI * 0.7).rotateX(-Math.PI / 2), mats.paint, { at: [x, wr, s * tz] });
  }
  mg.add(roundedBox(0.5, 1.2, 1.0, 0.08, 2), mats.paint, { at: [-2.0, 1.7, 0] }); // boom tower
  mg.add(roundedBox(0.3, 0.45, 1.4, 0.06, 2), mats.paint, { at: [-2.25, 0.75, 0] }); // rear counterweight
  powerUnit(ctx, mg, [-1.4, 1.75, 0.85], 0.4, { packAt: [-1.3, 1.95, 0.62], packSize: [1.0, 0.4, 0.5] });
  mg.flush(root, 'body');
  emblem(root, 'emblem_rear', 0.1, [-2.41, 0.8, 0], -1);
  const cab = machineCab(root, { at: [0.15, 1.12, -0.5], w: 0.95, d: 1.55, h: 1.75, style: T.style, vintage: T.vintage, mats, wheel: true });
  cabRoof(ctx, cab, { front: 2, rear: 1 });
  frontLamps(ctx, root, 2.06, 1.0, 0.75, { w: 0.14, h: 0.09 });
  rearCluster(ctx, root, -2.41, 0.85, 0.65);
  const { spins, steers } = addHeavyWheels(root, [['wheel_FL', 1.45, tz, true], ['wheel_FR', 1.45, -tz, true], ['wheel_RL', -1.45, tz], ['wheel_RR', -1.45, -tz]], { radius: wr, width: 0.45, style: 'lug', rimMat: mats.rimPaint });
  // telescopic boom (3 sections) + fork carriage that stays level
  const boom = group('boom', { parent: root, at: [-2.0, 2.2, 0.15] });
  const bm = new Merge();
  bm.add(roundedBox(3.4, 0.42, 0.42, 0.06, 2), mats.paint, { at: [1.6, 0, 0] });
  bm.add(new THREE.CylinderGeometry(0.14, 0.14, 0.6, 14).rotateX(Math.PI / 2), mats.steel);
  bm.flush(boom, 'boom_body');
  const ext = group('boom_ext', { parent: boom, at: [0, 0, 0] });
  const em = new Merge();
  em.add(roundedBox(3.0, 0.32, 0.32, 0.05, 2), mats.paint, { at: [2.3, 0, 0] });
  em.flush(ext, 'boom_ext_body');
  const carriage = group('carriage', { parent: ext, at: [3.85, -0.05, 0] });
  carriage.rotation.z = 0.0;
  const cm = new Merge();
  cm.add(roundedBox(0.12, 0.9, 1.3, 0.03, 2), mats.dark, { at: [0.1, -0.55, 0] });
  for (const s of [1, -1]) {
    cm.box(0.08, 1.0, 0.12, mats.dark, { at: [0.14, -0.6, s * 0.4], r: 0.01 });
    cm.box(1.2, 0.06, 0.12, mats.dark, { at: [0.74, -1.08, s * 0.4], r: 0.01 });
  }
  cm.flush(carriage, 'carriage_body');
  const rams = [makeRam(root, 'boom_ram', [-0.6, 0.95, 0.15], anchor(boom, [1.5, -0.2, 0]), { r: 0.09, mats })];
  // rest pose: boom slightly down so the forks rest on the ground
  boom.rotation.z = -0.2;
  carriage.rotation.z = 0.2;
  for (const r of rams) r.update();
  ctx.anims.push(poseClip('boom', 8, [boom, carriage], rams, (t) => {
    const a = cycle(t, 0.3);
    boom.rotation.z = -0.2 + a * 0.95;
    carriage.rotation.z = 0.2 - a * 0.95;
  }, 48, { movers: [ext] }));
  // telescope: extend the inner section
  ctx.anims.push(clip('telescope', 6, [new THREE.VectorKeyframeTrack('boom_ext.position', [0, 1.5, 3, 4.5, 6], [0, 0, 0, 0, 0, 0, 2.2, 0, 0, 2.2, 0, 0, 0, 0, 0])]));
  finishWheeled(ctx, { spins, steers, radius: wr, speed: 3 });
}

const builders = () => ({ excavator, bulldozer, 'wheel-loader': wheelLoader, backhoe, 'skid-steer': skidSteer, telehandler, ...MORE_BUILDERS });

/* ------------------------------------------------------------------ */
/* Factory                                                               */
/* ------------------------------------------------------------------ */

export function createConstruction(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(CONSTRUCTION_VARIANTS, o.variant, 'construction');
  const trim = o.trim ?? null;
  const T = trimFlags(variant === 'tower-crane' ? null : trim);
  if (variant === 'excavator' && T.compact) T.scale = 0.45;
  if (variant === 'excavator' && T.mining) T.scale = 1.5;
  if (variant === 'mining-dump') T.scale = T.compact ? 0.45 : T.mining ? 1.25 : 1;
  const SCHEME = {
    demolition: { color: '#3a3b3e', accent: '#f2c200', rim: '#f2c200' },
    mining: { color: '#f26b0f', accent: '#1d1d1f', rim: '#f2f2ee' },
    vintage: { color: '#9c6b2e', accent: '#4a3a28', rim: '#e8e6dc' },
    compact: { color: '#d32f2f', accent: '#1d1d1f', rim: '#d9d9d9' },
    electric: { color: '#16a394', accent: '#f4f4f2', rim: '#f4f4f2' },
    canopy: { color: '#f4f4f2', accent: '#f2c200', rim: '#f2c200' },
  };
  const scheme = (variant !== 'tower-crane' && SCHEME[trim]) || { color: '#f2a900', accent: '#2a2a2c' };
  const mats = heavyMats(o, scheme);
  if (T.vintage && !o.color) Object.assign(mats.paint, { roughness: 0.85, clearcoat: 0, metalness: 0 });
  if (T.compact) mats.trackShoes = 'rubber';
  const lamps = machineLamps();
  const root = group(`construction-${variant}${trim ? `-${trim}` : ''}`);
  const machine = group('machine', { parent: root });
  const ctx = { root: machine, mats, lamps, T, trim, anims: [], oneShot: [], exclusive: [], o };
  builders()[variant](ctx);
  if ((T.mining || T.demo) && ctx.cabs?.length) {
    // mining: beacon tower + fire-suppression bottles; demolition: hazard stripes on the cab sides
    const cab = ctx.cabs[0];
    const mg = new Merge();
    const rx = -cab.rake * 0.4 - cab.d / 2 + 0.15;
    const th = Math.min(0.9, (ctx.roofClear ?? 1) - 0.25); // beacon tower stays under any canopy
    if (T.mining) {
      mg.tube([rx, cab.h, -cab.w * 0.3], [rx, cab.h + th, -cab.w * 0.3], 0.03, mats.dark, 8);
      mg.box(0.16, 0.04, 0.16, mats.dark, { at: [rx, cab.h + th + 0.02, -cab.w * 0.3], r: 0.01 });
      for (const z of [cab.w * 0.12, cab.w * 0.3]) {
        mg.add(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 14), M.paint('#c8102e'), { at: [rx, cab.h + 0.25, z] });
        mg.add(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 10), mats.dark, { at: [rx, cab.h + 0.54, z] });
      }
    } else {
      for (const s of [1, -1]) for (let i = 0; i < 6; i++) mg.box(cab.d / 6 - 0.02, 0.1, 0.012, i % 2 ? mats.stripeB : mats.stripeA, { at: [-cab.d / 2 + (i + 0.5) * (cab.d / 6), 0.18, s * (cab.w / 2 - 0.03)], r: 0.003 });
    }
    mg.flush(cab.group, 'trim_kit');
    if (T.mining) addBeacon(lamps, cab.group, [rx, cab.h + th + 0.04, -cab.w * 0.3], { mats, r: 0.08 });
  }
  if (T.scale !== 1) machine.scale.setScalar(T.scale);
  pruneEmpty(root);
  lifeClips(ctx.anims, [ctx.cabs?.[0]?.group], (ctx.cabs ?? []).filter((c) => c.door).map((c) => ({ node: c.door, angle: -1.2 })));
  const obj = finalize(root, { type: 'construction', variant, options: o, animations: ctx.anims });
  obj.userData.premade.oneShot = ctx.oneShot;
  obj.userData.premade.exclusive = ctx.exclusive;
  return obj;
}
