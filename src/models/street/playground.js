import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, curveTube, lathe, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, clip, wave } from '../../core/animation.js';
import { mats, textTexture, tube } from './common.js';
import { finish, styleOf } from './kit.js';

/* Playground equipment, real public-playground proportions. Colour schemes are
 * trims: 'primary' (default red/yellow/blue), 'natural' (timber + rope),
 * 'pastel' and 'retro' (old painted steel) — each also swaps parts. */

const SCHEMES = {
  primary: { frame: '#d32f2f', a: '#f2c200', b: '#1565c0', c: '#2e7d32' },
  pastel: { frame: '#7fb7a4', a: '#f4b6c2', b: '#a7c7e7', c: '#fde69b' },
  retro: { frame: '#2e5d3a', a: '#c62828', b: '#e0a800', c: '#1f5f8b' },
  natural: { frame: '#8a6a48', a: '#6b8e23', b: '#b08a5a', c: '#d2b48c' },
};
const scheme = (style) => SCHEMES[style] ?? SCHEMES.primary;
const paint = (c) => new THREE.MeshPhysicalMaterial({ color: M.toColor(c), roughness: 0.4, clearcoat: 0.4, name: 'paint' });
const hdpe = (c) => new THREE.MeshPhysicalMaterial({ color: M.toColor(c), roughness: 0.5, clearcoat: 0.2, name: 'hdpe' });
const timber = (c = '#8a6a48') => new THREE.MeshStandardMaterial({ color: M.toColor(c), roughness: 0.85, name: 'timber' });

/** Safety surfacing: rubber mat or bark mulch patch under equipment. */
function surface(root, w, d, natural) {
  const m = natural
    ? new THREE.MeshStandardMaterial({ color: '#7a5a3a', roughness: 1, name: 'mulch' })
    : new THREE.MeshStandardMaterial({ color: '#2f6f4f', roughness: 0.95, name: 'rubber-surface' });
  mesh(roundedBox(w, 0.03, d, 0.012), m, { parent: root, at: [0, 0.015, 0] });
  return 0.03;
}

/* --------------------------------- Swing --------------------------------- */

export const SWING_VARIANTS = { double: {}, single: {}, nest: {}, toddler: {} };

