<!--
  BulkEditModal.vue

  Bulk edit is opt-in per field: the user checks only the fields they
  want to overwrite, and everything unchecked stays exactly as it was
  on each individual row. This component's only state is "which fields
  are enabled + their new value" — it never touches the selected
  transactions directly. It builds a `TransactionPatch` containing only
  the enabled fields and hands it to the parent, which is the one that
  calls `useTransactions().updateMany`.
-->
<script setup lang="ts">
import type { TransactionPatch } from '~/types/transaction'
import { METHODS, TYPES, STATUS, REIMBURSABLE_OPTIONS } from '~/constants/referenceOptions'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  count: number
  saving: boolean
}>()

const emit = defineEmits<{ apply: [patch: TransactionPatch] }>()

const { categories, accounts, debtors } = useReferenceOptions()

interface EditableField {
  key: keyof TransactionPatch
  label: string
  options: string[]
}

const FIELDS = computed<EditableField[]>(() => [
  { key: 'category', label: 'Categoria', options: categories.value },
  { key: 'account', label: 'Conta', options: accounts.value },
  { key: 'method', label: 'Método', options: METHODS },
  { key: 'type', label: 'Tipo', options: TYPES },
  { key: 'debtor', label: 'Devedor', options: debtors.value },
  { key: 'status', label: 'Status', options: STATUS },
  { key: 'reimbursable', label: 'A reembolsar', options: REIMBURSABLE_OPTIONS }
])

const enabled = ref<Partial<Record<keyof TransactionPatch, boolean>>>({})
const values = ref<Partial<Record<keyof TransactionPatch, string>>>({})

const activeFields = computed(() => FIELDS.value.filter((field) => enabled.value[field.key] && values.value[field.key]))

function handleOpenChange(value: boolean): void {
  open.value = value
  if (!value) {
    enabled.value = {}
    values.value = {}
  }
}

function handleApply(): void {
  const patch: TransactionPatch = {}
  for (const field of activeFields.value) {
    // @ts-expect-error -- building a typed patch dynamically from a runtime-enabled field set.
    patch[field.key] = values.value[field.key]
  }
  emit('apply', patch)
}
</script>

<template>
  <UModal :open="open" title="Editar em massa" @update:open="handleOpenChange">
    <template #body>
      <p class="mb-4 text-sm text-muted">
        Marque só os campos que você quer alterar nos {{ props.count }} lançamentos selecionados.
        Os campos não marcados continuam como estavam em cada um.
      </p>

      <div class="flex flex-col divide-y divide-default">
        <div v-for="field in FIELDS" :key="field.key" class="flex items-center gap-3 py-2.5">
          <UCheckbox v-model="enabled[field.key]" />
          <span class="w-24 shrink-0 text-sm font-medium">{{ field.label }}</span>
          <USelectMenu
            v-model="values[field.key]"
            :items="field.options"
            :disabled="!enabled[field.key]"
            placeholder="— sem alteração —"
            class="flex-1"
          />
        </div>
      </div>

      <UAlert
        v-if="activeFields.length > 0"
        class="mt-4"
        color="neutral"
        variant="soft"
        icon="i-lucide-eye"
        title="Prévia"
        :description="activeFields.map((field) => `${field.label} = ${values[field.key]}`).join(' · ')"
      />
    </template>

    <template #footer>
      <div class="ms-auto flex gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="handleOpenChange(false)" />
        <UButton
          :label="`Aplicar a ${props.count} lançamentos`"
          :disabled="activeFields.length === 0"
          :loading="props.saving"
          @click="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
