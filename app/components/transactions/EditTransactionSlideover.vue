<!--
  EditTransactionSlideover.vue

  Edits ONE existing transaction — `transaction` is required and never
  null, deliberately: a component whose prop is "required" but gets
  passed null anyway is a lie SOLID/clean-code review would (rightly)
  flag. Creating a new transaction is a different intent with a
  different payload shape (`TransactionDraft` has no `id`), so it's a
  separate component, `CreateTransactionSlideover.vue` — both share the
  same field set via `TransactionFormFields.vue`.
-->
<script setup lang="ts">
import type { Transaction, TransactionPatch } from '~/types/transaction'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  transaction: Transaction
  saving: boolean
}>()

const emit = defineEmits<{
  save: [id: string, patch: TransactionPatch]
  delete: [transaction: Transaction]
}>()

const draft = ref<TransactionPatch>({ ...props.transaction })

watch(
  () => props.transaction,
  (transaction) => {
    draft.value = { ...transaction }
  }
)

function handleSave(): void {
  emit('save', props.transaction.id, draft.value)
}
</script>

<template>
  <USlideover v-model:open="open" title="Editar lançamento" :description="`${transaction.description} · ${transaction.date}`">
    <template #body>
      <TransactionFormFields v-model="draft" />
    </template>

    <template #footer>
      <UButton label="Excluir" color="error" variant="ghost" icon="i-lucide-trash-2" @click="emit('delete', transaction)" />
      <div class="ms-auto flex gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />
        <UButton label="Salvar" :loading="props.saving" @click="handleSave" />
      </div>
    </template>
  </USlideover>
</template>
