import { fail, redirect } from '@sveltejs/kit';
import { safeNext, validEmail } from '$lib/server/auth.js';

const NOTICES = {
  'lien-invalide': 'Ce lien n’est pas valide.',
  'lien-expire': 'Ce lien a expiré. Demande un nouveau lien ci-dessous.',
  'mot-de-passe-ok': 'Mot de passe enregistré. Tu peux te connecter.'
};

export function load({ locals, url }) {
  const next = safeNext(url.searchParams.get('next'));
  if (locals.user || locals.authDisabled) redirect(303, next);
  return { next, configured: locals.authConfigured, notice: NOTICES[url.searchParams.get('notice')] ?? '' };
}

export const actions = {
  login: async ({ request, locals }) => {
    const f = await request.formData();
    const email = String(f.get('email') ?? '').trim();
    const password = String(f.get('password') ?? '');
    const next = safeNext(f.get('next'));
    if (!locals.supabase) return fail(503, { message: 'Authentification non configurée sur ce serveur.', email });
    if (!validEmail(email) || !password) return fail(400, { message: 'Renseigne ton email et ton mot de passe.', email });
    const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
    // Message volontairement identique pour email inconnu et mauvais mot de passe.
    if (error) return fail(400, { message: 'Email ou mot de passe incorrect.', email });
    redirect(303, next);
  },

  forgot: async ({ request, locals }) => {
    const f = await request.formData();
    const email = String(f.get('email') ?? '').trim();
    if (!locals.supabase) return fail(503, { message: 'Authentification non configurée sur ce serveur.', email });
    if (!validEmail(email)) return fail(400, { message: 'Renseigne une adresse email valide.', email, mode: 'forgot' });
    await locals.supabase.auth.resetPasswordForEmail(email).catch(() => {});
    // Même réponse que l'email existe ou non : on ne révèle pas qui a un compte.
    return { sent: true, email, mode: 'forgot' };
  }
};
