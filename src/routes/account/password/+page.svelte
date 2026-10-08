<script>
  import { enhance } from '$app/forms';
  import AuthCard from '$lib/components/AuthCard.svelte';
  import Button3D from '$lib/components/Button3D.svelte';

  let { data, form } = $props();
  let busy = $state(false);
  const field = 'w-full rounded-lg border border-white/10 bg-nano-void px-3 py-2.5 text-[13px] text-nano-white focus:border-nano-cyan/60 focus:outline-none';
  const label = 'mb-1 block text-[10px] tracking-[0.1em] text-nano-muted uppercase';
</script>

<svelte:head><title>Ångström — Choisir un mot de passe</title></svelte:head>

<AuthCard title="Choisis ton mot de passe" subtitle={`Compte : ${data.email}. Au moins 10 caractères.`}>
  {#if form?.message}
    <p role="alert" class="rounded-lg border border-nano-danger/40 bg-nano-danger/10 px-3 py-2 text-[12px] text-nano-danger">{form.message}</p>
  {/if}
  <form method="POST" use:enhance={() => { busy = true; return async ({ update }) => { await update({ reset: false }); busy = false; }; }} class="grid gap-4">
    <div>
      <label for="password" class={label}>Nouveau mot de passe</label>
      <input id="password" name="password" type="password" autocomplete="new-password" minlength="10" required class={field} />
    </div>
    <div>
      <label for="confirm" class={label}>Confirmation</label>
      <input id="confirm" name="confirm" type="password" autocomplete="new-password" minlength="10" required class={field} />
    </div>
    <Button3D tone="cyan" size="sm" type="submit" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer et continuer'}</Button3D>
  </form>
</AuthCard>
