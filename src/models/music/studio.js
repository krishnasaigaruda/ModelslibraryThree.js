// Studio & stage gear: microphones on stands, guitar/bass amps, speakers, mixing desks with
// LEDs, DJ turntables (spinning platters), headphones, music stands, stage lights (lamps.js),
// record players, gramophone, record crate, jukebox and boombox.
import {
  THREE, M, mesh, group, roundedBox, curveTube, lathe, tube, setup, done, fin, hwMat, woodMat, merged, segGeo, bar, plate, blob,
  labelPlane, knobGeo, grilleMat, speakerCone, canvasTex, burst, cushion, lowestPoint,
} from './common.js';
import { clip, spinTrack, rotateTrack, scaleTrack, moveTrack, wave } from '../../core/animation.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { brandEmblem } from '../../core/brand.js';

/** Cabinet covering per trim: tolex, tweed, wood, gloss, plastic… */
function cabMat(T, def = '#161618') {
  if (!T.trim) return new THREE.MeshStandardMaterial({ name: 'tolex', color: def, roughness: 0.8 });
  switch (T.trim) {
    case 'vintage': return M.fabric('#cdb88c');
    case 'sunburst': return fin(T, '#fff', 'vc');
    case 'natural': return M.wood('#c99a5b');
    case 'black': return new THREE.MeshStandardMaterial({ name: 'tolex', color: '#0c0c0d', roughness: 0.85 });
    case 'white': return new THREE.MeshStandardMaterial({ name: 'tolex_white', color: '#f1eee6', roughness: 0.6 });
    case 'neon': return fin(T, '#141418', 'gloss');
    case 'relic': return fin(T, '#4a4238', 'worn');
    case 'gold': return fin(T, '#1b1b1d', 'gloss');
    case 'kids': return fin(T, T.p, 'plastic');
    default: return fin(T, T.p);
  }
}
const sunGeo = (geo, T, rx, ry, cy = 0) => (T.burst ? burst(geo, { cx: 0, cy, rx, ry, inner: '#d38b2c', outer: '#1b0d06', start: 0.3 }) : geo);
const accentMat = (T, def = '#c9ccd2') => (T.trim === 'gold' ? hwMat(T) : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.a, 'plastic') : T.trim === 'vintage' ? M.metal('#c4c0b4', 0.3) : T.trim === 'white' ? M.chrome() : M.metal(def, 0.3));
const darkPlastic = (T) => (T.trim === 'white' ? M.plastic('#e8e6e0', 0.4) : T.kids ? fin(T, T.s, 'plastic') : M.plastic('#141416', 0.4));
const standMat = (T) => (T.trim === 'gold' ? hwMat(T) : T.trim === 'white' ? fin(T, '#f1eee6', 'gloss') : T.kids ? fin(T, T.s, 'plastic') : T.trim === 'vintage' || T.round ? M.chrome() : M.metal('#1b1c1f', 0.4));

function tripodStand(parent, T, h, { at = [0, 0, 0], spread = 0.3, r = 0.011, name = 'stand' } = {}) {
  const sm = standMat(T);
  const [x, , z] = at;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    bar([x, Math.min(0.28, h * 0.4), z], [x + Math.cos(a) * spread, 0.012, z + Math.sin(a) * spread], r * 0.7, sm, parent, `${name}_leg`);
    mesh(new THREE.SphereGeometry(0.014, 8, 6), M.rubber(), { parent, at: [x + Math.cos(a) * spread, 0.012, z + Math.sin(a) * spread] });
  }
  bar([x, Math.min(0.24, h * 0.35), z], [x, h, z], r, sm, parent, `${name}_pole`);
  return [x, h, z];
}
function roundBase(parent, T, h, { at = [0, 0, 0], r = 0.13, name = 'stand' } = {}) {
  const sm = standMat(T);
  mesh(lathe([[0, 0], [r, 0], [r, 0.012], [r * 0.85, 0.025], [0.02, 0.03], [0, 0.03]], 32), sm, { parent, at, name: `${name}_base` });
  bar([at[0], 0.025, at[2]], [at[0], h, at[2]], 0.01, sm, parent, `${name}_pole`);
  return [at[0], h, at[2]];
}

/* ================================ MICROPHONE ================================ */
export const MIC_VARIANTS = {
  'vocal-stand': { kind: 'vocal' },
  'boom-stand': { kind: 'boom' },
  condenser: { kind: 'condenser' },
  ribbon: { kind: 'ribbon' },
  podcast: { kind: 'podcast' },
};

function handheldMic(parent, T, at, dir = [0, 1, 0]) {
  const g = group('mic', { parent, at });
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize());
  const body = T.trim === 'gold' ? hwMat(T) : T.trim === 'white' ? fin(T, '#f1eee6', 'gloss') : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.p, 'plastic') : M.metal(T.round ? '#c4c0b4' : '#2a2b2e', 0.35);
  mesh(lathe([[0.0, 0], [0.012, 0.0], [0.016, 0.1], [0.021, 0.14], [0.022, 0.15], [0, 0.15]], 24), body, { parent: g, name: 'mic_handle' });
  const gm = M.metal(T.trim === 'black' ? '#1a1a1c' : '#bfc2c8', 0.4);
  const head = T.sharp ? new THREE.CylinderGeometry(0.026, 0.024, 0.05, 8).translate(0, 0.17, 0) : new THREE.SphereGeometry(0.03, 20, 14).scale(1, 0.95, 1).translate(0, 0.172, 0);
  mesh(head, gm, { parent: g, name: 'mic_grille' });
  mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.006, 20), body, { parent: g, at: [0, 0.148, 0], name: 'mic_ring' });
  return g;
}

export function createMicrophone(options = {}) {
  const { o, variant, T, V } = setup(options, MIC_VARIANTS, 'microphone');
  const root = group(`microphone-${variant}`);
  const anims = [];
  const k = T.kids ? 0.7 : 1;
  const S = group('mic_rig', { parent: root });
  S.scale.setScalar(k);
  if (V.kind === 'vocal') {
    const top = roundBase(S, T, 1.45, { r: T.round ? 0.16 : 0.13 });
    mesh(roundedBox(0.03, 0.05, 0.03, 0.008), darkPlastic(T), { parent: S, at: [0, top[1] + 0.02, 0], name: 'clip' });
    handheldMic(S, T, [0, top[1] + 0.03, 0.01], [0, 1, 0.35]);
    if (T.ornate || T.round) mesh(new THREE.TorusGeometry(0.035, 0.004, 6, 24).rotateX(Math.PI / 2), accentMat(T), { parent: S, at: [0, 0.75, 0], name: 'height_clutch' });
  } else if (V.kind === 'boom' || V.kind === 'condenser') {
    const h = V.kind === 'condenser' ? 1.25 : 1.1;
    const top = tripodStand(S, T, h, { spread: 0.32 });
    const bm = standMat(T);
    const tip = [0.45, h + 0.28, 0.05];
    bar(top, tip, 0.009, bm, S, 'boom_arm');
    bar(top, [-0.22, h - 0.14, -0.02], 0.009, bm, S, 'boom_tail');
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 16).rotateZ(Math.PI / 2 - 0.55), bm, { parent: S, at: [-0.22, h - 0.14, -0.02], name: 'counterweight' });
    mesh(new THREE.SphereGeometry(0.022, 12, 8), bm, { parent: S, at: top, name: 'boom_clutch' });
    if (V.kind === 'boom') handheldMic(S, T, tip, [0.6, -0.3, 0.6]);
    else {
      // large-diaphragm condenser in a shock mount, with pop filter
      const sh = group('shockmount', { parent: S, at: [tip[0], tip[1] - 0.12, tip[2]] });
      bar([0, 0.12, 0], [0, 0.05, 0], 0.006, bm, sh, 'mount_stem');
      mesh(new THREE.TorusGeometry(0.05, 0.004, 6, 28).rotateX(Math.PI / 2), bm, { parent: sh, at: [0, 0.05, 0], name: 'mount_ring' });
      mesh(new THREE.TorusGeometry(0.05, 0.004, 6, 28).rotateX(Math.PI / 2), bm, { parent: sh, at: [0, -0.05, 0], name: 'mount_ring2' });
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; bar([Math.cos(a) * 0.05, 0.05, Math.sin(a) * 0.05], [Math.cos(a) * 0.05, -0.05, Math.sin(a) * 0.05], 0.002, bm, sh, 'mount_rod'); }
      const bodyM = T.trim === 'gold' ? hwMat(T) : T.trim === 'white' ? fin(T, '#f1eee6', 'gloss') : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.p, 'plastic') : T.round ? M.metal('#c4c0b4', 0.25) : M.metal('#cfc6b0', 0.3);
      const capR = T.round ? 0.03 : 0.028;
      const cg = T.sharp ? roundedBox(0.056, 0.2, 0.056, 0.006) : new THREE.CapsuleGeometry(capR, 0.14, 8, 20);
      mesh(cg, bodyM, { parent: sh, at: [0, 0.0, 0], name: 'condenser_body' });
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; bar([Math.cos(a) * 0.05, 0.0, Math.sin(a) * 0.05], [Math.cos(a) * (capR + 0.001), 0.0, Math.sin(a) * (capR + 0.001)], 0.0015, M.matte('#1a1a1a'), sh, 'elastic'); }
      mesh(new THREE.CylinderGeometry(capR * 1.02, capR * 1.02, 0.07, 20, 1, true), grilleMat('#9aa0a6'), { parent: sh, at: [0, 0.06, 0], name: 'capsule_grille' });
      const em = brandEmblem(0.02); em.position.set(0, 0.0, capR + 0.0004); sh.add(em);
      // pop filter on a gooseneck
      curveTube([[tip[0] - 0.05, tip[1] - 0.02, tip[2]], [tip[0] - 0.02, tip[1] - 0.06, tip[2] + 0.06], [tip[0], tip[1] - 0.06, tip[2] + 0.12]], 0.004, bm, { parent: S, name: 'gooseneck', segments: 16 });
      bar([tip[0] - 0.05, tip[1] - 0.02, tip[2]], [tip[0] - 0.05, tip[1] - 0.02 + 0.0, tip[2] - 0.0], 0.004, bm, S);
      mesh(new THREE.TorusGeometry(0.07, 0.005, 6, 32), M.plastic('#141414', 0.4), { parent: S, at: [tip[0], tip[1] - 0.06 - 0.07, tip[2] + 0.125], name: 'pop_ring' });
      mesh(new THREE.CircleGeometry(0.07, 32), new THREE.MeshStandardMaterial({ color: '#111', transparent: true, opacity: 0.45, side: THREE.DoubleSide, roughness: 1 }), { parent: S, at: [tip[0], tip[1] - 0.06 - 0.07, tip[2] + 0.125], name: 'pop_gauze' });
    }
    if (T.neon) { const l = lampGroup('onair', 'red'); l.add(S, { at: [0, h - 0.3, 0.012], normal: [0, 0, 1], w: 0.01, h: 0.01, depth: 0.003, shape: 'round', bezel: false, glowSize: 0.08 }); anims.push(clip('on', 1, lampTracks('onair', 3))); }
  } else if (V.kind === 'ribbon') {
    // vintage ribbon mic on a short chrome desk stand on a side table
    const tm = T.trim ? woodMat(T, '#5b3a24') : M.wood('#5b3a24');
    mesh(roundedBox(0.5, 0.03, 0.4, 0.01), tm, { parent: S, at: [0, 0.715, 0], name: 'table_top' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.7, 12), tm, { parent: S, at: [sx * 0.21, 0.35, sz * 0.16], name: 'table_leg' });
    const top = roundBase(S, T, 0.73 + 0.22, { at: [0, 0.73, 0], r: 0.09 });
    S.getObjectByName('stand_base').position.y = 0.73;
    const yk = group('yoke', { parent: S, at: [0, top[1], 0] });
    const bm = standMat(T);
    curveTube([[-0.05, 0.1, 0], [-0.05, 0.0, 0], [0, -0.02, 0], [0.05, 0.0, 0], [0.05, 0.1, 0]], 0.005, bm, { parent: yk, name: 'yoke_arc', segments: 20 });
    const bodyM = T.trim === 'gold' ? hwMat(T) : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.p, 'plastic') : T.trim === 'black' ? M.metal('#1e1e22', 0.3) : M.chrome();
    const cap = T.sharp ? roundedBox(0.09, 0.15, 0.05, 0.01) : new THREE.CapsuleGeometry(0.042, 0.07, 8, 24).scale(1, 1, 0.65);
    mesh(cap, bodyM, { parent: yk, at: [0, 0.1, 0], name: 'ribbon_body' });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 12).rotateZ(Math.PI / 2), bm, { parent: yk, at: [s * 0.046, 0.1, 0], name: 'pivot' });
    const gr = [];
    for (let i = 0; i < 9; i++) gr.push(new THREE.BoxGeometry(0.06, 0.003, 0.002).toNonIndexed().translate(0, 0.06 + i * 0.01, 0.029));
    merged(gr, M.matte('#202022', 0.5), { parent: yk, name: 'ribbon_slots' });
  } else {
    // podcast: desk with a clamped spring boom arm and broadcast mic
    const tm = T.trim ? woodMat(T, '#d9b98a') : M.wood('#d9b98a');
    mesh(roundedBox(1.0, 0.035, 0.6, 0.01), tm, { parent: S, at: [0, 0.73, 0], name: 'desk_top' });
    for (const sx of [-1, 1]) mesh(roundedBox(0.04, 0.71, 0.55, 0.01), standMat(T), { parent: S, at: [sx * 0.46, 0.355, 0], name: 'desk_leg' });
    const bm = standMat(T);
    mesh(roundedBox(0.05, 0.08, 0.05, 0.006), bm, { parent: S, at: [0.4, 0.73, -0.28], name: 'clamp' });
    const j1 = [0.4, 0.78, -0.28], j2 = [0.3, 1.08, -0.15], j3 = [0.05, 1.05, 0.05];
    for (const dz of [-0.012, 0.012]) { bar(j1, [j2[0], j2[1], j2[2] + dz], 0.006, bm, S, 'arm_lower'); bar([j2[0], j2[1], j2[2] + dz], j3, 0.006, bm, S, 'arm_upper'); }
    curveTube([j1, [0.37, 0.95, -0.24], j2], 0.003, M.chrome(), { parent: S, name: 'spring', segments: 10 });
    const mic = group('broadcast_mic', { parent: S, at: j3 });
    const bodyM = T.trim === 'gold' ? hwMat(T) : T.trim === 'white' ? fin(T, '#f1eee6', 'gloss') : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.p, 'plastic') : M.metal('#1e1e22', 0.4);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 20).rotateX(0.3), bodyM, { parent: mic, at: [0, -0.06, 0.02], name: 'bc_body' });
    mesh(new THREE.SphereGeometry(0.031, 16, 12), bodyM, { parent: mic, at: [0, -0.145, 0.047], name: 'bc_cap' });
    mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.06, 20, 1, true).rotateX(0.3), grilleMat('#2a2a2e'), { parent: mic, at: [0, -0.13, 0.042], name: 'bc_grille' });
    const l = lampGroup('onair', 'red');
    mesh(roundedBox(0.16, 0.06, 0.04, 0.01), darkPlastic(T), { parent: S, at: [-0.3, 0.778, -0.2], name: 'onair_box' });
    l.add(S, { at: [-0.3, 0.778, -0.18], normal: [0, 0, 1], w: 0.12, h: 0.035, depth: 0.004, bezel: false, glowSize: 0.3 });
    anims.push(clip('on', 1, lampTracks('onair', 3)));
  }
  return done(root, 'microphone', variant, o, anims);
}

