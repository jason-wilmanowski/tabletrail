from pydantic import BaseModel
from table_trail_backend.core.enums import DBType, DBStatus


class CreateDatabase(BaseModel):
    name: str
    db_type: DBType
    connection_url: str

class UpdateDatabase(BaseModel):
    name: str | None = None
    db_type: DBType | None = None
    connection_url: str | None = None



