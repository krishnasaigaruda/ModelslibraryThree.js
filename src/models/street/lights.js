import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, curveTube, lathe, extrudeOutline, normalizeOptions, pickVariant } from '../../core/utils.js';
import { clip } from '../../core/animation.js';
import { lampGroup, lampTracks, lensMaterial, glowMaterial } from '../../core/lamps.js';
import { mats, pole, textTexture, bolt, densify } from './common.js';
import { finish, styleOf } from './kit.js';

/* Shared: extra glow cards so omnidirectional lamps glow from every side. */
const _z = new THREE.Vector3(0, 0, 1);
export function glowCards(grp, parent, center, size, normals) {
  normals.forEach((n, i) => {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(size, size), grp.glow);
    card.name = `${grp.name}_glowx_${parent.children.length}_${i}`;
    card.userData.noShadow = true;
    card.renderOrder = 10;
    card.position.set(...center);
    card.quaternion.setFromUnitVectors(_z, new THREE.Vector3(...n).normalize());
    parent.add(card);
  });
}
const ALL_SIDES = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]];

/** Street lamp group: white LED, warm, or low-pressure-sodium orange. */
function streetLamp(name, tone) {
  const lens = lensMaterial('white');
  const glow = glowMaterial('white');
  const c = tone === 'sodium' ? '#ff9a2a' : tone === 'warm' ? '#ffd9a0' : '#f4f8ff';
  lens.emissive.set(c);
  lens.color.set(tone === 'sodium' ? '#f3d3a6' : '#f2f2ee');
  glow.color.set(c);
  return lampGroup(name, 'white', { lens, glow });
}

/* ----------------------------- Streetlight ----------------------------- */

export const STREETLIGHT_VARIANTS = {
  modern: { height: 8, color: '#9fa5ab', tone: 'led' },
  double: { height: 10, color: '#9fa5ab', tone: 'led' },
  highway: { height: 12, color: '#9fa5ab', tone: 'led' },
  classic: { height: 4.2, color: '#1f2a24', tone: 'warm' },
  globe: { height: 3.8, color: '#2b2f33', tone: 'warm' },
  deco: { height: 5, color: '#2a2622', tone: 'warm' },
  pendant: { height: 6, color: '#1f2622', tone: 'warm' },
  'post-top': { height: 5, color: '#3a3f44', tone: 'led' },
  solar: { height: 6, color: '#b7bcc0', tone: 'led' },
};

function ledHead(parent, at, dir, frameMat, lamp, { len = 0.62, wid = 0.3, older = false } = {}) {
  const head = group(null, { parent, at });
  head.rotation.y = Math.atan2(dir.x, dir.z);
  if (older) {
    // classic cobra-head: deep rounded shell with a dropped bowl refractor
    const shell = lathe([[0.001, 0], [0.16, 0.0], [0.17, 0.05], [0.12, 0.11], [0.001, 0.13]], 28);
    shell.scale(1, 1, 2.1);
    shell.translate(0, -0.06, len * 0.5);
    mesh(shell, frameMat, { parent: head });
    const bowl = new THREE.SphereGeometry(0.15, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    bowl.scale(1, 0.55, 1.9);
    bowl.translate(0, -0.06, len * 0.52);
    lamp.add(head, { geometry: bowl, normal: [0, -1, 0], depth: 0.06, w: 0.3, h: 0.5, glowSize: 1.0 });
    mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 16).rotateX(Math.PI / 2), frameMat, { parent: head, at: [0, -0.01, 0.05] });
    return head;
  }
  // slim LED luminaire: tapered extruded body with a flat lens underneath
  const prof = [[-0.04, 0.035], [len, 0.015], [len + 0.04, -0.02], [len, -0.04], [-0.04, -0.05]];
  const g = extrudeOutline(prof, wid, { bevel: 0.018 });
  g.rotateY(-Math.PI / 2);
  mesh(g, frameMat, { parent: head });
  // heat-sink fins on top
  for (let k = 0; k < 6; k++) mesh(roundedBox(wid * 0.75, 0.018, 0.012, 0.004), frameMat, { parent: head, at: [0, 0.04, 0.12 + k * 0.08] });
  lamp.add(head, { at: [0, -0.05, len * 0.55], normal: [0, -1, 0], w: wid * 0.7, h: len * 0.62, depth: 0.012, bezel: false, glowSize: 1.1 });
  // glare seen from the side / below at an angle
  glowCards(lamp, head, [0, -0.07, len * 0.55], 0.9, [[1, -0.6, 0], [-1, -0.6, 0], [0, -0.6, 1], [0, -0.6, -1]]);
  return head;
}

function basket(parent, at, side) {
  // hanging flower basket on a scroll bracket
  const g = group('basket', { parent, at });
  const iron = mats.castIron('#1f2622');
  curveTube([[0, 0, 0], [0, 0.05, side * 0.25], [0, 0.0, side * 0.5]], 0.014, iron, { parent: g, radialSegments: 8 });
  const hx = side * 0.5;
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    curveTube([[0, -0.01, hx], [Math.cos(a) * 0.2, -0.35, hx + Math.sin(a) * 0.2]], 0.004, iron, { parent: g, segments: 2, radialSegments: 4 });
  }
  const bowl = lathe([[0.001, -0.5], [0.12, -0.49], [0.21, -0.42], [0.23, -0.34], [0.21, -0.34], [0.001, -0.36]], 24);
  mesh(bowl, new THREE.MeshStandardMaterial({ color: '#3b2a1e', roughness: 0.95 }), { parent: g, at: [0, 0, hx] });
  // trailing flowers: clumps of small spheres
  const leaf = M.foliage('#3f7d2e');
  const flowers = ['#e83e8c', '#ffffff', '#ffb300', '#8e44ad'];
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2 * 3.1;
    const rr = 0.13 + (k % 3) * 0.04;
    const y = -0.33 - (k % 5) * 0.035;
    const m = k % 3 === 0 ? new THREE.MeshStandardMaterial({ color: flowers[k % 4], roughness: 0.6 }) : leaf;
    mesh(new THREE.IcosahedronGeometry(k % 3 === 0 ? 0.035 : 0.06, 1), m, { parent: g, at: [Math.cos(a) * rr, y, hx + Math.sin(a) * rr] });
  }
  return g;
}

function banner(parent, H, rand, side = 1) {
  // two short arms + a fabric banner between them
  const steel = mats.galv();
  const y0 = H * 0.42;
  const y1 = y0 + 1.2;
  for (const y of [y0, y1]) {
    curveTube([[0, y, 0], [0, y, side * 0.62]], 0.016, steel, { parent, segments: 2, radialSegments: 8 });
    mesh(new THREE.SphereGeometry(0.025, 12, 8), steel, { parent, at: [0, y, side * 0.63] });
  }
  const words = [['CITY', 'FESTIVAL'], ['OLD', 'TOWN'], ['ART', 'WEEK'], ['RIVER', 'WALK']][rand];
  const colors = ['#c0392b', '#1565c0', '#6a1b9a', '#00796b'][rand];
  const tex = textTexture([[words[0], 'bold 110px Helvetica, Arial'], [words[1], 'bold 82px Helvetica, Arial']], { w: 256, h: 512, bg: colors, fg: '#ffffff', radius: 0 });
  const mat = tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ color: colors, side: THREE.DoubleSide });
  const g = new THREE.PlaneGeometry(0.5, 1.16, 6, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) + 0.25) * 9) * 0.02);
  g.computeVertexNormals();
  mat.side = THREE.FrontSide;
  // two single-sided faces so the lettering reads correctly from both sides
  for (const f of [1, -1]) {
    const gg = g.clone();
    gg.rotateY(f * Math.PI / 2);
    mesh(gg, mat, { parent, at: [f * 0.004, (y0 + y1) / 2, side * 0.33], name: f > 0 ? 'banner' : 'banner_b' });
  }
}

