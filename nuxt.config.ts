// nuxt.config.ts
//
// Single source of truth for framework-level configuration.
// Design-system configuration (colors, typography, spacing) lives in
// `app/app.config.ts` and `app/assets/css/main.css` — never here, and
// never inline in components. See ARCHITECTURE.md for the full rationale.

export default defineNuxtConfig({
  compatibilityDate: '2026-09-09',

  modules: ['@nuxt/ui', '@nuxt/eslint'],

  // Without this, Nuxt prefixes every component with its subfolder name
  // (e.g. `components/transactions/FiltersBar.vue` would only be usable
  // as `<TransactionsFiltersBar>`, not `<FiltersBar>` as used throughout
  // this codebase) — components are grouped into feature folders here
  // for organization, not to be part of the component's public name.
  components: [{ path: '~/components', pathPrefix: false }],

  // Every route is client-rendered only — deliberate, not a default.
  // The mocked session lives in `localStorage` (see MockAuthRepository),
  // which doesn't exist during server rendering: without this, every
  // request would start "logged out" on the server and flip to "logged
  // in" once the client takes over (a hydration mismatch and a
  // login-flash on every page load). This is done per-route via
  // `routeRules` rather than the top-level `ssr: false` flag — that
  // flag hit a real Nuxt/Vite dev-server bug in this project
  // ("No entry found in rollupOptions.input", thrown from
  // `resolveServerEntry` in @nuxt/vite-builder) — `routeRules` reaches
  // the same "never render on the server" outcome while leaving a
  // normal server build in place, which sidesteps that bug. Independent
  // of mock-vs-real-backend; revisit once a real server issues real
  // sessions via cookie.
  routeRules: {
    '/**': { ssr: false }
  },

  css: ['~/assets/css/main.css'],

  future: {
    compatibilityVersion: 4
  },

  devtools: { enabled: true },

  typescript: {
    strict: true,
    typeCheck: true
  },

  app: {
    head: {
      // `lang` não é detalhe: leitores de tela usam ele para escolher
      // a pronúncia, e os controles nativos (o `<input type="month">`
      // do Resumo, por exemplo) nomeiam os meses no idioma do
      // documento — sem isso, um app inteiro em português mostra
      // "April 2026" no seletor de período.
      htmlAttrs: { lang: 'pt-BR' },
      title: 'Numo',
      meta: [
        { name: 'description', content: 'Controle financeiro flexível — pessoal ou compartilhado.' }
      ]
    }
  }
})
