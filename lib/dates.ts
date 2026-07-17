export function formatReadableDate(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function getTodayKey(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());

  return `${year}-${month}-${day}`;
}
