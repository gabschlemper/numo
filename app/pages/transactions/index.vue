<!--
  pages/transactions/index.vue

  The only place in the codebase allowed to decide WHAT HAPPENS when a
  user acts (which modal opens, which composable action runs, when a
  toast fires). Every component below it is either pure presentation
  (FiltersBar, TransactionsTable, TransactionCardList, ...) or a
  self-contained interaction (the modals/slideovers) that only emits
  intent. This is what keeps each of those pieces independently
  testable and independently reusable — none of them know this page
  exists.

  Every mutation below follows the same shape: set a `saving`/`deleting`
  flag, try the action, toast on success, catch-and-toast on failure,
  reset the flag in `finally`. `useTransactions()`'s `run()` wrapper
  already records the error in shared state and rethrows — this page's
  job is just to turn that rejection into visible feedback, per action,
  since a bulk-edit failing has to be as visible as a single edit
  failing. To manually test any of these paths, give a transaction's
  description the text "forçar erro" (see MockTransactionRepository).

  The rows travel through a fixed pipeline, each stage a composable
  that knows nothing about the others:

      transactions → filter → sort → paginate → the two renderers

  Both renderers (the wide table and the phone card list) consume the
  SAME paginated array, which is why they can never disagree about
  what's on screen. Selection and the summary read the *filtered*
  list, not the paginated one — "12 selecionados" and "Saldo" are
  answers about the whole result set, not about the page you happen
  to be looking at.

  The root element is the `@container` every responsive rule on this
  screen measures against — the table/card switch here, and the
  per-column tiers in `useTransactionColumns`. Viewport breakpoints
  would be wrong for all of them: this element sits beside a 224px
  sidebar on desktop and gets the full width once that sidebar
  collapses, so "how wide is the window" and "how much room does the
  list have" are two different numbers.
-->
<script setup lang="ts">
import type { Transaction } from '~/types/transaction'
import { areFiltersEmpty } from '~/types/filters'

const toast = useToast()

const { transactions, loading, error, load, createMany, update, updateMany, duplicate, remove } = useTransactions()
const { filters, filteredTransactions, clearFilters } = useTransactionFilters(transactions)
const { sort, sortedTransactions, toggleSort } = useTransactionSorting(filteredTransactions)
const { page, pageSize, total, paginatedTransactions, rangeStart, rangeEnd, resetPage } =
  useTransactionPagination(sortedTransactions)
const { selection, selectedIds, selectedTransactions, selectedCount, hasSelection, clearSelection } =
  useTransactionSelection(filteredTransactions)
const { summary } = useTransactionSummary(filteredTransactions)

await useAsyncData('initial-transactions', load)

const hasActiveFilters = computed(() => !areFiltersEmpty(filters.value))

// Narrowing the list while parked on page 3 would otherwise land the
// user on an empty page and read as "the filter found nothing".
watch(filters, resetPage, { deep: true })

const showEmptyState = computed(() => !loading.value && filteredTransactions.value.length === 0)

function toastError(fallback: string, reason: unknown): void {
  const description = reason instanceof Error ? reason.message : undefined
  toast.add({ title: fallback, description, color: 'error' })
}

// --- Edit 1 transaction -------------------------------------------------
const editOpen = ref(false)
const transactionBeingEdited = ref<Transaction | null>(null)
const savingEdit = ref(false)

function openEdit(transaction: Transaction): void {
  transactionBeingEdited.value = transaction
  editOpen.value = true
}

// --- Create 1 transaction ---------------------------------------------------
const createOpen = ref(false)
const savingCreate = ref(false)

async function handleCreate(draft: Parameters<typeof createMany>[0][number]): Promise<void> {
  savingCreate.value = true
  try {
    await createMany([draft])
    createOpen.value = false
    toast.add({ title: 'Lançamento criado.', color: 'success' })
  } catch (reason) {
    toastError('Não foi possível criar o lançamento.', reason)
  } finally {
    savingCreate.value = false
  }
}

async function handleSaveEdit(id: string, patch: Parameters<typeof update>[1]): Promise<void> {
  savingEdit.value = true
  try {
    await update(id, patch)
    editOpen.value = false
    toast.add({ title: 'Lançamento atualizado.', color: 'success' })
  } catch (reason) {
    toastError('Não foi possível salvar o lançamento.', reason)
  } finally {
    savingEdit.value = false
  }
}

