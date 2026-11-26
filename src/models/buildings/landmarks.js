import * as THREE from 'three';
import * as M from '../../core/materials.js';
import {
  FH, floorsOf, makeBuilding, gridBody, storefront, portico, dome, clockTower, flagpole, rooftop,
  surface, block, facades, spread, windowUnit, door, flatRoof, gableRoof, hipRoof, frustum, signBoard, railingRun, emblem,
} from './parts.js';

/*
 * Landmarks & public buildings: museums, libraries, city halls, courthouses,
 * castles, temples, cathedral, stadium, train stations, airport, parking garage.
 */

/* ------------------------- Museum / library ------------------------ */
export const MUSEUM_VARIANTS = {
  classical: { wall: '#e4dccb', wallKind: 'stone', roof: '#6a7078', roofKind: 'seam', trim: '#f3eee3', accent: '#3a3d42', door: '#3a2a1e', plinthKind: 'stone', plinth: '#b0a796' },
  modern: { wall: '#f0efeb', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#2a2d30', accent: '#b9a27a', door: '#2a2d30' },
  library: { wall: '#c9b48e', wallKind: 'stone', roof: '#4e6b5c', roofKind: 'seam', trim: '#efe7d6', accent: '#2a2d30', door: '#3a2a1e', plinthKind: 'stone', plinth: '#9a8f7c' },
  'modern-library': { wall: '#a9b4b8', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#2a2d30', accent: '#7a5a3c', door: '#2a2d30' },
};

export const createMuseum = makeBuilding('museum', MUSEUM_VARIANTS, (B, o, d, m, v) => {
  if (v === 'classical' || v === 'library') {
    const w = v === 'library' ? 26 : 34;
    const dp = 22;
    const g = 1.5;
    const floors = floorsOf(o, 2);
    const fh = 4.5;
    const h = g + floors * fh;
    block(B, w, h, dp, { plinth: g });
    facades(B, w, dp, (side, width) => {
      for (let f = 0; f < floors; f++) for (const x of spread(width, Math.round(width / 4), 2.4)) {
        if (side === 'front' && Math.abs(x) < 8) continue;
        windowUnit(B, x, g + f * fh + 1.0, 1.5, 2.6, { style: f === floors - 1 && v === 'library' ? 'arch' : 'grid', header: m.trim });
      }
      if (side === 'front') {
        door(B, 0, g, 2.6, 3.8, { double: true, mat: B.mats.door });
        portico(B, m, { width: 15, depth: 4, colH: h - g - 1.0, y0: g, cols: 8, steps: 7 });
        for (const s of [-1, 1]) {
          // banners
          B.box(new THREE.MeshStandardMaterial({ name: 'banner', color: v === 'library' ? '#2c4f7c' : '#8a1f1f', roughness: 0.9 }), 1.0, 4.5, 0.04, s * 10.5, g + 3.5, 0.05, 0, 0);
        }
      }
    });
    B.box(m.trim, w + 0.5, 0.9, dp + 0.5, 0, h + 0.15, 0, 0, 0.06);
    const top = h + 0.6;
    if (v === 'library') {
      flatRoof(B, w, dp, top, { parapet: 0.8, mat: m.trim, cap: m.trim });
      dome(B, { y: top, r: 5, drumH: 3, mat: B.mats.roof, drumMat: B.mats.wall });
    } else {
      gableRoof(B, w, dp, top, { pitch: 0.28, overhang: 0.4, fascia: m.trim, gableMat: m.trim, gutter: false });
    }
    flagpole(B, -w / 2 - 3, 0, dp / 2 + 4, { color: '#2c4f7c' });
    flagpole(B, w / 2 + 3, 0, dp / 2 + 4, { color: '#8a1f1f' });
    B.box(B.mats.concrete, w + 12, 0.06, 12, 0, 0.03, dp / 2 + 6, 0, 0.02);
    return;
  }
  // modern: interlocking volumes, one cantilevered, big glazing, sculpture
  const floors = floorsOf(o, 2);
  const h1 = 0.3 + floors * 4.5;
  block(B, 30, h1, 20, { plinth: 0.3 });
  facades(B, 30, 20, (side, width) => {
    if (side === 'front') {
      storefront(B, m, 14, 0.3, 4.5, { frame: m.trim, doorW: 3, fascia: false });
      signBoard(B, -9.5, 5.6, 0.04, 9, 1.0, v === 'modern' ? 'MUSEUM OF ART' : 'PUBLIC LIBRARY', { bg: '#2a2d30', fg: '#ffffff' });
    } else if (side === 'back') windowUnit(B, 0, 0.6, width - 6, h1 - 1.6, { style: 'tall', frame: m.trim, sill: false });
  });
  flatRoof(B, 30, 20, h1, { parapet: 0.5, mat: B.mats.wall, cap: m.trim });
  const clad = surface('vboard', v === 'modern' ? '#b9a27a' : '#7a5a3c', { name: 'cladding', roughness: 0.6 });
  // upper box shifted forward over the entrance (cantilever)
  const ux = 4;
  const uz = 4;
  block(B, 22, 7, 16, { cx: ux, cz: uz, y0: h1 + 0.06, mat: clad, plinth: 0 });
  facades(B, 22, 16, (side, width) => {
    if (side === 'front') windowUnit(B, 0, h1 + 1.2, width - 4, 1.6, { style: 'none', frame: m.trim, sill: false });
    if (side === 'right') windowUnit(B, 0, h1 + 1.2, 8, 4.5, { style: 'tall', frame: m.trim, sill: false });
  }, { cx: ux, cz: uz });
  flatRoof(B, 22.4, 16.4, h1 + 7.06, { parapet: 0, cx: ux, cz: uz, roofMat: B.mats.dark });
  // underside of the cantilever + two slim columns carrying it
  for (const x of [ux - 9, ux + 9]) B.box(m.trim, 0.4, h1, 0.4, x, h1 / 2, uz + 7.6, 0, 0.04);
  B.box(B.mats.concrete, 40, 0.06, 14, 0, 0.03, 17, 0, 0.02);
  // sculpture
  B.box(B.mats.plinth, 1.4, 1.0, 1.4, -10, 0.5, 15, 0, 0.06);
  B.add(M.metal('#c46a2a', 0.35), new THREE.TorusKnotGeometry(0.7, 0.18, 64, 10), new THREE.Matrix4().makeTranslation(-10, 1.0 + 1.0, 15));
});

/* --------------------- City hall / courthouse ---------------------- */
export const CIVIC_HALL_VARIANTS = {
  'city-hall': { wall: '#d9cdb6', wallKind: 'stone', roof: '#3f5a52', roofKind: 'seam', trim: '#f2ece0', accent: '#2a2d30', door: '#3a2a1e', plinthKind: 'stone', plinth: '#a59a88' },
  courthouse: { wall: '#9c4a36', wallKind: 'brick', roof: '#4a4d52', roofKind: 'shingle', trim: '#efe7d8', accent: '#2a2d30', door: '#3a2a1e', plinthKind: 'stone', plinth: '#a59a88' },
  'town-hall': { wall: '#f1ece2', wallKind: 'siding', roof: '#3a3d42', roofKind: 'shingle', trim: '#ffffff', accent: '#2a2d30', door: '#2f4f3a' },
};

export const createCivicHall = makeBuilding('civic-hall', CIVIC_HALL_VARIANTS, (B, o, d, m, v) => {
  const floors = floorsOf(o, v === 'town-hall' ? 2 : 3);
  const w = v === 'town-hall' ? 18 : 30;
  const dp = v === 'town-hall' ? 14 : 20;
  const g = v === 'town-hall' ? 0.6 : 1.4;
  const fh = 4;
  const h = g + floors * fh;
  block(B, w, h, dp, { plinth: g });
  facades(B, w, dp, (side, width) => {
    for (let f = 0; f < floors; f++) for (const x of spread(width, Math.round(width / 3.4), 2)) {
      if (side === 'front' && f < floors && Math.abs(x) < (v === 'town-hall' ? 3 : 7)) continue;
      windowUnit(B, x, g + f * fh + 0.9, 1.3, 2.3, { style: f === 0 ? 'arch' : 'grid', header: f === 0 ? null : m.trim, shutters: v === 'town-hall' ? m.accent : null });
    }
    if (side === 'front') {
      door(B, 0, g, 2.4, 3.2, { double: true, steps: v === 'town-hall' ? 3 : 0 });
      if (v !== 'town-hall') portico(B, m, { width: 12, depth: 3.5, colH: h - g - 1.0, y0: g, cols: 6, steps: 6 });
      else {
        B.slab(B.mats.roof, 0, g + 3.9, 2.2, g + 3.5, 4.4, 0.12);
        for (const s of [-1, 1]) B.box(m.trim, 0.25, 3.5, 0.25, s * 2, g + 1.75, 2.0, 0, 0.04);
      }
    }
  });
  B.box(m.trim, w + 0.4, 0.6, dp + 0.4, 0, h + 0.05, 0, 0, 0.05);
  const top = h + 0.35;
  if (v === 'city-hall') {
    flatRoof(B, w, dp, top, { parapet: 1.0, mat: m.trim, cap: m.trim });
    dome(B, { y: top, r: 6, drumH: 4.5, mat: B.mats.roof, drumMat: B.mats.wall });
  } else {
    hipRoof(B, w, dp, top, { pitch: v === 'courthouse' ? 0.5 : 0.6, overhang: 0.4, fascia: m.trim });
    clockTower(B, { y0: top + (v === 'courthouse' ? 2.5 : 2.4) - 2.4, s: v === 'courthouse' ? 4.5 : 3.2, h: v === 'courthouse' ? 9 : 6, roof: v === 'courthouse' ? 'dome' : 'spire', mat: v === 'courthouse' ? m.trim : B.mats.wall });
  }
  flagpole(B, 0, 0, dp / 2 + (v === 'town-hall' ? 7 : 9), { color: '#2c4f7c' });
  B.box(B.mats.concrete, w + 8, 0.06, 12, 0, 0.03, dp / 2 + 6, 0, 0.02);
});

/* ------------------------------ Castle ----------------------------- */
export const CASTLE_VARIANTS = {
  keep: { wall: '#9c958a', wallKind: 'stone', roof: '#3d4f6b', roofKind: 'shingle', trim: '#7d776e', accent: '#7a1f2b', door: '#4a3220', plinthKind: 'stone', plinth: '#857e73' },
  fortress: { wall: '#b3a68e', wallKind: 'stone', roof: '#5a4a3a', roofKind: 'tile', trim: '#8f8473', accent: '#2c4f7c', door: '#4a3220', plinthKind: 'stone', plinth: '#8f8473' },
  palace: { wall: '#efe6d2', wallKind: 'stucco', roof: '#3d4f6b', roofKind: 'seam', trim: '#ffffff', accent: '#c9a54a', door: '#3a2a1e', plinthKind: 'stone', plinth: '#b8ae9c' },
};

function crenellations(B, mat, w, d, y, { cx = 0, cz = 0, t = 0.6 } = {}) {
  // walkway parapet with merlons along a rectangle
  for (const [len, ox, oz, ry] of [[w, 0, d / 2, 0], [w, 0, -d / 2, 0], [d, w / 2, 0, Math.PI / 2], [d, -w / 2, 0, Math.PI / 2]]) {
    B.local(cx + ox, 0, cz + oz, ry, () => {
      B.box(mat, len + t, 0.9, t, 0, y + 0.45, 0, 0, 0.03);
      for (let x = -len / 2; x <= len / 2 + 1e-3; x += 1.2) B.box(mat, 0.6, 0.7, t, x, y + 0.9 + 0.35, 0, 0, 0.03);
    });
  }
}

function roundTower(B, m, x, z, r, h, { cone = true, mat = B.mats.wall } = {}) {
  B.add(mat, new THREE.CylinderGeometry(r, r * 1.08, h, 24), new THREE.Matrix4().makeTranslation(x, h / 2, z));
  B.add(mat, new THREE.CylinderGeometry(r + 0.35, r, 0.6, 24), new THREE.Matrix4().makeTranslation(x, h + 0.3, z));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    B.local(x + Math.sin(a) * r, 0, z + Math.cos(a) * r, a, () => windowUnit(B, 0, h * 0.55, 0.35, 1.0, { style: 'arch', sill: false, frame: B.mats.wall }));
  }
  if (cone) {
    B.add(B.mats.roof, new THREE.ConeGeometry(r + 0.6, r * 2.6, 24), new THREE.Matrix4().makeTranslation(x, h + 0.6 + r * 1.3, z));
    B.cyl(B.mats.metal, 0.03, 0.05, 1.4, x, h + 0.6 + r * 2.6 + 0.6, z, 6);
    return h + 0.6 + r * 2.6;
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    B.add(mat, new THREE.BoxGeometry(0.55, 0.7, 0.5), new THREE.Matrix4().makeRotationY(a).setPosition(x + Math.sin(a) * (r + 0.1), h + 0.95, z + Math.cos(a) * (r + 0.1)));
  }
  return h + 1.3;
}

export const createCastle = makeBuilding('castle', CASTLE_VARIANTS, (B, o, d, m, v) => {
  if (v === 'palace') {
    const floors = floorsOf(o, 3);
    const top = gridBody(B, m, { w: 44, d: 18, floors, fh: 4.4, g: 1.2, spacing: 3.2, winW: 1.4, winH: 2.6, style: 'grid', header: m.trim, doorGap: 6 });
    B.local(0, 0, 9, 0, () => {
      door(B, 0, 1.2, 2.6, 3.6, { double: true });
      portico(B, m, { width: 12, depth: 3.5, colH: top - 1.2 - 1.2, y0: 1.2, cols: 6, steps: 5 });
    });
    for (const s of [-1, 1]) {
      const t2 = gridBody(B, m, { w: 12, d: 24, floors, fh: 4.4, g: 1.2, cx: s * 28, spacing: 3.2, winW: 1.4, winH: 2.6, style: 'grid', header: m.trim, sides: ['front', 'back', s > 0 ? 'right' : 'left'] });
      hipRoof(B, 12, 24, t2, { pitch: 0.7, overhang: 0.3, cx: s * 28, ridgeAlong: 'z', fascia: m.trim });
    }
    B.box(m.trim, 44.4, 0.7, 18.4, 0, top + 0.1, 0, 0, 0.05);
    hipRoof(B, 44, 18, top + 0.45, { pitch: 0.55, overhang: 0.3, fascia: m.trim });
    dome(B, { y: top + 0.45 + 18 / 2 * 0.55 - 1.5, r: 3.2, drumH: 2.5, mat: B.mats.roof, onion: false });
    // formal garden: gravel court, hedges, fountain
    B.box(surface('stucco', '#d8d0bc', { name: 'gravel' }), 60, 0.05, 22, 0, 0.025, 22, 0, 0.02);
    const hedge = new THREE.MeshStandardMaterial({ name: 'hedge', color: '#35562d', roughness: 1 });
    for (const sx of [-1, 1]) for (const z of [15, 27]) B.box(hedge, 18, 0.9, 1.0, sx * 15, 0.5, z, 0, 0.2);
    B.add(B.mats.plinth, new THREE.CylinderGeometry(3, 3.2, 0.7, 32), new THREE.Matrix4().makeTranslation(0, 0.35, 21));
    B.add(new THREE.MeshPhysicalMaterial({ name: 'water', color: '#5ba6c9', roughness: 0.05, clearcoat: 1 }), new THREE.CylinderGeometry(2.7, 2.7, 0.05, 32), new THREE.Matrix4().makeTranslation(0, 0.68, 21));
    B.add(B.mats.plinth, new THREE.CylinderGeometry(0.3, 0.5, 2.2, 12), new THREE.Matrix4().makeTranslation(0, 0.7 + 1.1, 21));
    return;
  }
  if (v === 'keep') {
    // square keep with corner turrets, curtain wall and gatehouse
    const kh = floorsOf(o, 4) * 4 + 2;
    block(B, 14, kh, 14, { plinth: 1.2 });
    facades(B, 14, 14, (side, width) => {
      for (let f = 1; f < kh / 4 - 0.5; f++) for (const x of spread(width, 2, 3)) windowUnit(B, x, f * 4, 0.6, 1.6, { style: 'arch', frame: B.mats.wall, sill: false });
    });
    crenellations(B, B.mats.wall, 14, 14, kh);
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) roundTower(B, m, sx * 7, sz * 7, 2, kh + 3, { cone: true });
    // curtain wall around a courtyard
    const W = 40;
    const t = 1.6;
    const ch = 8;
    for (const [len, x, z, ry] of [[W, 0, -W / 2, 0], [W, -W / 2, 0, Math.PI / 2], [W, W / 2, 0, Math.PI / 2]]) B.local(x, 0, z, ry, () => B.box(B.mats.wall, len, ch, t, 0, ch / 2, 0, 0, 0.05));
    for (const s of [-1, 1]) B.local(s * (W / 4 + 2.5), 0, W / 2, 0, () => B.box(B.mats.wall, W / 2 - 5, ch, t, 0, ch / 2, 0, 0, 0.05));
    crenellations(B, B.mats.wall, W, W, ch, { t });
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) roundTower(B, m, sx * W / 2, sz * W / 2, 2.6, ch + 3, { cone: false });
    // gatehouse with portcullis
    for (const s of [-1, 1]) roundTower(B, m, s * 3.6, W / 2, 2.2, ch + 4, { cone: false });
    B.box(B.mats.wall, 5, ch + 1, t + 1, 0, (ch + 1) / 2 + 0, W / 2, 0, 0.05);
    B.local(0, 0, W / 2 + (t + 1) / 2, 0, () => {
      B.add(B.mats.dark, new THREE.PlaneGeometry(3, 4), new THREE.Matrix4().makeTranslation(0, 2, 0.01));
      for (let x = -1.3; x <= 1.31; x += 0.43) B.box(B.mats.metal, 0.08, 4, 0.08, x, 2, 0.06, 0, 0);
      for (let y = 0.5; y < 4; y += 0.6) B.box(B.mats.metal, 3, 0.08, 0.08, 0, y, 0.08, 0, 0);
    });
    flagpole(B, 0, kh + 0.06, 0, { color: '#7a1f2b', h: 6 });
    return;
  }
  // fortress: star-ish walls on a mound with a hall
  const W = 46;
  B.add(new THREE.MeshStandardMaterial({ name: 'grass', color: '#5f7a3c', roughness: 1 }), frustum(W + 10, W + 10, W + 2, W + 2, 0, 2.5));
  const ch = 7;
  for (const [len, x, z, ry] of [[W, 0, -W / 2, 0], [W, 0, W / 2, 0], [W, -W / 2, 0, Math.PI / 2], [W, W / 2, 0, Math.PI / 2]]) {
    B.local(x, 0, z, ry, () => B.box(B.mats.wall, len, ch, 2, 0, 2.5 + ch / 2, 0, 0, 0.05));
  }
  crenellations(B, B.mats.wall, W, W, 2.5 + ch, { t: 2 });
  for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    B.add(B.mats.wall, frustum(9, 9, 7.5, 7.5, 2.5, 2.5 + ch + 1), new THREE.Matrix4().makeRotationY(Math.PI / 4).setPosition(sx * W / 2, 0, sz * W / 2));
  }
  const hall = gridBody(B, m, { w: 20, d: 12, floors: floorsOf(o, 2), fh: 4, g: 0.3, y0: 2.5, spacing: 3, winW: 0.9, winH: 1.8, style: 'arch' });
  gableRoof(B, 20, 12, hall, { pitch: 0.9, overhang: 0.3 });
  roundTower(B, m, 10, -6, 2.4, hall + 5, { cone: true });
  B.local(0, 0, W / 2 + 1.01, 0, () => door(B, 0, 2.5, 3, 3.8, { mat: B.mats.door }));
  // ramp to the gate
  B.slab(B.mats.plinth, W / 2 + 1, 2.5, W / 2 + 9, 0, 4, 0.3);
});

