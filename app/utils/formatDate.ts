// app/utils/formatDate.ts
//
// Single source of truth for date parsing/formatting. `Transaction.date`
// is always stored as an ISO string ("YYYY-MM-DD"); this is the only
// file allowed to know that, and the only file allowed to build a
// `Date` from it or format it for display.
const SHORT_FORMATTER = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const LONG_FORMATTER = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

export function formatShortDate(iso: string): string {
  return SHORT_FORMATTER.format(toDate(iso))
}

export function formatLongDate(iso: string): string {
  return LONG_FORMATTER.format(toDate(iso))
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
