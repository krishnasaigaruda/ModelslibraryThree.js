import {
  THREE, M, mesh, group, roundedBox, cushion, curveTube, lathe, rng,
  woodMat, fabricMat, metalMat, plasticMat, glassMat, ceramic, rugTexture, paintingTexture,
} from './common.js';
import { finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, clip, wave } from '../../core/animation.js';

/* ------------------------------ helpers ------------------------------ */

/**
 * Leaf blade: subdivided strip shaped by a width profile, folded along the
 * midrib and curled backwards. Base at origin, grows along +Y, faces +Z.
 */
function leafGeo(len, width, { curl = 0.3, fold = 0.25, profile = (t) => Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 0.7, serrate = 0, rows = 14 } = {}) {
  const g = new THREE.PlaneGeometry(width, len, 6, rows);
  g.translate(0, len / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = THREE.MathUtils.clamp(p.getY(i) / len, 0, 0.9999);
    let w = Math.max(0, profile(t) || 0);
    if (serrate) w *= 0.75 + 0.25 * Math.abs(Math.sin(t * serrate * Math.PI));
    const x = p.getX(i) * w;
    const z = -Math.abs(x) * fold - curl * len * t * t;
    p.setXYZ(i, x, p.getY(i) * (1 - curl * 0.25 * t * t), z);
  }
  g.computeVertexNormals();
  return g;
}

function leafMat(color, variant = 0) {
  return new THREE.MeshPhysicalMaterial({ name: 'leaf', color: M.toColor(color).offsetHSL(0, 0, variant), roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.5, side: THREE.DoubleSide });
}