/* ------------------------------ Temple ----------------------------- */
export const TEMPLE_VARIANTS = {
  greek: { wall: '#ece6d8', wallKind: 'stone', roof: '#c9bfae', roofKind: 'tile', trim: '#f4f0e6', accent: '#3a3d42', door: '#5a4a3a', plinthKind: 'stone', plinth: '#d2cab8' },
  pagoda: { wall: '#b3261e', wallKind: 'stucco', roof: '#2e3135', roofKind: 'tile', trim: '#2e3135', accent: '#c9a54a', door: '#3a2a1e', plinthKind: 'stone', plinth: '#8f8a80' },
  mosque: { wall: '#f1ebe0', wallKind: 'stucco', roof: '#3a7a8c', roofKind: 'seam', trim: '#d9c9a8', accent: '#3a7a8c', door: '#3a2a1e', plinthKind: 'stone', plinth: '#b8ae9c' },
  shrine: { wall: '#efe6d2', wallKind: 'stucco', roof: '#3a3530', roofKind: 'shingle', trim: '#c0392b', accent: '#c0392b', door: '#5a3a20', plinthKind: 'stone', plinth: '#8f8a80' },
  cathedral: { wall: '#bdb3a2', wallKind: 'stone', roof: '#4a5560', roofKind: 'seam', trim: '#d4cab8', accent: '#3a2a1e', door: '#3a2a1e', plinthKind: 'stone', plinth: '#8f877a' },
};

