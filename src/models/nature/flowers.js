import * as THREE from 'three';
import { group, mesh, rng, finalize, normalizeOptions, lathe } from '../../core/utils.js';
import { rotateTrack, clip, wave } from '../../core/animation.js';
import { sweep, merge, paintVertices, blob, fbm, bladeGeometry, place, instanced, seedOf, vcMat, checkVariant, snowify, snowMound } from './common.js';

const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0);

/* ================================ Flowers ================================ */

/*
 * One generic flower builder driven by real floral structure:
 *  ring    — rings of petals around a centre (daisy, sunflower, rose, peony…)
 *  cup     — upright cupped tepals (tulip, crocus)
 *  trumpet — 6 tepals + corona tube (daffodil)
 *  lily    — 6 recurved tepals + long stamens
 *  iris    — 3 falls + 3 standards
 *  calla   — one rolled spathe around a spadix
 *  spike   — florets up the stem top (lavender, hyacinth, foxglove)
 *  bells   — nodding bells on an arching stem (bluebell)
 * Leaves: stem (alternate along the stem), strap (basal), sword (iris), rosette (dandelion, foxglove), needle (lavender).
 */
export const FLOWER_VARIANTS = {
  rose: { h: 0.6, n: 4, spread: 0.15, stemR: 0.005, bloom: 'ring', layers: 4, pn: 5, pl: 0.045, pw: 0.042, open: [0.85, 0.12], cup: 0.7, curl: -0.25, shrink: 0.13, color: '#b3122e', leaves: 'stem', leafW: 0.5, thorns: true, sepals: true },
  tulip: { h: 0.42, n: 6, spread: 0.15, stemR: 0.006, bloom: 'cup', pn: 6, pl: 0.075, pw: 0.045, open: [0.2, 0.2], cup: 0.6, curl: -0.1, color: '#e53935', leaves: 'strap' },
  sunflower: { h: 1.7, n: 3, spread: 0.18, stemR: 0.018, bloom: 'ring', layers: 2, pn: 22, pl: 0.11, pw: 0.034, open: [1.5, 1.3], cup: 0.2, curl: 0.05, color: '#f6c200', center: { type: 'disk', r: 0.11, color: '#4a2e14' }, leaves: 'stem', leafW: 0.7, leafL: 0.22, nod: 1.8 },
  daisy: { h: 0.3, n: 22, spread: 0.25, stemR: 0.004, bloom: 'ring', layers: 1, pn: 18, pl: 0.036, pw: 0.009, open: [1.47, 1.47], cup: 0.1, curl: 0.05, color: '#ffffff', center: { type: 'dome', r: 0.013, color: '#f2b705' }, leaves: 'rosette' },
  lavender: { h: 0.55, n: 40, spread: 0.18, stemR: 0.002, bloom: 'spike', floret: 'bud', spikeLen: 0.28, color: '#8a6bbf', leaves: 'needle', fan: 1.8 },
  poppy: { h: 0.55, n: 5, spread: 0.18, stemR: 0.004, bloom: 'ring', layers: 1, pn: 4, pl: 0.06, pw: 0.07, open: [1.0, 1.0], cup: 0.45, curl: 0.0, color: '#d8261c', center: { type: 'pod', r: 0.014, color: '#2a2a1e' }, leaves: 'rosette', hairy: true },
  lily: { h: 0.9, n: 3, spread: 0.12, stemR: 0.007, bloom: 'lily', pn: 6, pl: 0.1, pw: 0.035, color: '#f4f0ea', color2: '#e8a0b0', leaves: 'whorl', heads: 3 },
  iris: { h: 0.7, n: 4, spread: 0.15, stemR: 0.006, bloom: 'iris', pl: 0.075, pw: 0.045, color: '#5a3aa8', color2: '#f2c84a', leaves: 'sword' },
  marigold: { h: 0.35, n: 7, spread: 0.18, stemR: 0.005, bloom: 'ring', layers: 5, pn: 14, pl: 0.028, pw: 0.016, open: [1.45, 0.5], cup: 0.3, curl: 0.1, shrink: 0.12, color: '#f2900e', leaves: 'stem', leafW: 0.35, leafKind: 'pinnate' },
  dandelion: { h: 0.22, n: 6, spread: 0.12, stemR: 0.003, bloom: 'ring', layers: 3, pn: 22, pl: 0.022, pw: 0.004, open: [1.5, 0.8], cup: 0.1, curl: 0.0, shrink: 0.25, color: '#f6d018', leaves: 'rosette', toothed: true },
  cosmos: { h: 0.8, n: 6, spread: 0.2, stemR: 0.004, bloom: 'ring', layers: 1, pn: 8, pl: 0.045, pw: 0.028, open: [1.42, 1.42], cup: 0.12, curl: 0.04, color: '#e85aa8', center: { type: 'dome', r: 0.01, color: '#f2c218' }, leaves: 'stem', leafW: 0.12, leafKind: 'fine', nod: 0.7 },
  peony: { h: 0.65, n: 4, spread: 0.2, stemR: 0.007, bloom: 'ring', layers: 5, pn: 7, pl: 0.065, pw: 0.06, open: [1.2, 0.25], cup: 0.65, curl: -0.15, shrink: 0.12, color: '#f2a6c0', leaves: 'stem', leafW: 0.6, leafKind: 'lobed' },
  bluebell: { h: 0.32, n: 7, spread: 0.12, stemR: 0.003, bloom: 'bells', color: '#4a5ad0', leaves: 'strap' },
  crocus: { h: 0.12, n: 7, spread: 0.12, stemR: 0.004, bloom: 'cup', pn: 6, pl: 0.04, pw: 0.018, open: [0.35, 0.35], cup: 0.5, curl: -0.05, color: '#9a6ad8', center: { type: 'stamens', r: 0.004, color: '#f28a18' }, leaves: 'strap', thinLeaves: true },
  daffodil: { h: 0.42, n: 5, spread: 0.14, stemR: 0.005, bloom: 'trumpet', pn: 6, pl: 0.04, pw: 0.025, color: '#f8e04a', color2: '#f0a020', leaves: 'strap', nod: 1.2 },
  chrysanthemum: { h: 0.55, n: 6, spread: 0.2, stemR: 0.005, bloom: 'ring', layers: 6, pn: 16, pl: 0.035, pw: 0.008, open: [1.5, 0.35], cup: 0.4, curl: 0.15, shrink: 0.11, color: '#e8c24a', leaves: 'stem', leafW: 0.45, leafKind: 'lobed' },
  foxglove: { h: 1.2, n: 3, spread: 0.12, stemR: 0.008, bloom: 'spike', floret: 'tube', spikeLen: 0.55, color: '#c25aa8', leaves: 'rosette', big: true },
  hyacinth: { h: 0.28, n: 3, spread: 0.1, stemR: 0.01, bloom: 'spike', floret: 'star', spikeLen: 0.14, color: '#6a8ae0', leaves: 'strap' },
  calla: { h: 0.6, n: 4, spread: 0.12, stemR: 0.007, bloom: 'calla', color: '#fbfaf6', color2: '#f2d040', leaves: 'arrow' },
  carnation: { h: 0.5, n: 6, spread: 0.15, stemR: 0.003, bloom: 'ring', layers: 4, pn: 9, pl: 0.03, pw: 0.03, open: [1.3, 0.55], cup: 0.25, curl: 0.2, shrink: 0.12, color: '#f04a6a', leaves: 'needle', frilly: true, sepals: true },
};
export const FLOWER_TRIMS = Object.fromEntries(Object.keys(FLOWER_VARIANTS).map((k) => [k, ['bud', 'wilted', 'single', 'patch', 'seedhead', 'snow']]));

