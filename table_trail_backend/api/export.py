from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io
from table_trail_backend.core.dependencies import get_db
from table_trail_backend.core.exceptions import ExportSystemError, DatabaseSystemError
from table_trail_backend.schemas.export_schema import CreateExport
from table_trail_backend.services.export_service import ExportService


router = APIRouter(prefix="/export", tags=["export"])


@router.post("")
async def create_export(export_details : CreateExport, db: AsyncSession = Depends(get_db)):

    export_service = ExportService(db)

    try:
        export_file = await export_service.execute_export(export_details)
    except ExportSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message)
    except DatabaseSystemError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message)

    return StreamingResponse(
        io.BytesIO(export_file.content),
        media_type=export_file.media_type,
        headers={
            "Content-Disposition":
                f"attachment; filename={export_file.filename}"
        }
    )