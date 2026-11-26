import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, curveTube, lathe, rng, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, clip, wave } from '../../core/animation.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { mats, pole, textTexture, emblem, tube, densify } from './common.js';
import { finish, styleOf } from './kit.js';
import { signPlate } from './lights.js';

/* Street infrastructure: manholes, drains, speed bumps, utility poles,
 * cabinets, CCTV, rail crossings, clocks, flag poles and monuments. */

const iron = (c = '#2b2b2b') => new THREE.MeshStandardMaterial({ color: M.toColor(c), metalness: 0.7, roughness: 0.6, name: 'cast-iron' });

/** Square tile of asphalt the flush ground items sit in (so they read at a glance). */
function asphaltPad(root, w, d) {
  mesh(roundedBox(w, 0.02, d, 0.006), new THREE.MeshStandardMaterial({ color: '#3a3b3d', roughness: 0.95, name: 'asphalt' }), { parent: root, at: [0, 0.01, 0] });
  return 0.02;
}

/** Cast-iron cover pattern: concentric rings, radial ribs and lettering. */
function coverTexture(text, square) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#3a3a3a';
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#555';
  g.lineWidth = 10;
  if (square) {
    for (let i = 40; i < 512; i += 40) { g.beginPath(); g.moveTo(i, 20); g.lineTo(i, 492); g.stroke(); g.beginPath(); g.moveTo(20, i); g.lineTo(492, i); g.stroke(); }
  } else {
    for (let r = 60; r < 250; r += 45) { g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke(); }
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; g.beginPath(); g.moveTo(256 + Math.cos(a) * 60, 256 + Math.sin(a) * 60); g.lineTo(256 + Math.cos(a) * 240, 256 + Math.sin(a) * 240); g.stroke(); }
  }
  g.fillStyle = '#3a3a3a';
  g.fillRect(120, 220, 272, 72);
  g.fillStyle = '#6a6a6a';
  g.font = 'bold 54px Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 256, 258);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* -------------------------------- Manhole -------------------------------- */

export const MANHOLE_VARIANTS = { sewer: {}, storm: {}, utility: {}, telecom: {} };

export function createManhole(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(MANHOLE_VARIANTS, o.variant, 'manhole');
  const style = styleOf(o);
  const root = group(`manhole-${variant}`);
  const y = asphaltPad(root, 1.6, 1.6);
  const square = variant === 'utility' || variant === 'telecom';
  const tex = coverTexture({ sewer: 'SEWER', storm: 'STORM', utility: 'WATER', telecom: 'TELECOM' }[variant], square);
  const top = new THREE.MeshStandardMaterial({ color: tex ? '#ffffff' : '#3a3a3a', map: tex, metalness: 0.6, roughness: 0.6, name: 'cast-iron' });
  const open = style === 'open';
  if (square) {
    const S = variant === 'telecom' ? 0.6 : 0.8;
    mesh(roundedBox(S + 0.12, 0.022, S + 0.12, 0.005), iron('#4a4a4a'), { parent: root, at: [0, y + 0.002, 0] });
    if (!open) mesh(new THREE.PlaneGeometry(S, S).rotateX(-Math.PI / 2), top, { parent: root, at: [0, y + 0.0135, 0] });
    else {
      mesh(new THREE.PlaneGeometry(S, S).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#050505' }), { parent: root, at: [0, y + 0.0135, 0] });
      const lid = mesh(roundedBox(S, 0.02, S, 0.004), top, { parent: root, at: [S * 0.95, y + 0.022, 0.1] });
      lid.rotation.y = 0.3;
    }
  } else {
    const R = variant === 'storm' ? 0.36 : 0.32;
    mesh(lathe([[R - 0.01, 0], [R + 0.08, 0], [R + 0.08, 0.012], [R - 0.01, 0.012]], 40), iron('#4a4a4a'), { parent: root, at: [0, y, 0] });
    if (!open) {
      const g = new THREE.CircleGeometry(R, 40);
      g.rotateX(-Math.PI / 2);
      mesh(g, top, { parent: root, at: [0, y + 0.011, 0] });
      if (variant === 'storm') for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        mesh(roundedBox(0.04, 0.004, 0.12, 0.002), new THREE.MeshBasicMaterial({ color: '#050505' }), { parent: root, at: [Math.cos(a) * R * 0.7, y + 0.012, Math.sin(a) * R * 0.7], rot: [0, -a, 0] });
      }
    } else {
      // open shaft with ladder rungs going down + cover propped aside
      mesh(new THREE.CircleGeometry(R, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#050505' }), { parent: root, at: [0, y + 0.011, 0] });
      for (let i = 0; i < 2; i++) mesh(new THREE.TorusGeometry(0.12, 0.012, 6, 16, Math.PI), M.metal('#888', 0.4), { parent: root, at: [0, y + 0.013, -R + 0.05], rot: [-Math.PI / 2, 0, 0] });
      mesh(new THREE.CylinderGeometry(R, R, 0.03, 40), top, { parent: root, at: [R * 2.1, y + 0.015, 0.1] });
    }
  }
  if (style === 'open' || style === 'barriers') {
    // fold-up guard barrier around the opening
    const m = mats.powder('#f2c200');
    const r = square ? 0.6 : 0.55;
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      tube([Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * r, y + 1.0, Math.sin(a) * r], 0.02, m, { parent: root });
    }
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const b = ((k + 1) / 4) * Math.PI * 2 + Math.PI / 4;
      for (const h of [0.5, 0.98]) tube([Math.cos(a) * r, y + h, Math.sin(a) * r], [Math.cos(b) * r, y + h, Math.sin(b) * r], 0.016, k % 2 ? m : mats.powder('#d32f2f'), { parent: root });
    }
  }
  if (style === 'steaming') {
    // wisps of steam rising from the vents
    const steam = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.18, depthWrite: false, name: 'steam' });
    for (let i = 0; i < 6; i++) mesh(new THREE.SphereGeometry(0.15 + i * 0.05, 12, 8), steam, { parent: root, at: [Math.sin(i) * 0.08, y + 0.15 + i * 0.22, Math.cos(i * 1.3) * 0.08], name: i ? `steam_${i}` : 'steam' }).userData.detached = true;
  }
  const obj = finish(root, { type: 'manhole', variant, o, animations: [], lean: false, handled: ['damaged'] });
  return obj;
}

/* ------------------------------ Storm drain ------------------------------ */

export const STORM_DRAIN_VARIANTS = { 'curb-inlet': {}, grate: {}, trench: {} };

