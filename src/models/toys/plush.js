// Plush animals, simple generic dolls and dollhouses.
import {
  THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, tube, toyMat, toyFactory, BLACK, WHITE, CHROME, canvasTex,
  clip, rotateTrack, moveTrack, spinTrack, wave, pingPong,
} from './kit.js';

/* ============================== PLUSH ANIMALS ============================== */
// body colour, belly/muzzle colour, ear style
export const PLUSH_VARIANTS = {
  bear: { body: '#a8754a', belly: '#e8cfa8', ears: 'round' },
  bunny: { body: '#e9e2da', belly: '#f6c9d2', ears: 'long' },
  cat: { body: '#9a9a9e', belly: '#f2efe8', ears: 'pointy', tail: 'long' },
  dog: { body: '#d9b07a', belly: '#f4e7d0', ears: 'floppy', tail: 'short' },
  elephant: { body: '#9fb3c8', belly: '#e9c7d4', ears: 'big', trunk: true },
  penguin: { body: '#22252b', belly: '#f4f4f0', ears: 'none', beak: true, flippers: true },
  owl: { body: '#8a6a4a', belly: '#e8d6b4', ears: 'tufts', beak: true, flippers: true, bigEyes: true },
  lion: { body: '#e0a54a', belly: '#f6e2b8', ears: 'round', mane: '#a2561e', tail: 'long' },
};

function ellipsoid(r, sx, sy, sz, seg = 24) {
  return new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)).scale(sx, sy, sz);
}