/* =================================== AMP =================================== */
export const AMP_VARIANTS = {
  combo: { W: 0.6, H: 0.48, D: 0.26, spk: [0.15], panel: 'top' },
  'half-stack': { W: 0.76, H: 0.76, D: 0.36, spk: [0.15, 0.15, 0.15, 0.15], head: true, slant: true },
  'full-stack': { W: 0.76, H: 0.76, D: 0.36, spk: [0.15, 0.15, 0.15, 0.15], head: true, two: true },
  'bass-combo': { W: 0.58, H: 0.68, D: 0.4, spk: [0.19], panel: 'top', bass: true },
  'practice-amp': { W: 0.36, H: 0.34, D: 0.2, spk: [0.1], panel: 'top', small: true },
};

function ampFrontPanel(parent, T, W, at, n = 6) {
  const g = group('amp_panel', { parent, at });
  const pm = T.trim === 'vintage' || T.round ? M.metal('#c9b07a', 0.35) : T.trim === 'gold' ? hwMat(T) : T.trim === 'white' ? M.chrome() : T.neon ? fin(T, '#1a1a1e', 'gloss') : M.plastic('#141416', 0.35);
  mesh(roundedBox(W, 0.07, 0.008, 0.003), pm, { parent: g, name: 'faceplate' });
  const kg = [];
  for (let i = 0; i < n; i++) kg.push(knobGeo(T.round ? 0.012 : 0.01, 0.016).translate(-W / 2 + 0.07 + i * ((W - 0.18) / Math.max(1, n - 1)), 0, 0.004));
  merged(kg, T.trim === 'gold' ? M.plastic('#1b1b1d', 0.3) : T.round ? M.plastic('#efe6cf', 0.3) : T.neon ? fin(T, T.p, 'neon') : M.plastic('#1a1a1a', 0.3), { parent: g, name: 'amp_knobs' });
  mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.012, 12).rotateX(Math.PI / 2), M.matte('#0a0a0a'), { parent: g, at: [-W / 2 + 0.03, 0, 0.006], name: 'input_jack' });
  const jewel = lampGroup('amp_jewel', T.neon ? 'blue' : 'red');
  jewel.add(g, { at: [W / 2 - 0.035, 0, 0.004], normal: [0, 0, 1], w: 0.016, h: 0.016, depth: 0.006, shape: 'round', glowSize: 0.12 });
  return g;
}

export function createAmp(options = {}) {
  const { o, variant, T, V } = setup(options, AMP_VARIANTS, 'amp');
  const root = group(`amp-${variant}`);
  const anims = [];
  const k = T.kids ? 0.65 : 1;
  const A = group('amp', { parent: root });
  A.scale.setScalar(k);
  const cm = cabMat(T);
  const pipe = T.trim === 'vintage' ? M.matte('#4a2a14', 0.6) : T.trim === 'white' ? M.matte('#1a1a1a', 0.5) : T.neon ? fin(T, T.p, 'neon') : M.matte('#d8d2c2', 0.5);
  const gm = grilleMat(T.trim === 'vintage' ? '#b8a07a' : T.trim === 'white' ? '#2a2a2a' : T.trim === 'relic' ? '#6a6052' : T.trim === 'gold' ? '#2a2318' : T.kids ? T.s : T.neon ? '#202024' : '#3a3630', { tweed: T.trim === 'vintage' });
  const cr = T.round ? 0.04 : T.sharp ? 0.004 : 0.015;
  const cab = (W, H, D, y, name, slant = false) => {
    const g = group(name, { parent: A, at: [0, y, 0] });
    let geo;
    if (slant) { geo = plate([[-D / 2, 0], [D / 2, 0], [D / 2, H * 0.55], [D / 2 - 0.08, H], [-D / 2, H]], W, { bevel: Math.min(0.012, cr) }); geo.rotateY(-Math.PI / 2); }
    else geo = roundedBox(W, H, D, cr).translate(0, H / 2, 0);
    sunGeo(geo, T, W * 0.6, H * 0.6, H / 2);
    mesh(geo, cm, { parent: g, name: `${name}_box` });
    return g;
  };
  const cornerSet = (W, H, D, y) => {
    if (T.round || T.kids) return;
    const cg = [];
    for (const sx of [-1, 1]) for (const sy of [0, 1]) for (const sz of [-1, 1]) cg.push(roundedBox(0.04, 0.04, 0.04, 0.008, 1).translate(sx * (W / 2 - 0.015), y + sy * H + (sy ? -0.015 : 0.015), sz * (D / 2 - 0.015)));
    merged(cg, T.trim === 'gold' ? hwMat(T) : M.metal('#b8bcc4', 0.35), { parent: A, name: 'corners' });
  };
  const speakerFront = (W, H, D, y, spk, name) => {
    const inset = 0.035;
    const fy = y + (V.panel === 'top' ? H * 0.42 : H / 2);
    const fh = V.panel === 'top' ? H * 0.72 : H - inset * 2;
    mesh(roundedBox(W - inset * 2, fh, 0.006, 0.004), gm, { parent: A, at: [0, fy, D / 2 + 0.001], name: `${name}_grille` });
    mesh(plate([[-W / 2 + inset, -fh / 2], [W / 2 - inset, -fh / 2], [W / 2 - inset, fh / 2], [-W / 2 + inset, fh / 2]], 0.008, { holes: [[[-W / 2 + inset + 0.008, -fh / 2 + 0.008], [-W / 2 + inset + 0.008, fh / 2 - 0.008], [W / 2 - inset - 0.008, fh / 2 - 0.008], [W / 2 - inset - 0.008, -fh / 2 + 0.008]]], bevel: 0.002 }), pipe, { parent: A, at: [0, fy, D / 2 + 0.003], name: `${name}_piping` });
    if (!T.kids) { const em = brandEmblem(Math.min(0.08, W * 0.12)); em.position.set(W / 2 - inset - 0.06, fy + fh / 2 - 0.05, D / 2 + 0.0052); A.add(em); }
    void spk;
  };
  const handle = (W, y, D) => {
    curveTube([[-W * 0.18, y, 0], [-W * 0.16, y + 0.03, 0], [W * 0.16, y + 0.03, 0], [W * 0.18, y, 0]], 0.012, T.round ? M.matte('#3a2414', 0.6) : M.rubber(), { parent: A, name: 'handle', segments: 16, radialSegments: 8 });
    void D;
  };
  const { W, H, D } = V;
  if (!V.head) {
    cab(W, H, D, 0, 'combo');
    speakerFront(W, H, D, 0, V.spk, 'combo');
    ampFrontPanel(A, T, W - 0.08, [0, H - 0.05, D / 2 + 0.004], V.small ? 3 : V.bass ? 5 : 6);
    handle(W, H, D);
    cornerSet(W, H, D, 0);
    if (!T.round) for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.02, 12), M.rubber(), { parent: A, at: [sx * (W / 2 - 0.05), -0.01, sz * (D / 2 - 0.05)], name: 'foot' });
    if (T.ornate) for (const sx of [-1, 1]) mesh(roundedBox(0.012, H * 0.9, 0.012, 0.004), hwMat(T), { parent: A, at: [sx * (W / 2 + 0.004), H / 2, D / 2 - 0.006], name: 'gold_strip' });
  } else {
    const cabs = V.two ? 2 : 1;
    let y = 0;
    for (let i = 0; i < cabs; i++) {
      const slant = V.slant || i === cabs - 1;
      cab(W, H, D, y, `cab_${i}`, slant && !T.sharp && cabs === 1 ? true : false);
      speakerFront(W, H, D, y, V.spk, `cab_${i}`);
      cornerSet(W, H, D, y);
      if (i === 0) for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12), M.rubber(), { parent: A, at: [sx * (W / 2 - 0.06), -0.02, sz * (D / 2 - 0.06)], name: 'caster' });
      y += H;
    }
    const hh = 0.26;
    const hd = D * 0.75;
    cab(W, hh, hd, y, 'head');
    mesh(roundedBox(W - 0.06, hh * 0.45, 0.006, 0.003), gm, { parent: A, at: [0, y + hh * 0.68, hd / 2 + 0.001], name: 'head_grille' });
    ampFrontPanel(A, T, W - 0.08, [0, y + hh * 0.26, hd / 2 + 0.004], 8);
    handle(W, y + hh, hd);
  }
  anims.push(clip('on', 1, lampTracks('amp_jewel', 3)));
  return done(root, 'amp', variant, o, anims);
}

/* ================================= SPEAKER ================================= */
export const SPEAKER_VARIANTS = {
  'pa-speaker': { kind: 'pa' },
  'studio-monitors': { kind: 'monitors' },
  'floor-wedge': { kind: 'wedge' },
  subwoofer: { kind: 'sub' },
  'line-array': { kind: 'array' },
  'hifi-tower': { kind: 'tower' },
};