const GREEN = '#3f6b2a';
const brown = (c, k = 0.5) => new THREE.Color(c).lerp(new THREE.Color('#7a5a32'), k);

function petalRing(n, len, wid, { color, cup = 0.3, open = 1.0, curl = 0.2, frilly = false, tip = 0.3, twist = 0, color2, offset = 0 }) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const g = bladeGeometry(len, wid, { curl, cup, color, tipColor: color2, tip });
    if (frilly) {
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) if (p.getY(k) > len * 0.6) p.setZ(k, p.getZ(k) + Math.sin(p.getX(k) * 400) * wid * 0.08);
      g.computeVertexNormals();
    }
    if (offset) g.translate(0, offset, 0);
    g.rotateX(open);
    g.rotateY((i / n) * Math.PI * 2 + twist);
    parts.push(g);
  }
  return merge(parts);
}

/** Flower head at the origin, facing +Y. state: null | bud | wilted | seedhead */
function headGeometry(sp, color, state, rand) {
  const parts = [];
  const col = state === 'wilted' ? brown(color, 0.45) : state === 'bud' ? new THREE.Color(color).lerp(new THREE.Color('#6a9a3a'), 0.3) : new THREE.Color(color);
  const openAdd = state === 'wilted' ? 0.6 : 0;
  const bud = state === 'bud';
  const seed = state === 'seedhead';
  switch (sp.bloom) {
    case 'ring': {
      if (!seed) {
        const L = bud ? 2 : sp.layers;
        for (let li = 0; li < L; li++) {
          const t = L > 1 ? li / (L - 1) : 0;
          const open = bud ? 0.12 + li * 0.04 : sp.open[0] + (sp.open[1] - sp.open[0]) * t + openAdd;
          const len = sp.pl * (1 - li * (sp.shrink ?? 0.15)) * (bud ? 0.6 : 1);
          const n = state === 'wilted' ? Math.max(3, Math.round(sp.pn * 0.6)) : sp.pn;
          parts.push(petalRing(n, len, sp.pw * (1 - li * 0.08), { color: col.clone().multiplyScalar(0.88 + li * 0.05), cup: bud ? 0.8 : sp.cup, open, curl: state === 'wilted' ? 0.4 : sp.curl, frilly: sp.frilly, twist: li * 0.6, offset: sp.center && (sp.center.type === 'disk' || sp.center.type === 'dome') ? sp.center.r * 0.85 : 0 }));
        }
      }
      if (sp.center) {
        const c = sp.center;
        if (c.type === 'disk') {
          const R = c.r * (seed ? 1.15 : 1) * (bud ? 0.6 : 1);
          const disk = new THREE.CylinderGeometry(R, R * 0.9, R * 0.35, 36, 1);
          disk.translate(0, R * 0.15, 0);
          // Fibonacci spiral of florets / seeds
          paintVertices(disk, (v) => new THREE.Color(seed ? '#2a1e14' : c.color).multiplyScalar(0.7 + 0.5 * Math.abs(Math.sin(Math.hypot(v.x, v.z) * 160 + Math.atan2(v.z, v.x) * 13))));
          parts.push(disk);
        } else if (c.type === 'dome') {
          const d = new THREE.SphereGeometry(c.r * (seed ? 1.3 : 1), 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
          d.scale(1, 0.6, 1);
          parts.push(paintVertices(d, () => (seed ? new THREE.Color('#7a5a2a') : new THREE.Color(c.color))));
        } else if (c.type === 'pod' || c.type === 'stamens') {
          if (c.type === 'pod' || seed) {
            const pod = lathe([[0.001, 0], [c.r * 0.9, 0.004], [c.r * 1.5, c.r * 1.6], [c.r * 1.2, c.r * 2.6], [c.r * 1.5, c.r * 2.8], [0.001, c.r * 3]], 12);
            pod.scale(seed ? 1.8 : 1, seed ? 1.8 : 1, seed ? 1.8 : 1);
            parts.push(paintVertices(pod, (v) => (seed ? new THREE.Color('#8a8a5a') : v.y > c.r * 2.5 ? new THREE.Color('#2a2a1e') : new THREE.Color('#5a7a3a'))));
          }
          if (!seed) for (let i = 0; i < 18; i++) {
            const a = (i / 18) * Math.PI * 2;
            const st = new THREE.CylinderGeometry(0.0008, 0.0008, 0.02, 3);
            st.translate(0, 0.01, 0);
            st.rotateZ(0.5);
            st.rotateY(a);
            parts.push(paintVertices(st, () => new THREE.Color(c.type === 'pod' ? '#1a1a14' : c.color)));
          }
        }
      } else if (seed) {
        const d = new THREE.SphereGeometry(sp.pl * (sp.bloom === 'ring' && sp.pn > 15 ? 1.3 : 0.5), 12, 10);
        if (sp === FLOWER_VARIANTS.dandelion) {
          // the "clock": a sphere of pappus filaments with fluffy tips
          const fil = [];
          for (let i = 0; i < 90; i++) {
            const phi = Math.acos(1 - (2 * (i + 0.5)) / 90);
            const th = i * 2.39996;
            const d2 = new V3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
            const g = new THREE.CylinderGeometry(0.0006, 0.0006, 0.028, 3);
            g.translate(0, 0.014, 0);
            g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d2));
            fil.push(paintVertices(g, () => new THREE.Color('#f4f4ee')));
            const tuft = new THREE.IcosahedronGeometry(0.003, 0);
            tuft.translate(d2.x * 0.029, d2.y * 0.029, d2.z * 0.029);
            fil.push(paintVertices(tuft, () => new THREE.Color('#ffffff')));
          }
          parts.push(...fil);
        } else {
          d.scale(1, 0.7, 1);
          parts.push(paintVertices(d, () => new THREE.Color('#6a5230')));
        }
      }
      if (sp.sepals) parts.push(petalRing(5, sp.pl * 0.5, sp.pl * 0.22, { color: GREEN, open: bud ? 0.35 : 1.6, cup: 0.2, curl: 0.1 }));
      break;
    }
    case 'cup': {
      if (seed) {
        const pod = lathe([[0.001, 0], [sp.pw * 0.5, 0.01], [sp.pw * 0.65, sp.pl * 0.6], [0.001, sp.pl * 0.9]], 10);
        parts.push(paintVertices(pod, () => new THREE.Color('#7a8a4a')));
      } else {
        parts.push(petalRing(sp.pn, sp.pl * (bud ? 0.8 : 1), sp.pw, { color: col, cup: sp.cup, open: bud ? 0.05 : sp.open[0] + openAdd * 1.4, curl: sp.curl, twist: 0 }));
        if (sp.center?.type === 'stamens' && !bud) for (let i = 0; i < 3; i++) {
          const st = new THREE.CylinderGeometry(0.0015, 0.0015, sp.pl * 0.6, 4);
          st.translate(0, sp.pl * 0.3, 0);
          st.rotateZ(0.12);
          st.rotateY((i / 3) * Math.PI * 2);
          parts.push(paintVertices(st, () => new THREE.Color(sp.center.color)));
        }
      }
      break;
    }
    case 'trumpet': {
      if (seed) {
        parts.push(paintVertices(new THREE.SphereGeometry(0.012, 8, 6).scale(1, 1.5, 1), () => new THREE.Color('#7a8a4a')));
        break;
      }
      if (bud) {
        const b = new THREE.SphereGeometry(0.014, 8, 6);
        b.scale(1, 2.6, 1);
        b.translate(0, 0.03, 0);
        parts.push(paintVertices(b, () => new THREE.Color('#c8c87a')));
        break;
      }
      parts.push(petalRing(sp.pn, sp.pl, sp.pw, { color: col, cup: 0.15, open: 1.45 + openAdd, curl: 0.05 }));
      const corona = lathe([[0.006, 0], [0.012, 0.005], [0.013, 0.025], [0.018, 0.033], [0.017, 0.035]], 18);
      parts.push(paintVertices(corona, () => (state === 'wilted' ? brown(sp.color2, 0.4) : new THREE.Color(sp.color2))));
      break;
    }
    case 'lily': {
      if (seed) {
        parts.push(paintVertices(lathe([[0.001, 0], [0.012, 0.01], [0.014, 0.04], [0.001, 0.055]], 6), () => new THREE.Color('#6a7a3a')));
        break;
      }
      if (bud) {
        const b = new THREE.SphereGeometry(0.015, 10, 6);
        b.scale(1, 4, 1);
        b.translate(0, 0.055, 0);
        parts.push(paintVertices(b, (v) => new THREE.Color(GREEN).lerp(col, Math.min(1, v.y / 0.1))));
        break;
      }
      parts.push(petalRing(sp.pn, sp.pl, sp.pw, { color: new THREE.Color(sp.color2).lerp(col, 0.0), color2: col, cup: 0.25, open: 1.05 + openAdd, curl: 0.55 }));
      for (let i = 0; i < 6; i++) {
        const st = new THREE.CylinderGeometry(0.0012, 0.0012, 0.07, 4);
        st.translate(0, 0.035, 0);
        st.rotateZ(0.45);
        st.rotateY((i / 6) * Math.PI * 2);
        parts.push(paintVertices(st, () => new THREE.Color('#d8e0a0')));
        const an = new THREE.SphereGeometry(0.004, 6, 4).scale(1, 0.5, 2);
        an.translate(Math.sin(0.45) * 0.07, Math.cos(0.45) * 0.07, 0);
        an.rotateY((i / 6) * Math.PI * 2);
        parts.push(paintVertices(an, () => new THREE.Color('#8a3a1a')));
      }
      break;
    }
    case 'iris': {
      if (seed) {
        parts.push(paintVertices(new THREE.SphereGeometry(0.014, 8, 6).scale(1, 2, 1), () => new THREE.Color('#6a7a3a')));
        break;
      }
      if (bud) {
        const b = new THREE.SphereGeometry(0.014, 8, 6);
        b.scale(1, 3.4, 1);
        b.translate(0, 0.04, 0);
        parts.push(paintVertices(b, () => col.clone()));
        break;
      }
      // 3 standards up, 3 falls drooping with a yellow beard
      parts.push(petalRing(3, sp.pl, sp.pw, { color: col, cup: 0.6, open: 0.35 + openAdd * 0.5, curl: -0.3 }));
      parts.push(petalRing(3, sp.pl * 1.1, sp.pw * 1.1, { color: col.clone().multiplyScalar(0.85), color2: col, cup: 0.3, open: 1.95 + openAdd * 0.3, curl: 0.25, twist: Math.PI / 3 }));
      for (let i = 0; i < 3; i++) {
        const be = new THREE.CylinderGeometry(0.003, 0.003, 0.03, 4);
        be.translate(0, 0.015, 0);
        be.rotateX(1.7);
        be.rotateY((i / 3) * Math.PI * 2 + Math.PI / 3);
        parts.push(paintVertices(be, () => new THREE.Color(sp.color2)));
      }
      break;
    }
    case 'calla': {
      if (seed) {
        parts.push(paintVertices(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6).translate(0, 0.03, 0), () => new THREE.Color('#5a8a3a')));
        break;
      }
      // spathe: a rolled funnel with an open flared lip
      const segs = 18;
      const pos = [];
      const colA = [];
      const idx = [];
      const H = bud ? 0.07 : 0.11;
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const r = 0.008 + t * t * (bud ? 0.012 : 0.04);
        for (let j = 0; j <= segs; j++) {
          const a = (j / segs) * Math.PI * (bud ? 2 : 1.75) - Math.PI * 0.2;
          const lip = t > 0.7 && !bud ? (t - 0.7) * 0.06 : 0;
          pos.push(Math.cos(a) * (r + lip), t * H + (Math.sin(a) > 0.6 ? lip * 1.5 : 0), Math.sin(a) * (r + lip));
          const cc = new THREE.Color(GREEN).lerp(col, Math.min(1, t * 3));
          colA.push(cc.r, cc.g, cc.b);
        }
      }
      for (let i = 0; i < 10; i++) for (let j = 0; j < segs; j++) {
        const a = i * (segs + 1) + j;
        idx.push(a, a + segs + 1, a + 1, a + 1, a + segs + 1, a + segs + 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      parts.push(g);
      parts.push(paintVertices(new THREE.CylinderGeometry(0.004, 0.005, 0.06, 6).translate(0, 0.04, 0), () => new THREE.Color(sp.color2)));
      break;
    }
    default:
      break;
  }
  return merge(parts);
}

