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
export interface SelectOption {
  value: string
  label: string
}

export interface SelectSetting extends SettingBase {
  type: 'select'
  options: SelectOption[]
  /** Must match one of `options[].value`. */
  defaultValue: string
}

export type SettingDefinition = ToggleSetting | SelectSetting

export type SettingValue = boolean | string

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
            key: 'general.confirmRelationDelete',
            type: 'toggle',
            label: 'Confirm before deleting relations',
            description: 'Ask for confirmation before a custom relation is removed.',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'export',
        title: 'Export',
        settings: [
          {
            key: 'general.defaultExportFormat',
            type: 'select',
            label: 'Default export format',
            description: 'Format preselected when exporting a database.',
            options: [
              { value: 'pdf', label: 'PDF' },
              { value: 'json', label: 'JSON' },
              { value: 'markdown', label: 'Markdown' },
            ],
            defaultValue: 'pdf',
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
