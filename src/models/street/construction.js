import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, curveTube, lathe, rng, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, clip, pingPong } from '../../core/animation.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { mats, textTexture, emblem, tube } from './common.js';
import { finish, styleOf } from './kit.js';

/* Construction-site & logistics props: pallets, crates, barrels, dumpsters,
 * portable toilets, sandbags, cable drums and scaffolding. Real sizes. */

const timber = (c = '#c8a173') => new THREE.MeshStandardMaterial({ color: M.toColor(c), roughness: 0.9, name: 'timber' });

/* -------------------------------- Pallet -------------------------------- */

export const PALLET_VARIANTS = {
  euro: { color: '#c8a173' }, // 1200 × 800
  us: { color: '#b89466' }, // 48 × 40 in
  plastic: { color: '#2b5f9e' },
};

function palletAt(parent, variant, color, y = 0, rand = rng(1)) {
  const g = group(null, { parent, at: [0, y, 0] });
  const W = variant === 'us' ? 1.22 : 1.2;
  const D = variant === 'us' ? 1.02 : 0.8;
  if (variant === 'plastic') {
    const p = new THREE.MeshPhysicalMaterial({ color: M.toColor(color), roughness: 0.55, clearcoat: 0.2, name: 'plastic' });
    mesh(roundedBox(W, 0.03, D, 0.01), p, { parent: g, at: [0, 0.135, 0] });
    for (const x of [-W / 2 + 0.08, 0, W / 2 - 0.08]) for (const z of [-D / 2 + 0.08, 0, D / 2 - 0.08]) mesh(roundedBox(0.14, 0.1, 0.14, 0.02), p, { parent: g, at: [x, 0.07, z] });
    for (const x of [-W / 2 + 0.08, 0, W / 2 - 0.08]) mesh(roundedBox(0.14, 0.025, D, 0.008), p, { parent: g, at: [x, 0.0125, 0] });
    return 0.15;
  }
  const t = () => timber(new THREE.Color(color).offsetHSL(0, 0, (rand() - 0.5) * 0.08).getStyle());
  // bottom boards, blocks, stringer boards, top deck
  for (const z of [-D / 2 + 0.05, 0, D / 2 - 0.05]) mesh(roundedBox(W, 0.022, 0.1, 0.004), t(), { parent: g, at: [0, 0.011, z] });
  for (const x of [-W / 2 + 0.07, 0, W / 2 - 0.07]) for (const z of [-D / 2 + 0.05, 0, D / 2 - 0.05]) mesh(roundedBox(0.14, 0.078, 0.1, 0.006), t(), { parent: g, at: [x, 0.061, z] });
  for (const x of [-W / 2 + 0.07, 0, W / 2 - 0.07]) mesh(roundedBox(0.14, 0.022, D, 0.004), t(), { parent: g, at: [x, 0.111, 0] });
  const n = variant === 'euro' ? 5 : 7;
  for (let i = 0; i < n; i++) mesh(roundedBox(W, 0.022, (D / n) * 0.72, 0.004), t(), { parent: g, at: [0, 0.133, -D / 2 + (D / n) * (i + 0.5)] });
  if (variant === 'euro') {
    const tex = textTexture('EPAL', { w: 128, h: 64, bg: '#c8a173', fg: '#3a2a18', font: 'bold 40px Arial', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshStandardMaterial({ map: tex }), { parent: g, at: [0, 0.061, D / 2 - 0.0005 + 0.0005] });
  }
  return 0.144;
}

function cartons(parent, y, W, D, rand) {
  const card = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, name: 'cardboard' });
  const box = 0.38;
  for (let lay = 0; lay < 3; lay++) for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) {
    if (lay === 2 && rand() < 0.3) continue;
    mesh(roundedBox(box - 0.01, 0.3, box - 0.01, 0.01), card(rand() < 0.5 ? '#b08a5a' : '#a67c4e'), { parent, at: [-W / 2 + box / 2 + 0.02 + i * box, y + 0.15 + lay * 0.3, -D / 2 + box / 2 + 0.02 + k * box] });
  }
  // stretch wrap
  mesh(roundedBox(W - 0.06, 0.88, D - 0.02, 0.03), new THREE.MeshPhysicalMaterial({ color: '#e8f0f2', transparent: true, opacity: 0.25, roughness: 0.2, depthWrite: false, name: 'wrap' }), { parent, at: [0, y + 0.45, 0] });
}

