from pydantic import BaseModel, ConfigDict

from table_trail_backend.core.enums import ColumnRelationColor


# Insert Section
class CreateColumnRelation(BaseModel):
    schema_name: str
    table_name_1: str
    table_name_2: str
    column_name_1: str
    column_name_2: str
    relation_color: ColumnRelationColor = ColumnRelationColor.GREEN
    description: str | None = None


class UpdateColumnRelation(BaseModel):
    schema_name: str | None = None
    table_name_1: str | None = None
    table_name_2: str | None = None
    column_name_1: str | None = None
    column_name_2: str | None = None
    relation_color: ColumnRelationColor | None = None
    description: str | None = None


# Response Section


class ColumnRelationResponse(BaseModel):
    id: int
    database_id: int
    schema_name: str
    table_name_1: str
    table_name_2: str
    column_name_1: str
    column_name_2: str
    relation_color: ColumnRelationColor
    description: str | None = None
    model_config = ConfigDict(from_attributes=True)
