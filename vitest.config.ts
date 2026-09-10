// vitest.config.ts
//
// Deliberately independent of Nuxt's own build/dev pipeline: none of the
// files under test (utils, types, repositories, composables, middleware)
// need a running Nuxt app to execute — they only need the handful of
// Nuxt auto-imports they actually call (`ref`, `computed`, `readonly`,
// `useState`, `navigateTo`, `defineNuxtRouteMiddleware`), which
// `tests/setup.ts` provides as plain globals. That keeps the suite fast
// and free of the dev-server-class bugs documented in nuxt.config.ts —
// it never has to boot Nuxt/Vite/@nuxt/ui at all.
//
// Scope is deliberate too: coverage only measures the business-logic
// layers (utils/types/repositories/composables/middleware). Components
// and pages are thin presentation wrappers that delegate everything to
// this layer (see ARCHITECTURE.md) — testing them meaningfully means
// mounting real Vue components with @nuxt/ui stubbed out, a much bigger
// and more brittle effort for comparatively little extra confidence
// right now. Revisit if a bug ever originates in a component/page
// itself rather than in the logic it calls.
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const appDir = fileURLToPath(new URL('./app', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~': appDir,
      '@': appDir,
      // Nuxt's virtual components module doesn't exist outside a Nuxt
      // build; `tests/stubs/components.ts` explains what stands in for it.
      '#components': fileURLToPath(new URL('./tests/stubs/components.ts', import.meta.url))
    }
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'app/utils/**/*.ts',
        'app/types/**/*.ts',
        'app/repositories/**/*.ts',
        'app/composables/**/*.ts',
        'app/middleware/**/*.ts'
      ],
      exclude: ['**/*.d.ts'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80
      }
    }
  }
})