function bladeSigns(parent, y) {
  const names = [['ELM ST', '#1b6b3a'], ['5TH AVE', '#1b6b3a']];
  names.forEach(([n, c], i) => {
    const tex = textTexture(n, { w: 512, h: 112, bg: c, fg: '#fff', font: 'bold 70px Helvetica, Arial', border: '#fff', borderWidth: 5, radius: 10 });
    const m = tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 }) : new THREE.MeshStandardMaterial({ color: c });
    const blade = group(null, { parent, at: [0, y + i * 0.2, 0] });
    blade.rotation.y = i * Math.PI / 2;
    const geo = roundedBox(0.9, 0.16, 0.012, 0.006);
    const mats2 = new THREE.MeshStandardMaterial({ color: c, roughness: 0.45 });
    mesh(geo, mats2, { parent: blade, at: [0.45, 0, 0] });
    for (const s of [1, -1]) mesh(new THREE.PlaneGeometry(0.88, 0.15).rotateY(s > 0 ? 0 : Math.PI), m, { parent: blade, at: [0.45, 0, s * 0.0065] });
    mesh(roundedBox(0.09, 0.05, 0.09, 0.01), mats.galv(), { parent: blade, at: [0.0, 0, 0] });
  });
}

export function createStreetlight(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(STREETLIGHT_VARIANTS, o.variant, 'streetlight');
  const v = STREETLIGHT_VARIANTS[variant];
  const style = styleOf(o);
  const H = o.height ?? v.height;
  const root = group(`streetlight-${variant}`);
  const tone = style === 'sodium' ? 'sodium' : o.tone ?? v.tone;
  const lamp = streetLamp('lamp', tone);
  const galvanised = ['modern', 'double', 'highway', 'solar'].includes(variant);
  const frame = galvanised ? mats.galv() : mats.castIron(o.color ?? v.color);
  if (o.color && galvanised) frame.color.set(o.color);
  if (variant === 'post-top') frame.color.set(o.color ?? v.color);
  let lampY = H;
  let armSide = 1;

  if (galvanised) {
    const r = variant === 'highway' ? 0.12 : 0.09;
    mesh(pole(H, { r, top: r * 0.55, base: r * 2.4, baseH: 0.14 }), frame, { parent: root });
    for (let a = 0; a < 4; a++) bolt(root, Math.cos(a * 1.571 + 0.785) * r * 1.9, 0.145, Math.sin(a * 1.571 + 0.785) * r * 1.9, { r: 0.016 });
    // access door near the base
    mesh(roundedBox(0.09, 0.24, 0.02, 0.008), frame, { parent: root, at: [0, 0.6, r * 0.95] });
    const dirs = variant === 'double' || variant === 'highway' ? [1, -1] : [1];
    const reach = variant === 'highway' ? 2.4 : variant === 'solar' ? 1.0 : 1.8;
    for (const s of dirs) {
      const arm = [[0, H - 0.9, 0], [0, H - 0.2, s * 0.25], [0, H + 0.05, s * reach * 0.55], [0, H + 0.12, s * reach]];
      curveTube(arm, variant === 'highway' ? 0.055 : 0.042, frame, { parent: root, radialSegments: 14 });
      ledHead(root, [0, H + 0.12, s * reach], new THREE.Vector3(0, 0, s), frame, lamp, { older: style === 'sodium', len: variant === 'highway' ? 0.8 : 0.62, wid: variant === 'highway' ? 0.38 : 0.3 });
    }
    lampY = H + 0.05;
    if (variant === 'solar') {
      // tilted PV panel on top + battery box
      const panel = group('solar_panel', { parent: root, at: [0, H - 0.02, 0] });
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 12), frame, { parent: panel, at: [0, 0.15, 0] });
      const tilt = group(null, { parent: panel, at: [0, 0.32, 0] });
      tilt.rotation.x = -0.55;
      mesh(roundedBox(0.95, 0.04, 0.65, 0.012), M.metal('#c9cdd0', 0.3), { parent: tilt });
      const cellTex = textTexture('', { w: 8, h: 8, bg: '#14203a', radius: 0 });
      const cells = new THREE.MeshPhysicalMaterial({ color: '#1a2a4a', roughness: 0.15, metalness: 0.4, clearcoat: 1, map: cellTex });
      mesh(new THREE.PlaneGeometry(0.9, 0.6).rotateX(-Math.PI / 2), cells, { parent: tilt, at: [0, 0.021, 0] });
      for (let k = 1; k < 6; k++) mesh(new THREE.PlaneGeometry(0.004, 0.6).rotateX(-Math.PI / 2), M.metal('#d8dadc', 0.3), { parent: tilt, at: [-0.45 + k * 0.15, 0.022, 0] });
      for (let k = 1; k < 4; k++) mesh(new THREE.PlaneGeometry(0.9, 0.004).rotateX(-Math.PI / 2), M.metal('#d8dadc', 0.3), { parent: tilt, at: [0, 0.022, -0.3 + k * 0.15] });
      mesh(roundedBox(0.26, 0.42, 0.16, 0.03), frame, { parent: root, at: [0, 2.6, 0.17] });
    }
  } else if (variant === 'classic' || variant === 'deco') {
    const prof = variant === 'classic'
      ? [[0.001, 0], [0.22, 0], [0.22, 0.06], [0.18, 0.1], [0.18, 0.16], [0.13, 0.22], [0.1, 0.42], [0.12, 0.46], [0.07, 0.52], [0.065, H - 0.55], [0.085, H - 0.5], [0.06, H - 0.45], [0.06, H - 0.2], [0.11, H - 0.15], [0.001, H - 0.13]]
      : [[0.001, 0], [0.26, 0], [0.26, 0.12], [0.2, 0.14], [0.2, 0.3], [0.15, 0.32], [0.15, 0.5], [0.09, 0.56], [0.08, H - 0.9], [0.12, H - 0.85], [0.12, H - 0.75], [0.08, H - 0.7], [0.08, H - 0.12], [0.001, H - 0.1]];
    mesh(lathe(densify(prof), variant === 'deco' ? 8 : 32), frame, { parent: root });
    const ringR = variant === 'classic' ? 0.068 : 0.085;
    for (let k = 0; k < 4; k++) mesh(new THREE.TorusGeometry(ringR, 0.008, 6, 24).rotateX(Math.PI / 2), frame, { parent: root, at: [0, 0.8 + k * 0.6, 0] });
    if (style === 'ornate' || variant === 'classic') {
      // scroll brackets under the lantern
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2;
        const pts = [];
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          const rr = 0.06 + Math.sin(t * Math.PI) * 0.14;
          pts.push([Math.cos(a) * rr, H - 0.55 + t * 0.4, Math.sin(a) * rr]);
        }
        curveTube(pts, 0.01, frame, { parent: root, radialSegments: 6 });
      }
    }
    const lan = group('lantern', { parent: root, at: [0, H - 0.13, 0] });
    if (variant === 'classic') {
      mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.04, 6), frame, { parent: lan, at: [0, 0.02, 0] });
      const glassG = new THREE.CylinderGeometry(0.2, 0.14, 0.5, 6, 1, true);
      mesh(glassG, new THREE.MeshPhysicalMaterial({ color: '#fff7e6', roughness: 0.15, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }), { parent: lan, at: [0, 0.29, 0] });
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        curveTube([[Math.cos(a) * 0.14, 0.04, Math.sin(a) * 0.14], [Math.cos(a) * 0.2, 0.54, Math.sin(a) * 0.2]], 0.008, frame, { parent: lan, segments: 2, radialSegments: 6 });
      }
      mesh(lathe([[0.2, 0.53], [0.25, 0.53], [0.24, 0.55], [0.06, 0.6], [0.001, 0.62]], 6), frame, { parent: lan });
      mesh(lathe([[0.001, 0.61], [0.05, 0.62], [0.02, 0.66], [0.025, 0.72], [0.001, 0.74]], 16), frame, { parent: lan });
      mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8), frame, { parent: lan, at: [0, 0.09, 0] });
      lamp.add(lan, { geometry: new THREE.SphereGeometry(0.075, 20, 14).translate(0, 0.21, 0), normal: [0, 0, 1], depth: 0.08, glowSize: 0.9 });
      glowCards(lamp, lan, [0, 0.27, 0], 0.9, ALL_SIDES.slice(0, 4));
      lampY = H + 0.15;
    } else {
      // art-deco: stepped crown over a tall frosted cylinder
      mesh(lathe([[0.001, 0], [0.12, 0], [0.12, 0.03], [0.1, 0.05], [0.001, 0.05]], 8), frame, { parent: lan });
      const cyl = new THREE.CylinderGeometry(0.11, 0.11, 0.55, 24).translate(0, 0.33, 0);
      lamp.add(lan, { geometry: cyl, normal: [0, 0, 1], depth: 0.1, glowSize: 1.0 });
      glowCards(lamp, lan, [0, 0.33, 0], 1.0, ALL_SIDES.slice(0, 4));
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        mesh(roundedBox(0.016, 0.56, 0.016, 0.005), frame, { parent: lan, at: [Math.cos(a) * 0.114, 0.33, Math.sin(a) * 0.114] });
      }
      for (const [y, r] of [[0.6, 0.15], [0.64, 0.12], [0.68, 0.08]]) mesh(new THREE.CylinderGeometry(r, r, 0.04, 8), frame, { parent: lan, at: [0, y, 0] });
      mesh(new THREE.ConeGeometry(0.05, 0.12, 8), frame, { parent: lan, at: [0, 0.76, 0] });
      lampY = H + 0.3;
    }
  } else if (variant === 'pendant') {
    // shepherd's crook with a hanging bell lantern
    mesh(lathe(densify([[0.001, 0], [0.2, 0], [0.2, 0.08], [0.14, 0.14], [0.12, 0.5], [0.08, 0.56], [0.07, H - 0.3], [0.001, H - 0.28]]), 32), frame, { parent: root });
    const crook = [];
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * Math.PI;
      crook.push([0, H - 0.3 + Math.sin(a) * 0.45, 0.45 - Math.cos(a) * 0.45]);
    }
    curveTube(crook, 0.045, frame, { parent: root, segments: 60, radialSegments: 12 });
    mesh(new THREE.SphereGeometry(0.055, 16, 12), frame, { parent: root, at: [0, H - 0.3, 0.9] });
    const hang = group('lantern', { parent: root, at: [0, H - 0.3, 0.9] });
    mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), frame, { parent: hang, at: [0, -0.11, 0] });
    mesh(lathe([[0.001, -0.22], [0.06, -0.22], [0.24, -0.4], [0.26, -0.44], [0.001, -0.42]], 28), frame, { parent: hang });
    lamp.add(hang, { geometry: lathe([[0.001, -0.42], [0.2, -0.44], [0.14, -0.62], [0.001, -0.66]], 24), normal: [0, -1, 0], depth: 0.05, glowSize: 1 });
    glowCards(lamp, hang, [0, -0.53, 0], 0.8, ALL_SIDES.slice(0, 4));
    lampY = H - 0.3;
    armSide = -1;
  } else if (variant === 'post-top') {
    mesh(pole(H, { r: 0.07, top: 0.065, base: 0.16, baseH: 0.1, collar: false }), frame, { parent: root });
    const top = group('lantern', { parent: root, at: [0, H, 0] });
    mesh(new THREE.CylinderGeometry(0.2, 0.08, 0.06, 32), frame, { parent: top, at: [0, 0.03, 0] });
    lamp.add(top, { geometry: new THREE.CylinderGeometry(0.19, 0.19, 0.3, 32, 1, true).translate(0, 0.21, 0), normal: [0, 0, 1], depth: 0.2, glowSize: 1.2 });
    mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 16), frame, { parent: top, at: [0, 0.21, 0] });
    glowCards(lamp, top, [0, 0.21, 0], 1.2, ALL_SIDES.slice(0, 4));
    mesh(lathe([[0.001, 0.42], [0.24, 0.36], [0.24, 0.39], [0.08, 0.44], [0.001, 0.45]], 32), frame, { parent: top });
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 32), frame, { parent: top, at: [0, 0.36, 0] });
    lampY = H + 0.2;
  } else {
    // globe / acorn
    mesh(pole(H, { r: 0.055, top: 0.045, base: 0.15, baseH: 0.1 }), frame, { parent: root });
    mesh(lathe([[0.001, 0], [0.09, 0], [0.11, 0.04], [0.1, 0.08], [0.001, 0.08]], 24), frame, { parent: root, at: [0, H - 0.02, 0] });
    lamp.add(root, { geometry: new THREE.SphereGeometry(0.22, 32, 24).translate(0, H + 0.26, 0), normal: [0, 0, 1], depth: 0.22, glowSize: 0.85 });
    glowCards(lamp, root, [0, H + 0.26, 0], 0.85, ALL_SIDES.slice(0, 4));
    lamp.lens.color.set('#fbfaf5');
    lamp.lens.emissiveIntensity = 0.25;
    lampY = H + 0.26;
  }
  if (style === 'banner') banner(root, Math.min(H, 7), (o.seed ?? 0) % 4, -armSide);
  if (style === 'basket') basket(root, [0, Math.min(H * 0.55, 3.2), 0], -armSide);
  if (style === 'sign') bladeSigns(root, 2.7);
  if (o.light) {
    const L = galvanised ? new THREE.SpotLight(lamp.lens.emissive, 0, 30, 1.0, 0.5, 1.5) : new THREE.PointLight(lamp.lens.emissive, 0, 18, 2);
    L.name = 'light';
    L.position.set(0, lampY - 0.25, galvanised ? 1.6 : 0);
    root.add(L);
    if (L.isSpotLight) {
      L.target.position.set(0, 0, galvanised ? 2.5 : 0);
      root.add(L.target);
    }
  }
  const realLight = (v2) => (o.light ? [new THREE.NumberKeyframeTrack('light.intensity', [0, 1], [v2, v2])] : []);
  const flick = (t) => (Math.sin(t * 77) > 0.55 || (t > 0.4 && t < 0.46) ? 0.15 : 4);
  const times = Array.from({ length: 49 }, (_, i) => (i / 48) * 2);
  const animations = [
    clip('lights', 1, [...lampTracks('lamp', 4, { glow: 0.95 }), ...realLight(o.intensity ?? 40)]),
    clip('flicker', 2, [
      new THREE.NumberKeyframeTrack('lamp.material.emissiveIntensity', times, times.map((t) => flick(t / 2)), THREE.InterpolateDiscrete),
      new THREE.NumberKeyframeTrack('lamp_glow.material.opacity', times, times.map((t) => (flick(t / 2) > 1 ? 0.9 : 0.05)), THREE.InterpolateDiscrete),
    ]),
  ];
  return finish(root, { type: 'streetlight', variant, o, animations, exclusive: [['lights', 'flicker']] });
}

