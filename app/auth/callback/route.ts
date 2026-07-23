import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Google redirects here after consent. Exchanges the one-time code for a
 * session cookie and returns the user to wherever they started.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = sanitizeNext(url.searchParams.get("next"));
  const oauthError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (oauthError) {
    return redirectTo(url, next, { authError: oauthError });
  }

  if (!code) {
    return redirectTo(url, next, { authError: "Missing sign-in code." });
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return redirectTo(url, next, { authError: "Sign-in is not configured." });
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectTo(url, next, { authError: error.message });
  }

  return redirectTo(url, next, { signedIn: "1" });
}

/**
 * Only same-site paths are accepted, so a crafted `next` cannot turn the
 * callback into an open redirect.
 */
function sanitizeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function redirectTo(requestUrl: URL, next: string, params: Record<string, string>) {
  const destination = new URL(next, requestUrl.origin);

  for (const [key, value] of Object.entries(params)) {
    destination.searchParams.set(key, value);
  }

  return NextResponse.redirect(destination);
}
