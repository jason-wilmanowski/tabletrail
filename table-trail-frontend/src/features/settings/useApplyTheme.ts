import { useEffect, useState } from 'react'
import { useSettingValue } from '../../store/settingsStore'
import { DEFAULT_THEME_PREFERENCE, resolveTheme } from '../../utils/theme'
import type { ThemePreference } from '../../utils/theme'

const LIGHT_SCHEME_QUERY = '(prefers-color-scheme: light)'

/**
 * Applies the `design.theme` setting as `data-theme` on `<html>`, which
 * switches the color tokens in `index.css`. For `system` it also listens
 * to OS theme changes, so the app follows a switch without a reload.
 * Mounted once in `App`.
 */
export function useApplyTheme() {
  const preference = useSettingValue<ThemePreference>('design.theme', DEFAULT_THEME_PREFERENCE)
  const [systemPrefersLight, setSystemPrefersLight] = useState(() => window.matchMedia(LIGHT_SCHEME_QUERY).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(LIGHT_SCHEME_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersLight(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const theme = resolveTheme(preference, systemPrefersLight)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
}