/** Planter pot with soil, returns soil height. */
function pot(parent, r, h, mat, style = 'round') {
  const P = style === 'tapered'
    ? [[0, 0], [r * 0.7, 0], [r, h * 0.95], [r * 1.04, h], [r * 0.94, h], [r * 0.9, h * 0.9], [0, h * 0.9]]
    : style === 'bowl'
      ? [[0, 0], [r * 0.6, 0], [r * 0.95, h * 0.5], [r, h], [r * 0.92, h], [r * 0.86, h * 0.6], [0, h * 0.6]]
      : [[0, 0], [r * 0.85, 0], [r * 0.9, h * 0.06], [r * 0.92, h * 0.94], [r * 0.98, h], [r * 0.9, h], [r * 0.86, h * 0.9], [0, h * 0.9]];
  mesh(lathe(P, 40), mat, { parent });
  const soilY = style === 'bowl' ? h * 0.85 : h * 0.93;
  mesh(new THREE.CircleGeometry(r * (style === 'tapered' ? 0.95 : 0.9), 32).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#3b2a1e', roughness: 1 }), { parent, at: [0, soilY, 0] });
  return soilY;
}

/* =============================== PLANTS =============================== */

export const PLANT_VARIANTS = {
  monstera: { pot: '#e9e3d8' },
  snake: { pot: '#2f3133' },
  fern: { pot: '#b5643c' },
  cactus: { pot: '#c9734a' },
  'fiddle-leaf': { pot: '#f2f0ea' },
  succulent: { pot: '#8aa0a8' },
};

export function createPlant(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(PLANT_VARIANTS, o.variant, 'plant');
  const v = PLANT_VARIANTS[variant];
  const root = group(`plant-${variant}`);
  const r = rng(o.seed ?? 4);
  const potMat = variant === 'fern' || variant === 'cactus'
    ? new THREE.MeshStandardMaterial({ color: M.toColor(o.potColor ?? v.pot), roughness: 0.85 })
    : ceramic(o.potColor ?? v.pot);
  const leaves = group('leaves', { parent: root });
  const animations = [];

  if (variant === 'monstera') {
    const y = pot(root, 0.2, 0.36, potMat, 'tapered');
    const mats = [leafMat('#24603a'), leafMat('#2c6e42', 0.03), leafMat('#1f5534', -0.02)];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + r.range(-0.2, 0.2);
      const reach = r.range(0.2, 0.42);
      const hgt = r.range(0.45, 0.85);
      const tip = [Math.cos(a) * reach, y + hgt, Math.sin(a) * reach];
      curveTube([[0, y, 0], [Math.cos(a) * reach * 0.3, y + hgt * 0.6, Math.sin(a) * reach * 0.3], tip], 0.007, mats[0], { parent: leaves, segments: 12, radialSegments: 6 });
      const L = r.range(0.32, 0.45);
      const g = leafGeo(L, L * 0.95, { curl: 0.35, fold: 0.1, rows: 18, profile: (t) => Math.sin(Math.PI * t) ** 0.55 * (0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, t * 2.2))) });
      const leaf = mesh(g, mats[i % 3], { parent: leaves, at: tip });
      leaf.rotation.set(1.05 + r.range(-0.2, 0.25), Math.PI / 2 - a, 0, 'YXZ');
    }
  } else if (variant === 'snake') {
    const y = pot(root, 0.13, 0.28, potMat, 'round');
    const mat = new THREE.MeshPhysicalMaterial({ color: '#2d5a33', roughness: 0.4, clearcoat: 0.4, side: THREE.DoubleSide });
    const edge = new THREE.MeshPhysicalMaterial({ color: '#c9c25a', roughness: 0.4, side: THREE.DoubleSide });
    for (let i = 0; i < 9; i++) {
      const a = r.range(0, Math.PI * 2);
      const d = r.range(0, 0.07);
      const L = r.range(0.45, 0.8);
      const g = leafGeo(L, 0.07, { curl: 0.02, fold: 0.5, profile: (t) => Math.min(1, 0.6 + t * 2) * (1 - t ** 4) });
      const leaf = mesh(g, mat, { parent: leaves, at: [Math.cos(a) * d, y - 0.01, Math.sin(a) * d] });
      leaf.rotation.set(r.range(-0.12, 0.12), r.range(0, Math.PI), r.range(-0.12, 0.12));
      const e = mesh(leafGeo(L * 1.002, 0.074, { curl: 0.02, fold: 0.5, profile: (t) => Math.min(1, 0.6 + t * 2) * (1 - t ** 4) }), edge, { parent: leaf, at: [0, 0, -0.002] });
      void e;
    }
  } else if (variant === 'fern') {
    const y = pot(root, 0.17, 0.26, potMat, 'round');
    const mats = [leafMat('#4c8a3a'), leafMat('#5a9a45', 0.03)];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + r.range(-0.15, 0.15);
      const L = r.range(0.32, 0.46);
      const g = leafGeo(L, 0.15, { curl: 0.65, fold: 0.15, serrate: 22, profile: (t) => Math.sin(Math.PI * t) ** 0.6 });
      const leaf = mesh(g, mats[i % 2], { parent: leaves, at: [0, y, 0] });
      leaf.rotation.set(-0.35 - r.range(0, 0.3), -a, 0, 'YXZ');
    }
    animations.push(clip('sway', 4, [rotateTrack(leaves, 'z', 4, (t) => wave(t) * 0.04)]));
  } else if (variant === 'cactus') {
    const y = pot(root, 0.13, 0.2, potMat, 'tapered');
    const cact = new THREE.MeshPhysicalMaterial({ color: '#4f7f3f', roughness: 0.6, clearcoat: 0.2 });
    const column = (h, rad) => {
      const g = lathe([[0, 0], [rad, 0], [rad, h - rad], [rad * 0.7, h - rad * 0.3], [0, h]], 32);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const z = p.getZ(i);
        const ang = Math.atan2(z, x);
        const k = 1 + 0.09 * Math.cos(ang * 10);
        p.setX(i, x * k);
        p.setZ(i, z * k);
      }
      g.computeVertexNormals();
      return g;
    };
    mesh(column(0.5, 0.06), cact, { parent: leaves, at: [0, y - 0.02, 0] });
    for (const s of [1, -1]) {
      const arm = group(null, { parent: leaves, at: [s * 0.045, y + (s > 0 ? 0.2 : 0.28), 0] });
      curveTube([[0, 0, 0], [s * 0.07, 0.0, 0], [s * 0.09, 0.05, 0]], 0.035, cact, { parent: arm, segments: 12 });
      mesh(column(0.16, 0.035), cact, { parent: arm, at: [s * 0.09, 0.04, 0] });
    }
    for (let i = 0; i < 40; i++) {
      const ang = r.range(0, Math.PI * 2);
      const hh = r.range(0.02, 0.45);
      mesh(new THREE.ConeGeometry(0.002, 0.012, 4), plasticMat('#f1ead2'), { parent: leaves, at: [Math.cos(ang) * 0.066, y + hh, Math.sin(ang) * 0.066], rot: [0, 0, -Math.PI / 2] }).rotation.y = -ang;
    }
    mesh(new THREE.SphereGeometry(0.025, 12, 8), new THREE.MeshPhysicalMaterial({ color: '#e95f8b', roughness: 0.5 }), { parent: leaves, at: [0, y + 0.48, 0] });
  } else if (variant === 'fiddle-leaf') {
    const y = pot(root, 0.22, 0.42, potMat, 'round');
    const bark = new THREE.MeshStandardMaterial({ color: '#6d5640', roughness: 0.9 });
    curveTube([[0, y, 0], [0.03, y + 0.6, 0.01], [-0.02, y + 1.1, 0], [0.01, y + 1.35, 0]], 0.022, bark, { parent: leaves, segments: 24 });
    const mats = [leafMat('#2f6b2f'), leafMat('#3a7a35', 0.03), leafMat('#285e29', -0.02)];
    for (let i = 0; i < 28; i++) {
      const t = i / 28;
      const hy = y + 0.55 + t * 0.85;
      const a = i * 2.4;
      const L = 0.22 + (1 - Math.abs(t - 0.5)) * 0.1;
      const g = leafGeo(L, L * 0.75, { curl: 0.2, fold: 0.18, profile: (tt) => Math.sin(Math.PI * Math.min(1, tt)) ** 0.45 * (0.6 + 0.4 * tt) });
      const leaf = mesh(g, mats[i % 3], { parent: leaves, at: [Math.cos(a) * 0.02, hy, Math.sin(a) * 0.02] });
      leaf.rotation.set(1.0 + r.range(-0.3, 0.3), Math.PI / 2 - a, 0, 'YXZ');
    }
    animations.push(clip('sway', 5, [rotateTrack(leaves, 'x', 5, (t) => wave(t) * 0.02)]));
  } else {
    const y = pot(root, 0.14, 0.08, potMat, 'bowl');
    const cols = ['#7fae8a', '#9cc3a0', '#c48aa6', '#6f9c7f'];
    for (let c = 0; c < 4; c++) {
      const cx = [0.05, -0.05, 0.02, -0.04][c];
      const cz = [0.04, 0.03, -0.06, -0.03][c];
      const mat = new THREE.MeshPhysicalMaterial({ color: cols[c], roughness: 0.4, clearcoat: 0.5 });
      for (let i = 0; i < 12; i++) {
        const a = i * 2.4;
        const ring = i / 12;
        const L = 0.035 + ring * 0.025;
        const g = new THREE.SphereGeometry(1, 10, 8);
        g.scale(0.35, 1, 0.18);
        g.translate(0, 1, 0);
        g.scale(L, L, L);
        const leaf = mesh(g, mat, { parent: leaves, at: [cx, y, cz] });
        leaf.rotation.set(0.3 + ring * 0.9, -a, 0, 'YXZ');
      }
    }
  }
  return finalize(root, { type: 'plant', variant, options: o, animations });
}

