import * as THREE from 'three';
import { createObject } from '../src/index.js';
const o = await createObject(process.argv[2], { variant: process.argv[3] });
const seen = {};
for (const c of o.children) {
  const b = new THREE.Box3().setFromObject(c);
  const far = Math.max(Math.abs(b.min.x), Math.abs(b.max.x), Math.abs(b.min.z), Math.abs(b.max.z));
  if (far > 230) { const k = (c.userData.premade?.type ?? c.name) + (c.isInstancedMesh ? ' (inst)' : ''); seen[k] = Math.max(seen[k] ?? 0, Math.round(far)); }
}
console.log(seen);
