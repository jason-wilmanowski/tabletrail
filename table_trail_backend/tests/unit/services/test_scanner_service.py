import threading
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.engine import make_url
from sqlalchemy.exc import InterfaceError, OperationalError

from table_trail_backend.core.enums import DBStatus, DBType
from table_trail_backend.core.exceptions import (
    EncryptionError,
    EncryptionKeyError,
    ScannerConnectionError,
    ScannerDatabaseNotFoundError,
    ScannerDataError,
    ScannerUnsupportedDBError,
    ScanningSystemError,
)
from table_trail_backend.db_scanner.base_scanner import ScannedDatabase
from table_trail_backend.schemas.database_schema import (
    CreateDatabase,
    DatabaseResponse,
)
from table_trail_backend.services.scanner_service import ScanService

# Fixtures


@pytest.fixture
def db():
    session = AsyncMock()
    # AsyncSession.add/add_all are synchronous methods; mock them as such so
    # calling them doesn't create un-awaited coroutines (RuntimeWarning).
    session.add = MagicMock()
    session.add_all = MagicMock()
    return session


@pytest.fixture
def service(db):
    return ScanService(db)


@pytest.fixture
def database_details():
    details = MagicMock(spec=CreateDatabase)

    details.name = "Test Database"
    details.db_type = DBType.POSTGRESQL
    details.host = "localhost"
    details.port = "5432"
    details.db_name = "test_db"
    details.username = "postgres"
    details.password = "secret"

    return details


# _prepare_url


def test_prepare_url_postgresql_localhost(service, database_details):
    database_details.db_type = DBType.POSTGRESQL

    result = service._prepare_url(database_details)

    assert result.render_as_string(hide_password=False) == (
        "postgresql+psycopg2://postgres:secret@host.docker.internal:5432/test_db"
    )


def test_prepare_url_mysql(service, database_details):
    database_details.db_type = DBType.MYSQL
    database_details.host = "192.168.1.10"

    result = service._prepare_url(database_details)

    assert result.render_as_string(hide_password=False) == ("mysql+pymysql://postgres:secret@192.168.1.10:5432/test_db")


def test_prepare_url_mariadb(service, database_details):
    database_details.db_type = DBType.MARIADB
    database_details.host = "192.168.1.20"

    result = service._prepare_url(database_details)

    assert result.render_as_string(hide_password=False) == (
        "mariadb+pymysql://postgres:secret@192.168.1.20:5432/test_db"
    )


def test_prepare_url_127_0_0_1_is_replaced(service, database_details):
    database_details.host = "127.0.0.1"

    result = service._prepare_url(database_details)

    assert result.host == "host.docker.internal"


def test_prepare_url_escapes_special_characters_in_credentials(service, database_details):
    database_details.username = "admin@corp"
    database_details.password = "p@ss:w/rd#1?"

    result = service._prepare_url(database_details)

    # Round-trip through the rendered string, which is what the driver parses.
    parsed = make_url(result.render_as_string(hide_password=False))
    assert parsed.username == "admin@corp"
    assert parsed.password == "p@ss:w/rd#1?"
    assert parsed.host == "host.docker.internal"
    assert parsed.port == 5432
    assert parsed.database == "test_db"


# _get_scanner


@pytest.mark.parametrize(
    "db_type, expected_scanner",
    [
        (DBType.POSTGRESQL, "PostgresScanner"),
        (DBType.MYSQL, "MySQLScanner"),
        (DBType.MARIADB, "MariaDBScanner"),
    ],
)
def test_get_scanner_returns_correct_scanner(
    service,
    db_type,
    expected_scanner,
):
    with patch(f"table_trail_backend.services.scanner_service.{expected_scanner}") as scanner_class:
        scanner_class.return_value = MagicMock()

        result = service._get_scanner(db_type)

        scanner_class.assert_called_once_with()
        assert result == scanner_class.return_value


def test_get_scanner_raises_for_unsupported_database(service):
    unsupported_db_type = MagicMock()

    with pytest.raises(ScannerUnsupportedDBError) as error:
        service._get_scanner(unsupported_db_type)

    assert error.value.status_code == 422


# _run_scanner