/** Curved east-asian roof: hip frustum with upturned corners. */
function curvedRoof(B, w, d, y, { over = 1.4, rise = 1.6 } = {}) {
  const Lx = w + over * 2;
  const Lz = d + over * 2;
  const g = new THREE.PlaneGeometry(Lx, Lz, 16, 16).rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (Lx / 2);
    const z = p.getZ(i) / (Lz / 2);
    const e = Math.min(1, Math.max(Math.abs(x), Math.abs(z)));
    const corner = Math.abs(x) * Math.abs(z);
    p.setY(i, rise * (1 - e) ** 1.6 + corner ** 3 * 0.6);
  }
  g.computeVertexNormals();
  B.add(B.mats.roof, g, new THREE.Matrix4().makeTranslation(0, y + 0.25, 0));
  // thickness: underside + eave band
  B.add(B.mats.trim, new THREE.PlaneGeometry(Lx, Lz).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, y + 0.2, 0));
  B.box(B.mats.trim, w + 0.3, 0.35, d + 0.3, 0, y + 0.1, 0, 0, 0.04);
  return y + 0.25 + rise;
}

export const createTemple = makeBuilding('temple', TEMPLE_VARIANTS, (B, o, d, m, v) => {
  if (v === 'greek') {
    const w = 18;
    const dp = 32;
    const g = 1.6;
    const colH = 9;
    // stylobate
    for (let s = 0; s < 3; s++) B.box(B.mats.plinth, w + 3 - s * 0.8, g / 3, dp + 3 - s * 0.8, 0, (g / 3) * (s + 0.5), 0, 0, 0.03);
    // cella
    block(B, w - 6, colH, dp - 8, { y0: g, plinth: 0 });
    B.local(0, 0, (dp - 8) / 2, 0, () => door(B, 0, g, 2.6, 5, { mat: B.mats.door }));
    // peristyle
    const R = 0.75;
    const col = new THREE.CylinderGeometry(R * 0.85, R, colH - 0.6, 20, 1);
    const cap = new THREE.BoxGeometry(R * 2.4, 0.3, R * 2.4);
    const ring = [];
    for (const x of spread(w, 6, 1)) ring.push([x, -dp / 2 + 1], [x, dp / 2 - 1]);
    for (const z of spread(dp, 13, 1).slice(1, -1)) ring.push([-w / 2 + 1, z], [w / 2 - 1, z]);
    for (const [x, z] of ring) {
      B.add(m.trim, col, new THREE.Matrix4().makeTranslation(x, g + (colH - 0.6) / 2, z));
      B.add(m.trim, cap, new THREE.Matrix4().makeTranslation(x, g + colH - 0.45, z));
    }
    B.box(m.trim, w, 1.2, dp, 0, g + colH + 0.3, 0, 0, 0.04);
    B.box(m.trim, w + 0.4, 0.3, dp + 0.4, 0, g + colH + 1.05, 0, 0, 0.03);
    gableRoof(B, dp, w, g + colH + 1.2, { pitch: 0.28, overhang: 0.3, ridgeAlong: 'z', gableMat: m.trim, fascia: m.trim, gutter: false });
    return;
  }
  if (v === 'pagoda') {
    const tiers = floorsOf(o, 5);
    let y = 0;
    B.box(B.mats.plinth, 14, 1.2, 14, 0, 0.6, 0, 0, 0.05);
    y = 1.2;
    for (let t = 0; t < tiers; t++) {
      const s = 9 - t * (5 / tiers);
      const h = t === 0 ? 4 : 2.6;
      block(B, s, h, s, { y0: y, plinth: 0 });
      facades(B, s, s, () => {
        if (t === 0) door(B, 0, y, 1.8, 2.8, { mat: B.mats.door });
        else windowUnit(B, 0, y + 0.5, 1.2, 1.4, { style: 'grid', frame: m.trim, sill: false });
        for (const x of [-s / 2 + 0.25, s / 2 - 0.25]) B.box(m.trim, 0.3, h, 0.3, x, y + h / 2, 0.1, 0, 0.03);
      });
      // balcony railing between tiers
      if (t > 0) railingRun(B, -s / 2 - 0.4, s / 2 + 0.4, s / 2 + 0.4, y, m.trim, { height: 0.7, spacing: 0.3 });
      y = curvedRoof(B, s, s, y + h, { over: 1.6 - t * 0.12, rise: 1.4 }) - 1.1;
    }
    // finial
    B.cyl(m.accent, 0.12, 0.2, 4, 0, y + 1.1 + 2, 0, 10);
    for (let k = 0; k < 5; k++) B.add(m.accent, new THREE.TorusGeometry(0.35, 0.07, 6, 16).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, y + 1.6 + k * 0.5, 0));
    return;
  }
  if (v === 'shrine') {
    // raised wooden hall + torii gate
    B.box(B.mats.plinth, 12, 0.8, 10, 0, 0.4, 0, 0, 0.05);
    block(B, 9, 3.6, 7, { y0: 0.8, plinth: 0 });
    facades(B, 9, 7, (side) => {
      if (side === 'front') door(B, 0, 0.8, 3, 2.6, { double: true, mat: B.mats.door });
      else windowUnit(B, 0, 2, 2.4, 1.2, { style: 'grid', frame: m.trim, sill: false });
    });
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) B.box(m.trim, 0.35, 3.6, 0.35, sx * 4.4, 0.8 + 1.8, sz * 3.4, 0, 0.04);
    curvedRoof(B, 9, 7, 4.4, { over: 1.6, rise: 2.2 });
    // torii
    const red = m.accent;
    for (const s of [-1, 1]) B.cyl(red, 0.28, 0.33, 5.2, s * 2.6, 2.6, 12, 16);
    B.box(red, 6.4, 0.35, 0.5, 0, 4.2, 12, 0, 0.05);
    B.add(B.mats.dark, new THREE.BoxGeometry(7.6, 0.45, 0.7), new THREE.Matrix4().makeTranslation(0, 5.4, 12));
    B.box(red, 0.35, 0.9, 0.35, 0, 4.75, 12, 0, 0.03);
    // stone path + lanterns
    for (let z = 5.5; z < 11.5; z += 1) B.box(B.mats.plinth, 1.6, 0.08, 0.8, 0, 0.04, z, 0, 0.02);
    for (const s of [-1, 1]) {
      B.box(B.mats.plinth, 0.6, 0.3, 0.6, s * 2, 0.15, 8, 0, 0.05);
      B.box(B.mats.plinth, 0.25, 0.9, 0.25, s * 2, 0.75, 8, 0, 0.03);
      B.box(B.mats.plinth, 0.6, 0.5, 0.6, s * 2, 1.45, 8, 0, 0.05);
      B.add(B.mats.plinth, new THREE.ConeGeometry(0.55, 0.4, 4).rotateY(Math.PI / 4), new THREE.Matrix4().makeTranslation(s * 2, 1.9, 8));
    }
    return;
  }
  if (v === 'mosque') {
    const w = 24;
    const g = 0.8;
    const h = g + floorsOf(o, 2) * 4;
    block(B, w, h, w, { plinth: g });
    facades(B, w, w, (side, width) => {
      for (const x of spread(width, 5, 2.5)) {
        if (side === 'front' && Math.abs(x) < 3) continue;
        windowUnit(B, x, g + 1.2, 1.4, 2.6, { style: 'arch', frame: m.trim });
      }
      if (side === 'front') {
        door(B, 0, g, 2.6, 3.6, { double: true, mat: B.mats.door });
        B.box(m.trim, 6, h + 2, 0.6, 0, (h + 2) / 2, 0.3, 0, 0.05);
        B.add(B.mats.dark, new THREE.PlaneGeometry(4, 5.5), new THREE.Matrix4().makeTranslation(0, g + 2.75, 0.61));
      }
    });
    B.box(m.trim, w + 0.4, 0.5, w + 0.4, 0, h + 0.25, 0, 0, 0.05);
    flatRoof(B, w, w, h + 0.5, { parapet: 0.6, mat: m.trim, cap: m.trim });
    dome(B, { y: h + 0.5, r: 8, drumH: 3, mat: B.mats.roof, drumMat: B.mats.wall, onion: false });
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) dome(B, { x: sx * 8.5, z: sz * 8.5, y: h + 0.5, r: 2, drumH: 1.2, mat: B.mats.roof, drumMat: B.mats.wall, lantern: false });
    // minarets
    for (const s of [-1, 1]) {
      const mx = s * (w / 2 + 3);
      const mz = w / 2 - 2;
      B.add(B.mats.wall, new THREE.CylinderGeometry(1.2, 1.4, 28, 16), new THREE.Matrix4().makeTranslation(mx, 14, mz));
      for (const y of [12, 22]) {
        B.add(m.trim, new THREE.CylinderGeometry(1.9, 1.3, 0.8, 16), new THREE.Matrix4().makeTranslation(mx, y, mz));
        railingRun(B, mx - 1.5, mx + 1.5, mz + 1.6, y + 0.4, m.trim, { height: 0.8, spacing: 0.25 });
      }
      B.add(B.mats.roof, new THREE.ConeGeometry(1.3, 4, 16), new THREE.Matrix4().makeTranslation(mx, 30, mz));
      B.cyl(m.trim, 0.04, 0.06, 1.4, mx, 32.7, mz, 6);
    }
    return;
  }
  // cathedral: long nave, transept, twin west towers with spires, rose window, flying buttresses
  const nw = 14;
  const nl = 46;
  const nh = 16;
  block(B, nw, nh, nl, { plinth: 0.8 });
  facades(B, nw, nl, (side, width) => {
    if (side === 'left' || side === 'right') for (const x of spread(width, 8, 4)) windowUnit(B, x, 4, 1.6, 8, { style: 'arch', frame: m.trim });
  });
  gableRoof(B, nl, nw, nh, { pitch: 1.2, overhang: 0.4, ridgeAlong: 'z' });
  // transept
  block(B, 34, nh, 12, { cz: -6, plinth: 0.8 });
  facades(B, 34, 12, (side) => {
    if (side === 'left' || side === 'right') {
      windowUnit(B, 0, 5, 3.5, 7, { style: 'arch', frame: m.trim });
    }
  }, { cz: -6 });
  gableRoof(B, 34, 12, nh, { pitch: 1.2, overhang: 0.4, cz: -6 });
  // flying buttresses
  for (const s of [-1, 1]) for (const z of spread(nl, 6, 4)) {
    if (Math.abs(z + 6) < 7) continue;
    B.box(B.mats.wall, 1.2, 10, 1.4, s * (nw / 2 + 3.5), 5, z, 0, 0.05);
    // sloped strut from the pier top up to the nave wall
    B.local(s * (nw / 2 + 1.75), 0, z, Math.PI / 2, () => (s > 0 ? B.slab(B.mats.wall, -1.9, 13, 1.9, 9.7, 1.0, 0.6) : B.slab(B.mats.wall, -1.9, 9.7, 1.9, 13, 1.0, 0.6)));
  }
  // west front towers
  const fz = nl / 2;
  for (const s of [-1, 1]) {
    B.box(B.mats.wall, 7, 30, 7, s * 7, 15, fz - 2, 0, 0.06);
    B.local(s * 7, 0, fz + 1.5, 0, () => {
      for (const y of [8, 16, 23]) windowUnit(B, 0, y, 1.4, 4, { style: 'arch', frame: m.trim });
    });
    B.add(B.mats.roof, new THREE.ConeGeometry(4.6, 16, 8).rotateY(Math.PI / 8), new THREE.Matrix4().makeTranslation(s * 7, 30 + 8, fz - 2));
    for (const [cx, cz] of [[-3.3, -3.3], [3.3, -3.3], [-3.3, 3.3], [3.3, 3.3]]) B.add(B.mats.wall, new THREE.ConeGeometry(0.5, 3, 6), new THREE.Matrix4().makeTranslation(s * 7 + cx, 31.5, fz - 2 + cz));
  }
  B.box(B.mats.wall, 7, 24, 3, 0, 12, fz + 0.3, 0, 0.05);
  B.local(0, 0, fz + 1.8, 0, () => {
    door(B, 0, 0.8, 3.4, 6, { double: true, mat: B.mats.door });
    // rose window
    B.add(B.mats.glow, new THREE.CircleGeometry(2.6, 32), new THREE.Matrix4().makeTranslation(0, 15, 0.01));
    B.add(B.mats.glass, new THREE.CircleGeometry(2.6, 32), new THREE.Matrix4().makeTranslation(0, 15, 0.05));
    B.add(m.trim, new THREE.TorusGeometry(2.7, 0.22, 8, 32), new THREE.Matrix4().makeTranslation(0, 15, 0.1));
    for (let k = 0; k < 12; k++) B.add(m.trim, new THREE.BoxGeometry(0.12, 5.2, 0.12).rotateZ((k / 12) * Math.PI), new THREE.Matrix4().makeTranslation(0, 15, 0.08));
    B.openings.push(B.worldRect(-2.9, 12, 2.9, 18));
  });
  B.add(B.mats.wall, new THREE.ConeGeometry(0.8, 9, 8), new THREE.Matrix4().makeTranslation(0, nh + 9.6 + 4.5, -6));
  B.box(B.mats.wall, 2.2, 3, 2.2, 0, nh + 8.1 + 1.5, -6, 0, 0.04);
});

