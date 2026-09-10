// app/constants/pagination.ts
//
// Page-size constants for the Lançamentos list.
//
// They live here rather than next to `useTransactionPagination` for a
// concrete reason, not tidiness: Nuxt's auto-import scanner (unimport
// → mlly's `findExports`) drops an `export function` that follows two
// or more consecutive `export const`s in the same file. With these
// two declared above it, `useTransactionPagination` silently stopped
// being auto-imported and only failed at typecheck
// ("Cannot find name 'useTransactionPagination'"). Reproduce with:
//
//   export const A = 1
//   export const B = 2
//   export function useThing() {}   // ← never registered
//
// Keeping the composable file to a single exported function sidesteps
// it, and `constants/` is where reference values belong anyway (see
// `referenceOptions.ts`).

/** Small enough that a phone doesn't render 50 cards, large enough that a desktop rarely paginates. */
export const DEFAULT_PAGE_SIZE = 25

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
