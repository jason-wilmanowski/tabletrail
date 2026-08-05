from pydantic import BaseModel
from table_trail_backend.core.enums import ExportType


class CreateExport(BaseModel):
    database_id : int
    export_type : ExportType