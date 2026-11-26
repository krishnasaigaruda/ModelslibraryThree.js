import * as THREE from 'three';
import { group, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import * as M from '../../core/materials.js';
import {
  Builder, palette, surface, block, facades, spread, windowUnit, door, flatRoof, railingRun, acUnit, gableRoof, emblem,
} from './kit.js';
import { buildingAnimations } from './houses.js';

/* ------------------------------------------------------------------ */
/* Apartments                                                          */
/* ------------------------------------------------------------------ */

export const APARTMENT_VARIANTS = {
  brick: { floors: 5, wall: '#8e4636', wallKind: 'brick', roof: '#777', roofKind: 'concrete', trim: '#ede7db', accent: '#2b2b2b', door: '#2b2b2b' },
  modern: { floors: 6, wall: '#f2f1ed', wallKind: 'stucco', roof: '#777', roofKind: 'concrete', trim: '#2a2b2d', accent: '#5c6670', door: '#2a2b2d' },
  classic: { floors: 6, wall: '#e8dcc4', wallKind: 'stucco', roof: '#46505a', roofKind: 'seam', trim: '#f6f0e2', accent: '#1d1d1d', door: '#203040' },
  tower: { floors: 12, wall: '#c9c5bd', wallKind: 'concrete', roof: '#777', roofKind: 'concrete', trim: '#8c8c8c', accent: '#3a3f44', door: '#2a2b2d' },
};

const AFH = 3.0;

function balcony(B, x, y, w, depth, mat, railMat, glassPanel) {
  B.box(mat, w, 0.18, depth, x, y - 0.09, depth / 2);
  railingRun(B, x - w / 2 + 0.05, x + w / 2 - 0.05, depth - 0.05, y, railMat, { height: 1.0, glassPanel, spacing: 0.11 });
  B.local(x - w / 2 + 0.05, 0, 0, -Math.PI / 2, () => railingRun(B, -depth + 0.1, -0.05, 0, y, railMat, { height: 1.0, glassPanel, spacing: 0.11 }));
  B.local(x + w / 2 - 0.05, 0, 0, Math.PI / 2, () => railingRun(B, 0.05, depth - 0.1, 0, y, railMat, { height: 1.0, glassPanel, spacing: 0.11 }));
}

export function createApartment(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(APARTMENT_VARIANTS, o.variant, 'apartment');
  const d = APARTMENT_VARIANTS[variant];
  const floorMul = { low: 0.5, high: 2, highrise: 3 }[o.trim] ?? 1;
  const floors = Math.max(2, Math.min(40, Math.round(o.floors ?? d.floors * floorMul)));
  const root = group(`apartment-${variant}`);
  const m = palette(o, d);
  const B = new Builder(root, m);
  const w = variant === 'tower' ? 20 : 18;
  const dp = 12;
  const g = 0.6; // plinth / ground offset
  const groundH = 3.6;
  const bodyFloors = variant === 'classic' ? floors - 1 : floors;
  const h = g + groundH + (bodyFloors - 1) * AFH;
  block(B, w, h, dp, { plinth: g });
  const cols = variant === 'tower' ? 6 : 5;
  const xs = spread(w, cols, 1.8);
  const winStyle = { brick: 'double', modern: 'tall', classic: 'tall', tower: 'none' }[variant];
  const frame = variant === 'modern' || variant === 'tower' ? m.accent : m.trim;
  facades(B, w, dp, (side, width) => {
    const isFront = side === 'front';
    const sx = side === 'front' || side === 'back' ? xs : spread(width, 3, 1.8);
    // ground floor
    if (isFront) {
      door(B, 0, g, 2.0, 2.6, { double: true, glass: true, frame: m.accent });
      B.slab(m.accent, 0, g + 3.1, 2.2, g + 3.0, 4.4, 0.16);
      for (const x of sx) if (Math.abs(x) > 2.2) windowUnit(B, x, g + 0.5, 2.0, 2.4, { style: 'none', frame: m.accent, sill: false });
    } else for (const x of sx) windowUnit(B, x, g + 1.0, 1.3, 1.6, { style: winStyle === 'none' ? 'none' : 'double', frame });
    // upper floors
    for (let f = 1; f < bodyFloors; f++) {
      const y = g + groundH + (f - 1) * AFH;
      for (let i = 0; i < sx.length; i++) {
        const x = sx[i];
        if (variant === 'modern' && (isFront || side === 'back')) {
          windowUnit(B, x, y + 0.1, 2.2, 2.6, { style: 'tall', frame: m.accent, sill: false });
        } else if (variant === 'classic') {
          windowUnit(B, x, y + 0.25, 1.1, 2.3, { style: 'double', frame: m.trim, header: m.trim });
          if ((f === 1 || f === bodyFloors - 1) && side !== 'back') balcony(B, x, y + 0.25, 1.5, 0.45, m.trim, m.accent, false);
        } else if (variant === 'tower') {
          windowUnit(B, x, y + 0.6, 2.0, 1.8, { style: 'none', frame: m.accent, sill: false, depth: 0.12 });
        } else {
          windowUnit(B, x, y + 0.8, 1.2, 1.6, { style: 'double', frame: m.trim, header: m.trim });
        }
        const hasBalcony = isFront && ((variant === 'brick' && i % 2 === 1) || variant === 'tower');
        if (hasBalcony) balcony(B, x, y + 0.02, 2.4, 1.2, m.concrete, variant === 'tower' ? m.accent : m.accent, variant === 'tower');
      }
      if (variant === 'modern' && isFront) {
        B.box(m.trim, width + 0.4, 0.22, 1.6, 0, y - 0.11, 0.8);
        railingRun(B, -width / 2, width / 2, 1.55, y, m.accent, { glassPanel: true, height: 1.0 });
      }
      if (variant === 'brick' || variant === 'classic') B.box(m.trim, width + 0.06, 0.12, 0.08, 0, y - 0.05, 0.04);
    }
  });
  if (variant === 'classic') {
    // mansard top floor as a rectangular frustum with dormers
    const mh = 3.4;
    const frustum = new THREE.CylinderGeometry(Math.SQRT1_2 * 0.86, Math.SQRT1_2, 1, 4, 1).rotateY(Math.PI / 4).scale(w + 0.3, mh, dp + 0.3);
    B.box(m.trim, w + 0.5, 0.35, dp + 0.5, 0, h + 0.17, 0);
    B.add(m.roof, frustum, new THREE.Matrix4().makeTranslation(0, h + 0.35 + mh / 2, 0));
    for (const s of [1, -1]) {
      B.local(0, 0, 0, s > 0 ? 0 : Math.PI, () => {
        for (const x of xs) {
          const dz = dp / 2 + 0.15 - 0.45;
          B.box(m.trim, 1.5, 1.9, 1.6, x, h + 0.35 + 1.15, dz - 0.6);
          B.local(x, 0, dz + 0.2, 0, () => windowUnit(B, 0, h + 0.55, 0.9, 1.4, { style: 'double', frame: m.trim, sill: false }));
          gableRoof(B, 1.6, 1.6, h + 0.35 + 2.1, { pitch: 0.7, overhang: 0.1, ridgeAlong: 'z', cx: x, cz: dz - 0.6, gableMat: m.trim, gutter: false });
        }
      });
    }
    B.box(m.roof, w * 0.86, 0.1, dp * 0.86 + 0.3, 0, h + 0.35 + mh + 0.05, 0);
    for (const x of [-w / 3, w / 3]) B.box(surface('brick', '#9c5a46', { name: 'brick' }), 1.2, 1.4, 0.7, x, h + mh + 0.6, 0);
  } else {
    flatRoof(B, w, dp, h, { parapet: 0.9, cap: m.trim, mat: B.mats.wall });
    if (variant === 'brick') B.box(m.trim, w + 0.5, 0.4, dp + 0.5, 0, h + 0.7, 0);
    // rooftop: stair core, water tank, AC units
    B.box(B.mats.wall, 4, 3, 3.5, -w / 4, h + 1.5, -1);
    flatRoof(B, 4, 3.5, h + 3, { parapet: 0.25, cx: -w / 4, cz: -1, cap: m.trim });
    if (variant !== 'modern') {
      const tx = w / 4;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(m.metal, 0.12, 2.2, 0.12, tx + sx * 0.9, h + 1.1, -1 + sz * 0.9);
      B.cyl(surface('plank', '#8a6b4e', { name: 'tank' }), 1.2, 1.2, 2.2, tx, h + 3.3, -1, 24);
      B.add(m.roof, new THREE.ConeGeometry(1.3, 0.8, 24), new THREE.Matrix4().makeTranslation(tx, h + 4.8, -1));
    }
    for (let k = 0; k < 3; k++) acUnit(B, -w / 2 + 3 + k * 2, h + 0.06, dp / 2 - 2, 0);
  }
  B.finish();
  const animations = buildingAnimations(root, B);
  finalize(root, { type: 'apartment', variant, options: o, animations });
  root.userData.premade.oneShot = ['doorOpen'];
  return root;
}

/* ------------------------------------------------------------------ */
/* Skyscrapers                                                         */
/* ------------------------------------------------------------------ */

export const SKYSCRAPER_VARIANTS = {
  glass: { floors: 30, glass: '#5f7f99', frame: '#c4cbd1' },
  office: { floors: 24, glass: '#2d3a44', frame: '#d8d3c8' },
  tapered: { floors: 36, glass: '#7e98a8', frame: '#e9ecef' },
  'art-deco': { floors: 34, glass: '#2f3a40', frame: '#d9ccb0' },
  twisted: { floors: 40, glass: '#6d8fa6', frame: '#eef1f3' },
  cylinder: { floors: 28, glass: '#4f6d80', frame: '#dfe4e8' },
};

const SFH = 3.6;

/** Glass curtain-wall box with mullions, spandrels and instanced lit panes. */
function curtainBox(B, lit, rand, { w, d, y0, floors, cx = 0, cz = 0, glassMat, frameMat, mullion = 1.5, pitch = SFH }) {
  const h = floors * pitch;
  B.box(glassMat, w, h, d, cx, y0 + h / 2, cz, 0, 0.05);
  for (const [face, width] of [['front', w], ['back', w], ['right', d], ['left', d]]) {
    const F = { front: [cx, cz + d / 2, 0], back: [cx, cz - d / 2, Math.PI], right: [cx + w / 2, cz, Math.PI / 2], left: [cx - w / 2, cz, -Math.PI / 2] }[face];
    B.local(F[0], 0, F[1], F[2], () => {
      const n = Math.max(2, Math.round(width / mullion));
      for (let i = 0; i <= n; i++) B.box(frameMat, 0.08, h, 0.12, -width / 2 + (i * width) / n, y0 + h / 2, 0.04, 0, 0.02);
      for (let f = 0; f <= floors; f++) B.box(frameMat, width + 0.04, 0.22, 0.14, 0, y0 + f * pitch, 0.05, 0, 0.03);
      // lit panes (instanced), placed just in front of the glass
      const m4 = new THREE.Matrix4().copy(B.frame);
      for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) {
        if (rand() > 0.38) continue;
        const local = new THREE.Matrix4().makeTranslation(-width / 2 + ((i + 0.5) * width) / n, y0 + f * pitch + pitch / 2 + 0.05, 0.012);
        lit.push(m4.clone().multiply(local).multiply(new THREE.Matrix4().makeScale(width / n - 0.12, pitch - 0.45, 1)));
      }
    });
  }
  return y0 + h;
}