/* ------------------------------ Stadium ---------------------------- */
export const STADIUM_VARIANTS = {
  arena: { wall: '#d6d3cc', wallKind: 'concrete', roof: '#e9eef2', roofKind: 'concrete', trim: '#2c4f7c', accent: '#b3261e', door: '#2a2d30' },
  ballpark: { wall: '#9c4a36', wallKind: 'brick', roof: '#666', roofKind: 'concrete', trim: '#1f3d2b', accent: '#1f3d2b', door: '#2a2d30' },
};

export const createStadium = makeBuilding('stadium', STADIUM_VARIANTS, (B, o, d, m, v) => {
  const rx = 48;
  const rz = 36;
  const tiers = floorsOf(o, 2);
  const h = 8 + tiers * 6;
  const seg = 48;
  const grass = new THREE.MeshStandardMaterial({ name: 'pitch', color: '#3f7f3a', roughness: 1 });
  B.add(grass, new THREE.CylinderGeometry(1, 1, 0.1, 48).scale(rx - 14, 1, rz - 14), new THREE.Matrix4().makeTranslation(0, 0.05, 0));
  // pitch lines
  const line = new THREE.MeshStandardMaterial({ name: 'line', color: '#f4f4ee' });
  B.box(line, 0.15, 0.02, (rz - 18) * 2, 0, 0.11, 0, 0, 0);
  B.add(line, new THREE.TorusGeometry(6, 0.08, 4, 40).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, 0.11, 0));
  // outer wall ring (oval) with arched openings, inner seating bowl
  const outer = new THREE.CylinderGeometry(1, 1, h, seg, 1, true).scale(rx, 1, rz);
  B.add(B.mats.wall, outer, new THREE.Matrix4().makeTranslation(0, h / 2, 0));
  B.add(B.mats.wall, new THREE.CylinderGeometry(1, 1, h, seg, 1, true).scale(rx - 1, 1, rz - 1).applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 1)), new THREE.Matrix4().makeTranslation(0, h / 2, 0));
  for (let k = 0; k < seg; k++) {
    const a = (k / seg) * Math.PI * 2;
    const x = Math.sin(a) * rx;
    const z = Math.cos(a) * rz;
    const nrm = Math.atan2(Math.sin(a) / rx, Math.cos(a) / rz);
    B.local(x, 0, z, nrm, () => {
      for (let t = 0; t < tiers + 1; t++) windowUnit(B, 0, 1.2 + t * 6, 2.2, t === 0 ? 3.6 : 2.4, { style: 'none', frame: m.trim, sill: false, depth: 0.12 });
    });
    const a2 = a + Math.PI / seg;
    B.local(Math.sin(a2) * rx, 0, Math.cos(a2) * rz, Math.atan2(Math.sin(a2) / rx, Math.cos(a2) / rz), () => B.box(m.trim, 0.7, h, 0.5, 0, h / 2, 0.1, 0, 0.05));
  }
  // seating bowl: stepped rings (tread annulus + riser) descending towards the pitch
  const seat = new THREE.MeshStandardMaterial({ name: 'seats', color: m.accent.color.clone(), roughness: 0.7 });
  const rows = 14;
  const rowAt = (r) => ({ sx: rx - 1.0 - (r / rows) * 12, sz: rz - 1.0 - (r / rows) * 12, y: h - 1 - (r / rows) * (h - 2) });
  for (let r = 0; r < rows; r++) {
    const a = rowAt(r);
    const b = rowAt(r + 1);
    B.add(seat, new THREE.RingGeometry(b.sx / a.sx, 1, seg, 1).rotateX(-Math.PI / 2).scale(a.sx, 1, a.sz), new THREE.Matrix4().makeTranslation(0, a.y, 0));
    const rh = a.y - (r === rows - 1 ? 0.1 : b.y);
    B.add(B.mats.concrete, new THREE.CylinderGeometry(1, 1, rh, seg, 1, true).scale(b.sx, 1, b.sz), new THREE.Matrix4().makeTranslation(0, a.y - rh / 2, 0));
  }
  // top tread joins the outer wall
  B.add(B.mats.concrete, new THREE.RingGeometry((rx - 1.0) / (rx - 0.5), 1, seg, 1).rotateX(-Math.PI / 2).scale(rx - 0.5, 1, rz - 0.5), new THREE.Matrix4().makeTranslation(0, h - 1, 0));
  if (v === 'arena') {
    // cantilevered roof ring on masts
    const roof = new THREE.CylinderGeometry(1, 1, 0.6, seg, 1, false).scale(rx + 1, 1, rz + 1);
    const hole = new THREE.CylinderGeometry(1, 1, 0.62, seg, 1, false).scale(rx - 16, 1, rz - 16);
    void hole;
    B.add(B.mats.roof, new THREE.RingGeometry(0.62, 1, seg, 1).rotateX(-Math.PI / 2).scale(rx + 2, 1, rz + 2), new THREE.Matrix4().makeTranslation(0, h + 6, 0));
    B.add(B.mats.roof, new THREE.RingGeometry(0.62, 1, seg, 1).rotateX(Math.PI / 2).scale(rx + 2, 1, rz + 2), new THREE.Matrix4().makeTranslation(0, h + 5.9, 0));
    void roof;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      B.cyl(B.mats.metal, 0.4, 0.5, 6, Math.sin(a) * (rx - 0.5), h + 3, Math.cos(a) * (rz - 0.5), 10);
    }
  } else {
    // floodlight towers
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const x = sx * (rx - 6);
      const z = sz * (rz - 6);
      B.cyl(B.mats.metal, 0.4, 0.7, h + 18, x, (h + 18) / 2, z, 10);
      B.box(B.mats.metal, 6, 3, 0.6, x, h + 18 + 1.2, z, 0, 0.05);
      B.local(x, 0, z, Math.atan2(-x, -z), () => {
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) B.add(B.mats.glow, new THREE.PlaneGeometry(1.2, 1.1), new THREE.Matrix4().makeTranslation(-2.1 + i * 1.4, h + 18 + 0.6 + j * 1.2, 0.31));
      });
    }
    // scoreboard
    B.box(B.mats.dark, 16, 7, 1, 0, h + 4, -rz + 2, 0, 0.1);
    for (const s of [-1, 1]) B.box(B.mats.metal, 0.6, h + 0.5, 0.6, s * 6, (h + 0.5) / 2, -rz + 2, 0, 0.05);
  }
  B.local(0, 0, rz, 0, () => {
    signBoard(B, 0, h - 2, 0.3, 14, 2, v === 'arena' ? 'CITY ARENA' : 'BALLPARK', { bg: `#${m.trim.color.getHexString()}`, fg: '#ffffff' });
    // stand-off brackets from the curved wall into the back of the sign
    for (const x of [-5.5, 0, 5.5]) for (const dy of [-0.6, 0.6]) B.box(B.mats.dark, 0.16, 0.16, 0.62, x, h - 2 + dy, -0.04, 0, 0);
  });
});

