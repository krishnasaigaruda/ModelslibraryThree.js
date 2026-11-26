// Van-specific moving panels (sliding side door, rear barn doors, serving hatch)
// and equipment (beacons, ladders, awnings, fridge units, liveries) for buildVehicle.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, lathe } from '../../core/utils.js';
import { moveTrack, rotateTrack, clip } from '../../core/animation.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { surfAt, surfaceGrid, textMaterial, drawMaterial, roofBars, canvasTexture } from './car-parts.js';

const ease = (t) => t * t * (3 - 2 * t);
/** 0→1 over [a,b], hold, 1→0 over [c,d] */
const openHold = (t, a = 0.05, b = 0.3, c = 0.7, d = 0.95) => (t < a ? 0 : t < b ? ease((t - a) / (b - a)) : t < c ? 1 : t < d ? 1 - ease((t - c) / (d - c)) : 0);

/** Panel = outer skin + inner lining for a body region, built in parent space then moved under a pivot. */
function panel(loft, pivot, pivotPos, spec, outer, inner, name) {
  const g = new THREE.Group();
  g.name = name;
  for (const [mat, off] of [[outer, 0.0], [inner, -0.012]]) {
    const geo = surfaceGrid(loft, { ...spec, offset: off });
    geo.translate(-pivotPos.x, -pivotPos.y, -pivotPos.z);
    mesh(geo, mat, { parent: g, name: `${name}_${off ? 'inner' : 'skin'}` });
  }
  pivot.add(g);
  return g;
}

