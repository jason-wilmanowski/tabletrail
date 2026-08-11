from unittest.mock import MagicMock

import pytest

from table_trail_backend.core.exceptions import ExportMarkdownError
from table_trail_backend.export.generators.markdown_generator import MarkdownGenerator


def test_generate_markdown_success(monkeypatch):
    fake_database = MagicMock()

    fake_template = MagicMock()
    fake_template.render.return_value = "# Test Database"

    fake_environment = MagicMock()
    fake_environment.get_template.return_value = fake_template

    monkeypatch.setattr(
        "table_trail_backend.export.generators.markdown_generator.Environment",
        lambda **kwargs: fake_environment
    )

    result = MarkdownGenerator.generate_markdown(fake_database)

    assert result == "# Test Database"

    fake_environment.get_template.assert_called_once_with(
        "database_markdown.md.j2"
    )

    fake_template.render.assert_called_once()

    render_kwargs = fake_template.render.call_args.kwargs

    assert render_kwargs["database"] is fake_database
    assert "generated_at" in render_kwargs


def test_generate_markdown_empty_result(monkeypatch):
    fake_database = MagicMock()

    fake_template = MagicMock()
    fake_template.render.return_value = ""

    fake_environment = MagicMock()
    fake_environment.get_template.return_value = fake_template

    monkeypatch.setattr(
        "table_trail_backend.export.generators.markdown_generator.Environment",
        lambda **kwargs: fake_environment
    )

    with pytest.raises(ExportMarkdownError) as error:
        MarkdownGenerator.generate_markdown(fake_database)

    assert error.value.status_code == 500

    fake_environment.get_template.assert_called_once_with(
        "database_markdown.md.j2"
    )

    fake_template.render.assert_called_once()