/* --------------------------- Train station ------------------------- */
export const TRAIN_STATION_VARIANTS = {
  classic: { wall: '#b5654a', wallKind: 'brick', roof: '#4a4d52', roofKind: 'seam', trim: '#efe7d8', accent: '#1f3d2b', door: '#1f3d2b', plinthKind: 'stone', plinth: '#a59a88' },
  platform: { wall: '#e7e3da', wallKind: 'stucco', roof: '#3d4f6b', roofKind: 'seam', trim: '#3d4f6b', accent: '#3d4f6b', door: '#2a2d30' },
  modern: { wall: '#d0d4d7', wallKind: 'concrete', roof: '#9aa4ab', roofKind: 'seam', trim: '#2a2d30', accent: '#d35400', door: '#2a2d30' },
};

function track(B, len, z) {
  const rail = B.railMat ??= M.metal('#8a8f94', 0.35);
  const sleeper = B.sleeperMat ??= surface('plank', '#5a4432', { name: 'sleepers' });
  B.box(surface('stucco', '#8f8a80', { name: 'ballast' }), len, 0.25, 3.2, 0, 0.125, z, 0, 0.08);
  for (let x = -len / 2 + 0.4; x < len / 2; x += 0.65) B.box(sleeper, 0.25, 0.16, 2.6, x, 0.25 + 0.08, z, 0, 0.02);
  for (const s of [-0.72, 0.72]) B.box(rail, len, 0.14, 0.08, 0, 0.41 + 0.07, z + s, 0, 0.01);
}

