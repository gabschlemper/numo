<!--
  pages/forgot-password.vue

  Always shows the same success state regardless of whether the email
  belongs to a real account (see AuthRepository.requestPasswordReset's
  doc comment) — the UI must never be usable to check which addresses
  are registered, mock or real.
-->
<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { requestPasswordReset, loading, error, clearError } = useAuth()
clearError()

const email = ref('')
const submitted = ref(false)

async function handleSubmit(): Promise<void> {
  try {
    await requestPasswordReset({ email: email.value })
    submitted.value = true
  } catch {
    // Already surfaced via `error` below — nothing else to do here.
  }
}
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-6">
    <div class="text-center">
      <h1 class="text-lg font-semibold">Esqueceu a senha?</h1>
      <p class="text-sm text-muted">Informe seu e-mail e enviaremos um link para redefinir a senha.</p>
    </div>

    <template v-if="!submitted">
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-alert-triangle" :description="error" />

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <UFormField label="E-mail" name="email">
          <UInput v-model="email" type="email" placeholder="voce@exemplo.com" autocomplete="email" required class="w-full" />
        </UFormField>

        <UButton type="submit" label="Enviar link de redefinição" block :loading="loading" />
      </form>
    </template>

    <UAlert
      v-else
      color="success"
      variant="subtle"
      icon="i-lucide-mail-check"
      title="Se esse e-mail existir, enviamos um link"
      description="Confira sua caixa de entrada (e o spam) — o link de redefinição expira em algumas horas."
    />

    <p class="text-center text-sm text-muted">
      Lembrou a senha?
      <NuxtLink to="/login" class="font-medium text-primary hover:underline">Voltar para o login</NuxtLink>
    </p>
  </div>
</template>
