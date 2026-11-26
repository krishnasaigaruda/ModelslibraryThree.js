import * as THREE from 'three';
const [file, ...names] = process.argv.slice(2);
const mod = await import(new URL(file, 'file://' + process.cwd() + '/').href);
let bad = 0;
for (const n of Object.keys(mod).filter((k) => k.endsWith('_VARIANTS'))) {
  const base = n.replace('_VARIANTS', '');
  const fn = Object.keys(mod).find((k) => k.toLowerCase() === ('create' + base.replace(/_/g, '')).toLowerCase());
  if (!fn) { console.log('no factory for', n); bad++; continue; }
  for (const v of Object.keys(mod[n])) {
    try {
      const o = mod[fn]({ variant: v });
      const box = new THREE.Box3().setFromObject(o);
      const s = box.getSize(new THREE.Vector3());
      let meshes = 0; o.traverse((x) => x.isMesh && meshes++);
      const floating = o.userData.floating;
      const flag = !floating && Math.abs(box.min.y) > 0.02 ? ` !! min.y=${box.min.y.toFixed(3)}` : '';
      const mixer = new THREE.AnimationMixer(o);
      for (const c of o.animations) for (const t of c.tracks) { const nn = THREE.PropertyBinding.parseTrackName(t.name).nodeName; if (!o.getObjectByName(nn)) { console.log('   unbound', c.name, nn); bad++; } }
      for (const c of o.animations) mixer.clipAction(c).play(); mixer.update(0.3);
      console.log(`${fn}:${v}`.padEnd(34), String(meshes).padEnd(5), `${s.x.toFixed(2)}×${s.y.toFixed(2)}×${s.z.toFixed(2)}`, o.animations.map((a) => a.name).join(','), flag);
      if (flag) bad++;
    } catch (e) { bad++; console.log('ERR', fn, v, e.message); }
  }
}
console.log(bad ? `${bad} problems` : 'all ok');
