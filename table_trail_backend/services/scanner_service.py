from sqlalchemy.ext.asyncio import AsyncSession
from table_trail_backend.core.enums import DBType, DBStatus
from table_trail_backend.core.exceptions import (
    ScannerConnectionError,
    ScannerUnsupportedDBError,
    ScannerDataError,
    ScanningSystemError
)
from table_trail_backend.db.models.databases import Databases
from table_trail_backend.db_scanner.base_scanner import ScannedDatabase
from table_trail_backend.db_scanner.postgres_scanner import PostgresScanner
from table_trail_backend.db_scanner.mysql_scanner import MySQLScanner
from table_trail_backend.db_scanner.mariadb_scanner import MariaDBScanner
from table_trail_backend.repositories.database_repository import DatabasesRepository
from table_trail_backend.repositories.table_repository import TableRepository
from table_trail_backend.repositories.column_repository import ColumnRepository
from table_trail_backend.repositories.constraint_repository import ConstraintsRepository
from table_trail_backend.schemas.database_schema import CreateDatabase, UpdateDatabase
from table_trail_backend.schemas.column_schema import CreateColumn
from table_trail_backend.schemas.constraint_schema import CreateConstraint


class ScanService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.db_repo = DatabasesRepository(db)
        self.table_repo = TableRepository(db)
        self.column_repo = ColumnRepository(db)
        self.constraint_repo = ConstraintsRepository(db)


    # Public Entry Point

    async def execute_scan(self, database_details: CreateDatabase) -> dict:

        prepared_url = self._prepare_url(database_details)

        # Initialize — sets status to SCANNING, commits immediately
        database = await self._initialize_scan(database_details)

        try:
            # 1. Run scanner first — if this fails, existing data is untouched
            scan_result = await self._run_scanner(database_details.db_type, prepared_url)

            # 2. Clear existing data for this database (flush only)
            await self._clear_existing_data(database.id)

            # 3. Persist new scan results (flush only)
            await self._persist_results(database.id, scan_result)

            # 4. Single commit — all or nothing
            await self.db.commit()

            # 5. Mark as READY
            await self._update_status(database.id, DBStatus.READY)

            return {"message": "Scan completed successfully", "database_id": database.id}

        except ScanningSystemError:
            await self.db.rollback()
            await self._update_status(database.id, DBStatus.ERROR)
            raise


    # Private Workflow Steps

    async def _initialize_scan(self, database_details: CreateDatabase) -> Databases:
        database = await self.db_repo.create(CreateDatabase(
            name=database_details.name,
            db_type=database_details.db_type,
            host=database_details.host,
            port=database_details.port,
            db_name=database_details.db_name,
            username=database_details.username,
            password=database_details.password,
            status=DBStatus.SCANNING
        ))
        await self.db.commit()
        return database

    async def _run_scanner(self, db_type: DBType, prepared_url: str) -> ScannedDatabase:
        scanner = self._get_scanner(db_type)
        try:
            return scanner.scan(prepared_url)
        except ConnectionError as e:
            raise ScannerConnectionError(f"Could not connect to database: {str(e)}")
        except Exception as e:
            raise ScannerDataError(f"Scanner failed while reading database structure: {str(e)}")

    async def _clear_existing_data(self, db_id: int) -> None:
        tables = await self.table_repo.get_database_tables(db_id)
        for table in tables:
            await self.db.delete(table)
        await self.db.flush()

    async def _persist_results(self, db_id: int, scan_result: ScannedDatabase) -> None:
        for scanned_table in scan_result.tables:

            # Create table
            table = await self.table_repo.create_table(
                db_id=db_id,
                name=scanned_table.name,
                schema_name=scanned_table.schema_name
            )

            # Create columns keep reference by name for constraint mapping
            column_name_to_id: dict[str, int] = {}
            for scanned_column in scanned_table.columns:
                column = await self.column_repo.create_column(
                    table_id=table.id,
                    data=CreateColumn(
                        name=scanned_column.name,
                        data_type=scanned_column.data_type,
                        is_nullable=scanned_column.is_nullable,
                        default_value=scanned_column.default_value,
                        ordinal_position=scanned_column.ordinal_position
                    )
                )
                column_name_to_id[scanned_column.name] = column.id

            # Create constraints + constraint_columns
            for scanned_constraint in scanned_table.constraints:

                # Resolve references_table_id if FK
                references_table_id = None
                if scanned_constraint.references_table:
                    referenced_table = await self.table_repo.get_table_by_name(
                        db_id=db_id,
                        table_name=scanned_constraint.references_table
                    )
                    if referenced_table:
                        references_table_id = referenced_table.id

                constraint = await self.constraint_repo.create_constraint(
                    table_id=table.id,
                    data=CreateConstraint(
                        constraint_name=scanned_constraint.constraint_name,
                        constraint_type=scanned_constraint.constraint_type,
                        references_table_id=references_table_id,
                        on_delete=scanned_constraint.on_delete,
                        on_update=scanned_constraint.on_update,
                        check_expression=scanned_constraint.check_expression
                    )
                )

                # Create junction entries for each column in this constraint
                for col_name in scanned_constraint.column_names:
                    col_id = column_name_to_id.get(col_name)
                    if col_id:
                        await self.constraint_repo.create_column_constraint(
                            column_id=col_id,
                            constraint_id=constraint.id
                        )

    async def _update_status(self, db_id: int, status: DBStatus) -> None:
        await self.db_repo.update(db_id, UpdateDatabase(status=status))
        await self.db.commit()



    # Helper Methods

    def _prepare_url(self, database_details: CreateDatabase) -> str:
        host = database_details.host
        if host in ("localhost", "127.0.0.1"):
            host = "host.docker.internal"

        driver_map = {
            DBType.POSTGRESQL: "postgresql+psycopg2",
            DBType.MYSQL: "mysql+pymysql",
            DBType.MARIADB: "mariadb+pymysql",
        }

        driver = driver_map[database_details.db_type]

        return f"{driver}://{database_details.username}:{database_details.password}@{host}:{database_details.port}/{database_details.db_name}"

    def _get_scanner(self, db_type: DBType):
        scanner_map = {
            DBType.POSTGRESQL: PostgresScanner,
            DBType.MYSQL: MySQLScanner,
            DBType.MARIADB: MariaDBScanner,
        }
        if db_type not in scanner_map:
            raise ScannerUnsupportedDBError(f"Unsupported database type: {db_type}")
        return scanner_map[db_type]()