import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, curveTube, lathe, extrudeOutline, normalizeOptions, pickVariant } from '../../core/utils.js';
import { mats, textTexture } from './common.js';
import { finish, styleOf } from './kit.js';
import { rng } from '../../core/utils.js';
import { fbm } from '../nature/common.js';

/* --------------------------------- Fence --------------------------------- */

export const FENCE_VARIANTS = {
  picket: { color: '#f4f2ec', height: 1.0 },
  'chain-link': { color: '#a9aeb2', height: 1.8 },
  iron: { color: '#1c1f22', height: 1.5 },
  wooden: { color: '#8a6a48', height: 1.8 },
  palisade: { color: '#2b5f3a', height: 2.0 },
  'post-rail': { color: '#9c7a52', height: 1.2 },
  'stone-wall': { color: '#9c958a', height: 0.9 },
  glass: { color: '#c5c9cc', height: 1.1 },
};

/** Climbing ivy draped over a fence panel. */
function ivy(root, L, H, seed) {
  const r = rng(seed);
  const leaf = new THREE.MeshStandardMaterial({ color: '#3f6f2a', roughness: 0.8, side: THREE.DoubleSide, name: 'ivy' });
  const stem = new THREE.MeshStandardMaterial({ color: '#4a3a26', roughness: 1 });
  const leafGeo = new THREE.CircleGeometry(0.045, 5);
  const n = Math.round(L * 3);
  const leaves = [];
  for (let k = 0; k < n; k++) {
    const x0 = -L / 2 + r() * L;
    const top = H * (0.35 + r() * 0.65);
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push([x0 + Math.sin(i * 1.3 + k) * 0.08, (i / 8) * top, 0.07]);
    curveTube(pts, 0.006, stem, { parent: root, segments: 16, radialSegments: 4 });
    for (let i = 1; i <= 16; i++) {
      const t = i / 16;
      leaves.push([x0 + Math.sin(t * 8 * 1.3 + k) * 0.08 + (r() - 0.5) * 0.06, Math.min(top, t * top + (r() - 0.5) * 0.04), 0.072 + r() * 0.006, r()]);
    }
  }
  const im = new THREE.InstancedMesh(leafGeo, leaf, leaves.length);
  im.name = 'ivy';
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const c = new THREE.Color();
  leaves.forEach(([x, y, z, k], i) => {
    q.setFromEuler(new THREE.Euler((k - 0.5) * 0.8, (k - 0.5) * 0.6, k * 6));
    im.setMatrixAt(i, m4.compose(new THREE.Vector3(x, Math.max(0.05, y), z), q, new THREE.Vector3(1, 1.2, 1).multiplyScalar(0.8 + k * 0.6)));
    im.setColorAt(i, c.setHSL(0.27 + k * 0.05, 0.45, 0.25 + k * 0.12));
  });
  root.add(im);
}

/** Gate leaf in the middle of the run (hinged on one side, with latch). */
function gate(root, variant, H, color) {
  const m = variant === 'picket' || variant === 'wooden' || variant === 'post-rail' ? M.wood(color) : mats.castIron(color);
  const g = group('gate', { parent: root, at: [-0.5, 0, 0.12] });
  const W = 1.0;
  const h = Math.min(H, 1.6);
  for (const x of [0.03, W - 0.03]) mesh(roundedBox(0.06, h, 0.05, 0.01), m, { parent: g, at: [x, h / 2 + 0.05, 0] });
  for (const y of [0.2, h - 0.1]) mesh(roundedBox(W, 0.06, 0.05, 0.01), m, { parent: g, at: [W / 2, y + 0.05, 0] });
  const dia = mesh(roundedBox(Math.hypot(W, h - 0.3), 0.05, 0.04, 0.01), m, { parent: g, at: [W / 2, h / 2 + 0.05, 0] });
  dia.rotation.z = Math.atan2(h - 0.3, W);
  for (let i = 1; i < 8; i++) mesh(roundedBox(0.035, h - 0.3, 0.03, 0.008), m, { parent: g, at: [(i * W) / 8, h / 2 + 0.05, -0.01] });
  for (const y of [0.3, h - 0.2]) mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 10), M.metal('#555', 0.4), { parent: g, at: [0, y, 0] });
  mesh(roundedBox(0.1, 0.03, 0.03, 0.008), M.metal('#555', 0.4), { parent: g, at: [W - 0.02, h * 0.6, 0.03] });
  // gate posts
  for (const x of [-0.06, W + 0.06]) mesh(roundedBox(0.12, h + 0.15, 0.12, 0.015), m, { parent: g, at: [x, (h + 0.15) / 2, 0] });
}

