from sqlalchemy import UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from table_trail_backend.db.database_config import Base


class Constraints(Base):
    __tablename__ = 'constraints'

    id : Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    table_id : Mapped[int] = mapped_column(ForeignKey('tables.id', ondelete='CASCADE'))
    constraint_type : Mapped[str] = mapped_column()
    constraint_name : Mapped[str] = mapped_column()
    references_table_id : Mapped[int | None] = mapped_column()
    on_delete : Mapped[str | None] = mapped_column()
    on_update : Mapped[str | None] = mapped_column()
    check_expression : Mapped[str | None] = mapped_column()

    table: Mapped["Tables"] = relationship(back_populates="constraints")
    constraint_columns: Mapped[list["ConstraintColumn"]] = relationship(
        back_populates="constraint",
        cascade="all, delete-orphan"
    )

    @property
    def column_names(self) -> list[str]:
        return [cc.column.name for cc in self.constraint_columns]