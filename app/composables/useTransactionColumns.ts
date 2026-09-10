// app/composables/useTransactionColumns.ts
//
// Column definitions for `TransactionsTable`, isolated from the
// component itself: the table component's only job is to render
// `<UTable :columns :data />` plus wire up the actions column's
// events. Cell presentation (currency formatting, status badge color)
// lives here so it can change without touching the table component,
// and vice-versa.
//
// Two things this file is also responsible for, both of them UX
// decisions rather than data decisions:
//
// 1. WHICH COLUMNS SURVIVE A NARROW SCREEN. Each column carries a
//    Tailwind responsive class in `meta.class`, so the table sheds
//    detail progressively instead of forcing a 13-column horizontal
//    scroll onto a tablet: the four columns that answer "what was
//    this and how much" are always there, the rest reappear as the
//    viewport earns them. Below `md` the table isn't used at all —
//    `TransactionCardList` takes over (see `TransactionsTable.vue`).
//
// 2. WHICH COLUMNS ARE SORTABLE, and how the current sort is shown.
//    The sort itself is state owned by `useTransactionSorting`, not by
//    the table — this file only renders the header button and reports
//    the click back.
import { h } from 'vue'
// Imported from Nuxt's `#components` rather than looked up with
// `resolveComponent`. Nuxt's component auto-import is a COMPILE-TIME
// transform of `<UButton>` in a template — it never registers the
// name globally at runtime — so `resolveComponent('UButton')` found
// nothing here and silently fell back to returning the string
// "UButton". Vue then rendered a literal `<ubutton>` element: no
// button, no badge, no click handler, and no error anywhere. That's
// what the row actions and the status badges in this table were
// doing before. `#components` is the supported way to reach these
// from a render function.
import { UBadge, UButton } from '#components'
import type { TableColumn } from '@nuxt/ui'
import type { Transaction } from '~/types/transaction'
import { formatCurrency, formatIncomeAwareCurrency } from '~/utils/formatCurrency'
import { formatShortDate } from '~/utils/formatDate'
import { formatBillingMonth } from '~/utils/billingMonth'
import { isIncome } from '~/utils/summarizeTransactions'
import type { SortableField, TransactionSort } from '~/utils/sortTransactions'

