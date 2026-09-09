// app/composables/useAuth.ts
//
// Single responsibility: own the current session and the actions that
// change it, against the `AuthRepository` interface — same shape as
// `useTransactions` (shared `run()` loading/error wrapper, state kept
// in `useState` so every component sees the same session). This
// composable knows nothing about which page to redirect to after
// login/logout or which routes are public — that's `middleware/auth.
// global.ts`'s job, kept separate so "how sessions work" never risks
// breaking "which routes require one" (Single Responsibility).
import type { User, LoginCredentials, SignupData, PasswordResetRequest } from '~/types/user'

export function useAuth() {
  const repository = useAuthRepository()

  const user = useState<User | null>('numo-auth-user', () => null)
  const loading = useState<boolean>('numo-auth-loading', () => false)
  const error = useState<string | null>('numo-auth-error', () => null)
  // Session restoration only needs to run once per app load — after
  // that, `user` in memory is the source of truth, so repeated
  // middleware runs on every navigation don't re-hit the repository.
  const restored = useState<boolean>('numo-auth-restored', () => false)

  const isAuthenticated = computed(() => user.value !== null)

  async function run<T>(action: () => Promise<T>): Promise<T> {
    loading.value = true
    error.value = null
    try {
      return await action()
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : 'Não foi possível concluir a ação.'
      throw reason
    } finally {
      loading.value = false
    }
  }

  /** Idempotent and safe to call from middleware on every navigation. */
  async function restoreSession(): Promise<void> {
    if (restored.value) return
    try {
      user.value = await repository.getCurrentUser()
    } catch {
      // A broken session check is treated the same as "not logged
      // in" — never blocks navigation, the middleware just sends the
      // user to /login as if there were no session at all.
      user.value = null
    } finally {
      restored.value = true
    }
  }

  async function login(credentials: LoginCredentials): Promise<User> {
    return run(async () => {
      const loggedInUser = await repository.login(credentials)
      user.value = loggedInUser
      return loggedInUser
    })
  }

  async function signup(data: SignupData): Promise<User> {
    return run(async () => {
      const createdUser = await repository.signup(data)
      user.value = createdUser
      return createdUser
    })
  }

  async function requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    await run(() => repository.requestPasswordReset(request))
  }

  async function logout(): Promise<void> {
    await run(async () => {
      await repository.logout()
      user.value = null
    })
  }

  // `error` is shared state (`useState`), so it survives across pages —
  // without this, a failed login and then a click over to "Criar
  // conta" would show the *login* error on the signup page until the
  // signup form was itself submitted. Each auth page calls this once
  // on setup so it never inherits another page's stale error.
  function clearError(): void {
    error.value = null
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated,
    restoreSession,
    login,
    signup,
    requestPasswordReset,
    logout,
    clearError
  }
}
