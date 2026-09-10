// app/utils/summarizeByMonth.ts
//
// Função pura, mesma razão de `filterTransactions` e
// `summarizeTransactions`: agregar é regra de negócio, e regra de
// negócio pura é a coisa mais barata do projeto de testar.
//
// Ela reusa `summarizeTransactions` para calcular cada mês em vez de
// somar de novo aqui. Isso não é economia de linhas — é a garantia de
// que "Receita é a única entrada", "reembolsável continua contando
// como despesa" e "devedor não afeta número nenhum" valem igual no
// resumo do topo da lista e nesta tela. Duas somas separadas
// divergiriam na primeira regra que mudasse.
import type { Transaction } from '~/types/transaction'
import type { CategorySummary, MonthlySummary, MonthlySummaryResult } from '~/types/summary'
import { isIncome, summarizeTransactions } from './summarizeTransactions'
import { monthsBetween } from './billingMonth'

function withinRange(transaction: Transaction, from: string, to: string): boolean {
  // `billingMonth` é "YYYY-MM", então comparação lexicográfica já é
  // comparação cronológica — sem parse de data e sem fuso.
  return transaction.billingMonth >= from && transaction.billingMonth <= to
}

/**
 * Ranking de despesas por categoria no período inteiro.
 *
 * Receita fica de fora de propósito: num ranking de gastos, a
 * categoria "Receita" (que costuma ser a maior soma da carteira)
 * apareceria em primeiro lugar e empurraria todos os gastos reais
 * para baixo — respondendo uma pergunta que ninguém fez.
 */
function summarizeByCategory(transactions: readonly Transaction[]): CategorySummary[] {
  const totals = new Map<string, CategorySummary>()

  for (const transaction of transactions) {
    if (isIncome(transaction)) continue

    const current = totals.get(transaction.category)
    if (current) {
      current.expenses += transaction.amount
      current.count += 1
    } else {
      totals.set(transaction.category, {
        category: transaction.category,
        expenses: transaction.amount,
        count: 1
      })
    }
  }

  // Desempate por nome para a ordem ser determinística quando duas
  // categorias somam o mesmo — senão a lista embaralha entre
  // renderizações e o usuário acha que o dado mudou.
  return [...totals.values()].sort(
    (a, b) => b.expenses - a.expenses || a.category.localeCompare(b.category, 'pt-BR')
  )
}

export function summarizeByMonth(
  transactions: readonly Transaction[],
  from: string,
  to: string
): MonthlySummaryResult {
  const inRange = transactions.filter((transaction) => withinRange(transaction, from, to))

  const byMonth = new Map<string, Transaction[]>()
  for (const transaction of inRange) {
    const bucket = byMonth.get(transaction.billingMonth)
    if (bucket) bucket.push(transaction)
    else byMonth.set(transaction.billingMonth, [transaction])
  }

  // Percorre o intervalo pedido, não as chaves do Map: é isso que
  // preenche os meses vazios com zero em vez de omiti-los.
  const months: MonthlySummary[] = monthsBetween(from, to).map((billingMonth) => ({
    billingMonth,
    ...summarizeTransactions(byMonth.get(billingMonth) ?? [])
  }))

  return { months, byCategory: summarizeByCategory(inRange) }
}
