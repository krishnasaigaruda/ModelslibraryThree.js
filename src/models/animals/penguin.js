import * as THREE from 'three';
import { Rig, applySkin, chain, skinnedMesh, poseTrack, offsetTrack, loft, surfacePoint, spline, keyed, paint, furMaterial, smooth01, lerp, bump, TAU, C } from './core.js';
import { buildEye } from './parts.js';
import { mergeSkinned } from './quad.js';
import { clip } from '../../core/animation.js';

/*
 * Penguins: upright smooth torpedo body (one clean loft, no noise), black back
 * and head with a crisp white front, species face markings (auricular patch,
 * eye ring, head band), long slender bill, smooth paddle flippers held slightly
 * out, short legs with webbed feet flat on the ground pointing forward, a short
 * stiff tail touching the ground. Animations: waddle walk, idle, slide.
 */
export function buildPenguin(name, S, opts = {}) {
  const H = S.H;
  const k = S.chick ? 1 : 0;
  const root = new THREE.Group();
  root.name = `animal-${name}`;
  const rig = new Rig();
  const fat = S.fat ?? 1;
  // centreline (lateral = X, U points to the back for a vertical curve)
  const P = [
    [0, H * 0.07, -H * 0.06],
    [0, H * 0.3, -H * 0.005],
    [0, H * 0.55, 0.0],
    [0, H * 0.72, H * 0.012],
    [0, H * 0.84, H * 0.03],
    [0, H * 0.93, H * 0.055],
    [0, H * 0.985, H * 0.085],
  ].map((p) => new THREE.Vector3(...p));
  const curve = spline(P);
  const R = H * 0.17 * fat;
  const sec = keyed([
    [0, { w: R * 0.35, up: R * 0.3, dn: R * 0.35, e: 2 }],
    [0.07, { w: R * 0.8, up: R * 0.72, dn: R * 0.85, e: 2 }],
    [0.3, { w: R, up: R * 0.92, dn: R * 1.08, e: 2 }],
    [0.55, { w: R * 0.88, up: R * 0.8, dn: R * 0.95, e: 2 }],
    [0.72, { w: R * 0.6, up: R * 0.58, dn: R * 0.66, e: 2 }],
    [0.8, { w: R * 0.5, up: R * 0.5, dn: R * 0.52, e: 2 }],
    [0.9, { w: R * (S.headR ?? 0.52), up: R * 0.55, dn: R * 0.5, e: 2 }],
    [0.97, { w: R * 0.4, up: R * 0.4, dn: R * 0.38, e: 2 }],
    [1, { w: R * 0.22, up: R * 0.2, dn: R * 0.2, e: 2 }],
  ]);
  const body = loft(curve, sec, { n: 90, ring: 32 });
  rig.add('body', [0, H * 0.28, 0]);
  rig.add('chest', [0, H * 0.58, 0], 'body');
  rig.add('head', [0, H * 0.8, H * 0.02], 'chest');
  const B = (n) => rig.index(n);
  const lt = body.attributes.lt.array;
  applySkin(body, (i) => chain(lt[i], [B('body'), B('chest'), B('head')], [0, 0.45, 0.76], 0.06));

  // markings
  const cc = S.coat;
  const black = C(cc.back ?? '#16181c');
  const white = C(cc.belly ?? '#f6f6f4');
  const sx = body.attributes.sx.array;
  const sy = body.attributes.sy.array;
  paint(body, (i, p, n) => {
    const t = lt[i];
    const front = -sy[i]; // +1 = belly front, -1 = back
    if (k) {
      // downy chick: grey body, white face mask, dark cap
      let c = C(cc.down ?? '#9a9ea4');
      if (t > 0.78 && front > 0.1 && Math.abs(sx[i]) < 0.9) c = C('#f4f4f2');
      if (t > 0.86 && front < 0.2) c = C('#2a2c30');
      return c;
    }
    // clean white front: wide on the belly, narrowing up the throat
    const edge = lerp(-0.25, 0.35, smooth01((t - 0.55) / 0.25));
    let c = front > edge + 0.05 ? white.clone() : front > edge - 0.05 ? black.clone().lerp(white, (front - edge + 0.05) / 0.1) : black.clone();
    if (t > (S.blackThroat ?? 0.8)) c = black.clone();
    if (cc.breast) c.lerp(C(cc.breast), smooth01((front - 0.4) / 0.2) * bump(t, 0.7, 0.05));
    if (cc.patch) c.lerp(C(cc.patch), smooth01((0.14 - Math.hypot((t - (cc.patchAt ?? 0.8)) * 1.3, (Math.abs(sx[i]) - 0.82) * 0.25)) / 0.03) * smooth01((front + 0.2) / 0.2));
    if (cc.band && t > 0.85) c.lerp(C(cc.band), smooth01((0.05 - Math.abs(t - 0.9 - 0.02 * front)) / 0.015) * smooth01((Math.abs(sx[i]) - 0.3) / 0.3));
    if (cc.chinstrap) c.lerp(black, smooth01((0.012 - Math.abs(t - 0.82)) / 0.006) * smooth01((front - 0.2) / 0.1));
    if (cc.face && t > 0.8) c.lerp(C(cc.face), smooth01((front - 0.1) / 0.1));
    return c;
  });

  // flippers: smooth paddles hanging slightly out from the shoulders
  const geos = [body];
  for (const s2 of [1, -1]) {
    const sh = surfacePoint(curve, sec, 0.58, s2 * Math.PI * 0.5).p;
    const fl = H * (S.flipper ?? 0.32);
    const out = (S.flipperOut ?? 0.28);
    const pts = [sh.clone().add(new THREE.Vector3(-s2 * H * 0.02, H * 0.02, 0)), sh.clone().add(new THREE.Vector3(s2 * fl * Math.sin(out) * 0.5, -fl * 0.45, -H * 0.005)), sh.clone().add(new THREE.Vector3(s2 * fl * Math.sin(out), -fl, -H * 0.02))];
    const fc = spline(pts);
    const n1 = `flipper${s2 > 0 ? 'L' : 'R'}`;
    rig.add(n1, sh.toArray(), 'chest');
    const g = loft(fc, (t) => {
      const wdt = H * 0.055 * Math.sin(Math.PI * Math.min(1, t * 0.85 + 0.12)) ** 0.6 + 1e-4;
      return { w: H * 0.008 * (1 - 0.6 * t) + 1e-4, up: wdt, dn: wdt * 0.75, e: 2 };
    }, { n: 20, ring: 14, lateral: 'x' });
    paint(g, (i, p, n) => (n.x * s2 < -0.3 ? white.clone() : black.clone()));
    applySkin(g, () => [[B(n1), 1]]);
    geos.push(g);
  }
  // tail: short stiff wedge touching the ground at the back
  {
    const a = surfacePoint(curve, sec, 0.06, 0).p;
    const g = loft(spline([a.clone().add(new THREE.Vector3(0, H * 0.02, H * 0.02)), new THREE.Vector3(0, H * 0.015, a.z - H * 0.08)]), (t) => ({ w: H * 0.045 * (1 - 0.5 * t), up: H * 0.012, dn: H * 0.012, e: 2.4 }), { n: 8, ring: 12, lateral: 'x' });
    const P2 = g.attributes.position;
    for (let i = 0; i < P2.count; i++) if (P2.getY(i) < 0.003) P2.setY(i, 0);
    g.computeVertexNormals();
    paint(g, () => black.clone());
    applySkin(g, () => [[B('body'), 1]]);
    geos.push(g);
  }
  // legs + webbed feet pointing forward, flat on the ground
  const feetC = C(S.feet ?? '#2a2a2a');
  for (const s2 of [1, -1]) {
    const n1 = `foot${s2 > 0 ? 'L' : 'R'}`;
    const ankle = new THREE.Vector3(s2 * H * 0.07, H * 0.05, H * 0.03);
    rig.add(n1, ankle.toArray(), 'body');
    // short leg stub from inside the body down to the ankle
    const leg = loft(spline([new THREE.Vector3(s2 * H * 0.06, H * 0.12, 0), ankle]), () => ({ w: H * 0.025, up: H * 0.025, dn: H * 0.025, e: 2 }), { n: 6, ring: 10, lateral: 'auto' });
    paint(leg, () => feetC.clone());
    applySkin(leg, () => [[B(n1), 1]]);
    geos.push(leg);
    // foot: three forward toes joined by web, as one flattened paddle + toe ridges
    const toeLen = H * 0.1;
    const fp = loft(spline([ankle.clone().setY(H * 0.012), new THREE.Vector3(ankle.x + s2 * H * 0.008, H * 0.01, ankle.z + toeLen * 0.55), new THREE.Vector3(ankle.x + s2 * H * 0.012, H * 0.008, ankle.z + toeLen)]), (t) => ({ w: H * (0.022 + 0.03 * t) * (t > 0.92 ? 1 - (t - 0.92) * 8 : 1) + 1e-4, up: H * 0.011 * (1 - 0.5 * t) + 1e-4, dn: H * 0.008 + 1e-4, e: 2.6 }), { n: 12, ring: 14, lateral: 'auto' });
    const Pf = fp.attributes.position;
    for (let i = 0; i < Pf.count; i++) if (Pf.getY(i) < 0.002) Pf.setY(i, 0);
    fp.computeVertexNormals();
    paint(fp, (i, p) => feetC.clone().multiplyScalar(0.9 + 0.2 * Math.abs(Math.sin((p.x - ankle.x) * 600 / H))));
    applySkin(fp, () => [[B(n1), 1]]);
    geos.push(fp);
    // claws at the toe tips
    for (const u of [-1, 0, 1]) {
      const cg = new THREE.ConeGeometry(H * 0.006, H * 0.018, 6);
      cg.rotateX(Math.PI / 2);
      cg.translate(ankle.x + s2 * H * 0.012 + u * H * 0.022, H * 0.006, ankle.z + toeLen + H * 0.006);
      paint(cg, () => C('#1a1a1a'));
      applySkin(cg, () => [[B(n1), 1]]);
      geos.push(cg);
    }
  }

  if (S.egg) {
    // incubating: an egg resting on the feet under the belly fold
    const eg = new THREE.SphereGeometry(H * 0.055, 18, 12);
    eg.scale(0.8, 1, 0.8);
    eg.translate(0, H * 0.065, H * 0.1);
    paint(eg, () => C('#f2eee2'));
    applySkin(eg, () => [[B('body'), 1]]);
    geos.push(eg);
  }
  // assemble skinned mesh
  root.add(rig.get('body'));
  root.updateMatrixWorld(true);
  const skel = new THREE.Skeleton(rig.bones);
  const mat = furMaterial({ roughness: 0.55, sheen: 0.4 });
  root.add(skinnedMesh(mergeSkinned(geos), mat, skel, 'body_mesh'));

  // bill: long slender, slightly decurved, black with an orange lower-mandible stripe
  const head = rig.get('head');
  const hw = rig.world.head;
  const tip = curve.getPointAt(0.985);
  const fwd = new THREE.Vector3(0, -0.12, 1).normalize();
  const bl = H * (S.bill ?? 0.13);
  const base = tip.clone().add(new THREE.Vector3(0, -H * 0.012, -H * 0.012));
  const bc = spline([base, base.clone().addScaledVector(fwd, bl * 0.55).add(new THREE.Vector3(0, bl * 0.01, 0)), base.clone().addScaledVector(fwd, bl).add(new THREE.Vector3(0, -bl * 0.08, 0))]);
  const bg = loft(bc, (t) => ({ w: H * 0.018 * (1 - 0.85 * t) + 1e-4, up: H * 0.02 * (1 - 0.8 * t) + 1e-4, dn: H * 0.018 * (1 - 0.8 * t) + 1e-4, e: 2 }), { n: 18, ring: 14 });
  const bsy = bg.attributes.sy.array;
  const blt = bg.attributes.lt.array;
  paint(bg, (i) => {
    let c = C(S.billColor ?? '#141416');
    if (S.stripe && bsy[i] < -0.25 && blt[i] < 0.7) c = C(S.stripe);
    if (Math.abs(bsy[i] + 0.1) < 0.06 && blt[i] > 0.08) c = C('#050505');
    return c;
  });
  bg.translate(-hw.x, -hw.y, -hw.z);
  const bill = new THREE.Mesh(bg, new THREE.MeshPhysicalMaterial({ name: 'bill', vertexColors: true, roughness: 0.35, clearcoat: 0.5 }));
  bill.name = 'beak';
  head.add(bill);
  for (const s2 of [1, -1]) {
    const sp = surfacePoint(curve, sec, 0.93, s2 * 1.75);
    const er = H * 0.012;
    const e = buildEye(sp.p.clone().addScaledVector(sp.n, -er * 0.4), sp.n, er, { color: '#2a1810', lid: cc.eyeRing ?? '#141414', lidSquint: 0.95 });
    e.position.sub(hw);
    head.add(e);
  }

  // animations
  const make = (nm, per, spec, steps = 32) => clip(nm, per, Object.entries(spec).map(([n, fn]) => (n === 'pos' ? offsetTrack(rig.get('body'), per, fn, steps) : poseTrack(rig.get(n), per, fn, steps))));
  const wp = 0.9;
  root.userData.clips = [
    make('walk', wp, {
      // waddle: rock side to side, yaw a little, lift the unloaded foot, flippers out for balance
      body: (t) => [0, 0.08 * Math.sin(TAU * t), 0.13 * Math.sin(TAU * t)],
      pos: (t) => [H * 0.015 * Math.sin(TAU * t), H * 0.008 * Math.abs(Math.cos(TAU * t)), 0],
      head: (t) => [0, -0.05 * Math.sin(TAU * t), -0.08 * Math.sin(TAU * t)],
      footL: (t) => [-0.35 * Math.max(0, Math.sin(TAU * t)), 0, -0.13 * Math.sin(TAU * t)],
      footR: (t) => [-0.35 * Math.max(0, -Math.sin(TAU * t)), 0, -0.13 * Math.sin(TAU * t)],
      flipperL: (t) => [0, 0, 0.35 + 0.1 * Math.sin(TAU * t)],
      flipperR: (t) => [0, 0, -0.35 + 0.1 * Math.sin(TAU * t)],
    }),
    make('idle', 5, {
      chest: (t) => [0.02 * Math.sin(TAU * t * 2), 0, 0],
      head: (t) => [0.06 * Math.sin(TAU * t), 0.45 * Math.sin(TAU * t) * smooth01(Math.abs(Math.sin(TAU * t)) * 2), 0],
      flipperL: (t) => [0, 0, 0.12 * Math.max(0, Math.sin(TAU * t * 3)) ** 6],
      flipperR: (t) => [0, 0, -0.12 * Math.max(0, Math.sin(TAU * t * 3 + 1)) ** 6],
    }),
    make('slide', 1.2, {
      body: () => [1.35, 0, 0],
      pos: (t) => [0, -H * 0.15, H * 0.1 * Math.sin(TAU * t)],
      head: () => [-0.9, 0, 0],
      flipperL: (t) => [0, 0, 0.9 + 0.25 * Math.sin(TAU * t * 2)],
      flipperR: (t) => [0, 0, -0.9 - 0.25 * Math.sin(TAU * t * 2)],
      footL: () => [-1.2, 0, 0],
      footR: () => [-1.2, 0, 0],
    }),
  ];
  void opts;
  return root;
}
