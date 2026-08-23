from table_trail_backend.core.enums import ExportType
from table_trail_backend.core.exceptions import (
    DatabaseError,
    DatabaseSystemError,
    ExportRuntimeError,
    ExportSystemError,
    ExportTypeUnsupportedError,
)
from table_trail_backend.export.json_export import JsonExport
from table_trail_backend.export.markdown_export import MarkdownExport
from table_trail_backend.export.pdf_export import PdfExport
from table_trail_backend.repositories.database_repository import DatabasesRepository
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse
from table_trail_backend.schemas.export_schema import CreateExport


class ExportService:
    def __init__(self, db):
        self.db = db
        self.db_repo = DatabasesRepository(db)

    async def execute_export(self, export_details: CreateExport):

        try:
            # 1. prepare database structure
            database_raw = await self._prepare_export_data(export_details.database_id)

            # 2. convert sql alchemy model zu pydantic model
            database = DatabaseStructureResponse.model_validate(database_raw)

            # 3. run export with all dependencies
            export_file = self._run_export(export_details, database)

        except ExportSystemError:
            raise
        except DatabaseSystemError:
            raise

        return export_file

    async def _prepare_export_data(self, database_id: int):

        database = await self.db_repo.get_full_database(database_id)

        if not database:
            raise DatabaseError(message="Database not found", status_code=404)

        return database

    def _run_export(self, export_details: CreateExport, database: DatabaseStructureResponse):

        # get dynamic export class via export type
        export_class = self._get_export_type(export_details.export_type)

        try:
            export_file = export_class.run_export(database)
        except ExportRuntimeError:
            raise

        return export_file

    def _get_export_type(self, export_type: ExportType):
        # convert input export type to matching class
        export_map = {
            ExportType.PDF: PdfExport,
            ExportType.JSON: JsonExport,
            ExportType.MARKDOWN: MarkdownExport,
        }
        if export_type not in export_map:
            raise ExportTypeUnsupportedError(message="Unsupported export file type", status_code=422)
        return export_map[export_type]()
