export type ThemePreference = 'system' | 'dark' | 'light'
export type ResolvedTheme = 'dark' | 'light'

/**
 * Must match the `design.theme` default in `settingsRegistry` — and the
 * fallback in the inline script in `index.html`, which applies the theme
 * before React loads to avoid a flash of the wrong theme.
 */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'dark'

/**
 * Turns the user's preference into the theme actually applied; `system`
 * follows the OS setting and only ever picks `light` or `dark`.
 */
export function resolveTheme(preference: ThemePreference, systemPrefersLight: boolean): ResolvedTheme {
  if (preference === 'system') {
    return systemPrefersLight ? 'light' : 'dark'
  }
  return preference
}
