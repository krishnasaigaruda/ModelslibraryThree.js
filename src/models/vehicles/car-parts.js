// Shared helpers for cars & vans: surface-following grids (lamps, decals, liveries),
// canvas textures (plates, text), wings, racks and wheel dressings.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, extrudeOutline } from '../../core/utils.js';
import { lampGroup } from '../../core/lamps.js';

/** Continuous half-ring position for a named segment (t may exceed 0..1 to spill into the next). */
export const ringPos = (loft, seg, t) => loft.idx(seg, 0) + t * (loft.idx(seg, 1) - loft.idx(seg, 0));

/** Point + outward normal at station x, continuous half-ring index hi, side ±1. */
export const surfAt = (loft, x, hi, side = 1) => loft.pointAt(x, 'bottom', hi / (loft.idx('bottom', 1) - loft.idx('bottom', 0)), side);

/**
 * Smooth grid that hugs the loft surface, with UVs (u along x front→back as seen from that side, v up).
 * x: [xa, xb], h: [ha, hb] (half-ring indices, use ringPos), side ±1.
 */
/** Fast column sampler: one half-ring per station (+ rake), interpolated along the ring. */
function columnSampler(loft, x) {
  const ring = loft.halfRing(x);
  const H = loft.H;
  // recover the rake shear at this station from one pointAt call at the roof centre
  const top = loft.pointAt(x, 'bottom', H / (loft.idx('bottom', 1) - loft.idx('bottom', 0)), 1).point;
  const dy = top.y - ring.yb;
  const rk = dy > 1e-4 ? (x - top.x) / dy : 0;
  return (hi, side) => {
    const k = Math.min(Math.max(hi, 0), H);
    const i0 = Math.floor(k);
    const i1 = Math.min(H, i0 + 1);
    const f = k - i0;
    const z = ring[i0][0] * (1 - f) + ring[i1][0] * f;
    const y = ring[i0][1] * (1 - f) + ring[i1][1] * f;
    return [x - rk * Math.max(0, y - ring.yb), y, side * z];
  };
}

/**
 * Smooth grid that hugs the loft surface, with UVs (u along x front→back as seen from that side, v up).
 * x: [xa, xb], h: [ha, hb] (half-ring indices, use ringPos), side ±1.
 */
export function surfaceGrid(loft, { x: [xa, xb], h: [ha, hb], side = 1, offset = 0.004, nx = 14, ny = 6 }) {
  const pos = [];
  const nrm = [];
  const uv = [];
  const idx = [];
  const ref = surfAt(loft, (xa + xb) / 2, (ha + hb) / 2, side).normal;
  const d = 0.006;
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (let i = 0; i <= nx; i++) {
    const x = xa + ((xb - xa) * i) / nx;
    const c0 = columnSampler(loft, x);
    const cm = columnSampler(loft, x - d);
    const cp = columnSampler(loft, x + d);
    for (let j = 0; j <= ny; j++) {
      const hh = ha + ((hb - ha) * j) / ny;
      const p = c0(hh, side);
      A.fromArray(cp(hh, side)).sub(N.fromArray(cm(hh, side)));
      B.fromArray(c0(hh + 0.2, side)).sub(N.fromArray(c0(hh - 0.2, side)));
      N.crossVectors(A, B).normalize();
      if (N.dot(ref) < 0) N.negate();
      if (!Number.isFinite(N.x)) N.copy(ref);
      pos.push(p[0] + N.x * offset, p[1] + N.y * offset, p[2] + N.z * offset);
      nrm.push(N.x, N.y, N.z);
      uv.push(side > 0 ? i / nx : 1 - i / nx, j / ny);
    }
  }
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const a = i * (ny + 1) + j;
      const b = a + 1;
      const c = a + ny + 1;
      const dd = c + 1;
      idx.push(a, c, b, b, c, dd);
    }
  }
  // make the triangles face outward (along the surface normal) whatever the side/direction
  {
    const v = (k) => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
    const mid = Math.floor(nx / 2) * (ny + 1) + Math.floor(ny / 2);
    const [a, c, b] = [mid, mid + ny + 1, mid + 1];
    const fn = v(c).sub(v(a)).cross(v(b).sub(v(a)));
    if (fn.dot(new THREE.Vector3(nrm[a * 3], nrm[a * 3 + 1], nrm[a * 3 + 2])) < 0) {
      for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]];
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.userData.spec = { x: [xa, xb], h: [ha, hb], side, offset, nx, ny };
  return g;
}

