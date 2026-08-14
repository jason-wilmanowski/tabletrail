import sys
from unittest.mock import MagicMock
import pytest
from table_trail_backend.core.exceptions import ExportPdfError


@pytest.fixture
def pdf_generator(monkeypatch):
    fake_weasyprint = MagicMock()

    monkeypatch.setitem(
        sys.modules,
        "weasyprint",
        fake_weasyprint
    )

    sys.modules.pop(
        "table_trail_backend.export.generators.pdf_generator",
        None
    )

    from table_trail_backend.export.generators.pdf_generator import PdfGenerator

    return PdfGenerator, fake_weasyprint.HTML


def test_generate_pdf_success(pdf_generator):
    PdfGenerator, mock_html = pdf_generator

    fake_html = "<html><body>Test</body></html>"
    fake_pdf = b"fake-pdf-content"

    mock_html.return_value.write_pdf.return_value = fake_pdf

    result = PdfGenerator.generate_pdf(fake_html)

    assert result == fake_pdf

    mock_html.assert_called_once_with(string=fake_html)
    mock_html.return_value.write_pdf.assert_called_once_with()