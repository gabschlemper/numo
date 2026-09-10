// app/composables/useTransactionPagination.ts
//
// Owns pagination STATE only, over whatever list it's handed (in
// practice: filtered → sorted → here). It deliberately paginates the
// list rather than letting `UTable` do it, for the same reason
// `useTransactionSorting` exists: the mobile card list and the desktop
// table have to show the same page of the same rows.
//
// The page-size constants live in `constants/pagination.ts`, not
// here — see that file for the auto-import scanner bug that forces
// this file to export exactly one thing.
import type { Transaction } from '~/types/transaction'
import { DEFAULT_PAGE_SIZE } from '~/constants/pagination'

export function useTransactionPagination(transactions: Ref<readonly Transaction[]>, pageSizeDefault: number = DEFAULT_PAGE_SIZE) {
  const page = ref(1)
  const pageSize = ref(pageSizeDefault)

  const total = computed(() => transactions.value.length)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  // Filtering down to fewer rows while sitting on page 4 would
  // otherwise leave the user staring at an empty list with no
  // explanation — the row count changed under them, so the page has
  // to follow it back into range instead of going blank.
  watch([pageCount, pageSize], () => {
    if (page.value > pageCount.value) page.value = pageCount.value
  })

  const paginatedTransactions = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return transactions.value.slice(start, start + pageSize.value)
  })

  /** 1-based index of the first row on screen, or 0 when there are none. */
  const rangeStart = computed(() => (total.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
  const rangeEnd = computed(() => Math.min(page.value * pageSize.value, total.value))

  const isPaginated = computed(() => total.value > pageSize.value)

  function resetPage(): void {
    page.value = 1
  }

  return {
    page,
    pageSize,
    total,
    pageCount,
    paginatedTransactions,
    rangeStart,
    rangeEnd,
    isPaginated,
    resetPage
  }
}

