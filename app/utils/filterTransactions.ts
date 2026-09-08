// app/utils/filterTransactions.ts
//
// Pure function, deliberately kept out of any composable: filtering is
// business logic, not state management, and pure functions are the
// cheapest thing in the codebase to unit-test — no Vue runtime, no
// mocked repository, just input in, array out.
import type { Transaction } from '~/types/transaction'
import type { TransactionFilters } from '~/types/filters'

function matches(value: string, options: readonly string[]): boolean {
  return options.length === 0 || options.includes(value)
}

export function filterTransactions(transactions: readonly Transaction[], filters: TransactionFilters): Transaction[] {
  const search = filters.search.trim().toLowerCase()

  return transactions.filter((transaction) => {
    if (search !== '' && !transaction.description.toLowerCase().includes(search)) return false
    if (!matches(transaction.category, filters.categories)) return false
    if (!matches(transaction.account, filters.accounts)) return false
    if (!matches(transaction.method, filters.methods)) return false
    if (!matches(transaction.type, filters.types)) return false
    if (!matches(transaction.debtor, filters.debtors)) return false
    if (!matches(transaction.status, filters.status)) return false
    if (!matches(transaction.reimbursable, filters.reimbursable)) return false
    return true
  })
}