export function createSwing(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SWING_VARIANTS, o.variant, 'swing');
  const style = styleOf(o);
  const S = scheme(style);
  const natural = style === 'natural';
  const root = group(`swing-${variant}`);
  const y0 = surface(root, variant === 'single' ? 3.0 : 4.6, 3.2, natural);
  const frame = natural ? timber(S.frame) : paint(o.color ?? S.frame);
  const L = variant === 'single' ? 1.8 : 3.2;
  const H = 2.4;
  // A-frame ends + top beam
  for (const x of [-L / 2, L / 2]) for (const s of [1, -1]) {
    if (natural) {
      const leg = mesh(new THREE.CylinderGeometry(0.06, 0.07, Math.hypot(H, 0.9), 14), frame, { parent: root });
      leg.position.set(x, y0 + H / 2, s * 0.45);
      leg.rotation.x = -s * Math.atan2(0.9, H);
    } else tube([x, y0, s * 0.9], [x, y0 + H, 0], 0.045, frame, { parent: root, radialSegments: 14 });
  }
  if (natural) mesh(new THREE.CylinderGeometry(0.07, 0.07, L + 0.3, 14).rotateZ(Math.PI / 2), frame, { parent: root, at: [0, y0 + H, 0] });
  else tube([-L / 2 - 0.1, y0 + H, 0], [L / 2 + 0.1, y0 + H, 0], 0.055, frame, { parent: root, radialSegments: 16 });
  const chain = natural ? new THREE.MeshStandardMaterial({ color: '#c8b28a', roughness: 1, name: 'rope' }) : M.metal('#b0b4b8', 0.3);
  const seats = variant === 'single' ? [0] : variant === 'nest' ? [0] : [-L / 4, L / 4];
  const tracks = [];
  seats.forEach((x, i) => {
    const pivot = group(`swing_${i}`, { parent: root, at: [x, y0 + H - 0.06, 0] });
    if (variant === 'nest') {
      // round rope-net nest seat on four ropes
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        tube([Math.cos(a) * 0.15, 0, 0], [Math.cos(a) * 0.5, -1.65, Math.sin(a) * 0.5], 0.012, chain, { parent: pivot });
      }
      mesh(new THREE.TorusGeometry(0.55, 0.05, 10, 40).rotateX(Math.PI / 2), hdpe(S.b), { parent: pivot, at: [0, -1.68, 0] });
      const net = new THREE.CircleGeometry(0.54, 24);
      net.rotateX(-Math.PI / 2);
      mesh(net, new THREE.MeshStandardMaterial({ color: '#c62828', roughness: 0.9, side: THREE.DoubleSide, wireframe: false, name: 'net' }), { parent: pivot, at: [0, -1.7, 0] });
    } else {
      const sw = 0.22;
      for (const s of [1, -1]) {
        const links = [];
        for (let k = 0; k <= 20; k++) links.push([s * sw, -k * (1.75 / 20), 0]);
        curveTube(links, 0.007, chain, { parent: pivot, segments: 20, radialSegments: 5 });
        mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), M.metal('#888', 0.4), { parent: pivot, at: [s * sw, 0.02, 0] });
      }
      if (variant === 'toddler' || (i === 1 && style !== 'natural')) {
        // bucket seat with leg holes
        const bucket = lathe([[0.001, 0], [0.18, 0], [0.22, 0.12], [0.24, 0.3], [0.2, 0.3], [0.17, 0.14], [0.001, 0.08]], 24);
        bucket.scale(1.2, 1, 0.9);
        mesh(bucket, hdpe(S.a), { parent: pivot, at: [0, -2.0, 0] });
      } else {
        const seat = natural ? timber('#b08a5a') : M.rubber();
        mesh(roundedBox(0.48, 0.03, 0.18, 0.012), seat, { parent: pivot, at: [0, -1.77, 0] });
      }
    }
    tracks.push(rotateTrack(pivot, 'x', 2.6, (t) => wave(t + i * 0.25) * 0.55, 24));
  });
  return finish(root, { type: 'swing', variant, o, animations: [clip('swing', 2.6, tracks)], lean: false });
}

/* --------------------------------- Slide --------------------------------- */

export const SLIDE_VARIANTS = { straight: {}, spiral: {}, wave: {}, tube: {} };

