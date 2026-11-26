import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, curveTube, lathe, extrudeOutline, rng, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, numberTrack, clip, wave, pingPong } from '../../core/animation.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { mats, pole, textTexture, bolt, emblem } from './common.js';
import { finish, styleOf } from './kit.js';

/* Kerbside utilities: hydrants, mailboxes, parking meters, phone booths,
 * vending machines, newspaper boxes, ATMs and EV chargers. */

const label = (parent, text, w, h, at, { bg = '#ffffff', fg = '#111', font, rotY = 0, emissive = 0, name } = {}) => {
  const tex = textTexture(text, { w: 512, h: Math.round((512 * h) / w), bg, fg, font: font ?? `bold ${Math.round((512 * h) / w * 0.55)}px Helvetica, Arial`, radius: 0 });
  if (!tex) return null;
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, ...(emissive ? { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: emissive } : {}) });
  const p = mesh(new THREE.PlaneGeometry(w, h), m, { parent, at, name });
  p.rotation.y = rotY;
  return p;
};

/** Brick or stone post for residential mailboxes. */
function masonryPost(parent, h, kind) {
  const g = group('masonry', { parent });
  const c = kind === 'brick' ? '#9a4a32' : '#9c958a';
  const mortar = new THREE.MeshStandardMaterial({ color: '#cfc8bb', roughness: 1 });
  mesh(roundedBox(0.44, h, 0.44, 0.02), mortar, { parent: g, at: [0, h / 2, 0] });
  const rand = rng(kind === 'brick' ? 3 : 9);
  const unitH = kind === 'brick' ? 0.075 : 0.14;
  const rows = Math.floor(h / unitH);
  for (let r = 0; r < rows; r++) {
    for (let side = 0; side < 4; side++) {
      const n = kind === 'brick' ? 2 : 2;
      for (let k = 0; k < n; k++) {
        const off = (r % 2) * 0.11;
        const len = kind === 'brick' ? 0.2 : 0.21;
        const x = -0.22 + off + k * 0.22 + len / 2;
        if (x + len / 2 > 0.235) continue;
        const col = new THREE.Color(c).offsetHSL(0, 0, (rand() - 0.5) * 0.08);
        const b = mesh(roundedBox(len, unitH - 0.012, 0.03, 0.006), new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, name: kind }), { parent: g });
        const a = (side * Math.PI) / 2;
        b.position.set(Math.sin(a) * 0.222 + Math.cos(a) * x, unitH / 2 + r * unitH, Math.cos(a) * 0.222 - Math.sin(a) * x);
        b.rotation.y = a;
      }
    }
  }
  mesh(roundedBox(0.52, 0.06, 0.52, 0.02), mats.concrete('#b8b2a8'), { parent: g, at: [0, h + 0.03, 0] });
  return g;
}

/* ----------------------------- Fire hydrant ----------------------------- */

export const FIRE_HYDRANT_VARIANTS = {
  classic: { color: '#c62828', cap: '#e8e4dc' },
  yellow: { color: '#f2b705', cap: '#2c6fb5' },
  pillar: { color: '#c62828', cap: '#c62828' },
  european: { color: '#c62828', cap: '#d8d8d8' },
  'wall-fdc': { color: '#c9a227', cap: '#c62828' },
};

export function createFireHydrant(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(FIRE_HYDRANT_VARIANTS, o.variant, 'fire-hydrant');
  const v = FIRE_HYDRANT_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`fire-hydrant-${variant}`);
  const body = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), metalness: 0.3, roughness: 0.42, clearcoat: 0.5, name: 'paint' });
  const capMat = new THREE.MeshPhysicalMaterial({ color: M.toColor(v.cap), metalness: 0.3, roughness: 0.4, clearcoat: 0.5 });
  let top = 0.77;
  if (variant === 'pillar') {
    mesh(lathe([[0.001, 0], [0.16, 0], [0.16, 0.04], [0.13, 0.06], [0.12, 0.85], [0.14, 0.88], [0.14, 0.92], [0.1, 1.0], [0.04, 1.04], [0.001, 1.05]], 40), body, { parent: root });
    mesh(roundedBox(0.14, 0.18, 0.03, 0.02), capMat, { parent: root, at: [0, 0.6, 0.13] });
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 5).rotateX(Math.PI / 2), M.metal('#777', 0.4), { parent: root, at: [0, 0.6, 0.155] });
    label(root, 'FIRE', 0.1, 0.035, [0, 0.75, 0.1225], { bg: o.color ?? v.color, fg: '#ffffff' });
    top = 1.05;
  } else if (variant === 'european') {
    // tall slim overground hydrant with a hinged cap and two outlets
    mesh(lathe([[0.001, 0], [0.15, 0], [0.15, 0.04], [0.1, 0.07], [0.085, 0.1], [0.085, 0.95], [0.1, 0.98], [0.1, 1.04], [0.07, 1.1], [0.001, 1.12]], 36), body, { parent: root });
    mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.035, 36), capMat, { parent: root, at: [0, 0.6, 0] });
    for (const s of [1, -1]) {
      const n = group(null, { parent: root, at: [s * 0.08, 0.72, 0] });
      n.rotation.z = -s * Math.PI / 2;
      mesh(lathe([[0.045, 0], [0.045, 0.05], [0.04, 0.06], [0.04, 0.09], [0.001, 0.09]], 20), body, { parent: n });
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 6), capMat, { parent: n, at: [0, 0.09, 0] });
    }
    mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.04, 5), M.metal('#6b6b6b', 0.45), { parent: root, at: [0, 1.13, 0] });
    top = 1.15;
  } else if (variant === 'wall-fdc') {
    // fire department (siamese) connection on a short brick wall section
    masonryPost(root, 0.9, 'brick').scale.set(2.2, 1, 0.8);
    const brass = M.metal('#c9a227', 0.25);
    const plate = group(null, { parent: root, at: [0, 0.55, 0.18] });
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 36).rotateX(Math.PI / 2), brass, { parent: plate });
    for (const s of [1, -1]) {
      const n = group(null, { parent: plate, at: [s * 0.09, 0, 0] });
      n.rotation.x = Math.PI / 2;
      mesh(lathe([[0.045, 0], [0.045, 0.08], [0.05, 0.09], [0.05, 0.12], [0.001, 0.12]], 20), brass, { parent: n });
      mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.035, 8), capMat, { parent: n, at: [0, 0.13, 0] });
    }
    const tex = textTexture([['FIRE DEPT', 'bold 64px Helvetica, Arial'], ['CONNECTION', 'bold 56px Helvetica, Arial']], { w: 512, h: 220, bg: '#c62828', fg: '#ffffff', radius: 14 });
    mesh(roundedBox(0.36, 0.16, 0.012, 0.02), M.metal('#c62828', 0.4), { parent: root, at: [0, 0.82, 0.183] });
    if (tex) mesh(new THREE.PlaneGeometry(0.35, 0.15), new THREE.MeshStandardMaterial({ map: tex }), { parent: root, at: [0, 0.82, 0.19] });
    top = 0.96;
  } else {
    const prof = [[0.001, 0], [0.17, 0], [0.17, 0.03], [0.14, 0.05], [0.14, 0.07], [0.115, 0.09], [0.11, 0.52], [0.13, 0.54], [0.13, 0.58], [0.115, 0.6], [0.11, 0.64], [0.075, 0.72], [0.03, 0.74], [0.001, 0.745]];
    mesh(lathe(prof, 40), body, { parent: root });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6), M.metal('#777', 0.4), { parent: root, at: [Math.cos(a) * 0.155, 0.04, Math.sin(a) * 0.155] });
    }
    mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.04, 5), M.metal('#6b6b6b', 0.45), { parent: root, at: [0, 0.76, 0] });
    const nozzle = (dir, r, y, name) => {
      const n = group(name, { parent: root, at: [0, y, 0] });
      n.rotation.y = Math.atan2(dir[0], dir[2]);
      mesh(lathe([[r * 1.25, 0], [r * 1.25, 0.03], [r, 0.04], [r, 0.08], [0.001, 0.08]], 24).rotateX(Math.PI / 2), body, { parent: n, at: [0, 0, 0.09] });
      mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 0.05, 6).rotateX(Math.PI / 2), capMat, { parent: n, at: [0, 0, 0.19] });
      mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.35, 0.02, 5).rotateX(Math.PI / 2), capMat, { parent: n, at: [0, 0, 0.22] });
      const links = [];
      for (let k = 0; k < 5; k++) links.push([r * 1.1 + 0.005, -r * 0.6 - k * 0.018 - Math.sin((k / 4) * Math.PI) * 0.02, 0.19 - k * 0.022]);
      curveTube(links, 0.004, M.metal('#999', 0.4), { parent: n, segments: 20, radialSegments: 5 });
    };
    nozzle([0, 0, 1], 0.06, 0.4, 'pumper');
    nozzle([1, 0, 0], 0.04, 0.44, 'outlet_L');
    nozzle([-1, 0, 0], 0.04, 0.44, 'outlet_R');
  }
  if (style === 'flagged') {
    // spring-mounted marker rod with a reflective flag (so ploughs can find it)
    const x = variant === 'wall-fdc' ? 0.4 : 0.1;
    const z = variant === 'wall-fdc' ? 0.2 : -0.1;
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), M.metal('#888', 0.4), { parent: root, at: [x, top - 0.04, z] });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.2, 8), M.plastic('#f2c200'), { parent: root, at: [x, top + 0.6, z] });
    const fg = new THREE.PlaneGeometry(0.22, 0.14, 4, 1);
    const p = fg.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) + 0.11) * 14) * 0.015);
    fg.computeVertexNormals();
    fg.translate(0.11, 0, 0);
    mesh(fg, new THREE.MeshStandardMaterial({ color: '#ff3b1f', roughness: 0.5, side: THREE.DoubleSide, name: 'flag' }), { parent: root, at: [x + 0.008, top + 1.1, z] });
    for (let k = 0; k < 3; k++) mesh(new THREE.TorusGeometry(0.012, 0.004, 6, 16).rotateX(Math.PI / 2), M.metal('#999', 0.3), { parent: root, at: [x, top + 0.02 + k * 0.012, z] });
  }
  return finish(root, { type: 'fire-hydrant', variant, o, animations: [] });
}

