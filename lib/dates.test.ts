import { describe, expect, it } from "vitest";
import { formatReadableDate, getTodayKey } from "@/lib/dates";

describe("dates", () => {
  it("formats dates for display in the configured Indian English locale", () => {
    expect(formatReadableDate(new Date("2026-07-18T08:00:00.000Z"))).toBe("Sat, 18 Jul");
  });

  it("creates zero-padded local date keys", () => {
    expect(getTodayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
