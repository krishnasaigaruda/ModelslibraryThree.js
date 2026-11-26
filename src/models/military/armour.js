import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { group, roundedBox, lathe, extrudeOutline, finalize, normalizeOptions, pickVariant, rng, jitter, cushion } from '../../core/utils.js';
import { clip, rotateTrack, wave } from '../../core/animation.js';
import { Merge, armsMats, restOnGround } from './kit.js';
import { ARMS_TABLES, buildArmsInto } from './arms.js';

/*
 * Shields, helmets and full suits of armour on display stands, weapon racks and training
 * dummies. Versions (trims) change shape and materials: ornate, battle-worn, ceremonial,
 * rusted, bronze, blackened, …
 */

const PI = Math.PI;

function finishName(trim) {
  return ['ornate', 'battle-worn', 'ceremonial', 'rusted', 'bronze', 'blackened'].includes(trim) ? trim : 'plain';
}
function metalOf(m, trim, fallback) {
  if (trim === 'rusted') return m.rust;
  if (trim === 'bronze') return m.bronze;
  if (trim === 'blackened') return m.dark;
  if (trim === 'ceremonial') return m.silver;
  return fallback ?? m.steel;
}

/* ------------------------------------------------------------------ */
/* Shields                                                              */
/* ------------------------------------------------------------------ */

const SHIELDS = {
  'round-viking': { w: 0.86, h: 0.86, shape: 'round', dome: 0.03, t: 0.012, boss: 0.075, design: 'quarters', colors: ['#9c1c1a', '#e8e0c8'], planks: true, rim: 'rawhide' },
  kite: { w: 0.55, h: 1.1, shape: 'kite', bend: 0.18, t: 0.014, design: 'cross', colors: ['#1e3d78', '#d8c890'], rim: 'steel' },
  heater: { w: 0.6, h: 0.75, shape: 'heater', bend: 0.12, t: 0.014, design: 'chevron', colors: ['#8a1c22', '#e2c26a'], rim: 'steel' },
  scutum: { w: 0.66, h: 1.05, shape: 'rect', bend: 0.9, t: 0.014, boss: 0.08, design: 'wings', colors: ['#8e1a16', '#d9b44a'], rim: 'brass' },
  buckler: { w: 0.36, h: 0.36, shape: 'round', dome: 0.04, t: 0.004, boss: 0.06, design: 'plain', colors: ['#b8bcc0', '#8a8e92'], rim: 'steel', metal: true },
  hoplite: { w: 0.92, h: 0.92, shape: 'round', dome: 0.12, t: 0.012, design: 'lambda', colors: ['#b0793a', '#1b1a18'], rim: 'bronze', metalFace: true },
  pavise: { w: 0.6, h: 1.2, shape: 'pavise', bend: 0.25, t: 0.02, design: 'stripes', colors: ['#2c5a2e', '#e8e0c8'], rim: 'steel' },
  targe: { w: 0.5, h: 0.5, shape: 'round', dome: 0.02, t: 0.02, boss: 0.05, design: 'leather', colors: ['#5a3820', '#3a2414'], rim: 'brass', studs: true },
};

function shieldOutline(P) {
  const { w, h } = P;
  const s = new THREE.Shape();
  const hw = w / 2;
  switch (P.shape) {
    case 'round':
      s.absellipse(0, h / 2, hw, h / 2, 0, PI * 2);
      break;
    case 'kite':
      s.moveTo(0, 0);
      s.quadraticCurveTo(hw * 0.9, h * 0.45, hw, h * 0.78);
      s.quadraticCurveTo(hw * 0.95, h, 0, h);
      s.quadraticCurveTo(-hw * 0.95, h, -hw, h * 0.78);
      s.quadraticCurveTo(-hw * 0.9, h * 0.45, 0, 0);
      break;
    case 'heater':
      s.moveTo(0, 0);
      s.quadraticCurveTo(hw, h * 0.2, hw, h * 0.65);
      s.lineTo(hw, h);
      s.lineTo(-hw, h);
      s.lineTo(-hw, h * 0.65);
      s.quadraticCurveTo(-hw, h * 0.2, 0, 0);
      break;
    case 'pavise':
      s.moveTo(-hw * 0.9, 0);
      s.lineTo(hw * 0.9, 0);
      s.lineTo(hw, h * 0.9);
      s.quadraticCurveTo(0, h * 1.05, -hw, h * 0.9);
      s.lineTo(-hw * 0.9, 0);
      break;
    default: {
      const r = 0.06;
      s.moveTo(-hw + r, 0);
      s.lineTo(hw - r, 0);
      s.quadraticCurveTo(hw, 0, hw, r);
      s.lineTo(hw, h - r);
      s.quadraticCurveTo(hw, h, hw - r, h);
      s.lineTo(-hw + r, h);
      s.quadraticCurveTo(-hw, h, -hw, h - r);
      s.lineTo(-hw, r);
      s.quadraticCurveTo(-hw, 0, -hw + r, 0);
    }
  }
  return s;
}

