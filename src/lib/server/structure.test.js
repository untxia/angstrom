import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStructure, MAX_SITES } from './structure.js';

// Structure de type NaCl (cellule primitive) au format pymatgen renvoyé par Materials Project.
const nacl = {
  '@module': 'pymatgen.core.structure',
  lattice: { matrix: [[0, 3.99, 3.99], [3.99, 0, 3.99], [3.99, 3.99, 0]], a: 5.64 },
  sites: [
    { species: [{ element: 'Na', occu: 1 }], abc: [0, 0, 0], xyz: [0, 0, 0], label: 'Na' },
    { species: [{ element: 'Cl', occu: 1 }], abc: [0.5, 0.5, 0.5], xyz: [3.99, 3.99, 3.99], label: 'Cl' }
  ]
};

test('parseStructure : extrait réseau et sites', () => {
  const s = parseStructure(nacl);
  assert.deepEqual(s.sites.map((x) => x.el), ['Na', 'Cl']);
  assert.deepEqual(s.sites[1].abc, [0.5, 0.5, 0.5]);
  assert.equal(s.lattice.length, 3);
});

test('parseStructure : rejette les données malformées ou hors limites', () => {
  assert.equal(parseStructure(null), null);
  assert.equal(parseStructure({}), null);
  assert.equal(parseStructure({ lattice: { matrix: [[1, 0, 0], [0, 1, 0]] }, sites: nacl.sites }), null);
  assert.equal(parseStructure({ lattice: { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 'x']] }, sites: nacl.sites }), null);
  assert.equal(parseStructure({ lattice: nacl.lattice, sites: [{ species: [{ element: '<script>' }], abc: [0, 0, 0] }] }), null);
  const many = Array.from({ length: MAX_SITES + 1 }, () => ({ species: [{ element: 'H' }], abc: [0, 0, 0] }));
  assert.equal(parseStructure({ lattice: nacl.lattice, sites: many }), null);
});

test('parseStructure : ignore un site invalide sans perdre les autres', () => {
  const s = parseStructure({ lattice: nacl.lattice, sites: [nacl.sites[0], { species: [{ element: 'Zz9' }], abc: [0, 0, 0] }, { species: [{ element: 'O' }], abc: [0, 0, NaN] }] });
  assert.equal(s.sites.length, 1);
});
