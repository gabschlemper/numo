<!--
  CreateListItemModal.vue

  Cria um item de lista. Interação autocontida: guarda o texto
  digitado e o erro de campo, e emite `create` — quem chama o
  repositório é a página.

  `fieldError` vem de fora porque quem sabe se o nome colidiu é o
  servidor, não este componente. É o `error.fields.name` do contrato
  chegando embaixo do input em vez de virar um toast genérico — a
  diferença entre "algo deu errado" e "esse nome já está em uso",
  mostrado exatamente onde o usuário pode consertar.
-->
<script setup lang="ts">
import type { ListType } from '~/types/referenceList'
import { LIST_COPY } from '~/types/referenceList'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  type: ListType
  saving: boolean
  /** Mensagem para o campo `name`, vinda do erro do repositório. */
  fieldError: string | null
}>()

const emit = defineEmits<{ create: [name: string] }>()

const name = ref('')

const copy = computed(() => LIST_COPY[props.type])
const canSubmit = computed(() => name.value.trim() !== '')

watch(open, (value) => {
  if (value) name.value = ''
})
</script>

<template>
  <UModal v-model:open="open" :title="`Nova ${copy.singular}`" :description="copy.hint">
    <template #body>
      <!--
        `@submit.prevent` para o Enter funcionar: num formulário de um
        campo só, obrigar o usuário a ir até o botão é atrito puro.
      -->
      <form id="create-list-item" @submit.prevent="canSubmit && emit('create', name)">
        <UFormField label="Nome" :error="props.fieldError ?? undefined">
          <UInput
            v-model="name"
            autofocus
            :disabled="props.saving"
            :placeholder="`Ex: ${copy.singular === 'conta' ? 'Nubank Gabi' : 'Farmácia'}`"
            class="w-full"
          />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="ms-auto flex gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />
        <UButton
          type="submit"
          form="create-list-item"
          label="Criar"
          :disabled="!canSubmit"
          :loading="props.saving"
        />
      </div>
    </template>
  </UModal>
</template>
