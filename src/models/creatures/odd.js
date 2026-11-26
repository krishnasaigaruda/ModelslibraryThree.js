// Small oddities: slime, mushroom folk and alien critters.
import { THREE, M, group, mesh, loft, taper, leg, skinMat, hornMat, glowMat, crystalMat, plainMat, darkMat, keys, setup, done, animKit, swing, breathe, merge, orient, crystalCluster, spikeRow, noise3, TAU, lampTracks, rotateTrack, scaleTrack, moveTrack, blob, zigzag, lathe, roundedBox, cushion } from './common.js';
import { lampGroup } from '../../core/lamps.js';

const V = (a) => new THREE.Vector3(...a);

/** Big cartoon-real eyes as lamp group 'eyes': white ball + glowing iris facing +X. */
function bigEyes(parent, pts, r, T, { name = 'eyes', white = true } = {}) {
  const col = new THREE.Color(T.eye);
  const lens = new THREE.MeshPhysicalMaterial({ name: 'iris', color: col, emissive: col, emissiveIntensity: 0.35, roughness: 0.1, clearcoat: 1, toneMapped: false });
  const lg = lampGroup(name, 'white', { lens });
  lg.glow.color.copy(col);
  const wm = new THREE.MeshPhysicalMaterial({ name: 'eyewhite', color: '#f6f4ee', roughness: 0.15, clearcoat: 1 });
  for (const p of pts) {
    const c = V(p);
    if (white) mesh(new THREE.SphereGeometry(r, 16, 12), wm, { parent, at: c.toArray(), name: `${name}_white` });
    const ir = white ? r * 0.55 : r;
    lg.add(parent, { geometry: new THREE.SphereGeometry(ir, 12, 10).scale(0.5, 1, 1).translate(c.x + (white ? r * 0.75 : 0), c.y, c.z), normal: [1, 0, 0], depth: r * 0.3, glowSize: r * 5 });
    mesh(new THREE.SphereGeometry(ir * 0.5, 10, 8).scale(0.4, 1, 1), darkMat('#050404'), { parent, at: [c.x + (white ? r * 0.98 : r * 0.45), c.y, c.z], name: `${name}_pupil` });
  }
  return lg;
}

/* ----------------------------------- slime ----------------------------------- */

const SLIME = {
  fire: { gel: '#ff6a1a', glowI: 0.6, bits: 'ember' }, ice: { gel: '#bfeaff', glowI: 0.1, bits: 'ice' }, poison: { gel: '#7ad02a', glowI: 0.35, bits: 'bubble' },
  shadow: { gel: '#3a1a5a', glowI: 0.25, bits: 'wisp' }, stone: { gel: '#8a8478', glowI: 0, bits: 'pebble', opaque: true }, gold: { gel: '#e8b840', glowI: 0, bits: 'coin', metal: true },
  undead: { gel: '#9ab08a', glowI: 0.15, bits: 'bone' }, crystal: { gel: '#a07ae8', glowI: 0.3, bits: 'crystal' }, baby: { gel: '#ff9ad0', glowI: 0.15, bits: 'none' },
  armoured: { gel: '#4a9ad8', glowI: 0.1, bits: 'helmet' }, storm: { gel: '#3a6aaa', glowI: 0.35, bits: 'bolt' }, forest: { gel: '#5aa040', glowI: 0.1, bits: 'leaf' },
};
export const SLIME_VARIANTS = {
  blob: { gel: '#3ad06a', eye: '#1a2a1a', shape: 'blob' },
  king: { gel: '#3a8aff', eye: '#ffe060', shape: 'king' },
  cube: { gel: '#7ae0d0', eye: '#1a3a3a', shape: 'cube' },
  twin: { gel: '#ff7ab0', eye: '#3a1a2a', shape: 'twin' },
  puddle: { gel: '#c8e040', eye: '#ff4a2a', shape: 'puddle' },
};

