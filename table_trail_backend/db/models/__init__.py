# Importing every model registers its table on Base.metadata - Alembic's
# env.py imports this package so autogenerate and migrations see all tables.
from table_trail_backend.db.models.column_relations import ColumnRelations
from table_trail_backend.db.models.columns import Columns
from table_trail_backend.db.models.constraint_columns import ConstraintColumn
from table_trail_backend.db.models.constraints import Constraints
from table_trail_backend.db.models.databases import Databases
from table_trail_backend.db.models.tables import Tables

__all__ = ["ColumnRelations", "Columns", "ConstraintColumn", "Constraints", "Databases", "Tables"]
