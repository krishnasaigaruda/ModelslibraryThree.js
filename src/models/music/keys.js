// Pianos (grand, baby grand, upright, digital, harpsichord, toy) and keyboards (stage piano,
// synths, workstation, keytar, home organ, pipe organ, accordion, melodica).
import {
  THREE, M, mesh, group, roundedBox, curveTube, lathe, setup, done, fin, hwMat, woodMat, blob, inset, plate, burst, merged, segGeo,
  labelPlane, knobGeo, bar, canvasTex, lowestPoint,
} from './common.js';
import { clip, rotateTrack, scaleTrack, moveTrack, pingPong, wave } from '../../core/animation.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { brandEmblem } from '../../core/brand.js';

/* --------------------------------- keybed --------------------------------- */
const BLACK_AFTER = new Set([0, 1, 3, 4, 5]); // white index in octave (C D _ F G A _)

/**
 * Piano keys along X centred at x0, front edge at z (keys run toward -z), resting on y.
 * Returns { width, top, keys: [animated key groups] }.
 */
export function keybed(parent, { whites = 52, start = 5, keyW = 0.0235, len = 0.15, y = 0, z = 0, x0 = 0, wMat, bMat, anim = [], prefix = 'key', vertical = false } = {}) {
  const W = whites * keyW;
  const wg = [], bg = [];
  const keys = [];
  const wm = wMat ?? new THREE.MeshPhysicalMaterial({ name: 'ivory', color: '#f6f3ea', roughness: 0.25, clearcoat: 0.6 });
  const bm = bMat ?? new THREE.MeshPhysicalMaterial({ name: 'ebony_key', color: '#111113', roughness: 0.3, clearcoat: 0.8 });
  for (let i = 0; i < whites; i++) {
    const x = x0 - W / 2 + (i + 0.5) * keyW;
    const geo = roundedBox(keyW - 0.0012, 0.022, len, 0.002, 1);
    if (anim.includes(i)) {
      const kg = group(`${prefix}_${keys.length}`, { parent, at: [x, y + 0.011, z - len] });
      mesh(geo, wm, { parent: kg, at: [0, 0, len / 2] });
      keys.push(kg);
    } else wg.push(geo.translate(x, y + 0.011, z - len / 2));
    if (BLACK_AFTER.has((i + start) % 7) && i < whites - 1) bg.push(roundedBox(0.0128, 0.014, len * 0.62, 0.002, 1).translate(x + keyW / 2, y + 0.026, z - len + len * 0.31));
  }
  if (wg.length) merged(wg, wm, { parent, name: `${prefix}_whites` });
  if (bg.length) merged(bg, bm, { parent, name: `${prefix}_blacks` });
  void vertical;
  return { width: W, top: y + 0.033, keys };
}
const keyAnim = (keys, period = 1.6) => keys.map((k, i) => rotateTrack(k, 'x', period, (t) => 0.07 * Math.max(0, Math.sin((t + i * 0.22) * Math.PI * 2)), 32));

function caseMat(T, def = '#0b0b0d') {
  if (!T.trim) return new THREE.MeshPhysicalMaterial({ name: 'piano_black', color: def, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03 });
  switch (T.trim) {
    case 'vintage': return M.wood('#5a2a14');
    case 'sunburst': return fin(T, '#fff', 'vc');
    case 'natural': return fin(T, '#cfa874', 'satin');
    case 'black': return fin(T, '#1c1c1f', 'satin');
    case 'white': return fin(T, '#f4f2ec', 'gloss');
    case 'neon': return new THREE.MeshPhysicalMaterial({ name: 'acrylic', color: '#bfe8ff', transparent: true, opacity: 0.45, roughness: 0.05, clearcoat: 1, emissive: T.a, emissiveIntensity: 0.15 });
    case 'relic': return fin(T, '#3a2a20', 'worn');
    case 'gold': return new THREE.MeshStandardMaterial({ name: 'gold_leaf', color: '#d9ad48', metalness: 1, roughness: 0.25 });
    case 'kids': return fin(T, T.p, 'plastic');
    default: return fin(T, T.p);
  }
}
const sunburstCase = (geo, T, r) => { if (T.burst) burst(geo, { cx: 0, cy: 0, rx: r, ry: r, inner: '#c46a2a', outer: '#2a0f06', start: 0.3 }); return geo; };

/** Leg in the trim's style: turned (vintage/gold), square (black/neon), round taper (default). */
function pianoLeg(parent, T, h, at, r = 0.05, name = 'leg') {
  const m = T.trim === 'gold' ? M.metal('#d9ad48', 0.25) : T.trim === 'neon' ? M.chrome() : caseMat(T);
  if (T.round || T.ornate) {
    mesh(lathe([[0, 0], [r * 0.6, 0], [r * 0.7, 0.03], [r * 0.5, 0.08], [r * 0.9, h * 0.35], [r * 0.55, h * 0.55], [r * 1.0, h * 0.75], [r * 0.7, h * 0.88], [r * 1.25, h * 0.94], [r * 1.25, h], [0, h]], 20), m, { parent, at, name });
  } else if (T.sharp) {
    mesh(roundedBox(r * 1.4, h, r * 1.4, 0.006), m, { parent, at: [at[0], at[1] + h / 2, at[2]], name });
  } else {
    mesh(lathe([[0, 0], [r * 0.55, 0], [r * 0.6, 0.02], [r * 0.85, h * 0.85], [r * 1.15, h * 0.9], [r * 1.15, h], [0, h]], 20), m, { parent, at, name });
  }
  if (!T.sharp) mesh(new THREE.SphereGeometry(r * 0.5, 12, 8), M.metal('#c8a24a', 0.3), { parent, at: [at[0], at[1] + r * 0.35, at[2]], name: `${name}_caster` });
}

