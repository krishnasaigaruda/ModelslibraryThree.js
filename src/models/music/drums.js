// Drums (kits, snare, bass drum, toms, cymbals, hi-hat, bongos, congas, djembe, timpani,
// cajon, gong, steel pan) and tuned/hand percussion (xylophone, marimba, glockenspiel,
// vibraphone, triangle, tambourine, harps, metronome, tubular bells, maracas).
import {
  THREE, M, mesh, group, roundedBox, curveTube, lathe, tube, setup, done, fin, hwMat, woodMat, merged, segGeo, bar, burst, plate, blob, TRIMS,
} from './common.js';
import { clip, rotateTrack, moveTrack, scaleTrack, wave } from '../../core/animation.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { brandEmblem } from '../../core/brand.js';

const bronze = (T) => (T.trim === 'gold' ? new THREE.MeshStandardMaterial({ name: 'gold_cym', color: '#f0c45a', metalness: 1, roughness: 0.12 }) : T.trim === 'black' ? new THREE.MeshStandardMaterial({ name: 'black_cym', color: '#2a2622', metalness: 0.9, roughness: 0.35 }) : T.wear ? M.metal('#8e7a48', 0.6) : T.kids ? M.metal('#d9c27a', 0.3) : new THREE.MeshStandardMaterial({ name: 'bronze', color: '#c9a24e', metalness: 1, roughness: 0.24 }));
const headWhite = (T) => (T.trim === 'black' ? M.matte('#1a1a1c', 0.5) : T.wear ? M.matte('#ddd2b0', 0.7) : T.neon ? new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, roughness: 0.2 }) : M.matte('#f3f0e8', 0.55));

/** Shell material per trim (sparkle/pearl/wood/acrylic…). */
function shellMat(T, def = '#a01522') {
  if (!T.trim) return new THREE.MeshPhysicalMaterial({ name: 'wrap', color: def, roughness: 0.25, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
  switch (T.trim) {
    case 'vintage': return new THREE.MeshPhysicalMaterial({ name: 'oyster', color: '#e8dcc0', roughness: 0.3, clearcoat: 1, iridescence: 0.5 });
    case 'sunburst': return fin(T, '#fff', 'vc');
    case 'natural': return fin(T, '#d0a46a', 'satin');
    case 'black': return fin(T, '#111113', 'gloss');
    case 'white': return fin(T, '#f4f2ec', 'gloss');
    case 'neon': return new THREE.MeshPhysicalMaterial({ name: 'acrylic', color: T.p, transparent: true, opacity: 0.55, roughness: 0.05, clearcoat: 1, emissive: T.p, emissiveIntensity: 0.25 });
    case 'relic': return fin(T, '#3f5a4e', 'worn');
    case 'gold': return new THREE.MeshPhysicalMaterial({ name: 'gold_sparkle', color: '#c8952e', metalness: 0.8, roughness: 0.25, clearcoat: 1 });
    case 'kids': return fin(T, T.p, 'plastic');
    default: return fin(T, T.p);
  }
}

/**
 * Drum along local +Y (batter head up): shell + hoops + heads + lugs. Returns group.
 * open = no bottom head (concert toms / bongos), lugs = count.
 */
function drum(parent, T, { r, h, at = [0, 0, 0], rot = [0, 0, 0], name = 'drum', lugs = 8, open = false, shell, wood = false, hoopMat } = {}) {
  const g = group(name, { parent, at, rot });
  const sm = shell ?? shellMat(T);
  const sg = lathe([[r * 0.985, 0], [r, 0], [r, h], [r * 0.985, h]], 40);
  if (T.burst && !shell) burst(sg, { cx: 0, cy: 0, rx: 1e9, ry: 1e9 });
  if (T.burst && !shell) { const p = sg.attributes.position; const col = new Float32Array(p.count * 3); const a = new THREE.Color('#d38b2c'), b = new THREE.Color('#1b0d06'), c = new THREE.Color(); for (let i = 0; i < p.count; i++) { const t = Math.abs(p.getY(i) / h - 0.5) * 2; c.copy(a).lerp(b, t ** 1.5); col.set([c.r, c.g, c.b], i * 3); } sg.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  const shellMesh = mesh(sg, sm, { parent: g, name: `${name}_shell` });
  shellMesh.material.side = THREE.DoubleSide;
  const hm = hoopMat ?? (wood ? woodMat(T, '#7a4a22') : hwMat(T));
  mesh(new THREE.TorusGeometry(r + 0.004, 0.005, 6, 40).rotateX(Math.PI / 2), hm, { parent: g, at: [0, h + 0.002, 0], name: `${name}_hoop` });
  mesh(new THREE.CylinderGeometry(r - 0.002, r - 0.002, 0.002, 40), headWhite(T), { parent: g, at: [0, h + 0.0, 0], name: `${name}_head` });
  if (!open) {
    mesh(new THREE.TorusGeometry(r + 0.004, 0.005, 6, 40).rotateX(Math.PI / 2), hm, { parent: g, at: [0, -0.002, 0] });
    mesh(new THREE.CylinderGeometry(r - 0.002, r - 0.002, 0.002, 40), headWhite(T), { parent: g, at: [0, 0, 0], name: `${name}_reso` });
  }
  if (lugs) {
    const lg = [];
    for (let i = 0; i < lugs; i++) {
      const a = (i / lugs) * Math.PI * 2;
      const x = Math.cos(a) * (r + 0.006), z = Math.sin(a) * (r + 0.006);
      if (T.round || T.trim === 'vintage') lg.push(new THREE.SphereGeometry(0.009, 8, 6).scale(1, 2.2, 1).translate(x, h / 2, z));
      else lg.push(new THREE.BoxGeometry(0.012, Math.min(h * 0.8, 0.06), 0.012).toNonIndexed().translate(x, open ? h * 0.75 : h / 2, z));
      lg.push(new THREE.CylinderGeometry(0.0025, 0.0025, open ? h * 0.5 : h, 5).translate(x * 1.002, open ? h * 0.75 : h / 2, z * 1.002));
    }
    merged(lg, hwMat(T), { parent: g, name: `${name}_lugs` });
  }
  return g;
}

/** Cymbal at a given centre (bell up). */
function cymbal(parent, T, r, at, { name = 'cymbal', tilt = 0.12, china = false } = {}) {
  const g = group(name, { parent, at, rot: [tilt, 0, 0] });
  const prof = china ? [[0.006, 0.02], [r * 0.18, 0.018], [r * 0.25, 0.006], [r * 0.85, 0.0], [r, 0.012], [r, 0.009], [r * 0.85, -0.003], [r * 0.25, 0.003], [r * 0.18, 0.015], [0.006, 0.017]] : [[0.006, 0.022], [r * 0.16, 0.02], [r * 0.22, 0.008], [r, 0.0], [r, -0.002], [r * 0.22, 0.005], [r * 0.16, 0.017], [0.006, 0.019]];
  mesh(lathe(prof, 48), bronze(T), { parent: g, name: `${name}_disc` });
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 10), M.matte('#1a1a1a', 0.7), { parent: g, at: [0, 0.026, 0], name: `${name}_felt` });
  return g;
}

/** Tripod stand with vertical pole up to height h (and optional boom). Returns top point. */
function tripod(parent, T, h, at = [0, 0, 0], { spread = 0.28, boom = null, name = 'stand' } = {}) {
  const sm = hwMat(T);
  const [x, , z] = at;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    bar([x, 0.22, z], [x + Math.cos(a) * spread, 0.012, z + Math.sin(a) * spread], 0.007, sm, parent, `${name}_leg`);
    mesh(new THREE.SphereGeometry(0.014, 8, 6), M.rubber(), { parent, at: [x + Math.cos(a) * spread, 0.012, z + Math.sin(a) * spread] });
  }
  bar([x, 0.18, z], [x, h, z], 0.011, sm, parent, `${name}_pole`);
  if (boom) { bar([x, h, z], [x + boom[0], h + boom[1], z + boom[2]], 0.008, sm, parent, `${name}_boom`); return [x + boom[0], h + boom[1], z + boom[2]]; }
  return [x, h, z];
}

/* ================================== DRUMS ================================== */
export const DRUM_VARIANTS = {
  'rock-kit': { kind: 'kit', bd: 0.28, toms: 2, floor: 1, cym: ['crash', 'ride'] },
  'jazz-kit': { kind: 'kit', bd: 0.23, toms: 1, floor: 1, cym: ['ride'], jazz: true, p: '#1f5f8a' },
  'electronic-kit': { kind: 'ekit', p: '#202226' },
  snare: { kind: 'snare', p: '#b8bcc4' },
  'bass-drum': { kind: 'bass' },
  'floor-tom': { kind: 'floor' },
  'ride-cymbal': { kind: 'cym' },
  'hi-hat': { kind: 'hihat' },
  bongos: { kind: 'bongos', p: '#8a4a22' },
  congas: { kind: 'congas', p: '#6b3a1e' },
  djembe: { kind: 'djembe', p: '#7a4524' },
  timpani: { kind: 'timpani' },
  cajon: { kind: 'cajon', p: '#c99a5b' },
  gong: { kind: 'gong' },
  steelpan: { kind: 'steelpan' },
};

