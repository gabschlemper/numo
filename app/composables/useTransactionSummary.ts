// app/composables/useTransactionSummary.ts
//
// The reactive wrapper around the pure `summarizeTransactions`. It's
// intentionally this thin: every rule about what counts as income,
// what counts as an expense and what "a reembolsar" means lives in the
// util, so those rules stay testable without a Vue runtime and can't
// drift between this screen and whatever screen shows them next.
import type { Transaction } from '~/types/transaction'
import { summarizeTransactions, type TransactionsSummary } from '~/utils/summarizeTransactions'

export function useTransactionSummary(transactions: Ref<readonly Transaction[]>) {
  const summary = computed<TransactionsSummary>(() => summarizeTransactions(transactions.value))
  return { summary }
}
