import { createServerClient } from '@supabase/ssr';
import { json, redirect } from '@sveltejs/kit';
import { env as pub } from '$env/dynamic/public';
import { env } from '$env/dynamic/private';
import { isApi, isProtected } from '$lib/server/auth.js';

/** Session Supabase lue depuis les cookies ; l'agent n'est accessible qu'aux comptes connectés. */
export async function handle({ event, resolve }) {
  const url = pub.PUBLIC_SUPABASE_URL;
  const key = pub.PUBLIC_SUPABASE_ANON_KEY;
  const extraHeaders = {};

  event.locals.authDisabled = env.AUTH_DISABLED === 'true'; // uniquement pour le développement local
  event.locals.authConfigured = Boolean(url && key);
  event.locals.supabase = null;
  event.locals.user = null;

  if (event.locals.authConfigured) {
    event.locals.supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (list, headers) => {
          for (const { name, value, options } of list) {
            event.cookies.set(name, value, { ...options, path: '/', httpOnly: true, sameSite: 'lax', secure: event.url.protocol === 'https:' });
          }
          Object.assign(extraHeaders, headers);
        }
      }
    });
    // getUser() valide le jeton auprès de Supabase : on ne fait confiance qu'à lui, jamais au cookie seul.
    if (event.cookies.getAll().some((c) => c.name.startsWith('sb-'))) {
      const { data } = await event.locals.supabase.auth.getUser();
      event.locals.user = data?.user ?? null;
    }
  }

  const { pathname } = event.url;
  if (isProtected(pathname) && !event.locals.authDisabled && !event.locals.user) {
    if (isApi(pathname)) return json({ error: 'Connexion requise.' }, { status: 401 });
    redirect(303, `/login?next=${encodeURIComponent(pathname + event.url.search)}`);
  }

  const response = await resolve(event, {
    filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
  });
  for (const [k, v] of Object.entries(extraHeaders)) response.headers.set(k, v);
  return response;
}
