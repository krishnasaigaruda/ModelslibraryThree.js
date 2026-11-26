import * as THREE from 'three';
import { group, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { Merge, addHeavyWheels, lifeClips } from './heavy-kit.js';
import { buildTrailer, TRAILER_KINDS } from './trailer-build.js';
import { truckLamps, truckAnimations, pruneEmpty, RAIL_Z } from './truck.js';
import * as M from '../../core/materials.js';

/*
 * Standalone semi-trailers, parked on their landing gear (or on a converter dolly).
 * Same builder as the semi truck's trailer (trailer-build.js).
 *  trims: spread (3 m spread tandem), triaxle, skirted (aero skirts + boat tail),
 *         pup (8.5 m single-axle), dolly (converter dolly under the kingpin)
 */

export const TRAILER_VARIANTS = Object.fromEntries(TRAILER_KINDS.map((k) => [k, {}]));
export const TRAILER_TRIMS = ['spread', 'triaxle', 'skirted', 'pup', 'dolly'];

const LEN = { box: 13.6, reefer: 13.6, curtainside: 13.6, flatbed: 13.6, tanker: 12.5, lowboy: 14.6, 'car-carrier': 14.0, container: 12.4, livestock: 13.0, logging: 12.5, dump: 10.5, grain: 12.0 };

function materials(o) {
  return {
    paint: M.paint(o.color ?? '#1d3f8a', { metallic: 0.25, roughness: 0.32 }),
    cargo: M.paint(o.cargoColor ?? o.color ?? '#e9ecef', { metallic: 0.2, roughness: 0.4 }),
    cargoColor: o.cargoColor ?? o.color ?? null,
    steel: M.metal('#3b3d40', 0.55),
    iron: M.metal('#26282b', 0.6),
    alu: M.metal('#c4c8cc', 0.3),
    chrome: M.chrome(),
    dark: new THREE.MeshStandardMaterial({ name: 'dark', color: '#1b1c1e', roughness: 0.6, metalness: 0.3 }),
    rubber: M.rubber(),
    decal: M.matte('#f2f2f2', 0.5),
  };
}

export function createTrailer(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(TRAILER_VARIANTS, o.variant, 'trailer');
  const trim = o.trim ?? null;
  const mats = materials(o);
  const lamps = truckLamps();
  const root = group(`trailer-${variant}${trim ? `-${trim}` : ''}`);
  const wr = 0.52;
  let len = LEN[variant];
  if (trim === 'pup') len = Math.min(len, 8.6);
  const xf = len / 2;
  const xr = -len / 2;
  let axles = [xr + 2.9, xr + 1.59];
  if (variant === 'lowboy') axles = [xr + 3.7, xr + 2.4, xr + 1.1];
  if (trim === 'spread') axles = [xr + 4.4, xr + 1.4];
  if (trim === 'triaxle') axles = [xr + 4.2, xr + 2.9, xr + 1.59];
  if (trim === 'pup') axles = [xr + 1.8];
  const dolly = trim === 'dolly';
  const tr = buildTrailer(root, variant, { xf, xr, axles, wr, mats, lamps, footY: dolly ? 0.28 : 0, skirts: trim === 'skirted', dy: 1.24 });
  let spins = tr.spins;
  const steers = [];
  if (dolly) {
    // converter dolly: fifth wheel on a single axle with an A-frame drawbar
    const kx = xf - 1.2;
    const d = group('dolly', { parent: root, at: [kx, 0, 0] });
    const mg = new Merge();
    const dy = 1.24;
    for (const s of [1, -1]) mg.box(1.6, 0.22, 0.1, mats.steel, { at: [0, wr + 0.25, s * RAIL_Z], r: 0.015 });
    mg.box(0.8, 0.08, 1.1, mats.iron, { at: [0, wr + 0.4, 0], r: 0.015 });
    for (const s of [1, -1]) mg.box(0.3, dy - 0.05 - wr - 0.44, 0.14, mats.iron, { at: [0, (dy - 0.05 + wr + 0.44) / 2, s * 0.42], r: 0.015 });
    mg.add(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 32, 1, false, 0.25, Math.PI * 2 - 0.5), mats.iron, { at: [0, dy - 0.09, 0], rot: [0, Math.PI, 0] });
    mg.add(new THREE.CylinderGeometry(0.075, 0.075, 2.2, 14).rotateX(Math.PI / 2), mats.iron, { at: [0, wr, 0] });
    for (const s of [1, -1]) mg.tube([0.6, wr + 0.25, s * RAIL_Z], [2.6, 0.62, 0], 0.06, mats.steel, 10);
    mg.add(new THREE.TorusGeometry(0.1, 0.03, 8, 16).rotateX(Math.PI / 2), mats.iron, { at: [2.7, 0.62, 0] });
    mg.box(0.3, 0.62 - 0.05, 0.1, mats.steel, { at: [2.55, 0.31, 0], r: 0.01 }); // parking stand
    for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(wr + 0.1, wr + 0.1, 0.7, 24, 1, true, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), mats.rubber, { at: [0, wr, s * 0.87] });
    mg.flush(d, 'dolly_frame');
    const w = addHeavyWheels(d, [['dolly_wheelL', 0, 0.94], ['dolly_wheelR', 0, -0.94]], { radius: wr, width: 0.3, style: 'truck', dual: true });
    spins = [...spins, ...w.spins];
  }
  pruneEmpty(root);
  const set = truckAnimations({ spins, steers, wr, speed: 6, spots: [], lamps });
  const anims = set.animations.filter((c) => !/^steer/.test(c.name) && c.tracks.length);
  const all = [...anims, ...tr.extra];
  lifeClips(all, [], tr.doors);
  const obj = finalize(root, { type: 'trailer', variant, options: o, animations: all });
  obj.userData.premade.oneShot = [];
  obj.userData.premade.exclusive = [['drive', 'reverse'], ['hazards', 'leftSignal', 'rightSignal']];
  return obj;
}
