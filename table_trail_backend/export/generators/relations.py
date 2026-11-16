from dataclasses import dataclass

from table_trail_backend.schemas.export_schema import DatabaseExport
from table_trail_backend.schemas.table_schema import TableResponse

FOREIGN_KEY = "FOREIGN KEY"


@dataclass(frozen=True)
class ForeignKeyRelation:
    from_table: str
    from_columns: list[str]
    to_table: str
    on_delete: str | None


def _qualified_name(table: TableResponse) -> str:
    return f"{table.schema_name}.{table.name}" if table.schema_name else table.name


def build_foreign_key_relations(database: DatabaseExport) -> list[ForeignKeyRelation]:
    # The cache only stores the referenced table (not its columns), so a
    # relation reads "local columns -> table". FKs whose target table isn't
    # part of the scan (references_table_id is None) are skipped.
    tables_by_id = {table.id: table for table in database.tables}

    relations = []
    for table in database.tables:
        for constraint in table.constraints:
            if constraint.constraint_type != FOREIGN_KEY:
                continue
            target = tables_by_id.get(constraint.references_table_id)
            if target is None:
                continue
            relations.append(
                ForeignKeyRelation(
                    from_table=_qualified_name(table),
                    from_columns=constraint.column_names,
                    to_table=_qualified_name(target),
                    on_delete=constraint.on_delete,
                )
            )
    return relations
