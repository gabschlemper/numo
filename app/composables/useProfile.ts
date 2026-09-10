// app/composables/useProfile.ts
//
// As duas ações da tela de Perfil, contra a interface
// `ProfileRepository`. Não guarda o usuário — quem guarda é
// `useAuth`; este composable só executa a mudança e pede para
// `useAuth` re-perguntar quem está logado.
//
// Essa divisão é o que evita duas cópias do usuário no app. A
// alternativa (a tela de Perfil escrever direto no estado de
// `useAuth`) funcionaria hoje e passaria a mentir no dia em que o
// servidor normalizar algo que o cliente mandou — um nome com
// espaços duplicados, por exemplo, voltaria limpo do servidor e sujo
// na tela.
//
// Não tem `run()` com estado de erro compartilhado como
// `useTransactions`: os erros aqui são de campo (`ApiError.fields`) e
// pertencem ao formulário que os causou, não a um banner de página.
import type { PasswordChange, ProfileUpdate } from '~/types/user'

export function useProfile() {
  const repository = useProfileRepository()
  const { refreshUser } = useAuth()

  async function updateProfile(patch: ProfileUpdate): Promise<void> {
    await repository.updateProfile(patch)
    // Sem isto, o nome muda no formulário e continua o antigo no
    // avatar da barra lateral — o usuário conclui que não salvou.
    await refreshUser()
  }

  async function changePassword(request: PasswordChange): Promise<void> {
    await repository.changePassword(request)
  }

  return { updateProfile, changePassword }
}
