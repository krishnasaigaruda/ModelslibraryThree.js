import {
  THREE, M, mesh, group, roundedBox, cushion, curveTube, lathe,
  woodMat, fabricMat, metalMat, plasticMat, glassMat, ceramic,
} from './common.js';
import { finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { brandEmblem } from '../../core/brand.js';
import { spinTrack, rotateTrack, numberTrack, clip, wave } from '../../core/animation.js';

/* =============================== LAMPS =============================== */

export const LAMP_VARIANTS = {
  floor: { color: '#efe6d2', metal: 'brass' },
  desk: { color: '#1f6f8b', metal: 'steel' },
  pendant: { color: '#2d3a3a', metal: 'brass' },
  table: { color: '#f2ece0', metal: 'brass', base: '#3f6f7a' },
  chandelier: { color: '#fff3d6', metal: 'gold' },
  arc: { color: '#f5f5f2', metal: 'chrome' },
};

/** Shade as a lathed shell with real wall thickness (no paper-thin edges). */
function shadeGeo(rTop, rBottom, h, wall = 0.004) {
  return lathe([[rBottom, 0], [rTop, h], [rTop - wall, h], [rBottom - wall, 0.0005]], 48);
}

export function createLamp(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(LAMP_VARIANTS, o.variant, 'lamp');
  const v = LAMP_VARIANTS[variant];
  const root = group(`lamp-${variant}`);
  const MT = metalMat(o.metal ?? v.metal);
  const warm = o.lightColor ?? '#ffe2a8';
  // bulbs are OFF by default; the 'on' animation lights bulb, shade and the real light
  const bulbMat = M.emissive(warm, 0.08);
  const shadeMat = new THREE.MeshPhysicalMaterial({ name: 'shade', color: M.toColor(o.color ?? v.color), roughness: 0.9, sheen: 0.6, side: THREE.DoubleSide, emissive: M.toColor(warm), emissiveIntensity: 0 });
  const bulbs = [];
  const addBulb = (parent, at, r = 0.032) => {
    const name = `bulb${bulbs.length}`;
    mesh(new THREE.SphereGeometry(r, 20, 14), bulbMat, { parent, at, name });
    bulbs.push(name);
  };

  if (variant === 'floor') {
    mesh(lathe([[0, 0], [0.16, 0], [0.165, 0.01], [0.15, 0.03], [0.04, 0.045], [0, 0.045]], 48), MT, { parent: root });
    mesh(new THREE.CylinderGeometry(0.011, 0.011, 1.38, 16), MT, { parent: root, at: [0, 0.72, 0] });
    mesh(lathe([[0, 0], [0.02, 0], [0.025, 0.03], [0.015, 0.06], [0, 0.06]], 16), MT, { parent: root, at: [0, 1.38, 0] });
    mesh(shadeGeo(0.17, 0.23, 0.3), shadeMat, { parent: root, at: [0, 1.36, 0], name: 'shade' });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; curveTube([[0, 1.5, 0], [Math.cos(a) * 0.165, 1.655, Math.sin(a) * 0.165]], 0.003, MT, { parent: root, segments: 2 }); }
    addBulb(root, [0, 1.5, 0]);
  } else if (variant === 'desk') {
    // balanced-arm desk lamp: weighted base → base knuckle → lower arm (twin rods) → elbow →
    // upper arm (twin rods) → head knuckle holding the shade's neck; opening points down/forward
    const paint = new THREE.MeshPhysicalMaterial({ name: 'paint', color: M.toColor(o.color ?? v.color), roughness: 0.3, clearcoat: 0.8, side: THREE.DoubleSide });
    mesh(lathe([[0, 0], [0.1, 0], [0.104, 0.008], [0.1, 0.028], [0.085, 0.036], [0, 0.036]], 48), paint, { parent: root, name: 'base' });
    mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.05, 24), paint, { parent: root, at: [0, 0.06, 0] });
    const V = (a) => new THREE.Vector3(...a);
    const j1 = V([0, 0.092, 0]);
    const j2 = V([0.11, 0.38, 0]);
    const j3 = V([0.39, 0.42, 0]);
    const knuckle = (j) => {
      mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.05, 20).rotateX(Math.PI / 2), paint, { parent: root, at: j.toArray() });
      mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.058, 10).rotateX(Math.PI / 2), MT, { parent: root, at: j.toArray() }); // pivot bolt
    };
    [j1, j2, j3].forEach(knuckle);
    // base knuckle sits in a fork on the turret
    for (const z of [0.022, -0.022]) mesh(roundedBox(0.026, 0.03, 0.006, 0.002), paint, { parent: root, at: [0, 0.08, z] });
    for (const [a, b] of [[j1, j2], [j2, j3]]) for (const z of [0.014, -0.014]) {
      curveTube([[a.x, a.y, z], [b.x, b.y, z]], 0.005, MT, { parent: root, segments: 2, radialSegments: 10 });
    }
    // balance springs: helix coils hooked at both ends to brackets clamped across the twin rods
    const spring = (a, b, t0, t1, off) => {
      const d = b.clone().sub(a);
      const len = d.length();
      d.normalize();
      const perp = new THREE.Vector3(-d.y, d.x, 0);
      const P0 = a.clone().addScaledVector(d, len * t0);
      const P1 = a.clone().addScaledVector(d, len * t1);
      const H0 = P0.clone().addScaledVector(perp, off);
      const H1 = P1.clone().addScaledVector(perp, off);
      for (const [P, H] of [[P0, H0], [P1, H1]]) {
        mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.036, 10).rotateX(Math.PI / 2), MT, { parent: root, at: P.toArray() }); // clamp across both rods
        curveTube([P.toArray(), H.toArray()], 0.0032, MT, { parent: root, segments: 2, radialSegments: 8 }); // bracket tab
        mesh(new THREE.TorusGeometry(0.0042, 0.0012, 6, 14), MT, { parent: root, at: H.toArray() }); // eye the hook goes through
      }
      const R = 0.0055;
      const lead = 0.012;
      const C0 = H0.clone().addScaledVector(d, lead);
      const C1 = H1.clone().addScaledVector(d, -lead);
      const coilLen = C0.distanceTo(C1);
      const turns = Math.round(coilLen / 0.0032);
      const pts = [H0.clone().addScaledVector(d, 0.004).toArray()];
      const u = perp;
      const w = new THREE.Vector3(0, 0, 1);
      for (let i = 0; i <= turns * 10; i++) {
        const t = i / (turns * 10);
        const ang = t * turns * Math.PI * 2;
        pts.push(C0.clone().lerp(C1, t).addScaledVector(u, Math.cos(ang) * R).addScaledVector(w, Math.sin(ang) * R).toArray());
      }
      pts.push(H1.clone().addScaledVector(d, -0.004).toArray());
      curveTube(pts, 0.0011, MT, { parent: root, segments: pts.length * 3, radialSegments: 5 });
    };
    spring(j1, j2, 0.12, 0.72, 0.032);
    spring(j2, j3, 0.14, 0.7, 0.03);
    // head: neck clamped under the head knuckle, cone shade opening DOWN and forward
    const head = group('head', { parent: root, at: j3.toArray(), rot: [0, 0, 0.42] });
    mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.04, 20), paint, { parent: head, at: [0, -0.012, 0] });
    const shell = lathe([[0.016, -0.03], [0.026, -0.04], [0.036, -0.06], [0.08, -0.17], [0.083, -0.176], [0.078, -0.176], [0.075, -0.17], [0.032, -0.062], [0.022, -0.043], [0.012, -0.034]], 48);
    mesh(shell, paint, { parent: head, name: 'shell' });
    // bright inner reflector (lights up with 'on')
    const liner = new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide, emissive: M.toColor(warm), emissiveIntensity: 0 });
    mesh(lathe([[0.023, -0.046], [0.033, -0.064], [0.0745, -0.168]], 48), liner, { parent: head, name: 'shade' });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 16), plasticMat('#e8e4dc', 0.6), { parent: head, at: [0, -0.05, 0] }); // socket
    addBulb(head, [0, -0.085, 0], 0.024);
  } else if (variant === 'pendant') {
    root.userData.floating = true;
    mesh(lathe([[0, 0], [0.06, 0], [0.06, 0.02], [0.05, 0.035], [0, 0.035]], 32), MT, { parent: root, at: [0, 1.17, 0] });
    mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.85, 8), plasticMat('#111'), { parent: root, at: [0, 0.745, 0] });
    mesh(lathe([[0.012, 0], [0.018, 0.0], [0.02, 0.05], [0.012, 0.06]], 16), MT, { parent: root, at: [0, 0.28, 0] });
    const outer = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.35, metalness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide });
    const dome = lathe([[0.02, 0.29], [0.06, 0.28], [0.15, 0.2], [0.2, 0.1], [0.22, 0.0], [0.214, 0.0], [0.194, 0.1], [0.145, 0.194], [0.058, 0.272], [0.02, 0.282]], 56);
    mesh(dome, outer, { parent: root, at: [0, 0.0, 0] });
    mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 16), plasticMat('#e8e4dc', 0.6), { parent: root, at: [0, 0.21, 0], name: 'socket' });
    addBulb(root, [0, 0.1, 0], 0.04);
  } else if (variant === 'table') {
    mesh(lathe([[0, 0], [0.07, 0], [0.075, 0.01], [0.1, 0.08], [0.11, 0.16], [0.09, 0.25], [0.04, 0.31], [0.03, 0.34], [0, 0.34]], 48), ceramic(o.baseColor ?? v.base), { parent: root });
    mesh(lathe([[0, 0], [0.02, 0], [0.012, 0.02], [0.012, 0.09], [0.018, 0.1], [0, 0.1]], 16), MT, { parent: root, at: [0, 0.34, 0] });
    curveTube([[-0.1, 0.44, 0], [-0.1, 0.56, 0], [0, 0.6, 0], [0.1, 0.56, 0], [0.1, 0.44, 0]], 0.003, MT, { parent: root });
    mesh(shadeGeo(0.12, 0.19, 0.24), shadeMat, { parent: root, at: [0, 0.4, 0], name: 'shade' });
    mesh(lathe([[0, 0], [0.012, 0], [0.014, 0.012], [0.006, 0.025], [0, 0.03]], 12), MT, { parent: root, at: [0, 0.645, 0] });
    mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 16), plasticMat('#e8e4dc', 0.6), { parent: root, at: [0, 0.455, 0], name: 'socket' });
    addBulb(root, [0, 0.5, 0]);
  } else if (variant === 'chandelier') {
    root.userData.floating = true;
    mesh(lathe([[0, 0], [0.08, 0], [0.08, 0.02], [0.05, 0.04], [0, 0.04]], 32), MT, { parent: root, at: [0, 1.2, 0] });
    for (let i = 0; i < 9; i++) mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 14), MT, { parent: root, at: [0, 1.18 - i * 0.032, 0], rot: [0, (i % 2) * Math.PI / 2, 0] });
    mesh(lathe([[0, 0], [0.04, 0], [0.06, 0.05], [0.03, 0.12], [0.05, 0.2], [0.02, 0.32], [0.03, 0.38], [0.012, 0.42], [0.0, 0.43]], 32), MT, { parent: root, at: [0, 0.48, 0] });
    mesh(lathe([[0, 0], [0.012, 0], [0.025, 0.02], [0.006, 0.06], [0, 0.07]], 16), MT, { parent: root, at: [0, 0.42, 0] });
    const crystal = glassMat('#ffffff', 0.5);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      curveTube([[c * 0.03, 0.55, s * 0.03], [c * 0.2, 0.5, s * 0.2], [c * 0.34, 0.62, s * 0.34], [c * 0.36, 0.72, s * 0.36]], 0.008, MT, { parent: root, segments: 32 });
      mesh(lathe([[0, 0], [0.035, 0.0], [0.04, 0.012], [0.015, 0.02], [0.015, 0.03], [0, 0.03]], 20), MT, { parent: root, at: [c * 0.36, 0.72, s * 0.36] });
      mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 16), ceramic('#fbf7ee'), { parent: root, at: [c * 0.36, 0.79, s * 0.36] });
      const flame = lathe([[0, 0], [0.012, 0.012], [0.01, 0.03], [0, 0.05]], 12);
      const name = `bulb${bulbs.length}`;
      mesh(flame, bulbMat, { parent: root, at: [c * 0.36, 0.83, s * 0.36], name });
      bulbs.push(name);
      mesh(new THREE.OctahedronGeometry(0.018).scale(1, 1.8, 1), crystal, { parent: root, at: [c * 0.24, 0.45, s * 0.24] });
    }
  } else {
    // arc
    mesh(roundedBox(0.3, 0.07, 0.3, 0.02), new THREE.MeshPhysicalMaterial({ color: '#e9e6e1', roughness: 0.25, clearcoat: 0.6 }), { parent: root, at: [0, 0.035, 0] });
    curveTube([[0, 0.07, 0], [0.05, 1.2, 0], [0.45, 1.95, 0], [1.1, 2.0, 0], [1.45, 1.75, 0]], 0.014, MT, { parent: root, segments: 80 });
    const dome = lathe([[0.02, 0.2], [0.08, 0.19], [0.18, 0.12], [0.22, 0.02], [0.225, 0.0], [0.218, 0.0], [0.212, 0.02], [0.17, 0.115], [0.075, 0.182], [0.02, 0.192]], 56);
    const outer = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.25, metalness: 0.4, clearcoat: 0.8, side: THREE.DoubleSide });
    mesh(dome, outer, { parent: root, at: [1.45, 1.53, 0] });
    mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 16), plasticMat('#e8e4dc', 0.6), { parent: root, at: [1.45, 1.685, 0], name: 'socket' });
    addBulb(root, [1.45, 1.6, 0], 0.04);
  }

  const lightTracks = (fn) => bulbs.slice(0, 1).map((b) => numberTrack(`${b}.material.emissiveIntensity`, 2, fn, 40, THREE.InterpolateDiscrete));
  const flick = (t) => (Math.sin(t * 90) > 0.6 ? 0.6 : 4);
  const flickerTracks = lightTracks(flick);
  const onTracks = lightTracks(() => 4);
  if (root.getObjectByName('shade')) {
    flickerTracks.push(numberTrack('shade.material.emissiveIntensity', 2, (t) => flick(t) * 0.09, 40, THREE.InterpolateDiscrete));
    onTracks.push(numberTrack('shade.material.emissiveIntensity', 2, () => 0.36, 2));
  }
  if (o.light !== false && bulbs.length) {
    const b = root.getObjectByName(bulbs[0]);
    let light;
    if (variant === 'desk') {
      // task light: a spot aimed out of the shade opening (head's −Y)
      light = new THREE.SpotLight(warm, 0, 4, 0.75, 0.5, 2);
      light.position.copy(b.position);
      b.parent.add(light);
      light.target.position.set(0, -1, 0);
      light.add(light.target);
    } else {
      light = new THREE.PointLight(warm, 0, 6, 2);
      root.updateMatrixWorld(true);
      b.getWorldPosition(light.position);
      root.add(light);
    }
    light.name = 'bulb_light';
    const k = light.isSpotLight ? 4 : 1; // a spot concentrates its output in the cone
    flickerTracks.push(numberTrack('bulb_light.intensity', 2, (t) => flick(t) * 0.8 * k, 40, THREE.InterpolateDiscrete));
    onTracks.push(numberTrack('bulb_light.intensity', 2, () => (o.intensity ?? 3) * k, 2));
  }
  const animations = [clip('on', 2, onTracks), clip('flicker', 2, flickerTracks)];
  if (variant === 'chandelier') animations.push(clip('sway', 4, [rotateTrack(root.children[0], 'z', 4, () => 0)]));
  if (variant === 'chandelier') animations.pop();
  const floating = root.userData.floating;
  const out = finalize(root, { type: 'lamp', variant, options: o, animations });
  if (floating) out.userData.floating = true;
  return out;
}

