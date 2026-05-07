import dayjs from 'dayjs'

import type { ClientCredential } from '@/api/schemas'

export function getCredentialValidityState(credential: ClientCredential): {
  isInvalid: boolean
  isBeforeValidity: boolean
  isExpired: boolean
} {
  if (!credential.cert || !credential.pkey) {
    return { isInvalid: true, isBeforeValidity: false, isExpired: false }
  }

  const now = dayjs()
  const start = dayjs(credential.cert.validity_start)
  const end = dayjs(credential.cert.validity_end)
  const isBeforeValidity = start.isAfter(now)
  const isExpired = end.isBefore(now)
  return {
    isBeforeValidity,
    isExpired,
    isInvalid: isBeforeValidity || isExpired,
  }
}
