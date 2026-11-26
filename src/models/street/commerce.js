import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, curveTube, lathe, rng, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, clip, pingPong } from '../../core/animation.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { mats, pole, textTexture, emblem, tube } from './common.js';
import { finish, styleOf } from './kit.js';

/* Street commerce: market stalls, kiosks, food carts, patio umbrellas,
 * fuel pumps and billboards. */

const canvasMat = (c, side = THREE.DoubleSide) => new THREE.MeshStandardMaterial({ color: M.toColor(c), roughness: 0.85, side, name: 'canvas' });

/** Striped awning canvas texture. */
function stripes(a, b, n = 8) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 16;
  const g = c.getContext('2d');
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? b : a;
    g.fillRect((i * 256) / n, 0, 256 / n + 1, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function awningMat(a, b) {
  const t = stripes(a, b);
  return new THREE.MeshStandardMaterial({ color: t ? '#ffffff' : a, map: t, roughness: 0.85, side: THREE.DoubleSide, name: 'canvas' });
}

/** Scalloped valance strip along X (hanging awning edge). */
function valance(parent, w, at, mat) {
  const n = Math.round(w / 0.22);
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(w / 2, -0.12);
  for (let i = n; i > 0; i--) {
    const x1 = -w / 2 + (i * w) / n;
    const x0 = -w / 2 + ((i - 1) * w) / n;
    shape.quadraticCurveTo((x0 + x1) / 2, -0.24, x0, -0.12);
  }
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape, 6);
  g.computeBoundingBox();
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, 0.5);
  return mesh(g, mat, { parent, at });
}

/* ------------------------------ Market stall ------------------------------ */

export const MARKET_STALL_VARIANTS = {
  canopy: { a: '#c0392b', b: '#f4f1ea' },
  wooden: { a: '#2e7d32', b: '#f4f1ea' },
  fruit: { a: '#1565c0', b: '#ffffff' },
};

function produceTray(parent, at, color, rand) {
  const tray = group(null, { parent, at });
  mesh(roundedBox(0.5, 0.08, 0.36, 0.01), new THREE.MeshStandardMaterial({ color: '#b08a5a', roughness: 0.9 }), { parent: tray, at: [0, 0.04, 0] });
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.5, name: 'produce' }), 30);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 30; i++) {
    m4.makeTranslation((rand() - 0.5) * 0.42, 0.1 + rand() * 0.05, (rand() - 0.5) * 0.28);
    im.setMatrixAt(i, m4);
  }
  tray.add(im);
}

export function createMarketStall(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(MARKET_STALL_VARIANTS, o.variant, 'market-stall');
  const v = MARKET_STALL_VARIANTS[variant];
  const style = styleOf(o);
  const rand = rng(o.seed ?? 3);
  const root = group(`market-stall-${variant}`);
  const W = 2.6;
  const D = 1.5;
  const frame = variant === 'wooden' ? new THREE.MeshStandardMaterial({ color: '#8a6a48', roughness: 0.85, name: 'timber' }) : mats.powder('#2b3034');
  const can = awningMat(o.color ?? v.a, v.b);
  for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) {
    const h = z < 0 ? 2.5 : 2.2;
    if (variant === 'wooden') mesh(roundedBox(0.08, h, 0.08, 0.012), frame, { parent: root, at: [x, h / 2, z] });
    else tube([x, 0, z], [x, h, z], 0.025, frame, { parent: root });
    mesh(roundedBox(0.12, 0.02, 0.12, 0.005), frame, { parent: root, at: [x, 0.01, z] });
  }
  // sloped roof canvas + valance front and sides
  const roof = new THREE.PlaneGeometry(W + 0.2, Math.hypot(D + 0.2, 0.3), 1, 1);
  roof.rotateX(-Math.PI / 2 + Math.atan2(0.3, D + 0.2));
  mesh(roof, can, { parent: root, at: [0, 2.36, 0] });
  valance(root, W + 0.2, [0, 2.21, D / 2 + 0.1], can);
  // trestle table with cloth
  mesh(roundedBox(W - 0.2, 0.04, 0.8, 0.012), new THREE.MeshStandardMaterial({ color: '#c8a173', roughness: 0.85 }), { parent: root, at: [0, 0.8, 0.2] });
  for (const x of [-W / 2 + 0.25, W / 2 - 0.25]) for (const s of [1, -1]) tube([x, 0, 0.2 + s * 0.35], [x, 0.78, 0.2], 0.02, frame, { parent: root });
  if (variant !== 'wooden' || style === 'produce') {
    mesh(roundedBox(W - 0.18, 0.4, 0.02, 0.01), canvasMat(v.b), { parent: root, at: [0, 0.6, 0.61] });
  }
  const goods = style === 'produce' || variant === 'fruit' ? 'produce' : style ?? (variant === 'wooden' ? 'crafts' : 'produce');
  if (goods === 'produce') {
    ['#e53935', '#fb8c00', '#fdd835', '#7cb342', '#8e24aa'].forEach((c, i) => produceTray(root, [-W / 2 + 0.4 + i * 0.45, 0.82, 0.2], c, rand));
  } else if (goods === 'flowers') {
    for (let i = 0; i < 8; i++) {
      const b = group(null, { parent: root, at: [-W / 2 + 0.35 + i * 0.28, 0.82, 0.2 + (i % 2) * 0.15] });
      mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.2, 14), M.metal('#9aa0a6', 0.3), { parent: b, at: [0, 0.1, 0] });
      for (let k = 0; k < 7; k++) {
        const a = rand() * Math.PI * 2;
        const r = rand() * 0.06;
        tube([0, 0.18, 0], [Math.cos(a) * r, 0.42 + rand() * 0.1, Math.sin(a) * r], 0.004, M.foliage('#3f7d2e'), { parent: b });
        mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshStandardMaterial({ color: rand.pick(['#e83e8c', '#ffffff', '#ffb300', '#c2185b', '#ff7043']) }), { parent: b, at: [Math.cos(a) * r, 0.44 + rand() * 0.1, Math.sin(a) * r] });
      }
    }
  } else {
    // crafts: pottery and folded textiles
    for (let i = 0; i < 6; i++) mesh(lathe([[0.001, 0], [0.06, 0], [0.09, 0.08], [0.07, 0.18], [0.04, 0.22], [0.05, 0.24], [0.001, 0.24]], 18), new THREE.MeshStandardMaterial({ color: rand.pick(['#b5541c', '#6d8b74', '#c9a227', '#4a6fa5']), roughness: 0.6 }), { parent: root, at: [-W / 2 + 0.3 + i * 0.25, 0.82, 0.1] });
    for (let i = 0; i < 4; i++) mesh(roundedBox(0.3, 0.06, 0.22, 0.01), canvasMat(rand.pick(['#8e24aa', '#00897b', '#f4511e', '#3949ab'])), { parent: root, at: [0.3 + i * 0.25 - 0.2, 0.85 + (i % 2) * 0.06, 0.35] });
  }
  // price sign
  const tex = textTexture(variant === 'fruit' ? 'FRESH FRUIT' : variant === 'wooden' ? 'HANDMADE' : 'FARM MARKET', { w: 512, h: 96, bg: '#1b1b1b', fg: '#ffffff', font: 'bold 60px Georgia, serif', radius: 8 });
  if (tex) mesh(new THREE.PlaneGeometry(1.2, 0.22), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide }), { parent: root, at: [0, 2.0, D / 2 + 0.11] });
  return finish(root, { type: 'market-stall', variant, o, animations: [], lean: false });
}

