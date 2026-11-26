import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { group, roundedBox, lathe, extrudeOutline, cushion, finalize, normalizeOptions, pickVariant, rng, jitter } from '../../core/utils.js';
import { clip, rotateTrack, pingPong } from '../../core/animation.js';
import { lampGroup } from '../../core/lamps.js';
import { profile, plateXZ, machineLamps, machineLampAnimations, lampNames, beaconClip, poseClip, keys } from '../vehicles/heavy-kit.js';
import { vehicleAnimations } from '../vehicles/wheel.js';
import { Merge, milWheel, militaryMats, splitTrim, VEHICLE_TRIMS, CAMO_TRIMS, screenMat } from './kit.js';
import { tankTrack, trackClips, trackLayout } from './tracks.js';

/*
 * Military vehicles (no weapons except a sealed generic cannon tube on tanks).
 * Faces +X, origin at ground centre. Trims = camouflage scheme (+ theatre kit) and/or
 * add-on parts (armour, mine plough, dozer blade, cage armour, cargo racks).
 */

export const MILVEHICLE_VARIANTS = {
  tank: ['mbt', 'mbt-cast', 'light-tank'],
  apc: ['tracked', 'wheeled-8x8', 'wheeled-6x6', 'mrap', 'mrap-6x6'],
  'military-truck': ['cargo', 'fuel-tanker', 'recovery', 'ambulance'],
  'utility-4x4': ['jeep', 'utility', 'pickup'],
  'bridge-layer': ['tracked', 'wheeled'],
  'radar-trailer': ['rotating-array', 'dish', 'mast'],
};
export { VEHICLE_TRIMS, CAMO_TRIMS };

const TH = 0.07; // track shoe thickness
const PI = Math.PI;

/* ------------------------------------------------------------------ */
/* Small shared parts                                                   */
/* ------------------------------------------------------------------ */

function jerryCan(mg, mat, at, rotY = 0) {
  const [x, y, z] = at;
  const g = roundedBox(0.165, 0.47, 0.345, 0.025, 2);
  g.rotateY(rotY);
  mg.add(g, mat, { at: [x, y + 0.235, z] });
  const h = new THREE.TorusGeometry(0.05, 0.012, 6, 12, PI).rotateY(rotY + PI / 2);
  mg.add(h, mat, { at: [x, y + 0.47, z] });
}
function bag(mg, mat, at, [w, h, d], rotY = 0) {
  const g = cushion(w, h, d, { bulge: 0.35 });
  g.rotateY(rotY);
  mg.add(g, mat, { at: [at[0], at[1] + h / 2, at[2]] });
}
function bedroll(mg, mat, strap, at, len, r = 0.13) {
  mg.add(new THREE.CylinderGeometry(r, r, len, 16).rotateX(PI / 2), mat, { at: [at[0], at[1] + r, at[2]] });
  for (const f of [-0.3, 0.3]) mg.add(new THREE.TorusGeometry(r * 1.02, 0.012, 6, 18), strap, { at: [at[0], at[1] + r, at[2] + f * len] });
}
function foliageClump(mg, mats, at, size, seed) {
  const r = rng(seed);
  for (let i = 0; i < 4; i++) {
    const rad = size * (0.45 + r() * 0.3);
    const g = jitter(new THREE.IcosahedronGeometry(rad, 1), r, 0.2);
    g.scale(1.2, 0.7, 1);
    mg.add(g, i % 2 ? mats.foliage : mats.foliage2, { at: [at[0] + (r() - 0.5) * size * 0.8, at[1] + rad * 0.35, at[2] + (r() - 0.5) * size * 0.8] });
  }
}
function periscope(mg, mats, at, rotY = 0) {
  mg.add(roundedBox(0.16, 0.09, 0.08, 0.015, 2).rotateY(rotY), mats.accent, { at: [at[0], at[1] + 0.045, at[2]] });
  mg.add(new THREE.PlaneGeometry(0.12, 0.05).rotateY(rotY + PI / 2), mats.armourGlass, { at: [at[0] + Math.cos(rotY) * 0.041, at[1] + 0.05, at[2] - Math.sin(rotY) * 0.041] });
}
function hatch(mg, mats, at, r = 0.33) {
  mg.add(new THREE.CylinderGeometry(r + 0.04, r + 0.06, 0.06, 28), mats.plain, { at: [at[0], at[1] + 0.03, at[2]] });
  mg.add(lathe([[0.001, 0.07], [r * 0.6, 0.065], [r, 0.04], [r, 0]], 28), mats.paint, { at: [at[0], at[1] + 0.05, at[2]] });
  mg.add(new THREE.BoxGeometry(0.08, 0.04, r * 0.9), mats.iron, { at: [at[0] - r * 0.85, at[1] + 0.08, at[2]] });
}
function antenna(mg, mats, at, h = 1.5) {
  mg.add(new THREE.CylinderGeometry(0.04, 0.05, 0.12, 12), mats.iron, { at: [at[0], at[1] + 0.06, at[2]] });
  mg.add(new THREE.CylinderGeometry(0.006, 0.012, h, 6), mats.black, { at: [at[0], at[1] + 0.12 + h / 2, at[2]] });
}
function grille(mg, mats, x0, x1, y, z0, z1, n = 6) {
  mg.box(x1 - x0 + 0.04, 0.03, z1 - z0 + 0.04, mats.accent, { at: [(x0 + x1) / 2, y + 0.015, (z0 + z1) / 2], r: 0.01 });
  for (let i = 0; i < n; i++) mg.box((x1 - x0) / n * 0.55, 0.035, z1 - z0, mats.black, { at: [x0 + ((i + 0.5) * (x1 - x0)) / n, y + 0.03, (z0 + z1) / 2], r: 0.005 });
}

/* ------------------------------------------------------------------ */
/* Tracked hulls                                                        */
/* ------------------------------------------------------------------ */

function trackedRunningGear(ctx, cfg) {
  const { body, mats } = ctx;
  const { L, W, tw, roadR, wheels, idlerR, sprR, idlerY, sprY, returns, topY, wheelStyle, x0, x1 } = cfg;
  const circles = trackLayout({ x0, x1, roadR, wheels, idlerR, sprR, idlerY, sprY, returns, returnR: 0.1, topY });
  for (const c of circles) if (c.kind === 'road') c.y = roadR + TH + 0.03;
  const zt = W / 2 - tw / 2;
  const left = tankTrack(body, { name: 'trackL', z: zt, width: tw, circles, mats, wheelStyle });
  const right = tankTrack(body, { name: 'trackR', z: -zt, width: tw, circles, mats, wheelStyle });
  ctx.anims.push(...trackClips(left, right, 2.2));
  // suspension arms + axle stubs connecting each road wheel to the hull
  const mg = ctx.mg;
  for (const c of circles) for (const s of [1, -1]) {
    mg.tube([c.x, c.y, s * (zt - tw * 0.3)], [c.x, c.y, s * (W / 2 - tw - 0.08)], 0.06, mats.iron, 10);
    if (c.kind === 'road') mg.tube([c.x, c.y, s * (W / 2 - tw - 0.05)], [c.x + 0.35, c.y + 0.22, s * (W / 2 - tw - 0.05)], 0.055, mats.iron, 8);
  }
  void L;
  return { zt, circles };
}

/** Lower + upper hull of a tank-like vehicle. Returns deck height. */
function tankHull(ctx, { L, W, tw, belly = 0.45, sponson = 1.22, deck = 1.62, glacisX, nose = 0.95, rearSlope = 0.25, skirts = true, skirtY0 = 0.62 }) {
  const { mg, mats } = ctx;
  const xf = L / 2;
  const xr = -L / 2;
  const wIn = W - 2 * tw - 0.04;
  mg.add(profile([[xr + 0.1, belly], [xf - 0.4, belly], [xf, nose], [xf, sponson], [xr, sponson], [xr, belly + 0.25]], wIn, 0.04), mats.plain);
  mg.add(profile([[xr, sponson], [xf + 0.02, sponson], [xf + 0.02, sponson + 0.06], [glacisX, deck], [xr + rearSlope, deck], [xr, deck - 0.2]], W, 0.05), mats.paint);
  if (skirts) {
    for (const s of [1, -1]) mg.add(profile([[xr + 0.25, skirtY0], [xf - 0.6, skirtY0], [xf - 0.1, sponson - 0.02], [xf - 0.1, sponson + 0.04], [xr + 0.2, sponson + 0.04]], 0.05, 0.015), mats.paint, { at: [0, 0, s * (W / 2 + 0.025)] });
  } else {
    for (const s of [1, -1]) mg.box(L - 0.2, 0.04, tw + 0.08, mats.plain, { at: [0, sponson + 0.02, s * (W / 2 - tw / 2)], r: 0.01 });
  }
  // tow hooks + lights housings + rear plate details
  for (const s of [1, -1]) {
    mg.add(new THREE.TorusGeometry(0.07, 0.022, 8, 14), mats.iron, { at: [xf + 0.03, nose - 0.1, s * wIn * 0.35], rot: [PI / 2, 0, 0] });
    mg.add(new THREE.TorusGeometry(0.07, 0.022, 8, 14), mats.iron, { at: [xr - 0.02, belly + 0.4, s * wIn * 0.35], rot: [PI / 2, 0, 0] });
  }
  grille(mg, mats, xr + rearSlope + 0.1, xr + rearSlope + 1.4, deck, -W * 0.3, W * 0.3, 8);
  const lamps = ctx.lamps;
  for (const s of [1, -1]) {
    const hx = glacisX + (xf - glacisX) * 0.35;
    const hy = deck - (deck - sponson) * 0.35;
    mg.box(0.08, 0.2, 0.3, mats.iron, { at: [hx + 0.06, hy + 0.12, s * (W / 2 - 0.3)], r: 0.02 });
    lamps.head.add(ctx.body, { at: [hx + 0.115, hy + 0.13, s * (W / 2 - 0.3)], normal: [1, 0, 0], w: 0.14, h: 0.1, shape: 'round' });
    lamps.tail.add(ctx.body, { at: [xr - 0.05, deck - 0.3, s * (W / 2 - 0.25)], normal: [-1, 0, 0], w: 0.12, h: 0.07 });
    lamps[s > 0 ? 'signalL' : 'signalR'].add(ctx.body, { at: [xr - 0.05, deck - 0.3, s * (W / 2 - 0.45)], normal: [-1, 0, 0], w: 0.07, h: 0.07, shape: 'round' });
  }
  return { xf, xr, deck, wIn };
}

/** Sealed generic cannon tube along +X from the gun pivot. */
function cannon(parent, mats, { len = 5.2, r = 0.085, sleeve = true, name = 'gun' }) {
  const gun = group(name, { parent });
  const gm = new Merge();
  const prof = [[0.001, 0], [r * 1.6, 0], [r * 1.6, 0.3], [r * 1.25, 0.35], [r * 1.25, len * 0.45], [r * 1.9, len * 0.5], [r * 1.9, len * 0.6], [r * 1.15, len * 0.65], [r, len * 0.98], [r * 1.25, len * 0.985], [r * 1.25, len], [0.001, len]];
  gm.add(lathe(prof, 20).rotateZ(-PI / 2), sleeve ? mats.paint : mats.plain);
  if (sleeve) for (const f of [0.2, 0.75, 0.88]) gm.add(new THREE.CylinderGeometry(r * 1.4, r * 1.4, 0.05, 20).rotateZ(PI / 2), mats.accent, { at: [len * f, 0, 0] });
  gm.flush(gun, `${name}_tube`);
  return gun;
}

function turretClips(ctx, turret, gun, { max = 0.9, elev = 0.28 } = {}) {
  ctx.anims.push(clip('turretTraverse', 8, [rotateTrack(turret, 'y', 8, (t) => Math.sin(t * PI * 2) * max)]));
  if (gun) ctx.anims.push(clip('barrelElevate', 4, [rotateTrack(gun, 'z', 4, (t) => pingPong(t) * elev - 0.04)]));
}

