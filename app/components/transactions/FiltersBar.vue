<!--
  FiltersBar.vue

  Search + the seven multi-selects, plus the chips that report what's
  currently applied. Owns no filter state itself — everything is bound
  via `defineModel` to the parent's `TransactionFilters`, so this
  component is pure presentation over state it doesn't own (Single
  Responsibility: UI only, no filtering logic — that lives in
  `filterTransactions`).

  Why the selects are collapsed behind a "Filtros" toggle now:
  seven always-open dropdowns took a full row on a laptop and roughly
  half a phone screen before a single transaction was visible, which
  is the whole "aesthetic and minimalist design" problem — the
  controls were louder than the data they filter. Collapsed, they cost
  one line; expanded, they get a grid that actually fits the viewport
  (1 column on a phone, 2 on a tablet, 4 on a desktop) instead of
  wrapping fixed-width boxes into a ragged pile.

  Collapsing is only safe because nothing about the current filter
  state is hidden with it:
    • the button carries a badge with the number of active filters;
    • `ActiveFilterChips` lists every one of them, individually
      removable, whether the panel is open or shut;
    • the panel starts open whenever filters are already applied.
  A collapsed panel that hid all three would be the classic version
  of this control that users complain "lost" their data.

  `UCollapsible` (inline) rather than a popover or a drawer: one code
  path at every breakpoint, no portal, and on a phone the expanded
  panel gets the full width instead of a cramped floating card.
-->
<script setup lang="ts">
import type { TransactionFilters } from '~/types/filters'
import { areFiltersEmpty } from '~/types/filters'
import { countActiveFilters } from '~/utils/describeFilters'
// Só os enums fechados vêm de constantes; categorias/contas/devedores
// são dado do usuário e vêm de `useReferenceOptions` (ver lá o porquê).
import { METHODS, TYPES, STATUS, REIMBURSABLE_OPTIONS } from '~/constants/referenceOptions'

const { categories, accounts, debtors } = useReferenceOptions()

const filters = defineModel<TransactionFilters>({ required: true })

const emit = defineEmits<{ clear: [] }>()

const hasActiveFilters = computed(() => !areFiltersEmpty(filters.value))
const activeCount = computed(() => countActiveFilters(filters.value))

// Open on arrival only if there's already something to see. Someone
// coming back to a filtered screen needs the controls; someone
// arriving clean needs the rows.
const panelOpen = ref(hasActiveFilters.value)

const FIELDS = computed(() => [
  { key: 'categories', label: 'Categoria', items: categories.value },
  { key: 'accounts', label: 'Conta', items: accounts.value },
  { key: 'methods', label: 'Método', items: METHODS },
  { key: 'types', label: 'Tipo', items: TYPES },
  { key: 'debtors', label: 'Devedor', items: debtors.value },
  { key: 'status', label: 'Status', items: STATUS },
  { key: 'reimbursable', label: 'A reembolsar', items: REIMBURSABLE_OPTIONS }
] as const)
</script>

<template>
  <div class="flex flex-col gap-3 rounded-[--ui-radius] border border-default bg-default p-3">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <!--
        A real `<label>` rather than an `aria-label` attribute: a
        placeholder disappears the moment you start typing, so it can't
        be the field's only name, and Nuxt UI types its components'
        props strictly enough that a stray `aria-label` is a
        type error anyway.
      -->
      <label for="transactions-search" class="sr-only">Buscar lançamentos por descrição</label>
      <UInput
        id="transactions-search"
        v-model="filters.search"
        icon="i-lucide-search"
        placeholder="Buscar por descrição..."
        class="w-full sm:flex-1"
        :ui="{ trailing: 'pe-1' }"
      >
        <!-- An input you can't empty in one gesture is a small trap on a phone. -->
        <template v-if="filters.search !== ''" #trailing>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Limpar busca"
            @click="filters.search = ''"
          />
        </template>
      </UInput>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-sliders-horizontal"
          color="neutral"
          variant="outline"
          class="flex-1 justify-center sm:flex-none"
          :aria-expanded="panelOpen"
          aria-controls="filters-panel"
          @click="panelOpen = !panelOpen"
        >
          Filtros
          <UBadge v-if="activeCount > 0" color="primary" variant="solid" size="sm">{{ activeCount }}</UBadge>
          <UIcon
            name="i-lucide-chevron-down"
            class="size-4 transition-transform duration-150"
            :class="panelOpen ? 'rotate-180' : ''"
          />
        </UButton>

        <UButton
          v-if="hasActiveFilters"
          label="Limpar"
          icon="i-lucide-filter-x"
          color="neutral"
          variant="ghost"
          @click="emit('clear')"
        />
      </div>
    </div>

    <UCollapsible v-model:open="panelOpen">
      <template #content>
        <div id="filters-panel" class="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-4">
          <UFormField v-for="field in FIELDS" :key="field.key" :label="field.label" size="sm">
            <USelectMenu
              v-model="filters[field.key]"
              :items="(field.items as unknown as string[])"
              multiple
              placeholder="Sem filtro"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
    </UCollapsible>

    <ActiveFilterChips v-model="filters" />
  </div>
</template>
