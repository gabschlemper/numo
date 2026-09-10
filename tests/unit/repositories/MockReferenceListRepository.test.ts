import { beforeEach, describe, expect, it } from 'vitest'
import { MockReferenceListRepository } from '~/repositories/MockReferenceListRepository'
import { MockTransactionRepository } from '~/repositories/MockTransactionRepository'
import { MockDataStore } from '~/repositories/mock/MockDataStore'
import { isApiError } from '~/types/apiError'
import type { Transaction } from '~/types/transaction'

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    date: '2026-09-01',
    description: 'Mercado',
    category: 'Supermercado',
    account: 'Nubank Gabi',
    method: 'Crédito',
    amount: 100,
    type: 'Variável',
    installment: null,
    status: 'Pago',
    debtor: '',
    reimbursable: 'Não',
    billingMonth: '2026-09',
    ...overrides
  }
}

/** Store enxuto: duas categorias, duas contas, um devedor, três lançamentos. */
function makeStore(): MockDataStore {
  const store = new MockDataStore()
  store.lists = {
    categories: [{ id: 'cat-1', name: 'Supermercado' }, { id: 'cat-2', name: 'Delivery' }],
    accounts: [{ id: 'acc-1', name: 'Nubank Gabi' }, { id: 'acc-2', name: 'Inter Malu' }],
    debtors: [{ id: 'deb-1', name: 'Ana' }]
  }
  store.transactions = [
    makeTransaction({ id: 't1', category: 'Supermercado' }),
    makeTransaction({ id: 't2', category: 'Supermercado' }),
    makeTransaction({ id: 't3', category: 'Delivery', debtor: 'Ana' })
  ]
  return store
}

async function expectApiError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toSatisfy(
    (reason: unknown) => isApiError(reason) && reason.code === code,
    `esperava um ApiError com code "${code}"`
  )
}

