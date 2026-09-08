// app/types/filters.ts
import type { PaymentMethod, TransactionStatus, ReimbursementStatus, TransactionType } from './transaction'

export interface TransactionFilters {
  search: string
  categories: string[]
  accounts: string[]
  methods: PaymentMethod[]
  types: TransactionType[]
  debtors: string[]
  status: TransactionStatus[]
  reimbursable: ReimbursementStatus[]
}

export function createEmptyFilters(): TransactionFilters {
  return {
    search: '',
    categories: [],
    accounts: [],
    methods: [],
    types: [],
    debtors: [],
    status: [],
    reimbursable: []
  }
}

export function areFiltersEmpty(filters: TransactionFilters): boolean {
  return (
    filters.search.trim() === '' &&
    filters.categories.length === 0 &&
    filters.accounts.length === 0 &&
    filters.methods.length === 0 &&
    filters.types.length === 0 &&
    filters.debtors.length === 0 &&
    filters.status.length === 0 &&
    filters.reimbursable.length === 0
  )
}