export function createStormDrain(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(STORM_DRAIN_VARIANTS, o.variant, 'storm-drain');
  const style = styleOf(o);
  const root = group(`storm-drain-${variant}`);
  const y = asphaltPad(root, 2.0, 1.4);
  const dark = new THREE.MeshBasicMaterial({ color: '#060606' });
  const grateM = iron('#3a3a3a');
  if (variant === 'curb-inlet') {
    // kerb with an opening + concrete apron
    mesh(roundedBox(2.0, 0.16, 0.3, 0.03), mats.concrete('#a9a49c'), { parent: root, at: [0, 0.08, -0.55] });
    mesh(roundedBox(1.0, 0.09, 0.02, 0.005), dark, { parent: root, at: [0, 0.07, -0.399] });
    mesh(roundedBox(1.3, 0.03, 0.5, 0.01), mats.concrete('#b9b5ae'), { parent: root, at: [0, y + 0.005, -0.15] });
    mesh(roundedBox(1.0, 0.05, 0.05, 0.01), mats.concrete('#a9a49c'), { parent: root, at: [0, 0.135, -0.4] });
    const tex = textTexture('NO DUMPING · DRAINS TO RIVER', { w: 512, h: 48, bg: '#1565c0', fg: '#ffffff', font: 'bold 26px Arial', radius: 4 });
    if (tex) mesh(new THREE.PlaneGeometry(0.6, 0.055), new THREE.MeshStandardMaterial({ map: tex }), { parent: root, at: [0, 0.135, -0.374] });
  } else if (variant === 'grate') {
    mesh(roundedBox(0.7, 0.025, 0.5, 0.005), grateM, { parent: root, at: [0, y + 0.002, 0] });
    for (let i = 0; i < 9; i++) mesh(new THREE.PlaneGeometry(0.035, 0.42).rotateX(-Math.PI / 2), dark, { parent: root, at: [-0.28 + i * 0.07, y + 0.0155, 0] });
  } else {
    // long slot channel drain across a driveway
    mesh(roundedBox(2.0, 0.025, 0.2, 0.005), mats.concrete('#9a958e'), { parent: root, at: [0, y + 0.002, 0] });
    for (let i = 0; i < 20; i++) mesh(new THREE.PlaneGeometry(0.06, 0.1).rotateX(-Math.PI / 2), dark, { parent: root, at: [-0.95 + i * 0.1, y + 0.0155, 0] });
  }
  if (style === 'clogged') {
    const rand = rng(5);
    const cols = ['#a0662a', '#7a5a2a', '#c9a227', '#6b4a2e'];
    const leaf = new THREE.InstancedMesh(new THREE.CircleGeometry(0.05, 5), new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide, name: 'leaves' }), 140);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    for (let i = 0; i < 140; i++) {
      q.setFromEuler(new THREE.Euler(-Math.PI / 2 + (rand() - 0.5) * 0.4, 0, rand() * 6));
      m4.compose(new THREE.Vector3((rand() - 0.5) * 1.2, y + 0.02 + rand() * 0.02, (rand() - 0.5) * 0.6), q, new THREE.Vector3(1, 1.3, 1));
      leaf.setMatrixAt(i, m4);
      leaf.setColorAt(i, c.set(cols[i % 4]));
    }
    root.add(leaf);
    mesh(lathe([[0.001, 0], [0.04, 0], [0.04, 0.11], [0.012, 0.12], [0.001, 0.12]], 12), M.plastic('#2e7d32', 0.3), { parent: root, at: [0.3, y + 0.04, 0.1], rot: [0, 0, Math.PI / 2] });
  }
  return finish(root, { type: 'storm-drain', variant, o, animations: [], lean: false, handled: ['damaged'] });
}

/* ------------------------------ Speed bump ------------------------------ */

export const SPEED_BUMP_VARIANTS = { rubber: {}, hump: {}, cushion: {}, table: {} };

export function createSpeedBump(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SPEED_BUMP_VARIANTS, o.variant, 'speed-bump');
  const style = styleOf(o);
  const root = group(`speed-bump-${variant}`);
  const W = variant === 'cushion' ? 1.8 : 3.6;
  if (variant === 'rubber') {
    // bolt-down rubber segments, yellow/black
    for (let i = 0; i < 7; i++) {
      const prof = new THREE.Shape();
      prof.moveTo(-0.17, 0); prof.quadraticCurveTo(-0.1, 0.06, 0, 0.06); prof.quadraticCurveTo(0.1, 0.06, 0.17, 0); prof.closePath();
      const g = new THREE.ExtrudeGeometry(prof, { depth: 0.48, bevelEnabled: false, curveSegments: 8 });
      g.translate(0, 0, -0.24);
      g.rotateY(Math.PI / 2);
      mesh(g, new THREE.MeshStandardMaterial({ color: i % 2 ? '#f2c200' : '#1a1a1a', roughness: 0.8, name: 'rubber' }), { parent: root, at: [-1.5 + i * 0.5, 0, 0] });
      for (const z of [-0.08, 0.08]) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 6), M.metal('#888', 0.4), { parent: root, at: [-1.5 + i * 0.5 + (i % 2 ? 0 : 0.05), 0.058, z] });
    }
  } else {
    const asphalt = new THREE.MeshStandardMaterial({ color: '#3a3b3d', roughness: 0.95, name: 'asphalt' });
    const D = variant === 'table' ? 6 : variant === 'hump' ? 3.7 : 2.4;
    const H = variant === 'table' ? 0.1 : 0.08;
    const g = new THREE.PlaneGeometry(W, D, 1, 40);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i) / (D / 2);
      let h;
      if (variant === 'table') h = Math.abs(z) < 0.6 ? H : H * (1 - (Math.abs(z) - 0.6) / 0.4);
      else h = H * Math.cos((z * Math.PI) / 2) ** 2;
      p.setY(i, h + 0.005);
    }
    g.computeVertexNormals();
    mesh(g, asphalt, { parent: root });
    mesh(roundedBox(W, 0.005, D, 0.001), asphalt, { parent: root, at: [0, 0.0025, 0] });
    // white chevrons painted on the ramp
    const paint = new THREE.MeshStandardMaterial({ color: '#efefe9', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, name: 'paint-white' });
    for (let i = 0; i < 3; i++) for (const s of [1, -1]) {
      const z = s * D * 0.28;
      const c = mesh(new THREE.PlaneGeometry(0.15, 0.7).rotateX(-Math.PI / 2), paint, { parent: root, at: [-W / 3 + i * (W / 3), (variant === 'table' ? H * 0.65 : H * 0.55) + 0.008, z] });
      c.rotation.y = s * 0.7;
    }
    if (variant === 'table') {
      // a zebra crossing on top of the table
      for (let i = 0; i < Math.floor(W / 0.9); i++) mesh(new THREE.PlaneGeometry(0.5, 2.6).rotateX(-Math.PI / 2), paint, { parent: root, at: [-W / 2 + 0.45 + i * 0.9, H + 0.007, 0] });
    }
  }
  if (style === 'signed') {
    const { group: plate, h } = signPlate('speed-hump', {}, 0.8);
    const post = group(null, { parent: root, at: [W / 2 + 0.6, 0, 0] });
    mesh(roundedBox(0.05, 2.1 + h, 0.05, 0.012), mats.galv(), { parent: post, at: [0, (2.1 + h) / 2, 0] });
    plate.position.set(0, 2.1 + h / 2 - 0.02, 0.031);
    post.add(plate);
  }
  return finish(root, { type: 'speed-bump', variant, o, animations: [], lean: false, handled: ['damaged'] });
}