/** Florets along the top of a stem curve (spike/bells). Returns geometry in world space. */
function spikeFlorets(sp, curve, color, state, rand) {
  const parts = [];
  const col = state === 'wilted' ? brown(color, 0.45) : state === 'bud' ? new THREE.Color(color).lerp(new THREE.Color('#6a9a3a'), 0.4) : new THREE.Color(color);
  const seed = state === 'seedhead';
  if (sp.bloom === 'bells') {
    for (let i = 0; i < 7; i++) {
      const t = 0.62 + i * 0.055;
      const at = curve.getPointAt(Math.min(1, t));
      const bell = seed ? new THREE.SphereGeometry(0.005, 6, 4) : lathe([[0.001, 0], [0.005, 0.002], [0.007, 0.012], [0.009, 0.018], [0.0105, 0.02]], 10);
      bell.rotateX(Math.PI); // hang open side down
      bell.translate(0.008, -0.004, 0);
      bell.translate(at.x, at.y, at.z);
      parts.push(paintVertices(bell, () => (seed ? new THREE.Color('#7a8a4a') : col.clone().multiplyScalar(0.9 + rand() * 0.2))));
    }
    return merge(parts);
  }
  const len = sp.spikeLen * (state === 'bud' ? 0.7 : 1);
  const count = sp.floret === 'tube' ? 22 : sp.floret === 'star' ? 46 : 18;
  for (let i = 0; i < count; i++) {
    const tt = 1 - (len / curve.getLength()) * (i / count);
    const at = curve.getPointAt(Math.max(0, Math.min(1, tt)));
    const a = i * 2.39996;
    const sc = (sp.floret === 'tube' ? 1 - (i / count) * -0.0 : 1) * (state === 'bud' ? 0.6 : 1);
    let g;
    if (seed) {
      g = new THREE.SphereGeometry(sp.floret === 'tube' ? 0.008 : 0.004, 6, 4);
      g.translate(Math.cos(a) * 0.006, 0, Math.sin(a) * 0.006);
      g.translate(at.x, at.y, at.z);
      parts.push(paintVertices(g, () => new THREE.Color('#7a6a3a')));
      continue;
    }
    if (sp.floret === 'tube') {
      // foxglove: downward-facing tubular bells on one side, largest at the bottom
      const s = (0.7 + 0.6 * (i / count)) * sc;
      g = lathe([[0.001, 0], [0.006 * s, 0.003], [0.01 * s, 0.03 * s], [0.014 * s, 0.042 * s], [0.0145 * s, 0.045 * s]], 10);
      g.rotateZ(-1.9);
      g.rotateY(a * 0.25 + 0.4);
      g.translate(at.x, at.y, at.z);
      parts.push(paintVertices(g, (v) => col.clone().multiplyScalar(0.85 + 0.25 * fbm(v.x * 300, v.y * 300, v.z * 300, i, 1))));
    } else if (sp.floret === 'star') {
      g = petalRing(6, 0.011 * sc, 0.006 * sc, { color: col, cup: 0.3, open: 1.2, curl: 0.2 });
      const d = new V3(Math.cos(a), 0.2, Math.sin(a)).normalize();
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d));
      g.translate(at.x + d.x * 0.009, at.y, at.z + d.z * 0.009);
      parts.push(g);
    } else {
      g = new THREE.SphereGeometry(0.0055 * sc, 6, 4);
      g.scale(1, 1.6, 1);
      g.translate(Math.cos(a) * 0.004, 0, Math.sin(a) * 0.004);
      g.translate(at.x, at.y, at.z);
      parts.push(paintVertices(g, () => col.clone().multiplyScalar(0.8 + rand() * 0.35)));
    }
  }
  return merge(parts);
}

