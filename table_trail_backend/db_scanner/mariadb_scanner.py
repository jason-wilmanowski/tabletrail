from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, Connection

from .base_scanner import (
    BaseScanner,
    ScannedColumn,
    ScannedConstraint,
    ScannedDatabase,
    ScannedTable,
    TableKey,
)

SYSTEM_SCHEMAS = "('information_schema', 'mysql', 'performance_schema', 'sys')"


class MariaDBScanner(BaseScanner):
    def scan(self, connection_url: str | URL) -> ScannedDatabase:
        engine = create_engine(connection_url)
        try:
            with engine.connect() as conn:
                tables = self._scan_tables(conn)
                return ScannedDatabase(tables=tables)
        finally:
            engine.dispose()

    def _scan_tables(self, conn: Connection) -> list[ScannedTable]:
        result = conn.execute(
            text(f"""
            SELECT table_name, table_schema
            FROM information_schema.tables
            WHERE table_schema NOT IN {SYSTEM_SCHEMAS}
            AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name
        """)
        )
        table_rows = result.fetchall()

        columns = self._scan_columns(conn)
        constraints = self._scan_constraints(conn)
        return self._build_tables(table_rows, columns, constraints)

    def _scan_columns(self, conn: Connection) -> dict[TableKey, list[ScannedColumn]]:
        result = conn.execute(
            text(f"""
            SELECT
                table_schema,
                table_name,
                column_name,
                data_type,
                is_nullable,
                column_default,
                ordinal_position
            FROM information_schema.columns
            WHERE table_schema NOT IN {SYSTEM_SCHEMAS}
            ORDER BY table_schema, table_name, ordinal_position
        """)
        )
        return self._group_columns(result.fetchall())

    def _scan_constraints(self, conn: Connection) -> dict[TableKey, list[ScannedConstraint]]:
        # MariaDB hat check_constraints erst ab 10.2 korrekt in information_schema
        # Daher separater Query für CHECK constraints. column_position (last
        # field, ignored by the grouping) keeps composite key columns in order.
        result = conn.execute(
            text(f"""
            SELECT
                tc.table_schema             AS table_schema,
                tc.table_name               AS table_name,
                tc.constraint_name          AS constraint_name,
                tc.constraint_type,
                kcu.column_name,
                kcu.referenced_table_name   AS references_table,
                rc.delete_rule              AS on_delete,
                rc.update_rule              AS on_update,
                NULL                        AS check_expression,
                kcu.referenced_table_schema AS references_schema,
                kcu.ordinal_position        AS column_position
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema   = kcu.table_schema
                AND tc.table_name     = kcu.table_name
            LEFT JOIN information_schema.referential_constraints rc
                ON tc.constraint_name  = rc.constraint_name
                AND tc.constraint_schema = rc.constraint_schema
            WHERE tc.table_schema NOT IN {SYSTEM_SCHEMAS}
            AND   tc.constraint_type != 'CHECK'

            UNION ALL

            SELECT
                cc.constraint_schema,
                cc.table_name,
                cc.constraint_name,
                'CHECK'         AS constraint_type,
                NULL            AS column_name,
                NULL            AS references_table,
                NULL            AS on_delete,
                NULL            AS on_update,
                cc.check_clause AS check_expression,
                NULL            AS references_schema,
                NULL            AS column_position
            FROM information_schema.check_constraints cc
            WHERE cc.constraint_schema NOT IN {SYSTEM_SCHEMAS}

            ORDER BY table_schema, table_name, constraint_name, column_position
        """)
        )
        return self._group_constraints(result.fetchall())
