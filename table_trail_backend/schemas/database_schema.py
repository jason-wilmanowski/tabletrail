from pydantic import BaseModel
from table_trail_backend.core.enums import DBType, DBStatus


class CreateDatabase(BaseModel):
    name: str
    db_type: DBType
    host: str
    port: str
    db_name: str
    username: str
    password: str
    status : DBStatus


class UpdateDatabase(BaseModel):
    name: str | None = None
    db_type : DBType | None = None
    host: str | None = None
    port: str | None = None
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

