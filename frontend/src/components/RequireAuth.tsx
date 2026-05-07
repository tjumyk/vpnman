import { Center, Loader } from '@mantine/core'
import { Navigate } from 'react-router-dom'

import { isOAuthLoginRedirectError } from '@/api/client'
import { ErrorMessage } from '@/components/ErrorMessage'
import { useAuthUser } from '@/hooks/useAuthUser'

export function RequireAuth({ children }: { children: React.ReactNode }): React.ReactElement {
  const { isLoading, error, data } = useAuthUser()

  if (isLoading) {
    return (
      <Center mt="xl">
        <Loader />
      </Center>
    )
  }

  if (error || !data) {
    if (isOAuthLoginRedirectError(error)) {
      return (
        <Center mt="xl">
          <Loader />
        </Center>
      )
    }
    return (
      <>
        <ErrorMessage error={error} />
        <Navigate to="/forbidden" replace />
      </>
    )
  }

  return <>{children}</>
}
