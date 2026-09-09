import { describe, expect, it } from 'vitest'
import { formatCurrency } from '~/utils/formatCurrency'

describe('formatCurrency', () => {
  it('formats a positive value as BRL', () => {
    expect(formatCurrency(1234.5)).toBe('R$\xa01.234,50')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('R$\xa00,00')
  })

  it('formats a negative value with the sign preserved', () => {
    expect(formatCurrency(-58.4)).toBe('-R$\xa058,40')
  })

  it('rounds to two decimal places', () => {
    expect(formatCurrency(10.005)).toBe('R$\xa010,01')
  })
})