function tank(ctx, kind) {
  const { body, mats, info } = ctx;
  const P = {
    mbt: { L: 7.9, W: 3.7, tw: 0.64, roadR: 0.36, wheels: 7, idlerR: 0.32, sprR: 0.34, idlerY: 0.8, sprY: 0.82, returns: 3, topY: 1.13, deck: 1.62, glacisX: 2.2, skirts: true, wheelStyle: 'disc' },
    'mbt-cast': { L: 6.9, W: 3.4, tw: 0.58, roadR: 0.41, wheels: 5, idlerR: 0.3, sprR: 0.33, idlerY: 0.82, sprY: 0.82, returns: 0, topY: 1.15, deck: 1.62, glacisX: 1.6, skirts: false, wheelStyle: 'spoked' },
    'light-tank': { L: 5.9, W: 2.95, tw: 0.46, roadR: 0.3, wheels: 6, idlerR: 0.26, sprR: 0.28, idlerY: 0.66, sprY: 0.68, returns: 3, topY: 0.95, deck: 1.38, glacisX: 1.6, skirts: true, wheelStyle: 'disc' },
  }[kind];
  const { L, W, tw } = P;
  const x0 = -L / 2 + P.sprR + 0.05;
  const x1 = L / 2 - P.idlerR - 0.12;
  trackedRunningGear(ctx, { ...P, x0, x1 });
  const sponson = P.topY + 0.1;
  const h = tankHull(ctx, { L, W, tw, sponson, deck: P.deck, glacisX: P.glacisX, nose: sponson - 0.3, skirts: P.skirts, skirtY0: P.roadR * 1.3 });
  // driver hatch + periscopes on the glacis/deck
  hatch(ctx.mg, mats, [P.glacisX - 0.35, P.deck, 0], 0.28);
  for (const z of [-0.35, 0, 0.35]) periscope(ctx.mg, mats, [P.glacisX - 0.05, P.deck, z]);
  // turret
  const tx = kind === 'light-tank' ? -0.1 : -0.35;
  const turret = group('turret', { parent: body, at: [tx, P.deck, 0] });
  const tm = new Merge();
  const ringR = W * 0.3;
  tm.add(new THREE.CylinderGeometry(ringR, ringR + 0.05, 0.12, 36), mats.plain, { at: [0, 0.06, 0] });
  let th;
  let frontX;
  let halfW = (x) => 1.22 * 1.0 * Math.sqrt(Math.max(0.05, 1 - ((x + 0.15) / (1.25 * 1.22)) ** 2)) + 0.03;
  if (kind === 'mbt-cast') {
    th = 0.82;
    const dome = lathe([[1.22, 0], [1.24, 0.18], [1.16, 0.45], [0.95, 0.68], [0.55, 0.8], [0.001, th]], 40);
    dome.scale(1.25, 1, 1);
    tm.add(dome, mats.paint, { at: [-0.15, 0.1, 0] });
    frontX = 1.35;
    tm.add(lathe([[0.42, 0], [0.45, 0.25], [0.38, 0.5], [0.001, 0.52]], 24).rotateZ(-PI / 2), mats.paint, { at: [1.05, 0.48, 0] });
  } else {
    th = kind === 'light-tank' ? 0.62 : 0.78;
    const s = kind === 'light-tank' ? 0.72 : 1;
    const out = [[2.05, 0.55], [1.7, 1.45], [-0.5, 1.75], [-2.2, 1.62], [-2.55, 1.3], [-2.55, -1.3], [-2.2, -1.62], [-0.5, -1.75], [1.7, -1.45], [2.05, -0.55]].map(([x, z]) => [x * s, z * s * (W / 3.7)]);
    const half = out.slice(0, 5);
    halfW = (x) => {
      for (let i = 1; i < half.length; i++) {
        const [xa, za] = half[i - 1];
        const [xb, zb] = half[i];
        if (x <= xa && x >= xb) return za + ((zb - za) * (x - xa)) / (xb - xa) + 0.05;
      }
      return half[2][1];
    };
    tm.add(plateXZ(out, th, { bevel: 0.05 }), mats.paint, { at: [0, 0.1, 0] });
    frontX = 2.0 * s;
    // bustle stowage basket
    const bx = -2.55 * s;
    for (const y of [0.25, 0.6]) tm.pipe([[bx, y, 1.2 * s], [bx - 0.45, y, 1.1 * s], [bx - 0.45, y, -1.1 * s], [bx, y, -1.2 * s]], 0.022, mats.iron, 20, 6);
    for (const z of [-1, -0.33, 0.33, 1]) tm.tube([bx - 0.45, 0.2, z * s], [bx - 0.45, 0.62, z * s], 0.02, mats.iron, 6);
    tm.box(0.42, 0.04, 2.2 * s, mats.iron, { at: [bx - 0.22, 0.2, 0], r: 0.01 });
    bag(tm, mats.canvas, [bx - 0.22, 0.22, 0.4 * s], [0.38, 0.32, 0.8 * s]);
    bag(tm, mats.canvasDark, [bx - 0.22, 0.22, -0.45 * s], [0.38, 0.28, 0.7 * s]);
    // gunner sight box
    tm.box(0.5, 0.35, 0.4, mats.paint, { at: [0.9 * s, th + 0.27, -0.75 * s], r: 0.04 });
    tm.add(new THREE.PlaneGeometry(0.3, 0.2).rotateY(PI / 2), mats.armourGlass, { at: [0.9 * s + 0.255, th + 0.28, -0.75 * s] });
  }
  info.turretTop = th + 0.1;
  info.turretR = kind === 'mbt-cast' ? 1.5 : W * 0.48;
  // commander cupola + hatches + antennas
  const cz = kind === 'mbt-cast' ? 0.45 : 0.75 * (W / 3.7);
  tm.add(new THREE.CylinderGeometry(0.42, 0.45, 0.22, 28), mats.paint, { at: [-0.4, th + 0.1 + 0.08, cz] });
  for (let i = 0; i < 6; i++) periscope(tm, mats, [-0.4 + Math.cos((i / 6) * PI * 2) * 0.36, th + 0.2, cz + Math.sin((i / 6) * PI * 2) * 0.36], -(i / 6) * PI * 2);
  hatch(tm, mats, [-0.4, th + 0.3, cz], 0.3);
  hatch(tm, mats, [-0.4, th + 0.1, -cz], 0.28);
  antenna(tm, mats, [kind === 'mbt-cast' ? -1.3 : -1.9 * (W / 3.7), th + 0.1, cz], 1.5);
  antenna(tm, mats, [kind === 'mbt-cast' ? -1.3 : -1.9 * (W / 3.7), th + 0.1, -cz], 1.1);
  tm.flush(turret, 'turret_body');
  ctx.turretMg = new Merge();
  ctx.turretInfo = { frontX, th, w: W * 0.8, rearX: kind === 'mbt-cast' ? -1.5 : -2.55 * (kind === 'light-tank' ? 0.72 : 1), halfW };
  const gunY = th * 0.5 + 0.12;
  const pivot = group('gun_pivot', { parent: turret, at: [frontX - 0.1, gunY, 0] });
  // mantlet (on the pivot, moves with the gun)
  const gun = cannon(pivot, mats, { len: kind === 'light-tank' ? 3.4 : kind === 'mbt-cast' ? 4.4 : 5.3, r: kind === 'light-tank' ? 0.06 : 0.085, sleeve: kind !== 'mbt-cast' });
  const mm = new Merge();
  if (kind === 'mbt-cast') mm.add(new THREE.SphereGeometry(0.34, 18, 12, 0, PI * 2, 0, PI / 2).rotateZ(-PI / 2).scale(0.8, 1, 1.2), mats.paint, { at: [0.1, 0, 0] });
  else mm.box(0.4, th * 0.6, 0.75, mats.paint, { at: [0.15, 0, 0], r: 0.05 });
  mm.flush(gun, 'mantlet');
  turretClips(ctx, turret, gun);
  ctx.turret = turret;
  Object.assign(info, { tracked: true, xf: h.xf, xr: h.xr, W, deck: P.deck, noseY: sponson - 0.3, sideY0: P.skirts ? P.roadR * 1.3 : sponson - 0.05, sideY1: sponson + 0.05, sideX0: h.xr + 0.3, sideX1: h.xf - 0.6, sideZ: W / 2 + 0.05, roofY: P.deck + th + 0.1, rearDeck: [h.xr + 0.3, tx - ctx.turretInfo.w * 0.6 + 0.2], belly: 0.45, trackW: tw });
}

function trackedApc(ctx) {
  const { mats, info, mg } = ctx;
  const L = 5.3;
  const W = 2.7;
  const tw = 0.42;
  const P = { L, W, tw, roadR: 0.31, wheels: 5, idlerR: 0.27, sprR: 0.28, idlerY: 0.7, sprY: 0.7, returns: 0, topY: 0.98, wheelStyle: 'disc' };
  trackedRunningGear(ctx, { ...P, x0: -L / 2 + 0.38, x1: L / 2 - 0.4 });
  const xf = L / 2 + 0.05;
  const xr = -L / 2 - 0.05;
  const top = 1.95;
  // slab-sided hull, sloped nose
  mg.add(profile([[xr, 0.45], [xf - 0.55, 0.45], [xf, 0.95], [xf - 0.65, 1.6], [xf - 0.85, top], [xr, top], [xr, 0.45]], W - 0.02, 0.06), mats.paint);
  for (const s of [1, -1]) mg.box(L - 0.3, 0.04, tw + 0.1, mats.plain, { at: [-0.05, 1.08, s * (W / 2 - tw / 2)], r: 0.01 });
  // trim vane on the nose
  mg.add(roundedBox(0.04, 0.5, W - 1.0, 0.015, 2), mats.paint, { at: [xf - 0.22, 1.3, 0], rot: [0, 0, 0.62] });
  hatch(mg, mats, [xf - 1.3, top, 0.65], 0.3);
  mg.add(new THREE.CylinderGeometry(0.42, 0.45, 0.2, 28), mats.paint, { at: [0.6, top + 0.1, -0.5] });
  for (let i = 0; i < 6; i++) periscope(mg, mats, [0.6 + Math.cos((i / 6) * PI * 2) * 0.36, top + 0.1, -0.5 + Math.sin((i / 6) * PI * 2) * 0.36], -(i / 6) * PI * 2);
  hatch(mg, mats, [0.6, top + 0.2, -0.5], 0.3);
  mg.box(1.6, 0.06, 1.4, mats.plain, { at: [-1.4, top + 0.03, 0], r: 0.02 }); // cargo hatch
  grille(mg, mats, xf - 1.0, xf - 0.86 + 0.0, top, -W * 0.45, -W * 0.1, 3);
  antenna(mg, mats, [-2.2, top, 1.05]);
  antenna(mg, mats, [-2.2, top, -1.05], 1.6);
  // exhaust on the right nose side
  mg.pipe([[xf - 0.9, 1.5, -W / 2 + 0.02], [xf - 0.9, 1.5, -W / 2 - 0.12], [xf - 1.6, 1.7, -W / 2 - 0.12]], 0.06, mats.dark, 12, 10);
  // rear ramp
  const ramp = group('ramp', { parent: ctx.body, at: [xr, 0.5, 0] });
  const rm = new Merge();
  rm.box(0.1, top - 0.55, W - 0.4, mats.paint, { at: [-0.05, (top - 0.55) / 2, 0], r: 0.03 });
  rm.box(0.04, 1.0, 0.6, mats.plain, { at: [-0.11, 0.75, 0.3], r: 0.01 });
  rm.add(new THREE.TorusGeometry(0.06, 0.015, 6, 12), mats.iron, { at: [-0.105, 0.8, -0.2], rot: [0, PI / 2, 0] });
  rm.flush(ramp, 'ramp_body');
  ctx.anims.push(clip('ramp', 5, [rotateTrack(ramp, 'z', 5, (t) => keys([[0, 0], [0.3, 1], [0.7, 1], [1, 0]])(t) * 1.45)]));
  for (const s of [1, -1]) {
    ctx.lamps.head.add(ctx.body, { at: [xf - 0.2, 1.38, s * (W / 2 - 0.3)], normal: [1, 0, 0.0], w: 0.14, h: 0.1, shape: 'round' });
    mg.box(0.3, 0.2, 0.3, mats.iron, { at: [xf - 0.35, 1.38, s * (W / 2 - 0.3)], r: 0.02 });
    ctx.lamps.tail.add(ctx.body, { at: [xr - 0.06, 1.6, s * (W / 2 - 0.12)], normal: [-1, 0, 0], w: 0.08, h: 0.12 });
  }
  Object.assign(info, { tracked: true, xf, xr, W, deck: top, noseY: 0.95, sideY0: 1.1, sideY1: top - 0.1, sideX0: xr + 0.3, sideX1: xf - 0.9, sideZ: W / 2 - 0.01, roofY: top, rearDeck: [-2.4, -0.4], belly: 0.45, trackW: tw, flatRoof: [xr + 0.2, xf - 1.0] });
}

/* ------------------------------------------------------------------ */
/* Wheeled vehicles                                                     */
/* ------------------------------------------------------------------ */

function addWheels(ctx, list, { r, w, track, steerN = 1 }) {
  const { body, mats, mg } = ctx;
  const spins = [];
  const steers = [];
  list.forEach((x, i) => {
    for (const s of [1, -1]) {
      const { steer, spin, hubR } = milWheel(`wheel${i}${s > 0 ? 'L' : 'R'}`, { radius: r, width: w, side: s, rimMat: mats.plain, hubMat: mats.iron });
      steer.position.set(x, r, s * track / 2);
      body.add(steer);
      spins.push(spin);
      if (i < steerN) steers.push(steer);
      mg.tube([x, r, s * (track / 2)], [x, r, s * 0.3], hubR, mats.iron, 16);
    }
    mg.box(0.22, 0.2, track - w, mats.iron, { at: [x, r, 0], r: 0.04 });
  });
  ctx.wheels = { spins, steers, r };
}

