import test from 'node:test';
import assert from 'node:assert/strict';
import { MaterialsProjectClient } from './materialsProjectClient.js';

test('searchSummary : utilise les noms de paramètres de l’API MP (_fields, nelements_*)', async () => {
  const real = globalThis.fetch;
  let url;
  globalThis.fetch = async (u) => ((url = new URL(u)), new Response(JSON.stringify({ data: [] }), { status: 200 }));
  try {
    await new MaterialsProjectClient('k').searchSummary({ elements: ['Al'], excludeElements: ['Co'], numElements: 2, isStable: true }, 50);
  } finally {
    globalThis.fetch = real;
  }
  const q = url.searchParams;
  assert.ok(q.get('_fields').includes('formula_pretty'));
  assert.equal(q.get('fields'), null);
  assert.equal(q.get('nelements_min'), '2');
  assert.equal(q.get('nelements_max'), '2');
  assert.equal(q.get('exclude_elements'), 'Co');
  assert.equal(q.get('_limit'), '50');
});
