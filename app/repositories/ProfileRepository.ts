// app/repositories/ProfileRepository.ts
//
// A PORTA do Perfil.
//
// Separada de `AuthRepository` por Segregação de Interface e porque
// no contrato são recursos distintos (`/auth/*` vs `/me`): trocar o
// próprio nome não é autenticação, e um adaptador de autenticação
// não deveria ser obrigado a implementá-lo. `AuthRepository`
// responde "quem é você e como você entra"; esta responde "mude
// isto em você".
import type { PasswordChange, ProfileUpdate, User } from '~/types/user'

export interface ProfileRepository {
  /** Devolve o usuário já atualizado — a UI não remonta o objeto por conta própria. */
  updateProfile(patch: ProfileUpdate): Promise<User>

  /**
   * Rejeita com `validation_failed` e `fields.currentPassword`
   * quando a senha atual não confere — é o que faz a mensagem
   * aparecer embaixo do campo certo em vez de num toast genérico.
   */
  changePassword(request: PasswordChange): Promise<void>
}