export function createPallet(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(PALLET_VARIANTS, o.variant, 'pallet');
  const v = PALLET_VARIANTS[variant];
  const style = styleOf(o);
  const rand = rng(o.seed ?? 2);
  const root = group(`pallet-${variant}`);
  let h = palletAt(root, variant, o.color ?? v.color, 0, rand);
  if (style === 'stacked') for (let i = 1; i < 5; i++) h = i * 0.144 + palletAt(root, variant, o.color ?? v.color, i * 0.144, rand) - 0.0;
  if (style === 'loaded') cartons(root, h, variant === 'us' ? 1.22 : 1.2, variant === 'us' ? 1.02 : 0.8, rand);
  if (style === 'bricks') {
    const brick = new THREE.MeshStandardMaterial({ color: '#a3492f', roughness: 0.95, name: 'brick' });
    const W = variant === 'us' ? 1.22 : 1.2;
    const D = variant === 'us' ? 1.02 : 0.8;
    const im = new THREE.InstancedMesh(roundedBox(0.215, 0.065, 0.1, 0.006), brick, 5 * 7 * 8);
    im.name = 'bricks';
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (let lay = 0; lay < 8; lay++) for (let i = 0; i < 5; i++) for (let k = 0; k < 7; k++) {
      m4.makeTranslation(-W / 2 + 0.13 + i * 0.235, h + 0.033 + lay * 0.067, -D / 2 + 0.07 + k * ((D - 0.14) / 6));
      im.setMatrixAt(n++, m4);
    }
    root.add(im);
    // strapping bands
    for (const x of [-0.3, 0.3]) mesh(roundedBox(0.02, 0.56, D + 0.01, 0.004), M.plastic('#1a1a1a'), { parent: root, at: [x, h + 0.27, 0] });
  }
  return finish(root, { type: 'pallet', variant, o, animations: [], lean: false });
}

/* --------------------------------- Crate --------------------------------- */

export const CRATE_VARIANTS = {
  wooden: { color: '#b08a5a' },
  plastic: { color: '#2e7d32' },
  shipping: { color: '#8a6a48' },
};

function crateAt(parent, variant, color, at, s = 1) {
  const g = group(null, { parent, at });
  g.scale.setScalar(s);
  if (variant === 'plastic') {
    // stackable produce crate with slotted walls
    const p = new THREE.MeshPhysicalMaterial({ color: M.toColor(color), roughness: 0.5, clearcoat: 0.2, name: 'plastic' });
    const W = 0.6;
    const D = 0.4;
    const H = 0.3;
    mesh(roundedBox(W, 0.02, D, 0.008), p, { parent: g, at: [0, 0.01, 0] });
    for (const sz of [1, -1]) for (let i = 0; i < 3; i++) mesh(roundedBox(W, 0.05, 0.015, 0.006), p, { parent: g, at: [0, 0.04 + i * 0.1, sz * (D / 2 - 0.0075)] });
    for (const sx of [1, -1]) for (let i = 0; i < 3; i++) mesh(roundedBox(0.015, 0.05, D, 0.006), p, { parent: g, at: [sx * (W / 2 - 0.0075), 0.04 + i * 0.1, 0] });
    for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(roundedBox(0.03, H, 0.03, 0.008), p, { parent: g, at: [sx * (W / 2 - 0.015), H / 2, sz * (D / 2 - 0.015)] });
    for (const sx of [1, -1]) mesh(roundedBox(0.016, 0.03, 0.12, 0.008), M.plastic('#111'), { parent: g, at: [sx * (W / 2 - 0.01), H - 0.04, 0] });
    return H;
  }
  const S = variant === 'shipping' ? 1.0 : 0.6;
  const t = timber(color);
  const dark = timber(new THREE.Color(color).offsetHSL(0, 0, -0.08).getStyle());
  // planked faces + framing battens on every edge + diagonal braces
  mesh(roundedBox(S - 0.02, S - 0.02, S - 0.02, 0.01), t, { parent: g, at: [0, S / 2, 0] });
  const b = 0.06;
  for (const sx of [1, -1]) for (const sz of [1, -1]) mesh(roundedBox(b, S, b, 0.008), dark, { parent: g, at: [sx * (S / 2 - b / 2 + 0.005), S / 2, sz * (S / 2 - b / 2 + 0.005)] });
  for (const y of [b / 2, S - b / 2]) for (const sz of [1, -1]) mesh(roundedBox(S, b, b, 0.008), dark, { parent: g, at: [0, y, sz * (S / 2 - b / 2 + 0.005)] });
  for (const y of [b / 2, S - b / 2]) for (const sx of [1, -1]) mesh(roundedBox(b, b, S, 0.008), dark, { parent: g, at: [sx * (S / 2 - b / 2 + 0.005), y, 0] });
  for (const sz of [1, -1]) {
    const d = mesh(roundedBox(S * 1.25, b * 0.8, 0.02, 0.006), dark, { parent: g, at: [0, S / 2, sz * (S / 2)] });
    d.rotation.z = sz * Math.PI / 4;
  }
  // plank gaps
  for (let i = 1; i < 5; i++) for (const sz of [1, -1]) mesh(new THREE.PlaneGeometry(S - 0.1, 0.006).rotateY(sz > 0 ? 0 : Math.PI), new THREE.MeshBasicMaterial({ color: '#4a3622' }), { parent: g, at: [0, (i * S) / 5, sz * (S / 2 - 0.009)] });
  if (variant === 'shipping') {
    const tex = textTexture([['THIS SIDE UP ↑', 'bold 40px Arial'], ['FRAGILE', 'bold 56px Arial']], { w: 256, h: 160, bg: 'rgba(0,0,0,0)', fg: '#2a1a0a', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshStandardMaterial({ map: tex, transparent: true }), { parent: g, at: [0, S * 0.62, S / 2 - 0.0085], name: 'stencil' });
  }
  return S;
}

export function createCrate(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(CRATE_VARIANTS, o.variant, 'crate');
  const v = CRATE_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`crate-${variant}`);
  const c = o.color ?? v.color;
  const h = crateAt(root, variant, c, [0, 0, 0]);
  if (style === 'stacked') {
    crateAt(root, variant, c, [0, h, 0]);
    if (variant !== 'shipping') crateAt(root, variant, c, [0, h * 2, 0]);
    const side = crateAt(root, variant, c, [variant === 'plastic' ? 0.62 : h + 0.02, 0, 0.05]);
    void side;
  }
  if (style === 'produce') {
    // filled with fruit / vegetables
    const rand = rng(o.seed ?? 4);
    const W = variant === 'plastic' ? 0.56 : h - 0.12;
    const D = variant === 'plastic' ? 0.36 : h - 0.12;
    const fruit = rand.pick(['#e53935', '#fb8c00', '#fdd835', '#7cb342']);
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshStandardMaterial({ color: fruit, roughness: 0.5, name: 'produce' }), 60);
    im.name = 'produce';
    const m4 = new THREE.Matrix4();
    const top = variant === 'plastic' ? 0.27 : h - 0.02;
    for (let i = 0; i < 60; i++) {
      m4.makeTranslation((rand() - 0.5) * W, top - 0.03 + rand() * 0.06 - (variant === 'plastic' ? 0 : 0), (rand() - 0.5) * D);
      im.setMatrixAt(i, m4);
    }
    if (variant !== 'plastic') mesh(new THREE.PlaneGeometry(W + 0.05, D + 0.05).rotateX(-Math.PI / 2), timber(c), { parent: root, at: [0, top - 0.045, 0] });
    root.add(im);
  }
  return finish(root, { type: 'crate', variant, o, animations: [], lean: style !== 'stacked' });
}

