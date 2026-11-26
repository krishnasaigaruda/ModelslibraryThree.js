// Creature heads and trim decorations shared by the reptilian / beast builders.
import { THREE, M, group, mesh, loft, taper, eyes, spikeRow, crystalCluster, plateRow, ribs, merge, orient, keys, hornMat, membraneMat, crystalMat, darkMat, plainMat, cushion, TAU } from './common.js';

/**
 * Reptile / dragon head. Local +X = forward, origin = neck joint (back of skull).
 * Returns { head, skull, jaw, lamps }.
 */
export function reptileHead(parent, T, { at = [0, 0, 0], rot = [0, 0, 0], len = 0.9, w = 0.48, h = 0.4, mat, color, horns = T.horns ?? 2, jawOpen = 0, teeth = true, frill = T.frill, whiskers = false, beak = false, snout = 1, name = 'head', crest = 0, eyeR, closed = false } = {}) {
  const head = group(name, { parent, at, rot });
  const ch = T.chunky ?? 1;
  if (ch !== 1) { len *= 0.82; w *= ch * 0.9; h *= ch * 0.9; }
  const sn = snout;
  const skull = loft(
    [[-len * 0.05, 0, 0], [len * 0.3, h * 0.1, 0], [len * 0.7 * sn, h * 0.02, 0], [len * sn, -h * 0.06, 0]],
    (t) => [keys(t, [[0, w * 0.42], [0.25, w * 0.5], [0.55, w * 0.34], [0.85, w * 0.24], [1, w * 0.12]]), keys(t, [[0, h * 0.42], [0.25, h * 0.5], [0.6, h * 0.3], [0.9, h * 0.2], [1, h * 0.1]])],
    mat, { seg: 26, rad: 18, color, parent: head, name: `${name}_skull`, capStart: 0.7, capEnd: 0.7 },
  );
  const jaw = group(`${name}_jaw`, { parent: head, at: [len * 0.08, -h * 0.16, 0], rot: [0, 0, -jawOpen] });
  const jl = loft(
    [[-len * 0.02, 0, 0], [len * 0.4 * sn, -h * 0.1, 0], [len * 0.82 * sn, -h * 0.08, 0]],
    (t) => [keys(t, [[0, w * 0.36], [0.5, w * 0.27], [1, w * 0.13]]), keys(t, [[0, h * 0.26], [0.5, h * 0.16], [1, h * 0.08]])],
    mat, { seg: 18, rad: 14, color, parent: jaw, name: `${name}_jawbone`, capEnd: 0.6 },
  );
  if (jawOpen > 0.05) {
    // mouth interior
    mesh(new THREE.SphereGeometry(1, 14, 10).scale(len * 0.38 * sn, h * 0.12, w * 0.26), plainMat('#5a1a1c', 0.6), { parent: head, at: [len * 0.45 * sn, -h * 0.22, 0], rot: [0, 0, -jawOpen * 0.5], name: `${name}_mouth` });
  }
  const tm = hornMat(T, T.undead ? '#e6dcc0' : '#f1ead6');
  if (teeth && !T.baby) {
    const geos = [];
    for (let i = 0; i < 7; i++) {
      const t = 0.5 + i * 0.065;
      for (const sg of [1, -1]) {
        const s = skull.userData.surf(t, sg * 2.2);
        const th = h * (i === 1 ? 0.2 : 0.11);
        geos.push(orient(new THREE.ConeGeometry(h * 0.03, th, 6).translate(0, th / 2, 0), s.p.clone().add(new THREE.Vector3(0, th * 0.25, 0)), [0, -1, sg * 0.1]));
      }
    }
    mesh(merge(geos), tm, { parent: head, name: `${name}_teeth` });
  }
  // nostrils
  for (const sg of [1, -1]) {
    const s = skull.userData.surf(0.94, sg * 0.75);
    mesh(new THREE.SphereGeometry(h * 0.04, 8, 6), darkMat('#140c0a'), { parent: head, at: s.p.toArray(), name: `${name}_nostril` });
  }
  // brow ridges
  const browM = mat;
  for (const sg of [1, -1]) {
    const s = skull.userData.surf(0.3, sg * 0.7);
    const g = new THREE.SphereGeometry(1, 12, 8).scale(len * 0.13, h * 0.07, w * 0.09);
    orient(g, s.p.clone().addScaledVector(s.n, -h * 0.02), [0, 1, 0]);
    mesh(g, browM, { parent: head, name: `${name}_brow` });
  }
  const er = eyeR ?? w * 0.085 * (T.baby ? 1.6 : 1);
  const lamps = eyes(skull, T, { t: 0.36, a: 1.0, r: er, parent: head });
  if (closed) for (const m of lamps.meshes) m.scale.set(1, 0.25, 1);
  // horns
  const hm = hornMat(T);
  const hornPair = (t, a, lenH, r0, curve, up) => {
    for (const sg of [1, -1]) {
      const s = skull.userData.surf(t, sg * a);
      const b = s.p.clone().addScaledVector(s.n, -r0 * 0.6);
      let pts;
      if (T.ram) {
        pts = [];
        for (let k = 0; k <= 8; k++) {
          const f = k / 8;
          const ang = f * Math.PI * 1.5;
          const rr = lenH * 0.38 * (1 - f * 0.35);
          pts.push([b.x - Math.sin(ang) * rr, b.y + (1 - Math.cos(ang)) * rr * 0.9 - f * lenH * 0.15, b.z + sg * (f * lenH * 0.35)]);
        }
      } else {
        pts = [b.toArray(), [b.x - lenH * 0.35, b.y + lenH * up * 0.5, b.z + sg * lenH * 0.15], [b.x - lenH * 0.85, b.y + lenH * up * (0.7 + curve), b.z + sg * lenH * 0.22]];
      }
      taper(pts, r0, r0 * 0.08, hm, { parent: head, name: `${name}_horn`, pow: 0.9 });
      if (T.antler) {
        const mid = new THREE.Vector3(...pts[1]);
        taper([mid.toArray(), [mid.x + lenH * 0.1, mid.y + lenH * 0.35, mid.z + sg * lenH * 0.08], [mid.x + lenH * 0.02, mid.y + lenH * 0.55, mid.z + sg * lenH * 0.12]], r0 * 0.5, r0 * 0.06, hm, { parent: head, name: `${name}_tine` });
      }
    }
  };
  if (horns > 0) {
    const hl = len * (T.baby ? 0.22 : 0.7);
    hornPair(0.12, 0.62, hl, w * 0.1 * (T.baby ? 1.3 : 1), 0.25, 0.55);
    if (horns >= 4) hornPair(0.22, 1.25, hl * 0.6, w * 0.07, 0.05, 0.15);
    if (horns >= 3) taper([skull.userData.surf(0.82, 0).p.toArray(), skull.userData.surf(0.82, 0).p.clone().add(new THREE.Vector3(len * 0.05, h * 0.25, 0)).toArray()], w * 0.07, w * 0.01, hm, { parent: head, name: `${name}_nosehorn` });
  }
  if (crest) spikeRow(skull, { from: 0.0, to: 0.45, n: 4, h: h * crest, T, lean: 0.9, name: `${name}_crest` });
  // frill: flared collar behind the skull
  if (frill) {
    const g = new THREE.CylinderGeometry(w * 1.25, w * 0.4, len * 0.35, 24, 1, true, Math.PI * 0.15, Math.PI * 1.7);
    // scallop rim
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0) { const a = Math.atan2(pos.getX(i), pos.getZ(i)); const k = 1 - 0.12 * Math.abs(Math.sin(a * 5)); pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
    }
    g.computeVertexNormals();
    g.rotateZ(Math.PI / 2).rotateX(Math.PI);
    mesh(g, membraneMat(T, T.spot ?? T.w), { parent: head, at: [-len * 0.02, h * 0.05, 0], name: `${name}_frill` });
  }
  if (whiskers) {
    const wm = hornMat(T, T.b);
    for (const sg of [1, -1]) {
      const s = skull.userData.surf(0.9, sg * 1.3);
      const b = s.p;
      taper([b.toArray(), [b.x + len * 0.2, b.y - h * 0.1, b.z + sg * w * 0.5], [b.x + len * 0.1, b.y - h * 0.5, b.z + sg * w * 1.0], [b.x - len * 0.2, b.y - h * 0.8, b.z + sg * w * 1.1]], h * 0.03, h * 0.008, wm, { parent: head, name: `${name}_whisker`, seg: 18, rad: 6 });
    }
    // beard tuft
    taper([jl.userData.surf(0.5, Math.PI).p.toArray(), [len * 0.3, -h * 0.8, 0], [len * 0.25, -h * 1.1, 0]], h * 0.1, h * 0.02, wm, { parent: jaw, name: `${name}_beard` });
  }
  if (beak) {
    // horny beak tip over the snout (wyvern / griffin-like)
    const s = skull.userData.surf(0.85, 0);
    taper([s.p.clone().add(new THREE.Vector3(-len * 0.1, -h * 0.02, 0)).toArray(), [len * sn * 1.02, -h * 0.02, 0], [len * sn * 1.08, -h * 0.2, 0]], h * 0.15, h * 0.02, hm, { parent: head, name: `${name}_beak` });
  }
  if (T.helm) {
    const s = skull.userData.surf(0.32, 0);
    const g = cushion(len * 0.55, h * 0.12, w * 0.85, { radius: h * 0.05, bulge: 0.9 });
    orient(g, s.p.clone().addScaledVector(s.n, h * 0.0), [0, 1, 0]);
    mesh(g, M.metal('#9aa0a6', 0.3), { parent: head, name: `${name}_helm` });
    const s2 = skull.userData.surf(0.7, 0);
    mesh(orient(cushion(len * 0.35, h * 0.08, w * 0.45, { radius: h * 0.035, bulge: 0.9 }), s2.p.clone().addScaledVector(s2.n, -h * 0.01), s2.n), M.metal('#9aa0a6', 0.3), { parent: head, name: `${name}_noseguard` });
  }
  if (T.crystals) {
    const s = skull.userData.surf(0.2, 0);
    crystalCluster(s.p, [-(0.4), 1, 0], h * 0.55, crystalMat(T.glow, T.crystals === 'ice' ? 0.2 : 0.55), T.r, { parent: head, count: 4, name: `${name}_crystals` });
  }
  return { head, skull, jaw, jawbone: jl, lamps, len: len * sn, w, h };
}

