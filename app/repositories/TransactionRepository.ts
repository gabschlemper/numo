// app/repositories/TransactionRepository.ts
//
// The PORT. This interface is the entire contract the rest of the app
// is allowed to depend on for reading/writing transactions — no
// component or composable may import a concrete adapter directly
// (Dependency Inversion Principle). Today `useTransactionRepository()`
// (see composables/) wires it to `MockTransactionRepository`; the day a
// real backend exists, an `ApiTransactionRepository implements
// TransactionRepository` is added and swapped in at that single call
// site. Nothing else in the codebase changes — that's the whole point
// of depending on this interface instead of a concrete class
// (Open/Closed Principle: open for a new adapter, closed for
// modification of existing consumers).
import type { Transaction, TransactionDraft, TransactionPatch, DuplicateOptions } from '~/types/transaction'

export interface TransactionRepository {
  list(): Promise<Transaction[]>
  create(draft: TransactionDraft): Promise<Transaction>
  createMany(drafts: TransactionDraft[]): Promise<Transaction[]>
  update(id: string, patch: TransactionPatch): Promise<Transaction>
  updateMany(ids: string[], patch: TransactionPatch): Promise<Transaction[]>
  duplicate(ids: string[], options: DuplicateOptions): Promise<Transaction[]>
  remove(ids: string[]): Promise<void>
}