/* ---------------------------- Traffic light ---------------------------- */

export const TRAFFIC_LIGHT_VARIANTS = {
  pole: { color: '#262b2a' },
  overhead: { color: '#2a2e2c' },
  arrow: { color: '#262b2a' },
  pedestrian: { color: '#262b2a' },
  beacon: { color: '#2a2e2c' },
};

/** Arrow / pedestrian symbol masks drawn onto lens faces. */
function symbolTexture(kind) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#111';
  if (kind === 'arrow') {
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(22, 64); g.lineTo(62, 26); g.lineTo(62, 50); g.lineTo(104, 50); g.lineTo(104, 78); g.lineTo(62, 78); g.lineTo(62, 102);
    g.closePath();
    g.fill();
  } else if (kind === 'stand' || kind === 'walk') {
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(64, 24, 11, 0, Math.PI * 2); g.fill();
    g.lineCap = 'round';
    g.strokeStyle = '#ffffff';
    g.lineWidth = 14;
    g.beginPath();
    if (kind === 'stand') {
      g.moveTo(64, 42); g.lineTo(64, 78); g.moveTo(64, 44); g.lineTo(46, 74); g.moveTo(64, 44); g.lineTo(82, 74); g.moveTo(58, 80); g.lineTo(56, 112); g.moveTo(70, 80); g.lineTo(72, 112);
    } else {
      g.moveTo(66, 42); g.lineTo(60, 76); g.moveTo(64, 46); g.lineTo(44, 66); g.moveTo(64, 46); g.lineTo(84, 62); g.moveTo(60, 76); g.lineTo(42, 110); g.moveTo(60, 76); g.lineTo(82, 106);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function signalHead(parent, at, lamps, housingMat, { size = 0.2, rot = 0, horizontal = false } = {}) {
  const n = lamps.length;
  const len = n * size * 1.18 + 0.06;
  const head = group(null, { parent, at });
  head.rotation.y = rot;
  const body = group(null, { parent: head });
  if (horizontal) body.rotation.z = Math.PI / 2;
  mesh(roundedBox(0.3, len, 0.22, 0.045), housingMat, { parent: body });
  // backplate with retro-reflective yellow border
  // black backplate with a retro-reflective yellow border on its front face only
  const bw = 0.52;
  const bh = len + 0.16;
  mesh(roundedBox(bw, bh, 0.02, 0.03), new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.6 }), { parent: body, at: [0, 0, -0.12] });
  const yel = new THREE.MeshStandardMaterial({ color: '#f2c200', roughness: 0.35, name: 'reflective' });
  for (const s of [1, -1]) {
    mesh(roundedBox(0.04, bh - 0.01, 0.006, 0.01), yel, { parent: body, at: [s * (bw / 2 - 0.025), 0, -0.108] });
    mesh(roundedBox(bw - 0.01, 0.04, 0.006, 0.01), yel, { parent: body, at: [0, s * (bh / 2 - 0.025), -0.108] });
  }
  const visorMat = new THREE.MeshStandardMaterial({ color: housingMat.color, roughness: 0.5, side: THREE.DoubleSide });
  lamps.forEach(({ grp, symbol }, i) => {
    const y = len / 2 - 0.03 - size * 1.18 * (i + 0.5);
    // dark lens cup, domed lens, visor hood
    mesh(new THREE.CylinderGeometry(size * 0.47, size * 0.47, 0.02, 28).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#0b0b0b', roughness: 0.4 }), { parent: body, at: [0, y, 0.11] });
    const lens = lathe([[size * 0.43, -0.006], [size * 0.42, 0.0], [size * 0.3, 0.012], [0.001, 0.016]], 28);
    lens.rotateX(Math.PI / 2);
    lens.translate(0, y, 0.12);
    if (horizontal) lens.rotateZ(0);
    grp.add(body, { geometry: lens, normal: [0, 0, 1], depth: 0.02, glowSize: size * 3.2 });
    if (symbol) {
      const tex = symbolTexture(symbol);
      if (tex) {
        const mask = new THREE.Mesh(new THREE.CircleGeometry(size * 0.4, 28), new THREE.MeshBasicMaterial({ color: '#000', alphaMap: tex, transparent: true, depthWrite: false }));
        mask.position.set(0, y, 0.139);
        if (horizontal) mask.rotation.z = -Math.PI / 2;
        body.add(mask);
      }
    }
    const visor = new THREE.CylinderGeometry(size * 0.5, size * 0.5, 0.18, 24, 1, true, Math.PI / 2 - 0.95, Math.PI + 1.9);
    visor.rotateX(Math.PI / 2);
    mesh(visor, visorMat, { parent: body, at: [0, y, 0.2] });
  });
  return head;
}

/** Discrete tracks driving a lamp group from a function of time (seconds). */
function lampFn(name, period, fn, on, steps = 96) {
  const times = Array.from({ length: steps + 1 }, (_, i) => (i / steps) * period);
  return [
    new THREE.NumberKeyframeTrack(`${name}.material.emissiveIntensity`, times, times.map((t) => (fn(t) ? on : 0)), THREE.InterpolateDiscrete),
    new THREE.NumberKeyframeTrack(`${name}_glow.material.opacity`, times, times.map((t) => (fn(t) ? 0.9 : 0)), THREE.InterpolateDiscrete),
  ];
}

export function createTrafficLight(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(TRAFFIC_LIGHT_VARIANTS, o.variant, 'traffic-light');
  const v = TRAFFIC_LIGHT_VARIANTS[variant];
  const style = styleOf(o);
  const root = group(`traffic-light-${variant}`);
  const housing = mats.powder(o.color ?? v.color);
  const poleMat = variant === 'overhead' ? mats.galv() : mats.powder('#2b302f');
  const red = lampGroup('red', 'red');
  const amber = lampGroup('amber', 'amber');
  const green = lampGroup('green', 'green');
  const horizontal = style === 'horizontal';
  const period = 14;
  let tracks = [];
  let flashing = [];
  let off = [];
  const P = 'cycle';
  if (variant === 'pedestrian') {
    const stand = lampGroup('ped_red', 'red');
    const walk = lampGroup('ped_green', 'green');
    mesh(pole(3.0, { r: 0.06, base: 0.17 }), poleMat, { parent: root });
    signalHead(root, [0, 2.45, 0.08], [{ grp: stand, symbol: 'stand' }, { grp: walk, symbol: 'walk' }], housing, { size: 0.26 });
    // push-button unit
    mesh(roundedBox(0.13, 0.24, 0.09, 0.025), mats.powder('#f2c200'), { parent: root, at: [0, 1.1, 0.095] });
    mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.02, 20).rotateX(Math.PI / 2), M.chrome(), { parent: root, at: [0, 1.07, 0.145] });
    const btnTex = textTexture([['PUSH', 'bold 40px Arial'], ['BUTTON', 'bold 30px Arial']], { w: 128, h: 96, bg: '#f2c200', fg: '#111', radius: 0 });
    if (btnTex) mesh(new THREE.PlaneGeometry(0.1, 0.07), new THREE.MeshStandardMaterial({ map: btnTex }), { parent: root, at: [0, 1.17, 0.1405] });
    const wait = lampGroup('wait', 'amber');
    wait.add(root, { at: [0, 1.0, 0.14], normal: [0, 0, 1], w: 0.08, h: 0.025, shape: 'strip', bezel: false });
    tracks = [...lampFn('ped_red', period, (t) => t < 9, 3), ...lampFn('ped_green', period, (t) => t >= 9 && (t < 12 || Math.floor(t * 3) % 2 === 0), 3), ...lampFn('wait', period, (t) => t > 3 && t < 9, 2.4)];
    if (style === 'countdown') {
      const cd = group('countdown', { parent: root, at: [0, 1.83, 0.08] });
      mesh(roundedBox(0.3, 0.3, 0.2, 0.04), housing, { parent: cd });
      const digits = lampGroup('countdown_digits', 'amber');
      const tex = textTexture('09', { w: 128, h: 128, bg: '#000', fg: '#ff9a00', font: 'bold 100px "Courier New", monospace', radius: 0 });
      digits.lens.map = tex;
      digits.lens.emissiveMap = tex;
      digits.add(cd, { geometry: new THREE.PlaneGeometry(0.22, 0.22).translate(0, 0, 0.102), normal: [0, 0, 1], depth: 0.01 });
      tracks.push(...lampFn('countdown_digits', period, (t) => t >= 9 && t < 14, 3));
    }
    flashing = lampFn('ped_red', 1, (t) => t < 0.5, 3);
    off = [...lampFn('ped_red', 1, () => false, 0), ...lampFn('ped_green', 1, () => false, 0)];
  } else if (variant === 'beacon') {
    // flashing amber warning beacon: two heads that alternate
    mesh(pole(3.6, { r: 0.065, base: 0.18 }), poleMat, { parent: root });
    const a2 = lampGroup('amber_b', 'amber');
    signalHead(root, [0, 3.0, 0.1], [{ grp: amber }], housing, { size: 0.3 });
    signalHead(root, [0, 2.55, 0.1], [{ grp: a2 }], housing, { size: 0.3 });
    const tex = textTexture([['SCHOOL', 'bold 90px Helvetica, Arial'], ['ZONE', 'bold 90px Helvetica, Arial']], { w: 512, h: 360, bg: '#f2e600', fg: '#111', border: '#111', borderWidth: 10, radius: 20 });
    mesh(roundedBox(0.75, 0.53, 0.012, 0.03), new THREE.MeshStandardMaterial({ color: '#f2e600' }), { parent: root, at: [0, 2.0, 0.07] });
    if (tex) mesh(new THREE.PlaneGeometry(0.74, 0.52), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }), { parent: root, at: [0, 2.0, 0.0775] });
    tracks = [...lampFn('amber', 1, (t) => t < 0.5, 2.6, 8), ...lampFn('amber_b', 1, (t) => t >= 0.5, 2.6, 8)];
    flashing = tracks;
    off = [...lampFn('amber', 1, () => false, 0), ...lampFn('amber_b', 1, () => false, 0)];
  } else {
    const L = [{ grp: red }, { grp: amber }, { grp: green }];
    const arrow = lampGroup('arrow', 'green');
    if (variant === 'arrow') L.push({ grp: arrow, symbol: 'arrow' });
    if (variant === 'pole' || variant === 'arrow') {
      mesh(pole(3.6, { r: 0.065, base: 0.18 }), poleMat, { parent: root });
      signalHead(root, [0, horizontal ? 3.35 : variant === 'arrow' ? 2.85 : 2.95, 0.1], L, housing, { horizontal });
      if (!horizontal) signalHead(root, [0, 2.3, -0.1], [{ grp: red }, { grp: amber }, { grp: green }], housing, { rot: Math.PI, size: 0.17 });
    } else {
      mesh(pole(6.2, { r: 0.13, top: 0.1, base: 0.32, baseH: 0.14 }), poleMat, { parent: root });
      curveTube([[0, 5.6, 0], [0, 5.9, 0.4], [0, 5.95, 2.5], [0, 5.95, 5.6]], 0.075, poleMat, { parent: root, radialSegments: 16 });
      mesh(lathe([[0.001, 0], [0.08, 0], [0.08, 0.04], [0.001, 0.04]], 16), poleMat, { parent: root, at: [0, 5.95, 5.59], rot: [Math.PI / 2, 0, 0] });
      for (const z of [2.6, 4.6]) {
        mesh(roundedBox(0.05, 0.25, 0.05, 0.015), poleMat, { parent: root, at: [0, 5.82, z] });
        signalHead(root, [0, horizontal ? 5.55 : 5.695 - (L.length * 0.2 * 1.18 + 0.06) / 2, z], L, housing, { rot: Math.PI / 2, horizontal });
      }
      // street name sign on the mast arm (text both sides)
      const tex = textTexture('MAIN ST', { w: 512, h: 128, bg: '#1b6b3a', fg: '#fff', font: 'bold 80px Helvetica, Arial', border: '#fff', borderWidth: 6, radius: 12 });
      const sm = tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }) : new THREE.MeshStandardMaterial({ color: '#1b6b3a' });
      mesh(roundedBox(0.012, 0.3, 1.2, 0.006), new THREE.MeshStandardMaterial({ color: '#1b6b3a', roughness: 0.5 }), { parent: root, at: [0, 5.72, 1.3] });
      for (const s of [1, -1]) mesh(new THREE.PlaneGeometry(1.18, 0.28).rotateY(s * Math.PI / 2), sm, { parent: root, at: [s * 0.0065, 5.72, 1.3] });
      for (const z of [0.85, 1.75]) mesh(roundedBox(0.03, 0.18, 0.03, 0.008), poleMat, { parent: root, at: [0, 5.86, z] });
    }
    const g = (t) => t < 6;
    const a = (t) => t >= 6 && t < 8;
    const r = (t) => t >= 8;
    tracks = [...lampFn('red', period, r, 2.6), ...lampFn('amber', period, a, 2.4), ...lampFn('green', period, g, 2.4)];
    if (variant === 'arrow') tracks.push(...lampFn('arrow', period, (t) => t < 3, 2.4));
    flashing = lampFn('amber', 1, (t) => t < 0.5, 2.4, 8);
    off = ['red', 'amber', 'green'].flatMap((nm) => lampFn(nm, 1, () => false, 0, 2));
  }
  if (style === 'camera') {
    // enforcement camera on a short bracket
    const cam = group('camera', { parent: root, at: [0, variant === 'overhead' ? 5.95 : 3.3, 0] });
    mesh(roundedBox(0.05, 0.05, 0.4, 0.015), mats.galv(), { parent: cam, at: [0, 0, 0.2] });
    const body = group(null, { parent: cam, at: [0, -0.1, 0.42] });
    body.rotation.x = 0.25;
    mesh(roundedBox(0.16, 0.14, 0.36, 0.035), M.plastic('#e8e8e6', 0.4), { parent: body });
    mesh(roundedBox(0.2, 0.02, 0.42, 0.008), M.plastic('#e8e8e6', 0.4), { parent: body, at: [0, 0.08, 0.02] });
    mesh(new THREE.CircleGeometry(0.045, 24), new THREE.MeshPhysicalMaterial({ color: '#0a0f14', roughness: 0.05, clearcoat: 1 }), { parent: body, at: [0, 0, 0.181] });
    mesh(roundedBox(0.03, 0.12, 0.03, 0.008), mats.galv(), { parent: cam, at: [0, -0.05, 0.4] });
  }
  if (style === 'countdown' && variant !== 'pedestrian') {
    const head = group('countdown', { parent: root, at: [0, variant === 'overhead' ? 4.7 : 2.0, variant === 'overhead' ? 3.6 : 0.1] });
    if (variant === 'overhead') head.rotation.y = Math.PI / 2;
    mesh(roundedBox(0.3, 0.28, 0.18, 0.04), housing, { parent: head });
    if (variant === 'overhead') mesh(roundedBox(0.04, 1.05, 0.04, 0.01), poleMat, { parent: root, at: [0, 5.35, 3.6] });
    const digits = lampGroup('countdown_digits', 'red');
    const tex = textTexture('12', { w: 128, h: 128, bg: '#000', fg: '#ff2a1a', font: 'bold 100px "Courier New", monospace', radius: 0 });
    if (tex) {
      digits.lens.map = tex;
      digits.lens.emissiveMap = tex;
    }
    digits.add(head, { geometry: new THREE.PlaneGeometry(0.22, 0.2).translate(0, 0, 0.092), normal: [0, 0, 1], depth: 0.01 });
    tracks.push(...lampFn('countdown_digits', period, (t) => t >= 8, 2.6));
  }
  const animations = [clip(P, variant === 'beacon' ? 1 : period, tracks), clip('flashing', 1, flashing), clip('off', 1, off)];
  return finish(root, { type: 'traffic-light', variant, o, animations, exclusive: [[P, 'flashing', 'off']] });
}