@pytest.mark.asyncio
async def test_run_scanner_success(service):
    fake_scanner = MagicMock()
    fake_result = MagicMock(spec=ScannedDatabase)

    service._get_scanner = MagicMock(return_value=fake_scanner)
    fake_scanner.scan.return_value = fake_result

    result = await service._run_scanner(DBType.POSTGRESQL, "postgresql+psycopg2://test")

    service._get_scanner.assert_called_once_with(DBType.POSTGRESQL)
    fake_scanner.scan.assert_called_once_with("postgresql+psycopg2://test")

    assert result is fake_result


@pytest.mark.asyncio
async def test_run_scanner_runs_scan_off_the_event_loop_thread(service):
    event_loop_thread = threading.get_ident()
    scan_threads = []

    fake_scanner = MagicMock()
    fake_scanner.scan.side_effect = lambda url: scan_threads.append(threading.get_ident())
    service._get_scanner = MagicMock(return_value=fake_scanner)

    await service._run_scanner(DBType.POSTGRESQL, "postgresql+psycopg2://test")

    assert len(scan_threads) == 1
    assert scan_threads[0] != event_loop_thread


@pytest.mark.asyncio
async def test_run_scanner_connection_error(service):
    fake_scanner = MagicMock()

    service._get_scanner = MagicMock(return_value=fake_scanner)

    fake_scanner.scan.side_effect = ConnectionError("Connection failed")

    with pytest.raises(ScannerConnectionError) as error:
        await service._run_scanner(DBType.POSTGRESQL, "postgresql+psycopg2://test")

    assert error.value.status_code == 503


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "driver_error",
    [
        OperationalError("SELECT 1", {}, Exception("could not connect to server")),
        InterfaceError("SELECT 1", {}, Exception("connection already closed")),
    ],
)
async def test_run_scanner_sqlalchemy_connection_error(service, driver_error):
    fake_scanner = MagicMock()
    service._get_scanner = MagicMock(return_value=fake_scanner)
    fake_scanner.scan.side_effect = driver_error

    with pytest.raises(ScannerConnectionError) as error:
        await service._run_scanner(DBType.POSTGRESQL, "postgresql+psycopg2://test")

    assert error.value.status_code == 503


@pytest.mark.asyncio
async def test_run_scanner_unexpected_error(service):
    fake_scanner = MagicMock()

    service._get_scanner = MagicMock(return_value=fake_scanner)

    fake_scanner.scan.side_effect = RuntimeError("Unexpected scanner error")

    with pytest.raises(ScannerDataError) as error:
        await service._run_scanner(DBType.POSTGRESQL, "postgresql+psycopg2://test")

    assert error.value.status_code == 422
    assert "Unexpected scanner error" in error.value.message


# _initialize_scan


@pytest.mark.asyncio
@patch("table_trail_backend.services.scanner_service.encrypt", return_value="encrypted-secret")
async def test_initialize_scan_creates_new_database(
    encrypt_mock,
    service,
    database_details,
):
    service.db_repo.get_database_by_connection = AsyncMock(return_value=None)

    fake_database = MagicMock()
    fake_database.id = 42

    service.db_repo.create = AsyncMock(return_value=fake_database)

    result = await service._initialize_scan(database_details)

    service.db_repo.get_database_by_connection.assert_awaited_once_with(
        database_details.host,
        int(database_details.port),
        database_details.db_name,
    )

    service.db_repo.create.assert_awaited_once()

    create_data = service.db_repo.create.call_args.args[0]

    assert create_data.name == database_details.name
    assert create_data.db_type == database_details.db_type
    assert create_data.host == database_details.host
    assert create_data.port == int(database_details.port)
    assert create_data.db_name == database_details.db_name
    assert create_data.username == database_details.username
    encrypt_mock.assert_called_once_with(database_details.password)
    assert create_data.password == "encrypted-secret"
    assert create_data.status == DBStatus.SCANNING

    service.db.commit.assert_awaited_once()

    assert result == fake_database


