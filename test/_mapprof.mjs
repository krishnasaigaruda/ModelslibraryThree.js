import { createObject } from '../src/index.js';
const o = await createObject(process.argv[2], { variant: process.argv[3] });
const by = {};
for (const c of o.children) {
  const k = c.userData.premade?.type ?? c.name;
  let tris = 0, n = 0;
  c.traverse((m) => { if (m.isMesh) { n++; const g = m.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (m.isInstancedMesh ? m.count : 1); } });
  by[k] ??= [0, 0, 0]; by[k][0]++; by[k][1] += tris; by[k][2] += n;
}
for (const [k, [c, t, n]] of Object.entries(by).sort((a, b) => b[1][1] - a[1][1]).slice(0, 14)) console.log(k.padEnd(18), c, Math.round(t / 1000) + 'k', n + ' meshes', Math.round(t / c / 1000) + 'k each');
