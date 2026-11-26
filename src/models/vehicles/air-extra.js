import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, tube, lathe } from '../../core/utils.js';
import { spinTrack, rotateTrack, clip, pingPong } from '../../core/animation.js';
import { tubeLoft, wingGeometry, glassMaterial, emblemOn } from './helicopter.js';
import { fuselageSection, buildWing, vFin, gearLeg, nacelle, propeller, windowRow, noseEmblems } from './airplane.js';
import { textMaterial, decal } from './misc-kit.js';
import { lampGroup } from '../../core/lamps.js';

/*
 * More aircraft from one parametric builder. Real-world proportions (metres):
 * narrowbody ≈ 38 L / 36 span, widebody ≈ 64 / 61, jumbo ≈ 70 / 64, regional jet ≈ 30 / 26,
 * turboprop ≈ 27 / 27, biplane ≈ 7 / 9, glider ≈ 7 / 16, Cessna-type trainer ≈ 8 / 11.
 * All parked on their gear (wheels on y = 0), floats on the ground for float planes.
 */

const W = (span, root, tip, sweep, dihedral = 0.04, thick = 0.12) => ({ span, root, tip, sweep, dihedral, thick });
export const AIR_EXTRA_VARIANTS = {
  narrowbody:  { color: '#f4f6f8', accent: '#00897b', L: 38, R: 1.95, cy: 3.0, n: 2, wing: W(16.5, 7.0, 1.6, 6.5), wy: -1.2, wx: 1.0, low: true, engines: { type: 'fan', at: [0.36], R: 1.0, len: 4.4 }, tail: 'conv', fin: [7.5, 6.0, 2.0, 5.5], stab: [6.5, 4.0, 1.4, 3.8], gear: 'tri', gr: 0.62, winglet: true, windows: 30 },
  widebody:    { color: '#f4f6f8', accent: '#283593', L: 62, R: 3.0, cy: 4.4, n: 2, wing: W(29, 11, 2.5, 13), wy: -1.9, wx: 2.0, low: true, engines: { type: 'fan', at: [0.33], R: 1.75, len: 6.5 }, tail: 'conv', fin: [10.5, 9.0, 3.0, 8.5], stab: [10, 6.5, 2.0, 6.5], gear: 'tri', gr: 0.75, winglet: true, windows: 48, bogie: true },
  jumbo:       { color: '#f4f6f8', accent: '#c62828', L: 68, R: 3.2, cy: 4.6, n: 2, wing: W(31, 13, 3.0, 15), wy: -2.0, wx: 1.5, low: true, engines: { type: 'fan', at: [0.3, 0.62], R: 1.45, len: 5.6 }, tail: 'conv', fin: [11, 10, 3.2, 9], stab: [11, 7, 2.2, 7], gear: 'tri', gr: 0.75, hump: true, windows: 50, bogie: true, bogies: 4 },
  'regional-jet': { color: '#f4f6f8', accent: '#6a1b9a', L: 29, R: 1.45, cy: 2.2, n: 2, wing: W(12.5, 4.5, 1.2, 4.0), wy: -0.9, wx: 0.0, low: true, engines: { type: 'rear-fan', R: 0.75, len: 3.4 }, tail: 'T', fin: [4.6, 4.5, 2.6, 3.6], stab: [4.6, 2.6, 1.2, 2.2], gear: 'tri', gr: 0.45, winglet: true, windows: 20 },
  turboprop:   { color: '#f4f6f8', accent: '#1565c0', L: 27, R: 1.4, cy: 2.3, n: 2, wing: W(13.5, 2.6, 1.4, 0.4, 0.02), wy: 1.25, wx: 1.5, high: true, engines: { type: 'turboprop', at: [0.3], R: 0.55, len: 3.8, blades: 6, pr: 1.95 }, tail: 'T', fin: [4.2, 4.6, 2.4, 3.0], stab: [4.4, 2.2, 1.2, 0.8], gear: 'tri', gr: 0.45, windows: 17 },
  biplane:     { color: '#c62828', accent: '#f5f5f5', L: 7.0, R: 0.55, cy: 1.15, n: 2.6, wing: W(4.4, 1.5, 1.4, 0.15, 0.01, 0.12), wy: -0.25, wx: 1.2, low: true, upper: 1.45, engines: { type: 'nose-prop', blades: 2, pr: 1.25 }, tail: 'conv', fin: [1.2, 1.2, 0.6, 0.6], stab: [1.6, 0.9, 0.5, 0.3], gear: 'tail', gr: 0.36, open: true },
  glider:      { color: '#fafafa', accent: '#ef6c00', L: 7.2, R: 0.42, cy: 0.62, n: 2, wing: W(8.5, 1.0, 0.4, 0.15, 0.03, 0.14), wy: 0.15, wx: 0.6, mid: true, engines: null, tail: 'T', fin: [1.3, 1.0, 0.55, 0.7], stab: [1.5, 0.6, 0.35, 0.2], gear: 'mono', gr: 0.2, canopy: true },
  ultralight:  { color: '#fdd835', accent: '#1b1b1b', L: 5.6, R: 0.45, cy: 1.15, n: 2.4, wing: W(5.0, 1.5, 1.3, 0.05, 0.02, 0.12), wy: 0.85, wx: 0.6, high: true, strut: true, engines: { type: 'nose-prop', blades: 2, pr: 0.8 }, tail: 'conv', fin: [1.0, 0.9, 0.5, 0.5], stab: [1.3, 0.7, 0.45, 0.2], gear: 'tri', gr: 0.22, open: true },
  trainer:     { color: '#f5f5f5', accent: '#1565c0', L: 8.2, R: 0.62, cy: 1.32, n: 2.8, wing: W(5.5, 1.6, 1.15, 0.05, 0.03, 0.14), wy: 0.85, wx: 1.6, high: true, strut: true, engines: { type: 'nose-prop', blades: 2, pr: 0.95 }, tail: 'conv', fin: [1.35, 1.45, 0.75, 0.75], stab: [1.6, 1.05, 0.65, 0.2], gear: 'tri', gr: 0.25, canopy: true },
  'four-seater': { color: '#f5f5f5', accent: '#2e7d32', L: 8.6, R: 0.64, cy: 1.15, n: 2.8, wing: W(5.6, 1.7, 1.1, 0.1, 0.08, 0.14), wy: -0.45, wx: 1.2, low: true, engines: { type: 'nose-prop', blades: 3, pr: 0.95 }, tail: 'conv', fin: [1.4, 1.4, 0.7, 0.8], stab: [1.7, 1.0, 0.6, 0.2], gear: 'tri', gr: 0.27, canopy: true },
  'twin-prop': { color: '#f5f5f5', accent: '#5d4037', L: 10.5, R: 0.75, cy: 1.35, n: 2.6, wing: W(6.5, 2.0, 1.1, 0.3, 0.07, 0.14), wy: -0.5, wx: 1.2, low: true, engines: { type: 'prop', at: [0.3], R: 0.32, len: 2.0, blades: 3, pr: 0.95 }, tail: 'conv', fin: [1.8, 1.8, 0.8, 1.1], stab: [2.1, 1.2, 0.7, 0.4], gear: 'tri', gr: 0.3, canopy: true },
  aerobatic:   { color: '#d32f2f', accent: '#fdd835', L: 6.6, R: 0.55, cy: 1.05, n: 2.8, wing: W(3.8, 1.6, 1.0, 0.1, 0.0, 0.16), wy: -0.3, wx: 0.9, mid: true, engines: { type: 'nose-prop', blades: 3, pr: 0.95 }, tail: 'conv', fin: [1.2, 1.3, 0.7, 0.6], stab: [1.4, 1.0, 0.6, 0.2], gear: 'tail', gr: 0.3, canopy: true },
  'military-transport': { color: '#5f6b4e', accent: '#4a553c', matte: true, L: 30, R: 2.2, cy: 3.0, n: 2.4, wing: W(19, 4.8, 2.2, 1.5, -0.03), wy: 1.9, wx: 1.5, high: true, engines: { type: 'turboprop', at: [0.24, 0.5], R: 0.6, len: 4.0, blades: 4, pr: 2.1 }, tail: 'T', fin: [6.5, 6.0, 2.5, 4.5], stab: [7.5, 3.8, 1.8, 2.0], gear: 'pods', gr: 0.6, ramp: true },
  tanker:      { color: '#9aa1a8', accent: '#6f767d', matte: true, L: 46, R: 2.4, cy: 3.4, n: 2, wing: W(21, 8.5, 2.0, 9.0), wy: -1.5, wx: 1.5, low: true, engines: { type: 'fan', at: [0.36], R: 1.2, len: 5.0 }, tail: 'conv', fin: [8.5, 7.0, 2.4, 6.0], stab: [8.0, 5.0, 1.6, 4.5], gear: 'tri', gr: 0.6, boom: true, windows: 0, bogie: true },
  awacs:       { color: '#9aa1a8', accent: '#6f767d', matte: true, L: 46, R: 2.4, cy: 3.4, n: 2, wing: W(21, 8.5, 2.0, 9.0), wy: -1.5, wx: 1.5, low: true, engines: { type: 'fan', at: [0.3, 0.6], R: 0.9, len: 4.4 }, tail: 'conv', fin: [8.5, 7.0, 2.4, 6.0], stab: [8.0, 5.0, 1.6, 4.5], gear: 'tri', gr: 0.6, dome: true, windows: 0, bogie: true },
  'jet-trainer': { color: '#f5f5f5', accent: '#c62828', L: 11.5, R: 0.75, cy: 1.55, n: 2.2, wing: W(4.8, 2.4, 1.0, 1.0, 0.02, 0.1), wy: -0.35, wx: -0.5, low: true, engines: { type: 'internal' }, tail: 'conv', fin: [2.2, 2.2, 0.8, 1.8], stab: [2.2, 1.5, 0.6, 0.9], gear: 'tri', gr: 0.3, canopy: true, tandem: true },
  warbird:     { color: '#8a8f6a', accent: '#c9c2a2', L: 9.6, R: 0.7, cy: 1.75, n: 2.4, wing: W(5.6, 2.5, 1.1, 0.45, 0.1, 0.14), wy: -0.45, wx: 1.4, low: true, engines: { type: 'nose-prop', blades: 4, pr: 1.6 }, tail: 'conv', fin: [1.7, 1.6, 0.7, 0.9], stab: [2.2, 1.3, 0.7, 0.4], gear: 'tail', gr: 0.45, canopy: true },
  amphibian:   { color: '#f5f5f5', accent: '#c62828', L: 19, R: 1.3, cy: 2.0, n: 2.4, wing: W(14.5, 3.0, 1.8, 0.2, 0.0), wy: 1.4, wx: 1.0, high: true, engines: { type: 'turboprop', at: [0.25], R: 0.55, len: 3.4, blades: 4, pr: 1.6 }, tail: 'T', fin: [4.0, 3.6, 2.0, 2.0], stab: [4.5, 2.0, 1.2, 0.6], gear: 'tri', gr: 0.45, hullBottom: true, tipFloats: true, windows: 8 },
  freighter:   { color: '#f4f6f8', accent: '#ff6f00', L: 62, R: 3.0, cy: 4.4, n: 2, wing: W(29, 11, 2.5, 13), wy: -1.9, wx: 2.0, low: true, engines: { type: 'fan', at: [0.33], R: 1.75, len: 6.5 }, tail: 'conv', fin: [10.5, 9.0, 3.0, 8.5], stab: [10, 6.5, 2.0, 6.5], gear: 'tri', gr: 0.75, winglet: true, windows: 0, noseDoor: true, bogie: true },
  'water-bomber': { color: '#fdd835', accent: '#c62828', L: 19.5, R: 1.35, cy: 2.0, n: 2.4, wing: W(14, 3.2, 1.9, 0.2, 0.0), wy: 1.45, wx: 1.0, high: true, engines: { type: 'turboprop', at: [0.24], R: 0.6, len: 3.6, blades: 4, pr: 1.8 }, tail: 'conv', fin: [4.2, 3.8, 2.0, 2.2], stab: [4.5, 2.2, 1.2, 0.6], gear: 'tri', gr: 0.5, hullBottom: true, tipFloats: true, windows: 4 },
  'crop-duster': { color: '#fdd835', accent: '#1b5e20', L: 9.5, R: 0.65, cy: 1.65, n: 2.6, wing: W(7.0, 2.0, 1.8, 0.0, 0.07, 0.14), wy: -0.45, wx: 1.2, low: true, engines: { type: 'nose-prop', blades: 3, pr: 1.35 }, tail: 'conv', fin: [1.6, 1.6, 0.8, 0.8], stab: [2.0, 1.2, 0.7, 0.2], gear: 'tail', gr: 0.38, canopy: true, sprayBoom: true },
  supersonic:  { color: '#f5f5f5', accent: '#1565c0', L: 50, R: 1.45, cy: 3.6, n: 2, noseLen: 11, noseP: 1.3, wing: W(12.8, 26, 0.8, 24, 0.0, 0.035), wy: -1.0, wx: 6, low: true, delta: true, engines: { type: 'box' }, tail: 'fin-only', fin: [7.0, 10, 2.0, 8.5], gear: 'tri', gr: 0.6, windows: 26, droopNose: true, bogie: true },
  drone:       { color: '#b0bec5', accent: '#78909c', matte: true, L: 8.5, R: 0.55, cy: 1.15, n: 2.2, wing: W(8.0, 1.0, 0.55, 0.2, 0.0, 0.14), wy: 0.2, wx: 0.0, mid: true, engines: { type: 'pusher', blades: 3, pr: 0.9 }, tail: 'v', fin: [1.6, 0.9, 0.5, 0.5], gear: 'tri', gr: 0.22, bulbousNose: true },
  blimp:       { color: '#eceff1', accent: '#1565c0', special: 'blimp' },
  'hot-air-balloon': { color: '#e53935', accent: '#fdd835', special: 'balloon' },
};

