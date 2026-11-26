// Tree folk (walking tree spirits): bark trunk body, root feet, branch arms, a knot face and a canopy.
import { THREE, M, group, mesh, loft, taper, glowMat, crystalMat, plainMat, darkMat, keys, setup, done, animKit, swing, breathe, merge, crystalCluster, noise3, TAU, lampTracks, rotateTrack, zigzag } from './common.js';
import { lampGroup } from '../../core/lamps.js';

const TREE_TRIMS = {
  autumn: { leaf: '#d8742a', leaf2: '#b8401a', bark: '#5a3e2a' },
  winter: { leaf: '#f2f6f8', leaf2: '#d8e4ea', bark: '#4a3a30', snow: true },
  spring: { leaf: '#9ad84a', leaf2: '#ffc0d8', bark: '#6a4a32', flowers: '#ffd0e0' },
  burning: { leaf: '#ff7a1a', leaf2: '#ffcf40', bark: '#2a1a14', fire: true, eye: '#ffcf40' },
  frozen: { leaf: '#bfefff', leaf2: '#e8f8ff', bark: '#8ab0c8', ice: true, eye: '#7ae0ff' },
  blighted: { leaf: '#6a7a2a', leaf2: '#7a2a9a', bark: '#3a3428', blight: true, eye: '#9cff2e' },
  petrified: { leaf: null, bark: '#8a857a', stone: true, eye: '#ffcf6a' },
  gilded: { leaf: '#e8c050', leaf2: '#fff0a0', bark: '#a87a2a', gold: true, eye: '#ff3a3a' },
  haunted: { leaf: null, bark: '#2a2630', eye: '#5cff9a', dead: true, lantern: true },
  crystal: { leaf: '#b08aff', leaf2: '#e0c8ff', bark: '#4a3a6a', crystal: true, eye: '#e0b0ff' },
  sapling: { leaf: '#7ad040', leaf2: '#a8e060', bark: '#8a6a4a', scale: 0.4, baby: true },
  mossy: { leaf: '#3a6a2a', leaf2: '#5a8a3a', bark: '#4a4a2a', moss: true, eye: '#ffe25a' },
};
export const TREE_VARIANTS = {
  oak: { leaf: '#4a7a2a', leaf2: '#3a6a22', bark: '#5a4030', eye: '#ffd060', shape: 'oak' },
  pine: { leaf: '#2a5a3a', leaf2: '#1f4a30', bark: '#4a3424', eye: '#a8ff6a', shape: 'pine' },
  willow: { leaf: '#7aa848', leaf2: '#6a9a3a', bark: '#6a5a44', eye: '#e0ff9a', shape: 'willow' },
  birch: { leaf: '#9ac850', leaf2: '#c8d860', bark: '#ece8e0', eye: '#7ad8ff', shape: 'birch' },
  stump: { leaf: '#5a8a2a', leaf2: '#4a7a22', bark: '#6a4a32', eye: '#ffb040', shape: 'stump' },
  blossom: { leaf: '#ffc0d8', leaf2: '#ffe0ea', bark: '#4a3030', eye: '#ff8ac0', shape: 'blossom' },
};