/* =============================== VASES =============================== */

export const VASE_VARIANTS = {
  amphora: { color: '#3f6f7a' },
  bud: { color: '#e9d8c4', flowers: 'tulip' },
  cylinder: { color: '#dfeef0', glass: true, flowers: 'stems' },
  bowl: { color: '#c7a37a' },
};

export function createVase(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VASE_VARIANTS, o.variant, 'vase');
  const v = VASE_VARIANTS[variant];
  const root = group(`vase-${variant}`);
  const mat = v.glass ? glassMat(o.color ?? v.color, 0.35) : ceramic(o.color ?? v.color);
  const profiles = {
    amphora: [[0, 0], [0.06, 0], [0.065, 0.01], [0.12, 0.12], [0.13, 0.2], [0.09, 0.32], [0.05, 0.38], [0.055, 0.42], [0.07, 0.44], [0.062, 0.445], [0.045, 0.42], [0.04, 0.38], [0.08, 0.32], [0.115, 0.2], [0.105, 0.12], [0, 0.015]],
    bud: [[0, 0], [0.05, 0], [0.055, 0.01], [0.075, 0.1], [0.06, 0.18], [0.022, 0.26], [0.025, 0.3], [0.018, 0.3], [0.014, 0.26], [0.05, 0.18], [0.064, 0.1], [0, 0.012]],
    cylinder: [[0, 0], [0.07, 0], [0.07, 0.32], [0.064, 0.32], [0.064, 0.008], [0, 0.008]],
    bowl: [[0, 0], [0.08, 0], [0.085, 0.01], [0.17, 0.09], [0.19, 0.14], [0.18, 0.142], [0.16, 0.095], [0.08, 0.02], [0, 0.02]],
  };
  mesh(lathe(profiles[variant], 56), mat, { parent: root });
  const r = rng(o.seed ?? 2);
  if (v.glass) mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.18, 32), new THREE.MeshPhysicalMaterial({ color: '#cfe8ec', roughness: 0.02, transparent: true, opacity: 0.35 }), { parent: root, at: [0, 0.098, 0] });
  if (v.flowers) {
    const stem = new THREE.MeshStandardMaterial({ color: '#4c7a3a', roughness: 0.7 });
    const n = v.flowers === 'tulip' ? 3 : 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const lean = v.flowers === 'tulip' ? 0.06 : 0.1;
      const top = [Math.cos(a) * lean, (v.flowers === 'tulip' ? 0.52 : 0.62) + r.range(-0.05, 0.05), Math.sin(a) * lean];
      curveTube([[0, 0.05, 0], [top[0] * 0.3, 0.3, top[2] * 0.3], top], 0.004, stem, { parent: root, segments: 16, radialSegments: 6 });
      if (v.flowers === 'tulip') {
        const petal = new THREE.MeshPhysicalMaterial({ color: r.pick(['#e64a5f', '#f2a541', '#f7f0e6']), roughness: 0.45, side: THREE.DoubleSide });
        mesh(lathe([[0, 0], [0.018, 0.005], [0.026, 0.03], [0.022, 0.06], [0.014, 0.065]], 6), petal, { parent: root, at: top });
      } else {
        const petal = new THREE.MeshPhysicalMaterial({ color: r.pick(['#ffffff', '#f6d6e4', '#fff1b8']), roughness: 0.5, side: THREE.DoubleSide });
        for (let k = 0; k < 6; k++) {
          const g = leafGeo(0.035, 0.022, { curl: 0.2, fold: 0.1 });
          const pt = mesh(g, petal, { parent: root, at: top });
          pt.rotation.set(-1.1, (k / 6) * Math.PI * 2, 0, 'YXZ');
        }
        mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshStandardMaterial({ color: '#e0b02c' }), { parent: root, at: [top[0], top[1] + 0.004, top[2]] });
      }
    }
  }
  return finalize(root, { type: 'vase', variant, options: o, animations: [] });
}

