import * as THREE from 'three';
import { waveNoise, bakeLoft, Rig, applySkin, chain, skinnedMesh, poseTrack, offsetTrack, loft, surfacePoint, spline, tNear, keyed, paint, furMaterial, noise3, fbm, smooth01, clamp, lerp, bump, TAU, C } from './core.js';
import { makeCoat } from './coat.js';
import { rng } from '../../core/utils.js';
import { clip } from '../../core/animation.js';
import { buildEar, buildEye, buildHorns, buildAntlers, hoofMaterial, hornMaterial } from './parts.js';
import { addAccessories } from './accessories.js';

/*
 * Quadruped generator. One continuous skinned loft for body + neck (anatomical
 * cross-sections keyed along a spine curve), lofted jointed legs whose bends
 * follow the real foot posture (digitigrade dogs/cats, unguligrade horses/cattle/
 * deer with backward-bending hocks, plantigrade bears), a sculpted rigid head with
 * cranium → stop → muzzle, real ears/eyes/nose, hooves or toed paws, lofted
 * tails/manes, and a coat painted from one function so every part matches.
 * Facing +Z, origin on the ground under the body, metres.
 */

const deg = Math.PI / 180;

export function buildQuadruped(name, S, opts = {}) {
  const seed = opts.seed ?? name;
  const rand = rng(seed);
  const nz = noise3(rng(`${seed}-n`));
  const wnA = waveNoise(rng(`${seed}-wa`));
  const wnB = waveNoise(rng(`${seed}-wb`));
  const fuzz = (p, f = 1) => 0.6 * wnA(p.x * 45 * f / H, p.y * 45 * f / H, p.z * 45 * f / H) + 0.4 * wnB(p.x * 110 * f / H, p.y * 110 * f / H, p.z * 110 * f / H);
  const H = S.H;
  const BL = S.BL;
  const D = S.chest * H;
  const Wb = (D / 2) * S.bw;
  const zb = BL / 2;
  const croupY = H * (S.croup ?? 1);
  const root = new THREE.Group();
  root.name = `animal-${name}`;
  const rig = new Rig();

  /* ---------------- spine ---------------- */
  const neckAng = (S.neck.ang ?? 45) * deg;
  const NL = S.neck.len * H;
  const nd = new THREE.Vector3(0, Math.sin(neckAng), Math.cos(neckAng));
  const P0 = new THREE.Vector3(0, croupY - D * 0.4, -zb - D * 0.02);
  const P1 = new THREE.Vector3(0, croupY - D * 0.5, -zb * 0.68);
  const P2 = new THREE.Vector3(0, lerp(croupY, H, 0.5) - D * 0.5 - (S.sway ?? 0) * D, -zb * 0.1);
  const P3 = new THREE.Vector3(0, H - D * 0.52, zb * 0.5);
  const P4 = new THREE.Vector3(0, H - D * (S.neck.root ?? 0.36), zb * 0.92);
  const N1 = P4.clone().addScaledVector(nd, NL * 0.5);
  const N2 = P4.clone().addScaledVector(nd, NL);
  const bodyCurve = spline([P0, P1, P2, P3, P4, N1, N2]);
  const tb = (p) => tNear(bodyCurve, p);
  const T = { p0: 0, p1: tb(P1), p2: tb(P2), p3: tb(P3), p4: tb(P4), n1: tb(N1), n2: 1 };
  const r0 = S.neck.r0 * H;
  const r1 = S.neck.r1 * H;
  const nw = S.neck.w ?? 0.7;
  const tuck = S.tuck ?? 0.15;
  const hump = S.hump ?? 0;
  const baseSec = keyed([
    [0, { w: Wb * 0.42, up: D * 0.25, dn: D * 0.25, e: 2.1, wb: 1, yo: 0 }],
    [T.p1 * 0.45, { w: Wb * 0.85, up: D * 0.4, dn: D * 0.5 * (S.haunch ?? 1), e: 2.3, wb: 1.0, yo: 0 }],
    [T.p1, { w: Wb * (S.hips ?? 1.0), up: D * 0.46, dn: D * 0.56 * (S.haunch ?? 1), e: 2.4, wb: 1.0, yo: 0 }],
    [T.p2, { w: Wb * (S.waist ?? 0.9), up: D * 0.44, dn: D * 0.5 * (1 - tuck), e: 2.2, wb: 0.88, yo: 0 }],
    [lerp(T.p2, T.p3, 0.6), { w: Wb, up: D * (0.48 + hump * 0.5), dn: D * 0.52, e: 2.2, wb: 0.8, yo: 0 }],
    [T.p3, { w: Wb * 0.98, up: D * (0.5 + hump * 0.3), dn: D * 0.52, e: 2.15, wb: 0.72, yo: 0 }],
    [T.p4, { w: Wb * 0.74, up: D * 0.36, dn: D * 0.46, e: 2.1, wb: 0.7, yo: 0 }],
    [lerp(T.p4, T.n1, 0.5), { w: r0 * nw * 1.1, up: r0 * 1.0, dn: r0 * 1.05, e: 2, wb: 0.85, yo: 0 }],
    [T.n1, { w: lerp(r0, r1, 0.5) * nw, up: lerp(r0, r1, 0.5), dn: lerp(r0, r1, 0.5) * 0.95, e: 2, wb: 0.9, yo: 0 }],
    [0.985, { w: r1 * nw, up: r1, dn: r1 * 1.05, e: 2, wb: 1, yo: 0 }],
    [1, { w: r1 * nw * 0.8, up: r1 * 0.8, dn: r1 * 0.8, e: 2, wb: 1, yo: 0 }],
  ]);
  const humps = S.humps ?? [];
  const bodySec = humps.length
    ? (t) => {
        const sc = baseSec(t);
        for (const h of humps) sc.up += D * h.h * bump(t, lerp(T.p1, T.p4, h.at), h.w ?? 0.07);
        return sc;
      }
    : baseSec;
  const furLen = (S.fur ?? 0) * H;
  const wool = (S.wool ?? 0) * H;
  const bodyDisp = (t, a, p, n) => {
    let d = 0;
    if (furLen) d += furLen * (fuzz(p) - 0.4);
    if (wool) {
      const onBody = smooth01((T.n1 - t) / 0.06) * smooth01((t - 0.02) / 0.05);
      d += wool * onBody * (0.7 + 0.6 * fuzz(p, 1.4));
    }
    if (S.creases) {
      d += S.creases * D * 0.012 * (fuzz(p, 0.6) - 0.5);
      d -= S.creases * D * 0.03 * (bump(t, T.p4 - 0.02, 0.012) + bump(t, T.p1 * 0.7, 0.012)) * smooth01((Math.abs(Math.sin(a)) - 0.3) / 0.4);
    }
    if (S.spines) {
      const k = 90 / H;
      const sp = Math.abs(Math.sin(p.x * k) * Math.sin(p.y * k * 1.1 + 1) * Math.sin(p.z * k * 0.9 + 2)) ** 3;
      d += S.spines.len * H * sp * smooth01((Math.cos(a) + 0.35) / 0.4) * smooth01((T.n1 + 0.05 - t) / 0.06) + S.spines.len * H * 0.3 * smooth01((Math.cos(a) + 0.35) / 0.4) * smooth01((T.n1 + 0.05 - t) / 0.06);
    }
    // muscle definition: shoulder & haunch bulges
    if (S.muscle) {
      const side = Math.abs(Math.sin(a));
      d += S.muscle * D * 0.07 * side * (bump(t, T.p1 * 0.95, 0.07) * smooth01((Math.cos(a) + 0.6) / 0.6) + 0.8 * bump(t, lerp(T.p3, T.p4, 0.35), 0.06) * smooth01((Math.cos(a) + 0.5) / 0.6));
    }
    return d;
  };
  const bodyGeo = loft(bodyCurve, bodySec, { n: 140, ring: 36, displace: bodyDisp, seam: true });

  /* ---------------- bones ---------------- */
  rig.add('body', P2.toArray());
  rig.add('pelvis', P1.toArray(), 'body');
  rig.add('chest', P3.toArray(), 'body');
  rig.add('neck1', P4.toArray(), 'chest');
  rig.add('neck2', N1.toArray(), 'neck1');
  rig.add('head', N2.toArray(), 'neck2');
  const B = (n) => rig.index(n);

  /* ---------------- legs ---------------- */
  const legX = Wb * (S.legSpread ?? 0.62);
  const legs = legLayout(S, { H, D, zb, croupY, legX });
  const legGeos = [];
  const hoofGroups = [];
  legs.forEach((leg, li) => {
    const pts = leg.joints.map((j) => new THREE.Vector3(leg.x, j[1], j[2]));
    const top = new THREE.Vector3(leg.x * 0.45, pts[0].y + D * 0.14, pts[0].z);
    const curve = spline([top, ...pts.slice(0, leg.loftEnd)]);
    const tj = pts.slice(0, leg.loftEnd).map((p) => tNear(curve, p));
    // radii keys: [jointIndex (−1 = top inside the body, fractional = between joints), [lateral, front, back] × r·H]
    const tAt = (j) => {
      if (j < 0) return 0;
      const a = Math.floor(j);
      const b = Math.min(tj.length - 1, Math.ceil(j));
      return lerp(tj[a], tj[b], j - a);
    };
    const R = leg.r * H;
    const prof = keyed(leg.radii.map(([j, r]) => [tAt(j), { w: r[0] * R, up: r[1] * R, dn: r[2] * R }]));
    const g = loft(curve, (t) => ({ ...prof(t), e: 2 }), { n: 44, ring: 16, displace: furLen || S.feather ? (t, a, p) => furLen * 0.6 * (fuzz(p) - 0.45) * smooth01((p.y - H * 0.3) / (H * 0.2)) + (S.feather ?? 0) * H * (0.5 + fuzz(p, 1.3)) * smooth01((H * 0.24 - p.y) / (H * 0.08)) * smooth01((p.y - H * 0.03) / (H * 0.02)) : null });
    const names = [0, 1, 2, 3].map((k) => `leg${leg.id}${k}`);
    names.forEach((n, k) => rig.add(n, pts[k].toArray(), k === 0 ? (leg.front ? 'chest' : 'pelvis') : names[k - 1]));
    const lt = g.attributes.lt.array;
    const P = g.attributes.position;
    const tBody = leg.front ? 'chest' : 'pelvis';
    applySkin(g, (i) => {
      const t = lt[i];
      const ws = chain(t, [B(tBody), B(names[0]), B(names[1]), B(names[2]), B(names[3])], [0, tj[0] * 0.75, tj[1], tj[2], tj[3]], 0.035);
      return ws;
    });
    g.userData.region = 'leg';
    g.userData.leg = li;
    legGeos.push(g);
    leg.names = names;
    leg.tj = tj;
    leg.curve = curve;
    void P;
  });

  /* ---------------- tail ---------------- */
  let tailGeo = null;
  const tail = S.tail ?? { type: 'none' };
  if (tail.type !== 'none') {
    const tr = surfacePoint(bodyCurve, bodySec, 0.03, 0).p.clone().add(new THREE.Vector3(0, -D * (tail.drop ?? 0.12), D * 0.05));
    const tl = (tail.len ?? 0.4) * BL;
    const pts = tailPath(tail, tr, tl, H);
    const curve = spline(pts);
    const rad = tailRadius(tail, H);
    const hair = tail.type === 'horse' || tail.type === 'bushy' || tail.type === 'plume' || tail.hair;
    tailGeo = loft(curve, (t) => (tail.flat ? { w: rad(t) * 2.4, up: rad(t) * 0.35, dn: rad(t) * 0.35, e: 2.5 } : { w: rad(t), up: rad(t), dn: rad(t), e: 2 }), {
      n: 40,
      ring: hair ? 18 : 12,
      lateral: tail.flat ? 'x' : 'free',
      displace: hair ? (t, a, p) => rad(t) * 0.35 * (fbm(nz, p.x * 80 / H, p.y * 80 / H + t * 4, p.z * 80 / H, 3) - 0.5) : null,
    });
    const tnames = ['tail1', 'tail2', 'tail3', 'tail4'];
    tnames.forEach((n, k) => rig.add(n, curve.getPointAt(k / 4).toArray(), k === 0 ? 'pelvis' : tnames[k - 1]));
    const lt = tailGeo.attributes.lt.array;
    applySkin(tailGeo, (i) => chain(lt[i], [B('pelvis'), B('tail1'), B('tail2'), B('tail3'), B('tail4')], [0, 0.04, 0.25, 0.5, 0.75], 0.08));
  }

  /* ---------------- body weights ---------------- */
  {
    const lt = bodyGeo.attributes.lt.array;
    const starts = [0, T.p1 + (T.p2 - T.p1) * 0.6, lerp(T.p2, T.p3, 0.55), lerp(T.p4, T.n1, 0.25), lerp(T.n1, 1, 0.1), 0.985];
    applySkin(bodyGeo, (i) => chain(lt[i], [B('pelvis'), B('body'), B('chest'), B('neck1'), B('neck2'), B('head')], starts, 0.05));
  }

  /* ---------------- mane / dewlap sheets, lion mane ---------------- */
  const neckChain = (t) => chain(t, [B('chest'), B('neck1'), B('neck2'), B('head')], [0, lerp(T.p4, T.n1, 0.25), lerp(T.n1, 1, 0.1), 0.985], 0.05);
  const sheetGeos = [];
  const sheet = (angle, ta, tb, hFn, wid, jag, color) => {
    const pts = [];
    for (let k = 0; k <= 12; k++) pts.push(surfacePoint(bodyCurve, bodySec, lerp(ta, tb, k / 12), angle).p);
    const g = loft(spline(pts), (t) => ({ w: H * 0.012 * wid, up: angle === 0 ? hFn(t) : H * 0.01, dn: angle === 0 ? H * 0.01 : hFn(t), e: 2 }), {
      n: 40,
      ring: 14,
      displace: (t, a, p) => ((angle === 0 ? Math.cos(a) > 0 : Math.cos(a) < 0) ? hFn(t) * jag * (fbm(nz, t * 18, a, p.x * 50, 3) - 0.5) : 0),
    });
    const lt = g.attributes.lt.array;
    applySkin(g, (i) => neckChain(lerp(ta, tb, lt[i])));
    g.userData.color = color;
    sheetGeos.push(g);
    return g;
  };
  let maneGeo = null;
  if (S.mane && S.mane.type !== 'lion') {
    const mh = S.mane.h * H;
    const type = S.mane.type ?? 'flowing';
    const ta = lerp(T.p4, T.n1, S.mane.start ?? 0.1);
    const hFn =
      type === 'upright' ? (t) => mh * (0.6 + 0.4 * smooth01(t / 0.1)) * (1 - 0.2 * t)
      : type === 'braided' ? (t) => mh * 0.45 * (0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 9))) * smooth01(t / 0.05)
      : (t) => mh * (0.5 + 0.5 * smooth01(t / 0.15)) * (1 - 0.3 * t);
    maneGeo = sheet(0, ta, 0.995, hFn, type === 'upright' ? 1.6 : S.mane.w ?? 1, type === 'flowing' ? 0.35 : type === 'braided' ? 0.05 : 0.15, S.mane.color);
  }
  if (S.dewlap) sheet(Math.PI, lerp(T.p4, T.n1, 0.2), 0.95, (t) => S.dewlap * H * Math.sin(Math.PI * Math.min(1, t * 1.05)), 1.2, 0.1, null);
  let lionGeo = null;
  if (S.mane?.type === 'lion') {
    const ta = Math.max(T.p3, T.p4 - 0.06);
    const k = S.mane.size ?? 1;
    lionGeo = loft(bodyCurve, (t) => {
      const sc = bodySec(t);
      const f = 1 + k * (0.45 + 0.7 * smooth01((t - ta) / (1 - ta)));
      return { ...sc, w: sc.w * f, up: sc.up * f, dn: sc.dn * (1 + k * 0.5), e: 2 };
    }, { n: 40, ring: 26, range: [ta, 1], capStart: false, capEnd: false, displace: (t, a, p) => H * 0.05 * k * (fbm(nz, p.x * 25 / H, p.y * 25 / H, p.z * 25 / H, 3) - 0.3) });
    const lt = lionGeo.attributes.lt.array;
    applySkin(lionGeo, (i) => neckChain(lerp(ta, 1, lt[i])));
  }

  /* ---------------- head ---------------- */
  const hl = S.head.len * H;
  const ha = (S.head.ang ?? 30) * deg;
  const hd = new THREE.Vector3(0, -Math.sin(ha), Math.cos(ha));
  const hu = new THREE.Vector3(0, Math.cos(ha), Math.sin(ha));
  const hs = S.head;
  const sw = hs.w * hl;
  const sh = hs.h * hl;
  const mw = hs.mw * sw;
  const mh = hs.mh * sh;
  const tm = 1 - hs.mlen;
  const stop = hs.stop ?? 0.2;
  const hStart = N2.clone().addScaledVector(hd, -sh * 0.55).addScaledVector(hu, sh * (hs.rise ?? 0.15));
  const hEnd = hStart.clone().addScaledVector(hd, hl);
  const hMid = hStart.clone().addScaledVector(hd, hl * tm).addScaledVector(hu, -(sh - mh) * 0.35 * (hs.drop ?? 1));
  const hTip = hEnd.clone().addScaledVector(hu, -(sh - mh) * 0.55 * (hs.drop ?? 1) + (hs.roman ?? 0) * mh * 0.3);
  const headCurve = spline([hStart, hStart.clone().lerp(hMid, 0.5).addScaledVector(hu, sh * 0.05), hMid, hMid.clone().lerp(hTip, 0.55).addScaledVector(hu, (hs.roman ?? 0) * mh * 0.25), hTip]);
  const jowl = hs.jowl ?? 0.1;
  const capF = Math.min((1 - tm) * 0.55, (Math.min(mw, mh) * 0.75) / hl);
  const headSec = keyed([
    [0, { w: sw * 0.55, up: sh * 0.6, dn: sh * 0.55, e: 2, wt: 1, wb: 1, yo: 0 }],
    [tm * 0.18, { w: sw * 0.92, up: sh * 0.95, dn: sh * 0.92, e: 2.1, wt: 0.95, wb: 1, yo: 0 }],
    [tm * 0.55, { w: sw, up: sh, dn: sh * (1 + jowl), e: 2.2, wt: 0.9, wb: 1.0, yo: 0 }],
    [tm * 0.92, { w: sw * (hs.cheek ?? 0.9), up: sh * (0.95 - stop * 0.3), dn: sh * (1 + jowl) * 0.85, e: 2.2, wt: 0.85, wb: 0.95, yo: 0 }],
    [lerp(tm, 1, 0.22), { w: mw * 1.08, up: mh * (1.05 + stop * 0.1), dn: mh * (1.15 + (hs.flews ?? 0)), e: hs.me ?? 2.3, wt: 0.85, wb: 0.95, yo: 0 }],
    // muzzle blends into a rounded tip (no flat disc), however short the muzzle is
    [1 - capF, { w: mw * (hs.flare ?? 1), up: mh, dn: mh * (1.05 + (hs.flews ?? 0)), e: hs.me ?? 2.4, wt: 0.88, wb: 1, yo: 0 }],
    [1 - capF * 0.5, { w: mw * (hs.flare ?? 1) * 0.86, up: mh * 0.84, dn: mh * (0.92 + (hs.flews ?? 0) * 0.8), e: 2.2, wt: 0.9, wb: 1, yo: 0 }],
    [1 - capF * 0.15, { w: mw * (hs.flare ?? 1) * 0.55, up: mh * 0.52, dn: mh * 0.6, e: 2.05, wt: 0.9, wb: 1, yo: 0 }],
    [1, { w: mw * 0.12, up: mh * 0.12, dn: mh * 0.12, e: 2, wt: 1, wb: 1, yo: 0 }],
  ]);
  const headGeo = loft(headCurve, headSec, {
    seam: true,
    n: 64,
    ring: 28,
    displace: (t, a, p) =>
      (furLen ? furLen * 0.4 * (fuzz(p) - 0.45) * smooth01((tm - t) / 0.2) : 0) +
      // forehead / face wrinkles (pugs, bulldogs, shar-pei)
      (hs.wrinkles ? -hl * 0.012 * hs.wrinkles * Math.max(0, Math.sin(t * 70)) ** 2 * smooth01((Math.cos(a) - 0.1) / 0.4) * bump(t, tm * 0.85, 0.12) : 0),
  });
  const headParts = [];
  let coatFn = null;
  const eyes = [];
  // eyes
  const eyeR = (S.eyes?.r ?? 0.06) * hl;
  const side = S.eyes?.side ?? 0.8; // 0 = forward-facing predator, 1 = side-facing prey
  const tEye = tm * lerp(1.0, 0.88, side);
  const aEye = lerp(0.62, 1.22, side);
  for (const sx of [1, -1]) {
    const sp = surfacePoint(headCurve, headSec, tEye, sx * aEye);
    const at = sp.p.clone().addScaledVector(sp.n, -eyeR * 0.62);
    eyes.push(at.clone());
    const look = sp.n.clone().lerp(hd, lerp(0.55, 0.05, side)).normalize();
    const eye = buildEye(at, look, eyeR, S.eyes ?? {});
    eye.name = `eye${sx > 0 ? 'L' : 'R'}`;
    headParts.push(eye);
  }
  // ears
  if (S.ears && S.ears.type !== 'none') {
    for (const sx of [1, -1]) {
      const e = S.ears;
      const tE = e.t ?? tm * 0.22;
      const sp = surfacePoint(headCurve, headSec, tE, sx * (e.a ?? 0.55));
      headParts.push(buildEar({ ...e, sx, hl, clearX: sw * Math.max(1, hs.cheek ?? 0.9) * 1.04 + hl * 0.01, base: sp.p.clone().addScaledVector(sp.n, -hl * 0.012), normal: sp.n, headUp: hu, headDir: hd }));
    }
  }
  // horns / antlers / ossicones
  if (S.horns) headParts.push(...buildHorns(S.horns, { headCurve, headSec, hl, tm, hu, hd, surfacePoint }));
  if (S.antlers) headParts.push(...buildAntlers(S.antlers, { headCurve, headSec, hl, tm, hu, hd, surfacePoint, rand }));
  // beard (goats), trunk & tusks (elephants), tusks (boars, walrus)
  if (S.beard) {
    const ch = surfacePoint(headCurve, headSec, lerp(tm, 1, 0.45), Math.PI);
    const g = loft(spline([ch.p.clone().addScaledVector(ch.n, -hl * 0.02), ch.p.clone().add(new THREE.Vector3(0, -S.beard * hl * 0.5, -S.beard * hl * 0.1)), ch.p.clone().add(new THREE.Vector3(0, -S.beard * hl, -S.beard * hl * 0.05))]), (t) => ({ w: hl * 0.06 * (1 - 0.8 * t), up: hl * 0.08 * (1 - 0.8 * t), dn: hl * 0.08 * (1 - 0.8 * t), e: 2 }), { n: 10, ring: 10, lateral: 'free', displace: (t, a, p) => hl * 0.012 * (fbm(nz, p.x * 400, p.y * 100, p.z * 400, 2) - 0.5) });
    g.userData.beard = true;
    const m = new THREE.Mesh(g, null);
    m.userData.paintFn = (c) => C(S.beardColor ?? S.coat.back ?? S.coat.base).multiplyScalar(0.9);
    headParts.push(m);
  }
  if (S.trunk) {
    const tr = S.trunk;
    const tip = headCurve.getPointAt(1);
    const tl = Math.min(tr.len * H, tip.y - H * 0.06);
    const pts = [tip.clone().addScaledVector(hd, -mw * 0.6), tip.clone().addScaledVector(hd, tl * 0.08).add(new THREE.Vector3(0, -tl * 0.2, 0)), tip.clone().addScaledVector(hd, tl * 0.12).add(new THREE.Vector3(0, -tl * 0.55, 0)), tip.clone().addScaledVector(hd, tl * 0.08).add(new THREE.Vector3(0, -tl * 0.85, 0)), tip.clone().addScaledVector(hd, tl * 0.2).add(new THREE.Vector3(0, -tl * 0.98, 0))];
    const r0 = tr.r0 * H;
    const r1 = tr.r1 * H;
    const g = loft(spline(pts), (t) => ({ w: lerp(r0, r1, t ** 0.8), up: lerp(r0, r1, t ** 0.8), dn: lerp(r0, r1, t ** 0.8), e: 2 }), { n: 40, ring: 18, displace: (t, a) => -r0 * 0.06 * Math.max(0, Math.sin(t * 90)) * (Math.cos(a) > 0 ? 1 : 0.3) });
    const m = new THREE.Mesh(g, null);
    m.userData.paintFn = (c, p, n) => coatFn(p, n, { region: 'body', t: 0.5 });
    m.name = 'trunk';
    headParts.push(m);
  }
  if (S.tusks) {
    const FWD = new THREE.Vector3(0, 0, 1);
    const tk = S.tusks;
    const tl = tk.len * H;
    for (const sx of [1, -1]) {
      const sp = surfacePoint(headCurve, headSec, tk.t ?? lerp(tm, 1, 0.75), sx * (tk.a ?? 2.3));
      const b0 = sp.p.clone().addScaledVector(sp.n, -tk.r * H * 0.8);
      const vk = Math.min(1, (b0.y - H * 0.08) / Math.max(1e-4, tl * 0.48));
      const pts = tk.type === 'boar'
        ? [b0, b0.clone().addScaledVector(FWD, tl * 0.4).add(new THREE.Vector3(sx * tl * 0.15, tl * 0.1, 0)), b0.clone().addScaledVector(FWD, tl * 0.5).add(new THREE.Vector3(sx * tl * 0.3, tl * 0.55, 0))]
        : tk.type === 'walrus'
          ? [b0, b0.clone().add(new THREE.Vector3(0, -tl * 0.5, tl * 0.08)), b0.clone().add(new THREE.Vector3(0, -tl, tl * 0.05))]
          : [b0, b0.clone().addScaledVector(FWD, tl * 0.25).add(new THREE.Vector3(sx * tl * 0.1, -tl * 0.35 * vk, 0)), b0.clone().addScaledVector(FWD, tl * 0.7).add(new THREE.Vector3(sx * tl * (tk.spread ?? 0.15), -tl * 0.45 * vk, 0)), b0.clone().addScaledVector(FWD, tl * 1.0).add(new THREE.Vector3(sx * tl * (tk.spread ?? 0.15) * 0.7, -tl * (tk.lift ?? 0.2) * vk, 0))];
      const g = loft(spline(pts), (t) => ({ w: tk.r * H * (1 - 0.8 * t), up: tk.r * H * (1 - 0.8 * t), dn: tk.r * H * (1 - 0.8 * t), e: 2 }), { n: 24, ring: 12, lateral: 'free' });
      const col = new Float32Array(g.attributes.position.count * 3);
      const ivory = C(tk.color ?? '#efe6cf');
      for (let i = 0; i < col.length / 3; i++) col.set([ivory.r, ivory.g, ivory.b], i * 3);
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const m = new THREE.Mesh(g, hornMaterial());
      m.name = 'tusk';
      headParts.push(m);
    }
  }
  // nose
  {
    const tipP = surfacePoint(headCurve, headSec, 0.985, 0);
    const ns = hs.nose ?? 'dog';
    if (ns === 'dog' || ns === 'cat' || ns === 'bear') {
      const r = Math.min(mw * (ns === 'cat' ? 0.24 : 0.4), hl * (ns === 'cat' ? 0.05 : 0.085));
      const nosePos = headCurve.getPointAt(1).clone().addScaledVector(hu, mh * (ns === 'cat' ? 0.35 : 0.3)).addScaledVector(hd, -r * 0.35);
      const g = new THREE.SphereGeometry(r, 20, 14);
      g.scale(1.05, ns === 'cat' ? 0.7 : 0.78, 0.7);
      const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: C(S.coat.nose ?? (ns === 'cat' ? '#c98088' : '#151210')), roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.4, name: 'nose' }));
      m.position.copy(nosePos);
      m.lookAt(nosePos.clone().add(hd));
      m.name = 'nose';
      headParts.push(m);
      for (const sx of [1, -1]) {
        const nn = new THREE.Mesh(new THREE.SphereGeometry(r * 0.22, 10, 8), new THREE.MeshBasicMaterial({ color: '#050404' }));
        nn.scale.set(1.3, 0.8, 0.6);
        nn.position.copy(nosePos).addScaledVector(hd, r * 0.62).add(new THREE.Vector3(sx * r * 0.38, 0, 0)).addScaledVector(hu, -r * 0.05);
        headParts.push(nn);
      }
    } else if (ns !== 'none') {
      // ungulate nostrils: dark slits on the muzzle front-sides
      for (const sx of [1, -1]) {
        const sp = surfacePoint(headCurve, headSec, 0.965, sx * (ns === 'pig' ? 0.0 : 0.75));
        const r = mw * (ns === 'pig' ? 0.12 : 0.2);
        const nn = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ color: '#0a0706' }));
        nn.scale.set(ns === 'horse' ? 0.55 : 0.7, ns === 'horse' ? 1.3 : 0.8, 0.45);
        if (ns === 'pig') nn.position.copy(headCurve.getPointAt(1)).addScaledVector(hd, mw * 0.02).add(new THREE.Vector3(sx * mw * 0.3, 0, 0));
        else nn.position.copy(sp.p).addScaledVector(sp.n, -r * 0.2);
        nn.lookAt(nn.position.clone().add(ns === 'pig' ? hd : sp.n));
        headParts.push(nn);
      }
      if (ns === 'pig') {
        // snout disc
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(mw * 0.62, mw * 0.68, mw * 0.18, 24).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: C(S.coat.nose ?? '#d98f8c'), roughness: 0.6 }));
        disc.position.copy(headCurve.getPointAt(1)).addScaledVector(hd, -mw * 0.06);
        disc.lookAt(disc.position.clone().add(hd));
        disc.scale.set(1, 0.82, 1);
        headParts.push(disc);
      }
    }
    void tipP;
  }
  // whiskers
  if (S.whiskers) {
    const wm = new THREE.MeshBasicMaterial({ color: S.whiskers === true ? '#f0ece4' : S.whiskers, transparent: true, opacity: 0.8 });
    for (const sx of [1, -1]) {
      const sp = surfacePoint(headCurve, headSec, 0.88, sx * 1.3);
      for (let k = 0; k < 4; k++) {
        const out = sp.n.clone().multiplyScalar(hl * 0.55).addScaledVector(hd, -hl * 0.1).addScaledVector(hu, (k - 1.5) * hl * 0.06);
        const g = new THREE.CylinderGeometry(hl * 0.0025, hl * 0.004, out.length(), 3);
        g.translate(0, out.length() / 2, 0);
        const m = new THREE.Mesh(g, wm);
        m.position.copy(sp.p).addScaledVector(sp.n, -hl * 0.004).addScaledVector(hu, (k - 1.5) * hl * 0.012);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), out.normalize());
        headParts.push(m);
      }
    }
  }

  /* ---------------- feet ---------------- */
  const footParts = [];
  legs.forEach((leg, li) => {
    if (leg.hoof) {
      const halves = S.cloven ? [-1, 1] : [0];
      for (const h of halves) {
        const hw = leg.hoof.w * H * (S.cloven ? 0.55 : 1);
        const hx = leg.x + h * leg.hoof.w * H * 0.48;
        const top = new THREE.Vector3(hx, leg.hoof.top * H, leg.hoof.z - leg.hoof.slope * leg.hoof.top * H);
        const bot = new THREE.Vector3(hx, 0, leg.hoof.z + leg.hoof.len * H * 0.15);
        const c = spline([top, top.clone().lerp(bot, 0.5), bot]);
        const g = loft(c, (t) => ({ w: hw * lerp(0.85, 1.05, t), up: leg.hoof.len * H * lerp(0.42, 0.55, t), dn: leg.hoof.len * H * lerp(0.4, 0.48, t), e: 2.4, wt: S.cloven ? 0.9 : 1 }), { n: 6, ring: 18 });
        // flatten the sole exactly onto the ground
        const P = g.attributes.position;
        for (let i = 0; i < P.count; i++) if (P.getY(i) < 0.004) P.setY(i, 0);
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, hoofMaterial(S.coat.hoof));
        m.name = 'hoof';
        footParts.push([m, leg.names[3]]);
      }
    } else if (leg.toes) {
      // toe bumps on the front of the paw
      const tp = leg.joints[leg.joints.length - 1];
      const pw = leg.toes.w * H;
      const tr = pw * 0.24;
      for (let k = 0; k < 4; k++) {
        const u = (k - 1.5) / 1.5;
        const g = new THREE.SphereGeometry(tr * (k === 0 || k === 3 ? 0.88 : 1), 12, 8);
        g.scale(1, 0.8, 1.15);
        g.translate(leg.x + u * pw * 0.5, tr * 0.8, tp[2] - tr * 0.6 - Math.abs(u) * tr * 0.7);
        g.userData.region = 'leg';
        g.userData.leg = li;
        footParts.push([g, leg.names[3], true]);
      }
      if (leg.toes.nails) {
        footParts.splice(footParts.length - 4, 4);
        const R = leg.r * H * 1.3;
        for (let k = 0; k < leg.toes.nails; k++) {
          const u = leg.toes.nails === 1 ? 0 : (k / (leg.toes.nails - 1) - 0.5) * 2;
          const g = new THREE.SphereGeometry(R * 0.38, 10, 8);
          g.scale(1, 0.8, 0.6);
          const ang = u * 0.9;
          g.translate(leg.x + Math.sin(ang) * R * 1.05, R * 0.3, tp[2] + Math.cos(ang) * R * 0.95 - R * 0.35);
          footParts.push([new THREE.Mesh(g, hoofMaterial(S.coat.nail ?? '#5a5048')), leg.names[3]]);
        }
      }
      if (leg.toes.claws) {
        for (let k = 0; k < 4; k++) {
          const u = (k - 1.5) / 1.5;
          const g = new THREE.ConeGeometry(tr * 0.28, tr * 0.9, 6);
          g.rotateX(Math.PI / 2 + 0.6);
          g.translate(leg.x + u * pw * 0.62, tr * 0.45, tp[2] + tr * 0.85 - Math.abs(u) * tr * 0.55);
          footParts.push([new THREE.Mesh(g, hornMaterial('#2a2420')), leg.names[3]]);
        }
      }
    }
  });

  /* ---------------- extras on the body ---------------- */
  const bodyParts = [];
  if (S.udder) {
    const g = new THREE.SphereGeometry(D * 0.2, 20, 14);
    g.scale(1, 0.75, 1.15);
    const at = surfacePoint(bodyCurve, bodySec, lerp(T.p1, T.p2, 0.45), Math.PI).p;
    g.translate(at.x, at.y + D * 0.02, at.z);
    bodyParts.push([new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: '#e7aaa6', roughness: 0.6, sheen: 0.3 })), 'body']);
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const tg = new THREE.CylinderGeometry(D * 0.018, D * 0.024, D * 0.08, 8);
      tg.translate(at.x + sx * D * 0.07, at.y - D * 0.14, at.z + sz * D * 0.08);
      bodyParts.push([new THREE.Mesh(tg, new THREE.MeshPhysicalMaterial({ color: '#dc9c98', roughness: 0.6 })), 'body']);
    }
  }

  /* ---------------- paint ---------------- */
  const coat = makeCoat(S.coat, { H, seed, eyes, bodyLen: BL });
  coatFn = coat;
  const lt = (g) => g.attributes.lt?.array;
  paint(bodyGeo, (i, p, n) => {
    const t = lt(bodyGeo)[i];
    return coat(p, n, { region: t > T.p4 + 0.02 ? 'neck' : 'body', t });
  });
  for (const g of legGeos) paint(g, (i, p, n) => coat(p, n, { region: 'leg', leg: g.userData.leg, t: lt(g)[i] }));
  if (tailGeo) paint(tailGeo, (i, p, n) => coat(p, n, { region: 'tail', t: lt(tailGeo)[i] }));
  for (const g of sheetGeos) {
    const cc = g.userData.color;
    paint(g, (i, p, n) => (cc ? C(cc).multiplyScalar(0.85 + 0.3 * nz(p.x * 300, p.y * 80, p.z * 300)) : coat(p, n, { region: 'neck', t: 0.9 })));
  }
  if (lionGeo) paint(lionGeo, (i, p) => C(S.mane.color ?? '#6a4424').lerp(C(S.mane.tip ?? S.coat.base), smooth01((p.y - (H + D * 0.2)) / (D * 0.6)) * 0.4).multiplyScalar(0.8 + 0.35 * nz(p.x * 120 / H, p.y * 40 / H, p.z * 120 / H)));
  paint(headGeo, (i, p, n) => coat(p, n, { region: 'head', t: lt(headGeo)[i], sx: headGeo.attributes.sx.array[i], sy: headGeo.attributes.sy.array[i], front: n.dot(hd) }));
  // hair tail colour
  if (tailGeo && (tail.type === 'horse' || tail.color)) {
    const tc = C(tail.color ?? S.mane?.color ?? S.coat.points ?? S.coat.back ?? '#222');
    paint(tailGeo, (i, p) => {
      const t = lt(tailGeo)[i];
      const c = coat(p, new THREE.Vector3(0, 1, 0), { region: 'tail', t });
      return c.lerp(tc, smooth01((t - (tail.type === 'horse' ? 0.08 : tail.type === 'trail' ? 0.02 : 0.85)) / 0.06)).multiplyScalar(0.85 + 0.3 * nz(p.x * 300, p.y * 60, p.z * 300));
    });
  }

  /* ---------------- assemble ---------------- */
  root.add(rig.get('body'));
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(rig.bones);
  const furMat = furMaterial({ sheen: S.sheen ?? 0.5 });
  // crisp coat patterns: bake body & head coats into textures (browser); vertex colours stay as fallback
  let bodyMat = furMat;
  let headMat = furMat;
  const white = (g) => g.attributes.color.array.fill(1);
  const uvTo = (g, u, v) => {
    const a = new Float32Array(g.attributes.position.count * 2);
    for (let i = 0; i < a.length; i += 2) {
      a[i] = u;
      a[i + 1] = v;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(a, 2));
  };
  const bodyTex = bakeLoft(bodyCurve, bodySec, (p, n, { t }) => coat(p, n, { region: t > T.p4 + 0.02 ? 'neck' : 'body', t }), { W: 1024, H: 256, uScale: 0.96 });
  if (bodyTex) {
    const uv = bodyGeo.attributes.uv.array;
    for (let i = 0; i < uv.length; i += 2) uv[i] *= 0.96;
    white(bodyGeo);
    for (const g of [...legGeos, ...(tailGeo ? [tailGeo] : [])]) uvTo(g, 0.995, 0.5);
    bodyMat = furMaterial({ sheen: S.sheen ?? 0.5 });
    bodyMat.map = bodyTex;
  }
  const headTex = bakeLoft(headCurve, headSec, (p, n, { t, sx, sy }) => coat(p, n, { region: 'head', t, sx, sy, front: n.dot(hd) }), { W: 256, H: 128, uScale: 0.98 });
  if (headTex) {
    const uv = headGeo.attributes.uv.array;
    for (let i = 0; i < uv.length; i += 2) uv[i] *= 0.98;
    white(headGeo);
    headMat = furMaterial({ sheen: S.sheen ?? 0.5 });
    headMat.map = headTex;
  }
  const geos = [bodyGeo, ...legGeos, ...(tailGeo ? [tailGeo] : [])];
  // merge all skinned fur parts into one mesh
  const merged = mergeSkinned(geos);
  root.add(skinnedMesh(merged, bodyMat, skeleton, 'body_mesh'));
  if (sheetGeos.length) root.add(skinnedMesh(mergeSkinned(sheetGeos), furMaterial({ name: 'hair', roughness: 0.75, sheen: 0.8 }), skeleton, 'mane'));
  if (lionGeo) {
    const lm = skinnedMesh(lionGeo, furMaterial({ name: 'hair', roughness: 0.85, sheen: 0.8 }), skeleton, 'mane_lion');
    lm.material.side = THREE.DoubleSide;
    root.add(lm);
  }
  // head (rigid, child of head bone)
  const headBone = rig.get('head');
  const hb = rig.world.head;
  const headMesh = new THREE.Mesh(stripLoft(headGeo), headMat);
  headMesh.name = 'head_mesh';
  headMesh.position.copy(hb).negate();
  headBone.add(headMesh);
  for (const part of headParts) {
    if (part.userData.paintFn) {
      paint(part.geometry, (i, p, n) => part.userData.paintFn(null, p, n));
      part.material = furMat;
    }
    if (part.userData.paint) {
      const g = part.geometry;
      const reg = g.userData.regions;
      const lts = g.userData.lt;
      paint(g, (i, p, n) => coat(p, n, { region: part.userData.paint === 'ear-all' ? 'ear' : reg[i] ? 'ear-inner' : 'ear', t: lts[i] }));
      part.material = furMat;
    }
    if (part.name === 'ear' && part.userData.base) {
      // pivot group at the ear base so ears can flick
      const pivot = new THREE.Group();
      pivot.name = `ear${part.userData.side > 0 ? 'L' : 'R'}`;
      pivot.position.copy(part.userData.base).sub(hb);
      part.position.copy(part.userData.base).negate();
      pivot.add(part);
      headBone.add(pivot);
      continue;
    }
    part.position.sub(hb);
    headBone.add(part);
  }
  // paws toes (painted) & hooves
  const toeGeos = {};
  for (const [obj, bone, painted] of footParts) {
    const bw = rig.world[bone];
    if (painted) {
      paint(obj, (i, p, n) => coat(p, n, { region: 'leg', leg: obj.userData.leg }));
      obj.translate(-bw.x, -bw.y, -bw.z);
      (toeGeos[bone] ??= []).push(obj);
    } else {
      obj.geometry.translate(-bw.x, -bw.y, -bw.z);
      rig.get(bone).add(obj);
    }
  }
  for (const [bone, gs] of Object.entries(toeGeos)) {
    const m = new THREE.Mesh(mergeSimple(gs), furMat);
    m.name = 'toes';
    rig.get(bone).add(m);
  }
  for (const [m, bone] of bodyParts) {
    const bw = rig.world[bone];
    m.geometry.translate(-bw.x, -bw.y, -bw.z);
    rig.get(bone).add(m);
  }

  const bodyWeights = (t) => chain(t, [B('pelvis'), B('body'), B('chest'), B('neck1'), B('neck2'), B('head')], [0, T.p1 + (T.p2 - T.p1) * 0.6, lerp(T.p2, T.p3, 0.55), lerp(T.p4, T.n1, 0.25), lerp(T.n1, 1, 0.1), 0.985], 0.05);
  const ctx = { rig, skeleton, bodyWeights, H, D, BL, legs, bodyCurve, bodySec, T, headCurve, headSec, hl, hd, hu, tm, S, N2, P4, coat };
  addAccessories(root, opts.accessories ?? [], ctx);

  root.userData.clips = quadAnimations(rig, S, { H, D, legs, root });
  return root;
}