function pedals(parent, T, x, y, z, n = 3) {
  const g = group('pedals', { parent, at: [x, y, z] });
  const m = T.trim === 'gold' || !T.trim || T.round ? M.metal('#d4ac4a', 0.2) : hwMat(T);
  mesh(roundedBox(0.03 + n * 0.06, 0.04, 0.08, 0.01), caseMat(T), { parent: g, at: [0, 0.02, 0] });
  for (let i = 0; i < n; i++) mesh(roundedBox(0.03, 0.012, 0.11, 0.005), m, { parent: g, at: [(i - (n - 1) / 2) * 0.055, 0.045, 0.06], rot: [-0.12, 0, 0] });
  return g;
}

/* ================================== PIANO ================================== */
export const PIANO_VARIANTS = {
  grand: { kind: 'grand', W: 1.55, L: 2.1 },
  'baby-grand': { kind: 'grand', W: 1.48, L: 1.55 },
  upright: { kind: 'upright', W: 1.52, H: 1.25, Dp: 0.62 },
  digital: { kind: 'digital', W: 1.38, H: 0.86, Dp: 0.42 },
  harpsichord: { kind: 'harpsichord', W: 0.95, L: 2.2 },
  spinet: { kind: 'upright', W: 1.42, H: 0.98, Dp: 0.56 },
};

function grandOutline(W, L, harps) {
  if (harps) return blob([[-W / 2, 0], [W / 2, 0], [W / 2, 0.15 * L], [W * 0.18, 0.55 * L], [-W * 0.12, 0.9 * L], [-W * 0.32, L], [-W / 2, L * 0.99]], 64);
  return blob([[-W / 2, 0], [W / 2, 0], [W / 2, 0.28 * L], [W * 0.38, 0.45 * L], [W * 0.12, 0.62 * L], [W * 0.02, 0.8 * L], [-W * 0.12, 0.96 * L], [-W * 0.3, L], [-W / 2, L * 0.97]], 72);
}

