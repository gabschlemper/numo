// app/utils/formatCurrency.ts
//
// Single source of truth for how a monetary value is displayed.
// Components must call this instead of building `Intl.NumberFormat`
// (or, worse, string-concatenating "R$") at the call site.
const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

export function formatCurrency(amount: number): string {
  return BRL_FORMATTER.format(amount)
}

/**
 * Same formatting, plus an explicit "+" on income.
 *
 * The sign is redundant with the green colour the amount column uses
 * for income — deliberately so. Colour alone is the classic
 * accessibility failure in a financial table (roughly 1 in 12 men
 * can't separate the green from the default grey), and the "Tipo"
 * column that carries the same information textually is one of the
 * first to be hidden on narrow screens. Expenses get no "−": the
 * domain stores every `amount` as a positive number and the edit form
 * shows it that way, so inventing a minus here would contradict the
 * value the user is about to type back in.
 */
export function formatIncomeAwareCurrency(amount: number, income: boolean): string {
  const formatted = BRL_FORMATTER.format(amount)
  return income ? `+${formatted}` : formatted
}