/* -------------------------------- Signs -------------------------------- */

function polygon(n, r, rot = 0) {
  const s = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    i === 0 ? s.moveTo(Math.cos(a) * r, Math.sin(a) * r) : s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}
/** Polygon with rounded corners (real signs never have knife-sharp points). */
function roundedPolygon(n, r, rot, cr) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const s = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[(i + n - 1) % n];
    const b = pts[(i + 1) % n];
    const p0 = p.clone().add(a.clone().sub(p).setLength(cr));
    const p1 = p.clone().add(b.clone().sub(p).setLength(cr));
    i === 0 ? s.moveTo(p0.x, p0.y) : s.lineTo(p0.x, p0.y);
    s.quadraticCurveTo(p.x, p.y, p1.x, p1.y);
  }
  s.closePath();
  return s;
}
export function roundRectShape(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

/** Flat face with planar UVs (0..1 over its bounds) so a canvas texture maps cleanly. */
export function faceGeometry(shape) {
  const g = new THREE.ShapeGeometry(shape, 24);
  g.computeBoundingBox();
  const b = g.boundingBox;
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y));
  return g;
}

/* --- pictograms (drawn on a 512 canvas, centred at 256,256 with scale k) --- */
function person(g, x, y, k, walking = true, col = '#111') {
  g.fillStyle = col;
  g.strokeStyle = col;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.arc(x, y - 72 * k, 15 * k, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 20 * k;
  g.beginPath();
  g.moveTo(x, y - 52 * k);
  g.lineTo(x - 4 * k, y);
  if (walking) {
    g.moveTo(x - 4 * k, y); g.lineTo(x - 30 * k, y + 50 * k);
    g.moveTo(x - 4 * k, y); g.lineTo(x + 24 * k, y + 22 * k); g.lineTo(x + 30 * k, y + 52 * k);
    g.moveTo(x, y - 46 * k); g.lineTo(x - 26 * k, y - 14 * k);
    g.moveTo(x, y - 46 * k); g.lineTo(x + 24 * k, y - 22 * k); g.lineTo(x + 34 * k, y - 4 * k);
  } else {
    g.moveTo(x - 4 * k, y); g.lineTo(x - 14 * k, y + 52 * k);
    g.moveTo(x - 4 * k, y); g.lineTo(x + 8 * k, y + 52 * k);
  }
  g.stroke();
}
function arrowPath(g, dir, col, k = 1) {
  g.save();
  g.translate(256, 256);
  g.rotate(dir);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(0, -150 * k); g.lineTo(90 * k, -40 * k); g.lineTo(32 * k, -40 * k); g.lineTo(32 * k, 140 * k); g.lineTo(-32 * k, 140 * k); g.lineTo(-32 * k, -40 * k); g.lineTo(-90 * k, -40 * k);
  g.closePath();
  g.fill();
  g.restore();
}
function bicycle(g, x, y, k, col) {
  g.strokeStyle = col;
  g.lineWidth = 12 * k;
  g.lineCap = 'round';
  for (const dx of [-62, 62]) { g.beginPath(); g.arc(x + dx * k, y + 30 * k, 40 * k, 0, Math.PI * 2); g.stroke(); }
  g.beginPath();
  g.moveTo(x - 62 * k, y + 30 * k); g.lineTo(x - 20 * k, y - 30 * k); g.lineTo(x + 40 * k, y - 30 * k); g.lineTo(x + 62 * k, y + 30 * k);
  g.moveTo(x - 20 * k, y - 30 * k); g.lineTo(x, y + 30 * k); g.lineTo(x + 40 * k, y - 30 * k);
  g.moveTo(x - 30 * k, y - 46 * k); g.lineTo(x - 8 * k, y - 46 * k);
  g.moveTo(x + 40 * k, y - 30 * k); g.lineTo(x + 34 * k, y - 56 * k); g.lineTo(x + 54 * k, y - 60 * k);
  g.stroke();
}
function car(g, x, y, k, col) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x - 80 * k, y + 10 * k); g.lineTo(x - 70 * k, y - 22 * k); g.lineTo(x - 40 * k, y - 26 * k); g.lineTo(x - 22 * k, y - 56 * k); g.lineTo(x + 34 * k, y - 56 * k); g.lineTo(x + 54 * k, y - 26 * k); g.lineTo(x + 80 * k, y - 20 * k); g.lineTo(x + 84 * k, y + 10 * k);
  g.closePath();
  g.fill();
  for (const dx of [-48, 52]) { g.beginPath(); g.arc(x + dx * k, y + 12 * k, 17 * k, 0, Math.PI * 2); g.fill(); }
}
function deer(g, x, y, k, col) {
  g.fillStyle = col;
  g.strokeStyle = col;
  g.lineCap = 'round';
  g.beginPath();
  g.ellipse(x - 5 * k, y, 62 * k, 26 * k, -0.08, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 11 * k;
  g.beginPath();
  g.moveTo(x + 45 * k, y - 10 * k); g.lineTo(x + 66 * k, y - 60 * k);
  for (const [a, b, c, d] of [[-50, 15, -62, 80], [-36, 15, -44, 80], [32, 15, 50, 78], [44, 12, 66, 72]]) { g.moveTo(x + a * k, y + b * k); g.lineTo(x + c * k, y + d * k); }
  g.stroke();
  g.beginPath(); g.ellipse(x + 76 * k, y - 66 * k, 20 * k, 11 * k, 0.3, 0, Math.PI * 2); g.fill();
  g.lineWidth = 6 * k;
  g.beginPath();
  g.moveTo(x + 66 * k, y - 76 * k); g.lineTo(x + 50 * k, y - 116 * k); g.moveTo(x + 58 * k, y - 96 * k); g.lineTo(x + 40 * k, y - 104 * k);
  g.moveTo(x + 74 * k, y - 78 * k); g.lineTo(x + 82 * k, y - 118 * k); g.moveTo(x + 78 * k, y - 100 * k); g.lineTo(x + 96 * k, y - 108 * k);
  g.stroke();
}
function worker(g, x, y, k, col) {
  person(g, x - 20 * k, y + 10 * k, k * 0.95, false, col);
  g.lineWidth = 9 * k;
  g.beginPath(); g.moveTo(x - 12 * k, y - 30 * k); g.lineTo(x + 50 * k, y + 50 * k); g.stroke();
  g.beginPath(); g.moveTo(x + 40 * k, y + 52 * k); g.lineTo(x + 70 * k, y + 40 * k); g.lineTo(x + 66 * k, y + 64 * k); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x + 40 * k, y + 70 * k); g.quadraticCurveTo(x + 80 * k, y + 30 * k, x + 110 * k, y + 70 * k); g.fill();
}

