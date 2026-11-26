import * as THREE from 'three';
import { createObject } from '../src/index.js';
const o = await createObject('monument', { variant: 'abstract' });
o.updateMatrixWorld(true);
const ms = []; o.traverse((m) => m.isMesh && ms.push(m));
for (const m of ms.slice(0, 3)) { const b = new THREE.Box3().setFromObject(m); console.log(m.geometry.type, m.position.toArray(), b.min.y.toFixed(4), b.max.y.toFixed(4), m.geometry.attributes.position.count, m.material.polygonOffset); }