function wheelArch(mg, mat, x, r, z, w, y0) {
  const g = new THREE.TorusGeometry(r + 0.08, 0.05, 6, 20, PI);
  mg.add(g, mat, { at: [x, y0, z] });
  mg.add(new THREE.CylinderGeometry(r + 0.12, r + 0.12, w, 20, 1, true, PI / 2, PI).rotateX(PI / 2), mat, { at: [x, y0, z - Math.sign(z) * w / 2] });
}

function wheeledApc(ctx, axles) {
  const { mats, info, mg, lamps, body } = ctx;
  const L = axles === 4 ? 7.8 : 7.0;
  const W = axles === 4 ? 2.95 : 2.75;
  const r = 0.6;
  const xs = axles === 4 ? [2.6, 1.15, -1.1, -2.55] : [2.3, 0, -1.6];
  addWheels(ctx, xs, { r, w: 0.42, track: W - 0.42, steerN: 2 });
  const xf = L / 2;
  const xr = -L / 2;
  const top = 2.3;
  // boat-shaped lower hull (narrower) + superstructure with sloped sides
  mg.add(profile([[xr, 0.62], [xf - 1.1, 0.48], [xf, 1.0], [xf, 1.3], [xr, 1.3]], W - 0.95, 0.06), mats.plain);
  const sup = [[xr, 1.25], [xf, 1.25], [xf - 0.15, 1.45], [xf - 1.4, 1.95], [xf - 1.7, top], [xr + 0.1, top], [xr, top - 0.15]];
  mg.add(profile(sup, W - 0.5, 0.08), mats.paint);
  for (const s of [1, -1]) {
    // sloped side plates over the wheels
    const g = profile([[xr + 0.05, 0], [xf - 0.05, 0], [xf - 1.4, 0.68], [xr + 0.1, 0.68]], 0.06, 0.02);
    g.rotateX(-s * 0.35);
    mg.add(g, mats.paint, { at: [0, 1.28, s * (W / 2 - 0.06)] });
    mg.box(L - 0.4, 0.05, 0.4, mats.paint, { at: [0, 1.27, s * (W / 2 - 0.2)], r: 0.015 });
    for (const x of xs) wheelArch(mg, mats.accent, x, r, s * (W / 2 - 0.02), 0.5, r);
  }
  hatch(mg, mats, [xf - 1.95, top, 0.6], 0.3);
  for (const z of [0.3, 0.6, 0.9]) periscope(mg, mats, [xf - 1.6, top - 0.02, z]);
  // sensor mast turret (camera head, no weapon)
  const turret = group('turret', { parent: body, at: [-0.2, top, 0] });
  const tm = new Merge();
  tm.add(new THREE.CylinderGeometry(0.75, 0.82, 0.32, 30), mats.paint, { at: [0, 0.16, 0] });
  tm.add(lathe([[0.75, 0], [0.6, 0.18], [0.001, 0.2]], 30), mats.paint, { at: [0, 0.32, 0] });
  tm.tube([0.2, 0.4, 0], [0.2, 1.1, 0], 0.05, mats.iron, 10);
  tm.box(0.38, 0.28, 0.5, mats.paint, { at: [0.25, 1.24, 0], r: 0.05 });
  for (const z of [-0.12, 0.12]) tm.add(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16).rotateZ(PI / 2), mats.armourGlass, { at: [0.45, 1.25, z] });
  hatch(tm, mats, [-0.35, 0.32, 0], 0.25);
  tm.flush(turret, 'turret_body');
  ctx.turretMg = new Merge();
  turretClips(ctx, turret, null, { max: 1.6 });
  ctx.turret = turret;
  ctx.turretInfo = { frontX: 0.6, th: 0.32, w: 1.4, rearX: -0.7 };
  info.turretTop = 0.35;
  info.turretR = 0.8;
  antenna(mg, mats, [xr + 0.5, top, 1.0]);
  antenna(mg, mats, [xr + 0.5, top, -1.0], 1.6);
  grille(mg, mats, xf - 1.35, xf - 0.5, 1.63, -0.9, -0.2, 5);
  // rear ramp
  const ramp = group('ramp', { parent: body, at: [xr, 0.7, 0] });
  const rm = new Merge();
  rm.box(0.1, top - 0.85, W - 1.1, mats.paint, { at: [-0.05, (top - 0.85) / 2, 0], r: 0.03 });
  rm.box(0.04, 0.9, 0.5, mats.plain, { at: [-0.11, 0.75, 0.25], r: 0.01 });
  rm.flush(ramp, 'ramp_body');
  ctx.anims.push(clip('ramp', 5, [rotateTrack(ramp, 'z', 5, (t) => keys([[0, 0], [0.3, 1], [0.7, 1], [1, 0]])(t) * 1.4)]));
  for (const s of [1, -1]) {
    lamps.head.add(body, { at: [xf + 0.06, 1.15, s * (W / 2 - 0.75)], normal: [1, 0, 0], w: 0.16, h: 0.1 });
    lamps[s > 0 ? 'signalL' : 'signalR'].add(body, { at: [xf + 0.06, 1.15, s * (W / 2 - 0.58)], normal: [1, 0, 0], w: 0.07, h: 0.07, shape: 'round' });
    lamps.tail.add(body, { at: [xr - 0.08, 1.9, s * (W / 2 - 0.4)], normal: [-1, 0, 0], w: 0.08, h: 0.12 });
  }
  Object.assign(info, { tracked: false, xf, xr, W, deck: top, noseY: 1.0, sideY0: 1.3, sideY1: 1.75, sideX0: xr + 0.3, sideX1: xf - 1.5, sideZ: W / 2 - 0.2, roofY: top, rearDeck: [xr + 0.3, -1.1], belly: 0.48, flatRoof: [xr + 0.2, -1.2] });
}

function mrap(ctx, six) {
  const { mats, info, mg, lamps, body } = ctx;
  const L = six ? 7.6 : 6.4;
  const W = 2.55;
  const r = 0.62;
  const xs = six ? [2.75, -1.55, -2.95] : [2.25, -1.85];
  addWheels(ctx, xs, { r, w: 0.4, track: W - 0.4, steerN: 1 });
  const xf = L / 2;
  const xr = -L / 2;
  const top = 2.95;
  // V-shaped belly hull
  for (const s of [1, -1]) {
    const g = profile([[xr + 0.3, 0.55], [xf - 1.0, 0.55], [xf - 0.4, 0.95], [xr + 0.2, 0.95]], 0.9, 0.04);
    g.rotateX(s * 0.55);
    mg.add(g, mats.plain, { at: [0, 0.18, s * 0.33] });
  }
  // engine bonnet
  const cabX = xf - 1.55;
  mg.add(profile([[cabX, 0.95], [xf, 0.95], [xf, 1.55], [xf - 0.25, 1.75], [cabX, 1.82]], W - 0.35, 0.08), mats.paint);
  // grille
  mg.box(0.06, 0.45, W - 0.9, mats.black, { at: [xf + 0.01, 1.28, 0], r: 0.015 });
  for (let i = 0; i < 6; i++) mg.box(0.07, 0.03, W - 0.95, mats.accent, { at: [xf + 0.02, 1.08 + i * 0.075, 0], r: 0.008 });
  // crew + troop compartment
  mg.add(profile([[xr, 0.95], [cabX, 0.95], [cabX + 0.05, 1.82], [cabX - 0.35, top], [xr, top]], W - 0.08, 0.1), mats.paint);
  // windscreens + side windows
  for (const s of [1, -1]) {
    const g = new THREE.PlaneGeometry(0.75, 0.55);
    g.rotateY(PI / 2).rotateZ(0.3);
    mg.add(g, mats.armourGlass, { at: [cabX - 0.13, 2.4, s * 0.55] });
    mg.box(0.1, 0.65, 0.9, mats.accent, { at: [cabX - 0.17, 2.4, s * 0.55], rot: [0, 0, 0.3], r: 0.02 });
    mg.add(new THREE.PlaneGeometry(0.6, 0.45), mats.armourGlass, { at: [cabX - 0.8, 2.35, s * (W / 2 - 0.035)], rot: [0, s > 0 ? 0 : PI, 0] });
    mg.add(new THREE.PlaneGeometry(0.4, 0.4), mats.armourGlass, { at: [xr + 1.4, 2.35, s * (W / 2 - 0.035)], rot: [0, s > 0 ? 0 : PI, 0] });
    for (const x of xs) wheelArch(mg, mats.accent, x, r, s * (W / 2 - 0.05), 0.48, r);
    // door outlines + handles
    mg.box(1.0, 1.25, 0.03, mats.plain, { at: [cabX - 0.75, 1.75, s * (W / 2 - 0.02)], r: 0.01 });
    mg.box(0.18, 0.04, 0.05, mats.iron, { at: [cabX - 0.5, 1.75, s * (W / 2)], r: 0.01 });
    // step ladder under the door
    mg.box(0.5, 0.04, 0.2, mats.iron, { at: [cabX - 0.75, 0.75, s * (W / 2 - 0.08)], r: 0.01 });
    // mirrors
    mg.tube([cabX - 0.05, 2.2, s * (W / 2 - 0.05)], [cabX + 0.15, 2.3, s * (W / 2 + 0.25)], 0.018, mats.iron, 6);
    mg.box(0.06, 0.3, 0.2, mats.black, { at: [cabX + 0.17, 2.3, s * (W / 2 + 0.3)], r: 0.02 });
  }
  hatch(mg, mats, [xr + 1.6, top, 0], 0.35);
  antenna(mg, mats, [xr + 0.4, top, 1.0]);
  antenna(mg, mats, [cabX - 0.6, top, -1.0], 1.4);
  // rear door
  const door = group('rear_door', { parent: body, at: [xr - 0.04, 1.0, -0.6] });
  const dm = new Merge();
  dm.box(0.08, 1.8, 1.2, mats.paint, { at: [0, 0.9, 0.6], r: 0.03 });
  dm.add(new THREE.PlaneGeometry(0.35, 0.3).rotateY(-PI / 2), mats.armourGlass, { at: [-0.045, 1.4, 0.6] });
  dm.box(0.05, 0.05, 0.2, mats.iron, { at: [-0.06, 0.95, 1.0], r: 0.01 });
  dm.flush(door, 'rear_door_body');
  ctx.anims.push(clip('doors', 4, [rotateTrack(door, 'y', 4, (t) => keys([[0, 0], [0.25, 1], [0.75, 1], [1, 0]])(t) * 1.6)]));
  for (const s of [1, -1]) {
    lamps.head.add(body, { at: [xf + 0.08, 1.4, s * (W / 2 - 0.45)], normal: [1, 0, 0], w: 0.16, h: 0.12, shape: 'round' });
    lamps[s > 0 ? 'signalL' : 'signalR'].add(body, { at: [xf + 0.08, 1.4, s * (W / 2 - 0.3)], normal: [1, 0, 0], w: 0.07, h: 0.07, shape: 'round' });
    lamps.tail.add(body, { at: [xr - 0.1, 1.5, s * (W / 2 - 0.15)], normal: [-1, 0, 0], w: 0.08, h: 0.14 });
  }
  Object.assign(info, { tracked: false, xf, xr, W, deck: 1.82, noseY: 1.0, sideY0: 1.25, sideY1: 2.1, sideX0: xr + 0.2, sideX1: cabX - 0.2, sideZ: W / 2, roofY: top, rearDeck: [cabX + 0.1, xf - 0.4], belly: 0.55, flatRoof: [xr + 0.2, cabX - 0.4], wheeled: true });
}