function stripLoft(g) {
  for (const k of ['lt', 'la', 'sx', 'sy']) g.deleteAttribute(k);
  return g;
}

function mergeSimple(gs) {
  const out = [];
  let pos = [];
  let nor = [];
  let col = [];
  let idx = [];
  let off = 0;
  for (const g of gs) {
    const gi = g.index ? g : g;
    pos = pos.concat(Array.from(gi.attributes.position.array));
    nor = nor.concat(Array.from(gi.attributes.normal.array));
    col = col.concat(Array.from(gi.attributes.color.array));
    const ix = gi.index ? Array.from(gi.index.array) : [...Array(gi.attributes.position.count).keys()];
    idx = idx.concat(ix.map((v) => v + off));
    off += gi.attributes.position.count;
  }
  void out;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

export function mergeSkinned(gs) {
  const keys = ['position', 'normal', 'color', 'skinIndex', 'skinWeight'];
  const total = gs.reduce((a, g) => a + g.attributes.position.count, 0);
  const uvs = new Float32Array(total * 2).fill(0.995);
  {
    let o = 0;
    for (const g of gs) {
      if (g.attributes.uv) uvs.set(g.attributes.uv.array.subarray(0, g.attributes.position.count * 2), o * 2);
      o += g.attributes.position.count;
    }
  }
  const out = new THREE.BufferGeometry();
  const arrays = {
    position: new Float32Array(total * 3),
    normal: new Float32Array(total * 3),
    color: new Float32Array(total * 3),
    skinIndex: new Uint16Array(total * 4),
    skinWeight: new Float32Array(total * 4),
  };
  const idx = [];
  let off = 0;
  for (const g of gs) {
    for (const k of keys) arrays[k].set(g.attributes[k].array, off * g.attributes[k].itemSize);
    for (const v of g.index.array) idx.push(v + off);
    off += g.attributes.position.count;
  }
  out.setAttribute('position', new THREE.BufferAttribute(arrays.position, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(arrays.normal, 3));
  out.setAttribute('color', new THREE.BufferAttribute(arrays.color, 3));
  out.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(arrays.skinIndex, 4));
  out.setAttribute('skinWeight', new THREE.BufferAttribute(arrays.skinWeight, 4));
  out.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  out.setIndex(idx);
  return out;
}

/* ------------------------------------------------------------------ */
/* Leg layouts by foot posture                                         */
/* ------------------------------------------------------------------ */

/**
 * Returns 4 legs: { id, front, x, joints: [[0,y,z]…] (j0 shoulder/hip, j1 elbow/stifle,
 *   j2 carpus/hock, j3 fetlock/paw, … ground points), radii per loft key, loftEnd, hoof|toes }
 * Radii are [lateral, front, back] as fractions of H.
 */
function legLayout(S, { H, D, zb, croupY, legX }) {
  const legsOut = [];
  for (const front of [true, false]) {
    const L = { ...S.legs, ...(front ? S.legs.front : S.legs.hind) };
    const r = L.r ?? 0.045; // cannon / forearm reference radius (fraction of H)
    const type = L.type;
    for (const sx of [1, -1]) {
      const id = (front ? 'F' : 'B') + (sx > 0 ? 'L' : 'R');
      const x = sx * legX * (front ? 1 : (S.hindSpread ?? 1.02));
      let joints;
      let radii;
      let hoof = null;
      let toes = null;
      if (type === 'ungu') {
        const hoofTop = (L.hoofH ?? 0.045);
        const fet = (L.fetlock ?? 0.1) * H;
        if (front) {
          const zs = zb * 0.62;
          const knee = (L.knee ?? 0.3) * H;
          joints = [
            [0, H - D * 0.55, zs + D * 0.08],
            [0, H - D * 1.02, zs - D * 0.12],
            [0, knee, zs - D * 0.08],
            [0, fet, zs - D * 0.08],
            [0, hoofTop * H, zs - D * 0.08 + (L.pastern ?? 0.05) * H],
          ];
          radii = [[-1, [1.7, 3.0, 3.0]], [0, [1.8, 3.2, 3.0]], [1, [1.9, 2.4, 2.3]], [1.6, [1.35, 1.5, 1.45]], [2, [1.15, 1.25, 1.2]], [2.18, [0.92, 0.92, 0.95]], [2.6, [0.8, 0.78, 0.98]], [3, [1.0, 1.0, 1.15]], [3.5, [0.8, 0.8, 0.85]], [4, [0.95, 0.95, 1.0]]];
          hoof = { w: r * 1.05, len: r * 2.6, top: hoofTop, z: joints[4][2] + r * 0.4 * H, slope: 0.55 };
        } else {
          const zh = -zb * 0.7;
          const hock = (L.hock ?? 0.33) * H;
          // deep-bodied stock (cattle, pigs): keep the stifle well above the hock and shorten the
          // gaskin's horizontal reach so the tibia doesn't lie nearly flat (crouched look)
          const hipY = croupY - D * 0.42;
          const stifleY = Math.max(H - D, hock + 0.4 * (hipY - hock));
          const kz = clamp(((stifleY - hock) * 2) / (D * 0.66), 0.5, 1);
          // deep-chested stock (cattle chest ≈ .56, pigs ≈ .6) stands square: stifle only a
          // little ahead of the hip, hock just behind it and a vertical cannon under the hock
          const sq = S.squareHind ?? clamp((S.chest - 0.5) / 0.06, 0, 1);
          const zStifle = zh + D * lerp(0.38 * kz, 0.12, sq);
          const zHock = zh - D * lerp(0.28 * kz, 0.08, sq);
          const zFet = zh - D * lerp(0.2, 0.07, sq);
          joints = [
            [0, hipY, zh],
            [0, lerp(stifleY, hock + 0.5 * (hipY - hock), sq), zStifle],
            [0, hock, zHock],
            [0, fet, zFet],
            [0, hoofTop * H, zFet + (L.pastern ?? 0.05) * H * lerp(0.9, 0.6, sq)],
          ];
          radii = [[-1, [1.7, 4.0, 4.0]], [0, [1.8, 4.4, 4.2]], [0.5, [1.9, 4.0, 4.0]], [1, [2.0, 3.0, 3.3]], [1.5, [1.55, 2.0, 2.5]], [2, [1.1, 1.2, 1.55]], [2.2, [0.9, 0.95, 1.1]], [2.6, [0.82, 0.82, 1.0]], [3, [1.0, 1.0, 1.15]], [3.5, [0.8, 0.8, 0.85]], [4, [0.95, 0.95, 1.0]]];
          hoof = { w: r * 1.0, len: r * 2.5, top: hoofTop, z: joints[4][2] + r * 0.4 * H, slope: 0.6 };
        }
      } else if (type === 'digi') {
        const pawH = (L.paw ?? 0.06) * H;
        const pawL = (L.pawLen ?? 0.1) * H;
        if (front) {
          const zs = zb * 0.66;
          joints = [
            [0, H - D * 0.5, zs + D * 0.06],
            [0, H - D * 1.0, zs - D * 0.16],
            [0, (L.wrist ?? 0.14) * H, zs - D * 0.08],
            [0, pawH * 0.6, zs - D * 0.08 + pawL * 0.3],
            [0, pawH * 0.45, zs - D * 0.08 + pawL],
          ];
          radii = [[-1, [1.6, 2.8, 2.6]], [0, [1.7, 3.0, 2.8]], [1, [1.75, 2.2, 2.2]], [1.35, [1.4, 1.6, 1.5]], [1.8, [0.92, 0.98, 0.95]], [2, [1.02, 1.08, 1.12]], [2.25, [0.86, 0.86, 0.92]], [2.6, [0.95, 0.9, 1.0]], [3, [1.35, pawH * 0.5 / (r * H), pawH * 0.6 / (r * H)]], [4, [1.25, pawH * 0.42 / (r * H), pawH * 0.45 / (r * H)]]];
          toes = { w: r * 2.6, claws: L.claws };
        } else {
          const zh = -zb * 0.66;
          joints = [
            [0, croupY - D * 0.42, zh],
            [0, H - D * 0.98, zh + D * 0.42],
            [0, (L.hock ?? 0.28) * H, zh - D * 0.34],
            [0, pawH * 0.6, zh - D * 0.24 + pawL * 0.25],
            [0, pawH * 0.45, zh - D * 0.24 + pawL],
          ];
          radii = [[-1, [1.6, 3.8, 3.6]], [0, [1.7, 4.0, 3.9]], [0.5, [1.8, 3.6, 3.6]], [1, [1.85, 2.5, 2.8]], [1.4, [1.4, 1.7, 2.1]], [1.85, [0.9, 0.95, 1.05]], [2, [0.98, 1.0, 1.55]], [2.2, [0.82, 0.85, 0.9]], [2.6, [0.86, 0.88, 0.92]], [3, [1.3, pawH * 0.5 / (r * H), pawH * 0.6 / (r * H)]], [4, [1.2, pawH * 0.42 / (r * H), pawH * 0.45 / (r * H)]]];
          toes = { w: r * 2.5, claws: L.claws };
        }
      } else if (type === 'haunch' && !front) {
        // folded haunch (rabbits, hares, rodents): big thigh angled forward-down, hock resting
        // near the ground behind the hip, long hind foot flat on the ground pointing forward
        const footL = (L.foot ?? 0.5) * H;
        const fh = Math.max((L.footH ?? 0.05) * H, r * H * 1.3);
        const zh = -zb * (L.hip ?? 0.6);
        const hipY = croupY - D * 0.42;
        const zk = zh - D * (L.hockBack ?? 0.3);
        joints = [
          [0, hipY, zh],
          [0, lerp(fh, hipY, L.knee ?? 0.42), zh + D * (L.kneeFwd ?? 0.5)],
          [0, fh * 1.1, zk],
          [0, fh, zk + footL * 0.45],
          [0, fh * 0.75, zk + footL],
        ];
        const f = (v) => v / (r * H);
        const th = L.thigh ?? 1;
        radii = [[-1, [3.0 * th, 4.2 * th, 4.4 * th]], [0, [3.2 * th, 4.6 * th, 4.8 * th]], [0.55, [2.6 * th, 3.4 * th, 3.6 * th]], [1, [1.6, 1.9, 2.1]], [1.5, [1.15, 1.25, 1.35]], [2, [1.25, f(fh * 0.85), f(fh * 0.85)]], [3, [1.35, f(fh * 0.82), f(fh * 0.82)]], [4, [1.1, f(fh * 0.7), f(fh * 0.7)]]];
        toes = L.claws ? { w: r * 2.2, claws: L.claws } : null;
      } else {
        // plantigrade (bears, elephants, apes): straight column, flat foot
        const footL = (L.foot ?? 0.22) * H;
        const fh = (L.footH ?? 0.06) * H;
        const zs = front ? zb * 0.62 : -zb * 0.68;
        joints = [
          [0, front ? H - D * 0.5 : croupY - D * 0.42, zs],
          [0, H - D * 1.0, zs + (front ? -D * 0.06 : D * 0.12)],
          [0, (L.ankle ?? 0.14) * H, zs - (front ? 0 : D * 0.04)],
          [0, fh, zs + footL * 0.15],
          [0, fh * 0.75, zs + footL * 0.55],
        ];
        const k = front ? 1 : 1.12;
        const f = (v) => v / (r * H);
        radii = [[-1, [2.4 * k, 2.8 * k, 2.8 * k]], [0, [2.3 * k, 2.8 * k, 2.8 * k]], [1, [1.7 * k, 1.9 * k, 2.0 * k]], [2, [1.25 * k, 1.3 * k, 1.35 * k]], [3, [1.35 * k, f(fh * 0.55), f(fh * 0.55)]], [4, [1.3 * k, f(fh * 0.75), f(fh * 0.75)]]];
        toes = L.claws || L.toes ? { w: r * 2.4 * k, claws: L.claws } : null;
        if (L.nails) toes = { w: r * 2.4 * k, nails: L.nails };
      }
      legsOut.push({ id, front, x, joints, radii, r, loftEnd: joints.length, hoof, toes });
    }
  }
  return legsOut;
}

/* ------------------------------------------------------------------ */
/* Tails                                                               */
/* ------------------------------------------------------------------ */

function tailPath(tail, root, len, H) {
  const p = (dy, dz, dx = 0) => root.clone().add(new THREE.Vector3(dx, dy * len, dz * len));
  switch (tail.type) {
    case 'curl': // over the back (husky, akita, pug)
      return [p(0, 0), p(0.2, -0.15), p(0.45, -0.08), p(0.55, 0.15), p(0.42, 0.32)];
    case 'cat':
      return [p(0, 0), p(-0.18, -0.12), p(-0.5, -0.2), p(-0.78, -0.22), p(-0.9, -0.12), p(-0.88, -0.02)];
    case 'up': // goat, deer flag, cat walking
      return [p(0, 0), p(0.3, -0.35), p(0.62, -0.5), p(0.9, -0.42)];
    case 'horse':
      return [p(0, 0), p(-0.06, -0.12), p(-0.3, -0.2), p(-0.65, -0.2), p(-0.95, -0.14)];
    case 'tuft':
    case 'hang':
      return [p(0, 0), p(-0.1, -0.08), p(-0.45, -0.12), p(-0.98, -0.1)];
    case 'short':
      return [p(0, 0), p(-0.25, -0.5), p(-0.65, -0.75), p(-0.95, -0.8)];
    case 'bushy':
      return [p(0, 0), p(-0.15, -0.25), p(-0.42, -0.6), p(-0.62, -0.85), p(-0.6, -1.0)];
    case 'plume': // squirrel / skunk: back, up and forward over the back in an S
      return [p(0, 0), p(0.12, -0.28), p(0.45, -0.36), p(0.75, -0.22), p(0.92, -0.02), p(0.9, 0.12)];
    case 'pom': // rabbit cotton tail: short round puff tipped up
      return [p(0, 0), p(0.3, -0.5), p(0.55, -0.95)];
    case 'trail': { // mouse / rat: drops off the rump to the ground, then trails behind in a lazy S
      const e = -Math.max(0, root.y - (tail.r ?? 0.02) * H * 1.2) / len;
      return [p(0, 0), p(e * 0.45, -0.1), p(e * 0.92, -0.26), p(e, -0.45, 0.06 * len), p(e, -0.68, -0.05 * len), p(e, -0.9, 0.04 * len), p(e, -1.0, 0.08 * len)];
    }
    case 'paddle': { // beaver: drops to the ground then lies flat behind
      const e = -Math.max(0, root.y - (tail.r ?? 0.1) * H * 0.4) / len;
      return [p(0, 0), p(e * 0.6, -0.22), p(e * 0.97, -0.5), p(e, -0.75), p(e, -1.0)];
    }
    case 'thick': // crocodile, kangaroo: down to the ground and back
      return [p(0, 0), p(-0.2, -0.3), p(-0.38, -0.65), p(-0.42, -1.0)];
    case 'curly': {
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * Math.PI * 2.2;
        pts.push(p(0.15 * Math.sin(a) - 0.1 * (i / 10), -0.25 * (i / 10) - 0.12 * (1 - Math.cos(a)), 0.12 * Math.sin(a * 0.5) * len));
      }
      return pts;
    }
    case 'dog':
    default:
      return [p(0, 0), p(-0.04, -0.2), p(-0.18, -0.48), p(-0.42, -0.74), p(-0.58, -0.86)];
  }
}

