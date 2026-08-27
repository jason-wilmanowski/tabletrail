import pytest
from sqlalchemy.exc import IntegrityError

from table_trail_backend.repositories.table_repository import TableRepository

# -- Create --


@pytest.mark.asyncio
async def test_create_table_persists(db_session, make_database):
    database = await make_database()
    repo = TableRepository(db_session)

    table = await repo.create_table(database.id, "orders", "public")

    assert table.id is not None
    assert table.name == "orders"
    assert table.schema_name == "public"
    assert table.database_id == database.id


@pytest.mark.asyncio
async def test_create_table_duplicate_name_in_schema_raises(db_session, make_database):
    database = await make_database()
    repo = TableRepository(db_session)

    await repo.create_table(database.id, "orders", "public")

    with pytest.raises(IntegrityError):
        await repo.create_table(database.id, "orders", "public")


# -- Get By Id --


@pytest.mark.asyncio
async def test_get_table_by_id_found(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    repo = TableRepository(db_session)

    result = await repo.get_table_by_id(database.id, table.id)

    assert result is not None
    assert result.id == table.id


@pytest.mark.asyncio
async def test_get_table_by_id_wrong_database_returns_none(db_session, make_database, make_table):
    database = await make_database()
    other_database = await make_database(name="Other", db_name="other_db")
    table = await make_table(database.id)
    repo = TableRepository(db_session)

    result = await repo.get_table_by_id(other_database.id, table.id)

    assert result is None


# -- Get Database Tables --


@pytest.mark.asyncio
async def test_get_database_tables_scoped_to_database(db_session, make_database, make_table):
    database = await make_database()
    other_database = await make_database(name="Other", db_name="other_db")
    table = await make_table(database.id, name="users")
    await make_table(other_database.id, name="orders")
    repo = TableRepository(db_session)

    result = await repo.get_database_tables(database.id)

    assert [row.id for row in result] == [table.id]


# -- Get By Name --


@pytest.mark.asyncio
async def test_get_table_by_name_found(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id, name="users")
    repo = TableRepository(db_session)

    result = await repo.get_table_by_name(database.id, "users")

    assert result is not None
    assert result.id == table.id


@pytest.mark.asyncio
async def test_get_table_by_name_not_found(db_session, make_database):
    database = await make_database()
    repo = TableRepository(db_session)

    result = await repo.get_table_by_name(database.id, "missing")

    assert result is None


# -- Search --


@pytest.mark.asyncio
async def test_search_by_name_case_insensitive_partial_match(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id, name="Customer_Orders")
    repo = TableRepository(db_session)

    result = await repo.search_by_name(database.id, "order")

    assert [row.id for row in result] == [table.id]


@pytest.mark.asyncio
async def test_search_by_schema_name_partial_match(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id, name="users", schema_name="analytics")
    await make_table(database.id, name="logs", schema_name="public")
    repo = TableRepository(db_session)

    result = await repo.search_by_schema_name(database.id, "analy")

    assert [row.id for row in result] == [table.id]


# -- Update --


@pytest.mark.asyncio
async def test_update_table_changes_name_and_schema(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id, name="old_name", schema_name="old_schema")
    repo = TableRepository(db_session)

    updated = await repo.update_table(database.id, table.id, name="new_name", schema_name="new_schema")

    assert updated.name == "new_name"
    assert updated.schema_name == "new_schema"


@pytest.mark.asyncio
async def test_update_table_partial_update_keeps_other_field(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id, name="old_name", schema_name="old_schema")
    repo = TableRepository(db_session)

    updated = await repo.update_table(database.id, table.id, name="new_name")

    assert updated.name == "new_name"
    assert updated.schema_name == "old_schema"


# -- Delete --


@pytest.mark.asyncio
async def test_delete_table_removes_row(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    repo = TableRepository(db_session)

    await repo.delete_table(database.id, table.id)

    assert await repo.get_table_by_id(database.id, table.id) is None