function utility(ctx, kind) {
  const { mats, info, mg, lamps, body } = ctx;
  const P = { jeep: { L: 3.4, W: 1.6, r: 0.37, wb: 2.03 }, utility: { L: 4.85, W: 2.2, r: 0.47, wb: 3.3 }, pickup: { L: 5.3, W: 1.95, r: 0.42, wb: 3.1 } }[kind];
  const { L, W, r } = P;
  addWheels(ctx, [P.wb / 2 + (kind === 'pickup' ? 0.4 : 0.1), -P.wb / 2 + (kind === 'pickup' ? 0.4 : 0.1)], { r, w: r * 0.62, track: W - r * 0.55, steerN: 1 });
  const xf = L / 2;
  const xr = -L / 2;
  const fx = P.wb / 2 + (kind === 'pickup' ? 0.4 : 0.1);
  const rx = -P.wb / 2 + (kind === 'pickup' ? 0.4 : 0.1);
  let roofY;
  const bodyY = r + 0.12;
  // frame
  for (const s of [1, -1]) mg.box(L - 0.3, 0.14, 0.08, mats.iron, { at: [0, r, s * (W / 2 - 0.45)], r: 0.02 });
  if (kind === 'jeep') {
    // flat-sided open tub, bonnet, slatted grille, flat fenders
    const tubTop = 1.12;
    mg.add(profile([[xr, bodyY], [0.45, bodyY], [0.45, tubTop], [-0.6, tubTop], [-0.75, 0.98], [xr + 0.1, 0.98], [xr, 0.9]], W - 0.36, 0.04), mats.paint);
    mg.add(profile([[0.4, bodyY + 0.05], [xf - 0.05, bodyY + 0.05], [xf, bodyY + 0.12], [xf, 1.0], [0.4, 1.08]], 1.15, 0.05), mats.paint);
    for (const s of [1, -1]) {
      mg.add(profile([[fx - r - 0.2, bodyY + 0.22], [xf - 0.02, bodyY + 0.22], [xf - 0.02, bodyY + 0.27], [fx - r - 0.2, bodyY + 0.27]], 0.32, 0.015), mats.paint, { at: [0, 0, s * (W / 2 - 0.16)] });
      mg.box(0.45, 0.05, 0.32, mats.paint, { at: [rx, r + 0.4, s * (W / 2 - 0.16)], r: 0.012 });
      // seats
      mg.add(cushion(0.45, 0.12, 0.42, { bulge: 0.2 }), mats.canvasDark, { at: [-0.2, 0.82, s * 0.38] });
      mg.add(cushion(0.12, 0.45, 0.42, { bulge: 0.2 }), mats.canvasDark, { at: [-0.45, 1.05, s * 0.38], rot: [0, 0, 0.12] });
    }
    for (let i = -4; i <= 4; i++) mg.box(0.03, 0.42, 0.04, mats.black, { at: [xf + 0.01, 0.78, i * 0.1], r: 0.01 });
    // fold-up windscreen frame
    mg.add(roundedBox(0.05, 0.42, W - 0.3, 0.02, 2), mats.paint, { at: [0.42, 1.32, 0], rot: [0, 0, -0.12] });
    mg.add(new THREE.PlaneGeometry(W - 0.42, 0.32).rotateY(PI / 2), mats.glass, { at: [0.4, 1.32, 0], rot: [0, 0, -0.12] });
    mg.tube([0.1, 0.9, 0.38], [0.1, 1.1, 0.38], 0.012, mats.black, 6);
    mg.add(new THREE.TorusGeometry(0.17, 0.018, 8, 22).rotateX(PI / 2).rotateZ(0.5), mats.black, { at: [0.15, 1.12, 0.38] });
    // spare wheel on the back
    const sp = milWheel('spare', { radius: r, width: r * 0.6, side: -1, rimMat: mats.plain, hubMat: mats.iron });
    sp.steer.rotation.y = PI / 2;
    sp.steer.position.set(xr - 0.115, 0.95, 0.2);
    body.add(sp.steer);
    mg.box(0.12, 0.3, 0.15, mats.iron, { at: [xr - 0.03, 0.95, 0.2], r: 0.02 });
    jerryCan(mg, mats.jerry, [xr - 0.1, bodyY, -0.4], PI / 2);
    roofY = 1.12;
    for (const s of [1, -1]) {
      lamps.head.add(body, { at: [xf - 0.1, 0.88, s * 0.42], normal: [1, 0, 0], w: 0.14, h: 0.14, shape: 'round' });
      lamps.tail.add(body, { at: [xr - 0.01, 0.75, s * (W / 2 - 0.25)], normal: [-1, 0, 0], w: 0.06, h: 0.08 });
    }
    Object.assign(info, { xf, xr, W, deck: 1.02, noseY: 0.6, sideY0: 0.6, sideY1: 1.05, sideX0: xr + 0.1, sideX1: 0.4, sideZ: W / 2 - 0.18, roofY, rearDeck: [xr + 0.1, -0.7], belly: 0.4, flatRoof: null });
  } else {
    const cabX0 = kind === 'pickup' ? 0.0 : xr + 0.15;
    const cabX1 = kind === 'pickup' ? 1.2 : 0.85;
    roofY = kind === 'pickup' ? 1.95 : 1.88;
    const beltY = kind === 'pickup' ? 1.25 : 1.22;
    mg.add(profile([[xr, bodyY], [xf - 0.1, bodyY], [xf, bodyY + 0.15], [xf, beltY - 0.15], [cabX1 + 0.1, beltY], [xr, beltY]], W - 0.1, 0.07), mats.paint);
    // cab greenhouse
    const gw = W - 0.25;
    mg.add(profile([[cabX0, beltY - 0.02], [cabX1 + 0.05, beltY - 0.02], [cabX1 - 0.15, roofY - 0.06], [cabX0 + 0.05, roofY - 0.06]], gw, 0.05), mats.accent);
    mg.add(roundedBox(cabX1 - cabX0 - 0.1, 0.07, gw + 0.04, 0.03, 2), mats.paint, { at: [(cabX0 + cabX1) / 2 - 0.08, roofY - 0.035, 0] });
    for (const s of [1, -1]) {
      for (let i = 0; i < (kind === 'pickup' ? 2 : 2); i++) {
        const x0 = cabX0 + 0.12 + i * ((cabX1 - cabX0) / 2);
        mg.add(new THREE.PlaneGeometry((cabX1 - cabX0) / 2 - 0.22, roofY - beltY - 0.25), mats.glass, { at: [x0 + (cabX1 - cabX0) / 4 - 0.12, (roofY + beltY) / 2 - 0.02, s * (gw / 2 + 0.003)], rot: [0, s > 0 ? 0 : PI, 0] });
      }
      for (const x of [fx, rx]) wheelArch(mg, mats.accent, x, r, s * (W / 2 - 0.02), r * 0.8, r);
      mg.box(0.18, 0.035, 0.05, mats.iron, { at: [cabX1 - 0.35, beltY - 0.12, s * (W / 2 - 0.02)], r: 0.01 });
      mg.tube([cabX1 - 0.05, beltY + 0.05, s * gw / 2], [cabX1 + 0.12, beltY + 0.12, s * (W / 2 + 0.15)], 0.015, mats.iron, 6);
      mg.box(0.05, 0.22, 0.16, mats.black, { at: [cabX1 + 0.14, beltY + 0.15, s * (W / 2 + 0.2)], r: 0.02 });
    }
    const ws = new THREE.PlaneGeometry(gw - 0.15, (roofY - beltY) * 0.95);
    ws.rotateY(PI / 2).rotateZ(0.3);
    mg.add(ws, mats.glass, { at: [cabX1 - 0.04, (roofY + beltY) / 2 - 0.03, 0] });
    // grille + bumper with winch
    mg.box(0.05, 0.36, W - 0.7, mats.black, { at: [xf + 0.01, bodyY + 0.42, 0], r: 0.015 });
    mg.box(0.18, 0.2, W - 0.1, mats.iron, { at: [xf + 0.05, bodyY + 0.05, 0], r: 0.03 });
    mg.add(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 14).rotateX(PI / 2), mats.dark, { at: [xf + 0.12, bodyY + 0.07, 0] });
    if (kind === 'pickup') {
      // hollow cargo bed + roll bar
      const bx0 = xr + 0.05;
      const bx1 = cabX0 - 0.05;
      mg.box(bx1 - bx0, 0.05, W - 0.15, mats.plain, { at: [(bx0 + bx1) / 2, beltY - 0.48, 0], r: 0.01 });
      for (const s of [1, -1]) mg.box(bx1 - bx0, 0.5, 0.05, mats.paint, { at: [(bx0 + bx1) / 2, beltY - 0.22, s * (W / 2 - 0.08)], r: 0.015 });
      mg.box(0.05, 0.5, W - 0.15, mats.paint, { at: [bx0, beltY - 0.22, 0], r: 0.015 });
      const rbx = cabX0 - 0.15;
      mg.pipe([[rbx, beltY, 0.85], [rbx, beltY + 0.62, 0.82], [rbx, beltY + 0.7, 0], [rbx, beltY + 0.62, -0.82], [rbx, beltY, -0.85]], 0.04, mats.iron, 24, 8);
      jerryCan(mg, mats.jerry, [bx0 + 0.25, beltY - 0.45, 0.55], 0);
      jerryCan(mg, mats.jerry, [bx0 + 0.25, beltY - 0.45, 0.33], 0);
      Object.assign(info, { rearDeck: [bx0 + 0.5, bx1 - 0.2], deckY2: beltY - 0.45 });
    } else {
      // rear cargo hatch, tail plate
      mg.box(0.04, 0.6, W - 0.5, mats.plain, { at: [xr - 0.085, beltY - 0.35, 0], r: 0.01 });
      Object.assign(info, { rearDeck: [xr + 0.2, cabX0 + 0.6] });
    }
    for (const s of [1, -1]) {
      lamps.head.add(body, { at: [xf + 0.07, bodyY + 0.42, s * (W / 2 - 0.22)], normal: [1, 0, 0], w: 0.16, h: 0.12 });
      lamps[s > 0 ? 'signalL' : 'signalR'].add(body, { at: [xf + 0.07, bodyY + 0.28, s * (W / 2 - 0.22)], normal: [1, 0, 0], w: 0.07, h: 0.05 });
      lamps.tail.add(body, { at: [xr - 0.07, beltY - 0.2, s * (W / 2 - 0.12)], normal: [-1, 0, 0], w: 0.06, h: 0.15 });
    }
    Object.assign(info, { xf, xr, W, deck: beltY, noseY: bodyY + 0.2, sideY0: bodyY + 0.15, sideY1: beltY - 0.05, sideX0: xr + 0.2, sideX1: cabX1 - 0.1, sideZ: W / 2, roofY, flatRoof: [cabX0 + 0.1, cabX1 - 0.3], belly: bodyY });
  }
  info.wheeled = true;
  info.light = true;
}

/** 6x6 conventional truck cab + chassis. Returns geometry info for the body builder. */
function truckChassis(ctx, { L = 8.2, W = 2.5, r = 0.56 } = {}) {
  const { mats, mg, lamps, body } = ctx;
  const xf = L / 2;
  const xs = [xf - 1.25, -1.1, -2.55];
  addWheels(ctx, xs, { r, w: 0.38, track: W - 0.4, steerN: 1 });
  const fy = r + 0.05;
  for (const s of [1, -1]) mg.box(L - 0.3, 0.26, 0.1, mats.iron, { at: [-0.05, fy, s * 0.45], r: 0.02 });
  for (let x = -L / 2 + 0.4; x < xf - 0.5; x += 1.1) mg.box(0.08, 0.2, 0.9, mats.iron, { at: [x, fy, 0], r: 0.02 });
  // bonnet + cab
  const cab0 = xf - 3.2;
  const cab1 = xf - 1.75;
  const roofY = 2.85;
  mg.add(profile([[cab1, fy + 0.15], [xf - 0.05, fy + 0.15], [xf, fy + 0.3], [xf, 1.65], [xf - 0.15, 1.75], [cab1, 1.82]], 1.5, 0.08), mats.paint);
  for (const s of [1, -1]) {
    mg.add(profile([[xf - 2.0, fy + 0.25], [xf - 0.2, fy + 0.25], [xf + 0.05, 1.05], [xf + 0.05, 1.12], [xf - 2.1, 1.12]], 0.45, 0.03), mats.paint, { at: [0, 0, s * (W / 2 - 0.23)] });
    mg.box(0.06, 0.25, 0.4, mats.black, { at: [xf - 0.95, 1.0, s * (W / 2 - 0.23)], r: 0.01 });
  }
  mg.box(0.07, 0.6, 1.2, mats.black, { at: [xf + 0.01, 1.3, 0], r: 0.02 });
  for (let i = 0; i < 7; i++) mg.box(0.08, 0.035, 1.2, mats.accent, { at: [xf + 0.02, 1.05 + i * 0.08, 0], r: 0.008 });
  mg.box(0.22, 0.24, W, mats.iron, { at: [xf + 0.1, fy + 0.15, 0], r: 0.04 });
  mg.add(profile([[cab0, fy + 0.2], [cab1 + 0.02, fy + 0.2], [cab1 + 0.02, 1.85], [cab1 - 0.12, roofY], [cab0, roofY]], W - 0.1, 0.08), mats.paint);
  const ws = new THREE.PlaneGeometry(W - 0.5, 0.75);
  ws.rotateY(PI / 2).rotateZ(0.12);
  mg.add(ws, mats.glass, { at: [cab1 - 0.02, 2.33, 0] });
  for (const s of [1, -1]) {
    mg.add(new THREE.PlaneGeometry(0.8, 0.6), mats.glass, { at: [(cab0 + cab1) / 2 + 0.05, 2.35, s * (W / 2 - 0.045)], rot: [0, s > 0 ? 0 : PI, 0] });
    mg.box(0.2, 0.04, 0.05, mats.iron, { at: [cab0 + 0.4, 1.95, s * (W / 2 - 0.04)], r: 0.01 });
    mg.box(0.6, 0.04, 0.25, mats.iron, { at: [(cab0 + cab1) / 2, 0.85, s * (W / 2 - 0.1)], r: 0.01 });
    mg.tube([cab1, 2.3, s * (W / 2 - 0.05)], [cab1 + 0.15, 2.4, s * (W / 2 + 0.25)], 0.018, mats.iron, 6);
    mg.box(0.06, 0.38, 0.22, mats.black, { at: [cab1 + 0.17, 2.4, s * (W / 2 + 0.3)], r: 0.02 });
    lamps.head.add(body, { at: [xf + 0.08, 1.1, s * (W / 2 - 0.23)], normal: [1, 0, 0], w: 0.16, h: 0.16, shape: 'round' });
    lamps[s > 0 ? 'signalL' : 'signalR'].add(body, { at: [xf - 0.15, 1.13, s * (W / 2 - 0.05)], normal: [1, 0, 0], w: 0.06, h: 0.05 });
    lamps.tail.add(body, { at: [-L / 2, fy + 0.05, s * (W / 2 - 0.2)], normal: [-1, 0, 0], w: 0.1, h: 0.08 });
    for (const x of xs) wheelArch(mg, mats.accent, x, r, s * (W / 2 - 0.04), 0.42, r);
  }
  mg.box(0.15, 0.16, W - 0.2, mats.iron, { at: [-L / 2 + 0.075, fy + 0.05, 0], r: 0.02 });
  mg.box(0.25, 0.12, 0.08, mats.iron, { at: [-L / 2, fy, 0.6], r: 0.02 });
  mg.box(0.25, 0.12, 0.08, mats.iron, { at: [-L / 2, fy, -0.6], r: 0.02 });
  hatch(mg, mats, [cab0 + 0.5, roofY, -0.4], 0.3);
  antenna(mg, mats, [cab0 + 0.2, roofY, 0.8]);
  // exhaust stack behind the cab
  mg.tube([cab0 - 0.08, 1.1, -W / 2 + 0.2], [cab0 - 0.08, roofY + 0.25, -W / 2 + 0.2], 0.06, mats.dark, 12);
  return { xf, xr: -L / 2, W, fy, cab0, cab1, roofY, bedY: fy + 0.18, r };
}

