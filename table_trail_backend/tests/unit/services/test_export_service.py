import sys
from unittest.mock import MagicMock

fake_weasyprint = MagicMock()
sys.modules["weasyprint"] = fake_weasyprint

import pytest
from unittest.mock import AsyncMock, MagicMock

from table_trail_backend.services.export_service import ExportService
from table_trail_backend.export.json_export import JsonExport
from table_trail_backend.export.markdown_export import MarkdownExport
from table_trail_backend.export.pdf_export import PdfExport

from table_trail_backend.schemas.export_schema import CreateExport
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse

from table_trail_backend.core.enums import ExportType

from table_trail_backend.core.exceptions import (
    DatabaseError,
    ExportRuntimeError,
    ExportTypeUnsupportedError,
)



# -- execute_export() --


@pytest.mark.asyncio
async def test_execute_export_success():
    fake_db = AsyncMock()
    service = ExportService(fake_db)

    export_details = MagicMock(spec=CreateExport)
    export_details.database_id = 42
    export_details.export_type = ExportType.JSON

    fake_database_raw = MagicMock()
    fake_database = MagicMock(spec=DatabaseStructureResponse)
    fake_export_file = b"fake-export"

    service._prepare_export_data = AsyncMock(
        return_value=fake_database_raw
    )

    service._run_export = MagicMock(
        return_value=fake_export_file
    )

    original_validate = DatabaseStructureResponse.model_validate

    try:
        DatabaseStructureResponse.model_validate = MagicMock(
            return_value=fake_database
        )

        result = await service.execute_export(export_details)

    finally:
        DatabaseStructureResponse.model_validate = original_validate

    assert result == fake_export_file

    service._prepare_export_data.assert_awaited_once_with(42)

    service._run_export.assert_called_once_with(
        export_details,
        fake_database
    )


@pytest.mark.asyncio
async def test_execute_export_propagates_database_error():
    fake_db = AsyncMock()
    service = ExportService(fake_db)

    export_details = MagicMock(spec=CreateExport)
    export_details.database_id = 42

    service._prepare_export_data = AsyncMock(
        side_effect=DatabaseError(
            message="Database not found",
            status_code=404
        )
    )

    with pytest.raises(DatabaseError) as error:
        await service.execute_export(export_details)

    assert error.value.status_code == 404

    service._prepare_export_data.assert_awaited_once_with(42)


@pytest.mark.asyncio
async def test_execute_export_propagates_export_error():
    fake_db = AsyncMock()
    service = ExportService(fake_db)

    export_details = MagicMock(spec=CreateExport)
    export_details.database_id = 42

    fake_database_raw = MagicMock()
    fake_database = MagicMock(spec=DatabaseStructureResponse)

    service._prepare_export_data = AsyncMock(
        return_value=fake_database_raw
    )

    service._run_export = MagicMock(
        side_effect=ExportRuntimeError(
            message="Export failed",
            status_code=500
        )
    )

    original_validate = DatabaseStructureResponse.model_validate

    try:
        DatabaseStructureResponse.model_validate = MagicMock(
            return_value=fake_database
        )

        with pytest.raises(ExportRuntimeError) as error:
            await service.execute_export(export_details)

    finally:
        DatabaseStructureResponse.model_validate = original_validate

    assert error.value.status_code == 500

    service._prepare_export_data.assert_awaited_once_with(42)

    service._run_export.assert_called_once_with(
        export_details,
        fake_database
    )


#
# -- _prepare_export_data() --


@pytest.mark.asyncio
async def test_prepare_export_data_success():
    fake_db = AsyncMock()
    service = ExportService(fake_db)

    fake_database = MagicMock()

    service.db_repo.get_full_database = AsyncMock(
        return_value=fake_database
    )

    result = await service._prepare_export_data(42)

    assert result == fake_database

    service.db_repo.get_full_database.assert_awaited_once_with(42)


@pytest.mark.asyncio
async def test_prepare_export_data_not_found():
    fake_db = AsyncMock()
    service = ExportService(fake_db)

    service.db_repo.get_full_database = AsyncMock(
        return_value=None
    )

    with pytest.raises(DatabaseError) as error:
        await service._prepare_export_data(42)

    assert error.value.status_code == 404

    service.db_repo.get_full_database.assert_awaited_once_with(42)



# -- _run_export() --


def test_run_export_success():
    fake_db = MagicMock()
    service = ExportService(fake_db)

    export_details = MagicMock(spec=CreateExport)
    export_details.export_type = ExportType.JSON

    fake_database = MagicMock(spec=DatabaseStructureResponse)

    fake_exporter = MagicMock()
    fake_exporter.run_export.return_value = b"fake-file"

    service._get_export_type = MagicMock(
        return_value=fake_exporter
    )

    result = service._run_export(
        export_details,
        fake_database
    )

    assert result == b"fake-file"

    service._get_export_type.assert_called_once_with(
        ExportType.JSON
    )

    fake_exporter.run_export.assert_called_once_with(
        fake_database
    )


def test_run_export_runtime_error():
    fake_db = MagicMock()
    service = ExportService(fake_db)

    export_details = MagicMock(spec=CreateExport)
    export_details.export_type = ExportType.JSON

    fake_database = MagicMock(spec=DatabaseStructureResponse)

    fake_exporter = MagicMock()

    fake_exporter.run_export.side_effect = ExportRuntimeError(
        message="Export failed",
        status_code=500
    )

    service._get_export_type = MagicMock(
        return_value=fake_exporter
    )

    with pytest.raises(ExportRuntimeError) as error:
        service._run_export(
            export_details,
            fake_database
        )

    assert error.value.status_code == 500

    service._get_export_type.assert_called_once_with(
        ExportType.JSON
    )

    fake_exporter.run_export.assert_called_once_with(
        fake_database
    )



# -- _get_export_type() --


def test_get_export_type_json():
    fake_db = MagicMock()
    service = ExportService(fake_db)

    result = service._get_export_type(
        ExportType.JSON
    )

    assert isinstance(result, JsonExport)


def test_get_export_type_markdown():
    fake_db = MagicMock()
    service = ExportService(fake_db)

    result = service._get_export_type(
        ExportType.MARKDOWN
    )

    assert isinstance(result, MarkdownExport)


def test_get_export_type_pdf():
    fake_db = MagicMock()
    service = ExportService(fake_db)

    result = service._get_export_type(
        ExportType.PDF
    )

    assert isinstance(result, PdfExport)


def test_get_export_type_unsupported():
    fake_db = MagicMock()
    service = ExportService(fake_db)

    unsupported_type = MagicMock()

    with pytest.raises(ExportTypeUnsupportedError) as error:
        service._get_export_type(unsupported_type)

    assert error.value.status_code == 422