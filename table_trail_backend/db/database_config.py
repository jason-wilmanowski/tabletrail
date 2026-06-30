from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from table_trail_backend.core.config import Settings

settings = Settings()

# Engine
engine = create_engine(
    settings.DATABASE_URL,
    future=True,
    pool_pre_ping=True,
)


# Session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    bind=engine
)

class Base(DeclarativeBase):
    pass