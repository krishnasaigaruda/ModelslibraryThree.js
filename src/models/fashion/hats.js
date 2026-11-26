// Hats resting on their brims (pass stand: true for a turned wooden hat stand): cap, beanie, fedora, sun hat, beret, cowboy,
// bucket, top hat and panama. Crowns and brims are lathed shells with deformations
// (pinches, curled brims, floppy waves).
import { THREE, M, mesh, group, lathe, curveTube, paramGeo, taperTube, setup, done, mainMat, fabricMat } from './common.js';
import { ellipseRing } from './garments.js';
import { clip, rotateTrack } from '../../core/animation.js';

export const HAT_VARIANTS = {
  cap: { fab: 'canvas', c: '#1f2d55', c2: '#f2f2f0' },
  beanie: { fab: 'knit', c: '#b8352e', c2: '#9a2a24' },
  fedora: { fab: 'wool', c: '#3a3530', c2: '#1b1b1d' },
  'sun-hat': { fab: 'straw', c: '#e3c98f', c2: '#f2ece0' },
  beret: { fab: 'wool', c: '#1b1b1d', c2: '#111111' },
  cowboy: { fab: 'suede', c: '#8a5a32', c2: '#3a2618' },
  bucket: { fab: 'canvas', c: '#c9b48a', c2: '#a8946a' },
  'top-hat': { fab: 'velvet', c: '#141416', c2: '#2a2a2e' },
  panama: { fab: 'straw', c: '#efe3c4', c2: '#1b1b1d' },
};

const HR = 0.092; // inner head radius at the hat band

/** Lathe profile shell [r, y] + per-vertex deformation fn(x, y, z) → [x, y, z]. */
function deformLathe(profile, seg, fn) {
  const g = lathe(profile, seg);
  if (fn) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const r = fn(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, r[0], r[1], r[2]); }
    g.computeVertexNormals();
  }
  return g;
}

/** Brim: annulus from r0 to r1 with height fn(r, angle). */
function brimGeo(r0, r1, hfn, { nu = 64, nv = 10, thick = 0.004 } = {}) {
  const top = paramGeo((u, v) => {
    const a = u * Math.PI * 2;
    const r = r0 + (r1 - r0) * v;
    return [Math.sin(a) * r, hfn(r, a) + thick / 2, Math.cos(a) * r];
  }, nu, nv, { closedU: true });
  return top;
}

