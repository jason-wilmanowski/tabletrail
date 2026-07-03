from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from table_trail_backend.db.models.tables import Tables



class TableRepository:

    def __init__(self, session: AsyncSession):

        self.db = session


    async def create_table(self, db_id: int, name: str, schema_name: str):
        new_table = Tables(database_id=db_id, name=name, schema_name=schema_name)
        self.db.add(new_table)
        await self.db.flush()
        await self.db.refresh(new_table)
        return new_table


    async def get_table_by_id(self, db_id: int, table_id: int):
        table = await self.db.execute(
            select(Tables).where(and_(Tables.id == table_id,
                                      Tables.database_id == db_id))
        )
        return table.scalar_one_or_none()

    async def get_database_tables(self, db_id: int):
        tables = await self.db.execute(
            select(Tables).where(Tables.database_id == db_id))
        return tables.scalars().all()

    async def get_table_by_name(self, db_id: int, table_name: str):
        table = await self.db.execute(
            select(Tables).where(and_(Tables.database_id == db_id,
                                 Tables.name == table_name))
        )
        return table.scalar_one_or_none()

    async def get_tables_by_schema_name(self, db_id: int, schema_name: str):
        tables = await self.db.execute(
            select(Tables).where(and_(Tables.database_id == db_id,
                                      Tables.schema_name == schema_name))
        )
        return tables.scalars().all()


    async def update_table(self,
                           db_id: int,
                           table_id: int,
                           name: str | None = None,
                           schema_name: str | None = None):

        database = await self.get_table_by_id(db_id, table_id)
        if name is not None:
            database.name = name
        if schema_name is not None:
            database.schema_name = schema_name
        await self.db.flush()
        await self.db.refresh(database)
        return database


    async def delete_table(self, db_id: int, table_id: int):
        database = await self.get_table_by_id(db_id, table_id)
        await self.db.delete(database)
        await self.db.flush()
        return
