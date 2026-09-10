import { describe, expect, it } from 'vitest'
import { addMonths, billingMonthFromDate, currentBillingMonth, formatBillingMonth, monthsBetween } from '~/utils/billingMonth'

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

describe('currentBillingMonth', () => {
  it('devolve o mês da data de referência, com zero à esquerda', () => {
    expect(currentBillingMonth(new Date('2026-09-10T00:00:00'))).toBe('2026-09')
    expect(currentBillingMonth(new Date('2026-01-31T00:00:00'))).toBe('2026-01')
    expect(currentBillingMonth(new Date('2026-12-01T00:00:00'))).toBe('2026-12')
  })
})

describe('addMonths', () => {
  it('soma dentro do mesmo ano', () => {
    expect(addMonths('2026-03', 2)).toBe('2026-05')
  })

  it('vira o ano para frente e para trás', () => {
    expect(addMonths('2026-11', 2)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-02', -14)).toBe('2024-12')
  })

  it('zero é identidade', () => {
    expect(addMonths('2026-07', 0)).toBe('2026-07')
  })

  it('não sofre o bug de overflow de dia que Date.setMonth teria', () => {
    // 31/01 + 1 mês com setMonth daria 03/03. Sem dia, não há como.
    expect(addMonths('2026-01', 1)).toBe('2026-02')
  })

  it('devolve a entrada inalterada quando ela não é YYYY-MM', () => {
    expect(addMonths('nao-e-mes', 1)).toBe('nao-e-mes')
  })
})

describe('monthsBetween', () => {
  it('inclui as duas pontas', () => {
    expect(monthsBetween('2026-09', '2026-12')).toEqual(['2026-09', '2026-10', '2026-11', '2026-12'])
  })

  it('devolve um único mês quando as pontas coincidem', () => {
    expect(monthsBetween('2026-09', '2026-09')).toEqual(['2026-09'])
  })

  it('atravessa a virada de ano sem pular nada', () => {
    expect(monthsBetween('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })

  it('devolve vazio para intervalo invertido, em vez de laçar para sempre', () => {
    expect(monthsBetween('2026-12', '2026-01')).toEqual([])
  })

  it('não trava com entrada malformada', () => {
    expect(monthsBetween('invalido', '2026-12').length).toBeLessThan(1200)
  })
})