export function createHat(options = {}) {
  const { o, variant, trim, T } = setup(options, HAT_VARIANTS, 'hat');
  const root = group(`hat-${variant}`);
  // stand: base + turned post + head dome
  const woodM = trim === 'leather' || trim === 'neon' ? M.wood('black') : trim === 'linen' || trim === 'straw' ? M.wood('maple') : M.wood('walnut');
  // optional display stand (o.stand: true); by default the hat rests on its own brim / edge
  const postTop = 0.24;
  const headY = postTop + 0.05;
  if (o.stand) {
    mesh(lathe([[0, 0], [0.1, 0], [0.104, 0.01], [0.095, 0.022], [0.04, 0.03], [0.018, 0.045], [0, 0.045]], 40), woodM, { parent: root, name: 'stand_base' });
    mesh(lathe([[0, 0.04], [0.016, 0.04], [0.012, 0.1], [0.016, 0.16], [0.011, 0.2], [0.02, postTop - 0.02], [0.02, postTop], [0, postTop]], 24), woodM, { parent: root });
    const head = new THREE.SphereGeometry(HR - 0.003, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.62);
    mesh(head, woodM, { parent: root, at: [0, headY, 0], name: 'head' });
    mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.07, 20), woodM, { parent: root, at: [0, postTop + 0.0, 0] });
  }

  const hat = group('hat', { parent: root, at: [0, headY - 0.004, 0] });
  const fab = T.fab;
  const main = mainMat(T, [4, 2]);
  const bandM = fabricMat(trim ? (T.fab === 'leather' ? 'leather' : 'silk') : 'silk', T.c2 ?? '#1b1b1d', { plain: true });
  const crownH = (k) => k * T.len;
  const brimK = (T.flare ?? 1) * (T.wid ?? 1);

  if (variant === 'cap') {
    const h = crownH(0.105);
    const prof = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16; const a = t * Math.PI / 2; prof.push([HR * Math.cos(a) * (1 + 0.04 * Math.sin(a * 2)), h * Math.sin(a)]); }
    prof[16][0] = 0.0001;
    prof.reverse();
    const crown = deformLathe(prof, 48, (x, y, z) => [x, y + (z < 0 ? 0 : 0), z * (z > 0 ? 1.06 : 1)]);
    mesh(crown, main, { parent: hat, name: 'crown' });
    // panel seams + top button
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pts = [];
      for (let k = 0; k <= 8; k++) { const t = (k / 8) * Math.PI / 2; const r = HR * Math.cos(t) + 0.0015; pts.push([Math.sin(a) * r, h * Math.sin(t) + 0.001, Math.cos(a) * r * (Math.cos(a) > 0 ? 1.06 : 1)]); }
      curveTube(pts, 0.0012, bandM, { parent: hat, segments: 12, radialSegments: 4 });
    }
    mesh(new THREE.SphereGeometry(0.008, 12, 8), main, { parent: hat, at: [0, h, 0] });
    // bill
    const bill = paramGeo((u, v) => {
      const a = -1.2 + u * 2.4;
      const r = HR * 1.06 + v * 0.075 * brimK * (1 - 0.35 * (a / 1.2) ** 2);
      const x = Math.sin(a) * r * 1.0;
      const z = Math.cos(a) * r;
      return [x, 0.004 - (x * x) * 0.9 - v * 0.012, z];
    }, 24, 8);
    mesh(bill, trim ? main : fabricMat(fab, T.c, { plain: true }), { parent: hat, name: 'bill' });
    const be = [];
    for (let i = 0; i <= 24; i++) { const a = -1.2 + (i / 24) * 2.4; const r = HR * 1.06 + 0.075 * brimK * (1 - 0.35 * (a / 1.2) ** 2); const x = Math.sin(a) * r; be.push([x, 0.004 - x * x * 0.9 - 0.012, Math.cos(a) * r]); }
    curveTube(be, 0.004, trim ? main : fabricMat(fab, T.c, { plain: true }), { parent: hat, segments: 32, radialSegments: 6, name: 'bill_edge' });
    const bt = bill.clone(); bt.translate(0, -0.004, 0);
    mesh(bt, bandM, { parent: hat, name: 'bill_under' });
    mesh(ellipseRing(HR * 1.0, HR * 1.0, 0.004, { y: 0.005 }), bandM, { parent: hat, name: 'sweatband' });
    if (T.trim) {
      const pm = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.003, 24).rotateX(Math.PI / 2), bandM, { parent: hat, at: [0, h * 0.5, HR * 0.95 + 0.004], rot: [-0.45, 0, 0], name: 'patch' });
      void pm;
    }
  } else if (variant === 'beanie') {
    const h = crownH(0.17);
    const prof = [[0.0001, h], [0.03, h - 0.003], [0.06, h - 0.016], [0.085, h - 0.045], [0.096, h - 0.09], [0.097, 0.05]];
    prof.reverse();
    mesh(lathe(prof.map(([r, y]) => [r, y]), 48), fabricMat(fab === 'canvas' ? 'knit' : fab, T.c, { c2: T.c2, c3: T.c3, repeat: [6, 2] }), { parent: hat, name: 'crown' });
    // rib cuff
    mesh(lathe([[0.1, -0.002], [0.104, 0.02], [0.103, 0.06], [0.096, 0.064], [0.093, 0.0]], 48), fabricMat(fab === 'canvas' ? 'knit' : fab, T.c, { c2: T.c2, repeat: [12, 1] }), { parent: hat, name: 'cuff' });
    if (fab === 'wool' || fab === 'knit' || fab === 'velvet' || !trim) {
      const pom = new THREE.IcosahedronGeometry(0.04, 3);
      const p = pom.attributes.position;
      for (let i = 0; i < p.count; i++) { const k = 1 + Math.sin(p.getX(i) * 230) * Math.cos(p.getY(i) * 260) * 0.08; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
      pom.computeVertexNormals();
      mesh(pom, fabricMat('velvet', trim ? T.c2 : '#f2ece0', { plain: true }), { parent: hat, at: [0, h + 0.03, 0], name: 'pompom' });
    }
  } else if (variant === 'beret') {
    const prof = [[0.0001, 0.065], [0.06, 0.064], [0.11, 0.055], [0.135 * brimK, 0.035], [0.12 * brimK, 0.018], [0.094, 0.006], [HR + 0.002, 0]];
    prof.reverse();
    const g = deformLathe(prof, 56, (x, y, z) => [x, y + x * 0.12, z]);
    mesh(g, main, { parent: hat, name: 'crown', rot: [0, 0, 0] });
    mesh(ellipseRing(HR + 0.003, HR + 0.003, 0.004, { y: 0.004 }), bandM, { parent: hat, name: 'band' });
    mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.018, 8), main, { parent: hat, at: [0, 0.07, 0], name: 'stalk' });
  } else {
    // crowned hats with brims
    const S = {
      fedora: { h: 0.115, top: 0.078, brim: 0.062, up: 0.018, pinch: 1, dent: 0.02 },
      panama: { h: 0.105, top: 0.08, brim: 0.055, up: 0.012, pinch: 0.7, dent: 0.016 },
      cowboy: { h: 0.13, top: 0.08, brim: 0.1, up: 0.07, pinch: 1.2, dent: 0.025, curl: true },
      'top-hat': { h: 0.17, top: 0.1, brim: 0.05, up: 0.018, flare: 1.08, flat: true },
      bucket: { h: 0.085, top: 0.075, brim: 0.06, up: -0.035, flat: true, slope: true },
      'sun-hat': { h: 0.095, top: 0.075, brim: 0.16, up: -0.02, wave: true, flat: true },
    }[variant];
    const h = crownH(S.h);
    let prof;
    if (S.flat) {
      const rTop = S.flare ? HR * S.flare : S.top;
      prof = [[HR + 0.002, 0], [HR * (S.flare ? 0.98 : 1.0) + 0.002, h * 0.5], [rTop, h - 0.008], [rTop - 0.006, h], [0.0001, h]];
    } else prof = [[HR + 0.002, 0], [HR - 0.002, h * 0.6], [S.top, h - 0.012], [S.top * 0.6, h - 0.002], [0.0001, h - S.dent * 0.3]];
    const crown = deformLathe(prof, 56, (x, y, z) => {
      if (S.flat) return [x, y, z];
      const t = Math.max(0, y / h);
      // front pinch + centre crease
      const pinch = 1 - S.pinch * 0.18 * t * t * Math.max(0, z / HR) ** 2;
      const xx = x * pinch;
      const crease = S.dent * Math.max(0, 1 - Math.abs(xx) / 0.035) * Math.max(0, (t - 0.75) / 0.25) * 2.4;
      return [xx, y - crease, z * (1 + 0.04 * t)];
    });
    mesh(crown, main, { parent: hat, name: 'crown' });
    if (S.flat && !S.slope) mesh(new THREE.CircleGeometry(S.flare ? HR * S.flare - 0.006 : S.top - 0.006, 40).rotateX(-Math.PI / 2), main, { parent: hat, at: [0, h, 0] });
    const r1 = HR + S.brim * brimK;
    const hfn = (r, a) => {
      const t = (r - HR) / (r1 - HR);
      if (S.curl) return S.up * t * t * Math.sin(a) ** 2 - 0.01 * t * Math.cos(a) ** 2;
      if (S.wave) return S.up * t + Math.sin(a * 6) * 0.012 * t * t - 0.02 * t * t * (T.flowing ? 1.5 : 1);
      if (S.slope) return S.up * t;
      // snap brim: up at the back, down at the front
      return S.up * t * (0.5 - 0.5 * Math.cos(a)) - 0.008 * t * (0.5 + 0.5 * Math.cos(a));
    };
    mesh(brimGeo(HR - 0.002, r1, hfn), fab === 'straw' || !trim ? main : main, { parent: hat, name: 'brim' });
    // brim edge binding
    const edge = [];
    for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; edge.push([Math.sin(a) * r1, hfn(r1, a) + 0.002, Math.cos(a) * r1]); }
    curveTube(edge, 0.003, variant === 'top-hat' || variant === 'fedora' ? bandM : main, { parent: hat, segments: 96, radialSegments: 6, closed: true, name: 'brim_edge' });
    // hat band (+ bow / concho)
    const bandH = variant === 'top-hat' ? 0.035 : 0.025;
    mesh(lathe([[HR + 0.0045, 0.002], [HR + 0.0045, bandH], [HR + 0.001, bandH + 0.001]], 56), bandM, { parent: hat, name: 'band' });
    if (variant === 'cowboy') mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 16).rotateZ(Math.PI / 2), M.metal('#c9ccd2', 0.25), { parent: hat, at: [HR + 0.007, bandH / 2, 0], name: 'concho' });
    else if (variant !== 'bucket') {
      const bow = mesh(taperTube([[-0.012, bandH / 2, 0], [0, bandH * 0.9, 0.004], [0.012, bandH / 2, 0], [0, bandH * 0.1, 0.004], [-0.012, bandH / 2, 0]], 0.004, { seg: 16, radial: 6, flat: 0.5, up: [1, 0, 0] }), bandM, { parent: hat, at: [HR + 0.005, 0, 0], rot: [0, Math.PI / 2, 0], name: 'bow' });
      void bow;
    }
    if (variant === 'sun-hat') {
      // a silk ribbon tail draping onto the brim
      curveTube([[-HR - 0.004, bandH / 2, 0.02], [-HR - 0.03, hfn(HR + 0.03, -1.4) + 0.01, 0.04], [-HR - 0.07, hfn(HR + 0.07, -1.2) + 0.006, 0.06]], 0.006, bandM, { parent: hat, segments: 12, radialSegments: 6 });
    }
    if (variant === 'bucket') for (const k of [0.3, 0.6]) {
      const rr = HR + S.brim * brimK * k;
      mesh(ellipseRing(rr, rr, 0.0012, { y: hfn(rr, 0) + 0.004 }), bandM, { parent: hat });
    }
  }
  if (!o.stand) {
    root.updateMatrixWorld(true);
    hat.position.y -= new THREE.Box3().setFromObject(hat).min.y; // sit on the table / floor
  }
  return done(root, 'hat', variant, o, () => [clip('turn', 6, [rotateTrack(hat, 'y', 6, (t) => t * Math.PI * 2, 24)])]);
}
