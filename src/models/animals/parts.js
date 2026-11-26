import * as THREE from 'three';
import { loft, spline, smooth01, lerp, clamp, C } from './core.js';

/* Shared animal parts: ears, eyes, horns, antlers, materials. All built in world (rest) space. */

const matCache = new Map();
export function hoofMaterial(color = '#26201b') {
  const k = `hoof${color}`;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshPhysicalMaterial({ name: 'hoof', color: C(color), roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35 }));
  return matCache.get(k);
}
export function hornMaterial(color = '#d9ccb0') {
  const k = `horn${color}`;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshPhysicalMaterial({ name: 'horn', color: C(color), roughness: 0.5, clearcoat: 0.3, vertexColors: true }));
  return matCache.get(k);
}

/* ---------------- eyes ---------------- */
export function buildEye(at, look, r, spec = {}) {
  const g = new THREE.Group();
  g.name = 'eye';
  g.position.copy(at);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), look.clone().normalize());
  const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshPhysicalMaterial({ name: 'eye', color: C(spec.color ?? '#2b1a0e'), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.02 }));
  ball.quaternion.copy(q);
  g.add(ball);
  const pupil = spec.pupil ?? 'round';
  if (spec.color && pupil !== 'none') {
    const pg = new THREE.SphereGeometry(r * 0.5, 14, 10);
    if (pupil === 'slit') pg.scale(0.28, 1.15, 0.3);
    else if (pupil === 'bar') pg.scale(1.3, 0.38, 0.3);
    else pg.scale(1, 1, 0.3);
    pg.translate(0, 0, r * 0.88);
    const pm = new THREE.Mesh(pg, new THREE.MeshPhysicalMaterial({ color: '#050505', roughness: 0.2, clearcoat: 1 }));
    pm.quaternion.copy(q);
    g.add(pm);
  }
  // eyelid rim
  const lid = new THREE.Mesh(new THREE.TorusGeometry(r * 0.96, r * 0.11, 8, 24), new THREE.MeshStandardMaterial({ color: C(spec.lid ?? '#1f1712'), roughness: 0.7 }));
  lid.quaternion.copy(q);
  lid.position.copy(look.clone().normalize().multiplyScalar(r * 0.3));
  lid.scale.set(1, spec.lidSquint ?? 0.85, 1);
  g.add(lid);
  return g;
}

/* ---------------- ears ---------------- */
const PROFILES = {
  pointed: (u) => (1 - u) ** 0.85 * Math.min(1, 0.6 + u * 3),
  cat: (u) => (1 - u) ** 0.95 * Math.min(1, 0.75 + u * 2.5),
  rounded: (u) => Math.sqrt(Math.max(0, 1 - ((u - 0.42) / 0.58) ** 2)),
  leaf: (u) => Math.sin(Math.PI * Math.min(1, u ** 0.8)) * 0.9 + 0.1 * (1 - u),
  floppy: (u) => (1 - 0.45 * u) * Math.sqrt(Math.max(0, 1 - smooth01((u - 0.62) / 0.38) ** 2)) * Math.min(1, 0.7 + u * 2),
};

/**
 * Ear: { type: 'erect'|'cat'|'floppy'|'semi'|'rose'|'horse'|'cow'|'deer'|'pig'|'round'|'rabbit'|'elephant',
 *        len (fraction of head length), w (width/len), cup, fold, splay, tilt }
 */