/* --------------------------------- Kiosk --------------------------------- */

export const KIOSK_VARIANTS = {
  newsstand: { color: '#2e5d3a' },
  ticket: { color: '#1f5f8b' },
  food: { color: '#c0392b' },
};

export function createKiosk(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(KIOSK_VARIANTS, o.variant, 'kiosk');
  const v = KIOSK_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`kiosk-${variant}`);
  const paint = mats.powder(o.color ?? v.color);
  paint.name = 'paint';
  const W = 2.4;
  const D = 1.8;
  const H = 2.6;
  const animations = [];
  mesh(roundedBox(W + 0.1, 0.12, D + 0.1, 0.03), mats.concrete(), { parent: root, at: [0, 0.06, 0] });
  // walls with a large serving hatch on the front
  mesh(roundedBox(W, H, 0.08, 0.03), paint, { parent: root, at: [0, 0.12 + H / 2, -D / 2 + 0.04] });
  for (const s of [1, -1]) mesh(roundedBox(0.08, H, D - 0.16, 0.03), paint, { parent: root, at: [s * (W / 2 - 0.04), 0.12 + H / 2, 0] });
  mesh(roundedBox(W, 1.0, 0.08, 0.03), paint, { parent: root, at: [0, 0.12 + 0.5, D / 2 - 0.04] });
  mesh(roundedBox(W, 0.5, 0.08, 0.03), paint, { parent: root, at: [0, 0.12 + H - 0.25, D / 2 - 0.04] });
  mesh(roundedBox(W + 0.06, 0.05, 0.4, 0.015), M.metal('#c9cdd0', 0.3), { parent: root, at: [0, 0.12 + 1.02, D / 2 + 0.1] });
  // interior: back counter, glow
  const inner = lampGroup('interior', 'white');
  inner.lens.emissive.set('#fff2d8');
  inner.add(root, { at: [0, 0.12 + H - 0.008, 0], normal: [0, -1, 0], w: 1.4, h: 0.15, depth: 0.01, bezel: false, shape: 'strip' });
  mesh(roundedBox(W - 0.2, 0.9, 0.5, 0.02), new THREE.MeshStandardMaterial({ color: '#d8d2c6', roughness: 0.7 }), { parent: root, at: [0, 0.12 + 0.45, -D / 2 + 0.33] });
  mesh(new THREE.BoxGeometry(W - 0.2, 0.02, D - 0.2), new THREE.MeshStandardMaterial({ color: '#6b5a4a', roughness: 0.9 }), { parent: root, at: [0, 0.13, 0] });
  // roof with overhang
  mesh(roundedBox(W + 0.5, 0.14, D + 0.6, 0.04), paint, { parent: root, at: [0, 0.12 + H + 0.07, 0.1] });
  // illuminated fascia sign
  const sign = lampGroup('sign', 'white');
  const tex = textTexture(variant === 'newsstand' ? 'NEWS · MAGAZINES' : variant === 'ticket' ? 'TICKETS · INFO' : 'HOT DOGS · COFFEE', { w: 1024, h: 128, bg: o.color ?? v.color, fg: '#ffffff', font: 'bold 74px Helvetica, Arial', radius: 0 });
  if (tex) { sign.lens.map = tex; sign.lens.emissiveMap = tex; sign.lens.color.set('#ffffff'); }
  sign.add(root, { geometry: new THREE.PlaneGeometry(W + 0.4, 0.12).translate(0, 0.12 + H + 0.07, D / 2 + 0.401), normal: [0, 0, 1], depth: 0.005, glowSize: 1.4 });
  emblem(root, 0.12, [W / 2 - 0.3, 0.12 + 0.55, D / 2]);
  if (variant === 'newsstand') {
    // magazine racks on the front
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
      const m = mesh(roundedBox(0.2, 0.27, 0.01, 0.004), new THREE.MeshStandardMaterial({ color: ['#c62828', '#1565c0', '#f9a825', '#2e7d32', '#6a1b9a', '#ff7043'][(i + r) % 6], roughness: 0.4 }), { parent: root, at: [-0.6 + i * 0.24, 0.3 + r * 0.25, D / 2 + 0.01] });
      m.rotation.x = -0.15;
    }
  } else if (variant === 'ticket') {
    const glass = new THREE.MeshPhysicalMaterial({ color: '#dfe9ee', roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false, name: 'glass' });
    mesh(new THREE.BoxGeometry(W - 0.2, 1.1, 0.01), glass, { parent: root, at: [0, 0.12 + 1.6, D / 2 - 0.04] });
    for (const x of [-0.5, 0.5]) mesh(roundedBox(0.25, 0.06, 0.02, 0.01), M.metal('#c9cdd0', 0.3), { parent: root, at: [x, 0.12 + 1.07, D / 2 + 0.005] });
  } else {
    mesh(roundedBox(0.5, 0.35, 0.3, 0.03), M.metal('#c9cdd0', 0.25), { parent: root, at: [-0.6, 0.12 + 0.9 + 0.175, -D / 2 + 0.33] });
    mesh(lathe([[0.001, 0], [0.06, 0], [0.08, 0.25], [0.001, 0.25]], 16), M.metal('#c9cdd0', 0.25), { parent: root, at: [0.5, 0.12 + 1.045, D / 2 + 0.1] });
  }
  if (style === 'awning') {
    const can = awningMat(o.color ?? v.color, '#f4f1ea');
    const a = new THREE.PlaneGeometry(W + 0.4, 0.9);
    a.rotateX(-Math.PI / 2 + 0.5);
    mesh(a, can, { parent: root, at: [0, 0.12 + H - 0.4, D / 2 + 0.4] });
    valance(root, W + 0.4, [0, 0.12 + H - 0.6, D / 2 + 0.79], can);
    for (const s of [1, -1]) curveTube([[s * (W / 2 + 0.1), 0.12 + H - 0.3, D / 2], [s * (W / 2 + 0.15), 0.12 + H - 0.6, D / 2 + 0.78]], 0.012, mats.powder('#2b3034'), { parent: root, segments: 2 });
  }
  animations.push(clip('lights', 1, [...lampTracks('sign', 1.6, { glow: 0.35 }), ...lampTracks('interior', 3)]));
  return finish(root, { type: 'kiosk', variant, o, animations, lean: false });
}

