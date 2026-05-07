import { Navigate } from 'react-router-dom'

import { isAdminUser, useAuthUser } from '@/hooks/useAuthUser'

export function RequireAdmin({ children }: { children: React.ReactNode }): React.ReactElement {
  const { data } = useAuthUser()
  if (!data || !isAdminUser(data)) {
    return <Navigate to="/forbidden" replace />
  }
  return <>{children}</>
}
