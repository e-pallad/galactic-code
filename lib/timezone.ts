// Streaks and daily logs are calendar-day based. Computing "today" in UTC
// breaks streaks for anyone whose evening crosses the UTC date line, so all
// day math goes through the user's IANA timezone (null -> UTC fallback).

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** YYYY-MM-DD for the given instant in the user's timezone. */
export function localDateString(tz: string | null | undefined, date: Date = new Date()): string {
  try {
    // en-CA locale formats as YYYY-MM-DD
    return date.toLocaleDateString("en-CA", { timeZone: tz ?? "UTC" })
  } catch {
    return date.toLocaleDateString("en-CA", { timeZone: "UTC" })
  }
}

/** Whole calendar days from one YYYY-MM-DD to another (positive if `to` is later). */
export function calendarDaysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)
}