export const createPlushToy = toyFactory('plush-toy', PLUSH_VARIANTS, (c) => {
  const { root, T, v } = c;
  const kind = T.kind;
  const hard = kind === 'metal' || kind === 'wood' || kind === 'rawwood' || kind === 'gold' || kind === 'chrome';
  const seg = hard ? 14 : 26;
  const tinted = (col, i) => {
    if (T.name === 'plush') return toyMat('plush', col);
    if (T.style === 'rainbow' || T.style === 'candy') return c.m(i);
    // blend the animal colour with the trim palette
    const k = T.style === 'neon' ? 0.75 : T.style === 'soft' ? 0.55 : 0.4;
    const col2 = '#' + M.toColor(col).lerp(M.toColor(T.pal[i % 4]), k).getHexString();
    return toyMat(kind === 'soft' ? 'plush' : kind, col2);
  };
  const bodyM = tinted(v.body, 0);
  const bellyM = tinted(v.belly, 4);
  const eyeM = new THREE.MeshPhysicalMaterial({ color: '#0c0c0e', roughness: 0.1, clearcoat: 1 });
  const S = 0.1; // base unit (seated toy ~0.3 m tall)
  const tall = v.flippers ? 1.25 : 1;
  // body
  mesh(ellipsoid(S, 1, 1.15 * tall, 0.9, seg), bodyM, { parent: root, at: [0, S * 1.1 * tall, 0] });
  mesh(ellipsoid(S * 0.72, 0.8, 1.05 * tall, 0.5, seg), bellyM, { parent: root, at: [0, S * 1.05 * tall, S * 0.5] });
  // head
  const head = group('head', { parent: root, at: [0, S * (2.15 * tall + 0.25) , 0] });
  const hr = v.flippers ? 0 : S * 0.85;
  if (hr) {
    mesh(ellipsoid(hr, 1.05, 0.95, 0.95, seg), bodyM, { parent: head });
    // muzzle
    if (!v.trunk) mesh(ellipsoid(hr * 0.42, 1.2, 0.85, 0.8, seg), bellyM, { parent: head, at: [0, -hr * 0.28, hr * 0.78] });
    mesh(ellipsoid(hr * 0.13, 1.3, 0.9, 0.8, 12), eyeM, { parent: head, at: [0, -hr * 0.12, hr * (v.trunk ? 0.9 : 1.08)] });
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(hr * 0.1, 14, 10), eyeM, { parent: head, at: [s * hr * 0.36, hr * 0.15, hr * 0.85] });
  } else {
    // penguin / owl: head blends into the tall body
    head.position.y = S * 2.35 * tall - S * 0.1;
  }
  const er = S * 0.85;
  if (v.ears === 'round') for (const s of [-1, 1]) {
    mesh(ellipsoid(er * 0.32, 1, 1, 0.45, 18), bodyM, { parent: head, at: [s * er * 0.7, er * 0.68, 0] });
    mesh(ellipsoid(er * 0.2, 1, 1, 0.3, 14), bellyM, { parent: head, at: [s * er * 0.7, er * 0.68, er * 0.1] });
  }
  if (v.ears === 'long') for (const s of [-1, 1]) {
    const e = group(`ear${s > 0 ? 'R' : 'L'}`, { parent: head, at: [s * er * 0.35, er * 0.7, 0], rot: [0, 0, -s * 0.18] });
    mesh(ellipsoid(er * 0.22, 1, 3.2, 0.5, 18), bodyM, { parent: e, at: [0, er * 0.55, 0] });
    mesh(ellipsoid(er * 0.14, 1, 3.0, 0.4, 14), bellyM, { parent: e, at: [0, er * 0.55, er * 0.06] });
  }
  if (v.ears === 'pointy' || v.ears === 'tufts') for (const s of [-1, 1]) {
    const k = v.ears === 'tufts' ? 0.7 : 1;
    mesh(new THREE.ConeGeometry(er * 0.3 * k, er * 0.55 * k, 4, 1).scale(1, 1, 0.5), bodyM, { parent: head, at: [s * er * 0.55, er * (v.ears === 'tufts' ? -0.05 + 0.0 : 0.85), 0], rot: [0, 0, -s * 0.35] });
  }
  if (v.ears === 'floppy') for (const s of [-1, 1]) {
    mesh(ellipsoid(er * 0.28, 0.6, 1.5, 0.3, 16), tinted(v.body, 1), { parent: head, at: [s * er * 0.9, -er * 0.05, 0], rot: [0, 0, s * 0.3] });
  }
  if (v.ears === 'big') for (const s of [-1, 1]) {
    mesh(ellipsoid(er * 0.6, 0.25, 1, 0.9, 18), bodyM, { parent: head, at: [s * er * 0.95, 0, -er * 0.1], rot: [0, s * 0.4, 0] });
  }
  if (v.trunk) curveTube([[0, -er * 0.1, er * 0.8], [0, -er * 0.5, er * 1.15], [0, -er * 0.9, er * 1.1], [0, -er * 1.0, er * 1.3]], er * 0.18, bodyM, { parent: head, segments: 16 });
  if (v.mane) {
    const maneM = tinted(v.mane, 2);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      mesh(new THREE.SphereGeometry(er * 0.32, 12, 10), maneM, { parent: head, at: [Math.cos(a) * er * 0.92, Math.sin(a) * er * 0.92, -er * 0.25] });
    }
  }
  if (v.flippers) {
    // eyes / beak on the body top
    const ey = S * 2.0 * tall;
    for (const s of [-1, 1]) {
      if (v.bigEyes) mesh(new THREE.CylinderGeometry(S * 0.3, S * 0.3, S * 0.06, 24).rotateX(Math.PI / 2), WHITE, { parent: root, at: [s * S * 0.33, ey, S * 0.72] });
      mesh(new THREE.SphereGeometry(S * (v.bigEyes ? 0.14 : 0.09), 14, 10), eyeM, { parent: root, at: [s * S * 0.33, ey, S * (v.bigEyes ? 0.77 : 0.74)] });
    }
    mesh(new THREE.ConeGeometry(S * 0.12, S * 0.28, 12).rotateX(Math.PI / 2), toyMat(kind === 'soft' ? 'plush' : kind, '#f2a01a'), { parent: root, at: [0, ey - S * 0.22, S * 0.95] });
    if (v.ears === 'tufts') for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(S * 0.15, S * 0.35, 4).scale(1, 1, 0.5), bodyM, { parent: root, at: [s * S * 0.55, S * 2.55 * tall, 0], rot: [0, 0, -s * 0.4] });
  }
  // arms / flippers
  const arms = [];
  for (const s of [-1, 1]) {
    const a = group(`arm${s > 0 ? 'R' : 'L'}`, { parent: root, at: [s * S * 0.85, S * 1.6 * tall, S * 0.1] });
    if (v.flippers) mesh(ellipsoid(S * 0.3, 0.3, 1.6, 0.8, 16), bodyM, { parent: a, at: [s * S * 0.08, -S * 0.4, 0], rot: [0, 0, s * 0.25] });
    else mesh(new THREE.CapsuleGeometry(S * 0.22, S * 0.45, 6, 14), bodyM, { parent: a, at: [s * S * 0.15, -S * 0.3, S * 0.12], rot: [0.5, 0, s * 0.5] });
    arms.push(a);
  }
  // legs (seated, feet forward) with paw pads
  for (const s of [-1, 1]) {
    const lg = new THREE.CapsuleGeometry(S * 0.27, S * 0.4, 6, 14).rotateX(Math.PI / 2);
    mesh(lg, bodyM, { parent: root, at: [s * S * 0.5, S * 0.27, S * 0.55] });
    mesh(new THREE.CylinderGeometry(S * 0.2, S * 0.2, S * 0.04, 18).rotateX(Math.PI / 2), bellyM, { parent: root, at: [s * S * 0.5, S * 0.27, S * 1.15] });
  }
  if (v.tail) curveTube([[0, S * 0.3, -S * 0.8], [0, S * 0.25, -S * 1.2], [S * 0.3, S * 0.5, -S * 1.4], [S * 0.35, S * (v.tail === 'long' ? 1.0 : 0.6), -S * 1.35]], S * 0.09, bodyM, { parent: root, segments: 20 });
  // trim extras
  if (T.style === 'tin') {
    const key = group('windkey', { parent: root, at: [0, S * 1.2 * tall, -S * 0.88] });
    tube([0, 0, 0], [0, 0, -S * 0.25], S * 0.04, toyMat('gold', '#d4a73a'), { parent: key });
    for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(S * 0.12, S * 0.035, 8, 18), toyMat('gold', '#d4a73a'), { parent: key, at: [s * S * 0.12, 0, -S * 0.25] });
    c.anims.push(clip('windup', 1.2, [spinTrack(key, 'z', 1.2)]));
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) mesh(new THREE.SphereGeometry(S * 0.025, 6, 4), toyMat('chrome', '#ddd'), { parent: root, at: [s * S * 0.3, S * (0.6 + k * 0.4) * tall, S * 0.84] });
  } else if (T.style === 'mini') {
    // keychain loop on the head
    mesh(new THREE.TorusGeometry(S * 0.18, S * 0.03, 8, 20), toyMat('chrome', '#cfd3d8'), { parent: v.flippers ? root : head, at: [0, v.flippers ? S * 2.25 * tall + S * 0.15 : er * 1.0, 0] });
  } else if (T.name === 'vintage') {
    // patched, buttoned
    mesh(roundedBox(S * 0.35, S * 0.3, S * 0.03, S * 0.03), toyMat('plush', '#7a6a9a'), { parent: root, at: [S * 0.35, S * 1.25 * tall, S * 0.82], rot: [0, 0.4, 0.2] });
    mesh(new THREE.TorusGeometry(S * 0.25, S * 0.06, 8, 20), toyMat('plush', '#9a2a2a'), { parent: root, at: [0, S * 2.05 * tall, 0], rot: [Math.PI / 2, 0, 0] });
  } else if (T.style === 'jumbo') {
    // giant toy wears a big bow
    for (const s of [-1, 1]) mesh(ellipsoid(S * 0.25, 1.4, 0.8, 0.5, 16), c.m(1), { parent: root, at: [s * S * 0.28, S * 2.15 * tall, S * 0.62] });
    mesh(new THREE.SphereGeometry(S * 0.12, 14, 10), c.m(1), { parent: root, at: [0, S * 2.15 * tall, S * 0.7] });
  } else if (T.style === 'candy') {
    // party hat
    mesh(new THREE.ConeGeometry(S * 0.3, S * 0.7, 20), c.m(2), { parent: v.flippers ? root : head, at: [0, v.flippers ? S * 2.25 * tall + S * 0.3 : er * 1.1, 0] });
  }
  c.anims.push(clip('wave', 1.6, [rotateTrack(arms[1], 'z', 1.6, (t) => pingPong(t) * 1.4), rotateTrack(head, 'z', 1.6, (t) => wave(t) * 0.12)]));
}, { base: 'plush' });