/* ================================ FANS ================================ */

export const FAN_VARIANTS = {
  ceiling: { wood: 'walnut', metal: 'brass' },
  standing: { color: '#f2f2f0', metal: 'chrome' },
  tower: { color: '#2b2b2b' },
};

export function createFan(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(FAN_VARIANTS, o.variant, 'fan');
  const v = FAN_VARIANTS[variant];
  const root = group(`fan-${variant}`);
  const MT = metalMat(o.metal ?? v.metal ?? 'chrome');
  const animations = [];

  if (variant === 'ceiling') {
    root.userData.floating = true;
    mesh(lathe([[0, 0], [0.075, 0], [0.075, 0.02], [0.05, 0.06], [0, 0.06]], 32), MT, { parent: root, at: [0, 0.55, 0] });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 12), MT, { parent: root, at: [0, 0.45, 0] });
    const blades = group('blades', { parent: root, at: [0, 0.25, 0] });
    mesh(lathe([[0, 0.08], [0.06, 0.08], [0.11, 0.06], [0.12, 0.02], [0.11, -0.02], [0.06, -0.04], [0, -0.04]], 40), MT, { parent: blades });
    const W = woodMat(o.wood ?? v.wood);
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, -0.05);
    bladeShape.quadraticCurveTo(0.3, -0.075, 0.55, -0.065);
    bladeShape.quadraticCurveTo(0.6, 0, 0.55, 0.065);
    bladeShape.quadraticCurveTo(0.3, 0.075, 0, 0.05);
    bladeShape.lineTo(0, -0.05);
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 16 });
    bladeGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < 5; i++) {
      const arm = group(null, { parent: blades, rot: [0, (i / 5) * Math.PI * 2, 0] });
      curveTube([[0.1, 0.0, 0], [0.16, 0.005, 0], [0.2, 0.0, 0]], 0.008, MT, { parent: arm });
      mesh(bladeGeo, W, { parent: arm, at: [0.18, 0.004, 0], rot: [0.12, 0, 0] });
    }
    mesh(lathe([[0, 0], [0.08, 0], [0.075, -0.03], [0.05, -0.06], [0, -0.07]], 32), glassMat('#fff6e0', 0.85), { parent: blades, at: [0, -0.04, 0] });
    { const e = brandEmblem(0.045, { name: 'emblem' }); e.position.set(0, 0.035, 0.117); blades.add(e); }
    animations.push(clip('spin', 0.6, [spinTrack(blades, 'y', 0.6, 1)]));
  } else if (variant === 'standing') {
    const P = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.3, clearcoat: 0.6 });
    mesh(lathe([[0, 0], [0.2, 0], [0.205, 0.012], [0.18, 0.04], [0.04, 0.05], [0, 0.05]], 48), P, { parent: root });
    mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.0, 16), MT, { parent: root, at: [0, 0.55, 0] });
    const head = group('head', { parent: root, at: [0, 1.1, 0] });
    mesh(lathe([[0, -0.12], [0.06, -0.11], [0.075, -0.05], [0.07, 0.02], [0.04, 0.05], [0, 0.05]], 32).rotateX(Math.PI / 2), P, { parent: head, at: [0, 0, -0.05] });
    const blades = group('blades', { parent: head, at: [0, 0, 0.06] });
    mesh(new THREE.SphereGeometry(0.035, 16, 10), P, { parent: blades });
    const bladeMat = new THREE.MeshPhysicalMaterial({ color: '#a9cfe6', roughness: 0.2, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    for (let i = 0; i < 3; i++) {
      const g = new THREE.SphereGeometry(0.11, 24, 12);
      g.scale(1, 0.6, 0.05);
      g.translate(0.135, 0, 0);
      g.rotateX(0.35);
      mesh(g, bladeMat, { parent: blades, rot: [0, 0, (i / 3) * Math.PI * 2] });
    }
    // cage: front + back rings and spokes
    for (const z of [0.0, 0.12]) mesh(new THREE.TorusGeometry(0.27, 0.004, 6, 64), MT, { parent: head, at: [0, 0, z] });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      curveTube([[Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0], [Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0.09], [Math.cos(a) * 0.06, Math.sin(a) * 0.06, 0.14]], 0.0018, MT, { parent: head, segments: 12, radialSegments: 4 });
    }
    mesh(lathe([[0, 0], [0.05, 0], [0.04, 0.01], [0, 0.012]], 24).rotateX(Math.PI / 2), P, { parent: head, at: [0, 0, 0.14] });
    { const e = brandEmblem(0.06, { name: 'emblem' }); e.position.set(0, 0, 0.153); head.add(e); }
    animations.push(clip('spin', 0.3, [spinTrack(blades, 'z', 0.3, 1)]));
    animations.push(clip('oscillate', 6, [rotateTrack(head, 'y', 6, (t) => wave(t) * 0.6)]));
  } else {
    const P = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.35, clearcoat: 0.5 });
    mesh(lathe([[0, 0], [0.16, 0], [0.165, 0.01], [0.15, 0.035], [0, 0.04]], 48), P, { parent: root });
    const body = group('body', { parent: root, at: [0, 0.04, 0] });
    mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.012, 32), plasticMat('#1a1a1a', 0.5), { parent: body, at: [0, 0.006, 0] });
    mesh(cushion(0.2, 0.92, 0.2, { radius: 0.09, bulge: 0 }), P, { parent: body, at: [0, 0.472, 0] });
    mesh(cushion(0.12, 0.7, 0.02, { radius: 0.009, bulge: 0 }), plasticMat('#111', 0.7), { parent: body, at: [0, 0.45, 0.094] });
    for (let i = 0; i < 18; i++) mesh(roundedBox(0.1, 0.008, 0.012, 0.003), plasticMat('#444', 0.5), { parent: body, at: [0, 0.13 + i * 0.037, 0.104] });
    // top control panel with a power lamp (lens + glow, see core/lamps.js)
    const led = lampGroup('power_led', 'blue');
    led.add(body, { at: [0, 0.932, 0.03], normal: [0, 1, 0], w: 0.022, h: 0.022, depth: 0.004, shape: 'round', bezel: false, glowSize: 0.07 });
    { const e = brandEmblem(0.04, { name: 'emblem' }); e.position.set(0, 0.06, 0.1); body.add(e); }
    animations.push(clip('oscillate', 6, [rotateTrack(body, 'y', 6, (t) => wave(t) * 0.7)]));
    animations.push(clip('on', 1, lampTracks('power_led', 3)));
  }
  const floating = root.userData.floating;
  const out = finalize(root, { type: 'fan', variant, options: o, animations });
  if (floating) out.userData.floating = true;
  return out;
}

