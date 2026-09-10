// app/repositories/SummaryRepository.ts
//
// A PORTA do Resumo mensal.
//
// É uma porta separada, e não mais um método em
// `TransactionRepository`, por Segregação de Interface: aquela
// interface tem exatamente os 7 métodos que a tela de Lançamentos
// usa, e nenhum deles serve ao Resumo. Enfiar `monthly()` lá
// obrigaria todo adaptador de lançamentos (inclusive o futuro
// `ApiTransactionRepository`) a implementar um agregado que a tela
// de Lançamentos nunca chama. No contrato também são recursos
// distintos: `/transactions` e `/summary/monthly`.
//
// Ela devolve o resultado JÁ AGREGADO, não a lista bruta. É a
// diferença que decide se a tela escala: com um backend real, somar
// cinco anos de lançamentos no navegador significa baixar cinco anos
// de lançamentos.
import type { MonthlySummaryQuery, MonthlySummaryResult } from '~/types/summary'

export interface SummaryRepository {
  monthly(query: MonthlySummaryQuery): Promise<MonthlySummaryResult>
}