function militaryTruck(ctx, kind) {
  const { mats, info, mg, body } = ctx;
  const c = truckChassis(ctx);
  const { xr, W, cab0, roofY, bedY } = c;
  const b0 = xr + 0.05;
  const b1 = cab0 - 0.12;
  const bm = (b0 + b1) / 2;
  const bl = b1 - b0;
  let deck = bedY + 0.1;
  if (kind === 'cargo') {
    // hollow cargo bed with drop sides, hoops + canvas cover
    mg.box(bl, 0.08, W, mats.wood, { at: [bm, bedY + 0.04, 0], r: 0.01 });
    for (const s of [1, -1]) mg.box(bl, 0.55, 0.05, mats.paint, { at: [bm, bedY + 0.35, s * (W / 2 - 0.025)], r: 0.015 });
    mg.box(0.05, 0.55, W, mats.paint, { at: [b1 - 0.02, bedY + 0.35, 0], r: 0.015 });
    const tailgate = group('tailgate', { parent: body, at: [b0, bedY + 0.08, 0] });
    const tg = new Merge();
    tg.box(0.05, 0.55, W - 0.08, mats.paint, { at: [0, 0.275, 0], r: 0.015 });
    tg.flush(tailgate, 'tailgate_body');
    const hH = 1.85;
    const arch = [];
    const N = 12;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * PI;
      arch.push([Math.cos(a) * (W / 2), bedY + 0.62 + hH - 0.55 - 0.25 + Math.sin(a) * 0.25 * (1 + 0)]);
    }
    const shape = [[W / 2 + 0.02, bedY + 0.3], ...arch.map(([z, y]) => [z * 1.01, y + 0.02]), [-W / 2 - 0.02, bedY + 0.3]];
    const inner = [[W / 2 - 0.03, bedY + 0.3], ...arch.map(([z, y]) => [z * 0.97, y - 0.03]), [-W / 2 + 0.03, bedY + 0.3]];
    const sh = new THREE.Shape(shape.map(([z, y]) => new THREE.Vector2(z, y)));
    sh.holes.push(new THREE.Path(inner.slice().reverse().map(([z, y]) => new THREE.Vector2(z, y))));
    const canvas = extrudeOutline(sh, bl - 0.05, { bevel: 0.02, segments: 2 });
    canvas.rotateY(PI / 2);
    mg.add(canvas, mats.canvas, { at: [bm + 0.02, 0, 0] });
    // front end of the cover closed, rear open with roll
    mg.add(extrudeOutline(new THREE.Shape(shape.map(([z, y]) => new THREE.Vector2(z, y))), 0.03, { bevel: 0.01 }).rotateY(PI / 2), mats.canvas, { at: [b1 - 0.03, 0, 0] });
    for (let i = 0; i < 4; i++) mg.add(new THREE.TorusGeometry(W / 2 + 0.02, 0.012, 4, 20, PI).rotateY(PI / 2), mats.canvasDark, { at: [b0 + 0.3 + i * (bl - 0.6) / 3, bedY + 0.62 + hH - 0.8 - 0.25 + 0.27, 0], scale: [1, 0.25 / (W / 2) * 1.02, 1] });
    for (const s of [1, -1]) for (let i = 0; i < 6; i++) mg.add(new THREE.TorusGeometry(0.03, 0.006, 4, 8), mats.iron, { at: [b0 + 0.3 + i * (bl - 0.6) / 5, bedY + 0.42, s * (W / 2 + 0.025)] });
    mg.add(new THREE.CylinderGeometry(0.1, 0.1, W - 0.2, 14).rotateX(PI / 2), mats.canvasDark, { at: [b0 + 0.02, bedY + 0.62 + hH - 0.8 + 0.02, 0] });
    deck = bedY + hH + 0.05;
    ctx.anims.push(clip('tailgate', 4, [rotateTrack(tailgate, 'z', 4, (t) => keys([[0, 0], [0.3, 1], [0.7, 1], [1, 0]])(t) * 1.55)]));
    Object.assign(info, { flatRoof: [b0 + 0.2, b1 - 0.2], roofY: deck - 0.02, canvasRoof: true });
  } else if (kind === 'fuel-tanker') {
    const tr = 0.82;
    const tank = lathe([[0.001, 0], [tr * 0.8, 0.02], [tr * 0.98, 0.12], [tr, 0.3], [tr, bl - 0.6], [tr * 0.98, bl - 0.42], [tr * 0.8, bl - 0.32], [0.001, bl - 0.3]], 32);
    tank.rotateZ(-PI / 2).scale(1, 0.85, 1.25);
    mg.add(tank, mats.paint, { at: [b0 + 0.15, bedY + 0.2 + tr * 0.85, 0] });
    for (let i = 0; i < 3; i++) {
      const x = b0 + 0.9 + i * (bl - 1.5) / 2;
      mg.add(new THREE.TorusGeometry(tr * 1.0, 0.035, 6, 30).rotateY(PI / 2), mats.accent, { at: [x, bedY + 0.2 + tr * 0.85, 0], scale: [1, 0.86, 1.26] });
      mg.add(new THREE.CylinderGeometry(0.2, 0.22, 0.1, 18), mats.iron, { at: [x, bedY + 0.2 + tr * 1.7 + 0.03, 0] });
      mg.box(0.55, 0.42, 0.12, mats.iron, { at: [x, bedY + 0.23, 0], r: 0.02 });
    }
    // walkway + rails
    mg.box(bl - 1.0, 0.03, 0.5, mats.iron, { at: [bm, bedY + 0.2 + tr * 1.7 + 0.02, 0], r: 0.01 });
    for (const s of [1, -1]) mg.pipe([[b0 + 0.6, bedY + 0.2 + tr * 1.7, s * 0.3], [b0 + 0.6, bedY + 0.55 + tr * 1.7, s * 0.3], [b1 - 0.6, bedY + 0.55 + tr * 1.7, s * 0.3], [b1 - 0.6, bedY + 0.2 + tr * 1.7, s * 0.3]], 0.018, mats.iron, 20, 6);
    // hose cabinet + reels at the rear
    mg.box(0.5, 0.6, W - 0.2, mats.plain, { at: [b0 - 0.05, bedY + 0.1, 0], r: 0.03 });
    for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.22, 0.22, 0.25, 20).rotateX(PI / 2), mats.black, { at: [b0 - 0.05, bedY + 0.15, s * 0.5] });
    for (const s of [1, -1]) mg.box(bl - 0.4, 0.04, 0.3, mats.iron, { at: [bm, bedY + 0.05, s * (W / 2 - 0.15)], r: 0.01 });
    deck = bedY + 0.2 + tr * 1.7 + 0.04;
    Object.assign(info, { flatRoof: null, roofY });
  } else if (kind === 'recovery') {
    mg.box(bl, 0.12, W, mats.plain, { at: [bm, bedY + 0.06, 0], r: 0.02 });
    // crane on a slewing base at the rear
    const slew = group('crane', { parent: body, at: [b0 + 1.0, bedY + 0.12, 0] });
    const sm = new Merge();
    sm.add(new THREE.CylinderGeometry(0.55, 0.6, 0.35, 24), mats.paint, { at: [0, 0.175, 0] });
    sm.box(0.8, 0.6, 0.7, mats.paint, { at: [0.15, 0.6, 0], r: 0.05 });
    sm.flush(slew, 'crane_base');
    const boom = group('boom', { parent: slew, at: [0.3, 0.8, 0] });
    const bmm = new Merge();
    bmm.box(3.3, 0.38, 0.36, mats.paint, { at: [1.55, 0, 0], r: 0.04 });
    bmm.box(1.4, 0.28, 0.28, mats.plain, { at: [3.6, 0, 0], r: 0.03 });
    bmm.add(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 16).rotateX(PI / 2), mats.iron, { at: [4.25, 0, 0] });
    bmm.tube([4.25, -0.12, 0], [4.25, -0.75, 0], 0.012, mats.black, 4);
    bmm.add(new THREE.TorusGeometry(0.06, 0.02, 6, 12, PI * 1.5), mats.iron, { at: [4.25, -0.82, 0] });
    bmm.flush(boom, 'boom_body');
    boom.rotation.z = PI - 0.25;
    ctx.anims.push(poseClip('crane', 8, [slew, boom], [], (t) => {
      const k = keys([[0, 0], [0.25, 1], [0.6, 1], [0.85, 0], [1, 0]])(t);
      boom.rotation.z = PI - 0.25 - k * 0.45;
      slew.rotation.y = Math.sin(t * PI * 2) * 0.6 * k;
    }, 40));
    // rear spade + winch + spare wheel + tool boxes
    mg.box(0.12, 0.8, W - 0.3, mats.paint, { at: [xr - 0.06, 0.6, 0], rot: [0, 0, 0.35], r: 0.03 });
    mg.add(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 18).rotateX(PI / 2), mats.dark, { at: [b1 - 0.6, bedY + 0.32, 0] });
    for (const s of [1, -1]) mg.box(1.6, 0.55, 0.45, mats.paint, { at: [bm + 0.6, bedY + 0.4, s * (W / 2 - 0.25)], r: 0.04 });
    const sp = milWheel('spare', { radius: c.r, width: 0.38, side: 1, rimMat: mats.plain, hubMat: mats.iron });
    sp.steer.rotation.x = PI / 2;
    sp.steer.position.set(bm + 0.4, bedY + 0.12 + 0.19, 0);
    body.add(sp.steer);
    deck = bedY + 0.12;
    Object.assign(info, { flatRoof: null, roofY });
  } else {
    // ambulance shelter body
    const sh = 2.1;
    mg.add(roundedBox(bl, sh, W, 0.06, 3), mats.paint, { at: [bm, bedY + 0.1 + sh / 2, 0] });
    mg.box(bl, 0.1, W - 0.2, mats.iron, { at: [bm, bedY + 0.05, 0], r: 0.02 });
    for (const s of [1, -1]) {
      mg.box(0.9, 0.9, 0.012, mats.whitePaint, { at: [bm, bedY + 1.25, s * (W / 2 + 0.006)], r: 0.004 });
      mg.box(0.62, 0.18, 0.016, mats.red, { at: [bm, bedY + 1.25, s * (W / 2 + 0.008)], r: 0.004 });
      mg.box(0.18, 0.62, 0.016, mats.red, { at: [bm, bedY + 1.25, s * (W / 2 + 0.008)], r: 0.004 });
      mg.add(new THREE.PlaneGeometry(0.5, 0.35), mats.glass, { at: [b1 - 0.6, bedY + 1.5, s * (W / 2 + 0.003)], rot: [0, s > 0 ? 0 : PI, 0] });
    }
    mg.box(0.012, 0.6, 0.6, mats.whitePaint, { at: [bm, bedY + 0.1 + sh + 0.006, 0], r: 0.003, rot: [0, 0, PI / 2] });
    mg.box(0.016, 0.42, 0.13, mats.red, { at: [bm, bedY + 0.1 + sh + 0.008, 0], rot: [0, 0, PI / 2], r: 0.004 });
    mg.box(0.016, 0.13, 0.42, mats.red, { at: [bm, bedY + 0.1 + sh + 0.008, 0], rot: [0, 0, PI / 2], r: 0.004 });
    // rear doors
    for (const s of [1, -1]) {
      const d = group(`door_${s > 0 ? 'L' : 'R'}`, { parent: body, at: [b0, bedY + 0.2, s * (W / 2 - 0.06)] });
      const dm = new Merge();
      dm.box(0.05, sh - 0.25, W / 2 - 0.1, mats.plain, { at: [-0.024, (sh - 0.25) / 2, -s * (W / 4 - 0.05)], r: 0.015 });
      dm.add(new THREE.PlaneGeometry(0.4, 0.3).rotateY(-PI / 2), mats.glass, { at: [-0.06, sh - 0.6, -s * (W / 4 - 0.05)] });
      dm.flush(d, `door_${s > 0 ? 'L' : 'R'}_body`);
      ctx.doors.push({ node: d, s });
    }
    ctx.anims.push(clip('doors', 4, ctx.doors.map(({ node, s }) => rotateTrack(node, 'y', 4, (t) => keys([[0, 0], [0.25, 1], [0.75, 1], [1, 0]])(t) * 1.7 * s))));
    mg.box(0.5, 0.05, 1.0, mats.iron, { at: [b0 - 0.3, bedY - 0.25, 0], r: 0.01 });
    const beacon = lampGroup('beacon', 'blue');
    ctx.lamps.beacon = beacon;
    for (const s of [1, -1]) {
      mg.add(new THREE.CylinderGeometry(0.09, 0.1, 0.05, 14), mats.dark, { at: [b1 - 0.2, bedY + 0.1 + sh + 0.025, s * 0.85] });
      beacon.add(body, { geometry: new THREE.SphereGeometry(0.08, 14, 8, 0, PI * 2, 0, PI / 2).scale(1, 1.4, 1).translate(b1 - 0.2, bedY + 0.1 + sh + 0.05, s * 0.85), normal: [0, 1, 0], depth: 0.04, w: 0.16, h: 0.16, glowSize: 0.6 });
    }
    deck = bedY + 0.1 + sh;
    Object.assign(info, { flatRoof: [b0 + 0.2, b1 - 0.2], roofY: deck });
  }
  Object.assign(info, { xf: c.xf, xr, W, deck: bedY + 0.1, noseY: 1.0, sideY0: 0.75, sideY1: 1.75, sideX0: cab0 + 0.1, sideX1: c.cab1 - 0.1, sideZ: W / 2 - 0.05, belly: c.fy, wheeled: true, truck: true, rearDeck: null, cabRoof: [cab0 + 0.1, c.cab1 - 0.2, roofY] });
  if (!info.roofY) info.roofY = roofY;
}

