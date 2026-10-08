<script>
  /** axes: libellés courts ; values: 0..1 (même longueur) ; target: ligne pointillée de référence. */
  let { axes, values, target = 0.8 } = $props();
  const R = 52, C = [100, 80];
  const pt = (k, v) => {
    const a = -Math.PI / 2 + (k * Math.PI * 2) / axes.length;
    return [C[0] + Math.cos(a) * R * v, C[1] + Math.sin(a) * R * v];
  };
  const poly = (f) => axes.map((_, k) => pt(k, f(k)).join(',')).join(' ');
</script>

<svg viewBox="0 0 200 160" role="img" aria-label="Radar de couverture" class="block h-auto w-full font-mono">
  {#each [1 / 3, 2 / 3, 1] as ring}<polygon points={poly(() => ring)} fill="none" stroke="rgba(255,255,255,.09)" />{/each}
  {#each axes as name, k}
    {@const e = pt(k, 1)}{@const l = pt(k, 1.28)}
    <line x1={C[0]} y1={C[1]} x2={e[0]} y2={e[1]} stroke="rgba(255,255,255,.07)" />
    <text x={l[0]} y={l[1] + 3} fill="var(--color-nano-muted)" font-size="8" text-anchor="middle">{name}</text>
  {/each}
  <polygon points={poly(() => target)} fill="none" stroke="rgba(0,229,255,.35)" stroke-dasharray="2 3" />
  <polygon points={poly((k) => values[k] ?? 0)} fill="rgba(0,229,255,.22)" stroke="var(--color-nano-cyan)" stroke-width="1.2" />
</svg>