// --- Delete 1 transaction (from the edit drawer) -----------------
async function deleteOne(transaction: Transaction): Promise<void> {
  try {
    await remove([transaction.id])
    editOpen.value = false
    toast.add({ title: 'Lançamento excluído.', color: 'success' })
  } catch (reason) {
    toastError('Não foi possível excluir o lançamento.', reason)
  }
}

// --- Bulk edit -------------------------------------------------------
const bulkEditOpen = ref(false)
const savingBulkEdit = ref(false)

async function applyBulkEdit(patch: Parameters<typeof updateMany>[1]): Promise<void> {
  savingBulkEdit.value = true
  try {
    const count = selectedIds.value.length
    await updateMany(selectedIds.value, patch)
    bulkEditOpen.value = false
    clearSelection()
    toast.add({ title: `${count} lançamentos atualizados.`, color: 'success' })
  } catch (reason) {
    toastError('Não foi possível atualizar os lançamentos selecionados.', reason)
  } finally {
    savingBulkEdit.value = false
  }
}

// --- Duplicate --------------------------------------------------------------
const duplicateOpen = ref(false)
const duplicating = ref(false)

async function confirmDuplicate(options: Parameters<typeof duplicate>[1]): Promise<void> {
  duplicating.value = true
  try {
    const copies = await duplicate(selectedIds.value, options)
    duplicateOpen.value = false
    clearSelection()
    toast.add({ title: `${copies.length} lançamentos duplicados.`, color: 'success' })
  } catch (reason) {
    toastError('Não foi possível duplicar os lançamentos selecionados.', reason)
  } finally {
    duplicating.value = false
  }
}

// --- Bulk delete --------------------------------------------------------
const deleteOpen = ref(false)
const deleting = ref(false)
const transactionsToDelete = ref<Transaction[]>([])

function openBulkDelete(): void {
  transactionsToDelete.value = selectedTransactions.value
  deleteOpen.value = true
}

function openSingleDelete(transaction: Transaction): void {
  transactionsToDelete.value = [transaction]
  deleteOpen.value = true
}

async function confirmDelete(): Promise<void> {
  deleting.value = true
  try {
    const ids = transactionsToDelete.value.map((transaction) => transaction.id)
    await remove(ids)
    deleteOpen.value = false
    clearSelection()
    toast.add({ title: `${ids.length} lançamentos excluídos.`, color: 'success' })
  } catch (reason) {
    toastError('Não foi possível excluir os lançamentos selecionados.', reason)
  } finally {
    deleting.value = false
  }
}

// --- Bulk add ------------------------------------------------------
const bulkAddOpen = ref(false)
const savingBulkAdd = ref(false)

async function handleBulkAdd(drafts: Parameters<typeof createMany>[0]): Promise<void> {
  savingBulkAdd.value = true
  try {
    const created = await createMany(drafts)
    bulkAddOpen.value = false
    toast.add({ title: `${created.length} lançamentos adicionados.`, color: 'success' })
  } catch (reason) {
    toastError('Não foi possível adicionar os lançamentos.', reason)
  } finally {
    savingBulkAdd.value = false
  }
}

// --- Import spreadsheet ------------------------------------------------------
const importOpen = ref(false)
const importing = ref(false)
const importModalRef = ref<{ markImported: () => void } | null>(null)

async function confirmImport(drafts: Parameters<typeof createMany>[0]): Promise<void> {
  importing.value = true
  try {
    await createMany(drafts)
    // The modal itself shows the "done" step (with the count and a
    // "Ir para Lançamentos" button) — only worth reaching once this
    // has actually succeeded, see ImportSpreadsheetModal.
    importModalRef.value?.markImported()
  } catch (reason) {
    // Left open on the review step on purpose: the user can fix
    // whatever's wrong (or just retry) without re-uploading the file.
    toastError('Não foi possível importar a planilha.', reason)
  } finally {
    importing.value = false
  }
}

// The two secondary entry points live behind a menu below `sm`: three
// full-label buttons don't fit a phone header, and of the three only
// "Novo lançamento" is frequent enough to earn permanent space.
const secondaryActions = computed(() => [
  [
    { label: 'Importar planilha', icon: 'i-lucide-file-down', onSelect: () => { importOpen.value = true } },
    { label: 'Adicionar em massa', icon: 'i-lucide-table', onSelect: () => { bulkAddOpen.value = true } }
  ]
])
</script>

