/** Fournisseur LLM Groq (API compatible OpenAI). Même interface que createLlm d'Anthropic : complete(system, user, maxTokens). */
import { LlmError } from './anthropic.js';

export function createGroqLlm({ apiKey, model = 'llama-3.3-70b-versatile', fetchImpl = fetch }) {
  return {
    async complete(system, user, maxTokens = 1200) {
      const res = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ]
        }),
        signal: AbortSignal.timeout(60_000)
      });
      if (!res.ok) throw new LlmError(res.status);
      const json = await res.json();
      return json.choices?.[0]?.message?.content ?? '';
    }
  };
}