/* -------------------------------- Barrel -------------------------------- */

export const BARREL_VARIANTS = {
  'steel-drum': { color: '#1f5f8b' },
  plastic: { color: '#1565c0' },
  wooden: { color: '#8a5a33' },
};

export function createBarrel(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BARREL_VARIANTS, o.variant, 'barrel');
  const v = BARREL_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`barrel-${variant}`);
  const c = o.color ?? v.color;
  const one = (at, rotZ = 0) => {
    const g = group(null, { parent: root, at });
    g.rotation.z = rotZ;
    if (variant === 'steel-drum') {
      // 200 L drum: rolling hoops + chime rims + bung caps
      const paint = mats.powder(c);
      mesh(lathe([[0.001, 0], [0.29, 0], [0.295, 0.015], [0.285, 0.03], [0.285, 0.84], [0.295, 0.855], [0.29, 0.87], [0.001, 0.87]], 40), paint, { parent: g });
      for (const y of [0.29, 0.58]) mesh(new THREE.TorusGeometry(0.288, 0.012, 8, 40).rotateX(Math.PI / 2), paint, { parent: g, at: [0, y, 0] });
      for (const [x, z, r] of [[0.17, 0.05, 0.03], [-0.17, 0.02, 0.018]]) mesh(new THREE.CylinderGeometry(r, r, 0.015, 16), M.metal('#9aa0a6', 0.35), { parent: g, at: [x, 0.876, z] });
      const tex = textTexture([['⚠ FLAMMABLE', 'bold 40px Arial'], ['UN 1203', 'bold 34px Arial']], { w: 256, h: 120, bg: '#f2c200', fg: '#111', border: '#111', borderWidth: 5, radius: 8 });
      if (tex) {
        const lab = new THREE.CylinderGeometry(0.2865, 0.2865, 0.16, 32, 1, true, -0.5, 1.0);
        mesh(lab, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, name: 'label' }), { parent: g, at: [0, 0.44, 0] });
      }
      return 0.87;
    }
    if (variant === 'plastic') {
      const p = new THREE.MeshPhysicalMaterial({ color: M.toColor(c), roughness: 0.5, clearcoat: 0.3, name: 'plastic' });
      mesh(lathe([[0.001, 0], [0.26, 0], [0.28, 0.04], [0.29, 0.3], [0.27, 0.32], [0.29, 0.34], [0.29, 0.6], [0.27, 0.62], [0.29, 0.64], [0.285, 0.88], [0.26, 0.92], [0.001, 0.92]], 40), p, { parent: g });
      for (const x of [-0.15, 0.15]) mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), p, { parent: g, at: [x, 0.93, 0] });
      return 0.92;
    }
    // oak barrel: bulging staves + iron hoops
    const staves = 18;
    const H = 0.9;
    const prof = (y) => 0.25 + Math.sin((y / H) * Math.PI) * 0.06;
    for (let i = 0; i < staves; i++) {
      const a = (i / staves) * Math.PI * 2;
      const pts = [];
      for (let k = 0; k <= 8; k++) { const y = (k / 8) * H; pts.push(new THREE.Vector2(prof(y), y)); }
      const st = new THREE.LatheGeometry(pts, 2, a, (Math.PI * 2) / staves - 0.012);
      mesh(st, timber(new THREE.Color(c).offsetHSL(0, 0, ((i * 37) % 7) / 70 - 0.05).getStyle()), { parent: g });
    }
    mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.01, 32), timber(c), { parent: g, at: [0, H - 0.03, 0] });
    mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.01, 32), timber(c), { parent: g, at: [0, 0.03, 0] });
    const iron = M.metal('#3a3a3a', 0.6);
    for (const y of [0.06, 0.25, H - 0.25, H - 0.06]) mesh(lathe([[prof(y) + 0.004, -0.02], [prof(y) + 0.006, 0.02]], 32), iron, { parent: g, at: [0, y, 0] }).material.side = THREE.DoubleSide;
    return H;
  };
  const h = one([0, 0, 0]);
  if (style === 'group') {
    one([0.62, 0, 0.1]);
    one([0.3, 0, -0.52]);
    one([0.3, h, -0.2]);
  }
  if (style === 'on-side') {
    // a second barrel lying on its side next to the first, chocked with a wedge
    const g2x = 0.8;
    const lying = group(null, { parent: root, at: [g2x, 0.295, 0] });
    lying.rotation.z = Math.PI / 2;
    const tmp = root.children.length;
    one([0, 0, 0]);
    const added = root.children[tmp];
    root.remove(added);
    added.position.set(0, -h / 2, 0);
    lying.add(added);
    mesh(roundedBox(0.12, 0.1, 0.12, 0.01), timber('#8a6a48'), { parent: root, at: [g2x, 0.05, 0.22] });
  }
  return finish(root, { type: 'barrel', variant, o, animations: [], lean: style !== 'group' && style !== 'on-side' });
}