export function createFence(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(FENCE_VARIANTS, o.variant, 'fence');
  const v = FENCE_VARIANTS[variant];
  const L = o.length ?? 2.4;
  const H = o.height ?? v.height;
  const root = group(`fence-${variant}`);
  if (variant === 'picket') {
    const paint = new THREE.MeshStandardMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.6, name: 'paint' });
    const pw = 0.085;
    const picket = extrudeOutline([[-pw / 2, 0], [pw / 2, 0], [pw / 2, H - 0.08], [0, H], [-pw / 2, H - 0.08]], 0.022, { bevel: 0.005 });
    const n = Math.floor(L / 0.15);
    const im = new THREE.InstancedMesh(picket, paint, n);
    im.name = 'pickets';
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) im.setMatrixAt(i, m4.makeTranslation(-L / 2 + 0.075 + i * (L / n), 0.03, 0.03));
    root.add(im);
    for (const y of [0.22, H - 0.25]) mesh(roundedBox(L, 0.08, 0.035, 0.008), paint, { parent: root, at: [0, y, 0] });
    for (const x of [-L / 2, L / 2]) {
      mesh(roundedBox(0.1, H + 0.08, 0.1, 0.012), paint, { parent: root, at: [x, (H + 0.08) / 2, 0] });
      mesh(lathe([[0.001, 0], [0.065, 0], [0.065, 0.02], [0.04, 0.05], [0.001, 0.07]], 4).rotateY(Math.PI / 4), paint, { parent: root, at: [x, H + 0.08, 0] });
    }
  } else if (variant === 'chain-link') {
    const g = mats.galv();
    if (o.color) g.color.set(o.color);
    for (const x of [-L / 2, L / 2]) {
      mesh(lathe([[0.001, 0], [0.045, 0], [0.045, H], [0.05, H + 0.02], [0.04, H + 0.05], [0.001, H + 0.06]], 20), g, { parent: root, at: [x, 0, 0] });
    }
    curveTube([[-L / 2, H - 0.03, 0], [L / 2, H - 0.03, 0]], 0.02, g, { parent: root, segments: 2, radialSegments: 10 });
    curveTube([[-L / 2, 0.06, 0], [L / 2, 0.06, 0]], 0.01, g, { parent: root, segments: 2, radialSegments: 6 });
    // diamond mesh: two families of diagonal wires clipped to the panel
    const s = 0.06;
    const segs = [];
    const x0 = -L / 2 + 0.05;
    const x1 = L / 2 - 0.05;
    const y0 = 0.06;
    const y1 = H - 0.03;
    for (const dir of [1, -1]) {
      for (let c = -(y1 - y0); c < x1 - x0; c += s) {
        // line: x = x0 + c + dir*(y - y0) style param
        const pts = [];
        for (const y of [y0, y1]) {
          const x = dir > 0 ? x0 + c + (y - y0) : x0 + c + (y1 - y);
          pts.push([x, y]);
        }
        // clip to [x0, x1]
        let [[ax, ay], [bx, by]] = pts;
        const clip = (px, py, qx, qy) => {
          if (px < x0) { py += ((x0 - px) / (qx - px)) * (qy - py); px = x0; }
          if (px > x1) { py += ((x1 - px) / (qx - px)) * (qy - py); px = x1; }
          return [px, py];
        };
        if ((ax < x0 && bx < x0) || (ax > x1 && bx > x1)) continue;
        [ax, ay] = clip(ax, ay, bx, by);
        [bx, by] = clip(bx, by, ax, ay);
        segs.push([ax, ay, bx, by]);
      }
    }
    const wire = new THREE.CylinderGeometry(0.0022, 0.0022, 1, 4);
    const im = new THREE.InstancedMesh(wire, g, segs.length);
    im.name = 'mesh';
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    segs.forEach(([ax, ay, bx, by], i) => {
      const len = Math.hypot(bx - ax, by - ay);
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(bx - ax, by - ay, 0).normalize());
      im.setMatrixAt(i, m4.compose(new THREE.Vector3((ax + bx) / 2, (ay + by) / 2, 0), q, new THREE.Vector3(1, len, 1)));
    });
    root.add(im);
  } else if (variant === 'iron') {
    const iron = mats.castIron(o.color ?? v.color);
    const n = Math.floor(L / 0.13);
    const bar = new THREE.CylinderGeometry(0.011, 0.011, H - 0.1, 8);
    bar.translate(0, (H - 0.1) / 2 + 0.05, 0);
    const spear = lathe([[0.001, 0], [0.022, 0.0], [0.028, 0.03], [0.012, 0.05], [0.001, 0.1]], 12);
    spear.translate(0, H - 0.05, 0);
    const bars = new THREE.InstancedMesh(bar, iron, n);
    const tips = new THREE.InstancedMesh(spear, iron, n);
    bars.name = 'bars';
    tips.name = 'finials';
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const x = -L / 2 + 0.1 + i * ((L - 0.2) / (n - 1));
      bars.setMatrixAt(i, m4.makeTranslation(x, 0, 0));
      tips.setMatrixAt(i, m4.makeTranslation(x, 0, 0));
    }
    root.add(bars, tips);
    for (const y of [0.15, H - 0.2]) mesh(roundedBox(L, 0.04, 0.03, 0.008), iron, { parent: root, at: [0, y, 0] });
    for (const x of [-L / 2, L / 2]) {
      mesh(roundedBox(0.08, H + 0.05, 0.08, 0.01), iron, { parent: root, at: [x, (H + 0.05) / 2, 0] });
      mesh(lathe([[0.001, 0], [0.055, 0], [0.055, 0.02], [0.03, 0.04], [0.04, 0.08], [0.001, 0.13]], 16), iron, { parent: root, at: [x, H + 0.05, 0] });
    }
  } else if (variant === 'palisade') {
    const steel = mats.powder(o.color ?? v.color);
    const n = Math.floor(L / 0.12);
    const pale = extrudeOutline([[-0.03, 0], [0.03, 0], [0.03, H - 0.12], [0.012, H - 0.05], [0.02, H - 0.03], [0, H], [-0.02, H - 0.03], [-0.012, H - 0.05], [-0.03, H - 0.12]], 0.025, { bevel: 0.004 });
    const im = new THREE.InstancedMesh(pale, steel, n);
    im.name = 'pales';
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) im.setMatrixAt(i, m4.makeTranslation(-L / 2 + 0.06 + i * (L / n), 0, 0.045));
    root.add(im);
    for (const y of [0.3, H - 0.35]) mesh(roundedBox(L, 0.05, 0.05, 0.01), steel, { parent: root, at: [0, y, 0] });
    for (const x of [-L / 2, L / 2]) mesh(roundedBox(0.1, H, 0.1, 0.012), steel, { parent: root, at: [x, H / 2, 0] });
  } else if (variant === 'post-rail') {
    const wood = M.wood(o.color ?? v.color);
    for (const x of [-L / 2, 0, L / 2]) mesh(roundedBox(0.14, H + 0.1, 0.14, 0.02), wood, { parent: root, at: [x, (H + 0.1) / 2, 0] });
    for (const y of [0.35, 0.7, H - 0.1]) {
      const rail = mesh(roundedBox(L + 0.1, 0.11, 0.05, 0.015), wood, { parent: root, at: [0, y, 0.09] });
      rail.rotation.z = (y * 7) % 0.02 - 0.01;
    }
  } else if (variant === 'stone-wall') {
    // dry-stone wall: rows of irregular stones on a slightly battered profile with coping
    const r = rng(o.seed ?? 6);
    const stone = new THREE.MeshStandardMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.95, name: 'stone', flatShading: true });
    mesh(roundedBox(L, H - 0.15, 0.36, 0.04), new THREE.MeshStandardMaterial({ color: '#6f685e', roughness: 1 }), { parent: root, at: [0, (H - 0.15) / 2, 0] });
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const c = new THREE.Color();
    const stones = [];
    for (let y = 0.08; y < H - 0.15; y += 0.14) {
      for (let x = -L / 2 + 0.1 + r() * 0.1; x < L / 2 - 0.1; x += 0.2 + r() * 0.1) {
        for (const z of [0.17, -0.17]) stones.push([x, y, z, 0.1 + r() * 0.05, 0.06 + r() * 0.02, r()]);
      }
    }
    const im = new THREE.InstancedMesh(geo, stone, stones.length);
    im.name = 'stones';
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    stones.forEach(([x, y, z, sx, sy, k], i) => {
      q.setFromEuler(new THREE.Euler(k * 3, k * 5, k * 2));
      im.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, 0.06)));
      im.setColorAt(i, c.set(o.color ?? v.color).offsetHSL(0, 0, (k - 0.5) * 0.18));
    });
    root.add(im);
    for (let x = -L / 2 + 0.06; x < L / 2; x += 0.12) {
      const cs = mesh(roundedBox(0.09, 0.2, 0.38, 0.03), stone, { parent: root, at: [x, H - 0.08, 0] });
      cs.rotation.z = (r() - 0.5) * 0.3;
    }
  } else if (variant === 'glass') {
    // frameless glass balustrade with a steel handrail on stainless posts
    const steel = M.metal('#c5c9cc', 0.2);
    const glass = new THREE.MeshPhysicalMaterial({ color: '#dfeef0', roughness: 0.04, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, name: 'glass' });
    const panes = Math.max(1, Math.round(L / 1.2));
    for (let i = 0; i < panes; i++) {
      const w = L / panes;
      mesh(roundedBox(w - 0.06, H - 0.18, 0.016, 0.006), glass, { parent: root, at: [-L / 2 + w * (i + 0.5), (H - 0.18) / 2 + 0.08, 0] });
      for (const dx of [-w / 2 + 0.06, w / 2 - 0.06]) for (const y of [0.25, H - 0.35]) mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 16).rotateX(Math.PI / 2), steel, { parent: root, at: [-L / 2 + w * (i + 0.5) + dx, y, 0] });
    }
    for (let i = 0; i <= panes; i++) mesh(lathe([[0.001, 0], [0.06, 0], [0.06, 0.01], [0.025, 0.02], [0.022, H], [0.001, H]], 20), steel, { parent: root, at: [-L / 2 + (i * L) / panes, 0, -0.04] });
    curveTube([[-L / 2 - 0.02, H, -0.02], [L / 2 + 0.02, H, -0.02]], 0.025, steel, { parent: root, segments: 2, radialSegments: 16 });
    mesh(roundedBox(L, 0.08, 0.06, 0.01), steel, { parent: root, at: [0, 0.04, 0] });
  } else {
    const wood = M.wood(o.color ?? v.color);
    const n = Math.floor(L / 0.15);
    const board = roundedBox(0.14, H - 0.06, 0.02, 0.005);
    board.translate(0, (H - 0.06) / 2 + 0.04, 0);
    const im = new THREE.InstancedMesh(board, wood, n);
    im.name = 'boards';
    const m4 = new THREE.Matrix4();
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      im.setMatrixAt(i, m4.makeTranslation(-L / 2 + 0.075 + i * (L / n), 0, 0.035));
      im.setColorAt(i, c.setHSL(0, 0, 0.88 + ((i * 37) % 10) / 60));
    }
    root.add(im);
    for (const y of [0.3, H - 0.3]) mesh(roundedBox(L, 0.09, 0.04, 0.008), wood, { parent: root, at: [0, y, 0] });
    for (const x of [-L / 2, L / 2]) mesh(roundedBox(0.1, H + 0.04, 0.1, 0.012), wood, { parent: root, at: [x, (H + 0.04) / 2, 0] });
  }
  const style = styleOf(o);
  if (style === 'ivy') ivy(root, L, H, o.seed ?? 2);
  if (style === 'gate') gate(root, variant, H, o.color ?? v.color);
  return finish(root, { type: 'fence', variant, o, animations: [], lean: variant !== 'stone-wall' && variant !== 'glass' });
}