@pytest.mark.asyncio
@patch("table_trail_backend.services.scanner_service.encrypt", return_value="encrypted-secret")
async def test_initialize_scan_updates_existing_database(
    encrypt_mock,
    service,
    database_details,
):
    existing_database = MagicMock()
    existing_database.id = 42

    updated_database = MagicMock()
    updated_database.id = 42

    service.db_repo.get_database_by_connection = AsyncMock(return_value=existing_database)

    service.db_repo.update = AsyncMock(return_value=updated_database)

    result = await service._initialize_scan(database_details)

    service.db_repo.update.assert_awaited_once()

    update_data = service.db_repo.update.call_args.args[1]

    assert update_data.name == database_details.name
    assert update_data.db_type == database_details.db_type
    assert update_data.host == database_details.host
    assert update_data.port == int(database_details.port)
    assert update_data.db_name == database_details.db_name
    assert update_data.username == database_details.username
    encrypt_mock.assert_called_once_with(database_details.password)
    assert update_data.password == "encrypted-secret"
    assert update_data.status == DBStatus.SCANNING

    service.db.commit.assert_awaited_once()

    assert result == updated_database


# _clear_existing_data


@pytest.mark.asyncio
async def test_clear_existing_data_deletes_all_tables(service):
    table_1 = MagicMock()
    table_2 = MagicMock()
    table_3 = MagicMock()

    service.table_repo.get_database_tables = AsyncMock(return_value=[table_1, table_2, table_3])

    await service._clear_existing_data(42)

    service.table_repo.get_database_tables.assert_awaited_once_with(42)

    assert service.db.delete.await_count == 3

    service.db.delete.assert_any_await(table_1)
    service.db.delete.assert_any_await(table_2)
    service.db.delete.assert_any_await(table_3)

    service.db.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_clear_existing_data_with_no_tables(service):
    service.table_repo.get_database_tables = AsyncMock(return_value=[])

    await service._clear_existing_data(42)

    service.table_repo.get_database_tables.assert_awaited_once_with(42)

    service.db.delete.assert_not_awaited()
    service.db.flush.assert_awaited_once()


# _persist_results


@pytest.mark.asyncio
async def test_persist_results_creates_table_columns_constraints(
    service,
):
    scanned_column = MagicMock()
    scanned_column.name = "id"
    scanned_column.data_type = "integer"
    scanned_column.is_nullable = False
    scanned_column.default_value = None
    scanned_column.ordinal_position = 1

    scanned_constraint = MagicMock()
    scanned_constraint.constraint_name = "pk_test"
    scanned_constraint.constraint_type = "PRIMARY KEY"
    scanned_constraint.references_table = None
    scanned_constraint.on_delete = None
    scanned_constraint.on_update = None
    scanned_constraint.check_expression = None
    scanned_constraint.column_names = ["id"]

    scanned_table = MagicMock()
    scanned_table.name = "users"
    scanned_table.schema_name = "public"
    scanned_table.columns = [scanned_column]
    scanned_table.constraints = [scanned_constraint]

    scan_result = MagicMock(spec=ScannedDatabase)
    scan_result.tables = [scanned_table]

    fake_table = MagicMock()
    fake_table.id = 10

    fake_column = MagicMock()
    fake_column.id = 20

    fake_constraint = MagicMock()
    fake_constraint.id = 30

    service.table_repo.create_table = AsyncMock(return_value=fake_table)

    service.column_repo.create_column = AsyncMock(return_value=fake_column)

    service.constraint_repo.create_constraint = AsyncMock(return_value=fake_constraint)

    service.constraint_repo.create_column_constraint = AsyncMock()

    await service._persist_results(42, scan_result)

    service.table_repo.create_table.assert_awaited_once_with(
        db_id=42,
        name="users",
        schema_name="public",
    )

    service.column_repo.create_column.assert_awaited_once()

    service.constraint_repo.create_constraint.assert_awaited_once()

    service.constraint_repo.create_column_constraint.assert_awaited_once_with(
        column_id=20,
        constraint_id=30,
    )


