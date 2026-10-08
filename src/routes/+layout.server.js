export function load({ locals }) {
  return { userEmail: locals.user?.email ?? null };
}
