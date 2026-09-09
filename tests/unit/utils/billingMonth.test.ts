import { describe, expect, it } from 'vitest'
import { billingMonthFromDate, formatBillingMonth } from '~/utils/billingMonth'

describe('billingMonthFromDate', () => {
  it('derives YYYY-MM from a full ISO date', () => {
    expect(billingMonthFromDate('2026-11-03')).toBe('2026-11')
  })

  it('never returns a value with a day component', () => {
    expect(billingMonthFromDate('2026-01-31')).toBe('2026-01')
  })
})

describe('formatBillingMonth', () => {
  it('formats YYYY-MM as the spreadsheet convention "Mon/YYYY"', () => {
    expect(formatBillingMonth('2026-11')).toBe('Nov/2026')
  })

  it('capitalizes the month abbreviation and drops the trailing dot', () => {
    expect(formatBillingMonth('2026-01')).toBe('Jan/2026')
    expect(formatBillingMonth('2026-09')).toBe('Set/2026')
  })

  it('falls back to the raw input when it cannot be parsed as YYYY-MM', () => {
    expect(formatBillingMonth('invalid')).toBe('invalid')
    expect(formatBillingMonth('')).toBe('')
  })
})
