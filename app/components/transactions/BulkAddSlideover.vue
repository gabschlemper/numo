<!--
  BulkAddSlideover.vue

  A spreadsheet-like grid for typing several transactions at once. A row
  missing a required field is never blocked — it's just excluded from
  `completeRows` (see useBulkRows) and flagged, so the user can submit
  the rows that are ready without losing the ones that aren't.
-->
<script setup lang="ts">
import { CATEGORIES, ACCOUNTS, METHODS, TYPES } from '~/constants/referenceOptions'
import { useBulkRows } from '~/composables/useBulkRows'
import type { TransactionDraft } from '~/types/transaction'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{ saving: boolean }>()

const emit = defineEmits<{ save: [drafts: TransactionDraft[]] }>()

const { rows, completeRows, incompleteRows, addRow, removeRow, reset, toDrafts } = useBulkRows()

function handleOpenChange(value: boolean): void {
  open.value = value
  if (!value) reset()
}

function handleSave(): void {
  emit('save', toDrafts())
}
</script>

<template>
  <USlideover v-model:open="open" title="Adicionar em massa" description="Preencha quantas linhas quiser, como numa planilha." :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <div class="overflow-x-auto rounded-lg border border-default">
        <table class="w-full text-sm">
          <thead class="bg-elevated text-xs uppercase text-muted">
            <tr>
              <th class="p-2 text-left">Data</th>
              <th class="p-2 text-left">Descrição</th>
              <th class="p-2 text-left">Categoria</th>
              <th class="p-2 text-left">Conta</th>
              <th class="p-2 text-left">Método</th>
              <th class="p-2 text-right">Valor</th>
              <th class="p-2 text-left">Tipo</th>
              <th class="p-2" />
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="row in rows" :key="row.key">
              <td class="p-1.5"><UInput v-model="row.date" type="date" size="sm" variant="none" /></td>
              <td class="p-1.5"><UInput v-model="row.description" size="sm" variant="none" placeholder="Descrição" /></td>
              <td class="p-1.5"><USelectMenu v-model="row.category" :items="CATEGORIES" size="sm" variant="none" placeholder="—" /></td>
              <td class="p-1.5"><USelectMenu v-model="row.account" :items="ACCOUNTS" size="sm" variant="none" placeholder="—" /></td>
              <td class="p-1.5"><USelectMenu v-model="row.method" :items="METHODS" size="sm" variant="none" placeholder="—" /></td>
              <td class="p-1.5"><UInputNumber v-model="row.amount" :min="0" :step="0.01" size="sm" variant="none" class="text-right" /></td>
              <td class="p-1.5"><USelectMenu v-model="row.type" :items="TYPES" size="sm" variant="none" placeholder="—" /></td>
              <td class="p-1.5 text-center">
                <UButton icon="i-lucide-trash-2" color="neutral" variant="ghost" size="xs" aria-label="Remover linha" @click="removeRow(row.key)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <UButton label="Adicionar linha" icon="i-lucide-plus" color="primary" variant="link" size="sm" class="mt-2" @click="addRow" />

      <UAlert
        v-if="incompleteRows.length > 0"
        class="mt-4"
        color="warning"
        variant="soft"
        icon="i-lucide-triangle-alert"
        :title="`${incompleteRows.length} linha(s) com campo obrigatório vazio`"
        description="Corrija ou deixe assim — só as linhas completas são salvas."
      />
    </template>

    <template #footer>
      <div class="ms-auto flex gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="handleOpenChange(false)" />
        <UButton
          :label="`Salvar ${completeRows.length} lançamentos`"
          :disabled="completeRows.length === 0"
          :loading="props.saving"
          @click="handleSave"
        />
      </div>
    </template>
  </USlideover>
</template>
