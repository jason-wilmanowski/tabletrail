from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from table_trail_backend.core.config import settings
from table_trail_backend.db.database_config import engine, Base
from table_trail_backend.api import scanner, database, health_check, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="TableTrail",
    description="Self-hosted database schema explorer",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(scanner.router, prefix="/api/v1")
app.include_router(database.router, prefix="/api/v1")
app.include_router(health_check.router, prefix="/api/v1")
app.include_router(export.router, prefix="/api/v1")