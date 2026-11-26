import * as THREE from 'three';
import { createObject } from '../src/index.js';
const o = await createObject(process.argv[2], { variant: process.argv[3] });
const t = o.getObjectByName('terrain');
console.log('terrain mesh:', !!t);
const merged = o.children.filter((c) => c.name === 'merged');
for (const m of merged) if (m.material.vertexColors) console.log('merged vertex-colour mesh', new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3()).toArray().map((v) => v.toFixed(0)));
console.log('bbox', new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()).toArray().map((v) => v.toFixed(0)));
