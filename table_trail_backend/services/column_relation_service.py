from sqlalchemy.ext.asyncio import AsyncSession

from table_trail_backend.core.exceptions import ColumnRelationError, DatabaseError
from table_trail_backend.repositories.column_relation_repository import ColumnRelationRepository
from table_trail_backend.repositories.database_repository import DatabasesRepository
from table_trail_backend.schemas.column_relation_schema import (
    ColumnRelationResponse,
    CreateColumnRelation,
    UpdateColumnRelation,
)


class ColumnRelationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.column_rel_repo = ColumnRelationRepository(db)
        self.databases_repo = DatabasesRepository(db)

    async def create_column_relation(self, database_id: int, data: CreateColumnRelation) -> ColumnRelationResponse:
        existing_database = await self.databases_repo.get_one_database(database_id)
        if not existing_database:
            raise DatabaseError(status_code=404, message=f"Database with id {database_id} not found")

        if data.column_id_1 == data.column_id_2:
            raise ColumnRelationError(status_code=400, message="A column cannot be related to itself")

        new_column_relation = await self.column_rel_repo.create_column_relation(database_id, data)
        await self.db.commit()

        return new_column_relation

    async def get_column_relation_by_id(self, database_id: int, column_relation_id: int) -> ColumnRelationResponse:
        column_relation = await self.column_rel_repo.get_column_relation_by_id(database_id, column_relation_id)
        if not column_relation:
            raise ColumnRelationError(
                status_code=404, message=f"Column relation with id {column_relation_id} not found"
            )

        return column_relation

    async def get_database_column_relations(self, database_id: int) -> list[ColumnRelationResponse]:
        return await self.column_rel_repo.get_database_column_relations(database_id)

    async def update_column_relation(
        self, database_id: int, column_relation_id: int, data: UpdateColumnRelation
    ) -> ColumnRelationResponse:
        if all(value is None for value in data.model_dump().values()):
            raise ColumnRelationError(status_code=400, message="No update data provided")

        if data.column_id_1 is not None and data.column_id_1 == data.column_id_2:
            raise ColumnRelationError(status_code=400, message="A column cannot be related to itself")

        column_relation = await self.column_rel_repo.get_column_relation_by_id(database_id, column_relation_id)
        if not column_relation:
            raise ColumnRelationError(
                status_code=404, message=f"Column relation with id {column_relation_id} not found"
            )

        updated_column_relation = await self.column_rel_repo.update_column_relation(
            database_id, column_relation_id, data
        )
        await self.db.commit()

        return updated_column_relation

    async def delete_column_relation(self, database_id: int, column_relation_id: int) -> dict:
        column_relation = await self.column_rel_repo.get_column_relation_by_id(database_id, column_relation_id)
        if not column_relation:
            raise ColumnRelationError(
                status_code=404, message=f"Column relation with id {column_relation_id} not found"
            )

        await self.column_rel_repo.delete_column_relation(database_id, column_relation_id)
        await self.db.commit()

        return {"message": "Deleted column relation successfully"}
