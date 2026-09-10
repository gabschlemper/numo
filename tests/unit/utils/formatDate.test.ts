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

describe('formatShortDate — year disambiguation', () => {
  const inThisYear = new Date('2026-06-15T00:00:00')

  it('omits the year for a date in the reference year', () => {
    expect(formatShortDate('2026-11-03', inThisYear)).toBe('03/11')
  })

  it('appends a 2-digit year for a date outside it, in both directions', () => {
    expect(formatShortDate('2025-12-01', inThisYear)).toBe('01/12/25')
    expect(formatShortDate('2027-01-09', inThisYear)).toBe('09/01/27')
  })

  it('makes two same-day-and-month dates from different years distinguishable', () => {
    // The reason the year is conditional at all: sorted by date these
    // two land far apart in the list but used to render identically.
    expect(formatShortDate('2025-12-01', inThisYear)).not.toBe(formatShortDate('2026-12-01', inThisYear))
  })
})
