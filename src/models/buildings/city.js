import * as THREE from 'three';
import * as M from '../../core/materials.js';
import {
  FH, floorsOf, makeBuilding, gridBody, storefront, portico, flagpole, rooftop, bladeSign, clockTower,
  surface, block, facades, spread, windowUnit, door, flatRoof, gableRoof, signBoard, railingRun, emblem,
} from './parts.js';

/*
 * Commercial buildings: hotels, offices, banks, police stations, restaurants,
 * supermarkets, malls and gas stations.
 */

/* ------------------------------ Hotel ------------------------------ */
export const HOTEL_VARIANTS = {
  highrise: { wall: '#d8d2c6', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#3a3f45', accent: '#7a1f2b', door: '#2a2d30' },
  motel: { wall: '#efe4cf', wallKind: 'stucco', roof: '#7a3b2e', roofKind: 'tile', trim: '#2f5d7c', accent: '#2f5d7c', door: '#2f5d7c' },
  resort: { wall: '#f4efe6', wallKind: 'stucco', roof: '#b5562f', roofKind: 'tile', trim: '#ffffff', accent: '#3b7a8c', door: '#6b4226' },
  boutique: { wall: '#8e4636', wallKind: 'brick', roof: '#3a3d42', roofKind: 'seam', trim: '#efe7d8', accent: '#1f2f3f', door: '#1f2f3f' },
};

export const createHotel = makeBuilding('hotel', HOTEL_VARIANTS, (B, o, d, m, v) => {
  if (v === 'motel') {
    // two-storey L with exterior walkway, numbered doors, office and pole sign
    const w = 26;
    const dp = 8;
    const floors = floorsOf(o, 2);
    const fh = 3.0;
    const h = 0.3 + floors * fh;
    block(B, w, h, dp, { plinth: 0.3 });
    facades(B, w, dp, (side, width) => {
      if (side !== 'front') {
        for (let f = 0; f < floors; f++) for (const x of spread(width, Math.round(width / 3.2), 1.2)) windowUnit(B, x, 0.3 + f * fh + 1.1, 0.9, 0.9, { style: 'none' });
        return;
      }
      const n = 7;
      for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) {
        const x = -width / 2 + 1.8 + (i * (width - 3.6)) / (n - 1);
        door(B, x - 0.6, 0.3 + f * fh, 0.9, 2.1, { mat: m.accent });
        windowUnit(B, x + 0.8, 0.3 + f * fh + 1.0, 1.2, 1.0, { style: 'double' });
      }
      // walkway slab, posts and railing on the upper floors
      for (let f = 1; f < floors; f++) {
        const y = 0.3 + f * fh;
        B.box(B.mats.concrete, width, 0.22, 1.8, 0, y - 0.11, 0.9, 0, 0.03);
        railingRun(B, -width / 2 + 0.1, width / 2 - 0.1, 1.72, y, m.trim, { spacing: 0.14 });
      }
      for (const x of spread(width, 8, 0.2)) B.box(m.trim, 0.16, h - 0.3, 0.16, x, 0.3 + (h - 0.3) / 2, 1.72, 0, 0.03);
      // stairs at the end
      for (let k = 0; k < 14; k++) B.box(B.mats.concrete, 1.1, 0.2, 0.28, width / 2 + 0.7, 0.1 + k * 0.2, 1.8 - k * 0.12 - 0.1, 0, 0.01);
      B.box(B.mats.concrete, 1.1, 2.9, 0.2, width / 2 + 0.7, 1.45, 0.2, 0, 0.02);
    });
    gableRoof(B, w, dp + 1.8, h, { pitch: 0.35, overhang: 0.3, cz: 0.9 });
    // office + pole sign
    block(B, 6, 3.6, 6, { cx: -w / 2 - 3, cz: 1, plinth: 0.3 });
    B.local(-w / 2 - 3, 0, 4, 0, () => storefront(B, m, 5.6, 0.3, 3.3, { fascia: false }));
    flatRoof(B, 6, 6, 3.6, { parapet: 0.6, cx: -w / 2 - 3, cz: 1 });
    B.box(B.mats.metal, 0.4, 8, 0.4, -w / 2 - 6, 4, 7, 0, 0.05);
    B.local(-w / 2 - 6, 0, 7, 0, () => signBoard(B, 0, 8.6, 0.21, 4.4, 1.4, 'MOTEL', { bg: '#7a1f2b', fg: '#ffe9b0', emissive: 1 }));
    B.local(-w / 2 - 6, 0, 7, Math.PI, () => signBoard(B, 0, 8.6, 0.21, 4.4, 1.4, 'MOTEL', { bg: '#7a1f2b', fg: '#ffe9b0', emissive: 1 }));
    B.box(B.mats.dark, 4.6, 1.6, 0.3, -w / 2 - 6, 8.6, 7, 0, 0.05);
    return;
  }
  if (v === 'resort') {
    const floors = floorsOf(o, 5);
    const w = 36;
    const dp = 14;
    const top = gridBody(B, m, { w, d: dp, floors, fh: 3.1, spacing: 3.6, winW: 2, winH: 2.1, style: 'tall', doorGap: 4 });
    // balconies on every bay of the front and back
    facades(B, w, dp, (side, width) => {
      if (side === 'left' || side === 'right') return;
      for (let f = 1; f < floors; f++) for (const x of spread(width, Math.round((width - 1.5) / 3.6), Math.min(1.8, width / 11))) {
        const y = 0.45 + 3.1 + (f - 1) * 3.1;
        B.box(m.trim, 3.0, 0.18, 1.4, x, y - 0.09, 0.7, 0, 0.03);
        railingRun(B, x - 1.45, x + 1.45, 1.35, y, m.trim, { glassPanel: true, height: 1.0 });
      }
      if (side === 'front') {
        door(B, 0, 0.45, 3, 2.7, { double: true, glass: true });
        B.slab(m.accent, 0, 4.2, 4.5, 4.0, 9, 0.2);
        for (const s of [-1, 1]) B.box(m.trim, 0.3, 3.9, 0.3, s * 4, 0.45 + 1.8, 4.2, 0, 0.05);
      }
    }, {});
    gableRoof(B, w, dp, top, { pitch: 0.4, overhang: 0.8 });
    // pool deck
    B.box(B.mats.concrete, 16, 0.3, 8, 0, 0.15, dp / 2 + 9, 0, 0.05);
    B.box(new THREE.MeshPhysicalMaterial({ name: 'pool', color: '#3fb6d8', roughness: 0.05, transmission: 0, clearcoat: 1 }), 12, 0.04, 5, 0, 0.31, dp / 2 + 9, 0, 0);
    for (let k = 0; k < 6; k++) {
      const x = -6 + k * 2.4;
      B.box(m.trim, 0.7, 0.12, 1.8, x, 0.42, dp / 2 + 5.6, 0, 0.03);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(m.trim, 0.06, 0.12, 0.06, x + sx * 0.3, 0.32 + 0.06, dp / 2 + 5.6 + sz * 0.8, 0, 0);
    }
    return;
  }
  const floors = floorsOf(o, v === 'boutique' ? 5 : 14);
  const w = v === 'boutique' ? 14 : 22;
  const dp = v === 'boutique' ? 12 : 16;
  const groundH = 4.6;
  const top = gridBody(B, m, {
    w, d: dp, floors, fh: 3.1, groundH, spacing: v === 'boutique' ? 2.6 : 2.4, winW: v === 'boutique' ? 1.2 : 1.6, winH: 1.9,
    style: v === 'boutique' ? 'tall' : 'none', header: v === 'boutique' ? m.trim : null,
    groundFront: (width, base) => {
      storefront(B, m, width - 2, base, groundH, { frame: B.mats.dark, doorW: 2.6, fascia: false });
      B.slab(m.accent, 0, base + groundH - 0.2, 3.2, base + groundH - 0.4, 6.5, 0.22);
      for (const s of [-1, 1]) B.cyl(B.mats.metal, 0.06, 0.06, groundH - 0.6, s * 3, base + (groundH - 0.6) / 2, 3.0, 8);
    },
  });
  B.local(0, 0, dp / 2, 0, () => bladeSign(B, w / 2 - 1.2, 6, 5, 'HOTEL', { w: 2.2 }));
  flatRoof(B, w, dp, top, { parapet: 1.0, mat: B.mats.wall, cap: m.trim });
  if (v === 'boutique') B.box(m.trim, w + 0.5, 0.5, dp + 0.5, 0, top - 0.2, 0, 0, 0.06);
  rooftop(B, w, dp, top, { ac: 3, tank: v === 'boutique', mast: v === 'highrise' });
  if (v === 'highrise') {
    // roof sign
    B.box(B.mats.metal, 0.2, 1.4, 0.2, -3.5, top + 0.76, 0, 0, 0.02);
    B.box(B.mats.metal, 0.2, 1.4, 0.2, 3.5, top + 0.76, 0, 0, 0.02);
    signBoard(B, 0, top + 2.4, 0, 9, 1.8, 'GRAND HOTEL', { bg: '#1b1e22', fg: '#ffd27a', emissive: 1, logo: true });
  }
});

