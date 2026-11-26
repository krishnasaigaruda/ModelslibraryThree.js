import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { group, roundedBox, lathe, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { clip, spinTrack } from '../../core/animation.js';
import {
  heavyMats, Merge, addHeavyWheels, machineLampAnimations, makeRam, anchor, poseClip, cycle, keys, trackAssembly, machineLamps, emblem, handrail, ladder, profile, lifeClips,
} from './heavy-kit.js';
import { cabRoof, rearCluster, frontLamps, powerUnit, finishWheeled, finishCrawler, trimFlags, loaderBucket } from './construction-machines.js';
import { pruneEmpty } from './truck.js';
import { opCab } from './industrial-machines.js';

/*
 * Farm machinery from real machine classes (generic designs):
 *  tractor-compact (25 hp, 1.6 m wheelbase), tractor-utility (100 hp, 18.4R34 rears),
 *  tractor-rowcrop (250 hp, 3.0 m wheelbase), tractor-4wd (articulated, 8 duals),
 *  tractor-tracked (rubber tracks), combine-harvester (7.6 m header + reel),
 *  forage-harvester (spout), sprayer (high clearance, 24 m folding booms),
 *  baler (round baler, towed) and wagon (hay wagon, towed).
 * Faces +X. Every part is attached; rams follow the moving parts.
 */

export const FARM_VARIANTS = {
  'tractor-compact': {}, 'tractor-utility': {}, 'tractor-rowcrop': {}, 'tractor-4wd': {}, 'tractor-tracked': {},
  'combine-harvester': {}, 'forage-harvester': {}, sprayer: {}, baler: {}, wagon: {},
};
const TRACTOR_TRIMS = ['open', 'vintage', 'duals', 'loader', 'electric', 'orchard'];
const SP_TRIMS = ['tracks', 'vintage', 'duals', 'electric', 'compact'];
export const FARM_TRIMS = {
  'tractor-compact': TRACTOR_TRIMS, 'tractor-utility': TRACTOR_TRIMS, 'tractor-rowcrop': TRACTOR_TRIMS, 'tractor-4wd': ['open', 'vintage', 'loader', 'electric', 'orchard', 'tracks'], 'tractor-tracked': ['open', 'vintage', 'loader', 'electric', 'orchard', 'duals'],
  'combine-harvester': SP_TRIMS, 'forage-harvester': SP_TRIMS, sprayer: SP_TRIMS,
  baler: ['square', 'wrapper', 'vintage', 'compact', 'tandem'], wagon: ['grain-cart', 'tipper', 'flatbed', 'vintage', 'tandem'],
};

/* ------------------------------------------------------------------ */
/* Tractors                                                             */
/* ------------------------------------------------------------------ */

const TRACTORS = {
  'tractor-compact': { wb: 1.6, rr: 0.55, fr: 0.36, rz: 0.62, fz: 0.58, hood: 1.15, cabW: 1.0, cabD: 1.0, cabH: 1.45, open: true },
  'tractor-utility': { wb: 2.4, rr: 0.84, fr: 0.56, rz: 0.95, fz: 0.9, hood: 1.75, cabW: 1.3, cabD: 1.45, cabH: 1.6 },
  'tractor-rowcrop': { wb: 3.0, rr: 0.95, fr: 0.68, rz: 1.0, fz: 0.98, hood: 2.2, cabW: 1.4, cabD: 1.6, cabH: 1.7 },
};

function tractor(ctx, P) {
  const { root, mats, T } = ctx;
  const orchard = T.trim === 'orchard';
  const wb = P.wb;
  const rr = orchard ? P.rr * 0.88 : P.rr;
  const fr = orchard ? P.fr * 0.88 : P.fr;
  const rz = orchard ? P.rz * 0.72 : P.rz;
  const fz = orchard ? P.fz * 0.72 : P.fz;
  const rx = -wb / 2;
  const fx = wb / 2;
  const k = rr / 0.84; // size factor relative to the utility tractor
  const axleY = rr;
  const bodyY = Math.max(rr, fr + 0.25 * k);
  const mg = new Merge();
  // transmission housing + rear axle trumpets
  mg.add(roundedBox(1.3 * k, 0.75 * k, 0.75 * k, 0.12 * k, 3), mats.dark, { at: [rx + 0.25 * k, axleY + 0.05, 0] });
  mg.add(new THREE.CylinderGeometry(0.13 * k, 0.18 * k, 2 * rz - 0.3 * k, 16).rotateX(Math.PI / 2), mats.dark, { at: [rx, axleY, 0] });
  // engine / frame rails to the front axle
  mg.add(roundedBox(wb + 0.5 * k, 0.45 * k, 0.6 * k, 0.1 * k, 3), mats.dark, { at: [0.2 * k, bodyY - 0.05, 0] });
  mg.box(0.3 * k, bodyY - fr - 0.1 * k + 0.05, 0.4 * k, mats.dark, { at: [fx, (bodyY + fr) / 2 - 0.05, 0], r: 0.03 });
  mg.add(roundedBox(0.2 * k, 0.2 * k, 2 * fz - 0.35 * k, 0.05 * k, 2), mats.dark, { at: [fx, fr, 0] });
  // hood
  const hx0 = rx + 0.75 * k;
  const hx1 = fx + 0.55 * k;
  const hy0 = bodyY + 0.15 * k;
  const hTop = hy0 + 0.6 * k;
  mg.add(profile([[hx0, hy0], [hx1, hy0], [hx1 + 0.08 * k, hy0 + 0.45 * k], [hx1 - 0.1 * k, hTop], [hx0, hTop + 0.04 * k]], 0.82 * k, 0.07 * k), mats.paint);
  mg.add(roundedBox(0.06 * k, 0.42 * k, 0.6 * k, 0.02, 2), mats.dark, { at: [hx1 + 0.06 * k, hy0 + 0.25 * k, 0] });
  for (let i = 0; i < 6; i++) mg.box(0.02, 0.02 * k, 0.55 * k, mats.steel, { at: [hx1 + 0.1 * k, hy0 + 0.08 * k + i * 0.065 * k, 0], r: 0.005 });
  for (const s of [1, -1]) for (let i = 0; i < 4; i++) mg.box(0.6 * k, 0.015, 0.01, mats.dark, { at: [hx1 - 0.6 * k, hy0 + 0.2 * k + i * 0.07 * k, s * 0.415 * k], r: 0.004 });
  mg.add(roundedBox(0.2 * k, 0.35 * k, 0.75 * k, 0.04 * k, 2), mats.iron, { at: [hx1 + 0.15 * k, bodyY - 0.05, 0] }); // front weights
  // cab deck + rear fenders
  const deckY = axleY + 0.42 * k;
  mg.add(roundedBox(P.cabD + 0.2, 0.1 * k, 2 * rz - 0.5 * k, 0.03, 2), mats.dark, { at: [rx + 0.15 * k, deckY, 0] });
  for (const s of [1, -1]) {
    mg.add(new THREE.CylinderGeometry(rr + 0.08 * k, rr + 0.08 * k, 0.55 * k, 28, 1, true, -Math.PI / 2 - 0.55, Math.PI * 0.85).rotateX(-Math.PI / 2), mats.paint, { at: [rx, axleY, s * rz] });
    mg.box(0.6 * k, 0.06, 0.6 * k, mats.paint, { at: [rx + 0.15 * k, deckY + 0.02, s * (rz - 0.25 * k)], r: 0.015 });
  }
  // 3-point hitch + PTO
  for (const s of [1, -1]) mg.tube([rx - 0.2 * k, axleY - 0.25 * k, s * 0.3 * k], [rx - 0.95 * k, 0.45 * k, s * 0.42 * k], 0.04 * k, mats.iron, 8);
  mg.tube([rx - 0.3 * k, axleY + 0.35 * k, 0], [rx - 0.85 * k, axleY + 0.2 * k, 0], 0.035 * k, mats.paint, 8);
  mg.add(new THREE.CylinderGeometry(0.035 * k, 0.035 * k, 0.25 * k, 10).rotateZ(Math.PI / 2), mats.steel, { at: [rx - 0.42 * k, axleY - 0.05, 0] });
  powerUnit(ctx, mg, [rx + 0.95 * k, hTop, 0.3 * k], 0.65 * k, { packAt: [fx - 0.2 * k, hy0 - 0.2 * k, 0.5 * k], packSize: [0.6 * k, 0.3 * k, 0.15 * k] });
  mg.flush(root, 'body');
  emblem(root, 'emblem_front', 0.1 * k, [hx1 + 0.1 * k, hTop - 0.05 * k, 0], 1);
  const style = T.style === 'cage' ? 'cab' : P.open || T.trim === 'open' ? 'canopy' : T.style;
  const cab = opCab(root, { at: [rx + 0.15 * k, deckY + 0.05 * k, 0], w: P.cabW * (orchard ? 0.8 : 1), d: P.cabD, h: P.cabH, style, vintage: T.vintage, mats, wheel: true, frontRake: 0.02 });
  cabRoof(ctx, cab, { front: 2, rear: 2 });
  frontLamps(ctx, root, hx1 + 0.08 * k, hy0 + 0.25 * k, 0.24 * k, { w: 0.1 * k, h: 0.07 * k });
  rearCluster(ctx, root, rx - 0.12 * k, deckY + 0.12 * k, rz - 0.25 * k);
  const duals = T.trim === 'duals';
  const r = addHeavyWheels(root, [['wheel_RL', rx, rz, false, duals], ['wheel_RR', rx, -rz, false, duals]], { radius: rr, width: 0.47 * k, style: 'lug', rimMat: mats.rimPaint, y: rr });
  const f = addHeavyWheels(root, [['wheel_FL', fx, fz, true], ['wheel_FR', fx, -fz, true]], { radius: fr, width: 0.36 * k, style: 'lug', rimMat: mats.rimPaint, y: fr });
  // front fenders that steer with the wheels
  for (const st of f.steers) {
    const fm = new Merge();
    const s = Math.sign(st.position.z);
    fm.add(new THREE.CylinderGeometry(fr + 0.06 * k, fr + 0.06 * k, 0.36 * k, 20, 1, true, -Math.PI / 2 + 0.2, Math.PI * 0.55).rotateX(-Math.PI / 2), mats.paint);
    fm.tube([0, fr * 0.2, -s * 0.18 * k], [0, fr * 0.6, -s * 0.05 * k], 0.025 * k, mats.dark, 6);
    fm.flush(st, `${st.name}_fender`);
  }
  if (T.trim === 'loader') frontLoader(ctx, { x: rx + 0.6 * k, y: deckY + 0.3 * k, fx: hx1 + 0.45 * k, k });
  finishWheeled(ctx, { spins: [...r.spins, ...f.spins], steers: f.steers, radius: rr, speed: 3, steerMax: 0.6 });
}

function frontLoader(ctx, { x, y, fx, k }) {
  const { root, mats } = ctx;
  const mg = new Merge();
  for (const s of [1, -1]) mg.add(roundedBox(0.3 * k, 0.6 * k, 0.12 * k, 0.04, 2), mats.dark, { at: [x, y - 0.25 * k, s * 0.5 * k] });
  mg.flush(root, 'loader_towers');
  const arms = group('loader_arms', { parent: root, at: [x, y, 0] });
  const am = new Merge();
  const L = fx - x;
  for (const s of [1, -1]) am.add(profile([[-0.05, 0.08], [L * 0.55, 0.25 * k], [L, -y + 0.7 * k], [L - 0.1 * k, -y + 0.6 * k], [L * 0.5, 0.1 * k], [-0.05, -0.08]], 0.1 * k, 0.02), mats.paint, { at: [0, 0, s * 0.55 * k] });
  am.box(0.12 * k, 0.12 * k, 1.1 * k, mats.paint, { at: [L * 0.62, 0.05 * k, 0], r: 0.02 });
  am.flush(arms, 'loader_arms_body');
  const b = group('loader_bucket', { parent: arms, at: [L - 0.05 * k, -y + 0.62 * k, 0] });
  const bm = new Merge();
  loaderBucket(bm, mats, [[-0.03, 0.35], [-0.12, 0.0], [0.0, -0.22], [0.72, -0.22]].map(([a, c]) => [a * k, c * k]), 1.9 * k, 0.03 * k, mats.dark);
  bm.flush(b, 'loader_bucket_body');
  const rams = [];
  for (const s of [1, -1]) rams.push(makeRam(root, `loader_ram_${s > 0 ? 'R' : 'L'}`, [x + 0.1 * k, y - 0.5 * k, s * 0.5 * k], anchor(arms, [L * 0.45, 0.0, s * 0.5 * k]), { r: 0.045 * k, mats }));
  ctx.anims.push(poseClip('loader', 6, [arms, b], rams, (t) => {
    const a = cycle(t, 0.3);
    arms.rotation.z = a * 0.7;
    b.rotation.z = -a * 0.5 + keys([[0, 0], [0.4, 0], [0.55, -0.7], [0.65, -0.7], [0.8, 0], [1, 0]])(t);
  }, 36));
}

function tractor4wd(ctx) {
  const { root, mats, T } = ctx;
  const wr = T.trim === 'orchard' ? 0.8 : 0.95;
  const tz = T.trim === 'orchard' ? 1.0 : 1.25;
  const tracks = T.trim === 'tracks';
  const front = group('front_frame', { parent: root });
  const rear = group('rear_frame', { parent: root });
  const fm = new Merge();
  fm.add(roundedBox(2.4, 0.6, 0.9, 0.1, 3), mats.dark, { at: [1.4, wr + 0.1, 0] });
  fm.add(profile([[0.4, wr + 0.4], [3.0, wr + 0.4], [3.1, wr + 0.9], [2.9, wr + 1.15], [0.4, wr + 1.2]], 1.1, 0.08), mats.paint);
  fm.add(roundedBox(0.06, 0.5, 0.9, 0.02, 2), mats.dark, { at: [3.09, wr + 0.72, 0] });
  for (let i = 0; i < 6; i++) fm.box(0.02, 0.025, 0.85, mats.steel, { at: [3.13, wr + 0.52 + i * 0.075, 0], r: 0.005 });
  fm.add(roundedBox(1.6, 0.1, 2.1, 0.03, 2), mats.dark, { at: [-0.1, wr + 0.42, 0] });
  fm.add(roundedBox(0.4, 0.5, 0.8, 0.06, 2), mats.iron, { at: [0.0, wr + 0.1, 0] });
  if (!tracks) fm.add(new THREE.CylinderGeometry(0.12, 0.12, 2 * tz, 14).rotateX(Math.PI / 2), mats.dark, { at: [1.5, wr, 0] });
  powerUnit(ctx, fm, [0.7, wr + 1.2, 0.35], 0.7, { packAt: [1.8, wr + 1.35, 0], packSize: [1.0, 0.3, 0.8] });
  fm.flush(front, 'front_body');
  emblem(front, 'emblem_front', 0.12, [3.13, wr + 1.0, 0], 1);
  const cab = opCab(front, { at: [-0.1, wr + 0.47, 0], w: 1.5, d: 1.55, h: 1.75, style: T.trim === 'open' ? 'canopy' : 'cab', vintage: T.vintage, mats, wheel: true, frontRake: 0.02 });
  cabRoof(ctx, cab, { front: 4, rear: 2 });
  frontLamps(ctx, front, 3.1, wr + 0.72, 0.42, { w: 0.12, h: 0.08 });
  const rm = new Merge();
  rm.add(roundedBox(2.2, 0.7, 0.9, 0.1, 3), mats.dark, { at: [-1.4, wr + 0.1, 0] });
  rm.add(roundedBox(1.0, 0.6, 1.4, 0.1, 3), mats.paint, { at: [-1.9, wr + 0.65, 0] });
  if (!tracks) rm.add(new THREE.CylinderGeometry(0.12, 0.12, 2 * tz, 14).rotateX(Math.PI / 2), mats.dark, { at: [-1.5, wr, 0] });
  rm.add(roundedBox(0.4, 0.5, 0.8, 0.06, 2), mats.iron, { at: [-0.35, wr + 0.1, 0] });
  for (const s of [1, -1]) rm.tube([-2.4, wr - 0.2, s * 0.3], [-3.1, 0.55, s * 0.45], 0.05, mats.iron, 8);
  rm.flush(rear, 'rear_body');
  rearCluster(ctx, rear, -2.42, wr + 0.65, 0.6);
  let spins = [];
  if (tracks) {
    const parts = [];
    for (const [g, x0, x1] of [[front, 0.9, 2.2], [rear, -2.2, -0.9]]) for (const s of [1, -1]) {
      parts.push(trackAssembly(g, { name: `${g.name}_track_${s > 0 ? 'R' : 'L'}`, x0, x1, y: 0.42, r: 0.42, ri: 0.4, z: s * 1.05, width: 0.6, pitch: 0.18, rollers: 2, shoes: 'rubber', mats, frameMat: mats.dark }));
    }
    for (const g of [front, rear]) {
      const bm = new Merge();
      bm.box(1.2, 0.35, 1.6, mats.dark, { at: [g === front ? 1.55 : -1.55, 0.55, 0], r: 0.05 });
      bm.flush(g, `${g.name}_bogie`);
    }
    const P = parts[0].step / 1.5;
    ctx.anims.push(clip('drive', P, parts.flatMap((p) => p.drive(P, 1))), clip('reverse', P, parts.flatMap((p) => p.drive(P, -1))));
    ctx.anims.push(...machineLampAnimations(ctx.lamps));
    ctx.anims.push(poseClip('steer', 4, [front], [], (t) => { front.rotation.y = Math.sin(t * Math.PI * 2) * 0.4; }, 24));
    ctx.exclusive.push(['drive', 'reverse']);
    return;
  }
  const duals = true;
  const f = addHeavyWheels(front, [['wheel_FL', 1.5, tz, false, duals], ['wheel_FR', 1.5, -tz, false, duals]], { radius: wr, width: 0.5, style: 'lug', rimMat: mats.rimPaint });
  const r = addHeavyWheels(rear, [['wheel_RL', -1.5, tz, false, duals], ['wheel_RR', -1.5, -tz, false, duals]], { radius: wr, width: 0.5, style: 'lug', rimMat: mats.rimPaint });
  for (const g of [front, rear]) {
    const xm = g === front ? 1.5 : -1.5;
    const fm2 = new Merge();
    for (const s of [1, -1]) fm2.add(new THREE.CylinderGeometry(wr + 0.08, wr + 0.08, 0.6, 24, 1, true, -Math.PI / 2 + 0.1, Math.PI * 0.6).rotateX(-Math.PI / 2), mats.paint, { at: [xm, wr, s * tz] });
    for (const s of [1, -1]) fm2.box(0.4, 0.06, tz - 0.4, mats.paint, { at: [xm + (g === front ? 0.4 : -0.4), wr + 0.65, s * (0.4 + (tz - 0.4) / 2)], r: 0.015 });
    fm2.flush(g, `${g.name}_fenders`);
  }
  spins = [...f.spins, ...r.spins];
  if (T.trim === 'loader') {
    // dozer blade instead of a loader on a 4WD
    const bm = new Merge();
    bm.add(profile([[0, 0.05], [0.14, 0.05], [0.2, 0.9], [0.0, 1.0], [-0.06, 0.8]], 3.6, 0.03), mats.paint, { at: [3.5, 0, 0] });
    for (const s of [1, -1]) bm.box(0.7, 0.15, 0.15, mats.paint, { at: [3.15, wr + 0.1, s * 0.4], r: 0.03 });
    bm.flush(front, 'blade');
  }
  finishWheeled(ctx, { spins, steers: [front], radius: wr, speed: 3, steerMax: 0.5 });
}

function tractorTracked(ctx) {
  const { root, mats, T } = ctx;
  const mg = new Merge();
  const L = trackAssembly(root, { name: 'track_L', x0: -1.4, x1: 1.4, y: 0.62, r: 0.62, ri: 0.5, z: -0.95, width: 0.6, pitch: 0.2, rollers: 4, shoes: 'rubber', mats, frameMat: mats.dark });
  const R = trackAssembly(root, { name: 'track_R', x0: -1.4, x1: 1.4, y: 0.62, r: 0.62, ri: 0.5, z: 0.95, width: 0.6, pitch: 0.2, rollers: 4, shoes: 'rubber', mats, frameMat: mats.dark });
  mg.add(roundedBox(3.4, 0.6, 1.3, 0.1, 3), mats.dark, { at: [0.2, 1.0, 0] });
  mg.add(profile([[-0.3, 1.25], [2.2, 1.25], [2.3, 1.7], [2.1, 1.95], [-0.3, 2.0]], 1.0, 0.08), mats.paint);
  mg.add(roundedBox(0.06, 0.45, 0.8, 0.02, 2), mats.dark, { at: [2.29, 1.5, 0] });
  for (const s of [1, -1]) mg.add(roundedBox(3.0, 0.05, 0.7, 0.02, 2), mats.paint, { at: [0.0, 1.35, s * 0.95] });
  mg.add(roundedBox(1.7, 0.1, 1.9, 0.03, 2), mats.dark, { at: [-0.95, 1.35, 0] });
  for (const s of [1, -1]) mg.tube([-1.4, 0.95, s * 0.3], [-2.4, 0.5, s * 0.45], 0.05, mats.iron, 8);
  powerUnit(ctx, mg, [-0.1, 2.0, 0.3], 0.7, { packAt: [1.0, 2.15, 0], packSize: [1.0, 0.3, 0.7] });
  mg.flush(root, 'body');
  emblem(root, 'emblem_front', 0.11, [2.32, 1.8, 0], 1);
  const cab = opCab(root, { at: [-0.95, 1.4, 0], w: 1.5, d: 1.6, h: 1.75, style: T.trim === 'open' ? 'canopy' : 'cab', vintage: T.vintage, mats, wheel: true, frontRake: 0.02 });
  cabRoof(ctx, cab, { front: 4, rear: 2 });
  frontLamps(ctx, root, 2.3, 1.5, 0.38, { w: 0.12, h: 0.08 });
  rearCluster(ctx, root, -1.82, 1.5, 0.75);
  if (T.trim === 'loader') frontLoader(ctx, { x: -0.3, y: 1.7, fx: 2.9, k: 1 });
  finishCrawler(ctx, L, R, 1.5);
}

/* ------------------------------------------------------------------ */
/* Combine & forage harvester                                           */
/* ------------------------------------------------------------------ */

function harvester(ctx, forage) {
  const { root, mats, lamps, T } = ctx;
  const fr = 0.9;
  const rr = 0.6;
  const fz = 1.45;
  const rz = 1.3;
  const tracks = T.trim === 'tracks';
  const mg = new Merge();
  mg.add(roundedBox(5.0, 2.2, 2.6, 0.15, 3), mats.paint, { at: [-1.3, 2.2, 0] });
  for (const s of [1, -1]) {
    const z = s * 1.3;
    mg.box(4.6, 0.12, 0.008, mats.decal, { at: [-1.3, 2.95, z], r: 0.002 }); // livery stripe, inset in the panel
    mg.box(4.6, 0.04, 0.008, mats.accent, { at: [-1.3, 2.84, z], r: 0.002 });
    for (const x of [-0.2, -1.4, -2.6]) mg.box(0.012, 1.7, 0.008, mats.black, { at: [x, 2.0, z], r: 0.002 }); // access-door seams
    for (const x of [-0.8, -2.0]) mg.box(0.16, 0.035, 0.03, mats.dark, { at: [x, 2.0, s * 1.31], r: 0.008 }); // door latches
    // louvred engine-bay vents
    mg.box(0.9, 0.7, 0.01, mats.dark, { at: [-3.3, 2.0, z], r: 0.003 });
    for (let i = 0; i < 7; i++) mg.box(0.86, 0.035, 0.03, mats.paint, { at: [-3.3, 1.72 + i * 0.095, s * 1.31], rot: [s * 0.6, 0, 0], r: 0.004 });
  }
  mg.add(roundedBox(4.6, 0.5, 1.2, 0.1, 3), mats.dark, { at: [-1.2, 1.05, 0] });
  mg.add(new THREE.CylinderGeometry(0.14, 0.14, 2 * fz, 14).rotateX(Math.PI / 2), mats.dark, { at: [0.9, fr, 0] });
  mg.box(0.5, 1.1 - fr + 0.2, 0.8, mats.dark, { at: [0.9, (1.1 + fr) / 2, 0], r: 0.04 });
  mg.add(roundedBox(0.3, 0.3, 2 * rz - 0.3, 0.06, 2), mats.dark, { at: [-2.8, rr, 0] });
  mg.box(0.4, 0.95 - rr + 0.1, 0.4, mats.dark, { at: [-2.8, (0.95 + rr) / 2, 0], r: 0.03 });
  if (!forage) {
    mg.add(roundedBox(2.4, 0.9, 2.5, 0.2, 3), mats.paint, { at: [-0.4, 3.65, 0] }); // grain tank
    mg.add(roundedBox(2.6, 0.12, 2.7, 0.04, 2), mats.dark, { at: [-0.4, 4.12, 0] });
  }
  mg.add(roundedBox(1.0, 0.8, 2.2, 0.1, 3), mats.dark, { at: [-3.4, 3.35, 0] }); // engine + rotary screen
  mg.add(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 28).rotateZ(Math.PI / 2), M.metal('#7d8288', 0.4), { at: [-3.4, 3.4, 1.11] });
  new Merge().add(roundedBox(0.6, 0.9, 2.0, 0.1, 3), mats.dark, { at: [-3.95, 1.5, 0] }).flush(root, 'straw_chopper'); // own mesh: lamps mount on it
  // cab platform over the feeder house
  mg.add(roundedBox(1.6, 0.12, 2.4, 0.04, 2), mats.dark, { at: [1.2, 2.32, 0] });
  for (const s of [1, -1]) mg.box(0.15, 2.32 - 1.3, 0.15, mats.dark, { at: [0.5, 1.8, s * 1.1], r: 0.02 });
  ladder(mg, [1.0, 0.5, -1.45], [0.9, 2.3, -1.4], 0.45, mats, 7);
  handrail(mg, [[0.4, 2.38, -1.2], [0.4, 3.2, -1.2], [1.95, 3.2, -1.2]], mats.dark);
  for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(fr + 0.1, fr + 0.1, 0.85, 24, 1, true, -Math.PI / 2 - 0.4, Math.PI * 0.75).rotateX(-Math.PI / 2), mats.paint, { at: [0.9, fr, s * fz] });
  powerUnit(ctx, mg, [-3.1, 3.75, 0.6], 0.6, { packAt: [-3.4, 3.95, -0.4], packSize: [0.8, 0.4, 0.8] });
  mg.flush(root, 'body');
  emblem(root, 'emblem_rear', 0.18, [-4.26, 1.8, 0], -1);
  const cab = opCab(root, { at: [1.3, 2.38, 0], w: 1.7, d: 1.5, h: 1.65, style: 'cab', vintage: T.vintage, mats, wheel: true, frontRake: 0.12 });
  cabRoof(ctx, cab, { front: 4, rear: 2 });
  rearCluster(ctx, root, -4.26, 1.5, 0.85);
  // feeder house + header
  const feeder = group('feeder', { parent: root, at: [0.9, 1.75, 0] });
  const fdm = new Merge();
  fdm.add(profile([[-0.2, 0.35], [2.2, -0.35], [2.25, -0.95], [-0.1, -0.35]], 1.4, 0.06), mats.paint);
  fdm.flush(feeder, 'feeder_body');
  const hw = forage ? 3.2 : T.trim === 'compact' ? 4.6 : 7.6;
  const header = group('header', { parent: feeder, at: [2.35, -1.4, 0] });
  const hm = new Merge();
  hm.add(roundedBox(1.5, 0.08, hw, 0.03, 2), mats.paint, { at: [0.55, -0.1, 0] });
  hm.add(profile([[-0.2, -0.1], [0.05, -0.1], [0.05, 0.95], [-0.25, 1.05]], hw, 0.04), mats.paint);
  for (const s of [1, -1]) {
    hm.add(profile([[-0.2, -0.1], [1.4, -0.1], [1.45, 0.05], [0.2, 0.9], [-0.2, 0.95]], 0.06, 0.015), mats.paint, { at: [0, 0, s * (hw / 2)] });
    hm.add(new THREE.ConeGeometry(0.12, 0.6, 12).rotateZ(-Math.PI / 2), mats.paint, { at: [1.55, -0.02, s * (hw / 2)] });
  }
  if (forage) {
    hm.add(new THREE.CylinderGeometry(0.3, 0.3, hw - 0.2, 20).rotateX(Math.PI / 2), mats.dark, { at: [0.9, 0.2, 0] });
    for (let i = -6; i <= 6; i++) hm.box(0.1, 0.02, 0.02, mats.steel, { at: [1.2, 0.0, i * (hw / 14)], r: 0.004 });
  } else {
    hm.add(new THREE.CylinderGeometry(0.22, 0.22, hw - 0.3, 18).rotateX(Math.PI / 2), mats.dark, { at: [0.35, 0.22, 0] }); // auger
    for (let i = 0; i < Math.round(hw / 0.08); i++) hm.box(0.04, 0.02, 0.05, mats.wear, { at: [1.3, -0.05, -hw / 2 + 0.1 + i * 0.08], r: 0.004 }); // knife guards
  }
  for (const s of [1, -1]) hm.box(0.7, 0.08, 0.08, mats.paint, { at: [0.65, 1.0, s * (hw / 2 - 0.1)], rot: [0, 0, 0.6], r: 0.015 });
  hm.flush(header, 'header_body');
  const spins = [];
  if (!forage) {
    // reel: spiders + bats, spins about Z
    const reel = group('reel', { parent: header, at: [1.0, 1.35, 0] });
    const rm = new Merge();
    rm.add(new THREE.CylinderGeometry(0.06, 0.06, hw - 0.2, 10).rotateX(Math.PI / 2), mats.steel);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      rm.add(new THREE.CylinderGeometry(0.03, 0.03, hw - 0.3, 8).rotateX(Math.PI / 2), mats.paint, { at: [Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0] });
      for (const z of [-hw / 2 + 0.3, 0, hw / 2 - 0.3]) rm.tube([0, 0, z], [Math.cos(a) * 0.55, Math.sin(a) * 0.55, z], 0.02, mats.paint, 6);
      for (let j = 0; j < Math.round(hw / 0.15); j++) rm.tube([Math.cos(a) * 0.55, Math.sin(a) * 0.55, -hw / 2 + 0.2 + j * 0.15], [Math.cos(a) * 0.7, Math.sin(a) * 0.7 - 0.1, -hw / 2 + 0.2 + j * 0.15], 0.006, mats.dark, 4);
    }
    rm.flush(reel, 'reel_body');
    for (const s of [1, -1]) {
      const am = new Merge();
      am.tube([-0.15, 1.0, s * (hw / 2 - 0.1)], [1.0, 1.35, s * (hw / 2 - 0.1)], 0.05, mats.paint, 8);
      am.flush(header, 'reel_arm');
    }
    ctx.anims.push(clip('reel', 2, [spinTrack(reel, 'z', 2, -1)]));
    // unloading auger, folded along the left side; swings out
    const auger = group('unload_auger', { parent: root, at: [-1.5, 4.05, -1.2] });
    const um = new Merge();
    um.pipe([[0, 0, 0], [0.4, 0.3, -0.05], [3.6, 0.35, -0.05]], 0.16, mats.paint, 24, 12);
    um.add(new THREE.CylinderGeometry(0.17, 0.12, 0.4, 14).rotateZ(Math.PI / 2), mats.dark, { at: [3.7, 0.35, -0.05] });
    um.flush(auger, 'unload_auger_body');
    const rest = new Merge();
    rest.tube([2.0, 2.2, -1.3], [2.1, 4.35, -1.25], 0.04, mats.dark, 6);
    rest.flush(root, 'auger_rest');
    auger.rotation.y = 0;
    ctx.anims.push(poseClip('unload', 8, [auger], [], (t) => { auger.rotation.y = cycle(t, 0.4) * 1.5; }, 32));
  } else {
    // forage spout on a turret
    const spout = group('spout', { parent: root, at: [-1.4, 3.3, 0] });
    const sm = new Merge();
    sm.add(new THREE.CylinderGeometry(0.4, 0.45, 0.25, 20), mats.dark, { at: [0, 0.12, 0] });
    sm.pipe([[0, 0.2, 0], [0, 1.4, 0], [0.6, 2.2, 0], [1.9, 2.4, 0], [2.6, 2.0, 0]], 0.25, mats.paint, 30, 14);
    sm.add(roundedBox(0.5, 0.15, 0.5, 0.05, 2), mats.dark, { at: [2.7, 1.9, 0], rot: [0, 0, -0.6] });
    sm.flush(spout, 'spout_body');
    ctx.anims.push(poseClip('spout', 10, [spout], [], (t) => { spout.rotation.y = Math.sin(t * Math.PI * 2) * 1.6; }, 32));
  }
  ctx.anims.push(poseClip('header', 6, [feeder], [], (t) => { feeder.rotation.z = cycle(t, 0.4) * 0.12; }, 24));
  if (tracks) {
    const L = trackAssembly(root, { name: 'track_L', x0: 0.2, x1: 1.6, y: 0.5, r: 0.5, ri: 0.45, z: -1.4, width: 0.75, pitch: 0.2, rollers: 2, shoes: 'rubber', mats, frameMat: mats.dark });
    const R = trackAssembly(root, { name: 'track_R', x0: 0.2, x1: 1.6, y: 0.5, r: 0.5, ri: 0.45, z: 1.4, width: 0.75, pitch: 0.2, rollers: 2, shoes: 'rubber', mats, frameMat: mats.dark });
    const r = addHeavyWheels(root, [['wheel_RL', -2.8, rz, true], ['wheel_RR', -2.8, -rz, true]], { radius: rr, width: 0.5, style: 'lug', rimMat: mats.rimPaint });
    const P = L.step / 2;
    ctx.anims.push(clip('drive', P, [...L.drive(P, 1), ...R.drive(P, 1), ...r.spins.map((s) => spinTrack(s, 'z', P * 10, -1))]));
    ctx.anims.push(...machineLampAnimations(lamps));
    void spins;
    return;
  }
  const duals = T.trim === 'duals';
  const f = addHeavyWheels(root, [['wheel_FL', 0.9, fz, false, duals], ['wheel_FR', 0.9, -fz, false, duals]], { radius: fr, width: 0.8, style: 'lug', rimMat: mats.rimPaint });
  const r = addHeavyWheels(root, [['wheel_RL', -2.8, rz, true], ['wheel_RR', -2.8, -rz, true]], { radius: rr, width: 0.5, style: 'lug', rimMat: mats.rimPaint });
  finishWheeled(ctx, { spins: [...f.spins, ...r.spins], steers: r.steers, radius: fr, speed: 2.5, steerMax: 0.5 });
}

