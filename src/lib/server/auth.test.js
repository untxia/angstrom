import test from 'node:test';
import assert from 'node:assert/strict';
import { safeNext, isProtected, validEmail, passwordProblem } from './auth.js';

test('safeNext : refuse les redirections externes', () => {
  assert.equal(safeNext('/screening?q=fer'), '/screening?q=fer');
  for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '', null, undefined, 42]) {
    assert.equal(safeNext(bad), '/screening', String(bad));
  }
});

test('isProtected : agent protégé, accueil et login publics', () => {
  assert.ok(isProtected('/screening'));
  assert.ok(isProtected('/api/search'));
  assert.ok(!isProtected('/'));
  assert.ok(!isProtected('/login'));
  assert.ok(!isProtected('/auth/confirm'));
});

test('validEmail / passwordProblem', () => {
  assert.ok(validEmail('a@b.fr'));
  assert.ok(!validEmail('pas-un-email'));
  assert.ok(passwordProblem('court', 'court'));
  assert.ok(passwordProblem('unmotdepasselong', 'autrechose'));
  assert.equal(passwordProblem('unmotdepasselong', 'unmotdepasselong'), '');
});
