import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { applySkin } from './skin.js';

/*
 * Footwear built on a "last": lofted cross-sections from heel (u = 0) to toe (u = 1),
 * in the person's rest pose (world space), skinned to the foot and toe bones so the
 * shoe bends at the ball of the foot when walking. Toes point straight forward (+Z).
 *
 * types: sneaker | kids | dress | boot | flat | heel | sandal | none (barefoot)
 */

const smooth = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** Top-view half-width profile of a foot/shoe (1 = widest, at the ball). */
function widthProfile(u, pointy = 0) {
  let w = 0.64 + 0.36 * smooth((u - 0.05) / 0.62) - 0.12 * Math.exp(-(((u - 0.38) / 0.12) ** 2)); // heel → waist → ball
  if (u > 0.78) w *= Math.sqrt(Math.max(0, 1 - ((u - 0.78) / 0.22) ** (pointy ? 1.6 : 2))); // rounded toe
  if (u < 0.1) w *= Math.sqrt(Math.max(0, 1 - ((0.1 - u) / 0.1) ** 2)) * 0.6 + 0.4 * (u / 0.1); // rounded heel
  return Math.max(w, 0.0005);
}

/**
 * Loft between u0..u1. section(u) → { w (half width), y0 (bottom), y1 (top), n (superellipse exponent), dx }.
 * Returns an indexed geometry with a `u` attribute (for weights / colour panels).
 */