/* -------------------------------- Mailbox -------------------------------- */

export const MAILBOX_VARIANTS = {
  collection: { color: '#1c4f9c' },
  residential: { color: '#2b2f33' },
  pillar: { color: '#c8102e' },
  'parcel-locker': { color: '#f2c200' },
  cluster: { color: '#9aa0a6' },
  rural: { color: '#b9bdc1' },
};

export function createMailbox(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(MAILBOX_VARIANTS, o.variant, 'mailbox');
  const v = MAILBOX_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`mailbox-${variant}`);
  const paint = mats.powder(o.color ?? v.color);
  paint.name = 'paint';
  const animations = [];
  let oneShot = [];
  if (variant === 'collection') {
    const W = 0.52;
    const shape = new THREE.Shape();
    shape.moveTo(-0.24, 0.12);
    shape.lineTo(0.24, 0.12);
    shape.lineTo(0.24, 0.98);
    shape.absarc(0, 0.98, 0.24, 0, Math.PI, false);
    shape.lineTo(-0.24, 0.12);
    const g = extrudeOutline(shape, W, { bevel: 0.02 });
    g.rotateY(Math.PI / 2);
    mesh(g, paint, { parent: root });
    for (const x of [W / 2 - 0.05, -W / 2 + 0.05]) for (const z of [0.2, -0.2]) mesh(roundedBox(0.05, 0.14, 0.05, 0.012), paint, { parent: root, at: [x, 0.07, z] });
    const flap = group('flap', { parent: root, at: [0, 1.02, 0.25] });
    mesh(roundedBox(0.36, 0.14, 0.02, 0.012), paint, { parent: flap, at: [0, -0.07, 0.01] });
    mesh(roundedBox(0.16, 0.03, 0.04, 0.012), M.chrome(), { parent: flap, at: [0, -0.1, 0.035] });
    for (const s of [1, -1]) label(root, 'U.S. MAIL', 0.36, 0.09, [s * (W / 2 + 0.0225), 0.7, 0], { bg: o.color ?? v.color, fg: '#ffffff', rotY: s * Math.PI / 2 });
    label(root, 'PICKUP 5 PM', 0.26, 0.06, [0, 0.55, 0.2625], { bg: '#ffffff', fg: '#1c4f9c' });
    animations.push(clip('open', 2, [rotateTrack(flap, 'x', 2, (t) => pingPong(t) * 0.9)]));
  } else if (variant === 'residential' || variant === 'rural') {
    const masonry = style === 'brick-post' || style === 'stone-post';
    const postTop = 1.07;
    if (masonry) masonryPost(root, postTop - 0.06, style === 'brick-post' ? 'brick' : 'stone');
    else if (variant === 'rural') {
      mesh(roundedBox(0.1, postTop, 0.1, 0.015), M.wood('#6e4b2e'), { parent: root, at: [0, postTop / 2, 0] });
      mesh(roundedBox(0.2, 0.04, 0.5, 0.012), M.wood('#6e4b2e'), { parent: root, at: [0, postTop + 0.02, 0.05] });
      curveTube([[0, 0.7, 0], [0, 0.95, 0.2], [0, postTop, 0.22]], 0.015, M.wood('#5a3c24'), { parent: root, segments: 2, radialSegments: 6 });
    } else {
      mesh(roundedBox(0.09, postTop, 0.09, 0.015), M.wood('#6e4b2e'), { parent: root, at: [0, postTop / 2, 0] });
      mesh(roundedBox(0.2, 0.04, 0.5, 0.012), M.wood('#6e4b2e'), { parent: root, at: [0, postTop + 0.02, 0.05] });
    }
    const bw = variant === 'rural' ? 0.26 : 0.22;
    const bl = variant === 'rural' ? 0.56 : 0.48;
    const shape = new THREE.Shape();
    shape.moveTo(-bw / 2, 0); shape.lineTo(bw / 2, 0); shape.lineTo(bw / 2, bw * 0.6);
    shape.absarc(0, bw * 0.6, bw / 2, 0, Math.PI, false);
    shape.lineTo(-bw / 2, 0);
    const y0 = masonry ? postTop : postTop + 0.04;
    mesh(extrudeOutline(shape, bl, { bevel: 0.01 }), paint, { parent: root, at: [0, y0, 0.05] });
    const door = group('door', { parent: root, at: [0, y0, 0.05 + bl / 2] });
    mesh(new THREE.ShapeGeometry(shape, 16), paint, { parent: door, at: [0, 0, 0.002] });
    mesh(roundedBox(0.04, 0.02, 0.03, 0.006), M.chrome(), { parent: door, at: [0, bw * 0.9, 0.02] });
    const flag = group('flag', { parent: root, at: [bw / 2 + 0.01, y0 + 0.06, 0.0] });
    mesh(roundedBox(0.012, 0.22, 0.02, 0.004), mats.powder('#c62828'), { parent: flag, at: [0, 0.1, 0] });
    mesh(roundedBox(0.012, 0.07, 0.1, 0.004), mats.powder('#c62828'), { parent: flag, at: [0, 0.19, 0.05] });
    flag.rotation.x = Math.PI / 2;
    for (const s of [1, -1]) label(root, variant === 'rural' ? '1842' : '27', 0.16, 0.06, [s * (bw / 2 + 0.0105), y0 + bw * 0.45, 0.05], { bg: o.color ?? v.color, fg: '#ffffff', rotY: s * Math.PI / 2 });
    animations.push(clip('flagUp', 0.6, [rotateTrack(flag, 'x', 0.6, (t) => (1 - t) * (Math.PI / 2))]));
    animations.push(clip('flagDown', 0.6, [rotateTrack(flag, 'x', 0.6, (t) => t * (Math.PI / 2))]));
    animations.push(clip('open', 2, [rotateTrack(door, 'x', 2, (t) => pingPong(t) * 1.5)]));
    oneShot = ['flagUp', 'flagDown'];
    if (variant === 'rural') {
      // newspaper tube under the box
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 20, 1, true).rotateX(Math.PI / 2), M.plastic('#f2c200'), { parent: root, at: [0, postTop - (masonry ? -0.02 : 0.1), 0.1] }).material.side = THREE.DoubleSide;
    }
  } else if (variant === 'pillar') {
    mesh(lathe([[0.001, 0], [0.26, 0], [0.26, 0.05], [0.23, 0.08], [0.22, 1.2], [0.25, 1.24], [0.25, 1.3], [0.2, 1.4], [0.1, 1.46], [0.001, 1.47]], 40), paint, { parent: root });
    mesh(roundedBox(0.28, 0.05, 0.06, 0.02), M.plastic('#111'), { parent: root, at: [0, 1.12, 0.21] });
    // collection times plate (with real text) + door
    mesh(roundedBox(0.2, 0.14, 0.012, 0.02), M.metal('#e8e8e2', 0.5), { parent: root, at: [0, 0.85, 0.222] });
    const tex = textTexture([['COLLECTIONS', 'bold 34px Helvetica, Arial'], ['Mon–Fri 5:30pm', '30px Helvetica, Arial'], ['Sat 12:00 noon', '30px Helvetica, Arial']], { w: 256, h: 180, bg: '#f4f4f2', fg: '#111', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(0.19, 0.13), new THREE.MeshStandardMaterial({ map: tex }), { parent: root, at: [0, 0.85, 0.2285] });
    mesh(roundedBox(0.3, 0.5, 0.02, 0.03), paint, { parent: root, at: [0, 0.5, 0.222] });
    mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 12).rotateX(Math.PI / 2), M.metal('#c9a227', 0.3), { parent: root, at: [0.1, 0.5, 0.24] });
  } else if (variant === 'parcel-locker') {
    const W = 1.6;
    const H = 1.9;
    const D = 0.6;
    mesh(roundedBox(W, H, D, 0.04), paint, { parent: root, at: [0, H / 2 + 0.05, 0] });
    mesh(roundedBox(W + 0.1, 0.05, D + 0.1, 0.02), M.plastic('#2b2b2b'), { parent: root, at: [0, 0.025, 0] });
    const doors = M.metal('#e9e9e6', 0.35);
    const sizes = [0.3, 0.3, 0.45, 0.45];
    for (let c = 0; c < 4; c++) {
      if (c === 1) continue;
      let y = 0.12;
      const x = -W / 2 + 0.2 + c * 0.4;
      for (let k = 0; k < 6 && y < H - 0.15; k++) {
        const h = sizes[(k + c) % 4];
        if (y + h > H - 0.05) break;
        mesh(roundedBox(0.37, h - 0.02, 0.02, 0.01), doors, { parent: root, at: [x, y + h / 2 + 0.05, D / 2 + 0.005] });
        mesh(roundedBox(0.012, 0.06, 0.012, 0.004), M.plastic('#333'), { parent: root, at: [x + 0.14, y + h / 2 + 0.05, D / 2 + 0.02] });
        y += h;
      }
    }
    // central terminal column
    const scr = lampGroup('screen', 'white');
    scr.lens.emissive.set('#bfe4ff');
    mesh(roundedBox(0.37, H - 0.15, 0.03, 0.01), M.plastic('#1a1a1a'), { parent: root, at: [-W / 2 + 0.6, H / 2 + 0.05, D / 2 + 0.01] });
    scr.add(root, { at: [-W / 2 + 0.6, 1.25, D / 2 + 0.026], normal: [0, 0, 1], w: 0.26, h: 0.18, depth: 0.004, bezel: false });
    mesh(roundedBox(0.12, 0.08, 0.03, 0.02), M.plastic('#333'), { parent: root, at: [-W / 2 + 0.6, 1.0, D / 2 + 0.03] });
    label(root, 'PARCELS 24/7', W * 0.9, 0.12, [0, H + 0.02 - 0.1, D / 2 + 0.003], { bg: o.color ?? v.color, fg: '#111' });
    emblem(root, 0.1, [W / 2 - 0.15, H - 0.08, D / 2]);
    animations.push(clip('lights', 1, lampTracks('screen', 3)));
  } else {
    // cluster box unit: pedestal + grid of small doors
    mesh(roundedBox(0.3, 0.6, 0.3, 0.03), paint, { parent: root, at: [0, 0.3, 0] });
    mesh(roundedBox(0.7, 1.0, 0.45, 0.03), paint, { parent: root, at: [0, 1.1, 0] });
    mesh(roundedBox(0.76, 0.06, 0.5, 0.02), paint, { parent: root, at: [0, 1.63, 0] });
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
      mesh(roundedBox(0.15, 0.15, 0.012, 0.008), M.metal('#d6d8da', 0.35), { parent: root, at: [-0.255 + c * 0.17, 0.72 + r * 0.17, 0.228] });
      mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 10).rotateX(Math.PI / 2), M.metal('#9a8f6a', 0.3), { parent: root, at: [-0.205 + c * 0.17, 0.72 + r * 0.17, 0.237] });
    }
    label(root, 'OUTGOING', 0.3, 0.05, [0, 1.5, 0.2255], { bg: '#1c4f9c', fg: '#ffffff' });
  }
  return finish(root, { type: 'mailbox', variant, o, animations, oneShot, exclusive: oneShot.length ? [oneShot] : undefined, handled: [] });
}

