<!--
  ImportSpreadsheetModal.vue

  4-step wizard: upload → confirm column mapping → review (duplicates /
  errors) → done. All step state lives in `useSpreadsheetImport`; this
  component only renders the step UStepper is currently on and forwards
  the final "import these" intent to the parent.
-->
<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import type { TransactionDraft } from '~/types/transaction'
import { countDuplicates, countErrors } from '~/types/import'
import { useSpreadsheetImport } from '~/composables/useSpreadsheetImport'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{ importing: boolean }>()

const emit = defineEmits<{ import: [drafts: TransactionDraft[]] }>()

const { activeStep, analyzing, result, totalValid, analyze, advanceToReview, goBack, reset } = useSpreadsheetImport()

const selectedFile = ref<File | null>(null)

// The "done" step (3) only means something once the parent's import
// actually succeeded — advancing to it right when the user clicks
// "Importar" (before the async call resolves) would show "N lançamentos
// importados" even on failure. So this component doesn't decide that on
// its own: the parent calls `markImported()` after `createMany` resolves,
// and leaves the wizard on the review step (with its own error toast) if
// it rejects — the one narrow exception to "components never decide
// what happens", scoped to this single piece of presentation state.
function markImported(): void {
  activeStep.value = 3
}

defineExpose({ markImported })

const STEPS: StepperItem[] = [
  { title: 'Enviar planilha', icon: 'i-lucide-upload' },
  { title: 'Confirmar colunas', icon: 'i-lucide-columns-3' },
  { title: 'Revisar', icon: 'i-lucide-list-checks' },
  { title: 'Concluído', icon: 'i-lucide-check' }
]

const duplicates = computed(() => (result.value ? countDuplicates(result.value) : 0))
const errors = computed(() => (result.value ? countErrors(result.value) : 0))

watch(selectedFile, (file) => {
  if (file) analyze(file)
})

function handleOpenChange(value: boolean): void {
  open.value = value
  if (!value) {
    reset()
    selectedFile.value = null
  }
}

function handleImportConfirm(): void {
  const drafts = (result.value?.rows ?? [])
    .map((row) => row.draft)
    .filter((draft): draft is TransactionDraft => draft !== null)
  emit('import', drafts)
}
</script>

<template>
  <UModal v-model:open="open" title="Importar planilha de faturas" :ui="{ content: 'max-w-3xl' }">
    <template #body>
      <UStepper v-model="activeStep" :items="STEPS" disabled class="mb-6" />

      <div v-if="activeStep === 0" class="flex flex-col gap-4">
        <ol class="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Baixe a <strong>planilha modelo Numo</strong> (.xlsx) — já vem com as colunas certas.</li>
          <li>Rode o script de importação que fornecemos para puxar as faturas do(s) seu(s) cartão(ões) direto para a planilha.</li>
          <li>Suba o arquivo preenchido abaixo.</li>
        </ol>

        <div class="flex gap-2">
          <UButton label="Baixar planilha modelo" icon="i-lucide-file-down" color="neutral" variant="outline" size="sm" />
          <UButton label="Ver instruções do script" icon="i-lucide-terminal" color="neutral" variant="outline" size="sm" />
        </div>

        <UFileUpload
          v-model="selectedFile"
          accept=".xlsx,.csv"
          label="Arraste sua planilha aqui"
          description="ou clique para selecionar · .xlsx, .csv até 10MB"
          icon="i-lucide-upload"
          :loading="analyzing"
          class="min-h-40 w-full"
        />
      </div>

      <div v-else-if="activeStep === 1 && result" class="flex flex-col gap-3">
        <p class="text-sm text-muted">{{ result.file }} · detectamos o modelo Numo automaticamente.</p>
        <div class="flex flex-col gap-1.5 text-sm">
          <div class="flex items-center justify-between rounded-md bg-success-50 px-3 py-1.5 dark:bg-success-950">
            <span class="font-medium">Data compra</span><span>→ Data <UIcon name="i-lucide-check" class="text-success" /></span>
          </div>
          <div class="flex items-center justify-between rounded-md bg-success-50 px-3 py-1.5 dark:bg-success-950">
            <span class="font-medium">Descrição</span><span>→ Descrição <UIcon name="i-lucide-check" class="text-success" /></span>
          </div>
          <div class="flex items-center justify-between rounded-md bg-success-50 px-3 py-1.5 dark:bg-success-950">
            <span class="font-medium">Valor (R$)</span><span>→ Valor <UIcon name="i-lucide-check" class="text-success" /></span>
          </div>
          <div class="flex items-center justify-between rounded-md bg-warning-50 px-3 py-1.5 dark:bg-warning-950">
            <span class="font-medium">Cartão</span><span>→ Conta <UIcon name="i-lucide-triangle-alert" class="text-warning" /></span>
          </div>
        </div>
        <p class="text-xs text-muted">Categoria, Tipo e Devedor não vêm da fatura — você define na revisão ou em massa depois.</p>
      </div>

      <div v-else-if="activeStep === 2 && result" class="flex flex-col gap-4">
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-lg bg-success-50 p-3 dark:bg-success-950">
            <p class="text-xl font-bold text-success">{{ totalValid }}</p>
            <p class="text-xs">novos, prontos</p>
          </div>
          <div class="rounded-lg bg-warning-50 p-3 dark:bg-warning-950">
            <p class="text-xl font-bold text-warning">{{ duplicates }}</p>
            <p class="text-xs">possíveis duplicados</p>
          </div>
          <div class="rounded-lg bg-error-50 p-3 dark:bg-error-950">
            <p class="text-xl font-bold text-error">{{ errors }}</p>
            <p class="text-xs">com erro (linha)</p>
          </div>
        </div>

        <UAlert
          color="neutral"
          variant="soft"
          icon="i-lucide-info"
          description="Linhas com erro ou marcadas como duplicata ficam de fora — corrija na planilha e reimporte se quiser incluí-las."
        />
      </div>

      <div v-else-if="activeStep === 3" class="flex flex-col items-center gap-3 py-6 text-center">
        <UIcon name="i-lucide-check-circle-2" class="size-12 text-success" />
        <p class="text-base font-semibold">{{ totalValid }} lançamentos importados</p>
        <p class="text-sm text-muted">Eles entraram sem Categoria — filtre por "Categoria vazia" e use Editar em massa para classificar.</p>
      </div>
    </template>

    <template #footer>
      <UButton v-if="activeStep > 0 && activeStep < 3" label="Voltar" color="neutral" variant="ghost" @click="goBack" />
      <div class="ms-auto flex gap-2">
        <UButton v-if="activeStep < 3" label="Cancelar" color="neutral" variant="ghost" @click="handleOpenChange(false)" />
        <UButton
          v-if="activeStep === 1"
          label="Continuar"
          @click="advanceToReview"
        />
        <UButton
          v-if="activeStep === 2"
          :label="`Importar ${totalValid} lançamentos`"
          :loading="props.importing"
          @click="handleImportConfirm"
        />
        <UButton v-if="activeStep === 3" label="Ir para Lançamentos" @click="handleOpenChange(false)" />
      </div>
    </template>
  </UModal>
</template>
