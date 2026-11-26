import * as THREE from 'three';
import { group, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import * as M from '../../core/materials.js';
import { Builder, palette, surface, block, facades, spread, windowUnit, door, flatRoof, gableRoof, hipRoof, frustum, signBoard, railingRun, acUnit, emblem } from './kit.js';
import { buildingAnimations } from './houses.js';

/*
 * Shared parts for the larger civic / commercial / industrial buildings:
 * window-gridded bodies, storefronts, classical porticoes, domes, clock
 * towers, flagpoles, roof-top plant — plus a factory helper that wires up
 * palette → Builder → animations → finalize for every new building type.
 */

export const FH = 3.4; // commercial storey height

/** Floors after the height trims ('low', 'high'). */
export function floorsOf(o, n) {
  const mul = { low: 0.6, high: 1.8 }[o.trim] ?? 1;
  return Math.max(1, Math.round(n * mul));
}

/** Standard create* function for a building type. build(B, o, d, m, variant) does the modelling. */
export function makeBuilding(type, VARIANTS, build, { after } = {}) {
  return function create(options = {}) {
    const o = normalizeOptions(options);
    const variant = pickVariant(VARIANTS, o.variant, type);
    const d = VARIANTS[variant];
    const root = group(`${type}-${variant}`);
    const m = palette(o, d);
    const B = new Builder(root, m);
    build(B, o, d, m, variant);
    B.finish();
    const animations = buildingAnimations(root, B);
    after?.(root, animations, o, d, variant);
    finalize(root, { type, variant, options: o, animations });
    root.userData.premade.oneShot = animations.filter((a) => /Open$/.test(a.name)).map((a) => a.name);
    return root;
  };
}

/**
 * Box body with a regular window grid on all four facades. Returns the top height.
 * groundFront(width) replaces the ground-floor front windows (storefronts, entrances).
 */
export function gridBody(B, m, { w, d, floors, fh = FH, g = 0.45, y0 = 0, cx = 0, cz = 0, spacing = 3, winW = 1.4, winH = 1.8, style = 'double', frame, header, doorGap = 0, groundFront, sides, groundH }) {
  const gh = groundH ?? fh;
  const h = (y0 ? 0 : g) + gh + (floors - 1) * fh;
  block(B, w, h, d, { cx, cz, y0, plinth: y0 ? 0 : g });
  const base = y0 || g;
  facades(B, w, d, (side, width) => {
    const n = Math.max(1, Math.round((width - 1.5) / spacing));
    const xs = spread(width, n, Math.min(1.8, width / (n + 1)));
    for (let f = 0; f < floors; f++) {
      if (f === 0 && side === 'front' && groundFront) continue;
      const fy = base + (f === 0 ? 0 : gh + (f - 1) * fh);
      const hh = f === 0 ? Math.min(winH, gh - 1.3) : winH;
      for (const x of xs) {
        if (f === 0 && side === 'front' && Math.abs(x) < doorGap) continue;
        windowUnit(B, x, fy + (f === 0 ? Math.max(0.9, (gh - hh) / 2) : 0.9), winW, hh, { style, frame, header });
      }
    }
    if (side === 'front' && groundFront) groundFront(width, base);
  }, { cx, cz, sides });
  return y0 + h;
}

/** Glazed shop front across `width` at the facade plane, with central door and fascia. */
export function storefront(B, m, width, y, height, { frame = B.mats.dark, doorW = 1.8, fascia = true, text, bg = '#22272c', fg = '#ffffff' } = {}) {
  const n = Math.max(2, Math.round(width / 2.6));
  const pw = (width - 0.4) / n;
  for (let i = 0; i < n; i++) {
    const x = -width / 2 + 0.2 + pw * (i + 0.5);
    if (Math.abs(x) < doorW / 2 + 0.2) continue;
    windowUnit(B, x, y + 0.45, pw - 0.16, height - 1.3, { style: 'none', frame, sill: false });
    B.box(frame, pw - 0.04, 0.42, 0.12, x, y + 0.21, 0.06, 0, 0.02); // stall riser
  }
  door(B, 0, y, doorW, 2.4, { double: true, glass: true, frame });
  if (fascia) {
    B.box(frame, width, 0.75, 0.22, 0, y + height - 0.32, 0.11, 0, 0.04);
    if (text) signBoard(B, 0, y + height - 0.32, 0.27, Math.min(width * 0.6, text.length * 0.55 + 1), 0.5, text, { bg, fg });
  }
}

/**
 * Classical portico in the current facade frame: stepped stylobate, columns,
 * entablature and (optionally) a pediment. Returns the height of the cornice top.
 */
export function portico(B, m, { width, depth = 3, colH = 6, y0 = 0.9, cols = 6, pediment = true, mat = B.mats.trim, steps = 4, x = 0 } = {}) {
  for (let s = 0; s < steps; s++) {
    const sh = y0 / steps;
    B.box(B.mats.plinth, width + 1.4 - s * 0.25, sh, depth + 1.2 - s * 0.3, x, sh * (s + 0.5), (depth + 1.2 - s * 0.3) / 2, 0, 0.02);
  }
  const R = Math.min(0.42, (width / cols) * 0.18);
  const col = new THREE.LatheGeometry(
    [[R * 1.25, 0], [R * 1.25, 0.15], [R * 1.05, 0.28], [R, colH * 0.3], [R * 0.86, colH - 0.35], [R * 1.1, colH - 0.22], [R * 1.4, colH - 0.08], [R * 1.4, colH]].map(([r, h]) => new THREE.Vector2(r, h)),
    20,
  );
  for (const cxp of spread(width, cols, R * 1.6)) B.geo(mat, col, x + cxp, y0, depth - 0.45);
  const ey = y0 + colH;
  B.box(mat, width + 0.6, 0.9, depth + 0.1, x, ey + 0.45, (depth + 0.1) / 2, 0, 0.03);
  B.box(mat, width + 0.9, 0.18, depth + 0.3, x, ey + 0.99, (depth + 0.3) / 2, 0, 0.02);
  if (pediment) {
    const ph = Math.min(2.6, width * 0.16);
    B.local(x, 0, 0, -Math.PI / 2, () => B.prism(mat, [[-(width + 0.8) / 2, ey + 1.08], [(width + 0.8) / 2, ey + 1.08], [0, ey + 1.08 + ph]], 0, depth + 0.2));
    return ey + 1.08 + ph;
  }
  return ey + 1.08;
}

/** Ribbed dome on a drum with a lantern. (x,z) centre, y = drum base. Returns top. */
export function dome(B, { x = 0, y, z = 0, r, drumH = 2.5, mat, drumMat = B.mats.wall, trimMat = B.mats.trim, lantern = true, onion = false } = {}) {
  B.add(drumMat, new THREE.CylinderGeometry(r * 1.02, r * 1.02, drumH, 32), new THREE.Matrix4().makeTranslation(x, y + drumH / 2, z));
  B.add(trimMat, new THREE.CylinderGeometry(r * 1.1, r * 1.1, 0.3, 32), new THREE.Matrix4().makeTranslation(x, y + drumH + 0.15, z));
  // drum windows / pilasters
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    B.add(trimMat, new THREE.BoxGeometry(0.22, drumH, 0.18), new THREE.Matrix4().makeRotationY(a).setPosition(x + Math.sin(a) * r * 1.02, y + drumH / 2, z + Math.cos(a) * r * 1.02));
  }
  const yb = y + drumH + 0.3;
  let top;
  if (onion) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const rr = r * (t < 0.55 ? Math.sin((t / 0.55) * Math.PI * 0.62) * 1.12 : 1.12 * Math.sin(0.62 * Math.PI) * (1 - (t - 0.55) / 0.45) ** 1.4);
      pts.push(new THREE.Vector2(Math.max(rr, 0.001), t * r * 2.1));
    }
    B.add(mat, new THREE.LatheGeometry(pts, 32), new THREE.Matrix4().makeTranslation(x, yb, z));
    top = yb + r * 2.1;
  } else {
    B.add(mat, new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.Matrix4().makeTranslation(x, yb, z));
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      B.add(trimMat, new THREE.TorusGeometry(r + 0.02, 0.06, 4, 24, Math.PI / 2), new THREE.Matrix4().makeRotationY(a).multiply(new THREE.Matrix4().makeRotationZ(0)).setPosition(x, yb, z).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)));
    }
    top = yb + r;
  }
  if (lantern) {
    B.add(drumMat, new THREE.CylinderGeometry(r * 0.16, r * 0.18, r * 0.35, 12), new THREE.Matrix4().makeTranslation(x, top - 0.05 + r * 0.175, z));
    B.add(mat, new THREE.ConeGeometry(r * 0.2, r * 0.3, 12), new THREE.Matrix4().makeTranslation(x, top + r * 0.35 + r * 0.15 - 0.05, z));
    B.add(B.mats.metal, new THREE.CylinderGeometry(0.03, 0.05, 1.2, 6), new THREE.Matrix4().makeTranslation(x, top + r * 0.5 + 0.5, z));
    top += r * 0.5 + 1.1;
  }
  return top;
}

