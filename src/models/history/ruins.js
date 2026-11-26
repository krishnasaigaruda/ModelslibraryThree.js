// Ancient ruins: broken colonnades, temple floors, crumbling walls, arch remnants,
// foundations, a breached tower and an empty statue plinth. Weathered by default.
import { THREE, M, mesh, group, roundedBox, extrudeOutline, lathe, setup, done, rubble, instanced, crumble, blockGeo } from './common.js';
import { shaftGeo, buildColumn, entablature } from './columns.js';

const RUIN_VARIANTS = { colonnade: {}, 'temple-floor': {}, 'brick-wall': {}, 'arch-remnant': {}, foundations: {}, 'broken-tower': {}, 'statue-plinth': {} };

/** Broken fluted column: base + shaft snapped at h (jagged). */
function brokenColumn(parent, T, x, z, R, h, H, { base = true, kind = 'doric' } = {}) {
  const m = T.mats;
  const g = group('broken-column', { parent, at: [x, 0, z] });
  let y = 0;
  if (base) {
    mesh(roundedBox(2.7 * R, 0.3 * R, 2.7 * R, 0.03 * R), m.stone2, { parent: g, at: [0, 0.15 * R, 0], name: 'plinth' });
    mesh(lathe([[0, 0], [1.25 * R, 0], [1.3 * R, 0.1 * R], [1.15 * R, 0.25 * R], [1.05 * R, 0.32 * R], [0, 0.32 * R]], 32), m.stone, { parent: g, at: [0, 0.29 * R, 0], name: 'torus' });
    y = 0.6 * R;
  }
  if (h > 0.05) mesh(crumble(shaftGeo(R, H, { kind, flutes: 20, depth: 0.05 }), Math.min(h, H), R * 0.35, x * 3 + z), m.stone, { parent: g, at: [0, y - 0.004, 0], name: 'shaft' });
  return g;
}

/** Column drum lying on the ground. */
function fallenDrum(parent, T, x, z, R, L, rotY) {
  const g = shaftGeo(R, L, { kind: 'doric', flutes: 20, depth: 0.05 }).rotateZ(Math.PI / 2).translate(-L / 2, R * 0.97, 0);
  return mesh(g, T.mats.stone, { parent, at: [x, 0, z], rot: [0, rotY, 0], name: 'fallen-drum' });
}

/** Low crumbling wall segment (along x) with jagged top. */
function ruinWall(parent, T, x, z, L, h, t, rotY = 0, jag = 0.25) {
  const g = roundedBox(L, h, t, 0.03).translate(0, h / 2, 0);
  return mesh(crumble(g, h * 0.85, Math.min(jag, h * 0.4), x + z * 3), T.mats.stone, { parent, at: [x, 0, z], rot: [0, rotY, 0], name: 'ruin-wall' });
}

