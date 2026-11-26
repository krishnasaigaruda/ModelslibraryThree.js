// Store fixtures: shoe display wall, cheval fitting mirror, glass jewellery case, fitting room,
// hat & coat stand and a checkout counter. Trims switch the finish AND the fixture style
// (pipe frames for industrial, arches for boutique / brass, chunky slabs for marble…).
import { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, paramGeo, taperTube, setup, done, fabricMat, gemMat, gemGeo, PRECIOUS, canvasTex } from './common.js';
import { buildShoe, shoeMats, SHOE_VARIANTS, SHOE_TRIMS } from './shoes.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { clip, scaleTrack, pingPong } from '../../core/animation.js';
import { brandEmblem } from '../../core/brand.js';

export const FIXTURE_VARIANTS = {
  'shoe-display': {},
  'fitting-mirror': {},
  'jewellery-case': {},
  'fitting-room': {},
  'hat-stand': {},
  'checkout-counter': {},
};

function marbleMat(base = '#f2f0ec', vein = '#8d8a86') {
  const tex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.strokeStyle = vein;
    for (let i = 0; i < 9; i++) {
      g.globalAlpha = 0.25 + (i % 3) * 0.15; g.lineWidth = 0.6 + (i % 4);
      g.beginPath(); let x = (i * 53) % w, y = 0; g.moveTo(x, y);
      while (y < h) { x += Math.sin(y * 0.05 + i) * 9; y += 8; g.lineTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 1;
  }, { repeat: [1, 1] });
  return new THREE.MeshPhysicalMaterial({ name: 'marble', color: tex ? '#ffffff' : base, map: tex, roughness: 0.18, clearcoat: 0.8 });
}

export const FIXTURE_TRIMS = {
  oak: { body: () => M.wood('oak'), frame: () => M.wood('oak'), metal: () => M.metal('#2a2b2e', 0.4), style: 'classic' },
  walnut: { body: () => M.wood('walnut'), frame: () => M.wood('walnut'), metal: () => M.metal('#c9a45a', 0.25), style: 'classic' },
  'white-gloss': { body: () => M.paint('#f4f4f2', { metallic: 0, roughness: 0.15 }), frame: () => M.paint('#f4f4f2', { metallic: 0, roughness: 0.15 }), metal: () => M.chrome(), style: 'modern' },
  'black-steel': { body: () => M.paint('#1b1b1d', { metallic: 0.3, roughness: 0.45 }), frame: () => M.metal('#1b1b1d', 0.45), metal: () => M.metal('#1b1b1d', 0.45), style: 'modern' },
  brass: { body: () => M.wood('black'), frame: () => M.metal('#c9a45a', 0.22), metal: () => M.metal('#c9a45a', 0.22), style: 'arch' },
  chrome: { body: () => M.paint('#d9dde2', { metallic: 0.6, roughness: 0.2 }), frame: () => M.chrome(), metal: () => M.chrome(), style: 'modern' },
  marble: { body: () => marbleMat(), frame: () => M.metal('#c9a45a', 0.22), metal: () => M.metal('#c9a45a', 0.22), style: 'slab' },
  'pink-boutique': { body: () => M.paint('#f2c4cf', { metallic: 0, roughness: 0.35 }), frame: () => M.metal('#d9b07a', 0.25), metal: () => M.metal('#d9b07a', 0.25), style: 'arch' },
  industrial: { body: () => M.wood('#7a5a3a'), frame: () => M.metal('#3a3a3c', 0.55), metal: () => M.metal('#3a3a3c', 0.55), style: 'pipe' },
};

const mirrorMat = () => new THREE.MeshPhysicalMaterial({ name: 'mirror', color: '#dfe6ea', metalness: 1, roughness: 0.03, clearcoat: 1 });
const glassPane = () => new THREE.MeshPhysicalMaterial({ name: 'glass', color: '#eef6f8', roughness: 0.02, transmission: 0.95, thickness: 0.006, ior: 1.5, transparent: true, opacity: 0.35 });