function leavesFor(sp, base, top, h, a, rand, state, green) {
  const out = [];
  const lc = state === 'wilted' ? '#7a7a3a' : green;
  const tc = state === 'wilted' ? '#9a8a4a' : '#5a8a3a';
  const lf = (pos, yaw, len, wid, pitch = 0.9 + rand() * 0.4, curl = 0.35) => out.push(place(bladeGeometry(len, wid, { curl, cup: 0.25, color: lc, tipColor: tc }), pos, yaw, pitch, 0));
  switch (sp.leaves) {
    case 'stem': {
      const n = sp === FLOWER_VARIANTS.sunflower ? 5 : 3;
      for (let k = 0; k < n; k++) {
        const t = 0.2 + k * (0.6 / n);
        lf(base.clone().lerp(top, t), rand() * 6.28, sp.leafL ?? Math.min(0.12, h * 0.25), (sp.leafL ?? Math.min(0.12, h * 0.25)) * (sp.leafW ?? 0.5));
      }
      break;
    }
    case 'strap':
      for (let k = 0; k < (sp.thinLeaves ? 4 : 2); k++) lf(base, a + k * Math.PI + rand() * 0.4, h * (sp.thinLeaves ? 1.1 : 0.75), sp.thinLeaves ? 0.004 : Math.max(0.012, h * 0.1), 0.35 + rand() * 0.3, 0.25);
      break;
    case 'sword':
      for (let k = 0; k < 3; k++) lf(base, a + k * 0.4 - 0.4, h * 0.85, 0.02, 0.12 + rand() * 0.1, 0.05);
      break;
    case 'rosette':
      for (let k = 0; k < (sp.big ? 7 : 6); k++) lf(base, a + (k / 6) * Math.PI * 2, sp.big ? 0.22 : h * 0.4, sp.big ? 0.07 : h * 0.09, 1.25 + rand() * 0.2, 0.15);
      break;
    case 'needle':
      for (let k = 0; k < 4; k++) lf(base.clone().lerp(top, 0.05 + k * 0.08), a + k * 1.7, 0.07, 0.006, 1.0, 0.2);
      break;
    case 'whorl':
      for (let w = 0; w < 4; w++) for (let k = 0; k < 4; k++) lf(base.clone().lerp(top, 0.2 + w * 0.15), (k / 4) * Math.PI * 2 + w, 0.09, 0.012, 1.0, 0.3);
      break;
    case 'arrow':
      for (let k = 0; k < 3; k++) {
        const pet = base.clone().add(new V3(Math.cos(a + k * 2.1) * 0.06, h * 0.45, Math.sin(a + k * 2.1) * 0.06));
        out.push(paintVertices(sweep([base, base.clone().lerp(pet, 0.5), pet], () => 0.004, { radial: 4, segments: 4 }), () => new THREE.Color(lc)));
        lf(pet, a + k * 2.1, 0.17, 0.08, 1.2, 0.2);
      }
      break;
    default:
      break;
  }
  return out;
}