export function createSlide(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SLIDE_VARIANTS, o.variant, 'slide');
  const style = styleOf(o);
  const S = scheme(style);
  const natural = style === 'natural';
  const root = group(`slide-${variant}`);
  const y0 = surface(root, 5.0, 3.4, natural);
  const frame = natural ? timber(S.frame) : paint(o.color ?? S.frame);
  const P = 1.5; // platform height
  // platform tower: four posts, deck, roof, ladder
  const tx = -1.4;
  for (const dx of [-0.5, 0.5]) for (const dz of [-0.5, 0.5]) {
    if (natural) mesh(roundedBox(0.1, P + 1.3, 0.1, 0.015), frame, { parent: root, at: [tx + dx, y0 + (P + 1.3) / 2, dz] });
    else tube([tx + dx, y0, dz], [tx + dx, y0 + P + 1.3, dz], 0.04, frame, { parent: root });
  }
  mesh(roundedBox(1.1, 0.06, 1.1, 0.015), natural ? timber('#b08a5a') : hdpe(S.c), { parent: root, at: [tx, y0 + P, 0] });
  const roofG = new THREE.ConeGeometry(0.85, 0.55, 4, 1);
  roofG.rotateY(Math.PI / 4);
  mesh(roofG, natural ? timber('#6b4a2e') : hdpe(S.a), { parent: root, at: [tx, y0 + P + 1.55, 0] });
  for (const dz of [-0.5, 0.5]) mesh(roundedBox(1.0, 0.5, 0.04, 0.02), natural ? timber(S.frame) : hdpe(S.b), { parent: root, at: [tx, y0 + P + 0.4, dz] });
  // ladder at the back
  for (const dz of [-0.25, 0.25]) tube([tx - 1.0, y0, dz], [tx - 0.5, y0 + P, dz], 0.03, frame, { parent: root });
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    tube([tx - 1.0 + t * 0.5, y0 + t * P, -0.25], [tx - 1.0 + t * 0.5, y0 + t * P, 0.25], 0.02, natural ? timber() : M.metal('#c9cdd0', 0.3), { parent: root });
  }
  const chute = natural ? M.metal('#c9cdd0', 0.15) : hdpe(S.a);
  chute.side = THREE.DoubleSide;
  const x0 = tx + 0.55;
  if (variant === 'spiral') {
    // helical chute around a central pole
    const cx = x0 + 0.75;
    tube([cx, y0, 0], [cx, y0 + P + 0.4, 0], 0.06, frame, { parent: root });
    const turns = 1.25;
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const a = Math.PI + t * turns * Math.PI * 2;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * 0.7, y0 + P + 0.05 - t * (P - 0.25), Math.sin(a) * 0.7));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const frames = curve.computeFrenetFrames(60, false);
    const pos = [];
    const idx = [];
    const ring = 9;
    for (let i = 0; i <= 60; i++) {
      const p = curve.getPointAt(i / 60);
      const radial = new THREE.Vector3(p.x - cx, 0, p.z).normalize();
      for (let k = 0; k <= ring; k++) {
        const a = Math.PI * (k / ring); // U-shaped trough
        const v = radial.clone().multiplyScalar(Math.cos(a) * 0.28).add(new THREE.Vector3(0, -Math.sin(a) * 0.16 + 0.12, 0));
        pos.push(p.x + v.x, p.y + v.y, p.z + v.z);
      }
    }
    void frames;
    for (let i = 0; i < 60; i++) for (let k = 0; k < ring; k++) {
      const a = i * (ring + 1) + k;
      const b = a + ring + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    mesh(g, chute, { parent: root });
  } else if (variant === 'tube') {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      pts.push(new THREE.Vector3(x0 + t * 3.0, y0 + P + 0.35 - (P + 0.05) * (t * t * (3 - 2 * t)), Math.sin(t * Math.PI) * 0.6));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    mesh(new THREE.TubeGeometry(curve, 60, 0.36, 20, false), chute, { parent: root });
    mesh(new THREE.TorusGeometry(0.36, 0.04, 8, 28).rotateY(Math.PI / 2), frame, { parent: root, at: [pts[30].x, pts[30].y, pts[30].z] });
    tube([pts[30].x, y0, pts[30].z], [pts[30].x, pts[30].y - 0.36, pts[30].z], 0.035, frame, { parent: root });
  } else {
    // straight or wave bed chute with side walls
    const len = 3.0;
    const n = 30;
    const pos = [];
    const idx = [];
    const prof = [[-0.3, 0.22], [-0.27, 0.0], [-0.2, -0.02], [0.2, -0.02], [0.27, 0.0], [0.3, 0.22]];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      let y = y0 + P - t * (P - 0.3);
      if (variant === 'wave') y += Math.sin(t * Math.PI * 3) * 0.12 * (1 - t);
      if (t > 0.88) y = y0 + 0.3 + (1 - t) * 0.5;
      for (const [z, dy] of prof) pos.push(x0 + t * len, y + dy, z);
    }
    for (let i = 0; i < n; i++) for (let k = 0; k < prof.length - 1; k++) {
      const a = i * prof.length + k;
      const b = a + prof.length;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    mesh(g, chute, { parent: root });
    tube([x0 + len - 0.1, y0, 0], [x0 + len - 0.1, y0 + 0.32, 0], 0.035, frame, { parent: root });
    for (const s of [1, -1]) tube([x0 + len - 0.1, y0 + 0.32, s * 0.3], [x0 + len - 0.1, y0 + 0.02, s * 0.35], 0.03, frame, { parent: root });
  }
  return finish(root, { type: 'slide', variant, o, animations: [], lean: false });
}

/* --------------------------------- Seesaw --------------------------------- */

