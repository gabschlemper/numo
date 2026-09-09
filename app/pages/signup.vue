<!--
  pages/signup.vue

  Rendered inside the `auth` layout (no sidebar). Password confirmation
  is checked locally (`passwordsMatch`) before ever calling the
  repository — the mock doesn't need it, but a real signup endpoint
  would still only see one password field, so this stays a pure
  frontend nicety rather than something `AuthRepository` needs to know.
-->
<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { signup, loading, error, clearError } = useAuth()
clearError()

const form = reactive({ name: '', email: '', password: '' })
const passwordConfirmation = ref('')

const passwordsMatch = computed(() => form.password === passwordConfirmation.value)
const showMismatch = computed(() => passwordConfirmation.value.length > 0 && !passwordsMatch.value)

async function handleSubmit(): Promise<void> {
  if (!passwordsMatch.value) return
  try {
    await signup({ ...form })
    await navigateTo('/transactions')
  } catch {
    // Already surfaced via `error` below — nothing else to do here.
  }
}
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-6">
    <div class="text-center">
      <h1 class="text-lg font-semibold">Criar conta no Numo</h1>
      <p class="text-sm text-muted">Controle financeiro flexível — pessoal ou compartilhado.</p>
    </div>

    <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-alert-triangle" :description="error" />

    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <UFormField label="Nome" name="name">
        <UInput v-model="form.name" placeholder="Seu nome" autocomplete="name" required class="w-full" />
      </UFormField>

      <UFormField label="E-mail" name="email">
        <UInput v-model="form.email" type="email" placeholder="voce@exemplo.com" autocomplete="email" required class="w-full" />
      </UFormField>

      <UFormField label="Senha" name="password">
        <UInput v-model="form.password" type="password" placeholder="••••••••" autocomplete="new-password" required class="w-full" />
      </UFormField>

      <UFormField
        label="Confirmar senha"
        name="passwordConfirmation"
        :error="showMismatch ? 'As senhas não coincidem.' : undefined"
      >
        <UInput v-model="passwordConfirmation" type="password" placeholder="••••••••" autocomplete="new-password" required class="w-full" />
      </UFormField>

      <UButton type="submit" label="Criar conta" block :loading="loading" :disabled="showMismatch" />
    </form>

    <p class="text-center text-sm text-muted">
      Já tem conta?
      <NuxtLink to="/login" class="font-medium text-primary hover:underline">Entrar</NuxtLink>
    </p>
  </div>
</template>