/** sign designs: shape + face painter. */
export const SIGN_VARIANTS = {
  stop: { shape: 'octagon', size: 0.75 },
  yield: { shape: 'triangle-down', size: 0.9 },
  speed: { shape: 'rect', w: 0.6, h: 0.76, limit: 30 },
  'no-entry': { shape: 'circle', size: 0.75 },
  parking: { shape: 'square', size: 0.6 },
  'no-parking': { shape: 'circle', size: 0.6 },
  'one-way': { shape: 'rect', w: 0.9, h: 0.3 },
  'pedestrian-crossing': { shape: 'square', size: 0.6 },
  school: { shape: 'triangle', size: 0.9 },
  roundabout: { shape: 'circle', size: 0.6 },
  'turn-left': { shape: 'circle', size: 0.6 },
  'turn-right': { shape: 'circle', size: 0.6 },
  'dead-end': { shape: 'square', size: 0.6 },
  deer: { shape: 'triangle', size: 0.9 },
  slippery: { shape: 'triangle', size: 0.9 },
  roadworks: { shape: 'triangle', size: 0.9 },
  hospital: { shape: 'square', size: 0.6 },
  'bike-lane': { shape: 'circle', size: 0.6 },
  'street-name': { shape: 'rect', w: 0.9, h: 0.2 },
  'height-limit': { shape: 'circle', size: 0.6 },
  'speed-hump': { shape: 'diamond', size: 0.75 },
  'curve-ahead': { shape: 'diamond', size: 0.75 },
};

