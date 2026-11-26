// Hero mini-game: a drivable city block built entirely from three-premade models.
// Attract mode drives itself around the block; click "Drive" (or press W/↑) to take the wheel.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

const PITCH = 44; // block pitch (m)
const ROAD = 10; // road width
const LINES = [-1.5, -0.5, 0.5, 1.5].map((k) => k * PITCH); // road centre lines (x and z)
const EDGE = LINES[3] + 26;

export function createHeroGame(canvas, { createObject, createAnimator, onHud }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.AgXToneMapping ?? THREE.ACESFilmicToneMapping; // filmic, photographic response
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.3, 4000);

  // physically based sky; the same sky lights the scene + reflections (car paint, glass)
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(62), THREE.MathUtils.degToRad(215));
  const sky = new Sky();
  sky.scale.setScalar(3000);
  Object.assign(sky.material.uniforms, {});
  sky.material.uniforms.turbidity.value = 4.5;
  sky.material.uniforms.rayleigh.value = 1.6;
  sky.material.uniforms.mieCoefficient.value = 0.004;
  sky.material.uniforms.mieDirectionalG.value = 0.82;
  sky.material.uniforms.sunPosition.value.copy(sunDir);
  scene.add(sky);
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const sky2 = new Sky();
  sky2.scale.setScalar(1000);
  for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) sky2.material.uniforms[k].value = sky.material.uniforms[k].value;
  sky2.material.uniforms.sunPosition.value.copy(sunDir);
  envScene.add(sky2);
  scene.environment = pm.fromScene(envScene).texture;
  scene.environmentIntensity = 0.9;
  pm.dispose();
  scene.fog = new THREE.Fog('#c9d8e6', 90, 420); // aerial perspective toward the horizon colour
  scene.add(new THREE.HemisphereLight('#cfe0f5', '#4f5d3c', 0.35));
  const sun = new THREE.DirectionalLight('#fff0d8', 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 260 });
  scene.add(sun, sun.target);

  // surface textures (canvas noise) so roads, paving and grass read as real materials
  const noiseTex = (w, base, spread, extra, rep) => {
    const c = document.createElement('canvas');
    c.width = c.height = w;
    const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, w, w);
    const img = g.getImageData(0, 0, w, w);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * spread;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    extra?.(g, w);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep, rep);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const grassTex = noiseTex(256, '#647f3f', 34, (g, w) => { for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60},${70 + Math.random() * 60},${20 + Math.random() * 30},0.35)`; g.fillRect(Math.random() * w, Math.random() * w, 2 + Math.random() * 5, 2 + Math.random() * 5); } }, 160);
  const asphaltTex = noiseTex(256, '#3e4044', 26, (g, w) => { for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(20,20,22,0.25)'; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.moveTo(Math.random() * w, Math.random() * w); g.lineTo(Math.random() * w, Math.random() * w); g.stroke(); } }, 30);
  const paveTex = noiseTex(256, '#aaa69e', 18, (g, w) => { g.strokeStyle = 'rgba(70,66,60,0.45)'; g.lineWidth = 2; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(0, k * w / 4); g.lineTo(w, k * w / 4); g.moveTo(k * w / 4, 0); g.lineTo(k * w / 4, w); g.stroke(); } }, 12);

  /* ---------- ground, roads, sidewalks ---------- */
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);
  const asphalt = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.82 });
  const pave = new THREE.MeshStandardMaterial({ map: paveTex, roughness: 0.88 });
  const paint = new THREE.MeshStandardMaterial({ color: '#f1efe6', roughness: 0.6 });
  const L = LINES[3] - LINES[0] + ROAD + 8;
  for (const c of LINES) for (const axis of ['x', 'z']) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? ROAD : L, 0.05, axis === 'x' ? L : ROAD), asphalt);
    road.position.set(axis === 'x' ? c : 0, 0.025, axis === 'x' ? 0 : c);
    road.receiveShadow = true;
    scene.add(road);
    const n = Math.floor(L / 6);
    const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(axis === 'x' ? 0.18 : 2.6, 0.01, axis === 'x' ? 2.6 : 0.18), paint, n);
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { const t = -L / 2 + 3 + i * 6; dash.setMatrixAt(i, m.makeTranslation(axis === 'x' ? c : t, 0.056, axis === 'x' ? t : c)); }
    scene.add(dash);
  }
  // city blocks: raised pavement squares between the roads
  const blocks = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const cx = (LINES[i] + LINES[i + 1]) / 2;
    const cz = (LINES[j] + LINES[j + 1]) / 2;
    const s = PITCH - ROAD;
    const b = new THREE.Mesh(new THREE.BoxGeometry(s, 0.16, s), pave);
    b.position.set(cx, 0.08, cz);
    b.receiveShadow = true;
    scene.add(b);
    blocks.push({ cx, cz, s });
  }

  /* ---------- models from the library (loaded progressively) ---------- */
  const solids = []; // AABBs the car bumps into
  const animators = [];
  const cache = new Map();
  let built = 0;
  async function model(type, variant) {
    const k = `${type}:${variant}`;
    built++;
    onHud?.({ progress: Math.min(1, built / 66) }); // 1 car + 6 traffic + 9 blocks + 20 lights + 26 trees + 4 parked
    await new Promise((r) => requestAnimationFrame(() => r())); // one build per frame: never freeze the page
    if (!cache.has(k)) cache.set(k, createObject(type, { variant }));
    const base = await cache.get(k);
    const o = base.userData.used ? base.clone(true) : base;
    base.userData.used = true;
    o.traverse((n) => { if (n.isMesh) { n.castShadow = !n.userData.noShadow; n.receiveShadow = true; } });
    return o;
  }
  const fit = (o, maxW) => {
    const s = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
    const k = maxW / Math.max(s.x, s.z);
    if (k < 1) o.scale.multiplyScalar(k);
  };
  // intro: every model drops in from the sky with a bounce as soon as it has loaded
  const drops = [];
  let ready = false; // true once the block is built → the drive starts
  const bounce = (k) => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375; return n * (k -= 2.625 / d) * k + 0.984375; };
  const place = (o, x, z, ry, solid = true, baseY = 0) => {
    o.position.set(x, baseY, z);
    o.rotation.y = ry;
    scene.add(o);
    if (solid) { o.updateMatrixWorld(true); solids.push(new THREE.Box3().setFromObject(o).expandByScalar(0.4)); }
    const h0 = 38 + Math.random() * 14;
    o.position.y = baseY + h0;
    drops.push({ o, t: -Math.random() * 0.2, h0, baseY });
    return o;
  };
  const updateDrops = (dt) => {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.t += dt;
      const k = Math.min(1, Math.max(0, d.t / 1.1));
      d.o.position.y = d.baseY + d.h0 * (1 - bounce(k));
      if (k >= 1) drops.splice(i, 1);
    }
  };

  /** Wheel rig for any library vehicle: every wheel_* node rolls, the front wheel_F*_steer nodes turn. */
  function makeRig(o) {
    const rig = { spin: [], steer: [], base: new Map(), roll: 0, steerNow: 0 };
    o.traverse((n) => {
      if (/^wheel_[A-Z0-9]+$/.test(n.name)) { rig.spin.push(n); rig.base.set(n, n.quaternion.clone()); }
      if (/^wheel_F[LR]?_steer$/.test(n.name)) { rig.steer.push(n); rig.base.set(n, n.quaternion.clone()); }
      if (n.name === 'steering_wheel') { rig.wheel = n; rig.base.set(n, n.quaternion.clone()); }
    });
    return rig;
  }
  const _q = new THREE.Quaternion();
  function driveRig(rig, v, dt, steer, radius = 0.36) {
    rig.roll -= (v * dt) / radius; // vehicles face +X: wheels roll about Z
    rig.steerNow += (steer - rig.steerNow) * Math.min(1, dt * 8);
    for (const w of rig.spin) w.quaternion.copy(rig.base.get(w)).multiply(_q.setFromAxisAngle(_Z, rig.roll));
    for (const sN of rig.steer) sN.quaternion.copy(rig.base.get(sN)).multiply(_q.setFromAxisAngle(_Y, rig.steerNow));
    if (rig.wheel) rig.wheel.quaternion.copy(rig.base.get(rig.wheel)).multiply(_q.setFromAxisAngle(_X, -rig.steerNow * 4));
  }

  /* ---------- player car + traffic ---------- */
  const car = { obj: null, x: LINES[1] + 2.4, z: LINES[2] - 2.4, h: Math.PI / 2, v: 0, steer: 0, anim: null };
  const traffic = [];
  /** Rectangular lane loop around road centre lines lo..hi (lane offset 2.4 m). */
  const ring = (lo, hi) => {
    const a = lo + 2.4, b = hi - 2.4;
    const pts = [[a, b], [b, b], [b, a], [a, a]];
    const seg = b - a;
    const len = 4 * seg;
    return { len, at(d) {
      d = ((d % len) + len) % len;
      const i = Math.floor(d / seg);
      const t = (d - i * seg) / seg;
      const [ax, az] = pts[i % 4];
      const [bx, bz] = pts[(i + 1) % 4];
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, h: Math.atan2(bx - ax, bz - az) };
    } };
  };
  const outer = ring(LINES[0], LINES[3]);
  const inner = ring(LINES[1], LINES[2]);
  const loopLen = outer.len;
  const loopAt = outer.at;

  (async () => {
    // the hero car first, so something drives immediately
    try {
      const o = await model('car', 'sports');
      car.obj = place(o, car.x, car.z, car.h - Math.PI / 2, false, 0.02);
      car.anim = createAnimator(o);
      if (car.anim.names.includes('lights')) car.anim.play('lights');
      animators.push(car.anim);
      car.rig = makeRig(o);
    } catch (e) { console.warn(e); }
    // traffic loops the outer ring at different speeds
    const tv = [['car', 'sedan'], ['bus', 'city'], ['car', 'suv'], ['car', 'taxi'], ['truck', 'box'], ['car', 'hatchback']];
    for (let i = 0; i < tv.length; i++) {
      try {
        const o = await model(...tv[i]);
        const p0 = loopAt((i / tv.length) * loopLen);
        place(o, p0.x, p0.z, p0.h - Math.PI / 2, false, 0.02);
        const a = createAnimator(o);
        if (a.names.includes('lights')) a.play('lights');
        animators.push(a);
        traffic.push({ obj: o, d: (i / tv.length) * loopLen, speed: 7 + (i % 3) * 2, rig: makeRig(o), h: p0.h, radius: tv[i][0] === 'car' ? 0.34 : 0.5 });
      } catch {}
    }
    const towers = [['skyscraper', 'glass'], ['skyscraper', 'office'], ['skyscraper', 'tapered'], ['apartment', 'modern'], ['skyscraper', 'art-deco'], ['hotel', 'highrise'], ['office', 'midrise'], ['skyscraper', 'cylinder'], ['apartment', 'brick']];
    for (const [k, b] of blocks.entries()) {
      try {
        const o = await model(...towers[k % towers.length]);
        fit(o, b.s - 8);
        place(o, b.cx, b.cz, (k % 4) * Math.PI / 2);
      } catch {}
      await new Promise((r) => setTimeout(r, 0));
    }
    ready = true;
    onHud?.({ ready: true }); // the block is built: hand over to the drive (dressing keeps dropping in around it)
    // street dressing: lights + trees on the pavements, a park ring of trees outside
    const lightPts = [];
    for (const c of LINES) for (let t = -60; t <= 60; t += 22) { lightPts.push([c + ROAD / 2 + 1, t, -Math.PI / 2]); lightPts.push([t + 11, c - ROAD / 2 - 1, 0]); }
    for (const [x, z, ry] of lightPts.filter((_, i) => i % 2 === 0).slice(0, 20)) { try { place(await model('streetlight', 'modern'), x, z, ry, false); } catch {} }
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = EDGE + (i % 3) * 6;
      try { const t = await model('tree', ['oak', 'maple', 'birch'][i % 3]); place(t, Math.cos(a) * r, Math.sin(a) * r, a, false); } catch {}
    }
    for (let i = 0; i < 4; i++) {
      try { const o = await model('car', ['sedan', 'wagon', 'coupe', 'minivan'][i % 4]); place(o, LINES[1 + (i % 2)] + (i % 2 ? -3.2 : 3.2), -50 + i * 13, (i % 2 ? Math.PI : 0) - Math.PI / 2); } catch {}
    }
    onHud?.({ done: true }); // every model is in: the page can be revealed with nothing left to build
  })();

  /* ---------- input ---------- */
  const keys = new Set();
  let driving = false;
  const KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];
  addEventListener('keydown', (e) => {
    if (!driving || !KEYS.includes(e.code)) return;
    e.preventDefault();
    keys.add(e.code);
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  const start = () => { driving = true; onHud?.({ driving }); };
  const stop = () => { driving = false; keys.clear(); onHud?.({ driving }); };

  /* ---------- physics + camera ---------- */
  const camPos = new THREE.Vector3(car.x + 12, 7, car.z + 12);
  const look = new THREE.Vector3();
  let auto = 0;
  let orbit = 0.6;
  const _X = new THREE.Vector3(1, 0, 0), _Y = new THREE.Vector3(0, 1, 0), _Z = new THREE.Vector3(0, 0, 1);
  const clipOn = new Set();
  const setClip = (n, on) => {
    if (!car.anim || !car.anim.names.includes(n) || clipOn.has(n) === on) return;
    if (on) { car.anim.play(n); clipOn.add(n); } else { car.anim.stop?.(n); clipOn.delete(n); }
  };
  function step(dt) {
    updateDrops(dt);
    if (!ready || !car.obj) {
      // building intro: a slow orbit over the empty block while everything drops into place
      orbit += dt * 0.12;
      camera.position.set(Math.cos(orbit) * 96, 58, Math.sin(orbit) * 96);
      camera.lookAt(0, 0, 0);
      camPos.copy(camera.position);
      look.set(0, 0, 0);
      step.snapped = true;
      sun.position.set(sunDir.x * 140, sunDir.y * 140, sunDir.z * 140);
      sun.target.position.set(0, 0, 0);
      onHud?.({ speed: 0, driving, building: true });
      return;
    }
    if (driving) {
      const up = keys.has('ArrowUp') || keys.has('KeyW');
      const dn = keys.has('ArrowDown') || keys.has('KeyS');
      const lf = keys.has('ArrowLeft') || keys.has('KeyA');
      const rt = keys.has('ArrowRight') || keys.has('KeyD');
      const acc = up ? 14 : dn ? (car.v > 0.5 ? -26 : -8) : 0;
      car.v += acc * dt;
      if (keys.has('Space')) car.v *= 1 - 3 * dt;
      car.v *= 1 - (up || dn ? 0.25 : 0.9) * dt;
      car.v = THREE.MathUtils.clamp(car.v, -9, 42);
      const target = (lf ? 1 : 0) - (rt ? 1 : 0);
      car.steer += (target * 0.6 - car.steer) * Math.min(1, dt * 6);
      car.h += car.steer * car.v * dt / (3 + Math.abs(car.v) * 0.06);
      car.x += Math.sin(car.h) * car.v * dt;
      car.z += Math.cos(car.h) * car.v * dt;
      // bump into buildings / parked cars and stay in the world
      for (const b of solids) {
        if (car.x > b.min.x - 1 && car.x < b.max.x + 1 && car.z > b.min.z - 1 && car.z < b.max.z + 1) {
          const dx = Math.min(car.x - (b.min.x - 1), b.max.x + 1 - car.x);
          const dz = Math.min(car.z - (b.min.z - 1), b.max.z + 1 - car.z);
          if (dx < dz) car.x += car.x < (b.min.x + b.max.x) / 2 ? -dx : dx;
          else car.z += car.z < (b.min.z + b.max.z) / 2 ? -dz : dz;
          car.v *= -0.25;
        }
      }
      car.x = THREE.MathUtils.clamp(car.x, -EDGE - 30, EDGE + 30);
      car.z = THREE.MathUtils.clamp(car.z, -EDGE - 30, EDGE + 30);
    } else {
      // attract mode: cruise the inner ring
      auto += dt * 13;
      const p = inner.at(auto);
      car.x = p.x;
      car.z = p.z;
      car.h = p.h;
      car.v = 13;
    }
    if (!drops.some((d) => d.o === car.obj)) car.obj.position.set(car.x, 0.02, car.z);
    if (car.rig) {
      driveRig(car.rig, car.v, dt, driving ? car.steer * 0.9 : 0, 0.34);
      // brake + reversing lights
      const braking = driving && ((keys.has('ArrowDown') || keys.has('KeyS')) && car.v > 0.5 || keys.has('Space'));
      setClip('brake', braking);
      setClip('reverse', driving && car.v < -0.3);
    }
    car.obj.rotation.y = car.h - Math.PI / 2; // library vehicles face +X
    for (const t of traffic) {
      t.d += t.speed * dt;
      const p = loopAt(t.d);
      if (!drops.some((d) => d.o === t.obj)) t.obj.position.set(p.x, 0.02, p.z);
      // bots: wheels roll at their speed and the front wheels turn into each corner
      let dh = p.h - t.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      t.h = p.h;
      driveRig(t.rig, t.speed, dt, THREE.MathUtils.clamp((dh / Math.max(dt, 1e-3)) * 0.35, -0.55, 0.55), t.radius);
      t.obj.rotation.y = p.h - Math.PI / 2;
    }
    // chase camera; in attract mode it frames the car on the right of the hero (copy sits on the left)
    const fx = Math.sin(car.h), fz = Math.cos(car.h);
    const back = driving ? 11 : 18;
    const high = driving ? 4.6 : 13; // attract mode rides high so towers never fill the frame
    const want = new THREE.Vector3(car.x - fx * back, high, car.z - fz * back);
    if (!step.snapped) { camPos.copy(want); look.set(car.x, 1.2, car.z); step.snapped = true; } // first frame: start framed
    camPos.lerp(want, Math.min(1, dt * (driving ? 4 : 1.4)));
    camera.position.copy(camPos);
    const shift = driving ? 0 : 7; // look left of the car so it lands right of centre
    look.lerp(new THREE.Vector3(car.x + fx * 6 + fz * shift, 1.2, car.z + fz * 6 - fx * shift), Math.min(1, dt * 4));
    camera.lookAt(look);
    sun.position.set(car.x + sunDir.x * 120, sunDir.y * 120, car.z + sunDir.z * 120);
    sun.target.position.set(car.x, 0, car.z);
    onHud?.({ speed: Math.round(Math.abs(car.v) * 3.6), driving });
  }

  /* ---------- loop ---------- */
  let visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (!visible && driving) stop(); }).observe(canvas);
  const fitView = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(fitView).observe(canvas);
  fitView();
  const clock = new THREE.Clock();
  let paused = false; // while the page's loading screen covers the hero, build only (no drawing)
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || paused) return;
    step(dt);
    for (const a of animators) a.update(dt * (a === car.anim ? Math.max(0.2, Math.abs(car.v) / 12) : 1));
    renderer.render(scene, camera);
  });
  return { start, stop, get driving() { return driving; }, set paused(v) { paused = v; } };
}
