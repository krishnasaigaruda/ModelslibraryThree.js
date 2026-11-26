import * as THREE from 'three';
import { group, finalize, normalizeOptions, pickVariant, curveTube } from '../../core/utils.js';
import * as M from '../../core/materials.js';
import { numberTrack, clip } from '../../core/animation.js';
import {
  Builder, palette, surface, block, roundedBox, facades, spread, windowUnit, door, gableRoof, flatRoof,
  acUnit, awning, signBoard, chimney, emblem,
} from './kit.js';
import { buildingAnimations } from './houses.js';

export const SHOP_VARIANTS = {
  cafe: { wall: '#9c4a36', wallKind: 'brick', roof: '#777', roofKind: 'concrete', trim: '#efe9dd', accent: '#1f2a24', awning: '#b3261e', sign: 'CAFÉ' },
  grocery: { wall: '#e9e4da', wallKind: 'stucco', roof: '#777', roofKind: 'concrete', trim: '#3b6e3a', accent: '#2b2d30', sign: 'FRESH MARKET' },
  bakery: { wall: '#efe2c6', wallKind: 'stucco', roof: '#8a3f2c', roofKind: 'tile', trim: '#ffffff', accent: '#2c4f7c', awning: '#2c4f7c', sign: 'BAKERY', door: '#2c4f7c' },
  'gas-station': { wall: '#f1f1ef', wallKind: 'stucco', roof: '#777', roofKind: 'concrete', trim: '#c62828', accent: '#2b2d30', sign: 'FUEL' },
  pharmacy: { wall: '#f5f5f2', wallKind: 'stucco', roof: '#777', roofKind: 'concrete', trim: '#2e7d32', accent: '#2b2d30', sign: 'PHARMACY' },
  restaurant: { wall: '#7c3b2c', wallKind: 'brick', roof: '#3a3d42', roofKind: 'shingle', trim: '#f2ead8', accent: '#1f3d2b', awning: '#1f5a38', sign: 'RESTAURANT', door: '#1f3d2b' },
};

/** Big storefront window bay with mullions and a kick plate. Frame: facade plane. */
function storefront(B, x, w, h, frameMat, y = 0.15) {
  B.box(B.mats.accent, w + 0.2, 0.55, 0.12, x, y + 0.27, 0.06);
  windowUnit(B, x, y + 0.6, w, h, { style: 'tall', frame: frameMat, sill: false, depth: 0.1 });
}

