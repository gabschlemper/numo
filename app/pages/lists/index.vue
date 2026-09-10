<!--
  pages/lists/index.vue

  O único lugar que decide O QUE ACONTECE quando o usuário age nesta
  tela — mesma regra de `pages/transactions/index.vue`. Os painéis e
  modais abaixo são apresentação pura ou interação autocontida; nenhum
  deles chama repositório.

  A tela existe porque `constants/referenceOptions.ts` era um array
  fixo: até aqui, ninguém conseguia criar uma categoria sem editar
  código.

  Duas coisas que esta página trata e que valem atenção:

  1. ERRO DE CAMPO. Um nome repetido volta como `ApiError` com
     `fields.name`. Em vez de virar toast, ele desce para o modal e
     aparece embaixo do input. Toast para erro de formulário é o
     padrão que faz o usuário reler o formulário inteiro procurando o
     que está errado.

  2. EXCLUSÃO DE ITEM EM USO. O repositório recusa (`conflict`), e a
     recusa não é o fim da interação: o modal já oferece mover os
     lançamentos para outro item. A regra de "não apagar em cascata"
     só é aceitável se vier acompanhada da saída.

  DEPENDÊNCIA NÃO ÓBVIA: renomear e reatribuir REESCREVEM lançamentos,
  e o cache de `useTransactions` (um `useState`) sobrevive à
  navegação. Esta página não o invalida porque o
  `useAsyncData('initial-transactions')` de `pages/transactions`
  refaz a busca ao montar — verificado no navegador. Se aquele
  `useAsyncData` algum dia ganhar `getCachedData`, o usuário passa a
  renomear aqui e continuar vendo o nome antigo lá, sem erro nenhum
  aparecendo. Nesse dia, invalide aqui.
-->
<script setup lang="ts">
import type { ListItem, ListType } from '~/types/referenceList'
import { LIST_COPY, LIST_TYPES } from '~/types/referenceList'
import { isApiError } from '~/types/apiError'

const toast = useToast()

const { lists, loading, error, load, create, rename, remove, reassign } = useReferenceLists()


await useAsyncData('reference-lists', load)

const activeType = ref<ListType>('categories')

const tabItems = computed(() =>
  LIST_TYPES.map((type) => ({
    value: type,
    label: LIST_COPY[type].plural,
    icon: LIST_COPY[type].icon,
    badge: lists.value[type].length
  }))
)

const activeItems = computed<readonly ListItem[]>(() => lists.value[activeType.value])

/**
 * Extrai a mensagem do campo `name` quando o erro é de validação ou
 * de conflito de nome; devolve null para qualquer outra falha, que
 * então segue para o toast. É o que separa "conserte este campo" de
 * "algo deu errado".
 */
function nameFieldError(reason: unknown): string | null {
  return isApiError(reason) ? (reason.fields?.name ?? null) : null
}

function toastError(fallback: string, reason: unknown): void {
  const description = reason instanceof Error ? reason.message : undefined
  toast.add({ title: fallback, description, color: 'error' })
}

// --- Criar --------------------------------------------------------------
const createOpen = ref(false)
const creating = ref(false)
const createFieldError = ref<string | null>(null)

function openCreate(): void {
  createFieldError.value = null
  createOpen.value = true
}

async function handleCreate(name: string): Promise<void> {
  creating.value = true
  createFieldError.value = null
  try {
    const created = await create(activeType.value, name)
    createOpen.value = false
    toast.add({ title: `"${created.name}" criada.`, color: 'success' })
  } catch (reason) {
    const fieldError = nameFieldError(reason)
    // Erro de campo mantém o modal aberto com o texto digitado: o
    // usuário está a uma correção de distância, fechar seria mandar
    // ele começar de novo.
    if (fieldError) createFieldError.value = fieldError
    else toastError(`Não foi possível criar a ${LIST_COPY[activeType.value].singular}.`, reason)
  } finally {
    creating.value = false
  }
}

// --- Renomear -----------------------------------------------------------
const renameOpen = ref(false)
const renaming = ref(false)
const renameFieldError = ref<string | null>(null)
const itemBeingRenamed = ref<ListItem | null>(null)

function openRename(item: ListItem): void {
  itemBeingRenamed.value = item
  renameFieldError.value = null
  renameOpen.value = true
}