/* ================================ TVs ================================ */

export const TV_VARIANTS = {
  stand: { size: 1.4 },
  wall: { size: 1.65 },
  crt: { size: 0.55 },
  tabletop: { size: 1.1 },
};

export function createTV(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(TV_VARIANTS, o.variant, 'tv');
  const v = TV_VARIANTS[variant];
  const root = group(`tv-${variant}`);
  const w = o.size ?? v.size;
  const h = w * 0.5625;
  const screenMat = new THREE.MeshPhysicalMaterial({ name: 'screen', color: '#05070a', emissive: M.toColor(o.screenColor ?? '#3a78b5'), emissiveIntensity: 0.9, roughness: 0.15, clearcoat: 1 });
  const bezel = plasticMat('#0b0b0c', 0.3);

  if (variant === 'crt') {
    const W2 = 0.62;
    const H2 = 0.5;
    mesh(cushion(W2, H2, 0.5, { radius: 0.05, bulge: 0 }), plasticMat('#d8d2c4', 0.45), { parent: root, at: [0, H2 / 2 + 0.03, 0] });
    mesh(cushion(W2 * 0.75, H2 * 0.75, 0.25, { radius: 0.08, bulge: 0 }), plasticMat('#cfc8b9', 0.5), { parent: root, at: [0, H2 / 2 + 0.03, -0.3] });
    mesh(cushion(0.48, 0.36, 0.02, { radius: 0.02, bulge: 0 }), bezel, { parent: root, at: [0, H2 / 2 + 0.07, 0.25] });
    mesh(cushion(0.42, 0.03, 0.31, { radius: 0.014, bulge: 0.9 }), screenMat, { parent: root, at: [0, H2 / 2 + 0.07, 0.258], rot: [Math.PI / 2, 0, 0], name: 'screen' });
    for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 16).rotateX(Math.PI / 2), plasticMat('#333'), { parent: root, at: [0.24, 0.12 + i * 0.03, 0.252] });
    { const e = brandEmblem(0.03, { name: 'emblem' }); e.position.set(-0.2, 0.09, 0.253); root.add(e); }
    for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.03, 12), plasticMat('#222'), { parent: root, at: [sx * 0.24, 0.015, sz * 0.18] });
    mesh(lathe([[0, 0], [0.04, 0], [0.04, 0.02], [0, 0.025]], 20), plasticMat('#222'), { parent: root, at: [0, H2 + 0.03, -0.1] });
    for (const s of [1, -1]) curveTube([[0, H2 + 0.05, -0.1], [s * 0.18, H2 + 0.35, -0.12]], 0.003, metalMat('chrome'), { parent: root });
  } else {
    let y = 1.3;
    if (variant === 'stand') {
      y = 0.12 + h / 2 + 0.04;
      mesh(roundedBox(0.38, 0.015, 0.24, 0.006), metalMat('black'), { parent: root, at: [0, 0.0075, 0] });
      mesh(roundedBox(0.06, 0.12 + h / 4, 0.03, 0.01), metalMat('black'), { parent: root, at: [0, (0.12 + h / 4) / 2, -0.02] });
    } else if (variant === 'tabletop') {
      y = 0.08 + h / 2;
      for (const s of [1, -1]) {
        curveTube([[s * (w / 2 - 0.12), 0.0, 0.12], [s * (w / 2 - 0.1), 0.06, 0.0], [s * (w / 2 - 0.12), 0.0, -0.1]], 0.008, metalMat('steel'), { parent: root, segments: 16 });
        curveTube([[s * (w / 2 - 0.1), 0.06, 0.0], [s * (w / 2 - 0.1), 0.1, -0.01]], 0.008, metalMat('steel'), { parent: root });
      }
    } else {
      root.userData.floating = true;
      mesh(roundedBox(0.4, 0.3, 0.03, 0.008), metalMat('black'), { parent: root, at: [0, y, -0.04] });
    }
    mesh(roundedBox(w, h, 0.03, 0.008, 3), bezel, { parent: root, at: [0, y, 0] });
    mesh(roundedBox(w * 0.55, h * 0.6, 0.03, 0.02), bezel, { parent: root, at: [0, y, -0.025] });
    mesh(new THREE.PlaneGeometry(w - 0.025, h - 0.025), screenMat, { parent: root, at: [0, y, 0.0155], name: 'screen' });
    mesh(roundedBox(0.04, 0.008, 0.004, 0.002), M.emissive('#ff3b30', 0.6), { parent: root, at: [w / 2 - 0.06, y - h / 2 + 0.006, 0.016] });
    { const e = brandEmblem(0.011, { name: 'emblem' }); e.position.set(0, y - h / 2 + 0.0065, 0.0165); root.add(e); }
  }
  const animations = [clip('screen', 4, [numberTrack('screen.material.emissiveIntensity', 4, (t) => 0.55 + 0.45 * Math.abs(Math.sin(t * 23)), 32)])];
  const floating = root.userData.floating;
  const out = finalize(root, { type: 'tv', variant, options: o, animations });
  if (floating) out.userData.floating = true;
  return out;
}
