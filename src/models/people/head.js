import * as THREE from 'three';
import { smoothKeys } from '../../core/loft.js';
import { smooth01, taperTube, weld } from './skin.js';

/*
 * Anatomical head, sculpted as a signed-distance field (cranium, brow ridge,
 * cheekbones, jaw, chin, nose with nostrils, lips with philtrum, eye sockets
 * with lids) and sampled onto a sphere whose vertices are concentrated on the
 * face. Eyeballs (iris, pupil, cornea), lashes, brows and ears are separate
 * meshes set into it.
 *
 * Units: "head units", 1 = chin (menton) → crown. Built with y from the chin,
 * then shifted so the local origin is the neck joint. Face points to +Z.
 * Proportions (adult): eyes at 1/2, brow 0.6, nose base 0.3, mouth 0.2,
 * ears between brow and nose base, eyes one eye-width apart.
 *
 * Shapes are cached per face type + detail, so building people is cheap.
 */

export const HEAD_Z_OFFSET = 0.05; // face sits forward of the neck axis
const CHIN_Y = -0.1; // chin slightly below the neck joint
const CENTER = [0, 0.52, 0.02]; // ray origin for sampling the field (head is star-shaped from here)

/* ---------------- SDF helpers ---------------- */
const smin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const smax = (a, b, k) => -smin(-a, -b, k);
function sdE(px, py, pz, cx, cy, cz, rx, ry, rz) {
  const x = (px - cx) / rx;
  const y = (py - cy) / ry;
  const z = (pz - cz) / rz;
  const k0 = Math.sqrt(x * x + y * y + z * z);
  const k1 = Math.sqrt((x / rx) ** 2 + (y / ry) ** 2 + (z / rz) ** 2);
  return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}
function sdS(px, py, pz, cx, cy, cz, r) {
  return Math.hypot(px - cx, py - cy, pz - cz) - r;
}
/** Round cone (capsule with varying radius) from a to b. */
function sdC(px, py, pz, ax, ay, az, bx, by, bz, ra, rb) {
  const bax = bx - ax;
  const bay = by - ay;
  const baz = bz - az;
  const pax = px - ax;
  const pay = py - ay;
  const paz = pz - az;
  const t = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  return Math.hypot(pax - bax * t, pay - bay * t, paz - baz * t) - (ra + (rb - ra) * t);
}

/* ---------------- face types ---------------- */
// Small per-person variations (seeded): nose length/width, jaw, chin, lips, eye size.
const VARIATIONS = [
  { nose: 1, noseW: 1, jaw: 1, chin: 1, lip: 1, eye: 1, cheek: 1 },
  { nose: 1.08, noseW: 0.92, jaw: 0.94, chin: 1.08, lip: 0.9, eye: 0.97, cheek: 1.08 },
  { nose: 0.93, noseW: 1.12, jaw: 1.06, chin: 0.94, lip: 1.12, eye: 1.03, cheek: 0.95 },
  { nose: 1.02, noseW: 1.05, jaw: 1.1, chin: 1.04, lip: 1.0, eye: 0.95, cheek: 1.0 },
  { nose: 0.97, noseW: 0.96, jaw: 0.92, chin: 0.96, lip: 1.06, eye: 1.05, cheek: 1.05 },
];

/** Anatomical parameters for a face type. age: 'adult' | 'child' | 'elder' | 'teen' | 'toddler' */
export function faceParams({ female = false, age = 'adult', variation = 0 } = {}) {
  const v = VARIATIONS[((variation % VARIATIONS.length) + VARIATIONS.length) % VARIATIONS.length];
  const child = age === 'child' || age === 'toddler';
  const toddler = age === 'toddler';
  const elder = age === 'elder';
  const teen = age === 'teen';
  const F = female ? 1 : 0;
  const p = {
    female, age, child, elder,
    cw: child ? 0.365 : 0.335 - 0.005 * F, // cranium half-width
    eyeX: child ? 0.13 : 0.133 - 0.003 * F,
    eyeY: toddler ? 0.42 : child ? 0.44 : 0.5,
    eyeR: (child ? 0.056 : 0.051) * v.eye * (female ? 1.02 : 1),
    open: (female ? 0.026 : 0.023) * v.eye * (elder ? 0.86 : 1) * (child ? 1.12 : 1),
    brow: child ? 0.026 : female ? 0.03 : 0.042,
    zygX: (child ? 0.21 : female ? 0.2 : 0.205),
    cheekFill: (child ? 1.1 : female ? 1.1 : 1) * (elder ? 0.88 : 1),
    cheekK: v.cheek,
    jawW: (child ? 0.25 : female ? 0.225 : 0.25) * v.jaw,
    gonX: (child ? 0.22 : female ? 0.215 : 0.24) * v.jaw,
    gonY: child ? 0.2 : female ? 0.18 : 0.16,
    chinZ: (child ? 0.28 : female ? 0.31 : 0.33) * (0.97 + 0.03 * v.chin),
    chinW: (child ? 0.08 : female ? 0.075 : 0.095) * v.chin,
    nasY: child ? 0.49 : 0.565,
    nasZ: child ? 0.38 : 0.395,
    tipY: (child ? 0.3 : 0.355) - (v.nose - 1) * 0.06 - (elder ? 0.012 : 0),
    tipZ: (child ? 0.45 : female ? 0.475 : 0.49) + (v.nose - 1) * 0.12 + (elder ? 0.008 : 0),
    noseR: (child ? 0.036 : female ? 0.038 : 0.044) * v.noseW,
    alaX: (child ? 0.05 : female ? 0.054 : 0.062) * v.noseW,
    mouthY: toddler ? 0.16 : child ? 0.175 : 0.215,
    mouthW: (child ? 0.085 : female ? 0.1 : 0.108),
    lipZ: child ? 0.405 : 0.418,
    lipU: (female ? 0.02 : 0.015) * v.lip * (elder ? 0.78 : 1),
    lipL: (female ? 0.025 : 0.02) * v.lip * (elder ? 0.8 : 1),
    babyFat: toddler ? 1.4 : child ? 1 : teen ? 0.3 : 0,
  };
  if (toddler) {
    // toddlers: big eyes, button nose, small mouth and chin
    p.eyeR *= 1.08;
    p.open *= 1.1;
    p.noseR *= 0.8;
    p.alaX *= 0.85;
    p.tipZ -= 0.02;
    p.mouthW *= 0.85;
    p.chinW *= 0.85;
    p.chinZ -= 0.02;
  }
  return p;
}

/** The lips alone (also used to tint them). x is |x|. */
function lipSDF(P, ax, y, z) {
  const my = P.mouthY;
  z += 1.6 * ax * ax; // lips follow the curve of the teeth
  let up = sdE(ax, y, z, 0, my + 0.012, P.lipZ - 0.006, P.mouthW, 0.011 + P.lipU * 0.5, 0.028);
  up = smax(up, -sdE(ax, y, z, 0, my + 0.03, P.lipZ, 0.01, 0.007, 0.04), 0.006); // cupid's bow notch
  const lo = sdE(ax, y, z, 0, my - 0.015, P.lipZ - 0.01, P.mouthW * 0.86, 0.012 + P.lipL * 0.55, 0.028 + P.lipL * 0.25);
  return Math.min(up, lo);
}