export const createTrainStation = makeBuilding('train-station', TRAIN_STATION_VARIANTS, (B, o, d, m, v) => {
  const L = v === 'platform' ? 40 : 60;
  if (v === 'classic') {
    // head building with clock tower + barrel-vaulted train shed behind
    const floors = floorsOf(o, 2);
    const top = gridBody(B, m, { w: 36, d: 14, floors, fh: 4.4, g: 0.8, cz: 12, spacing: 3.2, winW: 1.5, winH: 2.6, style: 'arch', header: m.trim, doorGap: 5 });
    B.local(0, 0, 19, 0, () => {
      door(B, 0, 0.8, 3.2, 3.6, { double: true, glass: true, frame: m.trim });
      signBoard(B, 0, 5.2, 0.05, 9, 0.9, 'CENTRAL STATION', { bg: '#1f3d2b', fg: '#f0e6c8' });
    });
    gableRoof(B, 36, 14, top, { pitch: 0.55, overhang: 0.4, cz: 12 });
    clockTower(B, { x: 0, z: 12, y0: 0, s: 5, h: top + 7, roof: 'pyramid' });
    // barrel shed
    const R = 13;
    const shed = new THREE.CylinderGeometry(R, R, 40, 32, 1, true, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
    B.add(B.mats.glass, shed, new THREE.Matrix4().makeTranslation(0, 7, -15));
    for (let k = 0; k <= 8; k++) B.add(B.mats.metal, new THREE.TorusGeometry(R, 0.18, 6, 32, Math.PI), new THREE.Matrix4().makeTranslation(0, 7, -35 + k * 5));
    for (const s of [-1, 1]) B.box(m.trim, 0.8, 7, 40, s * R, 3.5, -15, 0, 0.05);
    B.local(0, 0, 0, Math.PI / 2, () => { track(B, 44, -6); track(B, 44, 6); });
    for (const x of [-11, 0, 11]) B.box(B.mats.concrete, 3, 1.0, 40, x, 0.5, -15, 0, 0.05);
    return;
  }
  // platform station: long platform with canopy, small station building, track
  const pd = 6;
  B.box(B.mats.concrete, L, 1.0, pd, 0, 0.5, 0, 0, 0.05);
  B.box(new THREE.MeshStandardMaterial({ name: 'tactile', color: '#f2c200', roughness: 0.8 }), L - 0.4, 0.02, 0.5, 0, 1.01, -pd / 2 + 0.6, 0, 0);
  track(B, L + 10, -pd / 2 - 1.9);
  const ch = 3.6;
  for (const x of spread(L - 8, 8, 0)) {
    B.box(B.mats.metal, 0.25, ch, 0.25, x, 1 + ch / 2, 1.2, 0, 0.03);
    // bench + sign
    if (Math.round(x) % 2 === 0) {
      B.box(surface('plank', '#8a6b4e', { name: 'bench' }), 1.8, 0.08, 0.45, x + 1.4, 1.45, 1.6, 0, 0.02);
      for (const s of [-1, 1]) B.box(B.mats.metal, 0.06, 0.45, 0.4, x + 1.4 + s * 0.8, 1.22, 1.6, 0, 0.01);
    }
  }
  if (v === 'modern') {
    // wavy glass canopy
    const g = new THREE.PlaneGeometry(L - 4, pd + 2, 40, 1).rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, Math.sin(p.getX(i) / 4) * 0.4 + (p.getZ(i) > 0 ? 0.3 : -0.1));
    g.computeVertexNormals();
    B.add(new THREE.MeshPhysicalMaterial({ name: 'canopy_glass', color: '#cfe0e8', roughness: 0.1, transparent: true, opacity: 0.55, side: THREE.DoubleSide }), g, new THREE.Matrix4().makeTranslation(0, 1 + ch + 0.6, 0.5));
    B.box(m.accent, L - 4, 0.3, 0.3, 0, 1 + ch + 0.15, 1.2, 0, 0.05);
  } else {
    B.slab(B.mats.roof, -pd / 2 - 0.6, 1 + ch + 0.2, pd / 2 + 0.4, 1 + ch + 0.8, L - 6, 0.12);
    B.box(m.trim, L - 6, 0.25, 0.25, 0, 1 + ch + 0.05, 1.2, 0, 0.03);
  }
  // station house on the platform
  const floors = floorsOf(o, 1);
  const top = gridBody(B, m, { w: 12, d: 7, floors, fh: 3.4, g: 0, y0: 1, cx: L / 2 - 9, cz: pd / 2 + 3.5, spacing: 3, winW: 1.3, winH: 1.6, style: v === 'modern' ? 'none' : 'double', frame: v === 'modern' ? m.trim : undefined });
  B.box(B.mats.concrete, 12.2, 1, 7.2, L / 2 - 9, 0.5, pd / 2 + 3.5, 0, 0.05);
  if (v === 'modern') flatRoof(B, 12, 7, top, { parapet: 0.4, cx: L / 2 - 9, cz: pd / 2 + 3.5 });
  else gableRoof(B, 12, 7, top, { pitch: 0.6, overhang: 0.6, cx: L / 2 - 9, cz: pd / 2 + 3.5 });
  // hanging station sign
  B.cyl(B.mats.metal, 0.05, 0.05, 1.0, -L / 4, 1 + ch - 0.5, 1.2, 6);
  B.local(-L / 4, 0, 1.2, 0, () => signBoard(B, 0, 1 + ch - 1.3, 0, 3.4, 0.6, 'PLATFORM 1', { bg: `#${m.accent.color.getHexString()}`, fg: '#ffffff', logo: false }));
});

