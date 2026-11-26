import * as THREE from 'three';
import { lampTracks, LAMP_ON } from '../../core/lamps.js';
import * as M from '../../core/materials.js';
import { mesh, group, lathe } from '../../core/utils.js';
import { spinTrack, rotateTrack, numberTrack, clip } from '../../core/animation.js';

/**
 * Realistic wheel: tyre with sidewall bulge + tread grooves, alloy rim with
 * concave spokes, brake disc and caliper (caliper doesn't spin).
 * Axle along Z. `side` = +1 for the +Z side of the vehicle (outer face +Z).
 * Returns { steer, spin } — steer is the pivot that yaws, spin rolls.
 */
export function buildWheel(name, { radius = 0.33, width = 0.23, side = 1, style = 'five', rimColor = '#c9ccd1', caliper = null, dually = false } = {}) {
  const steer = group(`${name}_steer`);
  const spin = group(name, { parent: steer });
  const r = radius;
  const w = width;
  const s = side;
  const rimR = r * 0.66;

  // Tyre profile (radius, axial) — revolved around Y, then turned so the axle is Z
  const tyreGeo = lathe([
    [rimR * 0.98, -w * 0.46],
    [r * 0.8, -w * 0.5],
    [r * 0.94, -w * 0.47],
    [r * 0.99, -w * 0.38],
    [r, -w * 0.25],
    [r, w * 0.25],
    [r * 0.99, w * 0.38],
    [r * 0.94, w * 0.47],
    [r * 0.8, w * 0.5],
    [rimR * 0.98, w * 0.46],
  ], 56);
  tyreGeo.rotateX(Math.PI / 2);
  const tyreMat = M.rubber();
  mesh(tyreGeo, tyreMat, { parent: spin });
  // tread grooves
  const groove = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1 });
  for (const zf of [-0.12, 0.12]) mesh(new THREE.TorusGeometry(r * 0.998, w * 0.025, 4, 56), groove, { parent: spin, at: [0, 0, zf * w] });

  const rim = new THREE.MeshStandardMaterial({ name: 'rim', color: rimColor, metalness: 0.95, roughness: 0.22 });
  const face = s * w * 0.32;
  // Barrel
  const barrel = new THREE.CylinderGeometry(rimR, rimR, w * 0.86, 40, 1, true);
  barrel.rotateX(Math.PI / 2);
  mesh(barrel, new THREE.MeshStandardMaterial({ color: '#3a3b3e', metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide }), { parent: spin });
  // Lip
  mesh(new THREE.TorusGeometry(rimR * 0.985, r * 0.025, 8, 56), rim, { parent: spin, at: [0, 0, face + s * w * 0.06] });
  // Dark inner face so the rim reads as having depth
  const dish = new THREE.CircleGeometry(rimR * 0.97, 40);
  if (s < 0) dish.rotateY(Math.PI);
  mesh(dish, new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.8 }), { parent: spin, at: [0, 0, face - s * w * 0.18] });

  // Brake disc (spins) + caliper (fixed to steer)
  const disc = new THREE.CylinderGeometry(rimR * 0.78, rimR * 0.78, 0.025, 40);
  disc.rotateX(Math.PI / 2);
  mesh(disc, M.metal('#7d7f84', 0.45), { parent: spin, at: [0, 0, face - s * w * 0.14] });
  if (caliper !== false) {
    const cal = new THREE.CylinderGeometry(rimR * 0.82, rimR * 0.82, 0.07, 16, 1, false, 0, 0.9);
    cal.rotateX(Math.PI / 2);
    mesh(cal, M.paint(caliper ?? '#2a2a2a', { metallic: 0.2 }), { parent: steer, at: [0, 0, face - s * w * 0.12], rot: [0, 0, Math.PI * 0.62] });
  }

  // Spokes
  const spokes = { five: 5, ten: 10, mesh: 14, steel: 0, truck: 8 }[style] ?? 5;
  if (spokes) {
    const len = rimR * 0.82;
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      const g = new THREE.BoxGeometry(len, r * (style === 'mesh' ? 0.045 : style === 'ten' ? 0.06 : 0.12), w * 0.07);
      g.translate(len / 2 + rimR * 0.1, 0, 0);
      // concave: tilt spokes inward toward the hub
      const sp = mesh(g, rim, { parent: spin, at: [0, 0, face], rot: [0, -s * 0.18, a] });
      sp.rotation.order = 'ZYX';
      if (style === 'five') {
        // split five-spoke for a more modern look
        const g2 = g.clone();
        mesh(g2, rim, { parent: spin, at: [0, 0, face], rot: [0, -s * 0.18, a + 0.2] }).rotation.order = 'ZYX';
      }
    }
  } else {
    // steel wheel: pressed disc with holes look
    const plate = new THREE.CircleGeometry(rimR * 0.95, 40);
    if (s < 0) plate.rotateY(Math.PI);
    mesh(plate, M.metal(rimColor, 0.45), { parent: spin, at: [0, 0, face] });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const hole = new THREE.CircleGeometry(r * 0.06, 16);
      if (s < 0) hole.rotateY(Math.PI);
      mesh(hole, new THREE.MeshBasicMaterial({ color: 0x050505 }), { parent: spin, at: [Math.cos(a) * rimR * 0.62, Math.sin(a) * rimR * 0.62, face + s * 0.002] });
    }
  }
  // Hub cap + lug nuts
  const cap = new THREE.CylinderGeometry(r * 0.13, r * 0.15, w * 0.08, 24);
  cap.rotateX(Math.PI / 2);
  mesh(cap, rim, { parent: spin, at: [0, 0, face + s * w * 0.02] });
  const lugCount = style === 'truck' ? 8 : 5;
  for (let i = 0; i < lugCount; i++) {
    const a = (i / lugCount) * Math.PI * 2;
    const lug = new THREE.CylinderGeometry(r * 0.018, r * 0.018, w * 0.06, 6);
    lug.rotateX(Math.PI / 2);
    mesh(lug, M.chrome(), { parent: spin, at: [Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2, face + s * w * 0.04] });
  }
  // stub axle / hub carrier (fixed to the steer group): reaches 12 cm inboard so suspension
  // arms, struts and axles always meet a solid hub
  {
    const z0 = face - s * w * 0.18;
    const z1 = -s * (w * 0.5 + (dually ? w * 1.02 : 0) + 0.12);
    const ax = new THREE.CylinderGeometry(r * 0.1, r * 0.1, Math.abs(z1 - z0), 14);
    ax.rotateX(Math.PI / 2);
    mesh(ax, M.metal('#2e3034', 0.5), { parent: steer, name: 'hub_axle', at: [0, 0, (z0 + z1) / 2] });
  }
  if (dually) {
    const inner = mesh(tyreGeo, tyreMat, { parent: spin, at: [0, 0, -s * w * 1.02] });
    inner.name = `${name}_inner`;
  }
  return { steer, spin };
}