/* ------------------------------------------------------------------ */
/* Bridge layer + radar trailer                                         */
/* ------------------------------------------------------------------ */

function scissorBridge(ctx, { x0, x1, y, w }) {
  const { mats, body } = ctx;
  const len = x1 - x0;
  const h = 0.32;
  const bottom = group('bridge_low', { parent: body, at: [x1, y, 0] });
  const top = group('bridge_top', { parent: bottom, at: [0, h, 0] });
  const half = (mgx, flip) => {
    for (const s of [1, -1]) {
      // two treadways with ramped ends
      mgx.add(profile([[-len, 0], [-0.4, 0], [0, h * 0.5], [0, h], [-len + 0.5, h], [-len, h * 0.4]], 1.4, 0.03), mats.paint, { at: [0, flip ? 0 : 0, s * (w / 2 - 0.7)] });
      for (let i = 0; i < 10; i++) mgx.box(0.06, 0.03, 1.35, mats.accent, { at: [-0.4 - i * ((len - 0.8) / 9), h + 0.015, s * (w / 2 - 0.7)], r: 0.01 });
    }
    mgx.box(len - 0.6, h * 0.5, w - 2.8, mats.plain, { at: [-len / 2, h * 0.4, 0], r: 0.03 });
  };
  const bm = new Merge();
  half(bm, false);
  bm.flush(bottom, 'bridge_low_body');
  // upper half lies on top, flipped (hinged at the front end)
  const inner = group('bridge_top_shell', { parent: top });
  const tm = new Merge();
  half(tm, true);
  tm.flush(inner, 'bridge_top_body');
  // hinge knuckles
  const km = new Merge();
  for (const s of [1, -1]) km.add(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 14).rotateX(PI / 2), mats.iron, { at: [0.02, 0, s * (w / 2 - 0.7)] });
  km.flush(top, 'bridge_hinge');
  ctx.anims.push(poseClip('deploy', 10, [bottom, top], [], (t) => {
    const lift = keys([[0, 0], [0.25, 1], [0.75, 1], [1, 0]])(t);
    const unfold = keys([[0, 0], [0.25, 0], [0.5, 1], [0.6, 1], [0.75, 0], [1, 0]])(t);
    bottom.rotation.z = lift * 0.55;
    top.rotation.z = -unfold * PI * 0.98;
  }, 60));
  return { top: y + h * 2 };
}

function bridgeLayer(ctx, kind) {
  const { mats, info, mg } = ctx;
  if (kind === 'tracked') {
    const L = 7.9;
    const W = 3.6;
    const P = { L, W, tw: 0.62, roadR: 0.36, wheels: 7, idlerR: 0.32, sprR: 0.34, idlerY: 0.8, sprY: 0.82, returns: 3, topY: 1.13, wheelStyle: 'disc' };
    trackedRunningGear(ctx, { ...P, x0: -L / 2 + 0.4, x1: L / 2 - 0.45 });
    const h = tankHull(ctx, { L, W, tw: P.tw, sponson: 1.23, deck: 1.62, glacisX: 2.4, nose: 0.93, skirts: true, skirtY0: 0.47 });
    // launcher frame on the nose + cab box
    mg.box(0.5, 0.5, 2.2, mats.plain, { at: [h.xf - 0.5, 1.75, 0], r: 0.05 });
    mg.box(1.6, 0.55, 1.1, mats.paint, { at: [1.4, 1.9, 1.0], r: 0.06 });
    for (const z of [0.7, 1.0, 1.3]) periscope(mg, mats, [2.2, 2.15, z]);
    hatch(mg, mats, [1.2, 2.17, 1.0], 0.28);
    for (const x of [-2.5, -0.8, 0.6]) for (const s of [1, -1]) mg.box(0.3, 0.38, 0.3, mats.iron, { at: [x, 1.81, s * 1.2], r: 0.03 });
    const b = scissorBridge(ctx, { x0: -L / 2 - 0.4, x1: h.xf - 0.4, y: 2.0, w: W + 0.3 });
    Object.assign(info, { tracked: true, xf: h.xf, xr: h.xr, W, deck: 1.62, noseY: 0.93, sideY0: 0.47, sideY1: 1.27, sideX0: h.xr + 0.3, sideX1: h.xf - 0.6, sideZ: W / 2 + 0.05, roofY: b.top, rearDeck: null, belly: 0.45, trackW: P.tw, noRoof: true });
  } else {
    const c = truckChassis(ctx, { L: 9.4, W: 2.55, r: 0.58 });
    mg.box(c.cab0 - c.xr - 0.1, 0.25, 2.2, mats.plain, { at: [(c.cab0 + c.xr) / 2, c.bedY + 0.12, 0], r: 0.03 });
    mg.box(0.4, 0.8, 2.3, mats.paint, { at: [c.cab0 - 0.3, c.bedY + 0.62, 0], r: 0.04 });
    const b = scissorBridge(ctx, { x0: c.xr - 0.3, x1: c.cab0 - 0.55, y: c.bedY + 0.25, w: 3.2 });
    Object.assign(info, { xf: c.xf, xr: c.xr, W: c.W, deck: c.bedY + 0.1, noseY: 1.0, sideY0: 0.75, sideY1: 1.7, sideX0: c.cab0 + 0.1, sideX1: c.cab1 - 0.1, sideZ: c.W / 2 - 0.05, roofY: b.top, belly: c.fy, wheeled: true, truck: true, rearDeck: null, noRoof: true, cabRoof: [c.cab0 + 0.1, c.cab1 - 0.2, c.roofY] });
  }
}

function radarTrailer(ctx, kind) {
  const { mats, info, mg, body } = ctx;
  const L = 4.6;
  const W = 2.3;
  const r = 0.5;
  addWheels(ctx, [-0.4], { r, w: 0.34, track: W - 0.35, steerN: 0 });
  const fy = r + 0.05;
  for (const s of [1, -1]) mg.box(L - 0.4, 0.2, 0.1, mats.iron, { at: [-0.3, fy, s * 0.65], r: 0.02 });
  mg.box(L - 0.6, 0.06, W - 0.1, mats.plain, { at: [-0.3, fy + 0.13, 0], r: 0.015 });
  // drawbar + jockey wheel
  mg.pipe([[1.4, fy, 0.65], [2.6, fy - 0.05, 0.1], [2.8, fy - 0.05, 0]], 0.05, mats.iron, 16, 8);
  mg.pipe([[1.4, fy, -0.65], [2.6, fy - 0.05, -0.1], [2.8, fy - 0.05, 0]], 0.05, mats.iron, 16, 8);
  mg.add(new THREE.TorusGeometry(0.08, 0.025, 8, 16), mats.iron, { at: [2.95, fy - 0.05, 0], rot: [PI / 2, 0, 0] });
  mg.tube([2.3, fy, 0.25], [2.3, 0.12, 0.25], 0.035, mats.iron, 8);
  mg.add(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16).rotateX(PI / 2), mats.rubber, { at: [2.3, 0.12, 0.25] });
  // levelling jacks
  for (const [x, z] of [[1.5, 1.0], [1.5, -1.0], [-2.3, 1.0], [-2.3, -1.0]]) {
    mg.tube([x, fy + 0.1, z], [x, 0.04, z], 0.04, mats.iron, 8);
    mg.add(new THREE.CylinderGeometry(0.14, 0.16, 0.04, 14), mats.iron, { at: [x, 0.02, z] });
    mg.box(0.1, 0.1, 0.4, mats.iron, { at: [x, fy, z * 0.8], r: 0.02 });
  }
  for (const s of [1, -1]) wheelArch(mg, mats.accent, -0.4, r, s * (W / 2 - 0.05), 0.38, r);
  // equipment shelter with console
  const sx0 = 0.2;
  const sx1 = 1.6;
  mg.add(roundedBox(sx1 - sx0, 1.1, W - 0.3, 0.05, 3), mats.paint, { at: [(sx0 + sx1) / 2, fy + 0.16 + 0.55, 0], scale: 1 });
  mg.box(0.03, 0.8, 0.8, mats.plain, { at: [sx1 + 0.01, fy + 0.7, 0.3], r: 0.01 });
  for (let i = 0; i < 5; i++) mg.box(0.035, 0.03, 0.6, mats.black, { at: [sx1 + 0.02, fy + 0.45 + i * 0.1, -0.5], r: 0.005 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3).rotateY(PI / 2), screenMat('radar'));
  scr.name = 'screen';
  scr.position.set(sx1 + 0.035, fy + 0.85, 0.3);
  body.add(scr);
  ctx.anims.push(clip('screen', 1, [new THREE.NumberKeyframeTrack('screen.material.emissiveIntensity', [0, 0.5, 1], [1.2, 0.8, 1.2])]));
  const baseY = fy + 0.16;
  const head = group('radar_head', { parent: body, at: [-1.2, baseY, 0] });
  const hm = new Merge();
  let headTop;
  if (kind === 'rotating-array') {
    mg.add(new THREE.CylinderGeometry(0.5, 0.6, 0.5, 24), mats.paint, { at: [-1.2, baseY + 0.25, 0] });
    hm.add(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 20), mats.plain, { at: [0, 0.62, 0] });
    hm.tube([0, 0.7, 0], [0, 1.0, 0], 0.12, mats.iron, 12);
    const panel = roundedBox(0.25, 1.4, 2.6, 0.04, 2);
    panel.rotateZ(-0.3);
    hm.add(panel, mats.paint, { at: [0.08, 1.55, 0] });
    for (let i = 0; i < 6; i++) hm.box(0.02, 1.25, 0.03, mats.accent, { at: [0.22 - 0.0, 1.55, -1.1 + i * 0.44], rot: [0, 0, -0.3], r: 0.005 });
    hm.box(0.4, 0.2, 0.4, mats.plain, { at: [-0.12, 1.0, 0], r: 0.03 });
    headTop = 2.4;
  } else if (kind === 'dish') {
    mg.add(new THREE.CylinderGeometry(0.45, 0.55, 0.45, 24), mats.paint, { at: [-1.2, baseY + 0.22, 0] });
    hm.box(0.3, 0.8, 0.12, mats.plain, { at: [0, 0.85, 0.5], r: 0.03 });
    hm.box(0.3, 0.8, 0.12, mats.plain, { at: [0, 0.85, -0.5], r: 0.03 });
    hm.add(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 20), mats.plain, { at: [0, 0.55, 0] });
    const dish = lathe([[0.001, 0], [0.4, 0.03], [0.8, 0.12], [1.1, 0.25], [1.12, 0.3], [1.08, 0.3], [0.78, 0.17], [0.4, 0.08], [0.001, 0.05]], 40);
    dish.rotateZ(-PI / 2 + 0.5);
    hm.add(dish, mats.whitePaint, { at: [0.1, 1.25, 0] });
    hm.tube([0.1, 1.25, 0], [0.75, 1.6, 0], 0.02, mats.iron, 6);
    hm.add(new THREE.CylinderGeometry(0.06, 0.04, 0.15, 12).rotateZ(-PI / 2 + 0.5), mats.dark, { at: [0.78, 1.62, 0] });
    hm.tube([0, 0.85, 0.44], [0.1, 1.25, 0.3], 0.04, mats.iron, 8);
    hm.tube([0, 0.85, -0.44], [0.1, 1.25, -0.3], 0.04, mats.iron, 8);
    headTop = 2.4;
  } else {
    // telescopic mast: lower stage on the trailer, upper stage + antenna array raise
    mg.add(new THREE.CylinderGeometry(0.22, 0.28, 1.6, 18), mats.paint, { at: [-1.2, baseY + 0.8, 0] });
    for (const s of [1, -1]) mg.tube([-1.2, baseY + 1.5, 0], [-1.2 + s * 0.8, baseY, s * 0.6], 0.03, mats.iron, 8);
    hm.add(new THREE.CylinderGeometry(0.16, 0.16, 2.0, 16), mats.plain, { at: [0, 1.6, 0] });
    hm.add(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 14), mats.plain, { at: [0, 2.85, 0] });
    hm.box(0.12, 0.9, 1.6, mats.whitePaint, { at: [0.1, 3.4, 0], r: 0.03 });
    hm.box(0.12, 0.9, 1.6, mats.whitePaint, { at: [-0.1, 3.4, 0], r: 0.03, rot: [0, PI, 0] });
    hm.box(0.34, 0.04, 0.5, mats.plain, { at: [0, 3.87, 0], r: 0.01 });
    hm.add(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), mats.black, { at: [0, 4.4, 0] });
    headTop = 4.9;
  }
  hm.flush(head, 'radar_head_body');
  if (kind === 'mast') {
    ctx.anims.push(clip('mast', 8, [new THREE.VectorKeyframeTrack('radar_head.position', [0, 2, 4, 6, 8], [-1.2, baseY, 0, -1.2, baseY + 1.6, 0, -1.2, baseY + 1.6, 0, -1.2, baseY, 0, -1.2, baseY, 0])]));
    ctx.anims.push(clip('scan', 6, [rotateTrack(head, 'y', 6, (t) => Math.sin(t * PI * 2) * 1.2)]));
  } else ctx.anims.push(clip('scan', kind === 'dish' ? 6 : 3, [rotateTrack(head, 'y', kind === 'dish' ? 6 : 3, (t) => (kind === 'dish' ? Math.sin(t * PI * 2) * 1.4 : t * PI * 2))]));
  for (const s of [1, -1]) ctx.lamps.tail.add(body, { at: [-L / 2 - 0.2, fy, s * (W / 2 - 0.2)], normal: [-1, 0, 0], w: 0.1, h: 0.07 });
  mg.box(0.1, 0.12, W - 0.2, mats.iron, { at: [-L / 2 - 0.15, fy, 0], r: 0.02 });
  Object.assign(info, { xf: 2.9, xr: -L / 2 - 0.2, W, deck: baseY, roofY: baseY + headTop, trailer: true, wheeled: true, noRoof: true });
}

