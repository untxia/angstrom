<script>
  /** Cadre commun des écrans de connexion (style HUD d'Ångström). */
  let { title, subtitle = '', children } = $props();
</script>

<main class="grid min-h-screen place-items-center px-4 py-10 font-mono">
  <div class="w-full max-w-[400px]">
    <a href="/" class="mb-6 block text-center text-lg font-black tracking-[3px] text-nano-cyan">ÅNGSTRÖM</a>
    <section class="rounded-2xl border border-white/10 bg-nano-panel p-6 shadow-[0_0_60px_-20px_rgba(0,229,255,0.25)]">
      <h1 class="text-[15px] font-bold tracking-[0.04em] text-nano-white">{title}</h1>
      {#if subtitle}<p class="mt-1 text-[12px] leading-relaxed text-nano-muted">{subtitle}</p>{/if}
      <div class="mt-5 grid gap-4">{@render children?.()}</div>
    </section>
    <p class="mt-5 text-center text-[10px] tracking-[0.06em] text-nano-dim">Accès sur invitation · propulsé par Materials Project</p>
  </div>
</main>
