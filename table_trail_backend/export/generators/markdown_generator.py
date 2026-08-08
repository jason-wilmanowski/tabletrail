from datetime import datetime
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from table_trail_backend.core.exceptions import ExportMarkdownError
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse


class MarkdownGenerator:

    @staticmethod
    def generate_markdown(database: DatabaseStructureResponse):

        base_directory = Path(__file__).resolve().parent.parent
        template_dir = base_directory / "templates"

        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template('database_markdown.md.j2')

        generated_markdown = template.render(
            database=database,
            generated_at=datetime.now().isoformat()
        )

        if not generated_markdown:
            raise ExportMarkdownError(message="An error occurred while generating markdown file", status_code=500)

        return generated_markdown