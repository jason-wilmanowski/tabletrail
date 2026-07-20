import { MarkerType } from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import type { TableResponse } from '../types/table'

/**
 * Maps Foreign-Key constraints across all tables of a database to React
 * Flow edges (table-to-table, not column-to-column — see note below).
 *
 * Deliberately filters on `constraint_type === 'FOREIGN KEY'` first,
 * rather than trusting `references_table_id` alone: a known backend
 * scanner quirk (documented in types/constraint.ts) sets
 * `references_table_id` even on PRIMARY KEY / UNIQUE constraints,
 * pointing back at the table's own id. Filtering by type first means
 * that quirk never produces a bogus self-referencing edge here.
 *
 * Column-level accuracy ("Einschränkung der Genauigkeit" for this step)
 * is intentionally not attempted — edges connect table node to table
 * node. `column_names` (added to unblock Step 16) could later anchor
 * edges to specific column rows once `TableNode` exposes per-column
 * handles, but that's a refinement for a later step, not this one.
 */
export function constraintsToEdges(tables: TableResponse[]): Edge[] {
  const edges: Edge[] = []

  for (const table of tables) {
    const sourceNodeId = `table-${table.id}`

    for (const constraint of table.constraints) {
      if (constraint.constraint_type !== 'FOREIGN KEY') {
        continue
      }

      if (constraint.references_table_id === null) {
        continue
      }

      const targetNodeId = `table-${constraint.references_table_id}`

      edges.push({
        id: `edge-${constraint.id}`,
        type: 'relation',
        source: sourceNodeId,
        target: targetNodeId,
        markerEnd: { type: MarkerType.ArrowClosed },
      })
    }
  }

  return edges
}
