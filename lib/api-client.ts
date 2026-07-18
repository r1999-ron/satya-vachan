"use client";

import type { ApiErrorPayload } from "@/lib/api-errors";

type JsonRequestOptions<T> = Omit<RequestInit, "body"> & {
  body?: RequestInit["body"] | Record<string, unknown>;
  fallbackMessage: string;
  timeoutMs?: number;
  validate?: (value: unknown) => T | null;
};

const DEFAULT_TIMEOUT_MS = 18_000;

export class ApiRequestError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "ApiRequestError";
    this.code = options?.code;
    this.status = options?.status;
  }
}

export async function requestJson<T>(
  url: string,
  {
    body,
    fallbackMessage,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    validate,
    ...init
  }: JsonRequestOptions<T>,
): Promise<T> {
  const controller = new AbortController();
  const externalSignal = init.signal;
  let abortCause: "external" | "timeout" | null = externalSignal?.aborted
    ? "external"
    : null;
  const abortFromExternal = () => {
    if (!controller.signal.aborted) {
      abortCause = "external";
      controller.abort();
    }
  };
  const timeout = window.setTimeout(() => {
    if (!controller.signal.aborted) {
      abortCause = "timeout";
      controller.abort();
    }
  }, timeoutMs);
  const requestInit: RequestInit = {
    ...init,
    headers,
    signal: controller.signal,
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", abortFromExternal, { once: true });
    }
  }

  if (body !== undefined) {
    if (body instanceof FormData || body instanceof Blob || typeof body === "string") {
      requestInit.body = body;
    } else {
      requestInit.body = JSON.stringify(body);
      requestInit.headers = {
        "Content-Type": "application/json",
        ...headers,
      };
    }
  }

  try {
    const response = await fetch(url, requestInit);
    const payload = await readJsonSafely(response);

    if (!response.ok) {
      const errorPayload = getApiErrorPayload(payload);
      throw new ApiRequestError(
        getClientSafeErrorMessage(errorPayload) ?? fallbackMessage,
        {
          code: errorPayload?.code,
          status: response.status,
        },
      );
    }

    if (validate) {
      const normalized = validate(payload);

      if (!normalized) {
        throw new ApiRequestError(
          "The service returned a response this app could not read safely. Please retry.",
          { status: response.status },
        );
      }

      return normalized;
    }

    return payload as T;
  } catch (caughtError) {
    if (controller.signal.aborted) {
      if (abortCause === "external") {
        throw new ApiRequestError("The request was cancelled.", {
          code: "ABORTED",
        });
      }

      throw new ApiRequestError(
        "This is taking longer than expected. Please retry in a moment.",
        { code: "TIMEOUT" },
      );
    }

    if (caughtError instanceof ApiRequestError) {
      throw caughtError;
    }

    throw new ApiRequestError(
      typeof navigator !== "undefined" && navigator.onLine === false
        ? "You appear to be offline. Reconnect, then retry this step."
        : fallbackMessage,
    );
  } finally {
    externalSignal?.removeEventListener("abort", abortFromExternal);
    window.clearTimeout(timeout);
  }
}

export function isApiRequestErrorCode(error: unknown, code: string) {
  return error instanceof ApiRequestError && error.code === code;
}

async function readJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getApiErrorPayload(value: unknown): ApiErrorPayload | null {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { error?: unknown }).error === "string" &&
    typeof (value as { code?: unknown }).code === "string"
  ) {
    return value as ApiErrorPayload;
  }

  return null;
}

function getClientSafeErrorMessage(payload: ApiErrorPayload | null) {
  if (!payload) {
    return null;
  }

  if (payload.code === "MISSING_API_KEY") {
    return "AI service is unavailable right now. Static screens, typed practice, saved words, and local progress still work.";
  }

  return payload.error;
}
