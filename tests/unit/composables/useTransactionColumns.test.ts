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
import { DEFAULT_SORT, type TransactionSort } from '~/utils/sortTransactions'

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

const onEdit = vi.fn()
const onDelete = vi.fn()
const onSort = vi.fn()

function build(sort: TransactionSort = DEFAULT_SORT) {
  return useTransactionColumns({ sort, onSort, onEdit, onDelete })
}

function findColumn(columns: ReturnType<typeof useTransactionColumns>, key: string) {
  return columns.find((column) => ('accessorKey' in column && column.accessorKey === key) || column.id === key)
}

/** Sortable headers are render functions; this invokes one and returns the button vnode. */
function renderHeader(column: ReturnType<typeof findColumn>) {
  const header = column?.header
  if (typeof header !== 'function') throw new Error('expected a render-function header')
  // @ts-expect-error - sortable headers ignore the header context argument
  return header() as { props: Record<string, unknown> }
}

describe('useTransactionColumns', () => {
  const columns = build()

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
      'billingMonth',
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

  it('formats the billing month with the spreadsheet convention', () => {
    const column = findColumn(columns, 'billingMonth')
    const row = makeRow(makeTransaction({ billingMonth: '2026-11' }))
    // @ts-expect-error - minimal row stand-in
    expect(column?.cell?.({ row })).toBe('Nov/2026')
  })

  it('formats an expense as plain BRL currency, in the default ink', () => {
    const column = findColumn(columns, 'amount')
    const row = makeRow(makeTransaction({ amount: 1234.5, type: 'Variável' }))
    // @ts-expect-error - minimal row stand-in
    const cell = column?.cell?.({ row }) as { props: { class?: string }, children: string }
    expect(cell.children).toBe('R$\xa01.234,50')
    expect(cell.props.class).toBeUndefined()
  })

  it('signs and colors income, so the distinction survives without color', () => {
    const column = findColumn(columns, 'amount')
    const row = makeRow(makeTransaction({ amount: 1234.5, type: 'Receita' }))
    // @ts-expect-error - minimal row stand-in
    const cell = column?.cell?.({ row }) as { props: { class?: string }, children: string }
    expect(cell.children).toBe('+R$\xa01.234,50')
    expect(cell.props.class).toBe('text-success')
  })

  it('keeps the full description reachable via title when the cell truncates', () => {
    const column = findColumn(columns, 'description')
    const row = makeRow(makeTransaction({ description: 'Uma descrição bem longa que não cabe na célula' }))
    // @ts-expect-error - minimal row stand-in
    const cell = column?.cell?.({ row }) as { props: { title: string }, children: string }
    expect(cell.props.title).toBe('Uma descrição bem longa que não cabe na célula')
    expect(cell.children).toBe('Uma descrição bem longa que não cabe na célula')
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

  it('shows an em dash instead of an empty debtor cell', () => {
    const column = findColumn(columns, 'debtor')
    // @ts-expect-error - minimal row stand-in
    expect(column?.cell?.({ row: makeRow(makeTransaction({ debtor: '' })) })).toBe('—')
    // @ts-expect-error - minimal row stand-in
    expect(column?.cell?.({ row: makeRow(makeTransaction({ debtor: 'Ana' })) })).toBe('Ana')
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

  it('names the row actions after the transaction they act on', () => {
    const column = findColumn(columns, 'actions')
    const transaction = makeTransaction({ description: 'Aluguel', amount: 2400 })
    // @ts-expect-error - minimal row stand-in
    const cell = column?.cell?.({ row: makeRow(transaction) }) as { children: Array<{ props: Record<string, string> }> }
    expect(cell.children[0]?.props['aria-label']).toBe('Editar Aluguel (R$\xa02.400,00)')
    expect(cell.children[1]?.props['aria-label']).toBe('Excluir Aluguel (R$\xa02.400,00)')
  })
})

describe('useTransactionColumns — sortable headers', () => {
  it('reports the clicked field back instead of sorting anything itself', () => {
    onSort.mockClear()
    const column = findColumn(build(), 'amount')
    const button = renderHeader(column)
    ;(button.props.onClick as () => void)()
    expect(onSort).toHaveBeenCalledWith('amount')
  })

  it('shows a neutral, direction-less icon on the column that is not sorted', () => {
    const column = findColumn(build({ field: 'date', direction: 'desc' }), 'category')
    const button = renderHeader(column)
    expect(button.props.icon).toBe('i-lucide-chevrons-up-down')
    expect(button.props.color).toBe('neutral')
  })

  it('shows the current direction on the column that IS sorted', () => {
    const ascending = renderHeader(findColumn(build({ field: 'amount', direction: 'asc' }), 'amount'))
    expect(ascending.props.icon).toBe('i-lucide-arrow-up-narrow-wide')
    expect(ascending.props.color).toBe('primary')

    const descending = renderHeader(findColumn(build({ field: 'amount', direction: 'desc' }), 'amount'))
    expect(descending.props.icon).toBe('i-lucide-arrow-down-wide-narrow')
  })

  it('announces what the next click will do, not what the current state is', () => {
    const ascending = renderHeader(findColumn(build({ field: 'amount', direction: 'asc' }), 'amount'))
    expect(ascending.props['aria-label']).toBe('Ordenar por Valor, ordem decrescente')

    const descending = renderHeader(findColumn(build({ field: 'amount', direction: 'desc' }), 'amount'))
    expect(descending.props['aria-label']).toBe('Ordenar por Valor, ordem crescente')

    const untouched = renderHeader(findColumn(build({ field: 'date', direction: 'desc' }), 'category'))
    expect(untouched.props['aria-label']).toBe('Ordenar por Categoria, ordem crescente')
  })

  it('leaves "Parcela" and "A reembolsar" unsortable — neither has an order a user would expect', () => {
    const columns = build()
    expect(typeof findColumn(columns, 'installment')?.header).toBe('string')
    expect(typeof findColumn(columns, 'reimbursable')?.header).toBe('string')
  })
})