export function buildEar(e) {
  const len = e.len * e.hl;
  const type = e.type;
  const profile = PROFILES[e.profile ?? { erect: 'pointed', cat: 'cat', floppy: 'floppy', semi: 'pointed', rose: 'pointed', button: 'pointed', horse: 'leaf', cow: 'leaf', deer: 'leaf', pig: 'pointed', round: 'rounded', rabbit: 'leaf', elephant: 'rounded' }[type] ?? 'pointed'];
  const w = (e.w ?? 0.45) * len;
  const cup = e.cup ?? (type === 'floppy' ? 0.15 : 0.55);
  const th = len * (e.th ?? 0.05);
  const sx = e.sx;
  const nrm = e.normal.clone();
  const up = e.headUp.clone();
  const fwd = e.headDir.clone();
  const side = new THREE.Vector3(sx, 0, 0);
  let eu;
  let ef;
  const splay = e.splay ?? 0.35;
  const tilt = e.tilt ?? 0.15;
  if (type === 'floppy' || type === 'elephant') {
    e.base.addScaledVector(nrm, len * 0.04);
    if (e.clearX && Math.abs(e.base.x) < e.clearX) e.base.x = sx * e.clearX;
    eu = up.clone().multiplyScalar(-0.95).addScaledVector(side, type === 'elephant' ? 0.5 : 0.16).addScaledVector(fwd, type === 'elephant' ? -0.12 : 0.12);
    ef = side.clone();
  } else if (type === 'cow' || type === 'side') {
    eu = side.clone().multiplyScalar(0.95).addScaledVector(up, -0.05).addScaledVector(fwd, -0.15);
    ef = fwd.clone().addScaledVector(up, 0.4);
  } else if (type === 'button' || type === 'rose') {
    // small folded ears: rise from the top-side of the skull, tip folds forward (button) or back (rose) and droops
    eu = up.clone().multiplyScalar(0.75).addScaledVector(side, 0.65).addScaledVector(fwd, type === 'button' ? 0.1 : -0.15);
    ef = fwd.clone().addScaledVector(side, 0.3);
  } else if (type === 'pig') {
    eu = up.clone().multiplyScalar(0.55).addScaledVector(fwd, 0.6).addScaledVector(side, 0.45);
    ef = up.clone().multiplyScalar(-0.3).addScaledVector(fwd, 0.6);
  } else {
    eu = up.clone().addScaledVector(side, splay).addScaledVector(fwd, -tilt);
    ef = fwd.clone().addScaledVector(side, type === 'deer' ? 0.7 : 0.25);
  }
  eu.normalize();
  ef.addScaledVector(eu, -ef.dot(eu)).normalize();
  const es = new THREE.Vector3().crossVectors(eu, ef).normalize();
  const nu = 12;
  const nv = 9;
  const pos = [];
  const reg = [];
  const lt = [];
  const fold = e.fold ?? (type === 'semi' ? 1.6 : type === 'rose' ? 1.5 : type === 'button' ? 1.9 : 0);
  const uf = e.foldAt ?? (type === 'rose' || type === 'button' ? 0.32 : 0.62);
  const local = (u, v, back) => {
    const hw = w * profile(u);
    let x = v * hw;
    let y = u * len;
    let z = -cup * hw * (1 - v * v) * 0.6 - (back ? th * (1 - 0.75 * u) : 0);
    if (back) x *= 0.97;
    if (fold && u > uf) {
      const a = (fold * (u - uf)) / (1 - uf);
      const yp = uf * len;
      const dy = y - yp;
      const nyy = dy * Math.cos(a) - z * Math.sin(a) * 0;
      y = yp + dy * Math.cos(a);
      z = z + dy * Math.sin(a) * (type === 'rose' ? -1 : 1);
      void nyy;
    }
    return e.base.clone().addScaledVector(es, x).addScaledVector(eu, y).addScaledVector(ef, z);
  };
  for (const back of [false, true]) {
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      for (let j = 0; j <= nv; j++) {
        const v = (j / nv) * 2 - 1;
        const p = local(Math.min(u, 0.995), v, back);
        pos.push(p.x, p.y, p.z);
        reg.push(back ? 0 : 1);
        lt.push(u);
      }
    }
  }
  const idx = [];
  const F = (i, j) => i * (nv + 1) + j;
  const Bk = (i, j) => (nu + 1) * (nv + 1) + i * (nv + 1) + j;
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      idx.push(F(i, j), F(i, j + 1), F(i + 1, j), F(i + 1, j), F(i, j + 1), F(i + 1, j + 1));
      idx.push(Bk(i, j), Bk(i + 1, j), Bk(i, j + 1), Bk(i + 1, j), Bk(i + 1, j + 1), Bk(i, j + 1));
    }
    // rims
    idx.push(F(i, 0), F(i + 1, 0), Bk(i, 0), Bk(i, 0), F(i + 1, 0), Bk(i + 1, 0));
    idx.push(F(i, nv), Bk(i, nv), F(i + 1, nv), Bk(i, nv), Bk(i + 1, nv), F(i + 1, nv));
  }
  for (let j = 0; j < nv; j++) idx.push(F(nu, j), Bk(nu, j), F(nu, j + 1), Bk(nu, j), Bk(nu, j + 1), F(nu, j + 1));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  // concave side winding: make sure front faces outward along ef
  g.computeVertexNormals();
  g.userData.regions = reg;
  g.userData.lt = lt;
  const m = new THREE.Mesh(g, null);
  m.name = 'ear';
  m.userData.base = e.base.clone();
  m.userData.side = sx;
  if (e.tuft) {
    const tipP = local(0.995, 0, false);
    const tg = new THREE.ConeGeometry(len * 0.06, len * e.tuft, 6);
    tg.translate(0, len * e.tuft * 0.5, 0);
    const tm2 = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: '#1a1512', roughness: 0.9 }));
    tm2.position.copy(tipP).addScaledVector(eu, -len * 0.04);
    tm2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), eu);
    m.add(tm2);
  }
  m.userData.paint = type === 'floppy' || type === 'elephant' || type === 'rose' || type === 'button' ? 'ear-all' : 'ear';
  return m;
}

