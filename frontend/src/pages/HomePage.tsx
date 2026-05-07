import { Alert, Anchor, Button, Card, Center, Grid, Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core'
import { IconCircleCheck, IconCircleX, IconDownload, IconSettings, IconUser } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { fetchMyClient, fetchServerStatus } from '@/api'
import { ClientConfigDownloadModal } from '@/components/ClientConfigDownloadModal'
import { ErrorMessage } from '@/components/ErrorMessage'
import { isAdminUser, useAuthUser } from '@/hooks/useAuthUser'
import { useI18n } from '@/hooks/useI18n'

export function HomePage(): React.ReactElement {
  const { t } = useI18n()
  const { data: user } = useAuthUser()
  const { data: client, isLoading: loadingClient, error: clientError } = useQuery({
    queryKey: ['my-client', 'home'],
    queryFn: () => fetchMyClient(false),
  })
  const { data: serverStatus, isLoading: loadingServerStatus } = useQuery({
    queryKey: ['server-status'],
    queryFn: fetchServerStatus,
  })

  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadLinux, setDownloadLinux] = useState(false)

  const activeCredential = useMemo(() => client?.credentials.find((cred) => !cred.is_revoked), [client])

  return (
    <Stack>
      <ErrorMessage error={clientError} />
      <ClientConfigDownloadModal
        opened={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        credential={activeCredential}
        isLinuxClient={downloadLinux}
      />

      {loadingClient ? (
        <Center>
          <Loader />
        </Center>
      ) : null}

      {client && activeCredential ? (
        <SimpleGrid cols={{ base: 1, md: 2, xl: 4 }}>
          <Card withBorder>
            <Text fw={700}>{t('homeLinuxConfigTitle')}</Text>
            <Text size="sm" c="dimmed" mb="md">
              {t('homeLinuxConfigDesc')}
            </Text>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={() => {
                setDownloadLinux(true)
                setShowDownloadModal(true)
              }}
            >
              {t('commonDownload')}
            </Button>
          </Card>
          <Card withBorder>
            <Text fw={700}>{t('homeOtherConfigTitle')}</Text>
            <Text size="sm" c="dimmed" mb="md">
              {t('homeOtherConfigDesc')}
            </Text>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={() => {
                setDownloadLinux(false)
                setShowDownloadModal(true)
              }}
            >
              {t('commonDownload')}
            </Button>
          </Card>
          <Card withBorder>
            <Text fw={700}>{t('homeSetupGuideTitle')}</Text>
            <Text size="sm" c="dimmed" mb="md">
              {t('homeSetupGuideDesc')}
            </Text>
            <Button component={Link} to="/client-setup" variant="light">
              {t('homeSetupGuideAction')}
            </Button>
          </Card>
          <Card withBorder>
            <Text fw={700}>{t('homeMyClientTitle')}</Text>
            <Text size="sm" c="dimmed" mb="md">
              {t('homeMyClientDesc')}
            </Text>
            <Button component={Link} to="/my-client" variant="light">
              {t('homeMyClientAction')}
            </Button>
          </Card>
        </SimpleGrid>
      ) : client ? (
        <Alert color="yellow" title={t('homeNoCredentialsTitle')}>
          {t('homeNoCredentialsBody')}
        </Alert>
      ) : null}

      {loadingServerStatus ? (
        <Text c="dimmed">{t('homeCheckingServerStatus')}</Text>
      ) : serverStatus ? (
        <Alert
          color={serverStatus.online ? 'green' : 'red'}
          icon={serverStatus.online ? <IconCircleCheck size={16} /> : <IconCircleX size={16} />}
        >
          {serverStatus.online ? t('homeServerOnline') : t('homeServerOffline')}
        </Alert>
      ) : null}

      {user ? (
        <Grid>
          <Grid.Col span={12}>
            <Group>
              <Button component="a" href="/account/profile" variant="default" leftSection={<IconUser size={16} />}>
                {user.nickname || user.name}
              </Button>
              {isAdminUser(user) ? (
                <Button component={Link} to="/admin" variant="default" leftSection={<IconSettings size={16} />}>
                  {t('homeManagement')}
                </Button>
              ) : null}
            </Group>
          </Grid.Col>
        </Grid>
      ) : null}

      <Anchor component={Link} to="/my-client">
        {t('homeGoMyClient')}
      </Anchor>
    </Stack>
  )
}