export function createTreefolk(options = {}) {
  const { o, variant, T, r } = setup(options, TREE_VARIANTS, 'treefolk', TREE_TRIMS);
  if (T.trim && TREE_TRIMS[T.trim].leaf === null) T.leaf = null;
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const shape = T.shape;
  const barkM = new THREE.MeshStandardMaterial({ name: 'bark', vertexColors: true, color: 0xffffff, roughness: T.stone ? 1 : 0.95, metalness: T.gold ? 0.8 : 0, flatShading: !!T.stone });
  barkM.userData.tint = T.bark;
  const bc = new THREE.Color(T.bark), cc = new THREE.Color();
  const birch = shape === 'birch' && !T.trim;
  const col = (u, a, p) => { cc.copy(bc); const n = noise3(p.x * 3, p.y * 14, p.z * 3); cc.multiplyScalar(0.7 + 0.5 * n); if (birch && noise3(p.x * 6 + 4, p.y * 9, p.z * 6) > 0.62) cc.set('#2a2622'); if (T.moss && Math.cos(a) > 0.2 && noise3(p.x * 4, p.y * 4, p.z * 4) > 0.5) cc.set('#4f6a2a'); if (T.snow && p.y > 0 && noise3(p.x * 5, p.y * 5, p.z * 5) > 0.6) cc.set('#f2f6f8'); return cc; };
  const H = shape === 'stump' ? 0.9 : shape === 'pine' ? 2.6 : 2.3;
  const R = shape === 'stump' ? 0.42 : shape === 'birch' ? 0.22 : 0.32;
  const body = group('body', { parent: rig, at: [0, 0.35, 0] });
  // trunk: lofted, ridged bark (bump with vertical stretch)
  const trunk = loft([[0, 0, 0], [0.04, H * 0.35, 0], [-0.03, H * 0.7, 0], [0, H, 0]], (t) => keys(t, [[0, R * 1.15], [0.2, R], [0.8, R * 0.85], [1, R * (shape === 'stump' ? 0.95 : 0.6)]]), barkM, { seg: 26, rad: 22, color: col, bump: 0.12, bumpFreq: 9, up: [1, 0, 0], parent: body, name: 'chest', capStart: 0.4, capEnd: shape === 'stump' ? 0.15 : 0.5 });
  // face: knot eye sockets with glowing eyes, mouth hollow, brow ridge
  const fy = H * (shape === 'stump' ? 0.6 : 0.6);
  const lg = lampGroup('eyes', 'white', { lens: new THREE.MeshPhysicalMaterial({ name: 'eye_glow', color: T.eye, emissive: T.eye, emissiveIntensity: 0.5, roughness: 0.3, toneMapped: false }) });
  lg.glow.color.set(T.eye);
  for (const sg of [1, -1]) {
    const s = trunk.userData.surf(fy / H, sg * 0.42);
    mesh(new THREE.SphereGeometry(R * 0.2, 12, 10).scale(0.6, 0.8, 1), darkMat('#1a120c'), { parent: body, at: s.p.clone().addScaledVector(s.n, -R * 0.06).toArray(), name: 'socket' });
    lg.add(body, { geometry: new THREE.SphereGeometry(R * 0.09, 10, 8).translate(...s.p.clone().addScaledVector(s.n, R * 0.02).toArray()), normal: s.n.toArray(), depth: 0.02, glowSize: R * 0.9 });
    const b = trunk.userData.surf(fy / H + 0.07, sg * 0.42);
    mesh(new THREE.SphereGeometry(1, 10, 6).scale(R * 0.12, R * 0.07, R * 0.26).rotateY(sg * 0.4), barkM, { parent: body, at: b.p.toArray(), name: 'brow' });
  }
  const ms = trunk.userData.surf(fy / H - 0.14, 0);
  mesh(new THREE.SphereGeometry(1, 14, 8).scale(R * 0.1, R * 0.13, R * 0.38), darkMat('#140c08'), { parent: body, at: ms.p.toArray(), name: 'mouth' });
  const ns = trunk.userData.surf(fy / H - 0.05, 0);
  taper([ns.p.clone().addScaledVector(ns.n, -R * 0.08).toArray(), ns.p.clone().addScaledVector(ns.n, R * 0.2).toArray()], R * 0.09, R * 0.04, barkM, { parent: body, name: 'nose', color: col });
  // root feet: tapered roots splaying to the ground (body base at y=0.35)
  const roots = [];
  const nr = 5;
  for (let i = 0; i < nr; i++) {
    const a = (i / nr) * TAU + 0.3;
    const rp = group(`root_${i}`, { parent: rig, at: [0, 0.35, 0], rot: [0, -a, 0] });
    taper([[R * 0.3, 0.3, 0], [R * 1.1, 0.0, 0.03], [R * 1.9, -0.28, 0.05], [R * 2.6, -0.33, 0.1]], R * 0.42, R * 0.08, barkM, { parent: rp, name: `root_${i}_limb`, color: col, seg: 12 });
    roots.push(rp);
  }
  // branch arms
  const arms = [];
  if (shape !== 'stump' || true) {
    for (const sg of [1, -1]) {
      const ay = H * (shape === 'stump' ? 0.45 : 0.68);
      const arm = group(sg > 0 ? 'arm_L' : 'arm_R', { parent: body, at: [0, ay, sg * R * 0.6] });
      const len = shape === 'stump' ? 0.5 : 1.0;
      const pts = [[0, 0, -sg * R * 0.4], [0.1, -0.05, sg * len * 0.35], [0.25, -len * 0.4, sg * len * 0.6], [0.4, -len * 0.7, sg * len * 0.65]];
      taper(pts, R * 0.4, R * 0.12, barkM, { parent: arm, name: 'armlimb', color: col });
      // twig fingers
      const hp = new THREE.Vector3(...pts[3]);
      const fg = [];
      for (let k = 0; k < 3; k++) { const d = new THREE.Vector3(0.1 + k * 0.05, -0.15, sg * (0.05 - k * 0.07)); fg.push(taper([hp.toArray(), hp.clone().addScaledVector(d, 0.6).toArray(), hp.clone().add(d).toArray()], R * 0.12, R * 0.03, barkM, { seg: 6, rad: 6, color: col }).geometry); }
      mesh(merge(fg), barkM, { parent: arm, name: 'twigs' });
      // side branch with leaves
      if (T.leaf && shape !== 'stump') { const sp = new THREE.Vector3(...pts[1]); const g = new THREE.IcosahedronGeometry(0.18, 1); mesh(g, M.foliage(T.leaf2), { parent: arm, at: [sp.x + 0.05, sp.y + 0.12, sp.z], name: 'arm_leaves' }); }
      arms.push(arm);
    }
  }
  // canopy
  const crown = group('crown', { parent: body, at: [0, H, 0] });
  const lm1 = T.fire ? glowMat(T.leaf, 0.9) : T.crystal || T.ice ? crystalMat(T.leaf, T.crystal ? 0.4 : 0.15) : T.gold ? M.metal(T.leaf, 0.25) : M.foliage(T.leaf ?? '#000');
  const lm2 = T.fire ? glowMat(T.leaf2, 1.4) : T.crystal || T.ice ? crystalMat(T.leaf2, 0.3) : T.gold ? M.metal(T.leaf2, 0.2) : M.foliage(T.leaf2 ?? '#000');
  const blob3 = (geos, c, rr, seed) => { const g = new THREE.IcosahedronGeometry(rr, 2); const p = g.attributes.position; const v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + (noise3(v.x * 3 + seed, v.y * 3, v.z * 3) - 0.5) * 0.45); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); g.translate(...c); geos.push(g); };
  if (T.leaf) {
    const a = [], b = [];
    if (shape === 'pine') {
      for (let i = 0; i < 4; i++) { const g = new THREE.ConeGeometry(0.85 - i * 0.18, 0.75, 14, 2); const p = g.attributes.position; for (let k = 0; k < p.count; k++) if (p.getY(k) < 0) { const ang = Math.atan2(p.getZ(k), p.getX(k)); p.setY(k, p.getY(k) - 0.08 * Math.abs(Math.sin(ang * 4))); } g.computeVertexNormals(); g.translate(0, -0.25 + i * 0.42, 0); (i % 2 ? b : a).push(g); }
    } else if (shape === 'willow') {
      blob3(a, [0, 0.25, 0], 0.65, 1);
      for (let i = 0; i < 16; i++) { const an = (i / 16) * TAU; const rr = 0.55 + 0.1 * Math.sin(i * 3); b.push(taper([[Math.cos(an) * rr * 0.8, 0.3, Math.sin(an) * rr * 0.8], [Math.cos(an) * rr * 1.1, 0.0, Math.sin(an) * rr * 1.1], [Math.cos(an) * rr * 1.15, -0.7 - 0.2 * Math.sin(i), Math.sin(an) * rr * 1.15]], 0.07, 0.03, lm2, { seg: 8, rad: 6 }).geometry); }
    } else if (shape === 'stump') {
      // a little sprig of leaves and a mushroom on top
      blob3(a, [0.05, 0.15, 0.05], 0.18, 2);
      blob3(b, [-0.12, 0.08, -0.1], 0.12, 3);
    } else {
      const big = shape === 'birch' ? 0.75 : 1;
      blob3(a, [0, 0.35 * big, 0], 0.75 * big, 1);
      blob3(b, [0.45 * big, 0.15 * big, 0.35 * big], 0.5 * big, 2);
      blob3(b, [-0.4 * big, 0.2 * big, -0.4 * big], 0.52 * big, 3);
      blob3(a, [-0.3 * big, 0.55 * big, 0.4 * big], 0.45 * big, 4);
      blob3(b, [0.25 * big, 0.65 * big, -0.3 * big], 0.42 * big, 5);
    }
    mesh(merge(a), lm1, { parent: crown, name: 'canopy' });
    mesh(merge(b), lm2, { parent: crown, name: 'canopy2' });
    if ((T.flowers && shape !== 'stump') || shape === 'blossom') { const g = []; for (let i = 0; i < 26; i++) { const v = new THREE.Vector3(r() - 0.5, r() * 0.8, r() - 0.5).normalize().multiplyScalar(0.72); g.push(new THREE.SphereGeometry(0.045, 6, 4).translate(v.x, v.y + 0.35, v.z)); } mesh(merge(g), plainMat(T.flowers ?? '#ffffff', 0.6), { parent: crown, name: 'flowers' }); }
    if (T.fire && shape !== 'stump') { const g = []; for (let i = 0; i < 10; i++) { const v = new THREE.Vector3(r() - 0.5, r() * 0.6 + 0.3, r() - 0.5).normalize().multiplyScalar(0.8); g.push(new THREE.ConeGeometry(0.1, 0.4, 8).translate(v.x, v.y + 0.45, v.z)); } mesh(merge(g), glowMat('#ffd040', 1.8, 0.9), { parent: crown, name: 'flames' }); }
  }
  // stump top rings, dead branches for leafless trims
  const geos = [];
  if (!T.leaf || shape === 'stump') {
    const n = shape === 'stump' ? 3 : 6;
    for (let i = 0; i < n; i++) { const an = (i / n) * TAU + 0.4; const L = shape === 'stump' ? 0.35 : 0.9; geos.push(taper([[0, -0.05, 0], [Math.cos(an) * L * 0.3, L * 0.45, Math.sin(an) * L * 0.3], [Math.cos(an) * L * 0.7, L * 0.7, Math.sin(an) * L * 0.7], [Math.cos(an) * L, L * 0.75 + 0.15 * Math.sin(i * 2), Math.sin(an) * L]], R * 0.32, R * 0.05, barkM, { seg: 10, rad: 7, color: col }).geometry); }
    mesh(merge(geos), barkM, { parent: crown, name: 'branches' });
  }
  // trim extras
  if (T.lantern && shape !== 'stump') { const lan = lampGroup('lantern', 'green'); lan.add(arms[0], { geometry: new THREE.SphereGeometry(0.08, 12, 10).translate(0.42, -0.82, 0.68), normal: [1, 0, 0], depth: 0.04, glowSize: 0.6 }); taper([[0.42, -0.72, 0.68], [0.41, -0.6, 0.66]], 0.008, 0.008, darkMat(), { parent: arms[0], name: 'lantern_chain' }); }
  if (T.crystal) for (const sg of [1, -1]) { const s = trunk.userData.surf(0.3, sg * 1.8); crystalCluster(s.p, s.n, 0.3, crystalMat('#c08cff', 0.6), r, { parent: body, count: 5 }); }
  if (T.ice) for (const sg of [1, -1]) { const s = trunk.userData.surf(0.45, sg * 2.0); crystalCluster(s.p, s.n, 0.25, crystalMat('#dff6ff', 0.15), r, { parent: body, count: 4 }); }
  if (T.blight) { const g = []; for (let i = 0; i < 9; i++) { const s = trunk.userData.surf(0.15 + r() * 0.7, (r() - 0.5) * TAU); g.push(new THREE.SphereGeometry(0.04 + r() * 0.04, 8, 6).translate(...s.p.toArray())); } mesh(merge(g), glowMat('#9cff2e', 0.9), { parent: body, name: 'blight' }); }
  if (T.fire) zigzag(trunk.userData.surf(0.85, 2.5).p, trunk.userData.surf(0.1, 2.8).p, 0.03, glowMat('#ff6a10', 1.8), r, { parent: body, name: 'ember_cracks' });
  if (T.dead) { const g = []; for (let i = 0; i < 6; i++) { const s = trunk.userData.surf(0.2 + r() * 0.6, (r() - 0.5) * TAU); g.push(new THREE.SphereGeometry(0.05, 6, 4).scale(1, 0.3, 1).translate(...s.p.toArray())); } mesh(merge(g), plainMat('#5a5a4a', 0.9), { parent: body, name: 'fungus' }); }
  if (T.snow && T.leaf && (shape === 'oak' || shape === 'blossom')) { const g = []; for (let i = 0; i < 6; i++) { const v = new THREE.Vector3(r() - 0.5, 1, r() - 0.5).normalize().multiplyScalar(0.7); g.push(new THREE.SphereGeometry(0.22, 8, 6).scale(1, 0.35, 1).translate(v.x, v.y + 0.38, v.z)); } mesh(merge(g), plainMat('#ffffff', 0.7), { parent: crown, name: 'snowcap' }); }
  if (T.scale !== 1) rig.scale.setScalar(T.scale);
  A.add('idle', 5, breathe(trunk, 5, 0.015), swing(crown, 'x', 5, 0.03), swing(crown, 'z', 5, 0.03, 0.25));
  arms.forEach((a, i) => A.add('idle', 5, swing(a, 'x', 5, 0.08 * (i ? 1 : -1), 0.1)));
  arms.forEach((a, i) => A.add('walk', 2.4, swing(a, 'z', 2.4, 0.25, i * 0.5)));
  roots.forEach((rt, i) => A.add('walk', 2.4, swing(rt, 'z', 2.4, 0.1, i / roots.length)));
  A.add('walk', 2.4, swing(body, 'x', 2.4, 0.05));
  A.add('glow', 1, lampTracks('eyes', 3), T.lantern && shape !== 'stump' ? lampTracks('lantern', 2.4) : null);
  void rotateTrack;
  return done(root, 'treefolk', variant, o, T, A.list());
}
