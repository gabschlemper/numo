<!--
  TransactionsTable.vue

  Single responsibility: render the transactions table and forward
  selection/edit/delete intents upward via events. It owns no business
  state — `rows`, `selection` and `loading` are all passed in, and
  every mutation (edit, delete, select) is emitted rather than acted on
  directly. That's what lets the parent page be the only place that
  decides *what happens* when a row is edited or deleted.
-->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Transaction } from '~/types/transaction'
import { useTransactionColumns } from '~/composables/useTransactionColumns'

const props = defineProps<{
  rows: Transaction[]
  loading: boolean
}>()

const selection = defineModel<Record<string, boolean>>('selection', { required: true })

const emit = defineEmits<{
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
}>()

const UCheckbox = resolveComponent('UCheckbox')

const selectionColumn: TableColumn<Transaction> = {
  id: 'selection',
  header: ({ table }) =>
    h(UCheckbox, {
      modelValue: table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
      'aria-label': 'Selecionar todas as linhas desta página',
      'onUpdate:modelValue': (value: boolean) => table.toggleAllPageRowsSelected(!!value)
    }),
  cell: ({ row }) =>
    h(UCheckbox, {
      modelValue: row.getIsSelected(),
      'aria-label': 'Selecionar lançamento',
      'onUpdate:modelValue': (value: boolean) => row.toggleSelected(!!value)
    })
}

const columns = computed<TableColumn<Transaction>[]>(() => [
  selectionColumn,
  ...useTransactionColumns({
    onEdit: (transaction) => emit('edit', transaction),
    onDelete: (transaction) => emit('delete', transaction)
  })
])
</script>

<template>
  <UTable
    v-model:row-selection="selection"
    :data="props.rows"
    :columns="columns"
    :loading="props.loading"
    sticky
    class="flex-1"
  >
    <template #empty>
      <div class="flex flex-col items-center gap-2 py-10 text-center">
        <UIcon name="i-lucide-inbox" class="size-8 text-muted" />
        <p class="text-sm text-muted">Nenhum lançamento encontrado para os filtros atuais.</p>
      </div>
    </template>
  </UTable>
</template>
