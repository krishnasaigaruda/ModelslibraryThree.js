import * as THREE from 'three';
import { group, mesh, rng, finalize, normalizeOptions, lathe } from '../../core/utils.js';
import { rotateTrack, clip, wave } from '../../core/animation.js';
import { sweep, merge, paintVertices, blob, fbm, bladeGeometry, place, seedOf, vcMat, checkVariant, instanced } from './common.js';

const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0);

/*
 * Crop beds: rows of real crop plants on ridged soil. Each crop follows its
 * growth habit (corn stalks with tassels and husked ears, wheat with awned
 * heads, pumpkin vines, cabbage heads, staked tomatoes, rice in a flooded paddy…).
 * Trims are growth stages: seedling, young, harvest (stubble / picked), row, withered.
 */
export const CROP_VARIANTS = {
  corn: { rows: 3, per: 6, gapX: 0.3, gapZ: 0.75 },
  wheat: { rows: 1, per: 1, dense: true },
  sunflower: { rows: 2, per: 5, gapX: 0.4, gapZ: 0.8 },
  pumpkin: { rows: 1, per: 3, gapX: 0.9, gapZ: 0 },
  cabbage: { rows: 3, per: 5, gapX: 0.42, gapZ: 0.55 },
  lettuce: { rows: 3, per: 6, gapX: 0.3, gapZ: 0.4 },
  tomato: { rows: 2, per: 4, gapX: 0.6, gapZ: 0.8 },
  carrot: { rows: 4, per: 9, gapX: 0.12, gapZ: 0.3 },
  strawberry: { rows: 2, per: 6, gapX: 0.3, gapZ: 0.5 },
  potato: { rows: 3, per: 4, gapX: 0.45, gapZ: 0.7 },
  cotton: { rows: 2, per: 5, gapX: 0.45, gapZ: 0.8 },
  rice: { rows: 4, per: 7, gapX: 0.25, gapZ: 0.28, paddy: true },
};
export const CROP_TRIMS = Object.fromEntries(Object.keys(CROP_VARIANTS).map((k) => [k, ['seedling', 'young', 'harvest', 'row', 'withered']]));

const G0 = '#3f7a2a';
const G1 = '#6aa840';
const DRYC = '#9a8448';

function leaf(len, wid, pos, yaw, pitch, color, tip, curl = 0.35) {
  return place(bladeGeometry(len, wid, { curl, cup: 0.3, color, tipColor: tip }), pos, yaw, pitch, 0);
}
function stalk(a, b, r, color, bend = new V3()) {
  return paintVertices(sweep([a, a.clone().lerp(b, 0.5).add(bend), b], (t) => r * (1 - t * 0.3), { radial: 6, segments: 8 }), () => new THREE.Color(color));
}

