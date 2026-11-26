import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { roundedBox, lathe } from '../../core/utils.js';
import { taperTube } from './skin.js';

/*
 * Things people hold or carry. Built in the HAND's local frame: origin at the
 * wrist, the palm runs down -Y, palm faces ±X (side), fingers' front edge +Z.
 * `reach` = wrist height above the ground (for canes/poles/umbrellas that touch it).
 * Everything overlaps the palm so nothing floats.
 */
export function buildProp(name, { H, s, reach }) {
  const g = new THREE.Group();
  g.name = `prop-${name}`;
  const palmY = -0.04 * H; // centre of the grip
  const add = (geo, mat, at = [0, 0, 0], rot) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...at);
    if (rot) m.rotation.set(...rot);
    g.add(m);
    return m;
  };
  const dark = M.plastic('#1a1a1a', 0.4);
  const inX = -s * 0.012 * H; // just inside the palm (towards the body side of the hand)
  switch (name) {
    case 'phone': {
      add(roundedBox(0.009, 0.15, 0.072, 0.006), dark, [inX, palmY - 0.02, 0.012]);
      add(new THREE.PlaneGeometry(0.062, 0.135), new THREE.MeshStandardMaterial({ color: '#0d1a2a', emissive: '#1a3a5a', emissiveIntensity: 0.4, roughness: 0.2 }), [inX + s * 0.0047, palmY - 0.02, 0.012], [0, s * Math.PI / 2, 0]);
      break;
    }
    case 'coffee': {
      const cup = lathe([[0.001, 0], [0.028, 0], [0.034, 0.1], [0.036, 0.11], [0.001, 0.11]], 20);
      add(cup, M.plastic('#f2efe8', 0.6), [inX * 1.6, palmY - 0.06, 0.03]);
      add(new THREE.CylinderGeometry(0.0365, 0.0365, 0.034, 20), M.plastic('#8a5a3a', 0.8), [inX * 1.6, palmY - 0.015, 0.03]); // sleeve
      add(new THREE.CylinderGeometry(0.038, 0.037, 0.012, 20), M.plastic('#1a1a1a', 0.5), [inX * 1.6, palmY + 0.055, 0.03]); // lid
      break;
    }
    case 'umbrella': case 'cane': case 'pole': {
      const len = reach - 0.01;
      const mat = name === 'umbrella' ? M.plastic('#1a1a1a', 0.5) : name === 'cane' ? M.wood('walnut') : M.metal('#8a9096');
      add(new THREE.CylinderGeometry(0.009, 0.007, len, 10), mat, [inX, palmY - len / 2 + 0.06, 0.01]);
      if (name === 'umbrella') {
        // furled canopy around the lower shaft
        const canopy = lathe([[0.004, 0], [0.03, 0.08], [0.034, 0.35], [0.012, 0.6], [0.004, 0.62]], 16);
        add(canopy, M.fabric ? M.fabric('#2c4a7a') : M.plastic('#2c4a7a', 0.8), [inX, palmY + 0.06 - len + 0.08, 0.01]);
        add(new THREE.TorusGeometry(0.03, 0.007, 8, 16, Math.PI), mat, [inX, palmY + 0.07, 0.01 + 0.03], [0, Math.PI / 2, 0]);
      } else if (name === 'cane') {
        add(new THREE.TorusGeometry(0.035, 0.009, 8, 16, Math.PI), mat, [inX, palmY + 0.06, 0.035], [0, Math.PI / 2, 0]);
      }
      add(new THREE.SphereGeometry(0.011, 8, 6), dark, [inX, palmY + 0.06 - len, 0.01]); // rubber tip on the ground
      break;
    }
    case 'briefcase': case 'parcel': case 'shopping-bag': {
      const [w, h, d] = name === 'briefcase' ? [0.42, 0.31, 0.09] : name === 'parcel' ? [0.3, 0.24, 0.22] : [0.32, 0.36, 0.14];
      const mat = name === 'briefcase' ? new THREE.MeshPhysicalMaterial({ color: '#3b2a1e', roughness: 0.45, clearcoat: 0.4 }) : name === 'parcel' ? M.matte('#c49a6c') : M.matte('#e8e2d2');
      const top = palmY - 0.035;
      add(roundedBox(d, h, w, name === 'parcel' ? 0.01 : 0.012), mat, [inX, top - h / 2 - 0.035, 0]);
      // handle from the palm to the box
      const hm = name === 'briefcase' ? dark : name === 'parcel' ? M.matte('#8a6a3a') : M.matte('#c0392b');
      add(new THREE.TorusGeometry(0.045, 0.007, 8, 18, Math.PI), hm, [inX, top - 0.035, 0], [0, Math.PI / 2, 0]);
      if (name === 'shopping-bag') add(new THREE.PlaneGeometry(0.2, 0.12), M.matte('#c0392b'), [inX + s * (d / 2 + 0.001), top - h / 2 - 0.035, 0], [0, s * Math.PI / 2, 0]);
      break;
    }
    case 'book': case 'notepad': case 'tablet': case 'clipboard': {
      const [h, w, t] = name === 'book' ? [0.24, 0.17, 0.035] : name === 'tablet' ? [0.25, 0.18, 0.009] : [0.15, 0.1, 0.012];
      const mat = name === 'book' ? M.matte('#7a1f2b') : name === 'tablet' ? dark : M.matte('#f2efe0');
      add(roundedBox(t, h, w, Math.min(0.004, t / 2.2)), mat, [inX, palmY - h * 0.3, 0.04]);
      break;
    }
    case 'wrench': case 'trowel': case 'brush': case 'gavel': {
      const handleLen = name === 'brush' ? 0.2 : 0.12;
      const hmat = name === 'wrench' ? M.metal('#9aa0a6') : M.wood('oak');
      add(new THREE.CylinderGeometry(0.012, 0.012, handleLen, 10), hmat, [inX, palmY - 0.01, 0.0], [Math.PI / 2, 0, 0]);
      if (name === 'wrench') add(roundedBox(0.012, 0.06, 0.04, 0.005), M.metal('#9aa0a6'), [inX, palmY - 0.01, handleLen / 2 + 0.02]);
      if (name === 'trowel') add(new THREE.ConeGeometry(0.04, 0.12, 3).scale(0.25, 1, 1).rotateX(Math.PI / 2), M.metal('#b0b4b8'), [inX, palmY - 0.01, handleLen / 2 + 0.06]);
      if (name === 'brush') add(new THREE.ConeGeometry(0.012, 0.03, 8).rotateX(-Math.PI / 2), M.matte('#b3261e'), [inX, palmY - 0.01, handleLen / 2 + 0.015]);
      if (name === 'gavel') add(new THREE.CylinderGeometry(0.025, 0.025, 0.09, 14), M.wood('walnut'), [inX, palmY - 0.01, handleLen / 2 + 0.02]);
      break;
    }
    default:
      break;
  }
  return g;
}