/** Clock face (white dial, numerals as ticks, hands) on the current facade plane. */
export function clockFace(B, x, y, r) {
  const white = B.extraClock ??= new THREE.MeshStandardMaterial({ name: 'clock_face', color: '#f6f2e6', roughness: 0.5 });
  B.add(B.mats.trim, new THREE.CylinderGeometry(r + 0.12, r + 0.12, 0.12, 32).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(x, y, 0.06));
  B.add(white, new THREE.CylinderGeometry(r, r, 0.04, 32).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(x, y, 0.13));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    B.add(B.mats.dark, new THREE.BoxGeometry(0.05, r * 0.16, 0.02).rotateZ(-a), new THREE.Matrix4().makeTranslation(x + Math.sin(a) * r * 0.82, y + Math.cos(a) * r * 0.82, 0.16));
  }
  B.add(B.mats.dark, new THREE.BoxGeometry(0.07, r * 0.55, 0.02).translate(0, r * 0.25, 0).rotateZ(-0.6), new THREE.Matrix4().makeTranslation(x, y, 0.17));
  B.add(B.mats.dark, new THREE.BoxGeometry(0.05, r * 0.8, 0.02).translate(0, r * 0.37, 0).rotateZ(-4.1), new THREE.Matrix4().makeTranslation(x, y, 0.18));
}

