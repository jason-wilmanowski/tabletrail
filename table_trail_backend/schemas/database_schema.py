from datetime import datetime
from pydantic import BaseModel, ConfigDict
from table_trail_backend.core.enums import DBType, DBStatus
from table_trail_backend.schemas.table_schema import TableResponse
from table_trail_backend.schemas.column_schema import ColumnResponse


# Insert Section

class CreateDatabase(BaseModel):
    name: str
    db_type: DBType
    host: str
    port: str
    db_name: str
    username: str
    password: str


class CreateDatabaseInternal(CreateDatabase):
    status: DBStatus


class UpdateDatabase(BaseModel):
    name: str | None = None
    db_type : DBType | None = None
    host: str | None = None
    port: int | None = None
    db_name: str | None = None
    username: str | None = None
    password: str | None = None
    status: DBStatus | None = None


class ConnectionDetails(BaseModel):
    db_type : DBType
    host: str
    port: str
    db_name: str
    username: str
    password: str



# Response Section

class DatabaseStructureResponse(CreateDatabase):
    id: int
    tables: list[TableResponse]
    model_config = ConfigDict(from_attributes=True)

class DatabaseResponse(CreateDatabase):
    id: int

class DatabaseOverviewResponse(BaseModel):
    id: int
    name: str
    db_type: DBType
    status: DBStatus
    host: str
    port: str
    username: str
    db_name: str
    created_at : datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SearchResponse(BaseModel):
    tables: list[TableResponse] | None = None
    columns: list[ColumnResponse] | None = None
    schema_tables: list[TableResponse] | None = None
    model_config = ConfigDict(from_attributes=True)

