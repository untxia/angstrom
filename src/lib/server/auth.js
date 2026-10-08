/** Helpers d'authentification purs (testables sans réseau). */

/** N'autorise que les redirections internes : empêche /login?next=//evil.com ou https://evil.com. */
export function safeNext(next, fallback = '/screening') {
  return typeof next === 'string' && /^\/(?![/\\])/.test(next) ? next : fallback;
}

/** L'agent (écran et API) est réservé aux comptes connectés ; l'accueil et /login restent publics. */
export function isProtected(pathname) {
  return pathname === '/screening' || pathname.startsWith('/screening/') || pathname.startsWith('/material/') || pathname.startsWith('/api/');
}

export function isApi(pathname) {
  return pathname.startsWith('/api/');
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validEmail(v) {
  return typeof v === 'string' && v.length <= 254 && EMAIL.test(v.trim());
}

export const MIN_PASSWORD = 10;
export function passwordProblem(pw, confirm) {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD) return `Le mot de passe doit faire au moins ${MIN_PASSWORD} caractères.`;
  if (pw.length > 200) return 'Mot de passe trop long.';
  if (pw !== confirm) return 'Les deux mots de passe ne correspondent pas.';
  return '';
}

/** Types de liens e-mail Supabase acceptés par /auth/confirm. */
export const OTP_TYPES = ['invite', 'recovery', 'magiclink', 'email'];
