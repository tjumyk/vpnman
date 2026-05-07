import { describe, expect, it } from 'vitest'

import type { ClientCredential } from '@/api/schemas'
import { getCredentialValidityState } from '@/utils/credentialValidity'

function buildCredential(start: string, end: string): ClientCredential {
  return {
    id: 1,
    client_id: 1,
    is_revoked: false,
    revoked_at: '',
    is_imported: false,
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
    cert: {
      version: 3,
      subject: { CN: 'test' },
      issuer: { CN: 'ca' },
      serial_number: '1',
      validity_start: start,
      validity_end: end,
      signature_algorithm: 'sha256',
      extensions: [],
      public_key: { type: 'rsa', bits: 2048 },
    },
    pkey: { type: 'rsa', bits: 2048 },
  }
}

describe('credential validity', () => {
  it('detects expired cert', () => {
    const cred = buildCredential('2020-01-01T00:00:00Z', '2020-01-02T00:00:00Z')
    const result = getCredentialValidityState(cred)
    expect(result.isExpired).toBe(true)
    expect(result.isInvalid).toBe(true)
  })

  it('detects before validity', () => {
    const now = Date.now()
    const cred = buildCredential(new Date(now + 3600_000).toISOString(), new Date(now + 7200_000).toISOString())
    const result = getCredentialValidityState(cred)
    expect(result.isBeforeValidity).toBe(true)
    expect(result.isInvalid).toBe(true)
  })
})
