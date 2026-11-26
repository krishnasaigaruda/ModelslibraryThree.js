import * as THREE from 'three';
import { group, mesh, rng, finalize, normalizeOptions, lathe } from '../../core/utils.js';
import { rotateTrack, clip, wave } from '../../core/animation.js';
import { sweep, merge, paintVertices, blob, fbm, bladeGeometry, place, seedOf, vcMat, checkVariant, instanced } from './common.js';

const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0);

/* ================================ Water plants ================================ */

/*
 * Pond and marsh plants, each on a small patch of water (y = 0.02):
 * lily pads (notched floating leaves + cup flowers), lotus (raised round leaves,
 * big pink flowers, seed pods), reeds, cattails (brown spikes), papyrus (umbels),
 * water hyacinth (glossy rosettes, lilac spikes), yellow flag iris, horsetail.
 */
export const WATER_PLANT_VARIANTS = {
  'lily-pads': { color: '#3f7a2e', flower: '#f6f0f2' },
  lotus: { color: '#5a8a4a', flower: '#f2a0b8' },
  reeds: { color: '#6a8a3a' },
  cattails: { color: '#5a7a34', spike: '#5a3a1e' },
  papyrus: { color: '#5a9a3a' },
  'water-hyacinth': { color: '#3a7a2a', flower: '#b89ae0' },
  'yellow-iris': { color: '#4a7a34', flower: '#f2d02a' },
  horsetail: { color: '#4a7a3a' },
};
export const WATER_PLANT_TRIMS = Object.fromEntries(Object.keys(WATER_PLANT_VARIANTS).map((k) => [k, ['small', 'large', 'flowering', 'autumn', 'dense']]));

function waterPatch(R, seed) {
  const g = new THREE.CircleGeometry(R, 40);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getY(i), p.getX(i));
    const r = Math.hypot(p.getX(i), p.getY(i));
    const k = 1 + 0.12 * fbm(Math.cos(a) * 2, Math.sin(a) * 2, 0, seed, 2);
    p.setXY(i, Math.cos(a) * r * k, Math.sin(a) * r * k);
  }
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0.02, 0);
  return g;
}

