import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTransactionSelection } from '~/composables/useTransactionSelection'
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

describe('useTransactionSelection', () => {
  it('starts with nothing selected', () => {
    const rows = ref<Transaction[]>([makeTransaction()])
    const { selectedIds, selectedCount, hasSelection } = useTransactionSelection(rows)
    expect(selectedIds.value).toEqual([])
    expect(selectedCount.value).toBe(0)
    expect(hasSelection.value).toBe(false)
  })

  it('maps selected row indexes to transaction ids', () => {
    const rows = ref<Transaction[]>([
      makeTransaction({ id: 'a' }),
      makeTransaction({ id: 'b' }),
      makeTransaction({ id: 'c' })
    ])
    const { selection, selectedIds, selectedTransactions, selectedCount, hasSelection } = useTransactionSelection(
      rows
    )
    selection.value = { 0: true, 2: true }
    expect(selectedIds.value).toEqual(['a', 'c'])
    expect(selectedTransactions.value.map((t) => t.id)).toEqual(['a', 'c'])
    expect(selectedCount.value).toBe(2)
    expect(hasSelection.value).toBe(true)
  })

  it('ignores indexes marked false', () => {
    const rows = ref<Transaction[]>([makeTransaction({ id: 'a' }), makeTransaction({ id: 'b' })])
    const { selection, selectedIds } = useTransactionSelection(rows)
    selection.value = { 0: true, 1: false }
    expect(selectedIds.value).toEqual(['a'])
  })

  it('drops a selected id when the visible rows shrink under it', () => {
    const rows = ref<Transaction[]>([makeTransaction({ id: 'a' }), makeTransaction({ id: 'b' })])
    const { selection, selectedIds } = useTransactionSelection(rows)
    selection.value = { 1: true }
    expect(selectedIds.value).toEqual(['b'])
    rows.value = [makeTransaction({ id: 'a' })]
    expect(selectedIds.value).toEqual([])
  })

  it('clearSelection() empties the selection', () => {
    const rows = ref<Transaction[]>([makeTransaction({ id: 'a' })])
    const { selection, clearSelection, hasSelection } = useTransactionSelection(rows)
    selection.value = { 0: true }
    expect(hasSelection.value).toBe(true)
    clearSelection()
    expect(hasSelection.value).toBe(false)
    expect(selection.value).toEqual({})
  })
})
