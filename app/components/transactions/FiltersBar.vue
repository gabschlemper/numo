<!--
  FiltersBar.vue

  Renders the search input + one USelectMenu per filterable field.
  Owns no filter state itself — everything is bound via `defineModel`
  to the parent's `TransactionFilters`, so this component is pure
  presentation over state it doesn't own (Single Responsibility: UI
  only, no filtering logic — that lives in `filterTransactions`).
-->
<script setup lang="ts">
import type { TransactionFilters } from '~/types/filters'
import { areFiltersEmpty } from '~/types/filters'
import { CATEGORIES, ACCOUNTS, METHODS, TYPES, STATUS, DEBTORS, REIMBURSABLE_OPTIONS } from '~/constants/referenceOptions'

const filters = defineModel<TransactionFilters>({ required: true })

const emit = defineEmits<{ clear: [] }>()

const hasActiveFilters = computed(() => !areFiltersEmpty(filters.value))
</script>

<template>
  <UCard :ui="{ body: 'flex flex-wrap items-center gap-2 py-3' }">
    <UInput
      v-model="filters.search"
      icon="i-lucide-search"
      placeholder="Buscar descrição..."
      class="min-w-56 flex-1"
    />

    <USelectMenu
      v-model="filters.categories"
      :items="CATEGORIES"
      multiple
      placeholder="Categoria"
      class="w-40"
    />
    <USelectMenu
      v-model="filters.accounts"
      :items="ACCOUNTS"
      multiple
      placeholder="Conta"
      class="w-36"
    />
    <USelectMenu
      v-model="filters.methods"
      :items="METHODS"
      multiple
      placeholder="Método"
      class="w-36"
    />
    <USelectMenu
      v-model="filters.types"
      :items="TYPES"
      multiple
      placeholder="Tipo"
      class="w-36"
    />
    <USelectMenu
      v-model="filters.debtors"
      :items="DEBTORS"
      multiple
      placeholder="Devedor"
      class="w-32"
    />
    <USelectMenu
      v-model="filters.status"
      :items="STATUS"
      multiple
      placeholder="Status"
      class="w-32"
    />
    <USelectMenu
      v-model="filters.reimbursable"
      :items="REIMBURSABLE_OPTIONS"
      multiple
      placeholder="A reembolsar"
      class="w-36"
    />

    <UButton
      v-if="hasActiveFilters"
      label="Limpar filtros"
      color="neutral"
      variant="link"
      size="sm"
      @click="emit('clear')"
    />
  </UCard>
</template>
