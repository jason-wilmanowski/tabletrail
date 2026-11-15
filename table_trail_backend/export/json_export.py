from table_trail_backend.schemas.export_schema import CONNECTION_DETAIL_FIELDS, DatabaseExport, ExportResult


class JsonExport:
    @staticmethod
    def run_export(database: DatabaseExport):
        # 1. convert database structure to json
        # left-out connection details are omitted rather than exported as null
        omitted = {field for field in CONNECTION_DETAIL_FIELDS if getattr(database, field) is None}
        json_export = database.model_dump_json(indent=4, exclude=omitted)

        # 2. encode json variable to bytes
        json_bytes = json_export.encode("utf-8")

        # 3. return export results to service layer
        return ExportResult(
            content=json_bytes,
            media_type="application/json",
            filename=f"{database.name}-Structure.json",
        )
