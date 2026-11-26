// Lab equipment: burners, microscopes, centrifuges, petri dishes, benches, fume hoods, goggles.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, cushion, setup, done, fin, body, frameMat, darkMat, glassMat, liquidMat, vesselGeo, liquidGeo, lamp, glowStrip, slab, rodY, rodX, rodZ, bar, labelPlane, panel, emblem, foot, hazard, canvasTex } from './common.js';
import { clip, scaleTrack, spinTrack, rotateTrack, moveTrack, pingPong, wave } from '../../core/animation.js';
import { lampTracks, LAMP_ON } from '../../core/lamps.js';

const screenDraw = (title, sub = '', col = '#22e1ff') => (c, w, h) => {
  c.fillStyle = '#071018'; c.fillRect(0, 0, w, h);
  c.fillStyle = col; c.font = `bold ${h * 0.42}px monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(title, w / 2, h * (sub ? 0.4 : 0.5));
  if (sub) { c.font = `${h * 0.22}px monospace`; c.fillStyle = '#9fe8b0'; c.fillText(sub, w / 2, h * 0.78); }
};

/* ================================ BURNERS ================================ */

export const BURNER_VARIANTS = { bunsen: {}, 'tripod-gauze': {}, 'spirit-lamp': {}, meker: {} };

function flameGeo(r, h) {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([Math.max(0.0003, r * Math.sin(Math.PI * Math.pow(t, 0.55)) * (1 - t * 0.35)), t * h]); }
  return lathe(pts, 16);
}
function flame(T, parent, y, r, h, kind = 'blue') {
  const f = group('flame', { parent, at: [0, y, 0] });
  lamp(T, f, kind, { geometry: flameGeo(r, h) });
  lamp(T, f, kind === 'blue' ? 'white' : 'amber', { geometry: flameGeo(r * 0.5, h * 0.45).translate(0, 0.0005, 0) });
  return f;
}
function bunsen(T, parent, { meker = false, at = [0, 0, 0] } = {}) {
  const g = group('bunsen', { parent, at });
  const bm = T.vintage ? fin(T, '#c9a24a', 'brass') : T.kids ? fin(T, T.p, 'plastic') : fin(T, T.trim === 'futuristic' ? '#16191f' : T.heavy ? '#2a2d33' : '#3a3f47', 'paint');
  const k = T.chunky;
  mesh(lathe([[0, 0], [0.045 * k, 0], [0.046 * k, 0.006], [0.04 * k, 0.014], [0.012, 0.022], [0, 0.024]], 32), bm, { parent: g });
  const barrel = T.vintage ? fin(T, '#c9a24a', 'brass') : M.chrome();
  const top = meker ? 0.13 : 0.15;
  rodY(0.02, top, 0.0065 * (meker ? 1 : 1), barrel, g);
  if (meker) mesh(lathe([[0.006, 0], [0.014, 0.02], [0.014, 0.03], [0.012, 0.03], [0, 0.03]], 24), barrel, { parent: g, at: [0, top - 0.002, 0] });
  // air collar + gas inlet + valve
  mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.018, 20), barrel, { parent: g, at: [0, 0.04, 0] });
  rodX(0, 0.05, 0.004, barrel, g, { y: 0.024 });
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 16).rotateZ(Math.PI / 2), fin(T, T.kids ? T.s : '#2a2d33', 'plastic'), { parent: g, at: [-0.02, 0.022, 0.03] });
  // rubber hose to the gas tap
  const hose = fin(T, T.kids ? '#ff7a1a' : T.heavy ? '#2a2d33' : '#d9762b', 'rubber');
  curveTube([[0.048, 0.024, 0], [0.09, 0.022, 0.02], [0.14, 0.008, 0.06], [0.22, 0.0055, 0.1]], 0.0055, hose, { parent: g });
  if (T.detail > 1) slab(g, fin(T, '#eef0f3', 'plastic'), 0.05, 0.03, 0.04, { x: 0.24, z: 0.1, r: 0.006 });
  if (T.trim === 'futuristic') glowStrip(T, g, [[0.045, 0.004, 0], [0, 0.004, 0.045], [-0.045, 0.004, 0], [0, 0.004, -0.045], [0.045, 0.004, 0]], 0.0018);
  if (T.wear) mesh(new THREE.CylinderGeometry(0.0068, 0.0068, 0.03, 16), M.matte('#1d1b19'), { parent: g, at: [0, top - 0.015, 0] });
  return { g, top: top + (meker ? 0.028 : 0) };
}

export function createLabBurner(options = {}) {
  const { o, variant, T } = setup(options, BURNER_VARIANTS, 'lab-burner');
  const root = group(`lab-burner-${variant}`);
  let fl;
  if (variant === 'spirit-lamp') {
    const outer = [[0.03, 0], [0.034, 0.004], [0.036, 0.03], [0.03, 0.05], [0.012, 0.062], [0.011, 0.07]];
    mesh(vesselGeo(outer, 0.002), glassMat(), { parent: root });
    mesh(liquidGeo(outer, 0.03, 0.002), liquidMat(T.vintage ? '#d9a441' : T.trim === 'futuristic' ? '#22e1ff' : '#7b5cff'), { parent: root });
    const cap = T.vintage ? fin(T, '#c9a24a', 'brass') : fin(T, '#cfd3d8', 'metal');
    mesh(lathe([[0.006, 0], [0.013, 0], [0.013, 0.012], [0.005, 0.014]], 24), cap, { parent: root, at: [0, 0.064, 0] });
    rodY(0.04, 0.085, 0.003, M.matte('#f2ead6'), root);
    fl = flame(T, root, 0.084, 0.007, 0.04, 'amber');
    if (T.vintage) { mesh(new THREE.TorusGeometry(0.036, 0.003, 8, 32).rotateX(Math.PI / 2), cap, { parent: root, at: [0, 0.03, 0] }); }
    if (T.heavy || T.detail > 1) {
      // snuffer cap resting beside
      mesh(lathe([[0, 0.03], [0.012, 0.028], [0.016, 0], [0.014, 0], [0.01, 0.026], [0, 0.028]], 20), cap, { parent: root, at: [0.06, 0, 0] });
    }
  } else {
    const { top } = bunsen(T, root, { meker: variant === 'meker' });
    fl = flame(T, root, top - 0.001, variant === 'meker' ? 0.014 : 0.008, variant === 'meker' ? 0.05 : 0.08, T.vintage ? 'amber' : 'blue');
    if (variant === 'tripod-gauze') {
      const tm = T.vintage ? fin(T, '#3a2e22', 'metal') : fin(T, '#2a2d33', 'metal');
      const H = 0.22, R = 0.065;
      mesh(new THREE.TorusGeometry(R, 0.004, 8, 40).rotateX(Math.PI / 2), tm, { parent: root, at: [0, H, 0] });
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; bar([Math.cos(a) * R, H, Math.sin(a) * R], [Math.cos(a) * R * 1.35, 0.002, Math.sin(a) * R * 1.35], 0.004, tm, root); }
      // wire gauze with ceramic centre
      slab(root, M.metal('#8d939c', 0.5), 0.13, 0.002, 0.13, { y: H + 0.004, r: 0.0009 });
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.0024, 32), M.matte('#efece4'), { parent: root, at: [0, H + 0.0052, 0] });
      // beaker heating on top
      const bo = [[0.03, 0], [0.034, 0.004], [0.034, 0.09], [0.0365, 0.094]];
      const bk = group('beaker', { parent: root, at: [0, H + 0.0064, 0] });
      mesh(vesselGeo(bo), glassMat(), { parent: bk });
      mesh(liquidGeo(bo, 0.05), liquidMat(T.kids ? '#ff4d6d' : T.trim === 'futuristic' ? '#22e1ff' : '#3fa9f5'), { parent: bk });
    }
  }
  const tracks = Object.values(T.lamps).flatMap((g) => lampTracks(g.name, LAMP_ON[g.kind] ?? 2.5, { glow: 0.8 }));
  return done(root, T, variant, o, () => [
    clip('flame', 0.6, [scaleTrack(fl, 0.6, (t) => [1 + 0.06 * wave(t, 3), 1 + 0.12 * wave(t, 2) + 0.05 * wave(t, 5), 1 + 0.06 * wave(t, 3)]), ...tracks]),
    clip('on', 1, tracks),
  ]);
}

/* =============================== MICROSCOPES =============================== */

export const MICROSCOPE_VARIANTS = { compound: {}, student: {}, stereo: {}, digital: {}, trinocular: {} };

export function createLabMicroscope(options = {}) {
  const { o, variant, T } = setup(options, MICROSCOPE_VARIANTS, 'lab-microscope', { p: '#f2f3f5', s: '#2a2d33' });
  const root = group(`lab-microscope-${variant}`);
  const bm = T.vintage ? fin(T, '#1b1a18', 'paint') : body(T);
  const metalM = T.vintage ? fin(T, '#c9a24a', 'brass') : M.chrome();
  const dk = darkMat(T);
  const k = variant === 'student' ? 0.85 : 1;
  const anims = [];
  if (T.vintage) slab(root, M.wood('walnut'), 0.24, 0.025, 0.24, { r: 0.006 });
  const y0 = T.vintage ? 0.025 : 0;
  const b = group('scope', { parent: root, at: [0, y0, 0], scale: [k, k, k] });
  if (variant === 'stereo') {
    mesh(roundedBox(0.22, 0.03, 0.26, 0.012), bm, { parent: b, at: [0, 0.015, 0] });
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.004, 40), M.matte('#ececea'), { parent: b, at: [0, 0.032, 0.02] });
    rodY(0.03, 0.34, 0.013, metalM, b, { z: -0.09 });
    const head = group('head', { parent: b, at: [0, 0.22, -0.02] });
    mesh(roundedBox(0.06, 0.05, 0.09, 0.012), bm, { parent: head, at: [0, 0, -0.03] });
    mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.06, 32), bm, { parent: head, at: [0, -0.03, 0.03] });
    mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 24), M.glass({ tint: '#22324a' }), { parent: head, at: [0, -0.062, 0.03] });
    for (const s of [-1, 1]) { const e = group(`eye${s}`, { parent: head, at: [s * 0.018, 0.04, 0.0], rot: [-0.6, 0, s * 0.12] }); mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.08, 20), dk, { parent: e }); mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 20), fin(T, '#111', 'rubber'), { parent: e, at: [0, 0.042, 0] }); }
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.014, 24).rotateZ(Math.PI / 2), dk, { parent: head, at: [s * 0.035, -0.005, -0.06] });
    lamp(T, b, 'white', { at: [0, 0.031, 0.1], normal: [0, 1, 0], w: 0.03, h: 0.012, glowSize: 0.12 });
  } else {
    // horseshoe/flat base
    const base = new THREE.Shape();
    base.moveTo(-0.09, -0.1); base.lineTo(0.09, -0.1); base.quadraticCurveTo(0.11, 0.06, 0.06, 0.1); base.lineTo(-0.06, 0.1); base.quadraticCurveTo(-0.11, 0.06, -0.09, -0.1);
    mesh(extrudeOutline(base, 0.04, { bevel: 0.01 }).rotateX(Math.PI / 2), bm, { parent: b, at: [0, 0.02, 0] });
    lamp(T, b, 'white', { at: [0, 0.04, 0.03], normal: [0, 1, 0], w: 0.026, h: 0.026, shape: 'round', glowSize: 0.1 });
    // arm (C shape)
    const arm = [[-0.02, 0], [0.02, 0], [0.025, 0.18], [0.01, 0.26], [-0.03, 0.3], [-0.06, 0.29], [-0.04, 0.24], [-0.025, 0.17]];
    mesh(extrudeOutline(arm, 0.05, { bevel: 0.008 }).rotateY(Math.PI / 2), bm, { parent: b, at: [0, 0.035, -0.07] });
    // focus knobs
    for (const s of [-1, 1]) { mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.012, 28).rotateZ(Math.PI / 2), dk, { parent: b, at: [s * 0.032, 0.1, -0.07] }); mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 20).rotateZ(Math.PI / 2), metalM, { parent: b, at: [s * 0.044, 0.1, -0.07] }); }
    // stage + clips + condenser
    const stage = group('stage', { parent: b, at: [0, 0.135, 0.0] });
    slab(stage, dk, 0.13, 0.008, 0.12, { r: 0.003 });
    slab(stage, dk, 0.03, 0.03, 0.03, { y: -0.03, z: -0.055, r: 0.004 });
    for (const s of [-1, 1]) bar([s * 0.03, 0.009, -0.03], [s * 0.025, 0.009, 0.03], 0.0015, metalM, stage);
    slab(stage, glassMat(), 0.075, 0.0012, 0.025, { y: 0.008, r: 0.0004 });
    mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.03, 24), dk, { parent: stage, at: [0, -0.015, 0] });
    rodY(-0.095, -0.03, 0.006, dk, stage);
    // nosepiece + objectives
    const nose = group('nosepiece', { parent: b, at: [0, 0.225, 0.005], rot: [0.25, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.02, 32), metalM, { parent: nose });
    const cols = ['#e53935', '#fdd835', '#1e88e5', '#f2f3f5'];
    for (let i = 0; i < (T.kids ? 3 : 4); i++) {
      const a = (i / 4) * Math.PI * 2;
      const og = group(`objective${i}`, { parent: nose, at: [Math.cos(a) * 0.018, -0.01, Math.sin(a) * 0.018], rot: [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25] });
      mesh(new THREE.CylinderGeometry(0.008, 0.0065, 0.03 + i * 0.006, 16), metalM, { parent: og, at: [0, -0.015 - i * 0.003, 0] });
      mesh(new THREE.CylinderGeometry(0.0082, 0.0082, 0.003, 16), M.matte(cols[i]), { parent: og, at: [0, -0.008, 0] });
    }
    // head + eyepieces / camera / screen
    const head = group('head', { parent: b, at: [0, 0.27, -0.02] });
    mesh(roundedBox(0.05, 0.05, 0.08, 0.014), bm, { parent: head, at: [0, 0, 0.0] });
    mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.03, 24), bm, { parent: head, at: [0, -0.035, 0.02] });
    const eyes = variant === 'student' ? [0] : [-1, 1];
    if (variant === 'digital') {
      const sc = group('screen', { parent: head, at: [0, 0.07, -0.01], rot: [-0.25, 0, 0] });
      sc.add(panel(0.15, 0.1, 0.01, (c, w, h) => {
        c.fillStyle = '#f2e8f0'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 18; i++) { const x = (i * 53) % w, y = (i * 37) % h, r = 12 + (i % 4) * 5; c.fillStyle = 'rgba(190,70,150,0.45)'; c.beginPath(); c.ellipse(x, y, r, r * 0.8, i, 0, 6.3); c.fill(); c.fillStyle = '#5b2a7a'; c.beginPath(); c.arc(x, y, r * 0.3, 0, 6.3); c.fill(); }
      }, dk, { emissive: 0.7, bg: '#c88ac0' }));
      rodY(0.025, 0.065, 0.006, dk, head, { z: -0.01 });
    } else {
      for (const s of eyes) {
        const e = group(`eye${s}`, { parent: head, at: [s * 0.016, 0.03, 0.03], rot: [-0.7, 0, 0] });
        mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.06, 20), dk, { parent: e, at: [0, 0.02, 0] });
        mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 20), fin(T, '#111', 'rubber'), { parent: e, at: [0, 0.052, 0] });
      }
      if (variant === 'trinocular') { rodY(0.02, 0.08, 0.012, dk, head, { z: -0.02 }); slab(head, dk, 0.05, 0.04, 0.05, { y: 0.08, z: -0.02, r: 0.008 }); }
    }
    anims.push(clip('focus', 2, [moveTrack(stage, 2, (t) => [0, -0.008 * pingPong(t), 0]), rotateTrack(nose, 'y', 2, (t) => (Math.PI / 2) * Math.floor(t * 4) / 1, 8)]));
  }
  if (T.trim === 'futuristic') glowStrip(T, b, [[-0.08, 0.042, 0.09], [0, 0.042, 0.1], [0.08, 0.042, 0.09]], 0.002);
  if (T.trim === 'research' || T.trim === 'industrial') emblem(b, 0.03, [0, 0.02, 0.1 + 0.0105]);
  if (T.trim === 'research' && variant !== 'digital') { const cam = group('camera', { parent: b, at: [0.05, 0.3, -0.02] }); slab(cam, dk, 0.04, 0.035, 0.04, { r: 0.006, y: -0.0175 }); rodX(-0.05, -0.02, 0.006, dk, cam); }
  return done(root, T, variant, o, anims);
}

/* =============================== CENTRIFUGES =============================== */

export const CENTRIFUGE_VARIANTS = { benchtop: { w: 0.5, h: 0.32, d: 0.6 }, micro: { w: 0.24, h: 0.13, d: 0.28, round: true }, floor: { w: 0.75, h: 0.95, d: 0.75, floor: true }, clinical: { w: 0.38, h: 0.28, d: 0.42, round: true } };

export function createLabCentrifuge(options = {}) {
  const { o, variant, T, V } = setup(options, CENTRIFUGE_VARIANTS, 'lab-centrifuge', { p: '#eef0f3', s: '#3a4250' });
  const root = group(`lab-centrifuge-${variant}`);
  const { w, h, d } = V;
  const bm = body(T);
  const dk = darkMat(T);
  // body: rounded block, bowl rim on top
  const R = Math.min(w, d) * 0.36;
  if (V.round) mesh(lathe([[0, 0], [w / 2 - 0.01, 0], [w / 2, 0.01], [w / 2, h * 0.85], [w / 2 - 0.02, h], [R + 0.01, h], [R, h - 0.004], [R, h * 0.35], [0, h * 0.35]], 48), bm, { parent: root });
  else {
    mesh(cushion(w, h, d, { radius: 0.03, bulge: 0.02 }), bm, { parent: root, at: [0, h / 2, 0] });
    mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.006, 40), dk, { parent: root, at: [0, h + 0.001, -d * 0.08] });
  }
  if (V.floor) foot(root, dk, 0, 0, 0.001, 0.001);
  const cz = V.round ? 0 : -d * 0.08;
  const topY = h + (V.round ? 0 : 0.004);
  // rotor (spins) on a spindle inside the bowl
  const rotor = group('rotor', { parent: root, at: [0, V.round ? h * 0.35 : h * 0.5, cz] });
  rodY(V.round ? 0 : -h * 0.5, 0.04, 0.008, M.metal('#9aa0a6'), rotor);
  const rr = R * 0.82;
  mesh(new THREE.CylinderGeometry(rr * 0.35, rr * 0.5, 0.05, 32), M.metal('#c9ccd2', 0.25), { parent: rotor, at: [0, 0.04, 0] });
  const n = V.round ? 12 : 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const bk = group(`bucket${i}`, { parent: rotor, at: [Math.cos(a) * rr * 0.65, 0.05, Math.sin(a) * rr * 0.65], rot: [Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6] });
    mesh(new THREE.CylinderGeometry(rr * 0.17, rr * 0.13, rr * 0.5, 16), M.metal('#b9bec6', 0.3), { parent: bk });
    mesh(new THREE.CylinderGeometry(rr * 0.1, rr * 0.1, rr * 0.2, 12), M.plastic(['#e53935', '#1e88e5', '#fdd835', '#43a047'][i % 4], 0.4), { parent: bk, at: [0, rr * 0.3, 0] });
  }
  rodX(0, rr * 0.65, 0.006, M.metal('#b9bec6', 0.3), rotor, { y: 0.05 });
  // hinged lid with window
  const lid = group('lid', { parent: root, at: [0, topY, cz - R - 0.03] });
  const lw = R * 2 + 0.06;
  if (V.round) {
    mesh(lathe([[0, 0.03], [R * 0.7, 0.028], [R + 0.02, 0.01], [R + 0.025, 0], [0, 0]], 40), bm, { parent: lid, at: [0, 0, R + 0.03] });
    mesh(new THREE.CylinderGeometry(R * 0.55, R * 0.55, 0.004, 32), glassMat({ tint: '#9fb7c9' }), { parent: lid, at: [0, 0.029, R + 0.03] });
  } else {
    mesh(cushion(lw, 0.05, lw, { radius: 0.02, bulge: 0.12 }), bm, { parent: lid, at: [0, 0.025, lw / 2] });
    mesh(new THREE.CylinderGeometry(R * 0.6, R * 0.6, 0.006, 32), glassMat({ tint: '#9fb7c9' }), { parent: lid, at: [0, 0.052, lw / 2] });
  }
  // control panel
  const pz = V.round ? w / 2 - 0.004 : d / 2;
  const pn = group('panel', { parent: root, at: [0, h * (V.round ? 0.45 : 0.55), pz], rot: [V.round ? 0 : 0, 0, 0] });
  pn.add(panel(w * 0.5, h * (V.floor ? 0.12 : 0.28), 0.01, screenDraw(T.vintage ? '3000' : '14 000', 'RPM  05:00', T.trim === 'futuristic' ? '#22e1ff' : '#7dffa0'), dk, { emissive: 0.8, bg: '#0b1a12' }));
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 20).rotateX(Math.PI / 2), T.kids ? fin(T, T.s, 'plastic') : M.plastic(s > 0 ? '#2fbf4a' : '#e53935', 0.4), { parent: pn, at: [s * w * 0.32, 0, 0.006] });
  lamp(T, pn, 'green', { at: [w * 0.32, h * 0.12, 0.006], w: 0.006, h: 0.006, shape: 'round' });
  if (V.floor) { for (const x of [-1, 1]) for (const z of [-1, 1]) foot(root, dk, x * (w / 2 - 0.06), z * (d / 2 - 0.06), 0.03, 0.03, -0.0); emblem(root, 0.06, [0, h * 0.8, d / 2 + 0.002]); }
  if (T.heavy) { const hz = labelPlane(w * 0.9, 0.03, hazard, { bg: '#f2b705' }); hz.position.set(0, 0.03, (V.round ? w / 2 : d / 2) + 0.001); root.add(hz); }
  if (T.trim === 'futuristic') glowStrip(T, root, [[-w / 2 + 0.01, h * 0.1, (V.round ? w / 2 : d / 2) + 0.002], [w / 2 - 0.01, h * 0.1, (V.round ? w / 2 : d / 2) + 0.002]], 0.003);
  if (T.detail > 1) slab(root, dk, w * 0.3, 0.04, 0.02, { x: 0, y: h - 0.05, z: (V.round ? w / 2 - 0.01 : d / 2) + 0.004, r: 0.006 });
  return done(root, T, variant, o, () => [clip('spin', 0.4, [spinTrack(rotor, 'y', 0.4)]), clip('open', 2, [rotateTrack(lid, 'x', 2, (t) => -1.2 * pingPong(t))])]);
}

/* ============================== PETRI DISHES ============================== */

export const PETRI_TRIMS = {
  'blood-agar': { agar: '#8e1022', col: ['#f1e6c8', '#d7c9a0'] },
  mould: { agar: '#e6d08a', col: ['#3a6b2c', '#e9ece6', '#2a4d7a'], fuzzy: true },
  colonies: { agar: '#efd88a', col: ['#f6f1e6', '#f3c74a', '#e46b3a'] },
  streaked: { agar: '#d9c27a', col: ['#fbf7ec'], streak: true },
  'antibiotic-discs': { agar: '#e8d69a', col: ['#f6f1e6'], discs: true },
  empty: { agar: null },
};
export const PETRI_VARIANTS = { single: {}, 'open-lid': {}, stack: {}, 'culture-tray': {} };

function petri(T, parent, at, seed, open = false, name = 'dish') {
  const g = group(name, { parent, at });
  const R = 0.045, H = 0.014, t = 0.0012;
  const prof = [[R - 0.001, 0], [R, 0.001], [R, H]];
  mesh(vesselGeo(prof, t, 48), glassMat(), { parent: g });
  if (T.agar !== null) {
    const ag = T.agar ?? '#efd88a';
    mesh(liquidGeo(prof, 0.007, t, 48), new THREE.MeshPhysicalMaterial({ name: 'agar', color: ag, roughness: 0.25, transmission: 0.25, transparent: true, opacity: 0.92, clearcoat: 1 }), { parent: g });
    const cols = T.col ?? ['#f6f1e6', '#f3c74a'];
    const rnd = (k) => { const x = Math.sin(seed * 91.7 + k * 12.9898) * 43758.5453; return x - Math.floor(x); };
    if (T.discs) for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.0008, 16), M.matte('#ffffff'), { parent: g, at: [Math.cos(a) * 0.024, 0.0072, Math.sin(a) * 0.024] }); mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.0002, 24), M.matte(ag === '#e8d69a' ? '#f6efcf' : ag), { parent: g, at: [Math.cos(a) * 0.024, 0.0071, Math.sin(a) * 0.024] }); }
    const n = T.streak ? 40 : T.fuzzy ? 7 : 22;
    for (let i = 0; i < n; i++) {
      let x, z;
      if (T.streak) { const u = i / n; x = (u - 0.5) * 0.07; z = Math.sin(u * 18) * 0.022 * (0.5 + u); }
      else { const a = rnd(i) * Math.PI * 2, d = Math.sqrt(rnd(i + 50)) * 0.036; x = Math.cos(a) * d; z = Math.sin(a) * d; }
      const s = T.fuzzy ? 0.006 + rnd(i + 9) * 0.006 : T.streak ? 0.0016 : 0.001 + rnd(i + 7) * 0.0025;
      mesh(new THREE.SphereGeometry(s, 10, 6).scale(1, T.fuzzy ? 0.45 : 0.35, 1), T.fuzzy ? M.fabric(cols[i % cols.length]) : M.plastic(cols[i % cols.length], 0.3), { parent: g, at: [x, 0.0071, z] });
    }
  }
  // lid
  const lp = [[R + 0.0025, 0], [R + 0.0025, 0.011], [R + 0.0015, 0.012]];
  const lid = vesselGeo(lp, t, 48).rotateX(Math.PI);
  if (open) mesh(lid, glassMat(), { parent: g, at: [R * 2 + 0.012, 0.012, 0], name: `${name}-lid` });
  else mesh(lid, glassMat(), { parent: g, at: [0, H + 0.0035, 0] });
  return g;
}

export function createLabPetri(options = {}) {
  const { o, variant, T } = setup(options, PETRI_VARIANTS, 'lab-petri', { agar: '#efd88a', col: ['#f6f1e6', '#f3c74a', '#e46b3a'] }, PETRI_TRIMS);
  const root = group(`lab-petri-${variant}`);
  if (variant === 'single') petri(T, root, [0, 0, 0], 1);
  else if (variant === 'open-lid') {
    petri(T, root, [0, 0, 0], 2, true);
    // inoculation loop resting across
    const lg = group('loop', { parent: root });
    bar([-0.03, 0.0015, 0.065], [0.12, 0.0015, 0.065], 0.0025, fin(T, '#2a2d33', 'plastic'), lg);
    bar([-0.06, 0.0015, 0.065], [-0.03, 0.0015, 0.065], 0.0006, M.metal('#c9ccd2'), lg);
    mesh(new THREE.TorusGeometry(0.0025, 0.0006, 6, 12).rotateX(Math.PI / 2), M.metal('#c9ccd2'), { parent: lg, at: [-0.0625, 0.0015, 0.065] });
  } else if (variant === 'stack') {
    for (let i = 0; i < 6; i++) petri(T, root, [Math.sin(i * 2.1) * 0.002, i * 0.0175, Math.cos(i * 1.7) * 0.002], i + 3, false, `dish${i}`);
    const tag = labelPlane(0.06, 0.012, (c, w, h) => { c.fillStyle = '#fff6a8'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = `${h * 0.6}px sans-serif`; c.fillText('E.coli  24h', 6, h * 0.72); }, { bg: '#fff6a8', px: 128 });
    tag.position.set(0, 0.06, 0.0476); root.add(tag);
  } else {
    // tray of dishes
    const tm = fin(T, T.vintage ? '#6b4426' : '#d9dce1', T.vintage ? 'wood' : 'plastic');
    slab(root, tm, 0.32, 0.008, 0.22, { r: 0.003 });
    for (const s of [-1, 1]) { slab(root, tm, 0.32, 0.02, 0.005, { z: s * 0.1075, r: 0.002 }); slab(root, tm, 0.005, 0.02, 0.22, { x: s * 0.1575, r: 0.002 }); }
    let k = 0;
    for (const x of [-0.1, 0, 0.1]) for (const z of [-0.05, 0.05]) petri(T, root, [x, 0.008, z], k + 10, false, `dish${k++}`);
  }
  return done(root, T, variant, o);
}

/* =============================== LAB BENCHES =============================== */

export const BENCH_VARIANTS = { island: { w: 2.4, d: 1.5, shelf: true }, wall: { w: 1.8, d: 0.75, back: true }, 'sink-bench': { w: 1.8, d: 0.75, sink: true }, 'teacher-demo': { w: 2.0, d: 0.8, demo: true } };

function gasTap(T, parent, x, y, z, rot = 0) {
  const g = group('gas-tap', { parent, at: [x, y, z], rot: [0, rot, 0] });
  const m = T.vintage ? fin(T, '#c9a24a', 'brass') : M.chrome();
  rodY(0, 0.08, 0.008, m, g);
  rodZ(0, 0.06, 0.005, m, g, { y: 0.07 });
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 6), fin(T, T.kids ? T.s : '#f2b705', 'plastic'), { parent: g, at: [0, 0.085, 0] });
  return g;
}
function cabinetRun(T, parent, w, d, h, { open = false } = {}) {
  const cm = T.vintage ? M.wood('#6b4426') : body(T, T.trim ? T.p : '#d9dde3');
  const n = Math.max(2, Math.round(w / 0.6));
  mesh(roundedBox(w - 0.04, 0.1, d - 0.08, 0.01), darkMat(T), { parent, at: [0, 0.05, -0.02] });
  mesh(roundedBox(w - 0.02, h - 0.1, d - 0.04, 0.01), cm, { parent, at: [0, 0.1 + (h - 0.1) / 2, 0] });
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (w / n) * (i + 0.5);
    const door = mesh(roundedBox(w / n - 0.02, h - 0.14, 0.02, 0.006), T.vintage ? M.wood('#7a4e2c') : fin(T, T.kids ? (i % 2 ? T.s : T.a) : T.trim === 'futuristic' ? '#262b36' : '#eef0f3', T.finish), { parent, at: [x, 0.1 + (h - 0.1) / 2, d / 2 - 0.01] });
    door.name = `door${i}`;
    rodX(-0.05, 0.05, 0.006, T.vintage ? fin(T, '#c9a24a', 'brass') : M.chrome(), parent, { y: h - 0.08, z: d / 2 + 0.008 });
    parent.children[parent.children.length - 1].position.x = x;
  }
  return cm;
}

export function createLabBench(options = {}) {
  const { o, variant, T, V } = setup(options, BENCH_VARIANTS, 'lab-bench', { p: '#d9dde3' });
  const root = group(`lab-bench-${variant}`);
  const { w, d } = V;
  const H = T.kids ? 0.76 : 0.9;
  const top = T.vintage ? M.wood('#3d2a1c') : T.heavy ? M.metal('#c9ccd2', 0.4) : T.kids ? M.plastic('#2a2d33', 0.5) : new THREE.MeshPhysicalMaterial({ name: 'epoxy', color: T.trim === 'research' ? '#f2f3f5' : '#1c1d20', roughness: 0.3, clearcoat: 0.6 });
  if (T.heavy) {
    // steel frame bench with open shelf
    for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) for (const z of [-d / 2 + 0.05, d / 2 - 0.05]) slab(root, fin(T, T.p, 'paint'), 0.05, H - 0.04, 0.05, { x, z, r: 0.005 });
    slab(root, fin(T, '#2a2d33', 'paint'), w - 0.1, 0.03, d - 0.1, { y: 0.15, r: 0.004 });
    for (const z of [-d / 2 + 0.05, d / 2 - 0.05]) slab(root, fin(T, T.p, 'paint'), w - 0.1, 0.05, 0.04, { y: H - 0.09, z, r: 0.005 });
  } else cabinetRun(T, root, w, d, H - 0.04);
  slab(root, top, w + 0.02, 0.035, d + 0.02, { y: H - 0.04, r: 0.008, name: 'worktop' });
  const ty = H - 0.005;
  if (V.shelf) {
    // central reagent shelf with uprights, service spine
    slab(root, fin(T, '#3a4250', 'paint'), w - 0.1, 0.12, 0.12, { y: ty, r: 0.01 });
    for (const x of [-w / 2 + 0.1, 0, w / 2 - 0.1]) rodY(ty + 0.12, ty + 0.9, 0.018, frameMat(T), root, { x });
    for (const y of [ty + 0.45, ty + 0.85]) slab(root, T.vintage ? M.wood('#6b4426') : glassMat({ tint: '#d8e6ec' }), w - 0.1, 0.012, 0.3, { y, r: 0.004 });
    for (let i = -3; i <= 3; i++) gasTap(T, root, i * 0.3, ty + 0.12, 0.04, 0);
    // bottles on the shelf
    const cols = ['#7a4a12', '#e9f3f6', '#2b5d2b', '#7a4a12', '#e9f3f6'];
    for (let i = 0; i < 8; i++) {
      const x = -w / 2 + 0.25 + i * ((w - 0.5) / 7);
      const bo = [[0.03, 0], [0.034, 0.004], [0.034, 0.1], [0.012, 0.14], [0.012, 0.16]];
      mesh(vesselGeo(bo, 0.002, 20), glassMat({ tint: cols[i % 5] }), { parent: root, at: [x, ty + 0.457, 0] });
      mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 16), M.plastic(['#e53935', '#1e88e5', '#fdd835', '#2a2d33'][i % 4], 0.4), { parent: root, at: [x, ty + 0.457 + 0.165, 0] });
    }
  }
  if (V.back) {
    slab(root, T.vintage ? M.wood('#6b4426') : fin(T, '#eef0f3', 'gloss'), w, 0.6, 0.03, { y: ty, z: -d / 2 + 0.015, r: 0.006 });
    slab(root, T.vintage ? M.wood('#6b4426') : fin(T, '#eef0f3', 'gloss'), w, 0.02, 0.28, { y: ty + 0.42, z: -d / 2 + 0.17, r: 0.004 });
    for (let i = -1; i <= 1; i++) gasTap(T, root, i * 0.5, ty, -d / 2 + 0.08);
    // power sockets strip
    slab(root, darkMat(T), w * 0.8, 0.06, 0.04, { y: ty + 0.12, z: -d / 2 + 0.05, r: 0.008 });
  }
  if (V.sink) {
    // inset sink basin with gooseneck faucet
    const sx = w * 0.25;
    const basin = [[0.17, -0.25], [0.2, -0.22], [0.2, 0.005], [0.21, 0.005]];
    mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.004, 32).scale(1, 1, 0.7), fin(T, '#a7adb5', 'metal'), { parent: root, at: [sx, ty + 0.001, 0.02] });
    mesh(vesselGeo(basin, 0.004, 32).scale(1, 1, 0.7), M.metal('#9aa0a6', 0.25), { parent: root, at: [sx, ty - 0.002, 0.02] });
    const f = T.vintage ? fin(T, '#c9a24a', 'brass') : M.chrome();
    curveTube([[sx, ty, -0.22], [sx, ty + 0.35, -0.22], [sx, ty + 0.42, -0.12], [sx, ty + 0.3, -0.04]], 0.012, f, { parent: root });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.05, 6), f, { parent: root, at: [sx + s * 0.1, ty + 0.025, -0.24] });
    slab(root, fin(T, '#eef0f3', 'gloss'), w, 0.4, 0.03, { y: ty, z: -d / 2 + 0.015, r: 0.006 });
    // eyewash station
    rodY(ty, ty + 0.2, 0.01, M.plastic('#2fbf4a', 0.4), root, { x: -w * 0.3, z: -d / 2 + 0.08 });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.03, 16), M.plastic('#2fbf4a', 0.4), { parent: root, at: [-w * 0.3 + s * 0.05, ty + 0.21, -d / 2 + 0.08] });
    rodX(-w * 0.3 - 0.05, -w * 0.3 + 0.05, 0.008, M.plastic('#2fbf4a', 0.4), root, { y: ty + 0.2, z: -d / 2 + 0.08 });
  }
  if (V.demo) {
    // raised teacher desk front panel with periodic poster + demo mirror stand
    if (!T.heavy) slab(root, fin(T, T.kids ? T.a : '#3a4250', 'paint'), w, 0.05, 0.02, { y: H * 0.6, z: d / 2 + 0.012, r: 0.004 });
    gasTap(T, root, -w * 0.35, ty, -0.2);
    // overhead mirror frame for demonstrations
    const fm = frameMat(T);
    for (const s of [-1, 1]) rodY(ty, ty + 0.9, 0.012, fm, root, { x: s * 0.5, z: -d / 2 + 0.06 });
    rodX(-0.5, 0.5, 0.012, fm, root, { y: ty + 0.9, z: -d / 2 + 0.06 });
    mesh(roundedBox(0.9, 0.5, 0.012, 0.005), M.chrome(), { parent: root, at: [0, ty + 0.68, -d / 2 + 0.07], rot: [0.5, 0, 0] });
    // demo apparatus: big flask on a ring stand
    const bo = [[0.05, 0], [0.056, 0.008], [0.022, 0.16], [0.022, 0.2]];
    mesh(vesselGeo(bo, 0.002), glassMat(), { parent: root, at: [0.4, ty, 0.1] });
    mesh(liquidGeo(bo, 0.07, 0.002), liquidMat(T.trim === 'futuristic' ? '#22e1ff' : '#8e24aa'), { parent: root, at: [0.4, ty, 0.1] });
  }
  if (T.trim === 'futuristic') glowStrip(T, root, [[-w / 2 + 0.02, ty - 0.02, d / 2 + 0.012], [w / 2 - 0.02, ty - 0.02, d / 2 + 0.012]], 0.004);
  if (!V.shelf && !V.demo) {
    // a microscope-free bench still gets an instrument: balance scale
    const bs = group('balance', { parent: root, at: [-w * 0.15, ty, 0.05] });
    slab(bs, fin(T, '#eef0f3', 'gloss'), 0.2, 0.06, 0.28, { r: 0.012 });
    const bp = panel(0.12, 0.03, 0.006, screenDraw('12.504 g', '', '#7dffa0'), darkMat(T), { emissive: 0.8, bg: '#0b1a12' });
    bp.position.set(0, 0.03, 0.141);
    bs.add(bp);
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.005, 32), M.chrome(), { parent: bs, at: [0, 0.064, -0.03] });
  }
  emblem(root, 0.028, [w / 2 - 0.15, H - 0.0225, d / 2 + 0.0105]);
  return done(root, T, variant, o);
}

/* =============================== FUME HOODS =============================== */

export const HOOD_VARIANTS = { standard: { w: 1.5, h: 2.4, d: 0.85 }, 'walk-in': { w: 1.8, h: 2.6, d: 1.0, walk: true }, benchtop: { w: 1.2, h: 1.25, d: 0.75, top: true }, ductless: { w: 1.2, h: 2.1, d: 0.75, filter: true } };

export function createLabFumeHood(options = {}) {
  const { o, variant, T, V } = setup(options, HOOD_VARIANTS, 'lab-fume-hood', { p: '#eef0f3' });
  const root = group(`lab-fume-hood-${variant}`);
  const { w, h, d } = V;
  const bm = body(T);
  const dk = darkMat(T);
  let y0 = 0;
  if (!V.top && !V.walk) { cabinetRun(T, root, w, d, 0.86); y0 = 0.86; slab(root, M.matte('#1c1d20', 0.4), w, 0.03, d, { y: y0, r: 0.006 }); y0 += 0.03; }
  if (V.walk) slab(root, M.matte('#2a2d33', 0.6), w, 0.04, d, { r: 0.008 }), (y0 = 0.04);
  const bh = V.top ? h : h - y0 - 0.25;
  const hood = group('hood', { parent: root, at: [0, y0, 0] });
  // side walls, back, top, airfoil sill
  for (const s of [-1, 1]) slab(hood, bm, 0.12, bh, d, { x: s * (w / 2 - 0.06), r: 0.012 });
  slab(hood, bm, w, bh, 0.06, { z: -d / 2 + 0.03, r: 0.01 });
  slab(hood, M.matte('#c9ccd2', 0.5), w - 0.24, bh - 0.3, 0.01, { y: 0.05, z: -d / 2 + 0.065, r: 0.003 });
  slab(hood, bm, w, 0.3, d, { y: bh - 0.3, r: 0.012 });
  slab(hood, M.metal('#c9ccd2', 0.3), w - 0.2, 0.025, 0.08, { y: 0.0, z: d / 2 - 0.04, r: 0.01 });
  // sash: framed glass panel that slides up ('open')
  const sash = group('sash', { parent: hood, at: [0, 0.12, d / 2 - 0.02] });
  const sh = bh - 0.45;
  slab(sash, glassMat({ tint: '#cfe3ea' }), w - 0.24, sh, 0.008, { r: 0.002 });
  slab(sash, T.vintage ? M.wood('#6b4426') : M.metal('#b9bec6', 0.3), w - 0.24, 0.05, 0.03, { r: 0.008 });
  slab(sash, T.vintage ? M.wood('#6b4426') : M.metal('#b9bec6', 0.3), w - 0.24, 0.03, 0.03, { y: sh - 0.03, r: 0.006 });
  for (const s of [-1, 1]) slab(sash, T.vintage ? M.wood('#6b4426') : M.metal('#b9bec6', 0.3), 0.02, sh, 0.022, { x: s * ((w - 0.24) / 2 - 0.01), r: 0.004 });
  // control panel + alarm + light
  const cp = group('controls', { parent: hood, at: [w / 2 - 0.06, bh * 0.55, d / 2 + 0.001] });
  cp.add(panel(0.08, 0.14, 0.008, screenDraw('0.5', 'm/s FLOW', T.trim === 'futuristic' ? '#22e1ff' : '#7dffa0'), dk, { emissive: 0.8, bg: '#0b1a12' }));
  lamp(T, cp, 'green', { at: [0, -0.09, 0.004], w: 0.01, h: 0.01, shape: 'round' });
  lamp(T, hood, 'white', { at: [0, bh - 0.305, 0], normal: [0, -1, 0], w: w * 0.6, h: 0.05, glowSize: 0.6 });
  // interior: bottles + flask
  for (let i = 0; i < 3; i++) {
    const bo = [[0.035, 0], [0.04, 0.005], [0.04, 0.14], [0.014, 0.19], [0.014, 0.21]];
    mesh(vesselGeo(bo, 0.002, 20), glassMat({ tint: i === 1 ? '#7a4a12' : '#e9f3f6' }), { parent: hood, at: [-w * 0.25 + i * 0.12, 0, -d / 2 + 0.2] });
    mesh(liquidGeo(bo, 0.09, 0.002, 20), liquidMat(['#f2d64a', '#7a2a12', '#3fa9f5'][i]), { parent: hood, at: [-w * 0.25 + i * 0.12, 0, -d / 2 + 0.2] });
  }
  // exhaust duct / filter module
  const top = y0 + bh;
  if (V.filter) slab(root, fin(T, '#3a4250', 'paint'), w * 0.8, 0.22, d * 0.8, { y: top, r: 0.02 });
  else if (!V.top) {
    mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.25, 32), M.metal('#c9ccd2', 0.4), { parent: root, at: [0, top + 0.125, -0.05] });
    for (let i = 0; i < 4; i++) mesh(new THREE.TorusGeometry(0.152, 0.008, 8, 32).rotateX(Math.PI / 2), M.metal('#9aa0a6', 0.4), { parent: root, at: [0, top + 0.04 + i * 0.05, -0.05] });
  } else mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 32), M.metal('#c9ccd2', 0.4), { parent: root, at: [0, top + 0.06, -0.05] });
  if (T.heavy) { const hz = labelPlane(w, 0.06, hazard, { bg: '#f2b705' }); hz.position.set(0, y0 + bh - 0.12, d / 2 + 0.001); root.add(hz); }
  if (T.trim === 'futuristic') glowStrip(T, hood, [[-w / 2 + 0.13, 0.03, d / 2 + 0.002], [w / 2 - 0.13, 0.03, d / 2 + 0.002]], 0.005);
  const sign = labelPlane(0.4, 0.08, (c, W, H) => { c.fillStyle = T.vintage ? '#efe2c4' : '#f2b705'; c.fillRect(0, 0, W, H); c.fillStyle = '#16171a'; c.font = `bold ${H * 0.55}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FUME HOOD', W / 2, H / 2); }, { bg: '#f2b705' });
  sign.position.set(-w * 0.2, y0 + bh - 0.15, d / 2 + 0.001); root.add(sign);
  emblem(root, 0.08, [w * 0.25, y0 + bh - 0.15, d / 2 + 0.01]);
  return done(root, T, variant, o, () => [clip('open', 3, [moveTrack(sash, 3, (t) => [0, 0.45 * pingPong(t), 0])])]);
}