/** Acoustic guitar worn on the back on a strap (chest-bone space; back = -Z). */
export function buildGuitar({ backZ, H }) {
  const g = new THREE.Group();
  g.name = 'guitar';
  const outline = new THREE.Shape();
  // figure-eight body (lower bout bigger)
  outline.absellipse(0, -0.12, 0.19, 0.2, 0, Math.PI * 2);
  const upper = new THREE.Shape();
  upper.absellipse(0, 0.13, 0.145, 0.15, 0, Math.PI * 2);
  const wood = new THREE.MeshPhysicalMaterial({ color: '#b5762f', roughness: 0.35, clearcoat: 1 });
  const ext = (shape) => new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 24 });
  const body = new THREE.Group();
  body.add(new THREE.Mesh(ext(outline), wood), new THREE.Mesh(ext(upper), wood));
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), M.plastic('#120a04', 0.9));
  hole.position.set(0, 0.06, -0.012);
  hole.rotation.y = Math.PI;
  body.add(hole);
  const neck = new THREE.Mesh(roundedBox(0.05, 0.5, 0.025, 0.008), M.wood('walnut'));
  neck.position.set(0, 0.5, 0.03);
  body.add(neck);
  const headstock = new THREE.Mesh(roundedBox(0.07, 0.14, 0.02, 0.008), M.wood('walnut'));
  headstock.position.set(0, 0.8, 0.03);
  body.add(headstock);
  body.scale.setScalar(H / 1.78);
  body.rotation.set(0, 0, 0.55);
  body.position.set(0.03 * H, -0.02 * H, backZ - 0.09 * (H / 1.78));
  g.add(body);
  return g;
}
