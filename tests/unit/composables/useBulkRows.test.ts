import { describe, expect, it } from 'vitest'
import { useBulkRows, isRowComplete, type DraftRow } from '~/composables/useBulkRows'

function makeRow(overrides: Partial<DraftRow> = {}): DraftRow {
  return {
    key: 'row-1',
    date: '2026-09-05',
    description: 'Posto Ipiranga',
    category: 'Transporte',
    account: 'Nubank Gabi',
    method: 'Crédito',
    amount: 100,
    type: 'Variável',
    ...overrides
  }
}

describe('isRowComplete', () => {
  it('is true when every required field is filled', () => {
    expect(isRowComplete(makeRow())).toBe(true)
  })

  it.each([
    ['description', { description: '' }],
    ['category', { category: '' }],
    ['account', { account: '' }],
    ['method', { method: undefined }],
    ['type', { type: undefined }],
    ['amount', { amount: null }]
  ] as const)('is false when %s is missing', (_field, overrides) => {
    expect(isRowComplete(makeRow(overrides))).toBe(false)
  })

  it('is false when amount is zero or negative', () => {
    expect(isRowComplete(makeRow({ amount: 0 }))).toBe(false)
    expect(isRowComplete(makeRow({ amount: -10 }))).toBe(false)
  })

  it('treats whitespace-only text fields as missing', () => {
    expect(isRowComplete(makeRow({ description: '   ' }))).toBe(false)
  })
})

describe('useBulkRows', () => {
  it('starts with three empty rows', () => {
    const { rows, filledRows, completeRows } = useBulkRows()
    expect(rows.value).toHaveLength(3)
    expect(filledRows.value).toHaveLength(0)
    expect(completeRows.value).toHaveLength(0)
  })

  it('each starting row has a distinct key', () => {
    const { rows } = useBulkRows()
    const keys = new Set(rows.value.map((row) => row.key))
    expect(keys.size).toBe(3)
  })

  it('filledRows only counts rows with a description or an amount', () => {
    const { rows, filledRows } = useBulkRows()
    const [first] = rows.value
    if (!first) throw new Error('expected at least one row')
    first.description = 'Farmácia'
    expect(filledRows.value).toHaveLength(1)
  })

  it('completeRows/incompleteRows split filled rows by completeness', () => {
    const { rows, completeRows, incompleteRows } = useBulkRows()
    const [first, second] = rows.value
    if (!first || !second) throw new Error('expected at least two rows')
    Object.assign(first, makeRow({ key: first.key }))
    second.amount = 50
    expect(completeRows.value).toHaveLength(1)
    expect(incompleteRows.value).toHaveLength(1)
  })

  it('addRow() appends a new empty row', () => {
    const { rows, addRow } = useBulkRows()
    addRow()
    expect(rows.value).toHaveLength(4)
  })

  it('removeRow() removes only the targeted row', () => {
    const { rows, removeRow } = useBulkRows()
    const targetKey = rows.value[1]?.key
    if (!targetKey) throw new Error('expected a second row')
    removeRow(targetKey)
    expect(rows.value).toHaveLength(2)
    expect(rows.value.some((row) => row.key === targetKey)).toBe(false)
  })

  it('reset() returns to three fresh empty rows', () => {
    const { rows, addRow, reset } = useBulkRows()
    addRow()
    addRow()
    reset()
    expect(rows.value).toHaveLength(3)
    expect(rows.value.every((row) => row.description === '')).toBe(true)
  })

  it('toDrafts() converts only complete rows, trimming description and deriving billingMonth', () => {
    const { rows, toDrafts } = useBulkRows()
    const [first] = rows.value
    if (!first) throw new Error('expected at least one row')
    Object.assign(first, makeRow({ key: first.key, description: '  Farmácia  ', date: '2026-09-20' }))
    const drafts = toDrafts()
    expect(drafts).toHaveLength(1)
    expect(drafts[0]).toMatchObject({
      description: 'Farmácia',
      billingMonth: '2026-09',
      status: 'Pendente',
      reimbursable: 'Não',
      debtor: '',
      installment: null
    })
  })
})
