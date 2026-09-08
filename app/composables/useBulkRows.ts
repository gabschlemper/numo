// app/composables/useBulkRows.ts
//
// Owns the spreadsheet-like grid state used by `BulkAddSlideover`: one
// editable row per prospective transaction, plus which of those rows
// are actually complete enough to submit. Split out of the component
// so the "what counts as a valid row" rule lives in exactly one place
// and is unit-testable on its own.
import type { TransactionDraft, PaymentMethod, TransactionType } from '~/types/transaction'
import { todayIso } from '~/utils/formatDate'
import { billingMonthFromDate } from '~/utils/billingMonth'

export interface DraftRow {
  key: string
  date: string
  description: string
  category: string
  account: string
  method: PaymentMethod | undefined
  amount: number | null
  type: TransactionType | undefined
}

function emptyRow(): DraftRow {
  return {
    key: crypto.randomUUID(),
    date: todayIso(),
    description: '',
    category: '',
    account: '',
    method: undefined,
    amount: null,
    type: undefined
  }
}

export function isRowComplete(row: DraftRow): boolean {
  return (
    row.description.trim() !== '' &&
    row.category.trim() !== '' &&
    row.account.trim() !== '' &&
    row.method !== undefined &&
    row.type !== undefined &&
    row.amount !== null &&
    row.amount > 0
  )
}

function rowHasContent(row: DraftRow): boolean {
  return row.description.trim() !== '' || row.amount !== null
}

export function useBulkRows() {
  const rows = ref<DraftRow[]>([emptyRow(), emptyRow(), emptyRow()])

  const filledRows = computed(() => rows.value.filter(rowHasContent))
  const completeRows = computed(() => filledRows.value.filter(isRowComplete))
  const incompleteRows = computed(() => filledRows.value.filter((row) => !isRowComplete(row)))

  function addRow(): void {
    rows.value.push(emptyRow())
  }

  function removeRow(key: string): void {
    rows.value = rows.value.filter((row) => row.key !== key)
  }

  function reset(): void {
    rows.value = [emptyRow(), emptyRow(), emptyRow()]
  }

  function toDrafts(): TransactionDraft[] {
    return completeRows.value.map((row) => ({
      date: row.date,
      description: row.description.trim(),
      category: row.category,
      account: row.account,
      method: row.method as PaymentMethod,
      amount: row.amount as number,
      type: row.type as TransactionType,
      installment: null,
      status: 'Pendente',
      debtor: '',
      reimbursable: 'Não',
      billingMonth: billingMonthFromDate(row.date)
    }))
  }

  return {
    rows,
    filledRows,
    completeRows,
    incompleteRows,
    addRow,
    removeRow,
    reset,
    toDrafts
  }
}
