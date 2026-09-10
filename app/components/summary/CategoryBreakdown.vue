<!--
  CategoryBreakdown.vue

  Ranking de despesas por categoria no período. Uma série só, então
  não leva legenda — o título já diz o que é (regra que evita a caixa
  de legenda inútil de um item).

  Barra proporcional ao maior gasto, não ao total: comparar cada
  categoria com a maior responde "o que domina meus gastos?", que é a
  pergunta do ranking. Proporção sobre o total daria barras
  minúsculas assim que houvesse mais de umas dez categorias.

  Não é pizza de propósito: com 20+ categorias, fatias viram um
  arco-íris ilegível, e comparar ângulos é comprovadamente pior do
  que comparar comprimentos.
-->
<script setup lang="ts">
import type { CategorySummary } from '~/types/summary'
import { formatCurrency } from '~/utils/formatCurrency'

const props = withDefaults(
  defineProps<{
    categories: readonly CategorySummary[]
    /** Quantas mostrar antes de agrupar o resto. */
    limit?: number
  }>(),
  { limit: 8 }
)

const total = computed(() => props.categories.reduce((sum, category) => sum + category.expenses, 0))

const top = computed(() => props.categories.slice(0, props.limit))

// A cauda vira uma linha "Outras N categorias" em vez de sumir: sem
// ela, as barras somariam menos que o total do período e o usuário
// não teria como saber que faltava algo.
const rest = computed(() => props.categories.slice(props.limit))
const restTotal = computed(() => rest.value.reduce((sum, category) => sum + category.expenses, 0))

const largest = computed(() => top.value[0]?.expenses ?? 0)

function widthPercent(value: number): string {
  if (largest.value === 0) return '0%'
  return `${Math.max(1, (value / largest.value) * 100)}%`
}

function sharePercent(value: number): string {
  if (total.value === 0) return '0%'
  return `${Math.round((value / total.value) * 100)}%`
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="font-medium">Despesas por categoria</h2>

    <p v-if="props.categories.length === 0" class="text-sm text-muted">
      Nenhuma despesa no período.
    </p>

    <ul v-else class="flex flex-col gap-2.5">
      <li v-for="category in top" :key="category.category" class="flex flex-col gap-1">
        <div class="flex items-baseline justify-between gap-3 text-sm">
          <span class="min-w-0 truncate" :title="category.category">{{ category.category }}</span>
          <span class="shrink-0 tabular-nums">
            {{ formatCurrency(category.expenses) }}
            <span class="ms-1 text-xs text-muted">{{ sharePercent(category.expenses) }}</span>
          </span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
          <div
            class="h-full rounded-full"
            :style="{ width: widthPercent(category.expenses), background: 'var(--numo-chart-expense)' }"
          />
        </div>
      </li>

      <li v-if="rest.length > 0" class="flex items-baseline justify-between gap-3 border-t border-default pt-2 text-sm text-muted">
        <span>Outras {{ rest.length }} categorias</span>
        <span class="shrink-0 tabular-nums">{{ formatCurrency(restTotal) }}</span>
      </li>
    </ul>
  </section>
</template>
