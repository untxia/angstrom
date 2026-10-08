import { redirect } from '@sveltejs/kit';
import { OTP_TYPES, safeNext } from '$lib/server/auth.js';

/** Cible des liens e-mail Supabase (invitation, mot de passe oublié) : /auth/confirm?token_hash=…&type=… */
export async function GET({ url, locals }) {
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  if (!locals.supabase || !tokenHash || !OTP_TYPES.includes(type)) redirect(303, '/login?notice=lien-invalide');

  const { error } = await locals.supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) redirect(303, '/login?notice=lien-expire');

  // Invitation ou récupération : l'utilisateur doit choisir son mot de passe.
  if (type === 'invite' || type === 'recovery') redirect(303, '/account/password');
  redirect(303, safeNext(url.searchParams.get('next')));
}
