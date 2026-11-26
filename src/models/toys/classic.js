// Classic toys: yo-yos, spinning tops, jack-in-the-box.
import {
  THREE, M, mesh, group, roundedBox, lathe, curveTube, tube, toyMat, toyFactory, canvasTex, CHROME, BLACK, WHITE,
  clip, spinTrack, rotateTrack, moveTrack, scaleTrack, wave, pingPong, bulbs, softBox,
} from './kit.js';

/* ============================== YO-YO ============================== */
// half profiles [r, y] from the string gap outwards (lathed around Y, axis later turned to X)
export const YOYO_VARIANTS = {
  imperial: { pal: ['#d62828', '#f7f5f0', '#f4c20d', '#1d4ed8', '#fff8e8', '#222222'], matKind: 'wood', R: 0.028, half: 0.017, prof: (R, H) => [[0.0045, 0.0012], [R * 0.9, 0.003], [R, H * 0.45], [R * 0.95, H * 0.85], [R * 0.7, H], [0, H]] },
  butterfly: { pal: ['#1d4ed8', '#f4c20d', '#2a9d3c', '#d62828', '#f7f5f0', '#222222'], R: 0.029, half: 0.019, prof: (R, H) => [[0.0045, 0.0012], [R * 0.35, 0.002], [R * 0.95, H * 0.9], [R, H], [R * 0.82, H * 0.9], [R * 0.6, H * 0.72], [0, H * 0.72]] },
  'pro-wide': { pal: ['#2a2d33', '#19e3ff', '#c9ced6', '#ff2fb3', '#e0e4e8', '#111111'], matKind: 'metal', R: 0.03, half: 0.023, prof: (R, H) => [[0.0045, 0.0012], [R * 0.5, 0.0025], [R * 0.92, H * 0.55], [R, H * 0.8], [R * 0.97, H], [R * 0.86, H], [R * 0.84, H * 0.75], [0.006, H * 0.65], [0, H * 0.65]], rim: true },
  'light-up': { pal: ['#7dff6a', '#6af0ff', '#f6ff6a', '#ff6ad5', '#dfffe0', '#18221a'], matKind: 'clear', R: 0.029, half: 0.018, prof: (R, H) => [[0.0045, 0.0012], [R * 0.85, 0.003], [R, H * 0.5], [R * 0.9, H], [0, H]], leds: true },
  'twin-pack': { pal: ['#ff5c8a', '#6ad1ff', '#ffd23f', '#06d6a0', '#fff4f8', '#7a2348'], R: 0.026, half: 0.016, twin: true, prof: (R, H) => [[0.0045, 0.0012], [R * 0.9, 0.003], [R, H * 0.45], [R * 0.95, H * 0.85], [R * 0.7, H], [0, H]] },
};