export function createWaterPlant(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('water-plant', WATER_PLANT_VARIANTS, WATER_PLANT_TRIMS, o.variant, o.trim);
  const v = WATER_PLANT_VARIANTS[variant];
  const trim = o.trim ?? null;
  const seed = seedOf(o, 51 + variant.length);
  const rand = rng(seed * 23 + 9);
  const root = group(`water-plant-${variant}${trim ? `-${trim}` : ''}`);
  const sway = group('sway', { parent: root });
  const s = trim === 'small' ? 0.55 : trim === 'large' ? 1.6 : 1;
  const nK = trim === 'dense' ? 2.2 : 1;
  const autumn = trim === 'autumn';
  const color = o.color ?? (autumn ? '#a8884a' : v.color);
  const tip = autumn ? '#c8a860' : new THREE.Color(color).lerp(new THREE.Color('#c8e088'), 0.3).getStyle();
  const flowers = trim === 'flowering' || (trim !== 'autumn' && trim !== 'small' && ['lily-pads', 'lotus', 'water-hyacinth'].includes(variant));
  const R = (variant === 'lily-pads' || variant === 'water-hyacinth' ? 0.9 : 0.6) * s * (trim === 'dense' ? 1.3 : 1);
  const geos = [];
  const fl = [];
  switch (variant) {
    case 'lily-pads': {
      const n = Math.round(14 * nK * s);
      for (let i = 0; i < n; i++) {
        const a = rand() * 6.28;
        const r = Math.sqrt(rand()) * R * 0.85;
        const pr = (0.1 + rand() * 0.1) * Math.max(0.7, s);
        const pad = new THREE.CircleGeometry(pr, 24, 0.25, Math.PI * 2 - 0.5); // the notch
        pad.rotateX(-Math.PI / 2);
        pad.rotateY(rand() * 6.28);
        const pp = pad.attributes.position;
        for (let j = 0; j < pp.count; j++) pp.setY(j, 0.024 + Math.hypot(pp.getX(j), pp.getZ(j)) * 0.04);
        pad.translate(Math.cos(a) * r, 0, Math.sin(a) * r);
        geos.push(paintVertices(pad, (q) => new THREE.Color(color).multiplyScalar(0.8 + 0.25 * fbm(q.x * 20, 0, q.z * 20, seed, 2)).lerp(new THREE.Color(autumn ? '#8a4a2a' : '#7a5a3a'), autumn ? 0.4 : 0)));
        if (flowers && i % 4 === 0) {
          const cup = [];
          for (let L = 0; L < 3; L++) for (let k = 0; k < 8; k++) { const b = bladeGeometry(0.05 - L * 0.01, 0.022, { curl: -0.1, cup: 0.6, color: v.flower, tipColor: L === 2 ? '#f2d84a' : '#ffffff' }); b.rotateX(1.25 - L * 0.4); b.rotateY((k / 8) * Math.PI * 2 + L * 0.4); cup.push(b); }
          const g = merge(cup);
          g.translate(Math.cos(a) * r + 0.05, 0.03, Math.sin(a) * r);
          fl.push(g);
        }
      }
      break;
    }
    case 'lotus': {
      const n = Math.round(9 * nK * s);
      for (let i = 0; i < n; i++) {
        const a = rand() * 6.28;
        const r = Math.sqrt(rand()) * R * 0.8;
        const base = new V3(Math.cos(a) * r, 0, Math.sin(a) * r);
        const h = (0.3 + rand() * 0.6) * s;
        const top = base.clone().add(new V3((rand() - 0.5) * 0.1, h, (rand() - 0.5) * 0.1));
        geos.push(paintVertices(sweep([base, base.clone().lerp(top, 0.5).add(new V3(0.03, 0, 0)), top], () => 0.006 * s, { radial: 5, segments: 6 }), () => new THREE.Color('#6a8a3a')));
        // round umbrella-shaped leaf with a central dimple
        const lf = new THREE.CircleGeometry((0.18 + rand() * 0.1) * s, 24);
        const lp = lf.attributes.position;
        for (let j = 0; j < lp.count; j++) { const rr = Math.hypot(lp.getX(j), lp.getY(j)); lp.setZ(j, rr * 0.35 - rr * rr * 1.4 + 0.01 * Math.sin(Math.atan2(lp.getY(j), lp.getX(j)) * 9)); }
        lf.computeVertexNormals();
        lf.rotateX(-Math.PI / 2);
        lf.translate(top.x, top.y, top.z);
        geos.push(paintVertices(lf, (q) => new THREE.Color(color).multiplyScalar(0.8 + 0.3 * Math.max(0, 1 - Math.hypot(q.x - top.x, q.z - top.z) * 5))));
        if (flowers && i % 3 === 0) {
          const ftop = top.clone().add(new V3(0.12, 0.25 * s, 0.05));
          geos.push(paintVertices(sweep([base, ftop], () => 0.005 * s, { radial: 5, segments: 3 }), () => new THREE.Color('#6a8a3a')));
          const cup = [];
          for (let L = 0; L < 3; L++) for (let k = 0; k < 8; k++) { const b = bladeGeometry((0.09 - L * 0.015) * s, 0.05 * s, { curl: -0.15, cup: 0.7, color: '#fbe8ee', tipColor: v.flower }); b.rotateX(0.95 - L * 0.3); b.rotateY((k / 8) * Math.PI * 2 + L * 0.4); cup.push(b); }
          const pod = lathe([[0.001, 0], [0.02 * s, 0.01 * s], [0.03 * s, 0.035 * s], [0.001, 0.036 * s]], 12);
          cup.push(paintVertices(pod, () => new THREE.Color('#d8d06a')));
          const g = merge(cup);
          g.translate(ftop.x, ftop.y, ftop.z);
          fl.push(g);
        }
      }
      break;
    }
    case 'water-hyacinth': {
      const n = Math.round(10 * nK * s);
      for (let i = 0; i < n; i++) {
        const a = rand() * 6.28;
        const r = Math.sqrt(rand()) * R * 0.8;
        const c = new V3(Math.cos(a) * r, 0.02, Math.sin(a) * r);
        // swollen floating petioles + glossy round leaves
        for (let k = 0; k < 7; k++) {
          const b = bladeGeometry(0.11 * s, 0.09 * s, { curl: -0.1, cup: 0.5, color, tipColor: tip, tip: 0.5 });
          b.rotateX(0.7 + rand() * 0.3);
          b.rotateY((k / 7) * Math.PI * 2 + i);
          b.translate(c.x, c.y, c.z);
          geos.push(b);
        }
        if (flowers && i % 2 === 0) {
          const top = c.clone().add(new V3(0, 0.22 * s, 0));
          geos.push(paintVertices(sweep([c, top], () => 0.004, { radial: 4, segments: 2 }), () => new THREE.Color('#5a8a3a')));
          const sp = blob(0.035 * s, { detail: 2, seed: i, amount: 0.3, freq: 5, scale: [1, 2, 1] });
          sp.translate(top.x, top.y + 0.04 * s, top.z);
          fl.push(paintVertices(sp, () => new THREE.Color(v.flower)));
        }
      }
      break;
    }
    default: {
      // emergent plants standing in the water
      const n = Math.round((variant === 'horsetail' ? 60 : variant === 'papyrus' ? 14 : 45) * nK * s);
      for (let i = 0; i < n; i++) {
        const a = rand() * 6.28;
        const r = Math.sqrt(rand()) * R * 0.7;
        const base = new V3(Math.cos(a) * r, 0, Math.sin(a) * r);
        const H = { reeds: 1.8, cattails: 1.6, papyrus: 2.0, 'yellow-iris': 0.9, horsetail: 0.5 }[variant] * s * (0.7 + rand() * 0.4);
        if (variant === 'reeds' || variant === 'cattails' || variant === 'yellow-iris') {
          geos.push(place(bladeGeometry(H, variant === 'yellow-iris' ? 0.025 : 0.012, { curl: variant === 'yellow-iris' ? 0.05 : 0.2 + rand() * 0.2, cup: 0.3, color, tipColor: tip, segs: 5, tip: 0.05 }), base, rand() * 6.28, 0, (rand() - 0.5) * 0.25));
        }
        const top = base.clone().add(new V3((rand() - 0.5) * 0.08, H * 1.05, (rand() - 0.5) * 0.08));
        if (variant === 'reeds' && i % 3 === 0) {
          geos.push(paintVertices(sweep([base, top], () => 0.004, { radial: 3, segments: 2 }), () => new THREE.Color(autumn ? '#b89a5a' : '#8a9a52')));
          const pl = blob(0.03, { detail: 1, seed: i, amount: 0.3, scale: [1, 5, 1] });
          pl.rotateZ(0.4);
          pl.translate(top.x + 0.03, top.y + 0.1, top.z);
          geos.push(paintVertices(pl, () => new THREE.Color(autumn ? '#c8b080' : '#8a6a5a')));
        }
        if (variant === 'cattails' && i % 3 === 0) {
          geos.push(paintVertices(sweep([base, top], () => 0.005, { radial: 3, segments: 2 }), () => new THREE.Color('#6a8a3a')));
          const spike = new THREE.CylinderGeometry(0.018 * s, 0.018 * s, 0.18 * s, 10);
          spike.translate(top.x, top.y - 0.12 * s, top.z);
          geos.push(paintVertices(spike, () => new THREE.Color(autumn ? '#8a6a4a' : v.spike)));
          if (autumn) { const fluff = blob(0.035 * s, { detail: 2, seed: i, amount: 0.4, scale: [1, 2.5, 1] }); fluff.translate(top.x, top.y - 0.1 * s, top.z + 0.02); geos.push(paintVertices(fluff, () => new THREE.Color('#e8e0d0'))); }
        }
        if (variant === 'papyrus') {
          geos.push(paintVertices(sweep([base, base.clone().lerp(top, 0.5).add(new V3(0.02, 0, 0)), top], () => 0.008 * s, { radial: 3, segments: 6 }), () => new THREE.Color('#5a8a3a')));
          // firework umbel of thin rays
          for (let k = 0; k < 40; k++) {
            const phi = 0.3 + rand() * 1.1;
            const th = rand() * 6.28;
            const d = new V3(Math.sin(phi) * Math.cos(th), Math.cos(phi) - 0.25, Math.sin(phi) * Math.sin(th)).normalize();
            const en = top.clone().addScaledVector(d, 0.25 * s);
            geos.push(paintVertices(sweep([top, top.clone().addScaledVector(d, 0.12 * s).add(new V3(0, 0.03, 0)), en], () => 0.0015, { radial: 3, segments: 3 }), () => new THREE.Color(autumn ? '#a89a52' : '#7ab84a')));
          }
        }
        if (variant === 'horsetail') {
          // jointed hollow stems with whorls of needle branches
          geos.push(paintVertices(sweep([base, top], () => 0.004, { radial: 5, segments: 6 }), (q) => new THREE.Color(Math.abs(Math.sin(q.y * 60)) > 0.92 ? '#2a3a1a' : color)));
          for (let w = 1; w < 6; w++) {
            const at = base.clone().lerp(top, w / 6);
            for (let k = 0; k < 8; k++) { const d = new V3(Math.cos((k / 8) * 6.28), 0.4, Math.sin((k / 8) * 6.28)).normalize(); geos.push(paintVertices(sweep([at, at.clone().addScaledVector(d, 0.06 * s * (1 - w / 7))], () => 0.0012, { radial: 3, segments: 1 }), () => new THREE.Color(color))); }
          }
        }
        if (variant === 'yellow-iris' && flowers && i % 6 === 0) {
          geos.push(paintVertices(sweep([base, top], () => 0.004, { radial: 4, segments: 2 }), () => new THREE.Color('#4a7a34')));
          const parts = [];
          for (let k = 0; k < 3; k++) { const b = bladeGeometry(0.06, 0.035, { curl: 0.25, cup: 0.3, color: v.flower }); b.rotateX(1.9); b.rotateY((k / 3) * Math.PI * 2); parts.push(b); const st = bladeGeometry(0.04, 0.015, { curl: -0.2, cup: 0.4, color: v.flower }); st.rotateX(0.35); st.rotateY((k / 3) * Math.PI * 2 + 1); parts.push(st); }
          const g = merge(parts);
          g.translate(top.x, top.y, top.z);
          fl.push(g);
        }
      }
    }
  }
  mesh(paintVertices(waterPatch(R, seed), () => new THREE.Color('#3a5a5a')), new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.82, name: 'water' }), { parent: root, name: 'water' });
  mesh(merge(geos), vcMat(0.65, THREE.DoubleSide), { parent: sway, name: 'plants' });
  if (fl.length) mesh(merge(fl), vcMat(0.5, THREE.DoubleSide), { parent: sway, name: 'flowers' });
  const animations = [clip('sway', 3, [rotateTrack(sway, new V3(1, 0, 0.4), 3, (t) => wave(t) * 0.012)])];
  return finalize(root, { type: 'water-plant', variant, options: o, animations });
}