<template>
  <div class="@container flex min-h-full flex-col gap-4 p-4 sm:p-6">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold sm:text-2xl">Lançamentos</h1>
        <p class="text-sm text-muted">
          <template v-if="hasActiveFilters">
            {{ filteredTransactions.length }} de {{ transactions.length }} lançamentos
          </template>
          <template v-else>
            {{ transactions.length }} {{ transactions.length === 1 ? 'lançamento' : 'lançamentos' }} no total
          </template>
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <UButton
          label="Importar planilha"
          icon="i-lucide-file-down"
          color="neutral"
          variant="outline"
          class="hidden lg:inline-flex"
          @click="importOpen = true"
        />
        <UButton
          label="Adicionar em massa"
          icon="i-lucide-table"
          color="neutral"
          variant="outline"
          class="hidden lg:inline-flex"
          @click="bulkAddOpen = true"
        />

        <UDropdownMenu :items="secondaryActions" class="lg:hidden">
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="outline"
            aria-label="Mais ações: importar planilha ou adicionar em massa"
          />
        </UDropdownMenu>

        <UButton icon="i-lucide-plus" @click="createOpen = true">
          <span class="hidden sm:inline">Novo lançamento</span>
          <span class="sm:hidden">Novo</span>
        </UButton>
      </div>
    </header>

    <UAlert
      v-if="error && transactions.length === 0"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      title="Não foi possível carregar os lançamentos."
      :description="error"
      :actions="[{ label: 'Tentar de novo', color: 'error', variant: 'solid', onClick: load }]"
    />

    <!--
      A failure that happens *while* data is already on screen can't
      take over the page — the rows below are still valid. It gets a
      quieter banner instead, so the user knows the last action
      didn't stick without losing what they were looking at.
    -->
    <UAlert
      v-else-if="error"
      color="warning"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      title="A última ação não foi concluída."
      :description="error"
      :actions="[{ label: 'Recarregar', color: 'warning', variant: 'outline', onClick: load }]"
    />

    <TransactionsSummary :summary="summary" :filtered="hasActiveFilters" :loading="loading" />

    <FiltersBar v-model="filters" @clear="clearFilters" />

    <TransactionsEmptyState
      v-if="showEmptyState"
      :filtered="hasActiveFilters"
      :search="filters.search"
      @clear="clearFilters"
      @create="createOpen = true"
      @import="importOpen = true"
    />

    <template v-else>
      <TransactionsTable
        v-model:selection="selection"
        :rows="paginatedTransactions"
        :loading="loading"
        :sort="sort"
        class="hidden @min-[42rem]:block"
        @edit="openEdit"
        @delete="openSingleDelete"
        @sort="toggleSort"
      />

      <TransactionCardList
        v-model:selection="selection"
        :rows="paginatedTransactions"
        :loading="loading"
        class="@min-[42rem]:hidden"
        @edit="openEdit"
        @delete="openSingleDelete"
      />

      <TransactionsPagination
        v-model:page="page"
        v-model:page-size="pageSize"
        :range-start="rangeStart"
        :range-end="rangeEnd"
        :total="total"
        :grand-total="transactions.length"
      />
    </template>

    <BulkActionsBar
      v-if="hasSelection"
      :selected-count="selectedCount"
      @edit="bulkEditOpen = true"
      @duplicate="duplicateOpen = true"
      @delete="openBulkDelete"
      @clear="clearSelection"
    />

    <EditTransactionSlideover
      v-if="transactionBeingEdited"
      v-model:open="editOpen"
      :transaction="transactionBeingEdited"
      :saving="savingEdit"
      @save="handleSaveEdit"
      @delete="deleteOne"
    />

    <CreateTransactionSlideover
      v-model:open="createOpen"
      :saving="savingCreate"
      @create="handleCreate"
    />

    <BulkEditModal
      v-model:open="bulkEditOpen"
      :count="selectedCount"
      :saving="savingBulkEdit"
      @apply="applyBulkEdit"
    />

    <DuplicateModal
      v-model:open="duplicateOpen"
      :count="selectedCount"
      :duplicating="duplicating"
      @confirm="confirmDuplicate"
    />

    <BulkDeleteModal
      v-model:open="deleteOpen"
      :transactions="transactionsToDelete"
      :deleting="deleting"
      @confirm="confirmDelete"
    />

    <BulkAddSlideover
      v-model:open="bulkAddOpen"
      :saving="savingBulkAdd"
      @save="handleBulkAdd"
    />

    <ImportSpreadsheetModal
      ref="importModalRef"
      v-model:open="importOpen"
      :importing="importing"
      @import="confirmImport"
    />
  </div>
</template>