/* ------------------------------------------------------------------ */
/* Self-propelled sprayer                                               */
/* ------------------------------------------------------------------ */

function sprayer(ctx) {
  const { root, mats, T } = ctx;
  const wr = T.trim === 'compact' ? 0.7 : 0.9;
  const tz = 1.5;
  const mg = new Merge();
  const fy = 2.0;
  mg.add(roundedBox(4.4, 0.35, 0.7, 0.08, 2), mats.dark, { at: [0, fy, 0] });
  for (const x of [1.8, -1.8]) {
    mg.add(roundedBox(0.3, 0.25, 2 * tz - 0.5, 0.06, 2), mats.dark, { at: [x, fy - 0.05, 0] });
    for (const s of [1, -1]) {
      mg.add(new THREE.CylinderGeometry(0.1, 0.1, fy - wr, 12), mats.chrome, { at: [x, (fy + wr) / 2, s * (tz - 0.3)] });
      mg.box(0.25, 0.3, 0.3, mats.dark, { at: [x, wr + 0.05, s * (tz - 0.3)], r: 0.03 });
    }
  }
  mg.add(lathe([[0.001, -1.0], [0.6, -0.95], [0.85, -0.6], [0.88, 0.6], [0.6, 0.95], [0.001, 1.0]], 32).rotateZ(Math.PI / 2), M.matte('#ece8dc', 0.35), { at: [-0.2, fy + 0.95, 0] }); // tank
  for (const x of [-0.8, 0.4]) mg.box(0.12, 0.25, 0.7, mats.dark, { at: [x, fy + 0.25, 0], r: 0.02 });
  // poly tank details: moulded ribs, hold-down straps, fill cap, level scale, sump valve
  const ty = fy + 0.95;
  for (const x of [-0.95, -0.2, 0.55]) mg.add(new THREE.TorusGeometry(0.885, 0.025, 6, 32).rotateY(Math.PI / 2), M.matte('#e2ded2', 0.45), { at: [x, ty, 0] });
  for (const x of [-0.8, 0.4]) mg.add(new THREE.TorusGeometry(0.9, 0.022, 6, 32, Math.PI).rotateY(Math.PI / 2), mats.dark, { at: [x, ty, 0] });
  mg.add(new THREE.CylinderGeometry(0.2, 0.22, 0.12, 20), M.matte('#e2ded2', 0.45), { at: [-0.2, ty + 0.88, 0] });
  mg.add(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 20), M.matte('#c8102e', 0.5), { at: [-0.2, ty + 0.96, 0] });
  for (let i = 0; i < 12; i++) mg.box(0.02, 0.06, 0.02, M.matte('#a80d26', 0.5), { at: [-0.2 + Math.cos(i * 0.52) * 0.17, ty + 0.96, Math.sin(i * 0.52) * 0.17], r: 0.004 });
  for (const s of [1, -1]) {
    // level scale moulded into the tank wall (follows the curve)
    const R = 0.879;
    mg.pipe([...Array(9)].map((_, i) => { const a = -0.6 + i * 0.15; return [-0.2, ty + R * Math.sin(a), s * R * Math.cos(a)]; }), 0.005, mats.black, 16, 4);
    for (let i = 0; i <= 8; i++) { const a = -0.6 + i * 0.15; mg.box(i % 4 ? 0.05 : 0.1, 0.008, 0.01, mats.black, { at: [-0.2 + (i % 4 ? 0.025 : 0.05), ty + (R - 0.002) * Math.sin(a), s * (R - 0.002) * Math.cos(a)], rot: [-s * a, 0, 0], r: 0.002 }); }
  }
  mg.tube([-0.2, ty - 0.86, 0], [-0.2, fy + 0.06, 0], 0.05, mats.dark, 10);
  mg.add(roundedBox(1.1, 0.9, 1.3, 0.1, 3), mats.paint, { at: [-1.9, fy + 0.6, 0] }); // engine
  mg.add(roundedBox(1.4, 0.1, 1.8, 0.03, 2), mats.dark, { at: [1.55, fy + 0.2, 0] });
  ladder(mg, [1.3, 0.6, -0.95], [1.2, fy + 0.2, -0.9], 0.42, mats, 8);
  // boom cradle at the rear
  mg.add(roundedBox(0.4, 1.4, 0.5, 0.06, 2), mats.dark, { at: [-2.4, fy + 0.4, 0] });
  powerUnit(ctx, mg, [-1.7, fy + 1.05, 0.4], 0.5, { packAt: [-1.9, fy + 1.2, -0.3], packSize: [0.8, 0.3, 0.6] });
  mg.flush(root, 'body');
  const cab = opCab(root, { at: [1.6, fy + 0.25, 0], w: 1.4, d: 1.3, h: 1.6, style: 'cab', vintage: T.vintage, mats, wheel: true, frontRake: 0.08 });
  cabRoof(ctx, cab, { front: 4, rear: 2 });
  frontLamps(ctx, root, 2.22, fy + 0.05, 0.3, { w: 0.12, h: 0.08 });
  rearCluster(ctx, root, -2.62, fy + 0.4, 0.2, { reverse: false });
  // folding booms: inner section folds forward along each side, outer section folds back on it
  const booms = [];
  const truss = (bm, len, s) => {
    for (const [y, z] of [[0, 0], [0.45, 0], [0.22, s * 0.1]]) bm.tube([0, y, z], [len, y * 0.6, z], 0.032, mats.paint, 8);
    for (let x = 0; x < len - 0.1; x += 0.55) bm.tube([x, 0, 0], [x + 0.27, 0.45 - 0.18 * ((x + 0.27) / len), 0], 0.016, mats.paint, 6);
    for (let x = 0.3; x < len; x += 0.5) bm.add(new THREE.ConeGeometry(0.03, 0.08, 6).rotateX(Math.PI), mats.dark, { at: [x, -0.07, 0] });
    bm.tube([0, -0.04, 0], [len, -0.04, 0], 0.012, mats.dark, 6);
  };
  const Li = T.trim === 'compact' ? 3.2 : 4.4;
  const Lo = T.trim === 'compact' ? 3.0 : 4.2;
  const cradle = new Merge();
  for (const s of [1, -1]) cradle.box(0.2, 0.2, tz + 0.45 - 0.25, mats.dark, { at: [-2.5, fy + 0.5, s * ((tz + 0.45 + 0.25) / 2)], r: 0.03 });
  cradle.flush(root, 'boom_cradle');
  for (const s of [1, -1]) {
    const inner = group(`boom_${s > 0 ? 'R' : 'L'}`, { parent: root, at: [-2.5, fy + 0.5, s * (tz + 0.45)] });
    const im = new Merge();
    truss(im, Li, s);
    im.flush(inner, `${inner.name}_body`);
    const outer = group(`boom_${s > 0 ? 'R' : 'L'}_outer`, { parent: inner, at: [Li, 0.05, s * 0.14] });
    outer.rotation.y = Math.PI;
    const om = new Merge();
    truss(om, Lo, s);
    om.flush(outer, `${outer.name}_body`);
    booms.push({ inner, outer, s });
    const rest = new Merge();
    rest.tube([1.0, fy + 0.12, s * (tz - 0.35)], [1.0, fy + 0.5, s * (tz + 0.45)], 0.03, mats.dark, 6);
    rest.flush(root, 'boom_rest');
  }
  ctx.anims.push(poseClip('booms', 12, booms.flatMap((x) => [x.inner, x.outer]), [], (t) => {
    const a = keys([[0, 0], [0.3, 1], [0.7, 1], [1, 0]])(t);
    const b = keys([[0, 0], [0.1, 0], [0.35, 1], [0.65, 1], [0.9, 0], [1, 0]])(t);
    booms.forEach(({ inner, outer, s }) => {
      inner.rotation.y = -s * a * (Math.PI / 2);
      outer.rotation.y = Math.PI * (1 - b);
    });
  }, 40));
  const duals = T.trim === 'duals';
  const tracks = T.trim === 'tracks';
  const opts = { radius: wr, width: tracks ? 0.5 : 0.32, style: 'lug', rimMat: mats.rimPaint };
  const f = addHeavyWheels(root, [['wheel_FL', 1.8, tz, true, duals], ['wheel_FR', 1.8, -tz, true, duals]], opts);
  const r = addHeavyWheels(root, [['wheel_RL', -1.8, tz, false, duals], ['wheel_RR', -1.8, -tz, false, duals]], opts);
  finishWheeled(ctx, { spins: [...f.spins, ...r.spins], steers: f.steers, radius: wr, speed: 4, steerMax: 0.45 });
}