interface ColumnOptions {
  /** The sort currently applied, so the right header shows the right arrow. */
  sort: TransactionSort
  onSort: (field: SortableField) => void
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

/**
 * Visibility tiers, as CONTAINER queries (`@min-[...]`) rather than
 * viewport breakpoints (`lg:`, `xl:`).
 *
 * That distinction is the whole reason this table fits: a viewport
 * breakpoint asks "how wide is the window", but the table lives next
 * to a 224px sidebar, so at a 1440px window it actually has ~1170px.
 * With `xl:` (1280px viewport) every column switched on 110px before
 * there was room for them and the table scrolled sideways on a
 * perfectly large screen. A container query asks the only question
 * that matters — "how wide am *I*" — so the same rules also hold when
 * the sidebar collapses on a tablet, and they'd keep holding if the
 * sidebar ever changed width.
 *
 * The thresholds below are measured against the real column widths
 * (see `tests`/the screenshots in review), not guessed: each tier is
 * the container width at which that column's content fits without
 * squeezing the description column below readability.
 *
 * The page's root element carries the matching `@container`. Anything
 * with no class here is always visible — date, description, amount,
 * status: the four that answer "what was this, how much, did it
 * clear". Below ~42rem the table isn't rendered at all;
 * `TransactionCardList` takes over.
 */
const FROM_46 = 'hidden @min-[46rem]:table-cell'
const FROM_60 = 'hidden @min-[60rem]:table-cell'
const FROM_74 = 'hidden @min-[74rem]:table-cell'
const FROM_92 = 'hidden @min-[92rem]:table-cell'

/** Applies a visibility tier to both the header cell and the body cells of one column. */
function responsive(from: string, extra?: { th?: string, td?: string }) {
  return {
    class: {
      th: [from, extra?.th].filter(Boolean).join(' '),
      td: [from, extra?.td].filter(Boolean).join(' ')
    }
  }
}

export function useTransactionColumns({ sort, onSort, onEdit, onDelete }: ColumnOptions): TableColumn<Transaction>[] {
  /**
   * A header that is also the sort control. Rendered as a real
   * `<button>` (not a click handler on the `<th>`) so it's reachable
   * by keyboard and announced as an actionable control, and the
   * `aria-label` spells out what the click will DO rather than what
   * the current state is — the arrow icon already shows the state.
   */
  function sortableHeader(label: string, field: SortableField) {
    const active = sort.field === field
    const nextDirection = active && sort.direction === 'asc' ? 'decrescente' : 'crescente'

    return () =>
      h(UButton, {
        label,
        color: active ? 'primary' : 'neutral',
        variant: 'ghost',
        size: 'xs',
        trailing: true,
        icon: active
          ? sort.direction === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-chevrons-up-down',
        // The chevrons on an unsorted column are a hint, not a status:
        // full opacity on every header turns the row into visual
        // noise, so they only come up on hover/focus.
        ui: { trailingIcon: active ? '' : 'opacity-0 group-hover/th:opacity-60' },
        class: '-mx-2 font-semibold',
        'aria-label': `Ordenar por ${label}, ordem ${nextDirection}`,
        onClick: () => onSort(field)
      })
  }

  function sortableMeta(from?: string, extra?: { th?: string, td?: string }) {
    const base = from ? responsive(from, extra) : { class: { th: extra?.th ?? '', td: extra?.td ?? '' } }
    return { class: { th: `group/th ${base.class.th}`.trim(), td: base.class.td } }
  }

  return [
    {
      accessorKey: 'date',
      header: sortableHeader('Data', 'date'),
      meta: sortableMeta(undefined, { td: 'whitespace-nowrap tabular-nums' }),
      cell: ({ row }) => formatShortDate(row.getValue('date'))
    },
    {
      accessorKey: 'description',
      header: sortableHeader('Descrição', 'description'),
      meta: sortableMeta(undefined, { td: 'max-w-[22ch] truncate @min-[60rem]:max-w-[32ch]' }),
      // `title` so the full text is still reachable once the cell
      // truncates — truncation without a way back to the full value
      // is information loss, not minimalism.
      cell: ({ row }) => {
        const description = row.getValue('description') as string
        return h('span', { class: 'font-medium', title: description }, description)
      }
    },
    {
      accessorKey: 'category',
      header: sortableHeader('Categoria', 'category'),
      meta: sortableMeta(FROM_46)
    },
    {
      accessorKey: 'account',
      header: sortableHeader('Conta', 'account'),
      meta: sortableMeta(FROM_74)
    },
    {
      accessorKey: 'method',
      header: sortableHeader('Método', 'method'),
      meta: sortableMeta(FROM_74)
    },
    {
      accessorKey: 'amount',
      header: sortableHeader('Valor', 'amount'),
      meta: sortableMeta(undefined, {
        th: 'text-right [&>button]:ms-auto',
        td: 'text-right font-medium tabular-nums whitespace-nowrap'
      }),
      // Income reads green and signed, expenses stay in the default
      // ink — see `formatIncomeAwareCurrency` for why the sign is
      // there on top of the colour.
      cell: ({ row }) => {
        const transaction = row.original
        const income = isIncome(transaction)
        return h(
          'span',
          { class: income ? 'text-success' : undefined },
          formatIncomeAwareCurrency(transaction.amount, income)
        )
      }
    },
    {
      accessorKey: 'type',
      header: sortableHeader('Tipo', 'type'),
      meta: sortableMeta(FROM_60)
    },
    {
      accessorKey: 'installment',
      header: 'Parcela',
      meta: responsive(FROM_92, { td: 'tabular-nums' }),
      cell: ({ row }) => row.getValue('installment') ?? '—'
    },
    {
      accessorKey: 'billingMonth',
      header: sortableHeader('Mês ref.', 'billingMonth'),
      meta: sortableMeta(FROM_60, { td: 'whitespace-nowrap' }),
      cell: ({ row }) => formatBillingMonth(row.getValue('billingMonth'))
    },
    {
      accessorKey: 'status',
      header: sortableHeader('Status', 'status'),
      meta: sortableMeta(),
      cell: ({ row }) => {
        const status = row.getValue('status') as Transaction['status']
        return h(UBadge, { color: status === 'Pago' ? 'success' : 'warning', variant: 'subtle' }, () => status)
      }
    },
    {
      accessorKey: 'debtor',
      header: sortableHeader('Devedor', 'debtor'),
      meta: sortableMeta(FROM_92),
      cell: ({ row }) => (row.getValue('debtor') as string) || '—'
    },
    {
      accessorKey: 'reimbursable',
      header: 'A reembolsar',
      meta: responsive(FROM_92),
      cell: ({ row }) => {
        const value = row.getValue('reimbursable') as Transaction['reimbursable']
        return value === 'Sim' ? h(UBadge, { color: 'info', variant: 'subtle' }, () => value) : '—'
      }
    },
    {
      id: 'actions',
      header: '',
      // The row actions are the one thing that must never scroll out
      // of reach, hence pinned right against the sticky edge.
      meta: { class: { th: 'w-0', td: 'w-0' } },
      cell: ({ row }) =>
        h('div', { class: 'flex justify-end gap-1' }, [
          h(UButton, {
            icon: 'i-lucide-pencil',
            color: 'neutral',
            variant: 'ghost',
            size: 'xs',
            'aria-label': `Editar ${row.original.description} (${formatCurrency(row.original.amount)})`,
            onClick: () => onEdit(row.original)
          }),
          h(UButton, {
            icon: 'i-lucide-trash-2',
            color: 'error',
            variant: 'ghost',
            size: 'xs',
            'aria-label': `Excluir ${row.original.description} (${formatCurrency(row.original.amount)})`,
            onClick: () => onDelete(row.original)
          })
        ])
    }
  ]
}