/* ------------------------------- Food cart ------------------------------- */

export const FOOD_CART_VARIANTS = {
  'hot-dog': { color: '#c0392b', a: '#f2c200' },
  'ice-cream': { color: '#f4b6c2', a: '#ffffff' },
  coffee: { color: '#3e2723', a: '#d7ccc8' },
};

export function createFoodCart(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(FOOD_CART_VARIANTS, o.variant, 'food-cart');
  const v = FOOD_CART_VARIANTS[variant];
  const root = group(`food-cart-${variant}`);
  const body = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.35, clearcoat: 0.7, name: 'paint' });
  const steel = M.metal('#c9cdd0', 0.22);
  const L = 1.6;
  const W = 0.8;
  // two big spoked wheels + a stand leg + push handle
  for (const s of [1, -1]) {
    mesh(new THREE.TorusGeometry(0.3, 0.03, 10, 32), M.rubber(), { parent: root, at: [0.2, 0.33, s * (W / 2 + 0.05)] });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      tube([0.2, 0.33, s * (W / 2 + 0.05)], [0.2 + Math.cos(a) * 0.28, 0.33 + Math.sin(a) * 0.28, s * (W / 2 + 0.05)], 0.008, steel, { parent: root });
    }
  }
  mesh(new THREE.CylinderGeometry(0.02, 0.02, W + 0.14, 10).rotateX(Math.PI / 2), steel, { parent: root, at: [0.2, 0.33, 0] });
  tube([-L / 2 + 0.12, 0.55, 0], [-L / 2 + 0.12, 0.0, 0], 0.025, steel, { parent: root });
  mesh(new THREE.SphereGeometry(0.035, 12, 8), M.rubber(), { parent: root, at: [-L / 2 + 0.12, 0.02, 0] });
  for (const s of [1, -1]) tube([-L / 2 + 0.05, 0.95, s * (W / 2 - 0.05)], [-L / 2 - 0.35, 1.05, s * (W / 2 - 0.05)], 0.018, steel, { parent: root });
  tube([-L / 2 - 0.35, 1.05, -(W / 2 - 0.05)], [-L / 2 - 0.35, 1.05, W / 2 - 0.05], 0.022, M.rubber(), { parent: root });
  mesh(roundedBox(L, 0.55, W, 0.06), body, { parent: root, at: [0, 0.82, 0] });
  mesh(roundedBox(L + 0.04, 0.04, W + 0.04, 0.012), steel, { parent: root, at: [0, 1.1, 0] });
  const tex = textTexture(variant === 'hot-dog' ? 'HOT DOGS' : variant === 'ice-cream' ? 'ICE CREAM' : 'ESPRESSO', { w: 512, h: 128, bg: o.color ?? v.color, fg: v.a, font: 'bold 84px Georgia, serif', radius: 0 });
  if (tex) for (const s of [1, -1]) {
    const p = mesh(new THREE.PlaneGeometry(L * 0.8, 0.2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }), { parent: root, at: [0, 0.85, s * (W / 2 + 0.001)] });
    if (s < 0) p.rotation.y = Math.PI;
  }
  emblem(root, 0.09, [L / 2 - 0.12, 0.95, W / 2]);
  if (variant === 'hot-dog') {
    // steam well + condiments + striped umbrella
    mesh(roundedBox(0.6, 0.06, 0.4, 0.01), steel, { parent: root, at: [0.2, 1.15, 0] });
    for (let i = 0; i < 3; i++) mesh(lathe([[0.001, 0], [0.03, 0], [0.03, 0.15], [0.012, 0.19], [0.001, 0.2]], 12), M.plastic(['#c62828', '#f9a825', '#ffffff'][i], 0.4), { parent: root, at: [-0.4 + i * 0.1, 1.12, 0.15] });
  } else if (variant === 'ice-cream') {
    // freezer lids + giant cone on top
    for (const x of [-0.35, 0.35]) mesh(roundedBox(0.55, 0.04, 0.6, 0.02), steel, { parent: root, at: [x, 1.14, 0] });
  } else {
    mesh(roundedBox(0.45, 0.4, 0.35, 0.04), steel, { parent: root, at: [0.3, 1.32, 0] });
    for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), M.plastic('#111'), { parent: root, at: [0.3 + s * 0.1, 1.2, 0.2] });
    for (let i = 0; i < 5; i++) mesh(lathe([[0.001, 0], [0.03, 0], [0.04, 0.1], [0.001, 0.1]], 12), M.plastic('#f2efe6', 0.6), { parent: root, at: [-0.5, 1.12 + i * 0.07, -0.2] });
  }
  const poleM = steel;
  tube([0.0, 1.12, 0], [0.0, 2.3, 0], 0.02, poleM, { parent: root });
  const umb = new THREE.ConeGeometry(1.1, 0.35, 12, 1, true);
  const ut = stripes(variant === 'coffee' ? '#3e2723' : o.color ?? v.color, '#ffffff', 12);
  const um = new THREE.MeshStandardMaterial({ color: ut ? '#ffffff' : v.color, map: ut, side: THREE.DoubleSide, roughness: 0.85, name: 'canvas' });
  mesh(umb, um, { parent: root, at: [0, 2.15, 0] });
  mesh(new THREE.SphereGeometry(0.035, 12, 8), poleM, { parent: root, at: [0, 2.33, 0] });
  return finish(root, { type: 'food-cart', variant, o, animations: [], lean: true });
}

