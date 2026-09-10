<!--
  TransactionCardList.vue

  The phone rendering of the exact same rows `TransactionsTable`
  shows on wider screens — same list, already filtered, sorted and
  paginated by the page, so the two can't disagree about what "row 3"
  is.

  Why a card list instead of letting the table scroll sideways: a
  table only works while the leftmost column stays on screen to
  anchor every other value. Below ~42rem of container width it
  doesn't, so each row loses
  the one thing that made its cells readable and the user is left
  swiping through anonymous numbers. Cards re-attach every value to
  its own row and put the two fields that actually identify a
  transaction — what it was, how much it cost — on the first line.

  Everything else follows the "recognition rather than recall"
  heuristic: date, category and account are labelled inline instead of
  living in a header far off-screen, and status only takes up space
  when it isn't the boring default.

  Same contract as the table: owns nothing, emits intent.
-->
<script setup lang="ts">
import type { Transaction } from '~/types/transaction'
import { formatIncomeAwareCurrency } from '~/utils/formatCurrency'
import { formatShortDate } from '~/utils/formatDate'
import { isIncome } from '~/utils/summarizeTransactions'

const props = defineProps<{
  rows: readonly Transaction[]
  loading: boolean
}>()

const selection = defineModel<Record<string, boolean>>('selection', { required: true })

const emit = defineEmits<{
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
}>()

function isSelected(id: string): boolean {
  return selection.value[id] === true
}

function toggle(id: string, checked: boolean): void {
  // Rebuilt rather than mutated so the parent's `watch` on the
  // selection object fires — the same reason `clearSelection()`
  // reassigns instead of deleting keys. Unchecking drops the key
  // entirely (rather than setting it to `false`) so the object stays
  // the same shape `UTable`'s own row-selection model produces.
  selection.value = Object.fromEntries(
    Object.entries({ ...selection.value, [id]: checked }).filter(([, isSelected]) => isSelected)
  )
}

function menuItems(transaction: Transaction) {
  return [
    [
      { label: 'Editar', icon: 'i-lucide-pencil', onSelect: () => emit('edit', transaction) },
      { label: 'Excluir', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => emit('delete', transaction) }
    ]
  ]
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <!--
      A skeleton, not a spinner: it reserves the space the rows are
      about to take, so the screen doesn't jump when they arrive and
      the user can already see how much is coming.
    -->
    <template v-if="props.loading && props.rows.length === 0">
      <div v-for="index in 5" :key="`skeleton-${index}`" class="rounded-[--ui-radius] border border-default p-3">
        <div class="flex items-start justify-between gap-3">
          <USkeleton class="h-4 w-40" />
          <USkeleton class="h-4 w-20" />
        </div>
        <USkeleton class="mt-3 h-3 w-32" />
      </div>
    </template>

    <article
      v-for="transaction in props.rows"
      :key="transaction.id"
      class="flex items-start gap-1 rounded-[--ui-radius] border border-default bg-default p-2 transition-colors"
      :class="isSelected(transaction.id) ? 'border-primary bg-elevated/60' : ''"
    >
      <!--
        The checkbox gets its own padded hit area (44px, the minimum
        comfortable touch target) so selecting a row and opening a row
        are never the same tap by accident.
      -->
      <label class="flex size-11 shrink-0 cursor-pointer items-center justify-center">
        <UCheckbox
          :model-value="isSelected(transaction.id)"
          :aria-label="`Selecionar ${transaction.description}`"
          @update:model-value="(value: unknown) => toggle(transaction.id, value === true)"
        />
      </label>

      <!-- Tapping the body edits: on a phone the row IS the button. -->
      <button
        type="button"
        class="min-w-0 flex-1 rounded-[--ui-radius] px-1 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="emit('edit', transaction)"
      >
        <div class="flex items-baseline justify-between gap-3">
          <span class="truncate text-sm font-medium">{{ transaction.description }}</span>
          <span
            class="shrink-0 text-sm font-semibold tabular-nums"
            :class="isIncome(transaction) ? 'text-success' : ''"
          >
            {{ formatIncomeAwareCurrency(transaction.amount, isIncome(transaction)) }}
          </span>
        </div>

        <p class="mt-1 truncate text-xs text-muted">
          {{ formatShortDate(transaction.date) }} · {{ transaction.category }} · {{ transaction.account }}
        </p>

        <div class="mt-2 flex flex-wrap items-center gap-1">
          <UBadge :color="transaction.status === 'Pago' ? 'success' : 'warning'" variant="subtle" size="sm">
            {{ transaction.status }}
          </UBadge>
          <UBadge v-if="transaction.installment" color="neutral" variant="subtle" size="sm">
            {{ transaction.installment }}
          </UBadge>
          <UBadge v-if="transaction.reimbursable === 'Sim'" color="info" variant="subtle" size="sm">
            A reembolsar
          </UBadge>
          <UBadge v-if="transaction.debtor" color="neutral" variant="outline" size="sm">
            {{ transaction.debtor }}
          </UBadge>
        </div>
      </button>

      <UDropdownMenu :items="menuItems(transaction)">
        <UButton
          icon="i-lucide-ellipsis-vertical"
          color="neutral"
          variant="ghost"
          :aria-label="`Ações para ${transaction.description}`"
          class="size-11 shrink-0 justify-center"
        />
      </UDropdownMenu>
    </article>
  </div>
</template>