/* ------------------------------- Power pole ------------------------------- */

export const POWER_POLE_VARIANTS = { wooden: {}, concrete: {}, transformer: {}, steel: {} };

export function createPowerPole(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(POWER_POLE_VARIANTS, o.variant, 'power-pole');
  const style = styleOf(o);
  const root = group(`power-pole-${variant}`);
  const H = variant === 'steel' ? 12 : 10;
  const wood = new THREE.MeshStandardMaterial({ color: '#5b4636', roughness: 0.95, name: 'creosote' });
  const shaft = variant === 'concrete' ? mats.concrete('#b4afa7') : variant === 'steel' ? mats.galv() : wood;
  // shaft with its climbing steps merged in (one mesh, two materials)
  const shaftGeo = lathe(densify([[0.001, 0], [0.16, 0], [0.12, H], [0.001, H]], 0.5), 16).toNonIndexed();
  const parts = [shaftGeo];
  if (variant !== 'steel') for (let i = 0; i < 10; i++) parts.push(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6).rotateZ(Math.PI / 2).translate((i % 2 ? 1 : -1) * 0.2, 2.6 + i * 0.4, 0).toNonIndexed());
  for (const g of parts) { g.deleteAttribute('uv'); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); }
  const merged = parts.length > 1 ? mergeGeometries([parts[0], mergeGeometries(parts.slice(1))], true) : shaftGeo;
  mesh(merged, parts.length > 1 ? [shaft, M.metal('#777', 0.4)] : shaft, { parent: root });
  const ins = new THREE.MeshPhysicalMaterial({ color: variant === 'steel' ? '#d8d4cc' : '#5a8a4a', roughness: 0.2, clearcoat: 1, name: 'insulator' });
  // cross-arm(s) with insulators
  const arms = variant === 'steel' ? [H - 0.3, H - 1.6] : [H - 0.4];
  const wireEnds = [];
  for (const y of arms) {
    mesh(roundedBox(0.1, 0.1, 2.4, 0.015), variant === 'steel' ? mats.galv() : wood, { parent: root, at: [0, y, 0] });
    for (const s of [1, -1]) tube([0, y - 0.6, 0], [0, y - 0.05, s * 0.8], 0.02, M.metal('#777', 0.4), { parent: root });
    for (const z of [-1.05, -0.35, 0.35, 1.05]) {
      if (variant === 'steel' && Math.abs(z) < 0.5) continue;
      const stack = variant === 'steel' ? 5 : 3;
      mesh(new THREE.CylinderGeometry(0.018, 0.018, stack * 0.045 + 0.02, 10), ins, { parent: root, at: [0, y + 0.05 + (stack * 0.045 + 0.02) / 2, z] });
      for (let k = 0; k < stack; k++) mesh(new THREE.CylinderGeometry(0.07 - k * 0.004, 0.07 - k * 0.004, 0.025, 16), ins, { parent: root, at: [0, y + 0.08 + k * 0.045, z] });
      wireEnds.push([0, y + 0.08 + stack * 0.045, z]);
    }
  }
  // sagging conductors running off both sides (cut short, ends taped)
  const cable = new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.6, name: 'cable' });
  for (const [x, y, z] of wireEnds) {
    const pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20 - 0.5; pts.push([t * 8, y - 0.004 - (0.25 - t * t) * 0.8 + 0.2, z]); }
    curveTube(pts, 0.008, cable, { parent: root, segments: 40, radialSegments: 5 });
  }
  if (variant === 'transformer') {
    // pole-mounted transformer can + fuse cutouts
    const can = mats.powder('#8e9296');
    mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 24), can, { parent: root, at: [0.45, H - 2.3, 0] });
    mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 24), can, { parent: root, at: [0.45, H - 1.83, 0] });
    for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.25, 12), ins, { parent: root, at: [0.45 + s * 0.12, H - 1.68, 0] });
    mesh(roundedBox(0.16, 0.5, 0.1, 0.02), M.metal('#555', 0.5), { parent: root, at: [0.18, H - 2.3, 0] });
    for (const s of [1, -1]) curveTube([[0.45 + s * 0.12, H - 1.56, 0], [0.2, H - 0.9, s * 0.2], [0, H - 0.34, s * 0.35]], 0.01, cable, { parent: root, segments: 16 });
  }
  if (variant !== 'steel') {
    // climbing steps + ID tag
    const tag = textTexture('P-4471', { w: 128, h: 64, bg: '#f2c200', fg: '#111', font: 'bold 34px Arial', radius: 4 });
    if (tag) mesh(new THREE.PlaneGeometry(0.12, 0.06), new THREE.MeshStandardMaterial({ map: tag }), { parent: root, at: [0, 1.8, 0.1545] });
  }
  if (style === 'streetlight') {
    const lamp = lampGroup('lamp', 'white');
    lamp.lens.emissive.set('#ffd9a0');
    curveTube([[0, H - 2.6, 0.1], [0, H - 2.3, 0.8], [0, H - 2.25, 1.6]], 0.035, M.metal('#9aa0a6', 0.4), { parent: root, radialSegments: 10 });
    const head = group(null, { parent: root, at: [0, H - 2.3, 1.7] });
    mesh(lathe([[0.001, 0], [0.16, 0], [0.17, 0.05], [0.12, 0.11], [0.001, 0.13]], 24).scale(1, 1, 1.9), M.metal('#9aa0a6', 0.4), { parent: head });
    lamp.add(head, { geometry: new THREE.SphereGeometry(0.15, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(1, 0.5, 1.8), normal: [0, -1, 0], depth: 0.05, glowSize: 1.2 });
  }
  if (style === 'birds') {
    // pigeons on the wire
    const bird = new THREE.MeshStandardMaterial({ color: '#6b6e73', roughness: 0.8 });
    const [x, y, z] = wireEnds[0];
    for (let i = 0; i < 5; i++) {
      const t = (i - 2) * 0.7;
      const yy = y + 0.02 - (0.25 - (t / 8) ** 2) * 0.8 + 0.2;
      const b = group(null, { parent: root, at: [t, yy + 0.06, z] });
      mesh(new THREE.SphereGeometry(0.06, 12, 8).scale(1.3, 1, 1), bird, { parent: b });
      mesh(new THREE.SphereGeometry(0.035, 10, 8), bird, { parent: b, at: [0.07, 0.05, 0] });
      void x;
    }
  }
  const animations = style === 'streetlight' ? [clip('lights', 1, lampTracks('lamp', 4))] : [];
  return finish(root, { type: 'power-pole', variant, o, animations, lean: true });
}

