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


class MySQLScanner(BaseScanner):
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
        result = conn.execute(
            text(f"""
            SELECT
                tc.table_schema,
                tc.table_name,
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name,
                kcu.referenced_table_name   AS references_table,
                rc.delete_rule              AS on_delete,
                rc.update_rule              AS on_update,
                cc.check_clause             AS check_expression,
                kcu.referenced_table_schema AS references_schema
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema   = kcu.table_schema
                AND tc.table_name     = kcu.table_name
            LEFT JOIN information_schema.referential_constraints rc
                ON tc.constraint_name  = rc.constraint_name
                AND tc.table_schema    = rc.constraint_schema
            LEFT JOIN information_schema.check_constraints cc
                ON tc.constraint_name  = cc.constraint_name
                AND tc.table_schema    = cc.constraint_schema
            WHERE tc.table_schema NOT IN {SYSTEM_SCHEMAS}
            ORDER BY tc.table_schema, tc.table_name, tc.constraint_name, kcu.ordinal_position
        """)
        )
        return self._group_constraints(result.fetchall())