export const SEESAW_VARIANTS = { classic: {}, double: {}, 'spring-rider': {} };

export function createSeesaw(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SEESAW_VARIANTS, o.variant, 'seesaw');
  const style = styleOf(o);
  const S = scheme(style);
  const natural = style === 'natural';
  const root = group(`seesaw-${variant}`);
  const y0 = surface(root, variant === 'spring-rider' ? 1.6 : 4.4, variant === 'double' ? 2.2 : 1.6, natural);
  const frame = natural ? timber(S.frame) : paint(o.color ?? S.frame);
  const tracks = [];
  if (variant === 'spring-rider') {
    // coil spring + animal-shaped rider (a stylised horse)
    const coil = [];
    for (let i = 0; i <= 120; i++) { const t = i / 120; coil.push([Math.cos(t * Math.PI * 16) * 0.13, y0 + 0.05 + t * 0.4, Math.sin(t * Math.PI * 16) * 0.13]); }
    curveTube(coil, 0.018, M.metal('#2b2b2b', 0.5), { parent: root, segments: 400, radialSegments: 6 });
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 20), M.metal('#555', 0.5), { parent: root, at: [0, y0 + 0.025, 0] });
    const rider = group('rider', { parent: root, at: [0, y0 + 0.45, 0] });
    mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 20), M.metal('#555', 0.5), { parent: rider, at: [0, 0.02, 0] });
    const body = new THREE.CapsuleGeometry(0.17, 0.55, 8, 16).rotateZ(Math.PI / 2);
    mesh(body, hdpe(natural ? '#a07a50' : S.a), { parent: rider, at: [0, 0.22, 0] });
    mesh(new THREE.CapsuleGeometry(0.1, 0.25, 6, 12), hdpe(natural ? '#a07a50' : S.a), { parent: rider, at: [0.36, 0.42, 0], rot: [0, 0, -0.5] });
    mesh(new THREE.SphereGeometry(0.12, 16, 12), hdpe(natural ? '#a07a50' : S.a), { parent: rider, at: [0.48, 0.58, 0] });
    for (const s of [1, -1]) mesh(new THREE.ConeGeometry(0.03, 0.08, 8), hdpe(S.b), { parent: rider, at: [0.46, 0.7, s * 0.05] });
    tube([0.3, 0.5, -0.15], [0.3, 0.5, 0.15], 0.018, M.metal('#c9cdd0', 0.3), { parent: rider });
    for (const s of [1, -1]) mesh(roundedBox(0.12, 0.03, 0.1, 0.01), hdpe(S.b), { parent: rider, at: [0.05, 0.12, s * 0.22] });
    mesh(roundedBox(0.3, 0.05, 0.26, 0.02), hdpe(S.c), { parent: rider, at: [-0.05, 0.4, 0] });
    tracks.push(rotateTrack(rider, 'z', 1.6, (t) => wave(t) * 0.25, 24));
  } else {
    const beams = variant === 'double' ? [-0.5, 0.5] : [0];
    // pivot stand
    for (const z of beams) for (const s of [1, -1]) tube([s * 0.3, y0, z - 0.25], [0, y0 + 0.55, z - 0.25], 0.035, frame, { parent: root }) && tube([s * 0.3, y0, z + 0.25], [0, y0 + 0.55, z + 0.25], 0.035, frame, { parent: root });
    beams.forEach((z, i) => {
      const beam = group(`beam_${i}`, { parent: root, at: [0, y0 + 0.58, z] });
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.54, 12).rotateX(Math.PI / 2), M.metal('#555', 0.5), { parent: beam });
      mesh(roundedBox(3.6, 0.07, 0.24, 0.025), natural ? timber('#b08a5a') : hdpe(i ? S.b : S.a), { parent: beam, at: [0, 0.06, 0] });
      for (const s of [1, -1]) {
        mesh(roundedBox(0.36, 0.06, 0.3, 0.025), hdpe(S.c), { parent: beam, at: [s * 1.55, 0.12, 0] });
        tube([s * 1.3, 0.09, -0.12], [s * 1.3, 0.38, 0], 0.018, frame, { parent: beam }) && tube([s * 1.3, 0.09, 0.12], [s * 1.3, 0.38, 0], 0.018, frame, { parent: beam });
        tube([s * 1.3, 0.38, -0.15], [s * 1.3, 0.38, 0.15], 0.02, M.metal('#c9cdd0', 0.3), { parent: beam });
        // rubber stop tyre under each end
        mesh(new THREE.TorusGeometry(0.11, 0.05, 10, 20).rotateX(Math.PI / 2), M.rubber(), { parent: root, at: [s * 1.65, y0 + 0.045, z] });
      }
      tracks.push(rotateTrack(beam, 'z', 2.4, (t) => wave(t + i * 0.5) * 0.22, 24));
    });
  }
  return finish(root, { type: 'seesaw', variant, o, animations: [clip(variant === 'spring-rider' ? 'rock' : 'seesaw', variant === 'spring-rider' ? 1.6 : 2.4, tracks)], lean: false });
}

