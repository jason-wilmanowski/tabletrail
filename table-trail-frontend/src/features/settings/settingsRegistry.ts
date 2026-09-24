import { Sparkles, Palette, SlidersHorizontal, Network } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import {
  JsonExportIcon,
  MarkdownExportIcon,
  PdfExportIcon,
} from '../database-detail/ExportTypeIcon'

interface SettingBase {
  /** Globally unique key — also the persistence key in `settingsStore`. */
  key: string
  label: string
  description?: string
  /** Key of a toggle setting; while that toggle is off, this row is shown disabled. */
  enabledBy?: string
}

export interface ToggleSetting extends SettingBase {
  type: 'toggle'
  defaultValue: boolean
}

export interface SelectOption {
  value: string
  label: string
  /** Shown before the label, in the trigger and in the list. */
  icon?: ComponentType<{ className?: string }>
}

export interface SelectSetting extends SettingBase {
  type: 'select'
  options: SelectOption[]
  /** Must match one of `options[].value`. */
  defaultValue: string
}

/**
 * Union of every setting kind. A new kind (select, text, number …) needs a
 * member here, a value type in `SettingValue` and a case in `SettingControl`.
 */
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
        id: 'navigation',
        title: 'Navigation',
        settings: [
          {
            key: 'general.databaseHoverPreview',
            type: 'toggle',
            label: 'Preview databases on hover',
            description: 'On the overview page, hovering a database in the sidebar shows its schema graph.',
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
              { value: 'pdf', label: 'PDF', icon: PdfExportIcon },
              { value: 'json', label: 'JSON', icon: JsonExportIcon },
              { value: 'markdown', label: 'Markdown', icon: MarkdownExportIcon },
            ],
            defaultValue: 'pdf',
          },
        ],
      },
      {
        id: 'scans',
        title: 'Scans',
        settings: [
          {
            key: 'general.scanAgeWarningEnabled',
            type: 'toggle',
            label: 'Warn about outdated scans',
            description: 'Highlights the last scan date on a database page once it passes the threshold below.',
            defaultValue: false,
          },
          {
            key: 'general.scanAgeWarningDays',
            type: 'select',
            label: 'Warn when a scan is older than',
            enabledBy: 'general.scanAgeWarningEnabled',
            options: [
              { value: '1', label: '1 day' },
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' },
            ],
            defaultValue: '7',
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
    sections: [
      {
        id: 'canvas',
        title: 'Canvas',
        settings: [
          {
            key: 'graph.showMinimap',
            type: 'toggle',
            label: 'Show minimap',
            description: 'Shows an overview of the whole graph in the bottom-right corner.',
            defaultValue: true,
          },
          {
            key: 'graph.showZoomControls',
            type: 'toggle',
            label: 'Show zoom controls',
            description: 'Shows the zoom in, zoom out and fit view buttons in the bottom-left corner.',
            defaultValue: true,
          },
          {
            key: 'graph.backgroundPattern',
            type: 'select',
            label: 'Background pattern',
            description: 'Pattern drawn behind the graph.',
            options: [
              { value: 'dots', label: 'Dots' },
              { value: 'lines', label: 'Lines' },
              { value: 'cross', label: 'Cross' },
              { value: 'none', label: 'None' },
            ],
            defaultValue: 'dots',
          },
        ],
      },
    ],
  },
]

export const DEFAULT_SETTINGS_CATEGORY_ID = SETTINGS_CATEGORIES[0].id

export function findSettingDefinition(key: string): SettingDefinition | undefined {
  return SETTINGS_CATEGORIES.flatMap((category) => category.sections)
    .flatMap((section) => section.settings)
    .find((setting) => setting.key === key)
}
