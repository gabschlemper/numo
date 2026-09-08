# Arquitetura — Numo

Este documento explica as decisões de organização de código deste protótipo, não o produto em si. Se você (ou outro dev) for mexer no código, comece por aqui.

## Por que essa estrutura de pastas

```
app/
  types/         → o modelo de domínio (Transaction, filters, etc.) — não sabe nada de Vue, HTTP ou mock.
  repositories/  → a PORTA (TransactionRepository) e o ADAPTADOR mock (MockTransactionRepository).
  composables/   → estado + orquestração (useTransactions, useTransactionFilters, useTransactionSelection...).
  components/    → apresentação pura ou interações autocontidas — nunca decidem "o que fazer", só emitem intenção.
  pages/         → o único lugar que decide o que acontece quando o usuário age.
  constants/      → dados de referência (categorias, contas, seed de demonstração).
  utils/         → funções puras (formatação de moeda/data, filtro de lançamentos).
```

## SOLID, aplicado de verdade (não só citado)

**S — Single Responsibility.** Cada composable tem um motivo pra mudar: `useTransactions` muda se a forma de buscar/gravar dados mudar; `useTransactionFilters` muda se a lógica de filtro mudar; `useTransactionSelection` muda se a forma de selecionar linhas mudar. Nenhum dos três sabe da existência dos outros dois. O mesmo vale pros componentes: `TransactionsTable.vue` só renderiza e emite eventos — nunca decide o que fazer quando você clica em editar, isso é responsabilidade de `pages/transactions/index.vue`.

**O — Open/Closed.** `TransactionRepository` (em `repositories/TransactionRepository.ts`) é uma interface fechada — nenhum componente ou composable depende de `MockTransactionRepository` diretamente, todos dependem da interface. Quando o backend existir, você cria `ApiTransactionRepository implements TransactionRepository` e troca **uma linha** em `composables/useTransactionRepository.ts`. Nada mais no projeto muda.

**L — Liskov Substitution.** `MockTransactionRepository` é assíncrono em todos os métodos (mesmo sendo, por baixo, um array em memória) exatamente para garantir que uma implementação real (`ApiTransactionRepository`, de verdade assíncrona por causa da rede) seja um substituto perfeito, sem nenhum componente precisar saber a diferença.

**I — Interface Segregation.** `TransactionRepository` tem só os 7 métodos que a tela de Lançamentos realmente usa (`list`, `create`, `createMany`, `update`, `updateMany`, `duplicate`, `remove`) — não é uma interface genérica "CRUD de qualquer coisa" carregando métodos que ninguém chama.

**D — Dependency Inversion.** Esse é o ponto central do projeto: `pages/transactions/index.vue` e todos os composables dependem da **abstração** `TransactionRepository`, nunca da implementação concreta. `useTransactionRepository()` é o único ponto de fiação (a "composition root") — é o único arquivo que sabe que hoje estamos usando um mock.

## Por que os fluxos de edição usam drawer ou modal

Não foi escolha estética — cada um resolve um problema diferente:

- **Editar 1 lançamento → `USlideover`** (drawer lateral). Dez campos, o usuário se beneficia de ver a tabela "atrás" pra contexto, e de espaço confortável.
- **Editar em massa / Duplicar / Excluir em massa → `UModal`**. Ações de decisão pontual e rápida — o modal trava a atenção no que importa, sem o peso de um drawer.
- **Adicionar em massa → `USlideover`** com uma grade estilo planilha. Precisa de bastante largura horizontal (7 colunas), o que só um drawer wide comporta bem.
- **Importar planilha → `UModal` com `UStepper`**. Fluxo sequencial de 4 passos — um wizard é o padrão certo pra isso, não um drawer nem uma página separada.

## Zero valor hardcoded — como isso é garantido

- **Cores**: nenhum componente usa `text-blue-500` ou um hex direto. Tudo usa os aliases semânticos do Nuxt UI (`color="primary"`, `color="error"`, `color="success"`...) definidos uma única vez em `app/app.config.ts`. Trocar a paleta da marca é editar um arquivo, não fazer find-and-replace.
- **Tipografia**: a fonte é declarada uma vez em `app/assets/css/main.css` (`--font-sans`), nunca inline num componente.
- **Espaçamento/tamanho**: componentes usam a prop `size` do Nuxt UI (`xs`/`sm`/`md`) e a escala padrão do Tailwind (`gap-2`, `p-4`...) — nunca um valor mágico em pixel solto num `style=""`.
- **Formatação de moeda/data**: `utils/formatCurrency.ts` e `utils/formatDate.ts` são os únicos lugares que sabem formatar esses tipos — nenhum componente monta `Intl.NumberFormat` ou concatena "R$" na mão.

## O que falta pra virar produto de verdade

1. Trocar `MockTransactionRepository` por `ApiTransactionRepository` (o único ponto de troca é `useTransactionRepository.ts`, como explicado acima).
2. Autenticação (login/carteira compartilhada) — ainda não modelada neste protótipo, que foca só na tela de Lançamentos.
3. Parsing real de planilha em `useSpreadsheetImport.ts` (hoje simulado) — trocar `simulateFileAnalysis` por um parser de `.xlsx`/`.csv` de verdade.
4. Testes unitários para as funções puras (`filterTransactions`, `isRowComplete`) — são as mais baratas de testar por não dependerem do runtime do Vue.