async function handleRename(name: string): Promise<void> {
  const item = itemBeingRenamed.value
  if (!item) return

  renaming.value = true
  renameFieldError.value = null
  try {
    const updatedTransactions = await rename(activeType.value, item.id, name)
    renameOpen.value = false
    // A contagem vem do repositório, não de `item.usageCount`: é o
    // que de fato mudou, e é a confirmação de que a propagação
    // aconteteu mesmo.
    toast.add({
      title: `Renomeada para "${name.trim()}".`,
      description:
        updatedTransactions > 0
          ? `${updatedTransactions} ${updatedTransactions === 1 ? 'lançamento atualizado' : 'lançamentos atualizados'}.`
          : undefined,
      color: 'success'
    })
  } catch (reason) {
    const fieldError = nameFieldError(reason)
    if (fieldError) renameFieldError.value = fieldError
    else toastError('Não foi possível renomear.', reason)
  } finally {
    renaming.value = false
  }
}

// --- Excluir / reatribuir -----------------------------------------------
const deleteOpen = ref(false)
const deleting = ref(false)
const itemBeingDeleted = ref<ListItem | null>(null)

function openDelete(item: ListItem): void {
  itemBeingDeleted.value = item
  deleteOpen.value = true
}

async function handleDelete(): Promise<void> {
  const item = itemBeingDeleted.value
  if (!item) return

  deleting.value = true
  try {
    await remove(activeType.value, item.id)
    deleteOpen.value = false
    toast.add({ title: `"${item.name}" excluída.`, color: 'success' })
  } catch (reason) {
    toastError('Não foi possível excluir.', reason)
  } finally {
    deleting.value = false
  }
}

async function handleReassign(targetId: string): Promise<void> {
  const item = itemBeingDeleted.value
  if (!item) return

  deleting.value = true
  try {
    // `deleteAfter: true` — mover e excluir é uma decisão só do ponto
    // de vista do usuário, então é uma operação só. Duas chamadas
    // poderiam falhar no meio e deixar o item vazio na lista.
    const updatedTransactions = await reassign(activeType.value, item.id, { targetId, deleteAfter: true })
    deleteOpen.value = false
    toast.add({
      title: `"${item.name}" excluída.`,
      description: `${updatedTransactions} ${updatedTransactions === 1 ? 'lançamento movido' : 'lançamentos movidos'}.`,
      color: 'success'
    })
  } catch (reason) {
    toastError('Não foi possível mover os lançamentos.', reason)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="@container flex min-h-full flex-col gap-4 p-4 sm:p-6">
    <header>
      <h1 class="text-xl font-semibold sm:text-2xl">Listas</h1>
      <p class="text-sm text-muted">
        O vocabulário que você usa nos lançamentos. Renomear aqui atualiza os lançamentos que usam o nome antigo.
      </p>
    </header>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      title="Não foi possível carregar as listas."
      :description="error"
      :actions="[{ label: 'Tentar de novo', color: 'error', variant: 'solid', onClick: load }]"
    />

    <!--
      Abas, e não os três painéis lado a lado: as listas chegam a 30+
      itens, e três colunas roláveis competindo entre si é pior em
      qualquer largura. Abas também são o mesmo layout no celular e no
      desktop — um caminho de código só.
    -->
    <UTabs
      v-model="activeType"
      :items="tabItems"
      :ui="{
        list: 'w-full sm:w-auto',
        // Num celular de 390px os três rótulos não cabem junto com
        // ícone e contagem, e o Nuxt UI trunca o rótulo — 'Contas'
        // virava 'C...'. Ícone e badge saem primeiro porque são
        // decoração e redundância: o rótulo é a única parte que o
        // usuário precisa ler para escolher a aba, e a contagem
        // continua visível no cabeçalho do painel logo abaixo.
        leadingIcon: 'hidden sm:inline-flex',
        trailingBadge: 'hidden sm:inline-flex'
      }"
    />

    <ReferenceListPanel
      :type="activeType"
      :items="activeItems"
      :loading="loading"
      @create="openCreate"
      @rename="openRename"
      @delete="openDelete"
    />

    <CreateListItemModal
      v-model:open="createOpen"
      :type="activeType"
      :saving="creating"
      :field-error="createFieldError"
      @create="handleCreate"
    />

    <RenameListItemModal
      v-if="itemBeingRenamed"
      v-model:open="renameOpen"
      :type="activeType"
      :item="itemBeingRenamed"
      :saving="renaming"
      :field-error="renameFieldError"
      @rename="handleRename"
    />

    <DeleteListItemModal
      v-if="itemBeingDeleted"
      v-model:open="deleteOpen"
      :type="activeType"
      :item="itemBeingDeleted"
      :alternatives="activeItems"
      :deleting="deleting"
      @confirm="handleDelete"
      @reassign="handleReassign"
    />
  </div>
</template>
