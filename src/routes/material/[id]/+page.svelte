<script>
  import CrystalViewer from '$lib/components/CrystalViewer.svelte';
  import { stabilityStatus } from '$lib/families.js';

  let { data } = $props();
  const m = $derived(data.material);
  let supercell = $state(1);

  const fmt = (v, d = 2) => (v == null ? 'inconnu' : Number(v).toFixed(d));
  const status = $derived(stabilityStatus({ is_stable: m.is_stable, energy_above_hull: m.energy_above_hull }));
  const BADGE = {
    stable: ['stable', 'border-nano-signal/50 text-nano-signal'],
    meta: ['métastable', 'border-nano-warn/50 text-nano-warn'],
    unstable: ['instable ou inconnu', 'border-nano-danger/50 text-nano-danger']
  };
  const rows = $derived([
    ['Gap', m.band_gap == null ? 'inconnu' : `${fmt(m.band_gap)} eV`],
    ['Énergie au-dessus de l’enveloppe', m.energy_above_hull == null ? 'inconnue' : `${fmt(m.energy_above_hull, 3)} eV/atome`],
    ['Densité', m.density == null ? 'inconnue' : `${fmt(m.density)} g/cm³`],
    ['Volume de la maille', m.volume == null ? 'inconnu' : `${fmt(m.volume, 1)} Å³`],
    ['Atomes par maille', m.nsites ?? 'inconnu'],
    ['Groupe d’espace', m.spacegroup ?? 'inconnu'],
    ['Système cristallin', m.crystalSystem ?? 'inconnu']
  ]);
</script>

<svelte:head><title>Ångström — {m.formula}</title></svelte:head>

<main class="mx-auto grid max-w-[1100px] gap-3 px-4 py-4 font-mono">
  <nav class="flex items-center justify-between text-[10px] tracking-[0.08em] uppercase">
    <a href="/screening" class="text-nano-muted hover:text-nano-white">← Screening</a>
    <a href="https://next-gen.materialsproject.org/materials/{m.id}" target="_blank" rel="noreferrer" class="text-nano-cyan hover:underline">{m.id} sur Materials Project ↗</a>
  </nav>

  <header class="flex flex-wrap items-baseline gap-3">
    <h1 class="m-0 text-[28px] font-black text-nano-white">{m.formula}</h1>
    <span class="rounded-full border px-2.5 py-0.5 text-[10px] tracking-[0.08em] uppercase {BADGE[status][1]}">{BADGE[status][0]}</span>
  </header>

  <section class="hud-panel" aria-label="Maille cristalline">
    <div class="hud-ph">
      <span>Maille cristalline</span>
      {#if data.structure}
        <span class="flex items-center gap-1 normal-case">
          {#each [1, 2, 3] as n}
            <button type="button" onclick={() => (supercell = n)} aria-pressed={supercell === n}
              class="rounded-[2px] px-2 py-0.5 {supercell === n ? 'bg-nano-cyan text-nano-void' : 'bg-nano-panel text-nano-muted hover:text-nano-white'}">{n}×{n}×{n}</button>
          {/each}
        </span>
      {/if}
    </div>
    {#if data.structure}
      <CrystalViewer lattice={data.structure.lattice} sites={data.structure.sites} {supercell} />
      <p class="m-0 mt-2 text-[10px] text-nano-dim">Contour cyan = cellule unitaire. Rayons des atomes à l'échelle d'affichage, pas des rayons physiques.</p>
    {:else}
      <p class="m-0 py-10 text-center text-nano-muted">Structure cristalline indisponible ou trop grande pour ce matériau.</p>
    {/if}
  </section>

  <section class="hud-panel" aria-label="Propriétés">
    <div class="hud-ph"><span>Propriétés</span><i class="not-italic text-nano-dim">calculées (DFT)</i></div>
    <dl class="m-0 grid gap-x-6 gap-y-2 md:grid-cols-2">
      {#each rows as [k, v]}
        <div class="flex justify-between gap-3 border-b border-white/5 pb-1.5"><dt class="text-nano-muted">{k}</dt><dd class="m-0 text-right text-nano-white">{v}</dd></div>
      {/each}
    </dl>
  </section>
</main>
