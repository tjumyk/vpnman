import { Stack, Tabs, Text } from '@mantine/core'
import { IconFileText, IconRoute, IconServer, IconUsers } from '@tabler/icons-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useI18n } from '@/hooks/useI18n'

const ADMIN_TAB_VALUES = ['status', 'log', 'config', 'clients'] as const

export function AdminLayout(): React.ReactElement {
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()

  const match = location.pathname.match(/^\/admin\/([^/]+)/)
  const activeTab = match?.[1] && ADMIN_TAB_VALUES.includes(match[1] as (typeof ADMIN_TAB_VALUES)[number]) ? match[1] : 'status'

  const items: { value: (typeof ADMIN_TAB_VALUES)[number]; label: string; icon: typeof IconServer }[] = [
    { value: 'status', label: t('adminStatus'), icon: IconServer },
    { value: 'log', label: t('adminLog'), icon: IconFileText },
    { value: 'config', label: t('adminConfig'), icon: IconRoute },
    { value: 'clients', label: t('adminClients'), icon: IconUsers },
  ]

  return (
    <Stack>
      <Text fw={700} size="xl">
        {t('navAdmin')}
      </Text>
      <Tabs
        value={activeTab}
        onChange={(value) => {
          if (value) navigate(`/admin/${value}`)
        }}
      >
        <Tabs.List>
          {items.map((item) => (
            <Tabs.Tab key={item.value} value={item.value} leftSection={<item.icon size={16} />}>
              {item.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      <Outlet />
    </Stack>
  )
}