function loft({ zHeel, len, x0, u0 = 0, u1 = 1, nU, nV, section, capEnds = true }) {
  const pos = [];
  const us = [];
  for (let i = 0; i <= nU; i++) {
    const u = u0 + ((u1 - u0) * i) / nU;
    const s = section(u);
    const yc = (s.y0 + s.y1) / 2;
    const hh = Math.max((s.y1 - s.y0) / 2, 1e-4);
    const e = 2 / (s.n ?? 3);
    for (let j = 0; j < nV; j++) {
      const a = (j / nV) * Math.PI * 2;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const x = x0 + (s.dx ?? 0) + s.w * Math.sign(c) * Math.abs(c) ** e;
      let y = yc + hh * Math.sign(sn) * Math.abs(sn) ** (sn < 0 ? e * 0.5 : e); // flatter bottom
      if (s.flatBottom) y = Math.max(y, s.y0);
      pos.push(x, y, zHeel + u * len);
      us.push(u);
    }
  }
  const idx = [];
  for (let i = 0; i < nU; i++) {
    for (let j = 0; j < nV; j++) {
      const a = i * nV + j;
      const b = i * nV + ((j + 1) % nV);
      const c = a + nV;
      const d = b + nV;
      idx.push(a, c, b, b, c, d);
    }
  }
  if (capEnds) {
    // close both ends with a centre vertex
    for (const [ring, flip] of [[0, true], [nU, false]]) {
      const u = u0 + ((u1 - u0) * ring) / nU;
      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (let j = 0; j < nV; j++) {
        cx += pos[(ring * nV + j) * 3];
        cy += pos[(ring * nV + j) * 3 + 1];
        cz += pos[(ring * nV + j) * 3 + 2];
      }
      const ci = pos.length / 3;
      pos.push(cx / nV, cy / nV, cz / nV + (flip ? -0.002 : 0.002));
      us.push(u);
      for (let j = 0; j < nV; j++) {
        const a = ring * nV + j;
        const b = ring * nV + ((j + 1) % nV);
        if (flip) idx.push(ci, a, b);
        else idx.push(ci, b, a);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('u', new THREE.Float32BufferAttribute(us, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * Build footwear for one foot. Returns [geometry, material, name][] already skinned
 * (skinIndex/skinWeight) to the foot + toe bones; the caller wraps them as SkinnedMeshes.
 */
export function buildFootwear({ P, s, type, color, accent, skinColor, low, ankle, footBone, toeBone, kid }) {
  const H = P.H;
  const out = [];
  const nU = low ? 9 : 22;
  const nV = low ? 8 : 16;
  const shoeK = type === 'none' || type === 'sandal' ? 1 : 1.07;
  const len = (kid ? 0.158 : P.f ? 0.147 : 0.152) * H * shoeK;
  const zHeel = ankle.z - 0.25 * len;
  const W = (kid ? 0.032 : P.f ? 0.026 : 0.029) * H * (shoeK > 1 ? 1.06 : 1);
  const x0 = ankle.x;
  const ballU = 0.7;
  const weight = (u) => smooth((u - (ballU - 0.08)) / 0.16); // toe-bone share
  const skin = (g) =>
    applySkin(g, -1, (i) => {
      const t = weight(g.attributes.u.array[i]);
      return [[footBone, 1 - t], [toeBone, t]];
    });
  const push = (g, mat, name) => {
    skin(g);
    g.deleteAttribute('u');
    out.push([g, mat, name]);
  };

  const main = M.toColor(color ?? '#222222');
  const leather = (c, gloss = 0.25) => new THREE.MeshPhysicalMaterial({ name: 'leather', color: c, roughness: gloss, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const textile = (c) => new THREE.MeshPhysicalMaterial({ name: 'shoe', color: c, roughness: 0.75, sheen: 0.5, sheenRoughness: 0.6, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.3) });
  const rubber = (c) => new THREE.MeshStandardMaterial({ name: 'sole', color: c, roughness: 0.85 });

  // heel lift (pumps): insole rises at the back
  const heelH = type === 'heel' ? 0.035 * H : type === 'dress' || type === 'boot' ? 0.012 * H : 0;
  const lift = (u) => heelH * (1 - smooth((u - 0.28) / 0.4));
  const soleT = { sneaker: 0.017, kids: 0.016, dress: 0.008, boot: 0.016, flat: 0.006, heel: 0.005, sandal: 0.012, none: 0 }[type] * H;
  const toeSpring = type === 'sneaker' || type === 'kids' || type === 'boot' ? 0.006 * H : 0.002 * H;
  const spring = (u) => toeSpring * smooth((u - 0.8) / 0.2);
  const ankleTop = ankle.y + 0.012 * H;

  // ---- bare foot (barefoot / sandals / flats & heels show the top of the foot) ----
  const showsFoot = type === 'none' || type === 'sandal' || type === 'flat' || type === 'heel';
  if (showsFoot) {
    const footMat = M.skin(skinColor);
    const fy0 = (u) => soleT + lift(u) + spring(u) * 0.5;
    const instep = (u) => (u < 0.3 ? ankleTop - 0.004 * H : THREE.MathUtils.lerp(ankleTop - 0.004 * H, 0.03 * H, smooth((u - 0.3) / 0.5)));
    push(loft({ zHeel: zHeel + 0.004 * H, len: len * 0.9, x0, nU, nV, section: (u) => ({ w: W * 0.9 * widthProfile(u), y0: fy0(u), y1: fy0(u) + Math.max(0.01 * H, instep(u) - fy0(u)) * (u > 0.85 ? Math.sqrt(Math.max(0, 1 - ((u - 0.85) / 0.15) ** 2)) * 0.8 + 0.2 : 1), n: 2.6, flatBottom: true }) }), footMat, 'foot');
    // toes (only where they show)
    if (!low && (type === 'none' || type === 'sandal')) {
      const toeR = [0.0085, 0.0072, 0.0066, 0.006, 0.0055];
      for (let k = 0; k < 5; k++) {
        const r = toeR[k] * H;
        const xk = x0 + s * W * 0.9 * (0.62 - k * 0.31); // big toe on the inside
        const zk = zHeel + 0.004 * H + len * 0.9 * (0.985 - k * 0.035 - (k ? 0.02 : 0));
        const g = new THREE.SphereGeometry(r, 10, 8).scale(1, 0.8, 1.3).translate(xk, fy0(0.97) + r * 0.75, zk);
        g.setAttribute('u', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count).fill(1), 1));
        push(g, footMat, 'toe');
      }
    }
  }

  // ---- soles ----
  const soleMat = rubber(type === 'sneaker' || type === 'kids' ? '#f2f1ec' : type === 'boot' ? '#2a2420' : '#1a1714');
  if (type !== 'none') {
    const tread = type === 'sneaker' || type === 'kids' || type === 'boot';
    push(loft({ zHeel, len, x0, nU: low ? nU : nU * 2, nV, section: (u) => {
      const y0 = spring(u) + (type === 'heel' ? lift(u) : 0);
      const lug = tread && !low ? 1 + 0.025 * Math.sign(Math.sin(u * (type === 'boot' ? 40 : 70))) : 1;
      return { w: W * 1.04 * widthProfile(u) * lug, y0, y1: y0 + soleT + (type === 'heel' ? 0 : lift(u) * 0.9), n: 4, flatBottom: true };
    } }), soleMat, 'sole');
    if (type === 'dress' || type === 'boot' || type === 'heel') {
      // separate heel block
      const hb = type === 'heel' ? lift(0.1) + soleT : heelH + soleT;
      const hz = zHeel + len * (type === 'heel' ? 0.07 : 0.1);
      const hg = type === 'heel'
        ? new THREE.CylinderGeometry(0.005 * H, 0.008 * H, hb, low ? 6 : 12).translate(x0, hb / 2, hz)
        : new THREE.BoxGeometry(W * 1.2, hb, len * 0.2).translate(x0, hb / 2, hz);
      hg.setAttribute('u', new THREE.Float32BufferAttribute(new Array(hg.attributes.position.count).fill(0.1), 1));
      push(hg, rubber(type === 'heel' ? main.clone().multiplyScalar(0.7) : '#1a1410'), 'heel');
    }
  }

  // ---- uppers ----
  const yb = (u) => soleT + lift(u) + spring(u);
  if (type === 'sneaker' || type === 'kids' || type === 'dress' || type === 'boot') {
    const collar = type === 'boot' ? ankleTop + 0.03 * H : type === 'dress' ? ankleTop - 0.012 * H : ankleTop;
    const toeH = (type === 'dress' ? 0.026 : 0.034) * H;
    const top = (u) => {
      if (u < 0.42) return collar - (type === 'dress' ? 0 : 0.006 * H * smooth((0.2 - u) / 0.2)); // heel collar dips at the back tab
      const t = smooth((u - 0.42) / 0.4);
      let y = THREE.MathUtils.lerp(collar, yb(u) + toeH, t);
      if (u > 0.86) y = yb(u) + (y - yb(u)) * (0.35 + 0.65 * Math.sqrt(Math.max(0, 1 - ((u - 0.86) / 0.14) ** 2)));
      return y;
    };
    const upperMat = type === 'dress' ? leather(main, 0.2) : type === 'boot' ? leather(main, 0.5) : textile(main);
    const up = loft({ zHeel: zHeel + 0.002 * H, len: len - 0.004 * H, x0, nU, nV, section: (u) => ({ w: W * widthProfile(u, type === 'dress'), y0: yb(u) - 0.002 * H, y1: top(u), n: type === 'dress' ? 2.4 : 2.8, flatBottom: true }) });
    push(up, upperMat, 'shoe');
    const accentC = M.toColor(accent ?? (type === 'sneaker' ? '#f4f4f2' : type === 'kids' ? '#f2c200' : main.clone().multiplyScalar(0.6)));
    if (!low && type !== 'dress') {
      // toe cap and heel counter panels (second colour)
      push(loft({ zHeel: zHeel + 0.002 * H, len: len - 0.004 * H, x0, u0: 0.8, u1: 1, nU: 8, nV, section: (u) => ({ w: W * widthProfile(u) + 0.0012 * H, y0: yb(u) - 0.001 * H, y1: Math.min(top(u), yb(u) + 0.018 * H) + 0.0012 * H, n: 2.8, flatBottom: true }) }), type === 'boot' ? leather(accentC, 0.5) : textile(accentC), 'toe-cap');
      push(loft({ zHeel: zHeel + 0.001 * H, len: len - 0.004 * H, x0, u0: 0, u1: 0.22, nU: 6, nV, capEnds: false, section: (u) => ({ w: W * widthProfile(u) + 0.0012 * H, y0: yb(u) - 0.001 * H, y1: top(u) - 0.004 * H, n: 2.8, flatBottom: true }) }), type === 'boot' ? leather(accentC, 0.5) : textile(accentC), 'heel-counter');
    }
    if (type === 'dress' && !low) {
      // welt: thin ledge where upper meets sole
      push(loft({ zHeel: zHeel - 0.001 * H, len: len + 0.002 * H, x0, nU, nV, section: (u) => ({ w: W * 1.07 * widthProfile(u), y0: yb(u) - 0.0015 * H, y1: yb(u) + 0.002 * H, n: 5, flatBottom: true }) }), leather(main.clone().multiplyScalar(0.55), 0.3), 'welt');
    }
    // laces (or a velcro strap for kids)
    if (!low) {
      const laceMat = new THREE.MeshStandardMaterial({ name: 'laces', color: type === 'kids' ? accentC : type === 'dress' ? '#1a1a1a' : type === 'boot' ? '#8a6a3a' : '#f6f6f6', roughness: 0.7 });
      const n = type === 'boot' ? 6 : type === 'kids' ? 2 : 5;
      for (let k = 0; k < n; k++) {
        const u = (type === 'boot' ? 0.3 : 0.44) + k * (type === 'kids' ? 0.12 : 0.055);
        const ww = W * widthProfile(u) * (type === 'kids' ? 1.1 : 0.62);
        const g = type === 'kids'
          ? new THREE.BoxGeometry(ww * 2, 0.004 * H, 0.016 * H)
          : new THREE.CapsuleGeometry(0.0022 * H, ww * 1.4, 3, 6).rotateZ(Math.PI / 2);
        g.rotateX(-0.45 * smooth((u - 0.4) / 0.3)).translate(x0, top(u) + 0.0015 * H, zHeel + u * len);
        g.setAttribute('u', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count).fill(u), 1));
        push(g, laceMat, 'laces');
      }
      if (type === 'sneaker') {
        // heel pull tab
        const tab = new THREE.BoxGeometry(0.012 * H, 0.022 * H, 0.004 * H).translate(x0, collar + 0.004 * H, zHeel - 0.001 * H);
        tab.setAttribute('u', new THREE.Float32BufferAttribute(new Array(tab.attributes.position.count).fill(0), 1));
        push(tab, textile(accentC), 'heel-tab');
      }
    }
  } else if (type === 'flat' || type === 'heel') {
    // low-cut pump / ballet flat: covers the toes and sides, shows the top of the foot
    const upMat = leather(main, type === 'heel' ? 0.15 : 0.35);
    const fy = (u) => soleT + lift(u) + spring(u) * 0.5;
    push(loft({ zHeel: zHeel + 0.002 * H, len: len * 0.995, x0, nU, nV, section: (u) => {
      const footTop = u < 0.3 ? ankleTop : THREE.MathUtils.lerp(ankleTop - 0.004 * H, 0.03 * H, smooth((u - 0.3) / 0.5));
      const cover = u > 0.62 ? footTop + 0.003 * H : fy(u) + (footTop - fy(u)) * 0.45; // vamp over the toes, low sides
      return { w: W * widthProfile(u, type === 'heel') + 0.002 * H, y0: fy(u) - 0.001 * H, y1: Math.max(fy(u) + 0.006 * H, cover * (u > 0.88 ? 0.97 : 1)), n: 3, flatBottom: true };
    } }), upMat, 'shoe');
  } else if (type === 'sandal') {
    const strapMat = leather(main, 0.5);
    const fy = (u) => soleT + spring(u) * 0.5;
    for (const [u, k] of [[0.62, 1], [0.78, 0.9], [0.2, 1.05]]) {
      // straps over the foot (and one behind the ankle)
      const ww = W * 0.9 * widthProfile(u);
      const topY = u < 0.3 ? ankleTop + 0.004 * H : THREE.MathUtils.lerp(ankleTop - 0.004 * H, 0.03 * H, smooth((u - 0.3) / 0.5));
      const g = new THREE.TorusGeometry(1, 0.08, 6, low ? 10 : 20, Math.PI).scale(ww * k + 0.002 * H, topY - fy(u) + 0.003 * H, 0.05 * H);
      g.translate(x0, fy(u), zHeel + u * len);
      g.setAttribute('u', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count).fill(u), 1));
      push(g, strapMat, 'strap');
    }
  }
  return out;
}
