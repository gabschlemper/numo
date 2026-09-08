<!--
  TransactionFormFields.vue

  The ten form fields shared by "create" and "edit", extracted so
  neither slideover duplicates them. This component is pure
  presentation over a `TransactionDraft`-shaped model — it has no idea
  whether it's creating or editing, and that's exactly why it can be
  reused for both without a `mode` prop leaking through it.
-->
<script setup lang="ts">
import type { TransactionDraft, TransactionPatch } from '~/types/transaction'
import { CATEGORIES, ACCOUNTS, METHODS, TYPES, STATUS, DEBTORS, REIMBURSABLE_OPTIONS } from '~/constants/referenceOptions'

defineProps<{ disabled?: boolean }>()

const draft = defineModel<TransactionDraft | TransactionPatch>({ required: true })

// `installment` is the only `string | null` field of the domain (null
// = "not an installment"). `UInput` only accepts `string | undefined`,
// so this proxy is the only conversion needed — the rest of the form
// never needs to know `null` exists.
const installment = computed<string | undefined>({
  get: () => draft.value.installment ?? undefined,
  set: (value) => {
    draft.value.installment = value && value.trim() !== '' ? value : null
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField label="Descrição" name="description">
      <UInput v-model="draft.description" :disabled="disabled" class="w-full" />
    </UFormField>

    <div class="grid grid-cols-2 gap-3">
      <UFormField label="Data" name="date">
        <UInput v-model="draft.date" type="date" :disabled="disabled" class="w-full" />
      </UFormField>
      <UFormField label="Valor" name="amount">
        <UInputNumber v-model="draft.amount" :min="0" :step="0.01" :disabled="disabled" class="w-full" />
      </UFormField>
    </div>

    <UFormField label="Categoria" name="category">
      <USelectMenu v-model="draft.category" :items="CATEGORIES" :disabled="disabled" class="w-full" />
    </UFormField>

    <div class="grid grid-cols-2 gap-3">
      <UFormField label="Conta" name="account">
        <USelectMenu v-model="draft.account" :items="ACCOUNTS" :disabled="disabled" class="w-full" />
      </UFormField>
      <UFormField label="Método" name="method">
        <USelectMenu v-model="draft.method" :items="METHODS" :disabled="disabled" class="w-full" />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <UFormField label="Tipo" name="type">
        <USelectMenu v-model="draft.type" :items="TYPES" :disabled="disabled" class="w-full" />
      </UFormField>
      <UFormField label="Parcela" name="installment">
        <UInput v-model="installment" placeholder="Ex: 3/12 (opcional)" :disabled="disabled" class="w-full" />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <UFormField label="Devedor" name="debtor" description="Sempre um terceiro — nunca você ou a Gabi.">
        <USelectMenu v-model="draft.debtor" :items="DEBTORS" :disabled="disabled" class="w-full" />
      </UFormField>
      <UFormField label="Status" name="status">
        <USelectMenu v-model="draft.status" :items="STATUS" :disabled="disabled" class="w-full" />
      </UFormField>
    </div>

    <UFormField
      label="A reembolsar"
      name="reimbursable"
      description="Só 'Sim' quando você adiantou o dinheiro e será reembolsada especificamente por isso — não marque só por ter um Devedor preenchido."
    >
      <USelectMenu v-model="draft.reimbursable" :items="REIMBURSABLE_OPTIONS" :disabled="disabled" class="w-full" />
    </UFormField>
  </div>
</template>
