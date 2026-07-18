import { NextResponse } from "next/server";
import type { ApiErrorPayload } from "@/lib/api-errors";

type AiRoute = "challenge" | "transcribe" | "transform" | "tts";

type TokenBucket = {
  lastRefillAt: number;
  lastSeenAt: number;
  tokens: number;
};

type AiGuardGlobal = typeof globalThis & {
  __satyaVachanAiTokenBuckets?: Map<string, TokenBucket>;
};

const BUCKET_CAPACITY = 20;
const REFILL_PER_MINUTE = 10;
const MAX_BUCKETS = 5_000;
const STALE_BUCKET_MS = 30 * 60 * 1_000;
const ROUTE_COST: Record<AiRoute, number> = {
  challenge: 1,
  transform: 2,
  transcribe: 3,
  tts: 4,
};

const guardGlobal = globalThis as AiGuardGlobal;
const tokenBuckets =
  guardGlobal.__satyaVachanAiTokenBuckets ?? new Map<string, TokenBucket>();
guardGlobal.__satyaVachanAiTokenBuckets = tokenBuckets;
let requestsSinceCleanup = 0;

export function guardAiRequest(request: Request, route: AiRoute) {
  if (!isSameOrigin(request)) {
    return errorResponse(
      "This request must come from the Satya-Vachan app.",
      "FORBIDDEN_ORIGIN",
      403,
    );
  }

  const rateLimit = consumeTokens(getClientIp(request), ROUTE_COST[route]);

  if (!rateLimit.allowed) {
    return errorResponse(
      "Too many AI requests. Please wait a moment and try again.",
      "RATE_LIMITED",
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  return null;
}

function isSameOrigin(request: Request) {
  const originHeader = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!originHeader || (fetchSite && fetchSite !== "same-origin")) {
    return false;
  }

  let origin: URL;

  try {
    origin = new URL(originHeader);
  } catch {
    return false;
  }

  if (origin.protocol !== "http:" && origin.protocol !== "https:") {
    return false;
  }

  const allowedHosts = new Set<string>();
  addHost(allowedHosts, new URL(request.url).host);
  addHost(allowedHosts, request.headers.get("host"));

  if (process.env.APP_ORIGIN) {
    try {
      addHost(allowedHosts, new URL(process.env.APP_ORIGIN).host);
    } catch {
      // Ignore a malformed optional deployment override.
    }
  }

  return allowedHosts.has(origin.host.toLocaleLowerCase());
}

function addHost(hosts: Set<string>, value: string | null) {
  const host = value?.split(",")[0]?.trim().toLocaleLowerCase();

  if (host) {
    hosts.add(host);
  }
}

function getClientIp(request: Request) {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for");

  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function consumeTokens(ip: string, cost: number) {
  const now = Date.now();
  requestsSinceCleanup += 1;

  if (requestsSinceCleanup >= 100 || tokenBuckets.size >= MAX_BUCKETS) {
    cleanupBuckets(now);
    requestsSinceCleanup = 0;
  }

  const previous = tokenBuckets.get(ip) ?? {
    lastRefillAt: now,
    lastSeenAt: now,
    tokens: BUCKET_CAPACITY,
  };
  const refill =
    ((now - previous.lastRefillAt) / 60_000) * REFILL_PER_MINUTE;
  const tokens = Math.min(BUCKET_CAPACITY, previous.tokens + refill);

  if (tokens < cost) {
    tokenBuckets.set(ip, {
      lastRefillAt: now,
      lastSeenAt: now,
      tokens,
    });
    return {
      allowed: false as const,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil(((cost - tokens) / REFILL_PER_MINUTE) * 60),
      ),
    };
  }

  tokenBuckets.set(ip, {
    lastRefillAt: now,
    lastSeenAt: now,
    tokens: tokens - cost,
  });
  return { allowed: true as const };
}

function cleanupBuckets(now: number) {
  for (const [ip, bucket] of tokenBuckets) {
    if (now - bucket.lastSeenAt > STALE_BUCKET_MS) {
      tokenBuckets.delete(ip);
    }
  }

  if (tokenBuckets.size < MAX_BUCKETS) {
    return;
  }

  const oldestBuckets = [...tokenBuckets.entries()]
    .sort(([, left], [, right]) => left.lastSeenAt - right.lastSeenAt)
    .slice(0, tokenBuckets.size - MAX_BUCKETS + 1);

  for (const [ip] of oldestBuckets) {
    tokenBuckets.delete(ip);
  }
}

function errorResponse(
  error: string,
  code: ApiErrorPayload["code"],
  status: number,
  headers?: HeadersInit,
) {
  const payload: ApiErrorPayload = { error, code };
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}
