<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Button3D from '$lib/components/Button3D.svelte';
  import DemoScreening from './DemoScreening.svelte';
  import LiveScreening from './LiveScreening.svelte';

  const q = $derived(page.url.searchParams.get('q')?.trim() ?? '');
  let draft = $state('');
  $effect(() => { draft = q; });

  function submit(e) {
    e.preventDefault();
    const v = draft.trim();
    if (v.length >= 3) goto(`/screening?q=${encodeURIComponent(v)}`);
  }
</script>

<svelte:head><title>Ångström — Screening</title></svelte:head>

<main class="mx-auto grid max-w-[1320px] gap-2.5 px-4 py-4 font-mono">
  <form onsubmit={submit} class="flex items-center gap-2 rounded-full border border-white/10 bg-nano-panel py-1.5 pr-1.5 pl-5">
    <input
      type="text"
      bind:value={draft}
      maxlength="400"
      aria-label="Requête"
      placeholder="Ex : oxyde stable, gap entre 1,5 et 2,5 eV, sans cobalt ni plomb"
      class="min-w-0 flex-1 bg-transparent text-[13px] text-nano-white placeholder:text-nano-muted focus:outline-none"
    />
    <Button3D tone="cyan" size="sm">Lancer</Button3D>
  </form>

  {#if q}
    {#key q}<LiveScreening {q} />{/key}
  {:else}
    <DemoScreening />
    <p class="text-[10px] tracking-[0.06em] text-nano-dim">Mode démo : écris une requête ci-dessus pour lancer l'agent.</p>
  {/if}
</main>
