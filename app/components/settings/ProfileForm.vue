<!--
  ProfileForm.vue

  Nome editável, e-mail somente leitura.

  O e-mail não é um campo desabilitado sem explicação — isso só faz o
  usuário clicar nele repetidamente. Ele aparece como valor, com uma
  linha dizendo por que não dá para trocar aqui: e-mail de login é
  fluxo de verificação, não campo de formulário (ver `ProfileUpdate`).

  Interação autocontida: guarda o rascunho e o erro de campo, emite
  `save`. Quem chama o repositório é a página.
-->
<script setup lang="ts">
const props = defineProps<{
  name: string
  email: string
  saving: boolean
  /** Mensagem para o campo `name`, vinda do erro do repositório. */
  fieldError: string | null
}>()

const emit = defineEmits<{ save: [name: string] }>()

const draft = ref(props.name)

watch(() => props.name, (name) => { draft.value = name })

const changed = computed(() => draft.value.trim() !== props.name)
const canSubmit = computed(() => draft.value.trim() !== '' && changed.value)
</script>

<template>
  <section class="flex flex-col gap-4 rounded-[--ui-radius] border border-default bg-default p-4">
    <div>
      <h2 class="font-medium">Perfil</h2>
      <p class="text-sm text-muted">Como você aparece no Numo.</p>
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="canSubmit && emit('save', draft)">
      <UFormField label="Nome" :error="props.fieldError ?? undefined">
        <UInput v-model="draft" :disabled="props.saving" class="w-full sm:max-w-sm" />
      </UFormField>

      <UFormField
        label="E-mail"
        description="Usado para entrar. Para trocar, seria preciso confirmar o endereço novo — por isso não dá para editar aqui."
      >
        <p class="text-sm">{{ props.email }}</p>
      </UFormField>

      <div>
        <UButton type="submit" label="Salvar" :disabled="!canSubmit" :loading="props.saving" />
      </div>
    </form>
  </section>
</template>
