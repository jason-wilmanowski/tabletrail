import pytest

from table_trail_backend.repositories.column_repository import ColumnRepository
from table_trail_backend.repositories.constraint_repository import ConstraintsRepository
from table_trail_backend.schemas.column_schema import CreateColumn
from table_trail_backend.schemas.constraint_schema import CreateConstraint, UpdateConstraint

# -- Create Constraint --


@pytest.mark.asyncio
async def test_create_constraint_persists(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    repo = ConstraintsRepository(db_session)

    constraint = await repo.create_constraint(
        table.id, CreateConstraint(constraint_type="UNIQUE", constraint_name="uq_users_email")
    )

    assert constraint.id is not None
    assert constraint.constraint_name == "uq_users_email"
    assert constraint.table_id == table.id


# -- Create Column Constraint (junction) --


@pytest.mark.asyncio
async def test_create_column_constraint_links_column_and_constraint(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    column_repo = ColumnRepository(db_session)
    column = await column_repo.create_column(
        table.id, CreateColumn(name="email", data_type="varchar", is_nullable=False, ordinal_position=1)
    )
    repo = ConstraintsRepository(db_session)
    constraint = await repo.create_constraint(
        table.id, CreateConstraint(constraint_type="UNIQUE", constraint_name="uq_users_email")
    )

    link = await repo.create_column_constraint(column.id, constraint.id)

    assert link.column_id == column.id
    assert link.constraint_id == constraint.id


# -- Get By Id --


@pytest.mark.asyncio
async def test_get_constraint_by_id_found(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    repo = ConstraintsRepository(db_session)
    constraint = await repo.create_constraint(
        table.id, CreateConstraint(constraint_type="UNIQUE", constraint_name="uq_users_email")
    )

    result = await repo.get_constraint_by_id(table.id, constraint.id)

    assert result is not None
    assert result.id == constraint.id


@pytest.mark.asyncio
async def test_get_constraint_by_id_wrong_table_returns_none(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id, name="users")
    other_table = await make_table(database.id, name="orders")
    repo = ConstraintsRepository(db_session)
    constraint = await repo.create_constraint(
        table.id, CreateConstraint(constraint_type="UNIQUE", constraint_name="uq_users_email")
    )

    result = await repo.get_constraint_by_id(other_table.id, constraint.id)

    assert result is None


# -- Get Table Constraints --


@pytest.mark.asyncio
async def test_get_table_constraints_scoped_to_table(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id, name="users")
    other_table = await make_table(database.id, name="orders")
    repo = ConstraintsRepository(db_session)
    constraint = await repo.create_constraint(
        table.id, CreateConstraint(constraint_type="UNIQUE", constraint_name="uq_users_email")
    )
    await repo.create_constraint(
        other_table.id, CreateConstraint(constraint_type="UNIQUE", constraint_name="uq_orders_number")
    )

    result = await repo.get_table_constraints(table.id)

    assert [row.id for row in result] == [constraint.id]


# -- Get Column Constraints --


@pytest.mark.asyncio
async def test_get_column_constraints_scoped_to_column(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    column_repo = ColumnRepository(db_session)
    column = await column_repo.create_column(
        table.id, CreateColumn(name="email", data_type="varchar", is_nullable=False, ordinal_position=1)
    )
    other_column = await column_repo.create_column(
        table.id, CreateColumn(name="name", data_type="varchar", is_nullable=False, ordinal_position=2)
    )
    repo = ConstraintsRepository(db_session)
    constraint = await repo.create_constraint(
        table.id, CreateConstraint(constraint_type="UNIQUE", constraint_name="uq_users_email")
    )
    link = await repo.create_column_constraint(column.id, constraint.id)
    await repo.create_column_constraint(other_column.id, constraint.id)

    result = await repo.get_column_constraints(column.id)

    assert [row.id for row in result] == [link.id]


# -- Update --


@pytest.mark.asyncio
async def test_update_constraint_changes_provided_fields_only(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    repo = ConstraintsRepository(db_session)
    constraint = await repo.create_constraint(
        table.id, CreateConstraint(constraint_type="UNIQUE", constraint_name="uq_users_email")
    )

    updated = await repo.update_constraint(table.id, constraint.id, UpdateConstraint(on_delete="CASCADE"))

    assert updated.on_delete == "CASCADE"
    assert updated.constraint_name == "uq_users_email"


# -- Delete --


@pytest.mark.asyncio
async def test_delete_constraint_removes_row_and_links(db_session, make_database, make_table):
    database = await make_database()
    table = await make_table(database.id)
    column_repo = ColumnRepository(db_session)
    column = await column_repo.create_column(
        table.id, CreateColumn(name="email", data_type="varchar", is_nullable=False, ordinal_position=1)
    )
    repo = ConstraintsRepository(db_session)
    constraint = await repo.create_constraint(
        table.id, CreateConstraint(constraint_type="UNIQUE", constraint_name="uq_users_email")
    )
    await repo.create_column_constraint(column.id, constraint.id)

    await repo.delete_constraint(table.id, constraint.id)

    assert await repo.get_constraint_by_id(table.id, constraint.id) is None
    assert await repo.get_column_constraints(column.id) == []
