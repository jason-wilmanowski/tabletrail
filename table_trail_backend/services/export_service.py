from table_trail_backend.core.enums import ExportType
from table_trail_backend.export.pdf_export import PdfExport
from table_trail_backend.repositories.database_repository import DatabasesRepository
from table_trail_backend.schemas.export_schema import CreateExport
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse
from table_trail_backend.core.exceptions import DatabaseError
from table_trail_backend.core.exceptions import ExportSystemError, ExportRuntimeError, ExportTypeUnsupportedError

class ExportService:


    def __init__(self, db):
        self.db = db
        self.db_repo = DatabasesRepository(db)


    async def execute_export(self, export_details: CreateExport):

        try:
            # 1. prepare database structure
            database_structure = await self._prepare_export_data(export_details.database_id)

            # 2. run export with all dependencies
            export_file = self._run_export(export_details, database_structure)

        except ExportSystemError:
            raise

        return export_file


    async def _prepare_export_data(self, database_id: int):

        database_structure = await self.db_repo.get_full_database(database_id)

        if not database_structure:
            raise DatabaseError(message="Database not found", status_code=404)

        return database_structure

    def _run_export(self, export_details: CreateExport, database_structure : DatabaseStructureResponse):

        export_class = self._get_export_type(export_details.export_type)

        try:
            export_file = export_class.run_export()
        except ExportRuntimeError:
            raise

        return export_file

    def _get_export_type(self, export_type: ExportType):
        export_map = {
            ExportType.JSON: JsonExport,
            ExportType.PDF: PdfExport,
            ExportType.MARKDOWN: MarkdownExport,
        }
        if export_type not in export_map:
            raise ExportTypeUnsupportedError(message="Unsupported export file type",
                                            status_code=422)
        return export_map[export_type]()