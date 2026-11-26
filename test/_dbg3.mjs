import * as THREE from 'three';
import { createObject } from '../src/index.js';
import { findFloating } from './floating.js';
const o = await createObject('griffin', { variant: 'rearing-gold' });
o.updateMatrixWorld(true);
let i = 0; o.traverse((m) => { if (m.name === 'hoard_gem') m.name = `hoard_gem${i++}`; });
const f = findFloating(o); console.log(f);
for (const n of f) { const m = o.getObjectByName(n); const b = new THREE.Box3().setFromObject(m); console.log(n, b.min.toArray().map((v) => v.toFixed(3)), b.max.toArray().map((v) => v.toFixed(3)), Math.hypot(m.position.x, m.position.z).toFixed(3), m.parent.name, m.parent.scale.toArray()); }
