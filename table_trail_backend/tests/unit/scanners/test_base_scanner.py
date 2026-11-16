from table_trail_backend.db_scanner.base_scanner import BaseScanner


def _column_row(schema, table, name, position, nullable="NO", default=None):
    return (schema, table, name, "integer", nullable, default, position)


def _constraint_row(schema, table, name, constraint_type, column=None, **extra):
    return (
        schema,
        table,
        name,
        constraint_type,
        column,
        extra.get("references_table"),
        extra.get("on_delete"),
        extra.get("on_update"),
        extra.get("check_expression"),
        extra.get("references_schema"),
    )


# -- _group_columns() --


def test_group_columns_by_table_keeping_row_order():
    result = BaseScanner._group_columns(
        [
            _column_row("public", "orders", "id", 1),
            _column_row("public", "orders", "user_id", 2, nullable="YES"),
            _column_row("public", "users", "id", 1, default="nextval('users_id_seq')"),
        ]
    )

    assert list(result) == [("public", "orders"), ("public", "users")]
    assert [column.name for column in result[("public", "orders")]] == ["id", "user_id"]
    assert result[("public", "orders")][1].is_nullable is True
    assert result[("public", "users")][0].default_value == "nextval('users_id_seq')"
    assert result[("public", "users")][0].is_nullable is False


def test_group_columns_keeps_same_table_name_in_different_schemas_apart():
    result = BaseScanner._group_columns(
        [
            _column_row("public", "users", "id", 1),
            _column_row("archive", "users", "legacy_id", 1),
        ]
    )

    assert [column.name for column in result[("public", "users")]] == ["id"]
    assert [column.name for column in result[("archive", "users")]] == ["legacy_id"]


# -- _group_constraints() --


def test_group_constraints_maps_all_fields():
    result = BaseScanner._group_constraints(
        [
            _constraint_row(
                "public",
                "users",
                "fk_user_company",
                "FOREIGN KEY",
                "company_id",
                references_table="companies",
                references_schema="public",
                on_delete="CASCADE",
                on_update="NO ACTION",
            ),
        ]
    )

    [foreign_key] = result[("public", "users")]
    assert foreign_key.constraint_name == "fk_user_company"
    assert foreign_key.constraint_type == "FOREIGN KEY"
    assert foreign_key.column_names == ["company_id"]
    assert foreign_key.references_table == "companies"
    assert foreign_key.references_schema == "public"
    assert foreign_key.on_delete == "CASCADE"
    assert foreign_key.on_update == "NO ACTION"


def test_group_constraints_combines_columns_of_same_constraint():
    result = BaseScanner._group_constraints(
        [
            _constraint_row("public", "example", "example_pkey", "PRIMARY KEY", "id"),
            _constraint_row("public", "example", "example_pkey", "PRIMARY KEY", "tenant_id"),
            # a duplicate row from a join must not add the column twice
            _constraint_row("public", "example", "example_pkey", "PRIMARY KEY", "tenant_id"),
        ]
    )

    [constraint] = result[("public", "example")]
    assert constraint.column_names == ["id", "tenant_id"]


def test_group_constraints_keeps_same_name_on_different_tables_apart():
    result = BaseScanner._group_constraints(
        [
            _constraint_row("public", "orders", "fk_user", "FOREIGN KEY", "user_id"),
            _constraint_row("public", "invoices", "fk_user", "FOREIGN KEY", "customer_id"),
        ]
    )

    assert result[("public", "orders")][0].column_names == ["user_id"]
    assert result[("public", "invoices")][0].column_names == ["customer_id"]


def test_group_constraints_check_constraint_has_no_columns():
    result = BaseScanner._group_constraints(
        [_constraint_row("public", "users", "users_age_check", "CHECK", check_expression="age >= 18")]
    )

    [constraint] = result[("public", "users")]
    assert constraint.column_names == []
    assert constraint.check_expression == "age >= 18"


def test_group_constraints_ignores_extra_trailing_fields():
    row = (*_constraint_row("public", "users", "users_pkey", "PRIMARY KEY", "id"), 1)

    [constraint] = BaseScanner._group_constraints([row])[("public", "users")]

    assert constraint.column_names == ["id"]


# -- _build_tables() --


def test_build_tables_attaches_columns_and_constraints_per_table():
    columns = BaseScanner._group_columns([_column_row("public", "users", "id", 1)])
    constraints = BaseScanner._group_constraints(
        [_constraint_row("public", "users", "users_pkey", "PRIMARY KEY", "id")]
    )

    tables = BaseScanner._build_tables([("users", "public"), ("empty", "public")], columns, constraints)

    assert [(table.schema_name, table.name) for table in tables] == [("public", "users"), ("public", "empty")]
    assert [column.name for column in tables[0].columns] == ["id"]
    assert [constraint.constraint_name for constraint in tables[0].constraints] == ["users_pkey"]
    assert tables[1].columns == []
    assert tables[1].constraints == []
