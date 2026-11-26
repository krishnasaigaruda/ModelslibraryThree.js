import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, curveTube, lathe, extrudeOutline, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, numberTrack, clip } from '../../core/animation.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { mats, pole, textTexture, emblem } from './common.js';
import { finish, styleOf, curvedRoof } from './kit.js';
import { createBench } from './furniture.js';
import { signPlate } from './lights.js';

/* Traffic management: bollards, cones, barriers, bus stops, guard rails. */

const reflective = () => new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.25, metalness: 0.2, name: 'reflective' });

/** Flashing amber barricade lamp (round lens in a yellow housing). */
function barricadeLamp(parent, at, grp) {
  const g = group(null, { parent, at });
  mesh(roundedBox(0.04, 0.06, 0.04, 0.01), M.plastic('#222'), { parent: g, at: [0, 0.03, 0] });
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 28).rotateX(Math.PI / 2), M.plastic('#f2c200', 0.4), { parent: g, at: [0, 0.15, 0] });
  for (const s of [1, -1]) grp.add(g, { at: [0, 0.15, s * 0.03], normal: [0, 0, s], w: 0.16, h: 0.16, shape: 'round', depth: 0.015, bezel: false, glowSize: 0.6 });
  return g;
}

/* ------------------------------- Bollard ------------------------------- */

export const BOLLARD_VARIANTS = {
  steel: { color: '#b9bdc1' },
  concrete: { color: '#b4afa7' },
  lit: { color: '#2b2f33' },
  'cast-iron': { color: '#1f2622' },
  flexible: { color: '#ff6a13' },
  sphere: { color: '#c4bfb6' },
  removable: { color: '#f2c200' },
};

function bollardShape(parent, variant, o, v, x = 0, idx = 0) {
  const g = group(null, { parent, at: [x, 0, 0] });
  let top = 1.0;
  if (variant === 'steel') {
    mesh(lathe([[0.001, 0], [0.085, 0], [0.085, 0.9], [0.08, 0.95], [0.06, 0.985], [0.001, 1.0]], 32), mats.steel(), { parent: g });
    for (const y of [0.78, 0.84]) mesh(lathe([[0.0865, 0], [0.0865, 0.035]], 32), new THREE.MeshStandardMaterial({ color: '#f5c400', roughness: 0.3, side: THREE.DoubleSide }), { parent: g, at: [0, y, 0] });
  } else if (variant === 'concrete') {
    mesh(lathe([[0.001, 0], [0.24, 0], [0.24, 0.02], [0.22, 0.05], [0.18, 0.55], [0.17, 0.6], [0.12, 0.66], [0.001, 0.68]], 40), mats.concrete(o.color ?? v.color), { parent: g });
    top = 0.68;
  } else if (variant === 'lit') {
    const paint = mats.powder(o.color ?? v.color);
    mesh(lathe([[0.001, 0], [0.1, 0], [0.1, 0.7], [0.001, 0.7]], 32), paint, { parent: g });
    const ring = lampGroup(idx ? `light_${idx}` : 'light', 'white');
    ring.lens.emissive.set('#fff1d0');
    ring.add(g, { geometry: new THREE.CylinderGeometry(0.096, 0.096, 0.14, 32, 1, true).translate(0, 0.77, 0), normal: [0, 0, 1], depth: 0.1, glowSize: 0.6 });
    for (const n of [[1, 0, 0], [-1, 0, 0], [0, 0, -1]]) {
      const c = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), ring.glow);
      c.userData.noShadow = true;
      c.position.set(n[0] * 0.11, 0.77, n[2] * 0.11);
      c.lookAt(n[0] * 2, 0.77, n[2] * 2);
      g.add(c);
    }
    mesh(lathe([[0.001, 0.98], [0.11, 0.97], [0.115, 0.93], [0.1, 0.9], [0.1, 0.84], [0.001, 0.84]], 32), paint, { parent: g });
    mesh(new THREE.CylinderGeometry(0.098, 0.098, 0.004, 32), paint, { parent: g, at: [0, 0.702, 0] });
  } else if (variant === 'cast-iron') {
    mesh(lathe([[0.001, 0], [0.14, 0], [0.14, 0.04], [0.11, 0.07], [0.1, 0.12], [0.08, 0.2], [0.075, 0.75], [0.09, 0.78], [0.09, 0.82], [0.07, 0.86], [0.05, 0.92], [0.03, 0.96], [0.001, 0.97]], 32), mats.castIron(o.color ?? v.color), { parent: g });
    mesh(new THREE.TorusGeometry(0.078, 0.01, 8, 32).rotateX(Math.PI / 2), mats.castIron(o.color ?? v.color), { parent: g, at: [0, 0.65, 0] });
    top = 0.97;
  } else if (variant === 'flexible') {
    // flexible delineator post on a rubber base
    mesh(lathe([[0.001, 0], [0.13, 0], [0.13, 0.02], [0.06, 0.05], [0.001, 0.05]], 32), M.rubber(), { parent: g });
    const orange = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.45, clearcoat: 0.4, name: 'paint' });
    mesh(lathe([[0.001, 0.05], [0.04, 0.05], [0.04, 1.0], [0.03, 1.02], [0.001, 1.03]], 24), orange, { parent: g });
    for (const y of [0.78, 0.88]) mesh(lathe([[0.0405, 0], [0.0405, 0.06]], 24), reflective(), { parent: g, at: [0, y, 0] }).material.side = THREE.DoubleSide;
    top = 1.03;
  } else if (variant === 'sphere') {
    const s = mats.concrete(o.color ?? v.color);
    mesh(new THREE.SphereGeometry(0.3, 32, 20), s, { parent: g, at: [0, 0.29, 0] });
    mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 24), s, { parent: g, at: [0, 0.02, 0] });
    top = 0.59;
  } else {
    // removable bollard: yellow post in a flush socket with padlock + reflective band
    mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.012, 24), M.metal('#9aa0a6', 0.4), { parent: g, at: [0, 0.006, 0] });
    const y = mats.powder(o.color ?? v.color);
    mesh(lathe([[0.001, 0.012], [0.06, 0.012], [0.06, 0.88], [0.05, 0.9], [0.001, 0.905]], 24), y, { parent: g });
    mesh(lathe([[0.0605, 0], [0.0605, 0.07]], 24), reflective(), { parent: g, at: [0, 0.74, 0] }).material.side = THREE.DoubleSide;
    mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 16), M.chrome(), { parent: g, at: [0, 0.86, 0] });
    mesh(roundedBox(0.04, 0.05, 0.02, 0.008), M.metal('#c9a227', 0.3), { parent: g, at: [0, 0.2, 0.068] });
    top = 0.905;
  }
  return { g, top };
}

