import { describe, expect, it } from 'vitest'
import { useTransactionRepository } from '~/composables/useTransactionRepository'
import { MockTransactionRepository } from '~/repositories/MockTransactionRepository'

describe('useTransactionRepository', () => {
  it('returns a MockTransactionRepository instance', () => {
    expect(useTransactionRepository()).toBeInstanceOf(MockTransactionRepository)
  })

  it('returns the same singleton instance on every call', () => {
    expect(useTransactionRepository()).toBe(useTransactionRepository())
  })
})
