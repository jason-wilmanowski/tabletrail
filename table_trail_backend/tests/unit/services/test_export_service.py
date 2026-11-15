import sys
from unittest.mock import MagicMock

fake_weasyprint = MagicMock()
sys.modules["weasyprint"] = fake_weasyprint

from unittest.mock import AsyncMock, MagicMock

import pytest

from table_trail_backend.core.enums import DBType, ExportType
from table_trail_backend.core.exceptions import (
    DatabaseError,
    ExportRuntimeError,
    ExportTypeUnsupportedError,
)
from table_trail_backend.export.json_export import JsonExport
from table_trail_backend.export.markdown_export import MarkdownExport
from table_trail_backend.export.pdf_export import PdfExport
from table_trail_backend.schemas.export_schema import CreateExport, DatabaseExport
from table_trail_backend.services.export_service import ExportService

# -- execute_export() --


@pytest.mark.asyncio
async def test_execute_export_success():
    fake_db = AsyncMock()
    service = ExportService(fake_db)

    export_details = MagicMock(spec=CreateExport)
    export_details.database_id = 42
    export_details.export_type = ExportType.JSON
    export_details.include_connection_details = True

    fake_database_raw = MagicMock()
    fake_database = MagicMock(spec=DatabaseExport)
    fake_export_file = b"fake-export"

    service._prepare_export_data = AsyncMock(return_value=fake_database_raw)

    service._run_export = MagicMock(return_value=fake_export_file)

    original_validate = DatabaseExport.model_validate

    try:
        DatabaseExport.model_validate = MagicMock(return_value=fake_database)

        result = await service.execute_export(export_details)

    finally:
        DatabaseExport.model_validate = original_validate

    assert result == fake_export_file

    service._prepare_export_data.assert_awaited_once_with(42)

    service._run_export.assert_called_once_with(export_details, fake_database)


@pytest.mark.asyncio
async def test_execute_export_propagates_database_error():
    fake_db = AsyncMock()
    service = ExportService(fake_db)

    export_details = MagicMock(spec=CreateExport)
    export_details.database_id = 42

    service._prepare_export_data = AsyncMock(side_effect=DatabaseError(message="Database not found", status_code=404))

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
    export_details.include_connection_details = True

    fake_database_raw = MagicMock()
    fake_database = MagicMock(spec=DatabaseExport)

    service._prepare_export_data = AsyncMock(return_value=fake_database_raw)

    service._run_export = MagicMock(side_effect=ExportRuntimeError(message="Export failed", status_code=500))

    original_validate = DatabaseExport.model_validate

    try:
        DatabaseExport.model_validate = MagicMock(return_value=fake_database)

        with pytest.raises(ExportRuntimeError) as error:
            await service.execute_export(export_details)

    finally:
        DatabaseExport.model_validate = original_validate

    assert error.value.status_code == 500

    service._prepare_export_data.assert_awaited_once_with(42)

    service._run_export.assert_called_once_with(export_details, fake_database)


# -- include_connection_details --


def _make_database_raw():
    return DatabaseExport(
        id=1,
        name="Shop",
        db_type=DBType.POSTGRESQL,
        host="db.example.com",
        port=5432,
        db_name="shop_db",
        username="shop_user",
        tables=[],
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("include_connection_details", [False, True])
async def test_execute_export_connection_details(include_connection_details):
    service = ExportService(AsyncMock())
    service._prepare_export_data = AsyncMock(return_value=_make_database_raw())
    service._run_export = MagicMock(return_value=b"fake-export")

    export_details = CreateExport(
        database_id=1,
        export_type=ExportType.JSON,
        include_connection_details=include_connection_details,
    )

    await service.execute_export(export_details)

    database = service._run_export.call_args.args[1]
    connection = (database.host, database.port, database.db_name, database.username)
    if include_connection_details:
        assert connection == ("db.example.com", 5432, "shop_db", "shop_user")
    else:
        assert connection == (None, None, None, None)
    assert database.name == "Shop"
    assert database.db_type == DBType.POSTGRESQL


def test_create_export_leaves_connection_details_out_by_default():
    export_details = CreateExport(database_id=1, export_type=ExportType.JSON)

    assert export_details.include_connection_details is False


#
# -- _prepare_export_data() --


@pytest.mark.asyncio
async def test_prepare_export_data_success():
    fake_db = AsyncMock()
    service = ExportService(fake_db)

    fake_database = MagicMock()

    service.db_repo.get_full_database = AsyncMock(return_value=fake_database)

    result = await service._prepare_export_data(42)

    assert result == fake_database

    service.db_repo.get_full_database.assert_awaited_once_with(42)


@pytest.mark.asyncio
async def test_prepare_export_data_not_found():
    fake_db = AsyncMock()
    service = ExportService(fake_db)

    service.db_repo.get_full_database = AsyncMock(return_value=None)

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

    fake_database = MagicMock(spec=DatabaseExport)

    fake_exporter = MagicMock()
    fake_exporter.run_export.return_value = b"fake-file"

    service._get_export_type = MagicMock(return_value=fake_exporter)

    result = service._run_export(export_details, fake_database)

    assert result == b"fake-file"

    service._get_export_type.assert_called_once_with(ExportType.JSON)

    fake_exporter.run_export.assert_called_once_with(fake_database)


def test_run_export_runtime_error():
    fake_db = MagicMock()
    service = ExportService(fake_db)

    export_details = MagicMock(spec=CreateExport)
    export_details.export_type = ExportType.JSON

    fake_database = MagicMock(spec=DatabaseExport)

    fake_exporter = MagicMock()

    fake_exporter.run_export.side_effect = ExportRuntimeError(message="Export failed", status_code=500)

    service._get_export_type = MagicMock(return_value=fake_exporter)

    with pytest.raises(ExportRuntimeError) as error:
        service._run_export(export_details, fake_database)

    assert error.value.status_code == 500

    service._get_export_type.assert_called_once_with(ExportType.JSON)

    fake_exporter.run_export.assert_called_once_with(fake_database)


# -- _get_export_type() --


def test_get_export_type_json():
    fake_db = MagicMock()
    service = ExportService(fake_db)

    result = service._get_export_type(ExportType.JSON)

    assert isinstance(result, JsonExport)


def test_get_export_type_markdown():
    fake_db = MagicMock()
    service = ExportService(fake_db)

    result = service._get_export_type(ExportType.MARKDOWN)

    assert isinstance(result, MarkdownExport)


def test_get_export_type_pdf():
    fake_db = MagicMock()
    service = ExportService(fake_db)

    result = service._get_export_type(ExportType.PDF)

    assert isinstance(result, PdfExport)


def test_get_export_type_unsupported():
    fake_db = MagicMock()
    service = ExportService(fake_db)

    unsupported_type = MagicMock()

    with pytest.raises(ExportTypeUnsupportedError) as error:
        service._get_export_type(unsupported_type)

    assert error.value.status_code == 422