export function createBollard(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BOLLARD_VARIANTS, o.variant, 'bollard');
  const v = BOLLARD_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`bollard-${variant}`);
  const animations = [];
  if (style === 'chained') {
    // a pair joined by a sagging chain
    const L = 1.6;
    const { top } = bollardShape(root, variant, o, v, -L / 2, 0);
    bollardShape(root, variant, o, v, L / 2, 1);
    const y = top - 0.12;
    const r = { steel: 0.08, concrete: 0.17, lit: 0.095, 'cast-iron': 0.07, flexible: 0.035, sphere: 0.24, removable: 0.055 }[variant];
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push([-L / 2 + r + t * (L - 2 * r), y - Math.sin(t * Math.PI) * 0.25, 0]);
    }
    const chain = M.metal('#a0a4a8', 0.35);
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const n = 30;
    for (let i = 0; i < n; i++) {
      const p = curve.getPointAt((i + 0.5) / n);
      const t = curve.getTangentAt((i + 0.5) / n);
      const link = mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 12), chain, { parent: root, at: [p.x, p.y, p.z] });
      link.scale.set(1.5, 1, 1);
      link.rotation.z = Math.atan2(t.y, t.x);
      link.rotation.x = i % 2 ? Math.PI / 2 : 0;
    }
    if (variant === 'lit') animations.push(clip('lights', 1, [...lampTracks('light', 3), ...lampTracks('light_1', 3)]));
  } else {
    bollardShape(root, variant, o, v);
    if (variant === 'lit') animations.push(clip('lights', 1, lampTracks('light', 3)));
  }
  return finish(root, { type: 'bollard', variant, o, animations });
}

/* ----------------------------- Traffic cone ----------------------------- */

export const TRAFFIC_CONE_VARIANTS = {
  cone: { color: '#ff6a13' },
  tall: { color: '#ff6a13' },
  drum: { color: '#ff6a13' },
  delineator: { color: '#ff6a13' },
};

