import { Sparkles, Palette, SlidersHorizontal, Network } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface SettingBase {
  /** Globally unique key — also the persistence key in `settingsStore`. */
  key: string
  label: string
  description?: string
}

export interface ToggleSetting extends SettingBase {
  type: 'toggle'
  defaultValue: boolean
}

/**
 * Union of every setting kind. A new kind (select, text, number …) needs a
 * member here, a value type in `SettingValue` and a case in `SettingControl`.
 */
export type SettingDefinition = ToggleSetting

export type SettingValue = boolean

export interface SettingsSectionDef {
  id: string
  title: string
  settings: SettingDefinition[]
}

export interface SettingsCategoryDef {
  /** Used as the URL segment: `/settings/:id`. */
  id: string
  label: string
  icon: LucideIcon
  description: string
  /** Empty = the category renders its "coming soon" state. */
  sections: SettingsSectionDef[]
}

/**
 * Single source of truth for the settings UI. To add a setting, append it
 * to a section's `settings`; to add a section, append to `sections`; to add
 * a category, append here.
 */
export const SETTINGS_CATEGORIES: SettingsCategoryDef[] = [
  {
    id: 'general',
    label: 'General',
    icon: SlidersHorizontal,
    description: 'General application preferences.',
    sections: [
      {
        id: 'behavior',
        title: 'Behavior',
        settings: [
          {
            // Placeholder — persisted, but not consumed anywhere yet.
            key: 'general.confirmRelationDelete',
            type: 'toggle',
            label: 'Confirm before deleting relations',
            description: 'Ask for confirmation before a custom relation is removed.',
            defaultValue: true,
          },
          {
            // Placeholder — persisted, but not consumed anywhere yet.
            key: 'general.reopenLastDatabase',
            type: 'toggle',
            label: 'Reopen last database on launch',
            description: 'Jump straight back to the database you were viewing.',
            defaultValue: false,
          },
        ],
      },
    ],
  },
  {
    id: 'ai-models',
    label: 'AI Models',
    icon: Sparkles,
    description: 'Configure AI-powered explanations and database insights.',
    sections: [],
  },
  {
    id: 'design',
    label: 'Design',
    icon: Palette,
    description: 'Customize theme and appearance preferences.',
    sections: [],
  },
  {
    id: 'graph',
    label: 'Graph',
    icon: Network,
    description: 'Configure default graph layout and visualization behavior.',
    sections: [],
  },
]

export const DEFAULT_SETTINGS_CATEGORY_ID = SETTINGS_CATEGORIES[0].id