/* ----------------------------- Climbing frame ----------------------------- */

export const CLIMBING_FRAME_VARIANTS = { dome: {}, 'monkey-bars': {}, net: {} };

export function createClimbingFrame(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(CLIMBING_FRAME_VARIANTS, o.variant, 'climbing-frame');
  const style = styleOf(o);
  const S = scheme(style);
  const natural = style === 'natural';
  const root = group(`climbing-frame-${variant}`);
  const frame = natural ? timber(S.frame) : paint(o.color ?? S.frame);
  const rope = new THREE.MeshStandardMaterial({ color: natural ? '#c8b28a' : '#c62828', roughness: 0.95, name: 'rope' });
  if (variant === 'dome') {
    const y0 = surface(root, 4.6, 4.6, natural);
    // geodesic-ish dome: meridians + parallels of tube
    const R = 1.8;
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const pts = [];
      for (let i = 0; i <= 12; i++) { const t = (i / 12) * (Math.PI / 2); pts.push([Math.cos(a) * Math.cos(t) * R, y0 + Math.sin(t) * R, Math.sin(a) * Math.cos(t) * R]); }
      curveTube(pts, 0.03, frame, { parent: root, segments: 24, radialSegments: 8 });
    }
    for (const t of [0.35, 0.75, 1.15]) {
      mesh(new THREE.TorusGeometry(Math.cos(t) * R, 0.03, 8, 48).rotateX(Math.PI / 2), natural ? rope : hdpe(S.a), { parent: root, at: [0, y0 + Math.sin(t) * R, 0] });
    }
    mesh(new THREE.TorusGeometry(R, 0.04, 8, 48).rotateX(Math.PI / 2), frame, { parent: root, at: [0, y0 + 0.02, 0] });
  } else if (variant === 'monkey-bars') {
    const y0 = surface(root, 4.6, 2.2, natural);
    const L = 3.2;
    const H = 2.0;
    for (const x of [-L / 2, L / 2]) for (const z of [-0.3, 0.3]) tube([x, y0, z], [x, y0 + H, z], 0.04, frame, { parent: root });
    for (const z of [-0.3, 0.3]) tube([-L / 2, y0 + H, z], [L / 2, y0 + H, z], 0.04, frame, { parent: root });
    for (let i = 0; i <= 10; i++) tube([-L / 2 + (i * L) / 10, y0 + H, -0.3], [-L / 2 + (i * L) / 10, y0 + H, 0.3], 0.02, M.metal('#c9cdd0', 0.3), { parent: root });
    for (const x of [-L / 2, L / 2]) for (let i = 1; i < 5; i++) tube([x, y0 + i * 0.38, -0.3], [x, y0 + i * 0.38, 0.3], 0.02, natural ? timber() : hdpe(S.a), { parent: root });
  } else {
    const y0 = surface(root, 4.2, 3.4, natural);
    // pyramid rope net on a central mast
    const H = 3.0;
    tube([0, y0, 0], [0, y0 + H, 0], 0.06, frame, { parent: root });
    const base = 1.6;
    const corners = [[base, base], [-base, base], [-base, -base], [base, -base]];
    for (const [x, z] of corners) {
      tube([0, y0 + H, 0], [x, y0, z], 0.018, rope, { parent: root });
      mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 12), M.metal('#555', 0.5), { parent: root, at: [x, y0 + 0.04, z] });
    }
    for (let l = 1; l < 6; l++) {
      const t = l / 6;
      const pts = corners.map(([x, z]) => [x * (1 - t), y0 + t * H, z * (1 - t)]);
      for (let k = 0; k < 4; k++) tube(pts[k], pts[(k + 1) % 4], 0.014, rope, { parent: root });
    }
    for (let k = 0; k < 4; k++) for (let j = 1; j < 4; j++) {
      const [x1, z1] = corners[k];
      const [x2, z2] = corners[(k + 1) % 4];
      const bx = x1 + ((x2 - x1) * j) / 4;
      const bz = z1 + ((z2 - z1) * j) / 4;
      tube([0, y0 + H, 0], [bx, y0, bz], 0.012, rope, { parent: root });
    }
    for (let k = 0; k < 4; k++) tube([...[corners[k][0], y0 + 0.02, corners[k][1]]], [corners[(k + 1) % 4][0], y0 + 0.02, corners[(k + 1) % 4][1]], 0.02, rope, { parent: root });
    mesh(new THREE.SphereGeometry(0.1, 16, 12), hdpe(S.a), { parent: root, at: [0, y0 + H + 0.05, 0] });
  }
  return finish(root, { type: 'climbing-frame', variant, o, animations: [], lean: false });
}

