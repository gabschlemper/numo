// app/types/referenceList.ts
//
// O modelo de domínio das "Listas": o vocabulário que o usuário usa
// para classificar lançamentos.
//
// A distinção central deste arquivo é QUAL vocabulário é dado e qual
// é código:
//
//   • categories / accounts / debtors → DADO. Mudam com a vida do
//     usuário, ele cria e renomeia, e por isso viram tabela.
//   • method / type / status / reimbursable → CÓDIGO. São uniões
//     fechadas em `types/transaction.ts`. Uma forma de pagamento nova
//     não é um registro novo: mexe em tipo, validação e regra de
//     resumo. Continuam em `constants/referenceOptions.ts`.
//
// Misturar os dois é o erro fácil aqui — um CRUD genérico de "listas"
// deixaria o usuário criar o método de pagamento "Boleto" e produzir
// lançamentos que nenhuma regra do domínio sabe classificar.
import type { Transaction } from './transaction'

export type ListType = 'categories' | 'accounts' | 'debtors'

export const LIST_TYPES: readonly ListType[] = ['categories', 'accounts', 'debtors'] as const

export interface ListItem {
  readonly id: string
  readonly name: string
  /**
   * Em quantos lançamentos este valor aparece.
   *
   * Sempre derivado dos lançamentos, nunca um contador guardado — um
   * contador desincroniza na primeira exclusão que esquecer de
   * decrementá-lo, e aí a tela promete "não está em uso" logo antes
   * de o servidor recusar a exclusão.
   */
  readonly usageCount: number
}

export type ReferenceLists = Record<ListType, ListItem[]>

/** Qual campo de `Transaction` cada lista alimenta. */
export const LIST_FIELD: Record<ListType, 'category' | 'account' | 'debtor'> = {
  categories: 'category',
  accounts: 'account',
  debtors: 'debtor'
}

interface ListCopy {
  /** Título do painel. */
  plural: string
  /** Usado nas frases de ação ("Excluir categoria"). */
  singular: string
  icon: string
  /** Explica para que serve — a tela não deve exigir que o usuário adivinhe. */
  hint: string
}

export const LIST_COPY: Record<ListType, ListCopy> = {
  categories: {
    plural: 'Categorias',
    singular: 'categoria',
    icon: 'i-lucide-tags',
    hint: 'Como você agrupa seus gastos e receitas.'
  },
  accounts: {
    plural: 'Contas',
    singular: 'conta',
    icon: 'i-lucide-landmark',
    hint: 'Bancos, cartões e benefícios de onde o dinheiro sai ou entra.'
  },
  debtors: {
    plural: 'Devedores',
    singular: 'devedor',
    icon: 'i-lucide-users',
    hint: 'Sempre terceiros — pessoas que devem a você ou a quem você deve.'
  }
}

export interface RenameResult {
  item: ListItem
  /** Quantos lançamentos foram atualizados junto. Vira a confirmação na tela. */
  updatedTransactions: number
}

export interface ReassignOptions {
  targetId: string
  deleteAfter: boolean
}

export interface ReassignResult {
  updatedTransactions: number
}

/** Normalização usada para detectar nome duplicado — mesma regra no mock e no backend. */
export function normalizeListItemName(name: string): string {
  return name.trim().toLowerCase()
}

export function countUsage(transactions: readonly Transaction[], type: ListType, name: string): number {
  const field = LIST_FIELD[type]
  return transactions.filter((transaction) => transaction[field] === name).length
}
