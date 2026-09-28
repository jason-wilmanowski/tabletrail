import { useEffect, useState } from 'react'
import { useSettingValue } from '../../store/settingsStore'
import { DEFAULT_ACCENT_COLOR, DEFAULT_MONO_FONT, DEFAULT_THEME_PREFERENCE, resolveTheme } from '../../utils/theme'
import type { ThemePreference } from '../../utils/theme'

const LIGHT_SCHEME_QUERY = '(prefers-color-scheme: light)'

/**
 * Applies the `design.theme`, `design.accentColor` and `design.monoFont`
 * settings as `data-theme` / `data-accent` / `data-mono-font` on `<html>`,
 * which switch the color and font tokens in `index.css`. For `system` it
 * also listens to OS theme changes, so the app follows a switch without a
 * reload. Mounted once in `App`.
 */
export function useApplyTheme() {
  const preference = useSettingValue<ThemePreference>('design.theme', DEFAULT_THEME_PREFERENCE)
  const accentColor = useSettingValue<string>('design.accentColor', DEFAULT_ACCENT_COLOR)
  const monoFont = useSettingValue<string>('design.monoFont', DEFAULT_MONO_FONT)
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

  useEffect(() => {
    document.documentElement.dataset.accent = accentColor
  }, [accentColor])

  useEffect(() => {
    document.documentElement.dataset.monoFont = monoFont
  }, [monoFont])
}
