from unittest.mock import MagicMock

import pytest

from table_trail_backend.core.exceptions import ExportMarkdownError
from table_trail_backend.export.markdown_export import MarkdownExport


def test_run_export_whitespace_only_markdown():
    export = MarkdownExport()
    export.markdown_gen = MagicMock()
    export.markdown_gen.generate_markdown.return_value = "   \n"

    with pytest.raises(ExportMarkdownError) as error:
        export.run_export(MagicMock())

    assert error.value.status_code == 500
    assert error.value.message == "Generated markdown file is empty"