/* ------------------------------ Airport ---------------------------- */
export const AIRPORT_VARIANTS = {
  terminal: { wall: '#dfe3e6', wallKind: 'concrete', roof: '#c9ced3', roofKind: 'seam', trim: '#2a2d30', accent: '#4d6a80', door: '#2a2d30' },
  'control-tower': { wall: '#e9e8e4', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#2a2d30', accent: '#4d6a80', door: '#2a2d30' },
  hangar: { wall: '#9aa3ab', wallKind: 'corrugated', roof: '#8a9196', roofKind: 'corrugated', trim: '#2e3236', accent: '#d35400', door: '#2a2d30' },
};

export const createAirport = makeBuilding('airport', AIRPORT_VARIANTS, (B, o, d, m, v) => {
  if (v === 'control-tower') {
    const h = floorsOf(o, 8) * 4;
    block(B, 14, 6, 10, { plinth: 0.3, cz: 8 });
    B.local(0, 0, 13, 0, () => storefront(B, m, 12, 0.3, 5.5, { frame: m.trim, fascia: false }));
    flatRoof(B, 14, 10, 6, { parapet: 0.5, cz: 8 });
    B.add(B.mats.wall, new THREE.CylinderGeometry(2.6, 3.2, h, 20), new THREE.Matrix4().makeTranslation(0, h / 2, 0));
    for (let y = 4; y < h - 2; y += 4) B.add(B.mats.glass, new THREE.CylinderGeometry(2.62 + (h - y) / h * 0.6, 2.62 + (h - y) / h * 0.6, 0.6, 20, 1, true), new THREE.Matrix4().makeTranslation(0, y, 0));
    // cab: flared octagonal glass room
    B.add(B.mats.wall, new THREE.CylinderGeometry(5.5, 3, 2.5, 8), new THREE.Matrix4().makeTranslation(0, h + 1.25, 0));
    B.add(B.mats.glow, new THREE.CylinderGeometry(5.5, 5.0, 3.4, 8, 1, true), new THREE.Matrix4().makeTranslation(0, h + 2.5 + 1.7, 0));
    B.add(new THREE.MeshPhysicalMaterial({ name: 'cab_glass', color: '#3c5a6e', metalness: 0.4, roughness: 0.05, transparent: true, opacity: 0.75 }), new THREE.CylinderGeometry(5.6, 5.1, 3.4, 8, 1, true), new THREE.Matrix4().makeTranslation(0, h + 2.5 + 1.7, 0));
    B.add(m.trim, new THREE.CylinderGeometry(6.0, 5.6, 0.8, 8), new THREE.Matrix4().makeTranslation(0, h + 5.9 + 0.4, 0));
    B.add(B.mats.metal, new THREE.CylinderGeometry(0.1, 0.15, 6, 8), new THREE.Matrix4().makeTranslation(0, h + 6.7 + 3, 0));
    B.add(new THREE.MeshStandardMaterial({ name: 'beacon', color: '#ff2a1a', emissive: '#ff2a1a', emissiveIntensity: 1 }), new THREE.SphereGeometry(0.3, 10, 8), new THREE.Matrix4().makeTranslation(0, h + 12.9, 0));
    B.add(B.mats.metal, new THREE.SphereGeometry(1.2, 16, 12), new THREE.Matrix4().makeTranslation(3.2, h + 6.7 + 1.0, 0));
    B.add(B.mats.metal, new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8), new THREE.Matrix4().makeTranslation(3.2, h + 6.7 - 0.1, 0));
    return;
  }
  if (v === 'hangar') {
    const W = 50;
    const D = 40;
    const R = W / 2;
    B.box(B.mats.concrete, W + 6, 0.2, D + 30, 0, 0.1, 10, 0, 0.05);
    const shell = new THREE.CylinderGeometry(R, R, D, 40, 1, true, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2).scale(1, 0.55, 1);
    B.add(B.mats.wall, shell, new THREE.Matrix4().makeTranslation(0, 0.2, 0));
    // back wall
    B.local(0, 0, -D / 2, Math.PI, () => B.add(B.mats.wall, new THREE.CircleGeometry(R, 40, 0, Math.PI).scale(1, 0.55, 1), new THREE.Matrix4().makeTranslation(0, 0.2, 0)));
    // sliding doors (half open) + door frame arch
    B.local(0, 0, D / 2, 0, () => {
      for (const s of [-1, 1]) B.box(m.trim, 14, R * 0.55 * 0.82, 0.5, s * (R - 8), 0.2 + (R * 0.55 * 0.82) / 2, 0.3, 0, 0.05);
      B.add(B.mats.dark, new THREE.CircleGeometry(R - 0.3, 40, 0, Math.PI).scale(1, 0.55, 1), new THREE.Matrix4().makeTranslation(0, 0.2, -0.5));
      signBoard(B, 0, R * 0.55 - 1.5, 0.2, 14, 1.6, 'HANGAR 3', { bg: `#${m.accent.color.getHexString()}`, fg: '#ffffff' });
      B.add(B.mats.trim, new THREE.TorusGeometry(R, 0.3, 6, 40, Math.PI).scale(1, 0.55, 1), new THREE.Matrix4().makeTranslation(0, 0.2, 0.1));
    });
    return;
  }
  // terminal: long glass hall with wave roof, jet bridges, control tower stub
  const L = 80;
  const Dd = 28;
  const h = floorsOf(o, 2) * 6;
  block(B, L, h, Dd, { plinth: 0.3 });
  const glass = new THREE.MeshPhysicalMaterial({ name: 'terminal_glass', color: '#5c7a8e', metalness: 0.5, roughness: 0.06, clearcoat: 1 });
  facades(B, L, Dd, (side, width) => {
    B.add(B.mats.glow, new THREE.PlaneGeometry(width - 2, h - 1.5), new THREE.Matrix4().makeTranslation(0, h / 2 + 0.3, 0.01));
    B.add(glass, new THREE.PlaneGeometry(width - 2, h - 1.5), new THREE.Matrix4().makeTranslation(0, h / 2 + 0.3, 0.06));
    for (const x of spread(width, Math.round(width / 3), 1)) B.box(m.trim, 0.12, h - 1.5, 0.2, x, h / 2 + 0.3, 0.1, 0, 0.02);
    B.box(m.trim, width - 2, 0.25, 0.3, 0, h / 2 + 0.3, 0.12, 0, 0.03);
    B.openings.push(B.worldRect(-width / 2 + 1, 1, width / 2 - 1, h - 0.4));
    if (side === 'front') {
      signBoard(B, 0, h + 1.6, 1.5, 16, 1.8, 'AIRPORT', { bg: '#1d2227', fg: '#ffffff' });
      for (const x of [-20, 0, 20]) door(B, x, 0.3, 3, 2.8, { double: true, glass: true, frame: m.trim });
      B.slab(m.trim, 0, h * 0.6, 8, h * 0.6, L - 10, 0.4);
      for (const x of spread(L - 12, 8, 0)) B.box(m.trim, 0.4, h * 0.6, 0.4, x, h * 0.3, 7.6, 0, 0.05);
    }
  });
  // wave roof
  const g = new THREE.PlaneGeometry(L + 6, Dd + 10, 48, 1).rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, Math.sin((p.getX(i) / (L + 6)) * Math.PI * 3) * 1.2 + 1.4);
  g.computeVertexNormals();
  const roofMat = B.mats.roof.clone();
  roofMat.side = THREE.DoubleSide;
  B.add(roofMat, g, new THREE.Matrix4().makeTranslation(0, h, 0));
  for (const x of spread(L, 9, 1)) B.cyl(B.mats.metal, 0.25, 0.25, 2.6 + Math.sin((x / (L + 6)) * Math.PI * 3) * 1.2, x, h + (2.6 + Math.sin((x / (L + 6)) * Math.PI * 3) * 1.2) / 2 - 0.2, 0, 8);
  // jet bridges on the airside
  // jet bridges: stub → rotunda on a column → fixed tunnel → telescoping tunnel → cab + canopy, on a wheeled drive column
  const zf = -Dd / 2;
  const bridgeGlass = new THREE.MeshPhysicalMaterial({ name: 'bridge_glass', color: '#3d5566', metalness: 0.4, roughness: 0.05 });
  const lead = new THREE.MeshStandardMaterial({ name: 'apron_line', color: '#f2c200', roughness: 0.7 });
  for (const x of [-26, 0, 26]) {
    B.box(B.mats.wall, 3, 3, 3.2, x, 5.65, zf - 1.5, 0, 0.08);
    B.cyl(B.mats.metal, 0.5, 0.5, 4.0, x, 2.0, zf - 4.6, 16);
    B.cyl(B.mats.wall, 2.3, 2.3, 3.8, x, 5.7, zf - 4.6, 28);
    B.cyl(B.mats.metal, 2.42, 2.42, 0.25, x, 7.7, zf - 4.6, 28);
    B.box(B.mats.wall, 2.7, 2.9, 12, x, 5.65, zf - 12.5, 0, 0.06);
    B.box(B.mats.wall, 2.5, 2.7, 8.4, x, 5.6, zf - 21.9, 0, 0.06);
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) B.box(bridgeGlass, 0.04, 0.55, 0.9, x + s * 1.36, 6.1, zf - 8.5 - k * 3, 0, 0.01);
    B.box(B.mats.wall, 3.4, 3.1, 2.6, x, 5.65, zf - 27.3, 0, 0.08);
    B.box(B.mats.dark, 3.1, 3.3, 0.9, x, 5.6, zf - 28.9, 0, 0.12);
    for (const s of [-1, 1]) B.box(B.mats.metal, 0.35, 4.2, 0.35, x + s * 0.9, 2.2, zf - 24, 0, 0.03);
    B.box(B.mats.metal, 2.2, 0.35, 0.6, x, 0.75, zf - 24, 0, 0.04);
    for (const s of [-1, 1]) for (const dz of [-0.35, 0.35]) B.box(B.mats.dark, 0.3, 0.76, 0.76, x + s * 1.2, 0.46, zf - 24 + dz, 0, 0.3);
    B.box(lead, 0.2, 0.012, 34, x, 0.086, zf - 22, 0, 0);
    B.box(lead, 6, 0.012, 0.2, x, 0.086, zf - 34, 0, 0);
  }
  B.box(B.mats.concrete, L + 30, 0.08, 40, 0, 0.04, -Dd / 2 - 18, 0, 0.02);
});

