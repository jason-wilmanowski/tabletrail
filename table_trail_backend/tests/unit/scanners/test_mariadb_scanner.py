from unittest.mock import MagicMock

from table_trail_backend.db_scanner.mariadb_scanner import MariaDBScanner


def _result(rows):
    result = MagicMock()
    result.fetchall.return_value = rows
    return result


def test_scan_success(monkeypatch):
    fake_engine = MagicMock()
    fake_connection = MagicMock()

    fake_engine.connect.return_value.__enter__.return_value = fake_connection

    monkeypatch.setattr("table_trail_backend.db_scanner.mariadb_scanner.create_engine", lambda url: fake_engine)

    scanner = MariaDBScanner()

    fake_tables = [MagicMock(name="users", schema_name="public", columns=[], constraints=[])]

    monkeypatch.setattr(scanner, "_scan_tables", MagicMock(return_value=fake_tables))

    result = scanner.scan("mariadb://test")

    assert len(result.tables) == 1
    assert result.tables == fake_tables

    fake_engine.connect.assert_called_once_with()
    fake_engine.dispose.assert_called_once_with()


def test_scan_tables_runs_three_queries_regardless_of_table_count():
    scanner = MariaDBScanner()

    fake_connection = MagicMock()
    fake_connection.execute.side_effect = [
        _result([("orders", "shop"), ("users", "shop")]),
        _result(
            [
                ("shop", "orders", "id", "integer", "NO", None, 1),
                ("shop", "users", "id", "integer", "NO", None, 1),
                ("shop", "users", "email", "varchar", "YES", None, 2),
            ]
        ),
        _result([("shop", "users", "users_pkey", "PRIMARY KEY", "id", None, None, None, None, None, 1)]),
    ]

    tables = scanner._scan_tables(fake_connection)

    assert fake_connection.execute.call_count == 3
    assert [table.name for table in tables] == ["orders", "users"]
    assert [column.name for column in tables[1].columns] == ["id", "email"]
    assert [constraint.constraint_name for constraint in tables[1].constraints] == ["users_pkey"]
    assert tables[0].constraints == []


def test_scan_columns():
    scanner = MariaDBScanner()

    fake_connection = MagicMock()

    fake_connection.execute.return_value.fetchall.return_value = [
        ("shop", "users", "id", "integer", "NO", None, 1),
        ("shop", "users", "name", "character varying", "YES", None, 2),
        ("shop", "users", "created_at", "timestamp", "NO", "CURRENT_TIMESTAMP", 3),
    ]

    result = scanner._scan_columns(fake_connection)[("shop", "users")]

    assert len(result) == 3

    assert result[0].name == "id"
    assert result[0].data_type == "integer"
    assert result[0].is_nullable is False
    assert result[0].default_value is None
    assert result[0].ordinal_position == 1

    assert result[1].name == "name"
    assert result[1].is_nullable is True

    assert result[2].name == "created_at"
    assert result[2].default_value == "CURRENT_TIMESTAMP"

    fake_connection.execute.assert_called_once()


def test_scan_constraints():
    scanner = MariaDBScanner()

    fake_connection = MagicMock()

    fake_connection.execute.return_value.fetchall.return_value = [
        ("shop", "users", "users_pkey", "PRIMARY KEY", "id", None, None, None, None, None, 1),
        (
            "shop",
            "users",
            "fk_user_company",
            "FOREIGN KEY",
            "company_id",
            "companies",
            "CASCADE",
            "CASCADE",
            None,
            "shop",
            1,
        ),
    ]

    result = scanner._scan_constraints(fake_connection)[("shop", "users")]

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
    assert foreign_key.references_schema == "shop"
    assert foreign_key.on_delete == "CASCADE"
    assert foreign_key.on_update == "CASCADE"

    fake_connection.execute.assert_called_once()