export function createTrafficCone(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(TRAFFIC_CONE_VARIANTS, o.variant, 'traffic-cone');
  const v = TRAFFIC_CONE_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`traffic-cone-${variant}`);
  const orange = new THREE.MeshPhysicalMaterial({ color: M.toColor(o.color ?? v.color), roughness: 0.45, clearcoat: 0.4, name: 'paint' });
  const white = reflective();
  let top;
  if (variant === 'drum') {
    const R = 0.28;
    mesh(lathe([[0.001, 0], [0.4, 0], [0.4, 0.06], [0.001, 0.06]], 40), M.rubber(), { parent: root });
    const bands = [[0.06, 0.25, orange], [0.25, 0.38, white], [0.38, 0.55, orange], [0.55, 0.68, white], [0.68, 0.86, orange]];
    for (const [a, b, m] of bands) mesh(lathe([[R + 0.002, a], [R - (b - a) * 0.01, b]], 40), m, { parent: root }).material.side = THREE.DoubleSide;
    for (const y of [0.25, 0.55, 0.86]) mesh(new THREE.TorusGeometry(R + 0.004, 0.012, 8, 40).rotateX(Math.PI / 2), orange, { parent: root, at: [0, y, 0] });
    mesh(lathe([[R, 0.86], [R * 0.6, 0.98], [0.001, 1.0]], 40), orange, { parent: root });
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 16), orange, { parent: root, at: [0, 1.02, 0] });
    top = 1.05;
  } else if (variant === 'delineator') {
    mesh(roundedBox(0.4, 0.06, 0.4, 0.02), M.rubber(), { parent: root, at: [0, 0.03, 0] });
    const g = extrudeOutline([[-0.1, 0], [0.1, 0], [0.08, 1.05], [0.06, 1.1], [-0.06, 1.1], [-0.08, 1.05]], 0.06, { bevel: 0.015 });
    mesh(g, orange, { parent: root, at: [0, 0.06, 0] });
    for (const y of [0.55, 0.8]) mesh(roundedBox(0.17, 0.1, 0.062, 0.01), white, { parent: root, at: [0, y, 0] });
    mesh(new THREE.TorusGeometry(0.035, 0.012, 8, 20), orange, { parent: root, at: [0, 1.2, 0] });
    top = 1.18;
  } else {
    const H = variant === 'tall' ? 0.9 : 0.7;
    const r0 = variant === 'tall' ? 0.15 : 0.16;
    const r1 = 0.03;
    const rAt = (y) => r0 + (r1 - r0) * ((y - 0.035) / (H - 0.035));
    mesh(roundedBox(0.38, 0.035, 0.38, 0.015), M.rubber(), { parent: root, at: [0, 0.0175, 0] });
    const bands = variant === 'tall' ? [[0.035, 0.42, orange], [0.42, 0.54, white], [0.54, 0.64, orange], [0.64, 0.74, white], [0.74, H, orange]] : [[0.035, 0.36, orange], [0.36, 0.48, white], [0.48, H, orange]];
    for (const [a, b, m] of bands) mesh(lathe([[rAt(a), a], [rAt(b), b]], 40), m, { parent: root }).material.side = THREE.DoubleSide;
    mesh(lathe([[r1, H], [r1 * 0.9, H + 0.01], [0.001, H + 0.012]], 24), orange, { parent: root });
    top = H + 0.01;
  }
  const animations = [];
  if (style === 'lit') {
    const lamp = lampGroup('beacon', 'amber');
    barricadeLamp(root, [0, top, 0], lamp);
    animations.push(clip('flashing', 1, lampTracks('beacon', 2.6, { blink: 1.2 })));
  }
  return finish(root, { type: 'traffic-cone', variant, o, animations });
}

/* -------------------------------- Barrier -------------------------------- */

export const BARRIER_VARIANTS = {
  jersey: { color: '#b3aea5' },
  sawhorse: { color: '#d32f2f' },
  crowd: { color: '#a3a8ad' },
  boom: { color: '#d32f2f' },
  'water-filled': { color: '#ff6a13' },
  'pedestrian-railing': { color: '#2b5f3a' },
};

/** Board with diagonal red/white chevrons on a canvas (fallback: plain stripes). */
function chevronBoard(len, h, d, color) {
  const g = new THREE.Group();
  const tex = typeof document !== 'undefined' ? (() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = Math.round((512 * h) / len);
    const x = c.getContext('2d');
    x.fillStyle = '#f4f4f4';
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = color;
    const step = c.height * 1.4;
    for (let i = -2; i < c.width / step + 2; i++) {
      x.beginPath();
      x.moveTo(i * step, c.height); x.lineTo(i * step + step / 2, c.height); x.lineTo(i * step + step / 2 + c.height, 0); x.lineTo(i * step + c.height, 0);
      x.closePath();
      x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })() : null;
  const faceMat = tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, metalness: 0.1, name: 'reflective' }) : new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
  mesh(roundedBox(len, h, d, Math.min(0.012, d / 2.2)), new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.4 }), { parent: g });
  for (const s of [1, -1]) {
    const p = mesh(new THREE.PlaneGeometry(len - 0.02, h - 0.02), faceMat, { parent: g, at: [0, 0, s * (d / 2 + 0.001)] });
    if (s < 0) p.rotation.y = Math.PI;
  }
  return g;
}