@pytest.mark.asyncio
async def test_persist_results_resolves_foreign_key_reference(
    service,
):
    scanned_users = MagicMock()
    scanned_users.name = "users"
    scanned_users.schema_name = "public"
    scanned_users.columns = []
    scanned_users.constraints = []

    scanned_column = MagicMock()
    scanned_column.name = "user_id"
    scanned_column.data_type = "integer"
    scanned_column.is_nullable = False
    scanned_column.default_value = None
    scanned_column.ordinal_position = 1

    scanned_constraint = MagicMock()
    scanned_constraint.constraint_name = "fk_user"
    scanned_constraint.constraint_type = "FOREIGN KEY"
    scanned_constraint.references_table = "users"
    scanned_constraint.references_schema = "public"
    scanned_constraint.on_delete = "CASCADE"
    scanned_constraint.on_update = "CASCADE"
    scanned_constraint.check_expression = None
    scanned_constraint.column_names = ["user_id"]

    scanned_orders = MagicMock()
    scanned_orders.name = "orders"
    scanned_orders.schema_name = "public"
    scanned_orders.columns = [scanned_column]
    scanned_orders.constraints = [scanned_constraint]

    scan_result = MagicMock(spec=ScannedDatabase)
    scan_result.tables = [scanned_users, scanned_orders]

    fake_users_table = MagicMock()
    fake_users_table.id = 99

    fake_orders_table = MagicMock()
    fake_orders_table.id = 10

    fake_column = MagicMock()
    fake_column.id = 20

    fake_constraint = MagicMock()
    fake_constraint.id = 30

    service.table_repo.create_table = AsyncMock(side_effect=[fake_users_table, fake_orders_table])

    service.table_repo.get_table_by_name = AsyncMock()

    service.column_repo.create_column = AsyncMock(return_value=fake_column)

    service.constraint_repo.create_constraint = AsyncMock(return_value=fake_constraint)

    service.constraint_repo.create_column_constraint = AsyncMock()

    await service._persist_results(42, scan_result)

    # Resolved from the tables created in this scan, without a lookup query
    service.table_repo.get_table_by_name.assert_not_awaited()

    service.constraint_repo.create_constraint.assert_awaited_once()
    assert service.constraint_repo.create_constraint.call_args.kwargs["table_id"] == 10

    constraint_data = service.constraint_repo.create_constraint.call_args.kwargs["data"]

    assert constraint_data.references_table_id == 99


@pytest.mark.asyncio
async def test_persist_results_resolves_foreign_key_to_table_later_in_scan_order(
    service,
):
    # accounts.user_id -> users: scanners return tables alphabetically, so
    # the referenced table is created after the table holding the FK.
    scanned_constraint = MagicMock()
    scanned_constraint.constraint_name = "fk_accounts_user"
    scanned_constraint.constraint_type = "FOREIGN KEY"
    scanned_constraint.references_table = "users"
    scanned_constraint.references_schema = "public"
    scanned_constraint.on_delete = None
    scanned_constraint.on_update = None
    scanned_constraint.check_expression = None
    scanned_constraint.column_names = []

    scanned_accounts = MagicMock()
    scanned_accounts.name = "accounts"
    scanned_accounts.schema_name = "public"
    scanned_accounts.columns = []
    scanned_accounts.constraints = [scanned_constraint]

    scanned_users = MagicMock()
    scanned_users.name = "users"
    scanned_users.schema_name = "public"
    scanned_users.columns = []
    scanned_users.constraints = []

    scan_result = MagicMock(spec=ScannedDatabase)
    scan_result.tables = [scanned_accounts, scanned_users]

    fake_accounts_table = MagicMock()
    fake_accounts_table.id = 10

    fake_users_table = MagicMock()
    fake_users_table.id = 11

    fake_constraint = MagicMock()
    fake_constraint.id = 30

    service.table_repo.create_table = AsyncMock(side_effect=[fake_accounts_table, fake_users_table])

    service.constraint_repo.create_constraint = AsyncMock(return_value=fake_constraint)

    await service._persist_results(42, scan_result)

    # Both tables exist before the first constraint is created
    assert service.table_repo.create_table.await_count == 2

    constraint_data = service.constraint_repo.create_constraint.call_args.kwargs["data"]

    assert constraint_data.references_table_id == 11


