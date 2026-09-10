// app/composables/useProfileRepository.ts
//
// O ÚNICO ponto que sabe qual adaptador concreto implementa
// `ProfileRepository`. No dia do backend, vira
// `return new ApiProfileRepository($fetch)`.
import type { ProfileRepository } from '~/repositories/ProfileRepository'
import { MockProfileRepository } from '~/repositories/MockProfileRepository'

let instance: ProfileRepository | null = null

export function useProfileRepository(): ProfileRepository {
  if (!instance) {
    instance = new MockProfileRepository()
  }
  return instance
}
