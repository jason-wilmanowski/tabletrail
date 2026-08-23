from abc import ABC, abstractmethod
from dataclasses import dataclass, field


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


class BaseScanner(ABC):
    @abstractmethod
    def scan(self, connection_url: str) -> ScannedDatabase:
        pass
