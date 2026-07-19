from enum import Enum


class DBType(Enum):
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MARIADB = "mariadb"


class DBStatus(Enum):
    SCANNING = "scanning"
    READY = "ready"
    ERROR = "error"