function headField(P) {
  return (x, y, z) => {
    const ax = Math.abs(x);
    // cranium + upper face
    let d = sdE(x, y, z, 0, 0.6, -0.025, P.cw, 0.4, 0.405);
    d = smin(d, sdE(x, y, z, 0, 0.6, 0.08, P.cw * 0.9, 0.3, 0.33), 0.1);
    // temples are flatter than the cranium
    d = smax(d, ax - (P.cw + 0.005), 0.05);
    // cheekbones (zygomatic arch)
    d = smin(d, sdE(ax, y, z, P.zygX + 0.005, 0.45, 0.16, 0.105, 0.06, 0.15 * P.cheekK), P.female || P.child ? 0.1 : 0.075);
    // lower face mass, jaw line chin→gonion, chin
    d = smin(d, sdE(x, y, z, 0, 0.26, 0.14, P.jawW, 0.21, 0.265), 0.1);
    d = smin(d, sdC(ax, y, z, 0.03, 0.07, P.chinZ - 0.04, P.gonX, P.gonY, -0.04, 0.045, 0.06), P.female || P.child ? 0.1 : 0.07);
    d = smin(d, sdE(x, y, z, 0, 0.075, P.chinZ, P.chinW, 0.07, 0.072), 0.06);
    // neck root: blends the underside of the jaw into the neck (no hard crease below the ear);
    // slightly slimmer than the body's neck so it hides inside it lower down
    d = smin(d, sdC(x, y, z, 0, 0.2, -0.05, 0, -0.24, -0.06, P.cw * 0.42, P.cw * 0.4), 0.09);
    // muzzle (teeth arch under the lips)
    d = smin(d, sdE(x, y, z, 0, P.mouthY + 0.025, 0.27, 0.13, 0.115, 0.13), 0.12);
    // cheeks (buccal fat) fill the face from the cheekbone down to the jaw
    d = smin(d, sdE(ax, y, z, 0.16, P.mouthY + 0.08, 0.2, 0.125 * P.cheekFill, 0.14, 0.155), 0.12);
    // baby fat cheeks
    if (P.babyFat) d = smin(d, sdE(ax, y, z, 0.16, P.mouthY + 0.12, 0.25, 0.1 * (0.8 + 0.2 * P.babyFat), 0.1, 0.1), 0.08);
    // elder: sunken under-cheek + jowls
    if (P.elder) {
      d = smin(d, sdE(ax, y, z, 0.17, 0.13, 0.2, 0.06, 0.05, 0.06), 0.1);
    }
    // brow ridge
    d = smin(d, sdC(ax, y, z, 0, 0.6, 0.395, 0.21, 0.61, 0.305, P.brow, P.brow * 0.75), 0.045);
    // eye sockets
    d = smax(d, -sdE(ax, y, z, P.eyeX + 0.008, P.eyeY + 0.005, 0.385, 0.074, 0.056, 0.055), 0.075);
    // eyelids: a skin sphere around the eyeball with an almond opening
    const ez = 0.335;
    let lid = sdS(ax, y, z, P.eyeX, P.eyeY, ez, P.eyeR + 0.009);
    // almond: wider toward the outer corner, slight upward tilt
    const tilt = (ax - P.eyeX) * 0.12;
    lid = smax(lid, -sdE(ax, y - tilt, z, P.eyeX + 0.004, P.eyeY + 0.002, ez + P.eyeR + 0.01, 0.072, P.open, 0.06), 0.006);
    d = smin(d, lid, 0.014);
    if (P.elder) d = smin(d, sdE(ax, y, z, P.eyeX, P.eyeY - 0.055, 0.36, 0.045, 0.014, 0.018), 0.03); // eye bags
    // nose: bridge, tip, wings (alae), nostrils
    let n = sdC(x, y, z, 0, P.nasY, P.nasZ, 0, P.tipY + 0.03, P.tipZ - 0.035, 0.032, P.noseR * 0.8);
    n = smin(n, sdS(x, y, z, 0, P.tipY, P.tipZ - P.noseR, P.noseR), 0.03);
    n = smin(n, sdE(ax, y, z, P.alaX, P.tipY - 0.022, P.tipZ - 0.075, 0.034, 0.03, 0.036), 0.025);
    n = smax(n, -sdE(ax, y, z, 0.021, P.tipY - 0.05, P.tipZ - 0.058, 0.012, 0.007, 0.019), 0.007);
    d = smin(d, n, 0.045);
    // lips: upper (with cupid's bow) + fuller lower lip, crisp border; mouth line; philtrum
    const my = P.mouthY;
    d = smin(d, lipSDF(P, ax, y, z), 0.008);
    d = smax(d, -sdE(x, y, z, 0, my, P.lipZ + 0.02, P.mouthW * 1.02, 0.0028, 0.06), 0.004);
    d = smax(d, -sdE(x, y, z, 0, my + 0.065, P.lipZ + 0.018, 0.012, 0.03, 0.01), 0.012);
    // mouth corners tuck into the cheeks
    d = smax(d, -sdS(ax, y, z, P.mouthW + 0.004, my + 0.002, P.lipZ - 0.04, 0.011), 0.014);
    // mentolabial sulcus (dip between lower lip and chin)
    d = smax(d, -sdE(x, y, z, 0, my - 0.06, P.lipZ - 0.01, 0.05, 0.01, 0.025), 0.025);
    // nasolabial folds (strong on elders, subtle on adults)
    if (!P.child) {
      const k = P.elder ? 1 : 0.35;
      d = smax(d, -sdC(ax, y, z, P.alaX + 0.03, P.tipY - 0.01, P.tipZ - 0.11, P.mouthW + 0.03, my - 0.02, P.lipZ - 0.09, 0.006 * k + 0.002, 0.004 * k + 0.002), 0.01);
    }
    return d;
  };
}

/* ---------------- sampling ---------------- */
function sampleHead(P, detail) {
  const f = headField(P);
  const res = { low: [30, 22, 0.6, 0.35], mid: [80, 52, 0.7, 0.2], high: [84, 66, 0.5, 0.7] }[detail];
  const [nLon, nLat] = res;
  const pos = [];
  const [cx, cy, cz] = CENTER;
  const a = res[2]; // longitude warp: dense at the face (θ = 0)
  const b = res[3]; // latitude warp: dense around φ ≈ 0.64π (eyes → chin)
  for (let j = 0; j <= nLat; j++) {
    const t = j / nLat;
    const phi = Math.PI * (t - (b / (2 * Math.PI)) * (Math.sin(2 * Math.PI * (t - 0.64)) - Math.sin(2 * Math.PI * -0.64)));
    for (let i = 0; i <= nLon; i++) {
      const s = (i / nLon) * 2 - 1;
      const th = Math.PI * (a * s + (1 - a) * s * s * s);
      const dx = Math.sin(phi) * Math.sin(th);
      const dy = Math.cos(phi);
      const dz = Math.sin(phi) * Math.cos(th);
      // sphere-trace inward from outside (conservative steps: the ellipsoid distances are approximate)
      let r = 0.8;
      let prev = r;
      let d = f(cx + dx * r, cy + dy * r, cz + dz * r);
      let guard = 0;
      while (d > 0.0003 && r > 0 && guard++ < 400) {
        prev = r;
        r -= Math.min(0.03, Math.max(d * 0.6, 0.0005));
        d = f(cx + dx * r, cy + dy * r, cz + dz * r);
      }
      // bisect between the last outside sample and the first inside one
      let lo = Math.max(0, r);
      let hi = prev;
      for (let k = 0; k < 14; k++) {
        const mm = (lo + hi) / 2;
        if (f(cx + dx * mm, cy + dy * mm, cz + dz * mm) < 0) lo = mm;
        else hi = mm;
      }
      pos.push(cx + dx * lo, cy + dy * lo, cz + dz * lo);
    }
  }
  const idx = [];
  for (let j = 0; j < nLat; j++) {
    for (let i = 0; i < nLon; i++) {
      const p0 = j * (nLon + 1) + i;
      const p1 = p0 + 1;
      const p2 = p0 + nLon + 1;
      const p3 = p2 + 1;
      if (j > 0) idx.push(p0, p2, p1);
      if (j < nLat - 1) idx.push(p1, p2, p3);
    }
  }
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g = weld(g);
  return g;
}

