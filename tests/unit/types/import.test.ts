import { describe, expect, it } from 'vitest'
import { countValid, countDuplicates, countErrors } from '~/types/import'
import type { ImportAnalysisResult, ImportedRow } from '~/types/import'
import type { TransactionDraft } from '~/types/transaction'

function makeDraft(): TransactionDraft {
  return {
    date: '2026-10-01',
    description: 'Posto Ipiranga',
    category: '',
    account: 'Nubank Gabi',
    method: 'Crédito',
    amount: 50,
    type: 'Variável',
    installment: null,
    status: 'Pendente',
    debtor: '',
    reimbursable: 'Não',
    billingMonth: '2026-11'
  }
}

function makeResult(rows: ImportedRow[]): ImportAnalysisResult {
  return { file: 'fatura.csv', rows }
}

describe('countValid / countDuplicates / countErrors', () => {
  const result = makeResult([
    { row: 2, draft: makeDraft(), likelyDuplicate: false, error: null },
    { row: 3, draft: makeDraft(), likelyDuplicate: true, error: null },
    { row: 4, draft: null, likelyDuplicate: false, error: 'Valor vazio' },
    { row: 5, draft: makeDraft(), likelyDuplicate: false, error: null }
  ])

  it('counts rows that have a draft, are not duplicates, and have no error', () => {
    expect(countValid(result)).toBe(2)
  })

  it('counts rows flagged as likely duplicates', () => {
    expect(countDuplicates(result)).toBe(1)
  })

  it('counts rows with a parse error', () => {
    expect(countErrors(result)).toBe(1)
  })

  it('all counts are zero for an empty result', () => {
    const empty = makeResult([])
    expect(countValid(empty)).toBe(0)
    expect(countDuplicates(empty)).toBe(0)
    expect(countErrors(empty)).toBe(0)
  })

  it('a duplicate row with a draft is not counted as valid', () => {
    const onlyDuplicate = makeResult([{ row: 2, draft: makeDraft(), likelyDuplicate: true, error: null }])
    expect(countValid(onlyDuplicate)).toBe(0)
    expect(countDuplicates(onlyDuplicate)).toBe(1)
  })
})
