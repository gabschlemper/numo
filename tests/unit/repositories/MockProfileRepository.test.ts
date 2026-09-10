import { beforeEach, describe, expect, it } from 'vitest'
import { MockProfileRepository, NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '~/repositories/MockProfileRepository'
import { MockAuthRepository } from '~/repositories/MockAuthRepository'
import { MockAccountStore } from '~/repositories/mock/MockAccountStore'
import { isApiError } from '~/types/apiError'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '~/constants/demoAccounts'

const [malu] = DEMO_ACCOUNTS

async function expectFieldError(promise: Promise<unknown>, field: string) {
  await expect(promise).rejects.toSatisfy(
    (reason: unknown) =>
      isApiError(reason) && reason.code === 'validation_failed' && typeof reason.fields?.[field] === 'string',
    `esperava validation_failed com fields.${field}`
  )
}

describe('MockProfileRepository', () => {
  let store: MockAccountStore
  let auth: MockAuthRepository
  let profile: MockProfileRepository

  beforeEach(async () => {
    store = new MockAccountStore()
    auth = new MockAuthRepository(store)
    profile = new MockProfileRepository(store)
    await auth.login({ email: malu!.email, password: DEMO_PASSWORD })
  })

  describe('sessão', () => {
    it('rejeita com unauthenticated depois do logout', async () => {
      // O ponteiro de sessão vive no `localStorage`, que é global —
      // um store novo continuaria enxergando a sessão aberta. Quem
      // encerra a sessão é o logout, então é ele que este teste usa.
      await auth.logout()
      await expect(profile.updateProfile({ name: 'X' })).rejects.toSatisfy(
        (reason: unknown) => isApiError(reason) && reason.code === 'unauthenticated'
      )
    })

    it('rejeita com unauthenticated quando a sessão aponta para conta inexistente', async () => {
      window.localStorage.setItem('numo-auth-session', 'fantasma')
      await expect(profile.updateProfile({ name: 'X' })).rejects.toSatisfy(
        (reason: unknown) => isApiError(reason) && reason.code === 'unauthenticated'
      )
    })

    it('age sobre a conta da SESSÃO, nunca sobre um id vindo da tela', async () => {
      // A porta não aceita id de usuário justamente para não existir
      // um caminho em que a tela escolha qual conta editar.
      await profile.updateProfile({ name: 'Malu Nova' })
      const outra = store.accounts.find((account) => account.email !== malu!.email)
      expect(outra?.name).not.toBe('Malu Nova')
    })
  })

  describe('updateProfile', () => {
    it('salva o nome sem espaços nas pontas e devolve o usuário atualizado', async () => {
      const updated = await profile.updateProfile({ name: '  Malu Silva  ' })
      expect(updated.name).toBe('Malu Silva')
      expect(updated.email).toBe(malu!.email)
    })

    it('a mudança é vista pelo repositório de auth — é a mesma conta', async () => {
      await profile.updateProfile({ name: 'Malu Silva' })
      await expect(auth.getCurrentUser()).resolves.toMatchObject({ name: 'Malu Silva' })
    })

    it('nunca devolve a senha junto do usuário público', async () => {
      const updated = await profile.updateProfile({ name: 'Malu Silva' })
      expect(updated).not.toHaveProperty('password')
    })

    it('recusa nome curto demais, apontando o campo', async () => {
      await expectFieldError(profile.updateProfile({ name: 'M' }), 'name')
    })

    it('recusa nome só de espaços', async () => {
      await expectFieldError(profile.updateProfile({ name: '   ' }), 'name')
    })

    it('recusa nome longo demais', async () => {
      await expectFieldError(profile.updateProfile({ name: 'a'.repeat(NAME_MAX_LENGTH + 1) }), 'name')
    })

    it('não altera nada quando a validação falha', async () => {
      await expectFieldError(profile.updateProfile({ name: 'M' }), 'name')
      await expect(auth.getCurrentUser()).resolves.toMatchObject({ name: malu!.name })
    })
  })

  describe('changePassword', () => {
    it('troca a senha, e o login passa a exigir a nova', async () => {
      // O teste que só faz sentido com store compartilhado: sem ele,
      // a troca "funcionaria" e o login continuaria aceitando a
      // antiga.
      await profile.changePassword({ currentPassword: DEMO_PASSWORD, newPassword: 'novasenha1' })
      await expect(auth.login({ email: malu!.email, password: 'novasenha1' })).resolves.toBeDefined()
      await expect(auth.login({ email: malu!.email, password: DEMO_PASSWORD })).rejects.toThrow()
    })

    it('recusa senha atual errada, apontando o campo certo', async () => {
      await expectFieldError(
        profile.changePassword({ currentPassword: 'errada', newPassword: 'novasenha1' }),
        'currentPassword'
      )
    })

    it('confere a senha atual ANTES de validar a nova', async () => {
      // Reclamar do tamanho da nova para quem errou a atual entrega
      // a informação de que a atual estava certa.
      await expectFieldError(
        profile.changePassword({ currentPassword: 'errada', newPassword: 'x' }),
        'currentPassword'
      )
    })

    it('recusa nova senha curta demais', async () => {
      await expectFieldError(
        profile.changePassword({ currentPassword: DEMO_PASSWORD, newPassword: 'a'.repeat(PASSWORD_MIN_LENGTH - 1) }),
        'newPassword'
      )
    })

    it('recusa nova senha igual à atual', async () => {
      await expectFieldError(
        profile.changePassword({ currentPassword: DEMO_PASSWORD, newPassword: DEMO_PASSWORD }),
        'newPassword'
      )
    })

    it('não troca nada quando a validação falha', async () => {
      await expectFieldError(
        profile.changePassword({ currentPassword: DEMO_PASSWORD, newPassword: 'abc' }),
        'newPassword'
      )
      await expect(auth.login({ email: malu!.email, password: DEMO_PASSWORD })).resolves.toBeDefined()
    })
  })
})
