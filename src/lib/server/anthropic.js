/** Appel minimal à l'API Messages d'Anthropic en HTTP direct (même approche que le client Materials Project). */
export class LlmError extends Error {
  constructor(status, detail = '') {
    super(`API LLM a répondu ${status}${detail ? ` : ${detail}` : ''}`);
    this.name = 'LlmError';
    this.status = status;
    this.detail = detail;
  }
}

/** Extrait le message d'erreur renvoyé par le fournisseur (sans jamais inclure de clé). */
export async function errorDetail(res) {
  try {
    const j = await res.json();
    const m = j?.error?.message ?? j?.message ?? '';
    return String(m).slice(0, 200);
  } catch {
    return '';
  }
}

export function createLlm({ apiKey, model = 'claude-sonnet-5-5', fetchImpl = fetch }) {
  return {
    async complete(system, user, maxTokens = 1200) {
      const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
        signal: AbortSignal.timeout(60_000)
      });
      if (!res.ok) throw new LlmError(res.status, await errorDetail(res));
      const json = await res.json();
      return (json.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    }
  };
}