/* ---------------- horns ---------------- */
export function buildHorns(h, { headCurve, headSec, hl, tm, hu, hd, surfacePoint }) {
  const out = [];
  const color = h.color ?? '#d8cbb0';
  const tipColor = h.tip ?? '#3a3028';
  const mk = (pts, r0, r1, ring = 12) => {
    const c = spline(pts);
    const g = loft(c, (t) => ({ w: lerp(r0, r1, t ** 0.8), up: lerp(r0, r1, t ** 0.8), dn: lerp(r0, r1, t ** 0.8), e: 2 }), { n: 32, ring, lateral: 'free' });
    const lt = g.attributes.lt.array;
    const col = new Float32Array(lt.length * 3);
    const a = C(color);
    const b = C(tipColor);
    for (let i = 0; i < lt.length; i++) {
      const c2 = a.clone().lerp(b, smooth01((lt[i] - 0.55) / 0.4));
      // growth rings
      if (h.ringed) c2.multiplyScalar(0.85 + 0.15 * Math.sin(lt[i] * 60));
      col.set([c2.r, c2.g, c2.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, hornMaterial());
    m.name = 'horn';
    return m;
  };
  const type = h.type;
  const L = (h.len ?? 0.5) * hl;
  const R = (h.r ?? 0.07) * hl;
  if (type === 'rhino') {
    const a = surfacePoint(headCurve, headSec, 0.86, 0);
    const b = surfacePoint(headCurve, headSec, 0.62, 0);
    out.push(mk([a.p.clone().addScaledVector(a.n, -R * 0.5), a.p.clone().addScaledVector(a.n, L * 0.5).addScaledVector(hd, L * 0.05), a.p.clone().addScaledVector(a.n, L).addScaledVector(hd, -L * 0.15)], R, R * 0.06, 14));
    out.push(mk([b.p.clone().addScaledVector(b.n, -R * 0.4), b.p.clone().addScaledVector(b.n, L * 0.4)], R * 0.75, R * 0.06, 12));
    return out;
  }
  if (type === 'ossicone') {
    for (const sx of [1, -1]) {
      const s = surfacePoint(headCurve, headSec, tm * 0.2, sx * 0.4);
      const dir = hu.clone().addScaledVector(hd, -0.35).add(new THREE.Vector3(sx * 0.15, 0, 0)).normalize();
      out.push(mk([s.p.clone().addScaledVector(s.n, -R * 0.5), s.p.clone().addScaledVector(dir, L)], R, R * 0.9, 10));
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(R * 1.15, 12, 8), new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 0.9 }));
      tuft.position.copy(s.p).addScaledVector(dir, L);
      out.push(tuft);
    }
    return out;
  }
  for (const sx of [1, -1]) {
    const s = surfacePoint(headCurve, headSec, h.t ?? tm * 0.12, sx * (h.a ?? 0.75));
    const base = s.p.clone().addScaledVector(s.n, -R * 0.4);
    const X = new THREE.Vector3(sx, 0, 0);
    const P = (side, upk, back) => base.clone().addScaledVector(X, side * L).addScaledVector(hu, upk * L).addScaledVector(hd, -back * L);
    let pts;
    switch (type) {
      case 'ram': {
        pts = [];
        for (let i = 0; i <= 10; i++) {
          const a = (i / 10) * Math.PI * 1.6;
          const rr = 0.42 * (1 - 0.35 * (i / 10));
          pts.push(P(0.12 + 0.35 * (i / 10), rr * Math.sin(a) * 0.9 + 0.05, rr * (1 - Math.cos(a)) * 0.9 - 0.45 * (i / 10) * 0));
        }
        pts = pts.map((p, i) => p.addScaledVector(hd, (i / 10) * L * 0.25));
        out.push(mk(pts, R * 1.25, R * 0.25, 12));
        continue;
      }
      case 'goat':
        pts = [P(0, 0, 0), P(0.06, 0.35, 0.25), P(0.12, 0.55, 0.6), P(0.18, 0.55, 0.95)];
        break;
      case 'ibex':
        pts = [P(0, 0, 0), P(0.05, 0.4, 0.2), P(0.1, 0.7, 0.6), P(0.14, 0.62, 1.0), P(0.16, 0.38, 1.25)];
        break;
      case 'antelope':
        pts = [P(0, 0, 0), P(0.06, 0.5, 0.25), P(0.1, 0.95, 0.45)];
        break;
      case 'longhorn':
        pts = [P(0, 0, 0), P(0.45, 0.02, 0), P(0.9, 0.18, -0.05), P(1.15, 0.45, 0.05)];
        break;
      case 'buffalo':
        pts = [P(0, 0, 0), P(0.3, -0.15, 0.05), P(0.6, 0.05, 0.1), P(0.7, 0.4, 0.05)];
        break;
      case 'bull':
        pts = [P(0, 0, 0), P(0.35, 0.05, 0), P(0.55, 0.25, -0.2), P(0.55, 0.45, -0.3)];
        break;
      case 'bison':
        pts = [P(0, 0, 0), P(0.3, 0.1, 0), P(0.42, 0.4, 0.05)];
        break;
      case 'cow':
      default:
        pts = [P(0, 0, 0), P(0.35, 0.08, 0), P(0.55, 0.32, -0.08), P(0.55, 0.55, 0.0)];
        break;
    }
    out.push(mk(pts, R, R * 0.18, 12));
  }
  return out;
}

