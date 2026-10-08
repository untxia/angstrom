/** Familles chimiques affichées comme amas dans le champ de l'agent (ordre = index de cluster). */
export const FAMILIES = ['oxydes', 'sulfures', 'phosphates', 'halogénures', 'nitrures', 'autres'];

/** Famille d'un matériau d'après sa formule (ex. "LiFePO4" → phosphates). Heuristique d'affichage, pas de la chimie. */
export function familyIndex(formula = '') {
  const els = new Set(formula.match(/[A-Z][a-z]?/g) ?? []);
  const has = (...xs) => xs.some((x) => els.has(x));
  if (els.has('P') && els.has('O')) return 2;
  if (els.has('O')) return 0;
  if (has('S', 'Se', 'Te')) return 1;
  if (has('F', 'Cl', 'Br', 'I')) return 3;
  if (els.has('N')) return 4;
  return 5;
}

/** stable = sur l'enveloppe convexe · meta = proche (≤ 0,1 eV/atome) · unstable = au-delà ou inconnu. */
export function stabilityStatus(m) {
  if (m.is_stable) return 'stable';
  return typeof m.energy_above_hull === 'number' && m.energy_above_hull <= 0.1 ? 'meta' : 'unstable';
}
