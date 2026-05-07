import { Center, Loader, Stack } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'

import { fetchManagementLog } from '@/api'
import { ErrorMessage } from '@/components/ErrorMessage'
import { LogTable } from '@/components/LogTable'

export function AdminLogPage(): React.ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'management-log'],
    queryFn: fetchManagementLog,
  })

  return (
    <Stack>
      <ErrorMessage error={error} />
      {isLoading ? (
        <Center>
          <Loader />
        </Center>
      ) : null}
      {data ? <LogTable log={data} /> : null}
    </Stack>
  )
}