/* ------------------------------- Utility box ------------------------------- */

export const UTILITY_BOX_VARIANTS = { 'pad-mount': { color: '#3e5a3a' }, 'signal-cabinet': { color: '#9aa0a6' }, telecom: { color: '#5a6a5a' } };

export function createUtilityBox(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(UTILITY_BOX_VARIANTS, o.variant, 'utility-box');
  const v = UTILITY_BOX_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`utility-box-${variant}`);
  const paint = mats.powder(o.color ?? v.color);
  paint.name = 'paint';
  const dims = { 'pad-mount': [1.6, 1.2, 1.4], 'signal-cabinet': [0.8, 1.5, 0.55], telecom: [1.0, 1.2, 0.4] }[variant];
  const [W, H, D] = dims;
  mesh(roundedBox(W + 0.2, 0.12, D + 0.2, 0.03), mats.concrete(), { parent: root, at: [0, 0.06, 0] });
  mesh(roundedBox(W, H, D, 0.03), paint, { parent: root, at: [0, 0.12 + H / 2, 0] });
  if (variant === 'signal-cabinet') {
    // rain hood + vents
    mesh(roundedBox(W + 0.06, 0.05, D + 0.08, 0.015), paint, { parent: root, at: [0, 0.12 + H + 0.025, 0] });
    for (let i = 0; i < 6; i++) mesh(roundedBox(W * 0.6, 0.012, 0.012, 0.004), M.plastic('#333'), { parent: root, at: [0, 0.3 + i * 0.03, D / 2 + 0.006] });
  }
  // doors with handles + hazard label
  const doors = variant === 'pad-mount' ? 2 : 1;
  for (let i = 0; i < doors; i++) {
    const x = doors === 2 ? (i - 0.5) * (W / 2) : 0;
    mesh(roundedBox(W / doors - 0.08, H - 0.12, 0.012, 0.01), paint, { parent: root, at: [x, 0.12 + H / 2, D / 2 + 0.006] });
    mesh(roundedBox(0.03, 0.14, 0.04, 0.01), M.metal('#a8adb2', 0.35), { parent: root, at: [x + (doors === 2 ? (i ? -1 : 1) * (W / 4 - 0.12) : W / 2 - 0.12), 0.12 + H / 2, D / 2 + 0.03] });
  }
  const warn = textTexture([['⚡ DANGER', 'bold 46px Arial'], ['HIGH VOLTAGE', 'bold 36px Arial']], { w: 256, h: 140, bg: '#f2c200', fg: '#111', border: '#111', borderWidth: 6, radius: 8 });
  if (warn && variant !== 'telecom') mesh(new THREE.PlaneGeometry(0.26, 0.14), new THREE.MeshStandardMaterial({ map: warn }), { parent: root, at: [doors === 2 ? -W / 4 : 0, 0.12 + H * 0.75, D / 2 + 0.0125] });
  if (variant === 'telecom') {
    const t = textTexture('FIBRE · DO NOT OPEN', { w: 512, h: 64, bg: '#ffffff', fg: '#1565c0', font: 'bold 36px Arial', radius: 6 });
    if (t) mesh(new THREE.PlaneGeometry(0.5, 0.065), new THREE.MeshStandardMaterial({ map: t }), { parent: root, at: [0, 0.12 + H * 0.8, D / 2 + 0.0125] });
  }
  if (style === 'wrapped') {
    // decorative art wrap: city skyline vinyl on the front and sides
    const art = typeof document !== 'undefined' ? (() => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 384;
      const g = c.getContext('2d');
      const grd = g.createLinearGradient(0, 0, 0, 384);
      grd.addColorStop(0, '#ff9a5a');
      grd.addColorStop(0.6, '#ffd27f');
      grd.addColorStop(1, '#5aa0d8');
      g.fillStyle = grd;
      g.fillRect(0, 0, 512, 384);
      const r = rng(3);
      g.fillStyle = '#2b1d3a';
      for (let x = 0; x < 512; x += 30 + r() * 30) { const h = 80 + r() * 180; g.fillRect(x, 300 - h, 26 + r() * 20, h); }
      g.fillRect(0, 300, 512, 84);
      g.fillStyle = '#ffd23f';
      g.beginPath(); g.arc(380, 110, 40, 0, Math.PI * 2); g.fill();
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })() : null;
    const am = new THREE.MeshStandardMaterial({ color: art ? '#ffffff' : '#ff9a5a', map: art, roughness: 0.5, name: 'vinyl' });
    mesh(new THREE.PlaneGeometry(W - 0.06, H - 0.1), am, { parent: root, at: [0, 0.12 + H / 2, D / 2 + 0.014] });
    for (const s of [1, -1]) mesh(new THREE.PlaneGeometry(D - 0.06, H - 0.1).rotateY(s * Math.PI / 2), am, { parent: root, at: [s * (W / 2 + 0.002), 0.12 + H / 2, 0] });
  }
  emblem(root, 0.08, [W / 2 - 0.12, 0.12 + H - 0.12, D / 2 + 0.012]);
  return finish(root, { type: 'utility-box', variant, o, animations: [], lean: false });
}

/* ---------------------------------- CCTV ---------------------------------- */

export const CCTV_VARIANTS = { bullet: {}, dome: {}, ptz: {} };

