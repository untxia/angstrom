<script>
  /** kind: act (cyan) · ai (violet, raisonnement) · warn (ambre) · ok (vert) */
  let { lines, max = 11 } = $props(); // lines: { t, verb, text, kind: "act"|"ai"|"warn"|"ok" }[]
  const visible = $derived(lines.slice(-max));
</script>

<div class="grid gap-0.5 overflow-hidden font-mono text-[10.5px]">
  {#each visible as l (l)}
    <div class="grid grid-cols-[52px_46px_minmax(0,1fr)] gap-1.5 whitespace-nowrap">
      <span class="text-nano-dim">{l.t}</span>
      <span class:text-nano-cyan={l.kind === 'act'} class:text-nano-purple={l.kind === 'ai'} class:text-nano-warn={l.kind === 'warn'} class:text-nano-signal={l.kind === 'ok'}>{l.verb}</span>
      <span class="truncate">{l.text}</span>
    </div>
  {/each}
</div>