@pytest.mark.asyncio
async def test_persist_results_resolves_foreign_key_by_schema_and_table_name(
    service,
):
    # Two tables named "users" in different schemas — the FK must resolve
    # to the one in the schema it references, not just any "users".
    scanned_billing_users = MagicMock()
    scanned_billing_users.name = "users"
    scanned_billing_users.schema_name = "billing"
    scanned_billing_users.columns = []
    scanned_billing_users.constraints = []

    scanned_constraint = MagicMock()
    scanned_constraint.constraint_name = "fk_orders_user"
    scanned_constraint.constraint_type = "FOREIGN KEY"
    scanned_constraint.references_table = "users"
    scanned_constraint.references_schema = "billing"
    scanned_constraint.on_delete = None
    scanned_constraint.on_update = None
    scanned_constraint.check_expression = None
    scanned_constraint.column_names = []

    scanned_orders = MagicMock()
    scanned_orders.name = "orders"
    scanned_orders.schema_name = "public"
    scanned_orders.columns = []
    scanned_orders.constraints = [scanned_constraint]

    scanned_public_users = MagicMock()
    scanned_public_users.name = "users"
    scanned_public_users.schema_name = "public"
    scanned_public_users.columns = []
    scanned_public_users.constraints = []

    scan_result = MagicMock(spec=ScannedDatabase)
    scan_result.tables = [scanned_billing_users, scanned_orders, scanned_public_users]

    fake_billing_users_table = MagicMock()
    fake_billing_users_table.id = 10

    fake_orders_table = MagicMock()
    fake_orders_table.id = 11

    fake_public_users_table = MagicMock()
    fake_public_users_table.id = 12

    fake_constraint = MagicMock()
    fake_constraint.id = 30

    service.table_repo.create_table = AsyncMock(
        side_effect=[fake_billing_users_table, fake_orders_table, fake_public_users_table]
    )

    service.constraint_repo.create_constraint = AsyncMock(return_value=fake_constraint)

    await service._persist_results(42, scan_result)

    constraint_data = service.constraint_repo.create_constraint.call_args.kwargs["data"]

    assert constraint_data.references_table_id == 10


@pytest.mark.asyncio
async def test_persist_results_foreign_key_without_schema_uses_own_schema(
    service,
):
    scanned_constraint = MagicMock()
    scanned_constraint.constraint_name = "fk_orders_user"
    scanned_constraint.constraint_type = "FOREIGN KEY"
    scanned_constraint.references_table = "users"
    scanned_constraint.references_schema = None
    scanned_constraint.on_delete = None
    scanned_constraint.on_update = None
    scanned_constraint.check_expression = None
    scanned_constraint.column_names = []

    scanned_orders = MagicMock()
    scanned_orders.name = "orders"
    scanned_orders.schema_name = "shop"
    scanned_orders.columns = []
    scanned_orders.constraints = [scanned_constraint]

    scanned_users = MagicMock()
    scanned_users.name = "users"
    scanned_users.schema_name = "shop"
    scanned_users.columns = []
    scanned_users.constraints = []

    scan_result = MagicMock(spec=ScannedDatabase)
    scan_result.tables = [scanned_orders, scanned_users]

    fake_orders_table = MagicMock()
    fake_orders_table.id = 10

    fake_users_table = MagicMock()
    fake_users_table.id = 11

    fake_constraint = MagicMock()
    fake_constraint.id = 30

    service.table_repo.create_table = AsyncMock(side_effect=[fake_orders_table, fake_users_table])

    service.constraint_repo.create_constraint = AsyncMock(return_value=fake_constraint)

    await service._persist_results(42, scan_result)

    constraint_data = service.constraint_repo.create_constraint.call_args.kwargs["data"]

    assert constraint_data.references_table_id == 11


@pytest.mark.asyncio
async def test_persist_results_handles_missing_referenced_table(
    service,
):
    scanned_constraint = MagicMock()
    scanned_constraint.constraint_name = "fk_user"
    scanned_constraint.constraint_type = "FOREIGN KEY"
    scanned_constraint.references_table = "users"
    scanned_constraint.references_schema = "public"
    scanned_constraint.on_delete = None
    scanned_constraint.on_update = None
    scanned_constraint.check_expression = None
    scanned_constraint.column_names = []

    scanned_table = MagicMock()
    scanned_table.name = "orders"
    scanned_table.schema_name = "public"
    scanned_table.columns = []
    scanned_table.constraints = [scanned_constraint]

    scan_result = MagicMock(spec=ScannedDatabase)
    scan_result.tables = [scanned_table]

    fake_table = MagicMock()
    fake_table.id = 10

    fake_constraint = MagicMock()
    fake_constraint.id = 30

    service.table_repo.create_table = AsyncMock(return_value=fake_table)

    service.constraint_repo.create_constraint = AsyncMock(return_value=fake_constraint)

    await service._persist_results(42, scan_result)

    constraint_data = service.constraint_repo.create_constraint.call_args.kwargs["data"]

    assert constraint_data.references_table_id is None


