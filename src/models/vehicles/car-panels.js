// Opening panels for cars & vans: doors (with drop-down windows), bonnet, boot lid, tailgate.
// The body already has holes for them; here we build each panel's skin under a hinge pivot and
// move every surface decal / attached part that lies on a panel onto it, so liveries, handles,
// spoilers and badges open with the panel.
import * as THREE from 'three';
import { mesh, group } from '../../core/utils.js';
import { moveTrack, rotateTrack, clip } from '../../core/animation.js';
import { surfAt, surfaceGrid } from './car-parts.js';

const ease = (t) => t * t * (3 - 2 * t);
const openHold = (t, a = 0.05, b = 0.3, c = 0.7, d = 0.95) => (t < a ? 0 : t < b ? ease((t - a) / (b - a)) : t < c ? 1 : t < d ? 1 - ease((t - c) / (d - c)) : 0);

export function buildPanels({ v, body, loft, panels, paint }) {
  if (!panels.length) return [];
  const H = loft.H;
  const lining = new THREE.MeshStandardMaterial({ color: '#2a2b2d', roughness: 0.85, side: THREE.DoubleSide, name: 'door-lining' });
  const sideName = (s) => (s > 0 ? 'R' : 'L');

  // ---- pivots ----
  for (const p of panels) {
    let at;
    if (p.kind === 'door') {
      at = surfAt(loft, p.x[1], (p.h[0] + p.h[1]) / 2, p.s).point;
      at.y = 0;
      p.name = `door_${sideName(p.s)}${p.k}`;
    } else if (p.kind === 'bonnet') {
      at = surfAt(loft, p.x[0], H, 1).point;
      p.name = 'bonnet';
    } else {
      at = surfAt(loft, p.x[1], H, 1).point;
      p.name = p.kind === 'boot' ? 'boot_lid' : 'tailgate';
    }
    at.z = p.kind === 'door' ? at.z : 0;
    p.at = at;
    p.pivot = group(p.name, { parent: body, at: at.toArray() });
    if (p.kind === 'door') p.win = group(`${p.name}_window`, { parent: p.pivot });
  }
  const put = (p, geo, mat, name, toWin = false) => {
    geo.translate(-p.at.x, -p.at.y, -p.at.z);
    return mesh(geo, mat, { parent: toWin ? p.win : p.pivot, name });
  };

  // ---- skins (outer paint + inner lining) ----
  for (const p of panels) {
    const sides = p.kind === 'door' ? [p.s] : [1, -1];
    const bands = p.kind === 'gate' ? [[p.h[0], loft.idx('side', 0.15)], [loft.idx('roofCorner', 1), H]] : [p.skinH];
    for (const s of sides) {
      for (const [ha, hb] of bands) {
        const nx = Math.max(3, Math.round((p.x[1] - p.x[0]) * 12));
        const ny = Math.max(2, Math.round(hb - ha));
        put(p, surfaceGrid(loft, { x: p.x, h: [ha, hb], side: s, offset: 0, nx, ny }), paint, `${p.name}_skin`);
        put(p, surfaceGrid(loft, { x: p.x, h: [ha, hb], side: s, offset: -0.014, nx, ny }), lining, `${p.name}_lining`);
      }
    }
  }

  // ---- move decals (tagged surface grids) onto panels ----
  const inPanel = (p, s, x, hh) => (p.s === 0 || p.s === s) && x > p.x[0] && x < p.x[1] && hh >= p.h[0] - 1e-6 && hh <= p.h[1] + 1e-6;
  for (const child of [...body.children]) {
    const spec = child.isMesh && child.geometry.userData.spec;
    if (!spec || /^(lamp_|glow_)/.test(child.material?.name ?? '')) continue;
    const mine = panels.filter((p) => (p.s === 0 || p.s === spec.side) && p.x[0] < spec.x[1] && p.x[1] > spec.x[0] && p.h[0] < spec.h[1] && p.h[1] > spec.h[0]);
    if (!mine.length) continue;
    const xs = [spec.x[0], spec.x[1]];
    const hs = [spec.h[0], spec.h[1]];
    for (const p of mine) {
      for (const e of p.x) if (e > spec.x[0] && e < spec.x[1]) xs.push(e);
      for (const e of p.h) if (e > spec.h[0] && e < spec.h[1]) hs.push(e);
    }
    xs.sort((a, b) => a - b);
    hs.sort((a, b) => a - b);
    body.remove(child);
    for (let i = 0; i < xs.length - 1; i++) {
      for (let j = 0; j < hs.length - 1; j++) {
        const [xa, xb] = [xs[i], xs[i + 1]];
        const [ha, hb] = [hs[j], hs[j + 1]];
        if (xb - xa < 1e-4 || hb - ha < 1e-4) continue;
        const nx = Math.max(1, Math.round((spec.nx * (xb - xa)) / (spec.x[1] - spec.x[0])));
        const ny = Math.max(1, Math.round((spec.ny * (hb - ha)) / (spec.h[1] - spec.h[0])));
        const geo = surfaceGrid(loft, { ...spec, x: [xa, xb], h: [ha, hb], nx, ny });
        const p = mine.find((q) => inPanel(q, spec.side, (xa + xb) / 2, (ha + hb) / 2));
        if (p) put(p, geo, child.material, child.name, p.kind === 'door' && child.name === 'glass');
        else mesh(geo, child.material, { parent: body, name: child.name });
      }
    }
  }

  // ---- move attached parts (handles, spoilers, scoops, high brake lamp) ----
  const rear = panels.find((p) => p.kind === 'boot' || p.kind === 'gate');
  const bonnet = panels.find((p) => p.kind === 'bonnet');
  for (const child of [...body.children]) {
    const r = child.userData.ride;
    if (!r) continue;
    let p = null;
    if (r.s) p = panels.find((q) => q.kind === 'door' && q.s === r.s && r.x > q.x[0] && r.x < q.x[1]);
    else if (r.panel === 'rear') p = rear;
    else if (r.panel === 'bonnet') p = bonnet;
    if (!p) continue;
    p.pivot.attach(child);
    if (r.chmsl) {
      for (const c of [...body.children]) if (/^brakelights_lamp/.test(c.name) && c.position.x < p.x[1] + 0.05 && c.position.y > child.position.y + p.at.y - 0.2) p.pivot.attach(c);
    }
  }

  // ---- animations ----
  const anims = [];
  const doors = panels.filter((p) => p.kind === 'door');
  if (doors.length) {
    anims.push(clip('doors', 4, doors.map((p) => rotateTrack(p.pivot, 'y', 4, (t) => p.s * openHold(t, 0.05 + p.k * 0.05, 0.3 + p.k * 0.05) * 1.1, 40))));
    anims.push(clip('windows', 4, doors.map((p) => moveTrack(p.win, 4, (t) => [0, -openHold(t) * 0.34, 0], 40))));
  }
  if (bonnet) anims.push(clip('bonnet', 4, [rotateTrack(bonnet.pivot, 'z', 4, (t) => openHold(t) * 0.85, 40)]));
  if (rear) anims.push(clip(rear.kind === 'boot' ? 'boot' : 'tailgate', 4, [rotateTrack(rear.pivot, 'z', 4, (t) => -openHold(t) * (rear.kind === 'boot' ? 0.95 : 1.2), 40)]));
  return anims;
}
