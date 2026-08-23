from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from table_trail_backend.db.models.columns import Columns
from table_trail_backend.db.models.tables import Tables
from table_trail_backend.schemas.column_schema import CreateColumn, UpdateColumn


class ColumnRepository:
    def __init__(self, session: AsyncSession):

        self.db = session

    async def create_column(self, table_id: int, data: CreateColumn):
        new_column = Columns(
            table_id=table_id,
            name=data.name,
            data_type=data.data_type,
            is_nullable=data.is_nullable,
            default_value=data.default_value,
            ordinal_position=data.ordinal_position,
        )
        self.db.add(new_column)
        await self.db.flush()
        await self.db.refresh(new_column)
        return new_column

    async def get_column_by_id(self, table_id: int, column_id: int):
        column = await self.db.execute(
            select(Columns).where(and_(Columns.table_id == table_id, Columns.id == column_id))
        )
        return column.scalar_one_or_none()

    async def get_table_columns(self, table_id: int):
        columns = await self.db.execute(select(Columns).where(Columns.table_id == table_id))
        return columns.scalars().all()

    async def search_by_name(self, db_id: int, query: str) -> list[Columns]:
        result = await self.db.execute(
            select(Columns).join(Tables).where(and_(Tables.database_id == db_id, Columns.name.ilike(f"%{query}%")))
        )
        return list(result.scalars().all())

    async def update_column(self, table_id: int, column_id: int, data: UpdateColumn):
        column = await self.get_column_by_id(table_id, column_id)
        update_data = data.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(column, key, value)
        await self.db.flush()
        await self.db.refresh(column)
        return column

    async def delete_column(self, table_id: int, column_id: int):
        column = await self.get_column_by_id(table_id, column_id)
        await self.db.delete(column)
        await self.db.flush()
