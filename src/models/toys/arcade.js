// Arcade & game-room: arcade cabinets, pinball machines, claw / capsule machines and toy chests.
import {
  THREE, M, mesh, group, roundedBox, lathe, hollowLathe, curveTube, extrudeOutline, tube, merged, toyMat, toyFactory, canvasTex,
  BLACK, WHITE, CHROME, RUBBER, clip, rotateTrack, moveTrack, spinTrack, scaleTrack, wave, pingPong, bulbs, screen,
} from './kit.js';

const hex = (c) => '#' + M.toColor(c).getHexString();
/** Side profile [(z,y)…] extruded across width W (centred on X). */
const sideBody = (pts, W, bevel = 0.004) => extrudeOutline(pts, W, { bevel, segments: 2 }).rotateY(-Math.PI / 2);

/** Plane placed on the segment p→q of a side profile (z,y), facing its outward normal. */
function onSlope(p, q, w, frac = 0.8, off = 0.004) {
  const dz = q[0] - p[0];
  const dy = q[1] - p[1];
  const len = Math.hypot(dz, dy);
  // outward normal for a clockwise-in-(z,y) outline walking up the front
  let nz = dy / len;
  let ny = -dz / len;
  if (nz < 0) { nz = -nz; ny = -ny; }
  const geo = new THREE.PlaneGeometry(w, len * frac);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, ny, nz)));
  geo.translate(0, (p[1] + q[1]) / 2 + ny * off, (p[0] + q[0]) / 2 + nz * off);
  return { geo, normal: [0, ny, nz], len };
}

