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
