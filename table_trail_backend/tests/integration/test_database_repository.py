import pytest
from sqlalchemy import select

from table_trail_backend.core.enums import DBStatus, DBType
from table_trail_backend.db.models.databases import Databases
from table_trail_backend.db.models.tables import Tables
from table_trail_backend.repositories.column_repository import ColumnRepository
from table_trail_backend.repositories.constraint_repository import ConstraintsRepository
from table_trail_backend.repositories.database_repository import DatabasesRepository
from table_trail_backend.schemas.column_schema import CreateColumn
from table_trail_backend.schemas.constraint_schema import CreateConstraint
from table_trail_backend.schemas.database_schema import CreateDatabaseInternal, UpdateDatabase

# -- Create --


@pytest.mark.asyncio
async def test_create_persists_database(db_session):
    repo = DatabasesRepository(db_session)

    created = await repo.create(
        CreateDatabaseInternal(
            name="Shop DB",
            db_type=DBType.POSTGRESQL,
            host="localhost",
            port=5432,
            db_name="shop",
            username="user",
            password="secret",
            status=DBStatus.READY,
        )
    )

    assert created.id is not None

    fetched = await db_session.execute(select(Databases).where(Databases.id == created.id))
    row = fetched.scalar_one()
    assert row.name == "Shop DB"
    assert row.db_type == DBType.POSTGRESQL
    assert row.status == DBStatus.READY


# -- Get One --


@pytest.mark.asyncio
async def test_get_one_database_found(db_session, make_database):
    database = await make_database()
    repo = DatabasesRepository(db_session)

    result = await repo.get_one_database(database.id)

    assert result is not None
    assert result.id == database.id


@pytest.mark.asyncio
async def test_get_one_database_not_found(db_session):
    repo = DatabasesRepository(db_session)

    result = await repo.get_one_database(9999)

    assert result is None


# -- Get All --


@pytest.mark.asyncio
async def test_get_all_databases_returns_every_row(db_session, make_database):
    first = await make_database(name="First")
    second = await make_database(name="Second", db_name="second_db")
    repo = DatabasesRepository(db_session)

    result = await repo.get_all_databases()

    assert {row.id for row in result} == {first.id, second.id}


@pytest.mark.asyncio
async def test_get_all_databases_empty(db_session):
    repo = DatabasesRepository(db_session)

    result = await repo.get_all_databases()

    assert list(result) == []


# -- Get By Connection --


@pytest.mark.asyncio
async def test_get_database_by_connection_match(db_session, make_database):
    database = await make_database(host="db.internal", port=5432, db_name="shop")
    repo = DatabasesRepository(db_session)

    result = await repo.get_database_by_connection("db.internal", 5432, "shop")

    assert result is not None
    assert result.id == database.id


@pytest.mark.asyncio
async def test_get_database_by_connection_no_match(db_session, make_database):
    await make_database(host="db.internal", port=5432, db_name="shop")
    repo = DatabasesRepository(db_session)

    result = await repo.get_database_by_connection("other.internal", 5432, "shop")

    assert result is None


# -- Get Full Database (eager loading) --


@pytest.mark.asyncio
async def test_get_full_database_loads_tables_columns_and_constraints(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id, name="users")

    column_repo = ColumnRepository(db_session)
    column = await column_repo.create_column(
        table.id,
        CreateColumn(name="id", data_type="integer", is_nullable=False, ordinal_position=1),
    )

    constraint_repo = ConstraintsRepository(db_session)
    constraint = await constraint_repo.create_constraint(
        table.id,
        CreateConstraint(constraint_type="PRIMARY KEY", constraint_name="pk_users"),
    )
    await constraint_repo.create_column_constraint(column.id, constraint.id)

    repo = DatabasesRepository(db_session)
    result = await repo.get_full_database(database.id)

    assert result is not None
    assert len(result.tables) == 1
    assert result.tables[0].id == table.id
    assert len(result.tables[0].columns) == 1
    assert result.tables[0].columns[0].id == column.id
    assert len(result.tables[0].constraints) == 1
    assert result.tables[0].constraints[0].column_names == ["id"]


@pytest.mark.asyncio
async def test_get_full_database_not_found(db_session):
    repo = DatabasesRepository(db_session)

    result = await repo.get_full_database(9999)

    assert result is None


# -- Update --


@pytest.mark.asyncio
async def test_update_changes_only_provided_fields(db_session, make_database):
    database = await make_database(name="Old Name", host="old-host")
    repo = DatabasesRepository(db_session)

    updated = await repo.update(database.id, UpdateDatabase(name="New Name"))

    assert updated.name == "New Name"
    assert updated.host == "old-host"


# -- Delete --


@pytest.mark.asyncio
async def test_delete_database_cascades_to_tables(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    repo = DatabasesRepository(db_session)

    await repo.delete_database(database.id)

    assert await repo.get_one_database(database.id) is None
    remaining_tables = await db_session.execute(select(Tables).where(Tables.id == table.id))
    assert remaining_tables.scalar_one_or_none() is None
