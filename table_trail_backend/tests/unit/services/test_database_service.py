from unittest.mock import AsyncMock, MagicMock
import pytest
from table_trail_backend.core.enums import DBType, DBStatus
from table_trail_backend.core.exceptions import DatabaseError, DatabaseSystemError
from table_trail_backend.schemas.database_schema import UpdateDatabase
from table_trail_backend.services.database_service import DatabaseService


# -- Get Full Database Tests --

@pytest.mark.asyncio
async def test_get_full_database_success():

    fake_db = AsyncMock()
    fake_database = MagicMock()

    service = DatabaseService(fake_db)

    service.db_repo.get_full_database = AsyncMock(
        return_value=fake_database
    )

    result = await service.get_full_database(42)

    service.db_repo.get_full_database.assert_awaited_with(42)
    assert result is fake_database

@pytest.mark.asyncio
async def test_get_full_database_not_found():

    fake_db = AsyncMock()

    service = DatabaseService(fake_db)

    service.db_repo.get_full_database = AsyncMock(
        return_value=None
    )

    with pytest.raises(DatabaseSystemError) as error:
        await service.get_full_database(42)
    assert error.value.status_code == 404

    service.db_repo.get_full_database.assert_awaited_once_with(42)


# -- Get all Databases Test --

@pytest.mark.asyncio
async def test_get_all_databases():

    fake_db = AsyncMock()

    service = DatabaseService(fake_db)

    service.db_repo.get_all_databases = AsyncMock(
        return_value=[]
    )

    result = await service.get_all_databases()

    service.db_repo.get_all_databases.assert_awaited_once_with()
    assert result == []


# -- Update Database Tests --

@pytest.mark.asyncio
async def test_update_database_success():
    fake_db = AsyncMock()
    service = DatabaseService(fake_db)

    update_data = UpdateDatabase(
        name = "Test Update Database",
        db_type = DBType.POSTGRESQL,
        host = "localhost",
        port = 5432,
        db_name = "Test Database",
        username = "Test User",
        password = "Test-Password",
        status = DBStatus.READY
    )

    fake_database = MagicMock()
    service.db_repo.get_one_database = AsyncMock(
        return_value=fake_database
    )

    service.db_repo.update = AsyncMock(
        return_value=update_data
    )

    result = await service.update_database(42, update_data)

    service.db_repo.get_one_database.assert_awaited_once_with(42)
    service.db_repo.update.assert_awaited_once_with(42, update_data)
    fake_db.commit.assert_awaited_once()
    assert result == update_data


# -- Search Database Components Tests --

@pytest.mark.asyncio
async def test_search_database_components_success():
    fake_db = AsyncMock()
    service = DatabaseService(fake_db)

    fake_database = MagicMock()

    fake_tables = [MagicMock(), MagicMock()]
    fake_schema_tables = [MagicMock()]
    fake_columns = [MagicMock(), MagicMock(), MagicMock()]

    service.db_repo.get_one_database = AsyncMock(
        return_value=fake_database
    )

    service.table_repo.search_by_name = AsyncMock(
        return_value=fake_tables
    )

    service.table_repo.search_by_schema_name = AsyncMock(
        return_value=fake_schema_tables
    )

    service.column_repo.search_by_name = AsyncMock(
        return_value=fake_columns
    )

    result = await service.search_database_components(42, "user")

    service.db_repo.get_one_database.assert_awaited_once_with(42)

    service.table_repo.search_by_name.assert_awaited_once_with(
        42, "user"
    )

    service.table_repo.search_by_schema_name.assert_awaited_once_with(
        42, "user"
    )

    service.column_repo.search_by_name.assert_awaited_once_with(
        42, "user"
    )

    assert result == {
        "tables": fake_tables,
        "schema_tables": fake_schema_tables,
        "columns": fake_columns,
    }

@pytest.mark.asyncio
async def test_search_database_components_not_found():
    fake_db = AsyncMock()
    service = DatabaseService(fake_db)

    service.db_repo.get_one_database = AsyncMock(
        return_value=None
    )

    service.table_repo.search_by_name = AsyncMock()
    service.table_repo.search_by_schema_name = AsyncMock()
    service.column_repo.search_by_name = AsyncMock()

    with pytest.raises(DatabaseError) as error:
        await service.search_database_components(42, "user")

    assert error.value.status_code == 404

    service.db_repo.get_one_database.assert_awaited_once_with(42)

    service.table_repo.search_by_name.assert_not_awaited()
    service.table_repo.search_by_schema_name.assert_not_awaited()
    service.column_repo.search_by_name.assert_not_awaited()



# -- Update Database Tests --
@pytest.mark.asyncio
async def test_update_database_not_found():

    fake_db = AsyncMock()
    service = DatabaseService(fake_db)

    update_data = UpdateDatabase(
        name="Test Update Database",
        db_type=DBType.POSTGRESQL,
        host="localhost",
        port=5432,
        db_name="Test Database",
        username="Test User",
        password="Test-Password",
        status=DBStatus.READY
    )

    service.db_repo.get_one_database = AsyncMock(
        return_value=None
    )
    service.db_repo.update = AsyncMock()

    with pytest.raises(DatabaseSystemError) as error:
        await service.update_database(42, update_data)

    service.db_repo.get_one_database.assert_awaited_once_with(42)
    service.db_repo.update.assert_not_awaited()
    fake_db.commit.assert_not_awaited()

@pytest.mark.asyncio
async def test_update_database_no_data():

    fake_db = AsyncMock()
    service = DatabaseService(fake_db)
    fake_database = MagicMock()

    update_data = UpdateDatabase(
        name=None,
        db_type=None,
        host=None,
        port=None,
        db_name=None,
        username=None,
        password=None,
        status=None
    )

    service.db_repo.get_one_database = AsyncMock(
        return_value=fake_database
    )
    service.db_repo.update = AsyncMock()

    with pytest.raises(DatabaseSystemError) as error:
        await service.update_database(42, update_data)

    service.db_repo.get_one_database.assert_not_awaited()
    service.db_repo.update.assert_not_awaited()
    fake_db.commit.assert_not_awaited()

    assert error.value.status_code == 400



# -- Delete Database Tests --

@pytest.mark.asyncio
async def test_delete_database_success():
    # fake dependencies
    fake_db = AsyncMock()
    fake_database = MagicMock()

    service = DatabaseService(fake_db)

    service.db_repo.get_one_database = AsyncMock(
        return_value=fake_database
    )
    service.db_repo.delete_database = AsyncMock()

    # execute service method
    await service.delete_database(42)

    # assert results
    service.db_repo.get_one_database.assert_awaited_once_with(42)
    service.db_repo.delete_database.assert_awaited_once_with(42)
    fake_db.commit.assert_awaited_once()

@pytest.mark.asyncio
async def test_delete_database_not_found():
    # Arrange
    fake_db = AsyncMock()

    service = DatabaseService(fake_db)

    service.db_repo.get_one_database = AsyncMock(
        return_value=None
    )
    service.db_repo.delete_database = AsyncMock()

    # Act & Assert
    with pytest.raises(DatabaseSystemError) as error:
        await service.delete_database(42)

    assert error.value.status_code == 404

    service.db_repo.get_one_database.assert_awaited_once_with(42)
    service.db_repo.delete_database.assert_not_awaited()
    fake_db.commit.assert_not_awaited()