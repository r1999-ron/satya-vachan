export const APP_TIME_ZONE = "Asia/Kolkata";

const dateKeyFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatReadableDate(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function getTodayKey(date: Date = new Date()) {
  const parts = dateKeyFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to create the application date key.");
  }

  return `${year}-${month}-${day}`;
}

export function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  // Noon in Asia/Kolkata (UTC+5:30, no DST), so the key survives a round trip
  // through getTodayKey for viewers in any time zone.
  return new Date(Date.UTC(year, month - 1, day, 6, 30));
}

export function shiftDateKey(dateKey: string, amount: number) {
  const shifted = new Date(dateFromKey(dateKey).getTime() + amount * 86_400_000);
  return getTodayKey(shifted);
}

/** "YYYY-MM" slice of a date key, the granularity the monthly recap works at. */
export function getMonthKey(dateKey: string = getTodayKey()) {
  return dateKey.slice(0, 7);
}

/** The previous calendar month's key, e.g. "2026-07" → "2026-06". */
export function getPreviousMonthKey(monthKey: string = getMonthKey()) {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 2, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthName(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 15)));
}
