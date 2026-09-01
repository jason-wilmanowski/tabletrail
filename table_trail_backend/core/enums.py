from enum import Enum


class DBType(Enum):
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MARIADB = "mariadb"


class DBStatus(Enum):
    SCANNING = "scanning"
    READY = "ready"
    ERROR = "error"


class ExportType(Enum):
    JSON = "json"
    PDF = "pdf"
    MARKDOWN = "markdown"


class ColumnRelationType(Enum):
    GREEN = "green"
    RED = "red"
    YELLOW = "yellow"
    BLUE = "blue"
    MAGENTA = "magenta"
    WHITE = "white"
