// app/utils/billingMonth.ts
//
// Single source of truth for the "billing month" (competência) value.
// It is deliberately represented as "YYYY-MM" (e.g. "2026-11") — a
// plain year-month string, never a full date. The real spreadsheet
// this app replaces suffered three separate historical bugs from that
// exact column silently turning into a Date (breaking downstream
// automation) — keeping it string-typed and month-only here is what
// makes that class of bug structurally impossible, not just avoided by
// convention.
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })

/** Derives the billing month (YYYY-MM) from a full ISO date (YYYY-MM-DD). */
export function billingMonthFromDate(dateIso: string): string {
  return dateIso.slice(0, 7)
}

/** "2026-11" → the spreadsheet's own display convention: "Nov/2026". */
export function formatBillingMonth(monthYear: string): string {
  const [year, month] = monthYear.split('-').map(Number)
  if (!year || !month) return monthYear
  const date = new Date(year, month - 1, 1)
  const parts = MONTH_YEAR_FORMATTER.formatToParts(date)
  const monthName = parts.find((part) => part.type === 'month')?.value ?? ''
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1).replace('.', '')
  return `${capitalized}/${year}`
}
