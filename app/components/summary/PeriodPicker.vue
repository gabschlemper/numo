<!--
  PeriodPicker.vue

  Escolha do período, em uma linha acima dos gráficos.

  Dois `<input type="month">` nativos, e não um date picker: o valor
  do domínio é competência ("2026-09"), sem dia. Um seletor de data
  completo obrigaria a escolher um dia que depois seria jogado fora —
  e é exatamente por aí que essa coluna virou Date três vezes na
  planilha original (ver `utils/billingMonth.ts`). O input nativo
  também traz teclado e acessibilidade de graça.

  Só emite quando o intervalo é válido, e mostra o motivo quando não
  é: aplicar silenciosamente um intervalo invertido devolveria uma
  tela vazia sem explicação.
-->
<script setup lang="ts">
import type { MonthlySummaryQuery } from '~/types/summary'
import { addMonths, currentBillingMonth } from '~/utils/billingMonth'
import { MONTHS_AHEAD, MONTHS_BEHIND } from '~/composables/useMonthlySummary'

const props = defineProps<{
  period: MonthlySummaryQuery
  loading: boolean
}>()

const emit = defineEmits<{ change: [period: MonthlySummaryQuery] }>()

const from = ref(props.period.from)
const to = ref(props.period.to)

watch(
  () => props.period,
  (period) => {
    from.value = period.from
    to.value = period.to
  }
)

const invalid = computed(() => from.value > to.value)
const changed = computed(() => from.value !== props.period.from || to.value !== props.period.to)

interface Preset {
  label: string
  build: () => MonthlySummaryQuery
}

const PRESETS: Preset[] = [
  {
    // O padrão. Assimétrico de propósito: competência inclui
    // parcelas já comprometidas para os próximos meses, e são elas
    // que ainda dá tempo de planejar.
    label: '6 meses atrás e à frente',
    build: () => ({
      from: addMonths(currentBillingMonth(), -MONTHS_BEHIND),
      to: addMonths(currentBillingMonth(), MONTHS_AHEAD)
    })
  },
  {
    label: 'Últimos 12 meses',
    build: () => ({ from: addMonths(currentBillingMonth(), -11), to: currentBillingMonth() })
  },
  {
    label: 'Este ano',
    build: () => {
      const year = currentBillingMonth().slice(0, 4)
      return { from: `${year}-01`, to: `${year}-12` }
    }
  }
]

function applyPreset(preset: Preset): void {
  const period = preset.build()
  from.value = period.from
  to.value = period.to
  emit('change', period)
}

function apply(): void {
  if (invalid.value) return
  emit('change', { from: from.value, to: to.value })
}

function isActive(preset: Preset): boolean {
  const period = preset.build()
  return period.from === props.period.from && period.to === props.period.to
}
</script>

<template>
  <div class="flex flex-col gap-3 rounded-[--ui-radius] border border-default bg-default p-3">
    <div class="flex flex-wrap items-end gap-3">
      <UFormField label="De" size="sm">
        <UInput v-model="from" type="month" :disabled="props.loading" class="w-full sm:w-40" />
      </UFormField>
      <UFormField label="Até" size="sm">
        <UInput v-model="to" type="month" :disabled="props.loading" class="w-full sm:w-40" />
      </UFormField>

      <UButton
        label="Aplicar"
        color="neutral"
        variant="outline"
        :disabled="invalid || !changed"
        :loading="props.loading"
        @click="apply"
      />
    </div>

    <p v-if="invalid" class="text-sm text-error">
      O mês inicial precisa ser anterior ao final.
    </p>

    <div class="flex flex-wrap gap-1.5">
      <UButton
        v-for="preset in PRESETS"
        :key="preset.label"
        :label="preset.label"
        size="xs"
        color="neutral"
        :variant="isActive(preset) ? 'soft' : 'ghost'"
        :disabled="props.loading"
        @click="applyPreset(preset)"
      />
    </div>
  </div>
</template>
