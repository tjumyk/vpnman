import axios, { isAxiosError, type AxiosInstance } from 'axios'

import { basicErrorSchema, type BasicError } from '@/api/schemas'

export type AxiosErrorWithBasic = Error & { basicError?: BasicError }

export const apiClient: AxiosInstance = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export function isOAuthLoginRedirectError(err: unknown): boolean {
  if (!isAxiosError(err)) return false
  const data = err.response?.data
  if (err.response?.status !== 401 || !data || typeof data !== 'object') return false
  const redirectUrl = (data as { redirect_url?: unknown }).redirect_url
  return typeof redirectUrl === 'string' && redirectUrl.length > 0
}

apiClient.interceptors.response.use(
  async (response) => response,
  async (error: unknown) => {
    if (isOAuthLoginRedirectError(error) && isAxiosError(error)) {
      const redirectUrl = (error.response?.data as { redirect_url: string }).redirect_url
      window.location.href = redirectUrl
      return Promise.reject(error)
    }

    if (isAxiosError(error) && error.response?.data !== undefined) {
      const parsed = basicErrorSchema.safeParse(error.response.data)
      if (parsed.success) {
        ;(error as AxiosErrorWithBasic).basicError = parsed.data
      }
    }
    return Promise.reject(error)
  },
)

export function getBasicErrorFromUnknown(err: unknown): BasicError | null {
  if (isAxiosError(err) && (err as AxiosErrorWithBasic).basicError) {
    return (err as AxiosErrorWithBasic).basicError ?? null
  }
  if (isAxiosError(err) && err.response?.data !== undefined) {
    const parsed = basicErrorSchema.safeParse(err.response.data)
    return parsed.success ? parsed.data : null
  }
  return null
}