function shieldTexture(P, trim) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  let [a, b] = P.colors;
  if (trim === 'ceremonial') [a, b] = ['#f0ead8', '#c9a23a'];
  if (trim === 'blackened') [a, b] = ['#1b1a18', '#8a8e92'];
  g.fillStyle = a;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = b;
  g.strokeStyle = b;
  switch (P.design) {
    case 'quarters':
      g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 200, 0, PI / 2); g.fill();
      g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 200, PI, PI * 1.5); g.fill();
      break;
    case 'cross':
      g.fillRect(110, 0, 36, 256); g.fillRect(0, 70, 256, 36);
      break;
    case 'chevron':
      g.lineWidth = 34; g.beginPath(); g.moveTo(10, 170); g.lineTo(128, 70); g.lineTo(246, 170); g.stroke();
      break;
    case 'wings':
      g.lineWidth = 8;
      for (const s of [1, -1]) for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(128, 128); g.quadraticCurveTo(128 + s * 50, 90 - i * 12, 128 + s * 110, 60 + i * 30); g.stroke(); }
      g.strokeRect(14, 14, 228, 228);
      break;
    case 'lambda':
      g.lineWidth = 26; g.beginPath(); g.moveTo(70, 200); g.lineTo(128, 60); g.lineTo(186, 200); g.stroke();
      break;
    case 'stripes':
      for (let i = 0; i < 8; i += 2) g.fillRect(i * 32, 0, 32, 256);
      break;
    case 'leather':
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(128, 128, 20 + i * 20, 0, PI * 2); g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.3)'; g.stroke(); }
      break;
    default:
  }
  if (trim === 'battle-worn' || trim === 'rusted') {
    const r = rng('wear');
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${trim === 'rusted' ? '90,50,25' : '60,45,30'},${0.2 + r() * 0.4})`; g.fillRect(r() * 256, r() * 256, 2 + r() * 10, 1 + r() * 4); }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(1 / P.w, 1 / P.h);
  t.offset.set(0.5, 0);
  return t;
}

function shield(ctx, variant) {
  const { m, trim, root } = ctx;
  const P = SHIELDS[variant];
  const t = P.t;
  const bendZ = (x, y) => {
    let z = 0;
    if (P.bend) z -= (x * x) * P.bend * (P.shape === 'rect' ? 1 : 1);
    if (P.dome) {
      const rr = ((x / (P.w / 2)) ** 2 + ((y - P.h / 2) / (P.h / 2)) ** 2);
      z += P.dome * Math.max(0, 1 - rr);
    }
    return z;
  };
  let outline = shieldOutline(P);
  if (trim === 'battle-worn') {
    // chipped rim
    const pts = outline.getPoints(48);
    const r = rng('chip');
    outline = new THREE.Shape(pts.map((p, i) => (i % 5 === 2 && r() < 0.6 ? p.clone().multiplyScalar(1).lerp(new THREE.Vector2(0, P.h / 2), 0.04) : p)));
  }
  const geo = new THREE.ExtrudeGeometry(outline, { depth: t, bevelEnabled: true, bevelThickness: Math.min(0.004, t * 0.3), bevelSize: 0.004, bevelSegments: 1, curveSegments: 24 });
  geo.translate(0, 0, -t / 2);
  // subdivide-free bend: vertices are sparse on flat caps, so tessellate the caps through a grid first
  let tess = tessellate(geo, 0.05);
  const pos = tess.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) + bendZ(pos.getX(i), pos.getY(i)));
  tess = mergeVertices(tess, 1e-5);
  tess.computeVertexNormals();
  const tex = shieldTexture(P, trim);
  let faceMat;
  if (trim === 'leather-covered' || P.design === 'leather') faceMat = trim === 'leather-covered' ? m.leatherDark : m.leather;
  else if (P.metal) faceMat = metalOf(m, trim, m.steel);
  else if (P.metalFace && trim !== 'ceremonial') faceMat = trim === 'rusted' ? m.rust : trim === 'blackened' ? m.dark : m.bronze;
  else faceMat = new THREE.MeshStandardMaterial({ name: 'shield_paint', color: tex ? '#ffffff' : P.colors[0], map: tex, roughness: trim === 'ceremonial' ? 0.35 : 0.7, metalness: 0.05 });
  const sg = group('shield', { parent: root });
  const face = new THREE.Mesh(tess, faceMat);
  face.name = 'shield_face';
  sg.add(face);
  const mg = new Merge();
  const rimMat = trim === 'ceremonial' || trim === 'ornate' ? m.gold : P.rim === 'rawhide' ? m.leatherDark : P.rim === 'brass' ? m.brass : P.rim === 'bronze' ? m.bronze : metalOf(m, trim);
  const pts = shieldOutline(P).getSpacedPoints(64);
  const rimPts = pts.map((p) => [p.x, p.y, bendZ(p.x, p.y)]);
  mg.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts.map((p) => new THREE.Vector3(...p)), true), 96, t * 0.75 + 0.004, 6, true), rimMat);
  const cx = 0;
  const cy = P.h * (P.shape === 'kite' ? 0.62 : P.shape === 'heater' ? 0.6 : 0.5);
  const fz = (x, y) => bendZ(x, y) + t / 2 + 0.004;
  if (P.planks) for (let i = -3; i <= 3; i++) {
    const x = i * (P.w / 7);
    const hh = Math.sqrt(Math.max(0, (P.w / 2) ** 2 - x * x)) * 2 - 0.04;
    mg.add(new THREE.BoxGeometry(0.004, hh, 0.003), m.woodDark, { at: [x + P.w / 14, cy, fz(x + P.w / 14, cy) - 0.001] });
  }
  const bossMat = trim === 'ceremonial' || trim === 'ornate' ? m.gold : metalOf(m, trim);
  if (P.boss) {
    const br = P.boss;
    mg.add(lathe([[br * 1.25, 0], [br * 1.2, 0.008], [br, 0.012], [br * 0.9, br * 0.55], [br * 0.5, br * 0.85], [0.001, br * 0.9]], 24).rotateX(PI / 2), bossMat, { at: [cx, cy, fz(cx, cy) - 0.006] });
    if (trim === 'spiked') mg.add(new THREE.ConeGeometry(br * 0.25, br * 1.4, 12).rotateX(PI / 2), bossMat, { at: [cx, cy, fz(cx, cy) + br * 0.85 + br * 0.6] });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2;
      mg.add(new THREE.SphereGeometry(0.007, 8, 6), bossMat, { at: [cx + Math.cos(a) * br * 1.12, cy + Math.sin(a) * br * 1.12, fz(cx, cy) - 0.002] });
    }
  } else if (trim === 'spiked') {
    mg.add(lathe([[0.05, 0], [0.04, 0.02], [0.001, 0.025]], 18).rotateX(PI / 2), bossMat, { at: [cx, cy, fz(cx, cy) - 0.004] });
    mg.add(new THREE.ConeGeometry(0.015, 0.12, 12).rotateX(PI / 2), bossMat, { at: [cx, cy, fz(cx, cy) + 0.075] });
  }
  if (P.studs || trim === 'ornate' || trim === 'leather-covered' || trim === 'ceremonial') {
    const studMat = trim === 'ceremonial' || trim === 'ornate' ? m.gold : m.brass;
    const sp = shieldOutline(P).getSpacedPoints(trim === 'ornate' ? 28 : 18);
    for (const p of sp) {
      const q = new THREE.Vector2(p.x, p.y).lerp(new THREE.Vector2(0, P.h / 2), 0.1);
      mg.add(new THREE.SphereGeometry(0.008, 8, 6), studMat, { at: [q.x, q.y, fz(q.x, q.y) - 0.003] });
    }
  }
  if (trim === 'ceremonial') {
    // jewelled cartouche
    mg.add(new THREE.SphereGeometry(1, 14, 10).scale(0.03, 0.04, 0.012), m.gem, { at: [0, P.h * 0.85, fz(0, P.h * 0.85) - 0.002] });
  }
  // back: grip bar + arm straps
  const bz = (x, y) => bendZ(x, y) - t / 2 - 0.004;
  mg.add(new THREE.CylinderGeometry(0.014, 0.014, Math.min(0.14, P.w * 0.4), 10).rotateZ(PI / 2), m.leather, { at: [cx, cy, bz(cx, cy) - 0.03] });
  for (const s of [1, -1]) mg.add(roundedBox(0.03, 0.03, 0.03, 0.008, 1), m.iron, { at: [cx + s * Math.min(0.07, P.w * 0.2), cy, bz(cx + s * Math.min(0.07, P.w * 0.2), cy) - 0.014] });
  mg.flush(sg, 'shield_fittings');
  if (!ctx.stand) {
    // no stand: the shield lies on the ground face-up, resting on its rim / grip
    sg.rotation.x = -PI / 2;
    sg.updateMatrixWorld(true);
    sg.position.y -= new THREE.Box3().setFromObject(sg).min.y;
    ctx.anims.push(clip('inspect', 4, [rotateTrack(sg, 'z', 4, (tt) => wave(tt) * 0.02)]));
    return;
  }
  // stand: plinth, ledge in front of the foot, back post touching the back face
  sg.rotation.x = -0.08;
  sg.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(sg);
  sg.position.y = 0.04 - box.min.y - 0.002;
  sg.updateMatrixWorld(true);
  const sm = new Merge();
  const D = Math.max(0.34, P.dome ? 0.4 : 0.34);
  sm.add(roundedBox(Math.max(0.3, P.w * 0.8), 0.04, D, 0.012, 2), m.stand, { at: [0, 0.02, -0.06] });
  // post height where it meets the back face
  const yp = P.h * 0.7;
  const local = new THREE.Vector3(0.12 * Math.min(1, P.w), yp, bz(0.12 * Math.min(1, P.w), yp));
  const world = sg.localToWorld(local.clone());
  const pz = world.z - 0.02;
  sm.add(roundedBox(0.04, world.y - 0.04 + 0.02, 0.04, 0.008, 2), m.stand, { at: [world.x, 0.04 + (world.y - 0.04 + 0.02) / 2, pz] });
  const lowFront = sg.localToWorld(new THREE.Vector3(0, box.min.y < 0 ? 0 : 0.02, 0));
  void lowFront;
  sm.flush(root, 'stand');
  ctx.anims.push(clip('inspect', 4, [rotateTrack(sg, 'y', 4, (tt) => wave(tt) * 0.02)]));
}

/** Re-triangulate a geometry so long triangles get split (needed before bending). */
function tessellate(geo, maxLen) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  let p = Array.from(g.attributes.position.array);
  for (let pass = 0; pass < 6; pass++) {
    const out = [];
    let split = false;
    for (let i = 0; i < p.length; i += 9) {
      const A = p.slice(i, i + 3);
      const B = p.slice(i + 3, i + 6);
      const C = p.slice(i + 6, i + 9);
      const d = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]);
      const ab = d(A, B);
      const bc = d(B, C);
      const ca = d(C, A);
      const mx = Math.max(ab, bc, ca);
      if (mx <= maxLen) { out.push(...A, ...B, ...C); continue; }
      split = true;
      const mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2, (u[2] + v[2]) / 2];
      if (mx === ab) { const M = mid(A, B); out.push(...A, ...M, ...C, ...M, ...B, ...C); }
      else if (mx === bc) { const M = mid(B, C); out.push(...A, ...B, ...M, ...A, ...M, ...C); }
      else { const M = mid(C, A); out.push(...A, ...B, ...M, ...M, ...B, ...C); }
    }
    p = out;
    if (!split) break;
  }
  const res = new THREE.BufferGeometry();
  res.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  // planar UVs from x/y (matches ExtrudeGeometry's cap UVs in metres)
  const uv = [];
  for (let i = 0; i < p.length; i += 3) uv.push(p[i], p[i + 1]);
  res.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return res;
}

/* ------------------------------------------------------------------ */
/* Helmets                                                              */
/* ------------------------------------------------------------------ */

const HELMETS = ['viking', 'roman', 'great-helm', 'kabuto', 'corinthian', 'sallet', 'bascinet', 'barbute', 'morion'];

/** Builds a helmet into `g` (crown inner top at y = 0, opening downward). Returns { bottom }. */
export function buildHelmet(g, kind, m, trim, name = 'helmet') {
  const mg = new Merge();
  const base = kind === 'corinthian' && trim !== 'rusted' && trim !== 'blackened' && trim !== 'ceremonial' ? m.bronze : metalOf(m, trim, kind === 'kabuto' ? m.lacquer : m.steel);
  const trimMat = trim === 'ornate' || trim === 'ceremonial' ? m.gold : trim === 'rusted' ? m.rust : kind === 'roman' || kind === 'corinthian' ? m.brass : m.iron;
  const T = 0.004;
  // skull shell from an outer profile (r, y) with y measured downward from crown (negative)
  let fit = null;
  const shell = (prof, s = [1, 1, 1], mat = base, at = [0, 0, 0]) => {
    if (!fit) fit = { prof: prof.map(([r, y]) => [r, y + at[1]]), s };
    const outer = prof.map(([r, y]) => [r, y + T]);
    const inner = prof.slice().reverse().map(([r, y]) => [Math.max(0.001, r - T), y]);
    const geo = lathe([[0.001, outer[0][1]], ...outer, ...inner, [0.001, prof[0][1]]], 36);
    geo.scale(...s);
    mg.add(geo, mat, { at });
  };
  const skull = [[0.04, 0], [0.075, -0.012], [0.095, -0.04], [0.105, -0.08], [0.108, -0.12]];
  let bottom = -0.12;
  switch (kind) {
    case 'viking': {
      shell(skull.map(([r, y]) => [r, y * 1.05]), [1, 1, 1.15]);
      // spangen bands + spectacle guard (no horns)
      for (let i = 0; i < 4; i++) mg.add(new THREE.TorusGeometry(0.104, 0.006, 4, 24, PI / 2).rotateY((i / 4) * PI * 2), trimMat, { scale: [1, 1.2, 1.15], at: [0, -0.126, 0] });
      mg.add(new THREE.TorusGeometry(0.109, 0.007, 6, 36).rotateX(PI / 2), trimMat, { at: [0, -0.12, 0], scale: [1, 1, 1.15] });
      for (const s of [1, -1]) mg.add(new THREE.TorusGeometry(0.026, 0.006, 6, 18), trimMat, { at: [0.118, -0.145, s * 0.032], rot: [0, PI / 2, 0] });
      mg.add(roundedBox(0.012, 0.06, 0.014, 0.004, 1), trimMat, { at: [0.122, -0.165, 0] });
      mg.add(new THREE.CylinderGeometry(0.112, 0.112, 0.05, 30, 1, true, PI * 0.6, PI * 0.8), m.steel === base ? m.iron : base, { at: [0, -0.145, 0], scale: [1, 1, 1.15] }); // mail aventail stub
      bottom = -0.17;
      break;
    }
    case 'roman': {
      shell(skull, [1, 1.05, 1.08]);
      mg.add(new THREE.TorusGeometry(0.11, 0.008, 6, 36).rotateX(PI / 2), trimMat, { at: [0, -0.115, 0], scale: [1, 1, 1.08] });
      // neck guard flaring at the back + brow ridge + cheek pieces
      mg.add(lathe([[0.108, 0], [0.13, -0.04], [0.15, -0.055]], 24, ).rotateY(PI / 2), base, { at: [0, -0.12, 0], scale: [1, 1, 1.08] });
      mg.add(new THREE.TorusGeometry(0.112, 0.006, 4, 20, PI * 0.6).rotateX(PI / 2).rotateY(-PI * 0.3), trimMat, { at: [0.0, -0.09, 0] });
      for (const s of [1, -1]) mg.add(extrudeOutline([[0, 0], [0.06, 0], [0.05, -0.1], [0.02, -0.11], [-0.01, -0.06]], 0.004, { bevel: 0.001 }), base, { at: [0.02, -0.115, s * 0.112], rot: [0, 0, 0] });
      // crest holder
      mg.add(roundedBox(0.03, 0.02, 0.012, 0.004, 1), trimMat, { at: [0, 0.006, 0] });
      bottom = -0.23;
      break;
    }
    case 'great-helm': {
      fit = { prof: [[0.001, 0], [0.111, 0], [0.111, -0.3]], s: [1, 1, 1.1] };
      const geo = new THREE.CylinderGeometry(0.115, 0.118, 0.3, 32, 1, true);
      mg.add(geo, base, { at: [0, -0.15, 0], scale: [1, 1, 1.1] });
      mg.add(new THREE.CylinderGeometry(0.11, 0.115, 0.006, 32), base, { at: [0, 0.003, 0], scale: [1, 1, 1.1] }); // flat top (inner face at y=0)
      mg.add(new THREE.TorusGeometry(0.115, 0.006, 4, 32).rotateX(PI / 2), trimMat, { at: [0, 0, 0], scale: [1, 1, 1.1] });
      // eye slits (dark) + breaths + cross reinforcement
      for (const s of [1, -1]) mg.add(roundedBox(0.012, 0.012, 0.07, 0.004, 1), m.leatherDark, { at: [0.112, -0.1, s * 0.05] });
      mg.add(roundedBox(0.01, 0.2, 0.02, 0.004, 1), trimMat, { at: [0.117, -0.16, 0] });
      mg.add(roundedBox(0.01, 0.02, 0.2, 0.004, 1), trimMat, { at: [0.117, -0.12, 0] });
      for (let i = 0; i < 6; i++) mg.add(new THREE.CylinderGeometry(0.004, 0.004, 0.01, 6).rotateZ(PI / 2), m.leatherDark, { at: [0.116, -0.2 - (i % 3) * 0.02, (i < 3 ? 1 : -1) * 0.04] });
      bottom = -0.3;
      break;
    }
    case 'kabuto': {
      shell(skull.map(([r, y]) => [r * 1.05, y * 0.9]), [1, 1, 1.08]);
      for (let i = 0; i < 16; i++) mg.add(new THREE.TorusGeometry(0.106, 0.0025, 3, 16, PI / 2).rotateY((i / 16) * PI * 2), trimMat, { at: [0, -0.105, 0], scale: [1.05, 1.0, 1.08] });
      // shikoro: flared neck lames on back and sides
      for (let i = 0; i < 4; i++) mg.add(new THREE.CylinderGeometry(0.125 + i * 0.022, 0.14 + i * 0.022, 0.035, 30, 1, true, PI * 0.15, PI * 1.7), trim === 'ceremonial' ? m.lacquerRed : base, { at: [0, -0.125 - i * 0.032, 0], scale: [1, 1, 1.08] });
      for (const s of [1, -1]) mg.add(extrudeOutline([[0, 0], [0.05, 0.02], [0.06, -0.06], [0.0, -0.05]], 0.006, { bevel: 0.002 }), trim === 'ceremonial' ? m.gold : m.lacquerRed, { at: [0.07, -0.11, s * 0.12], rot: [0, s * 0.7, 0] }); // fukigaeshi
      mg.add(roundedBox(0.03, 0.012, 0.18, 0.004, 1), base, { at: [0.11, -0.105, 0] }); // visor brim
      // maedate (crest): gilded crescent / kuwagata horns
      const crest = trim === 'battle-worn' || trim === 'rusted' ? null : trim === 'ceremonial' || trim === 'ornate' ? 'horns' : 'crescent';
      if (crest === 'crescent') mg.add(new THREE.TorusGeometry(0.06, 0.006, 4, 20, PI).rotateY(PI / 2), m.gold, { at: [0.1, -0.06, 0] });
      if (crest === 'horns') for (const s of [1, -1]) mg.pipe([[0.1, -0.08, s * 0.01], [0.11, 0, s * 0.05], [0.09, 0.09, s * 0.08]], 0.006, m.gold, 16, 6);
      bottom = -0.25;
      break;
    }
    case 'corinthian': {
      const prof = [[0.04, 0], [0.08, -0.015], [0.1, -0.05], [0.106, -0.1], [0.104, -0.16], [0.1, -0.22], [0.11, -0.25]];
      shell(prof, [1.05, 1, 1.05]);
      // eye openings + nose guard drawn as dark inlays
      for (const s of [1, -1]) mg.add(new THREE.SphereGeometry(1, 12, 8).scale(0.006, 0.018, 0.03), m.leatherDark, { at: [0.108, -0.12, s * 0.035] });
      mg.add(roundedBox(0.008, 0.08, 0.014, 0.003, 1), base, { at: [0.11, -0.15, 0] });
      mg.add(roundedBox(0.012, 0.09, 0.012, 0.003, 1), m.leatherDark, { at: [0.11, -0.22, 0] });
      bottom = -0.25;
      break;
    }
    case 'sallet': {
      shell(skull, [1, 1, 1.05]);
      mg.add(lathe([[0.108, 0], [0.13, -0.05], [0.16, -0.07]], 28).rotateY(PI / 2), base, { at: [0, -0.12, 0], scale: [1, 1, 1.05] });
      mg.add(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 30, 1, true, -PI * 0.3, PI * 0.6), base, { at: [0, -0.13, 0], scale: [1, 1, 1.05] }); // visor
      mg.add(roundedBox(0.008, 0.008, 0.12, 0.003, 1), m.leatherDark, { at: [0.11, -0.12, 0] });
      mg.add(roundedBox(0.2, 0.006, 0.006, 0.002, 1), trimMat, { at: [-0.02, 0.003, 0] }); // comb
      bottom = -0.19;
      break;
    }
    case 'bascinet': {
      const prof = [[0.01, 0.06], [0.05, 0.02], [0.085, -0.03], [0.102, -0.08], [0.108, -0.14]];
      shell(prof, [1, 1, 1.05], base, [0, -0.06, 0]);
      // pointed "hounskull" visor
      mg.add(new THREE.ConeGeometry(0.075, 0.13, 20, 1, true).rotateZ(-PI / 2).scale(1, 0.9, 1), base, { at: [0.14, -0.13, 0] });
      for (const s of [1, -1]) mg.add(roundedBox(0.01, 0.006, 0.05, 0.002, 1), m.leatherDark, { at: [0.14, -0.105, s * 0.035], rot: [0, s * 0.4, 0] });
      for (const s of [1, -1]) mg.add(new THREE.SphereGeometry(0.009, 8, 6), trimMat, { at: [0.0, -0.13, s * 0.113] });
      mg.add(new THREE.CylinderGeometry(0.112, 0.125, 0.07, 30, 1, true), m.iron, { at: [0, -0.235, 0], scale: [1, 1, 1.05] }); // mail aventail
      bottom = -0.27;
      break;
    }
    case 'barbute': {
      const prof = [[0.04, 0], [0.08, -0.015], [0.1, -0.05], [0.107, -0.1], [0.106, -0.17], [0.1, -0.24]];
      shell(prof, [1, 1, 1.05]);
      mg.add(roundedBox(0.01, 0.13, 0.03, 0.004, 1), m.leatherDark, { at: [0.104, -0.17, 0] });
      mg.add(roundedBox(0.01, 0.025, 0.12, 0.004, 1), m.leatherDark, { at: [0.104, -0.11, 0] });
      mg.add(roundedBox(0.22, 0.008, 0.008, 0.003, 1), trimMat, { at: [-0.01, 0.003, 0] });
      bottom = -0.24;
      break;
    }
    default: {
      // morion: tall comb + upturned brim
      shell(skull.map(([r, y]) => [r, y * 0.95]), [1.05, 1, 1]);
      mg.add(extrudeOutline([[-0.1, -0.02], [-0.06, 0.04], [0.02, 0.07], [0.08, 0.03], [0.1, -0.02]], 0.006, { bevel: 0.002 }), base, { at: [0, -0.01, 0] });
      const brim = lathe([[0.1, 0], [0.16, -0.005], [0.2, 0.03]], 36);
      brim.scale(1.2, 1, 0.8);
      mg.add(brim, base, { at: [0, -0.112, 0] });
      for (let i = 0; i < 10; i++) mg.add(new THREE.SphereGeometry(0.005, 6, 4), trimMat, { at: [Math.cos((i / 10) * PI * 2) * 0.108 * 1.05, -0.1, Math.sin((i / 10) * PI * 2) * 0.108] });
      bottom = -0.12;
    }
  }
  if (trim === 'ornate') mg.add(new THREE.TorusGeometry(0.109, 0.004, 4, 36).rotateX(PI / 2), m.gold, { at: [0, -0.06, 0], scale: [1.02, 1, 1.1] });
  if (trim === 'ceremonial') {
    if (kind === 'roman' || kind === 'corinthian') {
      // transverse horsehair crest
      for (let i = 0; i < 26; i++) {
        const a = (i / 25) * PI * 0.9 + PI * 0.05;
        mg.add(roundedBox(0.014, 0.13, 0.022, 0.005, 1), m.paintRed, { at: [Math.cos(a) * 0.063, 0.012 + Math.sin(a) * 0.063, 0], rot: [0, 0, a - PI / 2] });
      }
    } else if (kind !== 'kabuto') {
      // feather plume
      for (let i = 0; i < 7; i++) {
        const a = -0.7 + i * 0.22;
        mg.add(new THREE.SphereGeometry(1, 10, 8).scale(0.02, 0.13, 0.03), i % 2 ? m.feather : m.paintRed, { at: [-0.02 + Math.sin(a) * 0.08, 0.1 + Math.cos(a) * 0.04, (i - 3) * 0.008], rot: [0, 0, a] });
      }
      mg.add(new THREE.CylinderGeometry(0.012, 0.016, 0.04, 10), m.gold, { at: [0, 0.018, 0] });
    }
  }
  if (trim === 'battle-worn') {
    const r = rng(kind);
    for (let i = 0; i < 5; i++) mg.add(new THREE.SphereGeometry(0.012, 8, 6).scale(1, 0.4, 1), m.dark, { at: [Math.cos(i * 1.3) * 0.098, -0.05 - r() * 0.04, Math.sin(i * 1.3) * 0.098] });
  }
  mg.flush(g, name);
  return { bottom, fit };
}

/** Wooden head-form on a turned stand; helmet inner crown rests on it. */
function helmetOnStand(ctx, kind) {
  const { m, trim, root } = ctx;
  const g = group('helmet', { parent: root });
  const { fit, bottom } = buildHelmet(g, kind, m, trim);
  if (!ctx.stand) {
    // no stand: the helmet sits upright on its rim on the ground
    restOnGround(root, g, { axis: 'z', split: 'x', range: 0.35 });
    restOnGround(root, g, { axis: 'x', split: 'z', range: 0.35 });
    ctx.anims.push(clip('turn', 8, [rotateTrack(g, 'y', 8, (t) => wave(t) * 0.15)]));
    return;
  }
  // head form turned to the helmet's own inner shape, so the helmet sits on it snugly
  const neckTop = 0.26;
  const depth = Math.min(-bottom, 0.22);
  const headTop = neckTop + depth + 0.04;
  const sm = new Merge();
  sm.add(lathe([[0.11, 0], [0.11, 0.025], [0.07, 0.04], [0.03, 0.06], [0.025, 0.18], [0.04, neckTop - 0.04], [0.05, neckTop]], 28), m.stand);
  const inner = fit.prof.map(([r, y]) => [Math.max(0.001, r - 0.0045), y]).filter(([, y]) => y >= -depth);
  const hp = [[0.045, -depth - 0.04], [Math.max(0.05, inner[inner.length - 1][0] * 0.85), -depth], ...inner.slice().reverse()];
  if (hp[hp.length - 1][0] > 0.002) hp.push([0.001, hp[hp.length - 1][1]]);
  const hg = lathe(hp, 32);
  hg.scale(...fit.s);
  sm.add(hg, m.woodLight, { at: [0, headTop, 0] });
  sm.flush(root, 'stand');
  g.position.y = headTop;
  ctx.anims.push(clip('turn', 8, [rotateTrack(g, 'y', 8, (t) => wave(t) * 0.15)]));
}

/* ------------------------------------------------------------------ */
/* Suits of armour                                                      */
/* ------------------------------------------------------------------ */

const SUITS = ['gothic', 'maximilian', 'samurai', 'roman', 'chainmail', 'viking'];

function suit(ctx, kind) {
  const { m, trim, root } = ctx;
  const plate = metalOf(m, trim, kind === 'roman' ? m.steel : m.steel);
  const accent = trim === 'ornate' || trim === 'ceremonial' ? m.gold : trim === 'rusted' ? m.rust : kind === 'roman' ? m.brass : m.iron;
  const mail = trim === 'rusted' ? m.rust : new THREE.MeshStandardMaterial({ name: 'mail', color: trim === 'bronze' ? '#8a6030' : '#6a6c70', roughness: 0.55, metalness: 0.85 });
  const cloth = trim === 'ceremonial' ? m.silk : kind === 'roman' ? m.paintRed : kind === 'chainmail' ? m.silkBlue : m.burlap;
  const lam = trim === 'ceremonial' ? m.lacquerRed : trim === 'rusted' ? m.rust : m.lacquer;
  const mg = new Merge();
  const plinthH = ctx.stand ? 0.06 : 0;
  // stand (optional): plinth + pole; the suit hangs on the pole and its feet rest on the plinth
  if (ctx.stand) {
    mg.add(roundedBox(0.7, plinthH, 0.55, 0.02, 2), m.stand, { at: [0, plinthH / 2, 0] });
    mg.add(new THREE.CylinderGeometry(0.025, 0.03, 1.5, 12), m.stand, { at: [0, plinthH + 0.75, -0.02] });
  }
  const y0 = plinthH;
  const fluted = kind === 'maximilian' || (kind === 'gothic' && trim === 'ornate');
  const torsoMat = kind === 'chainmail' || kind === 'viking' ? mail : kind === 'samurai' ? lam : plate;
  // legs
  for (const s of [1, -1]) {
    const z = s * 0.1;
    if (kind === 'samurai' || kind === 'roman' || kind === 'viking') {
      // sandals / boots + shin guards + cloth
      mg.add(roundedBox(0.27, 0.06, 0.1, 0.03, 2), m.leatherDark, { at: [0.04, y0 + 0.03, z] });
      mg.add(lathe([[0.05, 0], [0.058, 0.12], [0.062, 0.3], [0.055, 0.42]], 18), kind === 'viking' ? m.burlap : kind === 'samurai' ? m.silkBlue : m.paintRed, { at: [0, y0 + 0.05, z] });
      if (kind !== 'viking') mg.add(lathe([[0.062, 0], [0.068, 0.15], [0.066, 0.32], [0.06, 0.36]], 18, ).scale(1.05, 1, 1), kind === 'samurai' ? lam : plate, { at: [0.005, y0 + 0.08, z] });
      else for (let i = 0; i < 6; i++) mg.add(new THREE.TorusGeometry(0.061, 0.006, 4, 16).rotateX(PI / 2), m.leather, { at: [0, y0 + 0.1 + i * 0.05, z] });
      mg.add(lathe([[0.058, 0], [0.075, 0.12], [0.085, 0.38], [0.09, 0.46]], 18), kind === 'viking' ? m.burlap : kind === 'samurai' ? m.silkBlue : m.paintRed, { at: [0, y0 + 0.45, z] });
    } else {
      // plate sabatons, greaves, poleyns, cuisses
      const toe = kind === 'gothic' ? 0.14 : 0.06;
      mg.add(roundedBox(0.22, 0.07, 0.1, 0.03, 2), plate, { at: [0.04, y0 + 0.035, z] });
      mg.add(new THREE.ConeGeometry(0.045, toe, 12).rotateZ(-PI / 2).scale(1, 0.6, 1), plate, { at: [0.15 + toe / 2, y0 + 0.03, z] });
      for (let i = 0; i < 3; i++) mg.add(new THREE.CylinderGeometry(0.052, 0.052, 0.012, 14, 1, false, 0, PI).rotateZ(PI / 2).rotateX(PI / 2), accent, { at: [0.06 + i * 0.03, y0 + 0.07, z] });
      mg.add(lathe([[0.052, 0], [0.06, 0.1], [0.064, 0.3], [0.055, 0.42]], 20), plate, { at: [0, y0 + 0.05, z] });
      mg.add(new THREE.SphereGeometry(0.062, 16, 10), plate, { at: [0.012, y0 + 0.48, z] });
      mg.add(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 14).rotateZ(PI / 2), accent, { at: [0.068, y0 + 0.48, z] });
      mg.add(lathe([[0.058, 0], [0.072, 0.1], [0.082, 0.36], [0.086, 0.42]], 20), plate, { at: [0, y0 + 0.5, z] });
      if (fluted) for (let k = 0; k < 6; k++) mg.add(roundedBox(0.006, 0.34, 0.006, 0.002, 1), accent, { at: [Math.cos(-0.8 + k * 0.32) * 0.082, y0 + 0.72, z + Math.sin(-0.8 + k * 0.32) * 0.082] });
    }
  }
  const hip = y0 + 0.92;
  // pelvis / fauld / skirt
  if (kind === 'samurai') {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * PI * 2;
      const g = new THREE.BoxGeometry(0.16, 0.26, 0.012);
      for (let r2 = 0; r2 < 4; r2++) mg.add(roundedBox(0.16, 0.06, 0.012, 0.004, 1), lam, { at: [Math.cos(a) * 0.2, hip - 0.05 - r2 * 0.06, Math.sin(a) * 0.17], rot: [0, -a + PI / 2, 0] });
      mg.add(g.translate(0, 0, 0).scale(0.02, 1, 0.5), m.silk, { at: [Math.cos(a) * 0.205, hip - 0.13, Math.sin(a) * 0.175], rot: [0, -a + PI / 2, 0] });
    }
  } else if (kind === 'roman') {
    for (let i = 0; i < 9; i++) mg.add(roundedBox(0.035, 0.2, 0.012, 0.005, 1), m.leather, { at: [0.17, hip - 0.12, -0.14 + i * 0.035] });
    mg.add(lathe([[0.18, 0], [0.2, 0.08], [0.17, 0.2]], 24).scale(1, 1, 0.8), cloth, { at: [0, hip - 0.2, 0] });
  } else if (kind === 'chainmail' || kind === 'viking') {
    mg.add(lathe([[0.25, 0], [0.22, 0.2], [0.19, 0.38]], 28).scale(1, 1, 0.8), mail, { at: [0, hip - 0.36, 0] });
    if (kind === 'chainmail') mg.add(lathe([[0.27, 0], [0.24, 0.3], [0.2, 0.62]], 28).scale(1, 1, 0.82), cloth, { at: [0, hip - 0.4, 0] });
  } else {
    for (let i = 0; i < 4; i++) mg.add(lathe([[0.18 + i * 0.012, 0], [0.18 + i * 0.012, 0.045]], 28).scale(1, 1, 0.8), plate, { at: [0, hip - i * 0.04, 0] });
    for (const s of [1, -1]) mg.add(roundedBox(0.12, 0.18, 0.012, 0.01, 2), plate, { at: [0.15, hip - 0.18, s * 0.11], rot: [0, s * 0.5, -0.1] });
  }
  // torso
  const tor = lathe([[0.17, 0], [0.19, 0.12], [0.2, 0.28], [0.17, 0.42], [0.08, 0.5], [0.05, 0.52]], 32).scale(1, 1, 0.75);
  mg.add(tor, torsoMat, { at: [0, hip, 0] });
  if (kind === 'roman') for (let i = 0; i < 7; i++) mg.add(lathe([[0.18 + (i < 4 ? i * 0.006 : (6 - i) * 0.006), 0], [0.185 + (i < 4 ? i * 0.006 : (6 - i) * 0.006), 0.04]], 30).scale(1, 1, 0.76), plate, { at: [0, hip + i * 0.045, 0] });
  if (kind === 'samurai') for (let i = 0; i < 6; i++) mg.add(lathe([[0.19, 0], [0.195, 0.05]], 30).scale(1.02, 1, 0.78), i % 2 ? lam : m.lacquerRed, { at: [0, hip + 0.02 + i * 0.055, 0] });
  if (kind === 'chainmail') mg.add(tor.clone().scale(1.04, 0.82, 1.04), cloth, { at: [0, hip, 0] });
  if (kind === 'viking') mg.add(new THREE.TorusGeometry(0.2, 0.018, 6, 30).rotateX(PI / 2).scale(1, 0.75, 1), m.leather, { at: [0, hip + 0.06, 0] });
  if (fluted || kind === 'gothic') for (let k = 0; k < 5; k++) mg.add(roundedBox(0.008, 0.36, 0.008, 0.003, 1), accent, { at: [0.18 + Math.cos(-0.5 + k * 0.25) * 0.012, hip + 0.22, -0.1 + k * 0.05], rot: [0, 0, 0.1] });
  if (trim === 'ornate' || trim === 'ceremonial') mg.add(new THREE.TorusGeometry(0.195, 0.006, 4, 32).rotateX(PI / 2).scale(1, 0.76, 1), m.gold, { at: [0, hip + 0.28, 0] });
  // shoulders + arms
  const sh = hip + 0.44;
  for (const s of [1, -1]) {
    const z = s * 0.22;
    if (kind === 'samurai') mg.add(roundedBox(0.2, 0.24, 0.02, 0.01, 2), lam, { at: [0, sh - 0.08, z + s * 0.02], rot: [s * 0.25, 0, 0] });
    else if (kind === 'roman') for (let i = 0; i < 4; i++) mg.add(new THREE.SphereGeometry(0.09 - i * 0.004, 14, 8, 0, PI * 2, 0, PI / 2), plate, { at: [0, sh - i * 0.03, z], scale: [1, 0.5, 1] });
    else if (kind === 'chainmail' || kind === 'viking') mg.add(new THREE.SphereGeometry(0.08, 14, 10), mail, { at: [0, sh - 0.02, z] });
    else {
      const big = kind === 'gothic' ? 0.1 : 0.11;
      mg.add(new THREE.SphereGeometry(big, 16, 10, 0, PI * 2, 0, PI * 0.55), plate, { at: [0, sh - 0.02, z], scale: [1.1, 0.9, 1] });
      for (let i = 1; i < 4; i++) mg.add(new THREE.CylinderGeometry(big * (1 - i * 0.05), big * (1.04 - i * 0.05), 0.03, 18, 1, true), plate, { at: [0, sh - 0.04 - i * 0.03, z], scale: [1.1, 1, 1] });
    }
    // arm hangs slightly forward
    const armMat = kind === 'chainmail' || kind === 'viking' ? mail : kind === 'samurai' ? m.silkBlue : kind === 'roman' ? cloth : plate;
    mg.add(lathe([[0.048, 0], [0.052, 0.12], [0.055, 0.26]], 16), armMat, { at: [0.0, sh - 0.3, z + s * 0.02] });
    mg.add(new THREE.SphereGeometry(0.055, 14, 10), kind === 'samurai' || kind === 'roman' || kind === 'viking' ? armMat : plate, { at: [0.0, sh - 0.31, z + s * 0.02] });
    mg.add(lathe([[0.04, 0], [0.048, 0.12], [0.05, 0.25]], 16), kind === 'roman' || kind === 'viking' ? m.leather : kind === 'samurai' ? lam : plate, { at: [0.04, sh - 0.56, z + s * 0.02], rot: [0, 0, -0.15] });
    // gauntlet / hand
    const handMat = kind === 'roman' || kind === 'viking' || kind === 'samurai' ? m.leatherDark : plate;
    mg.add(roundedBox(0.09, 0.1, 0.05, 0.02, 2), handMat, { at: [0.08, sh - 0.6, z + s * 0.02] });
    for (let f = 0; f < 4; f++) mg.add(roundedBox(0.018, 0.06, 0.018, 0.008, 1), handMat, { at: [0.1 - f * 0.014, sh - 0.67, z + s * 0.035] });
    if (kind === 'gothic' || kind === 'maximilian') mg.add(new THREE.ConeGeometry(0.06, 0.08, 14, 1, true).rotateZ(PI), plate, { at: [0.07, sh - 0.53, z + s * 0.02] });
  }
  // collar / gorget + shoulder bar of the stand
  mg.add(lathe([[0.1, 0], [0.08, 0.04], [0.065, 0.07]], 24).scale(1, 1, 0.9), kind === 'samurai' ? lam : kind === 'chainmail' || kind === 'viking' ? mail : plate, { at: [0, sh + 0.02, 0] });
  if (ctx.stand) mg.add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 10).rotateX(PI / 2), m.stand, { at: [0, sh - 0.02, -0.02] });
  if (kind === 'roman' || kind === 'viking' || kind === 'chainmail') {
    // belt + sword frog
    mg.add(new THREE.TorusGeometry(0.205, 0.014, 6, 30).rotateX(PI / 2).scale(1, 0.77, 1), m.leather, { at: [0, hip + 0.01, 0] });
  }
  if (trim === 'battle-worn') {
    const r = rng(kind);
    for (let i = 0; i < 10; i++) mg.add(new THREE.SphereGeometry(0.014, 8, 6).scale(1, 0.4, 1), m.dark, { at: [0.17 + r() * 0.03, hip + 0.05 + r() * 0.35, (r() - 0.5) * 0.25] });
  }
  if (trim === 'ceremonial') {
    // cape draped from the shoulders
    const cape = new THREE.CylinderGeometry(0.24, 0.34, 1.1, 20, 4, true, PI * 0.6, PI * 0.8);
    mg.add(cape, m.silk, { at: [-0.04, sh - 0.55, 0], scale: [1, 1, 1.1] });
  }
  mg.flush(root, 'armour');
  // helmet on top
  const neckTop = sh + 0.09;
  const hk = { gothic: 'sallet', maximilian: 'barbute', samurai: 'kabuto', roman: 'roman', chainmail: 'great-helm', viking: 'viking' }[kind];
  const hg = group('helmet', { parent: root });
  const hm = new Merge();
  hm.add(new THREE.SphereGeometry(1, 20, 14).scale(0.085, 0.11, 0.095), m.woodLight, { at: [0, neckTop + 0.1, 0] });
  hm.add(new THREE.CylinderGeometry(0.045, 0.05, 0.12, 14), m.woodLight, { at: [0, neckTop, 0] });
  hm.flush(root, 'head_form');
  hg.position.set(0, neckTop + 0.21, 0);
  buildHelmet(hg, hk, m, trim, 'suit_helmet');
  ctx.anims.push(clip('turn', 8, [rotateTrack(hg, 'y', 8, (t) => wave(t) * 0.12)]));
}

/* ------------------------------------------------------------------ */
/* Weapon racks                                                         */
/* ------------------------------------------------------------------ */

const RACKS = ['sword-rack', 'spear-rack', 'barrel-rack', 'armoury-wall', 'shield-rack'];

function weaponRack(ctx, kind) {
  const { m, trim, root } = ctx;
  const wood = trim === 'dark' ? m.woodDark : trim === 'weathered' ? m.ash : trim === 'royal' ? m.lacquerRed : m.wood;
  const metal = trim === 'royal' ? m.gold : m.iron;
  const finishTrim = trim === 'weathered' ? 'battle-worn' : trim === 'royal' ? 'ornate' : null;
  const empty = trim === 'empty';
  const mg = new Merge();
  const place = (type, variant, at, rotZ, rotY = 0) => {
    if (empty) return;
    const g = group(`${type}_${variant}_${at.map((v) => v.toFixed(2)).join('_')}`, { parent: root, at, rot: [0, rotY, rotZ] });
    buildArmsInto(g, type, variant, finishTrim);
  };
  if (kind === 'sword-rack' || kind === 'spear-rack') {
    const L = kind === 'sword-rack' ? 1.1 : 1.3;
    const H = kind === 'sword-rack' ? 0.75 : 1.5;
    mg.add(roundedBox(L, 0.05, 0.4, 0.015, 2), wood, { at: [0, 0.025, 0] });
    mg.add(roundedBox(L - 0.1, 0.05, 0.16, 0.012, 2), wood, { at: [0, 0.075, 0] }); // slotted floor block
    for (const s of [1, -1]) {
      mg.add(roundedBox(0.06, H, 0.06, 0.012, 2), wood, { at: [s * (L / 2 - 0.05), H / 2 + 0.05, 0] });
      mg.add(roundedBox(0.06, 0.06, 0.38, 0.012, 2), wood, { at: [s * (L / 2 - 0.05), 0.08, 0] });
    }
    const barY = H * 0.78;
    mg.add(roundedBox(L - 0.04, 0.06, 0.12, 0.012, 2), wood, { at: [0, barY, 0] });
    if (trim === 'royal') for (const s of [1, -1]) mg.add(new THREE.SphereGeometry(0.04, 14, 10), m.gold, { at: [s * (L / 2 - 0.05), H + 0.07, 0] });
    if (kind === 'sword-rack') {
      const list = ['longsword', 'arming-sword', 'sabre', 'falchion', 'katana'];
      list.forEach((v, i) => {
        const P = ARMS_TABLES.sword[v];
        const x = -L / 2 + 0.17 + i * ((L - 0.34) / (list.length - 1));
        place('sword', v, [x, 0.1 + P.len - 0.003, 0], -PI / 2);
      });
    } else {
      ['spear', 'halberd', 'glaive', 'partisan'].forEach((v, i) => {
        const x = -L / 2 + 0.22 + i * ((L - 0.44) / 3);
        place('polearm', v, [x, 0.1 + 0.04 - 0.003 + 0.04, 0], PI / 2);
      });
    }
  } else if (kind === 'barrel-rack') {
    // open-topped barrel holding swords and spears
    const R = 0.28;
    const H = 0.7;
    mg.add(lathe([[R * 0.88, 0], [R, H * 0.5], [R * 0.88, H], [R * 0.84, H], [R * 0.95, H * 0.5], [R * 0.82, 0.04], [0.001, 0.04], [0.001, 0]], 32), wood);
    for (const y of [0.06, 0.25, H - 0.25, H - 0.06]) mg.add(new THREE.TorusGeometry(R * (0.9 + 0.1 * Math.sin((y / H) * PI)), 0.008, 4, 32).rotateX(PI / 2), metal, { at: [0, y, 0] });
    const items = [['sword', 'longsword'], ['sword', 'sabre'], ['polearm', 'spear'], ['sword', 'claymore'], ['axe', 'dane-axe']];
    items.forEach(([t, v], i) => {
      const a = (i / items.length) * PI * 2;
      const rr = R * 0.5;
      if (t === 'sword') place(t, v, [Math.cos(a) * rr, 0.04 + ARMS_TABLES.sword[v].len - 0.003, Math.sin(a) * rr], -PI / 2 + 0.06, a);
      else place(t, v, [Math.cos(a) * rr, t === 'polearm' ? 0.12 : 0.062, Math.sin(a) * rr], PI / 2 - 0.06, a);
    });
  } else if (kind === 'armoury-wall') {
    // freestanding pegboard wall with crossed weapons and a shield
    const W = 1.4;
    const H = 1.8;
    mg.add(roundedBox(W + 0.2, 0.06, 0.5, 0.015, 2), wood, { at: [0, 0.03, 0] });
    mg.add(roundedBox(W, H, 0.04, 0.01, 2), wood, { at: [0, H / 2 + 0.06, -0.1] });
    for (const s of [1, -1]) mg.add(roundedBox(0.06, 0.4, 0.3, 0.012, 2), wood, { at: [s * (W / 2 - 0.05), 0.26, 0.03] });
    for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) mg.add(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6).rotateX(PI / 2), metal, { at: [-W / 2 + 0.15 + i * ((W - 0.3) / 5), 0.25 + j * 0.2, -0.05] });
    if (!empty) {
      const sh = group('wall_shield', { parent: root, at: [0, 0.95, -0.08 + 0.0] });
      buildShieldInto(sh, 'heater', m, finishTrim);
      for (const s of [1, -1]) {
        const g = group(`wall_axe_${s}`, { parent: root, at: [s * 0.3, 0.6, -0.064], rot: [0, 0, s > 0 ? PI / 2 + 0.5 : PI / 2 - 0.5] });
        buildArmsInto(g, 'axe', 'battle-axe', finishTrim);
      }
    }
  } else {
    // shield-rack: A-frame with three shields leaning
    const L = 1.6;
    mg.add(roundedBox(L, 0.05, 0.6, 0.015, 2), wood, { at: [0, 0.025, 0] });
    for (const s of [1, -1]) {
      mg.add(roundedBox(0.06, 0.95, 0.06, 0.012, 2), wood, { at: [s * (L / 2 - 0.05), 0.5, -0.12], rot: [0.2, 0, 0] });
      mg.add(roundedBox(0.06, 0.06, 0.5, 0.012, 2), wood, { at: [s * (L / 2 - 0.05), 0.08, 0] });
    }
    mg.add(roundedBox(L - 0.04, 0.06, 0.07, 0.012, 2), wood, { at: [0, 0.85, -0.2] });
    mg.add(roundedBox(L - 0.04, 0.05, 0.06, 0.012, 2), wood, { at: [0, 0.075, 0.12] });
    if (!empty) ['round-viking', 'kite', 'heater'].forEach((v, i) => {
      const sh = group(`rack_shield_${i}`, { parent: root, at: [-0.5 + i * 0.5, 0.05, 0.0], rot: [-0.2, 0, 0] });
      buildShieldInto(sh, v, m, finishTrim, 0.85);
    });
  }
  mg.flush(root, 'rack');
}

/** Shield (no stand) into a group with its lowest point at local y = 0, face toward +Z. */
function buildShieldInto(g, variant, m, trim, maxH = 10) {
  const sub = { m, trim, root: g, anims: [], stand: true };
  shield(sub, variant);
  const stand = g.getObjectByName('stand');
  if (stand) g.remove(stand);
  const sg = g.getObjectByName('shield');
  sg.rotation.x = 0;
  sg.position.y = 0;
  sg.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(sg);
  const k = Math.min(1, maxH / (box.max.y - box.min.y));
  sg.scale.setScalar(k);
  sg.position.y = -box.min.y * k;
  sg.position.z = -box.min.z * k; // back face at z = 0 (rests against what is behind)
}

/* ------------------------------------------------------------------ */
/* Training dummies                                                     */
/* ------------------------------------------------------------------ */

const DUMMIES = ['straw', 'wooden-pell', 'quintain', 'wing-chun', 'archery-target'];

function dummy(ctx, kind) {
  const { m, trim, root } = ctx;
  const wood = trim === 'weathered' ? m.ash : m.wood;
  const straw = m.straw;
  const mg = new Merge();
  const sack = trim === 'cut-up' ? m.burlap : m.burlap;
  if (kind === 'straw' || kind === 'quintain') {
    // cross base + post
    for (const r of [0, PI / 2]) mg.add(roundedBox(0.9, 0.08, 0.1, 0.02, 2), wood, { at: [0, 0.04, 0], rot: [0, r, 0] });
    for (let i = 0; i < 4; i++) mg.add(new THREE.BoxGeometry(0.06, 0.25, 0.06).rotateZ(0.6), wood, { at: [Math.cos((i * PI) / 2) * 0.12, 0.17, Math.sin((i * PI) / 2) * 0.12], rot: [0, -(i * PI) / 2, 0] });
    mg.add(new THREE.CylinderGeometry(0.05, 0.055, kind === 'quintain' ? 1.8 : 1.7, 12), wood, { at: [0, kind === 'quintain' ? 0.98 : 0.93, 0] });
  }
  if (kind === 'straw') {
    // burlap torso stuffed with straw + head + crossbar arms
    mg.add(cushion(0.42, 0.62, 0.3, { bulge: 0.35 }), sack, { at: [0, 1.25, 0] });
    for (let i = 0; i < 3; i++) mg.add(new THREE.TorusGeometry(0.2, 0.012, 4, 20).rotateX(PI / 2).scale(1, 0.75, 1), m.cord, { at: [0, 1.05 + i * 0.2, 0] });
    mg.add(new THREE.SphereGeometry(0.13, 18, 12), sack, { at: [0, 1.68, 0] });
    mg.add(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10).rotateX(PI / 2), wood, { at: [0, 1.45, 0] });
    for (const s of [1, -1]) mg.add(cushion(0.13, 0.13, 0.36, { bulge: 0.3 }), sack, { at: [0, 1.45, s * 0.4] });
    if (trim === 'cut-up') {
      const r = rng('straw');
      for (let i = 0; i < 30; i++) mg.add(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4), straw, { at: [0.15 + r() * 0.06, 1.1 + r() * 0.3, (r() - 0.5) * 0.2], rot: [r() * 2, 0, r() * 2] });
      for (let i = 0; i < 20; i++) mg.add(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4), straw, { at: [(r() - 0.5) * 0.6, 0.085, (r() - 0.5) * 0.6], rot: [PI / 2, r() * 3, 0] });
    }
  } else if (kind === 'wooden-pell') {
    mg.add(roundedBox(0.7, 0.1, 0.7, 0.02, 2), wood, { at: [0, 0.05, 0] });
    mg.add(lathe([[0.11, 0], [0.105, 1.6], [0.09, 1.65], [0.001, 1.67]], 20), trim === 'cut-up' ? m.woodDark : wood, { at: [0, 0.1, 0] });
    const r = rng('pell');
    const cuts = trim === 'cut-up' ? 40 : trim === 'weathered' ? 20 : 8;
    for (let i = 0; i < cuts; i++) {
      const a = r() * PI * 0.6 - 0.3;
      mg.add(new THREE.BoxGeometry(0.06, 0.004, 0.004), m.woodDark, { at: [Math.cos(a) * 0.107, 0.5 + r() * 1.0, Math.sin(a) * 0.107], rot: [0, -a, (r() - 0.5) * 1.2] });
    }
    for (const y of [0.3, 1.6]) mg.add(new THREE.TorusGeometry(0.108, 0.01, 4, 24).rotateX(PI / 2), m.iron, { at: [0, y, 0] });
  } else if (kind === 'quintain') {
    mg.add(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 14), m.iron, { at: [0, 1.88, 0] });
    const arm = group('quintain_arm', { parent: root, at: [0, 1.95, 0] });
    const am = new Merge();
    am.add(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 14), m.iron, { at: [0, -0.02, 0] });
    am.add(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 12).rotateZ(PI / 2), wood, { at: [0.1, 0.03, 0] });
    // target shield on one end, sandbag on a chain at the other
    am.add(roundedBox(0.04, 0.5, 0.4, 0.02, 2), m.paintRed, { at: [0.92, -0.18, 0] });
    am.add(new THREE.CylinderGeometry(0.11, 0.11, 0.045, 24).rotateZ(PI / 2), m.paintWhite, { at: [0.94, -0.18, 0] });
    am.add(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 20).rotateZ(PI / 2), m.paintRed, { at: [0.95, -0.18, 0] });
    for (let i = 0; i < 5; i++) am.add(new THREE.TorusGeometry(0.02, 0.005, 4, 10), m.iron, { at: [-0.66, -0.01 - i * 0.035, 0], rot: [0, i % 2 ? PI / 2 : 0, 0] });
    am.add(cushion(0.2, 0.32, 0.2, { bulge: 0.4 }), m.burlap, { at: [-0.66, -0.33, 0] });
    am.flush(arm, 'quintain_arm_body');
    ctx.anims.push(clip('spin', 3, [rotateTrack(arm, 'y', 3, (t) => t * PI * 2)]));
  } else if (kind === 'wing-chun') {
    // wooden man: trunk on two cross slats in a frame, three arms + one leg
    const Hf = 1.7;
    for (const s of [1, -1]) {
      mg.add(roundedBox(0.08, Hf, 0.08, 0.015, 2), wood, { at: [s * 0.55, Hf / 2, -0.3] });
      mg.add(roundedBox(0.08, 0.08, 0.5, 0.015, 2), wood, { at: [s * 0.55, 0.04, -0.1] });
    }
    for (const y of [0.45, 1.45]) mg.add(roundedBox(1.18, 0.06, 0.06, 0.015, 2), wood, { at: [0, y, -0.3] });
    for (const y of [0.45, 1.45]) mg.add(roundedBox(0.06, 0.06, 0.3, 0.015, 2), wood, { at: [0, y, -0.15] });
    mg.add(lathe([[0.12, 0], [0.12, 1.2], [0.1, 1.24]], 22), wood, { at: [0, 0.32, 0] });
    for (const s of [1, -1]) mg.add(new THREE.CylinderGeometry(0.025, 0.03, 0.46, 10).rotateX(PI / 2).rotateY(s * 0.4), wood, { at: [s * 0.1, 1.25, 0.28] });
    mg.add(new THREE.CylinderGeometry(0.025, 0.03, 0.4, 10).rotateX(PI / 2), wood, { at: [0, 1.0, 0.3] });
    mg.pipe([[0, 0.65, 0.1], [0, 0.6, 0.35], [0.05, 0.38, 0.48]], 0.035, wood, 16, 10);
  } else {
    // archery target: straw boss on a tripod easel
    const r2 = 0.6;
    const boss = group('target', { parent: root, at: [0, 0.95, 0.12], rot: [-0.25, 0, 0] });
    const bm = new Merge();
    bm.add(new THREE.CylinderGeometry(r2, r2, 0.2, 40).rotateX(PI / 2), straw);
    for (let i = 0; i < 6; i++) bm.add(new THREE.TorusGeometry(r2 - 0.005, 0.01, 4, 40), m.cord, { at: [0, 0, -0.08 + i * 0.032] });
    const face = [m.paintWhite, m.paintBlack, m.paintBlue, m.paintRed, m.paintYellow];
    face.forEach((mat, i) => bm.add(new THREE.CylinderGeometry(r2 * (1 - i * 0.19) - 0.02, r2 * (1 - i * 0.19) - 0.02, 0.004, 40).rotateX(PI / 2), mat, { at: [0, 0, 0.1 + i * 0.002] }));
    if (trim !== 'weathered') {
      const rr = rng('arrows');
      for (let i = 0; i < 5; i++) {
        const a = rr() * PI * 2;
        const d = rr() * r2 * 0.5;
        bm.add(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 5).rotateX(PI / 2), m.ash, { at: [Math.cos(a) * d, Math.sin(a) * d, 0.32] });
        for (let k = 0; k < 3; k++) bm.add(new THREE.BoxGeometry(0.001, 0.025, 0.08).rotateZ((k / 3) * PI), k ? m.feather : m.paintRed, { at: [Math.cos(a) * d, Math.sin(a) * d, 0.52] });
      }
    }
    bm.flush(boss, 'target_body');
    // tripod legs meeting the boss
    for (const [x, z] of [[-0.45, 0.35], [0.45, 0.35]]) mg.tube([x, 0, z], [x * 0.6, 1.0, 0.06], 0.03, wood, 10);
    mg.tube([0, 0, -0.6], [0, 1.4, 0.02], 0.03, wood, 10);
    mg.tube([-0.5, 0.42, 0.21], [0.5, 0.42, 0.21], 0.025, wood, 10);
  }
  if (trim === 'armoured' && kind !== 'archery-target') {
    if (kind !== 'quintain') {
    // battered helmet + breastplate strapped on
    const hy = kind === 'straw' ? 1.81 : kind === 'wooden-pell' ? 1.77 : kind === 'wing-chun' ? 1.56 : 2.06;
    const h = group('dummy_helmet', { parent: root, at: [0, hy, 0] });
    buildHelmet(h, kind === 'wing-chun' ? 'kabuto' : 'barbute', m, 'battle-worn', 'dummy_helm');
    }
    const by = kind === 'straw' ? 1.15 : kind === 'wooden-pell' ? 1.15 : kind === 'wing-chun' ? 0.95 : 1.4;
    const br = kind === 'straw' ? 0.2 : kind === 'wing-chun' ? 0.11 : kind === 'quintain' ? 0.045 : 0.1;
    mg.add(new THREE.CylinderGeometry(br + 0.012, br + 0.03, 0.4, 24, 1, true, -PI / 2, PI).scale(1, 1, kind === 'straw' ? 0.75 : 1), m.steel, { at: [0, by + 0.2, 0] });
    mg.add(new THREE.TorusGeometry(br + 0.015, 0.01, 4, 24).rotateX(PI / 2).scale(1, kind === 'straw' ? 0.75 : 1, 1), m.leather, { at: [0, by + 0.1, 0] });
  }
  if (trim === 'practice-marks' && kind !== 'archery-target') {
    // painted target zones
    const zy = kind === 'straw' ? 1.3 : kind === 'wing-chun' ? 1.0 : 1.2;
    const zr = kind === 'straw' ? 0.21 : kind === 'quintain' ? 0.045 : kind === 'wing-chun' ? 0.115 : 0.1;
    for (const [dy, c] of [[0.2, m.paintRed], [0, m.paintWhite], [-0.25, m.paintRed]]) mg.add(new THREE.CylinderGeometry(0.04, 0.04, 0.006, 20).rotateZ(PI / 2), c, { at: [zr + 0.012, zy + dy, 0] });
  }
  if (trim === 'snowy') {
    mg.add(cushion(0.4, 0.04, 0.4, { bulge: 0.6 }), m.paintWhite, { at: [0, 0.1, 0] });
  }
  mg.flush(root, 'dummy');
  if (!ctx.anims.length) ctx.anims.push(clip('hit', 1.2, [rotateTrack(root.getObjectByName('dummy'), 'z', 1.2, (t) => Math.sin(t * PI * 2) * Math.exp(-t * 3) * 0.02)]));
}

/* ------------------------------------------------------------------ */
/* Factories                                                            */
/* ------------------------------------------------------------------ */

export const ARMOUR_VARIANTS = { shield: Object.keys(SHIELDS), helmet: HELMETS, 'armour-suit': SUITS, 'weapon-rack': RACKS, 'training-dummy': DUMMIES };

const BUILD = {
  shield: (ctx, v) => shield(ctx, v),
  helmet: (ctx, v) => helmetOnStand(ctx, v),
  'armour-suit': (ctx, v) => suit(ctx, v),
  'weapon-rack': (ctx, v) => weaponRack(ctx, v),
  'training-dummy': (ctx, v) => dummy(ctx, v),
};

function makeArmour(type) {
  const variants = Object.fromEntries(ARMOUR_VARIANTS[type].map((v) => [v, true]));
  return (options = {}) => {
    const o = normalizeOptions(options);
    const variant = pickVariant(variants, o.variant, type);
    const trim = o.trim ?? null;
    const m = armsMats(finishName(trim));
    const root = group(`${type}-${variant}${trim ? `-${trim}` : ''}`);
    const ctx = { m, trim, root, anims: [], variant, stand: !!o.stand };
    BUILD[type](ctx, variant);
    return finalize(root, { type, variant, options: o, animations: ctx.anims });
  };
}

export const createShield = makeArmour('shield');
export const createHelmet = makeArmour('helmet');
export const createArmourSuit = makeArmour('armour-suit');
export const createWeaponRack = makeArmour('weapon-rack');
export const createTrainingDummy = makeArmour('training-dummy');
void jitter;