/* --------------------------- Parking garage ------------------------ */
export const PARKING_VARIANTS = {
  'open-deck': { wall: '#bdb9b1', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#2c4f7c', accent: '#f2c200', door: '#2a2d30' },
  'clad': { wall: '#9aa4ab', wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: '#3a3f44', accent: '#d35400', door: '#2a2d30' },
};

export const createParkingGarage = makeBuilding('parking-garage', PARKING_VARIANTS, (B, o, d, m, v) => {
  const levels = floorsOf(o, 4);
  const W = 36;
  const D = 30;
  const lh = 3.0;
  const asphalt = new THREE.MeshStandardMaterial({ name: 'asphalt', color: '#4a4c50', roughness: 0.95 });
  const line = new THREE.MeshStandardMaterial({ name: 'line', color: '#f2f2ee' });
  let cladMat;
  const RZ0 = -4;
  const RZ1 = 10;
  for (let l = 0; l <= levels; l++) {
    const y = l * lh;
    if (l > 0) {
      // floor slab with an opening where the ramp from the level below comes up
      const rx = ((l - 1) % 2 ? -1 : 1) * 3;
      const hx0 = rx - 2.7;
      const hx1 = rx + 2.7;
      const hz0 = RZ0;
      const hz1 = RZ1;
      const piece = (x0, x1, z0, z1) => x1 - x0 > 0.05 && z1 - z0 > 0.05 && B.box(B.mats.wall, x1 - x0, 0.4, z1 - z0, (x0 + x1) / 2, y - 0.2, (z0 + z1) / 2, 0, 0.03);
      piece(-W / 2, W / 2, -D / 2, hz0);
      piece(-W / 2, W / 2, hz1, D / 2);
      piece(-W / 2, hx0, hz0, hz1);
      piece(hx1, W / 2, hz0, hz1);
    }
    B.box(asphalt, W - 0.6, 0.02, D - 0.6, 0, y + 0.01 + (l === 0 ? 0.0 : 0), 0, 0, 0);
    for (let x = -W / 2 + 3; x < W / 2 - 2; x += 2.6) for (const z of [-D / 2 + 3, D / 2 - 3]) B.box(line, 0.1, 0.01, 4.8, x, y + 0.025, z, 0, 0);
    if (l === 0) continue;
    // spandrel walls / cladding
    for (const [len, x, z, ry] of [[W, 0, D / 2, 0], [W, 0, -D / 2, 0], [D, W / 2, 0, Math.PI / 2], [D, -W / 2, 0, Math.PI / 2]]) {
      B.local(x, 0, z, ry, () => {
        B.box(B.mats.wall, len, 1.0, 0.25, 0, y + 0.5, 0, 0, 0.04);
        if (v === 'clad' && l < levels) {
          // vertical fins clipped to two horizontal rails fixed to the spandrel face
          cladMat ??= M.metal('#8a9196', 0.4);
          for (let k = -len / 2 + 0.3; k <= len / 2; k += 0.6) B.box(cladMat, 0.12, lh - 1.1, 0.05, k, y + 1.0 + (lh - 1.1) / 2, 0.15, 0, 0);
          for (const ry0 of [y + 1.06, y + lh - 0.16]) B.box(cladMat, len - 0.1, 0.08, 0.06, 0, ry0, 0.155, 0, 0);
        }
      });
    }
  }
  // columns
  for (let x = -W / 2 + 0.3; x <= W / 2; x += W / 5 - 0.12) for (const z of [-D / 2 + 0.3, 0, D / 2 - 0.3]) B.box(B.mats.wall, 0.5, levels * lh, 0.5, x, (levels * lh) / 2, z, 0, 0.04);
  // ramp between levels in the middle aisle
  // ramps run from one deck up through the opening to the top surface of the next deck,
  // with concrete curbs along both sides
  for (let l = 0; l < levels; l++) {
    const rx = (l % 2 ? -1 : 1) * 3;
    B.slab(asphalt, RZ0, l * lh + 0.03, RZ1, (l + 1) * lh + 0.02, 5, 0.3, rx);
    for (const sx of [-2.6, 2.6]) B.slab(B.mats.wall, RZ0, l * lh + 0.25, RZ1, (l + 1) * lh + 0.24, 0.2, 0.45, rx + sx);
  }
  // stair core with sign
  block(B, 5, levels * lh + 2.5, 5, { cx: W / 2 + 2.5, cz: D / 2 - 2.5, plinth: 0.2 });
  B.local(W / 2 + 2.5, 0, D / 2, 0, () => {
    door(B, 0, 0.2, 1.1, 2.2, { glass: true, frame: m.trim });
    signBoard(B, 0, levels * lh - 1, 0.05, 2.2, 2.2, 'P', { bg: '#1f4fa0', fg: '#ffffff', emissive: 0.9, logo: false });
  });
  flatRoof(B, 5, 5, levels * lh + 2.5, { parapet: 0.4, cx: W / 2 + 2.5, cz: D / 2 - 2.5 });
  // barrier at the entrance
  B.box(m.accent, 0.4, 1.1, 0.4, -W / 2 + 4, 0.55, D / 2 + 0.6, 0, 0.04);
  B.box(new THREE.MeshStandardMaterial({ name: 'boom', color: '#f4f4f0' }), 3.4, 0.1, 0.1, -W / 2 + 4 + 1.7, 1.0, D / 2 + 0.6, 0, 0.02);
});
