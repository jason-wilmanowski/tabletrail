import pytest
from sqlalchemy.exc import IntegrityError

from table_trail_backend.repositories.column_repository import ColumnRepository
from table_trail_backend.schemas.column_schema import CreateColumn, UpdateColumn

# -- Create --


@pytest.mark.asyncio
async def test_create_column_persists(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    repo = ColumnRepository(db_session)

    column = await repo.create_column(
        table.id,
        CreateColumn(name="email", data_type="varchar", is_nullable=False, ordinal_position=1),
    )

    assert column.id is not None
    assert column.name == "email"
    assert column.table_id == table.id


@pytest.mark.asyncio
async def test_create_column_duplicate_name_in_table_raises(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    repo = ColumnRepository(db_session)

    await repo.create_column(
        table.id, CreateColumn(name="email", data_type="varchar", is_nullable=False, ordinal_position=1)
    )

    with pytest.raises(IntegrityError):
        await repo.create_column(
            table.id, CreateColumn(name="email", data_type="text", is_nullable=True, ordinal_position=2)
        )


# -- Get By Id --


@pytest.mark.asyncio
async def test_get_column_by_id_found(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    repo = ColumnRepository(db_session)
    column = await repo.create_column(
        table.id, CreateColumn(name="id", data_type="integer", is_nullable=False, ordinal_position=1)
    )

    result = await repo.get_column_by_id(table.id, column.id)

    assert result is not None
    assert result.id == column.id


@pytest.mark.asyncio
async def test_get_column_by_id_wrong_table_returns_none(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id, name="users")
    other_table = await make_table(database.id, name="orders")
    repo = ColumnRepository(db_session)
    column = await repo.create_column(
        table.id, CreateColumn(name="id", data_type="integer", is_nullable=False, ordinal_position=1)
    )

    result = await repo.get_column_by_id(other_table.id, column.id)

    assert result is None


# -- Get Table Columns --


@pytest.mark.asyncio
async def test_get_table_columns_scoped_to_table(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id, name="users")
    other_table = await make_table(database.id, name="orders")
    repo = ColumnRepository(db_session)
    column = await repo.create_column(
        table.id, CreateColumn(name="id", data_type="integer", is_nullable=False, ordinal_position=1)
    )
    await repo.create_column(
        other_table.id, CreateColumn(name="id", data_type="integer", is_nullable=False, ordinal_position=1)
    )

    result = await repo.get_table_columns(table.id)

    assert [row.id for row in result] == [column.id]


# -- Search --


@pytest.mark.asyncio
async def test_search_by_name_scoped_to_database_case_insensitive(db_session, make_database, make_table):
    database = await make_database()
    other_database = await make_database(name="Other", db_name="other_db")
    table = await make_table(database.id, name="users")
    other_table = await make_table(other_database.id, name="users")
    repo = ColumnRepository(db_session)
    column = await repo.create_column(
        table.id, CreateColumn(name="email_address", data_type="varchar", is_nullable=False, ordinal_position=1)
    )
    await repo.create_column(
        other_table.id, CreateColumn(name="email_address", data_type="varchar", is_nullable=False, ordinal_position=1)
    )

    result = await repo.search_by_name(database.id, "EMAIL")

    assert [row.id for row in result] == [column.id]


# -- Update --


@pytest.mark.asyncio
async def test_update_column_changes_provided_fields_only(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    repo = ColumnRepository(db_session)
    column = await repo.create_column(
        table.id, CreateColumn(name="id", data_type="integer", is_nullable=False, ordinal_position=1)
    )

    updated = await repo.update_column(table.id, column.id, UpdateColumn(data_type="bigint"))

    assert updated.data_type == "bigint"
    assert updated.name == "id"


# -- Delete --


@pytest.mark.asyncio
async def test_delete_column_removes_row(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    repo = ColumnRepository(db_session)
    column = await repo.create_column(
        table.id, CreateColumn(name="id", data_type="integer", is_nullable=False, ordinal_position=1)
    )

    await repo.delete_column(table.id, column.id)

    assert await repo.get_column_by_id(table.id, column.id) is None
