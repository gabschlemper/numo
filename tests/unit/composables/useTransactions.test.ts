// `useTransactions` calls the auto-imported `useTransactionRepository()`
// without ever importing it explicitly (that's what auto-import means
// inside the real app). To unit-test it in isolation from the real
// `MockTransactionRepository` — and from that repository's simulated
// latency — each test stubs the global with a hand-built fake that
// implements `TransactionRepository` and lets the test control exactly
// what resolves/rejects.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTransactions } from '~/composables/useTransactions'
import type { TransactionRepository } from '~/repositories/TransactionRepository'
import type { Transaction } from '~/types/transaction'

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    date: '2026-09-01',
    description: 'Posto Ipiranga',
    category: 'Transporte',
    account: 'Nubank Gabi',
    method: 'Crédito',
    amount: 100,
    type: 'Variável',
    installment: null,
    status: 'Pendente',
    debtor: '',
    reimbursable: 'Não',
    billingMonth: '2026-09',
    ...overrides
  }
}

function stubRepository(overrides: Partial<TransactionRepository> = {}): TransactionRepository {
  const repo: TransactionRepository = {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    createMany: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    updateMany: vi.fn().mockResolvedValue([]),
    duplicate: vi.fn().mockResolvedValue([]),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides
  }
  vi.stubGlobal('useTransactionRepository', () => repo)
  return repo
}

describe('useTransactions', () => {
  beforeEach(() => {
    stubRepository()
  })

  it('starts empty, not loading, without error', () => {
    const { transactions, loading, error } = useTransactions()
    expect(transactions.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('load() replaces the list with whatever the repository returns', async () => {
    const seeded = [makeTransaction()]
    stubRepository({ list: vi.fn().mockResolvedValue(seeded) })
    const { transactions, load } = useTransactions()
    await load()
    expect(transactions.value).toEqual(seeded)
  })

  it('toggles loading to true during an action and back to false after', async () => {
    let observedDuring: boolean | undefined
    const state: { composable?: ReturnType<typeof useTransactions> } = {}
    stubRepository({
      list: vi.fn().mockImplementation(async () => {
        observedDuring = state.composable?.loading.value
        return []
      })
    })
    state.composable = useTransactions()
    await state.composable.load()
    expect(observedDuring).toBe(true)
    expect(state.composable.loading.value).toBe(false)
  })

  it('createMany prepends the created transactions and returns them', async () => {
    const created = [makeTransaction({ id: 'new-1' })]
    stubRepository({ createMany: vi.fn().mockResolvedValue(created) })
    const { transactions, createMany } = useTransactions()
    const result = await createMany([])
    expect(result).toEqual(created)
    expect(transactions.value[0]).toEqual(created[0])
  })

  it('update() replaces only the matching transaction in place', async () => {
    stubRepository({ list: vi.fn().mockResolvedValue([makeTransaction({ id: 'a' }), makeTransaction({ id: 'b' })]) })
    const composable = useTransactions()
    await composable.load()
    stubRepository({ update: vi.fn().mockResolvedValue(makeTransaction({ id: 'a', status: 'Pago' })) })
    const secondCall = useTransactions()
    await secondCall.update('a', { status: 'Pago' })
    expect(secondCall.transactions.value.find((t) => t.id === 'a')?.status).toBe('Pago')
    expect(secondCall.transactions.value.find((t) => t.id === 'b')?.status).toBe('Pendente')
  })

  it('remove() drops the removed ids from the list', async () => {
    stubRepository({ list: vi.fn().mockResolvedValue([makeTransaction({ id: 'a' }), makeTransaction({ id: 'b' })]) })
    const composable = useTransactions()
    await composable.load()
    stubRepository({ remove: vi.fn().mockResolvedValue(undefined) })
    const secondCall = useTransactions()
    await secondCall.remove(['a'])
    expect(secondCall.transactions.value.map((t) => t.id)).toEqual(['b'])
  })

  it('duplicate() prepends the copies', async () => {
    const copies = [makeTransaction({ id: 'copy-1' })]
    stubRepository({ duplicate: vi.fn().mockResolvedValue(copies) })
    const { transactions, duplicate } = useTransactions()
    await duplicate(['txn-1'], { newDate: null, status: 'Pendente' })
    expect(transactions.value[0]?.id).toBe('copy-1')
  })

  it('updateMany() replaces every matching transaction', async () => {
    stubRepository({
      list: vi.fn().mockResolvedValue([makeTransaction({ id: 'a' }), makeTransaction({ id: 'b' })])
    })
    const composable = useTransactions()
    await composable.load()
    stubRepository({
      updateMany: vi
        .fn()
        .mockResolvedValue([makeTransaction({ id: 'a', status: 'Pago' }), makeTransaction({ id: 'b', status: 'Pago' })])
    })
    const secondCall = useTransactions()
    await secondCall.updateMany(['a', 'b'], { status: 'Pago' })
    expect(secondCall.transactions.value.every((t) => t.status === 'Pago')).toBe(true)
  })

  it('sets error and re-throws when the repository rejects, and always turns loading back off', async () => {
    stubRepository({ list: vi.fn().mockRejectedValue(new Error('offline')) })
    const { load, loading, error } = useTransactions()
    await expect(load()).rejects.toThrow('offline')
    expect(error.value).toBe('offline')
    expect(loading.value).toBe(false)
  })

  it('falls back to a generic error message when the rejection is not an Error', async () => {
    stubRepository({ list: vi.fn().mockRejectedValue('boom') })
    const { load, error } = useTransactions()
    await expect(load()).rejects.toBe('boom')
    expect(error.value).toBe('Não foi possível concluir a ação.')
  })

  it('clears any previous error at the start of a new action', async () => {
    stubRepository({ list: vi.fn().mockRejectedValue(new Error('offline')) })
    const composable = useTransactions()
    await expect(composable.load()).rejects.toThrow()
    expect(composable.error.value).toBe('offline')

    stubRepository({ list: vi.fn().mockResolvedValue([]) })
    const secondCall = useTransactions()
    await secondCall.load()
    expect(secondCall.error.value).toBeNull()
  })
})