/** One plant at `p`. stage: 0 seedling, 1 young, 2 mature, 3 harvested, 4 withered. Returns geometries. */
function plant(kind, p, stage, rand, cfg) {
  const out = [];
  const green = stage === 4 ? DRYC : G0;
  const tip = stage === 4 ? '#b8a060' : G1;
  if (stage === 0) {
    // seedling: two to four cotyledon / first leaves
    const n = kind === 'corn' || kind === 'wheat' || kind === 'rice' ? 3 : 2;
    for (let i = 0; i < n; i++) out.push(leaf(kind === 'corn' || kind === 'rice' || kind === 'wheat' ? 0.09 : 0.035, kind === 'corn' ? 0.012 : 0.02, p, (i / n) * Math.PI * 2 + rand(), kind === 'corn' || kind === 'wheat' || kind === 'rice' ? 0.35 : 1.1, G0, G1, 0.2));
    out.push(stalk(p, p.clone().add(new V3(0, 0.03, 0)), 0.003, G0));
    return out;
  }
  const k = stage === 1 ? 0.5 : 1;
  switch (kind) {
    case 'corn': {
      const H = (stage === 3 ? 0.5 : 2.1 * k) * (0.9 + rand() * 0.2);
      const top = p.clone().add(new V3((rand() - 0.5) * 0.05, H, (rand() - 0.5) * 0.05));
      out.push(stalk(p, top, 0.022, stage >= 3 ? DRYC : '#5a8a32'));
      if (stage === 3) break; // cut stalk = stubble
      for (let i = 0; i < 9; i++) out.push(leaf(0.75 * k, 0.05, p.clone().lerp(top, 0.12 + i * 0.09), i * 2.6 + rand() * 0.4, 0.75 + rand() * 0.25, green, tip, 0.5));
      if (stage === 2 || stage === 4) {
        for (let i = 0; i < 9; i++) out.push(paintVertices(sweep([top, top.clone().add(new V3(Math.cos(i * 0.7) * 0.12, 0.18, Math.sin(i * 0.7) * 0.12))], () => 0.003, { radial: 3, segments: 2 }), () => new THREE.Color(stage === 4 ? '#a8905a' : '#c8b46a')));
        const ear = new THREE.SphereGeometry(0.035, 10, 8);
        ear.scale(1, 3.4, 1);
        ear.rotateZ(0.35);
        const ep = p.clone().lerp(top, 0.5).add(new V3(0.05, 0, 0));
        ear.translate(ep.x, ep.y, ep.z);
        out.push(paintVertices(ear, (v) => new THREE.Color(stage === 4 ? '#a89a5a' : '#8aac52').lerp(new THREE.Color('#d8c48a'), Math.max(0, (v.y - ep.y) / 0.12))));
        out.push(paintVertices(sweep([ep.clone().add(new V3(0.04, 0.11, 0)), ep.clone().add(new V3(0.06, 0.16, 0.01))], () => 0.006, { radial: 3, segments: 2 }), () => new THREE.Color('#8a5a2a')));
      }
      break;
    }
    case 'sunflower': {
      const H = (stage === 3 ? 0.6 : 1.8 * k) * (0.9 + rand() * 0.2);
      const top = p.clone().add(new V3(0, H, 0));
      out.push(stalk(p, top, 0.02, stage >= 3 ? DRYC : '#4a7a2a'));
      if (stage === 3) break;
      for (let i = 0; i < 6; i++) out.push(leaf(0.22 * k, 0.15 * k, p.clone().lerp(top, 0.2 + i * 0.12), i * 2.4, 1.0, green, tip, 0.3));
      if (stage !== 1) {
        const head = [];
        const disk = new THREE.CylinderGeometry(0.12, 0.11, 0.04, 28);
        head.push(paintVertices(disk, (v) => new THREE.Color(stage === 4 ? '#2a1e14' : '#4a2e14').multiplyScalar(0.7 + 0.5 * Math.abs(Math.sin(Math.hypot(v.x, v.z) * 160)))));
        if (stage === 2) for (let i = 0; i < 22; i++) { const b = bladeGeometry(0.1, 0.03, { curl: 0.05, cup: 0.2, color: '#f6c200' }); b.translate(0, 0.1, 0); b.rotateX(Math.PI / 2); b.rotateY((i / 22) * Math.PI * 2); head.push(b); }
        const hg = merge(head);
        hg.rotateX(Math.PI / 2 - (stage === 4 ? -0.6 : 0.4));
        hg.translate(top.x, top.y + 0.02, top.z + 0.03);
        out.push(hg);
      }
      break;
    }
    case 'pumpkin': {
      // sprawling vine with big lobed leaves; pumpkins sit on the soil
      const vine = [p.clone(), p.clone().add(new V3(0.3, 0.05, 0.15)), p.clone().add(new V3(0.6, 0.04, -0.1)), p.clone().add(new V3(0.85, 0.03, 0.1))];
      out.push(paintVertices(sweep(vine, () => 0.012, { radial: 5, segments: 12 }), () => new THREE.Color(stage === 4 ? DRYC : '#5a8a32')));
      const curve = new THREE.CatmullRomCurve3(vine);
      if (stage !== 3) for (let i = 0; i < 7; i++) {
        const at = curve.getPointAt(i / 7);
        out.push(paintVertices(sweep([at, at.clone().add(new V3(0, 0.25 * k, 0))], () => 0.006, { radial: 4, segments: 2 }), () => new THREE.Color('#5a8a32')));
        const lf = new THREE.CircleGeometry(0.17 * k, 10);
        const lp = lf.attributes.position;
        for (let j = 0; j < lp.count; j++) { const a = Math.atan2(lp.getY(j), lp.getX(j)); const r = Math.hypot(lp.getX(j), lp.getY(j)); lp.setXY(j, Math.cos(a) * r * (1 + 0.15 * Math.cos(a * 5)), Math.sin(a) * r * (1 + 0.15 * Math.cos(a * 5))); lp.setZ(j, -r * r * 2); }
        lf.computeVertexNormals();
        lf.rotateX(-Math.PI / 2 + 0.35);
        lf.rotateY(rand() * 6.28);
        lf.translate(at.x, at.y + 0.25 * k, at.z);
        out.push(paintVertices(lf, () => new THREE.Color(green).multiplyScalar(0.9 + rand() * 0.2)));
      }
      if (stage >= 2 && stage !== 3) {
        for (let i = 0; i < 2; i++) {
          const at = curve.getPointAt(0.35 + i * 0.4);
          const R = 0.17 + rand() * 0.08;
          const pk = new THREE.SphereGeometry(R, 24, 14);
          const pp = pk.attributes.position;
          for (let j = 0; j < pp.count; j++) {
            const x = pp.getX(j);
            const z = pp.getZ(j);
            const y = pp.getY(j);
            const rib = 1 + 0.06 * Math.cos(Math.atan2(z, x) * 10);
            pp.setXYZ(j, x * rib, y * 0.78 * (1 - 0.15 * Math.pow(1 - Math.abs(y / R), 6)), z * rib);
          }
          pk.computeVertexNormals();
          pk.translate(at.x, R * 0.78 - 0.01, at.z + 0.15);
          out.push(paintVertices(pk, (v) => new THREE.Color(stage === 4 ? '#c8803a' : '#e8781a').multiplyScalar(0.8 + 0.25 * Math.cos(Math.atan2(v.z - at.z - 0.15, v.x - at.x) * 10))));
          const st = sweep([new V3(at.x, R * 1.5, at.z + 0.15), new V3(at.x + 0.02, R * 1.5 + 0.06, at.z + 0.16)], () => 0.014, { radial: 6, segments: 2 });
          out.push(paintVertices(st, () => new THREE.Color('#6a7a3a')));
        }
      }
      break;
    }
    case 'cabbage':
    case 'lettuce': {
      const cab = kind === 'cabbage';
      const n = cab ? 14 : 18;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const len = (cab ? 0.2 : 0.16) * k * (1 - t * 0.4);
        const g = bladeGeometry(len, len * (cab ? 0.95 : 0.8), { curl: cab ? -0.2 : 0.1, cup: cab ? 0.9 : 0.5, color: stage === 4 ? DRYC : cab ? '#6a9a7a' : '#7ab84a', tipColor: stage === 4 ? '#b8a060' : cab ? '#8ab89a' : '#a8d870' });
        if (!cab) { const gp = g.attributes.position; for (let j = 0; j < gp.count; j++) if (gp.getY(j) > len * 0.5) gp.setZ(j, gp.getZ(j) + Math.sin(gp.getX(j) * 120) * 0.012); g.computeVertexNormals(); }
        g.rotateX(1.35 - t * 1.0);
        g.rotateY(i * 2.39996);
        g.translate(p.x, p.y + 0.01, p.z);
        if (stage === 3 && t < 0.5) continue;
        out.push(g);
      }
      if (cab && stage !== 1 && stage !== 3) {
        const hd = new THREE.SphereGeometry(0.1, 16, 12);
        hd.scale(1, 0.9, 1);
        hd.translate(p.x, p.y + 0.09, p.z);
        out.push(paintVertices(hd, (v) => new THREE.Color(stage === 4 ? '#a8a86a' : '#a8c8a0').multiplyScalar(0.85 + 0.2 * Math.abs(Math.sin(v.x * 80 + v.z * 60)))));
      }
      break;
    }
    case 'tomato': {
      const H = 1.3 * k;
      out.push(paintVertices(sweep([p.clone().add(new V3(0.07, -0.02, 0)), p.clone().add(new V3(0.07, H + 0.2, 0))], () => 0.012, { radial: 6, segments: 2 }), () => new THREE.Color('#a07a50')));
      const top = p.clone().add(new V3(0.03, H, 0));
      out.push(stalk(p, top, 0.012, stage >= 3 ? DRYC : '#5a8a3a', new V3(-0.04, 0, 0.02)));
      for (const y of [0.35, 0.7]) { const t = new THREE.TorusGeometry(0.03, 0.005, 5, 10); t.rotateX(Math.PI / 2); t.translate(p.x + 0.05, p.y + H * y, p.z); out.push(paintVertices(t, () => new THREE.Color('#d8d0b0'))); }
      const curve = new THREE.CatmullRomCurve3([p, p.clone().lerp(top, 0.5).add(new V3(-0.04, 0, 0.02)), top]);
      for (let i = 0; i < 8; i++) {
        const at = curve.getPointAt(0.15 + i * 0.1);
        const a = i * 2.4;
        const end = at.clone().add(new V3(Math.cos(a) * 0.22 * k, 0.05, Math.sin(a) * 0.22 * k));
        out.push(stalk(at, end, 0.005, stage === 4 ? DRYC : '#5a8a3a'));
        if (stage !== 3) for (let j = 0; j < 3; j++) out.push(leaf(0.1 * k, 0.05, at.clone().lerp(end, 0.4 + j * 0.25), a + (j - 1) * 0.8, 1.2, green, tip, 0.25));
        if (stage === 2 && i % 2 === 0) {
          for (let j = 0; j < 3; j++) {
            const tm = new THREE.SphereGeometry(0.03, 10, 8);
            tm.scale(1, 0.85, 1);
            const tp2 = at.clone().lerp(end, 0.6).add(new V3((j - 1) * 0.04, -0.06 - j * 0.02, 0));
            tm.translate(tp2.x, tp2.y, tp2.z);
            out.push(paintVertices(tm, () => new THREE.Color(rand() < 0.7 ? '#d8261c' : '#e89a2a')));
          }
        }
      }
      break;
    }
    case 'carrot': {
      // feathery leaves over an orange shoulder just showing at the soil
      if (stage !== 3) for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const st = p.clone().add(new V3(Math.cos(a) * 0.12 * k, 0.28 * k, Math.sin(a) * 0.12 * k));
        out.push(stalk(p, st, 0.003, stage === 4 ? DRYC : '#5a9a3a'));
        for (let j = 0; j < 5; j++) out.push(leaf(0.04 * k, 0.02, p.clone().lerp(st, 0.45 + j * 0.12), a + (j % 2 ? 0.8 : -0.8), 1.2, green, tip, 0.1));
      }
      const sh = lathe([[0.001, -0.03], [0.022, -0.02], [0.025, 0.015], [0.015, 0.025], [0.001, 0.026]], 10);
      sh.translate(p.x, p.y, p.z);
      out.push(paintVertices(sh, () => new THREE.Color('#e8761e')));
      if (stage === 3) { const c = lathe([[0.001, 0], [0.02, 0.01], [0.022, 0.05], [0.006, 0.17], [0.001, 0.18]], 10); c.rotateZ(Math.PI / 2 - 0.1); c.translate(p.x + 0.1, p.y + 0.02, p.z); out.push(paintVertices(c, () => new THREE.Color('#e8761e'))); }
      break;
    }
    case 'strawberry': {
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + rand() * 0.3;
        const st = p.clone().add(new V3(Math.cos(a) * 0.1 * k, 0.15 * k, Math.sin(a) * 0.1 * k));
        out.push(stalk(p, st, 0.003, '#5a8a3a'));
        if (stage === 3) continue;
        for (let j = 0; j < 3; j++) { const lf = new THREE.CircleGeometry(0.03 * k, 8); lf.scale(0.75, 1, 1); lf.translate(0, 0.03 * k, 0); lf.rotateX(-1.1); lf.rotateY(a + (j - 1) * 1.0); lf.translate(st.x, st.y, st.z); out.push(paintVertices(lf, () => new THREE.Color(green))); }
      }
      if (stage === 2) for (let i = 0; i < 6; i++) {
        const a = rand() * 6.28;
        const b = new THREE.ConeGeometry(0.014, 0.03, 8);
        b.rotateX(Math.PI);
        b.translate(p.x + Math.cos(a) * 0.12, p.y + 0.018, p.z + Math.sin(a) * 0.12);
        out.push(paintVertices(b, () => new THREE.Color(i % 3 ? '#d81e2a' : '#f2f0e0')));
      }
      break;
    }
    case 'potato':
    case 'cotton': {
      const H = (kind === 'cotton' ? 0.9 : 0.55) * k;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + rand();
        const st = p.clone().add(new V3(Math.cos(a) * 0.18 * k, H * (0.7 + rand() * 0.3), Math.sin(a) * 0.18 * k));
        out.push(stalk(p, st, 0.006, stage >= 3 ? DRYC : '#5a8a3a'));
        if (stage === 3 && kind === 'potato') continue;
        const curve = new THREE.CatmullRomCurve3([p, p.clone().lerp(st, 0.5), st]);
        for (let j = 0; j < 4; j++) out.push(leaf(0.08 * k, 0.05, curve.getPointAt(0.35 + j * 0.18), a + j * 1.6, 1.15, stage === 3 ? DRYC : green, tip, 0.2));
        if (kind === 'cotton' && stage >= 2) {
          const boll = blob(0.035, { detail: 2, seed: i, amount: 0.35, freq: 6 });
          boll.translate(st.x, st.y + 0.02, st.z);
          out.push(paintVertices(boll, () => new THREE.Color('#f8f6f0')));
        }
        if (kind === 'potato' && stage === 2 && i % 2 === 0) { const fl = new THREE.IcosahedronGeometry(0.015, 0); fl.translate(st.x, st.y + 0.01, st.z); out.push(paintVertices(fl, () => new THREE.Color('#e8e0f4'))); }
      }
      if (kind === 'potato' && stage === 3) for (let i = 0; i < 5; i++) { const t = new THREE.SphereGeometry(0.035, 10, 8); t.scale(1.3, 0.9, 1); t.translate(p.x + (rand() - 0.5) * 0.3, p.y + 0.02, p.z + (rand() - 0.5) * 0.3); out.push(paintVertices(t, () => new THREE.Color('#c8a070'))); }
      break;
    }
    case 'rice': {
      for (let i = 0; i < 14; i++) {
        const a = rand() * 6.28;
        const h = 0.75 * k * (0.8 + rand() * 0.3);
        out.push(leaf(h, 0.008, p, a, 0.15 + rand() * 0.2, stage === 3 ? DRYC : stage === 4 ? '#b8a050' : G0, stage === 2 ? '#c8c060' : G1, 0.35));
      }
      if (stage === 2 || stage === 4) for (let i = 0; i < 4; i++) {
        const a = rand() * 6.28;
        const tp = p.clone().add(new V3(Math.cos(a) * 0.12, 0.7 * k, Math.sin(a) * 0.12));
        out.push(paintVertices(sweep([p, tp.clone().add(new V3(0, 0.05, 0)), tp.clone().add(new V3(Math.cos(a) * 0.08, -0.1, Math.sin(a) * 0.08))], () => 0.003, { radial: 3, segments: 6 }), () => new THREE.Color('#c8b050')));
      }
      break;
    }
    default:
      break;
  }
  return out;
}

