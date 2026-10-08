<script>
  import { streamSearch } from '$lib/streamSearch.js';
  import { FAMILIES } from '$lib/families.js';
  import StatusBar from '$lib/hud/StatusBar.svelte';
  import StageTabs from '$lib/hud/StageTabs.svelte';
  import AgentField from '$lib/hud/AgentField.svelte';
  import Panel from '$lib/hud/Panel.svelte';
  import LogFeed from '$lib/hud/LogFeed.svelte';
  import ProgressRow from '$lib/hud/ProgressRow.svelte';
  import RadarChart from '$lib/hud/RadarChart.svelte';
  import HeatRow from '$lib/hud/HeatRow.svelte';
  import ScoreGauge from '$lib/hud/ScoreGauge.svelte';

  let { q } = $props();

  const steps = [
    { name: 'analyse', ai: true },
    { name: 'requête' },
    { name: 'filtre' },
    { name: 'classement', ai: true },
    { name: 'justification', ai: true },
    { name: 'export' }
  ];

  let active = $state(0);
  let lines = $state([]);
  let cands = $state([]);
  let ranking = $state([]);
  let filters = $state(null);
  let stats = $state({ screened: 0, passed: 0, flagged: 0, rejected: 0 });
  let limit = $state(100);
  let fetched = $state(0);
  let error = $state('');
  let done = $state(false);
  let focusTick = $state(0);

  function onEvent(e) {
    if (e.type === 'stage') active = e.index;
    else if (e.type === 'log') lines = [...lines, e].slice(-14);
    else if (e.type === 'filters') filters = e.filters;
    else if (e.type === 'fetched') { fetched = e.count; limit = e.limit; }
    else if (e.type === 'candidates') { cands = e.items; stats = e.stats; }
    else if (e.type === 'ranking') ranking = e.items;
    else if (e.type === 'done') { ranking = e.ranking; done = true; }
    else if (e.type === 'error') error = e.message;
  }

  $effect(() => {
    const ctrl = new AbortController();
    streamSearch(q, onEvent, ctrl.signal).catch((err) => { if (err.name !== 'AbortError') error = 'Connexion interrompue.'; });
    return () => ctrl.abort();
  });

  const running = $derived(!done && !error);
  $effect(() => {
    if (!running) return;
    const id = setInterval(() => (focusTick += 1), 2500);
    return () => clearInterval(id);
  });

  const pool = $derived(Math.min(30, cands.length));
  const rows = $derived([
    { label: 'analyse', ai: true, value: filters ? 1 : 0, total: 1 },
    { label: 'requête', value: active > 1 || done ? fetched : 0, total: limit },
    { label: 'filtre', value: active > 2 || done ? cands.length : 0, total: Math.max(fetched, 1) },
    { label: 'classement', ai: true, value: active > 3 || done ? pool : 0, total: Math.max(pool, 1) },
    { label: 'justification', ai: true, value: ranking.length, total: Math.max(ranking.length, 1) },
    { label: 'export', value: done ? 1 : 0, total: 1 }
  ]);

  const share = (f) => (cands.length ? cands.filter(f).length / cands.length : 0);
  const radar = $derived([
    share((c) => c.status === 'stable'),
    share((c) => c.band_gap != null),
    share((c) => c.energy_above_hull != null),
    share((c) => c.density != null),
    ranking.length ? ranking.reduce((s, r) => s + r.score, 0) / ranking.length / 100 : 0
  ]);

  const clamp01 = (v) => (v == null ? null : Math.max(0, Math.min(1, v)));
  const first12 = $derived(Array.from({ length: 12 }, (_, i) => cands[i] ?? null));
  const heat = $derived([
    { k: 'Eg', values: first12.map((c) => (c ? clamp01(c.band_gap == null ? null : c.band_gap / 5) : null)) },
    { k: 'Eh', semantic: true, values: first12.map((c) => (c ? clamp01(c.energy_above_hull == null ? null : c.energy_above_hull / 0.2) : null)) },
    { k: 'ρ', values: first12.map((c) => (c ? clamp01(c.density == null ? null : c.density / 12) : null)) }
  ]);

  const fmt = (v, d = 2) => (v == null ? '—' : Number(v).toFixed(d));
  const chips = $derived(
    !filters ? [] : [
      filters.summary,
      filters.elements.length && `avec ${filters.elements.join(', ')}`,
      filters.excludeElements.length && `sans ${filters.excludeElements.join(', ')}`,
      (filters.bandGapMin != null || filters.bandGapMax != null) && `gap ${filters.bandGapMin ?? 0}–${filters.bandGapMax ?? '∞'} eV`,
      filters.isStable && 'stable uniquement',
      filters.maxEnergyAboveHull != null && `hull ≤ ${filters.maxEnergyAboveHull} eV/at.`,
      filters.numElements && `${filters.numElements} éléments`
    ].filter(Boolean)
  );
  const linkable = (id) => /^[a-z]+-[a-z0-9]+$/i.test(id);
</script>