/** Add a surface lamp (lens follows the body) to a lamp group, with a glow card facing out. */
export function surfaceLamp(grp, parent, loft, spec) {
  const geo = surfaceGrid(loft, { nx: 10, ny: 4, ...spec });
  const c = surfAt(loft, (spec.x[0] + spec.x[1]) / 2, (spec.h[0] + spec.h[1]) / 2, spec.side ?? 1);
  return grp.add(parent, { geometry: geo, normal: c.normal.toArray(), depth: spec.offset ?? 0.004, w: Math.abs(spec.x[1] - spec.x[0]), h: 0.08, glowSize: spec.glow ?? 0.32 });
}

const hasDOM = typeof document !== 'undefined';
const texCache = new Map();
/** Canvas texture, cached by key. draw(ctx, w, h). Returns null in Node. */
export function canvasTexture(key, w, h, draw) {
  if (!hasDOM) return null;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

/** Made-up plate number from a seed string. */
export function plateText(seed) {
  let hsh = 7;
  for (const ch of String(seed)) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
  const L = 'ABCDEFGHJKLMNPRSTVWXYZ';
  return `${L[hsh % 22]}${L[(hsh >>> 5) % 22]}${L[(hsh >>> 10) % 22]} ${String(1000 + (hsh % 9000))}`;
}

/** License plate: rounded backing + printed face with text + border. Faces +X (rotate as needed). */
export function plate(text, { w = 0.52, h = 0.112 } = {}) {
  const g = group('plate');
  mesh(roundedBox(0.012, h + 0.012, w + 0.012, 0.005), M.plastic('#151515', 0.6), { parent: g });
  const tex = canvasTexture(`plate:${text}`, 512, 112, (c, W, H) => {
    c.fillStyle = '#f3f3ee';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = '#222';
    c.lineWidth = 6;
    c.strokeRect(5, 5, W - 10, H - 10);
    c.fillStyle = '#2346a8';
    c.fillRect(8, 8, 46, H - 16);
    c.fillStyle = '#ffd400';
    c.font = 'bold 18px sans-serif';
    c.textAlign = 'center';
    c.fillText('OBX', 31, H - 22);
    c.fillStyle = '#161616';
    c.font = 'bold 74px "Arial Narrow", Arial, sans-serif';
    c.textBaseline = 'middle';
    c.fillText(text, W / 2 + 22, H / 2 + 3);
  });
  const face = new THREE.PlaneGeometry(w, h);
  face.rotateY(Math.PI / 2);
  mesh(face, new THREE.MeshStandardMaterial({ map: tex, color: tex ? '#ffffff' : '#f2f2ee', roughness: 0.45, metalness: 0.1 }), { parent: g, at: [0.0065, 0, 0] });
  return g;
}

/** Text decal material (transparent canvas). */
export function textMaterial(key, text, { color = '#111', font = 'bold 120px Arial, sans-serif', w = 1024, h = 192, bg = null, align = 'center' } = {}) {
  const tex = canvasTexture(`txt:${key}:${text}:${color}:${bg}`, w, h, (c, W, H) => {
    if (bg) {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
    }
    c.fillStyle = color;
    c.font = font;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillText(text, align === 'center' ? W / 2 : 20, H / 2 + 4);
  });
  return new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false, visible: !!tex, name: 'decal' });
}

/** Material from a custom canvas drawing (checkers, stripes, roundels…). */
export function drawMaterial(key, w, h, draw, extra = {}) {
  const tex = canvasTexture(`draw:${key}`, w, h, draw);
  return new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false, visible: !!tex, name: 'decal', ...extra });
}

