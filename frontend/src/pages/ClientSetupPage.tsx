import { Anchor, Button, Card, Group, List, SegmentedControl, Stack, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { fetchMyClient } from '@/api'
import { ClientConfigDownloadModal } from '@/components/ClientConfigDownloadModal'
import { ErrorMessage } from '@/components/ErrorMessage'
import { useI18n } from '@/hooks/useI18n'
import { getSetupSections } from '@/pages/clientSetupData'

function detectClientOS(): string {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('windows')) return 'Windows'
  if (userAgent.includes('android')) return 'Android'
  if (/(iphone|ipad|ipod)/.test(userAgent)) return 'iOS'
  if (userAgent.includes('mac os')) return 'Mac OS'
  if (userAgent.includes('linux')) return 'Linux'
  return 'Other'
}

export function ClientSetupPage(): React.ReactElement {
  const { locale, t } = useI18n()
  const defaultOS = useMemo(() => detectClientOS(), [])
  const [activeOS, setActiveOS] = useState(defaultOS)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const setupSections = useMemo(() => getSetupSections(locale), [locale])

  const { data: client, error } = useQuery({
    queryKey: ['my-client', 'setup'],
    queryFn: () => fetchMyClient(false),
  })

  const activeCredential = client?.credentials.find((cred) => !cred.is_revoked)
  const section = setupSections.find((item) => item.key === activeOS) ?? setupSections[setupSections.length - 1]

  return (
    <Stack maw={980} mx="auto" w="100%">
      <ErrorMessage error={error} />
      <SegmentedControl
        value={activeOS}
        onChange={setActiveOS}
        fullWidth
        data={setupSections.map((item) => ({ value: item.key, label: item.label }))}
      />

      <ClientConfigDownloadModal
        opened={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        credential={activeCredential}
        isLinuxClient={activeOS === 'Linux'}
      />

      <Card withBorder p="lg">
        <Text fw={700} size="lg" mb="md">
          {section.title}
        </Text>
        <List type="ordered" spacing="xs">
          {section.steps.map((step, index) => (
            <List.Item key={`${section.key}-${index}`}>{step}</List.Item>
          ))}
        </List>
        {section.links?.length ? (
          <Group mt="md">
            {section.links.map((link) => (
              <Anchor key={link.href} href={link.href} target="_blank">
                {link.label}
              </Anchor>
            ))}
          </Group>
        ) : null}
        <Button mt="md" onClick={() => setShowDownloadModal(true)} disabled={!activeCredential}>
          {t('setupDownloadConfig')}
        </Button>
      </Card>
    </Stack>
  )
}
