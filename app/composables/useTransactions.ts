// app/composables/useTransactions.ts
//
// Single responsibility: own the authoritative list of transactions
// and the actions that mutate it, against the `TransactionRepository`
// interface. This composable knows nothing about filters, selection,
// or which drawer/modal is open — those are separate composables
// (useTransactionFilters, useTransactionSelection) precisely so that a
// change to "how selection works" never risks breaking "how data is
// fetched" (Single Responsibility Principle, applied at the
// composable level, not just the class level).
import type { Transaction, TransactionDraft, TransactionPatch, DuplicateOptions } from '~/types/transaction'

export function useTransactions() {
  const repository = useTransactionRepository()

  const transactions = useState<Transaction[]>('numo-transactions', () => [])
  const loading = useState<boolean>('numo-transactions-loading', () => false)
  const error = useState<string | null>('numo-transactions-error', () => null)

  function replaceById(updated: readonly Transaction[]): void {
    const byId = new Map(updated.map((transaction) => [transaction.id, transaction]))
    transactions.value = transactions.value.map((transaction) => byId.get(transaction.id) ?? transaction)
  }

  async function run<T>(action: () => Promise<T>): Promise<T> {
    loading.value = true
    error.value = null
    try {
      return await action()
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : 'Não foi possível concluir a ação.'
      throw reason
    } finally {
      loading.value = false
    }
  }

  async function load(): Promise<void> {
    await run(async () => {
      transactions.value = await repository.list()
    })
  }

  async function createMany(drafts: TransactionDraft[]): Promise<Transaction[]> {
    return run(async () => {
      const created = await repository.createMany(drafts)
      transactions.value = [...created, ...transactions.value]
      return created
    })
  }

  async function update(id: string, patch: TransactionPatch): Promise<Transaction> {
    return run(async () => {
      const updated = await repository.update(id, patch)
      replaceById([updated])
      return updated
    })
  }

  async function updateMany(ids: string[], patch: TransactionPatch): Promise<Transaction[]> {
    return run(async () => {
      const updated = await repository.updateMany(ids, patch)
      replaceById(updated)
      return updated
    })
  }

  async function duplicate(ids: string[], options: DuplicateOptions): Promise<Transaction[]> {
    return run(async () => {
      const copies = await repository.duplicate(ids, options)
      transactions.value = [...copies, ...transactions.value]
      return copies
    })
  }

  async function remove(ids: string[]): Promise<void> {
    await run(async () => {
      await repository.remove(ids)
      const removedIds = new Set(ids)
      transactions.value = transactions.value.filter((transaction) => !removedIds.has(transaction.id))
    })
  }

  return {
    transactions: readonly(transactions),
    loading: readonly(loading),
    error: readonly(error),
    load,
    createMany,
    update,
    updateMany,
    duplicate,
    remove
  }
}
