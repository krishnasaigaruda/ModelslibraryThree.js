// Builds every JS model in the catalog (Node, no renderer) and checks basic sanity.
//   node test/build-all.js                 → everything
//   node test/build-all.js car truck       → only these types
//   node test/build-all.js @vehicles       → only a category
//   node test/build-all.js car --quiet     → print errors + summary only
// Floating parts (not connected to the rest / ground) are errors; opt out per mesh with
// userData.detached = true, or for the whole object with userData.floating = true.
import * as THREE from 'three';
import { CATALOG, createObject, createAnimator, expandVariants } from '../src/index.js';
import { findFloating } from './floating.js';

const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const filters = args.filter((a) => !a.startsWith('--'));
const wanted = ([type, e]) => !filters.length || filters.some((f) => (f.startsWith('@') ? e.category === f.slice(1) : f === type));

let failed = 0;
// type names must be unique across catalog files (a duplicate silently hides the other entry)
{
  const { readdirSync } = await import('node:fs');
  const seen = {};
  for (const f of readdirSync(new URL('../src/catalog/', import.meta.url))) {
    const mod = (await import(`../src/catalog/${f}`)).default;
    for (const k of Object.keys(mod)) {
      if (seen[k]) { failed++; console.log(`ERR type "${k}" defined in both catalog/${seen[k]} and catalog/${f}`); }
      seen[k] = f;
    }
  }
}
let count = 0;
const t0 = Date.now();
for (const [type, entry] of Object.entries(CATALOG).filter(wanted)) {
  const names = expandVariants(entry);
  const dup = names.find((n, i) => names.indexOf(n) !== i);
  if (dup) { failed++; console.log(`ERR ${type}: duplicate model name "${dup}"`); }
  if (entry.source !== 'js') continue;
  for (const variant of names) {
    count++;
    try {
      const obj = await createObject(type, { variant, color: 'blue' });
      const box = new THREE.Box3().setFromObject(obj);
      if (box.isEmpty()) throw new Error('empty bounding box');
      if (!obj.userData.floating && Math.abs(box.min.y) > 0.2) throw new Error(`not sitting on ground (min.y=${box.min.y.toFixed(2)})`);
      const floating = findFloating(obj);
      if (floating.length) throw new Error(`floating parts: ${[...new Set(floating)].slice(0, 8).join(', ')}${floating.length > 8 ? ` (+${floating.length - 8})` : ''}`);
      if (obj.userData.premade.variant !== variant) throw new Error(`reports variant ${obj.userData.premade.variant}`);
      const anim = createAnimator(obj);
      for (const name of anim.names) {
        anim.play(name);
        anim.update(0.37);
        const clip = obj.animations.find((c) => c.name === name);
        for (const t of clip.tracks) {
          const node = THREE.PropertyBinding.parseTrackName(t.name).nodeName;
          if (!obj.getObjectByName(node)) throw new Error(`animation "${name}" targets missing node "${node}"`);
        }
      }
      let meshes = 0;
      let tris = 0;
      obj.traverse((o) => {
        if (!o.isMesh) return;
        meshes++;
        const g = o.geometry;
        tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
      });
      const s = box.getSize(new THREE.Vector3());
      if (!quiet) console.log(`ok  ${type}:${variant}`.padEnd(40), `${meshes} meshes`.padEnd(12), `${Math.round(tris / 1000)}k tris`.padEnd(10), `${s.x.toFixed(1)}×${s.y.toFixed(1)}×${s.z.toFixed(1)}m`, anim.names.join(','));
    } catch (e) {
      failed++;
      console.log(`ERR ${type}:${variant} → ${e.message}`);
    }
  }
}
if (!filters.length || filters.includes('car')) {
  // Every call style should resolve the same way
  const styles = [
    ['car', { variant: 'minivan', color: 'blue' }],
    ['car:minivan', { color: 'blue' }],
    [{ type: 'car', variant: 'minivan', color: 'blue' }],
    [{ Car: 'Type:minivan', Color: 'blue' }],
  ];
  for (const a of styles) {
    const o = await createObject(...a);
    if (o.userData.premade.variant !== 'minivan') { failed++; console.log('ERR call style', JSON.stringify(a)); }
  }
}
console.log(`\n${count - failed}/${count} models OK (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
process.exit(failed ? 1 : 0);
