<script>
  /** tone="ai" colore l'indicateur en violet (raisonnement de l'agent). */
  let { title, meta = "", tone = "act", children } = $props();
</script>

<article class="hud-panel">
  <div class="hud-ph">
    <span>{title}</span>
    {#if meta}<i class="not-italic" class:text-nano-cyan={tone === 'act'} class:text-nano-purple={tone === 'ai'}>{meta}</i>{/if}
  </div>
  {@render children()}
</article>
