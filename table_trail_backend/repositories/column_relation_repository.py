from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from table_trail_backend.db.models.column_relations import ColumnRelations
from table_trail_backend.schemas.column_relation_schema import (
    CreateColumnRelation,
    UpdateColumnRelation,
)


class ColumnRelationRepository:
    def __init__(self, session: AsyncSession):
        self.db = session

    async def create_column_relation(self, database_id: int, data: CreateColumnRelation):
        new_column_relation = ColumnRelations(
            database_id=database_id,
            column_id_1=data.column_id_1,
            column_id_2=data.column_id_2,
            relation_color=data.relation_color,
            description=data.description,
        )
        self.db.add(new_column_relation)
        await self.db.flush()
        await self.db.refresh(new_column_relation)
        return new_column_relation

    async def get_column_relation_by_id(self, database_id: int, column_relation_id: int):
        column_relation = await self.db.execute(
            select(ColumnRelations).where(
                and_(ColumnRelations.database_id == database_id, ColumnRelations.id == column_relation_id)
            )
        )
        return column_relation.scalar_one_or_none()

    async def get_database_column_relations(self, database_id: int):
        column_relations = await self.db.execute(
            select(ColumnRelations).where(ColumnRelations.database_id == database_id)
        )
        return column_relations.scalars().all()

    async def update_column_relation(self, database_id: int, column_relation_id: int, data: UpdateColumnRelation):
        column_relation = await self.get_column_relation_by_id(database_id, column_relation_id)
        update_data = data.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(column_relation, key, value)
        await self.db.flush()
        await self.db.refresh(column_relation)
        return column_relation

    async def delete_column_relation(self, database_id: int, column_relation_id: int):
        column_relation = await self.get_column_relation_by_id(database_id, column_relation_id)
        await self.db.delete(column_relation)
        await self.db.flush()
