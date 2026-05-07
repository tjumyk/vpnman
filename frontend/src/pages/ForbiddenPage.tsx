import { Button, Center, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'

import { useI18n } from '@/hooks/useI18n'

export function ForbiddenPage(): React.ReactElement {
  const { t } = useI18n()
  return (
    <Center h="70vh">
      <Stack align="center">
        <Title order={2}>{t('forbidden')}</Title>
        <Text c="dimmed">{t('forbiddenDescription')}</Text>
        <Button component={Link} to="/">
          Go Home
        </Button>
      </Stack>
    </Center>
  )
}
