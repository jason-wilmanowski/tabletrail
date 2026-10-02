from unittest.mock import AsyncMock, MagicMock, call

import pytest

from table_trail_backend.core.exceptions import ColumnRelationError, DatabaseError
from table_trail_backend.schemas.column_relation_schema import CreateColumnRelation, UpdateColumnRelation
from table_trail_backend.services.column_relation_service import ColumnRelationService

# -- Fixtures --


@pytest.fixture
def fake_db():
    return AsyncMock()


@pytest.fixture
def service(fake_db):
    service = ColumnRelationService(fake_db)
    service.databases_repo.get_one_database = AsyncMock(return_value=MagicMock())
    service.column_repo.column_exists = AsyncMock(return_value=True)
    service.column_rel_repo.get_column_relation_by_endpoints = AsyncMock(return_value=None)
    service.column_rel_repo.create_column_relation = AsyncMock()
    service.column_rel_repo.get_column_relation_by_id = AsyncMock()
    service.column_rel_repo.update_column_relation = AsyncMock()
    return service


def _create_data(**overrides) -> CreateColumnRelation:
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


def _stored_relation(relation_id: int = 7) -> MagicMock:
    relation = MagicMock()
    relation.id = relation_id
    relation.schema_name_1 = "public"
    relation.schema_name_2 = "public"
    relation.table_name_1 = "users"
    relation.column_name_1 = "id"
    relation.table_name_2 = "orders"
    relation.column_name_2 = "user_id"
    return relation


# -- Create Column Relation Tests --


@pytest.mark.asyncio
async def test_create_column_relation_success(service, fake_db):
    fake_column_relation = MagicMock()
    service.column_rel_repo.create_column_relation = AsyncMock(return_value=fake_column_relation)
    data = _create_data()

    result = await service.create_column_relation(42, data)

    service.databases_repo.get_one_database.assert_awaited_once_with(42)
    service.column_repo.column_exists.assert_has_awaits(
        [call(42, "public", "users", "id"), call(42, "public", "orders", "user_id")]
    )
    service.column_rel_repo.get_column_relation_by_endpoints.assert_awaited_once_with(
        42, "public", "users", "id", "public", "orders", "user_id"
    )
    service.column_rel_repo.create_column_relation.assert_awaited_once_with(42, data)
    fake_db.commit.assert_awaited_once()
    assert result is fake_column_relation


@pytest.mark.asyncio
async def test_create_column_relation_database_not_found(service, fake_db):
    service.databases_repo.get_one_database = AsyncMock(return_value=None)

    with pytest.raises(DatabaseError) as error:
        await service.create_column_relation(42, _create_data())

    assert error.value.status_code == 404

    service.column_repo.column_exists.assert_not_awaited()
    service.column_rel_repo.create_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_column_relation_same_column(service, fake_db):
    data = _create_data(table_name_2="users", column_name_2="id")

    with pytest.raises(ColumnRelationError) as error:
        await service.create_column_relation(42, data)

    assert error.value.status_code == 400

    service.column_repo.column_exists.assert_not_awaited()
    service.column_rel_repo.create_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_column_relation_same_column_name_in_different_tables_is_allowed(service, fake_db):
    data = _create_data(table_name_2="orders", column_name_2="id")

    await service.create_column_relation(42, data)

    service.column_rel_repo.create_column_relation.assert_awaited_once_with(42, data)


@pytest.mark.asyncio
async def test_create_column_relation_same_column_in_different_schemas_is_allowed(service, fake_db):
    data = _create_data(schema_name_2="billing", table_name_2="users", column_name_2="id")

    await service.create_column_relation(42, data)

    service.column_repo.column_exists.assert_has_awaits(
        [call(42, "public", "users", "id"), call(42, "billing", "users", "id")]
    )
    service.column_rel_repo.create_column_relation.assert_awaited_once_with(42, data)


@pytest.mark.asyncio
async def test_create_column_relation_column_not_found(service, fake_db):
    # first endpoint exists, second doesn't
    service.column_repo.column_exists = AsyncMock(side_effect=[True, False])

    with pytest.raises(ColumnRelationError) as error:
        await service.create_column_relation(42, _create_data())

    assert error.value.status_code == 404
    assert "public.orders.user_id" in error.value.message

    service.column_rel_repo.create_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_column_relation_already_exists(service, fake_db):
    service.column_rel_repo.get_column_relation_by_endpoints = AsyncMock(return_value=_stored_relation())

    with pytest.raises(ColumnRelationError) as error:
        await service.create_column_relation(42, _create_data())

    assert error.value.status_code == 400

    service.column_rel_repo.create_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


# -- Get Column Relation By Id Tests --


@pytest.mark.asyncio
async def test_get_column_relation_by_id_success():
    fake_db = AsyncMock()
    fake_column_relation = MagicMock()
    service = ColumnRelationService(fake_db)

    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=fake_column_relation)

    result = await service.get_column_relation_by_id(42, 7)

    service.column_rel_repo.get_column_relation_by_id.assert_awaited_once_with(42, 7)
    assert result is fake_column_relation


@pytest.mark.asyncio
async def test_get_column_relation_by_id_not_found():
    fake_db = AsyncMock()
    service = ColumnRelationService(fake_db)

    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=None)

    with pytest.raises(ColumnRelationError) as error:
        await service.get_column_relation_by_id(42, 7)

    assert error.value.status_code == 404


# -- Get Database Column Relations Tests --