/** Skin tint as vertex colours (multiplies the skin colour): warm cheeks/nose/ears, lip tint, under-eye, beard shadow. */
function paintSkin(g, P) {
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const gauss = (x, y, z, cx, cy, cz, r) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2) / (r * r));
  for (let i = 0; i < pos.count; i++) {
    const x = Math.abs(pos.getX(i));
    const y = pos.getY(i);
    const z = pos.getZ(i);
    let r = 1;
    let gg = 1;
    let bb = 1;
    const warm = 0.07 * gauss(x, y, z, P.zygX - 0.02, 0.37, 0.33, 0.09) * (P.female ? 1.2 : 1) + 0.12 * gauss(x, y, z, 0, P.tipY, P.tipZ, 0.05) + (P.child ? 0.06 * gauss(x, y, z, 0.15, 0.33, 0.33, 0.1) : 0);
    gg -= warm * 0.9;
    bb -= warm * 0.8;
    // lips
    const lipK = smooth01((0.002 - lipSDF(P, x, y, z)) / 0.003);
    r -= lipK * 0.05;
    r -= lipK * 0.04;
    gg -= lipK * (P.female ? 0.45 : 0.32);
    bb -= lipK * (P.female ? 0.36 : 0.25);
    // under-eye shadow
    const ue = gauss(x, y, z, P.eyeX, P.eyeY - 0.055, 0.36, 0.035) * (P.elder ? 0.09 : 0.035);
    r -= ue;
    gg -= ue * 1.1;
    bb -= ue * 0.6;
    // beard shadow (adult men)
    if (!P.female && !P.child) {
      const beard = smooth01((P.tipY - 0.05 - y) / 0.04) * smooth01((z + 0.05) / 0.12) * (1 - lipK) * smooth01((y - 0.02) / 0.05 + 0.5);
      r -= beard * 0.07;
      gg -= beard * 0.06;
      bb -= beard * 0.035;
    }
    // eye socket inner (behind the eyeball) dark
    const sock = smooth01((0.34 - z) / 0.02) * gauss(x, y, z, P.eyeX, P.eyeY, 0.33, 0.05) * 0.3;
    r -= sock;
    gg -= sock;
    bb -= sock;
    // subtle mottling so skin isn't a flat plastic colour
    const nz = 0.018 * (Math.sin(x * 97 + y * 53) * Math.sin(y * 71 - z * 89) + 0.5 * Math.sin(z * 131 + x * 61));
    col[i * 3] = r + nz;
    col[i * 3 + 1] = gg + nz * 0.9;
    col[i * 3 + 2] = bb + nz * 0.8;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
}

/** Front-of-face z at height y (x = 0) — for placing hats/glasses. */
function frontProfile(f) {
  const keys = [];
  for (let y = 0.02; y <= 1.0; y += 0.02) {
    let z = 0.7;
    while (z > -0.2 && f(0, y, z) > 0) z -= 0.002;
    keys.push([y, z]);
  }
  return smoothKeys(keys);
}

const cache = new Map();
function headShape(P, detail) {
  const key = JSON.stringify(P) + detail;
  let c = cache.get(key);
  if (!c) {
    const geo = sampleHead(P, detail);
    paintSkin(geo, P);
    // hair/hats are shells of a lighter, evenly sampled copy (the cranium is smooth)
    const shellGeo = detail === 'low' ? geo : sampleHead(P, 'mid');
    c = { geo, shellGeo, field: headField(P) };
    c.front = frontProfile(c.field);
    cache.set(key, c);
  }
  return c;
}

/* ---------------- shells (hair, brows, hats) ---------------- */
/** Region of the head surface pushed out along normals. mask/offset get head coords (y from chin). */
function skullShell(skull, mask, offset) {
  const pos = skull.attributes.position;
  const nrm = skull.attributes.normal;
  const idx = skull.index.array;
  const keep = new Uint8Array(pos.count);
  for (let i = 0; i < pos.count; i++) keep[i] = mask(pos.getX(i), pos.getY(i), pos.getZ(i)) ? 1 : 0;
  const map = new Int32Array(pos.count).fill(-1);
  const P = [];
  const I = [];
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t];
    const b = idx[t + 1];
    const c = idx[t + 2];
    if (!(keep[a] && keep[b] && keep[c])) continue;
    for (const k of [a, b, c]) {
      if (map[k] < 0) {
        const d = typeof offset === 'function' ? offset(pos.getX(k), pos.getY(k), pos.getZ(k)) : offset;
        P.push(pos.getX(k) + nrm.getX(k) * d, pos.getY(k) + nrm.getY(k) * d, pos.getZ(k) + nrm.getZ(k) * d);
        map[k] = P.length / 3 - 1;
      }
      I.push(map[k]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(I);
  g.computeVertexNormals();
  return g;
}

/* ---------------- eyes, ears ---------------- */
let irisTex = null;
function irisTexture() {
  if (irisTex || typeof document === 'undefined') return irisTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  // radial fibres, darker limbal ring, lighter collarette (multiplied by the iris colour)
  const grad = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.35, '#e8e8e8');
  grad.addColorStop(0.8, '#b8b8b8');
  grad.addColorStop(0.92, '#505050');
  grad.addColorStop(1, '#303030');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  g.globalAlpha = 0.25;
  for (let i = 0; i < 160; i++) {
    const a = (i / 160) * Math.PI * 2 + Math.sin(i * 7.1) * 0.03;
    g.strokeStyle = i % 2 ? '#ffffff' : '#606060';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(64 + Math.cos(a) * 14, 64 + Math.sin(a) * 14);
    g.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58);
    g.stroke();
  }
  irisTex = new THREE.CanvasTexture(c);
  irisTex.colorSpace = THREE.SRGBColorSpace;
  return irisTex;
}

function buildEye(P, eyeColor, detail) {
  const g = new THREE.Group();
  const R = P.eyeR;
  const seg = detail === 'low' ? 8 : 16;
  const sclera = new THREE.MeshPhysicalMaterial({ name: 'eye', color: '#ece6df', roughness: 0.3 });
  const irisR = R * 0.52;
  const thC = Math.asin(irisR / R);
  // sclera with a round opening at the front where the iris sits (poles along Z)
  g.add(new THREE.Mesh(new THREE.SphereGeometry(R, seg, Math.round(seg * 0.75), 0, Math.PI * 2, thC, Math.PI - thC).rotateX(Math.PI / 2), sclera));
  const irisZ = R * Math.cos(thC) - 0.002;
  const iris = new THREE.Mesh(new THREE.CircleGeometry(irisR * 1.02, seg), new THREE.MeshStandardMaterial({ name: 'iris', color: eyeColor, map: irisTexture(), roughness: 0.4 }));
  iris.position.z = irisZ;
  g.add(iris);
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(irisR * 0.42, seg), new THREE.MeshBasicMaterial({ name: 'pupil', color: '#060606' }));
  pupil.position.z = irisZ + 0.0006;
  g.add(pupil);
  const cornea = new THREE.Mesh(
    new THREE.SphereGeometry(irisR * 1.25, seg, seg / 2, 0, Math.PI * 2, 0, Math.PI * 0.32),
    new THREE.MeshPhysicalMaterial({ name: 'cornea', color: '#ffffff', transparent: true, opacity: 0.12, roughness: 0, clearcoat: 1, clearcoatRoughness: 0 }),
  );
  cornea.rotation.x = Math.PI / 2;
  cornea.position.z = R * Math.cos(thC) + 0.004 - irisR * 1.25 * Math.cos(Math.PI * 0.32);
  g.add(cornea);
  return g;
}

