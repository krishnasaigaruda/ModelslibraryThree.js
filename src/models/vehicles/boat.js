import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, tube, extrudeOutline, lathe, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { spinTrack, rotateTrack, moveTrack, clip, wave, pingPong } from '../../core/animation.js';
import { navLights, textMaterial, decal, sirenClip } from './misc-kit.js';
import { lampGroup } from '../../core/lamps.js';
import { tubeLoft, wingGeometry, glassMaterial, lerp, emblemOn } from './helicopter.js';

/*
 * Boats: hull loft with real V/round sections, sheer spring, flare and a transom,
 * waterline at y = 0 (hull extends below). Front = +X, starboard (right) = +Z.
 */

const clamp01 = (t) => THREE.MathUtils.clamp(t, 0, 1);

/**
 * Hull surface + deck + transom.
 *  L, B (half beam), F (freeboard at midship), D (draft), bowLen, bowP, sternW (transom width ratio, 0 = pointed),
 *  spring (sheer rise at bow), vee (0 round bilge … 1 hard V), bulwark (deck below sheer), stripe height.
 */
function hull(spec) {
  const { L, B, F, D } = spec;
  const h = L / 2;
  const bowLen = spec.bowLen ?? L * 0.35;
  const bowP = spec.bowP ?? 1.8;
  const sternLen = spec.sternLen ?? L * 0.12;
  const sternW = spec.sternW ?? 0.85;
  const spring = spec.spring ?? F * 0.35;
  const vee = spec.vee ?? 0.5;
  const bulwark = spec.bulwark ?? 0.08;
  const halfB = (x) => {
    let b = B;
    if (x > h - bowLen) {
      const u = clamp01((x - (h - bowLen)) / bowLen);
      b *= (1 - u ** bowP) ** (1 / bowP);
    }
    if (x < -h + sternLen) {
      const u = clamp01((-h + sternLen - x) / sternLen);
      b *= sternW > 0 ? lerp(1, sternW, u ** 1.5) : (1 - u ** 2) ** 0.5;
    }
    return Math.max(b, 0.0005);
  };
  const sheer = (x) => {
    const u = clamp01((x - (h - bowLen * 1.6)) / (bowLen * 1.6));
    const us = clamp01((-h + sternLen * 2 - x) / (sternLen * 2));
    return F + spring * u * u + (spec.sternSpring ?? F * 0.05) * us;
  };
  const keel = (x) => {
    const u = clamp01((x - (h - bowLen * 0.9)) / (bowLen * 0.9));
    const us = clamp01((-h + sternLen - x) / sternLen);
    return lerp(-D, sheer(h) * 0.55, u ** 1.8) + (sternW > 0 ? D * 0.25 * us : lerp(0, D + sheer(-h) * 0.5, us ** 2));
  };
  // half section: keel (u=0) → sheer (u=1), quadratic bezier through a bilge control point
  const K = 16;
  const sectionPts = (x) => {
    const b = halfB(x);
    const yk = keel(x);
    const ys = sheer(x);
    const cz = b * lerp(1.0, 0.55, vee);
    const cy = lerp(yk, ys, lerp(0.0, 0.35, vee));
    const pts = [];
    for (let k = 0; k <= K; k++) {
      const t = k / K;
      const u = 1 - t;
      let z = 2 * u * t * cz + t * t * b;
      const y = u * u * yk + 2 * u * t * cy + t * t * ys;
      z *= 1 + (spec.flare ?? 0.06) * t * t; // flare outward toward the sheer
      pts.push([z, y]);
    }
    return pts;
  };
  let xs = [];
  const N = spec.stations ?? 90;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    xs.push(-h + L * (0.5 * t + 0.5 * (0.5 - 0.5 * Math.cos(Math.PI * t))));
  }
  xs = [...new Set(xs)].sort((a, b) => a - b);
  const S = xs.length;
  const R = 2 * K + 1; // port sheer → keel → starboard sheer
  const pos = [];
  for (const x of xs) {
    const pts = sectionPts(x);
    for (let k = K; k >= 0; k--) pos.push(x, pts[k][1], -pts[k][0]);
    for (let k = 1; k <= K; k++) pos.push(x, pts[k][1], pts[k][0]);
  }
  const groups = { 0: [], 1: [], 2: [] };
  const stripeY = spec.stripe ?? 0.12;
  for (let i = 0; i < S - 1; i++) {
    for (let j = 0; j < R - 1; j++) {
      const a = i * R + j;
      const b = i * R + j + 1;
      const c = (i + 1) * R + j;
      const d = (i + 1) * R + j + 1;
      const ym = (pos[a * 3 + 1] + pos[d * 3 + 1]) / 2;
      const xm = (xs[i] + xs[i + 1]) / 2;
      const g = ym < 0.03 ? 1 : ym > sheer(xm) - stripeY ? 2 : 0;
      groups[g].push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const index = [];
  for (const g of [0, 1, 2]) {
    geo.addGroup(index.length, groups[g].length, g);
    index.push(...groups[g]);
  }
  geo.setIndex(index);
  geo.computeVertexNormals();

  // deck (slightly below sheer, cambered)
  const dpos = [];
  const C = 12;
  for (const x of xs) {
    const b = Math.max(halfB(x) * (1 + (spec.flare ?? 0.06) * (bulwark > 0 ? 0.8 : 1)) - 0.01, 0.0005);
    const y0 = sheer(x) - bulwark;
    for (let k = 0; k <= C; k++) {
      const z = -b + (2 * b * k) / C;
      dpos.push(x, y0 + (spec.camber ?? B * 0.03) * (1 - (z / b) ** 2), z);
    }
  }
  const didx = [];
  for (let i = 0; i < S - 1; i++) for (let k = 0; k < C; k++) {
    const a = i * (C + 1) + k;
    const b = a + 1;
    const c = a + C + 1;
    const d = c + 1;
    didx.push(a, b, c, b, d, c);
  }
  const deck = new THREE.BufferGeometry();
  deck.setAttribute('position', new THREE.Float32BufferAttribute(dpos, 3));
  deck.setIndex(didx);
  deck.computeVertexNormals();

  // transom (closes the stern section)
  let transom = null;
  if (sternW > 0) {
    const pts = sectionPts(-h);
    const shape = new THREE.Shape();
    shape.moveTo(-pts[K][0], pts[K][1]);
    for (let k = K; k >= 0; k--) shape.lineTo(-pts[k][0], pts[k][1]);
    for (let k = 1; k <= K; k++) shape.lineTo(pts[k][0], pts[k][1]);
    transom = new THREE.ShapeGeometry(shape, 1);
    transom.rotateY(-Math.PI / 2); // shape x(z) → world z, faces -X
    transom.translate(-h, 0, 0);
  }
  /** Exact hull surface at station x, section parameter t (0 keel … 1 sheer), side ±1 → { point, normal }. */
  const surface = (x, t, side = 1) => {
    const at = (xx, tt) => {
      const pts = sectionPts(xx);
      const f = tt * K;
      const i0 = Math.min(K - 1, Math.floor(f));
      const u = f - i0;
      return new THREE.Vector3(xx, lerp(pts[i0][1], pts[i0 + 1][1], u), side * lerp(pts[i0][0], pts[i0 + 1][0], u));
    };
    const p = at(x, t);
    const dx = at(x + 0.02, t).sub(at(x - 0.02, t));
    const dt = at(x, Math.min(1, t + 0.02)).sub(at(x, Math.max(0, t - 0.02)));
    const n = side > 0 ? dx.cross(dt) : dt.cross(dx);
    return { point: p, normal: n.normalize() };
  };
  return { surface, geo, deck, transom, halfB, sheer, keel, h, deckY: (x) => sheer(x) - bulwark, flareB: (x) => halfB(x) * (1 + (spec.flare ?? 0.06)) };
}

/** Cabin block with raked front/back and a dark window band that wraps the front. */
function cabin(parent, { x0, x1, y, h, w, rakeF = 0.4, rakeB = 0.1, mat, glassMat, band = [0.35, 0.85], rearGlass = false, radius = 0.08, emblem = 0 }) {
  const top0 = x0 + rakeB * h;
  const top1 = x1 - rakeF * h;
  const profile = [[x0, y], [x1, y], [top1, y + h], [top0, y + h]];
  const g = group(null, { parent });
  mesh(extrudeOutline(profile, w, { bevel: Math.min(radius, h * 0.2, w * 0.2) }), mat, { parent: g });
  const yA = y + h * band[0];
  const yB = y + h * band[1];
  const fx = (yy) => lerp(x1, top1, (yy - y) / h) + 0.02;
  const bx = (yy) => (rearGlass ? lerp(x0, top0, (yy - y) / h) - 0.02 : lerp(x0, top0, (yy - y) / h) + 0.25);
  const bandPts = [[bx(yA), yA], [fx(yA), yA], [fx(yB), yB], [bx(yB), yB]];
  mesh(extrudeOutline(bandPts, w + 0.03, { bevel: 0.012 }), glassMat, { parent: g, name: 'windows' });
  if (emblem) {
    const ex = lerp(x0, x1, 0.62) - rakeF * h * 0.1;
    const ey = y + h * band[0] * 0.5;
    for (const sd of [1, -1]) emblemOn(g, { point: new THREE.Vector3(ex, ey, sd * w / 2), normal: new THREE.Vector3(0, 0, sd) }, Math.min(emblem, h * band[0] * 0.8), 'emblem_cabin');
  }
  return { group: g, top: y + h, front: top1, back: top0 };
}

/** Deck rail: posts + rounded top rail following the deck edge. */
function railing(parent, H, x0, x1, height, mat, { inset = 0.06, step = 1.0, sides = [1, -1], bow = true } = {}) {
  for (const s of sides) {
    const pts = [];
    for (let x = x0; x <= x1 + 1e-6; x += (x1 - x0) / Math.max(4, Math.round((x1 - x0) / 0.5))) {
      pts.push([x, H.deckY(x) + height, s * Math.max(0.02, H.flareB(x) - inset)]);
    }
    if (bow) pts.push([H.h - 0.25, H.deckY(H.h - 0.25) + height, s * 0.02]);
    curveTube(pts, 0.018, mat, { parent, segments: 120 });
    for (let x = x0; x <= x1 + 1e-6; x += step) {
      const z = s * Math.max(0.02, H.flareB(x) - inset);
      mesh(new THREE.CylinderGeometry(0.014, 0.014, height, 8), mat, { parent, at: [x, H.deckY(x) + height / 2, z] });
    }
  }
}

function cleat(parent, at, mat) {
  const c = group(null, { parent, at });
  mesh(cushion(0.2, 0.04, 0.05, { radius: 0.018 }), mat, { parent: c, at: [0, 0.05, 0] });
  for (const dx of [-0.05, 0.05]) mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.05, 8), mat, { parent: c, at: [dx, 0.025, 0] });
  return c;
}

