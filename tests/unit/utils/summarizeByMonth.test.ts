import { describe, expect, it } from 'vitest'
import { summarizeByMonth } from '~/utils/summarizeByMonth'
import type { Transaction } from '~/types/transaction'

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    date: '2026-09-01',
    description: 'Mercado',
    category: 'Supermercado',
    account: 'Nubank Gabi',
    method: 'Crédito',
    amount: 100,
    type: 'Variável',
    installment: null,
    status: 'Pago',
    debtor: '',
    reimbursable: 'Não',
    billingMonth: '2026-09',
    ...overrides
  }
}

describe('summarizeByMonth — meses', () => {
  it('devolve todos os meses do intervalo, em ordem crescente', () => {
    const { months } = summarizeByMonth([], '2026-09', '2026-12')
    expect(months.map((m) => m.billingMonth)).toEqual(['2026-09', '2026-10', '2026-11', '2026-12'])
  })

  it('zera os meses sem lançamento em vez de omiti-los', () => {
    // Um gráfico que pula o mês vazio encosta agosto em novembro e
    // mente sobre a tendência.
    const { months } = summarizeByMonth(
      [makeTransaction({ billingMonth: '2026-09', amount: 50 }), makeTransaction({ billingMonth: '2026-11', amount: 70 })],
      '2026-09',
      '2026-11'
    )
    expect(months.map((m) => [m.billingMonth, m.count])).toEqual([
      ['2026-09', 1],
      ['2026-10', 0],
      ['2026-11', 1]
    ])
    expect(months[1]).toMatchObject({ income: 0, expenses: 0, balance: 0, pendingCount: 0 })
  })

  it('agrega por competência, NUNCA pela data da compra', () => {
    // Uma compra parcelada: uma única `date`, três competências. É o
    // caso que a tela existe para mostrar.
    const parcelas = [
      makeTransaction({ id: 'p1', date: '2026-09-25', billingMonth: '2026-09', amount: 300, installment: '1/3' }),
      makeTransaction({ id: 'p2', date: '2026-09-25', billingMonth: '2026-10', amount: 300, installment: '2/3' }),
      makeTransaction({ id: 'p3', date: '2026-09-25', billingMonth: '2026-11', amount: 300, installment: '3/3' })
    ]
    const { months } = summarizeByMonth(parcelas, '2026-09', '2026-11')
    expect(months.map((m) => m.expenses)).toEqual([300, 300, 300])
  })

  it('ignora lançamentos fora do intervalo', () => {
    const { months } = summarizeByMonth(
      [
        makeTransaction({ billingMonth: '2026-08', amount: 999 }),
        makeTransaction({ billingMonth: '2026-09', amount: 10 }),
        makeTransaction({ billingMonth: '2027-01', amount: 999 })
      ],
      '2026-09',
      '2026-09'
    )
    expect(months).toHaveLength(1)
    expect(months[0]?.expenses).toBe(10)
  })

  it('inclui as duas pontas do intervalo', () => {
    const { months } = summarizeByMonth(
      [
        makeTransaction({ billingMonth: '2026-09', amount: 1 }),
        makeTransaction({ billingMonth: '2026-11', amount: 2 })
      ],
      '2026-09',
      '2026-11'
    )
    expect(months[0]?.expenses).toBe(1)
    expect(months[2]?.expenses).toBe(2)
  })

  it('aplica por mês as mesmas regras de receita/despesa do resumo da lista', () => {
    const { months } = summarizeByMonth(
      [
        makeTransaction({ billingMonth: '2026-09', type: 'Receita', amount: 1000 }),
        makeTransaction({ billingMonth: '2026-09', type: 'Fixo', amount: 400 }),
        makeTransaction({ billingMonth: '2026-09', type: 'Variável', amount: 100, reimbursable: 'Sim' }),
        makeTransaction({ billingMonth: '2026-09', type: 'Investimento', amount: 50, status: 'Pendente' })
      ],
      '2026-09',
      '2026-09'
    )
    expect(months[0]).toMatchObject({
      income: 1000,
      expenses: 550,
      balance: 450,
      reimbursable: 100,
      pendingCount: 1,
      count: 4
    })
  })

  it('devolve lista vazia para intervalo invertido', () => {
    const { months } = summarizeByMonth([makeTransaction()], '2026-12', '2026-01')
    expect(months).toEqual([])
  })
})

describe('summarizeByMonth — por categoria', () => {
  it('soma o período inteiro, não mês a mês', () => {
    const { byCategory } = summarizeByMonth(
      [
        makeTransaction({ billingMonth: '2026-09', category: 'Casa', amount: 100 }),
        makeTransaction({ billingMonth: '2026-10', category: 'Casa', amount: 150 })
      ],
      '2026-09',
      '2026-10'
    )
    expect(byCategory).toEqual([{ category: 'Casa', expenses: 250, count: 2 }])
  })

  it('deixa receita de fora do ranking de gastos', () => {
    // Senão "Receita" — normalmente a maior soma da carteira — fica em
    // primeiro lugar num ranking de despesas.
    const { byCategory } = summarizeByMonth(
      [
        makeTransaction({ category: 'Receita', type: 'Receita', amount: 7000 }),
        makeTransaction({ category: 'Casa', type: 'Fixo', amount: 100 })
      ],
      '2026-09',
      '2026-09'
    )
    expect(byCategory.map((c) => c.category)).toEqual(['Casa'])
  })

  it('ordena da maior despesa para a menor', () => {
    const { byCategory } = summarizeByMonth(
      [
        makeTransaction({ category: 'Pet', amount: 50 }),
        makeTransaction({ category: 'Casa', amount: 500 }),
        makeTransaction({ category: 'Lazer', amount: 200 })
      ],
      '2026-09',
      '2026-09'
    )
    expect(byCategory.map((c) => c.category)).toEqual(['Casa', 'Lazer', 'Pet'])
  })

  it('desempata por nome, para a ordem não embaralhar entre renderizações', () => {
    const { byCategory } = summarizeByMonth(
      [
        makeTransaction({ category: 'Zoo', amount: 100 }),
        makeTransaction({ category: 'Casa', amount: 100 })
      ],
      '2026-09',
      '2026-09'
    )
    expect(byCategory.map((c) => c.category)).toEqual(['Casa', 'Zoo'])
  })

  it('conta quantos lançamentos cada categoria tem', () => {
    const { byCategory } = summarizeByMonth(
      [
        makeTransaction({ category: 'Casa', amount: 10 }),
        makeTransaction({ category: 'Casa', amount: 20 }),
        makeTransaction({ category: 'Pet', amount: 5 })
      ],
      '2026-09',
      '2026-09'
    )
    expect(byCategory).toEqual([
      { category: 'Casa', expenses: 30, count: 2 },
      { category: 'Pet', expenses: 5, count: 1 }
    ])
  })

  it('é vazio quando não há despesa no período', () => {
    const { byCategory } = summarizeByMonth([], '2026-09', '2026-12')
    expect(byCategory).toEqual([])
  })
})
