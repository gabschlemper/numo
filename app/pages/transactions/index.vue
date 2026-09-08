<!--
  pages/transactions/index.vue

  The only place in the codebase allowed to decide WHAT HAPPENS when a
  user acts (which modal opens, which composable action runs, when a
  toast fires). Every component below it is either pure presentation
  (FiltersBar, TransactionsTable) or a self-contained interaction
  (the modals/slideovers) that only emits intent. This is what keeps
  each of those pieces independently testable and independently
  reusable — none of them know this page exists.

  Every mutation below follows the same shape: set a `saving`/`deleting`
  flag, try the action, toast on success, catch-and-toast on failure,
  reset the flag in `finally`. `useTransactions()`'s `run()` wrapper
  already records the error in shared state and rethrows — this page's
  job is just to turn that rejection into visible feedback, per action,
  since a bulk-edit failing has to be as visible as a single edit
  failing. To manually test any of these paths, give a transaction's
  description the text "forçar erro" (see MockTransactionRepository).
-->
<script setup lang="ts">
import type { Transaction } from '~/types/transaction'

const toast = useToast()

const { transactions, loading, error, load, createMany, update, updateMany, duplicate, remove } = useTransactions()
const { filters, filteredTransactions, clearFilters } = useTransactionFilters(transactions)
const { selection, selectedIds, selectedTransactions, selectedCount, hasSelection, clearSelection } =
  useTransactionSelection(filteredTransactions)

await useAsyncData('initial-transactions', load)

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
    await updateMany(selectedIds.value, patch)
    bulkEditOpen.value = false
    clearSelection()
    toast.add({ title: `${selectedIds.value.length} lançamentos atualizados.`, color: 'success' })
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
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold">Lançamentos</h1>
        <p class="text-sm text-muted">{{ transactions.length }} no total</p>
      </div>
      <div class="flex gap-2">
        <UButton label="Importar planilha" icon="i-lucide-file-down" color="neutral" variant="outline" @click="importOpen = true" />
        <UButton label="Adicionar em massa" icon="i-lucide-table" color="neutral" variant="outline" @click="bulkAddOpen = true" />
        <UButton label="Novo lançamento" icon="i-lucide-plus" @click="createOpen = true" />
      </div>
    </div>

    <UAlert
      v-if="error && transactions.length === 0"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      title="Não foi possível carregar os lançamentos."
      :description="error"
      :actions="[{ label: 'Tentar de novo', color: 'error', variant: 'solid', onClick: load }]"
    />

    <FiltersBar v-model="filters" @clear="clearFilters" />

    <BulkActionsBar
      v-if="hasSelection"
      :selected-count="selectedCount"
      @edit="bulkEditOpen = true"
      @duplicate="duplicateOpen = true"
      @delete="openBulkDelete"
      @clear="clearSelection"
    />

    <TransactionsTable
      v-model:selection="selection"
      :rows="filteredTransactions"
      :loading="loading"
      @edit="openEdit"
      @delete="openSingleDelete"
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