/* ------------------------------------------------------------------ */
/* Camo theatre kits + add-on parts                                     */
/* ------------------------------------------------------------------ */

function camoKit(ctx) {
  const { camo, mats, info, body } = ctx;
  if (camo === 'standard') return;
  const mg = new Merge();
  const tm = ctx.turretMg ?? mg;
  const roofY = info.flatRoof ? info.roofY : info.deck;
  const deckX = info.rearDeck ?? [info.xr + 0.3, info.xr + 1.2];
  const W = info.W;
  const ti = ctx.turretInfo;
  const tTop = info.turretTop ?? 0;
  if (camo === 'woodland') {
    // foliage bundles + rolled cam-net
    const pts = [[deckX[0] + 0.3, info.deck, W * 0.3], [deckX[1] - 0.2, info.deck, -W * 0.3], [info.xf - 0.6, info.noseY + 0.1, W * 0.35]];
    if (info.flatRoof && !info.noRoof) pts.push([info.flatRoof[0] + 0.4, roofY, -W * 0.25], [info.flatRoof[1] - 0.3, roofY, W * 0.25]);
    if (info.light || info.trailer) pts.splice(2);
    pts.forEach((p, i) => foliageClump(mg, mats, p, info.light ? 0.35 : 0.55, `wood${i}`));
    if (ti) {
      foliageClump(tm, mats, [ti.rearX * 0.6, tTop, ti.w * 0.35], 0.45, 'tw1');
      foliageClump(tm, mats, [0.1, tTop, -ti.w * 0.35], 0.4, 'tw2');
    }
    bedroll(mg, mats.canvasDark, mats.webbing, [deckX[0] + 0.1, info.deck, 0], Math.min(W - 0.6, 2.2), 0.18);
  } else if (camo === 'desert') {
    // jerry cans along the rear + sand channels on the sides
    const n = info.light ? 2 : 4;
    const x = info.xr;
    if (!info.trailer && !info.truck) {
      for (let i = 0; i < n; i++) jerryCan(mg, mats.jerry, [x - 0.1, (info.belly ?? 0.5) + 0.25, -W * 0.35 + (i * W * 0.7) / Math.max(1, n - 1)], PI / 2);
      mg.box(0.06, 0.06, W * 0.8, mats.iron, { at: [x - 0.04, (info.belly ?? 0.5) + 0.25, 0], r: 0.01 });
    }
    if (info.sideX0 != null && !info.light) for (const s of [1, -1]) {
      const sx = (info.sideX0 + info.sideX1) / 2;
      mg.box(1.6, 0.35, 0.05, mats.webbing, { at: [sx, (info.sideY0 + info.sideY1) / 2, s * (info.sideZ + 0.05)], r: 0.01 });
      for (let i = 0; i < 8; i++) mg.box(0.08, 0.36, 0.06, mats.iron, { at: [sx - 0.7 + i * 0.2, (info.sideY0 + info.sideY1) / 2, s * (info.sideZ + 0.06)], r: 0.008 });
    }
    if (ti) bag(tm, mats.canvas, [ti.rearX * 0.5, tTop, 0], [0.7, 0.3, 0.9]);
  } else if (camo === 'arctic') {
    // snow drifts on the horizontal surfaces + tarp rolls
    const sn = (x0, x1, y, w, m = mg) => m.add(cushion(Math.max(0.4, x1 - x0), 0.1, w, { bulge: 0.6 }), mats.snow, { at: [(x0 + x1) / 2, y + 0.04, 0] });
    sn(deckX[0], deckX[1], info.deck, W * 0.8);
    if (info.flatRoof && !info.noRoof) sn(info.flatRoof[0], info.flatRoof[1], roofY, W * 0.8);
    if (info.cabRoof) sn(info.cabRoof[0], info.cabRoof[1], info.cabRoof[2], W * 0.75);
    if (ti) tm.add(cushion(ti.w * 0.9, 0.1, ti.w * 0.8, { bulge: 0.6 }), mats.snow, { at: [ti.rearX * 0.35, tTop + 0.04, 0] });
    bedroll(mg, mats.whitePaint, mats.webbing, [deckX[1] - 0.2, info.deck, 0], Math.min(W - 0.4, 2.0), 0.16);
  } else if (camo === 'urban') {
    // roof spotlight + wire-cutter post + camera pods
    const rx = info.flatRoof ? info.flatRoof[1] - 0.2 : info.xf - 1.2;
    const ry = info.flatRoof ? roofY : info.deck;
    mg.tube([rx, ry, W * 0.3], [rx, ry + 0.45, W * 0.3], 0.03, mats.iron, 8);
    mg.add(new THREE.CylinderGeometry(0.12, 0.14, 0.18, 16).rotateZ(PI / 2), mats.dark, { at: [rx + 0.02, ry + 0.52, W * 0.3] });
    ctx.lamps.work.add(body, { at: [rx + 0.12, ry + 0.52, W * 0.3], normal: [1, 0, 0], w: 0.2, h: 0.2, shape: 'round', bezel: false });
    if (!info.trailer) {
      mg.tube([info.xf - 0.15, info.noseY, 0], [info.xf - 0.3, info.roofY + 0.6, 0], 0.04, mats.iron, 8);
      for (const s of [1, -1]) {
        mg.box(0.14, 0.12, 0.14, mats.black, { at: [info.xf - 0.1, info.noseY + 0.1, s * (W / 2 - 0.3)], r: 0.02 });
        mg.box(0.14, 0.12, 0.14, mats.black, { at: [info.xr + 0.02, info.deck - 0.05, s * (W / 2 - 0.4)], r: 0.02 });
      }
    }
    if (ti) tm.box(0.3, 0.2, 0.3, mats.black, { at: [0.2, tTop + 0.1 - (ctx.variant === 'mbt-cast' ? 0.06 : 0), -0.3], r: 0.03 });
  } else if (camo === 'olive') {
    // stowage: bags, bedrolls, ammo-style boxes (no markings)
    const y = info.deck;
    bag(mg, mats.canvas, [deckX[0] + 0.3, y, W * 0.25], [0.6, 0.3, 0.45]);
    bag(mg, mats.canvasDark, [deckX[0] + 0.35, y, -W * 0.22], [0.55, 0.28, 0.5]);
    mg.box(0.45, 0.3, 0.3, mats.jerry, { at: [deckX[1] - 0.2, y + 0.15, 0], r: 0.03 });
    bedroll(mg, mats.canvasDark, mats.webbing, [(deckX[0] + deckX[1]) / 2, y, 0], Math.min(W - 0.7, 1.6), 0.12);
    if (ti) {
      bedroll(tm, mats.canvas, mats.webbing, [ti.rearX * 0.75, tTop, 0], ti.w * 0.5, 0.13);
      bag(tm, mats.canvasDark, [ti.rearX * 0.4, tTop, ti.w * 0.3], [0.5, 0.25, 0.4]);
    }
  } else if (camo === 'un-white') {
    // light bar + flag mast with plain pale-blue flag + blue identification band
    const rx = info.flatRoof ? (info.flatRoof[0] + info.flatRoof[1]) / 2 : info.cabRoof ? (info.cabRoof[0] + info.cabRoof[1]) / 2 : info.rearDeck ? (info.rearDeck[0] + info.rearDeck[1]) / 2 : info.xf - 1.4;
    const ry = info.flatRoof && !info.noRoof ? roofY : info.cabRoof ? info.cabRoof[2] : info.deck;
    if (!ctx.lamps.beacon.meshes.length) {
      const beacon = lampGroup('beacon', 'blue');
      ctx.lamps.beacon = beacon;
    }
    mg.box(0.25, 0.08, Math.min(1.4, W * 0.55), mats.dark, { at: [rx, ry + 0.04, 0], r: 0.02 });
    for (const s of [1, -1]) {
      const geo = new THREE.SphereGeometry(0.09, 14, 8, 0, PI * 2, 0, PI / 2).scale(1.2, 1, 1).translate(rx, ry + 0.08, s * Math.min(0.55, W * 0.22));
      ctx.lamps.beacon.add(body, { geometry: geo, normal: [0, 1, 0], depth: 0.05, w: 0.2, h: 0.2, glowSize: 0.6 });
    }
    let fx = info.xr + 0.45;
    let fy = info.deck;
    if (info.flatRoof && !info.noRoof) { fx = info.flatRoof[0] + 0.1; fy = roofY; }
    else if (info.cabRoof) { fx = info.cabRoof[0] + 0.1; fy = info.cabRoof[2]; }
    const fz = info.canvasRoof ? 0 : -W / 2 + 0.25;
    mg.tube([fx, fy - 0.04, fz], [fx, fy + 1.6, fz], 0.018, mats.iron, 6);
    const flag = new THREE.PlaneGeometry(0.6, 0.38, 6, 1);
    const pos = flag.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) + 0.3) * 6) * 0.04);
    flag.computeVertexNormals();
    const fm = new THREE.MeshStandardMaterial({ color: '#5b9bd5', roughness: 0.8, side: THREE.DoubleSide });
    mg.add(flag, fm, { at: [fx - 0.31, fy + 1.4, fz] });
    if (info.sideX0 != null && !info.trailer) for (const s of [1, -1]) mg.box(Math.max(0.6, info.sideX1 - info.sideX0), 0.18, 0.012, mats.unBlue, { at: [(info.sideX0 + info.sideX1) / 2, info.sideY1 - 0.15, s * (info.sideZ + 0.006)], r: 0.004 });
  }
  mg.flush(body, 'camo_kit');
  if (ctx.turretMg) ctx.turretMg.flush(ctx.turret, 'turret_kit');
}

