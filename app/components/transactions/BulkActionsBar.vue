<!--
  BulkActionsBar.vue

  Purely presentational: shows the selected count and four intents
  (edit, duplicate, delete, clear). Which modal opens in response is
  the parent page's decision, not this component's — it just emits.

  It's rendered as a floating bar pinned to the bottom of the content
  area rather than inserted above the table, for two reasons:

  • Selecting a row used to push the whole table down by the height
    of this bar, so the row you just clicked moved out from under the
    cursor — and the next click landed on a different transaction.
    Pinned, nothing reflows.

  • On a phone, actions on a selection you made by scrolling down a
    list have to still be reachable from where you are. At the top of
    the page they wouldn't be.

  Colours come from the semantic `inverted` tokens, not a literal
  `bg-neutral-900` — the contrast against the page is the point, and
  the token is the thing that keeps it correct in both themes (see
  ARCHITECTURE.md, "zero valor hardcoded").
-->
<script setup lang="ts">
const props = defineProps<{ selectedCount: number }>()

const emit = defineEmits<{
  edit: []
  duplicate: []
  delete: []
  clear: []
}>()

const label = computed(() =>
  props.selectedCount === 1 ? '1 selecionado' : `${props.selectedCount} selecionados`
)
</script>

<template>
  <div
    role="region"
    aria-label="Ações para os lançamentos selecionados"
    class="pointer-events-none sticky bottom-0 z-10 flex justify-center pb-2 pt-4"
  >
    <div
      class="pointer-events-auto flex w-full max-w-2xl items-center gap-2 rounded-full border border-inverted/10 bg-inverted px-3 py-2 shadow-lg"
    >
      <p class="shrink-0 ps-1 text-sm font-medium text-inverted">
        {{ label }}
      </p>

      <div class="ms-auto flex items-center gap-1">
        <!--
          Labels collapse to icons below `sm` but never lose their
          accessible name, and each keeps a tooltip so an icon-only
          button is never a guess. The trailing "..." on the three
          that open a dialog is the standard promise that nothing
          happens yet — which is what makes a one-tap "Excluir" next
          to a selection of 30 rows safe to put here at all.
        -->
        <UTooltip text="Editar campos em massa">
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="soft"
            size="sm"
            aria-label="Editar campos dos lançamentos selecionados"
            @click="emit('edit')"
          >
            <span class="hidden sm:inline">Editar...</span>
          </UButton>
        </UTooltip>

        <UTooltip text="Duplicar selecionados">
          <UButton
            icon="i-lucide-copy"
            color="neutral"
            variant="soft"
            size="sm"
            aria-label="Duplicar os lançamentos selecionados"
            @click="emit('duplicate')"
          >
            <span class="hidden sm:inline">Duplicar...</span>
          </UButton>
        </UTooltip>

        <UTooltip text="Excluir selecionados">
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="soft"
            size="sm"
            aria-label="Excluir os lançamentos selecionados"
            @click="emit('delete')"
          >
            <span class="hidden sm:inline">Excluir...</span>
          </UButton>
        </UTooltip>

        <UTooltip text="Limpar seleção">
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Limpar seleção"
            class="text-inverted/70 hover:text-inverted"
            @click="emit('clear')"
          />
        </UTooltip>
      </div>
    </div>
  </div>
</template>