export function createFlower(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('flower', FLOWER_VARIANTS, FLOWER_TRIMS, o.variant, o.trim);
  const sp = FLOWER_VARIANTS[variant];
  const trim = o.trim ?? null;
  const state = ['bud', 'wilted', 'seedhead'].includes(trim) ? trim : null;
  const color = o.color ?? sp.color;
  const seed = seedOf(o, 4 + variant.length);
  const rand = rng(seed * 97 + 13);
  const root = group(`flower-${variant}${trim ? `-${trim}` : ''}`);
  const sway = group('sway', { parent: root });
  const green = [];
  const blooms = [];
  const count = trim === 'single' ? 1 : trim === 'patch' ? sp.n * 3 : sp.n;
  const spread = sp.spread * (trim === 'patch' ? 2.6 : 1);
  const heads = trim === 'single' ? 1 : sp.heads ?? 1;
  for (let i = 0; i < count; i++) {
    const a = rand() * 6.28;
    const rr = i === 0 && count < 6 ? 0 : Math.sqrt(rand()) * spread;
    const base = new V3(Math.cos(a) * rr, 0, Math.sin(a) * rr);
    const h = sp.h * (0.8 + rand() * 0.4) * (state === 'bud' ? 0.85 : 1);
    const fan = sp.fan ?? 0.4;
    let top = base.clone().add(new V3((rand() - 0.5) * 0.06 + base.x * fan, h, (rand() - 0.5) * 0.06 + base.z * fan));
    let mid = base.clone().lerp(top, 0.5).add(new V3((rand() - 0.5) * 0.04, 0, (rand() - 0.5) * 0.04));
    if (state === 'wilted' || sp.bloom === 'bells') {
      // stem arches over: the head droops below the top of the arc
      const out = new V3(Math.cos(a + 0.8), 0, Math.sin(a + 0.8));
      mid = base.clone().add(new V3(0, h * 0.75, 0)).addScaledVector(out, h * 0.12);
      top = base.clone().addScaledVector(out, h * (state === 'wilted' ? 0.38 : 0.25)).add(new V3(0, h * (state === 'wilted' ? 0.55 : 0.82), 0));
    }
    const pts = [base, mid, top];
    green.push(paintVertices(sweep(pts, (t) => sp.stemR * (1 - t * 0.3), { radial: 5, segments: 10 }), () => new THREE.Color(state === 'wilted' ? '#6a6a32' : '#3f6b2a')));
    green.push(...leavesFor(sp, base, top, h, a, rand, state, '#3f6b2a'));
    const curve = new THREE.CatmullRomCurve3(pts);
    if (sp.bloom === 'spike' || sp.bloom === 'bells') {
      blooms.push(spikeFlorets(sp, curve, color, state, rand));
      continue;
    }
    for (let hh = 0; hh < heads; hh++) {
      // lilies carry several heads on short pedicels
      let at = top;
      let dir = curve.getTangentAt(1).clone();
      if (hh > 0) {
        const t = 0.82 - hh * 0.06;
        const p0 = curve.getPointAt(t);
        const ang = a + hh * 2.1;
        at = p0.clone().add(new V3(Math.cos(ang) * 0.06, 0.03, Math.sin(ang) * 0.06));
        green.push(paintVertices(sweep([p0, at], () => sp.stemR * 0.6, { radial: 4, segments: 2 }), () => new THREE.Color('#3f6b2a')));
        dir = at.clone().sub(p0).normalize();
      }
      const nod = (sp.nod ?? 0.15) + (sp.bloom === 'lily' ? 0.9 : 0);
      const side = new V3(Math.cos(a), 0, Math.sin(a));
      dir.lerp(side, Math.min(0.9, nod * 0.5)).normalize();
      if (state === 'wilted') dir.set(side.x, -0.8, side.z).normalize();
      const g = headGeometry(sp, color, state, rand);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir));
      g.translate(at.x, at.y, at.z);
      blooms.push(g);
    }
  }
  const stemGeo = merge(green);
  if (trim === 'snow') snowify(stemGeo, 0.7, { seed });
  mesh(stemGeo, vcMat(0.7, THREE.DoubleSide), { parent: sway, name: 'stems' });
  if (blooms.length) {
    const bg = merge(blooms);
    if (trim === 'snow') snowify(bg, 0.6, { seed, threshold: 0.4 });
    mesh(bg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide, name: 'petals' }), { parent: sway, name: 'blooms' });
  }
  if (trim === 'snow') mesh(snowMound(spread + 0.12, seed), vcMat(0.85), { parent: root, name: 'snow' });
  const animations = [clip('sway', 2.5, [rotateTrack(sway, new V3(1, 0, 0.5), 2.5, (t) => wave(t) * (sp.h > 1 ? 0.025 : 0.05))])];
  return finalize(root, { type: 'flower', variant, options: o, animations });
}