function radarUnit(parent, at, name) {
  const base = group(null, { parent, at });
  mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.18, 16), M.plastic('#e8e8e8', 0.4), { parent: base, at: [0, 0.09, 0] });
  const r = group(name, { parent: base, at: [0, 0.2, 0] });
  mesh(cushion(0.12, 0.08, 1.1, { radius: 0.035 }), M.plastic('#f2f2f2', 0.35), { parent: r });
  return r;
}

/* ------------------------------------------------------------------ */

export const BOAT_VARIANTS = {
  speedboat: { color: '#ffffff', accent: '#0b5aa6' },
  sailboat: { color: '#f6f5f0', accent: '#1a237e' },
  yacht: { color: '#fbfbfb', accent: '#1c1f24' },
  fishing: { color: '#1f3b63', accent: '#f2f2f2' },
  rowboat: { color: '#8d5a3b', accent: '#5d3a24' },
  kayak: { color: '#f57c00', accent: '#222222' },
  ferry: { color: '#f4f4f4', accent: '#0d47a1' },
  tugboat: { color: '#b71c1c', accent: '#1b1b1b' },
  'cargo-ship': { color: '#24364d', accent: '#f2f2f2' },
  canoe: { color: '#2e7d32', accent: '#c8a165' },
  'jet-ski': { color: '#f5f5f5', accent: '#00acc1' },
  pontoon: { color: '#eceff1', accent: '#1565c0' },
  lifeboat: { color: '#f57c00', accent: '#f5f5f5' },
  'police-boat': { color: '#f5f5f5', accent: '#0d47a1' },
  catamaran: { color: '#fafafa', accent: '#26a69a' },
};

/** Trims: deck equipment packages (each adds real parts). */
export const BOAT_TRIM_NAMES = {
  small: ['fishing-rig', 'flags', 'dry-bags', 'cooler', 'fenders'],
  big: ['bimini', 'fishing-rig', 'flags', 'fenders', 'radar-arch'],
};
const SMALL_BOATS = ['rowboat', 'kayak', 'canoe', 'jet-ski'];