export function createCrop(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('crop', CROP_VARIANTS, CROP_TRIMS, o.variant, o.trim);
  const v = CROP_VARIANTS[variant];
  const trim = o.trim ?? null;
  const stage = { seedling: 0, young: 1, harvest: 3, withered: 4 }[trim] ?? 2;
  const seed = seedOf(o, 41 + variant.length);
  const rand = rng(seed * 19 + 5);
  const root = group(`crop-${variant}${trim ? `-${trim}` : ''}`);
  const sway = group('sway', { parent: root });
  const per = trim === 'row' ? Math.round(v.per * 2.5) : v.per;
  const rows = trim === 'row' ? 1 : v.rows;
  const geos = [];
  let W;
  let D;
  if (v.dense) {
    // wheat: a dense block of stalks with awned heads
    W = trim === 'row' ? 4 : 1.6;
    D = trim === 'row' ? 0.6 : 1.2;
    const n = Math.round(W * D * (stage === 0 ? 260 : 340));
    // one stalk (+ ear) unit, instanced with random lean / height / colour
    const unit = [];
    if (stage === 0) unit.push(...plant('wheat', new V3(0, 0, 0), 0, rand, v));
    else {
      const H = stage === 3 ? 0.12 : stage === 1 ? 0.45 : 0.95;
      const col = stage === 1 ? '#5a9a3a' : stage === 4 ? '#8a7a4a' : '#c8a850';
      unit.push(paintVertices(sweep([new V3(0, 0, 0), new V3(0, H * 0.5, 0.01), new V3(0, H, 0)], () => 0.0025, { radial: 3, segments: 3 }), () => new THREE.Color(col)));
      if (stage !== 3) unit.push(leaf(H * 0.35, 0.008, new V3(0, H * 0.25, 0), 0, 0.6, stage === 1 ? '#4a8a32' : '#b89a48', stage === 1 ? '#7ab84a' : '#d8c070', 0.4));
      if (stage === 2 || stage === 4) {
        const hd = new THREE.SphereGeometry(0.012, 6, 4);
        hd.scale(1, 4.2, 1);
        hd.rotateZ(stage === 4 ? 1.2 : 0.2);
        hd.translate(0, H + 0.04, 0);
        unit.push(paintVertices(hd, () => new THREE.Color(stage === 4 ? '#7a6a3a' : '#d8b860')));
        const awn = new THREE.CylinderGeometry(0.0006, 0.0006, 0.07, 3);
        awn.translate(0, H + 0.1, 0);
        unit.push(paintVertices(awn, () => new THREE.Color('#e0c880')));
      }
    }
    const items = [];
    for (let i = 0; i < n; i++) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rand() - 0.5) * 0.15, rand() * 6.28, (rand() - 0.5) * 0.15));
      const sc = 0.85 + rand() * 0.3;
      items.push({ p: new V3((rand() - 0.5) * W, 0.035, (rand() - 0.5) * D), q, s: new V3(1, sc, 1), c: new THREE.Color(1, 1, 1).multiplyScalar(0.85 + rand() * 0.2) });
    }
    sway.add(instanced(merge(unit), vcMat(0.7, THREE.DoubleSide), items, 'wheat'));
  } else {
    const gx = v.gapX;
    const gz = v.gapZ || 0.8;
    W = per * gx + 0.2;
    D = rows * gz;
    for (let r = 0; r < rows; r++) {
      for (let i = 0; i < per; i++) {
        const p = new V3((i - (per - 1) / 2) * gx + (rand() - 0.5) * gx * 0.15, v.paddy ? 0.02 : 0.08, (r - (rows - 1) / 2) * gz + (rand() - 0.5) * 0.04);
        geos.push(...plant(variant, p, stage, rand, v));
      }
    }
  }
  // soil: raised ridges along each row (or a flooded paddy)
  const soil = [];
  if (v.paddy) {
    const bed = new THREE.BoxGeometry(W + 0.4, 0.04, D + 0.4, Math.ceil(W / 0.1), 1, Math.ceil(D / 0.1));
    bed.translate(0, 0.0, 0);
    soil.push(paintVertices(bed, () => new THREE.Color('#5a4a34')));
  } else if (v.dense) {
    const bed = blob(1, { detail: 4, seed, amount: 0.08, freq: 3, scale: [W * 0.62, 0.05, D * 0.62] });
    const bp = bed.attributes.position;
    for (let i = 0; i < bp.count; i++) if (bp.getY(i) < 0) bp.setY(i, 0);
    bed.computeVertexNormals();
    soil.push(paintVertices(bed, (q) => new THREE.Color('#6a5038').multiplyScalar(0.8 + 0.3 * fbm(q.x * 10, 0, q.z * 10, seed, 2))));
  } else {
    for (let r = 0; r < rows; r++) {
      const z = (r - (rows - 1) / 2) * (v.gapZ || 0.8);
      const ridge = new THREE.CylinderGeometry(0.16, 0.16, W + 0.25, 12, Math.ceil((W + 0.25) / 0.08), false, 0, Math.PI);
      ridge.rotateZ(Math.PI / 2);
      ridge.rotateX(Math.PI / 2);
      ridge.scale(1, 0.55, 1);
      ridge.translate(0, 0, z);
      const rp = ridge.attributes.position;
      for (let i = 0; i < rp.count; i++) { if (rp.getY(i) < 0) rp.setY(i, 0); rp.setY(i, rp.getY(i) + 0.006 * fbm(rp.getX(i) * 20, 0, rp.getZ(i) * 20, seed, 2)); }
      ridge.computeVertexNormals();
      soil.push(paintVertices(ridge, (q) => new THREE.Color(variant === 'strawberry' ? '#c8b070' : '#6a5038').multiplyScalar(0.8 + 0.3 * fbm(q.x * 12, q.y * 12, q.z * 12, seed, 2))));
    }
  }
  mesh(merge(soil), vcMat(1), { parent: root, name: 'soil' });
  if (v.paddy) {
    const water = new THREE.PlaneGeometry(W + 0.38, D + 0.38);
    water.rotateX(-Math.PI / 2);
    water.translate(0, 0.03, 0);
    mesh(water, new THREE.MeshPhysicalMaterial({ color: '#5a6a5a', roughness: 0.05, transmission: 0.3, transparent: true, opacity: 0.75, name: 'water' }), { parent: root, name: 'water' });
  }
  if (geos.length) mesh(merge(geos), vcMat(0.7, THREE.DoubleSide), { parent: sway, name: 'plants' });
  const animations = [clip('sway', 3, [rotateTrack(sway, new V3(1, 0, 0.4), 3, (t) => wave(t) * 0.006)])];
  return finalize(root, { type: 'crop', variant, options: o, animations });
}
