import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { I18nContext } from '@/i18n/context'
import {
  formatTranslation,
  getDefaultLocale,
  STORAGE_KEY,
  translations,
  type Locale,
  type TranslationKey,
  type TranslationParams,
} from '@/i18n/translations'

export function I18nProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>(getDefaultLocale)

  const setLocale = (value: Locale) => {
    setLocaleState(value)
    localStorage.setItem(STORAGE_KEY, value)
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const t = useMemo(
    () => (key: TranslationKey, params?: TranslationParams) => {
      const template = translations[locale][key] ?? translations.en[key] ?? String(key)
      return formatTranslation(template, params)
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