/* ============================= SAFETY GOGGLES ============================= */

export const GOGGLE_VARIANTS = { splash: {}, wraparound: {}, 'face-shield': {}, 'goggle-cabinet': {} };

function goggles(T, parent, kind, at, scale = 1) {
  const g = group('goggles', { parent, at, scale: [scale, scale, scale] });
  const lensT = T.trim === 'futuristic' ? '#22e1ff' : T.heavy ? '#f2b705' : T.trim === 'weathered' ? '#c9c1a8' : '#e8f4fa';
  const lm = new THREE.MeshPhysicalMaterial({ name: 'visor', color: lensT, roughness: 0.05, transmission: 0.85, thickness: 0.002, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1 });
  const fm = fin(T, T.kids ? T.p : T.vintage ? '#5a3a22' : T.trim === 'futuristic' ? '#16191f' : '#2b7de1', T.vintage ? 'matte' : 'plastic');
  if (kind === 'face-shield') {
    mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.24, 40, 4, true, -1.2, 2.4), lm, { parent: g, at: [0, -0.1, 0] });
    mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 40, Math.PI * 0.8).rotateX(Math.PI / 2).rotateY(Math.PI * 0.4 - Math.PI / 2), fm, { parent: g, at: [0, 0.02, 0] });
    mesh(new THREE.TorusGeometry(0.09, 0.008, 8, 48).rotateX(Math.PI / 2).scale(0.85, 1, 1), fm, { parent: g, at: [0, 0.02, 0] });
    return g;
  }
  const wrap = kind === 'wraparound';
  mesh(new THREE.CylinderGeometry(0.1, 0.1, wrap ? 0.045 : 0.06, 40, 2, true, -0.9, 1.8), lm, { parent: g });
  for (const y of wrap ? [0.024] : [-0.032, 0.032]) mesh(new THREE.TorusGeometry(0.1, wrap ? 0.005 : 0.008, 8, 40, 1.8).rotateX(Math.PI / 2).rotateY(0.9 - Math.PI / 2), fm, { parent: g, at: [0, y, 0] });
  if (!wrap) {
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 12).rotateZ(Math.PI / 2), fm, { parent: g, at: [s * 0.07, 0, 0.07] });
    mesh(new THREE.TorusGeometry(0.098, 0.004, 6, 40, Math.PI * 2 - 1.8).rotateX(Math.PI / 2).rotateY(Math.PI * 1.5 - 0.9), M.fabric(T.kids ? T.a : '#2a2d33'), { parent: g });
  } else {
    for (const s of [-1, 1]) curveTube([[s * 0.075, 0.022, 0.066], [s * 0.095, 0.02, 0], [s * 0.093, 0.0, -0.08]], 0.004, fm, { parent: g });
  }
  return g;
}

