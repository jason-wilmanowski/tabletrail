from table_trail_backend.export.generators.html_generator import HTMLGenerator
from table_trail_backend.export.generators.pdf_generator import PdfGenerator
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse


class PdfExport:

    def __init__(self, database: DatabaseStructureResponse):
        self.database = database
        self.pdf_gen = PdfGenerator()
        self.html_gen = HTMLGenerator()



    def run_export(self):

        # 1. generate dynamic html file with database structure
        html = self.html_gen.generate_html(database=self.database)

        # 2. generate pdf file as bytes with html
        pdf_bytes = self.pdf_gen.generate_pdf(html)

        # 3. return pdf bytes to service for stateless streaming response
        return pdf_bytes

