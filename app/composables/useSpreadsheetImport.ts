// app/composables/useSpreadsheetImport.ts
//
// Drives the 4-step import wizard's state. The actual spreadsheet
// parsing is mocked here (`simulateFileAnalysis` fabricates a
// plausible result instead of reading real .xlsx bytes) — this is the
// frontend-first phase, and parsing belongs behind the same
// repository-style boundary once there's a backend to do it. The one
// thing that must NOT change when real parsing arrives is this
// composable's public shape: `ImportAnalysisResult` is already the
// contract a real implementation has to fulfill.
import type { ImportAnalysisResult } from '~/types/import'
import { countValid } from '~/types/import'

const SAMPLE_NAMES = ['Posto Ipiranga', 'Supermercado Fort', 'Farmácia', 'Ifood', 'Cinema', 'Estacionamento']

// A raw card statement (Nubank's own CSV export, for instance, is just
// `date,title,amount` — see ImportarNubank.gs in the real spreadsheet
// system) never carries a "which card" column of its own: you know
// which card it is because you're the one uploading that card's
// statement. So the account isn't parsed from the file — it's picked
// once, up front, and applied to every row that comes out of it.
function simulateFileAnalysis(file: File, account: string): ImportAnalysisResult {
  // Deterministic simulation for the prototype — the real
  // implementation only swaps out this function for a genuine
  // .xlsx/.csv parser.
  const totalRows = 12
  return {
    file: file.name,
    rows: Array.from({ length: totalRows }, (_, index) => {
      const row = index + 2
      if (index === 3) return { row, draft: null, likelyDuplicate: false, error: 'Valor vazio' }
      if (index === 8) return { row, draft: null, likelyDuplicate: false, error: 'Data em formato inválido' }
      const likelyDuplicate = index === 1 || index === 5

      return {
        row,
        likelyDuplicate,
        error: null,
        draft: {
          date: '2026-10-01',
          description: SAMPLE_NAMES[index % SAMPLE_NAMES.length] ?? 'Lançamento importado',
          category: '',
          account,
          method: 'Crédito',
          amount: 50 + index * 12.3,
          type: 'Variável',
          installment: null,
          status: 'Pendente',
          debtor: '',
          reimbursable: 'Não',
          billingMonth: '2026-11'
        }
      }
    })
  }
}

export function useSpreadsheetImport() {
  const activeStep = ref(0)
  const account = ref('')
  const file = ref<File | null>(null)
  const analyzing = ref(false)
  const result = ref<ImportAnalysisResult | null>(null)

  const totalValid = computed(() => (result.value ? countValid(result.value) : 0))

  async function analyze(selectedFile: File): Promise<void> {
    if (!account.value) return
    file.value = selectedFile
    analyzing.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      result.value = simulateFileAnalysis(selectedFile, account.value)
      activeStep.value = 1
    } finally {
      analyzing.value = false
    }
  }

  function advanceToReview(): void {
    activeStep.value = 2
  }

  function goBack(): void {
    activeStep.value = Math.max(0, activeStep.value - 1)
  }

  function reset(): void {
    activeStep.value = 0
    account.value = ''
    file.value = null
    result.value = null
  }

  return {
    activeStep,
    account,
    file,
    analyzing,
    result,
    totalValid,
    analyze,
    advanceToReview,
    goBack,
    reset
  }
}
