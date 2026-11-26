import asyncio

import pytest
from alembic import command
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

import table_trail_backend.db.models  # noqa: F401 - registers every table on Base.metadata
from table_trail_backend.db.database_config import Base
from table_trail_backend.db.migrations import BASELINE_REVISION, _alembic_config, run_migrations


@pytest.fixture
def database_url(tmp_path):
    # A file rather than :memory: - Alembic opens its own connections.
    return f"sqlite+aiosqlite:///{tmp_path / 'cache.db'}"


async def _state(engine):
    async with engine.connect() as conn:
        tables = set(await conn.run_sync(lambda sync_conn: inspect(sync_conn).get_table_names()))
        version = None
        if "alembic_version" in tables:
            version = (await conn.execute(text("SELECT version_num FROM alembic_version"))).scalar()
    return tables, version


@pytest.mark.asyncio
async def test_fresh_database_is_migrated_to_head(database_url):
    engine = create_async_engine(database_url)

    await run_migrations(engine)

    tables, version = await _state(engine)
    assert set(Base.metadata.tables) <= tables
    assert version == BASELINE_REVISION
    await engine.dispose()


@pytest.mark.asyncio
async def test_running_migrations_again_is_a_no_op(database_url):
    engine = create_async_engine(database_url)

    await run_migrations(engine)
    await run_migrations(engine)

    assert (await _state(engine))[1] == BASELINE_REVISION
    await engine.dispose()


@pytest.mark.asyncio
async def test_database_created_by_create_all_is_stamped_and_keeps_its_data(database_url):
    engine = create_async_engine(database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text(
                "INSERT INTO databases (name, db_type, host, port, db_name, password, username, status) "
                "VALUES ('kept', 'POSTGRESQL', 'h', 1, 'd', 'p', 'u', 'READY')"
            )
        )

    await run_migrations(engine)

    assert (await _state(engine))[1] == BASELINE_REVISION
    async with engine.connect() as conn:
        assert (await conn.execute(text("SELECT name FROM databases"))).scalar() == "kept"
    await engine.dispose()


@pytest.mark.asyncio
async def test_migrations_match_the_models(database_url):
    # Fails when a model changes without a migration (`alembic check`).
    engine = create_async_engine(database_url)
    await run_migrations(engine)
    await engine.dispose()

    # In a thread like run_migrations: Alembic's env.py starts its own event loop.
    await asyncio.to_thread(command.check, _alembic_config(database_url))
