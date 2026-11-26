import asyncio
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncEngine

ALEMBIC_INI = Path(__file__).resolve().parents[2] / "alembic.ini"

# The first migration, matching the schema `Base.metadata.create_all`
# produced before migrations existed.
BASELINE_REVISION = "0001"


def _alembic_config(database_url: str) -> Config:
    config = Config(str(ALEMBIC_INI))
    config.attributes["database_url"] = database_url
    config.attributes["skip_logging_config"] = True
    return config


async def _table_names(engine: AsyncEngine) -> set[str]:
    async with engine.connect() as conn:
        return set(await conn.run_sync(lambda sync_conn: inspect(sync_conn).get_table_names()))


async def run_migrations(engine: AsyncEngine) -> None:
    """Brings the cache database to the latest migration.

    A database created by `create_all` (before migrations existed) has the
    tables but no `alembic_version`; it's stamped to the baseline first so
    the initial migration isn't applied on top of existing tables.

    Alembic's commands are synchronous and its env.py starts its own event
    loop, so they run in a worker thread instead of the API's loop.
    """
    database_url = engine.url.render_as_string(hide_password=False)
    config = _alembic_config(database_url)

    tables = await _table_names(engine)
    if "alembic_version" not in tables and "databases" in tables:
        await asyncio.to_thread(command.stamp, config, BASELINE_REVISION)

    await asyncio.to_thread(command.upgrade, config, "head")
