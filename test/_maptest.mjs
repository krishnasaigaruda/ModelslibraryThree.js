import { createObject, CATALOG } from '../src/index.js';
import * as THREE from 'three';
const t = process.argv[2] ? [process.argv[2]] : Object.keys(CATALOG).filter((k) => CATALOG[k].category === 'maps');
for (const type of t) for (const v of CATALOG[type].variants) {
  const t0 = Date.now();
  try {
    const o = await createObject(type, { variant: v });
    let n = 0, tris = 0; o.traverse((m) => { if (m.isMesh) { n++; const g = m.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (m.isInstancedMesh ? m.count : 1); } });
    console.log(type, v, o.children.length, 'children', n, 'meshes', Math.round(tris / 1000) + 'k tris', Date.now() - t0 + 'ms');
  } catch (e) { console.log('ERR', type, v, e.message); }
}