export const AIR_EXTRA_TRIMS = {
  blimp: ['branded', 'night-sign', 'camera', 'long-gondola', 'retro'],
  'hot-air-balloon': ['striped', 'checkered', 'branded', 'large', 'tethered'],
};

/** Build one of the extra aircraft into ctx.root. Returns { gearAngles }. */
export function buildExtra(variant, ctx) {
  const { root, o, gear, spinTracks, flapTracks, extra, cur } = ctx;
  const v = AIR_EXTRA_VARIANTS[variant];
  if (v.special === 'balloon') return balloon(ctx, v);
  if (v.special === 'blimp') return blimp(ctx, v);
  const paint = v.matte ? new THREE.MeshStandardMaterial({ name: 'paint', color: M.toColor(o.color ?? v.color), roughness: 0.65, metalness: 0.2 }) : ctx.paint;
  const accent = v.matte ? new THREE.MeshStandardMaterial({ name: 'accent', color: M.toColor(o.accentColor ?? v.accent), roughness: 0.7 }) : ctx.accent;
  const darkGlass = ctx.darkGlass;
  const glass = glassMaterial(0.4);
  const L = v.L;
  const h = L / 2;
  const R = v.R;
  const p = { L, R, cy: v.cy, noseLen: v.noseLen ?? Math.min(R * 2.2, L * 0.16), noseP: v.noseP ?? 1.9, tailLen: L * 0.3, tailUp: R * 0.45, tailR: 0.14, n: v.n, droop: 0.2, noseTop: 0.8, tall: v.hump ? 1.0 : 1, bottom: v.hullBottom ? 1.1 : 1 };
  const baseSec = fuselageSection(p);
  const section = (x) => {
    const s = baseSec(x);
    if (v.hump && x > h - L * 0.38) {
      // upper deck hump over the front third
      const t = THREE.MathUtils.smoothstep(x, h - L * 0.4, h - L * 0.3);
      const nose = THREE.MathUtils.clamp((h - x) / (p.noseLen * 0.9), 0, 1);
      s.bt *= 1 + 0.62 * t * nose;
      s.cy += R * 0.12 * t * nose;
    }
    if (v.bulbousNose && x > h - p.noseLen * 1.5) s.bt *= 1 + 0.35 * Math.sin(THREE.MathUtils.clamp((x - (h - p.noseLen * 1.5)) / (p.noseLen * 1.5), 0, 1) * Math.PI);
    return s;
  };
  const cockpit = v.canopy ? [h - p.noseLen - L * 0.18, h - p.noseLen * 0.6] : [h - p.noseLen * 0.85, h - p.noseLen * 0.45];
  const region = (x, th, pt) => {
    const s = section(x);
    const yRel = (pt.y - s.cy) / (pt.y > s.cy ? s.bt : s.bb);
    if (v.open && x > h - L * 0.42 && x < h - L * 0.3 && yRel > 0.75) return -1; // open cockpit
    if ((v.canopy || v.open || !v.windows && L < 15) && x > cockpit[0] && x < cockpit[1] && yRel > (v.canopy ? 0.35 : 0.15) && yRel < (v.canopy ? 1.01 : 0.55)) return 1;
    if (v.hullBottom && yRel < -0.55) return 3;
    if (x < h - p.noseLen && yRel > -0.32 && yRel < -0.2) return 2;
    return 0;
  };
  const loft = tubeLoft({ x0: -h, x1: h, stations: 160, ring: 48, section, region, breaks: cockpit });
  cur.loft = loft;
  cur.h = h;
  mesh(loft.geometry, [paint, v.canopy ? glass : darkGlass, accent, M.paint('#263238', { metallic: 0.2 })], { parent: root, name: 'fuselage' });
  if (v.canopy || v.open) mesh(loft.geometry, new THREE.MeshStandardMaterial({ color: '#2a2c2f', roughness: 0.9, side: THREE.BackSide }), { parent: root, name: 'cockpit_inner' });
  // passenger windows
  if (v.windows) {
    const xs = [];
    const start = h - p.noseLen - (v.hump ? 3 : 1.5);
    const pitch = Math.min(0.95, (L * 0.62) / v.windows);
    for (let i = 0; i < v.windows; i++) xs.push(start - i * pitch);
    windowRow(root, loft, xs, 0.32, { w: R * 0.13, h: R * 0.18, mat: darkGlass });
    if (v.hump) windowRow(root, loft, xs.slice(0, 10), 0.95, { w: R * 0.12, h: R * 0.16, mat: darkGlass });
  }
  // wings
  const wy = v.cy + v.wy;
  const wing = v.wing;
  const tips = [];
  for (const sd of [1, -1]) {
    const w = buildWing(root, [v.wx, wy, 0], sd, wing, paint, { winglet: !!v.winglet || o.trim === 'winglets', flaps: !v.delta, flapSpan: [0.12, 0.55], ailSpan: [0.6, 0.92] });
    for (const f of w.flaps) flapTracks.push(rotateTrack(f.pivot, 'z', 6, (t) => f.side * pingPong(t) * 0.45));
    tips.push(sd);
    if (v.upper) mesh(wingGeometry({ span: wing.span, rootChord: wing.root, tipChord: wing.tip, sweep: wing.sweep, dihedral: 0.02, thickness: wing.thick, side: sd, segs: 10 }), paint, { parent: root, at: [v.wx + 0.25, v.cy + v.upper - (v.cy - R), 0] });
    if (v.strut) curveTube([[v.wx - 0.3, v.cy - R * 0.6, sd * R * 0.8], [v.wx - 0.4, wy - 0.05, sd * wing.span * 0.55]], 0.03, paint, { parent: root });
    if (v.tipFloats) {
      const fz = sd * wing.span * 0.88;
      mesh(new THREE.CapsuleGeometry(0.22, 1.4, 6, 16).rotateZ(Math.PI / 2), paint, { parent: root, at: [v.wx - wing.sweep * 0.88 - wing.tip * 0.3, wy - 0.85, fz], name: 'tip_float' });
      tube([v.wx - wing.sweep * 0.88 - wing.tip * 0.3, wy - 0.65, fz], [v.wx - wing.sweep * 0.88 - wing.tip * 0.3, wy + 0.02, fz], 0.05, paint, { parent: root });
    }
  }
  if (v.upper) {
    // interplane struts + cabane
    for (const sd of [1, -1]) for (const f of [0.75]) {
      const z = sd * wing.span * f;
      for (const dx of [0.2, -0.9]) tube([v.wx + dx, wy + 0.02, z], [v.wx + dx + 0.25, v.cy + v.upper - (v.cy - R) - 0.02, z], 0.025, M.wood('walnut'), { parent: root });
    }
    for (const sd of [1, -1]) tube([v.wx, v.cy + R * 0.7, sd * 0.35], [v.wx + 0.25, v.cy + v.upper - (v.cy - R) - 0.02, sd * 0.4], 0.025, M.metal('#333'), { parent: root });
  }
  // engines
  const e = v.engines;
  if (e) {
    if (e.type === 'fan') {
      for (const f of e.at) for (const sd of [1, -1]) {
        const z = sd * wing.span * f;
        const ex = v.wx - wing.sweep * f + e.len * 0.35;
        const ey = Math.max(wy - e.R - 0.45 + wing.dihedral * wing.span * f, e.R + 0.45);
        const { fan } = nacelle(root, `fan_${sd > 0 ? 'R' : 'L'}${f}`, [ex, ey, z], { R: e.R, len: e.len, paint });
        spinTracks.push(spinTrack(fan, 'x', 0.2, 1));
        const py = wingGeometry({ span: wy + wing.dihedral * wing.span * f - ey - e.R * 0.6 + 0.3, rootChord: e.len * 0.75, tipChord: e.len * 0.6, sweep: 0.3, thickness: 0.14, segs: 3 });
        py.rotateX(-Math.PI / 2);
        mesh(py, paint, { parent: root, at: [ex - e.len * 0.05, ey + e.R * 0.6, z] });
      }
    } else if (e.type === 'rear-fan') {
      for (const sd of [1, -1]) {
        const ez = sd * (R + e.R + 0.25);
        const { fan } = nacelle(root, `fan_${sd > 0 ? 'R' : 'L'}`, [-h + L * 0.3, v.cy + R * 0.45, ez], { R: e.R, len: e.len, paint });
        spinTracks.push(spinTrack(fan, 'x', 0.2, 1));
        mesh(wingGeometry({ span: e.R + 0.4, rootChord: e.len * 0.6, tipChord: e.len * 0.5, sweep: 0.2, thickness: 0.14, side: sd, segs: 3 }), paint, { parent: root, at: [-h + L * 0.3, v.cy + R * 0.4, sd * R * 0.6] });
      }
    } else if (e.type === 'turboprop' || e.type === 'prop') {
      for (const f of e.at) for (const sd of [1, -1]) {
        const z = sd * wing.span * f;
        const lx = v.wx - wing.sweep * f;
        const ny = wy + wing.dihedral * wing.span * f + (v.high ? -e.R * 0.35 : e.R * 0.25);
        const nac = new THREE.CapsuleGeometry(e.R, e.len - 2 * e.R, 8, 20).rotateZ(Math.PI / 2);
        mesh(nac, paint, { parent: root, at: [lx - e.len * 0.1, ny, z], name: 'nacelle' });
        const pr = propeller(root, `prop_${sd > 0 ? 'R' : 'L'}${f}`, [lx + e.len * 0.4 - 0.03, ny, z], { blades: e.blades, radius: e.pr, chord: e.pr * 0.14, spinnerR: e.R * 0.55 });
        spinTracks.push(spinTrack(pr, 'x', 0.15, sd));
      }
    } else if (e.type === 'nose-prop' || e.type === 'pusher') {
      const px = e.type === 'pusher' ? -h + 0.03 : h - 0.03;
      const pr = propeller(root, 'propeller_hub', [px, v.cy - (e.type === 'pusher' ? 0 : p.droop * R), 0], { blades: e.blades, radius: e.pr, chord: e.pr * 0.14, spinnerR: R * 0.32 });
      if (e.type === 'pusher') pr.rotation.y = Math.PI;
      spinTracks.push(spinTrack(pr, 'x', 0.12, 1));
    } else if (e.type === 'box') {
      // underwing engine boxes (supersonic)
      for (const sd of [1, -1]) {
        mesh(roundedBox(10, 1.3, 2.6, 0.3), paint, { parent: root, at: [v.wx - 15, wy - 0.75, sd * 3.8], name: 'engine_box' });
        for (const k of [-0.65, 0.65]) mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 20).rotateZ(Math.PI / 2), M.metal('#2b2b2b'), { parent: root, at: [v.wx - 20.05, wy - 0.75, sd * 3.8 + k] });
      }
    }
  }
  // tail
  const fin = v.fin;
  const stab = v.stab;
  const finAt = [-h + fin[1] * 0.9, v.cy + p.tailUp * 0.75, 0];
  if (v.tail === 'v') {
    for (const sd of [1, -1]) {
      const g = wingGeometry({ span: fin[0], rootChord: fin[1], tipChord: fin[2], sweep: fin[3], thickness: 0.1, side: sd, segs: 5, dihedral: 0.9 });
      mesh(g, paint, { parent: root, at: [-h + fin[1] * 1.1, v.cy + p.tailUp * 0.5, 0] });
    }
  } else {
    vFin(root, finAt, { span: fin[0], root: fin[1], tip: fin[2], sweep: fin[3], thick: 0.11 }, v.tail === 'fin-only' ? paint : accent, Math.min(1.2, fin[0] * 0.14));
    if (stab) {
      const sy = v.tail === 'T' ? finAt[1] + fin[0] - 0.15 : v.cy + p.tailUp * 0.6;
      const sx = v.tail === 'T' ? finAt[0] - fin[3] - 0.1 : -h + stab[1] * 1.05;
      for (const sd of [1, -1]) mesh(wingGeometry({ span: stab[0], rootChord: stab[1], tipChord: stab[2], sweep: stab[3], thickness: 0.1, side: sd, segs: 6, dihedral: v.tail === 'T' ? 0 : 0.05 }), paint, { parent: root, at: [sx, sy, 0] });
    }
  }
  noseEmblems(root, loft, h - p.noseLen - Math.min(2, L * 0.05), 0.05, Math.min(0.9, R * 0.28));
  // extras
  if (v.dome) {
    const d = group('radar_dome', { parent: root, at: [-h * 0.35, v.cy + R + 1.4, 0] });
    mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.9, 40), M.matte('#e0e0e0', 0.5), { parent: d });
    mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.06, 40), M.matte('#263238'), { parent: d, at: [0, 0, 0] });
    for (const sd of [1, -1]) mesh(roundedBox(1.0, 1.6, 0.3, 0.1), paint, { parent: root, at: [-h * 0.35 + sd * 1.5, v.cy + R + 0.5, 0], rot: [0, 0, sd * 0.3] });
    extra.push(clip('radar', 10, [spinTrack(d, 'y', 10, 1)]));
  }
  if (v.boom) {
    // boom fairing / gimbal housing faired into the tail cone underside
    mesh(roundedBox(1.4, R * 0.9 + 0.3, 0.6, 0.2), paint, { parent: root, name: 'boom_fairing', at: [-h + 3, v.cy - R * 0.15, 0] });
    mesh(new THREE.SphereGeometry(0.35, 16, 12), paint, { parent: root, name: 'boom_gimbal', at: [-h + 3, v.cy - R * 0.6, 0] });
    const b = group('refuel_boom', { parent: root, at: [-h + 3, v.cy - R * 0.6, 0], rot: [0, 0, -0.5] });
    mesh(new THREE.CylinderGeometry(0.22, 0.18, 9, 14).rotateZ(Math.PI / 2), paint, { parent: b, at: [-4.5, 0, 0] });
    for (const sd of [1, -1]) mesh(wingGeometry({ span: 1.2, rootChord: 0.8, tipChord: 0.5, sweep: 0.3, thickness: 0.1, side: sd, segs: 3, dihedral: 0.6 }), paint, { parent: b, at: [-6.5, 0, 0] });
    extra.push(clip('boom', 6, [rotateTrack(b, 'z', 6, (t) => -0.5 + Math.min(1, pingPong(t) * 1.4) * 0.3)]));
  }
  if (v.ramp) {
    const ramp = group('ramp', { parent: root, at: [-h + L * 0.3, v.cy - R * 0.9, 0] });
    mesh(roundedBox(4.0, 0.12, R * 1.6, 0.05), paint, { parent: ramp, at: [-2.0 * Math.cos(0.15), 2.0 * Math.sin(0.15), 0], rot: [0, 0, -0.15] });
    mesh(new THREE.CylinderGeometry(0.08, 0.08, R * 2, 14).rotateX(Math.PI / 2), paint, { parent: root, name: 'ramp_hinge', at: [-h + L * 0.3, v.cy - R * 0.9, 0] });
    extra.push(clip('ramp', 6, [rotateTrack(ramp, 'z', 6, (t) => Math.min(1, pingPong(t) * 1.4) * -0.3)]));
  }
  if (v.noseDoor) {
    const nd = group('nose_door', { parent: root, at: [h - p.noseLen, v.cy + R * 0.85, 0] });
    mesh(roundedBox(0.08, R * 1.4, R * 1.5, 0.04), paint, { parent: nd, at: [p.noseLen * 0.3, -R * 0.7, 0] });
    extra.push(clip('noseDoor', 8, [rotateTrack(nd, 'z', 8, (t) => Math.min(1, pingPong(t) * 1.4) * 1.1)]));
  }
  if (v.sprayBoom) for (const sd of [1, -1]) {
    tube([v.wx - wing.root * 0.85, wy - 0.12, sd * 0.6], [v.wx - wing.root * 0.85 + wing.tip * 0.02, wy - 0.12, sd * wing.span * 0.95], 0.025, M.metal('#9aa0a6'), { parent: root, name: 'spray_boom' });
    for (let k = 1; k < 9; k++) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), M.metal('#333'), { parent: root, at: [v.wx - wing.root * 0.85, wy - 0.18, sd * (0.6 + k * wing.span * 0.1)] });
  }
  if (v.hullBottom) {
    // boat hull step + water scoop/doors on the belly
    const st = loft.at(0, Math.PI * 1.5);
    mesh(roundedBox(1.2, 0.18, R * 1.2, 0.06), M.paint('#263238', { metallic: 0.2 }), { parent: root, at: [0, st.point.y + 0.05, 0], name: 'hull_step' });
  }
  // landing gear
  const gr = v.gr;
  let angles = [];
  if (v.gear === 'tri' || v.gear === 'pods') {
    const belly = (x) => loft.at(x, Math.PI * 1.5).point.y;
    const nx = h - p.noseLen * (v.canopy ? 1.0 : 1.4);
    const ny = belly(nx) + 0.06;
    gear.push(gearLeg('gear_nose', root, [nx, ny, 0], { len: ny - gr * 0.8, r: gr * 0.8, w: gr * 0.5, wheels: L > 15 ? 2 : 1, strutR: Math.max(0.03, gr * 0.12) }));
    const mz = v.gear === 'pods' ? R * 1.05 : v.high || v.mid ? R * 0.85 : Math.min(wing.span * 0.22, R * 2.4);
    const mx = v.wx - wing.root * 0.55;
    const my = v.gear === 'pods' ? belly(mx) + 0.2 : v.low ? wy + wing.dihedral * mz + 0.12 : belly(mx) + 0.1;
    for (const sd of [1, -1]) gear.push(gearLeg(sd > 0 ? 'gear_R' : 'gear_L', root, [mx, my, sd * mz], { len: my - gr, r: gr, w: gr * 0.6, wheels: L > 15 ? 2 : 1, bogie: !!v.bogie, strutR: Math.max(0.035, gr * 0.15) }));
    if (v.gear === 'pods') for (const sd of [1, -1]) mesh(cushion(5.0, 1.0, 0.9, { radius: 0.35 }), paint, { parent: root, at: [mx, belly(mx) + 0.55, sd * (R * 0.85)], name: 'gear_pod' });
    if (v.high || v.mid || v.gear === 'pods') for (const sd of [1, -1]) if (v.gear !== 'pods') mesh(cushion(1.2, 0.35, 0.5, { radius: 0.12 }), paint, { parent: root, at: [mx, my - 0.05, sd * (mz - 0.15)], name: 'gear_fairing' });
    angles = [['z', 1], ['x', 1], ['x', -1]];
    if (v.bogies === 4) angles = [['z', 1], ['x', 1], ['x', -1], ['x', 1], ['x', -1]];
  } else if (v.gear === 'tail') {
    const mx = v.wx + 0.2;
    const my = v.cy - R * 0.6;
    for (const sd of [1, -1]) {
      tube([mx, my, sd * R * 0.4], [mx + 0.25, gr, sd * R * 1.3], 0.04, paint, { parent: root });
      const wl = group(null, { parent: root, at: [mx + 0.25, gr, sd * R * 1.35] });
      mesh(new THREE.CylinderGeometry(gr, gr, gr * 0.5, 24).rotateX(Math.PI / 2), M.rubber(), { parent: wl });
      mesh(new THREE.CylinderGeometry(gr * 0.5, gr * 0.5, gr * 0.52, 16).rotateX(Math.PI / 2), M.metal('#9aa0a6'), { parent: wl });
    }
    tube([mx + 0.25, gr, -R * 1.3], [mx + 0.25, gr, R * 1.3], 0.03, M.metal('#555'), { parent: root });
    const tx = -h + 0.6;
    const ty = loft.at(tx, Math.PI * 1.5).point.y;
    tube([tx, ty + 0.02, 0], [tx - 0.15, 0.1, 0], 0.025, M.metal('#333'), { parent: root });
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16).rotateX(Math.PI / 2), M.rubber(), { parent: root, at: [tx - 0.15, 0.1, 0] });
    // tail-sitter: tilt the airframe nose-up on its gear
  } else if (v.gear === 'mono') {
    const bx = v.wx - 0.2;
    const by = loft.at(bx, Math.PI * 1.5).point.y;
    mesh(new THREE.CylinderGeometry(gr, gr, 0.12, 24).rotateX(Math.PI / 2), M.rubber(), { parent: root, at: [bx, gr, 0] });
    mesh(cushion(0.5, Math.max(0.06, by - gr * 1.2), 0.2, { radius: 0.04 }), paint, { parent: root, at: [bx, (by + gr) / 2 + 0.05, 0] });
    // wing-tip skid wheel keeps it level-ish: left tip resting on a small skid
    const tz = -wing.span * 0.98;
    const ty = wy + wing.dihedral * wing.span;
    tube([v.wx - wing.sweep - wing.tip * 0.3, ty, tz], [v.wx - wing.sweep - wing.tip * 0.3, 0.04, tz], 0.02, M.metal('#555'), { parent: root, name: 'tip_skid' });
    const tx = -h + 0.4;
    mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12).rotateX(Math.PI / 2), M.rubber(), { parent: root, at: [tx, 0.08, 0] });
    tube([tx, 0.08, 0], [tx, loft.at(tx, Math.PI * 1.5).point.y + 0.02, 0], 0.02, M.metal('#555'), { parent: root });
  }
  if (v.windows || v.bogie) {
    // belly fairing (wing-to-body) + APU exhaust at the tail cone
    const bx = v.wx - wing.root * 0.35;
    const bp = loft.at(bx, Math.PI * 1.5);
    mesh(cushion(wing.root * 1.3, R * 0.5, R * 1.5, { radius: R * 0.22, bulge: 0.2 }), paint, { parent: root, at: [bx, bp.point.y + R * 0.22, 0], name: 'belly_fairing' });
    const ap = loft.at(-h + 0.25, Math.PI / 2);
    mesh(new THREE.CylinderGeometry(R * 0.07, R * 0.08, 0.3, 16).rotateZ(Math.PI / 2), M.metal('#3a3c40', 0.4), { parent: root, at: [-h + 0.05, ap.point.y - R * 0.12, 0], name: 'apu_exhaust' });
    // flap-track fairings under the wing trailing edge
    if (!v.high) for (const sd of [1, -1]) for (const f of [0.2, 0.38, 0.56, 0.72]) {
      const chord = wing.root + (wing.tip - wing.root) * f;
      const te = v.wx - wing.sweep * f + chord * 0.25 - chord * 0.92;
      mesh(new THREE.CapsuleGeometry(R * 0.06, chord * 0.35, 4, 10).rotateZ(Math.PI / 2), paint, { parent: root, at: [te, wy + wing.dihedral * wing.span * f - R * 0.04, sd * wing.span * f], name: 'flap_track' });
    }
  }
  if (v.bogies === 4) {
    // body gear: two more 4-wheel bogies under the fuselage
    const bx = v.wx - wing.root * 0.6;
    const by = loft.at(bx, Math.PI * 1.5).point.y + 0.1;
    for (const sd of [1, -1]) gear.push(gearLeg(sd > 0 ? 'gear_BR' : 'gear_BL', root, [bx, by, sd * R * 0.45], { len: by - gr, r: gr, w: gr * 0.6, wheels: 2, bogie: true, strutR: gr * 0.15 }));
  }
  if (v.tandem) for (const dx of [0, -1.1]) mesh(cushion(0.5, 0.1, 0.5, { radius: 0.04 }), M.fabric('#222'), { parent: root, at: [cockpit[1] - 0.9 + dx, v.cy + 0.1, 0] });
  return { gearAngles: angles };
}

