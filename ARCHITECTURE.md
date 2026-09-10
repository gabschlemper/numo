# Arquitetura — Numo

Este documento explica as decisões de organização de código deste protótipo, não o produto em si. Se você (ou outro dev) for mexer no código, comece por aqui.

## Por que essa estrutura de pastas

```
app/
  types/         → o modelo de domínio (Transaction, filters, User, etc.) — não sabe nada de Vue, HTTP ou mock.
  repositories/  → as PORTAS (TransactionRepository, AuthRepository) e os ADAPTADORES mock.
  composables/   → estado + orquestração (useTransactions, useTransactionFilters, useAuth...).
  components/    → apresentação pura ou interações autocontidas — nunca decidem "o que fazer", só emitem intenção.
  layouts/       → moldura em volta das páginas (default = com sidebar, auth = sem sidebar, centralizado).
  middleware/    → auth.global.ts — decide quais rotas exigem sessão, nada mais.
  pages/         → o único lugar que decide o que acontece quando o usuário age.
  constants/      → dados de referência (categorias, contas, seed de demonstração, tamanhos de página).
  utils/         → funções puras (formatação de moeda/data, filtro, ordenação, resumo, descrição de filtros).
```

## SOLID, aplicado de verdade (não só citado)

**S — Single Responsibility.** Cada composable tem um motivo pra mudar: `useTransactions` muda se a forma de buscar/gravar dados mudar; `useTransactionFilters` muda se a lógica de filtro mudar; `useTransactionSelection` muda se a forma de selecionar linhas mudar. Nenhum dos três sabe da existência dos outros dois. O mesmo vale pros componentes: `TransactionsTable.vue` só renderiza e emite eventos — nunca decide o que fazer quando você clica em editar, isso é responsabilidade de `pages/transactions/index.vue`.

**O — Open/Closed.** `TransactionRepository` (em `repositories/TransactionRepository.ts`) é uma interface fechada — nenhum componente ou composable depende de `MockTransactionRepository` diretamente, todos dependem da interface. Quando o backend existir, você cria `ApiTransactionRepository implements TransactionRepository` e troca **uma linha** em `composables/useTransactionRepository.ts`. Nada mais no projeto muda.

**L — Liskov Substitution.** `MockTransactionRepository` é assíncrono em todos os métodos (mesmo sendo, por baixo, um array em memória) exatamente para garantir que uma implementação real (`ApiTransactionRepository`, de verdade assíncrona por causa da rede) seja um substituto perfeito, sem nenhum componente precisar saber a diferença.

**I — Interface Segregation.** `TransactionRepository` tem só os 7 métodos que a tela de Lançamentos realmente usa (`list`, `create`, `createMany`, `update`, `updateMany`, `duplicate`, `remove`) — não é uma interface genérica "CRUD de qualquer coisa" carregando métodos que ninguém chama.

**D — Dependency Inversion.** Esse é o ponto central do projeto: `pages/transactions/index.vue` e todos os composables dependem da **abstração** `TransactionRepository`, nunca da implementação concreta. `useTransactionRepository()` é o único ponto de fiação (a "composition root") — é o único arquivo que sabe que hoje estamos usando um mock.

## O pipeline da lista de Lançamentos

As linhas passam por quatro estágios, cada um um composable que não conhece os outros:

```
transactions → filtrar → ordenar → paginar → os DOIS renderizadores
               (useTransactionFilters)
                         (useTransactionSorting)
                                    (useTransactionPagination)
```

Cada composable guarda só o **estado**; a regra em si é uma função pura em `utils/` (`filterTransactions`, `sortTransactions`, `summarizeTransactions`) — mesma divisão que já existia entre `useTransactionFilters` e `filterTransactions`, agora aplicada a tudo. É o que mantém a lógica testável sem runtime do Vue (veja `tests/unit/utils/`).

Os dois renderizadores — `TransactionsTable` (telas largas) e `TransactionCardList` (celular) — recebem **o mesmo array já paginado**. Por isso é impossível o celular mostrar uma ordem diferente do desktop: não existem duas implementações de ordenação para divergirem. Esse é o motivo de a ordenação e a paginação NÃO usarem as do próprio `UTable` — a lista de cards não teria como perguntar a ordem pra ele.

