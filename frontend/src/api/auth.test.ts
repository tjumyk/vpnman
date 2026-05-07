import { describe, expect, it } from 'vitest'

import { isAdminUser } from '@/api'
import { isOAuthLoginRedirectError } from '@/api/client'

describe('auth helpers', () => {
  it('detects admin group', () => {
    expect(
      isAdminUser({
        groups: [{ name: 'user' }, { name: 'admin' }],
      }),
    ).toBe(true)
    expect(
      isAdminUser({
        groups: [{ name: 'user' }],
      }),
    ).toBe(false)
  })

  it('detects oauth redirect error payload', () => {
    const err = {
      isAxiosError: true,
      response: {
        status: 401,
        data: { redirect_url: '/oauth/login' },
      },
    }
    expect(isOAuthLoginRedirectError(err)).toBe(true)
  })
})
