// app/types/import.ts
import type { TransactionDraft } from './transaction'

/** One row parsed out of the uploaded spreadsheet, before it becomes a Transaction. */
export interface ImportedRow {
  row: number
  draft: TransactionDraft | null
  likelyDuplicate: boolean
  error: string | null
}

export interface ImportAnalysisResult {
  file: string
  rows: ImportedRow[]
}

export function countValid(result: ImportAnalysisResult): number {
  return result.rows.filter((row) => row.draft !== null && !row.likelyDuplicate && row.error === null).length
}

export function countDuplicates(result: ImportAnalysisResult): number {
  return result.rows.filter((row) => row.likelyDuplicate).length
}

export function countErrors(result: ImportAnalysisResult): number {
  return result.rows.filter((row) => row.error !== null).length
}
