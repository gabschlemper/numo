<!--
  CreateTransactionSlideover.vue

  Creates a single new transaction. Kept separate from
  EditTransactionSlideover.vue on purpose — see that file's header
  comment for why merging them behind a nullable prop would be a
  design smell rather than a simplification.
-->
<script setup lang="ts">
import type { TransactionDraft } from '~/types/transaction'
import { todayIso } from '~/utils/formatDate'
import { billingMonthFromDate } from '~/utils/billingMonth'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{ saving: boolean }>()

const emit = defineEmits<{ create: [draft: TransactionDraft] }>()

function initialDraft(): TransactionDraft {
  return {
    date: todayIso(),
    description: '',
    category: '',
    account: '',
    method: 'Crédito',
    amount: 0,
    type: 'Variável',
    installment: null,
    status: 'Pendente',
    debtor: '',
    reimbursable: 'Não',
    billingMonth: billingMonthFromDate(todayIso())
  }
}

const draft = ref<TransactionDraft>(initialDraft())

watch(open, (value) => {
  if (value) draft.value = initialDraft()
})

function handleCreate(): void {
  emit('create', draft.value)
}
</script>

<template>
  <USlideover v-model:open="open" title="Novo lançamento">
    <template #body>
      <TransactionFormFields v-model="draft" />
    </template>

    <template #footer>
      <div class="ms-auto flex gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />
        <UButton label="Criar lançamento" :loading="props.saving" @click="handleCreate" />
      </div>
    </template>
  </USlideover>
</template>