/* ================================ Grass ================================ */

export const GRASS_VARIANTS = {
  clump: { blades: 90, radius: 0.12, height: 0.35, color: '#4f7f2c', tip: '#a7c46a' },
  tall: { blades: 70, radius: 0.18, height: 1.1, color: '#6f7f3a', tip: '#cbbf7a', plumes: 'seed' },
  patch: { blades: 700, radius: 0.5, height: 0.18, color: '#3f7428', tip: '#93bf55', square: true },
  pampas: { blades: 160, radius: 0.35, height: 1.4, color: '#7a8a52', tip: '#b8b884', plumes: 'pampas', arch: 0.7 },
  fountain: { blades: 140, radius: 0.15, height: 0.8, color: '#5a7a3a', tip: '#a8a06a', arch: 1.1, plumes: 'foxtail' },
  'blue-fescue': { blades: 120, radius: 0.08, height: 0.25, color: '#7a9aa8', tip: '#a8c0c8', needle: true },
  mondo: { blades: 80, radius: 0.1, height: 0.2, color: '#1e2a1e', tip: '#2e3a2a', arch: 0.9 },
  clover: { blades: 0, radius: 0.35, height: 0.08, color: '#3f7a2e', tip: '#5a9a3a', clover: true, square: true },
  moss: { blades: 0, radius: 0.35, height: 0.05, color: '#4a6a24', tip: '#6a8a32', moss: true },
  lawn: { blades: 1400, radius: 0.5, height: 0.07, color: '#3a7a2a', tip: '#6aa844', square: true, straight: true },
  meadow: { blades: 600, radius: 0.6, height: 0.45, color: '#5a8a32', tip: '#b0c070', square: true, wildflowers: true, plumes: 'seed' },
  dune: { blades: 110, radius: 0.22, height: 0.7, color: '#8a9a5a', tip: '#c8c08a', arch: 0.6, sand: true },
};
export const GRASS_TRIMS = Object.fromEntries(Object.keys(GRASS_VARIANTS).map((k) => [k, ['dry', 'lush', 'snow', 'seeding', 'short', 'tall', 'sparse']]));

