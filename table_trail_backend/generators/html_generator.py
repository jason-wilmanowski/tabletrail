from datetime import datetime
from jinja2 import Environment, FileSystemLoader

from table_trail_backend.core.exceptions import ExportPdfError
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse


class PdfExport:

    def __init__(self, database: DatabaseStructureResponse ):

        self.database = database



    def generate_pdf(self):

        env = Environment(loader=FileSystemLoader('templates'))
        template = env.get_template('generated/pdf.html')

        generated_html = template.render(
            database=self.database,
            generated_at=datetime.now().isoformat()
        )

        if not generated_html:
            raise ExportPdfError(message="An error occurred while generate PDF file", status_code=500)

        return generated_html