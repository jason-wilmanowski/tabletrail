from sqlalchemy import UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from table_trail_backend.db.database_config import Base


class ConstraintColumn(Base):
    __tablename__ = 'constraint_columns'

    constraint_id : Mapped[int] = mapped_column(ForeignKey('constraints.id'))
    column_id : Mapped[int] = mapped_column(ForeignKey('columns.id'))