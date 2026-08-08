from table_trail_backend.schemas.database_schema import DatabaseStructureResponse
from table_trail_backend.schemas.export_schema import ExportResult

class JsonExport:

    @staticmethod
    def run_export(database: DatabaseStructureResponse):

        # 1. convert database structure to json
        json_export = database.model_dump_json(indent=4)

        # 2. encode json variable to bytes
        json_bytes = json_export.encode("utf-8")

        # 3. return export results to service layer
        return ExportResult(
            content=json_bytes,
            media_type="application/json",
            filename=f"{database.name}-Structure.json",
        )