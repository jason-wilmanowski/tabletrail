from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from table_trail_backend.core.dependencies import get_db
from table_trail_backend.core.exceptions import DatabaseSystemError
from table_trail_backend.schemas.column_relation_schema import (
    ColumnRelationResponse,
    CreateColumnRelation,
    UpdateColumnRelation,
)
from table_trail_backend.services.column_relation_service import ColumnRelationService

router = APIRouter(prefix="/column-relation", tags=["column-relation"])


@router.post("/{db_id}", response_model=ColumnRelationResponse)
async def create_column_relation(
    db_id: int, relation_details: CreateColumnRelation, db: AsyncSession = Depends(get_db)
):
    column_relation_service = ColumnRelationService(db)

    try:
        new_column_relation = await column_relation_service.create_column_relation(db_id, relation_details)
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    return new_column_relation


@router.get("/{db_id}", response_model=list[ColumnRelationResponse])
async def get_database_column_relations(db_id: int, db: AsyncSession = Depends(get_db)):
    column_relation_service = ColumnRelationService(db)

    try:
        column_relations = await column_relation_service.get_database_column_relations(db_id)
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    return column_relations


@router.get("/{db_id}/{column_relation_id}", response_model=ColumnRelationResponse)
async def get_column_relation(db_id: int, column_relation_id: int, db: AsyncSession = Depends(get_db)):
    column_relation_service = ColumnRelationService(db)

    try:
        column_relation = await column_relation_service.get_column_relation_by_id(db_id, column_relation_id)
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    return column_relation


@router.put("/{db_id}/{column_relation_id}", response_model=ColumnRelationResponse)
async def update_column_relation(
    db_id: int, column_relation_id: int, update_data: UpdateColumnRelation, db: AsyncSession = Depends(get_db)
):
    column_relation_service = ColumnRelationService(db)

    try:
        updated_column_relation = await column_relation_service.update_column_relation(
            db_id, column_relation_id, update_data
        )
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    return updated_column_relation


@router.delete("/{db_id}/{column_relation_id}")
async def delete_column_relation(db_id: int, column_relation_id: int, db: AsyncSession = Depends(get_db)) -> dict:
    column_relation_service = ColumnRelationService(db)

    try:
        await column_relation_service.delete_column_relation(db_id, column_relation_id)
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    return {"message": f"Column relation with ID: {column_relation_id} successfully deleted"}
