<!--
  ActiveFilterChips.vue

  Shows, as removable chips, every constraint currently narrowing the
  list — including the free-text search.

  This is the counterpart to collapsing the filter panel: the moment
  the seven selects stop being permanently on screen, "why am I only
  seeing 12 rows?" becomes a question the interface has to keep
  answering by itself. Chips answer it without the user having to
  remember what they picked or reopen anything, and each one is also
  the undo for that single choice — cheaper than "Limpar filtros",
  which throws away the other six.

  Owns no state: it reads and writes the parent's `TransactionFilters`
  through `defineModel`, and the mapping from that object to the chip
  list is the pure `describeActiveFilters` (utils/).
-->
<script setup lang="ts">
import type { TransactionFilters } from '~/types/filters'
import { describeActiveFilters, type ListFilterKey } from '~/utils/describeFilters'

const filters = defineModel<TransactionFilters>({ required: true })

const chips = computed(() => describeActiveFilters(filters.value))
const hasSearch = computed(() => filters.value.search.trim() !== '')

function removeValue(key: ListFilterKey, value: string): void {
  filters.value = {
    ...filters.value,
    [key]: (filters.value[key] as string[]).filter((item) => item !== value)
  }
}

function clearSearch(): void {
  filters.value = { ...filters.value, search: '' }
}
</script>

<template>
  <div v-if="hasSearch || chips.length > 0" class="flex flex-wrap items-center gap-1.5">
    <span class="text-xs text-muted">Filtros ativos:</span>

    <UBadge
      v-if="hasSearch"
      color="neutral"
      variant="outline"
      size="sm"
      class="max-w-full gap-1 pe-1"
    >
      <span class="truncate">Busca: "{{ filters.search.trim() }}"</span>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="xs"
        :aria-label="`Remover a busca por ${filters.search.trim()}`"
        class="-me-0.5 p-0.5"
        @click="clearSearch"
      />
    </UBadge>

    <UBadge
      v-for="chip in chips"
      :key="`${chip.key}-${chip.value}`"
      color="neutral"
      variant="outline"
      size="sm"
      class="max-w-full gap-1 pe-1"
    >
      <span class="truncate">{{ chip.label }}: {{ chip.value }}</span>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="xs"
        :aria-label="`Remover o filtro ${chip.label}: ${chip.value}`"
        class="-me-0.5 p-0.5"
        @click="removeValue(chip.key, chip.value)"
      />
    </UBadge>
  </div>
</template>