function tailRadius(tail, H) {
  const r = (tail.r ?? 0.025) * H;
  switch (tail.type) {
    case 'horse':
      return (t) => r * (t < 0.1 ? 1 - t * 2 : 0.8 + 1.3 * Math.sin(Math.PI * Math.min(1, (t - 0.1) / 0.85)) ** 0.6) * (t > 0.96 ? (1 - t) * 25 : 1) + 1e-4;
    case 'tuft':
      return (t) => r * (0.9 - 0.5 * t + 2.2 * bump(t, 0.92, 0.06)) * (t > 0.985 ? 0.3 : 1);
    case 'pom':
      return (t) => r * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.88)) ** 0.55 + 1e-4;
    case 'plume':
      return (t) => r * (0.45 + 1.0 * smooth01(t / 0.3)) * (1 - 0.7 * smooth01((t - 0.82) / 0.18)) + 1e-4;
    case 'paddle':
      return (t) => r * (0.5 + 0.7 * smooth01((t - 0.2) / 0.3)) * (t > 0.9 ? Math.max(0.25, 1 - (t - 0.9) * 7) : 1) + 1e-4;
    case 'bushy':
      return (t) => r * (0.7 + 1.6 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.05)) ** 0.7) * (1 - 0.6 * smooth01((t - 0.85) / 0.15)) + 1e-4;
    case 'thick':
      return (t) => r * (1 - 0.85 * t) + 1e-4;
    case 'curly':
      return () => r * 0.6;
    case 'short':
      return (t) => r * (1 - 0.35 * t) * (t > 0.9 ? 1 - (t - 0.9) * 6 : 1);
    default:
      return (t) => r * (1 - 0.6 * t ** 1.2) * (t > 0.95 ? 1 - (t - 0.95) * 12 : 1) + 1e-4;
  }
}

