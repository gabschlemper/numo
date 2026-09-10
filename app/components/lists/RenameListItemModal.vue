<!--
  RenameListItemModal.vue

  Separado de `CreateListItemModal` apesar de os dois terem um campo
  de texto só — porque as duas ações não são a mesma coisa nem para o
  usuário nem para o dado. Criar não afeta nada; renomear reescreve o
  valor em todos os lançamentos que usam o nome antigo.

  Por isso este modal avisa, com o número na frente, ANTES de
  confirmar: "isso vai atualizar 34 lançamentos". Sem o aviso, o
  usuário só descobre o alcance da ação depois que ela aconteceu — e
  não existe desfazer.
-->
<script setup lang="ts">
import type { ListItem, ListType } from '~/types/referenceList'
import { LIST_COPY } from '~/types/referenceList'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  type: ListType
  item: ListItem
  saving: boolean
  fieldError: string | null
}>()

const emit = defineEmits<{ rename: [name: string] }>()

const name = ref(props.item.name)

const copy = computed(() => LIST_COPY[props.type])
const trimmed = computed(() => name.value.trim())
const changed = computed(() => trimmed.value !== props.item.name)
const canSubmit = computed(() => trimmed.value !== '' && changed.value)

watch(
  () => [open.value, props.item] as const,
  ([isOpen]) => {
    if (isOpen) name.value = props.item.name
  }
)
</script>

<template>
  <UModal v-model:open="open" :title="`Renomear ${copy.singular}`">
    <template #body>
      <form id="rename-list-item" @submit.prevent="canSubmit && emit('rename', name)">
        <UFormField label="Nome" :error="props.fieldError ?? undefined">
          <UInput v-model="name" autofocus :disabled="props.saving" class="w-full" />
        </UFormField>

        <UAlert
          v-if="props.item.usageCount > 0"
          class="mt-4"
          color="info"
          variant="subtle"
          icon="i-lucide-info"
          :title="
            props.item.usageCount === 1
              ? 'Isso vai atualizar 1 lançamento.'
              : `Isso vai atualizar ${props.item.usageCount} lançamentos.`
          "
          description="Os lançamentos que usam este nome passam a usar o novo automaticamente."
        />
      </form>
    </template>

    <template #footer>
      <div class="ms-auto flex gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />
        <UButton
          type="submit"
          form="rename-list-item"
          label="Salvar"
          :disabled="!canSubmit"
          :loading="props.saving"
        />
      </div>
    </template>
  </UModal>
</template>