/* ------------------------------- Dumpster ------------------------------- */

export const DUMPSTER_VARIANTS = {
  'front-load': { color: '#2e5d3a' },
  'roll-off': { color: '#1f5f8b' },
  skip: { color: '#f2c200' },
};

export function createDumpster(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(DUMPSTER_VARIANTS, o.variant, 'dumpster');
  const v = DUMPSTER_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`dumpster-${variant}`);
  const paint = mats.powder(o.color ?? v.color);
  paint.name = 'paint';
  const steel = M.metal('#4a4f54', 0.5);
  const animations = [];
  let topY;
  let inner;
  if (variant === 'front-load') {
    // 3 yd³ container: sloped front, fork pockets, two plastic lids
    const W = 1.9;
    const D = 1.2;
    const H = 1.2;
    const prof = new THREE.Shape();
    prof.moveTo(-D / 2, 0.08); prof.lineTo(D / 2 - 0.25, 0.08); prof.lineTo(D / 2, H * 0.6); prof.lineTo(D / 2, H); prof.lineTo(-D / 2, H); prof.closePath();
    const body = new THREE.ExtrudeGeometry(prof, { depth: W, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    body.translate(0, 0, -W / 2);
    body.rotateY(-Math.PI / 2);
    mesh(body, paint, { parent: root });
    for (const x of [-W / 2 - 0.04, W / 2 + 0.04]) mesh(roundedBox(0.1, 0.16, 0.6, 0.02), steel, { parent: root, at: [x, H * 0.75, 0] });
    for (const x of [-W / 2 + 0.2, W / 2 - 0.2]) for (const z of [-D / 2 + 0.15, D / 2 - 0.4]) {
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16).rotateZ(Math.PI / 2), M.rubber(), { parent: root, at: [x, 0.05, z] });
      mesh(roundedBox(0.06, 0.06, 0.06, 0.01), steel, { parent: root, at: [x, 0.1, z] });
    }
    for (const s of [1, -1]) {
      const lid = group(s > 0 ? 'lid' : 'lid_2', { parent: root, at: [s * W / 4, H + 0.02, -D / 2] });
      mesh(roundedBox(W / 2 - 0.04, 0.05, D + 0.06, 0.02), M.plastic('#1a1a1a', 0.5), { parent: lid, at: [0, 0.025, D / 2 + 0.03] });
    }
    animations.push(clip('open', 3, [rotateTrack(root.getObjectByName('lid'), 'x', 3, (t) => -pingPong(t) * 1.7)]));
    const tex = textTexture('NO HAZARDOUS WASTE', { w: 512, h: 64, bg: o.color ?? v.color, fg: '#ffffff', font: 'bold 36px Arial', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(1.0, 0.12), new THREE.MeshStandardMaterial({ map: tex }), { parent: root, at: [0, H * 0.8, D / 2 + 0.021] });
    emblem(root, 0.14, [0.75, H * 0.8, D / 2 + 0.02]);
    topY = H + 0.05;
    inner = [W - 0.2, D - 0.2];
  } else if (variant === 'roll-off') {
    // 20 yd³ roll-off: long open box on rails with a rear door and ribs
    const L = 6.0;
    const W = 2.4;
    const H = 1.4;
    for (const s of [1, -1]) mesh(roundedBox(L, 0.1, 0.12, 0.02), steel, { parent: root, at: [0, 0.05, s * 0.5] });
    const wall = (w, h, at, ry) => { const m = mesh(roundedBox(w, h, 0.06, 0.02), paint, { parent: root, at }); m.rotation.y = ry; };
    mesh(roundedBox(L, 0.08, W, 0.02), paint, { parent: root, at: [0, 0.14, 0] });
    wall(L, H, [0, 0.14 + H / 2, W / 2 - 0.03], 0);
    wall(L, H, [0, 0.14 + H / 2, -W / 2 + 0.03], 0);
    wall(W - 0.12, H, [L / 2 - 0.03, 0.14 + H / 2, 0], Math.PI / 2);
    wall(W - 0.12, H, [-L / 2 + 0.03, 0.14 + H / 2, 0], Math.PI / 2);
    for (let i = 0; i <= 6; i++) for (const s of [1, -1]) mesh(roundedBox(0.08, H, 0.08, 0.02), paint, { parent: root, at: [-L / 2 + 0.2 + i * ((L - 0.4) / 6), 0.14 + H / 2, s * (W / 2 + 0.01)] });
    for (const s of [1, -1]) mesh(roundedBox(L + 0.1, 0.1, 0.1, 0.02), paint, { parent: root, at: [0, 0.14 + H, s * (W / 2)] });
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16).rotateX(Math.PI / 2), steel, { parent: root, at: [L / 2 + 0.05, 0.25, 0] });
    for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 20).rotateX(Math.PI / 2), steel, { parent: root, at: [-L / 2 + 0.15, 0.12, s * 0.5] });
    const tex = textTexture('CITY WASTE · 555-0199', { w: 512, h: 64, bg: o.color ?? v.color, fg: '#ffffff', font: 'bold 40px Arial', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(2.4, 0.3), new THREE.MeshStandardMaterial({ map: tex }), { parent: root, at: [0, 0.9, W / 2 + 0.002] });
    emblem(root, 0.14, [-L / 2 + 0.2 + 5 * ((L - 0.4) / 6), 0.9, W / 2 + 0.05]);
    topY = 0.14 + H;
    inner = [L - 0.3, W - 0.3];
  } else {
    // builder's skip: trapezoid steel box with lifting lugs and chains
    const L = 3.6;
    const W = 1.8;
    const H = 1.2;
    const b = (L - 0.8) / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-b, 0); shape.lineTo(b, 0); shape.lineTo(L / 2, H); shape.lineTo(-L / 2, H); shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-b + 0.08, 0.08); hole.lineTo(b - 0.08, 0.08); hole.lineTo(L / 2 - 0.08, H - 0.02); hole.lineTo(-L / 2 + 0.08, H - 0.02); hole.closePath();
    for (const s of [1, -1]) {
      const side = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
      mesh(side, paint, { parent: root, at: [0, 0, s * (W / 2) - (s > 0 ? 0.05 : 0)] });
    }
    mesh(roundedBox(2 * b, 0.06, W, 0.02), paint, { parent: root, at: [0, 0.03, 0] });
    for (const s of [1, -1]) {
      const end = mesh(roundedBox(0.06, Math.hypot(H, 0.4) + 0.02, W, 0.02), paint, { parent: root, at: [s * (b + 0.2), H / 2, 0] });
      end.rotation.z = -s * Math.atan2(0.4, H);
    }
    for (const s of [1, -1]) for (const x of [-0.8, 0.8]) mesh(roundedBox(0.12, 0.1, 0.1, 0.02), steel, { parent: root, at: [x, H * 0.6, s * (W / 2 + 0.05)] });
    mesh(roundedBox(L + 0.06, 0.08, 0.08, 0.02), paint, { parent: root, at: [0, H, W / 2 - 0.02] });
    mesh(roundedBox(L + 0.06, 0.08, 0.08, 0.02), paint, { parent: root, at: [0, H, -W / 2 + 0.02] });
    const tex = textTexture('SKIP HIRE', { w: 256, h: 64, bg: o.color ?? v.color, fg: '#111', font: 'bold 44px Arial', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(1.0, 0.25), new THREE.MeshStandardMaterial({ map: tex }), { parent: root, at: [0, 0.75, W / 2 + 0.012] });
    // reflective corner markers
    for (const s of [1, -1]) mesh(roundedBox(0.04, 0.3, 0.012, 0.005), new THREE.MeshStandardMaterial({ color: '#d32f2f', emissive: '#d32f2f', emissiveIntensity: 0.2 }), { parent: root, at: [s * (L / 2 - 0.12), H - 0.2, W / 2 + 0.012] });
    topY = H;
    inner = [2 * b, W - 0.2];
  }
  if (style === 'full') {
    // rubble, planks and bags heaped above the rim
    const rand = rng(o.seed ?? 6);
    const n = Math.round(inner[0] * inner[1] * 18);
    const rubble = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.12, 0), new THREE.MeshStandardMaterial({ color: '#8a8580', roughness: 1, flatShading: true, name: 'rubble' }), n);
    rubble.name = 'rubble';
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    const fillTop = variant === 'roll-off' ? topY - 0.2 : topY - 0.15;
    for (let i = 0; i < n; i++) {
      const x = (rand() - 0.5) * inner[0];
      const z = (rand() - 0.5) * inner[1];
      const hump = (1 - (2 * x / inner[0]) ** 2) * (1 - (2 * z / inner[1]) ** 2);
      q.setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3));
      m4.compose(new THREE.Vector3(x, fillTop - 0.3 + hump * 0.5 + rand() * 0.1, z), q, new THREE.Vector3().setScalar(0.6 + rand() * 0.9));
      rubble.setMatrixAt(i, m4);
      rubble.setColorAt(i, c.set(rand.pick(['#8a8580', '#9a5a3a', '#6e6a66', '#b8b0a4'])));
    }
    root.add(rubble);
    // bed of debris under the heap so nothing floats
    mesh(roundedBox(inner[0], fillTop - 0.35, inner[1], 0.02), new THREE.MeshStandardMaterial({ color: '#6e6a66', roughness: 1 }), { parent: root, at: [0, 0.06 + (fillTop - 0.35) / 2, 0] });
    for (let i = 0; i < 6; i++) {
      const p = mesh(roundedBox(1.4 + rand(), 0.03, 0.12, 0.008), timber('#a07a50'), { parent: root, at: [(rand() - 0.5) * inner[0] * 0.6, fillTop + 0.1 + rand() * 0.15, (rand() - 0.5) * inner[1] * 0.6] });
      p.rotation.set((rand() - 0.5) * 0.6, rand() * 3, (rand() - 0.5) * 0.4);
    }
  }
  return finish(root, { type: 'dumpster', variant, o, animations, lean: false });
}

