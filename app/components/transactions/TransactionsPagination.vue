<!--
  TransactionsPagination.vue

  The footer under the list: where you are in it, how many rows there
  are, and how to move.

  The "Mostrando 1–25 de 137" line is the part that matters most and
  it's shown even when there's only one page — it's the screen's
  answer to "did my filter do anything?", and a count that appears
  and disappears depending on the row total is a count nobody learns
  to look for. The page controls themselves only render when there's
  more than one page, since a disabled pager is just noise.

  Owns no state: page and page size are `defineModel`s belonging to
  `useTransactionPagination` up in the page.
-->
<script setup lang="ts">
import { PAGE_SIZE_OPTIONS } from '~/constants/pagination'

const page = defineModel<number>('page', { required: true })
const pageSize = defineModel<number>('pageSize', { required: true })

const props = defineProps<{
  rangeStart: number
  rangeEnd: number
  total: number
  /** Total before filtering, so the user can tell a filter apart from an empty ledger. */
  grandTotal: number
}>()

const pageSizeItems = PAGE_SIZE_OPTIONS.map((size) => ({ label: `${size} por página`, value: size }))

const isFiltered = computed(() => props.total !== props.grandTotal)
</script>

<template>
  <div class="flex flex-col-reverse items-center justify-between gap-3 border-t border-default pt-3 sm:flex-row">
    <div class="flex items-center gap-3">
      <p class="text-sm text-muted">
        Mostrando <span class="font-medium text-default tabular-nums">{{ props.rangeStart }}–{{ props.rangeEnd }}</span>
        de <span class="font-medium text-default tabular-nums">{{ props.total }}</span>
        <template v-if="isFiltered"> (de {{ props.grandTotal }} no total)</template>
      </p>

      <USelectMenu
        v-model="pageSize"
        :items="pageSizeItems"
        value-key="value"
        size="xs"
        class="hidden w-36 sm:block"
      />
    </div>

    <UPagination
      v-if="props.total > pageSize"
      v-model:page="page"
      :total="props.total"
      :items-per-page="pageSize"
      :sibling-count="1"
      size="sm"
      show-edges
    />
  </div>
</template>