/* -------------------------------- Sandbox -------------------------------- */

export const SANDBOX_VARIANTS = { square: {}, round: {}, covered: {} };

export function createSandbox(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SANDBOX_VARIANTS, o.variant, 'sandbox');
  const style = styleOf(o);
  const S = scheme(style);
  const natural = style === 'natural' || style == null;
  const root = group(`sandbox-${variant}`);
  const sand = new THREE.MeshStandardMaterial({ color: '#e3cf9a', roughness: 1, name: 'sand' });
  const edge = natural ? timber('#9c7a52') : hdpe(S.b);
  if (variant === 'round') {
    mesh(lathe([[1.0, 0], [1.15, 0], [1.15, 0.3], [1.0, 0.3]], 48), edge, { parent: root }).material.side = THREE.DoubleSide;
    mesh(new THREE.TorusGeometry(1.075, 0.09, 10, 48).rotateX(Math.PI / 2), edge, { parent: root, at: [0, 0.3, 0] });
    mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.22, 40), sand, { parent: root, at: [0, 0.11, 0] });
  } else {
    const W = 2.2;
    for (const s of [1, -1]) {
      mesh(roundedBox(W, 0.3, 0.12, 0.02), edge, { parent: root, at: [0, 0.15, s * (W / 2 - 0.06)] });
      mesh(roundedBox(0.12, 0.3, W - 0.24, 0.02), edge, { parent: root, at: [s * (W / 2 - 0.06), 0.15, 0] });
    }
    // corner seats
    for (const [x, z] of [[1, 1], [-1, -1]]) {
      const seat = new THREE.Shape();
      seat.moveTo(0, 0); seat.lineTo(0.4, 0); seat.lineTo(0, 0.4); seat.closePath();
      const g = new THREE.ExtrudeGeometry(seat, { depth: 0.04, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      g.scale(-x, 1, z);
      mesh(g, edge, { parent: root, at: [x * (W / 2 - 0.12), 0.27, z * (W / 2 - 0.12)] });
    }
    mesh(roundedBox(W - 0.24, 0.22, W - 0.24, 0.01), sand, { parent: root, at: [0, 0.11, 0] });
    if (variant === 'covered') {
      // shade sail on four posts
      const posts = [[1.4, 1.4, 2.6], [-1.4, 1.4, 2.2], [-1.4, -1.4, 2.6], [1.4, -1.4, 2.2]];
      for (const [x, z, h] of posts) tube([x, 0, z], [x, h, z], 0.05, paint('#e8e8e4'), { parent: root });
      const g = new THREE.BufferGeometry();
      const v = posts.map(([x, z, h]) => [x * 0.98, h - 0.05, z * 0.98]).flat();
      g.setAttribute('position', new THREE.Float32BufferAttribute([...v, 0, 2.25, 0], 3));
      g.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]);
      g.computeVertexNormals();
      mesh(g, new THREE.MeshStandardMaterial({ color: S.a, side: THREE.DoubleSide, roughness: 0.8, name: 'shade-sail' }), { parent: root });
    }
  }
  // toys: bucket + spade
  mesh(lathe([[0.001, 0], [0.07, 0], [0.09, 0.14], [0.085, 0.14], [0.065, 0.01], [0.001, 0.01]], 20), hdpe(S.a), { parent: root, at: [0.3, 0.22, 0.2] });
  const spade = mesh(roundedBox(0.06, 0.012, 0.3, 0.005), hdpe(S.c), { parent: root, at: [-0.3, 0.228, -0.1] });
  spade.rotation.y = 0.6;
  // a sandcastle
  mesh(lathe([[0.001, 0], [0.16, 0], [0.12, 0.12], [0.08, 0.12], [0.08, 0.2], [0.001, 0.2]], 8), sand, { parent: root, at: [-0.2, 0.22, 0.35] });
  return finish(root, { type: 'sandbox', variant, o, animations: [], lean: false });
}

