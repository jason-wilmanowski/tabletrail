from sqlalchemy import UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from table_trail_backend.db.database_config import Base


class Columns(Base):
    __tablename__ = 'columns'

    id : Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    table_id : Mapped[int] = mapped_column(ForeignKey('tables.id', ondelete='CASCADE'))
    name : Mapped[str] = mapped_column()
    data_type : Mapped[str] = mapped_column()
    is_nullable : Mapped[bool] = mapped_column()
    default_value : Mapped[str | None] = mapped_column()
    ordinal_position : Mapped[int] = mapped_column()

    table: Mapped["Tables"] = relationship(back_populates="columns")
    constraint_columns: Mapped[list["ConstraintColumn"]] = relationship(
        back_populates="column",
        cascade="all, delete-orphan"
    )
    __table_args__ = (
        UniqueConstraint('table_id', 'name', name='uq_column_per_table'),
    )

