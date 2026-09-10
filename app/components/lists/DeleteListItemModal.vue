<!--
  DeleteListItemModal.vue

  Um componente para os dois casos de "sumir com este item", porque
  do ponto de vista do usuário é uma decisão só — e porque a versão
  que separa os dois inevitavelmente vira um beco sem saída.

  - Item sem uso: confirmação simples.
  - Item em uso: excluir sozinho não é oferecido. Apagar em cascata
    destruiria lançamentos que ninguém mandou apagar, e apagar só o
    item deixaria 34 lançamentos apontando para um valor que não
    existe mais — silenciosamente. Então a única saída é escolher
    para onde mover, e o botão faz as duas coisas numa operação.

  Sem esse segundo caminho, a recusa do servidor (409) chegaria como
  um toast de erro e o usuário ficaria sem ação nenhuma além de
  editar 34 lançamentos na mão.
-->
<script setup lang="ts">
import type { ListItem, ListType } from '~/types/referenceList'
import { LIST_COPY } from '~/types/referenceList'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  type: ListType
  item: ListItem
  /** Os outros itens da mesma lista — os destinos possíveis. */
  alternatives: readonly ListItem[]
  deleting: boolean
}>()

const emit = defineEmits<{
  confirm: []
  reassign: [targetId: string]
}>()

const targetId = ref<string | undefined>()

const copy = computed(() => LIST_COPY[props.type])
const inUse = computed(() => props.item.usageCount > 0)

const usageSentence = computed(() =>
  props.item.usageCount === 1
    ? 'está em uso em 1 lançamento'
    : `está em uso em ${props.item.usageCount} lançamentos`
)

const targetItems = computed(() =>
  props.alternatives
    .filter((alternative) => alternative.id !== props.item.id)
    .map((alternative) => ({ label: alternative.name, value: alternative.id }))
)

// Item em uso e sem nenhum destino possível (é o último da lista).
// Prometer "escolha um destino" com um select vazio seria pior que
// dizer o que de fato precisa acontecer primeiro.
const hasNowhereToGo = computed(() => inUse.value && targetItems.value.length === 0)

watch(open, (value) => {
  if (value) targetId.value = undefined
})
</script>

<template>
  <UModal v-model:open="open" :title="`Excluir ${copy.singular} &quot;${props.item.name}&quot;?`">
    <template #body>
      <template v-if="!inUse">
        <p class="text-sm text-muted">
          Nenhum lançamento usa esta {{ copy.singular }}. A exclusão não afeta nada além da lista.
        </p>
      </template>

      <template v-else-if="hasNowhereToGo">
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="`&quot;${props.item.name}&quot; ${usageSentence}.`"
          :description="`É a única ${copy.singular} da lista, então não há para onde mover esses lançamentos. Crie outra ${copy.singular} antes de excluir esta.`"
        />
      </template>

      <template v-else>
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="`&quot;${props.item.name}&quot; ${usageSentence}.`"
          description="Esses lançamentos precisam de um novo destino — eles não serão excluídos."
        />

        <UFormField class="mt-4" :label="`Mover os lançamentos para`">
          <USelectMenu
            v-model="targetId"
            :items="targetItems"
            value-key="value"
            :placeholder="`Escolha uma ${copy.singular}`"
            :disabled="props.deleting"
            class="w-full"
          />
        </UFormField>
      </template>
    </template>

    <template #footer>
      <div class="ms-auto flex gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />

        <UButton
          v-if="!inUse"
          label="Excluir"
          color="error"
          :loading="props.deleting"
          @click="emit('confirm')"
        />
        <UButton
          v-else-if="!hasNowhereToGo"
          label="Mover e excluir"
          color="error"
          :disabled="!targetId"
          :loading="props.deleting"
          @click="targetId && emit('reassign', targetId)"
        />
      </div>
    </template>
  </UModal>
</template>