/* ---------------- antlers ---------------- */
export function buildAntlers(a, { headCurve, headSec, hl, tm, hu, hd, surfacePoint, rand }) {
  const out = [];
  const color = a.color ?? '#b8a27e';
  const tip = a.tip ?? '#efe6d2';
  const L = (a.len ?? 1.6) * hl;
  const R = (a.r ?? 0.05) * hl;
  const mat = hornMaterial();
  const mk = (pts, r0, r1, flat = 1, ring = 10) => {
    const c = spline(pts);
    const g = loft(c, (t) => ({ w: lerp(r0, r1, t) * flat, up: lerp(r0, r1, t), dn: lerp(r0, r1, t), e: 2 }), { n: 22, ring, lateral: 'free' });
    const lt = g.attributes.lt.array;
    const col = new Float32Array(lt.length * 3);
    for (let i = 0; i < lt.length; i++) {
      const c2 = C(color).lerp(C(tip), smooth01((lt[i] - 0.7) / 0.3));
      col.set([c2.r, c2.g, c2.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, mat);
    m.name = 'antler';
    out.push(m);
  };
  const tines = a.tines ?? 3;
  for (const sx of [1, -1]) {
    const s = surfacePoint(headCurve, headSec, tm * 0.22, sx * 0.45);
    const base = s.p.clone().addScaledVector(s.n, -R * 0.5);
    const X = new THREE.Vector3(sx, 0, 0);
    const P = (side, upk, back) => base.clone().addScaledVector(X, side * L).addScaledVector(hu, upk * L).addScaledVector(hd, -back * L);
    // pedicle burr
    const burr = new THREE.Mesh(new THREE.TorusGeometry(R * 1.05, R * 0.35, 6, 12), mat);
    burr.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(burr.geometry.attributes.position.count * 3).fill(0.45), 3));
    burr.position.copy(base).addScaledVector(s.n, R * 0.5);
    burr.lookAt(burr.position.clone().add(s.n));
    out.push(burr);
    if (a.type === 'moose') {
      // short beam then a broad palm with tines along its edge
      const beam = [P(0, 0, 0), P(0.18, 0.06, 0.02), P(0.32, 0.12, 0.05)];
      mk(beam, R * 1.2, R);
      const palm0 = beam[2];
      const palmPts = [palm0, P(0.55, 0.24, 0.0), P(0.78, 0.38, -0.05)];
      // the palm itself: flattened loft (wide, thin)
      const c = spline(palmPts);
      const g = loft(c, (t) => ({ w: R * 0.6, up: L * 0.22 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05)), dn: L * 0.05 * Math.sin(Math.PI * t), e: 2 }), { n: 18, ring: 14, lateral: 'free' });
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(0.66), 3));
      out.push(new THREE.Mesh(g, mat));
      for (let k = 0; k < 6; k++) {
        const t = 0.25 + k * 0.13;
        const pp = c.getPointAt(Math.min(1, t));
        const dir = hu.clone().multiplyScalar(0.9).addScaledVector(X, 0.4).addScaledVector(hd, -0.2 + k * 0.05).normalize();
        // tines grow out of the palm's upper edge (rooted inside it, so they're attached)
        const edge = L * 0.22 * Math.sin(Math.PI * Math.min(1, Math.min(1, t) * 0.95 + 0.05)) * 0.8;
        // snap to the nearest actual palm vertex, nudged inward, so the tine is truly rooted
        const target = pp.clone().addScaledVector(hu, edge);
        const pa = g.attributes.position;
        const best = new THREE.Vector3();
        let bd = Infinity;
        for (let vi = 0; vi < pa.count; vi++) {
          const vx = new THREE.Vector3().fromBufferAttribute(pa, vi);
          const dd = vx.distanceToSquared(target);
          if (dd < bd) { bd = dd; best.copy(vx); }
        }
        const root = best.lerp(pp, 0.15);
        mk([root, root.clone().addScaledVector(dir, L * 0.1), root.clone().addScaledVector(dir, L * 0.2)], R * 0.55, R * 0.12, 1, 8);
      }
      continue;
    }
    // main beam: up, back and out, curving forward at the top
    const beam = [P(0, 0, 0), P(0.18, 0.28, 0.12), P(0.3, 0.58, 0.18), P(0.32, 0.86, 0.06), P(0.26, 1.0, -0.12)];
    mk(beam, R * 1.1, R * 0.35);
    const c = spline(beam);
    // brow tine
    {
      const p0 = c.getPointAt(0.12);
      mk([p0, p0.clone().addScaledVector(hd, L * 0.22).addScaledVector(hu, L * 0.1)], R * 0.7, R * 0.15, 1, 8);
    }
    for (let k = 0; k < tines; k++) {
      const t = 0.35 + (k / Math.max(1, tines)) * 0.55;
      const p0 = c.getPointAt(t);
      const len = L * (0.26 - k * 0.03) * (0.9 + rand() * 0.2);
      const dir = hu.clone().multiplyScalar(0.85).addScaledVector(hd, 0.45).addScaledVector(X, 0.1 * (k % 2 ? 1 : -1)).normalize();
      mk([p0, p0.clone().addScaledVector(dir, len * 0.6).addScaledVector(hu, len * 0.05), p0.clone().addScaledVector(dir, len)], R * 0.6, R * 0.12, 1, 8);
    }
  }
  return out;
}

export { clamp };
