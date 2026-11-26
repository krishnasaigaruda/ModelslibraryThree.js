import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, tube, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, moveTrack, numberTrack, clip, pingPong } from '../../core/animation.js';
import { createLoft, smoothKeys } from '../../core/loft.js';
import { brandEmblem } from '../../core/brand.js';
import { addWheels, wheelWell, vehicleAnimations, addHeadlightSpots, addAxles } from './wheel.js';
import { lampGroup } from '../../core/lamps.js';
import { applyTrim, plateMaterial, canvasTex, sirenClip } from './misc-kit.js';

/*
 * Buses share one builder. Each variant describes its silhouette, window bays,
 * doors and livery; the builder handles glass, interior, lights, mirrors etc.
 */

export const BUS_VARIANTS = {
  city: {
    L: 12, W: 2.55, H: 3.05, wr: 0.5, xf: 3.4, xr: -2.7, floor: 0.38, belt: 1.12,
    color: '#f2c200', accent: '#d32f2f', roof: '#f2c200', skirt: '#9ea3a8',
    doors: [[4.35, 5.5], [-0.6, 0.6]], destination: '12  CITY CENTRE',
    nose: { len: 0.35, p: 3.5 }, tail: { len: 0.3, p: 4 }, rake: { front: 0.05 },
  },
  school: {
    L: 10.5, W: 2.45, H: 3.0, wr: 0.5, xf: 3.3, xr: -2.0, floor: 0.9, belt: 1.55,
    color: '#f5b400', accent: '#111111', roof: '#f5b400',
    hood: { start: 3.25, height: 1.62 }, doors: [[2.55, 3.15]], schoolRails: true,
    nose: { len: 0.3, p: 3 }, tail: { len: 0.2, p: 5 }, rake: { front: 0.0 }, frontWheelsAhead: true,
  },
  double: {
    L: 11, W: 2.55, H: 4.35, wr: 0.5, xf: 2.9, xr: -2.6, floor: 0.38, belt: 1.12, decks: 2,
    color: '#c62828', accent: '#f2f2f2', roof: '#c62828', skirt: '#2b2b2b',
    doors: [[3.6, 4.75], [-0.4, 0.6]], destination: '24  VICTORIA',
    nose: { len: 0.35, p: 3.5 }, tail: { len: 0.3, p: 4 }, rake: { front: 0.03 },
  },
  coach: {
    L: 12.8, W: 2.55, H: 3.6, wr: 0.52, xf: 3.9, xr: -3.0, floor: 1.35, belt: 1.75,
    color: '#f4f6f8', accent: '#1565c0', roof: '#f4f6f8', skirt: '#1565c0',
    doors: [[4.85, 5.7]], luggage: true, destination: 'EXPRESS  AIRPORT',
    nose: { len: 0.6, p: 2.6 }, tail: { len: 0.35, p: 3.5 }, rake: { front: 0.35, rear: 0.08 },
  },
  minibus: {
    L: 7.0, W: 2.2, H: 2.75, wr: 0.4, xf: 2.1, xr: -1.55, floor: 0.55, belt: 1.15,
    color: '#ffffff', accent: '#2e7d32', roof: '#ffffff', skirt: '#2e7d32',
    doors: [[0.9, 1.75]], destination: 'SHUTTLE',
    nose: { len: 0.9, p: 2.2 }, tail: { len: 0.25, p: 4 }, rake: { front: 0.25 }, shortNose: 1.0,
  },
  articulated: {
    L: 18, W: 2.55, H: 3.05, wr: 0.5, xf: 6.4, xm: 0.6, xr: -5.6, floor: 0.38, belt: 1.12,
    color: '#1e88e5', accent: '#ffffff', roof: '#eceff1', skirt: '#37474f', joint: 2.0,
    doors: [[7.35, 8.5], [3.0, 4.15], [-2.6, -1.45], [-6.9, -6.0]], destination: '7  AIRPORT',
    nose: { len: 0.35, p: 3.5 }, tail: { len: 0.3, p: 4 }, rake: { front: 0.05 },
  },
  trolleybus: {
    L: 12, W: 2.55, H: 3.05, wr: 0.5, xf: 3.4, xr: -2.7, floor: 0.38, belt: 1.12,
    color: '#c62828', accent: '#fafafa', roof: '#eceff1', skirt: '#424242', poles: true, battery: true,
    doors: [[4.35, 5.5], [-0.6, 0.6]], destination: '3  STATION',
    nose: { len: 0.35, p: 3.5 }, tail: { len: 0.3, p: 4 }, rake: { front: 0.05 },
  },
  electric: {
    L: 12, W: 2.55, H: 3.1, wr: 0.5, xf: 3.4, xr: -2.7, floor: 0.36, belt: 1.05,
    color: '#7cb342', accent: '#f5f5f5', roof: '#f5f5f5', skirt: '#33691e', battery: true, noEngine: true,
    doors: [[4.35, 5.5], [-0.6, 0.6], [-4.4, -3.4]], destination: 'E1  GREEN LINE',
    nose: { len: 0.4, p: 3 }, tail: { len: 0.35, p: 3.5 }, rake: { front: 0.12 },
  },
  airport: {
    L: 13.5, W: 3.0, H: 3.0, wr: 0.45, xf: 4.6, xr: -3.4, floor: 0.32, belt: 0.95,
    color: '#f5f5f5', accent: '#ff8f00', roof: '#f5f5f5', skirt: '#ff8f00', standing: true,
    doors: [[4.9, 6.0], [1.2, 2.4], [-2.0, -0.8], [-5.6, -4.5]], doorsNeg: [[1.2, 2.4], [-2.0, -0.8], [-5.6, -4.5]], destination: 'APRON  GATE 12',
    nose: { len: 0.45, p: 3 }, tail: { len: 0.45, p: 3 }, rake: { front: 0.1, rear: 0.1 },
  },
  'open-top': {
    L: 11, W: 2.55, H: 3.3, wr: 0.5, xf: 2.9, xr: -2.6, floor: 0.38, belt: 1.12, decks: 2, openTop: true,
    color: '#2e7d32', accent: '#f9a825', roof: '#2e7d32', skirt: '#1b1b1b',
    doors: [[3.6, 4.75]], destination: 'CITY TOUR',
    nose: { len: 0.35, p: 3.5 }, tail: { len: 0.3, p: 4 }, rake: { front: 0.03 },
  },
  party: {
    L: 12.8, W: 2.55, H: 3.6, wr: 0.52, xf: 3.9, xr: -3.0, floor: 1.35, belt: 1.75,
    color: '#121212', accent: '#d500f9', roof: '#121212', skirt: '#d500f9', neon: true, tint: true,
    doors: [[4.85, 5.7]], luggage: true, destination: 'PARTY  NIGHT',
    nose: { len: 0.6, p: 2.6 }, tail: { len: 0.35, p: 3.5 }, rake: { front: 0.35, rear: 0.08 },
  },
};

