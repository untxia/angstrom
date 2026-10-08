<script>
  import { onMount } from 'svelte';
  import StatusBar from '$lib/hud/StatusBar.svelte';
  import StageTabs from '$lib/hud/StageTabs.svelte';
  import AgentField from '$lib/hud/AgentField.svelte';
  import Panel from '$lib/hud/Panel.svelte';
  import LogFeed from '$lib/hud/LogFeed.svelte';
  import ProgressRow from '$lib/hud/ProgressRow.svelte';
  import RadarChart from '$lib/hud/RadarChart.svelte';
  import HeatRow from '$lib/hud/HeatRow.svelte';
  import ScoreGauge from '$lib/hud/ScoreGauge.svelte';

  // Données d'exemple : à remplacer par l'état réel de l'agent
  // (étapes du pipeline, candidats renvoyés par Materials Project, journal d'appels).
  const steps = [
    { name: 'analyse', ai: true },
    { name: 'requête' },
    { name: 'filtre' },
    { name: 'classement', ai: true },
    { name: 'justification', ai: true },
    { name: 'export' }
  ];
  const totals = [4, 7420, 412, 46, 12, 1];
  const families = ['oxydes', 'sulfures', 'phosphates', 'pérovskites', 'halogénures', 'nitrures'];
  const formulas = ['Cu2O', 'Fe2O3', 'BiVO4', 'WO3', 'TiO2', 'ZnO', 'SnO2', 'SrTiO3', 'CuBi2O4', 'Ta2O5', 'NiO', 'MnO2'];
  const candidates = Array.from({ length: 36 }, (_, i) => ({
    formula: formulas[i % formulas.length],
    status: ['stable', 'meta', 'unstable'][(i * 7) % 3],
    cluster: i % families.length
  }));
  const heat = ['Eg', 'Ef', 'Eh', 'ρ', 'K', 'G'].map((k, r) => ({
    k,
    semantic: k === 'Eh',
    values: Array.from({ length: 12 }, (_, i) => ((i * 37 + r * 53) % 97) / 97)
  }));

  let active = $state(2);
  let progress = $state(0.4);
  let lines = $state([]);

  const hhmm = () => new Date().toTimeString().slice(0, 8);
  onMount(() => {
    const id = setInterval(() => {
      progress += 0.05;
      if (progress >= 1) { progress = 0; active = (active + 1) % steps.length; }
      const f = formulas[Math.floor(Math.random() * formulas.length)];
      lines = [...lines, { t: hhmm(), verb: steps[active].ai ? 'raison' : 'filtre', kind: steps[active].ai ? 'ai' : 'act', text: `mp-${1000 + Math.floor(Math.random() * 1_900_000)} ${f}` }].slice(-14);
    }, 450);
    return () => clearInterval(id);
  });
</script>

<div class="grid gap-2.5">
  <StatusBar
    items={[
      { label: 'Agent', value: 'angstrom-screen' },
      { label: 'Matériaux', value: '154 718' },
      { label: 'Candidats', value: candidates.length, tone: 'cyan' },
      { label: 'Alertes', value: 9, tone: 'warn' }
    ]}
    query="photoanode.query"
  />
  <StageTabs {steps} {active} />
  <AgentField {families} {candidates} focus={active % families.length} />

  <section class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
    <Panel title="Journal" meta="live"><LogFeed {lines} /></Panel>
    <Panel title="Pipeline" meta="6">
      <div class="grid gap-[11px]">
        {#each steps as s, i}
          <ProgressRow label={s.name} ai={s.ai} total={totals[i]} value={Math.round(totals[i] * (i < active ? 1 : i === active ? progress : 0))} />
        {/each}
      </div>
    </Panel>
    <Panel title="Couverture" meta="live"><RadarChart axes={['STAB', 'GAP', 'DENS', 'ABON', 'SÛR', 'COÛT']} values={[0.8, 0.7, 0.55, 0.6, 0.9, 0.5]} /></Panel>
    <Panel title="Propriétés" meta="12 col.">
      <div class="grid gap-1">
        {#each heat as h}<HeatRow label={h.k} values={h.values} semantic={h.semantic} />{/each}
      </div>
    </Panel>
    <Panel title="Score" meta="live" tone="ai"><ScoreGauge value={78} caption="MATCH" /></Panel>
    <Panel title="agent.js" meta="2 passes" tone="ai"><pre class="m-0 flex-1 overflow-hidden text-[10.5px] leading-[1.55]">{`// 1. Claude : requête → contraintes
// 2. Materials Project : recherche
// 3. Claude : classement justifié`}</pre></Panel>
  </section>
  <p class="text-[10px] tracking-[0.06em] text-nano-dim">Données d'exemple, pas un vrai appel à Materials Project.</p>
</div>