export function createSpeaker(options = {}) {
  const { o, variant, T, V } = setup(options, SPEAKER_VARIANTS, 'speaker');
  const root = group(`speaker-${variant}`);
  const k = T.kids ? 0.65 : 1;
  const S = group('spk', { parent: root });
  S.scale.setScalar(k);
  const cm = T.trim ? cabMat(T) : V.kind === 'tower' || V.kind === 'monitors' ? M.wood(V.kind === 'tower' ? '#3a2416' : '#1b1b1d') : new THREE.MeshStandardMaterial({ name: 'cab_paint', color: '#1a1a1c', roughness: 0.9 });
  const cones = [];
  const box = (w, h, d, at, name, sharp = T.sharp) => { const geo = roundedBox(w, h, d, T.round ? Math.min(w, h, d) * 0.2 : sharp ? 0.004 : 0.02); sunGeo(geo, T, w * 0.6, h * 0.6); return mesh(geo, cm, { parent: S, at, name }); };
  const coneOn = (parent, r, at, name) => { const c = speakerCone(parent, r, { at, name, mat: T.neon ? fin(T, T.p, 'neon') : T.trim === 'gold' ? hwMat(T) : T.trim === 'white' ? M.matte('#e8e6e0', 0.6) : undefined }); cones.push(c); mesh(new THREE.TorusGeometry(r * 1.02, r * 0.06, 6, 32), accentMat(T, '#2a2a2e'), { parent, at: [at[0], at[1], at[2] + 0.002], name: `${name}_ring` }); return c; };
  if (V.kind === 'pa') {
    const top = tripodStand(S, T, 1.3, { spread: 0.45, r: 0.017 });
    const w = 0.4, h = 0.65, d = 0.36;
    const shape = T.sharp ? [[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]] : blob([[-w / 2, 0], [w / 2, 0], [w / 2 + 0.01, h * 0.6], [w / 2 - 0.03, h], [-w / 2 + 0.03, h], [-w / 2 - 0.01, h * 0.6]], 48);
    const g = plate(shape, d, { bevel: 0.02 });
    sunGeo(g, T, w, h * 0.6, h / 2);
    mesh(g, cm, { parent: S, at: [0, top[1] + 0.06, 0], name: 'pa_cab' });
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 16), standMat(T), { parent: S, at: [0, top[1] + 0.04, 0], name: 'pole_cup' });
    coneOn(S, 0.15, [0, top[1] + 0.06 + 0.22, d / 2 + 0.005], 'woofer');
    mesh(roundedBox(0.22, 0.1, 0.06, 0.01), M.plastic('#0e0e10', 0.4), { parent: S, at: [0, top[1] + 0.06 + 0.52, d / 2 - 0.02], name: 'horn' });
    mesh(roundedBox(w - 0.04, h - 0.06, 0.004, 0.01), grilleMat('#141414'), { parent: S, at: [0, top[1] + 0.06 + h / 2, d / 2 + 0.035], name: 'pa_grille' }).visible = !!T.wear;
    for (const s of [-1, 1]) mesh(roundedBox(0.012, 0.1, 0.06, 0.005), M.rubber(), { parent: S, at: [s * (w / 2 + 0.003), top[1] + 0.06 + h * 0.6, 0], name: 'side_handle' });
  } else if (V.kind === 'monitors') {
    for (const sx of [-1, 1]) {
      const x = sx * 0.45;
      const top = roundBase(S, T, 1.05, { at: [x, 0, 0], r: 0.16, name: `mon${sx > 0 ? 'R' : 'L'}` });
      mesh(roundedBox(0.24, 0.02, 0.24, 0.006), standMat(T), { parent: S, at: [x, top[1], 0], name: 'mon_plate' });
      const w = 0.2, h = 0.32, d = 0.26;
      box(w, h, d, [x, top[1] + 0.01 + h / 2, 0], `monitor_${sx > 0 ? 'R' : 'L'}`);
      coneOn(S, 0.075, [x, top[1] + 0.01 + h * 0.36, d / 2 + 0.003], `mon_woofer_${sx}`);
      mesh(new THREE.SphereGeometry(0.018, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), M.metal('#9aa0a6', 0.3), { parent: S, at: [x, top[1] + 0.01 + h * 0.78, d / 2], name: 'tweeter' });
      const l = lampGroup(sx > 0 ? 'mon_led' : 'mon_led_b', T.neon ? 'blue' : 'white');
      l.add(S, { at: [x, top[1] + 0.03, d / 2 + 0.001], normal: [0, 0, 1], w: 0.006, h: 0.006, depth: 0.002, shape: 'round', bezel: false, glowSize: 0.05 });
    }
  } else if (V.kind === 'wedge') {
    const w = 0.55, d = 0.45, h = 0.34;
    const g = plate([[-d / 2, 0], [d / 2, 0], [d / 2 - 0.05, h * 0.45], [-d / 2 + 0.08, h], [-d / 2, h * 0.9]], w, { bevel: 0.015 });
    g.rotateY(-Math.PI / 2);
    sunGeo(g, T, w, h);
    mesh(g, cm, { parent: S, name: 'wedge_cab' });
    const face = group('wedge_face', { parent: S, at: [0, h * 0.72, 0.075], rot: [-0.95, 0, 0] });
    coneOn(face, 0.14, [0, 0, 0.004], 'wedge_woofer');
    mesh(roundedBox(0.16, 0.06, 0.02, 0.008), M.plastic('#0e0e10', 0.4), { parent: face, at: [0.18, 0.0, 0.0], name: 'wedge_horn' });
  } else if (V.kind === 'sub') {
    const w = 0.6, h = 0.62, d = 0.65;
    box(w, h, d, [0, h / 2 + 0.03, 0], 'sub_cab');
    coneOn(S, 0.23, [0, h / 2 + 0.03, d / 2 + 0.005], 'sub_cone');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12), M.rubber(), { parent: S, at: [sx * (w / 2 - 0.06), 0.015, sz * (d / 2 - 0.06)], name: 'sub_foot' });
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 16), standMat(T), { parent: S, at: [0, h + 0.045, 0], name: 'pole_socket' });
  } else if (V.kind === 'array') {
    // ground-stacked line array on a sub with a curved column of boxes
    const sw = 0.9, sh = 0.55, sd = 0.7;
    box(sw, sh, sd, [0, sh / 2, 0], 'array_sub');
    coneOn(S, 0.2, [-0.22, sh / 2, sd / 2 + 0.005], 'array_sub_l');
    coneOn(S, 0.2, [0.22, sh / 2, sd / 2 + 0.005], 'array_sub_r');
    let y = sh, ang = 0;
    const n = T.kids ? 3 : 6;
    for (let i = 0; i < n; i++) {
      const bh = 0.24;
      const z = Math.sin(ang) * 0.0;
      const bx = box(0.85, bh, 0.5, [0, y + bh / 2, z - i * 0.012], `array_box_${i}`);
      bx.rotation.x = ang;
      mesh(roundedBox(0.8, bh * 0.75, 0.006, 0.006), grilleMat('#141414'), { parent: S, at: [0, y + bh / 2, z - i * 0.012 + 0.252 - Math.sin(ang) * 0.12], rot: [ang, 0, 0], name: `array_grille_${i}` });
      y += bh * Math.cos(ang) - 0.002;
      ang -= 0.035;
    }
    for (const sx of [-1, 1]) bar([sx * 0.43, sh, -0.1], [sx * 0.43, y, -0.1 - n * 0.012], 0.012, standMat(T), S, 'rigging');
  } else {
    // hifi floor-standing tower
    const w = 0.24, h = 1.0, d = 0.34;
    const g = T.round ? roundedBox(w, h, d, 0.08) : roundedBox(w, h, d, T.sharp ? 0.004 : 0.02);
    sunGeo(g, T, w * 0.6, h * 0.6);
    mesh(g, cm, { parent: S, at: [0, h / 2 + 0.04, 0], name: 'tower_cab' });
    for (const [r, yy] of [[0.07, 0.25], [0.07, 0.46], [0.06, 0.68]]) coneOn(S, r, [0, 0.04 + yy, d / 2 + 0.003], `tw_${yy}`);
    mesh(new THREE.SphereGeometry(0.02, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), M.metal('#d8d6d0', 0.2), { parent: S, at: [0, 0.04 + 0.86, d / 2], name: 'tweeter' });
    mesh(roundedBox(w + 0.06, 0.03, d + 0.06, 0.01), standMat(T), { parent: S, at: [0, 0.025, 0], name: 'plinth' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.ConeGeometry(0.012, 0.025, 10).rotateX(Math.PI), M.chrome(), { parent: S, at: [sx * (w / 2 + 0.01), 0.0125, sz * (d / 2 + 0.01)], name: 'spike' });
    if (!T.kids) { const em = brandEmblem(0.04); em.position.set(0, 0.04 + 0.12, d / 2 + 0.0005); S.add(em); }
  }
  const anims = [clip('pump', 0.5, cones.map((c) => scaleTrack(c, 0.5, (t) => [1, 1, 1 + 0.6 * Math.max(0, Math.sin(t * Math.PI * 2))])))];
  if (V.kind === 'monitors') anims.push(clip('on', 1, [...lampTracks('mon_led', 3), ...lampTracks('mon_led_b', 3)]));
  return done(root, 'speaker', variant, o, anims);
}

/* =============================== MIXING DESK =============================== */
export const MIXER_VARIANTS = {
  'compact-mixer': { ch: 8, W: 0.42, D: 0.36, table: true },
  'studio-console': { ch: 24, W: 1.9, D: 0.95, legs: true, bridge: true },
  'live-desk': { ch: 16, W: 1.1, D: 0.7, legs: true, screen: true },
};

export function createMixer(options = {}) {
  const { o, variant, T, V } = setup(options, MIXER_VARIANTS, 'mixer');
  const root = group(`mixer-${variant}`);
  const anims = [];
  const k = T.kids ? 0.7 : 1;
  const G = group('mixer', { parent: root });
  G.scale.setScalar(k);
  const ch = T.kids ? Math.min(V.ch, 6) : V.ch;
  const W = V.W * (T.kids ? 0.7 : 1), D = V.D;
  const bodyM = T.trim ? (T.burst ? fin(T, '#2a1406') : T.trim === 'vintage' ? fin(T, '#8a8478', 'satin') : T.trim === 'natural' ? M.wood('#c99a5b') : fin(T, T.trim === 'neon' ? '#141418' : T.p)) : new THREE.MeshStandardMaterial({ name: 'console_paint', color: '#2a2c30', roughness: 0.5, metalness: 0.3 });
  const surfM = T.trim === 'white' ? fin(T, '#e8e6e0') : T.trim === 'vintage' ? M.matte('#b8b2a2', 0.6) : M.matte('#1b1c1f', 0.6);
  const baseY = V.table ? 0.74 : 0.0;
  if (V.table) {
    const tm = T.trim ? woodMat(T, '#3b2a1e') : M.wood('#3b2a1e');
    mesh(roundedBox(W + 0.3, 0.035, D + 0.25, 0.01), tm, { parent: G, at: [0, 0.7225, 0], name: 'table_top' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.04, 0.705, 0.04, 0.008), tm, { parent: G, at: [sx * ((W + 0.3) / 2 - 0.04), 0.3525, sz * ((D + 0.25) / 2 - 0.04)], name: 'table_leg' });
  }
  // desk body: sloped wedge
  const front = V.table ? 0.05 : 0.82, back = V.table ? 0.1 : 0.95;
  const bot = V.legs ? 0.64 : 0;
  const prof = T.sharp ? [[D / 2, bot], [D / 2, front], [-D / 2, back], [-D / 2, bot]] : [[D / 2, bot], [D / 2 + 0.02, bot + (front - bot) * 0.6], [D / 2, front], [-D / 2 + 0.03, back], [-D / 2, back - 0.02], [-D / 2, bot]];
  const yOff = V.legs ? 0 : baseY;
  const bodyG = plate(prof, W, { bevel: 0.008 });
  bodyG.rotateY(-Math.PI / 2);
  mesh(bodyG, bodyM, { parent: G, at: [0, yOff, 0], name: 'desk_body' });
  if (V.legs) {
    for (const sx of [-1, 1]) mesh(roundedBox(0.12, bot, D * 0.85, 0.01), bodyM, { parent: G, at: [sx * (W / 2 - 0.08), bot / 2, -D * 0.05], name: 'pedestal' });
    mesh(roundedBox(W - 0.3, bot * 0.6, 0.02, 0.006), bodyM, { parent: G, at: [0, bot * 0.55, -D * 0.4], name: 'modesty' });
  }
  // control surface on the slope
  const slope = Math.atan2(back - front, D);
  const sg = group('surface', { parent: G, at: [0, yOff + (front + back) / 2 + 0.0, 0], rot: [slope, 0, 0] });
  const sl = D / Math.cos(slope) * 0.92;
  mesh(roundedBox(W - 0.04, 0.006, sl, 0.003), surfM, { parent: sg, at: [0, 0.003, 0], name: 'surface_plate' });
  const sw = (W - 0.08) / ch;
  const kn = [], fd = [], caps = [], btn = [];
  for (let c = 0; c < ch; c++) {
    const x = -W / 2 + 0.04 + (c + 0.5) * sw;
    for (let r = 0; r < (V.table ? 5 : 7); r++) kn.push(knobGeo(Math.min(0.009, sw * 0.28), 0.012).rotateX(-Math.PI / 2).translate(x, 0.006, -sl / 2 + 0.03 + r * sl * 0.07));
    fd.push(new THREE.BoxGeometry(0.003, 0.002, sl * 0.28).toNonIndexed().translate(x, 0.0075, sl / 2 - sl * 0.2));
    caps.push(roundedBox(Math.min(0.016, sw * 0.6), 0.012, 0.022, 0.003, 1).translate(x, 0.012, sl / 2 - sl * 0.2 + (Math.sin(c * 2.3) * sl * 0.08)));
    btn.push(roundedBox(Math.min(0.012, sw * 0.5), 0.006, 0.01, 0.002, 1).translate(x, 0.008, sl / 2 - sl * 0.4));
  }
  merged(kn, T.trim === 'gold' ? hwMat(T) : T.round ? M.plastic('#efe6cf', 0.3) : M.plastic('#5a5d63', 0.35), { parent: sg, name: 'knobs' });
  merged(fd, M.matte('#050505'), { parent: sg, name: 'fader_slots' });
  const fadersG = merged(caps, T.neon ? fin(T, T.a, 'neon') : T.kids ? fin(T, T.a, 'plastic') : M.plastic('#d8d6d0', 0.3), { parent: sg, name: 'faders' });
  merged(btn, M.plastic(T.trim === 'white' ? '#2a2a2a' : '#c9ccd2', 0.3), { parent: sg, name: 'mute_buttons' });
  // LED meters (lamps.js): green / amber / red rows
  const ledG = lampGroup('leds_green', 'green'), ledA = lampGroup('leds_amber', 'amber'), ledR = lampGroup('leds_red', 'red');
  const meterZ = sl / 2 - sl * 0.42;
  const nm = Math.min(ch, 12);
  for (let c = 0; c < nm; c++) {
    const x = -W / 2 + 0.04 + (c + 0.5) * ((W - 0.08) / nm);
    ledG.add(sg, { at: [x, 0.0065, meterZ - 0.02], normal: [0, 1, 0], w: 0.005, h: 0.005, depth: 0.0015, shape: 'round', bezel: false, glowSize: 0.03 });
    ledA.add(sg, { at: [x, 0.0065, meterZ - 0.035], normal: [0, 1, 0], w: 0.005, h: 0.005, depth: 0.0015, shape: 'round', bezel: false, glowSize: 0.03 });
    ledR.add(sg, { at: [x, 0.0065, meterZ - 0.05], normal: [0, 1, 0], w: 0.005, h: 0.005, depth: 0.0015, shape: 'round', bezel: false, glowSize: 0.03 });
  }
  if (V.bridge) {
    // meter bridge with VU meters
    const by = yOff + back + 0.0;
    mesh(roundedBox(W, 0.16, 0.12, 0.01), bodyM, { parent: G, at: [0, by + 0.08, -D / 2 + 0.06], name: 'meter_bridge' });
    for (let i = 0; i < 4; i++) { const vu = labelPlane(0.12, 0.08, (g, w, h) => { g.fillStyle = '#f2e6b8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#222'; g.lineWidth = 2; g.beginPath(); g.arc(w / 2, h * 1.1, h * 0.9, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); g.strokeStyle = '#c00'; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w * 0.62, h * 0.25); g.stroke(); }, { bg: '#f2e6b8', emissive: 0.6 }); vu.position.set(-0.45 + i * 0.3, by + 0.08, -D / 2 + 0.1205); G.add(vu); }
  }
  if (V.screen) {
    const scr = labelPlane(0.32, 0.2, (g, w, h) => { g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = i % 4 ? '#2ad17a' : '#ffb020'; g.fillRect(8 + i * 15, h - 10 - (Math.sin(i) * 0.5 + 0.5) * h * 0.7, 10, 6 + (Math.sin(i) * 0.5 + 0.5) * h * 0.7); } }, { bg: '#123a5a', emissive: 1.2 });
    mesh(roundedBox(0.36, 0.24, 0.03, 0.01), M.plastic('#141416', 0.4), { parent: G, at: [0, yOff + back + 0.12, -D / 2 + 0.06], rot: [-0.25, 0, 0], name: 'screen_bezel' });
    scr.position.set(0, yOff + back + 0.12 + 0.004, -D / 2 + 0.06 + 0.016);
    scr.rotation.x = -0.25;
    G.add(scr);
  }
  if (!T.kids) { const em = brandEmblem(0.04); em.position.set(W / 2 - 0.05, yOff + bot + (front - bot) * 0.5, D / 2 + 0.0001 + (T.sharp ? 0 : 0.008)); G.add(em); }
  anims.push(clip('on', 1, [...lampTracks('leds_green', 2.4, { blink: 4 }), ...lampTracks('leds_amber', 2.4, { blink: 2 }), ...lampTracks('leds_red', 2.6, { blink: 1 })]));
  anims.push(clip('mix', 2, [moveTrack(fadersG, 2, (t) => [0, 0, 0.01 * wave(t)])]));
  return done(root, 'mixer', variant, o, anims);
}

