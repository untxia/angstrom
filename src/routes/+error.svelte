<script>
  import { page } from '$app/state';
</script>

<svelte:head><title>Ångström — Erreur {page.status}</title></svelte:head>

<main class="grid min-h-screen place-items-center px-4 font-mono">
  <div class="max-w-[420px] text-center">
    <div class="text-[48px] font-black text-nano-cyan">{page.status}</div>
    <p class="mt-2 text-[13px] text-nano-white">{page.error?.message ?? 'Une erreur est survenue.'}</p>
    <a href="/screening" class="mt-5 inline-block rounded-full border border-white/10 px-4 py-2 text-[11px] tracking-[0.08em] text-nano-muted uppercase hover:border-nano-cyan/50 hover:text-nano-white">← Retour au screening</a>
  </div>
</main>
