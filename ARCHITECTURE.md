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
- **Espaçamento/tamanho**: componentes usam a prop `size` do Nuxt UI (`xs`/`sm`/`md`) e a escala padrão do Tailwind (`gap-2`, `p-4`...) — nunca um valor mágico em pixel solto num `style=""`.
- **Formatação de moeda/data**: `utils/formatCurrency.ts` e `utils/formatDate.ts` são os únicos lugares que sabem formatar esses tipos — nenhum componente monta `Intl.NumberFormat` ou concatena "R$" na mão.

## O que falta pra virar produto de verdade

1. Trocar `MockTransactionRepository` por `ApiTransactionRepository` (o único ponto de troca é `useTransactionRepository.ts`, como explicado acima) — e o mesmo para `MockAuthRepository` → `ApiAuthRepository` em `useAuthRepository.ts`.
2. Carteira compartilhada de verdade (Gabi + Malu na mesma conta/dados) — login/cadastro/logout já existem, mas hoje são duas contas independentes, sem noção de "workspace" compartilhado.
3. Parsing real de planilha em `useSpreadsheetImport.ts` (hoje simulado) — trocar `simulateFileAnalysis` por um parser de `.xlsx`/`.csv` de verdade.
4. Testes unitários para as funções puras (`filterTransactions`, `isRowComplete`) — são as mais baratas de testar por não dependerem do runtime do Vue.
5. Reavaliar o `routeRules` de `ssr: false` quando existir backend real com sessão via cookie (ver seção de Autenticação acima).