/* ================================= DJ GEAR ================================= */
export const DJ_VARIANTS = {
  'dj-booth': { kind: 'booth' },
  turntable: { kind: 'deck' },
  'dj-controller': { kind: 'controller' },
  'cd-deck': { kind: 'cdj' },
};

/** Vinyl record (black disc + paper label) facing up. */
function record(parent, r, at, T, name = 'record') {
  const g = group(name, { parent, at });
  mesh(new THREE.CylinderGeometry(r, r, 0.002, 48), new THREE.MeshPhysicalMaterial({ name: 'vinyl', color: T.neon ? T.p : '#0c0c0e', roughness: 0.25, clearcoat: 1, transparent: !!T.neon, opacity: T.neon ? 0.8 : 1 }), { parent: g, name: `${name}_disc` });
  const lab = labelPlane(r * 0.66, r * 0.66, (c, w, h) => { c.fillStyle = T.kids ? '#ffc81e' : '#d23a2a'; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.font = `${h * 0.12}px sans-serif`; c.textAlign = 'center'; c.fillText('SIDE A', w / 2, h * 0.35); c.fillStyle = '#111'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.03, 0, Math.PI * 2); c.fill(); }, { bg: '#d23a2a' });
  lab.geometry = new THREE.CircleGeometry(r * 0.33, 32);
  lab.rotation.x = -Math.PI / 2;
  lab.position.y = 0.0011;
  lab.name = `${name}_label`;
  g.add(lab);
  // grooves rings
  const gr = [];
  for (let i = 0; i < 6; i++) gr.push(new THREE.RingGeometry(r * (0.4 + i * 0.09), r * (0.4 + i * 0.09) + 0.0008, 48).rotateX(-Math.PI / 2).translate(0, 0.00105, 0));
  merged(gr, M.matte('#2a2a2e', 0.4), { parent: g, name: `${name}_grooves` });
  return g;
}

/** Turntable deck; returns { platter }. */
function deck(parent, T, at, name = 'deck', { s = 1 } = {}) {
  const g = group(name, { parent, at });
  const pm = T.trim ? (T.burst ? fin(T, '#fff', 'vc') : T.trim === 'natural' ? M.wood('#c99a5b') : T.trim === 'vintage' ? M.wood('#6b3a1e') : fin(T, T.trim === 'neon' ? '#141418' : T.p)) : M.metal('#b8bcc4', 0.35);
  const W = 0.45 * s, D = 0.35 * s, H = 0.1 * s;
  const geo = roundedBox(W, H, D, T.round ? 0.03 : T.sharp ? 0.004 : 0.012);
  sunGeo(geo, T, W * 0.6, D * 0.6);
  mesh(geo, pm, { parent: g, at: [0, H / 2, 0], name: `${name}_plinth` });
  const pR = 0.15 * s;
  const plat = group(`${name}_platter`, { parent: g, at: [-0.05 * s, H, 0] });
  mesh(new THREE.CylinderGeometry(pR, pR, 0.02, 48), M.metal('#9aa0a6', 0.3), { parent: plat, at: [0, 0.01, 0], name: `${name}_platter_body` });
  const dots = [];
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; dots.push(new THREE.BoxGeometry(0.004, 0.006, 0.004).toNonIndexed().translate(Math.cos(a) * pR * 1.0, 0.01, Math.sin(a) * pR * 1.0)); }
  merged(dots, M.chrome(), { parent: plat, name: `${name}_strobe` });
  mesh(new THREE.CylinderGeometry(pR * 0.98, pR * 0.98, 0.003, 48), M.matte(T.neon ? T.s : '#141414', 0.9), { parent: plat, at: [0, 0.0215, 0], name: `${name}_slipmat` });
  record(plat, pR * 0.98, [0, 0.024, 0], T, `${name}_rec`);
  mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.02, 8), M.chrome(), { parent: plat, at: [0, 0.03, 0], name: `${name}_spindle` });
  // tonearm
  const am = T.trim === 'gold' ? hwMat(T) : T.trim === 'black' ? hwMat(T) : M.chrome();
  const base = [W / 2 - 0.06 * s, H, -D / 2 + 0.08 * s];
  mesh(new THREE.CylinderGeometry(0.022 * s, 0.026 * s, 0.03 * s, 20), M.plastic('#1a1a1a', 0.4), { parent: g, at: [base[0], H + 0.015 * s, base[2]], name: `${name}_arm_base` });
  curveTube([[base[0], H + 0.035 * s, base[2]], [base[0] - 0.02 * s, H + 0.04 * s, base[2] + 0.1 * s], [base[0] - 0.08 * s, H + 0.04 * s, base[2] + 0.2 * s], [base[0] - 0.1 * s, H + 0.035 * s, base[2] + 0.22 * s]], 0.004 * s, am, { parent: g, name: `${name}_tonearm`, segments: 20 });
  mesh(roundedBox(0.012 * s, 0.006 * s, 0.03 * s, 0.002), M.plastic('#111', 0.3), { parent: g, at: [base[0] - 0.105 * s, H + 0.032 * s, base[2] + 0.235 * s], rot: [0, 0.5, 0], name: `${name}_headshell` });
  mesh(new THREE.CylinderGeometry(0.014 * s, 0.014 * s, 0.03 * s, 14).rotateX(Math.PI / 2), M.metal('#3a3a3e', 0.3), { parent: g, at: [base[0], H + 0.035 * s, base[2] - 0.03 * s], name: `${name}_counterweight` });
  bar([base[0], H + 0.035 * s, base[2]], [base[0], H + 0.035 * s, base[2] - 0.03 * s], 0.003 * s, am, g);
  // pitch fader + start button
  mesh(roundedBox(0.012 * s, 0.003, 0.11 * s, 0.002), M.matte('#050505'), { parent: g, at: [W / 2 - 0.035 * s, H + 0.0015, 0.05 * s], name: `${name}_pitch_slot` });
  mesh(roundedBox(0.02 * s, 0.01 * s, 0.012 * s, 0.003), M.plastic('#d8d6d0', 0.3), { parent: g, at: [W / 2 - 0.035 * s, H + 0.005 * s, 0.05 * s], name: `${name}_pitch` });
  mesh(roundedBox(0.04 * s, 0.008, 0.03 * s, 0.004), M.plastic('#2a2a2e', 0.3), { parent: g, at: [-W / 2 + 0.04 * s, H + 0.004, D / 2 - 0.035 * s], name: `${name}_start` });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.025 * s, 0.03 * s, 0.02 * s, 14), M.rubber(), { parent: g, at: [sx * (W / 2 - 0.04 * s), -0.01 * s, sz * (D / 2 - 0.04 * s)], name: `${name}_foot` });
  const led = lampGroup(`${name}_light`, 'white');
  led.add(g, { at: [-W / 2 + 0.02 * s, H + 0.002, -D / 2 + 0.02 * s], normal: [0, 1, 0], w: 0.01, h: 0.01, depth: 0.003, shape: 'round', glowSize: 0.06 });
  return { platter: plat, W, D, H };
}

function djTable(parent, T, W, D, H = 0.9) {
  const tm = T.trim ? (T.trim === 'neon' ? fin(T, '#141418', 'gloss') : woodMat(T, '#1b1b1d')) : M.matte('#1b1b1d', 0.6);
  const g = group('booth', { parent });
  mesh(roundedBox(W, 0.04, D, 0.01), tm, { parent: g, at: [0, H - 0.02, 0], name: 'booth_top' });
  mesh(roundedBox(W, H - 0.04, 0.03, 0.01), tm, { parent: g, at: [0, (H - 0.04) / 2, D / 2 - 0.015], name: 'booth_front' });
  for (const sx of [-1, 1]) mesh(roundedBox(0.03, H - 0.04, D, 0.01), tm, { parent: g, at: [sx * (W / 2 - 0.015), (H - 0.04) / 2, 0], name: 'booth_side' });
  if (!T.kids) { const em = brandEmblem(0.16); em.position.set(0, H * 0.55, D / 2 + 0.0005); g.add(em); }
  if (T.neon) { const l = lampGroup('booth_led', 'blue'); l.add(g, { at: [0, H * 0.15, D / 2 + 0.001], normal: [0, 0, 1], w: W * 0.8, h: 0.02, depth: 0.004, shape: 'strip', bezel: false, glowSize: W * 0.8 }); }
  return H;
}