/* ----------------------------- Porta-potty ----------------------------- */

export const PORTA_POTTY_VARIANTS = {
  standard: { color: '#1565c0' },
  accessible: { color: '#2e7d32' },
  luxury: { color: '#e8e8e4' },
};

export function createPortaPotty(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(PORTA_POTTY_VARIANTS, o.variant, 'porta-potty');
  const v = PORTA_POTTY_VARIANTS[variant];
  const root = group(`porta-potty-${variant}`);
  const p = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.5, clearcoat: 0.3, name: 'plastic' });
  const W = variant === 'accessible' ? 1.6 : 1.1;
  const D = variant === 'accessible' ? 1.6 : 1.2;
  const H = variant === 'accessible' ? 2.4 : 2.3;
  mesh(roundedBox(W + 0.06, 0.1, D + 0.06, 0.03), M.plastic('#e8e8e4'), { parent: root, at: [0, 0.05, 0] });
  mesh(roundedBox(W, H - 0.25, D, 0.05), p, { parent: root, at: [0, 0.1 + (H - 0.25) / 2, 0] });
  // vertical ribs on the sides + translucent roof dome
  for (const s of [1, -1]) for (let i = 0; i < 4; i++) mesh(roundedBox(0.03, H - 0.4, 0.06, 0.012), p, { parent: root, at: [s * (W / 2 + 0.01), 0.1 + (H - 0.25) / 2, -D / 2 + 0.2 + i * ((D - 0.4) / 3)] });
  const dome = lathe([[0.001, 0], [Math.min(W, D) * 0.52, 0], [Math.min(W, D) * 0.48, 0.1], [Math.min(W, D) * 0.3, 0.18], [0.001, 0.2]], 4);
  dome.rotateY(Math.PI / 4);
  dome.scale(W / Math.min(W, D) * 1.35, 1, D / Math.min(W, D) * 1.35);
  mesh(dome, new THREE.MeshPhysicalMaterial({ color: '#f2f2ee', roughness: 0.4, transmission: 0, transparent: true, opacity: 0.85, name: 'roof' }), { parent: root, at: [0, H - 0.15, 0] });
  const door = group('door', { parent: root, at: [-W / 2 + 0.08, 0.1, D / 2 + 0.01] });
  mesh(roundedBox(W - 0.16, H - 0.45, 0.04, 0.03), p, { parent: door, at: [(W - 0.16) / 2, (H - 0.45) / 2 + 0.05, 0.02] });
  mesh(roundedBox(0.04, 0.16, 0.04, 0.012), M.plastic('#e8e8e4'), { parent: door, at: [W - 0.3, 1.0, 0.06] });
  // vacant / occupied latch indicator
  const tex = textTexture('VACANT', { w: 128, h: 48, bg: '#2e7d32', fg: '#ffffff', font: 'bold 30px Arial', radius: 6 });
  if (tex) mesh(new THREE.PlaneGeometry(0.1, 0.035), new THREE.MeshStandardMaterial({ map: tex }), { parent: door, at: [W - 0.3, 1.13, 0.042] });
  const logo = textTexture([['SITE', 'bold 56px Arial'], ['LOOS', 'bold 56px Arial']], { w: 256, h: 160, bg: '#ffffff', fg: o.color ?? v.color, radius: 16 });
  if (logo) mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshStandardMaterial({ map: logo }), { parent: door, at: [(W - 0.16) / 2, 1.6, 0.042] });
  if (variant === 'accessible') {
    const sym = textTexture('♿', { w: 128, h: 128, bg: '#1565c0', fg: '#ffffff', font: '100px Arial', radius: 10 });
    if (sym) mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshStandardMaterial({ map: sym }), { parent: door, at: [(W - 0.16) / 2, 1.25, 0.042] });
    mesh(roundedBox(W + 0.3, 0.08, 0.6, 0.02), M.plastic('#9aa0a6'), { parent: root, at: [0, 0.04, D / 2 + 0.3] });
  }
  if (variant === 'luxury') {
    // vent stack + small step + wash-basin tag
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16), M.plastic('#222'), { parent: root, at: [W / 2 - 0.15, H + 0.0, -D / 2 + 0.15] });
    mesh(roundedBox(W - 0.2, 0.12, 0.3, 0.02), M.plastic('#9aa0a6'), { parent: root, at: [0, 0.06, D / 2 + 0.17] });
  } else mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16), M.plastic('#222'), { parent: root, at: [W / 2 - 0.15, H - 0.05, -D / 2 + 0.15] });
  emblem(root, 0.1, [0, H - 0.4, D / 2 + 0.002]);
  return finish(root, { type: 'porta-potty', variant, o, animations: [clip('door', 3, [rotateTrack(door, 'y', 3, (t) => -pingPong(t) * 1.6)])] });
}

