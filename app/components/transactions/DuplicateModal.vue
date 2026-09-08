<!--
  DuplicateModal.vue

  Creates copies of the selected transactions with an optional new date
  and a status for the copies (defaults to "Pendente" — a duplicated
  entry is, by definition, something the user hasn't confirmed yet).
-->
<script setup lang="ts">
import type { DuplicateOptions, TransactionStatus } from '~/types/transaction'
import { STATUS } from '~/constants/referenceOptions'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  count: number
  duplicating: boolean
}>()

const emit = defineEmits<{ confirm: [options: DuplicateOptions] }>()

const newDate = ref<string>()
const status = ref<TransactionStatus>('Pendente')

function handleConfirm(): void {
  emit('confirm', { newDate: newDate.value ?? null, status: status.value })
}
</script>

<template>
  <UModal v-model:open="open" title="Duplicar lançamentos" :description="`Cria ${props.count} cópias novas, com o mesmo id gerado de novo.`">
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="Nova data (opcional)" description="Deixe em branco para manter a mesma data do original em cada cópia.">
          <UInput v-model="newDate" type="date" class="w-full" />
        </UFormField>

        <UFormField label="Status das cópias">
          <USelectMenu v-model="status" :items="STATUS" class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="ms-auto flex gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />
        <UButton :label="`Duplicar ${props.count} lançamentos`" :loading="props.duplicating" @click="handleConfirm" />
      </div>
    </template>
  </UModal>
</template>