<div class="grid gap-2.5">
  <StatusBar
    items={[
      { label: 'Agent', value: 'angstrom-screen' },
      { label: 'Reçus', value: fetched, tone: 'cyan' },
      { label: 'Candidats', value: cands.length },
      { label: 'Alertes', value: stats.flagged, tone: 'warn' }
    ]}
    query={q.length > 36 ? q.slice(0, 36) + '…' : q}
  />
  <StageTabs {steps} active={done ? 5 : active} />

  {#if error}
    <p class="border border-nano-danger/40 bg-nano-danger/10 px-3 py-2 text-[12px] text-nano-danger" role="alert">{error}</p>
  {/if}

  <AgentField
    families={FAMILIES}
    candidates={cands.map((c) => ({ formula: c.formula, status: c.status, cluster: c.family }))}
    focus={running ? focusTick % FAMILIES.length : (ranking[0]?.family ?? 0)}
  />

  <section class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
    <Panel title="Journal" meta={running ? 'live' : 'fini'}><LogFeed {lines} /></Panel>
    <Panel title="Pipeline" meta="6">
      <div class="grid gap-[11px]">{#each rows as r}<ProgressRow label={r.label} ai={r.ai} value={r.value} total={r.total} />{/each}</div>
    </Panel>
    <Panel title="Couverture" meta="données"><RadarChart axes={['STAB', 'GAP', 'HULL', 'DENS', 'SCORE']} values={radar} /></Panel>
    <Panel title="Propriétés" meta="12 prem.">
      <div class="grid gap-1">{#each heat as h}<HeatRow label={h.k} values={h.values} semantic={h.semantic} />{/each}</div>
      <dl class="mt-auto grid grid-cols-[1fr_auto] gap-x-2.5 pt-2.5">
        <dt class="text-nano-muted">reçus</dt><dd class="m-0 text-right font-bold">{stats.screened}</dd>
        <dt class="text-nano-muted">gardés</dt><dd class="m-0 text-right font-bold text-nano-signal">{stats.passed}</dd>
        <dt class="text-nano-muted">alertes</dt><dd class="m-0 text-right font-bold text-nano-warn">{stats.flagged}</dd>
        <dt class="text-nano-muted">rejetés</dt><dd class="m-0 text-right font-bold text-nano-danger">{stats.rejected}</dd>
      </dl>
    </Panel>
    <Panel title="Meilleur score" meta={ranking[0]?.formula ?? '…'} tone="ai"><ScoreGauge value={ranking[0]?.score ?? 0} caption="MATCH" /></Panel>
    <Panel title="Filtres lus" meta="par Claude" tone="ai">
      {#if chips.length}
        <ul class="m-0 grid list-none gap-1.5 p-0">{#each chips as c}<li class="text-nano-white">› {c}</li>{/each}</ul>
      {:else}<p class="m-0 text-nano-muted">Analyse de la requête…</p>{/if}
    </Panel>
  </section>

  {#if ranking.length}
    <section class="hud-panel" aria-label="Shortlist">
      <div class="hud-ph"><span>Shortlist</span><i class="not-italic text-nano-purple">{ranking.length} matériaux</i></div>
      <ol class="m-0 grid list-none gap-3 p-0">
        {#each ranking as r, i (r.material_id)}
          <li class="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 border-t border-white/10 pt-3 first:border-t-0 first:pt-0 md:grid-cols-[28px_150px_minmax(0,1fr)_110px]">
            <span class="text-nano-dim">{String(i + 1).padStart(2, '0')}</span>
            <div class="min-w-0">
              <div class="text-[14px] font-bold">{r.formula}</div>
              {#if linkable(r.material_id)}
                <a class="text-nano-cyan hover:underline" href="/material/{r.material_id}">{r.material_id} · maille 3D</a>
                <a class="ml-2 text-nano-dim hover:text-nano-white hover:underline" href="https://next-gen.materialsproject.org/materials/{r.material_id}" target="_blank" rel="noreferrer" aria-label="Voir sur Materials Project">MP ↗</a>
              {:else}<span class="text-nano-muted">{r.material_id}</span>{/if}
            </div>
            <div class="col-span-2 min-w-0 md:col-span-1">
              <p class="m-0 text-nano-white">{r.justification}</p>
              <p class="m-0 mt-1 text-nano-muted">Eg {fmt(r.band_gap)} eV · Ehull {fmt(r.energy_above_hull, 3)} eV/at. · ρ {fmt(r.density)} g/cm³</p>
              {#if r.flags.length}<p class="m-0 mt-1 text-nano-warn">⚑ {r.flags.join(' · ')}</p>{/if}
            </div>
            <div class="col-span-2 md:col-span-1">
              <div class="text-right text-[16px] font-bold text-nano-purple">{r.score}</div>
              <div class="mt-1 h-[3px] bg-white/[.07]"><div class="h-full bg-nano-purple" style:width="{r.score}%"></div></div>
            </div>
          </li>
        {/each}
      </ol>
    </section>
  {:else if done}
    <p class="text-nano-muted">Aucun matériau ne correspond. Essaie d'élargir les contraintes.</p>
  {/if}
</div>
