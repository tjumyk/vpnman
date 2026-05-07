import { ColorSchemeScript, MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { Notifications } from '@mantine/notifications'
import { NavigationProgress } from '@mantine/nprogress'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'

import { store } from '@/app/store'
import { useI18n } from '@/hooks/useI18n'
import { I18nProvider } from '@/i18n'
import { theme } from '@/theme'

function DatesProviderFromLocale({ children }: { children: ReactNode }): React.ReactElement {
  const { locale } = useI18n()
  const mantineLocale = locale === 'zh-Hans' ? 'zh-cn' : 'en'
  return <DatesProvider settings={{ locale: mantineLocale, firstDayOfWeek: 0 }}>{children}</DatesProvider>
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: 1,
    },
  },
})

export function AppProviders({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ColorSchemeScript defaultColorScheme="auto" />
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <NavigationProgress />
          <Notifications position="top-right" autoClose={4000} zIndex={4000} />
          <I18nProvider>
            <DatesProviderFromLocale>{children}</DatesProviderFromLocale>
          </I18nProvider>
        </MantineProvider>
      </QueryClientProvider>
    </Provider>
  )
}