Seleção e resumo leem a lista **filtrada**, não a paginada: "12 selecionados" e "Saldo" são respostas sobre todo o resultado, não sobre a página que você está vendo.

## Responsividade: container queries, não breakpoints de viewport

Toda a adaptação de largura desta tela usa `@container` / `@min-[Xrem]:` medindo o **elemento**, não a janela.

O motivo é concreto: o conteúdo divide a tela com uma sidebar de 224px. Num monitor de 1440px a lista tem ~1170px, então `xl:` (1280px de viewport) ligava colunas 110px antes de haver espaço e a tabela ganhava scroll horizontal numa tela grande. Container query pergunta a única coisa que importa — "que largura *eu* tenho" — e continua correta quando a sidebar some no tablet.

Os limiares em `useTransactionColumns` foram **medidos**, não chutados: cada tier é a largura em que aquela coluna cabe sem espremer a descrição. Verificado de 360px a 1920px sem scroll horizontal em nenhuma largura.

- Abaixo de ~42rem de container: a tabela não é renderizada, entra `TransactionCardList`.
- Sempre visíveis: Data, Descrição, Valor, Status — as quatro que respondem "o que foi isso, quanto custou, já caiu".
- As demais entram progressivamente em 46/60/74/92rem.

## Dois bugs reais encontrados durante esse trabalho

**1. `resolveComponent` nunca resolvia (`<ubutton>` no DOM).** As colunas usavam `resolveComponent('UButton')` / `('UBadge')` para montar células com `h()`. O auto-import de componentes do Nuxt é uma transformação de **tempo de compilação** de `<UButton>` em template — ele nunca registra o nome globalmente em runtime. Então `resolveComponent` não achava nada e caía no fallback documentado do Vue: devolver a própria string. O Vue renderizava um elemento literal `<ubutton>` — sem botão, sem badge, sem clique, e **sem erro nenhum**. Os botões de editar/excluir de cada linha e os badges de status estavam assim. A correção é importar de `#components` (`import { UBadge, UButton } from '#components'`), que é a forma suportada de alcançar esses componentes de dentro de uma render function. Nos testes, `vitest.config.ts` aponta `#components` para `tests/stubs/components.ts`.

**2. Seleção indexada por posição da linha.** `useTransactionSelection` mapeava `Record<índice, boolean>`. Enquanto a lista tinha ordem fixa isso funcionava; com ordenação por coluna e paginação, o índice 0 deixa de ser a mesma transação assim que você clica num cabeçalho — a seleção apontaria silenciosamente para **outras** linhas e o "Excluir" seguinte apagaria as erradas. Agora é indexada por `id` (com `:get-row-id` na tabela), e seleções que o filtro esconde são descartadas em vez de ficarem vivas invisíveis.

## Por que os fluxos de edição usam drawer ou modal

Não foi escolha estética — cada um resolve um problema diferente:

- **Editar 1 lançamento → `USlideover`** (drawer lateral). Dez campos, o usuário se beneficia de ver a tabela "atrás" pra contexto, e de espaço confortável.
- **Editar em massa / Duplicar / Excluir em massa → `UModal`**. Ações de decisão pontual e rápida — o modal trava a atenção no que importa, sem o peso de um drawer.
- **Adicionar em massa → `USlideover`** com uma grade estilo planilha. Precisa de bastante largura horizontal (7 colunas), o que só um drawer wide comporta bem.
- **Importar planilha → `UModal` com `UStepper`**. Fluxo sequencial de 4 passos — um wizard é o padrão certo pra isso, não um drawer nem uma página separada.

## Autenticação (login, cadastro, esqueci a senha, logout)

Mesma dupla porta+adaptador da tela de Lançamentos, aplicada a sessão: `AuthRepository` (interface) + `MockAuthRepository` (adaptador), trocados num único ponto (`useAuthRepository.ts`) quando houver backend de verdade — exatamente o padrão de `TransactionRepository`.

