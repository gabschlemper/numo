// app/composables/useSummaryRepository.ts
//
// O ÚNICO ponto que sabe qual adaptador concreto implementa
// `SummaryRepository`. No dia do backend, o corpo desta função vira
// `return new ApiSummaryRepository($fetch)` e nada mais muda.
import type { SummaryRepository } from '~/repositories/SummaryRepository'
import { MockSummaryRepository } from '~/repositories/MockSummaryRepository'

let instance: SummaryRepository | null = null

export function useSummaryRepository(): SummaryRepository {
  if (!instance) {
    instance = new MockSummaryRepository()
  }
  return instance
}