export function createBarrier(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BARRIER_VARIANTS, o.variant, 'barrier');
  const v = BARRIER_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`barrier-${variant}`);
  const animations = [];
  let oneShot = [];
  let top = [0, 1.0, 0];
  let front = 0.05;
  if (variant === 'jersey') {
    const L = o.length ?? 2.0;
    const prof = [[-0.3, 0], [0.3, 0], [0.3, 0.08], [0.18, 0.25], [0.08, 0.81], [-0.08, 0.81], [-0.18, 0.25], [-0.3, 0.08]];
    const g = extrudeOutline(prof, L, { bevel: 0.015 });
    g.rotateY(Math.PI / 2);
    mesh(g, mats.concrete(o.color ?? v.color), { parent: root });
    // fork-lift slots + lifting eyes
    for (const x of [-0.55, 0.55]) mesh(roundedBox(0.2, 0.08, 0.605, 0.02), new THREE.MeshStandardMaterial({ color: '#2b2b2b', roughness: 1 }), { parent: root, at: [x, 0.04, 0] });
    for (const x of [-0.5, 0.5]) mesh(new THREE.TorusGeometry(0.035, 0.01, 8, 16), M.metal('#8a8a8a', 0.5), { parent: root, at: [x, 0.83, 0] });
    top = [L / 2 - 0.2, 0.82, 0];
    front = 0.14;
  } else if (variant === 'sawhorse') {
    const L = 1.6;
    const legs = mats.powder('#e8e8e4');
    for (const x of [L / 2 - 0.12, -L / 2 + 0.12]) for (const s of [1, -1]) curveTube([[x, 0.02, s * 0.3], [x, 1.0, 0]], 0.022, legs, { parent: root, segments: 2, radialSegments: 10 });
    for (const x of [L / 2 - 0.12, -L / 2 + 0.12]) for (const s of [1, -1]) mesh(roundedBox(0.08, 0.03, 0.08, 0.01), M.rubber(), { parent: root, at: [x, 0.015, s * 0.3] });
    const b1 = chevronBoard(L, 0.2, 0.025, o.color ?? v.color);
    b1.position.set(0, 0.88, 0.04);
    root.add(b1);
    const b2 = chevronBoard(L, 0.2, 0.025, o.color ?? v.color);
    b2.position.set(0, 0.55, 0.13);
    b2.rotation.x = -0.32;
    root.add(b2);
    top = [L / 2 - 0.12, 1.0, 0];
    front = 0.06;
  } else if (variant === 'crowd') {
    const L = 2.2;
    const H = 1.1;
    const m = mats.galv();
    const rr = 0.08;
    const frame = [];
    const corner = (cx, cy, a0) => { for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * (Math.PI / 2); frame.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 0]); } };
    const edge = (x0, y0, x1, y1) => { for (let k = 1; k < 10; k++) frame.push([x0 + ((x1 - x0) * k) / 10, y0 + ((y1 - y0) * k) / 10, 0]); };
    corner(L / 2 - rr, H - rr, 0); edge(L / 2 - rr, H, -L / 2 + rr, H);
    corner(-L / 2 + rr, H - rr, Math.PI / 2); edge(-L / 2, H - rr, -L / 2, 0.15 + rr);
    corner(-L / 2 + rr, 0.15 + rr, Math.PI); edge(-L / 2 + rr, 0.15, L / 2 - rr, 0.15);
    corner(L / 2 - rr, 0.15 + rr, Math.PI * 1.5); edge(L / 2, 0.15 + rr, L / 2, H - rr);
    curveTube(frame, 0.022, m, { parent: root, segments: 260, radialSegments: 10, closed: true });
    for (let i = 1; i < 14; i++) {
      const x = -L / 2 + (i * L) / 14;
      curveTube([[x, 0.17, 0], [x, H - 0.02, 0]], 0.009, m, { parent: root, segments: 2, radialSegments: 8 });
    }
    for (const x of [-L / 2 + 0.05, L / 2 - 0.05]) for (const s of [1, -1]) curveTube([[x, 0.15, 0], [x, 0.02, s * 0.32]], 0.02, m, { parent: root, segments: 2, radialSegments: 8 });
    top = [L / 2 - 0.1, H + 0.02, 0];
    front = 0.008;
  } else if (variant === 'boom') {
    const housing = mats.powder('#f2c200');
    mesh(roundedBox(0.35, 1.0, 0.35, 0.04), housing, { parent: root, at: [0, 0.5, 0] });
    mesh(roundedBox(0.37, 0.04, 0.37, 0.015), housing, { parent: root, at: [0, 1.02, 0] });
    const arm = group('arm', { parent: root, at: [0, 0.88, 0.2] });
    const boom = chevronBoard(4, 0.1, 0.06, o.color ?? v.color);
    boom.position.set(2.05, 0, 0);
    arm.add(boom);
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 20).rotateX(Math.PI / 2), housing, { parent: arm });
    // fork rest at the far end
    mesh(pole(0.82, { r: 0.03, base: 0.1, baseH: 0.03, collar: false }), housing, { parent: root, at: [3.9, 0, 0.2] });
    mesh(roundedBox(0.12, 0.06, 0.05, 0.015), housing, { parent: root, at: [3.9, 0.82, 0.2] });
    animations.push(clip('raise', 1.5, [rotateTrack(arm, 'z', 1.5, (t) => THREE.MathUtils.smoothstep(t, 0, 1) * (Math.PI / 2 - 0.05))]), clip('lower', 1.5, [rotateTrack(arm, 'z', 1.5, (t) => (1 - THREE.MathUtils.smoothstep(t, 0, 1)) * (Math.PI / 2 - 0.05))]));
    oneShot = ['raise', 'lower'];
    top = [0, 1.04, 0];
    front = 0.18;
  } else if (variant === 'water-filled') {
    // two interlocking blow-moulded plastic barriers (orange + white)
    const prof = [[-0.24, 0], [0.24, 0], [0.24, 0.1], [0.12, 0.3], [0.09, 0.98], [-0.09, 0.98], [-0.12, 0.3], [-0.24, 0.1]];
    [o.color ?? v.color, '#f4f4f4'].forEach((c, i) => {
      const g = extrudeOutline(prof, 1.0, { bevel: 0.04 });
      g.rotateY(Math.PI / 2);
      mesh(g, new THREE.MeshPhysicalMaterial({ color: M.toColor(c), roughness: 0.5, clearcoat: 0.3, name: i ? 'plastic' : 'paint' }), { parent: root, at: [(i - 0.5) * 1.02, 0, 0] });
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 20), M.plastic('#222'), { parent: root, at: [(i - 0.5) * 1.02 + 0.25, 0.99, 0] });
      label(root, i ? 'ROAD CLOSED' : 'KEEP OUT', 0.4, 0.13, [(i - 0.5) * 1.02, 0.62, 0.152], i ? '#c62828' : '#111');
    });
    top = [0.25, 0.98, 0];
    front = 0.11;
  } else {
    // painted steel pedestrian guardrail with a see-through visibility panel
    const L = 2.0;
    const m = mats.powder(o.color ?? v.color);
    for (const x of [-L / 2, L / 2]) mesh(roundedBox(0.06, 1.05, 0.06, 0.015), m, { parent: root, at: [x, 0.525, 0] });
    for (const y of [0.18, 1.0]) mesh(roundedBox(L, 0.05, 0.05, 0.015), m, { parent: root, at: [0, y, 0] });
    for (let i = 1; i < 20; i++) mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.8, 8), m, { parent: root, at: [-L / 2 + (i * L) / 20, 0.59, 0] });
    mesh(roundedBox(0.5, 0.3, 0.012, 0.01), m, { parent: root, at: [0, 0.65, 0.016] });
    top = [L / 2, 1.05, 0];
    front = 0.019;
  }
  if (style === 'lit') {
    const lamp = lampGroup('beacon', 'amber');
    barricadeLamp(root, top, lamp);
    animations.push(clip('flashing', 1, lampTracks('beacon', 2.6, { blink: 1.2 })));
  }
  if (style === 'signed') {
    // ROAD CLOSED / DETOUR plate fixed to the front
    const { group: plate, h } = signPlate('no-entry', {}, 0.7);
    const onTop = variant === 'jersey' || variant === 'water-filled';
    let y = variant === 'boom' ? 0.62 : variant === 'pedestrian-railing' ? 0.65 : Math.max(0.45, top[1] - h / 2 - 0.05);
    if (onTop) {
      // signs stand on a short post bolted to the top of the barrier
      y = top[1] + 0.12 + h / 2;
      front = 0.018;
      const postMat = mats.galv();
      for (const x of [-0.3, 0.3]) mesh(roundedBox(0.04, h / 2 + 0.2, 0.04, 0.01), postMat, { parent: root, at: [x, top[1] - 0.04 + (h / 2 + 0.2) / 2, 0] });
    }
    plate.position.set(variant === 'boom' ? 0 : -0.3, y, front + 0.006);
    if (variant === 'boom') plate.position.z = 0.18;
    root.add(plate);
    const tex = textTexture([['ROAD', 'bold 90px Helvetica, Arial'], ['CLOSED', 'bold 90px Helvetica, Arial']], { w: 512, h: 380, bg: '#ffffff', fg: '#111', border: '#c62828', borderWidth: 16, radius: 20 });
    const x2 = variant === 'boom' ? 0 : 0.3;
    if (variant !== 'boom') {
      mesh(roundedBox(0.45, 0.33, 0.006, 0.02), M.metal('#c9cdd0', 0.4), { parent: root, at: [x2, y, front + 0.004] });
      if (tex) mesh(new THREE.PlaneGeometry(0.44, 0.32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }), { parent: root, at: [x2, y, front + 0.008] });
    }
  }
  return finish(root, { type: 'barrier', variant, o, animations, oneShot, exclusive: oneShot.length ? [oneShot] : undefined });
}

