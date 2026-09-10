// app/composables/useTransactionSelection.ts
//
// Owns row-selection state only, expressed as the
// `Record<string, boolean>` shape `UTable` expects via
// `v-model:row-selection`.
//
// Keyed by TRANSACTION ID, not by row index — the table is told to
// identify rows the same way via `:get-row-id`. This is a correctness
// requirement, not a preference: the screen now sorts and paginates
// the list, so row index 0 stops meaning the same transaction the
// moment a column header is clicked or the page changes. With index
// keys, selecting a row and then sorting would silently retarget the
// selection at a *different* transaction, and the next "Excluir"
// would delete the wrong rows. Ids can't drift.
//
// The other half of the same guarantee is `selectedIds` only ever
// reporting rows that are actually visible, plus the watcher below
// that drops selections the current filter hides — the user can never
// act on something they can't see and didn't knowingly pick.
import type { Transaction } from '~/types/transaction'

export function useTransactionSelection(visibleRows: Ref<readonly Transaction[]>) {
  const selection = ref<Record<string, boolean>>({})

  const visibleIds = computed(() => new Set(visibleRows.value.map((transaction) => transaction.id)))

  const selectedIds = computed<string[]>(() =>
    Object.entries(selection.value)
      .filter(([id, checked]) => checked && visibleIds.value.has(id))
      .map(([id]) => id)
  )

  const selectedTransactions = computed<Transaction[]>(() => {
    const targetIds = new Set(selectedIds.value)
    return visibleRows.value.filter((transaction) => targetIds.has(transaction.id))
  })

  const selectedCount = computed(() => selectedIds.value.length)
  const hasSelection = computed(() => selectedCount.value > 0)

  function clearSelection(): void {
    selection.value = {}
  }

  // Prune rather than keep hidden selections alive. Keeping them would
  // mean a user narrows the list, clears the filter, and finds rows
  // still checked from a search they've long forgotten — then hits a
  // bulk action on all of them. Dropping them costs one re-selection;
  // keeping them costs a wrong bulk edit.
  watch(visibleIds, (ids) => {
    const survivors = Object.entries(selection.value).filter(([id, checked]) => checked && ids.has(id))
    if (survivors.length !== Object.keys(selection.value).length) {
      selection.value = Object.fromEntries(survivors)
    }
  })

  return {
    selection,
    selectedIds,
    selectedTransactions,
    selectedCount,
    hasSelection,
    clearSelection
  }
}
