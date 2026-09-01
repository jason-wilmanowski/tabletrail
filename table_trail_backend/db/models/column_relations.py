from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from table_trail_backend.core.enums import ColumnRelationType
from table_trail_backend.db.database_config import Base


class ColumnRelations(Base):
    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    database_id: Mapped[int] = mapped_column(
        ForeignKey("databases.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False
    )
    column_id_1: Mapped[int] = mapped_column(not_null=True)
    column_id_2: Mapped[int] = mapped_column(nit_null=True)
    relation_color: Mapped[ColumnRelationType] = mapped_column(not_null=True, default=ColumnRelationType.GREEN)
    description: Mapped[str] = mapped_column()
