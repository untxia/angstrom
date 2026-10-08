import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGroqLlm, retryDelayMs } from './groq.js';

const ok = () => new Response(JSON.stringify({ choices: [{ message: { content: 'salut' } }] }), { status: 200 });
const limited = (retryAfter) => new Response(JSON.stringify({ error: { message: 'Rate limit reached' } }), { status: 429, headers: retryAfter ? { 'retry-after': retryAfter } : {} });

test('réessaie après un 429 puis réussit', async () => {
  const waits = [];
  const answers = [limited('3'), ok()];
  const llm = createGroqLlm({ apiKey: 'k', fetchImpl: async () => answers.shift(), sleep: async (ms) => waits.push(ms) });
  assert.equal(await llm.complete('s', 'u'), 'salut');
  assert.deepEqual(waits, [3000]);
});

test('abandonne après les essais et expose le détail', async () => {
  let calls = 0;
  const llm = createGroqLlm({ apiKey: 'k', fetchImpl: async () => (calls++, limited()), sleep: async () => {} });
  await assert.rejects(llm.complete('s', 'u'), (e) => e.status === 429 && /Rate limit/.test(e.detail));
  assert.equal(calls, 3);
});

test('une erreur autre que 429 ne déclenche pas de nouvel essai', async () => {
  let calls = 0;
  const llm = createGroqLlm({ apiKey: 'k', fetchImpl: async () => (calls++, new Response('{}', { status: 401 })), sleep: async () => {} });
  await assert.rejects(llm.complete('s', 'u'), (e) => e.status === 401);
  assert.equal(calls, 1);
});

test('délai plafonné', () => {
  assert.equal(retryDelayMs(limited('60'), 0), 12000);
});

test('demande le mode JSON à Groq', async () => {
  let body;
  const llm = createGroqLlm({ apiKey: 'k', fetchImpl: async (_u, init) => ((body = JSON.parse(init.body)), ok()) });
  await llm.complete('s', 'u');
  assert.deepEqual(body.response_format, { type: 'json_object' });
});