export function createCCTV(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(CCTV_VARIANTS, o.variant, 'cctv');
  const style = styleOf(o);
  const root = group(`cctv-${variant}`);
  const H = 4.5;
  mesh(pole(H, { r: 0.07, top: 0.06, base: 0.18, baseH: 0.1 }), mats.galv(), { parent: root });
  const white = M.plastic('#eceae6', 0.4);
  const ir = lampGroup('ir', 'red');
  const head = group('camera', { parent: root, at: [0, H, 0] });
  if (variant === 'bullet') {
    curveTube([[0, -0.1, 0], [0, 0.05, 0.1], [0, 0.05, 0.35]], 0.03, white, { parent: head, radialSegments: 10 });
    const body = group(null, { parent: head, at: [0, -0.02, 0.45] });
    body.rotation.x = 0.35;
    mesh(new THREE.CapsuleGeometry(0.07, 0.3, 6, 16).rotateX(Math.PI / 2), white, { parent: body });
    mesh(roundedBox(0.18, 0.02, 0.4, 0.01), white, { parent: body, at: [0, 0.085, 0.03] });
    mesh(new THREE.CircleGeometry(0.05, 20), new THREE.MeshPhysicalMaterial({ color: '#05080a', roughness: 0.03, clearcoat: 1 }), { parent: body, at: [0, 0, 0.221] });
    ir.add(body, { at: [0, 0.04, 0.215], normal: [0, 0, 1], w: 0.015, h: 0.015, shape: 'round', depth: 0.003, bezel: false, glowSize: 0.12 });
  } else if (variant === 'dome') {
    mesh(roundedBox(0.08, 0.06, 0.4, 0.015), white, { parent: head, at: [0, -0.15, 0.2] });
    mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 28), white, { parent: head, at: [0, -0.15, 0.45] });
    mesh(new THREE.SphereGeometry(0.11, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', roughness: 0.03, transparent: true, opacity: 0.8, clearcoat: 1 }), { parent: head, at: [0, -0.18, 0.45] });
    ir.add(head, { at: [0.08, -0.15, 0.58], normal: [0, 0, 1], w: 0.015, h: 0.015, shape: 'round', depth: 0.003, bezel: false, glowSize: 0.12 });
  } else {
    // pan-tilt-zoom sphere that sweeps
    mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 20), white, { parent: head, at: [0, 0.06, 0] });
    const pan = group('pan', { parent: head, at: [0, -0.02, 0] });
    mesh(new THREE.SphereGeometry(0.16, 24, 16), white, { parent: pan, at: [0, -0.12, 0] });
    mesh(new THREE.SphereGeometry(0.135, 24, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', roughness: 0.03, transparent: true, opacity: 0.85, clearcoat: 1 }), { parent: pan, at: [0, -0.14, 0.03] });
    ir.add(pan, { at: [0, -0.06, 0.15], normal: [0, 0, 1], w: 0.015, h: 0.015, shape: 'round', depth: 0.003, bezel: false, glowSize: 0.12 });
  }
  if (style === 'sign') {
    const t = textTexture([['CCTV', 'bold 90px Arial'], ['in operation', '44px Arial']], { w: 256, h: 200, bg: '#f2c200', fg: '#111', border: '#111', borderWidth: 8, radius: 12 });
    mesh(roundedBox(0.3, 0.24, 0.01, 0.015), M.metal('#c9cdd0', 0.4), { parent: root, at: [0, 2.4, 0.075] });
    if (t) mesh(new THREE.PlaneGeometry(0.29, 0.23), new THREE.MeshStandardMaterial({ map: t }), { parent: root, at: [0, 2.4, 0.081] });
  }
  const tracks = [...lampTracks('ir', 2.4, { blink: 0.5, glow: 0.6 })];
  if (variant === 'ptz') tracks.push(rotateTrack(root.getObjectByName('pan'), 'y', 8, (t) => wave(t) * 1.2, 32));
  else tracks.push(rotateTrack(head, 'y', 8, (t) => wave(t) * 0.4, 32));
  return finish(root, { type: 'cctv', variant, o, animations: [clip('scan', 8, tracks)] });
}

/* ------------------------------ Rail crossing ------------------------------ */

export const RAIL_CROSSING_VARIANTS = { crossbuck: {}, lights: {}, gate: {} };

export function createRailCrossing(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(RAIL_CROSSING_VARIANTS, o.variant, 'rail-crossing');
  const style = styleOf(o);
  const root = group(`rail-crossing-${variant}`);
  const postM = mats.galv();
  const H = variant === 'crossbuck' ? 3.4 : 4.0;
  mesh(lathe([[0.001, 0], [0.25, 0], [0.25, 0.08], [0.001, 0.08]], 24), mats.concrete(), { parent: root });
  mesh(pole(H, { r: 0.06, top: 0.06, base: 0.14, baseH: 0.12, collar: false }), postM, { parent: root });
  // crossbuck: two crossed white boards with RAILROAD / CROSSING
  const xb = group('crossbuck', { parent: root, at: [0, H - 0.4, 0.066] });
  ['RAILROAD', 'CROSSING'].forEach((word, i) => {
    const t = textTexture(word, { w: 512, h: 96, bg: '#ffffff', fg: '#111', border: '#111', borderWidth: 6, radius: 6, font: 'bold 64px Helvetica, Arial' });
    const b = group(null, { parent: xb, at: [0, 0, i * 0.0105] });
    b.rotation.z = (i ? -1 : 1) * Math.PI / 4;
    mesh(roundedBox(1.22, 0.23, 0.01, 0.02), M.metal('#c9cdd0', 0.4), { parent: b });
    if (t) mesh(new THREE.PlaneGeometry(1.2, 0.22), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 }), { parent: b, at: [0, 0, 0.0055] });
  });
  const tracks = [];
  if (variant !== 'crossbuck') {
    // flashing red lights on a cross arm with hoods + bell
    const L = lampGroup('flash_L', 'red');
    const R = lampGroup('flash_R', 'red');
    const y = H - 1.4;
    mesh(roundedBox(1.0, 0.08, 0.08, 0.02), mats.powder('#1a1a1a'), { parent: root, at: [0, y, 0.06] });
    for (const [s, grp] of [[-1, L], [1, R]]) {
      const bp = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 28).rotateX(Math.PI / 2), mats.powder('#111'), { parent: root, at: [s * 0.4, y, 0.1] });
      void bp;
      grp.add(root, { at: [s * 0.4, y, 0.12], normal: [0, 0, 1], w: 0.24, h: 0.24, shape: 'round', depth: 0.03, glowSize: 1.2 });
      const hood = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 20, 1, true, Math.PI / 2 - 1.1, Math.PI + 2.2);
      hood.rotateX(Math.PI / 2);
      mesh(hood, new THREE.MeshStandardMaterial({ color: '#111', side: THREE.DoubleSide }), { parent: root, at: [s * 0.4, y, 0.22] });
    }
    mesh(lathe([[0.001, 0], [0.14, 0], [0.13, 0.08], [0.08, 0.15], [0.001, 0.16]], 24), M.metal('#2b2b2b', 0.5), { parent: root, at: [0, H - 0.01, 0] });
    const times = [0, 0.4, 0.8];
    tracks.push(
      new THREE.NumberKeyframeTrack('flash_L.material.emissiveIntensity', times, [2.6, 0, 2.6], THREE.InterpolateDiscrete),
      new THREE.NumberKeyframeTrack('flash_L_glow.material.opacity', times, [0.9, 0, 0.9], THREE.InterpolateDiscrete),
      new THREE.NumberKeyframeTrack('flash_R.material.emissiveIntensity', times, [0, 2.6, 0], THREE.InterpolateDiscrete),
      new THREE.NumberKeyframeTrack('flash_R_glow.material.opacity', times, [0, 0.9, 0], THREE.InterpolateDiscrete),
    );
  }
  const animations = [];
  const oneShot = [];
  if (variant === 'gate') {
    // gate mechanism + long striped arm with lamps
    mesh(roundedBox(0.45, 1.1, 0.4, 0.04), mats.powder('#c9cdd0'), { parent: root, at: [0, 0.55, -0.35] });
    const arm = group('arm', { parent: root, at: [0, 1.0, -0.6] });
    const len = 6;
    const t = typeof document !== 'undefined' ? (() => {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 32;
      const g = c.getContext('2d');
      for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#d32f2f'; g.fillRect((i * 512) / 12, 0, 512 / 12 + 1, 32); }
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
    })() : null;
    const armMat = new THREE.MeshStandardMaterial({ color: t ? '#ffffff' : '#d32f2f', map: t, roughness: 0.4, name: 'reflective' });
    const ag = new THREE.BoxGeometry(len, 0.1, 0.08, 40, 1, 1);
    ag.translate(len / 2, 0, 0);
    mesh(ag, armMat, { parent: arm });
    mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16).rotateX(Math.PI / 2), mats.powder('#c9cdd0'), { parent: arm });
    mesh(roundedBox(0.6, 0.1, 0.1, 0.02), mats.powder('#333'), { parent: arm, at: [-0.35, 0, 0] });
    const gl = lampGroup('gate_lamps', 'red');
    for (const x of [1.5, 3.5, 5.6]) gl.add(arm, { at: [x, 0.08, 0.045], normal: [0, 0, 1], w: 0.08, h: 0.08, shape: 'round', depth: 0.015, glowSize: 0.5 });
    arm.rotation.z = Math.PI / 2 - 0.05;
    animations.push(clip('lower', 4, [rotateTrack(arm, 'z', 4, (t) => (Math.PI / 2 - 0.05) * (1 - THREE.MathUtils.smoothstep(t, 0.15, 0.85)), 24)]), clip('raise', 4, [rotateTrack(arm, 'z', 4, (t) => (Math.PI / 2 - 0.05) * THREE.MathUtils.smoothstep(t, 0.15, 0.85), 24)]));
    oneShot.push('lower', 'raise');
    tracks.push(...lampTracks('gate_lamps', 2.6, { blink: 1.25 }).map((tr) => tr));
  }
  if (style === 'tracks') {
    // a short piece of track in front: sleepers + rails
    const sleeper = new THREE.MeshStandardMaterial({ color: '#5b4636', roughness: 1 });
    for (let i = 0; i < 8; i++) mesh(roundedBox(0.24, 0.15, 2.6, 0.02), sleeper, { parent: root, at: [-2.8 + i * 0.6 + 2.0, 0.075, 2.4] });
    for (const z of [1.68, 3.12]) mesh(roundedBox(4.8, 0.15, 0.07, 0.01), M.metal('#7a7d80', 0.35), { parent: root, at: [0.3, 0.225, z] });
    mesh(roundedBox(4.8, 0.06, 3.0, 0.01), new THREE.MeshStandardMaterial({ color: '#7a756e', roughness: 1, name: 'ballast' }), { parent: root, at: [0.3, 0.03, 2.4] });
  }
  if (tracks.length) animations.push(clip('flashing', 0.8, tracks));
  return finish(root, { type: 'rail-crossing', variant, o, animations, oneShot, exclusive: oneShot.length ? [oneShot] : undefined });
}

