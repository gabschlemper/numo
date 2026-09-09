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
// 2. Session persistence via localStorage (see `persistSession` /
//    `readPersistedSession`). A real adapter would rely on an
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
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '~/constants/demoAccounts'

interface StoredAccount extends User {
  password: string
}

const SESSION_STORAGE_KEY = 'numo-auth-session'
const ACCOUNTS_STORAGE_KEY = 'numo-auth-accounts'
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hasForceErrorTrigger(...values: string[]): boolean {
  return values.some((value) => value.toLowerCase().includes(FORCE_ERROR_TRIGGER))
}

function toPublicUser(account: StoredAccount): User {
  const { id, name, email } = account
  return { id, name, email }
}

// Fixed ids (not generateId()) so the seed accounts are the SAME
// accounts across a page refresh — this module re-executes from
// scratch on every reload (no backend, nothing else keeps it alive),
// so a random id here would silently invalidate every persisted
// session and every signed-up account the moment the tab reloads.
const DEFAULT_ACCOUNTS: StoredAccount[] = DEMO_ACCOUNTS.map((account) => ({ ...account, password: DEMO_PASSWORD }))

// The accounts "table" itself has to survive a reload too, not just
// the pointer to who's logged in — otherwise anyone who signed up
// loses their account (and anyone logged in loses their session) the
// instant they refresh the page. Real persistence, not a "nice to
// have": read once at module load, written back after every signup.
function loadAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return [...DEFAULT_ACCOUNTS]
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    if (!raw) return [...DEFAULT_ACCOUNTS]
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : [...DEFAULT_ACCOUNTS]
  } catch {
    // Corrupted localStorage contents — fall back rather than crash.
    return [...DEFAULT_ACCOUNTS]
  }
}

function saveAccounts(accounts: StoredAccount[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts))
}

const ACCOUNTS: StoredAccount[] = loadAccounts()

function persistSession(userId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_STORAGE_KEY, userId)
}

function clearPersistedSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

function readPersistedSession(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(SESSION_STORAGE_KEY)
}

export class MockAuthRepository implements AuthRepository {
  async getCurrentUser(): Promise<User | null> {
    await wait(LATENCY_MS.check)
    const sessionUserId = readPersistedSession()
    if (!sessionUserId) return null

    const account = ACCOUNTS.find((candidate) => candidate.id === sessionUserId)
    if (!account) {
      // Session pointed at an account that no longer exists — clean up
      // rather than leaving a dangling session around.
      clearPersistedSession()
      return null
    }
    return toPublicUser(account)
  }

  async login({ email, password }: LoginCredentials): Promise<User> {
    await wait(LATENCY_MS.write)
    if (hasForceErrorTrigger(email)) {
      throw new Error('Falha simulada: e-mail contém "forçar erro".')
    }

    const account = ACCOUNTS.find((candidate) => candidate.email === normalizeEmail(email))
    if (!account || account.password !== password) {
      throw new Error('E-mail ou senha incorretos.')
    }

    persistSession(account.id)
    return toPublicUser(account)
  }

  async signup({ name, email, password }: SignupData): Promise<User> {
    await wait(LATENCY_MS.write)
    if (hasForceErrorTrigger(name, email)) {
      throw new Error('Falha simulada: nome ou e-mail contém "forçar erro".')
    }

    const normalizedEmail = normalizeEmail(email)
    if (ACCOUNTS.some((candidate) => candidate.email === normalizedEmail)) {
      throw new Error('Já existe uma conta com esse e-mail.')
    }

    const account: StoredAccount = { id: generateId(), name: name.trim(), email: normalizedEmail, password }
    ACCOUNTS.push(account)
    saveAccounts(ACCOUNTS)
    persistSession(account.id)
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
    clearPersistedSession()
  }
}
