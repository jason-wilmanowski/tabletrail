from pydantic import BaseModel


class CreateConstraint(BaseModel):
    constraint_type : str
    constraint_name : str
    references_table_id : int | None = None
    on_delete : str
    on_update : str
    check_expression : str


class UpdateConstraint(BaseModel):
    constraint_type : str | None = None
    constraint_name : str | None = None
    references_table_id : int | None = None
    on_delete : str | None = None
    on_update : str | None = None
    check_expression : str | None = None
