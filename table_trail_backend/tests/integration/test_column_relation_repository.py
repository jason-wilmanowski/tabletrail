import pytest

from table_trail_backend.core.enums import ColumnRelationColor
from table_trail_backend.repositories.column_relation_repository import ColumnRelationRepository
from table_trail_backend.schemas.column_relation_schema import CreateColumnRelation, UpdateColumnRelation


def _relation_data(**overrides) -> CreateColumnRelation:
    defaults = {
        "schema_name_1": "public",
        "schema_name_2": "public",
        "table_name_1": "users",
        "column_name_1": "id",
        "table_name_2": "orders",
        "column_name_2": "user_id",
    }
    defaults.update(overrides)
    return CreateColumnRelation(**defaults)


# -- Create Column Relation --


@pytest.mark.asyncio
async def test_create_column_relation_persists(db_session, make_database):
    database = await make_database()
    repo = ColumnRelationRepository(db_session)

    relation = await repo.create_column_relation(database.id, _relation_data())

    assert relation.id is not None
    assert relation.database_id == database.id
    assert relation.schema_name_1 == "public"
    assert relation.schema_name_2 == "public"
    assert relation.table_name_1 == "users"
    assert relation.column_name_1 == "id"
    assert relation.table_name_2 == "orders"
    assert relation.column_name_2 == "user_id"
    assert relation.relation_color == ColumnRelationColor.GREEN


# -- Get By Id --


@pytest.mark.asyncio
async def test_get_column_relation_by_id_found(db_session, make_database):
    database = await make_database()
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(database.id, _relation_data())

    result = await repo.get_column_relation_by_id(database.id, relation.id)

    assert result is not None
    assert result.id == relation.id


@pytest.mark.asyncio
async def test_get_column_relation_by_id_wrong_database_returns_none(db_session, make_database):
    database = await make_database(name="db one", db_name="db_one")
    other_database = await make_database(name="db two", db_name="db_two")
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(database.id, _relation_data())

    result = await repo.get_column_relation_by_id(other_database.id, relation.id)

    assert result is None


# -- Get Database Column Relations --


@pytest.mark.asyncio
async def test_get_database_column_relations_scoped_to_database(db_session, make_database):
    database = await make_database(name="db one", db_name="db_one")
    other_database = await make_database(name="db two", db_name="db_two")
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(database.id, _relation_data())
    await repo.create_column_relation(other_database.id, _relation_data())

    result = await repo.get_database_column_relations(database.id)

    assert [row.id for row in result] == [relation.id]


# -- Get By Endpoints --


@pytest.mark.asyncio
async def test_get_column_relation_by_endpoints_found(db_session, make_database):
    database = await make_database()
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(database.id, _relation_data())

    result = await repo.get_column_relation_by_endpoints(
        database.id, "public", "users", "id", "public", "orders", "user_id"
    )

    assert result is not None
    assert result.id == relation.id


@pytest.mark.asyncio
async def test_get_column_relation_by_endpoints_matches_reversed_direction(db_session, make_database):
    database = await make_database()
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(database.id, _relation_data())

    result = await repo.get_column_relation_by_endpoints(
        database.id, "public", "orders", "user_id", "public", "users", "id"
    )

    assert result is not None
    assert result.id == relation.id


@pytest.mark.asyncio
async def test_get_column_relation_by_endpoints_scoped_to_database(db_session, make_database):
    database = await make_database(name="db one", db_name="db_one")
    other_database = await make_database(name="db two", db_name="db_two")
    repo = ColumnRelationRepository(db_session)
    await repo.create_column_relation(database.id, _relation_data())

    result = await repo.get_column_relation_by_endpoints(
        other_database.id, "public", "users", "id", "public", "orders", "user_id"
    )

    assert result is None


@pytest.mark.asyncio
async def test_get_column_relation_by_endpoints_scoped_to_schema(db_session, make_database):
    database = await make_database()
    repo = ColumnRelationRepository(db_session)
    await repo.create_column_relation(database.id, _relation_data())

    result = await repo.get_column_relation_by_endpoints(
        database.id, "billing", "users", "id", "public", "orders", "user_id"
    )

    assert result is None


@pytest.mark.asyncio
async def test_get_column_relation_by_endpoints_matches_cross_schema_relation(db_session, make_database):
    database = await make_database()
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(database.id, _relation_data(schema_name_2="billing"))

    found = await repo.get_column_relation_by_endpoints(
        database.id, "billing", "orders", "user_id", "public", "users", "id"
    )
    other_schema = await repo.get_column_relation_by_endpoints(
        database.id, "public", "users", "id", "public", "orders", "user_id"
    )

    assert found is not None
    assert found.id == relation.id
    assert other_schema is None


@pytest.mark.asyncio
async def test_get_column_relation_by_endpoints_not_found(db_session, make_database):
    database = await make_database()
    repo = ColumnRelationRepository(db_session)
    await repo.create_column_relation(database.id, _relation_data())

    result = await repo.get_column_relation_by_endpoints(database.id, "public", "users", "id", "public", "orders", "id")

    assert result is None


# -- Update --


@pytest.mark.asyncio
async def test_update_column_relation_changes_provided_fields_only(db_session, make_database):
    database = await make_database()
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(database.id, _relation_data(description="old"))

    updated = await repo.update_column_relation(
        database.id, relation.id, UpdateColumnRelation(relation_color=ColumnRelationColor.RED)
    )

    assert updated.relation_color == ColumnRelationColor.RED
    assert updated.description == "old"
    assert updated.column_name_2 == "user_id"


# -- Delete --


@pytest.mark.asyncio
async def test_delete_column_relation_removes_row(db_session, make_database):
    database = await make_database()
    repo = ColumnRelationRepository(db_session)
    relation = await repo.create_column_relation(database.id, _relation_data())

    await repo.delete_column_relation(database.id, relation.id)

    assert await repo.get_column_relation_by_id(database.id, relation.id) is None


# -- Bulk Delete --


@pytest.mark.asyncio
async def test_delete_column_relations_removes_only_given_ids(db_session, make_database):
    database = await make_database()
    repo = ColumnRelationRepository(db_session)
    relation_1 = await repo.create_column_relation(database.id, _relation_data())
    relation_2 = await repo.create_column_relation(database.id, _relation_data(column_name_2="buyer_id"))
    kept = await repo.create_column_relation(database.id, _relation_data(column_name_2="seller_id"))

    await repo.delete_column_relations(database.id, [relation_1.id, relation_2.id])

    result = await repo.get_database_column_relations(database.id)
    assert [row.id for row in result] == [kept.id]


@pytest.mark.asyncio
async def test_delete_column_relations_ignores_ids_of_other_database(db_session, make_database):
    database = await make_database(name="db one", db_name="db_one")
    other_database = await make_database(name="db two", db_name="db_two")
    repo = ColumnRelationRepository(db_session)
    other_relation = await repo.create_column_relation(other_database.id, _relation_data())

    await repo.delete_column_relations(database.id, [other_relation.id])

    assert await repo.get_column_relation_by_id(other_database.id, other_relation.id) is not None
