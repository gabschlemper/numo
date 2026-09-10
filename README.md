# Numo

Protótipo funcional (frontend, dado mockado) de três telas e seus fluxos:

- **Lançamentos** — filtros, busca, ordenação, paginação, resumo, edição individual e em massa, duplicação, exclusão em massa, adição em massa e importação de planilha de faturas.
- **Resumo mensal** — receitas, despesas e saldo por mês de competência, com gráfico de tendência, ranking de gastos por categoria e período configurável.
- **Listas** — categorias, contas e devedores editáveis, com renomeação que propaga para os lançamentos e exclusão que oferece reatribuição em vez de apagar em cascata.

Mais login, cadastro, esqueci a senha e logout (também mockados).

- `ARCHITECTURE.md` — decisões de organização de código (SOLID, onde cada coisa vive e por quê).
- `API-CONTRACT.md` — o contrato dos endpoints que o backend precisa expor: payloads, filtros, formato de erro e o que muda no frontend quando existirem. Escrito a partir do que as telas realmente consomem.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — pede login e redireciona pra `/transactions` depois de autenticado.

Contas de teste já cadastradas: `malu@numo.app` e `gabi@numo.app`, senha `numo123` (ou crie uma conta nova pelo próprio fluxo de cadastro).

## Testes

Cobrem a camada de lógica de negócio (utils, types, repositories, composables, middleware) — componentes e páginas ficam de fora por ora, ver `vitest.config.ts` para o porquê.

```bash
npm run test            # roda a suíte uma vez
npm run test:watch      # modo watch, pra ir junto com o dev
npm run test:coverage   # roda com relatório de cobertura (mínimo de 80% configurado)
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run typecheck` — checagem de tipos (funciona; ver nota sobre o aviso barulhento)
- `npm run lint` — lint
- `npm run test` / `npm run test:coverage` — testes (ver seção acima)

**Nota sobre `npm run typecheck`**: ele imprime um aviso barulhento — `[Vue] Failed to create plugin ... plugin is not a function`, do plugin Volar `vue-router/volar/sfc-route-blocks` — porque `@nuxt/ui` e `nuxt` resolvem versões diferentes de `vue-router` entre si. **O aviso é cosmético: a checagem em si funciona.** Verificado introduzindo um erro de tipo de propósito: ele reporta o arquivo e a linha e sai com código 2; sem erro, sai com 0.

Ou seja: dá para confiar no resultado, só não se assuste com o stack trace no meio da saída. Para ver só o que importa:

```bash
npm run typecheck 2>&1 | grep "error TS"
```

## Subindo para o seu GitHub

```bash
git init
git add .
git commit -m "Numo: tela de Lançamentos e fluxos (frontend mockado)"
git branch -M main
gh repo create numo --private --source=. --remote=origin
git push -u origin main
```

Se preferir não usar o `gh` CLI: crie o repositório vazio em github.com/new, depois:

```bash
git remote add origin git@github.com:SEU-USUARIO/numo.git
git push -u origin main
```

## Stack

Nuxt 4 · Nuxt UI 4 (design system — ver `app/app.config.ts` para a paleta) · TypeScript estrito · Tailwind CSS v4.