@pytest.mark.asyncio
async def test_persist_results_ignores_unknown_constraint_column(
    service,
):
    scanned_constraint = MagicMock()
    scanned_constraint.constraint_name = "pk_users"
    scanned_constraint.constraint_type = "PRIMARY KEY"
    scanned_constraint.references_table = None
    scanned_constraint.on_delete = None
    scanned_constraint.on_update = None
    scanned_constraint.check_expression = None
    scanned_constraint.column_names = ["does_not_exist"]

    scanned_table = MagicMock()
    scanned_table.name = "users"
    scanned_table.schema_name = "public"
    scanned_table.columns = []
    scanned_table.constraints = [scanned_constraint]

    scan_result = MagicMock(spec=ScannedDatabase)
    scan_result.tables = [scanned_table]

    fake_table = MagicMock()
    fake_table.id = 10

    fake_constraint = MagicMock()
    fake_constraint.id = 30

    service.table_repo.create_table = AsyncMock(return_value=fake_table)

    service.constraint_repo.create_constraint = AsyncMock(return_value=fake_constraint)

    service.constraint_repo.create_column_constraint = AsyncMock()

    await service._persist_results(42, scan_result)

    service.constraint_repo.create_column_constraint.assert_not_awaited()


# _remove_orphaned_relations


def _scanned_table(schema_name: str, name: str, column_names: list[str]) -> MagicMock:
    table = MagicMock()
    table.schema_name = schema_name
    table.name = name
    table.columns = []
    for column_name in column_names:
        column = MagicMock()
        column.name = column_name
        table.columns.append(column)
    return table


def _stored_relation(relation_id: int, table_name_1: str, column_name_1: str, table_name_2: str, column_name_2: str):
    relation = MagicMock()
    relation.id = relation_id
    relation.schema_name = "public"
    relation.table_name_1 = table_name_1
    relation.column_name_1 = column_name_1
    relation.table_name_2 = table_name_2
    relation.column_name_2 = column_name_2
    return relation


@pytest.mark.asyncio
async def test_remove_orphaned_relations_deletes_relations_with_missing_columns(service):
    scan_result = MagicMock(spec=ScannedDatabase)
    scan_result.tables = [
        _scanned_table("public", "users", ["id", "email"]),
        _scanned_table("public", "orders", ["id", "user_id"]),
    ]

    valid = _stored_relation(1, "users", "id", "orders", "user_id")
    missing_column = _stored_relation(2, "users", "id", "orders", "buyer_id")
    missing_table = _stored_relation(3, "invoices", "user_id", "users", "id")

    service.column_relation_repo.get_database_column_relations = AsyncMock(
        return_value=[valid, missing_column, missing_table]
    )
    service.column_relation_repo.delete_column_relations = AsyncMock()

    await service._remove_orphaned_relations(42, scan_result)

    service.column_relation_repo.get_database_column_relations.assert_awaited_once_with(42)
    service.column_relation_repo.delete_column_relations.assert_awaited_once_with(42, [2, 3])


@pytest.mark.asyncio
async def test_remove_orphaned_relations_matches_schema(service):
    # the relation's columns exist, but only in another schema
    scan_result = MagicMock(spec=ScannedDatabase)
    scan_result.tables = [
        _scanned_table("billing", "users", ["id"]),
        _scanned_table("billing", "orders", ["user_id"]),
    ]

    relation = _stored_relation(1, "users", "id", "orders", "user_id")

    service.column_relation_repo.get_database_column_relations = AsyncMock(return_value=[relation])
    service.column_relation_repo.delete_column_relations = AsyncMock()

    await service._remove_orphaned_relations(42, scan_result)

    service.column_relation_repo.delete_column_relations.assert_awaited_once_with(42, [1])