export function createSlime(options = {}) {
  const { o, variant, T, r } = setup(options, SLIME_VARIANTS, 'slime', {});
  const S = T.trim ? { ...SLIME[T.trim] } : { glowI: 0.12, bits: 'items' };
  const gelC = S.gel ?? (o.color && !T.trim ? o.color : T.gel);
  if (T.trim) T.eye = T.trim === 'baby' ? '#2a1a2a' : T.glow;
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const gel = S.metal ? M.metal(gelC, 0.15) : new THREE.MeshPhysicalMaterial({ name: 'gel', color: gelC, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, transparent: !S.opaque, opacity: S.opaque ? 1 : 0.78, emissive: gelC, emissiveIntensity: S.glowI, depthWrite: !!S.opaque, flatShading: !!S.opaque });
  const shape = T.shape;
  const body = group('body', { parent: rig });
  const blobProfile = (R, H, k = 1) => { const p = [[0, 0]]; for (let i = 0; i <= 16; i++) { const t = i / 16; const a = t * Math.PI / 2; p.push([R * (1.04 - 0.04 * t) * Math.cos(a) ** (0.6 * k) + (i === 0 ? 0.0 : 0), H * Math.sin(a)]); } p[1][1] = 0; p.push([0, H]); return p; };
  const parts = [];
  let R = 0.45, H = 0.5, topY = 0.5;
  if (shape === 'cube') {
    const g = cushion(0.8, 0.8, 0.8, { radius: 0.12, bulge: 0.08 });
    g.translate(0, 0.4, 0);
    parts.push(mesh(g, gel, { parent: body, name: 'gel' }));
    R = 0.4; H = 0.8; topY = 0.8;
  } else if (shape === 'twin') {
    parts.push(mesh(lathe(blobProfile(0.42, 0.42), 40), gel, { parent: body, name: 'gel' }));
    const top = mesh(new THREE.SphereGeometry(0.3, 28, 20).scale(1, 0.85, 1), gel, { parent: body, at: [0, 0.6, 0], name: 'gel_top' });
    parts.push(top);
    R = 0.42; H = 0.42; topY = 0.85;
  } else if (shape === 'puddle') {
    parts.push(mesh(lathe(blobProfile(0.7, 0.16, 0.5), 48), gel, { parent: body, name: 'gel' }));
    R = 0.7; H = 0.16; topY = 0.16;
  } else {
    const big = shape === 'king' ? 1.6 : 1;
    parts.push(mesh(lathe(blobProfile(0.45 * big, 0.5 * big), 48), gel, { parent: body, name: 'gel' }));
    R = 0.45 * big; H = 0.5 * big; topY = H;
  }
  // eyes + mouth (front = +X)
  const er = Math.min(0.09, R * 0.18) * (T.trim === 'baby' ? 1.3 : 1);
  if (shape === 'puddle') {
    const stalks = [];
    for (const sg of [1, -1]) {
      const b = V([0.25, 0.1, sg * 0.12]), t = V([0.42, 0.48, sg * 0.2]);
      stalks.push(taper([b.toArray(), [0.33, 0.3, sg * 0.15], t.toArray()], 0.05, 0.03, gel, { parent: body, name: 'stalk' }));
    }
    bigEyes(body, [[0.42, 0.53, 0.2], [0.42, 0.53, -0.2]], 0.07, T);
  } else if (shape === 'twin') {
    bigEyes(body, [[0.26, 0.66, 0.1], [0.26, 0.66, -0.1]], 0.06, T);
    bigEyes(body, [[0.36, 0.25, 0.13], [0.36, 0.25, -0.13]], 0.065, T, { name: 'eyes2' });
  } else {
    const ey = shape === 'cube' ? 0.55 : H * 0.55;
    const ex = shape === 'cube' ? 0.37 : R * Math.cos(Math.asin(Math.min(0.95, ey / H))) * 0.95;
    bigEyes(body, [[ex, ey, R * 0.28], [ex, ey, -R * 0.28]], er, T);
    // smile
    mesh(new THREE.TorusGeometry(R * 0.18, R * 0.025, 6, 14, Math.PI).rotateZ(Math.PI).rotateY(Math.PI / 2), darkMat('#1a1010'), { parent: body, at: [ex * 1.02, ey - er * 2, 0], name: 'mouth' });
  }
  // crown for the king
  if (shape === 'king') {
    const gold = M.metal('#e0b040', 0.2);
    const cg = new THREE.CylinderGeometry(0.22, 0.24, 0.16, 20, 1, true);
    const pos = cg.attributes.position;
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); pos.setY(i, 0.08 + 0.07 * Math.max(0, Math.cos(a * 5))); }
    cg.computeVertexNormals();
    mesh(cg, Object.assign(gold, { side: THREE.DoubleSide }), { parent: body, at: [0, topY + 0.04, 0], name: 'crown' });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; mesh(new THREE.OctahedronGeometry(0.025, 0), crystalMat(['#e0203a', '#2060e0', '#20c060'][i % 3], 0.4), { parent: body, at: [Math.cos(a) * 0.235, topY + 0.04, Math.sin(a) * 0.235], name: 'jewel' }); }
  }
  // contents / trim bits: inside items rest on the floor (grounded), outside bits sunk into the gel
  const surf = (u, v) => { // point on dome surface: u = angle around, v = 0..1 up
    const a = v * Math.PI / 2;
    if (shape === 'cube') return { p: V([Math.cos(u) * 0.41, 0.2 + v * 0.62, Math.sin(u) * 0.41]), n: V([Math.cos(u), 0.3, Math.sin(u)]).normalize() };
    return { p: V([Math.cos(u) * R * Math.cos(a) ** 0.6, H * Math.sin(a), Math.sin(u) * R * Math.cos(a) ** 0.6]), n: V([Math.cos(u) * Math.cos(a), Math.sin(a), Math.sin(u) * Math.cos(a)]).normalize() };
  };
  const bits = S.bits;
  const g = [];
  let bm = null;
  if (bits === 'items') {
    // swallowed odds and ends on the floor inside
    bm = M.metal('#9aa0a6', 0.3);
    mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14).rotateX(Math.PI / 2 - 0.3).translate(-R * 0.3, 0.02, R * 0.2), M.metal('#d8a838', 0.2), { parent: body, name: 'ring' });
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 12).translate(R * 0.1, 0.004, -R * 0.35), M.metal('#d8a838', 0.25), { parent: body, name: 'coin' });
    const key = new THREE.TorusGeometry(0.03, 0.008, 5, 10).translate(-0.06, 0, 0);
    mesh(merge([key, new THREE.CylinderGeometry(0.007, 0.007, 0.1, 6).rotateZ(Math.PI / 2).translate(0.01, 0, 0)]).rotateX(Math.PI / 2).translate(-R * 0.1, 0.009, -R * 0.1), bm, { parent: body, name: 'key' });
  } else if (bits === 'ember' || bits === 'bubble' || bits === 'wisp') {
    for (let i = 0; i < 14; i++) { const s = surf(r() * TAU, 0.15 + r() * 0.75); const rr = (bits === 'bubble' ? 0.04 : 0.03) + r() * 0.03; g.push(new THREE.SphereGeometry(rr, 10, 8).translate(...s.p.addScaledVector(s.n, -rr * 0.3).toArray())); }
    bm = bits === 'ember' ? glowMat('#ffd040', 1.8) : bits === 'bubble' ? new THREE.MeshPhysicalMaterial({ name: 'bubble', color: '#c8ff6a', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.55, emissive: '#6aff2a', emissiveIntensity: 0.3 }) : glowMat('#a050ff', 0.9, 0.7);
  } else if (bits === 'ice' || bits === 'crystal') {
    for (let i = 0; i < 6; i++) { const s = surf(r() * TAU, 0.3 + r() * 0.65); crystalCluster(s.p, s.n, 0.12 + r() * 0.08, crystalMat(bits === 'ice' ? '#e0f8ff' : '#c08cff', bits === 'ice' ? 0.15 : 0.6), r, { parent: body, count: 3 }); }
  } else if (bits === 'pebble') {
    for (let i = 0; i < 16; i++) { const s = surf(r() * TAU, r() * 0.95); g.push(new THREE.DodecahedronGeometry(0.05 + r() * 0.05, 0).translate(...s.p.toArray())); }
    bm = new THREE.MeshStandardMaterial({ name: 'pebble', color: '#6a665e', roughness: 0.95, flatShading: true });
  } else if (bits === 'coin') {
    for (let i = 0; i < 18; i++) { const a = r() * TAU, d = R * (1 + r() * 0.5); g.push(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 12).rotateX(r() * 0.4).translate(Math.cos(a) * d, 0.003, Math.sin(a) * d)); }
    bm = M.metal('#d8a838', 0.25);
  } else if (bits === 'bone') {
    mesh(new THREE.SphereGeometry(0.11, 14, 10).scale(1, 0.9, 0.85).translate(R * 0.1, 0.1, R * 0.15), plainMat('#efe6cc', 0.7), { parent: body, name: 'skull' });
    for (let i = 0; i < 3; i++) g.push(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6).rotateZ(Math.PI / 2).rotateY(i * 1.1).translate(-R * 0.25, 0.016, (i - 1) * 0.1));
    bm = plainMat('#efe6cc', 0.7);
  } else if (bits === 'helmet') {
    mesh(new THREE.SphereGeometry(R * 0.6, 24, 12, 0, TAU, 0, Math.PI / 2), M.metal('#9aa0a6', 0.3), { parent: body, at: [0, topY - R * 0.25, 0], name: 'helmet' });
    mesh(new THREE.ConeGeometry(0.03, 0.2, 8), M.metal('#9aa0a6', 0.3), { parent: body, at: [0, topY + R * 0.42, 0], name: 'helmet_spike' });
  } else if (bits === 'bolt') {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; zigzag(surf(a, 0.85).p, surf(a + 0.6, 0.15).p, 0.012, glowMat('#8fe6ff', 1.8), r, { parent: body, name: 'bolt' }); }
  } else if (bits === 'leaf') {
    const s = surf(0, 1);
    taper([s.p.clone().add(V([0, -0.04, 0])).toArray(), s.p.clone().add(V([0.02, 0.12, 0])).toArray(), s.p.clone().add(V([0.06, 0.2, 0])).toArray()], 0.015, 0.008, plainMat('#4a7a2a', 0.8), { parent: body, name: 'sprout' });
    for (const sg of [1, -1]) g.push(new THREE.SphereGeometry(1, 8, 6).scale(0.09, 0.015, 0.04).rotateZ(sg * 0.4).translate(s.p.x + sg * 0.08 + 0.02, s.p.y + 0.13, s.p.z));
    for (let i = 0; i < 8; i++) { const ss = surf(r() * TAU, 0.6 + r() * 0.35); g.push(new THREE.SphereGeometry(0.05, 6, 5).scale(1, 0.4, 1).translate(...ss.p.toArray())); }
    bm = M.foliage('#5a9a2a');
  }
  if (g.length) mesh(merge(g), bm, { parent: body, name: 'bits' });
  if (T.trim === 'baby') {
    // a couple of tiny baby slimes beside the parent
    for (let i = 0; i < 2; i++) mesh(lathe(blobProfile(0.12, 0.13), 24), gel, { parent: rig, at: [R * 0.7, 0, (i ? 1 : -1) * R * 1.05], name: 'babyslime' });
  }
  if (T.scale !== 1 && T.trim !== 'baby') rig.scale.setScalar(T.scale);
  A.add('idle', 2, scaleTrack(body, 2, (t) => { const s = Math.sin(TAU * t) * 0.05; return [1 + s, 1 - s, 1 + s]; }));
  A.add('bounce', 0.8, moveTrack(body, 0.8, (t) => [0, Math.max(0, Math.sin(TAU * t)) * 0.25, 0]), scaleTrack(body, 0.8, (t) => { const s = Math.cos(TAU * t) * 0.08; return [1 + s, 1 - s, 1 + s]; }));
  A.add('glow', 1, lampTracks('eyes', 2.5), shape === 'twin' ? lampTracks('eyes2', 2.5) : null);
  void parts; void leg; void loft; void skinMat; void hornMat; void keys; void breathe; void spikeRow; void noise3; void rotateTrack; void blob; void roundedBox; void swing; void orient;
  return done(root, 'slime', variant, o, T, A.list());
}

