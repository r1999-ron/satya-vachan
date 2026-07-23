"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, resolveAuthRedirectUrl } from "@/lib/supabase/config";
import type { AppUser, AuthMode } from "@/lib/auth/types";

type AuthContextValue = {
  /** False when no Supabase credentials are set: guest-only build. */
  isConfigured: boolean;
  mode: AuthMode;
  user: AppUser | null;
  /** Last sign-in failure, surfaced inline rather than thrown. */
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  dismissError: () => void;
};

const GUEST_CONTEXT: AuthContextValue = {
  isConfigured: false,
  mode: "guest",
  user: null,
  error: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  dismissError: () => {},
};

const AuthContext = createContext<AuthContextValue>(GUEST_CONTEXT);

function toAppUser(user: User): AppUser {
  const metadata = user.user_metadata ?? {};
  const displayName =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    user.email?.split("@")[0] ||
    "Friend";

  return {
    id: user.id,
    email: user.email ?? null,
    displayName,
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  // Unconfigured builds never leave guest mode, so they skip the loading state
  // entirely and render exactly as the app did before auth existed.
  const [mode, setMode] = useState<AuthMode>(configured ? "loading" : "guest");
  const [user, setUser] = useState<AppUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      // Deferred so the state update does not cascade a render synchronously
      // from the effect body, matching the queueMicrotask pattern in storage.ts.
      queueMicrotask(() => setMode("guest"));
      return;
    }

    let isActive = true;

    const applyUser = (nextUser: User | null) => {
      if (!isActive) {
        return;
      }

      setUser(nextUser ? toAppUser(nextUser) : null);
      setMode(nextUser ? "signed-in" : "guest");
    };

    supabase.auth
      .getUser()
      .then(({ data }) => applyUser(data.user ?? null))
      .catch(() => {
        // Treat an unreachable auth service as "browsing as a guest" rather
        // than blocking the app behind a permanent loading state.
        if (isActive) {
          setMode("guest");
        }
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => {
      isActive = false;
      subscription.subscription.unsubscribe();
    };
  }, [configured]);

  // The OAuth callback reports failures through the query string; surface them
  // once and then clean the URL so a refresh does not resurrect the message.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const authError = params.get("authError");

    if (!authError && !params.has("signedIn")) {
      return;
    }

    if (authError) {
      queueMicrotask(() => setError(authError));
    }

    params.delete("authError");
    params.delete("signedIn");

    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError("Sign-in is not configured for this deployment.");
      return;
    }

    setError(null);

    const next = `${window.location.pathname}${window.location.search}`;
    const redirectTo = new URL(resolveAuthRedirectUrl(window.location.origin));
    redirectTo.searchParams.set("next", next);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo.toString(),
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (signInError) {
      setError(signInError.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    // Local progress deliberately stays in localStorage after signing out, so
    // the user keeps practising as a guest with the words they already have.
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    setUser(null);
    setMode("guest");
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: configured,
      mode,
      user,
      error,
      signInWithGoogle,
      signOut,
      dismissError,
    }),
    [configured, dismissError, error, mode, signInWithGoogle, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
