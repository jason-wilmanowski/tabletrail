import sys
from unittest.mock import MagicMock

import pytest

from table_trail_backend.core.exceptions import ExportPdfError


@pytest.fixture
def pdf_generator(monkeypatch):
    fake_weasyprint = MagicMock()

    fake_html_class = MagicMock()
    fake_weasyprint.HTML = fake_html_class

    monkeypatch.setitem(
        sys.modules,
        "weasyprint",
        fake_weasyprint
    )

    from table_trail_backend.export.generators.pdf_generator import PdfGenerator

    return PdfGenerator, fake_html_class


def test_generate_pdf_success(pdf_generator):
    PdfGenerator, fake_html_class = pdf_generator

    fake_html = "<html><body>Test</body></html>"
    fake_pdf = b"fake-pdf-content"

    fake_html_instance = MagicMock()
    fake_html_instance.write_pdf.return_value = fake_pdf

    fake_html_class.return_value = fake_html_instance

    result = PdfGenerator.generate_pdf(fake_html)

    assert result == fake_pdf

    fake_html_class.assert_called_once_with(
        string=fake_html
    )

    fake_html_instance.write_pdf.assert_called_once_with()


def test_generate_pdf_empty_result(pdf_generator):
    PdfGenerator, fake_html_class = pdf_generator

    fake_html = "<html><body>Test</body></html>"

    fake_html_instance = MagicMock()
    fake_html_instance.write_pdf.return_value = b""

    fake_html_class.return_value = fake_html_instance

    with pytest.raises(ExportPdfError) as error:
        PdfGenerator.generate_pdf(fake_html)

    assert error.value.status_code == 500

    fake_html_class.assert_called_once_with(
        string=fake_html
    )

    fake_html_instance.write_pdf.assert_called_once_with()