from unittest.mock import AsyncMock, MagicMock

import pytest

from table_trail_backend.core.exceptions import ColumnRelationError, DatabaseError
from table_trail_backend.schemas.column_relation_schema import CreateColumnRelation, UpdateColumnRelation
from table_trail_backend.services.column_relation_service import ColumnRelationService

# -- Create Column Relation Tests --


@pytest.mark.asyncio
async def test_create_column_relation_success():
    fake_db = AsyncMock()
    fake_database = MagicMock()
    fake_column_relation = MagicMock()

    service = ColumnRelationService(fake_db)

    service.databases_repo.get_one_database = AsyncMock(return_value=fake_database)
    service.column_rel_repo.get_column_relation_by_columns = AsyncMock(return_value=None)
    service.column_rel_repo.create_column_relation = AsyncMock(return_value=fake_column_relation)

    data = CreateColumnRelation(column_id_1=1, column_id_2=2)

    result = await service.create_column_relation(42, data)

    service.databases_repo.get_one_database.assert_awaited_once_with(42)
    service.column_rel_repo.get_column_relation_by_columns.assert_awaited_once_with(1, 2)
    service.column_rel_repo.create_column_relation.assert_awaited_once_with(42, data)
    fake_db.commit.assert_awaited_once()
    assert result is fake_column_relation


@pytest.mark.asyncio
async def test_create_column_relation_database_not_found():
    fake_db = AsyncMock()
    service = ColumnRelationService(fake_db)

    service.databases_repo.get_one_database = AsyncMock(return_value=None)
    service.column_rel_repo.get_column_relation_by_columns = AsyncMock()
    service.column_rel_repo.create_column_relation = AsyncMock()

    data = CreateColumnRelation(column_id_1=1, column_id_2=2)

    with pytest.raises(DatabaseError) as error:
        await service.create_column_relation(42, data)

    assert error.value.status_code == 404

    service.databases_repo.get_one_database.assert_awaited_once_with(42)
    service.column_rel_repo.get_column_relation_by_columns.assert_not_awaited()
    service.column_rel_repo.create_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_column_relation_same_column():
    fake_db = AsyncMock()
    fake_database = MagicMock()
    service = ColumnRelationService(fake_db)

    service.databases_repo.get_one_database = AsyncMock(return_value=fake_database)
    service.column_rel_repo.get_column_relation_by_columns = AsyncMock()
    service.column_rel_repo.create_column_relation = AsyncMock()

    data = CreateColumnRelation(column_id_1=1, column_id_2=1)

    with pytest.raises(ColumnRelationError) as error:
        await service.create_column_relation(42, data)

    assert error.value.status_code == 400

    service.column_rel_repo.get_column_relation_by_columns.assert_not_awaited()
    service.column_rel_repo.create_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_column_relation_already_exists():
    fake_db = AsyncMock()
    fake_database = MagicMock()
    fake_existing_relation = MagicMock()
    service = ColumnRelationService(fake_db)

    service.databases_repo.get_one_database = AsyncMock(return_value=fake_database)
    service.column_rel_repo.get_column_relation_by_columns = AsyncMock(return_value=fake_existing_relation)
    service.column_rel_repo.create_column_relation = AsyncMock()

    data = CreateColumnRelation(column_id_1=1, column_id_2=2)

    with pytest.raises(ColumnRelationError) as error:
        await service.create_column_relation(42, data)

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
async def test_update_column_relation_success():
    fake_db = AsyncMock()
    fake_column_relation = MagicMock()
    fake_updated_relation = MagicMock()
    service = ColumnRelationService(fake_db)

    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=fake_column_relation)
    service.column_rel_repo.update_column_relation = AsyncMock(return_value=fake_updated_relation)

    data = UpdateColumnRelation(description="updated description")

    result = await service.update_column_relation(42, 7, data)

    service.column_rel_repo.get_column_relation_by_id.assert_awaited_once_with(42, 7)
    service.column_rel_repo.update_column_relation.assert_awaited_once_with(42, 7, data)
    fake_db.commit.assert_awaited_once()
    assert result is fake_updated_relation


@pytest.mark.asyncio
async def test_update_column_relation_no_data():
    fake_db = AsyncMock()
    service = ColumnRelationService(fake_db)

    service.column_rel_repo.get_column_relation_by_id = AsyncMock()
    service.column_rel_repo.update_column_relation = AsyncMock()

    data = UpdateColumnRelation()

    with pytest.raises(ColumnRelationError) as error:
        await service.update_column_relation(42, 7, data)

    assert error.value.status_code == 400

    service.column_rel_repo.get_column_relation_by_id.assert_not_awaited()
    service.column_rel_repo.update_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_update_column_relation_same_column():
    fake_db = AsyncMock()
    service = ColumnRelationService(fake_db)

    service.column_rel_repo.get_column_relation_by_id = AsyncMock()
    service.column_rel_repo.update_column_relation = AsyncMock()

    data = UpdateColumnRelation(column_id_1=3, column_id_2=3)

    with pytest.raises(ColumnRelationError) as error:
        await service.update_column_relation(42, 7, data)

    assert error.value.status_code == 400

    service.column_rel_repo.get_column_relation_by_id.assert_not_awaited()
    service.column_rel_repo.update_column_relation.assert_not_awaited()
    fake_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_update_column_relation_not_found():
    fake_db = AsyncMock()
    service = ColumnRelationService(fake_db)

    service.column_rel_repo.get_column_relation_by_id = AsyncMock(return_value=None)
    service.column_rel_repo.update_column_relation = AsyncMock()

    data = UpdateColumnRelation(description="updated description")

    with pytest.raises(ColumnRelationError) as error:
        await service.update_column_relation(42, 7, data)

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