export function createPiano(options = {}) {
  const { o, variant, T, V } = setup(options, PIANO_VARIANTS, 'piano');
  const root = group(`piano-${variant}`);
  const cm = caseMat(T);
  const anims = [];
  const P = group('piano', { parent: root });
  const kidsK = T.kids ? 0.45 : 1;
  P.scale.setScalar(kidsK);
  const keyY = T.kids ? 0.5 / kidsK * 0.62 : 0.66;
  const whites = T.kids ? 22 : V.kind === 'harpsichord' ? 35 : V.kind === 'digital' ? 52 : variant === 'spinet' ? 45 : 52;
  const kMats = T.kids ? { wMat: fin(T, '#ffffff', 'plastic'), bMat: fin(T, T.a, 'plastic') } : V.kind === 'harpsichord' && !T.trim ? { wMat: new THREE.MeshStandardMaterial({ color: '#1a1512', roughness: 0.4 }), bMat: new THREE.MeshStandardMaterial({ color: '#efe6d0', roughness: 0.35 }) } : T.neon ? { bMat: fin(T, T.p, 'neon') } : T.wear ? { wMat: M.matte('#e2d6b4', 0.45) } : {};
  if (V.kind === 'grand' || V.kind === 'harpsichord') {
    const hp = V.kind === 'harpsichord';
    const W = whites * 0.0235 + 0.14, L = V.L;
    const out = grandOutline(W, L, hp);
    const caseH = hp ? 0.24 : 0.3, caseY = hp ? 0.62 : 0.66;
    const CG = group('case', { parent: P, at: [0, caseY, 0], rot: [-Math.PI / 2, 0, 0] });
    const rimG = plate(out, caseH, { holes: [inset(out, 0.045)], bevel: 0.01 });
    sunburstCase(rimG, T, L * 0.7);
    mesh(rimG, cm, { parent: CG, at: [0, 0, caseH / 2], name: 'rim' });
    const sb = plate(inset(out, 0.04), 0.02, { bevel: 0 });
    mesh(sb, hp && !T.trim ? M.wood('#d9b98a') : M.wood('#c9a06a'), { parent: CG, at: [0, 0, 0.06], name: 'soundboard' });
    if (!hp) mesh(plate(inset(out, 0.08), 0.02, { holes: [inset(out, 0.25)], bevel: 0.005 }), M.metal('#c9a24a', 0.35), { parent: CG, at: [0, 0, 0.1], name: 'iron_plate' });
    // strings fanning from front to tail
    const sg = [];
    for (let i = 0; i < 30; i++) { const t = i / 29; const x = -W / 2 + 0.08 + t * (W - 0.2); sg.push(segGeo([x, 0.12, 0.116], [x * 0.75 - W * 0.12 * t, L * (0.95 - 0.55 * t) - 0.06, 0.116], 0.0016, 4)); }
    merged(sg, M.metal('#d8d4c8', 0.25), { parent: CG, name: 'strings' });
    // keybed block and cheeks (front, z>0 after rotation)
    const kb = group('keybed', { parent: P, at: [0, 0, 0] });
    mesh(roundedBox(W - 0.06, 0.08, 0.3, 0.015), cm, { parent: kb, at: [0, keyY - 0.04, 0.12], name: 'keybed_block' });
    for (const s of [-1, 1]) mesh(roundedBox(0.06, 0.12, 0.3, 0.02), cm, { parent: kb, at: [s * (W / 2 - 0.03), keyY + 0.0, 0.12], name: 'cheek' });
    const kbd = keybed(kb, { whites, start: 5, y: keyY, z: 0.26, ...kMats, anim: [20, 23, 25] });
    if (hp) keybed(kb, { whites, start: 5, y: keyY + 0.06, z: 0.15, ...kMats, prefix: 'upper' });
    anims.push(...keyAnim(kbd.keys));
    mesh(roundedBox(W - 0.14, 0.08, 0.025, 0.01), cm, { parent: kb, at: [0, keyY + 0.05 + (hp ? 0.06 : 0), 0.02], name: 'fallboard' });
    // music desk
    if (!T.kids) mesh(roundedBox(0.8, 0.28, 0.02, 0.01), cm, { parent: kb, at: [0, caseY + caseH + 0.12, -0.12], rot: [-0.25, 0, 0], name: 'music_desk' });
    mesh(roundedBox(0.8, 0.02, 0.06, 0.008), cm, { parent: kb, at: [0, caseY + caseH + 0.0, -0.08], name: 'desk_ledge' });
    // lid hinged on the straight (left, -x) side, propped open
    const open = T.wear ? 0 : T.trim === 'natural' ? 0.32 : 0.62;
    const LH = group('lid_hinge', { parent: P, at: [-W / 2, caseY + caseH + 0.008, 0] });
    const lidG = plate(out.map(([x, y]) => [x + W / 2, y]), 0.022, { bevel: 0.006 });
    const lid = mesh(lidG, hp && !T.trim ? M.wood('#26442e') : cm, { parent: LH, rot: [-Math.PI / 2, 0, 0], at: [0, 0.011, 0], name: 'lid' });
    void lid;
    if (hp && typeof document !== 'undefined') { // painted lid underside: procedural landscape
      const tex = canvasTex(256, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fb8d8'); gr.addColorStop(0.6, '#e8d8b0'); gr.addColorStop(1, '#5a7a3a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#3e5a2a'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(i * 36, h * 0.8, 30, 0, Math.PI * 2); g.fill(); } });
      const pm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
      mesh(new THREE.PlaneGeometry(W * 0.8, L * 0.6), pm, { parent: LH, rot: [Math.PI / 2, 0, 0], at: [W * 0.45, -0.0005, -L * 0.45], name: 'lid_art' });
    }
    LH.rotation.z = open;
    if (open > 0) {
      const lx = W * 0.62;
      const tipY = Math.sin(open) * lx;
      bar([-W / 2 + lx * Math.cos(open), caseY + 0.065, -L * 0.3], [-W / 2 + lx * Math.cos(open), caseY + caseH + tipY + 0.004, -L * 0.3], 0.012, cm, P, 'prop');
    }
    // legs
    const legH = caseY - 0.02;
    const legPos = hp ? [[-W / 2 + 0.08, 0.12], [W / 2 - 0.08, 0.12], [-W / 2 + 0.1, L * 0.85], [W * 0.05, L * 0.6]] : [[-W / 2 + 0.1, 0.15], [W / 2 - 0.1, 0.15], [-W * 0.18, L * 0.85]];
    for (const [x, zz] of legPos) pianoLeg(P, T, legH + 0.03, [x, 0, -zz], hp ? 0.035 : 0.055);
    if (!hp && !T.kids) { pedals(P, T, 0, 0, 0.02); bar([0, 0.04, 0.0], [0, caseY + 0.01, -0.02], 0.018, cm, P, 'lyre'); }
  } else {
    // upright / spinet / digital
    const W = whites * 0.0235 + 0.12, H = V.H, Dp = V.Dp;
    const dig = V.kind === 'digital';
    const ug = roundedBox(W, H - keyY - 0.04, Dp * 0.55, T.sharp ? 0.006 : 0.02);
    sunburstCase(ug, T, W * 0.6);
    mesh(ug, cm, { parent: P, at: [0, keyY + 0.04 + (H - keyY - 0.04) / 2, -Dp * 0.22], name: 'upper_case' });
    if (!dig) mesh(roundedBox(W, keyY - 0.08, Dp * 0.4, 0.015), cm, { parent: P, at: [0, (keyY - 0.08) / 2 + 0.06, -Dp * 0.28], name: 'lower_case' });
    for (const s of [-1, 1]) {
      mesh(roundedBox(0.05, dig ? keyY + 0.02 : keyY + 0.08, Dp, 0.015), cm, { parent: P, at: [s * (W / 2 - 0.025), (dig ? keyY + 0.02 : keyY + 0.08) / 2, 0], name: 'cheek' });
      if (!dig) { // toe / front leg
        if (T.round || T.ornate) pianoLeg(P, T, keyY - 0.04, [s * (W / 2 - 0.04), 0, Dp * 0.42], 0.035, 'front_leg');
        else mesh(roundedBox(0.05, 0.06, Dp * 0.4, 0.01), cm, { parent: P, at: [s * (W / 2 - 0.025), 0.03, Dp * 0.6], name: 'toe' });
      }
    }
    if (dig) mesh(roundedBox(W - 0.1, 0.4, 0.02, 0.006), cm, { parent: P, at: [0, 0.24, -Dp * 0.3], name: 'modesty' });
    mesh(roundedBox(W - 0.08, 0.06, 0.32, 0.012), cm, { parent: P, at: [0, keyY - 0.03, Dp * 0.32 - 0.16 + 0.04], name: 'keybed_block' });
    const kbd = keybed(P, { whites, start: 5, y: keyY, z: Dp * 0.32 + 0.04, ...kMats, anim: [20, 23, 25] });
    anims.push(...keyAnim(kbd.keys));
    mesh(roundedBox(W - 0.08, 0.06, 0.06, 0.01), cm, { parent: P, at: [0, keyY + 0.06, Dp * 0.32 + 0.04 - 0.17], name: 'key_slip' });
    mesh(roundedBox(W * 0.55, 0.22, 0.02, 0.008), cm, { parent: P, at: [0, keyY + 0.25, Dp * 0.06 + 0.01], rot: [-0.18, 0, 0], name: 'music_desk' });
    mesh(roundedBox(W * 0.55, 0.02, 0.07, 0.006), cm, { parent: P, at: [0, keyY + 0.13, Dp * 0.06 + 0.035 - 0.02], name: 'desk_ledge' });
    if (dig) {
      const scr = labelPlane(0.12, 0.03, (g, w, h) => { g.fillStyle = '#062016'; g.fillRect(0, 0, w, h); g.fillStyle = '#5cff9a'; g.font = `${h * 0.55}px monospace`; g.fillText('GRAND 01', 8, h * 0.7); }, { bg: '#0a3a24', emissive: 1.2 });
      scr.position.set(0, keyY + 0.071, Dp * 0.32 + 0.04 - 0.198);
      scr.rotation.x = -Math.PI / 2 + 0.0;
      P.add(scr);
    }
    if (!T.kids && !dig) pedals(P, T, 0, 0, Dp * 0.0 + 0.05);
    if (dig) pedals(P, T, 0, 0, 0.05);
    if (T.ornate) for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 24).rotateX(Math.PI / 2), M.metal('#e6b54e', 0.2), { parent: P, at: [s * W * 0.3, keyY + 0.35, -Dp * 0.22 + Dp * 0.275 + 0.004], name: 'candle_sconce' });
  }
  if (!T.kids) { const em = brandEmblem(0.05); em.position.set(0, keyY + 0.06, V.kind === 'grand' || V.kind === 'harpsichord' ? 0.0326 : V.Dp * 0.32 + 0.04 - 0.17 + 0.0302); P.add(em); }
  // bench
  if (!T.kids && V.kind !== 'digital') {
    const bz = V.kind === 'grand' || V.kind === 'harpsichord' ? 0.75 : V.Dp * 0.32 + 0.6;
    const bm = group('bench', { parent: root, at: [0, 0, bz] });
    mesh(roundedBox(0.75, 0.06, 0.36, 0.015), cm, { parent: bm, at: [0, 0.47, 0] });
    mesh(roundedBox(0.72, 0.04, 0.33, 0.02), T.trim === 'gold' ? M.fabric('#7a1022') : M.fabric(T.trim === 'white' ? '#e9e5dc' : '#1a1a1a'), { parent: bm, at: [0, 0.515, 0], name: 'bench_cushion' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) pianoLeg(bm, T, 0.45, [sx * 0.32, 0, sz * 0.14], 0.025, 'bench_leg');
  }
  return done(root, 'piano', variant, o, () => [clip('play', 1.6, anims.filter((a) => a.name.startsWith('key')))]);
}

