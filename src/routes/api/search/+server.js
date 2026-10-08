import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { MaterialsProjectClient, MaterialsProjectError } from '$lib/materialsProjectClient.js';
import { createLlm, LlmError } from '$lib/server/anthropic.js';
import { createGroqLlm } from '$lib/server/groq.js';
import { runScreening } from '$lib/server/agent.js';

// La recherche enchaîne deux appels au modèle et un appel Materials Project : on laisse du temps à la fonction Vercel.
export const config = { maxDuration: 60 };

// Limite simple en mémoire : chaque recherche coûte deux appels au modèle.
const hits = new Map();
const MAX_PER_MINUTE = 8;
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_MINUTE;
}

// Extrait un court message lisible du corps d'erreur Materials Project (jamais de clé dedans).
function mpDetail(body) {
  if (!body) return '';
  try {
    const j = JSON.parse(body);
    const d = j?.detail ?? j?.message ?? j?.error;
    return String(typeof d === 'string' ? d : JSON.stringify(d)).slice(0, 200);
  } catch {
    return String(body).slice(0, 120);
  }
}

function friendly(err) {
  if (err instanceof MaterialsProjectError) return err.status === 401 || err.status === 403 ? 'Clé Materials Project refusée.' : `Materials Project ne répond pas correctement (HTTP ${err.status}${mpDetail(err.body) ? ` : ${mpDetail(err.body)}` : ''}).`;
  if (err instanceof LlmError) return err.status === 401 ? 'Clé du modèle (Groq/Anthropic) refusée.' : err.status === 429 ? 'Le modèle est saturé, réessaie dans un instant.' : `Le modèle ne répond pas correctement (HTTP ${err.status}${err.detail ? ` : ${err.detail}` : ''}).`;
  if (err instanceof SyntaxError || /JSON/.test(err?.message ?? '')) return "Le modèle a renvoyé une réponse inexploitable. Réessaie.";
  return 'La recherche a échoué.';
}

export async function POST({ request, getClientAddress, locals }) {
  if (!env.MP_API_KEY || !(env.GROQ_API_KEY || env.ANTHROPIC_API_KEY)) return json({ error: 'MP_API_KEY et GROQ_API_KEY (ou ANTHROPIC_API_KEY) doivent être définies.' }, { status: 503 });
  if (limited(locals.user?.id ?? getClientAddress())) return json({ error: 'Trop de recherches, réessaie dans une minute.' }, { status: 429 });

  const body = await request.json().catch(() => null);
  const query = typeof body?.query === 'string' ? body.query.trim() : '';
  if (query.length < 3 || query.length > 400) return json({ error: 'La requête doit faire entre 3 et 400 caractères.' }, { status: 400 });

  const mp = new MaterialsProjectClient(env.MP_API_KEY);
  // Groq est prioritaire s'il est configuré ; sinon on retombe sur Anthropic.
  const llm = env.GROQ_API_KEY
    ? createGroqLlm({ apiKey: env.GROQ_API_KEY, model: env.GROQ_MODEL || undefined })
    : createLlm({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL || undefined });
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e) => controller.enqueue(enc.encode(JSON.stringify(e) + '\n'));
      try {
        await runScreening({ query, mp, llm, emit });
      } catch (err) {
        console.error('[api/search]', err?.name, err?.status ?? '', err?.message);
        emit({ type: 'error', message: friendly(err) });
      } finally {
        controller.close();
      }
    }
  });
  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' } });
}
