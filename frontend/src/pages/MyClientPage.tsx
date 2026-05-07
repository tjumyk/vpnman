import { Alert, Center, Loader, Stack, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'

import { fetchMyClient } from '@/api'
import { ClientCard } from '@/components/ClientCard'
import { ClientCredentialCard } from '@/components/ClientCredentialCard'
import { ErrorMessage } from '@/components/ErrorMessage'
import { useI18n } from '@/hooks/useI18n'

export function MyClientPage(): React.ReactElement {
  const { t } = useI18n()
  const { data: client, isLoading, error } = useQuery({
    queryKey: ['my-client', 'details'],
    queryFn: () => fetchMyClient(true),
  })

  return (
    <Stack>
      <ErrorMessage error={error} />
      {isLoading ? (
        <Center>
          <Loader />
        </Center>
      ) : null}

      {client ? (
        <>
          <Text fw={700} size="xl">
            {client.name}
          </Text>
          <ClientCard client={client} />
          <Text fw={700}>{t('commonCredentials')}</Text>
          {client.credentials.length === 0 ? (
            <Alert color="yellow">{t('myClientNoCredentials')}</Alert>
          ) : (
            client.credentials.map((cred) => <ClientCredentialCard key={cred.id} credential={cred} />)
          )}
        </>
      ) : null}
    </Stack>
  )
}
