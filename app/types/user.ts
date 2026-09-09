// app/types/user.ts
//
// Domain model for authentication. Deliberately tiny — this prototype's
// only concern is proving out the login/signup/forgot-password/logout
// flows end to end with a mock, not modeling a full account system
// (roles, shared-wallet membership between Gabi and Malu, etc. come
// later — see ARCHITECTURE.md). Nothing here knows about HTTP,
// passwords-at-rest, or localStorage; that separation is what lets
// `AuthRepository` (the port) and its adapters vary independently of
// the domain (Dependency Inversion), exactly like `Transaction` and
// `TransactionRepository`.

export interface User {
  readonly id: string
  name: string
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
}

export interface PasswordResetRequest {
  email: string
}
