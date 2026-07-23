import { NextResponse } from "next/server";
import { jsonApiError } from "@/lib/api-errors";
import {
  STORAGE_KEY_NAMES,
  type StateSnapshot,
  type StorageKeyName,
} from "@/lib/sync/keys";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The signed-in user's cloud copy of their practice state.
 *
 * GET returns their stored snapshot; PUT replaces it. Guests never reach these
 * handlers — the sync layer only calls them once a session exists — but both
 * still answer 401 rather than leaking or accepting anonymous data.
 */

/** Guards against a runaway client filling the table with oversized payloads. */
const MAX_SNAPSHOT_BYTES = 512 * 1024;

const VALID_KEYS = new Set<string>(STORAGE_KEY_NAMES);

export async function GET() {
  const context = await requireUser();

  if ("response" in context) {
    return context.response;
  }

  const { supabase, userId } = context;
  const { data, error } = await supabase
    .from("user_state")
    .select("key, value")
    .eq("user_id", userId);

  if (error) {
    return jsonApiError("Could not load your saved progress.", "SYNC_FAILED", 502);
  }

  const snapshot: StateSnapshot = {};

  for (const row of data ?? []) {
    if (VALID_KEYS.has(row.key)) {
      snapshot[row.key as StorageKeyName] = row.value;
    }
  }

  return NextResponse.json({ snapshot }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const context = await requireUser();

  if ("response" in context) {
    return context.response;
  }

  const { supabase, userId } = context;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonApiError("Malformed sync payload.", "INVALID_REQUEST", 400);
  }

  if (typeof body !== "object" || body === null || !("snapshot" in body)) {
    return jsonApiError("Missing snapshot.", "INVALID_REQUEST", 400);
  }

  const { snapshot } = body as { snapshot: unknown };

  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) {
    return jsonApiError("Snapshot must be an object.", "INVALID_REQUEST", 400);
  }

  // Unknown keys are dropped rather than rejected, so an older client syncing
  // against a newer schema still succeeds with the keys it does understand.
  const rows = Object.entries(snapshot as Record<string, unknown>)
    .filter(([key, value]) => VALID_KEYS.has(key) && value !== undefined)
    .map(([key, value]) => ({ user_id: userId, key, value }));

  if (rows.length === 0) {
    return NextResponse.json({ saved: 0 }, { headers: { "Cache-Control": "no-store" } });
  }

  if (JSON.stringify(rows).length > MAX_SNAPSHOT_BYTES) {
    return jsonApiError("Your progress is too large to sync.", "INVALID_REQUEST", 413);
  }

  const { error } = await supabase
    .from("user_state")
    .upsert(rows, { onConflict: "user_id,key" });

  if (error) {
    return jsonApiError("Could not save your progress.", "SYNC_FAILED", 502);
  }

  return NextResponse.json(
    { saved: rows.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}

async function requireUser() {
  if (!isSupabaseConfigured()) {
    return {
      response: jsonApiError("Cloud sync is not configured.", "SYNC_UNAVAILABLE", 503),
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      response: jsonApiError("Cloud sync is not configured.", "SYNC_UNAVAILABLE", 503),
    };
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      response: jsonApiError("Please sign in to sync your progress.", "NOT_AUTHENTICATED", 401),
    };
  }

  return { supabase, userId: data.user.id };
}
