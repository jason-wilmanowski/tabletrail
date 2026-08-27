from collections.abc import AsyncGenerator, Awaitable, Callable

import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from table_trail_backend.core.enums import DBStatus, DBType
from table_trail_backend.db.database_config import Base
from table_trail_backend.db.models.databases import Databases
from table_trail_backend.db.models.tables import Tables
from table_trail_backend.repositories.database_repository import DatabasesRepository
from table_trail_backend.repositories.table_repository import TableRepository
from table_trail_backend.schemas.database_schema import CreateDatabaseInternal


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    # in memory SQLite database per test exercising real SQL behavior instead of mocking the session
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )

    async with engine.begin() as conn:
        await conn.execute(text("PRAGMA foreign_keys=ON"))
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_maker() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def make_database(db_session: AsyncSession) -> Callable[..., Awaitable[Databases]]:
    async def _make_database(**overrides) -> Databases:
        defaults = {
            "name": "Test Database",
            "db_type": DBType.POSTGRESQL,
            "host": "localhost",
            "port": 5432,
            "db_name": "test_db",
            "username": "test_user",
            "password": "test_password",
            "status": DBStatus.READY,
        }
        defaults.update(overrides)
        repo = DatabasesRepository(db_session)
        return await repo.create(CreateDatabaseInternal(**defaults))

    return _make_database


@pytest_asyncio.fixture
async def make_table(db_session: AsyncSession) -> Callable[..., Awaitable[Tables]]:
    async def _make_table(database_id: int, name: str = "users", schema_name: str | None = "public") -> Tables:
        repo = TableRepository(db_session)
        return await repo.create_table(database_id, name, schema_name)

    return _make_table
