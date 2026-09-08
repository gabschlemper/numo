// app/constants/referenceOptions.ts
//
// Stand-in for what will later be a user-editable "Listas" table
// (categories/accounts/methods are fixed for now; nothing in the UI
// assumes these arrays are static — swapping this for an API call
// doesn't change any component that consumes them).
import type { PaymentMethod, TransactionStatus, ReimbursementStatus, TransactionType } from '~/types/transaction'

// Typing note: Nuxt UI's `USelectMenu` expects a mutable `items` array
// (`SelectMenuItem[]`), so these lists are deliberately typed as
// mutable even though they're constants in practice — `export const`
// already prevents reassigning the variable itself, which is the
// immutability that matters here.
//
// Values below mirror the `listas` tab of the real spreadsheet
// ("gabi & malu - finanças", surveyed 08/09/2026) — they are no longer
// prototype placeholders.
export const CATEGORIES: string[] = [
  'Ajuda mãe', 'Alimentação', 'Assinaturas', 'Balanço caixa', 'Beleza',
  'Carro', 'Casa', 'Delivery', 'Estudos', 'Farmácia', 'Gasolina', 'Hóquei',
  'Impostos', 'Investimento', 'Lazer', 'Outros', 'Pessoal', 'Pet',
  'Presentes', 'Receita', 'Reforma Lavandeira', 'Restaurantes', 'Roles',
  'Roupas', 'Saúde', 'Supermercado', 'Swile', 'Tabacaria', 'Tarifas',
  'Telefone', 'Terceiros', 'Transferência', 'Transporte', 'Viagem'
]

export const ACCOUNTS: string[] = [
  'C6 Gabi - Físico', 'C6 Gabi - Virtual', 'Inter Malu', 'Nubank Família',
  'Nubank Gabi', 'Swile'
]

export const METHODS: PaymentMethod[] = ['Crédito', 'Débito', 'PIX', 'Investimento', 'VA', 'VR']

export const TYPES: TransactionType[] = ['Receita', 'Fixo', 'Variável', 'Investimento']

export const STATUS: TransactionStatus[] = ['Pago', 'Pendente']

export const REIMBURSABLE_OPTIONS: ReimbursementStatus[] = ['Não', 'Sim']

// Always third parties (friends/family who owe or are owed) — never
// Gabi or Malu. See the `debtor` comment in `types/transaction.ts` for
// the full business rule.
export const DEBTORS: string[] = [
  'Amabile', 'Ana', 'Catarina', 'Djonathan', 'Duda', 'Dudu', 'Fernanda',
  'Fiori', 'Guilherme', 'Gurias faculdade', 'Irmã Amanda', 'Italo', 'Julia',
  'Karol', 'Lele', 'Lidio', 'Lucas', 'Mãe', 'Marcos', 'Maycon', 'Melissa',
  'Milezzi', 'Pedro', 'Roberto', 'Rogério', 'Suzana', 'Toninho', 'Wagna',
  'Ytellon', 'Zu'
]