@pytest.mark.asyncio
async def test_get_database_column_relations():
    fake_db = AsyncMock()
    fake_relations = [MagicMock(), MagicMock()]
    service = ColumnRelationService(fake_db)

    service.column_rel_repo.get_database_column_relations = AsyncMock(return_value=fake_relations)

    result = await service.get_database_column_relations(42)

    service.column_rel_repo.get_database_column_relations.assert_awaited_once_with(42)
    assert result == fake_relations


# -- Update Column Relation Tests --


@pytest.mark.asyncio
async def test_update_column_relation_success(service, fake_db):
    fake_updated_relation = MagicMock()
    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=_stored_relation())
    service.column_rel_repo.update_column_relation = AsyncMock(return_value=fake_updated_relation)
    data = UpdateColumnRelation(description="updated description")

    result = await service.update_column_relation(42, 7, data)

    service.column_rel_repo.get_column_relation_by_id.assert_awaited_once_with(42, 7)
    service.column_rel_repo.update_column_relation.assert_awaited_once_with(42, 7, data)
    fake_db.commit.assert_awaited_once()
    assert result is fake_updated_relation


@pytest.mark.asyncio
async def test_update_column_relation_without_endpoint_change_skips_validation(service, fake_db):
    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=_stored_relation())

    await service.update_column_relation(42, 7, UpdateColumnRelation(description="updated description"))

    service.column_repo.column_exists.assert_not_awaited()
    service.column_rel_repo.get_column_relation_by_endpoints.assert_not_awaited()


@pytest.mark.asyncio
async def test_update_column_relation_validates_merged_endpoints(service, fake_db):
    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=_stored_relation())
    data = UpdateColumnRelation(column_name_2="buyer_id")

    await service.update_column_relation(42, 7, data)

    # unchanged side comes from the stored relation, changed side from the update
    service.column_repo.column_exists.assert_has_awaits(
        [call(42, "public", "users", "id"), call(42, "public", "orders", "buyer_id")]
    )
    service.column_rel_repo.get_column_relation_by_endpoints.assert_awaited_once_with(
        42, "public", "users", "id", "public", "orders", "buyer_id"
    )
    service.column_rel_repo.update_column_relation.assert_awaited_once_with(42, 7, data)


@pytest.mark.asyncio
async def test_update_column_relation_no_data(service, fake_db):
    with pytest.raises(ColumnRelationError) as error:
        await service.update_column_relation(42, 7, UpdateColumnRelation())

    assert error.value.status_code == 400

    service.column_rel_repo.get_column_relation_by_id.assert_not_awaited()
    service.column_rel_repo.update_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_update_column_relation_same_column(service, fake_db):
    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=_stored_relation())
    # stored side 1 is users.id — pointing side 2 at it relates the column to itself
    data = UpdateColumnRelation(table_name_2="users", column_name_2="id")

    with pytest.raises(ColumnRelationError) as error:
        await service.update_column_relation(42, 7, data)

    assert error.value.status_code == 400

    service.column_rel_repo.update_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_update_column_relation_column_not_found(service, fake_db):
    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=_stored_relation())
    service.column_repo.column_exists = AsyncMock(side_effect=[True, False])

    with pytest.raises(ColumnRelationError) as error:
        await service.update_column_relation(42, 7, UpdateColumnRelation(column_name_2="missing"))

    assert error.value.status_code == 404

    service.column_rel_repo.update_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_update_column_relation_duplicate_of_other_relation(service, fake_db):
    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=_stored_relation(relation_id=7))
    service.column_rel_repo.get_column_relation_by_endpoints = AsyncMock(return_value=_stored_relation(relation_id=8))

    with pytest.raises(ColumnRelationError) as error:
        await service.update_column_relation(42, 7, UpdateColumnRelation(column_name_2="buyer_id"))

    assert error.value.status_code == 400

    service.column_rel_repo.update_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_update_column_relation_matching_itself_is_not_a_duplicate(service, fake_db):
    # e.g. swapping both sides: the endpoint lookup finds the relation being updated
    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=_stored_relation(relation_id=7))
    service.column_rel_repo.get_column_relation_by_endpoints = AsyncMock(return_value=_stored_relation(relation_id=7))
    data = UpdateColumnRelation(
        table_name_1="orders", column_name_1="user_id", table_name_2="users", column_name_2="id"
    )

    await service.update_column_relation(42, 7, data)

    service.column_rel_repo.update_column_relation.assert_awaited_once_with(42, 7, data)
    fake_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_column_relation_not_found(service, fake_db):
    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=None)

    with pytest.raises(ColumnRelationError) as error:
        await service.update_column_relation(42, 7, UpdateColumnRelation(description="updated description"))

    assert error.value.status_code == 404

    service.column_rel_repo.update_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


# -- Delete Column Relation Tests --


@pytest.mark.asyncio
async def test_delete_column_relation_success():
    fake_db = AsyncMock()
    fake_column_relation = MagicMock()
    service = ColumnRelationService(fake_db)

    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=fake_column_relation)
    service.column_rel_repo.delete_column_relation = AsyncMock()

    result = await service.delete_column_relation(42, 7)

    service.column_rel_repo.get_column_relation_by_id.assert_awaited_once_with(42, 7)
    service.column_rel_repo.delete_column_relation.assert_awaited_once_with(42, 7)
    fake_db.commit.assert_awaited_once()
    assert result == {"message": "Deleted column relation successfully"}


@pytest.mark.asyncio
async def test_delete_column_relation_not_found():
    fake_db = AsyncMock()
    service = ColumnRelationService(fake_db)

    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=None)
    service.column_rel_repo.delete_column_relation = AsyncMock()

    with pytest.raises(ColumnRelationError) as error:
        await service.delete_column_relation(42, 7)

    assert error.value.status_code == 404

    service.column_rel_repo.delete_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()
