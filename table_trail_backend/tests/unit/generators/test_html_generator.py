from unittest.mock import MagicMock

import pytest

from table_trail_backend.core.exceptions import ExportPdfError
from table_trail_backend.export.generators.html_generator import HTMLGenerator


def test_generate_html_success(monkeypatch):
    fake_database = MagicMock()

    fake_template = MagicMock()
    fake_template.render.return_value = "<html>Test</html>"

    fake_environment = MagicMock()
    fake_environment.get_template.return_value = fake_template

    monkeypatch.setattr(
        "table_trail_backend.export.generators.html_generator.Environment", lambda **kwargs: fake_environment
    )

    result = HTMLGenerator.generate_html(fake_database)

    assert result == "<html>Test</html>"

    fake_environment.get_template.assert_called_once_with("database_pdf.html")

    fake_template.render.assert_called_once()

    render_kwargs = fake_template.render.call_args.kwargs

    assert render_kwargs["database"] is fake_database
    assert "generated_at" in render_kwargs


def test_generate_html_empty_result(monkeypatch):
    fake_database = MagicMock()

    fake_template = MagicMock()
    fake_template.render.return_value = ""

    fake_environment = MagicMock()
    fake_environment.get_template.return_value = fake_template

    monkeypatch.setattr(
        "table_trail_backend.export.generators.html_generator.Environment", lambda **kwargs: fake_environment
    )

    with pytest.raises(ExportPdfError) as error:
        HTMLGenerator.generate_html(fake_database)

    assert error.value.status_code == 500
