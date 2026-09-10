// app/utils/formatDate.ts
//
// Single source of truth for date parsing/formatting. `Transaction.date`
// is always stored as an ISO string ("YYYY-MM-DD"); this is the only
// file allowed to know that, and the only file allowed to build a
// `Date` from it or format it for display.
const SHORT_FORMATTER = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const SHORT_WITH_YEAR_FORMATTER = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
const LONG_FORMATTER = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

/**
 * "05/09" for a date in the reference year, "01/12/25" otherwise.
 *
 * The year is conditional rather than always-on or always-off because
 * both extremes are wrong in the list: printing it on every row is
 * noise in the 95% case where everything is this year, but omitting
 * it entirely made 01/12/2025 and 01/12/2026 render identically —
 * which became a real hazard once the list could be sorted by date,
 * since two rows that look the same can now sit far apart.
 *
 * `reference` is a parameter (defaulting to today) purely so this
 * stays a pure function that tests can pin to a fixed year.
 */
export function formatShortDate(iso: string, reference: Date = new Date()): string {
  const date = toDate(iso)
  const formatter = date.getFullYear() === reference.getFullYear() ? SHORT_FORMATTER : SHORT_WITH_YEAR_FORMATTER
  return formatter.format(date)
}

export function formatLongDate(iso: string): string {
  return LONG_FORMATTER.format(toDate(iso))
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
