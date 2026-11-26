import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { lathe, mesh } from '../../core/utils.js';
import { brandEmblem } from '../../core/brand.js';

/* Shared street-furniture pieces: materials, poles that meet their base
 * cleanly (one lathe profile), canvas text, bolts. */

export const hasDOM = typeof document !== 'undefined';

export const mats = {
  galv: () => M.metal('#a3a8ad', 0.42),
  steel: () => M.metal('#c5c9cc', 0.25),
  powder: (c = '#2b3034') => new THREE.MeshPhysicalMaterial({ name: 'powder-coat', color: M.toColor(c), metalness: 0.35, roughness: 0.45, clearcoat: 0.3 }),
  castIron: (c = '#1f2622') => new THREE.MeshStandardMaterial({ name: 'cast-iron', color: M.toColor(c), metalness: 0.6, roughness: 0.55 }),
  concrete: (c = '#b9b5ae') => new THREE.MeshStandardMaterial({ name: 'concrete', color: M.toColor(c), roughness: 0.92 }),
  rubber: () => M.rubber(),
};

/**
 * Pole with integrated base flange and optional collar: a single lathe, so
 * the pole meets the base without any seam or intersection.
 */
export function pole(height, { r = 0.06, top = null, base = 0.16, baseH = 0.08, collar = true, segments = 32 } = {}) {
  const rt = top ?? r * 0.75;
  const prof = [
    [0.001, 0],
    [base, 0],
    [base, baseH * 0.35],
    [base * 0.85, baseH * 0.7],
    [r * 1.5, baseH],
  ];
  if (collar) prof.push([r * 1.5, baseH + 0.18], [r * 1.12, baseH + 0.24]);
  // densify the long shaft so the surface is evenly tessellated (good shading, reliable contact tests)
  const y0 = baseH + 0.3;
  const y1 = height - 0.02;
  const n = Math.max(1, Math.ceil((y1 - y0) / 0.25));
  for (let i = 0; i <= n; i++) prof.push([r + (rt - r) * (i / n), y0 + ((y1 - y0) * i) / n]);
  prof.push([rt * 0.9, height], [0.001, height]);
  return lathe(prof, segments);
}

/** Text on a canvas texture (null outside the browser). */
/** Insert extra points so no segment of a lathe profile is longer than `step`. */
export function densify(profile, step = 0.25) {
  const out = [profile[0]];
  for (let i = 1; i < profile.length; i++) {
    const [x0, y0] = profile[i - 1];
    const [x1, y1] = profile[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 1; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  return out;
}

export function textTexture(lines, { w = 512, h = 256, bg = '#ffffff', fg = '#111111', font = 'bold 120px Helvetica, Arial, sans-serif', border = null, borderWidth = 14, radius = 24 } = {}) {
  if (!hasDOM) return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect ? g.roundRect(0, 0, w, h, radius) : g.rect(0, 0, w, h);
  g.fill();
  if (border) {
    g.strokeStyle = border;
    g.lineWidth = borderWidth;
    g.beginPath();
    const i = borderWidth * 1.2;
    g.roundRect ? g.roundRect(i, i, w - 2 * i, h - 2 * i, radius * 0.7) : g.rect(i, i, w - 2 * i, h - 2 * i);
    g.stroke();
  }
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const list = Array.isArray(lines) ? lines : [lines];
  list.forEach((ln, k) => {
    const [text, f] = Array.isArray(ln) ? ln : [ln, font];
    g.font = f;
    g.fillText(text, w / 2, (h * (k + 0.5)) / list.length + 4);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Hex bolt head facing +Z. */
export function bolt(parent, x, y, z, { r = 0.012, mat, rotY = 0 } = {}) {
  const g = new THREE.CylinderGeometry(r, r, r * 0.8, 6);
  g.rotateX(Math.PI / 2);
  const m = mesh(g, mat ?? M.metal('#888', 0.4), { parent, at: [x, y, z] });
  m.rotation.y = rotY;
  return m;
}

/**
 * Studio emblem sitting flush on a surface. `at` is the surface point,
 * `rotY` turns the emblem's +Z to the surface normal (0 = facing +Z).
 */
export function emblem(parent, size, at, { rotY = 0, rotX = 0, name } = {}) {
  const e = brandEmblem(size, { name: name ?? 'emblem' });
  const depth = (size / 2 / 1.36) * 0.162;
  const n = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(rotX, rotY, 0));
  e.position.set(at[0] + n.x * depth, at[1] + n.y * depth, at[2] + n.z * depth);
  e.rotation.set(rotX, rotY, 0);
  parent.add(e);
  return e;
}

const _up = new THREE.Vector3(0, 1, 0);
/** Straight rod between two points, tessellated along its length (even shading, reliable contacts). */
export function tube(a, b, radius, material, { radialSegments = 12, parent, name } = {}) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, radialSegments, Math.max(1, Math.ceil(len / 0.2))), material);
  m.position.copy(va).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(_up, dir.normalize());
  if (name) m.name = name;
  if (parent) parent.add(m);
  return m;
}
