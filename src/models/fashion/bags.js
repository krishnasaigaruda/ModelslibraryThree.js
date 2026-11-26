// Bags: handbag, tote, backpack, clutch, duffel, messenger and crossbody. Open bags are real
// hollow shells (lining visible inside); flaps hinge open with the 'open' animation.
import { THREE, M, mesh, group, roundedBox, curveTube, cushion, paramGeo, taperTube, spow, setup, done, mainMat, fabricMat } from './common.js';
import { clip, rotateTrack, pingPong } from '../../core/animation.js';
import { brandEmblem } from '../../core/brand.js';

export const BAG_VARIANTS = {
  handbag: { fab: 'leather', c: '#7a2632', c2: '#d9b45a' },
  tote: { fab: 'canvas', c: '#d9c9a8', c2: '#6b4a32' },
  backpack: { fab: 'canvas', c: '#2f4a6b', c2: '#1b1b1d' },
  clutch: { fab: 'silk', c: '#1b1b1d', c2: '#d9b45a' },
  duffel: { fab: 'leather', c: '#6b4a32', c2: '#c9a45a' },
  messenger: { fab: 'canvas', c: '#5b6650', c2: '#6b4a32' },
  crossbody: { fab: 'leather', c: '#c9a07a', c2: '#d9b45a' },
};

/**
 * Bag body shell: rounded-rectangle section (superellipse p) from y=0 up to h, half sizes
 * a(t), b(t) (t = 0 bottom → 1 top). closedTop pinches the top to a ridge (zipped bags).
 */
function bodyGeo(a, b, h, { p = 4, closedTop = false, nu = 48, nv = 20 } = {}) {
  return paramGeo((u, v) => {
    const th = u * Math.PI * 2;
    const s = Math.sin(th), c = Math.cos(th);
    let t = v;
    let A = a(t), B = b(t), y = t * h;
    if (closedTop && v > 0.8) { const k = (v - 0.8) / 0.2; B *= Math.sqrt(Math.max(0, 1 - k * k)) * 0.98 + 0.02; y = 0.8 * h + (h * 0.2) * Math.sin(k * Math.PI / 2); A *= 1 - 0.06 * k * k; }
    return [A * spow(s, 2 / p), y, -B * spow(c, 2 / p)];
  }, nu, nv, { closedU: true });
}

const ringAt = (parent, mat, at, r = 0.012, rot = [0, 0, 0]) => mesh(new THREE.TorusGeometry(r, r * 0.22, 8, 20), mat, { parent, at, rot });