function yoyo(c, parent, v, { at, name, colorA = 0, colorB = 1 }) {
  const { T } = c;
  const R = v.R;
  const H = v.half;
  const g = group(name, { parent, at: [at[0], R + at[1], at[2]] });
  const spin = group(`${name}_spin`, { parent: g });
  const halfGeo = lathe(v.prof(R, H), 40).rotateZ(-Math.PI / 2);
  mesh(halfGeo, c.m(colorA), { parent: spin });
  mesh(halfGeo.clone().rotateY(Math.PI), c.m(T.style === 'rainbow' || T.style === 'candy' ? colorB : colorA), { parent: spin });
  // face caps (printed swirl) + axle
  const capMat = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#' + M.toColor(c.color(4)).getHexString(); x.fillRect(0, 0, w, h);
    x.strokeStyle = '#' + M.toColor(c.color(colorB)).getHexString(); x.lineWidth = 8;
    for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(64, 64, 18 + k * 16, k, k + 3.6); x.stroke(); }
  }, `yoyo-cap-${T.name}-${colorB}`);
  const capM = capMat ? new THREE.MeshPhysicalMaterial({ map: capMat, roughness: 0.3, clearcoat: 0.8 }) : c.m(4);
  const capR = R * (v.rim ? 0.82 : 0.6);
  const hFace = v.rim ? H * 0.65 : v.prof === YOYO_VARIANTS.butterfly.prof ? H * 0.72 : H;
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(capR, capR, 0.0012, 32).rotateZ(Math.PI / 2), capM, { parent: spin, at: [s * (hFace + 0.0006), 0, 0] });
  if (v.rim) for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(R * 0.93, 0.0022, 8, 40).rotateY(Math.PI / 2), CHROME, { parent: spin, at: [s * H * 0.9, 0, 0] });
  // wound string in the gap
  const strM = toyMat('soft', T.style === 'neon' ? T.pal[2] : '#f2efe6');
  mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.0026, 20).rotateZ(Math.PI / 2), strM, { parent: spin });
  if (v.leds) {
    const tr = bulbs(spin, `${name}_leds`, 'blue', [-1, 1].flatMap((s) => [0, 2.1, 4.2].map((a) => [[s * (H + 0.0014), Math.sin(a) * R * 0.45, Math.cos(a) * R * 0.45], [s, 0, 0]])), { r: 0.003, blink: 4 });
    c.anims.push(clip('lights', 1, tr));
  }
  // string falls from the gap to the floor and loops
  const loopR = 0.012;
  const pts = [[0, -0.0085, 0], [0.002, -R * 0.6, 0.006], [0.004, -R + 0.002, 0.02], [0.01, -R + 0.0015, 0.05]];
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2; pts.push([0.01 + Math.sin(a) * loopR * 1.3, -R + 0.0015, 0.05 + loopR - Math.cos(a) * loopR]); }
  curveTube(pts, 0.0007, strM, { parent: g, segments: 80, radialSegments: 5 });
  return spin;
}

export const createYoyo = toyFactory('yo-yo', YOYO_VARIANTS, (c) => {
  const { root, v } = c;
  const spins = [];
  if (v.twin) {
    spins.push(yoyo(c, root, v, { at: [-0.03, 0, 0], name: 'yoyoA', colorA: 0, colorB: 2 }));
    spins.push(yoyo(c, root, v, { at: [0.03, 0, -0.01], name: 'yoyoB', colorA: 1, colorB: 3 }));
    // blister card backing they lean against
    mesh(roundedBox(0.13, 0.11, 0.003, 0.004), c.m(4), { parent: root, at: [0, 0.055, -0.035] });
  } else spins.push(yoyo(c, root, v, { at: [0, 0, 0], name: 'yoyo', colorA: 0, colorB: 1 }));
  c.anims.push(clip('spin', 0.5, spins.map((s) => spinTrack(s, 'x', 0.25))));
}, { base: 'classic' });

/* ============================== SPINNING TOPS ============================== */
export const TOP_VARIANTS = {
  'peg-top': { kind: 'peg' },
  'humming-top': { kind: 'hum' },
  gyroscope: { kind: 'gyro' },
  'four-sided': { kind: 'four' },
  'battle-top': { kind: 'battle' },
};

