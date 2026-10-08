<script>
  /** values: 0..1. `semantic` colore par stabilité (vert/ambre/rose) au lieu de l'échelle cyan. `lit` = nb de colonnes déjà scannées. */
  let { label, values, semantic = false, lit = values.length } = $props();
  const color = (v, i) =>
    i >= lit ? 'rgba(255,255,255,.06)'
    : semantic ? (v < 0.55 ? 'var(--color-nano-signal)' : v < 0.82 ? 'var(--color-nano-warn)' : 'var(--color-nano-danger)')
    : `rgba(0,229,255,${(0.18 + v * 0.82).toFixed(2)})`;
</script>

<div class="grid grid-cols-[28px_1fr] items-center gap-1.5 font-mono text-[9.5px] text-nano-muted">
  <span>{label}</span>
  <div class="grid gap-0.5" style:grid-template-columns="repeat({values.length}, 1fr)">
    {#each values as v, i}<b class="block aspect-[1.5]" style:background={color(v, i)}></b>{/each}
  </div>
</div>
