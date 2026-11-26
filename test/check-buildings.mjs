import * as THREE from 'three';
import { createAnimator } from '../src/core/animation.js';
const [file, factory, vars] = process.argv.slice(2);
const mod = await import(new URL('../' + file, import.meta.url));
let bad = 0;
for (const v of Object.keys(mod[vars])) {
  try {
    const t0 = performance.now();
    const o = mod[factory]({ variant: v });
    const box = new THREE.Box3().setFromObject(o);
    let meshes = 0, verts = 0;
    o.traverse((c) => { if (c.isMesh) { meshes++; verts += c.geometry.attributes.position.count * (c.count ?? 1); } });
    for (const clip of o.animations) for (const t of clip.tracks) {
      const n = THREE.PropertyBinding.parseTrackName(t.name).nodeName;
      if (!o.getObjectByName(n)) throw new Error(`track ${clip.name} → missing ${n}`);
    }
    const a = createAnimator(o); for (const n of a.names) { a.play(n); a.update(0.3); }
    if (Math.abs(box.min.y) > 0.05 && !o.userData.floating) throw new Error('min.y ' + box.min.y.toFixed(2));
    const s = box.getSize(new THREE.Vector3());
    console.log('ok', v.padEnd(14), String(meshes).padStart(4), 'meshes', String(Math.round(verts/1000)).padStart(5)+'k verts', `${s.x.toFixed(1)}×${s.y.toFixed(1)}×${s.z.toFixed(1)}`, o.animations.map(c=>c.name).join(','), Math.round(performance.now()-t0)+'ms');
  } catch (e) { bad++; console.log('ERR', v, e.message); }
}
process.exit(bad ? 1 : 0);
