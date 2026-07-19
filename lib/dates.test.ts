import { describe, expect, it } from "vitest";
import { formatReadableDate, getTodayKey } from "@/lib/dates";

describe("dates", () => {
  it("formats dates for display in the configured Indian English locale", () => {
    expect(formatReadableDate(new Date("2026-07-18T08:00:00.000Z"))).toBe("Sat, 18 Jul");
  });

  it("creates zero-padded date keys in the application timezone", () => {
    expect(getTodayKey(new Date("2026-01-04T20:00:00.000Z"))).toBe("2026-01-05");
  });

  it("changes the date at midnight in India instead of midnight UTC", () => {
    expect(getTodayKey(new Date("2026-07-18T18:29:59.999Z"))).toBe("2026-07-18");
    expect(getTodayKey(new Date("2026-07-18T18:30:00.000Z"))).toBe("2026-07-19");
  });
});
