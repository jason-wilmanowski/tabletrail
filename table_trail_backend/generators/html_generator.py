from datetime import datetime
from jinja2 import Environment, FileSystemLoader

from table_trail_backend.core.exceptions import ExportPdfError
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse


class HTMLGenerator:

    @staticmethod
    def generate_html(database: DatabaseStructureResponse):

        env = Environment(loader=FileSystemLoader('templates'))
        template = env.get_template('generated/pdf.html')

        generated_html = template.render(
            database=database,
            generated_at=datetime.now().isoformat()
        )

        if not generated_html:
            raise ExportPdfError(message="An error occurred while generating HTML for PDF", status_code=500)

        return generated_html