function stackFloors(B, { floors, y0, size, rotate = () => 0, glassMat, slabMat, glowMat, rand, round = false, crownMat }) {
  let y = y0;
  for (let f = 0; f < floors; f++) {
    const [w, dd] = size(f);
    const ry = rotate(f);
    let mat = rand() < 0.3 ? glowMat : glassMat;
    // top floor carries the crown emblems: its own glazing batch (same look, separate mesh)
    if (crownMat && f === floors - 1) mat = crownMat;
    if (round) {
      B.add(mat, new THREE.CylinderGeometry(w / 2, w / 2, SFH - 0.3, 40), new THREE.Matrix4().makeTranslation(0, y + 0.3 + (SFH - 0.3) / 2, 0));
      B.add(slabMat, new THREE.CylinderGeometry(w / 2 + 0.25, w / 2 + 0.25, 0.3, 40), new THREE.Matrix4().makeTranslation(0, y + 0.15, 0));
    } else {
      B.box(mat, w, SFH - 0.3, dd, 0, y + 0.3 + (SFH - 0.3) / 2, 0, ry, 0.05);
      B.box(slabMat, w + 0.5, 0.3, dd + 0.5, 0, y + 0.15, 0, ry, 0.06);
    }
    y += SFH;
  }
  return y;
}

