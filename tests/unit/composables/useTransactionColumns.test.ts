// `useTransactionColumns` calls Vue's `resolveComponent` outside of a
// component's render/setup context (there's no component here — it's a
// column-definition factory), which is exactly the situation Vue itself
// documents as falling back to returning the given name as a plain
// string (with a harmless dev warning) instead of throwing. That means
// `h(UBadge, ...)` below really becomes `h('UBadge', ...)` — a native
// vnode we can inspect without mounting anything.
import { describe, expect, it, vi } from 'vitest'
import { useTransactionColumns } from '~/composables/useTransactionColumns'
import type { Transaction } from '~/types/transaction'

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    date: '2026-09-05',
    description: 'Posto Ipiranga',
    category: 'Transporte',
    account: 'Nubank Gabi',
    method: 'Crédito',
    amount: 124.3,
    type: 'Variável',
    installment: null,
    status: 'Pendente',
    debtor: '',
    reimbursable: 'Não',
    billingMonth: '2026-09',
    ...overrides
  }
}

/** A minimal stand-in for @tanstack/table's `Row<Transaction>`. */
function makeRow(transaction: Transaction) {
  return {
    original: transaction,
    getValue: (key: keyof Transaction) => transaction[key]
  }
}

/** Reads the display text out of an `h(Comp, props, () => text)` vnode, whichever slot shape Vue normalized it to. */
function slotText(vnode: unknown): unknown {
  const children = (vnode as { children: unknown }).children
  if (typeof children === 'function') return children()
  if (children && typeof children === 'object' && 'default' in (children as Record<string, unknown>)) {
    return (children as { default: () => unknown }).default()
  }
  return children
}

function findColumn(columns: ReturnType<typeof useTransactionColumns>, key: string) {
  return columns.find((column) => 'accessorKey' in column && column.accessorKey === key || column.id === key)
}

describe('useTransactionColumns', () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const columns = useTransactionColumns({ onEdit, onDelete })

  it('defines one column per visible field plus the actions column', () => {
    const keys = columns.map((column) => ('accessorKey' in column ? column.accessorKey : column.id))
    expect(keys).toEqual([
      'date',
      'description',
      'category',
      'account',
      'method',
      'amount',
      'type',
      'installment',
      'status',
      'debtor',
      'reimbursable',
      'actions'
    ])
  })

  it('formats the date column as DD/MM', () => {
    const column = findColumn(columns, 'date')
    const row = makeRow(makeTransaction({ date: '2026-11-03' }))
    // @ts-expect-error - minimal row stand-in, not the full tanstack Row type
    expect(column?.cell?.({ row })).toBe('03/11')
  })

  it('formats the amount column as BRL currency', () => {
    const column = findColumn(columns, 'amount')
    const row = makeRow(makeTransaction({ amount: 1234.5 }))
    // @ts-expect-error - minimal row stand-in
    expect(column?.cell?.({ row })).toBe('R$\xa01.234,50')
  })

  it('shows an em dash for a transaction with no installment', () => {
    const column = findColumn(columns, 'installment')
    const row = makeRow(makeTransaction({ installment: null }))
    // @ts-expect-error - minimal row stand-in
    expect(column?.cell?.({ row })).toBe('—')
  })

  it('passes through the installment label when one exists', () => {
    const column = findColumn(columns, 'installment')
    const row = makeRow(makeTransaction({ installment: '2/12' }))
    // @ts-expect-error - minimal row stand-in
    expect(column?.cell?.({ row })).toBe('2/12')
  })

  it('renders the status as a badge, colored success only when Pago', () => {
    const column = findColumn(columns, 'status')
    // @ts-expect-error - minimal row stand-in
    const paid = column?.cell?.({ row: makeRow(makeTransaction({ status: 'Pago' })) })
    // @ts-expect-error - minimal row stand-in
    const pending = column?.cell?.({ row: makeRow(makeTransaction({ status: 'Pendente' })) })
    expect((paid as { props: { color: string } }).props.color).toBe('success')
    expect(slotText(paid)).toBe('Pago')
    expect((pending as { props: { color: string } }).props.color).toBe('warning')
    expect(slotText(pending)).toBe('Pendente')
  })

  it('only badges "reimbursable" transactions, otherwise shows an em dash', () => {
    const column = findColumn(columns, 'reimbursable')
    // @ts-expect-error - minimal row stand-in
    const reimbursable = column?.cell?.({ row: makeRow(makeTransaction({ reimbursable: 'Sim' })) })
    // @ts-expect-error - minimal row stand-in
    const notReimbursable = column?.cell?.({ row: makeRow(makeTransaction({ reimbursable: 'Não' })) })
    expect(slotText(reimbursable)).toBe('Sim')
    expect(notReimbursable).toBe('—')
  })

  it('wires the actions column buttons to onEdit/onDelete with the row transaction', () => {
    onEdit.mockClear()
    onDelete.mockClear()
    const column = findColumn(columns, 'actions')
    const transaction = makeTransaction({ id: 'txn-42' })
    // @ts-expect-error - minimal row stand-in
    const cell = column?.cell?.({ row: makeRow(transaction) }) as { children: Array<{ props: Record<string, unknown> }> }
    const [editButton, deleteButton] = cell.children
    ;(editButton?.props.onClick as () => void)()
    ;(deleteButton?.props.onClick as () => void)()
    expect(onEdit).toHaveBeenCalledWith(transaction)
    expect(onDelete).toHaveBeenCalledWith(transaction)
  })
})
