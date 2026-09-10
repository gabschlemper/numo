// app/types/summary.ts
//
// O modelo do Resumo mensal. Nada aqui sabe de Vue, HTTP ou mock —
// mesma separação de `types/transaction.ts`.
//
// A agregação é por `billingMonth` (competência), NUNCA por `date`.
// A diferença é o motivo de a tela existir: uma compra parcelada em
// 12x tem uma única `date` (o dia da compra) e doze competências. Um
// resumo por `date` jogaria as doze parcelas no mês da compra e
// mostraria zero nos onze meses em que as faturas realmente caem —
// que é justamente o que o usuário abre esta tela para ver.
import type { TransactionsSummary } from '~/utils/summarizeTransactions'

/** Os mesmos números de `summarizeTransactions`, recortados por mês de competência. */
export interface MonthlySummary extends TransactionsSummary {
  billingMonth: string
}

export interface CategorySummary {
  category: string
  /** Só despesas. Ver `summarizeByMonth` para por que receita não entra. */
  expenses: number
  count: number
}

export interface MonthlySummaryResult {
  /** Crescente e SEM buracos: mês sem lançamento vem zerado, não sumido. */
  months: MonthlySummary[]
  /** O período inteiro, não por mês. Ordenado da maior despesa para a menor. */
  byCategory: CategorySummary[]
}

export interface MonthlySummaryQuery {
  /** "YYYY-MM", inclusivo. */
  from: string
  /** "YYYY-MM", inclusivo. */
  to: string
}
