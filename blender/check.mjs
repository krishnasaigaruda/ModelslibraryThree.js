// Verifies every HD catalog entry has its .glb and reports sizes + simple sanity (bounds via glTF accessors).
//   node blender/check.mjs
import { existsSync, statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import hd from '../src/catalog/hd.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let missing = 0, total = 0, count = 0, big = 0;
const rows = [];
for (const [type, e] of Object.entries(hd)) {
  for (const v of e.variants) {
    const f = join(root, 'hd', 'models', type, `${v}.glb`);
    if (!existsSync(f)) { missing++; rows.push(`MISSING ${type}/${v}`); continue; }
    const size = statSync(f).size;
    total += size; count++;
    // parse GLB JSON chunk for min/max of POSITION accessors (node transforms are identity after our build)
    const buf = readFileSync(f);
    const len = buf.readUInt32LE(12);
    const json = JSON.parse(buf.subarray(20, 20 + len).toString());
    let minY = Infinity, maxY = -Infinity;
    for (const m of json.meshes ?? []) for (const pr of m.primitives) {
      const a = json.accessors[pr.attributes.POSITION];
      const ty = (json.nodes.find((n) => json.meshes[n.mesh] === m)?.translation ?? [0, 0, 0])[1];
      minY = Math.min(minY, a.min[1] + ty); maxY = Math.max(maxY, a.max[1] + ty);
    }
    const flag = size > 1.5 * 1048576 ? ' BIG' : Math.abs(minY) > 0.01 ? ` NOT-ON-GROUND(minY=${minY.toFixed(3)})` : '';
    if (size > 1.5 * 1048576) big++;
    rows.push(`${flag ? '!!' : 'ok'} ${`${type}/${v}`.padEnd(42)} ${(size / 1024).toFixed(0).padStart(5)} KB  h=${(maxY - minY).toFixed(2)}m${flag}`);
  }
}
console.log(rows.join('\n'));
console.log(`\n${count} HD models, ${(total / 1048576).toFixed(1)} MB total, ${missing} missing, ${big} over 1.5 MB`);
process.exit(missing ? 1 : 0);
