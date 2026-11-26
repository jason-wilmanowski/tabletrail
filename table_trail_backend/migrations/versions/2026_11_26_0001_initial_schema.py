"""initial schema

Baseline matching the schema that `Base.metadata.create_all` produced
before migrations existed. Cache databases created that way are stamped
to this revision on startup instead of running it (see db/migrations.py).

Revision ID: 0001
Revises:
Create Date: 2026-11-26 16:59:11.515829

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "databases",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("db_type", sa.Enum("POSTGRESQL", "MYSQL", "MARIADB", name="dbtype"), nullable=False),
        sa.Column("host", sa.String(), nullable=False),
        sa.Column("port", sa.Integer(), nullable=False),
        sa.Column("db_name", sa.String(), nullable=False),
        sa.Column("password", sa.String(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("status", sa.Enum("SCANNING", "READY", "ERROR", name="dbstatus"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "column_relations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("database_id", sa.Integer(), nullable=False),
        sa.Column("schema_name_1", sa.String(), nullable=False),
        sa.Column("schema_name_2", sa.String(), nullable=False),
        sa.Column("table_name_1", sa.String(), nullable=False),
        sa.Column("table_name_2", sa.String(), nullable=False),
        sa.Column("column_name_1", sa.String(), nullable=False),
        sa.Column("column_name_2", sa.String(), nullable=False),
        sa.Column(
            "relation_color",
            sa.Enum("GREEN", "RED", "YELLOW", "BLUE", "MAGENTA", "WHITE", name="columnrelationcolor"),
            nullable=False,
        ),
        sa.Column("description", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["database_id"], ["databases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "tables",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("database_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("schema_name", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["database_id"], ["databases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("database_id", "schema_name", "name", name="uq_table_per_db_schema"),
    )
    op.create_table(
        "columns",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("table_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("data_type", sa.String(), nullable=False),
        sa.Column("is_nullable", sa.Boolean(), nullable=False),
        sa.Column("default_value", sa.String(), nullable=True),
        sa.Column("ordinal_position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["table_id"], ["tables.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("table_id", "name", name="uq_column_per_table"),
    )
    op.create_table(
        "constraints",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("table_id", sa.Integer(), nullable=False),
        sa.Column("constraint_type", sa.String(), nullable=False),
        sa.Column("constraint_name", sa.String(), nullable=False),
        sa.Column("references_table_id", sa.Integer(), nullable=True),
        sa.Column("on_delete", sa.String(), nullable=True),
        sa.Column("on_update", sa.String(), nullable=True),
        sa.Column("check_expression", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["table_id"], ["tables.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "constraint_columns",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("constraint_id", sa.Integer(), nullable=False),
        sa.Column("column_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["column_id"], ["columns.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["constraint_id"], ["constraints.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("constraint_columns")
    op.drop_table("constraints")
    op.drop_table("columns")
    op.drop_table("tables")
    op.drop_table("column_relations")
    op.drop_table("databases")
    # drop_table leaves Postgres enum types behind, which would make the next upgrade fail
    for enum_name in ("columnrelationcolor", "dbstatus", "dbtype"):
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
