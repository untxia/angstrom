<script>
  let { items, query } = $props(); // items: { label, value, tone?: "cyan" | "warn" }[]
</script>

<div class="flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-nano-muted">
  {#each items as it}
    <span>{it.label}<b class="ml-1 font-bold" class:text-nano-white={!it.tone} class:text-nano-cyan={it.tone === 'cyan'} class:text-nano-warn={it.tone === 'warn'}>{it.value}</b></span>
  {/each}
  {#if query}<span class="ml-auto font-bold text-nano-purple">{query}</span>{/if}
</div>
