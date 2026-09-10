<!--
  MonthlyTrendChart.vue

  Barras agrupadas: receitas e despesas lado a lado por mês de
  competência. SVG inline, sem biblioteca — são duas séries e uma
  escala; qualquer lib aqui seria mais peso do que código.

  DECISÕES QUE NÃO SÃO ESTÉTICAS:

  • Barras agrupadas, e não linha nem empilhado. A pergunta que a
    tela responde é "neste mês entrou mais do que saiu?", que é uma
    comparação de duas magnitudes dentro do mesmo mês — exatamente o
    que barras lado a lado mostram. Empilhado somaria as duas, que é
    um número sem significado.

  • UM eixo só. Receita e despesa estão na mesma unidade (BRL), então
    dividem a mesma escala. Dois eixos y com escalas diferentes é o
    erro clássico de gráfico: faz duas séries incomparáveis parecerem
    comparáveis.

  • Saldo NÃO é uma terceira série. Ele é `receitas - despesas`, ou
    seja, já está desenhado: é a diferença entre as duas barras.
    Plotá-lo de novo seria redundância ocupando tinta.

  • Meses vazios aparecem como coluna vazia, não somem (ver
    `monthsBetween`). Um gráfico que pula mês encosta setembro em
    dezembro e mente sobre a tendência.

  • As cores vêm de tokens validados em `main.css` — ver lá por que
    não podem ser trocadas a olho.

  Só de apresentação: recebe os meses prontos e não calcula agregado
  nenhum.
-->
<script setup lang="ts">
import type { MonthlySummary } from '~/types/summary'
import { formatCurrency } from '~/utils/formatCurrency'
import { formatBillingMonth } from '~/utils/billingMonth'

const props = defineProps<{ months: readonly MonthlySummary[] }>()

// Geometria em unidades do viewBox. O SVG NÃO escala junto com o
// container (ver `min-w` no template): num celular, escalar o
// viewBox inteiro deixaria os rótulos em ~5px. Em vez disso o
// gráfico mantém o tamanho e o container rola na horizontal — e a
// tabela abaixo dá os mesmos números sem rolagem nenhuma.
const HEIGHT = 220
const PADDING = { top: 16, right: 8, bottom: 28, left: 64 }
const MIN_PLOT_WIDTH = 560
const BAR_WIDTH = 10
const BAR_GAP = 2 // vão de superfície entre as duas barras do mesmo mês
const GRID_LINES = 4

const plotWidth = computed(() => Math.max(MIN_PLOT_WIDTH, props.months.length * 46))
const width = computed(() => plotWidth.value + PADDING.left + PADDING.right)
const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

/**
 * O topo da escala. Arredondado para cima num passo "redondo" para
 * os rótulos do eixo saírem legíveis (R$ 8.000 em vez de R$ 7.843).
 */
const scaleMax = computed(() => {
  const peak = Math.max(0, ...props.months.flatMap((month) => [month.income, month.expenses]))
  if (peak === 0) return 100
  const magnitude = 10 ** Math.floor(Math.log10(peak))
  return Math.ceil(peak / (magnitude / 2)) * (magnitude / 2)
})

const bandWidth = computed(() => plotWidth.value / Math.max(1, props.months.length))

function barHeight(value: number): number {
  return value === 0 ? 0 : Math.max(2, (value / scaleMax.value) * plotHeight)
}

function bandX(index: number): number {
  return PADDING.left + index * bandWidth.value
}

interface Band {
  month: MonthlySummary
  index: number
  bandX: number
  incomeX: number
  expenseX: number
  incomeY: number
  expenseY: number
  incomeHeight: number
  expenseHeight: number
  label: string
}

const bands = computed<Band[]>(() =>
  props.months.map((month, index) => {
    const centre = bandX(index) + bandWidth.value / 2
    const incomeHeight = barHeight(month.income)
    const expenseHeight = barHeight(month.expenses)
    return {
      month,
      index,
      bandX: bandX(index),
      incomeX: centre - BAR_WIDTH - BAR_GAP / 2,
      expenseX: centre + BAR_GAP / 2,
      incomeY: PADDING.top + plotHeight - incomeHeight,
      expenseY: PADDING.top + plotHeight - expenseHeight,
      incomeHeight,
      expenseHeight,
      // "Set" em vez de "Set/2026": doze rótulos com ano viram
      // uma faixa de ruído. O ano aparece no seletor de período,
      // na tabela e no tooltip.
      label: formatBillingMonth(month.billingMonth).split('/')[0] ?? ''
    }
  })
)

const gridValues = computed(() =>
  Array.from({ length: GRID_LINES + 1 }, (_, index) => (scaleMax.value / GRID_LINES) * index)
)

function gridY(value: number): number {
  return PADDING.top + plotHeight - (value / scaleMax.value) * plotHeight
}

