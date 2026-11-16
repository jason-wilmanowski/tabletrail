from table_trail_backend.core.enums import DBType
from table_trail_backend.export.generators.relations import ForeignKeyRelation, build_foreign_key_relations
from table_trail_backend.schemas.constraint_schema import ConstraintResponse
from table_trail_backend.schemas.export_schema import DatabaseExport
from table_trail_backend.schemas.table_schema import TableResponse


def _table(table_id, name, constraints=(), schema_name="public"):
    return TableResponse(id=table_id, name=name, schema_name=schema_name, columns=[], constraints=list(constraints))


def _constraint(constraint_type, column_names, references_table_id=None, on_delete=None):
    return ConstraintResponse(
        id=1,
        constraint_name="c",
        constraint_type=constraint_type,
        references_table_id=references_table_id,
        column_names=column_names,
        on_delete=on_delete,
    )


def _database(tables):
    return DatabaseExport(id=1, name="Shop", db_type=DBType.POSTGRESQL, tables=tables)


def test_builds_one_relation_per_foreign_key():
    users = _table(1, "users", [_constraint("PRIMARY KEY", ["id"])])
    orders = _table(
        2,
        "orders",
        [_constraint("FOREIGN KEY", ["user_id"], references_table_id=1, on_delete="CASCADE")],
    )

    relations = build_foreign_key_relations(_database([users, orders]))

    assert relations == [
        ForeignKeyRelation(
            from_table="public.orders",
            from_columns=["user_id"],
            to_table="public.users",
            on_delete="CASCADE",
        )
    ]


def test_skips_foreign_keys_to_tables_outside_the_scan():
    orders = _table(2, "orders", [_constraint("FOREIGN KEY", ["user_id"], references_table_id=None)])

    assert build_foreign_key_relations(_database([orders])) == []


def test_uses_plain_table_name_without_schema():
    users = _table(1, "users", schema_name=None)
    orders = _table(2, "orders", [_constraint("FOREIGN KEY", ["user_id"], references_table_id=1)], schema_name=None)

    [relation] = build_foreign_key_relations(_database([users, orders]))

    assert (relation.from_table, relation.to_table) == ("orders", "users")