/* ---------------- balloon ---------------- */
function balloon(ctx, v) {
  const { root, o, cur } = ctx;
  const trim = o.trim;
  const k = trim === 'large' ? 1.25 : 1;
  const Rb = 8 * k;
  const baseY = 1.25 + 4.5 * k;
  // basket on the ground, burner frame, envelope above on cables
  const wick = M.wood('#a1887f');
  mesh(roundedBox(1.4, 1.1, 1.4, 0.1), wick, { parent: root, at: [0, 0.55, 0], name: 'basket' });
  mesh(roundedBox(1.46, 0.12, 1.46, 0.05), M.matte('#5d4037', 0.8), { parent: root, at: [0, 1.12, 0] });
  for (const [x, z] of [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]]) tube([x, 1.15, z], [x * 0.5, 2.6, z * 0.5], 0.02, M.metal('#555'), { parent: root });
  mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.4, 20), M.chrome(), { parent: root, at: [0, 2.75, 0], name: 'burner' });
  const flame = lampGroup('burner_flame', 'amber');
  flame.add(root, { at: [0, 2.98, 0], normal: [0, 1, 0], w: 0.3, h: 0.3, shape: 'round', depth: 0.05, bezel: false, glowSize: 1.4 });
  // envelope: lathe teardrop, gores coloured via vertex colours
  const prof = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const a = -Math.PI / 2 + t * Math.PI;
    const rr = t < 0.35 ? THREE.MathUtils.lerp(0.9 * k, Rb * 0.9, (t / 0.35) ** 1.3) : Rb * Math.cos(Math.max(0, a - 0.1) * 0.95);
    prof.push(new THREE.Vector2(Math.max(0.01, rr), baseY + t * Rb * 2.2));
  }
  const env = new THREE.LatheGeometry(prof, 48);
  const cols = [M.toColor(o.color ?? v.color), M.toColor(o.accentColor ?? v.accent), new THREE.Color('#1565c0'), new THREE.Color('#ffffff')];
  const pos = env.attributes.position;
  const c = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const ang = Math.atan2(pos.getZ(i), pos.getX(i)) + Math.PI;
    const gore = Math.floor((ang / (Math.PI * 2)) * 16);
    const band = Math.floor(((pos.getY(i) - baseY) / (Rb * 2.2)) * 8);
    const idx = trim === 'checkered' ? (gore + band) % 2 : trim === 'striped' ? (band % 2) * 2 : gore % 2;
    cols[idx].toArray(c, i * 3);
  }
  env.setAttribute('color', new THREE.BufferAttribute(c, 3));
  mesh(env, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), { parent: root, name: 'envelope' });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    tube([Math.cos(a) * 0.28, 2.9, Math.sin(a) * 0.28], [Math.cos(a) * 0.9 * k, baseY + 0.05, Math.sin(a) * 0.9 * k], 0.012, M.metal('#333'), { parent: root, radialSegments: 4 });
  }
  if (trim === 'branded') {
    const t = textMaterial('ORBIX', { color: '#ffffff', font: 'bold 100px Arial', stroke: '#00000066' });
    for (const s of [1, -1]) decal(root, t, { at: [0, baseY + Rb * 1.1, s * (Rb * 0.99)], normal: [0, 0, s], w: Rb * 1.0, h: Rb * 0.28 });
  }
  if (trim === 'tethered') for (const [x, z] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) {
    tube([x * 0.12, 1.0, z * 0.12], [x, 0.05, z], 0.012, M.fabric('#eceff1'), { parent: root, radialSegments: 4 });
    mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.25, 8), M.metal('#555'), { parent: root, at: [x, 0.1, z] });
  }
  const e = emblemOn(root, { point: new THREE.Vector3(0.7, 0.75, 0), normal: new THREE.Vector3(1, 0, 0) }, 0.35, 'emblem');
  cur.h = 0;
  ctx.extra.push(clip('burner', 2, [
    new THREE.NumberKeyframeTrack('burner_flame.material.emissiveIntensity', [0, 0.1, 1.2, 1.3, 2], [0, 6, 6, 0, 0], THREE.InterpolateDiscrete),
    new THREE.NumberKeyframeTrack('burner_flame_glow.material.opacity', [0, 0.1, 1.2, 1.3, 2], [0, 1, 1, 0, 0], THREE.InterpolateDiscrete),
  ]));
  return { gearAngles: [] };
}

