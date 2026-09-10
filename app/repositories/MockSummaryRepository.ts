// app/repositories/MockSummaryRepository.ts
//
// Adaptador mock de `SummaryRepository`. Lê do mesmo `MockDataStore`
// que os outros dois — então excluir um lançamento em /transactions
// ou renomear uma categoria em /lists muda estes números na hora, sem
// nenhuma sincronização à mão.
//
// A agregação em si é a função pura `summarizeByMonth`. Isso é
// deliberado: no dia do backend, essa lógica passa a rodar no
// servidor e a função pura continua existindo, testada, como a
// especificação executável do que o servidor tem que devolver.
import type { SummaryRepository } from './SummaryRepository'
import type { MonthlySummaryQuery, MonthlySummaryResult } from '~/types/summary'
import type { MockDataStore } from './mock/MockDataStore'
import { sharedMockDataStore } from './mock/MockDataStore'
import { summarizeByMonth } from '~/utils/summarizeByMonth'

// Mais alto que uma leitura de lista: é um agregado, e no servidor
// real custaria mais. Estados de carregamento que só aparecem com
// latência realista não são testáveis com latência zero.
const LATENCY_MS = 450

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockSummaryRepository implements SummaryRepository {
  private store: MockDataStore

  constructor(store: MockDataStore = sharedMockDataStore) {
    this.store = store
  }

  async monthly(query: MonthlySummaryQuery): Promise<MonthlySummaryResult> {
    await wait(LATENCY_MS)
    return summarizeByMonth(this.store.transactions, query.from, query.to)
  }
}