/** Tube following the body section at station x, from ring position ha (side +) over the top to ha (side −). */
export function crossRail(loft, x, ha, hb, lift, radius, mat, parent, { scaleY = 1 } = {}) {
  const pts = [];
  const H = loft.H;
  const steps = 12;
  for (let s of [1, -1]) {
    for (let i = 0; i <= steps; i++) {
      const k = s > 0 ? i : steps - i;
      const hh = ha + ((Math.min(hb, H) - ha) * k) / steps;
      const p = surfAt(loft, x, hh, s);
      pts.push([p.point.x + p.normal.x * lift, p.point.y + p.normal.y * lift, p.point.z + p.normal.z * lift]);
    }
  }
  // order: side + from ha→top, then side − from top→ha
  const ordered = [...pts.slice(0, steps + 1), ...pts.slice(steps + 2)];
  const m = curveTube(ordered, radius, mat, { parent, segments: 40, radialSegments: 10 });
  if (scaleY !== 1) {
    // flatten about the tube's own centre so it stays on the surface
    const g = m.geometry;
    g.computeBoundingBox();
    const c = g.boundingBox.getCenter(new THREE.Vector3());
    g.translate(-c.x, -c.y, -c.z).scale(1, scaleY, 1).translate(c.x, c.y - radius * (1 - scaleY), c.z);
  }
  return m;
}

/** Aerofoil rear wing with endplates; mount feet sit on the given deck points [{point}] (two). */
export function rearWing(parent, { x, y, span, chord = 0.26, feet, mat, plateMat }) {
  const g = group('wing', { parent });
  const af = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const th = 0.12 * chord * (2.97 * Math.sqrt(t) - 1.26 * t - 3.52 * t * t + 2.84 * t ** 3 - 1.04 * t ** 4);
    af.push([chord / 2 - t * chord, th + 0.02 * t]);
  }
  for (let i = 15; i > 0; i--) {
    const t = i / 16;
    af.push([chord / 2 - t * chord, -0.25 * 0.12 * chord * Math.sqrt(t) * (1 - t) + 0.02 * t]);
  }
  const wingGeo = extrudeOutline(af, span, { bevel: 0.006, segments: 2 });
  mesh(wingGeo, mat, { parent: g, at: [x, y, 0], rot: [0, 0, 0.1] });
  for (const s of [1, -1]) {
    const ep = extrudeOutline([[0.17, -0.07], [0.15, 0.07], [-0.17, 0.09], [-0.19, -0.03]], 0.014, { bevel: 0.004 });
    mesh(ep, plateMat ?? mat, { parent: g, at: [x, y + 0.01, s * (span / 2 + 0.007)] });
  }
  for (const f of feet) {
    const p = f.point;
    const top = [x + 0.02, y - 0.005, p.z];
    curveTube([[p.x + 0.04, p.y - 0.01, p.z], [p.x + 0.02, (p.y + y) / 2, p.z], top], 0.016, mat, { parent: g });
    mesh(roundedBox(0.09, 0.02, 0.05, 0.008), mat, { parent: g, at: [p.x + 0.04, p.y, p.z] });
  }
  return g;
}

/** Ring decorations on a wheel's spin group: whitewall / aero cover / chrome hubcap / beadlock. */
export function dressWheel(spin, side, { radius, width, kind }) {
  const s = side;
  const face = s * width * 0.5;
  if (kind === 'whitewall') {
    const g = new THREE.RingGeometry(radius * 0.72, radius * 0.86, 48);
    if (s < 0) g.rotateY(Math.PI);
    mesh(g, M.matte('#f1efe8', 0.6), { parent: spin, at: [0, 0, face + s * 0.004] });
  } else if (kind === 'aero') {
    const g = new THREE.CylinderGeometry(radius * 0.64, radius * 0.66, 0.02, 40);
    g.rotateX(Math.PI / 2);
    const cover = mesh(g, M.paint('#d9dcdf', { metallic: 0.5 }), { parent: spin, at: [0, 0, s * width * 0.4] });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const slot = new THREE.CircleGeometry(radius * 0.08, 12);
      if (s < 0) slot.rotateY(Math.PI);
      mesh(slot, M.matte('#1a1a1a', 0.8), { parent: cover, at: [Math.cos(a) * radius * 0.42, Math.sin(a) * radius * 0.42, s * 0.0115] });
    }
  } else if (kind === 'hubcap') {
    const R = radius * 0.4;
    const g = new THREE.SphereGeometry(R, 32, 8, 0, Math.PI * 2, 0, 0.6);
    g.rotateX(s * Math.PI / 2);
    // dome base sits on the rim face (rim face is at width*0.32)
    mesh(g, M.chrome(), { parent: spin, at: [0, 0, s * (width * 0.33 - R * Math.cos(0.6))] });
  } else if (kind === 'beadlock') {
    const g = new THREE.TorusGeometry(radius * 0.66, radius * 0.035, 6, 40);
    mesh(g, M.metal('#202022', 0.4), { parent: spin, at: [0, 0, s * width * 0.42] });
  }
}

