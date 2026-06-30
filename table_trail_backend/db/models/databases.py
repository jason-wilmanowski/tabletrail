from sqlalchemy import Enum, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from table_trail_backend.db.database_config import Base
from table_trail_backend.core.enums import DBType, DBStatus

class Databases(Base):
    __tablename__ = 'databases'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column()
    db_type: Mapped[DBType] = mapped_column(Enum(DBType))
    connection_url: Mapped[str] = mapped_column()
    status: Mapped[DBStatus] = mapped_column(Enum(DBStatus))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

