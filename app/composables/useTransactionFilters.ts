// app/composables/useTransactionFilters.ts
//
// Owns filter STATE only. The actual filtering logic is the pure
// function `filterTransactions` (utils/) — this composable never
// duplicates that logic, it just exposes reactive filter state plus
// the already-filtered list as a computed.
import type { Transaction } from '~/types/transaction'
import { createEmptyFilters, type TransactionFilters } from '~/types/filters'
import { filterTransactions } from '~/utils/filterTransactions'

export function useTransactionFilters(transactions: Ref<readonly Transaction[]>) {
  const filters = ref<TransactionFilters>(createEmptyFilters())

  const filteredTransactions = computed(() => filterTransactions(transactions.value, filters.value))

  function clearFilters(): void {
    filters.value = createEmptyFilters()
  }

  return {
    filters,
    filteredTransactions,
    clearFilters
  }
}