/** Trims: packages that change parts (every bus variant gets all of them). */
export const BUS_TRIMS = {
  hybrid: { battery: true, color: '#e8f5e9', accent: '#2e7d32', roof: '#2e7d32', skirt: '#1b5e20' },
  retro: { retro: true, color: '#f3e5ab', accent: '#7b1f1f', roof: '#f3e5ab', skirt: '#7b1f1f' },
  'bike-rack': { bikeRack: true, color: '#0277bd', accent: '#ffeb3b', roof: '#e1f5fe', skirt: '#01579b' },
  advert: { advert: true, color: '#fafafa', accent: '#d81b60', roof: '#fafafa', skirt: '#424242' },
  night: { tint: true, underglow: true, color: '#1a237e', accent: '#00e5ff', roof: '#1a237e', skirt: '#000000' },
  express: { express: true, color: '#eceff1', accent: '#ff6f00', roof: '#eceff1', skirt: '#ff6f00' },
};

function destinationTexture(text) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#120a00';
  g.fillRect(0, 0, 512, 64);
  g.fillStyle = '#ffb000';
  g.font = 'bold 42px monospace';
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillText(text, 256, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createBus(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BUS_VARIANTS, o.variant, 'bus');
  const v = applyTrim(BUS_VARIANTS[variant], BUS_TRIMS, o.trim, 'bus');
  const axles = [v.xf, v.xm, v.xr].filter((x) => x != null);
  const { L, W, H, wr } = v;
  const h = L / 2;
  const root = group(`bus-${variant}`);
  const body = group('body', { parent: root });

  const paint = M.paint(o.color ?? v.color, { metallic: 0.15, roughness: 0.35 });
  const accent = M.paint(o.accentColor ?? v.accent, { metallic: 0.15, roughness: 0.35 });
  const roofPaint = M.paint(o.roofColor ?? v.roof, { metallic: 0.15, roughness: 0.4 });
  const skirt = M.paint(v.skirt ?? '#333', { metallic: 0.2, roughness: 0.5 });
  const interior = new THREE.MeshStandardMaterial({ name: 'interior', color: '#8a8f94', roughness: 0.8, side: THREE.BackSide });
  const glass = new THREE.MeshPhysicalMaterial({
    name: 'glass', color: '#0e1418', roughness: 0.04, transparent: true, opacity: v.tint ? 0.82 : 0.5, clearcoat: 1,
    envMapIntensity: 1.3, side: THREE.DoubleSide, depthWrite: false,
  });
  const frameMat = new THREE.MeshPhysicalMaterial({ name: 'frame', color: '#0b0b0c', roughness: 0.25, clearcoat: 0.6 });
  const trim = new THREE.MeshStandardMaterial({ name: 'trim', color: '#151515', roughness: 0.6 });
  // livery patches sit 2 mm over the shell: pull them forward in depth so they never z-fight at a distance
  for (const m of [accent, roofPaint, skirt, frameMat]) Object.assign(m, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

  // ---------------- body silhouette ----------------
  const ar = wr + 0.08;
  const fTop = v.hood
    ? smoothKeys([[-h, H - 0.05], [-h + 0.15, H], [v.hood.start - 0.15, H], [v.hood.start, H - 0.15], [v.hood.start + 0.05, v.hood.height + 0.12], [h - 0.5, v.hood.height], [h, v.hood.height - 0.15]])
    : v.shortNose
      ? smoothKeys([[-h, H - 0.05], [-h + 0.15, H], [h - v.shortNose - 0.9, H], [h - v.shortNose, v.belt + 0.25], [h - 0.3, v.belt + 0.05], [h, v.belt - 0.1]])
      : smoothKeys([[-h, H - 0.06], [-h + 0.12, H], [h - 0.12, H], [h, H - 0.06]]);
  const fWidth = v.hood ? smoothKeys([[-h, W], [v.hood.start - 0.05, W], [v.hood.start + 0.25, W * 0.72], [h, W * 0.7]]) : () => W;
  const fBelt = v.hood ? smoothKeys([[-h, v.belt], [v.hood.start, v.belt], [v.hood.start + 0.3, v.hood.height - 0.18], [h, v.hood.height - 0.3]]) : () => v.belt;
  const sill = 0.34;
  const section = (x) => {
    let y0 = sill;
    for (const wx of axles) {
      const dx = x - wx;
      if (Math.abs(dx) < ar) y0 = Math.max(y0, wr + Math.sqrt(ar * ar - dx * dx));
    }
    const yt = fTop(x);
    const w = fWidth(x);
    const cabin = THREE.MathUtils.clamp((yt - fBelt(x) - 0.3) / 1.0, 0, 1);
    return { y0, yb: fBelt(x), yt, w, wt: w * (0.94 + 0.03 * cabin), r1: 0.08, r2: 0.12 + 0.18 * cabin, crown: 0.03, bulge: 0.01, sideBulge: 0.02 };
  };

  // window bays
  const bayEdges = [];
  const doorRanges = v.doors;
  const doorsNeg = v.doorsNeg ?? [];
  const inDoor = (a, b, list = doorRanges) => list.some(([d0, d1]) => b > d0 - 0.05 && a < d1 + 0.05);
  const frontLimit = v.hood ? v.hood.start - 0.2 : v.shortNose ? h - v.shortNose - 0.95 : h - 0.45;
  const winStart = -h + 0.55;
  const pitch = v.luggage ? 1.6 : 1.35;
  const bays = [];
  for (let x = winStart; x < frontLimit - 0.3; x += pitch) bays.push([x, Math.min(x + pitch - 0.12, frontLimit)]);

  const breaks = [];
  for (const [a, b] of bays) breaks.push(a, b);
  for (const [a, b] of [...doorRanges, ...doorsNeg]) breaks.push(a, b, a - 0.06, b + 0.06);
  if (v.joint != null) for (let k = -0.4; k <= 0.4001; k += 0.1) breaks.push(v.joint + k, v.joint + k - 0.015, v.joint + k + 0.015);
  for (const wx of axles) for (let k = -ar; k <= ar + 1e-6; k += ar / 8) breaks.push(wx + k);
  if (v.hood) { breaks.push(v.hood.start - 0.15); for (let x = v.hood.start; x <= v.hood.start + 0.05; x += 0.004) breaks.push(x); }

  const counts = { bottom: 3, corner: 4, lower: 10, side: v.decks ? 24 : 14, roofCorner: 6, roof: 6 };
  const loft = createLoft({ length: L, nose: v.nose, tail: v.tail, rake: v.rake, breaks, section, segments: counts, stations: 150 });
  const I = loft.idx;

  // ---------------- glass ----------------
  const glassGeos = [];
  const bands = v.decks
    ? (v.openTop ? [[0.05, 0.52]] : [[0.04, 0.42], [0.56, 0.95]])
    : [[0.07, 0.94]];
  for (const [b0, b1] of bands) {
    for (const [a, b] of bays) {
      for (const side of ['pos', 'neg']) {
        const sideDoors = side === 'pos' ? doorRanges : doorsNeg;
        if (v.joint != null && b > v.joint - 0.45 && a < v.joint + 0.45) {
          if (a < v.joint - 0.5) glassGeos.push(loft.patch({ x: [a, v.joint - 0.5], from: I('side', b0), to: I('side', b1), side, hole: true, offset: 0 }));
          if (b > v.joint + 0.5) glassGeos.push(loft.patch({ x: [v.joint + 0.5, b], from: I('side', b0), to: I('side', b1), side, hole: true, offset: 0 }));
          continue;
        }
        if (inDoor(a, b, sideDoors)) {
          // split bay around the door
          for (const [d0, d1] of sideDoors) {
            if (a < d0 - 0.1 && b > d0) glassGeos.push(loft.patch({ x: [a, d0 - 0.1], from: I('side', b0), to: I('side', b1), side, hole: true, offset: 0 }));
            if (b > d1 + 0.1 && a < d1) glassGeos.push(loft.patch({ x: [d1 + 0.1, b], from: I('side', b0), to: I('side', b1), side, hole: true, offset: 0 }));
          }
          continue;
        }
        glassGeos.push(loft.patch({ x: [a, b], from: I('side', b0), to: I('side', b1), side, hole: true, offset: 0 }));
      }
    }
  }
  // windshield(s)
  if (v.hood) {
    glassGeos.push(loft.patch({ x: [v.hood.start + 0.004, v.hood.start + 0.036], from: I('roofCorner', 0.35), side: 'across', hole: true, offset: 0 }));
  } else if (v.shortNose) {
    glassGeos.push(loft.patch({ x: [h - v.shortNose - 0.85, h - v.shortNose + 0.1], from: I('roofCorner', 0.3), side: 'across', hole: true, offset: 0 }));
  } else if (v.decks) {
    glassGeos.push(loft.patch({ x: [h - v.nose.len, h], from: I('lower', 0.75), to: I('side', v.openTop ? 0.5 : 0.4), side: 'both', hole: true, offset: 0 }));
    if (!v.openTop) glassGeos.push(loft.patch({ x: [h - v.nose.len, h], from: I('side', 0.56), to: I('side', 0.95), side: 'both', hole: true, offset: 0 }));
  } else {
    glassGeos.push(loft.patch({ x: [h - v.nose.len, h], from: I('lower', 0.6), to: I('roofCorner', 0.25), side: 'both', hole: true, offset: 0 }));
  }
  // rear window
  glassGeos.push(loft.patch({ x: [-h, -h + v.tail.len * 0.6], from: I('side', v.openTop ? 0.1 : v.decks ? 0.6 : 0.3), to: I('side', v.openTop ? 0.48 : 0.92), side: 'both', hole: true, offset: 0 }));
  // door openings (neg side = vehicle's right)
  for (const [d0, d1] of doorRanges) loft.patch({ x: [d0, d1], from: I('corner', 0.3), to: I('side', v.decks ? 0.42 : 0.95), side: 'pos', hole: true });
  for (const [d0, d1] of doorsNeg) loft.patch({ x: [d0, d1], from: I('corner', 0.3), to: I('side', 0.95), side: 'neg', hole: true });
  if (v.openTop) loft.patch({ x: [-h + 0.25, h - 0.55], from: I('roofCorner', 0.05), side: 'across', hole: true });
  for (const g of glassGeos) mesh(g, glass, { parent: body, name: 'glass' });

  // ---------------- livery ----------------
  // black window band (around the glass), roof colour, skirt and accent stripe
  for (const [b0, b1] of bands) mesh(loft.patch({ x: [-h + 0.35, frontLimit + 0.15], from: I('side', Math.max(0, b0 - 0.04)), to: I('side', Math.min(1, b1 + 0.04)), skipHoles: true, offset: 0.002 }), frameMat, { parent: body, name: 'window-band' });
  mesh(loft.patch({ x: [-h, h], from: I('roofCorner', 0.5), side: 'across', skipHoles: true, offset: 0.002 }), roofPaint, { parent: body, name: 'roof' });
  if (v.skirt) mesh(loft.patch({ x: [-h, h], from: I('corner', 0.5), to: I('lower', 0.22), skipHoles: true, offset: 0.002 }), skirt, { parent: body, name: 'skirt' });
  if (!v.schoolRails) mesh(loft.patch({ x: [-h + 0.3, frontLimit - 0.2], from: I('lower', 0.62), to: I('lower', 0.72), skipHoles: true, offset: 0.0025 }), accent, { parent: body, name: 'stripe' });
  if (v.schoolRails) {
    for (const t of [0.15, 0.5, 0.85]) mesh(loft.patch({ x: [-h + 0.05, v.hood.start], from: I('lower', t), to: I('lower', t + 0.1), skipHoles: true, offset: 0.006 }), trim, { parent: body, name: 'rub-rail' });
  }
  if (v.joint != null) {
    // articulation bellows: dark rubber band + ribs all round
    const rubber = M.matte('#1c1c1c', 0.85);
    mesh(loft.patch({ x: [v.joint - 0.4, v.joint + 0.4], from: I('corner', 0.2), side: 'across', offset: 0.004 }), rubber, { parent: body, name: 'bellows' });
    for (let k = -0.3; k <= 0.3001; k += 0.1) mesh(loft.patch({ x: [v.joint + k - 0.015, v.joint + k + 0.015], from: I('corner', 0.2), side: 'across', offset: 0.016 }), rubber, { parent: body, name: 'bellows_rib' });
  }
  // front bumper + lower front, rear bumper + engine grille
  mesh(loft.patch({ x: [h - 0.45, h], from: 0, to: I('lower', 0.12), offset: 0.008 }), trim, { parent: body, name: 'bumper-front' });
  mesh(loft.patch({ x: [-h, -h + 0.4], from: 0, to: I('lower', 0.12), offset: 0.008 }), trim, { parent: body, name: 'bumper-rear' });
  if (!v.noEngine) mesh(loft.patch({ x: [-h, -h + 0.02], from: I('lower', 0.25), to: I('lower', 0.6), offset: 0.004 }), frameMat, { parent: body, name: 'engine-grille' });

  // ---------------- lights (core/lamps.js: visible off, glow when on) ----------------
  const head = lampGroup('headlights', 'head');
  const drl = lampGroup('drl', 'drl');
  const tail = lampGroup('taillights', 'tail');
  const brake = lampGroup('brakelights', 'brake');
  const rev = lampGroup('reverselights', 'reverse');
  const ind = { L: lampGroup('indicator_L', 'signal'), R: lampGroup('indicator_R', 'signal') };
  const housing = new THREE.MeshPhysicalMaterial({ name: 'lamp_housing', color: '#16181b', roughness: 0.3, metalness: 0.4, clearcoat: 0.8 });
  const frontX = h - (v.shortNose ? 0.12 : 0.05);
  for (const s of [1, -1]) {
    const lz = s * (fWidth(h - 0.2) / 2 - 0.32);
    const ly = v.hood ? v.hood.height - 0.35 : (v.shortNose ? v.belt - 0.25 : 0.72);
    const side = s < 0 ? 'L' : 'R';
    const fp = loft.pointAt(h - 0.03, 'lower', 0.5, s);
    const fx = Math.min(frontX, fp.point.x) - 0.01;
    if (v.retro) {
      mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 28).rotateZ(Math.PI / 2), M.chrome(), { parent: body, at: [fx, ly, lz] });
      head.add(body, { at: [fx + 0.03, ly, lz], normal: [1, 0, 0], w: 0.22, h: 0.22, shape: 'round', depth: 0.02, bezel: false });
      ind[side].add(body, { at: [fx + 0.01, ly - 0.24, lz], normal: [1, 0, 0], w: 0.1, h: 0.1, shape: 'round', depth: 0.02 });
    } else {
      mesh(roundedBox(0.06, 0.26, 0.5, 0.05), housing, { parent: body, at: [fx, ly, lz] });
      for (const dz of [-0.11, 0.11]) head.add(body, { at: [fx + 0.03, ly + 0.03, lz + dz], normal: [1, 0, 0], w: 0.15, h: 0.12, shape: 'round', depth: 0.015, bezel: false });
      drl.add(body, { at: [fx + 0.03, ly - 0.085, lz - s * 0.04], normal: [1, 0, 0], w: 0.3, h: 0.035, shape: 'strip', depth: 0.012, bezel: false });
      ind[side].add(body, { at: [fx + 0.03, ly - 0.085, lz + s * 0.18], normal: [1, 0, 0], w: 0.09, h: 0.04, depth: 0.012, bezel: false });
    }
    // rear column: indicator / brake / tail / reverse, on a dark housing
    const rz = s * (W / 2 - 0.17);
    const rx = -h - 0.005;
    mesh(roundedBox(0.05, 0.98, 0.2, 0.04), housing, { parent: body, at: [rx + 0.02, 1.08, rz] });
    ind[side].add(body, { at: [rx, 1.47, rz], normal: [-1, 0, 0], w: 0.15, h: 0.14, depth: 0.015, bezel: false });
    brake.add(body, { at: [rx, 1.25, rz], normal: [-1, 0, 0], w: 0.15, h: 0.24, depth: 0.015, bezel: false });
    tail.add(body, { at: [rx, 0.98, rz], normal: [-1, 0, 0], w: 0.15, h: 0.26, depth: 0.015, bezel: false });
    rev.add(body, { at: [rx, 0.72, rz], normal: [-1, 0, 0], w: 0.15, h: 0.12, depth: 0.015, bezel: false });
    // side repeater on the skin just behind the front wheel
    const rp = loft.pointAt(v.xf - ar - 0.25, 'lower', 0.45, s);
    ind[side].add(body, { at: rp.point.toArray(), normal: rp.normal.toArray(), w: 0.13, h: 0.05, depth: 0.012, bezel: false });
    mesh(roundedBox(0.15, 0.07, 0.1, 0.02), housing, { parent: body, at: rp.point.clone().addScaledVector(rp.normal, -0.048).toArray() }); // repeater pod set into the panel
    // marker lights along the roof edge (amber) are part of the tail group so they light with 'lights'
  }
  // high-level brake light on the rear top
  {
    const ry = H - 0.22;
    let bx = -h;
    for (let t = 0; t <= 1.0001; t += 0.05) { const p = loft.pointAt(-h, 'side', t, 1); if (Math.abs(p.point.y - ry) < 0.08) bx = Math.max(bx, p.point.x); }
    for (let t = 0; t <= 1.0001; t += 0.05) { const p = loft.pointAt(-h, 'roofCorner', t, 1); if (Math.abs(p.point.y - ry) < 0.08) bx = Math.max(bx, p.point.x); }
    mesh(roundedBox(0.2, 0.08, 0.7, 0.02), housing, { parent: body, at: [bx + 0.09, ry, 0] }); // housing set into the rear cap
    brake.add(body, { at: [bx - 0.012, ry, 0], normal: [-1, 0, 0], w: 0.6, h: 0.05, shape: 'strip', depth: 0.012 });
  }
  // studio emblem front + rear
  const be = brandEmblem(0.22, { name: 'emblem_front' });
  { const bp = loft.pointAt(h, 'lower', 0.3); } be.position.set(h + 0.02 + (v.shortNose ? -0.06 : 0), v.hood ? v.hood.height - 0.15 : (v.shortNose ? v.belt - 0.35 : 0.68), 0);
  be.rotation.y = Math.PI / 2;
  body.add(be);
  const br = brandEmblem(0.2, { name: 'emblem_rear' });
  br.position.set(-h - 0.02, 1.25, 0);
  { // sit on the real rear surface (raked tails, e.g. the airport bus, are set back at emblem height)
    body.updateMatrixWorld(true);
    const hit = new THREE.Raycaster(new THREE.Vector3(-h - 2, 1.25, 0).applyMatrix4(body.matrixWorld), new THREE.Vector3(1, 0, 0).transformDirection(body.matrixWorld)).intersectObject(body, true)[0];
    if (hit) br.position.x = body.worldToLocal(hit.point.clone()).x - 0.004;
  }
  br.rotation.y = -Math.PI / 2;
  body.add(br);
  // plates
  const plate = plateMaterial(`BS ${String(L * 100 + W * 10).slice(0, 4)}`);
  const plateGeo = new THREE.PlaneGeometry(0.52, 0.12);
  { const pf = mesh(roundedBox(0.012, 0.13, 0.54, 0.004), trim, { parent: body, at: [h + 0.006, 0.45, 0] }); mesh(plateGeo, plate, { parent: body, at: [h + 0.014, 0.45, 0], rot: [0, Math.PI / 2, 0] }); }
  { mesh(roundedBox(0.012, 0.13, 0.54, 0.004), trim, { parent: body, at: [-h - 0.006, 0.6, 0] }); mesh(plateGeo, plate, { parent: body, at: [-h - 0.014, 0.6, 0], rot: [0, -Math.PI / 2, 0] }); }

  // destination display (behind windshield top) + side display
  if (v.destination) {
    const tex = destinationTexture(v.destination);
    const signMat = tex
      ? new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 1.3, roughness: 0.5 })
      : M.emissive('#ffb000', 1.2);
    const sy = v.openTop ? 2.12 : v.decks ? H - 0.28 : H - 0.33;
    const sx = v.shortNose ? h - v.shortNose - 1.1 : h - 0.18 - (v.rake?.front ?? 0) * 0.6;
    const sign = group('destination', { parent: body, at: [sx, sy, 0] });
    mesh(new THREE.BoxGeometry(0.05, 0.3, W * 0.8), trim, { parent: sign });
    // hanger plate up to the roof skin
    const roofY = v.openTop ? sy + 0.15 : (v.decks ? H : H) - 0.005;
    if (roofY > sy + 0.16) mesh(new THREE.BoxGeometry(0.04, roofY - sy - 0.15 + 0.03, W * 0.5), trim, { parent: sign, at: [-0.03, (roofY - sy + 0.15) / 2 + 0.015, 0] });
    const face = new THREE.PlaneGeometry(W * 0.76, 0.22);
    face.rotateY(Math.PI / 2);
    mesh(face, signMat, { parent: sign, at: [0.03, 0, 0] });
  }

  // point on the real skin at station x nearest height y (side s), pushed `inset` into the panel
  const skinPoint = (x, y, s, inset = 0.02) => {
    let best = null;
    for (const seg of ['lower', 'side', 'roofCorner']) for (let t = 0; t <= 1.0001; t += 0.05) {
      const p = loft.pointAt(x, seg, t, s);
      if (!best || Math.abs(p.point.y - y) < Math.abs(best.point.y - y)) best = p;
    }
    return best.point.clone().addScaledVector(best.normal, -inset);
  };
  // mirrors (rabbit-ear style for city buses, side arms otherwise): arms start IN the skin
  for (const s of [1, -1]) {
    const tipZ = s * (W / 2 + 0.22);
    if (!v.hood && !v.shortNose) {
      const baseY = (v.decks ? 2.4 : H - 0.25);
      const b = skinPoint(h - 0.12, baseY, s, 0.03);
      const tx = Math.max(h + 0.3, b.x + 0.35);
      curveTube([b.toArray(), [tx - 0.12, baseY + 0.12, s * (W / 2 + 0.02)], [tx, baseY - 0.25, tipZ]], 0.022, frameMat, { parent: body });
      mesh(cushion(0.1, 0.38, 0.2, { radius: 0.04, bulge: 0.1 }), frameMat, { parent: body, at: [tx, baseY - 0.45, tipZ] });
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 10), frameMat, { parent: body, at: [tx, baseY - 0.24, tipZ] }); // arm → head joint
    } else {
      const mx = v.hood ? v.hood.start + 0.1 : h - v.shortNose + 0.05;
      const my = v.hood ? 2.1 : v.belt + 0.35;
      const b = skinPoint(mx, my, s, 0.03);
      curveTube([b.toArray(), [b.x + 0.15, my + 0.05, tipZ]], 0.018, frameMat, { parent: body });
      mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 10), frameMat, { parent: body, at: [b.x + 0.15, my + 0.0, tipZ] });
      mesh(cushion(0.1, 0.36, 0.18, { radius: 0.04, bulge: 0.1 }), frameMat, { parent: body, at: [b.x + 0.15, my - 0.1, tipZ] });
    }
  }
  // wipers
  const wy = v.hood ? v.hood.height + 0.2 : v.shortNose ? v.belt + 0.35 : 1.1;
  const wx = v.hood ? v.hood.start + 0.04 : v.shortNose ? h - v.shortNose : h + 0.01;
  if (!v.hood && !v.shortNose) {
    for (const z of [0.6, -0.45]) {
      const wp = loft.pointAt(h - 0.004, 'lower', 0.66, 1);
      const wiper = group(null, { parent: body, at: [wp.point.x - 0.004, wp.point.y + 0.05, z], rot: [0.22, 0, 0] });
      mesh(roundedBox(0.018, 0.012, 0.9, 0.005), trim, { parent: wiper });
      mesh(roundedBox(0.014, 0.02, 0.85, 0.006), M.rubber(), { parent: wiper, at: [0.012, 0, 0] });
    }
  }

  // roof equipment (sits on the roof: H is the roof top at the centreline)
  const roofGrey = M.matte('#d9dcdf', 0.6);
  const extraAnims = [];
  if (!v.decks) {
    if (v.express) {
      // aerodynamic roof fairing over the AC
      mesh(cushion(4.2, 0.3, 1.9, { radius: 0.14, bulge: 0.15 }), paint, { parent: body, at: [-h + 3.4, H + 0.13, 0], name: 'aircon' });
    } else mesh(roundedBox(2.6, 0.24, 1.7, 0.08), roofGrey, { parent: body, at: [-h + 3.2, H + 0.11, 0], name: 'aircon' });
    if (!v.battery) for (const x of [-0.5, 2]) mesh(roundedBox(0.7, 0.06, 0.7, 0.03), M.matte('#bfc3c7', 0.6), { parent: body, at: [x, H + 0.02, 0] });
  }
  if (v.battery && !v.decks) {
    // battery packs along the roof under a fairing
    const roofEnd = (v.shortNose ? h - v.shortNose - 0.9 : h - 0.6) - 0.95;
    const x0 = Math.max(-h + 1.2, Math.min(-h + 5.6, roofEnd));
    const packs = Math.max(1, Math.min(Math.max(2, Math.floor((L - 6) / 2.2)), Math.floor((roofEnd - x0) / 2.15) + 1));
    const batMat = M.matte('#eceff1', 0.5);
    for (let k = 0; k < packs; k++) mesh(cushion(1.9, 0.22, 1.5, { radius: 0.08, bulge: 0.1 }), batMat, { parent: body, at: [x0 + k * 2.15, H + 0.1, 0], name: 'battery' });
    // charging flap on the front-right side
    const cp = loft.pointAt(v.xf + ar + 0.35, 'lower', 0.7, 1);
    const flap = mesh(roundedBox(0.28, 0.2, 0.012, 0.03), M.plastic('#263238', 0.4), { parent: body, name: 'charge_flap' });
    flap.position.copy(cp.point).addScaledVector(cp.normal, 0.004);
    flap.lookAt(flap.position.clone().add(cp.normal));
  }
  if (v.poles) {
    // trolley poles: base on the roof, two long poles to the overhead wires, raise/lower animation
    const base = group('trolley_base', { parent: body, at: [-0.6, H + 0.02, 0] });
    mesh(roundedBox(1.0, 0.14, 1.0, 0.04), M.metal('#5f6368', 0.4), { parent: base, at: [0, 0.07, 0] });
    for (const z of [0.22, -0.22]) {
      const pole = group(`trolley_pole_${z > 0 ? 'R' : 'L'}`, { parent: base, at: [0, 0.18, z], rot: [0, 0, 1.5] });
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 12), M.metal('#3c4043', 0.4), { parent: pole });
      mesh(new THREE.CylinderGeometry(0.025, 0.035, 6.2, 10), M.metal('#80868b', 0.3), { parent: pole, at: [0, 3.1, 0] });
      mesh(roundedBox(0.08, 0.14, 0.1, 0.02), M.metal('#202124', 0.5), { parent: pole, at: [0, 6.25, 0] });
      extraAnims.push(rotateTrack(pole, 'z', 4, (t) => 1.5 - Math.min(1, pingPong(t) * 1.4) * 0.35));
    }
    // pole hooks/retainers at the rear
    for (const z of [0.22, -0.22]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 8), M.metal('#3c4043'), { parent: body, at: [-h + 0.5, H + 0.3, z] });
  }
  if (v.openTop) {
    // upper deck railing around the open top + top of the lower deck walls
    const railMat = M.paint('#e0e0e0', { metallic: 0.6, roughness: 0.3 });
    const ry = H + 0.28;
    for (const s of [1, -1]) {
      tube([-h + 0.35, ry, s * (W / 2 - 0.1)], [h - 0.6, ry, s * (W / 2 - 0.1)], 0.025, railMat, { parent: body });
      for (let x = -h + 0.35; x <= h - 0.6; x += 1.1) {
        // stanchions rise from the top edge of the upper-deck wall
        const b = loft.pointAt(x, 'roofCorner', 0.0, s);
        const foot = b.point.clone().addScaledVector(b.normal, -0.01);
        tube(foot.toArray(), [x, ry, s * (W / 2 - 0.1)], 0.02, railMat, { parent: body });
      }
    }
    tube([h - 0.6, ry, -(W / 2 - 0.1)], [h - 0.6, ry, W / 2 - 0.1], 0.025, railMat, { parent: body });
    tube([-h + 0.35, ry, -(W / 2 - 0.1)], [-h + 0.35, ry, W / 2 - 0.1], 0.025, railMat, { parent: body });
  }
  if (v.bikeRack) {
    // folding front bike rack (frame + two wheel trays)
    const rack = group('bike_rack', { parent: body, at: [h + 0.02, 0.5, 0] });
    for (const z of [0.55, -0.55]) tube([0, 0, z], [0.4, 0.05, z], 0.022, M.metal('#3c4043'), { parent: rack });
    tube([0.4, 0.05, 0.62], [0.4, 0.05, -0.62], 0.022, M.metal('#3c4043'), { parent: rack });
    for (const y of [0.0, 0.08]) mesh(roundedBox(0.08, 0.04, 1.5, 0.015), M.metal('#5f6368'), { parent: rack, at: [0.22 + y, 0.06 + y * 0.5, 0] });
    tube([0.4, 0.05, 0.3], [0.38, 0.7, 0.3], 0.02, M.metal('#3c4043'), { parent: rack });
  }
  if (v.advert) {
    // side advertising panels (lettered) + roof-edge ad board
    const ad = canvasTex(512, 128, (g, w, hh) => {
      const grd = g.createLinearGradient(0, 0, w, 0);
      grd.addColorStop(0, '#ff6f00'); grd.addColorStop(1, '#d81b60');
      g.fillStyle = grd; g.fillRect(0, 0, w, hh);
      g.fillStyle = '#fff'; g.font = 'bold 64px Arial'; g.textBaseline = 'middle'; g.fillText('FRESH  JUICE', 24, hh / 2 + 4);
      g.beginPath(); g.arc(w - 64, hh / 2, 40, 0, Math.PI * 2); g.fillStyle = '#ffeb3b'; g.fill();
    });
    const adMat = new THREE.MeshStandardMaterial({ map: ad, color: ad ? '#ffffff' : '#ff6f00', roughness: 0.4 });
    for (const s of [1, -1]) {
      const xa = -h + 0.9;
      const xb = Math.min(v.xf - ar - 0.4, xa + 4.2);
      if (s > 0 && inDoor(xa, xb)) continue;
      mesh(loft.patch({ x: [xa, xb], from: I('lower', 0.3), to: I('lower', 0.92), side: s > 0 ? 'pos' : 'neg', skipHoles: true, offset: 0.004 }), adMat, { parent: body, name: 'advert' });
    }
  }
  if (v.underglow || v.neon) {
    // LED strip along the sills (glow when 'lights' or 'party' plays)
    const led = lampGroup(v.neon ? 'neon' : 'underglow', v.neon ? 'blue' : 'white');
    for (const s of [1, -1]) {
      const lp = loft.pointAt(0, 'corner', 0.6, s);
      led.add(body, { at: [(v.xf + v.xr) / 2, lp.point.y, lp.point.z], normal: lp.normal.toArray(), w: Math.max(1, v.xf - v.xr - 2 * ar - 0.4), h: 0.04, shape: 'strip', depth: 0.01, bezel: false, glowSize: 0.5 });
    }
    if (v.neon) {
      const led2 = lampGroup('neon2', 'red');
      for (const s of [1, -1]) {
        const lp = loft.pointAt(0, 'side', 0.98, s);
        led2.add(body, { at: [0, lp.point.y, lp.point.z], normal: lp.normal.toArray(), w: L - 3, h: 0.035, shape: 'strip', depth: 0.01, bezel: false, glowSize: 0.4 });
      }
      extraAnims.party = sirenClip('neon', 'neon2', { period: 0.8, intensity: 3, clipName: 'party' });
    }
  }

  // school bus specifics
  if (v.schoolRails) {
    const stop = group('stop_arm', { parent: body, at: [v.hood.start - 0.6, 1.9, -W / 2 - 0.004] });
    mesh(roundedBox(0.1, 0.12, 0.03, 0.01), trim, { parent: stop, at: [0.25, 0, 0.0] });
    const oct = new THREE.CylinderGeometry(0.22, 0.22, 0.02, 8).rotateX(Math.PI / 2).rotateZ(Math.PI / 8);
    mesh(oct, M.paint('#c62828'), { parent: stop, at: [0, 0, -0.012] });
    const stopTxt = canvasTex(128, 128, (g) => { g.fillStyle = '#c62828'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#fff'; g.font = 'bold 40px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STOP', 64, 66); });
    if (stopTxt) mesh(new THREE.CircleGeometry(0.2, 8).rotateZ(Math.PI / 8), new THREE.MeshStandardMaterial({ map: stopTxt, roughness: 0.5 }), { parent: stop, at: [0, 0, -0.0235], rot: [0, Math.PI, 0] });
    for (const z of [0.95, -0.95]) for (const x of [h - v.L + 0.05, v.hood.start - 0.05]) {
      mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 20).rotateZ(Math.PI / 2), M.emissive(x > 0 ? '#ff9800' : '#e53935', 1), { parent: body, at: [x + (x > 0 ? 0.03 : -0.03), H - 0.2, z] });
    }
    // grille on hood nose
    mesh(roundedBox(0.04, 0.6, 1.0, 0.03), M.chrome(), { parent: body, at: [h + 0.005, v.hood.height - 0.45, 0] });
  }

  // luggage bay doors (coach)
  if (v.luggage) {
    const seam = new THREE.MeshStandardMaterial({ color: M.toColor(o.color ?? v.color).clone().multiplyScalar(0.5), roughness: 0.7 });
    for (const s of [1, -1]) for (let x = v.xr + 1.0; x < v.xf - 1.0; x += 1.15) {
      mesh(new THREE.BoxGeometry(0.012, 0.75, 0.004), seam, { parent: body, at: [x, 0.85, s * (W / 2 + 0.012)] });
    }
  }

  // ---------------- doors ----------------
  const doorTracks = [];
  [...doorRanges.map((d) => [...d, 1]), ...doorsNeg.map((d) => [...d, -1])].forEach(([d0, d1, ds], di) => {
    const dw = d1 - d0;
    const top = v.decks ? 2.15 : (v.hood ? 2.6 : H - 0.32);
    const bottom = v.floor > 0.6 ? 0.45 : 0.36;
    const dh = top - bottom;
    for (const leaf of [0, 1]) {
      const hingeX = leaf === 0 ? d0 + 0.02 : d1 - 0.02;
      const dir = leaf === 0 ? 1 : -1;
      const pivot = group(`door${di}_${leaf}`, { parent: body, at: [hingeX, bottom + dh / 2, ds * (W / 2 + 0.01)] });
      const lw = dw / 2 - 0.03;
      const cx = (dir * lw) / 2;
      mesh(new THREE.BoxGeometry(lw, dh, 0.012), glass, { parent: pivot, at: [cx, 0, 0] });
      for (const [fx, fy, fw, fh] of [[cx, dh / 2 - 0.04, lw, 0.08], [cx, -dh / 2 + 0.1, lw, 0.2], [cx, 0, lw, 0.04], [dir * 0.03, 0, 0.06, dh], [dir * (lw - 0.03), 0, 0.06, dh]]) {
        mesh(new THREE.BoxGeometry(fw, fh, 0.03), frameMat, { parent: pivot, at: [fx, fy, -0.005] });
      }
      doorTracks.push(rotateTrack(pivot, 'y', 5, (t) => ds * dir * Math.min(1, pingPong(t) * 1.6) * 1.35));
    }
  });

  // ---------------- interior ----------------
  const floorY = v.floor;
  const cabinFront = v.hood ? v.hood.start - 0.05 : v.shortNose ? h - v.shortNose - 0.3 : h - 0.3;
  const cabinLen = cabinFront - (-h + 0.25);
  const cabinMid = (cabinFront + (-h + 0.25)) / 2;
  {
    const floorMat = M.matte('#4a4d50', 0.9);
    const cuts = axles.filter(() => floorY < wr + ar).map((wx) => [wx - ar - 0.03, wx + ar + 0.03]).sort((a2, b2) => a2[0] - b2[0]);
    let x0 = -h + 0.25;
    for (const [c0, c1] of [...cuts, [cabinFront, cabinFront]]) {
      const x1 = Math.min(c0, cabinFront);
      if (x1 - x0 > 0.05) mesh(roundedBox(x1 - x0, 0.04, W - 0.14, 0.015), floorMat, { parent: body, at: [(x0 + x1) / 2, floorY, 0], name: 'floor' });
      x0 = Math.max(x0, c1);
    }
    // wheel housings inside the cabin (seats and floor go around them)
    for (const [c0, c1] of cuts) {
      const hw = c1 - c0;
      for (const sz of [1, -1]) {
        mesh(roundedBox(hw, wr + ar + 0.06 - floorY, 0.55, 0.08), M.matte('#5c6064', 0.8), { parent: body, at: [(c0 + c1) / 2, floorY + (wr + ar + 0.06 - floorY) / 2, sz * (W / 2 - 0.35)], name: 'wheel-housing' });
      }
      mesh(roundedBox(hw, 0.04, W - 1.25, 0.015), floorMat, { parent: body, at: [(c0 + c1) / 2, floorY, 0] });
    }
  }
  // ceiling light strips
  for (const s of [1, -1]) mesh(roundedBox(cabinLen - 1.0, 0.03, 0.1, 0.012), M.emissive('#fff8e8', 0.8), { parent: body, at: [cabinMid - 0.3, (v.decks ? 2.1 : H - 0.22), s * 0.55] });
  if (v.decks) mesh(new THREE.BoxGeometry(cabinLen, 0.06, W - 0.14), M.matte('#5a5d61', 0.9), { parent: body, at: [cabinMid, 2.25, 0] });

  // seats via InstancedMesh (cheap, hundreds possible)
  const seatColor = o.seatColor ?? (variant === 'coach' ? '#29467a' : variant === 'school' ? '#3b5d3b' : '#c62828');
  const seatGeo = cushion(0.42, 0.1, 0.42, { radius: 0.04 });
  const backGeo = cushion(0.08, 0.55, 0.42, { radius: 0.035 });
  const seatPositions = [];
  const deckYs = v.decks ? [floorY, 2.28] : [floorY];
  const seatPitch = v.luggage ? 0.9 : 0.78;
  const seatEnd = (v.hood ? v.hood.start - 1.3 : v.shortNose ? h - v.shortNose - 1.3 : h - 2.0);
  for (const fy of deckYs) {
    for (let x = -h + 0.9; x < seatEnd; x += seatPitch) {
      for (const z of [0.95, 0.5, -0.5, -0.95].map((k) => (k * W) / 2.55)) {
        const overDoor = (z > 0 ? doorRanges : doorsNeg).some(([d0, d1]) => x > d0 - 0.6 && x < d1 + 0.4) || (v.joint != null && Math.abs(x - v.joint) < 0.6) || (v.standing && Math.abs(z) < 0.8);
        const overArch = fy === floorY && axles.some((wx) => Math.abs(x - wx) < ar + 0.1) && Math.abs(z) > 0.7 && !v.luggage && v.floor < 0.6;
        if (!overDoor && !overArch) seatPositions.push([x, fy, z]);
      }
    }
  }
  const seatMat = M.fabric(seatColor);
  const shellMat = M.plastic('#5a5f66', 0.5);
  const seats = new THREE.InstancedMesh(seatGeo, seatMat, seatPositions.length);
  const backs = new THREE.InstancedMesh(backGeo, seatMat, seatPositions.length);
  const legs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 8), shellMat, seatPositions.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const backTilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.12);
  seatPositions.forEach(([x, y, z], i) => {
    seats.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y + 0.45, z), q, new THREE.Vector3(1, 1, 1)));
    backs.setMatrixAt(i, m4.compose(new THREE.Vector3(x - 0.22, y + 0.76, z), backTilt, new THREE.Vector3(1, 1, 1)));
    legs.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y + 0.21, z), q, new THREE.Vector3(1, 1, 1)));
  });
  seats.name = 'seats';
  backs.name = 'seat_backs';
  legs.name = 'seat_legs';
  body.add(seats, backs, legs);
  // yellow grab poles
  const poleMat = M.paint('#f2b705', { metallic: 0.3, roughness: 0.3 });
  const poleH = (v.decks ? 2.25 : H - 0.15) - floorY;
  const poles = [];
  for (let x = -h + 1.6; x < seatEnd; x += seatPitch * 2) poles.push([x, 0.28], [x, -0.28]);
  const poleMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.018, poleH, 8), poleMat, poles.length);
  poles.forEach(([x, z], i) => poleMesh.setMatrixAt(i, m4.compose(new THREE.Vector3(x, floorY + poleH / 2, z), q, new THREE.Vector3(1, 1, 1))));
  poleMesh.name = 'poles';
  if (variant !== 'coach' && variant !== 'party' && !v.express) body.add(poleMesh);
  // driver
  const driverX = v.hood ? v.hood.start - 0.8 : v.shortNose ? h - v.shortNose - 0.8 : h - 1.1;
  mesh(cushion(0.5, 0.12, 0.5, { radius: 0.05 }), M.fabric('#222'), { parent: body, at: [driverX, floorY + 0.5, -(W / 2 - 0.55)] });
  mesh(cushion(0.1, 0.65, 0.5, { radius: 0.04 }), M.fabric('#222'), { parent: body, at: [driverX - 0.25, floorY + 0.85, -(W / 2 - 0.55)], rot: [0, 0, 0.12] });
  mesh(new THREE.TorusGeometry(0.24, 0.022, 10, 32), trim, { parent: body, at: [driverX + 0.45, floorY + 0.95, -(W / 2 - 0.55)], rot: [0, Math.PI / 2, 0.9] });
  const dashX = driverX + (v.hood || v.shortNose ? 0.45 : 0.75);
  mesh(roundedBox(0.4, 0.16, fWidth(dashX) - 0.4, 0.06), M.plastic('#1c1c1c'), { parent: body, at: [dashX - 0.05, floorY + 0.68, 0], name: 'dash' });

  // ---------------- shell ----------------
  const shellGeo = loft.bodyGeometry();
  mesh(shellGeo, paint, { parent: body, name: 'shell' });
  mesh(shellGeo, interior, { parent: body, name: 'cabin' });

  // ---------------- wheels ----------------
  if (v.hood) {
    for (const s of [1, -1]) {
      const fg = new THREE.CylinderGeometry(ar + 0.04, ar + 0.04, 0.4, 28, 1, true, -Math.PI / 2 - 0.25, Math.PI + 0.5);
      fg.rotateX(-Math.PI / 2);
      const fz = s * (W / 2 - 0.2);
      mesh(fg, new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.4, clearcoat: 0.5, side: THREE.DoubleSide }), { parent: body, at: [v.xf, wr, fz], name: 'fender' });
      // step joining fender to the hood side
      mesh(roundedBox(ar * 2.2, 0.06, Math.abs(fz) + 0.2 - fWidth(v.xf) / 2, 0.025), trim, { parent: body, at: [v.xf, wr + ar + 0.02, s * ((fWidth(v.xf) / 2 + Math.abs(fz) + 0.2) / 2)] });
    }
  }
  for (const wxp of axles) wheelWell(body, wxp, ar - 0.01, W * 0.92, wr);
  const wz = W / 2 - 0.2;
  const rearDual = variant !== 'minibus' && variant !== 'airport';
  const wheelList = [['wheel_FL', v.xf, wz, true], ['wheel_FR', v.xf, -wz, true]];
  if (v.xm != null) wheelList.push(['wheel_ML', v.xm, wz], ['wheel_MR', v.xm, -wz]);
  wheelList.push(['wheel_RL', v.xr, wz], ['wheel_RR', v.xr, -wz]);
  const { spins, steers } = addWheels(
    root,
    wheelList,
    { radius: wr, width: wr * 0.6, style: variant === 'coach' || variant === 'party' || v.express ? 'ten' : v.retro ? 'five' : 'steel', rimColor: variant === 'school' ? '#2b2b2b' : '#c9ccd1', caliper: false },
  );
  addAxles(root, axles, { radius: wr, z: wz, topY: wr + ar - 0.012, springZ: wz - wr * 0.6 / 2 - 0.12 - (rearDual ? wr * 0.62 : 0) - wr * 0.28, drive: [v.xr] });
  if (rearDual) for (const sp of spins.slice(v.xm != null ? 4 : 2)) {
    const inner = sp.children[0].clone();
    inner.position.z = -Math.sign(sp.parent.position.z) * wr * 0.62;
    sp.add(inner);
  }

  const spots = o.lights === false ? [] : addHeadlightSpots(body, [h + 0.05, v.hood ? v.hood.height - 0.35 : 0.72, W / 2 - 0.4]);
  const set = vehicleAnimations({
    spins, steers, radius: wr, speed: o.speed ?? 6, steerMax: 0.55,
    spots, lamps: { head: 'headlights', tail: 'taillights', brake: 'brakelights', reverse: 'reverselights', signalL: 'indicator_L', signalR: 'indicator_R' },
  });
  // DRL / underglow follow the 'lights' animation too
  const lightsClip = set.animations.find((a) => a.name === 'lights');
  if (lightsClip && !v.retro) lightsClip.tracks.push(new THREE.NumberKeyframeTrack('drl.material.emissiveIntensity', [0, 1], [2.5, 2.5]), new THREE.NumberKeyframeTrack('drl_glow.material.opacity', [0, 1], [0.6, 0.6]));
  if (lightsClip && v.underglow && !v.neon) lightsClip.tracks.push(new THREE.NumberKeyframeTrack('underglow.material.emissiveIntensity', [0, 1], [3, 3]), new THREE.NumberKeyframeTrack('underglow_glow.material.opacity', [0, 1], [0.8, 0.8]));
  const animations = [
    ...set.animations,
    clip('doors', 5, doorTracks),
    clip('idle', 0.2, [moveTrack(body, 0.2, (t) => [0, Math.sin(t * Math.PI * 2) * 0.003, 0], 6)]),
  ];
  // kneeling: the curb side (+Z) lowers ~8 cm for boarding, then rises
  animations.push(clip('kneel', 4, [moveTrack(body, 4, (t) => [0, -0.08 * Math.min(1, pingPong(t) * 1.6), 0], 24), rotateTrack(body, 'x', 4, (t) => 0.012 * Math.min(1, pingPong(t) * 1.6), 24)]));
  if (v.poles) animations.push(clip('poles', 4, extraAnims.filter((x) => x.times)));
  if (extraAnims.party) animations.push(extraAnims.party);
  if (v.schoolRails) {
    const arm = body.getObjectByName('stop_arm');
    animations.push(clip('stopArm', 4, [rotateTrack(arm, 'y', 4, (t) => -Math.min(1, pingPong(t) * 1.5) * 1.5)]));
  }
  const bus = finalize(root, { type: 'bus', variant, options: o, animations });
  bus.userData.premade.oneShot = set.oneShot;
  bus.userData.premade.exclusive = set.exclusive;
  return bus;
}
