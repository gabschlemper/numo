# Contrato de API — Numo

Este documento é o acordo entre o frontend e o backend que ainda não existe. Ele descreve **o que o frontend precisa pedir e o que espera receber** — não como o backend implementa nada disso.

Ele foi escrito a partir do que as telas realmente consomem hoje (ver `ARCHITECTURE.md`), não de um CRUD genérico. Cada endpoint abaixo existe porque alguma tela precisa dele; onde o frontend hoje resolve algo localmente com dado mockado, está marcado **(hoje client-side)**.

**Estado, por área:**

| Área | Situação |
|---|---|
| **Listas** | **Implementado contra este contrato.** `ReferenceListRepository` + `MockReferenceListRepository` seguem os payloads, os códigos de erro (`conflict` com `details.usageCount`, `validation_failed` com `fields.name`) e as regras de propagação descritas abaixo. Trocar o mock por um adaptador HTTP é uma linha em `useReferenceListRepository.ts`. |
| **Erros** | **Implementado.** `app/types/apiError.ts` é a forma descrita em [Formato de erro](#formato-de-erro), já usada pela UI para mostrar erro por campo. |
| **Resumo mensal** | **Implementado contra este contrato.** `SummaryRepository` + `MockSummaryRepository` devolvem `{ months, byCategory }` com as regras abaixo (meses sem buraco, `byCategory` só de despesas). A agregação é a função pura `summarizeByMonth` — que continua valendo, testada, como especificação executável do que o servidor tem que devolver. |
| Lançamentos | Porta existente, **assinatura antiga**: `list()` sem query, filtro/ordenação/paginação no cliente. |
| **Perfil** | **Implementado contra este contrato.** `ProfileRepository` + `MockProfileRepository` cobrem `PATCH /me` e `POST /me/password`, com `validation_failed` + `fields` (`name`, `currentPassword`, `newPassword`) e `unauthenticated` quando não há sessão. |
| Auth / Importação | Proposta. |

A seção [O que muda no frontend](#o-que-muda-no-frontend-quando-isso-existir) lista o que falta ajustar nas áreas ainda não implementadas.

---

## Convenções

- **Base:** `/api/v1`
- **Formato:** JSON em tudo, `Content-Type: application/json` (exceto upload de planilha, que é `multipart/form-data`).
- **Datas:** `date` é sempre `YYYY-MM-DD`. `billingMonth` é sempre `YYYY-MM` — **nunca** um date completo. Essa distinção não é estilística: a planilha que este app substitui teve três bugs históricos causados exatamente por essa coluna virar Date (ver `app/utils/billingMonth.ts`). O backend deve rejeitar `billingMonth` com dia.
- **Dinheiro:** `amount` é number decimal positivo, sempre em BRL. **O sinal nunca é armazenado** — quem diz se é entrada ou saída é o campo `type`. Um `amount` negativo é erro de validação, não um débito.
- **Timestamps:** `createdAt` / `updatedAt` em ISO 8601 UTC.
- **Sessão:** cookie `httpOnly` + `SameSite=Lax`, emitido pelo login. O frontend nunca lê o token — ele pergunta "quem sou eu" via `GET /auth/me`. (Hoje o mock guarda em `localStorage`; ver `MockAuthRepository`.)

### Formato de erro

Toda resposta 4xx/5xx usa **um único formato**:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Não foi possível salvar o lançamento.",
    "fields": {
      "amount": "O valor precisa ser maior que zero.",
      "category": "Categoria é obrigatória."
    }
  }
}
```

- `code` — string estável, para o frontend decidir comportamento (nunca faça `if (message === ...)`).
- `message` — texto pronto para o usuário, em pt-BR. É o que o toast mostra.
- `fields` — **opcional**, só em `validation_failed`. É a chave para o formulário: cada chave é o nome do campo do domínio, e o frontend consegue mostrar o erro **embaixo do campo certo** em vez de num toast genérico.

O campo `fields` é o motivo de este bloco existir. Hoje o frontend só tem `Error.message` virando toast — validação de servidor não tem onde aparecer.

**Códigos previstos:**

| `code` | HTTP | Quando |
|---|---|---|
| `validation_failed` | 422 | Payload inválido. Sempre acompanha `fields`. |
| `unauthenticated` | 401 | Sem sessão válida. O frontend redireciona para `/login`. |
| `forbidden` | 403 | Autenticado, mas sem acesso àquele workspace. |
| `not_found` | 404 | Recurso inexistente **ou** fora do workspace do usuário (ver nota de segurança abaixo). |
| `conflict` | 409 | Operação bloqueada pelo estado atual — ex.: apagar categoria em uso. |
| `rate_limited` | 429 | Só em `/auth/*`. |
| `internal` | 500 | Qualquer falha inesperada. |

> **Nota de segurança:** um recurso que existe mas pertence a outro workspace responde `404`, nunca `403`. Responder `403` confirma que aquele id existe — vaza informação entre carteiras.

---

## Escopo: workspace

**Decisão tomada:** os dados são de uma **carteira compartilhada**, não de um usuário. Gabi e Malu enxergam e editam os mesmos lançamentos.

Consequência prática: **todo endpoint de dados é escopado por workspace** —

```
/api/v1/workspaces/{workspaceId}/transactions
/api/v1/workspaces/{workspaceId}/lists/...
```

Endpoints de identidade (`/auth/*`, `/me`) não são escopados.

Isso está no contrato desde o começo de propósito: adicionar workspace depois seria breaking change em literalmente todos os endpoints.

### `createdBy` é auditoria, não uma dimensão do orçamento

`Transaction` ganha `createdBy` (id do usuário que lançou). **Isso não é "quem gastou".**

O domínio é explícito sobre isso (`app/types/transaction.ts`): este é um orçamento conjunto, deliberadamente **sem** coluna de "quem gastou" — dinheiro que sai da carteira sai da carteira, independente de quem digitou a linha. `createdBy` serve para responder "quem lançou isso?" quando as duas estiverem em dúvida, e nada além disso.

Concretamente, no frontend: `createdBy` **não** vira filtro, **não** vira coluna padrão da tabela e **não** divide nenhum número do resumo. Se algum dia virar, é uma decisão de produto nova, não uma consequência de o campo existir.

---

## Autenticação e identidade

### `POST /auth/login`

```json
{ "email": "gabi@numo.app", "password": "..." }
```

**200** → `{ "user": User, "workspaces": WorkspaceMembership[] }`
**401** `invalid_credentials` · **429** `rate_limited`

### `POST /auth/signup`

```json
{ "name": "Gabi", "email": "gabi@numo.app", "password": "..." }
```

**201** → mesma resposta do login (cadastro já cria uma sessão e um workspace pessoal).
**422** `validation_failed` — `fields.email` quando já existe.

### `POST /auth/password-reset`

```json
{ "email": "gabi@numo.app" }
```

**204** *sempre* — inclusive para e-mail inexistente. Nunca revele se a conta existe. (Essa regra já está escrita na porta `AuthRepository` e vale igual no backend.)

### `POST /auth/logout` → **204**

### `GET /auth/me`

O endpoint que faz a sessão funcionar sem o frontend saber nada de token.

**200** → `{ "user": User, "workspaces": WorkspaceMembership[] }`
**401** `unauthenticated` — resposta normal, não é erro de aplicação: significa "deslogado".

```ts
interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

interface WorkspaceMembership {
  workspaceId: string
  name: string           // "Gabi & Malu"
  role: 'owner' | 'member'
  isDefault: boolean     // qual carregar ao entrar
}
```

### `PATCH /me` — tela de Perfil

```json
{ "name": "Gabi" }
```
**200** → `User` · **422** `validation_failed`

### `POST /me/password` — tela de Perfil

```json
{ "currentPassword": "...", "newPassword": "..." }
```
**204** · **422** `validation_failed` com `fields.currentPassword` quando a senha atual não confere.

---

## Lançamentos

### `GET /workspaces/{workspaceId}/transactions`

O endpoint mais importante do contrato. **Hoje o frontend filtra, ordena e pagina tudo no cliente** sobre a lista inteira — isso funciona com 47 linhas e não funciona com 5.000. Os três viram query params.

**Query params** (todos opcionais):

| Param | Tipo | Notas |
|---|---|---|
| `search` | string | Busca só em `description`, case-insensitive, substring. |
| `category` | string, **repetível** | `?category=Casa&category=Pet` = OU entre valores. |
| `account` | string, repetível | |
| `method` | enum, repetível | |
| `type` | enum, repetível | |
| `debtor` | string, repetível | |
| `status` | enum, repetível | |
| `reimbursable` | `Sim`\|`Não`, repetível | |
| `billingMonthFrom` / `billingMonthTo` | `YYYY-MM` | Usado pela tela de Resumo mensal. |
| `sort` | `campo:asc`\|`campo:desc` | Default `date:desc`. |
| `page` | int ≥ 1 | Default `1`. |
| `pageSize` | int | Default `25`; valores aceitos `10\|25\|50\|100`. |

**Filtros diferentes são E entre si; valores do mesmo filtro são OU entre si.** (`category=Casa&category=Pet&status=Pago` = "(Casa ou Pet) e Pago".) É o que `filterTransactions` já faz hoje.

**`sort` aceita apenas:** `date`, `description`, `category`, `account`, `method`, `amount`, `type`, `status`, `debtor`, `billingMonth`. Qualquer outro campo → `422`.

Duas regras de ordenação que o frontend já implementa e o backend precisa reproduzir, senão a lista muda de ordem ao trocar de página:
1. **Valores vazios vão para o fim nas duas direções** (`debtor` vazio é "sem valor", não "valor que vem antes do A").
2. **A ordenação é estável** e desempata por `id` — sem isso, dois lançamentos de mesma data podem trocar de lugar entre páginas e sumir ou duplicar.

**200:**

```json
{
  "data": [ /* Transaction[] */ ],
  "page": 1,
  "pageSize": 25,
  "total": 137,
  "summary": {
    "count": 137,
    "income": 28753.23,
    "expenses": 14565.75,
    "balance": 14187.48,
    "reimbursable": 480.00,
    "pendingCount": 20
  }
}
```

#### Por que `summary` vem junto e não num endpoint separado

O resumo no topo da tela descreve **todo o resultado do filtro**, não a página que está na tela. Se ele viesse de outra chamada, os dois poderiam divergir (filtro aplicado numa e não na outra) e o usuário veria "Saldo R$ 14.187" ao lado de uma lista que não soma isso. Vindo na mesma resposta, é impossível divergirem — e economiza um round trip por digitação na busca.

`summary` respeita **todos** os filtros e **ignora** `page`/`pageSize`.

As regras dos números estão em `app/utils/summarizeTransactions.ts` e valem igual no backend:
- `income` = soma de `amount` onde `type === 'Receita'`. Nada mais é receita.
- `expenses` = soma de `amount` de todo o resto (`Fixo`, `Variável`, `Investimento`).
- `reimbursable` = despesas com `reimbursable === 'Sim'` — **já contadas** dentro de `expenses`, não subtraídas.
- `balance` = `income - expenses`.
- `debtor` **não afeta nenhum número**.

### O objeto `Transaction`

```ts
interface Transaction {
  id: string
  date: string                    // YYYY-MM-DD
  description: string
  category: string
  account: string
  method: 'Crédito' | 'Débito' | 'PIX' | 'Investimento' | 'VA' | 'VR'
  amount: number                  // sempre positivo
  type: 'Receita' | 'Fixo' | 'Variável' | 'Investimento'
  installment: string | null      // "3/12", ou null quando não é parcelado
  status: 'Pago' | 'Pendente'
  debtor: string                  // "" quando não há; sempre um terceiro
  reimbursable: 'Sim' | 'Não'
  billingMonth: string            // YYYY-MM — competência, não a data da compra