/** Pixel-game screen art (browser only). */
function gameArt(c, kind) {
  return (x, w, h) => {
    x.fillStyle = '#05060f'; x.fillRect(0, 0, w, h);
    const P = c.T.pal.map(hex);
    if (kind === 'race') {
      x.fillStyle = '#2a6a2a'; x.fillRect(0, h * 0.45, w, h);
      x.fillStyle = '#555'; x.beginPath(); x.moveTo(w * 0.45, h * 0.45); x.lineTo(w * 0.55, h * 0.45); x.lineTo(w * 0.9, h); x.lineTo(w * 0.1, h); x.fill();
      x.fillStyle = '#fff'; for (let i = 0; i < 5; i++) x.fillRect(w * 0.495, h * (0.5 + i * 0.1), w * 0.01, h * 0.05);
      x.fillStyle = P[0]; x.fillRect(w * 0.42, h * 0.78, w * 0.16, h * 0.12);
      x.fillStyle = '#ff9a3a'; x.beginPath(); x.arc(w * 0.8, h * 0.2, 14, 0, 7); x.fill();
      return;
    }
    // space shooter: invaders grid, ship, stars
    x.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) x.fillRect((i * 53) % w, (i * 97) % h, 2, 2);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 8; k++) {
      x.fillStyle = P[r % 4]; const px = 30 + k * 26; const py = 24 + r * 22;
      x.fillRect(px, py, 16, 8); x.fillRect(px + 2, py + 8, 4, 4); x.fillRect(px + 10, py + 8, 4, 4); x.fillRect(px + 4, py - 4, 8, 4);
    }
    x.fillStyle = '#5cff8a'; x.fillRect(w * 0.45, h * 0.86, 24, 8); x.fillRect(w * 0.45 + 9, h * 0.82, 6, 6);
    x.fillStyle = '#fff'; x.font = 'bold 14px monospace'; x.fillText('SCORE 004200', 8, 14);
  };
}
function marqueeArt(c, text) {
  return (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, hex(c.T.pal[0])); g.addColorStop(1, hex(c.T.pal[1]));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = hex(c.T.pal[2]); x.font = `bold ${Math.round(Math.min(h * 0.55, w / (text.length * 0.72)))}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, w / 2, h / 2);
  };
}

function buttons(parent, c, at, n, name) {
  const cols = [0, 1, 2, 3, 0, 1];
  const geoByCol = {};
  for (let i = 0; i < n; i++) {
    const k = cols[i];
    (geoByCol[k] ??= []).push(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 16).translate(at[0] + (i % 3) * 0.04, at[1] + 0.006, at[2] - Math.floor(i / 3) * 0.035));
  }
  for (const [k, list] of Object.entries(geoByCol)) merged(list, toyMat('neon', c.T.pal[k]), { parent, name: `${name}_btn${k}` });
}
function joystick(parent, c, at, name) {
  const j = group(name, { parent, at });
  mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.006, 18), BLACK, { parent: j, at: [0, 0.003, 0] });
  tube([0, 0, 0], [0, 0.06, 0], 0.004, CHROME, { parent: j });
  mesh(new THREE.SphereGeometry(0.016, 16, 12), toyMat('plastic', c.T.pal[0]), { parent: j, at: [0, 0.066, 0] });
  return j;
}

/* ============================== ARCADE CABINETS ============================== */
export const ARCADE_VARIANTS = {
  upright: { kind: 'upright' },
  'cocktail-table': { kind: 'cocktail' },
  bartop: { kind: 'bartop' },
  'racing-sim': { kind: 'racing' },
};

export const createArcadeCabinet = toyFactory('arcade-cabinet', ARCADE_VARIANTS, (c) => {
  const { root, T, v } = c;
  const body = c.m(T.style === 'wood' || T.kind === 'rawwood' ? 0 : 5);
  const side = c.m(0);
  const tracks = [];
  const art = gameArt(c, v.kind === 'racing' ? 'race' : 'shoot');
  const upright = (parent, s, W, kind) => {
    const P = (z, y) => [z * s, y * s];
    const A = P(-0.4, 0); const B = P(0.3, 0); const C = P(0.3, 0.82); const D = P(0.46, 0.92); const E = P(0.46, 0.97);
    const F = P(0.22, 1.02); const G = P(0.1, 1.45); const H = P(0.32, 1.52); const I = P(0.32, 1.78); const J = P(-0.4, 1.78);
    const prof = [A, B, C, D, E, F, G, H, I, J];
    const t = 0.02 * s;
    mesh(sideBody(prof, W - 2 * t, 0.003), body, { parent });
    for (const sx of [-1, 1]) mesh(sideBody(prof, t, 0.004 * s), side, { parent, at: [sx * (W / 2 - t / 2), 0, 0] });
    // side art stripe
    for (const sx of [-1, 1]) mesh(new THREE.CircleGeometry(0.18 * s, 28).rotateY(sx * Math.PI / 2), toyMat('neon', T.pal[1]), { parent, at: [sx * (W / 2 + 0.0045 * s), 1.1 * s, -0.12 * s] });
    // screen + bezel
    const sc = onSlope(F, G, W - 2 * t - 0.08 * s, 0.78, 0.003);
    const bz = onSlope(F, G, W - 2 * t - 0.01, 0.98, 0.0015);
    mesh(bz.geo, BLACK, { parent });
    tracks.push(...screen(parent, sc.geo, { name: 'screen', draw: art, key: `arcade-${T.name}-${v.kind}`, normal: sc.normal, color: '#4a7dff' }));
    // marquee
    const mq = new THREE.PlaneGeometry(W - 2 * t - 0.02, (I[1] - H[1]) * 0.8).translate(0, (H[1] + I[1]) / 2, H[0] + 0.003);
    tracks.push(...screen(parent, mq, { name: 'marquee', draw: marqueeArt(c, kind === 'racing' ? 'TURBO' : 'PLAY!'), key: `marq-${T.name}-${kind}`, normal: [0, 0, 1], intensity: 2 }));
    // control panel
    const cpY = (E[1] + F[1]) / 2;
    const cpZ = (E[0] + F[0]) / 2;
    const tilt = Math.atan2(F[1] - E[1], E[0] - F[0]);
    const cp = group('panel', { parent, at: [0, cpY, cpZ], rot: [tilt, 0, 0] });
    if (kind === 'racing') {
      const wheel = group('steering', { parent: cp, at: [0, 0.07 * s, 0.02 * s], rot: [1.1, 0, 0] });
      tube([0, -0.08 * s, 0], [0, 0, 0], 0.012 * s, BLACK, { parent: wheel });
      mesh(new THREE.TorusGeometry(0.13 * s, 0.014 * s, 10, 32), BLACK, { parent: wheel, rot: [Math.PI / 2, 0, 0] });
      mesh(new THREE.CylinderGeometry(0.035 * s, 0.035 * s, 0.03 * s, 18), toyMat('plastic', T.pal[0]), { parent: wheel });
      for (const a of [0, 2.1, 4.2]) tube([0, 0, 0], [Math.cos(a) * 0.13 * s, 0, Math.sin(a) * 0.13 * s], 0.008 * s, BLACK, { parent: wheel });
      c.anims.push(clip('steer', 3, [rotateTrack(wheel, 'y', 3, (u) => wave(u) * 0.6)]));
    } else {
      const js = joystick(cp, c, [-0.12 * s, 0, 0.0], 'joystick');
      buttons(cp, c, [0.0, 0, 0.03 * s], 6, 'p1');
      c.anims.push(clip('play', 2, [rotateTrack(js, 'z', 2, (u) => wave(u, 2) * 0.3), rotateTrack(js, 'x', 2, (u) => wave(u + 0.25, 1) * 0.25)]));
    }
    // coin door
    mesh(roundedBox(0.24 * s, 0.3 * s, 0.01 * s, 0.006 * s), toyMat('metal', '#3a3a3e'), { parent, at: [0, 0.45 * s, B[0] + 0.005 * s] });
    tracks.push(...bulbs(parent, 'coin', 'red', [[[-0.05 * s, 0.5 * s, B[0] + 0.011 * s], [0, 0, 1]], [[0.05 * s, 0.5 * s, B[0] + 0.011 * s], [0, 0, 1]]], { r: 0.012 * s, blink: 1.5 }));
    // T-molding stripes along the side edges
    return { top: I[1] };
  };
  if (v.kind === 'upright') upright(root, 1, 0.66, 'upright');
  else if (v.kind === 'racing') {
    upright(root, 1.05, 0.8, 'racing');
    // seat bucket on a rail touching the cabinet
    mesh(roundedBox(0.3, 0.06, 1.0, 0.02), body, { parent: root, at: [0, 0.03, 0.82] });
    const seat = group('seat', { parent: root, at: [0, 0.06, 1.05] });
    mesh(roundedBox(0.5, 0.28, 0.5, 0.06), side, { parent: seat, at: [0, 0.14, 0] });
    mesh(new THREE.CapsuleGeometry(0.2, 0.12, 8, 20).scale(1.1, 1, 0.5), toyMat('plush', T.pal[5]), { parent: seat, at: [0, 0.5, 0.18], rot: [-0.2, 0, 0] });
    mesh(roundedBox(0.44, 0.08, 0.42, 0.04), toyMat('plush', T.pal[5]), { parent: seat, at: [0, 0.32, -0.02] });
    // pedals on the base rail
    for (const sx of [-1, 1]) mesh(roundedBox(0.07, 0.015, 0.12, 0.005), CHROME, { parent: root, at: [sx * 0.06, 0.07, 0.45], rot: [-0.4, 0, 0] });
  } else if (v.kind === 'bartop') {
    // half-size cabinet on a counter cabinet
    const ct = 0.9;
    mesh(roundedBox(0.7, ct - 0.03, 0.5, 0.02), toyMat('rawwood', T.kind === 'rawwood' ? 'walnut' : 'oak'), { parent: root, at: [0, (ct - 0.03) / 2, 0] });
    mesh(roundedBox(0.76, 0.03, 0.56, 0.01), toyMat('rawwood', 'walnut'), { parent: root, at: [0, ct - 0.015, 0] });
    const g = group('bartop', { parent: root, at: [0, ct, 0.02] });
    upright(g, 0.42, 0.42, 'bartop');
  } else {
    // cocktail table cabinet: screen faces up under a glass top, controls at both ends
    const W = 0.56;
    const H = 0.72;
    const D = 0.82;
    mesh(roundedBox(W, H - 0.02, D, 0.02), body, { parent: root, at: [0, (H - 0.02) / 2, 0] });
    for (const sz of [-1, 1]) mesh(roundedBox(W + 0.02, 0.12, 0.03, 0.01), side, { parent: root, at: [0, H * 0.45, sz * (D / 2 + 0.015)] });
    const geo = new THREE.PlaneGeometry(0.4, 0.3).rotateX(-Math.PI / 2).rotateY(Math.PI / 2).translate(0, H - 0.015, 0);
    mesh(roundedBox(0.5, 0.004, 0.42, 0.002), BLACK, { parent: root, at: [0, H - 0.018, 0] });
    tracks.push(...screen(root, geo, { name: 'screen', draw: art, key: `cocktail-${T.name}`, normal: [0, 1, 0] }));
    mesh(roundedBox(W + 0.04, 0.012, D + 0.06, 0.004), toyMat('clear', '#e8f4ff'), { parent: root, at: [0, H - 0.006 + 0.0, 0] });
    for (const sz of [-1, 1]) {
      const cp = group(null, { parent: root, at: [0, H, sz * (D / 2 + 0.02)], rot: [0, sz > 0 ? 0 : Math.PI, 0] });
      joystick(cp, c, [-0.1, 0, 0], sz > 0 ? 'joystick' : 'joystick2');
      buttons(cp, c, [0.04, 0, 0.01], 3, sz > 0 ? 'p1' : 'p2');
    }
    // four short legs → pedestal base
    mesh(roundedBox(W * 0.8, 0.02, D * 0.8, 0.008), CHROME, { parent: root, at: [0, 0.01, 0] });
  }
  c.anims.push(clip('on', 1, tracks));
}, { base: 'classic' });

/* ============================== PINBALL ============================== */
export const PINBALL_VARIANTS = {
  'classic-pinball': { art: 'classic', pal: ['#b3202a', '#1f4f8f', '#e7c14a', '#2e7d5b', '#ece4cf', '#2a2a2a'] },
  'space-pinball': { art: 'space', wide: 1.25, rocket: true, pal: ['#1b2a4a', '#4fc3f7', '#ff6b1a', '#c9ced6', '#f2f2f2', '#0f1420'] },
  'tabletop-pinball': { art: 'toy', toy: true, pal: ['#ff5c8a', '#6ad1ff', '#ffd23f', '#06d6a0', '#fff4f8', '#7a2348'] },
};

export const createPinball = toyFactory('pinball-machine', PINBALL_VARIANTS, (c) => {
  const { root, T, v } = c;
  const s = v.toy ? 0.32 : 1;
  const L = 1.25 * s;
  const W = 0.7 * s * (v.wide ?? 1);
  const yFront = v.toy ? 0.06 : 0.8;
  const slope = 0.12;
  const yBack = yFront + L * Math.tan(slope);
  const cab = c.m(0);
  const trimM = T.style === 'luxe' || T.style === 'tin' ? CHROME : c.m(5);
  const tracks = [];
  // legs (4 chrome legs with feet) or a toy's flat base
  if (!v.toy) {
    for (const sx of [-1, 1]) for (const [sz, yy] of [[1, yFront], [-1, yBack]]) {
      tube([sx * (W / 2 - 0.05), 0.02, sz * (L / 2 - 0.06)], [sx * (W / 2 - 0.05), yy - 0.25 + 0.005, sz * (L / 2 - 0.06)], 0.03, trimM, { parent: root });
      mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.02, 16), BLACK, { parent: root, at: [sx * (W / 2 - 0.05), 0.01, sz * (L / 2 - 0.06)] });
    }
  }
  // cabinet: wedge body (front lower), hollow under the glass
  const depth = v.toy ? 0.06 * 1 : 0.25;
  const prof = [[-L / 2, yBack - depth], [L / 2, yFront - depth], [L / 2, yFront], [-L / 2, yBack]];
  if (v.toy) { prof[0][1] = 0; prof[1][1] = 0; }
  const pf = group('cabinet', { parent: root });
  mesh(sideBody(prof, W, 0.01 * s), cab, { parent: pf });
  // playfield art + glass
  const art = canvasTex(256, 448, (x, w, h) => {
    const P = T.pal.map(hex);
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, v.art === 'space' ? '#0b0f2a' : P[1]); g.addColorStop(1, v.art === 'space' ? '#2a0b3a' : P[4]);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    if (v.art === 'space') { x.fillStyle = '#fff'; for (let i = 0; i < 60; i++) x.fillRect((i * 37) % w, (i * 71) % h, 2, 2); x.fillStyle = P[2]; x.beginPath(); x.arc(w * 0.7, h * 0.25, 40, 0, 7); x.fill(); }
    x.strokeStyle = P[2]; x.lineWidth = 6; x.beginPath(); x.arc(w / 2, h * 0.3, w * 0.38, Math.PI, 0); x.stroke();
    for (let i = 0; i < 6; i++) { x.fillStyle = P[i % 4]; x.beginPath(); x.moveTo(w * 0.2 + i * 30, h * 0.6); x.lineTo(w * 0.2 + i * 30 + 10, h * 0.65); x.lineTo(w * 0.2 + i * 30 - 10, h * 0.65); x.fill(); }
    x.fillStyle = P[0]; x.font = 'bold 28px sans-serif'; x.textAlign = 'center'; x.fillText(v.art === 'space' ? 'ORBIT' : 'BONUS', w / 2, h * 0.5);
  }, `pinball-${T.name}-${v.art}`);
  const lenS = Math.hypot(L, yBack - yFront);
  const pfGroup = group('playfield', { parent: pf, at: [0, (yFront + yBack) / 2 + 0.01 * s, 0], rot: [slope, 0, 0] });
  // tilt so local +z points to the front-low end: rotate about X by +slope tips +z down
  mesh(new THREE.PlaneGeometry(W - 0.06 * s, lenS - 0.06 * s).rotateX(-Math.PI / 2), art ? new THREE.MeshStandardMaterial({ map: art, roughness: 0.4 }) : c.m(4), { parent: pfGroup, at: [0, 0.0015, 0] });
  // side rails above the playfield (glass sits on them)
  const rh = 0.07 * s;
  for (const sx of [-1, 1]) mesh(roundedBox(0.03 * s, rh, lenS, 0.008 * s), trimM, { parent: pfGroup, at: [sx * (W / 2 - 0.015 * s), rh / 2, 0] });
  mesh(roundedBox(W, rh, 0.03 * s, 0.008 * s), trimM, { parent: pfGroup, at: [0, rh / 2, lenS / 2 - 0.015 * s] });
  mesh(roundedBox(W - 0.04 * s, 0.006 * s, lenS - 0.04 * s, 0.002), toyMat('clear', '#eef8ff'), { parent: pfGroup, at: [0, rh + 0.003 * s, 0] });
  // bumpers (lit caps), slingshots, flippers, ball, plunger
  const bumpers = [[-0.12, -0.25], [0.12, -0.25], [0, -0.1]];
  const bl = bulbs(pfGroup, 'bumpers', 'amber', bumpers.map(([x, z]) => [[x * s, 0.055 * s, z * s], [0, 1, 0]]), { r: 0.03 * s, blink: 3 });
  tracks.push(...bl);
  for (const [x, z] of bumpers) {
    mesh(new THREE.CylinderGeometry(0.04 * s, 0.045 * s, 0.05 * s, 22), c.m(1), { parent: pfGroup, at: [x * s, 0.025 * s, z * s] });
    mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.006 * s, 22), WHITE, { parent: pfGroup, at: [x * s, 0.03 * s, z * s] });
  }
  for (const sx of [-1, 1]) {
    mesh(extrudeOutline([[0, 0], [0.09 * s, 0.13 * s], [0, 0.16 * s]], 0.04 * s, { bevel: 0.006 * s, segments: 2 }).rotateX(-Math.PI / 2).scale(sx, 1, 1), c.m(2), { parent: pfGroup, at: [sx * 0.2 * s, 0.02 * s, 0.38 * s] });
  }
  const flippers = [];
  for (const sx of [-1, 1]) {
    const f = group(`flipper${sx > 0 ? 'R' : 'L'}`, { parent: pfGroup, at: [sx * 0.12 * s, 0.012 * s, 0.5 * s], rot: [0, sx * 0.5, 0] });
    mesh(new THREE.CapsuleGeometry(0.014 * s, 0.07 * s, 4, 10).rotateZ(Math.PI / 2).translate(-sx * 0.045 * s, 0, 0), WHITE, { parent: f });
    tube([-sx * 0.0, 0, 0], [-sx * 0.0, -0.012 * s, 0], 0.006 * s, CHROME, { parent: f });
    flippers.push([f, sx]);
  }
  const ball = group('ball', { parent: pfGroup, at: [0.05 * s, 0.0145 * s, 0.25 * s] });
  mesh(new THREE.SphereGeometry(0.0135 * s, 18, 14), CHROME, { parent: ball });
  // plunger out the front-right
  const pl = group('plunger', { parent: pf, at: [W / 2 - 0.06 * s, yFront - 0.06 * s, L / 2] });
  tube([0, 0, 0], [0, 0, 0.06 * s], 0.006 * s, CHROME, { parent: pl });
  mesh(new THREE.SphereGeometry(0.02 * s, 14, 10), c.m(2), { parent: pl, at: [0, 0, 0.07 * s] });
  // backbox with lit display
  const bbH = v.toy ? 0.22 * s * 1.6 : 0.75;
  const bbD = 0.2 * s;
  mesh(roundedBox(W, 0.12 * s, bbD, 0.01 * s), cab, { parent: root, at: [0, yBack + 0.06 * s - 0.005, -L / 2 + bbD / 2] });
  mesh(roundedBox(W, bbH, bbD, 0.015 * s), cab, { parent: root, at: [0, yBack + 0.12 * s + bbH / 2 - 0.006, -L / 2 + bbD / 2] });
  if (v.rocket) {
    // rocket topper + swept fins on the backbox
    const top = yBack + 0.12 * s + bbH - 0.012;
    const rk = group('rocket', { parent: root, at: [0, top, -L / 2 + bbD / 2] });
    mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.3, 24), CHROME, { parent: rk, at: [0, 0.15, 0] });
    mesh(new THREE.ConeGeometry(0.07, 0.18, 24), c.m(2), { parent: rk, at: [0, 0.39, 0] });
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; mesh(extrudeOutline([[0, 0], [0.09, 0], [0.0, 0.14]], 0.012, { bevel: 0.003 }), c.m(2), { parent: rk, at: [Math.cos(a) * 0.07, 0.0, Math.sin(a) * 0.07], rot: [0, -a, 0] }); }
    for (const sx of [-1, 1]) mesh(extrudeOutline([[0, 0], [0, bbH], [-0.12, bbH * 0.3]], 0.02, { bevel: 0.005 }).rotateY(-Math.PI / 2).scale(1, 1, 1), c.m(1), { parent: root, at: [sx * (W / 2 + 0.01), yBack + 0.12 * s, -L / 2 + bbD] });
  }
  const bg = new THREE.PlaneGeometry(W * 0.86, bbH * 0.62).translate(0, yBack + 0.12 * s + bbH * 0.6, -L / 2 + bbD + 0.002);
  tracks.push(...screen(root, bg, { name: 'backglass', draw: marqueeArt(c, v.art === 'space' ? 'ORBIT' : 'BONUS'), key: `bg-${T.name}-${v.art}`, normal: [0, 0, 1], intensity: 2 }));
  const dmd = new THREE.PlaneGeometry(W * 0.5, bbH * 0.16).translate(0, yBack + 0.12 * s + bbH * 0.17, -L / 2 + bbD + 0.002);
  tracks.push(...screen(root, dmd, { name: 'score', color: '#ff7a1a', normal: [0, 0, 1], draw: (x, w, h) => { x.fillStyle = '#120600'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff8a1a'; x.font = 'bold 90px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('1,250,000', w / 2, h / 2); }, key: 'pin-score' }));
  c.anims.push(clip('on', 1, tracks));
  const flip = (u) => (Math.sin(u * Math.PI * 4) > 0.6 ? 1 : 0);
  c.anims.push(clip('play', 2, [
    ...flippers.map(([f, sx]) => rotateTrack(f, 'y', 2, (u) => -sx * flip(u + (sx > 0 ? 0.1 : 0)) * 0.8, 48)),
    moveTrack(ball, 2, (u) => [Math.sin(u * Math.PI * 2) * 0.1 * s, 0, -Math.sin(u * Math.PI) * 0.5 * s], 48),
  ]));
}, { base: 'classic' });

/* ============================== CLAW & CAPSULE MACHINES ============================== */
export const CLAW_VARIANTS = {
  'claw-crane': { kind: 'claw', s: 1 },
  'mini-claw': { kind: 'claw', s: 0.3 },
  'capsule-vendor': { kind: 'capsule', s: 1 },
};

/** Pile of little plush prizes on a floor at y0 inside half-extent hx × hz. */
function prizes(parent, c, y0, hx, hz, s, n) {
  const cols = ['#f4a9bf', '#9fd2ee', '#fbe39a', '#b4e2c4', '#d8b4f0', '#ffb07a'];
  const byCol = cols.map(() => []);
  const pr = 0.055 * s;
  const nx = Math.max(2, Math.floor((hx * 2) / (pr * 2)));
  const nz = Math.max(2, Math.floor((hz * 2) / (pr * 2)));
  let k = 0;
  for (let layer = 0; layer < 2; layer++) for (let i = 0; i < nx - layer; i++) for (let j = 0; j < nz - layer; j++) {
    if (k++ >= n) break;
    const x = -hx + pr + i * pr * 2 + layer * pr;
    const z = -hz + pr + j * pr * 2 + layer * pr;
    const y = y0 + pr * 0.85 + layer * pr * 1.45;
    const ci = (i * 3 + j * 5 + layer) % cols.length;
    byCol[ci].push(new THREE.SphereGeometry(pr, 14, 10).scale(1, 0.85, 1).translate(x, y, z));
    for (const sx of [-1, 1]) byCol[ci].push(new THREE.SphereGeometry(pr * 0.32, 8, 6).translate(x + sx * pr * 0.6, y + pr * 0.7, z));
  }
  byCol.forEach((list, i) => list.length && merged(list, toyMat('plush', cols[i]), { parent }));
}

export const createClawMachine = toyFactory('claw-machine', CLAW_VARIANTS, (c) => {
  const { root, T, v } = c;
  const s = v.s;
  const tracks = [];
  const cab = c.m(0);
  const trimM = T.style === 'luxe' || T.style === 'tin' ? CHROME : c.m(1);
  if (v.kind === 'claw') {
    const W = 0.8 * s;
    const baseH = 0.85 * s;
    const boxH = 0.85 * s;
    const t = 0.03 * s;
    // base cabinet with prize chute door
    mesh(roundedBox(W, baseH, W, 0.03 * s), cab, { parent: root, at: [0, baseH / 2, 0] });
    mesh(roundedBox(0.26 * s, 0.2 * s, 0.01 * s, 0.01 * s), BLACK, { parent: root, at: [W * 0.22, 0.3 * s, W / 2 + 0.002] });
    // control shelf
    mesh(roundedBox(W, 0.05 * s, 0.14 * s, 0.015 * s), trimM, { parent: root, at: [0, baseH - 0.025 * s, W / 2 + 0.06 * s] });
    const js = joystick(root, c, [-W * 0.2, baseH, W / 2 + 0.07 * s], 'joystick');
    js.scale.setScalar(Math.max(s, 0.5));
    mesh(new THREE.CylinderGeometry(0.025 * s, 0.025 * s, 0.015 * s, 18), toyMat('neon', T.pal[2]), { parent: root, at: [W * 0.2, baseH + 0.0075 * s, W / 2 + 0.07 * s] });
    // glass box: corner posts + clear panes + roof
    const y1 = baseH;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(t, boxH, t, t * 0.3), trimM, { parent: root, at: [sx * (W / 2 - t / 2), y1 + boxH / 2, sz * (W / 2 - t / 2)] });
    const glass = toyMat('clear', '#eaf6ff');
    for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(W - 2 * t, boxH, 0.004 * s), glass, { parent: root, at: [0, y1 + boxH / 2, sz * (W / 2 - t / 2)] });
    for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.004 * s, boxH, W - 2 * t), glass, { parent: root, at: [sx * (W / 2 - t / 2), y1 + boxH / 2, 0] });
    mesh(roundedBox(W, 0.18 * s, W, 0.03 * s), cab, { parent: root, at: [0, y1 + boxH + 0.09 * s, 0] });
    const mq = new THREE.PlaneGeometry(W * 0.86, 0.12 * s).translate(0, y1 + boxH + 0.09 * s, W / 2 + 0.002);
    tracks.push(...screen(root, mq, { name: 'marquee', draw: marqueeArt(c, 'CLAW'), key: `claw-${T.name}`, normal: [0, 0, 1], intensity: 2 }));
    // prize chute wall (inside front-right corner) + prizes on the floor
    const fl = y1;
    for (const [px, pz, w, d] of [[W * 0.22 - 0.1 * s, W * 0.22, 0.012 * s, 0.24 * s], [W * 0.22, W * 0.22 - 0.1 * s, 0.24 * s, 0.012 * s]]) mesh(roundedBox(w, 0.22 * s, d, 0.004 * s), toyMat('clear', '#ffffff'), { parent: root, at: [px, fl + 0.11 * s, pz] });
    prizes(root, c, fl, W / 2 - t, W / 2 - t - 0.12 * s, s, 30);
    // gantry: rail along x under the roof, trolley, cable, claw
    const yr = y1 + boxH - 0.03 * s;
    for (const sz of [-1, 1]) mesh(roundedBox(W - 2 * t, 0.02 * s, 0.02 * s, 0.005 * s), CHROME, { parent: root, at: [0, yr, sz * (W / 2 - t - 0.01 * s)] });
    const gant = group('gantry', { parent: root, at: [0, yr, 0] });
    mesh(roundedBox(0.03 * s, 0.02 * s, W - 2 * t, 0.006 * s), CHROME, { parent: gant });
    const trolley = group('trolley', { parent: gant, at: [0, 0, 0] });
    mesh(roundedBox(0.06 * s, 0.04 * s, 0.06 * s, 0.01 * s), c.m(5), { parent: trolley, at: [0, -0.02 * s, 0] });
    const cable = group('cable', { parent: trolley, at: [0, -0.04 * s, 0] });
    const cl = 0.32 * s;
    mesh(new THREE.CylinderGeometry(0.002 * s, 0.002 * s, cl, 6).translate(0, -cl / 2, 0), BLACK, { parent: cable });
    const claw = group('claw', { parent: trolley, at: [0, -0.04 * s - cl, 0] });
    mesh(new THREE.CylinderGeometry(0.025 * s, 0.03 * s, 0.04 * s, 16), CHROME, { parent: claw, at: [0, -0.02 * s, 0] });
    const prongs = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const p = group(`prong_${i}`, { parent: claw, at: [Math.cos(a) * 0.022 * s, -0.035 * s, Math.sin(a) * 0.022 * s], rot: [0, -a, 0] });
      curveTube([[0, 0, 0], [0.03 * s, -0.04 * s, 0], [0.02 * s, -0.08 * s, 0], [0.002 * s, -0.095 * s, 0]], 0.004 * s, CHROME, { parent: p, segments: 12, radialSegments: 6 });
      prongs.push(p);
    }
    const P = 6;
    const drop = (u) => (u < 0.3 ? 0 : u < 0.45 ? (u - 0.3) / 0.15 : u < 0.6 ? 1 : u < 0.75 ? 1 - (u - 0.6) / 0.15 : 0);
    const dd = 0.2 * s;
    c.anims.push(clip('grab', P, [
      moveTrack(gant, P, (u) => [Math.sin(Math.min(u, 0.3) / 0.3 * Math.PI * 0.5) * 0.15 * s * (u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2), 0, 0], 48),
      moveTrack(trolley, P, (u) => [0, 0, Math.sin(Math.min(u, 0.3) / 0.3 * Math.PI * 0.5) * -0.12 * s * (u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2)], 48),
      moveTrack(claw, P, (u) => [0, -drop(u) * dd, 0], 48),
      scaleTrack(cable, P, (u) => [1, 1 + (drop(u) * dd) / cl, 1], 48),
      ...prongs.map((p) => rotateTrack(p, 'z', P, (u) => (u > 0.45 && u < 0.85 ? -0.45 : 0), 48)),
    ]));
    tracks.push(...bulbs(root, 'chase', 'amber', [-0.3, -0.1, 0.1, 0.3].map((k) => [[k * W, baseH - 0.06 * s, W / 2 + 0.001], [0, 0, 1]]), { r: 0.012 * s, blink: 3 }));
  } else {
    // capsule vendor: pedestal, coin box, clear globe filled with capsules
    const ped = 0.75;
    mesh(lathe([[0, 0], [0.22, 0], [0.22, 0.03], [0.1, 0.06], [0.08, ped - 0.05], [0.12, ped], [0, ped]], 32), trimM, { parent: root });
    mesh(roundedBox(0.3, 0.28, 0.3, 0.04), cab, { parent: root, at: [0, ped + 0.14, 0] });
    // coin dial + chute
    const dial = group('dial', { parent: root, at: [0, ped + 0.18, 0.152] });
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 24).rotateX(Math.PI / 2), CHROME, { parent: dial });
    mesh(roundedBox(0.07, 0.015, 0.02, 0.006), BLACK, { parent: dial, at: [0, 0, 0.012] });
    mesh(roundedBox(0.08, 0.06, 0.02, 0.01), BLACK, { parent: root, at: [0, ped + 0.06, 0.155] });
    c.anims.push(clip('turn', 2, [rotateTrack(dial, 'z', 2, (u) => Math.min(1, u * 1.5) * Math.PI * 2)]));
    const gy = ped + 0.28;
    const R = 0.2;
    mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.02, 32), trimM, { parent: root, at: [0, gy + 0.01, 0] });
    mesh(new THREE.SphereGeometry(R, 32, 22, 0, Math.PI * 2, 0, Math.PI * 0.86), toyMat('clear', '#f4fbff'), { parent: root, at: [0, gy + 0.02 + R * 0.86, 0] });
    mesh(lathe([[0, 0], [0.08, 0], [0.085, 0.03], [0.05, 0.05], [0, 0.05]], 24), cab, { parent: root, at: [0, gy + 0.02 + R * 1.83, 0] });
    // capsules: two-tone spheres stacked inside the globe, resting on the base plate
    const cols = [0, 1, 2, 3].map((i) => c.color(i));
    const halves = cols.map(() => []);
    const tops = [];
    const cr = 0.032;
    let n = 0;
    for (let layer = 0; layer < 4; layer++) {
      const y = gy + 0.02 + cr + layer * cr * 1.7;
      const rr = Math.sqrt(Math.max(0, (R - cr) ** 2 - (y - (gy + 0.02 + R * 0.86)) ** 2)) * 0.95;
      for (let a = 0; a < 7; a++) for (const rad of [0, rr * 0.55, rr]) {
        if (rad === 0 && a) continue;
        const ang = a * 0.9 + layer * 0.45;
        const x = Math.cos(ang) * rad;
        const z = Math.sin(ang) * rad;
        halves[n % 4].push(new THREE.SphereGeometry(cr, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(x, y, z));
        tops.push(new THREE.SphereGeometry(cr, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, y, z));
        n++;
      }
    }
    halves.forEach((list, i) => merged(list, toyMat('plastic', cols[i]), { parent: root }));
    merged(tops, toyMat('clear', '#ffffff'), { parent: root });
    tracks.push(...bulbs(root, 'coin_light', 'green', [[[0.1, ped + 0.25, 0.151], [0, 0, 1]]], { r: 0.008, blink: 1 }));
  }
  c.anims.push(clip('on', 1, tracks));
}, { base: 'classic' });

/* ============================== TOY CHESTS ============================== */
export const CHEST_VARIANTS = {
  'classic-chest': { kind: 'wood', cols: ['#2e6da4', '#f3e6c8', '#e0ad3a', '#b8432f', '#fbf6ea', '#1c2f45'] },
  'domed-trunk': { kind: 'rawwood', cols: ['#9a6a3e', '#5b3a24', '#c9a24a', '#3a2414', '#e8d9b8', '#2a1a10'] },
  'bench-chest': { kind: 'wood', cols: ['#f2efe6', '#d98fa8', '#9fd2ee', '#7aa36a', '#fffaf2', '#6e6a64'] },
  'animal-chest': { kind: 'soft', cols: ['#9aa6b2', '#f4a9bf', '#f7f5f0', '#5d6670', '#ffffff', '#2a2a2a'] },
};

export const createToyChest = toyFactory('toy-chest', CHEST_VARIANTS, (c) => {
  const { root, T, v, variant } = c;
  const base = T.name === 'wooden' && !c.o.trim;
  const col = (i) => (base ? v.cols[i] : T.pal[i]);
  const kind = base ? v.kind : T.kind;
  const m = (i, k) => toyMat(k ?? kind, col(i));
  const metal = T.style === 'luxe' || T.style === 'tin' ? toyMat('gold', '#c9a24a') : toyMat('gold', variant === 'domed-trunk' ? '#b08a3c' : '#c9ced6');
  const t = 0.02;
  // generic hollow carcass: floor + 4 walls, bottom at y0
  const carcass = (W, D, H, y0, mat, r = 0.25) => {
    mesh(roundedBox(W - 2 * t, t, D - 2 * t, 0.006), mat, { parent: root, at: [0, y0 + t / 2, 0] });
    for (const s of [-1, 1]) mesh(c.box(W, H, t, r), mat, { parent: root, at: [0, y0 + H / 2, s * (D / 2 - t / 2)] });
    for (const s of [-1, 1]) mesh(c.box(t, H, D - 2 * t, r), mat, { parent: root, at: [s * (W / 2 - t / 2), y0 + H / 2, 0] });
    return y0 + t;
  };
  const lid = (H, D, ang) => {
    const g = group('lid', { parent: root, at: [0, H, -D / 2] });
    const b = group('lid_body', { parent: g, rot: [-ang, 0, 0] });
    c.anims.push(clip('open', 3, [rotateTrack(g, 'x', 3, (u) => (ang > 0 ? (1 - pingPong(u)) * ang : -pingPong(u) * 1.6))]));
    return b;
  };
  const blocks = (x, z, fl, n = 3) => { for (let i = 0; i < n; i++) mesh(roundedBox(0.08, 0.08, 0.08, 0.01), toyMat('plastic', T.pal[(i + 1) % 4]), { parent: root, at: [x + i * 0.09, fl + 0.04, z + (i % 2) * 0.06], rot: [0, i * 0.4, 0] }); };

  if (variant === 'classic-chest') {
    const W = 0.8, D = 0.45, H = 0.44, foot = 0.06;
    const wm = m(0), pm = m(1);
    // bracket feet + plinth moulding
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(c.box(0.08, foot, 0.08, 0.2), m(5), { parent: root, at: [sx * (W / 2 - 0.05), foot / 2, sz * (D / 2 - 0.05)] });
    mesh(roundedBox(W + 0.03, 0.035, D + 0.03, 0.01), m(5), { parent: root, at: [0, foot + 0.0175, 0] });
    const fl = carcass(W, D, H - foot, foot, wm);
    // raised panels with moulded frames on front and sides
    for (const x of [-W / 4, W / 4]) {
      mesh(roundedBox(W * 0.42, (H - foot) * 0.66, 0.012, 0.004), pm, { parent: root, at: [x, foot + (H - foot) * 0.5, D / 2 + 0.006] });
      mesh(roundedBox(W * 0.34, (H - foot) * 0.5, 0.02, 0.008), wm, { parent: root, at: [x, foot + (H - foot) * 0.5, D / 2 + 0.01] });
    }
    for (const s of [-1, 1]) mesh(roundedBox(0.012, (H - foot) * 0.66, D * 0.7, 0.004), pm, { parent: root, at: [s * (W / 2 + 0.006), foot + (H - foot) * 0.5, 0] });
    mesh(roundedBox(W + 0.02, 0.03, D + 0.02, 0.008), pm, { parent: root, at: [0, H - 0.015, 0] }); // rim moulding
    mesh(roundedBox(0.06, 0.05, 0.015, 0.005), metal, { parent: root, at: [0, H - 0.05, D / 2 + 0.016] }); // hasp
    // contents: wooden blocks and a ball
    blocks(0.02, -0.05, fl);
    mesh(new THREE.SphereGeometry(0.09, 24, 16), toyMat('plastic', T.pal[3]), { parent: root, at: [-0.22, fl + 0.09, 0.02] });
    const lb = lid(H, D, 1.75);
    mesh(c.box(W + 0.04, 0.035, D + 0.04, 0.3), wm, { parent: lb, at: [0, 0.0175, D / 2] });
    mesh(roundedBox(W * 0.8, 0.01, D * 0.7, 0.004), pm, { parent: lb, at: [0, 0.04, D / 2] });
    tube([W / 2 - t - 0.01, H * 0.6, -D / 2 + t + 0.01], [W / 2 - t - 0.01, H + 0.15, -D / 2 - 0.01], 0.004, CHROME, { parent: root });
  } else if (variant === 'domed-trunk') {
    const W = 0.76, D = 0.46, H = 0.36;
    const wm = m(0), strap = toyMat(base ? 'wood' : 'plush', col(1));
    const fl = carcass(W, D, H, 0, wm, 0.1);
    // plank grooves
    for (let y = 0.07; y < H - 0.02; y += 0.07) {
      mesh(new THREE.BoxGeometry(W + 0.002, 0.004, 0.004), m(5), { parent: root, at: [0, y, D / 2 + 0.0005] });
      mesh(new THREE.BoxGeometry(0.004, 0.004, D + 0.002), m(5), { parent: root, at: [W / 2 + 0.0005, y, 0] });
      mesh(new THREE.BoxGeometry(0.004, 0.004, D + 0.002), m(5), { parent: root, at: [-W / 2 - 0.0005, y, 0] });
    }
    blocks(-0.15, -0.05, fl, 2);
    // closed barrel lid
    const lb = lid(H, D, 0);
    const R = D / 2 + 0.005;
    const dome = new THREE.CylinderGeometry(R, R, W + 0.01, 40, 1, false, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2);
    dome.scale(1, 0.75, 1);
    mesh(dome, wm, { parent: lb, at: [0, 0, D / 2] });
    for (const s of [-1, 1]) mesh(new THREE.CircleGeometry(R, 40, 0, Math.PI).scale(1, 0.75, 1), wm, { parent: lb, at: [s * (W / 2 + 0.005), 0, D / 2], rot: [0, s * Math.PI / 2, 0] });
    // leather straps over body + dome, brass corner caps, front lock
    for (const x of [-W * 0.3, W * 0.3]) {
      mesh(roundedBox(0.05, H, D + 0.012, 0.004), strap, { parent: root, at: [x, H / 2, 0] });
      const sg = new THREE.CylinderGeometry(R + 0.006, R + 0.006, 0.05, 40, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2);
      sg.scale(1, 0.76, 1);
      mesh(sg, strap, { parent: lb, at: [x, 0, D / 2] }).material.side = THREE.DoubleSide;
      mesh(roundedBox(0.035, 0.03, 0.008, 0.003), metal, { parent: root, at: [x, H * 0.75, D / 2 + 0.01] });
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0.03, H - 0.03]) mesh(roundedBox(0.05, 0.06, 0.05, 0.006), metal, { parent: root, at: [sx * (W / 2 - 0.018), y, sz * (D / 2 - 0.018)] });
    mesh(roundedBox(0.08, 0.09, 0.02, 0.008), metal, { parent: root, at: [0, H - 0.02, D / 2 + 0.008] });
    for (const s of [-1, 1]) curveTube([[s * (W / 2 + 0.004), H * 0.65, -0.06], [s * (W / 2 + 0.03), H * 0.6, 0], [s * (W / 2 + 0.004), H * 0.65, 0.06]], 0.008, strap, { parent: root, segments: 12 });
  } else if (variant === 'bench-chest') {
    const W = 1.1, D = 0.4, H = 0.4, leg = 0.08;
    const wm = m(0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(lathe([[0, 0], [0.022, 0], [0.03, leg * 0.5], [0.025, leg], [0, leg]], 16), m(5), { parent: root, at: [sx * (W / 2 - 0.06), 0, sz * (D / 2 - 0.06)] });
    const fl = carcass(W, D, H - leg, leg, wm, 0.15);
    // vertical slats on the front
    for (let i = -4; i <= 4; i++) mesh(roundedBox(0.07, (H - leg) * 0.7, 0.012, 0.004), m(2), { parent: root, at: [i * 0.115, leg + (H - leg) * 0.5, D / 2 + 0.006] });
    // side hand-hold cut-outs (dark recess) + rope handles
    for (const s of [-1, 1]) {
      mesh(roundedBox(0.006, 0.04, 0.16, 0.019), BLACK, { parent: root, at: [s * (W / 2 + 0.002), H - 0.08, 0] });
      curveTube([[s * (W / 2 + 0.004), H - 0.08, -0.07], [s * (W / 2 + 0.04), H - 0.11, 0], [s * (W / 2 + 0.004), H - 0.08, 0.07]], 0.009, toyMat('plush', '#d9c7a0'), { parent: root, segments: 12 });
    }
    blocks(-0.3, -0.04, fl);
    blocks(0.15, -0.04, fl, 2);
    // closed lid with a thick buttoned seat cushion
    const lb = lid(H, D, 0);
    mesh(c.box(W + 0.03, 0.03, D + 0.03, 0.3), wm, { parent: lb, at: [0, 0.015, D / 2] });
    mesh(T.puff ? c.box(W - 0.02, 0.09, D - 0.01, 0.4) : cushionGeo(W - 0.02, 0.09, D - 0.01), toyMat('plush', col(1)), { parent: lb, at: [0, 0.03 + 0.045, D / 2] });
    for (const x of [-0.36, 0, 0.36]) mesh(new THREE.SphereGeometry(0.012, 10, 8), toyMat('plush', col(5)), { parent: lb, at: [x, 0.03 + 0.09 + 0.002, D / 2] });
  } else {
    // elephant chest: body box on four stubby feet, head with ears and a trunk on the front
    const W = 0.7, D = 0.46, H = 0.4, leg = 0.08;
    const wm = m(0), ear = m(1), light = m(2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(0.07, 0.075, leg + 0.02, 24), wm, { parent: root, at: [sx * (W / 2 - 0.1), (leg + 0.02) / 2, sz * (D / 2 - 0.1)] });
      for (let k = -1; k <= 1; k++) mesh(new THREE.SphereGeometry(0.016, 10, 8), light, { parent: root, at: [sx * (W / 2 - 0.1) + k * 0.03, 0.016, sz * (D / 2 - 0.1) + 0.07 * sz] });
    }
    const fl = carcass(W, D, H - leg, leg, wm, 0.45);
    // head on the front wall (+X side, the elephant faces sideways along X)
    const hx = W / 2 + 0.1;
    const head = mesh(new THREE.SphereGeometry(0.17, 28, 20), wm, { parent: root, at: [hx, H * 0.72, 0], name: 'head' });
    head.scale.set(0.9, 1, 1);
    for (const s of [-1, 1]) {
      const e = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.025, 28), ear, { parent: root, at: [hx - 0.06, H * 0.78, s * 0.2], rot: [Math.PI / 2, 0, 0] });
      e.scale.set(0.8, 1, 1.15);
      mesh(new THREE.SphereGeometry(0.022, 12, 10), BLACK, { parent: root, at: [hx + 0.13, H * 0.82, s * 0.075] });
      mesh(new THREE.ConeGeometry(0.018, 0.09, 12).rotateZ(-Math.PI / 2 - 0.5), WHITE, { parent: root, at: [hx + 0.16, H * 0.58, s * 0.06] });
    }
    curveTube([[hx + 0.12, H * 0.66, 0], [hx + 0.24, H * 0.45, 0], [hx + 0.24, H * 0.2, 0], [hx + 0.3, 0.06, 0], [hx + 0.36, 0.035, 0]], 0.04, wm, { parent: root, segments: 32 });
    mesh(new THREE.SphereGeometry(0.035, 12, 10), wm, { parent: root, at: [hx + 0.36, 0.035, 0] });
    curveTube([[-W / 2, H * 0.6, 0], [-W / 2 - 0.08, H * 0.4, 0.02], [-W / 2 - 0.09, H * 0.25, 0]], 0.012, wm, { parent: root, segments: 12 }); // tail
    // blanket band + plush toy peeking out
    mesh(roundedBox(W * 0.5, H * 0.5, D + 0.012, 0.01), ear, { parent: root, at: [-0.04, leg + (H - leg) * 0.55, 0] });
    mesh(new THREE.SphereGeometry(0.08, 20, 14), toyMat('plush', '#a8754a'), { parent: root, at: [-0.12, fl + 0.08, 0] });
    blocks(0.05, -0.05, fl, 2);
    const lb = lid(H, D, 0.7);
    mesh(c.box(W + 0.02, 0.035, D + 0.02, 0.45), wm, { parent: lb, at: [0, 0.0175, D / 2] });
  }
  void hollowLathe; void RUBBER; void spinTrack; void bulbs; void canvasTex; void hex;
}, { base: 'wooden' });

function cushionGeo(w, h, d) {
  return roundedBox(w, h, d, h * 0.45, 4);
}