@pytest.mark.asyncio
async def test_remove_orphaned_relations_skips_delete_when_nothing_is_orphaned(service):
    scan_result = MagicMock(spec=ScannedDatabase)
    scan_result.tables = [
        _scanned_table("public", "users", ["id"]),
        _scanned_table("public", "orders", ["user_id"]),
    ]

    service.column_relation_repo.get_database_column_relations = AsyncMock(
        return_value=[_stored_relation(1, "users", "id", "orders", "user_id")]
    )
    service.column_relation_repo.delete_column_relations = AsyncMock()

    await service._remove_orphaned_relations(42, scan_result)

    service.column_relation_repo.delete_column_relations.assert_not_awaited()


# _update_status


@pytest.mark.asyncio
async def test_update_status_updates_database_and_commits(service):
    service.db_repo.update = AsyncMock()

    await service._update_status(
        42,
        DBStatus.READY,
    )

    service.db_repo.update.assert_awaited_once()

    update_data = service.db_repo.update.call_args.args[1]

    assert update_data.status == DBStatus.READY

    service.db.commit.assert_awaited_once()


# execute_scan


@pytest.mark.asyncio
async def test_execute_scan_success(
    service,
    database_details,
):
    fake_database = MagicMock()
    fake_database.id = 42

    fake_scan_result = MagicMock(spec=ScannedDatabase)
    fake_response = MagicMock(spec=DatabaseResponse)

    service._prepare_url = MagicMock(return_value="prepared-url")

    service._initialize_scan = AsyncMock(return_value=fake_database)

    service._run_scanner = AsyncMock(return_value=fake_scan_result)

    service._clear_existing_data = AsyncMock()
    service._persist_results = AsyncMock()

    # record the order of the flush-only steps relative to the commit
    call_order = []
    service._remove_orphaned_relations = AsyncMock(side_effect=lambda *args: call_order.append("cleanup"))
    service.db.commit = AsyncMock(side_effect=lambda: call_order.append("commit"))

    service._update_status = AsyncMock()

    service.db_repo.get_one_database = AsyncMock(return_value=fake_response)

    result = await service.execute_scan(database_details)

    service._prepare_url.assert_called_once_with(database_details)

    service._initialize_scan.assert_awaited_once_with(database_details)

    service._run_scanner.assert_awaited_once_with(
        database_details.db_type,
        "prepared-url",
    )

    service._clear_existing_data.assert_awaited_once_with(42)

    service._persist_results.assert_awaited_once_with(
        42,
        fake_scan_result,
    )

    service._remove_orphaned_relations.assert_awaited_once_with(42, fake_scan_result)

    service.db.commit.assert_awaited_once()

    # cleanup is part of the scan transaction, not a separate commit
    assert call_order == ["cleanup", "commit"]

    service._update_status.assert_awaited_once_with(
        42,
        DBStatus.READY,
    )

    service.db_repo.get_one_database.assert_awaited_once_with(42)

    assert result == fake_response


@pytest.mark.asyncio
async def test_execute_scan_handles_scanning_system_error(
    service,
    database_details,
):
    fake_database = MagicMock()
    fake_database.id = 42

    scanning_error = ScannerConnectionError(
        message="Connection failed",
        status_code=503,
    )

    service._prepare_url = MagicMock(return_value="prepared-url")

    service._initialize_scan = AsyncMock(return_value=fake_database)

    service._run_scanner = AsyncMock(side_effect=scanning_error)

    service._update_status = AsyncMock()

    with pytest.raises(ScannerConnectionError):
        await service.execute_scan(database_details)

    service.db.rollback.assert_awaited_once()

    service._update_status.assert_awaited_once_with(
        42,
        DBStatus.ERROR,
    )


