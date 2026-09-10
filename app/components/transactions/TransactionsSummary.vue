<!--
  TransactionsSummary.vue

  The answer to "what am I looking at?", which the screen previously
  never gave: a list of 50 rows told you nothing about whether the
  month closed positive, and a filtered list told you even less.

  Two deliberate choices here, both about not lying to the user:

  • The numbers describe the FILTERED list, not the whole ledger, and
    the component says so out loud when a filter is on. A summary
    that silently switches between "everything" and "what's on
    screen" is worse than no summary.

  • It renders skeletons while loading instead of zeros. "R$ 0,00" is
    a real, alarming answer to "how much did I earn" — an empty
    placeholder is honest about not knowing yet.

  Pure presentation: it computes nothing. Every number comes from
  `summarizeTransactions` (see that util for the income/expense
  rules), handed down as one object.
-->
<script setup lang="ts">
import type { TransactionsSummary } from '~/utils/summarizeTransactions'
import { formatCurrency } from '~/utils/formatCurrency'

const props = defineProps<{
  summary: TransactionsSummary
  /** Whether any filter is narrowing the list these numbers describe. */
  filtered: boolean
  loading: boolean
}>()

const showSkeleton = computed(() => props.loading && props.summary.count === 0)
</script>

<template>
  <section aria-label="Resumo dos lançamentos" class="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
    <div class="rounded-[--ui-radius] border border-default bg-default p-3">
      <p class="flex items-center gap-1.5 text-xs text-muted">
        <UIcon name="i-lucide-trending-up" class="size-3.5 shrink-0" />
        Receitas
      </p>
      <USkeleton v-if="showSkeleton" class="mt-2 h-6 w-24" />
      <p v-else class="mt-1 text-lg font-semibold tabular-nums text-success">
        {{ formatCurrency(props.summary.income) }}
      </p>
    </div>

    <div class="rounded-[--ui-radius] border border-default bg-default p-3">
      <p class="flex items-center gap-1.5 text-xs text-muted">
        <UIcon name="i-lucide-trending-down" class="size-3.5 shrink-0" />
        Despesas
      </p>
      <USkeleton v-if="showSkeleton" class="mt-2 h-6 w-24" />
      <p v-else class="mt-1 text-lg font-semibold tabular-nums">
        {{ formatCurrency(props.summary.expenses) }}
      </p>
      <p v-if="!showSkeleton && props.summary.reimbursable > 0" class="mt-0.5 truncate text-xs text-muted">
        {{ formatCurrency(props.summary.reimbursable) }} a reembolsar
      </p>
    </div>

    <div class="rounded-[--ui-radius] border border-default bg-default p-3">
      <p class="flex items-center gap-1.5 text-xs text-muted">
        <UIcon name="i-lucide-wallet" class="size-3.5 shrink-0" />
        Saldo
      </p>
      <USkeleton v-if="showSkeleton" class="mt-2 h-6 w-24" />
      <p
        v-else
        class="mt-1 text-lg font-semibold tabular-nums"
        :class="props.summary.balance < 0 ? 'text-error' : 'text-success'"
      >
        {{ formatCurrency(props.summary.balance) }}
      </p>
    </div>

    <div class="rounded-[--ui-radius] border border-default bg-default p-3">
      <p class="flex items-center gap-1.5 text-xs text-muted">
        <UIcon name="i-lucide-clock" class="size-3.5 shrink-0" />
        Pendentes
      </p>
      <USkeleton v-if="showSkeleton" class="mt-2 h-6 w-16" />
      <p v-else class="mt-1 text-lg font-semibold tabular-nums">
        {{ props.summary.pendingCount }}
      </p>
      <p v-if="!showSkeleton" class="mt-0.5 truncate text-xs text-muted">
        de {{ props.summary.count }} {{ props.summary.count === 1 ? 'lançamento' : 'lançamentos' }}
      </p>
    </div>

    <p v-if="props.filtered" class="col-span-full flex items-center gap-1.5 text-xs text-muted">
      <UIcon name="i-lucide-funnel" class="size-3.5 shrink-0" />
      Números referentes apenas aos lançamentos filtrados.
    </p>
  </section>
</template>