/** Knobbly all-terrain tread blocks around a tyre. */
export function atTread(spin, { radius, width }) {
  const n = 28;
  const geo = new THREE.BoxGeometry(0.05, 0.022, width * 0.42);
  const im = new THREE.InstancedMesh(geo, M.rubber(), n * 2);
  im.name = `${spin.name}_tread`;
  const o = new THREE.Object3D();
  let k = 0;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    for (const zz of [-1, 1]) {
      o.position.set(Math.cos(a) * radius, Math.sin(a) * radius, zz * width * 0.24 + (i % 2 ? 0.02 : -0.02));
      o.rotation.set(0, 0, a + Math.PI / 2);
      o.updateMatrix();
      im.setMatrixAt(k++, o.matrix);
    }
  }
  spin.add(im);
}

/** Roof cross bars (+ optional roof box) across a loft roof at stations xs. */
export function roofBars(loft, parent, xs, { box = false, basket = false, mat, boxMat } = {}) {
  const ha = ringPos(loft, 'roofCorner', 0.3);
  let barTop = -Infinity;
  for (const x of xs) {
    const bar = crossRail(loft, x, ha, loft.H, 0.065, 0.016, mat, parent, { scaleY: 0.7 });
    bar.name = 'roof_bar';
    bar.geometry.computeBoundingBox();
    barTop = Math.max(barTop, bar.geometry.boundingBox.max.y);
    for (const s of [1, -1]) {
      const p = surfAt(loft, x, ha, s);
      const foot = mesh(roundedBox(0.09, 0.07, 0.05, 0.015), mat, { parent });
      foot.position.copy(p.point).addScaledVector(p.normal, 0.03);
    }
  }
  const top = barTop; // everything on the rack sits directly on the bars
  if (box) mesh(cushion(Math.abs(xs[0] - xs[xs.length - 1]) + 0.5, 0.3, 0.8, { radius: 0.12, bulge: 0.15 }), boxMat ?? M.plastic('#202124', 0.35), { parent, at: [(xs[0] + xs[xs.length - 1]) / 2, top + 0.145, 0], name: 'roof_box' });
  if (basket) {
    const len = Math.abs(xs[0] - xs[xs.length - 1]) + 0.3;
    const cx = (xs[0] + xs[xs.length - 1]) / 2;
    const r = 0.014;
    const pts = [[cx - len / 2, top + r, -0.55], [cx + len / 2, top + r, -0.55], [cx + len / 2, top + r, 0.55], [cx - len / 2, top + r, 0.55]];
    curveTube([...pts, pts[0]].map((p) => p), r, mat, { parent, segments: 64 });
    const up = pts.map(([a, b, c]) => [a, b + 0.1, c]);
    curveTube([...up, up[0]], r, mat, { parent, segments: 64 });
    for (const p of pts) mesh(new THREE.CylinderGeometry(r, r, 0.1, 8), mat, { parent, at: [p[0], p[1] + 0.05, p[2]] });
    for (let k = 1; k < 5; k++) mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 1.1, 8), mat, { parent, at: [cx - len / 2 + (k * len) / 5, top + r, 0], rot: [Math.PI / 2, 0, 0], name: 'basket_slat' });
  }
  return top;
}

/** Row of round auxiliary lamps (light bar / rally pods). Returns lamp group. */
export function auxLamps(parent, name, at, count, spacing, { radius = 0.05, normal = [1, 0, 0], housing } = {}) {
  const grp = lampGroup(name, 'white');
  const hm = housing ?? M.plastic('#141414', 0.4);
  for (let i = 0; i < count; i++) {
    const z = (i - (count - 1) / 2) * spacing;
    const pod = group(null, { parent, at: [at[0], at[1], at[2] + z] });
    const can = new THREE.CylinderGeometry(radius * 1.15, radius * 1.05, 0.06, 20);
    can.rotateZ(Math.PI / 2);
    mesh(can, hm, { parent: pod, at: [-0.03 * normal[0], 0, 0] });
    grp.add(pod, { at: [0.002, 0, 0], normal, w: radius * 1.9, h: radius * 1.9, shape: 'round', depth: 0.012, bezel: false });
  }
  return grp;
}
