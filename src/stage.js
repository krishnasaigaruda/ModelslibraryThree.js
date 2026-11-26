import * as THREE from 'three';
import { createAnimator } from './core/animation.js';

/**
 * Optional helper: a ready-to-go scene (renderer, camera, orbit controls,
 * soft lighting, shadow-catching ground, render loop that drives animations).
 *
 *   import { createStage } from 'three-premade/stage';
 *   const stage = await createStage(document.body);
 *   const car = await createObject('car', { variant: 'suv' });
 *   const anim = stage.add(car, { play: ['drive', 'lights'] });
 *   stage.frame(car);
 */
export async function createStage(container = document.body, { background = '#e9e7e3', ground = true, shadows = true, controls = true } = {}) {
  const [{ OrbitControls }, { RoomEnvironment }] = await Promise.all([
    import('three/addons/controls/OrbitControls.js'),
    import('three/addons/environments/RoomEnvironment.js'),
  ]);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (background) scene.background = new THREE.Color(background);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 2000);
  camera.position.set(8, 5, 10);

  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(10, 18, 12);
  sun.castShadow = shadows;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 120 });
  scene.add(sun, sun.target);

  if (ground) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.ShadowMaterial({ opacity: 0.25 }));
    g.rotation.x = -Math.PI / 2;
    g.receiveShadow = true;
    scene.add(g);
  }

  const orbit = controls ? new OrbitControls(camera, renderer.domElement) : null;
  if (orbit) orbit.enableDamping = true;

  const animators = new Set();
  const clock = new THREE.Clock();
  const resize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    for (const a of animators) a.update(dt);
    orbit?.update();
    renderer.render(scene, camera);
  });

  return {
    scene, camera, renderer, controls: orbit,
    /** Add an object; returns its animator. `play` starts animations immediately. */
    add(object, { play = [] } = {}) {
      scene.add(object);
      const anim = createAnimator(object);
      animators.add(anim);
      for (const n of [].concat(play)) anim.play(n);
      return anim;
    },
    remove(object) {
      scene.remove(object);
    },
    /** Point the camera at an object (or the whole scene). */
    frame(object = scene) {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3()).length();
      const c = box.getCenter(new THREE.Vector3());
      camera.position.copy(c).add(new THREE.Vector3(1, 0.6, 1.2).normalize().multiplyScalar(size * 1.1));
      camera.lookAt(c);
      orbit?.target.copy(c);
    },
    dispose() {
      ro.disconnect();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
