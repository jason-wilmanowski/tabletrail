import pytest

from table_trail_backend.core.enums import ColumnRelationColor
from table_trail_backend.repositories.column_relation_repository import ColumnRelationRepository
from table_trail_backend.repositories.column_repository import ColumnRepository
from table_trail_backend.schemas.column_relation_schema import CreateColumnRelation, UpdateColumnRelation
from table_trail_backend.schemas.column_schema import CreateColumn


async def _make_column(db_session, table_id, name="col"):
    column_repo = ColumnRepository(db_session)
    return await column_repo.create_column(
        table_id, CreateColumn(name=name, data_type="varchar", is_nullable=False, ordinal_position=1)
    )


# -- Create Column Relation --


@pytest.mark.asyncio
async def test_create_column_relation_persists(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    column_1 = await _make_column(db_session, table.id, "id")
    column_2 = await _make_column(db_session, table.id, "user_id")
    repo = ColumnRelationRepository(db_session)

    relation = await repo.create_column_relation(
        database.id, CreateColumnRelation(column_id_1=column_1.id, column_id_2=column_2.id)
    )

    assert relation.id is not None
    assert relation.database_id == database.id
    assert relation.column_id_1 == column_1.id
    assert relation.column_id_2 == column_2.id
    assert relation.relation_color == ColumnRelationColor.GREEN


# -- Get By Id --


@pytest.mark.asyncio
async def test_get_column_relation_by_id_found(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    column_1 = await _make_column(db_session, table.id, "id")
    column_2 = await _make_column(db_session, table.id, "user_id")
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(
        database.id, CreateColumnRelation(column_id_1=column_1.id, column_id_2=column_2.id)
    )

    result = await repo.get_column_relation_by_id(database.id, relation.id)

    assert result is not None
    assert result.id == relation.id


@pytest.mark.asyncio
async def test_get_column_relation_by_id_wrong_database_returns_none(db_session, make_database, make_table):
    database = await make_database(name="db one", db_name="db_one")
    other_database = await make_database(name="db two", db_name="db_two")
    table = await make_table(database.id)
    column_1 = await _make_column(db_session, table.id, "id")
    column_2 = await _make_column(db_session, table.id, "user_id")
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(
        database.id, CreateColumnRelation(column_id_1=column_1.id, column_id_2=column_2.id)
    )

    result = await repo.get_column_relation_by_id(other_database.id, relation.id)

    assert result is None


# -- Get Database Column Relations --


@pytest.mark.asyncio
async def test_get_database_column_relations_scoped_to_database(db_session, make_database, make_table):
    database = await make_database(name="db one", db_name="db_one")
    other_database = await make_database(name="db two", db_name="db_two")
    table = await make_table(database.id)
    other_table = await make_table(other_database.id)
    column_1 = await _make_column(db_session, table.id, "id")
    column_2 = await _make_column(db_session, table.id, "user_id")
    other_column_1 = await _make_column(db_session, other_table.id, "id")
    other_column_2 = await _make_column(db_session, other_table.id, "user_id")
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(
        database.id, CreateColumnRelation(column_id_1=column_1.id, column_id_2=column_2.id)
    )
    await repo.create_column_relation(
        other_database.id, CreateColumnRelation(column_id_1=other_column_1.id, column_id_2=other_column_2.id)
    )

    result = await repo.get_database_column_relations(database.id)

    assert [row.id for row in result] == [relation.id]


# -- Get By Columns --


@pytest.mark.asyncio
async def test_get_column_relation_by_columns_found(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    column_1 = await _make_column(db_session, table.id, "id")
    column_2 = await _make_column(db_session, table.id, "user_id")
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(
        database.id, CreateColumnRelation(column_id_1=column_1.id, column_id_2=column_2.id)
    )

    result = await repo.get_column_relation_by_columns(column_1.id, column_2.id)

    assert result is not None
    assert result.id == relation.id


@pytest.mark.asyncio
async def test_get_column_relation_by_columns_not_found(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    column_1 = await _make_column(db_session, table.id, "id")
    column_2 = await _make_column(db_session, table.id, "user_id")
    repo = ColumnRelationRepository(db_session)

    result = await repo.get_column_relation_by_columns(column_1.id, column_2.id)

    assert result is None


# -- Update --


@pytest.mark.asyncio
async def test_update_column_relation_changes_provided_fields_only(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    column_1 = await _make_column(db_session, table.id, "id")
    column_2 = await _make_column(db_session, table.id, "user_id")
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(
        database.id, CreateColumnRelation(column_id_1=column_1.id, column_id_2=column_2.id, description="old")
    )

    updated = await repo.update_column_relation(
        database.id, relation.id, UpdateColumnRelation(relation_color=ColumnRelationColor.RED)
    )

    assert updated.relation_color == ColumnRelationColor.RED
    assert updated.description == "old"


# -- Delete --


@pytest.mark.asyncio
async def test_delete_column_relation_removes_row(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    column_1 = await _make_column(db_session, table.id, "id")
    column_2 = await _make_column(db_session, table.id, "user_id")
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(
        database.id, CreateColumnRelation(column_id_1=column_1.id, column_id_2=column_2.id)
    )

    await repo.delete_column_relation(database.id, relation.id)

    assert await repo.get_column_relation_by_id(database.id, relation.id) is None