/* ---------------------------- Merry-go-round ---------------------------- */

export const MERRY_GO_ROUND_VARIANTS = { classic: {}, modern: {} };

export function createMerryGoRound(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(MERRY_GO_ROUND_VARIANTS, o.variant, 'merry-go-round');
  const style = styleOf(o);
  const S = scheme(style);
  const natural = style === 'natural';
  const root = group(`merry-go-round-${variant}`);
  const y0 = surface(root, 3.4, 3.4, natural);
  mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.12, 20), M.metal('#555', 0.5), { parent: root, at: [0, y0 + 0.06, 0] });
  const spin = group('spinner', { parent: root, at: [0, y0 + 0.12, 0] });
  const R = 1.2;
  if (variant === 'classic') {
    mesh(new THREE.CylinderGeometry(R, R, 0.05, 48), natural ? timber('#b08a5a') : paint(S.b), { parent: spin, at: [0, 0.18, 0] });
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.052, 48, 1, false, a, Math.PI / 6), paint(k % 2 ? S.a : S.frame));
      m.position.y = 0.181;
      spin.add(m);
      tube([0, 0.82, 0], [Math.cos(a) * (R - 0.08), 0.2, Math.sin(a) * (R - 0.08)], 0.022, M.metal('#c9cdd0', 0.3), { parent: spin });
    }
    tube([0, 0.2, 0], [0, 0.85, 0], 0.05, M.metal('#c9cdd0', 0.3), { parent: spin });
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.17, 16), M.metal('#555', 0.5), { parent: spin, at: [0, 0.085, 0] });
  } else {
    // dish-shaped inclusive spinner flush with the ground with grab bars
    mesh(lathe([[0.001, 0.02], [R * 0.6, 0.02], [R, 0.14], [R, 0.18], [R * 0.6, 0.08], [0.001, 0.08]], 48), hdpe(S.b), { parent: spin });
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const x = Math.cos(a) * 0.7;
      const z = Math.sin(a) * 0.7;
      tube([x, 0.03, z], [x, 0.7, z], 0.025, paint(S.frame), { parent: spin });
      mesh(new THREE.SphereGeometry(0.035, 12, 8), paint(S.frame), { parent: spin, at: [x, 0.7, z] });
    }
    mesh(new THREE.TorusGeometry(0.7, 0.022, 8, 48).rotateX(Math.PI / 2), paint(S.frame), { parent: spin, at: [0, 0.62, 0] });
    mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16), M.metal('#555', 0.5), { parent: spin, at: [0, 0.05, 0] });
  }
  return finish(root, { type: 'merry-go-round', variant, o, animations: [clip('spin', 4, [rotateTrack(spin, 'y', 4, (t) => t * Math.PI * 2, 48)])], lean: false });
}
