import { fail, redirect } from '@sveltejs/kit';
import { passwordProblem } from '$lib/server/auth.js';

export function load({ locals }) {
  if (!locals.user) redirect(303, '/login?notice=lien-invalide');
  return { email: locals.user.email };
}

export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user || !locals.supabase) redirect(303, '/login');
    const f = await request.formData();
    const problem = passwordProblem(String(f.get('password') ?? ''), String(f.get('confirm') ?? ''));
    if (problem) return fail(400, { message: problem });
    const { error } = await locals.supabase.auth.updateUser({ password: String(f.get('password')) });
    if (error) return fail(400, { message: 'Impossible d’enregistrer ce mot de passe. Essaie-en un autre.' });
    redirect(303, '/screening');
  }
};
