// Builds Brackenford-Seven-Bells.html: shell + three.js (lifted from the Bell Trial build) + game code.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const source = process.argv[2];
if (!source) throw new Error('usage: node build.mjs <path to Brackenford-Archery.html>');
const old = readFileSync(source, 'utf8');
const a = old.indexOf('<script>') + 8, b = old.indexOf('</script>', a);
const three = old.slice(a, b);
if (!three.includes('window.THREE=')) throw new Error('three.js block not found');
// models: every assets/*.json that has a body and a head (made by tools/export-model.py) is built in under its file name
const assets = join(here, '..', 'assets'), models = {};
if (existsSync(assets)) for (const f of readdirSync(assets)) if (f.endsWith('.json')) { const m = JSON.parse(readFileSync(join(assets, f), 'utf8')); if ((m.body && m.head) || m.bones) models[f.slice(0, -5)] = m; }
const config = JSON.parse(readFileSync(join(here, 'config.json'), 'utf8'));
// --new-hare makes a separate trial build, Brackenford-Seven-Bells-new-hare.html, that also carries the standing hare
// from assets/staging and its timed movement (src/moves.js). Without it the normal build has neither.
const newHare = process.argv.includes('--new-hare');
if (newHare) { models['shade-hare-standing'] = JSON.parse(readFileSync(join(assets, 'staging', 'shade-hare-standing-rig-patched.json'), 'utf8')); config.newHare = true; }
const game = 'const MODELS=' + JSON.stringify(models) + ';\nconst BUILD_CONFIG=' + JSON.stringify(config) + ';\n' + readFileSync(join(here, 'props.js'), 'utf8') + '\n' + (newHare ? readFileSync(join(here, 'moves.js'), 'utf8') + '\n' : '') + readFileSync(join(here, 'game.js'), 'utf8');   // props.js: code-built props (the stall), used only by the new range layout
if (game.includes('</script')) throw new Error('game code must not contain a closing script tag');
const shell = readFileSync(join(here, 'shell.html'), 'utf8');
const out = shell.replace('/*__THREE__*/', () => three).replace('/*__GAME__*/', () => game);
const target = join(here, '..', newHare ? 'Brackenford-Seven-Bells-new-hare.html' : 'Brackenford-Seven-Bells.html');
writeFileSync(target, out);
console.log('wrote', target, out.length, 'bytes, models:', Object.keys(models).join(', ') || 'none', '| release mode', config.release ? 'ON, title "' + config.title + '", ' + config.order.length + ' stages' : 'off');
