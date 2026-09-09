# Numo

Protótipo funcional (frontend, dado mockado) da tela de Lançamentos e todos os seus fluxos: filtros, edição individual, edição em massa, duplicação, exclusão em massa, adição em massa e importação de planilha de faturas — além de login, cadastro, esqueci a senha e logout (também mockados).

Ver `ARCHITECTURE.md` para as decisões de organização de código (SOLID, onde cada coisa vive e por quê).

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
- `npm run typecheck` — checagem de tipos (⚠️ atualmente quebrado — ver nota abaixo)
- `npm run lint` — lint
- `npm run test` / `npm run test:coverage` — testes (ver seção acima)

**Nota sobre `npm run typecheck`**: hoje ele falha com `[Vue] Failed to create plugin ... plugin is not a function` (o plugin Volar `vue-router/volar/sfc-route-blocks`). Causa: `@nuxt/ui@4.11.1` e `nuxt@4.4.5` resolvem versões diferentes de `vue-router` entre si (`4.6.4` vs `5.3.1`) — um conflito entre as próprias dependências deles, não do `package.json` deste projeto (que não lista `vue-router` diretamente). Isso é independente do problema já documentado antes (remover `vue-router` como dependência direta), que ajudou mas não resolveu esse conflito de fundo. Não afeta `npm run dev`, `npm run build` nem os testes (que não passam pelo Volar) — só a checagem de tipos via `vue-tsc`.

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
