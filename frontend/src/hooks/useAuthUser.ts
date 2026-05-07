import { useQuery } from '@tanstack/react-query'

import { fetchCurrentUser, isAdminUser } from '@/api'

export function useAuthUser() {
  return useQuery({
    queryKey: ['account', 'me'],
    queryFn: fetchCurrentUser,
  })
}

export { isAdminUser }