export function createDJGear(options = {}) {
  const { o, variant, T, V } = setup(options, DJ_VARIANTS, 'dj');
  const root = group(`dj-${variant}`);
  const anims = [];
  const k = T.kids ? 0.7 : 1;
  const G = group('dj', { parent: root });
  G.scale.setScalar(k);
  const spins = [];
  const lights = [];
  if (V.kind === 'booth' || V.kind === 'deck') {
    const H = V.kind === 'booth' ? djTable(G, T, 1.5, 0.6) : djTable(G, T, 0.6, 0.48, 0.75);
    if (V.kind === 'booth') {
      for (const sx of [-1, 1]) { const d = deck(G, T, [sx * 0.46, H + 0.02, 0], `deck_${sx > 0 ? 'R' : 'L'}`); spins.push(d.platter); lights.push(`deck_${sx > 0 ? 'R' : 'L'}_light`); }
      // two-channel mixer between the decks
      const mx = group('djmixer', { parent: G, at: [0, H, 0] });
      mesh(roundedBox(0.26, 0.1, 0.34, 0.01), M.plastic('#1b1c1f', 0.4), { parent: mx, at: [0, 0.05, 0], name: 'djmixer_body' });
      const kn = [];
      for (let c = 0; c < 2; c++) for (let r = 0; r < 4; r++) kn.push(knobGeo(0.009, 0.012).rotateX(-Math.PI / 2).translate(-0.05 + c * 0.1, 0.1, -0.12 + r * 0.045));
      merged(kn, M.plastic('#c9ccd2', 0.3), { parent: mx, name: 'djmixer_knobs' });
      mesh(roundedBox(0.012, 0.012, 0.022, 0.003), M.plastic('#e8e6e0', 0.3), { parent: mx, at: [0, 0.105, 0.13], name: 'crossfader' });
      for (const c of [-1, 1]) mesh(roundedBox(0.014, 0.012, 0.022, 0.003), M.plastic('#e8e6e0', 0.3), { parent: mx, at: [c * 0.05, 0.105, 0.07], name: 'chfader' });
      const vu = lampGroup('dj_vu', T.neon ? 'blue' : 'green');
      for (let i = 0; i < 5; i++) vu.add(mx, { at: [0, 0.1, -0.12 + i * 0.03], normal: [0, 1, 0], w: 0.006, h: 0.006, depth: 0.002, shape: 'round', bezel: false, glowSize: 0.04 });
      lights.push('dj_vu');
      // laptop on a stand
      mesh(roundedBox(0.3, 0.012, 0.22, 0.004), M.metal('#9aa0a6', 0.3), { parent: G, at: [0.0, H + 0.12, -0.2], rot: [0.2, 0, 0], name: 'laptop_base' });
      bar([0, H, -0.2], [0, H + 0.11, -0.2], 0.01, M.metal('#1c1d20', 0.4), G, 'laptop_stand');
      const lid = group('laptop_lid', { parent: G, at: [0, H + 0.13, -0.31] });
      mesh(roundedBox(0.3, 0.2, 0.008, 0.004), M.metal('#9aa0a6', 0.3), { parent: lid, at: [0, 0.1, 0], name: 'laptop_screen_back' });
      const scr = labelPlane(0.28, 0.18, (c, w, h) => { c.fillStyle = '#0b0f1a'; c.fillRect(0, 0, w, h); for (const [y, col] of [[0.3, '#38c6ff'], [0.65, '#ff5ab4']]) { c.strokeStyle = col; c.beginPath(); for (let x = 0; x < w; x += 2) c.lineTo(x, h * y + Math.sin(x * 0.3) * Math.sin(x * 0.05) * h * 0.12); c.stroke(); } }, { bg: '#0b2a4a', emissive: 1.2 });
      scr.position.set(0, 0.1, 0.0045);
      lid.add(scr);
    } else {
      const d = deck(G, T, [0, H + 0.02, 0], 'deck');
      spins.push(d.platter);
      lights.push('deck_light');
    }
    if (T.neon) lights.push('booth_led');
  } else if (V.kind === 'controller' || V.kind === 'cdj') {
    const tm = T.trim ? woodMat(T, '#1b1b1d') : M.matte('#1b1b1d', 0.6);
    const ctl = V.kind === 'controller';
    const W = ctl ? 0.7 : 0.32, D = ctl ? 0.38 : 0.42;
    const H = 0.75;
    mesh(roundedBox(W + 0.3, 0.035, D + 0.25, 0.01), tm, { parent: G, at: [0, H - 0.0175, 0], name: 'table_top' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.04, H - 0.035, 0.04, 0.008), tm, { parent: G, at: [sx * ((W + 0.3) / 2 - 0.04), (H - 0.035) / 2, sz * ((D + 0.25) / 2 - 0.04)], name: 'table_leg' });
    const bm = T.trim ? (T.burst ? fin(T, '#2a1406') : fin(T, T.trim === 'neon' ? '#141418' : T.trim === 'natural' ? '#c99a5b' : T.trim === 'vintage' ? '#8a8478' : T.p)) : M.plastic('#1b1c1f', 0.35);
    const body = T.sharp ? roundedBox(W, 0.06, D, 0.004) : roundedBox(W, 0.06, D, 0.02);
    mesh(body, bm, { parent: G, at: [0, H + 0.03, 0], name: 'ctl_body' });
    const jogs = ctl ? [-0.2, 0.2] : [0];
    jogs.forEach((x, i) => {
      const jog = group(`jog_${i}`, { parent: G, at: [x, H + 0.06, ctl ? 0.03 : 0.06] });
      mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.018, 40), M.metal('#2a2b2e', 0.3), { parent: jog, at: [0, 0.009, 0], name: `jog_body_${i}` });
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.003, 40), T.neon ? fin(T, T.p, 'neon') : M.metal('#c9ccd2', 0.25), { parent: jog, at: [0, 0.0195, 0], name: `jog_top_${i}` });
      mesh(new THREE.BoxGeometry(0.004, 0.003, 0.03), M.matte('#ffffff', 0.4), { parent: jog, at: [0, 0.021, 0.03], name: `jog_mark_${i}` });
      spins.push(jog);
    });
    const pads = lampGroup('pads', T.neon ? 'blue' : 'red');
    for (const x of jogs) for (let i = 0; i < 4; i++) pads.add(G, { at: [x - 0.06 + i * 0.04, H + 0.061, D / 2 - 0.05], normal: [0, 1, 0], w: 0.03, h: 0.03, depth: 0.004, bezel: false, glowSize: 0.08 });
    lights.push('pads');
    if (ctl) { const kn = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) kn.push(knobGeo(0.009, 0.012).rotateX(-Math.PI / 2).translate(-0.03 + c * 0.06, H + 0.06, -0.13 + r * 0.045)); merged(kn, M.plastic('#c9ccd2', 0.3), { parent: G, name: 'ctl_knobs' }); mesh(roundedBox(0.012, 0.012, 0.022, 0.003), M.plastic('#e8e6e0', 0.3), { parent: G, at: [0, H + 0.066, 0.13], name: 'crossfader' }); }
    else {
      const scr = labelPlane(0.2, 0.1, (c, w, h) => { c.fillStyle = '#0b0f1a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#38c6ff'; c.beginPath(); for (let x = 0; x < w; x += 2) c.lineTo(x, h * 0.5 + Math.sin(x * 0.4) * Math.sin(x * 0.03) * h * 0.3); c.stroke(); c.fillStyle = '#fff'; c.font = `${h * 0.18}px monospace`; c.fillText('128.0 BPM', 6, h * 0.2); }, { bg: '#0b2a4a', emissive: 1.2 });
      scr.rotation.x = -Math.PI / 2;
      scr.position.set(0, H + 0.0605, -0.13);
      G.add(scr);
      mesh(new THREE.BoxGeometry(0.03, 0.005, 0.12), M.plastic('#e8e6e0', 0.3), { parent: G, at: [0.12, H + 0.062, 0.05], name: 'tempo' });
    }
  }
  anims.push(clip('spin', 1.8, spins.map((p) => spinTrack(p, 'y', 1.8, -1))));
  anims.push(clip('on', 1, lights.flatMap((l) => lampTracks(l, l === 'pads' ? 2.4 : 2.4, l === 'dj_vu' || l === 'pads' ? { blink: 2 } : {}))));
  return done(root, 'dj', variant, o, anims);
}

/* ================================ HEADPHONES ================================ */
export const HEADPHONE_VARIANTS = {
  studio: { kind: 'studio' },
  dj: { kind: 'dj' },
  'open-back': { kind: 'open' },
};

export function createHeadphones(options = {}) {
  const { o, variant, T, V } = setup(options, HEADPHONE_VARIANTS, 'headphones');
  const root = group(`headphones-${variant}`);
  const anims = [];
  const k = T.kids ? 0.8 : 1;
  const G = group('hp', { parent: root });
  G.scale.setScalar(k);
  // stand: weighted base, stem, curved saddle
  const sm = T.trim === 'natural' || T.trim === 'vintage' ? M.wood(T.trim === 'vintage' ? '#5b3a24' : '#c99a5b') : standMat(T);
  mesh(lathe([[0, 0], [0.08, 0], [0.08, 0.015], [0.06, 0.025], [0, 0.025]], 32), sm, { parent: G, name: 'hp_base' });
  bar([0, 0.02, 0], [0, 0.27, 0], 0.009, sm, G, 'hp_stem');
  mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 24, Math.PI).rotateY(Math.PI / 2), sm, { parent: G, at: [0, 0.27, 0], name: 'hp_saddle' });
  const bandM = T.trim === 'gold' ? hwMat(T) : T.trim === 'white' ? fin(T, '#f1eee6', 'gloss') : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.p, 'plastic') : T.trim === 'vintage' ? M.matte('#4a2a14', 0.5) : M.plastic('#161618', 0.35);
  const cupM = T.trim ? (T.trim === 'natural' ? M.wood('#c99a5b') : T.trim === 'vintage' ? M.wood('#6b3a1e') : T.burst ? fin(T, '#c46a2a') : T.trim === 'gold' ? fin(T, '#1b1b1d', 'gloss') : T.trim === 'relic' ? fin(T, '#3a3530', 'worn') : bandM) : M.plastic(V.kind === 'dj' ? '#1a1a1c' : '#202022', 0.35);
  const padM = T.trim === 'white' ? M.fabric('#e8e6e0') : T.kids ? fin(T, T.s, 'plastic') : M.matte('#141414', 0.55);
  // headband resting on the saddle (arc in the XY plane, cups hang at ±x)
  const R = 0.088;
  const topY = 0.27 + 0.062;
  const cy = topY - R - 0.04;
  const arc = [];
  for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); arc.push([Math.cos(a) * R * (T.sharp ? 1.05 : 1), cy + Math.sin(a) * R + (i === 8 ? 0 : 0), 0]); }
  curveTube(arc, 0.008, bandM, { parent: G, name: 'headband', segments: 40, radialSegments: 8 }).scale.set(1, 1, 2.2);
  curveTube(arc.slice(3, 14).map(([x, y, z]) => [x * 0.95, y - 0.009, z]), 0.007, padM, { parent: G, name: 'band_pad', segments: 20, radialSegments: 8 }).scale.set(1, 1, 2);
  for (const s of [-1, 1]) {
    const cup = group(`cup_${s > 0 ? 'R' : 'L'}`, { parent: G, at: [s * R, cy - 0.03, 0] });
    bar([0, 0.03, 0], [0, -0.0, 0], 0.004, M.chrome(), cup, 'slider');
    if (V.kind === 'dj') curveTube([[0, 0.0, -0.03], [s * 0.005, -0.02, -0.04], [0, -0.05, -0.035]], 0.004, bandM, { parent: cup, name: 'yoke', segments: 10 });
    const r = V.kind === 'open' ? 0.05 : 0.045;
    const cg = T.sharp ? new THREE.CylinderGeometry(r, r, 0.03, 6).rotateZ(Math.PI / 2) : T.round ? new THREE.SphereGeometry(r, 20, 12).scale(0.55, 1, 1) : new THREE.CylinderGeometry(r, r * 0.92, 0.03, 32).rotateZ(Math.PI / 2);
    mesh(cg, cupM, { parent: cup, at: [s * 0.012, -0.045, 0], name: 'cup_shell' });
    mesh(new THREE.TorusGeometry(r * 0.8, 0.012, 8, 28).rotateY(Math.PI / 2), padM, { parent: cup, at: [-s * 0.007, -0.045, 0], name: 'ear_pad' });
    if (V.kind === 'open') mesh(new THREE.CircleGeometry(r * 0.8, 28).rotateY(s * Math.PI / 2), grilleMat('#7a7d83'), { parent: cup, at: [s * 0.0275, -0.045, 0], name: 'open_grille' });
    else if (!T.kids) { const em = brandEmblem(0.035); em.position.set(s * 0.0273, -0.045, 0); em.rotation.y = s * Math.PI / 2; cup.add(em); }
  }
  curveTube([[-R - 0.01, cy - 0.09, 0], [-R - 0.03, 0.15, 0.02], [-0.05, 0.03, 0.06], [0.06, 0.0045, 0.12], [0.16, 0.0045, 0.12]], 0.0025, M.matte('#111', 0.5), { parent: G, name: 'cable', segments: 32 });
  if (T.neon) { const l = lampGroup('hp_led', 'blue'); l.add(G, { at: [R + 0.04, cy - 0.075, 0], normal: [1, 0, 0], w: 0.01, h: 0.01, depth: 0.002, shape: 'round', bezel: false, glowSize: 0.06 }); anims.push(clip('on', 1, lampTracks('hp_led', 3))); }
  return done(root, 'headphones', variant, o, anims);
}

/* =============================== MUSIC STAND =============================== */
export const MUSICSTAND_VARIANTS = {
  'wire-folding': { kind: 'wire' },
  orchestral: { kind: 'solid' },
  'conductor-podium': { kind: 'podium' },
};

function sheetMusic(w, h) {
  const p = labelPlane(w, h, (c, W, H) => { c.fillStyle = '#fbf8ef'; c.fillRect(0, 0, W, H); c.strokeStyle = '#222'; c.lineWidth = 1; for (let s = 0; s < 7; s++) { const y0 = 24 + s * (H - 30) / 7; for (let l = 0; l < 5; l++) { c.beginPath(); c.moveTo(10, y0 + l * 4); c.lineTo(W - 10, y0 + l * 4); c.stroke(); } c.fillStyle = '#111'; for (let n = 0; n < 9; n++) { const x = 30 + n * (W - 40) / 9; const y = y0 + ((n * 7 + s * 3) % 9) * 2; c.beginPath(); c.ellipse(x, y, 3, 2.2, -0.4, 0, Math.PI * 2); c.fill(); c.fillRect(x + 2, y - 14, 1, 14); } } c.font = 'bold 14px serif'; c.fillText('Étude No. 3', W / 2 - 40, 14); }, { bg: '#fbf8ef', px: 200 });
  return p;
}

