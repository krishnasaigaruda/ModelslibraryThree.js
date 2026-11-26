/*
 * Cut-surface machinery shared by fruit and vegetables: lathe-bodied produce can be
 * shown whole, halved lengthwise or across, cut into wedges or rounds, and bitten.
 * Cut faces get a canvas texture (core, seeds, segments, rind) drawn from the real outline.
 */
import { THREE, PI, TAU, canvasTex, fitUV, smoothLathe, smoothPts, phys, fbm, toColor, vcolor, mesh, group, biteGeo } from './common.js';

/* ----------------------------------------------------------- textures */
function rr(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, TAU); }
function drawPattern(g, kind, c, cx, cy, R, rand) {
  const f = (col) => { g.fillStyle = col; g.fill(); };
  switch (kind) {
    case 'apple': case 'pear': {
      const el = kind === 'pear' ? 1.6 : 1.15;
      const oy = kind === 'pear' ? R * 0.35 : 0;
      g.strokeStyle = c.flesh2; g.lineWidth = R * 0.03;
      rr(g, cx, cy + oy, R * 0.32, R * 0.32 * el); g.stroke();
      rr(g, cx, cy + oy, R * 0.16, R * 0.3 * el); f(c.flesh2);
      for (const s of [-1, 1]) { rr(g, cx + s * R * 0.07, cy + oy, R * 0.05, R * 0.11, s * 0.25); f(c.seed); }
      break;
    }
    case 'stone': {
      const grd = g.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 0.75); grd.addColorStop(0, c.flesh2); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 4096, 4096);
      rr(g, cx, cy, R * 0.36, R * 0.5); f(c.seed);
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = R * 0.03;
      for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * R * 0.1, cy - R * 0.4); g.quadraticCurveTo(cx + i * R * 0.16, cy, cx + i * R * 0.1, cy + R * 0.4); g.stroke(); }
      break;
    }
    case 'avocado': {
      const grd = g.createRadialGradient(cx, cy + R * 0.25, R * 0.2, cx, cy, R * 1.05); grd.addColorStop(0, c.flesh); grd.addColorStop(0.75, c.flesh2); grd.addColorStop(1, '#4f8a2a');
      g.fillStyle = grd; g.fillRect(0, 0, 4096, 4096);
      rr(g, cx, cy + R * 0.28, R * 0.46, R * 0.5); f('#c9b56a');
      break;
    }
    case 'mango': { rr(g, cx, cy, R * 0.2, R * 0.75); f(c.flesh2); break; }
    case 'citrus': case 'kiwi': case 'pineapple': case 'cucumber': case 'carrot': case 'tomato': case 'strawberry': case 'onion': case 'zucchini': case 'banana': case 'radish': case 'beet': case 'potato': case 'eggplant': {
      if (kind === 'citrus') {
        const n = 10;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * TAU + 0.03, a1 = ((i + 1) / n) * TAU - 0.03;
          g.beginPath(); g.moveTo(cx + Math.cos((a0 + a1) / 2) * R * 0.1, cy + Math.sin((a0 + a1) / 2) * R * 0.1); g.arc(cx, cy, R * 0.86, a0, a1); g.closePath(); f(c.flesh);
          g.strokeStyle = c.flesh2; g.lineWidth = R * 0.012;
          for (let k = 0; k < 7; k++) { const a = a0 + ((a1 - a0) * (k + 0.5)) / 7; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.25, cy + Math.sin(a) * R * 0.25); g.lineTo(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8); g.stroke(); }
        }
        rr(g, cx, cy, R * 0.09, R * 0.09); f(c.rind);
      } else if (kind === 'kiwi') {
        const grd = g.createRadialGradient(cx, cy, R * 0.1, cx, cy, R); grd.addColorStop(0, c.flesh2); grd.addColorStop(0.35, c.flesh); grd.addColorStop(1, c.flesh); g.fillStyle = grd; g.fillRect(0, 0, 4096, 4096);
        g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = R * 0.015;
        for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.3); g.lineTo(cx + Math.cos(a) * R * 0.85, cy + Math.sin(a) * R * 0.85); g.stroke(); }
        rr(g, cx, cy, R * 0.22, R * 0.16); f('#f4f1d6');
        for (let i = 0; i < 70; i++) { const a = rand() * TAU, d = R * (0.27 + rand() * 0.12); rr(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.85, R * 0.025, R * 0.012, a); f(c.seed); }
      } else if (kind === 'pineapple') {
        g.strokeStyle = c.flesh2; g.lineWidth = R * 0.02;
        for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.25, cy + Math.sin(a) * R * 0.25); g.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9); g.stroke(); }
        rr(g, cx, cy, R * 0.22, R * 0.22); f(c.flesh2);
      } else if (kind === 'cucumber' || kind === 'zucchini') {
        rr(g, cx, cy, R * 0.55, R * 0.55); f(c.flesh2);
        for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; for (let k = 0; k < 5; k++) { rr(g, cx + Math.cos(a) * R * (0.12 + k * 0.08), cy + Math.sin(a) * R * (0.12 + k * 0.08), R * 0.05, R * 0.025, a); f(c.seed); } }
      } else if (kind === 'carrot') {
        rr(g, cx, cy, R * 0.45, R * 0.45); f(c.flesh2);
      } else if (kind === 'tomato' || kind === 'strawberry') {
        rr(g, cx, cy, R * 0.25, R * 0.25); f(c.flesh2);
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU + 0.4;
          rr(g, cx + Math.cos(a) * R * 0.52, cy + Math.sin(a) * R * 0.52, R * 0.24, R * 0.18, a); f(kind === 'tomato' ? c.seed : c.flesh2);
          if (kind === 'tomato') for (let k = 0; k < 5; k++) { rr(g, cx + Math.cos(a) * R * (0.4 + k * 0.05), cy + Math.sin(a) * R * (0.42 + (k % 2) * 0.1), R * 0.03, R * 0.02, a); f('#f2e7a8'); }
        }
      } else if (kind === 'onion') {
        g.strokeStyle = c.flesh2; g.lineWidth = R * 0.03;
        for (let k = 1; k < 9; k++) { rr(g, cx, cy, R * k * 0.105, R * k * 0.105); g.stroke(); }
      } else if (kind === 'beet' || kind === 'radish') {
        g.strokeStyle = c.flesh2; g.lineWidth = R * 0.04;
        for (let k = 1; k < 6; k++) { rr(g, cx, cy, R * k * 0.16, R * k * 0.16); g.stroke(); }
      } else if (kind === 'eggplant') {
        for (let i = 0; i < 60; i++) { const a = rand() * TAU, d = R * rand() * 0.6; rr(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * 0.02, R * 0.012); f(c.seed); }
      } else if (kind === 'banana') {
        rr(g, cx, cy, R * 0.3, R * 0.3); f(c.flesh2);
        for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; rr(g, cx + Math.cos(a) * R * 0.12, cy + Math.sin(a) * R * 0.12, R * 0.04, R * 0.04); f(c.seed); }
      }
      break;
    }
    case 'melon': {
      const grd = g.createRadialGradient(cx, cy, R * 0.3, cx, cy, R); grd.addColorStop(0, c.flesh2); grd.addColorStop(1, c.flesh); g.fillStyle = grd; g.fillRect(0, 0, 4096, 4096);
      rr(g, cx, cy, R * 0.38, R * 0.42); f(c.flesh2);
      for (let i = 0; i < 40; i++) { const a = rand() * TAU, d = R * (0.15 + rand() * 0.2); rr(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * 0.04, R * 0.02, a); f(c.seed); }
      break;
    }
    case 'watermelon': {
      for (let i = 0; i < 46; i++) { const a = rand() * TAU, d = R * (0.3 + rand() * 0.38); rr(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * 0.035, R * 0.018, a + 0.3); f(c.seed); }
      break;
    }
    case 'pomegranate': {
      g.fillStyle = c.flesh2; g.fillRect(0, 0, 4096, 4096);
      for (let i = 0; i < 220; i++) { const a = rand() * TAU, d = R * Math.sqrt(rand()) * 0.85; if (Math.abs(Math.sin(a * 3)) < 0.12) continue; rr(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * 0.05, R * 0.04, a); f(i % 3 ? c.flesh : c.seed); }
      break;
    }
    case 'cabbage': {
      g.strokeStyle = c.flesh2; g.lineWidth = R * 0.025;
      for (let k = 0; k < 26; k++) { g.beginPath(); const rad = R * (0.15 + k * 0.03); for (let a = 0; a <= TAU + 0.1; a += 0.15) { const w = rad * (1 + 0.15 * Math.sin(a * 5 + k)); g.lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * w * 0.9); } g.stroke(); }
      rr(g, cx, cy + R * 0.3, R * 0.12, R * 0.4); f(c.flesh2);
      break;
    }
    case 'crumb': case 'sponge': case 'open-crumb': {
      const n = kind === 'open-crumb' ? 90 : kind === 'crumb' ? 260 : 500;
      const sz = kind === 'open-crumb' ? 0.09 : kind === 'crumb' ? 0.035 : 0.015;
      for (let i = 0; i < n; i++) { const x = cx + (rand() - 0.5) * R * 2.4, y = cy + (rand() - 0.5) * R * 2.4; const s = R * sz * (0.4 + rand()); rr(g, x, y, s * (1 + rand()), s, rand() * 3); f(rand() > 0.5 ? c.flesh2 : 'rgba(0,0,0,0.12)'); }
      if (c.swirl) { g.strokeStyle = c.swirl; g.lineWidth = R * 0.08; g.beginPath(); for (let a = 0; a < 18; a += 0.2) g.lineTo(cx + Math.cos(a) * a * R * 0.045, cy + Math.sin(a) * a * R * 0.045); g.stroke(); }
      if (c.dots) { for (let i = 0; i < 40; i++) { rr(g, cx + (rand() - 0.5) * R * 2, cy + (rand() - 0.5) * R * 2, R * 0.05, R * 0.04); f(c.dots[i % c.dots.length]); } }
      break;
    }
    default: break;
  }
}
/**
 * Texture for a cut face. outline: [[x,y],...] in shape coords (closed); skinN: number of leading
 * points that lie on the skin (rind drawn along them); core: [x,y] centre; R: radius for patterns.
 */