/* ================================ KEYBOARDS ================================ */
export const KEYBOARD_VARIANTS = {
  'stage-piano': { kind: 'slab', whites: 52, stand: 'x', p: '#a3141c' },
  synth: { kind: 'synth', whites: 29, stand: 'x', p: '#2a2c31' },
  'analog-synth': { kind: 'analog', whites: 22, stand: 'table', p: '#1b1b1d' },
  workstation: { kind: 'synth', whites: 36, stand: 'z', screen: true, p: '#24262b' },
  keytar: { kind: 'keytar', whites: 22, p: '#e8e8ec' },
  organ: { kind: 'organ', whites: 36, p: '#5b3a24' },
  'pipe-organ': { kind: 'pipe', whites: 36, p: '#4a2c18' },
  accordion: { kind: 'accordion', p: '#a8141c' },
  melodica: { kind: 'melodica', whites: 19, p: '#1f5fd0' },
};

function standX(parent, T, w, topY, d = 0.36) {
  const sm = T.trim === 'gold' ? hwMat(T) : T.kids ? fin(T, T.s, 'plastic') : M.metal('#1c1d20', 0.4);
  const g = group('stand', { parent });
  for (const s of [-1, 1]) {
    const x = s * w * 0.32;
    bar([x - 0.0, 0.02, -d / 2], [x, topY - 0.02, d / 2], 0.014, sm, g, 'x_bar');
    bar([x, 0.02, d / 2], [x, topY - 0.02, -d / 2], 0.014, sm, g, 'x_bar');
    for (const z of [-d / 2, d / 2]) mesh(new THREE.CapsuleGeometry(0.018, 0.05, 4, 8).rotateX(Math.PI / 2), M.rubber(), { parent: g, at: [x, 0.018, z] });
    mesh(roundedBox(0.04, 0.03, d + 0.06, 0.01), M.rubber(), { parent: g, at: [x, topY - 0.015, 0], name: 'cradle_pad' });
  }
  bar([-w * 0.32, topY * 0.5, 0], [w * 0.32, topY * 0.5, 0], 0.012, sm, g, 'x_axle');
  return g;
}
function standTable(parent, T, w, topY, d = 0.5) {
  const tm = T.trim ? woodMat(T, '#5b3a24') : M.wood('#3b2a1e');
  const g = group('table', { parent });
  mesh(roundedBox(w + 0.1, 0.04, d, 0.012), tm, { parent: g, at: [0, topY - 0.02, 0], name: 'table_top' });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.045, topY - 0.04, 0.045, 0.01), tm, { parent: g, at: [sx * (w / 2), (topY - 0.04) / 2, sz * (d / 2 - 0.04)], name: 'table_leg' });
  return g;
}
function standZ(parent, T, w, topY, d = 0.4) {
  const sm = T.trim === 'gold' ? hwMat(T) : M.metal('#1c1d20', 0.4);
  const g = group('zstand', { parent });
  for (const s of [-1, 1]) {
    const x = s * w * 0.35;
    bar([x, 0.02, d / 2], [x, 0.02, -d / 2], 0.016, sm, g);
    bar([x, 0.02, -d / 2 + 0.02], [x, topY - 0.02, d / 2 - 0.05], 0.018, sm, g);
    bar([x, topY - 0.02, d / 2 - 0.05], [x, topY - 0.02, -d / 2], 0.016, sm, g);
  }
  bar([-w * 0.35, 0.02, 0], [w * 0.35, 0.02, 0], 0.014, sm, g);
  bar([-w * 0.35, topY - 0.02, -d / 4], [w * 0.35, topY - 0.02, -d / 4], 0.014, sm, g);
  return g;
}