export function createMusicStand(options = {}) {
  const { o, variant, T, V } = setup(options, MUSICSTAND_VARIANTS, 'music-stand');
  const root = group(`music-stand-${variant}`);
  const k = T.kids ? 0.75 : 1;
  const G = group('ms', { parent: root });
  G.scale.setScalar(k);
  const sm = standMat(T);
  const deskTilt = -0.32;
  let deskY = 1.15, baseZ = 0;
  if (V.kind === 'podium') {
    const pm = T.trim ? (T.trim === 'gold' ? fin(T, '#3a1010', 'gloss') : woodMat(T, '#3b2a1e')) : M.wood('#3b2a1e');
    const pw = 1.0, ph = 0.22;
    mesh(roundedBox(pw, ph, pw, 0.02), pm, { parent: G, at: [0, ph / 2, 0], name: 'podium' });
    mesh(roundedBox(pw - 0.06, 0.012, pw - 0.06, 0.004), M.fabric(T.trim === 'gold' ? '#7a1022' : '#2a2a2a'), { parent: G, at: [0, ph + 0.006, 0], name: 'podium_carpet' });
    // rail behind
    const rm = T.trim === 'gold' ? hwMat(T) : M.chrome();
    for (const x of [-0.4, 0.4]) bar([x, ph, -0.4], [x, ph + 0.8, -0.4], 0.015, rm, G, 'rail_post');
    curveTube([[-0.4, ph + 0.8, -0.4], [-0.4, ph + 0.8, -0.45], [0, ph + 0.8, -0.47], [0.4, ph + 0.8, -0.45], [0.4, ph + 0.8, -0.4]], 0.016, rm, { parent: G, name: 'rail', segments: 20 });
    baseZ = 0.75;
    deskY = 1.2;
  }
  if (V.kind === 'wire' || V.kind === 'podium') {
    const st = tripodStand(G, T, deskY - 0.05, { at: [0, 0, baseZ], spread: 0.28, r: 0.008 });
    void st;
  } else {
    // orchestral: weighted round base + thick tube
    mesh(lathe([[0, 0], [0.22, 0], [0.22, 0.015], [0.18, 0.03], [0.02, 0.035], [0, 0.035]], 36), sm, { parent: G, at: [0, 0, baseZ], name: 'ms_base' });
    bar([0, 0.03, baseZ], [0, deskY - 0.05, baseZ], 0.014, sm, G, 'ms_pole');
  }
  const desk = group('desk', { parent: G, at: [0, deskY, baseZ], rot: [deskTilt, 0, 0] });
  mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.06, 12), sm, { parent: G, at: [0, deskY - 0.04, baseZ], name: 'tilt_knuckle' });
  const W = 0.5, H = 0.34;
  if (V.kind === 'wire') {
    const wg = [];
    for (let i = 0; i <= 6; i++) { const x = -W / 2 + (i * W) / 6; wg.push(segGeo([x, -H / 2 + 0.03, 0], [x * 0.9, H / 2, 0], 0.0025, 5)); }
    for (const y of [-H / 2 + 0.03, 0, H / 2]) wg.push(segGeo([-W / 2, y, 0], [W / 2, y, 0], 0.003, 5));
    wg.push(segGeo([0, -H / 2 + 0.03, 0], [0, -H / 2 + 0.03, 0.03], 0.003, 5));
    for (const x of [-W / 2, W / 2]) wg.push(segGeo([x, -H / 2 + 0.03, 0.0], [x, -H / 2 + 0.03, 0.035], 0.003, 5));
    wg.push(segGeo([-W / 2, -H / 2 + 0.03, 0.035], [W / 2, -H / 2 + 0.03, 0.035], 0.003, 5));
    merged(wg, sm, { parent: desk, name: 'wire_desk' });
    bar([0, -0.06, 0], [0, -H / 2 + 0.03, 0], 0.006, sm, desk);
    const sheet = sheetMusic(0.3, 0.32);
    sheet.position.set(0, 0.02, 0.006);
    desk.add(sheet);
  } else {
    const dm = T.trim ? (T.trim === 'natural' || T.trim === 'vintage' || T.trim === 'sunburst' ? woodMat(T, '#5b3a24') : T.trim === 'gold' ? hwMat(T) : fin(T, T.trim === 'neon' ? T.p : T.p)) : M.matte('#141416', 0.5);
    const outline = T.round ? blob([[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2 - 0.05], [0, H / 2 + 0.05], [-W / 2, H / 2 - 0.05]], 48) : T.sharp ? [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2 + 0.03, H / 2], [-W / 2 - 0.03, H / 2]] : [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]];
    const holes = T.ornate ? [Array.from({ length: 20 }, (_, i) => [Math.cos((i / 20) * Math.PI * 2) * 0.04, -0.08 + Math.sin((i / 20) * Math.PI * 2) * 0.04])] : [];
    mesh(plate(outline, 0.006, { holes, bevel: 0.002 }), dm, { parent: desk, name: 'desk_plate' });
    mesh(roundedBox(W, 0.012, 0.05, 0.004), dm, { parent: desk, at: [0, -H / 2 + 0.006, 0.024], name: 'desk_lip' });
    const sheet = sheetMusic(0.28, 0.3);
    sheet.position.set(0.06, 0.02, 0.0035);
    desk.add(sheet);
    const sheet2 = sheetMusic(0.28, 0.3);
    sheet2.position.set(-0.13, 0.02, 0.0034);
    sheet2.rotation.z = 0.02;
    desk.add(sheet2);
    if (T.neon) { const l = lampGroup('stand_light', 'white'); mesh(roundedBox(0.2, 0.025, 0.03, 0.008), M.plastic('#111', 0.4), { parent: desk, at: [0, H / 2 + 0.012, 0.03], name: 'clip_light' }); l.add(desk, { at: [0, H / 2 + 0.0, 0.046], normal: [0, -0.4, 1], w: 0.16, h: 0.012, depth: 0.003, shape: 'strip', bezel: false, glowSize: 0.3 }); }
  }
  const anims = T.neon && V.kind !== 'wire' ? [clip('on', 1, lampTracks('stand_light', 3))] : [];
  return done(root, 'music-stand', variant, o, anims);
}

/* =============================== STAGE LIGHT =============================== */
export const STAGELIGHT_VARIANTS = {
  'par-can': { kind: 'par' },
  'moving-head': { kind: 'moving' },
  'light-truss': { kind: 'truss' },
  'follow-spot': { kind: 'spot' },
  'led-bar': { kind: 'bar' },
};

function parCan(parent, T, at, name, kind, { r = 0.1, len = 0.26, tilt = 0.6, yoke = true } = {}) {
  const g = group(`${name}_fix`, { parent, at });
  const hm = T.trim === 'gold' ? hwMat(T) : T.trim === 'white' ? fin(T, '#f1eee6', 'gloss') : T.neon ? fin(T, '#141418', 'gloss') : T.kids ? fin(T, T.p, 'plastic') : T.trim === 'vintage' || T.round ? M.chrome() : M.metal('#1b1c1f', 0.45);
  const head = group(`${name}_head`, { parent: g, rot: [tilt, 0, 0] });
  const sh = T.round ? lathe([[0.02, -len / 2], [r * 0.7, -len / 2 + 0.02], [r, -len * 0.1], [r, len / 2], [r * 0.95, len / 2]], 28) : lathe([[0.02, -len / 2], [r * 0.9, -len / 2], [r, -len / 2 + 0.03], [r, len / 2], [r * 0.95, len / 2]], T.sharp ? 8 : 28);
  sh.rotateX(Math.PI / 2);
  mesh(sh, hm, { parent: head, name: `${name}_housing` }).material.side = THREE.DoubleSide;
  const lg = lampGroup(name, kind);
  lg.add(head, { at: [0, 0, len / 2 - 0.012], normal: [0, 0, 1], w: r * 1.7, h: r * 1.7, depth: 0.012, shape: 'round', bezel: false, glowSize: r * 7 });
  if (yoke) {
    curveTube([[-r - 0.02, 0, 0], [-r - 0.02, -r - 0.04, 0], [r + 0.02, -r - 0.04, 0], [r + 0.02, 0, 0]], 0.008, hm, { parent: g, name: `${name}_yoke`, segments: 16 });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.026, 12).rotateZ(Math.PI / 2), hm, { parent: g, at: [s * (r + 0.01), 0, 0], name: `${name}_knob` });
  }
  return g;
}

export function createStageLight(options = {}) {
  const { o, variant, T, V } = setup(options, STAGELIGHT_VARIANTS, 'stage-light');
  const root = group(`stage-light-${variant}`);
  const anims = [];
  const k = T.kids ? 0.7 : 1;
  const G = group('sl', { parent: root });
  G.scale.setScalar(k);
  const kinds = T.neon ? ['blue', 'red', 'green', 'amber'] : T.trim === 'gold' || T.round ? ['amber'] : T.trim === 'white' ? ['white'] : ['red', 'blue', 'amber', 'white'];
  const names = [];
  const sm = standMat(T);
  if (V.kind === 'par') {
    // T-bar lighting stand with four par cans
    const top = tripodStand(G, T, 2.0, { spread: 0.5, r: 0.018 });
    bar([-0.6, top[1], 0], [0.6, top[1], 0], 0.018, sm, G, 'tbar');
    const n = T.kids ? 2 : 4;
    for (let i = 0; i < n; i++) {
      const x = -0.45 + (i * 0.9) / (n - 1);
      const nm = `par_${i}`;
      const fx = parCan(G, T, [x, top[1] - 0.15, 0.0], nm, kinds[i % kinds.length], { tilt: 0.5 });
      bar([x, top[1] - 0.15 + 0.0, 0], [x, top[1] - 0.018, 0], 0.008, sm, G, 'clamp_stem');
      mesh(roundedBox(0.05, 0.04, 0.05, 0.006), sm, { parent: G, at: [x, top[1], 0], name: 'clamp' });
      void fx;
      names.push(nm);
    }
  } else if (V.kind === 'moving') {
    const base = group('mh_base', { parent: G });
    const hm = T.trim === 'gold' ? hwMat(T) : T.trim === 'white' ? fin(T, '#f1eee6', 'gloss') : T.kids ? fin(T, T.p, 'plastic') : M.plastic('#1b1c1f', 0.4);
    mesh(roundedBox(0.36, 0.14, 0.3, T.round ? 0.05 : 0.02), hm, { parent: base, at: [0, 0.07, 0], name: 'mh_body' });
    const scr = labelPlane(0.06, 0.03, (c, w, h) => { c.fillStyle = '#021'; c.fillRect(0, 0, w, h); c.fillStyle = '#3f9'; c.font = `${h * 0.6}px monospace`; c.fillText('A001', 4, h * 0.75); }, { bg: '#063', emissive: 1.2 });
    scr.position.set(0.1, 0.07, 0.1505);
    base.add(scr);
    const pan = group('mh_pan', { parent: G, at: [0, 0.14, 0] });
    mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 24), hm, { parent: pan, at: [0, 0.015, 0], name: 'mh_turntable' });
    for (const s of [-1, 1]) mesh(roundedBox(0.04, 0.26, 0.12, 0.015), hm, { parent: pan, at: [s * 0.15, 0.15, 0], name: 'mh_arm' });
    mesh(roundedBox(0.34, 0.04, 0.12, 0.015), hm, { parent: pan, at: [0, 0.035, 0], name: 'mh_crossbar' });
    const tilt = group('mh_tilt', { parent: pan, at: [0, 0.22, 0] });
    const headG = T.sharp ? roundedBox(0.22, 0.22, 0.28, 0.02) : new THREE.CylinderGeometry(0.11, 0.12, 0.28, 28).rotateX(Math.PI / 2);
    mesh(headG, hm, { parent: tilt, name: 'mh_head' });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 12).rotateZ(Math.PI / 2), M.metal('#9aa0a6', 0.3), { parent: tilt, at: [s * 0.125, 0, 0], name: 'mh_axle' });
    const lg = lampGroup('mh_beam', kinds[0]);
    lg.add(tilt, { at: [0, 0, 0.14], normal: [0, 0, 1], w: 0.16, h: 0.16, depth: 0.01, shape: 'round', bezel: false, glowSize: 1.0 });
    names.push('mh_beam');
    tilt.rotation.x = -0.5;
    anims.push(clip('sweep', 4, [rotateTrack(pan, 'y', 4, (t) => 0.9 * Math.sin(t * Math.PI * 2), 32), rotateTrack(tilt, 'x', 4, (t) => 0.35 * Math.sin(t * Math.PI * 4), 32)]));
  } else if (V.kind === 'truss') {
    // goal-post box truss on two towers with cans hanging under the span
    const span = T.kids ? 1.6 : 3.0, H = T.kids ? 1.6 : 2.6, s = 0.29;
    const tm = T.trim === 'black' ? M.metal('#1b1c1f', 0.4) : T.trim === 'gold' ? hwMat(T) : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.p, 'plastic') : M.metal('#c9ccd2', 0.3);
    const tr = [];
    const chord = (a, b) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.25); for (let i = 0; i < n; i++) { const p = (t) => a.map((v, j) => v + (b[j] - v) * t); tr.push(segGeo(p(i / n), p((i + 1) / n), 0.024, 8)); } };
    const lace = (a, b) => tr.push(segGeo(a, b, 0.009, 6));
    const tower = (x) => {
      const c = [[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]];
      for (const [dx, dz] of c) chord([x + dx, 0.03, dz], [x + dx, H, dz]);
      for (let y = 0.03; y < H - 0.2; y += s) for (let i = 0; i < 4; i++) { const [ax, az] = c[i], [bx, bz] = c[(i + 1) % 4]; lace([x + ax, y, az], [x + bx, y + s, bz]); }
      tr.push(roundedBox(0.6, 0.03, 0.6, 0.01).translate(x, 0.015, 0));
    };
    tower(-span / 2); merged(tr.splice(0), tm, { parent: G, name: 'truss_tower_l' }); tower(span / 2); merged(tr.splice(0), tm, { parent: G, name: 'truss_tower_r' });
    const ys = [H - s, H];
    for (const y of ys) for (const z of [-s / 2, s / 2]) chord([-span / 2, y, z], [span / 2, y, z]);
    merged(tr.splice(0), tm, { parent: G, name: 'truss_chords' });
    for (let x = -span / 2; x < span / 2 - 0.01; x += s) for (const z of [-s / 2, s / 2]) lace([x, H - s, z], [x + s, H, z]);
    for (let x = -span / 2; x <= span / 2 + 0.01; x += s) lace([x, H - s, -s / 2], [x, H - s, s / 2]);
    merged(tr, tm, { parent: G, name: 'truss' });
    const n = T.kids ? 2 : 5;
    for (let i = 0; i < n; i++) {
      const x = -span / 2 + 0.4 + (i * (span - 0.8)) / (n - 1);
      const nm = `truss_par_${i}`;
      bar([x, H - s, -s / 2], [x, H - s, s / 2], 0.012, M.metal('#1b1c1f', 0.4), G, 'clamp_bar');
      bar([x, H - s, 0], [x, H - s - 0.14, 0], 0.008, M.metal('#1b1c1f', 0.4), G, 'hang_clamp');
      parCan(G, T, [x, H - s - 0.16, 0], nm, kinds[i % kinds.length], { tilt: 1.0 });
      names.push(nm);
    }
  } else if (V.kind === 'spot') {
    const top = tripodStand(G, T, 1.35, { spread: 0.45, r: 0.02 });
    const yk = group('spot_yoke', { parent: G, at: [0, top[1], 0] });
    curveTube([[-0.14, 0.18, 0], [-0.14, 0.0, 0], [0.14, 0.0, 0], [0.14, 0.18, 0]], 0.012, sm, { parent: yk, name: 'spot_fork', segments: 16 });
    const body = group('spot_body', { parent: yk, at: [0, 0.18, 0], rot: [-0.15, 0, 0] });
    const hm = T.trim === 'gold' ? hwMat(T) : T.trim === 'white' ? fin(T, '#f1eee6', 'gloss') : T.neon ? fin(T, '#141418', 'gloss') : T.kids ? fin(T, T.p, 'plastic') : M.metal('#1b1c1f', 0.45);
    const len = 0.9;
    mesh(T.sharp ? roundedBox(0.22, 0.22, len, 0.01) : new THREE.CylinderGeometry(0.1, 0.12, len, 28).rotateX(Math.PI / 2), hm, { parent: body, name: 'spot_tube' });
    mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 28).rotateX(Math.PI / 2), hm, { parent: body, at: [0, 0, len / 2 - 0.03], name: 'spot_lens_ring' });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 12).rotateZ(Math.PI / 2), M.metal('#9aa0a6', 0.3), { parent: body, at: [s * 0.13, 0, 0], name: 'spot_trunnion' });
    curveTube([[0, 0.1, -len / 2 + 0.05], [0, 0.18, -len / 2 + 0.05], [0, 0.18, -len / 2 - 0.15], [0, 0.0, -len / 2 - 0.2]], 0.012, M.rubber(), { parent: body, name: 'spot_handle', segments: 16 });
    const lg = lampGroup('spot_beam', 'white');
    lg.add(body, { at: [0, 0, len / 2 + 0.01], normal: [0, 0, 1], w: 0.2, h: 0.2, depth: 0.01, shape: 'round', bezel: false, glowSize: 1.2 });
    names.push('spot_beam');
    if (T.round || T.ornate) for (let i = 0; i < 4; i++) mesh(new THREE.TorusGeometry(0.105, 0.006, 6, 24), hwMat(T), { parent: body, at: [0, 0, -0.3 + i * 0.15], name: 'cooling_fin' });
  } else {
    // LED bar on a short pole stand
    const top = tripodStand(G, T, 1.6, { spread: 0.4, r: 0.016 });
    const hm = T.trim === 'gold' ? hwMat(T) : T.trim === 'white' ? fin(T, '#f1eee6', 'gloss') : T.kids ? fin(T, T.p, 'plastic') : M.metal('#1b1c1f', 0.45);
    const bg = group('bar_head', { parent: G, at: [0, top[1] + 0.07, 0], rot: [-0.3, 0, 0] });
    const n = T.kids ? 6 : 12;
    const W = n * 0.07 + 0.04;
    mesh(roundedBox(W, 0.1, 0.09, T.sharp ? 0.004 : 0.02), hm, { parent: bg, name: 'bar_housing' });
    curveTube([[-0.08, 0.0, 0], [-0.08, -0.08, 0], [0.08, -0.08, 0], [0.08, 0.0, 0]], 0.008, hm, { parent: bg, name: 'bar_bracket', segments: 10 });
    bar([0, -0.08, 0], [0, -0.08 - 0.03, 0.0], 0.012, sm, bg, 'bar_spigot');
    for (let i = 0; i < n; i++) {
      const nm = i % 2 ? 'bar_leds_b' : 'bar_leds_a';
      if (i < 2) names.push(nm);
      const lg = i < 2 ? lampGroup(nm, kinds[i % kinds.length]) : null;
      (lg ?? bg.userData[nm]).add(bg, { at: [-W / 2 + 0.055 + i * 0.07, 0, 0.046], normal: [0, 0, 1], w: 0.045, h: 0.045, depth: 0.006, shape: 'round', bezel: false, glowSize: 0.25 });
      if (lg) bg.userData[nm] = lg;
    }
    delete bg.userData.bar_leds_a; delete bg.userData.bar_leds_b;
  }
  anims.unshift(clip('on', 1, names.flatMap((n) => lampTracks(n, 3.5))));
  anims.push(clip('chase', 1, names.flatMap((n, i) => lampTracks(n, 3.5, { blink: 1 + (i % 3) }))));
  return done(root, 'stage-light', variant, o, anims);
}