/** Ear: flattened ellipsoid with the concha bowl pressed in and a rolled helix rim. */
function earGeometry(P, side, detail) {
  const g = new THREE.SphereGeometry(1, detail === 'low' ? 10 : 20, detail === 'low' ? 8 : 16);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i); // thickness direction (outward)
    const y = p.getY(i);
    const z = p.getZ(i);
    const r = Math.hypot(y / 1.0, z / 0.95);
    if (x > 0) {
      // bowl: deep in the middle-lower, ridge (antihelix) ring, then rim
      const bowl = 0.9 * Math.exp(-(((y + 0.1) / 0.45) ** 2 + ((z + 0.05) / 0.4) ** 2)) - 0.25 * Math.exp(-(((r - 0.62) / 0.12) ** 2));
      x = Math.max(-0.2, x - bowl);
    }
    // narrower lobe at the bottom, wider top
    const wz = y < 0 ? 0.8 + 0.2 * (1 + y) : 1;
    p.setXYZ(i, x * 0.03, y * (P.child ? 0.125 : 0.14), z * 0.09 * wz);
  }
  g.computeVertexNormals();
  return g;
}

/* ---------------- long hair ---------------- */
/** Hanging hair: a sheet that wraps the back and sides of the head and falls to the shoulders (long) or jaw (bob). */
function drapeGrid(field, style, detail) {
  const nu = detail === 'low' ? 20 : 48;
  const nv = detail === 'low' ? 10 : 24;
  const long = style !== 'bob';
  const yEnd = style === 'bob' ? 0.1 : style === 'wavy' ? -0.35 : -0.55;
  const rHead = (th, y) => {
    const dx = Math.sin(th);
    const dz = Math.cos(th);
    let r = 0.8;
    while (r > 0.05 && field(dx * r, y, -0.02 + dz * r) > 0) r -= 0.004;
    return r;
  };
  const pts = [];
  for (let i = 0; i <= nu; i++) {
    pts.push([]);
    const u = (i / nu) * 2 - 1;
    const th = Math.PI - (Math.PI - 0.98) * u;
    const side = Math.abs(Math.sin(th));
    const y0 = Math.max(0.62, LINES.long(Math.abs(Math.atan2(Math.sin(th), Math.cos(th)))) + 0.05);
    const rTop = rHead(th, Math.max(y0, 0.35));
    const rLow = rHead(th, 0.36);
    for (let j = 0; j <= nv; j++) {
      const v = j / nv;
      const y = y0 + (yEnd - y0) * v;
      let r = (y > 0.36 ? rHead(th, y) : rLow) + 0.05 + 0.02 * v * (long ? 1 : 0.6);
      if (y0 > 0.36) r = Math.max(r, rTop * 0.6);
      r += 0.006 * Math.sin(th * 46 + v * 2.5) + (style === 'wavy' ? 0.015 * Math.sin(v * 14 + th * 3) : 0);
      if (!long) r += 0.025 * smooth01((v - 0.7) / 0.3) - 0.035 * smooth01((v - 0.92) / 0.08); // bob curls under
      else r -= 0.03 * smooth01((v - 0.9) / 0.1);
      let z = -0.02 + Math.cos(th) * r;
      // falls behind the shoulders
      if (long) z -= side * 0.12 * smooth01((-0.15 - y) / 0.35);
      pts[i].push(new THREE.Vector3(Math.sin(th) * r, y, z));
    }
  }
  const spacing = (2 * (Math.PI - 0.98) * 0.38) / nu;
  return { nu, nv, pts, spacing };
}

/* ---------------- hair clumps (cards) ---------------- */
/** A tapered ribbon along points with given outward normals; vertex colours darker at the root. */
function ribbon(points, normals, widthAt, tint) {
  const n = points.length;
  const pos = [];
  const col = [];
  const t = new THREE.Vector3();
  const side = new THREE.Vector3();
  for (let k = 0; k < n; k++) {
    const a = points[Math.max(0, k - 1)];
    const c = points[Math.min(n - 1, k + 1)];
    t.subVectors(c, a).normalize();
    side.crossVectors(t, normals[k]).normalize();
    const w = widthAt(k / (n - 1)) / 2;
    const p = points[k];
    // slightly arched across so each clump catches light like a lock of hair
    const lift = normals[k].clone().multiplyScalar(w * 0.25);
    pos.push(p.x - side.x * w, p.y - side.y * w, p.z - side.z * w, p.x + lift.x, p.y + lift.y, p.z + lift.z, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w);
    const shade = (0.72 + 0.28 * Math.min(1, (k / (n - 1)) * 2.2)) * tint;
    for (let q = 0; q < 3; q++) col.push(shade, shade, shade);
  }
  const idx = [];
  for (let k = 0; k < n - 1; k++) {
    for (let q = 0; q < 2; q++) {
      const a = k * 3 + q;
      idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
    }
  }
  return { pos, col, idx };
}

