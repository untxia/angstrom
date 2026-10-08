/** Fournisseur LLM Groq (API compatible OpenAI). Même interface que createLlm d'Anthropic : complete(system, user, maxTokens). */
import { LlmError, errorDetail } from './anthropic.js';

/** Délai d'attente avant nouvel essai (secondes → ms), plafonné pour rester sous maxDuration. */
export function retryDelayMs(res, attempt) {
  const h = Number(res.headers?.get?.('retry-after'));
  const base = Number.isFinite(h) && h > 0 ? h * 1000 : 2000 * (attempt + 1);
  return Math.min(base, 12_000);
}

export function createGroqLlm({ apiKey, model = 'llama-3.3-70b-versatile', fetchImpl = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), retries = 2 }) {
  return {
    async complete(system, user, maxTokens = 1200) {
      for (let attempt = 0; ; attempt++) {
        const res = await call(system, user, maxTokens);
        if (res.status === 429 && attempt < retries) { await sleep(retryDelayMs(res, attempt)); continue; }
        if (!res.ok) throw new LlmError(res.status, await errorDetail(res));
        const json = await res.json();
        return json.choices?.[0]?.message?.content ?? '';
      }
    }
  };
  function call(system, user, maxTokens) {
    return fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ]
        }),
        signal: AbortSignal.timeout(60_000)
      });
  }
}
