import { describe, expect, it } from 'vitest'
import { useAuthRepository } from '~/composables/useAuthRepository'
import { MockAuthRepository } from '~/repositories/MockAuthRepository'

describe('useAuthRepository', () => {
  it('returns a MockAuthRepository instance', () => {
    expect(useAuthRepository()).toBeInstanceOf(MockAuthRepository)
  })

  it('returns the same singleton instance on every call', () => {
    expect(useAuthRepository()).toBe(useAuthRepository())
  })
})
