<!--
  TransactionsTable.vue

  Single responsibility: render the transactions table and forward
  selection/edit/delete/sort intents upward via events. It owns no
  business state — `rows`, `selection`, `sort` and `loading` are all
  passed in, and every mutation (edit, delete, select, re-sort) is
  emitted rather than acted on directly. That's what lets the parent
  page be the only place that decides *what happens* when a row is
  edited or deleted.

  `rows` arrives already filtered, sorted and sliced to the current
  page — this component never reorders or paginates anything, so the
  mobile `TransactionCardList` showing the exact same rows in the
  exact same order is guaranteed by construction rather than by two
  implementations happening to agree.

  Rendered only once its container is at least ~42rem wide; below
  that the page swaps in `TransactionCardList`. Thirteen columns on a
  phone is a horizontal scroll with no orientation, not a table.
-->
<script setup lang="ts">
import { h } from 'vue'
// See `useTransactionColumns` for why this is a real import and not
// `resolveComponent('UCheckbox')`.
import { UCheckbox } from '#components'
import type { TableColumn } from '@nuxt/ui'
import type { Transaction } from '~/types/transaction'
import { useTransactionColumns } from '~/composables/useTransactionColumns'
import type { SortableField, TransactionSort } from '~/utils/sortTransactions'

const props = defineProps<{
  rows: readonly Transaction[]
  loading: boolean
  sort: TransactionSort
}>()

const selection = defineModel<Record<string, boolean>>('selection', { required: true })

const emit = defineEmits<{
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
  sort: [field: SortableField]
}>()

const selectionColumn: TableColumn<Transaction> = {
  id: 'selection',
  meta: { class: { th: 'w-0', td: 'w-0' } },
  header: ({ table }) =>
    h(UCheckbox, {
      modelValue: table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
      'aria-label': 'Selecionar todos os lançamentos desta página',
      // `UCheckbox` types its update handler as `(value: unknown)`
      // (its model is `boolean | 'indeterminate'`), so the parameter
      // has to be `unknown` and get narrowed here — declaring
      // `boolean` and casting would just be a lie the compiler
      // happens to accept.
      'onUpdate:modelValue': (value: unknown) => table.toggleAllPageRowsSelected(value === true)
    }),
  cell: ({ row }) =>
    h(UCheckbox, {
      modelValue: row.getIsSelected(),
      'aria-label': `Selecionar ${row.original.description}`,
      'onUpdate:modelValue': (value: unknown) => row.toggleSelected(value === true)
    })
}

const columns = computed<TableColumn<Transaction>[]>(() => [
  selectionColumn,
  ...useTransactionColumns({
    sort: props.sort,
    onSort: (field) => emit('sort', field),
    onEdit: (transaction) => emit('edit', transaction),
    onDelete: (transaction) => emit('delete', transaction)
  })
])

// Row identity comes from the transaction id, never the row index —
// `useTransactionSelection` relies on this to keep a selection
// pointing at the same transactions across a re-sort or a page
// change. See that composable's header comment for what breaks
// without it.
function getRowId(transaction: Transaction): string {
  return transaction.id
}
</script>

<template>
  <UTable
    v-model:row-selection="selection"
    :data="props.rows as Transaction[]"
    :columns="columns"
    :loading="props.loading"
    :get-row-id="getRowId"
    sticky
    class="min-w-0"
          :ui="{
      base: 'min-w-full',
      // Tighter than the theme default (`px-4`): across 14 columns
      // that padding alone was costing ~110px, which is the
      // difference between showing Categoria on a 1024px laptop and
      // hiding it. Rows stay at `py-2.5` so density comes out of the
      // gutters, not out of the tap targets.
      th: 'px-3',
      td: 'px-3 py-2.5',
      tr: 'data-[selected=true]:bg-elevated/60'
    }"
  />
</template>
