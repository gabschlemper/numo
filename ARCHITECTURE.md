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
  pages/         → o único lugar que decide o que acontece quando o usuário age (Lançamentos, Listas, auth).
  constants/      → enums fechados do domínio, seeds de demonstração e tamanhos de página.
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

## Listas: o que é dado do usuário e o que é código

Categorias, contas e devedores eram arrays fixos em `constants/referenceOptions.ts` — ninguém criava uma categoria sem editar código. Agora são dado, atrás de `ReferenceListRepository` (porta) + `MockReferenceListRepository` (adaptador), com tela própria em `/lists`.

Método, tipo, status e "a reembolsar" **continuam constantes**, de propósito: são uniões fechadas em `types/transaction.ts`. Uma forma de pagamento nova não é um registro, é mudança de tipo, de validação e de regra de resumo. Um CRUD genérico de "listas" deixaria o usuário criar o método "Boleto" e gerar lançamentos que nenhuma regra do domínio sabe classificar.

Três regras da tela existem porque o dado é compartilhado com os lançamentos, e todas as três estão no adaptador (não na UI):

- **Renomear propaga.** Trocar "Supermercado" por "Mercado" reescreve os lançamentos que usavam o nome antigo, e a operação devolve quantos foram — que vira a confirmação na tela. Sem isso, renomear órfã silenciosamente 34 linhas.
- **Excluir item em uso é recusado** (`conflict` com `details.usageCount`), nunca em cascata. Apagar junto destruiria lançamentos que ninguém mandou apagar.
- **A recusa vem com saída.** O modal de exclusão oferece mover os lançamentos para outro item na mesma operação. Uma proteção sem alternativa vira um beco sem saída que o usuário lê como bug.

`usageCount` é sempre **derivado** dos lançamentos, nunca um contador guardado: um contador desincroniza na primeira exclusão que esquecer de decrementá-lo, e aí a tela promete "sem uso" logo antes de o servidor recusar.

### `MockDataStore` — e por que ele é só do mock

Essas regras só funcionam porque listas e lançamentos são o mesmo dado. Num backend real isso é trivial (mesma base); com dois adaptadores mock cada um segurando o próprio array, `usageCount` daria sempre zero e o rename não alcançaria nada.

Então `repositories/mock/MockDataStore.ts` é o stand-in de "uma base só", compartilhado por `MockTransactionRepository` e `MockReferenceListRepository`. É **injetado no construtor** com um singleton como default: o app inteiro usa a mesma instância, e cada teste cria a sua e continua isolado.

Nada fora de `repositories/mock/` importa esse arquivo — `ApiTransactionRepository` e `ApiReferenceListRepository` não vão compartilhar nada, quem garante a consistência é o servidor.

## Resumo mensal: por competência, e olhando para frente

A tela `/summary` agrega por `billingMonth`, **nunca** por `date`. A diferença é o motivo de ela existir: uma compra parcelada em 12x tem uma única data (o dia da compra) e doze competências. Agregada por data, ela apareceria inteira num mês só e sumiria dos onze em que o dinheiro realmente sai.

Pela mesma razão, o **período padrão é assimétrico**: 5 meses para trás e 6 para frente, com o mês corrente no meio. "Últimos 12 meses" — que é o padrão óbvio e era o que o contrato dizia — esconderia justamente as parcelas futuras já comprometidas, que são as únicas sobre as quais ainda dá para agir. Ficou como preset, não como padrão.

`SummaryRepository` é porta separada de `TransactionRepository` (Segregação de Interface: nenhum dos 7 métodos de lá serve ao Resumo, e no contrato são recursos distintos) e devolve o agregado **já pronto** — com backend real, somar cinco anos no navegador significa baixar cinco anos.

### O gráfico

Barras agrupadas, duas séries, **um eixo só**. Receita e despesa estão na mesma unidade, então dividem a escala; dois eixos y é o erro clássico que faz séries incomparáveis parecerem comparáveis. Saldo não é terceira série — é a diferença entre as duas barras, já desenhada.

Mês sem lançamento vira coluna vazia, não some: um gráfico que pula mês encosta setembro em dezembro e mente sobre a tendência (é o que `monthsBetween` garante).