/* ------------------------------- Street clock ------------------------------- */

export const STREET_CLOCK_VARIANTS = { post: { color: '#1f2a24' }, 'double-face': { color: '#2a2622' }, modern: { color: '#9aa0a6' } };

function clockFace(parent, at, r, rotY, hands) {
  const g = group(null, { parent, at });
  g.rotation.y = rotY;
  const tex = typeof document !== 'undefined' ? (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#f6f1e3';
    x.beginPath(); x.arc(128, 128, 126, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#111';
    x.font = 'bold 30px Georgia, serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; x.fillText(R[i], 128 + Math.cos(a) * 98, 128 + Math.sin(a) * 98); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })() : null;
  const lit = lampGroup(hands.length ? `face_${hands.length}` : 'face', 'white');
  lit.lens.color.set('#f6f1e3');
  lit.lens.emissive.set('#fff1cc');
  if (tex) { lit.lens.map = tex; lit.lens.emissiveMap = tex; }
  lit.add(g, { geometry: new THREE.CircleGeometry(r, 40), normal: [0, 0, 1], depth: 0.005, glowSize: r * 3 });
  const hm = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.4 });
  const hour = group(`hour_${hands.length}`, { parent: g, at: [0, 0, 0.01] });
  mesh(roundedBox(0.025, r * 0.5, 0.006, 0.003).translate(0, r * 0.22, 0), hm, { parent: hour });
  hour.rotation.z = -1.2;
  const min = group(`minute_${hands.length}`, { parent: g, at: [0, 0, 0.016] });
  mesh(roundedBox(0.016, r * 0.78, 0.006, 0.003).translate(0, r * 0.36, 0), hm, { parent: min });
  min.rotation.z = -3.6;
  hands.push(min, hour);
  return lit;
}

export function createStreetClock(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(STREET_CLOCK_VARIANTS, o.variant, 'street-clock');
  const v = STREET_CLOCK_VARIANTS[variant];
  const root = group(`street-clock-${variant}`);
  const iron2 = variant === 'modern' ? mats.galv() : mats.castIron(o.color ?? v.color);
  const hands = [];
  const lits = [];
  if (variant === 'modern') {
    mesh(pole(3.2, { r: 0.07, top: 0.07, base: 0.18, baseH: 0.06, collar: false }), iron2, { parent: root });
    mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 40).rotateX(Math.PI / 2), iron2, { parent: root, at: [0, 3.55, 0] });
    for (const s of [1, -1]) lits.push(clockFace(root, [0, 3.55, s * 0.061], 0.36, s > 0 ? 0 : Math.PI, hands));
  } else {
    // ornate cast-iron post clock with a fluted column and a crown
    mesh(lathe([[0.001, 0], [0.32, 0], [0.32, 0.1], [0.26, 0.14], [0.24, 0.5], [0.18, 0.56], [0.12, 0.62], [0.11, 2.7], [0.16, 2.76], [0.18, 2.86], [0.001, 2.88]], 24), iron2, { parent: root });
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      mesh(roundedBox(0.015, 2.0, 0.015, 0.006), iron2, { parent: root, at: [Math.cos(a) * 0.112, 1.65, Math.sin(a) * 0.112] });
    }
    const faces = variant === 'double-face' ? 4 : 2;
    const boxY = faces === 2 ? 3.29 : 3.28;
    const box = group(null, { parent: root, at: [0, boxY, 0] });
    if (faces === 2) {
      mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.24, 40).rotateX(Math.PI / 2), iron2, { parent: box });
      for (const s of [1, -1]) {
        mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 40), M.metal('#c9a227', 0.3), { parent: box, at: [0, 0, s * 0.121] });
        lits.push(clockFace(box, [0, 0, s * 0.122], 0.37, s > 0 ? 0 : Math.PI, hands));
      }
    } else {
      mesh(roundedBox(0.8, 0.8, 0.8, 0.06), iron2, { parent: box });
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        lits.push(clockFace(box, [Math.sin(a) * 0.402, 0, Math.cos(a) * 0.402], 0.32, a, hands));
      }
    }
    mesh(lathe([[0.001, 0], [0.3, 0], [0.22, 0.12], [0.06, 0.3], [0.09, 0.36], [0.001, 0.48]], 24), iron2, { parent: root, at: [0, boxY + (faces === 2 ? 0.41 : 0.39), 0] });
    emblem(root, 0.12, [0, 0.4, 0.248]);
  }
  const tracks = [];
  for (let i = 0; i < hands.length; i += 2) {
    tracks.push(rotateTrack(hands[i], 'z', 60, (t) => -3.6 - t * Math.PI * 2, 60));
    tracks.push(rotateTrack(hands[i + 1], 'z', 60, (t) => -1.2 - (t * Math.PI * 2) / 12, 12));
  }
  const lightTracks = lits.flatMap((g) => lampTracks(g.name, 1.2, { glow: 0.35 }));
  return finish(root, { type: 'street-clock', variant, o, animations: [clip('ticking', 60, tracks), clip('lights', 1, lightTracks)] });
}

