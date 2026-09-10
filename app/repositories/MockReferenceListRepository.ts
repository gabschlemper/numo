// app/repositories/MockReferenceListRepository.ts
//
// Adaptador mock de `ReferenceListRepository`.
//
// Ele compartilha o `MockDataStore` com `MockTransactionRepository`
// de propósito: as regras que este adaptador implementa (contar uso,
// propagar rename, recusar exclusão em uso, reatribuir) só existem
// PORQUE listas e lançamentos são o mesmo dado. Um mock que guardasse
// listas em separado passaria em todos os testes e mentiria em todas
// as telas.
//
// Assíncrono em tudo, mesmo sendo array em memória — pelo mesmo
// motivo que `MockTransactionRepository`: garantir que o adaptador
// real (de verdade assíncrono) seja substituto perfeito, sem nenhum
// componente perceber a troca (Liskov).
import type { ReferenceListRepository } from './ReferenceListRepository'
import type {
  ListItem,
  ListType,
  ReassignOptions,
  ReassignResult,
  ReferenceLists,
  RenameResult
} from '~/types/referenceList'
import { LIST_COPY, LIST_FIELD, LIST_TYPES, normalizeListItemName } from '~/types/referenceList'
import { ApiError } from '~/types/apiError'
import type { MockDataStore } from './mock/MockDataStore'
import { sharedMockDataStore } from './mock/MockDataStore'

const LATENCY_MS = {
  read: 250,
  write: 400
} as const

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `item-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export class MockReferenceListRepository implements ReferenceListRepository {
  private store: MockDataStore

  constructor(store: MockDataStore = sharedMockDataStore) {
    this.store = store
  }

  private usageCount(type: ListType, name: string): number {
    const field = LIST_FIELD[type]
    return this.store.transactions.filter((transaction) => transaction[field] === name).length
  }

  private findOrThrow(type: ListType, id: string) {
    const item = this.store.lists[type].find((entry) => entry.id === id)
    if (!item) {
      throw new ApiError('not_found', `${LIST_COPY[type].singular} não encontrada.`)
    }
    return item
  }

  /**
   * Nome vazio e nome repetido são erros diferentes de propósito: o
   * primeiro é `validation_failed` com `fields.name` (aparece embaixo
   * do input), o segundo é `conflict` (o input está certo, o estado é
   * que impede). Colapsar os dois num erro só tira da tela a
   * informação de onde mostrar a mensagem.
   */
  private assertNameAvailable(type: ListType, name: string, ignoreId?: string): string {
    const trimmed = name.trim()
    if (trimmed === '') {
      throw new ApiError('validation_failed', 'O nome não pode ficar em branco.', {
        fields: { name: 'Informe um nome.' }
      })
    }

    const normalized = normalizeListItemName(trimmed)
    const clash = this.store.lists[type].some(
      (entry) => entry.id !== ignoreId && normalizeListItemName(entry.name) === normalized
    )
    if (clash) {
      throw new ApiError('conflict', `Já existe "${trimmed}" nesta lista.`, {
        fields: { name: 'Esse nome já está em uso.' }
      })
    }

    return trimmed
  }

  async list(): Promise<ReferenceLists> {
    await wait(LATENCY_MS.read)

    // Ordenado por nome, com regras pt-BR: a tela de Listas é para
    // procurar um item específico, e "Água" depois de "Zoológico"
    // (que é onde um sort ASCII coloca) torna isso impossível.
    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

    return LIST_TYPES.reduce((lists, type) => {
      lists[type] = this.store.lists[type]
        .map<ListItem>((entry) => ({
          id: entry.id,
          name: entry.name,
          usageCount: this.usageCount(type, entry.name)
        }))
        .sort((a, b) => collator.compare(a.name, b.name))
      return lists
    }, {} as ReferenceLists)
  }

  async create(type: ListType, name: string): Promise<ListItem> {
    await wait(LATENCY_MS.write)
    const trimmed = this.assertNameAvailable(type, name)

    const created = { id: generateId(), name: trimmed }
    this.store.lists[type] = [...this.store.lists[type], created]

    return { ...created, usageCount: 0 }
  }

  async rename(type: ListType, id: string, name: string): Promise<RenameResult> {
    await wait(LATENCY_MS.write)
    const item = this.findOrThrow(type, id)
    const trimmed = this.assertNameAvailable(type, name, id)
    const previousName = item.name

    this.store.lists[type] = this.store.lists[type].map((entry) =>
      entry.id === id ? { ...entry, name: trimmed } : entry
    )

    // A propagação é o ponto todo desta operação — ver o comentário
    // na porta. Renomear sem isto deixa lançamentos apontando para um
    // valor que não existe mais em lista nenhuma.
    const field = LIST_FIELD[type]
    let updatedTransactions = 0
    this.store.transactions = this.store.transactions.map((transaction) => {
      if (transaction[field] !== previousName) return transaction
      updatedTransactions += 1
      return { ...transaction, [field]: trimmed }
    })

    return { item: { id, name: trimmed, usageCount: updatedTransactions }, updatedTransactions }
  }

  async remove(type: ListType, id: string): Promise<void> {
    await wait(LATENCY_MS.write)
    const item = this.findOrThrow(type, id)
    const usageCount = this.usageCount(type, item.name)

    // Nunca em cascata. Apagar a categoria junto com os 34
    // lançamentos dela é perda de dado que o usuário não pediu; e
    // apagar só a categoria, deixando os lançamentos com um valor
    // órfão, é pior ainda porque é silencioso.
    if (usageCount > 0) {
      throw new ApiError('conflict', `"${item.name}" está em uso em ${usageCount} lançamentos.`, {
        details: { usageCount }
      })
    }

    this.store.lists[type] = this.store.lists[type].filter((entry) => entry.id !== id)
  }

  async reassign(type: ListType, id: string, options: ReassignOptions): Promise<ReassignResult> {
    await wait(LATENCY_MS.write)
    const source = this.findOrThrow(type, id)
    const target = this.findOrThrow(type, options.targetId)

    if (source.id === target.id) {
      throw new ApiError('validation_failed', 'Escolha um destino diferente da origem.', {
        fields: { targetId: 'Escolha um item diferente.' }
      })
    }

    const field = LIST_FIELD[type]
    let updatedTransactions = 0
    this.store.transactions = this.store.transactions.map((transaction) => {
      if (transaction[field] !== source.name) return transaction
      updatedTransactions += 1
      return { ...transaction, [field]: target.name }
    })

    if (options.deleteAfter) {
      this.store.lists[type] = this.store.lists[type].filter((entry) => entry.id !== source.id)
    }

    return { updatedTransactions }
  }
}