/** Arch-topped or rectangular outline (w×h, bottom at y=0). */
function panelOutline(w, h, arch) {
  if (!arch) return [[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]];
  const pts = [[-w / 2, 0], [w / 2, 0]];
  const r = w / 2;
  for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI; pts.push([Math.cos(a) * r, h - r + Math.sin(a) * r]); }
  return pts;
}

export function createStoreFixture(options = {}) {
  const { o, variant, trim, T } = setup(options, FIXTURE_VARIANTS, 'store-fixture', FIXTURE_TRIMS);
  const root = group(`store-fixture-${variant}`);
  const F = trim ? T : { body: () => M.wood('oak'), frame: () => M.paint(o.color ?? '#f4f4f2', { metallic: 0, roughness: 0.3 }), metal: () => M.chrome(), style: 'classic' };
  const bodyM = F.body(), frameM = F.frame(), metalM = F.metal();
  const style = F.style;
  const arch = style === 'arch';
  const anims = [];
  const post = (x, z, h, parent = root) => (style === 'pipe' ? mesh(new THREE.CylinderGeometry(0.017, 0.017, h, 14), metalM, { parent, at: [x, h / 2, z] }) : mesh(roundedBox(0.04, h, 0.04, 0.008), frameM, { parent, at: [x, h / 2, z] }));

  if (variant === 'shoe-display') {
    const W = 1.2, H = 1.9, D = 0.32;
    if (arch) mesh(extrudeOutline(panelOutline(W, H + 0.2, true), 0.03, { bevel: 0.006, segments: 2 }), bodyM, { parent: root, at: [0, 0, -D / 2 + 0.015], name: 'back' });
    else mesh(roundedBox(W, H, 0.03, 0.008), bodyM, { parent: root, at: [0, H / 2, -D / 2 + 0.015], name: 'back' });
    for (const s of [-1, 1]) post(s * (W / 2 - 0.02), -D / 2 + 0.05, H);
    mesh(roundedBox(W, 0.1, D, 0.01), style === 'slab' ? bodyM : frameM, { parent: root, at: [0, 0.05, 0], name: 'plinth' });
    const kinds = ['sneakers', 'heels', 'boots', 'loafers', 'running', 'pumps', 'oxfords', 'chelsea'];
    const trims = [null, 'patent-red', 'tan-suede', null, 'neon', null, 'black-leather', null];
    const n = 4;
    for (let i = 0; i < n; i++) {
      const y = 0.38 + i * 0.4;
      const sh = group('shelf', { parent: root, at: [0, y, 0], rot: [0.14, 0, 0] });
      mesh(roundedBox(W - 0.08, 0.02, D - 0.04, 0.006), style === 'slab' ? bodyM : arch ? frameM : glassPane(), { parent: sh, at: [0, 0, 0.0], name: 'shelf_board' });
      mesh(roundedBox(W - 0.08, 0.025, 0.012, 0.004), metalM, { parent: sh, at: [0, 0.018, (D - 0.04) / 2 - 0.006], name: 'lip' });
      for (const s of [-1, 1]) mesh(roundedBox(0.02, 0.05, D - 0.06, 0.005), metalM, { parent: sh, at: [s * (W / 2 - 0.05), -0.035, -0.0], name: 'bracket' });
      for (let k = 0; k < 2; k++) {
        const idx = (i * 2 + k) % kinds.length;
        const spec = { ...SHOE_VARIANTS[kinds[idx]], ...(trims[idx] ? SHOE_TRIMS[trims[idx]] : {}) };
        const shoe = buildShoe(spec, shoeMats(spec, trims[idx]));
        shoe.rotation.y = Math.PI / 2 + (k ? 0.25 : -0.25);
        shoe.position.set(-0.25 + k * 0.5 - spec.L / 2 * Math.sign(-0.25 + k * 0.5) * 0 - (k ? -0.12 : 0.12), 0.01, 0.0);
        sh.add(shoe);
      }
    }
    const em = brandEmblem(0.07);
    em.position.set(0, 0.05, D / 2 + 0.001);
    root.add(em);
    return done(root, 'store-fixture', variant, o);
  }

  if (variant === 'fitting-mirror') {
    const W = 0.62, H = 1.65;
    const mirror = group('mirror', { parent: root, at: [0, 0.12, 0], rot: [-0.08, 0, 0] });
    const outer = panelOutline(W, H, arch || style === 'classic');
    const fr = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
    const fw = style === 'slab' ? 0.07 : 0.045;
    const inner = panelOutline(W - fw * 2, H - fw * 2, arch || style === 'classic').map(([x, y]) => [x, y + fw]);
    fr.holes.push(new THREE.Path([...inner].reverse().map(([x, y]) => new THREE.Vector2(x, y))));
    const fg = new THREE.ExtrudeGeometry(fr, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 24 });
    mesh(fg, frameM, { parent: mirror, at: [0, 0, -0.015], name: 'frame' });
    const pane = new THREE.ShapeGeometry(new THREE.Shape(inner.map(([x, y]) => new THREE.Vector2(x, y))), 24);
    mesh(pane, mirrorMat(), { parent: mirror, at: [0, 0, 0.004], name: 'glass' });
    mesh(new THREE.ShapeGeometry(new THREE.Shape(inner.map(([x, y]) => new THREE.Vector2(x, y))), 24), M.matte('#2a2a2c'), { parent: mirror, at: [0, 0, -0.004], rot: [0, Math.PI, 0], scale: [-1, 1, 1] });
    // stand: two side posts with swivel pins + feet
    for (const s of [-1, 1]) {
      const x = s * (W / 2 + 0.03);
      if (style === 'pipe') mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.1, 12), metalM, { parent: root, at: [x, 0.55, 0] });
      else mesh(roundedBox(0.035, 1.1, 0.035, 0.008), frameM, { parent: root, at: [x, 0.55, 0] });
      mesh(roundedBox(0.04, 0.03, 0.42, 0.01), frameM, { parent: root, at: [x, 0.015, 0], name: 'foot' });
      mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 12).rotateZ(Math.PI / 2), metalM, { parent: root, at: [x - s * 0.017, 0.92, 0.0], name: 'pin' });
    }
    mesh(roundedBox(W + 0.06, 0.03, 0.03, 0.008), frameM, { parent: root, at: [0, 0.2, 0], name: 'stretcher' });
    return done(root, 'store-fixture', variant, o);
  }

  if (variant === 'jewellery-case') {
    const W = 1.3, Hc = 0.9, D = 0.56, Hg = 0.3;
    const cab = mesh(style === 'slab' ? roundedBox(W, Hc, D, 0.02) : roundedBox(W, Hc - 0.08, D, 0.012), bodyM, { parent: root, at: [0, style === 'slab' ? Hc / 2 : 0.08 + (Hc - 0.08) / 2, 0], name: 'cabinet' });
    void cab;
    if (style !== 'slab') {
      if (style === 'pipe' || arch) for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(taperTube([[sx * (W / 2 - 0.06), 0.085, sz * (D / 2 - 0.06)], [sx * (W / 2 - 0.05), 0, sz * (D / 2 - 0.05)]], [0.02, 0.014], { seg: 2, radial: 12 }), metalM, { parent: root });
      else mesh(roundedBox(W - 0.06, 0.08, D - 0.06, 0.01), M.matte('#1b1b1d'), { parent: root, at: [0, 0.04, 0], name: 'kick' });
    }
    mesh(roundedBox(W + 0.02, 0.03, D + 0.02, 0.008), style === 'slab' ? bodyM : frameM, { parent: root, at: [0, Hc + 0.015, 0], name: 'deck_rim' });
    const deckY = Hc + 0.03;
    mesh(roundedBox(W - 0.04, 0.01, D - 0.04, 0.004), fabricMat('velvet', trim === 'pink-boutique' ? '#f4ede2' : '#1d2a4a', { plain: true }), { parent: root, at: [0, deckY + 0.005, 0], name: 'velvet' });
    // glass box with metal edges
    const gT = 0.008;
    const gM = glassPane();
    mesh(roundedBox(W, gT, D, 0.003), gM, { parent: root, at: [0, deckY + Hg, 0], name: 'glass_top' });
    for (const s of [-1, 1]) {
      mesh(roundedBox(W, Hg, gT, 0.003), gM, { parent: root, at: [0, deckY + Hg / 2, s * (D / 2 - gT / 2)], name: 'glass_side' });
      mesh(roundedBox(gT, Hg, D, 0.003), gM, { parent: root, at: [s * (W / 2 - gT / 2), deckY + Hg / 2, 0], name: 'glass_end' });
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.016, Hg + gT, 0.016, 0.004), metalM, { parent: root, at: [sx * (W / 2 - 0.008), deckY + (Hg + gT) / 2, sz * (D / 2 - 0.008)], name: 'edge' });
    // LED strip under the glass top
    const led = lampGroup('case_light', 'white');
    led.add(root, { at: [0, deckY + Hg - 0.012, -D / 2 + 0.05], normal: [0, -1, 0], w: W - 0.12, h: 0.012, depth: 0.006, shape: 'strip', bezel: false, glowSize: 0.3 });
    mesh(roundedBox(W - 0.1, 0.012, 0.02, 0.004), metalM, { parent: root, at: [0, deckY + Hg - 0.002 - 0.008 + 0.002, -D / 2 + 0.05], name: 'led_bar' });
    // contents: ring cushions, mini busts, bracelets
    const goldM = PRECIOUS.gold(), silverM = PRECIOUS.silver();
    const velvetD = fabricMat('velvet', '#141416', { plain: true });
    for (let i = 0; i < 5; i++) {
      const x = -0.5 + i * 0.25;
      if (i % 2 === 0) {
        mesh(cushion(0.12, 0.04, 0.09, { bulge: 0.3 }), velvetD, { parent: root, at: [x, deckY + 0.03, 0.05], name: 'ring_pad' });
        for (let k = 0; k < 3; k++) {
          const rr = 0.0095;
          const rg = mesh(new THREE.TorusGeometry(rr, 0.0014, 8, 32), k % 2 ? silverM : goldM, { parent: root, at: [x - 0.035 + k * 0.035, deckY + 0.05 + rr * 0.6, 0.05], name: 'ring' });
          void rg;
          mesh(gemGeo(0.0035), gemMat(['#ffffff', '#c0102a', '#1c3fae'][k]), { parent: root, at: [x - 0.035 + k * 0.035, deckY + 0.05 + rr * 1.6 + 0.0035, 0.05] });
        }
      } else {
        mesh(roundedBox(0.09, 0.12, 0.04, 0.012), velvetD, { parent: root, at: [x, deckY + 0.07, -0.08], name: 'bust' });
        mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.07, 20), velvetD, { parent: root, at: [x, deckY + 0.16, -0.085], name: 'bust_neck' });
        const pts = [];
        for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI; pts.push([x + Math.cos(a) * 0.03, deckY + 0.12 - Math.sin(a) * 0.045, -0.058]); }
        curveTube(pts, 0.0016, goldM, { parent: root, segments: 24, radialSegments: 6, name: 'necklace' });
        mesh(gemGeo(0.006, { cut: 'pear' }), gemMat('#0f8a4a', { ior: 1.58 }), { parent: root, at: [x, deckY + 0.072, -0.056], rot: [Math.PI / 2, 0, 0] });
      }
    }
    const em = brandEmblem(0.08);
    em.position.set(0, Hc * 0.55, D / 2 + 0.0005);
    root.add(em);
    return done(root, 'store-fixture', variant, o, () => [clip('on', 1, lampTracks('case_light', 3))]);
  }

  if (variant === 'fitting-room') {
    const W = 1.1, D = 1.1, H = 2.1;
    for (const s of [-1, 1]) mesh(roundedBox(0.04, H, D, 0.01), bodyM, { parent: root, at: [s * (W / 2 + 0.02), H / 2, 0], name: 'wall' });
    mesh(roundedBox(W + 0.08, H, 0.04, 0.01), bodyM, { parent: root, at: [0, H / 2, -D / 2 - 0.02], name: 'back_wall' });
    mesh(roundedBox(W, 0.02, D, 0.006), M.matte('#6b6660', 0.9), { parent: root, at: [0, 0.01, 0], name: 'floor' });
    // mirror on the back wall
    const mo = panelOutline(0.5, 1.4, arch);
    mesh(extrudeOutline(mo, 0.012, { bevel: 0.004, segments: 1 }), frameM, { parent: root, at: [0, 0.45, -D / 2 + 0.006], name: 'mirror_frame' });
    mesh(new THREE.ShapeGeometry(new THREE.Shape(panelOutline(0.46, 1.36, arch).map(([x, y]) => new THREE.Vector2(x, y + 0.02))), 16), mirrorMat(), { parent: root, at: [0, 0.45, -D / 2 + 0.0135], name: 'mirror' });
    // stool + hooks
    mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 28), fabricMat('velvet', trim === 'pink-boutique' ? '#e8a3b0' : '#3a4a5a', { plain: true }), { parent: root, at: [0.25, 0.45, -0.15], name: 'stool_seat' });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; mesh(taperTube([[0.25 + Math.cos(a) * 0.1, 0.42, -0.15 + Math.sin(a) * 0.1], [0.25 + Math.cos(a) * 0.14, 0.02, -0.15 + Math.sin(a) * 0.14]], [0.012, 0.009], { seg: 2, radial: 10 }), metalM, { parent: root }); }
    for (let i = 0; i < 2; i++) { const z = -0.3 + i * 0.3; curveTube([[-W / 2, 1.7, z], [-W / 2 + 0.05, 1.7, z], [-W / 2 + 0.06, 1.74, z]], 0.006, metalM, { parent: root, segments: 8, radialSegments: 6, name: 'hook' }); }
    // curtain rail + curtain (animated open/close)
    mesh(new THREE.CylinderGeometry(0.012, 0.012, W + 0.04, 12).rotateZ(Math.PI / 2), metalM, { parent: root, at: [0, H - 0.04, D / 2 - 0.03], name: 'rail' });
    const cur = group('curtain', { parent: root, at: [-W / 2, H - 0.04, D / 2 - 0.03] });
    const cw = W * 0.55;
    const curtainM = fabricMat(trim === 'pink-boutique' ? 'velvet' : trim === 'industrial' ? 'linen' : 'velvet', trim === 'pink-boutique' ? '#c86b85' : trim === 'industrial' ? '#8a8172' : trim === 'brass' ? '#6b1d2a' : '#2a3a4a', { c2: '#6b6050', repeat: [4, 4] });
    mesh(paramGeo((u, v) => [u * cw, -0.02 - v * (H - 0.12), Math.sin(u * Math.PI * 14) * 0.03 * (0.6 + 0.4 * v)], 112, 12), curtainM, { parent: cur, name: 'curtain_cloth' });
    for (let i = 0; i <= 8; i++) mesh(new THREE.TorusGeometry(0.018, 0.003, 6, 14), metalM, { parent: cur, at: [i * cw / 8, 0, 0], name: 'curtain_ring' });
    anims.push(cur);
    return done(root, 'store-fixture', variant, o, () => [clip('close', 4, [scaleTrack(cur, 4, (t) => [1 + pingPong(t) * 0.75, 1, 1])])]);
  }

  if (variant === 'hat-stand') {
    const H = 1.8;
    // tripod base or round weighted base
    if (style === 'pipe' || style === 'modern') mesh(lathe([[0, 0], [0.22, 0], [0.225, 0.012], [0.2, 0.03], [0.04, 0.04], [0, 0.04]], 40), metalM, { parent: root, name: 'base' });
    else for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; mesh(taperTube([[0, 0.3, 0], [Math.cos(a) * 0.2, 0.12, Math.sin(a) * 0.2], [Math.cos(a) * 0.3, 0.012, Math.sin(a) * 0.3]], [0.022, 0.016], { seg: 12, radial: 10 }), frameM, { parent: root, name: 'leg' }); mesh(new THREE.SphereGeometry(0.016, 10, 8), M.rubber(), { parent: root, at: [Math.cos(a) * 0.3, 0.012, Math.sin(a) * 0.3] }); }
    mesh(style === 'pipe' ? new THREE.CylinderGeometry(0.017, 0.017, H, 14) : new THREE.CylinderGeometry(0.018, 0.024, H, 16), style === 'pipe' ? metalM : frameM, { parent: root, at: [0, H / 2 + 0.02, 0], name: 'pole' });
    mesh(new THREE.SphereGeometry(0.03, 16, 12), style === 'pipe' ? metalM : frameM, { parent: root, at: [0, H + 0.03, 0], name: 'finial' });
    const hatM = [fabricMat('wool', '#3a3530', { plain: true }), fabricMat('straw', '#e3c98f', { plain: true }), fabricMat('wool', '#7a1f2b', { plain: true }), fabricMat('suede', '#8a5a32', { plain: true })];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3;
      const hy = H - 0.12 - (i % 2) * 0.14;
      const hx = Math.cos(a), hz = Math.sin(a);
      curveTube([[hx * 0.015, hy - 0.08, hz * 0.015], [hx * 0.12, hy - 0.02, hz * 0.12], [hx * 0.16, hy + 0.04, hz * 0.16], [hx * 0.15, hy + 0.07, hz * 0.15]], 0.008, metalM, { parent: root, segments: 16, radialSegments: 8, name: 'hook' });
      mesh(new THREE.SphereGeometry(0.012, 10, 8), metalM, { parent: root, at: [hx * 0.15, hy + 0.07, hz * 0.15] });
      if (i < 3) {
        // a hat hanging on the hook tip (crown hooked, brim tilted)
        const hat = group('hat', { parent: root, at: [hx * 0.24, hy + 0.04, hz * 0.24], rot: [0, -a + Math.PI / 2, 0] });
        const inner = group('hat_tilt', { parent: hat, rot: [0, 0, -1.25] });
        mesh(lathe([[0.092, 0], [0.088, 0.07], [0.07, 0.1], [0.0001, 0.095]], 32), hatM[i], { parent: inner, at: [0, -0.04, 0] });
        mesh(lathe([[0.09, 0.002], [0.15, 0.004 + (i === 1 ? -0.01 : 0.008)], [0.152, 0.0], [0.09, -0.002]], 40), hatM[i], { parent: inner, at: [0, -0.04, 0] });
        mesh(lathe([[0.0935, 0.0], [0.0935, 0.022]], 32), fabricMat('silk', '#1b1b1d', { plain: true }), { parent: inner, at: [0, -0.04, 0] });
      } else {
        // a scarf draped on the last hook
        mesh(taperTube([[hx * 0.12, hy - 0.45, hz * 0.12 + 0.02], [hx * 0.155, hy + 0.05, hz * 0.155], [hx * 0.2, hy - 0.4, hz * 0.2 - 0.02]], 0.08, { flat: 0.08, side: [-hz, 0, hx], seg: 24, radial: 12 }), fabricMat('plaid', '#a3202a', { c2: '#1d2230', c3: '#e8c547', repeat: [2, 4] }), { parent: root, name: 'scarf' });
      }
    }
    return done(root, 'store-fixture', variant, o);
  }

  // checkout counter
  const W = 1.6, H = 1.0, D = 0.6;
  mesh(style === 'slab' ? roundedBox(W, H - 0.04, D, 0.015) : roundedBox(W, H - 0.04, D - 0.04, 0.012), bodyM, { parent: root, at: [0, (H - 0.04) / 2, 0], name: 'counter' });
  if (arch) for (let i = 0; i < 12; i++) mesh(new THREE.CylinderGeometry(0.025, 0.025, H - 0.1, 12), frameM, { parent: root, at: [-W / 2 + 0.1 + i * (W - 0.2) / 11, (H - 0.1) / 2 + 0.03, (D - 0.04) / 2 + 0.01], name: 'flute' });
  mesh(roundedBox(W + 0.06, 0.04, D + 0.04, 0.01), style === 'slab' || style === 'classic' ? marbleMat(style === 'classic' ? '#e8e2d8' : '#f2f0ec') : frameM, { parent: root, at: [0, H - 0.02, 0], name: 'top' });
  // POS screen
  const pos = group('pos', { parent: root, at: [0.35, H, -0.05] });
  mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.015, 24), M.plastic('#1b1b1d', 0.4), { parent: pos, at: [0, 0.0075, 0] });
  mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 12), M.metal('#2a2b2e', 0.35), { parent: pos, at: [0, 0.09, 0] });
  const scr = group('screen_mount', { parent: pos, at: [0, 0.2, 0.0], rot: [-0.35, Math.PI, 0] });
  mesh(roundedBox(0.3, 0.2, 0.025, 0.01), M.plastic('#1b1b1d', 0.4), { parent: scr, at: [0, 0, 0.0] });
  const tex = canvasTex(256, 170, (g, w, h) => { g.fillStyle = '#0d1b2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2f2f2'; g.font = 'bold 22px sans-serif'; g.fillText('Total', 16, 34); g.fillStyle = '#5bd6ff'; g.font = 'bold 40px sans-serif'; g.fillText('$ 128.00', 16, 84); g.fillStyle = '#2a9d8f'; g.fillRect(16, 112, 104, 40); g.fillStyle = '#e76f51'; g.fillRect(136, 112, 104, 40); });
  const sm = new THREE.MeshStandardMaterial({ name: 'screen', color: tex ? '#ffffff' : '#0d1b2a', map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0, roughness: 0.3 });
  if (!tex) sm.emissive.set('#1d4a6a');
  mesh(new THREE.PlaneGeometry(0.27, 0.17), sm, { parent: scr, at: [0, 0, 0.0128], name: 'screen' });
  mesh(roundedBox(0.07, 0.025, 0.12, 0.008), M.plastic('#2a2b2e', 0.4), { parent: root, at: [0.62, H + 0.0125, 0.05], name: 'card_reader' });
  // shopping bag with tissue + emblem
  const bag = group('shopping_bag', { parent: root, at: [-0.4, H, 0.0] });
  const bagM = M.paint(trim === 'pink-boutique' ? '#f4ede2' : '#1b1b1d', { metallic: 0, roughness: 0.5 });
  const bw = 0.26, bh = 0.3, bd = 0.1;
  mesh(roundedBox(bw, 0.004, bd, 0.0015), bagM, { parent: bag, at: [0, 0.002, 0] });
  for (const s of [-1, 1]) { mesh(roundedBox(bw, bh, 0.003, 0.001), bagM, { parent: bag, at: [0, bh / 2, s * bd / 2] }); mesh(roundedBox(0.003, bh, bd, 0.001), bagM, { parent: bag, at: [s * bw / 2, bh / 2, 0] }); }
  for (const s of [-1, 1]) curveTube([[-0.05, bh - 0.02, s * bd / 2], [-0.04, bh + 0.08, s * bd / 2], [0.04, bh + 0.08, s * bd / 2], [0.05, bh - 0.02, s * bd / 2]], 0.003, fabricMat('silk', '#c9a45a', { plain: true }), { parent: bag, segments: 14, radialSegments: 5 });
  mesh(cushion(bw * 0.8, 0.08, bd * 0.7, { bulge: 0.4 }), fabricMat('silk', '#f3d9dc', { plain: true }), { parent: bag, at: [0, bh - 0.01, 0], rot: [0, 0, 0.2], name: 'tissue' });
  const em = brandEmblem(0.07);
  em.position.set(0, bh * 0.55, bd / 2 + 0.0015 + 0.0005);
  bag.add(em);
  const em2 = brandEmblem(0.12);
  em2.position.set(0, H * 0.55, (style === 'slab' ? D / 2 : (D - 0.04) / 2) + 0.0008 + (arch ? 0.035 : 0));
  if (!arch) root.add(em2);
  return done(root, 'store-fixture', variant, o, () => [new THREE.AnimationClip('on', 1, [new THREE.NumberKeyframeTrack('screen.material.emissiveIntensity', [0, 1], [1.2, 1.2])])]);
}
