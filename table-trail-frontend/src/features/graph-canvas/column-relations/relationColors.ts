import type { ColumnRelationColor } from '../../../types/columnRelation'

/**
 * Display colors for each `ColumnRelationColor` value — CSS variables from
 * `index.css`, so each color has its own dark and light theme variant.
 * Distinct from the neutral `--border` stroke used by real FK `RelationEdge`s.
 */
export const COLUMN_RELATION_COLORS: Record<ColumnRelationColor, string> = {
  green: 'hsl(var(--relation-green))',
  red: 'hsl(var(--relation-red))',
  yellow: 'hsl(var(--relation-yellow))',
  blue: 'hsl(var(--relation-blue))',
  magenta: 'hsl(var(--relation-magenta))',
  white: 'hsl(var(--relation-white))',
}

export const COLUMN_RELATION_COLOR_OPTIONS: ColumnRelationColor[] = [
  'green',
  'red',
  'yellow',
  'blue',
  'magenta',
  'white',
]
