<!--
  ReferenceListPanel.vue

  Um painel de lista (Categorias, Contas ou Devedores). Apresentação
  pura: recebe os itens prontos e emite intenção — quem decide o que
  abre e o que acontece é `pages/lists/index.vue`.

  O único estado que ele guarda é o texto da busca, que é estado de
  visualização e de mais ninguém: filtrar 34 categorias para achar uma
  não muda dado nenhum, e subir isso para a página só faria a página
  carregar um detalhe do painel.

  Cada item mostra em quantos lançamentos é usado. Isso não é
  enfeite — é o aviso que chega ANTES: sem ele, o usuário só descobre
  que "Supermercado" está em 34 lançamentos quando tenta apagar e
  leva um erro na cara.
-->
<script setup lang="ts">
import type { ListItem, ListType } from '~/types/referenceList'
import { LIST_COPY } from '~/types/referenceList'

const props = defineProps<{
  type: ListType
  items: readonly ListItem[]
  loading: boolean
}>()

const emit = defineEmits<{
  create: []
  rename: [item: ListItem]
  delete: [item: ListItem]
}>()

const search = ref('')

const copy = computed(() => LIST_COPY[props.type])

const visibleItems = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (term === '') return props.items
  return props.items.filter((item) => item.name.toLowerCase().includes(term))
})

// Uma lista longa merece busca; seis contas, não. O limiar evita
// gastar uma linha da tela com um controle que não ajuda em nada.
const showSearch = computed(() => props.items.length > 8)

function usageLabel(item: ListItem): string {
  if (item.usageCount === 0) return 'sem uso'
  return item.usageCount === 1 ? '1 lançamento' : `${item.usageCount} lançamentos`
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="flex items-center gap-2 font-medium">
          <UIcon :name="copy.icon" class="size-4 shrink-0 text-muted" />
          {{ copy.plural }}
          <UBadge color="neutral" variant="subtle" size="sm">{{ props.items.length }}</UBadge>
        </h2>
        <p class="mt-0.5 text-sm text-muted">{{ copy.hint }}</p>
      </div>

      <UButton icon="i-lucide-plus" class="shrink-0" @click="emit('create')">
        <span class="hidden sm:inline">Nova {{ copy.singular }}</span>
        <span class="sm:hidden">Nova</span>
      </UButton>
    </header>

    <UInput
      v-if="showSearch"
      v-model="search"
      icon="i-lucide-search"
      :placeholder="`Buscar ${copy.singular}...`"
      class="w-full"
    />

    <div v-if="props.loading && props.items.length === 0" class="flex flex-col gap-2">
      <USkeleton v-for="index in 6" :key="`skeleton-${index}`" class="h-12 w-full" />
    </div>

    <p
      v-else-if="visibleItems.length === 0 && search.trim() !== ''"
      class="rounded-[--ui-radius] border border-dashed border-default px-4 py-8 text-center text-sm text-muted"
    >
      Nenhum resultado para "{{ search.trim() }}".
    </p>

    <div
      v-else-if="visibleItems.length === 0"
      class="flex flex-col items-center gap-3 rounded-[--ui-radius] border border-dashed border-default px-4 py-10 text-center"
    >
      <UIcon :name="copy.icon" class="size-8 text-dimmed" />
      <p class="text-sm text-muted">Nenhuma {{ copy.singular }} cadastrada ainda.</p>
      <UButton :label="`Criar a primeira ${copy.singular}`" variant="outline" color="neutral" @click="emit('create')" />
    </div>

    <ul v-else class="flex flex-col divide-y divide-default rounded-[--ui-radius] border border-default">
      <li
        v-for="item in visibleItems"
        :key="item.id"
        class="flex items-center gap-3 px-3 py-2"
      >
        <span class="min-w-0 flex-1 truncate text-sm font-medium" :title="item.name">{{ item.name }}</span>

        <!--
          O uso fica em `tabular-nums` e discreto: é contexto para a
          decisão de apagar, não um número que o usuário veio ler.
        -->
        <span class="shrink-0 text-xs tabular-nums text-muted">{{ usageLabel(item) }}</span>

        <div class="flex shrink-0 items-center">
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="`Renomear ${item.name}`"
            @click="emit('rename', item)"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            :aria-label="`Excluir ${item.name}`"
            @click="emit('delete', item)"
          />
        </div>
      </li>
    </ul>
  </section>
</template>
