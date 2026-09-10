// app/composables/useTransactionSorting.ts
//
// Owns sort STATE only — the comparison itself is the pure function
// `sortTransactions` (utils/), exactly the same split as
// `useTransactionFilters` ↔ `filterTransactions`.
//
// Why sorting isn't delegated to `UTable`'s own built-in sorting: the
// screen renders the same rows two ways (a table on ≥md, a card list
// below it), and the card list has no `UTable` to ask for the sorted
// order. Keeping the sorted list here means both renderers read from
// one source of truth, and pagination downstream slices the same
// already-sorted array — the alternative silently gives phone users a
// different row order than desktop users.
import type { Transaction } from '~/types/transaction'
import {
  DEFAULT_SORT,
  firstClickDirection,
  sortTransactions,
  type SortableField,
  type TransactionSort
} from '~/utils/sortTransactions'

export function useTransactionSorting(transactions: Ref<readonly Transaction[]>) {
  const sort = ref<TransactionSort>({ ...DEFAULT_SORT })

  const sortedTransactions = computed(() => sortTransactions(transactions.value, sort.value))

  /**
   * Clicking the column you're already sorted by flips the direction;
   * clicking a different one jumps to that column's natural first
   * direction (see `firstClickDirection`). Two states, not three — a
   * hidden "unsorted" third state is a click users spend without
   * meaning to, and "no sort" isn't a useful destination when the
   * default (newest first) is already the most useful order.
   */
  function toggleSort(field: SortableField): void {
    sort.value =
      sort.value.field === field
        ? { field, direction: sort.value.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: firstClickDirection(field) }
  }

  function resetSort(): void {
    sort.value = { ...DEFAULT_SORT }
  }

  const isDefaultSort = computed(
    () => sort.value.field === DEFAULT_SORT.field && sort.value.direction === DEFAULT_SORT.direction
  )

  return { sort, sortedTransactions, toggleSort, resetSort, isDefaultSort }
}