/* ------------------------------- Sandbags ------------------------------- */

export const SANDBAGS_VARIANTS = {
  wall: { color: '#b49a6a' },
  pile: { color: '#a8916a' },
  ring: { color: '#9c8a64' },
};

function bagGeo() {
  const g = new THREE.SphereGeometry(1, 16, 10);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    // pillow: flat top/bottom, rounded ends, tied ear on one end
    p.setXYZ(i, x * 0.3 * (1 + (x > 0.9 ? 0.15 : 0)), Math.sign(y) * Math.abs(y) ** 1.6 * 0.07 + 0.07, z * 0.17);
  }
  g.computeVertexNormals();
  return g;
}

export function createSandbags(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SANDBAGS_VARIANTS, o.variant, 'sandbags');
  const v = SANDBAGS_VARIANTS[variant];
  const rand = rng(o.seed ?? 8);
  const root = group(`sandbags-${variant}`);
  const spots = [];
  if (variant === 'wall') {
    for (let row = 0; row < 5; row++) for (let i = 0; i < 6 - (row % 2); i++) spots.push([-1.5 + i * 0.6 + (row % 2) * 0.3, row * 0.13, 0, 0]);
  } else if (variant === 'pile') {
    for (let row = 0; row < 4; row++) for (let i = 0; i < 4 - row; i++) for (let k = 0; k < 2; k++) spots.push([-0.9 + i * 0.6 + row * 0.3, row * 0.13, -0.18 + k * 0.36, (rand() - 0.5) * 0.3]);
  } else {
    for (let row = 0; row < 3; row++) for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + (row % 2) * 0.26;
      spots.push([Math.cos(a) * 1.0, row * 0.13, Math.sin(a) * 1.0, -a + Math.PI / 2]);
    }
  }
  const im = new THREE.InstancedMesh(bagGeo(), new THREE.MeshStandardMaterial({ color: M.toColor(o.color ?? v.color), roughness: 1, name: 'hessian' }), spots.length);
  im.name = 'sandbags';
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const c = new THREE.Color();
  spots.forEach(([x, y, z, ry], i) => {
    q.setFromEuler(new THREE.Euler((rand() - 0.5) * 0.06, ry + (rand() - 0.5) * 0.1, (rand() - 0.5) * 0.06));
    m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1 + rand() * 0.08, 1, 1));
    im.setMatrixAt(i, m4);
    im.setColorAt(i, c.set(o.color ?? v.color).offsetHSL(0, 0, (rand() - 0.5) * 0.08));
  });
  root.add(im);
  return finish(root, { type: 'sandbags', variant, o, animations: [], lean: false });
}

