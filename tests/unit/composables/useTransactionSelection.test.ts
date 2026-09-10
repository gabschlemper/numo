import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
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

  it('is keyed by transaction id, not by row index', () => {
    const rows = ref<Transaction[]>([
      makeTransaction({ id: 'a' }),
      makeTransaction({ id: 'b' }),
      makeTransaction({ id: 'c' })
    ])
    const { selection, selectedIds, selectedTransactions, selectedCount, hasSelection } =
      useTransactionSelection(rows)
    selection.value = { a: true, c: true }
    expect(selectedIds.value).toEqual(['a', 'c'])
    expect(selectedTransactions.value.map((t) => t.id)).toEqual(['a', 'c'])
    expect(selectedCount.value).toBe(2)
    expect(hasSelection.value).toBe(true)
  })

  it('ignores ids marked false', () => {
    const rows = ref<Transaction[]>([makeTransaction({ id: 'a' }), makeTransaction({ id: 'b' })])
    const { selection, selectedIds } = useTransactionSelection(rows)
    selection.value = { a: true, b: false }
    expect(selectedIds.value).toEqual(['a'])
  })

  it('follows the same transaction when the rows are reordered', () => {
    // The whole point of keying by id: sorting the table must never
    // silently move a selection onto a different transaction.
    const rows = ref<Transaction[]>([makeTransaction({ id: 'a' }), makeTransaction({ id: 'b' })])
    const { selection, selectedIds } = useTransactionSelection(rows)
    selection.value = { b: true }
    rows.value = [makeTransaction({ id: 'b' }), makeTransaction({ id: 'a' })]
    expect(selectedIds.value).toEqual(['b'])
  })

  it('drops a selected id once its row is no longer visible', () => {
    const rows = ref<Transaction[]>([makeTransaction({ id: 'a' }), makeTransaction({ id: 'b' })])
    const { selection, selectedIds } = useTransactionSelection(rows)
    selection.value = { b: true }
    expect(selectedIds.value).toEqual(['b'])
    rows.value = [makeTransaction({ id: 'a' })]
    expect(selectedIds.value).toEqual([])
  })

  it('prunes hidden selections out of the selection object itself', async () => {
    // Otherwise a filter, then a clear, would resurrect checkboxes the
    // user picked under a search they have long forgotten — and the
    // next bulk delete would take rows they never meant to include.
    const rows = ref<Transaction[]>([makeTransaction({ id: 'a' }), makeTransaction({ id: 'b' })])
    const { selection } = useTransactionSelection(rows)
    selection.value = { a: true, b: true }
    rows.value = [makeTransaction({ id: 'a' })]
    await nextTick()
    expect(selection.value).toEqual({ a: true })
    rows.value = [makeTransaction({ id: 'a' }), makeTransaction({ id: 'b' })]
    await nextTick()
    expect(selection.value).toEqual({ a: true })
  })

  it('clearSelection() empties the selection', () => {
    const rows = ref<Transaction[]>([makeTransaction({ id: 'a' })])
    const { selection, clearSelection, hasSelection } = useTransactionSelection(rows)
    selection.value = { a: true }
    expect(hasSelection.value).toBe(true)
    clearSelection()
    expect(hasSelection.value).toBe(false)
    expect(selection.value).toEqual({})
  })
})