/** Eixo em milhares: "R$ 8.000" repetido cinco vezes é ruído; "8k" não. */
function axisLabel(value: number): string {
  if (value === 0) return '0'
  if (value >= 1000) return `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  return value.toLocaleString('pt-BR')
}

const hovered = ref<number | null>(null)

const hoveredBand = computed(() => (hovered.value === null ? null : bands.value[hovered.value] ?? null))

// O mês corrente ganha destaque: num período que olha para trás e
// para frente, saber onde é "agora" é o que separa gasto realizado
// de gasto comprometido.
const currentMonth = computed(() => currentBillingMonth())
</script>

<template>
  <figure class="m-0 flex flex-col gap-3">
    <!-- Legenda sempre presente com duas séries: identidade nunca só por cor. -->
    <figcaption class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <span class="flex items-center gap-1.5">
        <span class="size-2.5 rounded-full" :style="{ background: 'var(--numo-chart-income)' }" />
        Receitas
      </span>
      <span class="flex items-center gap-1.5">
        <span class="size-2.5 rounded-full" :style="{ background: 'var(--numo-chart-expense)' }" />
        Despesas
      </span>
      <span class="flex items-center gap-1.5">
        <span class="size-2.5 rounded-full border border-dashed border-inverted/40" />
        Mês atual
      </span>
    </figcaption>

    <div class="-mx-1 overflow-x-auto px-1">
      <svg
        :width="width"
        :height="HEIGHT"
        :viewBox="`0 0 ${width} ${HEIGHT}`"
        role="img"
        :aria-label="`Receitas e despesas por mês de competência, de ${props.months[0]?.billingMonth ?? ''} a ${props.months[props.months.length - 1]?.billingMonth ?? ''}. Os mesmos números estão na tabela abaixo.`"
        class="block"
        @mouseleave="hovered = null"
      >
        <!-- Grade recessiva: referência, não conteúdo. -->
        <g>
          <line
            v-for="value in gridValues"
            :key="`grid-${value}`"
            :x1="PADDING.left"
            :x2="width - PADDING.right"
            :y1="gridY(value)"
            :y2="gridY(value)"
            class="stroke-default"
            stroke-width="1"
          />
          <text
            v-for="value in gridValues"
            :key="`axis-${value}`"
            :x="PADDING.left - 8"
            :y="gridY(value) + 3"
            text-anchor="end"
            class="fill-dimmed text-[9px] tabular-nums"
          >{{ axisLabel(value) }}</text>
        </g>

        <g v-for="band in bands" :key="band.month.billingMonth">
          <!--
            Marca o mês corrente com CONTORNO tracejado, não com
            faixa preenchida: preenchimento atrás das barras compete
            com elas por atenção, e o tracejado é o mesmo símbolo que
            a legenda usa. (Também evita um problema real: `fill-*`
            não aceita os aliases de superfície do Nuxt UI —
            `fill-elevated` não gera utilitário nenhum e o SVG cai no
            preto padrão, pintando uma coluna sólida no meio do
            gráfico.)
          -->
          <rect
            v-if="band.month.billingMonth === currentMonth"
            :x="band.bandX + 1"
            :y="PADDING.top"
            :width="bandWidth - 2"
            :height="plotHeight"
            fill="none"
            class="stroke-inverted/30"
            stroke-width="1"
            stroke-dasharray="3 3"
            rx="4"
          />

          <rect
            :x="band.incomeX"
            :y="band.incomeY"
            :width="BAR_WIDTH"
            :height="band.incomeHeight"
            rx="4"
            :style="{ fill: 'var(--numo-chart-income)' }"
          />
          <rect
            :x="band.expenseX"
            :y="band.expenseY"
            :width="BAR_WIDTH"
            :height="band.expenseHeight"
            rx="4"
            :style="{ fill: 'var(--numo-chart-expense)' }"
          />

          <text
            :x="band.bandX + bandWidth / 2"
            :y="HEIGHT - 10"
            text-anchor="middle"
            class="text-[10px]"
            :class="band.month.billingMonth === currentMonth ? 'fill-default font-medium' : 'fill-muted'"
          >{{ band.label }}</text>

          <!--
            Alvo de hover cobrindo a coluna inteira, bem maior que as
            barras: mirar numa barra de 10px com o mouse (ou com o
            dedo) é atrito sem motivo. O tooltip mostra as duas
            séries de uma vez, que é a comparação que interessa.
          -->
          <rect
            :x="band.bandX"
            :y="PADDING.top"
            :width="bandWidth"
            :height="plotHeight"
            fill="transparent"
            @mouseenter="hovered = band.index"
          />
          <line
            v-if="hovered === band.index"
            :x1="band.bandX + bandWidth / 2"
            :x2="band.bandX + bandWidth / 2"
            :y1="PADDING.top"
            :y2="PADDING.top + plotHeight"
            class="stroke-inverted/25"
            stroke-width="1"
          />
        </g>
      </svg>
    </div>

    <!--
      Tooltip em HTML abaixo do gráfico, não flutuando sobre ele: num
      SVG que rola horizontalmente, um tooltip posicionado em
      coordenadas do SVG sai do lugar assim que o container rola. Aqui
      ele fica ancorado e legível em qualquer largura.
    -->
    <div
      class="flex min-h-9 flex-wrap items-center gap-x-4 gap-y-1 rounded-[--ui-radius] border border-default px-3 py-1.5 text-xs"
      aria-live="polite"
    >
      <template v-if="hoveredBand">
        <span class="font-medium">{{ formatBillingMonth(hoveredBand.month.billingMonth) }}</span>
        <span class="tabular-nums" :style="{ color: 'var(--numo-chart-income)' }">
          Receitas {{ formatCurrency(hoveredBand.month.income) }}
        </span>
        <span class="tabular-nums" :style="{ color: 'var(--numo-chart-expense)' }">
          Despesas {{ formatCurrency(hoveredBand.month.expenses) }}
        </span>
        <span class="tabular-nums text-muted">
          Saldo {{ formatCurrency(hoveredBand.month.balance) }}
        </span>
      </template>
      <span v-else class="text-dimmed">Passe o mouse sobre um mês para ver os valores.</span>
    </div>
  </figure>
</template>
