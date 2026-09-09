// Fake timers stand in for the wizard's simulated 400ms parsing delay —
// real timers would work too, but would make this file the slowest one
// in the whole suite for no benefit (the delay itself isn't what's
// being tested).
import { describe, expect, it, vi } from 'vitest'
import { useSpreadsheetImport } from '~/composables/useSpreadsheetImport'

describe('useSpreadsheetImport', () => {
  it('starts at step 0 with no account/file/result', () => {
    const { activeStep, account, file, result, totalValid } = useSpreadsheetImport()
    expect(activeStep.value).toBe(0)
    expect(account.value).toBe('')
    expect(file.value).toBeNull()
    expect(result.value).toBeNull()
    expect(totalValid.value).toBe(0)
  })

  it('analyze() does nothing when no account has been selected yet', async () => {
    const { analyze, activeStep, file } = useSpreadsheetImport()
    await analyze(new File(['data'], 'fatura.csv', { type: 'text/csv' }))
    expect(activeStep.value).toBe(0)
    expect(file.value).toBeNull()
  })

  it('analyze() populates a result and advances to step 1 once an account is set', async () => {
    vi.useFakeTimers()
    try {
      const composable = useSpreadsheetImport()
      composable.account.value = 'Nubank Gabi'
      const testFile = new File(['data'], 'fatura.csv', { type: 'text/csv' })
      const pending = composable.analyze(testFile)
      expect(composable.analyzing.value).toBe(true)
      await vi.runAllTimersAsync()
      await pending
      expect(composable.analyzing.value).toBe(false)
      expect(composable.activeStep.value).toBe(1)
      expect(composable.file.value?.name).toBe(testFile.name)
      expect(composable.result.value?.file).toBe('fatura.csv')
      expect(composable.result.value?.rows).toHaveLength(12)
    } finally {
      vi.useRealTimers()
    }
  })

  it('applies the selected account to every successfully parsed row (never parsed from the file itself)', async () => {
    vi.useFakeTimers()
    try {
      const composable = useSpreadsheetImport()
      composable.account.value = 'C6 Gabi - Físico'
      const pending = composable.analyze(new File([''], 'fatura.csv'))
      await vi.runAllTimersAsync()
      await pending
      const parsedRows = composable.result.value?.rows.filter((row) => row.draft !== null) ?? []
      expect(parsedRows.length).toBeGreaterThan(0)
      expect(parsedRows.every((row) => row.draft?.account === 'C6 Gabi - Físico')).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('totalValid counts only rows with a draft that are neither duplicates nor errors', async () => {
    vi.useFakeTimers()
    try {
      const composable = useSpreadsheetImport()
      composable.account.value = 'Nubank Gabi'
      const pending = composable.analyze(new File([''], 'fatura.csv'))
      await vi.runAllTimersAsync()
      await pending
      const totalRows = composable.result.value?.rows.length ?? 0
      expect(composable.totalValid.value).toBeGreaterThan(0)
      expect(composable.totalValid.value).toBeLessThan(totalRows)
    } finally {
      vi.useRealTimers()
    }
  })

  it('advanceToReview() moves to step 2', () => {
    const { advanceToReview, activeStep } = useSpreadsheetImport()
    advanceToReview()
    expect(activeStep.value).toBe(2)
  })

  it('goBack() moves back one step and never goes below 0', () => {
    const { advanceToReview, goBack, activeStep } = useSpreadsheetImport()
    advanceToReview()
    goBack()
    expect(activeStep.value).toBe(1)
    goBack()
    goBack()
    expect(activeStep.value).toBe(0)
  })

  it('reset() clears everything back to the initial state', async () => {
    vi.useFakeTimers()
    try {
      const composable = useSpreadsheetImport()
      composable.account.value = 'Nubank Gabi'
      const pending = composable.analyze(new File([''], 'fatura.csv'))
      await vi.runAllTimersAsync()
      await pending
      composable.reset()
      expect(composable.activeStep.value).toBe(0)
      expect(composable.account.value).toBe('')
      expect(composable.file.value).toBeNull()
      expect(composable.result.value).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