/* ================================ Reef ================================ */

/*
 * Coral reef pieces on a sandy seabed patch: brain coral (meandering grooves),
 * staghorn (branching antlers), sea fan (lacy gorgonian), table coral, tube
 * sponges, anemone (tentacles), kelp (tall fronds with floats), sea grass,
 * pillar coral, mushroom coral.
 */
export const REEF_VARIANTS = {
  'brain-coral': { color: '#c8a85a' },
  staghorn: { color: '#c8906a' },
  'sea-fan': { color: '#a0306a' },
  'table-coral': { color: '#8aa06a' },
  'tube-sponge': { color: '#8a4aa0' },
  anemone: { color: '#e87a5a' },
  kelp: { color: '#6a6a2a' },
  'sea-grass': { color: '#4a7a3a' },
  'pillar-coral': { color: '#c8b48a' },
  'mushroom-coral': { color: '#b88aa0' },
};
export const REEF_TRIMS = Object.fromEntries(Object.keys(REEF_VARIANTS).map((k) => [k, ['small', 'large', 'bleached', 'colony', 'dead']]));

function reefPiece(variant, color, s, rand, seed, state) {
  const out = [];
  const col = (c) => (state === 'bleached' ? new THREE.Color('#f2f0ea') : state === 'dead' ? new THREE.Color('#8a8a7a') : new THREE.Color(c));
  switch (variant) {
    case 'brain-coral': {
      const g = blob(0.4 * s, { detail: 14, seed, amount: 0.12, scale: [1, 0.7, 1] });
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const y = p.getY(i);
        const z = p.getZ(i);
        // meandering grooves: ridged noise
        const m = Math.abs(Math.sin(fbm(x * 6, y * 6, z * 6, seed, 2) * 9));
        const k = 1 - 0.035 * (1 - m);
        p.setXYZ(i, x * k, Math.max(0, y * k + 0.2 * s), z * k);
      }
      g.computeVertexNormals();
      out.push(paintVertices(g, (q) => col(color).multiplyScalar(0.7 + 0.35 * Math.abs(Math.sin(fbm(q.x * 6, q.y * 6, q.z * 6, seed, 2) * 9)))));
      break;
    }
    case 'staghorn':
    case 'pillar-coral': {
      const branch = (start, dir, len, r, depth) => {
        const end = start.clone().addScaledVector(dir, len);
        out.push(paintVertices(sweep([start, start.clone().lerp(end, 0.5).add(new V3((rand() - 0.5) * 0.03, 0, (rand() - 0.5) * 0.03)), end], (t) => r * (1 - t * (variant === 'pillar-coral' ? 0.1 : 0.4)), { radial: 8, segments: 6 }), (q) => col(color).multiplyScalar(0.8 + 0.3 * (q.y / (0.8 * s)))));
        const cap = new THREE.SphereGeometry(r * (variant === 'pillar-coral' ? 0.95 : 0.6), 8, 6);
        cap.translate(end.x, end.y, end.z);
        out.push(paintVertices(cap, () => col(color).multiplyScalar(1.15)));
        if (depth <= 0 || state === 'dead' && depth < 2) return;
        const kids = variant === 'pillar-coral' ? 0 : 2 + (rand() < 0.4 ? 1 : 0);
        for (let k = 0; k < kids; k++) branch(end, dir.clone().add(new V3((rand() - 0.5) * 1.4, 0.35, (rand() - 0.5) * 1.4)).normalize(), len * 0.75, r * 0.72, depth - 1);
      };
      const n = variant === 'pillar-coral' ? 6 : 4;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand();
        const off = variant === 'pillar-coral' ? 0.12 * s : 0.04 * s;
        const d = variant === 'pillar-coral' ? new V3(Math.cos(a) * 0.08, 1, Math.sin(a) * 0.08).normalize() : new V3(Math.cos(a) * 0.6, 1, Math.sin(a) * 0.6).normalize();
        branch(new V3(Math.cos(a) * off, -0.01, Math.sin(a) * off), d, (variant === 'pillar-coral' ? 0.5 + rand() * 0.6 : 0.22) * s, (variant === 'pillar-coral' ? 0.07 : 0.03) * s, variant === 'pillar-coral' ? 0 : 3);
      }
      break;
    }
    case 'sea-fan': {
      // a flat lacy fan: a lattice of thin branches in one plane
      const fanR = 0.6 * s;
      const lines = [];
      for (let k = 0; k < 26; k++) {
        const a = 0.25 + (k / 25) * (Math.PI - 0.5);
        const pts = [new V3(0, 0.05, 0)];
        for (let j = 1; j <= 6; j++) { const r = (j / 6) * fanR; pts.push(new V3(Math.cos(a) * r + (rand() - 0.5) * 0.03, 0.05 + Math.sin(a) * r, (rand() - 0.5) * 0.02)); }
        lines.push(pts);
        out.push(paintVertices(sweep(pts, (t) => (0.012 - t * 0.008) * s, { radial: 4, segments: 8 }), () => col(color)));
      }
      for (let ring = 1; ring < 6; ring++) {
        const pts = lines.map((l) => l[ring]);
        out.push(paintVertices(sweep(pts, () => 0.004 * s, { radial: 3, segments: 40 }), () => col(color).multiplyScalar(0.9)));
      }
      out.push(paintVertices(sweep([new V3(0, -0.01, 0), new V3(0, 0.08, 0)], () => 0.02 * s, { radial: 6, segments: 1 }), () => col(color).multiplyScalar(0.6)));
      break;
    }
    case 'table-coral': {
      const stem = sweep([new V3(0, -0.01, 0), new V3(0, 0.25 * s, 0)], (t) => (0.06 - t * 0.02) * s, { radial: 10, segments: 2 });
      out.push(paintVertices(stem, () => col(color).multiplyScalar(0.7)));
      const plate = new THREE.CylinderGeometry(0.55 * s, 0.45 * s, 0.05 * s, 40, 1);
      const pp = plate.attributes.position;
      for (let i = 0; i < pp.count; i++) { const r = Math.hypot(pp.getX(i), pp.getZ(i)); pp.setY(i, pp.getY(i) + 0.25 * s + r * r * 0.25 + 0.02 * fbm(pp.getX(i) * 10, 0, pp.getZ(i) * 10, seed, 2)); const a = Math.atan2(pp.getZ(i), pp.getX(i)); const k = 1 + 0.12 * fbm(Math.cos(a) * 3, Math.sin(a) * 3, 0, seed, 2); pp.setX(i, pp.getX(i) * k); pp.setZ(i, pp.getZ(i) * k); }
      plate.computeVertexNormals();
      out.push(paintVertices(plate, (q) => col(color).multiplyScalar(0.8 + 0.3 * fbm(q.x * 30, q.y * 30, q.z * 30, seed, 2))));
      break;
    }
    case 'tube-sponge': {
      for (let i = 0; i < 5; i++) {
        const a = rand() * 6.28;
        const off = i ? 0.1 * s : 0;
        const H = (0.35 + rand() * 0.45) * s;
        const R = (0.05 + rand() * 0.03) * s;
        const tube = lathe([[R * 0.8, 0], [R, H * 0.3], [R * 1.1, H * 0.9], [R * 1.15, H], [R * 0.85, H], [R * 0.8, H * 0.2]], 18);
        tube.rotateZ((rand() - 0.5) * 0.3);
        tube.translate(Math.cos(a) * off, 0, Math.sin(a) * off);
        out.push(paintVertices(tube, (q) => (Math.hypot(q.x - Math.cos(a) * off, q.z - Math.sin(a) * off) < R * 0.9 && q.y > H * 0.5 ? new THREE.Color('#2a1a2a') : col(color).multiplyScalar(0.8 + 0.3 * fbm(q.x * 40, q.y * 40, q.z * 40, seed, 2)))));
      }
      break;
    }
    case 'anemone': {
      const base = lathe([[0.001, 0], [0.12 * s, 0], [0.1 * s, 0.1 * s], [0.13 * s, 0.14 * s], [0.001, 0.14 * s]], 20);
      out.push(paintVertices(base, () => col(color).multiplyScalar(0.7)));
      for (let i = 0; i < 70; i++) {
        const a = rand() * 6.28;
        const r = Math.sqrt(rand()) * 0.12 * s;
        const st = new V3(Math.cos(a) * r, 0.14 * s, Math.sin(a) * r);
        const en = st.clone().add(new V3(Math.cos(a) * 0.08 * s, (0.1 + rand() * 0.06) * s, Math.sin(a) * 0.08 * s));
        out.push(paintVertices(sweep([st, st.clone().lerp(en, 0.5).add(new V3(0, 0.02, 0)), en], (t) => 0.008 * s * (1 - t * 0.5), { radial: 4, segments: 4 }), (q) => col(color).lerp(new THREE.Color(state ? '#ffffff' : '#f8d0a0'), Math.max(0, (q.y - 0.14 * s) / (0.15 * s)) * 0.6)));
      }
      break;
    }
    case 'kelp': {
      for (let i = 0; i < 5; i++) {
        const a = rand() * 6.28;
        const base = new V3(Math.cos(a) * 0.08 * s, 0, Math.sin(a) * 0.08 * s);
        const H = (2 + rand() * 1.6) * s;
        const pts = [];
        for (let k = 0; k <= 8; k++) pts.push(base.clone().add(new V3(Math.sin(k * 0.8 + i) * 0.15 * s, (k / 8) * H, Math.cos(k * 0.6) * 0.1 * s)));
        out.push(paintVertices(sweep(pts, () => 0.008 * s, { radial: 4, segments: 24 }), () => col('#5a5a22')));
        const curve = new THREE.CatmullRomCurve3(pts);
        for (let k = 1; k < 14; k++) {
          const at = curve.getPointAt(k / 14);
          const b = bladeGeometry(0.35 * s, 0.06 * s, { curl: 0.3, cup: 0.1, color: col(color).getStyle(), tipColor: col('#8a8a3a').getStyle() });
          b.rotateX(0.9);
          b.rotateY(k * 2.2);
          b.translate(at.x, at.y, at.z);
          out.push(b);
          if (k % 3 === 0) { const fl = new THREE.SphereGeometry(0.018 * s, 6, 5); fl.translate(at.x + 0.02, at.y, at.z); out.push(paintVertices(fl, () => col('#8a7a2a'))); }
        }
        const hold = blob(0.06 * s, { detail: 1, seed: i, amount: 0.4, scale: [1, 0.5, 1] });
        hold.translate(base.x, 0.02, base.z);
        out.push(paintVertices(hold, () => col('#4a3a1a')));
      }
      break;
    }
    case 'sea-grass': {
      for (let i = 0; i < 140; i++) {
        const p = new V3((rand() - 0.5) * 1.0 * s, 0, (rand() - 0.5) * 1.0 * s);
        out.push(place(bladeGeometry((0.3 + rand() * 0.3) * s, 0.012, { curl: 0.3 + rand() * 0.3, cup: 0.2, color: col(color).getStyle(), tipColor: col('#7aa84a').getStyle(), segs: 5, tip: 0.05 }), p, rand() * 6.28, 0, (rand() - 0.5) * 0.4));
      }
      break;
    }
    default: { // mushroom coral: a domed disc with radiating septa
      const g = new THREE.SphereGeometry(0.22 * s, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      g.scale(1, 0.35, 1);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 + 0.03 * Math.abs(Math.sin(a * 40)); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
      g.computeVertexNormals();
      out.push(paintVertices(g, (q) => col(color).multiplyScalar(0.75 + 0.35 * Math.abs(Math.sin(Math.atan2(q.z, q.x) * 40)))));
    }
  }
  return out;
}