export function buildVanParts(ctx) {
  const { v, body, loft, h, W, paint, glass, trim, gloss, CHROME, slideH, rearH, hatchH, rd, fTop, P, RP } = ctx;
  const out = { extra: [], sirenTracks: null, lightTracks: [] };
  // inner door trim: moulded grey panel with pressed recesses, stiffening ribs and rivets (not a flat black sheet)
  const liningTex = typeof document === 'undefined' ? null : canvasTexture('van-door-lining', 256, 512, (c, w, hh) => {
    c.fillStyle = '#5d6166'; c.fillRect(0, 0, w, hh);
    for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},0.035)`; c.fillRect(Math.random() * w, Math.random() * hh, 2, 2); }
    const recess = (x, y, rw, rh) => { c.fillStyle = '#50545a'; c.beginPath(); c.roundRect(x, y, rw, rh, 18); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 3; c.stroke(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2; c.beginPath(); c.roundRect(x + 3, y + 3, rw - 6, rh - 6, 16); c.stroke(); };
    recess(26, 40, w - 52, hh * 0.36);
    recess(26, hh * 0.52, w - 52, hh * 0.4);
    c.fillStyle = '#6a6e73'; for (const y of [hh * 0.455, hh * 0.475]) c.fillRect(0, y, w, 6);
    c.fillStyle = '#3a3d41'; for (let x = 18; x < w; x += 38) for (const y of [16, hh * 0.465, hh - 16]) { c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); }
  });
  const lining = new THREE.MeshStandardMaterial({ color: '#ffffff', map: liningTex, roughness: 0.72, metalness: 0.05, name: 'door-lining', side: THREE.DoubleSide });
  const seam = new THREE.MeshBasicMaterial({ color: '#050505' });

  // ---- sliding side door (curb side, +Z) ----
  if (v.sliding) {
    const [xa, xb] = v.sliding;
    const door = group('sliding_door', { parent: body });
    const mid = RP('side', v.slidingGlass ? 0.12 : 1);
    panel(loft, door, new THREE.Vector3(), { x: [xa, xb], h: [slideH[0], mid], side: 1, nx: 10, ny: 8 }, paint, lining, 'sliding_panel');
    if (v.slidingGlass) panel(loft, door, new THREE.Vector3(), { x: [xa, xb], h: [mid, slideH[1]], side: 1, nx: 10, ny: 4 }, glass, glass, 'sliding_glass');
    // shut lines and a handle
    for (const x of [xa - 0.008, xb]) mesh(loft.patch({ x: [x, x + 0.008], from: slideH[0], to: slideH[1], side: 'pos', offset: 0.0015 }), seam, { parent: body, name: 'shut-line' });
    const hp = P(xa + 0.2, 'lower', 0.86, 1);
    const handle = mesh(roundedBox(0.2, 0.03, 0.025, 0.01), trim, { parent: door, name: 'sliding_handle' });
    handle.position.copy(hp.point).addScaledVector(hp.normal, 0.01);
    // rail along the body side below the rear window line
    const rail = [];
    for (let x = xa - 0.05; x >= Math.max(-h + (rd || 0.2) + 0.1, xa - (xb - xa) - 0.2); x -= 0.15) {
      const p = P(x, 'side', 1 / 6, 1); // on a ring row of the skin so the rail sits on real vertices
      rail.push(p.point.clone().addScaledVector(p.normal, 0.004).toArray());
    }
    if (rail.length > 1) curveTube(rail, 0.012, trim, { parent: body, name: 'slide_rail' });
    const travel = (xb - xa) * 0.95;
    out.extra.push(clip('slidingDoor', 4, [moveTrack(door, 4, (t) => {
      const k = openHold(t);
      const outK = Math.min(1, k * 5);
      return [-travel * Math.max(0, (k - 0.2) / 0.8), 0, 0.07 * outK];
    }, 40)]));
  }

  // ---- rear barn doors ----
  if (rd) {
    const doors = [];
    for (const s of [1, -1]) {
      const hinge = surfAt(loft, -h + rd, (rearH[0] + rearH[1]) / 2, s).point;
      hinge.y = 0;
      const pivot = group(`rear_door_${s > 0 ? 'R' : 'L'}`, { parent: body, at: hinge.toArray() });
      const ww = v.rearWindows ? [RP('side', 0.15), RP('side', 0.85)] : null;
      if (ww) {
        panel(loft, pivot, hinge, { x: [-h, -h + rd], h: [rearH[0], ww[0]], side: s, nx: 6, ny: 8 }, paint, lining, 'rear_panel');
        panel(loft, pivot, hinge, { x: [-h, -h + rd], h: [ww[0], ww[1]], side: s, nx: 6, ny: 4 }, glass, glass, 'rear_glass');
        panel(loft, pivot, hinge, { x: [-h, -h + rd], h: [ww[1], rearH[1]], side: s, nx: 6, ny: 3 }, paint, lining, 'rear_top');
      } else panel(loft, pivot, hinge, { x: [-h, -h + rd], h: [rearH[0], rearH[1]], side: s, nx: 6, ny: 12 }, paint, lining, 'rear_panel');
      const hp = surfAt(loft, -h + 0.01, RP('lower', 0.8), s);
      const handle = mesh(roundedBox(0.03, 0.16, 0.025, 0.01), trim, { parent: pivot, name: 'rear_handle' });
      handle.position.copy(hp.point).addScaledVector(hp.normal, 0.012).sub(hinge);
      // inside: pull handle + vertical locking rod with guides, on the lining face
      const ip = surfAt(loft, -h + 0.02, RP('lower', 0.85), s);
      const inner = ip.point.clone().addScaledVector(ip.normal, -0.03).sub(hinge);
      mesh(roundedBox(0.035, 0.2, 0.03, 0.012), M.plastic('#1d1e20', 0.5), { parent: pivot, name: 'rear_inner_handle', at: inner.toArray() });
      const lo = surfAt(loft, -h + 0.02, rearH[0] + 0.05, s), hi = surfAt(loft, -h + 0.02, rearH[1] - 0.05, s);
      const a = lo.point.clone().addScaledVector(lo.normal, -0.03).sub(hinge), b = hi.point.clone().addScaledVector(hi.normal, -0.03).sub(hinge);
      a.z += -s * 0.0; b.z += -s * 0.0;
      curveTube([a.toArray(), [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], b.toArray()], 0.008, M.metal('#9aa0a6', 0.35), { parent: pivot, name: 'rear_lock_rod', segments: 8 });
      doors.push([pivot, s]);
    }
    // emblem + model badge ride on the right-hand door
    const right = doors[0][0];
    if (ctx.emblem) right.attach(ctx.emblem);
    const badge = body.getObjectByName(ctx.badgeName);
    if (badge) right.attach(badge);
    out.extra.push(clip('rearDoors', 4, doors.map(([pv, s]) => rotateTrack(pv, 'y', 4, (t) => s * openHold(t) * Math.PI * 0.55, 40))));
  }

  // ---- food truck: serving window, awning flap, kitchen, signage ----
  if (v.hatch) buildFoodTruck(ctx, out, lining);

  const roofY = (x) => fTop(x);
  const roofTopAt = (x) => surfAt(loft, x, loft.H, 1).point.y;

  // ---- beacons ----
  const beaconSet = (name, kind, spots) => {
    const grp = lampGroup(name, kind);
    for (const [x, z] of spots) {
      const y = roofTopAt(x);
      const base = mesh(roundedBox(0.16, 0.04, 0.16, 0.015), trim, { parent: body, name: `${name}_base`, at: [x, y + 0.012, z] });
      base.userData.mount = true;
      for (const n of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]) grp.add(body, { at: [x + n[0] * 0.055, y + 0.07, z + n[2] * 0.055], normal: n, w: 0.09, h: 0.06, depth: 0.01, bezel: false });
      mesh(roundedBox(0.12, 0.08, 0.12, 0.03), new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false, name: 'beacon_cover' }), { parent: body, name: `${name}_cover`, at: [x, y + 0.07, z] });
    }
    return grp;
  };
  if (v.ambulance) {
    const white = M.paint('#f6f6f4', { metallic: 0.2 });
    paint.color.set(white.color);
    const xf = v.boxFront ?? (v.windshield?.[0] ?? 0.5) - 0.1;
    const xr = -h + 0.12;
    beaconSet('beacon_red', 'red', [[xf, -W * 0.38], [xr, -W * 0.38], [xr, W * 0.38]]);
    beaconSet('beacon_blue', 'blue', [[xf, W * 0.38]]);
    const stripe = M.paint('#c8141e', { metallic: 0.2 });
    for (const s of [1, -1]) {
      mesh(surfaceGrid(loft, { x: [-h + rd + 0.1, h - 0.6], h: [RP('lower', 0.45), RP('lower', 0.62)], side: s, offset: 0.0025, nx: 30, ny: 2 }), stripe, { parent: body, name: 'amb_stripe' });
      mesh(surfaceGrid(loft, { x: [-h + rd + 0.25, (v.sliding?.[0] ?? 0) - 0.15], h: [RP('side', 0.35), RP('side', 0.75)], side: s, offset: 0.003, nx: 10, ny: 3 }), textMaterial('amb', 'AMBULANCE', { color: '#c8141e', font: 'bold 150px Arial, sans-serif' }), { parent: body, name: 'amb_text' });
    }
    const p = 0.5;
    const D = THREE.InterpolateDiscrete;
    const alt = (n, on, ph) => [
      new THREE.NumberKeyframeTrack(`${n}.material.emissiveIntensity`, [0, p / 4, p / 2, (3 * p) / 4, p], ph ? [0.2, 0.2, on, 0.2, 0.2] : [on, 0.2, 0.2, on, on], D),
      new THREE.NumberKeyframeTrack(`${n}_glow.material.opacity`, [0, p / 4, p / 2, (3 * p) / 4, p], ph ? [0, 0, 1, 0, 0] : [1, 0, 0, 1, 1], D),
    ];
    out.sirenTracks = [...alt('beacon_red', LAMP_ON.red, 0), ...alt('beacon_blue', LAMP_ON.blue, 1)];
  }
  if (v.workBeacon) {
    const x = (v.windshield?.[0] ?? 0.5) - 0.3;
    beaconSet('beacon_amber', 'amber', [[x, 0]]);
    out.extra.push(clip('beacons', 0.6, lampTracks('beacon_amber', LAMP_ON.amber, { blink: 1 / 0.6 })));
  }

  // ---- roof equipment ----
  const ws = v.windshield?.[0] ?? 0.6;
  if (v.ladder || v.roofRack) {
    const xs = [];
    for (let x = ws - 0.25; x > -h + 0.35; x -= 0.9) xs.push(x);
    if (xs.length < 2) xs.push(-h + 0.4);
    const top = roofBars(loft, body, xs, { mat: M.metal('#9aa0a6', 0.35) });
    if (v.ladder) {
      const len = Math.min(3.2, xs[0] - xs[xs.length - 1] + 0.8);
      const cx = (xs[0] + xs[xs.length - 1]) / 2;
      const lm = M.metal('#c9ccd0', 0.3);
      for (const z of [0.2, -0.2]) mesh(roundedBox(len, 0.05, 0.03, 0.01), lm, { parent: body, name: 'ladder_rail', at: [cx, top + 0.025, z] });
      for (let k = 0; k < Math.floor(len / 0.3); k++) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), lm, { parent: body, name: 'ladder_rung', at: [cx - len / 2 + 0.15 + k * 0.3, top + 0.025, 0], rot: [Math.PI / 2, 0, 0] });
    }
  }
  if (v.fridge) {
    const x = ws - 0.35;
    const y = roofTopAt(x);
    mesh(cushion(0.55, 0.32, W * 0.62, { radius: 0.08, bulge: 0.1 }), M.plastic('#e9eaeb', 0.5), { parent: body, name: 'fridge_unit', at: [x, y + 0.15, 0] });
    mesh(new THREE.CircleGeometry(0.11, 24), M.matte('#2a2b2d', 0.8), { parent: body, name: 'fridge_fan', at: [x + 0.276, y + 0.15, 0], rot: [0, Math.PI / 2, 0] });
  }
  if (v.solar) {
    const xa = ws - 0.4;
    const xb = -h + 0.6;
    const y = roofTopAt((xa + xb) / 2);
    const cells = drawMaterial('solar', 256, 128, (c) => {
      c.fillStyle = '#0f1d3a'; c.fillRect(0, 0, 256, 128);
      c.strokeStyle = '#6b7c99'; c.lineWidth = 2;
      for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, 128); c.stroke(); }
      for (let j = 0; j <= 4; j++) { c.beginPath(); c.moveTo(0, j * 32); c.lineTo(256, j * 32); c.stroke(); }
    }, { transparent: false, roughness: 0.2, metalness: 0.4 });
    mesh(roundedBox(xa - xb, 0.04, W * 0.6, 0.01), M.metal('#b4b8bc', 0.3), { parent: body, name: 'solar_frame', at: [(xa + xb) / 2, y + 0.02, 0] });
    const top = new THREE.PlaneGeometry(xa - xb - 0.04, W * 0.6 - 0.04);
    top.rotateX(-Math.PI / 2);
    mesh(top, cells, { parent: body, name: 'solar_cells', at: [(xa + xb) / 2, y + 0.041, 0] });
  }
  if (v.awning) {
    const xa = (v.sliding?.[1] ?? 0.6) + 0.1;
    const xb = -h + rd + 0.25;
    const p = surfAt(loft, (xa + xb) / 2, RP('roofCorner', 0.5), -1);
    mesh(roundedBox(xa - xb, 0.1, 0.12, 0.04), M.plastic('#d9d9d6', 0.5), { parent: body, name: 'awning_case', at: [(xa + xb) / 2, p.point.y, p.point.z - 0.05] });
  }
  if (v.sideSteps) {
    for (const s of [1, -1]) {
      const p = P((v.xf + v.xr) / 2, 'corner', 0.3, s);
      mesh(roundedBox(Math.abs(v.xf - v.xr) - 1.0, 0.04, 0.18, 0.015), M.metal('#8d9196', 0.4), { parent: body, name: 'side_step', at: [p.point.x, p.point.y - 0.02, p.point.z + s * 0.06] });
    }
  }
  if (v.hivis) {
    const hv = drawMaterial('hivis', 1024, 64, (c) => {
      for (let i = 0; i < 32; i++) { c.fillStyle = i % 2 ? '#ff6a00' : '#f6e01a'; c.beginPath(); c.moveTo(i * 32, 64); c.lineTo(i * 32 + 32, 0); c.lineTo(i * 32 + 64, 0); c.lineTo(i * 32 + 32, 64); c.fill(); }
    });
    for (const s of [1, -1]) mesh(surfaceGrid(loft, { x: [-h + rd + 0.1, h - 0.55], h: [RP('lower', 0.5), RP('lower', 0.68)], side: s, offset: 0.003, nx: 30, ny: 1 }), hv, { parent: body, name: 'hivis_band' });
  }
  if (v.livery === 'courier') {
    const band = drawMaterial('courier', 1024, 128, (c) => {
      const g = c.createLinearGradient(0, 0, 1024, 0);
      g.addColorStop(0, '#ff7a1a'); g.addColorStop(1, '#ffb21a');
      c.fillStyle = g; c.fillRect(0, 0, 1024, 128);
      c.fillStyle = '#ffffff'; c.font = 'bold italic 84px Arial, sans-serif'; c.textBaseline = 'middle';
      c.fillText('ORBIX EXPRESS', 40, 68);
    });
    // never paint across an opening: on the serving-hatch side the band only covers the panel behind the hatch
    for (const s of [1, -1]) {
      let x0 = -h + rd + 0.15, x1 = (v.sliding?.[0] ?? 0.3) - 0.1;
      if (v.hatch && s === 1) x1 = Math.min(x1, Math.min(...v.hatch) - 0.12);
      if (x1 - x0 < 0.8) continue;
      mesh(surfaceGrid(loft, { x: [x0, x1], h: [RP('side', 0.2), RP('side', 0.6)], side: s, offset: 0.003, nx: 12, ny: 3 }), band, { parent: body, name: 'courier_livery' });
    }
  }
  if (v.stepUp) {
    // step under the sliding / cab door
    const x = v.sliding ? (v.sliding[0] + v.sliding[1]) / 2 : v.doors?.[0] ? v.doors[0] - 0.4 : 0;
    const p = P(x, 'corner', 0.2, 1);
    mesh(roundedBox(0.5, 0.04, 0.16, 0.015), M.metal('#8d9196', 0.4), { parent: body, name: 'entry_step', at: [p.point.x, p.point.y - 0.01, p.point.z + 0.05] });
  }
  return out;
}

function buildFoodTruck(ctx, out, lining) {
  const { v, body, loft, h, W, paint, glass, trim, CHROME, hatchH, rd, P, RP } = ctx;
  const steel = M.metal('#c9cdd1', 0.28);
  steel.name = 'stainless';
  const darkSteel = M.metal('#5d6166', 0.4);
  const [xa, xb] = v.hatch;
  const xm = (xa + xb) / 2;
  const topP = surfAt(loft, xm, hatchH[1], 1).point;
  const sill = surfAt(loft, xm, hatchH[0], 1).point;
  const inZ = -(W / 2 - 0.14); // inside face of the far wall
  const floorY = sill.y - 0.62;

  // window frame (stainless trim around the opening)
  for (const [x0, x1, h0, h1] of [[xa, xb, hatchH[1] - 0.12, hatchH[1]], [xa, xb, hatchH[0], hatchH[0] + 0.12], [xa, xa + 0.03, hatchH[0], hatchH[1]], [xb - 0.03, xb, hatchH[0], hatchH[1]]]) {
    mesh(surfaceGrid(loft, { x: [x0, x1], h: [h0, h1], side: 1, offset: 0.004, nx: Math.max(1, Math.round((x1 - x0) * 8)), ny: 2 }), steel, { parent: body, name: 'window_frame' });
  }

  // top-hinged awning flap (rest pose: open, serving)
  const hinge = new THREE.Vector3(0, topP.y, topP.z);
  const pivot = group('serving_hatch', { parent: body, at: hinge.toArray() });
  const flap = new THREE.Group();
  flap.name = 'awning_flap';
  pivot.add(flap);
  for (const [mat, off, nm] of [[paint, 0.0, 'awning_skin'], [M.matte('#f3efe6', 0.7), -0.014, 'awning_inner']]) {
    const geo = surfaceGrid(loft, { x: [xa, xb], h: [hatchH[0], hatchH[1]], side: 1, offset: off, nx: 14, ny: 6 });
    geo.translate(-hinge.x, -hinge.y, -hinge.z);
    mesh(geo, mat, { parent: flap, name: nm });
  }
  const OPEN = -Math.PI * 0.44;
  pivot.rotation.x = OPEN;
  // red/white stripes on the underside of the flap
  const stripes = drawMaterial('awningstripes', 512, 64, (c) => {
    for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#f4f1ea' : '#c8141e'; c.fillRect(i * 32, 0, 32, 64); }
  });
  const dy = topP.y - sill.y;
  const under = new THREE.PlaneGeometry(xb - xa - 0.06, dy * 0.92);
  under.rotateY(Math.PI); // faces the body (−Z) when closed → faces down when open
  mesh(under, stripes, { parent: pivot, name: 'awning_stripes', at: [xm, -dy / 2, -0.03] });
  // warm LED strip along the flap's edge (lit with the 'lights' animation)
  const leds = lampGroup('awning_leds', 'white');
  leds.lens.emissive.set('#ffd9a0');
  leds.add(pivot, { at: [xm, -dy + 0.06, -0.032], normal: [0, 0, -1], w: xb - xa - 0.2, h: 0.025, shape: 'strip', depth: 0.006, bezel: false, glowSize: 1.4 });
  out.lightTracks.push(...lampTracks('awning_leds', 3, { glow: 0.7 }));
  // gas struts: flap edge → body side below the window (fixed to the flap)
  body.updateMatrixWorld(true);
  for (const x of [xa + 0.12, xb - 0.12]) {
    const a = new THREE.Vector3(x, -dy * 0.62, -0.03);
    const anchorWorld = body.localToWorld(new THREE.Vector3(x, sill.y - 0.18, sill.z + 0.005));
    const b = pivot.worldToLocal(anchorWorld.clone());
    curveTube([a.toArray(), b.toArray()], 0.012, CHROME, { parent: pivot, name: 'gas_strut', segments: 4 });
    mesh(roundedBox(0.05, 0.05, 0.03, 0.01), darkSteel, { parent: body, name: 'strut_mount', at: [x, sill.y - 0.18, sill.z + 0.012] });
  }
  out.extra.push(clip('hatch', 1.4, [rotateTrack(pivot, 'x', 1.4, (t) => OPEN * ease(t), 24)]));
  out.oneShot = ['hatch'];

  // stainless counter shelf under the window, on two brackets
  const cd = 0.32;
  mesh(roundedBox(xb - xa - 0.1, 0.035, cd, 0.012), steel, { parent: body, name: 'serving_counter', at: [xm, sill.y + 0.012, sill.z + cd / 2 - 0.02] });
  for (const x of [xa + 0.3, xb - 0.3]) {
    curveTube([[x, sill.y - 0.25, sill.z + 0.005], [x, sill.y - 0.03, sill.z + cd * 0.85]], 0.014, steel, { parent: body, name: 'counter_bracket', segments: 4 });
  }

  // kitchen inside (visible through the window)
  const tile = drawMaterial('tiles', 256, 256, (c) => {
    c.fillStyle = '#e9e6df'; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = '#c9c4ba'; c.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, 256); c.stroke(); c.beginPath(); c.moveTo(0, i * 32); c.lineTo(256, i * 32); c.stroke(); }
  }, { transparent: false, roughness: 0.4 });
  if (!tile.map) tile.color.set('#e4e0d8');
  const wallH = topP.y + 0.25 - floorY;
  mesh(roundedBox(xb - xa + 0.3, wallH, 0.03, 0.01), tile, { parent: body, name: 'kitchen_wall', at: [xm, floorY + wallH / 2, inZ] });
  mesh(roundedBox(xb - xa + 0.3, 0.03, W - 0.3, 0.01), M.matte('#3a3532', 0.8), { parent: body, name: 'kitchen_floor', at: [xm, floorY, 0] });
  const ctY = sill.y - 0.2; // worktop height
  const unitD = 0.62;
  const uz = inZ + 0.015 + unitD / 2;
  mesh(roundedBox(xb - xa, ctY - floorY, unitD, 0.02), steel, { parent: body, name: 'base_units', at: [xm, (ctY + floorY) / 2, uz] });
  for (let x = xa + 0.35; x < xb - 0.2; x += 0.6) mesh(roundedBox(0.012, 0.02, 0.2, 0.006), darkSteel, { parent: body, name: 'unit_handle', at: [x, ctY - 0.12, uz + unitD / 2 + 0.006] });
  // grill
  const gx = xa + 0.55;
  mesh(roundedBox(0.7, 0.06, 0.5, 0.01), M.metal('#1c1c1e', 0.5), { parent: body, name: 'grill_plate', at: [gx, ctY + 0.03, uz] });
  for (let k = 0; k < 7; k++) mesh(new THREE.BoxGeometry(0.66, 0.008, 0.012), M.metal('#3a3a3c', 0.4), { parent: body, name: 'grill_bar', at: [gx, ctY + 0.064, uz - 0.21 + k * 0.07] });
  // fryer with two baskets
  const fx = gx + 0.65;
  mesh(roundedBox(0.5, 0.22, 0.5, 0.02), steel, { parent: body, name: 'fryer', at: [fx, ctY + 0.11, uz] });
  for (const dz of [-0.11, 0.11]) {
    mesh(roundedBox(0.18, 0.02, 0.18, 0.005), M.metal('#d4b26a', 0.5), { parent: body, name: 'fryer_oil', at: [fx + dz, ctY + 0.215, uz] });
    curveTube([[fx + dz, ctY + 0.22, uz + 0.05], [fx + dz, ctY + 0.3, uz + 0.2], [fx + dz, ctY + 0.33, uz + 0.32]], 0.01, darkSteel, { parent: body, name: 'basket_handle', segments: 6 });
  }
  // extraction hood above the cookers, fixed to the wall
  const hoodGeo = new THREE.CylinderGeometry(0.42, 0.62, 0.35, 4, 1, true);
  hoodGeo.rotateY(Math.PI / 4);
  hoodGeo.scale(2.0, 1, 0.9);
  const hoodMat = steel.clone();
  hoodMat.side = THREE.DoubleSide;
  mesh(hoodGeo, hoodMat, { parent: body, name: 'extraction_hood', at: [(gx + fx) / 2, topP.y - 0.05, inZ + 0.46] });
  mesh(roundedBox(1.1, 0.04, 0.05, 0.01), steel, { parent: body, name: 'hood_bracket', at: [(gx + fx) / 2, topP.y + 0.12, inZ + 0.04] });
  // shelves with tubs + menu board on the back wall
  const shx = xb - 0.65;
  for (const y of [topP.y - 0.35, topP.y - 0.05]) {
    mesh(roundedBox(0.9, 0.025, 0.25, 0.008), steel, { parent: body, name: 'shelf', at: [shx, y, inZ + 0.14] });
    for (let k = 0; k < 4; k++) mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 14), M.plastic(['#d33', '#f2c200', '#2a8', '#eee'][k], 0.4), { parent: body, name: 'tub', at: [shx - 0.33 + k * 0.22, y + 0.072, inZ + 0.14] });
  }
  const menu = textMaterial('menu', 'BURGERS · FRIES · SHAKES', { color: '#fff', bg: '#2a1a12', font: 'bold 64px Arial, sans-serif', w: 1024, h: 128 });
  menu.transparent = false;
  menu.depthWrite = true;
  menu.polygonOffset = false;
  menu.visible = true;
  mesh(roundedBox(1.34, 0.26, 0.02, 0.006), M.matte('#2a1a12', 0.8), { parent: body, name: 'menu_frame', at: [xm - 0.2, topP.y + 0.08, inZ + 0.025] });
  mesh(new THREE.PlaneGeometry(1.3, 0.22), menu, { parent: body, name: 'menu_board', at: [xm - 0.2, topP.y + 0.08, inZ + 0.036] });
  // ceiling light
  const cl = lampGroup('kitchen_light', 'white');
  cl.add(body, { at: [xm, topP.y + 0.25, 0], normal: [0, -1, 0], w: 1.6, h: 0.05, shape: 'strip', depth: 0.01, bezel: true });
  out.lightTracks.push(...lampTracks('kitchen_light', 2.5, { glow: 0.3 }));

  // roof extraction vent above the hood
  const ry = surfAt(loft, (gx + fx) / 2, loft.H, 1).point.y;
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 20), steel, { parent: body, name: 'roof_vent', at: [(gx + fx) / 2, ry + 0.14, -0.3] });
  mesh(new THREE.ConeGeometry(0.2, 0.12, 20), steel, { parent: body, name: 'vent_cap', at: [(gx + fx) / 2, ry + 0.35, -0.3] });
  mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20), darkSteel, { parent: body, name: 'vent_gap', at: [(gx + fx) / 2, ry + 0.29, -0.3] });

  // "STREET FOOD" sign board standing on the curb-side roof edge
  const signLen = xb - xa;
  const signMat = textMaterial('streetfood', 'STREET FOOD', { color: '#fff7e0', bg: '#c8141e', font: 'bold 150px Impact, "Arial Black", sans-serif', w: 1024, h: 192 });
  signMat.transparent = false;
  signMat.depthWrite = true;
  signMat.polygonOffset = false;
  signMat.visible = true;
  if (!signMat.map) signMat.color.set('#c8141e');
  const edge = surfAt(loft, xm, RP('roofCorner', 0.9), 1).point;
  const sg = group('roof_sign', { parent: body, at: [xm, edge.y, edge.z - 0.08] });
  mesh(roundedBox(signLen, 0.42, 0.05, 0.02), M.paint('#c8141e', { metallic: 0.2 }), { parent: sg, name: 'sign_board', at: [0, 0.25, 0] });
  mesh(new THREE.PlaneGeometry(signLen - 0.04, 0.38), signMat, { parent: sg, name: 'sign_face', at: [0, 0.25, 0.026] });
  for (const x of [-signLen / 2 + 0.3, signLen / 2 - 0.3]) mesh(roundedBox(0.05, 0.1, 0.12, 0.01), darkSteel, { parent: sg, name: 'sign_post', at: [x, 0.02, 0] });
  // same livery big on the street side
  const big = textMaterial('streetfood2', 'STREET FOOD', { color: '#c8141e', font: 'bold 170px Impact, "Arial Black", sans-serif' });
  mesh(surfaceGrid(loft, { x: [xa, xb], h: [RP('lower', 0.75), RP('side', 0.85)], side: -1, offset: 0.003, nx: 12, ny: 4 }), big, { parent: body, name: 'livery_text' });
  const check = drawMaterial('checker2', 1024, 64, (c) => {
    for (let i = 0; i < 64; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#111' : '#f4f1ea'; c.fillRect(i * 16, j * 32, 16, 32); }
  });
  for (const s of [1, -1]) mesh(surfaceGrid(loft, { x: [-h + rd + 0.1, h - 0.6], h: [RP('lower', 0.3), RP('lower', 0.42)], side: s, offset: 0.003, nx: 30, ny: 1 }), check, { parent: body, name: 'checker_band' });
  // side menu board next to the window
  const mb = textMaterial('sidemenu', 'MENU', { color: '#f4f1ea', bg: '#1d1d1d', font: 'bold 120px Arial, sans-serif', w: 512, h: 640 });
  mb.transparent = false;
  mb.visible = true;
  mb.polygonOffset = false;
  if (!mb.map) mb.color.set('#1d1d1d');
  mesh(surfaceGrid(loft, { x: [xb + 0.08, xb + 0.5], h: [RP('lower', 0.55), RP('side', 0.6)], side: 1, offset: 0.004, nx: 3, ny: 6 }), mb, { parent: body, name: 'side_menu' });
  // gas bottle cage on the rear street-side corner
  const gz = -(W / 2) + 0.02;
  const cx = -h + rd + 0.4;
  const gy = surfAt(loft, cx, RP('corner', 0.9), -1).point.y;
  const cage = group('gas_cage', { parent: body, at: [cx, gy, gz] });
  mesh(roundedBox(0.5, 0.03, 0.3, 0.008), darkSteel, { parent: cage, name: 'cage_floor', at: [0, 0, -0.15] });
  for (const [dx, dz] of [[-0.24, -0.02], [0.24, -0.02], [-0.24, -0.29], [0.24, -0.29]]) mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.62, 6), darkSteel, { parent: cage, name: 'cage_bar', at: [dx, 0.31, dz] });
  mesh(roundedBox(0.5, 0.02, 0.3, 0.006), darkSteel, { parent: cage, name: 'cage_top', at: [0, 0.62, -0.15] });
  for (const dx of [-0.11, 0.11]) {
    mesh(lathe([[0, 0], [0.09, 0.01], [0.1, 0.05], [0.1, 0.42], [0.06, 0.5], [0.03, 0.52], [0.03, 0.58], [0, 0.58]], 20), M.paint('#d8d8d6', { metallic: 0.3 }), { parent: cage, name: 'gas_bottle', at: [dx, 0.015, -0.15] });
  }
}
