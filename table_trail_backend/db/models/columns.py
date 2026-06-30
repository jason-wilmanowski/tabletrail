from sqlalchemy import UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from table_trail_backend.db.database_config import Base


class Columns(Base):
    __tablename__ = 'columns'

    id : Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    table_id : Mapped[int] = mapped_column(ForeignKey('tables.id'))
    name : Mapped[str] = mapped_column()
    data_type : Mapped[str] = mapped_column()
    is_nullable : Mapped[bool] = mapped_column()
    default_value : Mapped[str] = mapped_column()
    ordinal_position : Mapped[int] = mapped_column()

    __table_args__ = (
        UniqueConstraint('table_id', 'name', name='uq_table_per_db_schema'),
    )

