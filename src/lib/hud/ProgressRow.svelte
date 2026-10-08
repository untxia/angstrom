<script>
  let { label, value, total, ai = false } = $props();
  const pct = $derived(total ? Math.min(100, (value / total) * 100) : 0);
</script>

<div class="font-mono text-[11px]">
  <div class="mb-1 flex justify-between"><span>{label}</span><em class="not-italic text-nano-muted">{value.toLocaleString('fr-FR')}/{total.toLocaleString('fr-FR')}</em></div>
  <div class="h-[3px] bg-white/[.07]"><div class="h-full transition-[width] duration-200 ease-linear {ai ? 'bg-nano-purple' : 'bg-nano-cyan'}" style:width="{pct}%"></div></div>
</div>
