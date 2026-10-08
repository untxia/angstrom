<script>
  /** `ai: true` = étape où l'agent raisonne (violet). Sinon action (cyan). */
  let { steps, active } = $props(); // steps: { name, ai? }[]
</script>

<nav class="grid auto-cols-fr grid-flow-col gap-1 overflow-x-auto font-mono" aria-label="Pipeline">
  {#each steps as s, i}
    <div
      class="hud-tab min-w-[76px]"
      class:!text-nano-muted={i < active}
      class:!bg-nano-cyan={i === active && !s.ai}
      class:!bg-nano-purple={i === active && s.ai}
      class:!text-nano-void={i === active}
      class:font-bold={i === active}
      aria-current={i === active ? 'step' : undefined}
    >{s.name}</div>
  {/each}
</nav>