/* ------------------------------- Umbrella ------------------------------- */

export const UMBRELLA_VARIANTS = {
  patio: { color: '#c0392b' },
  market: { color: '#f4f1ea' },
  cantilever: { color: '#3a3f44' },
  beach: { color: '#1565c0' },
};

export function createUmbrella(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(UMBRELLA_VARIANTS, o.variant, 'umbrella');
  const v = UMBRELLA_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`umbrella-${variant}`);
  const steel = variant === 'market' ? new THREE.MeshStandardMaterial({ color: '#8a6a48', roughness: 0.8, name: 'timber' }) : M.metal('#c9cdd0', 0.3);
  const c = o.color ?? v.color;
  const striped = variant === 'beach' || style === 'striped';
  const tex = striped ? stripes(c, '#ffffff', 16) : null;
  const can = new THREE.MeshStandardMaterial({ color: tex ? '#ffffff' : c, map: tex, side: THREE.DoubleSide, roughness: 0.85, name: 'canvas' });
  const R = variant === 'market' ? 1.5 : variant === 'cantilever' ? 1.5 : 1.1;
  let cx = 0;
  if (variant === 'cantilever') {
    // offset arm umbrella on a cross base
    mesh(roundedBox(1.0, 0.08, 0.12, 0.02), M.metal('#3a3a3a', 0.5), { parent: root, at: [-1.4, 0.04, 0] });
    mesh(roundedBox(0.12, 0.08, 1.0, 0.02), M.metal('#3a3a3a', 0.5), { parent: root, at: [-1.4, 0.04, 0] });
    for (const [x, z] of [[-1.75, 0], [-1.05, 0]]) mesh(roundedBox(0.4, 0.06, 0.4, 0.01), mats.concrete(), { parent: root, at: [x, 0.11, z] });
    tube([-1.4, 0.08, 0], [-1.4, 2.6, 0], 0.04, steel, { parent: root });
    curveTube([[-1.4, 2.5, 0], [-0.9, 2.75, 0], [-0.2, 2.8, 0], [0, 2.75, 0]], 0.035, steel, { parent: root, radialSegments: 10 });
    tube([0, 2.75, 0], [0, 2.5, 0], 0.025, steel, { parent: root });
    cx = 0;
  } else {
    if (variant === 'beach') {
      tube([0, 0, 0], [0, 2.17, 0], 0.02, steel, { parent: root });
    } else {
      mesh(lathe([[0.001, 0], [0.3, 0], [0.3, 0.05], [0.12, 0.12], [0.05, 0.14], [0.001, 0.14]], 32), M.metal('#2b2b2b', 0.5), { parent: root });
      tube([0, 0.1, 0], [0, variant === 'market' ? 2.6 : 2.52, 0], variant === 'market' ? 0.03 : 0.022, steel, { parent: root });
    }
  }
  const top = variant === 'beach' ? 2.0 : variant === 'cantilever' ? 2.55 : 2.35;
  const cone = new THREE.ConeGeometry(R, variant === 'market' ? 0.5 : 0.35, variant === 'market' ? 8 : 16, 1, true);
  const p = cone.attributes.position;
  // slight sag between ribs
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i));
    const n = variant === 'market' ? 8 : 16;
    p.setY(i, p.getY(i) - Math.abs(Math.sin((a * n) / 2)) * 0.03 * (1 - (p.getY(i) + 0.2) / 0.4));
  }
  cone.computeVertexNormals();
  mesh(cone, can, { parent: root, at: [cx, top, 0] });
  const n = variant === 'market' ? 8 : 8;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    tube([cx, variant === 'cantilever' ? 2.52 : top - 0.5, 0], [cx + Math.cos(a) * R * 0.5, top - 0.08, Math.sin(a) * R * 0.5], 0.008, steel, { parent: root });
  }
  mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 12), steel, { parent: root, at: [cx, top + 0.14, 0] });
  mesh(new THREE.SphereGeometry(0.04, 12, 8), steel, { parent: root, at: [cx, top + 0.2, 0] });
  if (style === 'table') {
    // café table + two chairs under the umbrella
    const tx = cx;
    mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.025, 32), M.metal('#c9cdd0', 0.25), { parent: root, at: [tx, 0.74, 0] });
    if (variant === 'cantilever' || variant === 'beach') tube([tx, 0, 0], [tx, 0.73, 0], 0.03, M.metal('#555', 0.4), { parent: root });
    for (const s of [1, -1]) {
      const ch = group(null, { parent: root, at: [tx + s * 0.7, 0, 0] });
      ch.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      for (const dx of [-0.18, 0.18]) for (const dz of [-0.18, 0.18]) tube([dx, 0, dz], [dx * 0.9, 0.45, dz * 0.9], 0.012, M.metal('#555', 0.4), { parent: ch });
      mesh(roundedBox(0.4, 0.03, 0.4, 0.01), new THREE.MeshStandardMaterial({ color: '#8a6a48', roughness: 0.7 }), { parent: ch, at: [0, 0.46, 0] });
      mesh(roundedBox(0.4, 0.3, 0.03, 0.01), new THREE.MeshStandardMaterial({ color: '#8a6a48', roughness: 0.7 }), { parent: ch, at: [0, 0.65, -0.19] });
      for (const dx of [-0.18, 0.18]) tube([dx, 0.45, -0.17], [dx, 0.8, -0.2], 0.012, M.metal('#555', 0.4), { parent: ch });
    }
  }
  if (variant === 'beach') {
    // beach towel + cool box
    mesh(roundedBox(0.8, 0.01, 1.7, 0.005), new THREE.MeshStandardMaterial({ color: '#ff7043', roughness: 1 }), { parent: root, at: [0.6, 0.005, 0.3] });
    mesh(roundedBox(0.45, 0.32, 0.3, 0.03), M.plastic('#1e88e5', 0.4), { parent: root, at: [-0.5, 0.16, -0.4] });
  }
  return finish(root, { type: 'umbrella', variant, o, animations: [], lean: false });
}

