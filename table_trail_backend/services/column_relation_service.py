from sqlalchemy.ext.asyncio import AsyncSession

from table_trail_backend.core.exceptions import ColumnRelationError, DatabaseError
from table_trail_backend.repositories.column_relation_repository import ColumnRelationRepository
from table_trail_backend.repositories.column_repository import ColumnRepository
from table_trail_backend.repositories.database_repository import DatabasesRepository
from table_trail_backend.schemas.column_relation_schema import (
    ColumnRelationResponse,
    CreateColumnRelation,
    UpdateColumnRelation,
)

ENDPOINT_FIELDS = {"schema_name", "table_name_1", "column_name_1", "table_name_2", "column_name_2"}


class ColumnRelationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.column_rel_repo = ColumnRelationRepository(db)
        self.databases_repo = DatabasesRepository(db)
        self.column_repo = ColumnRepository(db)

    async def create_column_relation(self, database_id: int, data: CreateColumnRelation) -> ColumnRelationResponse:
        existing_database = await self.databases_repo.get_one_database(database_id)
        if not existing_database:
            raise DatabaseError(status_code=404, message=f"Database with id {database_id} not found")

        await self._validate_endpoints(
            database_id,
            data.schema_name,
            data.table_name_1,
            data.column_name_1,
            data.table_name_2,
            data.column_name_2,
        )

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

        column_relation = await self.column_rel_repo.get_column_relation_by_id(database_id, column_relation_id)
        if not column_relation:
            raise ColumnRelationError(
                status_code=404, message=f"Column relation with id {column_relation_id} not found"
            )

        # partial update: validate the endpoints the relation will have afterwards,
        # skipped when only color / description change
        update_data = data.model_dump(exclude_none=True)
        if update_data.keys() & ENDPOINT_FIELDS:
            endpoints = {field: update_data.get(field, getattr(column_relation, field)) for field in ENDPOINT_FIELDS}
            await self._validate_endpoints(database_id, **endpoints, exclude_relation_id=column_relation_id)

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

    # Helper Methods

    async def _validate_endpoints(
        self,
        database_id: int,
        schema_name: str,
        table_name_1: str,
        column_name_1: str,
        table_name_2: str,
        column_name_2: str,
        exclude_relation_id: int | None = None,
    ) -> None:
        if (table_name_1, column_name_1) == (table_name_2, column_name_2):
            raise ColumnRelationError(status_code=400, message="A column cannot be related to itself")

        # relations reference columns by name -> nothing in the database
        # guarantees they exist — check both against the scanned structure
        for table_name, column_name in ((table_name_1, column_name_1), (table_name_2, column_name_2)):
            if not await self.column_repo.column_exists(database_id, schema_name, table_name, column_name):
                raise ColumnRelationError(
                    status_code=404, message=f"Column {schema_name}.{table_name}.{column_name} not found"
                )

        existing_column_relation = await self.column_rel_repo.get_column_relation_by_endpoints(
            database_id, schema_name, table_name_1, column_name_1, table_name_2, column_name_2
        )
        if existing_column_relation and existing_column_relation.id != exclude_relation_id:
            raise ColumnRelationError(status_code=400, message="Relation between these columns already exists")
