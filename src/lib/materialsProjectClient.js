/**
 * Client HTTP direct pour l'API Materials Project.
 * Pas de client Python officiel utilisé ici : on parle en REST brut
 * pour rester cohérent avec la stack Node du projet.
 *
 * Auth : header X-API-KEY
 * Doc  : https://api.materialsproject.org/docs
 */

const BASE_URL = 'https://api.materialsproject.org';

export class MaterialsProjectError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'MaterialsProjectError';
    this.status = status;
    this.body = body;
  }
}

export class MaterialsProjectClient {
  constructor(apiKey = process.env.MP_API_KEY) {
    if (!apiKey) {
      throw new Error(
        'Clé API Materials Project manquante. Passe-la en argument ou définis MP_API_KEY dans .env'
      );
    }
    this.apiKey = apiKey;
  }

  async #request(endpoint, params = {}) {
    const url = new URL(`${BASE_URL}/${endpoint}/`);

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(',') : value);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      const body = await response.text().catch(() => null);
      throw new MaterialsProjectError(
        `Materials Project API a répondu ${response.status}`,
        response.status,
        body
      );
    }

    const json = await response.json();
    return json.data ?? json;
  }

  async searchSummary(filters = {}, limit = 20) {
    const params = {
      elements: filters.elements,
      exclude_elements: filters.excludeElements,
      band_gap_min: filters.bandGapMin,
      band_gap_max: filters.bandGapMax,
      is_stable: filters.isStable,
      num_elements: filters.numElements,
      fields: filters.fields ?? [
        'material_id',
        'formula_pretty',
        'band_gap',
        'is_stable',
        'energy_above_hull',
        'density'
      ],
      _limit: limit
    };
    return this.#request('materials/summary', params);
  }

  async getById(materialId) {
    const results = await this.#request('materials/summary', {
      material_ids: [materialId]
    });
    return Array.isArray(results) ? (results[0] ?? null) : (results ?? null);
  }

  async getThermo(materialIds) {
    return this.#request('materials/thermo', { material_ids: materialIds });
  }

  async getElasticity(materialIds) {
    return this.#request('materials/elasticity', { material_ids: materialIds });
  }

  async getSynthesis(formula) {
    return this.#request('materials/synthesis', { formula });
  }
}
