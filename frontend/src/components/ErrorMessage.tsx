import { Alert } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

import { getBasicErrorFromUnknown } from '@/api/client'
import { useI18n } from '@/hooks/useI18n'

export function ErrorMessage({ error }: { error: unknown }): React.ReactElement | null {
  const { t } = useI18n()
  if (!error) return null

  const basic = getBasicErrorFromUnknown(error)
  const message = basic ? `${basic.msg}${basic.detail ? `: ${basic.detail}` : ''}` : String(error)

  return (
    <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md" title={t('errorTitle')}>
      {message}
    </Alert>
  )
}
