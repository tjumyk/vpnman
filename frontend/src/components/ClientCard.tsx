import { Anchor, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core'

import type { Client } from '@/api/schemas'
import { useI18n } from '@/hooks/useI18n'

function Field({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <Stack gap={0}>
      <Text fw={700} size="sm">
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </Stack>
  )
}

export function ClientCard({ client, adminMode = false }: { client: Client; adminMode?: boolean }): React.ReactElement {
  const { t } = useI18n()
  return (
    <Card withBorder>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        <Field label={t('commonId')} value={client.id} />
        <Field label={t('commonName')} value={client.name} />
        <Field label={t('commonEmail')} value={client.email || t('commonNA')} />
        <Field label={t('commonCreatedAt')} value={new Date(client.created_at).toLocaleString()} />
        <Field label={t('commonUpdatedAt')} value={new Date(client.modified_at).toLocaleString()} />
      </SimpleGrid>
      {adminMode && client.user_id > 0 ? (
        <Group justify="flex-end" mt="sm">
          <Anchor href={`/admin/users/${client.user_id}`} target="_blank">
            {t('commonProfile')}
          </Anchor>
        </Group>
      ) : null}
    </Card>
  )
}
