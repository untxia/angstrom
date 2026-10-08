<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Button3D from '$lib/components/Button3D.svelte';
  import DemoScreening from './DemoScreening.svelte';
  import LiveScreening from './LiveScreening.svelte';

  let { data } = $props();
  const q = $derived(page.url.searchParams.get('q')?.trim() ?? '');
  let draft = $state('');
  let run = $state(0); // relance la même requête sans changer l'URL
  let hint = $state('');
  $effect(() => { draft = q; });

  function submit(e) {
    e.preventDefault();
    const v = draft.trim();
    if (v.length < 3) { hint = 'Écris au moins 3 caractères.'; return; }
    hint = '';
    if (v === q) run += 1;
    else goto(`/screening?q=${encodeURIComponent(v)}`);
  }
</script>

<svelte:head><title>Ångström — Screening</title></svelte:head>

<main class="mx-auto grid max-w-[1320px] gap-2.5 px-4 py-4 font-mono">
  {#if data.userEmail}
    <form method="POST" action="/logout" class="flex items-center justify-end gap-3 text-[10px] tracking-[0.08em] text-nano-muted">
      <span class="truncate">{data.userEmail}</span>
      <button type="submit" class="rounded-full border border-white/10 px-3 py-1 uppercase hover:border-nano-cyan/50 hover:text-nano-white">Déconnexion</button>
    </form>
  {/if}
  <form onsubmit={submit} class="flex items-center gap-2 rounded-full border border-white/10 bg-nano-panel py-1.5 pr-1.5 pl-5">
    <input
      type="text"
      bind:value={draft}
      maxlength="400"
      aria-label="Requête"
      placeholder="Ex : oxyde stable, gap entre 1,5 et 2,5 eV, sans cobalt ni plomb"
      class="min-w-0 flex-1 bg-transparent text-[13px] text-nano-white placeholder:text-nano-muted focus:outline-none"
    />
    <Button3D tone="cyan" size="sm" type="submit">Lancer</Button3D>
  </form>

  {#if hint}<p class="px-2 text-[11px] text-nano-warn">{hint}</p>{/if}

  {#if q}
    {#key `${q}|${run}`}<LiveScreening {q} />{/key}
  {:else}
    <DemoScreening />
    <p class="text-[10px] tracking-[0.06em] text-nano-dim">Mode démo : écris une requête ci-dessus pour lancer l'agent.</p>
  {/if}
</main>