/* -------------------------------- Gas pump -------------------------------- */

export const GAS_PUMP_VARIANTS = {
  modern: { color: '#e8e8e4', accent: '#d32f2f' },
  classic: { color: '#c62828', accent: '#f4f1ea' },
  dual: { color: '#1f5f8b', accent: '#f2c200' },
};

export function createGasPump(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(GAS_PUMP_VARIANTS, o.variant, 'gas-pump');
  const v = GAS_PUMP_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`gas-pump-${variant}`);
  const body = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.3, clearcoat: 0.7, name: 'paint' });
  const accent = new THREE.MeshPhysicalMaterial({ color: M.toColor(v.accent), roughness: 0.3, clearcoat: 0.7, name: 'accent' });
  const hose = M.plastic('#111', 0.5);
  const scr = lampGroup('display', 'white');
  scr.lens.emissive.set('#b8f0c8');
  if (variant === 'classic') {
    // 1950s visible-style pump: rounded body, round clock face, globe on top
    mesh(roundedBox(0.6, 0.15, 0.5, 0.03), mats.concrete(), { parent: root, at: [0, 0.075, 0] });
    mesh(roundedBox(0.5, 1.4, 0.4, 0.18), body, { parent: root, at: [0, 0.15 + 0.7, 0] });
    const dial = textTexture([['GALLONS', 'bold 34px Arial'], ['0 0 4 2', 'bold 60px "Courier New"'], ['PRICE 29¢', 'bold 34px Arial']], { w: 256, h: 256, bg: '#f4f1ea', fg: '#111', radius: 128 });
    if (dial) { scr.lens.map = dial; scr.lens.emissiveMap = dial; scr.lens.color.set('#ffffff'); }
    scr.add(root, { geometry: new THREE.CircleGeometry(0.17, 32).translate(0, 1.25, 0.201), normal: [0, 0, 1], depth: 0.005, glowSize: 0.6 });
    mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 32), M.chrome(), { parent: root, at: [0, 1.25, 0.2] });
    const globe = lampGroup('globe', 'white');
    globe.lens.color.set('#f4f1ea');
    const gtex = textTexture('GAS', { w: 256, h: 128, bg: '#f4f1ea', fg: '#c62828', font: 'bold 90px Arial', radius: 0 });
    if (gtex) { globe.lens.map = gtex; globe.lens.emissiveMap = gtex; }
    mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 20), accent, { parent: root, at: [0, 1.59, 0] });
    globe.add(root, { geometry: new THREE.SphereGeometry(0.2, 28, 20).scale(1, 0.85, 0.5).translate(0, 1.8, 0), normal: [0, 0, 1], depth: 0.1, glowSize: 0.8 });
    tube([0.25, 1.0, 0.0], [0.3, 0.6, 0.1], 0.018, hose, { parent: root });
    mesh(roundedBox(0.06, 0.22, 0.08, 0.02), M.chrome(), { parent: root, at: [0.28, 0.95, 0.0] });
  } else {
    const W = variant === 'dual' ? 1.3 : 1.0;
    mesh(roundedBox(W + 0.5, 0.2, 0.9, 0.05), mats.concrete('#d8d4cc'), { parent: root, at: [0, 0.1, 0] });
    for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 16), new THREE.MeshStandardMaterial({ color: '#f2c200', roughness: 0.4 }), { parent: root, at: [s * (W / 2 + 0.18), 0.7, 0.35] });
    mesh(roundedBox(W, 1.9, 0.5, 0.05), body, { parent: root, at: [0, 0.2 + 0.95, 0] });
    mesh(roundedBox(W + 0.02, 0.25, 0.52, 0.04), accent, { parent: root, at: [0, 0.2 + 1.78, 0] });
    for (const z of [0.251, -0.251]) {
      const dtex = textTexture([['$ 42.17', 'bold 64px "Courier New"'], ['11.204 GAL', 'bold 46px "Courier New"']], { w: 256, h: 160, bg: '#0a1a10', fg: '#9dffb8', radius: 0 });
      const lens = scr;
      if (dtex && !lens.lens.map) { lens.lens.map = dtex; lens.lens.emissiveMap = dtex; lens.lens.color.set('#ffffff'); }
      lens.add(root, { geometry: new THREE.PlaneGeometry(0.42, 0.26).rotateY(z > 0 ? 0 : Math.PI).translate(0, 1.55, z), normal: [0, 0, Math.sign(z)], depth: 0.005, glowSize: 0.6 });
      // grade buttons
      for (let i = 0; i < 3; i++) mesh(roundedBox(0.1, 0.06, 0.01, 0.01), new THREE.MeshStandardMaterial({ color: ['#2e7d32', '#f9a825', '#c62828'][i], roughness: 0.4 }), { parent: root, at: [-0.15 + i * 0.15, 1.2, z + Math.sign(z) * 0.006] });
    }
    // nozzles in holsters with curling hoses
    const nozzles = variant === 'dual' ? [-0.45, -0.15, 0.15, 0.45] : [-0.3, 0, 0.3];
    for (const x of nozzles) {
      mesh(roundedBox(0.09, 0.14, 0.06, 0.02), M.plastic('#222'), { parent: root, at: [x, 1.0, 0.28] });
      mesh(roundedBox(0.05, 0.2, 0.05, 0.015), x < 0 ? M.plastic('#2e7d32') : M.plastic('#111'), { parent: root, at: [x, 0.97, 0.33] });
      curveTube([[x, 1.85, 0.25], [x + 0.1, 1.9, 0.5], [x + 0.15, 1.2, 0.6], [x + 0.05, 0.75, 0.45], [x, 0.9, 0.34]], 0.016, hose, { parent: root, segments: 40, radialSegments: 8 });
    }
    const brand = textTexture('FUEL', { w: 256, h: 96, bg: v.accent, fg: '#ffffff', font: 'bold 70px Arial', radius: 0 });
    if (brand) mesh(new THREE.PlaneGeometry(0.5, 0.18), new THREE.MeshStandardMaterial({ map: brand }), { parent: root, at: [0, 0.2 + 1.78, 0.2605] });
    emblem(root, 0.1, [W / 2 - 0.12, 0.6, 0.25]);
  }
  if (style === 'canopy') {
    // forecourt canopy section with downlights
    const steel = M.metal('#c9cdd0', 0.3);
    // two columns into a cross beam; fascia frame (white with brand band) + soffit panel
    for (const x of [-1.6, 1.6]) mesh(roundedBox(0.3, 4.72, 0.3, 0.04), steel, { parent: root, at: [x, 2.36, -0.6] });
    mesh(roundedBox(4.4, 0.14, 0.14, 0.03), steel, { parent: root, at: [0, 4.67, -0.6] });
    const white = new THREE.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.5 });
    const cz = 0.3;
    for (const s of [1, -1]) {
      mesh(roundedBox(4.5, 0.42, 0.1, 0.03), white, { parent: root, at: [0, 4.81, cz + s * 1.7] });
      mesh(roundedBox(0.1, 0.42, 3.3, 0.03), white, { parent: root, at: [s * 2.2, 4.81, cz] });
      mesh(roundedBox(4.52, 0.16, 0.02, 0.008), accent, { parent: root, at: [0, 4.9, cz + s * 1.76] });
      mesh(roundedBox(0.02, 0.16, 3.4, 0.008), accent, { parent: root, at: [s * 2.26, 4.9, cz] });
    }
    mesh(roundedBox(4.3, 0.04, 3.3, 0.01), white, { parent: root, at: [0, 4.76, cz] });
    const down = lampGroup('downlights', 'white');
    for (const x of [-1, 0, 1]) down.add(root, { at: [x, 4.6, -0.6], normal: [0, -1, 0], w: 0.3, h: 0.1, depth: 0.01, bezel: false, glowSize: 1.0 });
  }
  const tracks = [...lampTracks('display', 2.2, { glow: 0.4 })];
  if (variant === 'classic') tracks.push(...lampTracks('globe', 2.2, { glow: 0.5 }));
  if (style === 'canopy') tracks.push(...lampTracks('downlights', 4));
  return finish(root, { type: 'gas-pump', variant, o, animations: [clip('lights', 1, tracks)], lean: variant === 'classic' });
}