/* ------------------------------- mushroom folk ------------------------------- */

const SHROOM = {
  fire: { cap: '#d8401a', spot: '#ffd040', stem: '#e8c8a0', glow: true }, ice: { cap: '#9ad8f0', spot: '#ffffff', stem: '#e8f4f8', icicles: true }, poison: { cap: '#7a2a9a', spot: '#9cff2e', stem: '#d8d0b0', glow: true },
  shadow: { cap: '#1a1424', spot: '#8a2cff', stem: '#3a3044', glow: true }, stone: { cap: '#8a857a', spot: '#6a665e', stem: '#a09a8d', stone: true }, gold: { cap: '#d6a43a', spot: '#fff0b0', stem: '#e8d098', metal: true },
  undead: { cap: '#6a6a5a', spot: '#e3d8bb', stem: '#9a9a88', droop: true }, crystal: { cap: '#5a3fa5', spot: '#e0c0ff', stem: '#c8b8e8', crystals: true }, baby: { cap: '#ff7a8a', spot: '#ffffff', stem: '#fff0e0', small: true },
  armoured: { cap: '#6a4a2a', spot: '#9aa0a6', stem: '#d8c8a8', armour: true }, storm: { cap: '#2e3d55', spot: '#8fe6ff', stem: '#c8d4e0', glow: true }, forest: { cap: '#4a6a2a', spot: '#a8d060', stem: '#c8b890', moss: true },
};
export const MUSHROOM_VARIANTS = {
  toadstool: { cap: '#d42a1e', spot: '#ffffff', stem: '#f2ead8', eye: '#3a2a1a', shape: 'toad' },
  elder: { cap: '#8a5a32', spot: '#c8a070', stem: '#e8dcc0', eye: '#ffd060', shape: 'elder' },
  puffball: { cap: '#efe6d0', spot: '#d8c8a8', stem: '#efe6d0', eye: '#2a2a1a', shape: 'puff' },
  'tall-cap': { cap: '#c88a3a', spot: '#8a5a22', stem: '#f0e4c8', eye: '#2a1a0a', shape: 'tall' },
  colony: { cap: '#3a7ad0', spot: '#ffffff', stem: '#eef0f4', eye: '#ffe060', shape: 'colony' },
};