/* -------------------------------- Flag pole -------------------------------- */

export const FLAG_POLE_VARIANTS = { single: {}, triple: {}, wall: {} };

const FLAGS = [
  ['#1565c0', '#ffffff', '#1565c0'],
  ['#2e7d32', '#ffffff', '#c62828'],
  ['#f2c200', '#1d1d1f', '#f2c200'],
  ['#6a1b9a', '#ffd23f', '#6a1b9a'],
];
function flagTexture(i) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 256;
  const g = c.getContext('2d');
  const cols = FLAGS[i % FLAGS.length];
  cols.forEach((col, k) => { g.fillStyle = col; g.fillRect(0, (k * 256) / 3, 384, 256 / 3 + 1); });
  // fictional emblem: the studio ring
  const grd = g.createConicGradient(0, 192, 128);
  ['#ff5fa2', '#ff8a4c', '#ffd23f', '#7be36b', '#3fc3ff', '#7a6cff', '#c86bff', '#ff5fa2'].forEach((cc, k, a) => grd.addColorStop(k / (a.length - 1), cc));
  g.fillStyle = grd;
  g.beginPath(); g.arc(192, 128, 46, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#111';
  g.beginPath(); g.arc(192, 128, 24, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function flag(parent, at, i, name, rotY = 0) {
  const g = group(name, { parent, at });
  g.rotation.y = rotY;
  const geo = new THREE.PlaneGeometry(1.5, 1.0, 12, 4);
  geo.translate(0.75, -0.5, 0);
  const p = geo.attributes.position;
  for (let k = 0; k < p.count; k++) { const x = p.getX(k); p.setZ(k, Math.sin(x * 4) * 0.06 * x); }
  geo.computeVertexNormals();
  const t = flagTexture(i);
  mesh(geo, new THREE.MeshStandardMaterial({ color: t ? '#ffffff' : FLAGS[i % 4][0], map: t, side: THREE.DoubleSide, roughness: 0.8, name: 'flag' }), { parent: g });
  return g;
}

export function createFlagPole(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(FLAG_POLE_VARIANTS, o.variant, 'flag-pole');
  const style = styleOf(o);
  const root = group(`flag-pole-${variant}`);
  const steel = M.metal('#d6d8da', 0.2);
  const flags = [];
  const halfMast = style === 'half-mast';
  if (variant === 'wall') {
    // angled pole on a short brick pier (like on a building facade)
    mesh(roundedBox(0.6, 2.4, 0.6, 0.02), new THREE.MeshStandardMaterial({ color: '#9a4a32', roughness: 0.95, name: 'brick' }), { parent: root, at: [0, 1.2, -0.3] });
    mesh(roundedBox(0.2, 0.3, 0.1, 0.02), steel, { parent: root, at: [0, 2.0, 0.03] });
    const arm = group(null, { parent: root, at: [0, 2.0, 0.08] });
    arm.rotation.x = 0.7;
    mesh(new THREE.CylinderGeometry(0.025, 0.03, 2.4, 12).translate(0, 1.2, 0), steel, { parent: arm });
    mesh(new THREE.SphereGeometry(0.045, 12, 8), M.metal('#c9a227', 0.3), { parent: arm, at: [0, 2.42, 0] });
    flags.push(flag(arm, [0.03, 2.35, 0], o.seed ?? 0, 'flag_0', 0));
    flags[0].rotation.x = -0.7;
  } else {
    const poles = variant === 'triple' ? [-1.6, 0, 1.6] : [0];
    poles.forEach((x, i) => {
      const H = variant === 'triple' ? (i === 1 ? 9 : 8) : 9;
      mesh(lathe([[0.001, 0], [0.3, 0], [0.3, 0.2], [0.001, 0.2]], 24), mats.concrete(), { parent: root, at: [x, 0, 0] });
      mesh(lathe([[0.001, 0], [0.065, 0], [0.04, H], [0.001, H]], 20), steel, { parent: root, at: [x, 0.2, 0] });
      mesh(new THREE.SphereGeometry(0.07, 16, 12), M.metal('#c9a227', 0.3), { parent: root, at: [x, H + 0.25, 0] });
      // halyard rope + cleat
      curveTube([[x + 0.05, 1.2, 0], [x + 0.05, H + 0.1, 0]], 0.004, new THREE.MeshStandardMaterial({ color: '#f2f2ee' }), { parent: root, segments: 2, radialSegments: 4 });
      mesh(roundedBox(0.03, 0.12, 0.03, 0.01), steel, { parent: root, at: [x + 0.06, 1.2, 0] });
      const fy = halfMast ? H * 0.55 : H + 0.05;
      flags.push(flag(root, [x + 0.05, fy, 0], (o.seed ?? 0) + i, `flag_${i}`, 0));
    });
  }
  const tracks = flags.map((f, i) => rotateTrack(f, 'y', 3, (t) => wave(t + i * 0.3) * 0.25, 24));
  return finish(root, { type: 'flag-pole', variant, o, animations: [clip('wave', 3, tracks)] });
}

/* -------------------------------- Monument -------------------------------- */

export const MONUMENT_VARIANTS = { obelisk: {}, column: {}, abstract: {}, globe: {}, plaque: {} };

export function createMonument(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(MONUMENT_VARIANTS, o.variant, 'monument');
  const style = styleOf(o);
  const root = group(`monument-${variant}`);
  const stone = new THREE.MeshStandardMaterial({ color: style === 'granite' ? '#5a5a5e' : '#cfc8bb', roughness: style === 'granite' ? 0.35 : 0.85, name: 'stone' });
  const bronze = new THREE.MeshPhysicalMaterial({ color: style === 'verdigris' ? '#5f9e8a' : '#8a6a3a', metalness: style === 'verdigris' ? 0.3 : 0.9, roughness: style === 'verdigris' ? 0.7 : 0.35, name: 'bronze' });
  // stepped plinth
  const steps = [[3.0, 0.2], [2.4, 0.2], [1.8, 0.2]];
  let y = 0;
  for (const [w, h] of steps) {
    // each step sits 1 cm into the one below so the plinth reads (and tests) as one solid stack
    mesh(roundedBox(w, h + (y ? 0.01 : 0), w, 0.02), stone, { parent: root, at: [0, y + h / 2 - (y ? 0.005 : 0), 0] });
    y += h;
  }
  const inscription = (yy, w, text, z) => {
    const t = textTexture(text, { w: 512, h: 128, bg: style === 'granite' ? '#5a5a5e' : '#cfc8bb', fg: style === 'granite' ? '#d8c58a' : '#3a3428', font: 'bold 54px Georgia, serif', radius: 0 });
    if (t) mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), { parent: root, at: [0, yy, z] });
  };
  if (variant === 'obelisk') {
    mesh(roundedBox(1.2, 1.0, 1.2, 0.02), stone, { parent: root, at: [0, y + 0.5, 0] });
    inscription(y + 0.5, 1.0, 'MCMXXIV', 0.601);
    y += 1.0;
    const ob = lathe([[0.001, 0], [0.48, 0], [0.32, 6], [0.001, 6.6]], 4);
    ob.rotateY(Math.PI / 4);
    mesh(ob, stone, { parent: root, at: [0, y, 0] });
  } else if (variant === 'column') {
    mesh(roundedBox(1.3, 0.8, 1.3, 0.02), stone, { parent: root, at: [0, y + 0.4, 0] });
    y += 0.8;
    const prof = [[0.001, 0], [0.55, 0], [0.55, 0.12], [0.45, 0.2], [0.42, 0.3], [0.36, 5.6], [0.42, 5.7], [0.6, 5.85], [0.6, 6.0], [0.001, 6.0]];
    mesh(lathe(prof, 24), stone, { parent: root, at: [0, y, 0] });
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 5.2, 6), new THREE.MeshStandardMaterial({ color: '#b0a898', roughness: 0.9 }), { parent: root, at: [Math.cos(a) * 0.37, y + 3.0, Math.sin(a) * 0.37] });
    }
    // bronze figure stand-in: an urn
    mesh(lathe([[0.001, 0], [0.25, 0], [0.18, 0.1], [0.32, 0.4], [0.2, 0.7], [0.25, 0.75], [0.001, 0.8]], 24), bronze, { parent: root, at: [0, y + 6.0, 0] });
  } else if (variant === 'abstract') {
    // twisted ribbon sculpture in polished steel/bronze
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 3) * 0.6 * (1 - t * 0.5), t * 4, Math.cos(t * Math.PI * 3) * 0.6 * (1 - t * 0.5)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tg = new THREE.TubeGeometry(curve, 160, 0.14, 4, false);
    tg.scale(1, 1, 1);
    mesh(tg, style === 'verdigris' ? bronze : M.metal('#e8e8ea', 0.08), { parent: root, at: [0, y, 0] });
    mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.1, 20), M.metal('#9aa0a6', 0.3), { parent: root, at: [0, y + 0.05, 0] });
  } else if (variant === 'globe') {
    mesh(roundedBox(1.0, 1.2, 1.0, 0.03), stone, { parent: root, at: [0, y + 0.6, 0] });
    y += 1.2;
    const tilt = group('globe_tilt', { parent: root, at: [0, y + 1.0, 0] });
    tilt.rotation.z = 0.41;
    const g = group('globe', { parent: tilt });
    mesh(new THREE.SphereGeometry(0.9, 40, 24), new THREE.MeshPhysicalMaterial({ color: '#3a6ea5', metalness: 0.3, roughness: 0.4, clearcoat: 0.5, name: 'globe' }), { parent: g });
    for (let k = 0; k < 6; k++) mesh(new THREE.TorusGeometry(0.905, 0.018, 6, 64), bronze, { parent: g, rot: [0, (k / 6) * Math.PI, 0] });
    for (const lat of [-0.5, 0, 0.5]) mesh(new THREE.TorusGeometry(Math.cos(lat) * 0.905, 0.015, 6, 64).rotateX(Math.PI / 2), bronze, { parent: g, at: [0, Math.sin(lat) * 0.905, 0] });
    mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.15, 20), bronze, { parent: root, at: [0, y + 0.06, 0] });
  } else {
    // memorial plaque on a sloped stone lectern
    const lect = new THREE.Shape();
    lect.moveTo(-0.5, 0); lect.lineTo(0.5, 0); lect.lineTo(0.5, 0.7); lect.lineTo(-0.5, 1.0); lect.closePath();
    const lg = new THREE.ExtrudeGeometry(lect, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    lg.translate(0, 0, -0.6);
    lg.rotateY(-Math.PI / 2);
    mesh(lg, stone, { parent: root, at: [0, y, 0] });
    const pl = group(null, { parent: root, at: [0, y + 0.86, 0.02] });
    pl.rotation.x = -Math.atan2(0.3, 1.0);
    mesh(roundedBox(0.9, 0.02, 0.6, 0.01), bronze, { parent: pl, at: [0, 0.012, 0] });
    const t = textTexture([['IN MEMORY OF', 'bold 40px Georgia, serif'], ['THOSE WHO', '36px Georgia, serif'], ['BUILT THIS CITY', 'bold 40px Georgia, serif']], { w: 512, h: 340, bg: '#8a6a3a', fg: '#2a1e0a', radius: 10 });
    if (t) mesh(new THREE.PlaneGeometry(0.85, 0.56).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, metalness: 0.8, roughness: 0.4 }), { parent: pl, at: [0, 0.0235, 0] });
  }
  if (style === 'floral') {
    // wreath + flower bouquets at the foot
    const leaf = M.foliage('#2f5a29');
    // stands on the second step, leaning against the top step's front face
    const wreath = group('wreath', { parent: root, at: [0, 0.4 + 0.42, 0.9 + 0.1] });
    wreath.rotation.x = -0.12;
    mesh(new THREE.TorusGeometry(0.35, 0.08, 10, 28), leaf, { parent: wreath });
    const red = new THREE.MeshStandardMaterial({ color: '#c62828', roughness: 0.6 });
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      mesh(new THREE.SphereGeometry(0.05, 10, 8), red, { parent: wreath, at: [Math.cos(a) * 0.35, Math.sin(a) * 0.35, 0.07] });
    }
  }
  return finish(root, { type: 'monument', variant, o, animations: variant === 'globe' ? [clip('rotate', 20, [rotateTrack(root.getObjectByName('globe'), 'y', 20, (t) => t * Math.PI * 2, 40)])] : [], lean: false });
}
