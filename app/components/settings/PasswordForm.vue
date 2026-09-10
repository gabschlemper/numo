<!--
  PasswordForm.vue

  Troca de senha: atual, nova e confirmação.

  A confirmação é validada AQUI e não vai para o repositório — ela
  não é um dado, é uma proteção contra erro de digitação, e o
  servidor não tem nada a dizer sobre ela. Mandá-la junto seria
  pedir ao backend que validasse uma regra de formulário.

  Já "senha atual incorreta" é o contrário: só o servidor sabe, e
  chega como `fields.currentPassword` para aparecer embaixo do campo
  certo.

  Os campos são limpos depois de um sucesso — senha em input que
  continua preenchido depois de salvar é convite para o próximo
  visitante da máquina.
-->
<script setup lang="ts">
const props = defineProps<{
  saving: boolean
  /** Erros por campo vindos do repositório. */
  fieldErrors: Record<string, string>
}>()

const emit = defineEmits<{ save: [payload: { currentPassword: string, newPassword: string }] }>()

const currentPassword = ref('')
const newPassword = ref('')
const confirmation = ref('')

const mismatch = computed(() => confirmation.value !== '' && confirmation.value !== newPassword.value)

const canSubmit = computed(
  () =>
    currentPassword.value !== '' &&
    newPassword.value !== '' &&
    confirmation.value === newPassword.value
)

function reset(): void {
  currentPassword.value = ''
  newPassword.value = ''
  confirmation.value = ''
}

defineExpose({ reset })
</script>

<template>
  <section class="flex flex-col gap-4 rounded-[--ui-radius] border border-default bg-default p-4">
    <div>
      <h2 class="font-medium">Senha</h2>
      <p class="text-sm text-muted">
        Pedimos a senha atual mesmo com você já conectada — uma sessão esquecida aberta não deve bastar para trocá-la.
      </p>
    </div>

    <form
      class="flex flex-col gap-4"
      @submit.prevent="canSubmit && emit('save', { currentPassword, newPassword })"
    >
      <UFormField label="Senha atual" :error="props.fieldErrors.currentPassword">
        <UInput
          v-model="currentPassword"
          type="password"
          autocomplete="current-password"
          :disabled="props.saving"
          class="w-full sm:max-w-sm"
        />
      </UFormField>

      <UFormField label="Nova senha" :error="props.fieldErrors.newPassword">
        <UInput
          v-model="newPassword"
          type="password"
          autocomplete="new-password"
          :disabled="props.saving"
          class="w-full sm:max-w-sm"
        />
      </UFormField>

      <UFormField
        label="Confirme a nova senha"
        :error="mismatch ? 'As duas senhas não são iguais.' : undefined"
      >
        <UInput
          v-model="confirmation"
          type="password"
          autocomplete="new-password"
          :disabled="props.saving"
          class="w-full sm:max-w-sm"
        />
      </UFormField>

      <div>
        <UButton type="submit" label="Trocar senha" :disabled="!canSubmit" :loading="props.saving" />
      </div>
    </form>
  </section>
</template>
