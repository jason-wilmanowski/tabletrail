/**
 * Mirrors backend `ConstraintResponse` schema.
 *
 * IMPORTANT: confirmed from actual scan output, the response currently only
 * includes these four fields — even though the underlying `Constraints` DB
 * model and `CreateConstraint` schema also carry `on_delete`, `on_update`
 * and `check_expression`. Those three are NOT present in the response as
 * observed, so they are intentionally left out here rather than guessed in.
 * If the backend response schema is extended to include them, add here as
 * `on_delete: string | null`, `on_update: string | null`,
 * `check_expression: string | null`.
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
}