/* ------------------------------------------------------------------ */
/* Animations                                                          */
/* ------------------------------------------------------------------ */

function quadAnimations(rig, S, { H, D, legs, root }) {
  const b = (n) => rig.get(n) ?? root.getObjectByName(n);
  const g = S.gait ?? 1;
  const has = (n) => rig.has(n) || !!root.getObjectByName(n);
  const make = (name, period, spec, steps = 40) =>
    clip(name, period, Object.entries(spec).filter(([n]) => n === 'bodyPos' || has(n)).map(([node, fn]) => (node === 'bodyPos' ? offsetTrack(b('body'), period, fn, steps) : poseTrack(b(node), period, fn, steps))));
  const ungu = S.legs.type === 'ungu';
  const legSpec = (amp, flex, phases) => {
    const out = {};
    for (const leg of legs) {
      const ph = phases[leg.id];
      const n = leg.names;
      const A = (t) => Math.sin(TAU * (t + ph));
      const lift = (t) => Math.max(0, Math.cos(TAU * (t + ph))) ** 1.5;
      if (leg.front) {
        out[n[0]] = (t) => [-amp * A(t), 0, 0];
        out[n[1]] = (t) => [0.15 * flex * lift(t), 0, 0];
        out[n[2]] = (t) => [(ungu ? 1.3 : 0.9) * flex * lift(t), 0, 0];
        out[n[3]] = (t) => [0.5 * flex * lift(t), 0, 0];
      } else {
        out[n[0]] = (t) => [-amp * 0.85 * A(t), 0, 0];
        out[n[1]] = (t) => [0.55 * flex * lift(t), 0, 0];
        out[n[2]] = (t) => [-0.9 * flex * lift(t), 0, 0];
        out[n[3]] = (t) => [0.6 * flex * lift(t), 0, 0];
      }
    }
    return out;
  };
  const walkPh = { BL: 0, FL: 0.25, BR: 0.5, FR: 0.75 };
  const trotPh = { FL: 0, BR: 0, FR: 0.5, BL: 0.5 };
  const gallopPh = { BL: 0, BR: 0.1, FL: 0.45, FR: 0.55 };
  const wag = (amp, speed = 1, up = 0) => ({
    tail1: (t) => [up, amp * Math.sin(TAU * t * speed), 0],
    tail2: (t) => [up * 0.5, amp * 1.2 * Math.sin(TAU * t * speed - 0.7), 0],
    tail3: (t) => [0, amp * 1.4 * Math.sin(TAU * t * speed - 1.4), 0],
    tail4: (t) => [0, amp * 1.5 * Math.sin(TAU * t * speed - 2.1), 0],
  });
  const clips = [];
  // blink: quick eyelid close (eye scaled flat) twice per idle loop
  const blink = (period, at) => ['eyeL', 'eyeR'].filter(has).map((n) => {
    const e = b(n);
    const s0 = e.scale.clone();
    const times = [];
    const vals = [];
    for (const [t, k] of [[0, 1], ...at.flatMap((a) => [[a - 0.012, 1], [a, 0.15], [a + 0.012, 1]]), [1, 1]]) {
      times.push(t * period);
      vals.push(s0.x, s0.y * k, s0.z);
    }
    return new THREE.VectorKeyframeTrack(`${n}.scale`, times, vals);
  });
  const ear = (amp, at) => ({
    earL: (t) => [0, 0, amp * Math.exp(-(((t - at) * 30) ** 2))],
    earR: (t) => [0, 0, -amp * Math.exp(-(((t - at - 0.2) * 30) ** 2))],
  });
  const withExtra = (c, extra) => {
    c.tracks.push(...extra);
    return c;
  };
  clips.push(
    withExtra(make('idle', 6, {
      // breathing: chest rises every ~2 s; slow head turns; tail sway; ear flicks
      bodyPos: (t) => [0, 0.004 * H * Math.sin(TAU * t * 3), 0],
      chest: (t) => [0.012 * Math.sin(TAU * t * 3), 0, 0],
      neck1: (t) => [0.04 * Math.sin(TAU * t), 0.16 * Math.sin(TAU * t), 0],
      head: (t) => [0.06 * Math.sin(TAU * t * 2), 0.22 * Math.sin(TAU * t + 1) * smooth01(Math.abs(Math.sin(TAU * t + 1)) * 2), 0.04 * Math.sin(TAU * t)],
      ...wag(0.12, 1),
      ...ear(0.35, 0.4),
    }, 60), blink(6, [0.3, 0.78])),
  );
  const wp = 1.1 / g;
  clips.push(
    make('walk', wp, {
      // 4-beat walk (LH, LF, RH, RF), spine flexes laterally, head bobs to counterbalance
      bodyPos: (t) => [0.006 * H * Math.sin(TAU * t), 0.01 * H * Math.cos(2 * TAU * t), 0],
      body: (t) => [0, 0.02 * Math.sin(TAU * t), 0.015 * Math.sin(TAU * t)],
      pelvis: (t) => [0, -0.05 * Math.sin(TAU * t), 0.02 * Math.sin(TAU * t)],
      chest: (t) => [0, 0.04 * Math.sin(TAU * t + 0.5), 0],
      neck1: (t) => [(ungu ? 0.08 : 0.04) * Math.cos(2 * TAU * t), -0.04 * Math.sin(TAU * t + 0.5), 0],
      head: (t) => [-0.04 * Math.cos(2 * TAU * t), 0, 0],
      ...legSpec(0.3, 0.65, walkPh),
      ...wag(0.16, 1),
      ...ear(0.15, 0.5),
    }),
  );
  clips.push(
    make('trot', 0.62 / g, {
      // diagonal pairs move together with a short suspension phase
      bodyPos: (t) => [0, 0.025 * H * Math.abs(Math.sin(2 * TAU * t)), 0],
      body: (t) => [0.015 * Math.sin(2 * TAU * t), 0, 0.01 * Math.sin(TAU * t)],
      neck1: (t) => [0.05 + 0.04 * Math.cos(2 * TAU * t), 0, 0],
      head: (t) => [-0.03 * Math.cos(2 * TAU * t), 0, 0],
      ...legSpec(0.42, 0.95, trotPh),
      ...wag(0.1, 2, -0.08),
    }),
  );
  const gallop = S.run === 'gallop';
  clips.push(
    make('run', (gallop ? 0.5 : 0.6) / g, {
      bodyPos: (t) => [0, 0.04 * H * Math.abs(Math.cos(TAU * t)) - 0.01 * H, 0],
      body: (t) => [gallop ? 0.06 * Math.sin(TAU * t) : 0.02 * Math.sin(2 * TAU * t), 0, 0],
      pelvis: (t) => [gallop ? 0.1 * Math.sin(TAU * t + 0.6) : 0, 0, 0],
      neck1: (t) => [0.1 + 0.08 * Math.cos(TAU * t * (gallop ? 1 : 2)), 0, 0],
      head: () => [0.08, 0, 0],
      ...legSpec(gallop ? 0.6 : 0.5, 1.15, gallop ? gallopPh : trotPh),
      ...wag(0.08, 2, -0.15),
    }),
  );
  // eat: graze (ungulates) / sniff the ground (others)
  {
    const down = Math.max(0.5, (S.neck.ang ?? 40) * deg + 0.45);
    const gp = (t) => smooth01(t / 0.2) - smooth01((t - 0.8) / 0.2);
    clips.push(
      make(ungu ? 'graze' : 'sniff', 6, {
        neck1: (t) => [down * 0.6 * gp(t), 0.05 * Math.sin(TAU * t * 2) * gp(t), 0],
        neck2: (t) => [down * 0.4 * gp(t), 0, 0],
        head: (t) => [0.2 * gp(t) + 0.06 * Math.sin(TAU * t * 8) * gp(t), 0, 0],
        chest: (t) => [0.06 * gp(t), 0, 0],
        ...wag(0.15, 2),
      }),
    );
  }
  if (S.sits) {
    const sp = (t) => smooth01(t / 0.85);
    const pitch = 0.62;
    const hindDrop = legs.find((l) => !l.front);
    const hipY = hindDrop.joints[0][1];
    clips.push(
      make('sit', 1.4, {
        bodyPos: (t) => [0, -hipY * 0.42 * sp(t), -D * 0.25 * sp(t)],
        body: (t) => [-pitch * 0.55 * sp(t), 0, 0],
        pelvis: (t) => [-pitch * 0.45 * sp(t), 0, 0],
        neck1: (t) => [pitch * 0.55 * sp(t), 0, 0],
        head: (t) => [pitch * 0.35 * sp(t), 0, 0],
        legFL0: (t) => [pitch * 0.55 * sp(t), 0, 0],
        legFR0: (t) => [pitch * 0.55 * sp(t), 0, 0],
        legBL0: (t) => [-0.85 * sp(t), 0, 0],
        legBR0: (t) => [-0.85 * sp(t), 0, 0],
        legBL1: (t) => [1.75 * sp(t), 0, 0],
        legBR1: (t) => [1.75 * sp(t), 0, 0],
        legBL2: (t) => [-0.5 * sp(t), 0, 0],
        legBR2: (t) => [-0.5 * sp(t), 0, 0],
        legBL3: (t) => [0.6 * sp(t), 0, 0],
        legBR3: (t) => [0.6 * sp(t), 0, 0],
        tail1: (t) => [0.6 * sp(t), 0, 0],
      }),
    );
  }
  {
    // lie down: body sinks to the ground, legs fold under (ungulates tuck, dogs/cats stretch forelegs)
    const lp = (t) => smooth01(t / 0.85);
    const front = legs.find((l) => l.front);
    const drop = front.joints[0][1] - D * 0.55;
    const spec = {
      bodyPos: (t) => [0, -drop * lp(t), 0],
      neck1: (t) => [-0.15 * lp(t), 0, 0],
      head: (t) => [0.1 * lp(t), 0.2 * lp(t), 0],
      tail1: (t) => [0.3 * lp(t), 0.3 * lp(t), 0],
    };
    for (const leg of legs) {
      const n = leg.names;
      if (leg.front) {
        if (ungu) {
          spec[n[0]] = (t) => [-0.35 * lp(t), 0, 0];
          spec[n[1]] = (t) => [0.2 * lp(t), 0, 0];
          spec[n[2]] = (t) => [2.4 * lp(t), 0, 0];
          spec[n[3]] = (t) => [0.4 * lp(t), 0, 0];
        } else {
          spec[n[0]] = (t) => [-1.25 * lp(t), 0, 0];
          spec[n[1]] = (t) => [-0.1 * lp(t), 0, 0];
          spec[n[2]] = (t) => [-0.2 * lp(t), 0, 0];
          spec[n[3]] = (t) => [-0.1 * lp(t), 0, 0];
        }
      } else {
        spec[n[0]] = (t) => [-0.55 * lp(t), 0, 0];
        spec[n[1]] = (t) => [1.45 * lp(t), 0, 0];
        spec[n[2]] = (t) => [-1.25 * lp(t), 0, 0];
        spec[n[3]] = (t) => [0.4 * lp(t), 0, 0];
      }
    }
    clips.push(make('lie', 1.6, spec));
  }
  if (S.wags) clips.push(make('wag', 0.42, { ...wag(0.6, 1, -0.3), head: (t) => [0, 0.06 * Math.sin(TAU * t), 0.05 * Math.sin(TAU * t)] }));
  return clips;
}
