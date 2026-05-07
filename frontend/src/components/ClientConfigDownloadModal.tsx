import { Alert, Button, List, Modal, Stack, Text } from '@mantine/core'
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react'

import type { ClientCredential } from '@/api/schemas'
import { useI18n } from '@/hooks/useI18n'

export function ClientConfigDownloadModal({
  opened,
  onClose,
  credential,
  isLinuxClient,
}: {
  opened: boolean
  onClose: () => void
  credential?: ClientCredential
  isLinuxClient: boolean
}): React.ReactElement {
  const { t } = useI18n()
  const href = credential
    ? isLinuxClient
      ? `/api/my-credentials/${credential.id}/export-config?linux=true`
      : `/api/my-credentials/${credential.id}/export-config`
    : undefined

  return (
    <Modal opened={opened} onClose={onClose} title={t('downloadModalTitle')} centered>
      <Stack>
        <Text size="sm" c="dimmed">
          {isLinuxClient ? t('downloadModalForLinux') : t('downloadModalForNonLinux')}
        </Text>
        <List spacing="xs">
          <List.Item icon={<IconAlertTriangle size={16} color="orange" />}>
            {t('downloadModalRule1')}
          </List.Item>
          <List.Item icon={<IconAlertTriangle size={16} color="orange" />}>
            {t('downloadModalRule2')}
          </List.Item>
          <List.Item icon={<IconCheck size={16} color="green" />}>
            {t('downloadModalRule3')}
          </List.Item>
          <List.Item icon={<IconCheck size={16} color="green" />}>
            {t('downloadModalRule4')}
          </List.Item>
        </List>
        {isLinuxClient ? (
          <Alert color="red">{t('downloadModalLinuxAlert')}</Alert>
        ) : (
          <Alert color="green">{t('downloadModalOtherAlert')}</Alert>
        )}
        <Button variant="default" onClick={onClose}>
          {t('commonCancel')}
        </Button>
        <Button component="a" href={href} onClick={onClose} disabled={!credential}>
          {t('downloadModalConfirm')}
        </Button>
      </Stack>
    </Modal>
  )
}
