from table_trail_backend.core.exceptions import ExportMarkdownError
from table_trail_backend.export.generators.markdown_generator import MarkdownGenerator
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse
from table_trail_backend.schemas.export_schema import ExportResult


class MarkdownExport:
    def __init__(self):

        self.markdown_gen = MarkdownGenerator()

    def run_export(self, database: DatabaseStructureResponse):

        # 1. generate markdown string
        markdown_string = self.markdown_gen.generate_markdown(database)

        # 2. encode markdown string
        markdown_bytes = markdown_string.encode("utf-8")

        if not markdown_bytes or not markdown_bytes.strip():
            raise ExportMarkdownError

        # 3. return markdown export
        return ExportResult(
            content=markdown_bytes,
            media_type="text/markdown",
            filename=f"{database.name}-Structure.md",
        )
