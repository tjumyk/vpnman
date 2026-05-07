import { ActionIcon, Alert, Card, Center, Group, Loader, Stack, Table, Text } from '@mantine/core'
import { IconPlugConnectedX, IconSettings } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchManagementInfo, killManagementClient } from '@/api'
import { ErrorMessage } from '@/components/ErrorMessage'
import { useI18n } from '@/hooks/useI18n'

type OpenVPNClientWithDbClient = {
  _db_client_id?: number
}

export function AdminStatusPage(): React.ReactElement {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [localError, setLocalError] = useState<unknown>(null)
  const { data: info, isLoading, error } = useQuery({
    queryKey: ['admin', 'management-info'],
    queryFn: fetchManagementInfo,
  })

  const killMutation = useMutation({
    mutationFn: (clientId: number) => killManagementClient(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'management-info'] }),
    onError: setLocalError,
  })

  return (
    <Stack>
      <ErrorMessage error={error ?? localError} />
      {isLoading ? (
        <Center>
          <Loader />
        </Center>
      ) : null}
      {info ? (
        <>
          <Card withBorder>
            <Text fw={700}>{t('adminStatusVersion', { version: info.version.openvpn })}</Text>
            <Text size="sm">{t('adminStatusState', { state: info.state?.state ?? t('adminStatusUnknown') })}</Text>
            <Text size="sm">
              {t('adminStatusUpdatedAt', {
                time: info.state ? new Date(info.state.time * 1000).toLocaleString() : t('commonNA'),
              })}
            </Text>
            <Text size="sm">{t('adminStatusServerIp', { ip: info.state?.local_ip ?? t('commonNA') })}</Text>
            <Text size="sm">{t('adminStatusBytesIn', { value: info.load_stats.bytesin })}</Text>
            <Text size="sm">{t('adminStatusBytesOut', { value: info.load_stats.bytesout })}</Text>
            <Text size="sm">{t('adminStatusClients', { value: info.load_stats.nclients })}</Text>
          </Card>

          {info.status.client_list?.length ? (
            <Table withTableBorder withColumnBorders striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>{t('adminStatusCommonName')}</Table.Th>
                  <Table.Th>{t('adminStatusRealAddress')}</Table.Th>
                  <Table.Th>{t('adminStatusVirtualAddress')}</Table.Th>
                  <Table.Th>{t('adminStatusBytesReceived')}</Table.Th>
                  <Table.Th>{t('adminStatusBytesSent')}</Table.Th>
                  <Table.Th>{t('adminStatusConnectedSince')}</Table.Th>
                  <Table.Th>{t('adminStatusClientId')}</Table.Th>
                  <Table.Th>{t('commonActions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {info.status.client_list.map((client, index) => {
                  const withExtra = client as typeof client & OpenVPNClientWithDbClient
                  const dbClientId = withExtra._db_client_id
                  return (
                    <Table.Tr key={`${client.client_id}-${client.peer_id}`}>
                      <Table.Td>{index + 1}</Table.Td>
                      <Table.Td>{client.common_name}</Table.Td>
                      <Table.Td>{client.real_address}</Table.Td>
                      <Table.Td>{client.virtual_address}</Table.Td>
                      <Table.Td>{client.bytes_received}</Table.Td>
                      <Table.Td>{client.bytes_sent}</Table.Td>
                      <Table.Td>{new Date(client.connected_since * 1000).toLocaleString()}</Table.Td>
                      <Table.Td>{client.client_id}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {dbClientId ? (
                            <ActionIcon component={Link} to={`/admin/clients/${dbClientId}`} variant="light" color="blue">
                              <IconSettings size={16} />
                            </ActionIcon>
                          ) : null}
                          <ActionIcon
                            variant="light"
                            color="red"
                            loading={killMutation.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  t('adminStatusKillConfirm', { name: client.common_name, id: client.client_id }),
                                )
                              ) {
                                killMutation.mutate(client.client_id)
                              }
                            }}
                          >
                            <IconPlugConnectedX size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          ) : (
            <Alert>{t('adminStatusNoClients')}</Alert>
          )}
        </>
      ) : null}
    </Stack>
  )
}