/* ----------------------------- Parking meter ----------------------------- */

export const PARKING_METER_VARIANTS = {
  single: { color: '#4a5a66' },
  double: { color: '#4a5a66' },
  kiosk: { color: '#2b3a4a' },
  'solar-paystation': { color: '#1f5f8b' },
};

function meterHead(parent, at, paint, idx, bagged) {
  const h = group(null, { parent, at });
  mesh(roundedBox(0.2, 0.3, 0.16, 0.04), paint, { parent: h, at: [0, 0.15, 0] });
  mesh(lathe([[0.001, 0.0], [0.1, 0.0], [0.09, 0.05], [0.05, 0.09], [0.001, 0.1]], 24).scale(1, 1, 0.8), paint, { parent: h, at: [0, 0.3, 0] });
  const disp = lampGroup(`display_${idx}`, 'green');
  disp.lens.color.set('#14261b');
  disp.add(h, { at: [0, 0.22, 0.08], normal: [0, 0, 1], w: 0.12, h: 0.07, depth: 0.005, bezel: false, glowSize: 0.25 });
  mesh(roundedBox(0.05, 0.012, 0.01, 0.004), M.plastic('#111'), { parent: h, at: [0, 0.12, 0.081] });
  mesh(roundedBox(0.04, 0.04, 0.01, 0.01), M.chrome(), { parent: h, at: [0.05, 0.07, 0.081] });
  if (bagged) {
    // "out of order" hood: a shrink bag over the head, tied at the neck, with a tag
    const bag = new THREE.SphereGeometry(1, 20, 14);
    const p = bag.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const k = y < -0.6 ? 0.55 : 1 + Math.sin(i * 2.3) * 0.03;
      p.setXYZ(i, p.getX(i) * 0.135 * k, y * 0.22 + 0.17, p.getZ(i) * 0.115 * k);
    }
    bag.computeVertexNormals();
    mesh(bag, new THREE.MeshStandardMaterial({ color: '#d84315', roughness: 0.6, name: 'bag' }), { parent: h });
    const tex = textTexture([['OUT OF', 'bold 54px Helvetica, Arial'], ['ORDER', 'bold 54px Helvetica, Arial']], { w: 256, h: 160, bg: '#ffffff', fg: '#c62828', radius: 8 });
    if (tex) mesh(new THREE.PlaneGeometry(0.13, 0.08), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide }), { parent: h, at: [0, 0.2, 0.118] });
  }
  return h;
}

