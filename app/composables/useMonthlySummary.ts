// app/composables/useMonthlySummary.ts
//
// Estado do Resumo mensal: o período escolhido e o resultado
// agregado. Não calcula nada — a agregação é do repositório (hoje
// mock, amanhã servidor). Mesma divisão de `useTransactions`.
//
// O PERÍODO PADRÃO é a decisão de produto deste arquivo, e não é
// "os últimos 12 meses".
//
// `billingMonth` é competência: uma compra parcelada em 12x já tem
// faturas marcadas para os próximos onze meses. Um padrão olhando
// só para trás esconderia exatamente essas parcelas — as únicas
// despesas que ainda dá tempo de planejar. Então a janela é
// assimétrica de propósito: cinco meses para trás (o que aconteceu)
// e seis para frente (o que já está comprometido), com o mês atual
// no meio.
import type { MonthlySummaryQuery, MonthlySummaryResult } from '~/types/summary'
import { addMonths, currentBillingMonth } from '~/utils/billingMonth'

export const MONTHS_BEHIND = 5
export const MONTHS_AHEAD = 6

export function defaultPeriod(reference: Date = new Date()): MonthlySummaryQuery {
  const current = currentBillingMonth(reference)
  return { from: addMonths(current, -MONTHS_BEHIND), to: addMonths(current, MONTHS_AHEAD) }
}

function emptyResult(): MonthlySummaryResult {
  return { months: [], byCategory: [] }
}

export function useMonthlySummary() {
  const repository = useSummaryRepository()

  const period = useState<MonthlySummaryQuery>('numo-summary-period', () => defaultPeriod())
  const result = useState<MonthlySummaryResult>('numo-summary-result', emptyResult)
  const loading = useState<boolean>('numo-summary-loading', () => false)
  const error = useState<string | null>('numo-summary-error', () => null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      result.value = await repository.monthly(period.value)
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : 'Não foi possível carregar o resumo.'
      throw reason
    } finally {
      loading.value = false
    }
  }

  /**
   * Troca o período e recarrega numa operação só.
   *
   * Um `watch` no período faria o mesmo, mas dispararia duas buscas
   * quando o usuário mexe nas duas pontas — e a segunda resposta
   * poderia chegar antes da primeira. Uma função explícita mantém
   * "uma escolha, uma busca".
   */
  async function setPeriod(next: MonthlySummaryQuery): Promise<void> {
    period.value = next
    await load()
  }

  /** Totais do período inteiro, para o cabeçalho não obrigar a somar as colunas de cabeça. */
  const periodTotals = computed(() =>
    result.value.months.reduce(
      (totals, month) => ({
        income: totals.income + month.income,
        expenses: totals.expenses + month.expenses,
        balance: totals.balance + month.balance,
        reimbursable: totals.reimbursable + month.reimbursable,
        pendingCount: totals.pendingCount + month.pendingCount,
        count: totals.count + month.count
      }),
      { income: 0, expenses: 0, balance: 0, reimbursable: 0, pendingCount: 0, count: 0 }
    )
  )

  /** Nenhum lançamento no período — diferente de "ainda carregando". */
  const isEmpty = computed(() => !loading.value && periodTotals.value.count === 0)

  return {
    period: readonly(period),
    result: readonly(result),
    loading: readonly(loading),
    error: readonly(error),
    periodTotals,
    isEmpty,
    load,
    setPeriod
  }
}