function partKit(ctx) {
  const { part, mats, info, body } = ctx;
  if (!part) return;
  const mg = new Merge();
  const W = info.W;
  const L = info.xf - info.xr;
  if (part === 'addon-armour') {
    // bolted composite/reactive armour modules on the sides (and turret)
    if (info.trailer) {
      for (const s of [1, -1]) mg.box(1.6, 0.9, 0.08, mats.paint, { at: [0.9, info.deck + 0.55, s * (W / 2 - 0.12)], r: 0.02 });
    } else {
      const nx = Math.max(2, Math.round((info.sideX1 - info.sideX0) / 0.7));
      const dx = (info.sideX1 - info.sideX0) / nx;
      const rows = info.light ? 1 : 2;
      const hh = (info.sideY1 - info.sideY0) / rows;
      for (const s of [1, -1]) for (let i = 0; i < nx; i++) for (let j = 0; j < rows; j++) {
        const x = info.sideX0 + (i + 0.5) * dx;
        const y = info.sideY0 + (j + 0.5) * hh;
        mg.box(dx - 0.04, hh - 0.04, 0.14, mats.paint, { at: [x, y, s * (info.sideZ + 0.07)], r: 0.02 });
        for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mg.add(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 6).rotateX(PI / 2), mats.iron, { at: [x + ox * (dx / 2 - 0.08), y + oy * (hh / 2 - 0.07), s * (info.sideZ + 0.15)] });
      }
      // glacis / nose slab
      mg.box(0.12, 0.45, W * 0.75, mats.paint, { at: [info.xf + 0.02, info.noseY + 0.05, 0], r: 0.03, rot: [0, 0, 0.5] });
      if (ctx.turret && ctx.turretInfo && info.tracked) {
        const tm = new Merge();
        const ti = ctx.turretInfo;
        const n = 4;
        for (const s of [1, -1]) for (let i = 0; i < n; i++) {
          const x = ti.frontX * 0.55 - i * 0.34;
          tm.add(roundedBox(0.3, ti.th * 0.5, 0.12, 0.02, 2), mats.paint, { at: [x, ti.th * 0.5 + 0.12, s * (ti.halfW(x) + 0.05)] });
        }
        tm.flush(ctx.turret, 'turret_armour');
      }
    }
  } else if (part === 'mine-plough' || part === 'dozer-blade') {
    const xf = info.xf;
    const arms = group('blade', { parent: body, at: [xf - 0.1, (info.noseY ?? 1) - 0.1, 0] });
    const am = new Merge();
    const bw = info.light ? W + 0.1 : W + 0.15;
    const dy = (info.noseY ?? 1) - 0.1;
    for (const s of [1, -1]) {
      am.box(1.0, 0.16, 0.14, mats.plain, { at: [0.45, -0.12, s * (bw / 2 - 0.35)], rot: [0, 0, -0.25], r: 0.03 });
      am.add(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 14).rotateX(PI / 2), mats.iron, { at: [0, 0, s * (bw / 2 - 0.35)] });
    }
    am.add(new THREE.CylinderGeometry(0.08, 0.08, bw - 0.7, 14).rotateX(PI / 2), mats.iron);
    if (part === 'dozer-blade') {
      // curved mouldboard with cutting edge
      const curve = [];
      const H = info.light ? 0.6 : 0.95;
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * 1.6 - 0.3;
        curve.push([Math.sin(a) * H * 0.35 + 0.95, -dy + 0.06 + (i / 10) * H]);
      }
      const shape = [...curve, ...curve.slice().reverse().map(([x, y]) => [x + 0.07, y])];
      am.add(extrudeOutline(shape, bw, { bevel: 0.02, segments: 1 }), mats.paint);
      am.box(0.12, 0.08, bw, mats.wear, { at: [curve[0][0] + 0.03, curve[0][1] - 0.02, 0], r: 0.01 });
      for (const s of [1, -1]) am.add(extrudeOutline([[0.85, -dy + 0.05], [1.35, -dy + 0.05], [1.3, -dy + H], [0.85, -dy + H]], 0.04, { bevel: 0.01 }), mats.paint, { at: [0, 0, s * (bw / 2 - 0.02)] });
      am.box(0.12, 0.12, bw - 0.4, mats.plain, { at: [0.88, -dy + H * 0.5, 0], r: 0.02 });
    } else {
      // two track-width tine ploughs
      const tw = info.trackW ?? 0.6;
      for (const s of [1, -1]) {
        const z = s * (W / 2 - tw / 2);
        am.box(0.18, 0.5, tw + 0.1, mats.paint, { at: [1.0, -dy + 0.42, z], r: 0.03 });
        for (let i = 0; i < 5; i++) {
          const tz = z - tw / 2 + 0.05 + (i * tw) / 4;
          const tine = extrudeOutline([[0, 0], [0.12, 0], [0.42, -0.42], [0.36, -0.46], [0.02, -0.15]], 0.06, { bevel: 0.01 });
          am.add(tine, mats.wear, { at: [1.0, -dy + 0.42, tz], rot: [0, 0, 0] });
        }
        am.box(0.8, 0.12, 0.12, mats.plain, { at: [0.55, -dy + 0.45, z], r: 0.02 });
        // skid shoe
        am.box(0.5, 0.06, 0.18, mats.iron, { at: [1.1, -dy + 0.05, z + s * tw * 0.4], r: 0.02 });
        am.tube([1.1, -dy + 0.08, z + s * tw * 0.4], [1.0, -dy + 0.42, z + s * tw * 0.4], 0.04, mats.iron, 8);
      }
      am.tube([1.0, -dy + 0.42, -W / 2 + 0.2], [1.0, -dy + 0.42, W / 2 - 0.2], 0.07, mats.plain, 10);
      // chain + dog-bone between the ploughs
      am.pipe([[1.2, -dy + 0.1, -0.6], [1.35, -dy + 0.06, 0], [1.2, -dy + 0.1, 0.6]], 0.025, mats.iron, 16, 6);
    }
    am.flush(arms, 'blade_body');
    ctx.anims.push(clip(part === 'dozer-blade' ? 'blade' : 'plough', 4, [rotateTrack(arms, 'z', 4, (t) => -pingPong(t) * 0.2)]));
  } else if (part === 'cage-armour') {
    // slat armour: horizontal bars on stand-off frames around sides and rear
    const off = info.light ? 0.25 : 0.4;
    const z = (info.sideZ ?? W / 2) + off;
    const y0 = Math.max(info.sideY0 ?? 0.8, info.light ? 0.6 : 0.8);
    const y1 = Math.min((info.sideY1 ?? 1.6) + 0.35, info.roofY - 0.05);
    const x0 = info.xr - (info.trailer ? 0 : off * 0.6);
    const x1 = info.sideX1 ?? info.xf - 1;
    const bars = Math.max(4, Math.round((y1 - y0) / 0.12));
    for (const s of [1, -1]) {
      for (let i = 0; i <= bars; i++) mg.box(x1 - x0, 0.05, 0.012, mats.plain, { at: [(x0 + x1) / 2, y0 + (i * (y1 - y0)) / bars, s * z], r: 0.004 });
      const posts = Math.max(3, Math.round((x1 - x0) / 0.8));
      for (let i = 0; i <= posts; i++) {
        const x = x0 + (i * (x1 - x0)) / posts;
        mg.box(0.05, y1 - y0 + 0.06, 0.05, mats.plain, { at: [x, (y0 + y1) / 2, s * z], r: 0.01 });
        mg.tube([x, (y0 + y1) / 2, s * z], [x, (y0 + y1) / 2, s * (z - off - 0.08)], 0.022, mats.iron, 6);
      }
    }
    // rear cage
    if (!info.trailer) {
      for (let i = 0; i <= bars; i++) mg.box(0.012, 0.05, 2 * z, mats.plain, { at: [x0, y0 + (i * (y1 - y0)) / bars, 0], r: 0.004 });
      for (const zz of [-z, -z / 3, z / 3, z]) mg.box(0.05, y1 - y0 + 0.06, 0.05, mats.plain, { at: [x0, (y0 + y1) / 2, zz], r: 0.01 });
    }
  } else if (part === 'cargo-racks') {
    // roof/deck baskets loaded with crates, bags and cans
    const top = info.flatRoof && !info.noRoof ? info.roofY : info.deck;
    const [x0, x1] = info.flatRoof && !info.noRoof ? info.flatRoof : info.rearDeck ?? [info.xr + 0.3, info.xr + 1.6];
    const w = Math.min(W - 0.3, 2.4);
    const h = 0.32;
    mg.box(x1 - x0, 0.04, w, mats.iron, { at: [(x0 + x1) / 2, top + 0.06, 0], r: 0.01 });
    for (const s of [1, -1]) {
      mg.pipe([[x0, top + 0.06, s * w / 2], [x0, top + h, s * w / 2], [x1, top + h, s * w / 2], [x1, top + 0.06, s * w / 2]], 0.022, mats.iron, 20, 6);
      for (let i = 1; i < 6; i++) mg.tube([x0 + (i * (x1 - x0)) / 6, top + 0.06, s * w / 2], [x0 + (i * (x1 - x0)) / 6, top + h, s * w / 2], 0.014, mats.iron, 6);
    }
    for (const x of [x0, x1]) mg.tube([x, top + h, -w / 2], [x, top + h, w / 2], 0.022, mats.iron, 6);
    for (const s of [1, -1]) for (const x of [x0 + 0.1, x1 - 0.1]) mg.box(0.06, 0.06, 0.06, mats.iron, { at: [x, top + 0.03, s * (w / 2 - 0.1)], r: 0.01 });
    const span = x1 - x0;
    const cy = top + 0.08;
    mg.box(Math.min(0.6, span * 0.3), 0.32, 0.45, mats.wood, { at: [x0 + span * 0.2, cy + 0.16, w * 0.2], r: 0.02 });
    bag(mg, mats.canvas, [x0 + span * 0.5, cy, -w * 0.2], [Math.min(0.7, span * 0.3), 0.3, 0.5]);
    jerryCan(mg, mats.jerry, [x0 + span * 0.78, cy, w * 0.25], 0);
    jerryCan(mg, mats.jerry, [x0 + span * 0.78, cy, w * 0.05], 0);
    bedroll(mg, mats.canvasDark, mats.webbing, [x0 + span * 0.4, cy, w * 0.2], Math.min(1.2, w * 0.5), 0.13);
    if (!info.light) bag(mg, mats.canvasDark, [x1 - span * 0.12, cy, -w * 0.25], [Math.min(0.5, span * 0.2), 0.28, 0.5]);
  }
  void L;
  mg.flush(body, 'part_kit');
}

/* ------------------------------------------------------------------ */
/* Factory                                                              */
/* ------------------------------------------------------------------ */

const BUILDERS = {
  tank: (ctx, v) => tank(ctx, v),
  apc: (ctx, v) => (v === 'tracked' ? trackedApc(ctx) : v.startsWith('wheeled') ? wheeledApc(ctx, v === 'wheeled-8x8' ? 4 : 3) : mrap(ctx, v === 'mrap-6x6')),
  'military-truck': (ctx, v) => militaryTruck(ctx, v),
  'utility-4x4': (ctx, v) => utility(ctx, v),
  'bridge-layer': (ctx, v) => bridgeLayer(ctx, v),
  'radar-trailer': (ctx, v) => radarTrailer(ctx, v),
};

function makeFactory(type) {
  const variants = Object.fromEntries(MILVEHICLE_VARIANTS[type].map((v) => [v, true]));
  return (options = {}) => {
    const o = normalizeOptions(options);
    const variant = pickVariant(variants, o.variant, type);
    const trim = o.trim ?? null;
    const { camo, part } = splitTrim(trim);
    const mats = militaryMats(camo, o.color && o.color !== 'blue' ? o : {});
    const root = group(`${type}-${variant}${trim ? `-${trim}` : ''}`);
    const body = group('vehicle', { parent: root });
    const lamps = machineLamps();
    const ctx = { variant, root, body, mats, camo, part: type === 'radar-trailer' ? null : part, anims: [], lamps, info: {}, mg: new Merge(), doors: [] };
    BUILDERS[type](ctx, variant);
    camoKit(ctx);
    partKit(ctx);
    ctx.mg.flush(body, 'hull');
    let oneShot = [];
    let exclusive = [];
    if (ctx.wheels) {
      const va = vehicleAnimations({ spins: ctx.wheels.spins, steers: ctx.wheels.steers, radius: ctx.wheels.r, speed: 6, lamps: lampNames(lamps) });
      ctx.anims.push(...va.animations.filter((a) => a.tracks.length));
      oneShot = va.oneShot;
      exclusive = va.exclusive;
      if (lamps.beacon.meshes.length) ctx.anims.push(beaconClip());
      if (lamps.work.meshes.length) ctx.anims.push(clip('spotlight', 1, machineLampAnimations({ work: lamps.work }).find((a) => a.name === 'lights').tracks));
    } else {
      ctx.anims.push(...machineLampAnimations(lamps));
      exclusive = [['drive', 'reverse', 'turnLeft', 'turnRight']];
    }
    const names = new Set();
    ctx.anims = ctx.anims.filter((a) => (names.has(a.name) ? false : names.add(a.name)));
    const obj = finalize(root, { type, variant, options: o, animations: ctx.anims });
    obj.userData.premade.oneShot = oneShot;
    obj.userData.premade.exclusive = exclusive;
    return obj;
  };
}

export const createTank = makeFactory('tank');
export const createApc = makeFactory('apc');
export const createMilitaryTruck = makeFactory('military-truck');
export const createUtility4x4 = makeFactory('utility-4x4');
export const createBridgeLayer = makeFactory('bridge-layer');
export const createRadarTrailer = makeFactory('radar-trailer');
