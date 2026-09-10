<!--
  pages/summary/index.vue

  Resumo por MÊS DE COMPETÊNCIA — a tela que justifica o campo
  `billingMonth` existir.

  A diferença entre esta tela e o resumo do topo de Lançamentos não é
  de tamanho, é de eixo. Lá os números respondem "como está o
  resultado do filtro que estou olhando agora". Aqui eles respondem
  "como cada mês fecha", e o mês é a competência (quando a fatura
  cai), não a data da compra. Uma compra parcelada em 12x tem uma
  única data e doze competências: agregada por data, ela apareceria
  inteira num mês só e sumiria dos onze em que o dinheiro realmente
  sai.

  Por isso o período padrão olha para os dois lados (ver
  `useMonthlySummary`): o passado é o que aconteceu, o futuro é o que
  já está comprometido em parcela — e é o único dos dois em que ainda
  dá para agir.

  Como em Lançamentos, esta página é o único lugar que decide o que
  acontece; os componentes abaixo só desenham e emitem intenção. A
  agregação inteira vem pronta do `SummaryRepository`, não é somada
  aqui: com um backend real, somar cinco anos no navegador significa
  baixar cinco anos.
-->
<script setup lang="ts">
const toast = useToast()

const { period, result, loading, error, periodTotals, isEmpty, load, setPeriod } = useMonthlySummary()

await useAsyncData('monthly-summary', load)

async function handlePeriodChange(next: Parameters<typeof setPeriod>[0]): Promise<void> {
  try {
    await setPeriod(next)
  } catch (reason) {
    toast.add({
      title: 'Não foi possível atualizar o período.',
      description: reason instanceof Error ? reason.message : undefined,
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="@container flex min-h-full flex-col gap-4 p-4 sm:p-6">
    <header>
      <h1 class="text-xl font-semibold sm:text-2xl">Resumo mensal</h1>
      <p class="text-sm text-muted">
        Por mês de competência — quando a fatura cai, não quando a compra foi feita.
      </p>
    </header>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      title="Não foi possível carregar o resumo."
      :description="error"
      :actions="[{ label: 'Tentar de novo', color: 'error', variant: 'solid', onClick: load }]"
    />

    <PeriodPicker :period="period" :loading="loading" @change="handlePeriodChange" />

    <!--
      Totais do período: sem eles, somar doze colunas de cabeça para
      saber se o semestre fechou positivo é trabalho que a tela devia
      ter feito.
    -->
    <TransactionsSummary
      :summary="periodTotals"
      :filtered="false"
      :loading="loading"
    />

    <div
      v-if="isEmpty && !error"
      class="flex flex-col items-center gap-3 rounded-[--ui-radius] border border-dashed border-default px-4 py-12 text-center"
    >
      <UIcon name="i-lucide-calendar-search" class="size-9 text-dimmed" />
      <div class="space-y-1">
        <p class="font-medium">Nenhum lançamento neste período</p>
        <p class="max-w-md text-sm text-muted">
          Escolha outro intervalo acima, ou lance algo em Lançamentos para ver o resumo aparecer aqui.
        </p>
      </div>
      <UButton label="Ir para Lançamentos" to="/transactions" color="neutral" variant="outline" />
    </div>

    <template v-else>
      <section class="flex flex-col gap-3 rounded-[--ui-radius] border border-default bg-default p-3 sm:p-4">
        <h2 class="font-medium">Receitas e despesas por mês</h2>
        <MonthlyTrendChart :months="result.months" />
      </section>

      <div class="grid grid-cols-1 gap-4 @min-[64rem]:grid-cols-[3fr_2fr]">
        <section class="rounded-[--ui-radius] border border-default bg-default p-3 sm:p-4">
          <h2 class="mb-2 font-medium">Mês a mês</h2>
          <MonthlyTable :months="result.months" />
        </section>

        <section class="rounded-[--ui-radius] border border-default bg-default p-3 sm:p-4">
          <CategoryBreakdown :categories="result.byCategory" />
        </section>
      </div>
    </template>
  </div>
</template>