export function createRuins(options = {}) {
  const { variant, T } = setup(options, RUIN_VARIANTS, 'ancient-ruins', { wear: 0.8, moss: 0.4, chips: 1, stone: '#c9bea6' });
  const root = group(`ancient-ruins-${variant}`);
  const m = T.mats;
  const r = T.r;
  const box = new THREE.Box3();
  if (variant === 'colonnade') {
    const R = 0.4, span = 2.0, n = 6;
    const L = (n - 1) * span;
    mesh(roundedBox(L + 2, 0.3, 2.6, 0.03), m.stone2, { parent: root, at: [0, 0.15, 0], name: 'step' });
    mesh(roundedBox(L + 1.4, 0.3, 2.0, 0.03), m.stone, { parent: root, at: [0, 0.44, 0], name: 'stylobate' });
    const sy = 0.585;
    const heights = [1.0, 0, 0, 2.2, 0.6, 1.4];
    let top = 0;
    for (let i = 0; i < n; i++) {
      const x = -L / 2 + i * span;
      if (i === 1 || i === 2) {
        const c = buildColumn(root, T, 'doric', { D: 2 * R, x, base: false, Hs: 5.2 });
        c.g.position.y = sy;
        top = sy + c.top;
      } else {
        const bc = brokenColumn(root, T, x, 0, R, heights[i] * (0.8 + r() * 0.4), 4.2, { base: false });
        bc.position.y = sy;
      }
    }
    // architrave block still spanning the two standing columns, cornice piece fallen
    entablature(root, T, 'doric', -L / 2 + span - 0.6, -L / 2 + 2 * span + 0.6, top - 0.005, 1.5, 0.4);
    fallenDrum(root, T, 1.4, 2.4, R * 0.98, 1.1, 0.3);
    fallenDrum(root, T, 3.8, -2.1, R * 0.98, 0.8, -0.6);
    fallenDrum(root, T, 2.6, 2.6, R * 0.98, 0.9, 1.2);
    mesh(blockGeo(2.2, 0.5, 0.8, 0.04), m.stone, { parent: root, at: [-1.0, 0.25, -2.0], rot: [0, 0.25, 0], name: 'fallen-architrave' });
    box.set(new THREE.Vector3(-L / 2 - 1, 0, -1.3), new THREE.Vector3(L / 2 + 1, 1, 1.3));
  } else if (variant === 'temple-floor') {
    const W = 9, D = 14, R = 0.38;
    for (let i = 0; i < 3; i++) mesh(roundedBox(W + 1.8 - i * 0.6, 0.3, D + 1.8 - i * 0.6, 0.03), i === 2 ? m.stone : m.stone2, { parent: root, at: [0, 0.15 + i * 0.3, 0], name: 'step' });
    const sy = 0.895;
    const pos = [];
    for (let i = 0; i < 5; i++) for (const zz of [-D / 2 + 0.6, D / 2 - 0.6]) pos.push([-W / 2 + 0.6 + (i * (W - 1.2)) / 4, zz]);
    for (let j = 1; j < 6; j++) for (const xx of [-W / 2 + 0.6, W / 2 - 0.6]) pos.push([xx, -D / 2 + 0.6 + (j * (D - 1.2)) / 6]);
    for (const [x, z] of pos) {
      const h = r() < 0.4 ? 0 : 0.2 + r() * (r() < 0.2 ? 2.4 : 0.8);
      brokenColumn(root, T, x, z, R, h, 3.5, { base: true }).position.y = sy;
    }
    // cella wall remnants and paving cracks
    ruinWall(root, T, -2.2, 0, 0.6, 1.4, 6, 0).position.y = sy - 0.01;
    ruinWall(root, T, 2.2, 0, 0.6, 0.9, 6, 0).position.y = sy - 0.01;
    ruinWall(root, T, 0, -3.0, 4.9, 1.1, 0.6, 0).position.y = sy - 0.01;
    for (let i = 0; i < 5; i++) fallenDrum(root, T, (r() - 0.5) * W * 1.3, (r() < 0.5 ? -1 : 1) * (D / 2 + 1.5 + r()), R, 0.6 + r() * 0.6, r() * 3);
    box.set(new THREE.Vector3(-W / 2 - 0.9, 0, -D / 2 - 0.9), new THREE.Vector3(W / 2 + 0.9, 1, D / 2 + 0.9));
  } else if (variant === 'brick-wall') {
    const L = 8, H = 4.2, t = 0.7;
    const brick = (m.brick ??= (() => { const b = new THREE.MeshStandardMaterial({ name: 'stone', color: T.trim ? (T.stone ?? '#b25a38') : '#b25a38', roughness: 0.85, vertexColors: true }); b.userData.weather = true; return b; })());
    // wall with an arched window, ragged top
    const pts = [[-L / 2, 0], [L / 2, 0], [L / 2, H * 0.7], [L * 0.3, H], [L * 0.1, H * 0.9], [-L * 0.15, H * 1.0], [-L * 0.35, H * 0.75], [-L / 2, H * 0.6]];
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const win = new THREE.Path();
    win.moveTo(-0.6, 1.4); win.lineTo(0.6, 1.4); win.lineTo(0.6, 2.4);
    for (let i = 1; i < 12; i++) { const a = (i / 12) * Math.PI; win.lineTo(Math.cos(a) * 0.6, 2.4 + Math.sin(a) * 0.6); }
    win.lineTo(-0.6, 1.4);
    shape.holes.push(win);
    const wg = extrudeOutline(shape, t, { bevel: 0.03, segments: 1 }).translate(0, 0.03, 0);
    mesh(crumble(wg, H * 2, 0.0), brick, { parent: root, name: 'wall' });
    // bonding courses of tiles (instanced), clipped to the ragged top
    const tiles = [];
    for (let y = 0.6; y < H; y += 0.65) {
      for (let x = -L / 2 + 0.25; x < L / 2 - 0.2; x += 0.5) {
        const k = (x + L / 2) / L;
        const topAt = k < 0.15 ? H * (0.6 + k) : k < 0.35 ? H * 0.75 + (k - 0.15) * 1.2 : k < 0.6 ? H * 0.95 : k < 0.8 ? H * (0.9 + (k - 0.6) * 0.5) : H * (1 - (k - 0.8) * 1.5);
        if (y > topAt - 0.25) continue;
        if (Math.abs(x) < 0.85 && y > 1.2 && y < 3.2) continue;
        for (const s of [-1, 1]) tiles.push({ p: [x, y, s * (t / 2 + 0.005)], s: [0.48, 0.06, 0.04] });
      }
    }
    instanced(new THREE.BoxGeometry(1, 1, 1), (m.tileband ??= M.matte(T.night ? '#5a4a40' : '#d9c3a0', 0.85)), tiles, root, 'tile-courses');
    mesh(roundedBox(1.5, 0.12, t + 0.1, 0.02), m.stone, { parent: root, at: [0, 1.36, 0], name: 'sill' });
    rubble(root, T, { x0: -L / 2, x1: L / 2, z0: -t / 2, z1: t / 2 }, 12, 0.35, { mat: brick, kind: 'block' });
    box.set(new THREE.Vector3(-L / 2, 0, -t), new THREE.Vector3(L / 2, 1, t));
  } else if (variant === 'arch-remnant') {
    const s = 4.4, D = 2.4, pw = 1.6, hs = 4;
    for (const sx of [-1, 1]) {
      const ph = sx < 0 ? hs + 0.3 : hs * 0.7;
      mesh(crumble(roundedBox(pw, ph, D, 0.04).translate(0, ph / 2, 0), ph * 0.97, sx < 0 ? 0.02 : 0.35), m.stone, { parent: root, at: [sx * (s / 2 + pw / 2), 0, 0], name: 'pier' });
      mesh(roundedBox(pw + 0.2, 0.3, D + 0.2, 0.03), m.stone2, { parent: root, at: [sx * (s / 2 + pw / 2), 0.15, 0], name: 'pier-base' });
    }
    mesh(roundedBox(pw + 0.3, 0.3, D + 0.2, 0.04), m.stone2, { parent: root, at: [-(s / 2 + pw / 2), hs + 0.3, 0], name: 'impost' });
    // the surviving half of the arch: voussoirs from the left springing to near the crown
    const n = 13;
    for (let i = 0; i < 6; i++) {
      const a0 = Math.PI - (i / n) * Math.PI, a1 = Math.PI - ((i + 1) / n) * Math.PI;
      const ri = s / 2, ro = s / 2 + 0.75;
      const sh = [];
      for (let k = 0; k <= 3; k++) { const a = a0 + ((a1 - a0) * k) / 3; sh.push([Math.cos(a) * ri, Math.sin(a) * ri]); }
      for (let k = 3; k >= 0; k--) { const a = a0 + ((a1 - a0) * k) / 3; sh.push([Math.cos(a) * ro, Math.sin(a) * ro]); }
      mesh(extrudeOutline(sh, D, { bevel: 0.012, segments: 1 }), m.stone, { parent: root, at: [0, hs + 0.44, 0], name: 'voussoir' });
    }
    // fallen voussoirs and keystone
    for (let i = 0; i < 6; i++) mesh(blockGeo(0.9, 0.6, 0.75, 0.04), m.stone, { parent: root, at: [0.8 + r() * 2.4, 0.3, (r() < 0.5 ? -1 : 1) * (D / 2 + 0.6 + r() * 1.2)], rot: [0, r() * 3, 0], name: 'fallen-voussoir' });
    box.set(new THREE.Vector3(-s / 2 - pw, 0, -D / 2), new THREE.Vector3(s / 2 + pw, 1, D / 2));
  } else if (variant === 'foundations') {
    const t = 0.55;
    const walls = [
      [0, -4, 10, 0.9, 0], [0, 4, 10, 0.6, 0], [-5, 0, 8, 0.8, Math.PI / 2], [5, 0, 8, 0.5, Math.PI / 2],
      [-1, 0, 8, 0.7, Math.PI / 2], [2, -1.2, 6, 0.45, 0], [3.2, 2.2, 3.6, 0.4, Math.PI / 2],
    ];
    for (const [x, z, L, h, ry] of walls) {
      // doorway gaps: split each wall into two pieces
      const gap = 1.0, a = (L - gap) * (0.35 + r() * 0.3);
      const c = Math.cos(ry), s = Math.sin(ry);
      const off1 = -L / 2 + a / 2, off2 = -L / 2 + a + gap + (L - a - gap) / 2;
      ruinWall(root, T, x + off1 * c, z - off1 * s, a, h * (0.7 + r() * 0.5), t, ry, 0.2);
      ruinWall(root, T, x + off2 * c, z - off2 * s, L - a - gap, h * (0.7 + r() * 0.5), t, ry, 0.2);
    }
    // a surviving patch of floor tiles and a column base
    const tiles = [];
    for (let i = 0; i < 12; i++) for (let j = 0; j < 10; j++) if (r() > 0.25) tiles.push({ p: [-4.4 + i * 0.3, 0.015, -3.4 + j * 0.3], s: [0.28, 0.03, 0.28], c: (i + j) % 2 ? '#e8dcc0' : '#8a3b2a' });
    instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ name: 'tiles', color: 0xffffff, roughness: 0.7 }), tiles, root, 'floor-tiles');
    brokenColumn(root, T, 2.0, 2.0, 0.3, 0.5, 3);
    box.set(new THREE.Vector3(-5.3, 0, -4.3), new THREE.Vector3(5.3, 1, 4.3));
  } else if (variant === 'broken-tower') {
    const R = 3.4, t = 1.2, H = 11;
    // hollow drum shell with a wide breach, jagged top
    const geo = new THREE.LatheGeometry([[R - t, 0], [R + 0.4, 0], [R, 1.5], [R, H], [R - t, H], [R - t, 0]].map(([x, y]) => new THREE.Vector2(x, y)), 48, 0.6, Math.PI * 2 - 1.5);
    const shell = crumble(geo, H, 2.6);
    // breach edges slope down
    const p = shell.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const a = Math.atan2(-p.getZ(i), p.getX(i));
      const d = Math.min(Math.abs(a - 0.6 + Math.PI * 2) % (Math.PI * 2), Math.abs(a - (Math.PI * 2 - 0.9)) % (Math.PI * 2));
      const lim = 1.2 + Math.min(1, Math.abs(Math.sin(a / 2 - 0.15)) * 1.5) * H;
      if (p.getY(i) > lim) p.setY(i, lim);
      void d;
    }
    shell.computeVertexNormals();
    mesh(shell, m.stone, { parent: root, rot: [0, 0, 0], name: 'shell' }).material.side = THREE.DoubleSide;
    mesh(new THREE.CylinderGeometry(R - t + 0.02, R - t + 0.02, 0.15, 40), m.stone2, { parent: root, at: [0, 0.075, 0], name: 'floor' });
    const win = [];
    for (const [y, a] of [[4, 2.4], [7, 3.4], [5.5, 4.4]]) win.push({ p: [Math.cos(a) * (R + 0.01), y, -Math.sin(a) * (R + 0.01)], r: [0, a + Math.PI / 2, 0], s: [0.5, 1.2, 0.3] });
    instanced(roundedBox(1, 1, 1, 0.2, 1), m.dark, win, root, 'windows');
    rubble(root, T, { x0: R * 0.6, x1: R * 1.4, z0: -R * 0.9, z1: R * 0.3 }, 18, 0.6, { kind: 'block', spread: 0.5 });
    box.set(new THREE.Vector3(-R, 0, -R), new THREE.Vector3(R, 1, R));
  } else if (variant === 'statue-plinth') {
    mesh(roundedBox(1.8, 0.25, 1.4, 0.03), m.stone2, { parent: root, at: [0, 0.125, 0], name: 'step' });
    mesh(roundedBox(1.3, 1.5, 1.0, 0.03), m.stone, { parent: root, at: [0, 0.25 + 0.75 - 0.005, 0], name: 'plinth' });
    mesh(roundedBox(1.45, 0.18, 1.15, 0.03), m.accent, { parent: root, at: [0, 1.82, 0], name: 'plinth-cap' });
    mesh(roundedBox(0.9, 0.35, 0.03, 0.01), m.detail, { parent: root, at: [0, 1.1, 0.51], name: 'inscription' });
    const letters = [];
    for (let l = 0; l < 2; l++) for (let c = 0; c < 9; c++) if (r() > 0.2) letters.push({ p: [-0.34 + c * 0.085, 1.16 - l * 0.12, 0.525], s: [0.05, 0.07, 0.01] });
    instanced(new THREE.BoxGeometry(1, 1, 1), (m.letters ??= M.matte('#5a4a38')), letters, root, 'letters');
    // feet and lower legs of the lost statue (bronze or stone), torso fragment on the ground
    const sm = T.gild ? m.gold : T.trim === 'basalt' || T.trim === 'granite' ? m.stone : m.bronze;
    const ty = 1.91 - 0.005;
    for (const s of [-1, 1]) {
      mesh(new THREE.CapsuleGeometry(0.07, 0.2, 4, 10).scale(1, 1, 2.2).translate(0, 0.07, 0.06), sm, { parent: root, at: [s * 0.15, ty, s * 0.05], name: 'foot' });
      mesh(crumble(new THREE.CylinderGeometry(0.075, 0.065, 0.6, 14).translate(0, 0.3, 0), 0.35 + (s > 0 ? 0.15 : 0), 0.06), sm, { parent: root, at: [s * 0.15, ty + 0.06, s * 0.05 - 0.02], name: 'leg' });
    }
    const tg = crumble(new THREE.CylinderGeometry(0.32, 0.26, 0.9, 16).scale(1, 1, 0.65).translate(0, 0.45, 0), 0.8, 0.12).rotateZ(Math.PI / 2);
    tg.computeBoundingBox();
    mesh(tg, sm, { parent: root, at: [1.6, -tg.boundingBox.min.y - 0.003, 0.6], rot: [0, 0.5, 0], name: 'torso-fragment' });
    box.set(new THREE.Vector3(-0.9, 0, -0.7), new THREE.Vector3(0.9, 1, 0.7));
  }
  rubble(root, T, box, variant === 'statue-plinth' ? 4 : 10, variant === 'statue-plinth' ? 0.15 : 0.35);
  return done(root, T);
}