function label(parent, text, w, h, at, color) {
  const tex = textTexture(text, { w: 512, h: Math.round((512 * h) / w), bg: '#ffffff', fg: color, font: `bold ${Math.round((512 * h) / w * 0.6)}px Helvetica, Arial`, radius: 0 });
  if (!tex) return;
  mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), { parent, at });
}

/* ------------------------------- Bus stop ------------------------------- */

export const BUS_STOP_VARIANTS = {
  shelter: { color: '#3a3f44' },
  pole: { color: '#1565c0' },
  modern: { color: '#e8e8e4' },
  wooden: { color: '#6e4b2e' },
};

function busStopSign(parent, at, color) {
  const g = group(null, { parent, at });
  mesh(pole(2.9, { r: 0.04, base: 0.12 }), mats.galv(), { parent: g });
  const tex = textTexture([['BUS', 'bold 150px Helvetica, Arial'], ['STOP', 'bold 110px Helvetica, Arial']], { w: 512, h: 512, bg: color, fg: '#ffffff', border: '#ffffff', borderWidth: 10, radius: 256 });
  const disc = new THREE.CylinderGeometry(0.26, 0.26, 0.02, 40).rotateX(Math.PI / 2);
  const mat = tex ? [new THREE.MeshStandardMaterial({ color }), new THREE.MeshStandardMaterial({ map: tex }), new THREE.MeshStandardMaterial({ map: tex })] : new THREE.MeshStandardMaterial({ color });
  mesh(disc, mat, { parent: g, at: [0, 2.85, 0.05] });
  // timetable case with printed times
  mesh(roundedBox(0.36, 0.5, 0.04, 0.02), mats.galv(), { parent: g, at: [0, 2.15, 0.045] });
  const tt = textTexture([['ROUTE 12', 'bold 44px Helvetica, Arial'], ['06:10  06:40', '32px "Courier New", monospace'], ['07:10  07:40', '32px "Courier New", monospace'], ['every 20 min', '30px Helvetica, Arial']], { w: 256, h: 360, bg: '#f4f4f2', fg: '#111', radius: 0 });
  if (tt) mesh(new THREE.PlaneGeometry(0.32, 0.45), new THREE.MeshStandardMaterial({ map: tt }), { parent: g, at: [0, 2.15, 0.066] });
  return g;
}

