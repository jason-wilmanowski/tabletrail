/**
 * Mirrors backend `ConstraintResponse` schema.
 *
 * IMPORTANT: confirmed from actual scan output, the response originally
 * only included four fields — even though the underlying `Constraints` DB
 * model and `CreateConstraint` schema also carry `on_delete`, `on_update`
 * and `check_expression`. `check_expression` is still NOT present in the
 * response, so it remains intentionally left out here rather than
 * guessed in. If the backend response schema is extended to include it,
 * add here as `check_expression: string | null`.
 *
 * `column_names` was added to the backend specifically to unblock Step 16
 * (PK/FK icons need to know which columns a constraint applies to) — see
 * the backend fix: a `column_names` property on the `Constraints` model
 * (derived from `constraint_columns`), exposed on `ConstraintResponse`,
 * with the corresponding `joinedload(ConstraintColumn.column)` added to
 * `get_full_database` so it doesn't lazy-load outside the session.
 *
 * `on_delete`/`on_update` were added to unblock Step 19 (edge labels) —
 * these are plain columns directly on `Constraints`, not a relationship,
 * so no `joinedload` change was needed for these two, unlike `column_names`.
 *
 * Also note: `references_table_id` was observed set even for PRIMARY KEY /
 * UNIQUE constraints in the real scan output (a known backend scanner bug
 * discussed separately). The type reflects what the backend actually sends,
 * not what it should send.
 */
export interface ConstraintResponse {
  id: number
  constraint_name: string
  constraint_type: string
  references_table_id: number | null
  column_names: string[]
  on_delete: string | null
  on_update: string | null
}
