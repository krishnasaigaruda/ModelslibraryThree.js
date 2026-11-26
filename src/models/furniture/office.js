import {
  THREE, M, mesh, group, roundedBox, cushion, curveTube, lathe,
  metalMat, plasticMat, glassMat, enamel, barPull, drawerBox, caster,
} from './common.js';
import { finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { brandEmblem } from '../../core/brand.js';
import { rotateTrack, moveTrack, clip } from '../../core/animation.js';

/* =============================== OFFICE =============================== */

export const OFFICE_VARIANTS = {
  'filing-cabinet': { color: '#6f7479' },
  whiteboard: { color: '#f7f8f8' },
  'water-cooler': { color: '#f2f2f0' },
  printer: { color: '#e4e6e8' },
  locker: { color: '#3d5a73' },
};

export function createOffice(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(OFFICE_VARIANTS, o.variant, 'office');
  const v = OFFICE_VARIANTS[variant];
  const root = group(`office-${variant}`);
  const P = enamel(o.color ?? v.color);
  const animations = [];
  const oneShot = [];

  if (variant === 'filing-cabinet') {
    const w = 0.47;
    const h = 1.32;
    const d = 0.62;
    mesh(roundedBox(w, h, d - 0.03, 0.008), P, { parent: root, at: [0, h / 2, -0.015] });
    const n = 4;
    const dh = (h - 0.04) / n;
    const tracks = [];
    for (let i = 0; i < n; i++) {
      const dr = group(`drawer${i}`, { parent: root, at: [0, 0.02 + dh * (i + 0.5), d / 2 - 0.02] });
      mesh(roundedBox(w - 0.02, dh - 0.012, 0.02, 0.006, 2), P, { parent: dr });
      dr.add(drawerBox(w - 0.06, dh - 0.04, d - 0.08, P));
      const pull = barPull(0.16, metalMat('chrome'), { standoff: 0.025 });
      pull.position.set(0, -0.02, 0.01);
      dr.add(pull);
      mesh(roundedBox(0.08, 0.035, 0.004, 0.002), metalMat('chrome'), { parent: dr, at: [0, dh / 2 - 0.07, 0.011] });
      mesh(roundedBox(0.07, 0.025, 0.002, 0.001), new THREE.MeshStandardMaterial({ color: '#f4f0e2' }), { parent: dr, at: [0, dh / 2 - 0.07, 0.0135] });
      tracks.push(moveTrack(dr, 1, (t) => [0, 0, Math.min(1, t * 1.25) * (d - 0.15) * (i === n - 1 ? 1 : 0)]));
    }
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 16).rotateX(Math.PI / 2), metalMat('chrome'), { parent: root, at: [0.17, h - 0.04, d / 2 - 0.005] });
    animations.push(clip('drawerOpen', 1, tracks));
    oneShot.push('drawerOpen');
  } else if (variant === 'whiteboard') {
    const frame = metalMat('steel');
    const W = 1.5;
    const H = 1.0;
    const cy = 1.25;
    for (const s of [1, -1]) {
      curveTube([[s * (W / 2 + 0.05), 0.08, 0], [s * (W / 2 + 0.05), cy + H / 2, 0]], 0.018, frame, { parent: root, segments: 2 });
      curveTube([[s * (W / 2 + 0.05), 0.08, 0.28], [s * (W / 2 + 0.05), 0.08, -0.28]], 0.018, frame, { parent: root, segments: 2 });
      for (const z of [0.28, -0.28]) {
        const c = caster(plasticMat('#222'));
        c.position.set(s * (W / 2 + 0.05), 0, z);
        c.scale.setScalar(1.2);
        root.add(c);
      }
    }
    curveTube([[-(W / 2 + 0.05), 0.4, 0], [W / 2 + 0.05, 0.4, 0]], 0.012, frame, { parent: root, segments: 2 });
    const board = group('board', { parent: root, at: [0, cy, 0] });
    mesh(roundedBox(W + 0.04, H + 0.04, 0.03, 0.01), frame, { parent: board });
    // pivot hubs connecting the board to the stand posts
    for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.05, 16).rotateZ(Math.PI / 2), frame, { parent: board, at: [s * (W / 2 + 0.035), 0, 0] });
    mesh(roundedBox(W, H, 0.004, 0.002), new THREE.MeshPhysicalMaterial({ color: '#fbfcfc', roughness: 0.08, clearcoat: 1 }), { parent: board, at: [0, 0, 0.016] });
    mesh(roundedBox(W * 0.6, 0.04, 0.06, 0.008), frame, { parent: board, at: [0, -H / 2 - 0.01, 0.04] });
    const ink = [new THREE.MeshBasicMaterial({ color: '#1a3d8f' }), new THREE.MeshBasicMaterial({ color: '#c62828' }), new THREE.MeshBasicMaterial({ color: '#2e7d32' })];
    const z = 0.0185;
    curveTube([[-0.6, 0.3, z], [-0.4, 0.33, z], [-0.15, 0.28, z], [0.1, 0.32, z]], 0.003, ink[0], { parent: board, segments: 40, radialSegments: 4 });
    curveTube([[-0.6, 0.15, z], [-0.3, 0.17, z], [0.0, 0.14, z]], 0.003, ink[0], { parent: board, segments: 30, radialSegments: 4 });
    const box = [[-0.55, -0.05], [-0.2, -0.05], [-0.2, -0.3], [-0.55, -0.3], [-0.55, -0.05]].map(([x, y]) => [x, y, z]);
    curveTube(box, 0.003, ink[1], { parent: board, segments: 40, radialSegments: 4 });
    curveTube([[0.05, -0.18, z], [0.3, -0.18, z], [0.25, -0.13, z]], 0.003, ink[2], { parent: board, segments: 20, radialSegments: 4 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      curveTube([[0.45, 0.0, z], [0.45 + Math.cos(a) * 0.14, Math.sin(a) * 0.14, z]], 0.003, ink[1], { parent: board, segments: 2, radialSegments: 4 });
    }
    for (let i = 0; i < 3; i++) {
      mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.12, 12).rotateZ(Math.PI / 2), plasticMat('#f4f4f4'), { parent: board, at: [-0.15 + i * 0.05, -H / 2 + 0.02, 0.05] });
      mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.035, 12).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: ink[i].color }), { parent: board, at: [-0.15 + i * 0.05 + 0.06, -H / 2 + 0.02, 0.05] });
    }
    animations.push(clip('flip', 3, [rotateTrack(board, 'x', 3, (t) => Math.min(1, t * 1.2) * Math.PI)]));
    oneShot.push('flip');
  } else if (variant === 'water-cooler') {
    const w = 0.32;
    mesh(roundedBox(w, 1.0, w, 0.03, 3), P, { parent: root, at: [0, 0.5, 0] });
    mesh(roundedBox(w - 0.06, 0.2, 0.06, 0.02), plasticMat('#2a2a2a', 0.5), { parent: root, at: [0, 0.78, w / 2 - 0.02] });
    mesh(roundedBox(w - 0.08, 0.02, 0.1, 0.006), plasticMat('#555', 0.5), { parent: root, at: [0, 0.68, w / 2 + 0.01] });
    for (const [x, c] of [[-0.05, '#1e88e5'], [0.05, '#e53935']]) {
      mesh(roundedBox(0.03, 0.04, 0.04, 0.008), plasticMat(c, 0.35), { parent: root, at: [x, 0.83, w / 2 + 0.03] });
    }
    { const e = brandEmblem(0.05, { name: 'emblem' }); e.position.set(0, 0.45, w / 2 + 0.002); root.add(e); }
    const bottle = lathe([[0, 0], [0.04, 0], [0.04, 0.05], [0.13, 0.11], [0.135, 0.15], [0.135, 0.2], [0.13, 0.22], [0.135, 0.24], [0.135, 0.36], [0.12, 0.42], [0, 0.44]], 48);
    bottle.rotateX(Math.PI);
    mesh(bottle, new THREE.MeshPhysicalMaterial({ color: '#8ac6ea', roughness: 0.05, transparent: true, opacity: 0.45, clearcoat: 1 }), { parent: root, at: [0, 1.44, 0] });
    mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 32), plasticMat('#d9d9d6', 0.4), { parent: root, at: [0, 1.012, 0] });
    mesh(new THREE.CylinderGeometry(0.128, 0.128, 0.28, 40), new THREE.MeshPhysicalMaterial({ color: '#4ea3db', roughness: 0.05, transparent: true, opacity: 0.35 }), { parent: root, at: [0, 1.2, 0] });
  } else if (variant === 'printer') {
    const w = 0.46;
    const h = 0.3;
    const d = 0.4;
    mesh(roundedBox(w, h, d, 0.025, 3), P, { parent: root, at: [0, h / 2 + 0.01, 0] });
    mesh(roundedBox(w - 0.02, 0.02, d - 0.04, 0.008), plasticMat('#2c2e30', 0.4), { parent: root, at: [0, h + 0.012, -0.01] });
    mesh(roundedBox(w - 0.1, 0.012, 0.18, 0.004), plasticMat('#cfd2d5', 0.5), { parent: root, at: [0, 0.13, d / 2 + 0.06] });
    mesh(roundedBox(0.21, 0.004, 0.25, 0.001), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }), { parent: root, at: [0, 0.14, d / 2 + 0.02] });
    mesh(roundedBox(0.12, 0.05, 0.01, 0.006), plasticMat('#111', 0.25), { parent: root, at: [w / 2 - 0.09, h - 0.03, d / 2 + 0.002] });
    mesh(roundedBox(0.09, 0.03, 0.004, 0.002), M.emissive('#4fc3f7', 1), { parent: root, at: [w / 2 - 0.09, h - 0.03, d / 2 + 0.008] });
    mesh(roundedBox(w - 0.04, 0.008, 0.004, 0.002), plasticMat('#9da1a5', 0.6), { parent: root, at: [0, 0.08, d / 2 + 0.002] });
    { const e = brandEmblem(0.035, { name: 'emblem' }); e.position.set(-w / 2 + 0.05, h - 0.03, d / 2 + 0.002); root.add(e); }
  } else {
    const w = 0.38;
    const h = 1.8;
    const d = 0.45;
    const n = 3;
    const tracks = [];
    mesh(roundedBox(w * n, 0.1, d - 0.02, 0.006), plasticMat('#1d1d1d'), { parent: root, at: [0, 0.05, -0.01] });
    mesh(roundedBox(w * n, h - 0.1, d - 0.02, 0.006), P, { parent: root, at: [0, 0.1 + (h - 0.1) / 2, -0.01] });
    for (let i = 0; i < n; i++) {
      const x0 = -((n * w) / 2) + i * w;
      const door = group(`door${i}`, { parent: root, at: [x0 + 0.005, 0.1 + (h - 0.1) / 2, d / 2 - 0.01] });
      mesh(roundedBox(w - 0.012, h - 0.12, 0.018, 0.005, 2), P, { parent: door, at: [(w - 0.012) / 2, 0, 0.005] });
      for (let k = 0; k < 5; k++) mesh(roundedBox(w - 0.12, 0.012, 0.006, 0.003), plasticMat('#1b1b1b', 0.6), { parent: door, at: [(w - 0.012) / 2, h / 2 - 0.2 - k * 0.03, 0.015] });
      for (let k = 0; k < 5; k++) mesh(roundedBox(w - 0.12, 0.012, 0.006, 0.003), plasticMat('#1b1b1b', 0.6), { parent: door, at: [(w - 0.012) / 2, -h / 2 + 0.25 + k * 0.03, 0.015] });
      const pull = barPull(0.12, metalMat('chrome'), { standoff: 0.025 });
      pull.rotation.z = Math.PI / 2;
      pull.position.set(w - 0.06, 0.05, 0.014);
      door.add(pull);
      mesh(roundedBox(0.06, 0.025, 0.004, 0.002), metalMat('chrome'), { parent: door, at: [(w - 0.012) / 2, h / 2 - 0.12, 0.015] });
      if (i === 0) tracks.push(rotateTrack(door, 'y', 1, (t) => -Math.min(1, t * 1.2) * 1.8));
    }
    animations.push(clip('doorOpen', 1, tracks));
    oneShot.push('doorOpen');
  }
  const out = finalize(root, { type: 'office-equipment', variant, options: o, animations });
  if (oneShot.length) out.userData.premade.oneShot = oneShot;
  return out;
}
