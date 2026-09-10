// app/repositories/mock/MockDataStore.ts
//
// O "banco de dados" dos adaptadores mock.
//
// Ele existe porque duas telas mexem no MESMO dado por caminhos
// diferentes: renomear uma categoria em Listas tem que atualizar os
// lançamentos que a usam, e o `usageCount` que Listas mostra tem que
// vir dos lançamentos de verdade. Num backend real isso é trivial —
// é a mesma base. Com dois adaptadores cada um segurando o próprio
// array, Listas mostraria "0 lançamentos" para uma categoria usada em
// 34, e o rename não propagaria nada.
//
// Então este objeto é o stand-in de "uma base só". Ele é MOCK-ONLY:
// `ApiTransactionRepository` e `ApiReferenceListRepository` não vão
// compartilhar nada disso — cada um faz sua request e o servidor é
// que garante a consistência. Nada fora de `repositories/mock/`
// deveria importar este arquivo.
//
// É injetado no construtor (com um singleton como default) em vez de
// ser lido direto do módulo: assim o app inteiro compartilha uma
// instância, e cada teste cria a sua e continua isolado. Um singleton
// lido direto acoplaria todos os testes entre si.
import type { Transaction } from '~/types/transaction'
import type { ListType } from '~/types/referenceList'
import { TRANSACTIONS_SEED } from '~/constants/transactionsSeed'
import { CATEGORIES, ACCOUNTS, DEBTORS } from '~/constants/referenceOptions'

interface StoredListItem {
  id: string
  name: string
}

/**
 * As listas são semeadas a partir de `referenceOptions.ts`, que hoje
 * é a fonte da verdade delas. Quando a API existir, o seed sai daqui
 * e vem do servidor — e `referenceOptions.ts` encolhe para só os
 * enums fechados (ver `types/referenceList.ts`).
 */
function seedList(prefix: string, names: readonly string[]): StoredListItem[] {
  return names.map((name, index) => ({ id: `${prefix}-${index + 1}`, name }))
}

export class MockDataStore {
  transactions: Transaction[]
  lists: Record<ListType, StoredListItem[]>

  constructor() {
    this.transactions = [...TRANSACTIONS_SEED]
    this.lists = {
      categories: seedList('cat', CATEGORIES),
      accounts: seedList('acc', ACCOUNTS),
      debtors: seedList('deb', DEBTORS)
    }
  }
}

/** A instância que o app usa. Testes criam a sua própria. */
export const sharedMockDataStore = new MockDataStore()
