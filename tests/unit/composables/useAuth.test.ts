// Same isolation strategy as useTransactions.test.ts: stub the
// auto-imported `useAuthRepository()` global with a fake before calling
// `useAuth()` (it resolves the repository once, at call time — see that
// composable's source), so every test controls exactly what the
// "backend" answers without touching the real MockAuthRepository or its
// localStorage persistence.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '~/composables/useAuth'
import type { AuthRepository } from '~/repositories/AuthRepository'
import type { User } from '~/types/user'

const MALU: User = { id: 'seed-malu', name: 'Malu', email: 'malu@numo.app' }

function stubRepository(overrides: Partial<AuthRepository> = {}): AuthRepository {
  const repo: AuthRepository = {
    getCurrentUser: vi.fn().mockResolvedValue(null),
    login: vi.fn(),
    signup: vi.fn(),
    requestPasswordReset: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides
  }
  vi.stubGlobal('useAuthRepository', () => repo)
  return repo
}

describe('useAuth', () => {
  beforeEach(() => {
    stubRepository()
  })

  it('starts logged out, not loading, without error', () => {
    const { user, loading, error, isAuthenticated } = useAuth()
    expect(user.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(isAuthenticated.value).toBe(false)
  })

  describe('restoreSession', () => {
    it('sets the user when the repository reports an active session', async () => {
      stubRepository({ getCurrentUser: vi.fn().mockResolvedValue(MALU) })
      const { restoreSession, user, isAuthenticated } = useAuth()
      await restoreSession()
      expect(user.value).toEqual(MALU)
      expect(isAuthenticated.value).toBe(true)
    })

    it('is idempotent — a second call does not hit the repository again', async () => {
      const getCurrentUser = vi.fn().mockResolvedValue(MALU)
      stubRepository({ getCurrentUser })
      const { restoreSession } = useAuth()
      await restoreSession()
      await restoreSession()
      expect(getCurrentUser).toHaveBeenCalledTimes(1)
    })

    it('treats a failed session check the same as "not logged in", without throwing', async () => {
      stubRepository({ getCurrentUser: vi.fn().mockRejectedValue(new Error('network down')) })
      const { restoreSession, user, isAuthenticated } = useAuth()
      await expect(restoreSession()).resolves.toBeUndefined()
      expect(user.value).toBeNull()
      expect(isAuthenticated.value).toBe(false)
    })
  })

  describe('login', () => {
    it('sets the user on success', async () => {
      stubRepository({ login: vi.fn().mockResolvedValue(MALU) })
      const { login, user, isAuthenticated } = useAuth()
      const result = await login({ email: MALU.email, password: 'numo123' })
      expect(result).toEqual(MALU)
      expect(user.value).toEqual(MALU)
      expect(isAuthenticated.value).toBe(true)
    })

    it('sets error and re-throws on failure, leaving the user logged out', async () => {
      stubRepository({ login: vi.fn().mockRejectedValue(new Error('E-mail ou senha incorretos.')) })
      const { login, user, error } = useAuth()
      await expect(login({ email: MALU.email, password: 'errada' })).rejects.toThrow('E-mail ou senha incorretos.')
      expect(user.value).toBeNull()
      expect(error.value).toBe('E-mail ou senha incorretos.')
    })
  })

  describe('signup', () => {
    it('sets the user on success', async () => {
      const created: User = { id: 'new-1', name: 'Nova Conta', email: 'nova@numo.app' }
      stubRepository({ signup: vi.fn().mockResolvedValue(created) })
      const { signup, user } = useAuth()
      await signup({ name: 'Nova Conta', email: 'nova@numo.app', password: 'segredo123' })
      expect(user.value).toEqual(created)
    })
  })

  describe('requestPasswordReset', () => {
    it('resolves without changing the session', async () => {
      const { requestPasswordReset, user } = useAuth()
      await expect(requestPasswordReset({ email: MALU.email })).resolves.toBeUndefined()
      expect(user.value).toBeNull()
    })
  })

  describe('logout', () => {
    it('clears the user', async () => {
      stubRepository({ getCurrentUser: vi.fn().mockResolvedValue(MALU), logout: vi.fn().mockResolvedValue(undefined) })
      const composable = useAuth()
      await composable.restoreSession()
      expect(composable.isAuthenticated.value).toBe(true)
      await composable.logout()
      expect(composable.user.value).toBeNull()
      expect(composable.isAuthenticated.value).toBe(false)
    })
  })

  describe('clearError', () => {
    it('resets a stale error left over from a previous action', async () => {
      stubRepository({ login: vi.fn().mockRejectedValue(new Error('falhou')) })
      const composable = useAuth()
      await expect(composable.login({ email: MALU.email, password: 'x' })).rejects.toThrow()
      expect(composable.error.value).toBe('falhou')
      composable.clearError()
      expect(composable.error.value).toBeNull()
    })
  })
})
