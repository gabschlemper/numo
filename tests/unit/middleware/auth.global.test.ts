// The middleware itself only needs to know two things: whether there's
// a session, and whether the target route is public. Both come from the
// auto-imported `useAuth()`, so this test stubs that global with a tiny
// fake (isAuthenticated + a no-op restoreSession) rather than pulling in
// the real composable/repository — `useAuth`'s own behavior is already
// covered by useAuth.test.ts, and this file's only job is the routing
// decision, not the session logic behind it.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import authMiddleware from '~/middleware/auth.global'
import { navigateToMock } from '../../setup'

function stubAuth(isAuthenticated: boolean) {
  vi.stubGlobal('useAuth', () => ({
    isAuthenticated: { value: isAuthenticated },
    restoreSession: vi.fn().mockResolvedValue(undefined)
  }))
}

function toRoute(path: string) {
  return { path } as Parameters<typeof authMiddleware>[0]
}

describe('auth.global middleware', () => {
  beforeEach(() => {
    stubAuth(false)
  })

  it('sends an unauthenticated visitor to /login for a protected route', async () => {
    stubAuth(false)
    await authMiddleware(toRoute('/transactions'), toRoute('/transactions'))
    expect(navigateToMock).toHaveBeenCalledWith('/login')
  })

  it('lets an unauthenticated visitor stay on a public route', async () => {
    stubAuth(false)
    await authMiddleware(toRoute('/login'), toRoute('/login'))
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('sends an authenticated user away from the public auth routes', async () => {
    stubAuth(true)
    await authMiddleware(toRoute('/signup'), toRoute('/signup'))
    expect(navigateToMock).toHaveBeenCalledWith('/transactions')
  })

  it('lets an authenticated user stay on a protected route', async () => {
    stubAuth(true)
    await authMiddleware(toRoute('/transactions'), toRoute('/transactions'))
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it.each(['/login', '/signup', '/forgot-password'])('treats %s as a public route', async (path) => {
    stubAuth(false)
    await authMiddleware(toRoute(path), toRoute(path))
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