export function addWheels(root, positions, opts) {
  const spins = [];
  const steers = [];
  for (const [name, x, z, front] of positions) {
    const side = Math.sign(z) || 1;
    const { steer, spin } = buildWheel(name, { ...opts, side });
    steer.position.set(x, opts.radius, z);
    root.add(steer);
    spins.push(spin);
    if (front) steers.push(steer);
  }
  return { spins, steers };
}

export function driveClip(spins, radius, speed = 8) {
  const period = (Math.PI * 2 * radius) / speed;
  return clip('drive', period, spins.map((s) => spinTrack(s, 'z', period, -1)));
}

/** Black wheel-well liner (half tube) so you can't see through the arch. */
export function wheelWell(parent, x, radius, width, y) {
  const g = new THREE.CylinderGeometry(radius, radius, width, 28, 1, true, -Math.PI / 2, Math.PI);
  g.rotateX(-Math.PI / 2); // axis → Z, open half faces down
  return mesh(g, new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 1, side: THREE.DoubleSide }), { parent, at: [x, y, 0] });
}

/**
 * Real headlights: two SpotLights (off until the 'lights' animation plays).
 * `at` = [x, y, |z|]. Pass lights:false in options to skip them for big scenes.
 */
export function addHeadlightSpots(parent, [x, y, z]) {
  const spots = [];
  for (const [s, n] of [[-1, 'L'], [1, 'R']]) {
    const spot = new THREE.SpotLight('#fff4e0', 0, 40, 0.42, 0.6, 1.5);
    spot.name = `head_spot_${n}`;
    spot.position.set(x, y, s * z);
    spot.target.position.set(x + 12, 0, s * z * 1.4);
    parent.add(spot, spot.target);
    spots.push(spot);
  }
  return spots;
}

