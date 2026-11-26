import * as THREE from 'three';
import { createObject } from '../src/index.js';
import { findFloating } from './floating.js';
const o = await createObject(process.argv[2], { variant: process.argv[3] });
let i = 0; o.traverse((m) => { if (m.isMesh && !m.name) m.name = `m${i++}_${m.geometry.type.replace('Geometry', '')}`; });
o.updateMatrixWorld(true);
console.log(findFloating(o));