/* ================================ RUGS ================================ */

export const RUG_VARIANTS = {
  persian: { w: 2.0, d: 3.0, colors: ['#7a1f24', '#e3c58a', '#1d2a4a', '#c27b3e'], style: 'persian' },
  modern: { w: 1.6, d: 2.3, colors: ['#d8d2c6', '#8c8f8a', '#3b3e40'], style: 'modern' },
  runner: { w: 0.75, d: 2.6, colors: ['#2f4f6f', '#e9dfcf', '#b8573c', '#6b7f5a'], style: 'stripes' },
  round: { w: 1.6, d: 1.6, colors: ['#e6dccb', '#7b8f84', '#4d5a55', '#c9a77a'], style: 'persian', round: true },
};

export function createRug(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(RUG_VARIANTS, o.variant, 'rug');
  const v = RUG_VARIANTS[variant];
  const root = group(`rug-${variant}`);
  const tex = rugTexture(o.colors ?? v.colors, o.seed ?? 1, v.style);
  const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 1 });
  const side = new THREE.MeshStandardMaterial({ color: M.toColor((o.colors ?? v.colors)[2] ?? '#555'), roughness: 1 });
  const t = 0.012;
  if (v.round) {
    mesh(new THREE.CylinderGeometry(v.w / 2, v.w / 2, t, 72), [side, top, side], { parent: root, at: [0, t / 2, 0] });
  } else {
    mesh(roundedBox(v.w, t, v.d, 0.004, 1), side, { parent: root, at: [0, t / 2 - 0.0005, 0] });
    mesh(new THREE.PlaneGeometry(v.w - 0.004, v.d - 0.004).rotateX(-Math.PI / 2), top, { parent: root, at: [0, t + 0.0002, 0] });
    const fringe = new THREE.MeshStandardMaterial({ color: '#efe6d4', roughness: 1 });
    for (const s of [1, -1]) {
      const n = Math.floor(v.w / 0.02);
      for (let i = 0; i < n; i++) {
        const x = -v.w / 2 + 0.01 + i * ((v.w - 0.02) / (n - 1));
        curveTube([[x, 0.004, s * v.d / 2], [x + 0.003, 0.002, s * (v.d / 2 + 0.03)], [x - 0.002, 0.001, s * (v.d / 2 + 0.06)]], 0.0018, fringe, { parent: root, segments: 4, radialSegments: 4 });
      }
    }
  }
  return finalize(root, { type: 'rug', variant, options: o, animations: [] });
}