export function createBoat(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BOAT_VARIANTS, o.variant, 'boat');
  const v = BOAT_VARIANTS[variant];
  const root = group(`boat-${variant}`);
  const vessel = group('vessel', { parent: root });
  const hullPaint = variant === 'rowboat' ? M.wood(o.color ?? 'walnut') : M.paint(o.color ?? v.color, { metallic: 0.15, roughness: 0.25 });
  const antifoul = M.matte(variant === 'kayak' ? (o.color ?? v.color) : '#8e2a1e', 0.7);
  const accent = M.paint(o.accentColor ?? v.accent, { metallic: 0.15 });
  const white = M.paint('#f7f7f5', { metallic: 0.1, roughness: 0.3 });
  const inner = (m) => { const c = m.clone(); c.side = THREE.BackSide; return c; };
  const darkGlass = new THREE.MeshPhysicalMaterial({ name: 'window', color: '#10171d', roughness: 0.05, metalness: 0.6, clearcoat: 1 });
  const steel = M.metal('#c9cdd1', 0.25);
  const teak = M.wood('#b07a45');
  const nonSkid = M.matte('#e4e2dc', 0.9);
  const tracks = { extra: [] };

  let mainHull = null;
  const addHull = (spec, deckMat = nonSkid) => {
    const H = hull(spec);
    mainHull ??= H;
    mesh(H.geo, [hullPaint, antifoul, accent], { parent: vessel, name: 'hull' });
    mesh(H.geo, inner(variant === 'rowboat' ? hullPaint : white), { parent: vessel, name: 'hull_inner' });
    mesh(H.deck, deckMat, { parent: vessel, name: 'deck' });
    if (spec.emblem) for (const sd of [1, -1]) emblemOn(vessel, H.surface(H.h - (spec.bowLen ?? spec.L * 0.35) * 0.55, 0.8, sd), spec.emblem, 'emblem_bow');
    if (H.transom) mesh(H.transom, new THREE.MeshPhysicalMaterial({ color: hullPaint.color, roughness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide }), { parent: vessel, name: 'transom' });
    return H;
  };

  ({
    speedboat() {
      const H = addHull({ emblem: 0.26, L: 6.6, B: 1.18, F: 0.72, D: 0.42, vee: 0.85, bowLen: 2.7, bowP: 1.7, sternW: 0.92, spring: 0.22, flare: 0.08, stripe: 0.1, bulwark: 0.22 });
      // console + curved windshield
      const cy = H.deckY(0.4);
      mesh(cushion(0.7, 0.75, 0.75, { radius: 0.1, bulge: 0.05 }), white, { parent: vessel, at: [0.55, cy + 0.37, 0.35] });
      const ws = new THREE.CylinderGeometry(1.05, 1.05, 0.42, 40, 1, true, -1.1, 2.2);
      ws.rotateY(Math.PI / 2);
      mesh(ws, glassMaterial(0.35, '#1d2a33'), { parent: vessel, at: [-0.05, cy + 0.95, 0], rot: [0, 0, -0.35] });
      curveTube(Array.from({ length: 12 }, (_, i) => { const a = -1.1 + (2.2 * i) / 11; return [-0.05 + Math.cos(a) * 1.05 - 0.07, cy + 1.14, Math.sin(a) * 1.05]; }), 0.018, steel, { parent: vessel });
      mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 24), M.plastic('#111'), { parent: vessel, at: [0.3, cy + 0.95, 0.35], rot: [0, Math.PI / 2, 0.5] });
      // seats
      for (const z of [0.38, -0.38]) {
        mesh(cushion(0.55, 0.14, 0.5, { radius: 0.06 }), M.fabric('#f1ece2'), { parent: vessel, at: [-0.35, cy + 0.42, z] });
        mesh(cushion(0.12, 0.45, 0.5, { radius: 0.05 }), M.fabric('#f1ece2'), { parent: vessel, at: [-0.62, cy + 0.68, z], rot: [0, 0, 0.15] });
        mesh(roundedBox(0.5, 0.36, 0.48, 0.06), white, { parent: vessel, at: [-0.35, cy + 0.18, z] });
      }
      mesh(cushion(0.7, 0.14, 1.6, { radius: 0.06 }), M.fabric('#f1ece2'), { parent: vessel, at: [-2.2, cy + 0.42, 0] });
      mesh(roundedBox(0.7, 0.36, 1.7, 0.06), white, { parent: vessel, at: [-2.2, cy + 0.18, 0] });
      // outboard engine
      const ob = group('outboard', { parent: vessel, at: [-3.42, H.deckY(-3.3) + 0.05, 0] });
      mesh(cushion(0.55, 0.7, 0.45, { radius: 0.15, bulge: 0.1 }), M.paint('#1b1b1b', { metallic: 0.3 }), { parent: ob, at: [-0.15, 0.25, 0] });
      mesh(roundedBox(0.18, 0.9, 0.12, 0.05), M.paint('#1b1b1b'), { parent: ob, at: [-0.1, -0.45, 0] });
      railing(vessel, H, 0.2, 2.6, 0.32, steel, { sides: [1, -1] });
      for (const s of [1, -1]) cleat(vessel, [-2.9, H.deckY(-2.9), s * 0.9], steel);
      tracks.extra.push(clip('cruise', 1.2, [rotateTrack(vessel, 'z', 1.2, (t) => 0.06 + wave(t) * 0.015), moveTrack(vessel, 1.2, (t) => [0, 0.08 + wave(t, 2) * 0.03, 0])]));
    },

    sailboat() {
      const H = addHull({ emblem: 0.3, L: 9.2, B: 1.5, F: 0.95, D: 0.45, vee: 0.35, bowLen: 3.6, bowP: 1.8, sternW: 0.82, spring: 0.25, flare: 0.05, stripe: 0.08 }, teak);
      // fin keel + rudder (aerofoil)
      const fin = wingGeometry({ span: 1.3, rootChord: 1.3, tipChord: 0.8, sweep: 0.35, thickness: 0.14, segs: 6 });
      fin.rotateX(Math.PI / 2);
      mesh(fin, M.matte('#1d1d1d', 0.6), { parent: vessel, at: [0.3, -0.35, 0] });
      const rud = wingGeometry({ span: 0.9, rootChord: 0.5, tipChord: 0.3, sweep: 0.1, thickness: 0.12, segs: 4 });
      rud.rotateX(Math.PI / 2);
      mesh(rud, M.matte('#1d1d1d', 0.6), { parent: vessel, at: [-3.9, -0.1, 0] });
      // cabin trunk
      const c = cabin(vessel, { x0: -1.4, x1: 1.9, y: H.deckY(0) - 0.02, h: 0.48, w: 1.9, rakeF: 1.1, rakeB: 0.25, mat: white, glassMat: darkGlass, band: [0.4, 0.75], emblem: 0.16 });
      // cockpit coaming
      mesh(roundedBox(2.2, 0.12, 1.9, 0.05), teak, { parent: vessel, at: [-2.7, H.deckY(-2.7) + 0.06, 0] });
      mesh(new THREE.TorusGeometry(0.35, 0.02, 8, 32), steel, { parent: vessel, at: [-3.5, H.deckY(-3.5) + 0.45, 0], rot: [0, Math.PI / 2, 0] });
      // mast, boom, sails, stays
      const mastX = 1.0;
      const mastH = 12;
      const mastBase = c.top;
      mesh(new THREE.CylinderGeometry(0.07, 0.085, mastH, 14), steel, { parent: vessel, at: [mastX, mastBase + mastH / 2, 0] });
      const boom = group('boom', { parent: vessel, at: [mastX, mastBase + 1.1, 0] });
      mesh(new THREE.CapsuleGeometry(0.055, 3.9, 4, 10).rotateZ(Math.PI / 2), steel, { parent: boom, at: [-2.0, 0, 0] });
      const sailMat = new THREE.MeshStandardMaterial({ color: o.sailColor ?? '#fbfaf5', roughness: 0.85, side: THREE.DoubleSide });
      const sailGeo = (pts, depth) => {
        const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), 12);
        // camber: belly the sail sideways
        const p = g.attributes.position;
        const bb = new THREE.Box3().setFromBufferAttribute(p);
        for (let i = 0; i < p.count; i++) {
          const u = (p.getX(i) - bb.min.x) / (bb.max.x - bb.min.x || 1);
          const vv = (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y || 1);
          p.setZ(i, depth * Math.sin(Math.PI * u) * (1 - vv * 0.7));
        }
        g.computeVertexNormals();
        return g;
      };
      const main = sailGeo([[0, 0.06], [-3.85, 0.06], [-0.1, mastH - 1.6]], 0.35);
      // resample main by subdividing (ShapeGeometry is coarse) — keep simple tri with camber
      mesh(main, sailMat, { parent: boom });
      const jib = sailGeo([[0, 0], [3.4, 0], [0, mastH - 2.6]], 0.25);
      mesh(jib, sailMat, { parent: vessel, at: [mastX + 0.15, mastBase + 0.25, 0] });
      for (const [a, b] of [[[mastX, mastBase + mastH - 0.3, 0], [H.h - 0.1, H.deckY(H.h - 0.1) + 0.05, 0]], [[mastX, mastBase + mastH - 0.3, 0], [-H.h + 0.1, H.deckY(-H.h) + 0.05, 0]]]) curveTube([a, b], 0.006, steel, { parent: vessel, segments: 4, radialSegments: 4 });
      for (const s of [1, -1]) curveTube([[mastX, mastBase + mastH * 0.75, 0], [mastX - 0.3, H.deckY(mastX) + 0.05, s * 1.45]], 0.006, steel, { parent: vessel, segments: 4, radialSegments: 4 });
      railing(vessel, H, -3.8, 3.2, 0.55, steel, { step: 1.2 });
      tracks.extra.push(clip('sail', 6, [rotateTrack(boom, 'y', 6, (t) => 0.15 + wave(t) * 0.12)]));
    },

    yacht() {
      const H = addHull({ emblem: 0.75, L: 22, B: 2.9, F: 1.9, D: 1.1, vee: 0.6, bowLen: 8, bowP: 1.7, sternW: 0.9, spring: 0.6, flare: 0.1, stripe: 0.55, bulwark: 0.25 }, teak);
      const dy = H.deckY(0);
      // swim platform
      mesh(roundedBox(1.2, 0.12, 5.2, 0.05), teak, { parent: vessel, at: [-H.h - 0.55, 0.35, 0] });
      const main = cabin(vessel, { x0: -8.0, x1: 5.0, y: dy - 0.05, h: 2.25, w: 4.9, rakeF: 1.2, rakeB: 0.0, mat: white, glassMat: darkGlass, band: [0.3, 0.88], rearGlass: true, radius: 0.15, emblem: 0.55 });
      const upper = cabin(vessel, { x0: -5.5, x1: 2.6, y: main.top - 0.02, h: 1.7, w: 4.5, rakeF: 1.4, rakeB: 0.1, mat: white, glassMat: darkGlass, band: [0.25, 0.9], rearGlass: true, radius: 0.15 });
      // radar arch over the flybridge roof
      curveTube([[-4.5, upper.top - 0.02, 1.9], [-4.5, upper.top + 0.65, 1.55], [-4.5, upper.top + 0.88, 0], [-4.5, upper.top + 0.65, -1.55], [-4.5, upper.top - 0.02, -1.9]], 0.08, white, { parent: vessel, segments: 60 });
      const radar = radarUnit(vessel, [-4.5, upper.top + 0.9, 0], 'radar');
      tracks.extra.push(clip('radar', 2.5, [spinTrack(radar, 'y', 2.5, 1)]));
      // hull windows (long dark slots)
      for (const s of [1, -1]) {
        for (const [x, w] of [[1.5, 3.2], [-3.0, 2.6]]) {
          const z = s * (H.flareB(x) * 0.985);
          const win = mesh(roundedBox(w, 0.28, 0.02, 0.12), darkGlass, { parent: vessel, at: [x, H.sheer(x) - 0.85, z] });
          win.rotation.y = 0;
        }
      }
      railing(vessel, H, -8.5, 9.5, 0.75, steel, { step: 1.4 });
      for (const s of [1, -1]) cleat(vessel, [-9.5, H.deckY(-9.5), s * 2.4], steel);
    },

    fishing() {
      const H = addHull({ emblem: 0.6, L: 14, B: 2.6, F: 1.4, D: 1.4, vee: 0.25, bowLen: 4.5, bowP: 1.9, sternW: 0.8, spring: 0.9, flare: 0.08, stripe: 0.15, bulwark: 0.6 }, M.matte('#8b8f93', 0.85));
      const wh = cabin(vessel, { x0: 0.8, x1: 4.2, y: H.deckY(2.4) - 0.05, h: 2.3, w: 3.6, rakeF: -0.12, rakeB: 0.0, mat: white, glassMat: darkGlass, band: [0.55, 0.85], rearGlass: true, emblem: 0.6 });
      mesh(roundedBox(3.8, 0.12, 3.9, 0.05), M.paint('#e8e8e8'), { parent: vessel, at: [2.5, wh.top + 0.06, 0] });
      const mast = group(null, { parent: vessel, at: [1.4, wh.top + 0.1, 0] });
      mesh(new THREE.CylinderGeometry(0.07, 0.09, 4, 12), M.paint('#f2f2f2'), { parent: mast, at: [0, 2, 0] });
      const radar = radarUnit(mast, [0, 2.6, 0], 'radar');
      // outriggers hinged at mast foot
      const outs = [];
      for (const s of [1, -1]) {
        const arm = group(s > 0 ? 'outrigger_R' : 'outrigger_L', { parent: vessel, at: [0.6, wh.top - 0.2, s * 1.6] });
        mesh(new THREE.CylinderGeometry(0.035, 0.06, 7, 10), M.paint('#e0e0e0'), { parent: arm, at: [0, 3.5, 0] });
        arm.rotation.x = -s * 0.25;
        outs.push([arm, s]);
      }
      // net drum + gantry at stern
      mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.2, 24).rotateX(Math.PI / 2), M.paint('#2e7d32'), { parent: vessel, at: [-4.6, H.deckY(-4.6) + 0.8, 0] });
      for (const s of [1, -1]) mesh(roundedBox(0.18, 3.0, 0.18, 0.05), M.paint('#f2f2f2'), { parent: vessel, at: [-6.2, H.deckY(-6.2) + 1.5, s * 1.9] });
      mesh(roundedBox(0.2, 0.2, 4.0, 0.06), M.paint('#f2f2f2'), { parent: vessel, at: [-6.2, H.deckY(-6.2) + 3.0, 0] });
      tracks.extra.push(clip('radar', 2.5, [spinTrack(radar, 'y', 2.5, 1)]));
      tracks.extra.push(clip('outriggers', 8, outs.map(([arm, s]) => rotateTrack(arm, 'x', 8, (t) => -s * pingPong(t) * 1.05))));
    },

    rowboat() {
      const H = addHull({ emblem: 0.12, L: 3.6, B: 0.72, F: 0.42, D: 0.12, vee: 0.15, bowLen: 1.4, bowP: 1.8, sternW: 0.6, spring: 0.12, flare: 0.18, stripe: 0.05, bulwark: 0.32, camber: 0 }, M.wood('oak'));
      for (const x of [-0.9, 0.2, 1.0]) mesh(roundedBox(0.24, 0.04, H.flareB(x) * 1.8, 0.015), M.wood('oak'), { parent: vessel, at: [x, H.sheer(x) - 0.14, 0] });
      // gunwale cap
      for (const s of [1, -1]) {
        const pts = [];
        for (let x = -1.8; x <= 1.7; x += 0.25) pts.push([x, H.sheer(x) + 0.005, s * H.flareB(x)]);
        curveTube(pts, 0.025, M.wood('walnut'), { parent: vessel });
      }
      const oars = [];
      for (const s of [1, -1]) {
        const oar = group(s > 0 ? 'oar_R' : 'oar_L', { parent: vessel, at: [0.05, H.sheer(0.05) + 0.06, s * (H.flareB(0) + 0.02)] });
        mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.08, 10), steel, { parent: vessel, at: [0.05, H.sheer(0.05) + 0.03, s * (H.flareB(0) + 0.02)] });
        curveTube([[0.3, 0.02, -s * 0.7], [0, 0, 0], [-0.25, -0.22, s * 1.5]], 0.022, M.wood('pine'), { parent: oar });
        mesh(cushion(0.5, 0.025, 0.14, { radius: 0.01 }), M.wood('pine'), { parent: oar, at: [-0.4, -0.3, s * 1.75], rot: [s * 0.3, 0.35, 0] });
        oars.push([oar, s]);
      }
      tracks.extra.push(clip('row', 2.4, oars.flatMap(([oar, s]) => [rotateTrack(oar, 'y', 2.4, (t) => s * wave(t) * 0.45)])));
    },

    kayak() {
      const H = addHull({ emblem: 0.08, L: 4.3, B: 0.31, F: 0.2, D: 0.12, vee: 0.2, bowLen: 1.8, bowP: 1.6, sternLen: 1.6, sternW: 0, spring: 0.06, flare: 0.0, stripe: 0.02, bulwark: 0.0, camber: 0.08, stations: 70 }, M.paint(o.color ?? v.color, { metallic: 0.1 }));
      // cockpit coaming + seat
      const coam = new THREE.TorusGeometry(0.3, 0.025, 8, 32);
      coam.scale(1.6, 1, 0.7);
      mesh(coam, M.plastic('#222'), { parent: vessel, at: [-0.15, H.deckY(-0.15) + 0.09, 0], rot: [Math.PI / 2, 0, 0] });
      const hole = new THREE.CircleGeometry(0.29, 28);
      hole.scale(1.6, 0.7, 1);
      hole.rotateX(-Math.PI / 2);
      mesh(hole, M.plastic('#111', 0.9), { parent: vessel, at: [-0.15, H.deckY(-0.15) + 0.092, 0] });
      // paddle resting on deck
      const pd = group(null, { parent: vessel, at: [0.75, H.deckY(0.75) + 0.08 + 0.017, 0], rot: [0, 0.25, 0] });
      mesh(new THREE.CylinderGeometry(0.016, 0.016, 2.1, 10).rotateX(Math.PI / 2), M.metal('#333'), { parent: pd });
      for (const s of [1, -1]) mesh(cushion(0.18, 0.012, 0.45, { radius: 0.006 }), M.plastic(v.accent), { parent: pd, at: [0, 0, s * 1.15] });
      for (const s of [1, -1]) {
        const pts = [];
        for (let x = 1.1; x <= 1.9; x += 0.2) { const b = H.halfB(x); const z = s * b * 0.45; pts.push([x, H.deckY(x) + 0.08 * (1 - (z / b) ** 2) + 0.007, z]); }
        curveTube(pts, 0.006, M.plastic('#222'), { parent: vessel });
      }
    },

    ferry() {
      const H = addHull({ emblem: 2.2, L: 46, B: 7.2, F: 2.8, D: 2.2, vee: 0.3, bowLen: 12, bowP: 1.8, sternW: 0.92, spring: 1.2, flare: 0.05, stripe: 0.9, bulwark: 0.0, stations: 110 });
      const dy = H.deckY(0);
      const d1 = cabin(vessel, { x0: -20, x1: 15, y: dy - 0.05, h: 3.0, w: 13.6, rakeF: 0.8, rakeB: 0.0, mat: white, glassMat: darkGlass, band: [0.35, 0.8], rearGlass: true, radius: 0.25, emblem: 1.0 });
      const d2 = cabin(vessel, { x0: -16, x1: 12, y: d1.top - 0.02, h: 2.8, w: 12.8, rakeF: 1.0, rakeB: 0.0, mat: white, glassMat: darkGlass, band: [0.35, 0.8], rearGlass: true, radius: 0.25 });
      const br = cabin(vessel, { x0: 4, x1: 11, y: d2.top - 0.02, h: 2.4, w: 14.2, rakeF: -0.25, rakeB: 0, mat: white, glassMat: darkGlass, band: [0.45, 0.85], rearGlass: true, radius: 0.2 });
      // funnel
      const f = lathe([[1.3, 0], [1.4, 2.6], [1.25, 4.2], [0.001, 4.25]], 28);
      f.scale(1.4, 1, 0.8);
      mesh(f, white, { parent: vessel, at: [-6, d2.top - 0.05, 0] });
      const band = lathe([[1.43, 2.4], [1.42, 3.2]], 28);
      band.scale(1.4, 1, 0.8);
      mesh(band, accent, { parent: vessel, at: [-6, d2.top - 0.05, 0] });
      // lifeboats
      for (const s of [1, -1]) for (const x of [-12, -2]) {
        const lb = tubeLoft({ x0: -2.2, x1: 2.2, stations: 24, ring: 20, section: (xx) => { const t = Math.abs(xx) / 2.2; const ff = Math.sqrt(Math.max(0.0001, 1 - t ** 3)); return { cy: 0, a: 0.75 * ff, bt: 0.6 * ff, bb: 0.55 * ff, n: 2.5 }; } });
        mesh(lb.geometry, M.paint('#ff6d00', { metallic: 0.1 }), { parent: vessel, at: [x, d1.top + 0.9, s * 6.0] });
      }
      const radar = radarUnit(vessel, [7.5, br.top + 0.05, 0], 'radar');
      railing(vessel, H, -21, 19, 1.0, steel, { step: 2.0 });
      tracks.extra.push(clip('radar', 3, [spinTrack(radar, 'y', 3, 1)]));
    },

    tugboat() {
      const H = addHull({ emblem: 0.7, L: 20, B: 4.4, F: 1.7, D: 2.3, vee: 0.2, bowLen: 6, bowP: 2.1, sternW: 0.85, spring: 1.0, flare: 0.1, stripe: 0.35, bulwark: 0.7, stations: 90 }, M.matte('#7b7f83', 0.85));
      const dy = H.deckY(0);
      const d1 = cabin(vessel, { x0: -2.5, x1: 4.5, y: dy - 0.05, h: 2.3, w: 6.4, rakeF: 0.0, rakeB: 0.0, mat: white, glassMat: darkGlass, band: [0.45, 0.75], rearGlass: true, emblem: 0.8 });
      const wh = cabin(vessel, { x0: 0.5, x1: 4.2, y: d1.top - 0.02, h: 2.2, w: 5.8, rakeF: -0.2, rakeB: -0.1, mat: white, glassMat: darkGlass, band: [0.4, 0.9], rearGlass: true });
      mesh(roundedBox(4.4, 0.14, 6.4, 0.06), M.paint('#b71c1c'), { parent: vessel, at: [2.35, wh.top + 0.07, 0] });
      // stack
      const st = lathe([[0.8, 0], [0.85, 2.8], [0.001, 2.85]], 24);
      st.scale(1.2, 1, 0.7);
      mesh(st, M.paint('#1b1b1b'), { parent: vessel, at: [-1.2, d1.top, 0] });
      // fenders: tyres along the sides, big bow fender
      for (const s of [1, -1]) for (let x = -7; x <= 5; x += 1.5) {
        mesh(new THREE.TorusGeometry(0.32, 0.13, 10, 20), M.rubber(), { parent: vessel, at: [x, H.sheer(x) - 0.55, s * (H.flareB(x) + 0.1)] });
      }
      const bfPts = [];
      for (let k = -8; k <= 8; k++) {
        const sd = Math.sign(k);
        const x = H.h - 0.18 - 3.2 * (Math.abs(k) / 8) ** 1.6;
        bfPts.push([x, H.sheer(x) - 0.4, sd * (H.flareB(x) * (Math.abs(k) / 8 > 0.05 ? 1 : 0) + 0.12) * (k === 0 ? 0 : 1)]);
      }
      const bf = curveTube(bfPts, 0.3, M.rubber(), { parent: vessel, segments: 80 });
      void bf;
      const mast = group(null, { parent: vessel, at: [2.0, wh.top + 0.14, 0] });
      mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 12), M.paint('#f2f2f2'), { parent: mast, at: [0, 1.6, 0] });
      const radar = radarUnit(mast, [0, 2.2, 0], 'radar');
      mesh(new THREE.SphereGeometry(0.1, 10, 8), M.emissive('#fff3c4', 2), { parent: mast, at: [0, 3.25, 0] });
      // towing bitt
      mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.8, 16), M.paint('#1b1b1b'), { parent: vessel, at: [-6.5, H.deckY(-6.5) + 0.4, 0] });
      tracks.extra.push(clip('radar', 2.5, [spinTrack(radar, 'y', 2.5, 1)]));
    },

    'cargo-ship'() {
      const H = addHull({ emblem: 3.5, L: 110, B: 10, F: 6, D: 6, vee: 0.05, bowLen: 28, bowP: 2.2, sternW: 0.85, spring: 2.5, flare: 0.04, stripe: 0.6, bulwark: 0.0, stations: 120, camber: 0.2 }, M.matte('#7a2a22', 0.8));
      const dy = H.deckY(0);
      // containers (instanced, coloured)
      const colors = ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6d4c41', '#00838f', '#e0e0e0', '#ef6c00'];
      const box = roundedBox(12.0, 2.55, 2.4, 0.08);
      const im = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.2 }), 700);
      const m4 = new THREE.Matrix4();
      const col = new THREE.Color();
      let n = 0;
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let x = -34; x <= 36; x += 12.4) {
        const halfW = H.halfB(x + 6) - 0.6;
        const cols = Math.floor((halfW * 2) / 2.45);
        const tiers = 4 + Math.floor(rnd() * 3);
        for (let c = 0; c < cols; c++) for (let t = 0; t < tiers; t++) {
          if (n >= 700) break;
          const z = -((cols - 1) * 2.45) / 2 + c * 2.45;
          m4.makeTranslation(x, dy + 1.3 + t * 2.6, z);
          im.setMatrixAt(n, m4);
          im.setColorAt(n, col.set(colors[Math.floor(rnd() * colors.length)]));
          n++;
        }
      }
      im.count = n;
      im.name = 'containers';
      vessel.add(im);
      // bridge superstructure aft
      const b1 = cabin(vessel, { x0: -50, x1: -40, y: dy - 0.05, h: 16, w: 17, rakeF: 0, rakeB: 0, mat: white, glassMat: darkGlass, band: [0.88, 0.97], rearGlass: true, radius: 0.3, emblem: 3.0 });
      mesh(roundedBox(4, 1.2, 21, 0.2), white, { parent: vessel, at: [-41.5, b1.top - 1.3, 0] });
      const fn = lathe([[2.2, 0], [2.4, 7], [0.001, 7.1]], 24);
      fn.scale(1.6, 1, 0.8);
      mesh(fn, M.paint('#1b1b1b'), { parent: vessel, at: [-48, b1.top - 0.1, 0] });
      const radar = radarUnit(vessel, [-44, b1.top + 0.05, 0], 'radar');
      radar.parent.scale.setScalar(3);
      railing(vessel, H, -52, 50, 1.1, steel, { step: 3 });
      tracks.extra.push(clip('radar', 3, [spinTrack(radar, 'y', 3, 1)]));
    },

    canoe() {
      const H = addHull({ emblem: 0.08, L: 4.8, B: 0.44, F: 0.36, D: 0.1, vee: 0.15, bowLen: 1.9, bowP: 1.5, sternLen: 1.9, sternW: 0, spring: 0.16, flare: 0.08, stripe: 0.03, bulwark: 0.3, camber: 0 }, M.wood('oak'));
      for (const x of [-1.4, 0, 1.4]) mesh(roundedBox(0.08, 0.03, H.flareB(x) * 1.9, 0.01), M.wood('walnut'), { parent: vessel, at: [x, H.sheer(x) - 0.04, 0] });
      for (const x of [-1.6, 1.3]) mesh(roundedBox(0.3, 0.03, H.flareB(x) * 1.6, 0.01), M.wood('oak'), { parent: vessel, at: [x, H.sheer(x) - 0.2, 0] });
      for (const s of [1, -1]) {
        const pts = [];
        for (let x = -2.3; x <= 2.3; x += 0.25) pts.push([x, H.sheer(x) + 0.004, s * H.flareB(x)]);
        curveTube(pts, 0.018, M.wood('walnut'), { parent: vessel });
      }
      const paddle = group('paddle', { parent: vessel, at: [0.5, H.sheer(0.5) - 0.12, 0] });
      tube([-0.6, 0, 0.05], [0.6, 0.02, -0.05], 0.015, M.wood('oak'), { parent: paddle });
      mesh(roundedBox(0.4, 0.012, 0.15, 0.006), M.wood('oak'), { parent: paddle, at: [0.75, 0.025, -0.06] });
    },
    'jet-ski'() {
      const H = addHull({ emblem: 0.1, L: 3.1, B: 0.58, F: 0.55, D: 0.22, vee: 0.9, bowLen: 1.3, bowP: 1.7, sternW: 0.85, spring: 0.12, flare: 0.05, stripe: 0.06, bulwark: 0.0 });
      const cy = H.deckY(0);
      mesh(cushion(1.0, 0.22, 0.45, { radius: 0.08, bulge: 0.3 }), M.matte('#1b1b1b', 0.6), { parent: vessel, at: [-0.45, cy + 0.12, 0], name: 'seat' });
      mesh(cushion(0.95, 0.38, 0.8, { radius: 0.15, bulge: 0.15 }), hullPaint, { parent: vessel, at: [0.6, cy + 0.15, 0], name: 'hood' });
      mesh(roundedBox(0.2, 0.25, 0.14, 0.05), M.matte('#222'), { parent: vessel, at: [0.25, cy + 0.42, 0] });
      curveTube([[0.22, cy + 0.55, -0.36], [0.2, cy + 0.58, 0], [0.22, cy + 0.55, 0.36]], 0.018, M.matte('#222'), { parent: vessel });
      for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 12).rotateX(Math.PI / 2), M.matte('#111'), { parent: vessel, at: [0.22, cy + 0.55, s * 0.34] });
      for (const s of [1, -1]) mesh(roundedBox(1.0, 0.04, 0.16, 0.015), M.matte('#333'), { parent: vessel, at: [-0.4, cy + 0.0, s * 0.42] });
      mesh(roundedBox(0.3, 0.1, 0.3, 0.04), M.matte('#222'), { parent: vessel, at: [-1.45, H.deckY(-1.45) - 0.12, 0], name: 'jet_nozzle' });
      tracks.extra.push(clip('cruise', 1.0, [rotateTrack(vessel, 'z', 1.0, (t) => 0.05 + wave(t) * 0.015)]));
    },
    pontoon() {
      // two aluminium tubes + flat deck with fencing, bimini, outboard
      const tubeL = 6.4;
      for (const s of [1, -1]) {
        const t = new THREE.CapsuleGeometry(0.3, tubeL - 0.6, 8, 24).rotateZ(Math.PI / 2);
        mesh(t, M.metal('#cfd3d7', 0.25), { parent: vessel, at: [0, 0.2, s * 0.95], name: 'pontoon' });
        mesh(new THREE.ConeGeometry(0.3, 0.6, 24).rotateZ(-Math.PI / 2), M.metal('#cfd3d7', 0.25), { parent: vessel, at: [tubeL / 2, 0.2, s * 0.95] });
      }
      mesh(roundedBox(6.2, 0.12, 2.5, 0.04), M.matte('#6d6d6d', 0.9), { parent: vessel, at: [0, 0.56, 0], name: 'deck' });
      for (let x = -2.8; x <= 2.81; x += 1.4) tube([x, 0.5, -0.95], [x, 0.5, 0.95], 0.06, M.metal('#9aa0a6'), { parent: vessel });
      for (const s of [1, -1]) {
        mesh(roundedBox(5.2, 0.7, 0.04, 0.02), hullPaint, { parent: vessel, at: [-0.2, 0.98, s * 1.22], name: 'fence' });
        mesh(roundedBox(5.2, 0.12, 0.05, 0.02), accent, { parent: vessel, at: [-0.2, 0.85, s * 1.245] });
        tube([-2.8, 1.36, s * 1.22], [2.4, 1.36, s * 1.22], 0.022, steel, { parent: vessel });
      }
      mesh(cushion(0.7, 0.4, 2.2, { radius: 0.1 }), M.fabric('#eceff1'), { parent: vessel, at: [-2.2, 0.82, 0], name: 'bench' });
      mesh(cushion(0.2, 0.55, 2.2, { radius: 0.08 }), M.fabric('#eceff1'), { parent: vessel, at: [-2.5, 1.2, 0] });
      for (const s of [1, -1]) mesh(cushion(1.8, 0.4, 0.6, { radius: 0.1 }), M.fabric('#eceff1'), { parent: vessel, at: [0.6, 0.82, s * 0.85] });
      mesh(roundedBox(0.6, 0.8, 0.6, 0.08), white, { parent: vessel, at: [1.0, 1.02, -0.6], name: 'helm' });
      mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 24), M.plastic('#111'), { parent: vessel, at: [0.8, 1.45, -0.6], rot: [0, Math.PI / 2, 0.5] });
      const ob = group('outboard', { parent: vessel, at: [-3.2, 0.62, 0] });
      mesh(cushion(0.5, 0.65, 0.42, { radius: 0.14, bulge: 0.1 }), M.paint('#1b1b1b', { metallic: 0.3 }), { parent: ob, at: [-0.15, 0.3, 0] });
      mesh(roundedBox(0.16, 0.85, 0.12, 0.05), M.paint('#1b1b1b'), { parent: ob, at: [-0.1, -0.35, 0] });
      mainHull = { h: 3.2, deckY: () => 0.62, flareB: () => 1.2, surface: (x, t, sd) => ({ point: new THREE.Vector3(x, 0.98, sd * 1.245), normal: new THREE.Vector3(0, 0, sd) }) };
    },
    lifeboat() {
      // Totally-enclosed lifeboat: canopy lofted to follow the hull, coxswain cupola,
      // set-in portholes, side hatches, grab line on surface eyes, hooks, skeg/rudder/prop.
      const H = addHull({ emblem: 0, L: 7.5, B: 1.3, F: 1.0, D: 0.45, vee: 0.6, bowLen: 2.6, bowP: 1.7, sternLen: 2.0, sternW: 0.3, spring: 0.2, flare: 0.06, stripe: 0.12, bulwark: 0.05 });
      const glass = M.matte('#1d2730', 0.25);
      const frp = new THREE.MeshStandardMaterial({ color: hullPaint.color.clone(), roughness: 0.55, metalness: 0, name: 'paint_canopy' });
      const x0 = -H.h + 0.25;
      const x1 = H.h - 0.55;
      const NS = 40;
      const NR = 28;
      const n = 2.6; // superellipse squareness of the arch
      const canopyH = (x) => {
        const u = (x - (x0 + x1) / 2) / ((x1 - x0) / 2); // -1..1
        return 1.15 * Math.pow(Math.max(0, 1 - Math.abs(u) ** 3.2), 0.45) + 0.02;
      };
      const halfW = (x) => H.flareB(x) * 0.96;
      const base = (x) => H.sheer(x) - 0.03;
      const pt = (x, t) => {
        // t: 0 = starboard gunwale, 0.5 = top centre, 1 = port gunwale
        const a = t * Math.PI;
        const c = Math.cos(a);
        const sn = Math.sin(a);
        const z = halfW(x) * Math.sign(c) * Math.abs(c) ** (2 / n);
        const y = base(x) + canopyH(x) * Math.abs(sn) ** (2 / n);
        return new THREE.Vector3(x, y, z);
      };
      const nrm = (x, t) => {
        const e = 0.01;
        const du = pt(x + e, t).sub(pt(x - e, t));
        const dv = pt(x, Math.min(1, t + e)).sub(pt(x, Math.max(0, t - e)));
        const nv = dv.cross(du).normalize();
        if (nv.y < -0.2 || (Math.abs(nv.y) < 0.2 && Math.sign(nv.z) !== Math.sign(pt(x, t).z))) nv.negate();
        return nv;
      };
      const pos = [];
      const idx = [];
      for (let i = 0; i <= NS; i++) {
        const x = x0 + ((x1 - x0) * i) / NS;
        for (let j = 0; j <= NR; j++) pos.push(...pt(x, j / NR).toArray());
      }
      for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) {
        const q = i * (NR + 1) + j;
        idx.push(q, q + NR + 1, q + 1, q + 1, q + NR + 1, q + NR + 2);
      }
      // end caps (fan to the centre of each end section)
      for (const [i, flip] of [[0, true], [NS, false]]) {
        const x = x0 + ((x1 - x0) * i) / NS;
        const c = pos.length / 3;
        pos.push(x, base(x) + canopyH(x) * 0.35, 0);
        for (let j = 0; j < NR; j++) {
          const q = i * (NR + 1) + j;
          flip ? idx.push(c, q, q + 1) : idx.push(c, q + 1, q);
        }
      }
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      cg.setIndex(idx);
      cg.computeVertexNormals();
      mesh(cg, frp, { parent: vessel, name: 'canopy' });
      const place = (m, x, t, off = 0.004) => {
        const p0 = pt(x, t);
        const nv = nrm(x, t);
        m.position.copy(p0).addScaledVector(nv, off);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nv);
        vessel.add(m);
        return m;
      };
      // white boarding stripe just above the gunwale
      for (const s of [1, -1]) {
        const pts = [];
        for (let x = x0 + 0.15; x <= x1 - 0.15; x += 0.25) pts.push(pt(x, s > 0 ? 0.06 : 0.94).addScaledVector(nrm(x, s > 0 ? 0.06 : 0.94), 0.004).toArray());
        curveTube(pts, 0.03, accent, { parent: vessel, name: 'stripe' });
      }
      // set-in portholes along both sides
      for (const s of [1, -1]) for (let x = -1.9; x <= 1.5; x += 0.55) {
        const t = s > 0 ? 0.2 : 0.8;
        place(mesh(new THREE.CircleGeometry(0.1, 24), glass, { name: 'porthole' }), x, t, 0.006);
        place(mesh(new THREE.TorusGeometry(0.105, 0.014, 8, 24), steel), x, t, 0.006);
      }
      // side boarding hatches (frame + door panel) amidships
      for (const s of [1, -1]) {
        const t = s > 0 ? 0.2 : 0.8;
        place(mesh(roundedBox(0.75, 0.62, 0.02, 0.08), frp, { name: 'hatch' }), 0.95, t + (s > 0 ? -0.02 : 0.02), 0.012);
        place(mesh(new THREE.TorusGeometry(0.3, 0.012, 6, 32).scale(1.25, 1, 1), M.plastic('#2a2a2a')), 0.95, t + (s > 0 ? -0.02 : 0.02), 0.022);
      }
      // coxswain cupola with wrap-around windows (aft)
      const cx = -1.75;
      const top = pt(cx, 0.5);
      const cup = group('cupola', { parent: vessel, at: [cx, top.y - 0.06, 0] });
      mesh(lathe([[0.001, 0.42], [0.2, 0.41], [0.33, 0.36], [0.4, 0.26], [0.42, 0.12], [0.44, 0]], 32), frp, { parent: cup });
      mesh(new THREE.CylinderGeometry(0.425, 0.432, 0.12, 32, 1, true), glass, { parent: cup, at: [0, 0.2, 0] });
      // lifting hooks fore and aft (on top)
      for (const hx of [1.9, -1.0]) {
        const p0 = pt(hx, 0.5);
        mesh(roundedBox(0.22, 0.06, 0.16, 0.025), steel, { parent: vessel, at: [hx, p0.y + 0.02, 0], name: 'hook_plate' });
        mesh(new THREE.TorusGeometry(0.06, 0.014, 8, 20, Math.PI * 1.4), steel, { parent: vessel, at: [hx, p0.y + 0.1, 0], rot: [0, Math.PI / 2, -0.6], name: 'hook' });
      }
      // grab line on eye fittings along the hull, just below the gunwale
      for (const s of [1, -1]) {
        const pts = [];
        for (let x = -2.6; x <= 2.0; x += 0.46) {
          const sp = H.surface(x, 0.82, s);
          const eye = sp.point.clone().addScaledVector(sp.normal, 0.02);
          mesh(new THREE.SphereGeometry(0.022, 10, 8), steel, { parent: vessel, at: sp.point.clone().addScaledVector(sp.normal, 0.01).toArray(), name: 'eye' });
          pts.push(eye.toArray());
          if (x + 0.46 <= 2.0) {
            const sp2 = H.surface(x + 0.23, 0.74, s);
            pts.push(sp2.point.clone().addScaledVector(sp2.normal, 0.02).toArray());
          }
        }
        curveTube(pts, 0.01, M.fabric('#e8e2d0'), { parent: vessel, name: 'grab_line', segments: 120 });
      }
      // skeg, rudder and propeller at the stern
      const sx = -H.h + 0.35;
      const ky = H.keel(sx);
      mesh(roundedBox(0.7, 0.22, 0.06, 0.03), antifoul, { parent: vessel, at: [sx + 0.25, ky + 0.02, 0], name: 'skeg' });
      mesh(roundedBox(0.28, 0.42, 0.04, 0.02), antifoul, { parent: vessel, at: [sx - 0.18, ky + 0.2, 0], name: 'rudder' });
      const prop = group('propeller', { parent: vessel, at: [sx + 0.0, ky + 0.12, 0], rot: [0, 0, Math.PI / 2] });
      mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.12, 12), M.metal('#b08d57'), { parent: prop });
      for (let k = 0; k < 3; k++) mesh(roundedBox(0.16, 0.012, 0.07, 0.006), M.metal('#b08d57'), { parent: prop, at: [0, 0, 0], rot: [0, (k * Math.PI * 2) / 3, 0.35] }).translateX(0.09);
      // name decal + emblem on the canopy flank
      const lt = textMaterial('RESCUE', { color: '#0d47a1', font: 'bold 80px Arial' });
      for (const s of [1, -1]) {
        const t = s > 0 ? 0.33 : 0.67;
        const p0 = pt(-0.3, t);
        decal(vessel, lt, { at: p0.clone().addScaledVector(nrm(-0.3, t), 0.006).toArray(), normal: nrm(-0.3, t).toArray(), w: 1.3, h: 0.32 });
      }
      for (const t of [0.25, 0.75]) emblemOn(vessel, { point: pt(2.2, t), normal: nrm(2.2, t) }, 0.14, t < 0.5 ? 'emblem' : 'emblem_2');
      tracks.extra.push(clip('propeller', 0.4, [spinTrack(prop, 'y', 0.4, 1)]));
    },
    'police-boat'() {
      const H = addHull({ emblem: 0.22, L: 9.5, B: 1.5, F: 1.1, D: 0.55, vee: 0.85, bowLen: 3.4, bowP: 1.6, sternW: 0.92, spring: 0.25, flare: 0.08, stripe: 0.15, bulwark: 0.18 });
      const c = cabin(vessel, { x0: -1.2, x1: 1.8, y: H.deckY(0) - 0.02, h: 1.25, w: 2.3, rakeF: 0.6, rakeB: 0.1, mat: white, glassMat: darkGlass, band: [0.45, 0.85], emblem: 0.2 });
      // radar mast + light bar
      const mast = group(null, { parent: vessel, at: [0.0, c.top, 0] });
      mesh(roundedBox(0.3, 0.6, 0.3, 0.05), white, { parent: mast, at: [0, 0.3, 0] });
      const radar = group('radar', { parent: mast, at: [0, 0.65, 0] });
      mesh(roundedBox(0.9, 0.08, 0.12, 0.03), M.plastic('#eee'), { parent: radar });
      const red = lampGroup('siren_red', 'red');
      const blue = lampGroup('siren_blue', 'blue');
      mesh(roundedBox(0.4, 0.06, 1.3, 0.03), M.plastic('#222'), { parent: vessel, at: [0.9, c.top + 0.03, 0] });
      red.add(vessel, { at: [0.9, c.top + 0.12, -0.35], normal: [0, 1, 0], w: 0.3, h: 0.5, depth: 0.05 });
      blue.add(vessel, { at: [0.9, c.top + 0.12, 0.35], normal: [0, 1, 0], w: 0.3, h: 0.5, depth: 0.05 });
      const lt = textMaterial('POLICE', { color: '#0d47a1', font: 'bold 84px Arial' });
      for (const s of [1, -1]) {
        const p = H.surface(1.2, 0.72, s);
        decal(vessel, lt, { at: p.point.clone().addScaledVector(p.normal, 0.01).toArray(), normal: p.normal.toArray(), w: 2.0, h: 0.42 });
      }
      railing(vessel, H, 1.9, 4.5, 0.6, steel, { sides: [1, -1] });
      for (const s of [1, -1]) {
        const ob = group(null, { parent: vessel, at: [-4.82, H.deckY(-4.7) + 0.05, s * 0.45] });
        mesh(cushion(0.55, 0.75, 0.45, { radius: 0.15, bulge: 0.1 }), M.paint('#1b1b1b', { metallic: 0.3 }), { parent: ob, at: [-0.15, 0.25, 0] });
        mesh(roundedBox(0.18, 0.95, 0.12, 0.05), M.paint('#1b1b1b'), { parent: ob, at: [-0.1, -0.45, 0] });
      }
      tracks.extra.push(clip('radar', 2.5, [spinTrack(radar, 'y', 2.5, 1)]));
      tracks.extra.push(sirenClip('siren_red', 'siren_blue'));
    },
    catamaran() {
      // two slim hulls bridged by a deck, mast + sails
      const spec = { emblem: 0.14, L: 8.5, B: 0.55, F: 0.9, D: 0.35, vee: 0.6, bowLen: 3.2, bowP: 1.5, sternW: 0.6, spring: 0.12, flare: 0.04, stripe: 0.08, bulwark: 0.0 };
      const hulls = [];
      for (const s of [1, -1]) {
        const g = group(null, { parent: vessel, at: [0, 0, s * 1.8] });
        const H = hull(spec);
        mesh(H.geo, [hullPaint, antifoul, accent], { parent: g, name: 'hull' });
        mesh(H.deck, nonSkid, { parent: g, name: 'deck' });
        if (H.transom) mesh(H.transom, new THREE.MeshPhysicalMaterial({ color: hullPaint.color, roughness: 0.3, side: THREE.DoubleSide }), { parent: g });
        hulls.push(H);
      }
      const H = hulls[0];
      mainHull = { ...H, surface: (x, t, sd) => { const p = H.surface(x, t, sd); p.point.z += sd * 1.8; return p; } };
      const dy = H.deckY(0);
      mesh(roundedBox(4.6, 0.25, 3.7, 0.08), white, { parent: vessel, at: [-0.8, dy + 0.1, 0], name: 'bridge_deck' });
      mesh(roundedBox(1.6, 0.04, 3.2, 0.01), M.fabric('#263238'), { parent: vessel, at: [2.3, dy + 0.05, 0], name: 'trampoline' });
      tube([3.1, dy + 0.06, -1.8], [3.1, dy + 0.06, 1.8], 0.04, steel, { parent: vessel });
      const cab = cabin(vessel, { x0: -2.4, x1: 0.6, y: dy + 0.2, h: 0.9, w: 3.0, rakeF: 0.7, rakeB: 0.15, mat: white, glassMat: darkGlass, band: [0.35, 0.85] });
      const mx = 0.4;
      const mh = 11;
      mesh(new THREE.CylinderGeometry(0.07, 0.09, mh, 12), steel, { parent: vessel, at: [mx, cab.top + mh / 2, 0], name: 'mast' });
      const sail = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(mx - 0.1, cab.top + 1.2, 0), new THREE.Vector3(mx - 0.1, cab.top + mh - 0.3, 0), new THREE.Vector3(mx - 4.2, cab.top + 1.2, 0)]);
      sail.setIndex([0, 1, 2]);
      sail.computeVertexNormals();
      mesh(sail, new THREE.MeshStandardMaterial({ color: o.sailColor ?? '#fafafa', roughness: 0.8, side: THREE.DoubleSide }), { parent: vessel, name: 'sail' });
      tube([mx, cab.top + 1.2, 0], [mx - 4.3, cab.top + 1.2, 0], 0.05, steel, { parent: vessel });
      for (const s of [1, -1]) curveTube([[mx, cab.top + mh - 0.5, 0], [0.6, dy + 0.05, s * 1.8]], 0.006, steel, { parent: vessel, segments: 4, radialSegments: 4 });
      curveTube([[mx, cab.top + mh - 0.5, 0], [3.1, dy + 0.08, 0]], 0.006, steel, { parent: vessel, segments: 4, radialSegments: 4 });
    },
  })[variant]();

  // ---------------- trims: deck equipment ----------------
  const trim = o.trim;
  if (trim && mainHull) {
    const H = mainHull;
    const small = SMALL_BOATS.includes(variant);
    const ax = -H.h * 0.55;
    const dy = (x) => H.deckY(x);
    if (trim === 'fishing-rig') {
      // rod holders with rods angled out, plus a bait box
      for (const s of [1, -1]) for (const x of small ? [-H.h * 0.4] : [-H.h * 0.6, -H.h * 0.3]) {
        const bz = s * Math.max(0.05, H.flareB(x) - 0.08);
        mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 10), steel, { parent: vessel, at: [x, dy(x) + 0.1, bz] });
        const rodLen = small ? 1.6 : 2.6;
        tube([x, dy(x) + 0.15, bz], [x - rodLen * 0.5, dy(x) + 0.15 + rodLen * 0.8, bz + s * rodLen * 0.3], 0.01, M.matte('#222'), { parent: vessel, name: 'rod' });
        mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12).rotateX(Math.PI / 2), steel, { parent: vessel, at: [x - 0.08, dy(x) + 0.28, bz + s * 0.06] });
      }
      if (!small) mesh(roundedBox(0.6, 0.4, 0.5, 0.06), white, { parent: vessel, at: [-H.h * 0.8, dy(-H.h * 0.8) + 0.2, 0], name: 'bait_box' });
    }
    if (trim === 'flags') {
      // stern flagpole + bow pennant
      const fx = -H.h + (small ? 0.35 : 0.5);
      const fh = small ? 0.9 : 1.6;
      tube([fx, dy(fx), 0], [fx, dy(fx) + fh, 0], 0.015, steel, { parent: vessel, name: 'flagpole' });
      const flag = new THREE.PlaneGeometry(small ? 0.35 : 0.7, small ? 0.22 : 0.45);
      flag.translate(-(small ? 0.175 : 0.35), 0, 0);
      const fl = mesh(flag, new THREE.MeshStandardMaterial({ color: '#c62828', side: THREE.DoubleSide, roughness: 0.8 }), { parent: vessel, at: [fx, dy(fx) + fh - (small ? 0.12 : 0.24), 0], name: 'flag' });
      tracks.extra.push(clip('flag', 1.2, [rotateTrack(fl, 'y', 1.2, (t) => wave(t) * 0.35)]));
      const bx = H.h - (small ? 0.4 : 0.6);
      tube([bx, dy(bx), 0], [bx, dy(bx) + fh * 0.6, 0], 0.012, steel, { parent: vessel });
      mesh(new THREE.ConeGeometry(0.1, 0.4, 3).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#fdd835', side: THREE.DoubleSide }), { parent: vessel, at: [bx - 0.2, dy(bx) + fh * 0.55, 0] });
    }
    if (trim === 'dry-bags' || trim === 'cooler') {
      const cols = ['#ef6c00', '#1565c0', '#2e7d32'];
      if (trim === 'dry-bags') [-H.h * 0.5, H.h * 0.45].forEach((x, i) => mesh(new THREE.CapsuleGeometry(0.11, 0.3, 6, 14).rotateZ(Math.PI / 2), M.fabric(cols[i]), { parent: vessel, at: [x, dy(x) + 0.1, 0], name: 'dry_bag' }));
      else {
        const x = variant === 'jet-ski' ? -1.2 : -H.h * 0.35;
        mesh(roundedBox(0.45, 0.3, Math.min(0.32, H.flareB(x) * 1.5), 0.05), M.plastic('#1565c0', 0.4), { parent: vessel, at: [x, dy(x) + 0.15, 0], name: 'cooler' });
        mesh(roundedBox(0.47, 0.05, Math.min(0.34, H.flareB(x) * 1.5 + 0.02), 0.02), white, { parent: vessel, at: [x, dy(x) + 0.31, 0] });
      }
    }
    if (trim === 'fenders') {
      // inflatable fenders hanging over the side on lines
      for (const s of [1, -1]) for (const x of small ? [-H.h * 0.2, H.h * 0.2] : [-H.h * 0.5, 0, H.h * 0.35]) {
        const p = H.surface(x, 0.75, s);
        const fz = p.point.z + s * 0.12;
        mesh(new THREE.CapsuleGeometry(small ? 0.06 : 0.11, small ? 0.2 : 0.38, 6, 14), M.plastic('#eceff1', 0.4), { parent: vessel, at: [x, p.point.y, fz], name: 'fender' });
        tube([x, p.point.y + (small ? 0.16 : 0.3), fz], [x, dy(x) + 0.04, s * H.flareB(x) * 0.95], 0.006, M.fabric('#1565c0'), { parent: vessel, radialSegments: 4 });
      }
    }
    if (trim === 'bimini' || trim === 'radar-arch') {
      const x0 = -H.h * 0.62;
      const x1 = trim === 'bimini' ? -H.h * 0.05 : x0 + 0.3;
      const w = H.flareB(x0) * 0.92;
      const top = dy(x0) + (trim === 'bimini' ? 1.9 : 2.1);
      for (const s of [1, -1]) {
        curveTube([[x0, dy(x0), s * w], [x0 + 0.05, top - 0.3, s * w * 0.95], [x0 + 0.2, top, s * w * 0.75]], 0.03, steel, { parent: vessel });
        if (trim === 'bimini') curveTube([[x1, dy(x1), s * Math.min(w, H.flareB(x1) * 0.92)], [x1 - 0.05, top - 0.3, s * w * 0.95], [x1 - 0.15, top, s * w * 0.75]], 0.03, steel, { parent: vessel });
      }
      if (trim === 'bimini') mesh(cushion(x1 - x0 - 0.1, 0.06, w * 1.6, { radius: 0.03, bulge: 0.3 }), M.fabric('#1a237e'), { parent: vessel, at: [(x0 + x1) / 2, top + 0.02, 0], name: 'bimini' });
      else {
        tube([x0 + 0.2, top, -w * 0.75], [x0 + 0.2, top, w * 0.75], 0.035, steel, { parent: vessel });
        mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 24), M.plastic('#f5f5f5', 0.4), { parent: vessel, at: [x0 + 0.2, top + 0.13, 0], name: 'radar_dome' });
        lampGroup('arch_light', 'white').add(vessel, { at: [x0 + 0.2, top + 0.035, w * 0.4], normal: [0, 1, 0], w: 0.08, h: 0.08, shape: 'round', depth: 0.02 });
      }
    }
  }

  // navigation lights: red port (left, -Z) + green starboard on the bow sides, white stern light
  let nav = { animations: [] };
  if (mainHull && !['kayak', 'rowboat', 'canoe'].includes(variant)) {
    const H = mainHull;
    const sz = Math.min(0.16, Math.max(0.06, H.h * 0.012));
    const bx = H.h * 0.55;
    const pL = H.surface(bx, 0.96, -1);
    const pR = H.surface(bx, 0.96, 1);
    nav = navLights(vessel, {
      size: sz,
      red: [[pL.point.toArray(), pL.normal.toArray()]],
      green: [[pR.point.toArray(), pR.normal.toArray()]],
      white: [[[-H.h + 0.12 + sz, H.deckY(-H.h + 0.12) + sz * 0.3, 0], [0, 1, 0]]],
    });
  }

  // ---------------- animations ----------------
  const big = variant === 'cargo-ship' || variant === 'ferry';
  const P = big ? 9 : 4;
  const animations = [
    clip('bob', P, [
      moveTrack(vessel, P, (t) => [0, wave(t) * (big ? 0.25 : 0.06), 0]),
      rotateTrack(vessel, 'x', P, (t) => wave(t, 1) * (big ? 0.01 : 0.035)),
    ]),
    ...tracks.extra,
    ...nav.animations,
    ...(vessel.getObjectByName('outboard') ? [clip('outboardTilt', 4, [rotateTrack(vessel.getObjectByName('outboard'), 'z', 4, (t) => -Math.min(1, pingPong(t) * 1.5) * 0.9, 24)])] : []),
  ];
  finalize(root, { type: 'boat', variant, options: o, animations });
  root.userData.floating = true;
  if (variant === 'speedboat') root.userData.premade.exclusive = [['bob', 'cruise']];
  return root;
}
