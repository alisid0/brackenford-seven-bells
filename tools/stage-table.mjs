// Writes Stages.md: every stage in the game, and which of them the release plays, in what order.
//   node tools/stage-table.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src', 'game.js'), 'utf8'), a = src.indexOf('const ALL_STAGES=['), b = src.indexOf('// The release plays a chosen few', a);
const stages = new Function('return ' + src.slice(a + 'const ALL_STAGES='.length, src.lastIndexOf(']', b) + 1))();
const config = JSON.parse(readFileSync(join(root, 'src', 'config.json'), 'utf8'));
const wind = w => !w ? 'none' : (w[0] ? `${Math.abs(w[0])} ${w[0] > 0 ? 'right' : 'left'}` : 'calm') + (w[1] ? `, gusts to ${w[1]}` : '');
const mark = m => `${m[0]} m${m[1] ? `, ${Math.abs(m[1])} m ${m[1] > 0 ? 'right' : 'left'}` : ''}, size ${m[2]}${m[3] ? ', sliding' : ''}${m[4] ? `, pop-up (${m[4][0]} s up)` : ''}`;
const kind = { sit: 'sitting hare', hide: 'hare hidden in grass', creep: 'creeping hare', run: 'running hare', perch: 'perched flyer', flush: 'flyer hidden in a bush', cross: 'crossing flyer' };
const shade = s => kind[s.t] + (s.at ? ` at ${s.at[0]} m` : s.lane ? ` over ${s.lane} m` : s.area ? ` roaming ${s.area[0]}-${s.area[1]} m` : s.path ? ` between ${s.path.map(p => p[0]).join(', ')} m` : '') + (s.back ? `, returns after ${s.back} s` : '');
const row = (s, i) => `| ${i + 1} | ${s.name} | ${s.arrows} | ${wind(s.wind)} | ${[...s.marks.map(mark), ...(s.spirits || []).map(shade)].join('; ')} | ${config.order.includes(i + 1) ? config.order.indexOf(i + 1) + 1 : 'held back'} |`;
const out = `# Stages

Written by \`tools/stage-table.mjs\` from \`src/game.js\` and \`src/config.json\`. Do not edit by hand.

All ${stages.length} stages are kept in the game. The release plays ${config.order.length} of them, in the order set by \`order\` in \`src/config.json\`; changing that list is all it takes to reorder, add or drop a stage. Distances are from the shooting line. Wind is in metres a second.

| # | Name | Arrows | Wind | Targets | Place in release |
|---|---|---|---|---|---|
${stages.map(row).join('\n')}

## Release order

${config.order.map((n, i) => `${i + 1}. ${stages[n - 1].name} (stage ${n})`).join('\n')}
`;
writeFileSync(join(root, 'Stages.md'), out); console.log('wrote Stages.md:', stages.length, 'stages,', config.order.length, 'in the release');