/* =============================== MIRRORS =============================== */

export const MIRROR_VARIANTS = {
  'wall-round': { metal: 'brass' },
  floor: { wood: 'oak' },
  sunburst: { metal: 'gold' },
};

function mirrorMat() {
  return new THREE.MeshStandardMaterial({ name: 'mirror', color: '#e9eff1', metalness: 1, roughness: 0.02 });
}

export function createMirror(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(MIRROR_VARIANTS, o.variant, 'mirror');
  const v = MIRROR_VARIANTS[variant];
  const root = group(`mirror-${variant}`);
  if (variant === 'floor') {
    const W = woodMat(o.wood ?? v.wood);
    const lean = group(null, { parent: root, rot: [-0.1, 0, 0] });
    const w = 0.6;
    const h = 1.7;
    for (const s of [1, -1]) mesh(roundedBox(0.05, h, 0.035, 0.01), W, { parent: lean, at: [s * (w / 2 - 0.025), h / 2, 0] });
    for (const y of [0.025, h - 0.025]) mesh(roundedBox(w, 0.05, 0.035, 0.01), W, { parent: lean, at: [0, y, 0] });
    mesh(roundedBox(w - 0.09, h - 0.09, 0.006, 0.002), mirrorMat(), { parent: lean, at: [0, h / 2, 0.004] });
    lean.position.z = 0.09;
  } else {
    root.userData.floating = true;
    const MT = metalMat(o.metal ?? v.metal);
    const y = 1.5;
    const r = variant === 'sunburst' ? 0.22 : 0.4;
    mesh(new THREE.CylinderGeometry(r, r, 0.006, 64).rotateX(Math.PI / 2), mirrorMat(), { parent: root, at: [0, y, 0.006] });
    mesh(new THREE.TorusGeometry(r + 0.012, 0.016, 12, 72), MT, { parent: root, at: [0, y, 0.01] });
    if (variant === 'sunburst') {
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        const L = i % 2 ? 0.2 : 0.3;
        curveTube([[Math.cos(a) * (r + 0.03), y + Math.sin(a) * (r + 0.03), 0.008], [Math.cos(a) * (r + 0.03 + L), y + Math.sin(a) * (r + 0.03 + L), 0.008]], 0.005, MT, { parent: root, segments: 2, radialSegments: 6 });
        mesh(new THREE.SphereGeometry(0.009, 8, 6), MT, { parent: root, at: [Math.cos(a) * (r + 0.03 + L), y + Math.sin(a) * (r + 0.03 + L), 0.008] });
      }
    } else {
      curveTube([[0, y + r + 0.03, 0.01], [0, y + r + 0.2, 0.0]], 0.006, fabricMat('#6b4f35'), { parent: root });
    }
  }
  const floating = root.userData.floating;
  const out = finalize(root, { type: 'mirror', variant, options: o, animations: [] });
  if (floating) out.userData.floating = true;
  return out;
}

/* =============================== CLOCKS =============================== */

export const CLOCK_VARIANTS = {
  wall: { color: '#1d1e20' },
  grandfather: { wood: 'walnut' },
  mantel: { wood: 'cherry' },
};

