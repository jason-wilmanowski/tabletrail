import type { ColumnRelationColor } from '../../../types/columnRelation'

/**
 * Display colors for each `ColumnRelationColor` value. Chosen to read
 * clearly against the app's dark `--panel`/`--surface` tokens, distinct
 * from the neutral `--border` stroke used by real FK `RelationEdge`s.
 */
export const COLUMN_RELATION_COLORS: Record<ColumnRelationColor, string> = {
  green: '#4ade80',
  red: '#f87171',
  yellow: '#facc15',
  blue: '#60a5fa',
  magenta: '#e879f9',
  white: '#f5f5f5',
}

export const COLUMN_RELATION_COLOR_OPTIONS: ColumnRelationColor[] = [
  'green',
  'red',
  'yellow',
  'blue',
  'magenta',
  'white',
]
