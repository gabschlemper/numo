// app/composables/useTransactionColumns.ts
//
// Column definitions for `TransactionsTable`, isolated from the
// component itself: the table component's only job is to render
// `<UTable :columns :data />` plus wire up the actions column's
// events. Cell presentation (currency formatting, status badge color)
// lives here so it can change without touching the table component,
// and vice-versa.
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Transaction } from '~/types/transaction'
import { formatCurrency } from '~/utils/formatCurrency'
import { formatShortDate } from '~/utils/formatDate'

interface ColumnOptions {
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

export function useTransactionColumns({ onEdit, onDelete }: ColumnOptions): TableColumn<Transaction>[] {
  const UBadge = resolveComponent('UBadge')
  const UButton = resolveComponent('UButton')

  return [
    {
      accessorKey: 'date',
      header: 'Data',
      cell: ({ row }) => formatShortDate(row.getValue('date'))
    },
    {
      accessorKey: 'description',
      header: 'Descrição'
    },
    {
      accessorKey: 'category',
      header: 'Categoria'
    },
    {
      accessorKey: 'account',
      header: 'Conta'
    },
    {
      accessorKey: 'method',
      header: 'Método'
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      meta: { class: { th: 'text-right', td: 'text-right font-medium' } },
      cell: ({ row }) => formatCurrency(row.getValue('amount'))
    },
    {
      accessorKey: 'type',
      header: 'Tipo'
    },
    {
      accessorKey: 'installment',
      header: 'Parcela',
      cell: ({ row }) => row.getValue('installment') ?? '—'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Transaction['status']
        return h(UBadge, { color: status === 'Pago' ? 'success' : 'warning', variant: 'subtle' }, () => status)
      }
    },
    {
      accessorKey: 'debtor',
      header: 'Devedor'
    },
    {
      accessorKey: 'reimbursable',
      header: 'A reembolsar',
      cell: ({ row }) => {
        const value = row.getValue('reimbursable') as Transaction['reimbursable']
        return value === 'Sim' ? h(UBadge, { color: 'info', variant: 'subtle' }, () => value) : '—'
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        h('div', { class: 'flex justify-end gap-1' }, [
          h(UButton, {
            icon: 'i-lucide-pencil',
            color: 'neutral',
            variant: 'ghost',
            size: 'xs',
            'aria-label': 'Editar lançamento',
            onClick: () => onEdit(row.original)
          }),
          h(UButton, {
            icon: 'i-lucide-trash-2',
            color: 'error',
            variant: 'ghost',
            size: 'xs',
            'aria-label': 'Excluir lançamento',
            onClick: () => onDelete(row.original)
          })
        ])
    }
  ]
}