/* ============================== DOLLS ============================== */
export const DOLL_VARIANTS = {
  girl: { hair: '#5a3418', long: true, dress: true, pal: ['#e85d9a', '#ffd23f', '#9fd2ee', '#ffffff', '#fff4f8', '#5a2348'] },
  boy: { hair: '#2a1a10', long: false, dress: false, pal: ['#1d4ed8', '#d62828', '#f4c20d', '#2a9d3c', '#f7f5f0', '#1b1b1b'] },
  baby: { hair: '#e0b070', long: false, baby: true, pal: ['#fbe39a', '#9fd2ee', '#f4a9bf', '#b4e2c4', '#fffaf2', '#8f7f9a'] },
  'rag-doll': { hair: '#c0392b', long: true, dress: true, rag: true, pal: ['#3a7d44', '#c0392b', '#e0ad3a', '#2e6da4', '#efe2c4', '#5b3a24'], matKind: 'plush' },
  'peg-doll': { peg: true },
  'nesting-dolls': { nesting: true },
  'fashion-doll': { hair: '#e8c060', long: true, dress: true, slim: true },
};

function dollFigure(parent, c, v, { at = [0, 0, 0], H = 0.3, skinTone = '#f1c9a5', name = 'doll' } = {}) {
  const { T } = c;
  const g = group(name, { parent, at });
  const skinM = M.skin(skinTone);
  const k = H / 0.3;
  const slim = v.slim ? 0.72 : 1;
  const outfit = c.m(0);
  const outfit2 = c.m(1);
  const hairM = toyMat(v.rag ? 'plush' : 'plastic', T.style === 'neon' || T.style === 'candy' ? T.pal[2] : v.hair);
  const legH = (v.slim ? 0.13 : v.baby ? 0.06 : 0.1) * k;
  // shoes + legs
  for (const s of [-1, 1]) {
    mesh(roundedBox(0.028 * k * slim, 0.014 * k, 0.04 * k, 0.006 * k), outfit2, { parent: g, at: [s * 0.022 * k * slim, 0.007 * k, 0.006 * k] });
    mesh(new THREE.CylinderGeometry(0.011 * k * slim, 0.013 * k * slim, legH, 14), v.rag ? toyMat('plush', '#e8e8e8') : skinM, { parent: g, at: [s * 0.022 * k * slim, 0.014 * k + legH / 2, 0] });
  }
  const hipY = 0.014 * k + legH;
  const torsoH = (v.baby ? 0.08 : 0.085) * k;
  if (v.dress) {
    mesh(lathe([[0.0, 0], [0.06 * k * slim, 0], [0.05 * k * slim, 0.03 * k], [0.028 * k * slim, torsoH + 0.02 * k], [0.022 * k * slim, torsoH + 0.035 * k], [0, torsoH + 0.035 * k]], 28), outfit, { parent: g, at: [0, hipY - 0.03 * k, 0] });
  } else {
    mesh(new THREE.CapsuleGeometry(0.03 * k * slim, torsoH * 0.6, 6, 16), outfit, { parent: g, at: [0, hipY + torsoH * 0.5, 0] });
    mesh(new THREE.CylinderGeometry(0.031 * k * slim, 0.033 * k * slim, 0.03 * k, 16), outfit2, { parent: g, at: [0, hipY + 0.005 * k, 0] });
  }
  const shY = hipY + torsoH + 0.002 * k;
  // arms
  const arms = [];
  for (const s of [-1, 1]) {
    const a = group(`${name}_arm${s > 0 ? 'R' : 'L'}`, { parent: g, at: [s * 0.034 * k * slim, shY - 0.006 * k, 0] });
    mesh(new THREE.CapsuleGeometry(0.009 * k * slim, 0.06 * k, 4, 10), v.dress ? skinM : outfit, { parent: a, at: [s * 0.008 * k, -0.035 * k, 0], rot: [0, 0, s * 0.2] });
    mesh(new THREE.SphereGeometry(0.01 * k * slim, 10, 8), skinM, { parent: a, at: [s * 0.016 * k, -0.075 * k, 0] });
    arms.push(a);
  }
  // head
  const hr = (v.baby ? 0.05 : v.slim ? 0.03 : 0.042) * k;
  const head = group(`${name}_head`, { parent: g, at: [0, shY + hr * 0.95, 0] });
  mesh(new THREE.CylinderGeometry(0.01 * k, 0.012 * k, 0.02 * k, 10), skinM, { parent: g, at: [0, shY, 0] });
  mesh(new THREE.SphereGeometry(hr, 24, 18), v.rag ? toyMat('plush', skinTone) : skinM, { parent: head });
  for (const s of [-1, 1]) {
    if (v.rag) mesh(new THREE.CylinderGeometry(hr * 0.12, hr * 0.12, hr * 0.05, 12).rotateX(Math.PI / 2), BLACK, { parent: head, at: [s * hr * 0.35, hr * 0.1, hr * 0.94] });
    else mesh(new THREE.SphereGeometry(hr * 0.1, 10, 8), BLACK, { parent: head, at: [s * hr * 0.35, hr * 0.08, hr * 0.92] });
    mesh(new THREE.SphereGeometry(hr * 0.12, 10, 8).scale(1, 0.6, 0.4), toyMat('soft', '#f39a9a'), { parent: head, at: [s * hr * 0.55, -hr * 0.18, hr * 0.8] });
  }
  mesh(new THREE.TorusGeometry(hr * 0.18, hr * 0.03, 6, 12, Math.PI), toyMat('plastic', '#b0383a'), { parent: head, at: [0, -hr * 0.3, hr * 0.94], rot: [0, 0, Math.PI] });
  // hair
  mesh(new THREE.SphereGeometry(hr * 1.06, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM, { parent: head, at: [0, hr * 0.02, -hr * 0.05], rot: [-0.35, 0, 0] });
  if (v.long) {
    mesh(new THREE.CylinderGeometry(hr * 0.9, hr * 1.1, hr * 1.6, 20, 1, true, Math.PI * 0.5, Math.PI), hairM, { parent: head, at: [0, -hr * 0.6, -hr * 0.1] }).material.side = THREE.DoubleSide;
    if (v.rag) for (const s of [-1, 1]) curveTube([[s * hr * 0.9, 0, 0], [s * hr * 1.3, -hr * 0.6, 0], [s * hr * 1.2, -hr * 1.4, 0.0]], hr * 0.18, hairM, { parent: head, segments: 12 });
  }
  if (v.baby) mesh(new THREE.CylinderGeometry(hr * 0.1, hr * 0.1, hr * 0.15, 10).rotateX(Math.PI / 2), toyMat('soft', '#9fd2ee'), { parent: head, at: [0, -hr * 0.3, hr * 1.0] });
  // trim accessories
  if (T.style === 'luxe') {
    const crown = lathe([[hr * 0.5, 0], [hr * 0.55, hr * 0.35], [hr * 0.48, hr * 0.35], [hr * 0.44, hr * 0.05]], 24);
    mesh(crown, toyMat('gold', '#e0b040'), { parent: head, at: [0, hr * 0.85, 0] });
  } else if (T.style === 'space') {
    mesh(new THREE.SphereGeometry(hr * 1.45, 24, 18), toyMat('clear', '#cfe8ff'), { parent: head });
    mesh(roundedBox(0.05 * k, 0.06 * k, 0.03 * k, 0.008 * k), toyMat('metal', '#e0e3e8'), { parent: g, at: [0, shY - 0.04 * k, -0.04 * k] });
  } else if (T.style === 'tin' || T.name === 'vintage') {
    mesh(lathe([[0, 0], [hr * 1.4, 0], [hr * 1.4, hr * 0.06], [hr * 0.8, hr * 0.08], [hr * 0.75, hr * 0.6], [0, hr * 0.62]], 24), outfit2, { parent: head, at: [0, hr * 0.62, 0] });
  } else if (T.style === 'jumbo') {
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(hr * 0.35, 12, 10).scale(1.3, 0.7, 0.5), c.m(2), { parent: head, at: [s * hr * 0.4, hr * 0.95, 0] });
  }
  return { g, arms, head, shY };
}