export const createSpinningTop = toyFactory('spinning-top', TOP_VARIANTS, (c) => {
  const { root, T, v } = c;
  const tilt = group('tilt', { parent: root });
  const spin = group('spinner', { parent: tilt });
  const m0 = c.m(0);
  const m1 = c.m(1);
  if (v.kind === 'peg') {
    // pear-shaped wooden peg top on a steel tip, ~7 cm
    mesh(new THREE.ConeGeometry(0.0025, 0.008, 12).rotateX(Math.PI), CHROME, { parent: spin, at: [0, 0.004, 0] });
    const pr = [[0.002, 0.007], [0.012, 0.014], [0.024, 0.032], [0.03, 0.046], [0.028, 0.054], [0.012, 0.058], [0.005, 0.06], [0.005, 0.075], [0.0055, 0.078], [0, 0.079]];
    mesh(lathe(pr, 40), m0, { parent: spin });
    for (const [y, k] of [[0.03, 2], [0.042, 1], [0.05, 3]]) mesh(new THREE.TorusGeometry(0.0255 + (y - 0.03) * 0.2, 0.0012, 6, 40).rotateX(Math.PI / 2), c.m(k), { parent: spin, at: [0, y, 0] });
  } else if (v.kind === 'hum') {
    // tin humming top: big lens body on a short foot, pump plunger with knob
    mesh(lathe([[0, 0], [0.004, 0.001], [0.01, 0.01], [0, 0.01]], 20), BLACK, { parent: spin });
    const pr = [[0.008, 0.008], [0.05, 0.03], [0.075, 0.06], [0.078, 0.07], [0.07, 0.09], [0.04, 0.11], [0.012, 0.118], [0, 0.118]];
    const tex = canvasTex(256, 64, (x, w, h) => {
      const cols = [0, 1, 2, 3].map((i) => '#' + M.toColor(c.color(i)).getHexString());
      for (let i = 0; i < 16; i++) { x.fillStyle = cols[i % 4]; x.fillRect((i * w) / 16, 0, w / 16 + 1, h); }
      x.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 16; i++) { x.beginPath(); x.arc((i + 0.5) * w / 16, h * 0.5, 5, 0, 7); x.fill(); }
    }, `hum-${T.name}`);
    const bm = tex && T.kind !== 'plush' ? new THREE.MeshPhysicalMaterial({ map: tex, metalness: 0.5, roughness: 0.3, clearcoat: 0.8 }) : m0;
    mesh(lathe(pr, 48), bm, { parent: spin });
    tube([0, 0.115, 0], [0, 0.2, 0], 0.004, CHROME, { parent: spin });
    mesh(new THREE.SphereGeometry(0.014, 18, 12), m1, { parent: spin, at: [0, 0.205, 0] });
    // vent slots
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; mesh(roundedBox(0.012, 0.005, 0.003, 0.001), BLACK, { parent: spin, at: [Math.cos(a) * 0.06, 0.087, Math.sin(a) * 0.06], rot: [0, -a + Math.PI / 2, 0.4] }); }
  } else if (v.kind === 'gyro') {
    // gimballed gyroscope standing on its pivot point
    const frame = toyMat(T.kind === 'plastic' ? 'metal' : T.kind, T.pal[1]);
    const fr = 0.035;
    mesh(new THREE.ConeGeometry(0.003, 0.008, 10).rotateX(Math.PI), CHROME, { parent: tilt, at: [0, 0.004, 0] });
    mesh(new THREE.TorusGeometry(fr, 0.0025, 8, 48), frame, { parent: tilt, at: [0, 0.008 + fr, 0] });
    mesh(new THREE.TorusGeometry(fr, 0.0025, 8, 48).rotateY(Math.PI / 2), frame, { parent: tilt, at: [0, 0.008 + fr, 0] });
    tube([0, 0.006, 0], [0, 0.01 + fr * 2 + 0.006, 0], 0.0018, CHROME, { parent: tilt });
    mesh(new THREE.SphereGeometry(0.004, 10, 8), frame, { parent: tilt, at: [0, 0.012 + fr * 2 + 0.006, 0] });
    spin.position.y = 0.008 + fr;
    mesh(new THREE.CylinderGeometry(fr * 0.85, fr * 0.85, 0.008, 40), m0, { parent: spin });
    mesh(new THREE.TorusGeometry(fr * 0.85, 0.003, 8, 40).rotateX(Math.PI / 2), m1, { parent: spin });
  } else if (v.kind === 'four') {
    // four-sided spinning top with symbols, stem on top
    mesh(new THREE.ConeGeometry(0.014, 0.014, 4, 1).rotateX(Math.PI).rotateY(Math.PI / 4), m0, { parent: spin, at: [0, 0.007, 0] });
    mesh(roundedBox(0.028, 0.026, 0.028, 0.004), m0, { parent: spin, at: [0, 0.027, 0] });
    tube([0, 0.039, 0], [0, 0.06, 0], 0.003, m1, { parent: spin });
    const syms = ['●', '▲', '■', '★'];
    syms.forEach((sy, i) => {
      const tex = canvasTex(64, 64, (x) => { x.fillStyle = '#' + M.toColor(c.color(4)).getHexString(); x.fillRect(0, 0, 64, 64); x.fillStyle = '#' + M.toColor(c.color(i % 4 === 0 ? 1 : i)).getHexString(); x.font = 'bold 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(sy, 32, 34); }, `four-${T.name}-${i}`);
      const a = (i * Math.PI) / 2;
      mesh(new THREE.PlaneGeometry(0.02, 0.02), tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }) : c.m(4), { parent: spin, at: [Math.sin(a) * 0.01405, 0.027, Math.cos(a) * 0.01405], rot: [0, a, 0] });
    });
  } else {
    // battle top: metal attack ring + clear core + sharp driver
    mesh(lathe([[0, 0], [0.003, 0.001], [0.008, 0.012], [0.012, 0.016], [0, 0.016]], 24), BLACK, { parent: spin });
    const ring = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ring.push([Math.cos(a) * 0.024, Math.sin(a) * 0.024], [Math.cos(a + 0.6) * 0.022, Math.sin(a + 0.6) * 0.022], [Math.cos(a + 0.8) * 0.017, Math.sin(a + 0.8) * 0.017]); }
    const shape = new THREE.Shape(ring.map(([x, y]) => new THREE.Vector2(x, y)));
    mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 2 }).rotateX(-Math.PI / 2), toyMat(T.kind === 'plush' ? 'plush' : 'chrome', T.pal[0]), { parent: spin, at: [0, 0.015, 0] });
    mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.008, 6), m1, { parent: spin, at: [0, 0.026, 0] });
    mesh(new THREE.SphereGeometry(0.012, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toyMat('clear', T.pal[2]), { parent: spin, at: [0, 0.03, 0] });
  }
  // trims: add a launcher / display base beside some styles
  if (T.style === 'luxe' || T.style === 'tin') {
    // display dish the top spins on
    mesh(lathe([[0, 0], [0.06, 0], [0.064, 0.006], [0.058, 0.008], [0.03, 0.005], [0, 0.004]], 40), toyMat('rawwood', 'walnut'), { parent: root });
    tilt.position.y = 0.004;
  }
  c.anims.push(clip('spin', 2, [spinTrack(spin, 'y', 0.25), rotateTrack(tilt, new THREE.Vector3(1, 0, 0), 2, (t) => 0.06 + 0.02 * wave(t, 2))]));
  c.anims.push(clip('wobble', 2, [spinTrack(spin, 'y', 0.5), rotateTrack(tilt, 'z', 2, (t) => wave(t, 2) * 0.18)]));
}, { base: 'classic' });

