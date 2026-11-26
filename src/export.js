/**
 * Export any three-premade object (or any THREE.Object3D) as .glb,
 * including its animations. The exporter is loaded only when called.
 *
 *   import { exportGLB, downloadGLB } from 'three-premade/export';
 *   const bytes = await exportGLB(car);          // ArrayBuffer
 *   await downloadGLB(car, 'my-car.glb');         // browser download
 */
export async function exportGLB(object, { animations = object.animations ?? [], onlyVisible = true } = {}) {
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  return new GLTFExporter().parseAsync(object, { binary: true, animations, onlyVisible });
}

export async function downloadGLB(object, filename) {
  const data = await exportGLB(object);
  const name = filename ?? `${object.name || 'model'}.glb`;
  const url = URL.createObjectURL(new Blob([data], { type: 'model/gltf-binary' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