export function createParkingMeter(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(PARKING_METER_VARIANTS, o.variant, 'parking-meter');
  const v = PARKING_METER_VARIANTS[variant];
  const style = styleOf(o);
  const bagged = style === 'bagged';
  const root = group(`parking-meter-${variant}`);
  const paint = mats.powder(o.color ?? v.color);
  const names = [];
  if (variant === 'kiosk' || variant === 'solar-paystation') {
    const H = variant === 'kiosk' ? 1.5 : 1.65;
    mesh(roundedBox(0.4, H, 0.3, 0.05), paint, { parent: root, at: [0, H / 2 + 0.04, 0] });
    mesh(lathe([[0.001, 0], [0.3, 0], [0.3, 0.04], [0.001, 0.04]], 4).rotateY(Math.PI / 4), mats.concrete(), { parent: root });
    const scr = lampGroup('display_0', 'white');
    scr.lens.emissive.set('#6fc3ff');
    const stex = textTexture([['PAY & DISPLAY', 'bold 30px Helvetica, Arial'], ['£2.40 / hour', 'bold 36px Helvetica, Arial'], ['Enter plate ▸', '26px Helvetica, Arial']], { w: 256, h: 180, bg: '#0e3a5a', fg: '#ffffff', radius: 0 });
    if (stex) { scr.lens.map = stex; scr.lens.emissiveMap = stex; scr.lens.color.set('#ffffff'); }
    else scr.lens.color.set('#0e1a24');
    scr.add(root, { geometry: new THREE.PlaneGeometry(0.26, 0.18).translate(0, H - 0.25, 0.153), normal: [0, 0, 1], depth: 0.005, glowSize: 0.5 });
    names.push('display_0');
    for (let i = 0; i < 12; i++) mesh(roundedBox(0.045, 0.035, 0.012, 0.006), M.plastic('#d0d0d0'), { parent: root, at: [-0.06 + (i % 3) * 0.06, H - 0.48 - Math.floor(i / 3) * 0.05, 0.156] });
    mesh(roundedBox(0.12, 0.015, 0.012, 0.005), M.plastic('#111'), { parent: root, at: [0, H - 0.75, 0.156] });
    mesh(roundedBox(0.1, 0.06, 0.03, 0.01), M.plastic('#111'), { parent: root, at: [0.1, H - 0.82, 0.16] });
    label(root, 'PAY HERE', 0.36, 0.08, [0, H - 0.04, 0.1505], { bg: '#1565c0', fg: '#ffffff' });
    label(root, 'P', 0.12, 0.12, [0, 0.55, 0.1505], { bg: '#1565c0', fg: '#ffffff' });
    if (variant === 'solar-paystation') {
      const pv = group(null, { parent: root, at: [0, H + 0.04, -0.05] });
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 10), paint, { parent: pv, at: [0, 0.09, 0] });
      const t = group(null, { parent: pv, at: [0, 0.2, 0] });
      t.rotation.x = -0.5;
      mesh(roundedBox(0.55, 0.03, 0.42, 0.01), M.metal('#c9cdd0', 0.3), { parent: t });
      mesh(new THREE.PlaneGeometry(0.5, 0.38).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#1a2a4a', roughness: 0.15, clearcoat: 1 }), { parent: t, at: [0, 0.016, 0] });
    }
    emblem(root, 0.08, [0.13, 0.85, 0.15]);
    if (bagged) {
      const cover = new THREE.MeshStandardMaterial({ color: '#d84315', roughness: 0.6, name: 'bag' });
      mesh(roundedBox(0.44, 0.6, 0.34, 0.08), cover, { parent: root, at: [0, H - 0.3, 0] });
      label(root, 'OUT OF ORDER', 0.36, 0.08, [0, H - 0.3, 0.172], { bg: '#ffffff', fg: '#c62828' });
    }
  } else {
    mesh(pole(1.0, { r: 0.04, base: 0.12, baseH: 0.05, collar: false }), mats.galv(), { parent: root });
    if (variant === 'single') {
      meterHead(root, [0, 1.0, 0], paint, 0, bagged);
      names.push('display_0');
    } else {
      mesh(roundedBox(0.5, 0.06, 0.1, 0.02), mats.galv(), { parent: root, at: [0, 1.0, 0] });
      meterHead(root, [-0.15, 1.03, 0], paint, 0, bagged);
      meterHead(root, [0.15, 1.03, 0], paint, 1, bagged);
      names.push('display_0', 'display_1');
    }
  }
  const tracks = bagged ? [] : names.flatMap((n) => lampTracks(n, 2.4, { blink: 0.5, glow: 0.5 }));
  return finish(root, { type: 'parking-meter', variant, o, animations: tracks.length ? [clip('blink', 2, tracks)] : [] });
}

/* ------------------------------ Phone booth ------------------------------ */

export const PHONE_BOOTH_VARIANTS = {
  classic: { color: '#c8102e' },
  modern: { color: '#3a3f44' },
  wall: { color: '#2b3a4a' },
};

function handset(parent, at) {
  const g = group('phone', { parent, at });
  mesh(roundedBox(0.24, 0.34, 0.1, 0.03), M.metal('#a8adb2', 0.35), { parent: g, at: [0, 0, 0.05] });
  for (let i = 0; i < 12; i++) mesh(roundedBox(0.035, 0.028, 0.012, 0.006), M.chrome(), { parent: g, at: [-0.045 + (i % 3) * 0.045, -0.02 - Math.floor(i / 3) * 0.04, 0.105] });
  mesh(roundedBox(0.12, 0.05, 0.012, 0.01), new THREE.MeshPhysicalMaterial({ color: '#1a2a1a', emissive: '#7fe0a0', emissiveIntensity: 0.4 }), { parent: g, at: [0, 0.11, 0.105] });
  // handset on its cradle at the side, with a coiled armoured cord
  mesh(roundedBox(0.05, 0.22, 0.05, 0.02), M.plastic('#111'), { parent: g, at: [-0.145, 0.0, 0.05] });
  const coil = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60; coil.push([-0.12 + Math.cos(t * 30) * 0.012, -0.1 - t * 0.12, 0.06 + Math.sin(t * 30) * 0.012]); }
  curveTube(coil, 0.004, M.chrome(), { parent: g, segments: 120, radialSegments: 5 });
  return g;
}

