from abc import ABC, abstractmethod
from dataclasses import dataclass


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
    column_names: list[str]
    references_table: str | None
    on_delete: str | None
    on_update: str | None
    check_expression: str | None


@dataclass
class ScannedTable:
    name: str
    schema_name: str
    columns: list[ScannedColumn]
    constraints: list[ScannedConstraint]


@dataclass
class ScannedDatabase:
    tables: list[ScannedTable]


class BaseScanner(ABC):

    @abstractmethod
    def connect(self, connection_url: str) -> None:
        pass

    @abstractmethod
    def scan(self) -> ScannedDatabase:
        pass

    @abstractmethod
    def disconnect(self) -> None:
        pass