<!--
  BulkActionsBar.vue

  Purely presentational: shows the selected count and four intents
  (edit, duplicate, delete, clear). Which modal opens in response is
  the parent page's decision, not this component's — it just emits.
-->
<script setup lang="ts">
const props = defineProps<{ selectedCount: number }>()

const emit = defineEmits<{
  edit: []
  duplicate: []
  delete: []
  clear: []
}>()
</script>

<template>
  <UCard class="bg-neutral-900 dark:bg-neutral-800" :ui="{ body: 'flex items-center justify-between py-2.5' }">
    <p class="text-sm font-medium text-white">{{ props.selectedCount }} selecionado(s)</p>
    <div class="flex items-center gap-2">
      <UButton icon="i-lucide-pencil" label="Editar campos..." color="neutral" variant="soft" size="xs" @click="emit('edit')" />
      <UButton icon="i-lucide-copy" label="Duplicar..." color="neutral" variant="soft" size="xs" @click="emit('duplicate')" />
      <UButton icon="i-lucide-trash-2" label="Excluir..." color="error" variant="soft" size="xs" @click="emit('delete')" />
      <UButton label="Cancelar" color="neutral" variant="ghost" size="xs" @click="emit('clear')" />
    </div>
  </UCard>
</template>