function clockFace(parent, r, at, frameMat, { roman = false } = {}) {
  const face = group('face', { parent, at });
  mesh(new THREE.CylinderGeometry(r, r, 0.004, 64).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#f6f3ea', roughness: 0.6 }), { parent: face });
  const ink = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.6 });
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const big = i % 5 === 0;
    const len = big ? r * (roman ? 0.12 : 0.14) : r * 0.05;
    const tick = mesh(roundedBox(big ? r * 0.035 : r * 0.012, len, 0.002, r * 0.004, 1), ink, { parent: face, at: [Math.sin(a) * (r * 0.88 - len / 2), Math.cos(a) * (r * 0.88 - len / 2), 0.003] });
    tick.rotation.z = -a;
  }
  const hand = (name, len, wd, z) => {
    const pivot = group(name, { parent: face, at: [0, 0, z] });
    mesh(roundedBox(wd, len, 0.003, wd * 0.4, 1), name === 'second_hand' ? new THREE.MeshStandardMaterial({ color: '#c62828' }) : ink, { parent: pivot, at: [0, len / 2 - len * 0.12, 0] });
    return pivot;
  };
  const hour = hand('hour_hand', r * 0.55, r * 0.06, 0.006);
  const minute = hand('minute_hand', r * 0.8, r * 0.04, 0.009);
  const second = hand('second_hand', r * 0.85, r * 0.015, 0.012);
  hour.rotation.z = -1.2;
  minute.rotation.z = -3.9;
  mesh(new THREE.CylinderGeometry(r * 0.04, r * 0.04, 0.012, 16).rotateX(Math.PI / 2), metalMat('brass'), { parent: face, at: [0, 0, 0.012] });
  mesh(new THREE.TorusGeometry(r, r * 0.06, 12, 64), frameMat, { parent: face, at: [0, 0, 0.004] });
  mesh(new THREE.CylinderGeometry(r, r, 0.002, 64).rotateX(Math.PI / 2), glassMat('#ffffff', 0.12), { parent: face, at: [0, 0, 0.016] });
  return { hour, minute, second };
}

export function createClock(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(CLOCK_VARIANTS, o.variant, 'clock');
  const v = CLOCK_VARIANTS[variant];
  const root = group(`clock-${variant}`);
  const tracks = [];
  let hands;
  if (variant === 'wall') {
    root.userData.floating = true;
    const frame = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.3, clearcoat: 0.8 });
    mesh(lathe([[0, 0], [0.18, 0], [0.18, 0.03], [0, 0.03]], 64).rotateX(Math.PI / 2), frame, { parent: root, at: [0, 1.7, 0.0] });
    hands = clockFace(root, 0.165, [0, 1.7, 0.032], frame);
  } else if (variant === 'mantel') {
    const W = woodMat(o.wood ?? v.wood);
    const prof = new THREE.Shape();
    prof.moveTo(-0.22, 0);
    prof.lineTo(0.22, 0);
    prof.lineTo(0.22, 0.14);
    prof.quadraticCurveTo(0.2, 0.3, 0, 0.32);
    prof.quadraticCurveTo(-0.2, 0.3, -0.22, 0.14);
    prof.lineTo(-0.22, 0);
    const g = new THREE.ExtrudeGeometry(prof, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 24 });
    g.translate(0, 0, -0.05);
    mesh(g, W, { parent: root, at: [0, 0.03, 0] });
    mesh(roundedBox(0.5, 0.03, 0.14, 0.01), W, { parent: root, at: [0, 0.015, 0] });
    hands = clockFace(root, 0.09, [0, 0.19, 0.058], metalMat('brass'), { roman: true });
  } else {
    const W = woodMat(o.wood ?? v.wood);
    const w = 0.5;
    mesh(roundedBox(w + 0.06, 0.12, 0.34, 0.015), W, { parent: root, at: [0, 0.06, 0] });
    mesh(roundedBox(w, 1.3, 0.28, 0.01), W, { parent: root, at: [0, 0.77, -0.01] });
    mesh(roundedBox(w + 0.04, 0.5, 0.3, 0.012), W, { parent: root, at: [0, 1.67, -0.01] });
    mesh(roundedBox(w + 0.1, 0.06, 0.34, 0.015), W, { parent: root, at: [0, 1.95, -0.01] });
    for (const s of [1, -1]) mesh(lathe([[0, 0], [0.025, 0], [0.03, 0.03], [0.012, 0.07], [0, 0.08]], 16), metalMat('brass'), { parent: root, at: [s * 0.25, 1.98, 0] });
    mesh(roundedBox(w - 0.12, 1.0, 0.006, 0.004), glassMat('#e8eef0', 0.22), { parent: root, at: [0, 0.82, 0.133] });
    mesh(roundedBox(w - 0.08, 1.06, 0.02, 0.006), W, { parent: root, at: [0, 0.82, 0.124] }).visible = false;
    for (const [x, y, ww, hh] of [[0, 1.33, w - 0.06, 0.04], [0, 0.31, w - 0.06, 0.04], [w / 2 - 0.045, 0.82, 0.04, 1.06], [-w / 2 + 0.045, 0.82, 0.04, 1.06]]) mesh(roundedBox(ww, hh, 0.025, 0.008), W, { parent: root, at: [x, y, 0.13] });
    mesh(roundedBox(w - 0.14, 0.95, 0.01, 0.004), new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 0.9 }), { parent: root, at: [0, 0.82, -0.12] });
    const pend = group('pendulum', { parent: root, at: [0, 1.32, 0.0] });
    mesh(roundedBox(0.012, 0.75, 0.006, 0.003), metalMat('brass'), { parent: pend, at: [0, -0.375, 0] });
    mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 40).rotateX(Math.PI / 2), metalMat('brass'), { parent: pend, at: [0, -0.78, 0] });
    for (const x of [-0.06, 0.06]) mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 8), metalMat('brass'), { parent: root, at: [x, 0.95, -0.08] });
    hands = clockFace(root, 0.17, [0, 1.67, 0.142], metalMat('brass'), { roman: true });
    tracks.push(rotateTrack(pend, 'z', 2, (t) => Math.sin(t * Math.PI * 2) * 0.18));
  }
  // second hand ticks around in 60 s; minute hand creeps 6°.
  tracks.push(rotateTrack(hands.second, 'z', 60, (t) => -Math.floor(t * 60) / 60 * Math.PI * 2, 60));
  tracks.push(rotateTrack(hands.minute, 'z', 60, (t) => -t * (Math.PI / 30), 4));
  const floating = root.userData.floating;
  const out = finalize(root, { type: 'clock', variant, options: o, animations: [clip('tick', 60, tracks)] });
  if (floating) out.userData.floating = true;
  return out;
}

