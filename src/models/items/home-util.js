// Small helpers shared by the home-group item files.
import { THREE, M, mesh, lathe, curveTube, lampGroup } from './common.js';

/**
 * Draped cloth: a 2D path [[z, y], ...] (side profile) thickened by t and extruded across X by width.
 * Centred on X. Good for towels over bars, blankets over edges.
 */
export function drapeGeo(path, t, width, { segments = 40 } = {}) {
  const curve = new THREE.CatmullRomCurve3(path.map(([z, y]) => new THREE.Vector3(z, y, 0)), false, 'centripetal');
  const pts = curve.getPoints(segments);
  const outer = [];
  const inner = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b.x - a.x, ty = b.y - a.y;
    const l = Math.hypot(tx, ty) || 1;
    const nx = -ty / l, ny = tx / l;
    outer.push(new THREE.Vector2(pts[i].x + nx * t / 2, pts[i].y + ny * t / 2));
    inner.push(new THREE.Vector2(pts[i].x - nx * t / 2, pts[i].y - ny * t / 2));
  }
  const shape = new THREE.Shape([...outer, ...inner.reverse()]);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: true, bevelThickness: Math.min(t * 0.4, 0.004), bevelSize: Math.min(t * 0.4, 0.004), bevelSegments: 2, curveSegments: 4 });
  geo.translate(0, 0, -width / 2);
  geo.rotateY(Math.PI / 2); // shape x (z) → world -z, extrusion → world x
  geo.scale(1, 1, -1);
  geo.computeVertexNormals();
  return geo;
}

/** Candle/match flame: teardrop lens (lamp group 'flame') with glow card, base at `at`. Returns lamp group. */
export function flame(parent, at, size = 1, name = 'flame', grp = null) {
  const g = grp ?? lampGroup(name, 'amber');
  const h = 0.028 * size, r = 0.0075 * size;
  const prof = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    prof.push([r * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - t * 0.35), t * h]);
  }
  prof[0][0] = 0.0005;
  prof[prof.length - 1][0] = 0;
  const geo = lathe(prof, 16);
  geo.translate(at[0], at[1] - 0.002 * size, at[2]);
  g.add(parent, { geometry: geo, normal: [0, 0, 1], depth: -0.002 });
  // glow card should sit around the flame, not in front
  const card = parent.children[parent.children.length - 1];
  card.position.set(at[0], at[1] + h * 0.55, at[2] + 0.004);
  card.scale.setScalar(0.35 * size);
  return g;
}

/** Wick: short dark curved thread from y0 up by h. */
export function wick(parent, x, y0, z, h = 0.012) {
  return curveTube([[x, y0 - 0.004, z], [x, y0 + h * 0.6, z], [x + h * 0.15, y0 + h, z]], 0.0009, M.matte('#1d1612'), { parent, segments: 6, radialSegments: 5 });
}

/** Canvas clock face drawer (12 ticks, numerals optional). */
export const clockFace = ({ bg = '#f6f2e8', fg = '#1d1d1d', numerals = true, accent = '#c8302a' } = {}) => (g, w, h) => {
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2;
  g.fillStyle = bg; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  g.strokeStyle = fg; g.fillStyle = fg;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const l = i % 5 ? 0.05 : 0.11;
    g.lineWidth = i % 5 ? 1.5 : 4;
    g.beginPath(); g.moveTo(cx + Math.sin(a) * R * 0.92, cy - Math.cos(a) * R * 0.92); g.lineTo(cx + Math.sin(a) * R * (0.92 - l), cy - Math.cos(a) * R * (0.92 - l)); g.stroke();
  }
  if (numerals) {
    g.font = `bold ${Math.round(R * 0.2)}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillText(String(i), cx + Math.sin(a) * R * 0.66, cy - Math.cos(a) * R * 0.66); }
  }
  g.fillStyle = accent; g.beginPath(); g.arc(cx, cy, R * 0.04, 0, 7); g.fill();
};

/** Digital screen drawer: big glowing digits. */
export const digits = (text, { bg = '#0b0d0c', fg = '#ff3a2a' } = {}) => (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  // size the digits to fit both the height and the width of the display (never clipped)
  const size = Math.min(h * 0.7, (w * 0.86) / (text.length * 0.62));
  g.fillStyle = fg; g.font = `bold ${Math.round(size)}px monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = fg; g.shadowBlur = size * 0.1;
  g.fillText(text, w / 2, h / 2 + size * 0.05, w * 0.92);
};

/** Spiral (rolled cloth/paper end) as a flat curveTube in the YZ plane at x. */
export function spiralEnd(parent, x, cy, R, turns, r, mat, { axis = 'x' } = {}) {
  const pts = [];
  const n = Math.round(turns * 16);
  for (let i = 0; i <= n; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rr = R * (0.15 + 0.85 * (i / n));
    pts.push(axis === 'x' ? [x, cy + Math.sin(a) * rr, Math.cos(a) * rr] : [Math.cos(a) * rr, cy + Math.sin(a) * rr, x]);
  }
  return curveTube(pts, r, mat, { parent, segments: n * 2, radialSegments: 6 });
}

/** Round button / tuft. */
export function button(parent, at, r, mat, rot) {
  return mesh(new THREE.SphereGeometry(r, 12, 8).scale(1, 0.45, 1), mat, { parent, at, rot });
}

/**
 * Puffy sewn pillow: two domed halves meeting in a thin seam at the edge (y=0).
 * p = squareness of the outline falloff, q = puff curve, pinch = corner "ears" pulled out.
 */
export function pillowGeo(W, H, D, { p = 2.4, q = 0.55, pinch = 0, n = 28 } = {}) {
  const pos = [];
  const idx = [];
  const row = n + 1;
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const u = (i / n) * 2 - 1, v = (j / n) * 2 - 1;
      const f = Math.max(0, (1 - Math.abs(u) ** p) * (1 - Math.abs(v) ** p)) ** q;
      const e = 1 + pinch * (Math.abs(u * v) ** 3);
      pos.push(u * W / 2 * e * (1 + 0.04 * f), side * f * H / 2, v * D / 2 * e * (1 + 0.04 * f));
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const a = base + j * row + i, b = a + 1, c = a + row, d = c + 1;
      if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const uv = [];
  for (let s = 0; s < 2; s++) for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) uv.push(i / n, j / n);
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