export function createReef(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('reef', REEF_VARIANTS, REEF_TRIMS, o.variant, o.trim);
  const v = REEF_VARIANTS[variant];
  const trim = o.trim ?? null;
  const seed = seedOf(o, 61 + variant.length);
  const rand = rng(seed * 29 + 1);
  const root = group(`reef-${variant}${trim ? `-${trim}` : ''}`);
  const sway = group('sway', { parent: root });
  const s = trim === 'small' ? 0.5 : trim === 'large' ? 1.8 : 1;
  const state = trim === 'bleached' || trim === 'dead' ? trim : null;
  const color = o.color ?? v.color;
  const geos = [];
  const spots = [{ x: 0, z: 0, k: 1 }];
  if (trim === 'colony') {
    const others = Object.keys(REEF_VARIANTS).filter((k) => k !== 'kelp' && k !== variant);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + rand(); spots.push({ x: Math.cos(a) * 0.7, z: Math.sin(a) * 0.7, k: 0.45 + rand() * 0.3, kind: i % 2 ? variant : others[Math.floor(rand() * others.length)] }); }
  }
  for (const sp of spots) {
    const kind = sp.kind ?? variant;
    for (const g of reefPiece(kind, sp.kind ? REEF_VARIANTS[kind].color : color, s * sp.k, rand, seed + geos.length, state)) { g.translate(sp.x, 0, sp.z); geos.push(g); }
  }
  if (trim === 'dead') {
    // algae-covered rubble around a dead colony
    for (let i = 0; i < 16; i++) {
      const r = blob((0.03 + rand() * 0.05) * s, { detail: 1, seed: i, amount: 0.4, scale: [1.5, 0.6, 1] });
      const a = rand() * 6.28;
      const d = (0.2 + rand() * 0.5) * s;
      r.translate(Math.cos(a) * d, 0.02, Math.sin(a) * d);
      geos.push(paintVertices(r, () => new THREE.Color('#7a7a5a')));
    }
  }
  // sandy seabed patch
  const bedR = (trim === 'colony' ? 1.3 : 0.7) * Math.max(0.8, s);
  const bed = blob(bedR, { detail: 4, seed, amount: 0.15, freq: 2, scale: [1, 0.05, 1] });
  const bp = bed.attributes.position;
  for (let i = 0; i < bp.count; i++) if (bp.getY(i) < 0) bp.setY(i, 0);
  bed.computeVertexNormals();
  mesh(paintVertices(bed, (q) => new THREE.Color('#d8c8a0').multiplyScalar(0.85 + 0.2 * fbm(q.x * 8, 0, q.z * 8, seed, 2))), vcMat(1), { parent: root, name: 'seabed' });
  mesh(merge(geos), vcMat(0.7, THREE.DoubleSide), { parent: sway, name: 'reef' });
  const amp = variant === 'kelp' || variant === 'sea-grass' || variant === 'sea-fan' || variant === 'anemone' ? 0.04 : 0;
  const animations = amp ? [clip('sway', 4, [rotateTrack(sway, new V3(1, 0, 0.4), 4, (t) => wave(t) * amp)])] : [];
  return finalize(root, { type: 'reef', variant, options: o, animations });
}
