import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTransactionSorting } from '~/composables/useTransactionSorting'
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

describe('useTransactionSorting', () => {
  it('starts newest-first', () => {
    const rows = ref<Transaction[]>([
      makeTransaction({ id: 'old', date: '2026-09-01' }),
      makeTransaction({ id: 'new', date: '2026-09-20' })
    ])
    const { sort, sortedTransactions, isDefaultSort } = useTransactionSorting(rows)
    expect(sort.value).toEqual({ field: 'date', direction: 'desc' })
    expect(isDefaultSort.value).toBe(true)
    expect(sortedTransactions.value.map((row) => row.id)).toEqual(['new', 'old'])
  })

  it('flips direction when the same column is clicked again', () => {
    const rows = ref<Transaction[]>([makeTransaction()])
    const { sort, toggleSort } = useTransactionSorting(rows)
    toggleSort('date')
    expect(sort.value).toEqual({ field: 'date', direction: 'asc' })
    toggleSort('date')
    expect(sort.value).toEqual({ field: 'date', direction: 'desc' })
  })

  it('jumps to a new column at that column natural first direction', () => {
    const rows = ref<Transaction[]>([makeTransaction()])
    const { sort, toggleSort } = useTransactionSorting(rows)
    toggleSort('description')
    expect(sort.value).toEqual({ field: 'description', direction: 'asc' })
    toggleSort('amount')
    expect(sort.value).toEqual({ field: 'amount', direction: 'desc' })
  })

  it('re-sorts reactively when the underlying list changes', () => {
    const rows = ref<Transaction[]>([makeTransaction({ id: 'a', amount: 10 })])
    const { toggleSort, sortedTransactions } = useTransactionSorting(rows)
    toggleSort('amount')
    rows.value = [makeTransaction({ id: 'a', amount: 10 }), makeTransaction({ id: 'b', amount: 90 })]
    expect(sortedTransactions.value.map((row) => row.id)).toEqual(['b', 'a'])
  })

  it('resetSort() goes back to the default and reports it', () => {
    const rows = ref<Transaction[]>([makeTransaction()])
    const { sort, toggleSort, resetSort, isDefaultSort } = useTransactionSorting(rows)
    toggleSort('category')
    expect(isDefaultSort.value).toBe(false)
    resetSort()
    expect(sort.value).toEqual({ field: 'date', direction: 'desc' })
    expect(isDefaultSort.value).toBe(true)
  })
})