/** Slab keyboard body with panel, knobs, wheels, screen. Returns { group, top, anims, lights }. */
function keySlab(parent, T, V, at) {
  const g = group('board', { parent, at });
  const whites = T.kids ? Math.min(V.whites, 22) : V.whites;
  const kw = whites * 0.0235;
  const side = V.kind === 'analog' || T.round ? 0.06 : 0.05;
  const W = kw + side * 2 + (V.kind === 'slab' ? 0.02 : 0.12);
  const panel = V.kind === 'slab' ? 0.07 : 0.16;
  const Dd = 0.17 + panel;
  const bodyM = T.trim ? (T.burst ? fin(T, '#2a1406') : fin(T, T.trim === 'vintage' ? '#e9e1cc' : T.trim === 'natural' ? '#c8b89a' : T.p)) : fin(T, V.p);
  const bg = roundedBox(W, 0.07, Dd, T.sharp ? 0.006 : 0.015);
  mesh(bg, bodyM, { parent: g, at: [0, 0.035, 0], name: 'chassis' });
  if (V.kind === 'analog' || T.round || T.burst || T.trim === 'natural') for (const s of [-1, 1]) mesh(roundedBox(0.03, 0.11, Dd + 0.01, 0.01), T.burst ? fin(T, '#c46a2a') : M.wood('#6b3a1e'), { parent: g, at: [s * (W / 2 + 0.014), 0.055, 0], name: 'wood_cheek' });
  const kx = (side + (V.kind === 'slab' ? 0.02 : 0.12) - side) / 2;
  const kb = keybed(g, { whites, start: 0, y: 0.04, z: Dd / 2 - 0.005, x0: kx, len: 0.15, anim: [7, 9, 11], ...(T.kids ? { wMat: fin(T, '#fff', 'plastic'), bMat: fin(T, T.a, 'plastic') } : T.neon ? { bMat: fin(T, T.p, 'neon') } : {}) });
  // panel slope
  const pz = Dd / 2 - 0.16 - panel / 2;
  const pn = mesh(roundedBox(W - 0.02, 0.02, panel - 0.01, 0.006), T.trim === 'white' ? fin(T, '#d8d6cf') : M.plastic('#141416', 0.4), { parent: g, at: [0, 0.075, pz], rot: [0.06, 0, 0], name: 'panel' });
  void pn;
  const knobs = [];
  const nk = V.kind === 'analog' ? 20 : V.kind === 'slab' ? 5 : 12;
  for (let i = 0; i < nk; i++) {
    const cols = V.kind === 'slab' ? 5 : V.kind === 'analog' ? 10 : 6;
    const r = Math.floor(i / cols), c = i % cols;
    knobs.push(knobGeo(0.009, 0.014).rotateX(-Math.PI / 2).translate(-W / 2 + 0.07 + c * 0.04, 0.084, pz - panel / 2 + 0.04 + r * 0.05));
  }
  merged(knobs, T.trim === 'gold' ? hwMat(T) : T.neon ? fin(T, T.a, 'neon') : M.plastic(T.round ? '#e9e1cc' : '#2a2a2e', 0.35), { parent: g, name: 'knobs' });
  // wheels
  if (V.kind !== 'slab') for (let i = 0; i < 2; i++) mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.014, 20).rotateZ(Math.PI / 2), M.rubber(), { parent: g, at: [-W / 2 + 0.035 + i * 0.03, 0.07, Dd / 2 - 0.08], name: `wheel_${i}` });
  const lights = lampGroup('leds', T.neon ? 'blue' : 'red');
  for (let i = 0; i < 4; i++) lights.add(g, { at: [W / 2 - 0.05 - i * 0.03, 0.086, pz - panel / 2 + 0.03], normal: [0, 1, 0], w: 0.008, h: 0.008, depth: 0.002, shape: 'round', bezel: false, glowSize: 0.05 });
  if (V.screen || V.kind === 'synth') {
    const scr = labelPlane(0.16, 0.06, (c, w, h) => { c.fillStyle = '#0a1a2c'; c.fillRect(0, 0, w, h); c.strokeStyle = '#4fd3ff'; c.lineWidth = 3; c.beginPath(); for (let x = 0; x < w; x += 4) c.lineTo(x, h / 2 + Math.sin(x * 0.08) * h * 0.3); c.stroke(); }, { bg: '#123a5a', emissive: 1.3 });
    scr.position.set(0.0, 0.0861, pz);
    scr.rotation.x = -Math.PI / 2 + 0.06;
    g.add(scr);
  }
  if (!T.kids) { const em = brandEmblem(0.03); em.position.set(W / 2 - 0.05, 0.0705, Dd / 2 - 0.165 + 0.0); em.rotation.x = -Math.PI / 2; g.add(em); }
  return { g, W, D: Dd, anims: keyAnim(kb.keys, 1.6) };
}

