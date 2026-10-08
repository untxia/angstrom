import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { MaterialsProjectClient, MaterialsProjectError } from '$lib/materialsProjectClient.js';
import { parseStructure } from '$lib/server/structure.js';

export const config = { maxDuration: 30 };

const ID = /^[a-z]+-\d+$/i;

export async function load({ params }) {
  if (!ID.test(params.id)) error(404, 'Matériau introuvable.');
  if (!env.MP_API_KEY) error(503, 'MP_API_KEY doit être définie.');

  let row;
  try {
    row = await new MaterialsProjectClient(env.MP_API_KEY).getMaterial(params.id);
  } catch (err) {
    console.error('[material]', err?.name, err?.status ?? '', err?.message);
    if (err instanceof MaterialsProjectError && err.status === 404) error(404, 'Matériau introuvable.');
    error(502, 'Materials Project ne répond pas correctement.');
  }
  if (!row?.material_id) error(404, 'Matériau introuvable.');

  return {
    material: {
      id: row.material_id,
      formula: row.formula_pretty ?? row.material_id,
      band_gap: row.band_gap ?? null,
      energy_above_hull: row.energy_above_hull ?? null,
      is_stable: Boolean(row.is_stable),
      density: row.density ?? null,
      volume: row.volume ?? null,
      nsites: row.nsites ?? null,
      spacegroup: row.symmetry?.symbol ?? null,
      crystalSystem: row.symmetry?.crystal_system ?? null
    },
    structure: parseStructure(row.structure)
  };
}
