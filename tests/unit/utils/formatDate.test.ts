import { describe, expect, it } from 'vitest'
import { formatShortDate, formatLongDate, todayIso } from '~/utils/formatDate'

describe('formatShortDate', () => {
  it('formats an ISO date as DD/MM', () => {
    expect(formatShortDate('2026-11-03')).toBe('03/11')
  })

  it('pads single-digit day and month', () => {
    expect(formatShortDate('2026-01-01')).toBe('01/01')
  })
})

describe('formatLongDate', () => {
  it('formats an ISO date as DD/MM/YYYY', () => {
    expect(formatLongDate('2026-11-03')).toBe('03/11/2026')
  })
})

describe('todayIso', () => {
  it('returns today as an ISO date (YYYY-MM-DD)', () => {
    const result = todayIso()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result).toBe(new Date().toISOString().slice(0, 10))
  })
})
