import { describe, expect, it } from 'vitest'
import { isIncome, summarizeTransactions } from '~/utils/summarizeTransactions'
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

describe('isIncome', () => {
  it('is true only for the Receita type', () => {
    expect(isIncome(makeTransaction({ type: 'Receita' }))).toBe(true)
    expect(isIncome(makeTransaction({ type: 'Fixo' }))).toBe(false)
    expect(isIncome(makeTransaction({ type: 'Variável' }))).toBe(false)
    expect(isIncome(makeTransaction({ type: 'Investimento' }))).toBe(false)
  })
})

describe('summarizeTransactions', () => {
  it('returns all zeros for an empty list', () => {
    expect(summarizeTransactions([])).toEqual({
      count: 0,
      income: 0,
      expenses: 0,
      balance: 0,
      reimbursable: 0,
      pendingCount: 0
    })
  })

  it('splits income from expenses by type, never by sign', () => {
    const summary = summarizeTransactions([
      makeTransaction({ type: 'Receita', amount: 1000 }),
      makeTransaction({ type: 'Fixo', amount: 400 }),
      makeTransaction({ type: 'Variável', amount: 150 }),
      makeTransaction({ type: 'Investimento', amount: 50 })
    ])
    expect(summary.income).toBe(1000)
    expect(summary.expenses).toBe(600)
    expect(summary.balance).toBe(400)
    expect(summary.count).toBe(4)
  })

  it('reports a negative balance when expenses outrun income', () => {
    const summary = summarizeTransactions([
      makeTransaction({ type: 'Receita', amount: 100 }),
      makeTransaction({ type: 'Fixo', amount: 250 })
    ])
    expect(summary.balance).toBe(-150)
  })

  it('counts reimbursable expenses separately without removing them from the expense total', () => {
    const summary = summarizeTransactions([
      makeTransaction({ type: 'Variável', amount: 80, reimbursable: 'Sim' }),
      makeTransaction({ type: 'Variável', amount: 20, reimbursable: 'Não' })
    ])
    expect(summary.expenses).toBe(100)
    expect(summary.reimbursable).toBe(80)
  })

  it('never counts income as reimbursable, even when flagged', () => {
    const summary = summarizeTransactions([makeTransaction({ type: 'Receita', amount: 500, reimbursable: 'Sim' })])
    expect(summary.reimbursable).toBe(0)
    expect(summary.income).toBe(500)
  })

  it('counts pending transactions regardless of type', () => {
    const summary = summarizeTransactions([
      makeTransaction({ status: 'Pendente' }),
      makeTransaction({ status: 'Pendente', type: 'Receita' }),
      makeTransaction({ status: 'Pago' })
    ])
    expect(summary.pendingCount).toBe(2)
  })

  it('ignores debtor entirely — owing someone does not change the totals', () => {
    const withDebtor = summarizeTransactions([makeTransaction({ amount: 100, debtor: 'Ana' })])
    const withoutDebtor = summarizeTransactions([makeTransaction({ amount: 100, debtor: '' })])
    expect(withDebtor).toEqual(withoutDebtor)
  })
})
