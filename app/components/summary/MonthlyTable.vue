<!--
  MonthlyTable.vue

  Os mesmos números do gráfico, em texto.

  Não é redundância: é a via de acesso para quem não consegue ler o
  gráfico — leitor de tela, daltonismo, impressão — e é também a
  única forma de ver os valores exatos, já que o gráfico só rotula
  no hover. Num celular, onde o gráfico rola na horizontal, é ela que
  entrega o período inteiro sem rolagem.

  Mês sem lançamento aparece recuado em vez de sumir, pelo mesmo
  motivo do gráfico.
-->
<script setup lang="ts">
import type { MonthlySummary } from '~/types/summary'
import { formatCurrency } from '~/utils/formatCurrency'
import { currentBillingMonth, formatBillingMonth } from '~/utils/billingMonth'

const props = defineProps<{ months: readonly MonthlySummary[] }>()

const currentMonth = currentBillingMonth()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[34rem] text-sm">
      <caption class="sr-only">Receitas, despesas, saldo e pendências por mês de competência</caption>
      <thead>
        <tr class="border-b border-default text-xs text-muted">
          <th scope="col" class="py-2 pe-3 text-left font-medium">Mês</th>
          <th scope="col" class="py-2 px-3 text-right font-medium">Receitas</th>
          <th scope="col" class="py-2 px-3 text-right font-medium">Despesas</th>
          <th scope="col" class="py-2 px-3 text-right font-medium">Saldo</th>
          <th scope="col" class="py-2 ps-3 text-right font-medium">Pendentes</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="month in props.months"
          :key="month.billingMonth"
          class="border-b border-default/60 last:border-0"
          :class="month.count === 0 ? 'text-dimmed' : ''"
        >
          <th scope="row" class="whitespace-nowrap py-2 pe-3 text-left font-normal">
            {{ formatBillingMonth(month.billingMonth) }}
            <UBadge
              v-if="month.billingMonth === currentMonth"
              color="neutral"
              variant="subtle"
              size="sm"
              class="ms-1"
            >atual</UBadge>
          </th>
          <td class="py-2 px-3 text-right tabular-nums">{{ formatCurrency(month.income) }}</td>
          <td class="py-2 px-3 text-right tabular-nums">{{ formatCurrency(month.expenses) }}</td>
          <td
            class="py-2 px-3 text-right font-medium tabular-nums"
            :class="month.count === 0 ? '' : month.balance < 0 ? 'text-error' : 'text-success'"
          >{{ formatCurrency(month.balance) }}</td>
          <td class="py-2 ps-3 text-right tabular-nums">{{ month.pendingCount || '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
