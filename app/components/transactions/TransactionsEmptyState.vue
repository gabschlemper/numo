<!--
  TransactionsEmptyState.vue

  Two empty screens that look the same to the code and mean opposite
  things to the user, so they're told apart here:

  • "Nothing matches these filters" — the data exists, the query is
    wrong. The way out is to widen the query, so the primary action
    is "Limpar filtros" and the message names the search term that
    produced nothing.

  • "There's nothing here yet" — the query is fine, the ledger is
    empty. The way out is to put something in it, so the actions are
    the same three the page header offers.

  The previous single message ("Nenhum lançamento encontrado para os
  filtros atuais") was shown in both cases, which told a first-time
  user with an empty account to go fix filters they never set.
-->
<script setup lang="ts">
const props = defineProps<{
  /** True when the list is empty *because of* the active filters. */
  filtered: boolean
  /** The current search term, echoed back so the user sees what was searched. */
  search: string
}>()

const emit = defineEmits<{
  clear: []
  create: []
  import: []
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-3 rounded-[--ui-radius] border border-dashed border-default px-4 py-12 text-center">
    <UIcon :name="props.filtered ? 'i-lucide-search-x' : 'i-lucide-inbox'" class="size-9 text-dimmed" />

    <template v-if="props.filtered">
      <div class="space-y-1">
        <p class="font-medium">Nenhum lançamento encontrado</p>
        <p class="max-w-md text-sm text-muted">
          <template v-if="props.search.trim() !== ''">
            Nada corresponde a "{{ props.search.trim() }}" com os filtros aplicados.
          </template>
          <template v-else>
            Nenhum lançamento corresponde aos filtros aplicados.
          </template>
          Remova algum filtro para ver mais resultados.
        </p>
      </div>
      <UButton label="Limpar filtros" icon="i-lucide-filter-x" color="neutral" variant="outline" @click="emit('clear')" />
    </template>

    <template v-else>
      <div class="space-y-1">
        <p class="font-medium">Nenhum lançamento ainda</p>
        <p class="max-w-md text-sm text-muted">
          Comece adicionando um lançamento manualmente ou importando a planilha que você já usa.
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <UButton label="Novo lançamento" icon="i-lucide-plus" @click="emit('create')" />
        <UButton label="Importar planilha" icon="i-lucide-file-down" color="neutral" variant="outline" @click="emit('import')" />
      </div>
    </template>
  </div>
</template>
