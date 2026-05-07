import { Badge, Button, Card, Group, SimpleGrid, Stack, Table, Text } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { revokeCredential, unrevokeCredential } from '@/api'
import type { ClientCredential } from '@/api/schemas'
import { useI18n } from '@/hooks/useI18n'
import { getCredentialValidityState } from '@/utils/credentialValidity'

function MetaField({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <Stack gap={0}>
      <Text fw={700} size="sm">
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </Stack>
  )
}

export function ClientCredentialCard({
  credential,
  adminMode = false,
  onError,
}: {
  credential: ClientCredential
  adminMode?: boolean
  onError?: (error: unknown) => void
}): React.ReactElement {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const validity = getCredentialValidityState(credential)

  const revokeMutation = useMutation({
    mutationFn: () => revokeCredential(credential.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-client'] })
      queryClient.invalidateQueries({ queryKey: ['admin-client'] })
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] })
    },
    onError,
  })

  const unrevokeMutation = useMutation({
    mutationFn: () => unrevokeCredential(credential.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-client'] })
      queryClient.invalidateQueries({ queryKey: ['admin-client'] })
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] })
    },
    onError,
  })

  const statusColor = credential.is_revoked ? 'red' : validity.isInvalid ? 'yellow' : 'green'

  return (
    <Card withBorder>
      <Group justify="space-between" mb="sm">
        <Text fw={700}>{t('credentialCardTitle', { id: credential.id })}</Text>
        <Badge color={statusColor} variant="light">
          {credential.is_revoked
            ? t('credentialStatusRevoked')
            : validity.isInvalid
              ? t('credentialStatusInvalid')
              : t('credentialStatusAvailable')}
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        <MetaField label={t('commonId')} value={credential.id} />
        <MetaField label={t('credentialIsRevoked')} value={credential.is_revoked ? t('commonYes') : t('commonNo')} />
        <MetaField label={t('credentialRevokedAt')} value={credential.revoked_at || t('commonNA')} />
        <MetaField label={t('credentialIsImported')} value={credential.is_imported ? t('commonYes') : t('commonNo')} />
        <MetaField label={t('commonCreatedAt')} value={new Date(credential.created_at).toLocaleString()} />
        <MetaField label={t('commonUpdatedAt')} value={new Date(credential.modified_at).toLocaleString()} />
      </SimpleGrid>

      <Text fw={700} mt="md" mb="xs">
        {t('credentialCertificate')}
      </Text>
      {credential.cert ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          <MetaField label={t('credentialVersion')} value={credential.cert.version} />
          <MetaField label={t('credentialSerialNumber')} value={credential.cert.serial_number} />
          <MetaField label={t('credentialValidityStart')} value={new Date(credential.cert.validity_start).toLocaleString()} />
          <MetaField label={t('credentialValidityEnd')} value={new Date(credential.cert.validity_end).toLocaleString()} />
          <MetaField label={t('credentialSignatureAlgorithm')} value={credential.cert.signature_algorithm} />
          <MetaField label={t('credentialPublicKeyType')} value={credential.cert.public_key.type} />
          <MetaField label={t('credentialPublicKeyBits')} value={credential.cert.public_key.bits} />
        </SimpleGrid>
      ) : (
        <Text c="dimmed">{t('credentialNoCertificate')}</Text>
      )}

      {credential.cert?.extensions?.length ? (
        <Table withTableBorder withColumnBorders mt="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('credentialExtension')}</Table.Th>
              <Table.Th>{t('credentialExtensionValue')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {credential.cert.extensions.map((ext, index) => (
              <Table.Tr key={`${ext.name}-${index}`}>
                <Table.Td>{ext.name}</Table.Td>
                <Table.Td>{ext.text}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : null}

      <Text fw={700} mt="md" mb="xs">
        {t('commonActions')}
      </Text>
      <Group>
        {adminMode ? (
          <>
            <Button component="a" href={`/api/admin/credentials/${credential.id}/export-config?linux=true`} variant="light">
              {t('credentialDownloadLinuxConfig')}
            </Button>
            <Button component="a" href={`/api/admin/credentials/${credential.id}/export-config`} variant="light">
              {t('credentialDownloadOtherConfig')}
            </Button>
            {credential.is_revoked ? (
              <Button color="yellow" loading={unrevokeMutation.isPending} onClick={() => unrevokeMutation.mutate()}>
                {t('credentialUnrevoke')}
              </Button>
            ) : (
              <Button color="red" loading={revokeMutation.isPending} onClick={() => revokeMutation.mutate()}>
                {t('credentialRevoke')}
              </Button>
            )}
          </>
        ) : !credential.is_revoked && !validity.isInvalid ? (
          <>
            <Button component="a" href={`/api/my-credentials/${credential.id}/export-config?linux=true`} variant="light">
              {t('credentialDownloadLinuxConfig')}
            </Button>
            <Button component="a" href={`/api/my-credentials/${credential.id}/export-config`} variant="light">
              {t('credentialDownloadOtherConfig')}
            </Button>
          </>
        ) : (
          <Text c="dimmed" size="sm">
            {t('credentialUnavailable')}
          </Text>
        )}
      </Group>
    </Card>
  )
}
