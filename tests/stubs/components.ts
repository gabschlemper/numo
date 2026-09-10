// tests/stubs/components.ts
//
// Stands in for Nuxt's virtual `#components` module, which only
// exists inside a Nuxt build. `vitest.config.ts` aliases `#components`
// here.
//
// Each component is exported as its own NAME, a plain string. That's
// deliberate, not a shortcut: `h('UBadge', props, slot)` produces a
// vnode with exactly the same `props` and `children` as
// `h(RealUBadge, props, slot)` would, so the column tests can assert
// on what a cell renders — which colour the badge gets, which handler
// the button is wired to — without mounting Vue, booting Nuxt or
// compiling `@nuxt/ui`'s SFCs. What they cannot assert on is how the
// real component renders those props, which is @nuxt/ui's own
// responsibility and already tested there.
//
// (This is also the shape `resolveComponent` used to fall back to
// when it failed to resolve these names at runtime — the difference
// being that it did so in the browser too, which is the bug the
// `#components` import fixed. See `useTransactionColumns.ts`.)
export const UButton = 'UButton'
export const UBadge = 'UBadge'
export const UCheckbox = 'UCheckbox'
