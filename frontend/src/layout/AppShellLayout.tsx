import {
  AppShell,
  Avatar,
  Box,
  Burger,
  Group,
  Menu,
  NavLink,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { IconAdjustments, IconHome, IconSettings, IconUser } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { fetchVersion } from '@/api'
import { QueryProgressIndicator } from '@/components/QueryProgressIndicator'
import { ThemeLocaleToolbar } from '@/components/ThemeLocaleToolbar'
import { isAdminUser, useAuthUser } from '@/hooks/useAuthUser'
import { useI18n } from '@/hooks/useI18n'

export function AppShellLayout(): React.ReactElement {
  const { t } = useI18n()
  const [opened, { toggle, close }] = useDisclosure(false)
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 36em)')
  const { data: user } = useAuthUser()
  const { data: version } = useQuery({ queryKey: ['version'], queryFn: fetchVersion })

  const links = useMemo(
    () => [
      { to: '/', label: t('navHome'), icon: IconHome },
      { to: '/client-setup', label: t('navClientSetup'), icon: IconAdjustments },
      { to: '/my-client', label: t('navMyClient'), icon: IconUser },
      ...(user && isAdminUser(user) ? [{ to: '/admin', label: t('navAdmin'), icon: IconSettings }] : []),
    ],
    [t, user],
  )

  const displayName = user ? user.nickname || user.name : ''
  const logoSrc = `${import.meta.env.BASE_URL}logo-256.png`

  return (
    <AppShell
      navbar={{ width: 320, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      header={{ height: 56 }}
      footer={{ height: 34 }}
      padding="md"
    >
      <AppShell.Header>
        <Group px="md" h="100%" justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <UnstyledButton
              component={Link}
              to="/"
              display="flex"
              style={{ alignItems: 'center', textDecoration: 'none', color: 'inherit', minWidth: 0 }}
            >
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                <Box component="img" src={logoSrc} alt="" h={28} w="auto" style={{ display: 'block', flexShrink: 0 }} />
                <Stack gap={0} style={{ minWidth: 0 }}>
                  <Text fw={700} lineClamp={1}>
                    {t('appName')}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1} visibleFrom="sm">
                    {t('appSubtitle')}
                  </Text>
                </Stack>
              </Group>
            </UnstyledButton>
          </Group>
          <Group gap="sm" wrap="nowrap" justify="flex-end" style={{ flexShrink: 0 }}>
            {!isMobile && <ThemeLocaleToolbar />}
            {user ? (
              <Menu shadow="md" width={isMobile ? 280 : 240} position="bottom-end" trigger={isMobile ? 'click' : 'hover'}>
                <Menu.Target>
                  <UnstyledButton style={{ cursor: 'pointer' }}>
                    <Group gap="xs" wrap="nowrap">
                      <Avatar size="sm" src={user.avatar ? `${user.avatar}?size=64` : undefined} radius="xl">
                        {user.name.slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Text visibleFrom="sm" size="sm" fw={500} lineClamp={1} style={{ minWidth: 0 }}>
                        {displayName}
                      </Text>
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  {isMobile ? (
                    <>
                      <Stack gap="xs" p="xs">
                        <ThemeLocaleToolbar />
                      </Stack>
                      <Menu.Divider />
                    </>
                  ) : null}
                  <Menu.Item component="a" href="/account/profile">
                    {t('myProfile')}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : null}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack gap="xs">
          {links.map((link) => (
            <NavLink
              key={link.to}
              component={Link}
              to={link.to}
              onClick={close}
              label={link.label}
              leftSection={<link.icon size={16} />}
              active={location.pathname === link.to || location.pathname.startsWith(`${link.to}/`)}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <QueryProgressIndicator />
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer h={34}>
        <Group px="md" h="100%" justify="space-between">
          <Text size="xs" c="dimmed">
            &copy; Yukai (Kelvin) Miao
          </Text>
          <Text size="xs" c="dimmed">
            {version?.version ? `Version: ${version.version}` : ''}
          </Text>
        </Group>
      </AppShell.Footer>
    </AppShell>
  )
}
