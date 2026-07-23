/**
 * Supabase is optional, exactly like OpenAI and Langfuse: without credentials
 * the app runs guest-only on localStorage and no sign-in affordance appears.
 * Every auth/sync entry point checks this first.
 */

/** The browser needs these two, so they are the only NEXT_PUBLIC_ auth vars. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Where Google should send the user back to. Derived from the request when
 * possible so the same build works on localhost:3345, a Tailscale host, and
 * production without extra configuration.
 */
export function resolveAuthRedirectUrl(origin: string) {
  const configured = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  const base = configured || origin;
  return new URL("/auth/callback", base).toString();
}
