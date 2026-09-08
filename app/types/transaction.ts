// app/types/transaction.ts
//
// Domain model for a single financial entry (a "transaction"). This
// file has exactly one reason to change: the shape of a transaction
// itself changing. Nothing here knows about HTTP, mock data, or Vue —
// that separation is what lets `TransactionRepository` (the port) and
// its adapters vary independently of the domain (Dependency Inversion).

export type TransactionType = 'Receita' | 'Fixo' | 'Variável' | 'Investimento'

export type TransactionStatus = 'Pago' | 'Pendente'

/**
 * Real payment methods in use in the spreadsheet (`listas` tab). "PIX"
 * and "Investimento" are genuine, distinct methods — PIX is by far the
 * most used one in real transactions — and "VA"/"VR" are separate
 * benefit accounts, never a combined "VR/VA" value.
 */
export type PaymentMethod = 'Crédito' | 'Débito' | 'PIX' | 'Investimento' | 'VA' | 'VR'

/**
 * The only criterion that removes an expense from "own spending" in
 * the summaries — reserved for the case "I fronted the money and will
 * be reimbursed specifically for it". Not to be confused with
 * `debtor`: a transaction can have a debtor set (meaning "I owe this
 * to that person") and still be genuine own spending — the two fields
 * answer different questions.
 */
export type ReimbursementStatus = 'Sim' | 'Não'

export interface Transaction {
  readonly id: string
  date: string
  description: string
  category: string
  account: string
  method: PaymentMethod
  amount: number
  type: TransactionType
  installment: string | null
  status: TransactionStatus
  /**
   * Always a third party (a friend's/family member's name) — never
   * "Gabi" or "Malu". This is a joint budget, deliberately without a
   * "who spent it" column: on an expense (type Fixo/Variável), a
   * debtor means "I owe this to that person"; on income (Receita), it
   * means "that person owes me / is paying me back". Neither case
   * excludes the transaction from any summary — only `reimbursable`
   * does that.
   */
  debtor: string
  reimbursable: ReimbursementStatus
  /**
   * Billing month (when the invoice is due), NOT the purchase date —
   * format "YYYY-MM" (e.g. "2026-11"), never a specific day. An
   * installment purchase keeps `date` fixed at the original purchase
   * while each installment advances this field. Keeping it as
   * "YYYY-MM" (instead of an arbitrary day of the month) is
   * deliberate: the real spreadsheet already suffered 3 historical
   * bugs from this exact column turning into a Date instead of
   * staying a month-granularity value — see `utils/billingMonth.ts`.
   */
  billingMonth: string
}

/** Shape needed to create a transaction — no `id`, the repository owns identity. */
export type TransactionDraft = Omit<Transaction, 'id'>

/**
 * Shape used for both single-row and bulk edits. Every field is
 * optional by design: a bulk edit only ever touches the fields the
 * user explicitly checked, and `undefined` here means "leave the
 * existing value untouched" — never "clear the field".
 */
export type TransactionPatch = Partial<Omit<Transaction, 'id'>>

export interface DuplicateOptions {
  newDate: string | null
  status: TransactionStatus
}