function shroomFolk(parent, S, T, r, { at = [0, 0, 0], s = 1, shape = 'toad', name = '' } = {}) {
  const g = group(`mush${name}`, { parent, at });
  const stemM = S.stone ? new THREE.MeshStandardMaterial({ name: 'stone', color: S.stem, roughness: 0.95 }) : new THREE.MeshStandardMaterial({ name: 'stem', color: S.stem, roughness: 0.75 });
  const capM = S.metal ? M.metal(S.cap, 0.25) : new THREE.MeshPhysicalMaterial({ name: 'cap', color: S.cap, roughness: 0.45, clearcoat: 0.6, emissive: S.glow ? S.spot : '#000000', emissiveIntensity: S.glow ? 0.08 : 0 });
  const spotM = S.glow ? glowMat(S.spot, 1.2) : plainMat(S.spot, 0.6);
  const H = (shape === 'tall' ? 0.75 : shape === 'puff' ? 0.3 : 0.5) * s;
  const W = (shape === 'puff' ? 0.3 : 0.17) * s;
  // stem body
  const body = group(`body${name}`, { parent: g });
  const stem = mesh(lathe([[0, 0], [W * 1.05, 0], [W * 1.1, H * 0.1], [W, H * 0.5], [W * 0.9, H * 0.9], [W * 0.85, H], [0, H]], 28), stemM, { parent: body, name: `stem${name}` });
  void stem;
  // cap
  const capR = (shape === 'tall' ? 0.28 : shape === 'elder' ? 0.55 : shape === 'puff' ? 0.36 : 0.42) * s;
  const capH = (shape === 'tall' ? 0.5 : shape === 'puff' ? 0.36 : 0.26) * s;
  const cap = group(`cap${name}`, { parent: body, at: [0, H * 0.92, 0], rot: [0, 0, S.droop ? 0.25 : 0] });
  const prof = [];
  if (shape === 'puff') { for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + (i / 16) * Math.PI; prof.push([Math.max(0.001, Math.cos(a) * capR), (Math.sin(a) + 0.7) * capH * 0.75]); } prof[0][0] = 0; prof[16][0] = 0; }
  else if (shape === 'tall') { for (let i = 0; i <= 14; i++) { const t = i / 14; prof.push([capR * Math.sin(Math.min(1, (1 - t) * 1.3) * Math.PI / 2) * (1 - t * 0.2) + 0.001, t * capH]); } prof.unshift([W * 0.8, 0]); prof.unshift([0, 0]); prof.push([0, capH]); }
  else { prof.push([0, -capH * 0.05], [capR * 0.6, -capH * 0.12], [capR, -capH * 0.08]); for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; prof.push([capR * Math.cos(a) + 0.001, capH * Math.sin(a) * (shape === 'elder' ? 0.8 : 1)]); } prof[prof.length - 1][0] = 0; }
  const capMesh = mesh(lathe(prof, 40), capM, { parent: cap, name: `capdome${name}` });
  // gills underside
  if (shape !== 'puff' && shape !== 'tall') mesh(new THREE.CylinderGeometry(capR * 0.95, W * 0.9, capH * 0.08, 32, 1).translate(0, -capH * 0.08, 0), plainMat(S.stem, 0.8), { parent: cap, name: `gills${name}` });
  // spots sunk into the cap surface
  const spots = [];
  const n = shape === 'tall' ? 0 : 12;
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, v = 0.15 + r() * 0.75;
    const ph = v * Math.PI / 2;
    const ccap = shape === 'puff' ? V([Math.cos(a) * capR * Math.cos(ph), capH * 0.75 * (Math.sin(ph) + 0.7), Math.sin(a) * capR * Math.cos(ph)]) : V([Math.cos(a) * capR * Math.cos(ph), capH * Math.sin(ph) * (shape === 'elder' ? 0.8 : 1), Math.sin(a) * capR * Math.cos(ph)]);
    const nn = ccap.clone().normalize();
    const sr = (0.03 + r() * 0.03) * s;
    spots.push(orient(new THREE.SphereGeometry(sr, 10, 6).scale(1, 0.35, 1), ccap, nn));
  }
  if (shape === 'tall') {
    // honeycomb ridges on the tall cap
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const pts = []; for (let k = 0; k <= 6; k++) { const t = 0.05 + k * 0.14; pts.push([Math.cos(a + t) * capR * Math.sin(Math.min(1, (1 - t) * 1.3) * Math.PI / 2) * (1 - t * 0.2), t * capH, Math.sin(a + t) * capR * Math.sin(Math.min(1, (1 - t) * 1.3) * Math.PI / 2) * (1 - t * 0.2)]); } spots.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => V(p))), 12, 0.012 * s, 5)); }
  }
  if (spots.length) mesh(merge(spots), spotM, { parent: cap, name: `spots${name}` });
  void capMesh;
  // face on the stem front
  const fy = H * 0.62;
  bigEyes(body, [[W * 0.86, fy, W * 0.38], [W * 0.86, fy, -W * 0.38]], W * 0.22, T, { name: `eyes${name}` });
  mesh(new THREE.TorusGeometry(W * 0.25, W * 0.04, 6, 12, Math.PI).rotateZ(Math.PI).rotateY(Math.PI / 2), darkMat('#2a1a10'), { parent: body, at: [W * 0.9, fy - W * 0.45, 0], name: `mouth${name}` });
  // arms + feet
  const arms = [];
  for (const sg of [1, -1]) {
    const a = group(`arm${name}_${sg > 0 ? 'L' : 'R'}`, { parent: body, at: [0, H * 0.5, sg * W * 0.85] });
    taper([[0, 0, -sg * W * 0.2], [0.03 * s, -0.08 * s, sg * 0.08 * s], [0.08 * s, -0.16 * s, sg * 0.1 * s]], 0.03 * s, 0.022 * s, stemM, { parent: a, name: `armlimb${name}` });
    mesh(new THREE.SphereGeometry(0.032 * s, 10, 8), stemM, { parent: a, at: [0.08 * s, -0.16 * s, sg * 0.1 * s], name: `hand${name}` });
    arms.push(a);
  }
  for (const sg of [1, -1]) mesh(new THREE.SphereGeometry(1, 12, 8).scale(0.07 * s, 0.035 * s, 0.05 * s), stemM, { parent: body, at: [0.05 * s, 0.025 * s, sg * W * 0.55], name: `foot${name}` });
  // trim parts
  if (S.icicles) { const ig = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; ig.push(new THREE.ConeGeometry(0.018 * s, 0.1 * s, 6).rotateX(Math.PI).translate(Math.cos(a) * capR * 0.92, -capH * 0.1 - 0.04 * s, Math.sin(a) * capR * 0.92)); } mesh(merge(ig), crystalMat('#e0f8ff', 0.15), { parent: cap, name: `icicles${name}` }); }
  if (S.crystals) crystalCluster(V([0, capH * 0.9, 0]), [0, 1, 0], 0.18 * s, crystalMat('#c08cff', 0.6), r, { parent: cap, count: 4, name: `crystals${name}` });
  if (S.armour) { mesh(new THREE.TorusGeometry(capR * 0.98, 0.02 * s, 6, 32).rotateX(Math.PI / 2).translate(0, -capH * 0.06, 0), M.metal('#9aa0a6', 0.3), { parent: cap, name: `rim${name}` }); mesh(new THREE.CylinderGeometry(W * 1.02, W * 1.08, H * 0.3, 20).translate(0, H * 0.35, 0), M.metal('#9aa0a6', 0.35), { parent: body, name: `breastplate${name}` }); }
  if (S.moss) { const mg = []; for (let i = 0; i < 8; i++) { const a = r() * TAU; mg.push(new THREE.SphereGeometry(0.04 * s, 6, 5).scale(1, 0.5, 1).translate(Math.cos(a) * capR * 0.5, capH * 0.85, Math.sin(a) * capR * 0.5)); } mesh(merge(mg), M.foliage('#5a8a2a'), { parent: cap, name: `moss${name}` }); }
  return { g, body, cap, arms, H, W };
}

