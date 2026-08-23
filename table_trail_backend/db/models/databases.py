from datetime import datetime

from sqlalchemy import Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from table_trail_backend.core.enums import DBStatus, DBType
from table_trail_backend.db.database_config import Base


class Databases(Base):
    __tablename__ = "databases"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column()
    db_type: Mapped[DBType] = mapped_column(Enum(DBType))
    host: Mapped[str] = mapped_column()
    port: Mapped[int] = mapped_column()
    db_name: Mapped[str] = mapped_column()
    password: Mapped[str] = mapped_column()
    username: Mapped[str] = mapped_column()
    status: Mapped[DBStatus] = mapped_column(Enum(DBStatus))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    tables: Mapped[list["Tables"]] = relationship(back_populates="database", cascade="all, delete-orphan")
