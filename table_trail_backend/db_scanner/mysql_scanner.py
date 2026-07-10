from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection

from .base_scanner import BaseScanner, ScannedDatabase, ScannedTable, ScannedColumn, ScannedConstraint


class MySQLScanner(BaseScanner):

    def scan(self, connection_url: str) -> ScannedDatabase:
        engine = create_engine(connection_url)
        try:
            with engine.connect() as conn:
                tables = self._scan_tables(conn)
                return ScannedDatabase(tables=tables)
        finally:
            engine.dispose()

    def _scan_tables(self, conn: Connection) -> list[ScannedTable]:
        result = conn.execute(text("""
            SELECT table_name, table_schema
            FROM information_schema.tables
            WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
            AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name
        """))

        tables = []
        for row in result.fetchall():
            table_name  = row[0]
            schema_name = row[1]
            columns     = self._scan_columns(conn, schema_name, table_name)
            constraints = self._scan_constraints(conn, schema_name, table_name)
            tables.append(ScannedTable(
                name=table_name,
                schema_name=schema_name,
                columns=columns,
                constraints=constraints
            ))
        return tables

    def _scan_columns(self, conn: Connection, schema_name: str, table_name: str) -> list[ScannedColumn]:
        result = conn.execute(text("""
            SELECT
                column_name,
                data_type,
                is_nullable,
                column_default,
                ordinal_position
            FROM information_schema.columns
            WHERE table_schema = :schema AND table_name = :table
            ORDER BY ordinal_position
        """), {"schema": schema_name, "table": table_name})

        columns = []
        for row in result.fetchall():
            columns.append(ScannedColumn(
                name=row[0],
                data_type=row[1],
                is_nullable=row[2] == "YES",
                default_value=row[3],
                ordinal_position=row[4]
            ))
        return columns

    def _scan_constraints(self, conn: Connection, schema_name: str, table_name: str) -> list[ScannedConstraint]:
        result = conn.execute(text("""
            SELECT
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name,
                kcu.referenced_table_name   AS references_table,
                rc.delete_rule              AS on_delete,
                rc.update_rule              AS on_update,
                cc.check_clause             AS check_expression
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
            WHERE tc.table_schema = :schema
            AND   tc.table_name   = :table
            ORDER BY tc.constraint_name, kcu.ordinal_position
        """), {"schema": schema_name, "table": table_name})

        constraints_map: dict[str, ScannedConstraint] = {}
        for row in result.fetchall():
            constraint_name  = row[0]
            constraint_type  = row[1]
            column_name      = row[2]
            references_table = row[3]
            on_delete        = row[4]
            on_update        = row[5]
            check_expression = row[6]

            if constraint_name not in constraints_map:
                constraints_map[constraint_name] = ScannedConstraint(
                    constraint_name=constraint_name,
                    constraint_type=constraint_type,
                    column_names=[],
                    references_table=references_table,
                    on_delete=on_delete,
                    on_update=on_update,
                    check_expression=check_expression
                )

            if column_name and column_name not in constraints_map[constraint_name].column_names:
                constraints_map[constraint_name].column_names.append(column_name)

        return list(constraints_map.values())