/* ============================== JACK-IN-THE-BOX ============================== */
export const JACK_VARIANTS = {
  jester: { face: '#f6d7c3', hat: 'jester', shape: 'cube' },
  monkey: { face: '#8a5a3a', hat: 'ears', ears: '#c89870', shape: 'drum', pal: ['#c8102e', '#f2c500', '#1d4fa0', '#2a9d3c', '#f7f5f0', '#3a2414'] },
  bunny: { face: '#f2ece4', hat: 'bunny', shape: 'hat', pal: ['#1b1b1f', '#d62860', '#f4a9bf', '#9fd2ee', '#f7f5f0', '#111111'] },
  robot: { face: '#b8c0c8', hat: 'antenna', robot: true, shape: 'oct', pal: ['#8d99ae', '#ff6b1a', '#4fc3f7', '#2b2d42', '#e0e4e8', '#2a2d33'], matKind: 'metal' },
};

export const createJackInTheBox = toyFactory('jack-in-the-box', JACK_VARIANTS, (c) => {
  const { root, T, v } = c;
  const B = 0.12; // box side
  const t = 0.008;
  const panelTex = (i) => canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#' + M.toColor(c.color(i)).getHexString(); x.fillRect(0, 0, w, h);
    x.fillStyle = '#' + M.toColor(c.color(4)).getHexString(); x.strokeStyle = x.fillStyle; x.lineWidth = 6;
    x.strokeRect(8, 8, w - 16, h - 16);
    x.font = 'bold 64px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('★♥♣♦'[i % 4], w / 2, h / 2 + 4);
  }, `jack-${T.name}-${i}`);
  const wallMat = (i) => { const tx = T.kind === 'plush' ? null : panelTex(i); return tx ? new THREE.MeshPhysicalMaterial({ map: tx, roughness: 0.45, clearcoat: 0.4, metalness: T.kind === 'metal' ? 0.4 : 0 }) : c.m(i); };
  const box = group('box', { parent: root });
  const trimM = T.style === 'wood' || T.kind === 'rawwood' ? toyMat('rawwood', 'walnut') : toyMat(T.kind === 'plush' ? 'plush' : 'gold', '#d4a73a');
  const shape = v.shape ?? 'cube';
  if (shape === 'cube') {
    mesh(roundedBox(B, t, B, 0.002), c.m(5), { parent: box, at: [0, t / 2, 0] });
    mesh(roundedBox(B, B - t, t, 0.002), wallMat(0), { parent: box, at: [0, t + (B - t) / 2, B / 2 - t / 2] });
    mesh(roundedBox(B, B - t, t, 0.002), wallMat(2), { parent: box, at: [0, t + (B - t) / 2, -B / 2 + t / 2] });
    mesh(roundedBox(t, B - t, B - 2 * t, 0.002), wallMat(1), { parent: box, at: [B / 2 - t / 2, t + (B - t) / 2, 0] });
    mesh(roundedBox(t, B - t, B - 2 * t, 0.002), wallMat(3), { parent: box, at: [-B / 2 + t / 2, t + (B - t) / 2, 0] });
    // corner trims + little feet
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.SphereGeometry(0.008, 12, 8), trimM, { parent: box, at: [sx * (B / 2 - 0.006), 0.006, sz * (B / 2 - 0.006)] });
  } else {
    // round drum / top-hat / octagonal robot box: hollow lathe with floor
    const R = B / 2, seg = shape === 'oct' ? 8 : 40;
    const prof = shape === 'hat' ? [[0, 0], [R * 1.5, 0], [R * 1.5, 0.008], [R * 0.95, 0.01], [R, B], [R - t, B], [R - t * 1.9, 0.018], [0, 0.018]]
      : [[0, 0], [R, 0], [R, B], [R - t, B], [R - t, t], [0, t]];
    const shell = mesh(lathe(prof, seg).rotateY(shape === 'oct' ? Math.PI / 8 : 0), shape === 'hat' ? c.m(0) : wallMat(0), { parent: box, name: 'shell' });
    shell.material.side = THREE.DoubleSide;
    if (shape === 'drum') {
      // drum hoops + zig-zag cord
      for (const y of [0.006, B - 0.006]) mesh(new THREE.TorusGeometry(R + 0.002, 0.005, 8, 40).rotateX(Math.PI / 2), c.m(4), { parent: box, at: [0, y, 0] });
      const zz = [];
      for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI * 2; zz.push([Math.cos(a) * (R + 0.003), k % 2 ? B - 0.012 : 0.012, Math.sin(a) * (R + 0.003)]); }
      curveTube(zz, 0.0018, c.m(1), { parent: box, segments: 64, closed: true });
    } else if (shape === 'hat') {
      mesh(new THREE.CylinderGeometry(R + 0.002, R + 0.002, 0.018, 40, 1, true), c.m(1), { parent: box, at: [0, 0.03, 0] }); // hat band
    } else {
      for (let k = 0; k < 8; k++) for (const y of [0.015, B - 0.015]) { const a = (k / 8) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.0035, 8, 6), CHROME, { parent: box, at: [Math.cos(a) * R * 0.93, y, Math.sin(a) * R * 0.93] }); }
      mesh(roundedBox(0.04, 0.03, 0.006, 0.003), toyMat('glow', '#6af0ff'), { parent: box, at: [0, B * 0.45, R * 0.92 + 0.002] });
    }
  }
  // crank on the right side
  const crank = group('crank', { parent: box, at: [B / 2 + 0.001, B * 0.55, 0] });
  tube([0, 0, 0], [0.012, 0, 0], 0.003, CHROME, { parent: crank });
  tube([0.012, 0, 0], [0.012, 0.03, 0], 0.0025, CHROME, { parent: crank });
  tube([0.012, 0.03, 0], [0.028, 0.03, 0], 0.0025, CHROME, { parent: crank });
  mesh(new THREE.CapsuleGeometry(0.005, 0.012, 4, 10).rotateZ(Math.PI / 2), c.m(1), { parent: crank, at: [0.03, 0.03, 0] });
  // lid hinged at the back edge (opened)
  const lid = group('lid', { parent: box, at: [0, B, -B / 2] });
  const lidM = wallMat(T.style === 'rainbow' ? 5 : 1);
  const lidMesh = group('lid_open', { parent: lid, rot: [-1.9, 0, 0] });
  if ((v.shape ?? 'cube') === 'cube') mesh(roundedBox(B + 0.004, t, B + 0.004, 0.003), lidM, { parent: lidMesh, at: [0, t / 2, B / 2] });
  else mesh(new THREE.CylinderGeometry(B / 2 + 0.003, B / 2 + 0.003, t, v.shape === 'oct' ? 8 : 40), lidM, { parent: lidMesh, at: [0, t / 2, B / 2] });
  mesh(roundedBox(B * 0.3, 0.004, 0.02, 0.0015), trimM, { parent: lidMesh, at: [0, t / 2, B + 0.008] });
  // spring from the box floor up to the figure
  const springG = group('spring', { parent: box, at: [0, t, 0] });
  const sh = 0.14;
  const pts = [];
  for (let i = 0; i <= 120; i++) { const a = i * 0.55; pts.push([Math.cos(a) * 0.02, (i / 120) * sh, Math.sin(a) * 0.02]); }
  curveTube(pts, 0.0022, CHROME, { parent: springG, segments: 300, radialSegments: 6 });
  mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.004, 20), c.m(5), { parent: springG, at: [0, 0.002, 0] });
  // figure on top
  const fig = group('figure', { parent: box, at: [0, t + sh, 0] });
  const bodyM = c.m(1);
  // ruffled collar + body
  mesh(lathe([[0.022, 0], [0.028, 0.012], [0.024, 0.03], [0.018, 0.036], [0, 0.036]], 24), bodyM, { parent: fig, at: [0, -0.008, 0] });
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.009, 10, 8).scale(1, 0.5, 1), c.m(i % 2 ? 4 : 2), { parent: fig, at: [Math.cos(a) * 0.02, 0.03, Math.sin(a) * 0.02] }); }
  for (const s of [-1, 1]) {
    curveTube([[s * 0.02, 0.02, 0], [s * 0.04, 0.012, 0.01], [s * 0.05, 0.03, 0.02]], 0.005, bodyM, { parent: fig, segments: 12 });
    mesh(new THREE.SphereGeometry(0.0075, 12, 8), toyMat(v.robot ? 'metal' : 'soft', v.robot ? '#9aa3ad' : '#ffffff'), { parent: fig, at: [s * 0.05, 0.032, 0.02] });
  }
  const headR = 0.026;
  const head = group('head', { parent: fig, at: [0, 0.03 + headR * 0.95, 0] });
  const faceM = v.robot ? toyMat('metal', v.face) : T.kind === 'plush' ? toyMat('plush', v.face) : toyMat('soft', v.face);
  if (v.robot) mesh(roundedBox(headR * 2, headR * 1.8, headR * 1.8, 0.008), faceM, { parent: head });
  else mesh(new THREE.SphereGeometry(headR, 24, 18), faceM, { parent: head });
  const fz = v.robot ? headR * 0.9 : headR * 0.92;
  for (const s of [-1, 1]) {
    mesh(new THREE.SphereGeometry(0.0045, 10, 8), v.robot ? toyMat('glow', '#6af0ff') : BLACK, { parent: head, at: [s * 0.009, 0.005, fz] });
    if (!v.robot) mesh(new THREE.SphereGeometry(0.005, 10, 8).scale(1, 0.6, 0.4), toyMat('soft', '#f08a8a'), { parent: head, at: [s * 0.015, -0.006, headR * 0.82] });
  }
  if (v.hat === 'jester') {
    mesh(new THREE.SphereGeometry(0.006, 12, 8), toyMat('soft', '#e02020'), { parent: head, at: [0, -0.002, headR * 1.0] });
    mesh(new THREE.TorusGeometry(0.008, 0.0015, 6, 12, Math.PI), BLACK, { parent: head, at: [0, -0.01, headR * 0.92], rot: [0, 0, Math.PI] });
    for (const s of [-1, 1]) {
      curveTube([[s * 0.01, headR * 0.75, 0], [s * 0.03, headR * 1.3, 0], [s * 0.045, headR * 1.0, 0.004], [s * 0.05, headR * 0.5, 0.01]], 0.007, c.m(s > 0 ? 0 : 2), { parent: head, segments: 16 });
      mesh(new THREE.SphereGeometry(0.0055, 12, 8), toyMat('gold', '#e8c040'), { parent: head, at: [s * 0.05, headR * 0.45, 0.01] });
    }
    mesh(new THREE.SphereGeometry(headR * 1.02, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), c.m(0), { parent: head, at: [0, 0.002, -0.002] });
  } else if (v.hat === 'ears') {
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.01, 14, 10).scale(1, 1, 0.5), faceM, { parent: head, at: [s * headR * 1.0, 0.004, 0] });
    mesh(new THREE.SphereGeometry(0.016, 16, 12).scale(1.2, 0.9, 0.6), toyMat('soft', v.ears), { parent: head, at: [0, -0.007, headR * 0.72] });
  } else if (v.hat === 'bunny') {
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.007, 14, 10).scale(1, 3.2, 0.5), faceM, { parent: head, at: [s * 0.01, headR + 0.016, 0], rot: [0, 0, -s * 0.15] });
  } else {
    tube([0, headR * 0.9, 0], [0, headR * 0.9 + 0.02, 0], 0.0015, CHROME, { parent: head });
    const tr = bulbs(head, 'antenna_bulb', 'red', [[[0, headR * 0.9 + 0.024, 0], [0, 1, 0]]], { r: 0.004, blink: 3 });
    c.anims.push(clip('beep', 1, tr));
  }
  // pop: closed → crank turns → lid flips open, figure springs up and wobbles
  const P = 4;
  const closedK = 0.08;
  const up = (u) => (u < 0.45 ? 0 : u < 0.55 ? (u - 0.45) / 0.1 : 1);
  const wob = (u) => (u < 0.55 ? 0 : Math.sin((u - 0.55) * 40) * Math.exp(-(u - 0.55) * 8));
  c.anims.push(clip('pop', P, [
    rotateTrack(crank, 'x', P, (u) => Math.min(u, 0.45) / 0.45 * Math.PI * 6, 48),
    rotateTrack(lid, 'x', P, (u) => (1 - up(u)) * 1.9, 48),
    scaleTrack(springG, P, (u) => { const k = closedK + (1 - closedK) * up(u) + wob(u) * 0.15; return [1, k, 1]; }, 48),
    moveTrack(fig, P, (u) => [0, -(1 - (closedK + (1 - closedK) * up(u) + wob(u) * 0.15)) * sh, 0], 48),
    rotateTrack(fig, 'z', P, (u) => wob(u) * 0.35, 48),
  ]));
  void lidMesh; void softBox; void WHITE; void pingPong;
}, { base: 'classic' });