export function createKeyboard(options = {}) {
  const { o, variant, T, V } = setup(options, KEYBOARD_VARIANTS, 'keyboard');
  const root = group(`keyboard-${variant}`);
  const anims = [];
  const K = group('kb', { parent: root });
  if (T.kids) K.scale.setScalar(0.7);
  if (V.kind === 'slab' || V.kind === 'synth' || V.kind === 'analog') {
    const topY = V.stand === 'table' ? 0.74 : 0.78;
    const s = keySlab(K, T, V, [0, topY, 0]);
    if (V.stand === 'x') standX(K, T, s.W, topY, 0.34);
    else if (V.stand === 'z') standZ(K, T, s.W, topY, 0.38);
    else standTable(K, T, s.W, topY, s.D + 0.12);
    anims.push(clip('play', 1.6, s.anims));
    anims.push(clip('on', 1, lampTracks('leds', 2.4)));
  } else if (V.kind === 'keytar') {
    // strap-on keyboard leaning on a guitar-style A-frame stand
    const kt = group('keytar', { parent: K, at: [0, 0.1, 0], rot: [0, 0, 0.42] });
    const bm = T.trim ? fin(T, T.p) : fin(T, V.p);
    const out = T.sharp ? [[-0.45, -0.07], [0.12, -0.07], [0.2, -0.12], [0.24, 0.04], [0.5, 0.06], [0.5, 0.11], [0.16, 0.1], [-0.45, 0.07]] : blob([[-0.45, -0.07], [0.15, -0.08], [0.22, -0.03], [0.26, 0.04], [0.48, 0.05], [0.5, 0.09], [0.46, 0.11], [0.18, 0.1], [-0.45, 0.075]], 60);
    mesh(plate(out, 0.05, { bevel: 0.01 }), bm, { parent: kt, name: 'keytar_body' });
    const kb = keybed(kt, { whites: 22, start: 0, y: 0.025, z: 0.065, x0: -0.15, len: 0.09, anim: [6, 8], prefix: 'kt' });
    kb.keys.forEach((k) => { k.rotation.x = Math.PI / 2; });
    kt.getObjectByName('kt_whites').rotation.x = 0;
    void kb;
    mesh(roundedBox(0.2, 0.03, 0.03, 0.01), M.rubber(), { parent: kt, at: [0.36, 0.08, 0.025], name: 'grip' });
    mesh(roundedBox(0.03, 0.022, 0.06, 0.006), M.plastic('#111', 0.3), { parent: kt, at: [0.28, 0.08, 0.03], name: 'ribbon' });
    // simple A-frame
    const sm = M.metal('#1c1d20', 0.4);
    const lp = lowestPoint(kt);
    kt.position.y += 0.132 - lp.y;
    const lx = lp.x, lz = lp.z;
    bar([lx - 0.15, 0.12, lz], [lx + 0.15, 0.12, lz], 0.012, M.rubber(), K, 'cradle');
    for (const s of [-1, 1]) { bar([lx + s * 0.15, 0.0, lz - 0.12], [lx + s * 0.15, 0.12, lz], 0.01, sm, K, 'aframe'); bar([lx + s * 0.15, 0.0, lz + 0.12], [lx + s * 0.15, 0.12, lz], 0.01, sm, K, 'aframe'); }
    // yoke supporting the neck end
    kt.updateMatrixWorld(true);
    const tip = kt.localToWorld(new THREE.Vector3(0.36, 0.08, -0.025));
    bar([tip.x, 0.0, tip.z - 0.03], [tip.x, tip.y - 0.0, tip.z - 0.03], 0.01, sm, K, 'post');
    for (const s of [-1, 1]) bar([tip.x, 0.0, tip.z - 0.03], [tip.x + s * 0.15, 0.0, tip.z - 0.15], 0.01, sm, K, 'post_leg');
    anims.push(clip('play', 1.6, keyAnim(K.getObjectByName('kt_0') ? [K.getObjectByName('kt_0'), K.getObjectByName('kt_1')] : [], 1.6)));
  } else if (V.kind === 'organ' || V.kind === 'pipe') {
    const cm = caseMat(T, V.p);
    const isPipe = V.kind === 'pipe';
    const W = 1.15 + (isPipe ? 0.3 : 0);
    const cab = roundedBox(W, 1.0, 0.55, T.sharp ? 0.005 : 0.02);
    sunburstCase(cab, T, 0.8);
    if (!T.trim) K.userData.mat = 1;
    const caseM = T.trim ? cm : M.wood(V.p);
    mesh(cab, caseM, { parent: K, at: [0, 0.5, -0.28], name: 'console' });
    for (const s of [-1, 1]) mesh(roundedBox(0.05, 1.0, 0.75, 0.015), caseM, { parent: K, at: [s * (W / 2 - 0.025), 0.5, -0.18], name: 'console_cheek' });
    // two (or three) stepped manuals
    const man = isPipe ? 3 : 2;
    const ks = [];
    for (let m = 0; m < man; m++) {
      const y = 0.72 + m * 0.07, z = 0.18 - m * 0.1;
      mesh(roundedBox(W - 0.1, 0.05, 0.2, 0.01), caseM, { parent: K, at: [0, y - 0.025, z - 0.1], name: `manual_base_${m}` });
      const kb = keybed(K, { whites: T.kids ? 22 : V.whites, start: 0, y, z, len: 0.13, prefix: `man${m}`, anim: m === 0 ? [10, 12, 14] : [], ...(T.neon ? { bMat: fin(T, T.p, 'neon') } : {}) });
      ks.push(...kb.keys);
    }
    anims.push(clip('play', 1.6, keyAnim(ks)));
    // drawbars / stop tabs
    const tabs = [];
    const colors = ['#f2efe6', '#c0262c', '#151515', '#2a5fb0'];
    for (let i = 0; i < 18; i++) tabs.push({ g: roundedBox(0.03, 0.012, 0.02, 0.004, 1).translate(-0.36 + i * 0.042, 0.92 + (isPipe ? 0.07 : 0), -0.0), c: colors[i % 4] });
    for (let c = 0; c < 4; c++) { const gs = tabs.filter((t) => t.c === colors[c]).map((t) => t.g); if (gs.length) merged(gs, M.plastic(colors[c], 0.3), { parent: K, name: `stops_${c}` }); }
    mesh(roundedBox(0.8, 0.03, 0.04, 0.008), caseM, { parent: K, at: [0, 0.905 + (isPipe ? 0.07 : 0), -0.02], name: 'stop_rail' });
    mesh(roundedBox(0.7, 0.26, 0.02, 0.008), caseM, { parent: K, at: [0, 1.135, -0.06], rot: [-0.2, 0, 0], name: 'music_desk' });
    mesh(roundedBox(0.7, 0.02, 0.07, 0.006), caseM, { parent: K, at: [0, 1.009, -0.04], name: 'desk_ledge' });
    // pedalboard
    const pd = [];
    for (let i = 0; i < 13; i++) pd.push(roundedBox(0.035, 0.03, 0.45 - (BLACK_AFTER.has(i % 7) ? 0 : 0.0), 0.006, 1).translate(-0.33 + i * 0.055, 0.045 + ((i % 7 === 2 || i % 7 === 6) ? 0 : 0), 0.18));
    mesh(roundedBox(0.8, 0.03, 0.5, 0.008), caseM, { parent: K, at: [0, 0.015, 0.16], name: 'pedal_frame' });
    merged(pd, M.wood('#d9b98a'), { parent: K, name: 'pedalboard' });
    // bench
    const bm = group('bench', { parent: K, at: [0, 0, 0.62] });
    mesh(roundedBox(0.95, 0.05, 0.32, 0.012), caseM, { parent: bm, at: [0, 0.6, 0], name: 'bench_top' });
    for (const s of [-1, 1]) mesh(roundedBox(0.05, 0.58, 0.3, 0.01), caseM, { parent: bm, at: [s * 0.44, 0.29, 0], name: 'bench_side' });
    if (isPipe) {
      // façade of pipes on a case behind the console
      const ph = group('pipes', { parent: K, at: [0, 0, -0.9] });
      mesh(roundedBox(2.0, 1.1, 0.5, 0.02), caseM, { parent: ph, at: [0, 0.55, 0], name: 'pipe_chest' });
      const pm = T.trim === 'gold' || !T.trim ? M.metal('#d8d2c2', 0.22) : T.trim === 'vintage' || T.round ? M.metal('#c9a24a', 0.3) : T.neon ? fin(T, T.p, 'neon') : hwMat(T);
      const pipes = [];
      const np = T.kids ? 9 : 17;
      for (let i = 0; i < np; i++) {
        const t = i / (np - 1), h = 0.9 + 1.4 * (1 - Math.abs(t - 0.5) * 2) ** (T.sharp ? 1 : 1.6), r = 0.035 + 0.025 * (1 - Math.abs(t - 0.5) * 2);
        const x = -0.9 + t * 1.8;
        pipes.push(lathe([[r * 0.25, 0], [r, 0.12], [r, 0.18], [r * 0.95, 0.2], [r, 0.22], [r, h], [r * 0.9, h], [r * 0.9, 0.24]], 18).translate(x, 1.1, 0.1));
        pipes.push(new THREE.BoxGeometry(r * 1.2, 0.03, 0.004).translate(x, 1.1 + 0.2, 0.1 + r * 0.95).toNonIndexed());
      }
      merged(pipes, pm, { parent: ph, name: 'facade' });
      mesh(roundedBox(2.06, 0.08, 0.56, 0.02), caseM, { parent: ph, at: [0, 1.1, 0], name: 'impost' });
    }
  } else if (V.kind === 'accordion') {
    const A = group('accordion', { parent: K, at: [0, 0, 0] });
    const bm = T.trim ? fin(T, T.trim === 'vintage' ? '#e9dfc6' : T.p) : new THREE.MeshPhysicalMaterial({ name: 'celluloid', color: V.p, roughness: 0.2, clearcoat: 1 });
    const H = 0.44, Dd = 0.2;
    // treble box (right) with vertical keyboard
    const tb = group('treble', { parent: A, at: [0.16, 0, 0] });
    mesh(roundedBox(0.09, H, Dd, 0.015), bm, { parent: tb, at: [0, H / 2, 0], name: 'treble_box' });
    const kbG = group('treble_keys', { parent: tb, at: [-0.045, 0.03, 0], rot: [0, 0, Math.PI / 2] });
    keybed(kbG, { whites: 17, start: 5, y: 0, z: 0.0, x0: H / 2 - 0.03, keyW: 0.022, len: 0.07, prefix: 'acc' });
    kbG.rotation.set(0, -Math.PI / 2, Math.PI / 2);
    kbG.position.set(-0.035, 0.0, Dd / 2 - 0.0);
    // bass box (left) with buttons
    const bb = group('bass', { parent: A, at: [-0.16, 0, 0] });
    mesh(roundedBox(0.09, H, Dd, 0.015), bm, { parent: bb, at: [0, H / 2, 0], name: 'bass_box' });
    const btn = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) btn.push(new THREE.CylinderGeometry(0.0055, 0.0055, 0.01, 8).rotateZ(Math.PI / 2).translate(-0.05, 0.08 + c * 0.03 + (r % 2) * 0.015, -0.07 + r * 0.028));
    merged(btn, T.ornate ? M.metal('#e6b54e', 0.2) : pearlish(), { parent: bb, name: 'bass_buttons' });
    // grille on the treble box front
    mesh(roundedBox(0.004, H * 0.5, Dd * 0.8, 0.002), T.ornate || !T.trim ? M.chrome() : hwMat(T), { parent: tb, at: [0.046, H * 0.62, 0], name: 'grille' });
    // bellows: pleats
    const bel = group('bellows', { parent: A, at: [0, 0, 0] });
    const pleatM = T.trim === 'neon' ? fin(T, T.s, 'neon') : M.fabric(T.trim === 'white' ? '#e9e5dc' : T.kids ? T.s : '#141414');
    const edgeM = T.trim === 'gold' ? hwMat(T) : M.matte(T.trim === 'black' ? '#c0262c' : '#f2efe6', 0.6);
    const np = 21;
    for (let i = 0; i < np; i++) {
      const x = -0.112 + (i / (np - 1)) * 0.224;
      mesh(roundedBox(0.013, H - 0.02, Dd - 0.02, 0.004), pleatM, { parent: bel, at: [x, H / 2, 0], scale: [1, 1 - (i % 2) * 0.04, 1 - (i % 2) * 0.08] });
      if (i % 2 === 0) mesh(roundedBox(0.004, H - 0.015, Dd - 0.012, 0.002), edgeM, { parent: bel, at: [x, H / 2, 0] });
    }
    // straps
    curveTube([[0.16, H, -Dd / 2 - 0.004], [0.16, H + 0.05, -Dd / 2 - 0.03], [0.16, H * 0.5, -Dd / 2 - 0.06], [0.16, 0.05, -Dd / 2 - 0.004]], 0.008, M.matte('#2a1a10', 0.7), { parent: A, name: 'strap', segments: 20, radialSegments: 6 });
    anims.push(clip('squeeze', 2, [scaleTrack(bel, 2, (t) => [1 + 0.25 * wave(t), 1, 1]), moveTrack(tb, 2, (t) => [0.03 * wave(t), 0, 0]), moveTrack(bb, 2, (t) => [-0.03 * wave(t), 0, 0])]));
  } else {
    // melodica lying flat on the floor, mouthpiece tube attached
    const Mg = group('melodica', { parent: K });
    const bm = T.trim ? fin(T, T.p) : fin(T, V.p);
    mesh(roundedBox(0.48, 0.05, 0.12, 0.02), bm, { parent: Mg, at: [0, 0.025, 0], name: 'melodica_body' });
    keybed(Mg, { whites: 19, start: 5, y: 0.045, z: 0.06, x0: -0.02, keyW: 0.022, len: 0.085, prefix: 'mel', ...(T.neon ? { bMat: fin(T, T.p, 'neon') } : {}) });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 12).rotateZ(Math.PI / 2), M.plastic('#e8e8e8', 0.3), { parent: Mg, at: [-0.255, 0.03, 0], name: 'port' });
    curveTube([[-0.27, 0.03, 0], [-0.34, 0.012, 0.06], [-0.3, 0.012, 0.18], [-0.12, 0.012, 0.2]], 0.008, new THREE.MeshPhysicalMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.6, roughness: 0.1 }), { parent: Mg, name: 'mouth_tube', segments: 24 });
    mesh(roundedBox(0.04, 0.012, 0.025, 0.005), M.plastic('#f2f2f2', 0.3), { parent: Mg, at: [-0.11, 0.008, 0.2], name: 'mouthpiece' });
  }
  return done(root, 'keyboard', variant, o, anims);
}

function pearlish() { return new THREE.MeshPhysicalMaterial({ name: 'pearl', color: '#f3efe6', roughness: 0.2, clearcoat: 1 }); }
