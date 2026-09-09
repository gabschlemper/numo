import { beforeEach, describe, expect, it } from 'vitest'
import { MockTransactionRepository } from '~/repositories/MockTransactionRepository'
import { TRANSACTIONS_SEED } from '~/constants/transactionsSeed'
import type { Transaction, TransactionDraft } from '~/types/transaction'

function makeDraft(overrides: Partial<TransactionDraft> = {}): TransactionDraft {
  return {
    date: '2026-09-05',
    description: 'Novo lançamento de teste',
    category: 'Transporte',
    account: 'Nubank Gabi',
    method: 'Crédito',
    amount: 42,
    type: 'Variável',
    installment: null,
    status: 'Pendente',
    debtor: '',
    reimbursable: 'Não',
    billingMonth: '2026-09',
    ...overrides
  }
}

// `create`/`createMany` themselves reject the moment a description
// carries "forçar erro" (tested below), so a tagged row can never
// actually be persisted through the public API — which means the
// *separate* "is one of the already-affected rows tagged" checks inside
// updateMany/duplicate/remove (see MockTransactionRepository.ts) are
// unreachable through normal use today. They're still real code paths
// worth covering (e.g. a future seed or import route could add a row
// without going through createMany), so these tests reach past the
// public API to plant one directly, the same way a pre-tagged seed row
// would arrive.
function injectTransaction(repository: MockTransactionRepository, transaction: Transaction): void {
  ;(repository as unknown as { transactions: Transaction[] }).transactions.unshift(transaction)
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'injected-1',
    date: '2026-09-05',
    description: 'Assinatura forçar erro mensal',
    category: 'Transporte',
    account: 'Nubank Gabi',
    method: 'Crédito',
    amount: 42,
    type: 'Variável',
    installment: null,
    status: 'Pendente',
    debtor: '',
    reimbursable: 'Não',
    billingMonth: '2026-09',
    ...overrides
  }
}

describe('MockTransactionRepository', () => {
  let repository: MockTransactionRepository

  beforeEach(() => {
    repository = new MockTransactionRepository()
  })

  describe('list', () => {
    it('resolves with a copy of the seed data', async () => {
      const result = await repository.list()
      expect(result).toHaveLength(TRANSACTIONS_SEED.length)
      expect(result).not.toBe(TRANSACTIONS_SEED)
    })

    it('does not let the caller mutate internal state', async () => {
      const first = await repository.list()
      first.pop()
      const second = await repository.list()
      expect(second).toHaveLength(TRANSACTIONS_SEED.length)
    })
  })

  describe('create / createMany', () => {
    it('assigns a generated id and prepends the new transaction', async () => {
      const before = await repository.list()
      const created = await repository.create(makeDraft())
      expect(created.id).toBeTruthy()
      const after = await repository.list()
      expect(after).toHaveLength(before.length + 1)
      expect(after[0]?.id).toBe(created.id)
    })

    it('creates several drafts at once with distinct ids', async () => {
      const created = await repository.createMany([makeDraft(), makeDraft({ description: 'Segundo' })])
      expect(created).toHaveLength(2)
      expect(created[0]?.id).not.toBe(created[1]?.id)
    })

    it('rejects when a draft description carries the force-error trigger', async () => {
      await expect(repository.createMany([makeDraft({ description: 'Forçar Erro por favor' })])).rejects.toThrow(
        /Falha simulada/
      )
    })

    it('does not create anything when the batch is rejected', async () => {
      const before = await repository.list()
      await expect(repository.createMany([makeDraft({ description: 'forçar erro' })])).rejects.toThrow()
      const after = await repository.list()
      expect(after).toHaveLength(before.length)
    })
  })

  describe('update / updateMany', () => {
    it('patches only the given fields on the matching transaction', async () => {
      const [target] = await repository.list()
      if (!target) throw new Error('seed is empty')
      const updated = await repository.update(target.id, { status: 'Pago' })
      expect(updated.status).toBe('Pago')
      expect(updated.description).toBe(target.description)
    })

    it('updates multiple ids in one call', async () => {
      const seeded = await repository.list()
      const ids = seeded.slice(0, 2).map((t) => t.id)
      const updated = await repository.updateMany(ids, { status: 'Pago' })
      expect(updated).toHaveLength(2)
      expect(updated.every((t) => t.status === 'Pago')).toBe(true)
    })

    it('throws when updating an id that does not exist', async () => {
      await expect(repository.update('does-not-exist', { status: 'Pago' })).rejects.toThrow(/não encontrado/)
    })

    it('rejects when the patch itself carries the force-error trigger', async () => {
      const [target] = await repository.list()
      if (!target) throw new Error('seed is empty')
      await expect(repository.update(target.id, { description: 'forçar erro' })).rejects.toThrow(/Falha simulada/)
    })

    it('rejects when a targeted (already-tagged) transaction carries the trigger', async () => {
      const tagged = makeTransaction({ id: 'tagged-update' })
      injectTransaction(repository, tagged)
      await expect(repository.update(tagged.id, { status: 'Pago' })).rejects.toThrow(/Falha simulada/)
    })
  })

  describe('duplicate', () => {
    it('creates copies with new ids, applying the requested date and status', async () => {
      const [original] = await repository.list()
      if (!original) throw new Error('seed is empty')
      const [copy] = await repository.duplicate([original.id], { newDate: '2026-12-01', status: 'Pendente' })
      expect(copy?.id).not.toBe(original.id)
      expect(copy?.date).toBe('2026-12-01')
      expect(copy?.status).toBe('Pendente')
      expect(copy?.description).toBe(original.description)
    })

    it('keeps the original date when newDate is null', async () => {
      const [original] = await repository.list()
      if (!original) throw new Error('seed is empty')
      const [copy] = await repository.duplicate([original.id], { newDate: null, status: 'Pago' })
      expect(copy?.date).toBe(original.date)
    })

    it('rejects when the original transaction carries the force-error trigger', async () => {
      const tagged = makeTransaction({ id: 'tagged-duplicate' })
      injectTransaction(repository, tagged)
      await expect(repository.duplicate([tagged.id], { newDate: null, status: 'Pago' })).rejects.toThrow(
        /Falha simulada/
      )
    })
  })

  describe('remove', () => {
    it('removes the given ids', async () => {
      const before = await repository.list()
      const targetIds = before.slice(0, 2).map((t) => t.id)
      await repository.remove(targetIds)
      const after = await repository.list()
      expect(after).toHaveLength(before.length - 2)
      expect(after.some((t) => targetIds.includes(t.id))).toBe(false)
    })

    it('rejects when a targeted transaction carries the force-error trigger', async () => {
      const tagged = makeTransaction({ id: 'tagged-remove' })
      injectTransaction(repository, tagged)
      await expect(repository.remove([tagged.id])).rejects.toThrow(/Falha simulada/)
    })
  })
})
