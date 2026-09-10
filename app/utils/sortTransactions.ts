// app/utils/sortTransactions.ts
//
// Pure function, kept out of the table component on purpose: the
// screen sorts the *filtered* list before paginating it, and the
// mobile card list has to end up with exactly the same order as the
// desktop table. Sharing one pure function is what guarantees that —
// if this lived inside `UTable`'s own sorting state, the card list
// would have no way to agree with it.
//
// `Array.prototype.sort` is stable in every engine targeted here
// (ES2019+), so equal keys keep their previous relative order — which
// is why a second sort key isn't needed to make the result
// deterministic.
import type { Transaction } from '~/types/transaction'

/**
 * The fields a user can sort by. Deliberately a subset of
 * `Transaction`: sorting by `installment` ("3/12") or `id` has no
 * meaning a user would expect, so those simply aren't offered.
 */
export type SortableField =
  | 'date'
  | 'description'
  | 'category'
  | 'account'
  | 'method'
  | 'amount'
  | 'type'
  | 'status'
  | 'debtor'
  | 'billingMonth'

export type SortDirection = 'asc' | 'desc'

export interface TransactionSort {
  field: SortableField
  direction: SortDirection
}

/**
 * Newest first. A ledger's only sane default — the rows a user opens
 * this screen to check are almost always the most recent ones.
 */
export const DEFAULT_SORT: TransactionSort = { field: 'date', direction: 'desc' }

/**
 * Which direction a column starts in on its first click. Amounts and
 * dates are overwhelmingly asked for "biggest/newest first", text
 * columns alphabetically — starting them the other way around means
 * every user's first click is the wrong one.
 */
const FIRST_CLICK_DIRECTION: Record<SortableField, SortDirection> = {
  date: 'desc',
  amount: 'desc',
  billingMonth: 'desc',
  description: 'asc',
  category: 'asc',
  account: 'asc',
  method: 'asc',
  type: 'asc',
  status: 'asc',
  debtor: 'asc'
}

export function firstClickDirection(field: SortableField): SortDirection {
  return FIRST_CLICK_DIRECTION[field]
}

const TEXT_COLLATOR = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

function valueOf(transaction: Transaction, field: SortableField): string {
  return String(transaction[field] ?? '')
}

function compare(a: Transaction, b: Transaction, field: SortableField): number {
  if (field === 'amount') return a.amount - b.amount
  // `date` ("YYYY-MM-DD") and `billingMonth` ("YYYY-MM") are ISO
  // strings, so lexicographic order is already chronological order —
  // no Date parsing needed, and none of the timezone traps that come
  // with it.
  return TEXT_COLLATOR.compare(valueOf(a, field), valueOf(b, field))
}

export function sortTransactions(
  transactions: readonly Transaction[],
  sort: TransactionSort
): Transaction[] {
  const factor = sort.direction === 'asc' ? 1 : -1

  return [...transactions].sort((a, b) => {
    // Blanks sink to the bottom in BOTH directions — an empty
    // `debtor` is "no value", not "a value that sorts before A".
    // This is applied outside `factor` on purpose: folding it into
    // the comparison would flip blanks to the top on every `desc`
    // sort, which is exactly the spreadsheet behaviour users don't
    // expect.
    if (sort.field !== 'amount') {
      const left = valueOf(a, sort.field)
      const right = valueOf(b, sort.field)
      if (left === '' && right !== '') return 1
      if (right === '' && left !== '') return -1
    }
    return compare(a, b, sort.field) * factor
  })
}
