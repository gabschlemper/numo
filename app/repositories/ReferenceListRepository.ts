// app/repositories/ReferenceListRepository.ts
//
// A PORTA das Listas — mesmo papel que `TransactionRepository` cumpre
// para lançamentos (ver o cabeçalho daquele arquivo e ARCHITECTURE.md
// para a justificativa completa). Nenhum componente ou composable
// pode depender de um adaptador concreto; hoje
// `useReferenceListRepository()` liga isto ao mock, e no dia do
// backend um `ApiReferenceListRepository implements
// ReferenceListRepository` entra no lugar naquele único ponto.
//
// Duas operações aqui existem por causa de regras que descobrimos ao
// escrever o contrato, não por simetria de CRUD:
//
//   • `rename` devolve `updatedTransactions` porque renomear
//     PROPAGA. Se não propagasse, renomear "Supermercado" órfã
//     silenciosamente os 34 lançamentos que a usavam. A contagem
//     volta para a tela poder confirmar o que aconteceu de fato.
//
//   • `reassign` existe porque `remove` se recusa a apagar um item em
//     uso (lança `conflict`). Sem uma forma de reatribuir em massa, a
//     única saída do usuário seria editar 34 lançamentos na mão — o
//     que faria a recusa parecer um bug em vez de uma proteção.
import type {
  ListItem,
  ListType,
  ReassignOptions,
  ReassignResult,
  ReferenceLists,
  RenameResult
} from '~/types/referenceList'

export interface ReferenceListRepository {
  /**
   * As três listas de uma vez.
   *
   * Uma chamada só, e não uma por lista, porque a tela de Lançamentos
   * precisa das três juntas para montar filtros e selects — três
   * requests para renderizar um formulário é latência que o usuário
   * sente sem motivo.
   */
  list(): Promise<ReferenceLists>

  /** Lança `conflict` se já existir item com o mesmo nome (ignorando caixa e espaços). */
  create(type: ListType, name: string): Promise<ListItem>

  /** Renomeia e propaga para os lançamentos que usam o valor antigo. */
  rename(type: ListType, id: string, name: string): Promise<RenameResult>

  /** Lança `conflict` com `details.usageCount` quando o item está em uso. */
  remove(type: ListType, id: string): Promise<void>

  /** Move todos os lançamentos de um item para outro, opcionalmente apagando a origem. */
  reassign(type: ListType, id: string, options: ReassignOptions): Promise<ReassignResult>
}
