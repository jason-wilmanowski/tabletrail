from sqlalchemy import UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from table_trail_backend.db.database_config import Base


class ConstraintColumn(Base):
    __tablename__ = 'constraint_columns'

    id : Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    constraint_id : Mapped[int] = mapped_column(ForeignKey('constraints.id', ondelete='CASCADE'))
    column_id : Mapped[int] = mapped_column(ForeignKey('columns.id', ondelete='CASCADE'))

    column: Mapped["Columns"] = relationship(back_populates="constraint_columns")
    constraint: Mapped["Constraints"] = relationship(back_populates="constraint_columns")