import { describe, expect, it } from 'vitest'
import { errorMessage, flattenApiErrors } from './api'

describe('API errors', () => {
  it('reads the message with a fallback', () => {
    expect(errorMessage({ message: 'Nope' })).toBe('Nope')
    expect(errorMessage({}, 'Failed to sell gold.')).toBe('Failed to sell gold.')
    expect(errorMessage(null)).toBe('Something went wrong.')
  })

  it('flattens Laravel validation errors to the first message per field', () => {
    expect(flattenApiErrors({ message: 'x', errors: { amount: ['Too much.', 'Other'] } })).toEqual({ amount: 'Too much.' })
    expect(flattenApiErrors({ message: 'x' })).toBeNull()
  })
})
