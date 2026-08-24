from urllib.parse import quote

from table_trail_backend.core.enums import ExportType
from table_trail_backend.core.exceptions import (
    DatabaseError,
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
        # 1. prepare database structure
        database_raw = await self._prepare_export_data(export_details.database_id)

        # 2. convert sql alchemy model zu pydantic model
        database = DatabaseStructureResponse.model_validate(database_raw)

        # 3. run export with all dependencies
        export_file = self._run_export(export_details, database)

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
        except ExportSystemError:
            # already a typed export error (e.g. ExportPdfError) - let it propagate as-is
            raise
        except Exception as error:
            # anything unexpected from a generator/template - normalize to a typed error
            raise ExportRuntimeError(message="An unexpected error occurred during export", status_code=500) from error

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

    @staticmethod
    def build_content_disposition(filename: str) -> str:
        # header value must not contain control chars, and non-ASCII names need
        # RFC 5987 encoding: Starlette encodes every header as latin-1, so a
        # database name with e.g. Japanese characters would otherwise crash
        # the response outright instead of just showing a wrong filename
        stripped = filename.replace("\r", "").replace("\n", "").replace('"', "")
        ascii_fallback = stripped.encode("ascii", "ignore").decode("ascii") or "export"
        encoded = quote(stripped, safe="")
        return f"attachment; filename=\"{ascii_fallback}\"; filename*=UTF-8''{encoded}"