function snareStand(parent, T, h, at) {
  const top = tripod(parent, T, h - 0.03, at, { spread: 0.25, name: 'snare_stand' });
  const sm = hwMat(T);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; bar(top, [top[0] + Math.cos(a) * 0.12, top[1] + 0.035, top[2] + Math.sin(a) * 0.12], 0.005, sm, parent, 'basket'); }
  return [top[0], top[1] + 0.035, top[2]];
}
function throne(parent, T, at) {
  const g = group('throne', { parent, at });
  tripod(g, T, 0.5, [0, 0, 0], { spread: 0.24, name: 'throne' });
  mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.08, 28), M.fabric(T.trim === 'white' ? '#e9e5dc' : T.neon ? T.s : '#151515'), { parent: g, at: [0, 0.54, 0], name: 'seat' });
}
function bassPedal(parent, T, at) {
  const g = group('pedal', { parent, at });
  mesh(roundedBox(0.08, 0.012, 0.26, 0.004), hwMat(T), { parent: g, at: [0, 0.006, 0], name: 'pedal_base' });
  mesh(roundedBox(0.07, 0.012, 0.2, 0.004), M.metal('#9aa0a6', 0.35), { parent: g, at: [0, 0.03, 0.02], rot: [0.2, 0, 0], name: 'footboard' });
  for (const s of [-1, 1]) bar([s * 0.04, 0.0, -0.12], [s * 0.04, 0.2, -0.12], 0.006, hwMat(T), g, 'pedal_post');
  const beat = group('beater', { parent: g, at: [0, 0.2, -0.12] });
  bar([-0.04, 0, 0], [0.04, 0, 0], 0.006, hwMat(T), beat, 'beater_axle');
  bar([0, 0, 0], [0, 0.17, 0.05], 0.004, M.metal('#c9ccd2', 0.2), beat, 'beater_shaft');
  mesh(new THREE.SphereGeometry(0.025, 12, 8).scale(1, 1, 0.8), M.matte('#efe9dc', 0.8), { parent: beat, at: [0, 0.17, 0.055], name: 'beater_head' });
  return beat;
}

function buildKit(root, T, V) {
  const K = group('kit', { parent: root });
  const anims = [];
  const kids = T.kids;
  const round = T.round || V.jazz;
  const bdR = kids ? 0.2 : round ? 0.23 : V.bd;
  const bdD = kids ? 0.3 : round ? 0.36 : 0.45;
  const doubleBass = T.trim === 'black' && !V.jazz;
  const bdXs = doubleBass ? [-0.3, 0.3] : [0];
  const bds = [];
  for (const bx of bdXs) {
    const bd = drum(K, T, { r: bdR, h: bdD, at: [bx, bdR + 0.03, bdD], rot: [-Math.PI / 2, 0, 0], name: bds.length ? 'bass_drum2' : 'bass_drum', lugs: 10, wood: T.round || T.trim === 'natural' });
    bds.push(bd);
    if (!T.wear) { const em = brandEmblem(bdR * 0.7); em.position.set(bx, bdR + 0.03, bdD + 0.0012); K.add(em); }
    else mesh(new THREE.RingGeometry(0.05, 0.065, 28), M.matte('#111', 0.5), { parent: K, at: [bx + 0.08, bdR - 0.05, bdD + 0.0012], name: 'port_ring' });
    for (const s of [-1, 1]) bar([bx + s * bdR * 0.8, bdR * 0.6, bdD * 0.8], [bx + s * (bdR + 0.12), 0.01, bdD + 0.05], 0.006, hwMat(T), K, 'spur');
    for (const s of [-1, 1]) mesh(roundedBox(0.04, 0.04, 0.06, 0.01), M.rubber(), { parent: K, at: [bx + s * bdR * 0.6, 0.02, 0.06], name: 'bd_foot' });
    const beat = bassPedal(K, T, [bx, 0, -0.02]);
    anims.push(rotateTrack(beat, 'x', 0.5, (t) => 0.5 * Math.max(0, Math.sin(t * Math.PI * 2)), 16));
  }
  // rack toms on a mount above the bass drum
  const nT = kids ? 1 : doubleBass ? 3 : round ? 1 : V.toms;
  const mountTop = bdR * 2 + 0.03;
  for (let i = 0; i < nT; i++) {
    const x = (i - (nT - 1) / 2) * 0.27;
    const r = 0.13 - i * 0.012;
    const ty = mountTop + 0.12;
    bar([0, mountTop - 0.01, bdD * 0.45], [x * 0.7, ty - 0.03, bdD * 0.3], 0.009, hwMat(T), K, 'tom_arm');
    const tom = drum(K, T, { r, h: 0.2 - i * 0.02, at: [x, ty - 0.02, bdD * 0.25], rot: [0.35, 0, -x * 0.5], name: `tom_${i}`, lugs: 6 });
    void tom;
  }
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 12), hwMat(T), { parent: K, at: [0, mountTop - 0.02, bdD * 0.45], name: 'tom_mount' });
  // floor tom with legs
  if (V.floor) {
    const ft = drum(K, T, { r: kids ? 0.15 : 0.19, h: kids ? 0.25 : 0.38, at: [0.55, 0.2, 0.0], name: 'floor_tom', lugs: 8 });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.4; const rr = (kids ? 0.15 : 0.19) + 0.015; bar([0.55 + Math.cos(a) * rr, 0.3, Math.sin(a) * rr], [0.55 + Math.cos(a) * (rr + 0.04), 0.0, Math.sin(a) * (rr + 0.04)], 0.007, hwMat(T), K, 'ft_leg'); }
    void ft;
  }
  // snare on stand
  const sp = snareStand(K, T, kids ? 0.5 : 0.62, [-0.42, 0, -0.22]);
  drum(K, T, { r: 0.18, h: 0.13, at: sp, name: 'snare', lugs: 10, shell: T.trim ? undefined : M.chrome() });
  // hi-hat
  const hx = -0.75;
  tripod(K, T, 0.92, [hx, 0, -0.1], { spread: 0.24, name: 'hihat' });
  mesh(roundedBox(0.08, 0.01, 0.22, 0.004), hwMat(T), { parent: K, at: [hx, 0.005, 0.1], name: 'hh_pedal' });
  bar([hx, 0.01, 0.0], [hx, 0.2, -0.1], 0.005, hwMat(T), K, 'hh_rod');
  cymbal(K, T, 0.18, [hx, 0.92, -0.1], { name: 'hh_bottom', tilt: 0 });
  const top = cymbal(K, T, 0.18, [hx, 0.947, -0.1], { name: 'hh_top', tilt: 0 });
  top.rotation.x = Math.PI;
  top.position.y += 0.0;
  bar([hx, 0.92, -0.1], [hx, 1.05, -0.1], 0.004, M.chrome(), K, 'hh_clutch');
  // cymbals on boom stands
  const cyms = kids ? ['crash'] : T.ornate ? ['crash', 'ride', 'china', 'splash'] : round ? ['ride'] : V.cym;
  const spots = { crash: [-0.45, 0.35, -1, 0.2], ride: [0.85, 0.3, 1, 0.24], china: [0.95, -0.1, 1, 0.2], splash: [-0.2, 0.55, -1, 0.12] };
  cyms.forEach((c, i) => {
    const [x, z, side, r] = spots[c];
    const ht = (c === 'ride' ? 1.1 : 1.35) * (kids ? 0.75 : 1);
    const tp = tripod(K, T, ht - 0.25, [x + side * 0.15, 0, z - 0.25], { boom: [-side * 0.15, 0.25, 0.25], name: `${c}_stand` });
    const cy = cymbal(K, T, r, [tp[0], tp[1] + 0.006, tp[2]], { name: `cym_${i}`, tilt: 0.18, china: c === 'china' });
    anims.push(rotateTrack(cy, 'z', 1, (t) => 0.06 * wave(t, 2) * (1 - t), 24));
  });
  throne(K, T, [-0.05, 0, -0.75]);
  if (T.neon) { const led = lampGroup('kit_leds', 'blue'); for (const bx of bdXs) led.add(K, { at: [bx, 0.03, bdD * 0.5], normal: [0, 1, 0], w: 0.05, h: 0.05, depth: 0.004, shape: 'round', bezel: false, glowSize: 0.5 }); anims.led = true; }
  return anims;
}

