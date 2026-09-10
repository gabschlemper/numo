// app/repositories/mock/MockAccountStore.ts
//
// A "tabela de contas" dos adaptadores mock, mais o ponteiro de
// sessão. Mesmo papel (e mesmas ressalvas) do `MockDataStore`: é o
// stand-in de uma base única, e é MOCK-ONLY — `ApiAuthRepository` e
// `ApiProfileRepository` não vão compartilhar nada, quem garante a
// consistência é o servidor.
//
// Foi extraído de dentro de `MockAuthRepository` quando a tela de
// Perfil apareceu: trocar o nome ou a senha mexe na MESMA conta que
// o login lê. Com cada adaptador guardando o próprio array, o
// usuário trocaria a senha e continuaria entrando com a antiga.
//
// Injetado no construtor, com um singleton como default: o app
// compartilha uma instância e cada teste cria a sua. Antes disso, os
// testes de auth precisavam de `vi.resetModules()` + re-import
// dinâmico para conseguir isolamento — o construtor resolve isso sem
// truque de módulo.
//
// A persistência em `localStorage` é deliberada e está documentada em
// ARCHITECTURE.md: sem ela, quem se cadastra perde a conta no
// primeiro F5. Ela é do mock e some com um backend real (que emitiria
// cookie `httpOnly`).
import type { User } from '~/types/user'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '~/constants/demoAccounts'

export interface StoredAccount extends User {
  password: string
}

const SESSION_STORAGE_KEY = 'numo-auth-session'
const ACCOUNTS_STORAGE_KEY = 'numo-auth-accounts'

// Ids fixos (e não gerados) para as contas semente serem AS MESMAS
// entre recarregamentos — este módulo reexecuta do zero a cada
// reload, e um id aleatório invalidaria silenciosamente toda sessão
// persistida.
function defaultAccounts(): StoredAccount[] {
  return DEMO_ACCOUNTS.map((account) => ({ ...account, password: DEMO_PASSWORD }))
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function toPublicUser(account: StoredAccount): User {
  const { id, name, email } = account
  return { id, name, email }
}

export class MockAccountStore {
  accounts: StoredAccount[]

  constructor(accounts?: StoredAccount[]) {
    this.accounts = accounts ?? this.load()
  }

  private load(): StoredAccount[] {
    if (typeof window === 'undefined') return defaultAccounts()
    try {
      const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY)
      if (!raw) return defaultAccounts()
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as StoredAccount[]) : defaultAccounts()
    } catch {
      // localStorage corrompido — cai no padrão em vez de quebrar.
      return defaultAccounts()
    }
  }

  save(): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(this.accounts))
  }

  findById(id: string): StoredAccount | undefined {
    return this.accounts.find((account) => account.id === id)
  }

  findByEmail(email: string): StoredAccount | undefined {
    return this.accounts.find((account) => account.email === normalizeEmail(email))
  }

  add(account: StoredAccount): void {
    this.accounts.push(account)
    this.save()
  }

  readSession(): string | null {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(SESSION_STORAGE_KEY)
  }

  writeSession(userId: string): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SESSION_STORAGE_KEY, userId)
  }

  clearSession(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

/** A instância que o app usa. Testes criam a sua própria. */
export const sharedMockAccountStore = new MockAccountStore()
