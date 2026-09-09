import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTransactionFilters } from '~/composables/useTransactionFilters'
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

describe('useTransactionFilters', () => {
  it('starts with empty filters and the full list visible', () => {
    const transactions = ref<Transaction[]>([makeTransaction(), makeTransaction({ id: 'txn-2' })])
    const { filters, filteredTransactions } = useTransactionFilters(transactions)
    expect(filters.value.search).toBe('')
    expect(filteredTransactions.value).toHaveLength(2)
  })

  it('reacts to changes in the filters', () => {
    const transactions = ref<Transaction[]>([
      makeTransaction({ category: 'Transporte' }),
      makeTransaction({ id: 'txn-2', category: 'Alimentação' })
    ])
    const { filters, filteredTransactions } = useTransactionFilters(transactions)
    filters.value.categories = ['Alimentação']
    expect(filteredTransactions.value.map((t) => t.id)).toEqual(['txn-2'])
  })

  it('reacts to changes in the underlying transaction list', () => {
    const transactions = ref<Transaction[]>([makeTransaction()])
    const { filteredTransactions } = useTransactionFilters(transactions)
    expect(filteredTransactions.value).toHaveLength(1)
    transactions.value = []
    expect(filteredTransactions.value).toHaveLength(0)
  })

  it('clearFilters() resets to an empty filter state', () => {
    const transactions = ref<Transaction[]>([makeTransaction()])
    const { filters, clearFilters } = useTransactionFilters(transactions)
    filters.value.search = 'posto'
    filters.value.categories = ['Transporte']
    clearFilters()
    expect(filters.value.search).toBe('')
    expect(filters.value.categories).toEqual([])
  })
})
