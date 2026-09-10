import { describe, expect, it } from 'vitest'
import { DEFAULT_SORT, firstClickDirection, sortTransactions } from '~/utils/sortTransactions'
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

const ids = (rows: readonly Transaction[]) => rows.map((row) => row.id)

describe('sortTransactions', () => {
  it('sorts amounts numerically, not as strings', () => {
    const rows = [
      makeTransaction({ id: 'a', amount: 9 }),
      makeTransaction({ id: 'b', amount: 100 }),
      makeTransaction({ id: 'c', amount: 25 })
    ]
    expect(ids(sortTransactions(rows, { field: 'amount', direction: 'asc' }))).toEqual(['a', 'c', 'b'])
    expect(ids(sortTransactions(rows, { field: 'amount', direction: 'desc' }))).toEqual(['b', 'c', 'a'])
  })

  it('sorts ISO dates chronologically in both directions', () => {
    const rows = [
      makeTransaction({ id: 'a', date: '2026-09-30' }),
      makeTransaction({ id: 'b', date: '2026-10-01' }),
      makeTransaction({ id: 'c', date: '2026-09-05' })
    ]
    expect(ids(sortTransactions(rows, { field: 'date', direction: 'asc' }))).toEqual(['c', 'a', 'b'])
    expect(ids(sortTransactions(rows, { field: 'date', direction: 'desc' }))).toEqual(['b', 'a', 'c'])
  })

  it('sorts billing months chronologically, not alphabetically by display name', () => {
    const rows = [
      makeTransaction({ id: 'a', billingMonth: '2026-11' }),
      makeTransaction({ id: 'b', billingMonth: '2026-09' }),
      makeTransaction({ id: 'c', billingMonth: '2027-01' })
    ]
    expect(ids(sortTransactions(rows, { field: 'billingMonth', direction: 'asc' }))).toEqual(['b', 'a', 'c'])
  })

  it('sorts text with pt-BR rules, so accents do not fall after Z', () => {
    const rows = [
      makeTransaction({ id: 'a', description: 'Zoológico' }),
      makeTransaction({ id: 'b', description: 'Água' }),
      makeTransaction({ id: 'c', description: 'Bar' })
    ]
    expect(ids(sortTransactions(rows, { field: 'description', direction: 'asc' }))).toEqual(['b', 'c', 'a'])
  })

  it('sorts text case-insensitively', () => {
    const rows = [
      makeTransaction({ id: 'a', description: 'banco' }),
      makeTransaction({ id: 'b', description: 'Almoço' })
    ]
    expect(ids(sortTransactions(rows, { field: 'description', direction: 'asc' }))).toEqual(['b', 'a'])
  })

  it('keeps blank values at the bottom in BOTH directions', () => {
    const rows = [
      makeTransaction({ id: 'blank', debtor: '' }),
      makeTransaction({ id: 'ana', debtor: 'Ana' }),
      makeTransaction({ id: 'zu', debtor: 'Zu' })
    ]
    expect(ids(sortTransactions(rows, { field: 'debtor', direction: 'asc' }))).toEqual(['ana', 'zu', 'blank'])
    expect(ids(sortTransactions(rows, { field: 'debtor', direction: 'desc' }))).toEqual(['zu', 'ana', 'blank'])
  })

  it('is stable: equal keys keep their previous relative order', () => {
    const rows = [
      makeTransaction({ id: 'first', amount: 10 }),
      makeTransaction({ id: 'second', amount: 10 }),
      makeTransaction({ id: 'third', amount: 10 })
    ]
    expect(ids(sortTransactions(rows, { field: 'amount', direction: 'asc' }))).toEqual(['first', 'second', 'third'])
  })

  it('does not mutate the array it was given', () => {
    const rows = [makeTransaction({ id: 'a', amount: 5 }), makeTransaction({ id: 'b', amount: 1 })]
    sortTransactions(rows, { field: 'amount', direction: 'asc' })
    expect(ids(rows)).toEqual(['a', 'b'])
  })
})

describe('firstClickDirection', () => {
  it('starts dates, amounts and billing months at descending', () => {
    expect(firstClickDirection('date')).toBe('desc')
    expect(firstClickDirection('amount')).toBe('desc')
    expect(firstClickDirection('billingMonth')).toBe('desc')
  })

  it('starts text columns at ascending', () => {
    expect(firstClickDirection('description')).toBe('asc')
    expect(firstClickDirection('category')).toBe('asc')
    expect(firstClickDirection('status')).toBe('asc')
  })
})

describe('DEFAULT_SORT', () => {
  it('is newest first', () => {
    expect(DEFAULT_SORT).toEqual({ field: 'date', direction: 'desc' })
  })
})