export function createDrum(options = {}) {
  const { o, variant, T, V } = setup(options, DRUM_VARIANTS, 'drum');
  const root = group(`drum-${variant}`);
  const anims = [];
  const k = T.kids ? 0.7 : 1;
  const G = group('drums', { parent: root });
  if (V.kind === 'kit') {
    const a = buildKit(G, T, V);
    anims.push(clip('play', 1, a));
    if (a.led) anims.push(clip('on', 1, lampTracks('kit_leds', 3, { blink: 2 })));
  } else if (V.kind === 'ekit') {
    // electronic kit: rack frame with mesh pads + module
    const sm = hwMat(T);
    const fm = T.trim ? fin(T, T.trim === 'neon' ? '#141418' : T.p) : M.metal('#1c1d20', 0.4);
    for (const x of [-0.45, 0.45]) { bar([x, 0, 0], [x, 0.85, 0], 0.02, fm, G, 'rack_post'); bar([x, 0.0, -0.15], [x, 0.0, 0.15], 0.018, fm, G, 'rack_foot'); }
    bar([-0.45, 0.8, 0], [0.45, 0.8, 0], 0.018, fm, G, 'rack_bar');
    bar([-0.45, 0.55, 0], [0.45, 0.55, 0], 0.018, fm, G, 'rack_bar2');
    const padM = T.trim === 'white' ? M.matte('#e8e8e8', 0.7) : M.matte('#2a2b2e', 0.85);
    const pads = [[-0.25, 0.87, 0.18, 0.11], [0.0, 0.88, 0.2, 0.11], [0.25, 0.87, 0.18, 0.11], [-0.35, 0.62, 0.3, 0.13], [0.38, 0.62, 0.3, 0.13]];
    const shells = shellMat(T, '#2a2b2e');
    const padsG = [];
    pads.forEach(([x, y, z, r], i) => {
      bar([x, i < 3 ? 0.8 : 0.55, 0], [x, y - 0.02, z], 0.008, sm, G, 'pad_arm');
      const p = drum(G, T, { r, h: 0.05, at: [x, y - 0.02, z], rot: [0.25, 0, 0], name: `pad_${i}`, lugs: 0, shell: shells });
      p.getObjectByName(`pad_${i}_head`).material = padM;
      padsG.push(p);
    });
    for (const [x, r] of [[-0.5, 0.15], [0.5, 0.17]]) { bar([x * 0.9, 0.85, 0], [x, 1.05, 0.1], 0.008, sm, G); cymbal(G, T, r, [x, 1.056, 0.1], { name: `ecym_${x > 0 ? 'r' : 'l'}`, tilt: 0.1 }).children[0].material = M.matte('#1a1a1a', 0.5); }
    mesh(roundedBox(0.2, 0.12, 0.05, 0.01), M.plastic('#141414', 0.4), { parent: G, at: [0.47, 0.95, -0.02], name: 'module' });
    const led = lampGroup('ekit_leds', T.neon ? 'blue' : 'green');
    for (let i = 0; i < 3; i++) led.add(G, { at: [0.42 + i * 0.05, 0.98, 0.0055], normal: [0, 0, 1], w: 0.01, h: 0.01, depth: 0.003, shape: 'round', bezel: false, glowSize: 0.06 });
    drum(G, T, { r: 0.12, h: 0.2, at: [0, 0.22, 0.25], rot: [-Math.PI / 2, 0, 0], name: 'kick_pad', lugs: 0, shell: shells });
    mesh(roundedBox(0.2, 0.2, 0.12, 0.01), fm, { parent: G, at: [0, 0.1, 0.18], name: 'kick_tower' });
    bassPedal(G, T, [0, 0, 0.05 + 0.08]).position.z = -0.03;
    throne(G, T, [0, 0, -0.55]);
    anims.push(clip('play', 0.6, padsG.slice(0, 3).map((p, i) => moveTrack(p, 0.6, (t) => [0, -0.01 * Math.max(0, Math.sin((t + i * 0.3) * Math.PI * 2)), 0]))));
    anims.push(clip('on', 1, lampTracks('ekit_leds', 2.4)));
  } else if (V.kind === 'snare' || V.kind === 'floor' || V.kind === 'bass') {
    if (V.kind === 'snare') {
      const sp = snareStand(G, T, 0.62 * k, [0, 0, 0]);
      const d = drum(G, T, { r: 0.18 * k, h: 0.14 * k, at: sp, name: 'snare', lugs: T.ornate ? 12 : 10, shell: T.trim ? undefined : M.chrome() });
      // sticks resting across the head
      for (const s of [-1, 1]) tube([sp[0] - 0.2, sp[1] + 0.145 * k + 0.008, sp[2] + s * 0.04], [sp[0] + 0.2, sp[1] + 0.145 * k + 0.008, sp[2] + s * 0.04 + 0.02], 0.007, M.wood('#d9b98a'), { parent: G, name: 'stick' });
      anims.push(clip('bounce', 0.5, [moveTrack(d, 0.5, (t) => [0, 0.004 * Math.abs(Math.sin(t * Math.PI * 2)), 0])]));
    } else if (V.kind === 'floor') {
      const r = 0.2 * k;
      const d = drum(G, T, { r, h: 0.4 * k, at: [0, 0.18 * k, 0], name: 'floor_tom', lugs: 8 });
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.4; bar([Math.cos(a) * (r + 0.015), 0.3 * k, Math.sin(a) * (r + 0.015)], [Math.cos(a) * (r + 0.06), 0.0, Math.sin(a) * (r + 0.06)], 0.008, hwMat(T), G, 'ft_leg'); }
      anims.push(clip('bounce', 0.5, [moveTrack(d, 0.5, (t) => [0, 0.005 * Math.abs(Math.sin(t * Math.PI * 2)), 0])]));
    } else {
      const r = (T.round ? 0.23 : 0.28) * k, h = 0.42 * k;
      const d = drum(G, T, { r, h, at: [0, r + 0.03, h], rot: [-Math.PI / 2, 0, 0], name: 'bass_drum', lugs: 10 });
      const em = brandEmblem(r * 0.7); em.position.set(0, r + 0.03, h + 0.0012); G.add(em);
      for (const s of [-1, 1]) { bar([s * r * 0.8, r * 0.6, h * 0.8], [s * (r + 0.12), 0.01, h + 0.05], 0.006, hwMat(T), G, 'spur'); mesh(roundedBox(0.04, 0.04, 0.06, 0.01), M.rubber(), { parent: G, at: [s * r * 0.6, 0.02, 0.06] }); }
      const beat = bassPedal(G, T, [0, 0, -0.02]);
      anims.push(clip('play', 0.5, [rotateTrack(beat, 'x', 0.5, (t) => 0.5 * Math.max(0, Math.sin(t * Math.PI * 2)), 16), scaleTrack(d, 0.5, (t) => { const s = 1 + 0.01 * Math.max(0, Math.sin(t * Math.PI * 2)); return [s, 1, s]; })]));
    }
  } else if (V.kind === 'cym' || V.kind === 'hihat') {
    if (V.kind === 'cym') {
      const tp = tripod(G, T, 1.0 * k, [0, 0, 0], { boom: [0.2, 0.2, 0.15], name: 'cym' });
      const cy = cymbal(G, T, (T.ornate ? 0.28 : 0.25) * k, [tp[0], tp[1] + 0.006, tp[2]], { name: 'ride', china: T.sharp === 2 });
      anims.push(clip('play', 1, [rotateTrack(cy, 'z', 1, (t) => 0.08 * wave(t, 2) * (1 - t), 24)]));
    } else {
      tripod(G, T, 0.92 * k, [0, 0, 0], { spread: 0.24, name: 'hihat' });
      mesh(roundedBox(0.08, 0.01, 0.22, 0.004), hwMat(T), { parent: G, at: [0, 0.005, 0.2], name: 'hh_pedal' });
      bar([0, 0.01, 0.1], [0, 0.2, 0], 0.005, hwMat(T), G, 'hh_rod');
      cymbal(G, T, 0.18 * k, [0, 0.92 * k, 0], { name: 'hh_bottom', tilt: 0 });
      const top = cymbal(G, T, 0.18 * k, [0, 0.92 * k + 0.027, 0], { name: 'hh_top', tilt: 0 });
      top.rotation.x = Math.PI;
      bar([0, 0.92 * k, 0], [0, 0.92 * k + 0.13, 0], 0.004, M.chrome(), G, 'hh_clutch');
      anims.push(clip('play', 0.5, [moveTrack(top, 0.5, (t) => [0, 0.012 * (0.5 + 0.5 * Math.cos(t * Math.PI * 2)), 0])]));
    }
  } else if (V.kind === 'bongos' || V.kind === 'congas' || V.kind === 'djembe') {
    const wm = T.trim ? shellMat(T, V.p) : M.wood(V.p);
    const skin = T.trim === 'black' ? M.matte('#1a1a1a', 0.6) : T.neon ? fin(T, T.s, 'neon') : M.matte('#e2cfa6', 0.65);
    if (V.kind === 'djembe') {
      const H = 0.6 * k, R = 0.16 * k;
      const prof = [[R * 0.62, 0], [R * 0.66, 0.02], [R * 0.48, H * 0.35], [R * 0.42, H * 0.45], [R * 0.7, H * 0.65], [R * 0.95, H * 0.88], [R, H], [R * 0.94, H], [R * 0.9, H * 0.9], [R * 0.64, H * 0.64], [R * 0.36, H * 0.45], [R * 0.42, H * 0.33], [R * 0.58, 0.02]];
      const body = mesh(lathe(prof, 40), wm, { parent: G, name: 'djembe_body' });
      if (T.burst) burst(body.geometry, { rx: 1e9, ry: 1e9 });
      mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.01, 0.006, 36), skin, { parent: G, at: [0, H + 0.002, 0], name: 'djembe_head' });
      mesh(new THREE.TorusGeometry(R * 1.01, 0.008, 6, 36).rotateX(Math.PI / 2), M.matte('#d9c7a0', 0.8), { parent: G, at: [0, H - 0.01, 0], name: 'top_ring' });
      mesh(new THREE.TorusGeometry(R * 0.7, 0.008, 6, 36).rotateX(Math.PI / 2), M.matte('#d9c7a0', 0.8), { parent: G, at: [0, H * 0.66, 0], name: 'low_ring' });
      const ropes = [];
      const nr = T.kids ? 12 : 24;
      for (let i = 0; i < nr; i++) { const a = (i / nr) * Math.PI * 2, b = ((i + 0.5) / nr) * Math.PI * 2; ropes.push(segGeo([Math.cos(a) * R * 1.0, H - 0.01, Math.sin(a) * R * 1.0], [Math.cos(b) * R * 0.71, H * 0.66, Math.sin(b) * R * 0.71], 0.003, 4)); ropes.push(segGeo([Math.cos(b) * R * 0.71, H * 0.66, Math.sin(b) * R * 0.71], [Math.cos(a + (Math.PI * 2) / nr) * R * 1.0, H - 0.01, Math.sin(a + (Math.PI * 2) / nr) * R * 1.0], 0.003, 4)); }
      merged(ropes, M.matte(T.neon ? T.a : '#e9d9b0', 0.8), { parent: G, name: 'ropes' });
      anims.push(clip('bounce', 0.5, [scaleTrack(G.getObjectByName('djembe_head'), 0.5, (t) => [1, 1 + 1.5 * Math.max(0, Math.sin(t * Math.PI * 2)), 1])]));
    } else if (V.kind === 'congas') {
      const sizes = T.kids ? [0.11] : T.ornate ? [0.13, 0.14, 0.15] : [0.13, 0.145];
      sizes.forEach((r0, i) => {
        const r = r0 * k, H = 0.75 * k;
        const x = (i - (sizes.length - 1) / 2) * 0.34;
        const prof = [[r * 0.75, 0.0], [r * 0.95, H * 0.3], [r * 1.05, H * 0.45], [r * 0.98, H * 0.75], [r * 0.92, H], [r * 0.88, H], [r * 0.94, H * 0.75], [r * 1.0, H * 0.45], [r * 0.9, H * 0.3], [r * 0.7, 0.0]];
        const body = mesh(lathe(prof, 36), wm, { parent: G, at: [x, 0.04, 0], name: `conga_${i}` });
        void body;
        mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.004, 32), skin, { parent: G, at: [x, H + 0.042, 0], name: `conga_head_${i}` });
        mesh(new THREE.TorusGeometry(r * 0.92, 0.008, 6, 32).rotateX(Math.PI / 2), hwMat(T), { parent: G, at: [x, H + 0.036, 0] });
        const lg = [];
        for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2; lg.push(segGeo([x + Math.cos(a) * r * 0.95, H + 0.03, Math.sin(a) * r * 0.95], [x + Math.cos(a) * r * 1.07, H * 0.5, Math.sin(a) * r * 1.07], 0.004, 5)); }
        merged(lg, hwMat(T), { parent: G, name: `conga_rods_${i}` });
        mesh(new THREE.TorusGeometry(r * 0.78, 0.015, 6, 28).rotateX(Math.PI / 2), M.rubber(), { parent: G, at: [x, 0.015, 0], name: `conga_base_${i}` });
        mesh(new THREE.CylinderGeometry(r * 0.78, r * 0.78, 0.03, 28, 1, true), M.rubber(), { parent: G, at: [x, 0.025, 0] });
      });
      anims.push(clip('bounce', 0.6, sizes.map((_, i) => scaleTrack(G.getObjectByName(`conga_head_${i}`), 0.6, (t) => [1, 1 + 2 * Math.max(0, Math.sin((t + i * 0.5) * Math.PI * 2)), 1]))));
    } else {
      // bongos on a short stand
      const st = tripod(G, T, 0.62 * k, [0, 0, 0], { spread: 0.22, name: 'bongo_stand' });
      bar([st[0] - 0.12, st[1], 0], [st[0] + 0.12, st[1], 0], 0.01, hwMat(T), G, 'bongo_bar');
      const sz = [[-0.1, 0.09], [0.1, 0.11]];
      sz.forEach(([x, r], i) => {
        const prof = [[r * 0.8, 0], [r, 0.15], [r * 0.96, 0.15], [r * 0.78, 0.01]];
        mesh(lathe(prof.map(([a, b]) => [a * k, b * k]), 28), wm, { parent: G, at: [x * k, st[1] - 0.05, 0], name: `bongo_${i}` });
        mesh(new THREE.CylinderGeometry(r * k, r * k, 0.004, 28), skin, { parent: G, at: [x * k, st[1] - 0.05 + 0.152 * k, 0], name: `bongo_head_${i}` });
        mesh(new THREE.TorusGeometry(r * k + 0.003, 0.006, 6, 28).rotateX(Math.PI / 2), hwMat(T), { parent: G, at: [x * k, st[1] - 0.05 + 0.147 * k, 0] });
      });
      mesh(roundedBox(0.04, 0.1, 0.05, 0.008), wm, { parent: G, at: [0, st[1] + 0.01, 0], name: 'bongo_bridge' });
      anims.push(clip('bounce', 0.4, [0, 1].map((i) => scaleTrack(G.getObjectByName(`bongo_head_${i}`), 0.4, (t) => [1, 1 + 2 * Math.max(0, Math.sin((t + i * 0.5) * Math.PI * 2)), 1]))));
    }
  } else if (V.kind === 'timpani') {
    const sizes = T.kids ? [0.3] : T.ornate ? [0.32, 0.36, 0.4] : [0.34, 0.38];
    const cu = T.trim ? (T.trim === 'black' ? fin(T, '#141414', 'gloss') : T.trim === 'white' ? fin(T, '#f1eee6', 'gloss') : T.trim === 'gold' ? hwMat(T) : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.p, 'plastic') : T.trim === 'natural' ? M.wood('#c99a5b') : T.wear ? M.metal('#7f6040', 0.6) : M.metal('#b8673a', 0.25)) : new THREE.MeshStandardMaterial({ name: 'copper', color: '#c37244', metalness: 1, roughness: 0.22 });
    const heads = [];
    sizes.forEach((r0, i) => {
      const r = r0 * k, x = (i - (sizes.length - 1) / 2) * (r * 2 + 0.12);
      const top = 0.8 * k;
      const bowl = mesh(lathe([[0.02, top - r * 0.9], [r * 0.55, top - r * 0.82], [r * 0.85, top - r * 0.55], [r, top - r * 0.15], [r, top], [r * 0.985, top], [r * 0.985, top - r * 0.15], [r * 0.84, top - r * 0.54], [r * 0.54, top - r * 0.8], [0.02, top - r * 0.88]], 40), cu, { parent: G, at: [x, 0, 0], name: `kettle_${i}` });
      bowl.material.side = THREE.DoubleSide;
      heads.push(mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.004, 40), headWhite(T), { parent: G, at: [x, top + 0.002, 0], name: `timp_head_${i}` }));
      mesh(new THREE.TorusGeometry(r * 1.02, 0.01, 6, 40).rotateX(Math.PI / 2), hwMat(T), { parent: G, at: [x, top - 0.004, 0] });
      for (let j = 0; j < 3; j++) { const a = (j / 3) * Math.PI * 2 + 0.3; bar([x + Math.cos(a) * r * 0.8, top - r * 0.5, Math.sin(a) * r * 0.8], [x + Math.cos(a) * r * 0.9, 0.02, Math.sin(a) * r * 0.9], 0.012, hwMat(T), G, 'timp_leg'); mesh(new THREE.SphereGeometry(0.025, 10, 8), M.rubber(), { parent: G, at: [x + Math.cos(a) * r * 0.9, 0.025, Math.sin(a) * r * 0.9] }); }
      mesh(roundedBox(0.12, 0.03, 0.25, 0.01), hwMat(T), { parent: G, at: [x, 0.05, r * 0.85], rot: [0.2, 0, 0], name: 'timp_pedal' });
      bar([x, 0.06, r * 0.75], [x, top - r * 0.88, 0], 0.01, hwMat(T), G, 'pedal_rod');
    });
    anims.push(clip('bounce', 0.6, heads.map((h, i) => scaleTrack(h, 0.6, (t) => [1, 1 + 2 * Math.max(0, Math.sin((t + i * 0.4) * Math.PI * 2)), 1]))));
  } else if (V.kind === 'cajon') {
    const W = 0.3 * k, H = 0.48 * k, Dd = 0.3 * k, w = 0.012;
    const wm = T.trim ? shellMat(T, V.p) : M.wood('#c99a5b');
    const C = group('cajon', { parent: G });
    // hollow box: 5 walls + front tapa
    mesh(roundedBox(W, w, Dd, 0.004), wm, { parent: C, at: [0, w / 2, 0], name: 'cajon_bottom' });
    mesh(roundedBox(W, w, Dd, 0.004), wm, { parent: C, at: [0, H - w / 2, 0], name: 'cajon_top' });
    for (const s of [-1, 1]) mesh(roundedBox(w, H, Dd, 0.004), wm, { parent: C, at: [s * (W / 2 - w / 2), H / 2, 0], name: 'cajon_side' });
    const back = plate([[-W / 2 + w, w], [W / 2 - w, w], [W / 2 - w, H - w], [-W / 2 + w, H - w]], w, { holes: [Array.from({ length: 20 }, (_, i) => [Math.cos((i / 20) * Math.PI * 2) * 0.05 * k, H * 0.6 + Math.sin((i / 20) * Math.PI * 2) * 0.05 * k])], bevel: 0.001 });
    mesh(back, wm, { parent: C, at: [0, 0, -Dd / 2 + w / 2], name: 'cajon_back' });
    const tapa = T.burst ? fin(T, T.edge) : T.trim === 'black' ? M.matte('#1a1a1a', 0.5) : T.neon ? fin(T, T.s, 'neon') : M.wood(T.round ? '#5b3a24' : '#3b2318');
    mesh(roundedBox(W, H, 0.004, 0.002), tapa, { parent: C, at: [0, H / 2, Dd / 2 - 0.002], name: 'tapa' });
    const sc = [];
    for (const sx of [-1, 1]) for (const sy of [0.06, 0.5, 0.94]) sc.push(new THREE.SphereGeometry(0.004, 6, 4).translate(sx * (W / 2 - 0.012), H * sy, Dd / 2 + 0.0005));
    merged(sc, hwMat(T), { parent: C, name: 'screws' });
    if (T.ornate || !T.trim) { const em = brandEmblem(0.05 * k); em.position.set(0, H * 0.82, Dd / 2 + 0.0003); C.add(em); }
    anims.push(clip('bounce', 0.5, [scaleTrack(C, 0.5, (t) => { const s = 1 + 0.01 * Math.max(0, Math.sin(t * Math.PI * 2)); return [s, 1, s]; })]));
  } else if (V.kind === 'gong') {
    const R = (T.ornate ? 0.5 : 0.42) * k;
    const fm = T.trim ? woodMat(T, '#3a1a10') : new THREE.MeshPhysicalMaterial({ name: 'lacquer', color: '#6a1010', roughness: 0.3, clearcoat: 1 });
    const fh = R * 2 + 0.35;
    for (const s of [-1, 1]) { mesh(roundedBox(0.07, fh, 0.07, 0.01), fm, { parent: G, at: [s * (R + 0.15), fh / 2 + 0.05, 0], name: 'gong_post' }); mesh(roundedBox(0.12, 0.05, 0.5, 0.01), fm, { parent: G, at: [s * (R + 0.15), 0.025, 0], name: 'gong_foot' }); }
    const beamShape = T.sharp ? roundedBox(R * 2 + 0.5, 0.08, 0.09, 0.01) : roundedBox(R * 2 + 0.6, 0.09, 0.09, 0.03);
    mesh(beamShape, fm, { parent: G, at: [0, fh + 0.09, 0], name: 'gong_beam' });
    if (!T.sharp && !T.kids) for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.06, 0.12, 4).rotateZ(s * 1.2), fm, { parent: G, at: [s * (R + 0.33), fh + 0.11, 0], name: 'beam_tip' });
    const gy = fh - R - 0.05;
    const gong = group('gong_disc', { parent: G, at: [0, gy, 0] });
    mesh(lathe([[0, 0.02], [R * 0.25, 0.02], [R * 0.3, 0.0], [R * 0.95, -0.005], [R, -0.04], [R * 0.985, -0.04], [R * 0.94, -0.01], [R * 0.3, -0.006], [R * 0.24, 0.014], [0, 0.014]], 48).rotateX(Math.PI / 2), bronze(T), { parent: gong, name: 'gong' });
    for (const s of [-1, 1]) { tube([s * R * 0.6, R * 0.78, -0.02], [s * R * 0.4, fh + 0.05 - gy, 0], 0.004, M.matte('#c0262c', 0.7), { parent: gong, name: 'gong_cord' }); }
    anims.push(clip('play', 3, [rotateTrack(gong, 'x', 3, (t) => 0.08 * wave(t, 1) * (1 - t), 24)]));
    // mallet leaning on post
    tube([R + 0.06, 0.0, 0.15], [R + 0.11, 0.55, 0.035], 0.01, M.wood('#d9b98a'), { parent: G, name: 'mallet_shaft' });
    mesh(new THREE.SphereGeometry(0.05, 14, 10), M.fabric('#efe6cf'), { parent: G, at: [R + 0.06, 0.05, 0.15], name: 'mallet_head' });
  } else {
    // steel pan on a stand
    const R = 0.29 * k;
    const st = tripod(G, T, 0.78 * k, [0, 0, 0], { spread: 0.3, name: 'pan_stand' });
    const sm = hwMat(T);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; bar([st[0], st[1], st[2]], [Math.cos(a) * R * 0.95, st[1] + 0.08, Math.sin(a) * R * 0.95], 0.006, sm, G, 'pan_arm'); }
    const panM = T.trim ? (T.trim === 'gold' ? hwMat(T) : T.kids ? fin(T, T.p, 'plastic') : T.trim === 'black' || T.trim === 'white' || T.neon ? fin(T, T.p) : T.wear ? M.metal('#8a7a60', 0.6) : M.chrome()) : M.chrome();
    const pan = mesh(lathe([[0, 0.07], [R * 0.6, 0.085], [R * 0.95, 0.12], [R, 0.14], [R, -0.06], [R * 0.99, -0.06], [R * 0.99, 0.135], [R * 0.94, 0.115], [R * 0.6, 0.078], [0, 0.065]], 48), panM, { parent: G, at: [0, st[1] + 0.02, 0], name: 'pan' });
    pan.material.side = THREE.DoubleSide;
    const notes = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; notes.push(new THREE.SphereGeometry(0.045 * k, 14, 6, 0, Math.PI * 2, 0, 0.6).scale(1, 0.25, 1).translate(Math.cos(a) * R * 0.72, st[1] + 0.02 + 0.102, Math.sin(a) * R * 0.72)); }
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; notes.push(new THREE.SphereGeometry(0.035 * k, 14, 6, 0, Math.PI * 2, 0, 0.6).scale(1, 0.25, 1).translate(Math.cos(a) * R * 0.32, st[1] + 0.02 + 0.078, Math.sin(a) * R * 0.32)); }
    merged(notes, T.neon ? fin(T, T.s, 'neon') : M.metal('#e8e8ec', 0.1), { parent: G, name: 'notes' });
    anims.push(clip('play', 1, [rotateTrack(pan, 'x', 1, (t) => 0.01 * wave(t, 4), 24)]));
  }
  return done(root, 'drum', variant, o, anims);
}

