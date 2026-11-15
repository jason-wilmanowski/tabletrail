"""Renders the real Jinja templates (no mocked environment), so a template
referencing a field the schema doesn't have shows up as a failing test
instead of a silently empty cell in the export."""

import pytest

from table_trail_backend.core.enums import DBType
from table_trail_backend.export.generators.html_generator import HTMLGenerator
from table_trail_backend.export.generators.markdown_generator import MarkdownGenerator
from table_trail_backend.export.json_export import JsonExport
from table_trail_backend.schemas.column_schema import ColumnResponse
from table_trail_backend.schemas.export_schema import DatabaseExport
from table_trail_backend.schemas.table_schema import TableResponse


@pytest.fixture
def database():
    return DatabaseExport(
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


# -- connection details --

CONNECTION_VALUES = ["db.example.com", "5432", "shop_db", "shop_user"]


def _render_all_formats(database):
    return {
        "markdown": MarkdownGenerator.generate_markdown(database),
        "pdf": HTMLGenerator.generate_html(database),
        "json": JsonExport.run_export(database).content.decode("utf-8"),
    }


@pytest.mark.parametrize("export_format", ["markdown", "pdf", "json"])
def test_connection_details_included_when_present(database, export_format):
    output = _render_all_formats(database)[export_format]

    for value in CONNECTION_VALUES:
        assert value in output


@pytest.mark.parametrize("export_format", ["markdown", "pdf", "json"])
def test_connection_details_left_out_when_removed(database, export_format):
    output = _render_all_formats(database.without_connection_details())[export_format]

    for value in CONNECTION_VALUES:
        assert value not in output
    for label in ["Host", "Port", "Username"]:
        assert label not in output
    # the rest of the export is unaffected
    assert "Shop" in output
    assert "postgresql" in output


def test_json_export_omits_connection_keys_instead_of_null(database):
    content = JsonExport.run_export(database.without_connection_details()).content.decode("utf-8")

    for key in ["host", "port", "db_name", "username"]:
        assert f'"{key}"' not in content
