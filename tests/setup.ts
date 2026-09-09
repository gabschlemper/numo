// tests/setup.ts
//
// Every file under test relies on a handful of Nuxt auto-imports it
// never explicitly imports (that's the whole point of auto-import) —
// `ref`/`computed`/`readonly` from Vue, plus Nuxt's own `useState`,
// `navigateTo` and `defineNuxtRouteMiddleware`. Outside a real Nuxt app
// those names simply don't exist, so this file defines them as plain
// globals before any test runs — close enough to Nuxt's real behavior
// for unit tests, without paying the cost of booting Nuxt itself (see
// vitest.config.ts's header comment for why that trade-off is deliberate).
//
// `useState`'s shim matters most: Nuxt keys shared state by string so
// multiple composable calls (e.g. two components both calling
// `useTransactions()`) see the SAME ref. This shim reproduces that with
// a plain Map, and `beforeEach` clears it so state never leaks between
// tests — in the real app that persistence across calls is the point;
// in tests it would silently couple test cases together.
import { beforeEach, vi } from 'vitest'
import { ref, computed, readonly, type Ref } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', readonly)

const stateRegistry = new Map<string, Ref>()

function useState<T>(key: string, init: () => T): Ref<T> {
  if (!stateRegistry.has(key)) {
    stateRegistry.set(key, ref(init()))
  }
  return stateRegistry.get(key) as Ref<T>
}

vi.stubGlobal('useState', useState)

export const navigateToMock = vi.fn()
vi.stubGlobal('navigateTo', navigateToMock)

// Nuxt's real `defineNuxtRouteMiddleware` is an identity function at
// runtime (it exists purely so `.global.ts` middleware files get typed
// as such) — reproducing that exactly is not a simplification that
// could hide a bug, it's what the real implementation does.
vi.stubGlobal('defineNuxtRouteMiddleware', <T>(fn: T): T => fn)

beforeEach(() => {
  stateRegistry.clear()
  navigateToMock.mockClear()
  window.localStorage.clear()
})
