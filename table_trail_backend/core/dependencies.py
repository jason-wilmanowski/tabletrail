from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from table_trail_backend.db.database_config import async_session


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session