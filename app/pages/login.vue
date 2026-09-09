<!--
  pages/login.vue

  Rendered inside the `auth` layout (no sidebar — see layouts/auth.vue).
  Redirect-if-already-logged-in lives in middleware/auth.global.ts, not
  here. Redirect-after-success is still this page's job, though: it's
  what triggers the navigation that makes the middleware re-run in the
  first place (a state change alone doesn't).
-->
<script setup lang="ts">
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '~/constants/demoAccounts'

definePageMeta({ layout: 'auth' })

const { login, loading, error, clearError } = useAuth()
clearError()

const form = reactive({ email: '', password: '' })

async function handleSubmit(): Promise<void> {
  try {
    await login({ ...form })
    await navigateTo('/transactions')
  } catch {
    // Already surfaced via `error` below — nothing else to do here.
  }
}
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-6">
    <div class="text-center">
      <h1 class="text-lg font-semibold">Entrar no Numo</h1>
      <p class="text-sm text-muted">Controle financeiro flexível — pessoal ou compartilhado.</p>
    </div>

    <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-alert-triangle" :description="error" />

    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <UFormField label="E-mail" name="email">
        <UInput v-model="form.email" type="email" placeholder="voce@exemplo.com" autocomplete="email" required class="w-full" />
      </UFormField>

      <UFormField label="Senha" name="password">
        <UInput v-model="form.password" type="password" placeholder="••••••••" autocomplete="current-password" required class="w-full" />
      </UFormField>

      <div class="flex justify-end -mt-2">
        <NuxtLink to="/forgot-password" class="text-sm text-primary hover:underline">Esqueceu a senha?</NuxtLink>
      </div>

      <UButton type="submit" label="Entrar" block :loading="loading" />
    </form>

    <p class="text-center text-sm text-muted">
      Não tem conta?
      <NuxtLink to="/signup" class="font-medium text-primary hover:underline">Criar conta</NuxtLink>
    </p>

    <p class="text-center text-xs text-muted">
      Demo: {{ DEMO_ACCOUNTS.map((account) => account.email).join(' / ') }} · senha {{ DEMO_PASSWORD }}
    </p>
  </div>
</template>