export function createPhoneBooth(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(PHONE_BOOTH_VARIANTS, o.variant, 'phone-booth');
  const v = PHONE_BOOTH_VARIANTS[variant];
  const root = group(`phone-booth-${variant}`);
  const paint = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.35, clearcoat: 0.6, name: 'paint' });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#e8eef0', roughness: 0.05, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, name: 'glass' });
  const sign = lampGroup('sign', 'white');
  const W = 0.95;
  const animations = [];
  if (variant === 'classic') {
    const H = 2.5;
    mesh(roundedBox(W + 0.1, 0.12, W + 0.1, 0.03), paint, { parent: root, at: [0, 0.06, 0] });
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) mesh(roundedBox(0.1, H - 0.4, 0.1, 0.02), paint, { parent: root, at: [x * (W / 2), 0.12 + (H - 0.4) / 2, z * (W / 2)] });
    const side = (rotY, isDoor) => {
      const sideG = group(null, { parent: root });
      sideG.rotation.y = rotY;
      const holder = group(isDoor ? 'door' : null, { parent: sideG, at: isDoor ? [-W / 2 + 0.05, 0, W / 2] : [0, 0, W / 2] });
      const ox = isDoor ? (W - 0.1) / 2 : 0;
      mesh(new THREE.BoxGeometry(W - 0.12, H - 0.75, 0.01), glass, { parent: holder, at: [ox, 0.33 + (H - 0.75) / 2, 0] });
      for (let c = 0; c <= 3; c++) mesh(roundedBox(0.03, H - 0.75, 0.04, 0.008), paint, { parent: holder, at: [ox - (W - 0.12) / 2 + (c * (W - 0.12)) / 3, 0.33 + (H - 0.75) / 2, 0] });
      for (let r = 0; r <= 8; r++) mesh(roundedBox(W - 0.12, 0.025, 0.035, 0.008), paint, { parent: holder, at: [ox, 0.33 + (r * (H - 0.75)) / 8, 0] });
      mesh(roundedBox(W - 0.1, 0.22, 0.05, 0.015), paint, { parent: holder, at: [ox, 0.22, 0] });
      if (isDoor) mesh(roundedBox(0.03, 0.18, 0.03, 0.01), M.metal('#c9a227', 0.3), { parent: holder, at: [ox + (W - 0.1) / 2 - 0.08, 1.1, 0.04] });
      if (isDoor) emblem(holder, 0.12, [ox, 0.22, 0.025]);
      return holder;
    };
    side(0, true);
    side(Math.PI / 2, false);
    side(Math.PI, false);
    side(-Math.PI / 2, false);
    mesh(roundedBox(W + 0.1, 0.2, W + 0.1, 0.02), paint, { parent: root, at: [0, H - 0.18, 0] });
    // backlit TELEPHONE headers on all four sides
    const tex = textTexture('TELEPHONE', { w: 512, h: 96, bg: '#1b1b1b', fg: '#fffbe8', font: 'bold 70px Helvetica, Arial', radius: 4 });
    if (tex) { sign.lens.map = tex; sign.lens.emissiveMap = tex; sign.lens.color.set('#ffffff'); sign.lens.emissive.set('#fff3d0'); }
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const g = new THREE.PlaneGeometry(W - 0.1, 0.13);
      g.rotateY(a);
      g.translate(Math.sin(a) * (W / 2 + 0.052), H - 0.18, Math.cos(a) * (W / 2 + 0.052));
      sign.add(root, { geometry: g, normal: [Math.sin(a), 0, Math.cos(a)], depth: 0.005, glowSize: 1.0 });
    }
    mesh(roundedBox(W + 0.16, 0.06, W + 0.16, 0.02), paint, { parent: root, at: [0, H - 0.05, 0] });
    const dome = new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    const dp = dome.attributes.position;
    for (let i = 0; i < dp.count; i++) {
      const x = dp.getX(i);
      const z = dp.getZ(i);
      const r = Math.hypot(x, z);
      const m = Math.max(Math.abs(x), Math.abs(z)) || 1;
      const k = r > 1e-6 ? THREE.MathUtils.lerp(1, r / m, 0.85) : 1;
      dp.setXYZ(i, x * k * (W / 2 + 0.07), dp.getY(i) * 0.24, z * k * (W / 2 + 0.07));
    }
    dome.computeVertexNormals();
    mesh(dome, paint, { parent: root, at: [0, H - 0.02, 0] });
    mesh(lathe([[0.001, 0], [0.05, 0], [0.04, 0.05], [0.06, 0.08], [0.001, 0.12]], 16), paint, { parent: root, at: [0, H + 0.21, 0] });
    // phone mounted on the back glazing bars
    handset(root, [0, 1.35, -W / 2 + 0.005]);
    animations.push(clip('door', 3, [rotateTrack(root.getObjectByName('door'), 'y', 3, (t) => -pingPong(t) * 1.4)]));
  } else if (variant === 'modern') {
    const H = 2.3;
    const steel = mats.galv();
    mesh(roundedBox(W, 0.06, W * 0.7, 0.02), steel, { parent: root, at: [0, 0.03, 0] });
    for (const x of [W / 2 - 0.03, -W / 2 + 0.03]) mesh(roundedBox(0.06, H, 0.06, 0.015), paint, { parent: root, at: [x, H / 2, -W * 0.3] });
    mesh(new THREE.BoxGeometry(W - 0.06, H - 0.4, 0.01), glass, { parent: root, at: [0, (H - 0.4) / 2 + 0.2, -W * 0.3] });
    mesh(roundedBox(W - 0.06, 0.05, 0.05, 0.015), paint, { parent: root, at: [0, 0.2, -W * 0.3] });
    const hood = extrudeOutline([[-W * 0.35, 0], [W * 0.35, 0], [W * 0.35, 0.08], [-W * 0.35, 0.16]], W + 0.06, { bevel: 0.02 });
    hood.rotateY(Math.PI / 2);
    mesh(hood, paint, { parent: root, at: [0, H, 0] });
    handset(root, [0, 1.25, -W * 0.3 + 0.004]);
    const tex = textTexture('PHONE · WIFI', { w: 512, h: 96, bg: '#0e3a5a', fg: '#ffffff', font: 'bold 60px Helvetica, Arial', radius: 4 });
    if (tex) { sign.lens.map = tex; sign.lens.emissiveMap = tex; sign.lens.color.set('#ffffff'); sign.lens.emissive.set('#d8f0ff'); }
    sign.add(root, { geometry: new THREE.PlaneGeometry(W * 0.62, 0.1).translate(0, H + 0.06, W * 0.35 + 0.031), normal: [0, 0, 1], depth: 0.005, glowSize: 0.9 });
    emblem(root, 0.07, [W * 0.4, H + 0.05, W * 0.35 + 0.03]);
  } else {
    // wall phone on a post with an acoustic hood
    mesh(pole(1.9, { r: 0.05, top: 0.05, base: 0.14, baseH: 0.04, collar: false }), mats.galv(), { parent: root, at: [0, 0, -0.1] });
    const hood = new THREE.SphereGeometry(0.4, 32, 16, 0, Math.PI, 0, Math.PI / 2);
    hood.scale(1, 1.3, 0.9);
    hood.rotateX(-Math.PI / 2);
    hood.rotateX(Math.PI / 2);
    const hm = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide, name: 'paint' });
    const shell = new THREE.SphereGeometry(0.42, 32, 16, -Math.PI / 2, Math.PI, 0, Math.PI * 0.62);
    mesh(shell, hm, { parent: root, at: [0, 1.25, -0.06] });
    void hood;
    handset(root, [0, 1.3, -0.05]);
    const tex = textTexture('PHONE', { w: 256, h: 64, bg: '#0e3a5a', fg: '#ffffff', font: 'bold 44px Helvetica, Arial', radius: 4 });
    if (tex) { sign.lens.map = tex; sign.lens.emissiveMap = tex; sign.lens.color.set('#ffffff'); sign.lens.emissive.set('#d8f0ff'); }
    sign.add(root, { geometry: new THREE.PlaneGeometry(0.28, 0.07).translate(0, 1.92, -0.04), normal: [0, 0, 1], depth: 0.005, glowSize: 0.6 });
    mesh(roundedBox(0.3, 0.09, 0.06, 0.02), hm, { parent: root, at: [0, 1.92, -0.075] });
  }
  animations.push(clip('lights', 1, lampTracks('sign', 2.5, { glow: 0.7 })));
  return finish(root, { type: 'phone-booth', variant, o, animations });
}

/* ---------------------------- Vending machine ---------------------------- */

export const VENDING_MACHINE_VARIANTS = {
  drinks: { color: '#c62828' },
  snacks: { color: '#2b3a4a' },
  coffee: { color: '#4e342e' },
  ticket: { color: '#1f5f8b' },
};

