import * as THREE from 'three';

/** Accepts CSS names ('blue'), hex strings ('#ff0000'), numbers (0xff0000) or THREE.Color. */
export function toColor(value, fallback = '#888888') {
  const c = new THREE.Color();
  try {
    c.set(value ?? fallback);
  } catch {
    c.set(fallback);
  }
  return c;
}

export const WOODS = {
  oak: '#b8874f',
  walnut: '#5b3a24',
  cherry: '#8a3f26',
  maple: '#d9b98a',
  pine: '#c99a5b',
  white: '#eeeae2',
  black: '#1f1d1b',
};

export const SKIN_TONES = ['#f6d7c3', '#eac0a0', '#d49f7a', '#b47a55', '#8d5a3b', '#5e3a26'];

/** Car paint with clear coat. */
export function paint(color, { metallic = 0.55, roughness = 0.32 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    name: 'paint',
    color: toColor(color),
    metalness: metallic,
    roughness,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  });
}

export function glass({ tint = '#0d141c', opacity = 1 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    name: 'glass',
    color: toColor(tint),
    metalness: 0.4,
    roughness: 0.04,
    clearcoat: 1,
    transparent: opacity < 1,
    opacity,
  });
}

export function chrome() {
  return new THREE.MeshStandardMaterial({ name: 'chrome', color: 0xe8e8ec, metalness: 1, roughness: 0.12 });
}

export function metal(color = '#9aa0a6', roughness = 0.35) {
  return new THREE.MeshStandardMaterial({ name: 'metal', color: toColor(color), metalness: 0.9, roughness });
}

export function rubber() {
  return new THREE.MeshStandardMaterial({ name: 'rubber', color: 0x161616, metalness: 0, roughness: 0.92 });
}

export function plastic(color = '#222222', roughness = 0.55) {
  return new THREE.MeshStandardMaterial({ name: 'plastic', color: toColor(color), metalness: 0, roughness });
}

export function matte(color, roughness = 0.85) {
  return new THREE.MeshStandardMaterial({ name: 'matte', color: toColor(color), metalness: 0, roughness });
}

export function fabric(color) {
  return new THREE.MeshPhysicalMaterial({
    name: 'fabric',
    color: toColor(color),
    roughness: 0.95,
    sheen: 1,
    sheenRoughness: 0.6,
    sheenColor: toColor(color).lerp(new THREE.Color(1, 1, 1), 0.3),
  });
}

export function wood(kind = 'oak') {
  const color = WOODS[kind] ?? kind;
  return new THREE.MeshPhysicalMaterial({
    name: 'wood',
    color: toColor(color),
    roughness: 0.55,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
  });
}

export function skin(color) {
  return new THREE.MeshPhysicalMaterial({
    name: 'skin',
    color: toColor(color),
    roughness: 0.6,
    sheen: 0.4,
    sheenColor: new THREE.Color('#ffd9c9'),
  });
}

export function emissive(color, intensity = 2) {
  return new THREE.MeshStandardMaterial({
    name: 'emissive',
    color: toColor(color),
    emissive: toColor(color),
    emissiveIntensity: intensity,
    roughness: 0.3,
  });
}

export function foliage(color) {
  return new THREE.MeshStandardMaterial({ name: 'foliage', color: toColor(color), roughness: 0.8, flatShading: true });
}
