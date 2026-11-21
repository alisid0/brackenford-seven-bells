// Makes the game's 3D models: a concept picture from OpenAI's image model, then a 3D model of it from Tripo.
//
//   node tools/make-assets.mjs --plan              list what would be made; contacts nobody, costs nothing
//   node tools/make-assets.mjs                     make every model in assets/asset-list.json that is not there yet
//   node tools/make-assets.mjs --only sun-bird     make just one (repeat --only for more)
//   node tools/make-assets.mjs --text              skip the picture step: Tripo works straight from the words
//   node tools/make-assets.mjs --images-only       make the concept pictures and stop, so they can be looked at first
//   node tools/make-assets.mjs --force             remake models that already exist
//
// Keys are read from the environment and never written anywhere by this script:
//   TRIPO_API_KEY    needed for any model         (https://developers.tripo3d.ai/en/keys)
//   OPENAI_API_KEY   needed for the picture step  (without it, or with --text, Tripo works from the words alone)
// Both services charge the account the key belongs to. Each model is one Tripo task; the script prints the credits Tripo reports.
//
// Tripo endpoints used (v3): POST /files, POST /generation/image-to-model, POST /generation/text-to-model, GET /tasks/{id}.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets'), concepts = join(assets, 'concepts');
const args = process.argv.slice(2);
const has = flag => args.includes(flag);
const only = args.flatMap((a, i) => (a === '--only' && args[i + 1] ? [args[i + 1]] : []));
const TRIPO = 'https://openapi.tripo3d.ai/v3', TRIPO_MODEL = 'v3.1-20260211';
const tripoKey = process.env.TRIPO_API_KEY, openaiKey = process.env.OPENAI_API_KEY;
const list = JSON.parse(readFileSync(join(assets, 'asset-list.json'), 'utf8'));
const wait = ms => new Promise(done => setTimeout(done, ms));

const wanted = list.assets.filter(a => !only.length || only.includes(a.file));
const unknown = only.filter(name => !list.assets.some(a => a.file === name));
if (unknown.length) { console.error('Not in asset-list.json: ' + unknown.join(', ')); process.exit(1); }
const todo = wanted.filter(a => has('--force') || has('--images-only') || !existsSync(join(assets, a.file + '.glb')));
const usePictures = !has('--text') && !!openaiKey;

if (has('--plan') || !todo.length) {
  console.log(`${wanted.length} in the list, ${wanted.length - todo.length} already made, ${todo.length} to make.`);
  for (const a of todo) console.log(`  ${a.file}.glb   up to ${a.faces} faces   "${a.prompt}"`);
  console.log(`Picture step: ${has('--text') ? 'skipped (--text)' : openaiKey ? 'on' : 'off, OPENAI_API_KEY is not set'}.   Tripo key: ${tripoKey ? 'set' : 'NOT set'}.`);
  process.exit(0);
}
if (has('--images-only') && !openaiKey) { console.error('--images-only needs OPENAI_API_KEY.'); process.exit(1); }
if (!has('--images-only') && !tripoKey) { console.error('TRIPO_API_KEY is not set. Run with --plan to see what would be made.'); process.exit(1); }

async function json(response, what) {
  const text = await response.text(); let body;
  try { body = JSON.parse(text); } catch { throw new Error(`${what}: HTTP ${response.status}, not JSON: ${text.slice(0, 200)}`); }
  if (!response.ok) throw new Error(`${what}: HTTP ${response.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}

// A concept picture: one object on a plain background, which is what image-to-3D works best from.
async function picture(asset) {
  const file = join(concepts, asset.file + '.png');
  if (existsSync(file) && !has('--force')) return readFileSync(file);
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST', headers: { Authorization: 'Bearer ' + openaiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt: `${asset.prompt}. ${list.style}. Three-quarter view, whole object in frame.`, size: '1024x1024', n: 1 })
  });
  const body = await json(response, 'OpenAI image');
  const data = body.data?.[0]; if (!data) throw new Error('OpenAI image: no picture in the reply');
  const bytes = data.b64_json ? Buffer.from(data.b64_json, 'base64') : Buffer.from(await (await fetch(data.url)).arrayBuffer());
  mkdirSync(concepts, { recursive: true }); writeFileSync(file, bytes);
  console.log(`  picture saved: assets/concepts/${asset.file}.png`);
  return bytes;
}

async function tripo(path, options) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(TRIPO + path, { ...options, headers: { Authorization: 'Bearer ' + tripoKey, ...(options?.headers || {}) } });
    if (response.status === 429 && attempt < 5) { await wait((Number(response.headers.get('Retry-After')) || 2 ** attempt * 2) * 1000); continue; }
    const body = await json(response, 'Tripo ' + path);
    if (body.code !== 0) throw new Error(`Tripo ${path}: ${JSON.stringify(body).slice(0, 300)}`);
    return body.data;
  }
}

async function model(asset) {
  const shape = { model: TRIPO_MODEL, texture: true, pbr: false, smart_low_poly: true, face_limit: asset.faces };
  let task;
  if (usePictures) {
    const form = new FormData(); form.append('file', new Blob([await picture(asset)], { type: 'image/png' }), asset.file + '.png');
    const { file_token } = await tripo('/files', { method: 'POST', body: form });
    task = await tripo('/generation/image-to-model', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: file_token, ...shape }) });
  } else {
    task = await tripo('/generation/text-to-model', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `${asset.prompt}, ${list.style}`.slice(0, 1024), ...shape }) });
  }
  console.log(`  Tripo task ${task.task_id} started`);
  for (let waited = 0; waited < 15 * 60; waited += 3) {
    await wait(3000);
    const state = await tripo('/tasks/' + task.task_id);
    if (state.status === 'success') {
      const url = state.output?.model_url; if (!url) throw new Error('Tripo: task succeeded but gave no model_url');
      const file = await fetch(url); if (!file.ok) throw new Error('Tripo: download failed, HTTP ' + file.status);   // the link lasts only a few minutes
      const bytes = Buffer.from(await file.arrayBuffer());
      if (bytes.subarray(0, 4).toString('latin1') !== 'glTF') throw new Error('Tripo: the file returned is not a GLB');
      writeFileSync(join(assets, asset.file + '.glb'), bytes);
      console.log(`  saved assets/${asset.file}.glb   ${(bytes.length / 1048576).toFixed(2)} MB   credits used: ${state.credits_consumed ?? 'not reported'}`);
      return;
    }
    if (['failed', 'cancelled', 'banned', 'expired'].includes(state.status)) throw new Error(`Tripo: task ${state.status} ${state.error_message || ''}`);
  }
  throw new Error('Tripo: gave up waiting after 15 minutes');
}

let made = 0; const failed = [];
for (const asset of todo) {
  console.log(asset.file);
  try { if (has('--images-only')) await picture(asset); else await model(asset); made++; }
  catch (error) { failed.push(asset.file); console.error('  FAILED: ' + error.message); }
}
console.log(`Done: ${made} made, ${failed.length} failed${failed.length ? ' (' + failed.join(', ') + ')' : ''}.`);
process.exit(failed.length ? 1 : 0);