/** One nesting doll shell (lathe), height h. */
function nestDoll(parent, c, h, i, at) {
  const s = h;
  const prof = [[0, 0], [0.32 * s, 0], [0.36 * s, 0.08 * s], [0.37 * s, 0.35 * s], [0.3 * s, 0.55 * s], [0.25 * s, 0.62 * s], [0.29 * s, 0.75 * s], [0.27 * s, 0.9 * s], [0.15 * s, 0.98 * s], [0, s]];
  const map = canvasTex(256, 128, (g, w, hh) => {
    g.fillStyle = '#' + M.toColor(c.color(i)).getHexString(); g.fillRect(0, 0, w, hh);
    g.fillStyle = '#fbe8d0'; g.beginPath(); g.ellipse(w * 0.75, hh * 0.22, w * 0.07, hh * 0.13, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff6e0'; g.beginPath(); g.ellipse(w * 0.75, hh * 0.65, w * 0.1, hh * 0.22, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#' + M.toColor(c.color(i + 2)).getHexString();
    for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(w * 0.75 + Math.cos(k * 1.26) * w * 0.05, hh * 0.65 + Math.sin(k * 1.26) * hh * 0.1, hh * 0.04, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#222'; g.beginPath(); g.arc(w * 0.73, hh * 0.21, 2.5, 0, 7); g.arc(w * 0.77, hh * 0.21, 2.5, 0, 7); g.fill();
  }, `nest-${c.T.name}-${i}`);
  const mat = map ? new THREE.MeshPhysicalMaterial({ map, roughness: 0.35, clearcoat: 0.8 }) : c.m(i);
  return mesh(lathe(prof, 32), mat, { parent, at });
}

export const createToyDoll = toyFactory('toy-doll', DOLL_VARIANTS, (c) => {
  const { root, T, v, variant, r } = c;
  const tone = M.SKIN_TONES[Math.floor(r() * M.SKIN_TONES.length)];
  if (v.peg) {
    // family of wooden peg dolls on a little base
    mesh(roundedBox(0.16, 0.012, 0.06, 0.004), toyMat('rawwood', 'walnut'), { parent: root, at: [0, 0.006, 0] });
    [0.07, 0.055, 0.045, 0.035].forEach((h, i) => {
      const x = -0.055 + i * 0.037;
      mesh(lathe([[0, 0], [0.012, 0], [0.013, h * 0.55], [0.009, h * 0.62], [0, h * 0.62]], 20), c.m(i), { parent: root, at: [x, 0.012, 0] });
      mesh(new THREE.SphereGeometry(h * 0.2, 16, 12), toyMat('rawwood', 'maple'), { parent: root, at: [x, 0.012 + h * 0.6 + h * 0.18, 0] });
      mesh(new THREE.SphereGeometry(h * 0.21, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), toyMat('wood', ['#3a2414', '#e0b060', '#7a3a1a', '#1a1a1a'][i]), { parent: root, at: [x, 0.012 + h * 0.6 + h * 0.2, -0.001] });
    });
    return;
  }
  if (v.nesting) {
    const hs = [0.16, 0.125, 0.095, 0.07, 0.048];
    let x = -0.11;
    hs.forEach((h, i) => { nestDoll(root, c, h, i, [x, 0, 0]); x += h * 0.37 + (hs[i + 1] ?? 0) * 0.37 + 0.003; });
    // open largest doll half next to the row: hollow lower shell
    const s = 0.16;
    mesh(lathe([[0, 0], [0.32 * s, 0], [0.36 * s, 0.08 * s], [0.37 * s, 0.35 * s], [0.35 * s, 0.35 * s], [0.34 * s, 0.09 * s], [0.3 * s, 0.015 * s], [0, 0.015 * s]], 32), c.m(0), { parent: root, at: [-0.03, 0, 0.1] });
    return;
  }
  const H = v.slim ? 0.3 : v.baby ? 0.25 : 0.32;
  const { arms, head } = dollFigure(root, c, v, { H, skinTone: tone });
  if (v.slim) {
    mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.008, 28), BLACK, { parent: root, at: [0, -0.004, 0] });
  }
  if (variant === 'boy') {
    // cap + ball at his feet
    const hb = new THREE.Box3().setFromObject(head);
    void hb;
    mesh(new THREE.SphereGeometry(0.035, 20, 14), c.m(2), { parent: root, at: [0.08, 0.035, 0.05] });
  } else if (variant === 'baby') {
    // pram beside the baby: hollow bassinet on four wheels with a push handle
    const pr = group('pram', { parent: root, at: [0.2, 0, 0] });
    const pm = c.m(1);
    mesh(lathe([[0, 0], [0.07, 0], [0.085, 0.05], [0.08, 0.055], [0.064, 0.006], [0, 0.006]], 32).scale(1.4, 1, 1), pm, { parent: pr, at: [0, 0.06, 0] }).material.side = THREE.DoubleSide;
    mesh(new THREE.SphereGeometry(0.085, 24, 12, 0, Math.PI, 0, Math.PI / 2).scale(1.0, 0.9, 1).rotateY(Math.PI / 2), c.m(2), { parent: pr, at: [-0.05, 0.11, 0] }).material.side = THREE.DoubleSide;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      tube([sx * 0.07, 0.065, sz * 0.05], [sx * 0.08, 0.03, sz * 0.065], 0.003, CHROME, { parent: pr });
      mesh(new THREE.TorusGeometry(0.024, 0.006, 8, 20), BLACK, { parent: pr, at: [sx * 0.08, 0.03, sz * 0.07] });
    }
    curveTube([[0.1, 0.1, -0.05], [0.16, 0.2, -0.05], [0.16, 0.2, 0.05], [0.1, 0.1, 0.05]], 0.004, CHROME, { parent: pr, segments: 16 });
  } else if (variant === 'rag-doll') {
    // wooden doll stand: round base with a post behind the doll
    mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.015, 28), toyMat('rawwood', 'walnut'), { parent: root, at: [0, -0.0075, 0] });
    tube([0, 0, -0.035], [0, H * 0.55, -0.035], 0.005, toyMat('rawwood', 'walnut'), { parent: root });
    mesh(new THREE.TorusGeometry(0.03, 0.004, 8, 20, Math.PI), toyMat('rawwood', 'walnut'), { parent: root, at: [0, H * 0.55, -0.005], rot: [Math.PI / 2, 0, Math.PI] });
  }
  c.anims.push(clip('wave', 1.4, [rotateTrack(arms[1], 'z', 1.4, (t) => pingPong(t) * 2.2), rotateTrack(head, 'y', 1.4, (t) => wave(t) * 0.25)]));
  void variant;
}, { base: 'classic' });