/**
 * Decorate a lofted torso / neck / tail with the trim's parts: spike row, plates, ribs,
 * crystal clusters, moss tufts, leaves. o.from/o.to limit the range along the loft.
 */
export function decorate(lm, T, { from = 0.05, to = 0.95, n = 8, h = 0.2, plates = T.plates, rib = T.ribs, crystals = T.crystals, side = 0, lean = 0.45, pw, ribArgs, crystalT = [0.35, 0.7], name = 'deco' } = {}) {
  const parent = lm.parent;
  const hv = typeof h === 'function' ? h(0.5) : h;
  const sty = T.spikes;
  if (sty && sty !== 'none') spikeRow(lm, { from, to, n, h, T, lean, side, name: `${name}_spikes` });
  if (plates) plateRow(lm, { from, to, n: Math.max(3, Math.round(n * 0.7)), w: pw ?? ((t) => lm.userData.surf(t, 0).r[0] * 1.3), l: (to - from) * 0.9 / Math.max(3, Math.round(n * 0.7)) * 3.2, th: hv * 0.18, side: 0.75, mat: M.metal('#8d939a', 0.35), name: `${name}_plates` });
  if (rib) ribs(lm, { from: 0.3, to: 0.72, n: 6, r: (typeof h === 'function' ? h(0.5) : h) * 0.12, mat: hornMat(T, '#e3d8bb'), name: `${name}_ribs`, ...ribArgs });
  if (crystals) {
    for (const t of crystalT) for (const sg of [1, -1]) {
      const s = lm.userData.surf(t, sg * 0.5);
      crystalCluster(s.p, s.n, (typeof h === 'function' ? h(t) : h) * 1.2, crystalMat(T.glow, crystals === 'ice' ? 0.15 : 0.55), T.r, { parent, count: 4, name: `${name}_crystals` });
    }
  }
  return lm;
}
export { TAU, plainMat };
