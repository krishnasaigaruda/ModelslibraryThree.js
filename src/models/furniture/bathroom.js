import {
  THREE, M, mesh, group, roundedBox, cushion, curveTube, lathe,
  woodMat, metalMat, plasticMat, glassMat, ceramic, stoneMat, panelFront, barPull,
} from './common.js';
import { finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, clip } from '../../core/animation.js';

/* ============================== BATHROOM ============================== */

export const BATHROOM_VARIANTS = {
  toilet: {},
  'clawfoot-tub': { metal: 'brass' },
  'modern-tub': { metal: 'chrome' },
  shower: { metal: 'chrome' },
  basin: { metal: 'chrome' },
  vanity: { wood: 'walnut', metal: 'black' },
};

/** Oval shell with real wall thickness: lathe a wall profile then stretch in X. */
function ovalShell(rx, rz, h, wall, profile = 'tub') {
  const r = rz;
  const P = profile === 'tub'
    ? [[0, 0], [r * 0.7, 0], [r * 0.92, h * 0.15], [r, h * 0.6], [r * 1.04, h * 0.95], [r * 1.06, h], [r * 1.06 - wall * 1.6, h], [r - wall, h * 0.6], [r * 0.92 - wall, h * 0.18], [r * 0.7 - wall, wall], [0, wall]]
    : [[0, 0], [r * 0.5, 0], [r * 0.95, h * 0.5], [r, h], [r - wall, h], [r * 0.9 - wall, h * 0.5], [r * 0.45, wall], [0, wall]];
  const g = lathe(P, 64);
  g.scale(rx / rz, 1, 1);
  return g;
}

function faucet(parent, at, mat, { spout = 0.14, h = 0.18 } = {}) {
  const [x, y, z] = at;
  mesh(lathe([[0, 0], [0.025, 0], [0.025, 0.01], [0.018, 0.03], [0, 0.03]], 24), mat, { parent, at });
  curveTube([[x, y, z], [x, y + h, z], [x, y + h + 0.03, z + 0.04], [x, y + h, z + spout]], 0.011, mat, { parent, segments: 24 });
  curveTube([[x, y + h * 0.6, z], [x + 0.06, y + h * 0.65, z - 0.01]], 0.005, mat, { parent });
}