/* ============================== DOLLHOUSE ============================== */
export const DOLLHOUSE_VARIANTS = {
  cottage: { pal: ['#f4f0e6', '#c0392b', '#2e6da4', '#e0ad3a', '#ffffff', '#5b3a24'], w: 0.6, floors: 2, roof: 'gable', d: 0.32 },
  townhouse: { pal: ['#a0522d', '#2f3e4e', '#f2e6c8', '#3a7d44', '#f7f5f0', '#2a1a10'], w: 0.42, floors: 3, roof: 'flat', d: 0.32 },
  villa: { pal: ['#f2d7b6', '#c96a3c', '#3a7bd5', '#f4c20d', '#ffffff', '#6e4a2c'], w: 0.9, floors: 2, roof: 'hip', d: 0.36 },
  'a-frame': { pal: ['#c79a5e', '#2f5a3a', '#e5402a', '#f2c500', '#f7f5f0', '#3a2414'], w: 0.55, floors: 1, roof: 'aframe', d: 0.34 },
  'tower-house': { pal: ['#9fd2ee', '#7a5ec8', '#f4a9bf', '#fbe39a', '#fffaf2', '#4b3a6b'], w: 0.38, floors: 4, roof: 'cone', d: 0.32 },
  'bungalow-cabin': { pal: ['#7a4e2a', '#3a5a3a', '#e0ad3a', '#c0392b', '#efe2c4', '#2a1a10'], w: 0.7, floors: 1, roof: 'gable', d: 0.36 },
};

