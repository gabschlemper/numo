<!--
  pages/settings/index.vue

  Perfil e configurações. Como as outras páginas, é o único lugar
  que decide o que acontece quando o usuário age — os três blocos
  abaixo só desenham e emitem intenção.

  O tratamento de erro aqui é o mesmo padrão que a tela de Listas
  estabeleceu, e é o que justifica o `ApiError` ter `fields`: erro
  de formulário desce para o campo que o causou, e só o que NÃO é de
  campo (sessão expirada, falha inesperada) vira toast. Um toast
  dizendo "não foi possível trocar a senha" sem apontar qual das
  três está errada obriga o usuário a adivinhar.
-->
<script setup lang="ts">
import type { PasswordChange } from '~/types/user'
import { isApiError } from '~/types/apiError'

const toast = useToast()
const { user } = useAuth()
const { updateProfile, changePassword } = useProfile()

/** Erros por campo do repositório; qualquer outra falha vira toast. */
function fieldsOf(reason: unknown): Record<string, string> | null {
  const fields = isApiError(reason) ? reason.fields : undefined
  return fields && Object.keys(fields).length > 0 ? fields : null
}

function toastError(fallback: string, reason: unknown): void {
  const description = reason instanceof Error ? reason.message : undefined
  toast.add({ title: fallback, description, color: 'error' })
}

// --- Perfil ---------------------------------------------------------------
const savingProfile = ref(false)
const profileFieldError = ref<string | null>(null)

async function handleProfileSave(name: string): Promise<void> {
  savingProfile.value = true
  profileFieldError.value = null
  try {
    await updateProfile({ name })
    toast.add({ title: 'Perfil atualizado.', color: 'success' })
  } catch (reason) {
    const fields = fieldsOf(reason)
    if (fields?.name) profileFieldError.value = fields.name
    else toastError('Não foi possível salvar o perfil.', reason)
  } finally {
    savingProfile.value = false
  }
}

// --- Senha ----------------------------------------------------------------
const savingPassword = ref(false)
const passwordFieldErrors = ref<Record<string, string>>({})
const passwordFormRef = ref<{ reset: () => void } | null>(null)

async function handlePasswordSave(payload: PasswordChange): Promise<void> {
  savingPassword.value = true
  passwordFieldErrors.value = {}
  try {
    await changePassword(payload)
    // Limpar é responsabilidade do formulário, mas só a página sabe
    // que deu certo — mesma divisão do `markImported()` do wizard de
    // importação.
    passwordFormRef.value?.reset()
    toast.add({
      title: 'Senha alterada.',
      description: 'Use a nova senha no próximo login.',
      color: 'success'
    })
  } catch (reason) {
    const fields = fieldsOf(reason)
    if (fields) passwordFieldErrors.value = fields
    else toastError('Não foi possível trocar a senha.', reason)
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div class="@container flex min-h-full flex-col gap-4 p-4 sm:p-6">
    <header>
      <h1 class="text-xl font-semibold sm:text-2xl">Perfil e configurações</h1>
      <p class="text-sm text-muted">Sua conta e como o Numo aparece para você.</p>
    </header>

    <!--
      Coluna estreita de propósito: formulário é leitura em linha, e
      um campo de nome com 1200px de largura não fica mais fácil de
      preencher — fica mais difícil de associar rótulo e valor.
    -->
    <div class="flex w-full max-w-2xl flex-col gap-4">
      <ProfileForm
        v-if="user"
        :name="user.name"
        :email="user.email"
        :saving="savingProfile"
        :field-error="profileFieldError"
        @save="handleProfileSave"
      />

      <PasswordForm
        ref="passwordFormRef"
        :saving="savingPassword"
        :field-errors="passwordFieldErrors"
        @save="handlePasswordSave"
      />

      <AppearanceSettings />
    </div>
  </div>
</template>
