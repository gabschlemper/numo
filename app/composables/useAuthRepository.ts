// app/composables/useAuthRepository.ts
//
// The ONE call site allowed to know which concrete adapter implements
// `AuthRepository` — same role `useTransactionRepository` plays for
// transactions. When a real backend exists, this function's body
// becomes the only edit required:
//
//   return new ApiAuthRepository($fetch)
//
// No component, no other composable, changes.
import type { AuthRepository } from '~/repositories/AuthRepository'
import { MockAuthRepository } from '~/repositories/MockAuthRepository'

let instance: AuthRepository | null = null

export function useAuthRepository(): AuthRepository {
  if (!instance) {
    instance = new MockAuthRepository()
  }
  return instance
}