/* -------------------------------- Billboard -------------------------------- */

export const BILLBOARD_VARIANTS = {
  standard: {},
  digital: {},
  mupi: {},
  pylon: {},
};

const ADS = [
  [['SUMMER SALE', 'bold 120px Helvetica, Arial'], ['up to 50% off', '70px Helvetica, Arial'], '#ff6a2b', '#ffffff'],
  [['FLY TO LISBON', 'bold 100px Helvetica, Arial'], ['from 49', 'bold 120px Helvetica, Arial'], '#1565c0', '#ffffff'],
  [['FRESH. LOCAL.', 'bold 110px Georgia, serif'], ['Green Market', 'italic 80px Georgia, serif'], '#2e7d32', '#fdf6e3'],
  [['NEW SEASON', 'bold 110px Helvetica, Arial'], ['streaming now', '70px Helvetica, Arial'], '#1d1d1f', '#ffd23f'],
];

export function createBillboard(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BILLBOARD_VARIANTS, o.variant, 'billboard');
  const style = styleOf(o);
  const root = group(`billboard-${variant}`);
  const steel = M.metal('#8e9296', 0.4);
  const ad = ADS[(o.seed ?? 0) % ADS.length];
  const face = lampGroup('face', 'white');
  const tex = textTexture([ad[0], ad[1]], { w: 1024, h: variant === 'mupi' ? 1400 : 360, bg: ad[2], fg: ad[3], radius: 0 });
  if (tex) { face.lens.map = tex; face.lens.emissiveMap = tex; face.lens.color.set('#ffffff'); face.lens.emissiveIntensity = variant === 'digital' ? 0.9 : 0.05; }
  else face.lens.color.set(ad[2]);
  const animations = [];
  if (variant === 'mupi') {
    // street-level lit poster case (1.2 × 1.75 m poster)
    mesh(roundedBox(0.6, 0.06, 0.4, 0.02), mats.concrete(), { parent: root, at: [0, 0.03, 0] });
    for (const x of [-0.45, 0.45]) mesh(roundedBox(0.08, 0.4, 0.12, 0.02), mats.powder('#3a3f44'), { parent: root, at: [x, 0.23, 0] });
    mesh(roundedBox(1.3, 1.9, 0.2, 0.05), mats.powder('#3a3f44'), { parent: root, at: [0, 0.4 + 0.95, 0] });
    for (const s of [1, -1]) face.add(root, { geometry: new THREE.PlaneGeometry(1.18, 1.72).rotateY(s > 0 ? 0 : Math.PI).translate(0, 1.35, s * 0.101), normal: [0, 0, s], depth: 0.005, glowSize: 2.2 });
    emblem(root, 0.1, [0.5, 0.48, 0.1]);
  } else if (variant === 'pylon') {
    // tall roadside pylon sign: two columns, stacked tenant panels
    const H = 6;
    for (const x of [-0.9, 0.9]) mesh(roundedBox(0.3, H, 0.4, 0.06), mats.powder('#e8e8e4'), { parent: root, at: [x, H / 2, 0] });
    mesh(roundedBox(2.2, 0.4, 0.5, 0.06), mats.powder('#3a3f44'), { parent: root, at: [0, H + 0.2, 0] });
    const names = [['MALL', '#c62828'], ['CINEMA', '#1d1d1f'], ['CAFÉ', '#6d4c41'], ['GROCER', '#2e7d32']];
    names.forEach(([n, c], i) => {
      const lg = lampGroup(`panel_${i}`, 'white');
      const t = textTexture(n, { w: 512, h: 128, bg: c, fg: '#ffffff', font: 'bold 90px Helvetica, Arial', radius: 0 });
      if (t) { lg.lens.map = t; lg.lens.emissiveMap = t; lg.lens.color.set('#ffffff'); lg.lens.emissiveIntensity = 0.1; }
      mesh(roundedBox(1.5, 0.5, 0.3, 0.03), mats.powder('#3a3f44'), { parent: root, at: [0, H - 0.6 - i * 0.62, 0] });
      for (const s of [1, -1]) lg.add(root, { geometry: new THREE.PlaneGeometry(1.42, 0.44).rotateY(s > 0 ? 0 : Math.PI).translate(0, H - 0.6 - i * 0.62, s * 0.151), normal: [0, 0, s], depth: 0.005, glowSize: 1.2 });
      animations.push(...lampTracks(`panel_${i}`, 1.2, { glow: 0.2 }));
    });
    face.add(root, { geometry: new THREE.PlaneGeometry(2.1, 0.32).translate(0, H + 0.2, 0.251), normal: [0, 0, 1], depth: 0.005 });
  } else {
    // 48-sheet billboard (≈ 6 × 3 m) on a monopole with catwalk and lights
    const W = 6;
    const Hb = 2.4;
    const top = 7;
    mesh(pole(top - Hb / 2, { r: 0.3, top: 0.25, base: 0.6, baseH: 0.3, collar: false }), steel, { parent: root });
    mesh(roundedBox(W + 0.3, Hb + 0.3, 0.4, 0.06), mats.powder('#2b2b2b'), { parent: root, at: [0, top, -0.2] });
    face.add(root, { geometry: new THREE.PlaneGeometry(W, Hb).translate(0, top, 0.001), normal: [0, 0, 1], depth: 0.005, glowSize: 5 });
    // catwalk + gantry lights
    mesh(roundedBox(W + 0.3, 0.05, 0.8, 0.01), M.metal('#6e7276', 0.5), { parent: root, at: [0, top - Hb / 2 - 0.2, 0.2] });
    for (let i = 0; i <= 12; i++) tube([-W / 2 - 0.15 + (i * (W + 0.3)) / 12, top - Hb / 2 - 0.18, 0.58], [-W / 2 - 0.15 + (i * (W + 0.3)) / 12, top - Hb / 2 + 0.6, 0.58], 0.012, M.metal('#6e7276', 0.5), { parent: root });
    tube([-W / 2 - 0.15, top - Hb / 2 + 0.6, 0.58], [W / 2 + 0.15, top - Hb / 2 + 0.6, 0.58], 0.018, M.metal('#6e7276', 0.5), { parent: root });
    if (variant !== 'digital') {
      const spot = lampGroup('floodlights', 'white');
      for (const x of [-2, 0, 2]) {
        tube([x, top - Hb / 2 - 0.2, 0.2], [x, top - Hb / 2 - 0.2, 1.1], 0.03, M.metal('#6e7276', 0.5), { parent: root });
        mesh(roundedBox(0.3, 0.12, 0.2, 0.03), M.metal('#2b2b2b', 0.5), { parent: root, at: [x, top - Hb / 2 - 0.15, 1.15] });
        spot.add(root, { at: [x, top - Hb / 2 - 0.08, 1.15], normal: [0, 1, -0.6], w: 0.24, h: 0.1, depth: 0.01, bezel: false, glowSize: 1.2 });
      }
      animations.push(...lampTracks('floodlights', 4), ...lampTracks('face', 0.5, { glow: 0.06 }));
    } else {
      // LED pixel frame
      mesh(roundedBox(W + 0.1, 0.08, 0.1, 0.02), mats.powder('#111'), { parent: root, at: [0, top + Hb / 2 + 0.05, 0.02] });
    }
    if (style === 'double-sided') {
      const back = lampGroup('face_back', 'white');
      const t2 = textTexture([ADS[((o.seed ?? 0) + 1) % ADS.length][0], ADS[((o.seed ?? 0) + 1) % ADS.length][1]], { w: 1024, h: 360, bg: ADS[((o.seed ?? 0) + 1) % ADS.length][2], fg: ADS[((o.seed ?? 0) + 1) % ADS.length][3], radius: 0 });
      if (t2) { back.lens.map = t2; back.lens.emissiveMap = t2; back.lens.color.set('#ffffff'); back.lens.emissiveIntensity = 0.05; }
      back.add(root, { geometry: new THREE.PlaneGeometry(W, Hb).rotateY(Math.PI).translate(0, top, -0.401), normal: [0, 0, -1], depth: 0.005, glowSize: 5 });
    }
  }
  if (variant === 'digital') {
    // cycle through adverts by flashing the face
    const times = [0, 2.9, 3.0, 3.1, 6];
    animations.push(new THREE.NumberKeyframeTrack('face.material.emissiveIntensity', times, [1.1, 1.1, 0.1, 1.1, 1.1]));
  } else if (variant === 'mupi') animations.push(...lampTracks('face', 1.0, { glow: 0.25 }));
  return finish(root, { type: 'billboard', variant, o, animations: animations.length ? [clip(variant === 'digital' ? 'screen' : 'lights', variant === 'digital' ? 6 : 1, animations)] : [], lean: false });
}
