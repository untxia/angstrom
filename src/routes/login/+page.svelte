<script>
  import { enhance } from '$app/forms';
  import AuthCard from '$lib/components/AuthCard.svelte';
  import Button3D from '$lib/components/Button3D.svelte';

  let { data, form } = $props();
  let mode = $state('login'); // 'login' | 'forgot'
  let busy = $state(false);
  let showPw = $state(false);

  $effect(() => { if (form?.mode === 'forgot') mode = 'forgot'; });

  const field = 'w-full rounded-lg border border-white/10 bg-nano-void px-3 py-2.5 text-[13px] text-nano-white placeholder:text-nano-dim focus:border-nano-cyan/60 focus:outline-none';
  const label = 'mb-1 block text-[10px] tracking-[0.1em] text-nano-muted uppercase';

  function submitting() {
    busy = true;
    return async ({ update }) => { await update({ reset: false }); busy = false; };
  }
</script>

<svelte:head><title>Ångström — Connexion</title></svelte:head>

<AuthCard
  title={mode === 'login' ? 'Connexion' : 'Mot de passe oublié'}
  subtitle={mode === 'login' ? "L'agent de screening est réservé aux comptes invités." : 'Indique ton email : si un compte existe, tu recevras un lien pour choisir un nouveau mot de passe.'}
>
  {#if !data.configured}
    <p role="alert" class="rounded-lg border border-nano-warn/40 bg-nano-warn/10 px-3 py-2 text-[12px] text-nano-warn">
      Authentification non configurée : définis PUBLIC_SUPABASE_URL et PUBLIC_SUPABASE_ANON_KEY.
    </p>
  {/if}
  {#if data.notice && !form?.message}
    <p role="status" class="rounded-lg border border-nano-cyan/30 bg-nano-cyan/10 px-3 py-2 text-[12px] text-nano-cyan">{data.notice}</p>
  {/if}
  {#if form?.message}
    <p role="alert" class="rounded-lg border border-nano-danger/40 bg-nano-danger/10 px-3 py-2 text-[12px] text-nano-danger">{form.message}</p>
  {/if}

  {#if mode === 'login'}
    <form method="POST" action="?/login" use:enhance={submitting} class="grid gap-4">
      <input type="hidden" name="next" value={data.next} />
      <div>
        <label for="email" class={label}>Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required value={form?.email ?? ''} placeholder="toi@exemple.fr" class={field} />
      </div>
      <div>
        <label for="password" class={label}>Mot de passe</label>
        <div class="relative">
          <input id="password" name="password" type={showPw ? 'text' : 'password'} autocomplete="current-password" required class="{field} pr-16" />
          <button type="button" onclick={() => (showPw = !showPw)} class="absolute top-1/2 right-2 -translate-y-1/2 px-2 py-1 text-[10px] tracking-[0.08em] text-nano-muted uppercase hover:text-nano-white" aria-pressed={showPw}>
            {showPw ? 'Cacher' : 'Voir'}
          </button>
        </div>
      </div>
      <Button3D tone="cyan" size="sm" type="submit" disabled={busy || !data.configured}>{busy ? 'Connexion…' : 'Se connecter'}</Button3D>
    </form>
    <button type="button" onclick={() => (mode = 'forgot')} class="text-center text-[11px] text-nano-muted underline-offset-4 hover:text-nano-white hover:underline">Mot de passe oublié ?</button>
  {:else}
    {#if form?.sent}
      <p role="status" class="rounded-lg border border-nano-signal/40 bg-nano-signal/10 px-3 py-2 text-[12px] text-nano-signal">
        Si un compte existe pour {form.email}, un lien vient d'être envoyé. Pense à vérifier les spams.
      </p>
    {/if}
    <form method="POST" action="?/forgot" use:enhance={submitting} class="grid gap-4">
      <div>
        <label for="femail" class={label}>Email</label>
        <input id="femail" name="email" type="email" autocomplete="email" required value={form?.email ?? ''} class={field} />
      </div>
      <Button3D tone="cyan" size="sm" type="submit" disabled={busy || !data.configured}>{busy ? 'Envoi…' : 'Envoyer le lien'}</Button3D>
    </form>
    <button type="button" onclick={() => (mode = 'login')} class="text-center text-[11px] text-nano-muted underline-offset-4 hover:text-nano-white hover:underline">← Retour à la connexion</button>
  {/if}
</AuthCard>
