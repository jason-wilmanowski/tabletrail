from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from table_trail_backend.db.database_config import Base


class Tables(Base):
    __tablename__ = 'tables'

    id : Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    database_id : Mapped[int] = mapped_column(ForeignKey('databases.id'))
    name : Mapped[str] = mapped_column()
    schema_name : Mapped[str | None] = mapped_column()

    __table_args__ = (
        UniqueConstraint('database_id', 'schema_name', 'name', name='uq_table_per_db_schema'),
    )