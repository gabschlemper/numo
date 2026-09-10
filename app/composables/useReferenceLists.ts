// app/composables/useReferenceLists.ts
//
// Responsabilidade única: guardar a lista autoritativa de
// categorias/contas/devedores e as ações que a mudam, contra a
// interface `ReferenceListRepository`. Não sabe qual painel está
// aberto, qual modal está visível nem o que fazer quando algo falha —
// isso é da página (mesma divisão de `useTransactions`).
//
// Toda mutação recarrega a lista inteira em vez de tentar remendar o
// array local. É deliberado: `usageCount` é derivado dos lançamentos,
// então um rename ou uma reatribuição mudam contagens de itens que
// nem foram tocados na operação. Reconciliar isso à mão no cliente é
// exatamente o tipo de cálculo duplicado que sai do ar sem ninguém
// perceber — e o custo aqui é uma leitura a mais.
import type { ListItem, ListType, ReassignOptions, ReferenceLists } from '~/types/referenceList'
import { LIST_TYPES } from '~/types/referenceList'

function emptyLists(): ReferenceLists {
  return { categories: [], accounts: [], debtors: [] }
}

export function useReferenceLists() {
  const repository = useReferenceListRepository()

  const lists = useState<ReferenceLists>('numo-reference-lists', emptyLists)
  const loading = useState<boolean>('numo-reference-lists-loading', () => false)
  const error = useState<string | null>('numo-reference-lists-error', () => null)

  async function run<T>(action: () => Promise<T>): Promise<T> {
    loading.value = true
    error.value = null
    try {
      return await action()
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : 'Não foi possível concluir a ação.'
      // Relançado de propósito: o estado compartilhado registra o
      // erro, mas quem decide o que o usuário vê (toast? erro no
      // campo? modal aberto?) é a página.
      throw reason
    } finally {
      loading.value = false
    }
  }

  async function load(): Promise<void> {
    await run(async () => {
      lists.value = await repository.list()
    })
  }

  async function create(type: ListType, name: string): Promise<ListItem> {
    return run(async () => {
      const created = await repository.create(type, name)
      lists.value = await repository.list()
      return created
    })
  }

  async function rename(type: ListType, id: string, name: string): Promise<number> {
    return run(async () => {
      const { updatedTransactions } = await repository.rename(type, id, name)
      lists.value = await repository.list()
      return updatedTransactions
    })
  }

  async function remove(type: ListType, id: string): Promise<void> {
    await run(async () => {
      await repository.remove(type, id)
      lists.value = await repository.list()
    })
  }

  async function reassign(type: ListType, id: string, options: ReassignOptions): Promise<number> {
    return run(async () => {
      const { updatedTransactions } = await repository.reassign(type, id, options)
      lists.value = await repository.list()
      return updatedTransactions
    })
  }

  const totalItems = computed(() =>
    LIST_TYPES.reduce((total, type) => total + lists.value[type].length, 0)
  )

  return {
    lists: readonly(lists),
    loading: readonly(loading),
    error: readonly(error),
    totalItems,
    load,
    create,
    rename,
    remove,
    reassign
  }
}
