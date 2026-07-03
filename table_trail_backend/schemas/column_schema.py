from pydantic import BaseModel


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