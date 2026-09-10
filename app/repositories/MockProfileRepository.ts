// app/repositories/MockProfileRepository.ts
//
// Adaptador mock de `ProfileRepository`. Compartilha o
// `MockAccountStore` com `MockAuthRepository` — é o que faz a troca
// de senha valer de verdade: depois de trocar, o login só aceita a
// nova. Com stores separados, o usuário trocaria a senha e
// continuaria entrando com a antiga, e nenhum teste desta classe
// perceberia.
//
// As validações abaixo são as do contrato (ver API-CONTRACT.md,
// `PATCH /me` e `POST /me/password`) e lançam `ApiError` com
// `fields`, não string solta.
import type { ProfileRepository } from './ProfileRepository'
import type { PasswordChange, ProfileUpdate, User } from '~/types/user'
import type { MockAccountStore } from './mock/MockAccountStore'
import { sharedMockAccountStore, toPublicUser } from './mock/MockAccountStore'
import { ApiError } from '~/types/apiError'

const LATENCY_MS = 450

export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 80
export const PASSWORD_MIN_LENGTH = 6

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockProfileRepository implements ProfileRepository {
  private store: MockAccountStore

  constructor(store: MockAccountStore = sharedMockAccountStore) {
    this.store = store
  }

  /**
   * "Quem está logado" vem da sessão, nunca de um id que a tela
   * mandou. Aceitar o id do cliente seria deixar qualquer um editar
   * qualquer conta — e é o tipo de brecha que nasce no mock e
   * atravessa para o adaptador real por imitação.
   */
  private currentAccount() {
    const sessionUserId = this.store.readSession()
    const account = sessionUserId ? this.store.findById(sessionUserId) : undefined
    if (!account) {
      throw new ApiError('unauthenticated', 'Sua sessão expirou. Entre de novo para continuar.')
    }
    return account
  }

  async updateProfile({ name }: ProfileUpdate): Promise<User> {
    await wait(LATENCY_MS)
    const account = this.currentAccount()

    const trimmed = name.trim()
    if (trimmed.length < NAME_MIN_LENGTH) {
      throw new ApiError('validation_failed', 'Não foi possível salvar o perfil.', {
        fields: { name: `O nome precisa ter pelo menos ${NAME_MIN_LENGTH} caracteres.` }
      })
    }
    if (trimmed.length > NAME_MAX_LENGTH) {
      throw new ApiError('validation_failed', 'Não foi possível salvar o perfil.', {
        fields: { name: `O nome pode ter no máximo ${NAME_MAX_LENGTH} caracteres.` }
      })
    }

    account.name = trimmed
    this.store.save()
    return toPublicUser(account)
  }

  async changePassword({ currentPassword, newPassword }: PasswordChange): Promise<void> {
    await wait(LATENCY_MS)
    const account = this.currentAccount()

    // A senha atual é conferida ANTES de validar a nova: dizer "a
    // nova é curta demais" para quem errou a atual entrega a
    // informação de que a atual estava certa.
    if (account.password !== currentPassword) {
      throw new ApiError('validation_failed', 'Não foi possível trocar a senha.', {
        fields: { currentPassword: 'Senha atual incorreta.' }
      })
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      throw new ApiError('validation_failed', 'Não foi possível trocar a senha.', {
        fields: { newPassword: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` }
      })
    }

    if (newPassword === currentPassword) {
      throw new ApiError('validation_failed', 'Não foi possível trocar a senha.', {
        fields: { newPassword: 'A nova senha precisa ser diferente da atual.' }
      })
    }

    account.password = newPassword
    this.store.save()
  }
}
