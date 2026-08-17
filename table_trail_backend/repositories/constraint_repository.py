from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from table_trail_backend.db.models.constraints import Constraints
from table_trail_backend.db.models.constraint_columns import ConstraintColumn
from table_trail_backend.schemas.constraint_schema import CreateConstraint, UpdateConstraint


class ConstraintsRepository:

    def __init__(self, session: AsyncSession):

        self.db = session


    async def create_constraint(self, table_id: int, data: CreateConstraint):
        new_constraint = Constraints(table_id=table_id,
                                    constraint_type=data.constraint_type,
                                    constraint_name=data.constraint_name,
                                    references_table_id=data.references_table_id,
                                    on_delete=data.on_delete,
                                    on_update=data.on_update,
                                    check_expression=data.check_expression,)
        self.db.add(new_constraint)
        await self.db.flush()
        await self.db.refresh(new_constraint)
        return new_constraint


    async def create_column_constraint(self, column_id: int, constraint_id: int):
        new_column_constraint = ConstraintColumn(column_id=column_id,
                                                 constraint_id=constraint_id)
        self.db.add(new_column_constraint)
        await self.db.flush()
        await self.db.refresh(new_column_constraint)
        return new_column_constraint


    async def get_constraint_by_id(self, table_id: int, constraint_id: int):
        constraint = await self.db.execute(
            select(Constraints).where(and_(Constraints.table_id == table_id,
                                           Constraints.id == constraint_id))
        )
        return constraint.scalar_one_or_none()

    async def get_table_constraints(self, table_id: int):
        constraints = await self.db.execute(
            select(Constraints).where(Constraints.table_id == table_id)
        )
        return constraints.scalars().all()

    async def get_column_constraints(self, column_id: int):
        constraints = await self.db.execute(
            select(ConstraintColumn).where(ConstraintColumn.column_id == column_id)
        )
        return constraints.scalars().all()


    async def update_constraint(self, table_id: int, constraint_id: int, data: UpdateConstraint):
        constraint = await self.get_constraint_by_id(table_id, constraint_id)
        update_data = data.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(constraint, key, value)
        await self.db.flush()
        await self.db.refresh(constraint)
        return constraint


    async def delete_constraint(self, table_id: int, constraint_id: int):
        constraint = await self.get_constraint_by_id(table_id, constraint_id)
        await self.db.delete(constraint)
        await self.db.flush()
        return