  // Metadados — read-only, o servidor manda e ignora se vierem no corpo
  createdBy: string               // id do usuário; auditoria, ver acima
  createdAt: string
  updatedAt: string
}
```

### `POST /workspaces/{workspaceId}/transactions`

Aceita **um objeto ou um array** — a tela tem "Novo lançamento" (1) e "Adicionar em massa" (N), e o import confirma centenas. Um endpoint só evita duas implementações que divergem na validação.

```json
{ "transactions": [ { /* TransactionDraft */ } ] }
```

`TransactionDraft` = `Transaction` sem `id`, `createdBy`, `createdAt`, `updatedAt`.

**201** → `{ "data": Transaction[] }` na mesma ordem do envio.
**422** → `fields` **indexado** quando veio array, para o formulário em grade saber qual linha reprovou:

```json
{ "error": { "code": "validation_failed", "message": "...",
  "fields": { "1.amount": "O valor precisa ser maior que zero." } } }
```

**Validação obrigatória** (hoje o frontend não valida nada — dá para criar lançamento vazio de R$ 0,00):

| Campo | Regra |
|---|---|
| `description` | obrigatório, 1–140 chars após trim |
| `amount` | obrigatório, `> 0` |
| `date` | obrigatório, `YYYY-MM-DD` válido |
| `category`, `account` | obrigatórios, precisam existir nas listas do workspace |
| `method`, `type`, `status`, `reimbursable` | obrigatórios, dentro do enum |
| `billingMonth` | obrigatório, `YYYY-MM`; rejeitar se vier com dia |
| `installment` | opcional; se vier, precisa casar `^\d+/\d+$` |
| `debtor` | opcional; se vier, precisa existir na lista de devedores |

### `PATCH /workspaces/{workspaceId}/transactions`

Edição de 1 **e** em massa — a semântica é idêntica, muda só o tamanho de `ids`.

```json
{ "ids": ["t_1", "t_2"], "patch": { "status": "Pago" } }
```

**Campo ausente em `patch` significa "não mexa".** Nunca "limpe". É o que a tela de edição em massa promete: os campos não marcados continuam como estavam **em cada linha**.

**200** → `{ "data": Transaction[] }` com as linhas atualizadas.
**404** se **qualquer** id não existir — a operação é atômica, não parcial.

### `POST /workspaces/{workspaceId}/transactions/duplicate`

```json
{ "ids": ["t_1"], "newDate": "2026-11-01", "status": "Pendente" }
```

- `newDate: null` → cada cópia mantém a data do original.
- `newDate` preenchido → **também recalcula `billingMonth`** a partir dela. Copiar a competência antiga junto com uma data nova gera um lançamento incoerente.
- `status` é obrigatório e se aplica a todas as cópias (a UI default é `Pendente`: uma cópia é, por definição, algo ainda não confirmado).

**201** → `{ "data": Transaction[] }` — as cópias, com ids novos.

### `POST /workspaces/{workspaceId}/transactions/bulk-delete`

```json
{ "ids": ["t_1", "t_2"] }
```

**204** · **404** se algum id não existir (atômico).

> `POST` e não `DELETE` porque `DELETE` com corpo é inconsistentemente suportado por proxies e CDNs. Não vale arriscar num endpoint destrutivo.

---

## Listas (categorias, contas, devedores)

Hoje isso é um array hardcoded em `app/constants/referenceOptions.ts`, cujo próprio comentário diz que é um *stand-in* para uma tabela editável. Esta é a tela **Listas / Cadastros**.

### O que é editável e o que não é

| Lista | Editável? | Por quê |
|---|---|---|
| `categories` | **sim** | Vocabulário do usuário. Muda com a vida dele. |
| `accounts` | **sim** | Contas e cartões entram e saem. |
| `debtors` | **sim** | Pessoas. |
| `methods`, `types`, `status`, `reimbursable` | **não** | São enums fechados do domínio, não dados. Uma forma de pagamento nova é mudança de código (afeta tipo, validação e regras), não um registro. |

O frontend continua lendo os quatro enums fechados de constantes locais. Só as três primeiras vêm da API.

### `GET /workspaces/{workspaceId}/lists`

Uma chamada só — a tela de Lançamentos precisa das três de uma vez para montar os filtros e os selects do formulário.

```json
{
  "categories": [ { "id": "c_1", "name": "Supermercado", "usageCount": 34 } ],
  "accounts":   [ { "id": "a_1", "name": "Nubank Gabi", "usageCount": 128 } ],
  "debtors":    [ { "id": "d_1", "name": "Ana", "usageCount": 3 } ]
}
```

`usageCount` existe para a tela de Listas conseguir avisar **antes** — "Supermercado está em 34 lançamentos" — em vez de só falhar na hora de apagar.

### `POST /workspaces/{workspaceId}/lists/{listType}/items`

`listType` ∈ `categories` | `accounts` | `debtors`.

```json
{ "name": "Assinaturas" }
```

**201** → o item criado.
**409** `conflict` se já existir com o mesmo nome (case-insensitive, após trim).

### `PATCH /workspaces/{workspaceId}/lists/{listType}/items/{id}`

```json
{ "name": "Assinaturas e apps" }
```

**Renomear atualiza todos os lançamentos que usam o valor antigo, na mesma transação.** Isso é o ponto: se o rename não propagar, renomear uma categoria silenciosamente órfã 34 lançamentos.

**200** → `{ "item": ListItem, "updatedTransactions": 34 }` — a contagem vira o toast de confirmação ("Categoria renomeada em 34 lançamentos").

### `DELETE /workspaces/{workspaceId}/lists/{listType}/items/{id}`

**204** quando `usageCount === 0`.

**409 quando está em uso** — nunca apagar em cascata:

```json
{
  "error": {
    "code": "conflict",
    "message": "\"Supermercado\" está em uso em 34 lançamentos.",
    "details": { "usageCount": 34 }
  }
}
```

O frontend usa `details.usageCount` para oferecer a saída certa: reatribuir para outra categoria antes de apagar.

### `POST /workspaces/{workspaceId}/lists/{listType}/items/{id}/reassign`

```json
{ "targetId": "c_9", "deleteAfter": true }
```

**200** → `{ "updatedTransactions": 34 }`. É o que destrava o 409 acima sem o usuário editar 34 linhas na mão.

---

## Resumo mensal

Tela **Resumo mensal**. O domínio já tem `billingMonth` e hoje ele quase não é usado — esta é a tela que justifica o campo.

### `GET /workspaces/{workspaceId}/summary/monthly`

| Param | Notas |
|---|---|
| `from`, `to` | `YYYY-MM`, inclusivos. Default: **5 meses atrás até 6 meses à frente** do mês corrente. |

> **Por que o default não é "últimos 12 meses".** Foi o que este documento dizia antes de a tela existir, e estava errado. `billingMonth` é competência: uma compra parcelada em 12x já tem faturas marcadas para os próximos onze meses. Uma janela só retrospectiva esconderia exatamente as despesas **futuras já comprometidas** — as únicas sobre as quais ainda dá para agir. Daí a assimetria, com o mês corrente no meio. O frontend expõe "Últimos 12 meses" como preset para quem quiser só o retrospecto.

Aceita **também** todos os filtros de `GET /transactions` (mesmos nomes), para o resumo poder ser recortado por categoria/conta.

**200:**

```json
{
  "months": [
    {
      "billingMonth": "2026-09",
      "income": 15147.70,
      "expenses": 8420.15,
      "balance": 6727.55,
      "reimbursable": 480.00,
      "pendingCount": 6,
      "count": 31
    }
  ],
  "byCategory": [
    { "category": "Supermercado", "expenses": 1840.22, "count": 12 }
  ]
}
```

- `months` vem **ordenado crescente** e **sem buracos**: mês sem lançamento aparece zerado, não some. Um gráfico com meses faltando mente sobre a tendência.
- `byCategory` cobre o período inteiro (não por mês) e traz **só despesas** — categoria de receita num ranking de gastos é ruído.

---

## Importação de planilha

Hoje `useSpreadsheetImport` **simula** tudo: `simulateFileAnalysis` fabrica um resultado plausível sem ler o arquivo. Não existe porta nem contrato. O parsing tem que ser do servidor — o frontend não deveria carregar um parser de `.xlsx`, e as regras de duplicata dependem do que já está no banco.

O fluxo é de dois passos porque a UI é um wizard: o usuário **revisa** antes de confirmar.

### `POST /workspaces/{workspaceId}/imports` — analisar

`multipart/form-data`:

| Campo | Notas |
|---|---|
| `file` | `.xlsx` ou `.csv`, máx. 5 MB |
| `account` | Conta à qual todas as linhas pertencem |

`account` vem do formulário e **não** do arquivo, de propósito: um extrato de cartão (o CSV do Nubank é só `date,title,amount`) não carrega coluna de "qual cartão" — você sabe qual é porque foi você que subiu.

**201:**

```json
{
  "importId": "imp_1",
  "file": "fatura-outubro.csv",
  "rows": [
    { "row": 2, "draft": { /* TransactionDraft */ }, "likelyDuplicate": false, "error": null },
    { "row": 5, "draft": null, "likelyDuplicate": false, "error": "Valor vazio" },
    { "row": 9, "draft": { /* ... */ }, "likelyDuplicate": true,  "error": null }
  ]
}
```

- `row` é o número da linha **no arquivo** (com cabeçalho, então começa em 2) — é o que o usuário procura quando vai consertar a planilha.
- `error` preenchido ⇒ `draft` é `null`. A linha é mostrada e não é importável.
- `likelyDuplicate`: já existe lançamento na mesma conta com mesma `date` e mesmo `amount`. É um **aviso**, não bloqueio — parcelas iguais no mesmo dia existem. Vem desmarcado na revisão.

A análise **não grava nada**. `importId` é válido por 30 min.

**422** `validation_failed` — arquivo ilegível, formato não suportado, acima do limite.

### `POST /workspaces/{workspaceId}/imports/{importId}/confirm`

```json
{ "rows": [2, 9] }
```

Só as linhas que o usuário deixou marcadas.

**201** → `{ "data": Transaction[], "imported": 2 }`
**409** `conflict` se o `importId` expirou — o frontend pede o upload de novo.

---

## O que muda no frontend quando isso existir

Registrado aqui para não virar surpresa. Nada disso está feito.

1. **`TransactionRepository.list()` passa a receber query e devolver página.**
   ```ts
   list(query: TransactionQuery): Promise<PaginatedTransactions>
   ```
   É a mudança de maior alcance: hoje `useTransactionFilters`, `useTransactionSorting` e `useTransactionPagination` operam sobre a lista inteira em memória. Eles continuam existindo — mas passam a **produzir a query** em vez de aplicar o filtro. As funções puras (`filterTransactions`, `sortTransactions`, `summarizeTransactions`) deixam de ser usadas pela tela e passam a ser usadas **pelo adaptador mock**, que é onde elas sempre pertenceram.

2. **`summary` deixa de ser calculado no cliente** e passa a vir da resposta. `useTransactionSummary` vira leitura, não cálculo.

3. **Busca precisa de debounce** (~300 ms). Hoje cada tecla refiltra um array — de graça. Com rede, cada tecla vira request.

4. ~~**Nova porta `ReferenceListRepository`**~~ — **feito.** Existe, com adaptador mock e a tela de Listas em cima dela. Falta só o adaptador HTTP. `constants/referenceOptions.ts` já separou os enums fechados (que ficam) do seed das listas editáveis (que sai quando a API existir).

5. **Nova porta `ImportRepository`**; `simulateFileAnalysis` sai de `useSpreadsheetImport`.

6. **`SummaryRepository` já existe** — falta só o adaptador HTTP. Quando ele chegar, `summarizeByMonth` deixa de rodar na tela e vira a referência de teste do backend.

7. **`AuthRepository.getCurrentUser()` passa a devolver `workspaces`**, e um `useWorkspace()` guarda o ativo — todo repositório passa a precisar do `workspaceId`.

8. **`error.fields` vira erro por campo no formulário.** Hoje toda falha vira um toast; com `fields`, a mensagem aparece embaixo do input que a causou.
