from pydantic import BaseModel, ConfigDict

from table_trail_backend.core.enums import ColumnRelationColor


# Insert Section
class CreateColumnRelation(BaseModel):
    column_id_1: int
    column_id_2: int
    relation_color: ColumnRelationColor = ColumnRelationColor.GREEN
    description: str | None = None


class UpdateColumnRelation(BaseModel):
    column_id_1: int | None = None
    column_id_2: int | None = None
    relation_color: ColumnRelationColor | None = None
    description: str | None = None


# Response Section


class ColumnRelationResponse(BaseModel):
    id: int
    database_id: int
    column_id_1: int
    column_id_2: int
    relation_color: ColumnRelationColor
    description: str | None = None
    model_config = ConfigDict(from_attributes=True)