/* ------------------------------------------------------------------ */
/* Towed implements: round baler, wagon                                 */
/* ------------------------------------------------------------------ */

function drawbar(mg, mats, fromX, toX, y, hitchY = 0.5) {
  for (const s of [1, -1]) mg.tube([fromX, y, s * 0.5], [toX - 0.25, hitchY, 0], 0.06, mats.paint, 10);
  mg.add(new THREE.TorusGeometry(0.07, 0.025, 8, 14).rotateX(Math.PI / 2), mats.iron, { at: [toX, hitchY, 0] });
  mg.tube([toX - 0.25, hitchY, 0], [toX - 0.08, hitchY, 0], 0.05, mats.paint, 8);
  mg.add(new THREE.CylinderGeometry(0.04, 0.04, hitchY, 10), mats.iron, { at: [toX - 0.4, hitchY / 2, 0] });
  mg.add(roundedBox(0.2, 0.04, 0.2, 0.01, 2), mats.iron, { at: [toX - 0.4, 0.02, 0] });
}

function baler(ctx) {
  const { root, mats, T } = ctx;
  const square = T.trim === 'square';
  const k = T.trim === 'compact' ? 0.75 : 1;
  const wr = 0.45 * k;
  const tz = 1.15 * k;
  const mg = new Merge();
  let gate;
  if (square) {
    mg.add(roundedBox(4.2 * k, 1.0 * k, 0.9 * k, 0.08, 2), mats.paint, { at: [-0.6 * k, 1.25 * k, 0.2 * k] });
    mg.add(roundedBox(1.0 * k, 1.1 * k, 1.0 * k, 0.1, 2), mats.paint, { at: [0.8 * k, 1.3 * k, -0.5 * k] }); // flywheel housing
    mg.add(new THREE.CylinderGeometry(0.5 * k, 0.5 * k, 0.1, 24).rotateX(Math.PI / 2), mats.dark, { at: [0.8 * k, 1.4 * k, -1.02 * k] });
    mg.add(roundedBox(1.0 * k, 0.4 * k, 0.4 * k, 0.04, 2), M.matte('#d8b67e', 0.9), { at: [-2.6 * k, 1.05 * k, 0.2 * k] }); // emerging bale
  } else {
    // round chamber + hinged tailgate
    mg.add(new THREE.CylinderGeometry(0.85 * k, 0.85 * k, 1.5 * k, 32, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), mats.paint, { at: [0, 1.25 * k, 0] });
    for (const s of [1, -1]) mg.add(new THREE.CircleGeometry(0.86 * k, 32, -Math.PI / 2, Math.PI).rotateY(s > 0 ? 0 : Math.PI), mats.paint, { at: [0, 1.25 * k, s * 0.76 * k] });
    mg.add(new THREE.CylinderGeometry(0.76 * k, 0.76 * k, 1.4 * k, 28).rotateX(Math.PI / 2), M.matte('#d8b67e', 0.95), { at: [0, 1.25 * k, 0] });
    gate = group('tailgate', { parent: root, at: [0, 2.1 * k, 0] });
    const gm = new Merge();
    gm.add(new THREE.CylinderGeometry(0.85 * k, 0.85 * k, 1.5 * k, 32, 1, false, Math.PI, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), mats.paint, { at: [0, -0.85 * k, 0] });
    for (const s of [1, -1]) gm.add(new THREE.CircleGeometry(0.86 * k, 32, Math.PI / 2, Math.PI).rotateY(s > 0 ? 0 : Math.PI), mats.paint, { at: [0, -0.85 * k, s * 0.76 * k] });
    gm.add(new THREE.CylinderGeometry(0.05, 0.05, 1.6 * k, 10).rotateX(Math.PI / 2), mats.iron);
    for (const s of [1, -1]) {
      gm.add(new THREE.TorusGeometry(0.86 * k, 0.025, 6, 24, Math.PI).rotateZ(Math.PI / 2), mats.dark, { at: [0, -0.85 * k, s * 0.77 * k] }); // panel rim
      gm.box(0.12, 0.12, 0.12 * k, mats.dark, { at: [-0.5 * k, -0.95 * k, s * 0.81 * k], r: 0.01 }); // ram lug
      gm.box(0.01, 0.12, 0.06, M.matte('#c81e1e', 0.4), { at: [-0.86 * k, -0.85 * k, s * 0.6 * k], r: 0.003 }); // red reflectors
    }
    gm.flush(gate, 'tailgate_body');
    const rams = [1, -1].map((s) => makeRam(root, `gate_ram_${s > 0 ? 'L' : 'R'}`, [0.3 * k, 1.0 * k, s * 0.84 * k], anchor(gate, [-0.5 * k, -0.95 * k, s * 0.84 * k]), { r: 0.04, mats }));
    ctx.anims.push(poseClip('eject', 6, [gate], rams, (t) => { gate.rotation.z = -cycle(t, 0.35) * 1.2; }, 30));
    for (const s of [1, -1]) {
      mg.box(0.14, 0.14, 0.12 * k, mats.dark, { at: [0.3 * k, 1.0 * k, s * 0.81 * k], r: 0.01 }); // ram base bracket
      mg.add(new THREE.TorusGeometry(0.86 * k, 0.025, 6, 24, Math.PI).rotateZ(-Math.PI / 2), mats.dark, { at: [0, 1.25 * k, s * 0.77 * k] });
      mg.add(new THREE.CylinderGeometry(0.12 * k, 0.12 * k, 0.05, 16).rotateX(Math.PI / 2), mats.dark, { at: [0, 1.25 * k, s * 0.78 * k] }); // roller bearing boss
      mg.box(0.06, 0.1, 0.01, M.matte('#f29a00', 0.4), { at: [0.6 * k, 0.9 * k, s * 0.765 * k], r: 0.003 }); // amber side reflector
    }
    // belt drive cover on the left side
    mg.add(roundedBox(1.1 * k, 0.9 * k, 0.12, 0.08, 3), mats.dark, { at: [0.25 * k, 1.1 * k, 0.8 * k] });
  }
  // pickup with tines
  mg.add(roundedBox(0.4 * k, 0.3 * k, 1.9 * k, 0.06, 2), mats.dark, { at: [0.85 * k, 0.4 * k, 0] });
  for (const s of [1, -1]) mg.tube([0.75 * k, 0.42 * k, s * 0.86 * k], [0.05 * k, 0.55 * k, s * 0.78 * k], 0.04, mats.dark, 8); // pickup arms to the chamber frame
  for (let i = 0; i < 16; i++) mg.add(new THREE.CylinderGeometry(0.006, 0.006, 0.25 * k, 4), mats.steel, { at: [1.05 * k, 0.22 * k, -0.9 * k + i * 0.12 * k], rot: [0, 0, 0.6] });
  mg.add(new THREE.CylinderGeometry(0.06, 0.06, 2 * tz, 12).rotateX(Math.PI / 2), mats.iron, { at: [0, wr, 0] });
  for (const s of [1, -1]) mg.box(0.3 * k, 1.25 * k - wr, 0.12, mats.paint, { at: [0, (1.25 * k + wr) / 2 - 0.2 * k, s * 0.78 * k], r: 0.02 });
  drawbar(mg, mats, 0.6 * k, 3.0 * k, 1.0 * k, 0.5);
  if (!square) {
    // gearbox + guarded PTO shaft to the tractor
    mg.box(0.26, 0.26, 0.3, mats.dark, { at: [0.76 * k, 1.05 * k, 0], r: 0.03 });
    mg.tube([0.88 * k, 1.05 * k, 0], [2.7 * k, 0.62, 0], 0.03, mats.steel, 8);
    mg.add(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 14), M.matte('#f2c200', 0.5), { at: [(0.95 * k + 2.6 * k) / 2, (1.05 * k + 0.62) / 2, 0], rot: [0, 0, Math.atan2(1.8 * k, 1.05 * k - 0.62) * -1 + 0] });
    mg.box(0.08, 0.04, 0.2, mats.iron, { at: [3.0 * k - 0.4, 0.5 + 0.04, 0.12], r: 0.01 }); // jack crank
  }
  if (T.trim === 'wrapper') {
    mg.add(roundedBox(1.6, 0.15, 1.2, 0.04, 2), mats.dark, { at: [-1.8, 0.65, 0] });
    mg.add(new THREE.TorusGeometry(0.7, 0.04, 8, 32).rotateX(Math.PI / 2), mats.paint, { at: [-1.8, 1.9, 0] });
    for (const z of [-0.7, 0.7]) mg.tube([-1.8, 0.7, z], [-1.8, 1.9, z], 0.04, mats.paint, 8);
    mg.add(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 24).rotateX(Math.PI / 2), M.matte('#1e1e1e', 0.3), { at: [-1.8, 1.32, 0] });
  }
  mg.flush(root, 'body');
  const lamps = ctx.lamps;
  for (const s of [1, -1]) {
    lamps.tail.add(root, { at: [square ? -2.72 * k : -0.86 * k, 1.0 * k, s * 0.6 * k], normal: [-1, 0, 0], w: 0.1, h: 0.08 });
    (s < 0 ? lamps.signalL : lamps.signalR).add(root, { at: [square ? -2.72 * k : -0.86 * k, 1.12 * k, s * 0.6 * k], normal: [-1, 0, 0], w: 0.1, h: 0.06 });
  }
  const pos = [['wheel_L', 0, tz], ['wheel_R', 0, -tz]];
  if (T.trim === 'tandem') pos.push(['wheel_L2', -1.0, tz], ['wheel_R2', -1.0, -tz]);
  const { spins } = addHeavyWheels(root, pos, { radius: wr, width: 0.3, style: 'truck', rimMat: mats.rimPaint });
  if (T.trim === 'tandem') {
    const tm = new Merge();
    for (const s of [1, -1]) tm.box(1.3, 0.12, 0.12, mats.iron, { at: [-0.5, wr, s * (tz - 0.25)], r: 0.02 });
    tm.add(new THREE.CylinderGeometry(0.06, 0.06, 2 * tz, 12).rotateX(Math.PI / 2), mats.iron, { at: [-1.0, wr, 0] });
    tm.flush(root, 'tandem');
  }
  finishWheeled(ctx, { spins, steers: [], radius: wr, speed: 3 });
  ctx.anims = ctx.anims.filter((c) => !/^steer/.test(c.name));
}

