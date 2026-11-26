// Explorable showroom for the shop hero: ~1000 models from every category laid out in
// colour-coded districts on a studio floor. Pan / orbit / zoom with MapControls; models
// stream in around the camera (and unload far away) so the page stays fast.
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const CELL = 3.4; // metres between model centres
const COLS = 8; // models per district row
const ROWS = 6; // rows per district  → 48 per category
const GAP = 7; // avenue width between districts
const FIT = 2.5; // models are scaled to fit this footprint/height

/** The showroom's model list (shared with scripts/thumbs.html so every slot has a prerendered picture). */
export function pickShowroom(models, CATALOG, CATEGORIES) {
  const perCat = COLS * ROWS;
  const picks = {};
  for (const c of CATEGORIES) {
    if (c === 'maps') continue; // whole maps are scenes, not showroom pieces
    const pool = models.filter((m) => m.category === c && !m.trim && m.quality !== 'hd' && CATALOG[m.type].category === c);
    const byType = new Map();
    for (const m of pool) (byType.get(m.type) ?? byType.set(m.type, []).get(m.type)).push(m);
    const out = [];
    for (let round = 0; out.length < perCat && round < 12; round++) {
      let added = false;
      for (const list of byType.values()) {
        if (list[round] && out.length < perCat) { out.push(list[round]); added = true; }
      }
      if (!added) break;
    }
    if (out.length) picks[c] = out;
  }
  return picks;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ models, CATALOG, CATEGORIES, createObject, createAnimator, catColor, fullName, link, onStatus, onHover }} ctx
 */