/**
 * Standard vehicle animation set. Left = -Z, right = +Z (vehicle faces +X).
 *  drive, reverse            (exclusive)
 *  steer, steerLeft, steerRight (exclusive; Left/Right are one-shot and hold)
 *  hazards, leftSignal, rightSignal (exclusive)
 *  lights (headlights + real spotlights), brake
 * Mesh names expected: indicator_L*, indicator_R* (two shared materials),
 * 'headlights' and 'taillights' meshes, optional head_spot_L/R lights.
 */
export function vehicleAnimations({ spins, steers, radius, speed = 8, steerMax = 0.5, signalL, signalR, headlights, taillights, spots = [], lamps }) {
  if (lamps) return lampVehicleAnimations({ spins, steers, radius, speed, steerMax, spots, lamps });
  const period = (Math.PI * 2 * radius) / speed;
  const blink = (t) => (t < 0.5 ? 6 : 0);
  const D = THREE.InterpolateDiscrete;
  const ease = (t) => t * t * (3 - 2 * t);
  const anims = [
    clip('drive', period, spins.map((s) => spinTrack(s, 'z', period, -1))),
    clip('reverse', period * 2, spins.map((s) => spinTrack(s, 'z', period * 2, 1))),
    clip('steer', 4, steers.map((s) => rotateTrack(s, 'y', 4, (t) => Math.sin(t * Math.PI * 2) * steerMax))),
    clip('steerLeft', 0.6, steers.map((s) => rotateTrack(s, 'y', 0.6, (t) => ease(t) * steerMax, 12))),
    clip('steerRight', 0.6, steers.map((s) => rotateTrack(s, 'y', 0.6, (t) => -ease(t) * steerMax, 12))),
  ];
  if (signalL && signalR) {
    anims.push(
      clip('hazards', 1, [numberTrack(`${signalL}.material.emissiveIntensity`, 1, blink, 2, D), numberTrack(`${signalR}.material.emissiveIntensity`, 1, blink, 2, D)]),
      clip('leftSignal', 1, [numberTrack(`${signalL}.material.emissiveIntensity`, 1, blink, 2, D)]),
      clip('rightSignal', 1, [numberTrack(`${signalR}.material.emissiveIntensity`, 1, blink, 2, D)]),
    );
  }
  const on = (path, value) => numberTrack(path, 1, () => value, 1);
  const lightTracks = [];
  if (headlights) lightTracks.push(on(`${headlights}.material.emissiveIntensity`, 5));
  for (const s of spots) lightTracks.push(on(`${s.name}.intensity`, 80));
  if (taillights) lightTracks.push(on(`${taillights}.material.emissiveIntensity`, 2.2));
  if (lightTracks.length) anims.push(clip('lights', 1, lightTracks));
  if (taillights) anims.push(clip('brake', 1, [on(`${taillights}.material.emissiveIntensity`, 6)]));
  return {
    animations: anims,
    oneShot: ['steerLeft', 'steerRight'],
    exclusive: [['drive', 'reverse'], ['steer', 'steerLeft', 'steerRight'], ['hazards', 'leftSignal', 'rightSignal']],
  };
}

/**
 * Same animation set, for vehicles built with core/lamps.js lamp groups (lens + glow):
 *   lamps: { head: 'headlights', tail: 'taillights', brake: 'brakelights', signalL: 'indicator_L',
 *            signalR: 'indicator_R', reverse: 'reverselights', extra: { siren: [[name, kind], …] } }
 * Any key may be missing. lights = head + tail (+ spotlights), brake = brake lamps,
 * reverse also lights the reverse lamps.
 */
