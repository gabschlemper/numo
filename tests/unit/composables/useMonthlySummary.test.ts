// Mesmo padrão dos outros: `useMonthlySummary` chama o auto-import
// `useSummaryRepository()` sem importá-lo, então cada teste troca
// esse global por um dublê da porta.
import { describe, expect, it, vi } from 'vitest'
import { defaultPeriod, MONTHS_AHEAD, MONTHS_BEHIND, useMonthlySummary } from '~/composables/useMonthlySummary'
import type { SummaryRepository } from '~/repositories/SummaryRepository'
import type { MonthlySummary, MonthlySummaryResult } from '~/types/summary'

function month(billingMonth: string, overrides: Partial<MonthlySummary> = {}): MonthlySummary {
  return {
    billingMonth,
    count: 0,
    income: 0,
    expenses: 0,
    balance: 0,
    reimbursable: 0,
    pendingCount: 0,
    ...overrides
  }
}

function stubRepository(result: MonthlySummaryResult = { months: [], byCategory: [] }): SummaryRepository {
  const repo: SummaryRepository = { monthly: vi.fn().mockResolvedValue(result) }
  vi.stubGlobal('useSummaryRepository', () => repo)
  return repo
}

describe('defaultPeriod', () => {
  it('olha para trás E para frente, com o mês atual no meio', () => {
    // Competência inclui parcelas já comprometidas: um padrão só
    // retrospectivo esconderia exatamente as despesas futuras que
    // ainda dá tempo de planejar.
    expect(defaultPeriod(new Date('2026-09-10T00:00:00'))).toEqual({ from: '2026-04', to: '2027-03' })
  })

  it('atravessa a virada de ano nas duas pontas', () => {
    expect(defaultPeriod(new Date('2026-01-15T00:00:00'))).toEqual({ from: '2025-08', to: '2026-07' })
  })

  it('cobre exatamente a janela declarada', () => {
    const { from, to } = defaultPeriod(new Date('2026-06-01T00:00:00'))
    const months = (value: string) => Number(value.slice(0, 4)) * 12 + Number(value.slice(5))
    expect(months(to) - months(from)).toBe(MONTHS_BEHIND + MONTHS_AHEAD)
  })
})

describe('useMonthlySummary', () => {
  it('começa vazio e sem erro', () => {
    stubRepository()
    const { result, loading, error } = useMonthlySummary()
    expect(result.value).toEqual({ months: [], byCategory: [] })
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('load() pede ao repositório exatamente o período atual', async () => {
    const repo = stubRepository()
    const { period, load } = useMonthlySummary()
    await load()
    expect(repo.monthly).toHaveBeenCalledWith({ from: period.value.from, to: period.value.to })
  })

  it('guarda o resultado agregado como veio, sem recalcular nada', async () => {
    const payload: MonthlySummaryResult = {
      months: [month('2026-09', { income: 100, expenses: 40, balance: 60, count: 2 })],
      byCategory: [{ category: 'Casa', expenses: 40, count: 1 }]
    }
    stubRepository(payload)
    const { result, load } = useMonthlySummary()
    await load()
    expect(result.value).toEqual(payload)
  })

  it('setPeriod() troca o período e recarrega numa única busca', async () => {
    // Um watch no período dispararia duas buscas quando o usuário
    // mexe nas duas pontas, e a segunda resposta poderia chegar
    // antes da primeira.
    const repo = stubRepository()
    const { period, setPeriod } = useMonthlySummary()
    await setPeriod({ from: '2026-01', to: '2026-03' })
    expect(period.value).toEqual({ from: '2026-01', to: '2026-03' })
    expect(repo.monthly).toHaveBeenCalledTimes(1)
    expect(repo.monthly).toHaveBeenCalledWith({ from: '2026-01', to: '2026-03' })
  })

  it('periodTotals soma o período inteiro', async () => {
    stubRepository({
      months: [
        month('2026-09', { income: 1000, expenses: 400, balance: 600, reimbursable: 50, pendingCount: 2, count: 5 }),
        month('2026-10', { income: 500, expenses: 300, balance: 200, reimbursable: 0, pendingCount: 1, count: 3 })
      ],
      byCategory: []
    })
    const { periodTotals, load } = useMonthlySummary()
    await load()
    expect(periodTotals.value).toEqual({
      income: 1500,
      expenses: 700,
      balance: 800,
      reimbursable: 50,
      pendingCount: 3,
      count: 8
    })
  })

  it('isEmpty distingue "nenhum lançamento" de "meses zerados"', async () => {
    // Doze meses zerados ainda são doze meses: o vazio é sobre não
    // haver lançamento nenhum, não sobre a lista de meses.
    stubRepository({ months: [month('2026-09'), month('2026-10')], byCategory: [] })
    const { isEmpty, load } = useMonthlySummary()
    await load()
    expect(isEmpty.value).toBe(true)
  })

  it('não é vazio quando existe pelo menos um lançamento', async () => {
    stubRepository({ months: [month('2026-09', { count: 1, income: 10, balance: 10 })], byCategory: [] })
    const { isEmpty, load } = useMonthlySummary()
    await load()
    expect(isEmpty.value).toBe(false)
  })

  it('registra o erro e relança, baixando o loading', async () => {
    vi.stubGlobal('useSummaryRepository', () => ({
      monthly: vi.fn().mockRejectedValue(new Error('rede caiu'))
    }))
    const { load, error, loading } = useMonthlySummary()
    await expect(load()).rejects.toThrow('rede caiu')
    expect(error.value).toBe('rede caiu')
    expect(loading.value).toBe(false)
  })
})