/* =============================== VINYL & PLAYERS =============================== */
export const VINYL_VARIANTS = {
  'record-player': { kind: 'suitcase' },
  'hifi-turntable': { kind: 'hifi' },
  gramophone: { kind: 'gramophone' },
  'record-crate': { kind: 'crate' },
  jukebox: { kind: 'jukebox' },
  boombox: { kind: 'boombox' },
};

export function createVinyl(options = {}) {
  const { o, variant, T, V } = setup(options, VINYL_VARIANTS, 'vinyl');
  const root = group(`vinyl-${variant}`);
  const anims = [];
  const k = T.kids ? 0.75 : 1;
  const G = group('vin', { parent: root });
  G.scale.setScalar(k);
  if (V.kind === 'suitcase') {
    // open suitcase record player: hollow case + hinged lid with speaker
    const cm = T.trim ? cabMat(T) : M.fabric('#2a6a8a');
    const W = 0.42, D = 0.32, H = 0.12, w = 0.012;
    const C = group('suitcase', { parent: G });
    mesh(roundedBox(W, w, D, 0.004), cm, { parent: C, at: [0, w / 2, 0], name: 'case_floor' });
    for (const s of [-1, 1]) { mesh(roundedBox(W, H, w, 0.004), cm, { parent: C, at: [0, H / 2, s * (D / 2 - w / 2)], name: 'case_wall' }); mesh(roundedBox(w, H, D, 0.004), cm, { parent: C, at: [s * (W / 2 - w / 2), H / 2, 0], name: 'case_end' }); }
    mesh(roundedBox(W - 2 * w, 0.008, D - 2 * w, 0.002), M.matte('#e8e1cc', 0.6), { parent: C, at: [0, H - 0.03, 0], name: 'deck_plate' });
    for (const s of [-1, 1]) mesh(roundedBox(0.01, H - 0.035, 0.01, 0.002), cm, { parent: C, at: [s * 0.15, (H - 0.035) / 2 + w / 2, 0], name: 'deck_post' });
    const plat = group('platter', { parent: C, at: [-0.04, H - 0.026, 0] });
    mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.012, 40), M.matte('#1a1a1a', 0.8), { parent: plat, at: [0, 0.006, 0], name: 'platter_mat' });
    record(plat, 0.125, [0, 0.013, 0], T, 'sc_rec');
    curveTube([[0.16, H - 0.022 + 0.02, -0.11], [0.15, H - 0.022 + 0.025, 0.0], [0.07, H - 0.022 + 0.022, 0.06]], 0.003, M.chrome(), { parent: C, name: 'tonearm', segments: 12 });
    mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.04, 14), M.plastic('#1a1a1a', 0.4), { parent: C, at: [0.16, H - 0.022 + 0.0, -0.11], name: 'arm_post' });
    const lid = group('lid', { parent: C, at: [0, H, -D / 2] });
    mesh(roundedBox(W, 0.06, w, 0.004).translate(0, 0.03, 0), cm, { parent: lid, name: 'lid_back' });
    lid.children[0].geometry = roundedBox(W, w, D, 0.004).translate(0, w / 2, D / 2);
    for (const s of [-1, 1]) mesh(roundedBox(w, 0.05, D, 0.004).translate(0, -0.022, D / 2), cm, { parent: lid, at: [s * (W / 2 - w / 2), 0, 0], name: 'lid_side' });
    mesh(new THREE.CircleGeometry(0.08, 28).rotateX(-Math.PI / 2), grilleMat('#d8d2c2'), { parent: lid, at: [0, -0.0005, D / 2], name: 'lid_speaker' }).material.side = THREE.DoubleSide;
    lid.rotation.x = -1.75;
    for (const s of [-1, 1]) mesh(roundedBox(0.04, 0.02, 0.02, 0.005), M.chrome(), { parent: C, at: [s * 0.12, H * 0.6, D / 2 + 0.008], name: 'latch' });
    anims.push(clip('spin', 1.8, [spinTrack(plat, 'y', 1.8, -1)]));
  } else if (V.kind === 'hifi') {
    const cm = T.trim ? woodMat(T, '#3a2416') : M.wood('#3a2416');
    const W = 0.9, H = 0.55, D = 0.42;
    const cab = group('cabinet', { parent: G });
    const geo = roundedBox(W, 0.03, D, 0.008);
    for (const y of [0.04, H * 0.5, H - 0.015]) mesh(geo, cm, { parent: cab, at: [0, y, 0], name: 'shelf' });
    for (const s of [-1, 1]) mesh(roundedBox(0.03, H, D, 0.008), cm, { parent: cab, at: [s * (W / 2 - 0.015), H / 2, 0], name: 'cab_side' });
    mesh(roundedBox(W - 0.06, H - 0.06, 0.012, 0.004), cm, { parent: cab, at: [0, H / 2, -D / 2 + 0.006], name: 'cab_back' });
    for (const sx of [-1, 1]) mesh(T.round ? new THREE.CylinderGeometry(0.018, 0.012, 0.12, 12) : roundedBox(0.035, 0.12, 0.035, 0.006), cm, { parent: cab, at: [sx * (W / 2 - 0.05), -0.06 + 0.0, D / 2 - 0.05], name: 'cab_leg' });
    for (const sx of [-1, 1]) mesh(T.round ? new THREE.CylinderGeometry(0.018, 0.012, 0.12, 12) : roundedBox(0.035, 0.12, 0.035, 0.006), cm, { parent: cab, at: [sx * (W / 2 - 0.05), -0.06, -D / 2 + 0.05], name: 'cab_leg' });
    // records filed on the lower shelf
    const rs = [];
    for (let i = 0; i < 18; i++) rs.push(roundedBox(0.006, 0.31, 0.31, 0.002, 1).translate(-W / 2 + 0.06 + i * 0.022, 0.055 + 0.155, 0.0));
    const cols = ['#d23a2a', '#2b7de1', '#f0c040', '#1a1a1a', '#3bd16f', '#e8e1cc'];
    cols.forEach((c, ci) => merged(rs.filter((_, i) => i % cols.length === ci), M.matte(c, 0.6), { parent: cab, name: `sleeves_${ci}` }));
    const d = deck(G, T, [0.0, H, 0.0], 'hifi_deck');
    // amplifier on the middle shelf
    mesh(roundedBox(0.4, 0.1, 0.3, 0.008), T.round ? M.metal('#c9ccd2', 0.3) : M.plastic('#1a1a1c', 0.3), { parent: G, at: [0.2, H * 0.5 + 0.065, 0.0], name: 'amplifier' });
    const kn = []; for (let i = 0; i < 4; i++) kn.push(knobGeo(0.012, 0.012).translate(0.05 + i * 0.08, H * 0.5 + 0.065, 0.15)); merged(kn, M.chrome(), { parent: G, name: 'amp_knobs' });
    anims.push(clip('spin', 1.8, [spinTrack(d.platter, 'y', 1.8, -1)]));
    anims.push(clip('on', 1, lampTracks('hifi_deck_light', 2.4)));
  } else if (V.kind === 'gramophone') {
    const wm = T.trim ? woodMat(T, '#5b2a14') : M.wood('#5b2a14');
    const B = 0.3, BH = 0.16;
    mesh(T.round ? roundedBox(B, BH, B, 0.03) : roundedBox(B, BH, B, T.sharp ? 0.003 : 0.008), wm, { parent: G, at: [0, BH / 2, 0], name: 'gram_box' });
    mesh(roundedBox(B + 0.02, 0.02, B + 0.02, 0.006), wm, { parent: G, at: [0, BH + 0.01, 0], name: 'gram_top' });
    mesh(roundedBox(B + 0.02, 0.02, B + 0.02, 0.006), wm, { parent: G, at: [0, 0.01, 0], name: 'gram_plinth' });
    const crank = group('crank', { parent: G, at: [B / 2 + 0.01, BH * 0.55, 0] });
    bar([0, 0, 0], [0.04, 0, 0], 0.004, M.chrome(), crank, 'crank_shaft');
    bar([0.04, 0, 0], [0.04, -0.05, 0], 0.004, M.chrome(), crank, 'crank_arm');
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 10).rotateZ(Math.PI / 2), M.wood('#1a120c'), { parent: crank, at: [0.055, -0.05, 0], name: 'crank_knob' });
    const plat = group('gram_platter', { parent: G, at: [0, BH + 0.02, 0] });
    mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.012, 40), M.fabric('#3a7a3a'), { parent: plat, at: [0, 0.006, 0], name: 'gram_felt' });
    record(plat, 0.125, [0, 0.013, 0], T, 'gram_rec');
    // tone arm + soundbox + horn rising behind
    const hm = T.trim === 'gold' || !T.trim || T.round ? new THREE.MeshStandardMaterial({ name: 'brass', color: '#d9a94a', metalness: 1, roughness: 0.2 }) : T.trim === 'black' ? M.metal('#1e1e22', 0.3) : T.trim === 'white' ? fin(T, '#f1eee6', 'gloss') : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.p, 'plastic') : T.trim === 'natural' ? M.wood('#c99a5b') : T.wear ? M.metal('#7d7148', 0.6) : T.burst ? fin(T, '#c46a2a') : M.chrome();
    const ab = [B / 2 - 0.03, BH + 0.02, -B / 2 + 0.03];
    mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.04, 16), hm, { parent: G, at: [ab[0], ab[1] + 0.02, ab[2]], name: 'arm_base' });
    curveTube([[ab[0], ab[1] + 0.04, ab[2]], [ab[0], ab[1] + 0.07, ab[2] + 0.06], [ab[0] - 0.06, ab[1] + 0.06, ab[2] + 0.17], [ab[0] - 0.08, ab[1] + 0.04, ab[2] + 0.2]], 0.012, hm, { parent: G, name: 'gram_arm', segments: 20 });
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 24).rotateX(Math.PI / 2), M.chrome(), { parent: G, at: [ab[0] - 0.09, ab[1] + 0.032, ab[2] + 0.21], name: 'soundbox' });
    const hornBase = [ab[0], ab[1] + 0.04, ab[2]];
    curveTube([hornBase, [ab[0], ab[1] + 0.15, ab[2] - 0.05], [ab[0] - 0.02, ab[1] + 0.25, ab[2] - 0.02]], 0.015, hm, { parent: G, name: 'horn_neck', segments: 16 });
    const hornM = hm.clone();
    hornM.side = THREE.DoubleSide;
    const seg = T.sharp ? 8 : T.round ? 12 : 40;
    const prof = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16; prof.push([0.015 + 0.22 * t ** 3, t * 0.42]); }
    const hg = lathe(prof, seg);
    hg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-0.15, 0.55, 1).normalize()));
    mesh(hg, hornM, { parent: G, at: [ab[0] - 0.02, ab[1] + 0.25, ab[2] - 0.02], name: 'horn' });
    if (T.round) { const pet = []; for (let i = 0; i < 12; i++) pet.push(new THREE.TorusGeometry(0.01, 0.002, 4, 8)); void pet; }
    anims.push(clip('spin', 1.8, [spinTrack(plat, 'y', 1.8, -1), rotateTrack(crank, 'x', 1.8, (t) => t * Math.PI * 2, 12)]));
  } else if (V.kind === 'crate') {
    const wm = T.trim ? (T.kids ? fin(T, T.p, 'plastic') : T.neon ? fin(T, T.p, 'neon') : T.trim === 'black' || T.trim === 'white' ? fin(T, T.p) : T.trim === 'gold' ? fin(T, '#1b1b1d', 'gloss') : woodMat(T, '#c99a5b')) : M.wood('#c99a5b');
    const W = 0.36, D = 0.36, H = 0.32, w = 0.014;
    const C = group('crate', { parent: G });
    mesh(roundedBox(W, w, D, 0.003), wm, { parent: C, at: [0, w / 2, 0], name: 'crate_floor' });
    for (const s of [-1, 1]) {
      for (const yy of T.sharp ? [0.5] : [0.2, 0.55, 0.88]) mesh(roundedBox(W, T.sharp ? H : H * 0.24, w, 0.003), wm, { parent: C, at: [0, T.sharp ? H / 2 : H * yy, s * (D / 2 - w / 2)], name: 'crate_slat' });
      mesh(roundedBox(w, H, D, 0.003), wm, { parent: C, at: [s * (W / 2 - w / 2), H / 2, 0], name: 'crate_end' });
      mesh(plate(blob([[-0.05, -0.015], [0.05, -0.015], [0.05, 0.015], [-0.05, 0.015]], 16), w + 0.002, { bevel: 0 }), M.matte('#0a0a0a'), { parent: C, at: [s * (W / 2 - w / 2), H * 0.82, 0], rot: [0, Math.PI / 2, 0], name: 'hand_hole' });
    }
    // rows of LP sleeves standing inside, leaning slightly
    const cols = T.kids ? ['#ff4d6d', '#ffc81e', '#2b7de1'] : ['#d23a2a', '#2b7de1', '#f0c040', '#1a1a1a', '#3bd16f', '#e8e1cc', '#7a4dff'];
    const n = 14;
    cols.forEach((c, ci) => {
      const gs = [];
      for (let i = ci; i < n; i += cols.length) { const x = -W / 2 + w + 0.012 + i * 0.022; gs.push(roundedBox(0.005, 0.31, 0.31, 0.002, 1).rotateZ(-0.05).translate(x, w + 0.155, 0)); }
      if (gs.length) merged(gs, M.matte(c, 0.6), { parent: C, name: `sleeve_${ci}` });
    });
    // one LP pulled out, leaning against the front
    const lp = group('lp_out', { parent: G, at: [0.0, 0.0, D / 2 + 0.03], rot: [-0.25, 0, 0] });
    mesh(roundedBox(0.31, 0.31, 0.005, 0.002), M.matte('#e8e1cc', 0.6), { parent: lp, at: [0, 0.155, 0], name: 'lp_sleeve' });
    const art = labelPlane(0.28, 0.28, (c, w2, h2) => { const gr = c.createLinearGradient(0, 0, w2, h2); gr.addColorStop(0, '#ff5a3c'); gr.addColorStop(1, '#3c2aff'); c.fillStyle = gr; c.fillRect(0, 0, w2, h2); c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(w2 / 2, h2 / 2, w2 * 0.28, 0, Math.PI * 2); c.fill(); }, { bg: '#ff5a3c' });
    art.position.set(0, 0.155, 0.0026);
    lp.add(art);
  } else if (V.kind === 'jukebox') {
    const cm = T.trim ? (T.burst ? fin(T, '#fff', 'vc') : woodMat(T, '#6b2a14')) : M.wood('#6b2a14');
    const W = 0.8, H = 1.45, D = 0.6;
    const prof = T.sharp ? [[-W / 2, 0], [W / 2, 0], [W / 2, H * 0.8], [W / 2 - 0.15, H], [-W / 2 + 0.15, H], [-W / 2, H * 0.8]] : blob([[-W / 2, 0], [W / 2, 0], [W / 2 + 0.02, H * 0.55], [W / 2 - 0.02, H * 0.82], [W * 0.3, H * 0.97], [0, H], [-W * 0.3, H * 0.97], [-W / 2 + 0.02, H * 0.82], [-W / 2 - 0.02, H * 0.55]], 64);
    const geo = plate(prof, D, { bevel: 0.02 });
    sunGeo(geo, T, W * 0.6, H * 0.6, H / 2);
    mesh(geo, cm, { parent: G, name: 'jukebox_cab' });
    // bubble tubes (lamps) along the arch, glass dome window, record carousel
    const lamp = lampGroup('juke_tubes', T.neon ? 'blue' : T.round ? 'amber' : 'red');
    const arch = new THREE.CatmullRomCurve3(prof.filter(([, y]) => y > H * 0.3).map(([x, y]) => new THREE.Vector3(x * 0.9, y * 0.97, D / 2 + 0.005)));
    const ap = arch.getPoints(40).filter((p, i) => i % 1 === 0);
    lamp.add(G, { geometry: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ap), 48, 0.018, 8, false), normal: [0, 0, 1] });
    const win = blob([[-W * 0.3, H * 0.5], [W * 0.3, H * 0.5], [W * 0.3, H * 0.75], [0, H * 0.86], [-W * 0.3, H * 0.75]], 40);
    mesh(plate(win, 0.01, { bevel: 0.002 }), M.glass({ tint: '#9fc8e8', opacity: 0.4 }), { parent: G, at: [0, 0, D / 2 + 0.006], name: 'juke_window' });
    const car = group('carousel', { parent: G, at: [0, H * 0.6, D / 2 - 0.12] });
    for (let i = 0; i < 6; i++) { const r = record(car, 0.09, [0, 0, 0], T, `jr_${i}`); r.rotation.set(Math.PI / 2, (i / 6) * Math.PI * 2, 0); r.position.set(Math.cos((i / 6) * Math.PI * 2) * 0.05, 0, Math.sin((i / 6) * Math.PI * 2) * 0.05); }
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 12), M.chrome(), { parent: car, name: 'carousel_hub' });
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12).rotateX(Math.PI / 2), M.chrome(), { parent: G, at: [0, H * 0.6, D / 2 - 0.06], name: 'carousel_mount' });
    mesh(roundedBox(W * 0.6, 0.12, 0.04, 0.01), M.chrome(), { parent: G, at: [0, H * 0.4, D / 2 + 0.02], name: 'selector' });
    const btns = []; for (let i = 0; i < 10; i++) btns.push(roundedBox(0.03, 0.03, 0.012, 0.004, 1).translate(-W * 0.25 + i * W * 0.055, H * 0.4, D / 2 + 0.045)); merged(btns, M.plastic('#efe6cf', 0.3), { parent: G, name: 'select_buttons' });
    mesh(roundedBox(W * 0.7, H * 0.25, 0.006, 0.01), grilleMat('#c9a24a'), { parent: G, at: [0, H * 0.18, D / 2 + 0.003], name: 'juke_grille' });
    anims.push(clip('on', 1, lampTracks('juke_tubes', 3)));
    anims.push(clip('spin', 4, [spinTrack(car, 'y', 4)]));
  } else {
    // boombox standing on the floor with its handle up
    const bm = T.trim ? (T.burst ? fin(T, '#fff', 'vc') : fin(T, T.trim === 'vintage' ? '#c9ccd2' : T.trim === 'natural' ? '#c99a5b' : T.trim === 'neon' ? '#141418' : T.p, T.trim === 'vintage' ? 'metal' : undefined)) : M.plastic('#2a2b2e', 0.35);
    const W = 0.6, H = 0.3, D = 0.14;
    const geo = roundedBox(W, H, D, T.round ? 0.05 : T.sharp ? 0.005 : 0.025);
    sunGeo(geo, T, W * 0.6, H * 0.6);
    mesh(geo, bm, { parent: G, at: [0, H / 2 + 0.01, 0], name: 'boombox_body' });
    const cones = [];
    for (const s of [-1, 1]) { mesh(new THREE.TorusGeometry(0.095, 0.01, 8, 32), M.chrome(), { parent: G, at: [s * 0.18, H * 0.45, D / 2 + 0.004], name: 'spk_ring' }); cones.push(speakerCone(G, 0.09, { at: [s * 0.18, H * 0.45, D / 2], name: `bb_cone_${s > 0 ? 'R' : 'L'}` })); }
    mesh(roundedBox(0.16, 0.1, 0.01, 0.006), M.glass({ tint: '#202830', opacity: 0.85 }), { parent: G, at: [0, H * 0.42, D / 2 + 0.003], name: 'tape_door' });
    mesh(roundedBox(0.4, 0.05, 0.006, 0.004), labelPlane(1, 1, () => {}).material, { parent: G, at: [0, H * 0.82, D / 2 + 0.002], name: 'tuner_strip' });
    const tuner = labelPlane(0.38, 0.04, (c, w, h) => { c.fillStyle = '#e8d8a0'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; for (let i = 0; i < 20; i++) c.fillRect(8 + i * (w - 16) / 20, h * 0.5, 1, h * 0.4); c.fillStyle = '#c00'; c.fillRect(w * 0.6, 2, 2, h - 4); }, { bg: '#e8d8a0', emissive: 0.4 });
    tuner.position.set(0, H * 0.82, D / 2 + 0.0055);
    G.add(tuner);
    const keys = []; for (let i = 0; i < 6; i++) keys.push(roundedBox(0.03, 0.02, 0.04, 0.004, 1).translate(-0.08 + i * 0.032, H + 0.01 + 0.005, 0.02)); merged(keys, M.plastic('#c9ccd2', 0.3), { parent: G, name: 'tape_keys' });
    curveTube([[-0.22, H + 0.0, 0], [-0.2, H + 0.1, 0], [0.2, H + 0.1, 0], [0.22, H + 0.0, 0]], 0.012, M.chrome(), { parent: G, name: 'boombox_handle', segments: 20 });
    tube([0.26, H + 0.005, -0.04], [0.05, H + 0.3, -0.04], 0.004, M.chrome(), { parent: G, name: 'antenna' });
    for (const s of [-1, 1]) mesh(roundedBox(0.08, 0.02, D * 0.8, 0.008), M.rubber(), { parent: G, at: [s * 0.2, 0.01, 0], name: 'bb_foot' });
    const l = lampGroup('bb_vu', T.neon ? 'blue' : 'red');
    l.add(G, { at: [0, H * 0.62, D / 2 + 0.002], normal: [0, 0, 1], w: 0.08, h: 0.012, depth: 0.003, shape: 'strip', bezel: false, glowSize: 0.2 });
    anims.push(clip('pump', 0.5, cones.map((c) => scaleTrack(c, 0.5, (t) => [1, 1, 1 + 0.8 * Math.max(0, Math.sin(t * Math.PI * 2))]))));
    anims.push(clip('on', 1, lampTracks('bb_vu', 3, { blink: 4 })));
  }
  return done(root, 'vinyl', variant, o, anims);
}