function mergeRibbons(list) {
  const pos = [];
  const col = [];
  const idx = [];
  for (const r of list) {
    const base = pos.length / 3;
    pos.push(...r.pos);
    col.push(...r.col);
    for (const i of r.idx) idx.push(i + base);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * Short-hair clumps combed away from a side parting: locks laid on the hair shell,
 * following the head surface, tapered at the tips.
 */
function shortClumps(field, lineFn, thick, { count, rand, len = 0.16, width = 0.06, partX = 0.1 }) {
  const [cx, cy, cz] = CENTER;
  const surf = (p, extra) => {
    const d = new THREE.Vector3(p.x - cx, p.y - cy, p.z - cz).normalize();
    let r = 0.8;
    while (r > 0.05 && field(cx + d.x * r, cy + d.y * r, cz + d.z * r) > 0) r -= 0.004;
    const q = new THREE.Vector3(cx + d.x * r, cy + d.y * r, cz + d.z * r);
    return { p: q.addScaledVector(d, thick(q.x, q.y, q.z) + extra), n: d };
  };
  const part = new THREE.Vector3(partX, 1.0, 0.12);
  const list = [];
  let guard = 0;
  while (list.length < count && guard++ < count * 20) {
    // random start on the upper head inside the hair region
    const th = (rand() * 2 - 1) * Math.PI;
    const ph = Math.acos(1 - rand() * 1.1);
    const p0 = new THREE.Vector3(cx + Math.sin(ph) * Math.sin(th) * 0.5, cy + Math.cos(ph) * 0.5, cz + Math.sin(ph) * Math.cos(th) * 0.5);
    let s0 = surf(p0, 0.004);
    if (s0.p.y - lineFn(Math.abs(Math.atan2(s0.p.x, s0.p.z))) < 0.06) continue;
    const pts = [s0.p];
    const nrm = [s0.n];
    let cur = s0;
    const L = len * (0.7 + rand() * 0.6);
    const steps = 5;
    for (let k = 0; k < steps; k++) {
      // comb direction: away from the parting, then downward
      const away = cur.p.clone().sub(part);
      away.y = Math.min(away.y, 0) - 0.15;
      const flow = away.addScaledVector(cur.n, -away.dot(cur.n)).normalize();
      const next = surf(cur.p.clone().addScaledVector(flow, L / steps), 0.004 + 0.002 * k);
      if (next.p.y - lineFn(Math.abs(Math.atan2(next.p.x, next.p.z))) < 0.0) break;
      pts.push(next.p);
      nrm.push(next.n);
      cur = next;
    }
    if (pts.length < 3) continue;
    const w = width * (0.75 + rand() * 0.5);
    list.push(ribbon(pts, nrm, (u) => w * (1 - 0.85 * u * u), 0.9 + rand() * 0.2));
  }
  return mergeRibbons(list);
}

/** Long hair as overlapping clumps (two layers) hanging from the head; varied lengths, tapered tips. */
function longClumps(field, style, detail, rand) {
  const grid = drapeGrid(field, style, detail);
  const { nu, nv, pts } = grid;
  const list = [];
  for (const layer of [0, 1]) {
    for (let i = layer ? 0.5 : 0; i <= nu; i += 1) {
      const i0 = Math.floor(i);
      const i1 = Math.min(nu, i0 + 1);
      const f = i - i0;
      const cut = Math.round(nv * (0.82 + rand() * 0.18));
      const P = [];
      const N = [];
      for (let j = 0; j <= cut; j++) {
        const a = pts[i0][j];
        const b = pts[i1][j];
        const p = a.clone().lerp(b, f);
        const n = new THREE.Vector3(p.x, 0, p.z + 0.02).normalize();
        p.addScaledVector(n, layer * 0.012 + (rand() - 0.5) * 0.004);
        P.push(p);
        N.push(n);
      }
      const w = grid.spacing * (layer ? 1.5 : 1.8) * (0.85 + rand() * 0.3);
      list.push(ribbon(P, N, (u) => w * (1 - 0.8 * Math.max(0, (u - 0.7) / 0.3) ** 1.5), 0.88 + rand() * 0.24));
    }
  }
  return mergeRibbons(list);
}

/* ---------------- hairlines ---------------- */
const ang = (x, z) => Math.abs(Math.atan2(x, z - 0.0)); // 0 = front, π = back
const LINES = {
  short: smoothKeys([[0, 0.86], [0.4, 0.84], [0.75, 0.76], [0.95, 0.58], [1.2, 0.52], [1.32, 0.64], [1.75, 0.63], [2.2, 0.38], [Math.PI, 0.28]]),
  long: smoothKeys([[0, 0.86], [0.4, 0.83], [0.75, 0.72], [0.95, 0.45], [1.3, 0.2], [Math.PI, 0.05]]),
  up: smoothKeys([[0, 0.86], [0.4, 0.84], [0.75, 0.75], [0.95, 0.6], [1.25, 0.6], [1.75, 0.6], [2.2, 0.36], [Math.PI, 0.3]]),
};

/**
 * Build the head group.
 * opts: { skin (material), lip, eye, hairMat, browMat, hairStyle, hat, hatMat, hatColor, glasses,
 *         female, age, variation, detail, rand, beard, accentMat }
 */
export function buildHead(opts) {
  const P = faceParams({ female: opts.female, age: opts.age ?? 'adult', variation: opts.variation ?? 0 });
  const detail = opts.detail ?? 'high';
  const shape = headShape(P, detail);
  const skull = shape.geo;
  const shellSkull = shape.shellGeo;
  const frontZ = (y) => shape.front(y);
  /** head surface |x| at height y, depth z (head coords) */
  const sideX = (y, z) => {
    let x = 0.7;
    while (x > 0 && shape.field(x, y, z) > 0) x -= 0.002;
    return x;
  };
  const root = new THREE.Group();
  // inner group in head coords (y from chin); shifted so the neck joint is the origin
  const g = new THREE.Group();
  g.position.set(0, CHIN_Y, HEAD_Z_OFFSET);
  root.add(g);
  const m = (geo, mat, at, rot, scale) => {
    const o = new THREE.Mesh(geo, mat);
    if (at) o.position.set(...at);
    if (rot) o.rotation.set(...rot);
    if (scale) o.scale.set(...scale);
    g.add(o);
    return o;
  };
  const skinMat = opts.skin.clone();
  skinMat.vertexColors = true;
  skinMat.name = 'skin';
  m(skull, skinMat).name = 'skull';

  // ---- eyes ----
  for (const s of [1, -1]) {
    const eye = buildEye(P, opts.eye ?? '#4a3426', detail);
    eye.position.set(s * P.eyeX, P.eyeY, 0.335);
    eye.rotation.y = s * 0.04; // very slight convergence looks natural
    eye.name = 'eye';
    g.add(eye);
  }
  // upper eyelids that can blink: a skin cap tucked up under the brow skin, rotated down to close
  for (const [s, nm] of [[1, 'lid_L'], [-1, 'lid_R']]) {
    const pivot = new THREE.Group();
    pivot.name = nm;
    pivot.position.set(s * P.eyeX, P.eyeY, 0.335);
    pivot.rotation.x = -2.1; // open: cap rolled up and back, hidden under the brow skin
    const cap = new THREE.Mesh(new THREE.SphereGeometry(P.eyeR + 0.004, detail === 'low' ? 10 : 18, detail === 'low' ? 5 : 8, 0, Math.PI * 2, 0, Math.PI * 0.5).rotateX(Math.PI / 2), opts.skin);
    cap.name = `${nm}_cap`;
    pivot.add(cap);
    g.add(pivot);
  }
  // upper lashes along the lid opening
  const lashMat = new THREE.MeshStandardMaterial({ name: 'lashes', color: '#141010', roughness: 0.8 });
  for (const s of detail === 'low' ? [] : [1, -1]) {
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const u = k / 8; // inner → outer corner
      const xx = P.eyeX + (u - 0.5) * 0.095;
      const lift = Math.sin(Math.PI * u) * (P.open * 1.05) + (xx - P.eyeX) * 0.12;
      const zz = 0.335 + Math.sqrt(Math.max(0, (P.eyeR + 0.008) ** 2 - (xx - P.eyeX) ** 2 - lift * lift)) + 0.001;
      pts.push([s * xx, P.eyeY + 0.003 + lift, zz]);
    }
    const t = taperTube(pts, (q) => (opts.female ? 0.0055 : 0.0038) * Math.sin(Math.PI * Math.min(1, q * 1.1 + 0.05)) + 0.001, { segments: 16, radial: 5 });
    m(t.geometry, lashMat).name = 'lashes';
  }

  // ---- ears ----
  const hideEars = opts.hideEars;
  if (!hideEars) {
    for (const s of [1, -1]) {
      const ex = s * (sideX(0.44, -0.06) + 0.012);
      const e = m(earGeometry(P, s, detail), skinMat.clone(), [ex, 0.44, -0.06], [0.0, s * 0.42, s * -0.14]);
      e.material.vertexColors = false;
      e.material.color.multiply(new THREE.Color(1, 0.93, 0.91));
      if (s < 0) e.scale.x = -1;
      e.name = 'ear';
    }
  }

  // ---- brows: a few tapered strands laid on the skin along the brow arch ----
  const browMat = opts.browMat ?? opts.hairMat;
  {
    const browY = (xa) => P.eyeY + 0.085 + 0.022 * Math.sin(Math.PI * smooth01((xa - 0.04) / 0.2)) - (xa > 0.19 ? (xa - 0.19) * 0.45 : 0);
    const surfZ = (x, y) => {
      let z = 0.6;
      while (z > 0 && shape.field(x, y, z) > 0) z -= 0.002;
      return z;
    };
    const thick = (P.female ? 0.0045 : 0.0065) * (P.child ? 0.8 : 1);
    const rows = detail === 'low' ? [0] : P.female ? [0, 1] : [-1, 0, 1];
    for (const s of [1, -1]) {
      for (const row of rows) {
        const pts = [];
        for (let k = 0; k <= 10; k++) {
          const xa = 0.045 + (k / 10) * 0.19;
          const y = browY(xa) + row * thick * 1.1 * (1 - 0.6 * k / 10);
          pts.push([s * xa, y, surfZ(xa, y) + 0.0015]);
        }
        const t = taperTube(pts, (q) => thick * (detail === 'low' ? 1.6 : 1) * (1.15 - 0.75 * q) * Math.min(1, q * 6 + 0.5), detail === 'low' ? { segments: 6, radial: 4 } : { segments: 16, radial: 6 });
        m(t.geometry, browMat).name = 'brows';
      }
    }
  }

  // ---- beard / moustache (optional) ----
  if (opts.beard) {
    const style = opts.beard; // 'full' | 'stubble' | 'moustache' | 'goatee'
    const bm = opts.hairMat;
    const lipBand = (y) => Math.abs(y - P.mouthY) - 0.03;
    const region = (x, y, z) => {
      const xa = Math.abs(x);
      if (z < -0.08) return -1;
      const stache = Math.min(0.022 - Math.abs(y - (P.mouthY + 0.038)), P.mouthW + 0.015 - xa, z - 0.3);
      if (style === 'moustache') return stache;
      const lowerLip = P.mouthY - 0.035 - y; // below the lower lip
      if (style === 'goatee') return Math.max(stache, Math.min(P.mouthW * 0.75 - xa, lowerLip, y - 0.005, z - 0.2));
      // full / stubble: jaw + chin + upper lip, below the cheek line, lips left clear
      const cheekLine = P.tipY - 0.07 + 0.25 * Math.max(0, xa - 0.12);
      return Math.min(cheekLine - y, Math.max(Math.abs(y - P.mouthY) - 0.02, xa - P.mouthW - 0.004), z + 0.06);
    };
    const thick = style === 'stubble' ? 0.0018 : style === 'full' ? 0.014 : 0.01;
    const curl = (x, y, z) => (style === 'stubble' ? 0 : 0.003 * Math.sin(x * 160 + Math.sin(y * 90) * 2) * Math.sin(y * 140));
    let beardMat = bm;
    if (style === 'stubble') {
      // short stubble reads as a tint, not a layer
      beardMat = bm.clone();
      beardMat.transparent = true;
      beardMat.opacity = 0.42;
      beardMat.depthWrite = false;
    }
    m(skullShell(skull, (x, y, z) => y < P.tipY + 0.02 && z > -0.1, (x, y, z) => -0.008 + (thick + curl(x, y, z) + 0.008) * smooth01(region(x, y, z) / (style === 'stubble' ? 0.03 : 0.022) + 0.5) * (style === 'full' ? 0.55 + 0.45 * smooth01((0.16 - y) / 0.16) : 1)), beardMat).name = 'beard';
  }

  // ---- hair ----
  const style = opts.hairStyle;
  const hm = opts.hairMat;
  // soft shell: hair region pushed out; outside it the offset sinks under the skin → clean hairline.
  // grooves: fine combed ridges so it reads as hair, not a helmet.
  const softShell = (lineFn, thick, { minY = 0.0, groove = 0.004, freq = 70 } = {}) =>
    m(skullShell(shellSkull, (x, y, z) => y > minY && y - lineFn(ang(x, z)) > -0.06, (x, y, z) => {
      const d = y - lineFn(ang(x, z));
      const comb = groove * 0.45 * Math.sin(Math.atan2(x, Math.max(0.05, y - 0.3 + 0.5 * Math.max(0, -z))) * freq + Math.sin(z * 23 + x * 9) * 1.2);
      return -0.012 + (thick(x, y, z) + comb + 0.012) * smooth01(d / 0.08 + 0.5);
    }), hm);
  const vol = (base, top) => (x, y) => base + (top - base) * smooth01((y - 0.55) / 0.4);
  const clumpMat = () => {
    const c = hm.clone();
    c.vertexColors = true;
    c.side = THREE.DoubleSide;
    c.shadowSide = THREE.BackSide;
    return c;
  };
  if (style === 'short' || style === 'buzz' || style === 'curly' || style === 'afro' || style === 'mohawk' || style === 'quiff') {
    const t = style === 'buzz' ? vol(0.007, 0.01)
      : style === 'curly' ? vol(0.03, 0.06)
        : style === 'afro' ? vol(0.09, 0.17)
          : style === 'quiff' ? (x, y, z) => vol(0.02, 0.05)(x, y) + 0.06 * smooth01((z - 0.1) / 0.25) * smooth01((y - 0.8) / 0.1)
            : style === 'mohawk' ? (x) => 0.006 + 0.09 * smooth01((0.07 - Math.abs(x)) / 0.03)
              : vol(0.016, 0.045);
    softShell(LINES.short, t, { groove: style === 'buzz' ? 0.0008 : style === 'afro' ? 0.006 : 0.003, freq: style === 'afro' ? 140 : 70 }).name = 'hair';
    if ((style === 'short' || style === 'quiff') && detail !== 'low') {
      m(shortClumps(shape.field, LINES.short, t, { count: style === 'quiff' ? 70 : 60, rand: opts.rand ?? Math.random, len: style === 'quiff' ? 0.2 : 0.15 }), clumpMat()).name = 'hair-locks';
    }
    if (style === 'curly' || style === 'afro') {
      const rand = opts.rand ?? Math.random;
      const pos = shellSkull.attributes.position;
      const nrm = shellSkull.attributes.normal;
      const curls = [];
      const step = detail === 'low' ? 9 : 3;
      for (let i = 0; i < pos.count; i += step) {
        const y = pos.getY(i);
        const x = pos.getX(i);
        const z = pos.getZ(i);
        if (y - LINES.short(ang(x, z)) > 0.04 && rand() < 0.7) curls.push(i);
      }
      // keep the curl count bounded (triangle budget), evenly thinned
      const cap = detail === 'low' ? 30 : style === 'afro' ? 110 : 90;
      while (curls.length > cap) curls.splice(Math.floor(rand() * curls.length), 1);
      const R = (style === 'afro' ? 0.06 : 0.042) * (detail === 'low' ? 1.3 : 1);
      const inst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(R, detail === 'low' ? 0 : 1), hm, curls.length);
      const mat4 = new THREE.Matrix4();
      curls.forEach((i, k) => {
        const y = pos.getY(i);
        const d = t(pos.getX(i), y, pos.getZ(i)) - R * 0.4;
        const sc = 0.75 + rand() * 0.5;
        mat4.compose(new THREE.Vector3(pos.getX(i) + nrm.getX(i) * d, y + nrm.getY(i) * d, pos.getZ(i) + nrm.getZ(i) * d), new THREE.Quaternion(), new THREE.Vector3(sc, sc, sc));
        inst.setMatrixAt(k, mat4);
      });
      inst.name = 'curls';
      g.add(inst);
    }
  } else if (style === 'long' || style === 'bob' || style === 'wavy') {
    softShell(LINES.long, vol(0.03, 0.05), { groove: 0.004, freq: 90 }).name = 'hair';
    m(longClumps(shape.field, style, detail, opts.rand ?? Math.random), clumpMat()).name = 'hair-drape';
    if (detail !== 'low') m(shortClumps(shape.field, LINES.long, vol(0.03, 0.05), { count: 40, rand: opts.rand ?? Math.random, len: 0.2, width: 0.07, partX: 0.08 }), clumpMat()).name = 'hair-locks';
  } else if (style === 'ponytail' || style === 'bun' || style === 'braid') {
    softShell(LINES.up, vol(0.014, 0.026), { groove: 0.003, freq: 90 }).name = 'hair';
    const backZ = -0.47;
    if (style === 'ponytail') {
      const tail = taperTube([[0, 0.8, backZ + 0.06], [0, 0.78, backZ - 0.1], [0, 0.55, backZ - 0.16], [0, 0.28, backZ - 0.12]], (t) => 0.07 * (1 - t * 0.6) * (0.7 + 0.3 * Math.sin(Math.PI * Math.min(1, t * 1.3 + 0.25))), { segments: detail === 'low' ? 10 : 24, radial: detail === 'low' ? 8 : 14 });
      m(tail.geometry, hm).name = 'ponytail';
      m(new THREE.TorusGeometry(0.05, 0.015, 8, 20), opts.accentMat ?? hm, [0, 0.79, backZ - 0.02], [1.2, 0, 0]).name = 'hair-tie';
    } else if (style === 'braid') {
      for (let k = 0; k < 7; k++) m(new THREE.SphereGeometry(0.05 - k * 0.004, 14, 10), hm, [0, 0.62 - k * 0.07, backZ - 0.03 + (k ? -0.04 : 0.02)], null, [1, 0.8, 0.8]).name = 'braid';
    } else {
      m(new THREE.SphereGeometry(0.12, detail === 'low' ? 12 : 24, detail === 'low' ? 8 : 16), hm, [0, 0.9, -0.33], null, [1, 0.85, 1]).name = 'bun';
    }
  } else if (style === 'balding') {
    softShell((a) => (a < 1.1 ? 2 : a < 1.4 ? 0.62 - (a - 1.1) * 0.2 : 0.3), () => 0.016, {}).name = 'hair';
  } else if (style === 'bald' || style === 'none') {
    // nothing
  }

  // ---- hats ----
  const hat = opts.hat;
  const sg = (n) => (detail === 'low' ? Math.max(6, Math.round(n / 3)) : n);
  if (hat) {
    const hatMat = opts.hatMat;
    const crown = (lineY, thick) => skullShell(shellSkull, (x, y) => y > lineY - 0.12, (x, y, z) => -0.02 + (thick + 0.02) * smooth01((y - (lineY - 0.06 * Math.cos(Math.atan2(x, z)))) / 0.03 + 0.5));
    if (hat === 'hardhat' || hat === 'firehelmet') {
      m(crown(0.68, 0.12), hatMat).name = 'hat';
      const outer = hat === 'firehelmet' ? 0.6 : 0.5;
      const brim = new THREE.LatheGeometry([new THREE.Vector2(0.37, 0.04), new THREE.Vector2(0.44, 0.0), new THREE.Vector2(outer, -0.035), new THREE.Vector2(outer + 0.01, -0.05), new THREE.Vector2(0.44, -0.02), new THREE.Vector2(0.37, 0.01)], 56);
      m(brim, hatMat, [0, 0.66, -0.03], [hat === 'firehelmet' ? -0.16 : -0.08, 0, 0], [0.92, 1, hat === 'firehelmet' ? 1.38 : 1.25]).name = 'brim';
      m(new THREE.SphereGeometry(0.06, sg(16), sg(8), 0, Math.PI * 2, 0, Math.PI / 2), hatMat, [0, 1.07, -0.03], null, [1, 0.6, 5.5]).name = 'hat-ridge';
      if (hat === 'firehelmet') m(new THREE.CylinderGeometry(0.09, 0.09, 0.02, sg(6)).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.9, roughness: 0.3 }), [0, 0.9, frontZ(0.9) + 0.12], [-0.35, 0, 0]).name = 'hat-badge';
    } else if (hat === 'policecap' || hat === 'cap' || hat === 'beanie') {
      m(crown(hat === 'beanie' ? 0.7 : 0.74, hat === 'beanie' ? 0.06 : 0.07), hatMat).name = 'hat';
      if (hat === 'beanie') {
        m(skullShell(shellSkull, (x, y) => y > 0.6 && y < 0.82, (x, y, z) => -0.02 + 0.105 * smooth01((0.05 - Math.abs(y - (0.72 - 0.06 * Math.cos(Math.atan2(x, z))))) / 0.02 + 0.5)), hatMat).name = 'hat-cuff';
      }
      if (hat === 'policecap') {
        m(new THREE.CylinderGeometry(0.47, 0.41, 0.15, sg(40)), hatMat, [0, 1.0, -0.03], [-0.08, 0, 0], [0.95, 1, 1.18]).name = 'hat-top';
        m(new THREE.CylinderGeometry(0.405, 0.405, 0.05, sg(40)), new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.4 }), [0, 0.9, -0.03], [-0.08, 0, 0], [0.95, 1, 1.18]).name = 'hat-band';
        m(new THREE.CylinderGeometry(0.04, 0.04, 0.015, sg(6)).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.9, roughness: 0.3 }), [0, 0.96, frontZ(0.9) + 0.07], [-0.15, 0, 0]).name = 'hat-badge';
      }
      if (hat !== 'beanie') {
        const visor = new THREE.CylinderGeometry(0.3, 0.3, 0.018, sg(32), 1, false, -Math.PI / 2, Math.PI);
        m(visor, new THREE.MeshPhysicalMaterial({ color: hat === 'policecap' ? '#0b0b0b' : opts.hatColor ?? '#c62828', roughness: 0.4, clearcoat: hat === 'policecap' ? 1 : 0 }), [0, 0.76, frontZ(0.78) - 0.1], [0.2, 0, 0], [0.85, 1, 0.8]).name = 'visor';
      }
    } else if (hat === 'toque') {
      const pts = [[0.37, 0], [0.38, 0.08], [0.39, 0.22], [0.45, 0.34], [0.47, 0.44], [0.43, 0.52], [0.25, 0.56], [0.0, 0.57]];
      m(new THREE.LatheGeometry(new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(sg(30)), sg(40)), hatMat, [0, 0.76, -0.03], [-0.06, 0, 0], [0.95, 1, 1.2]).name = 'hat';
      m(crown(0.74, 0.07), hatMat).name = 'hat-crown';
    } else if (hat === 'sunhat' || hat === 'fedora' || hat === 'cowboy') {
      m(crown(0.72, 0.08), hatMat).name = 'hat';
      const top = hat === 'sunhat' ? [[0.37, 0], [0.39, 0.16], [0.33, 0.24], [0, 0.26]] : [[0.37, 0], [0.38, 0.2], [0.3, 0.28], [0.12, 0.25], [0, 0.27]];
      m(new THREE.LatheGeometry(new THREE.SplineCurve(top.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(sg(16)), sg(40)), hatMat, [0, 0.76, -0.03], null, [0.95, 1, 1.18]).name = 'hat-crown';
      const W = hat === 'sunhat' ? 0.85 : hat === 'cowboy' ? 0.72 : 0.62;
      const curl = hat === 'cowboy' ? 0.1 : hat === 'sunhat' ? -0.06 : 0.02;
      const brim = new THREE.LatheGeometry([new THREE.Vector2(0.36, 0.01), new THREE.Vector2(W * 0.75, -0.005), new THREE.Vector2(W, curl), new THREE.Vector2(W + 0.01, curl - 0.015), new THREE.Vector2(W * 0.75, -0.02), new THREE.Vector2(0.36, -0.01)], 56);
      m(brim, hatMat, [0, 0.77, -0.03], [-0.04, 0, 0], [1, 1, 1.12]).name = 'brim';
    } else if (hat === 'beret') {
      m(crown(0.76, 0.03), hatMat).name = 'hat';
      m(new THREE.SphereGeometry(0.42, sg(32), sg(12), 0, Math.PI * 2, 0, Math.PI / 2), hatMat, [0.05, 0.86, -0.04], [0.05, 0, -0.22], [1.05, 0.38, 1.1]).name = 'hat-top';
    } else if (hat === 'bikehelmet') {
      const vents = (x, y, z) => 0.012 * smooth01((Math.abs(Math.sin(Math.atan2(x, z) * 4)) - 0.85) / 0.1) * smooth01((y - 0.8) / 0.05);
      m(skullShell(shellSkull, (x, y) => y > 0.52, (x, y, z) => -0.02 + (0.1 - vents(x, y, z) + 0.02) * smooth01((y - (0.68 - 0.08 * Math.cos(Math.atan2(x, z)))) / 0.03 + 0.5) + 0.04 * smooth01(-z / 0.4) * smooth01((y - 0.6) / 0.2)), hatMat).name = 'hat';
      m(taperTube([[0.3, 0.6, 0.0], [0.27, 0.36, 0.05], [0.0, 0.03, 0.32], [-0.27, 0.36, 0.05], [-0.3, 0.6, 0.0]], () => 0.008, { segments: 24, radial: 5 }).geometry, new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.6 })).name = 'hat-strap';
    } else if (hat === 'swimcap') {
      m(skullShell(shellSkull, (x, y) => y > 0.45, (x, y, z) => -0.01 + 0.03 * smooth01((y - (0.62 - 0.1 * Math.cos(Math.atan2(x, z)))) / 0.03 + 0.5)), new THREE.MeshPhysicalMaterial({ color: hatMat.color, roughness: 0.25, clearcoat: 0.8 })).name = 'hat';
    } else if (hat === 'spacehelmet') {
      const visor = new THREE.MeshPhysicalMaterial({ name: 'visor', color: '#d8a640', metalness: 0.9, roughness: 0.08, transparent: true, opacity: 0.55, envMapIntensity: 1.5 });
      m(new THREE.SphereGeometry(0.72, sg(40), sg(28)), new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, roughness: 0, clearcoat: 1, depthWrite: false }), [0, 0.5, 0.02]).name = 'helmet-glass';
      m(new THREE.SphereGeometry(0.735, sg(40), sg(20), -1.1, 2.2, 0.55, 1.15), visor, [0, 0.5, 0.02]).name = 'helmet-visor';
      m(new THREE.TorusGeometry(0.55, 0.07, sg(12), sg(40)), hatMat, [0, -0.08, 0.0], [Math.PI / 2, 0, 0]).name = 'helmet-ring';
    }
  }

  if (opts.headphones) {
    const hpMat = new THREE.MeshPhysicalMaterial({ name: 'headphones', color: '#1a1a1a', roughness: 0.4, clearcoat: 0.6 });
    const band = [];
    for (let k = 0; k <= 16; k++) {
      const a = -Math.PI / 2 + (k / 16) * Math.PI;
      band.push([Math.sin(a) * (P.cw + 0.075), 0.47 + Math.cos(a) * 0.6, -0.04]);
    }
    m(taperTube(band, () => 0.02, { segments: 24, radial: 8 }).geometry.scale(1, 1, 1.6), hpMat).name = 'headphones';
    for (const s of [1, -1]) m(new THREE.CylinderGeometry(0.1, 0.1, 0.07, sg(20)).rotateZ(Math.PI / 2), hpMat, [s * (P.cw + 0.04), 0.45, -0.04]).name = 'headphones';
  }
  if (opts.goggles) {
    const gl = new THREE.MeshPhysicalMaterial({ name: 'goggles', color: '#ff9a3a', metalness: 0.8, roughness: 0.05, transparent: true, opacity: 0.8 });
    const ez = 0.335 + P.eyeR + 0.05;
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, sg(32), 1, true, -0.95, 1.9), gl);
    lens.position.set(0, P.eyeY + 0.01, ez - 0.42);
    lens.scale.set(1.05, 1, 1);
    g.add(lens);
    lens.name = 'goggles';
    m(skullShell(shellSkull, (x, y) => Math.abs(y - (P.eyeY + 0.03)) < 0.12, (x, y, z) => -0.01 + 0.035 * smooth01((0.05 - Math.abs(y - (P.eyeY + 0.03 + 0.05 * smooth01(-z / 0.3)))) / 0.015 + 0.5)), new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.7 })).name = 'goggle-strap';
  }
  if (opts.glasses) {
    const sun = opts.glasses === 'sun';
    const frame = new THREE.MeshStandardMaterial({ name: 'glasses-frame', color: sun ? '#111' : '#2a2a2a', metalness: 0.6, roughness: 0.3 });
    const lens = new THREE.MeshPhysicalMaterial({ name: 'glasses-lens', color: sun ? '#101418' : '#cfe3ea', transparent: true, opacity: sun ? 0.85 : 0.2, roughness: 0.05, clearcoat: 1 });
    const ez = 0.335 + P.eyeR + 0.035;
    const ey = P.eyeY;
    const lr = sun ? 0.07 : 0.06;
    for (const s of [1, -1]) {
      m(new THREE.TorusGeometry(lr, 0.007, sg(8), sg(28)), frame, [s * P.eyeX, ey, ez], null, [1.08, sun ? 0.85 : 0.82, 1]).name = 'glasses';
      m(new THREE.CircleGeometry(lr, sg(24)), lens, [s * P.eyeX, ey, ez], null, [1.08, sun ? 0.85 : 0.82, 1]).name = 'glasses-lens';
      // temple arm back to just above the ear
      const armPts = [[s * (P.eyeX + lr * 1.05), ey + 0.01, ez - 0.005]];
      for (const [zz, yy] of [[ez - 0.07, ey + 0.016], [0.16, ey + 0.02], [0.04, ey + 0.016], [-0.06, ey - 0.005], [-0.1, ey - 0.05]]) armPts.push([s * (sideX(yy, zz) + 0.009), yy, zz]);
      const arm = taperTube(armPts, () => 0.0065, { segments: 20, radial: 6 });
      m(arm.geometry, frame).name = 'glasses';
    }
    m(new THREE.CylinderGeometry(0.006, 0.006, P.eyeX * 2 - lr * 2.1, sg(6)).rotateZ(Math.PI / 2), frame, [0, ey + 0.012, ez + 0.003]).name = 'glasses';
  }
  return root;
}

export { CHIN_Y };