/** Skyscraper trims: height, silhouette and roof-top changes. */
const SKY_TRIMS = {
  short: { floors: 0.5 },
  tall: { floors: 1.5 },
  supertall: { floors: 2.3, spire: true, noSpire: true },
  spire: { spire: true, noSpire: true },
  helipad: { helipad: true, noSpire: true },
  twin: { twin: true },
  podium: { podium: true },
};

export function createSkyscraper(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SKYSCRAPER_VARIANTS, o.variant, 'skyscraper');
  const d = SKYSCRAPER_VARIANTS[variant];
  const T = SKY_TRIMS[o.trim] ?? {};
  const floors = Math.max(8, Math.min(120, Math.round(o.floors ?? d.floors * (T.floors ?? 1))));
  const root = group(`skyscraper-${variant}`);
  const m = palette(o, { wall: d.frame, wallKind: 'concrete', roof: '#666', roofKind: 'concrete', trim: d.frame, accent: '#2a2d30', door: '#2a2d30' });
  const B = new Builder(root, m);
  const rand = rng(o.seed ?? 11);
  const glassMat = new THREE.MeshPhysicalMaterial({ name: 'curtain', color: M.toColor(o.color ?? d.glass), metalness: 0.65, roughness: 0.08, clearcoat: 1, envMapIntensity: 1.4 });
  const frameMat = new THREE.MeshStandardMaterial({ name: 'mullion', color: M.toColor(o.trimColor ?? d.frame), metalness: 0.6, roughness: 0.35 });
  const stone = surface('concrete', o.trimColor ?? d.frame, { name: 'stone' });
  // shared night glow: same material object as window interiors so 'lights' drives both
  const glowMat = m.glow;
  const glowGlass = new THREE.MeshPhysicalMaterial({ name: 'win_glow_floors', color: M.toColor(o.color ?? d.glass), metalness: 0.5, roughness: 0.1, emissive: '#ffd59a', emissiveIntensity: o.lightsOn ? 0.8 : 0 });
  const lit = [];
  const lobbyH = 6;
  let top;
  let W = 26;
  const buildTower = () => {

  // lobby (double height glass, canopy, revolving-door style entrance)
  const lobby = (w, dd) => {
    block(B, w, lobbyH, dd, { mat: stone, plinth: 0.3 });
    facades(B, w, dd, (side, width) => {
      for (const x of spread(width, Math.round(width / 3.2), 1.5)) {
        if (side === 'front' && Math.abs(x) < 2) continue;
        windowUnit(B, x, 0.4, 2.8, 5.0, { style: 'tall', frame: frameMat, sill: false });
      }
      if (side === 'front') {
        door(B, 0, 0.3, 2.6, 3.0, { double: true, glass: true, frame: frameMat });
        B.slab(frameMat, 0, 4.2, 3.2, 4.1, 7, 0.25);
      }
    });
  };

  if (variant === 'glass') {
    lobby(W, W);
    top = curtainBox(B, lit, rand, { w: W - 1, d: W - 1, y0: lobbyH, floors: floors - 4, glassMat, frameMat });
    top = curtainBox(B, lit, rand, { w: W - 7, d: W - 7, y0: top, floors: 4, glassMat, frameMat });
    B.box(Object.assign(frameMat.clone(), { name: 'crown' }), W - 6.4, 2.5, W - 6.4, 0, top + 1.25, 0); // crown block (emblems)
    if (!T.noSpire) B.cyl(frameMat, 0.15, 0.4, 18, 0, top + 2.5 + 9, 0, 12);
  } else if (variant === 'office') {
    lobby(W, 20);
    const h = (floors - 1) * SFH;
    B.box(stone, W, h, 20, 0, lobbyH + h / 2, 0, 0, 0.05);
    facades(B, W, 20, (side, width) => {
      for (let f = 0; f < floors - 1; f++) {
        const y = lobbyH + f * SFH;
        B.add(glassMat, new THREE.PlaneGeometry(width - 0.6, 1.9), new THREE.Matrix4().makeTranslation(0, y + 1.25, 0.01));
        B.box(stone, width + 0.1, 0.3, 0.35, 0, y + 0.1, 0.17, 0, 0.04);
      }
      for (const x of spread(width, Math.round(width / 2.2), 0.4)) B.box(stone, 0.3, h, 0.6, x, lobbyH + h / 2, 0.3, 0, 0.05);
      // lit offices behind the window bands
      const m4 = B.frame.clone();
      const n = Math.round(width / 2.2) - 1;
      for (let f = 0; f < floors - 1; f++) for (let i = 0; i < n; i++) {
        if (rand() > 0.35) continue;
        lit.push(m4.clone().multiply(new THREE.Matrix4().makeTranslation(-width / 2 + 0.4 + ((i + 0.5) * (width - 0.8)) / n, lobbyH + f * SFH + 1.25, 0.02)).multiply(new THREE.Matrix4().makeScale((width - 0.8) / n - 0.35, 1.8, 1)));
      }
    });
    top = lobbyH + h;
    flatRoof(B, W, 20, top, { parapet: 1.2, mat: stone, cap: stone });
    B.box(stone, 8, 4, 6, 0, top + 2, 0);
    for (let k = 0; k < 4; k++) acUnit(B, -9 + k * 2.4, top + 0.06, 6, 0);
  } else if (variant === 'tapered') {
    lobby(30, 30);
    top = stackFloors(B, { floors: floors - 1, y0: lobbyH, size: (f) => { const s = 29 - (f / floors) * 15; return [s, s]; }, glassMat, slabMat: frameMat, glowMat: glowGlass, rand, crownMat: glassMat.clone() });
    if (!T.noSpire) B.cyl(frameMat, 0.1, 0.5, 14, 0, top + 7, 0, 12);
  } else if (variant === 'art-deco') {
    W = 28;
    lobby(W, W);
    const tiers = [[W - 1, Math.floor(floors * 0.5)], [W - 7, Math.floor(floors * 0.3)], [W - 13, floors - Math.floor(floors * 0.5) - Math.floor(floors * 0.3) - 1]];
    let y = lobbyH;
    for (const [s, n] of tiers) {
      const h = n * SFH;
      B.box(stone, s, h, s, 0, y + h / 2, 0, 0, 0.05);
      facades(B, s, s, (side, width) => {
        const piers = spread(width, Math.round(width / 2.4), 0.3);
        for (let i = 0; i < piers.length - 1; i++) {
          const x = (piers[i] + piers[i + 1]) / 2;
          B.add(glassMat, new THREE.PlaneGeometry(piers[i + 1] - piers[i] - 0.5, h - 0.4), new THREE.Matrix4().makeTranslation(x, y + h / 2, 0.01));
          for (let f = 0; f < n; f++) {
            B.box(m.accent, piers[i + 1] - piers[i] - 0.5, 0.7, 0.06, x, y + f * SFH + 0.35, 0.03, 0, 0.02);
            if (rand() < 0.35) lit.push(B.frame.clone().multiply(new THREE.Matrix4().makeTranslation(x, y + f * SFH + 2.1, 0.02)).multiply(new THREE.Matrix4().makeScale(piers[i + 1] - piers[i] - 0.7, 2.4, 1)));
          }
        }
        for (const x of piers) B.box(stone, 0.5, h + 0.6, 0.5, x, y + h / 2 + 0.3, 0.2, 0, 0.06);
      });
      B.box(stone, s + 0.6, 0.6, s + 0.6, 0, y + h + 0.3, 0, 0, 0.08);
      y += h + 0.6;
    }
    // stepped crown + spire
    for (let k = 0; k < 4; k++) B.box(stone, W - 16 - k * 2.4, 2.2, W - 16 - k * 2.4, 0, y + 1.1 + k * 2.2, 0, 0, 0.08);
    y += 8.8;
    if (!T.noSpire) B.add(frameMat, new THREE.ConeGeometry(1.4, 18, 8), new THREE.Matrix4().makeTranslation(0, y + 9, 0));
    top = y;
  } else if (variant === 'twisted') {
    lobby(24, 24);
    top = stackFloors(B, { floors: floors - 1, y0: lobbyH, size: () => [22, 22], rotate: (f) => f * 0.035, glassMat, slabMat: frameMat, glowMat: glowGlass, rand });
    B.box(frameMat, 18, 3, 18, 0, top + 1.5, 0, (floors - 1) * 0.035, 0.1);
  } else {
    // cylinder
    lobby(28, 28);
    top = stackFloors(B, { floors: floors - 1, y0: lobbyH, size: () => [24, 24], glassMat, slabMat: frameMat, glowMat: glowGlass, rand, round: true, crownMat: glassMat.clone() });
    B.add(frameMat, new THREE.CylinderGeometry(9, 12.25, 4, 40), new THREE.Matrix4().makeTranslation(0, top + 2, 0));
    if (!T.noSpire) B.cyl(frameMat, 0.12, 0.4, 16, 0, top + 12, 0, 12);
  }

  // studio emblem on the crown, all four faces
  {
    const ts = 29 - 15 * ((floors - 2) / floors);
    // [half-width X, half-depth Z, centre height, emblem size]
    const crown = {
      glass: [(W - 6.4) / 2, (W - 6.4) / 2, top + 1.25, 1.8],
      office: [W / 2, 10, top + 0.6, 1.0],
      tapered: [ts / 2, ts / 2, top - SFH / 2 + 0.15, 2.0],
      'art-deco': [(W - 16) / 2, (W - 16) / 2, top - 8.8 + 1.1, 1.6],
      twisted: [9, 9, top + 1.5, 2.2],
      cylinder: [12, 12, top - SFH / 2 + 0.15, 1.8],
    }[variant];
    const [rx, rz, y, size] = crown;
    const rot = variant === 'twisted' ? (floors - 1) * 0.035 : 0;
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const r = k % 2 ? rx : rz;
      B.local(Math.sin(a + rot) * r, 0, Math.cos(a + rot) * r, a + rot, () => emblem(B, 0, y, 0, size));
    }
  }
  // crown height (top of the highest solid part) for roof-top trims
  const crownTop = { glass: top + 2.5, office: top + 4, tapered: top, 'art-deco': top, twisted: top + 3, cylinder: top + 4 }[variant];
  const crownHalf = { glass: (W - 6.4) / 2, office: 4, tapered: (29 - 15 * ((floors - 2) / floors)) / 2, 'art-deco': (W - 16 - 7.2) / 2, twisted: 9, cylinder: 9 }[variant];
  if (T.helipad) {
    // landing pad on a steel deck, H marking and edge lights
    const yy = crownTop + 1.2;
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) B.box(frameMat, 0.4, 1.25, 0.4, sx * Math.min(crownHalf - 0.6, 5), crownTop + 0.6, sz * Math.min(crownHalf - 0.6, 5), 0, 0.05);
    B.add(stone, new THREE.CylinderGeometry(9, 9, 0.35, 40), new THREE.Matrix4().makeTranslation(0, yy, 0));
    const paint = new THREE.MeshStandardMaterial({ name: 'helipad_paint', color: '#f4f2ea', roughness: 0.6 });
    B.add(paint, new THREE.TorusGeometry(6.5, 0.18, 6, 48).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, yy + 0.18, 0));
    B.box(paint, 0.7, 0.04, 5, -1.5, yy + 0.19, 0, 0, 0);
    B.box(paint, 0.7, 0.04, 5, 1.5, yy + 0.19, 0, 0, 0);
    B.box(paint, 3, 0.04, 0.7, 0, yy + 0.19, 0, 0, 0);
  }
  if (T.spire) {
    // stepped mast with rings, tapering to a needle
    let yy = crownTop;
    for (const [r0, r1, hh] of [[3.2, 2.6, 6], [2.0, 1.4, 10], [0.9, 0.5, 14], [0.35, 0.06, 18]]) {
      B.add(frameMat, new THREE.CylinderGeometry(r1, r0, hh, 16), new THREE.Matrix4().makeTranslation(0, yy + hh / 2, 0));
      B.add(stone, new THREE.CylinderGeometry(r0 + 0.25, r0 + 0.25, 0.4, 16), new THREE.Matrix4().makeTranslation(0, yy + 0.2, 0));
      yy += hh;
    }
  }
  return top;
  };

  if (T.twin) {
    const off = 21;
    B.local(-off, 0, 0, 0, buildTower);
    B.local(off, 0, 0, 0, buildTower);
    // sky bridge two-thirds up
    const yb = lobbyH + (floors - 1) * SFH * 0.6;
    B.box(frameMat, 2 * off - 20, 1.2, 7, 0, yb, 0, 0, 0.1);
    B.box(frameMat, 2 * off - 20, 1.2, 7, 0, yb + 7, 0, 0, 0.1);
    B.add(glassMat, new THREE.BoxGeometry(2 * off - 20, 5.8, 6.2), new THREE.Matrix4().makeTranslation(0, yb + 3.5, 0));
    for (const s of [-1, 1]) B.box(frameMat, 2 * off - 20, 5.8, 0.25, 0, yb + 3.5, s * 3.3, 0, 0.05);
  } else buildTower();
  if (T.podium) {
    // three-storey retail podium wrapping the tower base
    const pw = 52;
    const pd = 44;
    const ph = 13;
    block(B, pw, ph, pd, { mat: stone, plinth: 0.4 });
    facades(B, pw, pd, (side, width) => {
      for (let f = 0; f < 3; f++) for (const x of spread(width, Math.round(width / 4), 2)) {
        if (side === 'front' && f === 0 && Math.abs(x) < 4) continue;
        windowUnit(B, x, 0.6 + f * 4.2, 3.2, f === 0 ? 3.4 : 2.8, { style: 'none', frame: frameMat, sill: false });
      }
      if (side === 'front') {
        door(B, 0, 0.4, 3.6, 3.2, { double: true, glass: true, frame: frameMat });
        B.slab(frameMat, 0, 4.4, 4, 4.3, 12, 0.3);
      }
    });
    flatRoof(B, pw, pd, ph, { parapet: 1.1, mat: stone, cap: frameMat });
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const r = 17 + (k % 2) * 3;
      B.box(stone, 2.2, 0.8, 2.2, Math.cos(a) * r, ph + 0.4, Math.sin(a) * r, 0, 0.1);
      B.add(new THREE.MeshStandardMaterial({ name: 'shrub', color: '#3d6b35', roughness: 0.9, flatShading: true }), new THREE.IcosahedronGeometry(1.1, 1), new THREE.Matrix4().makeTranslation(Math.cos(a) * r, ph + 1.6, Math.sin(a) * r));
    }
  }
  B.finish();
  if (lit.length) {
    const panes = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), glowMat, lit.length);
    lit.forEach((mm, i) => panes.setMatrixAt(i, mm));
    panes.name = 'win_glow';
    root.add(panes);
  }
  const animations = buildingAnimations(root, B);
  if (root.getObjectByName('win_glow_floors')) {
    const lights = animations.find((a) => a.name === 'lights');
    const extra = new THREE.NumberKeyframeTrack('win_glow_floors.material.emissiveIntensity', [0, 2, 4], [0.9, 0, 0], THREE.InterpolateDiscrete);
    if (lights) lights.tracks.push(extra);
    else animations.push(new THREE.AnimationClip('lights', 4, [extra]));
  }
  finalize(root, { type: 'skyscraper', variant, options: o, animations });
  root.userData.premade.oneShot = ['doorOpen'];
  return root;
}
