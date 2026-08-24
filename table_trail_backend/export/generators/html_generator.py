from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from table_trail_backend.core.exceptions import ExportHtmlError
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse


class HTMLGenerator:
    @staticmethod
    def generate_html(database: DatabaseStructureResponse):
        base_directory = Path(__file__).resolve().parent.parent
        template_dir = base_directory / "templates"

        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template("database_pdf.html")

        generated_html = template.render(database=database, generated_at=datetime.now().isoformat())

        if not generated_html:
            raise ExportHtmlError(message="An error occurred while generating HTML for PDF", status_code=500)

        return generated_html