export function createBag(options = {}) {
  const { o, variant, trim, T } = setup(options, BAG_VARIANTS, 'bag');
  const root = group(`bag-${variant}`);
  const wk = T.wid * (T.loose ? 1.08 : 1);
  const hk = T.len;
  const main = mainMat(T, [2, 2]);
  const trimM = fabricMat(T.fab === 'canvas' || T.fab === 'denim' || T.fab === 'plaid' || T.fab === 'floral' || T.fab === 'polka' || T.fab === 'stripes' || T.fab === 'linen' || T.fab === 'knit' ? 'leather' : T.fab, T.fab === 'neon' ? T.c2 : trim ? T.c2 ?? '#6b4a32' : T.c2 ?? '#6b4a32', { plain: true });
  const lining = fabricMat('silk', trim === 'leather' ? '#b8202a' : '#e9dfcf', { plain: true });
  const hw = trim === 'neon' ? M.metal('#202022', 0.3) : trim === 'silk' || trim === 'velvet' || !trim ? M.metal('#d4b25e', 0.22) : M.metal('#c9ccd2', 0.25);
  const anims = [];
  const emblemOn = (parent, at, size = 0.03) => { const em = brandEmblem(size); em.position.set(...at); parent.add(em); };

  if (variant === 'tote' || variant === 'handbag' || variant === 'clutch' || variant === 'crossbody' || variant === 'messenger') {
    const dims = { tote: [0.42, 0.34, 0.15], handbag: [0.3, 0.22, 0.13], clutch: [0.27, 0.14, 0.05], crossbody: [0.21, 0.15, 0.07], messenger: [0.38, 0.29, 0.11] }[variant];
    const W = dims[0] * wk, H = dims[1] * hk, D = dims[2];
    const taper = variant === 'handbag' ? 0.8 : variant === 'tote' ? 1.1 : 1;
    const a = (t) => (W / 2) * (1 + (taper - 1) * t);
    const b = (t) => (D / 2) * (1 - 0.15 * t * (variant === 'handbag' ? 1 : 0));
    const body = group('body', { parent: root });
    mesh(bodyGeo(a, b, H, { p: variant === 'tote' ? 5 : 4 }), main, { parent: body, name: 'bag' });
    // inner lining shell + base
    const inA = (t) => a(t) - 0.004, inB = (t) => b(t) - 0.004;
    mesh(bodyGeo(inA, inB, H - 0.002, { p: variant === 'tote' ? 5 : 4 }), lining, { parent: body, name: 'lining' });
    mesh(roundedBox(W - 0.004, 0.006, D - 0.004, 0.0025), main, { parent: body, at: [0, 0.003, 0], name: 'base' });
    // rim binding
    const rim = [];
    for (let i = 0; i <= 48; i++) { const th = (i / 48) * Math.PI * 2; const p = variant === 'tote' ? 5 : 4; rim.push([a(1) * spow(Math.sin(th), 2 / p), H, -b(1) * spow(Math.cos(th), 2 / p)]); }
    curveTube(rim, 0.004, trimM, { parent: body, segments: 64, radialSegments: 6, closed: true, name: 'rim' });
    if (variant === 'tote') {
      for (const s of [-1, 1]) {
        const pts = [[-W * 0.22, H - 0.04, s * b(0.9)], [-W * 0.22, H + 0.12, s * (b(1) + 0.004)], [0, H + 0.25 * hk, s * (b(1) + 0.004)], [W * 0.22, H + 0.12, s * (b(1) + 0.004)], [W * 0.22, H - 0.04, s * b(0.9)]];
        mesh(taperTube(pts, 0.016, { flat: 0.2, side: [0, 0, 1], seg: 30, radial: 8 }), trimM, { parent: body, name: 'handle' });
      }
      // a folded scarf peeking out
      mesh(cushion(W * 0.6, 0.06, D * 0.6, { bulge: 0.2 }), fabricMat('floral', '#f3d9dc', { c2: '#c8423a', c3: '#5e9a52' }), { parent: body, at: [0.03, H - 0.01, 0], rot: [0.1, 0.2, 0.4], name: 'scarf' });
      emblemOn(body, [0, H * 0.5, b(0.5) + 0.0015], 0.05);
    } else {
      // flap hinged at the back top edge
      const flapLen = variant === 'clutch' ? H * 0.6 : variant === 'messenger' ? H * 0.95 : H * 0.55;
      const hinge = group('flap', { parent: body, at: [0, H + 0.002, -b(1)] });
      const fw = a(1) * 2 + 0.006;
      const top = mesh(roundedBox(fw, 0.004, b(1) * 2 + 0.006, 0.0018), main, { parent: hinge, at: [0, 0.002, b(1)] });
      top.name = 'flap_top';
      const fr = group('flap_front', { parent: hinge, at: [0, 0, b(1) * 2 + 0.004] });
      const shape = variant === 'clutch' ? 'v' : 'round';
      const pts = shape === 'v' ? [[-fw / 2, 0], [fw / 2, 0], [0, -flapLen]] : [[-fw / 2, 0], [fw / 2, 0], [fw / 2, -flapLen + 0.04], [fw / 2 - 0.04, -flapLen], [-fw / 2 + 0.04, -flapLen], [-fw / 2, -flapLen + 0.04]];
      const shp = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
      const fg = new THREE.ExtrudeGeometry(shp, { depth: 0.002, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 1, curveSegments: 8 });
      mesh(fg, main, { parent: fr, name: 'flap_face' });
      // flap front follows the body's taper slightly
      fr.rotation.x = Math.atan2(b(1) - b(0.4), H * 0.6) * 0.5 + (variant === 'handbag' ? Math.atan2(a(0) - a(1), H) * 0 : 0);
      const clasp = mesh(roundedBox(0.03, 0.022, 0.008, 0.004), hw, { parent: fr, at: [0, -flapLen + (shape === 'v' ? 0.03 : 0.02), 0.004], name: 'clasp' });
      void clasp;
      anims.push(hinge);
      if (variant === 'handbag') {
        const pts2 = [[-W * 0.2, H + 0.006, 0], [-W * 0.18, H + 0.09, 0], [0, H + 0.13 * hk, 0], [W * 0.18, H + 0.09, 0], [W * 0.2, H + 0.006, 0]];
        mesh(taperTube(pts2, 0.008, { flat: 0.6, up: [0, 0, 1], seg: 28, radial: 10 }), trimM, { parent: body, name: 'handle' });
        for (const s of [-1, 1]) { ringAt(body, hw, [s * W * 0.2, H + 0.012, 0], 0.01, [Math.PI / 2, 0, 0]); }
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.SphereGeometry(0.006, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), hw, { parent: body, at: [sx * W * 0.4, 0.002, sz * D * 0.35] });
      }
      if (variant === 'crossbody' || variant === 'messenger') {
        const sx = a(1) + 0.004;
        if (variant === 'crossbody') {
          // chain strap standing in an arch
          const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-sx, H - 0.02, 0), new THREE.Vector3(-sx * 1.05, H + 0.2, 0), new THREE.Vector3(0, H + 0.36 * hk, 0), new THREE.Vector3(sx * 1.05, H + 0.2, 0), new THREE.Vector3(sx, H - 0.02, 0)]);
          const n = 46;
          const linkG = new THREE.TorusGeometry(0.008, 0.0022, 6, 12);
          linkG.scale(1, 1.4, 1);
          for (let i = 0; i <= n; i++) {
            const p = curve.getPointAt(i / n);
            const tn = curve.getTangentAt(i / n);
            const l = mesh(linkG, hw, { parent: body, at: [p.x, p.y, p.z], name: 'chain' });
            l.rotation.set(0, i % 2 ? Math.PI / 2 : 0, -Math.atan2(tn.x, tn.y));
          }
        } else {
          const pts = [[-sx, H * 0.7, 0], [-sx - 0.02, H + 0.25, 0], [0, H + 0.45 * hk, 0], [sx + 0.02, H + 0.25, 0], [sx, H * 0.7, 0]];
          mesh(taperTube(pts, 0.022, { flat: 0.12, side: [0, 0, 1], seg: 40, radial: 8 }), trimM, { parent: body, name: 'strap' });
          for (const s of [-1, 1]) {
            const f0 = b(0.3) * 2 + 0.006;
            mesh(roundedBox(0.03, 0.12, 0.004, 0.0015), trimM, { parent: fr, at: [s * W * 0.25, -flapLen + 0.07, 0.003] });
            mesh(roundedBox(0.032, 0.022, 0.006, 0.002), hw, { parent: fr, at: [s * W * 0.25, -flapLen + 0.04, 0.006] });
            void f0;
          }
        }
      }
      if (variant === 'clutch') emblemOn(fr, [0, -flapLen + 0.03, 0.0085], 0.022);
    }
    return done(root, 'bag', variant, o, () => anims.length ? [clip('open', 2.4, anims.map((h) => rotateTrack(h, 'x', 2.4, (t) => -pingPong(t) * 1.9)))] : []);
  }

  if (variant === 'backpack') {
    const W = 0.3 * wk, H = 0.44 * hk, D = 0.17;
    const body = group('body', { parent: root });
    const a = (t) => (W / 2) * (1 - 0.08 * t);
    const b = (t) => (D / 2) * (1 - 0.1 * t);
    mesh(bodyGeo(a, b, H, { p: 3.2, closedTop: true }), main, { parent: body, name: 'bag' });
    mesh(roundedBox(W - 0.01, 0.01, D - 0.01, 0.004), trimM, { parent: body, at: [0, 0.005, 0], name: 'base' });
    // front pocket
    mesh(cushion(W * 0.78, H * 0.38, 0.05, { bulge: 0.15 }), main, { parent: body, at: [0, H * 0.27, b(0.27) + 0.012], name: 'pocket' });
    curveTube([[-W * 0.36, H * 0.42, b(0.42) + 0.028], [0, H * 0.45, b(0.45) + 0.034], [W * 0.36, H * 0.42, b(0.42) + 0.028]], 0.003, hw, { parent: body, segments: 16, radialSegments: 6, name: 'zip' });
    // main zip around the top
    const zz = [];
    for (let i = 0; i <= 24; i++) { const k = i / 24; const ang = Math.PI * (k - 0.5) * 0.92; zz.push([Math.sin(ang) * a(0.9) * 1.01, H * (0.62 + 0.36 * Math.cos(ang)), b(0.85) * 0.12]); }
    curveTube(zz, 0.004, trimM, { parent: body, segments: 40, radialSegments: 6, name: 'zip_main' });
    mesh(roundedBox(0.012, 0.03, 0.004, 0.0015), hw, { parent: body, at: [zz[4][0], zz[4][1] - 0.012, zz[4][2] + 0.006] });
    // grab handle + shoulder straps on the back
    mesh(taperTube([[-0.03, H - 0.006, -0.02], [0, H + 0.04, -0.022], [0.03, H - 0.006, -0.02]], 0.01, { flat: 0.4, up: [0, 0, 1], seg: 12, radial: 8 }), trimM, { parent: body, name: 'grab' });
    for (const s of [-1, 1]) {
      const bz = -b(0.5);
      mesh(taperTube([[s * 0.045, H * 0.9, bz * 0.9], [s * 0.07, H * 0.85, bz - 0.06], [s * 0.1, H * 0.45, bz - 0.07], [s * 0.11, H * 0.08, bz - 0.02], [s * 0.11, H * 0.04, bz * 0.98]], [0.03, 0.02], { flat: 0.3, side: [1, 0, 0], seg: 28, radial: 10 }), trimM, { parent: body, name: 'strap' });
      mesh(roundedBox(0.035, 0.022, 0.008, 0.003), hw, { parent: body, at: [s * 0.105, H * 0.2, bz - 0.055] });
      // side bottle pocket
      mesh(cushion(0.03, H * 0.3, D * 0.7, { bulge: 0.1 }), main, { parent: body, at: [s * (a(0.18) + 0.006), H * 0.16, 0], name: 'side_pocket' });
    }
    emblemOn(body, [0, H * 0.3, b(0.3) + 0.0375], 0.04);
    return done(root, 'bag', variant, o);
  }

  // duffel: horizontal barrel bag
  const Lb = 0.55 * wk, R = 0.14 * hk;
  const body = group('body', { parent: root });
  const g = paramGeo((u, v) => {
    const th = u * Math.PI * 2;
    const x = -Lb / 2 + v * Lb;
    const e = Math.abs(x) / (Lb / 2);
    const k = e > 0.86 ? Math.sqrt(Math.max(0, 1 - ((e - 0.86) / 0.14) ** 2)) * 0.25 + 0.75 : 1;
    const y = Math.max(-R * 0.82, Math.cos(th) * R * k);
    return [x, R * 0.82 + y, Math.sin(th) * R * 0.95 * k];
  }, 40, 24, { closedU: true });
  mesh(g, main, { parent: body, name: 'bag' });
  for (const s of [-1, 1]) {
    const end = new THREE.CylinderGeometry(R * 0.55, R * 0.55, 0.004, 40).rotateZ(Math.PI / 2);
    mesh(end, trimM, { parent: body, at: [s * (Lb / 2 - 0.004), R * 0.95, 0], name: 'end_panel' });
  }
  mesh(roundedBox(Lb * 0.9, 0.01, R * 1.2, 0.004), trimM, { parent: body, at: [0, 0.005, 0], name: 'base' });
  curveTube([[-Lb * 0.42, R * 1.82, 0], [Lb * 0.42, R * 1.82, 0]], 0.005, hw, { parent: body, segments: 4, radialSegments: 6, name: 'zip' });
  for (const s of [-1, 1]) {
    mesh(taperTube([[-Lb * 0.12, R * 1.15, s * R * 0.62], [-Lb * 0.1, R * 1.85, s * R * 0.32], [0, R * 2.1 * Math.max(1, hk * 0.9), s * R * 0.15], [Lb * 0.1, R * 1.85, s * R * 0.32], [Lb * 0.12, R * 1.15, s * R * 0.62]], 0.014, { flat: 0.4, up: [0, 0, s], seg: 30, radial: 8 }), trimM, { parent: body, name: 'handle' });
    ringAt(body, hw, [s * Lb * 0.47, R * 1.4, 0], 0.016, [0, Math.PI / 2, 0]);
  }
  // shoulder strap lying draped behind
  mesh(taperTube([[-Lb * 0.47, R * 1.4, 0], [-Lb * 0.48, R * 0.4, -R * 1.3], [0, 0.006, -R * 1.5], [Lb * 0.48, R * 0.4, -R * 1.3], [Lb * 0.47, R * 1.4, 0]], 0.02, { flat: 0.15, side: [0, 1, 0], seg: 40, radial: 8 }), trimM, { parent: body, name: 'strap' });
  emblemOn(body, [0, R * 0.9, R * 0.95 + 0.002], 0.05);
  return done(root, 'bag', variant, o);
}