export function createVendingMachine(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VENDING_MACHINE_VARIANTS, o.variant, 'vending-machine');
  const v = VENDING_MACHINE_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`vending-machine-${variant}`);
  const paint = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.3, clearcoat: 0.8, name: 'paint' });
  const W = 0.95;
  const H = 1.85;
  const D = 0.8;
  const rand = rng(o.seed ?? 5);
  const back = lampGroup('backlight', 'white');
  back.lens.emissive.set('#f6f9ff');
  back.lens.emissiveIntensity = 0.8;
  for (const x of [W / 2 - 0.08, -W / 2 + 0.08]) for (const z of [D / 2 - 0.08, -D / 2 + 0.08]) mesh(roundedBox(0.06, 0.04, 0.06, 0.012), M.rubber(), { parent: root, at: [x, 0.02, z] });
  const y0 = 0.04;
  const header = (text) => {
    const tex = textTexture(text, { w: 512, h: 96, bg: o.color ?? v.color, fg: '#ffffff', font: 'bold 64px Helvetica, Arial', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(W * 0.86, 0.14), new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.5 }), { parent: root, at: [0, y0 + H - 0.1, D / 2 + 0.003] });
  };
  if (variant === 'drinks' || variant === 'snacks') {
    const winW = W * 0.62;
    const winH = H * 0.66;
    const wx = -W * 0.13;
    const wy = H * 0.58;
    const recess = 0.3;
    mesh(roundedBox(W, H, D - recess, 0.04), paint, { parent: root, at: [0, y0 + H / 2, -recess / 2] });
    const fz = D / 2 - recess / 2;
    const left = wx - winW / 2 + W / 2;
    const right = W / 2 - (wx + winW / 2);
    const topH = H - (wy + winH / 2);
    const botH = wy - winH / 2;
    mesh(roundedBox(left, H, recess, 0.02), paint, { parent: root, at: [-W / 2 + left / 2, y0 + H / 2, fz] });
    mesh(roundedBox(right, H, recess, 0.03), paint, { parent: root, at: [W / 2 - right / 2, y0 + H / 2, fz] });
    mesh(roundedBox(winW + 0.02, topH, recess, 0.02), paint, { parent: root, at: [wx, y0 + H - topH / 2, fz] });
    mesh(roundedBox(winW + 0.02, botH, recess, 0.02), paint, { parent: root, at: [wx, y0 + botH / 2, fz] });
    back.add(root, { geometry: new THREE.PlaneGeometry(winW, winH).translate(wx, wy + 0.04, D / 2 - recess + 0.005), normal: [0, 0, 1], depth: recess, glowSize: 1.6 });
    const shelves = 5;
    const perRow = variant === 'drinks' ? 6 : 5;
    const prodGeo = variant === 'drinks' ? lathe([[0.001, 0], [0.032, 0], [0.033, 0.01], [0.033, 0.11], [0.025, 0.125], [0.001, 0.126]], 16) : roundedBox(0.08, 0.13, 0.02, 0.006);
    const prods = new THREE.InstancedMesh(prodGeo, new THREE.MeshPhysicalMaterial({ roughness: 0.25, metalness: variant === 'drinks' ? 0.8 : 0.1, clearcoat: 1 }), shelves * perRow);
    prods.name = 'products';
    const palette = variant === 'drinks' ? ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a', '#212121'] : ['#e65100', '#f9a825', '#6d4c41', '#1565c0', '#c62828'];
    const m4 = new THREE.Matrix4();
    for (let s = 0; s < shelves; s++) {
      const y = 0.04 + wy - winH / 2 + 0.06 + (s * (winH - 0.08)) / shelves;
      mesh(roundedBox(winW - 0.01, 0.012, recess - 0.02, 0.004), M.metal('#cfd3d6', 0.3), { parent: root, at: [wx, y, D / 2 - recess / 2] });
      const color = palette[s % palette.length];
      for (let k = 0; k < perRow; k++) {
        const i = s * perRow + k;
        prods.setMatrixAt(i, m4.makeTranslation(wx - winW / 2 + 0.06 + (k * (winW - 0.12)) / (perRow - 1), y + 0.006 + (variant === 'drinks' ? 0 : 0.065), D / 2 - recess / 2));
        prods.setColorAt(i, new THREE.Color(rand() < 0.75 ? color : palette[Math.floor(rand() * palette.length)]));
      }
    }
    root.add(prods);
    mesh(new THREE.BoxGeometry(winW, winH, 0.008), new THREE.MeshPhysicalMaterial({ color: '#dfe9ee', roughness: 0.03, transparent: true, opacity: 0.18, depthWrite: false }), { parent: root, at: [wx, wy + 0.04, D / 2 - 0.004] });
    for (const [x, y, w, h] of [[wx, wy + winH / 2 + 0.02, winW + 0.06, 0.04], [wx, wy - winH / 2 - 0.02, winW + 0.06, 0.04], [wx - winW / 2 - 0.02, wy, 0.04, winH + 0.08], [wx + winW / 2 + 0.02, wy, 0.04, winH + 0.08]]) mesh(roundedBox(w, h, 0.03, 0.01), M.plastic('#1a1a1a', 0.4), { parent: root, at: [x, y + 0.04, D / 2] });
    const cx = W / 2 - 0.15;
    mesh(roundedBox(0.16, 0.08, 0.01, 0.01), new THREE.MeshPhysicalMaterial({ color: '#08130c', emissive: '#55ff99', emissiveIntensity: 0.6, name: 'display' }), { parent: root, at: [cx, H * 0.78, D / 2 + 0.005], name: 'display' });
    for (let i = 0; i < 12; i++) mesh(roundedBox(0.035, 0.028, 0.012, 0.006), M.chrome(), { parent: root, at: [cx - 0.045 + (i % 3) * 0.045, H * 0.7 - Math.floor(i / 3) * 0.04, D / 2 + 0.006] });
    mesh(roundedBox(0.1, 0.012, 0.012, 0.004), M.plastic('#111'), { parent: root, at: [cx, H * 0.48, D / 2 + 0.006] });
    mesh(roundedBox(0.12, 0.08, 0.012, 0.01), M.plastic('#111'), { parent: root, at: [cx, H * 0.4, D / 2 + 0.006] });
    mesh(roundedBox(W * 0.6, 0.16, 0.02, 0.02), M.plastic('#151515', 0.4), { parent: root, at: [wx, 0.22, D / 2 + 0.005] });
    emblem(root, 0.11, [cx, H * 0.9, D / 2]);
    header(variant === 'drinks' ? 'COLD DRINKS' : 'SNACKS');
  } else {
    // full-front machines: coffee (big product photo panel) / ticket (screen + slots)
    mesh(roundedBox(W, H, D, 0.04), paint, { parent: root, at: [0, y0 + H / 2, 0] });
    const panelTex = textTexture(variant === 'coffee' ? [['FRESH', 'bold 80px Georgia, serif'], ['COFFEE', 'bold 96px Georgia, serif'], ['☕', '150px serif']] : [['TICKETS', 'bold 80px Helvetica, Arial'], ['Bus · Tram · Metro', '44px Helvetica, Arial']], { w: 512, h: 640, bg: variant === 'coffee' ? '#2b1a12' : '#0e2a44', fg: variant === 'coffee' ? '#f5deb3' : '#ffffff', radius: 0 });
    if (panelTex) { back.lens.map = panelTex; back.lens.emissiveMap = panelTex; back.lens.color.set('#ffffff'); back.lens.emissiveIntensity = 0.6; }
    back.add(root, { geometry: new THREE.PlaneGeometry(W * 0.56, H * 0.6).translate(-W * 0.14, y0 + H * 0.58, D / 2 + 0.004), normal: [0, 0, 1], depth: 0.01, glowSize: 1.5 });
    const cx = W / 2 - 0.15;
    const scr = new THREE.MeshPhysicalMaterial({ color: '#0e1a24', emissive: '#4aa3df', emissiveIntensity: 0.6, roughness: 0.1, clearcoat: 1, name: 'display' });
    mesh(roundedBox(0.18, 0.14, 0.012, 0.01), scr, { parent: root, at: [cx, H * 0.8, D / 2 + 0.006], name: 'display' });
    for (let i = 0; i < 9; i++) mesh(roundedBox(0.045, 0.035, 0.012, 0.006), M.plastic('#d0d0d0'), { parent: root, at: [cx - 0.05 + (i % 3) * 0.05, H * 0.66 - Math.floor(i / 3) * 0.045, D / 2 + 0.006] });
    mesh(roundedBox(0.1, 0.06, 0.03, 0.01), M.plastic('#111'), { parent: root, at: [cx, H * 0.48, D / 2 + 0.015] });
    if (variant === 'coffee') {
      // cup bay with drip tray
      mesh(roundedBox(0.3, 0.32, 0.05, 0.03), M.plastic('#0b0b0b', 0.4), { parent: root, at: [-W * 0.14, 0.42, D / 2 + 0.005] });
      mesh(roundedBox(0.26, 0.02, 0.12, 0.01), M.metal('#cfd3d6', 0.3), { parent: root, at: [-W * 0.14, 0.28, D / 2 + 0.04] });
      mesh(lathe([[0.001, 0], [0.032, 0], [0.04, 0.1], [0.001, 0.1]], 16), M.plastic('#f2efe6', 0.6), { parent: root, at: [-W * 0.14, 0.29, D / 2 + 0.03] });
    } else {
      mesh(roundedBox(0.3, 0.12, 0.04, 0.03), M.plastic('#0b0b0b', 0.4), { parent: root, at: [-W * 0.14, 0.32, D / 2 + 0.005] });
      mesh(roundedBox(0.08, 0.05, 0.03, 0.01), M.plastic('#111'), { parent: root, at: [cx, H * 0.4, D / 2 + 0.015] });
    }
    emblem(root, 0.11, [cx, H * 0.92, D / 2]);
    header(variant === 'coffee' ? 'HOT DRINKS' : 'TICKETS');
  }
  if (style === 'canopy') {
    // small metal awning over the machine
    const frame = mats.powder('#3a3f44');
    const top = y0 + H;
    mesh(roundedBox(W + 0.24, 0.5, 0.04, 0.01), frame, { parent: root, at: [0, top - 0.05, -D / 2 - 0.02] });
    const roof = mesh(roundedBox(W + 0.3, 0.045, D + 0.45, 0.015), frame, { parent: root, at: [0, top + 0.12, 0.2] });
    roof.rotation.x = 0.1;
    for (const s of [1, -1]) {
      const x = s * (W / 2 + 0.1);
      curveTube([[x, top - 0.25, -D / 2 - 0.01], [x, top - 0.02, 0.0], [x, top + 0.07, D / 2 + 0.2]], 0.014, frame, { parent: root, radialSegments: 8 });
      mesh(roundedBox(0.04, 0.04, 0.04, 0.01), frame, { parent: root, at: [x, top - 0.25, -D / 2 - 0.02] });
    }
  }
  const animations = [
    clip('lights', 1, lampTracks('backlight', 1.6, { glow: 0.6 })),
    clip('display', 2, [numberTrack('display.material.emissiveIntensity', 2, (t) => (Math.floor(t * 8) % 2 ? 0.9 : 0.3), 16, THREE.InterpolateDiscrete)]),
  ];
  return finish(root, { type: 'vending-machine', variant, o, animations });
}

/* ----------------------------- Newspaper box ----------------------------- */

export const NEWSPAPER_BOX_VARIANTS = {
  single: { color: '#1565c0' },
  double: { color: '#c62828' },
  free: { color: '#2e7d32' },
};