/** Square clock tower with belfry openings and a pyramid/spire roof. (x,z) centre, from y0. Returns top. */
export function clockTower(B, { x = 0, z = 0, y0 = 0, s = 4, h = 14, roof = 'pyramid', mat = B.mats.wall } = {}) {
  B.box(mat, s, h, s, x, y0 + h / 2, z, 0, 0.04);
  B.box(B.mats.trim, s + 0.3, 0.35, s + 0.3, x, y0 + h - 3.2, z, 0, 0.04);
  B.box(B.mats.trim, s + 0.4, 0.4, s + 0.4, x, y0 + h + 0.2, z, 0, 0.05);
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    B.local(x + Math.sin(a) * s / 2, 0, z + Math.cos(a) * s / 2, a, () => {
      clockFace(B, 0, y0 + h - 1.6, s * 0.28);
      windowUnit(B, 0, y0 + h - 7.2, s * 0.32, 2.4, { style: 'arch', sill: true });
    });
  }
  const yr = y0 + h + 0.4;
  if (roof === 'spire') {
    B.add(B.mats.roof, new THREE.ConeGeometry(s * 0.72, s * 2.6, 4).rotateY(Math.PI / 4), new THREE.Matrix4().makeTranslation(x, yr + s * 1.3, z));
    return yr + s * 2.6;
  }
  if (roof === 'dome') return dome(B, { x, y: yr, z, r: s * 0.42, drumH: 1.2, mat: B.mats.roof });
  B.add(B.mats.roof, new THREE.ConeGeometry(s * 0.78, s * 0.9, 4).rotateY(Math.PI / 4), new THREE.Matrix4().makeTranslation(x, yr + s * 0.45, z));
  B.cyl(B.mats.metal, 0.03, 0.06, 1.2, x, yr + s * 0.9 + 0.55, z, 6);
  return yr + s * 0.9 + 1.1;
}

