from weasyprint import HTML
from table_trail_backend.core.exceptions import ExportPdfError

class PdfGenerator:

    @staticmethod
    def generate_pdf(html: str):

        pdf_bytes = HTML(string=html).write_pdf()

        if not pdf_bytes:
            raise ExportPdfError(message='An error occurred while PDF generation', status_code=500)

        return pdf_bytes