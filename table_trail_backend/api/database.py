from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from table_trail_backend.schemas.database_schema import DatabaseStructureResponse, DatabaseResponse, \
    DatabaseOverviewResponse
from table_trail_backend.core.dependencies import get_db
from table_trail_backend.services.database_service import DatabaseService
from table_trail_backend.core.exceptions import DatabaseSystemError
from table_trail_backend.schemas.database_schema import UpdateDatabase, SearchResponse
from typing import List


router = APIRouter(prefix="/database", tags=["database"])


@router.get("/all", response_model=List[DatabaseOverviewResponse])
async def get_all_databases(db: AsyncSession = Depends(get_db)):

    database_service = DatabaseService(db)

    try:
        databases = await database_service.get_all_databases()
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message)

    return databases


@router.get("/{db_id}", response_model=DatabaseStructureResponse)
async def get_database(db_id : int, db: AsyncSession = Depends(get_db)):

    database_service = DatabaseService(db)

    try:
        database = await database_service.get_full_database(db_id)
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message)

    return database


@router.get("/{db_id}/search", response_model=SearchResponse)
async def database_component_search(db_id: int,
                                    q : str,
                                    db: AsyncSession = Depends(get_db)):

    database_service = DatabaseService(db)

    try:
        components = await database_service.search_database_components(db_id, q)
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message)

    return components


@router.put("/{db_id}", response_model=DatabaseResponse)
async def update_database(db_id : int,
                          update_data : UpdateDatabase,
                          db: AsyncSession = Depends(get_db)):

    database_service = DatabaseService(db)

    try:
        updated_database = await database_service.update_database(db_id, update_data)
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message)

    return updated_database


@router.delete("/{db_id}")
async def delete_database(db_id : int, db: AsyncSession = Depends(get_db)) -> dict:

    database_service = DatabaseService(db)

    try:
        await database_service.delete_database(db_id)
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message)

    return {"message": f"Database with ID: {db_id} successfully deleted"}


