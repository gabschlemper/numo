// app/composables/useReferenceListRepository.ts
//
// O ÚNICO ponto que sabe qual adaptador concreto implementa
// `ReferenceListRepository` — mesmo papel de
// `useTransactionRepository`. No dia do backend, o corpo desta função
// vira `return new ApiReferenceListRepository($fetch)` e nada mais no
// projeto muda.
import type { ReferenceListRepository } from '~/repositories/ReferenceListRepository'
import { MockReferenceListRepository } from '~/repositories/MockReferenceListRepository'

let instance: ReferenceListRepository | null = null

export function useReferenceListRepository(): ReferenceListRepository {
  if (!instance) {
    instance = new MockReferenceListRepository()
  }
  return instance
}
