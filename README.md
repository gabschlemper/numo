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

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run typecheck` — checagem de tipos (roda limpo, sem erros)
- `npm run lint` — lint

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
