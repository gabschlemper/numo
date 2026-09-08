// nuxt.config.ts
//
// Single source of truth for framework-level configuration.
// Design-system configuration (colors, typography, spacing) lives in
// `app/app.config.ts` and `app/assets/css/main.css` — never here, and
// never inline in components. See ARCHITECTURE.md for the full rationale.

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],

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
      title: 'Numo',
      meta: [
        { name: 'description', content: 'Controle financeiro flexível — pessoal ou compartilhado.' }
      ]
    }
  }
})