/* =============================== PERCUSSION =============================== */
export const PERC_VARIANTS = {
  xylophone: { kind: 'bars', n: 22, len: [0.38, 0.17], res: 0.14, wood: true },
  marimba: { kind: 'bars', n: 30, len: [0.5, 0.2], res: 0.7, wood: true, wide: true },
  glockenspiel: { kind: 'glock', n: 16 },
  vibraphone: { kind: 'bars', n: 22, len: [0.36, 0.2], res: 0.45, wood: false },
  triangle: { kind: 'triangle' },
  tambourine: { kind: 'tambourine' },
  harp: { kind: 'harp', H: 1.82, n: 34 },
  'lever-harp': { kind: 'harp', H: 1.2, n: 26, lever: true },
  metronome: { kind: 'metronome' },
  'tubular-bells': { kind: 'tubes' },
  maracas: { kind: 'maracas' },
};

function barMat(T, wood) {
  if (T.trim === 'gold') return hwMat(T);
  if (T.kids) return null;
  if (T.neon) return fin(T, T.p, 'neon');
  if (wood) return T.trim === 'natural' ? M.wood('#d9b98a') : T.trim === 'black' ? fin(T, '#1a1412', 'gloss') : T.trim === 'white' ? fin(T, '#f2efe6', 'gloss') : T.wear ? M.wood('#6a4a34') : M.wood('#7a3a22');
  return T.trim === 'black' ? M.metal('#2a2b2e', 0.3) : M.metal('#d8d4c8', 0.22);
}