- **`useAuth`** guarda o usuário logado e expõe `login`/`signup`/`requestPasswordReset`/`logout`/`restoreSession`. Não decide para onde navegar — isso é do `middleware/auth.global.ts` e das próprias páginas.
- **`middleware/auth.global.ts`** roda em toda navegação: sem sessão fora de `/login`, `/signup`, `/forgot-password` → manda pro login; com sessão numa dessas três → manda pra `/transactions`. É o único lugar que sabe quais rotas são públicas.
- **Duas contas de teste** já vêm no `MockAuthRepository`: `malu@numo.app` e `gabi@numo.app`, senha `numo123` — pra não precisar passar pelo cadastro só pra testar o login.
- **`routeRules: { '/**': { ssr: false } }`** em `nuxt.config.ts` — decisão deliberada só por causa da sessão mockada via `localStorage` (que não existe durante renderização no servidor). Sem isso, toda página nasceria "deslogada" no servidor e trocaria pra "logada" no cliente — um flash de login a cada carregamento. Foi feito via `routeRules` (não pelo flag global `ssr: false`) porque esse flag global disparou um bug real de dev server do Nuxt/Vite neste projeto (`No entry found in rollupOptions.input`); `routeRules` chega no mesmo resultado (nada renderiza no servidor) sem acionar esse bug. Independente de mock-vs-backend-real; pode ser revisto quando existir um servidor emitindo sessão de verdade (cookie).
- **O que já está pronto pra API real, sem mudar nada além do adaptador**: a interface `AuthRepository` já modela `getCurrentUser()` como "pergunte quem está logado" — um adaptador real responderia isso validando um cookie de sessão no servidor, e nem `useAuth` nem o middleware precisam saber a diferença.
- **O que é só do mock, e devia sumir com um backend real**: senha em texto puro guardada em memória (`MockAuthRepository`), e a sessão persistida em `localStorage` em vez de um cookie `httpOnly`. Ambos ficam isolados dentro de `MockAuthRepository.ts` — nunca vazam pra `AuthRepository` nem pra quem consome `useAuth`.

## Zero valor hardcoded — como isso é garantido

- **Cores**: nenhum componente usa `text-blue-500` ou um hex direto. Tudo usa os aliases semânticos do Nuxt UI (`color="primary"`, `color="error"`, `color="success"`...) definidos uma única vez em `app/app.config.ts`. Trocar a paleta da marca é editar um arquivo, não fazer find-and-replace.
- **Tipografia**: a fonte é declarada uma vez em `app/assets/css/main.css` (`--font-sans`), nunca inline num componente.
- **Espaçamento/tamanho**: componentes usam a prop `size` do Nuxt UI (`xs`/`sm`/`md`) e a escala padrão do Tailwind (`gap-2`, `p-4`...) — nunca um valor mágico em pixel solto num `style=""`. As exceções são os limiares de container query (`@min-[60rem]`), que são medidas de layout e estão todas juntas no topo de `useTransactionColumns.ts`.
- **Superfícies de contraste**: a barra de ações em massa usa `bg-inverted` / `text-inverted`, não `bg-neutral-900` — o token é o que mantém o contraste correto nos dois temas.
- **Formatação de moeda/data**: `utils/formatCurrency.ts` e `utils/formatDate.ts` são os únicos lugares que sabem formatar esses tipos — nenhum componente monta `Intl.NumberFormat` ou concatena "R$" na mão.

## O que falta pra virar produto de verdade

1. Trocar `MockTransactionRepository` por `ApiTransactionRepository` (o único ponto de troca é `useTransactionRepository.ts`, como explicado acima) — e o mesmo para `MockAuthRepository` → `ApiAuthRepository` em `useAuthRepository.ts`.
2. Carteira compartilhada de verdade (Gabi + Malu na mesma conta/dados) — login/cadastro/logout já existem, mas hoje são duas contas independentes, sem noção de "workspace" compartilhado.
3. Parsing real de planilha em `useSpreadsheetImport.ts` (hoje simulado) — trocar `simulateFileAnalysis` por um parser de `.xlsx`/`.csv` de verdade.
4. Ordenação, paginação e resumo hoje acontecem **no cliente**, sobre a lista inteira. Com um backend real e milhares de linhas, os três viram parâmetros de query — os composables (`useTransactionSorting`, `useTransactionPagination`) já isolam esse estado num lugar só, então a troca não encosta nos componentes.
5. Reavaliar o `routeRules` de `ssr: false` quando existir backend real com sessão via cookie (ver seção de Autenticação acima).
