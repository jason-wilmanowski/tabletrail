from sqlalchemy.ext.asyncio import AsyncSession

from table_trail_backend.core.exceptions import DatabaseError
from table_trail_backend.repositories.column_repository import ColumnRepository
from table_trail_backend.repositories.database_repository import DatabasesRepository
from table_trail_backend.repositories.table_repository import TableRepository
from table_trail_backend.schemas.database_schema import UpdateDatabase


class DatabaseService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.db_repo = DatabasesRepository(db)
        self.table_repo = TableRepository(db)
        self.column_repo = ColumnRepository(db)

    async def get_full_database(self, db_id: int):
        database = await self.db_repo.get_full_database(db_id)
        if database is None:
            raise DatabaseError(message=f"Database with id {db_id} not found", status_code=404)
        return database

    async def get_all_databases(self):
        return await self.db_repo.get_all_databases()

    async def update_database(self, db_id: int, update_data: UpdateDatabase):
        if all(value is None for value in update_data.model_dump().values()):
            raise DatabaseError(message="No update data provided", status_code=400)
        database = await self.db_repo.get_one_database(db_id)
        if database is None:
            raise DatabaseError(message=f"Database with id {db_id} not found", status_code=404)

        updated_database = await self.db_repo.update(db_id, update_data)
        await self.db.commit()
        return updated_database

    async def search_database_components(self, db_id: int, search: str):

        database = await self.db_repo.get_one_database(db_id)
        if not database:
            raise DatabaseError(message=f"Database with id {db_id} not found", status_code=404)

        tables = await self.table_repo.search_by_name(db_id, search)
        schema_tables = await self.table_repo.search_by_schema_name(db_id, search)
        columns = await self.column_repo.search_by_name(db_id, search)

        return {
            "tables": tables,
            "schema_tables": schema_tables,
            "columns": columns,
        }

    async def delete_database(self, db_id: int):
        database = await self.db_repo.get_one_database(db_id)
        if database is None:
            raise DatabaseError(message=f"Database with id {db_id} not found", status_code=404)
        await self.db_repo.delete_database(db_id)
        await self.db.commit()