**As cores das séries foram validadas, não escolhidas a olho.** Os tokens `--numo-chart-income` / `--numo-chart-expense` em `main.css` passaram nas seis checagens de paleta (banda de luminosidade, croma, separação para daltonismo, piso de visão normal, contraste) nos dois temas — ΔE 30.3 para deuteranopia no claro, 27.5 no escuro, contra um piso de 8. O modo escuro tem passo próprio no azul, não o mesmo valor clareado: `#2563eb` sai da banda de luminosidade contra fundo escuro. Trocar esses valores sem revalidar passa despercebido em revisão e é indistinguível para cerca de 1 em 12 leitores homens.

A tabela "Mês a mês" não é redundância do gráfico: é a via de acesso para leitor de tela, daltonismo e impressão, é onde estão os valores exatos (o gráfico só rotula no hover), e é o que entrega o período inteiro num celular, onde o gráfico rola na horizontal.

## Perfil e configurações

`ProfileRepository` é porta separada de `AuthRepository`, pela mesma razão que `SummaryRepository` não virou método de `TransactionRepository`: no contrato são recursos distintos (`/auth/*` vs `/me`), e trocar o próprio nome não é autenticação. `AuthRepository` responde "quem é você e como você entra"; `ProfileRepository` responde "mude isto em você".

Três decisões que valem registro:

- **A conta editada vem da SESSÃO, nunca de um id mandado pela tela.** A porta não aceita id de usuário — se aceitasse, existiria um caminho em que o cliente escolhe qual conta editar. É o tipo de brecha que nasce no mock e atravessa para o adaptador real por imitação.
- **A senha atual é exigida mesmo com o usuário logado**, e é conferida **antes** de validar a nova. Dizer "a nova senha é curta demais" para quem errou a atual entrega a informação de que a atual estava certa.
- **`useProfile` não guarda o usuário.** Quem guarda é `useAuth`; depois de salvar, `useProfile` chama `useAuth().refreshUser()` para o repositório continuar sendo a fonte da verdade. A alternativa (escrever direto no estado) funcionaria hoje e passaria a mentir no dia em que o servidor normalizasse algo — um nome com espaços duplicados voltaria limpo do servidor e sujo na tela. Sem esse refresh, o nome muda no formulário e o avatar da barra lateral continua com o antigo.

O e-mail é somente leitura, com o motivo escrito na tela: trocar e-mail de login é fluxo de verificação, não campo de formulário. Um input desabilitado sem explicação só faz o usuário clicar nele.

### `MockAccountStore`

Mesma história do `MockDataStore`, um nível acima: a tabela de contas saiu de dentro de `MockAuthRepository` quando o Perfil apareceu, porque trocar a senha mexe na MESMA conta que o login lê. Com stores separados, o usuário trocaria a senha e continuaria entrando com a antiga — e nenhum teste do adaptador de perfil perceberia.

Efeito colateral bom: os testes de auth deixaram de precisar de `vi.resetModules()` + re-import dinâmico para se isolarem. Agora cada um cria o seu store no construtor.

## Erros: `ApiError`, não string solta

`types/apiError.ts` implementa o formato que `API-CONTRACT.md` define: `code`, `message`, `fields` e `details`.

A diferença prática está no formulário. Antes, toda falha chegava como `Error.message` e virava toast — o que obriga o usuário a reler o formulário inteiro procurando o que está errado. Agora um nome repetido volta com `fields.name` e aparece **embaixo do input**, com o modal aberto e o texto digitado preservado; um `conflict` de item em uso volta com `details.usageCount` e a tela consegue oferecer a reatribuição em vez de só avisar que deu errado.

A regra de leitura: compare sempre com `code`, nunca com `message`.

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
2. Carteira compartilhada de verdade (Gabi + Malu na mesma conta/dados) — login/cadastro/logout já existem, mas hoje são duas contas independentes. O contrato já nasce escopado por workspace (ver `API-CONTRACT.md`); falta a UI e o backend.
3. Parsing real de planilha em `useSpreadsheetImport.ts` (hoje simulado) — trocar `simulateFileAnalysis` por um parser de `.xlsx`/`.csv` de verdade.
4. Ordenação, paginação e resumo hoje acontecem **no cliente**, sobre a lista inteira. Com um backend real e milhares de linhas, os três viram parâmetros de query — os composables (`useTransactionSorting`, `useTransactionPagination`) já isolam esse estado num lugar só, então a troca não encosta nos componentes.
5. Reavaliar o `routeRules` de `ssr: false` quando existir backend real com sessão via cookie (ver seção de Autenticação acima).
