// app/utils/describeFilters.ts
//
// Turns the `TransactionFilters` object into a flat list of "what is
// currently narrowing this list", so the screen can show one removable
// chip per active constraint.
//
// This exists as a pure function rather than markup inside
// `FiltersBar.vue` for the reason Nielsen's "recognition rather than
// recall" heuristic implies: the chips ARE the answer to "why am I
// only seeing 12 rows?", so the mapping from state → visible
// explanation has to be exhaustive, and an exhaustive mapping is
// something worth unit-testing. Adding a field to `TransactionFilters`
// without adding it here would silently produce an invisible filter —
// the test in `tests/unit/utils/describeFilters.test.ts` fails when
// that happens.
import type { TransactionFilters } from '~/types/filters'

/** The multi-select filter keys — i.e. every key except `search`. */
export type ListFilterKey = Exclude<keyof TransactionFilters, 'search'>

export interface FilterChip {
  /** Which filter list this value came from, so removing it is unambiguous. */
  key: ListFilterKey
  /** Human label for that list ("Categoria"), shown before the value. */
  label: string
  /** The selected value itself ("Supermercado"). */
  value: string
}

export const LIST_FILTER_LABELS: Record<ListFilterKey, string> = {
  categories: 'Categoria',
  accounts: 'Conta',
  methods: 'Método',
  types: 'Tipo',
  debtors: 'Devedor',
  status: 'Status',
  reimbursable: 'A reembolsar'
}

const LIST_FILTER_KEYS = Object.keys(LIST_FILTER_LABELS) as ListFilterKey[]

/** One chip per selected value, in the order the filters are declared. */
export function describeActiveFilters(filters: TransactionFilters): FilterChip[] {
  return LIST_FILTER_KEYS.flatMap((key) =>
    filters[key].map((value) => ({ key, label: LIST_FILTER_LABELS[key], value }))
  )
}

/**
 * How many constraints are active, counting a non-empty search as one.
 * Drives the badge on the "Filtros" button — the whole point of which
 * is that a collapsed filter panel must never hide the fact that
 * filters are on.
 */
export function countActiveFilters(filters: TransactionFilters): number {
  const searchCount = filters.search.trim() === '' ? 0 : 1
  return searchCount + LIST_FILTER_KEYS.reduce((total, key) => total + filters[key].length, 0)
}
