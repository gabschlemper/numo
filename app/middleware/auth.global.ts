// app/middleware/auth.global.ts
//
// The only place in the codebase that knows which routes require a
// session and where to send people who don't have one — deliberately
// kept out of `useAuth` (see that file's header comment) and out of
// individual pages, so adding a new protected page later is "add its
// path here if it's public, otherwise it's protected by default" and
// nothing else.
//
// `.global.ts` makes Nuxt run this on every navigation automatically —
// no `definePageMeta({ middleware: ... })` needed on individual pages.
const PUBLIC_ROUTES = new Set(['/login', '/signup', '/forgot-password'])

export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, restoreSession } = useAuth()
  await restoreSession()

  const isPublicRoute = PUBLIC_ROUTES.has(to.path)

  if (!isAuthenticated.value && !isPublicRoute) {
    return navigateTo('/login')
  }

  // Signed-in users don't need to see the login/signup/forgot-password
  // screens again — send them straight to the app instead.
  if (isAuthenticated.value && isPublicRoute) {
    return navigateTo('/transactions')
  }
})