export function createMushroomFolk(options = {}) {
  const { o, variant, T, r } = setup(options, MUSHROOM_VARIANTS, 'mushroom-folk', {});
  const S = T.trim ? { ...SHROOM[T.trim] } : { cap: o.color ?? T.cap, spot: T.spot, stem: T.stem };
  if (T.trim) T.eye = T.trim === 'baby' ? '#2a1a1a' : S.glow ? S.spot : T.glow;
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const shape = T.shape;
  const folks = [];
  if (shape === 'colony') {
    // three on a mossy log
    const wood = M.wood('walnut');
    mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.3, 16).rotateZ(Math.PI / 2), wood, { parent: rig, at: [0, 0.16, 0], name: 'log' });
    folks.push(shroomFolk(rig, S, T, r, { at: [-0.35, 0.3, 0], s: 0.7, shape: 'toad', name: '' }));
    folks.push(shroomFolk(rig, S, T, r, { at: [0.1, 0.3, 0.02], s: 0.9, shape: 'toad', name: '_b' }));
    folks.push(shroomFolk(rig, S, T, r, { at: [0.45, 0.3, -0.02], s: 0.55, shape: 'puff', name: '_c' }));
  } else {
    const f = shroomFolk(rig, S, T, r, { s: T.trim === 'baby' ? 0.7 : 1, shape });
    folks.push(f);
    if (shape === 'elder') {
      // moss beard and a crooked staff
      const bg = [];
      for (let i = 0; i < 7; i++) { const z = (i - 3) * 0.035; bg.push(new THREE.ConeGeometry(0.03, 0.18 + 0.04 * Math.cos(i), 6).rotateX(Math.PI).translate(f.W * 0.92, f.H * 0.38, z)); }
      mesh(merge(bg), M.foliage('#7a9a5a'), { parent: f.body, name: 'beard' });
      taper([[0.18, 0, 0.26], [0.18, 0.4, 0.26], [0.22, 0.75, 0.27], [0.15, 0.85, 0.28]], 0.022, 0.016, M.wood('walnut'), { parent: rig, name: 'staff', seg: 10 });
    }
    if (T.trim === 'baby') for (let i = 0; i < 3; i++) shroomFolk(rig, S, T, r, { at: [0.15 + i * 0.12, 0, (i - 1) * 0.35], s: 0.3, shape: 'toad', name: `_k${i}` });
  }
  // a grass/soil tuft under single folk
  if (shape !== 'colony') mesh(lathe([[0, 0], [0.32, 0], [0.3, 0.03], [0, 0.035]], 24), new THREE.MeshStandardMaterial({ name: 'soil', color: T.trim === 'ice' ? '#e8f4f8' : '#4a3a2a', roughness: 1 }), { parent: rig, name: 'soil' });
  if (T.scale !== 1 && T.trim !== 'baby') rig.scale.setScalar(T.scale);
  folks.forEach((f, i) => {
    A.add('idle', 3, scaleTrack(f.body, 3, (t) => { const s = 0.02 * Math.sin(TAU * t + i); return [1 + s, 1 - s, 1 + s]; }), swing(f.cap, 'x', 3, 0.05, i * 0.3));
    f.arms.forEach((a, k) => A.add('wave', 1, swing(a, 'x', 1, 0.5 * (k ? 1 : -1), i * 0.2)));
    A.add('glow', 1, lampTracks(`eyes${i ? ['', '_b', '_c'][i] : ''}`, 2.5));
  });
  void leg; void loft; void skinMat; void hornMat; void keys; void breathe; void spikeRow; void noise3; void rotateTrack; void blob; void roundedBox; void moveTrack; void zigzag; void cushion;
  return done(root, 'mushroom-folk', variant, o, T, A.list());
}

