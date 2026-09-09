// app/repositories/AuthRepository.ts
//
// The PORT for authentication — same role `TransactionRepository` plays
// for transactions (see that file's header comment and ARCHITECTURE.md
// for the full rationale). No component or composable may depend on a
// concrete adapter directly; today `useAuthRepository()` wires this to
// `MockAuthRepository`, and the day a real backend exists, an
// `ApiAuthRepository implements AuthRepository` is added and swapped in
// at that single call site — nothing else in the codebase changes.
//
// `getCurrentUser` is what makes this interface ready for a real
// backend: a mock can only answer it from something it persisted
// itself (see MockAuthRepository), while a real adapter would ask the
// server to validate a session cookie/JWT — either way, the caller
// (`useAuth`'s `restoreSession`) doesn't know or care which.
import type { User, LoginCredentials, SignupData, PasswordResetRequest } from '~/types/user'

export interface AuthRepository {
  /** Null means "no active session" — never throws for that case. */
  getCurrentUser(): Promise<User | null>
  login(credentials: LoginCredentials): Promise<User>
  signup(data: SignupData): Promise<User>
  /**
   * Always resolves, whether or not the email belongs to a real
   * account — never leak account existence through this endpoint,
   * mock or real.
   */
  requestPasswordReset(request: PasswordResetRequest): Promise<void>
  logout(): Promise<void>
}
