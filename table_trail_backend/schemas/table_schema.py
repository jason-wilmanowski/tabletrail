from pydantic import BaseModel, ConfigDict

from table_trail_backend.schemas.column_schema import ColumnResponse
from table_trail_backend.schemas.constraint_schema import ConstraintResponse


class TableResponse(BaseModel):
    id: int
    name: str
    schema_name: str | None
    columns: list[ColumnResponse]
    constraints: list[ConstraintResponse]
    model_config = ConfigDict(from_attributes=True)
