/**
 * Réduit une structure Materials Project (format pymatgen) à ce que le viewer 3D utilise.
 * Les données viennent d'une API externe : on valide tout et on ignore ce qui est malformé.
 */
export const MAX_SITES = 400;

const isNum = Number.isFinite;

export function parseStructure(raw) {
  const m = raw?.lattice?.matrix;
  const okMatrix = Array.isArray(m) && m.length === 3 && m.every((r) => Array.isArray(r) && r.length === 3 && r.every(isNum));
  if (!okMatrix) return null;

  const sites = [];
  for (const s of raw.sites ?? []) {
    const el = s?.species?.[0]?.element ?? s?.label;
    const abc = s?.abc;
    if (typeof el !== 'string' || !/^[A-Z][a-z]?$/.test(el)) continue;
    if (!Array.isArray(abc) || abc.length !== 3 || !abc.every(isNum)) continue;
    sites.push({ el, abc: [abc[0], abc[1], abc[2]] });
  }
  if (!sites.length || sites.length > MAX_SITES) return null;
  return { lattice: m.map((r) => [...r]), sites };
}