describe('MockReferenceListRepository', () => {
  let store: MockDataStore
  let repository: MockReferenceListRepository

  beforeEach(() => {
    store = makeStore()
    repository = new MockReferenceListRepository(store)
  })

  describe('list', () => {
    it('deriva usageCount dos lançamentos, nunca de um contador guardado', async () => {
      const lists = await repository.list()
      expect(lists.categories.find((item) => item.name === 'Supermercado')?.usageCount).toBe(2)
      expect(lists.categories.find((item) => item.name === 'Delivery')?.usageCount).toBe(1)
      expect(lists.debtors.find((item) => item.name === 'Ana')?.usageCount).toBe(1)
    })

    it('reflete uma mudança feita pelo repositório de lançamentos, sem recarregar nada', async () => {
      // Os dois adaptadores compartilham o store — é isso que faz o
      // "em uso em N lançamentos" ser verdade em vez de decorativo.
      const transactions = new MockTransactionRepository(store)
      await transactions.remove(['t1', 't2'])

      const lists = await repository.list()
      expect(lists.categories.find((item) => item.name === 'Supermercado')?.usageCount).toBe(0)
    })

    it('ordena por nome com regras pt-BR (acento não vai para o fim)', async () => {
      store.lists.categories = [
        { id: 'c1', name: 'Zoológico' },
        { id: 'c2', name: 'Água' },
        { id: 'c3', name: 'Bar' }
      ]
      const lists = await repository.list()
      expect(lists.categories.map((item) => item.name)).toEqual(['Água', 'Bar', 'Zoológico'])
    })

    it('devolve as três listas de uma vez', async () => {
      const lists = await repository.list()
      expect(Object.keys(lists).sort()).toEqual(['accounts', 'categories', 'debtors'])
    })
  })

  describe('create', () => {
    it('cria com o nome sem espaços nas pontas e uso zero', async () => {
      const created = await repository.create('categories', '  Farmácia  ')
      expect(created.name).toBe('Farmácia')
      expect(created.usageCount).toBe(0)
    })

    it('recusa nome em branco como validation_failed, apontando o campo', async () => {
      await expect(repository.create('categories', '   ')).rejects.toSatisfy(
        (reason: unknown) => isApiError(reason) && reason.code === 'validation_failed' && !!reason.fields?.name
      )
    })

    it('recusa nome repetido como conflict, ignorando caixa e espaços', async () => {
      await expectApiError(repository.create('categories', ' supermercado '), 'conflict')
    })
  })

  describe('rename', () => {
    it('propaga o novo nome para os lançamentos e informa quantos mudaram', async () => {
      const { updatedTransactions } = await repository.rename('categories', 'cat-1', 'Mercado')
      expect(updatedTransactions).toBe(2)
      expect(store.transactions.filter((t) => t.category === 'Mercado')).toHaveLength(2)
      expect(store.transactions.filter((t) => t.category === 'Supermercado')).toHaveLength(0)
    })

    it('não deixa lançamento órfão apontando para o nome antigo', async () => {
      await repository.rename('categories', 'cat-1', 'Mercado')
      const lists = await repository.list()
      const names = new Set(lists.categories.map((item) => item.name))
      for (const transaction of store.transactions) {
        expect(names.has(transaction.category)).toBe(true)
      }
    })

    it('renomear para o mesmo nome é permitido (não colide consigo mesmo)', async () => {
      await expect(repository.rename('categories', 'cat-1', 'Supermercado')).resolves.toBeDefined()
    })

    it('recusa colisão com OUTRO item', async () => {
      await expectApiError(repository.rename('categories', 'cat-1', 'Delivery'), 'conflict')
    })

    it('não altera lançamentos quando o rename falha', async () => {
      await expectApiError(repository.rename('categories', 'cat-1', 'Delivery'), 'conflict')
      expect(store.transactions.filter((t) => t.category === 'Supermercado')).toHaveLength(2)
    })

    it('404 para item inexistente', async () => {
      await expectApiError(repository.rename('categories', 'nao-existe', 'X'), 'not_found')
    })
  })

  describe('remove', () => {
    it('apaga um item sem uso', async () => {
      await repository.remove('accounts', 'acc-2')
      const lists = await repository.list()
      expect(lists.accounts.map((item) => item.id)).toEqual(['acc-1'])
    })

    it('recusa apagar item em uso, com a contagem em details', async () => {
      await expect(repository.remove('categories', 'cat-1')).rejects.toSatisfy(
        (reason: unknown) =>
          isApiError(reason) && reason.code === 'conflict' && reason.details?.usageCount === 2
      )
    })

    it('nunca apaga em cascata: os lançamentos continuam intactos após a recusa', async () => {
      await expectApiError(repository.remove('categories', 'cat-1'), 'conflict')
      expect(store.transactions).toHaveLength(3)
      expect(store.lists.categories.map((item) => item.id)).toContain('cat-1')
    })
  })

  describe('reassign', () => {
    it('move os lançamentos para o destino e informa quantos', async () => {
      const { updatedTransactions } = await repository.reassign('categories', 'cat-1', {
        targetId: 'cat-2',
        deleteAfter: false
      })
      expect(updatedTransactions).toBe(2)
      expect(store.transactions.filter((t) => t.category === 'Delivery')).toHaveLength(3)
    })

    it('mantém a origem quando deleteAfter é false', async () => {
      await repository.reassign('categories', 'cat-1', { targetId: 'cat-2', deleteAfter: false })
      expect(store.lists.categories.map((item) => item.id)).toContain('cat-1')
    })

    it('apaga a origem quando deleteAfter é true — a saída do 409', async () => {
      await repository.reassign('categories', 'cat-1', { targetId: 'cat-2', deleteAfter: true })
      expect(store.lists.categories.map((item) => item.id)).not.toContain('cat-1')
      const lists = await repository.list()
      expect(lists.categories.find((item) => item.name === 'Delivery')?.usageCount).toBe(3)
    })

    it('recusa reatribuir um item para ele mesmo', async () => {
      await expectApiError(
        repository.reassign('categories', 'cat-1', { targetId: 'cat-1', deleteAfter: false }),
        'validation_failed'
      )
    })

    it('404 quando o destino não existe', async () => {
      await expectApiError(
        repository.reassign('categories', 'cat-1', { targetId: 'nao-existe', deleteAfter: false }),
        'not_found'
      )
    })
  })
})