export function createGrass(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('grass', GRASS_VARIANTS, GRASS_TRIMS, o.variant, o.trim);
  const v = GRASS_VARIANTS[variant];
  const trim = o.trim ?? null;
  const seed = seedOf(o, 6 + variant.length);
  const rand = rng(seed * 7 + 2);
  const root = group(`grass-${variant}${trim ? `-${trim}` : ''}`);
  const sway = group('sway', { parent: root });
  let color = o.color ?? v.color;
  let tip = v.tip;
  if (trim === 'dry') { color = '#a8945a'; tip = '#d8c890'; }
  if (trim === 'lush') { color = new THREE.Color(color).lerp(new THREE.Color('#2a8a2a'), 0.35).getStyle(); tip = '#8ad050'; }
  const hK = trim === 'short' ? 0.5 : trim === 'tall' ? 1.6 : trim === 'lush' ? 1.15 : 1;
  const nK = trim === 'sparse' ? 0.35 : trim === 'lush' ? 1.4 : 1;
  const blades = [];
  if (v.clover) {
    // trefoil leaves on short stalks
    const n = Math.round(260 * nK);
    for (let i = 0; i < n; i++) {
      const pos = new V3((rand() - 0.5) * v.radius * 2, 0, (rand() - 0.5) * v.radius * 2);
      const h = v.height * (0.5 + rand() * 0.8) * hK;
      blades.push(paintVertices(sweep([pos, pos.clone().add(new V3(0, h, 0))], () => 0.0015, { radial: 3, segments: 1 }), () => new THREE.Color('#4a7a30')));
      for (let k = 0; k < 3; k++) {
        const lf = new THREE.CircleGeometry(0.011, 8);
        lf.scale(1, 1.2, 1);
        lf.translate(0, 0.012, 0);
        lf.rotateX(-Math.PI / 2 + 0.25);
        lf.rotateY((k / 3) * Math.PI * 2 + i);
        lf.translate(pos.x, pos.y + h, pos.z);
        blades.push(paintVertices(lf, (vv) => new THREE.Color(color).lerp(new THREE.Color('#d8e8c0'), Math.abs(Math.hypot(vv.x - pos.x, vv.z - pos.z) - 0.012) < 0.003 ? 0.4 : 0)));
      }
      if ((trim === 'seeding' || trim === 'lush') && rand() < 0.08) {
        const fl = new THREE.SphereGeometry(0.012, 8, 6);
        fl.translate(pos.x, pos.y + h + 0.03, pos.z);
        blades.push(paintVertices(fl, () => new THREE.Color('#f0e8f0')));
        blades.push(paintVertices(sweep([pos, pos.clone().add(new V3(0, h + 0.03, 0))], () => 0.0012, { radial: 3, segments: 1 }), () => new THREE.Color('#4a7a30')));
      }
    }
  } else if (v.moss) {
    // low cushions with fine fuzz
    for (let i = 0; i < 9; i++) {
      const g = blob(0.12 + rand() * 0.1, { detail: 3, seed: seed + i, amount: 0.35, freq: 4, scale: [1, 0.35 * hK, 1] });
      const a = rand() * 6.28;
      const r = Math.sqrt(rand()) * v.radius;
      g.translate(Math.cos(a) * r, 0, Math.sin(a) * r);
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) if (p.getY(k) < 0) p.setY(k, 0);
      g.computeVertexNormals();
      blades.push(paintVertices(g, (vv, n) => new THREE.Color(color).lerp(new THREE.Color(tip), 0.4 * Math.max(0, n.y)).multiplyScalar(0.7 + 0.4 * fbm(vv.x * 40, vv.y * 40, vv.z * 40, seed, 2))));
    }
    if (trim === 'seeding') {
      for (let i = 0; i < 60; i++) {
        const pos = new V3((rand() - 0.5) * v.radius * 1.4, 0.03, (rand() - 0.5) * v.radius * 1.4);
        blades.push(paintVertices(sweep([pos, pos.clone().add(new V3(0, 0.04, 0))], () => 0.0008, { radial: 3, segments: 1 }), () => new THREE.Color('#a86a2a')));
        const cap = new THREE.SphereGeometry(0.003, 5, 4).scale(1, 2, 1).translate(pos.x, pos.y + 0.045, pos.z);
        blades.push(paintVertices(cap, () => new THREE.Color('#7a4a1a')));
      }
    }
  } else {
    const count = Math.round(v.blades * nK);
    for (let i = 0; i < count; i++) {
      const a = rand() * 6.28;
      const rr = v.square ? 0 : Math.sqrt(rand()) * v.radius;
      const pos = v.square ? new V3((rand() - 0.5) * v.radius * 2, 0, (rand() - 0.5) * v.radius * 2) : new V3(Math.cos(a) * rr, 0, Math.sin(a) * rr);
      const h = v.height * hK * (0.6 + rand() * 0.6);
      const wid = v.needle ? 0.0025 : 0.006 + rand() * 0.008;
      const curl = v.straight ? 0.05 + rand() * 0.1 : (v.arch ?? 0.25) * (0.7 + rand() * 0.6) + (trim === 'dry' ? 0.3 : 0);
      const g = bladeGeometry(h, wid, { curl, cup: 0.3, color, tipColor: tip, segs: v.straight ? 2 : 4, tip: 0.05 });
      const lean = v.square ? rand() * (v.straight ? 0.2 : 0.5) : 0.15 + (rr / v.radius) * 0.6;
      blades.push(place(g, pos, v.square ? rand() * 6.28 : a + Math.PI / 2 + (rand() - 0.5) * 0.4, 0, -lean * 0.3));
    }
  }
  const bladeGeo = merge(blades);
  if (trim === 'snow') snowify(bladeGeo, 1, { seed, threshold: 0.1 });
  mesh(bladeGeo, vcMat(0.8, THREE.DoubleSide), { parent: sway, name: 'blades' });
  const plumes = v.plumes ?? (trim === 'seeding' && !v.clover && !v.moss ? 'seed' : null);
  if (plumes && trim !== 'short') {
    const geos = [];
    const n = plumes === 'pampas' ? 14 : plumes === 'foxtail' ? 18 : Math.round((v.square ? 26 : 8) * (trim === 'seeding' ? 2 : 1) * nK);
    for (let i = 0; i < n; i++) {
      const a = rand() * 6.28;
      const r0 = v.square ? Math.sqrt(rand()) * v.radius : 0.05;
      const base = new V3(Math.cos(a) * r0, 0, Math.sin(a) * r0);
      const out = v.square ? 0.05 : plumes === 'pampas' ? 0.25 : 0.3;
      const top = new V3(Math.cos(a) * (r0 + out), v.height * hK * (plumes === 'pampas' ? 1.5 : 1.2) + rand() * 0.2, Math.sin(a) * (r0 + out));
      if (plumes === 'foxtail') top.y -= v.height * 0.25;
      geos.push(paintVertices(sweep([base, base.clone().lerp(top, 0.6).add(new V3(0, 0.05, 0)), top], () => 0.003, { radial: 3, segments: 6 }), () => new THREE.Color(trim === 'dry' ? '#b8a46a' : '#7a8a52')));
      const pl = plumes === 'pampas' ? blob(0.07, { detail: 2, seed: i, amount: 0.3, scale: [1, 4.5, 1] }) : plumes === 'foxtail' ? blob(0.025, { detail: 1, seed: i, amount: 0.3, scale: [1, 5, 1] }) : blob(0.018, { detail: 1, seed: i, amount: 0.3, scale: [1, 4, 1] });
      const ph = plumes === 'pampas' ? 0.3 : plumes === 'foxtail' ? 0.12 : 0.07;
      const dir = top.clone().sub(base).normalize();
      pl.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir));
      pl.translate(top.x + dir.x * ph * 0.5, top.y + dir.y * ph * 0.5, top.z + dir.z * ph * 0.5);
      geos.push(paintVertices(pl, (vv) => new THREE.Color(plumes === 'pampas' ? '#efe6d0' : plumes === 'foxtail' ? '#d8c8a8' : '#d8c8a0').multiplyScalar(0.85 + 0.2 * fbm(vv.x * 40, vv.y * 40, vv.z * 40, seed, 2))));
    }
    mesh(merge(geos), vcMat(0.9), { parent: sway, name: 'plumes' });
  }
  if (v.wildflowers && trim !== 'snow' && trim !== 'dry') {
    const items = [];
    for (let i = 0; i < Math.round(60 * nK); i++) {
      const p = new V3((rand() - 0.5) * v.radius * 1.9, v.height * hK * (0.7 + rand() * 0.4), (rand() - 0.5) * v.radius * 1.9);
      items.push({ p, c: ['#f4f0e8', '#f2c418', '#c83a8a', '#5a6ad8', '#e8402a'][Math.floor(rand() * 5)] });
    }
    const stems = items.map((it) => paintVertices(sweep([new V3(it.p.x, 0, it.p.z), it.p.clone()], () => 0.0015, { radial: 3, segments: 1 }), () => new THREE.Color('#4a7a2a')));
    mesh(merge(stems), vcMat(0.8), { parent: sway, name: 'flower_stems' });
    sway.add(instanced(new THREE.IcosahedronGeometry(0.013, 0), new THREE.MeshStandardMaterial({ roughness: 0.6, color: '#ffffff' }), items, 'wildflowers'));
  }
  if (v.sand) {
    const g = blob(v.radius * 1.6, { detail: 3, seed, amount: 0.2, freq: 2, scale: [1, 0.12, 1] });
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) if (p.getY(k) < 0) p.setY(k, 0);
    g.computeVertexNormals();
    mesh(paintVertices(g, (vv) => new THREE.Color('#d8c49a').multiplyScalar(0.9 + 0.12 * fbm(vv.x * 10, 0, vv.z * 10, seed, 2))), vcMat(0.95), { parent: root, name: 'sand' });
  }
  if (trim === 'snow') mesh(snowMound(Math.max(0.25, v.radius * 1.1), seed), vcMat(0.85), { parent: root, name: 'snow' });
  const animations = [clip('sway', 2.2, [rotateTrack(sway, new V3(1, 0, 0.4), 2.2, (t) => wave(t) * (v.moss ? 0.0 : 0.04))])];
  return finalize(root, { type: 'grass', variant, options: o, animations });
}