function miniFurniture(parent, c, kind, at, s = 1) {
  const g = group(null, { parent, at });
  if (kind === 0) { // bed
    mesh(roundedBox(0.1 * s, 0.025 * s, 0.06 * s, 0.006), c.m(1), { parent: g, at: [0, 0.0125 * s, 0] });
    mesh(roundedBox(0.012 * s, 0.05 * s, 0.06 * s, 0.004), toyMat('rawwood', 'walnut'), { parent: g, at: [-0.05 * s, 0.025 * s, 0] });
    mesh(roundedBox(0.025 * s, 0.01 * s, 0.045 * s, 0.004), WHITE, { parent: g, at: [-0.03 * s, 0.03 * s, 0] });
  } else if (kind === 1) { // sofa
    mesh(roundedBox(0.09 * s, 0.025 * s, 0.04 * s, 0.008), c.m(2), { parent: g, at: [0, 0.0125 * s, 0] });
    mesh(roundedBox(0.09 * s, 0.03 * s, 0.012 * s, 0.005), c.m(2), { parent: g, at: [0, 0.03 * s, -0.016 * s] });
  } else if (kind === 2) { // table + chairs
    mesh(new THREE.CylinderGeometry(0.025 * s, 0.025 * s, 0.004 * s, 20), toyMat('rawwood', 'oak'), { parent: g, at: [0, 0.035 * s, 0] });
    mesh(new THREE.CylinderGeometry(0.004 * s, 0.01 * s, 0.035 * s, 10), toyMat('rawwood', 'oak'), { parent: g, at: [0, 0.0175 * s, 0] });
    for (const sx of [-1, 1]) mesh(roundedBox(0.018 * s, 0.022 * s, 0.018 * s, 0.003), c.m(3), { parent: g, at: [sx * 0.04 * s, 0.011 * s, 0] });
  } else { // bathtub (hollow)
    mesh(lathe([[0, 0], [0.025, 0], [0.03, 0.03], [0.027, 0.03], [0.022, 0.004], [0, 0.004]], 24).scale(1.8 * s, s, s), WHITE, { parent: g });
  }
  return g;
}

