from pydantic import BaseModel, ConfigDict


# Insert Section
class CreateColumn(BaseModel):
    name: str
    data_type: str
    is_nullable: bool
    default_value: str | None = None
    ordinal_position: int


class UpdateColumn(BaseModel):
    name: str | None = None
    data_type: str | None = None
    is_nullable: bool | None = None
    default_value: str | None = None
    ordinal_position: int | None = None


# Response Section


class ColumnResponse(BaseModel):
    id: int
    name: str
    data_type: str
    is_nullable: bool
    default_value: str | None
    ordinal_position: int
    model_config = ConfigDict(from_attributes=True)
