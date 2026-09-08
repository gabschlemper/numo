// app/composables/useTransactionSelection.ts
//
// Owns row-selection state only, expressed as the `Record<string, boolean>`
// shape `UTable` expects via `v-model:row-selection` (indexed by row
// index, not id — the table only ever renders the currently filtered
// list, so this composable is intentionally the one place that maps
// between "selected row indexes" and "selected transaction ids").
import type { Transaction } from '~/types/transaction'

export function useTransactionSelection(visibleRows: Ref<readonly Transaction[]>) {
  const selection = ref<Record<string, boolean>>({})

  const selectedIds = computed<string[]>(() =>
    Object.entries(selection.value)
      .filter(([, checked]) => checked)
      .map(([index]) => visibleRows.value[Number(index)]?.id)
      .filter((id): id is string => Boolean(id))
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

  return {
    selection,
    selectedIds,
    selectedTransactions,
    selectedCount,
    hasSelection,
    clearSelection
  }
}
