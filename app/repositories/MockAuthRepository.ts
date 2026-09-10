// app/repositories/MockAuthRepository.ts
//
// The ADAPTER used during frontend-first development — same idea as
// MockTransactionRepository (see that file's header comment): every
// method is async and returns fresh copies, so an `ApiAuthRepository`
// backed by a real server is a drop-in replacement later (Liskov
// Substitution). Two things here exist ONLY because there is no real
// backend yet, and both disappear the day one exists:
//
// 1. Plaintext passwords kept in memory. A real backend never receives
//    or stores a plaintext password outside the request that hashes
//    it — this mock does, because it has no server to hash anything.
//    Never pattern-match this file for how auth should work for real.
// 2. Session persistence via localStorage (see `MockAccountStore`).
//    A real adapter would rely on an
//    httpOnly cookie the server sets and reads — invisible to this
//    code entirely. Keeping that detail inside this file (never
//    exposed through `AuthRepository`) is what makes the swap painless.
//
// To manually test the error states: an email or name containing
// "forçar erro" (case-insensitive) makes the matching operation reject
// with a simulated server error — same convention as
// MockTransactionRepository.
import type { AuthRepository } from './AuthRepository'
import type { User, LoginCredentials, SignupData, PasswordResetRequest } from '~/types/user'
import type { MockAccountStore, StoredAccount } from './mock/MockAccountStore'
import { normalizeEmail, sharedMockAccountStore, toPublicUser } from './mock/MockAccountStore'

const FORCE_ERROR_TRIGGER = 'forçar erro'

const LATENCY_MS = {
  check: 300,
  write: 450
} as const

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `user-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function hasForceErrorTrigger(...values: string[]): boolean {
  return values.some((value) => value.toLowerCase().includes(FORCE_ERROR_TRIGGER))
}

export class MockAuthRepository implements AuthRepository {
  // A tabela de contas e o ponteiro de sessão saíram deste arquivo
  // para `mock/MockAccountStore.ts` quando a tela de Perfil chegou:
  // trocar nome/senha mexe na MESMA conta que o login lê. Ver o
  // cabeçalho daquele arquivo.
  private store: MockAccountStore

  constructor(store: MockAccountStore = sharedMockAccountStore) {
    this.store = store
  }

  async getCurrentUser(): Promise<User | null> {
    await wait(LATENCY_MS.check)
    const sessionUserId = this.store.readSession()
    if (!sessionUserId) return null

    const account = this.store.findById(sessionUserId)
    if (!account) {
      // Session pointed at an account that no longer exists — clean up
      // rather than leaving a dangling session around.
      this.store.clearSession()
      return null
    }
    return toPublicUser(account)
  }

  async login({ email, password }: LoginCredentials): Promise<User> {
    await wait(LATENCY_MS.write)
    if (hasForceErrorTrigger(email)) {
      throw new Error('Falha simulada: e-mail contém "forçar erro".')
    }

    const account = this.store.findByEmail(email)
    if (!account || account.password !== password) {
      throw new Error('E-mail ou senha incorretos.')
    }

    this.store.writeSession(account.id)
    return toPublicUser(account)
  }

  async signup({ name, email, password }: SignupData): Promise<User> {
    await wait(LATENCY_MS.write)
    if (hasForceErrorTrigger(name, email)) {
      throw new Error('Falha simulada: nome ou e-mail contém "forçar erro".')
    }

    const normalizedEmail = normalizeEmail(email)
    if (this.store.findByEmail(normalizedEmail)) {
      throw new Error('Já existe uma conta com esse e-mail.')
    }

    const account: StoredAccount = { id: generateId(), name: name.trim(), email: normalizedEmail, password }
    this.store.add(account)
    this.store.writeSession(account.id)
    return toPublicUser(account)
  }

  async requestPasswordReset({ email }: PasswordResetRequest): Promise<void> {
    await wait(LATENCY_MS.write)
    // Testing hook only — a real backend can fail here too (mail
    // provider down, rate limit), it just never fails *because* of
    // which email was given, which is the property this simulates.
    if (hasForceErrorTrigger(email)) {
      throw new Error('Falha simulada: e-mail contém "forçar erro".')
    }
    // Deliberately does nothing else — resolves the same way whether
    // or not `email` belongs to a real account, so the UI can never be
    // used to enumerate registered addresses.
  }

  async logout(): Promise<void> {
    await wait(LATENCY_MS.check)
    this.store.clearSession()
  }
}