/* ------------------------------ Cable drum ------------------------------ */

export const CABLE_DRUM_VARIANTS = {
  small: { color: '#b08a5a' },
  large: { color: '#a07a50' },
  steel: { color: '#3a6ea5' },
};

export function createCableDrum(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(CABLE_DRUM_VARIANTS, o.variant, 'cable-drum');
  const v = CABLE_DRUM_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`cable-drum-${variant}`);
  const R = variant === 'large' ? 0.9 : 0.5;
  const Wd = variant === 'large' ? 0.9 : 0.5;
  const flange = variant === 'steel' ? mats.powder(o.color ?? v.color) : timber(o.color ?? v.color);
  const cable = new THREE.MeshStandardMaterial({ color: style === 'empty' ? '#7a5a3a' : '#1a1a1a', roughness: 0.6, name: 'cable' });
  const g = group('drum', { parent: root, at: [0, R, 0] });
  if (style === 'on-side') {
    g.position.y = Wd / 2 + 0.04;
    g.rotation.x = Math.PI / 2;
  }
  for (const s of [1, -1]) {
    mesh(new THREE.CylinderGeometry(R, R, 0.06, 40).rotateX(Math.PI / 2), flange, { parent: g, at: [0, 0, s * Wd / 2] });
    if (variant !== 'steel') for (let i = 0; i < 4; i++) {
      const b = mesh(roundedBox(R * 1.7, 0.1, 0.03, 0.01), flange, { parent: g, at: [0, 0, s * (Wd / 2 + 0.04)] });
      b.rotation.z = (i * Math.PI) / 4;
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 6).rotateX(Math.PI / 2), M.metal('#777', 0.4), { parent: g, at: [Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85, s * (Wd / 2 + 0.035)] });
    }
  }
  const coreR = style === 'empty' ? R * 0.35 : R * 0.82;
  mesh(new THREE.CylinderGeometry(coreR, coreR, Wd - 0.06, 40, 1).rotateX(Math.PI / 2), cable, { parent: g });
  if (style !== 'empty') for (let i = 0; i < 6; i++) mesh(new THREE.TorusGeometry(coreR, 0.012, 6, 48), cable, { parent: g, at: [0, 0, -Wd / 2 + 0.08 + i * ((Wd - 0.16) / 5)] });
  mesh(new THREE.CylinderGeometry(0.08, 0.08, Wd + 0.12, 20).rotateX(Math.PI / 2), M.metal('#555', 0.5), { parent: g });
  if (style !== 'on-side') {
    // chocks so it can't roll
    for (const s of [1, -1]) for (const z of [Wd / 2 - 0.03, -Wd / 2 + 0.03]) {
      const ch = mesh(roundedBox(0.2, 0.12, 0.06, 0.01), timber('#8a6a48'), { parent: root, at: [s * Math.sqrt(R * R - (R - 0.06) ** 2) * 1.05, 0.06, z] });
      ch.rotation.z = s * 0.4;
    }
  }
  return finish(root, { type: 'cable-drum', variant, o, animations: [], lean: false });
}