/* ------------------------------ Office ------------------------------ */
export const OFFICE_VARIANTS = {
  lowrise: { wall: '#c7c3bb', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#2c3238', accent: '#4d6a80', door: '#2a2d30' },
  midrise: { wall: '#9aa4ab', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#252a2f', accent: '#3e5a70', door: '#2a2d30' },
  campus: { wall: '#e8e5df', wallKind: 'stucco', roof: '#666', roofKind: 'concrete', trim: '#3a3d42', accent: '#6b4a32', door: '#2a2d30' },
};

export const createOffice = makeBuilding('office', OFFICE_VARIANTS, (B, o, d, m, v) => {
  const floors = floorsOf(o, { lowrise: 3, midrise: 9, campus: 2 }[v]);
  const w = { lowrise: 24, midrise: 26, campus: 40 }[v];
  const dp = { lowrise: 16, midrise: 20, campus: 18 }[v];
  const fh = 3.7;
  const glass = new THREE.MeshPhysicalMaterial({ name: 'band_glass', color: m.accent.color.clone(), metalness: 0.6, roughness: 0.08, clearcoat: 1 });
  const g = 0.3;
  const h = g + floors * fh;
  block(B, w, h, dp, { plinth: g });
  facades(B, w, dp, (side, width) => {
    // ribbon windows between spandrel bands, with vertical fins
    for (let f = 0; f < floors; f++) {
      const y = g + f * fh;
      if (f === 0 && side === 'front') continue;
      B.add(B.mats.glow, new THREE.PlaneGeometry(width - 1, 2.1), new THREE.Matrix4().makeTranslation(0, y + 0.9 + 1.05, 0.005));
      B.add(glass, new THREE.PlaneGeometry(width - 1, 2.1), new THREE.Matrix4().makeTranslation(0, y + 0.9 + 1.05, 0.05));
      B.box(m.trim, width - 0.9, 0.12, 0.14, 0, y + 0.86, 0.07, 0, 0.02);
      B.box(m.trim, width - 0.9, 0.12, 0.14, 0, y + 3.04, 0.07, 0, 0.02);
      B.openings.push(B.worldRect(-width / 2 + 0.5, y + 0.8, width / 2 - 0.5, y + 3.1));
    }
    for (const x of spread(width, Math.round(width / 1.6), 0.5)) B.box(m.trim, 0.08, h - g - (side === 'front' ? fh : 0), 0.3, x, g + (side === 'front' ? fh : 0) + (h - g - (side === 'front' ? fh : 0)) / 2, 0.15, 0, 0.02);
    if (side === 'front') {
      storefront(B, m, width - 2, g, fh, { frame: m.trim, doorW: 3, fascia: false });
      B.slab(m.trim, 0, g + fh + 0.1, 3.5, g + fh, 10, 0.3);
      signBoard(B, 0, g + fh + 0.75, 0.16, 7, 0.7, v === 'campus' ? 'TECH CAMPUS' : 'OFFICES', { bg: '#1d2227', fg: '#ffffff' });
    }
  });
  flatRoof(B, w, dp, h, { parapet: 0.9, mat: B.mats.wall, cap: m.trim });
  rooftop(B, w, dp, h, { ac: v === 'midrise' ? 4 : 3, mast: v === 'midrise' });
  if (v === 'campus') {
    // glass atrium + plaza with trees and benches
    B.box(glass, 10, h + 2, 8, 0, (h + 2) / 2, -dp / 2 - 3.6, 0, 0.05);
    for (let k = 0; k <= 4; k++) B.box(m.trim, 0.15, h + 2, 8.1, -5 + k * 2.5, (h + 2) / 2, -dp / 2 - 3.6, 0, 0.02);
    for (const x of [-14, -7, 7, 14]) {
      B.box(B.mats.concrete, 1.8, 0.5, 1.8, x, 0.25, dp / 2 + 5, 0, 0.08);
      B.cyl(surface('plank', '#6b4a2c', { name: 'bark' }), 0.12, 0.16, 2.4, x, 0.5 + 1.2, dp / 2 + 5, 8);
      B.add(new THREE.MeshStandardMaterial({ name: 'leaves', color: '#4f7a3a', roughness: 0.9, flatShading: true }), new THREE.IcosahedronGeometry(1.4, 1), new THREE.Matrix4().makeTranslation(x, 3.9, dp / 2 + 5));
    }
    B.box(B.mats.concrete, w, 0.08, 9, 0, 0.04, dp / 2 + 4.5, 0, 0.02);
    flagpole(B, -w / 2 + 2, 0.08, dp / 2 + 7, { color: '#2c4f7c' });
  }
});

/* ------------------------------ Bank ------------------------------- */
export const BANK_VARIANTS = {
  classic: { wall: '#d9d0bd', wallKind: 'stone', roof: '#5a6068', roofKind: 'seam', trim: '#efe9dc', accent: '#1f2f3f', door: '#3a2a1e', plinthKind: 'stone', plinth: '#a69e90' },
  modern: { wall: '#2b2f34', wallKind: 'concrete', roof: '#555', roofKind: 'concrete', trim: '#c9a54a', accent: '#1d2227', door: '#2a2d30' },
};

export const createBank = makeBuilding('bank', BANK_VARIANTS, (B, o, d, m, v) => {
  const floors = floorsOf(o, 2);
  if (v === 'classic') {
    const w = 20;
    const dp = 18;
    const g = 1.2;
    const fh = 4.4;
    const h = g + floors * fh;
    block(B, w, h, dp, { plinth: g });
    facades(B, w, dp, (side, width) => {
      for (let f = 0; f < floors; f++) for (const x of spread(width, Math.round(width / 3.6), 2.2)) {
        if (side === 'front' && Math.abs(x) < 6) continue;
        windowUnit(B, x, g + f * fh + 0.9, 1.4, 2.6, { style: 'grid', header: m.trim });
      }
      if (side === 'front') {
        door(B, 0, g, 2.4, 3.4, { double: true, mat: B.mats.door });
        portico(B, m, { width: 11, depth: 3.2, colH: h - g - 0.8, y0: g, cols: 6, steps: 5 });
        signBoard(B, 0, g + 4.2, 0.06, 4, 0.6, 'BANK', { bg: '#1f2f3f', fg: '#e8d7a8' });
      }
    });
    B.box(m.trim, w + 0.6, 0.8, dp + 0.6, 0, h + 0.1, 0, 0, 0.06);
    flatRoof(B, w, dp, h + 0.5, { parapet: 0.9, mat: m.trim, cap: m.trim });
    rooftop(B, w, dp, h + 0.5, { ac: 2 });
    return;
  }
  const w = 18;
  const dp = 16;
  const top = gridBody(B, m, {
    w, d: dp, floors: floors + 1, fh: 3.8, spacing: 2.2, winW: 1.7, winH: 2.6, style: 'none', frame: m.trim,
    groundFront: (width, base) => {
      storefront(B, m, width - 1, base, 3.8, { frame: m.trim, doorW: 2.4, fascia: false });
      B.box(m.trim, width + 0.4, 0.6, 1.6, 0, base + 3.8, 0.8, 0, 0.05);
      signBoard(B, 0, base + 4.5, 0.06, 6, 0.7, 'CITY BANK', { bg: '#1d2227', fg: '#c9a54a' });
    },
  });
  flatRoof(B, w, dp, top, { parapet: 0.8, mat: B.mats.wall, cap: m.trim });
  rooftop(B, w, dp, top, { ac: 2 });
  // ATM pod by the entrance
  B.local(w / 2 - 2.2, 0, dp / 2, 0, () => {
    B.box(B.mats.metal, 0.9, 1.7, 0.4, 0, 0.45 + 0.85, 0.2, 0, 0.05);
    B.add(B.mats.glow, new THREE.PlaneGeometry(0.4, 0.3), new THREE.Matrix4().makeTranslation(0, 1.7, 0.41));
  });
});

/* -------------------------- Police station ------------------------- */
export const POLICE_VARIANTS = {
  standard: { wall: '#9c4a36', wallKind: 'brick', roof: '#666', roofKind: 'concrete', trim: '#e9e3d6', accent: '#1f3a6b', door: '#1f3a6b' },
  modern: { wall: '#e9e8e4', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#1f3a6b', accent: '#1f3a6b', door: '#2a2d30' },
};

export const createPoliceStation = makeBuilding('police-station', POLICE_VARIANTS, (B, o, d, m, v) => {
  const floors = floorsOf(o, v === 'modern' ? 3 : 2);
  const w = 22;
  const dp = 14;
  const top = gridBody(B, m, {
    w, d: dp, floors, fh: 3.5, spacing: 3, winW: 1.5, winH: 1.8, style: v === 'modern' ? 'none' : 'double', header: v === 'modern' ? null : m.trim, doorGap: 3,
  });
  B.local(0, 0, dp / 2, 0, () => {
    door(B, 0, 0.45, 2.2, 2.6, { double: true, glass: true, frame: m.accent, steps: 2 });
    B.slab(m.accent, 0, 3.5, 2.4, 3.4, 5.5, 0.22);
    signBoard(B, 0, 4.0, 0.16, 5, 0.75, 'POLICE', { bg: '#1f3a6b', fg: '#ffffff', emissive: 0.9 });
    // blue lamps on posts either side of the steps
    for (const s of [-1, 1]) {
      B.box(B.mats.dark, 0.18, 2.4, 0.18, s * 2.1, 1.2, 2.2, 0, 0.03);
      B.add(new THREE.MeshStandardMaterial({ name: 'police_lamp', color: '#2a5bd7', emissive: '#2a5bd7', emissiveIntensity: 0.8 }), new THREE.BoxGeometry(0.4, 0.5, 0.4), new THREE.Matrix4().makeTranslation(s * 2.1, 2.65, 2.2));
    }
  });
  flatRoof(B, w, dp, top, { parapet: 0.8, mat: B.mats.wall, cap: m.trim });
  rooftop(B, w, dp, top, { ac: 2, mast: true });
  flagpole(B, -w / 2 - 2, 0, dp / 2 + 1, { color: '#1f3a6b' });
  // fenced vehicle yard at the back
  B.box(B.mats.concrete, w, 0.08, 10, 0, 0.04, -dp / 2 - 5, 0, 0.02);
  for (const [a, b, z] of [[-w / 2, w / 2, -dp / 2 - 10]]) railingRun(B, a, b, z, 0.08, B.mats.metal, { height: 2.2, spacing: 0.25 });
  B.local(-w / 2, 0, -dp / 2 - 5, Math.PI / 2, () => railingRun(B, -5, 5, 0, 0.08, B.mats.metal, { height: 2.2, spacing: 0.25 }));
  B.local(w / 2, 0, -dp / 2 - 5, -Math.PI / 2, () => railingRun(B, -5, 5, 0, 0.08, B.mats.metal, { height: 2.2, spacing: 0.25 }));
});

/* ---------------------------- Restaurant --------------------------- */
export const RESTAURANT_VARIANTS = {
  diner: { wall: '#d8dde2', wallKind: 'seam', roof: '#666', roofKind: 'concrete', trim: '#b3261e', accent: '#b3261e', door: '#2a2d30', sign: 'DINER' },
  pizzeria: { wall: '#e6d3b0', wallKind: 'stucco', roof: '#9a4a2e', roofKind: 'tile', trim: '#2f6b3a', accent: '#b3261e', door: '#2f6b3a', sign: 'PIZZERIA' },
  'fast-food': { wall: '#c9302c', wallKind: 'stucco', roof: '#666', roofKind: 'concrete', trim: '#f2c200', accent: '#f2c200', door: '#2a2d30', sign: 'BURGERS' },
  steakhouse: { wall: '#6e4a32', wallKind: 'log', roof: '#3d3f42', roofKind: 'seam', trim: '#3a2a1e', accent: '#8a1f1f', door: '#3a2a1e', sign: 'STEAKHOUSE' },
  sushi: { wall: '#ece6d8', wallKind: 'stucco', roof: '#2e3135', roofKind: 'tile', trim: '#3a2a1e', accent: '#8a1f1f', door: '#3a2a1e', sign: 'SUSHI BAR' },
};

export const createRestaurant = makeBuilding('restaurant', RESTAURANT_VARIANTS, (B, o, d, m, v) => {
  if (v === 'diner') {
    // streamlined stainless diner: rounded ends, ribbon windows, red stripe
    const L = 16;
    const R = 2.4;
    const steel = M.metal('#c9ced3', 0.25);
    const g = new THREE.CapsuleGeometry(R, L - 2 * R, 8, 24).rotateZ(Math.PI / 2).scale(1, 0.75, 1);
    B.box(B.mats.plinth, L + 0.4, 0.6, R * 2 + 0.2, 0, 0.3, 0, 0, 0.05);
    B.add(steel, g, new THREE.Matrix4().makeTranslation(0, 0.6 + R * 0.75, 0));
    for (const s of [-1, 1]) {
      B.box(m.trim, L - 2, 0.22, 0.04, 0, 1.25, s * R * 1.0 - s * 0.05 + s * 0.02, 0, 0.01);
      B.add(B.mats.glow, new THREE.BoxGeometry(L - 3.4, 1.1, 0.02), new THREE.Matrix4().makeTranslation(0, 2.2, s * (R - 0.08)));
      B.add(B.mats.glass, new THREE.BoxGeometry(L - 3.4, 1.1, 0.02), new THREE.Matrix4().makeTranslation(0, 2.2, s * (R - 0.02)));
      B.openings.push(B.worldRect(-L / 2 + 1.7, 1.6, L / 2 - 1.7, 2.8));
    }
    B.local(0, 0, R - 0.1, 0, () => {
      door(B, -L / 2 + 3, 0.6, 1.0, 2.1, { glass: true, frame: steel });
      for (let s = 0; s < 2; s++) B.box(B.mats.concrete, 1.6, 0.3, 0.4 * (2 - s), -L / 2 + 3, 0.15 + s * 0.3, 0.2 * (2 - s), 0, 0.02);
    });
    B.box(B.mats.metal, 0.3, 2.9, 0.3, 0, 0.6 + R * 1.5 - 0.1 + 1.45, 0, 0, 0.03);
    B.local(0, 0, 0.16, 0, () => signBoard(B, 0, 0.6 + R * 1.5 + 0.35 + 2.9, 0, 5, 1.3, 'DINER', { bg: '#b3261e', fg: '#ffffff', emissive: 1 }));
    B.local(0, 0, -0.16, Math.PI, () => signBoard(B, 0, 0.6 + R * 1.5 + 0.35 + 2.9, 0, 5, 1.3, 'DINER', { bg: '#b3261e', fg: '#ffffff', emissive: 1 }));
    B.box(B.mats.dark, 5.2, 1.5, 0.28, 0, 0.6 + R * 1.5 + 0.35 + 2.9, 0, 0, 0.04);
    return;
  }
  const w = v === 'fast-food' ? 16 : 14;
  const dp = 12;
  const h = 0.4 + (v === 'steakhouse' ? 3.6 : 4.2);
  block(B, w, h, dp, { plinth: 0.4 });
  facades(B, w, dp, (side, width) => {
    if (side === 'front') {
      storefront(B, m, width - 1.4, 0.4, h - 0.4, { frame: v === 'fast-food' ? B.mats.dark : m.trim, doorW: 1.8, fascia: v === 'fast-food', text: v === 'fast-food' ? d.sign : null, bg: '#2a2d30', fg: '#f2c200' });
      if (v === 'pizzeria' || v === 'sushi') {
        signBoard(B, 0, h + 0.1, 0.12, 6, 0.8, d.sign, { bg: v === 'sushi' ? '#2a1d14' : '#2f6b3a', fg: '#fff3d6' });
        // awning / noren banner
        if (v === 'pizzeria') {
          B.slab(m.accent, 0, h - 0.6, 1.4, h - 1.3, width - 1, 0.05);
          for (const s of [-1, 1]) B.box(m.accent, 0.04, 0.4, 1.4, s * (width - 1) / 2, h - 1.4, 0.7, 0, 0);
        } else {
          for (let k = -2; k <= 2; k++) B.box(new THREE.MeshStandardMaterial({ name: 'noren', color: '#1f2c4f', roughness: 0.9 }), 0.36, 0.8, 0.02, k * 0.38, 2.4, 0.2, 0, 0);
          B.geo(B.mats.trim, new THREE.CylinderGeometry(0.03, 0.03, 2, 6), 0, 2.82, 0.2, 0, 0, Math.PI / 2); // horizontal noren rod
          // rod brackets back to the shopfront
          for (const s of [-0.96, 0.96]) B.box(B.mats.trim, 0.04, 0.04, 0.22, s, 2.82, 0.1, 0, 0);
        }
      }
      if (v === 'steakhouse') {
        porchBeams(B, m, width);
        signBoard(B, 0, h + 0.6, 0.6, 6.5, 0.9, d.sign, { bg: '#2a1d14', fg: '#f0d6a8' });
      }
    } else for (const x of spread(width, Math.round(width / 3.2), 1.6)) windowUnit(B, x, 1.4, 1.4, 1.6, { style: side === 'back' ? 'none' : 'double', frame: m.trim });
  });
  if (v === 'pizzeria' || v === 'sushi' || v === 'steakhouse') gableRoof(B, w, dp, h, { pitch: v === 'sushi' ? 0.7 : 0.45, overhang: 0.6, fascia: m.trim });
  else flatRoof(B, w, dp, h, { parapet: 0.7, mat: B.mats.wall, cap: m.trim });
  if (v === 'pizzeria') {
    // brick oven chimney
    B.box(surface('brick', '#8e4636', { name: 'brick' }), 0.9, 4, 0.9, w / 2 - 2, h + 1, -2, 0, 0.03);
  }
  if (v === 'fast-food') {
    rooftop(B, w, dp, h, { ac: 2 });
    // drive-thru lane with menu board and tall pole sign
    B.box(B.mats.concrete, 3.4, 0.06, dp + 6, w / 2 + 2.2, 0.03, 0, 0, 0.02);
    B.local(w / 2, 0, -1, Math.PI / 2, () => {
      windowUnit(B, 0, 1.0, 1.4, 1.2, { style: 'none', frame: B.mats.dark });
      B.slab(m.trim, 0, 2.9, 1.4, 2.8, 2.6, 0.1);
    });
    B.box(B.mats.dark, 0.2, 1.2, 0.2, w / 2 + 4.3, 0.6, 3, 0, 0.02);
    B.local(w / 2 + 4.3, 0, 3, -Math.PI / 2, () => signBoard(B, 0, 1.9, 0.12, 1.8, 1.2, 'MENU', { bg: '#1d1d1d', fg: '#f2c200', emissive: 1, logo: false }));
    B.box(B.mats.dark, 0.6, 9, 0.6, -w / 2 - 2, 4.5, dp / 2 + 2, 0, 0.05);
    B.local(-w / 2 - 2, 0, dp / 2 + 2, 0, () => signBoard(B, 0, 10, 0.31, 4, 2, d.sign, { bg: '#c9302c', fg: '#f2c200', emissive: 1 }));
    B.local(-w / 2 - 2, 0, dp / 2 + 2, Math.PI, () => signBoard(B, 0, 10, 0.31, 4, 2, d.sign, { bg: '#c9302c', fg: '#f2c200', emissive: 1 }));
    B.box(B.mats.dark, 4.2, 2.2, 0.62, -w / 2 - 2, 10, dp / 2 + 2, 0, 0.05);
  }
  // outdoor tables
  if (v !== 'fast-food') {
    for (const x of [-w / 2 + 2, w / 2 - 2]) {
      B.cyl(B.mats.dark, 0.45, 0.45, 0.05, x, 0.75, dp / 2 + 2.2, 16);
      B.cyl(B.mats.dark, 0.05, 0.05, 0.73, x, 0.365, dp / 2 + 2.2, 8);
      B.cyl(B.mats.dark, 0.25, 0.25, 0.02, x, 0.01, dp / 2 + 2.2, 12);
      if (v !== 'steakhouse') {
        B.cyl(B.mats.metal, 0.03, 0.03, 2.2, x, 0.78 + 1.1, dp / 2 + 2.2, 6);
        B.add(m.accent.clone(), new THREE.ConeGeometry(1.3, 0.5, 8, 1, true), new THREE.Matrix4().makeTranslation(x, 2.95, dp / 2 + 2.2));
      }
    }
  }
});

function porchBeams(B, m, width) {
  // rustic timber porch: posts + beam + shed roof (frame: facade plane)
  const wood = surface('log', '#7a4a26', { name: 'logs' });
  for (const x of spread(width, 4, 0.3)) B.box(wood, 0.25, 3.0, 0.25, x, 0.4 + 1.5, 2.2, 0, 0.04);
  B.box(wood, width, 0.3, 0.3, 0, 3.55, 2.2, 0, 0.05);
  B.slab(B.mats.roof, 0, 4.1, 2.6, 3.7, width + 0.3, 0.1);
  B.box(surface('plank', '#8a6b4e', { name: 'deck' }), width, 0.12, 2.6, 0, 0.34, 1.3, 0, 0.02);
}

/* ------------------------- Supermarket / mall ---------------------- */
export const SUPERMARKET_VARIANTS = {
  supermarket: { wall: '#e9e6df', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#2e7d32', accent: '#2b2d30', door: '#2a2d30' },
  mall: { wall: '#d8d2c4', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#5a3a6b', accent: '#2b2d30', door: '#2a2d30' },
  'big-box': { wall: '#2f5d9a', wallKind: 'corrugated', roof: '#777', roofKind: 'corrugated', trim: '#f2c200', accent: '#2b2d30', door: '#2a2d30' },
};

export const createSupermarket = makeBuilding('supermarket', SUPERMARKET_VARIANTS, (B, o, d, m, v) => {
  const floors = floorsOf(o, v === 'mall' ? 2 : 1);
  const w = { supermarket: 40, mall: 60, 'big-box': 56 }[v];
  const dp = { supermarket: 30, mall: 44, 'big-box': 40 }[v];
  const h = 0.3 + floors * 5.5 + (v === 'big-box' ? 2 : 0);
  block(B, w, h, dp, { plinth: 0.3 });
  facades(B, w, dp, (side, width) => {
    if (side !== 'front') {
      if (side === 'back') for (const x of spread(width, 4, 6)) {
        B.box(B.mats.dark, 3.2, 3.4, 0.05, x, 1.7 + 1.0, 0.03, 0, 0);
        B.box(B.mats.concrete, 3.8, 1.0, 1.6, x, 0.5, 0.8, 0, 0.04);
      }
      return;
    }
    const sw = v === 'mall' ? 22 : 18;
    storefront(B, m, sw, 0.3, 5.2, { frame: B.mats.dark, doorW: 3.2, fascia: false });
    B.box(m.trim, sw + 2, 1.2, 4, 0, 5.7, 2, 0, 0.08);
    for (const s of [-1, 1]) B.box(m.trim, 0.5, 5.1, 0.5, s * (sw / 2 + 0.6), 0.3 + 2.55, 3.7, 0, 0.06);
    signBoard(B, 0, h - 1.4, 0.06, Math.min(width * 0.5, 22), 2, { supermarket: 'SUPERMARKET', mall: 'SHOPPING MALL', 'big-box': 'HOME & GARDEN' }[v], { bg: v === 'big-box' ? '#f2c200' : '#ffffff', fg: v === 'big-box' ? '#1f3d6b' : `#${m.trim.color.getHexString()}` });
    if (v === 'mall') for (const x of [-22, 22]) {
      storefront(B, m, 12, 0.3, 4.8, { frame: B.mats.dark, doorW: 1.8, fascia: true });
      void x;
    }
  });
  flatRoof(B, w, dp, h, { parapet: 1.2, mat: B.mats.wall, cap: m.trim });
  rooftop(B, w, dp, h, { ac: 6 });
  if (v === 'mall') {
    // glass atrium drum
    B.add(B.mats.glass, new THREE.CylinderGeometry(7, 7, 6, 32), new THREE.Matrix4().makeTranslation(0, h + 3, 0));
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      B.box(B.mats.metal, 0.15, 6, 0.15, Math.sin(a) * 7, h + 3, Math.cos(a) * 7, 0, 0.02);
    }
    B.add(B.mats.metal, new THREE.CylinderGeometry(7.4, 7.4, 0.3, 32), new THREE.Matrix4().makeTranslation(0, h + 6.15, 0));
  }
  // parking lot with markings and cart corral
  B.box(new THREE.MeshStandardMaterial({ name: 'asphalt', color: '#3a3c3f', roughness: 0.95 }), w, 0.06, 18, 0, 0.03, dp / 2 + 9.5, 0, 0.02);
  for (let x = -w / 2 + 3; x < w / 2 - 2; x += 2.7) for (const z of [dp / 2 + 5.5, dp / 2 + 13.5]) B.box(new THREE.MeshStandardMaterial({ name: 'line', color: '#f2f2ee' }), 0.12, 0.01, 5, x, 0.065, z, 0, 0);
  railingRun(B, -2, 2, dp / 2 + 9.5, 0.06, B.mats.metal, { height: 1.0, spacing: 0.5 });
});

/* --------------------------- Gas station --------------------------- */
export const GAS_STATION_VARIANTS = {
  modern: { wall: '#f1f1ef', wallKind: 'stucco', roof: '#666', roofKind: 'concrete', trim: '#1f6b3a', accent: '#2b2d30', door: '#2a2d30' },
  retro: { wall: '#f4efe2', wallKind: 'stucco', roof: '#b3261e', roofKind: 'seam', trim: '#b3261e', accent: '#2b2d30', door: '#b3261e' },
  'truck-stop': { wall: '#b9b3a8', wallKind: 'corrugated', roof: '#666', roofKind: 'corrugated', trim: '#d35400', accent: '#2b2d30', door: '#2a2d30' },
};

export const createGasStation = makeBuilding('gas-station', GAS_STATION_VARIANTS, (B, o, d, m, v) => {
  const sw = v === 'truck-stop' ? 18 : 12;
  const sd = 9;
  const sh = 4.2;
  block(B, sw, sh, sd, { cz: -10, plinth: 0.3 });
  B.local(0, 0, -10 + sd / 2, 0, () => storefront(B, m, sw - 1.2, 0.3, sh - 0.3, { frame: B.mats.dark, fascia: true, text: v === 'truck-stop' ? 'TRUCK STOP' : 'MARKET', bg: `#${m.trim.color.getHexString()}`, fg: '#ffffff' }));
  if (v === 'retro') gableRoof(B, sw, sd, sh, { pitch: 0.5, overhang: 0.5, cz: -10 });
  else flatRoof(B, sw, sd, sh, { parapet: 0.6, cz: -10, mat: B.mats.wall, cap: m.trim });
  // canopy on columns over pump islands
  const cw = v === 'truck-stop' ? 26 : 18;
  const cd = v === 'truck-stop' ? 14 : 10;
  const ch = v === 'truck-stop' ? 6.5 : 5.2;
  const cols = v === 'truck-stop' ? 3 : 2;
  for (let i = 0; i < cols; i++) {
    const x = (i - (cols - 1) / 2) * (cw / cols);
    for (const z of [-cd / 4, cd / 4]) {
      B.box(B.mats.metal, 0.45, ch, 0.45, x, ch / 2, z + 2, 0, 0.06);
    }
    // island + two pumps
    B.box(B.mats.concrete, 1.4, 0.2, cd * 0.7, x, 0.1, 2, 0, 0.05);
    for (const z of [-cd / 4 + 1.6, cd / 4 - 1.6]) {
      B.box(m.accent, 0.8, 1.8, 0.5, x, 0.2 + 0.9, z + 2, 0, 0.06);
      B.add(B.mats.glow, new THREE.PlaneGeometry(0.4, 0.25), new THREE.Matrix4().makeTranslation(x, 1.6, z + 2.26));
      B.box(m.trim, 0.84, 0.3, 0.54, x, 1.85, z + 2, 0, 0.04);
      B.cyl(B.mats.dark, 0.025, 0.025, 1.0, x + 0.42, 1.0, z + 2, 6);
    }
  }
  B.box(B.mats.wall, cw, 0.6, cd, 0, ch + 0.3, 2, 0, 0.08);
  B.box(m.trim, cw + 0.06, 0.4, cd + 0.06, 0, ch + 0.25, 2, 0, 0.05);
  B.box(B.mats.glow, cw - 1, 0.04, cd - 1, 0, ch - 0.02, 2, 0, 0);
  B.local(0, 0, 2 + cd / 2 + 0.03, 0, () => emblem(B, -cw / 2 + 1.2, ch + 0.25, 0, 0.35));
  // price pylon
  B.box(m.accent, 0.5, 7, 0.5, cw / 2 + 3, 3.5, 2 + cd / 2 + 2, 0, 0.06);
  B.local(cw / 2 + 3, 0, 2 + cd / 2 + 2.26, 0, () => signBoard(B, 0, 6.2, 0, 2.4, 1.8, 'FUEL', { bg: '#151515', fg: '#ffb300', emissive: 1 }));
  B.box(B.mats.concrete, cw + 4, 0.05, cd + 10, 0, 0.025, -1, 0, 0.02);
});

export { clockTower, portico, FH };
