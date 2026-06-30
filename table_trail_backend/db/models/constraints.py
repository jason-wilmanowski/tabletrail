from sqlalchemy import UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from table_trail_backend.db.database_config import Base


class Constrains(Base):
    __tablename__ = 'constraints'

    id : Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    table_id : Mapped[int] = mapped_column(ForeignKey('tables.id'))
    constraint_type : Mapped[str] = mapped_column()
    constraint_name : Mapped[str] = mapped_column()
    references_table_id : Mapped[int | None] = mapped_column()
    on_delete : Mapped[str] = mapped_column()
    on_update : Mapped[str] = mapped_column()
    check_expression : Mapped[str] = mapped_column()

