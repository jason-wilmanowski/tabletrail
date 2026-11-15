from pydantic import BaseModel, ConfigDict

from table_trail_backend.core.enums import DBType, ExportType
from table_trail_backend.schemas.table_schema import TableResponse


class CreateExport(BaseModel):
    database_id: int
    export_type: ExportType
    include_connection_details: bool = False


class ExportResult(BaseModel):
    content: bytes
    media_type: str
    filename: str


# Fields of `DatabaseExport` that describe how to reach the database. They're
# left out of an export unless `CreateExport.include_connection_details` is set.
CONNECTION_DETAIL_FIELDS = frozenset({"host", "port", "db_name", "username"})


class DatabaseExport(BaseModel):
    id: int
    name: str
    db_type: DBType
    host: str | None = None
    port: int | None = None
    db_name: str | None = None
    username: str | None = None
    tables: list[TableResponse]
    model_config = ConfigDict(from_attributes=True)

    def without_connection_details(self) -> "DatabaseExport":
        return self.model_copy(update=dict.fromkeys(CONNECTION_DETAIL_FIELDS))
