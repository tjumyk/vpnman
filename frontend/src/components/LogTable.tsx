import { Badge, Table } from '@mantine/core'

import type { OpenVPNLogLine } from '@/api/schemas'
import { useI18n } from '@/hooks/useI18n'
import { getLogLevelColor, getMaxLogLevel } from '@/utils/logLevel'

export function LogTable({ log }: { log: OpenVPNLogLine[] }): React.ReactElement {
  const { t } = useI18n()
  return (
    <Table withTableBorder withColumnBorders striped>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t('logTableTime')}</Table.Th>
          <Table.Th>{t('logTableFlags')}</Table.Th>
          <Table.Th>{t('logTableMessage')}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {log.map((line, index) => {
          const maxLevel = getMaxLogLevel(line.flags)
          return (
            <Table.Tr key={`${line.time}-${index}`}>
              <Table.Td style={{ whiteSpace: 'nowrap' }}>{new Date(line.time * 1000).toLocaleString()}</Table.Td>
              <Table.Td>
                <Badge color={getLogLevelColor(maxLevel)} variant="light">
                  {line.flags}
                </Badge>
              </Table.Td>
              <Table.Td style={{ wordBreak: 'break-all' }}>{line.message}</Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}