export function createBusStop(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(BUS_STOP_VARIANTS, o.variant, 'bus-stop');
  const v = BUS_STOP_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`bus-stop-${variant}`);
  const animations = [];
  const glass = new THREE.MeshPhysicalMaterial({ color: '#dfe9ee', roughness: 0.05, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false, name: 'glass' });
  let roofY = 2.5;
  let backZ = -0.7;
  if (variant === 'pole') {
    busStopSign(root, [0, 0, 0], o.color ?? v.color);
    const b = createBench({ variant: 'modern', length: 1.5 });
    b.position.set(1.0, 0, -0.1);
    root.add(b);
  } else if (variant === 'wooden') {
    // rural timber shelter: three walls, pitched shingle roof, bench inside
    const wood = M.wood(o.color ?? v.color);
    const L = 3.0;
    const D = 1.5;
    const H = 2.2;
    for (const [x, z] of [[-L / 2, -D / 2], [L / 2, -D / 2], [-L / 2, D / 2], [L / 2, D / 2]]) mesh(roundedBox(0.12, H, 0.12, 0.015), wood, { parent: root, at: [x, H / 2, z] });
    for (let i = 0; i < 14; i++) mesh(roundedBox(L, 0.14, 0.03, 0.006), wood, { parent: root, at: [0, 0.1 + i * 0.15, -D / 2 - 0.05] });
    for (const s of [1, -1]) for (let i = 0; i < 8; i++) mesh(roundedBox(0.03, 0.14, D, 0.006), wood, { parent: root, at: [s * (L / 2 + 0.05), 1.0 + i * 0.15, 0] });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#4a3f38', roughness: 0.9, name: 'shingles' });
    for (const s of [1, -1]) {
      const r = mesh(roundedBox(L + 0.5, 0.06, D * 0.62, 0.02), roofMat, { parent: root, at: [0, H + 0.3, s * D * 0.27] });
      r.rotation.x = s * 0.62;
    }
    mesh(roundedBox(L + 0.3, 0.12, 0.12, 0.02), wood, { parent: root, at: [0, H + 0.5, 0] });
    for (const s of [1, -1]) mesh(roundedBox(L + 0.2, 0.12, 0.12, 0.02), wood, { parent: root, at: [0, H, s * D / 2] });
    for (let i = 0; i < 3; i++) mesh(roundedBox(L - 0.2, 0.04, 0.12, 0.012), wood, { parent: root, at: [0, 0.45, -D / 2 + 0.1 + i * 0.13] });
    for (const x of [-L / 2 + 0.3, L / 2 - 0.3]) mesh(roundedBox(0.08, 0.43, 0.3, 0.012), wood, { parent: root, at: [x, 0.215, -D / 2 + 0.2] });
    busStopSign(root, [L / 2 + 0.6, 0, D / 2], '#2e7d32');
    roofY = H;
    backZ = -D / 2;
  } else {
    const modern = variant === 'modern';
    const frame = mats.powder(o.color ?? v.color);
    const L = 3.6;
    const D = 1.4;
    const H = 2.5;
    for (const x of [-L / 2, L / 2]) mesh(pole(H, { r: 0.045, top: 0.045, base: 0.1, baseH: 0.04, collar: false }), frame, { parent: root, at: [x, 0, -D / 2] });
    if (!modern) for (const x of [-L / 2, L / 2]) mesh(pole(H - 0.05, { r: 0.04, top: 0.04, base: 0.09, baseH: 0.04, collar: false }), frame, { parent: root, at: [x, 0, D / 2 - 0.1] });
    const roof = group('roof', { parent: root, at: [0, H, 0] });
    if (modern) {
      // cantilevered curved glass roof
      for (const x of [-L / 2, L / 2]) curveTube([[x, H - 0.05, -D / 2], [x, H + 0.1, -D / 2 + 0.25], [x, H + 0.15, 0.2], [x, H + 0.1, D / 2 + 0.1]], 0.05, frame, { parent: root, radialSegments: 12 });
      mesh(curvedRoof(L + 0.2, D + 0.3, 0.12), new THREE.MeshPhysicalMaterial({ color: '#cfe3ee', transparent: true, opacity: 0.4, roughness: 0.1, side: THREE.DoubleSide, name: 'glass-roof' }), { parent: root, at: [0, H + 0.1, 0] });
      mesh(roundedBox(L + 0.2, 0.08, 0.06, 0.02), frame, { parent: root, at: [0, H + 0.15, -D / 2 + 0.2] });
    } else {
      // roof: two beams on the posts carrying a panel whose edges rest on them
      const zb = -D / 2;
      const zf = D / 2 - 0.1;
      for (const z of [zb, zf]) mesh(roundedBox(L + 0.3, 0.1, 0.1, 0.02), frame, { parent: roof, at: [0, 0.05, z] });
      mesh(roundedBox(L + 0.3, 0.06, zf - zb, 0.02), frame, { parent: roof, at: [0, 0.13, (zb + zf) / 2] });
      mesh(roundedBox(L + 0.2, 0.02, zf - zb - 0.1, 0.008), new THREE.MeshPhysicalMaterial({ color: '#cfe3ee', transparent: true, opacity: 0.4, roughness: 0.1 }), { parent: roof, at: [0, 0.17, (zb + zf) / 2] });
    }
    for (let i = 0; i < 3; i++) {
      const x = -L / 2 + L / 6 + (i * L) / 3;
      mesh(new THREE.BoxGeometry(L / 3 - 0.06, H - 0.35, 0.012), glass, { parent: root, at: [x, (H - 0.35) / 2 + 0.2, -D / 2] });
      if (i > 0) mesh(roundedBox(0.04, H - 0.2, 0.05, 0.012), frame, { parent: root, at: [-L / 2 + (i * L) / 3, (H - 0.2) / 2 + 0.1, -D / 2] });
    }
    mesh(roundedBox(L, 0.05, 0.05, 0.015), frame, { parent: root, at: [0, 0.18, -D / 2] });
    mesh(roundedBox(L, 0.05, 0.05, 0.015), frame, { parent: root, at: [0, H - 0.12, -D / 2] });
    // illuminated advert panel at the end
    const ad = group('ad', { parent: root, at: [L / 2, 0, 0] });
    mesh(roundedBox(0.16, H - 0.25, D - 0.2, 0.03), frame, { parent: ad, at: [0, (H - 0.25) / 2 + 0.05, -0.05] });
    const adLamp = lampGroup('advert', 'white');
    const tex = textTexture([['CITY', 'bold 120px Helvetica, Arial'], ['MUSEUM', 'bold 90px Helvetica, Arial'], ['OPEN DAILY', '60px Helvetica, Arial']], { w: 512, h: 900, bg: '#e9612a', fg: '#ffffff', radius: 0 });
    if (tex) { adLamp.lens.map = tex; adLamp.lens.emissiveMap = tex; adLamp.lens.color.set('#ffffff'); adLamp.lens.emissiveIntensity = 0.5; }
    for (const s of [1, -1]) {
      const g = new THREE.PlaneGeometry(D - 0.4, H - 0.6).rotateY(s * Math.PI / 2);
      g.translate(s * 0.082, (H - 0.25) / 2 + 0.05, -0.05);
      adLamp.add(ad, { geometry: g, normal: [s, 0, 0], depth: 0.005, glowSize: 1.6 });
    }
    for (const s of [1, -1]) emblem(ad, 0.12, [s * 0.08, 0.2, -0.05], { rotY: s * Math.PI / 2, name: s > 0 ? 'emblem' : 'emblem_b' });
    const bench = createBench({ variant: 'modern', length: 2.0 });
    bench.position.set(-0.3, 0, -D / 2 + 0.3);
    root.add(bench);
    // route map panel fixed to the glass
    const map = textTexture([['ROUTES', 'bold 60px Helvetica, Arial'], ['12 · 14 · 27', 'bold 48px Helvetica, Arial'], ['N4 night bus', '40px Helvetica, Arial']], { w: 256, h: 360, bg: '#f4f4f2', fg: '#1565c0', radius: 0 });
    mesh(roundedBox(0.5, 0.7, 0.02, 0.02), frame, { parent: root, at: [-L / 2 + 0.45, 1.4, -D / 2 + 0.016] });
    if (map) mesh(new THREE.PlaneGeometry(0.46, 0.66), new THREE.MeshStandardMaterial({ map }), { parent: root, at: [-L / 2 + 0.45, 1.4, -D / 2 + 0.027] });
    busStopSign(root, [-L / 2 - 0.6, 0, D / 2 - 0.1], '#1565c0');
    animations.push(clip('lights', 1, lampTracks('advert', 1.2, { glow: 0.2 })));
    backZ = -D / 2;
    roofY = H;
  }
  if (style === 'digital') {
    // real-time arrivals display hung under the roof
    const wall = variant === 'wooden';
    const disp = group('arrivals', { parent: root, at: [variant === 'pole' ? 0.35 : -0.6, variant === 'pole' ? 2.45 : wall ? 1.9 : variant === 'shelter' ? roofY - 0.27 : roofY - 0.25 + 0.17, variant === 'pole' ? 0.05 : wall ? backZ - 0.035 + 0.04 : variant === 'shelter' ? backZ + 0.045 : backZ + 0.35] });
    if (wall) void 0;
    else if (variant !== 'pole') mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), mats.galv(), { parent: disp, at: [-0.3, 0.17, 0] }), mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), mats.galv(), { parent: disp, at: [0.3, 0.17, 0] });
    else mesh(roundedBox(0.36, 0.04, 0.04, 0.01), mats.galv(), { parent: disp, at: [-0.2, 0, -0.03] });
    mesh(roundedBox(0.8, 0.22, 0.08, 0.02), M.plastic('#1a1a1a', 0.4), { parent: disp });
    const led = lampGroup('arrivals_led', 'amber');
    const tex = textTexture([['12  City Ctr   2 min', 'bold 34px "Courier New", monospace'], ['27  Station    9 min', 'bold 34px "Courier New", monospace']], { w: 512, h: 128, bg: '#000', fg: '#ffa000', radius: 0 });
    if (tex) { led.lens.map = tex; led.lens.emissiveMap = tex; led.lens.color.set('#ffffff'); }
    led.add(disp, { geometry: new THREE.PlaneGeometry(0.72, 0.17).translate(0, 0, 0.042), normal: [0, 0, 1], depth: 0.005, glowSize: 1.0 });
    animations.push(clip('arrivals', 2, lampTracks('arrivals_led', 2.4, { blink: 0.5, glow: 0.6, off: 1.2 })));
  }
  return finish(root, { type: 'bus-stop', variant, o, animations, lean: false });
}

