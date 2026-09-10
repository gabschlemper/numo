import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTransactionSummary } from '~/composables/useTransactionSummary'
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

describe('useTransactionSummary', () => {
  it('summarizes the list it is given', () => {
    const rows = ref<Transaction[]>([
      makeTransaction({ type: 'Receita', amount: 500 }),
      makeTransaction({ type: 'Fixo', amount: 200 })
    ])
    const { summary } = useTransactionSummary(rows)
    expect(summary.value.income).toBe(500)
    expect(summary.value.expenses).toBe(200)
    expect(summary.value.balance).toBe(300)
  })

  it('recomputes when the list changes — the numbers follow the filter', () => {
    const rows = ref<Transaction[]>([makeTransaction({ type: 'Receita', amount: 500 })])
    const { summary } = useTransactionSummary(rows)
    expect(summary.value.count).toBe(1)
    rows.value = []
    expect(summary.value).toEqual({
      count: 0,
      income: 0,
      expenses: 0,
      balance: 0,
      reimbursable: 0,
      pendingCount: 0
    })
  })
})
