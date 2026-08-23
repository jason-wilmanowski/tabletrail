from table_trail_backend.export.generators.html_generator import HTMLGenerator
from table_trail_backend.export.generators.pdf_generator import PdfGenerator
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse
from table_trail_backend.schemas.export_schema import ExportResult


class PdfExport:
    def __init__(self):
        self.pdf_gen = PdfGenerator()
        self.html_gen = HTMLGenerator()

    def run_export(self, database: DatabaseStructureResponse):
        # 1. generate dynamic html file with database structure
        html = self.html_gen.generate_html(database=database)

        # 2. generate pdf file as bytes with html
        pdf_bytes = self.pdf_gen.generate_pdf(html)

        # 3. create export return dict
        pdf_export = ExportResult(
            content=pdf_bytes, media_type="application/pdf", filename=f"{database.name}-Structure.pdf"
        )
        # 4. return pdf bytes to service for stateless streaming response
        return pdf_export