/* --------------------------------- Roads --------------------------------- */

export const ROAD_VARIANTS = {
  straight: {},
  crosswalk: {},
  intersection: {},
  'dead-end': {},
  'bike-lane': {},
  'bus-lane': {},
  parking: {},
  rural: {},
};

function laneText(text, color) {
  return textTexture(text, { w: 256, h: 512, bg: 'rgba(0,0,0,0)', fg: color, font: 'bold 150px Helvetica, Arial', radius: 0 });
}

function asphalt(w, l, seed) {
  const g = new THREE.PlaneGeometry(w, l, Math.ceil(w * 4), Math.ceil(l * 4));
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  const base = new THREE.Color('#3a3b3d');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const k = 0.85 + 0.18 * fbm(x * 0.8, 0, z * 0.8, seed, 3) + 0.06 * fbm(x * 9, 0, z * 9, seed + 2, 2);
    col.set([base.r * k, base.g * k, base.b * k], i * 3);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

function paintMark(parent, w, l, x, z, mat, rot = 0) {
  const g = new THREE.PlaneGeometry(w, l);
  g.rotateX(-Math.PI / 2);
  g.rotateY(rot);
  return mesh(g, mat, { parent, at: [x, 0.016, z] });
}

function sidewalk(parent, len, width, x, rotY, conc, curbMat) {
  const g = group(null, { parent, at: [0, 0, 0] });
  g.rotation.y = rotY;
  // curb with rounded top edge, then slabs with joints
  mesh(roundedBox(0.16, 0.16, len, 0.03), curbMat, { parent: g, at: [x, 0.08, 0] });
  const slabs = Math.max(1, Math.round(len / 1.2));
  for (let i = 0; i < slabs; i++) {
    const sl = len / slabs;
    mesh(roundedBox(width - 0.18, 0.14, sl - 0.012, 0.008), conc, { parent: g, at: [x + Math.sign(x) * (width / 2), 0.07, -len / 2 + sl * (i + 0.5)] });
  }
  return g;
}

export function createRoad(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(ROAD_VARIANTS, o.variant, 'road');
  const lanes = o.lanes ?? 2;
  const laneW = 3.5;
  const W = lanes * laneW;
  const L = o.length ?? (variant === 'intersection' ? 22 : 12);
  const SW = o.sidewalk ?? 2.5;
  const root = group(`road-${variant}`);
  const road = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, name: 'asphalt' });
  const white = new THREE.MeshStandardMaterial({ color: '#efefe9', roughness: 0.6, name: 'paint-white', polygonOffset: true, polygonOffsetFactor: -2 });
  const yellow = new THREE.MeshStandardMaterial({ color: '#f2c200', roughness: 0.6, name: 'paint-yellow', polygonOffset: true, polygonOffsetFactor: -2 });
  const conc = mats.concrete('#c4c0b8');
  const curb = mats.concrete('#a9a49c');
  const seed = o.seed ?? 3;
  if (variant === 'intersection') {
    mesh(asphalt(W + 0.02, W + 0.02, seed), road, { parent: root, name: 'asphalt', at: [0, 0.01, 0] });
    const arm = (L - W) / 2;
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const g = group(null, { parent: root });
      g.rotation.y = a;
      const seg = mesh(asphalt(W, arm, seed + k), road, { parent: g, at: [0, 0.01, W / 2 + arm / 2] });
      void seg;
      // crosswalk stripes + stop line
      for (let i = 0; i < Math.floor(W / 0.9); i++) paintMark(g, 0.5, 2.6, -W / 2 + 0.45 + i * 0.9, W / 2 + 1.6, white);
      paintMark(g, W / 2 - 0.2, 0.4, -W / 4 - 0.1, W / 2 + 3.3, white);
      for (let z = W / 2 + 4; z < W / 2 + arm - 1; z += 4.5) paintMark(g, 0.12, 2.5, 0, z + 1.25, yellow);
      // corner sidewalks
      for (const s of [1, -1]) {
        const sg = sidewalk(g, arm, SW, s * (W / 2 + 0.08), 0, conc, curb);
        sg.position.z = W / 2 + arm / 2;
      }
      const corner = mesh(roundedBox(SW + 0.16, 0.14, SW + 0.16, 0.03), conc, { parent: g, at: [W / 2 + SW / 2 + 0.08, 0.07, W / 2 + SW / 2 + 0.08] });
      void corner;
    }
  } else if (variant === 'rural') {
    // country lane: no kerbs, gravel shoulders and grass verges
    mesh(asphalt(W, L, seed), road, { parent: root, name: 'asphalt', at: [0, 0.01, 0] });
    const gravel = new THREE.MeshStandardMaterial({ color: '#8a8070', roughness: 1, name: 'gravel' });
    const grass = new THREE.MeshStandardMaterial({ color: '#5a7a3a', roughness: 1, name: 'grass' });
    for (const s of [1, -1]) {
      mesh(new THREE.PlaneGeometry(0.8, L).rotateX(-Math.PI / 2), gravel, { parent: root, at: [s * (W / 2 + 0.4), 0.008, 0] });
      mesh(new THREE.PlaneGeometry(2.2, L).rotateX(-Math.PI / 2), grass, { parent: root, at: [s * (W / 2 + 1.9), 0.006, 0] });
      paintMark(root, 0.1, L, s * (W / 2 - 0.25), 0, white);
      for (let z = -L / 2 + 2; z < L / 2; z += 6) {
        mesh(roundedBox(0.1, 0.9, 0.1, 0.02), new THREE.MeshStandardMaterial({ color: '#f4f4f2' }), { parent: root, at: [s * (W / 2 + 0.9), 0.45, z] });
        mesh(roundedBox(0.104, 0.1, 0.104, 0.01), new THREE.MeshStandardMaterial({ color: '#111' }), { parent: root, at: [s * (W / 2 + 0.9), 0.78, z] });
        mesh(roundedBox(0.02, 0.06, 0.06, 0.005), new THREE.MeshStandardMaterial({ color: s > 0 ? '#ff7a00' : '#f4f4f2', emissive: s > 0 ? '#ff7a00' : '#ffffff', emissiveIntensity: 0.3 }), { parent: root, at: [s * (W / 2 + 0.9) - s * 0.055, 0.78, z] });
      }
    }
    for (let z = -L / 2 + 1; z < L / 2 - 1; z += 4.5) paintMark(root, 0.1, 2.0, 0, z + 1.0, white);
  } else {
    mesh(asphalt(W, L, seed), road, { parent: root, name: 'asphalt', at: [0, 0.01, 0] });
    for (const s of [1, -1]) sidewalk(root, L, SW, s * (W / 2 + 0.08), 0, conc, curb);
    if (variant === 'bike-lane' || variant === 'bus-lane') {
      const bike = variant === 'bike-lane';
      const lw = bike ? 1.6 : 3.0;
      const lane = new THREE.MeshStandardMaterial({ color: bike ? '#2e8b57' : '#a8322a', roughness: 0.9, name: bike ? 'bike-lane' : 'bus-lane', polygonOffset: true, polygonOffsetFactor: -1 });
      for (const s of [1, -1]) {
        mesh(new THREE.PlaneGeometry(lw, L).rotateX(-Math.PI / 2), lane, { parent: root, at: [s * (W / 2 - lw / 2 - 0.15), 0.013, 0] });
        const tex = laneText(bike ? 'BIKE' : 'BUS', '#ffffff');
        if (tex) {
          const t = mesh(new THREE.PlaneGeometry(lw * 0.7, lw * 1.4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, transparent: true, polygonOffset: true, polygonOffsetFactor: -3, roughness: 0.6 }), { parent: root, at: [s * (W / 2 - lw / 2 - 0.15), 0.018, -s * 2] });
          t.rotation.y = s > 0 ? 0 : Math.PI;
        }
        if (bike) for (let z = -L / 2; z < L / 2; z += 1.0) paintMark(root, 0.12, 0.5, s * (W / 2 - lw - 0.2), z + 0.25, white);
        else paintMark(root, 0.25, L, s * (W / 2 - lw - 0.25), 0, white);
      }
    }
    if (variant === 'parking') {
      for (const s of [1, -1]) {
        for (let z = -L / 2 + 0.5; z <= L / 2 - 0.5; z += 5.5) paintMark(root, 2.1, 0.12, s * (W / 2 - 1.2), z, white);
        paintMark(root, 0.12, L, s * (W / 2 - 2.25), 0, white);
      }
    }
    // edge lines + dashed centre
    for (const s of [1, -1]) paintMark(root, 0.12, L, s * (W / 2 - 0.3), 0, white);
    if (variant !== 'dead-end') {
      for (let z = -L / 2 + 1; z < L / 2 - 1; z += 4.5) {
        if (variant === 'crosswalk' && Math.abs(z + 1.25) < 3) continue;
        paintMark(root, 0.12, 2.5, 0, z + 1.25, yellow);
      }
    }
    if (variant === 'crosswalk') {
      for (let i = 0; i < Math.floor(W / 0.9); i++) paintMark(root, 0.5, 3.0, -W / 2 + 0.45 + i * 0.9, 0, white);
      for (const s of [1, -1]) paintMark(root, W / 2 - 0.3, 0.35, s * (W / 4), -s * 2.4, white);
    }
    if (variant === 'dead-end') {
      mesh(roundedBox(W + 0.32, 0.16, 0.16, 0.03), curb, { parent: root, at: [0, 0.08, L / 2 - 0.08] });
      paintMark(root, W - 0.6, 0.3, 0, L / 2 - 1, white);
    }
    // storm drain grates by the curb
    for (const s of [1, -1]) {
      mesh(roundedBox(0.4, 0.02, 0.8, 0.01), M.metal('#2a2a2a', 0.6), { parent: root, at: [s * (W / 2 - 0.25), 0.018, L / 4] });
      for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(0.32, 0.005, 0.03), new THREE.MeshBasicMaterial({ color: '#0a0a0a' }), { parent: root, at: [s * (W / 2 - 0.25), 0.029, L / 4 - 0.3 + i * 0.12] });
    }
  }
  const style = styleOf(o);
  const r = rng(seed * 7 + 1);
  const span = variant === 'intersection' ? W : L;
  if (style === 'wet') {
    // rain: darker glossy asphalt and puddles reflecting the sky
    road.roughness = 0.35;
    road.color = new THREE.Color('#9ea3a8');
    const pud = new THREE.MeshPhysicalMaterial({ color: '#2e343a', roughness: 0.02, metalness: 0.3, clearcoat: 1, transparent: true, opacity: 0.9, name: 'puddle', polygonOffset: true, polygonOffsetFactor: -4 });
    for (let i = 0; i < 9; i++) {
      const g = new THREE.CircleGeometry(0.4 + r() * 0.9, 32);
      const p = g.attributes.position;
      const ph = r() * 6;
      for (let k = 1; k < p.count; k++) {
        const a = Math.atan2(p.getY(k), p.getX(k));
        const m = 1 + 0.22 * Math.sin(2 * a + ph) + 0.1 * Math.sin(3 * a + ph * 2);
        p.setXY(k, p.getX(k) * m * 1.4, p.getY(k) * m * 0.8);
      }
      g.rotateX(-Math.PI / 2);
      mesh(g, pud, { parent: root, at: [(r() - 0.5) * (W - 1), 0.02, (r() - 0.5) * (span - 2)] });
    }
  }
  if (style === 'potholes' || style === 'worn') {
    const patch = new THREE.MeshStandardMaterial({ color: '#262729', roughness: 0.9, name: 'patch', polygonOffset: true, polygonOffsetFactor: -2 });
    const crack = new THREE.MeshBasicMaterial({ color: '#141414', polygonOffset: true, polygonOffsetFactor: -3 });
    if (style === 'potholes') {
      for (let i = 0; i < 6; i++) {
        const rad = 0.25 + r() * 0.35;
        const x = (r() - 0.5) * (W - 1);
        const z = (r() - 0.5) * (span - 2);
        // broken asphalt: dark irregular crater with a lighter crumbled rim
        const crater = new THREE.CircleGeometry(rad, 24);
        const cp = crater.attributes.position;
        const ph = r() * 6;
        for (let k = 1; k < cp.count; k++) {
          const a = Math.atan2(cp.getY(k), cp.getX(k));
          const m = 1 + 0.25 * Math.sin(3 * a + ph) + 0.12 * Math.sin(5 * a);
          cp.setXY(k, cp.getX(k) * m, cp.getY(k) * m * 0.8);
        }
        crater.rotateX(-Math.PI / 2);
        const rim = crater.clone().scale(1.2, 1, 1.2);
        mesh(rim, new THREE.MeshStandardMaterial({ color: '#55575a', roughness: 1, name: 'pothole-rim', polygonOffset: true, polygonOffsetFactor: -3 }), { parent: root, at: [x, 0.0105, z] });
        mesh(crater, new THREE.MeshStandardMaterial({ color: '#121314', roughness: 0.9, name: 'pothole', polygonOffset: true, polygonOffsetFactor: -5 }), { parent: root, at: [x, 0.011, z] });
        if (r() < 0.5) mesh(crater.clone().scale(0.7, 1, 0.7), new THREE.MeshPhysicalMaterial({ color: '#2b3238', roughness: 0.03, clearcoat: 1, name: 'puddle', polygonOffset: true, polygonOffsetFactor: -6 }), { parent: root, at: [x, 0.0115, z] });
        for (let k = 0; k < 6; k++) mesh(new THREE.DodecahedronGeometry(0.02 + r() * 0.03, 0), new THREE.MeshStandardMaterial({ color: '#4a4b4d', roughness: 1 }), { parent: root, at: [x + (r() - 0.5) * rad * 2.4, 0.02, z + (r() - 0.5) * rad * 2.4] });
      }
      for (let i = 0; i < 4; i++) mesh(new THREE.PlaneGeometry(0.8 + r(), 0.6 + r()).rotateX(-Math.PI / 2), patch, { parent: root, at: [(r() - 0.5) * (W - 1.5), 0.012, (r() - 0.5) * (span - 2)] });
    } else {
      // faded markings + crack network
      root.traverse((m) => { if (m.isMesh && /paint-/.test(m.material?.name)) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.45; } });
      for (let i = 0; i < 14; i++) {
        const pts = [];
        let x = (r() - 0.5) * W;
        let z = (r() - 0.5) * span;
        for (let k = 0; k < 7; k++) { pts.push([x, 0.012, z]); x += (r() - 0.5) * 0.8; z += (r() - 0.5) * 1.2; }
        curveTube(pts.map(([a, b, c]) => [THREE.MathUtils.clamp(a, -W / 2 + 0.1, W / 2 - 0.1), b, THREE.MathUtils.clamp(c, -span / 2, span / 2)]), 0.012, crack, { parent: root, segments: 24, radialSegments: 3 });
      }
      for (let i = 0; i < 3; i++) mesh(new THREE.PlaneGeometry(W * 0.5, 0.5 + r()).rotateX(-Math.PI / 2), patch, { parent: root, at: [(r() - 0.5) * W * 0.4, 0.012, (r() - 0.5) * (span - 2)] });
    }
  }
  if (style === 'leaves') {
    const cols = ['#b5541c', '#d08a1e', '#8e3a1a', '#c9a227'];
    const leafGeo = new THREE.CircleGeometry(0.05, 5);
    const n = 600;
    const im = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide, name: 'leaves' }), n);
    im.name = 'leaves';
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      // drift against the kerbs
      const side = r() < 0.5 ? 1 : -1;
      const x = side * (W / 2 - Math.abs(r() * r()) * W * 0.5);
      q.setFromEuler(new THREE.Euler(-Math.PI / 2 + (r() - 0.5) * 0.3, 0, r() * 6));
      im.setMatrixAt(i, m4.compose(new THREE.Vector3(x, 0.02 + r() * 0.01, (r() - 0.5) * span), q, new THREE.Vector3(1, 1.3, 1)));
      im.setColorAt(i, c.set(cols[i % 4]));
    }
    root.add(im);
  }
  const obj = finish(root, { type: 'road', variant, o, animations: [], lean: false, handled: ['damaged'] });
  obj.traverse((m) => { if (m.isMesh && m.material?.name === 'asphalt') m.castShadow = false; });
  return obj;
}
