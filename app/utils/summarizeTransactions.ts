// app/utils/summarizeTransactions.ts
//
// Pure function, same rationale as `filterTransactions`: turning a
// list of transactions into the numbers shown at the top of the
// Lançamentos screen is business logic, not state management, so it
// lives here where it can be unit-tested without a Vue runtime.
//
// The rules encoded below are the domain's, documented in
// `types/transaction.ts` and not re-decided anywhere else:
//   • `type === 'Receita'` is the ONLY thing that makes a transaction
//     income; every other type (Fixo, Variável, Investimento) is money
//     going out.
//   • `amount` is always stored positive — the sign is implied by
//     `type`, never by the number itself.
//   • `reimbursable === 'Sim'` does NOT remove an expense from the
//     expense total; it's surfaced separately as "money that comes
//     back", because the user still fronted it this month.
//   • `debtor` is deliberately ignored here — having a debtor says
//     nothing about whether the money left the account.
import type { Transaction } from '~/types/transaction'

export interface TransactionsSummary {
  /** How many transactions the numbers below were computed from. */
  count: number
  income: number
  expenses: number
  /** `income - expenses`. Negative means the period spent more than it earned. */
  balance: number
  /** Expenses flagged `reimbursable: 'Sim'` — already counted in `expenses`. */
  reimbursable: number
  pendingCount: number
}

export function isIncome(transaction: Transaction): boolean {
  return transaction.type === 'Receita'
}

export function summarizeTransactions(transactions: readonly Transaction[]): TransactionsSummary {
  let income = 0
  let expenses = 0
  let reimbursable = 0
  let pendingCount = 0

  for (const transaction of transactions) {
    if (isIncome(transaction)) {
      income += transaction.amount
    } else {
      expenses += transaction.amount
      if (transaction.reimbursable === 'Sim') reimbursable += transaction.amount
    }
    if (transaction.status === 'Pendente') pendingCount += 1
  }

  return {
    count: transactions.length,
    income,
    expenses,
    balance: income - expenses,
    reimbursable,
    pendingCount
  }
}
