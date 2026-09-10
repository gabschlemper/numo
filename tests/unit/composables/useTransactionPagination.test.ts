import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useTransactionPagination } from '~/composables/useTransactionPagination'
import { DEFAULT_PAGE_SIZE } from '~/constants/pagination'
import type { Transaction } from '~/types/transaction'

function makeRows(count: number): Transaction[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `txn-${index + 1}`,
    date: '2026-09-01',
    description: `Lançamento ${index + 1}`,
    category: 'Outros',
    account: 'Nubank Gabi',
    method: 'Crédito' as const,
    amount: 10,
    type: 'Variável' as const,
    installment: null,
    status: 'Pago' as const,
    debtor: '',
    reimbursable: 'Não' as const,
    billingMonth: '2026-09'
  }))
}

describe('useTransactionPagination', () => {
  it('slices the list to the first page by default', () => {
    const rows = ref(makeRows(30))
    const { page, paginatedTransactions, pageCount, total } = useTransactionPagination(rows, 10)
    expect(page.value).toBe(1)
    expect(total.value).toBe(30)
    expect(pageCount.value).toBe(3)
    expect(paginatedTransactions.value.map((row) => row.id)).toEqual(
      makeRows(10).map((row) => row.id)
    )
  })

  it('uses a sane default page size when none is given', () => {
    const rows = ref(makeRows(100))
    const { paginatedTransactions } = useTransactionPagination(rows)
    expect(paginatedTransactions.value).toHaveLength(DEFAULT_PAGE_SIZE)
  })

  it('slices the requested page', () => {
    const rows = ref(makeRows(25))
    const { page, paginatedTransactions } = useTransactionPagination(rows, 10)
    page.value = 3
    expect(paginatedTransactions.value.map((row) => row.id)).toEqual(['txn-21', 'txn-22', 'txn-23', 'txn-24', 'txn-25'])
  })

  it('reports a human 1-based range, and 0 when there is nothing', () => {
    const rows = ref(makeRows(25))
    const { page, rangeStart, rangeEnd } = useTransactionPagination(rows, 10)
    expect([rangeStart.value, rangeEnd.value]).toEqual([1, 10])
    page.value = 3
    expect([rangeStart.value, rangeEnd.value]).toEqual([21, 25])
    rows.value = []
    expect(rangeStart.value).toBe(0)
    expect(rangeEnd.value).toBe(0)
  })

  it('pulls the page back into range when the list shrinks under it', async () => {
    const rows = ref(makeRows(30))
    const { page, paginatedTransactions } = useTransactionPagination(rows, 10)
    page.value = 3
    rows.value = makeRows(12)
    await nextTick()
    expect(page.value).toBe(2)
    expect(paginatedTransactions.value).toHaveLength(2)
  })

  it('never drops below page 1, even with an empty list', async () => {
    const rows = ref(makeRows(30))
    const { page, pageCount } = useTransactionPagination(rows, 10)
    page.value = 3
    rows.value = []
    await nextTick()
    expect(pageCount.value).toBe(1)
    expect(page.value).toBe(1)
  })

  it('re-clamps the page when the page size grows', async () => {
    const rows = ref(makeRows(30))
    const { page, pageSize } = useTransactionPagination(rows, 10)
    page.value = 3
    pageSize.value = 25
    await nextTick()
    expect(page.value).toBe(2)
  })

  it('isPaginated only once the list outgrows one page', () => {
    const rows = ref(makeRows(10))
    const { isPaginated } = useTransactionPagination(rows, 10)
    expect(isPaginated.value).toBe(false)
    rows.value = makeRows(11)
    expect(isPaginated.value).toBe(true)
  })

  it('resetPage() returns to the first page', () => {
    const rows = ref(makeRows(30))
    const { page, resetPage } = useTransactionPagination(rows, 10)
    page.value = 3
    resetPage()
    expect(page.value).toBe(1)
  })
})
