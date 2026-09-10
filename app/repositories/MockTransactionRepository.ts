// app/repositories/MockTransactionRepository.ts
//
// The ADAPTER used during frontend-first development. It implements
// `TransactionRepository` against an in-memory array instead of a real
// API, but behaves like a real one would: every method is async,
// returns fresh copies, has a latency that varies by operation (a read
// is not as slow as a write; a bulk write is slower than a single one),
// and can fail — deliberately and reproducibly — so components that
// depend on the interface cannot accidentally rely on this adapter's
// synchronous, always-succeeding, in-memory nature (Liskov Substitution
// — an `ApiTransactionRepository` must be a drop-in replacement, and the
// UI has to already handle the same failure modes a real API has).
//
// Testing the error states on purpose: give any transaction a
// description containing the text "forçar erro" (case-insensitive) —
// e.g. type it into the description field when creating/editing, or
// duplicate/bulk-edit a row you've renamed that way — and the matching
// operation rejects instead of succeeding. Nothing else needs to change
// for that test; remove the text and the same operation succeeds again.
import type { Transaction, TransactionDraft, TransactionPatch, DuplicateOptions } from '~/types/transaction'
import type { TransactionRepository } from './TransactionRepository'
import type { MockDataStore } from './mock/MockDataStore'
import { sharedMockDataStore } from './mock/MockDataStore'

const FORCE_ERROR_TRIGGER = 'forçar erro'

/**
 * Per-operation simulated latency, in ms. Reads are the cheapest thing
 * a real API does; writes cost more; bulk writes cost the most because
 * they'd typically touch more rows server-side. Kept as a lookup here
 * (instead of one flat constant) specifically so loading states in the
 * UI feel distinguishable from each other during usability testing —
 * a single global delay makes every action feel the same.
 */
const LATENCY_MS = {
  list: 400,
  write: 350,
  bulkWrite: 600
} as const

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `txn-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function hasForceErrorTrigger(description: string): boolean {
  return description.toLowerCase().includes(FORCE_ERROR_TRIGGER)
}

/**
 * Throws when any of the given transactions/drafts is "tagged" with the
 * force-error trigger in its description. Centralized here so every
 * mutation method checks it the same way, with the same message.
 */
function throwIfForceErrorTagged(descriptions: readonly string[]): void {
  if (descriptions.some(hasForceErrorTrigger)) {
    throw new Error('Falha simulada: um dos lançamentos tem "forçar erro" na descrição.')
  }
}

export class MockTransactionRepository implements TransactionRepository {
  // Os lançamentos não moram mais dentro deste adaptador: eles vivem
  // no `MockDataStore`, que este adaptador compartilha com
  // `MockReferenceListRepository`. Sem isso, renomear uma categoria
  // em Listas não teria como alcançar os lançamentos que a usam, e o
  // "em uso em 34 lançamentos" contaria sempre zero. Ver o cabeçalho
  // de `mock/MockDataStore.ts` — é um artefato só do mock; adaptadores
  // reais não compartilham nada, o servidor é que garante isso.
  private store: MockDataStore

  constructor(store: MockDataStore = sharedMockDataStore) {
    this.store = store
  }

  private get transactions(): Transaction[] {
    return this.store.transactions
  }

  private set transactions(value: Transaction[]) {
    this.store.transactions = value
  }

  async list(): Promise<Transaction[]> {
    await wait(LATENCY_MS.list)
    return [...this.transactions]
  }

  async create(draft: TransactionDraft): Promise<Transaction> {
    const created = await this.createMany([draft])
    const transaction = created[0]
    if (!transaction) {
      throw new Error('Falha inesperada ao criar lançamento.')
    }
    return transaction
  }

  async createMany(drafts: TransactionDraft[]): Promise<Transaction[]> {
    await wait(drafts.length > 1 ? LATENCY_MS.bulkWrite : LATENCY_MS.write)
    throwIfForceErrorTagged(drafts.map((draft) => draft.description))

    const created = drafts.map((draft) => ({ ...draft, id: generateId() }))
    this.transactions = [...created, ...this.transactions]
    return created
  }

  async update(id: string, patch: TransactionPatch): Promise<Transaction> {
    const [updated] = await this.updateMany([id], patch)
    if (!updated) {
      throw new Error(`Lançamento ${id} não encontrado.`)
    }
    return updated
  }

  async updateMany(ids: string[], patch: TransactionPatch): Promise<Transaction[]> {
    await wait(ids.length > 1 ? LATENCY_MS.bulkWrite : LATENCY_MS.write)

    // A bulk edit's patch itself can carry the trigger (renaming the
    // description for every selected row), and so can a row already
    // tagged before the edit — either should be catchable.
    const targetIds = new Set(ids)
    const affected = this.transactions.filter((transaction) => targetIds.has(transaction.id))
    throwIfForceErrorTagged([patch.description, ...affected.map((transaction) => transaction.description)].filter(
      (value): value is string => typeof value === 'string'
    ))

    const updated: Transaction[] = []
    this.transactions = this.transactions.map((transaction) => {
      if (!targetIds.has(transaction.id)) return transaction
      const updatedTransaction = { ...transaction, ...patch }
      updated.push(updatedTransaction)
      return updatedTransaction
    })

    return updated
  }

  async duplicate(ids: string[], options: DuplicateOptions): Promise<Transaction[]> {
    await wait(ids.length > 1 ? LATENCY_MS.bulkWrite : LATENCY_MS.write)
    const targetIds = new Set(ids)
    const originals = this.transactions.filter((transaction) => targetIds.has(transaction.id))
    throwIfForceErrorTagged(originals.map((transaction) => transaction.description))

    const copies = originals.map((original) => ({
      ...original,
      id: generateId(),
      date: options.newDate ?? original.date,
      status: options.status
    }))

    this.transactions = [...copies, ...this.transactions]
    return copies
  }

  async remove(ids: string[]): Promise<void> {
    await wait(ids.length > 1 ? LATENCY_MS.bulkWrite : LATENCY_MS.write)
    const targetIds = new Set(ids)
    const affected = this.transactions.filter((transaction) => targetIds.has(transaction.id))
    throwIfForceErrorTagged(affected.map((transaction) => transaction.description))

    this.transactions = this.transactions.filter((transaction) => !targetIds.has(transaction.id))
  }
}
