import type { GraphVisibilityLayerId } from '../../../store/graphVisibilityStore'

export interface GraphVisibilityToggleDef {
  id: GraphVisibilityLayerId
  label: string
}

/**
 * Ordered list of toggles `VisibilityPanel` renders. Adding a new
 * visibility toggle means adding an entry here (and its id to
 * `GraphVisibilityLayerId`) — the panel itself has no hardcoded
 * checkboxes, it just maps over this list.
 */
export const GRAPH_VISIBILITY_TOGGLES: GraphVisibilityToggleDef[] = [
  { id: 'customRelations', label: 'Show custom relations' },
  { id: 'foreignKeyRelations', label: 'Show foreign key relations' },
]