export function lampVehicleAnimations({ spins, steers, radius, speed = 8, steerMax = 0.5, spots = [], lamps }) {
  const period = (Math.PI * 2 * radius) / speed;
  const ease = (t) => t * t * (3 - 2 * t);
  const L = lamps;
  const anims = [
    clip('drive', period, spins.map((s) => spinTrack(s, 'z', period, -1))),
    clip('reverse', period * 2, [...spins.map((s) => spinTrack(s, 'z', period * 2, 1)), ...(L.reverse ? lampTracks(L.reverse, LAMP_ON.reverse) : [])]),
    clip('steer', 4, steers.map((s) => rotateTrack(s, 'y', 4, (t) => Math.sin(t * Math.PI * 2) * steerMax))),
    clip('steerLeft', 0.6, steers.map((s) => rotateTrack(s, 'y', 0.6, (t) => ease(t) * steerMax, 12))),
    clip('steerRight', 0.6, steers.map((s) => rotateTrack(s, 'y', 0.6, (t) => -ease(t) * steerMax, 12))),
  ];
  if (L.signalL && L.signalR) {
    const b = (n) => lampTracks(n, LAMP_ON.signal, { blink: 1.4 });
    anims.push(clip('hazards', 1 / 1.4, [...b(L.signalL), ...b(L.signalR)]), clip('leftSignal', 1 / 1.4, b(L.signalL)), clip('rightSignal', 1 / 1.4, b(L.signalR)));
  }
  const lightTracks = [];
  if (L.head) lightTracks.push(...lampTracks(L.head, LAMP_ON.head));
  if (L.tail) lightTracks.push(...lampTracks(L.tail, LAMP_ON.tail, { glow: 0.55 }));
  for (const s of spots) lightTracks.push(new THREE.NumberKeyframeTrack(`${s.name}.intensity`, [0, 1], [80, 80]));
  if (lightTracks.length) anims.push(clip('lights', 1, lightTracks));
  if (L.brake) anims.push(clip('brake', 1, lampTracks(L.brake, LAMP_ON.brake)));
  return {
    animations: anims,
    oneShot: ['steerLeft', 'steerRight'],
    exclusive: [['drive', 'reverse'], ['steer', 'steerLeft', 'steerRight'], ['hazards', 'leftSignal', 'rightSignal']],
  };
}

/**
 * Beam axles + air springs so a body physically rests on its wheels:
 * axle tube between the hub stubs (same radius as buildWheel's hub_axle → they meet), a
 * differential on driven axles, and per side an air spring from the axle up to `topY`
 * (wheel-arch roof / floor) at ±springZ.
 */
export function addAxles(parent, xs, { radius: r, z, topY, springZ, drive = [], name = 'axle' }) {
  const steel = M.metal('#2e3034', 0.5);
  const bag = new THREE.MeshStandardMaterial({ name: 'air_spring', color: '#141414', roughness: 0.85 });
  const g = group(name, { parent });
  for (const x of xs) {
    const ax = new THREE.CylinderGeometry(r * 0.1, r * 0.1, 2 * z, 14);
    ax.rotateX(Math.PI / 2);
    mesh(ax, steel, { parent: g, name: 'axle_beam', at: [x, r, 0] });
    if (drive.includes(x)) mesh(new THREE.SphereGeometry(r * 0.32, 18, 12), steel, { parent: g, name: 'differential', at: [x, r, 0], scale: [1, 0.9, 1.1] });
    for (const s of [1, -1]) {
      const h = topY - r;
      mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.12, h * 0.5, 12), steel, { parent: g, name: 'spring_seat', at: [x, r + h * 0.25, s * springZ] });
      mesh(new THREE.CylinderGeometry(r * 0.28, r * 0.28, h * 0.5 + 0.004, 18), bag, { parent: g, name: 'air_spring', at: [x, r + h * 0.75, s * springZ] });
    }
  }
  return g;
}
