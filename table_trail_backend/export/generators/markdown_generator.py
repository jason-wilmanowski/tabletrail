from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from table_trail_backend.core.exceptions import ExportMarkdownError
from table_trail_backend.export.generators.relations import build_foreign_key_relations
from table_trail_backend.schemas.export_schema import DatabaseExport


class MarkdownGenerator:
    @staticmethod
    def generate_markdown(database: DatabaseExport):
        base_directory = Path(__file__).resolve().parent.parent
        template_dir = base_directory / "templates"

        # trim/lstrip blocks: a `{% for %}` line must not leave a blank line
        # behind, since a blank line between rows ends a Markdown table
        env = Environment(loader=FileSystemLoader(template_dir), trim_blocks=True, lstrip_blocks=True)
        template = env.get_template("database_markdown.md.j2")

        generated_markdown = template.render(
            database=database,
            relations=build_foreign_key_relations(database),
            generated_at=datetime.now().isoformat(),
        )

        if not generated_markdown:
            raise ExportMarkdownError(message="An error occurred while generating markdown file", status_code=500)

        return generated_markdown