function bistroSet(B, x, z) {
  const metal = B.mats.accent;
  B.add(metal, new THREE.LatheGeometry([[0.25, 0], [0.25, 0.02], [0.03, 0.05], [0.025, 0.7], [0.3, 0.72], [0.3, 0.75]].map(([r, y]) => new THREE.Vector2(r, y)), 20), new THREE.Matrix4().makeTranslation(x, 0, z));
  for (const s of [-1, 1]) {
    const cx = x + s * 0.55;
    B.add(metal, roundedBox(0.4, 0.04, 0.4, 0.015, 1), new THREE.Matrix4().makeTranslation(cx, 0.46, z));
    for (const [lx, lz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) B.add(metal, new THREE.CylinderGeometry(0.012, 0.012, 0.46, 6), new THREE.Matrix4().makeTranslation(cx + lx, 0.23, z + lz));
    B.add(metal, roundedBox(0.04, 0.45, 0.38, 0.015, 1), new THREE.Matrix4().makeTranslation(cx + s * 0.19, 0.7, z));
  }
}

const SHOPS = {
  cafe(B, o, d, m) {
    const w = 8;
    const dp = 10;
    const h = 4.4;
    block(B, w, h, dp, { plinth: 0.15 });
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        storefront(B, -1.2, 4.6, 2.4, m.accent);
        door(B, 2.6, 0.15, 1.1, 2.4, { glass: true, frame: m.accent });
        awning(B, 0, 3.55, w - 0.4, 1.6, o.accentColor ?? d.awning);
        signBoard(B, 0, 3.95, 0.02, 3.4, 0.55, d.sign, { bg: '#1f2a24', fg: '#f3e6c8' });
      } else if (side !== 'back') {
        for (const x of spread(width, 3, 1.6)) windowUnit(B, x, 1.0, 1.1, 1.8, { style: 'double', header: m.trim });
      }
    });
    flatRoof(B, w, dp, h, { parapet: 0.8, mat: B.mats.wall });
    B.box(m.trim, w + 0.3, 0.3, 0.35, 0, h + 0.65, dp / 2 + 0.05);
    for (const x of [-2.2, 1.0]) bistroSet(B, x, dp / 2 + 2.2);
    acUnit(B, 1.5, h + 0.06, -2, 0);
  },

  grocery(B, o, d, m) {
    const w = 24;
    const dp = 18;
    const h = 6;
    block(B, w, h, dp, { plinth: 0.2 });
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        for (const x of [-7.5, 7.5]) storefront(B, x, 6.5, 3.2, m.accent, 0.2);
        door(B, 0, 0.2, 3.2, 2.8, { double: true, glass: true, frame: m.accent });
        B.slab(m.trim, 0, 3.9, 3, 3.8, 9, 0.22);
        for (const s of [-1, 1]) B.box(m.accent, 0.25, 3.7, 0.25, s * 4.2, 1.95, 2.85);
        B.box(m.trim, w + 0.1, 1.6, 0.25, 0, h + 0.2, 0.12);
        signBoard(B, 0, h + 0.2, 0.26, 9, 1.1, d.sign, { bg: '#3b6e3a', fg: '#ffffff' });
      } else if (side === 'right') {
        door(B, 4, 0.2, 1.0, 2.2, { frame: m.accent });
      }
    });
    flatRoof(B, w, dp, h, { parapet: 1.0, mat: B.mats.wall, cap: m.trim });
    for (let k = 0; k < 4; k++) acUnit(B, -8 + k * 5, h + 0.06, -3, 0);
  },

  bakery(B, o, d, m) {
    const w = 8;
    const dp = 9;
    const h = 7;
    block(B, w, h, dp, { plinth: 0.15 });
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        storefront(B, -1.3, 4.2, 2.2, m.accent);
        door(B, 2.5, 0.15, 1.1, 2.4, { glass: true, frame: m.accent });
        awning(B, 0, 3.4, w - 0.3, 1.5, o.accentColor ?? d.awning);
        signBoard(B, 0, 3.8, 0.02, 3.2, 0.5, d.sign, { bg: '#2c4f7c', fg: '#fff8e1' });
        for (const x of [-2.2, 0, 2.2]) windowUnit(B, x, 4.6, 1.0, 1.5, { style: 'double', shutters: m.accent });
      } else if (side !== 'back') {
        for (const x of spread(width, 2, 2)) windowUnit(B, x, 4.6, 1.0, 1.5, { style: 'double' });
      } else for (const x of spread(width, 3, 1.4)) windowUnit(B, x, 4.6, 1.0, 1.5, { style: 'double' });
    });
    gableRoof(B, w, dp, h, { pitch: 0.65, overhang: 0.3 });
    chimney(B, -2.5, -1.5, h, 3.4, {});
  },

  'gas-station'(B, o, d, m) {
    // canopy over two pump islands
    const cw = 16;
    const cd = 10;
    const ch = 5.2;
    const cz = 4;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(m.trim, 0.45, ch, 0.45, sx * (cw / 2 - 2), ch / 2, cz + sz * (cd / 2 - 2), 0, 0.06);
    B.box(m.trim, cw, 1.0, cd, 0, ch + 0.5, cz, 0, 0.08);
    B.local(0, 0, cz + cd / 2, 0, () => emblem(B, -cw / 2 + 1.2, ch + 0.5, 0, 0.8));
    for (const s of [-1, 1]) B.local(s * cw / 2, 0, cz, s * Math.PI / 2, () => emblem(B, 0, ch + 0.5, 0, 0.8));
    B.box(B.mats.wall, cw - 0.4, 0.06, cd - 0.4, 0, ch - 0.03, cz);
    const lightMat = M.emissive('#ffffff', 1.4);
    for (let i = -2; i <= 2; i++) for (const s of [-1, 1]) B.box(lightMat, 0.9, 0.04, 0.4, i * 3, ch - 0.07, cz + s * 2.5, 0, 0.01);
    for (const sz of [-1, 1]) {
      const z = cz + sz * (cd / 2 - 2);
      B.box(B.mats.concrete, 7, 0.2, 1.4, 0, 0.1, z);
      for (const x of [-2, 2]) {
        B.box(m.trim, 1.0, 1.9, 0.6, x, 1.15, z, 0, 0.08);
        B.box(B.mats.wall, 0.9, 0.5, 0.62, x, 1.75, z, 0, 0.04);
        B.box(B.mats.dark, 0.5, 0.25, 0.64, x, 1.75, z, 0, 0.01);
        B.add(B.mats.dark, curveTube([[x + 0.5, 1.6, z], [x + 0.75, 1.0, z], [x + 0.62, 0.55, z + 0.05], [x + 0.52, 1.1, z]], 0.025, B.mats.dark).geometry);
      }
    }
    B.box(B.mats.concrete, cw + 6, 0.05, cd + 8, 0, 0.025, cz + 1);
    // shop building behind
    const w = 11;
    const dp = 8;
    const h = 4.2;
    B.local(0, 0, -6, 0, () => {
      block(B, w, h, dp, { plinth: 0.15 });
      facades(B, w, dp, (side) => {
        if (side === 'front') {
          storefront(B, -2.5, 4.5, 2.2, m.accent);
          door(B, 2.6, 0.15, 1.6, 2.3, { double: true, glass: true, frame: m.accent });
          B.box(m.trim, w + 0.2, 0.9, 0.25, 0, h - 0.3, 0.13);
          signBoard(B, 0, h - 0.3, 0.27, 4, 0.6, 'MART', { bg: d.trim, fg: '#ffffff' });
        }
      });
      flatRoof(B, w, dp, h, { parapet: 0.6, mat: B.mats.wall, cap: m.trim });
    });
    // price pylon
    B.box(m.accent, 0.5, 6, 0.5, cw / 2 + 3, 3, cz + cd / 2 + 1, 0, 0.06);
    B.local(cw / 2 + 3, 0, cz + cd / 2 + 1.27, 0, () => {
      B.box(m.trim, 2.3, 0.9, 0.08, 0, 6.6, -0.03);
      emblem(B, 0, 6.6, 0.01, 0.8);
      signBoard(B, 0, 5.6, 0, 2.2, 0.9, '3.49', { bg: '#111', fg: '#ffb300', emissive: 1, logo: false });
    });
  },

  pharmacy(B, o, d, m) {
    const w = 12;
    const dp = 12;
    const h = 4.6;
    block(B, w, h, dp, { plinth: 0.15 });
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        storefront(B, -3, 5, 2.5, m.accent);
        storefront(B, 3.8, 1.6, 2.5, m.accent);
        door(B, 1.4, 0.15, 1.8, 2.5, { double: true, glass: true, frame: m.accent });
        B.box(d.trim ? m.trim : m.accent, w + 0.1, 0.8, 0.2, 0, h - 0.1, 0.1);
        signBoard(B, -1, h - 0.1, 0.21, 5, 0.6, d.sign, { bg: '#2e7d32', fg: '#ffffff' });
      } else if (side === 'left' || side === 'right') {
        for (const x of spread(width, 3, 2)) windowUnit(B, x, 1.0, 1.4, 1.6, { style: 'none', frame: m.accent });
      }
    });
    flatRoof(B, w, dp, h, { parapet: 0.7, mat: B.mats.wall, cap: m.trim });
    // glowing green cross on a bracket at the corner
    const cross = new THREE.MeshStandardMaterial({ name: 'cross_glow', color: '#2e7d32', emissive: '#3ddc57', emissiveIntensity: 1.2 });
    B.local(w / 2 - 1.2, 0, dp / 2 + 0.06, 0, () => {
      B.box(cross, 1.0, 0.32, 0.12, 0, h - 1.5, 0);
      B.box(cross, 0.32, 1.0, 0.12, 0, h - 1.5, 0);
    });
    acUnit(B, 2, h + 0.06, -2, 0);
  },

  restaurant(B, o, d, m) {
    const w = 14;
    const dp = 12;
    const h = 4.6;
    block(B, w, h, dp, { plinth: 0.3 });
    facades(B, w, dp, (side, width) => {
      if (side === 'front') {
        door(B, 0, 0.3, 1.8, 2.5, { double: true, frame: m.trim });
        for (const x of [-4.6, -2.4, 2.4, 4.6]) windowUnit(B, x, 1.0, 1.3, 2.0, { style: 'arch', frame: m.trim, sill: true });
        awning(B, 0, 3.25, 3.0, 1.2, o.accentColor ?? d.awning);
        signBoard(B, 0, 3.75, 0.04, 3.6, 0.55, d.sign, { bg: '#1f3d2b', fg: '#f6e7c1' });
        for (const x of [-4.4, 4.4]) B.box(m.trim, 1.6, 0.5, 0.5, x, 0.55, 0.3);
      } else for (const x of spread(width, side === 'back' ? 3 : 4, 1.6)) windowUnit(B, x, 1.0, 1.2, 1.8, { style: 'arch', frame: m.trim });
    });
    gableRoof(B, w, dp, h, { pitch: 0.55, overhang: 0.4 });
    chimney(B, 4.2, -1.8, h, 3.4, {});
  },
};

export function createShop(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SHOP_VARIANTS, o.variant, 'shop');
  const d = SHOP_VARIANTS[variant];
  const root = group(`shop-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  SHOPS[variant](B, o, d, m);
  B.finish();
  const animations = buildingAnimations(root, B);
  if (root.getObjectByName('cross_glow')) {
    animations.push(clip('sign', 2, [numberTrack('cross_glow.material.emissiveIntensity', 2, (t) => (t < 0.5 ? 1.6 : 0.2), 2, THREE.InterpolateDiscrete)]));
  }
  finalize(root, { type: 'shop', variant, options: o, animations });
  root.userData.premade.oneShot = ['doorOpen'];
  return root;
}
