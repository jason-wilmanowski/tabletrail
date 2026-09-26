/**
 * Mirrors backend `DBType` enum (core/enums.py).
 * String values inferred from actual scan response ("db_type": "postgresql").
 * Verify against the real enum if backend values differ.
 */
export type DBType = 'postgresql' | 'mysql' | 'mariadb'

/**
 * Mirrors backend `ExportType` enum (core/enums.py).
 */
export type ExportFormat = 'pdf' | 'json' | 'markdown'

/**
 * Mirrors backend `DBStatus` enum (core/enums.py).
 * Exact string casing not directly observed in a response yet — inferred
 * from enum member names (SCANNING / READY / ERROR) discussed during backend work.
 * Verify against the real enum if backend values differ.
 */
export type DBStatus = 'scanning' | 'ready' | 'error'

/**
 * Shared connection fields, mirrors backend `CreateDatabase` schema.
 * Only used for requests — read responses never include `password`
 * (see `DatabaseConnectionInfo`).
 */
export interface ConnectionFields {
  name: string
  db_type: DBType
  host: string
  port: string
  db_name: string
  username: string
  password: string
}

/**
 * Connection fields as returned by the backend (`DatabaseBaseResponse`).
 * The stored password is encrypted server-side and never sent back.
 */
export type DatabaseConnectionInfo = Omit<ConnectionFields, 'password'>
