from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from table_trail_backend.core.enums import ColumnRelationType
from table_trail_backend.db.database_config import Base


class ColumnRelations(Base):
    __tablename__ = "column_relations"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    database_id: Mapped[int] = mapped_column(ForeignKey("databases.id", ondelete="CASCADE", onupdate="CASCADE"))
    column_id_1: Mapped[int] = mapped_column(ForeignKey("columns.id", ondelete="CASCADE"))
    column_id_2: Mapped[int] = mapped_column(ForeignKey("columns.id", ondelete="CASCADE"))
    relation_color: Mapped[ColumnRelationType] = mapped_column(
        Enum(ColumnRelationType), default=ColumnRelationType.GREEN
    )
    description: Mapped[str | None] = mapped_column()
