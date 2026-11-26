import * as THREE from 'three';

/*
 * The studio emblem used on every three-premade model (vehicles' badges,
 * appliance logos, signage…): a glossy ring with a conic rainbow gradient
 * and a dark centre. Built from geometry + vertex colours so it works in
 * Node, in the browser and survives GLB export (no textures).
 */
const STOPS = ['#ff5fa2', '#ff8a4c', '#ffd23f', '#7be36b', '#3fc3ff', '#7a6cff', '#c86bff', '#ff5fa2'];

function gradientAt(t) {
  const n = STOPS.length - 1;
  const i = Math.min(n - 1, Math.floor(t * n));
  const f = t * n - i;
  return new THREE.Color(STOPS[i]).lerp(new THREE.Color(STOPS[i + 1]), f);
}

let ringGeo = null;
function ringGeometry() {
  if (ringGeo) return ringGeo;
  // torus around Z, flattened so it reads as a badge
  const g = new THREE.TorusGeometry(1, 0.36, 16, 72);
  g.scale(1, 1, 0.45);
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    // start the gradient at the top-left like the original mark
    const a = (Math.atan2(p.getY(i), p.getX(i)) / (Math.PI * 2) + 1.375) % 1;
    const c = gradientAt(a);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  ringGeo = g;
  return g;
}

/**
 * Returns a Group (faces +Z) of overall diameter `size` metres.
 * Place it and rotate so +Z points out of the surface it sits on.
 */
export function brandEmblem(size = 0.09, { name = 'emblem', centre = '#140f1f' } = {}) {
  const s = size / 2 / 1.36;
  const g = new THREE.Group();
  g.name = name;
  const ring = new THREE.Mesh(
    ringGeometry(),
    new THREE.MeshPhysicalMaterial({ name: 'emblem', vertexColors: true, roughness: 0.25, metalness: 0.1, clearcoat: 1, emissive: '#ffffff', emissiveIntensity: 0.06 }),
  );
  ring.scale.setScalar(s);
  g.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.66, 40), new THREE.MeshPhysicalMaterial({ color: centre, roughness: 0.3, clearcoat: 1 }));
  disc.scale.setScalar(s);
  disc.position.z = -0.1 * s;
  g.add(disc);
  return g;
}