/* ---------------- blimp (moored on a mast truck) ---------------- */
function blimp(ctx, v) {
  const { root, o, cur, paint, accent, darkGlass } = ctx;
  const trim = o.trim;
  const L = 58;
  const h = L / 2;
  const R0 = 7.5;
  const cy = R0 + 5.5;
  const section = (x) => {
    const t = (x + h) / L;
    const r = R0 * Math.sqrt(Math.max(0.0004, 1 - ((t - 0.42) / (t < 0.42 ? 0.42 : 0.58)) ** 2));
    return { cy, a: r, bt: r, bb: r, n: 2 };
  };
  const region = (x, th, pt) => (Math.abs(pt.y - cy) < R0 * 0.08 && x > -h * 0.6 && x < h * 0.7 ? 1 : 0);
  const loft = tubeLoft({ x0: -h, x1: h, stations: 120, ring: 48, section, region });
  cur.loft = loft;
  cur.h = h;
  mesh(loft.geometry, [paint, accent], { parent: root, name: 'envelope' });
  for (const [ry, rz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const g = wingGeometry({ span: 6, rootChord: 9, tipChord: 5, sweep: 3, thickness: 0.1, segs: 4, side: 1 });
    const f = mesh(g, accent, { parent: root, at: [-h + 9, cy, 0], name: 'fin' });
    f.rotation.x = Math.atan2(ry, rz) - Math.PI / 2 + Math.PI / 2;
    f.rotation.x = rz ? (rz > 0 ? 0 : Math.PI) : (ry > 0 ? -Math.PI / 2 : Math.PI / 2);
    f.position.add(new THREE.Vector3(0, ry * section(-h + 9).a * 0.7, rz * section(-h + 9).a * 0.7));
  }
  // gondola under the envelope
  const gl = trim === 'long-gondola' ? 14 : 9;
  const gy = cy - R0 + 0.2;
  mesh(cushion(gl, 2.6, 2.8, { radius: 0.9, bulge: 0.1 }), paint, { parent: root, at: [2, gy - 1.3, 0], name: 'gondola' });
  for (const s of [1, -1]) for (let x = 2 - gl / 2 + 1; x < 2 + gl / 2 - 0.8; x += 1.3) mesh(roundedBox(0.9, 0.8, 0.04, 0.1), darkGlass, { parent: root, at: [x, gy - 0.9, s * 1.41] });
  for (const s of [1, -1]) {
    const pr = propeller(root, `prop_${s > 0 ? 'R' : 'L'}`, [0, gy - 1.2, s * 2.6], { blades: 3, radius: 1.2, chord: 0.2, spinnerR: 0.25 });
    mesh(new THREE.CapsuleGeometry(0.35, 1.4, 6, 14).rotateZ(Math.PI / 2), paint, { parent: root, at: [-1.0, gy - 1.2, s * 2.6] });
    tube([-1.0, gy - 1.2, s * 1.4], [-1.0, gy - 1.2, s * 2.3], 0.08, paint, { parent: root });
    ctx.spinTracks.push(spinTrack(pr, 'x', 0.2, s));
  }
  // landing wheel under the gondola + mooring mast at the nose
  mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 20).rotateX(Math.PI / 2), M.rubber(), { parent: root, at: [2, 0.5, 0], name: 'landing_wheel' });
  tube([2, 0.5, 0], [2, gy - 2.5, 0], 0.12, M.metal('#555'), { parent: root });
  const mx = h + 1.2;
  mesh(new THREE.CylinderGeometry(0.35, 0.6, cy + 0.2, 16), M.paint('#f9a825'), { parent: root, at: [mx, (cy + 0.2) / 2, 0], name: 'mooring_mast' });
  mesh(roundedBox(4, 0.4, 4, 0.1), M.metal('#555'), { parent: root, at: [mx, 0.2, 0] });
  mesh(new THREE.SphereGeometry(0.5, 16, 10), M.metal('#555'), { parent: root, at: [h + 0.4, cy, 0] });
  tube([h - 0.2, cy, 0], [mx, cy, 0], 0.15, M.metal('#555'), { parent: root });
  const tx = trim === 'branded' || trim === 'retro' ? (trim === 'retro' ? 'ORBIX AIRSHIP' : 'ORBIX') : null;
  if (tx) for (const s of [1, -1]) {
    const p = loft.at(0, s > 0 ? 0.3 : Math.PI - 0.3);
    decal(root, textMaterial(tx, { color: trim === 'retro' ? '#b71c1c' : '#1565c0', font: 'bold 100px Arial' }), { at: p.point.clone().addScaledVector(p.normal, 0.05).toArray(), normal: p.normal.toArray(), w: 26, h: 5.5 });
  }
  if (trim === 'night-sign') for (const s of [1, -1]) {
    const p = loft.at(-4, s > 0 ? 0.0 : Math.PI);
    lampGroup('night_sign', 'blue').add(root, { at: p.point.toArray(), normal: p.normal.toArray(), w: 22, h: 4, depth: 0.05, bezel: false, glowSize: 6 });
  }
  if (trim === 'camera') {
    mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 10), M.metal('#333'), { parent: root, at: [5.5, gy - 2.8, 0] });
    mesh(new THREE.SphereGeometry(0.55, 20, 14), M.paint('#eceff1'), { parent: root, at: [5.5, gy - 3.3, 0], name: 'camera_ball' });
  }
  emblemOn(root, loft.at(h * 0.6, 0.35), 2.4, 'emblem');
  emblemOn(root, loft.at(h * 0.6, Math.PI - 0.35), 2.4, 'emblem');
  return { gearAngles: [] };
}