export function createPercussion(options = {}) {
  const { o, variant, T, V } = setup(options, PERC_VARIANTS, 'percussion');
  const root = group(`percussion-${variant}`);
  const anims = [];
  const k = T.kids ? 0.65 : 1;
  const G = group('perc', { parent: root });
  const frameM = T.trim ? woodMat(T, '#5b3a24') : M.wood('#4a2c18');
  if (V.kind === 'bars' || V.kind === 'glock') {
    const glock = V.kind === 'glock';
    const n = T.kids ? Math.min(V.n ?? 16, 12) : V.n ?? 16;
    const lens = glock ? [0.2, 0.11] : V.len;
    const bw = glock ? 0.03 : V.wide ? 0.055 : 0.042;
    const gap = 0.008;
    const W = n * (bw + gap);
    const H = glock ? 0.78 : 0.86;
    const rainbow = ['#ff3b3b', '#ff9f1a', '#ffe03b', '#3bd16f', '#2b9dff', '#7a4dff', '#ff4dc4'];
    const bm = barMat(T, V.wood);
    // frame (trapezoid rails) + legs
    const yb = H * k;
    const rail = (z0, z1) => { tube([-W / 2 - 0.04, yb - 0.02, z0], [W / 2 + 0.04, yb - 0.02, z1], 0.015, frameM, { parent: G, name: 'rail' }); };
    const halfL = (t) => (lens[0] + (lens[1] - lens[0]) * t) / 2;
    // naturals row (front) and accidentals row (back, raised)
    const nat = [], acc = [];
    const rowZ = { n: 0.12, a: -0.2 };
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = -W / 2 + (i + 0.5) * (bw + gap);
      const l = halfL(t) * 2;
      nat.push({ x, l, i });
      if (BLACK_AFTER_SET.has(i % 7) && i < n - 1) acc.push({ x: x + (bw + gap) / 2, l: l * 0.92, i });
    }
    rail(rowZ.n - halfL(0) * 0.55, rowZ.n - halfL(1) * 0.55);
    rail(rowZ.n + halfL(0) * 0.55, rowZ.n + halfL(1) * 0.55);
    rail(rowZ.a - halfL(0) * 0.55 * 0.92, rowZ.a - halfL(1) * 0.55 * 0.92);
    rail(rowZ.a + halfL(0) * 0.55 * 0.92, rowZ.a + halfL(1) * 0.55 * 0.92);
    const mkBars = (list, z0, y, name) => {
      if (bm) merged(list.map((b) => roundedBox(bw, glock ? 0.008 : 0.022, b.l, 0.004, 1).translate(b.x, y, z0)), bm, { parent: G, name });
      else rainbow.forEach((c, ci) => { const gs = list.filter((b) => b.i % 7 === ci).map((b) => roundedBox(bw, 0.022, b.l, 0.004, 1).translate(b.x, y, z0)); if (gs.length) merged(gs, fin(T, c, 'plastic'), { parent: G, name: `${name}_${ci}` }); });
    };
    const yBar = yb - 0.02 + 0.015 + (glock ? 0.004 : 0.011);
    mkBars(nat, rowZ.n, yBar, 'naturals');
    mkBars(acc, rowZ.a, yBar, 'accidentals');
    // posts/cord pins between bars
    const pins = [];
    for (const b of nat) for (const s of [-1, 1]) pins.push(new THREE.CylinderGeometry(0.0025, 0.0025, 0.03, 5).translate(b.x + (bw + gap) / 2, yb - 0.005, rowZ.n + s * b.l * 0.28));
    merged(pins, M.metal('#c4c0b4', 0.3), { parent: G, name: 'pins' });
    // resonators (tubes under bars)
    if (V.res && !glock) {
      const rm = T.trim === 'gold' || !T.trim ? M.metal(V.wood ? '#c9a24a' : '#c9ccd2', 0.25) : T.trim === 'black' ? M.metal('#202022', 0.3) : T.neon ? fin(T, T.s, 'neon') : T.kids ? fin(T, T.s, 'plastic') : hwMat(T);
      const tubes = [];
      for (const [list, z] of [[nat, rowZ.n], [acc, rowZ.a]]) for (const b of list) { const t = b.i / (n - 1); const L = Math.min(yb - 0.25, V.res * k * (1 - 0.7 * t) + 0.05); tubes.push(new THREE.CylinderGeometry(bw * 0.42, bw * 0.42, L, 12, 1, true).translate(b.x, yb - 0.04 - L / 2, z)); }
      merged(tubes, rm, { parent: G, name: 'resonators' }).material.side = THREE.DoubleSide;
      for (const z of [rowZ.n, rowZ.a]) bar([-W / 2, yb - 0.04, z], [W / 2, yb - 0.04, z], 0.008, rm, G, 'res_bar');
    }
    // legs with casters
    for (const sx of [-1, 1]) for (const z of [rowZ.n, rowZ.a]) {
      const x = sx * (W / 2 + 0.03);
      bar([x, 0.06, z], [x, yb - 0.02, z + (z > 0 ? -halfL(sx > 0 ? 1 : 0) * 0.55 + 0.01 : 0)], 0.016, T.trim === 'gold' ? hwMat(T) : frameM, G, 'leg');
      mesh(new THREE.SphereGeometry(0.03, 10, 8), M.rubber(), { parent: G, at: [x, 0.03, z], name: 'caster' });
    }
    for (const sx of [-1, 1]) bar([sx * (W / 2 + 0.03), 0.07, rowZ.n], [sx * (W / 2 + 0.03), 0.07, rowZ.a], 0.012, frameM, G, 'stretcher');
    bar([-W / 2 - 0.03, 0.07, (rowZ.n + rowZ.a) / 2], [W / 2 + 0.03, 0.07, (rowZ.n + rowZ.a) / 2], 0.012, frameM, G, 'stretcher');
    for (const sx of [-1, 1]) bar([sx * (W / 2 + 0.03), 0.07, (rowZ.n + rowZ.a) / 2], [sx * (W / 2 + 0.03), 0.07, (rowZ.n + rowZ.a) / 2 + 0.0], 0.012, frameM, G);
    // ends caps hold rails
    for (const sx of [-1, 1]) bar([sx * (W / 2 + 0.03), yb - 0.02, rowZ.n - 0.25], [sx * (W / 2 + 0.03), yb - 0.02, rowZ.n + 0.25], 0.014, frameM, G, 'end_rail');
    // mallets resting across the naturals
    const mallets = [];
    for (const s of [-1, 1]) {
      const m = group(`mallet_${s > 0 ? 'r' : 'l'}`, { parent: G, at: [s * 0.12, yBar + (glock ? 0.004 : 0.011) + 0.012, rowZ.n + 0.02] });
      tube([0, 0, -0.2], [0, 0, 0.18], 0.004, M.wood('#d9b98a'), { parent: m });
      mesh(new THREE.SphereGeometry(0.014, 12, 8), glock ? M.plastic('#f2f2f2', 0.3) : M.fabric(T.neon ? T.a : '#2a4a9a'), { parent: m, at: [0, 0.0, -0.2] });
      mallets.push(m);
    }
    anims.push(clip('play', 0.8, mallets.map((m, i) => rotateTrack(m, 'x', 0.8, (t) => -0.25 * Math.max(0, Math.sin((t + i * 0.5) * Math.PI * 2)), 16))));
    if (!V.wood && !glock) { // vibraphone fan motor spin indicator
      const fan = group('fan_axle', { parent: G, at: [0, yb - 0.04 - 0.02, rowZ.n] });
      mesh(new THREE.CylinderGeometry(0.004, 0.004, W, 6).rotateZ(Math.PI / 2), M.metal('#9aa0a6', 0.3), { parent: fan });
      anims.push(clip('vibrato', 0.5, [rotateTrack(fan, 'x', 0.5, (t) => t * Math.PI * 2, 8)]));
    }
  } else if (V.kind === 'triangle') {
    // triangle hanging from a clip on a small table stand, beater alongside
    const st = tripod(G, T, 0.95 * k, [0, 0, 0], { spread: 0.25, boom: [0.25, 0.1, 0], name: 'tri_stand' });
    const s = 0.2 * k;
    const triM = T.trim === 'gold' ? hwMat(T) : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.p, 'plastic') : T.trim === 'black' ? hwMat(T) : M.chrome();
    const top = [st[0], st[1] - 0.12, st[2]];
    const tri = group('triangle', { parent: G, at: top });
    const h = s * 0.866;
    const pts = T.round ? [[-0.01, 0, 0], [-s / 2, -h, 0], [s / 2, -h, 0], [0.01, 0, 0]] : [[-0.012, -0.012, 0], [-s / 2 + 0.01, -h + 0.005, 0], [-s / 2 + 0.02, -h, 0], [s / 2 - 0.02, -h, 0], [s / 2 - 0.01, -h + 0.005, 0], [0.012, -0.012, 0]];
    curveTube(pts, 0.005 * Math.max(1, k), triM, { parent: tri, name: 'tri_rod', segments: 60, radialSegments: 8 });
    tube([0, 0.12, 0], [0, -0.006, 0], 0.0015, M.matte('#1a1a1a'), { parent: tri, name: 'tri_cord' });
    mesh(roundedBox(0.02, 0.03, 0.02, 0.004), M.plastic('#111', 0.4), { parent: G, at: [st[0], st[1] - 0.005, st[2]], name: 'clip' });
    anims.push(clip('ring', 1.5, [rotateTrack(tri, 'z', 1.5, (t) => 0.1 * wave(t, 3) * (1 - t), 24)]));
    tube([st[0] - 0.05, 0.0, 0.15], [st[0] - 0.08, 0.2, 0.06], 0.003, M.chrome(), { parent: G, name: 'beater' });
  } else if (V.kind === 'tambourine') {
    const R = (T.ornate ? 0.14 : 0.125) * k;
    const tg = group('tambourine', { parent: G, at: [0, 0, 0] });
    const fm = T.trim ? (T.kids ? fin(T, T.p, 'plastic') : T.neon ? fin(T, T.p, 'neon') : T.trim === 'black' || T.trim === 'white' ? fin(T, T.p) : woodMat(T, '#c99a5b')) : M.wood('#c99a5b');
    const prof = T.sharp ? null : [[R - 0.008, 0], [R, 0], [R, 0.05], [R - 0.008, 0.05]];
    if (prof) mesh(lathe(prof, 40), fm, { parent: tg, name: 'tamb_frame' }).material.side = THREE.DoubleSide;
    else { // half-moon (crescent) tambourine
      const out = [], inn = [];
      for (let i = 0; i <= 24; i++) { const a = Math.PI * 0.1 + (i / 24) * Math.PI * 1.8; out.push([Math.cos(a) * R, Math.sin(a) * R]); inn.push([Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62 - R * 0.1]); }
      mesh(plate([...out, ...inn.reverse()], 0.035, { bevel: 0.004 }), fm, { parent: tg, at: [0, 0.0175, 0], rot: [-Math.PI / 2, 0, 0], name: 'tamb_frame' });
    }
    if (prof && !T.wear) mesh(new THREE.CylinderGeometry(R - 0.004, R - 0.004, 0.002, 40), headWhite(T), { parent: tg, at: [0, 0.049, 0], name: 'tamb_head' });
    const jm = T.trim === 'gold' ? hwMat(T) : M.metal('#d8d6d0', 0.2);
    const jj = [];
    const nj = T.kids ? 4 : T.ornate ? 10 : 6;
    for (let i = 0; i < nj; i++) { const a = (i / nj) * Math.PI * (T.sharp ? 1.6 : 2) + (T.sharp ? 0.5 : 0); for (const dy of [0.01, 0.022]) jj.push(new THREE.CylinderGeometry(0.02, 0.02, 0.003, 16).rotateZ(Math.PI / 2).rotateY(-a).translate(Math.cos(a) * R * (T.sharp ? 0.8 : 1), (T.sharp ? 0.0175 : 0.025) + dy - 0.016, Math.sin(a) * R * (T.sharp ? 0.8 : 1))); }
    merged(jj, jm, { parent: tg, name: 'jingles' });
    tg.position.y = 0.0;
    anims.push(clip('shake', 0.4, [moveTrack(tg, 0.4, (t) => [0, 0.01 * Math.abs(wave(t, 2)), 0]), rotateTrack(tg, 'y', 0.4, (t) => 0.08 * wave(t, 2), 16)]));
  } else if (V.kind === 'harp') {
    const H = V.H * k;
    const lever = V.lever;
    const n = T.kids ? 16 : V.n;
    const wm = T.trim ? (T.trim === 'gold' ? M.metal('#d9ad48', 0.25) : woodMat(T, '#a8743a')) : new THREE.MeshPhysicalMaterial({ name: 'maple', color: lever ? '#b8803e' : '#d9a85a', roughness: 0.35, clearcoat: 0.8 });
    const hg = group('harp', { parent: G });
    // base
    mesh(roundedBox(0.36 * k, 0.1 * k, 0.5 * k, 0.03), wm, { parent: hg, at: [0, 0.05 * k, 0], name: 'harp_base' });
    if (!lever) { const pd = []; for (let i = 0; i < 7; i++) pd.push(roundedBox(0.012, 0.01, 0.06, 0.003, 1).translate((-0.14 + i * 0.047) * k, 0.05 * k, 0.27 * k)); merged(pd, M.metal('#d9ad48', 0.25), { parent: hg, name: 'pedals' }); }
    // soundbox: tapered box leaning from the base toward the player, strings rise vertically to the neck
    const sbLen = H * 0.86;
    const sb = group('soundbox', { parent: hg, at: [0, 0.08 * k, -0.1 * k], rot: [0.55, 0, 0] });
    const sbg = new THREE.CylinderGeometry(0.06 * k, 0.2 * k, sbLen, 4, 1, false, Math.PI / 4);
    sbg.scale(1, 1, 0.75);
    mesh(sbg, wm, { parent: sb, at: [0, sbLen / 2, 0], name: 'soundbox_body' });
    const ribAt = (t) => new THREE.Vector3(0, t * sbLen, -(0.2 - 0.14 * t) * k * 0.75 * 0.72);
    const r0 = ribAt(0.03), r1 = ribAt(1);
    tube(r0.toArray(), r1.toArray(), 0.012 * k, M.wood('#e2c393'), { parent: sb, name: 'string_rib' });
    sb.updateMatrix();
    const sbTop = new THREE.Vector3(0, sbLen, 0).applyMatrix4(sb.matrix);
    const colZ = -0.24 * k;
    const colTop = H;
    if (T.round || T.ornate || !lever) mesh(lathe([[0.04 * k, 0], [0.035 * k, colTop * 0.1], [0.03 * k, colTop * 0.85], [0.06 * k, colTop * 0.9], [0.065 * k, colTop * 0.95], [0.04 * k, colTop - 0.1 * k]], 20), wm, { parent: hg, at: [0, 0.08 * k, colZ], name: 'column' });
    else mesh(roundedBox(0.05 * k, colTop - 0.1 * k, 0.05 * k, 0.01), wm, { parent: hg, at: [0, 0.08 * k + (colTop - 0.1 * k) / 2, colZ], name: 'column' });
    const dz = sbTop.z - colZ;
    const neckPts = [[0, colTop - 0.04 * k, colZ], [0, colTop + 0.02 * k, colZ + dz * 0.22], [0, colTop - 0.06 * k, colZ + dz * 0.5], [0, sbTop.y + 0.12 * k, colZ + dz * 0.78], [0, sbTop.y + 0.02 * k, sbTop.z]];
    curveTube(neckPts, 0.035 * k, wm, { parent: hg, name: 'harp_neck', segments: 40, radialSegments: 12 });
    if (T.ornate) mesh(new THREE.SphereGeometry(0.07 * k, 16, 12), M.metal('#e6b54e', 0.2), { parent: hg, at: [0, colTop - 0.03 * k, colZ], name: 'crown' });
    const neckCurve = new THREE.CatmullRomCurve3(neckPts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    const samples = Array.from({ length: 81 }, (_, i) => neckCurve.getPoint(i / 80));
    const strs = [], red = [];
    if (lever) { const lv = []; for (let i = 0; i < n; i += 1) { const t = 0.05 + (i / (n - 1)) * 0.9; const bot = ribAt(t).applyMatrix4(sb.matrix); let best = samples[0]; for (const p of samples) if (Math.abs(p.z - bot.z) < Math.abs(best.z - bot.z)) best = p; lv.push(new THREE.BoxGeometry(0.012 * k, 0.012 * k, 0.012 * k).toNonIndexed().translate(0.03 * k, best.y - 0.05 * k, best.z)); } merged(lv, M.metal('#d8d6d0', 0.3), { parent: hg, name: 'levers' }); }
    for (let i = 0; i < n; i++) {
      const t = 0.05 + (i / (n - 1)) * 0.9;
      const bot = ribAt(t).applyMatrix4(sb.matrix);
      let best = samples[0];
      for (const p of samples) if (Math.abs(p.z - bot.z) < Math.abs(best.z - bot.z)) best = p;
      const g = segGeo(bot.toArray(), [0, best.y - 0.02 * k, best.z], 0.0009 + (1 - i / n) * 0.0008, 4);
      (i % 7 === 0 ? red : strs).push(g);
    }
    merged(strs, M.matte(T.neon ? T.a : '#f0e8d4', 0.4), { parent: hg, name: 'harp_strings' });
    if (red.length) merged(red, M.matte('#c0262c', 0.5), { parent: hg, name: 'harp_c_strings' });
    anims.push(clip('strum', 1.2, [scaleTrack(hg.getObjectByName('harp_strings'), 1.2, (t) => [1 + 0.004 * wave(t, 12), 1, 1])]));
  } else if (V.kind === 'metronome') {
    const H = 0.22 * k;
    const bm = T.trim ? (T.kids ? fin(T, T.p, 'plastic') : T.neon ? fin(T, '#141418', 'gloss') : T.trim === 'black' || T.trim === 'white' ? fin(T, T.p) : T.trim === 'gold' ? hwMat(T) : woodMat(T, '#5b2a14')) : M.wood('#5b2a14');
    const shape = T.sharp ? [[-0.06, 0], [0.06, 0], [0.025, H], [-0.025, H]] : T.round ? blob([[-0.065, 0], [0.065, 0], [0.05, H * 0.6], [0.02, H], [-0.02, H], [-0.05, H * 0.6]], 40) : [[-0.06, 0], [0.06, 0], [0.018, H], [-0.018, H]];
    mesh(plate(shape.map(([x, y]) => [x * k, y]), 0.09 * k, { bevel: 0.004 }), bm, { parent: G, at: [0, 0, 0], name: 'metronome_body' });
    mesh(plate([[-0.03 * k, 0.02 * k], [0.03 * k, 0.02 * k], [0.012 * k, H - 0.02 * k], [-0.012 * k, H - 0.02 * k]], 0.004, { bevel: 0 }), T.trim === 'gold' ? M.matte('#1a1a1a') : M.metal('#d8c48a', 0.3), { parent: G, at: [0, 0, 0.045 * k + 0.001], name: 'scale_plate' });
    const pend = group('pendulum', { parent: G, at: [0, 0.035 * k, 0.045 * k + 0.008] });
    tube([0, 0, 0], [0, H * 0.85, 0], 0.0018, M.chrome(), { parent: pend, name: 'pend_rod' });
    mesh(roundedBox(0.016, 0.02, 0.01, 0.003), M.chrome(), { parent: pend, at: [0, H * 0.55, 0], name: 'pend_weight' });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 8).rotateX(Math.PI / 2), M.chrome(), { parent: G, at: [0, 0.035 * k, 0.045 * k + 0.003], name: 'pivot' });
    if (T.neon) { const l = lampGroup('beat_led', 'red'); l.add(G, { at: [0, 0.012 * k, 0.045 * k + 0.004], normal: [0, 0, 1], w: 0.008, h: 0.008, depth: 0.003, shape: 'round', bezel: false, glowSize: 0.06 }); anims.push(clip('on', 1, lampTracks('beat_led', 3, { blink: 2 }))); }
    anims.unshift(clip('swing', 1, [rotateTrack(pend, 'z', 1, (t) => 0.4 * Math.sin(t * Math.PI * 2), 32)]));
  } else if (V.kind === 'tubes') {
    const n = T.kids ? 8 : 18;
    const W = n * 0.07 / 2 + 0.2;
    const fm = T.trim === 'gold' ? hwMat(T) : T.trim ? woodMat(T, '#3b2a1e') : M.metal('#1c1d20', 0.4);
    const H = 1.9 * k;
    for (const s of [-1, 1]) { bar([s * W / 2, 0.05, 0], [s * W / 2, H, 0], 0.02, fm, G, 'tb_post'); bar([s * W / 2, 0.03, -0.3], [s * W / 2, 0.03, 0.3], 0.025, fm, G, 'tb_foot'); mesh(new THREE.SphereGeometry(0.03, 10, 8), M.rubber(), { parent: G, at: [s * W / 2, 0.03, 0.3] }); mesh(new THREE.SphereGeometry(0.03, 10, 8), M.rubber(), { parent: G, at: [s * W / 2, 0.03, -0.3] }); }
    for (const z of [-0.06, 0.06]) bar([-W / 2, H, z], [W / 2, H, z], 0.016, fm, G, 'tb_rail');
    const tm = T.trim === 'gold' || !T.trim ? M.metal('#d9ad48', 0.18) : T.neon ? fin(T, T.p, 'neon') : T.kids ? fin(T, T.p, 'plastic') : T.trim === 'black' ? M.metal('#2a2b2e', 0.3) : M.chrome();
    const tubes = [], cords = [];
    for (let i = 0; i < n; i++) {
      const row = i % 2 ? 0.06 : -0.06;
      const x = -W / 2 + 0.1 + Math.floor(i / 2) * 0.14 + (i % 2) * 0.07;
      const L = (1.5 - 0.6 * (i / n)) * k;
      tubes.push(lathe([[0.019, 0], [0.019, L], [0.022, L + 0.01], [0.022, L + 0.03], [0.016, L + 0.03], [0.016, 0.0]], 14).translate(x, H - 0.06 - L - 0.03, row));
      cords.push(segGeo([x, H - 0.06, row], [x, H - 0.016, row], 0.0025, 4));
    }
    merged(tubes, tm, { parent: G, name: 'bells' });
    merged(cords, M.matte('#1a1a1a'), { parent: G, name: 'bell_cords' });
    mesh(roundedBox(0.3, 0.012, 0.08, 0.004), fm, { parent: G, at: [0, 0.006, 0.25], name: 'damper_pedal' });
    anims.push(clip('play', 2, [rotateTrack(G.getObjectByName('bells'), 'x', 2, (t) => 0.004 * wave(t, 2), 16)]));
  } else {
    // maracas pair lying crossed on the floor
    const mm = (i) => (T.trim ? (T.kids ? fin(T, i ? T.s : T.p, 'plastic') : T.neon ? fin(T, i ? T.p : T.s, 'neon') : T.trim === 'gold' ? hwMat(T) : T.trim === 'black' || T.trim === 'white' ? fin(T, T.p) : woodMat(T, '#c4632a')) : fin(T, i ? '#e0462a' : '#2b9d6f', 'gloss'));
    const r = (T.round ? 0.06 : 0.055) * k;
    for (const i of [0, 1]) {
      const m = group(`maraca_${i}`, { parent: G, at: [i ? 0.03 : -0.03, r * 0.98, i ? -0.03 : 0.03], rot: [0, i ? 0.6 : -0.6, Math.PI / 2] });
      const head = T.sharp ? new THREE.OctahedronGeometry(r, 1) : new THREE.SphereGeometry(r, 20, 14).scale(1, 1.2, 1);
      mesh(head, mm(i), { parent: m, at: [0, 0, 0], name: `maraca_head_${i}` });
      mesh(new THREE.CylinderGeometry(0.011 * k, 0.014 * k, 0.13 * k, 12), M.wood('#d9b98a'), { parent: m, at: [0, -r - 0.055 * k, 0], name: `maraca_handle_${i}` });
      if (!T.sharp) mesh(new THREE.TorusGeometry(r * 0.75, 0.004, 6, 24).rotateX(Math.PI / 2), M.matte(i ? '#ffe03b' : '#ffffff', 0.5), { parent: m, at: [0, r * 0.45, 0], name: 'stripe' });
    }
    // handle tips rest on the floor: drop the pair so the low handle end touches
    anims.push(clip('shake', 0.3, [rotateTrack(G.getObjectByName('maraca_0'), 'x', 0.3, (t) => 0.05 * wave(t), 12)]));
  }
  return done(root, 'percussion', variant, o, anims);
}
const BLACK_AFTER_SET = new Set([0, 1, 3, 4, 5]);
void TRIMS;
