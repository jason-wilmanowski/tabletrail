from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from table_trail_backend.core.dependencies import get_db
from table_trail_backend.core.exceptions import DatabaseSystemError, ScanningSystemError
from table_trail_backend.schemas.database_schema import (
    CreateDatabase,
    DatabaseStructureResponse,
)
from table_trail_backend.services.database_service import DatabaseService
from table_trail_backend.services.scanner_service import ScanService

router = APIRouter(prefix="/scanner", tags=["scanner"])


@router.post("", response_model=DatabaseStructureResponse)
async def create_database(
    database_details: CreateDatabase, db: AsyncSession = Depends(get_db)
) -> DatabaseStructureResponse:
    scanner_service = ScanService(db)
    database_service = DatabaseService(db)

    try:
        # call service to scan db via database details
        database = await scanner_service.execute_scan(database_details)
    except ScanningSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    try:
        # get full database structure via database id
        database_structure = await database_service.get_full_database(database.id)
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    return database_structure


@router.patch("", response_model=DatabaseStructureResponse)
async def rescan_database(
    database_details: CreateDatabase, db: AsyncSession = Depends(get_db)
) -> DatabaseStructureResponse:
    scanner_service = ScanService(db)
    database_service = DatabaseService(db)

    try:
        # call service to update and scan db via database details
        database = await scanner_service.execute_scan(database_details)
    except ScanningSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    try:
        # get full updated database structure via database id
        database_structure = await database_service.get_full_database(database.id)
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error

    return database_structure
