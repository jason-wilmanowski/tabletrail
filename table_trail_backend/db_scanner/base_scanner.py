from abc import ABC, abstractmethod
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.engine import URL


@dataclass
class ScannedColumn:
    name: str
    data_type: str
    is_nullable: bool
    default_value: str | None
    ordinal_position: int


@dataclass
class ScannedConstraint:
    constraint_name: str
    constraint_type: str
    column_names: list[str] = field(default_factory=list)
    references_table: str | None = None
    references_schema: str | None = None
    on_delete: str | None = None
    on_update: str | None = None
    check_expression: str | None = None


@dataclass
class ScannedTable:
    name: str
    schema_name: str
    columns: list[ScannedColumn] = field(default_factory=list)
    constraints: list[ScannedConstraint] = field(default_factory=list)


@dataclass
class ScannedDatabase:
    tables: list[ScannedTable] = field(default_factory=list)


# (schema_name, table_name)
TableKey = tuple[str, str]
Row = Sequence[Any]


class BaseScanner(ABC):
    """Scanners read the whole schema in three queries - tables, all columns,
    all constraints - instead of two queries per table, then group the
    column and constraint rows by table with the helpers below. Each scanner
    only supplies dialect-specific SQL whose rows follow these layouts:

    - tables:      table_name, table_schema
    - columns:     table_schema, table_name, column_name, data_type, is_nullable,
                   column_default, ordinal_position
                   (ordered by schema, table, ordinal_position)
    - constraints: table_schema, table_name, constraint_name, constraint_type,
                   column_name, references_table, on_delete, on_update,
                   check_expression, references_schema
                   (ordered by schema, table, constraint name, column position;
                   one row per constraint column, extra trailing fields ignored)
    """

    @abstractmethod
    def scan(self, connection_url: str | URL) -> ScannedDatabase:
        pass

    @staticmethod
    def _group_columns(rows: Iterable[Row]) -> dict[TableKey, list[ScannedColumn]]:
        columns: dict[TableKey, list[ScannedColumn]] = {}
        for row in rows:
            columns.setdefault((row[0], row[1]), []).append(
                ScannedColumn(
                    name=row[2],
                    data_type=row[3],
                    is_nullable=row[4] == "YES",
                    default_value=row[5],
                    ordinal_position=row[6],
                )
            )
        return columns

    @staticmethod
    def _group_constraints(rows: Iterable[Row]) -> dict[TableKey, list[ScannedConstraint]]:
        # Constraint names are only unique per table, so composite
        # constraints are merged per (schema, table, constraint_name).
        constraints: dict[TableKey, dict[str, ScannedConstraint]] = {}
        for row in rows:
            table_constraints = constraints.setdefault((row[0], row[1]), {})
            constraint_name = row[2]
            if constraint_name not in table_constraints:
                table_constraints[constraint_name] = ScannedConstraint(
                    constraint_name=constraint_name,
                    constraint_type=row[3],
                    column_names=[],
                    references_table=row[5],
                    references_schema=row[9],
                    on_delete=row[6],
                    on_update=row[7],
                    check_expression=row[8],
                )

            column_name = row[4]
            constraint = table_constraints[constraint_name]
            if column_name and column_name not in constraint.column_names:
                constraint.column_names.append(column_name)

        return {key: list(by_name.values()) for key, by_name in constraints.items()}

    @staticmethod
    def _build_tables(
        table_rows: Iterable[Row],
        columns: dict[TableKey, list[ScannedColumn]],
        constraints: dict[TableKey, list[ScannedConstraint]],
    ) -> list[ScannedTable]:
        tables = []
        for row in table_rows:
            table_name, schema_name = row[0], row[1]
            key = (schema_name, table_name)
            tables.append(
                ScannedTable(
                    name=table_name,
                    schema_name=schema_name,
                    columns=columns.get(key, []),
                    constraints=constraints.get(key, []),
                )
            )
        return tables
