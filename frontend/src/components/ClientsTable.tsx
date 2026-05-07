import { Badge, Group, Table } from '@mantine/core'
import { Link } from 'react-router-dom'

import type { Client } from '@/api/schemas'
import { useI18n } from '@/hooks/useI18n'

export function ClientsTable({ clients }: { clients: Client[] }): React.ReactElement {
  const { t } = useI18n()
  return (
    <Table withTableBorder withColumnBorders striped>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>#</Table.Th>
          <Table.Th>{t('commonId')}</Table.Th>
          <Table.Th>{t('clientsTableUserId')}</Table.Th>
          <Table.Th>{t('commonName')}</Table.Th>
          <Table.Th>{t('commonEmail')}</Table.Th>
          <Table.Th>{t('commonCreatedAt')}</Table.Th>
          <Table.Th>{t('commonUpdatedAt')}</Table.Th>
          <Table.Th>{t('commonCredentials')}</Table.Th>
          <Table.Th>{t('clientsTableOperations')}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {clients.map((client, index) => {
          const revoked = client.credentials.filter((cred) => cred.is_revoked).length
          const available = client.credentials.length - revoked
          const color = available > 0 ? 'green' : revoked > 0 ? 'red' : 'gray'
          return (
            <Table.Tr key={client.id}>
              <Table.Td>{index + 1}</Table.Td>
              <Table.Td>{client.id}</Table.Td>
              <Table.Td>{client.user_id}</Table.Td>
              <Table.Td>{client.name}</Table.Td>
              <Table.Td>{client.email}</Table.Td>
              <Table.Td>{new Date(client.created_at).toLocaleString()}</Table.Td>
              <Table.Td>{new Date(client.modified_at).toLocaleString()}</Table.Td>
              <Table.Td>
                <Badge color={color} variant="light">
                  {t('clientsTableSummary', { total: client.credentials.length, available, revoked })}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group>
                  <Link to={`/admin/clients/${client.id}`}>{t('commonView')}</Link>
                </Group>
              </Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}
