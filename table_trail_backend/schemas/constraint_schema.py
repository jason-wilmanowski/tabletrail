from pydantic import BaseModel, ConfigDict


# Instert Section
class CreateConstraint(BaseModel):
    constraint_type : str
    constraint_name : str
    references_table_id : int | None = None
    on_delete : str | None = None
    on_update : str | None = None
    check_expression : str | None = None


class UpdateConstraint(BaseModel):
    constraint_type : str | None = None
    constraint_name : str | None = None
    references_table_id : int | None = None
    on_delete : str | None = None
    on_update : str | None = None
    check_expression : str | None = None


# Response Section

class ConstraintResponse(BaseModel):
    id: int
    constraint_name: str
    constraint_type: str
    references_table_id: int | None
    model_config = ConfigDict(from_attributes=True)