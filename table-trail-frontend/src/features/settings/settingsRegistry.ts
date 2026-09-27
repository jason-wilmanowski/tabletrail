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

export interface PaletteOption {
  value: string
  label: string
  /** Any CSS color, e.g. `hsl(217 33% 58%)` or `hsl(var(--accent))`. */
  color: string
}

/**
 * A grid of color swatches; the selected one is ringed and its label shown
 * below. `columns` sets the swatches per row — the number of rows follows
 * from the option count, so any amount of options lays out as a grid.
 */
export interface PaletteSetting extends SettingBase {
  type: 'palette'
  options: PaletteOption[]
  columns: number
  /** Must match one of `options[].value`. */
  defaultValue: string
}

/**
 * Union of every setting kind. A new kind (select, text, number …) needs a
 * member here, a value type in `SettingValue` and a case in `SettingControl`.
 */
export type SettingDefinition = ToggleSetting | SelectSetting | PaletteSetting

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
    sections: [
      {
        id: 'appearance',
        title: 'Appearance',
        settings: [
          {
            key: 'design.theme',
            type: 'select',
            label: 'Theme',
            description: 'System follows your operating system and switches automatically when it changes.',
            options: [
              { value: 'system', label: 'System' },
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ],
            defaultValue: 'dark',
          },
          // TEMPORARY palette preview — remove before committing.
          {
            key: 'design.palettePreview',
            type: 'palette',
            label: 'Palette preview',
            description: 'Temporary entry to review the palette control.',
            columns: 6,
            options: [
              { value: 'slate', label: 'Slate', color: 'hsl(217 33% 58%)' },
              { value: 'blue', label: 'Blue', color: 'hsl(217 91% 60%)' },
              { value: 'teal', label: 'Teal', color: 'hsl(173 58% 39%)' },
              { value: 'green', label: 'Green', color: 'hsl(142 50% 45%)' },
              { value: 'lime', label: 'Lime', color: 'hsl(84 60% 45%)' },
              { value: 'amber', label: 'Amber', color: 'hsl(38 85% 55%)' },
              { value: 'orange', label: 'Orange', color: 'hsl(24 85% 55%)' },
              { value: 'red', label: 'Red', color: 'hsl(0 65% 55%)' },
              { value: 'rose', label: 'Rose', color: 'hsl(345 70% 60%)' },
              { value: 'violet', label: 'Violet', color: 'hsl(262 55% 62%)' },
              { value: 'indigo', label: 'Indigo', color: 'hsl(239 50% 60%)' },
              { value: 'graphite', label: 'Graphite', color: 'hsl(240 5% 45%)' },
            ],
            defaultValue: 'slate',
          },
        ],
      },
    ],
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
      {
        id: 'sidebar',
        title: 'Sidebar',
        settings: [
          {
            key: 'graph.showSchemaStats',
            type: 'toggle',
            label: 'Show table and column count',
            description: 'Shows the total number of tables and columns below the search field.',
            defaultValue: true,
          },
          {
            key: 'graph.showSearchMatchCount',
            type: 'toggle',
            label: 'Show search match count',
            description: 'While searching, shows how many of those tables and columns match, e.g. "5 of 24 tables".',
            enabledBy: 'graph.showSchemaStats',
            defaultValue: true,
          },
        ],
      },
      {
        id: 'size',
        title: 'Size',
        settings: [
          {
            key: 'graph.menuScale',
            type: 'select',
            label: 'Menu size',
            description: 'Size of the graph menus in the top-right corner, including their open panels.',
            options: [
              { value: '75', label: '75%' },
              { value: '100', label: '100%' },
              { value: '125', label: '125%' },
            ],
            defaultValue: '100',
          },
          {
            key: 'graph.zoomControlsScale',
            type: 'select',
            label: 'Zoom controls size',
            description: 'Size of the zoom in, zoom out and fit view buttons in the bottom-left corner.',
            enabledBy: 'graph.showZoomControls',
            options: [
              { value: '75', label: '75%' },
              { value: '100', label: '100%' },
              { value: '125', label: '125%' },
            ],
            defaultValue: '100',
          },
          {
            key: 'graph.minimapScale',
            type: 'select',
            label: 'Minimap size',
            description: 'Size of the graph overview in the bottom-right corner.',
            enabledBy: 'graph.showMinimap',
            options: [
              { value: '75', label: '75%' },
              { value: '100', label: '100%' },
              { value: '125', label: '125%' },
            ],
            defaultValue: '100',
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