/* ------------------------------ Guard rail ------------------------------ */

export const GUARD_RAIL_VARIANTS = {
  'w-beam': { color: '#b9bdc1' },
  cable: { color: '#b9bdc1' },
  timber: { color: '#7a5634' },
};

export function createGuardRail(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(GUARD_RAIL_VARIANTS, o.variant, 'guard-rail');
  const v = GUARD_RAIL_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`guard-rail-${variant}`);
  const L = o.length ?? 4;
  const galv = mats.galv();
  if (o.color && variant !== 'timber') galv.color.set(o.color);
  const posts = Math.round(L / 2) + 1;
  for (let i = 0; i < posts; i++) {
    const x = -L / 2 + (i * L) / (posts - 1);
    if (variant === 'timber') mesh(roundedBox(0.16, 0.75, 0.16, 0.02), M.wood(o.color ?? v.color), { parent: root, at: [x, 0.375, 0] });
    else {
      // C-section steel post with blockout
      mesh(roundedBox(0.1, 0.75, 0.06, 0.01), galv, { parent: root, at: [x, 0.375, 0] });
      if (variant === 'w-beam') mesh(roundedBox(0.08, 0.2, 0.14, 0.01), galv, { parent: root, at: [x, 0.55, 0.09] });
    }
  }
  if (variant === 'w-beam') {
    // corrugated W profile extruded along the run
    const s = new THREE.Shape();
    const w = [[0, -0.155], [0.02, -0.155], [0.07, -0.08], [0.03, 0], [0.07, 0.08], [0.02, 0.155], [0, 0.155], [0.05, 0.08], [0.01, 0], [0.05, -0.08]];
    s.moveTo(w[0][0], w[0][1]);
    for (const p of w.slice(1)) s.lineTo(p[0], p[1]);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: L + 0.3, bevelEnabled: false });
    g.translate(0, 0, -(L + 0.3) / 2);
    g.rotateY(Math.PI / 2);
    g.computeVertexNormals();
    mesh(g, galv, { parent: root, at: [0, 0.55, 0.16] });
    // bolts + end terminal
    for (let i = 0; i < posts; i++) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6).rotateX(Math.PI / 2), M.metal('#777', 0.4), { parent: root, at: [-L / 2 + (i * L) / (posts - 1), 0.55, 0.168] });
    const end = new THREE.CylinderGeometry(0.155, 0.155, 0.3, 20, 1, true, 0, Math.PI);
    mesh(end, galv, { parent: root, at: [L / 2 + 0.15, 0.55, 0.0] }).material.side = THREE.DoubleSide;
  } else if (variant === 'cable') {
    for (const y of [0.5, 0.62, 0.74]) curveTube([[-L / 2 - 0.2, y, 0.04], [L / 2 + 0.2, y, 0.04]], 0.01, M.metal('#8e9296', 0.4), { parent: root, segments: 2, radialSegments: 6 });
    for (const x of [-L / 2 - 0.3, L / 2 + 0.3]) mesh(roundedBox(0.3, 0.2, 0.3, 0.03), mats.concrete(), { parent: root, at: [x, 0.1, 0] });
    for (const s of [1, -1]) curveTube([[s * (L / 2 + 0.25), 0.2, 0.04], [s * (L / 2 + 0.05), 0.62, 0.04]], 0.012, M.metal('#8e9296', 0.4), { parent: root, segments: 2, radialSegments: 6 });
  } else {
    mesh(roundedBox(L + 0.3, 0.2, 0.14, 0.03), M.wood(o.color ?? v.color), { parent: root, at: [0, 0.6, 0.15] });
    for (let i = 0; i < posts; i++) mesh(roundedBox(0.1, 0.16, 0.12, 0.01), M.wood(o.color ?? v.color), { parent: root, at: [-L / 2 + (i * L) / (posts - 1), 0.6, 0.06] });
  }
  if (style === 'reflectors') {
    for (let i = 0; i < posts; i++) {
      const x = -L / 2 + (i * L) / (posts - 1);
      const lamp = mesh(roundedBox(0.08, 0.05, 0.01, 0.01), new THREE.MeshStandardMaterial({ color: i % 2 ? '#f5c400' : '#ffffff', emissive: i % 2 ? '#f5c400' : '#ffffff', emissiveIntensity: 0.25, roughness: 0.2 }), { parent: root, at: [x, 0.8, 0.035] });
      void lamp;
      mesh(roundedBox(0.04, 0.1, 0.04, 0.01), galv, { parent: root, at: [x, 0.78, 0] });
    }
  }
  return finish(root, { type: 'guard-rail', variant, o, animations: [], lean: false });
}
