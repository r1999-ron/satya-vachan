/** How the current visitor is using the app. */
export type AuthMode = "loading" | "guest" | "signed-in";

/** The subset of the Supabase user the UI actually renders. */
export type AppUser = {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
};

/** Where the cloud mirror stands for a signed-in user. */
export type SyncStatus = "idle" | "syncing" | "synced" | "error";
