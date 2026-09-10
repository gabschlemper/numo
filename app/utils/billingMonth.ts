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

/** O mês de competência corrente ("2026-09"). `reference` existe para os testes fixarem "hoje". */
export function currentBillingMonth(reference: Date = new Date()): string {
  const month = String(reference.getMonth() + 1).padStart(2, '0')
  return `${reference.getFullYear()}-${month}`
}

/**
 * Soma (ou subtrai) meses a um "YYYY-MM".
 *
 * Feito com aritmética inteira sobre ano/mês, e não com
 * `Date.setMonth`, de propósito: `setMonth` opera sobre uma data que
 * tem DIA, e somar 1 mês a 31/01 devolve 03/03. Como aqui o valor
 * nunca tem dia, o bug não teria como aparecer nos testes e
 * apareceria só nos meses de 31 dias, em produção — que é exatamente
 * a classe de bug que este arquivo existe para tornar impossível.
 */
export function addMonths(monthYear: string, amount: number): string {
  const [year, month] = monthYear.split('-').map(Number)
  if (!year || !month) return monthYear

  const zeroBased = year * 12 + (month - 1) + amount
  const nextYear = Math.floor(zeroBased / 12)
  const nextMonth = String((zeroBased % 12) + 1).padStart(2, '0')
  return `${nextYear}-${nextMonth}`
}

/**
 * Todos os meses de `from` até `to`, inclusive — inclusive os que não
 * têm lançamento nenhum.
 *
 * O preenchimento dos buracos é o ponto: um gráfico ou uma tabela que
 * pula os meses vazios mente sobre a tendência, porque encosta
 * dezembro em março como se fossem consecutivos.
 *
 * Intervalo invertido (`from` > `to`) devolve lista vazia em vez de
 * entrar em laço infinito.
 */
export function monthsBetween(from: string, to: string): string[] {
  if (from > to) return []

  const months: string[] = []
  let cursor = from
  // Limite defensivo: 1200 meses = 100 anos. Sem ele, um `from`
  // malformado (que `addMonths` devolve inalterado) prenderia a aba.
  while (cursor <= to && months.length < 1200) {
    months.push(cursor)
    const next = addMonths(cursor, 1)
    if (next === cursor) break
    cursor = next
  }
  return months
}
