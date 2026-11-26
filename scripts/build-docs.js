// Generates docs/CATALOG.md from the catalog, with images from docs/images
// (run `npm run thumbnails` first to (re)render them) and the real animation
// names of every model.
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CATALOG, CATEGORIES, listModels, createObject } from '../src/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const img = (type, variant) => `images/${type}-${variant}.webp`;
const hasImg = (type, variant) => existsSync(join(root, 'docs', img(type, variant)));
const title = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

let md = `# three-premade — Model Catalog

${listModels().length} models in ${Object.keys(CATALOG).length} types. Every model is original, built by this project, and free to use (MIT).

> Interactive version: open \`docs/index.html\` (see README → "Viewing the models").

\`\`\`js
import { createObject, createAnimator } from 'three-premade';

const car = await createObject('car', { variant: 'suv', color: 'red' });
scene.add(car);

const anim = createAnimator(car);
anim.play('drive');
anim.play('lights');
// in your render loop: anim.update(clock.getDelta());
\`\`\`

## Contents

${CATEGORIES.map((c) => `- [${title(c)}](#${c}) — ${Object.entries(CATALOG).filter(([, e]) => e.category === c).map(([t, e]) => `[${e.label}](#${t})`).join(', ')}`).join('\n')}

`;

for (const cat of CATEGORIES) {
  md += `\n## ${title(cat)}\n`;
  for (const [type, e] of Object.entries(CATALOG).filter(([, x]) => x.category === cat)) {
    const sample = e.source === 'js' ? await createObject(type, { variant: e.variants[0], lights: false }).catch(() => null) : null;
    const anims = sample?.userData.premade.animations ?? [];
    md += `\n### ${e.label} <a id="${type}"></a>\n\n`;
    md += `\`createObject('${type}', { variant: '${e.variants[0]}' })\` · ${e.variants.length} versions · ${e.source === 'glb' ? 'Blender .glb' : 'procedural JS'}\n\n`;
    // image grid, 4 per row
    const cells = e.variants.map((v) => (hasImg(type, v) ? `<img src="${img(type, v)}" width="200" alt="${type} ${v}"><br><sub><b>${v}</b></sub>` : `<sub><b>${v}</b></sub>`));
    md += '<table>\n';
    for (let i = 0; i < cells.length; i += 4) md += `<tr>${cells.slice(i, i + 4).map((c) => `<td align="center">${c}</td>`).join('')}</tr>\n`;
    md += '</table>\n\n';
    md += `**Variants:** ${e.variants.map((v) => `\`${v}\``).join(', ')}\n\n`;
    if (Object.keys(e.options ?? {}).length) {
      md += '| Option | Description |\n|---|---|\n';
      for (const [k, d] of Object.entries(e.options)) md += `| \`${k}\` | ${d} |\n`;
      md += '\n';
    }
    if (anims.length) md += `**Animations:** ${anims.map((a) => `\`${a}\``).join(', ')}\n\n`;
  }
}

md += `
## Options every model accepts

| Option | Description |
|---|---|
| \`variant\` | Which version (see each type above) |
| \`color\` | Main color — CSS name (\`'blue'\`), hex (\`'#ff0000'\`) or number |
| \`scale\` | Uniform scale |
| \`position\` | \`[x, y, z]\` |
| \`rotation\` | Y rotation in radians, or \`[x, y, z]\` |
| \`castShadow\` / \`receiveShadow\` | Defaults \`true\` |
| \`seed\` | Number or string for models with random variation |

Units are metres. Models sit on the ground (y = 0). Vehicles face +X, everything else faces +Z.
`;

writeFileSync(join(root, 'docs', 'CATALOG.md'), md);
console.log(`docs/CATALOG.md written (${listModels().length} models)`);
