from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from table_trail_backend.db.models.databases import Databases
from table_trail_backend.schemas.database_schema import CreateDatabase, UpdateDatabase


class DatabasesRepository:


    def __init__(self, session: AsyncSession):
        self.db = session


    async def create(self, data: CreateDatabase):
        new_database = Databases(name=data.name,
                                 db_type=data.db_type,
                                 connection_url=data.connection_url)
        self.db.add(new_database)
        await self.db.flush()
        await self.db.refresh(new_database)
        return new_database


    async def get_one_database(self, db_id: int):
        database = await self.db.execute(
            select(Databases).where(Databases.id == db_id)
        )
        return database.scalar_one_or_none()

    async def get_all_databases(self):
        databases = await self.db.execute(
            select(Databases)
        )
        return databases.scalars().all()


    async def update(self, db_id: int, data: UpdateDatabase):
        database = await self.get_one_database(db_id)
        update_data = data.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(database, key, value)
        await self.db.flush()
        await self.db.refresh(database)
        return database


    async def delete_database(self, db_id: int):
        database = await self.get_one_database(db_id)
        await self.db.delete(database)
        await self.db.flush()
        return