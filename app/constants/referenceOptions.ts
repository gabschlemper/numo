// app/constants/referenceOptions.ts
//
// Este arquivo guarda DUAS coisas de naturezas diferentes, e a
// distinção importa:
//
// 1. METHODS / TYPES / STATUS / REIMBURSABLE_OPTIONS — uniões
//    FECHADAS do domínio (ver `types/transaction.ts`). São código,
//    não dado: uma forma de pagamento nova mexe em tipo, validação e
//    regra de resumo. Os componentes importam estas daqui, direto.
//
// 2. CATEGORIES / ACCOUNTS / DEBTORS — hoje são apenas o SEED das
//    listas editáveis. Nenhum componente as lê mais: desde a tela de
//    Listas, categorias/contas/devedores vêm de
//    `ReferenceListRepository` via `useReferenceOptions()`, porque o
//    usuário pode criar e renomear. O único consumidor destas três é
//    `repositories/mock/MockDataStore.ts`, que as usa para popular o
//    mock — exatamente como `transactionsSeed.ts`.
//
//    Quando a API existir, estas três somem daqui: o servidor passa a
//    ser a fonte delas. As de cima ficam.
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
