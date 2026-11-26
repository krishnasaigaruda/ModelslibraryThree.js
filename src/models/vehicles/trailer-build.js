import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { group, roundedBox, lathe, extrudeOutline } from '../../core/utils.js';
import { Merge, bevelBox, addHeavyWheels, makeRam, anchor, poseClip, cycle, ladder, handrail } from './heavy-kit.js';

/*
 * Semi-trailers (used by the semi truck and the standalone 'trailer' type).
 * Real-world proportions: deck ~1.24 m, width 2.55 m, kingpin 1.2 m behind the front,
 * tandem axles 1.31 m apart, 22.5" duals (r 0.52), landing gear ~2.4 m behind the kingpin.
 * Faces +X. Every part is bolted to the frame (no floating parts).
 */

export const TRAILER_KINDS = ['box', 'reefer', 'curtainside', 'flatbed', 'tanker', 'lowboy', 'car-carrier', 'container', 'livestock', 'logging', 'dump', 'grain'];

let plateTex = null;
function plateTexture() {
  if (plateTex || typeof document === 'undefined') return plateTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f2e8';
  g.fillRect(0, 0, 256, 64);
  g.strokeStyle = '#222';
  g.lineWidth = 4;
  g.strokeRect(3, 3, 250, 58);
  g.fillStyle = '#1a1a1a';
  g.font = 'bold 40px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('ORB 4821', 128, 34);
  plateTex = new THREE.CanvasTexture(c);
  plateTex.colorSpace = THREE.SRGBColorSpace;
  return plateTex;
}

const plateBracketMat = new THREE.MeshStandardMaterial({ name: 'plate_bracket', color: '#1c1d20', roughness: 0.6, metalness: 0.4 });
/** Licence plate facing ±X (vertical), centred at `at`. */
export function plate(parent, at, facing = -1) {
  const m = new THREE.Mesh(roundedBox(0.52, 0.12, 0.012, 0.005), new THREE.MeshStandardMaterial({ color: '#ffffff', map: plateTexture(), roughness: 0.5, name: 'plate' }));
  m.position.set(...at);
  m.rotation.y = facing < 0 ? -Math.PI / 2 : Math.PI / 2;
  m.name = 'plate';
  parent.add(m);
  // bracket: backing plate with a strap up to the rear frame and a stay into the body
  const bk = new THREE.Mesh(roundedBox(0.3, 0.14, 0.5, 0.01), plateBracketMat);
  bk.name = 'plate_bracket';
  bk.position.set(at[0] - facing * 0.156, at[1], at[2]);
  parent.add(bk);
  const st = new THREE.Mesh(roundedBox(0.02, 0.5, 0.08, 0.005), plateBracketMat);
  st.name = 'plate_bracket';
  st.position.set(at[0] - facing * 0.016, at[1] + 0.25, at[2]);
  parent.add(st);
  return m;
}

/**
 * Two hinged rear doors (panels + lock rods + handles) on a box body whose rear face is at x.
 * Pushes { node, angle } for the 'doors' clip into `doors`.
 */
export function rearDoors(parent, { x, y0, height, W, mats, doors, panelMat }) {
  for (const s of [1, -1]) {
    const d = group(`rear_door_${s > 0 ? 'R' : 'L'}`, { parent, at: [x, 0, s * (W / 2 - 0.01)] });
    const m = new Merge();
    const half = W / 2 - 0.02;
    m.add(roundedBox(0.03, height - 0.1, half, 0.01, 2), panelMat ?? mats.cargo, { at: [-0.016, y0 + height / 2, -s * half / 2] });
    for (const z of [0.3, half - 0.25]) {
      const zz = -s * z;
      m.tube([-0.05, y0 + 0.12, zz], [-0.05, y0 + height - 0.12, zz], 0.018, mats.chrome, 8);
      for (const y of [y0 + 0.1, y0 + height - 0.1]) m.box(0.05, 0.08, 0.06, mats.chrome, { at: [-0.04, y, zz], r: 0.01 });
      m.box(0.05, 0.2, 0.05, mats.chrome, { at: [-0.065, y0 + height * 0.42, zz - s * 0.07], r: 0.01 });
    }
    for (const k of [0.15, 0.5, 0.85]) m.box(0.05, 0.12, 0.14, mats.alu, { at: [-0.03, y0 + height * k, -s * 0.04], r: 0.01 });
    m.flush(d, `${d.name}_body`);
    doors.push({ node: d, angle: s * 1.75 });
  }
}

/** Rear light cluster on a surface facing -X: tail, brake, signal, reverse per side. */
export function rearLamps(lamps, parent, { x, y, W, h = 0.12, inset = 0.12 }) {
  for (const s of [1, -1]) {
    const z = (k) => s * (W / 2 - inset - k);
    (s < 0 ? lamps.signalL : lamps.signalR).add(parent, { at: [x, y, z(0)], normal: [-1, 0, 0], w: 0.12, h });
    lamps.tail.add(parent, { at: [x, y, z(0.16)], normal: [-1, 0, 0], w: 0.16, h });
    lamps.brake.add(parent, { at: [x, y, z(0.36)], normal: [-1, 0, 0], w: 0.16, h });
    lamps.reverse.add(parent, { at: [x, y, z(0.54)], normal: [-1, 0, 0], w: 0.1, h, shape: 'round' });
  }
}

