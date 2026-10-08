/** Lit la réponse NDJSON de /api/search et appelle onEvent pour chaque événement de l'agent. */
export async function streamSearch(query, onEvent, signal) {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
    signal
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    onEvent({ type: 'error', message: body.error ?? `Erreur ${res.status}` });
    return;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line) onEvent(JSON.parse(line));
    }
  }
}