export function createBathroom(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BATHROOM_VARIANTS, o.variant, 'bathroom');
  const v = BATHROOM_VARIANTS[variant];
  const root = group(`bathroom-${variant}`);
  const C = ceramic(o.color ?? '#fbfbf8');
  const MT = metalMat(o.metal ?? v.metal ?? 'chrome');
  const animations = [];
  const oneShot = [];

  if (variant === 'toilet') {
    // pedestal
    const ped = lathe([[0, 0], [0.12, 0], [0.13, 0.02], [0.11, 0.08], [0.1, 0.25], [0.15, 0.36], [0, 0.36]], 40);
    ped.scale(1, 1, 1.3);
    mesh(ped, C, { parent: root, at: [0, 0, 0.08] });
    // bowl with thickness, oval (front = +Z)
    const bowl = ovalShell(0.19, 0.25, 0.14, 0.02, 'bowl');
    mesh(bowl, C, { parent: root, at: [0, 0.27, 0.12] });
    mesh(new THREE.CircleGeometry(0.1, 32).rotateX(-Math.PI / 2).scale(0.76, 1, 1), new THREE.MeshPhysicalMaterial({ color: '#cfe3ea', roughness: 0.05, transparent: true, opacity: 0.6 }), { parent: root, at: [0, 0.33, 0.12] });
    // seat + lid (hinged at back)
    const seatGeo = new THREE.TorusGeometry(0.2, 0.025, 12, 48);
    seatGeo.rotateX(Math.PI / 2);
    seatGeo.scale(0.95, 0.6, 1.2);
    mesh(seatGeo, C, { parent: root, at: [0, 0.425, 0.13] });
    const lid = group('lid', { parent: root, at: [0, 0.44, -0.11] });
    const lidGeo = cushion(0.42, 0.025, 0.5, { radius: 0.012, bulge: 0.4 });
    const lp = lidGeo.attributes.position;
    for (let i = 0; i < lp.count; i++) { const zz = lp.getZ(i); const k = zz > 0 ? 0.5 + 0.5 * Math.sqrt(Math.max(0, 1 - (zz / 0.25) ** 2)) : 0.85 + 0.15 * Math.sqrt(Math.max(0, 1 - (zz / 0.25) ** 2)); lp.setX(i, lp.getX(i) * k); }
    lidGeo.computeVertexNormals();
    mesh(lidGeo, C, { parent: lid, at: [0, 0.0, 0.25] });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 12).rotateZ(Math.PI / 2), C, { parent: root, at: [0, 0.44, -0.11] });
    // tank
    mesh(roundedBox(0.44, 0.36, 0.18, 0.04, 3), C, { parent: root, at: [0, 0.6, -0.2] });
    mesh(roundedBox(0.46, 0.04, 0.2, 0.015, 2), C, { parent: root, at: [0, 0.8, -0.2] });
    mesh(roundedBox(0.06, 0.015, 0.02, 0.006), MT, { parent: root, at: [-0.17, 0.72, -0.1] });
    animations.push(clip('lidOpen', 1, [rotateTrack(lid, 'x', 1, (t) => -Math.min(1, t * 1.2) * 1.5)]));
    oneShot.push('lidOpen');
  } else if (variant === 'clawfoot-tub') {
    mesh(ovalShell(0.85, 0.38, 0.55, 0.03, 'tub'), C, { parent: root, at: [0, 0.15, 0] });
    mesh(new THREE.TorusGeometry(0.4, 0.018, 10, 64).rotateX(Math.PI / 2).scale(0.85 / 0.38 * 1.0, 1, 1), C, { parent: root, at: [0, 0.7, 0] });
    for (const sx of [1, -1]) for (const sz of [1, -1]) {
      const foot = group(null, { parent: root, at: [sx * 0.55, 0, sz * 0.2] });
      mesh(lathe([[0, 0], [0.04, 0], [0.045, 0.02], [0.025, 0.06], [0.03, 0.12], [0.05, 0.17], [0, 0.17]], 16), MT, { parent: foot });
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.018, 10, 8), MT, { parent: foot, at: [Math.cos(a) * 0.035, 0.012, Math.sin(a) * 0.035] }); }
    }
    mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2).scale(0.78, 1, 0.33), new THREE.MeshPhysicalMaterial({ color: '#a8d0dc', roughness: 0.03, transparent: true, opacity: 0.55 }), { parent: root, at: [0, 0.55, 0] });
    const fx = -0.8;
    curveTube([[fx, 0.0, 0], [fx, 0.82, 0], [fx + 0.05, 0.9, 0], [fx + 0.14, 0.86, 0]], 0.012, MT, { parent: root, segments: 32 });
    for (const z of [0.06, -0.06]) {
      curveTube([[fx, 0.81, 0], [fx, 0.81, z]], 0.007, MT, { parent: root });
      mesh(lathe([[0, 0], [0.018, 0], [0.02, 0.02], [0, 0.03]], 12), MT, { parent: root, at: [fx, 0.8, z] });
    }
  } else if (variant === 'modern-tub') {
    const g = ovalShell(0.85, 0.4, 0.58, 0.035, 'tub');
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const yy = p.getY(i); if (yy < 0.1) { p.setX(i, p.getX(i) * 0.92); p.setZ(i, p.getZ(i) * 0.92); } }
    g.computeVertexNormals();
    mesh(g, C, { parent: root, at: [0, 0, 0] });
    mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2).scale(0.78, 1, 0.35), new THREE.MeshPhysicalMaterial({ color: '#a8d0dc', roughness: 0.03, transparent: true, opacity: 0.55 }), { parent: root, at: [0, 0.42, 0] });
    curveTube([[-1.0, 0, 0], [-1.0, 0.9, 0], [-0.97, 0.98, 0], [-0.88, 0.95, 0]], 0.014, MT, { parent: root, segments: 32 });
    mesh(lathe([[0, 0], [0.05, 0], [0.05, 0.015], [0, 0.015]], 24), MT, { parent: root, at: [-1.0, 0, 0] });
  } else if (variant === 'shower') {
    const S = 0.9;
    mesh(roundedBox(S, 0.06, S, 0.02, 2), C, { parent: root, at: [0, 0.03, 0] });
    mesh(lathe([[0, 0], [0.04, 0], [0.04, 0.003], [0, 0.004]], 24), MT, { parent: root, at: [0, 0.06, 0] });
    const wallTile = new THREE.MeshPhysicalMaterial({ color: '#e9ecea', roughness: 0.2, clearcoat: 0.6 });
    mesh(roundedBox(S, 2.0, 0.04, 0.008), wallTile, { parent: root, at: [0, 1.06, -S / 2 + 0.02] });
    mesh(roundedBox(0.04, 2.0, S, 0.008), wallTile, { parent: root, at: [-S / 2 + 0.02, 1.06, 0] });
    for (let r = 1; r < 10; r++) mesh(roundedBox(S - 0.01, 0.003, 0.003, 0.001), plasticMat('#cfd3d1', 0.6), { parent: root, at: [0, 0.06 + r * 0.2, -S / 2 + 0.042] });
    const G = glassMat('#e4f1f2', 0.25);
    mesh(roundedBox(0.008, 1.9, S - 0.06, 0.003), G, { parent: root, at: [S / 2 - 0.01, 1.01, -0.02] });
    for (const z of [S / 2 - 0.02, -S / 2 + 0.04]) mesh(roundedBox(0.02, 1.92, 0.02, 0.006), MT, { parent: root, at: [S / 2 - 0.01, 1.02, z] });
    mesh(roundedBox(0.02, 0.02, S - 0.04, 0.006), MT, { parent: root, at: [S / 2 - 0.01, 1.98, 0] });
    const door = group('door', { parent: root, at: [S / 2 - 0.02, 1.01, S / 2 - 0.01] });
    mesh(roundedBox(S - 0.06, 1.9, 0.008, 0.003), G, { parent: door, at: [-(S - 0.06) / 2, 0, 0] });
    const pull = barPull(0.3, MT, { standoff: 0.03 });
    pull.rotation.z = Math.PI / 2;
    pull.position.set(-(S - 0.12), 0, 0.006);
    door.add(pull);
    for (const hy of [0.8, -0.8]) mesh(roundedBox(0.04, 0.06, 0.02, 0.006), MT, { parent: door, at: [0, hy, 0] });
    curveTube([[0, 1.95, -S / 2 + 0.04], [0, 2.02, -S / 2 + 0.12], [0, 2.02, -S / 2 + 0.3]], 0.012, MT, { parent: root, segments: 20 });
    mesh(lathe([[0, 0], [0.11, 0], [0.11, 0.012], [0.02, 0.03], [0, 0.03]], 40), MT, { parent: root, at: [0, 1.99, -S / 2 + 0.3] });
    mesh(lathe([[0, 0], [0.05, 0], [0.05, 0.02], [0, 0.03]], 24).rotateX(Math.PI / 2), MT, { parent: root, at: [0, 1.1, -S / 2 + 0.04] });
    curveTube([[0, 1.1, -S / 2 + 0.07], [0.07, 1.1, -S / 2 + 0.09]], 0.008, MT, { parent: root });
    animations.push(clip('doorOpen', 1, [rotateTrack(door, 'y', 1, (t) => -Math.min(1, t * 1.2) * 1.3)]));
    oneShot.push('doorOpen');
  } else if (variant === 'basin') {
    mesh(lathe([[0, 0], [0.14, 0], [0.145, 0.02], [0.09, 0.08], [0.07, 0.4], [0.09, 0.6], [0.14, 0.7], [0, 0.7]], 40), C, { parent: root });
    const bowl = ovalShell(0.3, 0.24, 0.16, 0.025, 'bowl');
    mesh(bowl, C, { parent: root, at: [0, 0.68, 0.02] });
    mesh(roundedBox(0.36, 0.05, 0.09, 0.02), C, { parent: root, at: [0, 0.835, -0.255] });
    faucet(root, [0, 0.86, -0.255], MT, { spout: 0.15, h: 0.14 });
  } else {
    const W = woodMat(o.wood ?? v.wood);
    const w = 1.0;
    const h = 0.82;
    const d = 0.52;
    for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(roundedBox(0.04, 0.16, 0.04, 0.008), MT, { parent: root, at: [sx * (w / 2 - 0.04), 0.08, sz * (d / 2 - 0.05)] });
    mesh(roundedBox(w, h - 0.2, d - 0.02, 0.008), W, { parent: root, at: [0, 0.16 + (h - 0.2) / 2, -0.01] });
    const top = stoneMat('#f1efea', '#9a948c');
    mesh(roundedBox(w + 0.02, 0.03, d + 0.01, 0.006), top, { parent: root, at: [0, h - 0.025, 0] });
    mesh(ovalShell(0.22, 0.17, 0.13, 0.012, 'bowl'), C, { parent: root, at: [0, h - 0.01, 0.03] });
    faucet(root, [0, h - 0.01, -d / 2 + 0.07], MT, { spout: 0.16, h: 0.26 });
    const tracks = [];
    for (const s of [1, -1]) {
      const door = group(`door_${s > 0 ? 'R' : 'L'}`, { parent: root, at: [s * (w / 2 - 0.01), 0.16 + (h - 0.2) / 2, d / 2 - 0.01] });
      const p = panelFront(w / 2 - 0.02, h - 0.24, 0.02, W);
      p.position.x = -s * (w / 4 - 0.005);
      door.add(p);
      const k = barPull(0.14, MT);
      k.rotation.z = Math.PI / 2;
      k.position.set(-s * (w / 2 - 0.06), 0, 0.012);
      door.add(k);
      tracks.push(rotateTrack(door, 'y', 1, (t) => s * Math.min(1, t * 1.25) * 1.6));
    }
    animations.push(clip('doorsOpen', 1, tracks));
    oneShot.push('doorsOpen');
  }
  const out = finalize(root, { type: 'bathroom', variant, options: o, animations });
  if (oneShot.length) out.userData.premade.oneShot = oneShot;
  return out;
}
