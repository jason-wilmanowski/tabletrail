"""Renders the real Jinja templates (no mocked environment), so a template
referencing a field the schema doesn't have shows up as a failing test
instead of a silently empty cell in the export."""

import pytest

from table_trail_backend.core.enums import DBType
from table_trail_backend.export.generators.html_generator import HTMLGenerator
from table_trail_backend.export.generators.markdown_generator import MarkdownGenerator
from table_trail_backend.schemas.column_schema import ColumnResponse
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse
from table_trail_backend.schemas.table_schema import TableResponse


@pytest.fixture
def database():
    return DatabaseStructureResponse(
        id=1,
        name="Shop",
        db_type=DBType.POSTGRESQL,
        host="db.example.com",
        port=5432,
        db_name="shop_db",
        username="shop_user",
        tables=[
            TableResponse(
                id=1,
                name="users",
                schema_name="public",
                columns=[
                    ColumnResponse(
                        id=1,
                        name="email",
                        data_type="varchar",
                        is_nullable=False,
                        default_value="'none'",
                        ordinal_position=1,
                    ),
                    ColumnResponse(
                        id=2,
                        name="nickname",
                        data_type="text",
                        is_nullable=True,
                        default_value=None,
                        ordinal_position=2,
                    ),
                ],
                constraints=[],
            )
        ],
    )


def test_markdown_template_renders_database_fields(database):
    markdown = MarkdownGenerator.generate_markdown(database)

    assert "| Database Type | postgresql |" in markdown
    assert "| Database | shop_db |" in markdown


def test_markdown_template_renders_column_fields(database):
    markdown = MarkdownGenerator.generate_markdown(database)

    assert "| `email` | `varchar` | no | 'none' |" in markdown
    assert "| `nickname` | `text` | yes | — |" in markdown


def test_pdf_template_renders_database_type(database):
    html = HTMLGenerator.generate_html(database)

    assert "postgresql" in html
    assert "DBType" not in html


def test_markdown_template_keeps_table_rows_together(database):
    markdown = MarkdownGenerator.generate_markdown(database)

    assert "|---|---|---|---|\n| `email` | `varchar` | no | 'none' |\n| `nickname` | `text` | yes | — |\n" in markdown
