<script>
  /**
   * Bouton flottant "physique" à 4 couches :
   *   1. dégradé vertical (la face capte la lumière du haut)
   *   2. arête supérieure éclairée (inset highlight)
   *   3. retour d'ombre interne en bas (inset shadow)
   *   4. double ombre portée : une serrée qui pose l'objet, une large
   *      et colorée qui fait rayonner la matière sur le fond
   */
  let {
    tone = 'cyan', // 'cyan' | 'purple' | 'ghost'
    size = 'md', // 'sm' | 'md' | 'lg'
    circle = false,
    href = null,
    disabled = false,
    onclick = () => {},
    children
  } = $props();

  const sizes = $derived({
    sm: circle ? 'h-11 w-11 text-sm' : 'px-5 py-2.5 text-sm',
    md: circle ? 'h-14 w-14 text-base' : 'px-8 py-4 text-[15px]',
    lg: circle ? 'h-18 w-18 text-lg' : 'px-10 py-5 text-base'
  });

  const toneClasses = {
    cyan: 'btn-3d-cyan text-nano-void',
    purple: 'btn-3d-purple text-nano-white',
    ghost: 'btn-3d-ghost text-nano-white border border-nano-cyan/40'
  };
</script>

{#if href}
  <a
    {href}
    class="btn-3d {toneClasses[tone]} {sizes[size]} rounded-full inline-flex items-center justify-center gap-2 font-bold select-none"
    class:opacity-40={disabled}
    class:pointer-events-none={disabled}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    type="button"
    {onclick}
    {disabled}
    class="btn-3d {toneClasses[tone]} {sizes[size]} rounded-full inline-flex items-center justify-center gap-2 font-bold select-none disabled:opacity-40 disabled:pointer-events-none"
  >
    {@render children?.()}
  </button>
{/if}

<style>
  .btn-3d {
    cursor: pointer;
    border: none;
    transition:
      transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.15s ease;
  }
  .btn-3d:active {
    transform: translateY(3px);
  }

  .btn-3d-cyan {
    background: linear-gradient(180deg, #73f6ff 0%, #009cba 100%);
    box-shadow:
      inset 0 1.5px 1px rgba(255, 255, 255, 0.55),
      inset 0 -2.5px 4px rgba(0, 0, 0, 0.4),
      0 6px 10px -2px rgba(0, 0, 0, 0.55),
      0 12px 32px -6px rgba(0, 229, 255, 0.45);
  }
  .btn-3d-cyan:hover {
    box-shadow:
      inset 0 1.5px 1px rgba(255, 255, 255, 0.6),
      inset 0 -2.5px 4px rgba(0, 0, 0, 0.35),
      0 8px 14px -2px rgba(0, 0, 0, 0.5),
      0 16px 40px -6px rgba(0, 229, 255, 0.55);
  }

  .btn-3d-purple {
    background: linear-gradient(180deg, #d096ff 0%, #6f25ad 100%);
    box-shadow:
      inset 0 1.5px 1px rgba(255, 255, 255, 0.45),
      inset 0 -2.5px 4px rgba(0, 0, 0, 0.4),
      0 6px 10px -2px rgba(0, 0, 0, 0.55),
      0 12px 32px -6px rgba(177, 78, 255, 0.45);
  }
  .btn-3d-purple:hover {
    box-shadow:
      inset 0 1.5px 1px rgba(255, 255, 255, 0.5),
      inset 0 -2.5px 4px rgba(0, 0, 0, 0.35),
      0 8px 14px -2px rgba(0, 0, 0, 0.5),
      0 16px 40px -6px rgba(177, 78, 255, 0.55);
  }

  .btn-3d-ghost {
    background: linear-gradient(180deg, #1d2547 0%, #0d1128 100%);
    box-shadow:
      inset 0 1.5px 1px rgba(255, 255, 255, 0.08),
      inset 0 -2px 3px rgba(0, 0, 0, 0.5),
      0 4px 8px -2px rgba(0, 0, 0, 0.5);
  }

  @media (prefers-reduced-motion: reduce) {
    .btn-3d {
      transition: box-shadow 0.15s ease;
    }
    .btn-3d:active {
      transform: none;
    }
  }
</style>