export function createLabGoggles(options = {}) {
  const { o, variant, T } = setup(options, GOGGLE_VARIANTS, 'lab-goggles');
  const root = group(`lab-goggles-${variant}`);
  const stand = fin(T, T.vintage ? '#6b4426' : '#3a3f47', T.vintage ? 'wood' : 'matte');
  if (variant === 'goggle-cabinet') {
    // UV sanitising cabinet with goggles hanging inside
    const w = 0.6, h = 0.7, d = 0.3;
    for (const s of [-1, 1]) slab(root, body(T, T.trim ? T.p : '#eef0f3'), 0.02, h, d, { x: s * (w / 2 - 0.01), r: 0.005 });
    slab(root, body(T, T.trim ? T.p : '#eef0f3'), w, 0.02, d, { r: 0.005 });
    slab(root, body(T, T.trim ? T.p : '#eef0f3'), w, 0.06, d, { y: h - 0.06, r: 0.008 });
    slab(root, body(T, T.trim ? T.p : '#eef0f3'), w, h, 0.02, { z: -d / 2 + 0.01, r: 0.005 });
    slab(root, glassMat({ tint: '#d0c8ff' }), w - 0.04, h - 0.08, 0.006, { y: 0.02, z: d / 2 - 0.004, r: 0.002 });
    lamp(T, root, 'blue', { at: [0, h - 0.061, 0], normal: [0, -1, 0], w: w * 0.7, h: 0.02, glowSize: 0.5 });
    for (let r = 0; r < 2; r++) {
      rodX(-w / 2 + 0.02, w / 2 - 0.02, 0.005, M.chrome(), root, { y: 0.55 - r * 0.28, z: -0.02 });
      for (let i = 0; i < 4; i++) goggles(T, root, 'splash', [-0.21 + i * 0.14, 0.55 - r * 0.28, -0.02], 0.55);
    }
    return done(root, T, variant, o);
  }
  // head-form display stand
  mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 32), stand, { parent: root, at: [0, 0.01, 0] });
  rodY(0.02, 0.12, 0.012, stand, root);
  const head = mesh(new THREE.SphereGeometry(0.09, 32, 24).scale(0.85, 1.15, 1), M.matte(T.vintage ? '#e6d8bc' : '#f2f2f0', 0.6), { parent: root, at: [0, 0.2, 0] });
  head.name = 'head-form';
  goggles(T, root, variant, [0, 0.22, 0], 1);
  if (variant === 'face-shield') { /* visor sits on brow */ }
  return done(root, T, variant, o);
}
