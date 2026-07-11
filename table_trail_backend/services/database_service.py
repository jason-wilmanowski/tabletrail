from sqlalchemy.ext.asyncio import AsyncSession
from table_trail_backend.repositories.database_repository import DatabasesRepository
from table_trail_backend.core.exceptions import DatabaseError
from table_trail_backend.schemas.database_schema import UpdateDatabase


class DatabaseService:


    def __init__(self, db: AsyncSession):
        self.db = db
        self.db_repo = DatabasesRepository(db)

    async def get_full_database(self, db_id: int):
        database = await self.db_repo.get_full_database(db_id)
        if database is None:
            raise DatabaseError(message=f"Database with id {db_id} not found",
                                status_code=404)
        return database

    async def get_all_databases(self):
        return await self.db_repo.get_all_databases()

    async def update_database(self, db_id: int, data: UpdateDatabase):
        if not data:
            raise DatabaseError(message=f"No update data provided",
                                status_code=400)
        database = await self.db_repo.get_one_database(db_id)
        if database is None:
            raise DatabaseError(message=f"Database with id {db_id} not found",
                                status_code=404)
        return await self.db_repo.update(db_id, data)

    async def delete_database(self, db_id: int):
        database = await self.db_repo.get_one_database(db_id)
        if database is None:
            raise DatabaseError(message=f"Database with id {db_id} not found",
                                status_code=404)
        await self.db_repo.delete_database(db_id)
        await self.db.commit()