from unittest.mock import MagicMock

from table_trail_backend.db_scanner.postgres_scanner import PostgresScanner


def test_scan_success(monkeypatch):
    fake_engine = MagicMock()
    fake_connection = MagicMock()

    fake_engine.connect.return_value.__enter__.return_value = fake_connection

    monkeypatch.setattr("table_trail_backend.db_scanner.postgres_scanner.create_engine", lambda url: fake_engine)

    scanner = PostgresScanner()

    fake_tables = [MagicMock(name="users", schema_name="public", columns=[], constraints=[])]

    monkeypatch.setattr(scanner, "_scan_tables", MagicMock(return_value=fake_tables))

    result = scanner.scan("postgresql://test")

    assert len(result.tables) == 1
    assert result.tables == fake_tables

    fake_engine.connect.assert_called_once_with()
    fake_engine.dispose.assert_called_once_with()


def test_scan_columns():
    scanner = PostgresScanner()

    fake_connection = MagicMock()

    fake_connection.execute.return_value.fetchall.return_value = [
        ("id", "integer", "NO", None, 1),
        ("name", "character varying", "YES", None, 2),
        ("created_at", "timestamp without time zone", "NO", "CURRENT_TIMESTAMP", 3),
    ]

    result = scanner._scan_columns(fake_connection, "public", "users")

    assert len(result) == 3

    assert result[0].name == "id"
    assert result[0].data_type == "integer"
    assert result[0].is_nullable is False
    assert result[0].default_value is None
    assert result[0].ordinal_position == 1

    assert result[1].name == "name"
    assert result[1].data_type == "character varying"
    assert result[1].is_nullable is True

    assert result[2].name == "created_at"
    assert result[2].default_value == "CURRENT_TIMESTAMP"

    fake_connection.execute.assert_called_once()


def test_scan_constraints():
    scanner = PostgresScanner()

    fake_connection = MagicMock()

    fake_connection.execute.return_value.fetchall.return_value = [
        (
            "users_pkey",
            "PRIMARY KEY",
            "id",
            None,
            None,
            None,
            None,
        ),
        (
            "fk_user_company",
            "FOREIGN KEY",
            "company_id",
            "companies",
            "CASCADE",
            "CASCADE",
            None,
        ),
    ]

    result = scanner._scan_constraints(fake_connection, "public", "users")

    assert len(result) == 2

    primary_key = result[0]

    assert primary_key.constraint_name == "users_pkey"
    assert primary_key.constraint_type == "PRIMARY KEY"
    assert primary_key.column_names == ["id"]

    foreign_key = result[1]

    assert foreign_key.constraint_name == "fk_user_company"
    assert foreign_key.constraint_type == "FOREIGN KEY"
    assert foreign_key.column_names == ["company_id"]
    assert foreign_key.references_table == "companies"
    assert foreign_key.on_delete == "CASCADE"
    assert foreign_key.on_update == "CASCADE"


def test_scan_constraints_combines_columns_of_same_constraint():
    scanner = PostgresScanner()

    fake_connection = MagicMock()

    fake_connection.execute.return_value.fetchall.return_value = [
        (
            "example_pkey",
            "PRIMARY KEY",
            "id",
            None,
            None,
            None,
            None,
        ),
        (
            "example_pkey",
            "PRIMARY KEY",
            "tenant_id",
            None,
            None,
            None,
            None,
        ),
    ]

    result = scanner._scan_constraints(fake_connection, "public", "example")

    assert len(result) == 1

    constraint = result[0]

    assert constraint.constraint_name == "example_pkey"
    assert constraint.constraint_type == "PRIMARY KEY"
    assert constraint.column_names == [
        "id",
        "tenant_id",
    ]


def test_scan_constraints_check_constraint():
    scanner = PostgresScanner()

    fake_connection = MagicMock()

    fake_connection.execute.return_value.fetchall.return_value = [
        (
            "users_age_check",
            "CHECK",
            None,
            None,
            None,
            None,
            "age >= 18",
        ),
    ]

    result = scanner._scan_constraints(fake_connection, "public", "users")

    assert len(result) == 1

    constraint = result[0]

    assert constraint.constraint_name == "users_age_check"
    assert constraint.constraint_type == "CHECK"
    assert constraint.column_names == []
    assert constraint.check_expression == "age >= 18"