function paperBox(parent, x, color, title, kind) {
  const g = group(null, { parent, at: [x, 0, 0] });
  const paint = mats.powder(color);
  for (const sx of [0.2, -0.2]) for (const sz of [0.16, -0.16]) mesh(roundedBox(0.04, 0.32, 0.04, 0.01), paint, { parent: g, at: [sx, 0.16, sz] });
  mesh(roundedBox(0.46, 0.66, 0.4, 0.03), paint, { parent: g, at: [0, 0.65, 0] });
  if (kind === 'free') {
    // open front with a stack of free papers inside
    mesh(roundedBox(0.38, 0.44, 0.012, 0.02), M.plastic('#2b2b2b'), { parent: g, at: [0, 0.68, 0.2] });
    mesh(roundedBox(0.32, 0.36, 0.05, 0.006), new THREE.MeshStandardMaterial({ color: '#f2efe6', roughness: 0.9 }), { parent: g, at: [0, 0.66, 0.2] });
    const front = textTexture([['FREE', 'bold 70px Georgia, serif'], ['take one', 'italic 40px Georgia, serif'], ['Arts · Events · Food', '28px Helvetica, Arial']], { w: 256, h: 300, bg: '#f2efe6', fg: '#1b5e20', radius: 0 });
    if (front) mesh(new THREE.PlaneGeometry(0.3, 0.34), new THREE.MeshStandardMaterial({ map: front, roughness: 0.9 }), { parent: g, at: [0, 0.66, 0.2255] });
  } else {
    // window door showing today's front page
    mesh(roundedBox(0.4, 0.34, 0.02, 0.015), paint, { parent: g, at: [0, 0.78, 0.205] });
    const page = textTexture([[title, 'bold 40px Georgia, serif'], ['CITY VOTES YES', 'bold 40px Helvetica, Arial'], ['Weather · Sport · Arts', '28px Helvetica, Arial']], { w: 384, h: 300, bg: '#f2efe6', fg: '#111', radius: 0 });
    if (page) mesh(new THREE.PlaneGeometry(0.34, 0.26), new THREE.MeshStandardMaterial({ map: page, roughness: 0.9 }), { parent: g, at: [0, 0.78, 0.216] });
    mesh(new THREE.PlaneGeometry(0.34, 0.26), new THREE.MeshPhysicalMaterial({ color: '#e8eef0', transparent: true, opacity: 0.2, roughness: 0.05, depthWrite: false }), { parent: g, at: [0, 0.78, 0.218] });
    mesh(roundedBox(0.2, 0.03, 0.03, 0.01), M.chrome(), { parent: g, at: [0, 0.6, 0.225] });
    // coin box
    mesh(roundedBox(0.16, 0.12, 0.06, 0.02), M.metal('#a8adb2', 0.35), { parent: g, at: [0, 1.04, 0.15] });
    mesh(roundedBox(0.03, 0.006, 0.006, 0.002), M.plastic('#111'), { parent: g, at: [0, 1.06, 0.182] });
  }
  const tex = textTexture(title, { w: 512, h: 96, bg: color, fg: '#ffffff', font: 'bold 52px Georgia, serif', radius: 0 });
  if (tex) mesh(new THREE.PlaneGeometry(0.42, 0.08), new THREE.MeshStandardMaterial({ map: tex }), { parent: g, at: [0, 0.48, 0.2005] });
  return g;
}

export function createNewspaperBox(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(NEWSPAPER_BOX_VARIANTS, o.variant, 'newspaper-box');
  const v = NEWSPAPER_BOX_VARIANTS[variant];
  const root = group(`newspaper-box-${variant}`);
  if (variant === 'double') {
    paperBox(root, -0.232, o.color ?? v.color, 'THE DAILY', 'paid');
    paperBox(root, 0.232, '#1565c0', 'MORNING POST', 'paid');
  } else paperBox(root, 0, o.color ?? v.color, variant === 'free' ? 'FREE WEEKLY' : 'CITY TIMES', variant === 'free' ? 'free' : 'paid');
  return finish(root, { type: 'newspaper-box', variant, o, animations: [] });
}

/* ---------------------------------- ATM ---------------------------------- */

export const ATM_VARIANTS = {
  freestanding: { color: '#2b3a4a' },
  wall: { color: '#1f5f8b' },
  'drive-up': { color: '#3a3f44' },
};

function atmFace(parent, at, scale = 1) {
  const g = group('atm_face', { parent, at });
  g.scale.setScalar(scale);
  const scr = lampGroup('screen', 'white');
  scr.lens.emissive.set('#7fc8ff');
  scr.lens.color.set('#0e1a24');
  const tex = textTexture([['WELCOME', 'bold 64px Helvetica, Arial'], ['Insert card', '40px Helvetica, Arial']], { w: 256, h: 192, bg: '#0e3a5a', fg: '#ffffff', radius: 0 });
  if (tex) { scr.lens.map = tex; scr.lens.emissiveMap = tex; scr.lens.color.set('#ffffff'); }
  mesh(roundedBox(0.4, 0.32, 0.06, 0.02), M.plastic('#1a1a1a', 0.4), { parent: g, at: [0, 0.15, 0.03] });
  scr.add(g, { geometry: new THREE.PlaneGeometry(0.3, 0.22).translate(0, 0.15, 0.062), normal: [0, 0, 1], depth: 0.006, glowSize: 0.6 });
  // keypad shelf
  const shelf = mesh(roundedBox(0.44, 0.04, 0.18, 0.015), M.metal('#a8adb2', 0.35), { parent: g, at: [0, -0.06, 0.09] });
  shelf.rotation.x = 0.2;
  for (let i = 0; i < 12; i++) mesh(roundedBox(0.035, 0.012, 0.03, 0.005), M.metal('#d6d8da', 0.3), { parent: g, at: [-0.05 + (i % 3) * 0.045, -0.036, 0.04 + Math.floor(i / 3) * 0.035 + 0.02] });
  // card slot (green LED) + cash slot
  const led = lampGroup('card_led', 'green');
  mesh(roundedBox(0.1, 0.05, 0.04, 0.012), M.plastic('#222'), { parent: g, at: [0.14, 0.0, 0.03] });
  led.add(g, { at: [0.14, 0.0, 0.051], normal: [0, 0, 1], w: 0.07, h: 0.012, shape: 'strip', depth: 0.004, bezel: false, glowSize: 0.15 });
  mesh(roundedBox(0.24, 0.04, 0.05, 0.012), M.plastic('#111'), { parent: g, at: [0, -0.2, 0.03] });
  return g;
}

export function createATM(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(ATM_VARIANTS, o.variant, 'atm');
  const v = ATM_VARIANTS[variant];
  const root = group(`atm-${variant}`);
  const paint = mats.powder(o.color ?? v.color);
  paint.name = 'paint';
  if (variant === 'freestanding') {
    mesh(roundedBox(0.7, 1.55, 0.7, 0.05), paint, { parent: root, at: [0, 0.775, 0] });
    mesh(roundedBox(0.76, 0.4, 0.36, 0.05), paint, { parent: root, at: [0, 1.75, -0.17] });
    atmFace(root, [0, 1.2, 0.35]);
    const top = lampGroup('topsign', 'white');
    const tex = textTexture('CASH', { w: 512, h: 128, bg: '#1565c0', fg: '#ffffff', font: 'bold 96px Helvetica, Arial', radius: 0 });
    if (tex) { top.lens.map = tex; top.lens.emissiveMap = tex; top.lens.color.set('#ffffff'); }
    top.add(root, { geometry: new THREE.PlaneGeometry(0.6, 0.16).translate(0, 1.82, 0.012), normal: [0, 0, 1], depth: 0.005, glowSize: 0.9 });
    emblem(root, 0.09, [0.25, 1.62, 0.01]);
  } else if (variant === 'wall') {
    // through-the-wall ATM in a short section of stone wall
    const wall = mats.concrete('#c9c2b4');
    mesh(roundedBox(1.6, 2.4, 0.35, 0.02), wall, { parent: root, at: [0, 1.2, -0.175] });
    mesh(roundedBox(0.8, 1.2, 0.04, 0.02), paint, { parent: root, at: [0, 1.3, 0.02] });
    atmFace(root, [0, 1.25, 0.04]);
    mesh(roundedBox(0.9, 0.08, 0.3, 0.02), paint, { parent: root, at: [0, 1.95, 0.13] });
    const top = lampGroup('topsign', 'white');
    const tex = textTexture('24h ATM', { w: 512, h: 128, bg: o.color ?? v.color, fg: '#ffffff', font: 'bold 90px Helvetica, Arial', radius: 0 });
    if (tex) { top.lens.map = tex; top.lens.emissiveMap = tex; top.lens.color.set('#ffffff'); }
    top.add(root, { geometry: new THREE.PlaneGeometry(0.7, 0.18).translate(0, 2.1, 0.005), normal: [0, 0, 1], depth: 0.005, glowSize: 0.9 });
    mesh(roundedBox(0.74, 0.22, 0.012, 0.01), paint, { parent: root, at: [0, 2.1, -0.002] });
  } else {
    // drive-up: tall island unit with a canopy, face at car-window height
    mesh(roundedBox(1.2, 0.15, 0.8, 0.04), mats.concrete('#d8d4cc'), { parent: root, at: [0, 0.075, 0] });
    mesh(roundedBox(0.7, 1.6, 0.6, 0.05), paint, { parent: root, at: [0, 0.95, 0] });
    atmFace(root, [0, 1.25, 0.3]);
    for (const x of [-0.5, 0.5]) mesh(pole(2.6, { r: 0.06, top: 0.06, base: 0.14, baseH: 0.04, collar: false }), M.chrome(), { parent: root, at: [x, 0.15, -0.3] });
    mesh(roundedBox(1.6, 0.18, 1.4, 0.04), paint, { parent: root, at: [0, 2.82, 0.2] });
    const top = lampGroup('topsign', 'white');
    const tex = textTexture('DRIVE-UP ATM', { w: 512, h: 96, bg: o.color ?? v.color, fg: '#ffffff', font: 'bold 64px Helvetica, Arial', radius: 0 });
    if (tex) { top.lens.map = tex; top.lens.emissiveMap = tex; top.lens.color.set('#ffffff'); }
    top.add(root, { geometry: new THREE.PlaneGeometry(1.4, 0.14).translate(0, 2.82, 0.902), normal: [0, 0, 1], depth: 0.005, glowSize: 1.2 });
    const canopyLight = lampGroup('canopy_light', 'white');
    canopyLight.add(root, { at: [0, 2.725, 0.4], normal: [0, -1, 0], w: 0.6, h: 0.2, depth: 0.01, bezel: false });
  }
  const tracks = [...lampTracks('screen', 2.5, { glow: 0.5 }), ...lampTracks('topsign', 1.3, { glow: 0.3 }), ...lampTracks('card_led', 2.4, { blink: 1.5 })];
  if (variant === 'drive-up') tracks.push(...lampTracks('canopy_light', 4));
  return finish(root, { type: 'atm', variant, o, animations: [clip('lights', 1 / 1.5, tracks)] });
}

