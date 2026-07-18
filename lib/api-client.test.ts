import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "@/lib/api-client";

function installWindow() {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      clearTimeout,
      setTimeout,
    },
  });
}

function installAbortableFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      }),
    ),
  );
}

describe("requestJson abort handling", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(globalThis, "window");
  });

  it("distinguishes an external cancellation from a timeout", async () => {
    installWindow();
    installAbortableFetch();
    const controller = new AbortController();
    const request = requestJson("/api/test", {
      fallbackMessage: "failed",
      signal: controller.signal,
    });

    controller.abort();

    await expect(request).rejects.toMatchObject({ code: "ABORTED" });
  });

  it("labels the internal deadline as a timeout", async () => {
    vi.useFakeTimers();
    installWindow();
    installAbortableFetch();
    const request = requestJson("/api/test", {
      fallbackMessage: "failed",
      timeoutMs: 100,
    });
    const assertion = expect(request).rejects.toMatchObject({ code: "TIMEOUT" });

    await vi.advanceTimersByTimeAsync(100);

    await assertion;
  });
});
