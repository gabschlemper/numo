// app/types/apiError.ts
//
// A forma de erro que o contrato define (ver API-CONTRACT.md,
// "Formato de erro"), como tipo de verdade.
//
// Existe agora, ainda no mundo mockado, por um motivo específico: sem
// ela, todo erro chega na UI como `Error.message` — uma string solta.
// Isso obriga a interface a tratar "categoria em uso em 34
// lançamentos" e "sem conexão" exatamente igual: um toast vermelho e
// nada mais. Com `code` e `details`, a tela consegue oferecer a saída
// certa para cada caso (reatribuir a categoria, refazer o login,
// mostrar o erro embaixo do campo que reprovou).
//
// O adaptador mock lança isto; um `ApiTransactionRepository` real vai
// traduzir o corpo JSON da resposta para exatamente isto. Nenhum
// componente ou composable precisa saber qual dos dois falou.

/** Códigos previstos no contrato. Compare com estes, nunca com a mensagem. */
export type ApiErrorCode =
  | 'validation_failed'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'internal'

export interface ApiErrorOptions {
  /** Erro por campo do formulário. Só em `validation_failed`. */
  fields?: Record<string, string>
  /** Carga específica do caso — ex.: `{ usageCount: 34 }` num `conflict`. */
  details?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly fields?: Record<string, string>
  readonly details?: Record<string, unknown>

  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(message)
    // `Error` é uma classe embutida: sem isto, `instanceof ApiError`
    // devolve false quando o TS compila para um target antigo, e o
    // `name` sai como "Error" nos logs.
    Object.setPrototypeOf(this, ApiError.prototype)
    this.name = 'ApiError'
    this.code = code
    this.fields = options.fields
    this.details = options.details
  }
}

export function isApiError(reason: unknown): reason is ApiError {
  return reason instanceof ApiError
}

/**
 * Lê um número de `details` com segurança.
 *
 * `details` é `Record<string, unknown>` de propósito — ele atravessa
 * JSON vindo do servidor, então a UI não pode assumir que o campo
 * existe nem que é número só porque o contrato diz que deveria.
 */
export function detailNumber(reason: unknown, key: string): number | null {
  if (!isApiError(reason)) return null
  const value = reason.details?.[key]
  return typeof value === 'number' ? value : null
}