/* -------------------------------- alien critters -------------------------------- */

export const ALIEN_VARIANTS = {
  'eye-stalker': { p: '#6ad04a', b: '#c8f080', eye: '#ff3a8a', glow: '#ff3a8a', pattern: 'spots', spot: '#3a8a2a', shape: 'slug' },
  tripod: { p: '#8a6ad8', b: '#d0c0ff', eye: '#40f0ff', glow: '#40f0ff', pattern: 'bands', shape: 'tripod' },
  jelly: { p: '#ff7ad8', b: '#ffd0f0', eye: '#ffffff', glow: '#ff9ae8', pattern: 'plain', shape: 'jelly' },
  crawler: { p: '#d08a2a', b: '#f0d080', eye: '#3aff6a', glow: '#3aff6a', pattern: 'bands', shape: 'crawler' },
  'spore-puff': { p: '#3ad0c0', b: '#c0fff0', eye: '#ffe040', glow: '#ffe040', pattern: 'spots', spot: '#ff7ad8', shape: 'puff' },
};

export function createAlienCritter(options = {}) {
  const { o, variant, T, r } = setup(options, ALIEN_VARIANTS, 'alien-critter', {});
  if (T.trim) T.eye = T.glow;
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const skin = skinMat(T, { clear: 0.9, rough: Math.min(0.4, T.rough) });
  const pc = new THREE.Color(T.p), bc = new THREE.Color(T.b), sc = new THREE.Color(T.spot ?? T.b), cc = new THREE.Color();
  const col = (u, a, p) => { cc.copy(bc).lerp(pc, 0.5 + 0.5 * Math.cos(a)); if (T.pattern === 'spots' && noise3(p.x * 9, p.y * 9, p.z * 9) > 0.62) cc.lerp(sc, 0.8); if (T.pattern === 'bands' && Math.sin(u * 30) > 0.5) cc.multiplyScalar(0.75); return cc; };
  const shape = T.shape;
  const body = group('body', { parent: rig });
  const anims = [];
  let main;
  const glowSpots = (lm, n, a0 = 0) => { const g = []; for (let i = 0; i < n; i++) { const s = lm.userData.surf(0.15 + r() * 0.7, a0 + (r() - 0.5) * 2.4); g.push(new THREE.SphereGeometry(0.018 + r() * 0.015, 8, 6).translate(...s.p.toArray())); } return mesh(merge(g), glowMat(T.glow, 1.4), { parent: lm.parent, name: 'glowspots' }); };
  if (shape === 'slug') {
    main = loft([[-0.45, 0.1, 0], [-0.1, 0.16, 0], [0.25, 0.2, 0], [0.42, 0.3, 0]], (t) => [keys(t, [[0, 0.04], [0.3, 0.2], [0.8, 0.17], [1, 0.12]]), keys(t, [[0, 0.04], [0.3, 0.16], [0.8, 0.15], [1, 0.12]])], skin, { seg: 30, rad: 18, color: col, parent: body, name: 'chest' });
    // flat sole to ground
    mesh(new THREE.SphereGeometry(1, 20, 8).scale(0.45, 0.04, 0.17).translate(0, 0.035, 0), skin, { parent: body, name: 'sole' });
    const stalks = [];
    for (let i = 0; i < 3; i++) {
      const z = (i - 1) * 0.08, h = 0.28 + (i === 1 ? 0.08 : 0);
      const st = group(`stalk_${i}`, { parent: body, at: [0.4, 0.36, z] });
      taper([[0, -0.04, 0], [0.04, h * 0.5, z * 0.8], [0.06, h, z * 1.4]], 0.03, 0.018, skin, { parent: st, name: `stalk_${i}_limb`, color: col });
      stalks.push(st);
      anims.push(swing(st, 'x', 2, 0.25, i * 0.3));
    }
    const lg = lampGroup('eyes', 'white', { lens: new THREE.MeshPhysicalMaterial({ name: 'iris', color: T.eye, emissive: T.eye, emissiveIntensity: 0.4, roughness: 0.1, toneMapped: false }) });
    lg.glow.color.set(T.eye);
    stalks.forEach((st, i) => { const z = (i - 1) * 0.08; const h = 0.28 + (i === 1 ? 0.08 : 0); mesh(new THREE.SphereGeometry(0.05, 14, 10), plainMat('#f6f4ee', 0.2), { parent: st, at: [0.06, h + 0.03, z * 1.4], name: 'eyeball' }); lg.add(st, { geometry: new THREE.SphereGeometry(0.025, 10, 8).scale(0.6, 1, 1).translate(0.1, h + 0.03, z * 1.4), normal: [1, 0, 0], depth: 0.01, glowSize: 0.15 }); });
    glowSpots(main, 10);
  } else if (shape === 'tripod') {
    main = loft([[0, 0.72, 0], [0, 0.9, 0], [0, 1.05, 0]], (t) => keys(t, [[0, 0.12], [0.3, 0.32], [0.7, 0.3], [1, 0.08]]), skin, { seg: 18, rad: 24, color: col, up: [1, 0, 0], parent: body, name: 'chest' });
    bigEyes(body, [[0.27, 0.92, 0]], 0.08, T);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + Math.PI / 3;
      const hip = V([Math.cos(a) * 0.2, 0.78, Math.sin(a) * 0.2]);
      const foot = V([Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62]);
      const lgp = leg(rig, `leg_${i}`, { hip, foot, bend: [0, 1, 0], len: hip.distanceTo(foot) * 1.15, r: [0.05, 0.035, 0.025], mat: skin, color: col, footType: 'stump', footLen: 0.1 });
      anims.push(swing(lgp, 'y', 1.2, 0.12, i / 3));
    }
    // antenna
    taper([[0, 1.08, 0], [0.04, 1.25, 0], [-0.02, 1.38, 0]], 0.015, 0.008, skin, { parent: body, name: 'antenna', color: col });
    mesh(new THREE.SphereGeometry(0.03, 10, 8), glowMat(T.glow, 1.8), { parent: body, at: [-0.02, 1.4, 0], name: 'antenna_tip' });
  } else if (shape === 'jelly') {
    // bell hovering on its own tentacles that touch the ground
    const bellM = new THREE.MeshPhysicalMaterial({ name: 'jelly', color: T.p, roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.75, emissive: T.glow, emissiveIntensity: 0.25, side: THREE.DoubleSide });
    const prof = []; for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI / 2; prof.push([0.35 * Math.cos(a) + 0.001, 0.32 * Math.sin(a)]); } prof.unshift([0.3, -0.06]);
    main = mesh(lathe(prof, 36), bellM, { parent: body, at: [0, 0.75, 0], name: 'chest' });
    mesh(new THREE.SphereGeometry(0.14, 16, 12), glowMat(T.glow, 1.0, 0.9), { parent: body, at: [0, 0.82, 0], name: 'core' });
    mesh(new THREE.CylinderGeometry(0.03, 0.1, 0.12, 12), bellM, { parent: body, at: [0, 0.72, 0], name: 'core_stem' });
    bigEyes(body, [[0.28, 0.88, 0.1], [0.28, 0.88, -0.1]], 0.045, T);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const tp = group(`tentacle_${i}`, { parent: body, at: [Math.cos(a) * 0.26, 0.72, Math.sin(a) * 0.26] });
      taper([[0, 0.02, 0], [Math.cos(a) * 0.1, -0.25, Math.sin(a) * 0.1], [Math.cos(a) * 0.05, -0.5, Math.sin(a) * 0.05], [Math.cos(a) * 0.2, -0.72, Math.sin(a) * 0.2]], 0.03, 0.012, bellM, { parent: tp, name: `tentacle_${i}_loft` });
      anims.push(swing(tp, 'x', 2.5, 0.06, i / 8));
    }
  } else if (shape === 'crawler') {
    main = loft([[-0.4, 0.22, 0], [-0.1, 0.25, 0], [0.2, 0.25, 0], [0.38, 0.22, 0]], (t) => [keys(t, [[0, 0.05], [0.3, 0.17], [0.7, 0.15], [1, 0.09]]), keys(t, [[0, 0.05], [0.3, 0.12], [0.7, 0.11], [1, 0.08]])], skin, { seg: 26, rad: 16, color: col, parent: body, name: 'chest' });
    spikeRow(main, { from: 0.1, to: 0.8, n: 6, h: 0.08, T, style: T.trim ? T.spikes : 'cone', mat: T.trim ? undefined : hornMat(T, T.b), lean: 0.6, name: 'carapace' });
    const eg = main.userData.surf(0.95, 0);
    bigEyes(body, [[0.42, 0.27, 0.05], [0.42, 0.27, -0.05], [0.4, 0.31, 0.0]], 0.03, T, { white: false });
    void eg;
    for (let i = 0; i < 6; i++) {
      const x = -0.15 + (i >> 1) * 0.18, sg = i % 2 ? -1 : 1;
      const hip = V([x, 0.2, sg * 0.1]);
      const foot = V([x + 0.05, 0, sg * 0.42]);
      const lgp = leg(rig, `leg_${i}`, { hip, foot, bend: [0, 1, 0], len: hip.distanceTo(foot) * 1.3, r: [0.03, 0.02, 0.012], mat: skin, color: col, footType: 'none' });
      anims.push(swing(lgp, 'y', 0.5, 0.25, ((i >> 1) + (i % 2)) * 0.5));
    }
    // mandibles
    for (const sg of [1, -1]) taper([[0.42, 0.2, sg * 0.04], [0.5, 0.18, sg * 0.06], [0.54, 0.17, sg * 0.02]], 0.015, 0.004, hornMat(T, '#2a2018'), { parent: body, name: 'mandible' });
  } else {
    // spore-puff: round fuzzy ball on little feet with antennae
    main = blob(0.3, 0.27, 0.3, skin, { parent: body, at: [0, 0.33, 0], jitter: 0.06, ws: 28, hs: 20, name: 'chest', color: (p) => col(0.5, Math.acos(Math.max(-1, Math.min(1, p.y / 0.27))), p) });
    bigEyes(body, [[0.25, 0.4, 0.09], [0.25, 0.4, -0.09]], 0.055, T);
    for (const sg of [1, -1]) { const st = group(sg > 0 ? 'antenna_L' : 'antenna_R', { parent: body, at: [0.05, 0.55, sg * 0.1] }); taper([[0, -0.03, 0], [0.04, 0.12, sg * 0.05], [0.12, 0.2, sg * 0.1]], 0.015, 0.007, skin, { parent: st, name: 'antenna', color: col }); mesh(new THREE.SphereGeometry(0.03, 10, 8), glowMat(T.glow, 1.6), { parent: st, at: [0.12, 0.2, sg * 0.1], name: 'antenna_tip' }); anims.push(swing(st, 'x', 1.6, 0.2 * sg)); }
    for (const sg of [1, -1]) mesh(new THREE.SphereGeometry(1, 12, 8).scale(0.08, 0.04, 0.06), skin, { parent: body, at: [0.05, 0.03, sg * 0.12], name: 'foot' });
  }
  // trim extras
  if (T.crystals && main.userData.surf) for (const t of [0.4, 0.7]) { const s = main.userData.surf(t, 0); crystalCluster(s.p, s.n, 0.12, crystalMat(T.glow, 0.5), r, { parent: main.parent, count: 4 }); }
  if (T.plates && main.userData.surf) spikeRow(main, { from: 0.2, to: 0.8, n: 4, h: 0.06, T, style: 'metal', lean: 0.2, name: 'armour' });
  if (T.trim === 'fire' && main.userData.surf) spikeRow(main, { from: 0.2, to: 0.85, n: 5, h: 0.12, T, style: 'flame', lean: 0.3, name: 'flames' });
  if (T.leaves && main.userData.surf) spikeRow(main, { from: 0.2, to: 0.85, n: 5, h: 0.1, T, style: 'leaf', lean: 0.3, name: 'leaves' });
  if (T.trim === 'shadow' && main.userData.surf) spikeRow(main, { from: 0.15, to: 0.85, n: 6, h: 0.1, T, style: 'blade', lean: 0.5, name: 'blades' });
  if (T.trim === 'undead' && main.userData.surf) spikeRow(main, { from: 0.15, to: 0.85, n: 5, h: 0.08, T, style: 'bone', lean: 0.5, name: 'bones' });
  if (T.trim === 'storm' && main.userData.surf) zigzag(main.userData.surf(0.2, 1.2).p, main.userData.surf(0.85, 1.2).p, 0.008, glowMat('#8fe6ff', 1.8), r, { parent: main.parent, name: 'bolt' });
  if (T.trim === 'gold') { const g = []; for (let i = 0; i < 12; i++) { const a = r() * TAU, d = 0.3 + r() * 0.3; g.push(new THREE.CylinderGeometry(0.025, 0.025, 0.005, 12).translate(Math.cos(a) * d, 0.0025, Math.sin(a) * d)); } mesh(merge(g), M.metal('#d8a838', 0.25), { parent: rig, name: 'coins' }); }
  if (T.trim === 'stone' || T.trim === 'ice' || T.trim === 'poison') { const g = []; for (let i = 0; i < 6; i++) { const a = r() * TAU, d = 0.35 + r() * 0.25; g.push(new THREE.DodecahedronGeometry(0.04 + r() * 0.05, 0).translate(Math.cos(a) * d, 0.02, Math.sin(a) * d)); } mesh(merge(g), T.trim === 'ice' ? crystalMat('#cfefff', 0.2) : T.trim === 'poison' ? glowMat('#9cff2e', 0.6) : new THREE.MeshStandardMaterial({ color: '#6a665e', roughness: 0.95, flatShading: true }), { parent: rig, name: 'rocks' }); }
  if (T.scale !== 1) rig.scale.setScalar(T.trim === 'baby' ? 0.6 : T.scale);
  A.add('idle', 2, main.userData.surf ? breathe(main, 2, 0.04) : scaleTrack(main, 2, (t) => { const s = 1 + 0.04 * Math.sin(TAU * t); return [s, 1 / s, s]; }), ...anims.filter((x) => x && /stalk|tentacle|antenna/.test(x.name)));
  const walk = anims.filter((x) => x && /leg_/.test(x.name));
  if (walk.length) A.add('walk', walk[0].times[walk[0].times.length - 1], ...walk);
  A.add('glow', 1, lampTracks('eyes', 2.5));
  void loft; void roundedBox; void cushion; void rotateTrack; void moveTrack; void orient;
  return done(root, 'alien-critter', variant, o, T, A.list());
}
