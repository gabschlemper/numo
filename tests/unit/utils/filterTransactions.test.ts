import { describe, expect, it } from 'vitest'
import { filterTransactions } from '~/utils/filterTransactions'
import { createEmptyFilters } from '~/types/filters'
import type { Transaction } from '~/types/transaction'

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    date: '2026-09-01',
    description: 'Posto Ipiranga',
    category: 'Transporte',
    account: 'Nubank Gabi',
    method: 'Crédito',
    amount: 100,
    type: 'Variável',
    installment: null,
    status: 'Pendente',
    debtor: '',
    reimbursable: 'Não',
    billingMonth: '2026-09',
    ...overrides
  }
}

describe('filterTransactions', () => {
  it('returns every transaction when filters are empty', () => {
    const transactions = [makeTransaction(), makeTransaction({ id: 'txn-2' })]
    expect(filterTransactions(transactions, createEmptyFilters())).toHaveLength(2)
  })

  it('filters by case-insensitive description search', () => {
    const transactions = [
      makeTransaction({ description: 'Supermercado Fort' }),
      makeTransaction({ id: 'txn-2', description: 'Farmácia' })
    ]
    const result = filterTransactions(transactions, { ...createEmptyFilters(), search: 'FARM' })
    expect(result).toHaveLength(1)
    expect(result[0]?.description).toBe('Farmácia')
  })

  it('filters by category', () => {
    const transactions = [
      makeTransaction({ category: 'Transporte' }),
      makeTransaction({ id: 'txn-2', category: 'Alimentação' })
    ]
    const result = filterTransactions(transactions, { ...createEmptyFilters(), categories: ['Alimentação'] })
    expect(result.map((t) => t.id)).toEqual(['txn-2'])
  })

  it('filters by multiple fields at once (AND semantics)', () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', account: 'Nubank Gabi', status: 'Pago' }),
      makeTransaction({ id: 'txn-2', account: 'Nubank Gabi', status: 'Pendente' }),
      makeTransaction({ id: 'txn-3', account: 'C6 Gabi - Físico', status: 'Pago' })
    ]
    const result = filterTransactions(transactions, {
      ...createEmptyFilters(),
      accounts: ['Nubank Gabi'],
      status: ['Pago']
    })
    expect(result.map((t) => t.id)).toEqual(['txn-1'])
  })

  it('an option list with multiple values behaves as OR within that field', () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', method: 'Crédito' }),
      makeTransaction({ id: 'txn-2', method: 'PIX' }),
      makeTransaction({ id: 'txn-3', method: 'Débito' })
    ]
    const result = filterTransactions(transactions, { ...createEmptyFilters(), methods: ['Crédito', 'PIX'] })
    expect(result.map((t) => t.id)).toEqual(['txn-1', 'txn-2'])
  })

  it('filters by reimbursable status', () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', reimbursable: 'Sim' }),
      makeTransaction({ id: 'txn-2', reimbursable: 'Não' })
    ]
    const result = filterTransactions(transactions, { ...createEmptyFilters(), reimbursable: ['Sim'] })
    expect(result.map((t) => t.id)).toEqual(['txn-1'])
  })

  it('returns an empty array when nothing matches', () => {
    const transactions = [makeTransaction()]
    const result = filterTransactions(transactions, { ...createEmptyFilters(), search: 'não existe' })
    expect(result).toEqual([])
  })
})
