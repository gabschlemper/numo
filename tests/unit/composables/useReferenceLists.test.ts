// Mesmo padrão de `useTransactions.test.ts`: `useReferenceLists` chama
// o auto-import `useReferenceListRepository()` sem nunca importá-lo,
// então cada teste substitui esse global por um dublê que implementa
// a porta e controla exatamente o que resolve ou rejeita.
import { describe, expect, it, vi } from 'vitest'
import { useReferenceLists } from '~/composables/useReferenceLists'
import type { ReferenceListRepository } from '~/repositories/ReferenceListRepository'
import type { ListItem, ReferenceLists } from '~/types/referenceList'
import { ApiError } from '~/types/apiError'

function item(id: string, name: string, usageCount = 0): ListItem {
  return { id, name, usageCount }
}

function makeLists(overrides: Partial<ReferenceLists> = {}): ReferenceLists {
  return {
    categories: [item('cat-1', 'Supermercado', 3)],
    accounts: [item('acc-1', 'Nubank Gabi', 5)],
    debtors: [],
    ...overrides
  }
}

function stubRepository(overrides: Partial<ReferenceListRepository> = {}): ReferenceListRepository {
  const repo: ReferenceListRepository = {
    list: vi.fn().mockResolvedValue(makeLists()),
    create: vi.fn().mockResolvedValue(item('cat-2', 'Farmácia')),
    rename: vi.fn().mockResolvedValue({ item: item('cat-1', 'Mercado', 3), updatedTransactions: 3 }),
    remove: vi.fn().mockResolvedValue(undefined),
    reassign: vi.fn().mockResolvedValue({ updatedTransactions: 3 }),
    ...overrides
  }
  vi.stubGlobal('useReferenceListRepository', () => repo)
  return repo
}

// Sem `vi.unstubAllGlobals()` aqui: ele derrubaria também os globais
// que `tests/setup.ts` instala (`ref`, `computed`, `useState`...).
// Cada teste chama `stubRepository()`, que já sobrescreve o único
// global que interessa, e o `beforeEach` do setup limpa o registro do
// `useState` entre os casos.
describe('useReferenceLists', () => {
  it('começa vazio, sem carregar e sem erro', () => {
    stubRepository()
    const { lists, loading, error, totalItems } = useReferenceLists()
    expect(lists.value).toEqual({ categories: [], accounts: [], debtors: [] })
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(totalItems.value).toBe(0)
  })

  it('load() preenche as três listas', async () => {
    stubRepository()
    const { lists, load, totalItems } = useReferenceLists()
    await load()
    expect(lists.value.categories).toHaveLength(1)
    expect(lists.value.accounts).toHaveLength(1)
    expect(totalItems.value).toBe(2)
  })

  it('recarrega depois de cada mutação, porque usageCount é derivado', async () => {
    // Um rename muda a contagem de itens que a operação nem tocou;
    // remendar o array local seria recalcular no cliente o que o
    // repositório já sabe — e sair do ar sem ninguém perceber.
    const repo = stubRepository()
    const { load, create, rename, remove, reassign } = useReferenceLists()
    await load()
    expect(repo.list).toHaveBeenCalledTimes(1)

    await create('categories', 'Farmácia')
    await rename('categories', 'cat-1', 'Mercado')
    await remove('categories', 'cat-1')
    await reassign('categories', 'cat-1', { targetId: 'cat-2', deleteAfter: true })

    expect(repo.list).toHaveBeenCalledTimes(5)
  })

  it('rename() devolve quantos lançamentos foram atualizados', async () => {
    stubRepository()
    const { rename } = useReferenceLists()
    await expect(rename('categories', 'cat-1', 'Mercado')).resolves.toBe(3)
  })

  it('reassign() devolve quantos lançamentos foram movidos', async () => {
    stubRepository()
    const { reassign } = useReferenceLists()
    await expect(reassign('categories', 'cat-1', { targetId: 'cat-2', deleteAfter: true })).resolves.toBe(3)
  })

  it('registra a mensagem do erro no estado E relança, para a página decidir a UI', async () => {
    stubRepository({
      create: vi.fn().mockRejectedValue(new ApiError('conflict', 'Já existe "Supermercado" nesta lista.'))
    })
    const { create, error } = useReferenceLists()
    await expect(create('categories', 'Supermercado')).rejects.toBeInstanceOf(ApiError)
    expect(error.value).toBe('Já existe "Supermercado" nesta lista.')
  })

  it('preserva o ApiError ao relançar, para a página ler code e fields', async () => {
    // Se o composable engolisse o erro ou o reembrulhasse num Error
    // genérico, o modal perderia `fields.name` e o erro voltaria a
    // ser um toast — que é exatamente o que a tela evita.
    stubRepository({
      create: vi.fn().mockRejectedValue(
        new ApiError('conflict', 'Já existe.', { fields: { name: 'Esse nome já está em uso.' } })
      )
    })
    const { create } = useReferenceLists()
    await create('categories', 'X').catch((reason: unknown) => {
      expect(reason).toBeInstanceOf(ApiError)
      expect((reason as ApiError).fields?.name).toBe('Esse nome já está em uso.')
    })
    expect.assertions(2)
  })

  it('limpa o erro anterior ao iniciar uma nova ação', async () => {
    const repo = stubRepository({ list: vi.fn().mockRejectedValue(new Error('rede caiu')) })
    const { load, error } = useReferenceLists()
    await expect(load()).rejects.toThrow()
    expect(error.value).toBe('rede caiu')

    repo.list = vi.fn().mockResolvedValue(makeLists())
    await load()
    expect(error.value).toBeNull()
  })

  it('baixa o loading mesmo quando a ação falha', async () => {
    stubRepository({ list: vi.fn().mockRejectedValue(new Error('falhou')) })
    const { load, loading } = useReferenceLists()
    await expect(load()).rejects.toThrow()
    expect(loading.value).toBe(false)
  })
})