/* ------------------------------ Scaffolding ------------------------------ */

export const SCAFFOLDING_VARIANTS = {
  bay: { color: '#a3a8ad' },
  tower: { color: '#a3a8ad' },
  wrapped: { color: '#a3a8ad' },
};

export function createScaffolding(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SCAFFOLDING_VARIANTS, o.variant, 'scaffolding');
  const style = styleOf(o);
  const root = group(`scaffolding-${variant}`);
  const steel = mats.galv();
  const board = timber('#c8a173');
  const tower = variant === 'tower';
  const L = tower ? 1.8 : 2.5;
  const D = tower ? 1.2 : 1.1;
  const lifts = tower ? 4 : 3;
  const lift = 2.0;
  const H = lifts * lift;
  const bays = tower ? 1 : 2;
  const xs = Array.from({ length: bays + 1 }, (_, i) => -((bays * L) / 2) + i * L);
  for (const x of xs) for (const z of [-D / 2, D / 2]) {
    mesh(roundedBox(0.15, 0.01, 0.15, 0.003), steel, { parent: root, at: [x, 0.005, z] });
    if (tower) {
      mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16).rotateX(Math.PI / 2), M.rubber(), { parent: root, at: [x, 0.1, z] });
      tube([x, 0.0, z], [x, 0.16, z], 0.02, steel, { parent: root });
      tube([x, 0.16, z], [x, H + 1.0, z], 0.024, steel, { parent: root });
    } else {
      mesh(roundedBox(0.22, 0.04, 0.22, 0.008), board, { parent: root, at: [x, 0.025, z] });
      tube([x, 0.045, z], [x, H + 1.0, z], 0.024, steel, { parent: root });
    }
  }
  for (let l = 1; l <= lifts; l++) {
    const y = l * lift;
    for (const z of [-D / 2, D / 2]) tube([xs[0] - 0.1, y, z], [xs[bays] + 0.1, y, z], 0.024, steel, { parent: root });
    for (const x of xs) tube([x, y, -D / 2 - 0.1], [x, y, D / 2 + 0.1], 0.024, steel, { parent: root });
    // boards + toe boards + guard rails
    for (let b = 0; b < bays; b++) {
      const cx = xs[b] + L / 2;
      for (let k = 0; k < 4; k++) mesh(roundedBox(L - 0.05, 0.04, 0.22, 0.006), board, { parent: root, at: [cx, y + 0.045, -D / 2 + 0.16 + k * 0.25] });
      mesh(roundedBox(L - 0.05, 0.15, 0.03, 0.006), board, { parent: root, at: [cx, y + 0.14, D / 2 - 0.04] });
    }
    for (const yy of [y + 0.5, y + 1.0]) tube([xs[0] - 0.1, yy, D / 2], [xs[bays] + 0.1, yy, D / 2], 0.022, steel, { parent: root });
    // diagonal brace on the face
    tube([xs[0], y - lift + 0.1, D / 2], [xs[1], y - 0.1, D / 2], 0.02, steel, { parent: root });
  }
  // ladder up the end bay
  const lx = xs[0] + 0.4;
  for (const dz of [-0.2, 0.2]) tube([lx, 0.05, dz], [lx, lift + 1.0, dz], 0.02, M.metal('#c9cdd0', 0.3), { parent: root });
  for (let i = 1; i < 10; i++) tube([lx, i * 0.28, -0.2], [lx, i * 0.28, 0.2], 0.014, M.metal('#c9cdd0', 0.3), { parent: root });
  if (variant === 'wrapped' || style === 'netting') {
    const net = new THREE.MeshStandardMaterial({ color: variant === 'wrapped' ? '#e8e8e4' : '#2e7d32', transparent: true, opacity: variant === 'wrapped' ? 0.92 : 0.55, side: THREE.DoubleSide, roughness: 0.9, name: 'sheeting' });
    const w = bays * L + 0.2;
    mesh(new THREE.PlaneGeometry(w, H + 0.8), net, { parent: root, at: [0, (H + 0.8) / 2 + 0.2, D / 2 + 0.03] });
    if (variant === 'wrapped') {
      const tex = textTexture([['COMING SOON', 'bold 80px Helvetica, Arial'], ['Riverside Lofts', '56px Helvetica, Arial']], { w: 512, h: 300, bg: '#1b3a5a', fg: '#ffffff', radius: 0 });
      if (tex) mesh(new THREE.PlaneGeometry(w * 0.8, w * 0.47), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), { parent: root, at: [0, H * 0.6, D / 2 + 0.035] });
    }
  }
  return finish(root, { type: 'scaffolding', variant, o, animations: [], lean: false });
}