export function createShowroom(canvas, ctx) {
  const { models, CATALOG, CATEGORIES, createObject, createAnimator, catColor, fullName, link } = ctx;
  const dark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);

  const picks = pickShowroom(models, CATALOG, CATEGORIES);
  const cats = Object.keys(picks);

  /* ---------- renderer / scene ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.3, 900);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8478, 0.55);
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 160 });
  scene.add(hemi, sun, sun.target);

  /* ---------- floor, districts, labels ---------- */
  const dW = COLS * CELL;
  const dD = ROWS * CELL;
  const perRow = Math.ceil(Math.sqrt(cats.length * 1.6));
  const rowsN = Math.ceil(cats.length / perRow);
  const worldW = perRow * (dW + GAP) + GAP;
  const worldD = rowsN * (dD + GAP + 3) + GAP;
  const floorTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 3;
    g.strokeRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set((worldW + 200) / CELL, (worldD + 200) / CELL);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.92, metalness: 0 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(worldW + 200, worldD + 200), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const slots = [];
  const districts = [];
  const texLoader = new THREE.TextureLoader();
  const pending = []; // picture loads, started only once the showroom is on screen, a few per frame
  const imgBase = ctx.imgBase ?? '../docs/images/';
  const plinthGeo = new THREE.CylinderGeometry(1.35, 1.42, 0.08, 40);
  cats.forEach((c, i) => {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const x0 = -worldW / 2 + GAP + col * (dW + GAP);
    const z0 = -worldD / 2 + GAP + row * (dD + GAP + 3);
    const color = new THREE.Color(catColor(c));
    // district pad (soft tint of the category colour) + coloured front edge
    const pad = new THREE.Mesh(new THREE.BoxGeometry(dW + 1.2, 0.04, dD + 1.2), new THREE.MeshStandardMaterial({ color: color.clone().lerp(new THREE.Color('#ffffff'), 0.62), roughness: 0.85 }));
    pad.position.set(x0 + dW / 2, 0.02, z0 + dD / 2);
    pad.receiveShadow = true;
    scene.add(pad);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(dW + 1.2, 0.06, 0.35), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
    edge.position.set(x0 + dW / 2, 0.03, z0 + dD + 0.6);
    scene.add(edge);
    // district name painted on the floor in front
    const lc = document.createElement('canvas');
    lc.width = 1024; lc.height = 160;
    const lg = lc.getContext('2d');
    lg.fillStyle = catColor(c);
    lg.font = '800 96px "Bricolage Grotesque", Helvetica, Arial, sans-serif';
    lg.textBaseline = 'middle';
    lg.fillText(c.charAt(0).toUpperCase() + c.slice(1), 8, 70);
    lg.fillStyle = 'rgba(40,36,56,0.55)';
    lg.font = '600 40px Helvetica, Arial, sans-serif';
    const total = models.filter((m) => m.category === c).length;
    lg.fillText(`${total.toLocaleString()} models`, 10, 138);
    const lt = new THREE.CanvasTexture(lc);
    lt.colorSpace = THREE.SRGBColorSpace;
    lt.anisotropy = 8;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(14, 14 * 160 / 1024), new THREE.MeshBasicMaterial({ map: lt, transparent: true, depthWrite: false }));
    label.rotation.x = -Math.PI / 2;
    label.position.set(x0 + 7.4, 0.07, z0 + dD + 2.6);
    scene.add(label);
    // plinths (instanced) and slots
    const plinths = new THREE.InstancedMesh(plinthGeo, new THREE.MeshStandardMaterial({ color: '#fbfaf8', roughness: 0.4, metalness: 0.05 }), picks[c].length);
    plinths.receiveShadow = true;
    plinths.castShadow = true;
    const mtx = new THREE.Matrix4();
    picks[c].forEach((m, k) => {
      const x = x0 + CELL / 2 + (k % COLS) * CELL;
      const z = z0 + CELL / 2 + Math.floor(k / COLS) * CELL;
      mtx.makeTranslation(x, 0.08, z);
      plinths.setMatrixAt(k, mtx);
      // prerendered picture on the plinth: shows instantly; swapped for the real 3D model up close
      const sm = new THREE.SpriteMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const sprite = new THREE.Sprite(sm);
      sprite.scale.set(3.0, 2.25, 1);
      sprite.position.set(x, 1.2, z);
      sprite.renderOrder = 1;
      scene.add(sprite);
      pending.push(() => texLoader.load(`${imgBase}${m.type}-${m.variant}.webp`, (t) => { t.colorSpace = THREE.SRGBColorSpace; sm.map = t; sm.opacity = 1; sm.needsUpdate = true; }, undefined, () => (sprite.visible = false)));
      const slot = { m, x, z, k, cat: c, obj: null, loading: false, hit: null, anim: null, sprite };
      sprite.userData.slot = slot;
      slots.push(slot);
    });
    scene.add(plinths);
    districts.push({ c, cx: x0 + dW / 2, cz: z0 + dD / 2 });
  });

  /* ---------- fog + theme ---------- */
  const applyTheme = () => {
    const bg = dark() ? new THREE.Color('#15131d') : new THREE.Color('#dfe2ea');
    scene.background = bg;
    scene.fog = new THREE.Fog(bg, 60, 170);
    floorMat.color.set(dark() ? '#2a2836' : '#d9d7d1');
    hemi.intensity = dark() ? 0.35 : 0.55;
  };
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- controls ---------- */
  const controls = new MapControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = false;
  controls.minDistance = 5;
  controls.maxDistance = 260;
  controls.maxPolarAngle = Math.PI * 0.44;
  controls.zoomToCursor = true;
  // start zoomed out over every district
  controls.target.set(0, 0, 4);
  camera.position.set(0, Math.max(worldW, worldD) * 0.62, worldD * 0.72);
  controls.update();
  // keep the camera over the world
  controls.addEventListener('change', () => {
    const t = controls.target;
    const cx = THREE.MathUtils.clamp(t.x, -worldW / 2, worldW / 2) - t.x;
    const cz = THREE.MathUtils.clamp(t.z, -worldD / 2, worldD / 2) - t.z;
    if (cx || cz) { t.x += cx; t.z += cz; camera.position.x += cx; camera.position.z += cz; }
  });

  /* ---------- fly to a district ---------- */
  let fly = null;
  function flyTo(cat) {
    const d = districts.find((x) => x.c === cat);
    if (!d) return;
    fly = { t: 0, fromT: controls.target.clone(), fromC: camera.position.clone(), toT: new THREE.Vector3(d.cx, 0, d.cz + 2), toC: new THREE.Vector3(d.cx + 6, 9, d.cz + 20) };
  }

  /* ---------- streaming ---------- */
  const animated = new Set();
  let active = 0;
  const MAX_LOADED = 420;
  const loaded = new Set();
  const PREF = ['lights', 'idle', 'wind', 'spin', 'running', 'on', 'sway', 'breathe', 'rotate'];
  function place(slot, o) {
    const box = new THREE.Box3().setFromObject(o);
    const size = box.getSize(new THREE.Vector3());
    const s = Math.min(FIT / Math.max(size.x, size.z, 1e-3), (FIT * 1.15) / Math.max(size.y, 1e-3), 6);
    const holder = new THREE.Group();
    o.scale.multiplyScalar(s);
    o.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(o);
    o.position.x -= (b2.min.x + b2.max.x) / 2;
    o.position.z -= (b2.min.z + b2.max.z) / 2;
    o.position.y -= b2.min.y;
    holder.add(o);
    holder.position.set(slot.x, 0.12, slot.z);
    holder.rotation.y = ((slot.x * 13.1 + slot.z * 7.7) % 1) * 0.6 - 0.3;
    o.traverse((n) => { if (n.isMesh) { n.castShadow = !n.userData.noShadow; n.receiveShadow = true; } });
    // cheap invisible hit box for hover / click
    const hb = new THREE.Box3().setFromObject(holder);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(...hb.getSize(new THREE.Vector3()).toArray()), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(hb.getCenter(new THREE.Vector3()));
    hit.userData.slot = slot;
    scene.add(holder, hit);
    slot.obj = holder;
    slot.hit = hit;
    if (slot.sprite) slot.sprite.visible = false;
    const clipName = PREF.find((n) => o.animations?.some((a) => a.name === n));
    if (clipName && animated.size < 140) {
      try { slot.anim = createAnimator(o); slot.anim.play(clipName); animated.add(slot); } catch {}
    }
    loaded.add(slot);
  }
  function unload(slot) {
    if (!slot.obj) return;
    scene.remove(slot.obj, slot.hit);
    slot.obj.traverse((n) => { if (n.isMesh) n.geometry?.dispose(); });
    slot.hit.geometry.dispose();
    slot.obj = slot.hit = slot.anim = null;
    if (slot.sprite?.material.map) slot.sprite.visible = true;
    animated.delete(slot);
    loaded.delete(slot);
  }
  function stream() {
    const t = controls.target;
    const camD = camera.position.distanceTo(t);
    const overview = camD > 32; // pictures until you're properly close: 3D builds only there
    const R = overview ? Infinity : THREE.MathUtils.clamp(camD * 0.9, 10, 26);
    for (const s of slots) s.d = Math.hypot(s.x - t.x, s.z - t.z);
    // fog follows the zoom so the overview isn't hazed out
    scene.fog.near = camD * 0.9;
    scene.fog.far = camD * 2.6 + 60;
    // free far models first when over budget
    if (overview) for (const s of [...loaded]) unload(s); // zoomed out: pictures are enough
    if (!overview && loaded.size > MAX_LOADED) [...loaded].sort((a, b) => b.d - a.d).slice(0, loaded.size - MAX_LOADED).forEach(unload);
    if (!overview) for (const s of loaded) if (s.d > R * 1.8) unload(s);
    // overview: fill every district a few models at a time (round-robin); close up: nearest first
    const want = overview ? [] : slots.filter((s) => !s.obj && !s.loading && s.d < R).sort(overview ? (a, b) => a.k - b.k || a.d - b.d : (a, b) => a.d - b.d);
    while (active < 1 && want.length) {
      const s = want.shift();
      s.loading = true;
      active++;
      // yield to the frame loop between builds so panning stays smooth
      const later = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 120 }) : (f) => setTimeout(f, 16);
      later(() => {
        createObject(s.m.type, { variant: s.m.variant })
          .then((o) => { const tt = controls.target; if (R === Infinity || Math.hypot(s.x - tt.x, s.z - tt.z) < R * 1.8) place(s, o); })
          .catch(() => {})
          .finally(() => { s.loading = false; active--; ctx.onStatus?.(loaded.size, slots.length); });
      });
    }
    // shadows follow the camera target
    sun.position.set(t.x + 30, 55, t.z + 22);
    sun.target.position.copy(t);
  }

  /* ---------- hover + click ---------- */
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let hover = null;
  let downAt = null;
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    ray.camera = camera; // sprites need it
    const targets = [...[...loaded].map((s) => s.hit), ...slots.filter((s) => !s.obj && s.sprite.visible && s.sprite.material.map).map((s) => s.sprite)];
    const hits = ray.intersectObjects(targets, false);
    return hits[0]?.object.userData.slot ?? null;
  };
  canvas.addEventListener('pointermove', (e) => {
    const s = pick(e);
    if (s !== hover) {
      hover = s;
      canvas.style.cursor = s ? 'pointer' : '';
    }
    ctx.onHover?.(s ? { name: fullName(s.m.type, s.m.variant), category: s.cat, x: e.clientX, y: e.clientY } : null);
  });
  canvas.addEventListener('pointerleave', () => ctx.onHover?.(null));
  canvas.addEventListener('pointerdown', (e) => (downAt = [e.clientX, e.clientY]));
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const s = pick(e);
    if (s) location.href = link(s.m.type, s.m.variant);
  });

  /* ---------- loop ---------- */
  let visible = false;
  new IntersectionObserver((en) => (visible = en[0].isIntersecting)).observe(canvas);
  const fit = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(fit).observe(canvas);
  fit();
  const clock = new THREE.Clock();
  let acc = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (!visible) return;
    for (let i = 0; i < 24 && pending.length; i++) pending.shift()();
    if (fly) {
      fly.t = Math.min(1, fly.t + dt / 1.2);
      const k = fly.t * fly.t * (3 - 2 * fly.t);
      controls.target.lerpVectors(fly.fromT, fly.toT, k);
      camera.position.lerpVectors(fly.fromC, fly.toC, k);
      if (fly.t >= 1) fly = null;
    }
    controls.update();
    acc += dt;
    if (acc > 0.25) { acc = 0; stream(); }
    for (const s of animated) s.anim.update(dt);
    renderer.render(scene, camera);
  });
  return { flyTo, categories: cats, total: slots.length };
}