/* ------------------------------ EV charger ------------------------------ */

export const EV_CHARGER_VARIANTS = {
  pedestal: { color: '#e8e8e4' },
  wall: { color: '#2b3034' },
  fast: { color: '#1f5f8b' },
};

export function createEVCharger(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(EV_CHARGER_VARIANTS, o.variant, 'ev-charger');
  const v = EV_CHARGER_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`ev-charger-${variant}`);
  const paint = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.3, clearcoat: 0.6, name: 'paint' });
  const status = lampGroup('status', 'green');
  status.lens.emissive.set('#20e070');
  const cable = M.plastic('#151515', 0.5);
  let H;
  const holster = (parent, at, rotY = 0) => {
    const g = group(null, { parent, at });
    g.rotation.y = rotY;
    mesh(roundedBox(0.09, 0.14, 0.08, 0.02), M.plastic('#222'), { parent: g, at: [0, 0, 0.04] });
    const plug = mesh(roundedBox(0.06, 0.16, 0.06, 0.02), M.plastic('#1a1a1a'), { parent: g, at: [0, -0.02, 0.1] });
    plug.rotation.x = -0.4;
    // drooping cable from the plug down and back to the base
    curveTube([[0, -0.1, 0.12], [0, -0.45, 0.26], [0, -0.8, 0.22], [0, -0.95, 0.06], [0, -0.7, -0.02]], 0.014, cable, { parent: g, segments: 40, radialSegments: 8 });
    return g;
  };
  if (variant === 'pedestal') {
    H = 1.5;
    mesh(roundedBox(0.36, 0.06, 0.28, 0.02), mats.concrete(), { parent: root, at: [0, 0.03, 0] });
    mesh(roundedBox(0.28, H, 0.18, 0.06), paint, { parent: root, at: [0, H / 2 + 0.06, 0] });
    status.add(root, { geometry: new THREE.TorusGeometry(0.06, 0.012, 10, 32).translate(0, H - 0.15, 0.092), normal: [0, 0, 1], depth: 0.01, glowSize: 0.35 });
    mesh(roundedBox(0.16, 0.1, 0.012, 0.015), M.plastic('#0e1a24', 0.2), { parent: root, at: [0, H - 0.4, 0.094] });
    holster(root, [0, 0.95, 0.09]);
    emblem(root, 0.08, [0, 0.4, 0.09]);
    const tex = textTexture('EV', { w: 128, h: 96, bg: o.color ?? v.color, fg: '#20a060', font: 'bold 72px Helvetica, Arial', radius: 0 });
    if (tex) mesh(new THREE.PlaneGeometry(0.12, 0.09), new THREE.MeshStandardMaterial({ map: tex }), { parent: root, at: [0, H - 0.28, 0.0905] });
  } else if (variant === 'wall') {
    // wallbox on a slim steel post with a cable tidy hook
    H = 1.3;
    mesh(pole(1.7, { r: 0.05, top: 0.05, base: 0.14, baseH: 0.04, collar: false }), mats.galv(), { parent: root, at: [0, 0, -0.08] });
    mesh(roundedBox(0.3, 0.4, 0.13, 0.06), paint, { parent: root, at: [0, H, -0.005] });
    status.add(root, { at: [0, H + 0.1, 0.061], normal: [0, 0, 1], w: 0.16, h: 0.018, shape: 'strip', depth: 0.004, bezel: false, glowSize: 0.3 });
    holster(root, [0.08, H - 0.12, 0.06]);
    curveTube([[0, 0.9, -0.03], [0, 0.9, 0.08], [0, 0.95, 0.12]], 0.012, mats.galv(), { parent: root, radialSegments: 8 });
    emblem(root, 0.07, [-0.07, H - 0.08, 0.06]);
  } else {
    // DC fast charger: big cabinet with a screen and two heavy cables
    H = 2.0;
    mesh(roundedBox(0.9, 0.08, 0.55, 0.02), mats.concrete(), { parent: root, at: [0, 0.04, 0] });
    mesh(roundedBox(0.75, H, 0.45, 0.07), paint, { parent: root, at: [0, H / 2 + 0.08, 0] });
    const scr = lampGroup('screen', 'white');
    scr.lens.emissive.set('#9fd8ff');
    const tex = textTexture([['150 kW', 'bold 80px Helvetica, Arial'], ['Tap to start', '44px Helvetica, Arial']], { w: 256, h: 192, bg: '#0e2a44', fg: '#ffffff', radius: 0 });
    if (tex) { scr.lens.map = tex; scr.lens.emissiveMap = tex; scr.lens.color.set('#ffffff'); }
    scr.add(root, { geometry: new THREE.PlaneGeometry(0.4, 0.3).translate(0, 1.5, 0.229), normal: [0, 0, 1], depth: 0.005, glowSize: 0.6 });
    status.add(root, { geometry: new THREE.PlaneGeometry(0.06, H - 0.3).translate(-0.37, H / 2 + 0.08, 0.2), normal: [-1, 0, 0.4], depth: 0.01, glowSize: 0.4 });
    for (const s of [1, -1]) {
      holster(root, [s * 0.375, 1.1, 0], s * Math.PI / 2);
    }
    emblem(root, 0.1, [0.25, H - 0.1, 0.225]);
    label(root, 'FAST CHARGE', 0.5, 0.08, [0, H - 0.1 + 0.08 - 0.06, 0.226], { bg: o.color ?? v.color, fg: '#ffffff' });
  }
  if (style === 'canopy') {
    // solar carport canopy over the bay
    const steel = mats.galv();
    const z0 = -0.6;
    for (const x of [-1.4, 1.4]) mesh(pole(2.84, { r: 0.09, top: 0.09, base: 0.2, baseH: 0.05, collar: false }), steel, { parent: root, at: [x, 0, z0] });
    const roof = group(null, { parent: root, at: [0, 2.7, z0 + 1.4] });
    roof.rotation.x = 0.12;
    mesh(roundedBox(3.4, 0.08, 3.4, 0.03), steel, { parent: roof });
    const pv = new THREE.MeshPhysicalMaterial({ color: '#1a2a4a', roughness: 0.15, metalness: 0.4, clearcoat: 1, name: 'solar-panel' });
    for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) mesh(roundedBox(0.8, 0.02, 0.8, 0.008), pv, { parent: roof, at: [-1.2 + i * 0.8, 0.05, -1.2 + k * 0.8] });
    for (const x of [-1.4, 1.4]) curveTube([[x, 2.5, z0], [x, 2.77, z0 + 0.6]], 0.05, steel, { parent: root, segments: 2, radialSegments: 8 });
  }
  return finish(root, { type: 'ev-charger', variant, o, animations: [clip('charging', 2, [...lampTracks('status', 2.4, { blink: 0.5, glow: 0.7 }), ...(variant === 'fast' ? lampTracks('screen', 2.5, { glow: 0.5 }) : [])])] });
}