function drawSign(variant, o) {
  const v = SIGN_VARIANTS[variant];
  const isRect = v.shape === 'rect';
  const W = isRect ? 512 : 512;
  const Hh = isRect ? Math.round((512 * v.h) / v.w) : 512;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = Hh;
  const g = c.getContext('2d');
  const RED = '#c62828';
  const BLUE = '#1565c0';
  const tri = (fill, border, down = false) => {
    g.fillStyle = border;
    g.fillRect(0, 0, W, Hh);
    g.fillStyle = fill;
    g.beginPath();
    if (down) { g.moveTo(256 - 160, 120); g.lineTo(256 + 160, 120); g.lineTo(256, 400); }
    else { g.moveTo(256, 150); g.lineTo(256 + 168, 440); g.lineTo(256 - 168, 440); }
    g.closePath();
    g.fill();
  };
  const disc = (fill, border, bw = 52) => {
    g.fillStyle = border;
    g.fillRect(0, 0, W, Hh);
    g.fillStyle = fill;
    g.beginPath();
    g.arc(256, 256, 256 - bw, 0, Math.PI * 2);
    g.fill();
  };
  const txt = (s, y, size, col, font = 'Helvetica, Arial') => {
    g.fillStyle = col;
    g.font = `bold ${size}px ${font}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(s, W / 2, y);
  };
  switch (variant) {
    case 'stop':
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = RED;
      g.beginPath();
      for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i / 8) * Math.PI * 2; const r = 235; i ? g.lineTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r) : g.moveTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r); }
      g.closePath(); g.fill();
      txt('STOP', 262, 168, '#ffffff');
      break;
    case 'yield':
      g.fillStyle = RED; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#fff';
      g.beginPath(); g.moveTo(256 - 175, 105); g.lineTo(256 + 175, 105); g.lineTo(256, 400); g.closePath(); g.fill();
      txt('YIELD', 190, 64, RED);
      break;
    case 'speed':
      g.fillStyle = '#111'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#fff'; g.fillRect(14, 14, W - 28, Hh - 28);
      txt('SPEED', 110, 92, '#111'); txt('LIMIT', 215, 92, '#111'); txt(String(o.limit ?? v.limit), 450, 250, '#111');
      break;
    case 'no-entry':
      disc(RED, RED, 0);
      g.fillStyle = '#fff'; g.fillRect(80, 216, 352, 80);
      break;
    case 'parking':
      g.fillStyle = BLUE; g.fillRect(0, 0, W, Hh);
      txt('P', 270, 400, '#fff');
      break;
    case 'no-parking':
      disc(BLUE, RED, 60);
      g.strokeStyle = RED; g.lineWidth = 56;
      g.beginPath(); g.moveTo(110, 110); g.lineTo(402, 402); g.stroke();
      break;
    case 'one-way':
      g.fillStyle = '#111'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#fff';
      g.beginPath(); g.moveTo(30, Hh / 2 - 30); g.lineTo(380, Hh / 2 - 30); g.lineTo(380, Hh / 2 - 66); g.lineTo(486, Hh / 2); g.lineTo(380, Hh / 2 + 66); g.lineTo(380, Hh / 2 + 30); g.lineTo(30, Hh / 2 + 30); g.closePath(); g.fill();
      g.fillStyle = '#111'; g.font = 'bold 50px Helvetica, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ONE WAY', 200, Hh / 2 + 2);
      break;
    case 'pedestrian-crossing':
      g.fillStyle = BLUE; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#fff';
      g.beginPath(); g.moveTo(256, 50); g.lineTo(470, 440); g.lineTo(42, 440); g.closePath(); g.fill();
      g.fillStyle = '#111';
      for (let i = 0; i < 5; i++) g.fillRect(130 + i * 54, 395, 34, 24);
      person(g, 256, 300, 1.15, true);
      break;
    case 'school':
      tri('#fff', RED);
      person(g, 220, 350, 0.95, true);
      person(g, 300, 370, 0.8, true);
      break;
    case 'roundabout':
      disc(BLUE, BLUE, 0);
      for (let i = 0; i < 3; i++) {
        g.save(); g.translate(256, 256); g.rotate((i * Math.PI * 2) / 3);
        g.strokeStyle = '#fff'; g.lineWidth = 36;
        g.beginPath(); g.arc(0, 0, 120, -0.2, 1.4); g.stroke();
        g.fillStyle = '#fff'; g.beginPath();
        const ax = Math.cos(1.6) * 120; const ay = Math.sin(1.6) * 120;
        g.moveTo(ax - 40, ay - 30); g.lineTo(ax + 30, ay - 50); g.lineTo(ax + 10, ay + 30); g.closePath(); g.fill();
        g.restore();
      }
      break;
    case 'turn-left':
    case 'turn-right':
      disc(BLUE, BLUE, 0);
      arrowPath(g, variant === 'turn-left' ? -Math.PI / 2 : Math.PI / 2, '#fff', 0.9);
      break;
    case 'dead-end':
      g.fillStyle = BLUE; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#fff'; g.fillRect(206, 170, 100, 290);
      g.fillStyle = RED; g.fillRect(110, 90, 292, 90);
      break;
    case 'deer':
      tri('#fff', RED); deer(g, 250, 350, 0.95, '#111');
      break;
    case 'slippery':
      tri('#fff', RED);
      car(g, 256, 320, 0.95, '#111');
      g.strokeStyle = '#111'; g.lineWidth = 9;
      for (const dx of [-40, 40]) { g.beginPath(); g.moveTo(256 + dx, 345); g.bezierCurveTo(256 + dx - 40, 370, 256 + dx + 40, 395, 256 + dx - 10, 425); g.stroke(); }
      break;
    case 'roadworks':
      tri('#fff', RED); worker(g, 230, 340, 0.95, '#111');
      break;
    case 'hospital':
      g.fillStyle = BLUE; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#fff'; g.fillRect(96, 96, 320, 320);
      txt('H', 268, 300, RED);
      break;
    case 'bike-lane':
      disc(BLUE, BLUE, 0); bicycle(g, 256, 250, 1.3, '#fff');
      break;
    case 'street-name':
      g.fillStyle = '#1b6b3a'; g.fillRect(0, 0, W, Hh);
      g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, Hh - 20);
      txt(o.text ?? 'MAPLE AVE', Hh / 2 + 4, 74, '#fff');
      break;
    case 'height-limit':
      disc('#fff', RED, 54);
      g.fillStyle = '#111';
      g.beginPath(); g.moveTo(256, 120); g.lineTo(220, 165); g.lineTo(292, 165); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(256, 392); g.lineTo(220, 347); g.lineTo(292, 347); g.closePath(); g.fill();
      txt(`${o.limit ?? 3.5}m`, 262, 130, '#111');
      break;
    case 'speed-hump':
    case 'curve-ahead':
      g.fillStyle = '#111'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#f2c200';
      g.beginPath(); g.moveTo(256, 16); g.lineTo(496, 256); g.lineTo(256, 496); g.lineTo(16, 256); g.closePath(); g.fill();
      if (variant === 'speed-hump') {
        g.fillStyle = '#111'; g.beginPath(); g.moveTo(120, 320); g.quadraticCurveTo(256, 160, 392, 320); g.closePath(); g.fill();
        g.fillRect(110, 318, 292, 16);
      } else {
        g.strokeStyle = '#111'; g.lineWidth = 46; g.lineCap = 'butt';
        g.beginPath(); g.moveTo(230, 400); g.lineTo(230, 280); g.quadraticCurveTo(230, 190, 310, 190); g.stroke();
        g.fillStyle = '#111'; g.beginPath(); g.moveTo(300, 120); g.lineTo(390, 190); g.lineTo(300, 260); g.closePath(); g.fill();
      }
      break;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function signShape(v) {
  const s = v.size ?? 0.6;
  switch (v.shape) {
    case 'octagon': return roundedPolygon(8, s / 2 / Math.cos(Math.PI / 8), Math.PI / 8, 0.02);
    case 'triangle': return roundedPolygon(3, s / Math.sqrt(3), Math.PI / 2, 0.04);
    case 'triangle-down': return roundedPolygon(3, s / Math.sqrt(3), -Math.PI / 2, 0.04);
    case 'circle': return new THREE.Shape().absarc(0, 0, s / 2, 0, Math.PI * 2, false);
    case 'diamond': return roundedPolygon(4, s / Math.SQRT2, 0, 0.03);
    case 'square': return roundRectShape(s, s, 0.03);
    default: return roundRectShape(v.w, v.h, 0.025);
  }
}

/** Builds one sign plate (face + galvanised back + rim). Returns { group, h }. */
export function signPlate(variant, o = {}, scale = 1) {
  const v = SIGN_VARIANTS[variant];
  const shape = signShape(v);
  const plate = new THREE.Group();
  plate.name = 'plate';
  const rim = new THREE.ExtrudeGeometry(shape, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.003, bevelSegments: 2, curveSegments: 24 });
  mesh(rim, M.metal('#c9cdd0', 0.4), { parent: plate });
  const tex = drawSign(variant, o);
  const fallback = { stop: '#c62828', yield: '#ffffff', 'no-entry': '#c62828', parking: '#1565c0', 'street-name': '#1b6b3a', 'one-way': '#111' }[variant] ?? '#f2f2f2';
  const faceMat = tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.05, name: 'sign-face' }) : new THREE.MeshStandardMaterial({ color: fallback, roughness: 0.35 });
  mesh(faceGeometry(shape), faceMat, { parent: plate, at: [0, 0, 0.0065] });
  const back = faceGeometry(shape);
  back.rotateY(Math.PI);
  mesh(back, M.metal('#b8bcc0', 0.5), { parent: plate, at: [0, 0, -0.0025], name: 'sign_back' });
  plate.scale.setScalar(scale);
  const b = new THREE.Box3().setFromObject(plate);
  return { group: plate, h: b.max.y - b.min.y, w: b.max.x - b.min.x };
}

function supplementary(text) {
  const tex = textTexture(text, { w: 512, h: 160, bg: '#ffffff', fg: '#111', font: 'bold 64px Helvetica, Arial', border: '#111', borderWidth: 8, radius: 14 });
  const g = new THREE.Group();
  mesh(roundedBox(0.5, 0.16, 0.006, 0.02), M.metal('#c9cdd0', 0.4), { parent: g });
  if (tex) mesh(new THREE.PlaneGeometry(0.49, 0.155), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }), { parent: g, at: [0, 0, 0.0035] });
  return g;
}

function clamp(root, y, mat) {
  // U-bolt clamp hugging the post with a nut each side
  mesh(roundedBox(0.075, 0.035, 0.03, 0.01), mat, { parent: root, at: [0, y, 0.035] });
  for (const x of [-0.03, 0.03]) bolt(root, x, y, 0.052, { r: 0.007 });
}

export function createSign(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(SIGN_VARIANTS, o.variant, 'sign');
  const style = styleOf(o);
  const root = group(`sign-${variant}`);
  const postMat = mats.galv();
  const big = style === 'large' ? 1.6 : 1;
  const { group: plate, h, w } = signPlate(variant, o, big);
  const temporary = style === 'temporary';
  const bottom = temporary ? 0.9 : variant === 'street-name' ? 2.55 : 2.1 + (style === 'supplementary' ? 0.2 : 0);
  const signY = bottom + h / 2;
  const v0 = SIGN_VARIANTS[variant];
  const narrowTop = v0.shape === 'diamond' || v0.shape === 'triangle' || v0.shape === 'triangle-down' || v0.shape === 'octagon' || v0.shape === 'circle';
  const posts = style === 'large' ? (narrowTop ? [-w * 0.13, w * 0.13] : [-w * 0.3, w * 0.3]) : [0];
  const top = signY + h / 2 - (variant === 'street-name' ? -0.02 : 0.03);
  if (temporary) {
    // portable stand: tube frame, rubber feet and a sandbag on each foot
    const frame = mats.powder('#e8e8e4');
    curveTube([[0, 0.12, 0], [0, signY + h * 0.3, 0]], 0.022, frame, { parent: root, segments: 2, radialSegments: 10 });
    for (const s of [1, -1]) {
      curveTube([[0, 0.14, 0], [s * 0.45, 0.035, 0]], 0.02, frame, { parent: root, segments: 2, radialSegments: 8 });
      curveTube([[0, 0.14, 0], [0, 0.035, s * 0.45]], 0.02, frame, { parent: root, segments: 2, radialSegments: 8 });
      const bag = new THREE.SphereGeometry(1, 16, 10);
      bag.scale(0.2, 0.07, 0.13);
      mesh(bag, new THREE.MeshStandardMaterial({ color: '#a08c63', roughness: 1, name: 'sandbag' }), { parent: root, at: [s * 0.42, 0.07, 0] });
      mesh(bag, new THREE.MeshStandardMaterial({ color: '#8e7b55', roughness: 1, name: 'sandbag' }), { parent: root, at: [0, 0.07, s * 0.42], rot: [0, Math.PI / 2, 0] });
    }
    mesh(new THREE.SphereGeometry(0.035, 12, 8), frame, { parent: root, at: [0, 0.14, 0] });
  } else {
    for (const x of posts) {
      // concrete footing + rounded square post with a cap
      mesh(lathe([[0.001, 0], [0.12, 0], [0.13, 0.03], [0.1, 0.06], [0.001, 0.06]], 24), mats.concrete(), { parent: root, at: [x, 0, 0] });
      mesh(roundedBox(0.05, top - 0.04, 0.05, 0.012), postMat, { parent: root, at: [x, (top - 0.04) / 2 + 0.03, 0] });
      mesh(roundedBox(0.058, 0.02, 0.058, 0.007), postMat, { parent: root, at: [x, top, 0] });
      for (const dy of [h * 0.3, -h * 0.3]) clamp(group(null, { parent: root, at: [x, 0, 0] }), signY + dy, postMat);
    }
  }
  plate.position.set(0, signY, temporary ? 0.025 : 0.055);
  root.add(plate);
  if (style === 'supplementary') {
    const texts = { parking: '2 HOUR LIMIT', 'no-parking': '7AM – 7PM', school: 'WHEN FLASHING', speed: 'CAMERA ENFORCED', 'no-entry': 'EXCEPT BUSES', 'height-limit': 'NO TRUCKS' };
    const sup = supplementary(texts[variant] ?? 'NEXT 500 m');
    sup.position.set(0, bottom - 0.12, 0.05);
    sup.scale.setScalar(big);
    root.add(sup);
    clamp(root, bottom - 0.12, postMat);
  }
  const animations = [];
  if (style === 'flashing') {
    // solar-powered flashing beacons above the sign
    const lamp = lampGroup('beacon', 'amber');
    const y = signY + h / 2 + 0.16;
    for (const x of [-0.2, 0.2]) {
      mesh(roundedBox(0.14, 0.14, 0.08, 0.03), M.plastic('#1a1a1a'), { parent: root, at: [x, y, 0.06] });
      lamp.add(root, { at: [x, y, 0.1], normal: [0, 0, 1], w: 0.1, h: 0.1, shape: 'round', depth: 0.02 });
    }
    mesh(roundedBox(0.5, 0.03, 0.03, 0.01), postMat, { parent: root, at: [0, y - 0.085, 0.04] });
    mesh(roundedBox(0.05, Math.max(0.05, y - top + 0.1), 0.05, 0.012), postMat, { parent: root, at: [0, (top + y) / 2 - 0.04, 0] });
    const panel = group(null, { parent: root, at: [0, y + 0.2, -0.02] });
    panel.rotation.x = -0.6;
    mesh(roundedBox(0.36, 0.02, 0.26, 0.008), new THREE.MeshPhysicalMaterial({ color: '#1a2a4a', roughness: 0.15, clearcoat: 1 }), { parent: panel });
    mesh(roundedBox(0.04, 0.2, 0.04, 0.01), postMat, { parent: root, at: [0, y + 0.08, -0.01] });
    const lt = (name, phase) => lampFn(name, 1, (t) => (t + phase) % 1 < 0.5, 2.4, 8);
    animations.push(clip('flashing', 1, [...lt('beacon', 0)]));
  }
  return finish(root, { type: 'sign', variant, o, animations });
}
