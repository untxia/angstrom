import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runScreening, sanitizeFilters, extractJson } from './agent.js';
import { familyIndex, stabilityStatus } from '../families.js';

const rows = [
  { material_id: 'mp-1', formula_pretty: 'BiVO4', band_gap: 2.4, energy_above_hull: 0, is_stable: true, density: 6.1 },
  { material_id: 'mp-2', formula_pretty: 'Fe2O3', band_gap: 2.0, energy_above_hull: 0.02, is_stable: false, density: 5.2 },
  { material_id: 'mp-3', formula_pretty: 'Cu2O', band_gap: null, energy_above_hull: 0.01, is_stable: false, density: 6 },
  { material_id: 'mp-4', formula_pretty: 'WO3', band_gap: 2.6, energy_above_hull: 0.4, is_stable: false, density: 7 }
];
const fakeMp = (calls = []) => ({ searchSummary: async (f, l) => (calls.push([f, l]), rows) });
const fakeLlm = (parse, rank) => { let n = 0; return { complete: async () => (n++ === 0 ? parse : rank) }; };
const run = async (llm, mp = fakeMp()) => { const ev = []; await runScreening({ query: 'oxyde stable sans cobalt', mp, llm, emit: (e) => ev.push(e) }); return ev; };

test('sanitizeFilters rejette les valeurs invalides', () => {
  const f = sanitizeFilters({ elements: ['Li', 'li', 'Xyz', '; DROP'], excludeElements: ['Co'], bandGapMin: -3, bandGapMax: 99, isStable: 'yes', numElements: 9, maxEnergyAboveHull: 0.05 });
  assert.deepEqual(f.elements, ['Li']);
  assert.equal(f.bandGapMin, 0); assert.equal(f.bandGapMax, 15); assert.equal(f.isStable, null); assert.equal(f.numElements, null); assert.equal(f.maxEnergyAboveHull, 0.05);
});

test('extractJson tolère du texte autour du JSON', () => assert.deepEqual(extractJson('Voici : {"a":1} fin'), { a: 1 }));

test('pipeline complet : filtre local, classement validé, ids inventés ignorés', async () => {
  const calls = [];
  const llm = fakeLlm(
    JSON.stringify({ excludeElements: ['Co'], bandGapMin: 1.5, bandGapMax: 2.5, maxEnergyAboveHull: 0.1, summary: 'oxyde' }),
    JSON.stringify({ ranking: [{ material_id: 'mp-999', score: 99, justification: 'inventé' }, { material_id: 'mp-2', score: 70, justification: 'ok' }, { material_id: 'mp-1', score: 150, justification: 'top', flags: ['x'] }] })
  );
  const ev = await run(llm, fakeMp(calls));
  assert.deepEqual(calls[0][0].excludeElements, ['Co']);
  assert.deepEqual(calls[0][0].elements, undefined);
  const cands = ev.find((e) => e.type === 'candidates');
  assert.equal(cands.stats.rejected, 1);          // WO3 : hull 0.4 > 0.1
  assert.equal(cands.stats.flagged, 1);           // Cu2O : gap inconnu
  const done = ev.at(-1);
  assert.equal(done.type, 'done');
  assert.deepEqual(done.ranking.map((r) => r.material_id), ['mp-1', 'mp-2']);
  assert.equal(done.ranking[0].score, 100);       // score borné
  assert.ok(ev.filter((e) => e.type === 'stage').map((e) => e.index).join() === '0,1,2,3,4,5');
});

test('aucun candidat : termine proprement sans appeler Claude une 2e fois', async () => {
  let n = 0;
  const llm = { complete: async () => (n++, '{}') };
  const ev = [];
  await runScreening({ query: 'rien', mp: { searchSummary: async () => [] }, llm, emit: (e) => ev.push(e) });
  assert.equal(n, 1); assert.equal(ev.at(-1).type, 'done');
});

test('réponse non JSON : lève une erreur', async () => {
  await assert.rejects(run(fakeLlm('désolé', '')));
});

test('familles et stabilité', () => {
  assert.equal(familyIndex('LiFePO4'), 2); assert.equal(familyIndex('TiO2'), 0); assert.equal(familyIndex('MoS2'), 1); assert.equal(familyIndex('NaCl'), 3); assert.equal(familyIndex('GaN'), 4); assert.equal(familyIndex('Si'), 5);
  assert.equal(stabilityStatus({ is_stable: true }), 'stable'); assert.equal(stabilityStatus({ energy_above_hull: 0.08 }), 'meta'); assert.equal(stabilityStatus({}), 'unstable');
});

import { createGroqLlm } from './groq.js';
import test2 from 'node:test';
import assert2 from 'node:assert/strict';

test2('createGroqLlm : appelle l’API Groq et renvoie le texte', async () => {
  let seen;
  const llm = createGroqLlm({
    apiKey: 'k',
    fetchImpl: async (url, init) => {
      seen = { url, init };
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":1}' } }] }), { status: 200 });
    }
  });
  assert2.equal(await llm.complete('sys', 'usr'), '{"ok":1}');
  assert2.match(seen.url, /api\.groq\.com\/openai\/v1\/chat\/completions/);
  assert2.equal(seen.init.headers.authorization, 'Bearer k');
  assert2.equal(JSON.parse(seen.init.body).messages[0].role, 'system');
});
