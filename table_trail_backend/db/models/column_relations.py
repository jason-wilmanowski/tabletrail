from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from table_trail_backend.core.enums import ColumnRelationColor
from table_trail_backend.db.database_config import Base


class ColumnRelations(Base):
    __tablename__ = "column_relations"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    database_id: Mapped[int] = mapped_column(ForeignKey("databases.id", ondelete="CASCADE"))
    schema_name_1: Mapped[str] = mapped_column()
    schema_name_2: Mapped[str] = mapped_column()
    table_name_1: Mapped[str] = mapped_column()
    table_name_2: Mapped[str] = mapped_column()
    column_name_1: Mapped[str] = mapped_column()
    column_name_2: Mapped[str] = mapped_column()
    relation_color: Mapped[ColumnRelationColor] = mapped_column(
        Enum(ColumnRelationColor), default=ColumnRelationColor.GREEN
    )
    description: Mapped[str | None] = mapped_column()
