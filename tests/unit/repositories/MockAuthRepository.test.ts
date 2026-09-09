// MockAuthRepository keeps its "accounts table" at module scope (see
// that file's header comment) so it survives a page reload the same
// way a real backend's database would. That's exactly what makes it
// awkward to unit-test: every `it()` needs a FRESH module instance
// (via `vi.resetModules()` + a dynamic re-import), otherwise a signup
// in one test would silently still exist in the next one. Clearing
// `localStorage` (done globally in tests/setup.ts's beforeEach) is what
// makes that fresh module fall back to the two seed accounts again.
import { describe, expect, it, vi } from 'vitest'
import type { MockAuthRepository as MockAuthRepositoryType } from '~/repositories/MockAuthRepository'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '~/constants/demoAccounts'

async function freshRepository(): Promise<MockAuthRepositoryType> {
  vi.resetModules()
  const { MockAuthRepository } = await import('~/repositories/MockAuthRepository')
  return new MockAuthRepository()
}

const [malu] = DEMO_ACCOUNTS

describe('MockAuthRepository', () => {
  describe('getCurrentUser', () => {
    it('resolves null when there is no session', async () => {
      const repository = await freshRepository()
      await expect(repository.getCurrentUser()).resolves.toBeNull()
    })

    it('resolves the logged-in user after a successful login', async () => {
      const repository = await freshRepository()
      await repository.login({ email: malu!.email, password: DEMO_PASSWORD })
      await expect(repository.getCurrentUser()).resolves.toMatchObject({ email: malu!.email })
    })

    it('clears a session pointing at an account that no longer exists', async () => {
      const repository = await freshRepository()
      window.localStorage.setItem('numo-auth-session', 'ghost-id')
      await expect(repository.getCurrentUser()).resolves.toBeNull()
      expect(window.localStorage.getItem('numo-auth-session')).toBeNull()
    })
  })

  describe('login', () => {
    it('logs in with a valid demo account and persists the session', async () => {
      const repository = await freshRepository()
      const user = await repository.login({ email: malu!.email, password: DEMO_PASSWORD })
      expect(user.email).toBe(malu!.email)
      expect(window.localStorage.getItem('numo-auth-session')).toBe(user.id)
    })

    it('rejects with the wrong password', async () => {
      const repository = await freshRepository()
      await expect(repository.login({ email: malu!.email, password: 'senha-errada' })).rejects.toThrow(
        /incorretos/
      )
    })

    it('rejects for an email that does not exist', async () => {
      const repository = await freshRepository()
      await expect(
        repository.login({ email: 'ninguem@numo.app', password: DEMO_PASSWORD })
      ).rejects.toThrow(/incorretos/)
    })

    it('rejects when the email carries the force-error trigger', async () => {
      const repository = await freshRepository()
      await expect(
        repository.login({ email: 'forçar erro@numo.app', password: DEMO_PASSWORD })
      ).rejects.toThrow(/Falha simulada/)
    })

    it('matches emails case-insensitively', async () => {
      const repository = await freshRepository()
      await expect(
        repository.login({ email: malu!.email.toUpperCase(), password: DEMO_PASSWORD })
      ).resolves.toMatchObject({ email: malu!.email })
    })
  })

  describe('signup', () => {
    it('creates a new account and logs it in', async () => {
      const repository = await freshRepository()
      const user = await repository.signup({ name: 'Nova Conta', email: 'nova@numo.app', password: 'segredo123' })
      expect(user.name).toBe('Nova Conta')
      expect(window.localStorage.getItem('numo-auth-session')).toBe(user.id)
    })

    it('persists the new account so it can log in again afterwards', async () => {
      const repository = await freshRepository()
      await repository.signup({ name: 'Nova Conta', email: 'nova@numo.app', password: 'segredo123' })
      await repository.logout()
      await expect(
        repository.login({ email: 'nova@numo.app', password: 'segredo123' })
      ).resolves.toMatchObject({ email: 'nova@numo.app' })
    })

    it('rejects when the email is already registered', async () => {
      const repository = await freshRepository()
      await expect(
        repository.signup({ name: 'Outra Malu', email: malu!.email, password: 'segredo123' })
      ).rejects.toThrow(/Já existe uma conta/)
    })

    it('rejects when the name or email carries the force-error trigger', async () => {
      const repository = await freshRepository()
      await expect(
        repository.signup({ name: 'Forçar Erro', email: 'novo@numo.app', password: 'segredo123' })
      ).rejects.toThrow(/Falha simulada/)
    })
  })

  describe('requestPasswordReset', () => {
    it('resolves for an email that exists', async () => {
      const repository = await freshRepository()
      await expect(repository.requestPasswordReset({ email: malu!.email })).resolves.toBeUndefined()
    })

    it('resolves the same way for an email that does not exist (never leaks account existence)', async () => {
      const repository = await freshRepository()
      await expect(repository.requestPasswordReset({ email: 'ninguem@numo.app' })).resolves.toBeUndefined()
    })

    it('rejects when the email carries the force-error trigger', async () => {
      const repository = await freshRepository()
      await expect(repository.requestPasswordReset({ email: 'forçar erro@numo.app' })).rejects.toThrow(
        /Falha simulada/
      )
    })
  })

  describe('logout', () => {
    it('clears the persisted session', async () => {
      const repository = await freshRepository()
      await repository.login({ email: malu!.email, password: DEMO_PASSWORD })
      await repository.logout()
      expect(window.localStorage.getItem('numo-auth-session')).toBeNull()
      await expect(repository.getCurrentUser()).resolves.toBeNull()
    })
  })
})
