// app/composables/useTransactionRepository.ts
//
// The ONE call site allowed to know which concrete adapter implements
// `TransactionRepository`. Every composable/component depends on the
// interface and asks this factory for an instance — none of them
// import `MockTransactionRepository` directly. When a real backend
// exists, this function's body becomes the only edit required:
//
//   return new ApiTransactionRepository($fetch)
//
// No component, no other composable, changes.
import type { TransactionRepository } from '~/repositories/TransactionRepository'
import { MockTransactionRepository } from '~/repositories/MockTransactionRepository'

let instance: TransactionRepository | null = null

export function useTransactionRepository(): TransactionRepository {
  if (!instance) {
    instance = new MockTransactionRepository()
  }
  return instance
}
