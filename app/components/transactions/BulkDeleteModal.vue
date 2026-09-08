<!--
  BulkDeleteModal.vue

  A destructive bulk action gets its own component, not a generic
  "confirm modal" reused with a message prop — the specificity here
  (listing exactly which transactions are affected) is the point:
  a generic confirm dialog invites the user to click through it
  without reading it.
-->
<script setup lang="ts">
import type { Transaction } from '~/types/transaction'
import { formatCurrency } from '~/utils/formatCurrency'
import { formatShortDate } from '~/utils/formatDate'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  transactions: readonly Transaction[]
  deleting: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <UModal v-model:open="open" :title="`Excluir ${props.transactions.length} lançamentos?`">
    <template #body>
      <p class="mb-3 text-sm text-muted">Essa ação remove permanentemente:</p>
      <ul class="flex flex-col gap-1 text-sm">
        <li v-for="transaction in props.transactions" :key="transaction.id">
          <span class="font-medium">{{ transaction.description }}</span>
          · {{ formatCurrency(transaction.amount) }} · {{ formatShortDate(transaction.date) }}
        </li>
      </ul>
    </template>

    <template #footer>
      <div class="ms-auto flex gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />
        <UButton
          :label="`Excluir ${props.transactions.length} lançamentos`"
          color="error"
          :loading="props.deleting"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