function tapeMats() {
  return [M.matte('#d81f1f', 0.4), M.matte('#f2f2f2', 0.4)];
}

/** Red/white conspicuity tape along a side (z = ±side). */
function tape(mg, x0, x1, y, zAbs, mats2) {
  const n = Math.floor((x1 - x0) / 0.3);
  for (let i = 0; i < n; i++) for (const s of [1, -1]) mg.box(0.28, 0.05, 0.008, mats2[i % 2], { at: [x0 + 0.15 + i * 0.3, y, s * zAbs], r: 0.003 });
}

/**
 * Build a trailer into `root`.
 *  kind, xf (front x), xr (rear x), dy (deck bottom at the coupler, ~1.24), axles (x list),
 *  wr, mats, lamps, footY (landing gear foot height; 0 = standing alone), skirts, dolly (bool)
 * Returns { spins, extra (clips), group }
 */
export function buildTrailer(root, kind, { xf, xr, dy = 1.24, axles, wr = 0.52, mats, lamps, footY = 0.24, skirts = false, W = 2.55, name = 'trailer', load = true }) {
  const g = group(name, { parent: root });
  const mg = new Merge();
  const len = xf - xr;
  const cx = (xf + xr) / 2;
  const extra = [];
  const doors = [];
  const gooseneck = kind === 'lowboy';
  const skeletal = kind === 'container' || kind === 'logging';
  const lowY = 0.62; // lowboy well deck bottom
  const tw = 0.3;
  const wz = W / 2 - 0.08 - tw / 2;
  const beamBottom = dy - 0.36;
  const tapeM = tapeMats();

  /* ---- frame ---- */
  if (!gooseneck) {
    for (const z of [0.5, -0.5]) mg.box(len - 0.1, 0.36, 0.1, mats.steel, { at: [cx, dy - 0.18, z], r: 0.015 });
    for (let x = xr + 0.4; x < xf - 0.2; x += 1.0) mg.box(0.07, 0.18, 0.9, mats.steel, { at: [x, dy - 0.09, 0], r: 0.01 });
  } else {
    // gooseneck: raised front deck, drop to a low well deck, rear deck over the axles
    const neckEnd = xf - 3.2;
    const wellEnd = axles[0] + wr + 1.0;
    for (const z of [0.5, -0.5]) {
      mg.box(xf - neckEnd, 0.36, 0.12, mats.steel, { at: [(xf + neckEnd) / 2, dy - 0.18, z] });
      mg.add(extrudeOutline([[0, 0], [0.6, 0], [0.6, dy - lowY], [0, 0.3]], 0.12, { bevel: 0.02 }), mats.steel, { at: [neckEnd - 0.6, lowY, z] });
      mg.box(neckEnd - 0.6 - wellEnd, 0.32, 0.14, mats.steel, { at: [(neckEnd - 0.6 + wellEnd) / 2, lowY + 0.16, z] });
      mg.box(wellEnd - xr, 0.36, 0.12, mats.steel, { at: [(wellEnd + xr) / 2, dy - 0.18, z] });
      mg.add(extrudeOutline([[0, 0], [0.5, 0], [0.5, dy - lowY - 0.36 + 0.32], [0, 0.32]], 0.12, { bevel: 0.02 }), mats.steel, { at: [wellEnd, lowY, z], rot: [0, Math.PI, 0] });
    }
    mg.box(xf - neckEnd, 0.1, W - 0.1, M.wood('#6b4a2e'), { at: [(xf + neckEnd) / 2, dy + 0.05, 0] });
    mg.box(neckEnd - 0.6 - wellEnd, 0.1, W, M.wood('#6b4a2e'), { at: [(neckEnd - 0.6 + wellEnd) / 2, lowY + 0.37, 0] });
    for (const s of [1, -1]) mg.box(neckEnd - 0.6 - wellEnd, 0.3, 0.06, mats.steel, { at: [(neckEnd - 0.6 + wellEnd) / 2, lowY + 0.17, s * (W / 2 - 0.03)] });
    for (let x = wellEnd + 0.3; x < neckEnd - 0.7; x += 0.6) mg.box(0.06, 0.12, W - 0.1, mats.steel, { at: [x, lowY + 0.26, 0] });
    mg.box(wellEnd - xr, 0.1, W - 0.1, M.wood('#6b4a2e'), { at: [(wellEnd + xr) / 2, dy + 0.05, 0] });
  }
  // upper coupler plate + kingpin
  mg.box(1.8, 0.05, W - 0.2, mats.steel, { at: [xf - 0.95, dy - 0.025, 0], r: 0.01 });
  mg.add(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 12), mats.steel, { at: [xf - 1.2, dy - 0.1, 0] });

  /* ---- landing gear ---- */
  const lgx = xf - 2.6;
  {
    const top = gooseneck ? dy - 0.36 : beamBottom;
    for (const s of [1, -1]) {
      mg.box(0.18, 0.2, 0.5, mats.steel, { at: [lgx, top + 0.1, s * 0.68], r: 0.015 }); // mounting plate to beam
      mg.box(0.13, top - 0.42 - footY, 0.13, mats.iron, { at: [lgx, (top + footY + 0.42) / 2, s * 0.85], r: 0.015 });
      mg.box(0.1, 0.5, 0.1, mats.steel, { at: [lgx, footY + 0.3, s * 0.85], r: 0.012 });
      mg.box(0.32, 0.06, 0.3, mats.iron, { at: [lgx, footY + 0.03, s * 0.85], r: 0.015 });
      mg.tube([lgx, top - 0.05, s * 0.5], [lgx, footY + 0.6, s * 0.85], 0.03, mats.iron, 8);
    }
    mg.tube([lgx, (top + footY) / 2 + 0.1, -0.85], [lgx, (top + footY) / 2 + 0.1, 0.85], 0.03, mats.iron, 8);
    mg.add(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 14).rotateX(Math.PI / 2), mats.steel, { at: [lgx, top - 0.35, 0.95] });
    mg.pipe([[lgx, top - 0.35, 0.99], [lgx + 0.25, top - 0.35, 1.0], [lgx + 0.25, top - 0.5, 1.02]], 0.015, mats.steel, 10, 6);
  }

  /* ---- axles, suspension, wheels ---- */
  for (const ax of axles) {
    const beamB = gooseneck ? dy - 0.36 : beamBottom;
    for (const s of [1, -1]) {
      const z = s * 0.5;
      mg.box(0.14, beamB - wr + 0.05, 0.11, mats.iron, { at: [ax - 0.4, (beamB + wr - 0.05) / 2, z], r: 0.015 }); // hanger
      mg.box(0.62, 0.1, 0.1, mats.iron, { at: [ax - 0.12, wr - 0.02, z], r: 0.02 }); // trailing arm
      mg.add(new THREE.CylinderGeometry(0.13, 0.13, beamB - wr - 0.05, 18), mats.rubber, { at: [ax + 0.2, (beamB + wr + 0.05) / 2, z] }); // air bag
      mg.tube([ax + 0.05, wr, z * 1.2], [ax - 0.3, beamB, z * 1.2], 0.025, mats.steel, 8); // shock
    }
    mg.add(new THREE.CylinderGeometry(0.075, 0.075, 2 * wz, 14).rotateX(Math.PI / 2), mats.iron, { at: [ax, wr, 0] });
    mg.add(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 14).rotateX(Math.PI / 2), mats.iron, { at: [ax, wr, 0] }); // brake chamber
  }
  const wheelPos = [];
  axles.forEach((ax, i) => wheelPos.push([`${name}_wheel${i}L`, ax, wz, false], [`${name}_wheel${i}R`, ax, -wz, false]));
  const { spins } = addHeavyWheels(g, wheelPos, { radius: wr, width: tw, style: 'truck', dual: true, y: wr });
  // fenders (flat-top quarter fenders) bolted to the beams, mudflaps on hangers
  const aMin = Math.min(...axles);
  const aMax = Math.max(...axles);
  const fTop = gooseneck ? dy - 0.36 : beamBottom;
  for (const s of [1, -1]) {
    mg.box(0.05, 0.62, 0.66, mats.rubber, { at: [aMin - wr - 0.14, fTop - 0.42, s * (wz - 0.15)], r: 0.01 });
    mg.box(0.1, 0.06, wz + 0.05 - 0.5, mats.steel, { at: [aMin - wr - 0.12, fTop - 0.06, s * (0.5 + (wz + 0.05 - 0.5) / 2)], r: 0.01 });
    if (!skeletal && kind !== 'dump') {
      // wheel-arch liner under deck (for vans the body covers them)
      mg.box(aMax - aMin + 2 * wr + 0.3, 0.04, 0.66, mats.dark, { at: [(aMax + aMin) / 2, fTop + 0.02, s * (wz - 0.15)], r: 0.01 });
    }
  }

  /* ---- rear sill, ICC bumper, lamps, plate ---- */
  const sillY = gooseneck ? dy - 0.12 : dy - 0.12;
  mg.box(0.14, 0.26, W - 0.02, mats.steel, { at: [xr + 0.07, sillY, 0], r: 0.02 });
  const iccY = 0.52;
  for (const s of [1, -1]) mg.box(0.1, sillY - 0.13 - iccY, 0.1, mats.steel, { at: [xr + 0.2, (sillY - 0.13 + iccY) / 2, s * 0.5], r: 0.012 });
  mg.box(0.12, 0.13, W - 0.3, mats.steel, { at: [xr + 0.15, iccY, 0], r: 0.02 });
  for (let i = 0; i < 7; i++) mg.box(0.008, 0.06, (W - 0.4) / 7 - 0.02, tapeM[i % 2], { at: [xr + 0.085, iccY, -W / 2 + 0.2 + ((i + 0.5) * (W - 0.4)) / 7], r: 0.002 });
  rearLamps(lamps, g, { x: xr, y: sillY, W, h: 0.11 });
  plate(g, [xr - 0.005, sillY, 0], -1);

  /* ---- bodies ---- */
  const deckTop = dy + 0.1;
  const sideRail = () => {
    for (const s of [1, -1]) mg.box(len - 0.1, 0.2, 0.08, mats.steel, { at: [cx, dy + 0.05, s * (W / 2 - 0.04)], r: 0.015 });
    tape(mg, xr + 0.2, xf - 0.3, dy + 0.05, W / 2 + 0.002, tapeM);
  };
  const markers = (yy, zAbs = W / 2) => {
    for (const s of [1, -1]) {
      lamps.markers?.add(g, { at: [xf - 0.3, yy, s * zAbs], normal: [0, 0, s], w: 0.1, h: 0.05 });
      lamps.markersRed?.add(g, { at: [xr + 0.3, yy, s * zAbs], normal: [0, 0, s], w: 0.1, h: 0.05 });
      // lamp pods reaching back into the side rail / wall
      for (const x of [xf - 0.3, xr + 0.3]) mg.box(0.13, 0.08, 0.16, mats.dark, { at: [x, yy, s * (zAbs - 0.08 - 0.002)], r: 0.015 });
    }
  };
  const boxVan = ({ height = 2.75, mat = mats.cargo, ribs = true, reefer = false, curtains = false, slats = false }) => {
    const y0 = dy + 0.1;
    mg.box(len, 0.1, W, mats.steel, { at: [cx, dy + 0.05, 0] });
    if (!curtains) mg.add(roundedBox(len, height, W, 0.04, 2), mat, { at: [cx, y0 + height / 2, 0] });
    else {
      // curtain-side: roof, headboard, rear frame, pleated curtains
      mg.box(len, 0.12, W, mats.alu, { at: [cx, y0 + height - 0.06, 0] });
      mg.box(0.08, height, W, mat, { at: [xf - 0.04, y0 + height / 2, 0] });
      mg.box(0.12, height, W, mats.alu, { at: [xr + 0.06, y0 + height / 2, 0] });
      const n = Math.floor(len / 0.32);
      for (const s of [1, -1]) for (let i = 0; i < n; i++) {
        mg.add(roundedBox(0.34, height - 0.14, 0.05, 0.022, 2), mat, { at: [xr + 0.15 + (i + 0.5) * ((len - 0.25) / n), y0 + height / 2, s * (W / 2 - 0.03 + (i % 2 ? 0.012 : 0))] });
        if (i % 4 === 0) mg.box(0.04, height - 0.4, 0.02, mats.dark, { at: [xr + 0.15 + (i + 0.5) * ((len - 0.25) / n), y0 + height / 2, s * (W / 2 + 0.008)], r: 0.005 });
      }
    }
    if (ribs && !curtains) {
      for (let x = xr + 0.3; x < xf - 0.2; x += 0.6) for (const s of [1, -1]) mg.box(0.05, height - 0.16, 0.02, slats ? mats.alu : mats.alu, { at: [x, y0 + height / 2, s * (W / 2 + 0.008)], r: 0.006 });
      for (const y of [y0 + 0.06, y0 + height - 0.05]) mg.add(roundedBox(len + 0.02, 0.1, W + 0.04, 0.02, 2), mats.alu, { at: [cx, y, 0] });
    }
    if (slats) {
      // livestock: rows of oval ventilation slots
      const holeMat = M.matte('#1a1a1a', 1);
      for (let row = 0; row < 4; row++) for (let x = xr + 0.5; x < xf - 0.5; x += 0.4) for (const s of [1, -1]) {
        mg.add(roundedBox(0.28, 0.1, 0.01, 0.045, 2), holeMat, { at: [x, y0 + 0.5 + row * 0.55, s * (W / 2 + 0.003)] });
      }
    }
    rearDoors(g, { x: xr, y0, height, W, mats, doors, panelMat: mat });
    // roof markers front + rear
    for (const z of [-0.5, 0, 0.5]) lamps.markersRed?.add(g, { at: [xr - 0.035, y0 + height - 0.1, z], normal: [-1, 0, 0], w: 0.07, h: 0.05 });
    for (const s of [1, -1]) lamps.markers?.add(g, { at: [xf + 0.002, y0 + height - 0.12, s * (W / 2 - 0.12)], normal: [1, 0, 0], w: 0.06, h: 0.06, shape: 'round' });
    tape(mg, xr + 0.2, xf - 0.3, y0 + 0.17, W / 2 + 0.02, tapeM);
    markers(y0 + 0.35, W / 2 + 0.02);
    if (reefer) {
      // refrigeration unit on the front wall + fuel tank under the deck
      const ru = new Merge();
      ru.add(roundedBox(0.5, 1.6, 2.1, 0.12, 3), mats.decal ?? M.matte('#f2f2f2'), { at: [xf + 0.25, y0 + height - 0.95, 0] });
      ru.add(roundedBox(0.04, 1.0, 1.5, 0.02, 2), M.matte('#2a2a2a', 0.8), { at: [xf + 0.5, y0 + height - 0.95, 0] });
      for (let k = 0; k < 9; k++) ru.box(0.02, 0.012, 1.4, mats.alu, { at: [xf + 0.52, y0 + height - 1.38 + k * 0.105, 0], r: 0.004 });
      ru.flush(g, 'reefer_unit');
      mg.add(roundedBox(1.0, 0.45, 0.55, 0.1, 3), mats.alu, { at: [xf - 3.6, beamBottom + 0.12, 0.75] });
      mg.box(0.12, 0.3, 0.3, mats.steel, { at: [xf - 3.6, beamBottom + 0.2, 0.52], r: 0.01 });
    }
    if (skirts) {
      // aerodynamic side skirts on brackets + rear boat tail
      for (const s of [1, -1]) mg.add(new THREE.PlaneGeometry(0.7, height - 0.3).rotateY(s * 0.25), new THREE.MeshStandardMaterial({ color: '#d9dcdf', roughness: 0.5, side: THREE.DoubleSide }), { at: [xr - 0.33, y0 + height / 2, s * (W / 2 - 0.06 - 0.087)] });
      mg.box(0.75, 0.02, W - 0.3, M.matte('#d9dcdf', 0.5), { at: [xr - 0.32, y0 + height - 0.02, 0], rot: [0, 0, -0.18] });
    }
    return y0 + height;
  };

  if (kind === 'box' || kind === 'reefer' || kind === 'curtainside' || kind === 'livestock') {
    boxVan({
      reefer: kind === 'reefer', curtains: kind === 'curtainside', slats: kind === 'livestock',
      height: kind === 'livestock' ? 2.6 : 2.75, mat: kind === 'livestock' ? mats.alu : mats.cargo,
    });
  } else if (kind === 'flatbed' || kind === 'car-carrier') {
    mg.box(len, 0.08, W - 0.12, M.wood('#7a5232'), { at: [cx, dy + 0.06, 0] });
    sideRail();
    for (const s of [1, -1]) for (let x = xr + 0.4; x < xf - 0.2; x += 0.6) mg.box(0.08, 0.1, 0.05, mats.iron, { at: [x, dy + 0.02, s * (W / 2 + 0.025)], r: 0.01 });
    markers(dy + 0.05, W / 2 + 0.002);
    if (kind === 'flatbed' && load) {
      // steel coils in cradles + lumber bundles, strapped
      const coilM = M.metal('#8b9096', 0.3);
      for (let k = 0; k < 3; k++) {
        const x = xf - 1.6 - k * 1.9;
        mg.box(1.4, 0.18, 0.5, M.wood('#a07a4a'), { at: [x, deckTop + 0.09, 0], r: 0.01 });
        mg.add(lathe([[0.28, -0.7], [0.62, -0.7], [0.62, 0.7], [0.28, 0.7], [0.28, -0.7]], 32).rotateX(Math.PI / 2), coilM, { at: [x, deckTop + 0.18 + 0.58, 0] });
        mg.add(new THREE.TorusGeometry(0.64, 0.012, 6, 40), M.matte('#2c62c9', 0.5), { at: [x, deckTop + 0.76, 0] });
        mg.pipe([[x, deckTop, -W / 2 + 0.02], [x, deckTop + 0.9, -0.62], [x, deckTop + 1.4, 0], [x, deckTop + 0.9, 0.62], [x, deckTop, W / 2 - 0.02]], 0.012, M.matte('#e8a20c', 0.5), 24, 6);
      }
      for (let k = 0; k < 2; k++) {
        const x = xr + 2.2 + k * 2.6;
        for (let i = 0; i < 3; i++) mg.box(0.1, 0.1, W - 0.2, M.wood('#a07a4a'), { at: [x - 1 + i, deckTop + 0.05, 0] });
        mg.box(2.4, 0.9, 2.2, M.wood('#d8b67e'), { at: [x, deckTop + 0.55, 0], r: 0.02 });
        for (const dx of [-0.8, 0.8]) mg.pipe([[x + dx, deckTop, -W / 2 + 0.02], [x + dx, deckTop + 1.02, -1.12], [x + dx, deckTop + 1.02, 1.12], [x + dx, deckTop, W / 2 - 0.02]], 0.01, M.matte('#e8a20c', 0.5), 12, 6);
      }
    }
    if (kind === 'car-carrier') {
      // second deck on posts + headrack, tilting upper deck
      const upY = deckTop + 1.75;
      for (const s of [1, -1]) for (let x = xr + 0.3; x <= xf - 0.2; x += (len - 0.5) / 5) mg.box(0.12, upY - deckTop, 0.12, mats.steel, { at: [x, deckTop + (upY - deckTop) / 2, s * (W / 2 - 0.08)], r: 0.015 });
      const upper = group('upper_deck', { parent: g, at: [xf - 0.2, upY, 0] });
      const um = new Merge();
      for (const s of [1, -1]) {
        um.box(len - 0.5, 0.18, 0.12, mats.steel, { at: [-(len - 0.5) / 2, 0, s * (W / 2 - 0.08)], r: 0.015 });
        um.box(len - 0.5, 0.03, 0.55, M.metal('#a5aaaf', 0.4), { at: [-(len - 0.5) / 2, 0.1, s * 0.6] }); // wheel tracks
      }
      for (let x = -0.3; x > -(len - 0.6); x -= 0.8) um.box(0.08, 0.1, W - 0.2, mats.steel, { at: [x, 0.04, 0], r: 0.01 });
      um.flush(upper, 'upper_deck_body');
      for (const s of [1, -1]) mg.box(len - 0.5, 0.03, 0.55, M.metal('#a5aaaf', 0.4), { at: [cx, deckTop + 0.015, s * 0.6] });
      extra.push(poseClip('ramps', 6, [upper], [], (t) => { upper.rotation.z = cycle(t) * 0.12; }, 24));
    }
  } else if (kind === 'tanker') {
    const tankR = 1.0;
    const ty = dy + 0.12 + tankR;
    const tl = len - 0.6;
    const tankMat = M.metal(mats.cargoColor ?? '#d5d9de', 0.16);
    mg.add(new THREE.CylinderGeometry(tankR, tankR, tl - 0.6, 48).rotateZ(Math.PI / 2), tankMat, { at: [cx, ty, 0] });
    for (const s of [1, -1]) mg.add(new THREE.SphereGeometry(tankR, 40, 20).scale(0.3, 1, 1), tankMat, { at: [cx + s * (tl / 2 - 0.3), ty, 0] });
    for (let x = xr + 0.9; x < xf - 0.6; x += 1.3) mg.add(new THREE.TorusGeometry(tankR + 0.01, 0.028, 8, 48).rotateY(Math.PI / 2), mats.steel, { at: [x, ty, 0] });
    for (let x = xr + 1.0; x < xf - 0.8; x += 2.4) mg.add(extrudeOutline([[-0.95, 0], [0.95, 0], [0.75, 0.42], [-0.75, 0.42]], 0.18, { bevel: 0.02 }), mats.steel, { at: [x, dy, 0], rot: [0, Math.PI / 2, 0] });
    mg.box(tl - 1.2, 0.04, 0.5, mats.alu, { at: [cx, ty + tankR + 0.02, 0] });
    for (const k of [-1, 0, 1]) mg.add(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 24), mats.steel, { at: [cx + k * (tl / 3.4), ty + tankR + 0.06, 0] });
    ladder(mg, [xr + 0.25, dy + 0.1, 0], [xr + 0.45, ty + tankR, 0], 0.45, mats, 8);
    for (const s of [1, -1]) {
      const pts = [];
      for (let x = xr + 0.8; x <= xf - 0.8; x += (tl - 1.2) / 6) {
        pts.push([x, ty + tankR + 0.5, s * 0.26]);
        mg.tube([x, ty + tankR + 0.02, s * 0.26], [x, ty + tankR + 0.5, s * 0.26], 0.014, M.paint('#f2b705'), 6);
      }
      mg.pipe(pts, 0.02, M.paint('#f2b705'), 24, 6);
    }
    // hose tubes + valve cabinet under the tank, bolted to the beams
    for (const s of [1, -1]) {
      mg.add(new THREE.CylinderGeometry(0.1, 0.1, len * 0.5, 14).rotateZ(Math.PI / 2), mats.alu, { at: [cx, dy - 0.1, s * 1.05] });
      mg.box(0.08, 0.08, 0.55, mats.steel, { at: [cx - len * 0.2, dy - 0.04, s * 0.78], r: 0.01 });
      mg.box(0.08, 0.08, 0.55, mats.steel, { at: [cx + len * 0.2, dy - 0.04, s * 0.78], r: 0.01 });
    }
    mg.box(0.8, 0.5, 0.6, mats.alu, { at: [cx - 1.5, dy - 0.3, 0.8], r: 0.04 });
    mg.box(0.3, 0.12, 0.35, mats.steel, { at: [cx - 1.5, dy - 0.06, 0.55], r: 0.01 });
    markers(dy - 0.1, 1.155);
  } else if (kind === 'lowboy') {
    markers(dy + 0.05, W / 2);
    if (load) {
      // a transformer-style heavy load on cribbing, chained down
      const base = lowY + 0.42;
      const wellMid = ((xf - 3.8) + (axles[0] + wr + 1.0)) / 2;
      for (const dx of [-1.2, 1.2]) mg.box(0.3, 0.2, 2.2, M.wood('#a07a4a'), { at: [wellMid + dx, base + 0.1, 0] });
      mg.add(roundedBox(3.2, 2.0, 2.0, 0.12, 3), M.paint('#6e7f8e', { metallic: 0.3, roughness: 0.5 }), { at: [wellMid, base + 1.2, 0] });
      for (let k = 0; k < 8; k++) mg.box(3.0, 0.05, 2.05, mats.steel, { at: [wellMid, base + 0.5 + k * 0.2, 0], r: 0.01 });
      for (const z of [-0.6, 0, 0.6]) {
        mg.add(new THREE.CylinderGeometry(0.12, 0.16, 0.6, 16), M.matte('#7c4a2a', 0.6), { at: [wellMid + 0.6, base + 2.5, z] });
        for (let k = 0; k < 5; k++) mg.add(new THREE.TorusGeometry(0.15, 0.025, 6, 16).rotateX(Math.PI / 2), M.matte('#7c4a2a', 0.6), { at: [wellMid + 0.6, base + 2.3 + k * 0.1, z] });
      }
      for (const s of [1, -1]) for (const dx of [-1.4, 1.4]) mg.tube([wellMid + dx * 1.4, lowY + 0.42, s * (W / 2 - 0.05)], [wellMid + dx, base + 0.9, s * 1.0], 0.02, mats.steel, 6);
    }
  } else if (kind === 'container') {
    // skeletal chassis + 40 ft ISO container with corrugated walls and corner castings
    for (const s of [1, -1]) mg.box(len - 0.2, 0.08, 0.2, mats.steel, { at: [cx, dy + 0.04, s * 1.1], r: 0.01 });
    for (const x of [xf - 0.15, xf - 6.1, xr + 0.15]) mg.box(0.12, 0.12, W - 0.1, mats.steel, { at: [x, dy + 0.06, 0], r: 0.01 });
    const cl = Math.min(12.19, len - 0.1);
    const ccx = xr + 0.05 + cl / 2;
    const cy = dy + 0.12;
    const ch = 2.59;
    const contM = M.paint(mats.cargoColor ?? '#b0412b', { metallic: 0.2, roughness: 0.55 });
    mg.add(roundedBox(cl, ch, 2.44, 0.03, 2), contM, { at: [ccx, cy + ch / 2, 0] });
    for (let x = ccx - cl / 2 + 0.15; x < ccx + cl / 2 - 0.1; x += 0.28) for (const s of [1, -1]) mg.box(0.12, ch - 0.25, 0.03, contM, { at: [x, cy + ch / 2, s * 1.225], r: 0.01 });
    for (const x of [ccx - cl / 2 + 0.09, ccx + cl / 2 - 0.09]) for (const y of [cy + 0.08, cy + ch - 0.08]) for (const s of [1, -1]) mg.box(0.18, 0.16, 0.18, mats.iron, { at: [x, y, s * 1.13], r: 0.015 });
    const rx = ccx - cl / 2 - 0.004;
    mg.box(0.012, ch - 0.2, 0.014, M.matte('#050505'), { at: [rx, cy + ch / 2, 0] });
    for (const z of [-0.9, -0.35, 0.35, 0.9]) mg.tube([rx - 0.025, cy + 0.15, z], [rx - 0.025, cy + ch - 0.15, z], 0.018, mats.steel, 8);
    markers(dy + 0.04, 1.2);
  } else if (kind === 'logging') {
    for (const s of [1, -1]) mg.box(len - 0.2, 0.12, 0.16, mats.steel, { at: [cx, dy + 0.06, s * 0.5], r: 0.01 });
    const bunks = [xf - 1.6, cx + 1.0, xr + 1.4];
    const logM = M.matte('#7a5636', 0.9);
    const endM = M.matte('#d8b27a', 0.8);
    for (const x of bunks) {
      mg.box(0.25, 0.2, W - 0.05, mats.iron, { at: [x, dy + 0.22, 0], r: 0.02 });
      for (const s of [1, -1]) mg.box(0.14, 1.7, 0.14, mats.iron, { at: [x, dy + 0.32 + 0.85, s * (W / 2 - 0.1)], r: 0.02 });
    }
    if (load) {
      const ll = len - 1.6;
      const r = 0.2;
      let row = 0;
      for (let y = dy + 0.32 + r; row < 4; y += r * 1.75, row++) {
        const n = 5 - (row % 2);
        for (let i = 0; i < n; i++) {
          const z = -((n - 1) * r * 1.02) + i * r * 2.04;
          const rr = r * (0.88 + ((i * 7 + row * 3) % 5) * 0.04);
          const lx = cx + ((i + row) % 3 - 1) * 0.15;
          mg.add(new THREE.CylinderGeometry(rr, rr * 1.04, ll, 14, 1, true).rotateZ(Math.PI / 2), logM, { at: [lx, y, z] });
          for (const s of [1, -1]) mg.add(new THREE.CircleGeometry(rr, 14).rotateY(s * Math.PI / 2), endM, { at: [lx + s * ll / 2, y, z] });
        }
      }
      for (const x of bunks) mg.pipe([[x + 0.3, dy + 0.32, -W / 2 + 0.06], [x + 0.3, dy + 1.95, -0.9], [x + 0.3, dy + 1.95, 0.9], [x + 0.3, dy + 0.32, W / 2 - 0.06]], 0.014, mats.steel, 16, 6);
    }
    markers(dy + 0.06, 0.6);
  } else if (kind === 'dump' || kind === 'grain') {
    if (kind === 'dump') {
      // half-round end-dump tub that tips
      const hinge = [xr + 0.15, dy + 0.1];
      const tub = group('dump_tub', { parent: g, at: [hinge[0], hinge[1], 0] });
      const tm = new Merge();
      const tl = len - 0.6;
      const shape = new THREE.Shape();
      shape.moveTo(-W / 2 + 0.05, 1.5);
      shape.lineTo(-W / 2 + 0.05, 0.75);
      shape.absarc(0, 0.75, W / 2 - 0.05, Math.PI, 0, false);
      shape.lineTo(W / 2 - 0.05, 1.5);
      shape.lineTo(W / 2 - 0.12, 1.5);
      shape.lineTo(W / 2 - 0.12, 0.75);
      shape.absarc(0, 0.75, W / 2 - 0.12, 0, Math.PI, true);
      shape.lineTo(-W / 2 + 0.12, 1.5);
      const tg = new THREE.ExtrudeGeometry(shape, { depth: tl, bevelEnabled: false, curveSegments: 24 });
      tg.rotateY(Math.PI / 2);
      tm.add(tg, mats.cargo, { at: [0, -0.0, 0] });
      tm.add(new THREE.CircleGeometry(W / 2 - 0.05, 32, Math.PI, Math.PI).rotateY(Math.PI / 2), mats.cargo, { at: [tl, 0.75, 0] });
      tm.box(0.06, 0.75, W - 0.1, mats.cargo, { at: [tl, 1.125, 0] });
      for (let x = 0.6; x < tl - 0.2; x += 1.0) tm.add(new THREE.TorusGeometry(W / 2 - 0.02, 0.04, 6, 32, Math.PI).rotateX(Math.PI).rotateY(Math.PI / 2), mats.cargo, { at: [x, 0.75, 0] });
      for (const s of [1, -1]) tm.box(tl, 0.14, 0.12, mats.cargo, { at: [tl / 2, 1.5, s * (W / 2 - 0.06)], r: 0.02 });
      tm.box(tl, 0.16, 0.6, mats.steel, { at: [tl / 2, -0.0 + 0.08 - 0.08, 0], r: 0.02 }); // tub sub-frame on the hinge line
      tm.flush(tub, 'dump_tub_body');
      const gate = group('tailgate', { parent: tub, at: [-0.02, 1.5, 0] });
      const gm = new Merge();
      gm.add(new THREE.CircleGeometry(W / 2 - 0.05, 32, Math.PI, Math.PI).rotateY(-Math.PI / 2), mats.cargo, { at: [0, -0.75, 0] });
      gm.box(0.06, 0.75, W - 0.1, mats.cargo, { at: [0, -0.375, 0] });
      gm.flush(gate, 'tailgate_body');
      // telescopic hoist at the front
      const top = anchor(tub, [tl - 0.2, 1.3, 0]);
      const ram = makeRam(g, 'hoist', [xf - 0.9, dy - 0.05, 0], top, { r: 0.12, mats });
      extra.push(poseClip('tip', 8, [tub, gate], [ram], (t) => {
        const a = cycle(t, 0.25) * 0.85;
        tub.rotation.z = -a;
        gate.rotation.z = a * 0.9;
      }, 40));
    } else {
      // grain hopper: two hoppers, sloped ends, tarp roof
      const y0 = dy + 0.1;
      const h = 2.0;
      const hopM = mats.alu;
      for (const s of [1, -1]) {
        mg.box(len - 0.4, h, 0.05, hopM, { at: [cx, y0 + h / 2 + 0.4, s * (W / 2 - 0.025)], r: 0.012 });
        mg.box(0.05, h, W, hopM, { at: [cx + s * (len / 2 - 0.22), y0 + h / 2 + 0.4, 0], r: 0.012 });
      }
      mg.box(len - 0.5, 0.04, W - 0.1, mats.steel, { at: [cx, y0 + 0.42, 0], r: 0.01 });
      for (const hx of [cx + len * 0.22, cx - len * 0.22]) {
        mg.add(new THREE.CylinderGeometry(1.0, 0.25, 1.0, 4, 1).rotateY(Math.PI / 4).scale(1.6, 1, 1.1), hopM, { at: [hx, y0 + 0.0, 0] });
        mg.box(0.5, 0.15, 0.5, mats.steel, { at: [hx, y0 - 0.55, 0], r: 0.02 });
      }
      // tarp rolled up on one side + roof bows over the open top
      mg.add(new THREE.CylinderGeometry(0.12, 0.12, len - 0.5, 16).rotateZ(Math.PI / 2), M.matte('#2d4a2b', 0.8), { at: [cx, y0 + h + 0.45, -(W / 2 - 0.12)] });
      for (let x = xr + 0.8; x < xf - 0.5; x += 1.6) mg.pipe([[x, y0 + h + 0.38, -W / 2 + 0.03], [x, y0 + h + 0.75, 0], [x, y0 + h + 0.38, W / 2 - 0.03]], 0.02, mats.steel, 12, 6);
      for (let x = xr + 0.5; x < xf - 0.3; x += 0.7) for (const s of [1, -1]) mg.box(0.06, h - 0.1, 0.02, mats.alu, { at: [x, y0 + h / 2 + 0.4, s * (W / 2 + 0.008)], r: 0.006 });
      ladder(mg, [xf - 0.15, dy + 0.1, 0.6], [xf - 0.15, y0 + h + 0.4, 0.6], 0.42, mats, 8);
    }
    markers(dy + 0.05, W / 2);
    if (kind === 'grain') sideRail();
  }

  if (skirts && !gooseneck) {
    // aerodynamic side skirts on brackets between landing gear and axles
    const skM = M.paint('#e9eef2', { metallic: 0.1, roughness: 0.4 });
    for (const s of [1, -1]) {
      mg.add(roundedBox(lgx - 0.4 - (aMax + wr + 0.3), 0.75, 0.03, 0.012, 2), skM, { at: [((lgx - 0.4) + (aMax + wr + 0.3)) / 2, dy - 0.37, s * (W / 2 - 0.05)] });
      for (let x = aMax + wr + 0.6; x < lgx - 0.6; x += 1.4) mg.tube([x, dy - 0.05, s * 0.5], [x, dy - 0.45, s * (W / 2 - 0.07)], 0.02, mats.steel, 6);
      for (let i = 0; i < 6; i++) mg.box(0.5, 0.06, 0.008, i % 2 ? M.matte('#2a62d0', 0.5) : M.matte('#1aa39a', 0.5), { at: [aMax + wr + 0.9 + i * 0.55, dy - 0.55, s * (W / 2 - 0.03)], r: 0.003 });
    }
  }
  mg.flush(g, `${name}_body`);
  return { spins, extra, group: g, landingX: lgx, doors };
}