export function cutTexture(kind, c, outline, skinN, core, R, key) {
  const W = 256, H = 256;
  return canvasTex(`cut:${key}`, W, H, (g) => {
    let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
    for (const [x, y] of outline) { mnx = Math.min(mnx, x); mny = Math.min(mny, y); mxx = Math.max(mxx, x); mxy = Math.max(mxy, y); }
    const mx = (x) => ((x - mnx) / (mxx - mnx || 1)) * W, my = (y) => (1 - (y - mny) / (mxy - mny || 1)) * H;
    const sc = W / (mxx - mnx || 1);
    g.fillStyle = c.skin; g.fillRect(0, 0, W, H);
    g.save();
    g.beginPath(); outline.forEach(([x, y], i) => (i ? g.lineTo(mx(x), my(y)) : g.moveTo(mx(x), my(y)))); g.closePath(); g.clip();
    g.fillStyle = c.flesh; g.fillRect(0, 0, W, H);
    // fibre noise
    const rand = mulberry(key.length * 977);
    g.globalAlpha = 0.08; g.fillStyle = '#ffffff';
    for (let i = 0; i < 160; i++) { g.beginPath(); g.arc(rand() * W, rand() * H, 1 + rand() * 3, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    drawPattern(g, kind, c, mx(core[0]), my(core[1]), R * sc, rand);
    // rind band along the skin edge
    const band = (c.rindW ?? 0.04) * R * sc;
    g.lineJoin = 'round';
    const skinPath = () => { g.beginPath(); for (let i = 0; i < skinN; i++) { const [x, y] = outline[i]; i ? g.lineTo(mx(x), my(y)) : g.moveTo(mx(x), my(y)); } if (skinN === outline.length) g.closePath(); };
    if (c.rind2) { skinPath(); g.strokeStyle = c.rind2; g.lineWidth = band * 4.2; g.stroke(); }
    skinPath(); g.strokeStyle = c.rind; g.lineWidth = band * 2; g.stroke();
    skinPath(); g.strokeStyle = c.skin; g.lineWidth = Math.max(2, band * 0.6); g.stroke();
    g.restore();
  });
}
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ----------------------------------------------------------- produce body */
/**
 * spec: { ctrl:[[r,y]...], skin(colorOut, x,y,z, t, n) , mat:'waxy'|'velvet'|..., cut:{kind, colours},
 *         displace(v3, t, a) optional, seg }
 * Returns builder functions.
 */
export function produce(spec) {
  const pts = smoothPts(spec.ctrl, spec.n ?? 28);
  const H = Math.max(...pts.map((p) => p[1])), Y0 = Math.min(...pts.map((p) => p[1]));
  const R = Math.max(...pts.map((p) => p[0]));
  const coreY = pts[pts.reduce((bi, p, i) => (p[0] > pts[bi][0] ? i : bi), 0)][1];
  const seg = spec.seg ?? 40;
  const skinMat = () => spec.mat({ vc: true });
  const paint = (geo) => {
    vcolor(geo, (x, y, z, c) => {
      const t = (y - Y0) / (H - Y0 || 1);
      const n = fbm(x * (spec.ns ?? 60) + 3, y * (spec.ns ?? 60), z * (spec.ns ?? 60), 3);
      spec.skin(c, x, y, z, t, n);
    });
    return geo;
  };
  const displace = (geo) => {
    if (!spec.displace) return geo;
    const p = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); spec.displace(v, (v.y - Y0) / (H - Y0 || 1), Math.atan2(v.x, v.z)); p.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals();
    return geo;
  };
  const lath = (list, phiStart = 0, phiLength = TAU) => displace(paint(new THREE.LatheGeometry(list.map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-4), y)), seg, phiStart, phiLength)));
  const faceMat = (outline, skinN, key) => {
    const cc = spec.cut;
    const map = cutTexture(cc.kind, cc, outline, skinN, [0, coreY], R, `${spec.key}:${key}`);
    return phys(cc.flesh, { rough: 0.4, cc: 0.4, ccr: 0.35, sheen: 0.6, sheenR: 0.3, map, side: THREE.DoubleSide, name: 'flesh' });
  };
  const shapeGeo = (outline) => {
    const s = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = fitUV(new THREE.ShapeGeometry(s, 2));
    g.rotateY(-PI / 2); // shape x → world z, faces -X
    return g;
  };
  const api = {
    R, H, Y0, coreY, pts,
    /** Whole produce, axis along Y, base at y=Y0. */
    whole(parent, { bites, name = 'fruit' } = {}) {
      const geo = lath(pts);
      if (bites) biteGeo(geo, bites, { centre: [0, coreY, 0], color: spec.cut.flesh });
      return mesh(geo, skinMat(), { parent, name });
    },
    /** Lengthwise half: shell x≥0 + cut face at x=0 facing -X (axis along Y). */
    halfLength(parent, name = 'half') {
      const g = group(name, { parent });
      mesh(lath(pts, 0, PI), skinMat(), { parent: g, name: `${name}_skin` });
      const outline = [...pts.map(([r, y]) => [r, y]), ...pts.slice().reverse().map(([r, y]) => [-r, y])];
      mesh(shapeGeo(outline), faceMat(outline, outline.length, 'len'), { parent: g, name: `${name}_face` });
      return g;
    },
    /** Lengthwise half lying cut-face up, axis along X, resting on y=0. */
    halfUp(parent, { at = [0, 0, 0], rotY = 0, name = 'half' } = {}) {
      const holder = group(`${name}_pos`, { parent, at, rot: [0, rotY, 0] });
      const g = api.halfLength(holder, name);
      g.rotation.z = -PI / 2;
      g.position.set(-(H + Y0) / 2, R, 0);
      return holder;
    },
    /** Lower part cut across at height yc, cut face up (disc). */
    halfCross(parent, { at = [0, 0, 0], yc = coreY, name = 'half', flipTop = false } = {}) {
      const g = group(name, { parent, at });
      const list = [];
      if (!flipTop) { for (const p of pts) { if (p[1] < yc) list.push(p); } list.push([radiusAt2(pts, yc), yc]); }
      else { list.push([radiusAt2(pts, yc), yc]); for (const p of pts) if (p[1] > yc) list.push(p); }
      const rc = radiusAt2(pts, yc);
      const shell = mesh(lath(list), skinMat(), { parent: g, name: `${name}_skin` });
      const outline = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; outline.push([Math.cos(a) * rc, coreY + Math.sin(a) * rc]); }
      const face = new THREE.CircleGeometry(rc, 40);
      face.rotateX(-PI / 2);
      const fm = phys(spec.cut.flesh, { rough: 0.38, cc: 0.4, sheen: 0.6, sheenR: 0.3, map: cutTexture(spec.cut.kind, spec.cut, outline, 40, [0, coreY], rc, `${spec.key}:x${rc.toFixed(3)}`), side: THREE.DoubleSide, name: 'flesh' });
      const f = mesh(face, fm, { parent: g, at: [0, yc, 0], name: `${name}_face` });
      if (flipTop) { g.rotation.x = PI; g.position.y = at[1] + (H - Y0) - (H - yc) + (H - yc) + Y0; shell.position.y = 0; g.position.y = at[1] + H; void f; }
      else g.position.y = at[1] - Y0;
      return g;
    },
    /** Wedge (sector of `angle`) lying on a cut face, resting on y=0, axis along -X. */
    wedge(parent, { angle = PI / 4, at = [0, 0, 0], rotY = 0, name = 'wedge', inner = 0 } = {}) {
      const holder = group(`${name}_pos`, { parent, at, rot: [0, rotY, 0] });
      const g = group(name, { parent: holder });
      mesh(lath(pts, 0, angle), skinMat(), { parent: g, name: `${name}_skin` });
      const outline = [...pts.map(([r, y]) => [r, y]), [inner, H], [inner, Y0]];
      const fm = faceMat(outline, pts.length, 'wedge');
      mesh(shapeGeo(outline), fm, { parent: g, name: `${name}_face` });
      const f2 = mesh(shapeGeo(outline), fm, { parent: g, name: `${name}_face2` });
      f2.rotation.y = angle;
      g.rotation.z = PI / 2;
      g.position.x = (H + Y0) / 2;
      return holder;
    },
    /** Round slice (cross-section disc) of thickness th at height y, lying flat. */
    round(parent, { y = coreY, th = 0.006, at = [0, 0, 0], name = 'slice' } = {}) {
      const rc = radiusAt2(pts, y);
      const outline = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; outline.push([Math.cos(a) * rc, Math.sin(a) * rc]); }
      const map = cutTexture(spec.cut.kind, spec.cut, outline, 40, [0, 0], rc, `${spec.key}:r${rc.toFixed(3)}`);
      const top = phys(spec.cut.flesh, { rough: 0.38, cc: 0.4, sheen: 0.6, sheenR: 0.3, map, name: 'flesh' });
      const side = spec.mat({});
      side.color = toColor(spec.cut.skin);
      const geo = new THREE.CylinderGeometry(rc, rc, th, 40);
      return mesh(geo, [side, top, top], { parent, at: [at[0], at[1] + th / 2, at[2]], name });
    },
  };
  return api;
}
export function radiusAt2(pts, y) {
  for (let i = 1; i < pts.length; i++) {
    const [r0, y0] = pts[i - 1], [r1, y1] = pts[i];
    if ((y - y0) * (y - y1) <= 0 && y1 !== y0) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return pts[Math.floor(pts.length / 2)][0];
}
/** Seed points on a lathe surface (strawberry achenes etc.). */
export function surfacePoints(pts, n, rand, { tMin = 0.1, tMax = 0.9, lift = 0 } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = tMin + rand() * (tMax - tMin);
    const k = t * (pts.length - 1), i0 = Math.floor(k), f = k - i0;
    const p0 = pts[i0], p1 = pts[Math.min(i0 + 1, pts.length - 1)];
    const r = p0[0] + (p1[0] - p0[0]) * f + lift, y = p0[1] + (p1[1] - p0[1]) * f;
    const a = rand() * TAU;
    out.push({ at: [Math.sin(a) * r, y, Math.cos(a) * r], a, t });
  }
  return out;
}
export { smoothLathe, toColor };
