<script>
  import { goto } from '$app/navigation';
  import Button3D from '$lib/components/Button3D.svelte';

  let query = $state('');

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= 3) goto(`/screening?q=${encodeURIComponent(q)}`);
  }
</script>

<svelte:head>
  <title>Ångström — Explore la matière à l'échelle atomique</title>
  <meta
    name="description"
    content="Agent IA de screening de nanomatériaux. Décris ce que tu cherches en langage naturel, l'agent interroge Materials Project et propose une shortlist argumentée."
  />
</svelte:head>

<main class="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
  <span class="text-lg font-black tracking-[3px] text-nano-cyan">ÅNGSTRÖM</span>

  <h1 class="max-w-2xl text-4xl font-black text-nano-white md:text-5xl">
    Explore la matière à l'échelle atomique
  </h1>

  <p class="max-w-md text-nano-muted">
    Décris le matériau que tu cherches en langage naturel. L'agent interroge Materials
    Project et propose une shortlist argumentée.
  </p>

  <form onsubmit={handleSearch} class="flex w-full max-w-lg items-center gap-2 rounded-full border border-white/10 bg-nano-panel py-2 pr-2 pl-6">
    <input
      type="text"
      bind:value={query}
      placeholder="Ex : matériaux 2D stables, conducteurs, sans éléments toxiques…"
      class="flex-1 bg-transparent text-[15px] text-nano-white placeholder:text-nano-muted focus:outline-none"
    />
    <Button3D tone="cyan" size="md" type="submit">Rechercher</Button3D>
  </form>
</main>