export const createDollhouse = toyFactory('dollhouse', DOLLHOUSE_VARIANTS, (c) => {
  const { root, T, v } = c;
  const { w, floors, d } = v;
  const fh = 0.2;
  const t = 0.012;
  const wallM = c.m(4);
  const outM = c.m(0);
  const floorM = toyMat(T.kind === 'metal' ? 'metal' : 'rawwood', T.kind === 'metal' ? T.pal[2] : 'oak');
  const H = floors * fh;
  // base
  mesh(c.box(w + 0.04, t, d + 0.03, 0.2), c.m(5), { parent: root, at: [0, t / 2, 0] });
  // floors
  for (let f = 1; f <= floors; f++) mesh(roundedBox(w, t, d, 0.002), floorM, { parent: root, at: [0, t + f * fh - t / 2, 0] });
  // back wall (inside coloured), side walls; the front is open
  mesh(roundedBox(w, H, t, 0.003), wallM, { parent: root, at: [0, t + H / 2, -d / 2 + t / 2] });
  for (const s of [-1, 1]) {
    const sw = new THREE.Shape();
    sw.moveTo(-d / 2, 0); sw.lineTo(d / 2, 0); sw.lineTo(d / 2, H); sw.lineTo(-d / 2, H); sw.lineTo(-d / 2, 0);
    for (let f = 0; f < floors; f++) {
      const hp = new THREE.Path(); const y = f * fh + fh * 0.4;
      hp.moveTo(-0.04, y); hp.lineTo(-0.04, y + 0.08); hp.lineTo(0.04, y + 0.08); hp.lineTo(0.04, y); hp.lineTo(-0.04, y);
      sw.holes.push(hp);
    }
    mesh(extrudeOutline(sw, t, { bevel: 0.002, segments: 1 }).rotateY(Math.PI / 2), outM, { parent: root, at: [s * (w / 2 - t / 2), t, 0] });
  }
  // interior partitions on the ground floor
  if (w > 0.5) mesh(roundedBox(t, fh - t, d - t, 0.002), wallM, { parent: root, at: [w * 0.12, t + (fh - t) / 2, 0] });
  // stairs
  if (floors > 1) for (let k = 0; k < 7; k++) { const hk = (k + 1) * (fh - t) / 7; mesh(roundedBox(0.06, hk, 0.03, 0.002), floorM, { parent: root, at: [-w / 2 + t + 0.032, t + hk / 2, -d / 2 + t + 0.02 + k * 0.03] }); }
  // roof
  const roofM = c.m(T.style === 'rainbow' ? 3 : 1);
  if (v.roof === 'gable' || v.roof === 'aframe' || v.roof === 'hip') {
    const rh = v.roof === 'aframe' ? 0.45 : 0.18;
    const ov = 0.03;
    const half = w / 2 + ov;
    const L = Math.hypot(half, rh);
    const a = Math.atan2(rh, half);
    const top = t + H + (v.roof === 'aframe' ? 0 : 0);
    for (const s of [-1, 1]) {
      mesh(roundedBox(L + 0.01, 0.014, d + 0.05, 0.004), roofM, { parent: root, at: [s * half / 2, top + rh / 2, 0.01], rot: [0, 0, -s * a] });
    }
    // back gable
    const gs = new THREE.Shape(); gs.moveTo(-w / 2, 0); gs.lineTo(w / 2, 0); gs.lineTo(0, rh * (w / 2) / half); gs.lineTo(-w / 2, 0);
    mesh(extrudeOutline(gs, t, { bevel: 0.002, segments: 1 }), outM, { parent: root, at: [0, top, -d / 2 + t / 2] });
    mesh(roundedBox(0.05, 0.1, 0.05, 0.004), c.m(5), { parent: root, at: [w * 0.25, top + rh * 0.55, -0.05] });
  } else if (v.roof === 'flat') {
    mesh(c.box(w + 0.03, 0.02, d + 0.03, 0.2), roofM, { parent: root, at: [0, t + H + 0.01, 0] });
    for (let i = 0; i < 6; i++) mesh(roundedBox(0.02, 0.025, 0.02, 0.003), roofM, { parent: root, at: [-w / 2 + 0.01 + i * (w - 0.02) / 5, t + H + 0.032, d / 2] });
  } else if (v.roof === 'cone') {
    mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.02, 0.3, 4, 1).rotateY(Math.PI / 4), roofM, { parent: root, at: [0, t + H + 0.15, 0] });
  }
  // furniture
  for (let f = 0; f < floors; f++) {
    const y = t + f * fh;
    miniFurniture(root, c, (f * 2) % 4, [w * 0.22, y, -0.02], 1);
    if (w > 0.4) miniFurniture(root, c, (f * 2 + 1) % 4, [-w * 0.12, y, 0.02], 1);
  }
  // front door on the side wall (swinging)
  const door = group('door', { parent: root, at: [w / 2, t, d * 0.1] });
  mesh(roundedBox(0.008, 0.11, 0.06, 0.002), c.m(2), { parent: door, at: [0.004, 0.055, -0.03] });
  mesh(new THREE.SphereGeometry(0.004, 8, 6), toyMat('gold', '#d4a73a'), { parent: door, at: [0.01, 0.055, -0.052] });
  mesh(roundedBox(0.04, 0.008, 0.08, 0.002), c.m(5), { parent: root, at: [w / 2 + 0.03, t + 0.004, d * 0.1 - 0.03] });
  if (T.style === 'luxe') for (let i = 0; i < 3; i++) tube([-w / 2 + 0.02 + i * (w / 2 - 0.04), t, d / 2 - 0.01], [-w / 2 + 0.02 + i * (w / 2 - 0.04), t + fh, d / 2 - 0.01], 0.008, toyMat('stone', '#f2ede4'), { parent: root });
  c.anims.push(clip('open', 3, [rotateTrack(door, 'y', 3, (t) => -pingPong(t) * 1.4)]));
}, { base: 'wooden' });
