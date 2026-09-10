import { describe, expect, it } from 'vitest'
import { countActiveFilters, describeActiveFilters, LIST_FILTER_LABELS } from '~/utils/describeFilters'
import { createEmptyFilters } from '~/types/filters'

describe('describeActiveFilters', () => {
  it('returns nothing for empty filters', () => {
    expect(describeActiveFilters(createEmptyFilters())).toEqual([])
  })

  it('emits one chip per selected value, tagged with its filter key and label', () => {
    const filters = { ...createEmptyFilters(), categories: ['Casa', 'Pet'], status: ['Pago' as const] }
    expect(describeActiveFilters(filters)).toEqual([
      { key: 'categories', label: 'Categoria', value: 'Casa' },
      { key: 'categories', label: 'Categoria', value: 'Pet' },
      { key: 'status', label: 'Status', value: 'Pago' }
    ])
  })

  it('ignores the free-text search — that chip is rendered separately', () => {
    const filters = { ...createEmptyFilters(), search: 'mercado' }
    expect(describeActiveFilters(filters)).toEqual([])
  })

  it('covers every list filter, so no filter can be applied invisibly', () => {
    // Guards the "recognition rather than recall" contract: adding a
    // key to `TransactionFilters` without labelling it here would let
    // a filter narrow the list with nothing on screen explaining why.
    const declaredKeys = Object.keys(LIST_FILTER_LABELS).sort()
    const filterKeys = Object.keys(createEmptyFilters())
      .filter((key) => key !== 'search')
      .sort()
    expect(declaredKeys).toEqual(filterKeys)
  })
})

describe('countActiveFilters', () => {
  it('is zero for empty filters', () => {
    expect(countActiveFilters(createEmptyFilters())).toBe(0)
  })

  it('counts a non-blank search as exactly one', () => {
    expect(countActiveFilters({ ...createEmptyFilters(), search: 'pizza' })).toBe(1)
  })

  it('does not count a whitespace-only search', () => {
    expect(countActiveFilters({ ...createEmptyFilters(), search: '   ' })).toBe(0)
  })

  it('counts every selected value across every list, plus the search', () => {
    const filters = {
      ...createEmptyFilters(),
      search: 'uber',
      categories: ['Transporte', 'Lazer'],
      methods: ['PIX' as const],
      reimbursable: ['Sim' as const]
    }
    expect(countActiveFilters(filters)).toBe(5)
  })
})
