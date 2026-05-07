import { Alert, Breadcrumbs, Button, Center, Loader, Stack, Text } from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'

import { fetchAdminClient, generateCredential } from '@/api'
import { ClientCard } from '@/components/ClientCard'
import { ClientCredentialCard } from '@/components/ClientCredentialCard'
import { ErrorMessage } from '@/components/ErrorMessage'
import { useI18n } from '@/hooks/useI18n'

export function AdminClientDetailPage(): React.ReactElement {
  const { t } = useI18n()
  const params = useParams<{ clientId: string }>()
  const clientId = Number(params.clientId)
  const queryClient = useQueryClient()
  const [localError, setLocalError] = useState<unknown>(null)

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['admin', 'client', clientId],
    queryFn: () => fetchAdminClient(clientId),
    enabled: Number.isFinite(clientId) && clientId > 0,
  })

  const generateMutation = useMutation({
    mutationFn: () => generateCredential(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'client', clientId] }),
    onError: setLocalError,
  })

  return (
    <Stack>
      <Breadcrumbs>
        <Link to="/admin/clients">{t('commonClients')}</Link>
        <Text>{client?.name ?? t('commonClient')}</Text>
      </Breadcrumbs>
      <ErrorMessage error={error ?? localError} />
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
          <ClientCard client={client} adminMode />
          <Text fw={700}>{t('commonCredentials')}</Text>
          {client.credentials.length === 0 ? (
            <Alert color="yellow">{t('adminClientNoCredentials')}</Alert>
          ) : (
            client.credentials.map((cred) => (
              <ClientCredentialCard key={cred.id} credential={cred} adminMode onError={setLocalError} />
            ))
          )}
          <Button loading={generateMutation.isPending} onClick={() => generateMutation.mutate()}>
            {t('adminClientGenerateCredential')}
          </Button>
        </>
      ) : null}
    </Stack>
  )
}