/** Flagpole standing on the ground (or a roof) at (x, y, z). */
export function flagpole(B, x, y, z, { h = 9, color = '#2c4f7c' } = {}) {
  B.cyl(B.mats.concrete, 0.4, 0.45, 0.3, x, y + 0.15, z, 12);
  B.cyl(B.mats.metal, 0.05, 0.08, h, x, y + h / 2 + 0.3, z, 8);
  B.add(B.mats.metal, new THREE.SphereGeometry(0.12, 10, 8), new THREE.Matrix4().makeTranslation(x, y + h + 0.38, z));
  const flag = B.flagMat ??= new THREE.MeshStandardMaterial({ name: 'flag', color: M.toColor(color), roughness: 0.8, side: THREE.DoubleSide });
  const g = new THREE.PlaneGeometry(1.8, 1.1, 8, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) + 0.9) * 2.6) * 0.1 * ((p.getX(i) + 0.9) / 1.8));
  g.computeVertexNormals();
  B.add(flag, g, new THREE.Matrix4().makeTranslation(x + 0.95, y + h - 0.35, z));
}

/** Roof-top plant: AC units, water tank, vents, mast. */
export function rooftop(B, w, d, y, { ac = 3, tank = false, mast = false, cx = 0, cz = 0, seed = 0 } = {}) {
  for (let k = 0; k < ac; k++) acUnit(B, cx + (k - (ac - 1) / 2) * 2.2, y + 0.06, cz - d / 4 + ((k + seed) % 2) * 1.2, 0);
  if (tank) {
    const tx = cx + w / 4;
    const tz = cz + d / 5;
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) B.box(B.mats.metal, 0.14, 2, 0.14, tx + sx * 0.9, y + 1.06, tz + sz * 0.9, 0, 0.02);
    B.add(surface('plank', '#7a5a3c', { name: 'tank' }), new THREE.CylinderGeometry(1.35, 1.35, 2.4, 20), new THREE.Matrix4().makeTranslation(tx, y + 2.06 + 1.2, tz));
    B.add(B.mats.dark, new THREE.ConeGeometry(1.45, 0.7, 20), new THREE.Matrix4().makeTranslation(tx, y + 2.06 + 2.4 + 0.35, tz));
  }
  if (mast) {
    B.box(B.mats.metal, 0.6, 0.3, 0.6, cx - w / 4, y + 0.21, cz, 0, 0.03);
    B.cyl(B.mats.metal, 0.05, 0.12, 8, cx - w / 4, y + 4.3, cz, 8);
  }
}

/** Vertical blade sign (hotels, cinemas) mounted on the facade at x. */
export function bladeSign(B, x, y, h, text, { bg = '#7a1f2b', fg = '#ffe9b0', w = 2.2 } = {}) {
  // board stands perpendicular to the wall, held off it by two brackets
  for (const yy of [y + h - 0.15, y + 0.15]) B.box(B.mats.metal, 0.1, 0.1, 0.2, x, yy, 0.1, 0, 0.02);
  for (const s of [1, -1]) B.local(x + s * 0.045, 0, 0.2 + w / 2, s * Math.PI / 2, () => signBoard(B, 0, y + h / 2, 0, w, h - 0.1, text, { bg, fg, emissive: 0.9, logo: false }));
}

export { Builder, palette, surface, block, facades, spread, windowUnit, door, flatRoof, gableRoof, hipRoof, frustum, signBoard, railingRun, acUnit, emblem };