@pytest.mark.asyncio
async def test_execute_scan_does_not_clear_existing_data_if_scanner_fails(
    service,
    database_details,
):
    fake_database = MagicMock()
    fake_database.id = 42

    service._initialize_scan = AsyncMock(return_value=fake_database)

    service._run_scanner = AsyncMock(
        side_effect=ScannerConnectionError(
            message="Connection failed",
            status_code=503,
        )
    )

    service._clear_existing_data = AsyncMock()
    service._persist_results = AsyncMock()
    service._remove_orphaned_relations = AsyncMock()
    service._update_status = AsyncMock()

    with pytest.raises(ScannerConnectionError):
        await service.execute_scan(database_details)

    service._clear_existing_data.assert_not_awaited()
    service._persist_results.assert_not_awaited()
    service._remove_orphaned_relations.assert_not_awaited()


@pytest.mark.asyncio
async def test_execute_scan_does_not_persist_when_clear_fails(
    service,
    database_details,
):
    fake_database = MagicMock()
    fake_database.id = 42

    fake_scan_result = MagicMock(spec=ScannedDatabase)

    service._initialize_scan = AsyncMock(return_value=fake_database)

    service._run_scanner = AsyncMock(return_value=fake_scan_result)

    service._clear_existing_data = AsyncMock(side_effect=RuntimeError("Clear failed"))

    service._persist_results = AsyncMock()

    with pytest.raises(RuntimeError):
        await service.execute_scan(database_details)

    service._persist_results.assert_not_awaited()


@pytest.mark.asyncio
async def test_execute_scan_wraps_encryption_error(
    service,
    database_details,
):
    service._prepare_url = MagicMock(return_value="prepared-url")
    service._initialize_scan = AsyncMock(
        side_effect=EncryptionKeyError(message="ENCRYPTION_KEY is not set", status_code=500)
    )
    service._run_scan = AsyncMock()

    with pytest.raises(ScanningSystemError) as error:
        await service.execute_scan(database_details)

    assert error.value.status_code == 500
    service._run_scan.assert_not_awaited()


# execute_rescan


@pytest.fixture
def stored_database():
    database = MagicMock()
    database.id = 42
    database.name = "Test Database"
    database.db_type = DBType.POSTGRESQL
    database.host = "localhost"
    database.port = 5432
    database.db_name = "test_db"
    database.username = "postgres"
    database.password = "encrypted-secret"
    return database


@pytest.mark.asyncio
@patch("table_trail_backend.services.scanner_service.decrypt", return_value="secret")
async def test_execute_rescan_success(
    decrypt_mock,
    service,
    stored_database,
):
    fake_response = MagicMock(spec=DatabaseResponse)

    service.db_repo.get_one_database = AsyncMock(return_value=stored_database)
    service._update_status = AsyncMock()
    service._run_scan = AsyncMock(return_value=fake_response)

    result = await service.execute_rescan(42)

    service.db_repo.get_one_database.assert_awaited_once_with(42)
    decrypt_mock.assert_called_once_with("encrypted-secret")
    service._update_status.assert_awaited_once_with(42, DBStatus.SCANNING)
    db_id, db_type, prepared_url = service._run_scan.await_args.args
    assert (db_id, db_type) == (42, DBType.POSTGRESQL)
    assert prepared_url.render_as_string(hide_password=False) == (
        "postgresql+psycopg2://postgres:secret@host.docker.internal:5432/test_db"
    )

    assert result == fake_response


@pytest.mark.asyncio
async def test_execute_rescan_database_not_found(service):
    service.db_repo.get_one_database = AsyncMock(return_value=None)
    service._update_status = AsyncMock()
    service._run_scan = AsyncMock()

    with pytest.raises(ScannerDatabaseNotFoundError) as error:
        await service.execute_rescan(42)

    assert error.value.status_code == 404
    service._update_status.assert_not_awaited()
    service._run_scan.assert_not_awaited()


@pytest.mark.asyncio
@patch(
    "table_trail_backend.services.scanner_service.decrypt",
    side_effect=EncryptionError(message="Stored value could not be decrypted", status_code=500),
)
async def test_execute_rescan_wraps_decryption_error(
    decrypt_mock,
    service,
    stored_database,
):
    service.db_repo.get_one_database = AsyncMock(return_value=stored_database)
    service._update_status = AsyncMock()
    service._run_scan = AsyncMock()

    with pytest.raises(ScanningSystemError) as error:
        await service.execute_rescan(42)

    assert error.value.status_code == 500
    service._update_status.assert_not_awaited()
    service._run_scan.assert_not_awaited()