/* ========================= PICTURE FRAMES ========================= */

export const FRAME_VARIANTS = {
  landscape: { w: 0.9, h: 0.6, wood: 'walnut' },
  portrait: { w: 0.5, h: 0.7, metal: 'gold' },
  photo: { w: 0.18, h: 0.13, wood: 'oak', table: true },
};

export function createFrame(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(FRAME_VARIANTS, o.variant, 'frame');
  const v = FRAME_VARIANTS[variant];
  const root = group(`frame-${variant}`);
  const F = v.metal ? metalMat(v.metal) : woodMat(o.wood ?? v.wood);
  const holder = group(null, { parent: root });
  const { w, h } = v;
  const bw = Math.min(0.05, w * 0.08);
  const y = v.table ? h / 2 + 0.005 : 1.5;
  if (v.table) {
    holder.rotation.x = -0.18;
    holder.position.z = 0.02;
    curveTube([[0, 0.0, -0.06], [0, h * 0.75, -0.005]], 0.004, F, { parent: root, segments: 2 });
  } else root.userData.floating = true;
  // moulded frame: four bevelled rails
  for (const [x, yy, ww, hh] of [[0, y + h / 2 - bw / 2, w, bw], [0, y - h / 2 + bw / 2, w, bw], [w / 2 - bw / 2, y, bw, h], [-w / 2 + bw / 2, y, bw, h]]) {
    mesh(roundedBox(ww, hh, 0.03, Math.min(0.01, bw / 3), 2), F, { parent: holder, at: [x, yy, 0.015] });
  }
  const matW = w - bw * 2;
  const matH = h - bw * 2;
  mesh(roundedBox(matW, matH, 0.006, 0.001, 1), new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.9 }), { parent: holder, at: [0, y, 0.012] });
  const art = new THREE.MeshStandardMaterial({ map: paintingTexture(o.seed ?? (variant === 'portrait' ? 9 : 3)), roughness: 0.7 });
  mesh(new THREE.PlaneGeometry(matW * 0.8, matH * 0.8), art, { parent: holder, at: [0, y, 0.0155] });
  mesh(new THREE.PlaneGeometry(matW, matH), glassMat('#ffffff', 0.08), { parent: holder, at: [0, y, 0.022] });
  const floating = root.userData.floating;
  const out = finalize(root, { type: 'frame', variant, options: o, animations: [] });
  if (floating) out.userData.floating = true;
  return out;
}