function wagon(ctx) {
  const { root, mats, T } = ctx;
  const wr = 0.45;
  const tz = 0.95;
  const kind = ['grain-cart', 'tipper', 'flatbed'].includes(T.trim) ? T.trim : 'hay';
  const mg = new Merge();
  const deckY = 1.1;
  const len = 5.0;
  for (const s of [1, -1]) mg.box(len, 0.2, 0.12, mats.iron, { at: [0, deckY - 0.15, s * 0.5], r: 0.02 });
  for (const x of [1.6, -1.6]) {
    mg.add(new THREE.CylinderGeometry(0.06, 0.06, 2 * tz, 12).rotateX(Math.PI / 2), mats.iron, { at: [x, wr, 0] });
    for (const s of [1, -1]) mg.box(0.2, deckY - 0.25 - wr + 0.05, 0.12, mats.iron, { at: [x, (deckY - 0.25 + wr) / 2, s * 0.5], r: 0.02 });
  }
  mg.add(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 24), mats.iron, { at: [1.6, deckY - 0.3, 0] }); // turntable
  drawbar(mg, mats, len / 2, len / 2 + 1.6, wr + 0.1, 0.5);
  let body = null;
  if (kind === 'hay' || kind === 'flatbed') {
    // plank deck: boards with dark gaps (each board its own box so they read as planks)
    const wood = M.wood(T.vintage ? '#7a5a3a' : '#9a7448');
    const gapM = M.matte('#5a4028', 0.9);
    const nb = Math.round(len / 0.3);
    for (let i = 0; i < nb; i++) {
      const x = -len / 2 + (i + 0.5) * (len / nb);
      mg.box(len / nb - 0.012, 0.1, 2.2, wood, { at: [x, deckY, 0], r: 0.01 });
      if (i) mg.box(0.016, 0.09, 2.18, gapM, { at: [x - len / nb / 2, deckY - 0.004, 0], r: 0.002 });
    }
    if (kind === 'hay') {
      for (const x of [len / 2 - 0.05, -len / 2 + 0.05]) {
        for (const z of [-1.0, -0.33, 0.33, 1.0]) mg.tube([x, deckY, z], [x, deckY + 1.4, z], 0.03, M.wood('#9a7448'), 6);
        for (const y of [0.5, 1.0, 1.4]) mg.tube([x, deckY + y, -1.05], [x, deckY + y, 1.05], 0.03, M.wood('#9a7448'), 6);
      }
      const baleM = M.matte('#d8b67e', 0.95);
      const twineM = M.matte('#c9772a', 0.8);
      for (let row = 0; row < 3; row++) for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
        if (row === 2 && (i === 0 || i === 4)) continue;
        const h = Math.sin(row * 7.1 + i * 3.7 + j * 1.3); // deterministic irregularity
        const at = [-1.85 + i * 0.92 + h * 0.03, deckY + 0.26 + row * 0.41, -0.52 + j * 1.04 + Math.cos(h * 5) * 0.025];
        const rot = [0, h * 0.05, 0];
        mg.add(roundedBox(0.9, 0.4, 1.0, 0.05, 2), baleM, { at, rot });
        for (const dz of [-0.28, 0.28]) {
          const c = Math.cos(rot[1]);
          const sn = Math.sin(rot[1]);
          mg.box(0.9 + 0.006, 0.4 + 0.006, 0.014, twineM, { at: [at[0] + dz * sn, at[1], at[2] + dz * c], rot, r: 0.01 }); // twine band
        }
      }
    }
  } else if (kind === 'tipper') {
    mg.box(0.3, 0.2, 1.0, mats.iron, { at: [-len / 2 + 0.2, deckY, 0], r: 0.02 });
    body = group('tipper_body', { parent: root, at: [-len / 2 + 0.15, deckY + 0.12, 0] });
    const bm = new Merge();
    bm.add(roundedBox(len - 0.1, 0.08, 2.3, 0.02, 2), mats.paint, { at: [len / 2 - 0.05, 0, 0] });
    for (const s of [1, -1]) bm.add(roundedBox(len - 0.1, 0.9, 0.06, 0.02, 2), mats.paint, { at: [len / 2 - 0.05, 0.45, s * 1.12] });
    for (const x of [0.03, len - 0.13]) bm.add(roundedBox(0.06, 0.9, 2.3, 0.02, 2), mats.paint, { at: [x, 0.45, 0] });
    for (const s of [1, -1]) for (let x = 0.5; x < len - 0.3; x += 0.7) bm.box(0.06, 0.8, 0.04, mats.paint, { at: [x, 0.45, s * 1.16], r: 0.01 });
    bm.flush(body, 'tipper_body_shell');
    const ram = makeRam(root, 'tip_ram', [0.6, deckY - 0.05, 0], anchor(body, [len * 0.62, -0.02, 0]), { r: 0.08, mats });
    ctx.anims.push(poseClip('tip', 8, [body], [ram], (t) => { body.rotation.z = -cycle(t, 0.3) * 0.75; }, 32));
  } else {
    // grain cart: hopper with a folding unloading auger
    const dbl = mats.paint.clone();
    dbl.side = THREE.DoubleSide;
    mg.add(new THREE.CylinderGeometry(1.4, 0.5, 1.4, 4, 1, true).rotateY(Math.PI / 4).scale(1.4, 1, 0.95), dbl, { at: [0, deckY + 0.8, 0] });
    for (const s of [1, -1]) {
      mg.box(4.0, 0.9, 0.06, mats.paint, { at: [0, deckY + 1.9, s * 1.3], r: 0.015 });
      mg.box(0.06, 0.9, 2.6, mats.paint, { at: [s * 1.97, deckY + 1.9, 0], r: 0.015 });
    }
    mg.add(new THREE.CylinderGeometry(0.5, 0.5, 0.02, 4).rotateY(Math.PI / 4).scale(1.4, 1, 0.95), mats.dark, { at: [0, deckY + 0.11, 0] });
    mg.pipe([[1.9, deckY + 0.3, 1.0], [2.2, deckY + 2.0, 1.1], [2.5, deckY + 3.2, 0.6], [2.6, deckY + 3.3, -0.4]], 0.17, mats.paint, 24, 12);
  }
  mg.flush(root, 'body');
  const lamps = ctx.lamps;
  for (const s of [1, -1]) {
    lamps.tail.add(root, { at: [-len / 2 - 0.0, deckY - 0.15, s * 0.5], normal: [-1, 0, 0], w: 0.1, h: 0.08 });
    (s < 0 ? lamps.signalL : lamps.signalR).add(root, { at: [-len / 2, deckY - 0.15, s * 0.32], normal: [-1, 0, 0], w: 0.08, h: 0.06 });
  }
  void body;
  const pos = [['wheel_FL', 1.6, tz, true], ['wheel_FR', 1.6, -tz, true], ['wheel_RL', -1.6, tz], ['wheel_RR', -1.6, -tz]];
  const { spins, steers } = addHeavyWheels(root, pos, { radius: wr, width: 0.3, style: T.vintage ? 'lug' : 'truck', rimMat: mats.rimPaint, dual: T.trim === 'tandem' });
  finishWheeled(ctx, { spins, steers, radius: wr, speed: 3, steerMax: 0.4 });
}

