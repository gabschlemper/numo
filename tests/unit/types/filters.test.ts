import { describe, expect, it } from 'vitest'
import { createEmptyFilters, areFiltersEmpty } from '~/types/filters'

describe('createEmptyFilters', () => {
  it('returns every field empty', () => {
    expect(createEmptyFilters()).toEqual({
      search: '',
      categories: [],
      accounts: [],
      methods: [],
      types: [],
      debtors: [],
      status: [],
      reimbursable: []
    })
  })

  it('returns a fresh object each call (no shared array references)', () => {
    const a = createEmptyFilters()
    const b = createEmptyFilters()
    a.categories.push('Transporte')
    expect(b.categories).toEqual([])
  })
})

describe('areFiltersEmpty', () => {
  it('is true for freshly created filters', () => {
    expect(areFiltersEmpty(createEmptyFilters())).toBe(true)
  })

  it('is false when search has non-whitespace content', () => {
    expect(areFiltersEmpty({ ...createEmptyFilters(), search: 'farmácia' })).toBe(false)
  })

  it('treats whitespace-only search as empty', () => {
    expect(areFiltersEmpty({ ...createEmptyFilters(), search: '   ' })).toBe(true)
  })

  it('is false when any list filter has an entry', () => {
    expect(areFiltersEmpty({ ...createEmptyFilters(), categories: ['Transporte'] })).toBe(false)
    expect(areFiltersEmpty({ ...createEmptyFilters(), status: ['Pago'] })).toBe(false)
  })
})
