<script>
  /** Jauge 270°. 0–100. Sous 40 → ambre. */
  let { value, caption = "MATCH" } = $props();
  const v = $derived(Math.max(0, Math.min(100, value)));
</script>

<div class="relative mx-auto w-full max-w-[190px] font-mono">
  <svg viewBox="0 0 120 104" aria-hidden="true" class="block h-auto w-full">
    <circle cx="60" cy="58" r="40" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="7" pathLength="100" stroke-dasharray="75 25" transform="rotate(135 60 58)" />
    <circle cx="60" cy="58" r="40" fill="none" stroke={v < 40 ? 'var(--color-nano-warn)' : 'var(--color-nano-cyan)'} stroke-width="7" pathLength="100" stroke-dasharray="{v * 0.75} 100" transform="rotate(135 60 58)" />
  </svg>
  <div class="absolute inset-0 grid place-items-center pt-1 text-center text-[30px] font-bold leading-none">
    <div>{Math.round(v)}<small class="mt-[3px] block text-[9px] font-normal tracking-wider text-nano-muted">{caption}</small></div>
  </div>
</div>