/* ------------------------------------------------------------------ */
/* Factory                                                               */
/* ------------------------------------------------------------------ */

export function createFarm(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(FARM_VARIANTS, o.variant, 'farm');
  const trim = o.trim ?? null;
  const T = trimFlags(['vintage', 'electric'].includes(trim) ? trim : null);
  T.trim = trim;
  if (trim === 'compact' && (variant === 'combine-harvester' || variant === 'forage-harvester')) T.scale = 0.8;
  const green = variant.startsWith('tractor') || variant === 'baler';
  const scheme = T.vintage ? { color: '#b8321e', accent: '#f2f2ee', rim: '#f2f2ee' }
    : trim === 'electric' ? { color: '#16a394', accent: '#f4f4f2', rim: '#f4f4f2' }
      : trim === 'orchard' ? { color: '#2a4f8a', accent: '#f2f2ee', rim: '#d9d9d9' }
        : trim === 'tracks' || trim === 'duals' ? { color: '#2f7d32', accent: '#f2c200', rim: '#1d1d1f' }
          : { color: green ? '#2f7d32' : '#2f7d32', accent: '#f2c200', rim: '#f2c200' };
  const mats = heavyMats(o, scheme);
  if (T.vintage && !o.color) Object.assign(mats.paint, { roughness: 0.85, clearcoat: 0, metalness: 0 });
  const lamps = machineLamps();
  const root = group(`farm-${variant}${trim ? `-${trim}` : ''}`);
  const machine = group('machine', { parent: root });
  const ctx = { root: machine, mats, lamps, T, trim, anims: [], oneShot: [], exclusive: [], o };
  if (TRACTORS[variant]) tractor(ctx, TRACTORS[variant]);
  else if (variant === 'tractor-4wd') tractor4wd(ctx);
  else if (variant === 'tractor-tracked') tractorTracked(ctx);
  else if (variant === 'combine-harvester') harvester(ctx, false);
  else if (variant === 'forage-harvester') harvester(ctx, true);
  else if (variant === 'sprayer') sprayer(ctx);
  else if (variant === 'baler') baler(ctx);
  else wagon(ctx);
  if (T.scale !== 1) machine.scale.setScalar(T.scale);
  pruneEmpty(root);
  lifeClips(ctx.anims, [ctx.cabs?.[0]?.group], (ctx.cabs ?? []).filter((c) => c.door).map((c) => ({ node: c.door, angle: -1.2 })));
  const obj = finalize(root, { type: 'farm', variant, options: o, animations: ctx.anims });
  obj.userData.premade.oneShot = ctx.oneShot;
  obj.userData.premade.exclusive = ctx.exclusive;
  return obj;
}

